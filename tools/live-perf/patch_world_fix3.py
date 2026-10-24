"""My World fixes from the phone (2026-10-23): applied in place to iPhone53.8241.html, then copied to the other copies.
- Long-press menu on empty ground: Build / Decorate opened the old bottom drawer, which the HUD hides — they open the
  🔨 Build picker now; Display opens the 🎒 Box; a new ⛰ More land puts the island into its land mode.
- ⛰ in the HUD (next to 🔀): land mode on / off (＋ on every edge adds a plot, − takes an empty one away).
- The long-press menu has a solid background (it was see-through on the island).
- Home: a double-tap on a main island goes onto its island (it opened the group view); the group view is a button in
  the main island's sheet (🗺 Its islands), next to 🏝 Go onto it.
"""
from pathlib import Path
import shutil

ROOT = Path('/Users/cece/Documents/minest')
SRC = ROOT / 'iPhone53.8241.html'
COPIES = ['iphone.html', 'index.html', 'ios/Minest/Minest/iphone.html', 'ios/MinestProject/MyApp/iphone.html', 'ios/Minest/Minest/iphone18.0.html']
s = SRC.read_text(encoding='utf-8')

def rep(a, b):
    global s
    if b in s: return
    assert s.count(a) == 1, (a[:80], s.count(a)); s = s.replace(a, b)

# ---- long-press menu → the HUD's own tools
rep("""if (a === 'build') { V.tab = 'bld'; drawer(); bar(); return; }""", """if (a === 'build') { pkOpen('bld'); return; }""")
rep("""if (a === 'decor') { V.tab = 'decor'; drawer(); bar(); return; }""", """if (a === 'decor') { pkOpen('decor'); return; }
      if (a === 'land') { V.expand = true; V.sel = null; render(); fit(); toast('Tap ＋ on an edge to add land, − to take an empty plot away · ⛰ again when done', { duration: 5000 }); return; }""")
rep("""if (a === 'display') { V.tab = 'furn'; drawer(); bar(); return; }""", """if (a === 'display') { hudSheet('box'); return; }""")
rep("""data-bq="decor">🌳 <span><b>Decorate</b><small>trees, flowers, water, roads</small></span></button>' +""",
    """data-bq="decor">🌳 <span><b>Decorate</b><small>trees, flowers, water, roads</small></span></button>' +
      '<button type="button" role="menuitem" data-bq="land">⛰ <span><b>More land</b><small>make the island bigger — ＋ on every edge</small></span></button>' +""")
rep("""html body .mn-bq58 { position:fixed;z-index:2147483301;""", """html body .mn-bq58 { background-color:#2b2b2b !important;position:fixed;z-index:2147483301;""")

# ---- ⛰ in the HUD: land mode on / off (the same data-expand the Decorate panel uses)
rep("""<button type="button" class="mn-hud-b" data-reorg aria-label="Reorganize — another layout for this level">🔀</button>""",
    """<button type="button" class="mn-hud-b" data-reorg aria-label="Reorganize — another layout for this level">🔀</button><button type="button" class="mn-hud-b" data-expand aria-label="More land — make the island bigger">⛰</button>""")
# (the ⛰ render wrapper lives in tools/live-perf/world_land.js, assembled by world_blocks.py)
# ---- home: double-tap a main island = go onto it; its group view from the sheet
rep("""lastHub = null; return openGroup(id); }""", """lastHub = null; return goMain(id); }""")
rep("""(isC ? 'Your main island' : 'Main island') + '</h2><button type="button" class="mn-nw-b" data-hx aria-label="Close">×</button></div><div class="mn-nw-body">' +""",
    """(isC ? 'Your main island' : 'Main island') + '</h2><button type="button" class="mn-nw-b" data-hx aria-label="Close">×</button></div><div class="mn-nw-body">' +
      '<div class="mn-hub-go"><button type="button" class="mn-nw-go" data-hland>🏝 Go onto it</button>' + (isC ? '' : '<button type="button" class="mn-nw-go alt" data-hgroup>🗺 Its islands</button>') + '</div>' +""")
rep("""    if (e.target.closest('[data-hx]')) return close();""",
    """    if (e.target.closest('[data-hx]')) return close();
    if (e.target.closest('[data-hland]')) { var hid = S.id; close(); return goMain(hid); }
    if (e.target.closest('[data-hgroup]')) { var gid = S.id; close(); return openGroup(gid); }""")
CSS = '<style id="mn-fix3-style">html body .mn-hub-go { display:flex;gap:8px;margin:0 0 12px; } html body .mn-hub-go button { flex:1; } html body .mn-hud [data-expand].on { outline:3px solid #7fd35f; }</style>\n'
if 'id="mn-fix3-style"' not in s: s = s.replace('</head>', CSS + '</head>', 1)

SRC.write_text(s, encoding='utf-8')
for c in COPIES: shutil.copyfile(SRC, ROOT / c)
print('patched My World fixes 3')
