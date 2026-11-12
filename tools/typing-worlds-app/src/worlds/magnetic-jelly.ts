/**
 * WORLD 01 · Magnetic Jelly (磁性果冻)
 *
 * A clean, bright toy lab. A magnetic board stands on a white floor; a toy
 * horseshoe magnet hangs above it. Letters are soft, translucent jelly:
 *
 *  - type: a jelly letter pops out above the board and is pulled onto its slot by a
 *    magnetic force (1/r² near field + far spring). It stretches along its flight,
 *    squashes on impact, overshoots and rebounds (damped springs).
 *  - neighbours wobble (bend + squash impulses, decaying with distance).
 *  - fast typing pumps a shared "row energy" → the whole row bobs in a soft wave.
 *  - Backspace: the letter detaches from the board, bounces on the floor, pops.
 *  - Enter: the row hops in sequence, then the big magnet collects the word.
 *
 * Deformation lives in a vertex-shader patch of MeshPhysicalMaterial (axis stretch,
 * shear bend, z-press and a small normal jiggle) — no per-vertex simulation.
 */
import * as THREE from 'three';
import type { DeleteEvent, InsertEvent, SaveOutcome, WorldContext, WorldInstance, WorldModule } from '../engine/types';
import { LetterWorld, type LetterVisual, gradientSky, blobTexture, canvasTexture } from '../engine/letter-world';
import type { Slot } from '../engine/layout';
import { Particles } from '../engine/particles';
import { clamp, damp, rand } from '../engine/anim';

interface JellyTheme {
  colors: number[];
  rough: number;
  metal: number;
  trans: number;
  clearcoat: number;
  glow: number;
  opacity: number;
}

const THEMES: Record<string, JellyTheme> = {
  jelly: { colors: [0xff5f8f, 0xffa53d, 0x7fd448, 0x36c2ee, 0xa58bff, 0xff7a5c], rough: 0.16, metal: 0, trans: 0.7, clearcoat: 1, glow: 0.55, opacity: 0.86 },
  crystal: { colors: [0x8ec8ff, 0xb7a8ff, 0x9fe8ff], rough: 0.04, metal: 0, trans: 0.85, clearcoat: 1, glow: 0.45, opacity: 0.8 },
  glass: { colors: [0xe2f2f7], rough: 0.02, metal: 0, trans: 0.95, clearcoat: 1, glow: 0.25, opacity: 0.68 },
  rubber: { colors: [0xff6b6b, 0x4ecdc4, 0xffc94d, 0x6c8cff], rough: 0.72, metal: 0, trans: 0, clearcoat: 0.15, glow: 0.12, opacity: 1 },
  chrome: { colors: [0xeef1f5], rough: 0.1, metal: 0.95, trans: 0, clearcoat: 0.6, glow: 0.04, opacity: 1 },
  clay: { colors: [0xde8c68, 0xe7a37f, 0xcf7d5c], rough: 0.85, metal: 0, trans: 0, clearcoat: 0, glow: 0.05, opacity: 1 },
};

const FLOOR_Y = -2.75;
const BOARD_Z = -0.44;
const MAGNET = new THREE.Vector3(0, 3.55, 0.35);

type Mode = 'fly' | 'stuck' | 'detach' | 'pop' | 'collect';

interface JellyUniforms {
  [k: string]: THREE.IUniform;
  uCenter: { value: THREE.Vector2 };
  uAxis: { value: THREE.Vector2 };
  uStretch: { value: number };
  uBend: { value: number };
  uPress: { value: number };
  uJig: { value: number };
  uTime: { value: number };
  uPhase: { value: number };
  uGlow: { value: number };
  uFlash: { value: number };
  uGlowColor: { value: THREE.Color };
}

interface JellyVisual extends LetterVisual {
  body: THREE.Group;
  mesh: THREE.Mesh;
  mat: THREE.MeshPhysicalMaterial;
  u: JellyUniforms;
  shadow: THREE.Mesh;
  shadowMat: THREE.MeshBasicMaterial;
  fallback: boolean;
  colorIndex: number;
  cx: number;
  cy: number;
  mode: Mode;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  size: number;
  /** stretch (+) / squash (−) along axis */
  s: number;
  sv: number;
  /** shear sway */
  b: number;
  bv: number;
  /** z press */
  p: number;
  pv: number;
  jig: number;
  rot: number;
  rotV: number;
  flash: number;
  bounces: number;
  t: number;
  /** finale: seconds until hop / collect */
  hopIn: number;
  collectIn: number;
  shrink: number;
}

const VERT_DECL = /* glsl */ `
uniform vec2 uCenter; uniform vec2 uAxis; uniform float uStretch; uniform float uBend;
uniform float uPress; uniform float uJig; uniform float uTime; uniform float uPhase;`;

const VERT_DEFORM = /* glsl */ `
vec3 transformed = vec3( position );
{
  vec2 d = transformed.xy - uCenter;
  float al = dot(d, uAxis);
  vec2 pe = d - al * uAxis;
  d = uAxis * al * (1.0 + uStretch) + pe * (1.0 - uStretch * 0.5);
  d.x += uBend * d.y;
  float w = sin(position.y * 8.0 + position.x * 4.0 + uTime * 20.0 + uPhase);
  d += objectNormal.xy * (uJig * w);
  transformed.xy = uCenter + d;
  transformed.z *= (1.0 - uStretch * 0.35) * (1.0 + uPress);
}`;

const FRAG_DECL = /* glsl */ `
uniform float uGlow; uniform float uFlash; uniform vec3 uGlowColor;`;

const FRAG_GLOW = /* glsl */ `
{
  float ndv = clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0);
  float rim = pow(1.0 - ndv, 2.5);
  outgoingLight += uGlowColor * (uGlow * (0.16 + rim * 0.75) + uFlash * 0.45);
}
#include <opaque_fragment>`;

class MagneticJelly extends LetterWorld<JellyVisual> {
  private themeId: string;
  private sparks: Particles;
  private rowEnergy = 0;
  private colorCounter = 0;
  private disposed = false;
  private magnet: THREE.Group;
  private magnetGlow = 0;
  private magnetMat: THREE.MeshStandardMaterial;
  private shadowGeo: THREE.PlaneGeometry;
  private camTarget = new THREE.Vector3(0, 0.15, 0);
  private camDir = new THREE.Vector3(0, 0.07, 1).normalize();
  private camDist = 12.6;
  private tmp = new THREE.Vector3();
  private tmp2 = new THREE.Vector3();
  private white = new THREE.Color(0xffffff);

  constructor(ctx: WorldContext) {
    super(ctx);
    const T = THREE;
    this.themeId = THEMES[ctx.theme] ? ctx.theme : 'jelly';

    ctx.scene.background = new T.Color(0xf3f6fb);
    ctx.scene.fog = new T.Fog(0xf3f6fb, 26, 70);
    ctx.scene.environment = ctx.renderer.environment();
    this.root.add(gradientSky(0xdfe9fb, 0xeef0f4, { horizon: 0xfbfcff, exponent: 0.7 }));
    this.placeCamera(true);

    this.root.add(new T.HemisphereLight(0xffffff, 0xdde3ee, 1.05));
    const key = new T.DirectionalLight(0xffffff, 1.5);
    key.position.set(5, 9, 8);
    this.root.add(key);
    const fill = new T.DirectionalLight(0xe4ecff, 0.5);
    fill.position.set(-7, 3, 6);
    this.root.add(fill);

    this.buildLab();

    // toy magnet (the "source" of the field)
    this.magnetMat = new T.MeshStandardMaterial({ color: 0xff4d5e, roughness: 0.35, metalness: 0.1, emissive: 0xff2a40, emissiveIntensity: 0 });
    this.magnet = new T.Group();
    const arc = new T.Mesh(new T.TorusGeometry(0.5, 0.16, 14, 36, Math.PI), this.magnetMat);
    this.magnet.add(arc);
    const tipMat = new T.MeshStandardMaterial({ color: 0xe9edf2, roughness: 0.25, metalness: 0.85 });
    for (const sx of [-0.5, 0.5]) {
      const tip = new T.Mesh(new T.CylinderGeometry(0.16, 0.16, 0.3, 18), tipMat);
      tip.position.set(sx, -0.15, 0);
      this.magnet.add(tip);
    }
    const cord = new T.Mesh(new T.CylinderGeometry(0.015, 0.015, 6, 6), new T.MeshStandardMaterial({ color: 0x9aa3b2 }));
    cord.position.y = 3.6;
    this.magnet.add(cord);
    this.magnet.position.copy(MAGNET).add(new T.Vector3(0, 0.25, 0));
    this.root.add(this.magnet);

    this.shadowGeo = new T.PlaneGeometry(1, 1);
    this.shadowGeo.userData.shared = true;

    this.sparks = new Particles({ capacity: 500, gravity: [0, -4, 0], drag: 1.6, shape: 'dot', size: 0.07, blending: T.NormalBlending, opacity: 0.9 });
    this.root.add(this.sparks.points);

    ctx.glyphs
      .loadOutlineFont()
      .then(() => {
        if (this.disposed) return;
        // swap fallback tube letters to solid jelly and re-measure with real metrics
        for (const v of [...this.letters.values(), ...this.detached]) {
          if (!v.fallback) continue;
          const g = this.geometryFor(v.ref.char);
          if (g.fallback) continue;
          v.mesh.geometry = g.geo;
          v.fallback = false;
          v.cx = g.cx;
          v.cy = g.cy;
          v.mesh.position.set(-g.cx, -g.cy, 0);
          v.u.uCenter.value.set(g.cx, g.cy);
        }
        this.ctx.layout.compute(this.ctx.letters());
        this.ctx.keepAlive(600);
      })
      .catch(() => {});
  }

  /* ------------------------------------------------------------- scene */

  private buildLab() {
    const T = THREE;
    const floor = new T.Mesh(new T.CircleGeometry(40, 64), new T.MeshStandardMaterial({ color: 0xf6f7fa, roughness: 0.55, metalness: 0 }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = FLOOR_Y;
    this.root.add(floor);

    // magnetic board with a soft dot grid
    const W = 13.4;
    const H = 5.9;
    const rr = (w: number, h: number, r: number) => {
      const s = new T.Shape();
      s.moveTo(-w / 2 + r, -h / 2);
      s.lineTo(w / 2 - r, -h / 2);
      s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
      s.lineTo(w / 2, h / 2 - r);
      s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
      s.lineTo(-w / 2 + r, h / 2);
      s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
      s.lineTo(-w / 2, -h / 2 + r);
      s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
      return s;
    };
    const dots = canvasTexture(256, 256, (g, w, h) => {
      g.fillStyle = '#fbfcfe';
      g.fillRect(0, 0, w, h);
      g.fillStyle = 'rgba(120,140,180,0.22)';
      for (let y = 16; y < h; y += 32) for (let x = 16; x < w; x += 32) g.fillRect(x - 2, y - 2, 4, 4);
    });
    dots.wrapS = dots.wrapT = T.RepeatWrapping;
    const boardGeo = new T.ShapeGeometry(rr(W, H, 0.5), 6);
    // planar uv in world units
    const pos = boardGeo.getAttribute('position');
    const uv = boardGeo.getAttribute('uv');
    for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) / 1.6, pos.getY(i) / 1.6);
    const board = new T.Mesh(boardGeo, new T.MeshStandardMaterial({ color: 0xffffff, map: dots, roughness: 0.8, metalness: 0 }));
    board.position.set(0, 0.1, BOARD_Z);
    this.root.add(board);
    const outer = rr(W + 0.5, H + 0.5, 0.7);
    outer.holes.push(rr(W, H, 0.5));
    const frame = new T.Mesh(
      new T.ExtrudeGeometry(outer, { depth: 0.22, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.05, bevelSegments: 2, curveSegments: 8 }),
      new T.MeshStandardMaterial({ color: 0xc9dcff, roughness: 0.4, metalness: 0 })
    );
    frame.position.set(0, 0.1, BOARD_Z - 0.12);
    this.root.add(frame);
    const backing = new T.Mesh(new T.BoxGeometry(W, H, 0.12), new T.MeshStandardMaterial({ color: 0xe8edf6, roughness: 0.7 }));
    backing.position.set(0, 0.1, BOARD_Z - 0.08);
    this.root.add(backing);
    const legMat = new T.MeshStandardMaterial({ color: 0xb8c2d4, roughness: 0.3, metalness: 0.6 });
    for (const x of [-4.8, 4.8]) {
      const leg = new T.Mesh(new T.CylinderGeometry(0.09, 0.12, 0.3 + (0.1 - H / 2 - FLOOR_Y), 12), legMat);
      leg.position.set(x, (FLOOR_Y + 0.1 - H / 2) / 2, BOARD_Z - 0.1);
      this.root.add(leg);
      const foot = new T.Mesh(new T.CylinderGeometry(0.45, 0.5, 0.08, 24), legMat);
      foot.position.set(x, FLOOR_Y + 0.04, BOARD_Z - 0.1);
      this.root.add(foot);
    }

    // pastel toys on the floor
    const toy = (geo: THREE.BufferGeometry, color: number, x: number, z: number, y = 0, rotY = 0) => {
      const m = new T.Mesh(geo, new T.MeshStandardMaterial({ color, roughness: 0.35, metalness: 0 }));
      geo.computeBoundingBox();
      m.position.set(x, FLOOR_Y - geo.boundingBox!.min.y + y, z);
      m.rotation.y = rotY;
      this.root.add(m);
      const sh = new T.Mesh(new T.PlaneGeometry(1.6, 1.6), new T.MeshBasicMaterial({ map: blobTexture(), color: 0x6f7a90, transparent: true, opacity: 0.25, depthWrite: false }));
      sh.rotation.x = -Math.PI / 2;
      sh.position.set(x, FLOOR_Y + 0.01, z);
      this.root.add(sh);
    };
    toy(new T.SphereGeometry(0.5, 28, 18), 0xffb3c9, -6.4, 1.6);
    toy(new T.BoxGeometry(0.75, 0.75, 0.75), 0xffe08a, -5.4, 2.6, 0, 0.5);
    toy(new T.TorusGeometry(0.42, 0.17, 14, 32), 0xa7e8cf, 6.1, 1.9, 0, -0.4);
    toy(new T.ConeGeometry(0.42, 0.9, 24), 0xbcb2ff, 5.2, 2.9);
    toy(new T.CylinderGeometry(0.32, 0.32, 0.5, 24), 0x9fd8ff, 6.9, 3.1);
  }

  private placeCamera(snap: boolean, dt = 0) {
    const cam = this.ctx.camera;
    const aspect = this.ctx.renderer.size.aspect || 1.6;
    const v = Math.tan((cam.fov * Math.PI) / 360);
    const b = this.ctx.layout.bounds;
    const halfW = Math.max(3.2, b.isEmpty() ? 0 : Math.max(Math.abs(b.min.x), Math.abs(b.max.x))) + 0.9;
    const need = Math.max(4.2 / v, halfW / (v * aspect));
    const want = Math.min(34, Math.max(12.6, need));
    this.camDist = snap ? want : damp(this.camDist, want, 3, dt);
    cam.position.copy(this.camTarget).addScaledVector(this.camDir, this.camDist);
    cam.lookAt(this.camTarget);
    return Math.abs(this.camDist - want) > 0.01;
  }

  /* ------------------------------------------------------------ letters */

  private geometryFor(ch: string): { geo: THREE.BufferGeometry; fallback: boolean; cx: number; cy: number } {
    const glyphs = this.ctx.glyphs;
    if (glyphs.outlineReady) {
      try {
        const geo = glyphs.outline(ch, { depth: 0.42, bevel: 0.07, curve: 7 });
        const bb = geo.boundingBox!;
        return { geo, fallback: false, cx: (bb.min.x + bb.max.x) / 2, cy: (bb.min.y + bb.max.y) / 2 };
      } catch {
        /* fall through */
      }
    }
    const g = glyphs.get(ch, 'sans');
    return {
      geo: glyphs.tube(g, 0.12, 10, true),
      fallback: true,
      cx: (g.bounds.minX + g.bounds.maxX) / 2,
      cy: (g.bounds.minY + g.bounds.maxY) / 2,
    };
  }

  private makeMaterial(colorIndex: number): { mat: THREE.MeshPhysicalMaterial; u: JellyUniforms } {
    const u: JellyUniforms = {
      uCenter: { value: new THREE.Vector2() },
      uAxis: { value: new THREE.Vector2(0, 1) },
      uStretch: { value: 0 },
      uBend: { value: 0 },
      uPress: { value: 0 },
      uJig: { value: 0 },
      uTime: { value: 0 },
      uPhase: { value: Math.random() * 6.28 },
      uGlow: { value: 0.4 },
      uFlash: { value: 0 },
      uGlowColor: { value: new THREE.Color() },
    };
    const mat = new THREE.MeshPhysicalMaterial();
    mat.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, u);
      shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\n' + VERT_DECL).replace('#include <begin_vertex>', VERT_DEFORM);
      shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\n' + FRAG_DECL).replace('#include <opaque_fragment>', FRAG_GLOW);
    };
    this.applyTheme(mat, u, colorIndex);
    return { mat, u };
  }

  private applyTheme(mat: THREE.MeshPhysicalMaterial, u: JellyUniforms, colorIndex: number) {
    const th = THEMES[this.themeId] ?? THEMES.jelly;
    const c = th.colors[colorIndex % th.colors.length];
    const useTrans = this.ctx.quality === 2 && th.trans > 0;
    mat.color.setHex(c);
    mat.roughness = th.rough;
    mat.metalness = th.metal;
    mat.clearcoat = th.clearcoat;
    mat.clearcoatRoughness = 0.12;
    mat.transmission = useTrans ? th.trans : 0;
    mat.thickness = 0.9;
    mat.ior = 1.36;
    mat.attenuationColor.setHex(c);
    mat.attenuationDistance = 0.6;
    mat.sheen = th.trans > 0 ? 0.35 : 0;
    mat.sheenColor.setHex(0xffffff);
    mat.transparent = !useTrans && th.opacity < 1;
    mat.opacity = useTrans ? 1 : th.opacity;
    mat.envMapIntensity = th.metal > 0.5 ? 1.2 : 0.8;
    u.uGlow.value = th.glow;
    u.uGlowColor.value.setHex(c).lerp(this.white, 0.3);
    mat.needsUpdate = true;
  }

  private targetOf(v: JellyVisual, out: THREE.Vector3) {
    const s = v.slot;
    return out.set(s.origin.x + v.cx * s.size, s.origin.y + v.cy * s.size, s.origin.z);
  }

  protected createLetter(ev: InsertEvent, slot: Slot): JellyVisual | null {
    if (!ev.char.trim()) return null;
    const ctx = this.ctx;
    const g = this.geometryFor(ev.char);
    const colorIndex = this.colorCounter++;
    const { mat, u } = this.makeMaterial(colorIndex);
    u.uCenter.value.set(g.cx, g.cy);

    const container = new THREE.Group();
    const body = new THREE.Group();
    const mesh = new THREE.Mesh(g.geo, mat);
    mesh.position.set(-g.cx, -g.cy, 0);
    body.add(mesh);
    container.add(body);

    const shadowMat = new THREE.MeshBasicMaterial({ map: blobTexture(), color: 0x55607a, transparent: true, opacity: 0, depthWrite: false });
    const shadow = new THREE.Mesh(this.shadowGeo, shadowMat);
    shadow.renderOrder = 1;
    container.add(shadow);
    this.root.add(container);

    const v: JellyVisual = {
      ref: ev,
      slot,
      object: container,
      state: ev.restoring ? 'alive' : 'creating',
      age: 0,
      body,
      mesh,
      mat,
      u,
      shadow,
      shadowMat,
      fallback: g.fallback,
      colorIndex,
      cx: g.cx,
      cy: g.cy,
      mode: ev.restoring ? 'stuck' : 'fly',
      pos: new THREE.Vector3(),
      vel: new THREE.Vector3(),
      size: slot.size,
      s: 0,
      sv: 0,
      b: 0,
      bv: 0,
      p: 0,
      pv: 0,
      jig: 0,
      rot: 0,
      rotV: 0,
      flash: 0,
      bounces: 0,
      t: 0,
      hopIn: -1,
      collectIn: -1,
      shrink: 1,
    };
    const target = this.targetOf(v, this.tmp);
    if (ev.restoring) {
      v.pos.copy(target);
    } else {
      const fast = ctx.tempo.tempo === 'fast';
      const k = fast ? 0.55 : 1;
      v.pos.set(target.x + rand(-1.2, 1.2) * k, target.y + rand(2.6, 3.3) * k, target.z + rand(1.6, 2.3) * k);
      v.vel.set(rand(-0.6, 0.6), rand(0.6, 1.6), 0);
      v.rotV = rand(-1.5, 1.5);
      v.flash = 0.6;
      this.rowEnergy = Math.min(1, this.rowEnergy + (fast ? 0.3 : ctx.tempo.tempo === 'normal' ? 0.12 : 0));
      ctx.audio.play('pop', { pitch: 1.25 + Math.random() * 0.25, gain: 0.35, minGap: 30 });
      this.magnetGlow = 1;
    }
    this.syncTransform(v);
    ctx.keepAlive(1500);
    return v;
  }

  protected removeLetter(v: JellyVisual, _ev: DeleteEvent): void {
    this.detach(v, false);
    this.ctx.audio.play('squish', { pitch: 1.35, gain: 0.5, minGap: 30 });
    this.wobbleNeighbors(v, 0.8);
    this.ctx.keepAlive(1800);
  }

  private detach(v: JellyVisual, celebrate: boolean) {
    v.mode = 'detach';
    v.t = 0;
    v.bounces = 0;
    v.vel.set(rand(-1.4, 1.4), celebrate ? rand(4, 5) : rand(2.2, 3.2), rand(3, 4));
    v.rotV = rand(-4, 4);
    v.u.uAxis.value.set(0, 1);
    v.s = 0.28;
    v.sv = 0;
    v.flash = 0.5;
  }

  protected playFinale(_word: string, visuals: JellyVisual[], saved: Promise<SaveOutcome>): void {
    const ctx = this.ctx;
    const sorted = visuals.slice().sort((a, b) => a.slot.index - b.slot.index);
    sorted.forEach((v, i) => {
      if (v.mode === 'fly') {
        v.mode = 'stuck';
        v.state = 'alive';
      }
      v.hopIn = i * 0.07;
      v.collectIn = 0.85 + i * 0.05;
    });
    ctx.audio.play('success', { gain: 0.7 });
    saved.then((r) => {
      if (!r.ok) ctx.audio.play('error', { gain: 0.5 });
    });
    ctx.keepAlive(1500 + sorted.length * 80);
  }

  setTheme(id: string) {
    if (!THEMES[id]) return;
    this.themeId = id;
    for (const v of [...this.letters.values(), ...this.detached]) this.applyTheme(v.mat, v.u, v.colorIndex);
    this.ctx.keepAlive(200);
  }

  /** neighbours wobble when a letter lands / leaves */
  private wobbleNeighbors(src: JellyVisual, strength: number) {
    const row = [...this.letters.values()].filter((o) => o.mode === 'stuck' && o !== src).sort((a, b) => a.slot.index - b.slot.index);
    for (const o of row) {
      const n = o.slot.index - src.slot.index;
      const an = Math.abs(n);
      if (an === 0 || an > 3 || o.slot.line !== src.slot.line) continue;
      const k = strength / an;
      const dir = Math.sign(n);
      o.bv += dir * k * 2.4;
      o.sv -= k * 1.3;
      o.vel.x += dir * k * 0.9;
      o.jig = Math.max(o.jig, 0.014 * k);
    }
  }

  private land(v: JellyVisual) {
    const speed = v.vel.length();
    const ax = v.vel.x;
    const ay = v.vel.y;
    const l = Math.hypot(ax, ay);
    if (l > 0.2) v.u.uAxis.value.set(ax / l, ay / l);
    else v.u.uAxis.value.set(0, 1);
    v.s = -clamp(speed * 0.034, 0.14, 0.46);
    v.sv = 0;
    v.p = -clamp(speed * 0.03, 0.05, 0.38);
    v.pv = 0;
    v.jig = 0.026;
    v.flash = 1;
    v.vel.multiplyScalar(0.12);
    v.vel.z = 0;
    v.mode = 'stuck';
    v.state = 'alive';
    this.ctx.audio.play('squish', { pitch: 0.95 + Math.random() * 0.25, gain: 0.45, minGap: 25 });
    this.wobbleNeighbors(v, clamp(speed / 14, 0.35, 1));
    const col = new THREE.Color(THEMES[this.themeId]?.colors[v.colorIndex % THEMES[this.themeId].colors.length] ?? 0xff8fb8);
    const n = Math.round(10 * this.ctx.tempo.detail);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + Math.random() * 0.4;
      this.sparks.emit({
        x: v.pos.x + Math.cos(a) * 0.45 * v.size,
        y: v.pos.y + Math.sin(a) * 0.45 * v.size,
        z: 0.25,
        vx: Math.cos(a) * rand(1.2, 2.2),
        vy: Math.sin(a) * rand(1.2, 2.2) + 0.8,
        vz: rand(0.2, 0.9),
        life: rand(0.35, 0.6),
        size: rand(0.6, 1.1),
        color: col,
      });
    }
  }

  private syncTransform(v: JellyVisual) {
    v.body.position.copy(v.pos);
    v.body.scale.setScalar(v.size * v.shrink);
    v.body.rotation.z = v.rot;
    const u = v.u;
    u.uStretch.value = v.s;
    u.uBend.value = v.b;
    u.uPress.value = v.p;
    u.uJig.value = v.jig;
    u.uFlash.value = v.flash;
    // contact shadow on the board (fades while the letter is away from it)
    const away = Math.max(0, v.pos.z - v.slot.origin.z);
    const onBoard = v.mode !== 'detach' && v.mode !== 'pop' ? 1 : 0;
    v.shadow.position.set(v.pos.x + 0.08 + away * 0.15, v.pos.y - 0.1 - away * 0.1, BOARD_Z + 0.012);
    const ss = v.size * v.shrink * (1.25 + away * 0.25);
    v.shadow.scale.set(ss, ss * 1.15, 1);
    v.shadowMat.opacity = onBoard * clamp(0.32 - away * 0.09, 0, 0.32);
  }

  protected updateLetter(v: JellyVisual, dt: number, time: number): boolean {
    const H = 1 / 120;
    const steps = Math.min(8, Math.max(1, Math.ceil(dt / H)));
    const h = dt / steps;
    const target = this.targetOf(v, this.tmp);
    v.size = damp(v.size, v.slot.size, 10, dt);
    v.u.uTime.value = time;
    v.t += dt;

    // finale choreography
    if (v.hopIn >= 0) {
      v.hopIn -= dt;
      if (v.hopIn < 0) {
        v.vel.y += 6.2;
        v.u.uAxis.value.set(0, 1);
        v.s = 0.26;
        v.flash = 1;
        this.ctx.audio.play('pop', { pitch: 1.5 + v.slot.index * 0.04, gain: 0.25, minGap: 20 });
      }
    }
    if (v.collectIn >= 0) {
      v.collectIn -= dt;
      if (v.collectIn < 0) {
        v.mode = 'collect';
        v.vel.y += 1.5;
      }
    }

    for (let i = 0; i < steps; i++) {
      if (v.mode === 'fly') {
        const r = this.tmp2.subVectors(target, v.pos);
        const d = r.length();
        const a = Math.min(80, 32 / (d * d + 0.25)) / Math.max(d, 1e-4);
        v.vel.addScaledVector(r, a * h + 6 * h);
        v.vel.multiplyScalar(Math.exp(-1.6 * h));
        // field lines guide the letter: bleed off sideways (orbital) velocity
        if (d > 1e-4) {
          const along = v.vel.dot(r) / d;
          const keep = Math.exp(-7 * h);
          v.vel.x = (v.vel.x - (r.x / d) * along) * keep + (r.x / d) * along;
          v.vel.y = (v.vel.y - (r.y / d) * along) * keep + (r.y / d) * along;
          v.vel.z = (v.vel.z - (r.z / d) * along) * keep + (r.z / d) * along;
        }
        v.pos.addScaledVector(v.vel, h);
        v.rotV *= Math.exp(-4 * h);
        v.rot += v.rotV * h;
        v.rot = damp(v.rot, 0, 6, h);
        const sp = v.vel.length();
        if (Math.hypot(v.vel.x, v.vel.y) > 0.3) v.u.uAxis.value.set(v.vel.x, v.vel.y).normalize();
        v.s = damp(v.s, clamp(sp * 0.024, 0, 0.32), 14, h);
        const r2 = this.tmp2.subVectors(target, v.pos);
        if (r2.length() < 0.06 || (r2.dot(v.vel) < 0 && r2.length() < 0.5) || v.t > 1.4) {
          v.pos.z = target.z;
          if (v.t > 1.4) v.pos.copy(target);
          this.land(v);
        }
      } else if (v.mode === 'stuck') {
        const idx = v.slot.index;
        const bob = this.rowEnergy * 0.09 * v.size * Math.sin(time * 10.5 - idx * 0.75);
        const ax = (target.x - v.pos.x) * 210 - v.vel.x * 13;
        const ay = (target.y + bob - v.pos.y) * 210 - v.vel.y * 13;
        const az = (target.z - v.pos.z) * 210 - v.vel.z * 16;
        v.vel.x += ax * h;
        v.vel.y += ay * h;
        v.vel.z += az * h;
        v.pos.addScaledVector(v.vel, h);
        const sp = Math.hypot(v.vel.x, v.vel.y);
        if (sp > 1.2) v.u.uAxis.value.set(v.vel.x / sp, v.vel.y / sp);
        v.sv += (-300 * v.s - 7 * v.sv + sp * 0.5) * h;
        v.s += v.sv * h;
        v.rot = damp(v.rot, 0, 8, h);
      } else if (v.mode === 'detach') {
        v.vel.y -= 22 * h;
        v.vel.multiplyScalar(Math.exp(-0.4 * h));
        v.pos.addScaledVector(v.vel, h);
        v.rot += v.rotV * h;
        const half = 0.5 * v.size;
        if (v.pos.y - half < FLOOR_Y && v.vel.y < 0) {
          const vy = -v.vel.y;
          v.pos.y = FLOOR_Y + half;
          v.vel.y = vy * 0.48;
          v.vel.x *= 0.7;
          v.vel.z *= 0.6;
          v.rotV *= 0.5;
          v.u.uAxis.value.set(0, 1);
          v.s = -clamp(vy * 0.05, 0.12, 0.42);
          v.sv = 0;
          v.jig = 0.02;
          v.bounces++;
          this.ctx.audio.play('squish', { pitch: 1.1 + v.bounces * 0.2, gain: 0.3, minGap: 30 });
        }
        v.sv += (-300 * v.s - 7 * v.sv) * h;
        v.s += v.sv * h;
        if (v.bounces >= 2 || v.t > 1.6) {
          v.mode = 'pop';
          v.t = 0;
        }
      } else if (v.mode === 'collect') {
        const r = this.tmp2.subVectors(MAGNET, v.pos);
        const d = r.length();
        v.vel.addScaledVector(r, (Math.min(90, 40 / (d * d + 0.3)) / Math.max(d, 1e-4) + 5) * h);
        v.vel.multiplyScalar(Math.exp(-1.2 * h));
        v.pos.addScaledVector(v.vel, h);
        const sp = v.vel.length();
        if (Math.hypot(v.vel.x, v.vel.y) > 0.3) v.u.uAxis.value.set(v.vel.x, v.vel.y).normalize();
        v.s = damp(v.s, clamp(sp * 0.03, 0, 0.4), 12, h);
        v.shrink = clamp(d / 2.6, 0.08, 1);
        if (d < 0.35) {
          this.magnetGlow = 1;
          this.burst(MAGNET, v, 8);
          this.ctx.audio.play('pop', { pitch: 1.8, gain: 0.3, minGap: 25 });
          this.release(v);
          return true;
        }
      }
      // shared springs: bend + z-press + jiggle decay
      v.bv += (-170 * v.b - 5 * v.bv) * h;
      v.b += v.bv * h;
      v.pv += (-280 * v.p - 10 * v.pv) * h;
      v.p += v.pv * h;
    }
    v.jig *= Math.exp(-3.2 * dt);
    v.flash *= Math.exp(-4 * dt);

    if (v.mode === 'pop') {
      const k = clamp(v.t / 0.2);
      v.shrink = 1 - k * k;
      v.s = 0.3 * k;
      if (k >= 1) {
        this.burst(v.pos, v, 10);
        this.ctx.audio.play('pop', { pitch: 1.6, gain: 0.35, minGap: 25 });
        this.release(v);
        return true;
      }
    }

    // row rhythm on top of the springs
    let rs = 0;
    let rb = 0;
    if (v.mode === 'stuck' && this.rowEnergy > 0.003) {
      const ph = time * 10.5 - v.slot.index * 0.75;
      rs = this.rowEnergy * 0.07 * Math.sin(ph + 0.6);
      rb = this.rowEnergy * 0.05 * Math.cos(ph);
    }
    v.s += rs;
    v.b += rb;
    this.syncTransform(v);
    v.s -= rs;
    v.b -= rb;

    if (v.mode !== 'stuck') return true;
    return (
      v.hopIn >= 0 ||
      v.collectIn >= 0 ||
      v.vel.lengthSq() > 1e-5 ||
      Math.abs(v.s) > 2e-3 ||
      Math.abs(v.b) > 2e-3 ||
      Math.abs(v.p) > 2e-3 ||
      v.jig > 1e-3 ||
      v.flash > 0.01 ||
      Math.abs(v.size - v.slot.size) > 1e-3 ||
      v.pos.distanceToSquared(target) > 1e-6
    );
  }

  private burst(at: THREE.Vector3, v: JellyVisual, n: number) {
    const th = THEMES[this.themeId] ?? THEMES.jelly;
    const col = new THREE.Color(th.colors[v.colorIndex % th.colors.length]);
    const count = Math.max(3, Math.round(n * this.ctx.tempo.detail));
    for (let i = 0; i < count; i++) {
      this.sparks.emit({
        x: at.x + rand(-0.2, 0.2),
        y: at.y + rand(-0.2, 0.2),
        z: at.z + rand(-0.1, 0.2),
        vx: rand(-2.2, 2.2),
        vy: rand(0.5, 3),
        vz: rand(-0.5, 1.5),
        life: rand(0.4, 0.75),
        size: rand(0.7, 1.4),
        color: col,
      });
    }
  }

  protected updateWorld(dt: number, _t: number): boolean {
    let moving = this.placeCamera(false, dt);
    if (this.sparks.update(dt)) moving = true;
    if (this.rowEnergy > 0.003) {
      this.rowEnergy *= Math.exp(-0.9 * dt);
      moving = true;
    } else this.rowEnergy = 0;
    if (this.magnetGlow > 0.005) {
      this.magnetGlow *= Math.exp(-4 * dt);
      this.magnetMat.emissiveIntensity = this.magnetGlow * 0.6;
      this.magnet.position.y = MAGNET.y + 0.25 + Math.sin(this.time * 30) * 0.02 * this.magnetGlow;
      moving = true;
    }
    return moving;
  }

  disposeWorld(): void {
    this.disposed = true;
    this.sparks.dispose();
    super.disposeWorld();
    this.shadowGeo.dispose();
    this.ctx.scene.environment = null;
  }
}

export function create(ctx: WorldContext): WorldInstance {
  return new MagneticJelly(ctx);
}

export const magneticJelly: WorldModule = { create };

