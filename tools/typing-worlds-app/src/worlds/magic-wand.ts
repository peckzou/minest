/**
 * WORLD 19 · Magic Wand (魔法棒)
 *
 * A minimal near-black stage: a dark floor with one faint, slowly turning sigil.
 * Per letter:
 *   1. aim    — the wand lifts and swings to the letter's first stroke; sparks gather
 *               at its tip (charge) while it travels.
 *   2. trace  — the wand tip really moves along the letter strokes in stroke order,
 *               leaving a thin white-hot glowing trail + sparks.
 *   3. form   — when the last stroke ends the trail swells into a solid crystal 3D
 *               letter (tube inflates in the vertex shader).
 *   4. seal   — a short-lived rotating magic sigil and a halo flash behind the letter.
 * Typing speed changes the wand rhythm (aim/trace durations follow TempoTracker;
 * queued letters are ghost-written so the wand never falls behind).
 * Backspace: the trail dissolves in reverse stroke order, shedding sparks.
 * Enter: the wand sweeps an arc under the word, each letter flares as it passes,
 * then the word rises into stardust.
 */
import * as THREE from 'three';
import type { DeleteEvent, InsertEvent, SaveOutcome, WorldContext, WorldModule } from '../engine/types';
import type { Slot, LayoutOptions } from '../engine/layout';
import { LetterWorld, type LetterVisual, canvasTexture, disposeObject, blobTexture } from '../engine/letter-world';
import { Particles } from '../engine/particles';
import { ToolController } from '../engine/tools';
import { clamp, damp, easeInOutCubic, easeOutBack, easeOutCubic, lerp } from '../engine/anim';
import type { EvenPoint } from '../engine/glyphs/glyph-engine';

const THEMES: Record<string, { color: number; core: number; star: number; rainbow: number }> = {
  fairy: { color: 0x4f9dff, core: 0xa8e4ff, star: 0xd8f1ff, rainbow: 0 },
  gold: { color: 0xffae2e, core: 0xffe9a0, star: 0xfff3c8, rainbow: 0 },
  rainbow: { color: 0xff6bd5, core: 0xaafcff, star: 0xffffff, rainbow: 1 },
};

const TUBE_R = 0.072;
const WAND_REST = new THREE.Vector3(5.2, -2.2, 2.2);
const BODY_DIR = new THREE.Vector3(0.42, -0.58, 0.7).normalize();
const AIM_DIR = new THREE.Vector3(0.3, -0.85, 0.45).normalize();

interface WandVisual extends LetterVisual {
  mat: THREE.ShaderMaterial;
  mesh: THREE.Mesh;
  pts: EvenPoint[];
  formed: number;
  sigil: { mesh: THREE.Mesh; mat: THREE.MeshBasicMaterial; t: number } | null;
  halo: { sprite: THREE.Sprite; mat: THREE.SpriteMaterial; t: number } | null;
}

const LETTER_VERT = /* glsl */ `
  attribute float aU;
  uniform float uThick; uniform float uR;
  varying float vU; varying vec3 vN; varying vec3 vView;
  void main(){
    vU = aU;
    vec3 c = position - normal * uR;
    vec3 p = c + normal * uR * uThick;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vN = normalize(normalMatrix * normal);
    vView = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }`;

const LETTER_FRAG = /* glsl */ `
  uniform float uProgress; uniform float uSolid; uniform float uGlow; uniform float uTime;
  uniform float uRainbow; uniform float uAlpha;
  uniform vec3 uColor; uniform vec3 uCore;
  varying float vU; varying vec3 vN; varying vec3 vView;
  vec3 hsv(float h){ vec3 k = clamp(abs(mod(h*6.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0,0.0,1.0); return k; }
  void main(){
    if (vU > uProgress) discard;
    vec3 base = uRainbow > 0.5 ? hsv(fract(vU * 0.9 + uTime * 0.08)) : uColor;
    float head = smoothstep(0.07, 0.0, abs(uProgress - vU)) * step(uProgress, 0.999);
    float fres = pow(1.0 - abs(dot(normalize(vN), normalize(vView))), 2.0);
    vec3 trail = mix(base, vec3(1.0), 0.5) * 1.5;
    float spec = pow(max(dot(normalize(vN), normalize(vec3(0.35, 0.6, 0.75))), 0.0), 28.0);
    vec3 solid = base * 0.42 + uCore * fres * 1.25 + vec3(1.0) * spec * 0.9;
    solid *= 0.9 + 0.1 * sin(uTime * 3.0 + vU * 14.0);
    vec3 c = mix(trail, solid, uSolid) + vec3(1.0) * head * (1.0 - uSolid) * 1.4;
    gl_FragColor = vec4(c * uGlow, uAlpha);
  }`;

class MagicWand extends LetterWorld<WandVisual> {
  private th: (typeof THEMES)[string];
  private sparks: Particles;
  private controller: ToolController;
  private wand = new THREE.Group();
  private wandBody = new THREE.Group();
  private tipGlow: THREE.Sprite;
  private tipGlowMat: THREE.SpriteMaterial;
  private tipLight: THREE.PointLight;
  private tipMat: THREE.MeshBasicMaterial;
  private floorSigil: THREE.Mesh;
  private sigilTex: THREE.CanvasTexture;
  private sigilGeo = new THREE.PlaneGeometry(1, 1);
  private charge = 0;
  private dir = BODY_DIR.clone();
  private flourish: { t: number; dur: number; x0: number; x1: number; y: number; z: number } | null = null;
  private lastAspect = 0;
  private prevLayout: LayoutOptions;
  private tmp = new THREE.Vector3();
  private tmp2 = new THREE.Vector3();
  private up = new THREE.Vector3(0, 1, 0);
  private sparkT = 0;

  constructor(ctx: WorldContext) {
    super(ctx);
    const T = THREE;
    this.th = THEMES[ctx.theme] ?? THEMES.fairy;
    this.prevLayout = { ...ctx.layout.opts };
    ctx.layout.setOptions({ metric: 'sans', size: 1.15, tracking: 0.18, maxLines: 2, origin: [0, 0.55, 0], plane: 'xy', lineHeight: 1.6 });

    // Minimal dark stage (classic 3D Type look): near-black, dim moonlight, a dark floor
    // with only the faint turning sigil; the wand, its trail and the letters are the light.
    ctx.scene.background = new T.Color(0x020203);
    ctx.scene.fog = new T.FogExp2(0x020203, 0.03);
    this.root.add(new T.HemisphereLight(0x8fa2c8, 0x0a0806, 0.3));
    const moon = new T.DirectionalLight(0xb8c8ff, 0.45);
    moon.position.set(-5, 9, 6);
    this.root.add(moon);

    const floor = new T.Mesh(
      new T.PlaneGeometry(80, 50),
      new T.MeshStandardMaterial({ color: 0x08080b, roughness: 0.8, metalness: 0.1 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -3.4;
    this.root.add(floor);

    // sigil textures (floor & per-letter seal)
    this.sigilTex = canvasTexture(512, 512, (g, w) => {
      const c = w / 2;
      g.strokeStyle = 'rgba(255,255,255,0.95)';
      g.lineWidth = 6;
      g.beginPath();
      g.arc(c, c, c * 0.92, 0, Math.PI * 2);
      g.stroke();
      g.lineWidth = 3;
      g.beginPath();
      g.arc(c, c, c * 0.78, 0, Math.PI * 2);
      g.stroke();
      // tick marks / runic notches
      for (let i = 0; i < 36; i++) {
        const a = (i / 36) * Math.PI * 2;
        const l = i % 3 === 0 ? 0.1 : 0.05;
        g.beginPath();
        g.moveTo(c + Math.cos(a) * c * 0.8, c + Math.sin(a) * c * 0.8);
        g.lineTo(c + Math.cos(a) * c * (0.8 + l), c + Math.sin(a) * c * (0.8 + l));
        g.stroke();
      }
      // seven-pointed star
      g.lineWidth = 4;
      g.beginPath();
      for (let i = 0; i <= 7; i++) {
        const a = (i * 3 * Math.PI * 2) / 7 - Math.PI / 2;
        const x = c + Math.cos(a) * c * 0.74;
        const y = c + Math.sin(a) * c * 0.74;
        if (i) g.lineTo(x, y);
        else g.moveTo(x, y);
      }
      g.stroke();
      g.beginPath();
      g.arc(c, c, c * 0.3, 0, Math.PI * 2);
      g.stroke();
    });
    this.floorSigil = new T.Mesh(
      new T.PlaneGeometry(9, 9),
      new T.MeshBasicMaterial({ map: this.sigilTex, color: this.th.color, transparent: true, opacity: 0.18, blending: T.AdditiveBlending, depthWrite: false })
    );
    this.floorSigil.rotation.x = -Math.PI / 2;
    this.floorSigil.position.set(0, -3.38, 0.5);
    this.root.add(this.floorSigil);

    // sparks
    this.sparks = new Particles({ capacity: ctx.quality === 0 ? 600 : 1400, gravity: [0, -0.35, 0], drag: 1.6, size: 0.05, shape: 'spark' });
    this.root.add(this.sparks.points);

    // the wand: tip at local origin, body along +Y
    const shaftMat = new T.MeshStandardMaterial({ color: 0x3b2316, roughness: 0.55, metalness: 0.05 });
    const metalMat = new T.MeshStandardMaterial({ color: 0xd7b56d, roughness: 0.3, metalness: 0.9 });
    const shaft = new T.Mesh(
      new T.LatheGeometry([new T.Vector2(0.0, 0.0), new T.Vector2(0.016, 0.04), new T.Vector2(0.022, 0.5), new T.Vector2(0.03, 1.25), new T.Vector2(0.0, 1.26)], 10),
      shaftMat
    );
    const handle = new T.Mesh(
      new T.LatheGeometry(
        [new T.Vector2(0.0, 1.24), new T.Vector2(0.042, 1.26), new T.Vector2(0.05, 1.42), new T.Vector2(0.044, 1.55), new T.Vector2(0.052, 1.7), new T.Vector2(0.0, 1.74)],
        12
      ),
      new T.MeshStandardMaterial({ color: 0x24140d, roughness: 0.6 })
    );
    const ringGeo = new T.TorusGeometry(0.046, 0.009, 6, 16);
    for (const y of [1.25, 1.48, 1.72]) {
      const ring = new T.Mesh(ringGeo, metalMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = y;
      this.wandBody.add(ring);
    }
    const pommel = new T.Mesh(new T.SphereGeometry(0.06, 12, 8), metalMat);
    pommel.position.y = 1.78;
    this.tipMat = new T.MeshBasicMaterial({ color: this.th.core });
    const tip = new T.Mesh(new T.OctahedronGeometry(0.04, 0), this.tipMat);
    this.wandBody.add(shaft, handle, pommel, tip);
    this.wandBody.scale.setScalar(1.25);
    this.wand.add(this.wandBody);
    this.tipGlowMat = new T.SpriteMaterial({ map: blobTexture(), color: this.th.color, blending: T.AdditiveBlending, depthWrite: false, transparent: true });
    this.tipGlow = new T.Sprite(this.tipGlowMat);
    this.tipGlow.scale.setScalar(0.35);
    this.wand.add(this.tipGlow);
    this.tipLight = new T.PointLight(this.th.color, 0, 6, 2);
    this.wand.add(this.tipLight);
    this.wand.position.copy(WAND_REST);
    this.root.add(this.wand);

    this.controller = new ToolController(ctx.glyphs, ctx.layout, {
      count: 1,
      liftHeight: 0.7,
      maxQueue: 2,
      approach: 0.3,
      rest: () => WAND_REST.clone(),
      restDelay: 1.3,
    });
  }

  /* ------------------------------------------------------------ letters */

  private letterMaterial() {
    return new THREE.ShaderMaterial({
      uniforms: {
        uProgress: { value: 0 },
        uSolid: { value: 0 },
        uThick: { value: 0.32 },
        uR: { value: TUBE_R },
        uGlow: { value: 1 },
        uTime: { value: 0 },
        uRainbow: { value: this.th.rainbow },
        uAlpha: { value: 1 },
        uColor: { value: new THREE.Color(this.th.color) },
        uCore: { value: new THREE.Color(this.th.core) },
      },
      vertexShader: LETTER_VERT,
      fragmentShader: LETTER_FRAG,
      transparent: true,
    });
  }

  protected createLetter(ev: InsertEvent, slot: Slot): WandVisual | null {
    if (!ev.char.trim()) return null;
    const glyph = this.ctx.glyphs.get(ev.char, 'sans');
    const geo = this.ctx.glyphs.tube(glyph, TUBE_R, this.ctx.quality === 0 ? 6 : 8, true);
    const mat = this.letterMaterial();
    const mesh = new THREE.Mesh(geo, mat);
    const group = new THREE.Group();
    group.add(mesh);
    this.ctx.layout.apply(group, slot);
    this.root.add(group);
    const v: WandVisual = { ref: ev, slot, object: group, state: 'creating', age: 0, mat, mesh, pts: this.ctx.glyphs.evenPoints(glyph, 0.08), formed: 0, sigil: null, halo: null };
    if (ev.restoring || this.ctx.reducedMotion) {
      mat.uniforms.uProgress.value = 1;
      mat.uniforms.uSolid.value = 1;
      mat.uniforms.uThick.value = 1;
      v.formed = 1;
      v.state = 'alive';
      return v;
    }
    // typing rhythm: slow typists see a long aim + deliberate trace, fast ones a flick
    this.controller.opts.approach = this.ctx.tempo.duration(380, 120);
    this.controller.write({
      id: ev.id,
      glyph,
      slot,
      duration: this.ctx.tempo.duration(720, 220) * (0.6 + glyph.length * 0.12),
      onStart: () => {
        this.charge = 1;
        this.ctx.audio.play('whoosh', { pitch: 1.4, gain: 0.18, minGap: 0.08 });
      },
      onProgress: (s, tip) => {
        mat.uniforms.uProgress.value = Math.max(mat.uniforms.uProgress.value, s.u);
        if (tip && s.down) this.trailSparks(tip);
      },
      onDone: () => this.formLetter(v),
    });
    this.ctx.keepAlive(1600);
    return v;
  }

  private trailSparks(tip: THREE.Vector3) {
    const d = this.ctx.tempo.detail * (this.ctx.quality === 0 ? 0.5 : 1);
    const n = Math.random() < d ? 2 : 1;
    for (let i = 0; i < n; i++) {
      this.sparks.emit({
        x: tip.x,
        y: tip.y,
        z: tip.z + 0.03,
        vx: (Math.random() - 0.5) * 0.9,
        vy: (Math.random() - 0.3) * 0.8,
        vz: Math.random() * 0.6,
        life: 0.45 + Math.random() * 0.5,
        size: 0.8 + Math.random() * 0.9,
        color: Math.random() < 0.5 ? this.th.star : this.th.color,
      });
    }
    this.sparkT -= 1;
    if (this.sparkT <= 0) {
      this.ctx.audio.play('sparkle', { pitch: 1.1 + Math.random() * 0.5, gain: 0.16, minGap: 0.09 });
      this.sparkT = 5;
    }
  }

  private formLetter(v: WandVisual) {
    v.mat.uniforms.uProgress.value = 1;
    if (v.state === 'creating') v.state = 'alive';
    const dur = this.ctx.tempo.duration(520, 260);
    this.tweens.add(dur, (k) => {
      const e = easeOutBack(k, 2.2);
      v.mat.uniforms.uThick.value = lerp(0.32, 1, e);
      v.mat.uniforms.uSolid.value = easeOutCubic(k);
      v.formed = k;
    });
    this.ctx.audio.play('chime', { pitch: 1 + Math.random() * 0.25, gain: 0.32, minGap: 0.06 });
    // seal: sigil + halo (skipped when typing very fast)
    if (this.ctx.tempo.tempo === 'fast' && this.controller.pending() > 1) return;
    const s = v.slot;
    const cx = s.advance / s.size / 2;
    const sm = new THREE.MeshBasicMaterial({ map: this.sigilTex, color: this.th.color, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
    const sigil = new THREE.Mesh(this.sigilGeo, sm);
    sigil.position.set(cx, 0.5, -0.25);
    v.object.add(sigil);
    v.sigil = { mesh: sigil, mat: sm, t: 0 };
    const hm = new THREE.SpriteMaterial({ map: blobTexture(), color: this.th.core, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0 });
    const halo = new THREE.Sprite(hm);
    halo.position.set(cx, 0.5, -0.1);
    v.object.add(halo);
    v.halo = { sprite: halo, mat: hm, t: 0 };
  }

  protected removeLetter(v: WandVisual, ev: DeleteEvent): void {
    this.controller.cancel(v.ref.id);
    const start = v.mat.uniforms.uProgress.value as number;
    const dur = (this.ctx.reducedMotion ? 0.2 : 0.5) * (ev.burstSize > 3 ? 0.5 : 1) * Math.max(0.3, start);
    const s0 = v.mat.uniforms.uSolid.value as number;
    const p = new THREE.Vector3();
    this.tweens.add(dur, (k) => {
      const u = start * (1 - k);
      v.mat.uniforms.uProgress.value = u;
      v.mat.uniforms.uSolid.value = s0 * (1 - clamp(k * 3));
      v.mat.uniforms.uThick.value = lerp(1, 0.4, clamp(k * 3)) * (v.formed > 0.5 ? 1 : 0.4);
      // sparks shed from the receding end
      const pt = this.pointAt(v, u);
      if (pt && Math.random() < 0.8) {
        this.ctx.layout.toWorld(v.slot, pt.x, pt.y, 0, p);
        this.sparks.emit({ x: p.x, y: p.y, z: p.z, vx: (Math.random() - 0.5) * 1.2, vy: Math.random() * 0.9, vz: Math.random() * 0.8, life: 0.6, size: 1.1, color: this.th.star });
      }
    }, { done: () => this.release(v) });
    this.ctx.audio.play('sparkle', { pitch: 0.7, gain: 0.25 });
    this.ctx.keepAlive(900);
  }

  private pointAt(v: WandVisual, u: number) {
    const pts = v.pts;
    if (!pts.length) return null;
    let lo = 0,
      hi = pts.length - 1;
    while (hi - lo > 1) {
      const m = (lo + hi) >> 1;
      if (pts[m].u < u) lo = m;
      else hi = m;
    }
    return pts[hi];
  }

  protected updateLetter(v: WandVisual, dt: number, t: number): boolean {
    let moving = false;
    v.mat.uniforms.uTime.value = t;
    if (v.state === 'creating' || v.state === 'alive') {
      const o = v.object;
      const s = v.slot;
      // gentle levitation once formed
      const bob = Math.sin(t * 1.6 + v.ref.id * 0.9) * 0.035 * s.size * v.formed;
      if (v.state === 'creating') o.position.set(s.origin.x, s.origin.y, s.origin.z);
      else {
        o.position.x = damp(o.position.x, s.origin.x, 14, dt);
        o.position.y = damp(o.position.y, s.origin.y + bob, 14, dt);
        o.position.z = s.origin.z;
      }
      o.scale.setScalar(damp(o.scale.x, s.size, 14, dt));
      moving = v.state === 'creating';
    }
    if (v.sigil) {
      const g = v.sigil;
      g.t += dt;
      const k = clamp(g.t / 1.0);
      g.mesh.scale.setScalar(lerp(0.5, 1.9, easeOutCubic(k)));
      g.mesh.rotation.z = -g.t * 2.2;
      g.mat.opacity = Math.sin(Math.PI * k) * 0.85;
      if (k >= 1) {
        disposeObject(g.mesh);
        v.sigil = null;
      }
      moving = true;
    }
    if (v.halo) {
      const h = v.halo;
      h.t += dt;
      const k = clamp(h.t / 0.6);
      h.sprite.scale.setScalar(lerp(0.6, 2.4, easeOutCubic(k)));
      h.mat.opacity = (1 - k) * 0.9;
      if (k >= 1) {
        h.sprite.removeFromParent(); // sprite geometry is three.js-global: only drop the material
        h.mat.dispose();
        v.halo = null;
      }
      moving = true;
    }
    return moving;
  }

  /* ------------------------------------------------------------- finale */

  protected playFinale(_word: string, visuals: WandVisual[], saved: Promise<SaveOutcome>): void {
    this.controller.flush();
    if (!visuals.length) return;
    let x0 = Infinity,
      x1 = -Infinity,
      y = Infinity;
    for (const v of visuals) {
      x0 = Math.min(x0, v.slot.origin.x);
      x1 = Math.max(x1, v.slot.origin.x + v.slot.advance);
      y = Math.min(y, v.slot.origin.y);
    }
    const sweep = this.ctx.reducedMotion ? 0.35 : 0.85;
    this.flourish = { t: 0, dur: sweep, x0: x0 - 0.4, x1: x1 + 0.4, y: y - 0.35 * visuals[0].slot.size, z: 0.6 };
    this.ctx.audio.play('whoosh', { pitch: 1.1, gain: 0.35 });
    const p = new THREE.Vector3();
    visuals.forEach((v) => {
      v.mat.uniforms.uProgress.value = 1;
      v.mat.uniforms.uSolid.value = 1;
      v.mat.uniforms.uThick.value = 1;
      v.formed = 1;
      const pos0 = v.object.position.clone();
      const at = ((v.slot.origin.x + v.slot.advance / 2 - (x0 - 0.4)) / (x1 - x0 + 0.8)) * sweep;
      // flare as the wand passes
      this.tweens.add(0.5, (k) => (v.mat.uniforms.uGlow.value = 1 + Math.sin(Math.PI * k) * 1.4), { delay: at });
      // rise into stardust
      this.tweens.add(
        0.9,
        (k) => {
          const e = easeInOutCubic(k);
          v.object.position.set(pos0.x, pos0.y + e * 2.2, pos0.z + e * 0.6);
          v.object.scale.setScalar(v.slot.size * (1 - e * 0.85));
          v.mat.uniforms.uAlpha.value = 1 - clamp((k - 0.4) / 0.6);
          if (Math.random() < 0.5) {
            v.object.getWorldPosition(p);
            this.sparks.emit({ x: p.x + Math.random() * v.slot.advance, y: p.y + Math.random() * v.slot.size * 0.5, z: p.z, vx: (Math.random() - 0.5) * 0.8, vy: 0.4 + Math.random(), vz: (Math.random() - 0.5) * 0.5, life: 1.1, size: 1.2, color: this.th.star });
          }
        },
        { delay: sweep + 0.25, done: () => this.release(v) }
      );
    });
    saved.then((res) => {
      if (res.ok) this.ctx.audio.play('success', { gain: 0.55 });
      else this.ctx.audio.play('error', { gain: 0.4 });
    });
    this.ctx.keepAlive(2600);
  }

  /* -------------------------------------------------------------- world */

  protected updateWorld(dt: number, time: number): boolean {
    let moving = false;
    this.responsive();
    this.floorSigil.rotation.z = time * 0.05;
    if (this.sparks.update(dt, time)) moving = true;
    if (this.controller.update(dt)) moving = true;
    const tool = this.controller.tools[0];

    // wand pose
    let targetDir: THREE.Vector3 = BODY_DIR;
    if (this.flourish) {
      const f = this.flourish;
      f.t += dt;
      const k = clamp(f.t / f.dur);
      const e = easeInOutCubic(k);
      this.tmp.set(lerp(f.x0, f.x1, e), f.y - Math.sin(Math.PI * e) * 0.45, f.z);
      this.wand.position.copy(this.tmp);
      tool.tip.copy(this.tmp);
      this.charge = Math.max(this.charge, 0.8);
      this.trailSparks(this.tmp);
      targetDir = AIM_DIR;
      if (k >= 1) this.flourish = null;
      moving = true;
    } else {
      this.wand.position.copy(tool.tip);
      if (tool.job && !tool.down) {
        targetDir = AIM_DIR; // lifted & aiming between strokes / while travelling
        this.gatherSparks(tool.tip, dt);
      }
    }
    if (tool.idle > 1.5 && !this.flourish) this.tmp2.set(0.15, -0.95, 0.25).normalize();
    else this.tmp2.copy(targetDir);
    if (tool.down) {
      this.tmp2.x -= clamp(tool.vel.x * 0.02, -0.2, 0.2);
      this.tmp2.y -= clamp(tool.vel.y * 0.02, -0.2, 0.2);
      this.tmp2.normalize();
    }
    this.dir.lerp(this.tmp2, 1 - Math.exp(-10 * dt)).normalize();
    this.wandBody.quaternion.setFromUnitVectors(this.up, this.dir);

    // tip glow: charge while aiming/drawing, idle shimmer otherwise
    const active = !!tool.job || !!this.flourish;
    this.charge = damp(this.charge, active ? (tool.down ? 0.85 : 1) : 0.25, active ? 8 : 3, dt);
    const pulse = 1 + Math.sin(time * 9) * 0.08;
    this.tipGlow.scale.setScalar((0.25 + this.charge * 0.55) * pulse);
    this.tipLight.intensity = this.charge * 2.2;
    if (active || Math.abs(this.charge - 0.25) > 0.01) moving = true;
    return moving;
  }

  private gatherSparks(tip: THREE.Vector3, dt: number) {
    if (Math.random() > dt * 40 * this.ctx.tempo.detail) return;
    const a = Math.random() * Math.PI * 2;
    const b = Math.random() * Math.PI;
    const r = 0.35 + Math.random() * 0.25;
    const dx = Math.sin(b) * Math.cos(a),
      dy = Math.sin(b) * Math.sin(a),
      dz = Math.cos(b);
    const life = 0.28;
    this.sparks.emit({ x: tip.x + dx * r, y: tip.y + dy * r, z: tip.z + dz * r, vx: (-dx * r) / life, vy: (-dy * r) / life, vz: (-dz * r) / life, life, size: 0.8, color: this.th.core });
  }

  private responsive() {
    const cam = this.ctx.camera;
    if (cam.aspect === this.lastAspect) return;
    this.lastAspect = cam.aspect;
    const ht = Math.tan(((cam.fov * Math.PI) / 180) / 2);
    const wide = 2 * ht * cam.aspect;
    const dist = clamp(12.5 / wide, 11, 22);
    cam.position.set(0, 0.9, dist);
    cam.lookAt(0, 0.35, 0);
    const maxW = clamp(wide * dist * 0.8, 4.5, 10);
    if (Math.abs(maxW - this.ctx.layout.opts.maxWidth) > 0.05) {
      this.ctx.layout.setOptions({ maxWidth: maxW });
      this.ctx.layout.compute(this.ctx.letters());
    }
  }

  setTheme(id: string) {
    const th = THEMES[id];
    if (!th) return;
    this.th = th;
    this.tipMat.color.set(th.core);
    this.tipGlowMat.color.set(th.color);
    this.tipLight.color.set(th.color);
    (this.floorSigil.material as THREE.MeshBasicMaterial).color.set(th.color);
    for (const v of this.letters.values()) {
      v.mat.uniforms.uColor.value.set(th.color);
      v.mat.uniforms.uCore.value.set(th.core);
      v.mat.uniforms.uRainbow.value = th.rainbow;
    }
    this.ctx.keepAlive(300);
  }

  disposeWorld(): void {
    this.controller.flush();
    this.sparks.dispose();
    this.sigilGeo.dispose();
    this.sigilTex.dispose();
    super.disposeWorld();
    this.ctx.layout.setOptions(this.prevLayout);
    this.ctx.scene.fog = null;
  }
}

export function create(ctx: WorldContext) {
  return new MagicWand(ctx);
}

export const magicWand: WorldModule = { create };
