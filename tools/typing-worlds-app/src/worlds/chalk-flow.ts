/**
 * WORLD 06 · Chalk Flow (粉笔黑板)
 *
 * A vintage classroom with a refined roller blackboard.
 * - Each letter is written by a visible stick of chalk that travels along the real
 *   Hershey strokes in stroke order (ToolController pen plan). Pen-up travel arcs off
 *   the board; pen-down leaves a grainy chalk line with pressure variation.
 * - Chalk dust falls where the tip touches the board (amount follows tip speed).
 * - A letter is "fresh" (brighter at the writing front) while drawn and only settles
 *   (dust puff, slight dimming) once its last stroke ends.
 * - Backspace: the felt eraser travels to that letter and rubs it out locally, leaving
 *   a faint smudge that fades.
 * - Enter: the board rolls up one line — the finished word becomes small board writing
 *   in the "notes" area above (left aligned, newest at the bottom), the chalk underlines
 *   it once saved, and older lines roll off the top. Several Enters build a word list
 *   written on the board.
 */
import * as THREE from 'three';
import type { DeleteEvent, InsertEvent, SaveOutcome, WorldContext, WorldModule } from '../engine/types';
import type { Slot } from '../engine/layout';
import { LetterWorld, type LetterVisual, canvasTexture, disposeObject } from '../engine/letter-world';
import { Particles } from '../engine/particles';
import { ToolController } from '../engine/tools';
import { clamp, damp, easeInOutCubic, easeOutCubic, rng } from '../engine/anim';
import type { Glyph, Stroke } from '../engine/glyphs/glyph-engine';

const THEMES: Record<string, { bg: number; board: number; wood: number; wall: number }> = {
  green: { bg: 0x1d2420, board: 0x3f6a50, wood: 0x5a3c1e, wall: 0x6b6450 },
  black: { bg: 0x151617, board: 0x34383b, wood: 0x40301f, wall: 0x55524a },
};

/* board geometry (world units) */
const BOARD_W = 15.2;
const BOARD_H = 7.9;
const BOARD_Y = 0.62;
const BOARD_TOP = BOARD_Y + BOARD_H / 2;
const TRAY_Y = BOARD_Y - BOARD_H / 2 - 0.12;
const WRITE_Y = -1.55; // active writing line (layout origin)
const NOTES_BASE = 0.35; // baseline of the newest board-writing line
const NOTES_LEFT = -6.7;
const NOTES_SCALE = 0.62;
const CHALK_REST = new THREE.Vector3(4.6, TRAY_Y + 0.1, 0.32);
const ERASER_REST = new THREE.Vector3(-4.8, TRAY_Y + 0.2, 0.3);

interface ChalkVisual extends LetterVisual {
  mat: THREE.ShaderMaterial;
  mesh: THREE.Mesh;
  settle: number;
}

interface BoardLine {
  group: THREE.Group;
  letters: ChalkVisual[];
  height: number;
  width: number;
  y: number;
  targetY: number;
  fade: number;
  dying: boolean;
  underline: { mesh: THREE.Mesh; mat: THREE.ShaderMaterial } | null;
  rolling: boolean;
}

interface EraseJob {
  v: ChalkVisual;
  t: number;
  dur: number;
  center: THREE.Vector3;
  size: number;
}

interface Smudge {
  mesh: THREE.Mesh;
  mat: THREE.MeshBasicMaterial;
  t: number;
}

/* ------------------------------------------------------------------ shader */

const CHALK_VERT = /* glsl */ `
  attribute float aU; attribute float aSide; attribute float aLen;
  varying float vU; varying float vSide; varying float vLen; varying vec2 vP;
  void main(){
    vU = aU; vSide = aSide; vLen = aLen; vP = position.xy;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
  }`;

const CHALK_FRAG = /* glsl */ `
  uniform float uProgress; uniform float uErase; uniform float uSettle; uniform float uSeed;
  uniform float uAlpha; uniform vec3 uColor;
  varying float vU; varying float vSide; varying float vLen; varying vec2 vP;
  float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
  float vnoise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
    return mix(mix(hash(i),hash(i+vec2(1,0)),f.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x), f.y); }
  void main(){
    if (vU > uProgress) discard;
    // pressure: slow variation along the stroke length
    float pressure = 0.62 + 0.38 * vnoise(vec2(vLen * 2.6 + uSeed, uSeed * 0.37));
    // grain: the board's tooth makes chalk skip
    float grain = vnoise(vP * 70.0 + uSeed) * 0.55 + hash(floor(vP * 240.0)) * 0.45;
    float rough = (vnoise(vec2(vLen * 34.0, uSeed)) - 0.5) * 0.55;
    float edge = 1.0 - smoothstep(0.45, 1.0, abs(vSide) + rough);
    float a = edge * smoothstep(0.62 - pressure * 0.5, 0.95 - pressure * 0.35, grain + pressure * 0.25);
    // fresh chalk right behind the writing front is brighter
    float fresh = smoothstep(0.12, 0.0, uProgress - vU) * (1.0 - uSettle);
    // eraser: noisy wipe
    float wipe = uErase * 1.35 - vnoise(vP * 5.0 + uSeed) * 0.35;
    a *= 1.0 - smoothstep(0.0, 0.55, wipe);
    a *= uAlpha * (0.9 + 0.1 * uSettle);
    if (a < 0.02) discard;
    gl_FragColor = vec4(uColor * (0.92 + fresh * 0.25), a);
  }`;

function chalkMaterial(seed: number, color: THREE.ColorRepresentation = 0xf3f1e8) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uProgress: { value: 0 },
      uErase: { value: 0 },
      uSettle: { value: 0 },
      uSeed: { value: seed },
      uAlpha: { value: 1 },
      uColor: { value: new THREE.Color(color) },
    },
    vertexShader: CHALK_VERT,
    fragmentShader: CHALK_FRAG,
    transparent: true,
    depthWrite: false,
  });
}

/** Build a pseudo-glyph (a single wavy stroke) so the chalk can draw underlines. */
function lineGlyph(len: number, seed: number): Glyph {
  const r = rng(seed);
  const pts: number[] = [];
  const n = Math.max(2, Math.ceil(len / 0.025));
  const ph = r() * 6;
  for (let i = 0; i <= n; i++) {
    const x = (i / n) * len;
    pts.push(x, Math.sin(x * 1.3 + ph) * 0.035 + (x / len) * 0.04);
  }
  const cum = new Float32Array(n + 1);
  for (let i = 1; i <= n; i++) cum[i] = cum[i - 1] + Math.hypot(pts[i * 2] - pts[i * 2 - 2], pts[i * 2 + 1] - pts[i * 2 - 1]);
  const stroke: Stroke = { pts: new Float32Array(pts), cum, length: cum[n] };
  return { char: '_', font: 'sans', advance: len, strokes: [stroke], length: stroke.length, bounds: { minX: 0, maxX: len, minY: -0.05, maxY: 0.08 } };
}

function fakeSlot(origin: THREE.Vector3, size: number, advance: number): Slot {
  return { id: -1, index: 0, char: '_', line: 0, origin: origin.clone(), center: origin.clone(), size, advance, plane: 'xy' };
}

/* ------------------------------------------------------------------- world */

class ChalkFlow extends LetterWorld<ChalkVisual> {
  private T = THREE;
  private themeId: string;
  private dust: Particles;
  private controller: ToolController;
  private chalk = new THREE.Group();
  private eraser = new THREE.Group();
  private eraserPos = ERASER_REST.clone();
  private eraserIdle = 10;
  private erases: EraseJob[] = [];
  private smudges: Smudge[] = [];
  private lines: BoardLine[] = [];
  private boardTex: THREE.CanvasTexture;
  private bannerTex: THREE.CanvasTexture;
  private smearTex: THREE.CanvasTexture;
  private boardMat: THREE.MeshStandardMaterial;
  private woodMat: THREE.MeshStandardMaterial;
  private wallMat: THREE.MeshStandardMaterial;
  private smearGeo = new THREE.PlaneGeometry(1, 1);
  private boardScroll = 0;
  private boardScrollTarget = 0;
  private lastAspect = 0;
  private notesLeft = NOTES_LEFT;
  private prevLayout: import('../engine/layout').LayoutOptions;
  private chalkAudioT = 0;
  private tmp = new THREE.Vector3();
  private tmp2 = new THREE.Vector3();
  private chalkDir = new THREE.Vector3(0.38, -0.5, 0.78).normalize();
  private up = new THREE.Vector3(0, 1, 0);

  constructor(ctx: WorldContext) {
    super(ctx);
    const T = this.T;
    this.themeId = THEMES[ctx.theme] ? ctx.theme : 'green';
    const th = THEMES[this.themeId];
    this.prevLayout = { ...ctx.layout.opts };
    ctx.layout.setOptions({ origin: [0, WRITE_Y, 0.02], maxLines: 2, lineHeight: 1.45, size: 1.1, tracking: 0.12, plane: 'xy', metric: 'sans' });

    ctx.scene.background = new T.Color(th.bg);
    ctx.scene.fog = new T.Fog(th.bg, 24, 60);
    this.root.add(new T.AmbientLight(0xfff1dc, 0.75));
    const key = new T.DirectionalLight(0xfff0d8, 1.35);
    key.position.set(-6, 9, 9);
    this.root.add(key);
    const lamp = new T.PointLight(0xffd9a0, 18, 26, 1.6);
    lamp.position.set(3, 6.5, 5);
    this.root.add(lamp);

    // classroom wall + wainscot
    this.wallMat = new T.MeshStandardMaterial({ color: th.wall, roughness: 0.95 });
    const wall = new T.Mesh(new T.PlaneGeometry(60, 30), this.wallMat);
    wall.position.set(0, 2, -0.35);
    this.root.add(wall);
    this.woodMat = new T.MeshStandardMaterial({ color: th.wood, roughness: 0.62, metalness: 0.05 });
    const wainscot = new T.Mesh(new T.BoxGeometry(60, 3.2, 0.2), this.woodMat);
    wainscot.position.set(0, -6.4, -0.25);
    this.root.add(wainscot);

    // blackboard surface (scrolls on Enter like a roller board)
    this.boardTex = canvasTexture(1024, 600, (g, w, h) => {
      g.fillStyle = '#c4c4c4';
      g.fillRect(0, 0, w, h);
      const r = rng(7);
      for (let i = 0; i < 26; i++) {
        // ghost smears of old lessons
        g.save();
        g.translate(r() * w, r() * h);
        g.rotate((r() - 0.5) * 0.5);
        g.fillStyle = `rgba(255,255,255,${0.012 + r() * 0.025})`;
        g.beginPath();
        g.ellipse(0, 0, 60 + r() * 160, 10 + r() * 26, 0, 0, Math.PI * 2);
        g.fill();
        g.restore();
      }
      for (let i = 0; i < 36000; i++) {
        g.fillStyle = `rgba(255,255,255,${r() * 0.05})`;
        g.fillRect(r() * w, r() * h, 1.4, 1.4);
      }
      for (let i = 0; i < 12000; i++) {
        g.fillStyle = `rgba(0,0,0,${r() * 0.12})`;
        g.fillRect(r() * w, r() * h, 1.6, 1.6);
      }
    });
    this.boardTex.wrapT = T.RepeatWrapping;
    this.boardMat = new T.MeshStandardMaterial({ map: this.boardTex, color: th.board, roughness: 0.95, metalness: 0 });
    const board = new T.Mesh(new T.PlaneGeometry(BOARD_W, BOARD_H), this.boardMat);
    board.position.set(0, BOARD_Y, -0.04);
    this.root.add(board);

    // frame + chalk tray
    const fw = 0.34;
    const mk = (w: number, h: number, d: number, x: number, y: number, z: number) => {
      const m = new T.Mesh(new T.BoxGeometry(w, h, d), this.woodMat);
      m.position.set(x, y, z);
      this.root.add(m);
      return m;
    };
    mk(BOARD_W + fw * 2, fw, 0.26, 0, BOARD_TOP + fw / 2, 0.04);
    mk(BOARD_W + fw * 2, fw, 0.26, 0, BOARD_Y - BOARD_H / 2 - fw / 2, 0.04);
    mk(fw, BOARD_H, 0.26, -BOARD_W / 2 - fw / 2, BOARD_Y, 0.04);
    mk(fw, BOARD_H, 0.26, BOARD_W / 2 + fw / 2, BOARD_Y, 0.04);
    mk(BOARD_W + 0.4, 0.08, 0.62, 0, TRAY_Y - 0.12, 0.3); // tray shelf
    mk(BOARD_W + 0.4, 0.14, 0.05, 0, TRAY_Y - 0.06, 0.6); // tray lip

    // spare chalk on the tray
    const spareMat = new T.MeshStandardMaterial({ color: 0xf2efe6, roughness: 0.95 });
    const spareCol = [0xf2efe6, 0xf7e7a1, 0xf3c0c8];
    spareCol.forEach((c, i) => {
      const m = new T.Mesh(new T.CylinderGeometry(0.05, 0.05, 0.42 - i * 0.08, 10), i ? new T.MeshStandardMaterial({ color: c, roughness: 0.95 }) : spareMat);
      m.rotation.z = Math.PI / 2;
      m.rotation.y = 0.2 * (i - 1);
      m.position.set(5.6 + i * 0.5, TRAY_Y + 0.0, 0.32);
      this.root.add(m);
    });

    // alphabet banner above the board (vintage classroom cue)
    this.bannerTex = canvasTexture(2048, 128, (g, w, h) => {
      g.fillStyle = '#e9dfc4';
      g.fillRect(0, 0, w, h);
      g.strokeStyle = '#b13d2f';
      g.lineWidth = 6;
      g.strokeRect(6, 6, w - 12, h - 12);
      g.fillStyle = '#2b3a55';
      g.font = 'italic 64px Georgia, serif';
      g.textBaseline = 'middle';
      const s = 'Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Oo Pp Qq Rr Ss Tt';
      g.textAlign = 'center';
      g.fillText(s, w / 2, h / 2 + 4);
    });
    const banner = new T.Mesh(new T.PlaneGeometry(BOARD_W, BOARD_W / 16), new T.MeshStandardMaterial({ map: this.bannerTex, roughness: 0.9 }));
    banner.position.set(0, BOARD_TOP + 0.95, -0.2);
    this.root.add(banner);

    // chalk dust
    this.dust = new Particles({ capacity: ctx.quality === 0 ? 500 : 1000, gravity: [0, -1.6, 0], drag: 2.2, size: 0.035, shape: 'flake', blending: THREE.NormalBlending, opacity: 0.85 });
    this.root.add(this.dust.points);

    // the chalk stick: worn conical tip at origin, body along +Y
    const prof: THREE.Vector2[] = [
      new T.Vector2(0.0, 0),
      new T.Vector2(0.03, 0.006),
      new T.Vector2(0.052, 0.04),
      new T.Vector2(0.058, 0.09),
      new T.Vector2(0.058, 0.7),
      new T.Vector2(0.05, 0.72),
      new T.Vector2(0.0, 0.72),
    ];
    const stick = new T.Mesh(new T.LatheGeometry(prof, 14), new T.MeshStandardMaterial({ color: 0xf6f4ec, roughness: 0.97 }));
    const holder = new T.Group();
    holder.add(stick);
    this.chalk.add(holder);
    this.chalk.userData.holder = holder;
    this.chalk.position.copy(CHALK_REST);
    this.root.add(this.chalk);

    // felt eraser
    const eraserWood = new T.MeshStandardMaterial({ color: 0xa8763f, roughness: 0.55 });
    const eWood = new T.Mesh(new T.BoxGeometry(0.95, 0.38, 0.2), eraserWood);
    eWood.position.z = 0.13;
    const eFelt = new T.Mesh(new T.BoxGeometry(0.95, 0.38, 0.08), new T.MeshStandardMaterial({ color: 0x3b3a3f, roughness: 1 }));
    eFelt.position.z = 0.0;
    const eTop = new T.Mesh(new T.BoxGeometry(0.7, 0.2, 0.08), new T.MeshStandardMaterial({ color: 0x2f4a7a, roughness: 0.7 }));
    eTop.position.z = 0.26;
    this.eraser.add(eWood, eFelt, eTop);
    this.eraser.position.copy(ERASER_REST);
    this.eraser.rotation.x = -0.35; // tilted so its back and felt edge read clearly
    this.root.add(this.eraser);

    this.smearTex = canvasTexture(128, 64, (g, w, h) => {
      const gr = g.createRadialGradient(w / 2, h / 2, 2, w / 2, h / 2, w / 2);
      gr.addColorStop(0, 'rgba(255,255,255,0.9)');
      gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr;
      g.save();
      g.scale(1, h / w);
      g.fillRect(0, 0, w, w);
      g.restore();
    });

    this.controller = new ToolController(ctx.glyphs, ctx.layout, {
      count: 1,
      liftHeight: 0.3,
      maxQueue: 2,
      approach: 0.16,
      rest: () => CHALK_REST.clone(),
      restDelay: 1.1,
    });
  }

  /* ------------------------------------------------------------ letters */

  protected createLetter(ev: InsertEvent, slot: Slot): ChalkVisual | null {
    if (!ev.char.trim()) return null;
    const glyph = this.ctx.glyphs.get(ev.char, 'sans');
    const r = rng(ev.id * 7919 + 13);
    const p0 = 0.8 + r() * 0.25;
    const geo = this.ctx.glyphs.ribbon(glyph, 0.095, (u, su) => p0 * (0.82 + 0.22 * Math.sin(su * Math.PI)) * (0.9 + 0.2 * Math.sin(u * 17 + r() * 0.2)));
    const mat = chalkMaterial(r() * 100);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.renderOrder = 2;
    const group = new THREE.Group();
    group.add(mesh);
    this.ctx.layout.apply(group, slot);
    group.position.z += 0.002 * (ev.id % 7);
    this.root.add(group);
    const v: ChalkVisual = { ref: ev, slot, object: group, state: 'creating', age: 0, mat, mesh, settle: 0 };
    if (ev.restoring || this.ctx.reducedMotion) {
      mat.uniforms.uProgress.value = 1;
      mat.uniforms.uSettle.value = 1;
      v.settle = 1;
      v.state = 'alive';
      return v;
    }
    this.controller.write({
      id: ev.id,
      glyph,
      slot,
      duration: this.ctx.tempo.duration(680, 220) * (0.65 + glyph.length * 0.13),
      onProgress: (s, tip) => {
        mat.uniforms.uProgress.value = Math.max(mat.uniforms.uProgress.value, s.u);
        if (tip && s.down) this.chalkContact(tip);
      },
      onDone: () => this.settleLetter(v),
    });
    this.ctx.keepAlive(1500);
    return v;
  }

  private chalkContact(tip: THREE.Vector3) {
    const tool = this.controller.tools[0];
    const speed = tool.vel.length();
    const detail = this.ctx.tempo.detail * (this.ctx.quality === 0 ? 0.5 : 1);
    const n = Math.min(3, speed * 0.06 * detail + (Math.random() < 0.5 * detail ? 1 : 0));
    for (let i = 0; i < n; i++) {
      this.dust.emit({
        x: tip.x + (Math.random() - 0.5) * 0.04,
        y: tip.y + (Math.random() - 0.5) * 0.04,
        z: tip.z + 0.03,
        vx: (Math.random() - 0.5) * 0.25 - tool.vel.x * 0.02,
        vy: -0.15 - Math.random() * 0.3,
        vz: 0.05 + Math.random() * 0.15,
        life: 0.7 + Math.random() * 0.7,
        size: 0.6 + Math.random() * 0.9,
        color: 0xeeece4,
      });
    }
    this.chalkAudioT -= 1;
    if (this.chalkAudioT <= 0) {
      this.ctx.audio.play('chalk', { pitch: 0.9 + Math.random() * 0.25, gain: 0.32, minGap: 0.07 });
      this.chalkAudioT = 4;
    }
  }

  private settleLetter(v: ChalkVisual) {
    v.mat.uniforms.uProgress.value = 1;
    if (v.state === 'creating') v.state = 'alive';
    this.tweens.add(0.35, (k) => (v.mat.uniforms.uSettle.value = v.settle = k));
    // settle puff: a little dust drops from the bottom of the letter
    const s = v.slot;
    const n = Math.round(6 * this.ctx.tempo.detail);
    for (let i = 0; i < n; i++) {
      this.ctx.layout.toWorld(s, Math.random() * (s.advance / s.size), Math.random() * 0.3, 0.05, this.tmp);
      this.dust.emit({ x: this.tmp.x, y: this.tmp.y, z: this.tmp.z, vx: (Math.random() - 0.5) * 0.1, vy: -0.2, vz: 0.04, life: 0.9 + Math.random() * 0.5, size: 0.7, color: 0xe8e6de });
    }
  }

  protected removeLetter(v: ChalkVisual, ev: DeleteEvent): void {
    this.controller.cancel(v.ref.id);
    const s = v.slot;
    const center = this.ctx.layout.toWorld(s, s.advance / s.size / 2, 0.5, 0, new THREE.Vector3());
    const dur = (this.ctx.reducedMotion ? 0.25 : 0.55) * (ev.burstSize > 3 ? 0.6 : 1);
    this.erases.push({ v, t: 0, dur, center, size: s.size });
    this.eraserIdle = 0;
    this.ctx.audio.play('erase', { pitch: 1 + Math.random() * 0.15, gain: 0.5, minGap: 0.1 });
    this.ctx.keepAlive(1600);
  }

  protected updateLetter(v: ChalkVisual, dt: number): boolean {
    if (v.state === 'creating' || v.state === 'alive') {
      const o = v.object;
      const s = v.slot;
      if (v.state === 'creating') {
        o.position.x = s.origin.x;
        o.position.y = s.origin.y;
        o.scale.setScalar(s.size);
        return true;
      }
      const dx = s.origin.x - o.position.x;
      const dy = s.origin.y - o.position.y;
      if (Math.abs(dx) + Math.abs(dy) + Math.abs(s.size - o.scale.x) > 1e-4) {
        o.position.x = damp(o.position.x, s.origin.x, 16, dt);
        o.position.y = damp(o.position.y, s.origin.y, 16, dt);
        o.scale.setScalar(damp(o.scale.x, s.size, 16, dt));
        return true;
      }
    }
    return false;
  }

  /* ------------------------------------------------------------- finale */

  protected playFinale(_word: string, visuals: ChalkVisual[], saved: Promise<SaveOutcome>): void {
    this.controller.flush();
    for (const v of visuals) {
      v.mat.uniforms.uProgress.value = 1;
      v.mat.uniforms.uSettle.value = 1;
    }
    if (!visuals.length) return;
    // word bounds (world) — glyph cells
    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity;
    for (const v of visuals) {
      const s = v.slot;
      minX = Math.min(minX, s.origin.x);
      maxX = Math.max(maxX, s.origin.x + s.advance);
      minY = Math.min(minY, s.origin.y - 0.3 * s.size);
      maxY = Math.max(maxY, s.origin.y + s.size);
    }
    const group = new THREE.Group();
    // pivot: left edge, bottom of the block
    group.position.set(minX, minY + 0.3 * visuals[0].slot.size, 0.02);
    this.root.add(group);
    for (const v of visuals) {
      v.object.position.copy(v.slot.origin);
      v.object.scale.setScalar(v.slot.size);
      group.attach(v.object);
    }
    const width = maxX - minX;
    const height = maxY - minY;
    const line: BoardLine = { group, letters: visuals, height: height * NOTES_SCALE, width, y: group.position.y, targetY: NOTES_BASE, fade: 1, dying: false, underline: null, rolling: true };
    // roll the board: everything moves up by this line's height + gap
    const step = line.height + 0.42;
    for (const l of this.lines) {
      l.targetY += step;
      if (l.targetY + l.height > BOARD_TOP - 0.25) l.dying = true;
    }
    this.boardScrollTarget += step / BOARD_H;
    this.lines.push(line);
    const startX = group.position.x;
    const startY = group.position.y;
    const dur = this.ctx.reducedMotion ? 0.2 : 0.75;
    this.tweens.add(dur, (k) => {
      const e = easeInOutCubic(k);
      group.position.x = startX + (this.notesLeft - startX) * e;
      line.y = startY + (line.targetY - startY) * e;
      group.scale.setScalar(1 + (NOTES_SCALE - 1) * e);
    }, { done: () => { line.y = line.targetY; line.rolling = false; } });
    line.y = startY;
    this.ctx.audio.play('whoosh', { pitch: 0.7, gain: 0.25 });
    this.ctx.keepAlive(2200);

    // once saved, the chalk underlines the word
    const wait = new Promise<void>((res) => this.ctx.setTimeout(res, dur * 1000 + 60));
    Promise.all([saved, wait]).then(([res]) => {
      if (!this.lines.includes(line) || line.dying) return;
      if (res.ok) this.underline(line, !!res.duplicate);
      else {
        line.dying = true;
        this.ctx.audio.play('error', { gain: 0.4 });
      }
    });
  }

  private underline(line: BoardLine, duplicate: boolean) {
    const len = line.width / 1 + 0.1; // group-local units (pre-scale)
    const glyph = lineGlyph(len, line.letters[0]?.ref.id ?? 1);
    const geo = this.ctx.glyphs.ribbon(glyph, 0.07);
    const mat = chalkMaterial(Math.random() * 50, duplicate ? 0xf7e7a1 : 0xf3f1e8);
    mat.uniforms.uSettle.value = 1;
    const mesh = new THREE.Mesh(geo, mat);
    const lsize = line.letters[0]?.slot.size ?? 1;
    mesh.position.set(-0.05, -0.22 * lsize, 0);
    line.group.add(mesh);
    line.underline = { mesh, mat };
    const origin = new THREE.Vector3();
    mesh.getWorldPosition(origin);
    const slot = fakeSlot(origin, line.group.scale.x, len * line.group.scale.x);
    this.controller.write({
      id: -1000 - (line.letters[0]?.ref.id ?? 0),
      glyph,
      slot,
      duration: this.ctx.tempo.duration(420, 220),
      onProgress: (s, tip) => {
        mat.uniforms.uProgress.value = s.u;
        if (tip && s.down) this.chalkContact(tip);
      },
      onDone: () => (mat.uniforms.uProgress.value = 1),
    });
    this.ctx.audio.play('success', { gain: 0.5 });
    this.ctx.keepAlive(1500);
  }

  /* ------------------------------------------------------------- world */

  protected updateWorld(dt: number, time: number): boolean {
    let moving = false;
    this.responsive();
    if (this.dust.update(dt, time)) moving = true;
    if (this.controller.update(dt)) moving = true;

    // chalk pose: tip at tool tip, body angled toward the writer's hand
    const tool = this.controller.tools[0];
    this.chalk.position.copy(tool.tip);
    const holder = this.chalk.userData.holder as THREE.Group;
    this.tmp.copy(this.chalkDir);
    if (tool.down) {
      // lean slightly against the direction of motion (drag)
      this.tmp.x -= clamp(tool.vel.x * 0.025, -0.25, 0.25);
      this.tmp.y -= clamp(tool.vel.y * 0.025, -0.25, 0.25);
    } else {
      this.tmp.y += 0.15 * tool.lift;
    }
    this.tmp.normalize();
    if (tool.idle > 1.4) {
      // lying on the tray
      this.tmp2.set(1, 0.02, 0.05).normalize();
      const k = clamp((tool.idle - 1.4) * 1.5);
      this.tmp.lerp(this.tmp2, k).normalize();
    }
    holder.quaternion.setFromUnitVectors(this.up, this.tmp);
    if (tool.job) moving = true;

    // eraser jobs
    let active: EraseJob | null = null;
    for (let i = this.erases.length - 1; i >= 0; i--) {
      const j = this.erases[i];
      j.t += dt;
      const k = clamp(j.t / j.dur);
      j.v.mat.uniforms.uErase.value = easeOutCubic(k);
      if (!active) active = j;
      if (Math.random() < 0.6 * this.ctx.tempo.detail) {
        this.dust.emit({
          x: j.center.x + (Math.random() - 0.5) * 0.7 * j.size,
          y: j.center.y - 0.2 * j.size,
          z: 0.08,
          vx: (Math.random() - 0.5) * 0.3,
          vy: -0.3 - Math.random() * 0.4,
          vz: 0.1,
          life: 0.9,
          size: 1,
          color: 0xdcdad2,
        });
      }
      if (k >= 1) {
        this.erases.splice(i, 1);
        this.addSmudge(j.center, j.size);
        this.release(j.v);
      }
    }
    if (active) {
      const k = clamp(active.t / active.dur);
      const rub = Math.sin(k * Math.PI * 6) * 0.32 * active.size;
      this.tmp.set(active.center.x + rub, active.center.y + Math.sin(k * Math.PI * 3) * 0.08 * active.size, 0.06);
      this.eraserPos.lerp(this.tmp, 1 - Math.exp(-(k < 0.15 ? 14 : 30) * dt));
      this.eraser.rotation.z = rub * 0.15;
      this.eraserIdle = 0;
      moving = true;
    } else {
      this.eraserIdle += dt;
      if (this.eraserIdle > 0.6) {
        if (this.eraserPos.distanceTo(ERASER_REST) > 0.003) {
          this.eraserPos.lerp(ERASER_REST, 1 - Math.exp(-4 * dt));
          this.eraser.rotation.z = damp(this.eraser.rotation.z, 0, 6, dt);
          moving = true;
        }
      } else moving = true;
    }
    this.eraser.position.copy(this.eraserPos);

    // smudges fade
    for (let i = this.smudges.length - 1; i >= 0; i--) {
      const s = this.smudges[i];
      s.t += dt;
      s.mat.opacity = 0.09 * (1 - clamp(s.t / 2.6));
      if (s.t >= 2.6) {
        disposeObject(s.mesh);
        this.smudges.splice(i, 1);
      } else moving = true;
    }

    // board-writing lines roll / fade
    for (let i = this.lines.length - 1; i >= 0; i--) {
      const l = this.lines[i];
      if (!l.rolling) {
        const ny = damp(l.y, l.targetY, 7, dt);
        if (Math.abs(ny - l.targetY) > 1e-4) moving = true;
        l.y = ny;
      }
      l.group.position.y = l.y;
      if (l.dying) {
        l.fade -= dt * 1.6;
        const a = clamp(l.fade);
        for (const v of l.letters) v.mat.uniforms.uAlpha.value = a;
        if (l.underline) l.underline.mat.uniforms.uAlpha.value = a;
        moving = true;
        if (l.fade <= 0) {
          for (const v of l.letters) this.release(v);
          disposeObject(l.group);
          this.lines.splice(i, 1);
        }
      }
    }
    // board texture scroll
    if (Math.abs(this.boardScroll - this.boardScrollTarget) > 1e-5) {
      this.boardScroll = damp(this.boardScroll, this.boardScrollTarget, 5, dt);
      this.boardTex.offset.y = -this.boardScroll;
      moving = true;
    }
    return moving;
  }

  private addSmudge(center: THREE.Vector3, size: number) {
    const mat = new THREE.MeshBasicMaterial({ map: this.smearTex, transparent: true, opacity: 0.09, depthWrite: false });
    const mesh = new THREE.Mesh(this.smearGeo, mat);
    mesh.position.set(center.x, center.y, 0.0);
    mesh.scale.set(1.3 * size, 0.8 * size, 1);
    mesh.rotation.z = (Math.random() - 0.5) * 0.4;
    mesh.renderOrder = 1;
    this.root.add(mesh);
    this.smudges.push({ mesh, mat, t: 0 });
  }

  private responsive() {
    const cam = this.ctx.camera;
    if (cam.aspect === this.lastAspect) return;
    this.lastAspect = cam.aspect;
    const ht = Math.tan(((cam.fov * Math.PI) / 180) / 2);
    const wide = 2 * ht * cam.aspect;
    // show the whole board on wide screens, the writing area on narrow ones
    // fit the board width, and its height incl. tray (UI bars cover ~20% of the canvas)
    const dist = clamp(Math.max((BOARD_W + 0.8) / wide, (BOARD_H + 0.9) / (0.8 * 2 * ht)), 11.5, 22);
    cam.position.set(0, BOARD_Y - 0.05, dist);
    cam.lookAt(0, BOARD_Y - 0.15, 0);
    const visW = wide * dist;
    const maxW = clamp(visW * 0.84, 5, 10.6);
    this.notesLeft = Math.max(NOTES_LEFT, -visW / 2 + 0.35);
    if (Math.abs(maxW - this.ctx.layout.opts.maxWidth) > 0.05) {
      this.ctx.layout.setOptions({ maxWidth: maxW });
      this.ctx.layout.compute(this.ctx.letters());
    }
  }

  setTheme(id: string) {
    if (!THEMES[id]) return;
    this.themeId = id;
    const th = THEMES[id];
    this.ctx.scene.background = new THREE.Color(th.bg);
    (this.ctx.scene.fog as THREE.Fog | null)?.color.set(th.bg);
    this.woodMat.color.set(th.wood);
    this.wallMat.color.set(th.wall);
    // re-tint the board surface without redrawing the texture
    this.boardMat.color.set(th.board);
    this.ctx.keepAlive(300);
  }

  disposeWorld(): void {
    this.controller.flush();
    for (const s of this.smudges) disposeObject(s.mesh);
    this.smudges = [];
    this.erases = [];
    this.lines = [];
    this.dust.dispose();
    this.smearGeo.dispose();
    this.boardTex.dispose();
    this.bannerTex.dispose();
    this.smearTex.dispose();
    super.disposeWorld();
    this.ctx.layout.setOptions(this.prevLayout);
    this.ctx.scene.fog = null;
  }
}

export function create(ctx: WorldContext) {
  return new ChalkFlow(ctx);
}

export const chalkFlow: WorldModule = { create };
