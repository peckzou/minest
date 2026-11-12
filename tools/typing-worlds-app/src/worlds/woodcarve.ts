/**
 * WORLD 09 · Wood Lettering (木刻)
 *
 * A maple board on a workbench. Each letter is made in three woodworking steps:
 *  1. a carving knife scores the outline (thin incised line along the strokes)
 *  2. a U-gouge follows and scoops the channel out; curled shavings fly off and land on the bench
 *  3. a sanding block rubs over the letter: knife facets soften, fuzz disappears, sawdust drifts
 * The channel is real geometry behind the board surface (a depth "punch" opens the board where it
 * is cut); the wood grain bends with the depth of the cut, knife facets show along the channel.
 * Backspace: the cut is filled with wood filler and sawdust; Enter: the word is stained dark,
 * a varnish glint runs along it, then the board is dressed smooth for the next word.
 */
import * as THREE from 'three';
import { LetterWorld, type LetterVisual, gradientSky } from '../engine/letter-world';
import { clamp, rand, smooth, lerp } from '../engine/anim';
import { Particles } from '../engine/particles';
import { ToolController } from '../engine/tools';
import type { Glyph } from '../engine/glyphs/glyph-engine';
import type { Slot } from '../engine/layout';
import type { DeleteEvent, InsertEvent, SaveOutcome, WorldContext, WorldModule } from '../engine/types';

const HALF_W = 0.08;
const DEPTH = 0.07;
const BENCH_Y = -3.2;
const LIGHT = new THREE.Vector3(-0.45, 0.7, 0.55).normalize();
const SIDES = [-1, -0.75, -0.5, -0.25, -0.1, 0, 0.1, 0.25, 0.5, 0.75, 1];

/* ------------------------------------------------------------- groove mesh */

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
      if (i === 0) {
        x -= tx * halfW * 0.7;
        y -= ty * halfW * 0.7;
      } else if (i === n - 1) {
        x += tx * halfW * 0.7;
        y += ty * halfW * 0.7;
      }
      const cum = s.cum[i];
      const edge = Math.min(cum, s.length - cum);
      // gouge cuts end in a rounded scoop
      const taper = 0.55 + 0.45 * Math.sqrt(clamp(edge / (halfW * 1.6)));
      for (let j = 0; j < m; j++) {
        const sj = sides[j];
        pos.push(x - ty * sj * halfW * taper, y + tx * sj * halfW * taper, 0);
        au.push((base + cum) / L);
        aside.push(sj);
        alen.push(base + cum);
        across.push(-ty, tx);
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

const WOOD = /* glsl */ `
  float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
  float vnoise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
    return mix(mix(hash(i),hash(i+vec2(1,0)),f.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x), f.y); }
  float fbm(vec2 p){ float a=0.5, s=0.0; for(int i=0;i<4;i++){ s+=a*vnoise(p); p*=2.03; a*=0.5; } return s; }
  uniform vec3 uWoodA; uniform vec3 uWoodB; uniform vec3 uLight;
  /* long horizontal grain; 'cut' shifts the rings so the grain bends inside the channel */
  vec3 woodColor(vec2 p, float cut){
    float warp = fbm(vec2(p.x*0.18, p.y*1.6)) * 1.6;
    float r = (p.y + warp + cut) * 5.5;
    float ring = fract(r);
    float late = smoothstep(0.62, 0.95, ring) * (0.75 + 0.25*vnoise(p*vec2(0.5, 9.0)));
    vec3 c = mix(uWoodA, uWoodB, late);
    float pores = vnoise(vec2(p.x*2.0, p.y*60.0));
    c *= 0.93 + 0.1*pores;
    float fleck = smoothstep(0.82, 0.9, vnoise(vec2(p.x*1.2, p.y*28.0)));
    return c * (1.0 + 0.06*fleck);
  }
  vec3 shadeWood(vec3 base, vec3 n, vec3 wp, float ao, float specK, float shin){
    float d = max(dot(n, uLight), 0.0);
    vec3 V = normalize(cameraPosition - wp);
    vec3 H = normalize(uLight + V);
    float sp = pow(max(dot(n, H), 0.0), shin) * specK;
    return base * (0.36 + 0.9*d) * ao + vec3(sp);
  }
`;

function woodUniforms() {
  return {
    uWoodA: { value: new THREE.Color(0xe2b97f) },
    uWoodB: { value: new THREE.Color(0xb27a45) },
    uLight: { value: LIGHT.clone() },
  };
}

function boardMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: woodUniforms(),
    vertexShader: /* glsl */ `
      varying vec3 vW;
      void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: /* glsl */ `
      ${WOOD}
      varying vec3 vW;
      void main(){
        vec3 c = shadeWood(woodColor(vW.xy, 0.0), vec3(0.0,0.0,1.0), vW, 1.0, 0.07, 30.0);
        gl_FragColor = vec4(c, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
}

function grooveMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      ...woodUniforms(),
      uScore: { value: 0 },
      uProgress: { value: 0 },
      uDeep: { value: 0 },
      uSand: { value: 0 },
      uFill: { value: 0 },
      uStain: { value: 0 },
      uGlint: { value: -1 },
      uDepth: { value: DEPTH },
      uHalfW: { value: HALF_W },
      uFresh: { value: new THREE.Color(0xf3d9ad) },
      uStainCol: { value: new THREE.Color(0x4a2814) },
      uFiller: { value: new THREE.Color(0xd9b88a) },
    },
    vertexShader: /* glsl */ `
      attribute float aU; attribute float aSide; attribute float aLen; attribute vec2 aAcross; attribute float aTaper;
      uniform float uScore; uniform float uProgress; uniform float uDeep; uniform float uSand; uniform float uFill;
      uniform float uDepth; uniform float uHalfW;
      varying vec3 vW; varying vec3 vN; varying float vU; varying float vCut; varying float vLen; varying float vSide; varying float vDepth;
      void main(){
        float carved = clamp((uProgress - aU) * 16.0, 0.0, 1.0);
        float scored = clamp((uScore - aU) * 30.0, 0.0, 1.0);
        float marks = 1.0 + 0.2 * (1.0 - uSand) * sin(aLen * 55.0 + aSide * 0.8);
        float D = uDepth * aTaper * (carved * (0.6 + 0.4 * uDeep) * marks + (1.0 - carved) * scored * 0.45) * (1.0 - uFill);
        float prof = 1.0 - aSide * aSide;
        vec3 p = position; p.z = -D * prof;
        float slope = 2.0 * D * aSide / max(1e-4, uHalfW * aTaper);
        vec3 n = normalize(vec3(-aAcross * slope, 1.0));
        vec4 w = modelMatrix * vec4(p, 1.0);
        vW = w.xyz; vN = normalize(mat3(modelMatrix) * n);
        vU = aU; vCut = prof * max(carved, scored * 0.6) * (1.0 - uFill); vLen = aLen; vSide = aSide; vDepth = D * prof;
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: /* glsl */ `
      ${WOOD}
      uniform float uScore; uniform float uProgress; uniform float uSand; uniform float uFill; uniform float uStain; uniform float uGlint;
      uniform vec3 uFresh; uniform vec3 uStainCol; uniform vec3 uFiller;
      varying vec3 vW; varying vec3 vN; varying float vU; varying float vCut; varying float vLen; varying float vSide; varying float vDepth;
      void main(){
        bool full = vU <= uProgress + 1e-4;
        bool score = vU <= uScore + 1e-4 && abs(vSide) < 0.16;
        if (!full && !score) discard;
        float inside = smoothstep(0.0, 0.2, vCut);
        vec3 base = woodColor(vW.xy, vDepth * 6.0);
        // freshly cut fibres are pale and fuzzy until sanded
        float fuzz = (1.0 - uSand) * vnoise(vW.xy * vec2(40.0, 140.0));
        base = mix(base, uFresh * (0.92 + 0.1 * fuzz), inside * (0.55 - 0.25 * uSand));
        float facet = 0.9 + 0.1 * sin(vLen * 55.0 + vSide * 0.8 + 1.3);
        base *= mix(1.0, facet, inside * (1.0 - uSand));
        base = mix(base, uFiller * (0.95 + 0.08 * vnoise(vW.xy * 50.0)), uFill * smoothstep(0.0, 0.3, 1.0 - abs(vSide)));
        base = mix(base, uStainCol * (0.85 + 0.3 * woodColor(vW.xy, vDepth * 6.0).r), uStain * inside);
        float ao = 1.0 - 0.45 * vCut;
        float spec = 0.05 + 0.1 * uSand * inside + 0.5 * uStain * inside;
        vec3 c = shadeWood(base, normalize(vN), vW, ao, spec, mix(18.0, 60.0, uStain));
        float glint = uGlint >= 0.0 ? exp(-pow((vU - uGlint) * 10.0, 2.0)) * inside : 0.0;
        c += glint * vec3(1.0, 0.85, 0.6) * 0.8;
        gl_FragColor = vec4(c, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
}

function maskMaterial(groove: THREE.ShaderMaterial) {
  const m = new THREE.ShaderMaterial({
    uniforms: { uProgress: groove.uniforms.uProgress, uScore: groove.uniforms.uScore },
    vertexShader: /* glsl */ `
      attribute float aU; attribute float aSide; varying float vU; varying float vSide;
      void main(){ vU = aU; vSide = aSide; vec3 p = position; p.z = 0.004; gl_Position = projectionMatrix * modelViewMatrix * vec4(p,1.0); }`,
    fragmentShader: /* glsl */ `
      uniform float uProgress; uniform float uScore; varying float vU; varying float vSide;
      void main(){
        bool full = vU <= uProgress + 1e-4;
        bool score = vU <= uScore + 1e-4 && abs(vSide) < 0.16;
        if (!full && !score) discard;
        gl_FragColor = vec4(0.0);
      }`,
  });
  m.colorWrite = false;
  return m;
}

/** a curled wood shaving: flat ribbon wound into a tightening spiral */
function shavingGeometry() {
  const pos: number[] = [];
  const idx: number[] = [];
  const N = 28;
  const turns = 1.7 * Math.PI * 2;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const a = t * turns;
    const r = 1 - t * 0.62;
    const w = 0.55 * (1 - t * 0.4);
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    pos.push(x, y, -w + t * 0.4, x, y, w + t * 0.4);
  }
  for (let i = 0; i < N; i++) {
    const a = i * 2;
    idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/* ----------------------------------------------------------------- world */

interface WoodVisual extends LetterVisual {
  group: THREE.Group;
  mat: THREE.ShaderMaterial;
  glyph: Glyph;
  score: number;
  progress: number;
  deep: number;
  sand: number;
  fill: number;
  stain: number;
  glint: number;
  stage: 'score' | 'gouge' | 'sand' | 'done';
  finaleT: number;
  finaleDelay: number;
}

const SHAVINGS = 160;

class WoodWorld extends LetterWorld<WoodVisual> {
  private grooveCache = new Map<string, THREE.BufferGeometry>();
  private knifeCtl: ToolController;
  private gougeCtl: ToolController;
  private knife: THREE.Group;
  private gouge: THREE.Group;
  private sander: THREE.Group;
  private knifeQ = new THREE.Quaternion();
  private gougeQ = new THREE.Quaternion();
  private qTmp = new THREE.Quaternion();
  private sandQueue: WoodVisual[] = [];
  private sanding: { v: WoodVisual; t: number; dur: number } | null = null;
  private sanderRest = new THREE.Vector3(-6.2, -2.75, 0.6);
  private dust: Particles;
  private glints: Particles;
  private shav: THREE.InstancedMesh;
  private sPos = new Float32Array(SHAVINGS * 3);
  private sVel = new Float32Array(SHAVINGS * 3);
  private sRot = new Float32Array(SHAVINGS * 3);
  private sSpin = new Float32Array(SHAVINGS * 3);
  private sLife = new Float32Array(SHAVINGS);
  private sSize = new Float32Array(SHAVINGS);
  private sHead = 0;
  private shaveClock = 0;
  private dummy = new THREE.Object3D();
  private up = new THREE.Vector3(0, 1, 0);
  private tmp = new THREE.Vector3();
  private axis = new THREE.Vector3();
  private disposables: { dispose(): void }[] = [];

  constructor(ctx: WorldContext) {
    super(ctx);
    const scene = ctx.scene;
    scene.background = new THREE.Color(0x2a1f17);
    scene.fog = new THREE.Fog(0x2a1f17, 18, 50);
    this.root.add(gradientSky(0x3b2c20, 0x15100c, { horizon: 0x4a3626, exponent: 0.9 }));
    ctx.camera.position.set(-0.4, 0.9, 11.2);
    ctx.camera.lookAt(0, -0.2, 0);

    this.root.add(new THREE.AmbientLight(0xffe6c8, 0.55));
    const key = new THREE.DirectionalLight(0xffe9cc, 2.1);
    key.position.copy(LIGHT).multiplyScalar(12);
    this.root.add(key);
    const fill = new THREE.DirectionalLight(0xb0c4e0, 0.3);
    fill.position.set(6, -1, 6);
    this.root.add(fill);

    // board
    const face = new THREE.Mesh(new THREE.PlaneGeometry(15.2, 7.0), boardMaterial());
    face.position.set(0, 0.3, 0);
    this.root.add(face);
    const edgeMat = new THREE.MeshStandardMaterial({ color: 0xa8763f, roughness: 0.8 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(15.3, 7.1, 0.6), edgeMat);
    body.position.set(0, 0.3, -0.31);
    this.root.add(body);
    // workbench
    const benchMat = new THREE.MeshStandardMaterial({ color: 0x6b4527, roughness: 0.85 });
    const bench = new THREE.Mesh(new THREE.BoxGeometry(18, 0.6, 3.2), benchMat);
    bench.position.set(0, BENCH_Y - 0.3, 0.9);
    this.root.add(bench);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(80, 40), new THREE.MeshStandardMaterial({ color: 0x24190f, roughness: 1 }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = BENCH_Y - 3;
    this.root.add(floor);
    // clamps holding the board
    const clampMat = new THREE.MeshStandardMaterial({ color: 0x3d6db3, roughness: 0.5, metalness: 0.3 });
    for (const sx of [-6.6, 6.6]) {
      const c = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.9, 1.1), clampMat);
      c.position.set(sx, BENCH_Y + 0.45, 0.05);
      this.root.add(c);
    }
    this.disposables.push(edgeMat, benchMat, clampMat);

    // carving knife: blade at origin along +y, handle above
    const steel = new THREE.MeshStandardMaterial({ color: 0xc2c6ca, metalness: 0.85, roughness: 0.25 });
    const handleMat = new THREE.MeshStandardMaterial({ color: 0xc58b4e, roughness: 0.6 });
    const brass = new THREE.MeshStandardMaterial({ color: 0xc9a14a, metalness: 0.8, roughness: 0.35 });
    this.disposables.push(steel, handleMat, brass);
    this.knife = new THREE.Group();
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.36, 0.08), steel);
    blade.position.set(0, 0.18, 0.02);
    blade.rotation.x = 0.25;
    const kHandle = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.55, 4, 10), handleMat);
    kHandle.position.y = 0.66;
    this.knife.add(blade, kHandle);
    this.root.add(this.knife);

    // U-gouge: half-pipe steel, ferrule, handle
    this.gouge = new THREE.Group();
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.62, 12, 1, true, -Math.PI / 2, Math.PI), steel);
    (pipe.material as THREE.Material).side = THREE.DoubleSide;
    pipe.position.y = 0.31;
    const ferrule = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.08, 12), brass);
    ferrule.position.y = 0.66;
    const gHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.065, 0.62, 12), handleMat);
    gHandle.position.y = 1.0;
    this.gouge.add(pipe, ferrule, gHandle);
    this.root.add(this.gouge);

    // sanding block: cork block + sandpaper face (facing -z, rubs the board)
    this.sander = new THREE.Group();
    const cork = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.42, 0.22), new THREE.MeshStandardMaterial({ color: 0xc69a6a, roughness: 1 }));
    cork.position.z = 0.13;
    const paper = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.44, 0.02), new THREE.MeshStandardMaterial({ color: 0x8a4b2c, roughness: 1 }));
    paper.position.z = 0.01;
    this.sander.add(cork, paper);
    this.sander.position.copy(this.sanderRest);
    this.root.add(this.sander);

    // shavings
    const shGeo = shavingGeometry();
    const shMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7, side: THREE.DoubleSide });
    this.shav = new THREE.InstancedMesh(shGeo, shMat, SHAVINGS);
    this.shav.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.shav.frustumCulled = false;
    const c = new THREE.Color();
    this.dummy.scale.setScalar(0);
    this.dummy.updateMatrix();
    for (let i = 0; i < SHAVINGS; i++) {
      this.shav.setMatrixAt(i, this.dummy.matrix);
      this.shav.setColorAt(i, c.setHex(0xf1d3a0).multiplyScalar(rand(0.85, 1.05)));
    }
    this.root.add(this.shav);

    this.dust = new Particles({ capacity: 700, gravity: [0, -0.5, 0], drag: 2.4, size: 0.07, shape: 'dot', blending: THREE.NormalBlending, opacity: 0.6 });
    this.glints = new Particles({ capacity: 200, gravity: [0, 0.3, 0], drag: 2, size: 0.07, shape: 'spark' });
    this.root.add(this.dust.points, this.glints.points);

    this.knifeCtl = new ToolController(ctx.glyphs, ctx.layout, { count: 1, liftHeight: 0.3, maxQueue: 2, approach: 0.16, rest: () => new THREE.Vector3(5.2, -2.6, 0.5), restDelay: 1 });
    this.gougeCtl = new ToolController(ctx.glyphs, ctx.layout, { count: 1, liftHeight: 0.35, maxQueue: 2, approach: 0.18, rest: () => new THREE.Vector3(6.2, -2.4, 0.6), restDelay: 1.2 });
  }

  private groove(glyph: Glyph) {
    const key = glyph.font + glyph.char;
    let g = this.grooveCache.get(key);
    if (!g) {
      g = buildGroove(glyph, HALF_W, SIDES);
      g.userData.shared = true;
      this.grooveCache.set(key, g);
    }
    return g;
  }

  /* --------------------------------------------------------------- letters */

  protected createLetter(ev: InsertEvent, slot: Slot): WoodVisual | null {
    if (ev.char === ' ' || ev.char === '\n') return null;
    const glyph = this.ctx.glyphs.get(ev.char, 'sans');
    if (!glyph.strokes.length) return null;
    const geo = this.groove(glyph);
    const mat = grooveMaterial();
    const cut = new THREE.Mesh(geo, mat);
    cut.renderOrder = -3;
    const hole = new THREE.Mesh(geo, maskMaterial(mat));
    hole.renderOrder = -2;
    const group = new THREE.Group();
    group.add(cut, hole);
    this.ctx.layout.apply(group, slot);
    this.root.add(group);
    const v: WoodVisual = { ref: ev, slot, object: group, state: 'creating', age: 0, group, mat, glyph, score: 0, progress: 0, deep: 0, sand: 0, fill: 0, stain: 0, glint: -1, stage: 'score', finaleT: 0, finaleDelay: 0 };
    if (ev.restoring || this.ctx.reducedMotion) {
      v.score = v.progress = v.deep = v.sand = 1;
      v.stage = 'done';
      v.state = 'alive';
      this.sync(v);
      return v;
    }
    const base = this.ctx.tempo.duration(700, 200) * (0.6 + glyph.length * 0.12);
    // step 1: knife scores the outline
    this.knifeCtl.write({
      id: ev.id,
      glyph,
      slot,
      duration: base * 0.6,
      onProgress: (s) => (v.score = Math.max(v.score, s.u)),
      onDone: () => {
        v.score = 1;
        if (v.state !== 'creating') return;
        v.stage = 'gouge';
        // step 2: the gouge scoops the channel
        this.gougeCtl.write({
          id: ev.id,
          glyph,
          slot: v.slot,
          duration: base,
          onProgress: (s) => (v.progress = Math.max(v.progress, s.u)),
          onDone: () => {
            v.progress = 1;
            if (v.state !== 'creating') return;
            v.stage = 'sand';
            this.sandQueue.push(v);
          },
        });
      },
    });
    this.ctx.audio.play('scratch', { gain: 0.25, pitch: 1.6 });
    this.sync(v);
    this.ctx.keepAlive(1600);
    return v;
  }

  protected removeLetter(v: WoodVisual, _ev: DeleteEvent): void {
    this.knifeCtl.cancel(v.ref.id);
    this.gougeCtl.cancel(v.ref.id);
    this.sandQueue = this.sandQueue.filter((x) => x !== v);
    if (this.sanding?.v === v) this.sanding = null;
    this.dustAlong(v, Math.round(18 * this.ctx.tempo.detail) + 4, 0xe8cfa2);
    this.ctx.audio.play('erase', { gain: 0.3, pitch: 0.8 });
    this.ctx.keepAlive(900);
  }

  protected playFinale(_word: string, visuals: WoodVisual[], saved: Promise<SaveOutcome>): void {
    visuals.sort((a, b) => a.slot.origin.x - b.slot.origin.x);
    visuals.forEach((v, i) => {
      this.knifeCtl.cancel(v.ref.id);
      this.gougeCtl.cancel(v.ref.id);
      this.sandQueue = this.sandQueue.filter((x) => x !== v);
      if (this.sanding?.v === v) this.sanding = null;
      v.score = 1;
      v.progress = Math.max(v.progress, 1);
      v.finaleT = 0;
      v.finaleDelay = i * 0.12;
    });
    this.ctx.audio.play('chime', { gain: 0.45, pitch: 0.8 });
    saved.then((r) => {
      if (r.ok) this.ctx.audio.play('success', { gain: 0.6 });
      else this.ctx.audio.play('error', { gain: 0.5 });
    });
    this.ctx.keepAlive(4200 + visuals.length * 120);
  }

  private sync(v: WoodVisual) {
    const u = v.mat.uniforms;
    u.uScore.value = v.score;
    u.uProgress.value = v.progress;
    u.uDeep.value = v.deep;
    u.uSand.value = v.sand;
    u.uFill.value = v.fill;
    u.uStain.value = v.stain;
    u.uGlint.value = v.glint;
  }

  protected updateLetter(v: WoodVisual, dt: number): boolean {
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
        v.sand = Math.min(1, v.sand + dt * 3);
        v.stain = smooth(t / 0.8);
        v.glint = t > 0.8 && t < 2.0 ? (t - 0.8) / 1.2 : -1;
        if (t > 0.9 && t < 1.8 && Math.random() < 0.4 * this.ctx.tempo.detail) this.sparkle(v);
        if (t > 2.4) {
          v.fill = smooth((t - 2.4) / 0.7);
          if (Math.random() < 0.5) this.dustAlong(v, 1, 0xe8cfa2);
        }
        if (t > 3.15) {
          this.release(v);
          return false;
        }
      }
      moving = true;
    } else {
      if (v.progress >= 1 && v.deep < 1) {
        v.deep = Math.min(1, v.deep + dt * 1.8);
        moving = true;
      }
      if (v.stage !== 'done') moving = true;
    }
    this.sync(v);
    return moving;
  }

  private sparkle(v: WoodVisual) {
    const pts = this.ctx.glyphs.evenPoints(v.glyph, 0.2);
    const p = pts[(Math.random() * pts.length) | 0];
    if (!p) return;
    this.ctx.layout.toWorld(v.slot, p.x, p.y, 0.02, this.tmp);
    this.glints.emit({ x: this.tmp.x, y: this.tmp.y, z: this.tmp.z + 0.04, vx: rand(-0.2, 0.2), vy: rand(0.1, 0.4), vz: 0.2, life: 0.6, color: 0xffd9a0, size: rand(1.1, 1.8) });
  }

  private dustAlong(v: WoodVisual, n: number, color: number) {
    const pts = this.ctx.glyphs.evenPoints(v.glyph, 0.15);
    for (let i = 0; i < n; i++) {
      const p = pts[(Math.random() * pts.length) | 0];
      if (!p || p.u > Math.max(v.progress, v.score)) continue;
      this.ctx.layout.toWorld(v.slot, p.x, p.y, 0.03, this.tmp);
      this.dust.emit({ x: this.tmp.x, y: this.tmp.y, z: this.tmp.z + 0.05, vx: rand(-0.3, 0.3), vy: rand(-0.1, 0.3), vz: rand(0.1, 0.5), life: rand(0.6, 1.1), color, size: rand(0.8, 1.6) });
    }
  }

  /* ------------------------------------------------------------ shavings */

  private shave(tip: THREE.Vector3, tx: number, ty: number) {
    const i = this.sHead;
    this.sHead = (this.sHead + 1) % SHAVINGS;
    const p = i * 3;
    this.sPos[p] = tip.x;
    this.sPos[p + 1] = tip.y;
    this.sPos[p + 2] = tip.z + 0.05;
    this.sVel[p] = tx * rand(0.6, 1.4) + rand(-0.4, 0.4);
    this.sVel[p + 1] = ty * rand(0.6, 1.4) + rand(0.8, 1.8);
    this.sVel[p + 2] = rand(0.8, 1.8);
    this.sRot[p] = rand(0, 6);
    this.sRot[p + 1] = rand(0, 6);
    this.sRot[p + 2] = rand(0, 6);
    this.sSpin[p] = rand(-8, 8);
    this.sSpin[p + 1] = rand(-8, 8);
    this.sSpin[p + 2] = rand(-8, 8);
    this.sLife[i] = rand(9, 14);
    this.sSize[i] = rand(0.05, 0.085);
  }

  private updateShavings(dt: number) {
    let active = 0;
    const d = this.dummy;
    for (let i = 0; i < SHAVINGS; i++) {
      if (this.sLife[i] <= 0) continue;
      this.sLife[i] -= dt;
      const p = i * 3;
      const resting = this.sVel[p] === 0 && this.sVel[p + 1] === 0 && this.sVel[p + 2] === 0;
      if (!resting) {
        active++;
        // light shavings: strong air drag, slow fall, tumble
        const drag = Math.exp(-1.6 * dt);
        this.sVel[p] *= drag;
        this.sVel[p + 2] *= drag;
        this.sVel[p + 1] = this.sVel[p + 1] * drag - 5.5 * dt;
        this.sPos[p] += this.sVel[p] * dt;
        this.sPos[p + 1] += this.sVel[p + 1] * dt;
        this.sPos[p + 2] += this.sVel[p + 2] * dt;
        this.sRot[p] += this.sSpin[p] * dt;
        this.sRot[p + 1] += this.sSpin[p + 1] * dt;
        this.sRot[p + 2] += this.sSpin[p + 2] * dt;
        if (this.sPos[p + 2] < 0.05 && this.sPos[p + 1] > BENCH_Y) {
          this.sPos[p + 2] = 0.05;
          this.sVel[p + 2] = Math.abs(this.sVel[p + 2]) * 0.3;
        }
        const onBench = this.sPos[p + 2] < 2.5 && Math.abs(this.sPos[p]) < 9;
        const fy = (onBench ? BENCH_Y : BENCH_Y - 3) + this.sSize[i] * 0.5;
        if (this.sPos[p + 1] < fy) {
          this.sPos[p + 1] = fy;
          this.sVel[p] = this.sVel[p + 1] = this.sVel[p + 2] = 0;
          this.sRot[p] = lerp(this.sRot[p], Math.PI / 2, 0.6);
        }
      }
      const fade = clamp(this.sLife[i] / 1.5);
      if (fade < 1) active++;
      d.position.set(this.sPos[p], this.sPos[p + 1], this.sPos[p + 2]);
      d.rotation.set(this.sRot[p], this.sRot[p + 1], this.sRot[p + 2]);
      d.scale.setScalar(this.sLife[i] > 0 ? this.sSize[i] * fade : 0);
      d.updateMatrix();
      this.shav.setMatrixAt(i, d.matrix);
    }
    this.shav.instanceMatrix.needsUpdate = true;
    return active > 0;
  }

  /* --------------------------------------------------------------- tools */

  private poseTool(obj: THREE.Group, q: THREE.Quaternion, tip: THREE.Vector3, tx: number, ty: number, lean: number, dt: number) {
    this.axis.set(-tx * lean + 0.22, -ty * lean + 0.4, 0.85).normalize();
    this.qTmp.setFromUnitVectors(this.up, this.axis);
    q.slerp(this.qTmp, 1 - Math.exp(-14 * dt));
    obj.quaternion.copy(q);
    obj.position.copy(tip);
  }

  private updateSander(dt: number, time: number) {
    if (!this.sanding && this.sandQueue.length) {
      // keep up with fast typing: older letters get sanded without the block
      while (this.sandQueue.length > 2) {
        const old = this.sandQueue.shift()!;
        old.stage = 'done';
        if (old.state === 'creating') old.state = 'alive';
        old.sand = 1;
      }
      const v = this.sandQueue.shift()!;
      this.sanding = { v, t: 0, dur: this.ctx.tempo.duration(650, 260) };
    }
    const target = this.tmp;
    if (this.sanding) {
      const s = this.sanding;
      s.t += dt / s.dur;
      const v = s.v;
      v.sand = Math.min(1, s.t);
      const w = v.slot.advance / v.slot.size;
      const gx = 0.5 * w + Math.sin(time * 26) * 0.18 + (s.t - 0.5) * w * 0.6;
      const gy = 0.5 + Math.sin(s.t * Math.PI * 3) * 0.28;
      this.ctx.layout.toWorld(v.slot, gx, gy, 0.02, target);
      this.sander.position.lerp(target, 1 - Math.exp(-30 * dt));
      this.sander.rotation.z = Math.sin(time * 26) * 0.08;
      if (Math.random() < 0.6 * this.ctx.tempo.detail)
        this.dust.emit({ x: this.sander.position.x + rand(-0.3, 0.3), y: this.sander.position.y - 0.2, z: this.sander.position.z + 0.05, vx: rand(-0.3, 0.3), vy: rand(-0.3, 0.1), vz: rand(0.1, 0.4), life: 0.9, color: 0xf0d9b0, size: rand(0.6, 1.2) });
      this.ctx.audio.play('chalk', { gain: 0.12, pitch: 0.6, minGap: 0.12 });
      if (s.t >= 1) {
        v.sand = 1;
        v.stage = 'done';
        if (v.state === 'creating') v.state = 'alive';
        this.sanding = null;
      }
      return true;
    }
    if (this.sander.position.distanceTo(this.sanderRest) > 0.01) {
      this.sander.position.lerp(this.sanderRest, 1 - Math.exp(-5 * dt));
      this.sander.rotation.z *= 0.9;
      return true;
    }
    return false;
  }

  protected updateWorld(dt: number, time: number): boolean {
    let moving = this.knifeCtl.update(dt);
    if (this.gougeCtl.update(dt)) moving = true;
    const kt = this.knifeCtl.tools[0];
    const gt = this.gougeCtl.tools[0];
    this.poseTool(this.knife, this.knifeQ, kt.tip, kt.job ? kt.sample.tx : 0.2, kt.job ? kt.sample.ty : -0.3, 0.35, dt);
    this.poseTool(this.gouge, this.gougeQ, gt.tip, gt.job ? gt.sample.tx : 0.2, gt.job ? gt.sample.ty : -0.3, 0.55, dt);
    if (kt.job && kt.down && Math.random() < 0.15) this.ctx.audio.play('scratch', { gain: 0.12, pitch: 1.8, minGap: 0.1 });
    if (gt.job && gt.down) {
      this.shaveClock += dt;
      const every = 0.07 / Math.max(0.5, this.ctx.tempo.detail);
      while (this.shaveClock > every) {
        this.shaveClock -= every;
        this.shave(gt.tip, gt.sample.tx, gt.sample.ty);
      }
      if (Math.random() < 0.3) this.ctx.audio.play('scratch', { gain: 0.18, pitch: 0.9, minGap: 0.08 });
    }
    if (kt.job || gt.job || kt.idle < 1.5 || gt.idle < 1.5) moving = true;
    if (this.updateSander(dt, time)) moving = true;
    if (this.dust.update(dt, time)) moving = true;
    if (this.glints.update(dt, time)) moving = true;
    if (this.updateShavings(dt)) moving = true;
    return moving;
  }

  onLayout(): void {
    for (const v of this.letters.values()) this.ctx.layout.apply(v.group, v.slot);
  }

  protected release(v: WoodVisual) {
    this.knifeCtl.cancel(v.ref.id);
    this.gougeCtl.cancel(v.ref.id);
    super.release(v);
  }

  disposeWorld(): void {
    this.sandQueue = [];
    this.sanding = null;
    this.dust.dispose();
    this.glints.dispose();
    this.shav.dispose();
    super.disposeWorld();
    for (const g of this.grooveCache.values()) g.dispose();
    this.grooveCache.clear();
    for (const d of this.disposables) d.dispose();
  }
}

export function create(ctx: WorldContext) {
  return new WoodWorld(ctx);
}

export const woodcarve: WorldModule = { create };
