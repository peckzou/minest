"""Muse's My World v3 (2026-10-24, made on a copy of the deployed 2743bc5 page) merged into iPhone53.8241.html.
muse_v3.patch is Muse's whole diff (v1 + v3) against 2743bc5:iphone.html; muse_v3_CHANGES.md / _DESIGN.md say what each
part does. A 3-way merge (git merge-file) brings it over our later work; where both changed the same lines ours stays.
Then our own adjustments:
- the island card's Build button keeps its picture (the text button squeezed the world's name into one letter a line);
- no Move / Remove words inside the selection bar and the HUD (they pushed the tools to two rows); the drawer keeps them;
- the First steps card gets the stone look of the other cards (its text was nearly invisible on the Poly Craft theme).
Applied in place, then copied to the other copies. Re-running does nothing once the merge is in.
"""
from pathlib import Path
import re, shutil, subprocess, tempfile

ROOT = Path('/Users/cece/Documents/minest'); HERE = ROOT / 'tools/live-perf'
SRC = ROOT / 'iPhone53.8241.html'
COPIES = ['iphone.html', 'index.html', 'ios/Minest/Minest/iphone.html', 'ios/MinestProject/MyApp/iphone.html', 'ios/Minest/Minest/iphone18.0.html']
s = SRC.read_text(encoding='utf-8')

if 'function firstStepsHtml' not in s:
    with tempfile.TemporaryDirectory() as t:
        t = Path(t); base, theirs, ours = t / 'base.html', t / 'theirs.html', t / 'ours.html'
        base.write_bytes(subprocess.run(['git', '-C', str(ROOT), 'show', '2743bc5:iphone.html'], check=True, capture_output=True).stdout)
        subprocess.run(['patch', '-s', '-o', str(theirs), str(base), str(HERE / 'muse_v3.patch')], check=True)
        ours.write_text(s, encoding='utf-8')
        r = subprocess.run(['git', 'merge-file', '-p', str(ours), str(base), str(theirs)], capture_output=True)
        m = r.stdout.decode('utf-8')
    m, n = re.subn(r'<<<<<<< [^\n]*\n(.*?)=======\n.*?>>>>>>> [^\n]*\n', r'\1', m, flags=re.S)   # both changed it: ours
    print('merged Muse v3 ·', n, 'overlap(s) kept as ours')
    s = m

def rep(a, b):
    global s
    if b in s: return
    assert s.count(a) == 1, (a[:80], s.count(a)); s = s.replace(a, b)

SVG = """'<svg viewBox="0 0 24 24" width="26" height="26"><polygon points="12,4 22,9 12,14 2,9" fill="#71cf55"/><polygon points="2,9 12,14 12,19 2,13" fill="#a9733e"/><polygon points="22,9 12,14 12,19 22,13" fill="#8a5a2b"/><rect x="8" y="3" width="3" height="5" fill="#f2c13d"/><rect x="13" y="4.5" width="3" height="4" fill="#e04a3a"/></svg>'"""
rep("""b.setAttribute('aria-label', '🧱 Build'); b.title = '🧱 Build — Display on the island';
    b.innerHTML = '🧱 Build';""", """b.setAttribute('aria-label', 'Build — put things on the island'); b.title = 'Build — put things on the island';
    b.innerHTML = """ + SVG + ';')
rep("""html body .uv .mn-dsp-b { position:absolute;right:54px;top:50%;transform:translateY(-50%);width:auto;height:46px;display:grid;place-items:center;cursor:pointer;padding:0 14px;font:900 15px/1 var(--pc-font);""",
    """html body .uv .mn-dsp-b { position:absolute;right:66px;top:50%;transform:translateY(-50%);width:46px;height:46px;display:grid;place-items:center;cursor:pointer;padding:0;""")
rep("""html body .uv .uv-hero .tx { padding-right:182px; }""", """html body .uv .uv-hero .tx { padding-right:118px; }""")
rep("""return '<div style="margin:12px 0;padding:14px 16px;border:1px solid var(--uv-line);border-radius:16px;background:var(--uv-card)"><b style="display:block;font-size:16px">First steps</b><p style="color:var(--uv-sub);margin:6px 0 12px">""",
    """return '<div class="uv-fs"><b style="display:block;font-size:16px">First steps</b><p>""")
rep("""    h += hint('world', b);
    h += '<div class="uv-hint"><span>' + ICON.spark""", """    var hw = hint('world', b); h += hw;   // the Grow hint, or (once skipped) the permanent Grow card — never both
    if (!hw) h += '<div class="uv-hint"><span>' + ICON.spark""")
CSS = """<style id="mn-muse3-style">
html body .mn-dsp-sel .mn-dsp-verb, html body .mn-hud-acts .mn-dsp-verb { display:none !important; }
html body .uv-fs { margin:12px 0;padding:14px 16px;color:#fff;background:#3b3b3b;border:3px solid #000;box-shadow:inset 0 0 0 2px #5c5c5c; }
html body .uv-fs p { color:#e4e4e4;margin:6px 0 12px; }
</style>
"""
if 'id="mn-muse3-style"' in s: i = s.index('<style id="mn-muse3-style">'); j = s.index('</style>', i) + len('</style>\n'); s = s[:i] + CSS + s[j:]
else: s = s.replace('</head>', CSS + '</head>', 1)

SRC.write_text(s, encoding='utf-8')
for c in COPIES: shutil.copyfile(SRC, ROOT / c)
print('patched Muse v3')
