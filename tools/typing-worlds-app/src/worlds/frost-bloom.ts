/**
 * WORLD 16 · Crystal / Ice (冰晶文字)
 *
 * A near-black stage with a faint glassy floor. Each letter GROWS as crystal:
 *
 *  1. skeleton — a hexagonal ice needle grows along the strokes in writing order
 *     (the growth front tapers to a point; radius swells behind it);
 *  2. a second, pentagonal translucent layer grows over it (layered ice);
 *  3. branches — dendrite crystals sprout at ±60° along the strokes, then twigs;
 *  4. facets — terminal crystal clusters at stroke ends and gem facets on the spine.
 *  A few ice shards fly off the seed point. Growth is pure geometry (scale/taper),
 *  never an opacity fade.
 *
 *  - Backspace: crack lines race over the ice, then it shatters into instanced
 *    shards that tumble, bounce on the floor and dissipate into frost dust.
 *  - Enter: a glint sweeps along the word, then it bursts into a shard shower.
 *
 * Cold refraction is faked in a cheap faceted shader (derivative flat normals,
 * refracted-direction banding, two specular glints, fresnel rim).
 */
import * as THREE from 'three';
import type { DeleteEvent, InsertEvent, SaveOutcome, WorldContext, WorldInstance, WorldModule } from '../engine/types';
import { LetterWorld, type LetterVisual } from '../engine/letter-world';
import { DEFAULT_LAYOUT, type Slot } from '../engine/layout';
import type { EvenPoint } from '../engine/glyphs/glyph-engine';
import { Particles } from '../engine/particles';
import { clamp, damp, easeOutCubic, rand } from '../engine/anim';

const FLOOR_Y = -2.3;
const SPINE_R = 0.07;
const SHELL_R = 0.112;
const SHARP = 9;
const STRIDE = 11; // bx,by,bz,qx,qy,qz,qw,len,rad,start,dur
const MAX_SHARDS = 700;

interface CrystalPlan {
  pieces: Float32Array;
  count: number;
  /** shatter points */
  pts: EvenPoint[];
  cx: number;
  cy: number;
}

interface CrystalUniforms {
  [k: string]: THREE.IUniform;
}

interface IceVisual extends LetterVisual {
  spine: THREE.Mesh;
  shell: THREE.Mesh;
  branches: THREE.InstancedMesh;
  spineU: CrystalUniforms;
  shellU: CrystalUniforms;
  branchU: CrystalUniforms;
  plan: CrystalPlan;
  tipPts: EvenPoint[];
  T: number;
  dur: number;
  crack: number;
  cracking: boolean;
  finaleT: number;
  flashAt: number;
  shatterAt: number;
  dirty: boolean;
  sparkAcc: number;
}

const FRAG = /* glsl */ `
uniform vec3 uDeep; uniform vec3 uMid; uniform vec3 uHi;
uniform float uCrack; uniform float uFlash; uniform float uOpacity;
varying vec3 vViewPos; varying vec3 vLocal;
float hsh(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vEdge(vec2 p) {
  vec2 i = floor(p); vec2 f = fract(p); float d1 = 8.0; float d2 = 8.0;
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
    vec2 g = vec2(float(x), float(y));
    vec2 o = vec2(hsh(i + g), hsh(i + g + 19.3));
    float d = length(g + o - f);
    if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) { d2 = d; }
  }
  return d2 - d1;
}
void main() {
  vec3 N = normalize(cross(dFdx(vViewPos), dFdy(vViewPos)));
  vec3 V = normalize(-vViewPos);
  if (dot(N, V) < 0.0) N = -N;
  float ndv = clamp(dot(N, V), 0.0, 1.0);
  float fres = pow(1.0 - ndv, 3.0);
  vec3 Rr = refract(-V, N, 0.76);
  float band = 0.5 + 0.5 * sin(Rr.y * 7.0 + Rr.x * 4.0 + vLocal.x * 2.0);
  vec3 col = mix(uDeep, uMid, band);
  vec3 L1 = normalize(vec3(0.35, 0.8, 0.5));
  float spec = pow(max(dot(N, normalize(L1 + V)), 0.0), 70.0) * 2.2;
  vec3 L2 = normalize(vec3(-0.6, 0.25, 0.7));
  spec += pow(max(dot(N, normalize(L2 + V)), 0.0), 22.0) * 0.55;
  col += uHi * (fres * 0.9 + spec);
  col += uFlash * vec3(0.75, 0.92, 1.0);
  if (uCrack > 0.0) {
    float e = vEdge(vLocal.xy * 9.0 + vLocal.z * 3.0);
    col = mix(col, vec3(1.0), smoothstep(0.09, 0.0, e) * uCrack);
  }
  gl_FragColor = vec4(col, uOpacity * (0.82 + 0.18 * fres));
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

const TUBE_VERT = /* glsl */ `
attribute float aU;
uniform float uProg; uniform float uR; uniform float uSharp;
varying vec3 vViewPos; varying vec3 vLocal;
void main() {
  vec3 c = position - normal * uR;
  float k = sqrt(clamp((uProg - aU) * uSharp, 0.0, 1.0));
  vec3 p = c + normal * uR * k;
  vLocal = position;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vViewPos = mv.xyz;
  gl_Position = projectionMatrix * mv;
}`;

const INST_VERT = /* glsl */ `
varying vec3 vViewPos; varying vec3 vLocal;
void main() {
  vec4 p = vec4(position, 1.0);
#ifdef USE_INSTANCING
  p = instanceMatrix * p;
#endif
  vLocal = p.xyz;
  vec4 mv = modelViewMatrix * p;
  vViewPos = mv.xyz;
  gl_Position = projectionMatrix * mv;
}`;

class CrystalIce extends LetterWorld<IceVisual> {
  private palette = {
    uDeep: { value: new THREE.Color(0x0d4a78) },
    uMid: { value: new THREE.Color(0x56b9ea) },
    uHi: { value: new THREE.Color(0xeefaff) },
  };
  private crystalGeo: THREE.BufferGeometry;
  private shardGeo: THREE.BufferGeometry;
  private plans = new Map<string, CrystalPlan>();
  private flakes: Particles;
  // shard pool
  private shards: THREE.InstancedMesh;
  private shardMat: THREE.ShaderMaterial;
  private sPos = new Float32Array(MAX_SHARDS * 3);
  private sVel = new Float32Array(MAX_SHARDS * 3);
  private sRot = new Float32Array(MAX_SHARDS * 4);
  private sSpin = new Float32Array(MAX_SHARDS * 4); // axis xyz + speed
  private sScale = new Float32Array(MAX_SHARDS * 3);
  private sLife = new Float32Array(MAX_SHARDS * 2);
  private shardN = 0;
  private camTarget = new THREE.Vector3(0, 0.25, 0);
  private camDir = new THREE.Vector3(0, 0.12, 1).normalize();
  private camDist = 11;
  private m4 = new THREE.Matrix4();
  private q = new THREE.Quaternion();
  private q2 = new THREE.Quaternion();
  private p3 = new THREE.Vector3();
  private s3 = new THREE.Vector3();
  private ax = new THREE.Vector3();

  constructor(ctx: WorldContext) {
    super(ctx);
    const T = THREE;
    ctx.layout.setOptions({ ...DEFAULT_LAYOUT, metric: 'sans', size: 1.2, tracking: 0.2, maxWidth: 9.4, maxLines: 2, lineHeight: 1.7, origin: [0, 0.35, 0], plane: 'xy', minScale: 0.35 });

    ctx.scene.background = new T.Color(0x02040a);
    ctx.scene.fog = new T.Fog(0x02040a, 14, 34);
    this.placeCamera(true);

    this.root.add(new T.HemisphereLight(0x9fd8ff, 0x05080c, 0.22));
    const key = new T.DirectionalLight(0xc9ecff, 0.6);
    key.position.set(3, 8, 6);
    this.root.add(key);
    const glow = new T.PointLight(0x5fd0ff, 14, 18);
    glow.position.set(0, 2.5, 4);
    this.root.add(glow);

    // shared crystal (hexagonal prism + pyramid tip, base at y=0, tip at y=1)
    this.crystalGeo = new T.LatheGeometry([new T.Vector2(0.001, 0), new T.Vector2(0.85, 0.05), new T.Vector2(1, 0.14), new T.Vector2(1, 0.7), new T.Vector2(0.001, 1)], 6);
    this.crystalGeo.userData.shared = true;
    this.shardGeo = new T.OctahedronGeometry(1, 0);
    this.shardGeo.userData.shared = true;

    this.buildStage();

    this.shardMat = this.instMaterial(0.95);
    this.shards = new T.InstancedMesh(this.shardGeo, this.shardMat, MAX_SHARDS);
    this.shards.count = 0;
    this.shards.frustumCulled = false;
    this.shards.renderOrder = 3;
    this.root.add(this.shards);

    this.flakes = new Particles({ capacity: 900, gravity: [0, -0.5, 0], drag: 1.2, size: 0.05, shape: 'flake', opacity: 0.9 });
    this.root.add(this.flakes.points);
  }

  /* ---------------------------------------------------------- materials */

  private uniforms(extra: Record<string, number>): CrystalUniforms {
    const u: CrystalUniforms = { ...this.palette, uCrack: { value: 0 }, uFlash: { value: 0 }, uOpacity: { value: 1 } };
    for (const k in extra) u[k] = { value: extra[k] };
    return u;
  }

  private tubeMaterial(u: CrystalUniforms, transparent: boolean) {
    return new THREE.ShaderMaterial({ uniforms: u, vertexShader: TUBE_VERT, fragmentShader: FRAG, transparent, depthWrite: !transparent, side: THREE.FrontSide });
  }

  private instMaterial(opacity: number, u?: CrystalUniforms) {
    const uu = u ?? this.uniforms({});
    uu.uOpacity.value = opacity;
    return new THREE.ShaderMaterial({ uniforms: uu, vertexShader: INST_VERT, fragmentShader: FRAG, transparent: true, depthWrite: true });
  }

  /* --------------------------------------------------------------- cave */

  /** classic 3D Type stage: a faint, dark glassy floor and nothing else */
  private buildStage() {
    const T = THREE;
    const floor = new T.Mesh(new T.CircleGeometry(30, 48), new T.MeshStandardMaterial({ color: 0x060b12, roughness: 0.25, metalness: 0.4 }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = FLOOR_Y;
    this.root.add(floor);
    // a thin frost ring under the letters
    const ring = new T.Mesh(new T.RingGeometry(6.5, 6.56, 96), new T.MeshBasicMaterial({ color: 0x1d3a52, transparent: true, opacity: 0.6 }));
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = FLOOR_Y + 0.01;
    this.root.add(ring);
  }

  private placeCamera(snap: boolean, dt = 0) {
    const cam = this.ctx.camera;
    const aspect = this.ctx.renderer.size.aspect || 1.6;
    const v = Math.tan((cam.fov * Math.PI) / 360);
    const b = this.ctx.layout.bounds;
    const halfW = Math.max(3, b.isEmpty() ? 0 : Math.max(Math.abs(b.min.x), Math.abs(b.max.x))) + 0.9;
    const halfH = Math.max(2.2, b.isEmpty() ? 0 : Math.max(Math.abs(b.min.y), Math.abs(b.max.y))) + 0.6;
    const need = Math.max(halfH / v, halfW / (v * aspect));
    const want = Math.min(32, Math.max(11, need));
    this.camDist = snap ? want : damp(this.camDist, want, 3, dt);
    cam.position.copy(this.camTarget).addScaledVector(this.camDir, this.camDist);
    cam.lookAt(this.camTarget);
    return Math.abs(this.camDist - want) > 0.01;
  }

  /* --------------------------------------------------------------- plan */

  private planFor(char: string): CrystalPlan {
    const hit = this.plans.get(char);
    if (hit) return hit;
    const glyphs = this.ctx.glyphs;
    const g = glyphs.get(char, 'sans');
    const out: number[] = [];
    const up = new THREE.Vector3(0, 1, 0);
    const dir = new THREE.Vector3();
    const q = new THREE.Quaternion();
    const push = (bx: number, by: number, d: THREE.Vector3, len: number, rad: number, start: number, dur: number) => {
      q.setFromUnitVectors(up, d);
      out.push(bx, by, d.z * SPINE_R * 0.5, q.x, q.y, q.z, q.w, len, rad, start, dur);
    };
    const C60 = Math.cos(Math.PI / 3);
    const S60 = Math.sin(Math.PI / 3);

    // 1) dendrite branches (+ twigs) along the strokes
    const pts = glyphs.evenPoints(g, 0.17);
    pts.forEach((p, i) => {
      const prev = pts[i - 1];
      const next = pts[i + 1];
      if (!prev || !next || prev.stroke !== p.stroke || next.stroke !== p.stroke) return; // skip stroke ends
      const sides = Math.random() < 0.3 ? [1, -1] : [i % 2 ? 1 : -1];
      for (const side of sides) {
        const nx = -p.ty * side;
        const ny = p.tx * side;
        const dx = C60 * p.tx + S60 * nx;
        const dy = C60 * p.ty + S60 * ny;
        dir.set(dx, dy, rand(0.2, 0.55)).normalize();
        const len = rand(0.13, 0.21);
        const start = 0.42 + p.u * 0.3;
        push(p.x + dir.x * SPINE_R * 0.5, p.y + dir.y * SPINE_R * 0.5, dir, len, 0.026, start, 0.16);
        // twig: from 55% of the branch, rotated a further 50° outward
        const a = 0.87 * side;
        const tx = dx * Math.cos(a) - dy * Math.sin(a);
        const ty = dx * Math.sin(a) + dy * Math.cos(a);
        const bx = p.x + dir.x * len * 0.55;
        const by = p.y + dir.y * len * 0.55;
        const tw = new THREE.Vector3(tx, ty, rand(0.3, 0.6)).normalize();
        push(bx, by, tw, len * 0.45, 0.017, start + 0.1, 0.12);
      }
    });

    // 2) terminal clusters at open stroke ends
    const tmp = { x: 0, y: 0, tx: 0, ty: 0 };
    g.strokes.forEach((s) => {
      const n = s.pts.length / 2;
      const closed = Math.hypot(s.pts[0] - s.pts[n * 2 - 2], s.pts[1] - s.pts[n * 2 - 1]) < 0.05;
      if (closed || s.length < 0.05) return;
      for (const end of [0, 1]) {
        glyphs.strokeAt(s, end ? s.length : 0, tmp);
        const ox = end ? tmp.tx : -tmp.tx;
        const oy = end ? tmp.ty : -tmp.ty;
        for (let k = 0; k < 3; k++) {
          const a = (k - 1) * 0.5 + rand(-0.1, 0.1);
          const rx = ox * Math.cos(a) - oy * Math.sin(a);
          const ry = ox * Math.sin(a) + oy * Math.cos(a);
          dir.set(rx, ry, rand(0.7, 1.0)).normalize();
          push(tmp.x, tmp.y, dir, rand(0.2, 0.28) * (k === 1 ? 1.15 : 1), 0.04, 0.62 + k * 0.04, 0.18);
        }
      }
    });

    // 3) gem facets on the spine (pointing at the viewer)
    for (const p of glyphs.evenPoints(g, 0.3)) {
      dir.set(rand(-0.3, 0.3), rand(-0.3, 0.3), 1).normalize();
      push(p.x, p.y, dir, rand(0.1, 0.14), 0.05, 0.72 + p.u * 0.1, 0.14);
    }

    const plan: CrystalPlan = {
      pieces: new Float32Array(out),
      count: out.length / STRIDE,
      pts: glyphs.evenPoints(g, 0.075),
      cx: (g.bounds.minX + g.bounds.maxX) / 2,
      cy: (g.bounds.minY + g.bounds.maxY) / 2,
    };
    this.plans.set(char, plan);
    return plan;
  }

  private writePieces(v: IceVisual) {
    const d = v.plan.pieces;
    for (let i = 0; i < v.plan.count; i++) {
      const o = i * STRIDE;
      const g = easeOutCubic(clamp((v.T - d[o + 9]) / d[o + 10]));
      this.p3.set(d[o], d[o + 1], d[o + 2]);
      this.q.set(d[o + 3], d[o + 4], d[o + 5], d[o + 6]);
      if (g <= 1e-3) this.s3.set(0, 0, 0);
      else {
        const r = d[o + 8] * (0.35 + 0.65 * g);
        this.s3.set(r, d[o + 7] * g, r);
      }
      this.m4.compose(this.p3, this.q, this.s3);
      v.branches.setMatrixAt(i, this.m4);
    }
    v.branches.instanceMatrix.needsUpdate = true;
  }

  /* ------------------------------------------------------------ letters */

  protected createLetter(ev: InsertEvent, slot: Slot): IceVisual | null {
    if (!ev.char.trim()) return null;
    const ctx = this.ctx;
    const glyph = ctx.glyphs.get(ev.char, 'sans');
    const plan = this.planFor(ev.char);
    const spineU = this.uniforms({ uProg: 0, uR: SPINE_R, uSharp: SHARP });
    spineU.uOpacity.value = 0.97;
    const shellU = this.uniforms({ uProg: 0, uR: SHELL_R, uSharp: SHARP });
    shellU.uOpacity.value = 0.34;
    const branchU = this.uniforms({});
    const spine = new THREE.Mesh(ctx.glyphs.tube(glyph, SPINE_R, 6, true), this.tubeMaterial(spineU, true));
    spine.renderOrder = 1;
    const shell = new THREE.Mesh(ctx.glyphs.tube(glyph, SHELL_R, 5, true), this.tubeMaterial(shellU, true));
    shell.renderOrder = 2;
    const branches = new THREE.InstancedMesh(this.crystalGeo, this.instMaterial(0.95, branchU), Math.max(1, plan.count));
    branches.count = plan.count;
    branches.renderOrder = 1;
    for (const m of [spine, shell, branches]) m.frustumCulled = false;
    const group = new THREE.Group();
    group.add(spine, branches, shell);
    ctx.layout.apply(group, slot);
    this.root.add(group);

    const v: IceVisual = {
      ref: ev,
      slot,
      object: group,
      state: ev.restoring ? 'alive' : 'creating',
      age: 0,
      spine,
      shell,
      branches,
      spineU,
      shellU,
      branchU,
      plan,
      tipPts: ctx.glyphs.evenPoints(glyph, 0.05),
      T: ev.restoring ? 1 : 0,
      dur: ctx.tempo.duration(1400, 520),
      crack: 0,
      cracking: false,
      finaleT: -1,
      flashAt: 0,
      shatterAt: 0,
      dirty: true,
      sparkAcc: 0,
    };
    this.applyGrowth(v);
    if (!ev.restoring) {
      ctx.audio.play('crack', { pitch: 1.6 + Math.random() * 0.3, gain: 0.3, minGap: 30 });
      // a few ice shards spring off the seed point
      const p0 = v.tipPts[0];
      if (p0) {
        const w = ctx.layout.toWorld(slot, p0.x, p0.y, 0.1, new THREE.Vector3());
        const n = Math.max(2, Math.round(4 * ctx.tempo.detail));
        for (let i = 0; i < n; i++) this.spawnShard(w.x, w.y, w.z, rand(-1.6, 1.6), rand(0.8, 2.4), rand(0.6, 1.8), slot.size * rand(0.025, 0.045), rand(0.7, 1.1));
      }
    }
    ctx.keepAlive(1600);
    return v;
  }

  private applyGrowth(v: IceVisual) {
    const tail = 1 + 1 / SHARP;
    v.spineU.uProg.value = clamp(v.T / 0.45) * tail;
    v.shellU.uProg.value = clamp((v.T - 0.3) / 0.45) * tail;
    this.writePieces(v);
  }

  protected removeLetter(v: IceVisual, _ev: DeleteEvent): void {
    v.cracking = true;
    v.crack = 0;
    this.ctx.audio.play('crack', { pitch: 1.0 + Math.random() * 0.2, gain: 0.5, minGap: 25 });
    this.ctx.keepAlive(1800);
  }

  protected playFinale(_word: string, visuals: IceVisual[], saved: Promise<SaveOutcome>): void {
    const ctx = this.ctx;
    visuals
      .slice()
      .sort((a, b) => a.slot.index - b.slot.index)
      .forEach((v, i) => {
        v.finaleT = 0;
        v.flashAt = 0.1 + i * 0.07;
        v.shatterAt = 0.95 + i * 0.05;
      });
    ctx.audio.play('chime', { gain: 0.6 });
    saved.then((r) => {
      if (!r.ok) ctx.audio.play('error', { gain: 0.5 });
    });
    ctx.keepAlive(2600 + visuals.length * 80);
  }

  private shatter(v: IceVisual, up: number) {
    const g = v.object;
    const size = g.scale.x;
    const pts = v.plan.pts;
    const detail = this.ctx.tempo.detail;
    const stride = detail < 0.5 ? 2 : 1;
    const cx = v.plan.cx;
    const cy = v.plan.cy;
    for (let i = 0; i < pts.length; i += stride) {
      const p = pts[i];
      const wx = g.position.x + p.x * size;
      const wy = g.position.y + p.y * size;
      const ox = p.x - cx;
      const oy = p.y - cy;
      const l = Math.hypot(ox, oy) || 1;
      const k = rand(1.2, 2.8);
      this.spawnShard(wx, wy, g.position.z + rand(-0.05, 0.12), (ox / l) * k + rand(-0.5, 0.5), (oy / l) * k + up + rand(0, 1.5), rand(0.8, 2.6), size * rand(0.03, 0.075), rand(0.9, 1.5));
      if (Math.random() < 0.5 * detail)
        this.flakes.emit({ x: wx, y: wy, z: 0.1, vx: rand(-0.6, 0.6), vy: rand(-0.2, 0.8), vz: rand(0, 0.6), life: rand(0.6, 1.2), size: rand(0.6, 1.2), color: 0xdff4ff });
    }
    this.ctx.audio.play('sparkle', { pitch: 0.9 + Math.random() * 0.3, gain: 0.45, minGap: 30 });
  }

  protected updateLetter(v: IceVisual, dt: number, _time: number): boolean {
    let animating = false;
    // follow layout (reflow) smoothly
    const g = v.object;
    if (v.state !== 'finale' && v.state !== 'removing') {
      const o = v.slot.origin;
      g.position.x = damp(g.position.x, o.x, 12, dt);
      g.position.y = damp(g.position.y, o.y, 12, dt);
      g.scale.setScalar(damp(g.scale.x, v.slot.size, 12, dt));
      if (Math.abs(g.position.x - o.x) + Math.abs(g.position.y - o.y) + Math.abs(g.scale.x - v.slot.size) > 1e-3) animating = true;
    }

    if (v.T < 1 && !v.cracking) {
      v.T = Math.min(1, v.T + dt / Math.max(0.05, v.dur));
      this.applyGrowth(v);
      this.tipSparkle(v, dt);
      animating = true;
      if (v.T >= 1 && v.state === 'creating') v.state = 'alive';
    }

    if (v.finaleT >= 0) {
      v.finaleT += dt;
      const f = v.finaleT - v.flashAt;
      const flash = f > 0 ? Math.exp(-f * 5) * (1 - Math.exp(-f * 40)) : 0;
      v.spineU.uFlash.value = v.shellU.uFlash.value = v.branchU.uFlash.value = flash * 0.9;
      if (v.finaleT >= v.shatterAt - 0.15 && !v.cracking) {
        v.cracking = true;
        v.crack = 0;
      }
      animating = true;
    }

    if (v.cracking) {
      v.crack += dt / 0.2;
      const c = clamp(v.crack);
      v.spineU.uCrack.value = v.shellU.uCrack.value = v.branchU.uCrack.value = c;
      v.spineU.uFlash.value = Math.max(v.spineU.uFlash.value, c * 0.25);
      const j = 0.012 * c * v.slot.size;
      g.position.x += rand(-j, j);
      g.position.y += rand(-j, j);
      if (v.crack >= 1) {
        this.shatter(v, v.finaleT >= 0 ? 2.2 : 0.6);
        this.release(v);
        return true;
      }
      animating = true;
    }
    return animating;
  }

  private tipSparkle(v: IceVisual, dt: number) {
    const pts = v.tipPts;
    if (!pts.length || v.T > 0.5) return;
    v.sparkAcc += dt * 26 * this.ctx.tempo.detail;
    const prog = clamp(v.T / 0.45);
    const p = pts[Math.min(pts.length - 1, Math.floor(prog * (pts.length - 1)))];
    const g = v.object;
    while (v.sparkAcc >= 1) {
      v.sparkAcc -= 1;
      this.flakes.emit({
        x: g.position.x + p.x * g.scale.x,
        y: g.position.y + p.y * g.scale.y,
        z: 0.12,
        vx: rand(-0.5, 0.5),
        vy: rand(-0.3, 0.6),
        vz: rand(0.1, 0.6),
        life: rand(0.4, 0.8),
        size: rand(0.5, 1),
        color: 0xe6f8ff,
      });
    }
  }

  /* ------------------------------------------------------------- shards */

  private spawnShard(x: number, y: number, z: number, vx: number, vy: number, vz: number, size: number, life: number) {
    if (this.shardN >= MAX_SHARDS) return;
    const i = this.shardN++;
    this.sPos.set([x, y, z], i * 3);
    this.sVel.set([vx, vy, vz], i * 3);
    this.q.setFromAxisAngle(this.ax.set(rand(-1, 1), rand(-1, 1), rand(-1, 1)).normalize(), rand(0, 6.28));
    this.sRot.set([this.q.x, this.q.y, this.q.z, this.q.w], i * 4);
    this.ax.set(rand(-1, 1), rand(-1, 1), rand(-1, 1)).normalize();
    this.sSpin.set([this.ax.x, this.ax.y, this.ax.z, rand(3, 10)], i * 4);
    this.sScale.set([size * rand(0.5, 0.8), size * rand(1.2, 2.2), size * rand(0.4, 0.7)], i * 3);
    this.sLife.set([life, life], i * 2);
  }

  private updateShards(dt: number): boolean {
    let n = this.shardN;
    if (!n) return false;
    const drag = Math.exp(-0.6 * dt);
    let i = 0;
    while (i < n) {
      this.sLife[i * 2] -= dt;
      if (this.sLife[i * 2] <= 0) {
        // dissipate into frost dust, then swap-remove
        if (Math.random() < 0.6)
          this.flakes.emit({ x: this.sPos[i * 3], y: this.sPos[i * 3 + 1], z: this.sPos[i * 3 + 2], vx: rand(-0.3, 0.3), vy: rand(0, 0.5), vz: rand(-0.3, 0.3), life: rand(0.5, 1), size: rand(0.5, 1), color: 0xcfeeff });
        n--;
        if (i !== n) {
          this.sPos.copyWithin(i * 3, n * 3, n * 3 + 3);
          this.sVel.copyWithin(i * 3, n * 3, n * 3 + 3);
          this.sRot.copyWithin(i * 4, n * 4, n * 4 + 4);
          this.sSpin.copyWithin(i * 4, n * 4, n * 4 + 4);
          this.sScale.copyWithin(i * 3, n * 3, n * 3 + 3);
          this.sLife.copyWithin(i * 2, n * 2, n * 2 + 2);
        }
        continue;
      }
      const p = i * 3;
      this.sVel[p + 1] -= 7 * dt;
      this.sVel[p] *= drag;
      this.sVel[p + 1] *= drag;
      this.sVel[p + 2] *= drag;
      this.sPos[p] += this.sVel[p] * dt;
      this.sPos[p + 1] += this.sVel[p + 1] * dt;
      this.sPos[p + 2] += this.sVel[p + 2] * dt;
      if (this.sPos[p + 1] < FLOOR_Y + 0.03 && this.sVel[p + 1] < 0) {
        this.sPos[p + 1] = FLOOR_Y + 0.03;
        this.sVel[p + 1] *= -0.3;
        this.sVel[p] *= 0.6;
        this.sVel[p + 2] *= 0.6;
        this.sSpin[i * 4 + 3] *= 0.5;
      }
      const r = i * 4;
      this.q.set(this.sRot[r], this.sRot[r + 1], this.sRot[r + 2], this.sRot[r + 3]);
      this.q2.setFromAxisAngle(this.ax.set(this.sSpin[r], this.sSpin[r + 1], this.sSpin[r + 2]), this.sSpin[r + 3] * dt);
      this.q.multiply(this.q2);
      this.sRot.set([this.q.x, this.q.y, this.q.z, this.q.w], r);
      const lk = this.sLife[i * 2] / this.sLife[i * 2 + 1];
      const shrink = clamp(lk / 0.45);
      this.p3.set(this.sPos[p], this.sPos[p + 1], this.sPos[p + 2]);
      this.s3.set(this.sScale[p] * shrink, this.sScale[p + 1] * shrink, this.sScale[p + 2] * shrink);
      this.m4.compose(this.p3, this.q, this.s3);
      this.shards.setMatrixAt(i, this.m4);
      i++;
    }
    this.shardN = n;
    this.shards.count = n;
    this.shards.instanceMatrix.needsUpdate = true;
    return n > 0;
  }

  protected updateWorld(dt: number, _time: number): boolean {
    let moving = this.placeCamera(false, dt);
    if (this.updateShards(dt)) moving = true;
    if (this.flakes.update(dt)) moving = true;
    return moving;
  }

  disposeWorld(): void {
    this.flakes.dispose();
    super.disposeWorld();
    this.crystalGeo.dispose();
    this.shardGeo.dispose();
    this.plans.clear();
  }
}

export function create(ctx: WorldContext): WorldInstance {
  return new CrystalIce(ctx);
}

export const frostBloom: WorldModule = { create };
