"""Santorini (Oia) voxel world — the original engine (built in Zed, minest-duo/santorini-world) inside My World, not an iframe.

The five sources in src/ are copied unchanged from minest-duo; this script adapts them while patching:
- every element id gets an 'oia-' prefix and the page CSS is scoped under #oia-root (no clash with My World's ids or styles);
- document.body becomes the #oia-root container; window / document listeners only fire while the world is open
  (window.__oiaOn), so keys, touches and drops reach My World again after ✕;
- the render loop pauses when the world is closed and resumes where it was (MinestOia.open again is instant);
- phones: device-pixel ratio ≤ 1.5, no antialiasing, 50 people instead of 100 (shadows were already off on touch).
The sources ride in the page as inert text (<script type="text/plain" id="mn-oia-src">) and run only on first open.
The runtime (MinestOia: open / close / isOpen) adds a ‹ My World button, starts at the local time, plays My World's outdoor
sound with the live weather, and takes over the island's 🚶 Walk in and 阅览 View when the island is Santorini
(V.d.terr.scape === 'santorini'). Patched into every copy; safe to re-run (each block is replaced with its current text)."""
import re
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
SRC = HERE / 'src'
FILES = ['iPhone53.8241.html', 'iphone.html', 'index.html', 'ipad.html', 'iPhoneDuo.html', 'ios/Minest/Minest/iphone.html',
         'ios/Minest/Minest/iphone18.0.html', 'ios/Minest/Minest/ipad.html', 'ios/MinestProject/MyApp/iphone.html']


def must(s, a, b, n=1):
    assert s.count(a) == n, (a[:70], s.count(a))
    return s.replace(a, b)


def js(name):
    s = (SRC / name).read_text(encoding='utf-8')
    s = s.replace('document.getElementById(id)', "document.getElementById('oia-' + id)")
    s = s.replace('document.body.classList', 'window.__oiaRoot.classList')
    s = s.replace('window.addEventListener(', '__oiaL(window, ').replace('document.addEventListener(', '__oiaL(document, ')
    s = s.replace('new URLSearchParams(location.search)', "new URLSearchParams('')")
    if name == 'world.js':   # every building, registered: My World links its rooms and displays to them
        s = must(s, "    const landmarks = [], lamps = [], flags = [], windmills = [], poles = [], parapets = [], moorings = [];",
                 "    const landmarks = [], lamps = [], flags = [], windmills = [], poles = [], parapets = [], moorings = [], buildings = [];")
        s = must(s, "      return true;\n    }\n    function vaultHouse(", "      buildings.push({ id: 'b' + buildings.length, kind: o.tav ? 'taverna' : 'house', x0, z0, x1, z1, y: b, floors });\n      return true;\n    }\n    function vaultHouse(")
        s = must(s, "const b = Math.round(sum / (w * d)), wallC = pal(wallRGB), cx = (x0 + x1) / 2;", "const b = Math.round(sum / (w * d)), wallC = pal(wallRGB), cx = (x0 + x1) / 2; buildings.push({ id: 'b' + buildings.length, kind: 'cave', x0, z0, x1, z1, y: b, floors: 1 });")
        s = must(s, "      drum(x0 + 3, b + 6, z0 + 4, 2.4, 1, false);", "      buildings.push({ id: 'b' + buildings.length, kind: 'chapel', x0, z0, x1, z1, y: b, floors: 1 });\n      drum(x0 + 3, b + 6, z0 + 4, 2.4, 1, false);")
        s = must(s, "      markOcc(ax - 12, az - 15, ax + 3, az + 22, 3, 1);", "      markOcc(ax - 12, az - 15, ax + 3, az + 22, 3, 1); buildings.push({ id: 'anastasis', kind: 'church', x0, z0, x1, z1, y: y0, floors: 1, name: '三蓝顶教堂' });")
        s = must(s, "      donkeyPath, harbour, XC, ZN, ZS, XE, town, houseCount\n    };",
                 "      donkeyPath, harbour, XC, ZN, ZS, XE, town, houseCount, buildings: (function () {\n"
                 "        landmarks.forEach(function (l) { if (l.id === 'platsani' || l.id === 'castle') buildings.push({ id: l.id, kind: l.id === 'castle' ? 'castle' : 'church', x0: Math.floor(l.x - 4), x1: Math.floor(l.x + 3), z0: Math.floor(l.z - 4), z1: Math.floor(l.z + 3), y: P, floors: 1, name: l.name }); });\n"
                 "        windmills.forEach(function (m, i) { buildings.push({ id: 'mill' + i, kind: 'mill', x0: Math.floor(m.x - 3.5), x1: Math.floor(m.x + 2.5), z0: Math.floor(m.z - 3.5), z1: Math.floor(m.z + 2.5), y: P, floors: 1, name: '伊亚风车' }); });\n"
                 "        return buildings; })()\n    };")
    if name == 'app.js':
        s = must(s, "el.id = 'slot' + i;", "el.id = 'oia-slot' + i;")
        s = must(s, 'renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));', 'renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isTouch ? 1.5 : 2));')
        s = must(s, "new THREE.WebGLRenderer({ canvas, antialias: true,", "new THREE.WebGLRenderer({ canvas, antialias: !isTouch,")
        s = must(s, 'const NPC_N = 100;', 'const NPC_N = isTouch ? 50 : 100;')
        s = must(s, '      world = VW.create(2021);', '      world = window.__oiaWorld || VW.create(2021); window.__oiaWorld = world; if (window.__oiaApply) window.__oiaApply(world, null);   // the same world My World mapped; your saved edits on it')
        s = must(s, 'window.__santorini = { world, player, scene, camera, S, setMode, teleport };', 'window.__santorini = { world, player, scene, camera, S, setMode, teleport, markDirty };')
        s = must(s, 'world.set(target.x, target.y, target.z, 0, 0); markDirty(target.x, target.z);', 'if (window.__oiaEdit) window.__oiaEdit(target.x, target.y, target.z, 0, 0); world.set(target.x, target.y, target.z, 0, 0); markDirty(target.x, target.z);')
        s = must(s, 'const h = HELD[S.held]; world.set(x, y, z, h.id, h.c); markDirty(x, z);', 'const h = HELD[S.held]; if (window.__oiaEdit) window.__oiaEdit(x, y, z, h.id, h.c); world.set(x, y, z, h.id, h.c); markDirty(x, z);')
        s = must(s, '  function frame(now) {\n    requestAnimationFrame(frame);',
                 '  function frame(now) {\n    if (!window.__oiaOn) { window.__oiaResume = function () { last = 0; requestAnimationFrame(frame); }; return; }   // closed: paused\n    requestAnimationFrame(frame);')
        # the engine starts after canvas / touch detection need the container: isTouch is computed before the renderer
        assert s.index('const isTouch') < s.index('new THREE.WebGLRenderer')
    return s


def css():
    page = (SRC / 'santorini.html').read_text(encoding='utf-8')
    body = page[page.index('<style>') + 7:page.index('</style>')]
    out = []
    for m in re.finditer(r'([^{}]+)\{([^{}]*)\}', body):
        sels, decl = m.group(1).strip(), m.group(2)
        sels = re.sub(r'/\*.*?\*/', '', sels, flags=re.S).strip()
        new = []
        for sel in sels.split(','):
            sel = sel.strip()
            if sel in (':root', 'html', 'body'):
                new.append('#oia-root'); continue
            if sel == '*':
                new += ['#oia-root', '#oia-root *']; continue
            sel = re.sub(r'#([A-Za-z][\w-]*)', r'#oia-\1', sel)
            if sel.startswith('body.touch'):
                new.append('#oia-root.touch' + sel[len('body.touch'):]); continue
            new.append('#oia-root ' + sel)
        out.append(', '.join(dict.fromkeys(new)) + ' {' + decl + '}')
    extra = """
#oia-root { position:fixed; inset:0; z-index:2147483550; }
#oia-root[hidden] { display:none; }
#oia-root #oia-gl, #oia-root #oia-loading, #oia-root #oia-hud, #oia-root #oia-uw { position:absolute; }
#oia-root #oia-back { position:absolute; z-index:60; left:calc(12px + env(safe-area-inset-left)); top:calc(10px + env(safe-area-inset-top)); padding:8px 12px; font:800 14px/1 ui-monospace,monospace; color:#fff;
  background:rgba(18,24,36,.72); border:3px solid #111; box-shadow:inset 2px 2px 0 rgba(255,255,255,.2), inset -2px -2px 0 rgba(0,0,0,.35); cursor:pointer; pointer-events:auto; }
#oia-root #oia-title { left:calc(150px + env(safe-area-inset-left)); }
#oia-root #oia-enter { position:absolute; z-index:60; left:50%; top:calc(64px + env(safe-area-inset-top)); transform:translateX(-50%); padding:12px 20px; font:900 16px/1 ui-monospace,monospace; color:#fff; white-space:nowrap;
  background:#3f8f3fd9; border:3px solid; border-color:#9fe39f #2a5e2a #2a5e2a #9fe39f; text-shadow:0 2px 0 #0008; cursor:pointer; pointer-events:auto; }
#oia-root #oia-enter[hidden] { display:none; }
html.mn-oia-on #minest-mini-pet-p0 { visibility:hidden !important; }
"""
    return '<style id="mn-oia-style">\n' + '\n'.join(out) + extra + '</style>\n'


def markup():
    page = (SRC / 'santorini.html').read_text(encoding='utf-8')
    b = page[page.index('<body>') + 6:page.index('<script')]
    b = re.sub(r'\bid="([^"]+)"', r'id="oia-\1"', b)
    b = re.sub(r'\bfor="([^"]+)"', r'for="oia-\1"', b)
    return '<button type="button" id="oia-back" class="mc">‹ My World</button><button type="button" id="oia-enter" class="mc" hidden></button>' + b.strip()


RUNTIME = r"""<script id="mn-oia-run">
/* 🇬🇷 MinestOia — the Santorini voxel world (Zed's engine) inside My World (tools/voxel-oia/patch_oia.py)
   open(opts) / close() / isOpen() / world() / bind(hooks). My World binds: key(), edits(), edit(x,y,z,id,c), label(bid), enter(bid, at).
   Edits you make (break / place) are the island's: kept as a diff on the generated world, re-applied on open (another island's
   undone first). Near a building's wall a 🚪 button takes you into its rooms (My World's own rooms, displays and cards). */
(function () {
  if (window.MinestOia) return;
  var root = null, started = false, amb = null, wxOff = null, H = null, near = null, enterBtn = null, owner = null, applied = null, orig = {}, pendingAt = null;
  window.__oiaOn = false;
  window.__oiaL = function (t, type, fn, o) { t.addEventListener(type, function (e) { if (window.__oiaOn) return fn.call(this, e); }, o); };
  function run(id) { var t = document.getElementById(id), s = document.createElement('script'); s.textContent = t ? t.textContent : ''; document.body.appendChild(s); }
  function world() { if (!window.SantoriniWorld) run('mn-oia-world'); if (!window.__oiaWorld) window.__oiaWorld = SantoriniWorld.create(2021); return window.__oiaWorld; }
  function cell(w, x, y, z) { var i = w.idx(x, y, z); return [w.blocks[i], w.cols[i]]; }
  window.__oiaApply = function (w, dirty) {   // this island's edits on the world (the last island's put back first)
    var key = H ? H.key() : null, list = H ? H.edits() : []; if (owner === key && applied === list && !dirty) return;
    Object.keys(orig).forEach(function (k) { var c = k.split(',').map(Number), o = orig[k]; w.set(c[0], c[1], c[2], o[0], o[1]); if (dirty) dirty(c[0], c[2]); }); orig = {};
    list.forEach(function (e) { var k = e[0] + ',' + e[1] + ',' + e[2]; if (!(k in orig)) orig[k] = cell(w, e[0], e[1], e[2]); w.set(e[0], e[1], e[2], e[3], e[4]); if (dirty) dirty(e[0], e[2]); });
    owner = key; applied = list;
  };
  window.__oiaEdit = function (x, y, z, id, c) { var w = window.__oiaWorld; if (!w) return; var k = x + ',' + y + ',' + z; if (!(k in orig)) orig[k] = cell(w, x, y, z); if (H && H.edit) H.edit(x, y, z, id, c); };
  var KIND = { house: '白屋', cave: '洞穴屋', chapel: '蓝顶小教堂', church: '教堂', castle: '城堡遗址', mill: '风车', taverna: '小酒馆' };
  function bName(b) { return (H && H.label && H.label(b.id)) || b.name || KIND[b.kind] || '建筑'; }
  setInterval(function () {   // the door you are standing at
    if (!window.__oiaOn || !enterBtn) return; var sa = window.__santorini; if (!sa || !sa.player) return; var p = sa.player.pos, best = null, bd = 1.9;
    (sa.world.buildings || []).forEach(function (b) { var dx = Math.max(b.x0 - p.x, 0, p.x - (b.x1 + 1)), dz = Math.max(b.z0 - p.z, 0, p.z - (b.z1 + 1)), d = Math.hypot(dx, dz); if (d < bd && Math.abs(p.y - b.y) < 3.5) { bd = d; best = b; } });
    near = best; var show = !!(best && sa.S.mode !== 'tour' && H && H.enter); enterBtn.hidden = !show; if (show) { var t = '🚪 进入 ' + bName(best); if (enterBtn.textContent !== t) enterBtn.textContent = t; }
  }, 250);
  function sound(on) {
    if (!window.MinestSfx) return; if (!on) { if (amb) { amb.stop(); amb = null; } if (wxOff) { wxOff(); wxOff = null; } return; }
    amb = MinestSfx.loop('outdoor'); var st = window.MinestWX ? MinestWX.state() : null; amb.set(.6, st);
    if (window.MinestWX) wxOff = MinestWX.on(function (s2) { if (amb) amb.set(.6, s2); });
  }
  function placeAt() {   // back out of a building: on its doorstep, facing away from it
    var sa = window.__santorini; if (!pendingAt || !sa || !sa.player) return false; var a = pendingAt; pendingAt = null;
    sa.player.pos.set(a.x, a.y, a.z); sa.player.yaw = a.yaw || 0; sa.player.pitch = 0; sa.player.vel && sa.player.vel.set(0, 0, 0); if (sa.setMode) sa.setMode('walk'); return true;
  }
  function start() {
    root = document.createElement('div'); root.id = 'oia-root'; root.className = 'mn-oia'; root.innerHTML = MARKUP; document.body.appendChild(root); window.__oiaRoot = root;
    root.querySelector('#oia-back').addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); close(); });
    enterBtn = root.querySelector('#oia-enter'); enterBtn.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); var sa = window.__santorini; if (!near || !sa || !H || !H.enter) return; var p = sa.player.pos, b = near, cx = (b.x0 + b.x1 + 1) / 2, cz = (b.z0 + b.z1 + 1) / 2; H.enter(near.id, { x: p.x, y: p.y, z: p.z, yaw: Math.atan2(-(p.x - cx), -(p.z - cz)) }); });   // coming back out: facing the street
    ['pointerdown', 'touchstart', 'wheel', 'click'].forEach(function (t) { root.addEventListener(t, function (e) { e.stopPropagation(); }, { passive: true }); });   // My World's own handlers stay out
    world(); run('mn-oia-src');   // the engine boots now, on the world My World already mapped
    var tries = 0; (function ready() { var w = window.__santorini; if (w && w.S && w.player && document.getElementById('oia-loading').classList.contains('done')) { var d = new Date(); w.S.time = d.getHours() + d.getMinutes() / 60; placeAt(); return; } if (++tries < 400) setTimeout(ready, 150); })();   // starts at your local time
  }
  function open(opts) {
    if (!window.THREE) { if (window.toast) toast('3D is still loading — try again in a moment'); return; }
    if (!H && window.__oiaBind) window.__oiaBind();   // My World binds this island on the first open
    pendingAt = opts && opts.at || null;
    window.__oiaOn = true; document.documentElement.classList.add('mn-oia-on');
    if (!started) { started = true; start(); }
    else { root.hidden = false; var sa = window.__santorini; if (sa && sa.world) window.__oiaApply(sa.world, sa.markDirty); placeAt(); if (window.__oiaResume) { var r = window.__oiaResume; window.__oiaResume = null; r(); } window.dispatchEvent(new Event('resize')); }
    sound(true);
  }
  function close() {
    if (!root) return; window.__oiaOn = false; root.hidden = true; document.documentElement.classList.remove('mn-oia-on'); sound(false); if (enterBtn) enterBtn.hidden = true;
    try { if (document.pointerLockElement) document.exitPointerLock(); } catch (e) {}
  }
  window.MinestOia = { open: open, close: close, world: world, bind: function (h) { H = h; }, isOpen: function () { return !!(root && !root.hidden && window.__oiaOn); } };
  var MARKUP = __MARKUP__;
})();
</script>
"""

EDITS = [   # the island's 🚶 Walk in and 阅览 View open the voxel world when the island is Santorini
    ("  function wkOpen() {\n    if (!V || WK) return;", "  function wkOpen() {\n    if (window.MinestOia && V && V.d && V.d.terr && V.d.terr.scape === 'santorini' && !(V.at && V.at.room)) { if (typeof WKVIEW !== 'undefined') WKVIEW = false; document.documentElement.classList.remove('mn-wview'); return MinestOia.open(); }   /* 🇬🇷 the original voxel Oia (🚶 and 阅览 both land here) */\n    if (!V || WK) return;"),
]

srcs = '\n'.join(js(n) for n in ['textures.js', 'mesher.js', 'models.js', 'app.js'])
wsrc = js('world.js')
assert '</script' not in (srcs + wsrc).lower()
SRCTAG = '<script type="text/plain" id="mn-oia-world">\n' + wsrc + '\n</script>\n<script type="text/plain" id="mn-oia-src">\n' + srcs + '\n</script>\n'
import json
RUN = RUNTIME.replace('__MARKUP__', json.dumps(markup()).replace('</', '<\\/'))
CSS = css()

for f in FILES:
    p = ROOT / f
    s = p.read_text(encoding='utf-8')
    for pat in [r'<style id="mn-oia-style">.*?</style>\n', r'<script type="text/plain" id="mn-oia-world">.*?</script>\n', r'<script type="text/plain" id="mn-oia-src">.*?</script>\n', r'<script id="mn-oia-run">.*?</script>\n']:
        s = re.sub(pat, '', s, flags=re.S)
    s = s.replace('</head>', CSS + '</head>', 1)
    i = s.rindex('</body>'); s = s[:i] + SRCTAG + RUN + s[i:]
    for a, b in EDITS:
        if b in s: continue
        assert s.count(a) == 1, (f, a[:60])
        s = s.replace(a, b)
    p.write_text(s, encoding='utf-8')
    print('patched', f)
