/* Minest Knowledge · Phase 2 — Endless (a vertical knowledge outline, after OmniOutliner)
   One board is one continuous outline that runs down the page, edited in place. It IS the board's data, no copy:
     level 1  List                      (a column)
     level 2  Card                      (a section heading from Contents nests the cards after it)
     level 3+ Stacked card              (card.stack; deeper nesting is outline layout only — the Kanban keeps one
                                          flat stack — stored as MinestKnowledge.setParents: {itemId: parentItemId})
   Editing (keyboard on the web, the bar at the bottom on touch):
     Enter new row · Tab / ⇥ indent · Shift-Tab / ⇤ outdent · ⌥↑ ⌥↓ move · ↑ ↓ next row · ⌘↩ details ·
     ⌘. fold · Backspace on an empty row deletes it · Esc stops editing
   Indent / outdent move real cards: a card indented under the card above becomes one of its stacked cards; a stacked
   card outdented past its stack becomes a card again, right after its old parent (its own children come with it).
   Details open the card details sheet of the Kanban. Folds, notes on/off and the scroll position are kept per board
   on this device (minest.endless.v1). Needs window.MinestAI.updateBoard / openCardIn (tools/web31/build.py). */
(function () {
  if (window.MinestEndless) return;
  var KN = function () { return window.MinestKnowledge; };
  var A = function () { return window.MinestAI || {}; };

  // ================================================================== view state (this device)
  var ST_KEY = 'minest.endless.v1';
  var S = (function () { try { var v = JSON.parse(localStorage.getItem(ST_KEY) || 'null'); if (v && v.fold) return v; } catch (e) {} return { fold: {}, notes: true, scroll: {} }; })();
  function stSave() { try { localStorage.setItem(ST_KEY, JSON.stringify(S)); } catch (e) {} }
  function folded(k) { var f = S.fold[ui.bid]; return !!(f && f[k]); }
  function setFold(k, on) { var f = S.fold[ui.bid] = S.fold[ui.bid] || {}; if (on) f[k] = 1; else delete f[k]; stSave(); }

  // ================================================================== the outline of a board
  function boards() { try { return (A().boards && A().boards()) || []; } catch (e) { return []; } }
  function boardById(id) { return boards().filter(function (b) { return b.id === id; })[0] || null; }
  function itemTree(card) {
    var items = (Array.isArray(card.stack) ? card.stack : []).filter(function (s) { return s && s.id; });
    var ids = {}; items.forEach(function (s) { ids[s.id] = 1; });
    var kids = {};
    items.forEach(function (s) { var p = KN().parentOf(s.id); if (!p || !ids[p] || p === s.id) p = ''; (kids[p] = kids[p] || []).push(s); });
    var seen = {};
    function build(p) { return (kids[p] || []).filter(function (s) { if (seen[s.id]) return false; seen[s.id] = 1; return true; }).map(function (s) { return { k: 'I:' + s.id, kind: 'item', title: s.title || '', note: s.desc || '', done: !!s.complete, id: s.id, card: card, kids: build(s.id) }; }); }
    return build('');
  }
  function outline(b) {
    return (b.columns || []).map(function (col) {
      var top = [], sec = null;
      (col.cards || []).forEach(function (c) {
        if (!c || !c.id) return;
        var n = { k: 'C:' + c.id, kind: 'card', title: c.title || '', note: c.desc || '', done: !!c.complete, id: c.id, col: col, kids: itemTree(c), heading: KN().isHeading(c.id) };
        if (n.heading) { sec = n; top.push(n); } else if (sec) { n.inSec = sec.id; sec.kids.push(n); } else top.push(n);
      });
      return { k: 'L:' + col.id, kind: 'list', title: col.title || 'List', color: col.color, id: col.id, kids: top };
    });
  }
  var rows = [], byKey = {};
  function flatten(nodes, d) {
    nodes.forEach(function (n) {
      n.d = d; rows.push(n); byKey[n.k] = n;
      if (n.kids.length && !folded(n.k)) flatten(n.kids, d + 1);
    });
  }

  // ================================================================== editing the board (immutably, through MinestAI.updateBoard)
  function rid(p) { return p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  var PAL = ['#49b07a', '#5097f4', '#f18c4f', '#a381f2', '#eb5e55', '#61bd4f'];
  function newCard(t) { return { id: rid('c-'), title: t || '', desc: '', labels: [], complete: false, createdAt: Date.now(), mastery: 1, checklistItems: [] }; }
  function newItem(t) { return { id: rid('s-'), title: t || '', desc: '', labels: [], complete: false, mastery: 1 }; }
  function locate(b, kind, id) {
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
  function descendants(card, itemId) {   // the stacked cards nested (outline-only) under itemId, any depth
    var out = [], ids = {}; ids[itemId] = 1;
    var changed = true;
    while (changed) { changed = false; (card.stack || []).forEach(function (s) { if (!ids[s.id] && ids[KN().parentOf(s.id)]) { ids[s.id] = 1; out.push(s); changed = true; } }); }
    return out;
  }
  var pending = null;   // the row to focus once the edit is rendered
  // every change goes through one queue: each starts from the board as the last one left it (React state updates
  // a moment later, so two quick edits must not both start from the same old board)
  var chain = Promise.resolve();
  function run(task) { chain = chain.then(task).catch(function (e) { try { console.warn('Endless', e); } catch (x) {} }); return chain; }
  function edit(fn, focusKey, opts) {
    var b0 = boardById(ui.bid); if (!b0 || !A().updateBoard) { toast('Editing is not available here.'); return Promise.resolve(); }
    var b = JSON.parse(JSON.stringify(b0));
    var res = fn(b);
    if (res === false) return Promise.resolve();
    var before = A().boards();
    A().updateBoard(ui.bid, function () { return b; });
    pending = { key: focusKey, edit: !opts || opts.edit !== false };
    var t0 = Date.now();
    return new Promise(function (done) {
      (function wait() { if (A().boards() !== before || Date.now() - t0 > 800) { render(); done(); } else requestAnimationFrame(wait); })();
    });
  }
  function setStack(card, stack) { card.stack = stack; card.hasStack = stack.length > 0; }
  var OPS = {
    sibling: function (n) {
      if (n.kind === 'list') { var nl = { id: rid('col-'), title: '', color: PAL[(boardById(ui.bid).columns || []).length % PAL.length], cards: [] }; return edit(function (b) { var L = locate(b, 'list', n.id); b.columns.splice(L.ci + 1, 0, nl); }, 'L:' + nl.id); }
      if (n.kind === 'card') { var nc = newCard(); return edit(function (b) { var L = locate(b, 'card', n.id); L.col.cards.splice(L.i + 1, 0, nc); }, 'C:' + nc.id); }
      var ni = newItem(), p = KN().parentOf(n.id);
      if (p) KN().setParents(obj(ni.id, p));
      return edit(function (b) { var L = locate(b, 'item', n.id); var st = L.card.stack.slice(); st.splice(L.j + 1 + descendants(L.card, n.id).length, 0, ni); setStack(L.card, st); }, 'I:' + ni.id);
    },
    child: function (n) {
      setFold(n.k, false);
      if (n.kind === 'list') { var nc = newCard(); return edit(function (b) { var L = locate(b, 'list', n.id); L.col.cards = (L.col.cards || []).concat([nc]); }, 'C:' + nc.id); }
      var ni = newItem();
      if (n.kind === 'card') return edit(function (b) { var L = locate(b, 'card', n.id); setStack(L.card, (L.card.stack || []).concat([ni])); L.card.isStackExpanded = L.card.isStackExpanded || false; }, 'I:' + ni.id);
      KN().setParents(obj(ni.id, n.id));
      return edit(function (b) { var L = locate(b, 'item', n.id); var st = L.card.stack.slice(); st.splice(L.j + 1 + descendants(L.card, n.id).length, 0, ni); setStack(L.card, st); }, 'I:' + ni.id);
    },
    indent: function (n) {
      if (n.kind === 'list') return toast('Lists are the top level of the outline.');
      if (n.kind === 'card') {
        var prev = prevSibling(n); if (!prev) return toast('Nothing above it to go under.');
        var map = {};
        return edit(function (b) {
          var L = locate(b, 'card', n.id), P = locate(b, 'card', prev.id); if (!L || !P) return false;
          L.col.cards.splice(L.i, 1);
          var c = L.card, it = Object.assign({}, c); delete it.stack; delete it.hasStack; delete it.isStackExpanded;
          var moved = [it].concat(c.stack || []);
          map[it.id] = null;
          (c.stack || []).forEach(function (s) { if (!KN().parentOf(s.id)) map[s.id] = it.id; });
          P = locate(b, 'card', prev.id);
          setStack(P.card, (P.card.stack || []).concat(moved));
          if (KN().isHeading(c.id)) KN().setHeading(c.id, false);
          KN().setParents(map);
        }, 'I:' + n.id);
      }
      var sib = prevSibling(n); if (!sib) return toast('Nothing above it to go under.');
      KN().setParents(obj(n.id, sib.id)); setFold(sib.k, false);
      return edit(function () {}, 'I:' + n.id);
    },
    outdent: function (n) {
      if (n.kind === 'list') return toast('Lists are the top level of the outline.');
      if (n.kind === 'card') return toast('A card stays in its list — use ↑ ↓ to move it to another list.');
      var p = KN().parentOf(n.id);
      if (p) { KN().setParents(obj(n.id, KN().parentOf(p))); return edit(function () {}, 'I:' + n.id); }
      // a top stacked card → a card again, after its parent card; its outline children come along as its stack
      return edit(function (b) {
        var L = locate(b, 'item', n.id); if (!L) return false;
        var desc = descendants(L.card, n.id), dIds = {}; desc.forEach(function (s) { dIds[s.id] = 1; });
        var rest = L.card.stack.filter(function (s) { return s.id !== n.id && !dIds[s.id]; });
        setStack(L.card, rest);
        var nc = Object.assign({}, L.item, { checklistItems: L.item.checklistItems || [], createdAt: L.item.createdAt || Date.now() });
        setStack(nc, desc);
        L.col.cards.splice(L.i + 1, 0, nc);
        var map = {}; desc.forEach(function (s) { if (KN().parentOf(s.id) === n.id) map[s.id] = null; }); map[n.id] = null;
        KN().setParents(map);
      }, 'C:' + n.id);
    },
    move: function (n, dir) {
      if (n.kind === 'list') return edit(function (b) { var L = locate(b, 'list', n.id), j = L.ci + dir; if (j < 0 || j >= b.columns.length) return false; var t = b.columns[j]; b.columns[j] = b.columns[L.ci]; b.columns[L.ci] = t; }, n.k, { edit: false });
      if (n.kind === 'card') return edit(function (b) {
        var L = locate(b, 'card', n.id), cards = L.col.cards, j = L.i + dir;
        if (j >= 0 && j < cards.length) { var t = cards[j]; cards[j] = cards[L.i]; cards[L.i] = t; return; }
        var nci = L.ci + dir; if (nci < 0 || nci >= b.columns.length) return false;   // past the end of the list: into the next / previous list
        cards.splice(L.i, 1); var to = b.columns[nci]; to.cards = to.cards || [];
        if (dir < 0) to.cards.push(L.card); else to.cards.unshift(L.card);
      }, n.k, { edit: false });
      var sib = dir < 0 ? prevSibling(n) : nextSibling(n); if (!sib) return;
      return edit(function (b) { var L = locate(b, 'item', n.id), M = locate(b, 'item', sib.id); var st = L.card.stack.slice(); st[L.j] = M.item; st[M.j] = L.item; setStack(L.card, st); }, n.k, { edit: false });
    },
    remove: function (n, quiet) {
      var big = n.kids.length || (n.note && n.note.trim());
      var go = function () {
        var prev = rows[rows.indexOf(n) - 1];
        return edit(function (b) {
          if (n.kind === 'list') { var L = locate(b, 'list', n.id); b.columns.splice(L.ci, 1); return; }
          if (n.kind === 'card') { var C = locate(b, 'card', n.id); C.col.cards.splice(C.i, 1); return; }
          var I = locate(b, 'item', n.id), p = KN().parentOf(n.id), map = {};
          (I.card.stack || []).forEach(function (s) { if (KN().parentOf(s.id) === n.id) map[s.id] = p; });
          if (Object.keys(map).length) KN().setParents(map);
          setStack(I.card, I.card.stack.filter(function (s) { return s.id !== n.id; }));
        }, prev ? prev.k : null);
      };
      if (quiet || !big) return go();
      confirmBox('Delete “' + (n.title || 'Untitled') + '”' + (n.kind === 'list' ? ' and its ' + n.kids.length + ' cards' : n.kids.length ? ' and what is under it' : '') + '?', go);
    },
    rename: function (n, t) {
      t = String(t || '').replace(/\s+/g, ' ').trim();
      if (t === (n.title || '').trim()) return null;
      return edit(function (b) { var L = locate(b, n.kind, n.id); if (!L) return false; (n.kind === 'list' ? L.col : n.kind === 'card' ? L.card : L.item).title = t; }, null, { edit: false });
    },
    heading: function (n) { if (n.kind !== 'card') return toast('Only a card can be a section heading.'); KN().setHeading(n.id, !KN().isHeading(n.id)); render(); select(n.k); },
    details: function (n) {
      if (n.kind === 'list') return;
      var L = locate(boardById(ui.bid), n.kind, n.id); if (!L || !A().openCardIn) return;
      away(); A().openCardIn(ui.bid, L.col.id, n.id);
    }
  };
  function obj(k, v) { var o = {}; o[k] = v; return o; }
  function siblingsOf(n) {
    if (n.kind === 'list') return rowsOfKind(outline(boardById(ui.bid)));
    if (n.kind === 'card') { var col = outline(boardById(ui.bid)).filter(function (l) { return l.id === n.col.id; })[0]; var out = []; col.kids.forEach(function (c) { out.push(c); if (c.heading) c.kids.forEach(function (x) { out.push(x); }); }); return out; }
    var p = KN().parentOf(n.id), card = n.card;
    var ids = {}; (card.stack || []).forEach(function (s) { ids[s.id] = 1; });
    return (card.stack || []).filter(function (s) { var q = KN().parentOf(s.id); if (!q || !ids[q]) q = null; return q === (p && ids[p] ? p : null); }).map(function (s) { return { id: s.id, k: 'I:' + s.id }; });
  }
  function rowsOfKind(a) { return a; }
  function prevSibling(n) { var s = siblingsOf(n), i = idx(s, n); return i > 0 ? s[i - 1] : null; }
  function nextSibling(n) { var s = siblingsOf(n), i = idx(s, n); return i >= 0 && i < s.length - 1 ? s[i + 1] : null; }
  function idx(s, n) { for (var i = 0; i < s.length; i++) if (s[i].id === n.id) return i; return -1; }

  // ================================================================== UI
  var ui = { open: false, el: null, list: null, bid: null, sel: null, editing: null, limit: 300 };
  var CHEV = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m9 6 6 6-6 6"/></svg>';
  var I = function (d) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + d + '</svg>'; };
  var ICON = {
    out: I('<path d="M11 7 6 12l5 5"/><path d="M6 12h12"/><path d="M20 5v14"/>'), in: I('<path d="m13 7 5 5-5 5"/><path d="M18 12H6"/><path d="M4 5v14"/>'),
    up: I('<path d="m6 11 6-6 6 6"/><path d="M12 5v14"/>'), down: I('<path d="m6 13 6 6 6-6"/><path d="M12 19V5"/>'),
    add: I('<path d="M12 5v14M5 12h14"/>'), child: I('<path d="M6 4v8a3 3 0 0 0 3 3h9"/><path d="m14 11 4 4-4 4"/>'),
    info: I('<circle cx="12" cy="12" r="9"/><path d="M12 11v6"/><path d="M12 7.5v.5"/>'), head: I('<path d="M6 4v16M18 4v16M6 12h12"/>'),
    del: I('<path d="M4 7h16"/><path d="M10 11v6M14 11v6"/><path d="M6 7l1 13h10l1-13"/><path d="M9 7V4h6v3"/>'),
    outline: I('<path d="M4 5h16"/><path d="M8 10h12"/><path d="M12 15h8"/><path d="M8 20h12"/>')
  };
  var CSS = [
    '.en{position:fixed;inset:0;z-index:2147482000;display:flex;flex-direction:column;color:#eef1f6;font:16px/1.4 -apple-system,BlinkMacSystemFont,"SF Pro Text",system-ui,sans-serif;-webkit-font-smoothing:antialiased;' +
      'background:linear-gradient(180deg,#1e2430,#0e1118)}',
    '.en.away{visibility:hidden}',
    'html.kn-open #minest-mini-pet-p0,html.kn-open .mpet-menu,html.kn-open .mpet-say,html.kn-open .mpet-tip{display:none!important}',
    '.en-head{position:relative;display:flex;flex-wrap:wrap;align-items:center;gap:8px;padding:calc(env(safe-area-inset-top,0px) + 16px) 16px 10px;border-bottom:1px solid rgba(255,255,255,.07)}',
    '.en-tb{flex:1 1 100%;min-width:0;border:0;background:none;color:inherit;text-align:left;padding:0 48px 2px 0;cursor:pointer;font:inherit}',
    '.en-head .en-x{position:absolute;right:16px;top:calc(env(safe-area-inset-top,0px) + 20px);margin:0}',
    '.en-tb small{display:block;font-size:12px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;opacity:.5}',
    '.en-tb b{display:block;font-size:28px;line-height:1.15;font-weight:750;letter-spacing:-.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.en-tb b:after{content:" ⌄";font-size:18px;opacity:.45}',
    '.en-hb{flex:none;height:34px;padding:0 12px;border-radius:999px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.07);color:#fff;font:600 13px -apple-system,system-ui,sans-serif;cursor:pointer;margin-bottom:3px}',
    '.en-hb.on{background:rgba(10,132,255,.35);border-color:rgba(10,132,255,.6)}',
    '.en-x{width:34px;padding:0;display:grid;place-items:center}',
    '.en-body{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:10px 8px calc(env(safe-area-inset-bottom,0px) + 90px);scrollbar-width:thin}',
    '.en-row{position:relative;display:flex;align-items:flex-start;padding-left:calc(var(--d) * 22px);border-radius:10px;min-height:34px}',
    '.en-row.sel{background:rgba(10,132,255,.16)}',
    '.en-chev{flex:none;width:26px;height:34px;display:grid;place-items:center;border:0;background:none;color:rgba(255,255,255,.45);cursor:pointer;padding:0}',
    '.en-chev svg{width:13px;height:13px;transition:transform .2s cubic-bezier(.2,.8,.25,1);transform:rotate(90deg)}',
    '.en-row.fold > .en-chev svg{transform:none}',
    '.en-chev.none{visibility:hidden}',
    '.en-dot{flex:none;width:22px;height:34px;display:grid;place-items:center;cursor:pointer}',
    '.en-dot i{display:block;width:7px;height:7px;border-radius:50%;background:rgba(255,255,255,.55)}',
    '.en-row.fold > .en-dot i{box-shadow:0 0 0 4px rgba(255,255,255,.14)}',
    '.en-row.list > .en-dot i{width:9px;height:9px;background:var(--c,#9aa4b2)}',
    '.en-row.head > .en-dot i{border-radius:2px;background:#ffd60a}',
    '.en-tx{flex:1;min-width:0;padding:6px 10px 6px 2px}',
    '.en-t{outline:none;white-space:pre-wrap;overflow-wrap:anywhere;min-height:22px;cursor:text;-webkit-user-select:text;user-select:text}',
    '.en-t:empty:before{content:attr(data-ph);opacity:.35}',
    '.en-row.list > .en-tx .en-t{font-size:20px;font-weight:700;letter-spacing:-.2px}',
    '.en-row.list{margin-top:14px}',
    '.en-row.list:first-child{margin-top:0}',
    '.en-row.head > .en-tx .en-t{font-weight:700;color:#ffd60a}',
    '.en-row.item > .en-tx .en-t{font-size:15px;opacity:.88}',
    '.en-row.done > .en-tx .en-t{text-decoration:line-through;opacity:.45}',
    '.en-n{font-size:13px;line-height:1.4;opacity:.45;margin-top:2px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}',
    '.en.nonotes .en-n{display:none}',
    '.en-row.in{animation:enIn .2s cubic-bezier(.2,.8,.25,1) both}',
    '@keyframes enIn{from{opacity:0;transform:translateY(-5px)}to{opacity:1;transform:none}}',
    '.en-more{height:40px}',
    '.en-empty{padding:40px 16px;text-align:center;opacity:.55}',
    // the editing bar
    '.en-bar{position:fixed;left:50%;bottom:calc(env(safe-area-inset-bottom,0px) + 12px);transform:translateX(-50%);z-index:2147482002;display:flex;gap:2px;padding:5px;border-radius:999px;' +
      'background:linear-gradient(180deg,rgba(70,80,96,.9),rgba(34,40,52,.94));-webkit-backdrop-filter:blur(24px);backdrop-filter:blur(24px);border:1px solid rgba(255,255,255,.14);box-shadow:inset 0 1px 0 rgba(255,255,255,.2),0 14px 36px rgba(0,0,0,.45);max-width:calc(100vw - 16px);overflow-x:auto;scrollbar-width:none}',
    '.en-bar::-webkit-scrollbar{display:none}',
    '.en-bar[hidden]{display:none}',
    '.en-bar button{flex:none;width:40px;height:40px;border-radius:50%;border:0;background:none;color:#fff;display:grid;place-items:center;cursor:pointer;padding:0}',
    '.en-bar button:active{background:rgba(255,255,255,.14)}',
    '.en-bar button svg{width:20px;height:20px}',
    '.en-bar .del{color:#ff6b6b}',
    '.en-menu{position:fixed;z-index:2147482003;min-width:240px;max-height:60vh;overflow:auto;padding:6px;border-radius:18px;background:linear-gradient(180deg,rgba(70,80,96,.94),rgba(34,40,52,.96));-webkit-backdrop-filter:blur(30px);backdrop-filter:blur(30px);border:1px solid rgba(255,255,255,.14);box-shadow:0 24px 60px rgba(0,0,0,.5);color:#fff}',
    '.en-menu button{display:block;width:100%;text-align:left;min-height:44px;padding:0 14px;border:0;border-radius:12px;background:none;color:#fff;font:15px -apple-system,system-ui,sans-serif;cursor:pointer}',
    '.en-menu button.on{color:#64d2ff;font-weight:600}',
    '.en-menu button:active{background:rgba(255,255,255,.1)}',
    '.en-menu p{margin:0;padding:12px 14px;font:15px/1.4 -apple-system,system-ui,sans-serif}',
    '.en-menu .row{display:flex;gap:6px;padding:4px}',
    '.en-menu .row button{flex:1;text-align:center;background:rgba(255,255,255,.08)}',
    '.en-menu .row button.red{color:#ff6b6b}'
  ].join('\n');
  function ensureCss() { if (document.getElementById('en-css')) return; var s = document.createElement('style'); s.id = 'en-css'; s.textContent = CSS; document.head.appendChild(s); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function toast(m) { try { if (window.GlassUI && GlassUI.toast) return GlassUI.toast(m); } catch (e) {} }
  function cssEsc(s) { return window.CSS && CSS.escape ? CSS.escape(s) : String(s).replace(/"/g, '\\"'); }

  function rowHtml(n) {
    var cls = 'en-row ' + n.kind + (n.heading ? ' head' : '') + (n.done ? ' done' : '') + (n.kids.length && folded(n.k) ? ' fold' : '') + (ui.sel === n.k ? ' sel' : '');
    return '<div class="' + cls + '" data-k="' + esc(n.k) + '" style="--d:' + n.d + (n.color ? ';--c:' + esc(n.color) : '') + '">' +
      '<button type="button" class="en-chev' + (n.kids.length ? '' : ' none') + '" data-fold tabindex="-1" aria-label="Fold">' + CHEV + '</button>' +
      '<span class="en-dot" data-dot title="' + (n.kind === 'list' ? 'Fold' : 'Details') + '"><i></i></span>' +
      '<div class="en-tx"><div class="en-t" data-ph="' + (n.kind === 'list' ? 'List title' : 'Untitled') + '">' + esc(n.title) + '</div>' +
      (n.note && n.kind !== 'list' ? '<div class="en-n">' + esc(n.note) + '</div>' : '') + '</div></div>';
  }
  function render() {
    if (!ui.el) return;
    var b = boardById(ui.bid);
    if (!b) { var a = A().board && A().board(); ui.bid = a ? a.id : (boards()[0] || {}).id; b = boardById(ui.bid); }
    ui.title.textContent = b ? (b.title || 'Board') : 'No board';
    rows = []; byKey = {};
    if (b) flatten(outline(b), 0);
    var focusKey = pending && pending.key;
    var ek = ui.editKey, et = ui.editing ? ui.editing.textContent : null;   // a row being typed in stays so
    ui.editing = null; ui.editKey = null;
    if (focusKey) { var fi = rows.findIndex(function (r) { return r.k === focusKey; }); if (fi >= ui.limit) ui.limit = fi + 50; }
    var before = {};
    ui.list.querySelectorAll('.en-row').forEach(function (r) { before[r.getAttribute('data-k')] = 1; });
    var shown = rows.slice(0, ui.limit);
    ui.list.innerHTML = shown.map(rowHtml).join('') + (rows.length > ui.limit ? '<div class="en-more" data-more></div>' : '') +
      (!rows.length ? '<div class="en-empty">' + (b ? 'This board is empty. Tap ＋ to add a list.' : 'No boards yet.') + '</div>' : '');
    if (Object.keys(before).length) ui.list.querySelectorAll('.en-row').forEach(function (r) { if (!before[r.getAttribute('data-k')]) r.classList.add('in'); });
    watchMore();
    if (ek && !(pending && pending.key && pending.key !== ek) && rowEl(ek)) { rowEl(ek).querySelector('.en-t').textContent = et; select(ek); startEdit(ek, true); pending = null; bar(); return; }
    if (pending) { var p = pending; pending = null; if (p.key && byKey[p.key]) { select(p.key); if (p.edit) startEdit(p.key, true); } else if (ui.sel && !byKey[ui.sel]) select(null); }
    else if (ui.sel && byKey[ui.sel]) select(ui.sel); else select(null);
    bar();
  }
  // long outlines: the next 300 rows are added below as the reader nears the end (no full re-render)
  function watchMore() {
    var more = ui.list.querySelector('[data-more]');
    if (!more || !window.IntersectionObserver) return;
    var io = new IntersectionObserver(function (es) {
      if (!es.some(function (e) { return e.isIntersecting; })) return;
      io.disconnect();
      var from = ui.limit; ui.limit += 150;
      more.insertAdjacentHTML('beforebegin', rows.slice(from, ui.limit).map(rowHtml).join(''));
      if (rows.length > ui.limit) watchMore(); else more.remove();
    }, { root: ui.list, rootMargin: '800px' });
    io.observe(more);
  }
  function rowEl(k) { return ui.list.querySelector('.en-row[data-k="' + cssEsc(k) + '"]'); }
  function select(k) {
    ui.sel = k;
    ui.list.querySelectorAll('.en-row.sel').forEach(function (r) { if (r.getAttribute('data-k') !== k) r.classList.remove('sel'); });
    var r = k && rowEl(k); if (r) { r.classList.add('sel'); var lr = ui.list.getBoundingClientRect(), rr = r.getBoundingClientRect(); if (rr.top < lr.top + 4 || rr.bottom > lr.bottom - 90) r.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
    bar();
  }
  function bar() { if (!ui.bar) return; ui.bar.hidden = !ui.sel; }
  function startEdit(k, atEnd) {
    var r = rowEl(k); if (!r) return;
    var t = r.querySelector('.en-t');
    t.setAttribute('contenteditable', 'true'); t.setAttribute('spellcheck', 'true'); ui.editing = t; ui.editKey = k;
    try { t.focus({ preventScroll: true }); } catch (e) { t.focus(); }
    if (atEnd !== false) { var rg = document.createRange(); rg.selectNodeContents(t); rg.collapse(false); var s = getSelection(); s.removeAllRanges(); s.addRange(rg); }
  }
  // finish typing in a row; a new row left empty goes away
  function commit() {
    var t = ui.editing, k = ui.editKey; if (!t) return Promise.resolve(false);
    ui.editing = null; ui.editKey = null;
    t.removeAttribute('contenteditable');
    var n = byKey[k]; if (!n) return Promise.resolve(false);
    var txt = t.textContent;
    if (!txt.trim() && !n.kids.length && !(n.note || '').trim()) return Promise.resolve(OPS.remove(n, true)).then(function () { return true; });
    var p = OPS.rename(n, txt);
    return p ? p.then(function () { return true; }) : Promise.resolve(false);
  }
  function act(name, arg) {
    return run(function () {
      var k = ui.sel; if (!k) return;
      var typing = ui.editing && ui.editKey === k;
      return commit().then(function () {
        var n = byKey[k]; if (!n) return;
        if (name === 'fold') { if (n.kids.length) { setFold(n.k, !folded(n.k)); render(); } return; }
        var p = OPS[name](n, arg);
        if (typing && (name === 'indent' || name === 'outdent' || name === 'move') && pending) pending.edit = true;
        return p;
      });
    });
  }

  // ---------------------------------------------------------------- menus
  var menuEl = null;
  function closeMenu() { if (menuEl) { menuEl.remove(); menuEl = null; } }
  function menuAt(anchor, html, onClick) {
    closeMenu();
    menuEl = document.createElement('div'); menuEl.className = 'en-menu'; menuEl.innerHTML = html;
    document.body.appendChild(menuEl);
    var r = anchor.getBoundingClientRect(), w = menuEl.offsetWidth, h = menuEl.offsetHeight;
    menuEl.style.left = Math.max(10, Math.min(innerWidth - w - 10, r.left)) + 'px';
    menuEl.style.top = Math.max(10, Math.min(innerHeight - h - 10, r.bottom + 8)) + 'px';
    if (menuEl.animate) { menuEl.style.transformOrigin = '20px 0'; menuEl.animate([{ opacity: 0, scale: '.85' }, { opacity: 1, scale: '1' }], { duration: 220, easing: 'cubic-bezier(.2,.85,.25,1.1)' }); }
    menuEl.addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) onClick(b); });
    menuEl.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
  }
  function confirmBox(msg, yes) {
    var host = ui.bar && !ui.bar.hidden ? ui.bar : ui.title;
    menuAt(host, '<p>' + esc(msg) + '</p><div class="row"><button type="button" data-a="no">Cancel</button><button type="button" class="red" data-a="yes">Delete</button></div>', function (b) { closeMenu(); if (b.getAttribute('data-a') === 'yes') run(yes); });
    if (host === ui.bar) { menuEl.style.top = Math.max(10, ui.bar.getBoundingClientRect().top - menuEl.offsetHeight - 10) + 'px'; menuEl.style.left = Math.max(10, (innerWidth - menuEl.offsetWidth) / 2) + 'px'; }
  }
  function boardMenu() {
    var list = boards().filter(function (b) { return !b.archived; });
    menuAt(ui.title, list.map(function (b) { return '<button type="button" data-b="' + esc(b.id) + '"' + (b.id === ui.bid ? ' class="on"' : '') + '>' + esc(b.title || 'Board') + '</button>'; }).join(''), function (btn) {
      closeMenu(); commit(); keepScroll(); ui.bid = btn.getAttribute('data-b'); ui.sel = null; ui.limit = 300; render(); ui.list.scrollTop = S.scroll[ui.bid] || 0;
    });
  }
  function keepScroll() { if (ui.list && ui.bid) { S.scroll[ui.bid] = ui.list.scrollTop; stSave(); } }

  // ---------------------------------------------------------------- the card details sheet sits under this view: step aside while it is open
  function away() {
    if (!ui.el) return;
    commit(); keepScroll();
    ui.el.classList.add('away'); if (ui.bar) ui.bar.hidden = true;
    var t0 = Date.now(), seen = false, gone = 0;
    var modal = function () { return document.querySelector('.mn-dm, .mn-cardsheet, .fixed.inset-0.z-50 .rounded-3xl, [role="dialog"][aria-modal="true"]'); };
    var iv = setInterval(function () {
      var m = modal();
      if (m) { seen = true; gone = 0; return; }
      if (seen) gone++;
      if ((seen && gone >= 2) || (!seen && Date.now() - t0 > 2500)) { clearInterval(iv); if (!ui.el) return; ui.el.classList.remove('away'); render(); ui.list.scrollTop = S.scroll[ui.bid] || 0; }
    }, 250);
  }

  // ---------------------------------------------------------------- open / close
  var lastTap = null;
  document.addEventListener('pointerdown', function (e) { var b = e.target && e.target.closest && e.target.closest('button,[role="button"]'); if (b && !(ui.el && ui.el.contains(b))) lastTap = { r: b.getBoundingClientRect(), t: Date.now() }; }, true);
  function open(boardId) {
    if (ui.open) return;
    ensureCss();
    var a = A().board && A().board();
    ui.bid = boardId || (a && a.id) || (boards()[0] || {}).id;
    var el = document.createElement('div'); el.className = 'en' + (S.notes ? '' : ' nonotes'); el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Outline');
    el.innerHTML = '<div class="en-head"><button type="button" class="en-tb" data-boards><small>Outline</small><b></b></button>' +
      '<button type="button" class="en-hb' + (S.notes ? ' on' : '') + '" data-notes>Notes</button>' +
      '<button type="button" class="en-hb" data-all="1">Expand</button><button type="button" class="en-hb" data-all="0">Collapse</button>' +
      '<button type="button" class="en-hb en-x" data-x aria-label="Close"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div>' +
      '<div class="en-body"></div>';
    var bar = document.createElement('div'); bar.className = 'en-bar'; bar.hidden = true;
    bar.innerHTML = [['outdent', 'out', 'Outdent (⇧⇥)'], ['indent', 'in', 'Indent (⇥)'], ['up', 'up', 'Move up (⌥↑)'], ['down', 'down', 'Move down (⌥↓)'], ['sibling', 'add', 'New row (↩)'], ['child', 'child', 'New row inside'], ['heading', 'head', 'Section heading'], ['details', 'info', 'Details (⌘↩)'], ['remove', 'del', 'Delete']]
      .map(function (x) { return '<button type="button" data-op="' + x[0] + '" title="' + x[2] + '" aria-label="' + x[2] + '"' + (x[0] === 'remove' ? ' class="del"' : '') + '>' + ICON[x[1]] + '</button>'; }).join('');
    ui.el = el; ui.list = el.querySelector('.en-body'); ui.title = el.querySelector('.en-tb b'); ui.bar = bar; ui.open = true; ui.sel = null; ui.limit = 300;
    document.body.appendChild(el); document.body.appendChild(bar); document.documentElement.classList.add('kn-open');
    render();
    ui.list.scrollTop = S.scroll[ui.bid] || 0;
    if (el.animate) { var o = lastTap && Date.now() - lastTap.t < 1500 ? lastTap.r : null; el.style.transformOrigin = o ? (o.left + o.width / 2) + 'px ' + (o.top + o.height / 2) + 'px' : '50% 40%'; el.animate([{ opacity: 0, scale: '.9' }, { opacity: 1, scale: '1' }], { duration: 340, easing: 'cubic-bezier(.2,.85,.25,1)' }); }
    wire(el, bar);
    if (window.visualViewport) visualViewport.addEventListener('resize', place);
  }
  function place() { if (!ui.bar || !window.visualViewport) return; var off = innerHeight - visualViewport.height - visualViewport.offsetTop; ui.bar.style.bottom = off > 40 ? (off + 8) + 'px' : ''; }
  function close() {
    if (!ui.open) return;
    commit(); keepScroll(); closeMenu();
    var el = ui.el, bar = ui.bar; ui.open = false; ui.el = null; ui.bar = null; document.documentElement.classList.remove('kn-open');
    if (bar) bar.remove();
    if (window.visualViewport) visualViewport.removeEventListener('resize', place);
    if (el.animate) { var a = el.animate([{ opacity: 1, scale: '1' }, { opacity: 0, scale: '.96' }], { duration: 200, easing: 'ease-in', fill: 'forwards' }); a.onfinish = function () { el.remove(); }; } else el.remove();
  }
  function wire(el, bar) {
    var stop = function (e) { e.stopPropagation(); };
    ['pointerdown', 'touchstart', 'touchmove', 'wheel'].forEach(function (ev) { el.addEventListener(ev, stop, { passive: true }); bar.addEventListener(ev, stop, { passive: true }); });
    el.addEventListener('pointerdown', function (e) { if (menuEl && !menuEl.contains(e.target)) closeMenu(); });
    // keep the keyboard / the row being typed in when a bar button is pressed
    bar.addEventListener('mousedown', function (e) { e.preventDefault(); });
    bar.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'touch') e.preventDefault(); });
    bar.addEventListener('click', function (e) {
      var b = e.target.closest('[data-op]'); if (!b) return;
      var op = b.getAttribute('data-op');
      if (op === 'up' || op === 'down') return act('move', op === 'up' ? -1 : 1);
      act(op);
    });
    el.addEventListener('click', function (e) {
      if (e.target.closest('[data-x]')) return close();
      if (e.target.closest('[data-boards]')) return boardMenu();
      if (e.target.closest('[data-notes]')) { S.notes = !S.notes; stSave(); el.classList.toggle('nonotes', !S.notes); e.target.closest('[data-notes]').classList.toggle('on', S.notes); return; }
      var all = e.target.closest('[data-all]');
      if (all) {
        commit(); var f = S.fold[ui.bid] = {};
        if (all.getAttribute('data-all') === '0') (function walk(ns) { ns.forEach(function (n) { if (n.kids.length) { f[n.k] = 1; walk(n.kids); } }); })(outline(boardById(ui.bid)));
        stSave(); render(); return;
      }
      var row = e.target.closest('.en-row'); if (!row) { if (!e.target.closest('.en-head')) { commit(); select(null); } return; }
      var k = row.getAttribute('data-k'), n = byKey[k];
      if (e.target.closest('[data-fold]')) { commit(); if (n && n.kids.length) { setFold(k, !folded(k)); select(k); render(); } return; }
      if (e.target.closest('[data-dot]')) { if (!n) return; select(k); if (n.kind === 'list') { commit(); setFold(k, !folded(k)); render(); } else { commit(); OPS.details(n); } return; }
      if (ui.editKey === k) return;
      run(function () { return commit().then(function () { if (rowEl(k)) { select(k); startEdit(k, true); } }); });
    });
    el.addEventListener('keydown', function (e) {
      if (!ui.editing) return;
      var k = ui.editKey, n = byKey[k], mod = e.metaKey || e.ctrlKey;
      if (e.key === 'Enter' && !e.shiftKey && !mod) { e.preventDefault(); act('sibling'); return; }
      if (e.key === 'Enter' && mod) { e.preventDefault(); act('details'); return; }
      if (e.key === 'Tab') { e.preventDefault(); act(e.shiftKey ? 'outdent' : 'indent'); return; }
      if ((e.altKey || (mod && e.shiftKey)) && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) { e.preventDefault(); act('move', e.key === 'ArrowUp' ? -1 : 1); return; }
      if (mod && e.key === '.') { e.preventDefault(); act('fold'); return; }
      if (e.key === 'Escape') { e.preventDefault(); run(commit); return; }
      if ((e.key === 'ArrowUp' || e.key === 'ArrowDown') && !e.shiftKey) {
        var i = rows.indexOf(n), j = i + (e.key === 'ArrowUp' ? -1 : 1);
        if (j >= 0 && j < rows.length) { e.preventDefault(); var to = rows[j].k; run(function () { return commit().then(function () { if (rowEl(to)) { select(to); startEdit(to, true); } }); }); }
        return;
      }
      if (e.key === 'Backspace' && !ui.editing.textContent.length && n && !n.kids.length) { e.preventDefault(); ui.editing = null; ui.editKey = null; run(function () { return OPS.remove(n, true); }); return; }
    });
  }

  // ---------------------------------------------------------------- entry (a hidden button the iPhone / iPad Dock stands for)
  function trigger() {
    if (document.getElementById('mn-endless-trigger') || !document.body) return;
    var b = document.createElement('button'); b.type = 'button'; b.id = 'mn-endless-trigger'; b.title = 'Outline'; b.setAttribute('aria-label', 'Outline');
    b.style.display = 'none'; b.innerHTML = ICON.outline;
    b.addEventListener('click', function () { if (ui.open) close(); else open(); });
    document.body.appendChild(b);
  }
  if (document.body) trigger(); else document.addEventListener('DOMContentLoaded', trigger);
  if (KN() && KN().onChange) KN().onChange(function () { if (ui.open && !ui.editing) render(); });

  window.MinestEndless = { open: open, close: close, toggle: function () { if (ui.open) close(); else open(); }, isOpen: function () { return ui.open; }, icon: ICON.outline,
    _idle: function () { return chain; },
    _rows: function () { return rows.map(function (r) { return r.d + ':' + r.kind + ':' + r.title; }); }, _sel: function (k) { select(k); }, _act: act, _keys: function () { return rows.map(function (r) { return r.k; }); } };
})();
