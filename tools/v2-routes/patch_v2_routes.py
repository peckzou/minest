#!/usr/bin/env python3
"""Minest · 2.0 routes: the app's entries open the 2.0 pages in place of 1.0.

    python3 tools/v2-routes/patch_v2_routes.py            # patch every main page
    python3 tools/v2-routes/patch_v2_routes.py --check    # only report; exits 1 when a page lost a 2.0 route
                                                          # (another script rewrote it: run this again without flags)
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
    ("url: '../hologram/index.html', web: 'hologram/index.html', flat: 'https://minest-app.vercel.app/hologram/index.html', entry: 'hologram/index.html'",
     "url: '../hologram-2/index.html', web: 'hologram-2/index.html', flat: 'https://minest-app.vercel.app/hologram-2/index.html', entry: 'hologram-2/index.html'"),
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


def missing():
    """pages that should carry the 2.0 routes and do not (addresses of the frames they have, or the script)"""
    js = (ROOT / 'tools/v2-routes/v2-routes.js').read_text(encoding='utf-8')
    out = []
    for p in PAGES:
        f = ROOT / p
        if not f.exists():
            continue
        s = f.read_text(encoding='utf-8')
        old = [a for a, b in SWAPS if a in s]
        m = BLOCK.search(s)
        if old or not m:
            out.append('%s: %s' % (p, ', '.join((['1.0 address ' + a[:48] for a in old]) + ([] if m else ['no mn-v2-routes script']))))
        elif js not in m.group(0):
            out.append('%s: mn-v2-routes script is out of date' % p)
    return out


def main():
    check, remove = '--check' in sys.argv, '--remove' in sys.argv
    if check:
        bad = missing()
        for b in bad:
            print('MISSING  ', b)
        print('2.0 routes: %s' % ('%d page(s) need the patch again' % len(bad) if bad else 'all %d pages ok' % len([p for p in PAGES if (ROOT / p).exists()])))
        sys.exit(1 if bad else 0)
    for p in PAGES:
        f = ROOT / p
        if not f.exists():
            print('missing  ', p); continue
        s = f.read_text(encoding='utf-8')
        out = patch(s, remove)
        if out != s:
            f.write_text(out, encoding='utf-8')
        print('%-42s %s' % (p, 'unchanged' if out == s else ('1.0' if remove else '2.0')))


if __name__ == '__main__':
    main()
