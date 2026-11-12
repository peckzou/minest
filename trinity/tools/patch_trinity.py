"""📚 Trinity College inside My World — builds a NEW page (default iPhoneDuo66.html) from iPhoneDuo.html.
The source page is only read. Santorini (Oia), every other world and every display / room feature stay exactly as they are:
this script only inserts, next to them, the same three things the Alpine integration has (alps/tools/patch_alps.py):
  1. the engine sources (trinity-world/*.js) as inert text, run on the first open, ids prefixed 'tr-', CSS scoped to #tr-root;
  2. the runtime MinestTrinity: open / close / isOpen / world / bind / linked / back. In the 3D hall a 🏠 button asks:
     剖面 Dollhouse (My World's building view of the library: its 3 rooms = north hall, rotunda, south hall; Smart Room;
     double-tap a room → Room → Display → Item) or 🚶 walk into the My World room of the wing you stand in. A pill brings you
     back to the same spot in the hall; going ‹ out of the building does the same. Collected books are kept with the island;
  3. in My World: 「一键阿德蒙特图书馆」 among the one-tap islands — the island becomes the abbey grounds with ONE library piece
     (p.tr = 'library', rooms linked by r.tr = wing id), 🚶 Walk in / 阅览 open the 3D library.
usage: python3 tools/patch_trinity.py path/to/iPhoneDuo.html path/to/iPhoneDuo66.html"""
import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
TR = HERE.parent                       # trinity/ (trinity.html, trinity-world/)
SRC = TR / 'trinity-world'
src_page = Path(sys.argv[1])
out_page = Path(sys.argv[2])


def must(s, a, b, n=1):
    assert s.count(a) == n, (a[:80], s.count(a))
    return s.replace(a, b)


def js(name):
    s = (SRC / name).read_text(encoding='utf-8')
    s = s.replace('document.getElementById(id)', "document.getElementById('tr-' + id)")
    s = s.replace('document.body.classList', 'window.__trRoot.classList')
    s = s.replace('window.addEventListener(', '__trL(window, ').replace('document.addEventListener(', '__trL(document, ')
    s = s.replace('new URLSearchParams(location.search)', "new URLSearchParams('')")
    if name == 'app.js':
        s = must(s, '  function frame(now) {\n    requestAnimationFrame(frame);',
                 '  function frame(now) {\n    if (!window.__trOn) { window.__trResume = function () { last = performance.now(); requestAnimationFrame(frame); }; return; }   // closed: paused\n    requestAnimationFrame(frame);')
    assert '</script' not in s.lower(), name
    return s


def css():
    page = (TR / 'trinity.html').read_text(encoding='utf-8')
    body = page[page.index('<style>') + 7:page.index('</style>')]
    body = re.sub(r'/\*.*?\*/', '', body, flags=re.S)
    out = []
    for m in re.finditer(r'([^{}]+)\{([^{}]*)\}', body):
        sels = m.group(1).strip()
        new = []
        for sel in sels.split(','):
            sel = sel.strip()
            if sel in (':root', 'html', 'body'):
                new.append('#tr-root'); continue
            if sel == '*':
                new += ['#tr-root', '#tr-root *']; continue
            sel = re.sub(r'#([A-Za-z][\w-]*)', r'#tr-\1', sel)
            if sel.startswith('body.touch'):
                new.append('#tr-root.touch' + sel[len('body.touch'):]); continue
            new.append('#tr-root ' + sel)
        out.append(', '.join(dict.fromkeys(new)) + ' {' + m.group(2) + '}')
    extra = """
#tr-root { position:fixed; inset:0; z-index:2147483550; }
#tr-root[hidden] { display:none; }
#tr-root #tr-gl, #tr-root #tr-loading, #tr-root #tr-hud { position:absolute; }
#tr-root .adm-x { position:absolute; z-index:60; pointer-events:auto; cursor:pointer; color:#3a2f12; font:700 14px/1.2 ui-serif,Georgia,serif; background:rgba(255,252,244,.92); border:2px solid #c9a227; border-radius:8px;
  box-shadow:0 2px 10px rgba(120,90,20,.25); padding:8px 12px; }
#tr-root #tr-back { left:calc(12px + env(safe-area-inset-left)); top:calc(10px + env(safe-area-inset-top)); }
#tr-root #tr-title { left:calc(150px + env(safe-area-inset-left)); }
#tr-root #tr-enter { left:50%; top:calc(12px + env(safe-area-inset-top)); transform:translateX(-50%); padding:10px 18px; font-size:15px; white-space:nowrap; background:#c9a227; color:#fff; border-color:#f0d27a #8a6418 #8a6418 #f0d27a; }
#tr-root #tr-enter[hidden], #tr-root #tr-choose[hidden] { display:none; }
#tr-root #tr-choose { left:50%; top:calc(64px + env(safe-area-inset-top)); transform:translateX(-50%); width:min(360px,92vw); font:500 13px/1.4 system-ui,sans-serif; cursor:default; }
#tr-root #tr-choose b.t { display:block; font:800 16px/1.2 ui-serif,Georgia,serif; margin-bottom:4px; color:#8a6418; }
#tr-root #tr-choose .n { opacity:.85; margin-bottom:8px; }
#tr-root #tr-choose button { display:block; width:100%; margin:6px 0 0; padding:10px 12px; text-align:left; font:700 14px/1.25 system-ui,sans-serif; color:#3a2f12; background:#fffaf0; border:2px solid #e2c77a; border-radius:8px; cursor:pointer; }
#tr-root #tr-choose button small { display:block; font:500 11.5px/1.3 system-ui; opacity:.8; }
#tr-root #tr-choose button.go { background:#c9a227; color:#fff; border-color:#8a6418; }
#tr-root #tr-choose button.x { display:inline-block; width:auto; padding:6px 10px; }
.mn-tr-pill { position:fixed; z-index:2147483300; left:50%; bottom:calc(14px + env(safe-area-inset-bottom)); transform:translateX(-50%); display:flex; gap:6px; align-items:center; background:rgba(40,32,14,.92); color:#fff; border:2px solid #c9a227; border-radius:999px; padding:6px 8px 6px 14px; font:700 13px system-ui,sans-serif; box-shadow:0 6px 20px #0007; }
.mn-tr-pill[hidden] { display:none; }
.mn-tr-pill span { max-width:46vw; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.mn-tr-pill button { border:0; border-radius:999px; padding:7px 12px; font:800 13px system-ui; color:#fff; background:#c9a227; cursor:pointer; }
.mn-tr-pill button.w { background:#2f6fd0; }
html.duo-halfopen .mn-tr-pill { bottom:calc(50vh + 10px); }
html.mn-tr-on #minest-mini-pet-p0 { visibility:hidden !important; }
"""
    return '<style id="mn-tr-style">\n' + '\n'.join(out) + extra + '</style>\n'


def markup():
    page = (TR / 'trinity.html').read_text(encoding='utf-8')
    b = page[page.index('<body>') + 6:page.index('<script')]
    b = re.sub(r'\bid="([^"]+)"', r'id="tr-\1"', b)
    return ('<button type="button" id="tr-back" class="adm-x">‹ My World</button><button type="button" id="tr-enter" class="adm-x" hidden></button>'
            '<div id="tr-choose" class="adm-x" hidden></div>' + b.strip())


RUNTIME = r"""<script id="mn-tr-run">
/* 📚 MinestTrinity — the Trinity College (three.js mesh) inside My World (admont/tools/patch_trinity.py)
   open(opts) / close() / isOpen() / world() / bind(hooks) / linked(link) / back(). My World binds: key(), label(), counts(wing),
   books() / setBooks(ids), doll(wing, at), enter(wing, at). The 🏠 button names the wing you stand in (north hall, rotunda,
   south hall) and asks: 剖面 Dollhouse (My World's building: its rooms, Smart Room, then Room → Display → Item) or 🚶 its room. */
(function () {
  if (window.MinestTrinity) return;
  var root = null, started = false, H = null, wing = null, enterBtn = null, choose = null, pendingAt = null, LINK = null, pill = null;
  window.__trOn = false; window.__trEmbed = true; window.__trBase = 'admont/';
  window.__trL = function (t, type, fn, o) { t.addEventListener(type, function (e) { if (window.__trOn) return fn.call(this, e); }, o); };
  window.__trBooks = { load: function () { return H && H.books ? H.books() : []; }, save: function (ids) { if (H && H.setBooks) H.setBooks(ids); } };
  function run(id) { var t = document.getElementById(id), s = document.createElement('script'); s.textContent = t ? t.textContent : ''; document.body.appendChild(s); }
  function world() { if (!window.TrinityWorld) run('mn-tr-world'); if (!window.__trWorld) window.__trWorld = TrinityWorld.create(1776); return window.__trWorld; }
  function esc(x) { return String(x).replace(/[&<>"]/g, function (ch) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]; }); }
  function wingAt(x) { var w = world(); return w.buildings.filter(function (b) { return x >= b.x0 && x <= b.x1; })[0] || w.buildings[1]; }
  function wName(b) { return (H && H.label && H.label(b.id)) || b.name; }
  setInterval(function () {   // the wing you are standing in
    if (!window.__trOn || !enterBtn) return; var sa = window.__trinity; if (!sa || !sa.player) return;
    var b = wingAt(sa.player.pos.x); if (b !== wing && choose) choose.hidden = true; wing = b;
    var show = !!(H && sa.S.mode !== 'tour'); enterBtn.hidden = !show || !choose.hidden;
    if (show) { var t = '🏠 ' + wName(b); if (enterBtn.textContent !== t) enterBtn.textContent = t; }
  }, 250);
  function openChooser() {
    var b = wing; if (!b) return; var n = H && H.counts ? H.counts(b.id) : null;
    choose.innerHTML = '<b class="t">🎓 ' + esc(wName(b)) + '</b><div class="n">' + (n && n.rooms ? n.rooms + ' 个空间 · 这里 ' + n.displays + ' 个展位 · ' + n.items + ' 件展品' : '第一次进去会建成 大礼堂 · 雷恩图书馆 · 大庭院 · 后园 四个房间') + '</div>' +
      '<button class="go" data-a="doll">🏠 剖面 Dollhouse<small>北厅 · 中央穹顶厅 · 南厅 · Smart Room 推荐 · 双击房间布置书架和展品</small></button>' +
      (H && H.enter ? '<button data-a="walk">🚶 走进「' + esc(wName(b)) + '」房间<small>My World 的房间（3D）· 🌳 Outside 回到大厅原处</small></button>' : '') +
      '<button class="x" data-a="x">✕</button>';
    choose.hidden = false; enterBtn.hidden = true;
  }
  function at() { var p = window.__trinity.player; return { x: p.pos.x, y: p.pos.y, z: p.pos.z, yaw: p.yaw }; }
  function placeAt() {
    var sa = window.__trinity; if (!pendingAt || !sa || !sa.player) return false; var a = pendingAt; pendingAt = null;
    sa.player.pos.set(a.x, a.y, a.z); sa.player.yaw = a.yaw || 0; sa.player.pitch = 0; sa.player.vel && sa.player.vel.set(0, 0, 0); if (sa.setMode) sa.setMode('walk', true); return true;
  }
  function start() {
    root = document.createElement('div'); root.id = 'tr-root'; root.className = 'mn-tr'; root.innerHTML = MARKUP; document.body.appendChild(root); window.__trRoot = root;
    root.querySelector('#tr-back').addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); close(); });
    enterBtn = root.querySelector('#tr-enter'); choose = root.querySelector('#tr-choose');
    enterBtn.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); openChooser(); });
    choose.addEventListener('click', function (e) {
      e.preventDefault(); e.stopPropagation(); var g = e.target.closest('[data-a]'); if (!g || !wing) return; var a = g.getAttribute('data-a'); choose.hidden = true;
      if (a === 'doll' && H && H.doll) H.doll(wing.id, at());
      else if (a === 'walk' && H && H.enter) H.enter(wing.id, at());
    });
    ['pointerdown', 'touchstart', 'wheel', 'click', 'mousedown'].forEach(function (t) { root.addEventListener(t, function (e) { e.stopPropagation(); }, { passive: true }); });
    world(); run('mn-tr-src');
    var tries = 0; (function ready() { var w = window.__trinity; if (w && w.S && w.player && document.getElementById('adm-loading').classList.contains('done')) { placeAt(); return; } if (++tries < 400) setTimeout(ready, 150); })();
  }
  function open(opts) {
    if (!window.THREE) { if (window.toast) toast('3D is still loading — try again in a moment'); return; }
    if (!H && window.__trBind) window.__trBind();
    pendingAt = opts && opts.at || null; LINK = null; drawPill();
    window.__trOn = true; document.documentElement.classList.add('mn-tr-on');
    if (!started) { started = true; start(); }
    else { root.hidden = false; placeAt(); if (window.__trResume) { var r = window.__trResume; window.__trResume = null; r(); } window.dispatchEvent(new Event('resize')); }
    if (window.MinestSfx) MinestSfx.play('door');
  }
  function close() {
    if (!root) return; window.__trOn = false; root.hidden = true; document.documentElement.classList.remove('mn-tr-on'); if (enterBtn) enterBtn.hidden = true; if (choose) choose.hidden = true;
    try { if (document.pointerLockElement) document.exitPointerLock(); } catch (e) {}
  }
  // ---- back from My World's building to the same spot in the hall
  function lvl() { try { return (window.MinestWorldFold && MinestWorldFold.level()) || 0; } catch (e) { return 0; } }
  function back() {
    var L = LINK; LINK = null; drawPill(); if (!L) return;
    var x = document.querySelector('.mn-walk [data-wkx]'); if (x) { var r = x.getBoundingClientRect(); try { x.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, pointerId: 65, isPrimary: true, clientX: r.left + 2, clientY: r.top + 2 })); } catch (e) {} }
    setTimeout(function () { try { MinestWorldFold.go(1); } catch (e) {} open({ at: L.at }); }, x ? 500 : 60);
  }
  function drawPill() {
    if (!pill) {
      pill = document.createElement('div'); pill.className = 'mn-tr-pill'; pill.hidden = true; pill.setAttribute('popover', 'manual');
      pill.innerHTML = '<span></span><button class="w" data-p="walk">🚶 3D</button><button data-p="back">🎓 回到校园</button>';
      pill.addEventListener('click', function (e) {
        var g = e.target.closest('[data-p]'); if (!g) return; e.stopPropagation();
        if (g.getAttribute('data-p') === 'back') return back();
        var host = document.querySelector('.mn-dsp'); if (!host) return; var b = document.createElement('button'); b.type = 'button'; b.hidden = true; b.setAttribute('data-fpv', ''); host.appendChild(b); b.click(); b.remove();
      });
      document.body.appendChild(pill);
    }
    var on = !!LINK && !(root && !root.hidden && window.__trOn) && !document.querySelector('.mn-walk');
    pill.hidden = !on;
    try { if (on) { if (!pill.matches(':popover-open')) pill.showPopover(); } else if (pill.matches(':popover-open')) pill.hidePopover(); } catch (e) {}
    if (on) { var c = []; try { c = MinestWorldFold.crumbs() || []; } catch (e) {} pill.querySelector('span').textContent = '🎓 ' + (c.slice(2).join(' › ') || LINK.name); pill.querySelector('[data-p="walk"]').hidden = lvl() < 4; }
  }
  setInterval(function () {
    if (!LINK) { if (pill && !pill.hidden) drawPill(); return; }
    var md = window.MinestDisplay; if (!md || !md.isOpen || !md.isOpen()) { LINK = null; return drawPill(); }
    var L = lvl(); if (L >= 3) LINK.reached = true;
    else if (LINK.reached && !document.querySelector('.mn-walk') && Date.now() - LINK.t > 1500) return back();
    drawPill();
  }, 500);
  window.MinestTrinity = { open: open, close: close, world: world, bind: function (h) { H = h; }, isOpen: function () { return !!(root && !root.hidden && window.__trOn); },
    linked: function (l) { LINK = l ? { bid: l.bid, at: l.at, name: l.name, t: Date.now(), reached: false } : null; drawPill(); }, link: function () { return LINK && { bid: LINK.bid, name: LINK.name }; }, back: back };
  var MARKUP = __MARKUP__;
})();
</script>
"""

MYWORLD = r"""    // 🎓 一键三一学院 (trinity/tools/patch_trinity.py): the island IS Trinity College with ONE campus piece (p.tr = 'campus'),
    // whose rooms are the 3D spaces you can enter (r.tr = place id: great_hall / wren / great_court), so displays and things
    // you add stay with that space.
    (function () { if (K.tr_campus) return; var base = BUILD.c_church ? 'c_church' : BUILD.c_town ? 'c_town' : null; if (!base) return;
      K.tr_campus = { n: '三一学院 Trinity College', decor: 1, flat: 0, landmark: 1 }; BUILD.tr_campus = BUILD[base]; })();
    var TR_ROOMS = [['great_hall', 'dining', '大礼堂 Great Hall'], ['wren', 'reading', '雷恩图书馆 Wren Library'], ['great_court', 'gallery', '大庭院 Great Court'], ['backs', 'garden', '后园与剑河 The Backs']];
    function trinityBuild(seed) {
      if (!window.MinestTrinity) return;
      var d = V.d, PL = 8, NY = 4, land = []; for (var i = 0; i < PL; i++) for (var j = 0; j < NY; j++) land.push(i + ',' + j);
      var old = (d.pc || []).filter(function (p) { return p.tr === 'campus'; })[0];
      d.land = land; d.v = 1; d.ground = 'grass'; d.pc = (d.pc || []).filter(function (p) { return !p.tr && !p.vox && (!p.city || (p.it && p.it.length)); }); refreshLand();
      d.terr = { h: {}, w: {}, scape: 'trinity' };
      d.tr = d.tr || { books: [] };
      var p = { id: old ? old.id : uid(), k: K.tr_campus ? 'tr_campus' : 'vox_door', x: PL * 1.5, y: NY * 1.5, f: 0, s: 1.4, it: old ? old.it || [] : [], city: 1, tr: 'campus' };
      p.label = old && old.label || 'Trinity College'; if (old && old.rooms) { p.rooms = old.rooms; p.roomsInit = 1; }
      d.pc.push(p); if (!fits(p)) { p.s = 1; if (!fits(p)) p.k = 'vox_door'; }
      [['tree', 3, 2], ['tree', PL * 3 - 3, 2], ['tree', 3, NY * 3 - 2], ['tree', PL * 3 - 3, NY * 3 - 2]].forEach(function (t) { if (!K[t[0]]) return; var q = { id: uid(), k: t[0], x: t[1], y: t[2], f: 0, s: 1, it: [], city: 1, tr: 'deco' }; d.pc.push(q); if (!fits(q)) d.pc.pop(); });
      refreshLand();
    }
    window.__trBind = function () { MinestTrinity.bind({
      key: function () { return V && V.bid; },
      lib: function () { var R = islandD(), p = (R.pc || []).filter(function (q) { return q.tr === 'campus'; })[0];
        if (!p) { p = { id: uid(), k: 'vox_door', x: 1, y: 1, f: 0, s: 1, it: [], city: 1, tr: 'campus', label: 'Trinity College' }; R.pc.push(p); save(); }
        if ((p.rooms || []).length && p.rooms.length < TR_ROOMS.length && p.rooms.every(function (r) { return r.tr; })) { var have = {}; p.rooms.forEach(function (r) { have[r.tr] = 1; }); TR_ROOMS.forEach(function (a) { if (!have[a[0]]) { var nr = { id: 'r' + uid().slice(1), k: ROOMS[a[1]] ? a[1] : 'hall', n: a[2], tr: a[0] }; p.rooms.push(nr); roomD(nr); } }); save(); }
        if (!(p.rooms || []).length) { p.roomsInit = 1; p.rooms = TR_ROOMS.map(function (a) { return { id: 'r' + uid().slice(1), k: ROOMS[a[1]] ? a[1] : 'hall', n: a[2], tr: a[0] }; }); p.rooms.forEach(function (r) { roomD(r); }); save(); }
        return p; },
      room: function (place) { var p = this.lib(), r = (p.rooms || []).filter(function (x) { return x.tr === place; })[0]; return r || p.rooms[0]; },
      label: function (place) { if (!V) return null; var p = (islandD().pc || []).filter(function (q) { return q.tr === 'campus'; })[0], r = p && (p.rooms || []).filter(function (x) { return x.tr === place; })[0]; return r && r.n; },
      counts: function (place) { var p = V && (islandD().pc || []).filter(function (q) { return q.tr === 'campus'; })[0], rooms = ((p && p.rooms) || []), r = rooms.filter(function (x) { return x.tr === place; })[0], dp = 0, it = 0;
        ((r && r.d && r.d.pc) || []).forEach(function (q) { var n = (q.it || []).length; if (n) { dp++; it += n; } }); return { rooms: rooms.length, displays: dp, items: it }; },
      books: function () { if (!V) return []; var R = islandD(); return (R.tr && R.tr.books) || []; },
      setBooks: function (ids) { if (!V) return; var R = islandD(); R.tr = R.tr || {}; R.tr.books = ids.slice(); clearTimeout(W.trT); W.trT = setTimeout(save, 600); },
      doll: function (place, at) {   // 剖面 Dollhouse: My World's building view — the rooms (Great Hall / Wren / Great Court), Smart Room, then Room -> Display -> Item
        if (!V) return; var p = this.lib(); MinestTrinity.close(); if (V.at) { if (V.at.room) leaveRoom(); bvClose(); V.d = V.root || V.d; V.root = null; V.at = null; refreshLand(); }
        editOn(); bldOpen(p.id); if (window.MinestSfx) MinestSfx.play('door'); MinestTrinity.linked({ bid: place, at: at, name: p.label }); toast('🎓 ' + p.label + ' · 双击房间进去 · ✨ Smart Room 在控制台');
      },
      enter: function (place, at) {   // straight into this space's My World room (the 🚶 walk); 🌳 Outside comes back to the same spot
        if (!V) return; var R = islandD(), p = this.lib(), r = this.room(place);
        roomD(r); save(); MinestTrinity.close(); if (window.MinestSfx) MinestSfx.play('door');
        WKIN = { pc: p.id, back: null, tr: at }; V.root = R; V.at = { pc: p.id, room: r.id }; V.d = r.d; refreshLand(); render(); wkOpen();
      }
    }); };
"""

EDITS = [
    # the one-tap pick: 一键阿德蒙特图书馆, and the way into 3D when the island is the library grounds
    ("['santorini', 'oia', '一键圣托里尼', '伊亚 Oia · 原版 3D 体素世界 · 可进建筑'], ['venice', 'venice', '一键变水城', '威尼斯 · Grand Canal, Rialto, gondolas · 3D']];",
     "['santorini', 'oia', '一键圣托里尼', '伊亚 Oia · 原版 3D 体素世界 · 可进建筑'], ['trinity', 'trinity', '一键三一学院', '剑桥三一学院 · 大庭院 · 大礼堂 · 雷恩图书馆 · 可自由行走'], ['venice', 'venice', '一键变水城', '威尼斯 · Grand Canal, Rialto, gondolas · 3D']];"),
    ("      var go3d = (sc === 'santorini' && window.MinestOia ? '<button type=\"button\" class=\"sm\" data-wfoia><i>' + px('oia') + '</i><b>进入 3D 圣托里尼</b></button>' : '') +",
     "      var go3d = (sc === 'santorini' && window.MinestOia ? '<button type=\"button\" class=\"sm\" data-wfoia><i>' + px('oia') + '</i><b>进入 3D 圣托里尼</b></button>' : '') +\n"
     "        (sc === 'trinity' && window.MinestTrinity ? '<button type=\"button\" class=\"sm\" data-wftrinity><i>' + px('books') + '</i><b>进入 3D 三一学院</b></button>' : '') +"),
    ("var scape = mk === 'countryside' || mk === 'alpine' || mk === 'venice' || mk === 'santorini';",
     "var scape = mk === 'countryside' || mk === 'alpine' || mk === 'venice' || mk === 'santorini' || mk === 'trinity';"),
    ("if (mk === 'venice') veniceBuild(sd); else if (mk === 'santorini') santoriniBuild(sd); else if (scape) scapeBuild(mk, sd); else megaBuild(mk, sd);",
     "if (mk === 'venice') veniceBuild(sd); else if (mk === 'santorini') santoriniBuild(sd); else if (mk === 'trinity') trinityBuild(sd); else if (scape) scapeBuild(mk, sd); else megaBuild(mk, sd);"),
    ("mk === 'santorini' ? '🇬🇷 圣托里尼 · Oia' : '🏙 City')", "mk === 'santorini' ? '🇬🇷 圣托里尼 · Oia' : mk === 'trinity' ? '🎓 三一学院 · Trinity' : '🏙 City')"),
    ("          if (mk === 'santorini' && window.MinestOia) setTimeout(MinestOia.open, 700);",
     "          if (mk === 'santorini' && window.MinestOia) setTimeout(MinestOia.open, 700);\n          if (mk === 'trinity' && window.MinestTrinity && v !== 'again') setTimeout(MinestTrinity.open, 700);   // then straight into the 3D library"),
    ("      if (g.hasAttribute('data-wfoia') && window.MinestOia) { hap(); return MinestOia.open(); }",
     "      if (g.hasAttribute('data-wfoia') && window.MinestOia) { hap(); return MinestOia.open(); }\n      if (g.hasAttribute('data-wftrinity') && window.MinestTrinity) { hap(); return MinestTrinity.open(); }   // 🎓 the Trinity campus, in My World"),
    ("  function wkOpen() {\n    if (window.MinestOia && V && V.d && V.d.terr && V.d.terr.scape === 'santorini' && !(V.at && V.at.room)) {",
     "  function wkOpen() {\n    if (window.MinestTrinity && V && V.d && V.d.terr && V.d.terr.scape === 'trinity' && !(V.at && V.at.room)) { if (typeof WKVIEW !== 'undefined') WKVIEW = false; document.documentElement.classList.remove('mn-wview'); return MinestTrinity.open(); }   /* 🎓 the Trinity campus */\n"
     "    if (window.MinestOia && V && V.d && V.d.terr && V.d.terr.scape === 'santorini' && !(V.at && V.at.room)) {"),
    ("      function goOut() { if (WKIN && WKIN.vox && window.MinestOia) {",
     "      function goOut() { if (WKIN && WKIN.tr && window.MinestTrinity) { var ax = WKIN.tr; SFX('door'); fadeDo('🎓 Trinity', function () { V.d = V.root || V.d; V.root = null; V.at = null; refreshLand(); WKIN = null; var w3 = WK; WK = null; if (steps) steps.stop(); w3.stop(); if (el && V) render(); MinestTrinity.open({ at: ax }); }); return; }   /* the Admont library: back to the same spot in the hall */\n"
     "        if (WKIN && WKIN.vox && window.MinestOia) {"),
    ("    // ---------------------------------------------------------------- one-tap landscapes: terrain (world_terrain.js) + pieces",
     MYWORLD + "    // ---------------------------------------------------------------- one-tap landscapes: terrain (world_terrain.js) + pieces"),
]


SRC_FILES = ['textures.js', 'materials.js', 'hall.js', 'nevile.js', 'wren.js', 'backs.js', 'student.js', 'student-ui.js', 'scene.js', 'app.js']
RT_ANCHOR = "  window.__trBooks = { load: function () { return H && H.books ? H.books() : []; }, save: function (ids) { if (H && H.setBooks) H.setBooks(ids); } };"
RT_NEW = RT_ANCHOR + """
  window.__trStudent = { load: function () { return H && H.student ? H.student() : null; }, save: function (st) { if (H && H.setStudent) H.setStudent(st); } };
  window.__trItems = { list: function () { return H && H.itemList ? H.itemList() : []; }, get: function (id) { return H && H.itemGet ? H.itemGet(id) : null; }, open: function (id) { if (H && H.itemOpen) { MinestTrinity.close(); H.itemOpen(id); } } };"""
HOST_ANCHOR = "      books: function () { if (!V) return []; var R = islandD();"
HOST_NEW = """      student: function () { if (!V) return null; var R = islandD(); return (R.tr && R.tr.student) || null; },
      setStudent: function (st) { if (!V) return; var R = islandD(); R.tr = R.tr || {}; R.tr.student = st; clearTimeout(W.trT); W.trT = setTimeout(save, 600); },
      itemList: function () { if (!V) return []; try { index(); } catch (e) { return []; } return Object.keys(IX).slice(0, 120).map(function (r) { var t = IX[r]; return { id: r, title: String((t.s && t.s.title) || '').trim() || r, kind: 'card', source: 'myworld', bid: V.bid }; }); },
      itemGet: function (id) { if (!V) return null; try { index(); } catch (e) { return null; } var t = IX[id]; return t ? { id: id, title: String((t.s && t.s.title) || '').trim() || id, kind: 'card' } : null; },
      itemOpen: function (id) { if (!V) return; try { index(); } catch (e) { return; } var t = IX[id]; if (!t) return toast('That card is not there any more.'); try { MinestAI.openCardIn(V.bid, t.col && t.col.id, t.k && t.k.id); } catch (e) { toast('Could not open this card'); } },
""" + HOST_ANCHOR


def upgrade(t):
    if 'itemOpen:' not in t and HOST_ANCHOR in t:
        t = t.replace(HOST_ANCHOR, HOST_NEW, 1)
    if 'window.__trItems = {' not in t and RT_ANCHOR in t:
        t = t.replace(RT_ANCHOR, RT_NEW, 1)
    return t


def srcblocks():
    srcs = '\n'.join(js(n) for n in SRC_FILES)
    return ('<script type="text/plain" id="mn-tr-world">\n' + js('world.js') + '\n</script>\n'
            '<script type="text/plain" id="mn-tr-src">\n' + srcs + '\n</script>\n')


page = src_page.read_text(encoding='utf-8')
if 'mn-tr-run' in page:      # already patched: refresh the engine sources and the host bridge in place (no other change)
    s = page
    for tid in ('mn-tr-world', 'mn-tr-src'):
        a = s.index('<script type="text/plain" id="%s">' % tid); b = s.index('</script>\n', a) + len('</script>\n')
        s = s[:a] + ('' if tid == 'mn-tr-src' else '') + s[b:]
    i = s.index('<script id="mn-tr-run">'); s = s[:i] + srcblocks() + s[i:]
    s = upgrade(s)
    assert s.count('itemOpen:') == 1 and s.count('window.__trItems = {') == 1, 'bridge anchors not found'
    out_page.write_text(s, encoding='utf-8')
    print(out_page.name, 'refreshed', len(s.encode('utf-8')), 'bytes'); sys.exit(0)

EDITS = [(a, upgrade(b)) for a, b in EDITS]
RUNTIME = upgrade(RUNTIME)
s = page
for a, b in EDITS:
    s = must(s, a, b)
srcs = '\n'.join(js(n) for n in ['textures.js', 'hall.js', 'nevile.js', 'wren.js', 'backs.js', 'scene.js', 'app.js'])
SRCTAG = srcblocks()
RUN = RUNTIME.replace('__MARKUP__', json.dumps(markup()).replace('</', '<\\/'))
s = s.replace('</head>', css() + '</head>', 1)
i = s.rindex('</body>')
s = s[:i] + SRCTAG + RUN + s[i:]
out_page.write_text(s, encoding='utf-8')
# only insertions: Santorini untouched, and no Alpine (64) layer in this page
assert s.count('mn-oia-run') == page.count('mn-oia-run') and s.count('function santoriniBuild') == 1
assert s.count('mn-alp-run') == 0 and page.count('mn-alp-run') == 0
assert s.startswith(page[:2000]) and len(s) > len(page)
print(out_page.name, len(s.encode('utf-8')), 'bytes')
