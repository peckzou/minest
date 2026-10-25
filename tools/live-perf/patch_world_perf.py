"""My World smoothness (iPhone 53.8241): the page had slowed from 60 fps (53.8) to ~25–45 fps while panning an island.
Applied in place to iPhone53.8241.html, then copied to iphone.html, index.html and the iOS copies.

Cause (measured in the preview, touch drag on an island): not script time (~200 ms per 3 s) but style recalculation.
Rules whose subject is the whole page — `html:has(.theme-white) …`, `body:has([data-cloud-login]) …`,
`header.iphone-topbar:has(.mn-ws-panel)`, `.uv:has(.uv-sheet)` — make the browser re-check the page on every DOM change,
and the island redraws the DOM many times a second. With them gone the same drag runs at 60 fps.

- Every such rule now reads a class on <html> (mnh-*). A tiny watcher sets the classes when the matching element
  appears or goes away (one rAF per burst of changes, writes only when a class actually flips). Same looks, same rules.
- The pictures bar ("11 things have no picture") rewrote its three labels on every scan, even when unchanged; each
  rewrite woke all the page's observers again (~30–60 loops a second, forever). It now writes only changed text.
- The board cards' liquid-glass pointer light (mouse only) keeps sleeping while My World covers the board.
"""
from pathlib import Path
import shutil, sys

ROOT = Path('/Users/cece/Documents/minest')
SRC = ROOT / 'iPhone53.8241.html'
COPIES = ['iphone.html', 'index.html', 'ios/Minest/Minest/iphone.html', 'ios/MinestProject/MyApp/iphone.html', 'ios/Minest/Minest/iphone18.0.html', 'ipad.html', 'ios/Minest/Minest/ipad.html']
s = SRC.read_text(encoding='utf-8')
if 'id="mn-has-flags"' in s:
    sys.exit('already patched')

def rep(a, b, n=None):
    global s
    c = s.count(a); assert c and (n is None or c == n), (a, c, n); s = s.replace(a, b)

# ---- page-wide :has → html flag classes (longest patterns first) --------------------------------------------------------
FLAGS = [  # class, selector whose presence sets it
    ('mnh-uvs', '.uv .uv-sheet'), ('mnh-wsp', 'header.iphone-topbar .mn-ws-panel'), ('mnh-wsl', 'header.iphone-topbar .mn-ws-light'),
    ('mnh-hui', '.hu-island-header'), ('mnh-mpr', '.mpron-practice'), ('mnh-aim', '.minest-ai-modal-backdrop'), ('mnh-awo', '.apple-wallet-overlay'),
    ('mnh-tw', '.theme-white'), ('mnh-keb', '.ke-bar'), ('mnh-cl', '[data-cloud-login]'),
]
rep('html .uv:has(.uv-sheet)', 'html.mnh-uvs .uv', 1)
rep('html body .theme-white header.iphone-topbar:has(.mn-ws-panel)', 'html.mnh-wsp body .theme-white header.iphone-topbar', 1)
rep('html body header.iphone-topbar:has(.mn-ws-panel)', 'html.mnh-wsp body header.iphone-topbar', 1)
rep('html body header.iphone-topbar:has(.mn-ws-light)', 'html.mnh-wsl body header.iphone-topbar', 1)
rep('html:has(.hu-island-header)', 'html.mnh-hui')
rep('html:has(.mpron-practice)', 'html.mnh-mpr')
rep('body:has(.mpron-practice)', 'html.mnh-mpr body', 1)
rep('html:has(.minest-ai-modal-backdrop)', 'html.mnh-aim')
rep('html:has(.apple-wallet-overlay)', 'html.mnh-awo')
rep('html:not(.mn-bd-tab):has(.theme-white)', 'html.mnh-tw:not(.mn-bd-tab)', 1)
rep('html.mn-bd-tab:has(.theme-white)', 'html.mn-bd-tab.mnh-tw', 1)
rep('html:has(.theme-white)', 'html.mnh-tw')
rep('body:has(.ke-bar)', 'html.mnh-keb body', 1)
rep('html body:has([data-cloud-login])', 'html.mnh-cl body', 1)

WATCH = """<script id="mn-has-flags">
/* page-wide :has rules read these <html> classes instead (a :has on html/body re-checks the page on every DOM change) */
(function(){
  var F = %s, root = document.documentElement, q = false;
  function sync(){ q = false; for (var i = 0; i < F.length; i++) { var on = !!document.querySelector(F[i][1]); if (root.classList.contains(F[i][0]) !== on) root.classList.toggle(F[i][0], on); } }
  function later(){ if (!q) { q = true; requestAnimationFrame(sync); } }
  new MutationObserver(later).observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'data-cloud-login'] });
  sync();
})();
</script>
""" % repr([list(f) for f in FLAGS]).replace("'", '"')
assert s.count('<body') >= 1
i = s.index('>', s.index('<body')) + 1
s = s[:i] + '\n' + WATCH + s[i:]

# ---- the pictures bar: write labels only when they change -------------------------------------------------------------
rep("""      bar.querySelector('b').textContent = (missing === 1 ? '1 thing has no picture' : missing + ' things have no picture') + where;
      if (!running[rk]) bar.querySelector('small').textContent = kind() === 'icon'""",
    """      var setT = function (e, t) { if (e && e.textContent !== t) e.textContent = t; };
      setT(bar.querySelector('b'), (missing === 1 ? '1 thing has no picture' : missing + ' things have no picture') + where);
      if (!running[rk]) setT(bar.querySelector('small'), kind() === 'icon'""", 1)
rep(""" : 'One tap draws them all in this style — only names are sent · Undo any time';
      bar.querySelector('button').textContent = n.t === 'list' ? 'Add pictures' : 'Add all pictures';""",
    """ : 'One tap draws them all in this style — only names are sent · Undo any time');
      setT(bar.querySelector('button'), n.t === 'list' ? 'Add pictures' : 'Add all pictures');""", 1)

# ---- liquid-glass card light sleeps under My World ----------------------------------------------------------------------
rep("""  function onMove(e) {
    if (!on || e.pointerType === 'touch') return;
    var now = performance.now(), dt""", """  function onMove(e) {
    if (!on || e.pointerType === 'touch' || document.querySelector('.uv')) return;
    var now = performance.now(), dt""", 1)

SRC.write_text(s, encoding='utf-8')
for c in COPIES:
    shutil.copyfile(SRC, ROOT / c)
print('patched My World smoothness')
