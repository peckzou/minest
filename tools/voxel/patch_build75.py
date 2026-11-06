"""My World 75 — 🧱 建造 in the voxel world (体素世界 62): build it yourself, on top of the island / room that 62 converts.

- mn-voxel-62 gets the module tools/voxel/build75.js (inside its scope: the block registry, the voxel world, the chunk
  mesher), a 🧱 建造 tab in the dock, and taps on the world reach the picked tool again (68/69 had removed them).
- mn-display-script gets window.__vxStore: the build steps live in the island's own data (islandD().vox.b75[context]),
  synced with it; a step is a My World history step, so the top bar's ↶ ↷ take it back.
Safe to re-run."""
import re
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
FILES = ['iPhoneDuo.html', 'iPhoneDuo69.html', 'iphone.html', 'iPhone53.8241.html', 'index.html', 'ipad.html',
         'ios/Minest/Minest/iPhoneDuo.html', 'ios/Minest/Minest/index.html', 'ios/Minest/Minest/ipad.html',
         'ios/Minest/Minest/iphone.html', 'ios/Minest/Minest/iphone18.0.html']
MODULE = (HERE / 'build75.js').read_text(encoding='utf-8')
assert '</script' not in MODULE.lower()
V62 = [
    ("  var DOCK = [['look', '👆', '浏览'], ['put', '🧩', '摆放'],",
     "  var DOCK = [['look', '👆', '浏览'], ['build', '🧱', '建造'], ['put', '🧩', '摆放'],"),
    ("    if (t === 'build') tool = R.tool === 'place' ? 'place' : 'break';",
     "    if (t === 'build') tool = 'build';   /* 75 */"),
    ("      h = '<div class=\"row\"><span class=\"lab\">整栋建筑、树木和家具请用 🧩 摆放 / 🏠 房间</span></div>';",
     "      h = buildSheet();   /* 75 */"),
    ("    if (tool === 'break' || tool === 'place') return; /* 69: no single-block destruction or placement */",
     "    if (tool === 'build') return buildTap(hit);   /* 75: 🧱 建造 */\n    if (tool === 'break' || tool === 'place') return; /* 69: no single-block destruction or placement */"),
    ("R.tool = t; $('[data-p=\"act\"]').textContent = { break: '⛏',",
     "R.tool = t; $('[data-p=\"act\"]').textContent = { build: '🧱', break: '⛏',"),
    ("        /* 69: no tap block placing */",
     "        if (R.tool !== 'look' && !/^ter:/.test(R.tool)) act(pickAt(e.clientX, e.clientY), R.tool);   /* 75: a tap uses the picked tool */"),
    ("      applyEdits();\n      R.atlasTex.needsUpdate = true;",
     "      applyEdits();\n      applyOps();   /* 75: your build steps */\n      R.atlasTex.needsUpdate = true;"),
]
STORE = """
    /* 75 · the voxel world's build steps (体素世界 🧱 建造), kept in the island's own data and its history */
    window.__vxStore = {
      get: function (k) { if (!V) return null; var R = islandD(); return (R.vox && R.vox.b75 && R.vox.b75[k]) || null; },
      set: function (k, ops) { if (!V || V.visit) return false; var R = islandD(); histNote(V.bid, R); R.vox = R.vox || { edits: [] }; R.vox.b75 = R.vox.b75 || {}; if (ops && ops.length) R.vox.b75[k] = JSON.parse(JSON.stringify(ops)); else delete R.vox.b75[k]; save(true); return true; }   // in vox: part of every history step
    };"""
ANCHOR = "    MinestOia.bind(hooks); };"

for f in FILES:
    p = ROOT / f
    if not p.exists():
        continue
    s = p.read_text(encoding='utf-8')
    if '<script id="mn-voxel-62">' not in s:
        continue
    i = s.index('<script id="mn-voxel-62">'); j = s.index('</script>', i); v = s[i:j]
    if '/* 75 */' not in v:
        for a, b in V62:
            assert v.count(a) == 1, (f, a[:60], v.count(a))
            v = v.replace(a, b)
        k = v.index('  window.MinestVoxel62 = {')
        v = v[:k] + MODULE.rstrip('\n') + '\n' + v[k:]
    else:   # the module itself is refreshed
        v = re.sub(r'  /\* =+ 75 · 🧱 建造.*?(?=\n  window\.MinestVoxel62 = \{)', lambda m: MODULE.rstrip('\n'), v, flags=re.S)
    s = s[:i] + v + s[j:]
    s = re.sub(r'\n    /\* 75 · the voxel world.s build steps.*?\n    \};', '', s, flags=re.S)   # the store, refreshed
    assert s.count(ANCHOR) == 1, (f, 'store anchor')
    s = s.replace(ANCHOR, ANCHOR + STORE, 1)
    # Walk in: the Kiro worlds' checks named W, which is not defined there (ReferenceError → no Walk in, no voxel world)
    s = re.sub(r"if \(W && W\.mega && W\.mega\.kind === '(\w+)'\)",
               lambda m: "if (((typeof W !== 'undefined' && W && W.mega && W.mega.kind === '%s') || (V && V.d && V.d.terr && V.d.terr.scape === '%s')) && !(V && V.at && V.at.room))" % (m.group(1), m.group(1)), s)
    p.write_text(s, encoding='utf-8')
    print('patched', f)
