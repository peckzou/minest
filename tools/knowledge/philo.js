/* Minest Knowledge · Philosophical Exploration tools (Advanced Philosophy Templates) — window.MinestPhilo
   1 · Spinoza — Connect My World: link two things you already have and say how they relate.
   A relationship is one record 'rel:<id>' = { id, a, b, type, note, tool, template, createdAt, updatedAt }
     a / b = { id, ref: { bid, id, key }, title }   id = the stable item id (the knowledge item 'ki:…' when the card
     links to one, else 'card:<card id>'); title is only a fallback — the name is read live from the card.
   Many-to-many, both ends by stable id, cards are never copied or changed. graph() gives nodes + edges for a future
   Knowledge Graph. Cause-and-effect types (leads to, influenced by) are only what the user says — nothing is inferred.
   Plugs into Discover (Philosophical Exploration), the template preview, My World items and every card's edit bar. */
(function () {
  if (window.MinestPhilo || !window.MinestDiscover || !MinestDiscover.register) return;
  var D = MinestDiscover, X = D._x, ui = X.ui, esc = X.esc, KN = function () { return window.MinestKnowledge; };
  var A = function () { return window.MinestAI || {}; };

  // ================================================================== relationships
  var TYPES = [
    { id: 'related', label: 'Related to', say: 'is related to', sym: true },
    { id: 'part-of', label: 'Part of', say: 'is part of' },
    { id: 'influenced-by', label: 'Influenced by', say: 'was influenced by', causal: true },
    { id: 'helps-me', label: 'Helps me', say: 'helps me with' },
    { id: 'leads-to', label: 'Leads to', say: 'leads to', causal: true },
    { id: 'reminds-me', label: 'Reminds me of', say: 'reminds me of' }
  ];
  function typeOf(id) { return TYPES.filter(function (t) { return t.id === id; })[0] || TYPES[0]; }
  function all() { return (KN() ? KN().keys('rel:') : []).map(function (k) { return KN().get(k); }).filter(Boolean).sort(function (a, b) { return b.updatedAt - a.updatedAt; }); }
  function of(itemId) { return all().filter(function (r) { return r.a.id === itemId || r.b.id === itemId; }); }
  function same(r, a, b, type) { return r.type === type && ((r.a.id === a && r.b.id === b) || (typeOf(type).sym && r.a.id === b && r.b.id === a)); }
  function save(r) { r.updatedAt = Date.now(); KN().set('rel:' + r.id, r, true); return r; }
  function remove(id) { KN().set('rel:' + id, null, true); }
  function graph() {
    var nodes = {}, edges = [];
    all().forEach(function (r) { [r.a, r.b].forEach(function (e) { if (!nodes[e.id]) nodes[e.id] = { id: e.id, kind: 'item', title: look(e).title, ref: e.ref }; }); edges.push({ from: r.a.id, to: r.b.id, type: r.type, causal: !!typeOf(r.type).causal, directed: !typeOf(r.type).sym, note: r.note || '', id: r.id }); });
    return { nodes: Object.keys(nodes).map(function (k) { return nodes[k]; }), edges: edges };
  }
  // undo (this page session): what was there before each change
  var UNDO = [];
  function remember(kind, before, after) { UNDO.push({ kind: kind, before: before ? JSON.parse(JSON.stringify(before)) : null, after: after ? JSON.parse(JSON.stringify(after)) : null }); if (UNDO.length > 30) UNDO.shift(); }
  function undo() {
    var u = UNDO.pop(); if (!u) return false;
    if (u.kind === 'create') remove(u.after.id);
    else if (u.kind === 'delete' || u.kind === 'edit') KN().set('rel:' + u.before.id, u.before, true);
    return u.kind;
  }

  // ================================================================== items (any card or stacked card, by stable id)
  function itemFor(bid, id) {
    var b = X.boardById(bid), L = b && X.locateCard(b, id); if (!L) return null;
    var c = L.item || L.card, key = L.item ? KN().get('pk:' + L.item.id) : null;
    return { id: key || 'card:' + c.id, ref: { bid: bid, id: c.id, key: key || null }, title: c.title };
  }
  function look(e) { var v = X.view({ title: e.title, ref: e.ref }); return v; }
  function where(e) { var b = e.ref && X.boardById(e.ref.bid), L = b && X.locateCard(b, e.ref.id); if (!L) return ''; return (L.item ? L.card.title + ' · ' : '') + L.col.title + ' · ' + b.title; }
  function candidates(q) {
    q = String(q || '').toLowerCase(); var out = [], seen = {}, worlds = X.worldIds();
    var bs = (A().boards ? A().boards() : []).slice().sort(function (x, y) { return (worlds.indexOf(y.id) >= 0) - (worlds.indexOf(x.id) >= 0); });
    bs.forEach(function (b) { (b.columns || []).forEach(function (col) { (col.cards || []).forEach(function (c) {
      if (!c || !c.id) return;
      var add = function (node, isItem) { var key = isItem ? KN().get('pk:' + node.id) : null, id = key || 'card:' + node.id; if (seen[id]) return; if (q && String(node.title + ' ' + c.title + ' ' + col.title).toLowerCase().indexOf(q) < 0) return; seen[id] = 1; out.push({ id: id, ref: { bid: b.id, id: node.id, key: key || null }, title: node.title, ctx: (isItem ? c.title + ' · ' : '') + col.title + ' · ' + b.title, head: KN().isHeading(node.id) }); };
      if (!KN().isHeading(c.id)) add(c, false);
      (c.stack || []).forEach(function (st) { add(st, true); });
    }); }); });
    return out.slice(0, 120);
  }
  function openCard(e) {
    var b = e.ref && X.boardById(e.ref.bid), L = b && X.locateCard(b, e.ref.id); if (!L) return X.toast('That card is not there any more.');
    X.close(); setTimeout(function () { try { A().openCardIn(e.ref.bid, L.col.id, L.card.id); } catch (x) {} }, 220);
  }

  // ================================================================== UI (inside the Discover sheet)
  var LINK = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 14a4 4 0 0 0 5.6 0l3-3a4 4 0 0 0-5.6-5.6l-1 1"/><path d="M14 10a4 4 0 0 0-5.6 0l-3 3a4 4 0 0 0 5.6 5.6l1-1"/></svg>';
  var CSS = [
    '.cx-sub{margin:0 2px 12px;font-size:14px;opacity:.65}',
    '.cx-new{width:100%;margin-bottom:12px}',
    '.cx-find{display:flex;align-items:center;gap:8px;margin:0 0 10px;height:40px;padding:0 12px;border-radius:12px;background:rgba(255,255,255,.09);border:1px solid rgba(255,255,255,.12)}.cx-find input{flex:1;min-width:0;border:0;background:none;color:inherit;font:inherit;outline:none}',
    '.cx-rel{display:grid;grid-template-columns:40px 1fr 40px;align-items:center;gap:10px;width:100%;text-align:left;padding:9px 10px;margin-bottom:6px;border-radius:16px;cursor:pointer;color:inherit;font:inherit;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1)}',
    '.cx-rel .dv-art{width:40px;height:52px;border-radius:8px}.cx-rel .dv-art.drawn{padding:3px}.cx-rel .dv-art.drawn b{font-size:8px}',
    '.cx-rel .s{min-width:0;font-size:14px;line-height:1.3}.cx-rel .s b{font-weight:700}.cx-rel .s em{font-style:normal;opacity:.6}.cx-rel .s small{display:block;font-size:12px;opacity:.55;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.cx-tag{display:inline-block;font-size:10.5px;font-weight:700;padding:1px 6px;border-radius:999px;background:rgba(255,159,10,.2);color:#ffb340;margin-left:4px;vertical-align:1px}',
    '.cx-slot{display:flex;align-items:center;gap:12px;width:100%;text-align:left;padding:12px;border-radius:18px;cursor:pointer;color:inherit;font:inherit;background:rgba(255,255,255,.07);border:1.5px dashed rgba(255,255,255,.25)}',
    '.cx-slot.set{border-style:solid;border-color:rgba(47,158,143,.6);background:rgba(47,158,143,.1)}',
    '.cx-slot .dv-art{width:44px;height:58px;border-radius:9px;flex:none}.cx-slot .dv-art.drawn{padding:3px}.cx-slot .dv-art.drawn b{font-size:8.5px}',
    '.cx-slot div{flex:1;min-width:0}.cx-slot b{display:block;font-size:15.5px}.cx-slot small{display:block;font-size:12px;opacity:.6;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.cx-types{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:8px;margin:12px 0}',
    '.cx-type{min-height:44px;padding:6px 10px;border-radius:14px;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.07);color:inherit;font:600 14px -apple-system,system-ui,sans-serif;cursor:pointer;text-align:center}',
    '.cx-type small{display:block;font-size:10.5px;font-weight:600;opacity:.6;margin-top:1px}',
    '.cx-type.on{background:linear-gradient(180deg,#38b2a3,#2f9e8f);border-color:rgba(255,255,255,.4);color:#fff}',
    '.cx-say{text-align:center;font-size:16px;margin:14px 4px 4px;line-height:1.4}.cx-say b{font-weight:750}.cx-say em{font-style:normal;opacity:.65}',
    '.cx-swap{display:block;margin:6px auto;height:32px;padding:0 12px;border-radius:999px;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.07);color:inherit;font:600 12.5px -apple-system,system-ui,sans-serif;cursor:pointer}',
    '.cx-note{width:100%;box-sizing:border-box;min-height:64px;padding:10px 12px;border-radius:12px;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.07);color:inherit;font:inherit;resize:vertical;outline:none;margin-top:6px}',
    '.cx-hint{font-size:12.5px;opacity:.6;margin:6px 2px}',
    '.cx-item{display:flex;align-items:center;gap:14px;margin:4px 0 12px}.cx-item .dv-art{width:72px;height:96px;border-radius:12px;flex:none}.cx-item .dv-art.drawn{padding:5px}.cx-item .dv-art.drawn b{font-size:12px}',
    '.cx-item b{display:block;font-size:20px;font-weight:800}.cx-item small{display:block;font-size:12.5px;opacity:.6;margin-top:3px}',
    'html.kn-light .cx-rel,html.kn-light .cx-slot,html.kn-light .cx-type,html.kn-light .cx-find,html.kn-light .cx-note,html.kn-light .cx-swap{background:rgba(255,255,255,.82);border-color:rgba(0,0,0,.1)}html.kn-light .cx-type.on{color:#fff;background:linear-gradient(180deg,#38b2a3,#2f9e8f)}'
  ].join('\n');
  function css() { if (document.getElementById('cx-css')) return; var s = document.createElement('style'); s.id = 'cx-css'; s.textContent = CSS; document.head.appendChild(s); }
  function sentence(r) { var t = typeOf(r.type); return '<b>' + esc(look(r.a).title) + '</b> <em>' + esc(t.say) + '</em> <b>' + esc(look(r.b).title) + '</b>' + (t.causal ? '<span class="cx-tag" title="Your own judgment — Minest never infers causes">cause & effect</span>' : ''); }
  function relRow(r) { return '<button type="button" class="cx-rel" data-cxedit="' + esc(r.id) + '">' + X.art({ title: r.a.title, ref: r.a.ref }) + '<span class="s">' + sentence(r) + (r.note ? '<small>' + esc(r.note) + '</small>' : '') + '</span>' + X.art({ title: r.b.title, ref: r.b.ref }) + '</button>'; }

  // ---------------------------------------------------------------- home: all connections
  function start(o) {
    o = o || {}; X.shell(); css(); ui.cxq = '';
    if (o.from) { ui.cx = { a: o.from, b: null, type: null, note: '' }; return draft(); }
    home();
  }
  function home() {
    css(); ui.view = 'cx-home'; ui.cxEdit = null; X.head('Connect My World', 'home');
    var rs = all(), q = String(ui.cxq || '').toLowerCase();
    var shown = q ? rs.filter(function (r) { return (look(r.a).title + ' ' + look(r.b).title + ' ' + typeOf(r.type).say + ' ' + (r.note || '')).toLowerCase().indexOf(q) >= 0; }) : rs;
    X.ui.body.innerHTML = '<p class="cx-sub">Link two things you already have and say how they relate. Only you decide how things connect — nothing is linked for you.</p>' +
      '<button type="button" class="dv-go cx-new" data-cxnew>＋ New connection</button>' +
      (rs.length ? '<label class="cx-find"><input data-cxq placeholder="Find a connection" value="' + esc(ui.cxq || '') + '" autocomplete="off"></label>' : '') +
      (UNDO.length ? '<div class="dv-chips" style="margin-bottom:10px"><button type="button" class="dv-chip" data-cxundo>↺ Undo last change</button></div>' : '') +
      '<div class="dv-h">' + (rs.length ? rs.length + ' connection' + (rs.length === 1 ? '' : 's') : 'No connections yet') + '</div>' +
      (shown.map(relRow).join('') || (rs.length ? '<div class="dv-empty">Nothing matches.</div>' : '<div class="dv-empty">Start with two things that belong together — a book and the friend who gave it, a habit and what it leads to.</div>')) +
      '<details class="wm-about" style="margin:16px 2px;font-size:13px;opacity:.75"><summary style="cursor:pointer">About Connect My World</summary><p>Inspired by Spinoza’s Ethics, where everything is part of one connected nature and understanding how things are linked — especially their causes — makes us freer. This is a Minest adaptation, not Spinoza’s own method.</p></details>';
    X.foot('');
  }
  // ---------------------------------------------------------------- a new (or edited) connection
  function draft() {
    css(); var c = ui.cx; ui.view = 'cx-new'; X.head(ui.cxEdit ? 'Edit connection' : 'New connection', ui.cxBack || 'cx-home');
    var t = c.type ? typeOf(c.type) : null;
    var slot = function (k, e) { return e ? '<button type="button" class="cx-slot set" data-cxpick="' + k + '">' + X.art({ title: e.title, ref: e.ref }) + '<div><b>' + esc(look(e).title) + '</b><small>' + esc(where(e) || 'removed') + '</small></div></button>' : '<button type="button" class="cx-slot" data-cxpick="' + k + '"><div><b>' + (k === 'a' ? 'Choose the first thing' : 'Choose what it connects to') + '</b><small>Any card or item from your lists</small></div></button>'; };
    X.ui.body.innerHTML = slot('a', c.a) +
      '<div class="cx-types">' + TYPES.map(function (x) { return '<button type="button" class="cx-type' + (c.type === x.id ? ' on' : '') + '" data-cxtype="' + x.id + '">' + esc(x.label) + (x.causal ? '<small>cause & effect</small>' : '') + '</button>'; }).join('') + '</div>' +
      slot('b', c.b) + (c.a && c.b ? '<button type="button" class="cx-swap" data-cxswap>⇅ Swap</button>' : '') +
      (c.a && c.b && t ? '<div class="cx-say">' + sentence({ a: c.a, b: c.b, type: c.type }) + '</div>' : '') +
      (t && t.causal ? '<p class="cx-hint">Cause & effect is your own judgment. Minest never decides that one thing caused another.</p>' : '') +
      '<div class="dv-h">Note <span style="text-transform:none;letter-spacing:0;opacity:.8">(optional)</span></div><textarea class="cx-note" data-cxnote maxlength="400" placeholder="Why or how they connect…">' + esc(c.note || '') + '</textarea>';
    var ok = c.a && c.b && c.type;
    X.foot((ui.cxEdit ? '<button type="button" class="dv-go sec" data-cxdel style="color:#ff6b6b">Delete</button>' : '') + '<button type="button" class="dv-go" data-cxsave' + (ok ? '' : ' disabled') + '>' + (ui.cxEdit ? 'Save' : 'Connect') + '</button>');
  }
  function pick(slotKey) {
    css(); ui.view = 'cx-pick'; ui.cxSlot = slotKey; ui.cxpq = ''; X.head(slotKey === 'a' ? 'The first thing' : 'Connects to', 'cx-new');
    X.ui.body.innerHTML = '<label class="cx-find"><input data-cxpq placeholder="Search your cards and items" autocomplete="off"></label><div data-cxplist></div>';
    drawPick(); setTimeout(function () { var f = X.ui.body.querySelector('[data-cxpq]'); if (f) f.focus(); }, 80);
  }
  function drawPick() {
    var box = X.ui.body.querySelector('[data-cxplist]'); if (!box) return; var other = ui.cx[ui.cxSlot === 'a' ? 'b' : 'a'];
    var cs = candidates(ui.cxpq).filter(function (x) { return !other || x.id !== other.id; });
    box.innerHTML = cs.map(function (x, i) { return '<button type="button" class="cx-slot set" style="margin-bottom:6px;border-style:solid;border-color:rgba(255,255,255,.1);background:rgba(255,255,255,.05)" data-cxchoose="' + i + '">' + X.art({ title: x.title, ref: x.ref }) + '<div><b>' + esc(x.title) + (x.head ? ' <span class="cx-tag" style="background:rgba(255,255,255,.12);color:inherit">section</span>' : '') + '</b><small>' + esc(x.ctx) + '</small></div></button>'; }).join('') || '<div class="dv-empty">Nothing matches.</div>';
    ui.cxCands = cs;
  }
  function saveDraft() {
    var c = ui.cx; if (!(c.a && c.b && c.type)) return;
    if (c.a.id === c.b.id) return X.toast('Pick two different things.');
    var dup = all().filter(function (r) { return same(r, c.a.id, c.b.id, c.type) && (!ui.cxEdit || r.id !== ui.cxEdit); })[0];
    if (dup) return X.toast('That connection is already there.');
    var note = String((X.ui.body.querySelector('[data-cxnote]') || {}).value || c.note || '').trim().slice(0, 400);
    var tpl = ui.cxTpl || null;
    if (ui.cxEdit) {
      var before = KN().get('rel:' + ui.cxEdit); if (!before) return home();
      var r = Object.assign({}, before, { a: snap(c.a), b: snap(c.b), type: c.type, note: note }); remember('edit', before, r); save(r); X.toast('Connection saved');
    } else {
      var n = { id: X.rid(), a: snap(c.a), b: snap(c.b), type: c.type, note: note, tool: 'connect-my-world', template: tpl, createdAt: Date.now() };
      save(n); remember('create', null, n); X.hap('selection'); X.toast('Connected');
    }
    var back = ui.cxBack; ui.cxEdit = null; ui.cxBack = null;
    if (back && /^cx-item:/.test(back)) return item(back.slice(8)); home();
  }
  function snap(e) { return { id: e.id, ref: e.ref ? { bid: e.ref.bid, id: e.ref.id, key: e.ref.key || null } : null, title: look(e).title }; }
  // ---------------------------------------------------------------- one item: everything it connects to
  function item(itemId) {
    css(); var rs = of(itemId); var e = null;
    rs.forEach(function (r) { if (r.a.id === itemId) e = r.a; if (r.b.id === itemId) e = r.b; });
    if (!e && ui.cxItem && ui.cxItem.id === itemId) e = ui.cxItem;
    if (!e) return home();
    ui.cxItem = e; ui.view = 'cx-item'; X.head(look(e).title, 'cx-home');
    var outs = rs.filter(function (r) { return r.a.id === itemId; }), ins = rs.filter(function (r) { return r.b.id === itemId; });
    X.ui.body.innerHTML = '<div class="cx-item">' + X.art({ title: e.title, ref: e.ref }) + '<div><b>' + esc(look(e).title) + '</b><small>' + esc(where(e) || 'This card is no longer in your lists') + '</small></div></div>' +
      '<div class="dv-chips" style="margin-bottom:6px">' + (where(e) ? '<button type="button" class="dv-chip" data-cxopen>Open the card</button>' : '') + '<button type="button" class="dv-chip" data-cxfrom>＋ Connect it to…</button></div>' +
      '<div class="dv-h">' + rs.length + ' connection' + (rs.length === 1 ? '' : 's') + '</div>' + outs.concat(ins).map(relRow).join('') +
      (rs.length ? '' : '<div class="dv-empty">No connections yet.</div>');
    X.foot('');
  }

  // ---------------------------------------------------------------- clicks
  function click(t) {
    if (!/^cx-/.test(ui.view || '')) return false;
    var g;
    if (t.closest('[data-back]')) {
      var b = t.closest('[data-back]').getAttribute('data-back');
      if (b === 'cx-home') { home(); return true; } if (b === 'cx-new') { draft(); return true; } if (/^cx-item:/.test(b)) { item(b.slice(8)); return true; }
      return false;
    }
    if (t.closest('[data-cxnew]')) { ui.cx = { a: null, b: null, type: null, note: '' }; ui.cxEdit = null; ui.cxBack = 'cx-home'; draft(); return true; }
    if ((g = t.closest('[data-cxpick]'))) { keepNote(); pick(g.getAttribute('data-cxpick')); return true; }
    if ((g = t.closest('[data-cxchoose]'))) { var x = ui.cxCands[+g.getAttribute('data-cxchoose')]; if (x) ui.cx[ui.cxSlot] = { id: x.id, ref: x.ref, title: x.title }; draft(); return true; }
    if ((g = t.closest('[data-cxtype]'))) { keepNote(); ui.cx.type = g.getAttribute('data-cxtype'); var y = X.ui.body.scrollTop; draft(); X.ui.body.scrollTop = y; return true; }
    if (t.closest('[data-cxswap]')) { keepNote(); var a = ui.cx.a; ui.cx.a = ui.cx.b; ui.cx.b = a; draft(); return true; }
    if (t.closest('[data-cxsave]')) { saveDraft(); return true; }
    if (t.closest('[data-cxdel]')) {
      var id = ui.cxEdit, ask = window.MinestKEdit ? MinestKEdit.confirm('Delete this connection? Both cards stay as they are.', 'Delete') : Promise.resolve(confirm('Delete this connection?'));
      ask.then(function (ok) { if (!ok) return; var before = KN().get('rel:' + id); if (before) { remember('delete', before, null); remove(id); } X.toast('Connection deleted — Undo is on the list'); var bk = ui.cxBack; ui.cxEdit = null; ui.cxBack = null; if (bk && /^cx-item:/.test(bk)) item(bk.slice(8)); else home(); });
      return true;
    }
    if ((g = t.closest('[data-cxedit]'))) {
      var r = KN().get('rel:' + g.getAttribute('data-cxedit')); if (!r) return true;
      ui.cxBack = ui.view === 'cx-item' ? 'cx-item:' + ui.cxItem.id : 'cx-home';
      ui.cxEdit = r.id; ui.cx = { a: r.a, b: r.b, type: r.type, note: r.note || '' }; draft(); return true;
    }
    if (t.closest('[data-cxundo]')) { var k = undo(); X.toast(k ? '↺ Undone' : 'Nothing to undo'); home(); return true; }
    if (t.closest('[data-cxopen]')) { openCard(ui.cxItem); return true; }
    if (t.closest('[data-cxfrom]')) { ui.cx = { a: ui.cxItem, b: null, type: null, note: '' }; ui.cxEdit = null; ui.cxBack = 'cx-item:' + ui.cxItem.id; draft(); return true; }
    // tapping a thumbnail in a connection opens that item's connections
    return false;
  }
  function keepNote() { var n = X.ui.body.querySelector('[data-cxnote]'); if (n && ui.cx) ui.cx.note = n.value; }
  document.addEventListener('input', function (e) {
    if (!e.target || !e.target.matches) return;
    if (e.target.matches('[data-cxq]') && ui.view === 'cx-home') { ui.cxq = e.target.value; var pos = e.target.selectionStart; home(); var f = X.ui.body.querySelector('[data-cxq]'); if (f) { f.focus(); try { f.setSelectionRange(pos, pos); } catch (x) {} } }
    if (e.target.matches('[data-cxpq]') && ui.view === 'cx-pick') { ui.cxpq = e.target.value; drawPick(); }
  });
  // a long press / right click on a thumbnail inside a connection: that item's page
  document.addEventListener('contextmenu', function (e) { var r = ui.view && /^cx-/.test(ui.view) && e.target.closest && e.target.closest('.cx-rel .dv-art'); if (!r) return; e.preventDefault(); });

  D.register({ id: 'connect-my-world', group: 'philosophy', name: 'Connect My World', sub: 'Link what belongs together.', c1: '#2f9e8f', c2: '#1d6f66', pv: '', minItems: 2,
    start: function () { start(); },
    config: function () { start(); }, open: function () { start(); }, progress: function () { return ''; },
    click: function (t) {
      // in a connection row: the left / right picture opens that item, the rest edits it
      var art = /^cx-/.test(ui.view || '') && t.closest && t.closest('.cx-rel .dv-art');
      if (art) { var row = art.closest('.cx-rel'), r = KN().get('rel:' + row.getAttribute('data-cxedit')); if (r) { var e = art === row.firstElementChild ? r.a : r.b; ui.cxItem = e; item(e.id); return true; } }
      return click(t);
    },
    key: function (e) { if (e.key === 'Escape' && /^cx-(new|pick|item)/.test(ui.view || '')) { e.stopPropagation(); home(); return true; } return false; } });

  // from anywhere: a card's edit bar (Contents, Map, Timeline, Portal, Outline), My World items, the template preview
  function connect(o) {
    o = o || {}; var e = null;
    if (o.bid && o.id) e = itemFor(o.bid, o.id);
    else if (o.key) { var r = KN().get(o.key); var p = null; (A().boards ? A().boards() : []).forEach(function (b) { (b.columns || []).forEach(function (col) { (col.cards || []).forEach(function (c) { (c.stack || []).forEach(function (st) { if (!p && KN().get('pk:' + st.id) === o.key) p = { bid: b.id, id: st.id }; }); }); }); }); e = p ? itemFor(p.bid, p.id) : (r ? { id: o.key, ref: null, title: r.title } : null); }
    if (window.MinestDiscover) D.open(); ui.cxTpl = o.template || null;
    setTimeout(function () { X.shell(); css(); ui.cxBack = 'cx-home'; ui.cxEdit = null; ui.cx = { a: e, b: null, type: null, note: '' }; if (e) draft(); else home(); }, 30);
  }
  if (window.MinestKEdit && MinestKEdit.globalExtra) MinestKEdit.globalExtra.push({ key: 'cx-connect', icon: LINK, label: 'Connect to…', kinds: ['card', 'item'], run: function (t) { try { MinestKEdit.closeBar(); } catch (x) {} connect({ bid: t.bid, id: t.id }); } });

  window.MinestPhilo = { ready: function (toolId) { return toolId === 'connect-my-world'; }, open: function (toolId, o) { if (toolId === 'connect-my-world') { if (window.MinestDiscover) D.open(); setTimeout(function () { ui.cxTpl = (o && o.template) || null; start(); }, 30); } },
    connect: connect, relations: all, of: of, graph: graph, types: TYPES, _undo: undo };
  window.MinestRelations = { all: all, of: of, graph: graph, types: TYPES };
})();
