/**
 * Pooled CPU-simulated particles rendered as a single Points draw call.
 * Good for a few thousand short-lived particles (dust, sparkles, bubbles, embers, sand).
 */
import * as THREE from 'three';

export interface ParticleOptions {
  capacity?: number;
  /** world-space gravity */
  gravity?: [number, number, number];
  /** velocity damping per second */
  drag?: number;
  blending?: THREE.Blending;
  /** 'dot' soft disc, 'spark' 4-point star, 'ring' bubble, 'flake' irregular */
  shape?: 'dot' | 'spark' | 'ring' | 'flake';
  /** base point size in world units (attenuated) */
  size?: number;
  depthWrite?: boolean;
  opacity?: number;
  /** optional ground plane (y) where particles settle */
  floor?: number;
}

export interface EmitOptions {
  x: number;
  y: number;
  z: number;
  vx?: number;
  vy?: number;
  vz?: number;
  life?: number;
  size?: number;
  color?: THREE.ColorRepresentation | THREE.Color;
  /** per-particle extra drag (bubbles) */
  wobble?: number;
  /** fade curve: 0 linear, 1 = hold then fade */
  hold?: number;
}

const SHAPES = { dot: 0, spark: 1, ring: 2, flake: 3 } as const;

export class Particles {
  readonly points: THREE.Points;
  private pos: Float32Array;
  private vel: Float32Array;
  private col: Float32Array;
  private data: Float32Array; // life, maxLife, size, wobble
  private alpha: Float32Array;
  private sizeAttr: Float32Array;
  private hold: Float32Array;
  private cap: number;
  private head = 0;
  alive = 0;
  private g: THREE.Vector3;
  private drag: number;
  private floor?: number;
  private geo: THREE.BufferGeometry;
  private mat: THREE.ShaderMaterial;
  private tmpColor = new THREE.Color();

  constructor(opts: ParticleOptions = {}) {
    const cap = (this.cap = opts.capacity ?? 1200);
    this.pos = new Float32Array(cap * 3);
    this.vel = new Float32Array(cap * 3);
    this.col = new Float32Array(cap * 3);
    this.data = new Float32Array(cap * 4);
    this.alpha = new Float32Array(cap);
    this.sizeAttr = new Float32Array(cap);
    this.hold = new Float32Array(cap);
    this.g = new THREE.Vector3(...(opts.gravity ?? [0, -1.5, 0]));
    this.drag = opts.drag ?? 1.2;
    this.floor = opts.floor;
    this.geo = new THREE.BufferGeometry();
    this.geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    this.geo.setAttribute('color', new THREE.BufferAttribute(this.col, 3).setUsage(THREE.DynamicDrawUsage));
    this.geo.setAttribute('aAlpha', new THREE.BufferAttribute(this.alpha, 1).setUsage(THREE.DynamicDrawUsage));
    this.geo.setAttribute('aSize', new THREE.BufferAttribute(this.sizeAttr, 1).setUsage(THREE.DynamicDrawUsage));
    this.geo.setDrawRange(0, 0);
    this.mat = new THREE.ShaderMaterial({
      uniforms: {
        uScale: { value: 400 },
        uShape: { value: SHAPES[opts.shape ?? 'dot'] },
        uOpacity: { value: opts.opacity ?? 1 },
      },
      vertexShader: /* glsl */ `
        attribute float aAlpha; attribute float aSize; varying vec3 vColor; varying float vAlpha;
        uniform float uScale;
        void main(){
          vColor = color; vAlpha = aAlpha;
          vec4 mv = modelViewMatrix * vec4(position,1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = aSize * uScale / max(0.001, -mv.z);
        }`,
      fragmentShader: /* glsl */ `
        varying vec3 vColor; varying float vAlpha; uniform float uShape; uniform float uOpacity;
        void main(){
          vec2 p = gl_PointCoord*2.0-1.0; float r = length(p); float a;
          if (uShape < 0.5) { a = smoothstep(1.0, 0.0, r); a*=a; }
          else if (uShape < 1.5) { float s = max(0.0, 1.0 - abs(p.x*p.y)*14.0 - r*0.9); a = s + smoothstep(0.5,0.0,r); }
          else if (uShape < 2.5) { a = smoothstep(1.0,0.85,r) * smoothstep(0.55,0.85,r) + smoothstep(0.5,0.0,length(p-vec2(-0.35,0.35)))*0.8; }
          else { a = step(r, 0.9 - 0.25*sin(atan(p.y,p.x)*3.0)); }
          if (a < 0.01) discard;
          gl_FragColor = vec4(vColor, a * vAlpha * uOpacity);
        }`,
      vertexColors: true,
      transparent: true,
      depthWrite: opts.depthWrite ?? false,
      blending: opts.blending ?? THREE.AdditiveBlending,
    });
    this.points = new THREE.Points(this.geo, this.mat);
    this.points.frustumCulled = false;
    this.points.renderOrder = 10;
    this.baseSize = opts.size ?? 0.05;
    const v2 = new THREE.Vector2();
    this.points.onBeforeRender = (r, _s, cam) => {
      const h = r.getDrawingBufferSize(v2).y;
      const fov = (cam as THREE.PerspectiveCamera).fov ?? 50;
      this.mat.uniforms.uScale.value = h / (2 * Math.tan((fov * Math.PI) / 360));
    };
  }
  private baseSize: number;

  setPixelScale(viewportHeight: number, fovDeg: number) {
    this.mat.uniforms.uScale.value = viewportHeight / (2 * Math.tan((fovDeg * Math.PI) / 360));
  }

  emit(o: EmitOptions) {
    const i = this.head;
    this.head = (this.head + 1) % this.cap;
    const p = i * 3;
    this.pos[p] = o.x;
    this.pos[p + 1] = o.y;
    this.pos[p + 2] = o.z;
    this.vel[p] = o.vx ?? 0;
    this.vel[p + 1] = o.vy ?? 0;
    this.vel[p + 2] = o.vz ?? 0;
    const c = o.color instanceof THREE.Color ? o.color : this.tmpColor.set(o.color ?? 0xffffff);
    this.col[p] = c.r;
    this.col[p + 1] = c.g;
    this.col[p + 2] = c.b;
    const d = i * 4;
    const life = o.life ?? 1;
    this.data[d] = life;
    this.data[d + 1] = life;
    this.data[d + 2] = (o.size ?? 1) * this.baseSize;
    this.data[d + 3] = o.wobble ?? 0;
    this.hold[i] = o.hold ?? 0;
    this.sizeAttr[i] = this.data[d + 2];
    this.alpha[i] = 1;
    this.geo.setDrawRange(0, Math.max(this.geo.drawRange.count, i + 1));
  }

  /** returns true while any particle is alive */
  update(dt: number, time = 0): boolean {
    let alive = 0;
    const g = this.g;
    const dragK = Math.exp(-this.drag * dt);
    const n = this.geo.drawRange.count;
    for (let i = 0; i < n; i++) {
      const d = i * 4;
      if (this.data[d] <= 0) {
        this.alpha[i] = 0;
        continue;
      }
      this.data[d] -= dt;
      const life = this.data[d] / this.data[d + 1];
      const p = i * 3;
      const wob = this.data[d + 3];
      this.vel[p] = this.vel[p] * dragK + g.x * dt + (wob ? Math.sin(time * 9 + i) * wob * dt : 0);
      this.vel[p + 1] = this.vel[p + 1] * dragK + g.y * dt;
      this.vel[p + 2] = this.vel[p + 2] * dragK + g.z * dt + (wob ? Math.cos(time * 7 + i * 1.3) * wob * dt : 0);
      this.pos[p] += this.vel[p] * dt;
      this.pos[p + 1] += this.vel[p + 1] * dt;
      this.pos[p + 2] += this.vel[p + 2] * dt;
      if (this.floor !== undefined && this.pos[p + 1] < this.floor) {
        this.pos[p + 1] = this.floor;
        this.vel[p] *= 0.3;
        this.vel[p + 1] = 0;
        this.vel[p + 2] *= 0.3;
      }
      const h = this.hold[i];
      this.alpha[i] = h > 0 ? Math.min(1, life / Math.max(0.01, 1 - h)) : life;
      if (this.data[d] <= 0) this.alpha[i] = 0;
      else alive++;
    }
    this.alive = alive;
    if (n) {
      this.geo.attributes.position.needsUpdate = true;
      this.geo.attributes.color.needsUpdate = true;
      this.geo.attributes.aAlpha.needsUpdate = true;
      this.geo.attributes.aSize.needsUpdate = true;
    }
    if (!alive && n) this.geo.setDrawRange(0, 0), (this.head = 0);
    return alive > 0;
  }

  clear() {
    this.data.fill(0);
    this.geo.setDrawRange(0, 0);
    this.head = 0;
  }

  dispose() {
    this.geo.dispose();
    this.mat.dispose();
    this.points.removeFromParent();
  }
}
