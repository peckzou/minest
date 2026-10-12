#!/usr/bin/env python3
"""My World 3.0 → iPhone 53.1, built on Codex's 53.02 (Visual Library) without touching its modules.
Adds: the Studio asset runtime (inert text, parsed on first use) + universe.js; edge-swipe back knows the .uv layer."""
import re, sys, hashlib, subprocess
from pathlib import Path
HERE = Path(__file__).resolve().parent
REPO = HERE.parents[1]
BASE = Path('/Users/cece/Documents/Codex/2026-10-11/minest-my-world-2-0-independent/outputs/53.02/iPhone53.02.html')
OUT = REPO / 'iPhone53.1.html'
VER, TITLE = '53.1', 'Minest iPhone 53.1 · My World 3.0'

subprocess.run(['node', str(HERE / 'bundle.mjs')], check=True)
html = BASE.read_text(encoding='utf-8')
assets = (HERE / 'dist' / 'assets3d.js').read_text(encoding='utf-8')
uni = (HERE / 'universe.js').read_text(encoding='utf-8')
assert '</script' not in assets and '</script' not in uni
def once(s, a, b, what):
    n = s.count(a)
    if n != 1: sys.exit('%s: found %d' % (what, n))
    return s.replace(a, b)
html = once(html, "var LAYERS = ['.fw', '.mw',", "var LAYERS = ['.fw', '.uv', '.mw',", 'edgeback layers')
html = re.sub(r'<title>[^<]*</title>', '<title>' + TITLE + '</title>', html, count=1)
old = re.search(r'className: "board-version", children: "([\d.]+)" \}', html).group(1)
html = once(html, 'className: "board-version", children: "%s" }' % old, 'className: "board-version", children: "%s" }' % VER, 'version badge')
tail = html.rindex('</body>')
html = html[:tail] + '\n<!-- ---- My World 3.0 (tools/myworld3) ---- -->\n<script type="text/plain" id="mn-assets3d-src">' + assets + '</script>\n<script>\n' + uni + '\n</script>\n' + html[tail:]
OUT.write_text(html, encoding='utf-8')
print('%s ← %s (+%d KB) sha %s' % (OUT.name, BASE.name, (len(html) - len(BASE.read_text(encoding="utf-8"))) // 1024, hashlib.sha256(html.encode()).hexdigest()[:12]))
