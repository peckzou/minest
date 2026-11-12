/**
 * WORLD 08 · Stone Lettering (石刻)
 *
 * A limestone tablet in a workshop. Each letter is cut as a real V-groove into the stone:
 * - a steel chisel follows the strokes while a wooden mallet strikes it in rhythm;
 *   every strike throws stone chips (they bounce and pile on the sill) and puffs of dust
 * - the groove is genuine geometry *behind* the slab surface (a depth "punch" opens the slab
 *   where it has been cut), so the raking light shows a lit wall and a shaded wall
 * - chisel marks: faceted scallops along the cut; freshly cut stone is paler than the weathered face
 * - after the first pass the groove is deepened by a second pass
 * - Backspace: the cut is filled back in with stone paste (dust puff); Enter: gold leaf fills the
 *   word, it glints, then the tablet is dressed smooth again for the next word.
 */
import * as THREE from 'three';
import { LetterWorld, type LetterVisual, gradientSky } from '../engine/letter-world';
import { clamp, rand, smooth } from '../engine/anim';
import { Particles } from '../engine/particles';
import { ToolController } from '../engine/tools';
import type { Glyph } from '../engine/glyphs/glyph-engine';
import type { Slot } from '../engine/layout';
import type { DeleteEvent, InsertEvent, SaveOutcome, WorldContext, WorldModule } from '../engine/types';

const HALF_W = 0.085; // groove half width (glyph units)
const DEPTH = 0.075; // full groove depth (glyph units)
const SLAB_Z = 0;
const SILL_Y = -3.25;
const LIGHT = new THREE.Vector3(-0.55, 0.65, 0.55).normalize();

/* ------------------------------------------------------------- groove mesh */

/**
 * Cross-section mesh along every stroke. Position is the flat footprint (z = 0);
 * depth is applied in the vertex shader so the same geometry also serves as the depth mask.
 */
function buildGroove(glyph: Glyph, halfW: number, sides: number[]): THREE.BufferGeometry {
  const pos: number[] = [];
  const au: number[] = [];
  const aside: number[] = [];
  const alen: number[] = [];
  const across: number[] = [];
  const ataper: number[] = [];
  const idx: number[] = [];
  const L = glyph.length || 1;
  const m = sides.length;
  let base = 0;
  for (const s of glyph.strokes) {
    const n = s.pts.length / 2;
    if (n < 2) continue;
    const start = pos.length / 3;
    for (let i = 0; i < n; i++) {
      let x = s.pts[i * 2];
      let y = s.pts[i * 2 + 1];
      const i0 = Math.max(0, i - 1);
      const i1 = Math.min(n - 1, i + 1);
      let tx = s.pts[i1 * 2] - s.pts[i0 * 2];
      let ty = s.pts[i1 * 2 + 1] - s.pts[i0 * 2 + 1];
      const tl = Math.hypot(tx, ty) || 1;
      tx /= tl;
      ty /= tl;
      // extend the stroke ends a little so the cut has a pointed end
      if (i === 0) {
        x -= tx * halfW * 0.5;
        y -= ty * halfW * 0.5;
      } else if (i === n - 1) {
        x += tx * halfW * 0.5;
        y += ty * halfW * 0.5;
      }
      const cum = s.cum[i];
      const edge = Math.min(cum, s.length - cum);
      const taper = 0.35 + 0.65 * smooth(edge / (halfW * 2.2));
      const nx = -ty;
      const ny = tx;
      for (let j = 0; j < m; j++) {
        const sj = sides[j];
        pos.push(x + nx * sj * halfW * taper, y + ny * sj * halfW * taper, 0);
        au.push((base + cum) / L);
        aside.push(sj);
        alen.push(base + cum);
        across.push(nx, ny);
        ataper.push(taper);
      }
    }
    for (let i = 0; i < n - 1; i++) {
      for (let j = 0; j < m - 1; j++) {
        const a = start + i * m + j;
        const b = a + m;
        idx.push(a, b, a + 1, a + 1, b, b + 1);
      }
    }
    base += s.length;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('aU', new THREE.Float32BufferAttribute(au, 1));
  geo.setAttribute('aSide', new THREE.Float32BufferAttribute(aside, 1));
  geo.setAttribute('aLen', new THREE.Float32BufferAttribute(alen, 1));
  geo.setAttribute('aAcross', new THREE.Float32BufferAttribute(across, 2));
  geo.setAttribute('aTaper', new THREE.Float32BufferAttribute(ataper, 1));
  geo.setIndex(idx);
  geo.computeBoundingSphere();
  if (geo.boundingSphere) geo.boundingSphere.radius += 0.2;
  return geo;
}

/* ---------------------------------------------------------------- shaders */

const NOISE = /* glsl */ `
  float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
  float vnoise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
    return mix(mix(hash(i),hash(i+vec2(1,0)),f.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x), f.y); }
  float fbm(vec2 p){ float a=0.5, s=0.0; for(int i=0;i<4;i++){ s+=a*vnoise(p); p*=2.03; a*=0.5; } return s; }
  uniform vec3 uStoneA; uniform vec3 uStoneB; uniform vec3 uFleck; uniform vec3 uVein; uniform vec3 uLight;
  vec3 stoneColor(vec2 p){
    float n = fbm(p*1.1);
    vec3 c = mix(uStoneA, uStoneB, n);
    c *= 0.9 + 0.14*vnoise(p*38.0);
    float fleck = step(0.986, hash(floor(p*95.0)));
    c = mix(c, uFleck, fleck*0.55);
    float vein = 1.0 - smoothstep(0.0, 0.012, abs(fbm(p*0.55 + 5.0) - 0.5));
    return mix(c, uVein, vein*0.12);
  }
  vec3 shadeStone(vec3 base, vec3 n, vec3 wp, float ao, float specK){
    float d = max(dot(n, uLight), 0.0);
    vec3 V = normalize(cameraPosition - wp);
    vec3 H = normalize(uLight + V);
    float sp = pow(max(dot(n, H), 0.0), 28.0) * specK;
    return base * (0.34 + 0.95*d) * ao + vec3(sp);
  }
`;

function stoneUniforms() {
  return {
    uStoneA: { value: new THREE.Color(0xbdb5a7) },
    uStoneB: { value: new THREE.Color(0x968e81) },
    uFleck: { value: new THREE.Color(0x5e574e) },
    uVein: { value: new THREE.Color(0xe2dccf) },
    uLight: { value: LIGHT.clone() },
  };
}

function slabMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: stoneUniforms(),
    vertexShader: /* glsl */ `
      varying vec3 vW;
      void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: /* glsl */ `
      ${NOISE}
      varying vec3 vW;
      void main(){
        vec3 c = shadeStone(stoneColor(vW.xy), vec3(0.0,0.0,1.0), vW, 1.0, 0.05);
        gl_FragColor = vec4(c, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
}

function grooveMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      ...stoneUniforms(),
      uProgress: { value: 0 },
      uDeep: { value: 0 },
      uFill: { value: 0 },
      uGild: { value: 0 },
      uGlint: { value: -1 },
      uDepth: { value: DEPTH },
      uHalfW: { value: HALF_W },
      uFresh: { value: new THREE.Color(0xe9e4d9) },
      uGold: { value: new THREE.Color(0xf0b54a) },
    },
    vertexShader: /* glsl */ `
      attribute float aU; attribute float aSide; attribute float aLen; attribute vec2 aAcross; attribute float aTaper;
      uniform float uProgress; uniform float uDeep; uniform float uFill; uniform float uDepth; uniform float uHalfW;
      varying vec3 vW; varying vec3 vN; varying float vU; varying float vCut; varying float vLen; varying float vSide;
      void main(){
        float carved = clamp((uProgress - aU) * 16.0, 0.0, 1.0);
        float marks = 1.0 + 0.16 * sin(aLen * 70.0 + aSide * 1.7);
        float D = uDepth * aTaper * carved * (0.5 + 0.5 * uDeep) * (1.0 - uFill) * marks;
        float prof = 1.0 - abs(aSide);
        vec3 p = position; p.z = -D * prof;
        float slope = D / max(1e-4, uHalfW * aTaper);
        vec3 n = normalize(vec3(-aAcross * sign(aSide) * slope, 1.0));
        vec4 w = modelMatrix * vec4(p, 1.0);
        vW = w.xyz; vN = normalize(mat3(modelMatrix) * n);
        vU = aU; vCut = prof * carved * (1.0 - uFill); vLen = aLen; vSide = aSide;
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: /* glsl */ `
      ${NOISE}
      uniform float uProgress; uniform float uGild; uniform float uGlint; uniform float uFill; uniform vec3 uFresh; uniform vec3 uGold;
      varying vec3 vW; varying vec3 vN; varying float vU; varying float vCut; varying float vLen; varying float vSide;
      void main(){
        if (vU > uProgress + 1e-4) discard;
        vec3 base = stoneColor(vW.xy);
        float inside = smoothstep(0.0, 0.25, vCut);
        // freshly cut stone is paler; chisel facets catch the light differently
        base = mix(base, uFresh * (0.94 + 0.12 * vnoise(vW.xy * 60.0)), inside * 0.65);
        float facet = 0.9 + 0.1 * sin(vLen * 70.0 + vSide * 1.7 + 1.2);
        base *= mix(1.0, facet, inside);
        float ao = 1.0 - 0.42 * vCut;
        vec3 c = shadeStone(base, normalize(vN), vW, ao, 0.06);
        if (uGild > 0.0) {
          float gm = uGild * smoothstep(0.02, 0.2, vCut);
          vec3 g = shadeStone(uGold, normalize(vN), vW, 1.0, 0.9);
          float glint = uGlint >= 0.0 ? exp(-pow((vU - uGlint) * 9.0, 2.0)) : 0.0;
          c = mix(c, g + glint * vec3(1.0, 0.9, 0.6), gm);
        }
        gl_FragColor = vec4(c, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
}

/** writes depth on the slab surface where the stone has been cut, so the slab does not cover the groove */
function maskMaterial(groove: THREE.ShaderMaterial) {
  const m = new THREE.ShaderMaterial({
    uniforms: { uProgress: groove.uniforms.uProgress },
    vertexShader: /* glsl */ `
      attribute float aU; varying float vU;
      void main(){ vU = aU; vec3 p = position; p.z = 0.004; gl_Position = projectionMatrix * modelViewMatrix * vec4(p,1.0); }`,
    fragmentShader: /* glsl */ `
      uniform float uProgress; varying float vU;
      void main(){ if (vU > uProgress + 1e-4) discard; gl_FragColor = vec4(0.0); }`,
  });
  m.colorWrite = false;
  return m;
}

/* ----------------------------------------------------------------- world */

interface CarveVisual extends LetterVisual {
  group: THREE.Group;
  mat: THREE.ShaderMaterial;
  mask: THREE.ShaderMaterial;
  glyph: Glyph;
  progress: number;
  deep: number;
  fill: number;
  gild: number;
  glint: number;
  done: boolean;
  finaleT: number;
  finaleDelay: number;
}

const CHIPS = 280;

class StoneWorld extends LetterWorld<CarveVisual> {
  private grooveCache = new Map<string, THREE.BufferGeometry>();
  private slabMat: THREE.ShaderMaterial;
  private controller: ToolController;
  private chisel: THREE.Group;
  private mallet: THREE.Group;
  private chiselQ = new THREE.Quaternion();
  private qTmp = new THREE.Quaternion();
  private strikePhase = 0;
  private jolt = 0;
  private dust: Particles;
  private glints: Particles;
  private chips: THREE.InstancedMesh;
  private chipPos = new Float32Array(CHIPS * 3);
  private chipVel = new Float32Array(CHIPS * 3);
  private chipRot = new Float32Array(CHIPS * 3);
  private chipSpin = new Float32Array(CHIPS * 3);
  private chipLife = new Float32Array(CHIPS);
  private chipSize = new Float32Array(CHIPS);
  private chipHead = 0;
  private chipsAlive = 0;
  private dummy = new THREE.Object3D();
  private up = new THREE.Vector3(0, 1, 0);
  private tmp = new THREE.Vector3();
  private axis = new THREE.Vector3();
  private disposables: { dispose(): void }[] = [];

  constructor(ctx: WorldContext) {
    super(ctx);
    const scene = ctx.scene;
    scene.background = new THREE.Color(0x1d1a17);
    scene.fog = new THREE.Fog(0x1d1a17, 18, 48);
    this.root.add(gradientSky(0x2a2520, 0x110f0d, { horizon: 0x3a322a, exponent: 0.9 }));
    ctx.camera.position.set(0.6, 0.9, 11.2);
    ctx.camera.lookAt(0, -0.2, 0);

    this.root.add(new THREE.AmbientLight(0xffeedd, 0.55));
    const key = new THREE.DirectionalLight(0xfff0dc, 2.2);
    key.position.copy(LIGHT).multiplyScalar(12);
    this.root.add(key);
    const fill = new THREE.DirectionalLight(0x9fb4d8, 0.35);
    fill.position.set(6, -2, 6);
    this.root.add(fill);

    // tablet: shaded face + body for thickness
    this.slabMat = slabMaterial();
    const face = new THREE.Mesh(new THREE.PlaneGeometry(15.2, 7.1), this.slabMat);
    face.position.set(0, 0.3, SLAB_Z);
    this.root.add(face);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x8c8478, roughness: 0.95 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(15.4, 7.3, 0.9), bodyMat);
    body.position.set(0, 0.3, SLAB_Z - 0.46);
    this.root.add(body);
    // stone sill where chips land
    const sill = new THREE.Mesh(new THREE.BoxGeometry(16.4, 0.5, 1.6), new THREE.MeshStandardMaterial({ color: 0x6f675c, roughness: 1 }));
    sill.position.set(0, SILL_Y - 0.25, 0.3);
    this.root.add(sill);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(80, 40), new THREE.MeshStandardMaterial({ color: 0x2b2621, roughness: 1 }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = SILL_Y - 2.2;
    this.root.add(floor);

    // chisel (built along +y, cutting edge at the origin)
    const steel = new THREE.MeshStandardMaterial({ color: 0xaeb3b8, metalness: 0.85, roughness: 0.32 });
    const blued = new THREE.MeshStandardMaterial({ color: 0x5b6067, metalness: 0.8, roughness: 0.4 });
    this.chisel = new THREE.Group();
    const edge = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.004, 0.16, 4, 1), steel);
    edge.scale.set(1.8, 1, 0.5);
    edge.position.y = 0.08;
    const shank = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.036, 0.78, 8), steel);
    shank.position.y = 0.55;
    const head = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.05, 0.14, 12), blued);
    head.position.y = 1.0;
    this.chisel.add(edge, shank, head);
    this.chisel.position.set(5.5, -2.6, 0.4);
    this.root.add(this.chisel);

    // mallet: head axis along +y (striking face at y = 0), handle along +x
    const wood = new THREE.MeshStandardMaterial({ color: 0x8a5a33, roughness: 0.75 });
    const woodDark = new THREE.MeshStandardMaterial({ color: 0x5e3b20, roughness: 0.8 });
    this.mallet = new THREE.Group();
    const mHead = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.36, 16), wood);
    mHead.position.y = 0.18;
    const mHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.95, 8), woodDark);
    mHandle.rotation.z = Math.PI / 2;
    mHandle.position.set(0.5, 0.18, 0);
    this.mallet.add(mHead, mHandle);
    this.root.add(this.mallet);
    this.disposables.push(steel, blued, wood, woodDark, bodyMat);

    // chips (instanced, physically pile on the sill)
    const chipGeo = new THREE.TetrahedronGeometry(1, 0);
    const chipMat = new THREE.MeshStandardMaterial({ color: 0xc9c2b5, roughness: 0.9, flatShading: true });
    this.chips = new THREE.InstancedMesh(chipGeo, chipMat, CHIPS);
    this.chips.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.chips.frustumCulled = false;
    this.dummy.scale.setScalar(0);
    this.dummy.updateMatrix();
    for (let i = 0; i < CHIPS; i++) this.chips.setMatrixAt(i, this.dummy.matrix);
    this.root.add(this.chips);

    this.dust = new Particles({ capacity: 700, gravity: [0, -0.6, 0], drag: 2.2, size: 0.09, shape: 'dot', blending: THREE.NormalBlending, opacity: 0.55 });
    this.glints = new Particles({ capacity: 300, gravity: [0, 0.4, 0], drag: 2, size: 0.07, shape: 'spark' });
    this.root.add(this.dust.points, this.glints.points);

    this.controller = new ToolController(ctx.glyphs, ctx.layout, {
      count: 1,
      liftHeight: 0.3,
      maxQueue: 2,
      approach: 0.2,
      rest: () => new THREE.Vector3(5.6, -2.5, 0.5),
      restDelay: 1.2,
    });
  }

  private groove(glyph: Glyph) {
    const key = glyph.font + glyph.char;
    let g = this.grooveCache.get(key);
    if (!g) {
      g = buildGroove(glyph, HALF_W, [-1, -0.55, -0.02, 0.02, 0.55, 1]);
      g.userData.shared = true;
      this.grooveCache.set(key, g);
    }
    return g;
  }

  /* --------------------------------------------------------------- letters */

  protected createLetter(ev: InsertEvent, slot: Slot): CarveVisual | null {
    if (ev.char === ' ' || ev.char === '\n') return null;
    const glyph = this.ctx.glyphs.get(ev.char, 'serif');
    if (!glyph.strokes.length) return null;
    const geo = this.groove(glyph);
    const mat = grooveMaterial();
    const mask = maskMaterial(mat);
    const cut = new THREE.Mesh(geo, mat);
    cut.renderOrder = -3;
    const hole = new THREE.Mesh(geo, mask);
    hole.renderOrder = -2;
    const group = new THREE.Group();
    group.add(cut, hole);
    this.ctx.layout.apply(group, slot);
    this.root.add(group);
    const v: CarveVisual = { ref: ev, slot, object: group, state: 'creating', age: 0, group, mat, mask, glyph, progress: 0, deep: 0, fill: 0, gild: 0, glint: -1, done: false, finaleT: 0, finaleDelay: 0 };

    if (ev.restoring || this.ctx.reducedMotion) {
      v.progress = 1;
      v.deep = 1;
      v.done = true;
      v.state = 'alive';
      this.sync(v);
      return v;
    }
    this.controller.write({
      id: ev.id,
      glyph,
      slot,
      duration: this.ctx.tempo.duration(1150, 320) * (0.6 + glyph.length * 0.12),
      onProgress: (s) => {
        v.progress = Math.max(v.progress, s.u);
      },
      onDone: () => {
        v.progress = 1;
        v.done = true;
        if (v.state === 'creating') v.state = 'alive';
      },
    });
    this.sync(v);
    this.ctx.keepAlive(1500);
    return v;
  }

  protected removeLetter(v: CarveVisual, _ev: DeleteEvent): void {
    this.controller.cancel(v.ref.id);
    // fill the cut back in: a puff of stone paste dust along the letter
    const pts = this.ctx.glyphs.evenPoints(v.glyph, 0.12);
    const n = Math.min(pts.length, Math.round(26 * this.ctx.tempo.detail) + 6);
    for (let i = 0; i < n; i++) {
      const p = pts[Math.floor((i / n) * pts.length)];
      if (p.u > v.progress) continue;
      this.ctx.layout.toWorld(v.slot, p.x, p.y, 0.05, this.tmp);
      this.dust.emit({ x: this.tmp.x, y: this.tmp.y, z: this.tmp.z + 0.05, vx: rand(-0.3, 0.3), vy: rand(-0.1, 0.4), vz: rand(0.2, 0.6), life: rand(0.6, 1), color: 0xd8d2c6, size: rand(1, 1.8) });
    }
    this.ctx.audio.play('scratch', { gain: 0.3, pitch: 0.7 });
    this.ctx.keepAlive(900);
  }

  protected playFinale(_word: string, visuals: CarveVisual[], saved: Promise<SaveOutcome>): void {
    for (const v of visuals) this.controller.cancel(v.ref.id);
    visuals.sort((a, b) => a.slot.origin.x - b.slot.origin.x);
    visuals.forEach((v, i) => {
      v.progress = Math.max(v.progress, 1);
      v.finaleT = 0;
      v.finaleDelay = i * 0.12;
    });
    this.ctx.audio.play('chime', { gain: 0.5, pitch: 0.9 });
    saved.then((r) => {
      if (r.ok) this.ctx.audio.play('success', { gain: 0.6 });
      else this.ctx.audio.play('error', { gain: 0.5 });
    });
    this.ctx.keepAlive(4200 + visuals.length * 120);
  }

  private sync(v: CarveVisual) {
    const u = v.mat.uniforms;
    u.uProgress.value = v.progress;
    u.uDeep.value = v.deep;
    u.uFill.value = v.fill;
    u.uGild.value = v.gild;
    u.uGlint.value = v.glint;
  }

  protected updateLetter(v: CarveVisual, dt: number): boolean {
    let moving = false;
    this.ctx.layout.apply(v.group, v.slot);
    if (v.state === 'removing') {
      v.fill = Math.min(1, v.fill + dt * 2.6);
      if (v.fill >= 1) {
        this.release(v);
        return false;
      }
      moving = true;
    } else if (v.state === 'finale') {
      if (v.finaleDelay > 0) v.finaleDelay -= dt;
      else {
        v.finaleT += dt;
        const t = v.finaleT;
        v.deep = Math.min(1, v.deep + dt * 3);
        v.gild = smooth(t / 0.7);
        v.glint = t > 0.7 && t < 1.9 ? (t - 0.7) / 1.2 : -1;
        if (t > 0.3 && t < 1.0 && Math.random() < 0.5 * this.ctx.tempo.detail) this.sparkle(v);
        if (t > 2.4) {
          v.fill = smooth((t - 2.4) / 0.7);
          if (Math.random() < 0.5) this.dustAlong(v, 1);
        }
        if (t > 3.15) {
          this.release(v);
          return false;
        }
      }
      moving = true;
    } else {
      if (v.done && v.deep < 1) {
        // second pass: deepen the cut
        v.deep = Math.min(1, v.deep + dt * 1.6);
        moving = true;
      }
      if (!v.done) moving = true;
    }
    this.sync(v);
    return moving;
  }

  private sparkle(v: CarveVisual) {
    const pts = this.ctx.glyphs.evenPoints(v.glyph, 0.2);
    const p = pts[(Math.random() * pts.length) | 0];
    if (!p) return;
    this.ctx.layout.toWorld(v.slot, p.x, p.y, 0.02, this.tmp);
    this.glints.emit({ x: this.tmp.x, y: this.tmp.y, z: this.tmp.z + 0.04, vx: rand(-0.2, 0.2), vy: rand(0.1, 0.5), vz: 0.2, life: 0.7, color: 0xffe1a0, size: rand(1.2, 2) });
  }

  private dustAlong(v: CarveVisual, n: number) {
    const pts = this.ctx.glyphs.evenPoints(v.glyph, 0.2);
    for (let i = 0; i < n; i++) {
      const p = pts[(Math.random() * pts.length) | 0];
      if (!p) return;
      this.ctx.layout.toWorld(v.slot, p.x, p.y, 0.02, this.tmp);
      this.dust.emit({ x: this.tmp.x, y: this.tmp.y, z: this.tmp.z + 0.05, vx: rand(-0.3, 0.3), vy: rand(0, 0.3), vz: rand(0.1, 0.4), life: 0.8, color: 0xd8d2c6, size: 1.4 });
    }
  }

  /* -------------------------------------------------------------- strike */

  private strike(tip: THREE.Vector3, tx: number, ty: number) {
    this.jolt = 1;
    this.ctx.audio.play('tap', { gain: 0.45, pitch: rand(0.75, 0.95), minGap: 0.05 });
    const det = this.ctx.tempo.detail;
    const nChips = Math.max(1, Math.round(rand(2, 4) * det));
    for (let k = 0; k < nChips; k++) {
      const i = this.chipHead;
      this.chipHead = (this.chipHead + 1) % CHIPS;
      const p = i * 3;
      this.chipPos[p] = tip.x;
      this.chipPos[p + 1] = tip.y;
      this.chipPos[p + 2] = tip.z + 0.03;
      // chips fly ahead of the edge and out of the stone
      this.chipVel[p] = tx * rand(0.4, 1.4) + rand(-0.6, 0.6);
      this.chipVel[p + 1] = ty * rand(0.4, 1.4) + rand(0.2, 1.6);
      this.chipVel[p + 2] = rand(0.6, 1.8);
      this.chipRot[p] = rand(0, 6);
      this.chipRot[p + 1] = rand(0, 6);
      this.chipRot[p + 2] = rand(0, 6);
      this.chipSpin[p] = rand(-14, 14);
      this.chipSpin[p + 1] = rand(-14, 14);
      this.chipSpin[p + 2] = rand(-14, 14);
      this.chipLife[i] = rand(7, 11);
      this.chipSize[i] = rand(0.012, 0.03);
    }
    const nd = Math.round(5 * det) + 1;
    for (let k = 0; k < nd; k++) {
      this.dust.emit({ x: tip.x, y: tip.y, z: tip.z + 0.05, vx: rand(-0.4, 0.4) + tx * 0.3, vy: rand(-0.2, 0.4), vz: rand(0.2, 0.7), life: rand(0.5, 1.1), color: 0xd9d3c8, size: rand(0.6, 1.4) });
    }
  }

  private updateChips(dt: number) {
    let alive = 0;
    const d = this.dummy;
    for (let i = 0; i < CHIPS; i++) {
      if (this.chipLife[i] <= 0) continue;
      this.chipLife[i] -= dt;
      const p = i * 3;
      const resting = this.chipVel[p] === 0 && this.chipVel[p + 1] === 0 && this.chipVel[p + 2] === 0;
      if (!resting) {
        this.chipVel[p + 1] -= 9.8 * dt;
        this.chipPos[p] += this.chipVel[p] * dt;
        this.chipPos[p + 1] += this.chipVel[p + 1] * dt;
        this.chipPos[p + 2] += this.chipVel[p + 2] * dt;
        this.chipRot[p] += this.chipSpin[p] * dt;
        this.chipRot[p + 1] += this.chipSpin[p + 1] * dt;
        this.chipRot[p + 2] += this.chipSpin[p + 2] * dt;
        // slab face
        if (this.chipPos[p + 2] < SLAB_Z + 0.02 && this.chipPos[p + 1] > SILL_Y) {
          this.chipPos[p + 2] = SLAB_Z + 0.02;
          this.chipVel[p + 2] = Math.abs(this.chipVel[p + 2]) * 0.3;
        }
        // sill top / floor
        const onSill = this.chipPos[p + 2] < 1.1 && Math.abs(this.chipPos[p]) < 8.2;
        const floorY = (onSill ? SILL_Y : SILL_Y - 2.2) + this.chipSize[i] * 0.6;
        if (this.chipPos[p + 1] < floorY) {
          this.chipPos[p + 1] = floorY;
          if (Math.abs(this.chipVel[p + 1]) > 1.2) {
            this.chipVel[p + 1] *= -0.3;
            this.chipVel[p] *= 0.5;
            this.chipVel[p + 2] *= 0.5;
            this.chipSpin[p] *= 0.4;
            this.chipSpin[p + 2] *= 0.4;
          } else {
            this.chipVel[p] = this.chipVel[p + 1] = this.chipVel[p + 2] = 0;
          }
        }
        alive++;
      }
      const fade = clamp(this.chipLife[i] / 1.2);
      d.position.set(this.chipPos[p], this.chipPos[p + 1], this.chipPos[p + 2]);
      d.rotation.set(this.chipRot[p], this.chipRot[p + 1], this.chipRot[p + 2]);
      d.scale.setScalar(this.chipLife[i] > 0 ? this.chipSize[i] * fade : 0);
      d.scale.y *= 0.6;
      d.updateMatrix();
      this.chips.setMatrixAt(i, d.matrix);
      if (fade < 1) alive++;
    }
    this.chips.instanceMatrix.needsUpdate = true;
    this.chipsAlive = alive;
    return alive > 0;
  }

  /* -------------------------------------------------------------- world */

  protected updateWorld(dt: number, time: number): boolean {
    let moving = this.controller.update(dt);
    const tool = this.controller.tools[0];
    // chisel follows the tool tip, tilted back along the stroke and out of the stone
    const s = tool.sample;
    const working = !!tool.job;
    const tx = working ? s.tx : 0.3;
    const ty = working ? s.ty : -0.2;
    this.axis.set(-tx * 0.45 + 0.28, -ty * 0.45 + 0.42, 0.85).normalize();
    this.qTmp.setFromUnitVectors(this.up, this.axis);
    this.chiselQ.slerp(this.qTmp, 1 - Math.exp(-14 * dt));
    this.chisel.quaternion.copy(this.chiselQ);
    this.chisel.position.copy(tool.tip);
    this.jolt = Math.max(0, this.jolt - dt * 9);
    const axisNow = this.tmp.set(0, 1, 0).applyQuaternion(this.chiselQ);
    this.chisel.position.addScaledVector(axisNow, -0.025 * this.jolt);

    // mallet rhythm: slow lift, fast strike onto the chisel head
    const cutting = working && tool.down;
    const rate = this.ctx.tempo.tempo === 'fast' ? 9 : this.ctx.tempo.tempo === 'normal' ? 7 : 5.5;
    let raise: number;
    if (cutting) {
      const prev = this.strikePhase;
      this.strikePhase = (this.strikePhase + dt * rate) % 1;
      if (this.strikePhase < prev) this.strike(tool.tip, s.tx, s.ty);
      const p = this.strikePhase;
      raise = p < 0.72 ? smooth(p / 0.72) : 1 - (p - 0.72) / 0.28;
    } else {
      raise = 0.55 + Math.sin(time * 2) * 0.05;
    }
    const butt = this.tmp.copy(this.chisel.position).addScaledVector(axisNow, 1.07);
    this.mallet.quaternion.copy(this.chiselQ);
    // swing a little sideways when raised (so it reads as an arc, not a piston)
    this.mallet.position.copy(butt).addScaledVector(axisNow, 0.02 + raise * 0.55);
    this.mallet.position.x += raise * 0.18;
    this.mallet.rotateZ(-raise * 0.35);
    if (working || tool.idle < 1.5) moving = true;

    if (this.dust.update(dt, time)) moving = true;
    if (this.glints.update(dt, time)) moving = true;
    if (this.updateChips(dt)) moving = true;
    return moving;
  }

  onLayout(): void {
    for (const v of this.letters.values()) this.ctx.layout.apply(v.group, v.slot);
  }

  protected release(v: CarveVisual) {
    this.controller.cancel(v.ref.id);
    super.release(v);
  }

  disposeWorld(): void {
    this.dust.dispose();
    this.glints.dispose();
    this.chips.dispose();
    super.disposeWorld();
    for (const g of this.grooveCache.values()) g.dispose();
    this.grooveCache.clear();
    for (const d of this.disposables) d.dispose();
  }
}

export function create(ctx: WorldContext) {
  return new StoneWorld(ctx);
}

export const stoneCarve: WorldModule = { create };
