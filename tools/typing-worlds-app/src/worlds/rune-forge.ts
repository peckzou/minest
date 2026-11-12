/**
 * WORLD 21 · Rune Forge (符文熔铸)
 *
 * An underground magic forge: rough cave walls, a glowing lava channel, an old stone
 * work bench in front and an energy core (crystal + orbiting rings) on the left.
 * Per letter — two clearly separate steps, CARVING then ENERGY:
 *   1. a blank rune stone slides onto the bench;
 *   2. CARVE — a magic chisel cuts the letter groove along the real strokes in stroke
 *      order; stone dust and chips fall from the cut (fresh cut is pale);
 *   3. INFUSE — a beam from the energy core feeds the stone and energy flows along the
 *      groove from the first stroke to the last;
 *   4. the whole rune lights up (flash + halo);
 *   5. the finished stone flies into its place in the rune row.
 * Fast typing: while the bench is busy, extra stones are carved in place by the core's
 * beam (same two steps, faster) so the row never lags behind the text.
 * Enter: energy links arc from rune to rune across the word, the row flares, then the
 * stones are drawn into the core.
 * Backspace: the rune drains dark, cracks and crumbles off the row.
 */
import * as THREE from 'three';
import type { DeleteEvent, InsertEvent, SaveOutcome, WorldContext, WorldModule } from '../engine/types';
import type { Slot, LayoutOptions } from '../engine/layout';
import { LetterWorld, type LetterVisual, canvasTexture, disposeObject, gradientSky, blobTexture } from '../engine/letter-world';
import { Particles } from '../engine/particles';
import { ToolController } from '../engine/tools';
import { clamp, damp, easeInOutCubic, easeOutCubic, lerp, rng } from '../engine/anim';

const ENERGY = 0x4fd2ff;
const ENERGY_HOT = 0xd8f6ff;
const BENCH_TOP = -2.35;
const BENCH_Z = 1.7;
const BENCH_SIZE = 1.15;
const CORE_POS = new THREE.Vector3(-6.3, 0.4, -1.2);
const FLOOR_Y = -3.4;
const CHISEL_REST = new THREE.Vector3(3.6, BENCH_TOP + 0.25, BENCH_Z + 0.4);

type Phase = 'wait' | 'enter' | 'carve' | 'infuse' | 'light' | 'move' | 'done';

interface RuneVisual extends LetterVisual {
  phase: Phase;
  direct: boolean;
  t: number;
  dur: number;
  bench: Slot;
  stone: THREE.Mesh;
  groove: THREE.Mesh;
  glow: THREE.Mesh;
  mat: THREE.ShaderMaterial;
  glowMat: THREE.ShaderMaterial;
  crack: { mesh: THREE.Mesh; mat: THREE.MeshBasicMaterial } | null;
  halo: { sprite: THREE.Sprite; mat: THREE.SpriteMaterial; t: number } | null;
  adv: number;
  carveDur: number;
}

interface Link {
  mesh: THREE.Mesh;
  mat: THREE.ShaderMaterial;
}

const GROOVE_VERT = /* glsl */ `
  attribute float aU; attribute float aSide;
  varying float vU; varying float vSide; varying vec2 vP;
  void main(){ vU = aU; vSide = aSide; vP = position.xy;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`;

const GROOVE_FRAG = /* glsl */ `
  uniform float uCarve; uniform float uEnergy; uniform float uGlow; uniform float uDark; uniform float uTime;
  uniform vec3 uColor; uniform vec3 uHot;
  varying float vU; varying float vSide; varying vec2 vP;
  void main(){
    if (vU > uCarve) discard;
    float s = abs(vSide);
    // V-cut shading: dark bottom, lit upper wall, pale fresh cut near the chisel
    vec3 c = mix(vec3(0.05,0.05,0.06), vec3(0.24,0.23,0.24), smoothstep(0.1, 1.0, s) * (0.6 + 0.4 * step(0.0, vSide)));
    c += vec3(0.42,0.4,0.36) * smoothstep(0.1, 0.0, uCarve - vU) * step(uCarve, 0.999);
    float e = (1.0 - smoothstep(uEnergy - 0.03, uEnergy, vU)) * (1.0 - uDark);
    float flow = 0.8 + 0.2 * sin(vU * 40.0 - uTime * 6.0);
    float front = exp(-pow((vU - uEnergy) / 0.035, 2.0)) * step(0.001, uEnergy) * step(uEnergy, 0.999) * (1.0 - uDark);
    vec3 en = mix(uColor, uHot, 1.0 - s) * (1.1 + 0.5 * uGlow) * flow;
    gl_FragColor = vec4(mix(c, en, e) + uHot * front * 1.5, 1.0);
  }`;

const GLOW_FRAG = /* glsl */ `
  uniform float uCarve; uniform float uEnergy; uniform float uGlow; uniform float uDark;
  uniform vec3 uColor; uniform vec3 uHot;
  varying float vU; varying float vSide; varying vec2 vP;
  void main(){
    if (vU > uCarve) discard;
    float s = 1.0 - abs(vSide);
    float e = (1.0 - smoothstep(uEnergy - 0.03, uEnergy, vU)) * (1.0 - uDark);
    float front = exp(-pow((vU - uEnergy) / 0.05, 2.0)) * step(0.001, uEnergy) * step(uEnergy, 0.999) * (1.0 - uDark);
    float a = s * s * (e * 0.45 * uGlow + front * 0.9);
    if (a < 0.004) discard;
    gl_FragColor = vec4(mix(uColor, uHot, front), a);
  }`;

const LINK_FRAG = /* glsl */ `
  uniform float uProgress; uniform float uTime; uniform float uAlpha; uniform vec3 uColor;
  varying vec2 vUv;
  void main(){
    float u = vUv.x;
    if (u > uProgress) discard;
    float pulse = 0.55 + 0.45 * sin(u * 30.0 - uTime * 10.0);
    float head = exp(-pow((u - uProgress) / 0.05, 2.0));
    gl_FragColor = vec4(uColor * (0.8 + head), (pulse * 0.8 + head) * uAlpha);
  }`;

class RuneForge extends LetterWorld<RuneVisual> {
  private dust: Particles;
  private sparks: Particles;
  private controller: ToolController;
  private chisel = new THREE.Group();
  private chiselBody = new THREE.Group();
  private chiselDir = new THREE.Vector3(0.35, 0.5, 0.8).normalize();
  private chiselGlowMat: THREE.SpriteMaterial;
  private core = new THREE.Group();
  private coreCrystal: THREE.Mesh;
  private coreRings: THREE.Mesh[] = [];
  private coreLight: THREE.PointLight;
  private coreGlowMat: THREE.SpriteMaterial;
  private coreFlare = 0;
  private lavaMat: THREE.MeshBasicMaterial;
  private stoneMat: THREE.MeshStandardMaterial;
  private textures: THREE.Texture[] = [];
  private crackTex: THREE.CanvasTexture;
  private beams: { mesh: THREE.Mesh; mat: THREE.MeshBasicMaterial }[] = [];
  private beamGeo: THREE.CylinderGeometry;
  private benchRune: RuneVisual | null = null;
  private waiting: RuneVisual[] = [];
  private links: Link[] = [];
  private lastAspect = 0;
  private prevLayout: LayoutOptions;
  private tmp = new THREE.Vector3();
  private tmp2 = new THREE.Vector3();
  private up = new THREE.Vector3(0, 1, 0);
  private tapT = 0;

  constructor(ctx: WorldContext) {
    super(ctx);
    const T = THREE;
    this.prevLayout = { ...ctx.layout.opts };
    ctx.layout.setOptions({ metric: 'sans', size: 0.82, tracking: 0.62, maxWidth: 10.5, maxLines: 2, lineHeight: 2.1, origin: [0, 1.75, 0], plane: 'xy', minScale: 0.4 });

    ctx.scene.background = new T.Color(0x07080b);
    ctx.scene.fog = new T.Fog(0x0a0b10, 16, 42);
    this.root.add(gradientSky(0x0c1018, 0x050506, { horizon: 0x1a1210 }));
    this.root.add(new T.HemisphereLight(0x8fa6c8, 0x4a2a1a, 1.5));
    const key = new T.DirectionalLight(0xffe6c8, 2.2);
    key.position.set(3, 7, 10);
    this.root.add(key);
    const benchLamp = new T.PointLight(0xffb070, 14, 9, 1.4);
    benchLamp.position.set(-1.5, 0.2, 4.2);
    if (ctx.quality > 0) this.root.add(benchLamp);
    else key.intensity = 2.8;
    const forge = new T.PointLight(0xff6a2a, 16, 20, 1.6);
    forge.position.set(6.2, -2.2, -1.2);
    this.root.add(forge);

    // rock textures
    const rockTex = canvasTexture(256, 256, (g, w, h) => {
      g.fillStyle = '#a29c95';
      g.fillRect(0, 0, w, h);
      const r = rng(21);
      for (let i = 0; i < 9000; i++) {
        const v = 110 + r() * 90;
        g.fillStyle = `rgba(${v},${v - 4},${v - 8},${0.35})`;
        g.fillRect(r() * w, r() * h, 1 + r() * 3, 1 + r() * 3);
      }
      g.strokeStyle = 'rgba(25,22,20,0.5)';
      for (let i = 0; i < 14; i++) {
        g.lineWidth = 0.5 + r();
        g.beginPath();
        let x = r() * w,
          y = r() * h;
        g.moveTo(x, y);
        for (let k = 0; k < 5; k++) g.lineTo((x += (r() - 0.5) * 50), (y += (r() - 0.5) * 50));
        g.stroke();
      }
    });
    rockTex.wrapS = rockTex.wrapT = T.RepeatWrapping;
    this.textures.push(rockTex);
    const caveMat = new T.MeshStandardMaterial({ map: rockTex, color: 0x4c4642, roughness: 0.95, flatShading: true });
    const floor = new T.Mesh(new T.PlaneGeometry(50, 30), new T.MeshStandardMaterial({ map: rockTex, color: 0x4a4542, roughness: 1 }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = FLOOR_Y;
    this.root.add(floor);
    const wall = new T.Mesh(new T.PlaneGeometry(60, 26, 30, 13), caveMat);
    const wp = wall.geometry.getAttribute('position') as THREE.BufferAttribute;
    const rr = rng(5);
    for (let i = 0; i < wp.count; i++) wp.setZ(i, (rr() - 0.5) * 1.6);
    wall.geometry.computeVertexNormals();
    wall.position.set(0, 4, -8);
    this.root.add(wall);
    const boulderGeo = new T.DodecahedronGeometry(1, 0);
    for (let i = 0; i < 9; i++) {
      const b = new T.Mesh(boulderGeo, caveMat);
      const side = i % 2 ? 1 : -1;
      b.position.set(side * (7.5 + rr() * 5), FLOOR_Y + 0.3 + rr() * 0.5, -1 - rr() * 6);
      b.scale.set(0.8 + rr() * 1.6, 0.6 + rr() * 1.4, 0.8 + rr() * 1.4);
      b.rotation.set(rr() * 3, rr() * 3, rr() * 3);
      this.root.add(b);
    }
    // forge hearth (right): glowing coals in a stone ring
    this.lavaMat = new T.MeshBasicMaterial({ color: 0xff5a1a });
    const coals = new T.Mesh(new T.CircleGeometry(1.1, 18), this.lavaMat);
    coals.rotation.x = -Math.PI / 2;
    coals.position.set(6.2, FLOOR_Y + 0.45, -1.6);
    const hearth = new T.Mesh(new T.TorusGeometry(1.2, 0.3, 6, 14), caveMat);
    hearth.rotation.x = -Math.PI / 2;
    hearth.position.set(6.2, FLOOR_Y + 0.4, -1.6);
    this.root.add(coals, hearth);

    // stone bench
    this.stoneMat = new T.MeshStandardMaterial({ map: rockTex, color: 0xd8d0c4, roughness: 0.9, flatShading: true });
    const benchMat = new T.MeshStandardMaterial({ map: rockTex, color: 0x8a8279, roughness: 0.95, flatShading: true });
    const top = new T.Mesh(new T.BoxGeometry(6.4, 0.5, 2.4), benchMat);
    top.position.set(0, BENCH_TOP - 0.25, BENCH_Z - 0.3);
    const legGeo = new T.BoxGeometry(0.9, FLOOR_Y * -1 + BENCH_TOP - 0.5, 1.8);
    for (const x of [-2.4, 2.4]) {
      const leg = new T.Mesh(legGeo, benchMat);
      leg.position.set(x, (BENCH_TOP - 0.5 + FLOOR_Y) / 2, BENCH_Z - 0.3);
      this.root.add(leg);
    }
    this.root.add(top);

    // energy core: pedestal + crystal + rings
    const ped = new T.Mesh(new T.CylinderGeometry(0.8, 1.1, CORE_POS.y - FLOOR_Y - 1.1, 8), benchMat);
    ped.position.set(CORE_POS.x, (CORE_POS.y - 1.1 + FLOOR_Y) / 2, CORE_POS.z);
    this.root.add(ped);
    this.coreCrystal = new T.Mesh(new T.IcosahedronGeometry(0.55, 0), new T.MeshStandardMaterial({ color: 0x9fe8ff, emissive: ENERGY, emissiveIntensity: 1.4, roughness: 0.2, flatShading: true }));
    this.core.add(this.coreCrystal);
    const ringMat = new T.MeshStandardMaterial({ color: 0x8a6a3a, metalness: 0.8, roughness: 0.35, emissive: 0x112233 });
    for (let i = 0; i < 2; i++) {
      const ring = new T.Mesh(new T.TorusGeometry(0.95 + i * 0.25, 0.04, 8, 40), ringMat);
      this.coreRings.push(ring);
      this.core.add(ring);
    }
    this.coreGlowMat = new T.SpriteMaterial({ map: blobTexture(), color: ENERGY, blending: T.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.6 });
    const cg = new T.Sprite(this.coreGlowMat);
    cg.scale.setScalar(3.2);
    this.core.add(cg);
    this.coreLight = new T.PointLight(ENERGY, 8, 12, 1.6);
    this.core.add(this.coreLight);
    this.core.position.copy(CORE_POS);
    this.root.add(this.core);

    // magic chisel: tip at origin, body along +Y
    const steel = new T.MeshStandardMaterial({ color: 0xb8c0c8, metalness: 0.9, roughness: 0.3 });
    const blade = new T.Mesh(new T.CylinderGeometry(0.05, 0.012, 0.75, 4), steel);
    blade.position.y = 0.38;
    const ferrule = new T.Mesh(new T.CylinderGeometry(0.075, 0.075, 0.1, 10), new T.MeshStandardMaterial({ color: 0x9a7a3a, metalness: 0.85, roughness: 0.35 }));
    ferrule.position.y = 0.8;
    const handle = new T.Mesh(new T.CylinderGeometry(0.08, 0.065, 0.75, 10), new T.MeshStandardMaterial({ color: 0x4a2e1a, roughness: 0.7 }));
    handle.position.y = 1.22;
    const rune = new T.Mesh(new T.TorusGeometry(0.085, 0.012, 6, 16), new T.MeshBasicMaterial({ color: ENERGY }));
    rune.rotation.x = Math.PI / 2;
    rune.position.y = 1.05;
    this.chiselBody.add(blade, ferrule, handle, rune);
    this.chisel.add(this.chiselBody);
    this.chiselGlowMat = new T.SpriteMaterial({ map: blobTexture(), color: ENERGY, blending: T.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0 });
    const tipGlow = new T.Sprite(this.chiselGlowMat);
    tipGlow.scale.setScalar(0.45);
    this.chisel.add(tipGlow);
    this.chisel.position.copy(CHISEL_REST);
    this.root.add(this.chisel);

    // beams (pooled)
    this.beamGeo = new T.CylinderGeometry(0.035, 0.035, 1, 6, 1, true);
    this.beamGeo.translate(0, 0.5, 0);
    for (let i = 0; i < 6; i++) {
      const mat = new T.MeshBasicMaterial({ color: ENERGY_HOT, transparent: true, opacity: 0.8, blending: T.AdditiveBlending, depthWrite: false });
      const mesh = new T.Mesh(this.beamGeo, mat);
      mesh.visible = false;
      mesh.frustumCulled = false;
      this.root.add(mesh);
      this.beams.push({ mesh, mat });
    }

    this.crackTex = canvasTexture(128, 160, (g, w, h) => {
      g.clearRect(0, 0, w, h);
      g.strokeStyle = 'rgba(10,8,6,0.95)';
      g.lineCap = 'round';
      const r = rng(9);
      const branch = (x: number, y: number, dx: number, len: number, lw: number) => {
        g.lineWidth = lw;
        g.beginPath();
        g.moveTo(x, y);
        for (let i = 0; i < len; i++) {
          x += dx * 8 + (r() - 0.5) * 14;
          y += 10 + r() * 6;
          g.lineTo(x, y);
          if (r() < 0.25 && lw > 1.5) {
            g.stroke();
            branch(x, y, (r() - 0.5) * 2, 4, lw * 0.55);
            g.lineWidth = lw;
            g.beginPath();
            g.moveTo(x, y);
          }
        }
        g.stroke();
      };
      branch(w * 0.55, 0, -0.2, 15, 4);
    });

    this.dust = new Particles({ capacity: ctx.quality === 0 ? 500 : 1000, gravity: [0, -5, 0], drag: 0.6, size: 0.05, shape: 'flake', blending: THREE.NormalBlending, floor: BENCH_TOP + 0.01 });
    this.sparks = new Particles({ capacity: 600, gravity: [0, -1.2, 0], drag: 1.4, size: 0.05, shape: 'spark' });
    this.root.add(this.dust.points, this.sparks.points);

    this.controller = new ToolController(ctx.glyphs, ctx.layout, {
      count: 1,
      liftHeight: 0.35,
      maxQueue: 3,
      approach: 0.18,
      rest: () => CHISEL_REST.clone(),
      restDelay: 0.8,
    });
  }

  /* ------------------------------------------------------------ letters */

  private makeStone(adv: number) {
    const w = adv + 0.5;
    const geo = new THREE.BoxGeometry(w, 1.7, 0.42, 3, 4, 1);
    const p = geo.getAttribute('position') as THREE.BufferAttribute;
    // deterministic per-position noise so duplicated face vertices stay welded
    const h = (x: number, y: number, z: number, k: number) => {
      const v = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719 + k * 4.1 + adv * 9.7) * 43758.5453;
      return v - Math.floor(v);
    };
    for (let i = 0; i < p.count; i++) {
      // chip the edges, keep the carving face flat
      const x = p.getX(i),
        y = p.getY(i),
        z = p.getZ(i);
      const edge = Math.abs(x) > w / 2 - 1e-3 || Math.abs(y) > 0.849;
      if (edge) {
        p.setX(i, x * (0.95 + h(x, y, 0, 1) * 0.07));
        p.setY(i, y * (0.95 + h(x, y, 0, 2) * 0.06));
      }
      if (z < 0) p.setZ(i, z * (0.9 + h(x, y, z, 3) * 0.3));
    }
    geo.computeVertexNormals();
    geo.translate(adv / 2, 0.45, -0.215);
    return geo;
  }

  private grooveMats() {
    const uniforms = {
      uCarve: { value: 0 },
      uEnergy: { value: 0 },
      uGlow: { value: 1 },
      uDark: { value: 0 },
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(ENERGY) },
      uHot: { value: new THREE.Color(ENERGY_HOT) },
    };
    const mat = new THREE.ShaderMaterial({ uniforms, vertexShader: GROOVE_VERT, fragmentShader: GROOVE_FRAG, polygonOffset: true, polygonOffsetFactor: -2 });
    const glowMat = new THREE.ShaderMaterial({ uniforms, vertexShader: GROOVE_VERT, fragmentShader: GLOW_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    return { mat, glowMat };
  }

  protected createLetter(ev: InsertEvent, slot: Slot): RuneVisual | null {
    if (!ev.char.trim()) return null;
    const glyph = this.ctx.glyphs.get(ev.char, 'sans');
    const adv = glyph.advance;
    const group = new THREE.Group();
    const stone = new THREE.Mesh(this.makeStone(adv), this.stoneMat);
    const { mat, glowMat } = this.grooveMats();
    const groove = new THREE.Mesh(this.ctx.glyphs.ribbon(glyph, 0.09), mat);
    groove.position.z = 0.004;
    const glow = new THREE.Mesh(this.ctx.glyphs.ribbon(glyph, 0.34), glowMat);
    glow.position.z = 0.01;
    glow.renderOrder = 3;
    group.add(stone, groove, glow);
    this.root.add(group);
    const bench: Slot = {
      id: -ev.id,
      index: 0,
      char: ev.char,
      line: 0,
      origin: new THREE.Vector3((-adv * BENCH_SIZE) / 2, BENCH_TOP + 0.42 * BENCH_SIZE, BENCH_Z),
      center: new THREE.Vector3(0, BENCH_TOP + 0.95 * BENCH_SIZE, BENCH_Z),
      size: BENCH_SIZE,
      advance: adv * BENCH_SIZE,
      plane: 'xy',
    };
    const v: RuneVisual = {
      ref: ev,
      slot,
      object: group,
      state: 'creating',
      age: 0,
      phase: 'wait',
      direct: false,
      t: 0,
      dur: 0,
      bench,
      stone,
      groove,
      glow,
      mat,
      glowMat,
      crack: null,
      halo: null,
      adv,
      carveDur: this.ctx.tempo.duration(1100, 380) * (0.6 + glyph.length * 0.12),
    };
    if (ev.restoring || this.ctx.reducedMotion) {
      mat.uniforms.uCarve.value = 1;
      mat.uniforms.uEnergy.value = 1;
      v.phase = 'done';
      v.state = 'alive';
      this.ctx.layout.apply(group, slot);
      return v;
    }
    const busy = !!this.benchRune || this.waiting.length > 0;
    if (busy && (this.waiting.length >= 1 || this.ctx.tempo.tempo === 'fast')) {
      // carved in place by the core's beam
      v.direct = true;
      this.ctx.layout.apply(group, slot);
      group.scale.setScalar(0.001);
      this.setPhase(v, 'enter', 0.22);
    } else {
      group.visible = false;
      this.waiting.push(v);
    }
    this.ctx.keepAlive(2500);
    return v;
  }

  private setPhase(v: RuneVisual, phase: Phase, dur = 0) {
    v.phase = phase;
    v.t = 0;
    v.dur = dur;
    if (phase === 'carve' && !v.direct) {
      const glyph = this.ctx.glyphs.get(v.ref.char, 'sans');
      this.controller.write({
        id: v.ref.id,
        glyph,
        slot: v.bench,
        duration: v.carveDur,
        onProgress: (s, tip) => {
          v.mat.uniforms.uCarve.value = Math.max(v.mat.uniforms.uCarve.value, s.u);
          if (tip && s.down) this.chips(tip, 1);
        },
        onDone: () => {
          v.mat.uniforms.uCarve.value = 1;
          if (v.phase === 'carve') this.setPhase(v, 'infuse', this.ctx.tempo.duration(700, 280));
        },
      });
    }
    if (phase === 'infuse') this.ctx.audio.play('hum', { pitch: 1.3, gain: 0.3, minGap: 0.08 });
    if (phase === 'light') {
      this.ctx.audio.play('chime', { pitch: 0.85 + Math.random() * 0.2, gain: 0.35, minGap: 0.06 });
      const hm = new THREE.SpriteMaterial({ map: blobTexture(), color: ENERGY, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0 });
      const halo = new THREE.Sprite(hm);
      halo.position.set(v.adv / 2, 0.5, 0.1);
      v.object.add(halo);
      v.halo = { sprite: halo, mat: hm, t: 0 };
    }
    if (phase === 'move' && this.benchRune === v) this.benchRune = null;
  }

  private chips(p: THREE.Vector3, scale: number) {
    const d = this.ctx.tempo.detail * (this.ctx.quality === 0 ? 0.5 : 1);
    if (Math.random() < 0.8 * d) {
      this.dust.emit({ x: p.x, y: p.y, z: p.z + 0.04, vx: (Math.random() - 0.5) * 0.6, vy: Math.random() * 0.5, vz: 0.3 + Math.random() * 0.6, life: 0.9 + Math.random() * 0.6, size: (0.5 + Math.random() * 0.6) * scale, color: 0xb9b2a8 });
    }
    if (Math.random() < 0.3 * d) {
      // chips: bigger, darker, bouncier
      this.dust.emit({ x: p.x, y: p.y, z: p.z + 0.05, vx: (Math.random() - 0.5) * 1.6, vy: 0.8 + Math.random() * 1.2, vz: 0.4 + Math.random() * 0.8, life: 1.2, size: (1.6 + Math.random() * 1.2) * scale, color: 0x6d675f });
    }
    if (Math.random() < 0.25 * d) this.sparks.emit({ x: p.x, y: p.y, z: p.z + 0.05, vx: (Math.random() - 0.5) * 1.5, vy: Math.random() * 1.5, vz: Math.random(), life: 0.3, size: 0.7, color: ENERGY_HOT });
    this.tapT -= 1;
    if (this.tapT <= 0) {
      this.ctx.audio.play('tick', { pitch: 0.7 + Math.random() * 0.3, gain: 0.22, minGap: 0.06 });
      this.tapT = 5;
    }
  }

  protected removeLetter(v: RuneVisual, ev: DeleteEvent): void {
    this.controller.cancel(v.ref.id);
    this.waiting = this.waiting.filter((w) => w !== v);
    if (this.benchRune === v) this.benchRune = null;
    if (!v.object.visible) {
      this.release(v);
      return;
    }
    const quick = ev.burstSize > 3 ? 0.5 : 1;
    v.phase = 'done';
    const m = v.mat.uniforms;
    const e0 = m.uEnergy.value as number;
    // 1) energy drains back out (dark)
    this.tweens.add(0.3 * quick, (k) => {
      m.uEnergy.value = e0 * (1 - k);
      m.uDark.value = k;
    }, {
      done: () => {
        // 2) crack
        const cm = new THREE.MeshBasicMaterial({ map: this.crackTex, transparent: true, opacity: 0, depthWrite: false });
        const crack = new THREE.Mesh(new THREE.PlaneGeometry(v.adv + 0.45, 1.65), cm);
        crack.position.set(v.adv / 2, 0.45, 0.02);
        crack.renderOrder = 4;
        v.object.add(crack);
        v.crack = { mesh: crack, mat: cm };
        this.ctx.audio.play('crack', { pitch: 0.9 + Math.random() * 0.2, gain: 0.45 });
        const p0 = v.object.position.clone();
        const s0 = v.object.scale.x;
        this.tweens.add(0.18 * quick, (k) => (cm.opacity = k), {
          done: () => {
            // 3) crumble and fall
            this.tweens.add(0.6 * quick, (k) => {
              const e = k * k;
              v.object.position.set(p0.x + Math.sin(k * 60) * 0.03 * (1 - k), p0.y - e * 2.6, p0.z + e * 0.5);
              v.object.rotation.z = e * 0.5;
              v.object.scale.setScalar(s0 * (1 - e * 0.6));
              if (Math.random() < 0.7) {
                v.object.getWorldPosition(this.tmp);
                this.tmp.x += Math.random() * v.adv * s0;
                this.chips(this.tmp, 1.2);
              }
            }, { done: () => this.release(v) });
          },
        });
      },
    });
    this.ctx.audio.play('zap', { pitch: 0.5, gain: 0.2 });
    this.ctx.keepAlive(1600);
  }

  protected updateLetter(v: RuneVisual, dt: number, t: number): boolean {
    v.mat.uniforms.uTime.value = t;
    let moving = true;
    const m = v.mat.uniforms;
    if (v.halo) {
      const h = v.halo;
      h.t += dt;
      const k = clamp(h.t / 0.7);
      h.sprite.scale.setScalar(lerp(0.8, 3.2, easeOutCubic(k)));
      h.mat.opacity = (1 - k) * 0.85;
      if (k >= 1) {
        h.sprite.removeFromParent(); // sprite geometry is three.js-global: only drop the material
        h.mat.dispose();
        v.halo = null;
      }
    }
    if (v.state === 'removing' || v.state === 'finale') return true;
    v.t += dt;
    const k = v.dur > 0 ? clamp(v.t / v.dur) : 1;
    const o = v.object;
    switch (v.phase) {
      case 'wait':
        if (!this.benchRune && this.waiting[0] === v) {
          this.waiting.shift();
          this.benchRune = v;
          o.visible = true;
          this.setPhase(v, 'enter', this.ctx.tempo.duration(420, 200));
          this.ctx.audio.play('thud', { pitch: 0.8, gain: 0.3 });
        }
        break;
      case 'enter':
        if (v.direct) {
          this.ctx.layout.apply(o, v.slot);
          o.scale.setScalar(v.slot.size * easeOutCubic(k));
          if (k >= 1) this.setPhase(v, 'carve', v.carveDur * 0.55);
        } else {
          this.ctx.layout.apply(o, v.bench);
          o.position.x += (1 - easeOutCubic(k)) * 5;
          o.position.y += Math.abs(Math.sin(k * Math.PI * 2)) * (1 - k) * 0.15;
          if (k >= 1) this.setPhase(v, 'carve');
        }
        break;
      case 'carve':
        if (v.direct) {
          this.ctx.layout.apply(o, v.slot);
          m.uCarve.value = k;
          if (Math.random() < 0.5) {
            const pt = this.pointAt(v, k);
            if (pt) this.chips(this.ctx.layout.toWorld(v.slot, pt.x, pt.y, 0.05, this.tmp), 0.7);
          }
          if (k >= 1) this.setPhase(v, 'infuse', this.ctx.tempo.duration(600, 240));
        } else {
          this.ctx.layout.apply(o, v.bench);
        }
        break;
      case 'infuse':
        m.uEnergy.value = easeInOutCubic(k);
        if (k >= 1) this.setPhase(v, 'light', 0.4);
        break;
      case 'light':
        m.uGlow.value = 1 + Math.sin(Math.PI * k) * 1.8;
        if (k >= 1) {
          if (v.direct) {
            this.setPhase(v, 'done');
            v.state = 'alive';
          } else this.setPhase(v, 'move', this.ctx.tempo.duration(650, 320));
        }
        break;
      case 'move': {
        const e = easeInOutCubic(k);
        const a = v.bench.origin;
        const b = v.slot.origin;
        o.position.set(lerp(a.x, b.x, e), lerp(a.y, b.y, e) + Math.sin(Math.PI * e) * 0.9, lerp(a.z, b.z, e) + Math.sin(Math.PI * e) * 0.8);
        o.scale.setScalar(lerp(v.bench.size, v.slot.size, e));
        o.rotation.y = Math.sin(Math.PI * e) * 0.35;
        if (k >= 1) {
          o.rotation.y = 0;
          this.setPhase(v, 'done');
          v.state = 'alive';
          this.ctx.audio.play('thud', { pitch: 1.3, gain: 0.25 });
        }
        break;
      }
      case 'done': {
        const s = v.slot;
        const dx = s.origin.x - o.position.x;
        const dy = s.origin.y - o.position.y;
        if (Math.abs(dx) + Math.abs(dy) + Math.abs(o.scale.x - s.size) > 1e-4) {
          o.position.x = damp(o.position.x, s.origin.x, 12, dt);
          o.position.y = damp(o.position.y, s.origin.y, 12, dt);
          o.position.z = s.origin.z;
          o.scale.setScalar(damp(o.scale.x, s.size, 12, dt));
        } else moving = !!v.halo;
        break;
      }
    }
    return moving;
  }

  private evenCache = new Map<string, import('../engine/glyphs/glyph-engine').EvenPoint[]>();
  private pointAt(v: RuneVisual, u: number) {
    let pts = this.evenCache.get(v.ref.char);
    if (!pts) {
      pts = this.ctx.glyphs.evenPoints(this.ctx.glyphs.get(v.ref.char, 'sans'), 0.06);
      this.evenCache.set(v.ref.char, pts);
    }
    if (!pts.length) return null;
    let lo = 0,
      hi = pts.length - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (pts[mid].u < u) lo = mid;
      else hi = mid;
    }
    return pts[hi];
  }

  /* ------------------------------------------------------------- finale */

  protected playFinale(_word: string, visuals: RuneVisual[], saved: Promise<SaveOutcome>): void {
    this.controller.flush();
    this.waiting = this.waiting.filter((w) => !visuals.includes(w));
    if (this.benchRune && visuals.includes(this.benchRune)) this.benchRune = null;
    if (!visuals.length) return;
    // finish every rune and put it in its row place
    for (const v of visuals) {
      if (!v.object.visible) this.ctx.layout.apply(v.object, v.slot);
      v.object.visible = true;
      v.phase = 'done';
      v.mat.uniforms.uCarve.value = 1;
      v.mat.uniforms.uEnergy.value = 1;
      v.object.rotation.set(0, 0, 0);
    }
    const settle = 0.35;
    const from = visuals.map((v) => ({ p: v.object.position.clone(), s: v.object.scale.x }));
    this.tweens.add(settle, (k) => {
      const e = easeOutCubic(k);
      visuals.forEach((v, i) => {
        v.object.position.lerpVectors(from[i].p, v.slot.origin, e);
        v.object.scale.setScalar(lerp(from[i].s, v.slot.size, e));
      });
    });
    // energy links rune → rune
    const centers = visuals.map((v) => new THREE.Vector3(v.slot.origin.x + (v.adv * v.slot.size) / 2, v.slot.origin.y + 0.45 * v.slot.size, v.slot.origin.z + 0.1));
    const per = this.ctx.reducedMotion ? 0.08 : 0.2;
    for (let i = 0; i < centers.length - 1; i++) {
      const a = centers[i],
        b = centers[i + 1];
      const mid = a.clone().add(b).multiplyScalar(0.5);
      mid.y += 0.35 + a.distanceTo(b) * 0.12;
      mid.z += 0.3;
      const geo = new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(a, mid, b), 24, 0.045, 6, false);
      const mat = new THREE.ShaderMaterial({
        uniforms: { uProgress: { value: 0 }, uTime: { value: 0 }, uAlpha: { value: 1 }, uColor: { value: new THREE.Color(ENERGY_HOT) } },
        vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0);} `,
        fragmentShader: LINK_FRAG,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.renderOrder = 5;
      this.root.add(mesh);
      const link: Link = { mesh, mat };
      this.links.push(link);
      this.tweens.add(per, (k) => (mat.uniforms.uProgress.value = k), {
        delay: settle + i * per,
        done: () => {
          this.ctx.audio.play('zap', { pitch: 1.2 + i * 0.08, gain: 0.25, minGap: 0.04 });
          const v = visuals[i + 1];
          this.tweens.add(0.4, (q) => (v.mat.uniforms.uGlow.value = 1 + Math.sin(Math.PI * q) * 1.6));
        },
      });
    }
    this.tweens.add(0.4, (q) => (visuals[0].mat.uniforms.uGlow.value = 1 + Math.sin(Math.PI * q) * 1.6), { delay: settle });
    const linked = settle + Math.max(0, centers.length - 1) * per + 0.15;
    // whole word flare
    this.tweens.add(0.6, (k) => {
      for (const v of visuals) v.mat.uniforms.uGlow.value = 1 + Math.sin(Math.PI * k) * 2.2;
    }, { delay: linked });
    saved.then((res) => {
      if (res.ok) this.ctx.audio.play('success', { gain: 0.55 });
      else this.ctx.audio.play('error', { gain: 0.4 });
    });
    // drawn into the core
    const absorb = linked + 0.75;
    const starts: { p: THREE.Vector3; s: number }[] = [];
    visuals.forEach((v, i) => {
      this.tweens.add(
        0.7,
        (k) => {
          if (!starts[i]) starts[i] = { p: v.object.position.clone(), s: v.object.scale.x };
          const e = easeInOutCubic(k);
          v.object.position.lerpVectors(starts[i].p, CORE_POS, e);
          v.object.position.y += Math.sin(Math.PI * e) * 1.2;
          v.object.scale.setScalar(starts[i].s * (1 - e * 0.92));
        },
        {
          delay: absorb + i * 0.06,
          done: () => {
            this.coreFlare = 1;
            this.release(v);
          },
        }
      );
    });
    this.tweens.add(0.5, (k) => {
      for (const l of this.links) l.mat.uniforms.uAlpha.value = Math.min(l.mat.uniforms.uAlpha.value, 1 - k);
    }, {
      delay: absorb,
      done: () => {
        for (const l of this.links) disposeObject(l.mesh);
        this.links = [];
      },
    });
    this.ctx.keepAlive((absorb + 1.4) * 1000);
  }

  /* -------------------------------------------------------------- world */

  protected updateWorld(dt: number, time: number): boolean {
    let moving = false;
    this.responsive();
    if (this.dust.update(dt, time)) moving = true;
    if (this.sparks.update(dt, time)) moving = true;
    if (this.controller.update(dt)) moving = true;
    for (const l of this.links) l.mat.uniforms.uTime.value = time;

    // chisel: follows the carving tool; hammer-tap vibration while cutting
    const tool = this.controller.tools[0];
    this.chisel.position.copy(tool.tip);
    if (tool.down) {
      const tap = Math.max(0, Math.sin(time * 70)) * 0.03;
      this.chisel.position.addScaledVector(this.chiselDir, tap);
    }
    this.tmp2.set(0.35, 0.5, 0.8);
    if (tool.idle > 1.0) this.tmp2.set(1, 0.08, 0.2); // lying on the bench
    this.chiselDir.lerp(this.tmp2.normalize(), 1 - Math.exp(-8 * dt)).normalize();
    this.chiselBody.quaternion.setFromUnitVectors(this.up, this.chiselDir);
    this.chiselGlowMat.opacity = damp(this.chiselGlowMat.opacity, tool.down ? 0.9 : 0, 12, dt);
    if (tool.job || this.chiselGlowMat.opacity > 0.01) moving = true;

    // beams from the core to every stone being infused or beam-carved
    let bi = 0;
    for (const v of this.letters.values()) {
      if (bi >= this.beams.length) break;
      const carving = v.direct && v.phase === 'carve';
      if (v.phase !== 'infuse' && !carving) continue;
      const b = this.beams[bi++];
      const s = v.direct ? v.slot : v.bench;
      if (carving) {
        const pt = this.pointAt(v, v.mat.uniforms.uCarve.value as number);
        this.ctx.layout.toWorld(s, pt ? pt.x : v.adv / 2, pt ? pt.y : 0.5, 0, this.tmp);
      } else this.ctx.layout.toWorld(s, v.adv / 2, 0.5, 0.1, this.tmp);
      this.tmp2.subVectors(this.tmp, CORE_POS);
      const len = this.tmp2.length();
      b.mesh.visible = true;
      b.mesh.position.copy(CORE_POS);
      b.mesh.quaternion.setFromUnitVectors(this.up, this.tmp2.normalize());
      b.mesh.scale.set(1 + Math.sin(time * 40 + bi) * 0.4, len, 1 + Math.sin(time * 40 + bi) * 0.4);
      b.mat.opacity = 0.55 + Math.random() * 0.35;
      if (Math.random() < 0.5) this.sparks.emit({ x: this.tmp.x, y: this.tmp.y, z: this.tmp.z + 0.05, vx: (Math.random() - 0.5), vy: Math.random(), vz: Math.random() * 0.5, life: 0.35, size: 0.8, color: ENERGY_HOT });
      moving = true;
    }
    for (; bi < this.beams.length; bi++) this.beams[bi].mesh.visible = false;

    // core: rotate, pulse, flare when it absorbs runes
    this.coreFlare = damp(this.coreFlare, 0, 3, dt);
    const busy = !!this.benchRune || this.waiting.length > 0 || this.coreFlare > 0.01;
    this.coreCrystal.rotation.y += dt * (0.6 + this.coreFlare * 4);
    this.coreCrystal.rotation.x += dt * 0.3;
    this.coreRings[0].rotation.x = time * 0.9;
    this.coreRings[0].rotation.y = time * 0.4;
    this.coreRings[1].rotation.y = -time * 0.7;
    this.coreRings[1].rotation.z = time * 0.5;
    const pulse = 0.5 + 0.5 * Math.sin(time * 3);
    this.coreLight.intensity = 6 + pulse * 2 + this.coreFlare * 14;
    this.coreGlowMat.opacity = 0.45 + pulse * 0.15 + this.coreFlare * 0.4;
    this.core.scale.setScalar(1 + this.coreFlare * 0.25);
    this.lavaMat.color.setRGB(1, 0.33 + Math.sin(time * 1.3) * 0.05, 0.1);
    if (busy) moving = true;
    return moving;
  }

  private responsive() {
    const cam = this.ctx.camera;
    if (cam.aspect === this.lastAspect) return;
    this.lastAspect = cam.aspect;
    const ht = Math.tan(((cam.fov * Math.PI) / 180) / 2);
    const wide = 2 * ht * cam.aspect;
    const dist = clamp(15 / wide, 12.5, 26);
    cam.position.set(0, 0.6, dist);
    cam.lookAt(0, -0.2, 0);
    const maxW = clamp(wide * dist * 0.82, 4.5, 10.5);
    if (Math.abs(maxW - this.ctx.layout.opts.maxWidth) > 0.05) {
      this.ctx.layout.setOptions({ maxWidth: maxW });
      this.ctx.layout.compute(this.ctx.letters());
    }
  }

  disposeWorld(): void {
    this.controller.flush();
    this.waiting = [];
    this.benchRune = null;
    for (const l of this.links) disposeObject(l.mesh);
    this.links = [];
    this.dust.dispose();
    this.sparks.dispose();
    this.beamGeo.dispose();
    this.crackTex.dispose();
    for (const t of this.textures) t.dispose();
    super.disposeWorld();
    this.ctx.layout.setOptions(this.prevLayout);
    this.ctx.scene.fog = null;
  }
}

export function create(ctx: WorldContext) {
  return new RuneForge(ctx);
}

export const runeForge: WorldModule = { create };
