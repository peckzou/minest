/**
 * LetterWorld — optional base class that handles the bookkeeping most worlds share:
 * letter visuals keyed by stable id, removal queues, finale ownership, tweens,
 * and safe disposal. Worlds focus on how a letter is *created*.
 */
import * as THREE from 'three';
import { Tweens } from './anim';
import type { Slot } from './layout';
import type { DeleteEvent, InsertEvent, LetterRef, SaveOutcome, WorldContext, WorldInstance } from './types';

export interface LetterVisual {
  ref: LetterRef;
  /** live layout target (updated in place on reflow) */
  slot: Slot;
  object: THREE.Object3D;
  state: 'creating' | 'alive' | 'removing' | 'finale';
  age: number;
}

export function disposeObject(obj: THREE.Object3D) {
  obj.traverse((o) => {
    const m = o as THREE.Mesh;
    if (m.geometry && !m.geometry.userData?.shared) m.geometry.dispose();
    const mat = m.material as THREE.Material | THREE.Material[] | undefined;
    const list = Array.isArray(mat) ? mat : mat ? [mat] : [];
    for (const mm of list) {
      if (mm.userData?.shared) continue;
      mm.dispose();
    }
  });
  obj.removeFromParent();
}

export abstract class LetterWorld<V extends LetterVisual = LetterVisual> implements WorldInstance {
  protected letters = new Map<number, V>();
  /** visuals no longer in the text (removing / finale) but still animating */
  protected detached = new Set<V>();
  protected tweens = new Tweens();
  protected root = new THREE.Group();
  protected time = 0;

  constructor(protected ctx: WorldContext) {
    ctx.scene.add(this.root);
  }

  /** create the visual for a char; return null for chars without visuals (spaces) */
  protected abstract createLetter(ev: InsertEvent, slot: Slot): V | null;
  /** start removal; must eventually call this.release(v) */
  protected abstract removeLetter(v: V, ev: DeleteEvent): void;
  /** per-frame letter update; return true if still moving */
  protected updateLetter(_v: V, _dt: number, _t: number): boolean {
    return false;
  }
  /** finale on Enter; must eventually release all visuals */
  protected abstract playFinale(word: string, visuals: V[], saved: Promise<SaveOutcome>): void;
  /** world-level per-frame (environment); return true if moving */
  protected updateWorld(_dt: number, _t: number): boolean {
    return false;
  }

  onCharacterInput(ev: InsertEvent): void {
    const slot = this.ctx.slotOf(ev.id);
    if (!slot) return;
    const v = this.createLetter(ev, slot);
    if (v) this.letters.set(ev.id, v);
  }

  onCharacterDelete(ev: DeleteEvent): void {
    const v = this.letters.get(ev.id);
    if (!v) return;
    this.letters.delete(ev.id);
    v.state = 'removing';
    this.detached.add(v);
    this.removeLetter(v, ev);
  }

  onWordComplete(word: string, refs: readonly LetterRef[], saved: Promise<SaveOutcome>): void {
    const vis: V[] = [];
    for (const r of refs) {
      const v = this.letters.get(r.id);
      if (!v) continue;
      this.letters.delete(r.id);
      v.state = 'finale';
      this.detached.add(v);
      vis.push(v);
    }
    this.playFinale(word, vis, saved);
  }

  onTextClear(refs: readonly LetterRef[]): void {
    refs.forEach((r, i) => this.onCharacterDelete({ ...r, burstIndex: i, burstSize: refs.length }));
  }

  /** remove + dispose a visual */
  protected release(v: V) {
    this.detached.delete(v);
    this.letters.delete(v.ref.id);
    disposeObject(v.object);
  }

  updateAnimation(dt: number, time: number): boolean {
    this.time = time;
    let moving = this.tweens.update(dt);
    for (const v of this.letters.values()) {
      v.age += dt;
      if (this.updateLetter(v, dt, time)) moving = true;
    }
    for (const v of this.detached) {
      v.age += dt;
      if (this.updateLetter(v, dt, time)) moving = true;
    }
    if (this.detached.size) moving = true;
    if (this.updateWorld(dt, time)) moving = true;
    this.ctx.tempo.backlog = [...this.letters.values()].filter((v) => v.state === 'creating').length;
    return moving;
  }

  disposeWorld(): void {
    this.tweens.clear();
    for (const v of this.letters.values()) disposeObject(v.object);
    for (const v of this.detached) disposeObject(v.object);
    this.letters.clear();
    this.detached.clear();
    disposeObject(this.root);
  }
}

/* --------------------------------------------------------------- helpers */

/** Vertical gradient sky as a big inverted sphere (cheap, no textures). */
export function gradientSky(top: THREE.ColorRepresentation, bottom: THREE.ColorRepresentation, opts: { radius?: number; exponent?: number; horizon?: THREE.ColorRepresentation } = {}) {
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      uTop: { value: new THREE.Color(top) },
      uBottom: { value: new THREE.Color(bottom) },
      uHorizon: { value: new THREE.Color(opts.horizon ?? bottom) },
      uExp: { value: opts.exponent ?? 0.8 },
    },
    vertexShader: `varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0);} `,
    fragmentShader: `uniform vec3 uTop; uniform vec3 uBottom; uniform vec3 uHorizon; uniform float uExp; varying vec3 vP;
      void main(){ float h = vP.y; vec3 c = h > 0.0 ? mix(uHorizon, uTop, pow(clamp(h,0.0,1.0), uExp)) : mix(uHorizon, uBottom, clamp(-h*3.0,0.0,1.0));
      gl_FragColor = vec4(c,1.0);
      #include <colorspace_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(opts.radius ?? 180, 32, 16), mat);
  mesh.renderOrder = -10;
  mesh.frustumCulled = false;
  return mesh;
}

/** Canvas texture helper */
export function canvasTexture(w: number, h: number, draw: (g: CanvasRenderingContext2D, w: number, h: number) => void, opts: { srgb?: boolean; repeat?: number } = {}) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d')!;
  draw(g, w, h);
  const tex = new THREE.CanvasTexture(c);
  if (opts.srgb !== false) tex.colorSpace = THREE.SRGBColorSpace;
  if (opts.repeat) {
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(opts.repeat, opts.repeat);
  }
  tex.anisotropy = 4;
  return tex;
}

/** Soft radial blob texture (contact shadows, glows). */
let blobTex: THREE.Texture | null = null;
export function blobTexture() {
  if (blobTex) return blobTex;
  blobTex = canvasTexture(128, 128, (g, w, h) => {
    const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    gr.addColorStop(0, 'rgba(255,255,255,1)');
    gr.addColorStop(0.4, 'rgba(255,255,255,0.55)');
    gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr;
    g.fillRect(0, 0, w, h);
  });
  blobTex.userData.shared = true;
  return blobTex;
}

/** Fit the camera so the text block (plus margin) is visible. */
export function fitCameraToWidth(camera: THREE.PerspectiveCamera, width: number, distanceMin: number, aspect: number) {
  const fov = (camera.fov * Math.PI) / 180;
  const hfov = 2 * Math.atan(Math.tan(fov / 2) * aspect);
  return Math.max(distanceMin, width / 2 / Math.tan(hfov / 2));
}
