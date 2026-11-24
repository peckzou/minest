#!/usr/bin/env python3
"""3D Type · Chinese input for the classic pages (type3d/*.html).

    python3 tools/type3d/patch_hanzi.py            # patch
    python3 tools/type3d/patch_hanzi.py --check    # exits 1 when a page is not patched

Each page gets
  · <script src="ime.js"> after its hidden #kb field (input methods: see type3d/ime.js),
  · the import of type3d/hanzi.js and one changed line where the page looks a character up:
      solid letters (Filament, Firework, Topiary, Book)   font.data.glyphs[ch]  →  hanziTypeface(font, ch)
      one-stroke letters (Saber, Neon)                    strokeGlyph(ch)       →  strokeGlyph(ch) || hanziStrokes(ch)
      Quill                                               a character the script font lacks is written from its strokes
Running it again changes nothing."""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2] / 'type3d'
IME = '<script src="ime.js"></script>'
SOLID = "import { hanziTypeface } from './hanzi.js';"
STROKE = "import { hanziStrokes } from './hanzi.js';"
THREE = "import * as THREE from 'three';\n"
SF = "import { strokeGlyph, strokeAdvance } from './strokefont.js';\n"
QUILL_FN = '''function hanziPen(ch) {      // a Chinese character: its strokes as the stroke data has them, written with a pointed pen
  const h = hanziStrokes(ch); if (!h) return null;
  const S = 0.62, step = STEP_R / EMR;
  const strokes = h.strokes.map(st => { const cum = [0]; for (let i = 1; i < st.length; i++) cum.push(cum[i - 1] + Math.hypot(st[i][0] - st[i - 1][0], st[i][1] - st[i - 1][1]));
    const len = cum[cum.length - 1], n = Math.max(2, Math.ceil(len * S / step)), o = new Float32Array((n + 1) * 3); let k = 0;
    for (let i = 0; i <= n; i++) { const u = i / n, d = len * u; while (k < st.length - 2 && cum[k + 1] < d) k++;
      const t = cum[k + 1] > cum[k] ? (d - cum[k]) / (cum[k + 1] - cum[k]) : 0, a = st[k], b = st[k + 1];
      const press = Math.min(1, 0.55 + u * 2.2) * (1 - 0.72 * Math.pow(Math.max(0, (u - 0.58) / 0.42), 1.5));
      o[i * 3] = (a[0] + (b[0] - a[0]) * t) * S; o[i * 3 + 1] = -(a[1] + (b[1] - a[1]) * t) * S; o[i * 3 + 2] = 0.0155 * press; }
    return o; });
  return { g: null, adv: h.w * S, strokes };
}
'''
EDITS = {
    'index.html': [(THREE, THREE + SOLID + '\n'), ("const data = font.data.glyphs[ch]; if (!data)", "const data = hanziTypeface(font, ch); if (!data)")],
    'firework.html': [(THREE, THREE + SOLID + '\n'), ("const d = font.data.glyphs[ch]; if (!d)", "const d = hanziTypeface(font, ch); if (!d)")],
    'topiary.html': [(THREE, THREE + SOLID + '\n'), ("const d = font.data.glyphs[ch]; if (!d)", "const d = hanziTypeface(font, ch); if (!d)")],
    'book.html': [(THREE, THREE + SOLID + '\n'), ("const d = font.data.glyphs[ch]; if (!d)", "const d = hanziTypeface(font, ch); if (!d)")],
    'saber.html': [(SF, SF + STROKE + '\n'), ("const sg = strokeGlyph(ch); let g = null;", "const sg = strokeGlyph(ch) || hanziStrokes(ch); let g = null;")],
    'neon.html': [(SF, SF + STROKE + '\n'), ("const g = strokeGlyph(ch); let def = null;", "const g = strokeGlyph(ch) || hanziStrokes(ch); let def = null;")],
    'quill.html': [(THREE, THREE + STROKE + '\n'),
                   ("  glyphs.set(ch, d); return d;\n}\n", "  if (!d) d = hanziPen(ch);\n  glyphs.set(ch, d); return d;\n}\n" + QUILL_FN)],
}


def main():
    check, bad = '--check' in sys.argv, []
    for name, edits in EDITS.items():
        f = ROOT / name
        s = f.read_text(encoding='utf-8')
        o = s
        if IME not in s:
            i = s.index('<input id="kb"')
            j = s.index('>', i) + 1
            s = s[:j] + '\n' + IME + s[j:]
        if './hanzi.js' not in s:
            for a, b in edits:
                if s.count(a) != 1:
                    raise SystemExit('%s: expected one %r, found %d' % (name, a[:50], s.count(a)))
                s = s.replace(a, b)
        if s != o:
            bad.append(name)
            if not check:
                f.write_text(s, encoding='utf-8')
    print(('not patched: ' if check else 'patched: ') + (', '.join(bad) or 'nothing'))
    return 1 if check and bad else 0


if __name__ == '__main__':
    sys.exit(main())
