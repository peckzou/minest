#!/usr/bin/env python3
"""Minest · 2.0 routes: the app's entries open the 2.0 pages in place of 1.0.

    python3 tools/v2-routes/patch_v2_routes.py            # patch every main page
    python3 tools/v2-routes/patch_v2_routes.py --check    # only report
    python3 tools/v2-routes/patch_v2_routes.py --remove   # back to 1.0

1. Pages Minest already shows in a frame get their 2.0 address: Holo Lab → holo-lab-2/, 3D Type → type3d-2/,
   Clun → spatial-home/clun-2/.
2. tools/v2-routes/v2-routes.js is put in before </body> as <script id="mn-v2-routes"> (动态卡片, 动态呈现, EC–6 布告栏).
Each page is patched on its own (the main pages are not all byte-identical); running it again changes nothing.
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PAGES = ['index.html', 'iphone.html', 'iPhoneDuo.html', 'ipad.html', 'iPhoneDuo69.html', 'iPhoneDuo70.html',
         'iPhone53.8241.html', 'ios/Minest/Minest/iPhoneDuo.html', 'ios/Minest/Minest/index.html',
         'ios/Minest/Minest/ipad.html', 'ios/Minest/Minest/iphone.html', 'ios/Minest/Minest/iphone18.0.html',
         'ios/MinestProject/MyApp/iphone.html']
SWAPS = [
    ("'https://minest-app.vercel.app/holo-lab/index.html'", "'https://minest-app.vercel.app/holo-lab-2/index.html'"),
    ("'../holo-lab/index.html' : 'holo-lab/index.html'", "'../holo-lab-2/index.html' : 'holo-lab-2/index.html'"),
    ("new URL('type3d/index.html', location.href).href : SITE + 'type3d/index.html'",
     "new URL('type3d-2/index.html', location.href).href : SITE + 'type3d-2/index.html'"),
    ("'https://minest-app.vercel.app/spatial-home/clun/' + q : 'spatial-home/clun/index.html' + q",
     "'https://minest-app.vercel.app/spatial-home/clun-2/' + q : 'spatial-home/clun-2/index.html' + q"),
]
BLOCK = re.compile(r'\n?<script id="mn-v2-routes">.*?</script><!-- mn-v2-routes:end -->', re.S)


def patch(s, remove):
    for a, b in SWAPS:
        s = s.replace(b, a) if remove else s.replace(a, b)
    s = BLOCK.sub('', s)
    if not remove:
        js = (ROOT / 'tools/v2-routes/v2-routes.js').read_text(encoding='utf-8')
        i = s.rfind('</body>')
        if i < 0:
            raise SystemExit('no </body>')
        s = s[:i] + '<script id="mn-v2-routes">\n' + js + '</script><!-- mn-v2-routes:end -->\n' + s[i:]
    return s


def main():
    check, remove = '--check' in sys.argv, '--remove' in sys.argv
    for p in PAGES:
        f = ROOT / p
        if not f.exists():
            print('missing  ', p); continue
        s = f.read_text(encoding='utf-8')
        state = [s.count(b) for a, b in SWAPS] + [1 if BLOCK.search(s) else 0]
        if check:
            print('%-42s 2.0 addresses %s · routes %s' % (p, state[:4], 'in' if state[4] else 'not in')); continue
        out = patch(s, remove)
        if out != s:
            f.write_text(out, encoding='utf-8')
        print('%-42s %s' % (p, 'unchanged' if out == s else ('1.0' if remove else '2.0')))


if __name__ == '__main__':
    main()
