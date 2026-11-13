/**
 * WORLD 23 · Alphablocks World (字母积木世界)
 *
 * A bright toy stage. Every typed letter is its own little block character
 * (rounded toy cube, raised letter on the front, two round eyes peeking over the top edge).
 * - typing: the block jumps onto the stage in an arc, lands with a squash, then hops into line;
 *   its word-mates turn and give a welcome hop, each landing plays the next note of a scale
 * - Space: the finished word does a ripple hop and opens a gap (words group naturally)
 * - Backspace: the last block hops out of the queue and jumps off the side of the stage
 * - click / tap a block: it twirls in a high hop and sings its own note
 * - Enter: ripple, confetti, then the word hops off stage in a conga line
 * Letters always stay separate objects with their own state; layout reflow makes them hop to new places.
 */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { LetterWorld, type LetterVisual, canvasTexture, blobTexture, fitCameraToWidth } from '../engine/letter-world';
import { Spring, clamp, lerp, damp, rand } from '../engine/anim';
import { Particles } from '../engine/particles';
import type { Slot } from '../engine/layout';
import type { DeleteEvent, InsertEvent, SaveOutcome, WorldContext, WorldModule } from '../engine/types';

/* ------------------------------------------------------------ constants */

const STAGE_TOP = -1.2;
const STAGE_R = 8.2;
const RISE = 0.78;
const DEPTH = 1.45;
const BLOCK_K = 0.78; // block edge = slot.size * BLOCK_K

const PALETTES: Record<string, { body: number[]; letter: number; rough: number; grain: boolean }> = {
  toy: { body: [0xff4d5e, 0xffb300, 0x22b8cf, 0x5cc24a, 0x8e5cf0, 0xff7a2f, 0x1d8ff2, 0xf2559c], letter: 0xfffaf0, rough: 0.32, grain: false },
  pastel: { body: [0xff9aa8, 0xffd27a, 0x8fe0ea, 0xa8e39a, 0xc3a8ff, 0xffb98a, 0x8cc4ff, 0xffa8d6], letter: 0x2b2d52, rough: 0.55, grain: false },
  wood: { body: [0xd9573f, 0xe8b23a, 0x3f9fb0, 0x6aa84f, 0x8d6bc4, 0xd9803a, 0x4a7fc0, 0xcf5f8f], letter: 0xfff4dc, rough: 0.78, grain: true },
};
const VOWEL_SLOTS = [0, 1, 7];
const CONS_SLOTS = [2, 3, 4, 5, 6];
/** C major-ish scale (semitone offsets) for the "word song" */
const SCALE = [0, 2, 4, 5, 7, 9, 11, 12, 14, 16, 17, 19];

function colorIndex(ch: string) {
  const c = ch.toLowerCase();
  const code = c.charCodeAt(0) || 0;
  if ('aeiou'.includes(c)) return VOWEL_SLOTS[code % VOWEL_SLOTS.length];
  return CONS_SLOTS[code % CONS_SLOTS.length];
}

interface Hop {
  from: THREE.Vector3;
  to: THREE.Vector3;
  t: number;
  dur: number;
  h: number;
  /** full turns of twirl during the hop */
  twirl: number;
  /** final scale multiplier reached at the end of the hop */
  shrink: number;
  /** ground height when the hop started (filled lazily) */
  g0?: number;
  done?: () => void;
}

interface Target {
  x: number;
  y: number;
  z: number;
  word: number;
  iw: number;
  wlen: number;
  S: number;
}

interface Block extends LetterVisual {
  rig: THREE.Group;
  body: THREE.Group;
  bodyMesh: THREE.Mesh;
  eyes: THREE.Group;
  pupils: THREE.Mesh[];
  shadow: THREE.Mesh;
  S: number;
  pos: THREE.Vector3;
  ground: number;
  hop: Hop | null;
  squash: Spring;
  yaw: Spring;
  twirl: number;
  delay: number;
  blinkIn: number;
  blink: number;
  happy: number;
  lookX: number;
  lookTarget: number;
  scaleMul: number;
  colorIdx: number;
}

/* ---------------------------------------------------------- the world */

class AlphablocksWorld extends LetterWorld<Block> {
  private theme = 'toy';
  private bodyMats: THREE.MeshStandardMaterial[] = [];
  private panelMats: THREE.MeshStandardMaterial[] = [];
  private letterMat: THREE.MeshStandardMaterial;
  private eyeMat: THREE.MeshStandardMaterial;
  private pupilMat: THREE.MeshStandardMaterial;
  private shadowMat: THREE.MeshBasicMaterial;
  private woodTex: THREE.Texture;
  private shared: { geo: THREE.BufferGeometry[]; mat: THREE.Material[]; tex: THREE.Texture[] } = { geo: [], mat: [], tex: [] };
  private bodyGeo = new Map<number, THREE.BufferGeometry>();
  private panelGeo = new Map<number, THREE.BufferGeometry>();
  private sphereGeo: THREE.SphereGeometry;
  private shadowGeo: THREE.PlaneGeometry;
  private targets = new Map<number, Target>();
  private risers: THREE.Mesh[] = [];
  private confetti: Particles;
  private pendingSpaces: number[] = [];
  private camDist = 13;
  private lastPointer = 0;
  private tmpV = new THREE.Vector3();
  private onPointerDown: (e: PointerEvent) => void;
  private lines = 1;

  constructor(ctx: WorldContext) {
    super(ctx);
    this.theme = PALETTES[ctx.theme] ? ctx.theme : 'toy';
    const scene = ctx.scene;
    // minimal dark stage (classic 3D Type look): the blocks are the only bright things
    scene.background = new THREE.Color(0x040406);
    scene.environment = ctx.renderer.environment();
    scene.environmentIntensity = 0.25;
    scene.fog = new THREE.Fog(0x040406, 18, 40);

    // lights: dim fill + one key + faint rim
    this.root.add(new THREE.HemisphereLight(0xdfe6ff, 0x0a0806, 0.55));
    const sun = new THREE.DirectionalLight(0xfff4e0, 1.8);
    sun.position.set(-5, 10, 8);
    this.root.add(sun);
    const rim = new THREE.DirectionalLight(0xc8e6ff, 0.5);
    rim.position.set(6, 4, -6);
    this.root.add(rim);

    // textures
    this.woodTex = canvasTexture(256, 256, (g, w, h) => {
      g.fillStyle = '#fff';
      g.fillRect(0, 0, w, h);
      for (let i = 0; i < 70; i++) {
        const y = Math.random() * h;
        g.strokeStyle = `rgba(120,80,40,${0.05 + Math.random() * 0.12})`;
        g.lineWidth = 1 + Math.random() * 3;
        g.beginPath();
        g.moveTo(0, y);
        for (let x = 0; x <= w; x += 16) g.lineTo(x, y + Math.sin(x * 0.03 + i) * 4);
        g.stroke();
      }
    });
    this.shared.tex.push(this.woodTex);

    // shared materials (marked shared so per-letter disposal skips them)
    const mark = <M extends THREE.Material>(m: M) => {
      m.userData.shared = true;
      this.shared.mat.push(m);
      return m;
    };
    for (let i = 0; i < 8; i++) {
      this.bodyMats.push(mark(new THREE.MeshStandardMaterial({ roughness: 0.4 })));
      this.panelMats.push(mark(new THREE.MeshStandardMaterial({ roughness: 0.5 })));
    }
    this.letterMat = mark(new THREE.MeshStandardMaterial({ roughness: 0.35 }));
    this.eyeMat = mark(new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.25 }));
    this.pupilMat = mark(new THREE.MeshStandardMaterial({ color: 0x1b1b2f, roughness: 0.2 }));
    this.shadowMat = mark(new THREE.MeshBasicMaterial({ map: blobTexture(), color: 0x000000, transparent: true, opacity: 0.55, depthWrite: false }));
    this.sphereGeo = new THREE.SphereGeometry(1, 16, 12);
    this.sphereGeo.userData.shared = true;
    this.shadowGeo = new THREE.PlaneGeometry(1, 1);
    this.shadowGeo.rotateX(-Math.PI / 2);
    this.shadowGeo.userData.shared = true;
    this.shared.geo.push(this.sphereGeo, this.shadowGeo);
    this.applyTheme();

    this.buildStage();

    this.confetti = new Particles({ capacity: 600, gravity: [0, -3.2, 0], drag: 0.9, size: 0.09, shape: 'flake', blending: THREE.NormalBlending, depthWrite: false, floor: STAGE_TOP + 0.02 });
    this.root.add(this.confetti.points);

    // pointer (the app does not route clicks to worlds, so listen on the canvas ourselves)
    this.onPointerDown = (e: PointerEvent) => {
      const { ray } = ctx.renderer.raycaster(e.clientX, e.clientY);
      this.handleRay(ray);
    };
    ctx.renderer.canvas.addEventListener('pointerdown', this.onPointerDown);

    ctx.camera.position.set(0, 2.4, 13);
    ctx.camera.lookAt(0, STAGE_TOP + 1, 0);
  }

  /* -------------------------------------------------------------- stage */

  private buildStage() {
    // dark matte plinth with a single faint ring
    const top = canvasTexture(512, 512, (g, w, h) => {
      g.fillStyle = '#121216';
      g.fillRect(0, 0, w, h);
      g.strokeStyle = 'rgba(255,255,255,0.07)';
      g.lineWidth = 3;
      g.beginPath();
      g.arc(w / 2, h / 2, w * 0.47, 0, Math.PI * 2);
      g.stroke();
    });
    this.shared.tex.push(top);
    const stage = new THREE.Mesh(new THREE.CylinderGeometry(STAGE_R, STAGE_R + 0.15, 0.7, 72), [
      new THREE.MeshStandardMaterial({ color: 0x0c0c0f, roughness: 0.8 }),
      new THREE.MeshStandardMaterial({ map: top, roughness: 0.75 }),
      new THREE.MeshStandardMaterial({ color: 0x0c0c0f }),
    ]);
    stage.position.y = STAGE_TOP - 0.35;
    this.root.add(stage);

    // risers for 2nd/3rd line (back rows)
    const riserMat = new THREE.MeshStandardMaterial({ color: 0x15151a, roughness: 0.8 });
    for (let k = 1; k <= 2; k++) {
      const r = new THREE.Mesh(new THREE.BoxGeometry(13, 1, DEPTH), riserMat);
      r.position.set(0, STAGE_TOP, -k * DEPTH);
      r.scale.y = 0.001;
      r.visible = false;
      this.root.add(r);
      this.risers.push(r);
    }
  }

  /* -------------------------------------------------------------- theme */

  private applyTheme() {
    const p = PALETTES[this.theme] ?? PALETTES.toy;
    const c = new THREE.Color();
    p.body.forEach((hex, i) => {
      const bm = this.bodyMats[i];
      bm.color.setHex(hex);
      bm.roughness = p.rough;
      bm.map = p.grain ? this.woodTex : null;
      bm.needsUpdate = true;
      const pm = this.panelMats[i];
      pm.color.copy(c.setHex(hex).lerp(new THREE.Color(0xffffff), 0.45));
      pm.roughness = p.rough + 0.1;
      pm.map = p.grain ? this.woodTex : null;
      pm.needsUpdate = true;
    });
    this.letterMat.color.setHex(p.letter);
    this.letterMat.roughness = p.grain ? 0.6 : 0.3;
  }

  setTheme(id: string) {
    if (!PALETTES[id]) return;
    this.theme = id;
    this.applyTheme();
    for (const b of this.letters.values()) b.squash.impulse(-1.5);
    this.ctx.keepAlive(600);
  }

  /* ------------------------------------------------------- geometry cache */

  private geoFor(map: Map<number, THREE.BufferGeometry>, S: number, make: (S: number) => THREE.BufferGeometry) {
    const key = Math.round(S * 100);
    let g = map.get(key);
    if (!g) {
      g = make(key / 100);
      g.userData.shared = true;
      map.set(key, g);
      this.shared.geo.push(g);
    }
    return g;
  }

  /* --------------------------------------------------------- my layout */

  private relayout() {
    const slots = this.ctx.layout.all();
    const n = Math.max(1, this.ctx.layout.lines);
    this.lines = n;
    const lines: Slot[][] = [];
    for (const s of slots) (lines[s.line] ||= []).push(s);
    const maxW = Math.min(STAGE_R * 1.7, this.ctx.layout.opts.maxWidth * 1.15);
    let word = 0;
    const perWord = new Map<number, number[]>();
    this.targets.clear();
    lines.forEach((ln, r) => {
      if (!ln || !ln.length) return;
      const S = ln[0].size * BLOCK_K;
      let P = S * 1.14;
      let G = S * 0.62;
      // trim trailing spaces from the width
      let end = ln.length;
      while (end > 0 && ln[end - 1].char === ' ') end--;
      let w = 0;
      for (let i = 0; i < end; i++) w += ln[i].char === ' ' ? G : P;
      if (w > maxW) {
        const f = maxW / w;
        P *= f;
        G *= f;
        w = maxW;
      }
      const back = n - 1 - r;
      const y = STAGE_TOP + back * RISE;
      const z = -back * DEPTH + 0.2;
      let x = -w / 2;
      let prevLetter = false;
      for (const s of ln) {
        if (s.char === ' ') {
          if (prevLetter) word++;
          prevLetter = false;
          x += G;
          continue;
        }
        prevLetter = true;
        const list = perWord.get(word) ?? [];
        list.push(s.id);
        perWord.set(word, list);
        this.targets.set(s.id, { x: x + P / 2, y, z, word, iw: list.length - 1, wlen: 0, S: Math.min(S, P * 0.92) });
        x += P;
      }
      if (prevLetter) word++;
    });
    for (const ids of perWord.values()) for (const id of ids) this.targets.get(id)!.wlen = ids.length;
  }

  private wordMates(word: number) {
    const out: Block[] = [];
    for (const b of this.letters.values()) {
      const t = this.targets.get(b.ref.id);
      if (t && t.word === word) out.push(b);
    }
    return out.sort((a, b) => this.targets.get(a.ref.id)!.iw - this.targets.get(b.ref.id)!.iw);
  }

  /* ------------------------------------------------------------ letters */

  protected createLetter(ev: InsertEvent, slot: Slot): Block | null {
    if (ev.char === ' ' || ev.char === '\n') {
      if (!ev.restoring) this.pendingSpaces.push(ev.id);
      return null;
    }
    this.relayout();
    const tgt = this.targets.get(ev.id);
    const S = tgt?.S ?? slot.size * BLOCK_K;
    const ci = colorIndex(ev.char);

    const rig = new THREE.Group();
    const body = new THREE.Group();
    rig.add(body);
    const bodyGeo = this.geoFor(this.bodyGeo, S, (s) => new RoundedBoxGeometry(s, s, s, 3, s * 0.16));
    const bodyMesh = new THREE.Mesh(bodyGeo, this.bodyMats[ci]);
    bodyMesh.position.y = S / 2;
    bodyMesh.userData.blockId = ev.id;
    body.add(bodyMesh);
    const panelGeo = this.geoFor(this.panelGeo, S, (s) => new RoundedBoxGeometry(s * 0.8, s * 0.8, s * 0.06, 2, s * 0.025));
    const panel = new THREE.Mesh(panelGeo, this.panelMats[ci]);
    panel.position.set(0, S / 2, S / 2 - s0(S));
    body.add(panel);

    // raised letter on the front panel
    const glyph = this.ctx.glyphs.get(ev.char, 'sans');
    if (glyph.strokes.length) {
      const tube = this.ctx.glyphs.tube(glyph, 0.085, 8, true);
      const face = new THREE.Mesh(tube, this.letterMat);
      const bw = glyph.bounds.maxX - glyph.bounds.minX;
      const bh = glyph.bounds.maxY - glyph.bounds.minY;
      const k = (S * 0.56) / Math.max(bw, bh, 0.55);
      face.scale.set(k, k, k * 0.6);
      face.position.set(-((glyph.bounds.minX + glyph.bounds.maxX) / 2) * k, S / 2 - ((glyph.bounds.minY + glyph.bounds.maxY) / 2) * k, S / 2 + 0.03 * S + 0.085 * k * 0.6);
      body.add(face);
    }

    // eyes peeking over the top front edge
    const eyes = new THREE.Group();
    const pupils: THREE.Mesh[] = [];
    for (const sx of [-1, 1]) {
      const eye = new THREE.Group();
      eye.position.set(sx * S * 0.2, S * 0.98, S * 0.3);
      const white = new THREE.Mesh(this.sphereGeo, this.eyeMat);
      white.scale.set(S * 0.13, S * 0.15, S * 0.11);
      eye.add(white);
      const pupil = new THREE.Mesh(this.sphereGeo, this.pupilMat);
      pupil.scale.set(S * 0.06, S * 0.07, S * 0.04);
      pupil.position.set(0, S * 0.01, S * 0.085);
      eye.add(pupil);
      pupils.push(pupil);
      eyes.add(eye);
    }
    body.add(eyes);

    const shadow = new THREE.Mesh(this.shadowGeo, this.shadowMat);
    this.root.add(shadow);
    rig.add(body);
    this.root.add(rig);

    const b: Block = {
      ref: ev,
      slot,
      object: rig,
      state: 'creating',
      age: 0,
      rig,
      body,
      bodyMesh,
      eyes,
      pupils,
      shadow,
      S,
      pos: new THREE.Vector3(),
      ground: STAGE_TOP,
      hop: null,
      squash: new Spring(1, 1, 260, 11),
      yaw: new Spring(0, 0, 90, 9),
      twirl: 0,
      delay: 0,
      blinkIn: rand(1.5, 4),
      blink: 0,
      happy: 0,
      lookX: 0,
      lookTarget: 0,
      scaleMul: 1,
      colorIdx: ci,
    };
    // shadow is not a child of the rig — dispose it with the block
    rig.userData.shadow = shadow;

    const to = new THREE.Vector3(tgt?.x ?? slot.center.x, tgt?.y ?? STAGE_TOP, tgt?.z ?? 0);
    if (ev.restoring || this.ctx.reducedMotion) {
      b.pos.copy(to);
      b.ground = to.y;
      b.state = 'alive';
    } else {
      // jump in from the wing in an arc
      const side = to.x >= 0 ? 1 : -1;
      const from = new THREE.Vector3(to.x + side * rand(1.8, 2.8), to.y + rand(2.6, 3.4), to.z + rand(-0.4, 0.6));
      b.pos.copy(from);
      b.ground = to.y;
      b.delay = ev.burstSize > 1 ? ev.burstIndex * 0.05 : 0;
      b.rig.visible = b.delay <= 0;
      b.squash.x = 1.25;
      const dur = this.ctx.tempo.duration(560, 260);
      b.hop = {
        from,
        to,
        t: 0,
        dur,
        h: 0.9,
        twirl: 0,
        shrink: 1,
        done: () => this.landed(b),
      };
      b.yaw.x = -side * 0.6;
      this.ctx.audio.play('whoosh', { gain: 0.25, pitch: 1.5 });
    }
    this.place(b, 0);
    this.ctx.keepAlive(1200);
    return b;
  }

  /** a newly typed block landed: play its note, word-mates welcome it */
  private landed(b: Block) {
    if (b.state === 'creating') b.state = 'alive';
    b.squash.impulse(-6);
    const t = this.targets.get(b.ref.id);
    const note = SCALE[Math.min(SCALE.length - 1, t?.iw ?? 0)];
    this.ctx.audio.play('pop', { pitch: Math.pow(2, note / 12) * 0.9, gain: 0.5, minGap: 0.01 });
    this.ctx.audio.play('thud', { pitch: 1.6, gain: 0.25, minGap: 0.01 });
    this.puff(b, 6);
    if (!t) return;
    for (const m of this.wordMates(t.word)) {
      if (m === b) continue;
      const mt = this.targets.get(m.ref.id)!;
      m.lookTarget = clamp((b.pos.x - m.pos.x) * 2, -1, 1);
      if (mt.iw === t.iw - 1 && !m.hop) this.hopInPlace(m, m.S * 0.45, 0.26, 0);
    }
  }

  private hopInPlace(b: Block, h: number, dur: number, twirl: number, done?: () => void) {
    const t = this.targets.get(b.ref.id);
    const to = t && (b.state === 'alive' || b.state === 'creating') ? new THREE.Vector3(t.x, t.y, t.z) : b.pos.clone();
    b.hop = { from: b.pos.clone(), to, t: 0, dur, h, twirl, shrink: 1, done };
    b.squash.impulse(4);
  }

  protected removeLetter(b: Block, ev: DeleteEvent): void {
    // hop out of the queue (forward), then jump off the side of the stage
    const side = b.pos.x >= 0 ? 1 : -1;
    const step1 = new THREE.Vector3(b.pos.x + side * 0.3, b.ground, b.pos.z + 0.9);
    const quick = ev.burstSize > 2;
    b.lookTarget = side;
    b.happy = -1;
    const off = () => {
      const r = Math.max(STAGE_R + 1.2, Math.abs(b.pos.x) + 2.5);
      const to = new THREE.Vector3(side * r, STAGE_TOP - 4, b.pos.z + 1.5);
      b.hop = { from: b.pos.clone(), to, t: 0, dur: quick ? 0.45 : 0.75, h: 1.6, twirl: 0.5 * side, shrink: 0.2, done: () => this.release(b) };
    };
    b.yaw.target = side * 0.9;
    b.hop = {
      from: b.pos.clone(),
      to: step1,
      t: 0,
      dur: quick ? 0.16 : this.ctx.tempo.duration(260, 160),
      h: b.S * 0.5,
      twirl: 0,
      shrink: 1,
      done: off,
    };
    this.ctx.audio.play('squish', { pitch: 1.3, gain: 0.35 });
    this.ctx.keepAlive(1400);
  }

  protected playFinale(_word: string, visuals: Block[], saved: Promise<SaveOutcome>): void {
    visuals.sort((a, b) => a.pos.x - b.pos.x);
    this.ctx.audio.play('success', { gain: 0.7 });
    // ripple hop
    visuals.forEach((b, i) => {
      if (b.hop && b.hop.to.y > STAGE_TOP - 1) {
        b.pos.copy(b.hop.to);
        b.ground = b.pos.y;
      }
      b.hop = null;
      b.delay = 0;
      b.rig.visible = true;
      b.yaw.target = 0;
      b.lookTarget = 0;
      b.happy = 1;
      this.ctx.setTimeout(() => {
        this.hopInPlace(b, b.S * 1.1, 0.34, 0);
        this.ctx.audio.play('pop', { pitch: Math.pow(2, SCALE[Math.min(SCALE.length - 1, i)] / 12), gain: 0.4, minGap: 0.01 });
      }, i * 70);
    });
    // confetti burst over the word
    const cx = visuals.reduce((a, b) => a + b.pos.x, 0) / Math.max(1, visuals.length);
    const cz = visuals[0]?.pos.z ?? 0;
    const cy = (visuals[0]?.ground ?? STAGE_TOP) + 2;
    const cols = PALETTES.toy.body;
    const n = Math.round(160 * this.ctx.tempo.detail + 40);
    for (let i = 0; i < n; i++) {
      this.confetti.emit({ x: cx + rand(-1.5, 1.5), y: cy, z: cz + rand(-0.5, 0.5), vx: rand(-3, 3), vy: rand(2, 6), vz: rand(-1.5, 2), life: rand(1.6, 2.6), size: rand(0.8, 1.4), color: cols[i % cols.length], hold: 0.7 });
    }
    // then the word hops off stage in a conga line
    let failed = false;
    saved.then((r) => {
      if (!r.ok) {
        failed = true;
        this.ctx.audio.play('error', { gain: 0.4 });
        for (const b of visuals) b.yaw.impulse(9);
      }
    });
    const start = visuals.length * 70 + 520;
    visuals
      .slice()
      .reverse()
      .forEach((b, i) => {
        this.ctx.setTimeout(() => this.conga(b, failed ? 0.8 : 1), start + i * 90);
      });
    this.ctx.keepAlive(start + visuals.length * 90 + 2500);
  }

  private conga(b: Block, speed: number) {
    if (!b.object.parent) return;
    b.yaw.target = -0.8;
    b.happy = 1;
    const step = () => {
      const nx = b.pos.x + b.S * 2.4;
      if (nx > STAGE_R + 0.5) {
        b.hop = { from: b.pos.clone(), to: new THREE.Vector3(STAGE_R + 3, STAGE_TOP - 4, b.pos.z + 1), t: 0, dur: 0.6 / speed, h: 1.4, twirl: 1, shrink: 0.2, done: () => this.release(b) };
      } else {
        b.hop = { from: b.pos.clone(), to: new THREE.Vector3(nx, b.ground, b.pos.z), t: 0, dur: 0.24 / speed, h: b.S * 0.7, twirl: 0, shrink: 1, done: step };
      }
    };
    step();
  }

  onLayout(): void {
    this.relayout();
    // Space after a word: that word does a ripple to show it is complete
    for (const id of this.pendingSpaces.splice(0)) {
      const slot = this.ctx.slotOf(id);
      if (!slot) continue;
      const prev = this.ctx.letters()[slot.index - 1];
      const t = prev ? this.targets.get(prev.id) : undefined;
      if (!t) continue;
      const mates = this.wordMates(t.word);
      mates.forEach((b, i) => {
        this.ctx.setTimeout(() => {
          if (b.state !== 'alive' || b.hop) return;
          b.happy = 1;
          this.hopInPlace(b, b.S * 0.8, 0.3, 0);
        }, i * 60);
      });
      if (mates.length) this.ctx.audio.play('chime', { gain: 0.35, pitch: 1.2 });
    }
    this.ctx.keepAlive(900);
  }

  /* ------------------------------------------------------------ pointer */

  onPointer(_ndc: { x: number; y: number }, ray: THREE.Raycaster) {
    return this.handleRay(ray);
  }

  private handleRay(ray: THREE.Raycaster) {
    const now = performance.now();
    if (now - this.lastPointer < 120) return false;
    const meshes: THREE.Object3D[] = [];
    for (const b of this.letters.values()) meshes.push(b.bodyMesh);
    const hit = ray.intersectObjects(meshes, false)[0];
    if (!hit) return false;
    this.lastPointer = now;
    const b = this.letters.get(hit.object.userData.blockId as number);
    if (!b) return false;
    this.react(b);
    return true;
  }

  /** individual reaction: twirl hop + its own note + sparkles */
  private react(b: Block) {
    if (b.hop && b.hop.t < 0.6) return;
    this.ctx.audio.unlock();
    b.happy = 1;
    b.lookTarget = 0;
    this.hopInPlace(b, b.S * 1.5, 0.55, 1);
    const code = b.ref.char.toLowerCase().charCodeAt(0) - 97;
    const note = SCALE[((code % SCALE.length) + SCALE.length) % SCALE.length];
    this.ctx.audio.play('chime', { pitch: Math.pow(2, note / 12) * 0.8, gain: 0.55, minGap: 0.01 });
    this.puff(b, 26, true);
    // neighbours glance at it
    for (const o of this.letters.values()) if (o !== b) o.lookTarget = clamp((b.pos.x - o.pos.x) * 1.5, -1, 1);
    this.ctx.keepAlive(1200);
  }

  private puff(b: Block, n: number, sparkle = false) {
    const cols = PALETTES.toy.body;
    const k = Math.max(2, Math.round(n * this.ctx.tempo.detail));
    for (let i = 0; i < k; i++) {
      const a = Math.random() * Math.PI * 2;
      this.confetti.emit({
        x: b.pos.x + Math.cos(a) * b.S * 0.5,
        y: (sparkle ? b.pos.y + b.S : b.ground) + 0.05,
        z: b.pos.z + Math.sin(a) * b.S * 0.5,
        vx: Math.cos(a) * rand(0.6, 1.8),
        vy: sparkle ? rand(2, 4) : rand(0.6, 1.4),
        vz: Math.sin(a) * rand(0.6, 1.8),
        life: rand(0.5, 1.0),
        size: sparkle ? rand(0.6, 1.1) : 0.6,
        color: sparkle ? cols[i % cols.length] : 0xffffff,
      });
    }
  }

  /* ------------------------------------------------------------ update */

  private place(b: Block, time: number) {
    const sq = b.squash.x;
    let stretch = 1;
    let twirlA = 0;
    if (b.hop) {
      const k = clamp(b.hop.t);
      stretch = 1 + 0.14 * Math.sin(Math.PI * k);
      twirlA = b.hop.twirl * Math.PI * 2 * (k * k * (3 - 2 * k));
    }
    const sy = clamp(sq * stretch, 0.55, 1.5);
    const sxz = 1 / Math.sqrt(sy);
    const breathe = b.state === 'alive' && !b.hop ? 1 + Math.sin(time * 2.2 + b.ref.id * 1.3) * 0.015 : 1;
    b.body.scale.set(sxz * b.scaleMul, sy * breathe * b.scaleMul, sxz * b.scaleMul);
    b.rig.position.copy(b.pos);
    b.body.rotation.y = b.yaw.x + twirlA;
    // gentle lean towards word-mates (huddle)
    const t = this.targets.get(b.ref.id);
    let lean = 0;
    if (t && t.wlen > 1 && b.state === 'alive' && !b.hop) lean = ((t.wlen - 1) / 2 - t.iw) * -0.025;
    b.body.rotation.z = damp(b.body.rotation.z, lean, 6, 1 / 60);
    // eyes
    const blinkY = b.blink > 0 ? 0.15 : b.happy > 0.3 ? 0.55 : b.happy < -0.3 ? 0.7 : 1;
    b.eyes.scale.y = damp(b.eyes.scale.y, blinkY, 22, 1 / 60);
    for (const p of b.pupils) p.position.x = b.lookX * b.S * 0.05;
    // shadow
    const air = Math.max(0, b.pos.y - b.ground);
    const sh = b.S * 1.25 * (1 - clamp(air / 3) * 0.55) * b.scaleMul;
    b.shadow.visible = b.rig.visible && b.pos.y > STAGE_TOP - 0.5 && Math.hypot(b.pos.x, b.pos.z) < STAGE_R;
    b.shadow.position.set(b.pos.x, b.ground + 0.012, b.pos.z);
    b.shadow.scale.set(sh, 1, sh);
  }

  protected updateLetter(b: Block, dt: number, time: number): boolean {
    let moving = false;
    if (b.delay > 0) {
      b.delay -= dt;
      b.rig.visible = b.delay <= 0;
      this.place(b, time);
      return true;
    }
    if (b.hop) {
      const h = b.hop;
      h.t += dt / h.dur;
      const k = Math.min(1, h.t);
      b.pos.x = lerp(h.from.x, h.to.x, k);
      b.pos.z = lerp(h.from.z, h.to.z, k);
      b.pos.y = lerp(h.from.y, h.to.y, k) + 4 * h.h * k * (1 - k);
      if (h.g0 === undefined) h.g0 = b.ground;
      b.ground = h.to.y > STAGE_TOP - 1 ? lerp(h.g0, h.to.y, k) : h.g0;
      if (h.shrink !== 1) b.scaleMul = lerp(1, h.shrink, k * k);
      moving = true;
      if (k >= 1) {
        b.hop = null;
        if (h.to.y > STAGE_TOP - 1) b.ground = h.to.y;
        if (h.shrink === 1) b.squash.impulse(-4.5);
        h.done?.();
        if (!b.object.parent) return false;
      }
    } else if (b.state === 'alive' || b.state === 'creating') {
      const t = this.targets.get(b.ref.id);
      if (t) {
        const dx = t.x - b.pos.x;
        const dz = t.z - b.pos.z;
        const dy = t.y - b.pos.y;
        const d = Math.hypot(dx, dz, dy);
        if (d > 0.12) {
          // hop towards the new place (reflow / word shuffle)
          const step = Math.min(1, (b.S * 1.8) / Math.max(d, 1e-3));
          const to = new THREE.Vector3(b.pos.x + dx * step, step >= 1 ? t.y : Math.max(b.pos.y, t.y), b.pos.z + dz * step);
          if (step >= 1) to.set(t.x, t.y, t.z);
          b.hop = { from: b.pos.clone(), to, t: 0, dur: 0.26 + Math.min(0.12, d * 0.04), h: b.S * 0.4 + Math.abs(dy) * 0.6, twirl: 0, shrink: 1 };
          b.lookTarget = Math.sign(dx);
          moving = true;
        } else if (d > 1e-3) {
          b.pos.x = damp(b.pos.x, t.x, 14, dt);
          b.pos.y = damp(b.pos.y, t.y, 14, dt);
          b.pos.z = damp(b.pos.z, t.z, 14, dt);
          b.ground = b.pos.y;
          moving = true;
        }
      }
      if (b.lookTarget !== 0 && !b.hop && b.age > 0.6 && Math.random() < dt * 0.7) b.lookTarget = 0;
    }
    // springs & expressions
    b.squash.update(dt);
    b.yaw.update(dt);
    if (b.state === 'alive' && !b.hop) b.yaw.target = 0;
    if (!b.squash.resting || !b.yaw.resting) moving = true;
    b.lookX = damp(b.lookX, b.lookTarget, 8, dt);
    if (Math.abs(b.lookX - b.lookTarget) > 0.01) moving = true;
    if (b.happy !== 0 && !b.hop) {
      b.happy = damp(b.happy, 0, 3, dt);
      if (Math.abs(b.happy) < 0.05) b.happy = 0;
      else moving = true;
    }
    b.blinkIn -= dt;
    if (b.blinkIn <= 0) {
      b.blink = 0.12;
      b.blinkIn = rand(2, 5);
    }
    if (b.blink > 0) b.blink -= dt;
    this.place(b, time);
    return moving;
  }

  protected updateWorld(dt: number, time: number): boolean {
    let moving = this.confetti.update(dt, time);
    // camera fit
    const aspect = this.ctx.renderer.size.aspect;
    const bw = this.ctx.layout.bounds.isEmpty() ? 6 : this.ctx.layout.bounds.max.x - this.ctx.layout.bounds.min.x;
    const want = fitCameraToWidth(this.ctx.camera, Math.max(7, bw * 1.05 + 1.8), 9, aspect);
    const back = this.lines - 1;
    this.camDist = damp(this.camDist, want + back * 1.2, 3, dt);
    const cam = this.ctx.camera;
    const cy = STAGE_TOP + 1.7 + this.camDist * 0.12 + back * 0.4;
    cam.position.set(Math.sin(time * 0.15) * 0.25, cy, this.camDist);
    cam.lookAt(0, STAGE_TOP + 0.8 + back * 0.35, -back * 0.6);
    if (Math.abs(this.camDist - want - back * 1.2) > 0.01) moving = true;
    // risers
    this.risers.forEach((r, i) => {
      const lvl = i + 1;
      const on = this.lines - 1 >= lvl;
      const target = on ? lvl * RISE : 0.001;
      const cur = r.scale.y;
      r.scale.y = damp(cur, target, 8, dt);
      r.position.y = STAGE_TOP + r.scale.y / 2;
      r.visible = r.scale.y > 0.01;
      if (Math.abs(r.scale.y - target) > 0.002) moving = true;
    });
    return moving;
  }

  /* ------------------------------------------------------------ release */

  protected release(b: Block) {
    const sh = b.rig.userData.shadow as THREE.Object3D | undefined;
    sh?.removeFromParent();
    super.release(b);
  }

  disposeWorld(): void {
    this.ctx.renderer.canvas.removeEventListener('pointerdown', this.onPointerDown);
    for (const b of [...this.letters.values(), ...this.detached]) (b.rig.userData.shadow as THREE.Object3D | undefined)?.removeFromParent();
    this.confetti.dispose();
    super.disposeWorld();
    for (const g of this.shared.geo) g.dispose();
    for (const m of this.shared.mat) m.dispose();
    for (const t of this.shared.tex) t.dispose();
    this.bodyGeo.clear();
    this.panelGeo.clear();
    this.ctx.scene.environment = null;
  }
}

/** panel inset from the front face */
function s0(S: number) {
  return S * 0.005;
}

export function create(ctx: WorldContext) {
  return new AlphablocksWorld(ctx);
}

export const alphablocks: WorldModule = { create };
