"""My World 76 — ⛰ 地形 in the voxel world: quick to shape, and it looks real (after tools/voxel/patch_build75.py).

- mn-voxel-62 gets tools/voxel/terrain76.js: natural sculpting of the island's terrain after every conversion (heights
  flow between cells, slope / height materials, lake beds, five looks; columns with buildings, displays or trees are
  left as converted), one-tap landscapes, soft brushes (and ▲ a whole peak in one tap) written straight to the data.
  The old brush (pointer strokes on the 2D island) stays as terStroke0. A tap with a terrain tool now paints too.
- mn-display-script gets window.__terStore: the island's terrain read and written with a history step (↶ ↷).
Safe to re-run."""
import re
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
FILES = ['iPhoneDuo.html', 'iPhoneDuo69.html', 'iphone.html', 'iPhone53.8241.html', 'index.html', 'ipad.html',
         'ios/Minest/Minest/iPhoneDuo.html', 'ios/Minest/Minest/index.html', 'ios/Minest/Minest/ipad.html',
         'ios/Minest/Minest/iphone.html', 'ios/Minest/Minest/iphone18.0.html']
MODULE = (HERE / 'terrain76.js').read_text(encoding='utf-8').rstrip('\n')
assert '</script' not in MODULE.lower()
V62 = [
    ("  function terStroke(tool, hits) {\n    if (inRoom()) return toast('地形只在岛上（不在房间里）');\n    if (!R.vw || !hits.length) return;\n    var cells = brushCells(hits)",
     "  function terStroke0(tool, hits) {   /* 76: the old strokes on the 2D island (terrain76.js has the new terStroke) */\n    if (inRoom()) return toast('地形只在岛上（不在房间里）');\n    if (!R.vw || !hits.length) return;\n    var cells = brushCells(hits)"),
    ("      applyEdits();\n      applyOps();   /* 75: your build steps */",
     "      applyEdits();\n      terSculpt();   /* 76: the terrain, naturally */\n      applyOps();   /* 75: your build steps */"),
    ("        if (R.tool !== 'look' && !/^ter:/.test(R.tool)) act(pickAt(e.clientX, e.clientY), R.tool);   /* 75: a tap uses the picked tool */",
     "        if (R.tool !== 'look') act(pickAt(e.clientX, e.clientY), R.tool);   /* 75 / 76: a tap uses the picked tool (a terrain brush too) */"),
]
STORE = """
    /* 76 · the island's terrain for the voxel world's ⛰ tools: read, and written as one history step */
    window.__terStore = {
      get: function () { if (!V) return null; var R = islandD(); return R.terr ? JSON.parse(JSON.stringify(R.terr)) : null; },
      set: function (t) { if (!V || V.visit) return false; var R = islandD(); histNote(V.bid, R); R.terr = JSON.parse(JSON.stringify(t)); save(true); try { refreshLand(); render(); } catch (e) {} return true; }
    };"""
ANCHOR = "    MinestOia.bind(hooks); };"

for f in FILES:
    p = ROOT / f
    if not p.exists():
        continue
    s = p.read_text(encoding='utf-8')
    if '<script id="mn-voxel-62">' not in s or '75 · 🧱 建造' not in s:
        continue
    i = s.index('<script id="mn-voxel-62">'); j = s.index('</script>', i); v = s[i:j]
    if '/* 76: the terrain, naturally */' not in v:
        for a, b in V62:
            assert v.count(a) == 1, (f, a[:60], v.count(a))
            v = v.replace(a, b)
    v = re.sub(r'  /\* =+ 76 · ⛰ 地形.*?(?=\n  window\.MinestVoxel62 = \{)', '', v, flags=re.S)   # refreshed below
    v = re.sub(r'\n+(?=  window\.MinestVoxel62 = \{)', '\n', v, count=1)
    k = v.index('  window.MinestVoxel62 = {')
    v = v[:k] + MODULE + '\n' + v[k:]
    s = s[:i] + v + s[j:]
    s = re.sub(r'\n    /\* 76 · the island.s terrain for the voxel world.*?\n    \};', '', s, flags=re.S)
    assert s.count(ANCHOR) == 1, (f, 'store anchor')
    s = s.replace(ANCHOR, ANCHOR + STORE, 1)
    p.write_text(s, encoding='utf-8')
    print('patched', f)
