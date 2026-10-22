"""Board mode · lighter glass: no blur inside a list that is already blurred.
Applied in place to iPhone53.8241.html, then copied to iphone.html, index.html and the two iOS copies.

A board shows ~50 elements with backdrop-filter at once. Each card (blur 8px), deck layer (16–20px) and sub-card (22px)
sits inside a list column that is itself blurred (28px). What is behind a card is already the column's blurred glass, so
blurring it again changes almost nothing on screen, yet every one of those layers is composited and filtered on its own.
That is what makes scrolling and the first render heavy on iPad / iPhone GPUs.
Cards, sub-cards, deck layers and their small buttons inside a column now skip their own blur. Their tinted backgrounds
stay as they are, so the look is the same. Columns, the top bar and the dock keep their glass. The 3D Cover is untouched
(its faces are not inside a .kanban-column-wrapper).
"""
from pathlib import Path
import shutil, sys

ROOT = Path('/Users/cece/Documents/minest')
SRC = ROOT / 'iPhone53.8241.html'
COPIES = ['iphone.html', 'index.html', 'ios/Minest/Minest/iphone.html', 'ios/MinestProject/MyApp/iphone.html']
s = SRC.read_text(encoding='utf-8')
if 'mn-board-glass-lite' in s:
    sys.exit('already patched')
css = """<style id="mn-board-glass-lite">
/* board: every list is a snap point at every width (the ≤640px "center" rule and the landscape "start" rule still win
   where they apply). Without this, wide screens had only two snap points — the contents column and the "Add another list"
   button — so the board opened at the far right and swiping left snapped back or jumped to the start. */
.board-swimlane-scroll > .kanban-column-wrapper { scroll-snap-align: start; scroll-snap-stop: normal; }
/* board: one layer of glass (the column), not one per card inside it */
html body .kanban-column-wrapper.kanban-column-wrapper .kanban-card.kanban-card:not(.mn-never),
html body .kanban-column-wrapper.kanban-column-wrapper .kanban-subcard.kanban-subcard:not(.mn-never),
html body .kanban-column-wrapper.kanban-column-wrapper .liquid-glass-card.liquid-glass-card:not(.mn-never),
html body .kanban-column-wrapper.kanban-column-wrapper .liquid-glass-deck-step1.liquid-glass-deck-step1:not(.mn-never),
html body .kanban-column-wrapper.kanban-column-wrapper .liquid-glass-deck-step2.liquid-glass-deck-step2:not(.mn-never),
html body .kanban-column-wrapper.kanban-column-wrapper .card-edit-btn.card-edit-btn:not(.mn-never),
html body .kanban-column-wrapper.kanban-column-wrapper .mn-tc.mn-tc:not(.mn-never),
html body .mn-tocol.mn-tocol .kanban-card.kanban-card:not(.mn-never),
html body .mn-tocol.mn-tocol .kanban-subcard.kanban-subcard:not(.mn-never),
html body .mn-tocol.mn-tocol .liquid-glass-card.liquid-glass-card:not(.mn-never),
html body .mn-tocol.mn-tocol .liquid-glass-deck-step1.liquid-glass-deck-step1:not(.mn-never),
html body .mn-tocol.mn-tocol .liquid-glass-deck-step2.liquid-glass-deck-step2:not(.mn-never),
html body .mn-tocol.mn-tocol .card-edit-btn.card-edit-btn:not(.mn-never),
html body .mn-tocol.mn-tocol .mn-tc.mn-tc:not(.mn-never) {   /* (0,5,2): above the .fbg-on card glass rule (0,3,1) */ -webkit-backdrop-filter: none !important; backdrop-filter: none !important; }
</style>
"""
assert s.count('</head>') == 1
s = s.replace('</head>', css + '</head>')
# it must win over earlier !important rules of equal weight: put it last in <head>, and keep the selector heavy
SRC.write_text(s, encoding='utf-8')
for c in COPIES:
    shutil.copyfile(SRC, ROOT / c)
print('patched board glass')
