"""My World · Reorganize (step 2 of the 53.811 brief): 🔀 in the HUD, a preview of another layout for the level you are on,
✓ keeps it (one undo step), ✕ puts it back. tools/live-perf/world_reorg.js goes into the display script (it uses the
island's own helpers). Applied in place to iPhone53.8241.html, then copied to iphone.html, index.html and the iOS copies.
Re-running replaces the block with the current world_reorg.js.
"""
from pathlib import Path
import shutil

ROOT = Path('/Users/cece/Documents/minest'); HERE = ROOT / 'tools/live-perf'
SRC = ROOT / 'iPhone53.8241.html'
COPIES = ['iphone.html', 'index.html', 'ios/Minest/Minest/iphone.html', 'ios/MinestProject/MyApp/iphone.html', 'ios/Minest/Minest/iphone18.0.html', 'ipad.html', 'ios/Minest/Minest/ipad.html']
s = SRC.read_text(encoding='utf-8')
import sys as _sys; _sys.path.insert(0, str(HERE)); from world_blocks import assemble
s = assemble(s)   # all the My World blocks again, in order (tools/live-perf/world_blocks.py)

BTN = '<button type="button" class="mn-hud-b go" data-auto aria-label="Arrange for me">✦</button>'
if 'data-reorg aria-label' not in s and s.count(BTN) == 1:
    s = s.replace(BTN, BTN + '<button type="button" class="mn-hud-b" data-reorg aria-label="Reorganize — another layout for this level">🔀</button>')

CSS = """<style id="mn-reorg-style">
html body .mn-ro { position:fixed;left:50%;bottom:max(14px,env(safe-area-inset-bottom));transform:translateX(-50%);z-index:2147483300;width:min(560px,calc(100vw - 20px));padding:10px;color:#fff;font:600 13px/1.25 var(--pc-font,ui-rounded,system-ui);background:var(--pcs-f,#2b2b2b) var(--pc-facet);border:3px solid;border-color:var(--pcs-hi,#6b6b6b) var(--pcs-dk,#1c1c1c) var(--pcs-sh,#111) var(--pcs-lt,#555);box-shadow:0 0 0 2px #000,0 6px 0 2px #000;border-radius:2px;user-select:none;-webkit-user-select:none;background-color:#2b2b2b; }
html body .mn-ro .h { display:flex;align-items:baseline;gap:10px;margin:0 2px 8px; } html body .mn-ro .h b { font-size:15px; } html body .mn-ro .h span { opacity:.7;font-size:12px; }
html body .mn-ro .tabs { display:flex;gap:4px;margin:0 0 8px; } html body .mn-ro .tabs button { flex:1;padding:6px 8px;color:#fff;font:700 12px/1 inherit;cursor:pointer;background:#ffffff10;border:2px solid #ffffff1f;border-radius:2px; } html body .mn-ro .tabs button.on { background:#ffffff2e;border-color:#ffffff66; } html body .mn-ro .tabs button:disabled { opacity:.4; }
html body .mn-ro .w { display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px; }
html body .mn-ro .w button { display:flex;flex-direction:column;align-items:flex-start;gap:2px;padding:8px 10px;text-align:left;color:inherit;font:inherit;cursor:pointer;background:#ffffff10;border:2px solid #ffffff1f;border-radius:2px; }
html body .mn-ro .w button b { font-size:13px; } html body .mn-ro .w button small { font-size:11px;opacity:.7;font-weight:500; }
html body .mn-ro .w button.on { background:#3c8527;border-color:#7fd35f #5aa83d #24521a #2f6b21; }
html body .mn-ro .t { margin:8px 2px;font-size:11.5px;opacity:.8;font-weight:500; }
html body .mn-ro .f { display:flex;gap:6px;justify-content:flex-end; }
html body .mn-ro .f button { padding:8px 14px;font:800 13px/1 inherit;color:#fff;cursor:pointer;border:2px solid;border-radius:2px;background:#4a4a4a;border-color:#8a8a8a #333 #222 #333; }
html body .mn-ro .f .ok { background:#2f7d1d;border-color:#8ee06b #2a6d18 #1c4a10 #2a6d18; } html body .mn-ro .f .no { background:#8a2b22;border-color:#e07a6b #6d1f18 #4a1410 #6d1f18; }
html body .mn-ro .f button:disabled { opacity:.45;cursor:default; }
</style>
"""
if 'id="mn-reorg-style"' in s:   # re-run: the current CSS replaces the old block
    i = s.index('<style id="mn-reorg-style">'); j = s.index('</style>', i) + len('</style>\n'); s = s[:i] + CSS + s[j:]
else:
    assert s.count('</head>') == 1; s = s.replace('</head>', CSS + '</head>')

# the build-in-place ✓ / ✕ chip and the long-press menu (53.81) sat under My World's own layer (z 2147483200): lift them
for a, b in [('html body .mn-bq { position:fixed;z-index:70;', 'html body .mn-bq { position:fixed;z-index:2147483300;'), ('html body .mn-bq58 { position:fixed;z-index:71;', 'html body .mn-bq58 { position:fixed;z-index:2147483301;')]:
    if a in s: s = s.replace(a, b)
s = s.replace('transform:translateX(-50%);z-index:72;', 'transform:translateX(-50%);z-index:2147483300;')
SRC.write_text(s, encoding='utf-8')
for c in COPIES:
    shutil.copyfile(SRC, ROOT / c)
print('patched My World reorganize')
