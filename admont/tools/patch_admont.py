"""📚 Admont Abbey Library inside My World — builds a NEW page (default iPhoneDuo65.html) from iPhoneDuo.html.
The source page is only read. Santorini (Oia), every other world and every display / room feature stay exactly as they are:
this script only inserts, next to them, the same three things the Alpine integration has (alps/tools/patch_alps.py):
  1. the engine sources (admont-world/*.js) as inert text, run on the first open, ids prefixed 'adm-', CSS scoped to #adm-root;
  2. the runtime MinestAdmont: open / close / isOpen / world / bind / linked / back. In the 3D hall a 🏠 button asks:
     剖面 Dollhouse (My World's building view of the library: its 3 rooms = north hall, rotunda, south hall; Smart Room;
     double-tap a room → Room → Display → Item) or 🚶 walk into the My World room of the wing you stand in. A pill brings you
     back to the same spot in the hall; going ‹ out of the building does the same. Collected books are kept with the island;
  3. in My World: 「一键阿德蒙特图书馆」 among the one-tap islands — the island becomes the abbey grounds with ONE library piece
     (p.adm = 'library', rooms linked by r.adm = wing id), 🚶 Walk in / 阅览 open the 3D library.
usage: python3 tools/patch_admont.py path/to/iPhoneDuo.html path/to/iPhoneDuo65.html"""
import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ADM = HERE.parent                      # admont/ (admont.html, admont-world/)
SRC = ADM / 'admont-world'
src_page = Path(sys.argv[1])
out_page = Path(sys.argv[2])


def must(s, a, b, n=1):
    assert s.count(a) == n, (a[:80], s.count(a))
    return s.replace(a, b)


def js(name):
    s = (SRC / name).read_text(encoding='utf-8')
    s = s.replace('document.getElementById(id)', "document.getElementById('adm-' + id)")
    s = s.replace('document.body.classList', 'window.__admRoot.classList')
    s = s.replace('window.addEventListener(', '__admL(window, ').replace('document.addEventListener(', '__admL(document, ')
    s = s.replace('new URLSearchParams(location.search)', "new URLSearchParams('')")
    if name == 'app.js':
        s = must(s, '  function frame(now) {\n    requestAnimationFrame(frame);',
                 '  function frame(now) {\n    if (!window.__admOn) { window.__admResume = function () { last = performance.now(); requestAnimationFrame(frame); }; return; }   // closed: paused\n    requestAnimationFrame(frame);')
    assert '</script' not in s.lower(), name
    return s


def css():
    page = (ADM / 'admont.html').read_text(encoding='utf-8')
    body = page[page.index('<style>') + 7:page.index('</style>')]
    body = re.sub(r'/\*.*?\*/', '', body, flags=re.S)
    out = []
    for m in re.finditer(r'([^{}]+)\{([^{}]*)\}', body):
        sels = m.group(1).strip()
        new = []
        for sel in sels.split(','):
            sel = sel.strip()
            if sel in (':root', 'html', 'body'):
                new.append('#adm-root'); continue
            if sel == '*':
                new += ['#adm-root', '#adm-root *']; continue
            sel = re.sub(r'#([A-Za-z][\w-]*)', r'#adm-\1', sel)
            if sel.startswith('body.touch'):
                new.append('#adm-root.touch' + sel[len('body.touch'):]); continue
            new.append('#adm-root ' + sel)
        out.append(', '.join(dict.fromkeys(new)) + ' {' + m.group(2) + '}')
    extra = """
#adm-root { position:fixed; inset:0; z-index:2147483550; }
#adm-root[hidden] { display:none; }
#adm-root #adm-gl, #adm-root #adm-loading, #adm-root #adm-hud { position:absolute; }
#adm-root .adm-x { position:absolute; z-index:60; pointer-events:auto; cursor:pointer; color:#3a2f12; font:700 14px/1.2 ui-serif,Georgia,serif; background:rgba(255,252,244,.92); border:2px solid #c9a227; border-radius:8px;
  box-shadow:0 2px 10px rgba(120,90,20,.25); padding:8px 12px; }
#adm-root #adm-back { left:calc(12px + env(safe-area-inset-left)); top:calc(10px + env(safe-area-inset-top)); }
#adm-root #adm-title { left:calc(150px + env(safe-area-inset-left)); }
#adm-root #adm-enter { left:50%; top:calc(12px + env(safe-area-inset-top)); transform:translateX(-50%); padding:10px 18px; font-size:15px; white-space:nowrap; background:#c9a227; color:#fff; border-color:#f0d27a #8a6418 #8a6418 #f0d27a; }
#adm-root #adm-enter[hidden], #adm-root #adm-choose[hidden] { display:none; }
#adm-root #adm-choose { left:50%; top:calc(64px + env(safe-area-inset-top)); transform:translateX(-50%); width:min(360px,92vw); font:500 13px/1.4 system-ui,sans-serif; cursor:default; }
#adm-root #adm-choose b.t { display:block; font:800 16px/1.2 ui-serif,Georgia,serif; margin-bottom:4px; color:#8a6418; }
#adm-root #adm-choose .n { opacity:.85; margin-bottom:8px; }
#adm-root #adm-choose button { display:block; width:100%; margin:6px 0 0; padding:10px 12px; text-align:left; font:700 14px/1.25 system-ui,sans-serif; color:#3a2f12; background:#fffaf0; border:2px solid #e2c77a; border-radius:8px; cursor:pointer; }
#adm-root #adm-choose button small { display:block; font:500 11.5px/1.3 system-ui; opacity:.8; }
#adm-root #adm-choose button.go { background:#c9a227; color:#fff; border-color:#8a6418; }
#adm-root #adm-choose button.x { display:inline-block; width:auto; padding:6px 10px; }
.mn-adm-pill { position:fixed; z-index:2147483300; left:50%; bottom:calc(14px + env(safe-area-inset-bottom)); transform:translateX(-50%); display:flex; gap:6px; align-items:center; background:rgba(40,32,14,.92); color:#fff; border:2px solid #c9a227; border-radius:999px; padding:6px 8px 6px 14px; font:700 13px system-ui,sans-serif; box-shadow:0 6px 20px #0007; }
.mn-adm-pill[hidden] { display:none; }
.mn-adm-pill span { max-width:46vw; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.mn-adm-pill button { border:0; border-radius:999px; padding:7px 12px; font:800 13px system-ui; color:#fff; background:#c9a227; cursor:pointer; }
.mn-adm-pill button.w { background:#2f6fd0; }
html.duo-halfopen .mn-adm-pill { bottom:calc(50vh + 10px); }
html.mn-adm-on #minest-mini-pet-p0 { visibility:hidden !important; }
"""
    return '<style id="mn-adm-style">\n' + '\n'.join(out) + extra + '</style>\n'


def markup():
    page = (ADM / 'admont.html').read_text(encoding='utf-8')
    b = page[page.index('<body>') + 6:page.index('<script')]
    b = re.sub(r'\bid="([^"]+)"', r'id="adm-\1"', b)
    return ('<button type="button" id="adm-back" class="adm-x">‹ My World</button><button type="button" id="adm-enter" class="adm-x" hidden></button>'
            '<div id="adm-choose" class="adm-x" hidden></div>' + b.strip())


RUNTIME = r"""<script id="mn-adm-run">
/* 📚 MinestAdmont — the Admont Abbey Library (three.js mesh) inside My World (admont/tools/patch_admont.py)
   open(opts) / close() / isOpen() / world() / bind(hooks) / linked(link) / back(). My World binds: key(), label(), counts(wing),
   books() / setBooks(ids), doll(wing, at), enter(wing, at). The 🏠 button names the wing you stand in (north hall, rotunda,
   south hall) and asks: 剖面 Dollhouse (My World's building: its rooms, Smart Room, then Room → Display → Item) or 🚶 its room. */
(function () {
  if (window.MinestAdmont) return;
  var root = null, started = false, H = null, wing = null, enterBtn = null, choose = null, pendingAt = null, LINK = null, pill = null;
  window.__admOn = false; window.__admEmbed = true; window.__admBase = 'admont/';
  window.__admL = function (t, type, fn, o) { t.addEventListener(type, function (e) { if (window.__admOn) return fn.call(this, e); }, o); };
  window.__admBooks = { load: function () { return H && H.books ? H.books() : []; }, save: function (ids) { if (H && H.setBooks) H.setBooks(ids); } };
  function run(id) { var t = document.getElementById(id), s = document.createElement('script'); s.textContent = t ? t.textContent : ''; document.body.appendChild(s); }
  function world() { if (!window.AdmontWorld) run('mn-adm-world'); if (!window.__admWorld) window.__admWorld = AdmontWorld.create(1776); return window.__admWorld; }
  function esc(x) { return String(x).replace(/[&<>"]/g, function (ch) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]; }); }
  function wingAt(x) { var w = world(); return w.buildings.filter(function (b) { return x >= b.x0 && x <= b.x1; })[0] || w.buildings[1]; }
  function wName(b) { return (H && H.label && H.label(b.id)) || b.name; }
  setInterval(function () {   // the wing you are standing in
    if (!window.__admOn || !enterBtn) return; var sa = window.__admont; if (!sa || !sa.player) return;
    var b = wingAt(sa.player.pos.x); if (b !== wing && choose) choose.hidden = true; wing = b;
    var show = !!(H && sa.S.mode !== 'tour'); enterBtn.hidden = !show || !choose.hidden;
    if (show) { var t = '🏠 ' + wName(b); if (enterBtn.textContent !== t) enterBtn.textContent = t; }
  }, 250);
  function openChooser() {
    var b = wing; if (!b) return; var n = H && H.counts ? H.counts(b.id) : null;
    choose.innerHTML = '<b class="t">📚 ' + esc(wName(b)) + '</b><div class="n">' + (n && n.rooms ? '图书馆 ' + n.rooms + ' 个房间 · 这里 ' + n.displays + ' 个展位 · ' + n.items + ' 件展品' : '第一次进去会把三段大厅建成 3 个房间') + '</div>' +
      '<button class="go" data-a="doll">🏠 剖面 Dollhouse<small>北厅 · 中央穹顶厅 · 南厅 · Smart Room 推荐 · 双击房间布置书架和展品</small></button>' +
      (H && H.enter ? '<button data-a="walk">🚶 走进「' + esc(wName(b)) + '」房间<small>My World 的房间（3D）· 🌳 Outside 回到大厅原处</small></button>' : '') +
      '<button class="x" data-a="x">✕</button>';
    choose.hidden = false; enterBtn.hidden = true;
  }
  function at() { var p = window.__admont.player; return { x: p.pos.x, y: p.pos.y, z: p.pos.z, yaw: p.yaw }; }
  function placeAt() {
    var sa = window.__admont; if (!pendingAt || !sa || !sa.player) return false; var a = pendingAt; pendingAt = null;
    sa.player.pos.set(a.x, a.y, a.z); sa.player.yaw = a.yaw || 0; sa.player.pitch = 0; sa.player.vel && sa.player.vel.set(0, 0, 0); if (sa.setMode) sa.setMode('walk', true); return true;
  }
  function start() {
    root = document.createElement('div'); root.id = 'adm-root'; root.className = 'mn-adm'; root.innerHTML = MARKUP; document.body.appendChild(root); window.__admRoot = root;
    root.querySelector('#adm-back').addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); close(); });
    enterBtn = root.querySelector('#adm-enter'); choose = root.querySelector('#adm-choose');
    enterBtn.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); openChooser(); });
    choose.addEventListener('click', function (e) {
      e.preventDefault(); e.stopPropagation(); var g = e.target.closest('[data-a]'); if (!g || !wing) return; var a = g.getAttribute('data-a'); choose.hidden = true;
      if (a === 'doll' && H && H.doll) H.doll(wing.id, at());
      else if (a === 'walk' && H && H.enter) H.enter(wing.id, at());
    });
    ['pointerdown', 'touchstart', 'wheel', 'click', 'mousedown'].forEach(function (t) { root.addEventListener(t, function (e) { e.stopPropagation(); }, { passive: true }); });
    world(); run('mn-adm-src');
    var tries = 0; (function ready() { var w = window.__admont; if (w && w.S && w.player && document.getElementById('adm-loading').classList.contains('done')) { placeAt(); return; } if (++tries < 400) setTimeout(ready, 150); })();
  }
  function open(opts) {
    if (!window.THREE) { if (window.toast) toast('3D is still loading — try again in a moment'); return; }
    if (!H && window.__admBind) window.__admBind();
    pendingAt = opts && opts.at || null; LINK = null; drawPill();
    window.__admOn = true; document.documentElement.classList.add('mn-adm-on');
    if (!started) { started = true; start(); }
    else { root.hidden = false; placeAt(); if (window.__admResume) { var r = window.__admResume; window.__admResume = null; r(); } window.dispatchEvent(new Event('resize')); }
    if (window.MinestSfx) MinestSfx.play('door');
  }
  function close() {
    if (!root) return; window.__admOn = false; root.hidden = true; document.documentElement.classList.remove('mn-adm-on'); if (enterBtn) enterBtn.hidden = true; if (choose) choose.hidden = true;
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
      pill = document.createElement('div'); pill.className = 'mn-adm-pill'; pill.hidden = true; pill.setAttribute('popover', 'manual');
      pill.innerHTML = '<span></span><button class="w" data-p="walk">🚶 3D</button><button data-p="back">📚 回到大厅</button>';
      pill.addEventListener('click', function (e) {
        var g = e.target.closest('[data-p]'); if (!g) return; e.stopPropagation();
        if (g.getAttribute('data-p') === 'back') return back();
        var host = document.querySelector('.mn-dsp'); if (!host) return; var b = document.createElement('button'); b.type = 'button'; b.hidden = true; b.setAttribute('data-fpv', ''); host.appendChild(b); b.click(); b.remove();
      });
      document.body.appendChild(pill);
    }
    var on = !!LINK && !(root && !root.hidden && window.__admOn) && !document.querySelector('.mn-walk');
    pill.hidden = !on;
    try { if (on) { if (!pill.matches(':popover-open')) pill.showPopover(); } else if (pill.matches(':popover-open')) pill.hidePopover(); } catch (e) {}
    if (on) { var c = []; try { c = MinestWorldFold.crumbs() || []; } catch (e) {} pill.querySelector('span').textContent = '📚 ' + (c.slice(2).join(' › ') || LINK.name); pill.querySelector('[data-p="walk"]').hidden = lvl() < 4; }
  }
  setInterval(function () {
    if (!LINK) { if (pill && !pill.hidden) drawPill(); return; }
    var md = window.MinestDisplay; if (!md || !md.isOpen || !md.isOpen()) { LINK = null; return drawPill(); }
    var L = lvl(); if (L >= 3) LINK.reached = true;
    else if (LINK.reached && !document.querySelector('.mn-walk') && Date.now() - LINK.t > 1500) return back();
    drawPill();
  }, 500);
  window.MinestAdmont = { open: open, close: close, world: world, bind: function (h) { H = h; }, isOpen: function () { return !!(root && !root.hidden && window.__admOn); },
    linked: function (l) { LINK = l ? { bid: l.bid, at: l.at, name: l.name, t: Date.now(), reached: false } : null; drawPill(); }, link: function () { return LINK && { bid: LINK.bid, name: LINK.name }; }, back: back };
  var MARKUP = __MARKUP__;
})();
</script>
"""

MYWORLD = r"""    // 📚 一键阿德蒙特图书馆 (admont/tools/patch_admont.py): the island IS the grounds of Stift Admont with ONE library piece (p.adm),
    // whose three rooms are the three sections of the 3D hall (r.adm = wing id), so displays and things you add stay with that wing
    (function () { if (K.adm_library) return; var base = BUILD.c_church ? 'c_church' : BUILD.c_town ? 'c_town' : null; if (!base) return;
      K.adm_library = { n: '阿德蒙特修道院图书馆 Admont Abbey Library', decor: 1, flat: 0, landmark: 1 }; BUILD.adm_library = BUILD[base]; })();
    var ADM_ROOMS = [['adm_north', 'reading', '北厅 North Hall'], ['adm_rotunda', 'gallery', '中央穹顶厅 Rotunda'], ['adm_south', 'reading', '南厅 South Hall']];
    function admontBuild(seed) {
      if (!window.MinestAdmont) return;
      var d = V.d, PL = 8, NY = 4, land = []; for (var i = 0; i < PL; i++) for (var j = 0; j < NY; j++) land.push(i + ',' + j);
      var old = (d.pc || []).filter(function (p) { return p.adm; })[0];
      d.land = land; d.v = 1; d.ground = 'grass'; d.pc = (d.pc || []).filter(function (p) { return !p.adm && !p.vox && (!p.city || (p.it && p.it.length)); }); refreshLand();
      d.terr = { h: {}, w: {}, scape: 'admont' };
      d.adm = d.adm || { books: [] };
      var p = { id: old ? old.id : uid(), k: K.adm_library ? 'adm_library' : 'vox_door', x: PL * 1.5, y: NY * 1.5, f: 0, s: 1.4, it: old ? old.it || [] : [], city: 1, adm: 'library' };
      p.label = old && old.label || 'Admont Abbey Library'; if (old && old.rooms) { p.rooms = old.rooms; p.roomsInit = 1; }
      d.pc.push(p); if (!fits(p)) { p.s = 1; if (!fits(p)) p.k = 'vox_door'; }
      [['tree', 3, 2], ['tree', PL * 3 - 3, 2], ['tree', 3, NY * 3 - 2], ['tree', PL * 3 - 3, NY * 3 - 2]].forEach(function (t) { if (!K[t[0]]) return; var q = { id: uid(), k: t[0], x: t[1], y: t[2], f: 0, s: 1, it: [], city: 1, adm: 'deco' }; d.pc.push(q); if (!fits(q)) d.pc.pop(); });
      refreshLand();
    }
    window.__admBind = function () { MinestAdmont.bind({
      key: function () { return V && V.bid; },
      lib: function () { var R = islandD(), p = (R.pc || []).filter(function (q) { return q.adm === 'library'; })[0];
        if (!p) { p = { id: uid(), k: 'vox_door', x: 1, y: 1, f: 0, s: 1, it: [], city: 1, adm: 'library', label: 'Admont Abbey Library' }; R.pc.push(p); save(); }
        if (!(p.rooms || []).length) { p.roomsInit = 1; p.rooms = ADM_ROOMS.map(function (a) { return { id: 'r' + uid().slice(1), k: ROOMS[a[1]] ? a[1] : 'hall', n: a[2], adm: a[0] }; }); p.rooms.forEach(function (r) { roomD(r); }); save(); }
        return p; },
      room: function (wing) { var p = this.lib(), r = (p.rooms || []).filter(function (x) { return x.adm === wing; })[0]; return r || p.rooms[0]; },
      label: function (wing) { if (!V) return null; var p = (islandD().pc || []).filter(function (q) { return q.adm === 'library'; })[0], r = p && (p.rooms || []).filter(function (x) { return x.adm === wing; })[0]; return r && r.n; },
      counts: function (wing) { var p = V && (islandD().pc || []).filter(function (q) { return q.adm === 'library'; })[0], rooms = ((p && p.rooms) || []), r = rooms.filter(function (x) { return x.adm === wing; })[0], dp = 0, it = 0;
        ((r && r.d && r.d.pc) || []).forEach(function (q) { var n = (q.it || []).length; if (n) { dp++; it += n; } }); return { rooms: rooms.length, displays: dp, items: it }; },
      books: function () { if (!V) return []; var R = islandD(); return (R.adm && R.adm.books) || []; },
      setBooks: function (ids) { if (!V) return; var R = islandD(); R.adm = R.adm || {}; R.adm.books = ids.slice(); clearTimeout(W.admT); W.admT = setTimeout(save, 600); },
      doll: function (wing, at) {   // 剖面 Dollhouse: My World's building view — the three rooms, Smart Room, then Room → Display → Item
        if (!V) return; var p = this.lib(); MinestAdmont.close(); if (V.at) { if (V.at.room) leaveRoom(); bvClose(); V.d = V.root || V.d; V.root = null; V.at = null; refreshLand(); }
        editOn(); bldOpen(p.id); if (window.MinestSfx) MinestSfx.play('door'); MinestAdmont.linked({ bid: wing, at: at, name: p.label }); toast('📚 ' + p.label + ' · 双击房间进去 · ✨ Smart Room 在控制台');
      },
      enter: function (wing, at) {   // straight into this wing's room (the 🚶 walk); 🌳 Outside comes back to the same spot in the hall
        if (!V) return; var R = islandD(), p = this.lib(), r = this.room(wing);
        roomD(r); save(); MinestAdmont.close(); if (window.MinestSfx) MinestSfx.play('door');
        WKIN = { pc: p.id, back: null, adm: at }; V.root = R; V.at = { pc: p.id, room: r.id }; V.d = r.d; refreshLand(); render(); wkOpen();
      }
    }); };
"""

EDITS = [
    # the one-tap pick: 一键阿德蒙特图书馆, and the way into 3D when the island is the library grounds
    ("['santorini', 'oia', '一键圣托里尼', '伊亚 Oia · 原版 3D 体素世界 · 可进建筑'], ['venice', 'venice', '一键变水城', '威尼斯 · Grand Canal, Rialto, gondolas · 3D']];",
     "['santorini', 'oia', '一键圣托里尼', '伊亚 Oia · 原版 3D 体素世界 · 可进建筑'], ['admont', 'admont', '一键阿德蒙特图书馆', '阿德蒙特修道院图书馆 · 3D 室内 · 白金色 · 可自由行走'], ['venice', 'venice', '一键变水城', '威尼斯 · Grand Canal, Rialto, gondolas · 3D']];"),
    ("      var go3d = (sc === 'santorini' && window.MinestOia ? '<button type=\"button\" class=\"sm\" data-wfoia><i>' + px('oia') + '</i><b>进入 3D 圣托里尼</b></button>' : '') +",
     "      var go3d = (sc === 'santorini' && window.MinestOia ? '<button type=\"button\" class=\"sm\" data-wfoia><i>' + px('oia') + '</i><b>进入 3D 圣托里尼</b></button>' : '') +\n"
     "        (sc === 'admont' && window.MinestAdmont ? '<button type=\"button\" class=\"sm\" data-wfadmont><i>' + px('books') + '</i><b>进入 3D 阿德蒙特图书馆</b></button>' : '') +"),
    ("var scape = mk === 'countryside' || mk === 'alpine' || mk === 'venice' || mk === 'santorini';",
     "var scape = mk === 'countryside' || mk === 'alpine' || mk === 'venice' || mk === 'santorini' || mk === 'admont';"),
    ("if (mk === 'venice') veniceBuild(sd); else if (mk === 'santorini') santoriniBuild(sd); else if (scape) scapeBuild(mk, sd); else megaBuild(mk, sd);",
     "if (mk === 'venice') veniceBuild(sd); else if (mk === 'santorini') santoriniBuild(sd); else if (mk === 'admont') admontBuild(sd); else if (scape) scapeBuild(mk, sd); else megaBuild(mk, sd);"),
    ("mk === 'santorini' ? '🇬🇷 圣托里尼 · Oia' : '🏙 City')", "mk === 'santorini' ? '🇬🇷 圣托里尼 · Oia' : mk === 'admont' ? '📚 阿德蒙特图书馆 · Admont' : '🏙 City')"),
    ("          if (mk === 'santorini' && window.MinestOia) setTimeout(MinestOia.open, 700);",
     "          if (mk === 'santorini' && window.MinestOia) setTimeout(MinestOia.open, 700);\n          if (mk === 'admont' && window.MinestAdmont && v !== 'again') setTimeout(MinestAdmont.open, 700);   // then straight into the 3D library"),
    ("      if (g.hasAttribute('data-wfoia') && window.MinestOia) { hap(); return MinestOia.open(); }",
     "      if (g.hasAttribute('data-wfoia') && window.MinestOia) { hap(); return MinestOia.open(); }\n      if (g.hasAttribute('data-wfadmont') && window.MinestAdmont) { hap(); return MinestAdmont.open(); }   // 📚 the Admont library, in My World"),
    ("  function wkOpen() {\n    if (window.MinestOia && V && V.d && V.d.terr && V.d.terr.scape === 'santorini' && !(V.at && V.at.room)) {",
     "  function wkOpen() {\n    if (window.MinestAdmont && V && V.d && V.d.terr && V.d.terr.scape === 'admont' && !(V.at && V.at.room)) { if (typeof WKVIEW !== 'undefined') WKVIEW = false; document.documentElement.classList.remove('mn-wview'); return MinestAdmont.open(); }   /* 📚 the Admont library */\n"
     "    if (window.MinestOia && V && V.d && V.d.terr && V.d.terr.scape === 'santorini' && !(V.at && V.at.room)) {"),
    ("      function goOut() { if (WKIN && WKIN.vox && window.MinestOia) {",
     "      function goOut() { if (WKIN && WKIN.adm && window.MinestAdmont) { var ax = WKIN.adm; SFX('door'); fadeDo('📚 Admont', function () { V.d = V.root || V.d; V.root = null; V.at = null; refreshLand(); WKIN = null; var w3 = WK; WK = null; if (steps) steps.stop(); w3.stop(); if (el && V) render(); MinestAdmont.open({ at: ax }); }); return; }   /* the Admont library: back to the same spot in the hall */\n"
     "        if (WKIN && WKIN.vox && window.MinestOia) {"),
    ("    // ---------------------------------------------------------------- one-tap landscapes: terrain (world_terrain.js) + pieces",
     MYWORLD + "    // ---------------------------------------------------------------- one-tap landscapes: terrain (world_terrain.js) + pieces"),
]

page = src_page.read_text(encoding='utf-8')
assert 'mn-adm-run' not in page, 'already patched'
s = page
for a, b in EDITS:
    s = must(s, a, b)
srcs = '\n'.join(js(n) for n in ['textures.js', 'frescoes.js', 'scene.js', 'app.js'])
SRCTAG = ('<script type="text/plain" id="mn-adm-world">\n' + js('world.js') + '\n</script>\n'
          '<script type="text/plain" id="mn-adm-src">\n' + srcs + '\n</script>\n')
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
