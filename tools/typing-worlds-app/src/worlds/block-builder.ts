/**
 * WORLD 18 · Block Builder (方块建造)
 *
 * A construction site: every letter is a real 3D build, two blocks deep.
 * - A translucent blueprint of the letter appears first.
 * - Blocks fly in from all around (sides, behind, above) along curved paths, tumbling,
 *   hover over their cell, then drop and lock in with a flash and a click.
 *   Build order is bottom-up / back-to-front, so blocks always stack on blocks below.
 * - Backspace unlocks the letter: blocks pop loose, tumble, bounce on the plate and vanish.
 * - Enter: a light wave runs through the finished word, then it disassembles into the sky.
 * Each block keeps its own position, rotation and state; everything is one InstancedMesh per letter.
 */
import * as THREE from 'three';
import { LetterWorld, type LetterVisual, canvasTexture } from '../engine/letter-world';
import { clamp, lerp, rand, easeInOutCubic, easeOutCubic } from '../engine/anim';
import { Particles } from '../engine/particles';
import type { Slot } from '../engine/layout';
import type { DeleteEvent, InsertEvent, SaveOutcome, WorldContext, WorldModule } from '../engine/types';

const THEMES: Record<string, { color: number; rough: number; metal: number; ghost: number }> = {
  diamond: { color: 0x5ff0f2, rough: 0.12, metal: 0.25, ghost: 0x58c8ff },
  gold: { color: 0xffcf3a, rough: 0.22, metal: 0.75, ghost: 0xffd27a },
  emerald: { color: 0x2fd468, rough: 0.15, metal: 0.2, ghost: 0x7dffb0 },
  stone: { color: 0x9a968e, rough: 0.85, metal: 0.0, ghost: 0xb8c8d8 },
};

const CELL = 0.13; // glyph units
const THICK = 0.085;
const LAYERS = 2;
const GROUND = -1.35;

type CellState = 'wait' | 'fly' | 'drop' | 'locked' | 'loose' | 'gone';

interface Cell {
  gx: number;
  gy: number;
  gz: number;
  state: CellState;
  delay: number;
  t: number;
  dur: number;
  from: THREE.Vector3;
  ctrl: THREE.Vector3;
  q0: THREE.Quaternion;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  rot: THREE.Quaternion;
  spin: THREE.Vector3;
  flash: number;
  shade: number;
  scale: number;
  bounced: number;
}

interface BuildVisual extends LetterVisual {
  mesh: THREE.InstancedMesh;
  ghost: THREE.InstancedMesh;
  cells: Cell[];
  locked: number;
  finaleT: number;
  finaleDelay: number;
  dirty: boolean;
  lastKey: string;
}

class BlockBuilderWorld extends LetterWorld<BuildVisual> {
  private boxGeo: THREE.BoxGeometry;
  private blockMat: THREE.MeshStandardMaterial;
  private ghostMat: THREE.MeshBasicMaterial;
  private faceTex: THREE.Texture;
  private plateTex: THREE.Texture;
  private sparks: Particles;
  private dust: Particles;
  private dummy = new THREE.Object3D();
  private tmp = new THREE.Vector3();
  private col = new THREE.Color();
  private white = new THREE.Color(0xffffff);
  private identity = new THREE.Quaternion();
  private theme: string;
  private lockSounds = 0;

  constructor(ctx: WorldContext) {
    super(ctx);
    this.theme = THEMES[ctx.theme] ? ctx.theme : 'diamond';
    const scene = ctx.scene;
    // classic 3D Type stage: near-black, one dark build plate, the blocks are the only bright things
    scene.background = new THREE.Color(0x020203);
    scene.fog = new THREE.Fog(0x020203, 13, 30);

    ctx.camera.position.set(0, 1.6, 11);
    ctx.camera.lookAt(0, -0.1, 0);

    this.root.add(new THREE.HemisphereLight(0xdfe6ff, 0x0a0806, 0.35));
    const sun = new THREE.DirectionalLight(0xfff3dd, 1.7);
    sun.position.set(-6, 12, 9);
    if (ctx.quality > 1) {
      sun.castShadow = true;
      sun.shadow.mapSize.set(1024, 1024);
      const c = sun.shadow.camera as THREE.OrthographicCamera;
      c.left = -9;
      c.right = 9;
      c.top = 6;
      c.bottom = -4;
      c.near = 1;
      c.far = 40;
      sun.shadow.bias = -0.0008;
    }
    this.root.add(sun);
    scene.environment = ctx.renderer.environment();
    scene.environmentIntensity = 0.5;

    // block face: bevelled frame + inner facets (original pattern)
    this.faceTex = canvasTexture(128, 128, (g, w, h) => {
      g.fillStyle = '#d9d9d9';
      g.fillRect(0, 0, w, h);
      const b = 14;
      g.fillStyle = '#ffffff';
      g.beginPath();
      g.moveTo(0, 0);
      g.lineTo(w, 0);
      g.lineTo(w - b, b);
      g.lineTo(b, b);
      g.lineTo(b, h - b);
      g.lineTo(0, h);
      g.closePath();
      g.fill();
      g.fillStyle = '#9a9a9a';
      g.beginPath();
      g.moveTo(w, h);
      g.lineTo(0, h);
      g.lineTo(b, h - b);
      g.lineTo(w - b, h - b);
      g.lineTo(w - b, b);
      g.lineTo(w, 0);
      g.closePath();
      g.fill();
      g.strokeStyle = 'rgba(255,255,255,0.55)';
      g.lineWidth = 3;
      g.beginPath();
      g.moveTo(b + 10, h * 0.62);
      g.lineTo(w * 0.38, b + 10);
      g.moveTo(w * 0.55, h - b - 12);
      g.lineTo(w - b - 10, h * 0.45);
      g.stroke();
    });
    this.boxGeo = new THREE.BoxGeometry(1, 1, 1);
    this.boxGeo.userData.shared = true;
    this.blockMat = new THREE.MeshStandardMaterial({ map: this.faceTex });
    this.blockMat.userData.shared = true;
    this.ghostMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.16, depthWrite: false, blending: THREE.AdditiveBlending });
    this.ghostMat.userData.shared = true;
    this.applyTheme();

    // build plate with a construction grid
    this.plateTex = canvasTexture(
      512,
      512,
      (g, w, h) => {
        g.fillStyle = '#0b0c0f';
        g.fillRect(0, 0, w, h);
        g.strokeStyle = '#1c2028';
        g.lineWidth = 2;
        for (let i = 0; i <= 16; i++) {
          const p = (i / 16) * w;
          g.beginPath();
          g.moveTo(p, 0);
          g.lineTo(p, h);
          g.moveTo(0, p);
          g.lineTo(w, p);
          g.stroke();
        }
        g.strokeStyle = '#262b35';
        g.lineWidth = 4;
        g.strokeRect(2, 2, w - 4, h - 4);
      },
      { repeat: 6 }
    );
    const plate = new THREE.Mesh(new THREE.BoxGeometry(20, 0.3, 9), new THREE.MeshLambertMaterial({ map: this.plateTex, color: 0x9a9a9a })); // Lambert: no studio-env sheen on the dark plate
    plate.position.set(0, GROUND - 0.15, -1);
    plate.receiveShadow = ctx.quality > 1;
    this.root.add(plate);

    this.sparks = new Particles({ capacity: 500, gravity: [0, -2, 0], drag: 2.2, size: 0.05, shape: 'spark' });
    this.dust = new Particles({ capacity: 400, gravity: [0, 0.2, 0], drag: 1.8, size: 0.16, shape: 'dot', blending: THREE.NormalBlending, opacity: 0.5, floor: GROUND });
    this.root.add(this.sparks.points, this.dust.points);
  }

  private applyTheme() {
    const t = THEMES[this.theme] ?? THEMES.diamond;
    this.blockMat.color.setHex(t.color);
    this.blockMat.roughness = t.rough;
    this.blockMat.metalness = t.metal;
    this.ghostMat.color.setHex(t.ghost);
  }

  setTheme(id: string) {
    if (!THEMES[id]) return;
    this.theme = id;
    this.applyTheme();
    for (const v of this.letters.values()) {
      for (const c of v.cells) c.flash = Math.max(c.flash, 0.6);
      v.dirty = true;
    }
    this.ctx.keepAlive(800);
  }

  /* ------------------------------------------------------------ helpers */

  /** world-space cell edge length for a slot */
  private edge(slot: Slot) {
    return slot.size * CELL;
  }

  private targetOf(v: BuildVisual, c: Cell, out: THREE.Vector3) {
    this.ctx.layout.toWorld(v.slot, c.gx, c.gy, 0, out);
    out.z -= c.gz * this.edge(v.slot);
    return out;
  }

  /* ------------------------------------------------------------ letters */

  protected createLetter(ev: InsertEvent, slot: Slot): BuildVisual | null {
    if (ev.char === ' ' || ev.char === '\n') return null;
    const glyph = this.ctx.glyphs.get(ev.char, 'sans');
    const raster = this.ctx.glyphs.raster(glyph, CELL, THICK);
    const cells: Cell[] = [];
    for (const rc of raster.cells) {
      for (let z = 0; z < LAYERS; z++) {
        cells.push({
          gx: rc.x,
          gy: rc.y,
          gz: z,
          state: 'wait',
          delay: 0,
          t: 0,
          dur: 0.5,
          from: new THREE.Vector3(),
          ctrl: new THREE.Vector3(),
          q0: new THREE.Quaternion(),
          pos: new THREE.Vector3(),
          vel: new THREE.Vector3(),
          rot: new THREE.Quaternion(),
          spin: new THREE.Vector3(),
          flash: 0,
          shade: rand(0.86, 1.04) - z * 0.08,
          scale: 1,
          bounced: 0,
        });
      }
    }
    // bottom-up, back-to-front, left-to-right: blocks always land on something
    cells.sort((a, b) => a.gy - b.gy || b.gz - a.gz || a.gx - b.gx);
    const n = Math.max(1, cells.length);
    const mesh = new THREE.InstancedMesh(this.boxGeo, this.blockMat, n);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.castShadow = this.ctx.quality > 1;
    mesh.receiveShadow = this.ctx.quality > 1;
    mesh.frustumCulled = false;
    const ghost = new THREE.InstancedMesh(this.boxGeo, this.ghostMat, n);
    ghost.frustumCulled = false;
    ghost.renderOrder = 2;
    const group = new THREE.Group();
    group.add(mesh, ghost);
    this.root.add(group);

    const v: BuildVisual = { ref: ev, slot, object: group, state: 'creating', age: 0, mesh, ghost, cells, locked: 0, finaleT: 0, finaleDelay: 0, dirty: true, lastKey: '' };
    const e = this.edge(slot);
    if (ev.restoring || this.ctx.reducedMotion) {
      for (const c of cells) {
        c.state = 'locked';
        this.targetOf(v, c, c.pos);
      }
      v.locked = cells.length;
      v.state = 'alive';
    } else {
      const build = this.ctx.tempo.duration(1150, 380);
      const fly = this.ctx.tempo.duration(560, 260);
      const burst = ev.burstSize > 1 ? ev.burstIndex * 0.08 : 0;
      cells.forEach((c, i) => {
        c.delay = burst + (i / n) * build;
        c.dur = fly * rand(0.85, 1.15);
        this.targetOf(v, c, this.tmp);
        // come in from anywhere around: left, right, behind, above (never through the camera)
        const a = rand(0, Math.PI * 2);
        const r = rand(3, 5.5);
        c.from.set(this.tmp.x + Math.cos(a) * r, this.tmp.y + rand(0.5, 3.5), this.tmp.z - Math.abs(Math.sin(a)) * r * 0.7 - 0.5);
        c.ctrl.set(lerp(c.from.x, this.tmp.x, 0.5), Math.max(c.from.y, this.tmp.y) + rand(1, 2.2), lerp(c.from.z, this.tmp.z, 0.5));
        c.q0.setFromEuler(new THREE.Euler(rand(-3, 3), rand(-3, 3), rand(-3, 3)));
        c.pos.copy(c.from);
        c.scale = 0;
      });
      this.ctx.audio.play('whoosh', { gain: 0.25, pitch: 1.3 });
    }
    // blueprint ghost
    cells.forEach((c, i) => {
      this.targetOf(v, c, this.dummy.position);
      this.dummy.quaternion.identity();
      this.dummy.scale.setScalar(c.state === 'locked' ? 0 : e * 1.02);
      this.dummy.updateMatrix();
      ghost.setMatrixAt(i, this.dummy.matrix);
    });
    ghost.instanceMatrix.needsUpdate = true;
    this.writeAll(v);
    this.ctx.keepAlive(1600);
    return v;
  }

  protected removeLetter(v: BuildVisual, ev: DeleteEvent): void {
    const quick = ev.burstSize > 2;
    const cx = this.ctx.layout.toWorld(v.slot, v.slot.advance / v.slot.size / 2, 0.4, 0, new THREE.Vector3());
    for (const c of v.cells) {
      if (c.state === 'wait') {
        c.state = 'gone';
        c.scale = 0;
        continue;
      }
      c.state = 'loose';
      this.tmp.subVectors(c.pos, cx);
      c.vel.set(this.tmp.x * 3 + rand(-1, 1), rand(1.5, 4), rand(0.5, 2.5));
      if (quick) c.vel.multiplyScalar(0.6);
      c.spin.set(rand(-9, 9), rand(-9, 9), rand(-9, 9));
      c.t = 0;
    }
    v.ghost.visible = false;
    this.ctx.audio.play('crack', { gain: 0.4, pitch: 1.3 });
    this.ctx.keepAlive(1800);
  }

  protected playFinale(_word: string, visuals: BuildVisual[], saved: Promise<SaveOutcome>): void {
    visuals.sort((a, b) => a.slot.origin.x - b.slot.origin.x);
    visuals.forEach((v, i) => {
      // finish any unfinished build instantly-ish
      for (const c of v.cells) {
        if (c.state !== 'locked') {
          c.state = 'locked';
          this.targetOf(v, c, c.pos);
          c.scale = 1;
          c.flash = 1;
        }
      }
      v.ghost.visible = false;
      v.finaleT = 0;
      v.finaleDelay = i * 0.12;
      v.dirty = true;
    });
    this.ctx.audio.play('success', { gain: 0.7 });
    saved.then((r) => {
      if (!r.ok) this.ctx.audio.play('error', { gain: 0.5 });
    });
    this.ctx.keepAlive(3500 + visuals.length * 150);
  }

  /* ------------------------------------------------------------ update */

  private writeAll(v: BuildVisual) {
    const e = this.edge(v.slot);
    const d = this.dummy;
    v.cells.forEach((c, i) => {
      d.position.copy(c.pos);
      d.quaternion.copy(c.rot);
      d.scale.setScalar(e * 0.97 * c.scale);
      d.updateMatrix();
      v.mesh.setMatrixAt(i, d.matrix);
      this.col.setScalar(c.shade).lerp(this.white, clamp(c.flash) * 0.8);
      v.mesh.setColorAt(i, this.col);
    });
    v.mesh.instanceMatrix.needsUpdate = true;
    if (v.mesh.instanceColor) v.mesh.instanceColor.needsUpdate = true;
  }

  protected updateLetter(v: BuildVisual, dt: number, time: number): boolean {
    const key = `${v.slot.origin.x.toFixed(3)},${v.slot.origin.y.toFixed(3)},${v.slot.size.toFixed(3)}`;
    const moved = key !== v.lastKey;
    v.lastKey = key;
    let moving = false;
    const e = this.edge(v.slot);

    if (v.state === 'finale') return this.updateFinale(v, dt, time);

    for (const c of v.cells) {
      switch (c.state) {
        case 'wait':
          c.delay -= dt;
          moving = true;
          if (c.delay <= 0) {
            c.state = 'fly';
            c.t = 0;
            c.scale = 1;
          }
          break;
        case 'fly': {
          c.t += dt / c.dur;
          const k = easeInOutCubic(Math.min(1, c.t));
          // hover point just above the cell
          this.targetOf(v, c, this.tmp);
          this.tmp.y += e * 1.4;
          const u = 1 - k;
          c.pos.set(
            u * u * c.from.x + 2 * u * k * c.ctrl.x + k * k * this.tmp.x,
            u * u * c.from.y + 2 * u * k * c.ctrl.y + k * k * this.tmp.y,
            u * u * c.from.z + 2 * u * k * c.ctrl.z + k * k * this.tmp.z
          );
          c.rot.slerpQuaternions(c.q0, this.identity, easeOutCubic(Math.min(1, c.t * 1.15)));
          moving = true;
          if (c.t >= 1) {
            c.state = 'drop';
            c.t = 0;
          }
          break;
        }
        case 'drop': {
          c.t += dt / 0.09;
          this.targetOf(v, c, this.tmp);
          const k = Math.min(1, c.t);
          c.pos.copy(this.tmp);
          c.pos.y += e * 1.4 * (1 - k * k);
          c.rot.identity();
          moving = true;
          if (k >= 1) {
            c.state = 'locked';
            c.flash = 1;
            v.locked++;
            this.onLock(v, c);
          }
          break;
        }
        case 'locked':
          if (moved || v.dirty) this.targetOf(v, c, c.pos);
          if (c.flash > 0) {
            c.flash = Math.max(0, c.flash - dt * 3.2);
            moving = true;
          }
          break;
        case 'loose':
          moving = this.fall(c, dt, e) || moving;
          break;
        case 'gone':
          break;
      }
    }
    if (v.state === 'creating' && v.locked >= v.cells.length) {
      v.state = 'alive';
      this.ctx.audio.play('chime', { gain: 0.3, pitch: 1.4 });
      for (let i = 0; i < 8; i++) {
        const c = v.cells[(Math.random() * v.cells.length) | 0];
        if (c) this.sparks.emit({ x: c.pos.x, y: c.pos.y, z: c.pos.z + e, vx: rand(-1, 1), vy: rand(0.5, 2), vz: rand(0, 1), life: 0.6, color: 0xffffff, size: 1.6 });
      }
    }
    if (v.state === 'removing') {
      if (v.cells.every((c) => c.state === 'gone')) {
        this.release(v);
        return false;
      }
      moving = true;
    }
    if (moving || moved || v.dirty) {
      this.writeAll(v);
      if (moved && v.ghost.visible) {
        v.cells.forEach((c, i) => {
          this.targetOf(v, c, this.dummy.position);
          this.dummy.quaternion.identity();
          this.dummy.scale.setScalar(c.state === 'locked' ? 0 : e * 1.02);
          this.dummy.updateMatrix();
          v.ghost.setMatrixAt(i, this.dummy.matrix);
        });
        v.ghost.instanceMatrix.needsUpdate = true;
      }
      v.dirty = false;
    }
    if (v.state === 'alive' && v.ghost.visible) v.ghost.visible = false;
    return moving;
  }

  private onLock(v: BuildVisual, c: Cell) {
    const i = v.cells.indexOf(c);
    if (i >= 0 && v.ghost.visible) {
      v.ghost.getMatrixAt(i, this.dummy.matrix);
      this.dummy.matrix.decompose(this.dummy.position, this.dummy.quaternion, this.dummy.scale);
      this.dummy.scale.setScalar(0);
      this.dummy.updateMatrix();
      v.ghost.setMatrixAt(i, this.dummy.matrix);
      v.ghost.instanceMatrix.needsUpdate = true;
    }
    if (Math.random() < 0.35 * this.ctx.tempo.detail) {
      this.dust.emit({ x: c.pos.x + rand(-0.05, 0.05), y: c.pos.y - this.edge(v.slot) * 0.5, z: c.pos.z + 0.05, vx: rand(-0.4, 0.4), vy: rand(0, 0.2), vz: rand(0, 0.3), life: 0.5, color: 0xffffff, size: 0.6 });
    }
    if (this.lockSounds < 40) {
      this.lockSounds++;
      this.ctx.audio.play('tick', { gain: 0.25, pitch: 0.8 + (c.gy + 0.35) * 0.5, minGap: 0.035 });
    }
  }

  /** a loose block: gravity, spin, one bounce on the plate, then shrink away */
  private fall(c: Cell, dt: number, e: number) {
    c.t += dt;
    c.vel.y -= 14 * dt;
    c.pos.addScaledVector(c.vel, dt);
    const half = e * 0.5 * c.scale;
    if (c.pos.y < GROUND + half && c.vel.y < 0) {
      c.pos.y = GROUND + half;
      c.vel.y *= -0.35;
      c.vel.x *= 0.6;
      c.vel.z *= 0.6;
      c.spin.multiplyScalar(0.5);
      if (c.bounced++ === 0 && Math.random() < 0.3) this.ctx.audio.play('tap', { gain: 0.2, minGap: 0.04 });
    }
    this.tmp.copy(c.spin).multiplyScalar(dt);
    const dq = new THREE.Quaternion().setFromEuler(new THREE.Euler(this.tmp.x, this.tmp.y, this.tmp.z));
    c.rot.multiply(dq);
    if (c.t > 0.8) c.scale = Math.max(0, c.scale - dt * 2.5);
    if (c.scale <= 0) c.state = 'gone';
    return true;
  }

  private updateFinale(v: BuildVisual, dt: number, _time: number) {
    if (v.finaleDelay > 0) {
      v.finaleDelay -= dt;
      return true;
    }
    v.finaleT += dt;
    const t = v.finaleT;
    const e = this.edge(v.slot);
    const left = v.slot.origin.x;
    for (const c of v.cells) {
      if (c.state === 'gone') continue;
      const lx = c.gx * v.slot.size;
      if (t < 0.9) {
        // light wave sweeps through (left → right inside the letter, bottom → top)
        const w = clamp((t * 2.2 - (lx / Math.max(0.3, v.slot.advance)) * 0.4 - (c.gy + 0.35) * 0.35) * 2);
        const pulse = Math.sin(w * Math.PI);
        this.targetOf(v, c, c.pos);
        c.pos.z += pulse * e * 0.6;
        c.flash = pulse;
        if (pulse > 0.95 && Math.random() < 0.03) this.sparks.emit({ x: c.pos.x, y: c.pos.y, z: c.pos.z + e, vx: rand(-0.5, 0.5), vy: rand(0.5, 1.5), vz: 0.5, life: 0.5, color: 0xffffff, size: 1.4 });
      } else {
        if (c.state === 'locked') {
          // unlock upward, spiralling into the sky
          c.state = 'loose';
          c.vel.set((c.pos.x - left) * 0.3 + rand(-0.6, 0.6), rand(4, 8), rand(-0.6, 0.6));
          c.spin.set(rand(-6, 6), rand(-6, 6), rand(-6, 6));
          c.t = rand(-0.4, 0);
        }
        c.t += dt;
        if (c.t > 0) {
          c.vel.y += 3 * dt;
          c.pos.addScaledVector(c.vel, dt);
          this.tmp.copy(c.spin).multiplyScalar(dt);
          c.rot.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(this.tmp.x, this.tmp.y, this.tmp.z)));
          c.scale = Math.max(0, 1 - c.t * 0.9);
          c.flash = Math.max(0, c.flash - dt);
          if (c.scale <= 0) c.state = 'gone';
        }
      }
    }
    if (t > 0.9 && v.cells.every((c) => c.state === 'gone')) {
      this.release(v);
      return false;
    }
    this.writeAll(v);
    return true;
  }

  protected updateWorld(dt: number, time: number): boolean {
    this.lockSounds = Math.max(0, this.lockSounds - dt * 30);
    let moving = this.sparks.update(dt, time);
    if (this.dust.update(dt, time)) moving = true;
    return moving;
  }

  onLayout(): void {
    for (const v of this.letters.values()) v.dirty = true;
    this.ctx.keepAlive(300);
  }

  protected release(v: BuildVisual) {
    v.mesh.dispose();
    v.ghost.dispose();
    super.release(v);
  }

  disposeWorld(): void {
    for (const v of [...this.letters.values(), ...this.detached]) {
      v.mesh.dispose();
      v.ghost.dispose();
    }
    this.sparks.dispose();
    this.dust.dispose();
    super.disposeWorld();
    this.boxGeo.dispose();
    this.blockMat.dispose();
    this.ghostMat.dispose();
    this.faceTex.dispose();
    this.plateTex.dispose();
    this.ctx.scene.environment = null;
  }
}

export function create(ctx: WorldContext) {
  return new BlockBuilderWorld(ctx);
}

export const blockBuilder: WorldModule = { create };
