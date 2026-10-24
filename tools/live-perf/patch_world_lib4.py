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
import sys as _sys; _sys.path.insert(0, str(HERE)); from world_blocks import assemble
s = assemble(s)   # all the My World blocks again, in order (tools/live-perf/world_blocks.py)
# main islands (MinestHubs): the main-island styles reach library 4's worlds too (MW-41…70 and the Avatar islands MW-71…90)
a = "for (var w43 = 11; w43 <= 40; w43++) EXPW.push('MW-' + w43);"
if a in s: s = s.replace(a, "for (var w43 = 11; w43 <= 90; w43++) EXPW.push('MW-' + w43);   // libraries 3 + 4: MW-11…90 (Avatar islands MW-71…90)")
SRC.write_text(s, encoding='utf-8')
for c in COPIES: shutil.copyfile(SRC, ROOT / c)
print('patched Studio library 4')
