"""My World · ✨ Smart build (one tap → a whole island to look at; 🔄 Change / ✓ Keep / ✕ Cancel) and land mode that ends
with a tap on empty space. tools/live-perf/world_smart.js goes into the display script (it uses the island's own
helpers and the 53.83 Reorganize ways). Applied in place to iPhone53.8241.html, then copied to the other copies.
Re-running replaces the block with the current world_smart.js.
"""
from pathlib import Path
import shutil

ROOT = Path('/Users/cece/Documents/minest'); HERE = ROOT / 'tools/live-perf'
SRC = ROOT / 'iPhone53.8241.html'
COPIES = ['iphone.html', 'index.html', 'ios/Minest/Minest/iphone.html', 'ios/MinestProject/MyApp/iphone.html', 'ios/Minest/Minest/iphone18.0.html']
s = SRC.read_text(encoding='utf-8')
import sys as _sys; _sys.path.insert(0, str(HERE)); from world_blocks import assemble
s = assemble(s)   # all the My World blocks again, in order (tools/live-perf/world_blocks.py)
CSS = """<style id="mn-smart-style">
html body .mn-sbgo { position:fixed;left:50%;bottom:max(18px,env(safe-area-inset-bottom));transform:translateX(-50%);z-index:2147483250;display:flex;align-items:center;gap:8px;padding:12px 22px;color:#fff;font:800 16px/1 var(--pc-font,ui-rounded,system-ui);cursor:pointer;background:#3c8527;border:3px solid;border-color:#7fd35f #5aa83d #24521a #2f6b21;box-shadow:0 0 0 2px #000,0 5px 0 2px #000;border-radius:2px;text-shadow:1px 1px 0 #0008; }
html body .mn-sbgo:active { transform:translateX(-50%) translateY(2px); }
html body .mn-sb .t b { font-size:13px; }
html body .mn-fp-doll { max-width:none !important; }
html body .mn-fp-doll svg { aspect-ratio:auto !important; width:100% !important; height:min(66vh, 1000px) !important; max-height:none !important; }
html body .mn-sb .w.sbw { grid-template-columns:repeat(3,minmax(0,1fr));margin-bottom:8px; }
</style>
"""
if 'id="mn-smart-style"' in s: i = s.index('<style id="mn-smart-style">'); j = s.index('</style>', i) + len('</style>\n'); s = s[:i] + CSS + s[j:]
else: s = s.replace('</head>', CSS + '</head>', 1)
# the ✨ button and its bar are not part of the island: taps on them must not reach the island's own pointer / click handling
X = [("e.target.closest('.mn-dsp-sel, .mn-dsp-cam, .mn-dsp-top, .mn-dsp-start, .mn-dsp-share, .mn-sa, .mn-bv, .mn-guide, .mn-bmenu, .mn-bulb, .mn-pick, .mn-walk, .mn-ex-bar, .mn-snap')",
      "e.target.closest('.mn-dsp-sel, .mn-dsp-cam, .mn-dsp-top, .mn-dsp-start, .mn-dsp-share, .mn-sa, .mn-bv, .mn-guide, .mn-bmenu, .mn-bulb, .mn-pick, .mn-walk, .mn-ex-bar, .mn-snap, .mn-sbgo')"),
     ("e.target.closest('.mn-sa, .mn-bv, .mn-guide, .mn-bmenu, .mn-bulb, .mn-pick, .mn-walk, .mn-ex-bar, .mn-snap')",
      "e.target.closest('.mn-sa, .mn-bv, .mn-guide, .mn-bmenu, .mn-bulb, .mn-pick, .mn-walk, .mn-ex-bar, .mn-snap, .mn-sbgo')")]
for a, b in X:
    if b not in s: assert s.count(a) == 1, a[:60]; s = s.replace(a, b)
SRC.write_text(s, encoding='utf-8')
for c in COPIES: shutil.copyfile(SRC, ROOT / c)
print('patched Smart build')
