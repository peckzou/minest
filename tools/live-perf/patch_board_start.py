"""Board mode (看板模式): the top bar is back, and the first screen comes up sooner.
Applied in place to iPhone53.8241.html, then copied to iphone.html, index.html and the two iOS copies.

1. Top bar / bottom dock: the 3D-Cover rule from e06d719 also matched `html.mn-immersive`, which the board uses all the
   time, so the top bar and dock were hidden for good. It is now limited to the 3D Cover (body.mode-coverflow) and student
   mode. The `body:has(.perspective-stage)` selectors go too: a :has() on <body> makes every DOM change re-check the whole
   page's styles (costly while the board first renders, above all in iOS Safari). The 3D Cover already sets
   body.mode-coverflow.
2. three.js / GLTFLoader: the page tried `three.min.js` and `GLTFLoader.js` first. On the web both are 404s, each a
   blocking round trip before the real copy in vendor/. Now the web loads vendor/ directly and the app loads its own
   bundled copy. Both are preloaded from <head>, so they download alongside the main bundle instead of after it.
   The old fallbacks stay.
3. Google Fonts no longer block the first paint: the stylesheet loads as print and switches itself on, with the system
   font shown until then.
"""
from pathlib import Path
import shutil, sys

ROOT = Path('/Users/cece/Documents/minest')
SRC = ROOT / 'iPhone53.8241.html'
COPIES = ['iphone.html', 'index.html', 'ios/Minest/Minest/iphone.html', 'ios/MinestProject/MyApp/iphone.html']
s = SRC.read_text(encoding='utf-8')
if 'mn-three-preload' in s:
    sys.exit('already patched')

def rep(a, b, n=1):
    global s
    c = s.count(a); assert c == n, (a[:100], c, n); s = s.replace(a, b)

rep("""body.mode-coverflow header.iphone-topbar,
html.mn-immersive header.iphone-topbar,
body:has(.perspective-stage) header.iphone-topbar,
html.student-mode header.iphone-topbar,
html.student-mode .ios-bottom-tab-bar,
body.mode-coverflow .ios-bottom-tab-bar,
html.mn-immersive .ios-bottom-tab-bar,
body:has(.perspective-stage) .ios-bottom-tab-bar {""",
"""body.mode-coverflow header.iphone-topbar,
html.student-mode header.iphone-topbar,
html.student-mode .ios-bottom-tab-bar,
body.mode-coverflow .ios-bottom-tab-bar {   /* only the 3D Cover and student mode — the board keeps its bars */""")

rep("""<script src="three.min.js"></script>""",
    """<script>document.write('<script src="' + (/^https?:$/.test(location.protocol) ? 'vendor/three.min.js' : 'three.min.js') + '"><\\/script>');</script>""")
rep("""<script src="GLTFLoader.js"></script>""",
    """<script>document.write('<script src="' + (/^https?:$/.test(location.protocol) ? 'vendor/GLTFLoader.js' : 'GLTFLoader.js') + '"><\\/script>');</script>""")
rep("""<head>
    <meta charset="UTF-8" />""",
    """<head>
    <meta charset="UTF-8" />
    <script id="mn-three-preload">(function(){try{var web=/^https?:$/.test(location.protocol);['three.min.js','GLTFLoader.js'].forEach(function(f){var l=document.createElement('link');l.rel='preload';l.as='script';l.href=(web?'vendor/':'')+f;document.head.appendChild(l);});}catch(e){}})();</script>""")
rep("""<link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Noto+Sans+SC:wght@300;400;500;600;700&display=swap" rel="stylesheet">""",
    """<link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Noto+Sans+SC:wght@300;400;500;600;700&display=swap" rel="stylesheet" media="print" onload="this.media='all'">""")

SRC.write_text(s, encoding='utf-8')
for c in COPIES:
    shutil.copyfile(SRC, ROOT / c)
print('patched board start')
