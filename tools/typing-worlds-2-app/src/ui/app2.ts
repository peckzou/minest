/**
 * 3D Type 2.0 — app controller.
 *
 * Same data flow as 1.0 (TextInputEngine ⇄ Layout ⇄ world ⇄ VocabStore, all imported unchanged
 * from tools/typing-worlds-app), with the 2.0 renderer, a Director per world and a new HUD:
 * world dock, theme swatches, drag-to-orbit camera, demo tour, snapshot.
 */
import * as THREE from 'three';
import { TextInputEngine } from '@v1/engine/text-input';
import { Layout, DEFAULT_LAYOUT } from '@v1/engine/layout';
import { glyphEngine } from '@v1/engine/glyphs/glyph-engine';
import { TempoTracker } from '@v1/engine/tempo';
import { AudioEngine } from '@v1/engine/audio';
import { LocalVocabStore, type VocabStore } from '@v1/engine/vocab';
import { WORLDS, SERIES, getWorld } from '@v1/engine/registry';
import type { WorldRenderer } from '@v1/engine/renderer';
import type { InsertEvent, DeleteEvent, LetterRef, WorldContext, WorldInstance, WorldDefinition, Quality, SaveOutcome } from '@v1/engine/types';
import { copyText } from '@v1/ui/wordlist';
import { Renderer2 } from '../engine/renderer2';
import { Director } from '../stage/director';
import { STAGES, FALLBACK_STAGE } from '../stage/specs';

interface Prefs2 {
  world: string;
  themes: Record<string, string>;
  quality: Quality | null;
  sound: boolean;
  camera: boolean;
  reducedMotion: boolean;
  dock: boolean;
}

const PREF_KEY = 'tw2.prefs.v1';
const DEMO_WORDS = ['wonder', 'aurora', 'minest', 'galaxy', 'spark', 'ocean', 'dream', 'bloom', 'magic', 'story'];

function loadPrefs(): Prefs2 {
  const def: Prefs2 = { world: 'invisible-ink', themes: {}, quality: null, sound: true, camera: true, reducedMotion: false, dock: true };
  try {
    return { ...def, ...JSON.parse(localStorage.getItem(PREF_KEY) || '{}') };
  } catch {
    return def;
  }
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
const ICON = {
  list: '<svg viewBox="0 0 24 24"><path d="M5 5h14M5 12h14M5 19h9"/></svg>',
  play: '<svg viewBox="0 0 24 24"><path d="M8 5l11 7-11 7z"/></svg>',
  stop: '<svg viewBox="0 0 24 24"><path d="M7 7h10v10H7z"/></svg>',
  cam: '<svg viewBox="0 0 24 24"><path d="M3 8h12v9H3zM15 11l6-3v9l-6-3"/></svg>',
  sound: '<svg viewBox="0 0 24 24"><path d="M4 10v4h4l5 4V6L8 10zM16.5 9a4 4 0 010 6M19 6.5a8 8 0 010 11"/></svg>',
  mute: '<svg viewBox="0 0 24 24"><path d="M4 10v4h4l5 4V6L8 10zM17 9.5l4 5M21 9.5l-4 5"/></svg>',
  shot: '<svg viewBox="0 0 24 24"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13.5" r="3.4"/></svg>',
  wave: '<svg viewBox="0 0 24 24"><path d="M3 12h2l2-6 4 12 3-9 2 5 2-2h3"/></svg>',
  grid: '<svg viewBox="0 0 24 24"><path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z"/></svg>',
};

export class TypingWorlds2 {
  private prefs = loadPrefs();
  private renderer!: Renderer2;
  private textEngine!: TextInputEngine;
  private layout!: Layout;
  private tempo = new TempoTracker();
  private audio = new AudioEngine();
  private vocab: VocabStore = new LocalVocabStore();
  private def: WorldDefinition = getWorld('invisible-ink')!;
  private instance: WorldInstance | null = null;
  private director: Director | null = null;
  private theme = '';
  private timers = new Set<number>();
  private switching = 0;
  private demo = false;
  private demoTimer = 0;
  private demoIndex = 0;
  private fadeRaf = 0;
  private viewShift = 0;

  private $!: <T extends HTMLElement = HTMLElement>(sel: string) => T;

  constructor(private root: HTMLElement) {
    this.build();
  }

  /* ------------------------------------------------------------ DOM */

  private build() {
    this.root.innerHTML = `
      <div class="t2">
        <div class="t2-stage"></div>
        <div class="t2-veil"></div>

        <header class="t2-top">
          <div class="t2-id">
            <a class="t2-back" href="../type3d/index.html" title="回到 3D Type 1.0">3D TYPE <i>2.0</i></a>
            <div class="t2-title">
              <button class="t2-arrow" data-nav="-1" aria-label="上一个世界">‹</button>
              <div class="t2-name">
                <span class="t2-num"></span>
                <b class="t2-zh"></b>
                <em class="t2-en"></em>
              </div>
              <button class="t2-arrow" data-nav="1" aria-label="下一个世界">›</button>
            </div>
            <p class="t2-mech"></p>
          </div>
          <nav class="t2-tools">
            <button class="t2-tool" data-act="keyflow" title="Keyflow 律动词坊">${ICON.wave}<span>Keyflow</span></button>
            <button class="t2-tool" data-act="words" title="词表">${ICON.list}<span>词表</span><i class="t2-count">0</i></button>
            <button class="t2-tool" data-act="demo" title="自动演示：逐个世界打字">${ICON.play}<span>演示</span></button>
            <button class="t2-tool" data-act="camera" title="镜头运动">${ICON.cam}<span>镜头</span></button>
            <button class="t2-tool" data-act="sound" title="音效">${ICON.sound}<span>声音</span></button>
            <button class="t2-tool" data-act="shot" title="保存当前画面">${ICON.shot}<span>截图</span></button>
            <button class="t2-tool" data-act="quality" title="画质"><b class="t2-q">中</b><span>画质</span></button>
          </nav>
        </header>

        <div class="t2-themes" role="tablist" aria-label="主题"></div>

        <div class="t2-card" aria-hidden="true"><span></span><b></b><em></em><p></p></div>
        <div class="t2-final" aria-live="polite"><b></b><span></span></div>
        <div class="t2-toast" aria-hidden="true"></div>
        <div class="t2-hint">拖动画面转动视角 · 滚轮或双指缩放 · 双击复位</div>

        <footer class="t2-bottom">
          <div class="t2-composer">
            <input type="text" class="t2-input" placeholder="在这里输入单词，回车收录" autocapitalize="off" autocomplete="off" spellcheck="false" />
            <button class="t2-submit" title="完成并收录 (Enter)">↵</button>
          </div>
          <div class="t2-dockbar">
            <button class="t2-docktoggle" aria-expanded="true">${ICON.grid}<span>23 个世界</span></button>
            <div class="t2-series"></div>
          </div>
          <div class="t2-dock" role="listbox" aria-label="世界"></div>
        </footer>

        <aside class="t2-panel" hidden>
          <header><b>词表</b><span class="t2-panel-n"></span><button data-act="copy">复制全部</button><button data-act="close-words" aria-label="关闭">✕</button></header>
          <ul></ul>
        </aside>
      </div>`;
    const app = this.root.querySelector('.t2') as HTMLElement;
    this.$ = <T extends HTMLElement>(sel: string) => this.root.querySelector(sel) as T;

    const stage = this.$('.t2-stage');
    const askedQ = Number(new URLSearchParams(location.search).get('q') ?? NaN);
    const q: Quality = (askedQ === 0 || askedQ === 1 || askedQ === 2 ? askedQ : this.prefs.quality ?? 1) as Quality;
    this.renderer = new Renderer2(stage, q);
    this.renderer.onQualityDrop = (nq) => {
      this.prefs.quality = nq;
      this.save();
      this.syncTools();
      this.toast(nq === 0 ? '已切换到性能画质' : '已切换到中画质');
    };
    this.layout = new Layout(glyphEngine);
    this.textEngine = new TextInputEngine(this.$<HTMLInputElement>('.t2-input'));
    this.audio.setEnabled(this.prefs.sound);
    this.tempo.reducedMotion = this.prefs.reducedMotion || matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.renderer.director = (dt, time) => (this.director ? this.director.update(dt, time) : false);

    this.buildDock();
    this.bind(app, stage);
    addEventListener('resize', () => this.measure());
    this.syncTools();
    this.updateCount();

    let asked: string | null = null;
    let demo = false;
    try {
      const p = new URLSearchParams(location.search);
      asked = p.get('world');
      demo = p.get('demo') === '1';
      const th = p.get('theme');
      if (asked && th) this.prefs.themes[asked] = th;
    } catch {
      /* noop */
    }
    if (new URLSearchParams(location.search).get('hud') === '0') app.classList.add('no-hud');
    const first = (asked && getWorld(asked) ? asked : null) || (getWorld(this.prefs.world) ? this.prefs.world : 'invisible-ink');
    void this.switchWorld(first, true).then(() => {
      if (demo) this.setDemo(true);
    });
  }

  private buildDock() {
    const dock = this.$('.t2-dock');
    dock.innerHTML = WORLDS.map(
      (w) => `<button class="t2-world" role="option" data-world="${w.id}" data-series="${w.series}" title="${esc(w.mechanism)}">
        <span class="t2-poster" style="background:url(${import.meta.env.BASE_URL}thumbs/${w.id}.jpg) center/cover, ${w.poster}"><i>${String(w.number).padStart(2, '0')}</i></span>
        <b>${esc(w.nameZh)}</b><em>${esc(w.name)}</em>
      </button>`,
    ).join('');
    const series = this.$('.t2-series');
    series.innerHTML = `<button data-series="" class="on">全部</button>` + SERIES.filter((s) => WORLDS.some((w) => w.series === s.id)).map((s) => `<button data-series="${s.id}">${s.label}</button>`).join('');
  }

  private bind(app: HTMLElement, stage: HTMLElement) {
    app.addEventListener('click', (e) => {
      const t = e.target as HTMLElement;
      const nav = t.closest<HTMLElement>('[data-nav]');
      if (nav) return void this.step(Number(nav.dataset.nav));
      const world = t.closest<HTMLElement>('[data-world]');
      if (world) {
        this.setDemo(false);
        return void this.switchWorld(world.dataset.world!);
      }
      const ser = t.closest<HTMLElement>('.t2-series [data-series]');
      if (ser) return this.filterSeries(ser.dataset.series || '');
      const th = t.closest<HTMLElement>('[data-theme]');
      if (th) return this.setTheme(th.dataset.theme!);
      const del = t.closest<HTMLElement>('[data-del]');
      if (del) {
        this.vocab.remove(del.dataset.del!);
        this.updateCount();
        return this.renderWords();
      }
      const act = t.closest<HTMLElement>('[data-act]')?.dataset.act;
      if (act) this.act(act);
    });

    this.$('.t2-docktoggle').addEventListener('click', () => {
      this.prefs.dock = !this.prefs.dock;
      this.save();
      this.syncTools();
    });
    this.$('.t2-submit').addEventListener('click', () => this.textEngine.submit());

    this.textEngine.onChange((c) => this.onText(c));
    this.textEngine.onSubmit((w) => void this.onSubmit(w));

    // stage: hover parallax, drag to orbit, wheel / pinch to zoom, double click to reset
    const pts = new Map<number, { x: number; y: number }>();
    let moved = 0;
    let pinch = 0;
    stage.addEventListener('pointerdown', (e) => {
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      moved = 0;
      pinch = 0;
      this.audio.unlock();
      if (this.demo) this.setDemo(false);
    });
    stage.addEventListener('pointermove', (e) => {
      const r = stage.getBoundingClientRect();
      const p = pts.get(e.pointerId);
      if (p && e.pointerType === 'mouse' && e.buttons === 0) return up(e); // released where no pointerup reached us
      if (!p) {
        if (e.pointerType === 'mouse') this.director?.pointer(((e.clientX - r.left) / r.width) * 2 - 1, ((e.clientY - r.top) / r.height) * 2 - 1);
        this.renderer.wake();
        return;
      }
      const dx = e.clientX - p.x;
      const dy = e.clientY - p.y;
      p.x = e.clientX;
      p.y = e.clientY;
      if (pts.size >= 2) {
        const [a, b] = [...pts.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinch > 0 && d > 0) this.director?.zoomBy(pinch / d);
        pinch = d;
        moved = 99;
      } else {
        moved += Math.abs(dx) + Math.abs(dy);
        if (moved > 6) {
          this.director?.drag((-dx / r.width) * 70, (dy / r.height) * 40);
          stage.classList.add('is-drag');
        }
      }
      this.renderer.keepAlive(400);
    });
    const up = (e: PointerEvent) => {
      if (!pts.delete(e.pointerId)) return;
      pinch = 0;
      if (pts.size === 0) {
        this.director?.dragEnd();
        stage.classList.remove('is-drag');
        if (moved <= 6 && (e.pointerType !== 'touch' || e.type === 'pointerup')) this.textEngine.focus();
        else this.hint(false);
      }
    };
    // on the window: a drag may end over the HUD or outside the page
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    stage.addEventListener('pointerleave', (e) => {
      if (e.pointerType === 'mouse' && !pts.size) this.director?.pointer(0, 0);
    });
    stage.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.director?.zoomBy(Math.exp(e.deltaY * 0.0012));
      this.renderer.keepAlive(600);
      this.hint(false);
    }, { passive: false });
    stage.addEventListener('dblclick', () => this.director?.resetView());

    // typing anywhere goes to the word
    document.addEventListener('keydown', (e) => {
      if (this.keyflowEl) {
        if (e.key === 'Escape') this.toggleKeyflow();
        return;
      }
      if (e.key === 'Escape') {
        this.toggleWords(false);
        this.setDemo(false);
        return;
      }
      if (e.key === 'PageDown' || e.key === 'PageUp') {
        e.preventDefault();
        return void this.step(e.key === 'PageDown' ? 1 : -1);
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (this.demo && e.key.length === 1) this.setDemo(false);
      const a = document.activeElement as HTMLElement | null;
      if (a && a !== this.textEngine.el && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)) return;
      if (e.key.length === 1 || e.key === 'Backspace') this.textEngine.focus();
    });
  }

  private act(act: string) {
    switch (act) {
      case 'keyflow':
      case 'close-keyflow':
        return this.toggleKeyflow();
      case 'words':
        return this.toggleWords();
      case 'close-words':
        return this.toggleWords(false);
      case 'copy':
        return void copyText(this.vocab.list().map((w) => w.word).join('\n')).then((ok) => this.toast(ok ? '已复制词表' : '复制失败'));
      case 'demo':
        return this.setDemo(!this.demo);
      case 'camera':
        this.prefs.camera = !this.prefs.camera;
        this.save();
        this.syncTools();
        this.toast(this.prefs.camera ? '镜头运动：开' : '镜头运动：关');
        return this.renderer.keepAlive(800);
      case 'sound': {
        this.audio.unlock();
        this.prefs.sound = !this.prefs.sound;
        this.audio.setEnabled(this.prefs.sound);
        this.save();
        return this.syncTools();
      }
      case 'shot':
        return this.snapshot();
      case 'quality': {
        const q = ((this.renderer.quality + 2) % 3) as Quality; // 中 → 性能 → 高 → 中
        this.prefs.quality = q;
        this.save();
        this.renderer.setQuality(q);
        this.syncTools();
        this.toast(`画质：${['性能', '中', '高'][q]}`);
        // motes / shafts are sized per quality: rebuild the stage
        return void this.switchWorld(this.def.id, true);
      }
    }
  }

  private syncTools() {
    const on = (act: string, v: boolean) => this.$(`[data-act="${act}"]`).classList.toggle('on', v);
    on('camera', this.prefs.camera);
    on('sound', this.prefs.sound);
    on('demo', this.demo);
    this.$('[data-act="sound"] svg').outerHTML = this.prefs.sound ? ICON.sound : ICON.mute;
    this.$('[data-act="demo"] svg').outerHTML = this.demo ? ICON.stop : ICON.play;
    this.$('.t2-q').textContent = ['低', '中', '高'][this.renderer.quality];
    this.$('.t2').classList.toggle('dock-off', !this.prefs.dock);
    this.$('.t2-docktoggle').setAttribute('aria-expanded', String(this.prefs.dock));
    this.measure();
  }

  /** the HUD covers more of the bottom than of the top: raise the picture by half the difference */
  private measure() {
    const typing = this.$('.t2').classList.contains('is-typing');
    const bottom = (typing ? this.$('.t2-composer').offsetHeight + 24 : this.$('.t2-bottom').offsetHeight - 30);
    const top = this.$('.t2-top').offsetHeight - 28;
    this.viewShift = Math.round(Math.max(0, Math.min(56, (bottom - top) / 2)));
    // the composer drops into the dock's place while typing
    const comp = this.$('.t2-composer');
    const dockH = Math.max(0, this.$('.t2-bottom').offsetHeight - (comp.offsetTop + comp.offsetHeight) - 14);
    this.$('.t2').style.setProperty('--dock-h', `${dockH}px`);
    this.renderer?.keepAlive(300);
  }

  private save() {
    try {
      localStorage.setItem(PREF_KEY, JSON.stringify(this.prefs));
    } catch {
      /* private mode */
    }
  }

  /* ------------------------------------------------------------ worlds */

  private step(d: number) {
    this.setDemo(false);
    const i = WORLDS.findIndex((w) => w.id === this.def.id);
    void this.switchWorld(WORLDS[(i + d + WORLDS.length) % WORLDS.length].id);
  }

  private filterSeries(id: string) {
    this.$('.t2-series').querySelectorAll('button').forEach((b) => b.classList.toggle('on', (b.dataset.series || '') === id));
    this.$('.t2-dock').querySelectorAll<HTMLElement>('.t2-world').forEach((b) => (b.hidden = !!id && b.dataset.series !== id));
  }

  private fadeTo(target: number, ms: number) {
    return new Promise<void>((resolve) => {
      cancelAnimationFrame(this.fadeRaf);
      const from = this.renderer.fade;
      const t0 = performance.now();
      const veil = this.$('.t2-veil');
      const tick = (now: number) => {
        const k = ms <= 0 ? 1 : Math.min(1, (now - t0) / ms);
        const v = from + (target - from) * k;
        this.renderer.fade = v;
        veil.style.opacity = String(v);
        this.renderer.keepAlive(200);
        if (k < 1) this.fadeRaf = requestAnimationFrame(tick);
        else resolve();
      };
      this.fadeRaf = requestAnimationFrame(tick);
    });
  }

  async switchWorld(id: string, instant = false) {
    const def = getWorld(id);
    if (!def) return;
    const token = ++this.switching;
    this.def = def;
    this.prefs.world = id;
    this.save();
    this.showHeader();
    this.showCard();

    if (!instant) await this.fadeTo(1, 220);
    else {
      this.renderer.fade = 1;
      this.$('.t2-veil').style.opacity = '1';
    }
    if (token !== this.switching) return;

    for (const t of this.timers) clearTimeout(t);
    this.timers.clear();
    if (this.instance) {
      try {
        this.instance.disposeWorld();
      } catch (e) {
        console.error('[3d-type-2] dispose', e);
      }
      this.instance = null;
    }
    this.director = null;
    this.renderer.setFrameHandler(null);
    this.renderer.disposeScene();

    this.theme = this.prefs.themes[def.id] || def.defaultTheme || def.themes?.[0]?.id || '';
    if (def.themes?.length && !def.themes.some((t) => t.id === this.theme)) this.theme = def.defaultTheme || def.themes[0].id;
    this.renderThemes();

    // every world starts from the default layout, as when 1.0 opens it by link
    this.layout.setOptions({ ...DEFAULT_LAYOUT, ...(def.layout ?? {}) });
    const { scene, camera } = this.renderer.mount({ bloom: def.bloom });

    try {
      const mod = await def.load!();
      if (token !== this.switching) return;
      const ctx: WorldContext = {
        THREE,
        renderer: this.renderer as unknown as WorldRenderer,
        scene,
        camera,
        glyphs: glyphEngine,
        tempo: this.tempo,
        audio: this.audio,
        layout: this.layout,
        quality: this.renderer.quality,
        reducedMotion: this.tempo.reducedMotion,
        theme: this.theme,
        letters: () => this.textEngine.refs,
        slotOf: (lid) => this.layout.get(lid),
        keepAlive: (ms) => this.renderer.keepAlive(ms),
        setTimeout: (fn, ms) => {
          const tid = window.setTimeout(fn, ms);
          this.timers.add(tid);
          return tid;
        },
        preview: false,
      };
      const instance = mod.create(ctx);
      this.instance = instance;
      this.director = new Director({
        spec: STAGES[def.id] ?? FALLBACK_STAGE,
        renderer: this.renderer,
        scene,
        layout: this.layout,
        accent: def.accent,
        theme: this.theme,
        reducedMotion: () => this.tempo.reducedMotion,
        cameraMotion: () => this.prefs.camera,
        viewShift: () => this.viewShift,
      });
      this.renderer.setFrameHandler((dt, time) => instance.updateAnimation(dt, time));

      this.layout.compute(this.textEngine.refs);
      instance.onWorldEnter?.();
      this.textEngine.refs.forEach((ref, index) => {
        instance.onCharacterInput({ ...ref, burstIndex: index, burstSize: this.textEngine.refs.length, restoring: true });
      });
      instance.onLayout?.();
      this.director.frameText(this.textEngine.refs.length);
      this.renderer.keepAlive(1600);
    } catch (e) {
      console.error(`[3d-type-2] 无法加载世界 ${id}:`, e);
      this.toast('这个世界加载失败');
    }
    if (token !== this.switching) return;
    await this.fadeTo(0, instant ? 700 : 520);
    if (matchMedia('(hover: hover) and (pointer: fine)').matches) this.textEngine.focus();
  }

  private showHeader() {
    const d = this.def;
    this.$('.t2-num').textContent = `${String(d.number).padStart(2, '0')} / ${WORLDS.length}`;
    this.$('.t2-zh').textContent = d.nameZh;
    this.$('.t2-en').textContent = d.name;
    this.$('.t2-mech').textContent = d.mechanism;
    document.title = `${d.nameZh} · 3D Type 2.0 · Minest`;
    const app = this.$('.t2');
    app.style.setProperty('--acc', this.accent());
    this.$('.t2-dock').querySelectorAll<HTMLElement>('.t2-world').forEach((b) => {
      const on = b.dataset.world === d.id;
      b.classList.toggle('on', on);
      b.setAttribute('aria-selected', String(on));
      if (on) b.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
    });
  }

  private accent() {
    const spec = STAGES[this.def.id];
    const a = spec?.themes?.[this.theme]?.accent ?? this.def.accent;
    // very dark accents (ferrofluid, quill ink) are unreadable on the dark HUD
    const c = new THREE.Color(a);
    const hsl = { h: 0, s: 0, l: 0 };
    c.getHSL(hsl);
    if (hsl.l < 0.5) c.setHSL(hsl.h, Math.min(1, hsl.s + 0.15), 0.68);
    return `#${c.getHexString()}`;
  }

  private showCard() {
    const d = this.def;
    const card = this.$('.t2-card');
    card.querySelector('span')!.textContent = `${String(d.number).padStart(2, '0')}`;
    card.querySelector('b')!.textContent = d.nameZh;
    card.querySelector('em')!.textContent = d.name;
    card.querySelector('p')!.textContent = d.mechanism;
    card.classList.remove('on');
    void card.offsetWidth;
    card.classList.add('on');
  }

  private renderThemes() {
    const box = this.$('.t2-themes');
    const themes = this.def.themes ?? [];
    box.innerHTML = themes
      .map((t) => `<button role="tab" data-theme="${t.id}" class="${t.id === this.theme ? 'on' : ''}" aria-selected="${t.id === this.theme}" title="${esc(t.label)}"><i style="background:${t.swatch}"></i><span>${esc(t.label.replace(/\s*\(.*\)\s*$/, ''))}</span></button>`)
      .join('');
    box.hidden = themes.length === 0;
  }

  private setTheme(id: string) {
    this.theme = id;
    this.prefs.themes[this.def.id] = id;
    this.save();
    this.instance?.setTheme?.(id);
    this.director?.setTheme(id);
    this.$('.t2').style.setProperty('--acc', this.accent());
    this.$('.t2-themes').querySelectorAll<HTMLElement>('button').forEach((b) => {
      b.classList.toggle('on', b.dataset.theme === id);
      b.setAttribute('aria-selected', String(b.dataset.theme === id));
    });
    this.renderer.keepAlive(1200);
  }

  /* ------------------------------------------------------------ typing */

  private onText(change: { deletes: LetterRef[]; inserts: LetterRef[]; text: string }) {
    this.audio.unlock();
    this.tempo.key();
    this.$('.t2').classList.toggle('has-text', !!change.text);
    this.setTyping(!!change.text);
    this.layout.compute(this.textEngine.refs);
    const inst = this.instance;
    if (inst) {
      change.deletes.forEach((del, i) => inst.onCharacterDelete({ ...del, burstIndex: i, burstSize: change.deletes.length } as DeleteEvent));
      change.inserts.forEach((ins, i) => inst.onCharacterInput({ ...ins, burstIndex: i, burstSize: change.inserts.length, restoring: false } as InsertEvent));
      inst.onLayout?.();
    }
    if (this.director) {
      const last = change.inserts[change.inserts.length - 1];
      if (last && last.char !== ' ') this.director.key(this.layout.get(last.id));
      this.director.frameText(this.textEngine.refs.length);
    }
    this.renderer.keepAlive(900);
  }

  private async onSubmit(word: string) {
    if (!word.trim()) return;
    this.audio.unlock();
    this.director?.finale();
    const refs = this.textEngine.takeAll();
    this.$('.t2').classList.remove('has-text');
    this.setTyping(false, 2800);
    // the demo tour shows the finale but keeps its sample words out of the word list
    const demo = this.demo;
    const saved: Promise<SaveOutcome> = demo ? Promise.resolve({ ok: true, duplicate: true }) : this.vocab.save(word, this.def.id);
    this.instance?.onWordComplete(word, refs, saved);
    this.director?.frameText(0);
    this.renderer.keepAlive(2800);
    const outcome = await saved;
    this.updateCount();
    if (!this.$('.t2-panel').hidden) this.renderWords();
    this.final(word, demo ? '自动演示 · 不收录' : outcome.ok ? (outcome.duplicate ? '词表里已经有了' : `已收录 · 词表 ${this.vocab.list().length}`) : `保存失败：${outcome.error ?? ''}`);
  }

  /** while a word is on stage (and through its finale) the dock steps aside */
  private typingTimer = 0;
  private setTyping(on: boolean, delay = 900) {
    clearTimeout(this.typingTimer);
    const apply = (v: boolean) => {
      this.$('.t2').classList.toggle('is-typing', v);
      this.measure();
    };
    if (on) apply(true);
    else this.typingTimer = window.setTimeout(() => apply(false), delay);
  }

  private final(word: string, note: string) {
    const el = this.$('.t2-final');
    el.querySelector('b')!.textContent = word;
    el.querySelector('span')!.textContent = note;
    el.classList.remove('on');
    void el.offsetWidth;
    el.classList.add('on');
  }

  /* ------------------------------------------------------------ word list */

  private updateCount() {
    this.$('.t2-count').textContent = String(this.vocab.list().length);
  }

  private toggleWords(force?: boolean) {
    const p = this.$('.t2-panel');
    const show = force ?? p.hidden;
    p.hidden = !show;
    this.$('[data-act="words"]').classList.toggle('on', show);
    if (show) this.renderWords();
    else if (matchMedia('(hover: hover)').matches) this.textEngine.focus();
  }

  private renderWords() {
    const list = this.vocab.list();
    this.$('.t2-panel-n').textContent = `${list.length} 个`;
    this.$('.t2-panel ul').innerHTML = list.length
      ? list
          .map((w) => {
            const d = getWorld(w.world);
            return `<li><b>${esc(w.word)}</b><span>${esc(d?.nameZh ?? '')}</span><button data-del="${esc(w.word)}" aria-label="删除 ${esc(w.word)}">✕</button></li>`;
          })
          .join('')
      : '<li class="empty">还没有收录单词。输入一个词，按回车。</li>';
  }

  /* ------------------------------------------------------------ keyflow (the 1.0 page, as it is) */

  private keyflowEl: HTMLElement | null = null;
  private toggleKeyflow() {
    if (this.keyflowEl) {
      this.keyflowEl.remove();
      this.keyflowEl = null;
      this.renderer.paused = false;
      this.renderer.wake();
      return;
    }
    this.setDemo(false);
    const wrap = document.createElement('div');
    wrap.className = 't2-keyflow';
    wrap.innerHTML = `<button type="button" data-act="close-keyflow">← 回到 3D Type 2.0</button><iframe title="Keyflow 律动词坊" allow="autoplay" src="../typing-worlds/keyflow/index.html"></iframe>`;
    this.$('.t2').appendChild(wrap);
    this.keyflowEl = wrap;
    this.renderer.paused = true;
  }

  /* ------------------------------------------------------------ demo, snapshot, toast */

  private setDemo(on: boolean) {
    if (on === this.demo) return;
    this.demo = on;
    clearTimeout(this.demoTimer);
    this.syncTools();
    if (!on) return;
    this.toast('自动演示中 · 点一下画面或按任意键停止');
    this.demoRun();
  }

  private demoRun() {
    if (!this.demo) return;
    const own = this.vocab.list().map((w) => w.word).filter((w) => /^[a-zA-Z' -]{3,12}$/.test(w));
    const pool = own.length >= 4 ? own : DEMO_WORDS;
    const word = pool[this.demoIndex++ % pool.length];
    let i = this.textEngine.text.length ? word.length : 0;
    if (i) this.textEngine.setText('');
    i = 0;
    const type = () => {
      if (!this.demo) return;
      if (i < word.length) {
        i++;
        this.textEngine.setText(word.slice(0, i));
        this.demoTimer = window.setTimeout(type, 230 + Math.random() * 160);
      } else {
        this.demoTimer = window.setTimeout(() => {
          if (!this.demo) return;
          this.textEngine.submit();
          this.demoTimer = window.setTimeout(() => {
            if (!this.demo) return;
            const k = WORLDS.findIndex((w) => w.id === this.def.id);
            void this.switchWorld(WORLDS[(k + 1) % WORLDS.length].id).then(() => {
              this.demoTimer = window.setTimeout(() => this.demoRun(), 900);
            });
          }, 3600);
        }, 2600);
      }
    };
    this.demoTimer = window.setTimeout(type, 500);
  }

  private snapshot() {
    this.renderer.renderNow();
    this.renderer.canvas.toBlob((blob) => {
      if (!blob) return this.toast('截图失败');
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `3d-type-${this.def.id}${this.textEngine.text ? '-' + this.textEngine.text.replace(/[^\w-]+/g, '_') : ''}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      this.toast('画面已保存');
    }, 'image/png');
  }

  private hint(show: boolean) {
    this.$('.t2-hint').classList.toggle('off', !show);
  }

  private toastTimer = 0;
  toast(msg: string, dur = 2200) {
    const el = this.$('.t2-toast');
    el.textContent = msg;
    el.classList.add('on');
    clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => el.classList.remove('on'), dur);
  }
}
