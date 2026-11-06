"""My World 78 — 🏛 展馆 in the voxel world: cards to an exhibition in a few taps (tools/voxel/show78.js in mn-voxel-62,
tools/voxel/show78-store.js as window.__showStore in mn-display-script). Run after patch_console77.py (apply_all.sh).
Safe to re-run."""
import re
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
FILES = ['iPhoneDuo.html', 'iPhoneDuo69.html', 'iphone.html', 'iPhone53.8241.html', 'index.html', 'ipad.html',
         'ios/Minest/Minest/iPhoneDuo.html', 'ios/Minest/Minest/index.html', 'ios/Minest/Minest/ipad.html',
         'ios/Minest/Minest/iphone.html', 'ios/Minest/Minest/iphone18.0.html']
MODULE = (HERE / 'show78.js').read_text(encoding='utf-8').rstrip('\n')
STORE = (HERE / 'show78-store.js').read_text(encoding='utf-8').rstrip('\n')
assert '</script' not in MODULE.lower() and '</script' not in STORE.lower()
V62 = [
    ("  var DOCK = [['look', '👆', '浏览'], ['build', '🧱', '建造'],", "  var DOCK = [['look', '👆', '浏览'], ['hall', '🏛', '展馆'], ['build', '🧱', '建造'],   /* 78 */"),
    ("show: 'show', smart: 'look' }[t];", "show: 'show', smart: 'look', hall: 'look' }[t];"),
    ("      applyOps();   /* 75: your build steps */", "      applyOps();   /* 75: your build steps */\n      try { cards78(); } catch (e) {}   /* 78: the cards on their displays */"),
]
ANCHOR = "    MinestOia.bind(hooks); };"
for f in FILES:
    p = ROOT / f
    if not p.exists():
        continue
    s = p.read_text(encoding='utf-8')
    if '<script id="mn-voxel-62">' not in s or '77 · the voxel world' not in s:
        continue
    i = s.index('<script id="mn-voxel-62">'); j = s.index('</script>', i); v = s[i:j]
    if "/* 78: the cards on their displays */" not in v:
        v = v.replace("      applyOps();   /* 75: your build steps */", "      applyOps();   /* 75: your build steps */\n      try { cards78(); } catch (e) {}   /* 78: the cards on their displays */", 1)
    if "['hall', '🏛', '展馆']" not in v:
        for a, b in V62[:2]:
            assert v.count(a) == 1, (f, a[:60], v.count(a))
            v = v.replace(a, b)
    v = re.sub(r'  /\* =+ 78 · 🏛 展馆.*?(?=\n  window\.MinestVoxel62 = \{)', '', v, flags=re.S)
    v = re.sub(r'\n+(?=  window\.MinestVoxel62 = \{)', '\n', v, count=1)
    k = v.index('  window.MinestVoxel62 = {')
    v = v[:k] + MODULE + '\n' + v[k:]
    s = s[:i] + v + s[j:]
    s = re.sub(r'\n    /\* 78 · 展馆 — the exhibition flow.*?\n    \};', '', s, flags=re.S)
    assert s.count(ANCHOR) == 1, (f, 'store anchor')
    s = s.replace(ANCHOR, ANCHOR + STORE, 1)
    p.write_text(s, encoding='utf-8')
    print('patched', f)
