/**
 * Stage kit — the procedural set pieces 2.0 adds around a 1.0 world: a backdrop with depth,
 * air (motes), light shafts, a pool of light on the floor and the keystroke effects.
 * Everything is GPU-animated from one time uniform and lives in the world's own scene, so the
 * renderer's disposeScene() frees it with the world.
 */
import * as THREE from 'three';

const C = (hex: string | number) => new THREE.Color(hex as THREE.ColorRepresentation);

/* ------------------------------------------------------------------ backdrop */

export interface BackdropSpec {
  top: string;
  mid: string;
  bot: string;
  /** glow behind the stage */
  glow: string;
  glowPower?: number;
  glowSize?: number;
  /** world point the glow sits behind (default: the stage focus) */
  glowAt?: [number, number, number];
  /** second, wide glow (rim of the room / horizon) */
  haze?: string;
  hazePower?: number;
  /** drifting cloud/nebula amount 0..1 */
  noise?: number;
  /** star field amount 0..1 */
  stars?: number;
  /** horizontal light bands (underwater / aurora) 0..1 */
  bands?: number;
}

/** backdrop light is specified 0..1 and scaled into the dark end of the HDR range */
export const GLOW = 0.42;
export const HAZE = 0.35;

export class Backdrop {
  mesh: THREE.Mesh;
  uniforms: Record<string, THREE.IUniform>;
  glowAt = new THREE.Vector3();

  constructor(spec: BackdropSpec, focus: THREE.Vector3) {
    this.glowAt.copy(spec.glowAt ? new THREE.Vector3(...spec.glowAt) : focus);
    this.uniforms = {
      uTop: { value: C(spec.top) },
      uMid: { value: C(spec.mid) },
      uBot: { value: C(spec.bot) },
      uGlow: { value: C(spec.glow).multiplyScalar((spec.glowPower ?? 1) * GLOW) },
      uGlowSize: { value: spec.glowSize ?? 5 },
      uGlowDir: { value: new THREE.Vector3(0, 0, -1) },
      uHaze: { value: C(spec.haze ?? spec.glow).multiplyScalar((spec.hazePower ?? 0.25) * HAZE) },
      uNoise: { value: spec.noise ?? 0.25 },
      uStars: { value: spec.stars ?? 0 },
      uBands: { value: spec.bands ?? 0 },
      uTime: { value: 0 },
      uPulse: { value: 0 },
    };
    const mat = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      side: THREE.BackSide,
      depthWrite: false,
      depthTest: false,
      fog: false,
      toneMapped: false,
      vertexShader: /* glsl */ `
        varying vec3 vDir;
        void main() { vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 uTop, uMid, uBot, uGlow, uHaze, uGlowDir;
        uniform float uGlowSize, uNoise, uStars, uBands, uTime, uPulse;
        varying vec3 vDir;
        float hash(vec3 p) { p = fract(p * .3183099 + .1); p *= 17.; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
        float noise(vec3 x) {
          vec3 i = floor(x), f = fract(x); f = f * f * (3. - 2. * f);
          return mix(mix(mix(hash(i), hash(i + vec3(1, 0, 0)), f.x), mix(hash(i + vec3(0, 1, 0)), hash(i + vec3(1, 1, 0)), f.x), f.y),
                     mix(mix(hash(i + vec3(0, 0, 1)), hash(i + vec3(1, 0, 1)), f.x), mix(hash(i + vec3(0, 1, 1)), hash(i + vec3(1, 1, 1)), f.x), f.y), f.z);
        }
        float fbm(vec3 p) { float a = .5, s = 0.; for (int i = 0; i < 4; i++) { s += a * noise(p); p *= 2.03; a *= .5; } return s; }
        void main() {
          vec3 d = normalize(vDir);
          vec3 col = mix(uMid, uTop, smoothstep(0., .75, d.y));
          col = mix(col, uBot, smoothstep(0., -.55, d.y));
          float g = max(dot(d, uGlowDir), 0.);
          float core = pow(g, uGlowSize * 45.);
          float wide = pow(g, uGlowSize * 10.);
          float n = fbm(d * 2.6 + vec3(0., uTime * .012, uTime * .02));
          float cloud = smoothstep(.32, .9, n);
          col += uGlow * (core * .55 + wide * .45) * (1. + uPulse * .8) * mix(1., .55 + cloud * 1.1, uNoise);
          col += uHaze * pow(1. - abs(d.y), 9.) * (.6 + .4 * g) * mix(1., .4 + cloud * 1.3, uNoise);
          if (uBands > 0.) {
            float b = sin(d.x * 9. + n * 5. + uTime * .25) * .5 + .5;
            col += uHaze * uBands * pow(b, 3.) * smoothstep(-.1, .7, d.y) * (.4 + .6 * wide);
          }
          if (uStars > 0.) {
            vec3 q = d * 90.; vec3 id = floor(q); vec3 f = fract(q) - .5;
            float h = hash(id);
            float s = smoothstep(.16, 0., length(f)) * step(.965, h);
            s *= .55 + .45 * sin(uTime * (1. + h * 3.) + h * 40.);
            col += vec3(s) * uStars * (.6 + .4 * hash(id + 7.));
          }
          gl_FragColor = vec4(col, 1.);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }
      `,
    });
    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(120, 48, 24), mat);
    this.mesh.renderOrder = -1000;
    this.mesh.frustumCulled = false;
    this.mesh.name = 't2-backdrop';
  }

  /** the backdrop's colour in a direction (without clouds and stars): what distant fog should fade to */
  sample(dir: THREE.Vector3, out: THREE.Color) {
    const u = this.uniforms;
    const ss = (a: number, b: number, x: number) => {
      const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
      return t * t * (3 - 2 * t);
    };
    out.copy(u.uMid.value as THREE.Color).lerp(u.uTop.value as THREE.Color, ss(0, 0.75, dir.y));
    out.lerp(u.uBot.value as THREE.Color, ss(0, -0.55, dir.y));
    const g = Math.max(0, dir.dot(u.uGlowDir.value as THREE.Vector3));
    const size = u.uGlowSize.value as number;
    const glow = Math.pow(g, size * 45) * 0.55 + Math.pow(g, size * 10) * 0.45;
    const haze = Math.pow(1 - Math.abs(dir.y), 9) * (0.6 + 0.4 * g);
    const gc = u.uGlow.value as THREE.Color;
    const hc = u.uHaze.value as THREE.Color;
    out.r += gc.r * glow + hc.r * haze;
    out.g += gc.g * glow + hc.g * haze;
    out.b += gc.b * glow + hc.b * haze;
    return out;
  }

  update(time: number, view: THREE.Camera, pulse: number) {
    this.mesh.position.copy(view.position);
    this.uniforms.uTime.value = time;
    this.uniforms.uPulse.value = pulse;
    (this.uniforms.uGlowDir.value as THREE.Vector3).copy(this.glowAt).sub(view.position).normalize();
  }
}

/* ------------------------------------------------------------------ motes */

export type MoteShape = 'soft' | 'ring' | 'spark' | 'flake';

export interface MoteSpec {
  count: number;
  /** volume the motes live in: [minX,minY,minZ], [maxX,maxY,maxZ] */
  box: [[number, number, number], [number, number, number]];
  color: string;
  color2?: string;
  /** size in world units */
  size: number;
  opacity?: number;
  /** drift in units per second */
  vel?: [number, number, number];
  /** random wander in units */
  wobble?: number;
  twinkle?: number;
  shape?: MoteShape;
  blend?: 'add' | 'normal';
}

export class Motes {
  points: THREE.Points;
  uniforms: Record<string, THREE.IUniform>;

  constructor(spec: MoteSpec, qualityScale: number) {
    const n = Math.max(8, Math.round(spec.count * qualityScale));
    const pos = new Float32Array(n * 3);
    const seed = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = Math.random();
      pos[i * 3 + 1] = Math.random();
      pos[i * 3 + 2] = Math.random();
      seed[i * 4] = Math.random();
      seed[i * 4 + 1] = Math.random();
      seed[i * 4 + 2] = Math.random();
      seed[i * 4 + 3] = Math.random();
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 4));
    const [mn, mx] = spec.box;
    const shape = { soft: 0, ring: 1, spark: 2, flake: 3 }[spec.shape ?? 'soft'];
    this.uniforms = {
      uTime: { value: 0 },
      uMin: { value: new THREE.Vector3(...mn) },
      uSize3: { value: new THREE.Vector3(mx[0] - mn[0], mx[1] - mn[1], mx[2] - mn[2]) },
      uVel: { value: new THREE.Vector3(...(spec.vel ?? [0, 0, 0])) },
      uWobble: { value: spec.wobble ?? 0.3 },
      uSize: { value: spec.size },
      uScale: { value: 600 },
      uColA: { value: C(spec.color) },
      uColB: { value: C(spec.color2 ?? spec.color) },
      uOpacity: { value: spec.opacity ?? 0.6 },
      uTwinkle: { value: spec.twinkle ?? 0.5 },
      uShape: { value: shape },
      uBoost: { value: 0 },
    };
    const mat = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      transparent: true,
      depthWrite: false,
      fog: false,
      blending: spec.blend === 'normal' ? THREE.NormalBlending : THREE.AdditiveBlending,
      vertexShader: /* glsl */ `
        attribute vec4 aSeed;
        uniform float uTime, uWobble, uSize, uScale, uTwinkle, uBoost;
        uniform vec3 uMin, uSize3, uVel;
        varying float vAlpha; varying float vMix;
        void main() {
          float t = uTime;
          vec3 w = vec3(sin(t * (.21 + aSeed.x * .4) + aSeed.y * 40.), sin(t * (.17 + aSeed.z * .35) + aSeed.x * 31.), cos(t * (.19 + aSeed.y * .3) + aSeed.w * 23.)) * uWobble;
          vec3 p = fract(position + (uVel * t * (.6 + .8 * aSeed.w) + w) / uSize3);
          vec3 e = min(p, 1. - p);
          float fade = smoothstep(0., .1, min(e.x, min(e.y, e.z)));
          vec4 mv = viewMatrix * vec4(uMin + p * uSize3, 1.);
          gl_Position = projectionMatrix * mv;
          float tw = 1. - uTwinkle * (.5 + .5 * sin(t * (1.2 + aSeed.z * 3.5) + aSeed.w * 60.));
          gl_PointSize = max(1., uSize * (.45 + aSeed.x * 1.1) * uScale / max(.2, -mv.z));
          vAlpha = fade * tw * (1. + uBoost) * smoothstep(.3, 1.6, -mv.z);
          vMix = aSeed.y;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 uColA, uColB; uniform float uOpacity; uniform int uShape;
        varying float vAlpha; varying float vMix;
        void main() {
          vec2 q = gl_PointCoord - .5; float d = length(q) * 2.;
          float a;
          if (uShape == 1) { a = smoothstep(1., .82, d) * smoothstep(.55, .86, d) * .9 + smoothstep(.34, 0., length(q - vec2(-.16, -.16)) * 2.) * .8 + smoothstep(1., 0., d) * .12; }
          else if (uShape == 2) { a = pow(max(0., 1. - d), 3.) * 1.6; }
          else if (uShape == 3) { float s = max(abs(q.x), abs(q.y)) * 2.; a = smoothstep(1., .2, mix(d, s, .35)); }
          else { a = exp(-d * d * 3.2) * smoothstep(1., .7, d); }
          gl_FragColor = vec4(mix(uColA, uColB, vMix), a * vAlpha * uOpacity);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }
      `,
    });
    this.points = new THREE.Points(geo, mat);
    this.points.frustumCulled = false;
    this.points.renderOrder = 20;
    this.points.name = 't2-motes';
  }

  update(time: number, viewportH: number, fovDeg: number, boost: number) {
    this.uniforms.uTime.value = time;
    this.uniforms.uScale.value = viewportH / (2 * Math.tan((fovDeg * Math.PI) / 360));
    this.uniforms.uBoost.value = boost;
  }
}

/* ------------------------------------------------------------------ light shafts */

export interface ShaftSpec {
  /** where the light comes from */
  from: [number, number, number];
  /** where it lands */
  to: [number, number, number];
  color: string;
  count?: number;
  /** fan width at the landing point */
  spread?: number;
  width?: number;
  opacity?: number;
}

export class Shafts {
  group = new THREE.Group();
  private mats: THREE.ShaderMaterial[] = [];

  constructor(spec: ShaftSpec) {
    const from = new THREE.Vector3(...spec.from);
    const to = new THREE.Vector3(...spec.to);
    const n = spec.count ?? 5;
    const spread = spec.spread ?? 5;
    const width = spec.width ?? 1.6;
    for (let i = 0; i < n; i++) {
      const k = n === 1 ? 0 : i / (n - 1) - 0.5;
      const end = to.clone().add(new THREE.Vector3(k * spread, 0, (Math.random() - 0.5) * 1.5));
      const dir = end.clone().sub(from);
      const len = dir.length();
      const w = width * (0.6 + Math.random() * 0.9);
      const geo = new THREE.PlaneGeometry(1, 1);
      const mat = new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        fog: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uCol: { value: C(spec.color) },
          uOpacity: { value: (spec.opacity ?? 0.12) * (0.6 + Math.random() * 0.7) },
          uTime: { value: 0 },
          uSeed: { value: Math.random() * 50 },
        },
        vertexShader: /* glsl */ `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
        fragmentShader: /* glsl */ `
          uniform vec3 uCol; uniform float uOpacity, uTime, uSeed; varying vec2 vUv;
          void main() {
            float x = 1. - abs(vUv.x - .5) * 2.;
            float a = pow(x, 2.2) * smoothstep(0., .18, vUv.y) * pow(vUv.y, .7) * smoothstep(1., .9, vUv.y);
            a *= .7 + .3 * sin(uTime * .35 + uSeed + vUv.y * 3.);
            gl_FragColor = vec4(uCol, a * uOpacity);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
          }
        `,
      });
      const m = new THREE.Mesh(geo, mat);
      m.position.copy(from).addScaledVector(dir, 0.5);
      // the plane's +y runs from the landing point up to the source, and it faces the viewer (+z)
      const up = dir.clone().multiplyScalar(-1).normalize();
      const right = new THREE.Vector3().crossVectors(up, new THREE.Vector3(0, 0, 1)).normalize();
      const fwd = new THREE.Vector3().crossVectors(right, up).normalize();
      m.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(right, up, fwd));
      m.scale.set(w, len, 1);
      m.renderOrder = 15;
      m.frustumCulled = false;
      this.mats.push(mat);
      this.group.add(m);
    }
    this.group.name = 't2-shafts';
  }

  update(time: number) {
    for (const m of this.mats) m.uniforms.uTime.value = time;
  }
}

/* ------------------------------------------------------------------ pool of light */

export interface PoolSpec {
  /** centre on the floor */
  at: [number, number, number];
  radius: number;
  /** a colour, or 'accent' to follow the world's theme */
  color: string;
  opacity?: number;
  /** faint concentric rings 0..1 */
  rings?: number;
  /** 'xz' floor (default) or 'xy' wall behind the letters */
  plane?: 'xz' | 'xy';
}

export class Pool {
  mesh: THREE.Mesh;
  uniforms: Record<string, THREE.IUniform>;

  constructor(spec: PoolSpec) {
    this.uniforms = {
      uCol: { value: spec.color === 'accent' ? new THREE.Color() : C(spec.color) },
      uOpacity: { value: spec.opacity ?? 0.25 },
      uRings: { value: spec.rings ?? 0 },
      uTime: { value: 0 },
      uPulse: { value: 0 },
    };
    const mat = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      transparent: true,
      depthWrite: false,
      fog: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      vertexShader: /* glsl */ `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
      fragmentShader: /* glsl */ `
        uniform vec3 uCol; uniform float uOpacity, uRings, uTime, uPulse; varying vec2 vUv;
        void main() {
          vec2 c = vUv - .5; float r = length(c) * 2.;
          float a = exp(-r * r * 3.4) * (1. + uPulse * .9);
          float ring = smoothstep(.035, 0., abs(fract(r * 6. - uTime * .05) - .5) - .47) * smoothstep(1., .2, r);
          a += ring * uRings * .5;
          a *= smoothstep(1., .75, r);
          gl_FragColor = vec4(uCol, a * uOpacity * .4);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }
      `,
    });
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
    this.mesh.position.set(...spec.at);
    this.mesh.scale.setScalar(spec.radius * 2);
    if ((spec.plane ?? 'xz') === 'xz') this.mesh.rotation.x = -Math.PI / 2;
    this.mesh.renderOrder = 5;
    this.mesh.name = 't2-pool';
  }

  update(time: number, pulse: number) {
    this.uniforms.uTime.value = time;
    this.uniforms.uPulse.value = pulse;
  }
}

/* ------------------------------------------------------------------ keystroke effects */

interface Ring {
  mesh: THREE.Mesh;
  mat: THREE.ShaderMaterial;
  age: number;
  life: number;
  size: number;
  flat: boolean;
}

/** Rings, sparks and a travelling light that answer every keystroke and the finale. */
export class KeyFx {
  group = new THREE.Group();
  light: THREE.PointLight;
  private rings: Ring[] = [];
  private ringGeo = new THREE.PlaneGeometry(1, 1);
  private sparks: THREE.Points;
  private sPos: Float32Array;
  private sVel: Float32Array;
  private sLife: Float32Array;
  private sAttr: THREE.BufferAttribute;
  private lAttr: THREE.BufferAttribute;
  private next = 0;
  private lightTarget = 0;
  private readonly N = 220;
  /** scales the finale rings (bloom-heavy worlds need less) */
  ringPower = 1;

  constructor(private color: THREE.Color, private lightPower: number, private gravity: number) {
    this.light = new THREE.PointLight(color, 0, 9, 1.6);
    this.group.add(this.light);
    this.sPos = new Float32Array(this.N * 3);
    this.sVel = new Float32Array(this.N * 3);
    this.sLife = new Float32Array(this.N);
    const geo = new THREE.BufferGeometry();
    this.sAttr = new THREE.BufferAttribute(this.sPos, 3);
    this.lAttr = new THREE.BufferAttribute(this.sLife, 1);
    geo.setAttribute('position', this.sAttr);
    geo.setAttribute('aLife', this.lAttr);
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      fog: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uCol: { value: color }, uScale: { value: 600 } },
      vertexShader: /* glsl */ `
        attribute float aLife; uniform float uScale; varying float vA;
        void main() { vec4 mv = modelViewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mv; vA = clamp(aLife, 0., 1.);
          gl_PointSize = aLife > 0. ? max(1., .09 * (.4 + vA) * uScale / max(.2, -mv.z)) : 0.; }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 uCol; varying float vA;
        void main() { float d = length(gl_PointCoord - .5) * 2.; float a = pow(max(0., 1. - d), 2.5); gl_FragColor = vec4(mix(uCol, vec3(1.), .45 * vA), a * vA * 1.4);
          #include <tonemapping_fragment>
          #include <colorspace_fragment> }
      `,
    });
    this.sparks = new THREE.Points(geo, mat);
    this.sparks.frustumCulled = false;
    this.sparks.renderOrder = 30;
    this.group.add(this.sparks);
    this.group.name = 't2-keyfx';
  }

  setColor(c: THREE.Color) {
    this.color.copy(c);
  }

  private ring(at: THREE.Vector3, size: number, life: number, flat: boolean, power: number) {
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      depthTest: false,
      fog: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      uniforms: { uCol: { value: this.color }, uT: { value: 0 }, uPower: { value: power } },
      vertexShader: /* glsl */ `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
      fragmentShader: /* glsl */ `
        uniform vec3 uCol; uniform float uT, uPower; varying vec2 vUv;
        void main() { float r = length(vUv - .5) * 2.; float w = mix(.16, .03, uT);
          float a = smoothstep(w, 0., abs(r - (1. - w))) + exp(-r * r * 5.) * .35 * (1. - uT);
          gl_FragColor = vec4(uCol, a * (1. - uT) * (1. - uT) * uPower);
          #include <tonemapping_fragment>
          #include <colorspace_fragment> }
      `,
    });
    const mesh = new THREE.Mesh(this.ringGeo, mat);
    mesh.position.copy(at);
    if (flat) mesh.rotation.x = -Math.PI / 2;
    mesh.renderOrder = 28;
    mesh.frustumCulled = false;
    this.group.add(mesh);
    this.rings.push({ mesh, mat, age: 0, life, size, flat });
  }

  private burst(at: THREE.Vector3, n: number, speed: number, flat: boolean) {
    for (let i = 0; i < n; i++) {
      const k = this.next;
      this.next = (this.next + 1) % this.N;
      const a = Math.random() * Math.PI * 2;
      const s = speed * (0.35 + Math.random());
      const up = (Math.random() - 0.2) * s;
      this.sPos[k * 3] = at.x;
      this.sPos[k * 3 + 1] = at.y;
      this.sPos[k * 3 + 2] = at.z;
      if (flat) {
        this.sVel[k * 3] = Math.cos(a) * s;
        this.sVel[k * 3 + 1] = Math.abs(up) * 0.9 + s * 0.3;
        this.sVel[k * 3 + 2] = Math.sin(a) * s;
      } else {
        this.sVel[k * 3] = Math.cos(a) * s;
        this.sVel[k * 3 + 1] = Math.sin(a) * s + s * 0.25;
        this.sVel[k * 3 + 2] = up * 0.8;
      }
      this.sLife[k] = 0.55 + Math.random() * 0.75;
    }
  }

  key(at: THREE.Vector3, size: number, flat: boolean, sparks: number, ring: boolean) {
    if (ring) this.ring(at, size * 1.5, 0.55, flat, 0.4);
    if (sparks > 0) this.burst(at, sparks, 1.3 * size, flat);
    this.light.position.copy(at);
    if (flat) this.light.position.y += 0.9 * size;
    else this.light.position.z += 1.1 * size;
    this.lightTarget = this.lightPower;
  }

  finale(at: THREE.Vector3, width: number, flat: boolean) {
    this.ring(at, Math.max(5, width * 1.6), 1.25, flat, 0.3 * this.ringPower);
    this.ring(at, Math.max(3, width), 0.8, flat, 0.2 * this.ringPower);
    this.burst(at, 90, 3.2, flat);
    this.light.position.copy(at);
    if (flat) this.light.position.y += 1.6;
    else this.light.position.z += 2;
    this.lightTarget = this.lightPower * 2.4;
  }

  update(dt: number, view: THREE.Camera, viewportH: number, fovDeg: number): boolean {
    let moving = false;
    for (let i = this.rings.length - 1; i >= 0; i--) {
      const r = this.rings[i];
      r.age += dt;
      const t = Math.min(1, r.age / r.life);
      const e = 1 - Math.pow(1 - t, 3);
      r.mesh.scale.setScalar(r.size * (0.15 + 0.85 * e));
      if (!r.flat) r.mesh.quaternion.copy(view.quaternion);
      r.mat.uniforms.uT.value = t;
      if (t >= 1) {
        this.group.remove(r.mesh);
        r.mat.dispose();
        this.rings.splice(i, 1);
      }
      moving = true;
    }
    let any = false;
    for (let k = 0; k < this.N; k++) {
      if (this.sLife[k] <= 0) continue;
      any = true;
      this.sLife[k] -= dt;
      const d = Math.exp(-dt * 1.8);
      this.sVel[k * 3] *= d;
      this.sVel[k * 3 + 1] = this.sVel[k * 3 + 1] * d - this.gravity * dt;
      this.sVel[k * 3 + 2] *= d;
      this.sPos[k * 3] += this.sVel[k * 3] * dt;
      this.sPos[k * 3 + 1] += this.sVel[k * 3 + 1] * dt;
      this.sPos[k * 3 + 2] += this.sVel[k * 3 + 2] * dt;
    }
    if (any) {
      this.sAttr.needsUpdate = true;
      this.lAttr.needsUpdate = true;
      moving = true;
    }
    (this.sparks.material as THREE.ShaderMaterial).uniforms.uScale.value = viewportH / (2 * Math.tan((fovDeg * Math.PI) / 360));
    if (this.lightTarget > 0.001 || this.light.intensity > 0.001) {
      this.light.intensity += (this.lightTarget - this.light.intensity) * Math.min(1, dt * 18);
      this.lightTarget *= Math.exp(-dt * 3.2);
      moving = true;
    }
    return moving;
  }
}
