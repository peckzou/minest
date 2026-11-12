"""My World 80 — the voxel world's experience pass (run after patch_levels79.py; apply_all.sh runs them in order). Safe to re-run.
  1. capture: take the scene drawn on the walk-in's own canvas, not whichever three.js scene updated last — with the
     island behind still rendering (slow machines, night weather) the wrong scene was turned into blocks
  2. tools/voxel/ux80.js: the layout and UI pass (inserted before window.MinestVoxel62)"""
import re
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
FILES = ['iPhoneDuo.html', 'iPhoneDuo69.html', 'iphone.html', 'iPhone53.8241.html', 'index.html', 'ipad.html',
         'ios/Minest/Minest/iPhoneDuo.html', 'ios/Minest/Minest/index.html', 'ios/Minest/Minest/ipad.html',
         'ios/Minest/Minest/iphone.html', 'ios/Minest/Minest/iphone18.0.html']
MODULE = (HERE / 'ux80.js').read_text(encoding='utf-8').rstrip('\n') if (HERE / 'ux80.js').exists() else ''
assert '</script' not in MODULE.lower()
# undo an earlier attempt (a WebGLRenderer.prototype.render hook: newer three sets render per instance, so it never fired)
OLD = [
    ("P.updateMatrixWorld = function () { if (this.isScene && this !== R.scene && window.__vx62Cap && !walkScene80) lastScene = this; return orig.apply(this, arguments); };\n"
     "    /* 80: the walk-in draws on its own canvas — the scene rendered there is the one to convert (the island behind may render too) */\n"
     "    var RP = T.WebGLRenderer && T.WebGLRenderer.prototype, rOrig = RP && RP.render;\n"
     "    if (rOrig) RP.render = function (sc, cam) { if (window.__vx62Cap && sc && sc.isScene && sc !== R.scene) { var el = this.domElement; if (el && el.closest && el.closest('.mn-walk')) { walkScene80 = sc; lastScene = sc; } } return rOrig.apply(this, arguments); };",
     "P.updateMatrixWorld = function () { if (this.isScene && this !== R.scene && window.__vx62Cap) lastScene = this; return orig.apply(this, arguments); };"),
    ("  var walkScene80 = null;   /* 80 */\n  function countMeshes(sc) {", "  function countMeshes(sc) {"),
    ("      window.__vx62Cap = true; lastScene = null; walkScene80 = null;", "      window.__vx62Cap = true; lastScene = null;"),
]
# the capture: the walk-in registers its scene; the converter takes that one — the island behind (night weather, slow
# machines) also updates during the capture and was being turned into blocks
NEW_V = [
    ("      window.__vx62Cap = true; lastScene = null;", "      window.__vx62Cap = true; lastScene = null; window.__mnWalkScene = null; /* 80 */"),
    ("        var now = performance.now();\n        if (lastScene) {", "        var now = performance.now();\n        if (window.__mnWalkScene) lastScene = window.__mnWalkScene;   /* 80: the walk-in's own scene */\n        if (lastScene) {"),
]
NEW_V.append(("      if (!m.map && m.transparent && m.opacity < .9 && box.min.y > 6) return;   // weather clouds",
              "      if (!m.map && m.transparent && m.opacity < .9 && box.min.y > 1.5) return;   // weather clouds (80: they drift low now — turned into blocks they lay over the island)"))
# 80: with the console folded, the voxel view takes the room down to the console's crumbs row
NEW_V.append(("    if (w && w.width && w.height) {   // never over the console, whatever the stage says",
              "    if (w && w.width && w.height && document.documentElement.classList.contains('vx80-min') && w.top > T0) Hh = Math.max(Hh, w.top - T0);   /* 80: console folded */\n    if (w && w.width && w.height) {   // never over the console, whatever the stage says"))
# 80: a whole new set of pieces is another scene (a room opened, rebuilt twice on the way), not "the thing you just placed"
NEW_V.append(("if (R.ids) { var fresh = Object.keys(ids).filter(function (k) { return !R.ids[k]; }); if (fresh.length) { R.moveId = fresh[fresh.length - 1];",
              "if (R.ids) { var fresh = Object.keys(ids).filter(function (k) { return !R.ids[k]; }), had80 = Object.keys(R.ids).length; if (fresh.length && (fresh.length < Object.keys(ids).length || !had80)) { R.moveId = fresh[fresh.length - 1];"))
WALK_A = "    var S = new T.Scene(), cam = new T.PerspectiveCamera(72, 1, .05, 220),"
WALK_B = "    var S = (window.__mnWalkScene = new T.Scene()) /* 80 */, cam = new T.PerspectiveCamera(72, 1, .05, 220),"
for f in FILES:
    p = ROOT / f
    if not p.exists():
        continue
    s = p.read_text(encoding='utf-8')
    if '<script id="mn-voxel-62">' not in s:
        continue
    i = s.index('<script id="mn-voxel-62">'); j = s.index('</script>', i); v = s[i:j]; v0 = v
    for a, b in OLD:
        if a in v: v = v.replace(a, b)
    for a, b in NEW_V:
        if b not in v and v.count(a) == 1: v = v.replace(a, b)
    v = re.sub(r'  /\* =+ 80 · the voxel world, as one experience.*?(?=\n  window\.MinestVoxel62 = \{)', '', v, flags=re.S)
    v = re.sub(r'\n+(?=  window\.MinestVoxel62 = \{)', '\n', v, count=1)
    if MODULE:
        k = v.index('  window.MinestVoxel62 = {')
        v = v[:k] + MODULE + '\n' + v[k:]
    s = s[:i] + v + s[j:]
    if WALK_B not in s and s.count(WALK_A) == 1:
        s = s.replace(WALK_A, WALK_B)
    if s != p.read_text(encoding='utf-8'):
        p.write_text(s, encoding='utf-8')
        print('patched', f)
