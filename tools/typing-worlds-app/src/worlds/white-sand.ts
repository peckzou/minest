/**
 * WORLD 10 · Sand Typography (白沙书写)
 *
 * A sand tray at dusk, seen from above. Letters are raised ridges made of thousands of real grains
 * (one InstancedMesh for the whole pool, every grain has its own position and state):
 * - typing: the wind lifts grains — first from existing sand piles, otherwise straight out of the
 *   sand bed — swirls them along an arc and lets them rain down into the letter's ridge
 * - Backspace: a gust blows the letter apart from its windward side; grains fly downwind, fall
 *   under gravity and pile up in little dunes on the tray (the piles feed the next letters)
 * - click / tap the sand letter: a puff scatters the grains near the finger; they land and re-form
 * - Enter: a strong gust carries the whole word away in a stream; it piles up at the lee edge
 * Layout runs in the vertical plane; this world projects it onto the tray (lines go "up" the tray).
 */
import * as THREE from 'three';
import { LetterWorld, type LetterVisual, gradientSky, canvasTexture, fitCameraToWidth } from '../engine/letter-world';
import { clamp, rand, damp, easeInOutCubic } from '../engine/anim';
import { Particles } from '../engine/particles';
import type { Glyph } from '../engine/glyphs/glyph-engine';
import type { Slot } from '../engine/layout';
import type { DeleteEvent, InsertEvent, SaveOutcome, WorldContext, WorldModule } from '../engine/types';

const SAND_Y = 0;
const ZK = 1.05; // layout y → tray depth
const ZOFF = 0.4;
const TRAY_W = 17;
const TRAY_D = 8.5;
const CELL = 0.14;
const PILE_H = 0.0055;
const RIDGE_R = 0.09; // ridge half width (glyph units)
const RIDGE_H = 0.09; // ridge height (glyph units)

const FREE = 0,
  PILE = 1,
  FLY = 2,
  SET = 3,
  BLOWN = 4,
  PUFF = 5,
  SINK = 6;

interface SandVisual extends LetterVisual {
  grains: number[];
  glyph: Glyph;
  settled: boolean;
  dirty: boolean;
  lastKey: string;
}

class SandWorld extends LetterWorld<SandVisual> {
  private CAP: number;
  private PER: number;
  private mesh: THREE.InstancedMesh;
  private mat: THREE.MeshStandardMaterial;
  private geo: THREE.IcosahedronGeometry;
  private bedTex: THREE.Texture;
  private pos: Float32Array;
  private vel: Float32Array;
  private from: Float32Array;
  private gx: Float32Array;
  private gy: Float32Array;
  private gh: Float32Array;
  private t: Float32Array;
  private dur: Float32Array;
  private delay: Float32Array;
  private seed: Float32Array;
  private size: Float32Array;
  private scale: Float32Array;
  private owner: Int32Array;
  private cellOf: Int32Array;
  private state: Uint8Array;
  private freeList: number[] = [];
  private cols: number;
  private rows: number;
  private pileCount: Uint16Array;
  private stacks = new Map<number, number[]>();
  private pileTotal = 0;
  private byId = new Map<number, SandVisual>();
  private ptsCache = new Map<string, { x: number; y: number }[]>();
  private gust = 0;
  private active = 0;
  private wind: Particles;
  private dust: Particles;
  private camDist = 11;
  private tmp = new THREE.Vector3();
  private plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -SAND_Y);
  private onPointerDown: (e: PointerEvent) => void;
  private lastPointer = 0;
  private disposables: { dispose(): void }[] = [];

  constructor(ctx: WorldContext) {
    super(ctx);
    const q = ctx.quality;
    this.CAP = q === 2 ? 12000 : q === 1 ? 8500 : 5200;
    this.PER = q === 2 ? 380 : q === 1 ? 280 : 170;
    const C = this.CAP;
    this.pos = new Float32Array(C * 3);
    this.vel = new Float32Array(C * 3);
    this.from = new Float32Array(C * 3);
    this.gx = new Float32Array(C);
    this.gy = new Float32Array(C);
    this.gh = new Float32Array(C);
    this.t = new Float32Array(C);
    this.dur = new Float32Array(C);
    this.delay = new Float32Array(C);
    this.seed = new Float32Array(C);
    this.size = new Float32Array(C);
    this.scale = new Float32Array(C);
    this.owner = new Int32Array(C).fill(-1);
    this.cellOf = new Int32Array(C).fill(-1);
    this.state = new Uint8Array(C);
    for (let i = C - 1; i >= 0; i--) this.freeList.push(i);
    this.cols = Math.ceil(TRAY_W / CELL);
    this.rows = Math.ceil(TRAY_D / CELL);
    this.pileCount = new Uint16Array(this.cols * this.rows);

    const scene = ctx.scene;
    scene.background = new THREE.Color(0xf3d6b0);
    scene.fog = new THREE.Fog(0xf0d2ae, 22, 60);
    this.root.add(gradientSky(0x8fb3d9, 0xf6dcb8, { horizon: 0xffd9a8, exponent: 0.55 }));
    ctx.camera.position.set(0, 7, 8.5);
    ctx.camera.lookAt(0, 0, -0.2);

    this.root.add(new THREE.HemisphereLight(0xfff1dd, 0xcaa77c, 0.9));
    const sun = new THREE.DirectionalLight(0xffe2b8, 2.3);
    sun.position.set(-8, 5, -3); // low raking sun: ridges cast light and shade
    this.root.add(sun);
    const sky = new THREE.DirectionalLight(0xbcd4ff, 0.45);
    sky.position.set(4, 6, 6);
    this.root.add(sky);

    // sand bed with wind ripples
    this.bedTex = canvasTexture(
      512,
      512,
      (g, w, h) => {
        g.fillStyle = '#cfae7f';
        g.fillRect(0, 0, w, h);
        // soft wind ripples
        for (let y = 0; y < h; y += 2) {
          for (let x = 0; x < w; x += 4) {
            const r = Math.sin(x * 0.045 + Math.sin(y * 0.015) * 2 + y * 0.006) * 0.5 + 0.5;
            g.fillStyle = r > 0.5 ? `rgba(255,240,215,${(r - 0.5) * 0.16})` : `rgba(120,85,50,${(0.5 - r) * 0.12})`;
            g.fillRect(x, y, 4, 2);
          }
        }
        for (let i = 0; i < 9000; i++) {
          g.fillStyle = Math.random() < 0.5 ? 'rgba(255,255,255,0.25)' : 'rgba(110,80,50,0.18)';
          g.fillRect(Math.random() * w, Math.random() * h, 1, 1);
        }
      },
      { repeat: 3 }
    );
    const bedMat = new THREE.MeshStandardMaterial({ map: this.bedTex, bumpMap: this.bedTex, bumpScale: 0.6, roughness: 1 });
    const bed = new THREE.Mesh(new THREE.PlaneGeometry(TRAY_W, TRAY_D), bedMat);
    bed.rotation.x = -Math.PI / 2;
    bed.position.y = SAND_Y - 0.005;
    this.root.add(bed);
    // tray frame
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x6e4a2c, roughness: 0.7 });
    const fH = 0.35;
    const mk = (w: number, d: number, x: number, z: number) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, fH, d), frameMat);
      m.position.set(x, SAND_Y + fH / 2 - 0.12, z);
      this.root.add(m);
    };
    mk(TRAY_W + 0.6, 0.3, 0, TRAY_D / 2 + 0.15);
    mk(TRAY_W + 0.6, 0.3, 0, -TRAY_D / 2 - 0.15);
    mk(0.3, TRAY_D, TRAY_W / 2 + 0.15, 0);
    mk(0.3, TRAY_D, -TRAY_W / 2 - 0.15, 0);
    // desert beyond the tray
    const desertMat = new THREE.MeshStandardMaterial({ color: 0xe2bf8e, roughness: 1 });
    const desert = new THREE.Mesh(new THREE.PlaneGeometry(160, 120), desertMat);
    desert.rotation.x = -Math.PI / 2;
    desert.position.y = SAND_Y - 0.6;
    this.root.add(desert);
    for (let i = 0; i < 7; i++) {
      const d = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 12), desertMat);
      d.scale.set(rand(8, 16), rand(1.2, 3), rand(4, 7));
      d.position.set(rand(-40, 40), SAND_Y - 0.8, rand(-45, -22));
      this.root.add(d);
    }
    this.disposables.push(bedMat, frameMat, desertMat);

    // grains
    this.geo = new THREE.IcosahedronGeometry(1, 0);
    this.mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95 });
    this.mesh = new THREE.InstancedMesh(this.geo, this.mat, this.CAP);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.frustumCulled = false;
    const c = new THREE.Color();
    const tones = [0xfffaf0, 0xf7efe0, 0xfdf6ea, 0xefe4d0, 0xffffff];
    const arr = this.mesh.instanceMatrix.array as Float32Array;
    for (let i = 0; i < C; i++) {
      this.seed[i] = Math.random();
      this.size[i] = rand(0.6, 1.25);
      const speck = Math.random() < 0.015;
      this.mesh.setColorAt(i, speck ? c.setHex(0x7a6650) : c.setHex(tones[(Math.random() * tones.length) | 0]));
      arr.fill(0, i * 16, i * 16 + 16);
    }
    this.root.add(this.mesh);

    this.wind = new Particles({ capacity: 500, gravity: [0, 0, 0], drag: 0.2, size: 0.05, shape: 'dot', opacity: 0.35 });
    this.dust = new Particles({ capacity: 600, gravity: [0, -0.8, 0], drag: 1.4, size: 0.08, shape: 'dot', blending: THREE.NormalBlending, opacity: 0.4 });
    this.root.add(this.wind.points, this.dust.points);

    this.onPointerDown = (e: PointerEvent) => {
      const { ray } = ctx.renderer.raycaster(e.clientX, e.clientY);
      this.handleRay(ray);
    };
    ctx.renderer.canvas.addEventListener('pointerdown', this.onPointerDown);
  }

  /* -------------------------------------------------------------- helpers */

  private points(glyph: Glyph) {
    const key = glyph.font + glyph.char;
    let p = this.ptsCache.get(key);
    if (!p) {
      p = this.ctx.glyphs.evenPoints(glyph, 0.02).map((e) => ({ x: e.x, y: e.y }));
      this.ptsCache.set(key, p);
    }
    return p;
  }

  /** world position of a grain's place in its letter */
  private target(i: number, v: SandVisual, out: THREE.Vector3) {
    const s = v.slot.size;
    const X = v.slot.origin.x + this.gx[i] * s;
    const Yl = v.slot.origin.y + this.gy[i] * s;
    return out.set(X, SAND_Y + this.gh[i] * s + this.grainR(i, v) * 0.6, -Yl * ZK + ZOFF);
  }

  private grainR(i: number, v?: SandVisual) {
    return 0.024 * this.size[i] * (v ? Math.max(0.6, v.slot.size) : 1);
  }

  private cellIndex(x: number, z: number) {
    const c = Math.floor((x + TRAY_W / 2) / CELL);
    const r = Math.floor((z + TRAY_D / 2) / CELL);
    if (c < 0 || r < 0 || c >= this.cols || r >= this.rows) return -1;
    return r * this.cols + c;
  }

  private pileTop(cell: number) {
    return cell < 0 ? SAND_Y : SAND_Y + Math.min(0.7, this.pileCount[cell] * PILE_H);
  }

  private takeFromPile(i: number) {
    const cell = this.cellOf[i];
    if (cell >= 0) {
      const st = this.stacks.get(cell);
      if (st) {
        const k = st.lastIndexOf(i);
        if (k >= 0) st.splice(k, 1);
        if (!st.length) this.stacks.delete(cell);
      }
      if (this.pileCount[cell] > 0) this.pileCount[cell]--;
      this.cellOf[i] = -1;
      this.pileTotal--;
    }
  }

  private land(i: number) {
    const p = i * 3;
    const cell = this.cellIndex(this.pos[p], this.pos[p + 2]);
    this.state[i] = PILE;
    this.owner[i] = -1;
    this.vel[p] = this.vel[p + 1] = this.vel[p + 2] = 0;
    if (cell < 0) {
      this.state[i] = SINK;
      return;
    }
    this.pos[p + 1] = this.pileTop(cell) + this.grainR(i) * 0.5;
    this.pileCount[cell]++;
    this.cellOf[i] = cell;
    let st = this.stacks.get(cell);
    if (!st) this.stacks.set(cell, (st = []));
    st.push(i);
    this.pileTotal++;
    // too much loose sand: the oldest tops sink back into the bed
    const max = this.CAP * 0.45;
    if (this.pileTotal > max) {
      const it = this.stacks.values().next();
      if (!it.done && it.value.length) {
        const j = it.value[it.value.length - 1];
        this.takeFromPile(j);
        this.state[j] = SINK;
      }
    }
  }

  /** grains for a new letter: nearest pile tops first, then fresh sand from the bed */
  private recruit(n: number, cx: number, cz: number): number[] {
    const out: number[] = [];
    if (this.stacks.size) {
      const cells = [...this.stacks.keys()]
        .map((cell) => {
          const x = (cell % this.cols) * CELL - TRAY_W / 2;
          const z = Math.floor(cell / this.cols) * CELL - TRAY_D / 2;
          return { cell, d: (x - cx) ** 2 + (z - cz) ** 2 * 2 };
        })
        .sort((a, b) => a.d - b.d);
      for (const { cell } of cells) {
        const st = this.stacks.get(cell);
        while (st && st.length && out.length < n) {
          const i = st[st.length - 1];
          this.takeFromPile(i);
          out.push(i);
        }
        if (out.length >= n) break;
      }
    }
    while (out.length < n && this.freeList.length) {
      const i = this.freeList.pop()!;
      // rise out of the bed, upwind (left) of the letter
      const p = i * 3;
      this.pos[p] = clamp(cx - rand(1.2, 3.5), -TRAY_W / 2 + 0.2, TRAY_W / 2 - 0.2);
      this.pos[p + 1] = SAND_Y - 0.02;
      this.pos[p + 2] = clamp(cz + rand(-1.2, 1.2), -TRAY_D / 2 + 0.2, TRAY_D / 2 - 0.2);
      this.scale[i] = 0;
      out.push(i);
    }
    return out;
  }

  /* ------------------------------------------------------------- letters */

  protected createLetter(ev: InsertEvent, slot: Slot): SandVisual | null {
    if (ev.char === ' ' || ev.char === '\n') return null;
    const glyph = this.ctx.glyphs.get(ev.char, 'sans');
    if (!glyph.strokes.length) return null;
    const pts = this.points(glyph);
    const group = new THREE.Group();
    this.root.add(group);
    const v: SandVisual = { ref: ev, slot, object: group, state: 'creating', age: 0, grains: [], glyph, settled: false, dirty: true, lastKey: '' };
    this.byId.set(ev.id, v);

    const cx = slot.center.x;
    const cz = -slot.center.y * ZK + ZOFF;
    const n = Math.max(40, Math.round(this.PER * Math.min(1.6, 0.5 + glyph.length * 0.22)));
    const ids = this.recruit(n, cx, cz);
    const instant = ev.restoring || this.ctx.reducedMotion;
    const flyDur = this.ctx.tempo.duration(1150, 480);
    const spread = this.ctx.tempo.duration(520, 160);
    const burst = ev.burstSize > 1 ? ev.burstIndex * 0.06 : 0;
    for (const i of ids) {
      // a place in the ridge: near a stroke point, higher at the centre line
      const sp = pts[(Math.random() * pts.length) | 0];
      const a = Math.random() * Math.PI * 2;
      const r = RIDGE_R * Math.sqrt(Math.random());
      this.gx[i] = sp.x + Math.cos(a) * r;
      this.gy[i] = sp.y + Math.sin(a) * r;
      const k = 1 - (r / RIDGE_R) ** 2;
      this.gh[i] = RIDGE_H * k * rand(0.55, 1);
      this.owner[i] = ev.id;
      v.grains.push(i);
      const p = i * 3;
      if (instant) {
        this.state[i] = SET;
        this.scale[i] = 1;
        this.target(i, v, this.tmp);
        this.pos[p] = this.tmp.x;
        this.pos[p + 1] = this.tmp.y;
        this.pos[p + 2] = this.tmp.z;
      } else {
        this.state[i] = FLY;
        this.from[p] = this.pos[p];
        this.from[p + 1] = this.pos[p + 1];
        this.from[p + 2] = this.pos[p + 2];
        this.t[i] = 0;
        this.dur[i] = flyDur * rand(0.75, 1.2);
        // windward side (left) and bottom of the ridge settle first, like drifting sand
        this.delay[i] = burst + spread * (0.5 * (sp.x / Math.max(0.4, glyph.advance)) + 0.5 * Math.random());
      }
    }
    if (instant) {
      v.settled = true;
      v.state = 'alive';
    } else {
      this.ctx.audio.play('whoosh', { gain: 0.25, pitch: 0.55 });
      this.windStreaks(cx, cz, 10);
    }
    this.active = 1;
    this.ctx.keepAlive(2000);
    return v;
  }

  /** wind blows the letter apart from its windward side */
  protected removeLetter(v: SandVisual, ev: DeleteEvent): void {
    const quick = ev.burstSize > 2;
    const s = v.slot.size;
    for (const i of v.grains) {
      if (this.owner[i] !== v.ref.id) continue;
      this.blow(i, quick ? 0 : clamp(this.gx[i] / Math.max(0.4, v.slot.advance / s)) * 0.18, 1);
    }
    v.grains = [];
    this.gust = Math.max(this.gust, 1.2);
    this.windStreaks(v.slot.center.x, -v.slot.center.y * ZK + ZOFF, 14);
    this.ctx.audio.play('whoosh', { gain: 0.35, pitch: 0.9 });
    this.active = 1;
    this.ctx.keepAlive(2500);
  }

  private blow(i: number, delay: number, power: number) {
    const p = i * 3;
    this.state[i] = BLOWN;
    this.owner[i] = -1;
    this.delay[i] = delay;
    if (this.scale[i] <= 0) this.scale[i] = 1;
    this.vel[p] = rand(2.2, 4.2) * power;
    this.vel[p + 1] = rand(0.9, 2.4) * Math.sqrt(power);
    this.vel[p + 2] = rand(-0.6, 0.6);
  }

  protected playFinale(_word: string, visuals: SandVisual[], saved: Promise<SaveOutcome>): void {
    visuals.sort((a, b) => a.slot.origin.x - b.slot.origin.x);
    // let the word sit for a moment, then a strong gust carries it away
    visuals.forEach((v, li) => {
      for (const i of v.grains) {
        if (this.owner[i] !== v.ref.id) continue;
        if (this.state[i] === FLY) {
          // finish forming fast
          this.dur[i] = Math.min(this.dur[i], 0.35);
          this.delay[i] = 0;
        }
      }
      v.dirty = true;
      this.ctx.setTimeout(() => {
        for (const i of v.grains) {
          if (this.owner[i] !== v.ref.id) continue;
          this.blow(i, rand(0, 0.25) + (this.gx[i] * v.slot.size) * 0.05, 1.4);
        }
        v.grains = [];
        this.gust = 3;
        this.active = 1;
        this.ctx.keepAlive(3000);
        if (li === 0) {
          this.ctx.audio.play('whoosh', { gain: 0.5, pitch: 0.6 });
          this.windStreaks(0, 0, 40);
        }
      }, 900 + li * 110);
    });
    this.ctx.audio.play('chime', { gain: 0.4, pitch: 0.9 });
    saved.then((r) => {
      if (!r.ok) this.ctx.audio.play('error', { gain: 0.5 });
    });
    this.ctx.keepAlive(4500);
  }

  /* ------------------------------------------------------------- pointer */

  onPointer(_ndc: { x: number; y: number }, ray: THREE.Raycaster) {
    return this.handleRay(ray);
  }

  private handleRay(ray: THREE.Raycaster) {
    const now = performance.now();
    if (now - this.lastPointer < 150) return false;
    const hit = ray.ray.intersectPlane(this.plane, new THREE.Vector3());
    if (!hit) return false;
    let any = false;
    const R = 0.55;
    for (const v of this.letters.values()) {
      for (const i of v.grains) {
        if (this.state[i] !== SET || this.owner[i] !== v.ref.id) continue;
        const p = i * 3;
        const dx = this.pos[p] - hit.x;
        const dz = this.pos[p + 2] - hit.z;
        const d = Math.hypot(dx, dz);
        if (d > R) continue;
        any = true;
        const f = (1 - d / R) * rand(1.2, 2.6);
        this.state[i] = PUFF;
        this.vel[p] = (dx / (d + 1e-3)) * f + rand(-0.3, 0.3);
        this.vel[p + 1] = rand(1, 2.2) * (1 - d / R) + 0.4;
        this.vel[p + 2] = (dz / (d + 1e-3)) * f + rand(-0.3, 0.3);
        this.delay[i] = 0;
      }
    }
    if (!any) return false;
    this.lastPointer = now;
    this.ctx.audio.unlock();
    this.ctx.audio.play('whoosh', { gain: 0.3, pitch: 1.4 });
    for (let k = 0; k < 10; k++)
      this.dust.emit({ x: hit.x, y: SAND_Y + 0.05, z: hit.z, vx: rand(-1, 1), vy: rand(0.3, 1), vz: rand(-1, 1), life: rand(0.5, 1), color: 0xf0dfc0, size: rand(1, 2) });
    this.active = 1;
    this.ctx.keepAlive(2500);
    return true;
  }

  private windStreaks(cx: number, cz: number, n: number) {
    const k = Math.round(n * this.ctx.tempo.detail) + 2;
    for (let j = 0; j < k; j++) {
      this.wind.emit({ x: cx - rand(2, 5), y: SAND_Y + rand(0.1, 1.2), z: cz + rand(-2, 2), vx: rand(4, 7), vy: rand(-0.1, 0.2), vz: rand(-0.3, 0.3), life: rand(0.7, 1.4), color: 0xfff6e8, size: rand(0.8, 1.6) });
    }
  }

  /* -------------------------------------------------------------- update */

  onLayout(): void {
    for (const v of this.letters.values()) v.dirty = true;
    this.active = 1;
    this.ctx.keepAlive(400);
  }

  protected updateLetter(v: SandVisual, _dt: number): boolean {
    const key = `${v.slot.origin.x.toFixed(3)},${v.slot.origin.y.toFixed(3)},${v.slot.size.toFixed(3)}`;
    if (key !== v.lastKey) {
      v.lastKey = key;
      v.dirty = true;
      this.active = 1;
    }
    if (v.state === 'removing' || (v.state === 'finale' && !v.grains.length)) {
      if (!v.grains.length) {
        this.byId.delete(v.ref.id);
        this.release(v);
      }
      return false;
    }
    if (v.state === 'creating' && v.settled) v.state = 'alive';
    return !v.settled || v.dirty;
  }

  protected updateWorld(dt: number, time: number): boolean {
    let moving = this.wind.update(dt, time);
    if (this.dust.update(dt, time)) moving = true;
    this.gust = Math.max(0, this.gust - dt * 0.8);
    if (this.stepGrains(dt, time)) moving = true;
    for (const v of this.letters.values()) v.dirty = false;
    // camera: oblique view down onto the tray, fitted to the text width
    const aspect = this.ctx.renderer.size.aspect;
    const b = this.ctx.layout.bounds;
    const bw = b.isEmpty() ? 6 : b.max.x - b.min.x;
    const want = fitCameraToWidth(this.ctx.camera, Math.max(8, bw + 2.5), 9.5, aspect);
    this.camDist = damp(this.camDist, want, 3, dt);
    if (Math.abs(this.camDist - want) > 0.01) moving = true;
    const cam = this.ctx.camera;
    cam.position.set(0, 0.2 + this.camDist * 0.66, ZOFF + this.camDist * 0.76);
    cam.lookAt(0, SAND_Y, ZOFF - 0.5);
    return moving;
  }

  /** the whole grain pool: flight, settling, wind, gravity, piling */
  private stepGrains(dt: number, time: number) {
    if (!this.active) return false;
    const arr = this.mesh.instanceMatrix.array as Float32Array;
    const C = this.CAP;
    let busy = 0;
    const tmp = this.tmp;
    const halfW = TRAY_W / 2 - 0.1;
    const halfD = TRAY_D / 2 - 0.1;
    let pileChanged = false;
    for (let i = 0; i < C; i++) {
      const st = this.state[i];
      if (st === FREE) continue;
      const p = i * 3;
      let v: SandVisual | undefined;
      if (st === FLY || st === SET || st === PUFF) {
        v = this.byId.get(this.owner[i]);
        if (!v) {
          this.blow(i, 0, 0.6);
          continue;
        }
      }
      switch (st) {
        case FLY: {
          busy++;
          if (this.delay[i] > 0) {
            this.delay[i] -= dt;
            break;
          }
          this.t[i] += dt / this.dur[i];
          const k = Math.min(1, this.t[i]);
          const e = easeInOutCubic(k);
          this.target(i, v!, tmp);
          const arc = Math.sin(Math.PI * Math.min(1, k * 1.15)) * (0.9 + this.seed[i] * 0.9);
          const sw = Math.sin(Math.PI * k) * (1 - k) * 0.6;
          const ph = this.seed[i] * 40 + k * 9;
          this.pos[p] = this.from[p] + (tmp.x - this.from[p]) * e + Math.cos(ph) * sw;
          this.pos[p + 1] = this.from[p + 1] + (tmp.y - this.from[p + 1]) * e + arc;
          this.pos[p + 2] = this.from[p + 2] + (tmp.z - this.from[p + 2]) * e + Math.sin(ph) * sw;
          if (this.scale[i] < 1) this.scale[i] = Math.min(1, this.scale[i] + dt * 4);
          if (k >= 1) {
            this.state[i] = SET;
            this.pos[p] = tmp.x;
            this.pos[p + 1] = tmp.y;
            this.pos[p + 2] = tmp.z;
          }
          break;
        }
        case SET:
          if (v!.dirty) {
            this.target(i, v!, tmp);
            this.pos[p] = tmp.x;
            this.pos[p + 1] = tmp.y;
            this.pos[p + 2] = tmp.z;
          }
          break;
        case BLOWN:
        case PUFF: {
          busy++;
          if (this.delay[i] > 0) {
            this.delay[i] -= dt;
            break;
          }
          // wind: push downwind (+x) with turbulence, weaker at the lee edge of the tray
          const lee = clamp((halfW - 0.6 - this.pos[p]) / 1.5);
          const push = st === BLOWN ? (0.6 + this.gust) * lee : 0;
          this.vel[p] += (push + Math.sin(time * 6 + this.seed[i] * 30) * 0.8) * dt;
          this.vel[p + 2] += Math.cos(time * 5 + this.seed[i] * 50) * 0.8 * dt;
          this.vel[p] *= Math.exp(-0.9 * dt);
          this.vel[p + 2] *= Math.exp(-0.9 * dt);
          this.vel[p + 1] -= 7.5 * dt;
          this.pos[p] += this.vel[p] * dt;
          this.pos[p + 1] += this.vel[p + 1] * dt;
          this.pos[p + 2] += this.vel[p + 2] * dt;
          if (this.pos[p] > halfW) {
            this.pos[p] = halfW;
            this.vel[p] *= -0.2;
          } else if (this.pos[p] < -halfW) {
            this.pos[p] = -halfW;
            this.vel[p] *= -0.2;
          }
          if (Math.abs(this.pos[p + 2]) > halfD) {
            this.pos[p + 2] = Math.sign(this.pos[p + 2]) * halfD;
            this.vel[p + 2] *= -0.2;
          }
          const ground = this.pileTop(this.cellIndex(this.pos[p], this.pos[p + 2]));
          if (this.pos[p + 1] <= ground && this.vel[p + 1] < 0) {
            if (st === PUFF) {
              // landed near its letter: drift back into place
              this.state[i] = FLY;
              this.from[p] = this.pos[p];
              this.from[p + 1] = ground;
              this.from[p + 2] = this.pos[p + 2];
              this.t[i] = 0;
              this.dur[i] = rand(0.6, 1.1);
              this.delay[i] = rand(0.2, 0.7);
              v!.settled = false;
            } else {
              this.land(i);
              pileChanged = true;
            }
          }
          break;
        }
        case SINK:
          busy++;
          this.scale[i] -= dt * 1.2;
          this.pos[p + 1] -= dt * 0.02;
          if (this.scale[i] <= 0) {
            this.scale[i] = 0;
            this.state[i] = FREE;
            this.owner[i] = -1;
            this.freeList.push(i);
          }
          break;
        case PILE:
          break;
      }
      // write matrix: uniform scale + translation
      const s = this.state[i] === FREE ? 0 : this.grainR(i, v) * this.scale[i];
      const o = i * 16;
      arr[o] = s;
      arr[o + 5] = s * 0.8;
      arr[o + 10] = s;
      arr[o + 12] = this.pos[p];
      arr[o + 13] = this.pos[p + 1];
      arr[o + 14] = this.pos[p + 2];
      arr[o + 15] = 1;
    }
    // per-letter settle state
    for (const v of this.letters.values()) {
      if (v.settled) continue;
      let done = true;
      for (const i of v.grains) if (this.state[i] !== SET) {
        done = false;
        break;
      }
      if (done) {
        v.settled = true;
        this.ctx.audio.play('tick', { gain: 0.08, pitch: 0.5 });
      }
    }
    // small sand dust as grains rain into place / land
    if (busy && Math.random() < 0.25 * this.ctx.tempo.detail) {
      const i = (Math.random() * C) | 0;
      if (this.state[i] === BLOWN) this.dust.emit({ x: this.pos[i * 3], y: this.pos[i * 3 + 1], z: this.pos[i * 3 + 2], vx: 1.5, vy: 0.1, vz: 0, life: 0.8, color: 0xf3e3c6, size: 1.4 });
    }
    this.mesh.instanceMatrix.needsUpdate = true;
    if (pileChanged) this.ctx.audio.play('tap', { gain: 0.04, pitch: 0.6, minGap: 0.15 });
    let dirty = false;
    for (const v of this.letters.values()) if (v.dirty) dirty = true;
    this.active = busy || dirty ? 1 : 0;
    // one more pass next frame to write final matrices
    return busy > 0;
  }

  /* ------------------------------------------------------------- dispose */

  disposeWorld(): void {
    this.ctx.renderer.canvas.removeEventListener('pointerdown', this.onPointerDown);
    this.wind.dispose();
    this.dust.dispose();
    this.mesh.dispose();
    super.disposeWorld();
    this.geo.dispose();
    this.mat.dispose();
    this.bedTex.dispose();
    for (const d of this.disposables) d.dispose();
    this.byId.clear();
    this.stacks.clear();
  }
}

export function create(ctx: WorldContext) {
  return new SandWorld(ctx);
}

export const whiteSand: WorldModule = { create };
