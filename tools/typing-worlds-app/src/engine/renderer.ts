/**
 * World Renderer — one WebGL context for the whole app.
 *
 * - Each world gets a fresh Scene + PerspectiveCamera; on exit everything in the
 *   scene graph (geometries, materials, textures, render targets) is disposed.
 * - Render loop is on demand: frames run while the world reports motion, then the
 *   loop parks (ambient worlds drop to a low frame rate).
 * - Optional bloom via EffectComposer, quality tiers, adaptive downgrade.
 */
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type { Quality } from './types';

export interface FrameHandler {
  /** return true while anything moves */
  (dt: number, time: number): boolean;
}

export class WorldRenderer {
  readonly renderer: THREE.WebGLRenderer;
  readonly canvas: HTMLCanvasElement;
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(40, 1, 0.1, 400);
  quality: Quality;
  private composer: EffectComposer | null = null;
  private bloomPass: UnrealBloomPass | null = null;
  private bloomCfg: { strength: number; radius: number; threshold: number } | null = null;
  private frame: FrameHandler | null = null;
  private raf = 0;
  private lastT = 0;
  private aliveUntil = 0;
  private ambient = false;
  private lastAmbient = 0;
  private time = 0;
  private width = 1;
  private height = 1;
  private frameTimes: number[] = [];
  private envTex: THREE.Texture | null = null;
  onQualityDrop?: (q: Quality) => void;
  /** called after every resize (worlds may refit cameras) */
  onResize?: (w: number, h: number) => void;
  paused = false;

  constructor(private container: HTMLElement, quality: Quality) {
    this.quality = quality;
    this.renderer = new THREE.WebGLRenderer({ antialias: quality > 0, alpha: false, powerPreference: 'high-performance' });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.canvas = this.renderer.domElement;
    this.canvas.className = 'tw-canvas';
    container.appendChild(this.canvas);
    this.applyQuality();
    const ro = new ResizeObserver(() => this.resize());
    ro.observe(container);
    this.resize();
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) this.wake();
    });
  }

  get size() {
    return { width: this.width, height: this.height, aspect: this.width / Math.max(1, this.height) };
  }

  /** Shared PMREM environment (studio lighting) for reflective materials. */
  environment(): THREE.Texture {
    if (!this.envTex) {
      const pm = new THREE.PMREMGenerator(this.renderer);
      this.envTex = pm.fromScene(new RoomEnvironment(), 0.04).texture;
      pm.dispose();
    }
    return this.envTex;
  }

  setQuality(q: Quality) {
    this.quality = q;
    this.applyQuality();
    this.resize();
  }

  private applyQuality() {
    const dpr = window.devicePixelRatio || 1;
    const cap = this.quality === 2 ? 2 : this.quality === 1 ? 1.5 : 1;
    this.renderer.setPixelRatio(Math.min(dpr, cap));
    this.renderer.shadowMap.enabled = this.quality > 0;
  }

  resize() {
    const r = this.container.getBoundingClientRect();
    this.width = Math.max(1, Math.round(r.width));
    this.height = Math.max(1, Math.round(r.height));
    this.renderer.setSize(this.width, this.height, false);
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.composer?.setSize(this.width, this.height);
    this.bloomPass?.setSize(this.width, this.height);
    this.onResize?.(this.width, this.height);
    this.renderNow();
  }

  /** Install a new world scene. Previous scene must already be disposed. */
  mount(opts: { bloom?: { strength: number; radius: number; threshold: number }; ambient?: boolean }) {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(40, this.width / this.height, 0.1, 400);
    this.bloomCfg = opts.bloom ?? null;
    this.ambient = !!opts.ambient;
    this.buildComposer();
    this.renderer.toneMappingExposure = 1;
    return { scene: this.scene, camera: this.camera };
  }

  private buildComposer() {
    this.composer?.dispose();
    this.composer = null;
    this.bloomPass = null;
    if (!this.bloomCfg || this.quality === 0) return;
    const c = new EffectComposer(this.renderer);
    c.setSize(this.width, this.height);
    c.addPass(new RenderPass(this.scene, this.camera));
    const b = new UnrealBloomPass(new THREE.Vector2(this.width, this.height), this.bloomCfg.strength, this.bloomCfg.radius, this.bloomCfg.threshold);
    c.addPass(b);
    c.addPass(new OutputPass());
    this.composer = c;
    this.bloomPass = b;
  }

  get bloom() {
    return this.bloomPass;
  }

  setFrameHandler(fn: FrameHandler | null) {
    this.frame = fn;
    this.wake();
  }

  /** keep rendering for at least `ms` */
  keepAlive(ms = 600) {
    this.aliveUntil = Math.max(this.aliveUntil, performance.now() + ms);
    this.wake();
  }

  wake() {
    if (this.raf || this.paused) return;
    this.lastT = performance.now();
    this.raf = requestAnimationFrame(this.loop);
  }

  private loop = (now: number) => {
    this.raf = 0;
    if (this.paused) return;
    const dt = Math.min(0.05, Math.max(0, (now - this.lastT) / 1000));
    this.lastT = now;
    this.time += dt;
    let moving = false;
    try {
      moving = this.frame ? this.frame(dt, this.time) : false;
    } catch (e) {
      // A broken world must never take down typing.
      console.error('[typing-worlds] frame error', e);
    }
    this.renderNow();
    this.trackPerf(dt);
    const busy = moving || now < this.aliveUntil;
    if (busy) {
      this.raf = requestAnimationFrame(this.loop);
    } else if (this.ambient && !document.hidden) {
      // ambient idle: ~24 fps
      const wait = 1000 / 24;
      setTimeout(() => {
        if (!this.raf && !this.paused) {
          this.lastT = performance.now() - wait;
          this.raf = requestAnimationFrame(this.loop);
        }
      }, wait);
    }
  };

  renderNow() {
    if (this.composer) this.composer.render();
    else this.renderer.render(this.scene, this.camera);
  }

  private trackPerf(dt: number) {
    if (dt <= 0 || dt > 0.2) return;
    this.frameTimes.push(dt);
    if (this.frameTimes.length < 90) return;
    const avg = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
    this.frameTimes = [];
    if (avg > 1 / 38 && this.quality > 0) {
      const q = (this.quality - 1) as Quality;
      console.info('[typing-worlds] adaptive quality →', q, (1 / avg).toFixed(1), 'fps');
      this.setQuality(q);
      this.buildComposer();
      this.onQualityDrop?.(q);
    }
  }

  /** NDC raycast helper for pointer interactions */
  raycaster(clientX: number, clientY: number) {
    const r = this.canvas.getBoundingClientRect();
    const ndc = new THREE.Vector2(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    const ray = new THREE.Raycaster();
    ray.setFromCamera(ndc, this.camera);
    return { ndc, ray };
  }

  /** Dispose every GPU resource reachable from the current scene. */
  disposeScene() {
    const disposeMat = (m: THREE.Material) => {
      for (const v of Object.values(m)) {
        if (v instanceof THREE.Texture && v !== this.envTex) v.dispose();
      }
      const u = (m as THREE.ShaderMaterial).uniforms;
      if (u) for (const k in u) if (u[k]?.value instanceof THREE.Texture && u[k].value !== this.envTex) u[k].value.dispose();
      m.dispose();
    };
    this.scene.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.geometry && !(mesh.geometry as { userData: { shared?: boolean } }).userData.shared) mesh.geometry.dispose();
      const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(mat)) mat.forEach(disposeMat);
      else if (mat) disposeMat(mat);
    });
    if (this.scene.background instanceof THREE.Texture && this.scene.background !== this.envTex) this.scene.background.dispose();
    this.scene.clear();
    this.composer?.dispose();
    this.composer = null;
    this.bloomPass = null;
    this.renderer.renderLists.dispose();
  }
}
