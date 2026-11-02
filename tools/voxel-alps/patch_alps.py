"""🏔 Alpine Chalet voxel valley inside My World — builds a NEW page (default iPhoneDuo64.html) from iPhoneDuo.html.
The source page is only read. The Santorini (Oia) world, its runtime and every display / room feature stay exactly as they
are: this script only inserts, next to them, the same three things the Oia integration has (tools/voxel-oia/patch_oia.py):
  1. the engine sources (alpine-world/*.js) as inert text, run on the first open, ids prefixed 'alp-', CSS scoped to #alp-root;
  2. the runtime MinestAlps: open / close / isOpen / world / bind — the island's block edits are kept with the island, and at a
     building's door 🏠 asks: 剖面 Dollhouse (My World's building view of it: rooms on floors, Smart Room, ＋ add a room,
     double-tap a room → Room → Display → Item) or 🚪 开门进屋 (the voxel chalet's own interior). A pill brings you back
     onto the doorstep; going ‹ out of the building does the same;
  3. in My World: 「一键阿尔卑斯木屋」 among the one-tap islands — the island becomes the valley (its terrain, a piece for each
     building, linked by p.alp, so rooms, displays and things stay with that building), 🚶 Walk in / 阅览 open the 3D valley.
usage: python3 tools/patch_alps.py path/to/iPhoneDuo.html path/to/iPhoneDuo64.html"""
import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ALP = next(p for p in [HERE.parent, HERE.parents[1]] if (p / 'alpine-world').is_dir())   # the folder with alpine.html and alpine-world/
SRC = ALP / 'alpine-world'
src_page = Path(sys.argv[1])
out_page = Path(sys.argv[2])


def must(s, a, b, n=1):
    assert s.count(a) == n, (a[:80], s.count(a))
    return s.replace(a, b)


def js(name):
    s = (SRC / name).read_text(encoding='utf-8')
    s = s.replace('document.getElementById(id)', "document.getElementById('alp-' + id)")
    s = s.replace('document.body.classList', 'window.__alpRoot.classList')
    s = s.replace('window.addEventListener(', '__alpL(window, ').replace('document.addEventListener(', '__alpL(document, ')
    s = s.replace('new URLSearchParams(location.search)', "new URLSearchParams('')")
    if name == 'app.js':
        s = must(s, "el.id = 'slot' + i;", "el.id = 'alp-slot' + i;")
        s = must(s, 'world.set(target.x, target.y, target.z, 0, 0); markDirty(target.x, target.z);',
                 'if (window.__alpEdit) window.__alpEdit(target.x, target.y, target.z, 0, 0); world.set(target.x, target.y, target.z, 0, 0); markDirty(target.x, target.z);')
        s = must(s, 'const h = HELD[S.held]; world.set(x, y, z, h.id, h.c); markDirty(x, z);',
                 'const h = HELD[S.held]; if (window.__alpEdit) window.__alpEdit(x, y, z, h.id, h.c); world.set(x, y, z, h.id, h.c); markDirty(x, z);')
        s = must(s, '  function frame(now) {\n    requestAnimationFrame(frame);',
                 '  function frame(now) {\n    if (!window.__alpOn) { window.__alpResume = function () { last = performance.now(); requestAnimationFrame(frame); }; return; }   // closed: paused\n    requestAnimationFrame(frame);')
    assert '</script' not in s.lower()
    return s


def css():
    page = (ALP / 'alpine.html').read_text(encoding='utf-8')
    body = page[page.index('<style>') + 7:page.index('</style>')]
    out = []
    for m in re.finditer(r'([^{}]+)\{([^{}]*)\}', body):
        sels = re.sub(r'/\*.*?\*/', '', m.group(1), flags=re.S).strip()
        new = []
        for sel in sels.split(','):
            sel = sel.strip()
            if sel in (':root', 'html', 'body', 'html,body'):
                new.append('#alp-root'); continue
            if sel == '*':
                new += ['#alp-root', '#alp-root *']; continue
            sel = re.sub(r'#([A-Za-z][\w-]*)', r'#alp-\1', sel)
            if sel.startswith('body.touch'):
                new.append('#alp-root.touch' + sel[len('body.touch'):]); continue
            new.append('#alp-root ' + sel)
        out.append(', '.join(dict.fromkeys(new)) + ' {' + m.group(2) + '}')
    extra = """
#alp-root { position:fixed; inset:0; z-index:2147483550; }
#alp-root[hidden] { display:none; }
#alp-root #alp-gl, #alp-root #alp-loading, #alp-root #alp-hud { position:absolute; }
#alp-root .alp-x { position:absolute; z-index:60; pointer-events:auto; cursor:pointer; color:#fff; font:800 14px/1.2 ui-monospace,monospace; background:rgba(18,24,36,.78); border:3px solid #111;
  box-shadow:inset 2px 2px 0 rgba(255,255,255,.2), inset -2px -2px 0 rgba(0,0,0,.35); padding:8px 12px; }
#alp-root #alp-back { left:calc(12px + env(safe-area-inset-left)); top:calc(10px + env(safe-area-inset-top)); }
#alp-root #alp-title { left:calc(150px + env(safe-area-inset-left)); }
#alp-root #alp-enter { left:50%; top:calc(64px + env(safe-area-inset-top)); transform:translateX(-50%); padding:12px 20px; font-size:16px; white-space:nowrap; background:#3f8f3fd9; border-color:#9fe39f #2a5e2a #2a5e2a #9fe39f; }
#alp-root #alp-enter[hidden], #alp-root #alp-choose[hidden] { display:none; }
#alp-root #alp-choose { left:50%; top:calc(116px + env(safe-area-inset-top)); transform:translateX(-50%); width:min(360px,92vw); font:600 13px/1.4 system-ui,sans-serif; cursor:default; }
#alp-root #alp-choose b.t { display:block; font:900 16px/1.2 ui-monospace,monospace; margin-bottom:4px; }
#alp-root #alp-choose .n { opacity:.85; margin-bottom:8px; }
#alp-root #alp-choose button { display:block; width:100%; margin:6px 0 0; padding:10px 12px; text-align:left; font:800 14px/1.25 system-ui,sans-serif; color:#fff; background:#2b3a55; border:3px solid; border-color:#5b6f96 #18233a #18233a #5b6f96; cursor:pointer; }
#alp-root #alp-choose button small { display:block; font:600 11.5px/1.3 system-ui; opacity:.8; }
#alp-root #alp-choose button.go { background:#3f8f3f; border-color:#9fe39f #2a5e2a #2a5e2a #9fe39f; }
#alp-root #alp-choose button.x { display:inline-block; width:auto; padding:6px 10px; background:#444; }
.mn-alp-pill { position:fixed; z-index:2147483300; left:50%; bottom:calc(14px + env(safe-area-inset-bottom)); transform:translateX(-50%); display:flex; gap:6px; align-items:center; background:rgba(18,24,36,.92); color:#fff; border:2px solid #3f8f3f; border-radius:999px; padding:6px 8px 6px 14px; font:700 13px system-ui,sans-serif; box-shadow:0 6px 20px #0007; }
.mn-alp-pill[hidden] { display:none; }
.mn-alp-pill span { max-width:46vw; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.mn-alp-pill button { border:0; border-radius:999px; padding:7px 12px; font:800 13px system-ui; color:#fff; background:#3f8f3f; cursor:pointer; }
.mn-alp-pill button.w { background:#2f6fd0; }
html.duo-halfopen .mn-alp-pill { bottom:calc(50vh + 10px); }
html.mn-alp-on #minest-mini-pet-p0 { visibility:hidden !important; }
"""
    return '<style id="mn-alp-style">\n' + '\n'.join(out) + extra + '</style>\n'


def markup():
    page = (ALP / 'alpine.html').read_text(encoding='utf-8')
    b = page[page.index('<body>') + 6:page.index('<script')]
    b = re.sub(r'\bid="([^"]+)"', r'id="alp-\1"', b)
    b = re.sub(r'\bfor="([^"]+)"', r'for="alp-\1"', b)
    return ('<button type="button" id="alp-back" class="alp-x">‹ My World</button><button type="button" id="alp-enter" class="alp-x" hidden></button>'
            '<div id="alp-choose" class="alp-x" hidden></div>' + b.strip())


RUNTIME = r"""<script id="mn-alp-run">
/* 🏔 MinestAlps — the Alpine Chalet voxel valley inside My World (tools/voxel-alps/patch_alps.py)
   open(opts) / close() / isOpen() / world() / bind(hooks) / linked(link). My World binds: key(), edits(), edit(x,y,z,id,c), label(bid),
   counts(bid), doll(bid, at), enter(bid, at). Block edits are the island's (a diff on the generated valley, re-applied on open).
   At a building's door 🏠 asks: 剖面 Dollhouse (My World's building: rooms, Smart Room, then Room → Display → Item) or 🚪 进屋. */
(function () {
  if (window.MinestAlps) return;
  var root = null, started = false, amb = null, wxOff = null, H = null, near = null, enterBtn = null, choose = null, owner = null, applied = null, orig = {}, pendingAt = null, LINK = null, pill = null;
  window.__alpOn = false; window.__alpEmbed = true;
  window.__alpL = function (t, type, fn, o) { t.addEventListener(type, function (e) { if (window.__alpOn) return fn.call(this, e); }, o); };
  function run(id) { var t = document.getElementById(id), s = document.createElement('script'); s.textContent = t ? t.textContent : ''; document.body.appendChild(s); }
  function world() { if (!window.AlpineWorld) run('mn-alp-world'); if (!window.__alpWorld) window.__alpWorld = AlpineWorld.create(1291); return window.__alpWorld; }
  function cell(w, x, y, z) { var i = w.idx(x, y, z); return [w.blocks[i], w.cols[i]]; }
  window.__alpApply = function (w, dirty) {
    var key = H ? H.key() : null, list = H ? H.edits() : []; if (owner === key && applied === list && !dirty) return;
    Object.keys(orig).forEach(function (k) { var c = k.split(',').map(Number), o = orig[k]; w.set(c[0], c[1], c[2], o[0], o[1]); if (dirty) dirty(c[0], c[2]); }); orig = {};
    list.forEach(function (e) { var k = e[0] + ',' + e[1] + ',' + e[2]; if (!(k in orig)) orig[k] = cell(w, e[0], e[1], e[2]); w.set(e[0], e[1], e[2], e[3], e[4]); if (dirty) dirty(e[0], e[2]); });
    owner = key; applied = list;
  };
  window.__alpEdit = function (x, y, z, id, c) { var w = window.__alpWorld; if (!w) return; var k = x + ',' + y + ',' + z; if (!(k in orig)) orig[k] = cell(w, x, y, z); if (H && H.edit) H.edit(x, y, z, id, c); };
  function esc(x) { return String(x).replace(/[&<>"]/g, function (ch) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]; }); }
  function bName(b) { return (H && H.label && H.label(b.id)) || b.name || '木屋'; }
  setInterval(function () {   // the door you are standing at
    if (!window.__alpOn || !enterBtn) return; var sa = window.__alpine; if (!sa || !sa.player) return; var p = sa.player.pos, best = null, bd = 2.8;
    (sa.world.buildings || []).forEach(function (b) { var d = Math.hypot(p.x - (b.door[0] + 0.5), p.z - (b.door[2] + 0.5)); if (d < bd && Math.abs(p.y - b.y) < 3) { bd = d; best = b; } });
    if (best !== near && choose) choose.hidden = true;
    near = best; var show = !!(best && sa.S.mode !== 'tour' && H); enterBtn.hidden = !show || !choose.hidden; if (show) { var t = '🏠 ' + bName(best); if (enterBtn.textContent !== t) enterBtn.textContent = t; }
  }, 250);
  function openChooser() {
    var b = near, sa = window.__alpine; if (!b || !sa) return; var n = H && H.counts ? H.counts(b.id) : null, d = sa.world.doors.filter(function (q) { return q.x === b.door[0] && q.z === b.door[2]; })[0];
    choose.innerHTML = '<b class="t">🏠 ' + esc(bName(b)) + '</b><div class="n">' + (n && n.rooms ? n.rooms + ' 个房间 · ' + n.displays + ' 个展位 · ' + n.items + ' 件展品' : '还没有房间 · 第一次进去会按它的用途推荐房间') + '</div>' +
      '<button class="go" data-a="doll">🏠 剖面 Dollhouse<small>楼层与房间 · Smart Room 推荐、确认、Refine · 双击房间进去布置展架和展品</small></button>' +
      '<button data-a="door">' + (d && d.open ? '🚪 关门' : '🚪 开门进屋') + '<small>走进这座木屋本身：壁炉、桌椅、楼梯、阳台</small></button>' +
      (H && H.enter ? '<button data-a="walk">🚶 走进 My World 房间<small>直接进入第一个房间（3D）· 🌳 Outside 回到门口</small></button>' : '') +
      '<button class="x" data-a="x">✕</button>';
    choose.hidden = false; enterBtn.hidden = true;
  }
  function at() { var sa = window.__alpine, p = sa.player.pos, b = near, cx = (b.x0 + b.x1 + 1) / 2, cz = (b.z0 + b.z1 + 1) / 2; return { x: p.x, y: p.y, z: p.z, yaw: Math.atan2(-(p.x - cx), -(p.z - cz)) }; }
  function sound(on) {
    if (!window.MinestSfx) return; if (!on) { if (amb) { amb.stop(); amb = null; } if (wxOff) { wxOff(); wxOff = null; } return; }
    amb = MinestSfx.loop('outdoor'); var st = window.MinestWX ? MinestWX.state() : null; amb.set(.6, st);
    if (window.MinestWX) wxOff = MinestWX.on(function (s2) { if (amb) amb.set(.6, s2); });
  }
  function placeAt() {
    var sa = window.__alpine; if (!pendingAt || !sa || !sa.player) return false; var a = pendingAt; pendingAt = null;
    sa.player.pos.set(a.x, a.y, a.z); sa.player.yaw = a.yaw || 0; sa.player.pitch = 0; sa.player.vel && sa.player.vel.set(0, 0, 0); if (sa.setMode) sa.setMode('walk', true); return true;
  }
  function start() {
    root = document.createElement('div'); root.id = 'alp-root'; root.className = 'mn-alp'; root.innerHTML = MARKUP; document.body.appendChild(root); window.__alpRoot = root;
    root.querySelector('#alp-back').addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); close(); });
    enterBtn = root.querySelector('#alp-enter'); choose = root.querySelector('#alp-choose');
    enterBtn.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); openChooser(); });
    choose.addEventListener('click', function (e) {
      e.preventDefault(); e.stopPropagation(); var g = e.target.closest('[data-a]'); if (!g || !near) return; var a = g.getAttribute('data-a'), sa = window.__alpine, b = near; choose.hidden = true;
      if (a === 'doll' && H && H.doll) H.doll(b.id, at());
      else if (a === 'walk' && H && H.enter) H.enter(b.id, at());
      else if (a === 'door' && sa) { var d = sa.world.doors.filter(function (q) { return q.x === b.door[0] && q.z === b.door[2]; })[0]; if (d) sa.toggleDoor(d); }
    });
    ['pointerdown', 'touchstart', 'wheel', 'click', 'mousedown'].forEach(function (t) { root.addEventListener(t, function (e) { e.stopPropagation(); }, { passive: true }); });
    world(); run('mn-alp-src');
    var tries = 0; (function ready() { var w = window.__alpine; if (w && w.S && w.player && document.getElementById('alp-loading').classList.contains('done')) { var d = new Date(); w.S.time = d.getHours() + d.getMinutes() / 60; placeAt(); return; } if (++tries < 400) setTimeout(ready, 150); })();
  }
  function open(opts) {
    if (!window.THREE) { if (window.toast) toast('3D is still loading — try again in a moment'); return; }
    if (!H && window.__alpsBind) window.__alpsBind();
    pendingAt = opts && opts.at || null; LINK = null; drawPill();
    window.__alpOn = true; document.documentElement.classList.add('mn-alp-on');
    if (!started) { started = true; start(); }
    else { root.hidden = false; var sa = window.__alpine; if (sa && sa.world) window.__alpApply(sa.world, sa.markDirty); placeAt(); if (window.__alpResume) { var r = window.__alpResume; window.__alpResume = null; r(); } window.dispatchEvent(new Event('resize')); }
    sound(true);
  }
  function close() {
    if (!root) return; window.__alpOn = false; root.hidden = true; document.documentElement.classList.remove('mn-alp-on'); sound(false); if (enterBtn) enterBtn.hidden = true; if (choose) choose.hidden = true;
    try { if (document.pointerLockElement) document.exitPointerLock(); } catch (e) {}
  }
  // ---- back from My World's building onto its doorstep in the valley
  function lvl() { try { return (window.MinestWorldFold && MinestWorldFold.level()) || 0; } catch (e) { return 0; } }
  function back() {
    var L = LINK; LINK = null; drawPill(); if (!L) return;
    var x = document.querySelector('.mn-walk [data-wkx]'); if (x) { var r = x.getBoundingClientRect(); try { x.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, pointerId: 64, isPrimary: true, clientX: r.left + 2, clientY: r.top + 2 })); } catch (e) {} }
    setTimeout(function () { try { MinestWorldFold.go(1); } catch (e) {} open({ at: L.at }); }, x ? 500 : 60);
  }
  function drawPill() {
    if (!pill) {
      pill = document.createElement('div'); pill.className = 'mn-alp-pill'; pill.hidden = true; pill.setAttribute('popover', 'manual');
      pill.innerHTML = '<span></span><button class="w" data-p="walk">🚶 3D</button><button data-p="back">🏔 回到门口</button>';
      pill.addEventListener('click', function (e) {
        var g = e.target.closest('[data-p]'); if (!g) return; e.stopPropagation();
        if (g.getAttribute('data-p') === 'back') return back();
        var host = document.querySelector('.mn-dsp'); if (!host) return; var b = document.createElement('button'); b.type = 'button'; b.hidden = true; b.setAttribute('data-fpv', ''); host.appendChild(b); b.click(); b.remove();
      });
      document.body.appendChild(pill);
    }
    var on = !!LINK && !(root && !root.hidden && window.__alpOn) && !document.querySelector('.mn-walk');
    pill.hidden = !on;
    try { if (on) { if (!pill.matches(':popover-open')) pill.showPopover(); } else if (pill.matches(':popover-open')) pill.hidePopover(); } catch (e) {}
    if (on) { var c = []; try { c = MinestWorldFold.crumbs() || []; } catch (e) {} pill.querySelector('span').textContent = '🏔 ' + (c.slice(2).join(' › ') || LINK.name); pill.querySelector('[data-p="walk"]').hidden = lvl() < 4; }
  }
  setInterval(function () {
    if (!LINK) { if (pill && !pill.hidden) drawPill(); return; }
    var md = window.MinestDisplay; if (!md || !md.isOpen || !md.isOpen()) { LINK = null; return drawPill(); }
    var L = lvl(); if (L >= 3) LINK.reached = true;
    else if (LINK.reached && !document.querySelector('.mn-walk') && Date.now() - LINK.t > 1500) return back();
    drawPill();
  }, 500);
  window.MinestAlps = { open: open, close: close, world: world, bind: function (h) { H = h; }, isOpen: function () { return !!(root && !root.hidden && window.__alpOn); },
    linked: function (l) { LINK = l ? { bid: l.bid, at: l.at, name: l.name, t: Date.now(), reached: false } : null; drawPill(); }, link: function () { return LINK && { bid: LINK.bid, name: LINK.name }; }, back: back };
  var MARKUP = __MARKUP__;
})();
</script>
"""

MYWORLD = r"""    // 🏔 一键阿尔卑斯木屋 (tools/voxel-alps/patch_alps.py): the island IS the Alpine Chalet voxel valley — its slopes, peaks and lake as the
    // terrain, each of its buildings a piece linked to it (p.alp), so the rooms, displays and things you give a chalet stay with it
    [['alp_chalet', '阿尔卑斯木屋 Alpine chalet', 'h_chalet'], ['alp_inn', '山间旅馆 Gasthaus', 'c_hotel'], ['alp_chapel', '山间小教堂 Chapel', 'c_church'], ['alp_barn', '谷仓 Barn', 'barn'], ['alp_hut', '山屋 Mountain hut', 'cabin']].forEach(function (v) {
      if (K[v[0]]) return; var base = BUILD[v[2]] ? v[2] : 'h_chalet'; if (!BUILD[base]) return; K[v[0]] = { n: v[1], decor: 1, flat: 0, landmark: 1 }; BUILD[v[0]] = BUILD[base]; });
    function alpsBuild(seed) {
      if (!window.MinestAlps) return;
      var wv = MinestAlps.world(), d = V.d, Wv = wv.W, Dv = wv.D, PL = 14, N = PL * 3, s = N / Math.max(Wv, Dv), NY = Math.ceil(Dv * s);
      var land = []; for (var i = 0; i < PL; i++) for (var j = 0; j * 3 < NY; j++) land.push(i + ',' + j);
      var keep = {}; (d.pc || []).forEach(function (p) { if (p.alp) keep[p.alp] = p; });
      d.land = land; d.v = 1; d.ground = 'grass'; d.pc = (d.pc || []).filter(function (p) { return !p.alp && !p.vox && (!p.city || (p.it && p.it.length)); }); refreshLand();
      var h = {}, wt = {};
      for (var x = 0; x < N; x++) for (var y = 0; y < NY; y++) { var k = x + ',' + y, vx = Math.min(Wv - 1, Math.floor((x + .5) / s)), vz = Math.min(Dv - 1, Math.floor((y + .5) / s)), hv = wv.hm[vx + Wv * vz];
        if (hv <= wv.WATER_Y + .2) { wt[k] = 2; continue; } var L = Math.round((hv - 13) / 2.4); if (L > 0) h[k] = Math.min(22, L); }
      d.terr = { h: h, w: wt, scape: 'alpchalet', lv: { stone: 9, snow: 12 } };
      d.alp = d.alp || { edits: [] };
      var KM = { chalet: 'alp_chalet', inn: 'alp_inn', chapel: 'alp_chapel', barn: 'alp_barn', hut: 'alp_hut' };
      wv.buildings.forEach(function (b) {
        var cx = (b.x0 + b.x1 + 1) / 2, cz = (b.z0 + b.z1 + 1) / 2, sz = Math.max(b.x1 - b.x0 + 1, b.z1 - b.z0 + 1) * s, old = keep[b.id], kk = KM[b.kind] && K[KM[b.kind]] ? KM[b.kind] : 'vox_door';
        var p = { id: old ? old.id : uid(), k: kk, x: Math.round(cx * s * 2) / 2, y: Math.round(cz * s * 2) / 2, f: 0, s: Math.max(.5, Math.min(1.4, sz / 2.6)), it: old ? old.it || [] : [], city: 1, alp: b.id };
        p.label = old && old.label || b.name; if (old && old.rooms) { p.rooms = old.rooms; p.roomsInit = 1; }
        d.pc.push(p); if (!fits(p)) { p.k = 'vox_door'; p.s = 1; }
      });
      refreshLand();
    }
    window.__alpsBind = function () { MinestAlps.bind({   // the valley and this island: its block edits, its buildings' names and contents, going into one
      key: function () { return V && V.bid; },
      edits: function () { var R = V && (V.root || V.d); return (R && R.alp && R.alp.edits) || []; },
      edit: function (x, y, z, id, c) { if (!V) return; var R = islandD(); R.alp = R.alp || { edits: [] }; var E = R.alp.edits; for (var i = E.length - 1; i >= 0; i--) if (E[i][0] === x && E[i][1] === y && E[i][2] === z) { E.splice(i, 1); break; } E.push([x, y, z, id, c]); clearTimeout(W.alpT); W.alpT = setTimeout(save, 600); },
      label: function (bid) { if (!V) return null; var p = (islandD().pc || []).filter(function (q) { return q.alp === bid; })[0]; return p && p.label; },
      counts: function (bid) { var p = V && (islandD().pc || []).filter(function (q) { return q.alp === bid; })[0], r = 0, dp = 0, it = 0; ((p && p.rooms) || []).forEach(function (rm) { r++; ((rm.d && rm.d.pc) || []).forEach(function (q) { var n = (q.it || []).length; if (n) { dp++; it += n; } }); }); return { rooms: r, displays: dp, items: it }; },
      piece: function (bid) { var R = islandD(), p = (R.pc || []).filter(function (q) { return q.alp === bid; })[0];
        if (!p) { var bb = MinestAlps.world().buildings.filter(function (x) { return x.id === bid; })[0]; p = { id: uid(), k: 'vox_door', x: 1, y: 1, f: 0, s: 1, it: [], city: 1, alp: bid, label: bb && bb.name }; R.pc.push(p); save(); }
        return p; },
      doll: function (bid, at) {   // 剖面 Dollhouse: My World's building view of it — rooms on floors, Smart Room, then Room → Display → Item
        if (!V) return; var p = this.piece(bid); MinestAlps.close(); if (V.at) { if (V.at.room) leaveRoom(); bvClose(); V.d = V.root || V.d; V.root = null; V.at = null; refreshLand(); }
        editOn(); bldOpen(p.id); if (window.MinestSfx) MinestSfx.play('door'); MinestAlps.linked({ bid: bid, at: at, name: p.label || 'Chalet' }); toast('🏠 ' + (p.label || 'Chalet') + ' · 双击房间进去 · ✨ Smart Room 在控制台');
      },
      enter: function (bid, at) {   // straight into its first room (the 🚶 walk); 🌳 Outside comes back to this doorstep
        if (!V) return; var R = islandD(), p = this.piece(bid);
        if (!(p.rooms || []).length) { p.roomsInit = 1; p.rooms = suggestRooms(p).map(function (k) { return { id: 'r' + uid().slice(1), k: k, n: ROOMS[k][0] }; }); p.rooms.forEach(function (r) { roomD(r); }); }
        var r = p.rooms[0]; roomD(r); save(); MinestAlps.close(); if (window.MinestSfx) MinestSfx.play('door');
        WKIN = { pc: p.id, back: null, alp: at }; V.root = R; V.at = { pc: p.id, room: r.id }; V.d = r.d; refreshLand(); render(); wkOpen();
      }
    }); };
"""

EDITS = [
    # the one-tap pick: 一键阿尔卑斯木屋, and the way into 3D when the island is the valley
    ("['santorini', 'oia', '一键圣托里尼', '伊亚 Oia · 原版 3D 体素世界 · 可进建筑'], ['venice', 'venice', '一键变水城', '威尼斯 · Grand Canal, Rialto, gondolas · 3D']];",
     "['santorini', 'oia', '一键圣托里尼', '伊亚 Oia · 原版 3D 体素世界 · 可进建筑'], ['alpchalet', 'alps', '一键阿尔卑斯木屋', '雪山 · 松林 · 木屋 · 3D 体素 · 可进屋'], ['venice', 'venice', '一键变水城', '威尼斯 · Grand Canal, Rialto, gondolas · 3D']];"),
    ("      var go3d = (sc === 'santorini' && window.MinestOia ? '<button type=\"button\" class=\"sm\" data-wfoia><i>' + px('oia') + '</i><b>进入 3D 圣托里尼</b></button>' : '') +",
     "      var go3d = (sc === 'santorini' && window.MinestOia ? '<button type=\"button\" class=\"sm\" data-wfoia><i>' + px('oia') + '</i><b>进入 3D 圣托里尼</b></button>' : '') +\n"
     "        (sc === 'alpchalet' && window.MinestAlps ? '<button type=\"button\" class=\"sm\" data-wfalps><i>' + px('alps') + '</i><b>进入 3D 阿尔卑斯木屋</b></button>' : '') +"),
    ("var scape = mk === 'countryside' || mk === 'alpine' || mk === 'venice' || mk === 'santorini';",
     "var scape = mk === 'countryside' || mk === 'alpine' || mk === 'venice' || mk === 'santorini' || mk === 'alpchalet';"),
    ("if (mk === 'venice') veniceBuild(sd); else if (mk === 'santorini') santoriniBuild(sd); else if (scape) scapeBuild(mk, sd); else megaBuild(mk, sd);",
     "if (mk === 'venice') veniceBuild(sd); else if (mk === 'santorini') santoriniBuild(sd); else if (mk === 'alpchalet') alpsBuild(sd); else if (scape) scapeBuild(mk, sd); else megaBuild(mk, sd);"),
    ("mk === 'santorini' ? '🇬🇷 圣托里尼 · Oia' : '🏙 City')", "mk === 'santorini' ? '🇬🇷 圣托里尼 · Oia' : mk === 'alpchalet' ? '🏔 阿尔卑斯木屋 · Alpine Chalet' : '🏙 City')"),
    ("          if (mk === 'santorini' && window.MinestOia) setTimeout(MinestOia.open, 700);",
     "          if (mk === 'santorini' && window.MinestOia) setTimeout(MinestOia.open, 700);\n          if (mk === 'alpchalet' && window.MinestAlps && v !== 'again') setTimeout(MinestAlps.open, 700);   // then straight into the 3D valley"),
    ("      if (g.hasAttribute('data-wfoia') && window.MinestOia) { hap(); return MinestOia.open(); }",
     "      if (g.hasAttribute('data-wfoia') && window.MinestOia) { hap(); return MinestOia.open(); }\n      if (g.hasAttribute('data-wfalps') && window.MinestAlps) { hap(); return MinestAlps.open(); }   // 🏔 the Alpine Chalet valley, in My World"),
    # 🚶 Walk in / 阅览 on the valley island open the 3D valley; a room walked into from a chalet comes back out onto its doorstep
    ("  function wkOpen() {\n    if (window.MinestOia && V && V.d && V.d.terr && V.d.terr.scape === 'santorini' && !(V.at && V.at.room)) {",
     "  function wkOpen() {\n    if (window.MinestAlps && V && V.d && V.d.terr && V.d.terr.scape === 'alpchalet' && !(V.at && V.at.room)) { if (typeof WKVIEW !== 'undefined') WKVIEW = false; document.documentElement.classList.remove('mn-wview'); return MinestAlps.open(); }   /* 🏔 the Alpine Chalet valley */\n"
     "    if (window.MinestOia && V && V.d && V.d.terr && V.d.terr.scape === 'santorini' && !(V.at && V.at.room)) {"),
    ("      function goOut() { if (WKIN && WKIN.vox && window.MinestOia) {",
     "      function goOut() { if (WKIN && WKIN.alp && window.MinestAlps) { var ax = WKIN.alp; SFX('door'); fadeDo('🏔 Alpen', function () { V.d = V.root || V.d; V.root = null; V.at = null; refreshLand(); WKIN = null; var w3 = WK; WK = null; if (steps) steps.stop(); w3.stop(); if (el && V) render(); MinestAlps.open({ at: ax }); }); return; }   /* an Alpine chalet: back onto its doorstep */\n"
     "        if (WKIN && WKIN.vox && window.MinestOia) {"),
    # the valley's own functions, next to Santorini's
    ("    // ---------------------------------------------------------------- one-tap landscapes: terrain (world_terrain.js) + pieces",
     MYWORLD + "    // ---------------------------------------------------------------- one-tap landscapes: terrain (world_terrain.js) + pieces"),
]

page = src_page.read_text(encoding='utf-8')
assert 'mn-alp-run' not in page, 'already patched'
s = page
for a, b in EDITS:
    s = must(s, a, b)
srcs = '\n'.join(js(n) for n in ['textures.js', 'mesher.js', 'app.js'])
SRCTAG = ('<script type="text/plain" id="mn-alp-world">\n' + js('world.js') + '\n</script>\n'
          '<script type="text/plain" id="mn-alp-src">\n' + srcs + '\n</script>\n')
RUN = RUNTIME.replace('__MARKUP__', json.dumps(markup()).replace('</', '<\\/'))
s = s.replace('</head>', css() + '</head>', 1)
i = s.rindex('</body>')
s = s[:i] + SRCTAG + RUN + s[i:]
out_page.write_text(s, encoding='utf-8')
# Santorini and everything else untouched: only these insertions
assert s.count('mn-oia-run') == page.count('mn-oia-run') and s.count('function santoriniBuild') == 1
print(out_page.name, len(s.encode('utf-8')), 'bytes')
