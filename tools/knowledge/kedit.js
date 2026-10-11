/* Minest Knowledge · editing in every view (Contents, Knowledge Map, Timeline, Portal) — the Outline's basics, shared.
   One target {bid, kind: board | list | card | item, id} (item = a stacked card); every change is an ordinary edit of
   the board through MinestAI.updateBoard (one queue, each edit starts from the board the last one left), so the Kanban,
   the Outline and all the views see it. After an edit settles, window 'minest:kedit' {bid, kind, id, made} fires and
   each view redraws.
   UI: bar(target, opts) — a liquid-glass bar of the Outline's buttons for the selected thing (edit text, new after,
   new inside, move up / down, section heading, details, delete, plus the view's own); sheet(...) — a small form
   (title + note, and whatever a view adds, e.g. a date); confirm(...). */
(function () {
  if (window.MinestKEdit) return;
  var A = function () { return window.MinestAI || {}; };
  var KN = function () { return window.MinestKnowledge; };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function toast(m) { try { if (window.GlassUI && GlassUI.toast) GlassUI.toast(m); } catch (e) {} }
  function rid(p) { return p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function boards() { try { return (A().boards && A().boards()) || []; } catch (e) { return []; } }
  function boardById(id) { return boards().filter(function (b) { return b.id === id; })[0] || null; }
  var PAL = ['#49b07a', '#5097f4', '#f18c4f', '#a381f2', '#eb5e55', '#61bd4f'];
  function newCard(t, d) { return { id: rid('c-'), title: t || '', desc: d || '', labels: [], complete: false, createdAt: Date.now(), mastery: 1, checklistItems: [] }; }
  function newItem(t, d) { return { id: rid('s-'), title: t || '', desc: d || '', labels: [], complete: false, mastery: 1 }; }
  function setStack(card, stack) { card.stack = stack; card.hasStack = stack.length > 0; }

  // ================================================================== finding things on a board
  function locate(b, kind, id) {
    if (kind === 'board') return b && b.id === id ? { board: b } : null;
    var cols = b.columns || [];
    for (var ci = 0; ci < cols.length; ci++) {
      var col = cols[ci];
      if (kind === 'list' && col.id === id) return { ci: ci, col: col };
      var cards = col.cards || [];
      for (var i = 0; i < cards.length; i++) {
        var c = cards[i];
        if (kind === 'card' && c.id === id) return { ci: ci, col: col, i: i, card: c };
        if (kind === 'item' && Array.isArray(c.stack)) for (var j = 0; j < c.stack.length; j++) if (c.stack[j].id === id) return { ci: ci, col: col, i: i, card: c, j: j, item: c.stack[j] };
      }
    }
    return null;
  }
  function find(t) { var b = boardById(t.bid); return b ? locate(b, t.kind, t.id) : null; }
  function thing(L, kind) { return kind === 'board' ? L.board : kind === 'list' ? L.col : kind === 'card' ? L.card : L.item; }
  function descendants(card, itemId) {   // stacked cards nested (outline-only) under itemId
    var out = [], ids = {}, changed = true; ids[itemId] = 1;
    while (changed) { changed = false; (card.stack || []).forEach(function (s) { if (!ids[s.id] && ids[KN().parentOf(s.id)]) { ids[s.id] = 1; out.push(s); changed = true; } }); }
    return out;
  }

  // ================================================================== the edit queue
  var chain = Promise.resolve();
  function apply(bid, fn, made) {
    chain = chain.then(function () {
      var b0 = boardById(bid); if (!b0 || !A().updateBoard) { toast('Editing is not available here.'); return; }
      var b = JSON.parse(JSON.stringify(b0)), res = fn(b);
      if (res === false) return;
      var before = A().boards(), t0 = Date.now();
      A().updateBoard(bid, function () { return b; });
      return new Promise(function (done) {
        (function wait() {
          if (A().boards() !== before || Date.now() - t0 > 900) { try { window.dispatchEvent(new CustomEvent('minest:kedit', { detail: { bid: bid, made: made || null } })); } catch (e) {} done(made || true); }
          else requestAnimationFrame(wait);
        })();
      });
    }).catch(function (e) { try { console.warn('KEdit', e); } catch (x) {} });
    return chain;
  }

  // ================================================================== operations (the Outline's rules)
  var ops = {
    // text: title (+ note = the card's description)
    update: function (t, v) {
      return apply(t.bid, function (b) {
        var L = locate(b, t.kind, t.id); if (!L) return false; var o = thing(L, t.kind);
        if (v.title != null) o.title = String(v.title).replace(/\s+/g, ' ').trim();
        if (v.desc != null && t.kind !== 'list' && t.kind !== 'board') o.desc = String(v.desc);
        if (v.img != null && t.kind !== 'list' && t.kind !== 'board') {   // the card's picture = its cover (the Kanban's own field: value)
          var u = String(v.img).trim();
          if (!u) delete o.cover; else o.cover = { type: 'image', value: u, title: (o.cover && o.cover.title) || '', size: (o.cover && o.cover.size) || 'banner' };
        }
      }, t);
    },
    // a new one after it (same level)
    addAfter: function (t, v) {
      v = v || {};
      if (t.kind === 'board') return ops.addInside(t, v);
      if (t.kind === 'list') { var nl = { id: rid('col-'), title: v.title || 'New list', color: PAL[((boardById(t.bid) || {}).columns || []).length % PAL.length], cards: [] }; return apply(t.bid, function (b) { var L = locate(b, 'list', t.id); if (!L) return false; b.columns.splice(L.ci + 1, 0, nl); }, { bid: t.bid, kind: 'list', id: nl.id }); }
      if (t.kind === 'card') { var nc = newCard(v.title, v.desc); return apply(t.bid, function (b) { var L = locate(b, 'card', t.id); if (!L) return false; L.col.cards.splice(L.i + 1, 0, nc); }, { bid: t.bid, kind: 'card', id: nc.id }); }
      var ni = newItem(v.title, v.desc), p = KN().parentOf(t.id);
      if (p) { var m = {}; m[ni.id] = p; KN().setParents(m); }
      return apply(t.bid, function (b) { var L = locate(b, 'item', t.id); if (!L) return false; var st = L.card.stack.slice(); st.splice(L.j + 1 + descendants(L.card, t.id).length, 0, ni); setStack(L.card, st); }, { bid: t.bid, kind: 'item', id: ni.id });
    },
    // a new one inside it (board → list, list → card, card → stacked card, stacked card → nested stacked card)
    addInside: function (t, v) {
      v = v || {};
      if (t.kind === 'board') { var nl = { id: rid('col-'), title: v.title || 'New list', color: PAL[((boardById(t.bid) || {}).columns || []).length % PAL.length], cards: [] }; return apply(t.bid, function (b) { b.columns = (b.columns || []).concat([nl]); }, { bid: t.bid, kind: 'list', id: nl.id }); }
      if (t.kind === 'list') { var nc = newCard(v.title, v.desc); return apply(t.bid, function (b) { var L = locate(b, 'list', t.id); if (!L) return false; L.col.cards = (L.col.cards || []).concat([nc]); }, { bid: t.bid, kind: 'card', id: nc.id }); }
      var ni = newItem(v.title, v.desc);
      if (t.kind === 'card') return apply(t.bid, function (b) { var L = locate(b, 'card', t.id); if (!L) return false; setStack(L.card, (L.card.stack || []).concat([ni])); }, { bid: t.bid, kind: 'item', id: ni.id });
      var m = {}; m[ni.id] = t.id; KN().setParents(m);
      return apply(t.bid, function (b) { var L = locate(b, 'item', t.id); if (!L) return false; var st = L.card.stack.slice(); st.splice(L.j + 1 + descendants(L.card, t.id).length, 0, ni); setStack(L.card, st); }, { bid: t.bid, kind: 'item', id: ni.id });
    },
    // a card into a list / section of the user's choosing (Timeline, Portal)
    addCardTo: function (bid, listId, afterCardId, v) {
      var nc = newCard(v.title, v.desc);
      return apply(bid, function (b) { var L = locate(b, 'list', listId); if (!L) return false; var cs = L.col.cards = (L.col.cards || []).slice(), at = afterCardId ? cs.findIndex(function (c) { return c.id === afterCardId; }) : -1; if (at >= 0) cs.splice(at + 1, 0, nc); else cs.push(nc); L.col.cards = cs; }, { bid: bid, kind: 'card', id: nc.id });
    },
    move: function (t, dir) {
      if (t.kind === 'board') return Promise.resolve();
      if (t.kind === 'list') return apply(t.bid, function (b) { var L = locate(b, 'list', t.id), j = L.ci + dir; if (j < 0 || j >= b.columns.length) return false; var x = b.columns[j]; b.columns[j] = b.columns[L.ci]; b.columns[L.ci] = x; }, t);
      if (t.kind === 'card') return apply(t.bid, function (b) {
        var L = locate(b, 'card', t.id), cards = L.col.cards, j = L.i + dir;
        if (j >= 0 && j < cards.length) { var x = cards[j]; cards[j] = cards[L.i]; cards[L.i] = x; return; }
        var nci = L.ci + dir; if (nci < 0 || nci >= b.columns.length) return false;   // past the end: into the next / previous list
        cards.splice(L.i, 1); var to = b.columns[nci]; to.cards = to.cards || [];
        if (dir < 0) to.cards.push(L.card); else to.cards.unshift(L.card);
      }, t);
      return apply(t.bid, function (b) {
        var L = locate(b, 'item', t.id); if (!L) return false; var p = KN().parentOf(t.id) || null;
        var sibs = L.card.stack.filter(function (s) { return (KN().parentOf(s.id) || null) === p; }), k = sibs.findIndex(function (s) { return s.id === t.id; }), o = sibs[k + dir];
        if (!o) return false;
        var st = L.card.stack.slice(), a = st.findIndex(function (s) { return s.id === t.id; }), c = st.findIndex(function (s) { return s.id === o.id; });
        st[a] = o; st[c] = L.item; setStack(L.card, st);
      }, t);
    },
    remove: function (t) {
      return apply(t.bid, function (b) {
        if (t.kind === 'list') { var L = locate(b, 'list', t.id); if (!L) return false; b.columns.splice(L.ci, 1); return; }
        if (t.kind === 'card') { var C = locate(b, 'card', t.id); if (!C) return false; C.col.cards.splice(C.i, 1); return; }
        var I = locate(b, 'item', t.id); if (!I) return false;
        var p = KN().parentOf(t.id), map = {};
        (I.card.stack || []).forEach(function (s) { if (KN().parentOf(s.id) === t.id) map[s.id] = p; });
        if (Object.keys(map).length) KN().setParents(map);
        setStack(I.card, I.card.stack.filter(function (s) { return s.id !== t.id; }));
      }, null);
    },
    heading: function (t) {
      if (t.kind !== 'card') { toast('Only a card can be a section heading.'); return Promise.resolve(); }
      KN().setHeading(t.id, !KN().isHeading(t.id));
      try { window.dispatchEvent(new CustomEvent('minest:kedit', { detail: { bid: t.bid, made: t } })); } catch (e) {}
      return Promise.resolve(t);
    }
  };

  // ================================================================== UI: bar, sheet, confirm
  var I = function (d) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + d + '</svg>'; };
  var ICON = {
    edit: I('<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>'),
    add: I('<path d="M12 5v14M5 12h14"/>'),
    child: I('<path d="M6 4v9a3 3 0 0 0 3 3h10"/><path d="m15 12 4 4-4 4"/>'),
    up: I('<path d="M12 19V5M6 11l6-6 6 6"/>'), down: I('<path d="M12 5v14M6 13l6 6 6-6"/>'),
    head: I('<path d="M6 4v16M18 4v16M6 12h12"/>'),
    info: I('<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>'),
    del: I('<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>'),
    date: I('<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>'),
    x: I('<path d="M6 6l12 12M18 6 6 18"/>')
  };
  var CSS = [
    '.ke-bar{position:fixed;left:50%;bottom:calc(env(safe-area-inset-bottom,0px) + 16px);transform:translateX(-50%);z-index:2147482010;display:flex;flex-direction:column;align-items:center;gap:6px;max-width:calc(100vw - 16px);font:600 13px -apple-system,BlinkMacSystemFont,system-ui,sans-serif;color:#fff}',
    '.ke-what{max-width:min(420px,calc(100vw - 32px));padding:5px 12px;border-radius:999px;background:rgba(30,36,48,.72);-webkit-backdrop-filter:blur(20px) saturate(180%);backdrop-filter:blur(20px) saturate(180%);border:1px solid rgba(255,255,255,.14);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:12.5px}',
    '.ke-what small{opacity:.6;font-weight:600;margin-right:6px;text-transform:uppercase;letter-spacing:.05em;font-size:10.5px}',
    '.ke-row{display:flex;gap:2px;padding:5px;border-radius:999px;overflow-x:auto;scrollbar-width:none;max-width:calc(100vw - 16px);' +
      'background:linear-gradient(180deg,rgba(66,76,92,.8),rgba(30,36,48,.9));-webkit-backdrop-filter:blur(30px) saturate(180%);backdrop-filter:blur(30px) saturate(180%);border:1px solid rgba(255,255,255,.16);box-shadow:inset 0 1px 0 rgba(255,255,255,.22),0 18px 44px rgba(0,0,0,.42)}',
    '.ke-row::-webkit-scrollbar{display:none}',
    '.ke-row button{flex:none;width:40px;height:40px;border-radius:50%;border:0;background:none;color:inherit;display:grid;place-items:center;cursor:pointer;padding:0}',
    '.ke-row button:active{background:rgba(255,255,255,.16)}',
    '.ke-row button[disabled]{opacity:.3;pointer-events:none}',
    '.ke-row button svg{width:20px;height:20px}',
    '.ke-row .del{color:#ff6b6b}',
    '.ke-row .sep{flex:none;width:1px;margin:8px 3px;background:rgba(255,255,255,.16)}',
    '@media (max-width:440px){.ke-row{gap:0;padding:4px}.ke-row button{width:34px;height:38px}.ke-row button svg{width:18px;height:18px}.ke-row .sep{margin:8px 2px}}',
    'html.kn-light .ke-row{background:rgba(255,255,255,.86);border-color:rgba(255,255,255,.95);box-shadow:inset 0 1px 0 #fff,0 14px 36px rgba(30,40,60,.18);color:#1d1f23}',
    'html.kn-light .ke-row button:active{background:rgba(0,0,0,.06)}',
    'html.kn-light .ke-row .sep{background:rgba(0,0,0,.1)}html.kn-light .ke-row .del{color:#e5484d}',
    'html.kn-light .ke-what{background:rgba(255,255,255,.88);color:#1d1f23;border-color:rgba(0,0,0,.06)}',
    '.ke-bd{position:fixed;inset:0;z-index:2147482019;background:rgba(0,0,0,.28)}',
    '.ke-sheet{position:fixed;left:50%;bottom:calc(env(safe-area-inset-bottom,0px) + 12px);transform:translateX(-50%);z-index:2147482020;width:min(460px,calc(100vw - 20px));max-height:80dvh;overflow:auto;padding:16px;border-radius:28px;box-sizing:border-box;' +
      'background:linear-gradient(180deg,rgba(66,76,92,.86),rgba(30,36,48,.94));-webkit-backdrop-filter:blur(30px) saturate(180%);backdrop-filter:blur(30px) saturate(180%);border:1px solid rgba(255,255,255,.16);box-shadow:inset 0 1px 0 rgba(255,255,255,.22),0 28px 70px rgba(0,0,0,.45);color:#f5f7fa;font:15px -apple-system,BlinkMacSystemFont,system-ui,sans-serif}',
    '.ke-sheet h4{margin:0 2px 12px;font-size:18px;font-weight:700}',
    '.ke-sheet label{display:block;margin:0 0 10px}',
    '.ke-sheet label span{display:block;margin:0 4px 5px;font-size:12px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;opacity:.6}',
    '.ke-sheet input,.ke-sheet textarea,.ke-sheet select{width:100%;box-sizing:border-box;border-radius:14px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.08);color:inherit;font:16px -apple-system,system-ui,sans-serif;padding:11px 13px;outline:none}',
    '.ke-sheet textarea{min-height:84px;resize:vertical;line-height:1.4}',
    '.ke-sheet input:focus,.ke-sheet textarea:focus,.ke-sheet select:focus{border-color:#0a84ff;box-shadow:0 0 0 3px rgba(10,132,255,.25)}',
    '.ke-sheet .row{display:flex;gap:8px;margin-top:6px}',
    '.ke-sheet .row button{flex:1;height:46px;border-radius:999px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.08);color:inherit;font:600 15px -apple-system,system-ui,sans-serif;cursor:pointer}',
    '.ke-sheet .row .pri{background:linear-gradient(180deg,#3d9bff,#0a7aff);border-color:rgba(255,255,255,.25);color:#fff}',
    '.ke-sheet .row .danger{background:#e5484d;border-color:#e5484d;color:#fff}',
    '.ke-sheet p{margin:0 2px 12px;opacity:.8;line-height:1.45}',
    '.ke-img .th{border-radius:16px;overflow:hidden;margin-bottom:8px;background:rgba(127,127,127,.15)}',
    '.ke-img .th img{display:block;width:100%;max-height:180px;object-fit:cover}',
    '.ke-img .th[hidden],.ke-img [hidden]{display:none!important}',
    '.ke-img .bt{display:flex;gap:8px;margin-bottom:8px}',
    '.ke-img .bt button{height:38px;padding:0 14px;border-radius:999px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.08);color:inherit;font:600 14px -apple-system,system-ui,sans-serif;cursor:pointer}',
    'html.kn-light .ke-img .bt button{background:rgba(0,0,0,.05);border-color:rgba(0,0,0,.08)}',
    '.ke-sheet .two{display:flex;gap:8px}.ke-sheet .two label{flex:1}',
    'html.kn-light .ke-sheet{background:rgba(255,255,255,.94);color:#1d1f23;border-color:rgba(255,255,255,.95);box-shadow:0 24px 60px rgba(30,40,60,.2)}',
    'html.kn-light .ke-sheet input,html.kn-light .ke-sheet textarea,html.kn-light .ke-sheet select{background:rgba(0,0,0,.04);border-color:rgba(0,0,0,.1)}',
    'html.kn-light .ke-sheet .row button{background:rgba(0,0,0,.05);border-color:rgba(0,0,0,.08)}',
    'html.kn-light .ke-sheet .row .pri{color:#fff;background:linear-gradient(180deg,#3d9bff,#0a7aff)}html.kn-light .ke-sheet .row .danger{color:#fff;background:#e5484d}',
    // the views' pop-up menus (boards, map style …): liquid glass, always loaded
    '.en-menu{position:fixed;z-index:2147482003;min-width:240px;max-height:60vh;overflow:auto;padding:6px;border-radius:20px;background:linear-gradient(180deg,rgba(70,80,96,.86),rgba(34,40,52,.92));-webkit-backdrop-filter:blur(30px) saturate(180%);backdrop-filter:blur(30px) saturate(180%);border:1px solid rgba(255,255,255,.16);box-shadow:inset 0 1px 0 rgba(255,255,255,.22),0 24px 60px rgba(0,0,0,.5);color:#fff}',
    '.en-menu button{display:block;width:100%;text-align:left;min-height:44px;padding:0 14px;border:0;border-radius:13px;background:none;color:inherit;font:15px -apple-system,system-ui,sans-serif;cursor:pointer}',
    '.en-menu button.on{color:#64d2ff;font-weight:600}',
    '.en-menu button:active{background:rgba(255,255,255,.1)}',
    '.en-menu p{margin:0;padding:12px 14px;font:15px/1.4 -apple-system,system-ui,sans-serif}',
    '.en-menu .row{display:flex;gap:6px;padding:4px}',
    '.en-menu .row button{flex:1;text-align:center;background:rgba(255,255,255,.08)}',
    '.en-menu .row button.red{color:#ff6b6b}',
    '.en-menu .cap{padding:8px 12px 2px;font:600 12px -apple-system,system-ui,sans-serif;opacity:.6;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:280px}',
    '.en-menu h6{margin:8px 12px 2px;font-size:11px;font-weight:650;letter-spacing:.06em;text-transform:uppercase;opacity:.5}',
    // a view's own bottom-corner buttons step up while the bar is there
    'body:has(.ke-bar) .km-bot{bottom:calc(env(safe-area-inset-bottom,0px) + 112px)!important}',
    '.km-bot{transition:bottom .25s cubic-bezier(.2,.85,.25,1)}',
    // Edit switches in the views' headers
    '.ke-on{background:#0a84ff!important;border-color:#0a84ff!important;color:#fff!important}'
  ].join('\n');
  function css() { if (document.getElementById('ke-css')) return; var s = document.createElement('style'); s.id = 'ke-css'; s.textContent = CSS; document.head.appendChild(s); }
  function guard(el) { ['pointerdown', 'touchstart', 'touchmove', 'wheel', 'mousedown'].forEach(function (ev) { el.addEventListener(ev, function (e) { e.stopPropagation(); }, { passive: true }); }); }

  // ---------------------------------------------------------------- a small form
  var sh = null, bd = null;
  function closeSheet() { if (sh) { sh.remove(); sh = null; } if (bd) { bd.remove(); bd = null; } }
  // fields: [{key, label, value, type: text | note | date-y | select, options: [[v, label]], placeholder}]
  function sheet(o) {
    css(); closeSheet();
    return new Promise(function (done) {
      bd = document.createElement('div'); bd.className = 'ke-bd'; guard(bd);
      sh = document.createElement('div'); sh.className = 'ke-sheet'; sh.setAttribute('role', 'dialog'); guard(sh);
      var f = o.fields || [];
      sh.innerHTML = '<h4>' + esc(o.title || 'Edit') + '</h4>' + (o.text ? '<p>' + esc(o.text) + '</p>' : '') +
        f.map(function (x) {
          var v = x.value == null ? '' : x.value;
          if (x.type === 'image') return '<label><span>' + esc(x.label || 'Picture') + '</span><div class="ke-img"><div class="th"' + (v ? '' : ' hidden') + '><img alt="" src="' + esc(v) + '"></div>' +
            '<div class="bt"><button type="button" data-pick>Choose photo</button><button type="button" data-clear' + (v ? '' : ' hidden') + '>Remove</button></div>' +
            '<input data-k="' + x.key + '" value="' + esc(/^data:/.test(v) ? '' : v) + '" placeholder="or paste a picture link" autocomplete="off"' + (/^data:/.test(v) ? ' data-keep="' + esc(v) + '"' : '') + '><input type="file" accept="image/*" hidden data-file></div></label>';
          var inp = x.type === 'note' ? '<textarea data-k="' + x.key + '" placeholder="' + esc(x.placeholder || '') + '">' + esc(v) + '</textarea>'
            : x.type === 'select' ? '<select data-k="' + x.key + '">' + (x.options || []).map(function (op) { return '<option value="' + esc(op[0]) + '"' + (String(op[0]) === String(v) ? ' selected' : '') + '>' + esc(op[1]) + '</option>'; }).join('') + '</select>'
            : '<input data-k="' + x.key + '" ' + (x.type === 'num' ? 'inputmode="numeric" ' : '') + 'value="' + esc(v) + '" placeholder="' + esc(x.placeholder || '') + '" autocomplete="off">';
          return (x.half ? '' : '') + '<label' + (x.half ? ' style="display:inline-block;width:calc(33.3% - 6px);margin-right:6px;vertical-align:top"' : '') + '><span>' + esc(x.label || '') + '</span>' + inp + '</label>';
        }).join('') +
        '<div class="row"><button type="button" data-no>' + esc(o.cancel || 'Cancel') + '</button><button type="button" class="' + (o.danger ? 'danger' : 'pri') + '" data-ok>' + esc(o.ok || 'Save') + '</button></div>';
      document.body.appendChild(bd); document.body.appendChild(sh);
      if (sh.animate) sh.animate([{ opacity: 0, translate: '0 30px', scale: '.97' }, { opacity: 1, translate: '0 0', scale: '1' }], { duration: 300, easing: 'cubic-bezier(.2,.85,.25,1.05)' });
      var first = sh.querySelector('input,textarea'); if (first) setTimeout(function () { try { first.focus(); var L = first.value.length; first.setSelectionRange && first.setSelectionRange(L, L); } catch (e) {} }, 60);
      // a picture field: choose a photo (made smaller first) or paste a link
      var img = sh.querySelector('.ke-img');
      if (img) {
        var urlIn = img.querySelector('[data-k]'), th = img.querySelector('.th'), im = th.querySelector('img'), clr = img.querySelector('[data-clear]'), file = img.querySelector('[data-file]');
        var show = function (src) { th.hidden = !src; clr.hidden = !src; if (src) im.src = src; };
        img.querySelector('[data-pick]').addEventListener('click', function (e) { e.preventDefault(); file.click(); });
        clr.addEventListener('click', function (e) { e.preventDefault(); urlIn.value = ''; urlIn.removeAttribute('data-keep'); show(''); });
        urlIn.addEventListener('input', function () { urlIn.removeAttribute('data-keep'); show(urlIn.value.trim()); });
        file.addEventListener('change', function () {
          var f = file.files && file.files[0]; if (!f) return;
          shrink(f, 1280, function (data) { if (!data) return toast('This picture could not be read.'); urlIn.value = ''; urlIn.setAttribute('data-keep', data); show(data); });
        });
      }
      function finish(ok) {
        var out = null;
        if (ok) { out = {}; sh.querySelectorAll('[data-k]').forEach(function (e) { out[e.getAttribute('data-k')] = e.getAttribute('data-keep') || e.value; }); }
        closeSheet(); done(out);
      }
      bd.addEventListener('click', function () { finish(false); });
      sh.addEventListener('click', function (e) { if (e.target.closest('[data-no]')) finish(false); else if (e.target.closest('[data-ok]')) finish(true); });
      sh.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') { e.preventDefault(); finish(false); }
        else if (e.key === 'Enter' && e.target.tagName === 'INPUT') { e.preventDefault(); finish(true); }
        else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); finish(true); }
        e.stopPropagation();
      });
    });
  }
  // a photo made smaller (longest side ≤ max, JPEG) so the board stays light to sync
  function shrink(f, max, cb) {
    var rd = new FileReader();
    rd.onload = function () {
      var im = new Image();
      im.onload = function () {
        var k = Math.min(1, max / Math.max(im.naturalWidth, im.naturalHeight)), w = Math.max(1, Math.round(im.naturalWidth * k)), h = Math.max(1, Math.round(im.naturalHeight * k));
        try { var c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d').drawImage(im, 0, 0, w, h); cb(c.toDataURL('image/jpeg', .82)); } catch (e) { cb(rd.result); }
      };
      im.onerror = function () { cb(null); };
      im.src = rd.result;
    };
    rd.onerror = function () { cb(null); };
    rd.readAsDataURL(f);
  }
  function confirmBox(text, ok) { return sheet({ title: 'Delete?', text: text, ok: ok || 'Delete', danger: true }).then(function (r) { return !!r; }); }

  // ---------------------------------------------------------------- the bar for the selected thing
  var barEl = null, barT = null;
  var KIND = { board: 'Board', list: 'List', card: 'Card', item: 'Stacked card' };
  function closeBar() { if (barEl) { barEl.remove(); barEl = null; } var t = barT; barT = null; if (t && t.onClose) t.onClose(); }
  // t: {bid, kind, id, title}; o: {extra: [{key, icon, label, run, before}], hide: {key: 1}, onDetails(t), onDone(made), onClose()}
  function bar(t, o) {
    css(); closeBar(); o = o || {};
    barT = { t: t, onClose: o.onClose };
    var hide = o.hide || {};
    var can = {
      edit: t.kind !== 'board' || true,
      add: t.kind !== 'board',
      child: true,
      up: t.kind !== 'board', down: t.kind !== 'board',
      head: t.kind === 'card',
      info: (t.kind === 'card' || t.kind === 'item') && !!o.onDetails,
      del: t.kind !== 'board'
    };
    var label = { edit: 'Edit text', add: t.kind === 'list' ? 'New list after' : 'New ' + (t.kind === 'item' ? 'stacked card' : 'card') + ' after', child: t.kind === 'board' ? 'New list' : t.kind === 'list' ? 'New card in it' : 'New card stacked in it', up: 'Move up', down: 'Move down', head: KN().isHeading(t.id) ? 'Not a section heading' : 'Section heading', info: 'Details', del: 'Delete' };
    var btns = [];
    (o.extra || []).filter(function (x) { return x.before; }).forEach(function (x) { btns.push('<button type="button" data-x="' + x.key + '" title="' + esc(x.label) + '" aria-label="' + esc(x.label) + '">' + (ICON[x.icon] || x.icon) + '</button>'); });
    ['edit', 'add', 'child', 'up', 'down', 'head', 'info'].forEach(function (k) { if (can[k] && !hide[k]) btns.push('<button type="button" data-op="' + k + '" title="' + esc(label[k]) + '" aria-label="' + esc(label[k]) + '">' + ICON[k] + '</button>'); });
    (o.extra || []).filter(function (x) { return !x.before; }).forEach(function (x) { btns.push('<button type="button" data-x="' + x.key + '" title="' + esc(x.label) + '" aria-label="' + esc(x.label) + '">' + (ICON[x.icon] || x.icon) + '</button>'); });
    if (can.del && !hide.del) btns.push('<button type="button" class="del" data-op="del" title="Delete" aria-label="Delete">' + ICON.del + '</button>');
    btns.push('<i class="sep"></i><button type="button" data-op="x" title="Done" aria-label="Done">' + ICON.x + '</button>');
    barEl = document.createElement('div'); barEl.className = 'ke-bar';
    barEl.innerHTML = '<div class="ke-what"><small>' + KIND[t.kind] + '</small>' + esc(t.title || 'Untitled') + '</div><div class="ke-row" role="toolbar">' + btns.join('') + '</div>';
    guard(barEl);
    document.body.appendChild(barEl);
    if (barEl.animate) barEl.animate([{ opacity: 0, translate: '0 16px' }, { opacity: 1, translate: '0 0' }], { duration: 240, easing: 'cubic-bezier(.2,.85,.25,1)' });
    var done = function (p) { return Promise.resolve(p).then(function (m) { if (o.onDone) o.onDone(m); return m; }); };
    barEl.addEventListener('click', function (e) {
      e.stopPropagation();
      var x = e.target.closest('[data-x]'); if (x) { var ex = (o.extra || []).filter(function (q) { return q.key === x.getAttribute('data-x'); })[0]; if (ex) ex.run(t); return; }
      var b = e.target.closest('[data-op]'); if (!b) return;
      var op = b.getAttribute('data-op');
      if (op === 'x') return closeBar();
      if (op === 'edit') return editText(t, { image: o.image }).then(function (r) { if (r) { t.title = r.title; var w = barEl && barEl.querySelector('.ke-what'); if (w) w.innerHTML = '<small>' + KIND[t.kind] + '</small>' + esc(t.title || 'Untitled'); done(t); } });
      if (op === 'add' || op === 'child') {
        var kindNew = op === 'add' ? (t.kind === 'board' ? 'list' : t.kind) : (t.kind === 'board' ? 'list' : t.kind === 'list' ? 'card' : 'item');
        return sheet({ title: kindNew === 'list' ? 'New list' : kindNew === 'item' ? 'New stacked card' : 'New card', fields: kindNew === 'list' ? [{ key: 'title', label: 'Title' }] : [{ key: 'title', label: 'Title' }, { key: 'desc', label: 'Note', type: 'note' }], ok: 'Add' })
          .then(function (v) { if (!v || !v.title.trim()) return; return done((op === 'add' ? ops.addAfter : ops.addInside)(t, v)); });
      }
      if (op === 'up' || op === 'down') return done(ops.move(t, op === 'up' ? -1 : 1));
      if (op === 'head') { var r = ops.heading(t); b.setAttribute('title', KN().isHeading(t.id) ? 'Not a section heading' : 'Section heading'); return done(r); }
      if (op === 'info') { var tt = t; closeBar(); return o.onDetails(tt); }
      if (op === 'del') {
        var L = find(t), n = L && thing(L, t.kind), more = t.kind === 'list' ? ((n && n.cards) || []).length : t.kind === 'card' ? ((n && n.stack) || []).length : 0;
        return confirmBox('Delete “' + (t.title || 'Untitled') + '”' + (more ? (t.kind === 'list' ? ' and its ' + more + ' cards' : ' and its ' + more + ' stacked cards') : '') + '? It goes from the board too.')
          .then(function (yes) { if (!yes) return; closeBar(); return done(ops.remove(t)); });
      }
    });
    return { close: closeBar };
  }
  // the text of one thing: title, and the note (description) for cards
  function picOf(o) { return o && o.cover && o.cover.type === 'image' ? (o.cover.value || o.cover.url || '') : ''; }
  function editText(t, opt) {
    var L = find(t); if (!L) { toast('It is no longer on the board.'); return Promise.resolve(null); }
    var o = thing(L, t.kind), note = t.kind === 'card' || t.kind === 'item', pic = note && opt && opt.image;
    return sheet({ title: 'Edit ' + KIND[t.kind].toLowerCase(), fields: [{ key: 'title', label: 'Title', value: o.title || '' }].concat(note ? [{ key: 'desc', label: 'Note', type: 'note', value: o.desc || '' }] : []).concat(pic ? [{ key: 'img', label: 'Picture', type: 'image', value: picOf(o) }] : []) })
      .then(function (v) { if (!v) return null; return ops.update(t, v).then(function () { return { title: v.title.replace(/\s+/g, ' ').trim(), desc: v.desc }; }); });
  }
  // an Edit switch for a view's header
  function switchHtml(cls, on) { return '<button type="button" class="' + cls + (on ? ' ke-on' : '') + '" data-kedit aria-pressed="' + !!on + '">✎ Edit</button>'; }

  if (document.head) css(); else document.addEventListener('DOMContentLoaded', css);   // the menus' look is needed before any view opens
  window.MinestKEdit = { picOf: picOf, ops: ops, bar: bar, closeBar: closeBar, sheet: sheet, confirm: confirmBox, editText: editText, find: find, locate: locate, switchHtml: switchHtml, icons: ICON, isOpen: function () { return !!barEl; }, current: function () { return barT && barT.t; } };
})();
