"""53.84 Duo · iPhone Fold: duo.css + duo.js go into the live page (all copies; they switch on only on a folding iPhone,
see duo.js enabled()), and iPhoneDuo.html is the same page with Duo always on (window.__MINEST_DUO__) for the web.
Re-running replaces the blocks with the current duo.css / duo.js.
"""
from pathlib import Path
import shutil

HERE = Path(__file__).resolve().parent; ROOT = HERE.parents[1]   # the checkout this script is in (main or a worktree)
SRC = ROOT / 'iPhone53.8241.html'
COPIES = ['iphone.html', 'index.html', 'ios/Minest/Minest/iphone.html', 'ios/MinestProject/MyApp/iphone.html', 'ios/Minest/Minest/iphone18.0.html', 'ipad.html', 'ios/Minest/Minest/ipad.html']
s = SRC.read_text(encoding='utf-8')
import sys; sys.path.insert(0, str(HERE)); from world_blocks import assemble
s = assemble(s)   # world_duo.js lives inside the display script with the other My World blocks

def block(s, tag, body):
    a, b = '<' + tag + ' id="mn-duo-' + tag + '">', '</' + tag + '>'
    new = a + '\n' + body + '\n' + b + '\n'
    if a in s:
        i = s.index(a); j = s.index(b, i) + len(b) + 1
        return s[:i] + new + s[j:]
    k = s.rindex('</body>')
    return s[:k] + new + s[k:]

s = block(s, 'style', (HERE / 'duo.css').read_text(encoding='utf-8'))
s = block(s, 'script', (HERE / 'duo.js').read_text(encoding='utf-8'))
SRC.write_text(s, encoding='utf-8')
for c in COPIES: shutil.copyfile(SRC, ROOT / c)

t0 = s[s.index('<title>'):s.index('</title>') + 8]
d = s.replace(t0, '<title>Minest Duo 53.85 · iPhone Fold</title>', 1)
d = d.replace('<head>', '<head>\n<script>window.__MINEST_DUO__ = true;</script>', 1)
(ROOT / 'iPhoneDuo.html').write_text(d, encoding='utf-8')
print('patched Duo')
