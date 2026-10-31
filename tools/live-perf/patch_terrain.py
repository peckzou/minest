"""My World terrain (world_terrain.js): hills, rivers and lakes as part of the island. The TR module goes into the display
script before the Scene System's render; the island scene sorts the terrain with the pieces and lifts pieces onto
hills / bridges; undo keeps it; the 🚶 walk builds it. Run after patch_world_fold.py and patch_walk_in.py (the
walk's build call); safe to re-run (world_terrain.js is replaced with its current text)."""
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
FILES = ['iPhone53.8241.html', 'iphone.html', 'index.html', 'ipad.html', 'iPhoneDuo.html', 'ios/Minest/Minest/iphone.html',
         'ios/Minest/Minest/iphone18.0.html', 'ios/Minest/Minest/ipad.html', 'ios/MinestProject/MyApp/iphone.html']
JS = (HERE / 'world_terrain.js').read_text(encoding='utf-8')
START, END = '  /* ── My World · Island System · Terrain (patch_terrain.py)', '  })();\n'
ANCHOR = '  /* ── My World · Scene System · render, camera'
FILTER = "scene(V.d.pc.filter(function (p) { return BUILD[p.k] && !(K[p.k] && K[p.k].mob) && !moving(p) && shownHere(p); }))"
EDITS = [
    ("scene.parts = null; var scs = " + FILTER + ";", "scene.parts = null; var scs = scene(TR.lift(V.d.pc.filter(function (p) { return BUILD[p.k] && !(K[p.k] && K[p.k].mob) && !moving(p) && shownHere(p); })));   /* hills, rivers and lakes sort with the pieces (TR) */"),
    ("shownHere(p); })));   // hills, rivers and lakes sort with the pieces (TR)", "shownHere(p); })));   /* hills, rivers and lakes sort with the pieces (TR) */"),
    ("  function scene(pcs, rotv) {\n    var all = [], tags = [];", "  function scene(pcs, rotv) {\n    var all = pcs && pcs.__ter ? TR.parts(rotv) : [], tags = [];"),
    ("var sl = order(all).map(function (q) { return '<g class=\"pc' + (q.pc === sel", "var sl = order(all).map(function (q) { if (q.ter) return '<g class=\"ter\">' + drawBox(q) + '</g>'; return '<g class=\"pc' + (q.pc === sel"),
    ("arch: R.arch || null, archLand: R.archLand || null, view: R.view || null }); }", "arch: R.arch || null, archLand: R.archLand || null, view: R.view || null, terr: R.terr || null }); }"),
    ("['pg', 'arch', 'archLand', 'view'].forEach(function (k) { if (s[k]) R[k] = s[k]; else delete R[k]; });", "['pg', 'arch', 'archLand', 'view', 'terr'].forEach(function (k) { if (s[k]) R[k] = s[k]; else delete R[k]; });"),
    ("try { b = build(K[p.k].air ? Object.assign({}, p, { z: 2.6 }) : p, its, 0); }", "try { b = build(K[p.k].air ? Object.assign({}, p, { z: 2.6 }) : room ? p : TR.lift1(p), its, 0); }"),
    ("    // ---- every piece, as it stands", "    if (!room) TR.walk(box);   // hills, rivers and lakes (TR)\n    // ---- every piece, as it stands"),
]
for f in FILES:
    p = ROOT / f
    s = p.read_text(encoding='utf-8')
    i = s.find(START)
    if i >= 0:
        j = s.index(END, s.index('  var TR = (function () {', i)) + len(END)
        s = s[:i] + s[j:]
    assert s.count(ANCHOR) == 1, (f, 'anchor')
    s = s.replace(ANCHOR, JS + ANCHOR)
    for a, b in EDITS:
        if b in s: continue
        assert s.count(a) == 1, (f, a[:70])
        s = s.replace(a, b)
    p.write_text(s, encoding='utf-8')
    print('patched', f)
