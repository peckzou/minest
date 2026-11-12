"""My World 79 — one flow for both worlds (tools/voxel/levels79.js inside mn-voxel-62): My World's own console drives the
voxel world level by level (New · Gallery · Group · Smart, Base → Detail, Lock, Confirm, Edit); the voxel console
shrinks to a strip of voxel-only tools. Run after patch_show78.py (apply_all.sh runs them in order). Safe to re-run."""
import re
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
FILES = ['iPhoneDuo.html', 'iPhoneDuo69.html', 'iphone.html', 'iPhone53.8241.html', 'index.html', 'ipad.html',
         'ios/Minest/Minest/iPhoneDuo.html', 'ios/Minest/Minest/index.html', 'ios/Minest/Minest/ipad.html',
         'ios/Minest/Minest/iphone.html', 'ios/Minest/Minest/iphone18.0.html']
MODULE = (HERE / 'levels79.js').read_text(encoding='utf-8').rstrip('\n')
assert '</script' not in MODULE.lower()
for f in FILES:
    p = ROOT / f
    if not p.exists():
        continue
    s = p.read_text(encoding='utf-8')
    if '<script id="mn-voxel-62">' not in s or '77 · the voxel world' not in s:
        continue
    i = s.index('<script id="mn-voxel-62">'); j = s.index('</script>', i); v = s[i:j]
    v = re.sub(r'  /\* =+ 79 · one flow for both worlds.*?(?=\n  window\.MinestVoxel62 = \{)', '', v, flags=re.S)
    v = re.sub(r'\n+(?=  window\.MinestVoxel62 = \{)', '\n', v, count=1)
    k = v.index('  window.MinestVoxel62 = {')
    v = v[:k] + MODULE + '\n' + v[k:]
    # a new scope (another room, level) is not "new things placed": compare against what was there before only within one scope
    A3 = "R.hash = stateHash(); R.scope = scopeKey(); trackNew();"
    if A3 in v and v.count(A3) == 1:
        v = v.replace(A3, "R.hash = stateHash(); var sc79 = scopeKey(); if (sc79 !== R.scope) R.ids = null; R.scope = sc79; trackNew();")
    s = s[:i] + v + s[j:]
    # the 2D display view says which fixture it shows, so the voxel world can bring the camera to it (5–6/6)
    A2 = "e2.setAttribute('aria-label', p.label || K[p.k].n);"
    if A2 in s and "e2.setAttribute('data-pv-pc', pcId)" not in s and s.count(A2) == 1:
        s = s.replace(A2, A2 + " e2.setAttribute('data-pv-pc', pcId);")
    p.write_text(s, encoding='utf-8')
    print('patched', f)
