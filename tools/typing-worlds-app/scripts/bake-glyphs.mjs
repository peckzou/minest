#!/usr/bin/env node
/**
 * Bake Hershey single-stroke fonts into a compact JSON used by the Glyph Path Engine.
 *
 * Output coordinates: y-up, baseline = 0, cap height = 1, x starts at 0 (left side bearing
 * included), `a` = advance width. Each glyph is a list of strokes (pen-down polylines) in
 * natural drawing order, which is what tools (chalk, quill, wand…) follow.
 *
 * The Hershey Fonts were originally created by Dr. A. V. Hershey while working at the
 * U. S. National Bureau of Standards. JSON port: hersheytext (MIT) by techninja.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const here = dirname(fileURLToPath(import.meta.url));
const src = JSON.parse(readFileSync(require.resolve('hersheytext/hersheytext.json'), 'utf8'));

const FONTS = { sans: 'futural', script: 'scripts', serif: 'timesr' };
const BASELINE = 22; // hershey baseline (y-down)
const CAP = 21; // cap height in hershey units

function parse(d) {
  const strokes = [];
  let cur = null;
  const tokens = d.trim().split(/\s+/);
  for (let tok of tokens) {
    let cmd = null;
    if (/^[ML]/.test(tok)) {
      cmd = tok[0];
      tok = tok.slice(1);
    }
    if (cmd === 'M') {
      cur = [];
      strokes.push(cur);
    }
    if (!tok) continue;
    const [x, y] = tok.split(',').map(Number);
    if (!cur) {
      cur = [];
      strokes.push(cur);
    }
    cur.push(x, y);
  }
  return strokes.filter((s) => s.length >= 4);
}

const out = {};
for (const [key, name] of Object.entries(FONTS)) {
  const font = src[name];
  const glyphs = {};
  font.chars.forEach((g, i) => {
    const ch = String.fromCharCode(33 + i);
    const strokes = parse(g.d).map((s) => {
      const o = [];
      for (let k = 0; k < s.length; k += 2) {
        o.push(+(s[k] / CAP).toFixed(4), +((BASELINE - s[k + 1]) / CAP).toFixed(4));
      }
      return o;
    });
    glyphs[ch] = { a: +((g.o * 2) / CAP).toFixed(4), s: strokes };
  });
  glyphs[' '] = { a: 0.55, s: [] };
  out[key] = glyphs;
}

const dest = join(here, '../src/engine/glyphs/data/hershey.json');
writeFileSync(dest, JSON.stringify(out));
console.log('baked', Object.keys(out).join(', '), '→', dest);
