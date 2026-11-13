/**
 * WORLD 15 · Ferrofluid (磁流体)
 *
 * A bright lab bench holds a long ceramic trough of black ferrofluid between two
 * electromagnet coils. Letters stand on the liquid surface:
 *
 *  - type: the field switches on along the character path. Droplets stream up out
 *    of the trough, the liquid gathers along the strokes in writing order (the bead
 *    swells up out of the surface), then rows of spikes rise along the field lines.
 *    The surface forms a meniscus mound under every letter.
 *  - finished letters keep a faint motion (flowing surface normals, swaying spikes).
 *  - Backspace: the field releases — spikes retract, the bead slumps and melts back
 *    into the surface, sending a ripple through the trough.
 *  - Enter: a field pulse stretches every spike, then the word sinks back.
 *
 * All motion is shader-driven (body bead / pool height field) plus per-letter
 * instanced cones whose matrices are only rewritten while a letter animates.
 */
import * as THREE from 'three';
import type { DeleteEvent, InsertEvent, SaveOutcome, WorldContext, WorldInstance, WorldModule } from '../engine/types';
import { LetterWorld, type LetterVisual } from '../engine/letter-world';
import { DEFAULT_LAYOUT, type Slot } from '../engine/layout';
import type { EvenPoint } from '../engine/glyphs/glyph-engine';
import { Particles } from '../engine/particles';
import { clamp, damp, easeOutBack, rand } from '../engine/anim';

const POOL_Y = -0.62;
const TROUGH_X = 5.9;
const TROUGH_Z0 = -0.85;
const TROUGH_Z1 = 0.85;
const R = 0.085;
const MAX_BUMPS = 24;
const MAX_RIPPLES = 8;
/** timeline end (body 0..0.7, spikes up to 1.3) */
const T_END = 1.3;

interface SpikeSet {
  /** per spike: bx,by,bz, qx,qy,qz,qw, radius, length, u */
  data: Float32Array;
  count: number;
  pts: EvenPoint[];
  length: number;
}

interface FerroVisual extends LetterVisual {
  body: THREE.Mesh;
  mat: THREE.MeshPhysicalMaterial;
  u: { uProg: { value: number }; uCollapse: { value: number }; uFlow: { value: number } };
  spikes: THREE.InstancedMesh;
  set: SpikeSet;
  T: number;
  dur: number;
  collapse: number;
  collapsing: boolean;
  pulse: number;
  finaleT: number;
  collapseAt: number;
  yShift: number;
  dirty: boolean;
  emitAcc: number;
}

const BODY_DECL = /* glsl */ `
attribute float aU; attribute float aV;
uniform float uProg; uniform float uCollapse; uniform float uTime; uniform float uR; uniform float uLen; uniform float uFlow;
varying float vU; varying float vV;`;

const BODY_VERT = /* glsl */ `
vec3 transformed;
{
  vec3 c = position - objectNormal * uR;
  float age = clamp((uProg - aU) * 6.0, 0.0, 1.0);
  float form = age * age * (3.0 - 2.0 * age);
  float flow = sin(aU * uLen * 13.0 - uTime * 2.6 + aV * 12.566) * 0.09 + sin(aU * uLen * 29.0 + uTime * 1.9) * 0.05;
  float rad = uR * form * (1.0 + flow * uFlow) * (1.0 - 0.55 * uCollapse);
  vec3 n = objectNormal;
  transformed = c + vec3(n.xy * rad, n.z * rad * (1.0 - 0.5 * uCollapse));
  transformed.y -= (1.0 - form) * 0.22;
  float melt = uCollapse * uCollapse;
  transformed.y = mix(transformed.y, -0.2 + transformed.y * 0.12, melt);
  transformed.z *= 1.0 + melt * 1.4;
  vU = aU; vV = aV;
}`;

const BODY_FRAG_DECL = /* glsl */ `
uniform float uProg; uniform float uTime; uniform float uLen; uniform float uFlow;
varying float vU; varying float vV;`;

const BODY_FRAG_NORMAL = /* glsl */ `
#include <normal_fragment_maps>
normal = normalize(normal + vec3(sin(vU * uLen * 60.0 - uTime * 3.0 + vV * 25.0), cos(vU * uLen * 47.0 + uTime * 2.2 - vV * 19.0), 0.0) * 0.1 * uFlow);`;

const SPIKE_DECL = /* glsl */ `uniform float uTime;`;
const SPIKE_VERT = /* glsl */ `
#include <begin_vertex>
{
#ifdef USE_INSTANCING
  float ph = instanceMatrix[3].x * 9.0 + instanceMatrix[3].y * 7.0;
#else
  float ph = 0.0;
#endif
  float sw = transformed.y * transformed.y;
  transformed.x += sin(uTime * 2.1 + ph) * 0.4 * sw;
  transformed.z += cos(uTime * 1.7 + ph * 1.3) * 0.4 * sw;
}`;

const POOL_DECL = /* glsl */ `
uniform vec4 uBump[${MAX_BUMPS}]; uniform vec4 uRip[${MAX_RIPPLES}]; uniform float uTime;
float ffH(vec2 p) {
  float h = 0.0;
  for (int i = 0; i < ${MAX_BUMPS}; i++) {
    vec4 b = uBump[i];
    if (b.z <= 0.0) continue;
    float dx = max(0.0, abs(p.x - b.x) - b.y) / 0.25;
    float dz = (p.y - b.w) / 0.3;
    h = max(h, b.z * 0.16 * exp(-dx * dx - dz * dz));
  }
  for (int i = 0; i < ${MAX_RIPPLES}; i++) {
    vec4 r = uRip[i];
    if (r.w <= 0.0) continue;
    float d = length(p - r.xy);
    float f = r.z * 2.3;
    float env = exp(-(d - f) * (d - f) * 4.0) * exp(-r.z * 1.3);
    h += r.w * 0.05 * sin((d - f) * 13.0) * env;
  }
  h += 0.006 * sin(p.x * 1.3 + uTime * 0.5) * sin(p.y * 3.7 - uTime * 0.4);
  return h;
}`;

const POOL_NORMAL = /* glsl */ `
float ffh0 = ffH(position.xz);
float ffhx = ffH(position.xz + vec2(0.03, 0.0));
float ffhz = ffH(position.xz + vec2(0.0, 0.03));
vec3 objectNormal = normalize(vec3(-(ffhx - ffh0) / 0.03, 1.0, -(ffhz - ffh0) / 0.03));`;

const POOL_VERT = /* glsl */ `
vec3 transformed = vec3(position);
transformed.y += ffh0;`;

class Ferrofluid extends LetterWorld<FerroVisual> {
  private timeU = { value: 0 };
  private spikeMat: THREE.MeshPhysicalMaterial;
  private coneGeo: THREE.BufferGeometry;
  private sets = new Map<string, SpikeSet>();
  private drops: Particles;
  private bumpU: THREE.Vector4[] = [];
  private ripU: THREE.Vector4[] = [];
  private ripHead = 0;
  private coilMats: THREE.MeshStandardMaterial[] = [];
  private field = 0;
  private yShift = 0;
  private camTarget = new THREE.Vector3(0, 0.05, 0);
  private camDir = new THREE.Vector3(0, 1.6, 10).normalize();
  private camDist = 10.1;
  private m4 = new THREE.Matrix4();
  private q = new THREE.Quaternion();
  private p3 = new THREE.Vector3();
  private s3 = new THREE.Vector3();
  private dropColor = new THREE.Color(0x0c0c10);

  constructor(ctx: WorldContext) {
    super(ctx);
    const T = THREE;
    ctx.layout.setOptions({ ...DEFAULT_LAYOUT, metric: 'sans', size: 1.3, tracking: 0.14, maxWidth: 9.4, maxLines: 1, origin: [0, 0, 0], plane: 'xy', minScale: 0.3 });

    // Minimal dark stage: near-black; the studio env map is set only on the ferrofluid
    // materials (letters + pool) (so the letters read as glossy highlights), one key + a cool rim.
    ctx.scene.background = new T.Color(0x020203);
    ctx.scene.fog = new T.FogExp2(0x020203, 0.04);
    this.placeCamera(true);

    this.root.add(new T.HemisphereLight(0x8fa2c8, 0x0a0806, 0.25));
    const key = new T.DirectionalLight(0xffffff, 1.2);
    key.position.set(4, 10, 7);
    this.root.add(key);
    const rim = new T.DirectionalLight(0x9db4ff, 1.4);
    rim.position.set(-6, 4, -6);
    this.root.add(rim);

    for (let i = 0; i < MAX_BUMPS; i++) this.bumpU.push(new T.Vector4(0, 0, 0, 0));
    for (let i = 0; i < MAX_RIPPLES; i++) this.ripU.push(new T.Vector4(0, 0, 0, 0));
    this.buildLab();

    this.coneGeo = new T.ConeGeometry(1, 1, 8, 1);
    this.coneGeo.translate(0, 0.5, 0);
    this.coneGeo.userData.shared = true;
    this.spikeMat = this.ferroMaterial();
    this.spikeMat.userData.shared = true;
    this.spikeMat.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = this.timeU;
      shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\n' + SPIKE_DECL).replace('#include <begin_vertex>', SPIKE_VERT);
    };

    this.drops = new Particles({ capacity: 700, gravity: [0, 0, 0], drag: 0, shape: 'dot', size: 0.06, blending: T.NormalBlending, opacity: 0.95, depthWrite: false });
    this.root.add(this.drops.points);
  }

  private ferroMaterial() {
    return new THREE.MeshPhysicalMaterial({
      color: 0x050506,
      roughness: 0.14,
      metalness: 0.85,
      clearcoat: 1,
      clearcoatRoughness: 0.06,
      envMap: this.ctx.renderer.environment(),
      envMapIntensity: 1.5,
    });
  }

  private buildLab() {
    const T = THREE;
    const ceramic = new T.MeshStandardMaterial({ color: 0x141518, roughness: 0.45, metalness: 0.2 });
    // dark matte floor
    const bench = new T.Mesh(new T.PlaneGeometry(60, 40), new T.MeshStandardMaterial({ color: 0x050506, roughness: 0.85 }));
    bench.rotation.x = -Math.PI / 2;
    bench.position.set(0, POOL_Y - 0.36, -1);
    this.root.add(bench);
    // trough walls (rim slightly above the liquid)
    const rimY = POOL_Y + 0.06;
    const h = 0.42;
    const t = 0.16;
    const wallBox = (w: number, d: number, x: number, z: number) => {
      const m = new T.Mesh(new T.BoxGeometry(w, h, d), ceramic);
      m.position.set(x, rimY - h / 2, z);
      this.root.add(m);
    };
    const W = TROUGH_X * 2;
    const D = TROUGH_Z1 - TROUGH_Z0;
    wallBox(W + t * 2, t, 0, TROUGH_Z0 - t / 2);
    wallBox(W + t * 2, t, 0, TROUGH_Z1 + t / 2);
    wallBox(t, D, -TROUGH_X - t / 2, (TROUGH_Z0 + TROUGH_Z1) / 2);
    wallBox(t, D, TROUGH_X + t / 2, (TROUGH_Z0 + TROUGH_Z1) / 2);
    const lip = new T.Mesh(new T.BoxGeometry(W + t * 2 + 0.1, 0.04, 0.24), ceramic);
    lip.position.set(0, rimY + 0.02, TROUGH_Z1 + t / 2);
    this.root.add(lip);

    // liquid surface (height field)
    const q = this.ctx.quality;
    const segX = q === 2 ? 300 : q === 1 ? 210 : 130;
    const segZ = q === 0 ? 16 : 26;
    const geo = new T.PlaneGeometry(W, D, segX, segZ);
    geo.rotateX(-Math.PI / 2);
    geo.translate(0, 0, (TROUGH_Z0 + TROUGH_Z1) / 2);
    const poolMat = new T.MeshPhysicalMaterial({ color: 0x040405, roughness: 0.1, metalness: 0.7, clearcoat: 1, clearcoatRoughness: 0.04, envMap: this.ctx.renderer.environment(), envMapIntensity: 0.45 });
    poolMat.onBeforeCompile = (shader) => {
      shader.uniforms.uBump = { value: this.bumpU };
      shader.uniforms.uRip = { value: this.ripU };
      shader.uniforms.uTime = this.timeU;
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\n' + POOL_DECL)
        .replace('#include <beginnormal_vertex>', POOL_NORMAL)
        .replace('#include <begin_vertex>', POOL_VERT);
    };
    const pool = new T.Mesh(geo, poolMat);
    pool.position.y = POOL_Y;
    pool.frustumCulled = false;
    this.root.add(pool);

    // electromagnet coils at both ends
    const copper = new T.MeshStandardMaterial({ color: 0xc8743c, roughness: 0.3, metalness: 0.9 });
    const steel = new T.MeshStandardMaterial({ color: 0x8b9099, roughness: 0.25, metalness: 0.9 });
    for (const sx of [-1, 1]) {
      const g = new T.Group();
      const coil = new T.Mesh(new T.CylinderGeometry(0.42, 0.42, 0.7, 28), copper);
      coil.rotation.z = Math.PI / 2;
      g.add(coil);
      for (let k = -2; k <= 2; k++) {
        const wind = new T.Mesh(new T.TorusGeometry(0.43, 0.025, 6, 28), copper);
        wind.rotation.y = Math.PI / 2;
        wind.position.x = k * 0.14;
        g.add(wind);
      }
      const core = new T.Mesh(new T.CylinderGeometry(0.16, 0.16, 1.1, 18), steel);
      core.rotation.z = Math.PI / 2;
      g.add(core);
      const glowMat = new T.MeshStandardMaterial({ color: 0x9ab4ff, emissive: 0x5d86ff, emissiveIntensity: 0, roughness: 0.4 });
      this.coilMats.push(glowMat);
      const ring = new T.Mesh(new T.TorusGeometry(0.2, 0.03, 8, 24), glowMat);
      ring.rotation.y = Math.PI / 2;
      ring.position.x = -sx * 0.56;
      g.add(ring);
      const stand = new T.Mesh(new T.BoxGeometry(0.5, 0.5, 0.7), steel);
      stand.position.y = -0.55;
      g.add(stand);
      g.position.set(sx * (TROUGH_X + 0.75), POOL_Y + 0.22, 0);
      this.root.add(g);
    }
  }

  private placeCamera(snap: boolean, dt = 0) {
    const cam = this.ctx.camera;
    const aspect = this.ctx.renderer.size.aspect || 1.6;
    const v = Math.tan((cam.fov * Math.PI) / 360);
    const b = this.ctx.layout.bounds;
    const halfW = Math.max(3, b.isEmpty() ? 0 : Math.max(Math.abs(b.min.x), Math.abs(b.max.x))) + 0.8;
    const need = Math.max(2.6 / v, halfW / (v * aspect));
    const want = Math.min(30, Math.max(10.1, need));
    this.camDist = snap ? want : damp(this.camDist, want, 3, dt);
    cam.position.copy(this.camTarget).addScaledVector(this.camDir, this.camDist);
    cam.lookAt(this.camTarget);
    return Math.abs(this.camDist - want) > 0.01;
  }

  /* --------------------------------------------------------- spikes */

  private spikeSet(char: string): SpikeSet {
    const hit = this.sets.get(char);
    if (hit) return hit;
    const glyph = this.ctx.glyphs.get(char, 'sans');
    const pts = this.ctx.glyphs.evenPoints(glyph, 0.06);
    const out: number[] = [];
    const up = new THREE.Vector3(0, 1, 0);
    const dir = new THREE.Vector3();
    const q = new THREE.Quaternion();
    pts.forEach((p, i) => {
      const nx = -p.ty;
      const ny = p.tx;
      const angles = i % 2 === 0 ? [-1.15, 0, 1.15] : [-0.6, 0.6];
      for (const a0 of angles) {
        const a = a0 + rand(-0.12, 0.12);
        dir.set(nx * Math.sin(a), ny * Math.sin(a), Math.cos(a)).normalize();
        q.setFromUnitVectors(up, dir);
        const len = (Math.abs(a0) < 0.1 ? 0.17 : Math.abs(a0) > 1 ? 0.09 : 0.13) * rand(0.8, 1.15);
        const rad = clamp(len * 0.3, 0.024, 0.048);
        out.push(p.x + dir.x * R * 0.7, p.y + dir.y * R * 0.7, dir.z * R * 0.7, q.x, q.y, q.z, q.w, rad, len, p.u);
      }
    });
    const set: SpikeSet = { data: new Float32Array(out), count: out.length / 10, pts, length: glyph.length };
    this.sets.set(char, set);
    return set;
  }

  private writeSpikes(v: FerroVisual) {
    const d = v.set.data;
    const fade = 1 - clamp(v.collapse * 2.2);
    for (let i = 0; i < v.set.count; i++) {
      const o = i * 10;
      const u = d[o + 9];
      const hgt = Math.max(0, easeOutBack(clamp((v.T - 0.35 - u * 0.65) / 0.3), 2.2) * fade * v.pulse);
      const rs = d[o + 7] * (0.5 + 0.5 * Math.min(1, hgt));
      this.p3.set(d[o], d[o + 1], d[o + 2]);
      this.q.set(d[o + 3], d[o + 4], d[o + 5], d[o + 6]);
      if (hgt < 1e-3) this.s3.set(0, 0, 0);
      else this.s3.set(rs, d[o + 8] * hgt, rs);
      this.m4.compose(this.p3, this.q, this.s3);
      v.spikes.setMatrixAt(i, this.m4);
    }
    v.spikes.instanceMatrix.needsUpdate = true;
  }

  /* -------------------------------------------------------- letters */

  protected createLetter(ev: InsertEvent, slot: Slot): FerroVisual | null {
    if (!ev.char.trim()) return null;
    const ctx = this.ctx;
    this.onLayout();
    const glyph = ctx.glyphs.get(ev.char, 'sans');
    const tube = ctx.glyphs.tube(glyph, R, 14, true);
    const u = { uProg: { value: ev.restoring ? 1 : 0 }, uCollapse: { value: 0 }, uFlow: { value: ev.restoring ? 0.6 : 1 } };
    const mat = this.ferroMaterial();
    mat.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, u, { uTime: this.timeU, uR: { value: R }, uLen: { value: glyph.length } });
      shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\n' + BODY_DECL).replace('#include <begin_vertex>', BODY_VERT);
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\n' + BODY_FRAG_DECL)
        .replace('void main() {', 'void main() {\n  if (vU > uProg + 0.002) discard;')
        .replace('#include <normal_fragment_maps>', BODY_FRAG_NORMAL);
    };
    mat.customProgramCacheKey = () => 'ferro-body';
    const body = new THREE.Mesh(tube, mat);
    body.frustumCulled = false;
    const set = this.spikeSet(ev.char);
    const spikes = new THREE.InstancedMesh(this.coneGeo, this.spikeMat, Math.max(1, set.count));
    spikes.count = set.count;
    spikes.frustumCulled = false;
    const group = new THREE.Group();
    group.add(body, spikes);
    this.root.add(group);
    const v: FerroVisual = {
      ref: ev,
      slot,
      object: group,
      state: ev.restoring ? 'alive' : 'creating',
      age: 0,
      body,
      mat,
      u,
      spikes,
      set,
      T: ev.restoring ? T_END : 0,
      dur: ctx.tempo.duration(1000, 420),
      collapse: 0,
      collapsing: false,
      pulse: 1,
      finaleT: -1,
      collapseAt: -1,
      yShift: this.yShift,
      dirty: true,
      emitAcc: 0,
    };
    this.place(v, true, 0);
    this.writeSpikes(v);
    if (!ev.restoring) {
      ctx.audio.play('hum', { pitch: 0.7 + Math.random() * 0.1, gain: 0.3, minGap: 40 });
      this.field = 1;
      this.ripple(slot.origin.x + slot.advance / 2, 0, 0.5);
    }
    ctx.keepAlive(1500);
    return v;
  }

  protected removeLetter(v: FerroVisual, _ev: DeleteEvent): void {
    v.collapsing = true;
    v.state = 'removing';
    this.ctx.audio.play('squish', { pitch: 0.7, gain: 0.45, minGap: 30 });
    this.ripple(v.slot.origin.x + v.slot.advance / 2, 0, 1);
    this.ctx.keepAlive(1200);
  }

  protected playFinale(_word: string, visuals: FerroVisual[], saved: Promise<SaveOutcome>): void {
    const ctx = this.ctx;
    visuals
      .slice()
      .sort((a, b) => a.slot.index - b.slot.index)
      .forEach((v, i) => {
        v.finaleT = 0;
        v.collapseAt = 0.95 + i * 0.06;
      });
    this.field = 1.6;
    ctx.audio.play('success', { gain: 0.7 });
    ctx.audio.play('hum', { pitch: 1.2, gain: 0.35 });
    saved.then((r) => {
      if (!r.ok) ctx.audio.play('error', { gain: 0.5 });
    });
    ctx.keepAlive(2200 + visuals.length * 80);
  }

  private ripple(x: number, z: number, amp: number) {
    const r = this.ripU[this.ripHead];
    this.ripHead = (this.ripHead + 1) % MAX_RIPPLES;
    r.set(x, z, 0, amp);
  }

  private place(v: FerroVisual, snap: boolean, dt: number) {
    const s = v.slot;
    if (v.state !== 'finale' && v.state !== 'removing') v.yShift = snap ? this.yShift : damp(v.yShift, this.yShift, 10, dt);
    const g = v.object;
    const tx = s.origin.x;
    const ty = s.origin.y + v.yShift;
    if (snap) {
      g.position.set(tx, ty, s.origin.z);
      g.scale.setScalar(s.size);
      return false;
    }
    g.position.x = damp(g.position.x, tx, 12, dt);
    g.position.y = damp(g.position.y, ty, 12, dt);
    g.scale.setScalar(damp(g.scale.x, s.size, 12, dt));
    return Math.abs(g.position.x - tx) + Math.abs(g.position.y - ty) + Math.abs(g.scale.x - s.size) > 1e-3;
  }

  onLayout(): void {
    const all = this.ctx.layout.all();
    if (!all.length) return;
    let minY = Infinity;
    for (const s of all) minY = Math.min(minY, s.origin.y);
    this.yShift = POOL_Y + 0.03 - minY;
  }

  protected updateLetter(v: FerroVisual, dt: number, _time: number): boolean {
    this.place(v, false, dt);
    let animating = false;
    if (v.T < T_END && !v.collapsing) {
      v.T = Math.min(T_END, v.T + dt / Math.max(0.05, v.dur));
      v.u.uProg.value = clamp(v.T / 0.7);
      this.emitDrops(v, dt);
      animating = true;
      if (v.T >= T_END && v.state === 'creating') v.state = 'alive';
    }
    v.u.uFlow.value = damp(v.u.uFlow.value, v.state === 'creating' ? 1 : 0.6, 2, dt);

    if (v.finaleT >= 0) {
      v.finaleT += dt;
      const k = v.finaleT;
      v.pulse = 1 + 0.6 * Math.sin(Math.PI * clamp(k / 0.8));
      animating = true;
      if (k >= v.collapseAt && !v.collapsing) {
        v.collapsing = true;
        v.u.uProg.value = 1;
        this.ripple(v.slot.origin.x + v.slot.advance / 2, 0, 0.8);
        this.ctx.audio.play('squish', { pitch: 0.8 + Math.random() * 0.2, gain: 0.25, minGap: 30 });
      }
    }

    if (v.collapsing) {
      v.collapse = Math.min(1, v.collapse + dt / 0.65);
      v.u.uCollapse.value = v.collapse;
      animating = true;
      if (v.collapse >= 1) {
        this.release(v);
        return true;
      }
    }
    if (animating || v.dirty) {
      this.writeSpikes(v);
      v.dirty = animating;
    }
    return animating;
  }

  private emitDrops(v: FerroVisual, dt: number) {
    const pts = v.set.pts;
    if (!pts.length) return;
    const prog = v.u.uProg.value;
    if (prog >= 1) return;
    v.emitAcc += dt * 70 * this.ctx.tempo.detail;
    const s = v.slot;
    const idx = Math.min(pts.length - 1, Math.floor(prog * (pts.length - 1)));
    const p = pts[idx];
    const tx = s.origin.x + p.x * s.size;
    const ty = s.origin.y + v.yShift + p.y * s.size;
    while (v.emitAcc >= 1) {
      v.emitAcc -= 1;
      const sx = tx + rand(-0.35, 0.35);
      const sz = rand(-0.4, 0.4);
      const life = rand(0.18, 0.32);
      this.drops.emit({
        x: sx,
        y: POOL_Y + 0.02,
        z: sz,
        vx: (tx - sx) / life,
        vy: (ty - POOL_Y) / life,
        vz: (0 - sz) / life,
        life,
        size: rand(0.6, 1.3),
        color: this.dropColor,
        hold: 0.7,
      });
    }
  }

  protected updateWorld(dt: number, time: number): boolean {
    this.timeU.value = time;
    let moving = this.placeCamera(false, dt);
    if (this.drops.update(dt)) moving = true;

    // meniscus mounds under letters
    let n = 0;
    const all = [...this.letters.values(), ...this.detached];
    for (const v of all) {
      if (n >= MAX_BUMPS) break;
      const form = clamp(v.T / 0.7);
      const str = form * (1 - v.collapse) * (0.85 + 0.15 * v.pulse);
      const g = v.object;
      const half = (v.slot.advance / 2) * (g.scale.x / Math.max(1e-3, v.slot.size));
      this.bumpU[n++].set(g.position.x + half, Math.max(0.05, half * 0.75), str, 0);
    }
    for (; n < MAX_BUMPS; n++) this.bumpU[n].z = 0;

    for (const r of this.ripU) {
      if (r.w <= 0) continue;
      r.z += dt;
      if (r.z > 3) r.w = 0;
      else moving = true;
    }

    if (this.field > 0.01) {
      this.field *= Math.exp(-2.5 * dt);
      moving = true;
    }
    const creating = all.some((v) => v.state === 'creating' || v.finaleT >= 0);
    const glow = Math.max(this.field, creating ? 0.6 : 0) + 0.12 * (this.letters.size > 0 ? 1 : 0);
    for (const m of this.coilMats) m.emissiveIntensity = glow * (0.9 + 0.1 * Math.sin(time * 14));

    // finished letters keep a faint living motion
    if (all.length) moving = true;
    return moving;
  }

  disposeWorld(): void {
    this.drops.dispose();
    super.disposeWorld();
    this.spikeMat.dispose();
    this.coneGeo.dispose();
    this.sets.clear();
    this.ctx.scene.environment = null;
  }
}

export function create(ctx: WorldContext): WorldInstance {
  return new Ferrofluid(ctx);
}

export const ferrofluid: WorldModule = { create };
