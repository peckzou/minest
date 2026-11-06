"""My World 77 — the voxel world's console becomes My World's 2D console (tools/voxel/console77.js inside mn-voxel-62):
header, tools left, the tool's controls in the middle, view / undo / 2D / settings right, in the 2D console's own style.
Run after patch_build75.py and patch_terrain76.py (apply_all.sh runs the three in order). Safe to re-run."""
import re
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
FILES = ['iPhoneDuo.html', 'iPhoneDuo69.html', 'iphone.html', 'iPhone53.8241.html', 'index.html', 'ipad.html',
         'ios/Minest/Minest/iPhoneDuo.html', 'ios/Minest/Minest/index.html', 'ios/Minest/Minest/ipad.html',
         'ios/Minest/Minest/iphone.html', 'ios/Minest/Minest/iphone18.0.html']
MODULE = (HERE / 'console77.js').read_text(encoding='utf-8').rstrip('\n')
assert '</script' not in MODULE.lower()
for f in FILES:
    p = ROOT / f
    if not p.exists():
        continue
    s = p.read_text(encoding='utf-8')
    if '<script id="mn-voxel-62">' not in s or '76 · ⛰ 地形' not in s:
        continue
    i = s.index('<script id="mn-voxel-62">'); j = s.index('</script>', i); v = s[i:j]
    v = re.sub(r'  /\* =+ 77 · the voxel world.s console.*?(?=\n  window\.MinestVoxel62 = \{)', '', v, flags=re.S)
    v = re.sub(r'\n+(?=  window\.MinestVoxel62 = \{)', '\n', v, count=1)
    k = v.index('  window.MinestVoxel62 = {')
    v = v[:k] + MODULE + '\n' + v[k:]
    p.write_text(s[:i] + v + s[j:], encoding='utf-8')
    print('patched', f)
