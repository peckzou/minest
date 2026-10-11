/* Minest Knowledge · Phase 1 — Contents (an interactive table of contents for knowledge Kanbans)
   One knowledge base, no copies: the tree is read live from the boards (window.MinestAI.boards()).
     Board → Subject · List → Chapter · Card → Section / Lesson · stacked card → Knowledge item
   A card can be marked as a section heading (long-press it here): the cards after it, up to the next heading,
   sit under it. Nothing is guessed from titles.
   Data outside the boards (so the boards' loaders, which keep only the fields they know, never drop it):
     - minest.knowledge.v1 (synced, merged per key by time): { h: {cardId: {on, t}}, off: {boardId: {on, t}} }
       — section headings, and the boards left out of Contents (e.g. a pure word list). It rides in the cloud doc as
       `knowledge` (written with merge, like `learning`; old clients leave it alone).
     - minest.contents.v1 (this device only): open rows, scroll position, the selected row.
   Jumps: board → list → card / stacked card, centred and lit; a ‹ Contents pill brings the contents back as they were.
   Same file on the iPhone, the iPad and Web 31 (tools/mobile/live_mobile.py, tools/web31/build.py). */
(function () {
  if (window.MinestContents) return;

  // ================================================================== knowledge metadata (synced)
  var KN_KEY = 'minest.knowledge.v1';
  var K = (function () { try { var v = JSON.parse(localStorage.getItem(KN_KEY) || 'null'); if (v && typeof v === 'object') return { h: v.h || {}, off: v.off || {}, o: v.o || {}, m: v.m || {}, t: v.t || {}, x: v.x || {} }; } catch (e) {} return { h: {}, off: {}, o: {}, m: {}, t: {}, x: {} }; })();
  function knSave() { try { localStorage.setItem(KN_KEY, JSON.stringify(K)); } catch (e) {} }
  function knPush() {
    // straight to the cloud doc (merge), so a heading reaches the other devices without waiting for a board edit
    try {
      var fb = window.firebase, u = fb && fb.auth && fb.auth().currentUser;
      if (!u || !fb.firestore) return;
      fb.firestore().collection('users').doc(u.uid).collection('focusboard').doc('data').set({ knowledge: JSON.parse(JSON.stringify(K)) }, { merge: true }).catch(function () {});
    } catch (e) {}
  }
  function setKey(map, id, on) { K[map][id] = { on: on ? 1 : 0, t: Date.now() }; knSave(); knPush(); }
  var listeners = [];
  // one appearance for every knowledge view: auto (the board's own light / dark theme), light or dark — html.kn-light
  var LOOK_KEY = 'minest.kn.look';
  function lookPref() { try { return localStorage.getItem(LOOK_KEY) || 'auto'; } catch (e) { return 'auto'; } }
  function isDark() { var v = lookPref(); if (v === 'dark') return true; if (v === 'light') return false; return !document.querySelector('.theme-white'); }
  function applyLook() { document.documentElement.classList.toggle('kn-light', !isDark()); }
  window.MinestKnowledge = {
    look: lookPref, isDark: isDark, applyLook: applyLook,
    setLook: function (v) { try { localStorage.setItem(LOOK_KEY, v); } catch (e) {} applyLook(); listeners.forEach(function (f) { try { f(); } catch (e) {} }); },
    isHeading: function (cardId) { var x = K.h[cardId]; return !!(x && x.on); },
    setHeading: function (cardId, on) { setKey('h', cardId, on); },
    isOff: function (boardId) { var x = K.off[boardId]; return !!(x && x.on); },
    setOff: function (boardId, on) { setKey('off', boardId, on); },
    // Endless (Phase 2): an outline parent for a stacked card under another stacked card of the same stack (the Kanban keeps one flat stack)
    parentOf: function (itemId) { var x = K.o[itemId]; return x && x.p ? x.p : null; },
    setParents: function (map) { var t = Date.now(); Object.keys(map).forEach(function (id) { K.o[id] = { p: map[id] || null, t: t }; }); knSave(); knPush(); },
    onChange: function (fn) { listeners.push(fn); },
    // Knowledge Map (Phase 3): a node's place, as an offset from its parent node (so a moved list takes its cards along)
    posOf: function (key) { var x = K.m[key]; return x && typeof x.dx === 'number' ? { dx: x.dx, dy: x.dy } : null; },
    setPos: function (key, dx, dy) { K.m[key] = { dx: Math.round(dx), dy: Math.round(dy), t: Date.now() }; knSave(); knPush(); },
    // Timeline (Phase 4): an event's date — only what was entered: {y (negative = BCE), m?, d?, y2?, m2?, d2?}
    dateOf: function (id) { var x = K.t[id]; return x && typeof x.y === 'number' ? x : null; },
    setDate: function (id, dt) { var v = { t: Date.now() }; if (dt) ['y', 'm', 'd', 'y2', 'm2', 'd2'].forEach(function (f) { if (typeof dt[f] === 'number' && isFinite(dt[f])) v[f] = dt[f]; }); K.t[id] = v; knSave(); knPush(); listeners.forEach(function (f) { try { f(); } catch (e) {} }); },
    // Learning Map / Wiki (Phases 5–6): any view setting by key ({v, t}; v null = removed), merged per key by time
    get: function (key) { var x = K.x[key]; return x && x.v != null ? x.v : null; },
    set: function (key, v, quiet) { K.x[key] = { v: v == null ? null : v, t: Date.now() }; knSave(); knPush(); if (!quiet) listeners.forEach(function (f) { try { f(); } catch (e) {} }); },
    setMany: function (map) { var t = Date.now(); Object.keys(map).forEach(function (k) { K.x[k] = { v: map[k] == null ? null : map[k], t: t }; }); knSave(); knPush(); listeners.forEach(function (f) { try { f(); } catch (e) {} }); },
    // Portal: a card was opened (its details) — "viewed" only; mastery stays with the Learning Path (card.learn)
    seenAt: function (id) { var x = K.x['sn:' + id]; return x && x.v ? x.v : 0; },
    markSeen: function (id) { if (!id || (K.x['sn:' + id] && K.x['sn:' + id].v)) return; var t = Date.now(); K.x['sn:' + id] = { v: t, t: t }; knSave(); knPush(); listeners.forEach(function (f) { try { f(); } catch (e) {} }); },
    keys: function (prefix) { return Object.keys(K.x).filter(function (k) { return k.indexOf(prefix) === 0 && K.x[k].v != null; }); },
    clearPos: function (keys) { var t = Date.now(); keys.forEach(function (k) { if (K.m[k]) K.m[k] = { t: t }; }); knSave(); knPush(); },
    _cloud: function () { return K; },
    _mergeCloud: function (R) {
      if (!R || typeof R !== 'object') return;
      var changed = false;
      ['h', 'off', 'o', 'm', 't', 'x'].forEach(function (m) {
        var src = R[m] || {}; K[m] = K[m] || {};
        Object.keys(src).forEach(function (id) { var a = K[m][id], b = src[id]; if (b && (!a || (b.t || 0) > (a.t || 0))) { K[m][id] = b; changed = true; } });
      });
      if (changed) { knSave(); if (ui.open) render(); listeners.forEach(function (f) { try { f(); } catch (e) {} }); }
    }
  };

  // ================================================================== view state (this device)
  var ST_KEY = 'minest.contents.v1';
  var S = (function () { try { var v = JSON.parse(localStorage.getItem(ST_KEY) || 'null'); if (v && v.open) return v; } catch (e) {} return null; })();
  function stSave() { try { localStorage.setItem(ST_KEY, JSON.stringify(S)); } catch (e) {} }

  // ================================================================== the tree (built from the boards each time)
  function boardsNow() { try { return (window.MinestAI && window.MinestAI.boards && window.MinestAI.boards()) || []; } catch (e) { return []; } }
  function activeId() { try { var b = window.MinestAI && window.MinestAI.board && window.MinestAI.board(); return b && b.id; } catch (e) { return null; } }
  function cardNode(b, col, c) {
    var kids = (Array.isArray(c.stack) ? c.stack : []).filter(function (s) { return s && s.title; }).map(function (s) {
      return { id: 'i:' + b.id + ':' + s.id, kind: 'item', title: s.title, done: !!s.complete, to: { b: b.id, l: col.id, c: s.id, p: c.id }, kids: [] };
    });
    return { id: 'c:' + b.id + ':' + c.id, kind: 'card', title: c.title, done: !!c.complete, to: { b: b.id, l: col.id, c: c.id }, kids: kids, cardId: c.id };
  }
  function listNode(b, col) {
    // a card's section: the one recorded for it (boards made from JSON — the Kanban sinks mastered cards), else the heading above it
    var top = [], sec = null, secs = {}, later = [], stageOf = ((window.MinestKnowledge.get('lm:cfg:' + b.id) || {}).stageOf) || {};
    (col.cards || []).forEach(function (c) {
      if (!c || !c.title) return;
      if (window.MinestKnowledge.isHeading(c.id)) {
        sec = { id: 's:' + b.id + ':' + c.id, kind: 'section', title: c.title, to: { b: b.id, l: col.id, c: c.id }, kids: [], cardId: c.id };
        secs[c.id] = sec; top.push(sec); return;
      }
      var n = cardNode(b, col, c), want = stageOf[c.id];
      if (want && !secs[want]) { later.push([want, n]); return; }
      ((want && secs[want]) || sec || { kids: top }).kids.push(n);
    });
    later.forEach(function (x) { (secs[x[0]] ? secs[x[0]].kids : top).push(x[1]); });
    return { id: 'l:' + b.id + ':' + col.id, kind: 'list', title: col.title || 'List', color: col.color, to: { b: b.id, l: col.id }, kids: top, count: (col.cards || []).length };
  }
  function tree() {
    var on = [], off = [];
    boardsNow().forEach(function (b) {
      if (!b || b.archived) return;
      var n = { id: 'b:' + b.id, kind: 'board', title: b.title || 'Board', to: { b: b.id }, boardId: b.id, kids: (b.columns || []).map(function (col) { return listNode(b, col); }) };
      (window.MinestKnowledge.isOff(b.id) ? off : on).push(n);
    });
    return { on: on, off: off };
  }

  // ================================================================== UI
  var ui = { open: false, el: null, list: null };
  var CHEV = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m9 6 6 6-6 6"/></svg>';
  var BOOK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5"/><path d="M8 8h8M8 12h5"/></svg>';
  var CSS = [
    '.kc{position:fixed;inset:0;z-index:2147482000;display:flex;flex-direction:column;color:#f5f7fa;font:15px/1.35 -apple-system,BlinkMacSystemFont,"SF Pro Text",system-ui,sans-serif;-webkit-font-smoothing:antialiased;' +
      'background:linear-gradient(180deg,rgba(40,48,62,.9),rgba(16,20,28,.95));-webkit-backdrop-filter:blur(30px) saturate(170%);backdrop-filter:blur(30px) saturate(170%);touch-action:pan-y;-webkit-user-select:none;user-select:none}',
    'html.kn-open #minest-mini-pet-p0,html.kn-open .mpet-menu,html.kn-open .mpet-say,html.kn-open .mpet-tip{display:none!important}',
    '.kc-head{display:flex;align-items:flex-end;gap:12px;padding:calc(env(safe-area-inset-top,0px) + 18px) 18px 12px;border-bottom:1px solid rgba(255,255,255,.07)}',
    '.kc-head h1{margin:0;flex:1;font-size:32px;line-height:1.1;font-weight:750;letter-spacing:-.6px}',
    '.kc-head p{margin:4px 0 0;font-size:13px;opacity:.55;font-weight:500}',
    '.kc-x{flex:none;width:34px;height:34px;border-radius:50%;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.1);color:#fff;display:grid;place-items:center;cursor:pointer;box-shadow:inset 0 1px 0 rgba(255,255,255,.2);margin-bottom:4px}',
    '.kc-x svg{width:15px;height:15px}',
    '.kc-tools{display:flex;gap:8px;margin-bottom:4px}',
    '.kc-tool{height:34px;padding:0 12px;border-radius:999px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.07);color:#fff;font:600 13px -apple-system,system-ui,sans-serif;cursor:pointer}',
    '.kc-body{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:8px 10px calc(env(safe-area-inset-bottom,0px) + 28px);scrollbar-width:none}',
    '.kc-body::-webkit-scrollbar{display:none}',
    '.kc-row{position:relative;display:flex;align-items:center;min-height:44px;padding-left:calc(var(--d) * 18px);border-radius:12px}',
    '.kc-row + .kc-row:not(.d0)::before{content:"";position:absolute;left:calc(var(--d) * 18px + 40px);right:10px;top:0;height:1px;background:rgba(255,255,255,.06)}',
    '.kc-row.d0{min-height:52px;margin-top:10px}',
    '.kc-row.d0:first-child{margin-top:0}',
    '.kc-chev{flex:none;width:40px;height:44px;display:grid;place-items:center;border:0;background:none;color:rgba(255,255,255,.55);cursor:pointer;padding:0;-webkit-tap-highlight-color:transparent}',
    '.kc-chev svg{width:15px;height:15px;transition:transform .22s cubic-bezier(.2,.8,.25,1)}',
    '.kc-row.open > .kc-chev svg{transform:rotate(90deg)}',
    '.kc-chev.none{visibility:hidden}',
    '.kc-t{flex:1;min-width:0;padding:11px 8px 11px 0;cursor:pointer;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;border-radius:10px;-webkit-tap-highlight-color:transparent}',
    '.kc-t:active{opacity:.6}',
    '.kc-row.board .kc-t{font-size:21px;font-weight:720;letter-spacing:-.3px}',
    '.kc-row.list .kc-t{font-size:17px;font-weight:650}',
    '.kc-row.section .kc-t{font-size:15px;font-weight:700;letter-spacing:.2px;color:#ffd60a}',
    '.kc-row.card .kc-t{font-size:15px;font-weight:450;opacity:.92}',
    '.kc-row.item .kc-t{font-size:14px;opacity:.72}',
    '.kc-row.done .kc-t{text-decoration:line-through;opacity:.4}',
    '.kc-dot{flex:none;width:8px;height:8px;border-radius:50%;margin-right:8px}',
    '.kc-n{flex:none;font-size:13px;opacity:.4;padding:0 12px 0 6px;font-variant-numeric:tabular-nums}',
    '.kc-row.sel{background:rgba(10,132,255,.18)}',
    '.kc-row.in{animation:kcIn .22s cubic-bezier(.2,.8,.25,1) both}',
    '@keyframes kcIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}',
    '.kc-row.out{animation:kcOut .14s ease both}',
    '@keyframes kcOut{to{opacity:0;transform:translateY(-4px)}}',
    '.kc-grp{margin:22px 8px 4px;font-size:12px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;opacity:.45}',
    '.kc-empty{padding:40px 20px;text-align:center;opacity:.55}',
    // long-press menu
    '.kc-menu{position:fixed;z-index:2147482001;min-width:230px;padding:6px;border-radius:18px;background:linear-gradient(180deg,rgba(70,80,96,.92),rgba(34,40,52,.95));-webkit-backdrop-filter:blur(30px);backdrop-filter:blur(30px);' +
      'border:1px solid rgba(255,255,255,.14);box-shadow:inset 0 1px 0 rgba(255,255,255,.2),0 24px 60px rgba(0,0,0,.5);color:#fff;font:15px -apple-system,system-ui,sans-serif}',
    '.kc-menu button{display:block;width:100%;text-align:left;min-height:44px;padding:0 14px;border:0;border-radius:12px;background:none;color:#fff;font:inherit;cursor:pointer}',
    '.kc-menu button:active{background:rgba(255,255,255,.1)}',
    '.kc-menu .h{padding:8px 14px 4px;font-size:12px;opacity:.5;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:260px}',
    // the return pill and the jump highlight
    '.kc-back{position:fixed;left:12px;bottom:calc(env(safe-area-inset-bottom,0px) + 14px);z-index:2147481000;display:flex;align-items:center;gap:2px;height:40px;padding:0 6px 0 12px;border-radius:999px;' +
      'background:linear-gradient(180deg,rgba(66,76,92,.82),rgba(30,36,48,.88));-webkit-backdrop-filter:blur(24px) saturate(170%);backdrop-filter:blur(24px) saturate(170%);border:1px solid rgba(255,255,255,.16);' +
      'box-shadow:inset 0 1px 0 rgba(255,255,255,.2),0 10px 26px rgba(0,0,0,.35);color:#fff;font:600 15px -apple-system,system-ui,sans-serif;transition:opacity .4s;animation:kcIn .3s both}',
    '.kc-back.dim{opacity:.6}',
    '.kc-back b{font-weight:600;cursor:pointer;padding:0 4px}',
    '.kc-back i{font-style:normal;width:28px;height:28px;border-radius:50%;display:grid;place-items:center;opacity:.55;cursor:pointer;font-size:14px}',
    '.mn-kn-hit{animation:mnKnHit 1.8s ease-out both!important;position:relative;z-index:5}',
    '@keyframes mnKnHit{0%{box-shadow:0 0 0 0 rgba(10,132,255,0),0 0 0 0 rgba(10,132,255,0)}12%{box-shadow:0 0 0 3px rgba(10,132,255,.95),0 0 28px 6px rgba(10,132,255,.45)}70%{box-shadow:0 0 0 3px rgba(10,132,255,.7),0 0 18px 2px rgba(10,132,255,.25)}100%{box-shadow:0 0 0 0 rgba(10,132,255,0),0 0 0 0 rgba(10,132,255,0)}}'
  ].join('\n');
  function ensureCss() { if (document.getElementById('kc-css')) return; var s = document.createElement('style'); s.id = 'kc-css'; s.textContent = CSS; document.head.appendChild(s); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function toast(msg) { try { if (window.GlassUI && GlassUI.toast) return GlassUI.toast(msg); } catch (e) {} alert(msg); }

  var T = null, byId = {};
  function rowsHtml(nodes, d, out) {
    nodes.forEach(function (n) {
      byId[n.id] = n;
      var has = n.kids && n.kids.length, op = has && S.open[n.id];
      var cnt = n.kind === 'list' ? n.count : (n.kind === 'section' || n.kind === 'card') && has ? n.kids.length : '';
      out.push('<div class="kc-row ' + n.kind + ' d' + d + (op ? ' open' : '') + (n.done ? ' done' : '') + (S.sel === n.id ? ' sel' : '') + '" data-id="' + esc(n.id) + '" style="--d:' + d + '">' +
        '<button type="button" class="kc-chev' + (has ? '' : ' none') + '" data-chev aria-label="' + (op ? 'Collapse' : 'Expand') + '">' + CHEV + '</button>' +
        (n.kind === 'list' && n.color ? '<i class="kc-dot" style="background:' + esc(n.color) + '"></i>' : '') +
        '<span class="kc-t" data-go role="link">' + esc(n.title) + '</span>' + (cnt !== '' ? '<span class="kc-n">' + cnt + '</span>' : '') + '</div>');
      if (op) rowsHtml(n.kids, d + 1, out);
    });
  }
  function render(animateFrom) {
    if (!ui.el) return;
    T = tree(); byId = {};
    var out = [];
    rowsHtml(T.on, 0, out);
    if (T.off.length) { out.push('<div class="kc-grp">Not in Contents</div>'); rowsHtml(T.off, 0, out); }
    if (!T.on.length && !T.off.length) out.push('<div class="kc-empty">No boards yet.</div>');
    var before = {};
    if (animateFrom) ui.list.querySelectorAll('.kc-row').forEach(function (r) { before[r.getAttribute('data-id')] = 1; });
    ui.list.innerHTML = out.join('');
    if (animateFrom) ui.list.querySelectorAll('.kc-row').forEach(function (r, i) { if (!before[r.getAttribute('data-id')]) { r.style.animationDelay = Math.min(i, 12) * 0 + 'ms'; r.classList.add('in'); } });
    var ab = activeId(), cur = T.on.concat(T.off).filter(function (n) { return n.boardId === ab; })[0];
    ui.sub.textContent = cur ? cur.title : '';
  }
  function descendantsOf(row) {
    var d = +row.style.getPropertyValue('--d'), out = [], n = row.nextElementSibling;
    while (n && n.classList.contains('kc-row') && +n.style.getPropertyValue('--d') > d) { out.push(n); n = n.nextElementSibling; }
    return out;
  }
  function toggle(row) {
    var id = row.getAttribute('data-id');
    if (S.open[id]) {
      delete S.open[id]; stSave();
      var ds = descendantsOf(row);
      row.classList.remove('open');
      if (!ds.length) return render();
      ds.forEach(function (r) { r.classList.add('out'); });
      setTimeout(render, 140);
    } else { S.open[id] = 1; stSave(); render(true); }
  }
  function setAll(open) {
    if (!open) S.open = {};
    else (function walk(ns) { ns.forEach(function (n) { if (n.kids && n.kids.length && n.kind !== 'card') { S.open[n.id] = 1; walk(n.kids); } }); })(T ? T.on : []);
    stSave(); render(true);
  }

  // ---------------------------------------------------------------- long-press menu
  var menuEl = null;
  function closeMenu() { if (menuEl) { menuEl.remove(); menuEl = null; } }
  function menuFor(row, x, y) {
    closeMenu();
    var n = byId[row.getAttribute('data-id')]; if (!n) return;
    var items = [];
    if (n.kind === 'board') items.push([window.MinestKnowledge.isOff(n.boardId) ? 'Show in Contents' : 'Leave out of Contents', function () { window.MinestKnowledge.setOff(n.boardId, !window.MinestKnowledge.isOff(n.boardId)); render(); }]);
    if (n.kind === 'card' || n.kind === 'section') {
      var on = window.MinestKnowledge.isHeading(n.cardId);
      items.push([on ? 'Remove section heading' : 'Make a section heading', function () { window.MinestKnowledge.setHeading(n.cardId, !on); if (!on) S.open['s:' + n.to.b + ':' + n.cardId] = 1; stSave(); render(true); }]);
    }
    if (n.kind !== 'board' && n.kind !== 'list') items.push(['Open details', function () { go(n, true); }]);
    if (!items.length) return;
    menuEl = document.createElement('div'); menuEl.className = 'kc-menu';
    menuEl.innerHTML = '<div class="h">' + esc(n.title) + '</div>' + items.map(function (it, i) { return '<button type="button" data-i="' + i + '">' + esc(it[0]) + '</button>'; }).join('');
    document.body.appendChild(menuEl);
    var w = menuEl.offsetWidth, h = menuEl.offsetHeight;
    menuEl.style.left = Math.max(10, Math.min(innerWidth - w - 10, x - w / 2)) + 'px';
    menuEl.style.top = Math.max(10, Math.min(innerHeight - h - 10, y + 10)) + 'px';
    if (menuEl.animate) menuEl.animate([{ opacity: 0, scale: '.85' }, { opacity: 1, scale: '1' }], { duration: 220, easing: 'cubic-bezier(.2,.85,.25,1.1)' });
    menuEl.addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; var it = items[+b.getAttribute('data-i')]; closeMenu(); it[1](); });
  }

  // ---------------------------------------------------------------- open / close
  var lastTap = null;
  document.addEventListener('pointerdown', function (e) { var b = e.target && e.target.closest && e.target.closest('button,[role="button"]'); if (b && !(ui.el && ui.el.contains(b))) lastTap = { r: b.getBoundingClientRect(), t: Date.now() }; }, true);
  function open() {
    if (ui.open) return;
    ensureCss(); hidePill(); applyLook();
    if (!S) { S = { open: {}, scroll: 0, sel: null }; var a = activeId(); if (a) S.open['b:' + a] = 1; }
    var el = document.createElement('div'); el.className = 'kc'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Contents');
    el.innerHTML = '<div class="kc-head"><div style="flex:1;min-width:0"><h1>Contents</h1><p class="kc-sub"></p></div>' +
      '<div class="kc-tools"><button type="button" class="kc-tool" data-pin title="Show the contents as the first list of this board">📌</button><button type="button" class="kc-tool" data-all="1">Expand</button><button type="button" class="kc-tool" data-all="0">Collapse</button></div>' +
      '<button type="button" class="kc-x" aria-label="Close"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div><div class="kc-body"></div>';
    ui.el = el; ui.list = el.querySelector('.kc-body'); ui.sub = el.querySelector('.kc-sub'); ui.open = true;
    document.body.appendChild(el); document.documentElement.classList.add('kn-open');
    render();
    ui.list.scrollTop = S.scroll || 0;
    if (S.sel) { var sr = ui.list.querySelector('.kc-row[data-id="' + cssEsc(S.sel) + '"]'); if (sr) { var r = sr.getBoundingClientRect(), lr = ui.list.getBoundingClientRect(); if (r.top < lr.top || r.bottom > lr.bottom) ui.list.scrollTop += r.top - lr.top - lr.height / 3; } }
    if (el.animate) {
      var o = lastTap && Date.now() - lastTap.t < 1500 ? lastTap.r : null;
      el.style.transformOrigin = o ? (o.left + o.width / 2) + 'px ' + (o.top + o.height / 2) + 'px' : '50% 40%';
      el.animate([{ opacity: 0, scale: '.9' }, { opacity: 1, scale: '1' }], { duration: 340, easing: 'cubic-bezier(.2,.85,.25,1)' });
    }
    wire(el);
  }
  function close(cb) {
    if (!ui.open) return cb && cb();
    S.scroll = ui.list.scrollTop; stSave(); closeMenu();
    var el = ui.el; ui.open = false; ui.el = null; document.documentElement.classList.remove('kn-open');
    var done = function () { el.remove(); if (cb) cb(); };
    if (el.animate) { var a = el.animate([{ opacity: 1, scale: '1' }, { opacity: 0, scale: '.96' }], { duration: 200, easing: 'ease-in', fill: 'forwards' }); a.onfinish = done; } else done();
  }
  function cssEsc(s) { return window.CSS && CSS.escape ? CSS.escape(s) : String(s).replace(/"/g, '\\"'); }
  function wire(el) {
    var press = null;
    el.addEventListener('pointerdown', function (e) {
      e.stopPropagation();
      if (menuEl && !menuEl.contains(e.target)) closeMenu();
      var row = e.target.closest('.kc-row'); if (!row || e.target.closest('[data-chev]')) return;
      press = { row: row, x: e.clientX, y: e.clientY, t: setTimeout(function () { press.fired = true; try { if (window.MinestNative && MinestNative.haptic) MinestNative.haptic('medium'); } catch (er) {} menuFor(row, press.x, press.y); }, 480) };
    });
    el.addEventListener('pointermove', function (e) { if (press && !press.fired && Math.hypot(e.clientX - press.x, e.clientY - press.y) > 8) { clearTimeout(press.t); press = null; } });
    el.addEventListener('pointerup', function () { if (press && !press.fired) clearTimeout(press.t); });
    el.addEventListener('pointercancel', function () { if (press) clearTimeout(press.t); press = null; });
    el.addEventListener('touchstart', function (e) { e.stopPropagation(); }, { passive: true });
    el.addEventListener('contextmenu', function (e) { e.preventDefault(); var row = e.target.closest('.kc-row'); if (row) menuFor(row, e.clientX, e.clientY); });
    el.addEventListener('click', function (e) {
      e.stopPropagation();
      if (press && press.fired) { press = null; return; }
      press = null;
      if (e.target.closest('.kc-x')) return close();
      var all = e.target.closest('[data-all]'); if (all) return setAll(all.getAttribute('data-all') === '1');
      if (e.target.closest('[data-pin]')) { var ab = activeId(); if (!ab) return; var off = !window.MinestKnowledge.get('kc:unpin:' + ab); window.MinestKnowledge.set('kc:unpin:' + ab, off ? 1 : null); toast(off ? 'Contents removed from the board' : 'Contents pinned as the first list'); mountCol(); return; }
      var row = e.target.closest('.kc-row'); if (!row) return;
      if (e.target.closest('[data-chev]')) return toggle(row);
      if (e.target.closest('[data-go]')) { var n = byId[row.getAttribute('data-id')]; if (n) go(n); }
    });
  }

  // ================================================================== jumping to the board
  function exists(to) {
    var b = boardsNow().filter(function (x) { return x.id === to.b; })[0]; if (!b) return false;
    if (!to.l) return true;
    var col = (b.columns || []).filter(function (c) { return c.id === to.l; })[0]; if (!col) return false;
    if (!to.c) return true;
    return (col.cards || []).some(function (c) { return c.id === to.c || (Array.isArray(c.stack) && c.stack.some(function (s) { return s.id === to.c; })); });
  }
  function waitFor(sel, ms) {
    return new Promise(function (res) {
      var t0 = Date.now();
      (function tick() { var el = document.querySelector(sel); if (el && el.getBoundingClientRect().height > 0) return res(el); if (Date.now() - t0 > ms) return res(null); requestAnimationFrame(tick); })();
    });
  }
  function centre(el) {
    var col = el.closest('.kanban-column-wrapper') || el;
    window.__minestSnapTo = col;   // the iPhone lane snaps to this list, not back to the old one
    var lane = col.closest('.board-swimlane-scroll');
    if (lane && lane.scrollWidth > lane.clientWidth + 2) {
      var lr = lane.getBoundingClientRect(), cr = col.getBoundingClientRect();
      lane.scrollTo({ left: lane.scrollLeft + cr.left - lr.left - (lr.width - cr.width) / 2, behavior: 'smooth' });
    }
    if (el === col) { if (!lane) col.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' }); return; }
    var sc = col.querySelector('.kanban-cards-scroll');
    if (sc && sc.contains(el) && sc.scrollHeight > sc.clientHeight + 2) {
      var sr = sc.getBoundingClientRect(), er = el.getBoundingClientRect();
      sc.scrollTo({ top: sc.scrollTop + er.top - sr.top - (sr.height - er.height) / 2, behavior: 'smooth' });
    } else {
      var r = el.getBoundingClientRect();
      if (r.top < 0 || r.bottom > innerHeight) el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    }
  }
  function settled(el) {
    return new Promise(function (res) {
      var last = null, still = 0, t0 = Date.now();
      (function tick() {
        var r = el.getBoundingClientRect(), k = Math.round(r.left) + ',' + Math.round(r.top);
        still = k === last ? still + 1 : 0; last = k;
        if (still >= 4 || Date.now() - t0 > 1400) return res();
        requestAnimationFrame(tick);
      })();
    });
  }
  function flash(el) { el.classList.remove('mn-kn-hit'); void el.offsetWidth; el.classList.add('mn-kn-hit'); setTimeout(function () { el.classList.remove('mn-kn-hit'); }, 1900); }
  function go(n, details, back) {
    var to = n.to, A = window.MinestAI;
    if (!A || !A.selectBoard) return toast('The board is still loading — try again in a moment.');
    if (!exists(to)) { toast('This item is no longer on the board.'); return render(); }
    if (S && n.id) { S.sel = n.id; stSave(); }
    close(function () {
      try { if (A.viewMode && A.viewMode() !== 'board' && A.setViewMode) A.setViewMode('board'); } catch (e) {}
      var cur = activeId();
      if (cur !== to.b) A.selectBoard(to.b);
      else if (A.listFilter && A.listFilter() !== 'all' && A.selectList) A.selectList('all');
      if (to.p && A.patchCard) {   // a stacked card: open its stack first
        var parent = null; boardsNow().some(function (b) { return b.id === to.b && (b.columns || []).some(function (c) { return (c.cards || []).some(function (x) { if (x.id === to.p) { parent = x; return true; } return false; }); }); });
        if (parent && !parent.isStackExpanded) A.patchCard(to.p, { isStackExpanded: true });
      }
      if (details && A.openCard && !to.p) { A.openCard(to.c); if (back !== false) showPill(back); return; }
      var colSel = '.kanban-column-wrapper[data-col-id="' + cssEsc(to.l || '') + '"]';
      var sel = to.c ? colSel + ' article[data-card-id="' + cssEsc(to.c) + '"]' : (to.l ? colSel : '.board-swimlane-scroll, .kanban-column-wrapper');
      setTimeout(function () {
        waitFor(sel, 2600).then(function (el) {
          if (!el && to.c) return waitFor(colSel, 400).then(function (c) { if (c) { centre(c); settled(c).then(function () { flash(c); }); } else toast('Could not find it on the board.'); });
          if (!el) return to.l ? toast('Could not find it on the board.') : null;
          centre(el);
          settled(el).then(function () { flash(el); });   // light it once the smooth scroll has come to rest
          if (details && to.p) setTimeout(function () { el.click(); }, 500);
        });
      }, cur !== to.b ? 120 : 30);
      if (back !== false) showPill(back);
    });
  }

  // ---------------------------------------------------------------- ‹ Contents (back to the contents)
  var pill = null, dimT = 0;
  function showPill(back) {
    ensureCss(); hidePill();
    var label = back && back.label || 'Contents', reopen = back && back.open || open;
    pill = document.createElement('div'); pill.className = 'kc-back'; pill.setAttribute('role', 'navigation');
    pill.innerHTML = '<b role="button" tabindex="0" aria-label="Back to ' + esc(label) + '">‹ ' + esc(label) + '</b><i role="button" aria-label="Hide">✕</i>';
    pill.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
    pill.addEventListener('click', function (e) { e.stopPropagation(); if (e.target.closest('i')) return hidePill(); hidePill(); reopen(); });
    document.body.appendChild(pill);
    clearTimeout(dimT); dimT = setTimeout(function () { if (pill) pill.classList.add('dim'); }, 5000);
  }
  function hidePill() { if (pill) { pill.remove(); pill = null; } }

  // ---------------------------------------------------------------- entry (a hidden button the iPhone / iPad Dock stands for)
  function trigger() {
    if (document.getElementById('mn-contents-trigger') || !document.body) return;
    var b = document.createElement('button'); b.type = 'button'; b.id = 'mn-contents-trigger'; b.title = 'Contents'; b.setAttribute('aria-label', 'Contents');
    b.style.display = 'none'; b.innerHTML = BOOK;
    b.addEventListener('click', function () { if (ui.open) close(); else open(); });
    document.body.appendChild(b);
  }
  if (document.body) trigger(); else document.addEventListener('DOMContentLoaded', trigger);

  // ================================================================== Contents as the board's first list (pinned)
  var COL_KEY = 'minest.contents.col.v1';
  var CS = (function () { try { return JSON.parse(localStorage.getItem(COL_KEY) || '{}') || {}; } catch (e) { return {}; } })();
  function colSave() { try { localStorage.setItem(COL_KEY, JSON.stringify(CS)); } catch (e) {} }
  var COL_CSS = [
    '.mn-tocol{flex:none;align-self:flex-start;max-height:calc(100% - 6px);display:flex;flex-direction:column;border-radius:22px;overflow:hidden;scroll-snap-align:start;scroll-snap-stop:always;' +
      'background:linear-gradient(180deg,rgba(255,255,255,.13),rgba(255,255,255,.06));border:1px solid rgba(255,255,255,.18);box-shadow:inset 0 1px 0 rgba(255,255,255,.22),0 10px 28px rgba(0,0,0,.22);color:#f3f5f8;' +
      '-webkit-backdrop-filter:blur(18px) saturate(160%);backdrop-filter:blur(18px) saturate(160%);font:15px/1.35 -apple-system,BlinkMacSystemFont,system-ui,sans-serif}',
    '.theme-white .mn-tocol{background:rgba(255,255,255,.78);color:#1d1f23;border-color:rgba(0,0,0,.08);box-shadow:0 8px 24px rgba(0,0,0,.08)}',
    '.mn-tocol-h{display:flex;align-items:center;gap:8px;padding:12px 10px 10px 14px;border-bottom:1px solid rgba(127,127,127,.18)}',
    '.mn-tocol-h b{flex:1;font-size:16px;font-weight:700;letter-spacing:-.2px}',
    '.mn-tocol-h em{font-style:normal;font-size:12px;opacity:.55;font-variant-numeric:tabular-nums}',
    '.mn-tocol-h button{width:30px;height:30px;border-radius:50%;border:0;background:rgba(127,127,127,.16);color:inherit;cursor:pointer;font-size:14px;display:grid;place-items:center;padding:0}',
    '.mn-tocol-b{overflow-y:auto;-webkit-overflow-scrolling:touch;padding:4px 6px 10px;overscroll-behavior:contain}',
    '.mn-tocol-r{display:flex;align-items:center;min-height:38px;border-radius:10px;padding-left:calc(var(--d) * 16px)}',
    '.mn-tocol-r:active{background:rgba(127,127,127,.16)}',
    '.mn-tocol-r .cv{flex:none;width:28px;height:36px;border:0;background:none;color:inherit;opacity:.5;cursor:pointer;display:grid;place-items:center;padding:0}',
    '.mn-tocol-r .cv svg{width:12px;height:12px;transition:transform .2s}',
    '.mn-tocol-r.open .cv svg{transform:rotate(90deg)}',
    '.mn-tocol-r .cv.none{visibility:hidden}',
    '.mn-tocol-r .dt{flex:none;width:8px;height:8px;border-radius:50%;margin-right:8px}',
    '.mn-tocol-r .t{flex:1;min-width:0;padding:8px 6px 8px 0;cursor:pointer;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.mn-tocol-r.list .t{font-weight:650}',
    '.mn-tocol-r.section .t{font-weight:700;color:#d9a400}',
    '.theme-white .mn-tocol-r.section .t{color:#a87400}',
    '.mn-tocol-r.card .t{font-size:14px;opacity:.88}',
    '.mn-tocol-r.done .t{text-decoration:line-through;opacity:.45}',
    '.mn-tocol-r .n{flex:none;font-size:12px;opacity:.45;padding-right:8px;font-variant-numeric:tabular-nums}'
  ].join('\n');
  function colCss() { if (document.getElementById('mn-tocol-css')) return; var st = document.createElement('style'); st.id = 'mn-tocol-css'; st.textContent = COL_CSS; document.head.appendChild(st); }
  function colRows(nodes, d, open, out) {
    nodes.forEach(function (n) {
      if (n.kind === 'item') return;   // stacked cards stay in their stack here
      var kids = (n.kids || []).filter(function (k) { return k.kind !== 'item'; }), op = kids.length && open[n.id];
      var cnt = n.kind === 'list' ? n.count : n.kind === 'section' ? kids.length : '';
      out.push('<div class="mn-tocol-r ' + n.kind + (op ? ' open' : '') + (n.done ? ' done' : '') + '" data-id="' + esc(n.id) + '" style="--d:' + d + '">' +
        '<button type="button" class="cv' + (kids.length ? '' : ' none') + '" data-cv tabindex="-1">' + CHEV + '</button>' +
        (n.kind === 'list' ? '<i class="dt" style="background:' + esc(n.color || '#8d99ae') + '"></i>' : '') +
        '<span class="t" data-go>' + esc(n.title) + '</span>' + (cnt !== '' ? '<span class="n">' + cnt + '</span>' : '') + '</div>');
      if (op) colRows(kids, d + 1, open, out);
    });
  }
  var colById = {};
  function mountCol() {
    var lane = document.querySelector('.board-swimlane-scroll');
    var old = document.querySelectorAll('.mn-tocol');
    var bid = activeId(), b = bid && boardsNow().filter(function (x) { return x.id === bid; })[0];
    if (!lane || !b || window.MinestKnowledge.get('kc:unpin:' + bid)) { old.forEach(function (x) { x.remove(); }); return; }
    old.forEach(function (x) { if (x.parentNode !== lane) x.remove(); });
    colCss();
    var col = lane.querySelector(':scope > .mn-tocol');
    if (!col) {
      col = document.createElement('div'); col.className = 'mn-tocol'; col.setAttribute('aria-label', 'Contents');
      col.addEventListener('click', onColClick);
      lane.insertBefore(col, lane.firstChild);
    } else if (lane.firstElementChild !== col) lane.insertBefore(col, lane.firstChild);
    var first = lane.querySelector(':scope > .kanban-column-wrapper');
    if (first) { var w = first.getBoundingClientRect().width; if (w) col.style.width = Math.round(w) + 'px'; var cs = getComputedStyle(first); col.style.marginTop = cs.marginTop; }
    var lists = (b.columns || []).map(function (c) { return listNode(b, c); });
    var open = CS[bid] = CS[bid] || {};
    var sig = bid + JSON.stringify(lists.map(function (l) { return [l.title, l.count, l.kids.length, l.kids.map(function (k) { return k.title + (k.kids || []).length + (k.done ? 1 : 0); })]; })) + JSON.stringify(open) + document.documentElement.className.indexOf('kn-light');
    if (col.__sig === sig) return;
    col.__sig = sig; colById = {};
    (function idx(ns) { ns.forEach(function (n) { colById[n.id] = n; idx(n.kids || []); }); })(lists);
    var body = col.querySelector('.mn-tocol-b'), y = body ? body.scrollTop : 0, out = [];
    colRows(lists, 0, open, out);
    var cards = (b.columns || []).reduce(function (a, c) { return a + (c.cards || []).length; }, 0);
    col.innerHTML = '<div class="mn-tocol-h"><b>📑 Contents</b><em>' + cards + '</em><button type="button" data-full title="Open Contents">⤢</button><button type="button" data-unpin title="Unpin">📌</button></div><div class="mn-tocol-b">' + (out.join('') || '<div style="padding:16px;opacity:.6">No lists yet.</div>') + '</div>';
    col.querySelector('.mn-tocol-b').scrollTop = y;
  }
  function onColClick(e) {
    e.stopPropagation();
    var bid = activeId();
    if (e.target.closest('[data-unpin]')) { window.MinestKnowledge.set('kc:unpin:' + bid, 1); toast('Contents unpinned — 📌 in Contents puts it back'); mountCol(); return; }
    if (e.target.closest('[data-full]')) return open();
    var row = e.target.closest('.mn-tocol-r'); if (!row) return;
    var id = row.getAttribute('data-id'), n = colById[id]; if (!n) return;
    if (e.target.closest('[data-cv]')) { var o = CS[bid] = CS[bid] || {}; if (o[id]) delete o[id]; else o[id] = 1; colSave(); mountCol(); return; }
    go(n, false, false);   // stay on the board: bring the list / card into view
  }
  var mT = 0;
  function watchBoard() {
    if (!document.body) return setTimeout(watchBoard, 200);
    new MutationObserver(function (ms) {
      if (ms.every(function (m) { var t = m.target.nodeType === 1 ? m.target : m.target.parentNode; return t && t.closest && t.closest('.mn-tocol'); })) return;   // our own changes
      clearTimeout(mT); mT = setTimeout(mountCol, 180);
    }).observe(document.body, { childList: true, subtree: true });
    mountCol();
  }
  watchBoard();
  if (window.MinestKnowledge.onChange) window.MinestKnowledge.onChange(function () { clearTimeout(mT); mT = setTimeout(mountCol, 60); });

  // any card's details opening (the board's own tap, Contents, the views) counts as "viewed"
  window.addEventListener('minest:card-open', function (e) { var d = e.detail || {}; if (d.cardId && window.MinestKnowledge) window.MinestKnowledge.markSeen(d.cardId); });
  window.MinestContents = { mountCol: mountCol, goTo: function (to, back) { go({ id: null, to: to }, false, back); }, open: open, close: close, toggle: function () { if (ui.open) close(); else open(); }, isOpen: function () { return ui.open; }, icon: BOOK, _tree: tree, _go: function (id) { var n = byId[id]; if (n) go(n); } };
})();
