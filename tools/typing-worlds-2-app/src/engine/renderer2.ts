/**
 * 3D Type 2.0 renderer.
 *
 * Same public surface as the 1.0 WorldRenderer (the 23 world modules are used unchanged and
 * only ever see this through WorldContext.renderer), with a different picture pipeline:
 *
 *   scene ─▶ view camera (the world's camera + the 2.0 camera rig) ─▶ MSAA HDR target
 *         ─▶ bloom ─▶ tone map ─▶ grade (split tone · vignette · grain · fringe)
 *
 * The world's own camera is never written: every frame the rig derives a `view` camera from it,
 * so a world that re-fits its camera on resize or layout keeps working as in 1.0.
 */
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { TexturePass } from 'three/examples/jsm/postprocessing/TexturePass.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type { Quality } from '@v1/engine/types';

export interface FrameHandler {
  (dt: number, time: number): boolean;
}

export interface Look {
  exposure: number;
  bloom: { strength: number; radius: number; threshold: number };
  /** multiplies highlights / shadows (split toning), display space */
  tint: [number, number, number];
  shadow: [number, number, number];
  /** added to the darkest tones so black is never a flat #000 */
  lift: [number, number, number];
  contrast: number;
  saturation: number;
  vignette: number;
  grain: number;
  fringe: number;
}

export const DEFAULT_LOOK: Look = {
  exposure: 1.08,
  bloom: { strength: 0.32, radius: 0.62, threshold: 0.8 },
  tint: [1, 1, 1],
  shadow: [1, 1, 1],
  lift: [0.004, 0.005, 0.008],
  contrast: 1.06,
  saturation: 1.08,
  vignette: 0.42,
  grain: 0.035,
  fringe: 0.007,
};

const GradeShader = {
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    uTime: { value: 0 },
    uTint: { value: new THREE.Vector3(1, 1, 1) },
    uShadow: { value: new THREE.Vector3(1, 1, 1) },
    uLift: { value: new THREE.Vector3(0, 0, 0) },
    uContrast: { value: 1 },
    uSaturation: { value: 1 },
    uVignette: { value: 0.4 },
    uGrain: { value: 0.03 },
    uFringe: { value: 0.01 },
    uFlash: { value: 0 },
    uFlashCol: { value: new THREE.Vector3(1, 1, 1) },
    uFade: { value: 0 },
    uAspect: { value: 1 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uTime, uContrast, uSaturation, uVignette, uGrain, uFringe, uFlash, uFade, uAspect;
    uniform vec3 uTint, uShadow, uLift, uFlashCol;
    varying vec2 vUv;
    float hash(vec2 p) { vec3 q = fract(vec3(p.xyx) * .1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
    void main() {
      vec2 c = vUv - .5;
      float r2 = dot(c, c);
      vec2 off = c * r2 * uFringe;
      vec3 col = vec3(texture2D(tDiffuse, vUv + off).r, texture2D(tDiffuse, vUv).g, texture2D(tDiffuse, vUv - off).b);
      float l = dot(col, vec3(.2126, .7152, .0722));
      col = mix(vec3(l), col, uSaturation);
      col = max(vec3(0.), (col - .32) * uContrast + .32);
      col *= mix(uShadow, uTint, smoothstep(0., .62, l));
      col += uLift * (1. - smoothstep(0., .35, l));
      vec2 v = c * vec2(mix(1., uAspect, .35), 1.);
      col *= 1. - uVignette * smoothstep(.12, .62, dot(v, v));
      col += uFlashCol * uFlash * (.35 + .65 * (1. - smoothstep(0., .5, r2)));
      float g = hash(gl_FragCoord.xy + fract(uTime) * 311.7) - .5;
      col += g * uGrain * (1. - .55 * l);
      col *= 1. - uFade;
      gl_FragColor = vec4(col, 1.);
    }
  `,
};

export class Renderer2 {
  readonly renderer: THREE.WebGLRenderer;
  readonly canvas: HTMLCanvasElement;
  scene = new THREE.Scene();
  /** the world's camera (worlds write it) */
  camera = new THREE.PerspectiveCamera(40, 1, 0.1, 400);
  /** the camera the picture is taken with: `camera` plus the 2.0 rig */
  view = new THREE.PerspectiveCamera(40, 1, 0.1, 400);
  quality: Quality;
  look: Look = { ...DEFAULT_LOOK };
  /** 0..1 fade to black (world transitions) */
  fade = 0;
  /** additive screen flash, decays by itself */
  flash = 0;
  flashColor = new THREE.Color(1, 1, 1);
  /** runs after the world's frame, before the picture is taken; returns true while it moves */
  director: ((dt: number, time: number) => boolean) | null = null;
  /** keep drawing at a low rate while idle (2.0 scenes are never completely still) */
  alwaysOn = true;
  onQualityDrop?: (q: Quality) => void;
  onResize?: (w: number, h: number) => void;
  paused = false;

  private composer: EffectComposer | null = null;
  private renderPass: RenderPass | null = null;
  private bloomPass: UnrealBloomPass | null = null;
  private gradePass: ShaderPass | null = null;
  /** display-referred scene target (non-HDR worlds) */
  private sceneRT: THREE.WebGLRenderTarget | null = null;
  private hdr = false;
  private frame: FrameHandler | null = null;
  private raf = 0;
  private idleTimer = 0;
  private lastT = 0;
  private aliveUntil = 0;
  private time = 0;
  private width = 1;
  private height = 1;
  private frameTimes: number[] = [];
  private envTex: THREE.Texture | null = null;

  constructor(private container: HTMLElement, quality: Quality) {
    this.quality = quality;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.canvas = this.renderer.domElement;
    this.canvas.className = 'tw-canvas t2-canvas';
    container.appendChild(this.canvas);
    this.applyQuality();
    new ResizeObserver(() => this.resize()).observe(container);
    this.resize();
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) this.wake();
    });
  }

  get size() {
    return { width: this.width, height: this.height, aspect: this.width / Math.max(1, this.height) };
  }

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
    this.buildComposer();
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
    const pr = this.renderer.getPixelRatio();
    this.sceneRT?.setSize(Math.round(this.width * pr), Math.round(this.height * pr));
    this.onResize?.(this.width, this.height);
    this.wake();
    this.renderNow();
  }

  mount(opts: { bloom?: { strength: number; radius: number; threshold: number }; ambient?: boolean }) {
    this.hdr = !!opts.bloom;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(40, this.width / this.height, 0.1, 400);
    this.view = new THREE.PerspectiveCamera(40, this.width / this.height, 0.1, 400);
    this.buildComposer();
    return { scene: this.scene, camera: this.camera };
  }

  setLook(look: Look) {
    this.look = look;
    this.applyLook();
  }

  private applyLook() {
    const k = this.look;
    this.renderer.toneMappingExposure = k.exposure;
    if (this.bloomPass) {
      this.bloomPass.strength = k.bloom.strength;
      this.bloomPass.radius = k.bloom.radius;
      this.bloomPass.threshold = k.bloom.threshold;
    }
    const u = this.gradePass?.uniforms;
    if (u) {
      u.uTint.value.set(...k.tint);
      u.uShadow.value.set(...k.shadow);
      u.uLift.value.set(...k.lift);
      u.uContrast.value = k.contrast;
      u.uSaturation.value = k.saturation;
      u.uVignette.value = k.vignette;
      u.uGrain.value = k.grain;
      u.uFringe.value = k.fringe;
    }
  }

  private buildComposer() {
    // the composer frees only its own two targets; each pass (bloom has eleven) frees its own
    for (const pass of this.composer?.passes ?? []) pass.dispose();
    this.composer?.dispose();
    this.sceneRT?.dispose();
    this.composer = null;
    this.renderPass = null;
    this.bloomPass = null;
    this.gradePass = null;
    this.sceneRT = null;
    if (this.quality === 0) {
      this.applyLook();
      return;
    }
    const pr = this.renderer.getPixelRatio();
    const w = Math.round(this.width * pr);
    const h = Math.round(this.height * pr);
    const samples = this.quality === 2 ? 4 : 2;
    let c: EffectComposer;
    if (this.hdr) {
      c = new EffectComposer(this.renderer, new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, samples }));
      c.setPixelRatio(pr);
      c.setSize(this.width, this.height);
      this.renderPass = new RenderPass(this.scene, this.view);
      c.addPass(this.renderPass);
    } else {
      const rt = new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, samples });
      // three tone-maps and sRGB-encodes in the material only for the screen or an XR target;
      // flagging the target makes this pass produce the picture 1.0 put on screen
      (rt as unknown as { isXRRenderTarget: boolean }).isXRRenderTarget = true;
      rt.texture.colorSpace = THREE.SRGBColorSpace;
      this.sceneRT = rt;
      c = new EffectComposer(this.renderer);
      c.setPixelRatio(pr);
      c.setSize(this.width, this.height);
      c.addPass(new TexturePass(rt.texture));
    }
    this.bloomPass = new UnrealBloomPass(new THREE.Vector2(this.width, this.height), 0.3, 0.6, 0.8);
    c.addPass(this.bloomPass);
    if (this.hdr) c.addPass(new OutputPass());
    this.gradePass = new ShaderPass(GradeShader);
    c.addPass(this.gradePass);
    this.composer = c;
    this.applyLook();
  }

  get bloom() {
    return this.bloomPass;
  }

  setFrameHandler(fn: FrameHandler | null) {
    this.frame = fn;
    this.wake();
  }

  keepAlive(ms = 600) {
    this.aliveUntil = Math.max(this.aliveUntil, performance.now() + ms);
    this.wake();
  }

  wake() {
    if (this.raf || this.paused) return;
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = 0;
    }
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
      console.error('[3d-type-2] frame error', e);
    }
    try {
      if (this.director?.(dt, this.time)) moving = true;
    } catch (e) {
      console.error('[3d-type-2] director error', e);
    }
    if (this.flash > 0) {
      this.flash = Math.max(0, this.flash - dt * 2.4);
      moving = true;
    }
    this.renderNow();
    const busy = moving || now < this.aliveUntil;
    if (busy) this.trackPerf(dt);
    // the frame itself may have called wake() (keepAlive, a quality drop): never queue a second loop
    if (this.raf) return;
    if (busy) {
      this.raf = requestAnimationFrame(this.loop);
    } else if (this.alwaysOn && !document.hidden) {
      const wait = 1000 / 30;
      this.idleTimer = window.setTimeout(() => {
        this.idleTimer = 0;
        if (!this.raf && !this.paused) {
          this.lastT = performance.now() - wait;
          this.raf = requestAnimationFrame(this.loop);
        }
      }, wait);
    }
  };

  renderNow() {
    if (this.composer && this.gradePass) {
      if (this.renderPass) {
        this.renderPass.scene = this.scene;
        this.renderPass.camera = this.view;
      } else if (this.sceneRT) {
        this.renderer.setRenderTarget(this.sceneRT);
        this.renderer.clear();
        this.renderer.render(this.scene, this.view);
        this.renderer.setRenderTarget(null);
      }
      const u = this.gradePass.uniforms;
      u.uTime.value = this.time;
      u.uFlash.value = this.flash * this.flash;
      u.uFlashCol.value.set(this.flashColor.r, this.flashColor.g, this.flashColor.b);
      u.uFade.value = this.fade;
      u.uAspect.value = this.width / Math.max(1, this.height);
      this.composer.render();
    } else {
      this.renderer.render(this.scene, this.view);
    }
  }

  private trackPerf(dt: number) {
    if (dt <= 0 || dt > 0.2) return;
    this.frameTimes.push(dt);
    if (this.frameTimes.length < 120) return;
    const avg = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
    this.frameTimes = [];
    if (avg > 1 / 34 && this.quality > 0) {
      const q = (this.quality - 1) as Quality;
      console.info('[3d-type-2] adaptive quality →', q, (1 / avg).toFixed(1), 'fps');
      this.setQuality(q);
      this.onQualityDrop?.(q);
    }
  }

  raycaster(clientX: number, clientY: number) {
    const r = this.canvas.getBoundingClientRect();
    const ndc = new THREE.Vector2(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    const ray = new THREE.Raycaster();
    ray.setFromCamera(ndc, this.view);
    return { ndc, ray };
  }

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
    this.renderer.renderLists.dispose();
  }
}
