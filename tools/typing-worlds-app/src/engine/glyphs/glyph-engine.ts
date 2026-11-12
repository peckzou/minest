/**
 * Glyph Path Engine
 *
 * - Single-stroke vector paths with real handwriting stroke order (Hershey fonts,
 *   smoothed with centripetal Catmull-Rom while keeping sharp corners sharp).
 * - Pen plans for tools: travel (pen up) + draw segments with timing.
 * - Evenly spaced point sampling (particles, fish, fireworks, frost seeds).
 * - Occupancy rasters (voxels, topiary, lawn).
 * - Stroke tube geometry with a per-vertex "drawn fraction" attribute (aU) so any
 *   world can reveal a letter exactly in writing order inside a shader.
 * - Solid outline geometry (extruded font) loaded lazily.
 *
 * Glyph-local units: baseline y = 0, cap height = 1, x from 0 to `advance`.
 */
import * as THREE from 'three';
import hershey from './data/hershey.json';

export type StrokeFont = 'sans' | 'script' | 'serif';
export type Metric = StrokeFont | 'outline';

export interface Stroke {
  /** flat xy pairs, resampled */
  pts: Float32Array;
  /** cumulative arc length at each point */
  cum: Float32Array;
  length: number;
}

export interface Glyph {
  char: string;
  font: StrokeFont;
  advance: number;
  strokes: Stroke[];
  /** total pen-down length */
  length: number;
  bounds: { minX: number; maxX: number; minY: number; maxY: number };
}

export interface PenSample {
  x: number;
  y: number;
  /** pen touching the surface */
  down: boolean;
  /** 0..1 lift height while travelling */
  lift: number;
  /** fraction of total pen-down length drawn so far */
  u: number;
  stroke: number;
  /** tangent direction (unit) */
  tx: number;
  ty: number;
}

interface PlanSeg {
  kind: 'draw' | 'travel';
  stroke: number;
  ax: number;
  ay: number;
  bx: number;
  by: number;
  /** time weight */
  w: number;
  /** drawn length before this segment */
  u0: number;
  len: number;
}

export interface PenPlan {
  glyph: Glyph;
  segs: PlanSeg[];
  totalW: number;
}

export interface EvenPoint {
  x: number;
  y: number;
  /** global drawn fraction */
  u: number;
  tx: number;
  ty: number;
  stroke: number;
}

type RawGlyph = { a: number; s: number[][] };
const RAW = hershey as unknown as Record<StrokeFont, Record<string, RawGlyph>>;

const SPACING = 0.025;

function catmull(p0: number, p1: number, p2: number, p3: number, t: number) {
  const t2 = t * t;
  const t3 = t2 * t;
  return 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
}

/** Split a raw polyline at sharp corners, smooth each run, resample at fixed spacing. */
function smoothStroke(raw: number[]): number[] {
  const n = raw.length / 2;
  if (n < 2) return raw.slice();
  // dedupe
  const P: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const x = raw[i * 2];
    const y = raw[i * 2 + 1];
    const last = P[P.length - 1];
    if (!last || Math.hypot(x - last[0], y - last[1]) > 1e-4) P.push([x, y]);
  }
  if (P.length < 2) return [P[0][0], P[0][1], P[0][0] + 0.001, P[0][1]];
  // corner detection
  const breaks = [0];
  for (let i = 1; i < P.length - 1; i++) {
    const ax = P[i][0] - P[i - 1][0];
    const ay = P[i][1] - P[i - 1][1];
    const bx = P[i + 1][0] - P[i][0];
    const by = P[i + 1][1] - P[i][1];
    const cos = (ax * bx + ay * by) / (Math.hypot(ax, ay) * Math.hypot(bx, by) + 1e-9);
    if (cos < 0.5) breaks.push(i);
  }
  breaks.push(P.length - 1);
  const dense: [number, number][] = [];
  for (let b = 0; b < breaks.length - 1; b++) {
    const run = P.slice(breaks[b], breaks[b + 1] + 1);
    for (let i = 0; i < run.length - 1; i++) {
      const p0 = run[Math.max(0, i - 1)];
      const p1 = run[i];
      const p2 = run[i + 1];
      const p3 = run[Math.min(run.length - 1, i + 2)];
      const steps = Math.max(2, Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / (SPACING * 0.5)));
      for (let s = 0; s < steps; s++) {
        const t = s / steps;
        dense.push([catmull(p0[0], p1[0], p2[0], p3[0], t), catmull(p0[1], p1[1], p2[1], p3[1], t)]);
      }
    }
  }
  dense.push(P[P.length - 1]);
  // resample by arc length
  const out: number[] = [dense[0][0], dense[0][1]];
  let acc = 0;
  for (let i = 1; i < dense.length; i++) {
    const [x0, y0] = dense[i - 1];
    const [x1, y1] = dense[i];
    let seg = Math.hypot(x1 - x0, y1 - y0);
    let t0 = 0;
    while (acc + seg * (1 - t0) >= SPACING) {
      const need = SPACING - acc;
      t0 += need / seg;
      out.push(x0 + (x1 - x0) * t0, y0 + (y1 - y0) * t0);
      acc = 0;
      if (t0 >= 1) break;
    }
    acc += seg * (1 - Math.min(1, t0));
  }
  const lx = dense[dense.length - 1][0];
  const ly = dense[dense.length - 1][1];
  if (Math.hypot(out[out.length - 2] - lx, out[out.length - 1] - ly) > SPACING * 0.3) out.push(lx, ly);
  else {
    out[out.length - 2] = lx;
    out[out.length - 1] = ly;
  }
  return out;
}

function makeStroke(pts: number[]): Stroke {
  const n = pts.length / 2;
  const cum = new Float32Array(n);
  for (let i = 1; i < n; i++) {
    cum[i] = cum[i - 1] + Math.hypot(pts[i * 2] - pts[i * 2 - 2], pts[i * 2 + 1] - pts[i * 2 - 1]);
  }
  return { pts: new Float32Array(pts), cum, length: cum[n - 1] || 0.001 };
}

/** Fallback glyph for characters outside the font: a small diamond. */
function fallbackRaw(): RawGlyph {
  return { a: 0.7, s: [[0.35, 0, 0.6, 0.35, 0.35, 0.7, 0.1, 0.35, 0.35, 0]] };
}

export class GlyphEngine {
  private cache = new Map<string, Glyph>();
  private outlineFont: import('three/examples/jsm/loaders/FontLoader.js').Font | null = null;
  private outlineLoading: Promise<void> | null = null;
  private outlineCache = new Map<string, THREE.BufferGeometry>();
  private outlineMetrics = new Map<string, number>();
  private outlineScale = 1;
  private tubeCache = new Map<string, THREE.BufferGeometry>();

  get(char: string, font: StrokeFont = 'sans'): Glyph {
    const key = font + char;
    let g = this.cache.get(key);
    if (g) return g;
    const raw = RAW[font][char] ?? RAW.sans[char] ?? (char.trim() ? fallbackRaw() : RAW.sans[' ']);
    const strokes = raw.s.map((s) => makeStroke(smoothStroke(s)));
    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity;
    for (const s of strokes) {
      for (let i = 0; i < s.pts.length; i += 2) {
        minX = Math.min(minX, s.pts[i]);
        maxX = Math.max(maxX, s.pts[i]);
        minY = Math.min(minY, s.pts[i + 1]);
        maxY = Math.max(maxY, s.pts[i + 1]);
      }
    }
    if (!strokes.length) {
      minX = 0;
      maxX = raw.a;
      minY = 0;
      maxY = 0;
    }
    g = {
      char,
      font,
      advance: raw.a,
      strokes,
      length: strokes.reduce((a, s) => a + s.length, 0),
      bounds: { minX, maxX, minY, maxY },
    };
    this.cache.set(key, g);
    return g;
  }

  advance(char: string, metric: Metric): number {
    if (metric === 'outline') {
      if (!this.outlineFont) return this.get(char, 'sans').advance;
      return this.outlineAdvance(char);
    }
    return this.get(char, metric).advance;
  }

  /* ------------------------------------------------------------ pen plans */

  plan(glyph: Glyph, travelSpeed = 2.6, start?: { x: number; y: number }): PenPlan {
    const segs: PlanSeg[] = [];
    let u0 = 0;
    let px = start?.x ?? glyph.strokes[0]?.pts[0] ?? 0;
    let py = start?.y ?? glyph.strokes[0]?.pts[1] ?? 0;
    glyph.strokes.forEach((s, i) => {
      const ax = s.pts[0];
      const ay = s.pts[1];
      const d = Math.hypot(ax - px, ay - py);
      if (d > 1e-3) segs.push({ kind: 'travel', stroke: i, ax: px, ay: py, bx: ax, by: ay, w: 0.04 + d / travelSpeed, u0, len: d });
      segs.push({ kind: 'draw', stroke: i, ax, ay, bx: s.pts[s.pts.length - 2], by: s.pts[s.pts.length - 1], w: s.length, u0, len: s.length });
      u0 += s.length;
      px = s.pts[s.pts.length - 2];
      py = s.pts[s.pts.length - 1];
    });
    return { glyph, segs, totalW: segs.reduce((a, s) => a + s.w, 0) || 1 };
  }

  /** Sample a pen plan at normalized time t ∈ [0,1]. */
  samplePlan(plan: PenPlan, t: number, out: PenSample = {} as PenSample): PenSample {
    const g = plan.glyph;
    const L = g.length || 1;
    if (!plan.segs.length) {
      Object.assign(out, { x: g.advance / 2, y: 0.5, down: false, lift: 1, u: 1, stroke: 0, tx: 1, ty: 0 });
      return out;
    }
    let target = Math.min(1, Math.max(0, t)) * plan.totalW;
    for (const seg of plan.segs) {
      if (target <= seg.w || seg === plan.segs[plan.segs.length - 1]) {
        const k = Math.min(1, target / seg.w);
        if (seg.kind === 'travel') {
          const e = k * k * (3 - 2 * k);
          out.x = seg.ax + (seg.bx - seg.ax) * e;
          out.y = seg.ay + (seg.by - seg.ay) * e;
          out.down = false;
          out.lift = Math.sin(Math.PI * k);
          out.u = seg.u0 / L;
          out.stroke = seg.stroke;
          const d = Math.hypot(seg.bx - seg.ax, seg.by - seg.ay) || 1;
          out.tx = (seg.bx - seg.ax) / d;
          out.ty = (seg.by - seg.ay) / d;
        } else {
          this.strokeAt(g.strokes[seg.stroke], k * seg.len, out);
          out.down = true;
          out.lift = 0;
          out.u = (seg.u0 + k * seg.len) / L;
          out.stroke = seg.stroke;
        }
        return out;
      }
      target -= seg.w;
    }
    return out;
  }

  /** Position + tangent at arc length `d` on a stroke. */
  strokeAt(s: Stroke, d: number, out: { x: number; y: number; tx: number; ty: number }) {
    const n = s.cum.length;
    if (n < 2) {
      out.x = s.pts[0];
      out.y = s.pts[1];
      out.tx = 1;
      out.ty = 0;
      return out;
    }
    d = Math.max(0, Math.min(s.length, d));
    let lo = 0,
      hi = n - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (s.cum[mid] < d) lo = mid;
      else hi = mid;
    }
    const segLen = s.cum[hi] - s.cum[lo] || 1;
    const k = (d - s.cum[lo]) / segLen;
    const x0 = s.pts[lo * 2],
      y0 = s.pts[lo * 2 + 1],
      x1 = s.pts[hi * 2],
      y1 = s.pts[hi * 2 + 1];
    out.x = x0 + (x1 - x0) * k;
    out.y = y0 + (y1 - y0) * k;
    const l = Math.hypot(x1 - x0, y1 - y0) || 1;
    out.tx = (x1 - x0) / l;
    out.ty = (y1 - y0) / l;
    return out;
  }

  /** Points evenly spaced along all strokes (in drawing order). */
  evenPoints(glyph: Glyph, spacing: number): EvenPoint[] {
    const out: EvenPoint[] = [];
    let base = 0;
    const L = glyph.length || 1;
    const tmp = { x: 0, y: 0, tx: 0, ty: 0 };
    glyph.strokes.forEach((s, si) => {
      const n = Math.max(1, Math.round(s.length / spacing));
      for (let i = 0; i <= n; i++) {
        const d = (i / n) * s.length;
        this.strokeAt(s, d, tmp);
        out.push({ x: tmp.x, y: tmp.y, tx: tmp.tx, ty: tmp.ty, u: (base + d) / L, stroke: si });
      }
      base += s.length;
    });
    return out;
  }

  /** Point count-limited even sampling. */
  pointsByCount(glyph: Glyph, count: number): EvenPoint[] {
    if (!glyph.length) return [];
    return this.evenPoints(glyph, glyph.length / Math.max(1, count - glyph.strokes.length));
  }

  /**
   * Occupancy raster of the stroked glyph.
   * Returns cells (col,row) with row 0 at the bottom; `cell` is the cell size in glyph units.
   */
  raster(glyph: Glyph, cell: number, thickness: number, yMin = -0.35, yMax = 1.05) {
    const cols = Math.max(1, Math.ceil((glyph.advance + 0.0001) / cell));
    const rows = Math.ceil((yMax - yMin) / cell);
    const cells: { c: number; r: number; x: number; y: number; d: number; u: number }[] = [];
    const pts = this.evenPoints(glyph, cell * 0.25);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = (c + 0.5) * cell;
        const y = yMin + (r + 0.5) * cell;
        let best = Infinity;
        let bu = 0;
        for (const p of pts) {
          const d = (p.x - x) ** 2 + (p.y - y) ** 2;
          if (d < best) {
            best = d;
            bu = p.u;
          }
        }
        const d = Math.sqrt(best);
        if (d <= thickness) cells.push({ c, r, x, y, d, u: bu });
      }
    }
    return { cols, rows, cell, yMin, cells };
  }

  /* ------------------------------------------------------- tube geometry */

  /**
   * Tube along all strokes of a glyph. Attributes:
   *  - aU: global drawn fraction (0..1) in writing order
   *  - aStroke: stroke index
   *  - aV: around-the-tube coordinate (0..1)
   * Geometry is cached; do NOT dispose the returned geometry (shared) — clone if mutating.
   */
  tube(glyph: Glyph, radius: number, radial = 10, caps = true): THREE.BufferGeometry {
    const key = `${glyph.font}|${glyph.char}|${radius}|${radial}|${caps}`;
    const hit = this.tubeCache.get(key);
    if (hit) return hit;
    const pos: number[] = [];
    const nor: number[] = [];
    const au: number[] = [];
    const av: number[] = [];
    const ast: number[] = [];
    const idx: number[] = [];
    const L = glyph.length || 1;
    let base = 0;
    const addSphere = (cx: number, cy: number, u: number, si: number) => {
      const start = pos.length / 3;
      const ws = Math.max(6, radial),
        hs = Math.max(4, radial >> 1);
      for (let i = 0; i <= hs; i++) {
        const th = (i / hs) * Math.PI;
        for (let j = 0; j <= ws; j++) {
          const ph = (j / ws) * Math.PI * 2;
          const nx = Math.sin(th) * Math.cos(ph),
            ny = Math.cos(th),
            nz = Math.sin(th) * Math.sin(ph);
          pos.push(cx + nx * radius, cy + ny * radius, nz * radius);
          nor.push(nx, ny, nz);
          au.push(u);
          av.push(j / ws);
          ast.push(si);
        }
      }
      for (let i = 0; i < hs; i++)
        for (let j = 0; j < ws; j++) {
          const a = start + i * (ws + 1) + j,
            b = a + ws + 1;
          idx.push(a, b, a + 1, b, b + 1, a + 1);
        }
    };
    glyph.strokes.forEach((s, si) => {
      const n = s.pts.length / 2;
      const start = pos.length / 3;
      for (let i = 0; i < n; i++) {
        const x = s.pts[i * 2],
          y = s.pts[i * 2 + 1];
        const i0 = Math.max(0, i - 1),
          i1 = Math.min(n - 1, i + 1);
        let tx = s.pts[i1 * 2] - s.pts[i0 * 2],
          ty = s.pts[i1 * 2 + 1] - s.pts[i0 * 2 + 1];
        const tl = Math.hypot(tx, ty) || 1;
        tx /= tl;
        ty /= tl;
        const Nx = -ty,
          Ny = tx; // in-plane normal; binormal is +z
        const u = (base + s.cum[i]) / L;
        for (let j = 0; j <= radial; j++) {
          const a = (j / radial) * Math.PI * 2;
          const c = Math.cos(a),
            sn = Math.sin(a);
          const nx = Nx * c,
            ny = Ny * c,
            nz = sn;
          pos.push(x + nx * radius, y + ny * radius, nz * radius);
          nor.push(nx, ny, nz);
          au.push(u);
          av.push(j / radial);
          ast.push(si);
        }
      }
      for (let i = 0; i < n - 1; i++)
        for (let j = 0; j < radial; j++) {
          const a = start + i * (radial + 1) + j,
            b = a + radial + 1;
          idx.push(a, a + 1, b, b, a + 1, b + 1);
        }
      if (caps) {
        addSphere(s.pts[0], s.pts[1], base / L, si);
        addSphere(s.pts[n * 2 - 2], s.pts[n * 2 - 1], (base + s.length) / L, si);
        // joints at sharp corners
        for (let i = 2; i < n - 2; i++) {
          const ax = s.pts[i * 2] - s.pts[i * 2 - 2],
            ay = s.pts[i * 2 + 1] - s.pts[i * 2 - 1];
          const bx = s.pts[i * 2 + 2] - s.pts[i * 2],
            by = s.pts[i * 2 + 3] - s.pts[i * 2 + 1];
          const cos = (ax * bx + ay * by) / (Math.hypot(ax, ay) * Math.hypot(bx, by) + 1e-9);
          if (cos < 0.6) addSphere(s.pts[i * 2], s.pts[i * 2 + 1], (base + s.cum[i]) / L, si);
        }
      }
      base += s.length;
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    geo.setAttribute('aU', new THREE.Float32BufferAttribute(au, 1));
    geo.setAttribute('aV', new THREE.Float32BufferAttribute(av, 1));
    geo.setAttribute('aStroke', new THREE.Float32BufferAttribute(ast, 1));
    geo.setIndex(idx);
    geo.computeBoundingSphere();
    geo.userData.shared = true;
    this.tubeCache.set(key, geo);
    return geo;
  }

  /**
   * Flat ribbon along strokes (for ink, chalk, smoke, carved grooves).
   * Attributes: aU (global drawn fraction), aSide (-1..1 across), aStroke, aLen (arc length).
   * `widthFn(u, strokeU, tx, ty)` lets callers build calligraphic thick/thin strokes.
   */
  ribbon(
    glyph: Glyph,
    width: number,
    widthFn?: (u: number, strokeU: number, tx: number, ty: number) => number
  ): THREE.BufferGeometry {
    const pos: number[] = [];
    const au: number[] = [];
    const side: number[] = [];
    const ast: number[] = [];
    const alen: number[] = [];
    const idx: number[] = [];
    const L = glyph.length || 1;
    let base = 0;
    glyph.strokes.forEach((s, si) => {
      const n = s.pts.length / 2;
      const start = pos.length / 3;
      for (let i = 0; i < n; i++) {
        const x = s.pts[i * 2],
          y = s.pts[i * 2 + 1];
        const i0 = Math.max(0, i - 1),
          i1 = Math.min(n - 1, i + 1);
        let tx = s.pts[i1 * 2] - s.pts[i0 * 2],
          ty = s.pts[i1 * 2 + 1] - s.pts[i0 * 2 + 1];
        const tl = Math.hypot(tx, ty) || 1;
        tx /= tl;
        ty /= tl;
        const su = s.cum[i] / s.length;
        const u = (base + s.cum[i]) / L;
        const w = (widthFn ? widthFn(u, su, tx, ty) : 1) * width * 0.5;
        // extend the ends a little so caps look round-ish
        let ex = 0,
          ey = 0;
        if (i === 0) {
          ex = -tx * w * 0.6;
          ey = -ty * w * 0.6;
        } else if (i === n - 1) {
          ex = tx * w * 0.6;
          ey = ty * w * 0.6;
        }
        pos.push(x + ex - ty * w, y + ey + tx * w, 0, x + ex + ty * w, y + ey - tx * w, 0);
        au.push(u, u);
        side.push(-1, 1);
        ast.push(si, si);
        alen.push(base + s.cum[i], base + s.cum[i]);
      }
      for (let i = 0; i < n - 1; i++) {
        const a = start + i * 2;
        idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
      base += s.length;
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('aU', new THREE.Float32BufferAttribute(au, 1));
    geo.setAttribute('aSide', new THREE.Float32BufferAttribute(side, 1));
    geo.setAttribute('aStroke', new THREE.Float32BufferAttribute(ast, 1));
    geo.setAttribute('aLen', new THREE.Float32BufferAttribute(alen, 1));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    const nrm = geo.getAttribute('normal') as THREE.BufferAttribute;
    for (let i = 0; i < nrm.count; i++) nrm.setXYZ(i, 0, 0, 1);
    geo.computeBoundingSphere();
    return geo;
  }

  /* ---------------------------------------------------- outline (solid) */

  async loadOutlineFont(): Promise<void> {
    if (this.outlineFont) return;
    if (!this.outlineLoading) {
      this.outlineLoading = (async () => {
        const [{ FontLoader }, data] = await Promise.all([
          import('three/examples/jsm/loaders/FontLoader.js'),
          import('./data/helvetiker_bold.typeface.json'),
        ]);
        const font = new FontLoader().parse((data as { default: unknown }).default as never);
        this.outlineFont = font;
        // normalize so that the cap height of "H" equals 1
        const shapes = font.generateShapes('H', 1);
        const geo = new THREE.ShapeGeometry(shapes);
        geo.computeBoundingBox();
        this.outlineScale = 1 / (geo.boundingBox!.max.y - geo.boundingBox!.min.y);
        geo.dispose();
      })();
    }
    return this.outlineLoading;
  }

  get outlineReady() {
    return !!this.outlineFont;
  }

  outlineAdvance(char: string): number {
    const hit = this.outlineMetrics.get(char);
    if (hit !== undefined) return hit;
    const data = (this.outlineFont as unknown as { data: { glyphs: Record<string, { ha: number }>; resolution: number } }).data;
    const g = data.glyphs[char] ?? data.glyphs['?'];
    const adv = char === ' ' ? 0.5 : ((g?.ha ?? 600) / data.resolution) * this.outlineScale;
    this.outlineMetrics.set(char, adv);
    return adv;
  }

  /**
   * Extruded solid letter, origin at baseline-left, cap height 1, centered in z.
   * Cached & shared — do not dispose.
   */
  outline(char: string, opts: { depth?: number; bevel?: number; curve?: number } = {}): THREE.BufferGeometry {
    const depth = opts.depth ?? 0.32;
    const bevel = opts.bevel ?? 0.06;
    const curve = opts.curve ?? 6;
    const key = `${char}|${depth}|${bevel}|${curve}`;
    const hit = this.outlineCache.get(key);
    if (hit) return hit;
    if (!this.outlineFont) throw new Error('outline font not loaded');
    const shapes = this.outlineFont.generateShapes(char.trim() ? char : '?', this.outlineScale);
    const geo = new THREE.ExtrudeGeometry(shapes, {
      depth,
      curveSegments: curve,
      bevelEnabled: bevel > 0,
      bevelThickness: bevel,
      bevelSize: bevel * 0.8,
      bevelSegments: 4,
    });
    geo.translate(0, 0, -depth / 2);
    geo.computeVertexNormals();
    geo.computeBoundingBox();
    geo.userData.shared = true;
    this.outlineCache.set(key, geo);
    return geo;
  }
}

export const glyphEngine = new GlyphEngine();
