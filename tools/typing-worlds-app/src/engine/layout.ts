/**
 * Line layout: maps letters to slots (world-space position + size).
 * Wraps at spaces, then shrinks to fit. Supports vertical (xy) and horizontal (xz) planes.
 */
import * as THREE from 'three';
import type { GlyphEngine, Metric } from './glyphs/glyph-engine';
import type { LetterRef } from './types';

export interface LayoutOptions {
  metric: Metric;
  /** cap height in world units */
  size: number;
  /** extra advance in em */
  tracking: number;
  maxWidth: number;
  maxLines: number;
  /** baseline-to-baseline in em */
  lineHeight: number;
  /** center of the text block (world) */
  origin: [number, number, number];
  /** xy = vertical wall facing +z; xz = horizontal surface facing +y (top of glyph towards -z) */
  plane: 'xy' | 'xz';
  minScale: number;
}

export const DEFAULT_LAYOUT: LayoutOptions = {
  metric: 'sans',
  size: 1,
  tracking: 0.08,
  maxWidth: 9,
  maxLines: 3,
  lineHeight: 1.6,
  origin: [0, 0, 0],
  plane: 'xy',
  minScale: 0.35,
};

export interface Slot {
  id: number;
  index: number;
  char: string;
  line: number;
  /** glyph origin (baseline-left) in world space */
  origin: THREE.Vector3;
  /** visual center of the glyph cell */
  center: THREE.Vector3;
  /** cap height in world units */
  size: number;
  /** advance in world units */
  advance: number;
  plane: 'xy' | 'xz';
}

export class Layout {
  opts: LayoutOptions;
  private slots = new Map<number, Slot>();
  /** bounding box of the whole text block (world) */
  bounds = new THREE.Box3();
  scale = 1;
  lines = 1;

  constructor(private glyphs: GlyphEngine, opts?: Partial<LayoutOptions>) {
    this.opts = { ...DEFAULT_LAYOUT, ...opts };
  }

  setOptions(opts: Partial<LayoutOptions>) {
    this.opts = { ...this.opts, ...opts };
  }

  get(id: number) {
    return this.slots.get(id);
  }

  all() {
    return [...this.slots.values()].sort((a, b) => a.index - b.index);
  }

  /** Map glyph-local (x right, y up, lift along surface normal) into world space. */
  toWorld(slot: Slot, x: number, y: number, lift = 0, out = new THREE.Vector3()) {
    const s = slot.size;
    if (slot.plane === 'xy') out.set(slot.origin.x + x * s, slot.origin.y + y * s, slot.origin.z + lift * s);
    else out.set(slot.origin.x + x * s, slot.origin.y + lift * s, slot.origin.z - y * s);
    return out;
  }

  /** Put an object (whose children are in glyph-local units) on a slot. */
  apply(obj: THREE.Object3D, slot: Slot) {
    obj.position.copy(slot.origin);
    obj.scale.setScalar(slot.size);
    if (slot.plane === 'xz') obj.rotation.set(-Math.PI / 2, 0, 0);
  }

  /** Predict where the *next* typed char would go (for tools waiting at the cursor). */
  cursor(out = new THREE.Vector3()) {
    const all = this.all();
    const last = all[all.length - 1];
    if (!last) return out.set(...this.opts.origin);
    return this.toWorld(last, last.advance / last.size + 0.2, 0.5, 0, out);
  }

  compute(letters: readonly LetterRef[]) {
    const o = this.opts;
    const adv = letters.map((l) => this.glyphs.advance(l.char, o.metric) + o.tracking);
    // words for wrapping
    type Run = { from: number; to: number; w: number; space: boolean };
    const runs: Run[] = [];
    let i = 0;
    while (i < letters.length) {
      const space = letters[i].char === ' ';
      let j = i;
      let w = 0;
      while (j < letters.length && (letters[j].char === ' ') === space) w += adv[j++];
      runs.push({ from: i, to: j, w, space });
      i = j;
    }
    const tryLayout = (scale: number) => {
      const maxW = o.maxWidth / (o.size * scale);
      const lines: number[][] = [[]];
      let lw = 0;
      for (const r of runs) {
        if (!r.space && lw > 0 && lw + r.w > maxW) {
          // trim trailing spaces of current line
          lines.push([]);
          lw = 0;
        }
        if (r.space && lw === 0 && lines.length > 1) {
          // leading space on a wrapped line: keep but zero width
          for (let k = r.from; k < r.to; k++) lines[lines.length - 1].push(k);
          continue;
        }
        for (let k = r.from; k < r.to; k++) lines[lines.length - 1].push(k);
        lw += r.w;
      }
      const widths = lines.map((ln) => {
        let w = 0;
        ln.forEach((k) => (w += adv[k]));
        // ignore trailing spaces
        for (let k = ln.length - 1; k >= 0 && letters[ln[k]].char === ' '; k--) w -= adv[ln[k]];
        return Math.max(0, w - o.tracking);
      });
      return { lines, widths, fits: lines.length <= o.maxLines && Math.max(0, ...widths) <= maxW + 1e-6 };
    };
    let scale = 1;
    let res = tryLayout(scale);
    while (!res.fits && scale > o.minScale) {
      scale *= 0.92;
      res = tryLayout(scale);
    }
    this.scale = scale;
    this.lines = res.lines.length;
    const size = o.size * scale;
    const lh = o.lineHeight * size;
    const totalH = (res.lines.length - 1) * lh;
    const next = new Map<number, Slot>();
    this.bounds.makeEmpty();
    res.lines.forEach((ln, li) => {
      let x = -(res.widths[li] * size) / 2;
      const yOff = totalH / 2 - li * lh - size * 0.5; // block centered on origin (glyph center ~0.5 cap)
      for (const k of ln) {
        const l = letters[k];
        const prev = this.slots.get(l.id);
        const slot: Slot = prev ?? {
          id: l.id,
          index: k,
          char: l.char,
          line: li,
          origin: new THREE.Vector3(),
          center: new THREE.Vector3(),
          size,
          advance: 0,
          plane: o.plane,
        };
        slot.index = k;
        slot.char = l.char;
        slot.line = li;
        slot.size = size;
        slot.advance = (adv[k] - o.tracking) * size;
        slot.plane = o.plane;
        const [ox, oy, oz] = o.origin;
        if (o.plane === 'xy') slot.origin.set(ox + x, oy + yOff, oz);
        else slot.origin.set(ox + x, oy, oz - yOff);
        this.toWorld(slot, slot.advance / size / 2, 0.5, 0, slot.center);
        this.bounds.expandByPoint(slot.origin);
        this.bounds.expandByPoint(this.toWorld(slot, slot.advance / size, 1, 0));
        next.set(l.id, slot);
        x += adv[k] * size;
      }
    });
    this.slots = next;
  }
}
