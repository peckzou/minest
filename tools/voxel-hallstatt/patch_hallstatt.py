"""Hallstatt (Salzkammergut) voxel world — the engine (hallstatt-world/) inside My World, not an iframe.

Mirrors tools/voxel-oia/patch_oia.py: the five sources in src/ are copied unchanged from hallstatt-world; this
script adapts them while patching:
- every element id gets an 'hs-' prefix and the page CSS is scoped under #hs-root (no clash with My World or Oia);
- document.body becomes the #hs-root container; window / document listeners only fire while the world is open
  (window.__hsOn), so keys, touches and drops reach My World again after ✕;
- the render loop pauses when the world is closed and resumes where it was (MinestHallstatt.open again is instant);
- phones: device-pixel ratio ≤ 1.5, no antialiasing, 50 people instead of 100 (shadows already off on touch).
The sources ride in the page as inert text (<script type="text/plain" id="mn-hs-src">) and run only on first open.
The runtime (MinestHallstatt: open / close / isOpen) adds a ‹ My World button, starts at the local time, plays My
World's outdoor sound with the live weather, and takes over the island's 🚶 Walk in / 阅览 View when the island is
Hallstatt (V.d.terr.scape === 'hallstatt'). Patched into every copy; safe to re-run (each block is replaced)."""
import re
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
SRC = HERE / 'src'
FILES = ['iPhone53.8241.html', 'iphone.html', 'index.html', 'ipad.html', 'iPhoneDuo.html',
         'ios/Minest/Minest/iphone.html', 'ios/Minest/Minest/iphone18.0.html', 'ios/Minest/Minest/ipad.html',
         'ios/MinestProject/MyApp/iphone.html']


def must(s, a, b, n=1):
    assert s.count(a) == n, (a[:70], s.count(a))
    return s.replace(a, b)


def js(name):
    s = (SRC / name).read_text(encoding='utf-8')
    s = s.replace('document.getElementById(id)', "document.getElementById('hs-' + id)")
    s = s.replace('document.body.classList', 'window.__hsRoot.classList')
    s = s.replace('window.addEventListener(', '__hsL(window, ').replace('document.addEventListener(', '__hsL(document, ')
    s = s.replace('new URLSearchParams(location.search)', "new URLSearchParams('')")
    if name == 'app.js':
        s = must(s, "el.id = 'slot' + i;", "el.id = 'hs-slot' + i;")
        s = must(s, 'renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));',
                 'renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isTouch ? 1.5 : 2));')
        s = must(s, "new THREE.WebGLRenderer({ canvas, antialias: true,", "new THREE.WebGLRenderer({ canvas, antialias: !isTouch,")
        s = must(s, 'const NPC_N = 100;', 'const NPC_N = isTouch ? 50 : 100;')
        s = must(s, '      world = VW.create(1846);',
                 '      world = window.__hsWorld || VW.create(1846); window.__hsWorld = world; if (window.__hsApply) window.__hsApply(world, null);   // the same world My World mapped; your saved edits on it')
        s = must(s, 'window.__hallstatt = { world, player, scene, camera, S, setMode, teleport };',
                 'window.__hallstatt = { world, player, scene, camera, S, setMode, teleport, markDirty };')
        s = must(s, 'world.set(target.x, target.y, target.z, 0, 0); markDirty(target.x, target.z);',
                 'if (window.__hsEdit) window.__hsEdit(target.x, target.y, target.z, 0, 0); world.set(target.x, target.y, target.z, 0, 0); markDirty(target.x, target.z);')
        s = must(s, 'const h = HELD[S.held]; world.set(x, y, z, h.id, h.c); markDirty(x, z);',
                 'const h = HELD[S.held]; if (window.__hsEdit) window.__hsEdit(x, y, z, h.id, h.c); world.set(x, y, z, h.id, h.c); markDirty(x, z);')
        s = must(s, '  function frame(now) {\n    requestAnimationFrame(frame);',
                 '  function frame(now) {\n    if (!window.__hsOn) { window.__hsResume = function () { last = 0; requestAnimationFrame(frame); }; return; }   // closed: paused\n    requestAnimationFrame(frame);')
        assert s.index('const isTouch') < s.index('new THREE.WebGLRenderer')
    return s


def css():
    page = (SRC / 'hallstatt.html').read_text(encoding='utf-8')
    body = page[page.index('<style>') + 7:page.index('</style>')]
    out = []
    for m in re.finditer(r'([^{}]+)\{([^{}]*)\}', body):
        sels, decl = m.group(1).strip(), m.group(2)
        sels = re.sub(r'/\*.*?\*/', '', sels, flags=re.S).strip()
        new = []
        for sel in sels.split(','):
            sel = sel.strip()
            if sel in (':root', 'html', 'body'):
                new.append('#hs-root'); continue
            if sel == '*':
                new += ['#hs-root', '#hs-root *']; continue
            sel = re.sub(r'#([A-Za-z][\w-]*)', r'#hs-\1', sel)
            if sel.startswith('body.touch'):
                new.append('#hs-root.touch' + sel[len('body.touch'):]); continue
            new.append('#hs-root ' + sel)
        out.append(', '.join(dict.fromkeys(new)) + ' {' + decl + '}')
    extra = """
#hs-root { position:fixed; inset:0; z-index:2147483550; }
#hs-root[hidden] { display:none; }
#hs-root #hs-gl, #hs-root #hs-loading, #hs-root #hs-hud, #hs-root #hs-uw { position:absolute; }
#hs-root #hs-back { position:absolute; z-index:60; left:calc(12px + env(safe-area-inset-left)); top:calc(10px + env(safe-area-inset-top)); padding:8px 12px; font:800 14px/1 ui-monospace,monospace; color:#fff;
  background:rgba(18,24,36,.72); border:3px solid #111; box-shadow:inset 2px 2px 0 rgba(255,255,255,.2), inset -2px -2px 0 rgba(0,0,0,.35); cursor:pointer; pointer-events:auto; }
#hs-root #hs-title { left:calc(150px + env(safe-area-inset-left)); }
#hs-root #hs-enter { position:absolute; z-index:60; left:50%; top:calc(64px + env(safe-area-inset-top)); transform:translateX(-50%); padding:12px 20px; font:900 16px/1 ui-monospace,monospace; color:#fff; white-space:nowrap;
  background:#3f7f8fd9; border:3px solid; border-color:#9fd9e3 #2a4e5e #2a4e5e #9fd9e3; text-shadow:0 2px 0 #0008; cursor:pointer; pointer-events:auto; }
#hs-root #hs-enter[hidden] { display:none; }
#hs-root #hs-place { position:absolute; z-index:60; right:calc(12px + env(safe-area-inset-right)); top:calc(250px + env(safe-area-inset-top)); padding:9px 12px; font:800 14px/1 ui-monospace,monospace; color:#fff; background:rgba(18,24,36,.72); border:3px solid #111; cursor:pointer; pointer-events:auto; }
#hs-root #hs-ppanel { position:absolute; z-index:61; right:calc(12px + env(safe-area-inset-right)); top:calc(296px + env(safe-area-inset-top)); width:min(300px, 80vw); max-height:46vh; overflow:auto; padding:8px; display:grid; grid-template-columns:1fr 1fr; gap:6px; pointer-events:auto; }
#hs-root #hs-ppanel[hidden] { display:none; }
#hs-root #hs-ppanel button { padding:8px 6px; font:700 12px/1.2 ui-monospace,monospace; color:#fff; background:rgba(255,255,255,.12); border:2px solid rgba(255,255,255,.3); cursor:pointer; text-align:left; }
#hs-root #hs-ppanel button.x { grid-column:span 2; text-align:center; background:rgba(160,60,50,.5); }
html.mn-hs-on #minest-mini-pet-p0 { visibility:hidden !important; }
"""
    return '<style id="mn-hs-style">\n' + '\n'.join(out) + extra + '</style>\n'


def markup():
    page = (SRC / 'hallstatt.html').read_text(encoding='utf-8')
    b = page[page.index('<body>') + 6:page.index('<script')]
    b = re.sub(r'\bid="([^"]+)"', r'id="hs-\1"', b)
    b = re.sub(r'\bfor="([^"]+)"', r'for="hs-\1"', b)
    return ('<button type="button" id="hs-back" class="mc">‹ My World</button>'
            '<button type="button" id="hs-enter" class="mc" hidden></button>'
            '<button type="button" id="hs-place" class="mc">📦 摆放</button>'
            '<div id="hs-ppanel" class="panel" hidden></div>' + b.strip())


RUNTIME = r"""<script id="mn-hs-run">
/* 🇦🇹 MinestHallstatt — the Hallstatt voxel world (hallstatt-world/) inside My World (tools/voxel-hallstatt/patch_hallstatt.py)
   open(opts) / close() / isOpen() / world() / bind(hooks). My World binds: key(), edits(), edit(x,y,z,id,c), label(bid), enter(bid, at).
   Edits you make (break / place) are the island's: kept as a diff on the generated world, re-applied on open (another island's
   undone first). Near a building's wall a 🚪 button takes you into its rooms (My World's own rooms, displays and cards). */
(function () {
  if (window.MinestHallstatt) return;
  var pieceGroup = null, placed = [];
  function refreshPieces() {
    var sa = window.__hallstatt; if (!sa || !sa.scene || !H || !H.meshes) return;
    if (pieceGroup) { sa.scene.remove(pieceGroup); pieceGroup.traverse(function (o) { if (o.geometry) o.geometry.dispose(); }); pieceGroup = null; }
    pieceGroup = H.meshes(THREE, sa.world); if (pieceGroup) sa.scene.add(pieceGroup);
  }
  function panel() {
    var pp = root.querySelector('#hs-ppanel'); if (!pp.hidden) { pp.hidden = true; return; } if (!H || !H.kinds) return;
    pp.innerHTML = H.kinds().map(function (o) { return '<button type="button" data-k="' + o.k + '">' + o.n + '</button>'; }).join('') + '<button type="button" class="x" data-undo>↶ 撤销刚摆的</button>';
    pp.hidden = false;
  }
  var root = null, started = false, amb = null, wxOff = null, H = null, near = null, enterBtn = null, owner = null, applied = null, orig = {}, pendingAt = null;
  window.__hsOn = false;
  window.__hsL = function (t, type, fn, o) { t.addEventListener(type, function (e) { if (window.__hsOn) return fn.call(this, e); }, o); };
  function run(id) { var t = document.getElementById(id), s = document.createElement('script'); s.textContent = t ? t.textContent : ''; document.body.appendChild(s); }
  function world() { if (!window.HallstattWorld) run('mn-hs-world'); if (!window.__hsWorld) window.__hsWorld = HallstattWorld.create(1846); return window.__hsWorld; }
  function cell(w, x, y, z) { var i = w.idx(x, y, z); return [w.blocks[i], w.cols[i]]; }
  window.__hsApply = function (w, dirty) {
    var key = H ? H.key() : null, list = H ? H.edits() : []; if (owner === key && applied === list && !dirty) return;
    Object.keys(orig).forEach(function (k) { var cc = k.split(',').map(Number), o = orig[k]; w.set(cc[0], cc[1], cc[2], o[0], o[1]); if (dirty) dirty(cc[0], cc[2]); }); orig = {};
    list.forEach(function (e) { var k = e[0] + ',' + e[1] + ',' + e[2]; if (!(k in orig)) orig[k] = cell(w, e[0], e[1], e[2]); w.set(e[0], e[1], e[2], e[3], e[4]); if (dirty) dirty(e[0], e[2]); });
    owner = key; applied = list;
  };
  window.__hsEdit = function (x, y, z, id, c) { var w = window.__hsWorld; if (!w) return; var k = x + ',' + y + ',' + z; if (!(k in orig)) orig[k] = cell(w, x, y, z); if (H && H.edit) H.edit(x, y, z, id, c); };
  var KIND = { house: '彩色木屋', church: '尖塔教堂', chapel: '小教堂', boathouse: '船屋', mill: '磨坊' };
  function bName(b) { return (H && H.label && H.label(b.id)) || b.name || KIND[b.kind] || '建筑'; }
  setInterval(function () {
    if (!window.__hsOn || !enterBtn) return; var sa = window.__hallstatt; if (!sa || !sa.player) return; var p = sa.player.pos, best = null, bd = 1.9;
    (sa.world.buildings || []).forEach(function (b) { var dx = Math.max(b.x0 - p.x, 0, p.x - (b.x1 + 1)), dz = Math.max(b.z0 - p.z, 0, p.z - (b.z1 + 1)), d = Math.hypot(dx, dz); if (d < bd && Math.abs(p.y - b.y) < 4.5) { bd = d; best = b; } });
    near = best; var show = !!(best && sa.S.mode !== 'tour' && H && H.enter); enterBtn.hidden = !show; if (show) { var t = '🚪 进入 ' + bName(best); if (enterBtn.textContent !== t) enterBtn.textContent = t; }
  }, 250);
  function sound(on) {
    if (!window.MinestSfx) return; if (!on) { if (amb) { amb.stop(); amb = null; } if (wxOff) { wxOff(); wxOff = null; } return; }
    amb = MinestSfx.loop('outdoor'); var st = window.MinestWX ? MinestWX.state() : null; amb.set(.6, st);
    if (window.MinestWX) wxOff = MinestWX.on(function (s2) { if (amb) amb.set(.6, s2); });
  }
  function placeAt() {
    var sa = window.__hallstatt; if (!pendingAt || !sa || !sa.player) return false; var a = pendingAt; pendingAt = null;
    sa.player.pos.set(a.x, a.y, a.z); sa.player.yaw = a.yaw || 0; sa.player.pitch = 0; sa.player.vel && sa.player.vel.set(0, 0, 0); if (sa.setMode) sa.setMode('walk'); return true;
  }
  function start() {
    root = document.createElement('div'); root.id = 'hs-root'; root.className = 'mn-hs'; root.innerHTML = MARKUP; document.body.appendChild(root); window.__hsRoot = root;
    root.querySelector('#hs-back').addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); close(); });
    root.querySelector('#hs-place').addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); panel(); });
    root.querySelector('#hs-ppanel').addEventListener('click', function (e) {
      e.preventDefault(); e.stopPropagation(); var sa = window.__hallstatt, b = e.target.closest('button'); if (!b || !sa || !H) return;
      if (b.hasAttribute('data-undo')) { var last = placed.pop(); if (last) { H.unplace(last); refreshPieces(); } return; }
      var k = b.getAttribute('data-k'), p = sa.player.pos, yw = sa.player.yaw, id = H.place(k, { x: p.x - Math.sin(yw) * 4, z: p.z - Math.cos(yw) * 4 });
      if (id) { placed.push(id); refreshPieces(); if (window.MinestSfx) MinestSfx.play('thud'); }
    });
    enterBtn = root.querySelector('#hs-enter'); enterBtn.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); var sa = window.__hallstatt; if (!near || !sa || !H || !H.enter) return; var p = sa.player.pos, b = near, cx = (b.x0 + b.x1 + 1) / 2, cz = (b.z0 + b.z1 + 1) / 2; H.enter(near.id, { x: p.x, y: p.y, z: p.z, yaw: Math.atan2(-(p.x - cx), -(p.z - cz)) }); });
    ['pointerdown', 'touchstart', 'wheel', 'click'].forEach(function (t) { root.addEventListener(t, function (e) { e.stopPropagation(); }, { passive: true }); });
    world(); run('mn-hs-src');
    var tries = 0; (function ready() { var w = window.__hallstatt; if (w && w.S && w.player && document.getElementById('hs-loading').classList.contains('done')) { var d = new Date(); w.S.time = d.getHours() + d.getMinutes() / 60; placeAt(); refreshPieces(); return; } if (++tries < 400) setTimeout(ready, 150); })();
  }
  function open(opts) {
    if (!window.THREE) { if (window.toast) toast('3D is still loading — try again in a moment'); return; }
    if (!H && window.__hsBind) window.__hsBind();
    pendingAt = opts && opts.at || null;
    window.__hsOn = true; document.documentElement.classList.add('mn-hs-on');
    if (!started) { started = true; start(); }
    else { root.hidden = false; var sa = window.__hallstatt; if (sa && sa.world) window.__hsApply(sa.world, sa.markDirty); placeAt(); refreshPieces(); if (window.__hsResume) { var r = window.__hsResume; window.__hsResume = null; r(); } window.dispatchEvent(new Event('resize')); }
    sound(true);
  }
  function close() {
    if (!root) return; window.__hsOn = false; root.hidden = true; document.documentElement.classList.remove('mn-hs-on'); sound(false); if (enterBtn) enterBtn.hidden = true;
    try { if (document.pointerLockElement) document.exitPointerLock(); } catch (e) {}
  }
  window.MinestHallstatt = { open: open, close: close, world: world, bind: function (h) { H = h; }, isOpen: function () { return !!(root && !root.hidden && window.__hsOn); } };
  var MARKUP = __MARKUP__;
})();
</script>
"""

HS_WK = ("    if (window.MinestHallstatt && V && V.d && V.d.terr && V.d.terr.scape === 'hallstatt' && !(V.at && V.at.room)) "
         "{ if (typeof WKVIEW !== 'undefined') WKVIEW = false; document.documentElement.classList.remove('mn-wview'); return MinestHallstatt.open(); }"
         "   /* 🇦🇹 the voxel Hallstatt (🚶 and 阅览 both land here) */\n")


def patch_wkopen(s):
    """Insert the Hallstatt wkOpen shortcut right after the Oia one (if present), else after `function wkOpen() {`.
    Idempotent: does nothing if already inserted."""
    if 'MinestHallstatt.open()' in s:
        return s
    # prefer to sit right before the first `if (!V || WK) return;` inside wkOpen
    i = s.find('  function wkOpen() {')
    assert i >= 0, 'wkOpen not found'
    j = s.find('if (!V || WK) return;', i)
    assert 0 <= j, 'wkOpen body anchor not found'
    # back up to the start of that line (preserve indentation already in HS_WK)
    ls = s.rfind('\n', i, j) + 1
    return s[:ls] + HS_WK + s[ls:]

srcs = '\n'.join(js(n) for n in ['textures.js', 'mesher.js', 'models.js', 'app.js'])
wsrc = js('world.js')
assert '</script' not in (srcs + wsrc).lower()
SRCTAG = ('<script type="text/plain" id="mn-hs-world">\n' + wsrc + '\n</script>\n'
          '<script type="text/plain" id="mn-hs-src">\n' + srcs + '\n</script>\n')
import json
RUN = RUNTIME.replace('__MARKUP__', json.dumps(markup()).replace('</', '<\\/'))
CSS = css()

for f in FILES:
    p = ROOT / f
    if not p.exists():
        print('skip (absent)', f); continue
    s = p.read_text(encoding='utf-8')
    for pat in [r'<style id="mn-hs-style">.*?</style>\n', r'<script type="text/plain" id="mn-hs-world">.*?</script>\n',
                r'<script type="text/plain" id="mn-hs-src">.*?</script>\n', r'<script id="mn-hs-run">.*?</script>\n']:
        s = re.sub(pat, '', s, flags=re.S)
    s = s.replace('</head>', CSS + '</head>', 1)
    i = s.rindex('</body>'); s = s[:i] + SRCTAG + RUN + s[i:]
    s = patch_wkopen(s)
    p.write_text(s, encoding='utf-8')
    print('patched', f)
