#!/usr/bin/env python3
"""My World 3.0 + Discovery & Inspiration → iPhone <ver>, built on Codex's 53.02 (Visual Library) without editing its sources.
usage: build.py 53.2 "Minest iPhone 53.2 · Discovery"
Adds: Studio assets (inert, parsed on first use) · universe.js · discovery.js (+ the inspiration prompts).
Small, explicit patches to the bundled Visual Library: a select event, a render event, and selectEntity / previewEntity / selected
(so Smart Suggestions can join the same multi-select and the same save)."""
import re, sys, json, hashlib, subprocess
from pathlib import Path
HERE = Path(__file__).resolve().parent
REPO = HERE.parents[1]
BASE = Path('/Users/cece/Documents/Codex/2026-10-11/minest-my-world-2-0-independent/outputs/53.02/iPhone53.02.html')
DEVICE = 'ipad' if '--ipad' in sys.argv else 'iphone'
args = [a for a in sys.argv[1:] if not a.startswith('--')]
VER = args[0] if args else '53.3'
TITLE = args[1] if len(args) > 1 else 'Minest %s %s · My World 3.0' % ('iPad' if DEVICE == 'ipad' else 'iPhone', VER)
OUT = REPO / (('iPad%s.html' if DEVICE == 'ipad' else 'iPhone%s.html') % VER)

subprocess.run(['node', str(HERE / 'bundle.mjs')], check=True)
if DEVICE == 'iphone':
    html = BASE.read_text(encoding='utf-8')   # Codex's verified 53.02 (= 53.0 + Visual Library)
else:
    # iPad: the same 53.0 stack from this repo's sources (picker / capture / myworld / pickers already carry Codex's
    # 53.02 changes), then the Visual Library scripts exactly as 53.02 adds them (tools/visual-library)
    subprocess.run(['python3', str(REPO / 'tools/mobile/live_mobile.py'), 'iPad45.7.html', 'iPad53.0.html', 'Minest iPad 53.0 · Frameworks', '53.0'], check=True, cwd=str(REPO))
    html = (REPO / 'iPad53.0.html').read_text(encoding='utf-8')
    vl = '\n'.join((REPO / 'tools/visual-library' / f).read_text(encoding='utf-8').rstrip() for f in ['visual-library.js', 'visual-providers.js', 'visual-images.js', 'expansion-providers.js', 'music-providers.js'])
    assert 'window.MinestVisualLibrary=' not in html and html.count('</body>') == 1
    html = html.replace('</body>', '\n<!-- Minest Visual Library (tools/visual-library, from Codex 53.02) -->\n<script>\n' + vl + '\n</script>\n</body>', 1)
assets = (HERE / 'dist' / 'assets3d.js').read_text(encoding='utf-8')
uni = (HERE / 'universe.js').read_text(encoding='utf-8')
disc = (REPO / 'tools' / 'discovery' / 'discovery.js').read_text(encoding='utf-8')
assist = (REPO / 'tools' / 'discovery' / 'assist.js').read_text(encoding='utf-8')
prompts = json.loads((REPO / 'tools' / 'discovery' / 'inspirations.json').read_text(encoding='utf-8'))
for s in (assets, uni, disc, assist): assert '</script' not in s
def once(s, a, b, what):
    n = s.count(a)
    if n != 1: sys.exit('%s: found %d' % (what, n))
    return s.replace(a, b)
html = once(html, "var LAYERS = ['.fw', '.mw',", "var LAYERS = ['.ins', '.fw', '.uv', '.mw',", 'edgeback layers')
# ---- Visual Library hooks (Discovery Engine)
html = once(html, "function toggle(id) {var x=ui.view==='Preview'?ui.preview:ui.results.find(function(x){return x.entityId===id;})||ui.selected.get(id);",
  "function toggle(id) {var r0=toggle0(id);try{var e0=ui&&(ui.selected.get(id)||(ui.results||[]).find(function(z){return z.entityId===id;})||(ui.extra&&ui.extra.get(id))||ui.preview);document.dispatchEvent(new CustomEvent('minest:vl-select',{detail:{id:id,on:!!(ui&&ui.selected.has(id)),entity:e0,category:ui&&ui.category,bid:ui&&ui.bid}}));}catch(e){}return r0;}\n  function toggle0(id) {var x=ui.view==='Preview'?ui.preview:ui.results.find(function(x){return x.entityId===id;})||ui.selected.get(id)||(ui.extra&&ui.extra.get(id));", 'vl toggle')
html = once(html, "  function renderResults() {\n", "  function renderResults() {renderResults0();try{document.dispatchEvent(new CustomEvent('minest:vl-render',{detail:{view:ui&&ui.view}}));}catch(e){}}\n  function renderResults0() {\n", 'vl render')
html = once(html, "async function preview(id) {var x=ui.results.find(function(x){return x.entityId===id;})||ui.selected.get(id);",
  "async function preview(id) {var x=ui.results.find(function(x){return x.entityId===id;})||ui.selected.get(id)||(ui.extra&&ui.extra.get(id));", 'vl preview')
html = once(html, "window.MinestVisualLibrary={open:open,close:close,",
  "window.MinestVisualLibrary={selectEntity:function(x,on){if(!ui||!x||!x.entityId)return false;ui.extra=ui.extra||new Map();ui.extra.set(x.entityId,x);if(on===false){if(ui.selected.has(x.entityId))toggle(x.entityId);}else if(!ui.selected.has(x.entityId))toggle(x.entityId);return true;},previewEntity:function(x){if(!ui||!x||!x.entityId)return;ui.extra=ui.extra||new Map();ui.extra.set(x.entityId,x);preview(x.entityId);},selected:function(){return ui?Array.from(ui.selected.values()):[];},open:open,close:close,", 'vl api')
# the Visual Library's server calls work inside the app too (bundle pages → the Minest server)
n = html.count("fetch('/api/library/")
if n != 4: sys.exit('library fetches: found %d' % n)
html = html.replace("fetch('/api/library/", "fetch((window.minestLibraryBase?minestLibraryBase():'')+'/api/library/")
html = re.sub(r'<title>[^<]*</title>', '<title>' + TITLE + '</title>', html, count=1)
old = re.search(r'className: "board-version", children: "([\d.]+)" \}', html).group(1)
html = once(html, 'className: "board-version", children: "%s" }' % old, 'className: "board-version", children: "%s" }' % VER, 'version badge')
tail = html.rindex('</body>')
html = (html[:tail] + '\n<!-- ---- My World 3.0 (tools/myworld3) + Discovery Engine (tools/discovery) ---- -->\n<script type="text/plain" id="mn-assets3d-src">' + assets + '</script>\n'
        '<script>\nwindow.__MINEST_INSPIRATIONS = ' + json.dumps(prompts, ensure_ascii=False, separators=(',', ':')) + ';\n' + disc + '\n' + assist + '\n</script>\n<script>\n' + uni + '\n</script>\n' + html[tail:])
OUT.write_text(html, encoding='utf-8')
print('%s ← %s (+%d KB) sha %s' % (OUT.name, BASE.name, (len(html) - len(BASE.read_text(encoding="utf-8"))) // 1024, hashlib.sha256(html.encode()).hexdigest()[:12]))
