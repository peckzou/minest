/* A small single-stroke alphabet (original, geometric): every glyph is a list of strokes in writing order, every stroke
   a polyline of [x, y] points. Units: cap height = 1, baseline y = 0, x from 0 to the glyph's width `w`.
   Used by the modes that draw letters as one moving point (energy blade, glass tubes).

   import { strokeGlyph, strokeAdvance } from './strokefont.js';
   const g = strokeGlyph('A');   // { w, strokes: [ [[x,y],…], … ], length }  or null for an unknown character */

const E = (cx, cy, rx, ry, a0, a1, n) => {            // elliptical arc, degrees, counter-clockwise when a1 > a0
  const steps = n || Math.max(6, Math.ceil(Math.abs(a1 - a0) / 9)), out = [];
  for (let i = 0; i <= steps; i++) { const a = (a0 + (a1 - a0) * i / steps) * Math.PI / 180; out.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); }
  return out;
};
const P = (...parts) => parts.flatMap(p => (typeof p[0] === 'number' ? [p] : p));   // join points and arcs into one stroke

const DEF = {
  A: { w: .66, s: [P([0, 0], [.33, 1], [.66, 0]), P([.12, .36], [.54, .36])] },
  B: { w: .6, s: [P([0, 0], [0, 1]), P([0, 1], [.33, 1], E(.33, .76, .24, .24, 90, -90), [0, .52]), P([0, .52], [.34, .52], E(.34, .26, .26, .26, 90, -90), [0, 0])] },
  C: { w: .66, s: [P(E(.36, .5, .36, .5, 42, 318))] },
  D: { w: .64, s: [P([0, 0], [0, 1]), P([0, 1], [.2, 1], E(.2, .5, .44, .5, 90, -90), [0, 0])] },
  E: { w: .56, s: [P([.56, 1], [0, 1], [0, 0], [.56, 0]), P([0, .52], [.46, .52])] },
  F: { w: .54, s: [P([.54, 1], [0, 1], [0, 0]), P([0, .52], [.42, .52])] },
  G: { w: .72, s: [P(E(.36, .5, .36, .5, 42, 360), [.72, .5], [.42, .5])] },
  H: { w: .64, s: [P([0, 1], [0, 0]), P([.64, 1], [.64, 0]), P([0, .52], [.64, .52])] },
  I: { w: .12, s: [P([.06, 1], [.06, 0])] },
  J: { w: .46, s: [P([.46, 1], [.46, .25], E(.23, .25, .23, .25, 0, -180))] },
  K: { w: .62, s: [P([0, 1], [0, 0]), P([.6, 1], [0, .42]), P([.2, .6], [.62, 0])] },
  L: { w: .52, s: [P([0, 1], [0, 0], [.52, 0])] },
  M: { w: .78, s: [P([0, 0], [0, 1], [.39, .22], [.78, 1], [.78, 0])] },
  N: { w: .64, s: [P([0, 0], [0, 1], [.64, 0], [.64, 1])] },
  O: { w: .76, s: [P(E(.38, .5, .38, .5, 90, 450))] },
  P: { w: .58, s: [P([0, 0], [0, 1]), P([0, 1], [.32, 1], E(.32, .74, .26, .26, 90, -90), [0, .48])] },
  Q: { w: .76, s: [P(E(.38, .5, .38, .5, 90, 450)), P([.46, .26], [.78, -.06])] },
  R: { w: .62, s: [P([0, 0], [0, 1]), P([0, 1], [.32, 1], E(.32, .74, .26, .26, 90, -90), [0, .48]), P([.3, .48], [.62, 0])] },
  S: { w: .6, s: [P(E(.3, .76, .28, .24, 25, 270), E(.3, .26, .3, .26, 90, -155))] },
  T: { w: .64, s: [P([0, 1], [.64, 1]), P([.32, 1], [.32, 0])] },
  U: { w: .64, s: [P([0, 1], [0, .32], E(.32, .32, .32, .32, 180, 360), [.64, 1])] },
  V: { w: .64, s: [P([0, 1], [.32, 0], [.64, 1])] },
  W: { w: .88, s: [P([0, 1], [.21, 0], [.44, .8], [.67, 0], [.88, 1])] },
  X: { w: .62, s: [P([0, 1], [.62, 0]), P([.62, 1], [0, 0])] },
  Y: { w: .64, s: [P([0, 1], [.32, .5], [.64, 1]), P([.32, .5], [.32, 0])] },
  Z: { w: .6, s: [P([0, 1], [.6, 1], [0, 0], [.6, 0])] },
  0: { w: .6, s: [P(E(.3, .5, .3, .5, 90, 450))] },
  1: { w: .3, s: [P([0, .78], [.24, 1], [.24, 0])] },
  2: { w: .6, s: [P(E(.3, .72, .29, .28, 165, -35), [0, 0], [.6, 0])] },
  3: { w: .58, s: [P(E(.27, .76, .27, .24, 150, -90), E(.28, .26, .3, .26, 90, -150))] },
  4: { w: .64, s: [P([.46, 0], [.46, 1], [0, .3], [.64, .3])] },
  5: { w: .6, s: [P([.54, 1], [.08, 1], [.04, .56], E(.28, .31, .31, .31, 128, -150))] },
  6: { w: .6, s: [P([.48, 1], [.2, .72], [.03, .4], E(.3, .3, .29, .3, 160, -200))] },
  7: { w: .6, s: [P([0, 1], [.6, 1], [.2, 0])] },
  8: { w: .6, s: [P(E(.3, .76, .25, .24, -90, 270), E(.3, .26, .3, .26, 90, -270))] },
  9: { w: .6, s: [P(E(.3, .7, .29, .3, -20, 340), [.56, .56], [.44, .24], [.14, 0])] },
  '.': { w: .1, s: [P([.05, .03], [.05, 0])] },
  ',': { w: .12, s: [P([.08, .04], [.02, -.14])] },
  '-': { w: .4, s: [P([0, .46], [.4, .46])] },
  '!': { w: .1, s: [P([.05, 1], [.05, .28]), P([.05, .04], [.05, 0])] },
  '?': { w: .5, s: [P(E(.25, .76, .25, .24, 170, -70), [.25, .42], [.25, .28]), P([.25, .04], [.25, 0])] },
  ':': { w: .1, s: [P([.05, .62], [.05, .58]), P([.05, .04], [.05, 0])] },
  "'": { w: .08, s: [P([.04, 1], [.04, .8])] },
  '+': { w: .5, s: [P([0, .46], [.5, .46]), P([.25, .71], [.25, .21])] },
  '/': { w: .44, s: [P([0, 0], [.44, 1])] },
};

const cache = new Map();
/** the glyph for a character (letters are upper-cased); null when there is none */
export function strokeGlyph(ch) {
  const k = String(ch).toUpperCase();
  if (cache.has(k)) return cache.get(k);
  const d = DEF[k]; let g = null;
  if (d) { let length = 0; for (const s of d.s) for (let i = 1; i < s.length; i++) length += Math.hypot(s[i][0] - s[i - 1][0], s[i][1] - s[i - 1][1]);
    g = { w: d.w, strokes: d.s, length }; }
  cache.set(k, g); return g;
}
/** the advance of a character in cap-height units (a space is 0.42) */
export function strokeAdvance(ch) { if (ch === ' ') return 0.42; const g = strokeGlyph(ch); return g ? g.w : 0; }
/** every character this alphabet has */
export const STROKE_CHARS = Object.keys(DEF);
