/**
 * Typing Worlds · 主应用控制器 (App)
 *
 * 核心调度：
 * TextInputEngine (真实输入源) ⇄ Layout ⇄ WorldRenderer (3D 表现) ⇄ VocabStore (词汇数据)
 * 切换世界保留当前输入，动画不阻塞键盘输入。
 */
import * as THREE from 'three';
import { WorldRenderer } from '../engine/renderer';
import { TextInputEngine } from '../engine/text-input';
import { Layout } from '../engine/layout';
import { glyphEngine } from '../engine/glyphs/glyph-engine';
import { TempoTracker } from '../engine/tempo';
import { AudioEngine } from '../engine/audio';
import { LocalVocabStore, type VocabStore } from '../engine/vocab';
import { getWorld, loadPrefs, savePrefs, type Prefs } from '../engine/registry';
import type { InsertEvent, DeleteEvent, LetterRef, WorldContext, WorldInstance, Quality } from '../engine/types';
import { GalleryModal } from './gallery';
import { WordListModal } from './wordlist';

export class TypingWorldsApp {
  private container: HTMLElement;
  private renderer!: WorldRenderer;
  private textEngine!: TextInputEngine;
  private layout!: Layout;
  private tempo = new TempoTracker();
  private audio = new AudioEngine();
  private vocab: VocabStore = new LocalVocabStore();
  private prefs: Prefs;

  private currentWorldDef = getWorld('magnetic-jelly')!;
  private currentInstance: WorldInstance | null = null;
  private currentTheme: string = '';
  private timers = new Set<number>();

  private readoutEl!: HTMLDivElement;
  private statusToastEl!: HTMLDivElement;
  private themeSelectEl!: HTMLSelectElement;
  private worldTitleEl!: HTMLSpanElement;
  private soundBtnEl!: HTMLButtonElement;
  private galleryModal: GalleryModal | null = null;
  private wordListModal: WordListModal | null = null;
  private wordCountEl!: HTMLSpanElement;
  private keyflowEl: HTMLDivElement | null = null;

  constructor(target: HTMLElement) {
    this.container = target;
    this.prefs = loadPrefs();
    this.initLayout();
  }

  private async initLayout() {
    this.container.innerHTML = `
      <div class="tw-app">
        <header class="tw-top">
          <div class="tw-top-left">
            <button class="tw-btn tw-gallery-trigger" aria-label="打开世界画廊">
              🌌 <span class="tw-world-name">磁力果冻</span>
            </button>
            <select class="tw-select tw-theme-select" aria-label="材质与主题"></select>
          </div>
          <div class="tw-top-right">
            <button class="tw-btn tw-keyflow-btn" aria-label="打开 Keyflow 律动词坊">🎹 Keyflow</button>
            <button class="tw-btn tw-wordlist-btn" aria-label="打开词表">📖 词表 <span class="tw-wl-count">0</span></button>
            <button class="tw-btn tw-sound-btn" aria-pressed="true" title="开关音效">🔊 音效</button>
            <button class="tw-btn tw-motion-btn" title="减少动效">动效: 正常</button>
            <select class="tw-select tw-quality-select" title="渲染画质">
              <option value="2">画质: 高</option>
              <option value="1" selected>画质: 中</option>
              <option value="0">画质: 性能</option>
            </select>
          </div>
        </header>

        <div class="tw-body">
          <div class="tw-stage"></div>
          <div class="tw-readout" aria-live="polite"></div>
          <div class="tw-toast" aria-hidden="true"></div>
        </div>

        <footer class="tw-composer">
          <input type="text" class="tw-input" placeholder="输入英文单词，体验 3D 文字创造..." autofocus />
          <button class="tw-submit" title="完成并保存 (Enter)">↵</button>
          <p class="tw-tip">按 Enter 完成单词 · 支持 Backspace、粘贴与键盘连击</p>
        </footer>
      </div>
    `;

    const stageEl = this.container.querySelector('.tw-stage') as HTMLElement;
    const inputEl = this.container.querySelector('.tw-input') as HTMLInputElement;
    const submitBtn = this.container.querySelector('.tw-submit') as HTMLButtonElement;
    this.readoutEl = this.container.querySelector('.tw-readout') as HTMLDivElement;
    this.statusToastEl = this.container.querySelector('.tw-toast') as HTMLDivElement;
    this.themeSelectEl = this.container.querySelector('.tw-theme-select') as HTMLSelectElement;
    this.worldTitleEl = this.container.querySelector('.tw-world-name') as HTMLSpanElement;
    this.soundBtnEl = this.container.querySelector('.tw-sound-btn') as HTMLButtonElement;

    this.wordCountEl = this.container.querySelector('.tw-wl-count') as HTMLSpanElement;
    this.updateWordCount();
    (this.container.querySelector('.tw-wordlist-btn') as HTMLButtonElement).onclick = () => this.toggleWordList();

    (this.container.querySelector('.tw-keyflow-btn') as HTMLButtonElement).onclick = () => this.toggleKeyflow();

    const galleryBtn = this.container.querySelector('.tw-gallery-trigger') as HTMLButtonElement;
    const motionBtn = this.container.querySelector('.tw-motion-btn') as HTMLButtonElement;
    const qualitySelect = this.container.querySelector('.tw-quality-select') as HTMLSelectElement;

    // 1. 初始化引擎
    const initialQuality: Quality = (this.prefs.quality ?? 1) as Quality;
    qualitySelect.value = String(initialQuality);
    this.renderer = new WorldRenderer(stageEl, initialQuality);
    this.layout = new Layout(glyphEngine);
    this.textEngine = new TextInputEngine(inputEl);

    // 2. 音效与动效初始设置
    const soundEnabled = this.prefs.sound !== false;
    this.audio.setEnabled(soundEnabled);
    this.updateSoundBtn();

    const reducedMotion = !!this.prefs.reducedMotion;
    this.tempo.reducedMotion = reducedMotion;
    motionBtn.textContent = reducedMotion ? '动效: 极简' : '动效: 正常';

    // 3. 事件绑定
    galleryBtn.onclick = () => this.toggleGallery();

    this.soundBtnEl.onclick = () => {
      this.audio.unlock();
      const next = !this.audio.enabled;
      this.audio.setEnabled(next);
      this.prefs.sound = next;
      savePrefs(this.prefs);
      this.updateSoundBtn();
    };

    motionBtn.onclick = () => {
      const next = !this.tempo.reducedMotion;
      this.tempo.reducedMotion = next;
      this.prefs.reducedMotion = next;
      savePrefs(this.prefs);
      motionBtn.textContent = next ? '动效: 极简' : '动效: 正常';
    };

    qualitySelect.onchange = () => {
      const q = parseInt(qualitySelect.value, 10) as Quality;
      this.renderer.setQuality(q);
      this.prefs.quality = q;
      savePrefs(this.prefs);
    };

    this.themeSelectEl.onchange = () => {
      const t = this.themeSelectEl.value;
      this.currentTheme = t;
      this.prefs.themes[this.currentWorldDef.id] = t;
      savePrefs(this.prefs);
      this.currentInstance?.setTheme?.(t);
    };

    submitBtn.onclick = () => {
      this.textEngine.submit();
    };

    // 4. 输入引擎联动
    this.textEngine.onChange((change) => {
      this.handleTextChange(change);
    });

    this.textEngine.onSubmit((word) => {
      this.handleWordSubmit(word);
    });

    // 舞台点击聚焦输入框
    stageEl.onclick = () => {
      this.audio.unlock();
      this.textEngine.focus();
    };

    // 5. 挂载初始世界
    // ?world=<id> (from the 3D Type picker) opens that world directly
    let asked: string | null = null;
    try { asked = new URLSearchParams(location.search).get('world'); } catch { asked = null; }
    const targetWorldId = (asked && getWorld(asked) ? asked : null) || this.prefs.world || 'magnetic-jelly';
    await this.switchWorld(targetWorldId);
  }

  private updateSoundBtn() {
    this.soundBtnEl.textContent = this.audio.enabled ? '🔊 音效: 开' : '🔈 音效: 关';
    this.soundBtnEl.setAttribute('aria-pressed', String(this.audio.enabled));
  }

  showToast(msg: string, dur = 2200) {
    this.statusToastEl.textContent = msg;
    this.statusToastEl.setAttribute('aria-hidden', 'false');
    this.statusToastEl.classList.add('is-active');
    setTimeout(() => {
      this.statusToastEl.classList.remove('is-active');
      this.statusToastEl.setAttribute('aria-hidden', 'true');
    }, dur);
  }

  private updateThemeSelector() {
    this.themeSelectEl.innerHTML = '';
    const themes = this.currentWorldDef.themes || [];
    if (themes.length === 0) {
      this.themeSelectEl.style.display = 'none';
      return;
    }
    this.themeSelectEl.style.display = '';
    for (const t of themes) {
      const opt = document.createElement('option');
      opt.value = t.id;
      opt.textContent = `材质: ${t.label}`;
      if (t.id === this.currentTheme) opt.selected = true;
      this.themeSelectEl.appendChild(opt);
    }
  }

  async switchWorld(worldId: string) {
    const def = getWorld(worldId);
    if (!def) return;

    this.currentWorldDef = def;
    this.worldTitleEl.textContent = `${def.nameZh}`;
    this.prefs.world = worldId;

    if (!this.prefs.recent.includes(worldId)) {
      this.prefs.recent.unshift(worldId);
      if (this.prefs.recent.length > 8) this.prefs.recent.pop();
    }
    savePrefs(this.prefs);

    // 1. 清理现有计时器与世界
    for (const tid of this.timers) clearTimeout(tid);
    this.timers.clear();

    if (this.currentInstance) {
      this.currentInstance.disposeWorld();
      this.currentInstance = null;
    }
    this.renderer.disposeScene();

    // 2. 配置布局与材质主题
    this.currentTheme = this.prefs.themes[def.id] || def.defaultTheme || (def.themes ? def.themes[0]?.id : '');
    this.updateThemeSelector();

    if (def.layout) {
      this.layout.setOptions(def.layout);
    }

    // 3. 挂载渲染环境
    const { scene, camera } = this.renderer.mount({
      bloom: def.bloom,
      ambient: def.ambient,
    });

    // 4. 加载并创建世界实例
    if (def.load) {
      try {
        const mod = await def.load();
        const ctx: WorldContext = {
          THREE,
          renderer: this.renderer,
          scene,
          camera,
          glyphs: glyphEngine,
          tempo: this.tempo,
          audio: this.audio,
          layout: this.layout,
          quality: this.renderer.quality,
          reducedMotion: this.tempo.reducedMotion,
          theme: this.currentTheme,
          letters: () => this.textEngine.refs,
          slotOf: (id) => this.layout.get(id),
          keepAlive: (ms) => this.renderer.keepAlive(ms),
          setTimeout: (fn, ms) => {
            const id = window.setTimeout(fn, ms);
            this.timers.add(id);
            return id;
          },
          preview: false,
        };

        const instance = mod.create(ctx);
        this.currentInstance = instance;

        // 设置帧回调
        this.renderer.setFrameHandler((dt, time) => {
          return instance.updateAnimation(dt, time);
        });

        // 重新灌入当前文本 (切换世界不丢失当前输入)
        this.layout.compute(this.textEngine.refs);
        instance.onWorldEnter?.();
        this.textEngine.refs.forEach((ref, index) => {
          instance.onCharacterInput({
            ...ref,
            burstIndex: index,
            burstSize: this.textEngine.refs.length,
            restoring: true,
          });
        });
        instance.onLayout?.();

        this.renderer.keepAlive(1200);
      } catch (e) {
        console.error(`[TypingWorlds] 无法加载世界 ${worldId}:`, e);
      }
    }
  }

  private handleTextChange(change: { deletes: LetterRef[]; inserts: LetterRef[]; text: string }) {
    this.audio.unlock();
    this.tempo.key();

    // 更新浮层可读文本
    this.readoutEl.textContent = change.text || '';
    this.readoutEl.style.display = change.text ? 'block' : 'none';

    // 更新三维槽位布局
    this.layout.compute(this.textEngine.refs);

    // 删除事件触发
    if (change.deletes.length > 0 && this.currentInstance) {
      change.deletes.forEach((del, i) => {
        const ev: DeleteEvent = {
          ...del,
          burstIndex: i,
          burstSize: change.deletes.length,
        };
        this.currentInstance!.onCharacterDelete(ev);
      });
    }

    // 插入事件触发
    if (change.inserts.length > 0 && this.currentInstance) {
      change.inserts.forEach((ins, i) => {
        const ev: InsertEvent = {
          ...ins,
          burstIndex: i,
          burstSize: change.inserts.length,
          restoring: false,
        };
        this.currentInstance!.onCharacterInput(ev);
      });
    }

    this.currentInstance?.onLayout?.();
    this.renderer.keepAlive(800);
  }

  private async handleWordSubmit(word: string) {
    if (!word.trim()) return;
    this.audio.unlock();

    const refs = this.textEngine.takeAll();
    this.readoutEl.textContent = '';
    this.readoutEl.style.display = 'none';

    // 发起持久化保存
    const savePromise = this.vocab.save(word, this.currentWorldDef.id);

    // 通知世界触发专属完成动画 (Enter)
    if (this.currentInstance) {
      this.currentInstance.onWordComplete(word, refs, savePromise);
    }

    const outcome = await savePromise;
    this.updateWordCount();
    if (this.wordListModal) this.toggleWordList(true);
    if (outcome.ok) {
      this.showToast(outcome.duplicate ? `已存在: “${word}”` : `✨ 词汇 “${word}” 已成功收录！`);
    } else {
      this.showToast(`保存失败: ${outcome.error}`);
    }
  }

  private updateWordCount() {
    this.wordCountEl.textContent = String(this.vocab.list().length);
  }

  private toggleWordList(reopen = false) {
    if (this.wordListModal) {
      this.wordListModal.destroy();
      this.wordListModal = null;
      if (!reopen) this.textEngine.focus();
      if (!reopen) return;
    }
    this.wordListModal = new WordListModal(this.vocab, {
      onClose: () => this.toggleWordList(),
      onChange: () => this.updateWordCount(),
      toast: (m) => this.showToast(m),
    });
    this.container.querySelector('.tw-app')!.appendChild(this.wordListModal.element);
  }

  private toggleKeyflow() {
    if (this.keyflowEl) {
      this.keyflowEl.remove();
      this.keyflowEl = null;
      this.textEngine.focus();
      return;
    }
    const wrap = document.createElement('div');
    wrap.className = 'tw-keyflow';
    wrap.innerHTML = `
      <button type="button" class="tw-keyflow-close" aria-label="返回 Typing Worlds">← 返回 Typing Worlds</button>
      <iframe class="tw-keyflow-frame" title="Keyflow 律动词坊" allow="autoplay"></iframe>
    `;
    (wrap.querySelector('iframe') as HTMLIFrameElement).src = `${import.meta.env.BASE_URL}keyflow/index.html`;
    (wrap.querySelector('.tw-keyflow-close') as HTMLButtonElement).onclick = () => this.toggleKeyflow();
    this.container.querySelector('.tw-app')!.appendChild(wrap);
    this.keyflowEl = wrap;
  }

  private toggleGallery() {
    if (this.galleryModal) {
      this.galleryModal.destroy();
      this.galleryModal = null;
      this.textEngine.focus();
    } else {
      this.galleryModal = new GalleryModal(this.prefs, this.currentWorldDef.id, {
        onSelectWorld: (id) => {
          this.switchWorld(id);
          this.toggleGallery();
        },
        onClose: () => {
          this.toggleGallery();
        },
      });
      this.container.querySelector('.tw-app')!.appendChild(this.galleryModal.element);
    }
  }
}
