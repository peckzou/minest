"""Knowledge Drive V1.0 + Knowledge Train + Knowledge Metro + Knowledge Skyscraper (the Dynamic presentations) into the live page and every copy: drive.css (+ the Presentation Gallery) and drive.js + entry.js
(the 🚗 button in My World's header). Each entry is patched in place, so copies that differ from the source keep their
own changes. Re-running replaces the two blocks with the current files."""
from pathlib import Path

HERE = Path(__file__).resolve().parent; ROOT = HERE.parents[1]
ENTRIES = ['iPhone53.8241.html', 'iphone.html', 'index.html', 'ipad.html', 'iPhoneDuo.html',
           'ios/Minest/Minest/iphone.html', 'ios/Minest/Minest/iphone18.0.html', 'ios/Minest/Minest/ipad.html', 'ios/MinestProject/MyApp/iphone.html']

def block(s, tag, body):
    a, b = '<' + tag + ' id="mn-kdrive-' + tag + '">', '</' + tag + '>'
    new = a + '\n' + body + '\n' + b + '\n'
    if a in s:
        i = s.index(a); j = s.index(b, i) + len(b) + 1
        return s[:i] + new + s[j:]
    k = s.rindex('</body>')
    return s[:k] + new + s[k:]

RAIL = HERE.parent / 'knowledge-rail'   # Knowledge Train + Knowledge Metro ride along (rail-common.js is generated from drive.js)
import subprocess, sys; subprocess.run([sys.executable, str(RAIL / 'build_common.py')], check=True)
css = (HERE / 'drive.css').read_text(encoding='utf-8') + '\n' + (RAIL / 'rail.css').read_text(encoding='utf-8') + '\n' + (RAIL / 'phase3.css').read_text(encoding='utf-8') + '\n' + (HERE / 'duo-dyn.css').read_text(encoding='utf-8')
js = '\n'.join((d / f).read_text(encoding='utf-8') for d, f in [(HERE, 'drive.js'), (HERE, 'cars.js'), (RAIL, 'rail-common.js'), (RAIL, 'train.js'), (RAIL, 'metro.js'), (RAIL, 'tower.js'), (RAIL, 'showcase-common.js'), (RAIL, 'rack.js'), (RAIL, 'library.js'), (RAIL, 'museum.js'), (RAIL, 'city.js'), (RAIL, 'galaxy.js'), (HERE, 'entry.js'), (HERE, 'duo-dyn.js')])
assert '</script' not in js and '</style' not in css
for e in ENTRIES:
    p = ROOT / e
    if not p.exists(): print('missing', e); continue
    p.write_text(block(block(p.read_text(encoding='utf-8'), 'style', css), 'script', js), encoding='utf-8')
print('patched Knowledge Drive into', len(ENTRIES), 'entries')
