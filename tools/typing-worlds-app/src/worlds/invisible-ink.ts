/**
 * WORLD 22 · Invisible Ink (隐形墨水)
 *
 * An old alchemist's desk seen from above: parchment, a glass inkwell of clear ink,
 * a candle, glassware and four reveal potions (gold / blue / bronze / fluorescent).
 * Two clearly separated stages per letter:
 *   1. WRITTEN, INVISIBLE — a quill writes the letter in stroke order with transparent
 *      ink; the paper shows a faint glossy wet trace that dries to an almost invisible
 *      latent mark.
 *   2. REVEALED — a hovering reveal lamp (heat for gold/bronze, potion mist for blue,
 *      UV for fluorescent) sweeps over the letter; the hidden writing appears locally
 *      under the sweep front, then the whole letter flushes with colour.
 * Backspace: the revealed colour drains away (the text turns invisible again), the
 * latent trace evaporates, then the letter is gone.
 * Enter: the lamp sweeps the whole word, a wax seal is pressed if it was saved, then
 * the secret fades back into the paper.
 * Reveal colour = world theme (gold / blue / bronze / fluorescent); clicking a potion
 * bottle also selects it when the host forwards pointer events.
 */
import * as THREE from 'three';
import type { DeleteEvent, InsertEvent, SaveOutcome, WorldContext, WorldModule } from '../engine/types';
import type { Slot, LayoutOptions } from '../engine/layout';
import { LetterWorld, type LetterVisual, canvasTexture, disposeObject, blobTexture } from '../engine/letter-world';
import { Particles } from '../engine/particles';
import { ToolController } from '../engine/tools';
import { clamp, damp, easeInOutCubic, easeOutCubic, lerp, rng } from '../engine/anim';

type RevealKind = 'heat' | 'potion' | 'uv';
const THEMES: Record<string, { ink: number; glow: number; light: number; kind: RevealKind; fluo: number; label: string }> = {
  gold: { ink: 0xb57a06, glow: 0xffc65a, light: 0xffa640, kind: 'heat', fluo: 0, label: 'Gold' },
  blue: { ink: 0x1f5fd6, glow: 0x7fc0ff, light: 0x79b8ff, kind: 'potion', fluo: 0, label: 'Blue' },
  bronze: { ink: 0x8a4f1f, glow: 0xe0954a, light: 0xff7a2e, kind: 'heat', fluo: 0, label: 'Bronze' },
  fluorescent: { ink: 0x8dff2e, glow: 0xd8ff7a, light: 0x8a4dff, kind: 'uv', fluo: 1, label: 'Fluorescent' },
};
const THEME_ORDER = ['gold', 'blue', 'bronze', 'fluorescent'];

const PAPER_W = 12.4;
const PAPER_D = 7.6;
const PAPER_Z = 0.35;
const INKWELL = new THREE.Vector3(-7.3, 0, 0.9);
const LAMP_REST = new THREE.Vector3(6.6, 1.5, 2.2);
const QUILL_DIR = new THREE.Vector3(0.38, 0.85, 0.36).normalize();

interface InkVisual extends LetterVisual {
  mat: THREE.ShaderMaterial;
  mesh: THREE.Mesh;
  /** 0 hidden … 1 revealed */
  revealed: number;
  queued: boolean;
}

interface RevealJob {
  v: InkVisual;
  t: number;
  dur: number;
  /** glyph-local x range */
  a: number;
  b: number;
}

const INK_VERT = /* glsl */ `
  attribute float aU; attribute float aSide;
  varying float vU; varying float vSide; varying vec2 vP;
  void main(){ vU = aU; vSide = aSide; vP = position.xy;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`;

const INK_FRAG = /* glsl */ `
  uniform float uProgress; uniform float uWet; uniform float uFront; uniform float uPulse;
  uniform float uHide; uniform float uVanish; uniform float uFluo; uniform float uSeed; uniform float uTime;
  uniform vec3 uInk; uniform vec3 uGlow;
  varying float vU; varying float vSide; varying vec2 vP;
  float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
  float vnoise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
    return mix(mix(hash(i),hash(i+vec2(1,0)),f.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x), f.y); }
  void main(){
    if (vU > uProgress) discard;
    float n = vnoise(vP * 9.0 + uSeed);
    float edge = 1.0 - smoothstep(0.55, 1.0, abs(vSide) + (n - 0.5) * 0.3);
    // stage 1: wet trace (glossy, darker parchment) drying to a latent mark
    float shine = pow(max(0.0, 1.0 - abs(vSide + 0.35) * 2.2), 3.0);
    float latentA = (0.045 + uWet * 0.26) * edge * (1.0 - uVanish);
    vec3 wetC = mix(vec3(0.42, 0.32, 0.2), vec3(1.0, 0.97, 0.9), shine * uWet * 0.7);
    // stage 2: reveal under the sweep front (noisy, local), then full
    float x = vP.x + (n - 0.5) * 0.22;
    float rv = (1.0 - smoothstep(uFront - 0.12, uFront + 0.04, x)) * (1.0 - uHide);
    float frontGlow = exp(-pow((x - uFront) * 7.0, 2.0)) * (1.0 - uHide);
    float grain = 0.85 + 0.15 * vnoise(vP * 40.0 + uSeed);
    vec3 col = mix(wetC, uInk * grain, rv);
    col += uGlow * (frontGlow * 0.9 + uPulse * 0.55 * rv);
    col += uInk * uFluo * rv * (0.55 + 0.15 * sin(uTime * 3.0 + vP.x * 4.0));
    float a = max(latentA, rv * edge * 0.96);
    a = max(a, frontGlow * edge * 0.6);
    if (a < 0.01) discard;
    gl_FragColor = vec4(col, a);
  }`;

class InvisibleInk extends LetterWorld<InkVisual> {
  private themeId: string;
  private th: (typeof THEMES)[string];
  private fx: Particles;
  private controller: ToolController;
  private quill = new THREE.Group();
  private quillBody = new THREE.Group();
  private quillDir = QUILL_DIR.clone();
  private lamp = new THREE.Group();
  private lampPos = LAMP_REST.clone();
  private lampLight: THREE.PointLight;
  private lampLens: THREE.MeshBasicMaterial;
  private spot: THREE.Mesh;
  private spotMat: THREE.MeshBasicMaterial;
  private lampPower = 0;
  private reveals: RevealJob[] = [];
  private bottles: { group: THREE.Group; liquid: THREE.MeshStandardMaterial; glow: THREE.Sprite; glowMat: THREE.SpriteMaterial; id: string }[] = [];
  private textures: THREE.Texture[] = [];
  private seals: { mesh: THREE.Mesh; mat: THREE.MeshStandardMaterial; t: number; life: number }[] = [];
  private sealTex: THREE.CanvasTexture;
  private sealGeo = new THREE.CylinderGeometry(0.34, 0.36, 0.08, 20);
  private lastAspect = 0;
  private prevLayout: LayoutOptions;
  private tmp = new THREE.Vector3();
  private tmp2 = new THREE.Vector3();
  private up = new THREE.Vector3(0, 1, 0);
  private scratchT = 0;

  constructor(ctx: WorldContext) {
    super(ctx);
    const T = THREE;
    this.themeId = THEMES[ctx.theme] ? ctx.theme : 'gold';
    this.th = THEMES[this.themeId];
    this.prevLayout = { ...ctx.layout.opts };
    ctx.layout.setOptions({ metric: 'script', size: 1.45, tracking: 0.06, maxWidth: 9.8, maxLines: 3, lineHeight: 1.3, origin: [0, 0.02, PAPER_Z - 0.1], plane: 'xz', minScale: 0.4 });

    // classic 3D Type look: near-black stage, one warm key pooled on the parchment
    ctx.scene.background = new T.Color(0x060403);
    ctx.scene.fog = new T.Fog(0x060403, 16, 34);
    this.root.add(new T.HemisphereLight(0xfff0dc, 0x1a0f08, 0.28));
    const key = new T.SpotLight(0xffeedd, 150, 0, 0.6, 0.9, 2);
    key.position.set(0.5, 12, 1.5);
    key.target.position.set(0, 0, PAPER_Z);
    this.root.add(key, key.target);

    // dark matte desk
    const desk = new T.Mesh(new T.PlaneGeometry(40, 26), new T.MeshStandardMaterial({ color: 0x0b0806, roughness: 0.9, metalness: 0 }));
    desk.rotation.x = -Math.PI / 2;
    desk.position.y = -0.02;
    this.root.add(desk);

    // parchment (slightly curled edges)
    const paperTex = canvasTexture(1024, 640, (g, w, h) => {
      g.fillStyle = '#ead6ad';
      g.fillRect(0, 0, w, h);
      const r = rng(11);
      for (let i = 0; i < 30000; i++) {
        g.fillStyle = `rgba(120,80,40,${r() * 0.05})`;
        g.fillRect(r() * w, r() * h, 2, 2);
      }
      for (let i = 0; i < 14; i++) {
        const cx = r() * w,
          cy = r() * h;
        const gr = g.createRadialGradient(cx, cy, 2, cx, cy, 60 + r() * 140);
        gr.addColorStop(0, 'rgba(150,100,50,0.10)');
        gr.addColorStop(1, 'rgba(150,100,50,0)');
        g.fillStyle = gr;
        g.fillRect(0, 0, w, h);
      }
      const edge = g.createLinearGradient(0, 0, w, 0);
      edge.addColorStop(0, 'rgba(110,70,30,0.35)');
      edge.addColorStop(0.06, 'rgba(110,70,30,0)');
      edge.addColorStop(0.94, 'rgba(110,70,30,0)');
      edge.addColorStop(1, 'rgba(110,70,30,0.35)');
      g.fillStyle = edge;
      g.fillRect(0, 0, w, h);
    });
    this.textures.push(paperTex);
    const pg = new T.PlaneGeometry(PAPER_W, PAPER_D, 24, 4);
    const pp = pg.getAttribute('position') as THREE.BufferAttribute;
    for (let i = 0; i < pp.count; i++) {
      const x = pp.getX(i) / (PAPER_W / 2);
      pp.setZ(i, Math.pow(Math.abs(x), 6) * 0.22);
    }
    pg.computeVertexNormals();
    const paper = new T.Mesh(pg, new T.MeshStandardMaterial({ map: paperTex, roughness: 0.92 }));
    paper.rotation.x = -Math.PI / 2;
    paper.position.set(0, 0.0, PAPER_Z);
    this.root.add(paper);

    const env = ctx.renderer.environment();
    const glass = new T.MeshStandardMaterial({ color: 0xd8f0ff, roughness: 0.05, metalness: 0.0, transparent: true, opacity: 0.28, envMap: env, envMapIntensity: 1.4, depthWrite: false });
    const brass = new T.MeshStandardMaterial({ color: 0xb8893a, roughness: 0.35, metalness: 0.85, envMap: env });

    // inkwell with clear ink
    const well = new T.Group();
    const wellGlass = new T.Mesh(new T.CylinderGeometry(0.55, 0.62, 0.7, 20), glass);
    wellGlass.position.y = 0.35;
    const wellInk = new T.Mesh(new T.CylinderGeometry(0.5, 0.56, 0.45, 20), new T.MeshStandardMaterial({ color: 0xbfe6ff, transparent: true, opacity: 0.35, roughness: 0.05, envMap: env }));
    wellInk.position.y = 0.25;
    const wellRim = new T.Mesh(new T.TorusGeometry(0.3, 0.05, 8, 20), brass);
    wellRim.rotation.x = Math.PI / 2;
    wellRim.position.y = 0.72;
    well.add(wellInk, wellGlass, wellRim);
    well.position.copy(INKWELL);
    this.root.add(well);

    // the four reveal potions (back right)
    const flaskGeo = new T.LatheGeometry([new T.Vector2(0, 0), new T.Vector2(0.38, 0.05), new T.Vector2(0.5, 0.35), new T.Vector2(0.42, 0.7), new T.Vector2(0.14, 0.92), new T.Vector2(0.13, 1.35), new T.Vector2(0.16, 1.4)], 16);
    const liquidGeo = new T.SphereGeometry(0.43, 16, 10, 0, Math.PI * 2, Math.PI * 0.35, Math.PI * 0.65);
    const corkMat = new T.MeshStandardMaterial({ color: 0x8a6440, roughness: 0.9 });
    const corkGeo = new T.CylinderGeometry(0.13, 0.11, 0.22, 10);
    THEME_ORDER.forEach((id, i) => {
      const g = new T.Group();
      const liquid = new T.MeshStandardMaterial({ color: THEMES[id].ink, emissive: THEMES[id].glow, emissiveIntensity: 0.15, roughness: 0.2, transparent: true, opacity: 0.85 });
      const lq = new T.Mesh(liquidGeo, liquid);
      lq.position.y = 0.42;
      const fl = new T.Mesh(flaskGeo, glass);
      const cork = new T.Mesh(corkGeo, corkMat);
      cork.position.y = 1.45;
      const glowMat = new T.SpriteMaterial({ map: blobTexture(), color: THEMES[id].glow, blending: T.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0 });
      const glow = new T.Sprite(glowMat);
      glow.position.y = 0.5;
      glow.scale.setScalar(1.8);
      g.add(lq, fl, cork, glow);
      g.position.set(3.4 + i * 1.25, 0, -4.4 + (i % 2) * 0.5);
      g.userData.themeId = id;
      this.root.add(g);
      this.bottles.push({ group: g, liquid, glow, glowMat, id });
    });

    // quill: nib tip at origin, shaft along +Y, feather vane
    const featherTex = canvasTexture(128, 512, (g, w, h) => {
      g.clearRect(0, 0, w, h);
      g.fillStyle = 'rgba(245,238,225,1)';
      g.beginPath();
      g.moveTo(w / 2, h);
      g.bezierCurveTo(w * 1.05, h * 0.7, w * 0.95, h * 0.15, w / 2, 0);
      g.bezierCurveTo(w * 0.05, h * 0.2, -w * 0.05, h * 0.7, w / 2, h);
      g.fill();
      g.strokeStyle = 'rgba(170,150,120,0.6)';
      g.lineWidth = 1;
      for (let y = 10; y < h; y += 7) {
        g.beginPath();
        g.moveTo(w / 2, y);
        g.lineTo(4, y - 26);
        g.moveTo(w / 2, y);
        g.lineTo(w - 4, y - 26);
        g.stroke();
      }
      g.strokeStyle = 'rgba(120,100,80,1)';
      g.lineWidth = 3;
      g.beginPath();
      g.moveTo(w / 2, 0);
      g.lineTo(w / 2, h);
      g.stroke();
    }, { srgb: true });
    this.textures.push(featherTex);
    const nib = new T.Mesh(new T.ConeGeometry(0.035, 0.22, 8), new T.MeshStandardMaterial({ color: 0x2a2420, metalness: 0.6, roughness: 0.3 }));
    nib.rotation.x = Math.PI;
    nib.position.y = 0.11;
    const shaft = new T.Mesh(new T.CylinderGeometry(0.022, 0.03, 2.4, 8), new T.MeshStandardMaterial({ color: 0xe8dcc4, roughness: 0.5 }));
    shaft.position.y = 1.4;
    const vane = new T.Mesh(new T.PlaneGeometry(0.62, 2.0), new T.MeshStandardMaterial({ map: featherTex, transparent: true, alphaTest: 0.3, side: T.DoubleSide, roughness: 0.8 }));
    vane.position.y = 1.75;
    vane.rotation.y = 0.5;
    this.quillBody.add(nib, shaft, vane);
    this.quill.add(this.quillBody);
    this.root.add(this.quill);

    // reveal lamp: brass ring + lens, a light spot on the paper below it
    const ring = new T.Mesh(new T.TorusGeometry(0.5, 0.06, 10, 28), brass);
    ring.rotation.x = Math.PI / 2;
    this.lampLens = new T.MeshBasicMaterial({ color: this.th.light, transparent: true, opacity: 0.5, blending: T.AdditiveBlending, depthWrite: false });
    const lens = new T.Mesh(new T.CircleGeometry(0.46, 24), this.lampLens);
    lens.rotation.x = -Math.PI / 2;
    const handle = new T.Mesh(new T.CylinderGeometry(0.04, 0.05, 1.1, 8), new T.MeshStandardMaterial({ color: 0x7a4c28, roughness: 0.5 }));
    handle.rotation.z = Math.PI / 2;
    handle.position.x = 1.0;
    const cap = new T.Mesh(new T.CylinderGeometry(0.22, 0.42, 0.28, 18, 1, true), brass);
    cap.position.y = 0.16;
    this.lamp.add(ring, lens, handle, cap);
    this.lampLight = new T.PointLight(this.th.light, 0, 5, 1.8);
    this.lampLight.position.y = -0.2;
    this.lamp.add(this.lampLight);
    this.lamp.position.copy(LAMP_REST);
    this.root.add(this.lamp);
    this.spotMat = new T.MeshBasicMaterial({ map: blobTexture(), color: this.th.light, transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false });
    this.spot = new T.Mesh(new T.PlaneGeometry(2.2, 2.2), this.spotMat);
    this.spot.rotation.x = -Math.PI / 2;
    this.spot.renderOrder = 3;
    this.root.add(this.spot);

    this.sealTex = canvasTexture(128, 128, (g, w) => {
      g.fillStyle = '#9b1c1c';
      g.fillRect(0, 0, w, w);
      g.strokeStyle = '#d24a3a';
      g.lineWidth = 6;
      g.beginPath();
      g.arc(w / 2, w / 2, w * 0.36, 0, Math.PI * 2);
      g.stroke();
      g.fillStyle = '#d24a3a';
      g.font = 'bold 56px Georgia, serif';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText('✶', w / 2, w / 2 + 2);
    });

    this.fx = new Particles({ capacity: ctx.quality === 0 ? 400 : 900, gravity: [0, 0.25, 0], drag: 1.4, size: 0.06, shape: 'dot' });
    this.root.add(this.fx.points);

    this.controller = new ToolController(ctx.glyphs, ctx.layout, {
      count: 1,
      liftHeight: 0.28,
      maxQueue: 2,
      approach: 0.16,
      rest: () => new THREE.Vector3(INKWELL.x, 0.35, INKWELL.z),
      restDelay: 1.3,
    });
    this.quill.position.copy(this.controller.tools[0].tip);
    this.applyTheme();
  }

  /* ------------------------------------------------------------ letters */

  private inkMaterial(seed: number) {
    return new THREE.ShaderMaterial({
      uniforms: {
        uProgress: { value: 0 },
        uWet: { value: 0 },
        uFront: { value: -1 },
        uPulse: { value: 0 },
        uHide: { value: 0 },
        uVanish: { value: 0 },
        uFluo: { value: this.th.fluo },
        uSeed: { value: seed },
        uTime: { value: 0 },
        uInk: { value: new THREE.Color(this.th.ink) },
        uGlow: { value: new THREE.Color(this.th.glow) },
      },
      vertexShader: INK_VERT,
      fragmentShader: INK_FRAG,
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
    });
  }

  protected createLetter(ev: InsertEvent, slot: Slot): InkVisual | null {
    if (!ev.char.trim()) return null;
    const glyph = this.ctx.glyphs.get(ev.char, 'script');
    // broad-nib quill: thick on down-right diagonals, thin on the cross
    const geo = this.ctx.glyphs.ribbon(glyph, 0.085, (_u, su, tx, ty) => (0.45 + 0.7 * Math.abs(tx * 0.707 - ty * 0.707)) * (0.75 + 0.25 * Math.sin(su * Math.PI)));
    const mat = this.inkMaterial(Math.random() * 100);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.renderOrder = 2;
    const group = new THREE.Group();
    group.add(mesh);
    this.ctx.layout.apply(group, slot);
    this.root.add(group);
    const v: InkVisual = { ref: ev, slot, object: group, state: 'creating', age: 0, mat, mesh, revealed: 0, queued: false };
    if (ev.restoring || this.ctx.reducedMotion) {
      mat.uniforms.uProgress.value = 1;
      mat.uniforms.uFront.value = glyph.advance + 1;
      v.revealed = 1;
      v.state = 'alive';
      return v;
    }
    this.controller.write({
      id: ev.id,
      glyph,
      slot,
      duration: this.ctx.tempo.duration(820, 240) * (0.6 + glyph.length * 0.12),
      onProgress: (s, tip) => {
        mat.uniforms.uProgress.value = Math.max(mat.uniforms.uProgress.value, s.u);
        mat.uniforms.uWet.value = 1;
        if (tip && s.down) {
          this.scratchT -= 1;
          if (this.scratchT <= 0) {
            this.ctx.audio.play('scratch', { pitch: 1.2 + Math.random() * 0.3, gain: 0.18, minGap: 0.08 });
            this.scratchT = 6;
          }
        }
      },
      onDone: () => this.letterWritten(v),
    });
    this.ctx.keepAlive(1600);
    return v;
  }

  /** stage 1 complete: wet trace dries to an invisible latent mark, then queue the reveal */
  private letterWritten(v: InkVisual) {
    v.mat.uniforms.uProgress.value = 1;
    if (v.state === 'creating') v.state = 'alive';
    const dry = this.ctx.tempo.duration(700, 260);
    this.tweens.add(dry, (k) => (v.mat.uniforms.uWet.value = 1 - easeOutCubic(k)));
    const hold = this.ctx.tempo.duration(380, 60);
    this.ctx.setTimeout(() => this.queueReveal(v), (dry + hold) * 1000);
  }

  private queueReveal(v: InkVisual) {
    if (v.state !== 'alive' || v.queued) return;
    v.queued = true;
    const g = this.ctx.glyphs.get(v.ref.char, 'script');
    this.reveals.push({ v, t: 0, dur: 0, a: g.bounds.minX - 0.2, b: g.bounds.maxX + 0.2 });
    this.ctx.keepAlive(1500);
  }

  protected removeLetter(v: InkVisual, ev: DeleteEvent): void {
    this.controller.cancel(v.ref.id);
    this.reveals = this.reveals.filter((j) => j.v !== v);
    const m = v.mat.uniforms;
    const quick = ev.burstSize > 3 ? 0.5 : 1;
    const hideDur = (v.revealed > 0 || m.uFront.value > -0.5 ? 0.45 : 0.05) * quick;
    // 1) revealed colour drains → invisible again
    this.tweens.add(hideDur, (k) => (m.uHide.value = easeInOutCubic(k)), {
      done: () => {
        // 2) latent trace evaporates
        this.vapour(v);
        this.tweens.add(0.45 * quick, (k) => (m.uVanish.value = k), { done: () => this.release(v) });
      },
    });
    this.ctx.audio.play('whoosh', { pitch: 1.6, gain: 0.15, minGap: 0.06 });
    this.ctx.keepAlive(1400);
  }

  private vapour(v: InkVisual) {
    const s = v.slot;
    const n = Math.round(10 * this.ctx.tempo.detail);
    for (let i = 0; i < n; i++) {
      this.ctx.layout.toWorld(s, Math.random() * (s.advance / s.size), Math.random() * 0.9, 0.05, this.tmp);
      this.fx.emit({ x: this.tmp.x, y: this.tmp.y, z: this.tmp.z, vx: (Math.random() - 0.5) * 0.15, vy: 0.3 + Math.random() * 0.4, vz: (Math.random() - 0.5) * 0.15, life: 1.0, size: 1.4, color: 0x8a7a66 });
    }
  }

  protected updateLetter(v: InkVisual, dt: number, t: number): boolean {
    v.mat.uniforms.uTime.value = t;
    if (v.state !== 'creating' && v.state !== 'alive') return false;
    const o = v.object;
    const s = v.slot;
    if (v.state === 'creating') {
      o.position.copy(s.origin);
      o.scale.setScalar(s.size);
      return true;
    }
    const d = Math.abs(o.position.x - s.origin.x) + Math.abs(o.position.z - s.origin.z) + Math.abs(o.scale.x - s.size);
    if (d < 1e-4) return false;
    o.position.x = damp(o.position.x, s.origin.x, 15, dt);
    o.position.z = damp(o.position.z, s.origin.z, 15, dt);
    o.position.y = s.origin.y;
    o.scale.setScalar(damp(o.scale.x, s.size, 15, dt));
    return true;
  }

  /* ------------------------------------------------------------- finale */

  protected playFinale(_word: string, visuals: InkVisual[], saved: Promise<SaveOutcome>): void {
    this.controller.flush();
    this.reveals = this.reveals.filter((j) => !visuals.includes(j.v));
    if (!visuals.length) return;
    let x0 = Infinity,
      x1 = -Infinity,
      z = -Infinity;
    for (const v of visuals) {
      x0 = Math.min(x0, v.slot.origin.x);
      x1 = Math.max(x1, v.slot.origin.x + v.slot.advance);
      z = Math.max(z, v.slot.origin.z);
    }
    const sweep = this.ctx.reducedMotion ? 0.3 : 0.9;
    // lamp sweeps the whole word; every letter fully reveals as it passes
    this.finaleSweep = { t: 0, dur: sweep, x0: x0 - 0.6, x1: x1 + 0.6, z: z - 0.45 * visuals[0].slot.size };
    for (const v of visuals) {
      const m = v.mat.uniforms;
      m.uProgress.value = 1;
      m.uWet.value = 0;
      const g = this.ctx.glyphs.get(v.ref.char, 'script');
      const at = ((v.slot.origin.x - (x0 - 0.6)) / (x1 - x0 + 1.2)) * sweep;
      const f0 = Math.max(m.uFront.value as number, g.bounds.minX - 0.2);
      this.tweens.add(sweep * 0.35, (k) => {
        m.uFront.value = lerp(f0, g.bounds.maxX + 0.3, k);
        m.uPulse.value = Math.sin(Math.PI * k);
      }, { delay: at });
      // the secret sinks back into the paper
      this.tweens.add(0.8, (k) => {
        m.uHide.value = easeInOutCubic(k);
        m.uVanish.value = clamp(k * 1.4 - 0.4);
      }, { delay: sweep + 1.3, done: () => this.release(v) });
    }
    Promise.all([saved, new Promise<void>((r) => this.ctx.setTimeout(r, sweep * 1000))]).then(([res]) => {
      if (res.ok) {
        this.pressSeal(x1 + 0.5, z - 0.45 * visuals[0].slot.size, 1.9);
        this.ctx.audio.play('success', { gain: 0.5 });
      } else this.ctx.audio.play('error', { gain: 0.4 });
    });
    this.ctx.audio.play('whoosh', { pitch: 0.9, gain: 0.22 });
    this.ctx.keepAlive(3200);
  }
  private finaleSweep: { t: number; dur: number; x0: number; x1: number; z: number } | null = null;

  private pressSeal(x: number, z: number, hold: number) {
    const mat = new THREE.MeshStandardMaterial({ map: this.sealTex, color: 0xffffff, roughness: 0.45, transparent: true });
    const mesh = new THREE.Mesh(this.sealGeo, mat);
    mesh.position.set(x, 0.6, z);
    this.root.add(mesh);
    this.seals.push({ mesh, mat, t: 0, life: hold + 1.0 });
    this.ctx.audio.play('thud', { pitch: 1.2, gain: 0.35 });
  }

  /* -------------------------------------------------------------- world */

  protected updateWorld(dt: number, time: number): boolean {
    let moving = false;
    this.responsive();
    if (this.fx.update(dt, time)) moving = true;
    if (this.controller.update(dt)) moving = true;

    // quill pose
    const tool = this.controller.tools[0];
    this.quill.position.copy(tool.tip);
    this.tmp2.copy(QUILL_DIR);
    if (tool.down) {
      this.tmp2.x -= clamp(tool.vel.x * 0.02, -0.2, 0.2);
      this.tmp2.z -= clamp(tool.vel.z * 0.02, -0.2, 0.2);
    } else if (tool.idle > 1.4) {
      this.tmp2.set(0.25, 0.95, -0.1); // standing in the inkwell
    }
    this.quillDir.lerp(this.tmp2.normalize(), 1 - Math.exp(-8 * dt)).normalize();
    this.quillBody.quaternion.setFromUnitVectors(this.up, this.quillDir);
    if (tool.job) moving = true;

    // reveal lamp
    let target: THREE.Vector3 | null = null;
    if (this.finaleSweep) {
      const f = this.finaleSweep;
      f.t += dt;
      const k = clamp(f.t / f.dur);
      target = this.tmp.set(lerp(f.x0, f.x1, easeInOutCubic(k)), 1.15, f.z);
      if (k >= 1) this.finaleSweep = null;
    } else if (this.reveals.length) {
      const j = this.reveals[0];
      const s = j.v.slot;
      if (j.dur === 0) j.dur = this.ctx.tempo.duration(820, 260) / (1 + (this.reveals.length - 1) * 0.6);
      // first move over the letter's left edge, then sweep
      this.ctx.layout.toWorld(s, j.a, 0.45, 1.15 / s.size, this.tmp2);
      const dist = this.lampPos.distanceTo(this.tmp2);
      if (j.t === 0 && dist > 0.15 * s.size) {
        // travelling to the next hidden letter
        this.lampPos.lerp(this.tmp2, 1 - Math.exp(-14 * dt));
        this.lampPower = damp(this.lampPower, 0.6, 8, dt);
      } else {
        j.t += dt;
        const k = clamp(j.t / j.dur);
        const fx = lerp(j.a, j.b, easeInOutCubic(k));
        j.v.mat.uniforms.uFront.value = fx;
        j.v.revealed = k;
        target = this.ctx.layout.toWorld(s, fx, 0.45, 1.15 / s.size, this.tmp);
        if (k >= 1) {
          this.reveals.shift();
          this.fullReveal(j.v);
        }
      }
      moving = true;
    }
    if (target) {
      this.lampPos.lerp(target, 1 - Math.exp(-22 * dt));
      this.lampPower = damp(this.lampPower, 1, 10, dt);
      this.emitReveal(this.lampPos);
      moving = true;
    } else if (!this.reveals.length) {
      this.lampPower = damp(this.lampPower, 0, 4, dt);
      if (this.lampPos.distanceTo(LAMP_REST) > 0.01) {
        this.lampPos.lerp(LAMP_REST, 1 - Math.exp(-3 * dt));
        moving = true;
      }
    }
    if (this.lampPower > 0.01) moving = true;
    this.lamp.position.copy(this.lampPos);
    this.lamp.position.y += Math.sin(time * 2.2) * 0.04;
    this.lampLight.intensity = this.lampPower * 6;
    this.lampLens.opacity = 0.25 + this.lampPower * 0.5;
    this.spot.position.set(this.lampPos.x, 0.03, this.lampPos.z);
    this.spotMat.opacity = this.lampPower * (this.th.kind === 'uv' ? 0.55 : 0.4);

    // potion glow: the selected reveal potion glows
    for (const b of this.bottles) {
      const on = b.id === this.themeId;
      const tgt = on ? 0.55 + this.lampPower * 0.35 : 0;
      b.glowMat.opacity = damp(b.glowMat.opacity, tgt, 6, dt);
      b.liquid.emissiveIntensity = damp(b.liquid.emissiveIntensity, on ? 0.7 : 0.12, 6, dt);
      if (Math.abs(b.glowMat.opacity - tgt) > 0.01) moving = true;
    }

    // seals
    for (let i = this.seals.length - 1; i >= 0; i--) {
      const s = this.seals[i];
      s.t += dt;
      const k = clamp(s.t / 0.25);
      s.mesh.position.y = lerp(0.6, 0.05, easeOutCubic(k));
      s.mesh.scale.setScalar(lerp(1.3, 1, k));
      s.mat.opacity = 1 - clamp((s.t - s.life + 0.5) / 0.5);
      if (s.t >= s.life) {
        disposeObject(s.mesh);
        this.seals.splice(i, 1);
      } else moving = true;
    }
    return moving;
  }

  private fullReveal(v: InkVisual) {
    const m = v.mat.uniforms;
    v.revealed = 1;
    this.tweens.add(0.55, (k) => (m.uPulse.value = Math.sin(Math.PI * k)));
    this.ctx.audio.play('chime', { pitch: this.th.kind === 'uv' ? 1.5 : 1.15, gain: 0.25, minGap: 0.06 });
  }

  private emitReveal(p: THREE.Vector3) {
    const d = this.ctx.tempo.detail * (this.ctx.quality === 0 ? 0.5 : 1);
    if (Math.random() > 0.7 * d) return;
    const k = this.th.kind;
    const x = p.x + (Math.random() - 0.5) * 0.8;
    const z = p.z + (Math.random() - 0.5) * 0.8;
    if (k === 'heat') this.fx.emit({ x, y: 0.08, z, vx: (Math.random() - 0.5) * 0.1, vy: 0.5 + Math.random() * 0.5, vz: 0, life: 0.8, size: 0.6, color: this.th.light });
    else if (k === 'potion') this.fx.emit({ x, y: p.y - 0.2, z, vx: (Math.random() - 0.5) * 0.3, vy: -0.9, vz: (Math.random() - 0.5) * 0.3, life: 0.6, size: 0.8, color: this.th.glow });
    else this.fx.emit({ x, y: 0.1, z, vx: 0, vy: 0.15, vz: 0, life: 0.5, size: 0.7, color: this.th.light });
  }

  private responsive() {
    const cam = this.ctx.camera;
    if (cam.aspect === this.lastAspect) return;
    this.lastAspect = cam.aspect;
    const ht = Math.tan(((cam.fov * Math.PI) / 180) / 2);
    const wide = 2 * ht * cam.aspect;
    const dist = clamp(13.6 / wide, 11, 24);
    cam.position.set(0, dist * 0.8, PAPER_Z + dist * 0.6);
    cam.lookAt(0, 0, PAPER_Z - 0.4);
    const maxW = clamp(wide * dist * 0.74, 4.5, 9.8);
    if (Math.abs(maxW - this.ctx.layout.opts.maxWidth) > 0.05) {
      this.ctx.layout.setOptions({ maxWidth: maxW });
      this.ctx.layout.compute(this.ctx.letters());
    }
  }

  private applyTheme() {
    const th = this.th;
    this.lampLens.color.set(th.light);
    this.lampLight.color.set(th.light);
    this.spotMat.color.set(th.light);
    const all = [...this.letters.values(), ...this.detached];
    for (const v of all) {
      v.mat.uniforms.uInk.value.set(th.ink);
      v.mat.uniforms.uGlow.value.set(th.glow);
      v.mat.uniforms.uFluo.value = th.fluo;
    }
    this.ctx.keepAlive(600);
  }

  setTheme(id: string) {
    if (!THEMES[id]) return;
    this.themeId = id;
    this.th = THEMES[id];
    this.applyTheme();
  }

  onPointer(_ndc: { x: number; y: number }, ray: THREE.Raycaster): boolean {
    for (const b of this.bottles) {
      if (ray.intersectObject(b.group, true).length) {
        this.setTheme(b.id);
        this.ctx.audio.play('bubble', { gain: 0.4 });
        return true;
      }
    }
    return false;
  }

  disposeWorld(): void {
    this.controller.flush();
    this.reveals = [];
    for (const s of this.seals) disposeObject(s.mesh);
    this.seals = [];
    this.fx.dispose();
    this.sealGeo.dispose();
    this.sealTex.dispose();
    for (const t of this.textures) t.dispose();
    super.disposeWorld();
    this.ctx.layout.setOptions(this.prevLayout);
    this.ctx.scene.fog = null;
  }
}

export function create(ctx: WorldContext) {
  return new InvisibleInk(ctx);
}

export const invisibleInk: WorldModule = { create };
