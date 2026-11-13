/**
 * WORLD 13 · Skywriting (飞机烟迹)
 *
 * 一架特技小飞机在夜空里逐笔“写”出每个字母：
 * - 机尾喷出有体积感的烟（受光面亮、背光面偏蓝灰的软体积烟团），烟团随时间
 *   膨胀扩散，并在风场中缓慢漂移，但始终锚定在字形上保持可读。
 * - 镜头柔和地跟随飞机（只做小幅平移，文字始终在画面内），不会打断连续输入：
 *   输入永不阻塞，排队的字母继续流动，落后太多时由“幽灵笔”直接补写烟迹。
 * - Backspace：该字母的烟被风吹散、淡去。
 * - Enter：飞机在单词下方拉出一道花式下划线，整句烟字展示片刻后慢慢化入云中。
 */
import * as THREE from 'three';
import type { DeleteEvent, InsertEvent, LetterRef, SaveOutcome, WorldContext, WorldInstance, WorldModule } from '../engine/types';
import type { Slot } from '../engine/layout';
import type { EvenPoint } from '../engine/glyphs/glyph-engine';
import { canvasTexture, disposeObject, fitCameraToWidth } from '../engine/letter-world';
import { ToolController } from '../engine/tools';

/* =====================================================================
 * Pure smoke simulation — exported for headless tests.
 * ===================================================================== */

/** layered wind: steady breeze + slow swirling gusts */
export function wind(x: number, y: number, z: number, t: number, out: { x: number; y: number; z: number }) {
  out.x = 0.22 + Math.sin(y * 0.55 + t * 0.23) * 0.12 + Math.sin(z * 0.8 + t * 0.4) * 0.05;
  out.y = 0.04 + Math.cos(x * 0.45 + t * 0.19) * 0.08;
  out.z = Math.sin((x + y) * 0.35 + t * 0.21) * 0.07;
  return out;
}

export const S_OFF = 0;
/** anchored to a letter (drifts a bounded amount) */
export const S_ANCHOR = 1;
/** free: blown by the wind, fading */
export const S_FREE = 2;

export interface SmokeOwner {
  /** world position of glyph-local (gx, gy) into out */
  place(gx: number, gy: number, out: { x: number; y: number; z: number }): void;
  size: number;
}

export class SmokeField {
  readonly cap: number;
  n = 0;
  active = 0;
  state: Uint8Array;
  owner: (SmokeOwner | null)[];
  gx: Float32Array; gy: Float32Array; gz: Float32Array;
  ox: Float32Array; oy: Float32Array; oz: Float32Array;
  px: Float32Array; py: Float32Array; pz: Float32Array;
  vx: Float32Array; vy: Float32Array; vz: Float32Array;
  age: Float32Array; life: Float32Array;
  size0: Float32Array; sizeMax: Float32Array; size: Float32Array;
  alpha: Float32Array; rot: Float32Array; spin: Float32Array; seed: Float32Array;
  private freeList: Int32Array;
  private freeTop = 0;
  private w = { x: 0, y: 0, z: 0 };
  private p = { x: 0, y: 0, z: 0 };

  constructor(cap: number) {
    this.cap = cap;
    const f = () => new Float32Array(cap);
    this.state = new Uint8Array(cap);
    this.owner = new Array(cap).fill(null);
    this.gx = f(); this.gy = f(); this.gz = f();
    this.ox = f(); this.oy = f(); this.oz = f();
    this.px = f(); this.py = f(); this.pz = f();
    this.vx = f(); this.vy = f(); this.vz = f();
    this.age = f(); this.life = f();
    this.size0 = f(); this.sizeMax = f(); this.size = f();
    this.alpha = f(); this.rot = f(); this.spin = f(); this.seed = f();
    this.freeList = new Int32Array(cap);
    for (let i = cap - 1; i >= 0; i--) this.freeList[this.freeTop++] = i;
  }

  get available() {
    return this.freeTop;
  }

  private take(rand: () => number) {
    if (!this.freeTop) return -1;
    const i = this.freeList[--this.freeTop];
    if (i >= this.n) this.n = i + 1;
    this.active++;
    this.age[i] = 0;
    this.ox[i] = this.oy[i] = this.oz[i] = 0;
    this.vx[i] = this.vy[i] = this.vz[i] = 0;
    this.rot[i] = rand() * 6.283;
    this.spin[i] = (rand() - 0.5) * 0.4;
    this.seed[i] = rand();
    this.alpha[i] = 0;
    return i;
  }

  /** puff anchored to a letter at glyph-local (gx, gy) with depth gz */
  anchor(owner: SmokeOwner, gx: number, gy: number, gz: number, size0: number, sizeMax: number, rand = Math.random, age = 0) {
    const i = this.take(rand);
    if (i < 0) return -1;
    this.state[i] = S_ANCHOR;
    this.owner[i] = owner;
    this.gx[i] = gx; this.gy[i] = gy; this.gz[i] = gz;
    this.size0[i] = size0; this.sizeMax[i] = sizeMax;
    this.life[i] = Infinity;
    this.age[i] = age;
    owner.place(gx, gy, this.p);
    this.px[i] = this.p.x; this.py[i] = this.p.y; this.pz[i] = this.p.z + gz;
    this.size[i] = size0;
    return i;
  }

  /** free puff (wisps, finale trails) */
  free(x: number, y: number, z: number, vx: number, vy: number, vz: number, size0: number, sizeMax: number, life: number, rand = Math.random) {
    const i = this.take(rand);
    if (i < 0) return -1;
    this.state[i] = S_FREE;
    this.owner[i] = null;
    this.px[i] = x; this.py[i] = y; this.pz[i] = z;
    this.vx[i] = vx; this.vy[i] = vy; this.vz[i] = vz;
    this.size0[i] = size0; this.sizeMax[i] = sizeMax; this.size[i] = size0;
    this.life[i] = life;
    return i;
  }

  /** detach every puff of `owner`: the wind takes it */
  scatter(owner: SmokeOwner, life: number, gust: number, rand = Math.random) {
    for (let i = 0; i < this.n; i++) {
      if (this.state[i] !== S_ANCHOR || this.owner[i] !== owner) continue;
      this.state[i] = S_FREE;
      this.owner[i] = null;
      this.vx[i] = (rand() - 0.3) * gust;
      this.vy[i] = (rand() - 0.4) * gust * 0.6;
      this.vz[i] = (rand() - 0.5) * gust * 0.5;
      this.life[i] = this.age[i] + life * (0.7 + rand() * 0.6);
      this.sizeMax[i] *= 1.5;
    }
  }

  /** shorten every free puff's remaining life (clears the stage for new writing) */
  hurry(maxLeft: number) {
    for (let i = 0; i < this.n; i++) {
      if (this.state[i] !== S_FREE) continue;
      const lim = this.age[i] + maxLeft;
      if (this.life[i] > lim) this.life[i] = lim;
    }
  }

  release(i: number) {
    if (!this.state[i]) return;
    this.state[i] = S_OFF;
    this.owner[i] = null;
    this.freeList[this.freeTop++] = i;
    this.active--;
    while (this.n > 0 && !this.state[this.n - 1]) this.n--;
  }

  /** returns number of free (moving / fading) puffs */
  step(dt: number, t: number): number {
    let moving = 0;
    const w = this.w;
    const p = this.p;
    for (let i = 0; i < this.n; i++) {
      const st = this.state[i];
      if (!st) continue;
      const age = (this.age[i] += dt);
      // volume: puffs swell and spread, fast at first then slowly
      const grow = 1 - Math.exp(-age / 1.6);
      this.size[i] = this.size0[i] + (this.sizeMax[i] - this.size0[i]) * grow;
      this.rot[i] += this.spin[i] * dt;
      if (st === S_ANCHOR) {
        const o = this.owner[i]!;
        o.place(this.gx[i], this.gy[i], p);
        wind(p.x, p.y, p.z, t, w);
        // bounded drift so the letter stays readable
        const k1 = 0.32 * o.size, k2 = 0.55;
        this.ox[i] += (w.x * k1 - this.ox[i] * k2) * dt;
        this.oy[i] += (w.y * k1 + Math.sin(t * 0.7 + this.seed[i] * 9) * 0.02 * o.size - this.oy[i] * k2) * dt;
        this.oz[i] += (w.z * k1 - this.oz[i] * k2) * dt;
        this.px[i] = p.x + this.ox[i];
        this.py[i] = p.y + this.oy[i];
        this.pz[i] = p.z + this.gz[i] + this.oz[i];
        this.alpha[i] = Math.min(1, age * 7);
      } else {
        moving++;
        wind(this.px[i], this.py[i], this.pz[i], t, w);
        const k = Math.min(1, dt * 1.2);
        this.vx[i] += (w.x * 1.6 - this.vx[i]) * k;
        this.vy[i] += (w.y * 1.6 + 0.05 - this.vy[i]) * k;
        this.vz[i] += (w.z * 1.6 - this.vz[i]) * k;
        this.px[i] += this.vx[i] * dt;
        this.py[i] += this.vy[i] * dt;
        this.pz[i] += this.vz[i] * dt;
        const life = this.life[i];
        const left = life - age;
        if (left <= 0) {
          this.release(i);
          continue;
        }
        this.alpha[i] = Math.min(1, age * 6, left / Math.min(1.5, life * 0.6));
      }
    }
    return moving;
  }
}

/* =====================================================================
 * World
 * ===================================================================== */

interface LetterRec extends SmokeOwner {
  id: number;
  slot: Slot;
  pts: EvenPoint[];
  emitted: number;
  done: boolean;
}

interface Flyby {
  t: number;
  /** smoke-off reposition (around the word, not through it) */
  pre: number;
  from: THREE.Vector3;
  via: THREE.Vector3;
  dur: number;
  p0: THREE.Vector3;
  p1: THREE.Vector3;
  p2: THREE.Vector3;
  p3: THREE.Vector3;
}

interface Finale {
  recs: LetterRec[];
  t: number;
  scattered: boolean;
}

function smallDevice(ctx: WorldContext) {
  const { width, height } = ctx.renderer.size;
  const coarse = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
  return Math.min(width, height) < 560 || (coarse && Math.max(width, height) < 1100);
}

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** soft cauliflower puff texture */
function puffTexture() {
  const R = rng(77);
  return canvasTexture(128, 128, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    for (let k = 0; k < 18; k++) {
      const a = R() * Math.PI * 2;
      const d = R() * w * 0.2;
      const x = w / 2 + Math.cos(a) * d;
      const y = h / 2 + Math.sin(a) * d;
      const r = w * (0.16 + R() * 0.18);
      const gr = g.createRadialGradient(x, y, 0, x, y, r);
      const v = Math.round(200 + R() * 55);
      gr.addColorStop(0, `rgba(${v},${v},${v},0.55)`);
      gr.addColorStop(0.6, `rgba(${v},${v},${v},0.22)`);
      gr.addColorStop(1, `rgba(${v},${v},${v},0)`);
      g.fillStyle = gr;
      g.fillRect(0, 0, w, h);
    }
  }, { srgb: false });
}

/** instanced camera-facing puffs with top-lit volume shading */
function puffLayer(cap: number, map: THREE.Texture, opts: { fogNear: number; fogFar: number; fogColor: number }) {
  const geo = new THREE.InstancedBufferGeometry();
  const quad = new THREE.PlaneGeometry(1, 1);
  geo.index = quad.index;
  geo.setAttribute('position', quad.getAttribute('position'));
  geo.setAttribute('uv', quad.getAttribute('uv'));
  const iPos = new THREE.InstancedBufferAttribute(new Float32Array(cap * 3), 3);
  const iData = new THREE.InstancedBufferAttribute(new Float32Array(cap * 4), 4);
  iPos.setUsage(THREE.DynamicDrawUsage);
  iData.setUsage(THREE.DynamicDrawUsage);
  geo.setAttribute('iPos', iPos);
  geo.setAttribute('iData', iData);
  geo.instanceCount = 0;
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uMap: { value: map },
      uLit: { value: new THREE.Color(0xeef2fa) },
      uShade: { value: new THREE.Color(0x56657c) },
      uFog: { value: new THREE.Color(opts.fogColor) },
      uFogNear: { value: opts.fogNear },
      uFogFar: { value: opts.fogFar },
    },
    vertexShader: `attribute vec3 iPos; attribute vec4 iData; varying vec2 vUv; varying vec2 vQ; varying float vA; varying float vFog; varying float vSeed;
      uniform float uFogNear; uniform float uFogFar;
      void main(){
        vec4 mv = modelViewMatrix * vec4(iPos, 1.0);
        float c = cos(iData.z), s = sin(iData.z);
        vec2 q = position.xy;
        mv.xy += vec2(c*q.x - s*q.y, s*q.x + c*q.y) * iData.x;
        vUv = uv; vQ = q; vA = iData.y; vSeed = iData.w;
        vFog = smoothstep(uFogNear, uFogFar, -mv.z);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `uniform sampler2D uMap; uniform vec3 uLit; uniform vec3 uShade; uniform vec3 uFog; varying vec2 vUv; varying vec2 vQ; varying float vA; varying float vFog; varying float vSeed;
      void main(){
        vec4 tx = texture2D(uMap, vUv);
        float a = tx.a * vA;
        if (a < 0.01) discard;
        // light from above-right: top of each puff bright, underside cooler
        float l = smoothstep(-0.55, 0.45, vQ.y + vQ.x*0.25 + (tx.r - 0.85)*1.4);
        vec3 col = mix(uShade, uLit, l) * (0.94 + vSeed*0.08);
        col = mix(col, uFog, vFog);
        gl_FragColor = vec4(col, a);
        #include <colorspace_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  return { mesh, geo, mat, iPos, iData, quad };
}

export function create(ctx: WorldContext): WorldInstance {
  const root = new THREE.Group();
  ctx.scene.add(root);
  const small = smallDevice(ctx);
  const q = ctx.quality;
  const R = rng(1313);

  /* ------------------------------------------------------------ night sky */
  // minimal dark stage (classic 3D Type look): near-black night, a few faint stars
  const NIGHT = 0x03050a;
  ctx.scene.background = new THREE.Color(NIGHT);
  ctx.scene.fog = new THREE.Fog(NIGHT, 60, 190);

  const amb = new THREE.HemisphereLight(0x8fa2c8, 0x0a0806, 0.35);
  root.add(amb);
  const moonLight = new THREE.DirectionalLight(0xc8d6ff, 1.1);
  moonLight.position.set(-5, 8, 6);
  root.add(moonLight);

  const nStars = small ? 160 : 320;
  const starPos = new Float32Array(nStars * 3);
  for (let i = 0; i < nStars; i++) {
    starPos[i * 3] = (R() - 0.5) * 260;
    starPos[i * 3 + 1] = -20 + R() * 110;
    starPos[i * 3 + 2] = -90 - R() * 40;
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0x9aa6c0, size: 1.6, sizeAttenuation: false, fog: false, transparent: true, opacity: 0.55, depthWrite: false }));
  stars.renderOrder = -5;
  root.add(stars);

  const puffMap = puffTexture();

  /* ---------------------------------------------------------------- smoke */
  const CAP = Math.round((q === 2 ? 6000 : q === 1 ? 4200 : 2600) * (small ? 0.55 : 1));
  const smoke = new SmokeField(CAP);
  const smokeLayer = puffLayer(CAP, puffMap, { fogNear: 40, fogFar: 160, fogColor: NIGHT });
  smokeLayer.mesh.renderOrder = 2;
  root.add(smokeLayer.mesh);
  const SUB = q === 2 && !small ? 2 : 1;

  /* ---------------------------------------------------------------- plane */
  const plane = new THREE.Group();
  const red = new THREE.MeshStandardMaterial({ color: 0xe0362c, roughness: 0.42, metalness: 0.25 });
  const white = new THREE.MeshStandardMaterial({ color: 0xf6f4ef, roughness: 0.5, metalness: 0.1 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x1d2a38, roughness: 0.15, metalness: 0.6 });
  {
    const prof = [[0, -0.55], [0.035, -0.5], [0.06, -0.25], [0.085, 0.05], [0.09, 0.25], [0.075, 0.4], [0.05, 0.47], [0, 0.5]].map(([r, y]) => new THREE.Vector2(r, y));
    const bodyGeo = new THREE.LatheGeometry(prof, 12);
    bodyGeo.rotateX(Math.PI / 2);
    plane.add(new THREE.Mesh(bodyGeo, red));
    const wing = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.025, 0.17), white);
    wing.position.set(0, -0.02, 0.1);
    plane.add(wing);
    const tipGeo = new THREE.BoxGeometry(0.14, 0.03, 0.172);
    for (const sx of [-1, 1]) {
      const tip = new THREE.Mesh(tipGeo, red);
      tip.position.set(sx * 0.42, -0.02, 0.1);
      plane.add(tip);
    }
    const tailWing = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.02, 0.09), white);
    tailWing.position.set(0, 0.01, -0.44);
    plane.add(tailWing);
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.15, 0.12), red);
    fin.position.set(0, 0.08, -0.45);
    plane.add(fin);
    const canopy = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), dark);
    canopy.scale.set(0.8, 0.9, 1.6);
    canopy.position.set(0, 0.06, 0.08);
    plane.add(canopy);
    const hub = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.06, 10), dark);
    hub.rotation.x = Math.PI / 2;
    hub.position.z = 0.52;
    plane.add(hub);
  }
  const prop = new THREE.Mesh(
    new THREE.CircleGeometry(0.13, 20),
    new THREE.MeshBasicMaterial({ color: 0x223040, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false })
  );
  prop.position.z = 0.51;
  plane.add(prop);
  const planeRoot = new THREE.Group();
  planeRoot.add(plane);
  root.add(planeRoot);
  const TAIL = 0.55; // nozzle distance behind the centre (model units)

  /* ------------------------------------------------------- writer (1 plane) */
  const writer = new ToolController(ctx.glyphs, ctx.layout, {
    count: 1,
    liftHeight: 0.55,
    maxQueue: 3,
    approach: 0.3,
    rest: () => new THREE.Vector3(3, 2.5, 0.6),
    restDelay: 1e9,
  });
  const tool = writer.tools[0];

  const letters = new Map<number, LetterRec>();
  const finales: Finale[] = [];
  let flyby: Flyby | null = null;
  const tmp = new THREE.Vector3();

  function letterCount() {
    let n = 0;
    for (const r of ctx.letters()) if (r.char.trim()) n++;
    return n;
  }

  function makeRec(ev: InsertEvent, slot: Slot): LetterRec {
    const glyph = ctx.glyphs.get(ev.char, 'sans');
    const n = Math.max(1, letterCount());
    const spacing = (small ? 0.075 : 0.055) * Math.max(1, n / (small ? 10 : 14)) * (q === 0 ? 1.2 : 1);
    const rec: LetterRec = {
      id: ev.id,
      slot,
      pts: glyph.length ? ctx.glyphs.evenPoints(glyph, Math.min(0.14, spacing)) : [],
      emitted: 0,
      done: false,
      size: slot.size,
      place(gx, gy, out) {
        ctx.layout.toWorld(rec.slot, gx, gy, 0, tmp);
        out.x = tmp.x; out.y = tmp.y; out.z = tmp.z;
      },
    };
    return rec;
  }

  /** emit anchored puffs along the stroke up to drawn fraction u */
  function emitTo(rec: LetterRec, u: number, age = 0) {
    const s = rec.slot.size;
    while (rec.emitted < rec.pts.length && rec.pts[rec.emitted].u <= u + 1e-4) {
      const p = rec.pts[rec.emitted++];
      for (let k = 0; k < SUB; k++) {
        const off = (R() - 0.5) * 0.05;
        smoke.anchor(rec, p.x - p.ty * off, p.y + p.tx * off, (R() - 0.5) * 0.14 * s, 0.07 * s, (0.17 + R() * 0.07) * s, R, age);
      }
    }
  }

  function startWriting(rec: LetterRec, glyphChar: string) {
    const glyph = ctx.glyphs.get(glyphChar, 'sans');
    const dur = ctx.tempo.duration(1000, 300);
    writer.write({
      id: rec.id,
      glyph,
      slot: rec.slot,
      duration: dur,
      onStart: () => {
        flyby = null;
      },
      onProgress: (sample, tip) => {
        if (!letters.has(rec.id) && !finales.some((f) => f.recs.includes(rec))) return;
        emitTo(rec, sample.u);
        // loose wisps right behind the nozzle
        if (tip && sample.down && R() < (small ? 0.35 : 0.7)) {
          const s = rec.slot.size;
          smoke.free(tip.x, tip.y, tip.z, -tool.vel.x * 0.04, -tool.vel.y * 0.04, (R() - 0.5) * 0.2, 0.05 * s, 0.22 * s, 1.1 + R() * 0.6, R);
        }
      },
      onDone: () => {
        emitTo(rec, 1);
        rec.done = true;
      },
    });
  }

  /* ------------------------------------------------------------ flight look */
  const heading = new THREE.Vector3(1, 0, 0);
  const prevTip = tool.tip.clone();
  const vel = new THREE.Vector3();
  let bank = 0;
  let planeScale = 0.55;
  let loiterT = 0;
  const loiterTarget = new THREE.Vector3();
  const upHint = new THREE.Vector3(0, 0.35, 1).normalize();
  const basis = new THREE.Matrix4();
  const xAxis = new THREE.Vector3();
  const yAxis = new THREE.Vector3();
  const qBank = new THREE.Quaternion();

  function updatePlane(dt: number, t: number) {
    const writing = !!tool.job || tool.queue.length > 0;
    if (!writing) {
      if (flyby) {
        flyby.t += dt;
        if (flyby.t < flyby.pre) {
          // loop over the top of the word to the start of the underline, smoke off
          const k = flyby.t / flyby.pre;
          const e = k * k * (3 - 2 * k);
          const a = 1 - e;
          tool.tip.set(0, 0, 0).addScaledVector(flyby.from, a * a).addScaledVector(flyby.via, 2 * a * e).addScaledVector(flyby.p0, e * e);
        } else {
          const k = Math.min(1, (flyby.t - flyby.pre) / flyby.dur);
          const a = 1 - k;
          tool.tip.set(0, 0, 0)
            .addScaledVector(flyby.p0, a * a * a)
            .addScaledVector(flyby.p1, 3 * a * a * k)
            .addScaledVector(flyby.p2, 3 * a * k * k)
            .addScaledVector(flyby.p3, k * k * k);
          // underline swoosh
          if (k < 0.8) {
            for (let j = 0; j < SUB; j++) smoke.free(tool.tip.x, tool.tip.y, tool.tip.z + (R() - 0.5) * 0.1, 0, 0, 0, 0.07, 0.24 + R() * 0.06, 3.4 + R(), R);
          }
          if (k >= 1) flyby = null;
        }
      } else {
        // loiter near the cursor, ready for the next key
        loiterT += dt * (ctx.reducedMotion ? 0.6 : 1.1);
        const c = ctx.layout.cursor(loiterTarget);
        c.x += 0.9 + Math.cos(loiterT) * 1.1;
        c.y += 1.3 + Math.sin(loiterT) * 0.45;
        c.z += 0.6 + Math.sin(loiterT) * 0.5;
        tool.tip.lerp(c, 1 - Math.exp(-2.4 * dt));
      }
    }
    if (dt > 0) vel.subVectors(tool.tip, prevTip).divideScalar(dt);
    prevTip.copy(tool.tip);
    const sp = vel.length();
    if (sp > 0.05) {
      tmp.copy(vel).divideScalar(sp);
      const before = heading.clone();
      heading.lerp(tmp, 1 - Math.exp(-(writing ? 14 : 5) * dt)).normalize();
      // bank into turns
      const turn = before.cross(heading).z / Math.max(dt, 1e-3);
      bank += (THREE.MathUtils.clamp(-turn * 0.22, -1.1, 1.1) - bank) * Math.min(1, dt * 6);
    } else bank *= 1 - Math.min(1, dt * 3);

    const size = (letters.size ? [...letters.values()][letters.size - 1].slot.size : 1) || 1;
    planeScale += (0.5 * Math.max(0.6, size) - planeScale) * Math.min(1, dt * 2);
    planeRoot.scale.setScalar(planeScale);
    // nozzle sits on the pen tip, the plane slightly in front of the smoke
    planeRoot.position.copy(tool.tip).addScaledVector(heading, TAIL * planeScale);
    planeRoot.position.z += 0.12 * planeScale;
    // orientation: forward = heading, top tilted towards the viewer
    yAxis.copy(upHint).addScaledVector(heading, -upHint.dot(heading));
    if (yAxis.lengthSq() < 1e-4) yAxis.set(0, 1, 0);
    yAxis.normalize();
    xAxis.crossVectors(yAxis, heading).normalize();
    basis.makeBasis(xAxis, yAxis, heading);
    planeRoot.quaternion.setFromRotationMatrix(basis);
    qBank.setFromAxisAngle(tmp.set(0, 0, 1), bank);
    plane.quaternion.copy(qBank);
    prop.rotation.z = t * 40;
    (prop.material as THREE.MeshBasicMaterial).opacity = 0.18 + Math.sin(t * 50) * 0.04;
  }

  /* --------------------------------------------------------------- camera */
  const cam = ctx.camera;
  let camDist = 11;
  const camTarget = new THREE.Vector3(0, 0.3, 0);
  let camInit = false;
  function updateCamera(dt: number) {
    const b = ctx.layout.bounds;
    let cx = 0, cy = 0.3, w = 0;
    if (!b.isEmpty()) {
      cx = (b.min.x + b.max.x) / 2;
      cy = (b.min.y + b.max.y) / 2 + 0.2;
      w = b.max.x - b.min.x;
    }
    for (const f of finales) {
      if (f.scattered) continue;
      for (const r of f.recs) w = Math.max(w, Math.abs(r.slot.origin.x - cx) * 2 + r.slot.advance);
    }
    const d = fitCameraToWidth(cam, Math.max(w + 2.2, 7), 11, cam.aspect || 1);
    // follow the aircraft a little — the text block stays framed
    const hfov = Math.atan(Math.tan((cam.fov * Math.PI) / 360) * (cam.aspect || 1));
    const slackX = Math.max(0.3, Math.tan(hfov) * d - (w / 2 + 0.6));
    const slackY = 0.9;
    const fx = THREE.MathUtils.clamp((planeRoot.position.x - cx) * 0.3, -slackX, slackX);
    const fy = THREE.MathUtils.clamp((planeRoot.position.y - cy) * 0.25, -slackY, slackY);
    const k = camInit ? 1 - Math.exp(-1.6 * dt) : 1;
    camInit = true;
    camDist += (d - camDist) * k;
    camTarget.x += (cx + fx - camTarget.x) * k;
    camTarget.y += (cy + fy - camTarget.y) * k;
    cam.position.set(camTarget.x, camTarget.y + 0.25, camDist);
    cam.lookAt(camTarget.x, camTarget.y, 0);
  }

  /* -------------------------------------------------------------- render */
  const P = smokeLayer.iPos.array as Float32Array;
  const D = smokeLayer.iData.array as Float32Array;
  function writeSmoke() {
    let c = 0;
    for (let i = 0; i < smoke.n; i++) {
      if (!smoke.state[i]) continue;
      P[c * 3] = smoke.px[i];
      P[c * 3 + 1] = smoke.py[i];
      P[c * 3 + 2] = smoke.pz[i];
      D[c * 4] = smoke.size[i];
      D[c * 4 + 1] = smoke.alpha[i] * 0.9;
      D[c * 4 + 2] = smoke.rot[i];
      D[c * 4 + 3] = smoke.seed[i];
      c++;
    }
    smokeLayer.geo.instanceCount = c;
    smokeLayer.iPos.needsUpdate = true;
    smokeLayer.iData.needsUpdate = true;
  }

  /* ------------------------------------------------------------ idle pump */
  let lastNow = performance.now();
  let clock = 0;
  let pumpTimer = 0;
  let disposed = false;
  function schedulePump() {
    if (pumpTimer || disposed) return;
    pumpTimer = window.setTimeout(() => {
      pumpTimer = 0;
      if (!disposed && !document.hidden) ctx.keepAlive(1);
    }, 33);
  }

  return {
    onCharacterInput(ev: InsertEvent) {
      if (!ev.char.trim()) return; // space: the layout leaves the gap
      const slot = ctx.slotOf(ev.id);
      if (!slot) return;
      const rec = makeRec(ev, slot);
      letters.set(ev.id, rec);
      if (ev.restoring) {
        emitTo(rec, 1, 6);
        rec.done = true;
        return;
      }
      // a new word starts: the previous one gives way quickly
      if (finales.length || smoke.active > 0) {
        for (const f of finales) for (const r of f.recs) smoke.scatter(r, 0.9, 1.2, R);
        finales.length = 0;
        smoke.hurry(0.9);
      }
      startWriting(rec, ev.char);
      ctx.audio.play('whoosh', { pitch: 1.25 + R() * 0.2, gain: 0.25, minGap: 60 });
      ctx.keepAlive(1500);
    },

    onCharacterDelete(ev: DeleteEvent) {
      writer.cancel(ev.id);
      const rec = letters.get(ev.id);
      if (!rec) return;
      letters.delete(ev.id);
      smoke.scatter(rec, 1.6, 1.4, R);
      ctx.audio.play('whoosh', { pitch: 0.7, gain: 0.22, minGap: 50 });
      ctx.keepAlive(1800);
    },

    onLayout() {
      for (const [id, rec] of letters) {
        const s = ctx.slotOf(id);
        if (s) {
          rec.slot = s;
          rec.size = s.size;
        }
      }
    },

    onWordComplete(_word: string, refs: readonly LetterRef[], saved: Promise<SaveOutcome>) {
      // Enter owns the letters: finish any pending writing instantly (never blocks)
      writer.flush();
      const recs: LetterRec[] = [];
      let x0 = Infinity, x1 = -Infinity, y0 = Infinity;
      for (const r of refs) {
        const rec = letters.get(r.id);
        if (!rec) continue;
        letters.delete(r.id);
        emitTo(rec, 1);
        recs.push(rec);
        x0 = Math.min(x0, rec.slot.origin.x);
        x1 = Math.max(x1, rec.slot.origin.x + rec.slot.advance);
        y0 = Math.min(y0, rec.slot.origin.y);
      }
      if (recs.length) {
        finales.push({ recs, t: 0, scattered: false });
        // flourish: swoop under the word and pull up
        const s = recs[0].slot.size;
        const from = tool.tip.clone();
        const w = x1 - x0;
        flyby = {
          t: 0,
          pre: 0.9,
          from,
          via: new THREE.Vector3((from.x + x0) / 2, Math.max(from.y, y0 + s) + 2.2 * s, 1.2),
          dur: 1.1 + w * 0.08,
          p0: new THREE.Vector3(x0 - 0.9, y0 - 0.5 * s, 0.3),
          p1: new THREE.Vector3(x0 + w * 0.35, y0 - 0.75 * s, 0.3),
          p2: new THREE.Vector3(x1 - w * 0.05, y0 - 0.7 * s, 0.3),
          p3: new THREE.Vector3(x1 + 1.3, y0 + 1.2 * s, 0.5),
        };
      }
      ctx.audio.play('success', { gain: 0.6 });
      saved.then((res) => {
        if (!res.ok) ctx.audio.play('error', { gain: 0.4 });
      });
      ctx.keepAlive(4000);
    },

    onTextClear(refs: readonly LetterRef[]) {
      for (const r of refs) {
        writer.cancel(r.id);
        const rec = letters.get(r.id);
        if (!rec) continue;
        letters.delete(r.id);
        smoke.scatter(rec, 1.6, 1.4, R);
      }
      ctx.keepAlive(1800);
    },

    updateAnimation(): boolean {
      const now = performance.now();
      const dt = Math.min(0.05, Math.max(0, (now - lastNow) / 1000));
      lastNow = now;
      clock += dt;
      const t = clock;

      writer.update(dt);
      updatePlane(dt, t);

      for (let fi = finales.length - 1; fi >= 0; fi--) {
        const f = finales[fi];
        f.t += dt;
        if (!f.scattered && f.t > 3.2) {
          f.scattered = true;
          // the word slowly melts into the night
          for (const rec of f.recs) smoke.scatter(rec, 4.5, 0.5, R);
          finales.splice(fi, 1);
        }
      }

      const freeMoving = smoke.step(dt, t);
      writeSmoke();
      updateCamera(dt);

      ctx.tempo.backlog = writer.pending();
      const busy = writer.busy || !!flyby || finales.length > 0 || freeMoving > 0;
      if (!busy) schedulePump();
      return busy;
    },

    disposeWorld() {
      disposed = true;
      if (pumpTimer) clearTimeout(pumpTimer);
      letters.clear();
      finales.length = 0;
      writer.flush();
      smokeLayer.quad.dispose();
      puffMap.dispose();
      disposeObject(root);
    },
  };
}

export const skywriting: WorldModule = { create };
