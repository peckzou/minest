"""Stand Mode V1.0 (Octo Clock + My Collection Showcase) and the Duo Aquarium: stand.css/aquarium.css + stand.js/aquarium.js go into the live page and its copies.
Re-running replaces the blocks with the current files. Run after patch_duo.py (which rewrites the copies too)."""
from pathlib import Path
import shutil

HERE = Path(__file__).resolve().parent; ROOT = HERE.parents[1]
SRC = ROOT / 'iPhone53.8241.html'
COPIES = ['iphone.html', 'index.html', 'ios/Minest/Minest/iphone.html', 'ios/MinestProject/MyApp/iphone.html', 'ios/Minest/Minest/iphone18.0.html', 'ipad.html', 'ios/Minest/Minest/ipad.html', 'iPhoneDuo.html']
s = SRC.read_text(encoding='utf-8')

def block(s, tag, body):
    a, b = '<' + tag + ' id="mn-stand-' + tag + '">', '</' + tag + '>'
    new = a + '\n' + body + '\n' + b + '\n'
    if a in s:
        i = s.index(a); j = s.index(b, i) + len(b) + 1
        return s[:i] + new + s[j:]
    k = s.rindex('</body>')
    return s[:k] + new + s[k:]

# Duo Aquarium (aquarium.js / aquarium.css) rides along in the same two blocks
css = (HERE / 'stand.css').read_text(encoding='utf-8') + '\n' + (HERE / 'aquarium.css').read_text(encoding='utf-8')
js = (HERE / 'stand.js').read_text(encoding='utf-8') + '\n' + (HERE / 'aquarium.js').read_text(encoding='utf-8')
s = block(block(s, 'style', css), 'script', js)
SRC.write_text(s, encoding='utf-8')
for c in COPIES[:-1]: shutil.copyfile(SRC, ROOT / c)
d = (ROOT / 'iPhoneDuo.html').read_text(encoding='utf-8')
(ROOT / 'iPhoneDuo.html').write_text(block(block(d, 'style', css), 'script', js), encoding='utf-8')
print('patched Stand Mode')
