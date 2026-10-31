"""53.86–53.88 Fold flow (+ world_vocab.js / world_vocab.css, the 3D vocabulary displays): My World's six-level console for the iPhone Fold held upright and half folded (world_fold.js, world_fold.css).
Re-runnable. For every entry page it writes the My World blocks again from their files (world_blocks.assemble — which now
includes world_fold.js and the small world_duo.js hooks) and puts world_fold.css in <style id="mn-world-fold-css">.
The entries are patched in place (not copied from iPhone53.8241.html), so pages that carry their own work (the iPad copies,
ios/MinestProject) keep it. A later patch_duo.py run keeps both: it assembles the same blocks and copies the CSS block along.
"""
from pathlib import Path
import re, sys

HERE = Path(__file__).resolve().parent; ROOT = HERE.parents[1]
sys.path.insert(0, str(HERE)); from world_blocks import assemble
FILES = ['iPhone53.8241.html', 'iPhoneDuo.html', 'iphone.html', 'index.html', 'ipad.html', 'ios/Minest/Minest/iphone.html',
         'ios/Minest/Minest/iphone18.0.html', 'ios/Minest/Minest/ipad.html', 'ios/MinestProject/MyApp/iphone.html']
CSS = '<style id="mn-world-fold-css">\n' + '\n'.join((HERE / f).read_text(encoding='utf-8').strip() for f in ('world_fold.css', 'world_items.css', 'world_vocab.css') if (HERE / f).exists()) + '\n</style>'   # 53.88: + the vocabulary displays
assert '</style' not in CSS[:-8]
for name in FILES:
    p = ROOT / name
    if not p.exists(): print('missing:', name); continue
    t = p.read_text(encoding='utf-8'); was = t
    if '  window.MinestDisplay = {' not in t: print('skip (no My World):', name); continue
    t = assemble(t)
    if '<style id="mn-world-fold-css">' in t:
        t = re.sub(r'<style id="mn-world-fold-css">[\s\S]*?</style>', lambda _: CSS, t, count=1)
    else:
        k = t.rindex('</body>'); t = t[:k] + CSS + '\n' + t[k:]
    if t != was: p.write_text(t, encoding='utf-8'); print('patched:', name)
    else: print('unchanged:', name)
