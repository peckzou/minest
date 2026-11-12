#!/usr/bin/env python3
"""Magic Type Workshop — the host side, into the Minest pages. Safe to re-run (each piece is replaced, never doubled).

  1. My World furniture: 'f_typewriter' (a typewriter on a desk with a lamp), next to 'f_desk'.
  2. MinestDisplay.mtwEdit(fn): fn(record) inside My World's own change() — saved, synced and redrawn as any edit.
  3. The 3D walk-in (WKX): walking up to a typewriter shows 🖋 进入 Type Workshop (the action button doors use).
  4. tools/type-workshop/host.js as <script id="mn-type-workshop"> (overlay, data bridge, the Santorini house).
The workshop page itself is type3d/workshop.html (copied from the 3D Type pages folder)."""
import re
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
FILES = ['iPhoneDuo.html', 'iphone.html', 'index.html', 'ipad.html', 'iPhone53.8241.html',
         'ios/Minest/Minest/iPhoneDuo.html', 'ios/Minest/Minest/index.html', 'ios/Minest/Minest/ipad.html',
         'ios/Minest/Minest/iphone.html', 'ios/Minest/Minest/iphone18.0.html', 'ios/MinestProject/MyApp/iphone.html']
SF = (ROOT / 'type3d' / 'strokefont.js').read_text(encoding='utf-8')
SF = SF.replace('export function ', 'function ').replace('export const ', 'const ')
SF = ('(function () { if (window.__MTW_STROKE) return;\n' + SF +
      '\nwindow.__MTW_STROKE = { strokeGlyph: strokeGlyph, strokeAdvance: strokeAdvance, STROKE_CHARS: STROKE_CHARS };\n})();')
HOST = (SF + '\n' + (HERE / 'neon3d.js').read_text(encoding='utf-8').rstrip('\n') + '\n'
        + (HERE / 'host.js').read_text(encoding='utf-8').rstrip('\n'))
assert '</script' not in HOST.lower() and 'export ' not in SF

# 5. City Knowledge Run: a sign slot per knowledge shop (its building group survives the static merge), addSign(id, obj)
CITY = [
    ("    // ---- one whole building\n", "    var SIGNSLOT = [] /* mtw */;\n    // ---- one whole building\n"),
    ("      var gh = style === 'flagship' ? 7.6 : GH, H = gh + b.floors * A.floor;\n",
     "      var gh = style === 'flagship' ? 7.6 : GH, H = gh + b.floors * A.floor;\n"
     "      if (sh) SIGNSLOT.push({ id: sh.id, title: sh.title, g: g, W: W, gh: gh, H: H }) /* mtw */;\n"),
    ("    this.focusShop = focusShop;\n",
     "    /* mtw: shop signs from the Type Workshop */\n"
     "    this.signSlots = function () { return SIGNSLOT.map(function (s) { return { id: s.id, title: s.title }; }); };\n"
     "    this.addSign = function (id, obj) { var s = SIGNSLOT.filter(function (q) { return q.id === id; })[0]; if (!s || !obj) return null;\n"
     "      var w = (obj.userData && obj.userData.w) || 1, k = Math.min(1.1, (s.W * .82) / Math.max(.5, w)); obj.scale.setScalar(k); obj.position.set(0, s.gh + .42, .55); s.g.add(obj);\n"
     "      return function () { if (obj.parent) obj.parent.remove(obj); }; };\n"
     "    this.focusShop = focusShop;\n"),
]
def city(s, f):
    for a, b in CITY:
        if b in s:
            continue
        if s.count(a) == 1:
            s = s.replace(a, b)
        else:
            print('  city anchor missing in', f, '->', a.strip()[:40])
    return s
cj = ROOT / 'tools' / 'knowledge-rail' / 'city.js'
c0 = cj.read_text(encoding='utf-8'); c1 = city(c0, 'city.js')
if c1 != c0:
    cj.write_text(c1, encoding='utf-8'); print('patched tools/knowledge-rail/city.js')

FURN_ANCHOR = "    ['f_desk', 'Desk & chair',"
FURN_LINE = ("    ['f_typewriter', 'Typewriter desk', function (B) { /* mtw */ legs(B, 1.4, .8, .75, 'spruce'); fb(B, 0, 1.4, 0, .8, .75, .82, 'oak'); "
             "fb(B, .38, 1.02, .14, .52, .82, .88, 'dark'); fb(B, .42, .98, .16, .5, .88, .99, 'wool_cyan'); fb(B, .46, .94, .08, .2, .86, .92, 'white'); "
             "fb(B, .36, 1.04, .44, .52, .99, 1.06, 'blackstone'); fb(B, .52, .88, .45, .48, 1.03, 1.3, 'white'); fb(B, .3, .38, .44, .52, 1, 1.05, 'iron'); "
             "fb(B, 1.12, 1.18, .58, .64, .82, 1.12, 'gold'); fb(B, 1.04, 1.28, .52, .7, 1.1, 1.18, 'glowstone'); return { W: 1.4, D: .8 }; }],\n")
MD_ANCHOR = "  window.MinestDisplay = { resolve: function (ref"
MD_NEW = "  window.MinestDisplay = { /* mtw */ mtwEdit: function (fn) { if (!V) return false; change(function () { fn(V.d); }); return true; }, resolve: function (ref"
WK = [
    ("spawnT = 0, bld = [], seats = [],", "spawnT = 0, bld = [], tws = [] /* mtw */, seats = [],"),
    ("note: function (p, ext) { if (!p || ext[0] > ext[1]) return; if (enterable(p, ext)) bld.push({ p: p, ext: ext });",
     "note: function (p, ext) { if (!p || ext[0] > ext[1]) return; if (enterable(p, ext)) bld.push({ p: p, ext: ext }); if (p.k === 'f_typewriter') tws.push({ p: p, ext: ext }) /* mtw */;"),
    ("if (nearB) setAct('in', '🚪 Go into ' + bldName(nearB.p)); else if (nearP) {",
     "var nearT = null, bt = 1.7; tws.forEach(function (T0) { var e = T0.ext, dx = Math.max(e[0] - me.x, 0, me.x - e[1]), dz = Math.max(e[2] - me.z, 0, me.z - e[3]), d = Math.hypot(dx, dz); if (d < bt) { bt = d; nearT = T0; } }) /* mtw */; "
     "if (nearT && window.MinestTypeWorkshop) setAct('mtw', '🖋 进入 Type Workshop · 打字机'); else if (nearB) setAct('in', '🚪 Go into ' + bldName(nearB.p)); else if (nearP) {"),
    ("    S.add(picks);\n    Object.keys(BUF).forEach(function (n) {",
     "    S.add(picks);\n    if (room && window.MinestTypeWorkshop && MinestTypeWorkshop.roomShow) try { MinestTypeWorkshop.roomShow(T, S, roomOf(), lbox(), V.at); } catch (e) { console.warn('[mtw] room', e); } /* mtw */\n"
     "    Object.keys(BUF).forEach(function (n) {"),
    ("else if (a === 'portal' && nearP) goPortal(nearP); });",
     "else if (a === 'portal' && nearP) goPortal(nearP); else if (a === 'mtw' && window.MinestTypeWorkshop) MinestTypeWorkshop.open({ from: 'walk' }) /* mtw */; });"),
]

for f in FILES:
    p = ROOT / f
    if not p.exists():
        continue
    s = p.read_text(encoding='utf-8'); o = s
    # 1. furniture (only once)
    if FURN_ANCHOR in s and "['f_typewriter'," not in s:
        assert s.count(FURN_ANCHOR) == 1, f
        s = s.replace(FURN_ANCHOR, FURN_LINE + FURN_ANCHOR)
    # 2. the edit entry
    if MD_ANCHOR in s and 'mtwEdit:' not in s:
        assert s.count(MD_ANCHOR) == 1, f
        s = s.replace(MD_ANCHOR, MD_NEW)
    # 3. the walk-in action
    for a, b in WK:
        if b in s:
            continue
        if s.count(a) == 1:
            s = s.replace(a, b)
        else:
            print('  walk-in anchor missing in', f, '->', a[:40])
    # 5. the City sign slots (only pages that carry the City)
    if 'window.MinestCity = {' in s:
        s = city(s, f)
    # 4. the host
    s = re.sub(r'<script id="mn-type-workshop">.*?</script>\n', '', s, flags=re.S)
    i = s.rfind('</body>')
    if i >= 0 and 'MinestDisplay' in s:
        s = s[:i] + '<script id="mn-type-workshop">\n' + HOST + '\n</script>\n' + s[i:]
    if s != o:
        p.write_text(s, encoding='utf-8')
        print('patched', f)
