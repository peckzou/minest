"""Solo map (Minest Live · Solo play) games · the same focus + Blooket look as the teaching template games.
Applied in place to iPhone53.8241.html, then copied to iphone.html, index.html and the iOS copies.

While a Solo level plays (#mn-templates.tt-quest824[data-ten-view="game"]):
- Out of the way: the old "⇄ Drag Matching" line + its progress bar (the Run counter already shows it), the big
  question capsule (it repeated the first picture / word of the activity), the sun and clouds; the header keeps only ✕
  (教师端 and the second 英文 toggle go — the game bar has one).
- The game bar is one slim row; the stage is the purple meadow; the activity area is transparent on it.
- The Blooket rules of the teaching games (white chunky question card, four-colour answer blocks, white word cards,
  green / red banners, compact controls, readable notes) are copied from <style id="teaching-blooket-play"> with the
  Solo prefix, so both stay the same look.
"""
from pathlib import Path
import re, shutil, sys

ROOT = Path('/Users/cece/Documents/minest')
SRC = ROOT / 'iPhone53.8241.html'
COPIES = ['iphone.html', 'index.html', 'ios/Minest/Minest/iphone.html', 'ios/MinestProject/MyApp/iphone.html', 'ios/Minest/Minest/iphone18.0.html', 'ipad.html', 'ios/Minest/Minest/ipad.html']
s = SRC.read_text(encoding='utf-8')
if 'id="teaching-solo-blooket"' in s:
    sys.exit('already patched')

P = '#mn-templates.tt-sx.sx-play:not(.tt-quest824)'
Q = '#mn-templates.tt-quest824[data-ten-view="game"]'
a = s.index('<style id="teaching-blooket-play">'); b = s.index('</style>', a)
src = s[a + len('<style id="teaching-blooket-play">'):b]
# keep the look, not the classic-only layout: drop the focus/HUD/main-background rules, then re-prefix
keep = []
for rule in re.findall(r'[^{}]+\{[^{}]*\}|@keyframes[^{]+\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}|@media[^{]+\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}', src):
    head = rule.split('{', 1)[0]
    if '.sx-hud' in head or '.sx-mode' in head or '.sx-round' in head or '.sx-stats' in head or '.sx-pill' in head or '.sx-bar' in head: continue
    if ':not(.sx-chrome)' in head or '> main' in head or 'sx-chrome' in head: continue
    if head.strip().startswith('@keyframes'): continue          # already defined once
    keep.append(rule.strip())
css = '\n'.join(keep).replace(P, Q).replace('.tt-wrap > .tt-panel', '.toon-playfield .tt-panel').replace('.tt-wrap > .tt-progress', '.tt-wrap > .tt-progress')
assert Q in css and len(keep) > 20

FIX = '''/* white cards always carry dark text (the stage text around them is white) */
#mn-templates .il-target.il-target, #mn-templates .il-source.il-source, #mn-templates .il-slot, #mn-templates .tt-card, #mn-templates .tt-big, #mn-templates .pl-spy-clue, #mn-templates .ttt-cell, #mn-templates .t809-match > button { color: #2e1065; }
#mn-templates .il-target.il-target > small, #mn-templates .il-target.il-target small, #mn-templates .il-slot small { color: #6d28d9 !important; opacity: 1 !important; font-weight: 800; }
#mn-templates[data-activity="sorting"] .il-zones > .il-target.il-target.il-target, #mn-templates[data-activity="sorting"] .il-zones > .il-target.il-target.il-target small { color: #fff !important; }
'''
EXTRA = Q.join(["""<style id="teaching-solo-blooket">
/* ---- Solo games: focus layout ---- */
""", """ .tt-wrap > .tt-progress, """, """ .tt-wrap > progress, """, """ .toon-question-capsule, """, """ .toon-sun, """, """ .toon-cloud,
""", """ .solo-btn-teaching, """, """ header .solo-en-toggle { display: none !important; }
""", """ > header { min-height: 0; padding-top: 6px; padding-bottom: 6px; }
""", """ .toon-game-top { padding: 8px 10px !important; min-height: 0 !important; gap: 8px; flex-wrap: nowrap; border-radius: 18px !important; margin-bottom: 10px !important; }
""", """ .toon-game-top .toon-status-capsule { padding: 4px 8px !important; gap: 6px; flex-wrap: nowrap; }
""", """ .toon-game-top .toon-status-capsule .solo-en-toggle { padding: 4px 8px !important; font-size: 12px !important; }
""", """ .toon-stage-meadow { padding: 10px !important; min-height: 0 !important; }
""", """ .toon-playfield { background: transparent !important; border: 0 !important; box-shadow: none !important; padding: 0 !important; margin: 0 !important; }
""", """ .toon-playfield .tt-panel { color: #fff; }
""", """ .toon-playfield .tt-panel > .tt-row:first-child, """, """ .toon-playfield .tt-panel > p.tt-muted:nth-of-type(1) { display: none !important; }
""", """ .toon-corner-octopus { transform: scale(.7); transform-origin: top right; }
@media (max-width: 560px) { """, """ .toon-top-left { font-size: 0 !important; } """, """ .toon-top-left .toon-mode-icon { font-size: 22px !important; } """, """ .toon-corner-octopus { display: none; } }
/* ---- Solo games: the Blooket look of the teaching games ---- */
"""]) + css + "\n" + FIX + "</style>\n"
assert s.count('</head>') == 1
s = s.replace('</head>', EXTRA + '</head>')
SRC.write_text(s, encoding='utf-8')
for c in COPIES:
    shutil.copyfile(SRC, ROOT / c)
print('patched Solo Blooket look:', len(keep), 'rules copied')
