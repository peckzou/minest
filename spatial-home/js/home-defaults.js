/* Minest · Spatial Home — the default things of every room, set by you (2026-11-22).
   A room's defaults: 'sh:def:<room>' in the synced store (home-store.js) =
     { v: 1, at: <when set>, fn: { <thing id>: { on: 1 | 0, p: [x, y, z], ry } }, extras: [ { uid, kind, title, p, ry } ] }
     · fn      the things that are the apps (typewriter, board, planner …): in the room or not, and where
     · extras  the furniture and fittings (desk, piano, organ …) — templates, any number of each
   Rooms: every Spatial Home environment ('victorian', 'santorini', 'studio', 'church' …) and each room of the Clun house
   ('clun:drawing', 'clun:study' …). A room opens as its defaults say; what you move afterwards is your layout
   ('bp:home:<room>', synced too). When the defaults change (here or on another device), the room is set out by them again
   the next time it is shown: the furniture and the things become the defaults; your works, My World things and display
   machines stay where you put them (they are content, not furniture). No defaults set = the room's own furnishing.
   The editor is one panel for every room. A host gives it the room it shows (Spatial Home's app.js, Clun 2.0's
   v2-objects.js); the other rooms are edited as lists here and set out when they are next opened. */
(function (root) {
  'use strict';
  if (root.SpatialHomeDefaults) return;
  var PFX = 'sh:def:';
  function store() { return root.MinestHomeStore || null; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function clone(v) { return v == null ? null : JSON.parse(JSON.stringify(v)); }
  function r3(n) { return Math.round((+n || 0) * 1000) / 1000; }

  /* the rooms the editor knows even when this page cannot show them */
  var ROOMS2 = [['studio', '音乐工作室 · Studio', 'The Studio'], ['living', '会客室 · 维多利亚客厅', 'The Drawing Room'], ['yard', '前庭 · 花园与草坪', 'The Front Yard'], ['yard-back', '后院 · 泳池与菜园', 'The Back Yard'], ['church', '大教堂 · 巴黎圣母院式', 'The Cathedral']];
  var CLUN = [['drawing', '客厅', 'Drawing Room'], ['hall', '门厅', 'Entrance Hall'], ['dining', '餐厅', 'Dining Room'], ['corridor', '后走廊', 'Rear Hall'], ['wc', '卫生间', 'Cloakroom'], ['snug', '小起居室', 'Snug'],
    ['kitchen', '厨房', 'Kitchen'], ['sun', '阳光房', 'Sun Room'], ['landing', '二楼平台', 'Landing'], ['bed2', '卧室 2', 'Bedroom 2'], ['study', '书房', 'Study'], ['bed1', '卧室 1', 'Bedroom 1'], ['bath', '浴室', 'Bathroom'],
    ['ensuite', '主卫', 'En-suite'], ['atticHall', '阁楼平台', 'Attic Landing'], ['bed4', '卧室 4', 'Bedroom 4'], ['bed3', '卧室 3 · 儿童房', 'Bedroom 3'], ['atticBath', '阁楼浴室', 'Attic Bathroom']];
  /* the things that are the apps, and furniture names for rooms this page cannot build (the page's own catalog comes first) */
  var FN = [['typewriter', '打字机', '⌨️'], ['planner', '日程本', '📘'], ['board', '布告栏', '📌'], ['album', '收藏册', '📔'], ['projector', '全息投影仪', '🔮'], ['ornament', '魔法摆件', '🌀']];
  var KINDS = { 'vic-desk': ['维多利亚书桌', '▣'], 'vic-chair': ['维多利亚书桌椅', '▣'], 'vic-exec-desk': ['总统书桌', '▣'], 'kh-desk': ['书桌', '▭'], 'kh-table': ['巴洛克长桌', '▭'], 'kh-chair': ['高背椅', '♙'],
    'vic-piano': ['三角钢琴', '🎹'], 'church-organ': ['管风琴', '🎶'], 'vic-globe': ['地球仪', '🌐'], 'vic-clock': ['落地钟', '🕰'], 'vic-tufted': ['拉扣沙发', '🛋'], 'vic-thinker': ['思想者雕像', '🗿'], 'vic-armour': ['盔甲', '🛡'],
    'kh-plinth': ['大理石柱台', '🏛'], 'kh-carpet': ['地毯', '▦'], 'kh-girandole': ['烛台', '🕯'], pedestal: ['展示台', '🏛'], wallshelf: ['墙面置物架', '🪵'], vitrine: ['玻璃展柜', '🔲'], 'tea-table': ['茶桌', '☕'], 'tea-chair': ['茶椅', '🪑'] };
  function kindName(k) { var c = (root.SpatialFurnitureCatalog || []).filter(function (x) { return x.id === k; })[0]; return (c && c.name) || (KINDS[k] && KINDS[k][0]) || k; }
  function kindIcon(k) { var c = (root.SpatialFurnitureCatalog || []).filter(function (x) { return x.id === k; })[0]; return (KINDS[k] && KINDS[k][1]) || (c && c.icon) || '▫'; }
  function isContent(e) { return !!(e && (e.ref || /^(neon|thing|machine)$/.test(e.kind))); }

  /* ---------------------------------------------------------------- the records */
  var CACHE = {};
  if (store()) store().onChange(function () { CACHE = {}; });
  function get(room) { if (room in CACHE) return CACHE[room]; var s = store(), v = s ? s.get(PFX + room) : null; v = v && typeof v === 'object' && v.v ? v : null; CACHE[room] = v; return v; }
  function put(room, rec) {
    var s = store(); if (!s) return null;
    var v = rec ? { v: 1, at: Date.now(), fn: rec.fn || {}, extras: (rec.extras || []).map(function (e) { var o = { uid: e.uid || (Date.now() % 1e9 + Math.floor(Math.random() * 1e4)), kind: e.kind, p: e.p ? e.p.map(r3) : null, ry: r3(e.ry) }; if (e.title) o.title = e.title; return o; }) } : null;
    s.set(PFX + room, v); CACHE[room] = v; return v;
  }
  /* the room as it stands now → defaults (furniture and things; content stays out) */
  function capture(L, objects) {
    var fn = {}, ex = [];
    (objects || []).forEach(function (o) {
      var l = L[o.id], g = o.group, st = l ? !!l.stashed : !!o.startStashed;
      fn[o.id] = st ? { on: 0 } : { on: 1, p: [r3(g.position.x), r3(g.position.y), r3(g.position.z)], ry: r3(g.rotation.y) };
    });
    (L.extras || []).forEach(function (e) { if (!isContent(e)) ex.push({ uid: e.uid, kind: e.kind, title: e.title, p: e.p, ry: e.ry || 0 }); });
    return { fn: fn, extras: ex };
  }
  /* a layout set out by the defaults, when they are newer than it (or the room's own furnishing has run again since).
     ctx: { known(kind) the page can build it, spot(kind) where a thing without a place stands, upV the room's furnishing version, movable } */
  function apply(room, L, ctx) {
    var d = get(room); if (!d) return null;
    var upV = ctx && ctx.upV || 0;
    if ((L.defAt || 0) >= d.at && (!upV || L.defUp === upV)) return null;
    var N = clone(L) || {};
    Object.keys(d.fn || {}).forEach(function (id) {
      var r = d.fn[id];
      if (!r || !r.on) N[id] = { stashed: true }; else if (r.p) N[id] = { p: r.p.slice(), ry: r.ry || 0 }; else if (ctx && ctx.spotFn) N[id] = { p: ctx.spotFn(id), ry: 0 }; else delete N[id];
    });
    var keep = (L.extras || []).filter(isContent), mine = [];
    (d.extras || []).forEach(function (e) {
      if (ctx && ctx.known && !ctx.known(e.kind)) return;                 // a kind this page cannot build stays in the defaults, not in the room
      var o = { uid: e.uid, kind: e.kind, p: e.p ? e.p.slice() : (ctx && ctx.spot ? ctx.spot(e.kind) : [0, 0, 0]), ry: e.ry || 0 }; if (e.title) o.title = e.title; mine.push(o);
    });
    N.extras = mine.concat(keep); N.defAt = d.at; N.showroom = 1;
    if (upV) { N.up = upV; N.defUp = upV; }
    if (ctx && ctx.movable) N.furnished = 1;
    return N;
  }

  /* ---------------------------------------------------------------- the editor */
  var CSS = '#shd{position:fixed;z-index:2147483600;right:12px;top:calc(env(safe-area-inset-top,0px) + 56px);width:min(360px,calc(100vw - 24px));max-height:calc(100% - env(safe-area-inset-top,0px) - env(safe-area-inset-bottom,0px) - 140px);overflow:auto;' +
    'background:rgba(253,251,247,.97);color:#2a2622;border:1px solid rgba(60,50,40,.16);border-radius:16px;box-shadow:0 14px 44px rgba(30,20,10,.22);font:13px/1.45 -apple-system,"PingFang SC","Helvetica Neue",sans-serif;padding:12px 14px 14px;-webkit-user-select:none;user-select:none;-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px)}' +
    '#shd[hidden]{display:none}#shd h3{margin:0;font:600 15px/1.3 "Iowan Old Style",Georgia,"Songti SC",serif;flex:1}#shd .hd{display:flex;align-items:center;gap:8px;margin-bottom:8px}' +
    '#shd h4{margin:12px 0 4px;font-size:11px;letter-spacing:.08em;color:#8a8178;font-weight:600}#shd select{width:100%;font:inherit;padding:6px 8px;border-radius:10px;border:1px solid rgba(60,50,40,.2);background:#fff;color:inherit}' +
    '#shd button{font:inherit;color:inherit;background:#fff;border:1px solid rgba(60,50,40,.18);border-radius:10px;padding:5px 10px;cursor:pointer}#shd button.pri{background:#b8553f;border-color:#b8553f;color:#fff}#shd button.x{border:0;background:none;font-size:16px;padding:2px 6px;color:#8a8178}' +
    '#shd ul{list-style:none;margin:0;padding:0}#shd li{display:flex;align-items:center;gap:8px;padding:5px 2px;border-bottom:1px solid rgba(60,50,40,.07)}#shd li label{display:flex;align-items:center;gap:8px;flex:1;min-width:0;cursor:pointer}' +
    '#shd li .nm{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}#shd li small{color:#8a8178;font-variant-numeric:tabular-nums;white-space:nowrap}#shd li input{accent-color:#b8553f;width:16px;height:16px;margin:0}#shd li.off .nm{color:#a59d94;text-decoration:line-through}' +
    '#shd .add{display:flex;gap:6px;margin-top:8px}#shd .add select{flex:1}#shd .btns{display:flex;flex-wrap:wrap;gap:6px;margin-top:12px}#shd .sync{margin:6px 0 0;padding:6px 9px;border-radius:9px;background:rgba(60,50,40,.05);color:#6f675f;font-size:12px}' +
    '#shd .sync.ok::before{content:"☁ ";color:#3c8c5a}#shd .sync.wait::before{content:"⏳ "}#shd .sync.local::before{content:"⌂ "}#shd .note{color:#8a8178;font-size:12px;margin:8px 0 0}#shd .tag{font-size:10.5px;padding:1px 6px;border-radius:8px;background:rgba(184,85,63,.12);color:#b8553f;margin-left:4px;white-space:nowrap}' +
    '@media (prefers-color-scheme: dark){#shd{background:rgba(32,30,28,.96);color:#eee6dc;border-color:rgba(255,255,255,.12)}#shd select,#shd button{background:#2c2926;color:#eee6dc;border-color:rgba(255,255,255,.16)}#shd .sync{background:rgba(255,255,255,.06);color:#c9c0b5}#shd li{border-color:rgba(255,255,255,.07)}}';
  var el = null, H = null, cur = null, away = false;   // away: hidden while a thing is being moved from here
  function fmtP(p) { return p ? '(' + (+p[0]).toFixed(1) + ', ' + (+p[2 - (H && H.zUp ? 1 : 0)]).toFixed(1) + ')' : '自动'; }
  function deg(r) { return Math.round(((+r || 0) * 180 / Math.PI % 360 + 360) % 360) + '°'; }
  function rooms() {
    var out = [], have = {};
    ((H && H.rooms && H.rooms()) || []).forEach(function (r) { have[r.id] = 1; out.push(r); });
    ROOMS2.forEach(function (q) { if (!have[q[0]]) out.push({ id: q[0], name: q[1], group: 'Spatial Home 2.0 房间', remote: 'rooms' }); });
    CLUN.forEach(function (q) { var id = 'clun:' + q[0]; if (!have[id]) out.push({ id: id, name: q[1] + ' · ' + q[2], group: 'Clun 住宅', remote: 'clun' }); });
    return out;
  }
  function roomOf(id) { return rooms().filter(function (r) { return r.id === id; })[0] || { id: id, name: id }; }
  function catalog() {
    var seen = {}, out = [];
    ((H && H.catalog && H.catalog()) || []).forEach(function (c) { if (!seen[c.kind]) { seen[c.kind] = 1; out.push(c); } });
    Object.keys(KINDS).forEach(function (k) { if (!seen[k]) { seen[k] = 1; out.push({ kind: k, name: KINDS[k][0], icon: KINDS[k][1], away: !(H && H.known && H.known(k)) }); } });
    return out;
  }
  function fnList(live) { return live && H.fnObjects ? H.fnObjects() : FN.map(function (q) { return { id: q[0], name: q[1], icon: q[2] }; }); }
  function syncLine() {
    var s = store(); if (!s) return '<p class="sync local">这个页面没有接上同步存储</p>';
    var t = s.status(), cls = !t.online || t.pending ? 'wait' : (t.user ? 'ok' : 'local');
    return '<p class="sync ' + cls + '">' + esc(t.text) + '</p>';
  }
  function render() {
    if (!el || el.hidden) return;
    var id = cur || (H && H.current && H.current()) || 'victorian', live = !!(H && H.current && H.current() === id && H.live), R = roomOf(id), d = get(id);
    var groups = {}, order = [];
    rooms().forEach(function (r) { var g = r.group || '这个页面的房间'; if (!groups[g]) { groups[g] = []; order.push(g); } groups[g].push(r); });
    var sel = '<select data-a="room">' + order.map(function (g) { return '<optgroup label="' + esc(g) + '">' + groups[g].map(function (r) { return '<option value="' + esc(r.id) + '"' + (r.id === id ? ' selected' : '') + '>' + esc(r.name) + (get(r.id) ? ' ✓' : '') + '</option>'; }).join('') + '</optgroup>'; }).join('') + '</select>';
    var h = '<div class="hd"><h3>每个房间的默认物件</h3><button class="x" data-a="close" title="关闭">✕</button></div>' + sel + syncLine();
    var fn, ex;
    if (live) { var now = H.live.state(); fn = now.fn; ex = now.extras; }
    else { fn = (d && d.fn) || {}; ex = (d && d.extras) || []; }
    h += '<h4>功能物件</h4><ul>' + fnList(live).map(function (o) {
      var r = fn[o.id], on = r ? !!r.on : !o.startStashed;
      return '<li class="' + (on ? '' : 'off') + '"><label><input type="checkbox" data-a="fn" data-id="' + esc(o.id) + '"' + (on ? ' checked' : '') + '><span class="nm">' + (o.icon || '') + ' ' + esc(o.name) + '</span></label><small>' + (on && r && r.p ? fmtP(r.p) + ' ' + deg(r.ry) : '') + '</small>' +
        (live && on ? '<button data-a="movefn" data-id="' + esc(o.id) + '" title="在房间里挪">挪</button>' : '') + '</li>';
    }).join('') + '</ul>';
    h += '<h4>家具与摆设</h4>' + (ex.length ? '<ul>' + ex.map(function (e) {
      return '<li><span class="nm" style="flex:1">' + kindIcon(e.kind) + ' ' + esc(e.title || kindName(e.kind)) + (H && H.known && !H.known(e.kind) ? '<span class="tag">在别的页面显示</span>' : '') + '</span><small>' + fmtP(e.p) + ' ' + deg(e.ry) + '</small>' +
        (live ? '<button data-a="movex" data-uid="' + e.uid + '" title="在房间里挪">挪</button>' : '') + '<button class="x" data-a="delx" data-uid="' + e.uid + '" title="从默认里去掉">✕</button></li>';
    }).join('') + '</ul>' : '<p class="note">' + (d || live ? '没有家具。' : '还没有设过：这个房间用它原来的摆设。') + '</p>');
    var cat = catalog().filter(function (c) { return live ? !c.away : true; });
    h += '<div class="add"><select data-a="kind">' + cat.map(function (c) { return '<option value="' + esc(c.kind) + '">' + (c.icon || '') + ' ' + esc(c.name) + '</option>'; }).join('') + '</select><button data-a="add">＋ 添加</button></div>';
    h += '<div class="btns">' + (live ? '<button class="pri" data-a="save">把现在的摆放存为默认</button>' : '') + (d ? '<button data-a="apply">按默认重新摆放</button><button data-a="reset">恢复出厂默认</button>' : '') +
      (!live && R.remote === 'clun' && H && H.openClun ? '<button data-a="go">去 Clun 里摆</button>' : '') + (!live && R.remote === 'rooms' && H && H.openRooms ? '<button data-a="go">打开这个房间</button>' : '') + '</div>';
    h += '<p class="note">' + (live ? '勾选、添加、去掉会马上存为这个房间的默认。在房间里挪动位置后，点「把现在的摆放存为默认」。' : '这里改的是默认清单；位置留空的会摆在房间中间，打开那个房间后可以挪好再存。') + ' 默认和你挪过的位置都跟着账号同步，在 Duo、iPhone、iPad 和网页上都一样。</p>';
    el.innerHTML = h;
  }
  /* the room shown: change it there and keep the result as the defaults */
  function saveLive(silent) { var id = H.current(); var v = put(id, H.live.state()); if (H.live.stamp) H.live.stamp(v); if (!silent && H.toast) H.toast('已存为「' + roomOf(id).name + '」的默认'); render(); }
  function editList(id, fn) { var d = get(id) || { fn: {}, extras: [] }; d = clone(d); d.fn = d.fn || {}; d.extras = d.extras || []; fn(d); put(id, d); render(); }
  function onClick(e) {
    var b = e.target.closest('[data-a]'); if (!b || b.tagName === 'SELECT' || b.tagName === 'INPUT') return;
    var a = b.getAttribute('data-a'), id = cur || H.current(), live = H.current() === id && H.live;
    if (a === 'close') { close(); return; }
    if (a === 'save') { saveLive(); return; }
    if (a === 'movefn' && live) { away = true; el.hidden = true; H.live.move({ fn: b.getAttribute('data-id') }); return; }
    if (a === 'movex' && live) { away = true; el.hidden = true; H.live.move({ uid: +b.getAttribute('data-uid') }); return; }
    if (a === 'delx') { var uid = +b.getAttribute('data-uid'); if (live) { H.live.removeExtra(uid); saveLive(true); } else editList(id, function (d) { d.extras = d.extras.filter(function (x) { return x.uid !== uid; }); }); return; }
    if (a === 'add') {
      var k = el.querySelector('[data-a="kind"]').value; if (!k) return;
      if (live) { away = true; el.hidden = true; H.live.addExtra(k, kindName(k)); return; }
      editList(id, function (d) { d.extras.push({ kind: k, title: kindName(k), p: null, ry: 0 }); }); return;
    }
    if (a === 'apply') { if (live) H.live.reapply(); else if (H.toast) H.toast('下次打开这个房间时按默认摆放'); render(); return; }
    if (a === 'reset') { var nm = roomOf(id).name; if (!root.confirm('「' + nm + '」恢复出厂默认？\n你设的默认清单会去掉，房间回到它原来的摆设（你的作品和 My World 物品会回到背包）。')) return; put(id, null); if (live) H.live.restore(); render(); return; }
    if (a === 'go') { var R = roomOf(id); close(); if (R.remote === 'clun') H.openClun(id.slice(5)); else H.openRooms(id); }
  }
  function onChange(e) {
    var t = e.target, a = t.getAttribute('data-a'), id = cur || H.current(), live = H.current() === id && H.live;
    if (a === 'room') { cur = t.value; var r = roomOf(cur); if (H.go && !r.remote && cur !== H.current()) H.go(cur); render(); return; }
    if (a === 'fn') {
      var fid = t.getAttribute('data-id'), on = t.checked;
      if (live) { H.live.setFn(fid, on); saveLive(true); }
      else editList(id, function (d) { var r = d.fn[fid] || {}; r.on = on ? 1 : 0; d.fn[fid] = r; });
    }
  }
  function open(host, room) {
    H = host || H;
    if (!el) {
      if (!document.getElementById('shd-css')) { var s = document.createElement('style'); s.id = 'shd-css'; s.textContent = CSS; document.head.appendChild(s); }
      el = document.createElement('div'); el.id = 'shd'; el.hidden = true; (H.mount || document.body).appendChild(el);
      el.addEventListener('click', onClick); el.addEventListener('change', onChange);
      ['pointerdown', 'pointermove', 'pointerup', 'touchstart', 'touchmove', 'wheel', 'keydown'].forEach(function (t) { el.addEventListener(t, function (e) { e.stopPropagation(); }, { passive: true }); });
      if (store()) store().onChange(function () { if (el && !el.hidden && !el.contains(document.activeElement)) render(); });
      setInterval(function () { if (el && !el.hidden && !el.contains(document.activeElement)) { var p = el.querySelector('.sync'), s = store(); if (p && s) p.textContent = s.status().text; } }, 3000);
    }
    cur = room || (H.current && H.current()) || null; el.hidden = false; render();
  }
  function close() { if (el) el.hidden = true; if (H && H.onClose) H.onClose(); }

  root.SpatialHomeDefaults = {
    version: '1.0', get: get, put: put, capture: capture, apply: apply, isContent: isContent, kindName: kindName, rooms: rooms, CLUN: CLUN,
    time: function (room) { var d = get(room); return d ? d.at : 0; },
    open: open, close: close, isOpen: function () { return !!(el && !el.hidden); }, refresh: render,
    /* the host's room changed under the editor (a thing was moved, the room was switched): show it again */
    edited: function (how) {
      if (away) { away = false; if (el) el.hidden = false; if (how === 'ok' || how === 'stash') saveLive(true); }   // a move begun here ends: kept as the defaults
      if (el && !el.hidden) render();
    }
  };
})(window);
