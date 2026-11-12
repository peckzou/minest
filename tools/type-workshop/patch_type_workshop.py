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
        + (HERE / 'space.js').read_text(encoding='utf-8').rstrip('\n') + '\n'
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
# Phase 6 (magic): the neon portal, the DRINK ME bottle and three tiny pieces only worth a look once you are small
FURN_MORE = [
    ('f_neonportal', "    ['f_neonportal', 'Neon portal', function (B) { /* mtw */ fb(B, 0, 1.4, 0, .4, 0, .12, 'blackstone'); fb(B, 0, .16, .1, .3, .12, 2.3, 'blackstone'); fb(B, 1.24, 1.4, .1, .3, .12, 2.3, 'blackstone'); "
                     "fb(B, 0, 1.4, .1, .3, 2.3, 2.46, 'blackstone'); fb(B, .16, .22, .14, .26, .12, 2.3, 'wool_purple'); fb(B, 1.18, 1.24, .14, .26, .12, 2.3, 'wool_purple'); fb(B, .16, 1.24, .14, .26, 2.24, 2.3, 'wool_purple'); "
                     "fb(B, .22, 1.18, .18, .22, .12, 2.24, 'aqua'); return { W: 1.4, D: .4 }; }],\n"),
    ('f_drinkme', "    ['f_drinkme', 'DRINK ME bottle', function (B) { /* mtw */ legs(B, .5, .5, .45, 'oak'); fb(B, 0, .5, 0, .5, .45, .5, 'oak'); fb(B, .17, .33, .17, .33, .5, .72, 'glass'); fb(B, .19, .31, .19, .31, .5, .64, 'wool_purple'); "
                  "fb(B, .22, .28, .22, .28, .72, .8, 'glass'); fb(B, .215, .285, .215, .285, .8, .85, 'oak'); fb(B, .16, .34, .16, .17, .56, .64, 'white'); return { W: .5, D: .5 }; }],\n"),
    ('f_tinycabinet', "    ['f_tinycabinet', 'Tiny drawer cabinet', function (B) { /* mtw */ fb(B, 0, .34, 0, .2, 0, .36, 'spruce'); [.03, .14, .25].forEach(function (z) { fb(B, .02, .32, -.012, 0, z, z + .08, 'oak'); fb(B, .155, .185, -.02, -.012, z + .03, z + .05, 'gold'); }); "
                      "fb(B, -.01, .35, -.01, .21, .36, .38, 'dark'); return { W: .34, D: .2 }; }],\n"),
    ('f_postcards', "    ['f_postcards', 'Postcard rack', function (B) { /* mtw */ fb(B, 0, .28, 0, .14, 0, .02, 'iron'); fb(B, .13, .15, .06, .08, .02, .34, 'iron'); fb(B, .01, .12, .03, .04, .06, .14, 'wool_red'); fb(B, .16, .27, .03, .04, .06, .14, 'wool_blue'); "
                    "fb(B, .01, .12, .03, .04, .16, .24, 'wool_yellow'); fb(B, .16, .27, .03, .04, .16, .24, 'wool_cyan'); fb(B, .01, .12, .03, .04, .26, .33, 'white'); fb(B, .16, .27, .03, .04, .26, .33, 'wool_orange'); return { W: .28, D: .14 }; }],\n"),
    ('f_wordbox', "    ['f_wordbox', 'Word collection', function (B) { /* mtw */ fb(B, 0, .5, .16, .18, 0, .42, 'dark'); fb(B, 0, .02, 0, .18, 0, .42, 'dark'); fb(B, .48, .5, 0, .18, 0, .42, 'dark'); "
                  "[0, .14, .28].forEach(function (z) { fb(B, 0, .5, 0, .18, z, z + .02, 'quartz'); }); fb(B, 0, .5, 0, .18, .42, .44, 'gold'); return { W: .5, D: .18 }; }],\n"),
]
MD_ANCHOR = "  window.MinestDisplay = { resolve: function (ref"
MD_NEW = "  window.MinestDisplay = { /* mtw */ mtwEdit: function (fn) { if (!V) return false; change(function () { fn(V.d); }); return true; }, resolve: function (ref"
WK = [   # (original, current, [earlier versions of current to migrate])
    ("spawnT = 0, bld = [], seats = [],", "spawnT = 0, bld = [], tws = [] /* mtw */, seats = [],", []),
    ("note: function (p, ext) { if (!p || ext[0] > ext[1]) return; if (enterable(p, ext)) bld.push({ p: p, ext: ext });",
     "note: function (p, ext) { if (!p || ext[0] > ext[1]) return; if (enterable(p, ext)) bld.push({ p: p, ext: ext }); if (/^f_(typewriter|neonportal|drinkme)$/.test(p.k)) tws.push({ p: p, ext: ext }) /* mtw */;",
     ["note: function (p, ext) { if (!p || ext[0] > ext[1]) return; if (enterable(p, ext)) bld.push({ p: p, ext: ext }); if (p.k === 'f_typewriter') tws.push({ p: p, ext: ext }) /* mtw */;"]),
    ("if (nearB) setAct('in', '🚪 Go into ' + bldName(nearB.p)); else if (nearP) {",
     "var nearT = null, bt = 1.7; tws.forEach(function (T0) { var e = T0.ext, dx = Math.max(e[0] - me.x, 0, me.x - e[1]), dz = Math.max(e[2] - me.z, 0, me.z - e[3]), d = Math.hypot(dx, dz); if (d < bt) { bt = d; nearT = T0; } }) /* mtw */; "
     "if (nearT && window.MinestTypeWorkshop) setAct('mtw:' + nearT.p.k, MinestTypeWorkshop.actLabel(nearT.p.k)); else if (nearB) setAct('in', '🚪 Go into ' + bldName(nearB.p)); else if (nearP) {",
     ["var nearT = null, bt = 1.7; tws.forEach(function (T0) { var e = T0.ext, dx = Math.max(e[0] - me.x, 0, me.x - e[1]), dz = Math.max(e[2] - me.z, 0, me.z - e[3]), d = Math.hypot(dx, dz); if (d < bt) { bt = d; nearT = T0; } }) /* mtw */; "
      "if (nearT && window.MinestTypeWorkshop) setAct('mtw', '🖋 进入 Type Workshop · 打字机'); else if (nearB) setAct('in', '🚪 Go into ' + bldName(nearB.p)); else if (nearP) {"]),
    ("    S.add(picks);\n    Object.keys(BUF).forEach(function (n) {",
     "    S.add(picks);\n    if (room && window.MinestTypeWorkshop && MinestTypeWorkshop.roomShow) try { MinestTypeWorkshop.roomShow(T, S, roomOf(), lbox(), V.at); } catch (e) { console.warn('[mtw] room', e); } /* mtw */\n"
     "    Object.keys(BUF).forEach(function (n) {", []),
    ("else if (a === 'portal' && nearP) goPortal(nearP); });",
     "else if (a === 'portal' && nearP) goPortal(nearP); else if (a && String(a).indexOf('mtw:') === 0 && window.MinestTypeWorkshop) MinestTypeWorkshop.act(String(a).slice(4)) /* mtw */; });",
     ["else if (a === 'portal' && nearP) goPortal(nearP); else if (a === 'mtw' && window.MinestTypeWorkshop) MinestTypeWorkshop.open({ from: 'walk' }) /* mtw */; });"]),
    # DRINK ME: the walker's eye, radius, step and speed follow window.__mtwScale (1 = normal); a new scene starts full size
    ("    var EYE = room ? 1.55 : 1.7, RAD = .28, STEP = .6;\n",
     "    var EYE = room ? 1.55 : 1.7, RAD = .28, STEP = .6, EYE0 = EYE; window.__mtwScale = 1 /* mtw */;\n", []),
    ("sp = (me.run || K2.shift && !me.fly ? 6 : 3.2) * (me.fly ? 1.6 : 1);",
     "sp = (me.run || K2.shift && !me.fly ? 6 : 3.2) * (me.fly ? 1.6 : 1); var MS = window.__mtwScale || 1; sp *= MS; EYE = EYE0 * MS; RAD = .28 * MS; STEP = .6 * MS /* mtw */;", []),
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
    for k, line in FURN_MORE:
        if FURN_ANCHOR in s and "['" + k + "'," not in s:
            s = s.replace(FURN_ANCHOR, line + FURN_ANCHOR)
    # 2. the edit entry
    if MD_ANCHOR in s and 'mtwEdit:' not in s:
        assert s.count(MD_ANCHOR) == 1, f
        s = s.replace(MD_ANCHOR, MD_NEW)
    # 3. the walk-in action
    for a, b, olds in WK:
        if b in s:
            continue
        old = [x for x in olds if s.count(x) == 1]
        if old:
            s = s.replace(old[0], b)
        elif s.count(a) == 1:
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
