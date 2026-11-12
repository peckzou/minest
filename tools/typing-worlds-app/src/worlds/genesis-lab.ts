/**
 * WORLD 11 · Genesis Lab (创世实验室)
 *
 * High-contrast black & white fabrication lab: a black void, a cold white spotlight,
 * a precision robot arm hanging from the ceiling. Every letter is generated in four
 * clearly observable stages:
 *
 *  1. SEED          — a single luminous cell appears in the middle of the letter's path,
 *                     pulsing, with a scan ring expanding around it.
 *  2. PROLIFERATION — the cell divides (binary mitosis, generation by generation);
 *                     daughters migrate along the strokes until they line the path.
 *  3. AGGREGATION   — the arm weaves white synthetic filament through the cells in
 *                     writing order; a truss lattice links them; cells are absorbed.
 *  4. STABLE GLYPH  — the filament inflates into a smooth white sculpture, the cells and
 *                     scaffold dissolve, a ring pulse marks completion.
 *
 *  - Backspace: the structure un-weaves and deflates; cells reappear and drift apart.
 *  - Enter: the finished sculptures flash and rise into the spotlight.
 */
import * as THREE from 'three';
import type { DeleteEvent, InsertEvent, SaveOutcome, WorldContext, WorldInstance, WorldModule } from '../engine/types';
import { LetterWorld, type LetterVisual } from '../engine/letter-world';
import { DEFAULT_LAYOUT, type Slot } from '../engine/layout';
import { ToolController } from '../engine/tools';
import { clamp, damp, easeInCubic, easeOutBack, rand, smooth } from '../engine/anim';

const R = 0.085;
const ARM_BASE = new THREE.Vector3(5.4, 6.6, -1.6);
const L1 = 6.6;
const L2 = 6.6;

type Phase = 'seed' | 'prolif' | 'aggregate' | 'stabilize' | 'done';

interface GenVisual extends LetterVisual {
  body: THREE.Mesh;
  bodyU: { uProg: { value: number }; uSolid: { value: number }; uGlow: { value: number } };
  cells: THREE.InstancedMesh;
  lattice: THREE.LineSegments;
  latticeMat: THREE.LineBasicMaterial;
  latticeCount: number;
  ring: THREE.Mesh;
  ringMat: THREE.MeshBasicMaterial;
  targets: Float32Array;
  tU: Float32Array;
  drift: Float32Array;
  N: number;
  G: number;
  cx: number;
  cy: number;
  phase: Phase;
  t: number;
  D: number;
  filament: number;
  jobQueued: boolean;
  solid: number;
  dissolving: boolean;
  dissolve: number;
  finaleT: number;
  inFinale: boolean;
  lastGen: number;
}

const CELL_VERT = /* glsl */ `
varying vec3 vN; varying vec3 vV;
void main() {
  vec4 p = vec4(position, 1.0);
  vec3 n = normal;
#ifdef USE_INSTANCING
  p = instanceMatrix * p;
  n = mat3(instanceMatrix) * normal;
#endif
  vec4 mv = modelViewMatrix * p;
  vV = -mv.xyz;
  vN = normalize(normalMatrix * n);
  gl_Position = projectionMatrix * mv;
}`;

const CELL_FRAG = /* glsl */ `
varying vec3 vN; varying vec3 vV;
void main() {
  float f = 1.0 - abs(dot(normalize(vN), normalize(vV)));
  float a = pow(f, 2.0) * 0.85 + 0.08;
  vec3 c = mix(vec3(0.7, 0.8, 0.92), vec3(1.0), f);
  c += (1.0 - smoothstep(0.0, 0.3, f)) * 0.5;
  gl_FragColor = vec4(c * a, a);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

const BODY_DECL = /* glsl */ `
attribute float aU;
uniform float uProg; uniform float uSolid; uniform float uR;
varying float vU;`;

const BODY_VERT = /* glsl */ `
vec3 transformed;
{
  vec3 c = position - objectNormal * uR;
  float front = clamp((uProg - aU) * 14.0, 0.0, 1.0);
  float rad = mix(0.22, 1.0, uSolid) * sqrt(front);
  transformed = c + objectNormal * uR * rad;
  vU = aU;
}`;

const BODY_FRAG_DECL = /* glsl */ `
uniform float uProg; uniform float uGlow;
varying float vU;`;

class GenesisLab extends LetterWorld<GenVisual> {
  private controller: ToolController;
  private cellGeo: THREE.BufferGeometry;
  private cellMat: THREE.ShaderMaterial;
  private ringGeo: THREE.RingGeometry;
  private arm: { seg1: THREE.Mesh; seg2: THREE.Mesh; elbow: THREE.Mesh; wrist: THREE.Mesh; nozzle: THREE.Mesh; tip: THREE.Mesh; tipMat: THREE.MeshBasicMaterial };
  private elbow = new THREE.Vector3();
  private camTarget = new THREE.Vector3(0, 0.35, 0);
  private camDir = new THREE.Vector3(0, 0.05, 1).normalize();
  private camDist = 11;
  private m4 = new THREE.Matrix4();
  private q = new THREE.Quaternion();
  private p3 = new THREE.Vector3();
  private s3 = new THREE.Vector3();
  private tmp = new THREE.Vector3();
  private tmp2 = new THREE.Vector3();
  private Y = new THREE.Vector3(0, 1, 0);

  constructor(ctx: WorldContext) {
    super(ctx);
    const T = THREE;
    ctx.layout.setOptions({ ...DEFAULT_LAYOUT, metric: 'sans', size: 1.15, tracking: 0.2, maxWidth: 9.4, maxLines: 2, lineHeight: 1.75, origin: [0, 0.4, 0], plane: 'xy', minScale: 0.35 });

    ctx.scene.background = new T.Color(0x020203);
    ctx.scene.fog = new T.Fog(0x020203, 14, 45);
    this.placeCamera(true);

    this.root.add(new T.AmbientLight(0x2a2a30, 0.7));
    const spot = new T.SpotLight(0xffffff, 120, 30, Math.PI / 4.2, 0.45, 1.2);
    spot.position.set(0, 13, 7);
    spot.target.position.set(0, 0, 0);
    spot.castShadow = ctx.quality > 0;
    spot.shadow.mapSize.set(1024, 1024);
    this.root.add(spot, spot.target);
    const rim = new T.DirectionalLight(0xbfd0ff, 0.5);
    rim.position.set(-6, 3, -5);
    this.root.add(rim);

    // stage + lab apparatus
    const stage = new T.Mesh(new T.CylinderGeometry(14, 14, 0.4, 64), new T.MeshStandardMaterial({ color: 0x0a0a0c, roughness: 0.75, metalness: 0.25 }));
    stage.position.set(0, -2.5, 0);
    stage.receiveShadow = ctx.quality > 0;
    this.root.add(stage);
    const lineMat = new T.MeshBasicMaterial({ color: 0x3a3a40, transparent: true, opacity: 0.6 });
    for (const r of [3, 5.5, 8]) {
      const ring = new T.Mesh(new T.RingGeometry(r, r + 0.025, 96), lineMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = -2.29;
      this.root.add(ring);
    }
    const tubeMat = new T.MeshBasicMaterial({ color: 0xe8ecf4 });
    const capMat = new T.MeshStandardMaterial({ color: 0x1b1b20, roughness: 0.4, metalness: 0.8 });
    for (const x of [-7.2, 7.2]) {
      const tube = new T.Mesh(new T.CylinderGeometry(0.05, 0.05, 6.5, 10), tubeMat);
      tube.position.set(x, 0.95, -3);
      this.root.add(tube);
      for (const y of [-2.3, 4.2]) {
        const cap = new T.Mesh(new T.CylinderGeometry(0.22, 0.22, 0.3, 18), capMat);
        cap.position.set(x, y, -3);
        this.root.add(cap);
      }
    }

    // articulated arm
    const white = new T.MeshStandardMaterial({ color: 0xeeeeee, metalness: 0.75, roughness: 0.25 });
    const dark = new T.MeshStandardMaterial({ color: 0x222226, metalness: 0.8, roughness: 0.35 });
    const segGeo = new T.CylinderGeometry(0.09, 0.12, 1, 14);
    segGeo.translate(0, 0.5, 0);
    const seg1 = new T.Mesh(segGeo, white);
    const seg2 = new T.Mesh(segGeo, white);
    const elbow = new T.Mesh(new T.SphereGeometry(0.2, 18, 12), dark);
    const wrist = new T.Mesh(new T.SphereGeometry(0.14, 16, 10), dark);
    const nozGeo = new T.ConeGeometry(0.08, 0.4, 14);
    nozGeo.rotateX(Math.PI);
    nozGeo.translate(0, -0.2, 0);
    const nozzle = new T.Mesh(nozGeo, white);
    const tipMat = new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4 });
    const tip = new T.Mesh(new T.SphereGeometry(0.06, 12, 8), tipMat);
    const mount = new T.Mesh(new T.CylinderGeometry(0.5, 0.6, 0.3, 24), dark);
    mount.position.copy(ARM_BASE).add(new T.Vector3(0, 0.2, 0));
    const base = new T.Mesh(new T.SphereGeometry(0.28, 18, 12), dark);
    base.position.copy(ARM_BASE);
    for (const m of [seg1, seg2, elbow, wrist, nozzle]) m.castShadow = ctx.quality > 0;
    this.root.add(seg1, seg2, elbow, wrist, nozzle, tip, mount, base);
    this.arm = { seg1, seg2, elbow, wrist, nozzle, tip, tipMat };

    this.controller = new ToolController(ctx.glyphs, ctx.layout, {
      count: 1,
      liftHeight: 0.35,
      maxQueue: 2,
      approach: 0.18,
      rest: () => new T.Vector3(3.6, 2.8, 1.4),
      restDelay: 1.0,
    });

    this.cellGeo = new T.SphereGeometry(1, 16, 12);
    this.cellGeo.userData.shared = true;
    this.cellMat = new T.ShaderMaterial({ vertexShader: CELL_VERT, fragmentShader: CELL_FRAG, transparent: true, depthWrite: false, blending: T.AdditiveBlending });
    this.cellMat.userData.shared = true;
    this.ringGeo = new T.RingGeometry(0.92, 1, 64);
    this.ringGeo.userData.shared = true;
    this.updateArm();
  }

  private placeCamera(snap: boolean, dt = 0) {
    const cam = this.ctx.camera;
    const aspect = this.ctx.renderer.size.aspect || 1.6;
    const v = Math.tan((cam.fov * Math.PI) / 360);
    const b = this.ctx.layout.bounds;
    const halfW = Math.max(3, b.isEmpty() ? 0 : Math.max(Math.abs(b.min.x), Math.abs(b.max.x))) + 0.9;
    const halfH = Math.max(2.4, b.isEmpty() ? 0 : Math.max(Math.abs(b.min.y), Math.abs(b.max.y))) + 0.6;
    const need = Math.max(halfH / v, halfW / (v * aspect));
    const want = Math.min(32, Math.max(11, need));
    this.camDist = snap ? want : damp(this.camDist, want, 3, dt);
    cam.position.copy(this.camTarget).addScaledVector(this.camDir, this.camDist);
    cam.lookAt(this.camTarget);
    return Math.abs(this.camDist - want) > 0.01;
  }

  /** two-bone IK from the ceiling mount to the tool tip */
  private updateArm() {
    const tool = this.controller.tools[0];
    const P = tool.tip;
    const B = ARM_BASE;
    const d = this.tmp.subVectors(P, B);
    const dist = clamp(d.length(), 0.5, L1 + L2 - 0.01);
    d.normalize();
    const a = (L1 * L1 - L2 * L2 + dist * dist) / (2 * dist);
    const h = Math.sqrt(Math.max(0, L1 * L1 - a * a));
    // pole: up and back, orthogonalised against the reach direction
    const pole = this.tmp2.set(0.3, 1, -0.6);
    pole.addScaledVector(d, -pole.dot(d)).normalize();
    this.elbow.copy(B).addScaledVector(d, a).addScaledVector(pole, h);
    const tipPos = this.p3.copy(B).addScaledVector(d, dist);
    const orient = (m: THREE.Mesh, from: THREE.Vector3, to: THREE.Vector3) => {
      const dir = this.s3.subVectors(to, from);
      const len = dir.length();
      m.position.copy(from);
      m.quaternion.setFromUnitVectors(this.Y, dir.divideScalar(len || 1));
      m.scale.set(1, len, 1);
    };
    const wristPos = this.tmp.copy(tipPos);
    wristPos.y += 0.42;
    orient(this.arm.seg1, B, this.elbow);
    orient(this.arm.seg2, this.elbow, wristPos);
    this.arm.elbow.position.copy(this.elbow);
    this.arm.wrist.position.copy(wristPos);
    this.arm.nozzle.position.copy(wristPos);
    this.arm.tip.position.copy(tipPos);
    this.arm.tipMat.opacity = tool.down ? 1 : 0.35;
    this.arm.tip.scale.setScalar(tool.down ? 1.5 + Math.sin(this.time * 40) * 0.3 : 1);
  }

  /* ------------------------------------------------------------ letters */

  protected createLetter(ev: InsertEvent, slot: Slot): GenVisual | null {
    if (!ev.char.trim()) return null;
    const ctx = this.ctx;
    const glyph = ctx.glyphs.get(ev.char, 'sans');
    const N = ctx.quality === 0 ? 16 : 32;
    const G = Math.round(Math.log2(N));

    // N evenly spaced targets along the path (writing order)
    const dense = ctx.glyphs.evenPoints(glyph, Math.max(0.01, glyph.length / (N * 2)));
    const targets = new Float32Array(N * 2);
    const tU = new Float32Array(N);
    const drift = new Float32Array(N * 3);
    for (let j = 0; j < N; j++) {
      const p = dense[Math.round((j * (dense.length - 1)) / (N - 1))] ?? { x: glyph.advance / 2, y: 0.5, u: 0 };
      targets[j * 2] = p.x;
      targets[j * 2 + 1] = p.y;
      tU[j] = p.u;
      drift.set([rand(-1, 1), rand(-0.5, 1.2), rand(-0.5, 1)], j * 3);
    }

    const bodyU = { uProg: { value: 0 }, uSolid: { value: 0 }, uGlow: { value: 0.9 } };
    const mat = new THREE.MeshStandardMaterial({ color: 0xf4f4f2, roughness: 0.34, metalness: 0.05 });
    mat.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, bodyU, { uR: { value: R } });
      shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\n' + BODY_DECL).replace('#include <begin_vertex>', BODY_VERT);
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\n' + BODY_FRAG_DECL)
        .replace('void main() {', 'void main() {\n  if (vU > uProg) discard;')
        .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n  totalEmissiveRadiance += vec3(uGlow);');
    };
    mat.customProgramCacheKey = () => 'genesis-body';
    const body = new THREE.Mesh(ctx.glyphs.tube(glyph, R, 12, true), mat);
    body.castShadow = ctx.quality > 0;
    body.frustumCulled = false;

    const cells = new THREE.InstancedMesh(this.cellGeo, this.cellMat, N);
    cells.frustumCulled = false;
    cells.renderOrder = 2;

    // truss scaffold between consecutive cells (front rail, back rail, diagonal, strut)
    const lp: number[] = [];
    const zf = 0.08;
    for (let j = 0; j < N - 1; j++) {
      const ax = targets[j * 2], ay = targets[j * 2 + 1], bx = targets[j * 2 + 2], by = targets[j * 2 + 3];
      if (Math.hypot(bx - ax, by - ay) > 0.32) continue;
      lp.push(ax, ay, zf, bx, by, zf, ax, ay, -zf, bx, by, -zf, ax, ay, zf, bx, by, -zf, ax, ay, zf, ax, ay, -zf);
    }
    const lg = new THREE.BufferGeometry();
    lg.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3));
    lg.setDrawRange(0, 0);
    const latticeMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5, depthWrite: false });
    const lattice = new THREE.LineSegments(lg, latticeMat);
    lattice.frustumCulled = false;

    const ringMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
    const ring = new THREE.Mesh(this.ringGeo, ringMat);
    const cx = (glyph.bounds.minX + glyph.bounds.maxX) / 2;
    const cy = (glyph.bounds.minY + glyph.bounds.maxY) / 2;
    ring.position.set(cx, cy, -0.05);

    const group = new THREE.Group();
    group.add(body, lattice, cells, ring);
    ctx.layout.apply(group, slot);
    this.root.add(group);

    const v: GenVisual = {
      ref: ev,
      slot,
      object: group,
      state: ev.restoring ? 'alive' : 'creating',
      age: 0,
      body,
      bodyU,
      cells,
      lattice,
      latticeMat,
      latticeCount: lp.length / 3,
      ring,
      ringMat,
      targets,
      tU,
      drift,
      N,
      G,
      cx,
      cy,
      phase: ev.restoring ? 'done' : 'seed',
      t: 0,
      D: ctx.tempo.duration(1900, 700),
      filament: ev.restoring ? 1 : 0,
      jobQueued: false,
      solid: ev.restoring ? 1 : 0,
      dissolving: false,
      dissolve: 0,
      finaleT: 0,
      inFinale: false,
      lastGen: 0,
    };
    if (ev.restoring) this.finishVisual(v);
    else {
      ctx.audio.play('bubble', { pitch: 1.6 + Math.random() * 0.2, gain: 0.35, minGap: 30 });
      this.writeCells(v);
    }
    ctx.keepAlive(2000);
    return v;
  }

  private finishVisual(v: GenVisual) {
    v.phase = 'done';
    v.filament = 1;
    v.solid = 1;
    v.bodyU.uProg.value = 1.1;
    v.bodyU.uSolid.value = 1;
    v.bodyU.uGlow.value = 0.06;
    v.cells.visible = false;
    v.lattice.visible = false;
    v.ringMat.opacity = 0;
    if (v.state === 'creating') v.state = 'alive';
  }

  /** binary-division position of cell j at continuous generation level L */
  private cellPos(v: GenVisual, j: number, L: number, out: { x: number; y: number }) {
    const N = v.N;
    const rep = (l: number) => {
      const S = N >> l;
      const idx = Math.min(N - 1, Math.floor(j / S) * S + (S >> 1));
      return idx;
    };
    if (L >= v.G) {
      out.x = v.targets[j * 2];
      out.y = v.targets[j * 2 + 1];
      return true;
    }
    const l = Math.floor(L);
    const f = smooth(L - l);
    const a = rep(l);
    const b = rep(l + 1);
    out.x = v.targets[a * 2] + (v.targets[b * 2] - v.targets[a * 2]) * f;
    out.y = v.targets[a * 2 + 1] + (v.targets[b * 2 + 1] - v.targets[a * 2 + 1]) * f;
    // only one cell per lineage is drawn
    return j % (N >> (l + 1)) === 0;
  }

  private writeCells(v: GenVisual) {
    const pos = { x: 0, y: 0 };
    const D = v.D;
    let L = 0;
    let seedPop = 1;
    if (v.phase === 'seed') {
      const k = clamp(v.t / (0.16 * D));
      seedPop = easeOutBack(k, 2.4) * (1 + 0.1 * Math.sin(v.t * 24));
      L = 0;
    } else if (v.phase === 'prolif') {
      L = v.G * smooth(v.t / (0.36 * D));
    } else L = v.G;
    const gen = Math.floor(L);
    const f = L - gen;
    for (let j = 0; j < v.N; j++) {
      let visible = this.cellPos(v, j, L, pos);
      if (v.phase === 'seed') visible = j === 0;
      let r = 0.17 * Math.pow(0.8, L);
      r = Math.max(0.055, r) * seedPop;
      if (v.phase === 'prolif') r *= 1 - 0.22 * Math.sin(Math.PI * f);
      if (v.phase === 'aggregate' || v.phase === 'stabilize' || v.phase === 'done') r *= 1 - 0.45 * clamp((v.filament - v.tU[j]) * 8);
      if (v.phase === 'stabilize') r *= 1 - smooth(v.solid);
      let z = 0;
      if (v.dissolving) {
        const d = v.dissolve;
        visible = j % 2 === 0;
        pos.x += v.drift[j * 3] * d * 0.5;
        pos.y += v.drift[j * 3 + 1] * d * 0.5;
        z = v.drift[j * 3 + 2] * d * 0.5;
        r = 0.08 * Math.sin(Math.PI * Math.min(1, d * 1.2));
      }
      this.p3.set(pos.x, pos.y, z);
      if (!visible || r <= 1e-3) this.s3.set(0, 0, 0);
      else this.s3.setScalar(r);
      this.m4.compose(this.p3, this.q.identity(), this.s3);
      v.cells.setMatrixAt(j, this.m4);
    }
    v.cells.instanceMatrix.needsUpdate = true;
    if (v.phase === 'prolif' && gen > v.lastGen) {
      v.lastGen = gen;
      this.ctx.audio.play('tick', { pitch: 1.2 + gen * 0.18, gain: 0.22, minGap: 40 });
    }
  }

  protected removeLetter(v: GenVisual, _ev: DeleteEvent): void {
    this.controller.cancel(v.ref.id);
    v.dissolving = true;
    v.dissolve = 0;
    v.cells.visible = true;
    v.lattice.visible = false;
    this.ctx.audio.play('zap', { pitch: 1.5, gain: 0.35, minGap: 30 });
    this.ctx.keepAlive(1000);
  }

  protected playFinale(_word: string, visuals: GenVisual[], saved: Promise<SaveOutcome>): void {
    const ctx = this.ctx;
    this.controller.flush();
    visuals
      .slice()
      .sort((a, b) => a.slot.index - b.slot.index)
      .forEach((v, i) => {
        if (v.phase !== 'done' && v.phase !== 'stabilize') {
          v.phase = 'stabilize';
          v.t = 0;
          v.filament = 1;
          v.bodyU.uProg.value = 1.1;
        }
        v.finaleT = -i * 0.06;
        v.inFinale = true;
      });
    ctx.audio.play('success', { gain: 0.7 });
    saved.then((r) => {
      if (!r.ok) ctx.audio.play('error', { gain: 0.5 });
    });
    ctx.keepAlive(2400 + visuals.length * 60);
  }

  private startWeave(v: GenVisual) {
    v.jobQueued = true;
    const glyph = this.ctx.glyphs.get(v.ref.char, 'sans');
    this.controller.write({
      id: v.ref.id,
      glyph,
      slot: v.slot,
      duration: 0.3 * v.D,
      onProgress: (s, tip) => {
        if (v.dissolving) return;
        v.filament = Math.max(v.filament, s.u);
        if (tip && s.down && Math.random() < 0.15) this.ctx.audio.play('tick', { pitch: 1.9, gain: 0.15, minGap: 50 });
      },
      onDone: () => {
        if (v.dissolving || v.phase !== 'aggregate') return;
        v.filament = 1;
        v.phase = 'stabilize';
        v.t = 0;
        v.ringMat.opacity = 0.7;
        v.ring.scale.setScalar(0.4);
        this.ctx.audio.play('chime', { pitch: 1.4, gain: 0.25, minGap: 60 });
      },
    });
    this.ctx.audio.play('hum', { pitch: 1.4, gain: 0.22, minGap: 60 });
  }

  protected updateLetter(v: GenVisual, dt: number, _time: number): boolean {
    let animating = false;
    const g = v.object;
    if (!v.inFinale && !v.dissolving) {
      // follow reflow
      const o = v.slot.origin;
      g.position.x = damp(g.position.x, o.x, 12, dt);
      g.position.y = damp(g.position.y, o.y, 12, dt);
      g.scale.setScalar(damp(g.scale.x, v.slot.size, 12, dt));
      if (Math.abs(g.position.x - o.x) + Math.abs(g.position.y - o.y) + Math.abs(g.scale.x - v.slot.size) > 1e-3) animating = true;
    }

    // ring decoration
    if (v.ringMat.opacity > 0.005) {
      v.ringMat.opacity *= Math.exp(-2.6 * dt);
      v.ring.scale.multiplyScalar(1 + dt * 1.6);
      animating = true;
    } else v.ringMat.opacity = 0;

    if (v.dissolving) {
      v.dissolve += dt / 0.6;
      const d = clamp(v.dissolve);
      v.bodyU.uSolid.value = v.solid * (1 - d);
      v.bodyU.uProg.value = Math.min(1.1, v.filament * 1.1) * (1 - d);
      v.bodyU.uGlow.value = 0.3 + 0.5 * d;
      this.writeCells(v);
      if (v.dissolve >= 1) {
        this.release(v);
        return true;
      }
      return true;
    }

    v.t += dt;
    const D = v.D;
    switch (v.phase) {
      case 'seed':
        if (v.t < dt * 1.5) {
          v.ringMat.opacity = 0.8;
          v.ring.scale.setScalar(0.15);
          v.ring.position.set(v.targets[(v.N >> 1) * 2], v.targets[(v.N >> 1) * 2 + 1], -0.05);
        }
        if (v.t >= 0.16 * D) {
          v.phase = 'prolif';
          v.t = 0;
          v.lastGen = 0;
        }
        this.writeCells(v);
        animating = true;
        break;
      case 'prolif':
        if (v.t >= 0.36 * D) {
          v.phase = 'aggregate';
          v.t = 0;
          v.ring.position.set(v.cx, v.cy, -0.05);
        }
        this.writeCells(v);
        animating = true;
        break;
      case 'aggregate':
        if (!v.jobQueued) this.startWeave(v);
        v.bodyU.uProg.value = v.filament * 1.1;
        v.lattice.geometry.setDrawRange(0, Math.floor((v.filament * v.latticeCount) / 2) * 2);
        this.writeCells(v);
        animating = true;
        break;
      case 'stabilize': {
        v.solid = clamp(v.t / (0.22 * D));
        v.bodyU.uProg.value = 1.1;
        v.bodyU.uSolid.value = easeOutBack(v.solid, 1.2);
        v.bodyU.uGlow.value = 0.9 - 0.84 * v.solid;
        v.latticeMat.opacity = 0.5 * (1 - v.solid);
        v.lattice.geometry.setDrawRange(0, v.latticeCount);
        this.writeCells(v);
        animating = true;
        if (v.solid >= 1) this.finishVisual(v);
        break;
      }
      case 'done':
        break;
    }

    if (v.inFinale) {
      v.finaleT += dt;
      const k = clamp(v.finaleT / 1.6);
      if (v.finaleT > 0) {
        const flash = Math.exp(-v.finaleT * 4) * (1 - Math.exp(-v.finaleT * 30));
        v.bodyU.uGlow.value = Math.max(v.bodyU.uGlow.value, 0.06 + flash * 0.9);
        const e = easeInCubic(k);
        g.position.y = v.slot.origin.y + e * 4.2;
        g.rotation.y = e * 1.4;
        g.scale.setScalar(v.slot.size * (1 - 0.7 * e));
      }
      if (k >= 1) {
        this.release(v);
        return true;
      }
      animating = true;
    }
    return animating;
  }

  protected updateWorld(dt: number, _t: number): boolean {
    let moving = this.placeCamera(false, dt);
    if (this.controller.update(dt)) moving = true;
    this.updateArm();
    const tool = this.controller.tools[0];
    if (tool.job || tool.queue.length || tool.idle < 1.6) moving = true;
    return moving;
  }

  disposeWorld(): void {
    this.controller.flush();
    super.disposeWorld();
    this.cellGeo.dispose();
    this.cellMat.dispose();
    this.ringGeo.dispose();
  }
}

export function create(ctx: WorldContext): WorldInstance {
  return new GenesisLab(ctx);
}

export const genesisLab: WorldModule = { create };
