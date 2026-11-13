/**
 * WORLD 05 · Underwater World · 海底鱼群文字世界 (Fish Formation)
 *
 * 极简深色水体：暗色海床、几块暗色礁石剪影、细小气泡，以及一群常驻的鱼。
 * - 按下字母：周围鱼群感知输入，附近的鱼和从不同方向游来的鱼通过 boids
 *   （分离 / 对齐 / 聚合）+ 目标形状吸引，自然转弯、互相避让，最终沿字形笔画
 *   排成字母，并在原地轻轻游动，字形保持清晰。
 * - Backspace：鱼群打散编队，游回环境。
 * - Space：留出清晰的词间空隙（自由鱼群会避开文字区域）。
 * - Enter：整句短暂组成一个更大的鱼群结构（放大的字形 + 环绕的大鱼群），随后散开。
 *
 * 性能：所有鱼共用一个 InstancedMesh；邻居查询用固定网格空间哈希并限制邻居数；
 * 鱼的数量按设备 / 质量 / 文本长度自适应；已定型的鱼跳过邻居查询。
 */
import * as THREE from 'three';
import type { DeleteEvent, InsertEvent, LetterRef, SaveOutcome, WorldContext, WorldInstance, WorldModule } from '../engine/types';
import type { Slot } from '../engine/layout';
import { disposeObject, fitCameraToWidth } from '../engine/letter-world';
import { Particles } from '../engine/particles';

/* =====================================================================
 * Pure school simulation (no DOM / GPU) — exported for headless tests.
 * ===================================================================== */

export const MODE_OFF = 0;
export const MODE_FREE = 1;
export const MODE_FORM = 2;
export const MODE_LEAVE = 3;

export class FishSchool {
  readonly cap: number;
  /** high-water mark: all active fish have index < n */
  n = 0;
  active = 0;
  px: Float32Array; py: Float32Array; pz: Float32Array;
  vx: Float32Array; vy: Float32Array; vz: Float32Array;
  /** heading (unit) */
  hx: Float32Array; hy: Float32Array; hz: Float32Array;
  mode: Uint8Array;
  /** formation target (world) + stroke tangent + letter size, written by the world each frame */
  tgx: Float32Array; tgy: Float32Array; tgz: Float32Array;
  tanx: Float32Array; tany: Float32Array; tsz: Float32Array;
  /** 0..1 how settled a forming fish is */
  settle: Float32Array;
  /** seconds of "scared" swimming after a break-up */
  panic: Float32Array;
  seed: Float32Array;
  phase: Float32Array;
  wag: Float32Array;
  speedMul: Float32Array;
  /** exit point for leaving fish */
  ex: Float32Array; ey: Float32Array; ez: Float32Array;

  /** soft swimming box for free fish */
  box = { minX: -12, maxX: 12, minY: -2.6, maxY: 4.6, minZ: -11, maxZ: -0.8 };
  /** text area free fish keep clear of (only where z > z0) */
  keep = { on: false, x0: 0, x1: 0, y0: 0, y1: 0, z0: -2.4 };
  /** Enter: free fish circle around the word as one big school */
  orbit = { on: false, cx: 0, cy: 0, cz: -1.2, rx: 4, ry: 2, k: 0 };
  obstacles: number[] = [];
  floorY = -3.4;
  formSpeed = 7.4;

  private freeList: Int32Array;
  private freeTop = 0;
  // spatial hash (fixed grid)
  private readonly cell = 1.0;
  private readonly gMin = [-34, -10, -26];
  private readonly gDim = [68, 26, 36];
  private cellStart: Int32Array;
  private cellCursor: Int32Array;
  private cellOf: Int32Array;
  private sorted: Int32Array;

  constructor(cap: number) {
    this.cap = cap;
    const f = () => new Float32Array(cap);
    this.px = f(); this.py = f(); this.pz = f();
    this.vx = f(); this.vy = f(); this.vz = f();
    this.hx = f(); this.hy = f(); this.hz = f();
    this.tgx = f(); this.tgy = f(); this.tgz = f();
    this.tanx = f(); this.tany = f(); this.tsz = f();
    this.settle = f(); this.panic = f(); this.seed = f(); this.phase = f(); this.wag = f(); this.speedMul = f();
    this.ex = f(); this.ey = f(); this.ez = f();
    this.mode = new Uint8Array(cap);
    this.freeList = new Int32Array(cap);
    for (let i = cap - 1; i >= 0; i--) this.freeList[this.freeTop++] = i;
    const nc = this.gDim[0] * this.gDim[1] * this.gDim[2];
    this.cellStart = new Int32Array(nc + 1);
    this.cellCursor = new Int32Array(nc + 1);
    this.cellOf = new Int32Array(cap);
    this.sorted = new Int32Array(cap);
  }

  get available() {
    return this.freeTop;
  }

  alloc(x: number, y: number, z: number, vx = 0, vy = 0, vz = 0, rand = Math.random): number {
    if (!this.freeTop) return -1;
    const i = this.freeList[--this.freeTop];
    this.px[i] = x; this.py[i] = y; this.pz[i] = z;
    this.vx[i] = vx; this.vy[i] = vy; this.vz[i] = vz;
    const sp = Math.hypot(vx, vy, vz);
    if (sp > 1e-4) { this.hx[i] = vx / sp; this.hy[i] = vy / sp; this.hz[i] = vz / sp; }
    else { this.hx[i] = 1; this.hy[i] = 0; this.hz[i] = 0; }
    this.mode[i] = MODE_FREE;
    this.settle[i] = 0;
    this.panic[i] = 0;
    this.seed[i] = rand();
    this.phase[i] = rand() * 6.283;
    this.wag[i] = 0.5;
    this.speedMul[i] = 0.85 + rand() * 0.3;
    this.tsz[i] = 1;
    if (i >= this.n) this.n = i + 1;
    this.active++;
    return i;
  }

  release(i: number) {
    if (!this.mode[i]) return;
    this.mode[i] = MODE_OFF;
    this.freeList[this.freeTop++] = i;
    this.active--;
    while (this.n > 0 && !this.mode[this.n - 1]) this.n--;
  }

  private cellIndex(x: number, y: number, z: number) {
    const [mx, my, mz] = this.gMin;
    const [dx, dy, dz] = this.gDim;
    let cx = Math.floor((x - mx) / this.cell);
    let cy = Math.floor((y - my) / this.cell);
    let cz = Math.floor((z - mz) / this.cell);
    cx = cx < 0 ? 0 : cx >= dx ? dx - 1 : cx;
    cy = cy < 0 ? 0 : cy >= dy ? dy - 1 : cy;
    cz = cz < 0 ? 0 : cz >= dz ? dz - 1 : cz;
    return (cz * dy + cy) * dx + cx;
  }

  private buildGrid() {
    const cs = this.cellStart;
    cs.fill(0);
    for (let i = 0; i < this.n; i++) {
      if (!this.mode[i]) { this.cellOf[i] = -1; continue; }
      const c = this.cellIndex(this.px[i], this.py[i], this.pz[i]);
      this.cellOf[i] = c;
      cs[c + 1]++;
    }
    for (let c = 0; c < cs.length - 1; c++) cs[c + 1] += cs[c];
    this.cellCursor.set(cs);
    for (let i = 0; i < this.n; i++) {
      const c = this.cellOf[i];
      if (c >= 0) this.sorted[this.cellCursor[c]++] = i;
    }
  }

  /**
   * Visit neighbours of fish i within radius r (r <= cell size), at most `maxN`
   * accepted neighbours and `maxChecks` distance checks (bounded CPU cost).
   */
  private neighbours(i: number, r: number, maxN: number, visit: (j: number, dx: number, dy: number, dz: number, d2: number) => void) {
    const x = this.px[i], y = this.py[i], z = this.pz[i];
    const [mx, my, mz] = this.gMin;
    const [DX, DY, DZ] = this.gDim;
    const cx = Math.min(DX - 1, Math.max(0, Math.floor((x - mx) / this.cell)));
    const cy = Math.min(DY - 1, Math.max(0, Math.floor((y - my) / this.cell)));
    const cz = Math.min(DZ - 1, Math.max(0, Math.floor((z - mz) / this.cell)));
    const r2 = r * r;
    let found = 0;
    let checks = 0;
    for (let oz = -1; oz <= 1; oz++) {
      const zz = cz + oz;
      if (zz < 0 || zz >= DZ) continue;
      for (let oy = -1; oy <= 1; oy++) {
        const yy = cy + oy;
        if (yy < 0 || yy >= DY) continue;
        for (let ox = -1; ox <= 1; ox++) {
          const xx = cx + ox;
          if (xx < 0 || xx >= DX) continue;
          const c = (zz * DY + yy) * DX + xx;
          for (let s = this.cellStart[c], e = this.cellStart[c + 1]; s < e; s++) {
            const j = this.sorted[s];
            if (j === i) continue;
            if (++checks > 40) return found;
            const dx = this.px[j] - x, dy = this.py[j] - y, dz = this.pz[j] - z;
            const d2 = dx * dx + dy * dy + dz * dz;
            if (d2 > r2 || d2 < 1e-8) continue;
            visit(j, dx, dy, dz, d2);
            if (++found >= maxN) return found;
          }
        }
      }
    }
    return found;
  }

  // scratch accumulators for neighbour visits (avoid closures allocating per fish)
  private acc = { sx: 0, sy: 0, sz: 0, ax: 0, ay: 0, az: 0, cx: 0, cy: 0, cz: 0, na: 0, nc: 0, sepR2: 0, self: 0 };
  private visitFree = (j: number, dx: number, dy: number, dz: number, d2: number) => {
    const a = this.acc;
    if (d2 < a.sepR2) {
      const k = 1 / d2;
      a.sx -= dx * k; a.sy -= dy * k; a.sz -= dz * k;
    }
    if (this.mode[j] === MODE_FREE) {
      a.ax += this.vx[j]; a.ay += this.vy[j]; a.az += this.vz[j]; a.na++;
      a.cx += dx; a.cy += dy; a.cz += dz; a.nc++;
    }
  };
  private visitForm = (j: number, dx: number, dy: number, dz: number, d2: number) => {
    const a = this.acc;
    if (d2 < a.sepR2) {
      const k = 1 / d2;
      a.sx -= dx * k; a.sy -= dy * k; a.sz -= dz * k;
    }
    if (this.mode[j] === MODE_FORM && this.settle[j] < 0.5) {
      a.ax += this.vx[j]; a.ay += this.vy[j]; a.az += this.vz[j]; a.na++;
    }
  };

  /** advance the whole school; returns number of forming fish not yet settled */
  step(dt: number, t: number): number {
    if (dt <= 0) return 0;
    this.buildGrid();
    let unsettled = 0;
    const { px, py, pz, vx, vy, vz, hx, hy, hz } = this;
    const a = this.acc;
    const b = this.box;
    const kp = this.keep;
    const ob = this.obstacles;
    const orb = this.orbit;
    for (let i = 0; i < this.n; i++) {
      const m = this.mode[i];
      if (!m) continue;
      const x = px[i], y = py[i], z = pz[i];
      let ax = 0, ay = 0, az = 0;
      let w = 0;
      let maxSp = 2.3;
      let minSp = 0;
      if (m === MODE_FORM) {
        const dx = this.tgx[i] - x, dy = this.tgy[i] - y, dz = this.tgz[i] - z;
        const d = Math.sqrt(dx * dx + dy * dy + dz * dz) + 1e-6;
        const s = this.tsz[i];
        w = 1 - d / (0.55 * s);
        w = w < 0 ? 0 : w > 1 ? 1 : w;
        w = w * w * (3 - 2 * w);
        this.settle[i] = Math.max(w, this.settle[i] * 0.9);
        if (w < 0.95) unsettled++;
        // critically damped spring (keeps the letter crisp once arrived)
        const K = 70, C = 16.7;
        const sax = dx * K - vx[i] * C, say = dy * K - vy[i] * C, saz = dz * K - vz[i] * C;
        if (w < 0.999) {
          // boid steering: arrive at target + separation + alignment with the incoming school
          const sp = this.formSpeed * this.speedMul[i] * Math.min(1, 0.3 + d / (1.8 * s + 0.6));
          let stx = (dx / d) * sp - vx[i], sty = (dy / d) * sp - vy[i], stz = (dz / d) * sp - vz[i];
          a.sx = a.sy = a.sz = a.ax = a.ay = a.az = 0; a.na = 0;
          const sepR = 0.11 * s + 0.05;
          a.sepR2 = sepR * sepR;
          if (w < 0.85) this.neighbours(i, 0.6, 8, this.visitForm);
          const sepK = 0.6 * (1 - w);
          stx += a.sx * sepK * sepR; sty += a.sy * sepK * sepR; stz += a.sz * sepK * sepR;
          if (a.na) {
            const ak = 0.35 * (1 - w) / a.na;
            stx += (a.ax - vx[i] * a.na) * ak; sty += (a.ay - vy[i] * a.na) * ak; stz += (a.az - vz[i] * a.na) * ak;
          }
          // limited steering force = natural turning radius
          const F = this.formSpeed * (2.6 + 5 * (1 - Math.min(1, d / 2)));
          const sl = Math.hypot(stx, sty, stz);
          if (sl > F) { stx *= F / sl; sty *= F / sl; stz *= F / sl; }
          ax = stx * 2.2 * (1 - w) + sax * w;
          ay = sty * 2.2 * (1 - w) + say * w;
          az = stz * 2.2 * (1 - w) + saz * w;
          maxSp = this.formSpeed * 1.15;
        } else {
          ax = sax; ay = say; az = saz;
          maxSp = 3;
        }
      } else if (m === MODE_FREE) {
        const panic = this.panic[i];
        if (panic > 0) this.panic[i] = panic - dt;
        a.sx = a.sy = a.sz = a.ax = a.ay = a.az = a.cx = a.cy = a.cz = 0; a.na = a.nc = 0;
        a.sepR2 = 0.34 * 0.34;
        this.neighbours(i, 1.0, 10, this.visitFree);
        ax += a.sx * 0.9; ay += a.sy * 0.9; az += a.sz * 0.9;
        if (panic <= 0) {
          if (a.na) {
            ax += (a.ax / a.na - vx[i]) * 1.1; ay += (a.ay / a.na - vy[i]) * 1.1; az += (a.az / a.na - vz[i]) * 1.1;
          }
          if (a.nc) {
            ax += (a.cx / a.nc) * 0.9; ay += (a.cy / a.nc) * 0.9; az += (a.cz / a.nc) * 0.9;
          }
        }
        // wander
        const sd = this.seed[i] * 50;
        ax += Math.sin(t * 0.9 + sd) * 0.9;
        ay += Math.sin(t * 0.7 + sd * 1.7) * 0.35;
        az += Math.cos(t * 0.8 + sd * 2.3) * 0.7;
        // soft box
        if (x < b.minX) ax += (b.minX - x) * 2.5; else if (x > b.maxX) ax -= (x - b.maxX) * 2.5;
        if (y < b.minY) ay += (b.minY - y) * 3; else if (y > b.maxY) ay -= (y - b.maxY) * 3;
        if (z < b.minZ) az += (b.minZ - z) * 2.5; else if (z > b.maxZ) az -= (z - b.maxZ) * 3.5;
        // keep the text clear (the word gap stays readable)
        if (kp.on && z > kp.z0 && x > kp.x0 && x < kp.x1 && y > kp.y0 && y < kp.y1) {
          const k = panic > 0 ? 9 : 5;
          az -= k;
          const cy = (kp.y0 + kp.y1) / 2;
          ay += (y > cy ? 1 : -1) * k * 0.35;
        }
        // big school ring on Enter
        if (orb.on && orb.k > 0 && panic <= 0) {
          const ux = (x - orb.cx) / orb.rx, uy = (y - orb.cy) / orb.ry;
          const th = Math.atan2(uy, ux) + 0.45;
          const qx = orb.cx + Math.cos(th) * orb.rx, qy = orb.cy + Math.sin(th) * orb.ry, qz = orb.cz + Math.sin(th * 2 + this.seed[i] * 6) * 0.35;
          const ddx = qx - x, ddy = qy - y, ddz = qz - z;
          const dd = Math.hypot(ddx, ddy, ddz) + 1e-6;
          const want = 3.4;
          ax += ((ddx / dd) * want - vx[i]) * 2.4 * orb.k;
          ay += ((ddy / dd) * want - vy[i]) * 2.4 * orb.k;
          az += ((ddz / dd) * want - vz[i]) * 2.4 * orb.k;
          maxSp = 3.8;
        }
        maxSp = panic > 0 ? 4.6 : maxSp;
        minSp = 0.8;
      } else {
        // leaving: swim to exit, then switch off
        const dx = this.ex[i] - x, dy = this.ey[i] - y, dz = this.ez[i] - z;
        const d = Math.hypot(dx, dy, dz) + 1e-6;
        if (d < 1.0) { this.release(i); continue; }
        ax = ((dx / d) * 3.4 - vx[i]) * 1.8;
        ay = ((dy / d) * 3.4 - vy[i]) * 1.8;
        az = ((dz / d) * 3.4 - vz[i]) * 1.8;
        a.sx = a.sy = a.sz = 0; a.na = a.nc = 0;
        a.sepR2 = 0.3 * 0.3;
        this.neighbours(i, 0.6, 6, this.visitFree);
        ax += a.sx * 0.8; ay += a.sy * 0.8; az += a.sz * 0.8;
        maxSp = 3.6;
        minSp = 1;
      }
      // obstacles (coral / rocks) + sea floor, for every swimming fish
      if (m !== MODE_FORM || w < 0.5) {
        for (let o = 0; o < ob.length; o += 4) {
          const dx = x - ob[o], dy = y - ob[o + 1], dz = z - ob[o + 2];
          const rr = ob[o + 3] + 0.5;
          const d2 = dx * dx + dy * dy + dz * dz;
          if (d2 < rr * rr) {
            const d = Math.sqrt(d2) + 1e-6;
            const k = ((rr - d) / rr) * 14;
            ax += (dx / d) * k; ay += (dy / d) * k; az += (dz / d) * k;
          }
        }
        if (y < this.floorY + 0.5) ay += (this.floorY + 0.5 - y) * 8;
      }
      if (m === MODE_FREE) {
        const al = Math.hypot(ax, ay, az);
        const A = this.panic[i] > 0 ? 9 : 4.2;
        if (al > A) { ax *= A / al; ay *= A / al; az *= A / al; }
      }
      let nvx = vx[i] + ax * dt, nvy = vy[i] + ay * dt, nvz = vz[i] + az * dt;
      let sp = Math.sqrt(nvx * nvx + nvy * nvy + nvz * nvz);
      if (sp > maxSp) { const k = maxSp / sp; nvx *= k; nvy *= k; nvz *= k; sp = maxSp; }
      else if (sp < minSp && sp > 1e-5) { const k = minSp / sp; nvx *= k; nvy *= k; nvz *= k; sp = minSp; }
      vx[i] = nvx; vy[i] = nvy; vz[i] = nvz;
      px[i] = x + nvx * dt; py[i] = y + nvy * dt; pz[i] = z + nvz * dt;

      // heading: follow velocity; settled fish face along the stroke
      let tx = hx[i], ty = hy[i], tz = hz[i];
      if (sp > 0.05) { tx = nvx / sp; ty = nvy / sp; tz = nvz / sp; }
      if (m === MODE_FORM && w > 0) {
        const fw = Math.min(1, w * 1.15);
        tx = tx * (1 - fw) + this.tanx[i] * fw;
        ty = ty * (1 - fw) + this.tany[i] * fw;
        tz = tz * (1 - fw);
      }
      const turn = Math.min(1, dt * (m === MODE_FORM ? 5 + 7 * w : 5));
      let nhx = hx[i] + (tx - hx[i]) * turn, nhy = hy[i] + (ty - hy[i]) * turn, nhz = hz[i] + (tz - hz[i]) * turn;
      const hl = Math.hypot(nhx, nhy, nhz) || 1;
      nhx /= hl; nhy /= hl; nhz /= hl;
      hx[i] = nhx; hy[i] = nhy; hz[i] = nhz;

      // swimming rhythm: faster tail beat when fast
      this.phase[i] += dt * (m === MODE_FORM && w > 0.9 ? 6.5 : 5 + sp * 6);
      const wagT = m === MODE_FORM ? 0.35 + (1 - w) * Math.min(0.65, sp * 0.2) : Math.min(1, 0.35 + sp * 0.28);
      this.wag[i] += (wagT - this.wag[i]) * Math.min(1, dt * 4);
    }
    return unsettled;
  }
}

/* ---------------------------------------------- formation target sampling */

export interface FormationPoints {
  gx: Float32Array;
  gy: Float32Array;
  tx: Float32Array;
  ty: Float32Array;
}

/**
 * Sample target points along the glyph strokes (glyph-local units) at `spacing`,
 * alternating a small offset across the stroke so the letter reads as a two-file
 * school with some thickness.
 */
export function sampleFormation(points: { x: number; y: number; tx: number; ty: number }[], maxCount: number, offset = 0.034): FormationPoints {
  let src = points;
  if (src.length > maxCount && maxCount > 0) {
    const step = src.length / maxCount;
    src = [];
    for (let k = 0; k < maxCount; k++) src.push(points[Math.floor(k * step)]);
  }
  const n = src.length;
  const out: FormationPoints = { gx: new Float32Array(n), gy: new Float32Array(n), tx: new Float32Array(n), ty: new Float32Array(n) };
  src.forEach((p, k) => {
    const side = k % 2 ? 1 : -1;
    out.gx[k] = p.x - p.ty * offset * side;
    out.gy[k] = p.y + p.tx * offset * side;
    out.tx[k] = p.tx;
    out.ty[k] = p.ty;
  });
  return out;
}

/** Greedy nearest assignment of fish → targets. Returns fish index per target (-1 = empty). */
export function assignNearest(targets: Float32Array /* xyz */, fishPos: Float32Array /* xyz */, fishIds: number[]): Int32Array {
  const nT = targets.length / 3;
  const res = new Int32Array(nT).fill(-1);
  const used = new Uint8Array(fishIds.length);
  const m = Math.min(nT, fishIds.length);
  // when short of fish, spread them evenly over the shape
  for (let q = 0; q < m; q++) {
    const k = m < nT ? Math.floor((q * nT) / m) : q;
    const tx = targets[k * 3], ty = targets[k * 3 + 1], tz = targets[k * 3 + 2];
    let best = -1;
    let bd = Infinity;
    for (let f = 0; f < fishIds.length; f++) {
      if (used[f]) continue;
      const dx = fishPos[f * 3] - tx, dy = fishPos[f * 3 + 1] - ty, dz = fishPos[f * 3 + 2] - tz;
      const d = dx * dx + dy * dy + dz * dz;
      if (d < bd) { bd = d; best = f; }
    }
    if (best < 0) break;
    used[best] = 1;
    res[k] = fishIds[best];
  }
  return res;
}

/* =====================================================================
 * World
 * ===================================================================== */

interface ThemeDef {
  id: string;
  label: string;
  fish: number[];
  metal: number;
  rough: number;
  glow: number;
  waterTop: number;
  waterMid: number;
  waterDeep: number;
  fog: number;
  sand: number;
  ray: number;
  caustic: number;
}

const THEMES: ThemeDef[] = [
  { id: 'silver', label: '银色鱼群', fish: [0xe3edf7, 0xcad9e9, 0xf2f7fc, 0xb9cde0], metal: 0.7, rough: 0.28, glow: 0, waterTop: 0x0a1822, waterMid: 0x061018, waterDeep: 0x04070b, fog: 0x04070b, sand: 0x0b1015, ray: 0xc8f7ff, caustic: 0x9fe8ff },
  { id: 'tropical', label: '彩色热带鱼', fish: [0xffa630, 0xffd23f, 0x3fa7ff, 0xff6b8b, 0x2fe0c4, 0xf4f0e6], metal: 0.12, rough: 0.42, glow: 0.05, waterTop: 0x0a1c20, waterMid: 0x061214, waterDeep: 0x03080a, fog: 0x03080a, sand: 0x0c1112, ray: 0xe6fff8, caustic: 0xc8fff2 },
  { id: 'luminous', label: '荧光鱼群', fish: [0x45ffd0, 0x6cf0ff, 0xb08cff, 0x8affa0], metal: 0.1, rough: 0.35, glow: 0.75, waterTop: 0x08122a, waterMid: 0x040a18, waterDeep: 0x02040a, fog: 0x02040a, sand: 0x080b12, ray: 0x7fd8ff, caustic: 0x4fb8ff },
];

interface LetterRec {
  id: number;
  char: string;
  slot: Slot;
  pts: FormationPoints;
  /** fish index per target, -1 = empty */
  fish: Int32Array;
  state: 'alive' | 'finale';
  /** finale transform */
  fScale: number;
  fLift: number;
  fZ: number;
  fWave: number;
}

interface Finale {
  recs: LetterRec[];
  t: number;
  cx: number;
  cy: number;
  hw: number;
  hh: number;
  released: boolean;
}

/** deterministic rng for the scenery */
export function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function isSmallDevice(ctx: WorldContext) {
  const { width, height } = ctx.renderer.size;
  const coarse = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
  return Math.min(width, height) < 560 || (coarse && Math.max(width, height) < 1100);
}

/** small fish: lathe body (head +z), forked tail and dorsal fin; side profile faces local ±x */
function fishGeometry(): THREE.BufferGeometry {
  const prof = [
    [0.0, -0.5], [0.028, -0.44], [0.06, -0.32], [0.105, -0.12], [0.125, 0.04], [0.11, 0.2], [0.075, 0.34], [0.035, 0.45], [0.0, 0.5],
  ].map(([r, y]) => new THREE.Vector2(r, y));
  const lathe = new THREE.LatheGeometry(prof, 8);
  lathe.rotateX(Math.PI / 2); // body axis y → z (head at +z)
  lathe.scale(0.42, 1.12, 1);
  const body = lathe.toNonIndexed();
  lathe.dispose();
  const bp = body.getAttribute('position').array as Float32Array;
  const bn = body.getAttribute('normal').array as Float32Array;
  // fins: flat triangles in the local y–z plane, both windings
  const fins = [
    // tail (forked)
    [0, 0, -0.44], [0, 0.17, -0.7], [0, 0.02, -0.6],
    [0, 0, -0.44], [0, -0.02, -0.6], [0, -0.17, -0.7],
    // dorsal
    [0, 0.12, 0.06], [0, 0.21, -0.14], [0, 0.1, -0.2],
    // pelvic
    [0, -0.1, 0.02], [0, -0.15, -0.1], [0, -0.08, -0.08],
  ];
  const fp: number[] = [];
  const fnn: number[] = [];
  for (let t = 0; t < fins.length; t += 3) {
    const [a, b2, c] = [fins[t], fins[t + 1], fins[t + 2]];
    fp.push(...a, ...b2, ...c, ...a, ...c, ...b2);
    fnn.push(1, 0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0);
  }
  const pos = new Float32Array(bp.length + fp.length);
  pos.set(bp);
  pos.set(fp, bp.length);
  const nrm = new Float32Array(bn.length + fnn.length);
  nrm.set(bn);
  nrm.set(fnn, bn.length);
  body.dispose();
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
  g.computeBoundingSphere();
  return g;
}

/* ------------------------------------------------------------------ reef */

export const REEF_FLOOR_Y = -3.6;

export interface ReefPalette {
  waterTop: number;
  waterMid: number;
  waterDeep: number;
  fog: number;
  sand: number;
  ray: number;
  caustic: number;
  id: string;
}

/**
 * Minimal dark-water stage (classic 3D Type look): a near-black blue background and fog,
 * a dark sea floor with very faint caustics, a few dark rock silhouettes near the floor
 * (they double as obstacles / bubble vents) and sparse drifting marine snow.
 * Everything is added to `root` (disposed with it).
 */
export function buildReef(ctx: WorldContext, root: THREE.Object3D, theme: ReefPalette, opts: { small: boolean; q: number; seed: number }) {
  const { small } = opts;
  const R = rng(opts.seed);
  /* ------------------------------------------------------- water + light */
  const fog = new THREE.FogExp2(theme.fog, 0.045);
  ctx.scene.fog = fog;
  ctx.scene.background = new THREE.Color(theme.waterDeep);

  const hemi = new THREE.HemisphereLight(0x9fd8f0, 0x05080a, 0.5);
  root.add(hemi);
  const sun = new THREE.DirectionalLight(0xd9f4ff, 1.3);
  sun.position.set(4, 16, 6);
  root.add(sun);

  /* ------------------------------------------------------------ sea floor */
  const FLOOR_Y = REEF_FLOOR_Y;
  const floorGeo = new THREE.PlaneGeometry(90, 56, 1, 1);
  floorGeo.rotateX(-Math.PI / 2);
  const causticUniforms = { uTime: { value: 0 }, uCaustic: { value: new THREE.Color(theme.caustic) } };
  const floorMat = new THREE.MeshStandardMaterial({ color: theme.sand, roughness: 0.95, metalness: 0 });
  floorMat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, causticUniforms);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vCW;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvCW = (modelMatrix*vec4(transformed,1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        varying vec3 vCW; uniform float uTime; uniform vec3 uCaustic;
        float caust(vec2 p, float t){
          vec2 q = p; float v = 0.0;
          for (int i = 0; i < 3; i++) {
            q += vec2(sin(q.y*1.25 + t*0.55 + float(i)*1.3), cos(q.x*1.35 - t*0.5 + float(i)*2.1)) * 0.55;
            v += pow(1.0 - abs(sin(q.x*1.6) * sin(q.y*1.7)), 7.0);
          }
          return v / 3.0;
        }`
      )
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
        float cfade = smoothstep(-26.0, -6.0, vCW.z) * smoothstep(10.0, 2.0, vCW.z) * smoothstep(14.0, 4.0, abs(vCW.x));
        totalEmissiveRadiance += uCaustic * caust(vCW.xz*0.9, uTime) * 0.1 * cfade;`
      );
  };
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.position.set(0, FLOOR_Y, -14);
  root.add(floor);

  /* ------------------------------------------ a few dark rock silhouettes */
  const obstacles: number[] = [];
  const up = new THREE.Vector3(0, 1, 0);
  const tmpM = new THREE.Matrix4();
  const tmpQ = new THREE.Quaternion();
  const tmpV = new THREE.Vector3();
  const tmpS = new THREE.Vector3();

  // spots kept away from the text block in front
  const spots: [number, number][] = [];
  for (let i = 0; i < (small ? 4 : 6); i++) {
    const side = i % 2 ? 1 : -1;
    spots.push([side * (5 + R() * 9), -4 - R() * 9]);
  }
  const boulderGeo = new THREE.IcosahedronGeometry(1, 1);
  const boulderMat = new THREE.MeshStandardMaterial({ color: 0x0a1116, roughness: 0.95, metalness: 0, flatShading: true });
  const boulders = new THREE.InstancedMesh(boulderGeo, boulderMat, spots.length);
  spots.forEach(([x, z], i) => {
    const r = 0.5 + R() * 0.7;
    tmpM.compose(tmpV.set(x, FLOOR_Y + r * 0.2, z), tmpQ.setFromAxisAngle(up, R() * 6), tmpS.set(r * 1.4, r * 0.6, r));
    boulders.setMatrixAt(i, tmpM);
    obstacles.push(x, FLOOR_Y + r * 0.4, z, r * 1.3);
  });
  root.add(boulders);

  /* ---------------------------------------------------- sparse marine snow */
  const nSnow = small ? 120 : 260;
  const snowGeo = new THREE.BufferGeometry();
  {
    const p = new Float32Array(nSnow * 3);
    const s = new Float32Array(nSnow);
    for (let i = 0; i < nSnow; i++) {
      p[i * 3] = (R() - 0.5) * 30;
      p[i * 3 + 1] = R() * 9 - 3.5;
      p[i * 3 + 2] = -14 + R() * 18;
      s[i] = R();
    }
    snowGeo.setAttribute('position', new THREE.BufferAttribute(p, 3));
    snowGeo.setAttribute('aSeed', new THREE.BufferAttribute(s, 1));
  }
  const snowMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uScale: { value: 400 } },
    vertexShader: `attribute float aSeed; uniform float uTime; uniform float uScale; varying float vA;
      void main(){
        vec3 p = position;
        p.x += sin(uTime*0.21 + aSeed*31.0)*0.4;
        p.y = mod(p.y - uTime*(0.04 + aSeed*0.05) + 3.5, 9.0) - 3.5;
        p.z += cos(uTime*0.17 + aSeed*17.0)*0.3;
        vec4 mv = modelViewMatrix*vec4(p,1.0);
        gl_Position = projectionMatrix*mv;
        gl_PointSize = (0.02 + aSeed*0.025) * uScale / max(0.1, -mv.z);
        vA = (0.12 + 0.2*aSeed) * smoothstep(40.0, 8.0, -mv.z);
      }`,
    fragmentShader: `varying float vA; void main(){ vec2 c = gl_PointCoord*2.0-1.0; float a = smoothstep(1.0, 0.0, length(c)); gl_FragColor = vec4(vec3(0.75,0.9,1.0), a*vA); }`,
  });
  const snow = new THREE.Points(snowGeo, snowMat);
  snow.frustumCulled = false;
  const v2 = new THREE.Vector2();
  snow.onBeforeRender = (r, _s, cam) => {
    const h = r.getDrawingBufferSize(v2).y;
    snowMat.uniforms.uScale.value = h / (2 * Math.tan((((cam as THREE.PerspectiveCamera).fov ?? 40) * Math.PI) / 360));
  };
  root.add(snow);
  const vents = spots.slice(0, 3).map(([x, z]) => [x, z] as [number, number]);

  function update(t: number) {
    causticUniforms.uTime.value = t;
    snowMat.uniforms.uTime.value = t;
  }

  function applyPalette(p: ReefPalette) {
    if (ctx.scene.background instanceof THREE.Color) ctx.scene.background.set(p.waterDeep);
    fog.color.set(p.fog);
    floorMat.color.set(p.sand);
    causticUniforms.uCaustic.value.set(p.caustic);
    hemi.intensity = p.id === 'luminous' ? 0.3 : 0.5;
    sun.intensity = p.id === 'luminous' ? 0.6 : 1.3;
  }

  return { obstacles, vents, floorMat, causticUniforms, fog, hemi, sun, update, applyPalette, spots };
}

export function create(ctx: WorldContext): WorldInstance {
  const root = new THREE.Group();
  ctx.scene.add(root);
  const small = isSmallDevice(ctx);
  const q = ctx.quality;
  const R = rng(20261112);

  let theme = THEMES.find((t) => t.id === ctx.theme) ?? THEMES[0];

  /* ------------------------------------------------------------ budgets */
  const CAP = Math.round((q === 2 ? 1150 : q === 1 ? 800 : 480) * (small ? 0.55 : 1));
  const AMBIENT = Math.round((q === 2 ? 150 : q === 1 ? 110 : 70) * (small ? 0.6 : 1));
  const MAX_PER_LETTER = small ? 28 : 40;

  const reef = buildReef(ctx, root, theme, { small, q, seed: 20261112 });
  const { obstacles, vents, fog } = reef;
  const FLOOR_Y = REEF_FLOOR_Y;
  const bubbles = new Particles({ capacity: small ? 260 : 520, gravity: [0, 1.1, 0], drag: 0.7, size: 0.06, shape: 'ring', opacity: 0.8 });
  root.add(bubbles.points);
  let ventAcc = 0;
  const tmpC = new THREE.Color();

  /* ---------------------------------------------------------------- fish */
  const school = new FishSchool(CAP);
  school.obstacles = obstacles;
  school.floorY = FLOOR_Y;

  const fishGeo = fishGeometry();
  const swim = new THREE.InstancedBufferAttribute(new Float32Array(CAP * 2), 2);
  swim.setUsage(THREE.DynamicDrawUsage);
  fishGeo.setAttribute('aSwim', swim);
  const fishUniforms = { uGlow: { value: theme.glow } };
  const fishMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: theme.metal, roughness: theme.rough, envMapIntensity: 0.9 });
  fishMat.envMap = ctx.renderer.environment();
  fishMat.onBeforeCompile = (sh) => {
    sh.uniforms.uGlow = fishUniforms.uGlow;
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute vec2 aSwim;\nvarying float vBelly;')
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        float tailK = smoothstep(0.25, -0.62, position.z);
        transformed.x += sin(aSwim.x - position.z*5.0) * aSwim.y * tailK * 0.16;
        vBelly = position.y;`
      );
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uGlow;\nvarying float vBelly;')
      .replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.rgb *= mix(0.55, 1.12, smoothstep(-0.08, 0.1, vBelly));')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += diffuseColor.rgb * uGlow;');
  };
  const fishMesh = new THREE.InstancedMesh(fishGeo, fishMat, CAP);
  fishMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  fishMesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(CAP * 3), 3);
  fishMesh.frustumCulled = false;
  fishMesh.count = 0;
  root.add(fishMesh);

  function colorFish(i: number) {
    const pal = theme.fish;
    const s = school.seed[i];
    tmpC.set(pal[Math.floor(s * pal.length) % pal.length]).multiplyScalar(0.88 + ((s * 7.3) % 1) * 0.24);
    fishMesh.setColorAt(i, tmpC);
  }
  function recolorAll() {
    for (let i = 0; i < CAP; i++) colorFish(i);
    fishMesh.instanceColor!.needsUpdate = true;
  }

  /* --------------------------------------------------- spawning helpers */
  let halfW = 9; // visible half width at the text plane (updated with the camera)

  function edgeSpawn(cx: number, cy: number, dir: number) {
    // 0 left, 1 right, 2 deep back, 3 from below/back
    const B = halfW + 0.5;
    switch (dir) {
      case 0: return [-B - 1, cy + (R() - 0.5) * 3, -1 - R() * 5];
      case 1: return [B + 1, cy + (R() - 0.5) * 3, -1 - R() * 5];
      case 2: return [cx + (R() - 0.5) * 8, cy + 0.5 + R() * 2, -15 - R() * 3];
      default: return [cx + (R() - 0.5) * 6, FLOOR_Y + 0.8, -6 - R() * 4];
    }
  }

  function spawnFree(count: number, initial = false) {
    for (let k = 0; k < count; k++) {
      let x: number, y: number, z: number;
      if (initial) {
        const g = k % 3;
        x = (g - 1) * 7 + (R() - 0.5) * 3;
        y = 0.5 + (R() - 0.5) * 3;
        z = -5 - g * 1.5 + (R() - 0.5) * 2;
      } else {
        [x, y, z] = edgeSpawn(0, 0.8, Math.floor(R() * 3));
      }
      const dir = initial ? (k % 3 === 1 ? -1 : 1) : x < 0 ? 1 : -1;
      const i = school.alloc(x, y, z, dir * (1.2 + R() * 0.6), (R() - 0.5) * 0.3, (R() - 0.5) * 0.6, R);
      if (i < 0) return;
      colorFish(i);
    }
    fishMesh.instanceColor!.needsUpdate = true;
  }
  spawnFree(AMBIENT, true);

  /* ------------------------------------------------------- letters */
  const letters = new Map<number, LetterRec>();
  const finales: Finale[] = [];
  const owner: (LetterRec | null)[] = new Array(CAP).fill(null);
  const ownerK = new Int16Array(CAP);
  const tmpW = new THREE.Vector3();

  function letterCount() {
    let n = 0;
    for (const r of ctx.letters()) if (r.char.trim()) n++;
    return n;
  }

  function freeCount() {
    let n = 0;
    for (let i = 0; i < school.n; i++) if (school.mode[i] === MODE_FREE && school.panic[i] <= 0) n++;
    return n;
  }

  function targetsOf(rec: LetterRec): Float32Array {
    const n = rec.pts.gx.length;
    const out = new Float32Array(n * 3);
    for (let k = 0; k < n; k++) {
      ctx.layout.toWorld(rec.slot, rec.pts.gx[k], rec.pts.gy[k], 0, tmpW);
      out[k * 3] = tmpW.x; out[k * 3 + 1] = tmpW.y; out[k * 3 + 2] = tmpW.z;
    }
    return out;
  }

  function build(ev: InsertEvent, slot: Slot): LetterRec | null {
    const glyph = ctx.glyphs.get(ev.char, 'sans');
    if (!glyph.length) return null;
    // adaptive density: fewer fish per letter for long text / small budgets
    const n = Math.max(6, letterCount());
    const budget = (CAP - AMBIENT * 0.6) / n;
    const density = Math.max(4.5, Math.min(small ? 8 : 10.5, budget / 2.6));
    const raw = ctx.glyphs.evenPoints(glyph, 1 / density);
    const pts = sampleFormation(raw, MAX_PER_LETTER);
    return {
      id: ev.id, char: ev.char, slot, pts,
      fish: new Int32Array(pts.gx.length).fill(-1),
      state: 'alive', fScale: 1, fLift: 0, fZ: 0, fWave: 0,
    };
  }

  function recruit(rec: LetterRec, restoring: boolean) {
    const T = targetsOf(rec);
    const n = T.length / 3;
    const cx = rec.slot.center.x, cy = rec.slot.center.y, cz = rec.slot.center.z;
    const chosen: number[] = [];
    if (restoring) {
      for (let k = 0; k < n; k++) {
        const i = school.alloc(T[k * 3], T[k * 3 + 1], T[k * 3 + 2], 0, 0, 0, R);
        if (i < 0) break;
        school.hx[i] = rec.pts.tx[k]; school.hy[i] = rec.pts.ty[k]; school.hz[i] = 0;
        school.settle[i] = 1;
        colorFish(i);
        chosen.push(i);
      }
    } else {
      // 1) the surrounding school senses the key: nearest free fish join
      const cand: number[] = [];
      const free = freeCount();
      for (let i = 0; i < school.n; i++) {
        if (school.mode[i] !== MODE_FREE || school.panic[i] > 0) continue;
        const d2 = (school.px[i] - cx) ** 2 + (school.py[i] - cy) ** 2 + (school.pz[i] - cz) ** 2;
        if (d2 < 110) cand.push(i);
      }
      cand.sort((a, b) =>
        (school.px[a] - cx) ** 2 + (school.py[a] - cy) ** 2 + (school.pz[a] - cz) ** 2 -
        ((school.px[b] - cx) ** 2 + (school.py[b] - cy) ** 2 + (school.pz[b] - cz) ** 2)
      );
      const take = Math.min(cand.length, Math.round(n * 0.5), Math.max(0, free - Math.round(AMBIENT * 0.35)));
      for (let k = 0; k < take; k++) chosen.push(cand[k]);
      // 2) the rest swim in from different directions (small sub-schools)
      const groups = 2 + Math.floor(R() * 2);
      const dirs = [cx < 0 ? 0 : 1, Math.floor(R() * 4), Math.floor(R() * 4)];
      let g = 0;
      while (chosen.length < n) {
        const remaining = n - chosen.length;
        const size = Math.max(1, Math.ceil(remaining / Math.max(1, groups - g)));
        const [sx, sy, sz] = edgeSpawn(cx, cy, dirs[g % dirs.length]);
        const toX = cx - sx, toY = cy - sy, toZ = cz - sz;
        const tl = Math.hypot(toX, toY, toZ) || 1;
        let made = 0;
        for (let k = 0; k < size; k++) {
          const sp = 2.5 + R();
          const i = school.alloc(sx + (R() - 0.5) * 1.2, sy + (R() - 0.5) * 0.8, sz + (R() - 0.5) * 1.2, (toX / tl) * sp, (toY / tl) * sp, (toZ / tl) * sp, R);
          if (i < 0) break;
          colorFish(i);
          chosen.push(i);
          made++;
        }
        g++;
        if (!made) break;
      }
      // 3) pool exhausted: borrow any free or leaving fish
      if (chosen.length < n) {
        for (let i = 0; i < school.n && chosen.length < n; i++) {
          const m = school.mode[i];
          if ((m === MODE_FREE || m === MODE_LEAVE) && !chosen.includes(i)) chosen.push(i);
        }
      }
      // nearby free fish turn towards the new letter (they "sense" it)
      for (let i = 0; i < school.n; i++) {
        if (school.mode[i] !== MODE_FREE) continue;
        const dx = cx - school.px[i], dy = cy - school.py[i];
        const d = Math.hypot(dx, dy);
        if (d < 5 && d > 0.01) {
          school.vx[i] += (dx / d) * 0.6;
          school.vy[i] += (dy / d) * 0.3;
        }
      }
    }
    fishMesh.instanceColor!.needsUpdate = true;
    const pos = new Float32Array(chosen.length * 3);
    chosen.forEach((i, f) => { pos[f * 3] = school.px[i]; pos[f * 3 + 1] = school.py[i]; pos[f * 3 + 2] = school.pz[i]; });
    rec.fish = restoring ? Int32Array.from({ length: n }, (_, k) => (k < chosen.length ? chosen[k] : -1)) : assignNearest(T, pos, chosen);
    for (let k = 0; k < n; k++) {
      const i = rec.fish[k];
      if (i < 0) continue;
      school.mode[i] = MODE_FORM;
      school.panic[i] = 0;
      if (!restoring) school.settle[i] = 0;
      owner[i] = rec;
      ownerK[i] = k;
    }
  }

  /** the fish of a letter break formation and swim back into the scene */
  function scatter(rec: LetterRec, burst: number, swirl = 0, cxo?: number, cyo?: number) {
    const cx = cxo ?? rec.slot.center.x, cy = cyo ?? rec.slot.center.y;
    for (let k = 0; k < rec.fish.length; k++) {
      const i = rec.fish[k];
      if (i < 0 || owner[i] !== rec) continue;
      owner[i] = null;
      school.mode[i] = MODE_FREE;
      school.settle[i] = 0;
      school.panic[i] = 0.8 + R() * 0.6;
      let dx = school.px[i] - cx, dy = school.py[i] - cy;
      const d = Math.hypot(dx, dy) || 1;
      dx /= d; dy /= d;
      const sp = burst * (0.7 + R() * 0.6);
      school.vx[i] = dx * sp - dy * swirl + (R() - 0.5);
      school.vy[i] = dy * sp + dx * swirl + (R() - 0.5) * 0.6;
      school.vz[i] = -burst * (0.6 + R() * 0.5);
    }
    rec.fish.fill(-1);
  }

  function setLeaving(i: number) {
    school.mode[i] = MODE_LEAVE;
    owner[i] = null;
    const B = halfW + 6;
    const side = school.px[i] < 0 ? -1 : 1;
    if (R() < 0.7) {
      school.ex[i] = side * B; school.ey[i] = school.py[i] + (R() - 0.5) * 2; school.ez[i] = school.pz[i] - 2;
    } else {
      school.ex[i] = school.px[i] + (R() - 0.5) * 6; school.ey[i] = school.py[i] + 1; school.ez[i] = -24;
    }
  }

  /* ------------------------------------------------------------ camera */
  const cam = ctx.camera;
  let camDist = 11;
  let camInit = false;
  function updateCamera(dt: number, t: number) {
    const b = ctx.layout.bounds;
    let w = b.isEmpty() ? 0 : b.max.x - b.min.x;
    for (const f of finales) if (!f.released) w = Math.max(w, f.hw * 2 * 1.25);
    const need = Math.max(w + 1.8, 6.5);
    const d = fitCameraToWidth(cam, need, 11, cam.aspect || 1);
    camDist = camInit ? camDist + (d - camDist) * (1 - Math.exp(-2.2 * dt)) : d;
    camInit = true;
    const sway = ctx.reducedMotion ? 0 : 1;
    cam.position.set(Math.sin(t * 0.13) * 0.18 * sway, 0.45 + Math.sin(t * 0.17) * 0.08 * sway, camDist);
    cam.lookAt(0, 0.3, 0);
    const hfov = Math.atan(Math.tan((cam.fov * Math.PI) / 360) * (cam.aspect || 1));
    halfW = Math.tan(hfov) * (camDist + 4);
    school.box.minX = -halfW - 1;
    school.box.maxX = halfW + 1;
    // keep the text block clear of the ambient school
    if (b.isEmpty()) school.keep.on = false;
    else {
      school.keep.on = true;
      school.keep.x0 = b.min.x - 0.8;
      school.keep.x1 = b.max.x + 0.8;
      school.keep.y0 = b.min.y - 0.9;
      school.keep.y1 = b.max.y + 0.7;
    }
  }

  /* --------------------------------------------------- per-frame targets */
  function writeTargets(t: number) {
    const live = (rec: LetterRec, fin: Finale | null) => {
      const s = rec.slot.size;
      for (let k = 0; k < rec.fish.length; k++) {
        const i = rec.fish[k];
        if (i < 0) continue;
        ctx.layout.toWorld(rec.slot, rec.pts.gx[k], rec.pts.gy[k], 0, tmpW);
        const sd = school.seed[i] * 6.283;
        const tx = rec.pts.tx[k], ty = rec.pts.ty[k];
        // gentle swimming in place: along the stroke + a little across + depth
        const along = Math.sin(t * 1.5 + sd) * 0.03 * s;
        const across = Math.sin(t * 2.1 + sd * 1.7) * 0.012 * s;
        let x = tmpW.x + tx * along - ty * across;
        let y = tmpW.y + ty * along + tx * across;
        let z = tmpW.z + Math.sin(t * 1.1 + sd * 2.3) * 0.05 * s;
        let size = s;
        if (fin) {
          x = fin.cx + (x - fin.cx) * rec.fScale;
          y = fin.cy + (y - fin.cy) * rec.fScale + rec.fLift + Math.sin(t * 3.2 - x * 0.9) * 0.07 * rec.fWave;
          z += rec.fZ;
          size = s * rec.fScale;
        }
        school.tgx[i] = x; school.tgy[i] = y; school.tgz[i] = z;
        school.tanx[i] = tx; school.tany[i] = ty; school.tsz[i] = size;
      }
    };
    for (const rec of letters.values()) live(rec, null);
    for (const f of finales) for (const rec of f.recs) live(rec, f);
  }

  /* ------------------------------------------------------------ render */
  const mArr = fishMesh.instanceMatrix.array as Float32Array;
  const sArr = swim.array as Float32Array;
  function writeInstances() {
    const n = school.n;
    for (let i = 0; i < n; i++) {
      const o = i * 16;
      if (!school.mode[i]) {
        for (let k = 0; k < 16; k++) mArr[o + k] = 0;
        continue;
      }
      const fx = school.hx[i], fy = school.hy[i], fz = school.hz[i];
      const w = school.mode[i] === MODE_FORM ? school.settle[i] : 0;
      // lateral axis: world-up based while free, camera-facing profile when in a letter
      let ax = -fz, ay = 0, az = fx; // cross(Y, f)
      let al = Math.hypot(ax, az);
      if (al < 1e-3) { ax = 0; az = -1; al = 1; }
      ax /= al; az /= al;
      // -(Z - f (f·Z))
      let bx = fx * fz, by = fy * fz, bz = fz * fz - 1;
      const bl = Math.hypot(bx, by, bz) || 1;
      bx /= bl; by /= bl; bz /= bl;
      let rx = ax * (1 - w) + bx * w, ry = ay * (1 - w) + by * w, rz = az * (1 - w) + bz * w;
      const dp = rx * fx + ry * fy + rz * fz;
      rx -= fx * dp; ry -= fy * dp; rz -= fz * dp;
      const rl = Math.hypot(rx, ry, rz) || 1;
      rx /= rl; ry /= rl; rz /= rl;
      // up = f × r
      const ux = fy * rz - fz * ry, uy = fz * rx - fx * rz, uz = fx * ry - fy * rx;
      const own = owner[i];
      const base = 0.2 * (0.85 + school.seed[i] * 0.3);
      const sc = own ? base * (1 - w) + 0.17 * school.tsz[i] * (0.9 + school.seed[i] * 0.2) * w : base;
      mArr[o] = rx * sc; mArr[o + 1] = ry * sc; mArr[o + 2] = rz * sc; mArr[o + 3] = 0;
      mArr[o + 4] = ux * sc; mArr[o + 5] = uy * sc; mArr[o + 6] = uz * sc; mArr[o + 7] = 0;
      mArr[o + 8] = fx * sc; mArr[o + 9] = fy * sc; mArr[o + 10] = fz * sc; mArr[o + 11] = 0;
      mArr[o + 12] = school.px[i]; mArr[o + 13] = school.py[i]; mArr[o + 14] = school.pz[i]; mArr[o + 15] = 1;
      sArr[i * 2] = school.phase[i];
      sArr[i * 2 + 1] = ctx.reducedMotion ? school.wag[i] * 0.5 : school.wag[i];
    }
    fishMesh.count = n;
    fishMesh.instanceMatrix.needsUpdate = true;
    swim.needsUpdate = true;
  }

  /* ------------------------------------------------------- population */
  let popAcc = 0;
  function population(dt: number) {
    popAcc += dt;
    if (popAcc < 0.2) return;
    popAcc = 0;
    const free = freeCount();
    if (free < AMBIENT && school.available > 0) spawnFree(Math.min(3, AMBIENT - free));
    else if (free > AMBIENT * 1.25) {
      // surplus fish (from deleted letters) drift away out of view
      let surplus = Math.min(8, free - AMBIENT);
      for (let i = school.n - 1; i >= 0 && surplus > 0; i--) {
        if (school.mode[i] === MODE_FREE && school.panic[i] <= 0) {
          setLeaving(i);
          surplus--;
        }
      }
    }
  }

  /* --------------------------------------------------- idle pump (~30fps) */
  let pumpTimer = 0;
  let disposed = false;
  function schedulePump() {
    if (pumpTimer || disposed) return;
    pumpTimer = window.setTimeout(() => {
      pumpTimer = 0;
      if (!disposed && !document.hidden) ctx.keepAlive(1);
    }, 33);
  }
  const onVis = () => { if (!document.hidden && !disposed) ctx.keepAlive(200); };
  document.addEventListener('visibilitychange', onVis);

  /* ----------------------------------------------------------- theming */
  function applyTheme(id: string) {
    theme = THEMES.find((t) => t.id === id) ?? THEMES[0];
    reef.applyPalette(theme);
    fishMat.metalness = theme.metal;
    fishMat.roughness = theme.rough;
    fishUniforms.uGlow.value = theme.glow;
    recolorAll();
  }
  applyTheme(theme.id);

  /* ------------------------------------------------------------- clock */
  let lastNow = performance.now();
  let clock = 0;

  return {
    onCharacterInput(ev: InsertEvent) {
      if (!ev.char.trim()) return; // space / newline → clear gap via layout
      const slot = ctx.slotOf(ev.id);
      if (!slot) return;
      const rec = build(ev, slot);
      if (!rec) return;
      letters.set(ev.id, rec);
      recruit(rec, ev.restoring);
      if (!ev.restoring) {
        // tempo: fast typists get a faster school
        school.formSpeed = ctx.tempo.tempo === 'fast' ? 11 : ctx.tempo.tempo === 'normal' ? 8.8 : 7.4;
        ctx.audio.play('bubble', { pitch: 1.1 + R() * 0.3, gain: 0.3, minGap: 60 });
        for (let k = 0; k < 4; k++) {
          bubbles.emit({ x: slot.center.x + (R() - 0.5) * 0.8, y: slot.center.y - 0.4, z: slot.center.z - 0.3, vy: 0.3 + R() * 0.4, wobble: 1.2, life: 1.6 + R(), size: 0.6 + R() * 0.6, color: 0xd9f6ff });
        }
      }
      ctx.keepAlive(1500);
    },

    onCharacterDelete(ev: DeleteEvent) {
      const rec = letters.get(ev.id);
      if (!rec) return;
      letters.delete(ev.id);
      scatter(rec, 3.2);
      ctx.audio.play('whoosh', { pitch: 1.5, gain: 0.22, minGap: 50 });
      ctx.keepAlive(1500);
    },

    onLayout() {
      for (const [id, rec] of letters) {
        const s = ctx.slotOf(id);
        if (s) rec.slot = s;
      }
    },

    onWordComplete(_word: string, refs: readonly LetterRef[], saved: Promise<SaveOutcome>) {
      const recs: LetterRec[] = [];
      for (const r of refs) {
        const rec = letters.get(r.id);
        if (!rec) continue;
        letters.delete(r.id);
        rec.state = 'finale';
        recs.push(rec);
      }
      if (recs.length) {
        let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
        for (const rec of recs) {
          const s = rec.slot;
          x0 = Math.min(x0, s.origin.x); x1 = Math.max(x1, s.origin.x + s.advance);
          y0 = Math.min(y0, s.origin.y - 0.2 * s.size); y1 = Math.max(y1, s.origin.y + s.size);
        }
        const f: Finale = { recs, t: 0, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, hw: (x1 - x0) / 2, hh: (y1 - y0) / 2, released: false };
        finales.push(f);
        // the ambient school joins as one big ring around the word
        school.orbit.on = true;
        school.orbit.cx = f.cx;
        school.orbit.cy = f.cy;
        school.orbit.rx = f.hw * 1.25 + 1.3;
        school.orbit.ry = f.hh * 1.25 + 1.0;
        school.orbit.cz = -1.4;
        school.orbit.k = 0;
      }
      ctx.audio.play('success', { gain: 0.6 });
      saved.then((res) => {
        if (!res.ok) ctx.audio.play('error', { gain: 0.4 });
      });
      ctx.keepAlive(4000);
    },

    onTextClear(refs: readonly LetterRef[]) {
      for (const r of refs) {
        const rec = letters.get(r.id);
        if (!rec) continue;
        letters.delete(r.id);
        scatter(rec, 3.2);
      }
      ctx.keepAlive(1500);
    },

    setTheme(id: string) {
      applyTheme(id);
      ctx.keepAlive(300);
    },

    updateAnimation(): boolean {
      const now = performance.now();
      const dt = Math.min(0.05, Math.max(0, (now - lastNow) / 1000));
      lastNow = now;
      clock += dt;
      const t = clock;

      // finales: grow into one larger school structure, then disperse
      let finaleActive = false;
      for (let fi = finales.length - 1; fi >= 0; fi--) {
        const f = finales[fi];
        f.t += dt;
        const e = Math.min(1, f.t / 0.9);
        const ease = e * e * (3 - 2 * e);
        for (const rec of f.recs) {
          rec.fScale = 1 + (small ? 0.12 : 0.22) * ease;
          rec.fLift = 0.25 * ease;
          rec.fZ = 0.7 * ease;
          rec.fWave = ease;
        }
        if (!f.released && f.t > 2.7) {
          f.released = true;
          for (const rec of f.recs) scatter(rec, 3.8, 2.2, f.cx, f.cy);
          ctx.audio.play('whoosh', { pitch: 0.9, gain: 0.35 });
        }
        if (f.released && f.t > 3.2) finales.splice(fi, 1);
        else finaleActive = true;
      }
      const orb = school.orbit;
      if (orb.on) {
        const target = finales.some((f) => !f.released) ? 1 : 0;
        orb.k += (target - orb.k) * Math.min(1, dt * 2.2);
        if (!target && orb.k < 0.02) { orb.on = false; orb.k = 0; }
      }

      updateCamera(dt, t);
      writeTargets(t);
      // substeps keep steering stable on slow frames
      const steps = dt > 0.026 ? 2 : 1;
      let unsettled = 0;
      for (let s = 0; s < steps; s++) unsettled = school.step(dt / steps, t);
      population(dt);
      writeInstances();

      // environment
      reef.update(t);
      ventAcc += dt;
      while (ventAcc > (small ? 0.22 : 0.12)) {
        ventAcc -= small ? 0.22 : 0.12;
        const v = vents[Math.floor(R() * vents.length)];
        if (v) bubbles.emit({ x: v[0] + (R() - 0.5) * 0.4, y: FLOOR_Y + 1.2, z: v[1] + (R() - 0.5) * 0.4, vy: 0.4 + R() * 0.5, wobble: 1.4, life: 4 + R() * 2, size: 0.5 + R() * 0.9, color: 0xe6fbff });
      }
      bubbles.update(dt, t);

      ctx.tempo.backlog = Math.min(6, Math.ceil(unsettled / 20));
      const busy = unsettled > 0 || finaleActive || orb.on;
      if (!busy) schedulePump();
      return busy;
    },

    disposeWorld() {
      disposed = true;
      if (pumpTimer) clearTimeout(pumpTimer);
      document.removeEventListener('visibilitychange', onVis);
      letters.clear();
      finales.length = 0;
      bubbles.dispose();
      disposeObject(root);
      if (ctx.scene.fog === fog) ctx.scene.fog = null;
    },
  };
}

export const fishFormation: WorldModule = { create };
