"""My World in English (tools/world-en/en.js + the zh→en dictionary mw_en.json) as <script id="mn-world-en">, before </body>.
Safe to re-run: the block is replaced, never doubled."""
import json, re
from pathlib import Path
HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
FILES = ['iPhoneDuo.html', 'iPhoneDuo69.html', 'iphone.html', 'iPhone53.8241.html', 'index.html', 'ipad.html',
         'ios/Minest/Minest/iPhoneDuo.html', 'ios/Minest/Minest/index.html', 'ios/Minest/Minest/ipad.html',
         'ios/Minest/Minest/iphone.html', 'ios/Minest/Minest/iphone18.0.html', 'ios/MinestProject/MyApp/iphone.html']
D = json.loads((HERE / 'mw_en.json').read_text(encoding='utf-8'))
JS = (HERE / 'en.js').read_text(encoding='utf-8').replace('__MW_EN_DICT__', json.dumps(D, ensure_ascii=False, sort_keys=True)).rstrip('\n')
assert '</script' not in JS.lower()
for f in FILES:
    p = ROOT / f
    if not p.exists(): continue
    s = p.read_text(encoding='utf-8'); o = s
    if 'MinestDisplay' not in s: continue
    s = re.sub(r'<script id="mn-world-en">.*?</script>\n', '', s, flags=re.S)
    i = s.rfind('</body>')
    if i >= 0: s = s[:i] + '<script id="mn-world-en">\n' + JS + '\n</script>\n' + s[i:]
    if s != o: p.write_text(s, encoding='utf-8'); print('patched', f)
