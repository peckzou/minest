/**
 * Director — one per mounted world. Builds the 2.0 stage from the world's StageSpec, drives the
 * camera rig (parallax, idle sway, drag-to-orbit, zoom, follow-the-word, finale sweep) and the
 * keystroke effects. The 1.0 world module underneath is not touched.
 */
import * as THREE from 'three';
import type { Layout, Slot } from '@v1/engine/layout';
import type { Renderer2, Look } from '../engine/renderer2';
import { DEFAULT_LOOK } from '../engine/renderer2';
import { Backdrop, Motes, Shafts, Pool, KeyFx, GLOW, HAZE, type BackdropSpec, type MoteSpec, type ShaftSpec, type PoolSpec } from './kit';

export interface LightSpec {
  type: 'point' | 'spot' | 'hemi' | 'dir';
  color: string;
  ground?: string;
  intensity: number;
  at?: [number, number, number];
  to?: [number, number, number];
  distance?: number;
  angle?: number;
}

export interface CameraSpec {
  /** idle sway in degrees */
  sway?: number;
  /** pointer parallax in degrees */
  parallax?: number;
  /** how far the framing follows the typed word 0..1 */
  follow?: number;
  /** base dolly: <1 moves in */
  dolly?: number;
  /** extra push-in while the word is short 0..0.3 */
  intimacy?: number;
  /** orbit limits for dragging, degrees */
  maxYaw?: number;
  maxPitch?: number;
  /** finale sweep in degrees */
  sweep?: number;
}

export interface StageSpec {
  look?: Partial<Omit<Look, 'bloom'>> & { bloom?: Partial<Look['bloom']> };
  backdrop?: BackdropSpec;
  motes?: MoteSpec[];
  shafts?: ShaftSpec[];
  pools?: PoolSpec[];
  lights?: LightSpec[];
  camera?: CameraSpec;
  /** keystroke light power (0 = off), sparks per key, spark gravity, a ring on every key */
  key?: { light?: number; sparks?: number; gravity?: number; ring?: boolean };
  /** distant fog fades into the backdrop instead of into black (default true) */
  fog?: boolean;
  /** per-theme overrides (shallow: look/backdrop colours/accent) */
  themes?: Record<string, { accent?: string; backdrop?: Partial<BackdropSpec>; look?: StageSpec['look'] }>;
  /** extra set dressing; returns an optional per-frame updater */
  build?: (scene: THREE.Scene, env: { quality: number; focus: THREE.Vector3 }) => ((dt: number, time: number) => void) | void;
}

export interface DirectorOptions {
  spec: StageSpec;
  renderer: Renderer2;
  scene: THREE.Scene;
  layout: Layout;
  accent: string;
  theme: string;
  reducedMotion: () => boolean;
  cameraMotion: () => boolean;
  /** px the picture is raised so the HUD at the bottom does not sit on the word */
  viewShift: () => number;
}

const damp = (a: number, b: number, k: number, dt: number) => a + (b - a) * (1 - Math.exp(-k * dt));

export class Director {
  private spec: StageSpec;
  private r: Renderer2;
  private layout: Layout;
  private backdrop: Backdrop | null = null;
  private motes: Motes[] = [];
  private shafts: Shafts[] = [];
  private pools: Pool[] = [];
  private fx: KeyFx;
  private custom: ((dt: number, time: number) => void) | null = null;
  private accent = new THREE.Color();
  private focus = new THREE.Vector3();
  private flat: boolean;
  private cam: Required<CameraSpec>;

  // rig state
  private px = 0;
  private py = 0;
  private yaw = 0;
  private pitch = 0;
  private dragYaw = 0;
  private dragPitch = 0;
  private dragging = false;
  private dragHold = 0;
  private zoom = 1;
  private zoomTarget = 1;
  private punch = 0;
  private sweepT = -1;
  private pulse = 0;
  private follow = new THREE.Vector3();
  private followTarget = new THREE.Vector3();
  private intimacy = 0;
  private intro = 1;
  private shift = 0;

  constructor(private o: DirectorOptions) {
    this.spec = o.spec;
    this.r = o.renderer;
    this.layout = o.layout;
    this.flat = o.layout.opts.plane === 'xz';
    this.focus.set(...o.layout.opts.origin);
    this.cam = {
      sway: 0.9,
      parallax: 3.2,
      follow: 0.3,
      dolly: 1,
      intimacy: 0.08,
      maxYaw: 26,
      maxPitch: 12,
      sweep: 9,
      ...(o.spec.camera ?? {}),
    };
    this.accent.set(o.accent);
    const q = o.renderer.quality;
    const scene = o.scene;

    if (this.spec.backdrop) {
      this.backdrop = new Backdrop(this.spec.backdrop, this.focus);
      scene.add(this.backdrop.mesh);
    }
    for (const m of this.spec.motes ?? []) {
      const mm = new Motes(m, q === 2 ? 1 : q === 1 ? 0.7 : 0.4);
      this.motes.push(mm);
      scene.add(mm.points);
    }
    if (q > 0) {
      for (const s of this.spec.shafts ?? []) {
        const ss = new Shafts(s);
        this.shafts.push(ss);
        scene.add(ss.group);
      }
    }
    for (const p of this.spec.pools ?? []) {
      const pp = new Pool(p);
      if (p.color === 'accent') pp.uniforms.uCol.value = this.accent;
      this.pools.push(pp);
      scene.add(pp.mesh);
    }
    for (const l of this.spec.lights ?? []) scene.add(makeLight(l));
    this.shift = o.viewShift();
    const k = this.spec.key ?? {};
    this.fx = new KeyFx(this.accent, k.light ?? 2.2, k.gravity ?? 1.2);
    scene.add(this.fx.group);
    const upd = this.spec.build?.(scene, { quality: q, focus: this.focus });
    if (upd) this.custom = upd;
    this.setTheme(o.theme);
  }

  setTheme(theme: string) {
    const t = this.spec.themes?.[theme];
    const base = this.spec.look ?? {};
    const over = t?.look ?? {};
    const look: Look = {
      ...DEFAULT_LOOK,
      ...base,
      ...over,
      bloom: { ...DEFAULT_LOOK.bloom, ...(base.bloom ?? {}), ...(over.bloom ?? {}) },
    };
    this.r.setLook(look);
    this.fx.ringPower = 1 / (1 + look.bloom.strength * 2.5);
    this.accent.set(t?.accent ?? this.o.accent);
    this.fx.setColor(this.accent);
    this.r.flashColor.copy(this.accent);
    if (this.backdrop && this.spec.backdrop) {
      const b = { ...this.spec.backdrop, ...(t?.backdrop ?? {}) };
      const u = this.backdrop.uniforms;
      (u.uTop.value as THREE.Color).set(b.top);
      (u.uMid.value as THREE.Color).set(b.mid);
      (u.uBot.value as THREE.Color).set(b.bot);
      (u.uGlow.value as THREE.Color).set(b.glow).multiplyScalar((b.glowPower ?? 1) * GLOW);
      (u.uHaze.value as THREE.Color).set(b.haze ?? b.glow).multiplyScalar((b.hazePower ?? 0.25) * HAZE);
    }
  }

  /* ---- input from the app ---- */

  pointer(nx: number, ny: number) {
    this.px = nx;
    this.py = ny;
  }

  drag(dxDeg: number, dyDeg: number) {
    this.dragging = true;
    this.dragYaw = THREE.MathUtils.clamp(this.dragYaw + dxDeg, -this.cam.maxYaw, this.cam.maxYaw);
    this.dragPitch = THREE.MathUtils.clamp(this.dragPitch + dyDeg, -this.cam.maxPitch, this.cam.maxPitch);
    this.dragHold = 2.4;
  }

  dragEnd() {
    this.dragging = false;
  }

  zoomBy(f: number) {
    this.zoomTarget = THREE.MathUtils.clamp(this.zoomTarget * f, 0.62, 1.3);
    this.dragHold = Math.max(this.dragHold, 4);
  }

  resetView() {
    this.dragYaw = 0;
    this.dragPitch = 0;
    this.zoomTarget = 1;
    this.dragHold = 0;
  }

  private slotPoint(slot: Slot) {
    return slot.center.clone();
  }

  key(slot: Slot | undefined) {
    this.punch = 1;
    this.pulse = Math.min(1.2, this.pulse + 0.55);
    if (!slot) return;
    const k = this.spec.key ?? {};
    const at = this.slotPoint(slot);
    if (this.flat) at.y += 0.04;
    else at.z += 0.25 * slot.size;
    this.fx.key(at, slot.size, this.flat, k.sparks ?? 5, !!k.ring);
  }

  /** Enter: called before the world takes the letters */
  finale() {
    const b = this.layout.bounds;
    const at = b.isEmpty() ? this.focus.clone() : b.getCenter(new THREE.Vector3());
    const w = b.isEmpty() ? 4 : Math.max(b.max.x - b.min.x, 2);
    if (this.flat) at.y += 0.05;
    else at.z += 0.3;
    this.fx.finale(at, w, this.flat);
    this.sweepT = 0;
    this.pulse = 1.6;
    this.r.flash = Math.max(this.r.flash, 0.42);
  }

  /** text changed: where should the framing lean */
  frameText(count: number) {
    const b = this.layout.bounds;
    const all = this.layout.all();
    if (!count || !all.length || b.isEmpty()) {
      this.followTarget.set(0, 0, 0);
      this.intimacy = 0;
      return;
    }
    const last = all[all.length - 1];
    const c = b.getCenter(new THREE.Vector3());
    // lean towards the word, and a little towards the letter being written
    this.followTarget.copy(c).lerp(last.center, 0.35).sub(this.focus).multiplyScalar(this.cam.follow);
    const fill = THREE.MathUtils.clamp((b.max.x - b.min.x) / Math.max(1, this.layout.opts.maxWidth), 0, 1);
    this.intimacy = (1 - fill) * this.cam.intimacy * (this.layout.lines > 1 ? 0.3 : 1);
  }

  /* ---- per frame ---- */

  update(dt: number, time: number): boolean {
    const r = this.r;
    const cam = r.camera;
    const view = r.view;
    const reduced = this.o.reducedMotion();
    const motion = this.o.cameraMotion() && !reduced;

    this.pulse = Math.max(0, this.pulse - dt * 1.6);
    this.punch = Math.max(0, this.punch - dt * 5);
    this.intro = Math.max(0, this.intro - dt * 0.75);
    if (!this.dragging && this.dragHold > 0) this.dragHold -= dt;
    if (!this.dragging && this.dragHold <= 0) {
      this.dragYaw = damp(this.dragYaw, 0, 2.2, dt);
      this.dragPitch = damp(this.dragPitch, 0, 2.2, dt);
      this.zoomTarget = damp(this.zoomTarget, 1, 1.2, dt);
    }

    let sweep = 0;
    let sweepDolly = 0;
    if (this.sweepT >= 0) {
      this.sweepT += dt / 2.6;
      if (this.sweepT >= 1) this.sweepT = -1;
      else {
        const s = Math.sin(this.sweepT * Math.PI);
        sweep = s * this.cam.sweep * (motion ? 1 : 0);
        sweepDolly = s * 0.07 * (motion ? 1 : 0);
      }
    }

    const sway = motion ? this.cam.sway : 0;
    const par = motion ? this.cam.parallax : 0;
    const targetYaw = -this.px * par + Math.sin(time * 0.21) * sway + sweep + this.dragYaw;
    const targetPitch = this.py * par * 0.55 + Math.sin(time * 0.17 + 1.3) * sway * 0.5 + this.dragPitch;
    this.yaw = damp(this.yaw, targetYaw, this.dragging ? 14 : 3.2, dt);
    this.pitch = damp(this.pitch, targetPitch, this.dragging ? 14 : 3.2, dt);
    this.zoom = damp(this.zoom, this.zoomTarget, 6, dt);
    if (motion) this.follow.lerp(this.followTarget, 1 - Math.exp(-2.4 * dt));
    else this.follow.set(0, 0, 0);

    // view = world camera, orbited about the point it looks at on the stage
    view.copy(cam, false);
    const fwd = _v1.set(0, 0, -1).applyQuaternion(cam.quaternion);
    const dist = Math.max(2.5, _v2.copy(this.focus).sub(cam.position).dot(fwd));
    const pivot = _v3.copy(cam.position).addScaledVector(fwd, dist);
    const right = _v4.set(1, 0, 0).applyQuaternion(cam.quaternion);
    _q1.setFromAxisAngle(_up, THREE.MathUtils.degToRad(this.yaw));
    _q2.setFromAxisAngle(right, THREE.MathUtils.degToRad(-this.pitch));
    _q1.multiply(_q2);
    const introEase = this.intro * this.intro * (motion ? 1 : 0);
    const dolly = this.cam.dolly * this.zoom * (1 - (motion ? this.intimacy : 0) - this.punch * 0.012 * (motion ? 1 : 0) - sweepDolly + introEase * 0.1);
    const off = _v2.copy(cam.position).sub(pivot).applyQuaternion(_q1).multiplyScalar(dolly);
    view.position.copy(pivot).add(this.follow).add(off);
    view.quaternion.copy(_q1).multiply(cam.quaternion);
    view.aspect = cam.aspect;
    this.shift = damp(this.shift, this.o.viewShift(), 5, dt);
    const shift = Math.round(this.shift);
    if (shift) view.setViewOffset(r.size.width, r.size.height, 0, shift, r.size.width, r.size.height);
    view.updateProjectionMatrix();
    view.updateMatrixWorld(true);

    const h = r.size.height;
    this.backdrop?.update(time, view, this.pulse);
    const fog = this.o.scene.fog;
    if (fog && this.backdrop && this.spec.fog !== false) {
      // the horizon straight ahead: floors and far walls dissolve into the backdrop
      _v1.set(0, 0, -1).applyQuaternion(view.quaternion);
      _v1.y = 0;
      if (_v1.lengthSq() < 1e-4) _v1.set(0, 0, -1);
      _v1.normalize().setY(0.1).normalize();
      this.backdrop.sample(_v1, fog.color).multiplyScalar(0.7);
    }
    for (const m of this.motes) m.update(reduced ? 0 : time, h, view.fov, this.pulse * 0.35);
    for (const s of this.shafts) s.update(time);
    for (const p of this.pools) p.update(time, this.pulse);
    this.custom?.(dt, time);
    const fxMoving = this.fx.update(dt, view, h, view.fov);

    return fxMoving || this.dragging || this.pulse > 0 || this.sweepT >= 0 || this.intro > 0 ||
      Math.abs(this.yaw - targetYaw) > 0.02 || Math.abs(this.shift - this.o.viewShift()) > 0.5 || Math.abs(this.zoom - this.zoomTarget) > 0.002;
  }
}

const _v1 = new THREE.Vector3();
const _v2 = new THREE.Vector3();
const _v3 = new THREE.Vector3();
const _v4 = new THREE.Vector3();
const _q1 = new THREE.Quaternion();
const _q2 = new THREE.Quaternion();
const _up = new THREE.Vector3(0, 1, 0);

function makeLight(l: LightSpec): THREE.Object3D {
  if (l.type === 'hemi') return new THREE.HemisphereLight(l.color, l.ground ?? '#000000', l.intensity);
  if (l.type === 'dir') {
    const d = new THREE.DirectionalLight(l.color, l.intensity);
    d.position.set(...(l.at ?? [2, 6, 4]));
    return d;
  }
  if (l.type === 'spot') {
    const s = new THREE.SpotLight(l.color, l.intensity, l.distance ?? 30, l.angle ?? 0.5, 0.7, 1.2);
    s.position.set(...(l.at ?? [0, 8, 4]));
    s.target.position.set(...(l.to ?? [0, 0, 0]));
    const g = new THREE.Group();
    g.add(s, s.target);
    return g;
  }
  const p = new THREE.PointLight(l.color, l.intensity, l.distance ?? 18, 1.6);
  p.position.set(...(l.at ?? [0, 3, 3]));
  return p;
}
