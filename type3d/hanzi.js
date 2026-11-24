/* 3D Type · Chinese characters. Every character is a list of strokes in writing order (the stroke medians of
   Make Me a Hanzi, packed by tools/type3d/bake_hanzi.py into type3d/hanzi/a.bin and b.bin — see hanzi/LICENSE.txt).

   import { hanziNeed, hanziStrokes, hanziContours, hanziTypeface, isHan } from './hanzi.js';
   await hanziNeed('你好');            // loads the pack(s) these characters are in; resolves when they can be drawn
   hanziStrokes('好')                   // { w, strokes: [ [[x,y],…], … ], length }   — the same form as strokefont.js
   hanziContours('好')                  // { w, loops: [ [[x,y],…], … ] }              — the solid outline of the strokes
   hanziTypeface(font, '好')            // puts the outline into a three.js typeface font; returns its glyph record

   Units (as strokefont.js): Latin cap height = 1, baseline y = 0, x from 0 to `w`. A character is drawn a little
   larger than a capital, as in mixed Chinese–Latin type.
   Also used by the Typing Worlds app (tools/typing-worlds-app/src/engine/glyphs/glyph-engine.ts). */

const K = 1.12;            // em → cap heights
const BASE = 0.124;        // the baseline inside the em square
const LIFT = 0.07;
export const HANZI_W = K + 0.06;

let base = null;
const packs = { a: null, b: null }, loading = {};
const strokeCache = new Map(), contourCache = new Map();

export function hanziBase(url) { base = String(url); }
function urlOf(name) {
  const b = base || new URL('hanzi/', typeof document !== 'undefined' ? document.baseURI : 'file:///').href;
  return new URL(name + '.bin', new URL(b, typeof document !== 'undefined' ? document.baseURI : undefined)).href;
}

export function isHan(ch) {
  const c = ch.codePointAt(0);
  return (c >= 0x3400 && c <= 0x9fff) || (c >= 0x20000 && c <= 0x2ebef) || c === 0x3007;
}

function parse(buf) {
  const dv = new DataView(buf), n = dv.getUint32(0, true), index = new Map();
  for (let i = 0; i < n; i++) index.set(dv.getUint32(4 + i * 8, true), dv.getUint32(8 + i * 8, true));
  return { index, data: new Uint8Array(buf, 4 + n * 8) };
}
function loadPack(name) {
  if (packs[name]) return Promise.resolve(packs[name]);
  if (!loading[name]) {
    loading[name] = fetch(urlOf(name)).then(r => { if (!r.ok) throw new Error('hanzi ' + name + ' ' + r.status); return r.arrayBuffer(); })
      .then(b => (packs[name] = parse(b)))
      .catch(e => { loading[name] = null; throw e; });
  }
  return loading[name];
}
/** for tests and tools that read the packs themselves */
export function hanziAddPack(name, buf) { packs[name] = parse(buf); }

function find(ch) {
  const c = ch.codePointAt(0);
  for (const k of ['a', 'b']) { const p = packs[k]; if (p && p.index.has(c)) return { p, off: p.index.get(c) }; }
  return null;
}
export function hanziHas(ch) { return !!find(ch); }

/** resolves when every Chinese character of `text` that the data set has can be drawn (never rejects) */
export async function hanziNeed(text) {
  const han = Array.from(String(text || '')).filter(isHan);
  if (!han.length) return;
  try { await loadPack('a'); } catch (e) { return; }
  if (han.every(hanziHas)) return;
  try { await loadPack('b'); } catch (e) { /* the rarer characters stay undrawn */ }
}
export function hanziPreload() { return loadPack('a').catch(() => {}); }

/* raw strokes in em units (0…1, y up from the bottom of the em square) */
function raw(ch) {
  const f = find(ch); if (!f) return null;
  const d = f.p.data; let o = f.off; const n = d[o++], out = [];
  for (let s = 0; s < n; s++) { const m = d[o++], st = [];
    for (let i = 0; i < m; i++, o += 2) st.push([d[o] / 255, d[o + 1] / 255]);
    out.push(st); }
  return out;
}
const X = x => x * K + 0.03, Y = y => (y - BASE) * K + LIFT;

export function hanziStrokes(ch) {
  if (strokeCache.has(ch)) return strokeCache.get(ch);
  const r = raw(ch); let g = null;
  if (r && r.length) {
    let length = 0;
    const strokes = r.map(st => { const o = st.map(p => [X(p[0]), Y(p[1])]);
      for (let i = 1; i < o.length; i++) length += Math.hypot(o[i][0] - o[i - 1][0], o[i][1] - o[i - 1][1]);
      return o; });
    g = { w: HANZI_W, strokes, length, han: true };
  }
  if (r) strokeCache.set(ch, g);
  return g;
}

/* ───────────── the solid outline: the union of the strokes drawn with a round pen ─────────────
   A distance field on a grid (distance to the nearest stroke, less the pen's half width), then marching squares. */
const N = 128, PAD = 0.07, H = (1 + PAD * 2) / N, W = N + 1;
function field(strokes, r) {
  const f = new Float32Array(W * W).fill(1), reach = r + H * 2;
  for (const st of strokes) for (let i = 0; i < st.length - 1 || (i === 0 && st.length === 1); i++) {
    const a = st[i], b = st[Math.min(i + 1, st.length - 1)], dx = b[0] - a[0], dy = b[1] - a[1], l2 = dx * dx + dy * dy;
    const i0 = Math.max(0, Math.floor((Math.min(a[0], b[0]) - reach + PAD) / H)), i1 = Math.min(N, Math.ceil((Math.max(a[0], b[0]) + reach + PAD) / H));
    const j0 = Math.max(0, Math.floor((Math.min(a[1], b[1]) - reach + PAD) / H)), j1 = Math.min(N, Math.ceil((Math.max(a[1], b[1]) + reach + PAD) / H));
    for (let j = j0; j <= j1; j++) { const y = j * H - PAD;
      for (let i2 = i0; i2 <= i1; i2++) { const x = i2 * H - PAD;
        let t = l2 > 1e-12 ? ((x - a[0]) * dx + (y - a[1]) * dy) / l2 : 0; t = t < 0 ? 0 : t > 1 ? 1 : t;
        const d = Math.hypot(x - a[0] - dx * t, y - a[1] - dy * t) - r, k = j * W + i2;
        if (d < f[k]) f[k] = d; } }
  }
  return f;
}
const PAIRS = { 1: [[3, 0]], 2: [[0, 1]], 3: [[3, 1]], 4: [[1, 2]], 6: [[0, 2]], 7: [[3, 2]], 8: [[2, 3]], 9: [[0, 2]], 11: [[1, 2]], 12: [[3, 1]], 13: [[0, 1]], 14: [[3, 0]] };
function march(f) {
  const link = new Map(), pt = new Map();
  const edge = (i, j, e) => e === 0 ? 2 * (j * W + i) : e === 1 ? 2 * (j * W + i + 1) + 1 : e === 2 ? 2 * ((j + 1) * W + i) : 2 * (j * W + i) + 1;
  const place = key => { if (pt.has(key)) return;
    const n = key >> 1, i = n % W, j = (n - i) / W, v = key & 1, a = f[n], b = f[v ? n + W : n + 1], t = a / (a - b);
    pt.set(key, v ? [i * H - PAD, (j + t) * H - PAD] : [(i + t) * H - PAD, j * H - PAD]); };
  const add = (a, b) => { place(a); place(b); (link.get(a) || link.set(a, []).get(a)).push(b); (link.get(b) || link.set(b, []).get(b)).push(a); };
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const n = j * W + i, c0 = f[n], c1 = f[n + 1], c2 = f[n + W + 1], c3 = f[n + W];
    const k = (c0 < 0 ? 1 : 0) | (c1 < 0 ? 2 : 0) | (c2 < 0 ? 4 : 0) | (c3 < 0 ? 8 : 0);
    if (k === 0 || k === 15) continue;
    let ps = PAIRS[k];
    if (k === 5) ps = (c0 + c1 + c2 + c3) / 4 < 0 ? [[0, 1], [2, 3]] : [[3, 0], [1, 2]];
    else if (k === 10) ps = (c0 + c1 + c2 + c3) / 4 < 0 ? [[3, 0], [1, 2]] : [[0, 1], [2, 3]];
    for (const p of ps) add(edge(i, j, p[0]), edge(i, j, p[1]));
  }
  const loops = [], seen = new Set();
  for (const start of link.keys()) {
    if (seen.has(start)) continue;
    const loop = []; let prev = -1, cur = start;
    while (cur !== undefined && !seen.has(cur)) { seen.add(cur); loop.push(pt.get(cur));
      const nb = link.get(cur); let nx = nb[0] !== prev ? nb[0] : nb[1];
      if (nx !== undefined && seen.has(nx) && nx !== start) nx = nb.find(q => q !== prev && !seen.has(q));
      prev = cur; cur = nx; }
    if (loop.length >= 4) loops.push(loop);
  }
  return loops;
}
function area(l) { let a = 0; for (let i = 0, j = l.length - 1; i < l.length; j = i++) a += (l[j][0] * l[i][1] - l[i][0] * l[j][1]); return a / 2; }
function insideLoop(p, l) { let c = false; for (let i = 0, j = l.length - 1; i < l.length; j = i++) { const a = l[i], b = l[j];
  if ((a[1] > p[1]) !== (b[1] > p[1]) && p[0] < (b[0] - a[0]) * (p[1] - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; }
function simplify(l, tol) {          // Douglas–Peucker on a closed loop, cut at its two farthest-apart points
  const n = l.length; if (n < 8) return l;
  let far = 0, fd = -1; for (let i = 1; i < n; i++) { const d = (l[i][0] - l[0][0]) ** 2 + (l[i][1] - l[0][1]) ** 2; if (d > fd) { fd = d; far = i; } }
  const keep = new Uint8Array(n + 1); keep[0] = keep[far] = keep[n] = 1;
  const P = i => l[i % n], stack = [[0, far], [far, n]];
  while (stack.length) { const [a, b] = stack.pop(); if (b - a < 2) continue;
    const A = P(a), B = P(b), dx = B[0] - A[0], dy = B[1] - A[1], L = Math.hypot(dx, dy) || 1e-9; let m = -1, md = tol;
    for (let i = a + 1; i < b; i++) { const p = P(i), d = Math.abs((p[0] - A[0]) * dy - (p[1] - A[1]) * dx) / L; if (d > md) { md = d; m = i; } }
    if (m > 0) { keep[m] = 1; stack.push([a, m], [m, b]); } }
  const out = []; for (let i = 0; i < n; i++) if (keep[i]) out.push(l[i]);
  return out;
}

/** the pen's half width, in em: thinner for characters with many strokes so they stay open */
function penOf(n) { return Math.max(0.027, Math.min(0.045, 0.052 - 0.0011 * n)); }

export function hanziContours(ch) {
  if (contourCache.has(ch)) return contourCache.get(ch);
  const r = raw(ch); let g = null;
  if (r && r.length) {
    const loops = march(field(r, penOf(r.length))).map(l => simplify(l, 0.0016)).filter(l => l.length >= 3 && Math.abs(area(l)) > 2e-5);
    const depth = loops.map((l, i) => loops.reduce((d, m, k) => d + (k !== i && insideLoop(l[0], m) ? 1 : 0), 0));
    const out = loops.map((l, i) => { const solid = depth[i] % 2 === 0, cw = area(l) < 0;      // solid clockwise, holes counter-clockwise
      const o = (solid === cw ? l : l.slice().reverse()).map(p => [X(p[0]), Y(p[1])]); o.hole = !solid; return o; });
    g = { w: HANZI_W, loops: out, han: true };
  }
  if (r) contourCache.set(ch, g);
  return g;
}

/* three.js typeface fonts (FontLoader): the character joins the font's own glyphs, so font.generateShapes(ch, size)
   and font.data.glyphs[ch].ha work as for a Latin letter. Returns the glyph record, or undefined. */
const capOf = new WeakMap();
function capHeight(font) {
  let c = capOf.get(font); if (c) return c;
  const g = font.data.glyphs.H || font.data.glyphs.E; c = font.data.resolution * 0.7;
  if (g && g.o) { const t = g.o.split(' '); let top = 0;
    for (let i = 0; i < t.length;) { const k = t[i++], n = k === 'm' || k === 'l' ? 1 : k === 'q' ? 2 : k === 'b' ? 3 : 0;
      for (let j = 0; j < n; j++, i += 2) if (j === 0) top = Math.max(top, +t[i + 1]); }
    if (top > 0) c = top; }
  capOf.set(font, c); return c;
}
export function hanziTypeface(font, ch) {
  const glyphs = font.data.glyphs;
  if (glyphs[ch] || !isHan(ch)) return glyphs[ch];
  const c = hanziContours(ch); if (!c) return undefined;
  const cap = capHeight(font), o = [];
  for (const l of c.loops) l.forEach((p, i) => o.push(i ? 'l' : 'm', Math.round(p[0] * cap), Math.round(p[1] * cap)));
  return (glyphs[ch] = { ha: Math.round(c.w * cap), x_min: 0, x_max: Math.round(c.w * cap), o: o.join(' '), han: true });
}

if (typeof window !== 'undefined') window.T3DHanzi = { need: hanziNeed, has: hanziHas, isHan, preload: hanziPreload };
