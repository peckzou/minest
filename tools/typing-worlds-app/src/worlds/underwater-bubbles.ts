/**
 * WORLD 04 · Underwater Bubbles (海底气泡)
 *
 * 气泡从海底升起，在洋流中摆动、螺旋上升，最终聚集成字母：
 * - 气泡大小不一，越大浮力越强、摆动越明显；表面有菲涅尔高光、假折射（内部倒置的
 *   水面明暗）与太阳高光。
 * - 新字母的气泡柱上升时会扰动附近已成形字母（流体扰动）。
 * - Backspace：字母的气泡脱离字形，重新上浮、长大，并在不同高度破裂。
 * - Enter：一道光扫过整个单词，随后气泡从左到右依次释放上浮破裂。
 *
 * 全部气泡共用一个 InstancedMesh + 自定义着色器；微小气泡/破裂水花用粒子。
 */
import * as THREE from 'three';
import type { DeleteEvent, InsertEvent, LetterRef, SaveOutcome, WorldContext, WorldInstance, WorldModule } from '../engine/types';
import type { Slot } from '../engine/layout';
import { disposeObject, fitCameraToWidth } from '../engine/letter-world';
import { Particles } from '../engine/particles';

/* =====================================================================
 * Pure bubble simulation — exported for headless tests.
 * ===================================================================== */

export const B_OFF = 0;
export const B_GATHER = 1;
export const B_RISE = 2;
export const B_POP = 3;

/** gentle ocean current */
export function current(x: number, y: number, z: number, t: number, out: { x: number; z: number }) {
  out.x = Math.sin(y * 0.8 + t * 0.5) * 0.35 + Math.sin(z * 0.6 + t * 0.3) * 0.15 + 0.12;
  out.z = Math.cos(x * 0.5 + t * 0.4) * 0.2;
  return out;
}

export class BubbleField {
  readonly cap: number;
  n = 0;
  active = 0;
  px: Float32Array; py: Float32Array; pz: Float32Array;
  vx: Float32Array; vy: Float32Array; vz: Float32Array;
  /** radius (world) */
  r: Float32Array;
  mode: Uint8Array;
  delay: Float32Array;
  age: Float32Array;
  popY: Float32Array;
  popT: Float32Array;
  seed: Float32Array;
  settle: Float32Array;
  tgx: Float32Array; tgy: Float32Array; tgz: Float32Array;
  /** brightness multiplier (finale light sweep) */
  shine: Float32Array;
  /** tempo multiplier for gathering */
  speed = 1;
  surfaceY = 6;
  /** pops of the last step: x,y,z,r */
  pops: number[] = [];
  private freeList: Int32Array;
  private freeTop = 0;
  private cur = { x: 0, z: 0 };

  constructor(cap: number) {
    this.cap = cap;
    const f = () => new Float32Array(cap);
    this.px = f(); this.py = f(); this.pz = f();
    this.vx = f(); this.vy = f(); this.vz = f();
    this.r = f(); this.delay = f(); this.age = f(); this.popY = f(); this.popT = f(); this.seed = f(); this.settle = f();
    this.tgx = f(); this.tgy = f(); this.tgz = f(); this.shine = f();
    this.mode = new Uint8Array(cap);
    this.freeList = new Int32Array(cap);
    for (let i = cap - 1; i >= 0; i--) this.freeList[this.freeTop++] = i;
  }

  get available() {
    return this.freeTop;
  }

  alloc(x: number, y: number, z: number, r: number, delay = 0, rand = Math.random): number {
    if (!this.freeTop) return -1;
    const i = this.freeList[--this.freeTop];
    this.px[i] = x; this.py[i] = y; this.pz[i] = z;
    this.vx[i] = 0; this.vy[i] = 0.3; this.vz[i] = 0;
    this.r[i] = r;
    this.mode[i] = B_GATHER;
    this.delay[i] = delay;
    this.age[i] = 0;
    this.popT[i] = 0;
    this.settle[i] = 0;
    this.shine[i] = 1;
    this.seed[i] = rand();
    if (i >= this.n) this.n = i + 1;
    this.active++;
    return i;
  }

  release(i: number) {
    if (!this.mode[i]) return;
    this.mode[i] = B_OFF;
    this.freeList[this.freeTop++] = i;
    this.active--;
    while (this.n > 0 && !this.mode[this.n - 1]) this.n--;
  }

  /** let a bubble go: it floats up and pops at `popY` */
  rise(i: number, popY: number, delay = 0) {
    if (this.mode[i] !== B_GATHER) return;
    this.mode[i] = B_RISE;
    this.popY[i] = popY;
    this.age[i] = 0;
    this.delay[i] = delay;
    this.settle[i] = 0;
  }

  /** advance; returns number of gathering bubbles not yet settled */
  step(dt: number, t: number): number {
    if (dt <= 0) return 0;
    this.pops.length = 0;
    let unsettled = 0;
    const cur = this.cur;
    for (let i = 0; i < this.n; i++) {
      const m = this.mode[i];
      if (!m) continue;
      if (this.delay[i] > 0) {
        this.delay[i] -= dt;
        if (m === B_GATHER) unsettled++;
        continue;
      }
      this.age[i] += dt;
      const x = this.px[i], y = this.py[i], z = this.pz[i];
      const rr = this.r[i];
      const sd = this.seed[i];
      let ax = 0, ay = 0, az = 0;
      current(x, y, z, t, cur);
      // bigger bubbles rise faster and zig-zag / spiral more
      const zig = Math.sin(this.age[i] * (6 + sd * 4) + sd * 20) * (0.3 + rr * 9);
      const zig2 = Math.cos(this.age[i] * (6 + sd * 4) + sd * 20) * (0.3 + rr * 9);
      const buoy = 3.6 + rr * 30;
      if (m === B_GATHER) {
        const dx = this.tgx[i] - x, dy = this.tgy[i] - y, dz = this.tgz[i] - z;
        const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
        let w = 1 - d / 0.5;
        w = w < 0 ? 0 : w > 1 ? 1 : w;
        w = w * w * (3 - 2 * w);
        this.settle[i] = w;
        if (w < 0.95) unsettled++;
        const sp = this.speed;
        const below = dy;
        const near = 1 - Math.min(1, Math.max(0, below / 3.5));
        const hk = (1.1 + 5 * near) * sp;
        const gx = dx * hk - this.vx[i] * 2.4 + cur.x * 0.8 + zig;
        const gz = dz * hk - this.vz[i] * 2.4 + cur.z * 0.6 + zig2 * 0.5;
        const gy = (below > 0.05 ? buoy * sp : buoy * 0.15 + dy * 7) - this.vy[i] * 1.4;
        const K = 55, C = 14.8;
        ax = gx * (1 - w) + (dx * K - this.vx[i] * C) * w;
        ay = gy * (1 - w) + (dy * K - this.vy[i] * C) * w;
        az = gz * (1 - w) + (dz * K - this.vz[i] * C) * w;
      } else if (m === B_RISE) {
        ay = buoy * 1.35 - this.vy[i] * 1.1;
        ax = cur.x * 1.3 + zig * 1.2 - this.vx[i] * 0.9;
        az = cur.z + zig2 * 0.6 - this.vz[i] * 0.9;
        // pressure drops → bubble grows while rising
        this.r[i] = rr * (1 + dt * 0.12);
        if (y > this.popY[i] || y > this.surfaceY || this.age[i] > 7) {
          this.mode[i] = B_POP;
          this.popT[i] = 0;
          this.pops.push(x, y, z, rr);
        }
      } else {
        this.popT[i] += dt;
        if (this.popT[i] > 0.13) this.release(i);
        continue;
      }
      this.vx[i] += ax * dt; this.vy[i] += ay * dt; this.vz[i] += az * dt;
      this.px[i] = x + this.vx[i] * dt;
      this.py[i] = y + this.vy[i] * dt;
      this.pz[i] = z + this.vz[i] * dt;
    }
    return unsettled;
  }
}

/** target layout for one letter: main bubbles along the strokes + small filler bubbles */
export function bubbleTargets(points: { x: number; y: number; tx: number; ty: number }[], maxMain: number, rand: () => number) {
  let src = points;
  if (src.length > maxMain) {
    const step = src.length / maxMain;
    src = [];
    for (let k = 0; k < maxMain; k++) src.push(points[Math.floor(k * step)]);
  }
  const gx: number[] = [];
  const gy: number[] = [];
  const rr: number[] = [];
  src.forEach((p, k) => {
    gx.push(p.x + (rand() - 0.5) * 0.02);
    gy.push(p.y + (rand() - 0.5) * 0.02);
    rr.push(k % 3 === 0 ? 0.075 + rand() * 0.015 : 0.052 + rand() * 0.016);
  });
  const fillers = Math.round(src.length * 0.55);
  for (let k = 0; k < fillers && src.length; k++) {
    const p = src[Math.floor(rand() * src.length)];
    const off = (rand() - 0.5) * 0.14;
    const along = (rand() - 0.5) * 0.05;
    gx.push(p.x - p.ty * off + p.tx * along);
    gy.push(p.y + p.tx * off + p.ty * along);
    rr.push(0.02 + rand() * 0.018);
  }
  return { gx: Float32Array.from(gx), gy: Float32Array.from(gy), rr: Float32Array.from(rr) };
}

/* =====================================================================
 * World
 * ===================================================================== */

/** deep-water tint of the classic near-black 3D Type stage */
const WATER = 0x02060b;
const FLOOR_Y = -3.6;
/** fixed seabed vents that keep a few micro bubbles drifting up */
const VENTS: [number, number][] = [[-6.5, -3], [-3.2, -6], [4.1, -4.5], [7.2, -2.2], [0.8, -8]];

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

function isSmallDevice(ctx: WorldContext) {
  const { width, height } = ctx.renderer.size;
  const coarse = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
  return Math.min(width, height) < 560 || (coarse && Math.max(width, height) < 1100);
}

interface LetterRec {
  id: number;
  slot: Slot;
  gx: Float32Array;
  gy: Float32Array;
  rr: Float32Array;
  bub: Int32Array;
  kick: number;
  kickDir: number;
}

interface Finale {
  recs: LetterRec[];
  t: number;
  x0: number;
  x1: number;
  released: boolean;
}

export function create(ctx: WorldContext): WorldInstance {
  const root = new THREE.Group();
  ctx.scene.add(root);
  const small = isSmallDevice(ctx);
  const q = ctx.quality;
  const R = rng(404);

  ctx.scene.background = new THREE.Color(WATER);
  ctx.scene.fog = new THREE.Fog(WATER, 10, 26);
  root.add(new THREE.HemisphereLight(0x6fb8e0, 0x020304, 0.25));
  const key = new THREE.DirectionalLight(0x9fd4ff, 0.5);
  key.position.set(-3, 8, 4);
  root.add(key);
  // dark matte seabed, fading into the water
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(70, 50), new THREE.MeshStandardMaterial({ color: 0x07121b, roughness: 1 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, FLOOR_Y, -8);
  root.add(floor);

  /* ------------------------------------------------------------- bubbles */
  const CAP = Math.round((q === 2 ? 2000 : q === 1 ? 1400 : 800) * (small ? 0.6 : 1));
  const field = new BubbleField(CAP);
  field.surfaceY = 6.2;

  const bubbleGeo = new THREE.IcosahedronGeometry(1, q === 0 || small ? 1 : 2);
  const aAlpha = new THREE.InstancedBufferAttribute(new Float32Array(CAP), 1);
  aAlpha.setUsage(THREE.DynamicDrawUsage);
  bubbleGeo.setAttribute('aAlpha', aAlpha);
  const bubbleMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTop: { value: new THREE.Color(0xd8f6ff) },
      uDeep: { value: new THREE.Color(0x0a3a66) },
      uSun: { value: new THREE.Vector3(0.25, 1, 0.35).normalize() },
    },
    vertexShader: `attribute float aAlpha; varying vec3 vN; varying vec3 vV; varying float vA;
      void main(){
        vec4 wp = modelMatrix * instanceMatrix * vec4(position, 1.0);
        vN = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * normal);
        vV = normalize(cameraPosition - wp.xyz);
        vA = aAlpha;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: `uniform vec3 uTop; uniform vec3 uDeep; uniform vec3 uSun; varying vec3 vN; varying vec3 vV; varying float vA;
      void main(){
        vec3 n = normalize(vN);
        float ndv = max(dot(n, vV), 0.0);
        float rim = pow(1.0 - ndv, 2.4);
        vec3 R = reflect(-vV, n);
        vec3 env = mix(uDeep, uTop, smoothstep(-0.25, 0.85, R.y));
        // fake refraction: the world seen through the bubble is flipped
        vec3 T = refract(-vV, n, 0.75);
        vec3 inner = mix(uTop, uDeep, smoothstep(-0.4, 0.7, T.y));
        float spec = pow(max(dot(R, uSun), 0.0), 70.0) * 1.8;
        float spec2 = pow(max(dot(R, normalize(vec3(-0.6, -0.2, 0.8))), 0.0), 30.0) * 0.35;
        float edge = smoothstep(0.62, 0.97, 1.0 - ndv);
        vec3 col = env * rim * 2.5 + vec3(0.85, 0.97, 1.0) * edge * 0.75 + inner * 0.3 * ndv + vec3(spec + spec2);
        float a = clamp(rim * 1.1 + edge * 0.4 + 0.12 + spec, 0.0, 1.0);
        gl_FragColor = vec4(col * max(vA, 0.0), a * min(vA, 1.0));
      }`,
  });
  const bubbleMesh = new THREE.InstancedMesh(bubbleGeo, bubbleMat, CAP);
  bubbleMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  bubbleMesh.frustumCulled = false;
  bubbleMesh.count = 0;
  bubbleMesh.renderOrder = 5;
  root.add(bubbleMesh);

  // micro bubbles: vent streams, trails, pop sprays
  const fizz = new Particles({ capacity: small ? 600 : 1400, gravity: [0, 1.4, 0], drag: 0.9, size: 0.05, shape: 'ring', opacity: 0.85 });
  root.add(fizz.points);

  /* ------------------------------------------------------------- letters */
  const letters = new Map<number, LetterRec>();
  const finales: Finale[] = [];
  const owner: (LetterRec | null)[] = new Array(CAP).fill(null);
  const ownerK = new Int32Array(CAP);
  const tmpW = new THREE.Vector3();

  function letterCount() {
    let n = 0;
    for (const r of ctx.letters()) if (r.char.trim()) n++;
    return n;
  }

  function spawnLetter(ev: InsertEvent, slot: Slot) {
    const glyph = ctx.glyphs.get(ev.char, 'sans');
    if (!glyph.length) return;
    const n = Math.max(1, letterCount());
    const spacing = 0.068 * Math.max(1, n / (small ? 10 : 16)) * (q === 0 ? 1.25 : 1);
    const pts = ctx.glyphs.evenPoints(glyph, Math.min(0.16, spacing));
    const tg = bubbleTargets(pts, small ? 28 : 38, R);
    const rec: LetterRec = { id: ev.id, slot, gx: tg.gx, gy: tg.gy, rr: tg.rr, bub: new Int32Array(tg.gx.length).fill(-1), kick: 0, kickDir: 1 };
    const s = slot.size;
    const cx = slot.center.x;
    for (let k = 0; k < tg.gx.length; k++) {
      ctx.layout.toWorld(slot, tg.gx[k], tg.gy[k], 0, tmpW);
      let i: number;
      if (ev.restoring) {
        i = field.alloc(tmpW.x, tmpW.y, tmpW.z, tg.rr[k] * s, 0, R);
        if (i >= 0) field.vy[i] = 0;
      } else {
        // rise from the sea floor below the letter, in a few loose streams
        const stream = Math.floor(R() * 3) - 1;
        const x = cx + stream * 0.45 * s + (R() - 0.5) * 0.5 + (tmpW.x - cx) * 0.4;
        const z = -0.6 + (R() - 0.5) * 1.6;
        const delay = (tg.gy[k] + 0.4) * 0.12 + R() * 0.35 + (tg.rr[k] < 0.03 ? 0.1 : 0);
        i = field.alloc(x, FLOOR_Y + 0.15, z, tg.rr[k] * s, delay, R);
        if (i >= 0) field.vy[i] = 1.2 + R() * 0.8;
      }
      if (i < 0) break;
      rec.bub[k] = i;
      owner[i] = rec;
      ownerK[i] = k;
    }
    letters.set(ev.id, rec);
    if (!ev.restoring) {
      // the rising column disturbs neighbouring letters
      for (const other of letters.values()) {
        if (other === rec) continue;
        const dx = other.slot.center.x - cx;
        if (Math.abs(dx) < 2.6 * s && Math.abs(other.slot.center.y - slot.center.y) < 2 * s) {
          other.kick = Math.max(other.kick, 1 - Math.abs(dx) / (2.6 * s));
          other.kickDir = dx >= 0 ? 1 : -1;
        }
      }
      // sand puff + fizz from the floor
      const det = ctx.tempo.detail;
      for (let k = 0; k < Math.round(14 * det); k++) {
        fizz.emit({ x: cx + (R() - 0.5) * 1.2, y: FLOOR_Y + 0.2, z: -0.6 + (R() - 0.5) * 1.4, vx: (R() - 0.5) * 0.3, vy: 0.6 + R() * 1.2, wobble: 1.6, life: 2 + R() * 1.2, size: 0.4 + R() * 0.6, color: 0xdff8ff });
      }
    }
  }

  function releaseRec(rec: LetterRec, spread: number, baseDelay = 0, x0 = 0, x1 = 1) {
    for (let k = 0; k < rec.bub.length; k++) {
      const i = rec.bub[k];
      if (i < 0 || owner[i] !== rec) continue;
      owner[i] = null;
      const sweep = x1 > x0 ? ((field.px[i] - x0) / (x1 - x0)) * 0.7 : 0;
      const popY = field.py[i] + 0.6 + R() * (field.surfaceY - field.py[i]) * (R() < 0.3 ? 1 : 0.45);
      field.rise(i, popY, baseDelay + sweep + R() * spread);
      field.vx[i] += (R() - 0.5) * 0.6;
      field.vy[i] += 0.4 + R() * 0.5;
    }
    rec.bub.fill(-1);
  }

  /* ------------------------------------------------------------- camera */
  const cam = ctx.camera;
  let camDist = 11;
  let camInit = false;
  function updateCamera(dt: number, t: number) {
    const b = ctx.layout.bounds;
    let w = b.isEmpty() ? 0 : b.max.x - b.min.x;
    for (const f of finales) if (!f.released) w = Math.max(w, f.x1 - f.x0);
    const d = fitCameraToWidth(cam, Math.max(w + 1.8, 6.5), 11, cam.aspect || 1);
    camDist = camInit ? camDist + (d - camDist) * (1 - Math.exp(-2.2 * dt)) : d;
    camInit = true;
    const sway = ctx.reducedMotion ? 0 : 1;
    cam.position.set(Math.sin(t * 0.11) * 0.15 * sway, 0.3 + Math.sin(t * 0.15) * 0.07 * sway, camDist);
    cam.lookAt(0, 0.4, 0);
  }

  /* ------------------------------------------------------------- per frame */
  function writeTargets(t: number) {
    const put = (rec: LetterRec, lift: number) => {
      const s = rec.slot.size;
      rec.kick *= 0.94;
      for (let k = 0; k < rec.bub.length; k++) {
        const i = rec.bub[k];
        if (i < 0) continue;
        ctx.layout.toWorld(rec.slot, rec.gx[k], rec.gy[k], 0, tmpW);
        const sd = field.seed[i] * 6.283;
        // held in the current: tiny sway, plus the disturbance of rising neighbours
        field.tgx[i] = tmpW.x + Math.sin(t * 1.3 + sd) * 0.016 * s + rec.kickDir * rec.kick * 0.22 * s * Math.sin(sd + t * 9) ** 2;
        field.tgy[i] = tmpW.y + Math.sin(t * 1.7 + sd * 1.3) * 0.02 * s + lift;
        field.tgz[i] = tmpW.z + Math.sin(t * 0.9 + sd * 2.1) * 0.04 * s;
        field.r[i] = rec.rr[k] * s;
      }
    };
    for (const rec of letters.values()) put(rec, 0);
    for (const f of finales) {
      const e = Math.min(1, f.t / 1.0);
      for (const rec of f.recs) put(rec, 0.18 * e * e * (3 - 2 * e));
    }
  }

  const mArr = bubbleMesh.instanceMatrix.array as Float32Array;
  const aArr = aAlpha.array as Float32Array;
  function writeInstances() {
    for (let i = 0; i < field.n; i++) {
      const o = i * 16;
      const m = field.mode[i];
      if (!m || field.delay[i] > 0) {
        for (let k = 0; k < 16; k++) mArr[o + k] = 0;
        aArr[i] = 0;
        continue;
      }
      let r = field.r[i];
      let alpha = field.shine[i];
      const moving = m === B_GATHER ? 1 - field.settle[i] * 0.75 : 1;
      const wob = ctx.reducedMotion ? 0 : Math.sin(field.age[i] * 15 + field.seed[i] * 30) * 0.09 * moving * Math.min(1, r * 25);
      if (m === B_POP) {
        const k = field.popT[i] / 0.13;
        r *= 1 + k * 0.9;
        alpha *= 1 - k;
      }
      // emerging from the floor: quick fade-in
      if (m === B_GATHER) alpha *= Math.min(1, field.age[i] * 5 + field.settle[i]);
      const sx = r * (1 + wob), sy = r * (1 - wob);
      mArr[o] = sx; mArr[o + 1] = 0; mArr[o + 2] = 0; mArr[o + 3] = 0;
      mArr[o + 4] = 0; mArr[o + 5] = sy; mArr[o + 6] = 0; mArr[o + 7] = 0;
      mArr[o + 8] = 0; mArr[o + 9] = 0; mArr[o + 10] = sx; mArr[o + 11] = 0;
      mArr[o + 12] = field.px[i]; mArr[o + 13] = field.py[i]; mArr[o + 14] = field.pz[i]; mArr[o + 15] = 1;
      aArr[i] = alpha;
    }
    bubbleMesh.count = field.n;
    bubbleMesh.instanceMatrix.needsUpdate = true;
    aAlpha.needsUpdate = true;
  }

  let ventAcc = 0;
  let trailAcc = 0;
  let lastNow = performance.now();
  let clock = 0;
  let pumpTimer = 0;
  let disposed = false;
  function schedulePump() {
    if (pumpTimer || disposed) return;
    pumpTimer = window.setTimeout(() => {
      pumpTimer = 0;
      if (!disposed && !document.hidden) ctx.keepAlive(1);
    }, 40);
  }

  return {
    onCharacterInput(ev: InsertEvent) {
      if (!ev.char.trim()) return; // space: a clear gap from the layout
      const slot = ctx.slotOf(ev.id);
      if (!slot) return;
      field.speed = ctx.tempo.tempo === 'fast' ? 1.9 : ctx.tempo.tempo === 'normal' ? 1.35 : 1;
      spawnLetter(ev, slot);
      if (!ev.restoring) ctx.audio.play('bubble', { pitch: 0.85 + R() * 0.3, gain: 0.45, minGap: 40 });
      ctx.keepAlive(2000);
    },

    onCharacterDelete(ev: DeleteEvent) {
      const rec = letters.get(ev.id);
      if (!rec) return;
      letters.delete(ev.id);
      releaseRec(rec, 0.15);
      ctx.audio.play('bubble', { pitch: 1.5, gain: 0.4, minGap: 40 });
      ctx.keepAlive(2000);
    },

    onLayout() {
      for (const [id, rec] of letters) {
        const s = ctx.slotOf(id);
        if (s) rec.slot = s;
      }
    },

    onWordComplete(_word: string, refs: readonly LetterRef[], saved: Promise<SaveOutcome>) {
      const recs: LetterRec[] = [];
      let x0 = Infinity, x1 = -Infinity;
      for (const r of refs) {
        const rec = letters.get(r.id);
        if (!rec) continue;
        letters.delete(r.id);
        recs.push(rec);
        x0 = Math.min(x0, rec.slot.origin.x);
        x1 = Math.max(x1, rec.slot.origin.x + rec.slot.advance);
      }
      if (recs.length) finales.push({ recs, t: 0, x0, x1, released: false });
      ctx.audio.play('success', { gain: 0.6 });
      saved.then((res) => {
        if (!res.ok) ctx.audio.play('error', { gain: 0.4 });
      });
      ctx.keepAlive(4500);
    },

    onTextClear(refs: readonly LetterRef[]) {
      for (const r of refs) {
        const rec = letters.get(r.id);
        if (!rec) continue;
        letters.delete(r.id);
        releaseRec(rec, 0.4);
      }
      ctx.keepAlive(2500);
    },

    updateAnimation(): boolean {
      const now = performance.now();
      const dt = Math.min(0.05, Math.max(0, (now - lastNow) / 1000));
      lastNow = now;
      clock += dt;
      const t = clock;

      // finale: a light sweep runs through the word, then the bubbles let go left → right
      for (let fi = finales.length - 1; fi >= 0; fi--) {
        const f = finales[fi];
        f.t += dt;
        const sweepX = f.x0 - 0.6 + ((f.x1 - f.x0 + 1.2) * Math.min(1, f.t / 1.1));
        for (const rec of f.recs) {
          for (const i of rec.bub) {
            if (i < 0) continue;
            const dx = field.px[i] - sweepX;
            field.shine[i] = 1 + 1.6 * Math.exp(-(dx * dx) / 0.25) * (f.t < 1.3 ? 1 : 0);
          }
        }
        if (!f.released && f.t > 1.4) {
          f.released = true;
          for (const rec of f.recs) releaseRec(rec, 0.12, 0, f.x0, f.x1);
          ctx.audio.play('chime', { gain: 0.35 });
        }
        if (f.released) finales.splice(fi, 1);
      }

      updateCamera(dt, t);
      writeTargets(t);
      const steps = dt > 0.026 ? 2 : 1;
      let unsettled = 0;
      for (let s = 0; s < steps; s++) {
        unsettled = field.step(dt / steps, t);
        // pops: tiny spray + soft sound
        const P = field.pops;
        for (let p = 0; p < P.length; p += 4) {
          const n = 3 + Math.floor(R() * 3);
          for (let k = 0; k < n; k++) {
            const a = R() * 6.283;
            fizz.emit({ x: P[p], y: P[p + 1], z: P[p + 2], vx: Math.cos(a) * 0.7, vy: 0.4 + R() * 0.6, vz: Math.sin(a) * 0.5, life: 0.35 + R() * 0.3, size: 0.25 + R() * 0.3, color: 0xffffff });
          }
          ctx.audio.play('pop', { pitch: 1.6 + R() * 0.8 - P[p + 3] * 6, gain: 0.08, minGap: 45 });
        }
      }

      // trails behind fast-rising bubbles
      trailAcc += dt;
      if (trailAcc > 0.05) {
        trailAcc = 0;
        let budget = small ? 4 : 10;
        for (let i = 0; i < field.n && budget > 0; i++) {
          const m = field.mode[i];
          if ((m === B_GATHER && field.settle[i] < 0.3 && field.delay[i] <= 0 && field.vy[i] > 1) || m === B_RISE) {
            if (R() < 0.15) {
              fizz.emit({ x: field.px[i], y: field.py[i] - field.r[i], z: field.pz[i], vy: 0.2, wobble: 1, life: 0.6 + R() * 0.5, size: 0.2 + R() * 0.25, color: 0xcff4ff });
              budget--;
            }
          }
        }
      }

      writeInstances();

      // ambient vents keep the sea alive
      ventAcc += dt;
      const ventRate = small ? 0.12 : 0.06;
      while (ventAcc > ventRate) {
        ventAcc -= ventRate;
        const v = VENTS[Math.floor(R() * VENTS.length)];
        if (v) fizz.emit({ x: v[0] + (R() - 0.5) * 0.3, y: FLOOR_Y + 0.2, z: v[1] + (R() - 0.5) * 0.3, vy: 0.5 + R() * 0.6, wobble: 1.5, life: 3.5 + R() * 2, size: 0.4 + R() * 1.1, color: 0xe6fbff });
      }
      fizz.update(dt, t);

      ctx.tempo.backlog = Math.min(6, Math.ceil(unsettled / 25));
      const busy = unsettled > 0 || finales.length > 0 || field.active > 0 && hasRising();
      if (!busy) schedulePump();
      return busy;
    },

    disposeWorld() {
      disposed = true;
      if (pumpTimer) clearTimeout(pumpTimer);
      letters.clear();
      finales.length = 0;
      fizz.dispose();
      disposeObject(root);
      ctx.scene.fog = null;
    },
  };

  function hasRising() {
    for (let i = 0; i < field.n; i++) if (field.mode[i] === B_RISE || field.mode[i] === B_POP) return true;
    return false;
  }
}

export const underwaterBubbles: WorldModule = { create };
