"""📚 The Study (英式古典私人藏书室) inside My World - builds a NEW page (default iPhoneDuo69.html) from iPhoneDuo68.html.
The source page is only read. Santorini, Alpine, Admont, Trinity and every display / room feature stay exactly as they are:
this script only inserts, next to them, the same three things the Trinity integration has (trinity/tools/patch_trinity.py):
  1. the engine sources (study-world/*.js) as inert text, run on the first open, ids prefixed 'st-', CSS scoped to #st-root;
  2. the runtime MinestStudy: open / close / isOpen / world / bind / linked / back;
  3. in My World: 「一键英式藏书室」 among the one-tap islands - the island becomes a small garden with ONE house (p.st = 'house')
     whose room is the study (r.st = 'study'). The books on the 3D shelves ARE the things in that room's displays (card refs
     'listId/cardId', read live from the board, nothing copied): add them with My World's own tools (Smart Display, drag from
     the Box) or with 「＋ 放一本书」 in 3D, which lists the board's cards. 🚶 Walk in on the island or in the study room opens
     the 3D study; a book's 「打开原卡片」 opens the card in My World; 🏠 opens the house's Dollhouse.
usage: python3 tools/patch_study.py path/to/iPhoneDuo68.html path/to/iPhoneDuo69.html"""
import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ST = HERE.parent                       # study/ (study.html, study-world/)
SRC = ST / 'study-world'
src_page = Path(sys.argv[1])
out_page = Path(sys.argv[2])


def must(s, a, b, n=1):
    assert s.count(a) == n, (a[:90], s.count(a))
    return s.replace(a, b)


def js(name):
    s = (SRC / name).read_text(encoding='utf-8')
    s = s.replace('document.getElementById(id)', "document.getElementById('st-' + id)")
    s = s.replace('document.body.classList', 'window.__stRoot.classList')
    s = s.replace('window.addEventListener(', '__stL(window, ').replace('document.addEventListener(', '__stL(document, ')
    s = s.replace('new URLSearchParams(location.search)', "new URLSearchParams('')")
    if name == 'app.js':
        s = must(s, '  function frame(now) {\n    requestAnimationFrame(frame);',
                 '  function frame(now) {\n    if (!window.__stOn) { window.__stResume = function () { last = performance.now(); requestAnimationFrame(frame); }; return; }   // closed: paused\n    requestAnimationFrame(frame);')
    assert '</script' not in s.lower(), name
    return s


def css():
    page = (ST / 'study.html').read_text(encoding='utf-8')
    body = page[page.index('<style>') + 7:page.index('</style>')]
    body = re.sub(r'/\*.*?\*/', '', body, flags=re.S)
    out = []
    for m in re.finditer(r'([^{}]+)\{([^{}]*)\}', body):
        new = []
        for sel in m.group(1).strip().split(','):
            sel = sel.strip()
            if sel in (':root', 'html', 'body'):
                new.append('#st-root'); continue
            if sel == '*':
                new += ['#st-root', '#st-root *']; continue
            sel = re.sub(r'#([A-Za-z][\w-]*)', r'#st-\1', sel)
            if sel.startswith('body.touch'):
                new.append('#st-root.touch' + sel[len('body.touch'):]); continue
            new.append('#st-root ' + sel)
        out.append(', '.join(dict.fromkeys(new)) + ' {' + m.group(2) + '}')
    extra = """
#st-root { position:fixed; inset:0; z-index:2147483550; }
#st-root[hidden] { display:none; }
#st-root #st-gl, #st-root #st-loading, #st-root #st-hud { position:absolute; }
#st-root .st-x { position:absolute; z-index:60; pointer-events:auto; cursor:pointer; color:#f2e6c9; font:700 14px/1.2 ui-serif,Georgia,serif; background:rgba(36,22,13,.9); border:2px solid #c9a24a; border-radius:8px; box-shadow:0 2px 10px rgba(0,0,0,.4); padding:8px 12px; }
#st-root #st-back { left:calc(12px + env(safe-area-inset-left)); top:calc(10px + env(safe-area-inset-top)); }
#st-root #st-doll { left:calc(140px + env(safe-area-inset-left)); top:calc(10px + env(safe-area-inset-top)); }
#st-root #st-title { left:calc(14px + env(safe-area-inset-left)); top:calc(58px + env(safe-area-inset-top)); }
.mn-st-pill { position:fixed; z-index:2147483300; left:50%; bottom:calc(14px + env(safe-area-inset-bottom)); transform:translateX(-50%); display:flex; gap:6px; align-items:center; background:rgba(36,22,13,.94); color:#f2e6c9; border:2px solid #c9a24a; border-radius:999px; padding:6px 8px 6px 14px; font:700 13px system-ui,sans-serif; box-shadow:0 6px 20px #0007; }
.mn-st-pill[hidden] { display:none; }
.mn-st-pill span { max-width:46vw; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.mn-st-pill button { border:0; border-radius:999px; padding:7px 12px; font:800 13px system-ui; color:#2a1a10; background:#c9a24a; cursor:pointer; }
html.duo-halfopen .mn-st-pill { bottom:calc(50vh + 10px); }
html.mn-st-on #minest-mini-pet-p0 { visibility:hidden !important; }
html.mn-st-on #vx62-btn { display:none !important; }
"""
    return '<style id="mn-st-style">\n' + '\n'.join(out) + extra + '</style>\n'


def markup():
    page = (ST / 'study.html').read_text(encoding='utf-8')
    b = page[page.index('<body>') + 6:page.index('<script')]
    b = re.sub(r'\bid="([^"]+)"', r'id="st-\1"', b)
    return ('<button type="button" id="st-back" class="st-x">‹ My World</button><button type="button" id="st-doll" class="st-x">🏠 剖面 Dollhouse</button>' + b.strip())


RUNTIME = r"""<script id="mn-st-run">
/* 📚 MinestStudy - the English private library (three.js mesh) inside My World (study/tools/patch_study.py)
   open(opts) / close() / isOpen() / world() / bind(hooks) / linked(link) / back(). My World binds: key(), books(), choices(),
   add(ref), open(ref), doll(). The books on the shelves are the things in the study room's displays. */
(function () {
  if (window.MinestStudy) return;
  var root = null, started = false, H = null, LINK = null, pill = null, spot = null;
  window.__stOn = false; window.__stEmbed = true;
  window.__stL = function (t, type, fn, o) { t.addEventListener(type, function (e) { if (window.__stOn) return fn.call(this, e); }, o); };
  window.__stBooks = {
    load: function () { return H && H.books ? H.books() : []; },
    save: function () { /* the shelves are My World's displays: nothing to save here */ },
    choices: function () { return H && H.choices ? H.choices() : []; },
    add: function (ref) { if (H && H.add) H.add(ref); }
  };
  window.__stBook = function (ev) { if (ev && ev.action === 'open' && ev.meta && ev.meta.ref && H && H.open) { spot = at(); H.open(ev.meta.ref, spot); } };
  function run(id) { var t = document.getElementById(id), s = document.createElement('script'); s.textContent = t ? t.textContent : ''; document.body.appendChild(s); }
  function world() { if (!window.StudyWorld) run('mn-st-world'); if (!window.__stWorld) window.__stWorld = StudyWorld.create(); return window.__stWorld; }
  function at() { var s = window.__study; if (!s) return null; var p = s.player; return { x: p.pos.x, y: 0, z: p.pos.z, yaw: p.yaw }; }
  function placeAt(a) { var s = window.__study; if (!a || !s || !s.player) return; s.player.pos.set(a.x, 0, a.z); s.player.yaw = a.yaw || 0; s.player.pitch = 0; s.player.vel.set(0, 0, 0); s.setMode('walk', true); }
  function start(a) {
    root = document.createElement('div'); root.id = 'st-root'; root.className = 'mn-st'; root.innerHTML = MARKUP; document.body.appendChild(root); window.__stRoot = root;
    root.querySelector('#st-back').addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); close(); });
    root.querySelector('#st-doll').addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); if (H && H.doll) { spot = at(); H.doll(spot); } });
    ['pointerdown', 'touchstart', 'wheel', 'click', 'mousedown'].forEach(function (t) { root.addEventListener(t, function (e) { e.stopPropagation(); }, { passive: true }); });
    world(); run('mn-st-src');
    var tries = 0; (function ready() { var w = window.__study; if (w && w.S && w.player && document.getElementById('st-loading').classList.contains('done')) { if (a) placeAt(a); else w.setMode('walk'); return; } if (++tries < 400) setTimeout(ready, 150); })();
  }
  function open(opts) {
    if (!window.THREE) { if (window.toast) toast('3D is still loading — try again in a moment'); return; }
    if (!H && window.__stBind) window.__stBind();
    var a = opts && opts.at || null; LINK = null; drawPill();
    window.__stOn = true; document.documentElement.classList.add('mn-st-on');
    if (!started) { started = true; start(a); }
    else { root.hidden = false; var s = window.__study; if (s && s.reload) s.reload(); if (a) placeAt(a); if (window.__stResume) { var r = window.__stResume; window.__stResume = null; r(); } window.dispatchEvent(new Event('resize')); }
    if (window.MinestSfx) MinestSfx.play('door');
  }
  function close() {
    if (!root) return; window.__stOn = false; root.hidden = true; document.documentElement.classList.remove('mn-st-on');
    try { if (document.pointerLockElement) document.exitPointerLock(); } catch (e) {}
  }
  function lvl() { try { return (window.MinestWorldFold && MinestWorldFold.level()) || 0; } catch (e) { return 0; } }
  function back() {
    var L = LINK; LINK = null; drawPill(); if (!L) return;
    var x = document.querySelector('.mn-walk [data-wkx]'); if (x) { try { x.click(); } catch (e) {} }
    setTimeout(function () { try { MinestWorldFold.go(1); } catch (e) {} open({ at: L.at }); }, x ? 500 : 60);
  }
  function drawPill() {
    if (!pill) {
      pill = document.createElement('div'); pill.className = 'mn-st-pill'; pill.hidden = true; pill.setAttribute('popover', 'manual');
      pill.innerHTML = '<span></span><button data-p="back">📚 回到藏书室</button>';
      pill.addEventListener('click', function (e) { var g = e.target.closest('[data-p]'); if (!g) return; e.stopPropagation(); back(); });
      document.body.appendChild(pill);
    }
    var on = !!LINK && !(root && !root.hidden && window.__stOn) && !document.querySelector('.mn-walk');
    pill.hidden = !on;
    try { if (on) { if (!pill.matches(':popover-open')) pill.showPopover(); } else if (pill.matches(':popover-open')) pill.hidePopover(); } catch (e) {}
    if (on) { var c = []; try { c = MinestWorldFold.crumbs() || []; } catch (e) {} pill.querySelector('span').textContent = '📚 ' + (c.slice(2).join(' › ') || LINK.name); }
  }
  setInterval(function () {
    if (!LINK) { if (pill && !pill.hidden) drawPill(); return; }
    var md = window.MinestDisplay; if (!md || !md.isOpen || !md.isOpen()) { LINK = null; return drawPill(); }
    var L = lvl(); if (L >= 3) LINK.reached = true;
    else if (LINK.reached && !document.querySelector('.mn-walk') && Date.now() - LINK.t > 1500) return back();
    drawPill();
  }, 500);
  window.MinestStudy = { open: open, close: close, world: world, bind: function (h) { H = h; }, isOpen: function () { return !!(root && !root.hidden && window.__stOn); },
    linked: function (l) { LINK = l ? { at: l.at, name: l.name, t: Date.now(), reached: false } : null; drawPill(); }, link: function () { return LINK && { name: LINK.name }; }, back: back };
  var MARKUP = __MARKUP__;
})();
</script>
"""

MYWORLD = r"""    // 📚 一键英式藏书室 (study/tools/patch_study.py): the island is a small garden with ONE house (p.st = 'house'); its room
    // r.st = 'study' is the 3D private library. The books on its shelves are the things in that room's displays.
    (function () { if (K.st_house) return; var base = ['h_victorian', 'h_manor', 'h_family', 'h_town', 'c_town', 'c_church'].filter(function (k) { return BUILD[k]; })[0]; if (!base) return;
      K.st_house = { n: '英式私人藏书室 The Study', decor: 1, flat: 0, landmark: 1 }; BUILD.st_house = BUILD[base]; })();
    var ST_SHELF = function () { return ['xbooks', 'books', 'bookshelf', 'shelf'].filter(function (k) { return K[k] && BUILD[k]; })[0]; };
    function studyBuild(seed) {
      if (!window.MinestStudy) return;
      var d = V.d, PL = 4, NY = 4, land = []; for (var i = 0; i < PL; i++) for (var j = 0; j < NY; j++) land.push(i + ',' + j);
      var old = (d.pc || []).filter(function (p) { return p.st === 'house'; })[0];
      d.land = land; d.v = 1; d.ground = 'grass'; d.pc = (d.pc || []).filter(function (p) { return !p.st && !p.tr && !p.vox && !p.alp && (!p.city || (p.it && p.it.length)); }); refreshLand();
      d.terr = { h: {}, w: {}, scape: 'study' };
      var p = { id: old ? old.id : uid(), k: K.st_house ? 'st_house' : 'vox_door', x: PL * 1.5, y: NY * 1.5, f: 0, s: 1.2, it: old ? old.it || [] : [], city: 1, st: 'house' };
      p.label = old && old.label || 'The Study'; if (old && old.rooms) { p.rooms = old.rooms; p.roomsInit = 1; }
      d.pc.push(p); if (!fits(p)) { p.s = 1; if (!fits(p)) p.k = 'vox_door'; }
      [['tree', 2, 2], ['tree', PL * 3 - 2, 2], ['tree', 2, NY * 3 - 2], ['tree', PL * 3 - 2, NY * 3 - 2]].forEach(function (t) { if (!K[t[0]]) return; var q = { id: uid(), k: t[0], x: t[1], y: t[2], f: 0, s: 1, it: [], city: 1, st: 'deco' }; d.pc.push(q); if (!fits(q)) d.pc.pop(); });
      refreshLand();
    }
    window.__stInRoom = function () {   // you are in the study room (its 🚶 Walk in opens the 3D study)
      if (!V || !V.at || !V.at.room) return false; var R = V.root || V.d, b = (R.pc || []).filter(function (q) { return q.id === V.at.pc; })[0], r = b && (b.rooms || []).filter(function (x) { return x.id === V.at.room; })[0]; return !!(r && r.st === 'study'); };
    window.__stBind = function () { MinestStudy.bind({
      key: function () { return V && V.bid; },
      house: function () { var R = islandD(), p = (R.pc || []).filter(function (q) { return q.st === 'house'; })[0];
        if (!p) { p = { id: uid(), k: 'vox_door', x: 1, y: 1, f: 0, s: 1, it: [], city: 1, st: 'house', label: 'The Study' }; R.pc.push(p); save(); }
        if (!(p.rooms || []).some(function (r) { return r.st === 'study'; })) { p.roomsInit = 1; p.rooms = p.rooms || []; var r = { id: 'r' + uid().slice(1), k: ROOMS.reading ? 'reading' : 'hall', n: '私人藏书室 The Study', st: 'study' }; p.rooms.unshift(r); roomD(r); save(); }
        return p; },
      room: function () { var p = this.house(); return p.rooms.filter(function (r) { return r.st === 'study'; })[0]; },
      shelf: function (make) {   // the bookcase 「＋ 放一本书」 fills: the room's own bookshelf first, then a new bookcase where one fits
        var r = this.room(); roomD(r); var d = r.d, KS = ['xbooks', 'books', 'bookshelf', 'shelf'], cap = function (q) { try { return capOf(q); } catch (e) { return 12; } };
        var place = function (q) { var ok = false; withD(d, function () { ok = freeSpot(q, 1) || freeSpot(q); }); return ok; };
        (d.pc || []).forEach(function (q) { if (q.st === 'shelf' && !(isFinite(q.x) && isFinite(q.y))) { if (!place(q)) { q.x = 1.5; q.y = 1.5; } save(); } });   // repair an unplaced one
        var q = (d.pc || []).filter(function (x) { return x.st === 'shelf' && (x.it || []).length < cap(x); })[0];
        if (!q) { q = (d.pc || []).filter(function (x) { return !x.st && KS.indexOf(x.k) >= 0 && (x.it || []).length < cap(x); })[0]; if (q) q.st = 'shelf'; }
        if (!q && make) { var k = ST_SHELF(); if (!k) return null; q = { id: uid(), k: k, x: 0, y: 0, f: 0, s: 1, it: [], label: '', st: 'shelf' }; if (!place(q)) return null; d.pc.push(q); }
        return q; },
      books: function () {   // every thing in the study room's displays, as a book: its title, its list as the author line, its text as the excerpt
        if (!V) return []; try { index(); } catch (e) {} var r = this.room(), seen = {}, out = [];
        ((r.d && r.d.pc) || []).forEach(function (q) { (q.it || []).forEach(function (ref) { if (seen[ref]) return; var t = thing(ref); if (!t) return; seen[ref] = 1; var s = t.s;
          out.push({ id: ref, ref: ref, title: s.titleZh && s.title && s.titleZh !== s.title ? s.title + ' · ' + s.titleZh : (s.title || s.titleZh || '?'), author: (t.k && t.k.title) || '', text: s.desc || s.meaning || s.notes || s.description || '', display: q.id }); }); });
        return out; },
      choices: function () { if (!V) return []; try { index(); } catch (e) {} var have = {}, out = []; this.books().forEach(function (b) { have[b.ref] = 1; });
        Object.keys(IX).forEach(function (ref) { if (have[ref] || /^v\//.test(ref)) return; var t = IX[ref]; out.push({ ref: ref, title: t.s.title || t.s.titleZh || '?', list: (t.k && t.k.title) || '' }); }); return out; },
      add: function (ref) { if (!V || !ref) return; var q = this.shelf(true); if (!q) return; if ((q.it || []).indexOf(ref) < 0) (q.it = q.it || []).push(ref); save(); },
      open: function (ref, at) {   // 打开原卡片: My World's own display view of that thing, in the study room; the pill brings you back
        if (!V) return; var p = this.house(), r = this.room(), q = ((r.d && r.d.pc) || []).filter(function (x) { return (x.it || []).indexOf(ref) >= 0; })[0];
        MinestStudy.close(); editOn(); enterRoom(p.id, r.id); MinestStudy.linked({ at: at, name: p.label }); if (q) setTimeout(function () { openPiece(q.id, ref); }, 120);
      },
      doll: function (at) {   // 剖面 Dollhouse: the house's rooms, Smart Room, then Room -> Display -> Item
        if (!V) return; var p = this.house(); MinestStudy.close(); if (V.at) { if (V.at.room) leaveRoom(); bvClose(); V.d = V.root || V.d; V.root = null; V.at = null; refreshLand(); }
        editOn(); bldOpen(p.id); if (window.MinestSfx) MinestSfx.play('door'); MinestStudy.linked({ at: at, name: p.label }); toast('📚 ' + p.label + ' · 双击「私人藏书室」进去 · ✨ Smart Display 在控制台');
      },
    }); };
"""

EDITS = [
    ("['venice', 'venice', '一键变水城', '威尼斯 · Grand Canal, Rialto, gondolas · 3D']];",
     "['study', 'books', '一键英式藏书室', '英式古典私人藏书室 · 深色书架 · 书桌 · 滑动木梯 · 能坐下读书'], ['venice', 'venice', '一键变水城', '威尼斯 · Grand Canal, Rialto, gondolas · 3D']];"),
    ("        (sc === 'trinity' && window.MinestTrinity ? '<button type=\"button\" class=\"sm\" data-wftrinity><i>' +",
     "        (sc === 'study' && window.MinestStudy ? '<button type=\"button\" class=\"sm\" data-wfstudy><i>' + px('books') + '</i><b>进入 3D 藏书室</b></button>' : '') +\n"
     "        (sc === 'trinity' && window.MinestTrinity ? '<button type=\"button\" class=\"sm\" data-wftrinity><i>' +"),
    (" || mk === 'trinity';", " || mk === 'trinity' || mk === 'study';"),
    ("else if (mk === 'trinity') trinityBuild(sd); else if (scape)", "else if (mk === 'trinity') trinityBuild(sd); else if (mk === 'study') studyBuild(sd); else if (scape)"),
    ("mk === 'trinity' ? '🎓 三一学院 · Trinity' : '🏙 City')", "mk === 'trinity' ? '🎓 三一学院 · Trinity' : mk === 'study' ? '📚 英式藏书室 · The Study' : '🏙 City')"),
    ("          if (mk === 'santorini' && window.MinestOia) setTimeout(MinestOia.open, 700);",
     "          if (mk === 'santorini' && window.MinestOia) setTimeout(MinestOia.open, 700);\n          if (mk === 'study' && window.MinestStudy && v !== 'again') setTimeout(MinestStudy.open, 700);   // then straight into the 3D study"),
    ("      if (g.hasAttribute('data-wfoia') && window.MinestOia) { hap(); return MinestOia.open(); }",
     "      if (g.hasAttribute('data-wfoia') && window.MinestOia) { hap(); return MinestOia.open(); }\n      if (g.hasAttribute('data-wfstudy') && window.MinestStudy) { hap(); return MinestStudy.open(); }   // 📚 the study, in My World"),
    ("  function wkOpen() {\n",
     "  function wkOpen() {\n    if (window.MinestStudy && V && V.d && ((V.d.terr && V.d.terr.scape === 'study' && !(V.at && V.at.room)) || (window.__stInRoom && window.__stInRoom()))) { if (typeof WKVIEW !== 'undefined') WKVIEW = false; document.documentElement.classList.remove('mn-wview'); return MinestStudy.open(); }   /* 📚 the private library */\n"),
    ("    // ---------------------------------------------------------------- one-tap landscapes: terrain (world_terrain.js) + pieces",
     MYWORLD + "    // ---------------------------------------------------------------- one-tap landscapes: terrain (world_terrain.js) + pieces"),
]

page = src_page.read_text(encoding='utf-8')
assert 'mn-st-run' not in page, 'already patched'
s = page
for a, b in EDITS:
    s = must(s, a, b)
srcs = '\n'.join(js(n) for n in ['textures.js', 'scene.js', 'app.js'])
SRCTAG = ('<script type="text/plain" id="mn-st-world">\n' + js('world.js') + '\n</script>\n'
          '<script type="text/plain" id="mn-st-src">\n' + srcs + '\n</script>\n')
RUN = RUNTIME.replace('__MARKUP__', json.dumps(markup()).replace('</', '<\\/'))
s = s.replace('</head>', css() + '</head>', 1)
i = s.rindex('</body>')
s = s[:i] + SRCTAG + RUN + s[i:]
out_page.write_text(s, encoding='utf-8')
# only insertions: every other world's runtime is still there exactly once
for mark in ['mn-oia-run', 'mn-alp-run', 'mn-adm-run', 'mn-tr-run']:
    assert s.count(mark) == page.count(mark), mark
assert s.count('function santoriniBuild') == 1 and len(s) > len(page)
print(out_page.name, len(s.encode('utf-8')), 'bytes')
