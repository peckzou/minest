"""Studio World Island Library 4 → My World (iPhone 53.8241, in place; then copied to iphone.html, index.html, the iOS copies).
- <script id="mn-assets3d-src"> ← tools/myworld3/dist/assets3d-lib4.js (built by `node tools/myworld3/bundle-lib4.mjs` from
  tools/myworld3/assets3d-lib4.ts + the vendored tools/myworld3/studio-lib4): 120 buildings, 114 worlds, 110 sub-islands,
  60 dioramas, 370 objects; every 53.6 asset keeps its id, its builder and its cached thumbnail.
- tools/live-perf/world_lib4.js goes into the display script: 🔨 Build → Signature buildings · Museums, and a ✨ Studio tab.
Re-running replaces both with the current files.
"""
from pathlib import Path
import shutil

ROOT = Path('/Users/cece/Documents/minest'); HERE = ROOT / 'tools/live-perf'
SRC = ROOT / 'iPhone53.8241.html'
COPIES = ['iphone.html', 'index.html', 'ios/Minest/Minest/iphone.html', 'ios/MinestProject/MyApp/iphone.html', 'ios/Minest/Minest/iphone18.0.html']
s = SRC.read_text(encoding='utf-8')
lib = (ROOT / 'tools/myworld3/dist/assets3d-lib4.js').read_text(encoding='utf-8'); assert '</script' not in lib and 'lib4:' in lib
o = '<script type="text/plain" id="mn-assets3d-src">'; a = s.index(o) + len(o); b = s.index('</script>', a); s = s[:a] + lib + s[b:]
JS = (HERE / 'world_lib4.js').read_text(encoding='utf-8')
A, B = '  /* ── 53.84 · Studio library 4 on the island', '  window.MinestDisplay = {'
if A in s: i = s.index(A); j = s.index(B, i); s = s[:i] + JS + s[j:]
else: assert s.count(B) == 1; s = s.replace(B, JS + B)
SRC.write_text(s, encoding='utf-8')
for c in COPIES: shutil.copyfile(SRC, ROOT / c)
print('patched Studio library 4')
