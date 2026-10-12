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
    if ((g = t.closest('[data-cxtool]'))) { var tl = g.getAttribute('data-cxtool'), ex = ui.cxExplore; if (tl === 'connect-my-world') { ui.cx = { a: ex, b: null, type: null, note: '' }; ui.cxEdit = null; ui.cxBack = 'cx-home'; draft(); } else { ui.pxTool = tl; pxStart(tl, { item: ex }); } return true; }
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
  // ================================================================== tools 2–5: one config-driven reflection engine
  // A record 'px:<id>' = { id, tool, template, subject: { title, item (stable id + ref) | null, url }, answers: { <section>: { text, na, links: [items], year } },
  //   evidence: [{ text, url }] (Kant), versions: [{ at, answers, edited }] (Hegel — never overwritten), createdAt, updatedAt }.
  var PX = {
    'understand-this-thing': { name: 'Understand This Thing', template: 'philosophy-aristotle', subject: 'item', subjectQ: 'Which thing?', subjectHint: 'Pick a card — or just type the name of a thing.',
      intro: 'Look at one thing in up to four ways. Skip any that don’t fit — not every question applies to every thing.',
      sections: [{ id: 'material', q: 'What is it made of?', sub: 'Material cause', na: true, links: true }, { id: 'formal', q: 'What makes it this kind of thing?', sub: 'Formal cause', na: true, links: true },
        { id: 'efficient', q: 'What produced it?', sub: 'Efficient cause', na: true, links: true }, { id: 'final', q: 'What is it for?', sub: 'Final cause', na: true, links: true }],
      about: 'Inspired by Aristotle’s four causes (Physics II, Metaphysics V): four kinds of answer to “why is this the way it is?”. Aristotle meant them for natural things and things people make; here they are a modern way to look closely at anything — and it is fine when one does not apply.' },
    'what-can-i-know': { name: 'What Can I Really Know?', template: 'philosophy-kant', subject: 'claim', subjectQ: 'Which claim, fact or piece of information?', subjectHint: 'Write it in a sentence — and add the card or the source if there is one.',
      intro: 'Sort what you know about one claim: what you saw, what you were told, what you concluded — and what you still don’t know.',
      sections: [{ id: 'observed', q: 'What I observed', sub: 'Seen, heard or measured myself' }, { id: 'learned', q: 'What I learned', sub: 'From books, people or sources' }, { id: 'concluded', q: 'What I concluded', sub: 'What I worked out from it' }, { id: 'unknown', q: 'What I still don’t know', sub: 'Open questions — and what would settle them' }],
      evidence: true,
      about: 'A modern tool inspired by Kant’s question “What can I know?” and his care about the limits of knowledge (Critique of Pure Reason). It does not carry out Kant’s transcendental philosophy; it simply helps you tell experience, what you learned, your conclusions and the open questions apart.' },
    'my-changing-views': { name: 'My Changing Views', template: 'philosophy-hegel', subject: 'view', subjectQ: 'What is the view about?', subjectHint: 'A topic or a question, e.g. “homework”, “what makes a good friend”.',
      intro: 'Keep one view over time. Each update is a new version — earlier ones are never overwritten.',
      sections: [{ id: 'used', q: 'What I used to think' }, { id: 'why', q: 'What made me question it', links: true, linksLabel: 'Experiences or cards behind it' }, { id: 'now', q: 'What I think now', links: true, linksLabel: 'Related cards' }, { id: 'exploring', q: 'What I’m still exploring' }],
      versions: true,
      about: 'Inspired by Hegel’s Phenomenology of Spirit, where understanding grows through experience: a way of seeing meets its limits and is taken up into a fuller one. This is a Minest adaptation — not a fixed “thesis, antithesis, synthesis” formula, which Hegel did not use as his method.' },
    'my-life-possibilities': { name: 'My Life Possibilities', template: 'philosophy-heidegger', subject: 'none',
      intro: 'Four doors into your life. Write as much or as little as you like, and link lists, people, experiences and goals you already have.',
      sections: [{ id: 'past', q: 'My Past — What has shaped me?', links: true, year: true }, { id: 'present', q: 'My Present — Where am I now?', links: true }, { id: 'concerns', q: 'My Concerns — What do I care about?', links: true }, { id: 'possibilities', q: 'My Possibilities — What could I pursue?', links: true, year: true }],
      about: 'Inspired by Heidegger’s Being and Time: we live in an everyday world among people and things, caring about what matters to us, shaped by our past and open to possibilities. This is a Minest adaptation about everyday life and possibility — it is not about death.' }
  };
  function pxAll(tool) { return (KN() ? KN().keys('px:') : []).map(function (k) { return KN().get(k); }).filter(function (r) { return r && (!tool || r.tool === tool); }).sort(function (a, b) { return b.updatedAt - a.updatedAt; }); }
  function pxSave(r) { r.updatedAt = Date.now(); KN().set('px:' + r.id, r, true); return r; }
  function pxTitle(r) { var s = r.subject || {}; return s.title || (s.item ? look(s.item).title : '') || PX[r.tool].name; }
  function cur(r) { return r.versions ? (r.versions[r.versions.length - 1] || {}).answers || {} : r.answers || {}; }
  var PCSS = [
    '.px-q{font-size:20px;font-weight:800;letter-spacing:-.3px;margin:4px 2px 2px}.px-qs{font-size:13px;opacity:.6;margin:0 2px 10px}',
    '.px-steps{display:flex;gap:4px;margin:2px 2px 14px}.px-steps span{flex:1;height:4px;border-radius:4px;background:rgba(255,255,255,.14)}.px-steps span.on{background:#2f9e8f}',
    '.px-ta{width:100%;box-sizing:border-box;min-height:120px;padding:12px;border-radius:14px;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.07);color:inherit;font:inherit;line-height:1.45;resize:vertical;outline:none}',
    '.px-in{width:100%;box-sizing:border-box;height:44px;padding:0 12px;border-radius:12px;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.07);color:inherit;font:inherit;outline:none;margin-top:8px}',
    '.px-na{display:inline-flex;align-items:center;gap:8px;margin:10px 2px;font-size:14px;cursor:pointer}',
    '.px-sec{margin:12px 0;padding:12px 14px;border-radius:16px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1)}.px-sec b{display:block;font-size:12px;letter-spacing:.04em;text-transform:uppercase;opacity:.6;margin-bottom:4px}.px-sec div{white-space:pre-line;line-height:1.45}.px-sec em{font-style:normal;opacity:.5}',
    '.px-ver{position:relative;padding:0 0 14px 18px;border-left:2px solid rgba(47,158,143,.5);margin-left:6px}.px-ver:before{content:"";position:absolute;left:-7px;top:2px;width:12px;height:12px;border-radius:50%;background:#2f9e8f}.px-ver small{opacity:.6;font-size:12px}.px-ver p{margin:4px 0 0;line-height:1.4}',
    '.px-cmp{display:grid;grid-template-columns:1fr 1fr;gap:8px}.px-cmp>div{padding:10px;border-radius:12px;background:rgba(255,255,255,.06);font-size:13.5px;white-space:pre-line}.px-cmp h5{margin:0 0 4px;font-size:11.5px;opacity:.6;text-transform:uppercase;letter-spacing:.04em}',
    'html.kn-light .px-ta,html.kn-light .px-in,html.kn-light .px-sec,html.kn-light .px-cmp>div{background:rgba(255,255,255,.85);border-color:rgba(0,0,0,.1)}'
  ].join('\n');
  function pcss() { css(); if (document.getElementById('px-css')) return; var s = document.createElement('style'); s.id = 'px-css'; s.textContent = PCSS; document.head.appendChild(s); }
  function chipLinks(list) { return (list || []).map(function (e) { return '<button type="button" class="dv-chip" data-pxopen="' + esc(JSON.stringify({ id: e.id, ref: e.ref, title: e.title })) + '">' + esc(look(e).title) + '</button>'; }).join(''); }

  // ---------------------------------------------------------------- a tool's home: its records
  function pxHome(tool) {
    pcss(); var T = PX[tool]; ui.pxTool = tool; ui.view = 'px-home'; X.head(T.name, 'home');
    var rs = pxAll(tool);
    X.ui.body.innerHTML = '<p class="cx-sub">' + esc(T.intro) + '</p><button type="button" class="dv-go cx-new" data-pxnew>＋ ' + (tool === 'my-life-possibilities' && rs.length ? 'Start a new one' : tool === 'my-changing-views' ? 'A view to follow' : 'Start') + '</button>' +
      (rs.length ? '<div class="dv-h">Saved</div>' + rs.map(function (r) { var a = cur(r), first = T.sections.map(function (s) { return a[s.id] && a[s.id].text; }).filter(Boolean)[0] || '';
        return '<button type="button" class="dv-row" data-pxrec="' + esc(r.id) + '"><div><b>' + esc(pxTitle(r)) + '</b><small>' + esc((r.versions ? r.versions.length + ' version' + (r.versions.length === 1 ? '' : 's') + ' · ' : '') + X.day(r.updatedAt) + (first ? ' · ' + first.slice(0, 60) : '')) + '</small></div><span class="cv">' + X.ICON.chev + '</span></button>'; }).join('') : '') +
      '<details class="wm-about" style="margin:16px 2px;font-size:13px;opacity:.75"><summary style="cursor:pointer">About ' + esc(T.name) + '</summary><p>' + esc(T.about) + '</p><p>Your answers are private, and you can edit or delete them any time. Nothing here changes your cards.</p></details>';
    X.foot('');
  }
  // ---------------------------------------------------------------- the step-by-step form (new record, a new Hegel version, or an edit)
  function pxStart(tool, o) {
    o = o || {}; var T = PX[tool]; ui.pxTool = tool;
    var prev = o.rec ? JSON.parse(JSON.stringify(o.rec)) : null;
    ui.px = { tool: tool, rec: prev, newVersion: !!o.newVersion, editVersion: o.editVersion != null ? o.editVersion : null, subject: prev ? JSON.parse(JSON.stringify(prev.subject || {})) : { title: '', item: o.item || null, url: '' }, answers: {}, evidence: prev && prev.evidence ? prev.evidence.slice() : [], step: 0 };
    if (prev && !o.newVersion) ui.px.answers = JSON.parse(JSON.stringify(o.editVersion != null ? prev.versions[o.editVersion].answers : (prev.versions ? cur(prev) : prev.answers || {})));
    if (prev && o.newVersion) { var last = cur(prev); ui.px.answers = { used: { text: (last.now && last.now.text) || '' } }; }
    if (o.item && !prev) { ui.px.subject.item = o.item; ui.px.subject.title = look(o.item).title; }
    ui.px.steps = (T.subject !== 'none' && !(prev && (o.newVersion || o.editVersion != null)) ? ['subject'] : []).concat(T.sections.map(function (s) { return s.id; })).concat(T.evidence ? ['evidence'] : []).concat(['review']);
    pxStep();
  }
  function pxKeep() {
    var P = ui.px; if (!P) return; var b = X.ui.body;
    var st = b.querySelector('[data-pxsub]'); if (st) P.subject.title = st.value;
    var su = b.querySelector('[data-pxurl]'); if (su) P.subject.url = su.value.trim();
    var ta = b.querySelector('[data-pxtext]'); if (ta) { var id = ta.getAttribute('data-pxtext'); P.answers[id] = Object.assign({}, P.answers[id] || {}, { text: ta.value }); }
    var yr = b.querySelector('[data-pxyear]'); if (yr) { var id2 = yr.getAttribute('data-pxyear'), y = parseInt(yr.value, 10); P.answers[id2] = Object.assign({}, P.answers[id2] || {}, { year: isFinite(y) && y > 0 ? y : null }); }
    b.querySelectorAll('[data-pxev]').forEach(function (e) { var i = +e.getAttribute('data-pxev'), k = e.getAttribute('data-k'); if (P.evidence[i]) P.evidence[i][k] = e.value; });
  }
  function pxStep() {
    pcss(); var P = ui.px, T = PX[P.tool], s = P.steps[P.step]; ui.view = 'px-form'; X.head(P.rec && !P.newVersion ? 'Edit' : P.newVersion ? 'Update my view' : T.name, P.rec ? 'px-detail' : 'px-home');
    var h = '<div class="px-steps">' + P.steps.map(function (x, i) { return '<span' + (i <= P.step ? ' class="on"' : '') + '></span>'; }).join('') + '</div>';
    if (s === 'subject') {
      h += '<div class="px-q">' + esc(T.subjectQ) + '</div><p class="px-qs">' + esc(T.subjectHint) + '</p>' +
        (P.subject.item ? '<button type="button" class="cx-slot set" data-pxpickitem>' + X.art({ title: P.subject.item.title, ref: P.subject.item.ref }) + '<div><b>' + esc(look(P.subject.item).title) + '</b><small>' + esc(where(P.subject.item) || '') + ' · tap to change</small></div></button><div class="dv-chips" style="margin-top:8px"><button type="button" class="dv-chip" data-pxnoitem>Remove the card</button></div>'
          : '<button type="button" class="cx-slot" data-pxpickitem><div><b>Choose a card</b><small>Optional — any card or item from your lists</small></div></button>') +
        (T.subject === 'item' && P.subject.item ? '' : '<input class="px-in" data-pxsub maxlength="200" placeholder="' + (T.subject === 'item' ? 'Or type the name of a thing' : T.subject === 'claim' ? 'e.g. Bats are blind' : 'e.g. Homework') + '" value="' + esc(P.subject.title || '') + '">') +
        (T.subject === 'claim' ? '<input class="px-in" data-pxurl type="url" placeholder="Source link (optional)" value="' + esc(P.subject.url || '') + '">' : '');
    } else if (s === 'evidence') {
      h += '<div class="px-q">Evidence</div><p class="px-qs">Optional — notes or links that support or question the claim.</p>' + P.evidence.map(function (e, i) { return '<div class="px-sec"><input class="px-in" style="margin-top:0" data-pxev="' + i + '" data-k="text" placeholder="What it shows" value="' + esc(e.text || '') + '"><input class="px-in" data-pxev="' + i + '" data-k="url" type="url" placeholder="Link (optional)" value="' + esc(e.url || '') + '"><div class="dv-chips" style="margin-top:8px"><button type="button" class="dv-chip" data-pxevdel="' + i + '">Remove</button></div></div>'; }).join('') +
        '<button type="button" class="dv-chip" data-pxevadd>＋ Add evidence</button>';
    } else if (s === 'review') {
      h += '<div class="px-q">' + esc(P.subject.title || (P.subject.item && look(P.subject.item).title) || T.name) + '</div><p class="px-qs">Check it over — you can go back to any step.</p>' + reviewHtml(T, P.answers, P.evidence);
    } else {
      var sec = T.sections.filter(function (x) { return x.id === s; })[0], a = P.answers[s] || {};
      h += '<div class="px-q">' + esc(sec.q) + '</div>' + (sec.sub ? '<p class="px-qs">' + esc(sec.sub) + '</p>' : '<p class="px-qs">Optional — skip if you like.</p>') +
        (sec.na ? '<label class="px-na"><input type="checkbox" data-pxna="' + s + '"' + (a.na ? ' checked' : '') + '> This doesn’t apply here</label>' : '') +
        (a.na ? '' : '<textarea class="px-ta" data-pxtext="' + s + '" placeholder="A word, a sentence, or more">' + esc(a.text || '') + '</textarea>') +
        (sec.year && !a.na ? '<input class="px-in" data-pxyear="' + s + '" inputmode="numeric" placeholder="A year (optional) — puts it in time" value="' + esc(a.year || '') + '">' : '') +
        (sec.links && !a.na ? '<div class="dv-h">' + esc(sec.linksLabel || 'Linked cards') + '</div><div class="dv-chips">' + (a.links || []).map(function (e, i) { return '<button type="button" class="dv-chip on" data-pxunlink="' + s + '|' + i + '">' + esc(look(e).title) + ' ×</button>'; }).join('') + '<button type="button" class="dv-chip" data-pxlink="' + s + '">＋ Link a card</button></div>' : '');
    }
    X.ui.body.innerHTML = h;
    var last = P.step === P.steps.length - 1;
    X.foot((P.step ? '<button type="button" class="dv-go sec" data-pxprev>Back</button>' : '') + (last ? '<button type="button" class="dv-go" data-pxsave>Save</button>' : '<button type="button" class="dv-go" data-pxnext>' + (s !== 'subject' && s !== 'evidence' && !((P.answers[s] || {}).text || (P.answers[s] || {}).na || ((P.answers[s] || {}).links || []).length) ? 'Skip' : 'Next') + '</button>'));
  }
  function reviewHtml(T, ans, ev) {
    return T.sections.map(function (s) { var a = ans[s.id] || {}; return '<div class="px-sec"><b>' + esc(s.q) + '</b>' + (a.na ? '<em>Doesn’t apply</em>' : a.text ? '<div>' + esc(a.text) + '</div>' : '<em>Skipped</em>') + (a.year ? '<div style="opacity:.7;margin-top:4px">' + esc(a.year) + '</div>' : '') + ((a.links || []).length ? '<div class="dv-chips" style="margin-top:8px">' + chipLinks(a.links) + '</div>' : '') + '</div>'; }).join('') +
      ((ev || []).filter(function (e) { return e.text || e.url; }).length ? '<div class="px-sec"><b>Evidence</b>' + ev.filter(function (e) { return e.text || e.url; }).map(function (e) { return '<div>• ' + esc(e.text || '') + (e.url ? ' <a href="' + esc(e.url) + '" target="_blank" rel="noopener" style="color:#64d2ff;word-break:break-all">' + esc(e.url) + '</a>' : '') + '</div>'; }).join('') + '</div>' : '');
  }
  function pxCommit() {
    pxKeep(); var P = ui.px, T = PX[P.tool];
    if (T.subject !== 'none' && !P.subject.item && !String(P.subject.title || '').trim() && !(P.rec && (P.newVersion || P.editVersion != null))) { P.step = 0; pxStep(); return X.toast('Name it first — or pick a card.'); }
    var answers = {}; Object.keys(P.answers).forEach(function (k) { var a = P.answers[k] || {}; var o = {}; if (a.na) o.na = true; if (String(a.text || '').trim()) o.text = String(a.text).trim().slice(0, 6000); if ((a.links || []).length) o.links = a.links; if (a.year) o.year = a.year; if (Object.keys(o).length) answers[k] = o; });
    var ev = (P.evidence || []).filter(function (e) { return String(e.text || '').trim() || String(e.url || '').trim(); }).map(function (e) { return { text: String(e.text || '').trim(), url: String(e.url || '').trim() }; });
    var subject = { title: String(P.subject.title || '').trim() || (P.subject.item ? look(P.subject.item).title : ''), item: P.subject.item ? snap(P.subject.item) : null, url: String(P.subject.url || '').trim() };
    var r;
    if (T.versions) {
      if (P.rec && P.editVersion != null) { r = KN().get('px:' + P.rec.id); var v = r.versions[P.editVersion]; v.history = (v.history || []).concat([{ at: Date.now(), answers: v.answers }]); v.answers = answers; v.edited = Date.now(); }   // an edit keeps the earlier wording too
      else if (P.rec && P.newVersion) { r = KN().get('px:' + P.rec.id); r.versions.push({ at: Date.now(), answers: answers }); }
      else r = { id: X.rid(), tool: P.tool, template: T.template, subject: subject, versions: [{ at: Date.now(), answers: answers }], createdAt: Date.now() };
    } else {
      r = P.rec ? Object.assign(KN().get('px:' + P.rec.id) || {}, { subject: subject, answers: answers, evidence: ev }) : { id: X.rid(), tool: P.tool, template: T.template, subject: subject, answers: answers, evidence: ev, createdAt: Date.now() };
    }
    if (P.rec && !T.versions) r.subject = subject;
    pxSave(r); X.hap('selection'); X.toast(P.newVersion ? 'New version saved — the earlier ones are kept' : 'Saved'); ui.px = null; pxDetail(r.id);
  }
  // ---------------------------------------------------------------- one record
  function pxDetail(id) {
    pcss(); var r = KN().get('px:' + id); if (!r) return pxHome(ui.pxTool); var T = PX[r.tool]; ui.pxTool = r.tool; ui.pxRec = id; ui.view = 'px-detail'; X.head(pxTitle(r), 'px-home');
    var h = (r.subject && r.subject.item ? '<div class="cx-item">' + X.art({ title: r.subject.item.title, ref: r.subject.item.ref }) + '<div><b>' + esc(look(r.subject.item).title) + '</b><small>' + esc(where(r.subject.item) || 'This card is no longer in your lists') + '</small></div></div>' : '') +
      (r.subject && r.subject.url ? '<p class="cx-sub">Source: <a href="' + esc(r.subject.url) + '" target="_blank" rel="noopener" style="color:#64d2ff;word-break:break-all">' + esc(r.subject.url) + '</a></p>' : '');
    if (T.versions) {
      var vs = r.versions || [];
      h += '<div class="dv-h">Now</div>' + reviewHtml(T, cur(r)) +
        '<div class="dv-h">How it changed · ' + vs.length + ' version' + (vs.length === 1 ? '' : 's') + '</div>' + vs.slice().reverse().map(function (v, ri) { var i = vs.length - 1 - ri, a = v.answers || {}; return '<div class="px-ver"><small>' + esc(X.day(v.at)) + (v.edited ? ' · edited' : '') + (i === vs.length - 1 ? ' · current' : '') + '</small>' + (a.now && a.now.text ? '<p><b>Thought:</b> ' + esc(a.now.text) + '</p>' : '') + (a.why && a.why.text ? '<p style="opacity:.75">Because: ' + esc(a.why.text) + '</p>' : '') + '<div class="dv-chips" style="margin-top:6px"><button type="button" class="dv-chip" data-pxeditv="' + i + '">Edit</button>' + (vs.length > 1 ? '<button type="button" class="dv-chip" data-pxcmp="' + i + '">Compare</button>' : '') + '</div></div>'; }).join('') +
        (ui.pxCmp ? cmpHtml(T, r) : '');
    } else h += reviewHtml(T, r.answers || {}, r.evidence);
    h += '<p class="dv-note">Private · only you can see this · ' + esc(X.day(r.updatedAt)) + '</p>';
    X.ui.body.innerHTML = h;
    X.foot('<button type="button" class="dv-go sec" data-pxdel style="color:#ff6b6b">Delete</button>' + (r.subject && r.subject.item && where(r.subject.item) ? '<button type="button" class="dv-go sec" data-pxcard>Card</button>' : '') + (T.versions ? '<button type="button" class="dv-go" data-pxupdate>Update my view</button>' : '<button type="button" class="dv-go" data-pxedit>Edit</button>'));
  }
  function cmpHtml(T, r) {
    var vs = r.versions, i = ui.pxCmp.a, j = ui.pxCmp.b; if (!vs[i] || !vs[j]) return '';
    var when = function (t) { var sameDay = X.day(vs[i].at) === X.day(vs[j].at); return X.day(t) + (sameDay ? ' ' + new Date(t).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : ''); };
    return '<div class="dv-h">Comparing ' + esc(when(vs[i].at)) + ' and ' + esc(when(vs[j].at)) + '</div>' + T.sections.map(function (s) { var x = (vs[i].answers[s.id] || {}).text || '—', y = (vs[j].answers[s.id] || {}).text || '—'; return '<div class="px-cmp" style="margin-bottom:8px"><div><h5>' + esc(s.q) + ' · then</h5>' + esc(x) + '</div><div><h5>' + esc(s.q) + ' · later</h5>' + esc(y) + '</div></div>'; }).join('');
  }
  // a card picker shared by the four tools
  function pxPick(cb, title) {
    pcss(); ui.view = 'px-pick'; ui.pxPickCb = cb; ui.pxpq = ''; X.head(title || 'Choose a card', 'px-form');
    X.ui.body.innerHTML = '<label class="cx-find"><input data-pxpq placeholder="Search your cards and items" autocomplete="off"></label><div data-pxplist></div>';
    pxDrawPick(); setTimeout(function () { var f = X.ui.body.querySelector('[data-pxpq]'); if (f) f.focus(); }, 80);
  }
  function pxDrawPick() { var box = X.ui.body.querySelector('[data-pxplist]'); if (!box) return; var cs = candidates(ui.pxpq); ui.pxCands = cs; box.innerHTML = cs.map(function (x, i) { return '<button type="button" class="cx-slot set" style="margin-bottom:6px;border-style:solid;border-color:rgba(255,255,255,.1);background:rgba(255,255,255,.05)" data-pxchoose="' + i + '">' + X.art({ title: x.title, ref: x.ref }) + '<div><b>' + esc(x.title) + '</b><small>' + esc(x.ctx) + '</small></div></button>'; }).join('') || '<div class="dv-empty">Nothing matches.</div>'; }

  function pxClick(t) {
    if (!/^px-/.test(ui.view || '')) return false;
    var g, P = ui.px;
    if ((g = t.closest('[data-back]'))) { var b = g.getAttribute('data-back'); if (b === 'px-home') { pxHome(ui.pxTool); return true; } if (b === 'px-detail') { pxDetail(ui.pxRec); return true; } if (b === 'px-form') { pxStep(); return true; } return false; }
    if (t.closest('[data-pxnew]')) { pxStart(ui.pxTool); return true; }
    if ((g = t.closest('[data-pxrec]'))) { ui.pxCmp = null; pxDetail(g.getAttribute('data-pxrec')); return true; }
    if (t.closest('[data-pxnext]')) { pxKeep(); P.step = Math.min(P.steps.length - 1, P.step + 1); X.ui.body.scrollTop = 0; pxStep(); return true; }
    if (t.closest('[data-pxprev]')) { pxKeep(); P.step = Math.max(0, P.step - 1); X.ui.body.scrollTop = 0; pxStep(); return true; }
    if (t.closest('[data-pxsave]')) { pxCommit(); return true; }
    if ((g = t.closest('[data-pxna]'))) { pxKeep(); var id = g.getAttribute('data-pxna'); P.answers[id] = Object.assign({}, P.answers[id] || {}, { na: g.checked }); setTimeout(pxStep, 0); return false; }
    if (t.closest('[data-pxpickitem]')) { pxKeep(); pxPick(function (x) { P.subject.item = { id: x.id, ref: x.ref, title: x.title }; if (!P.subject.title || PX[P.tool].subject === 'item') P.subject.title = x.title; pxStep(); }, 'Choose a card'); return true; }
    if (t.closest('[data-pxnoitem]')) { pxKeep(); P.subject.item = null; pxStep(); return true; }
    if ((g = t.closest('[data-pxlink]'))) { pxKeep(); var sid = g.getAttribute('data-pxlink'); pxPick(function (x) { var a = P.answers[sid] = Object.assign({}, P.answers[sid] || {}); a.links = (a.links || []).filter(function (e) { return e.id !== x.id; }).concat([{ id: x.id, ref: x.ref, title: x.title }]); pxStep(); }, 'Link a card'); return true; }
    if ((g = t.closest('[data-pxunlink]'))) { pxKeep(); var p = g.getAttribute('data-pxunlink').split('|'); P.answers[p[0]].links.splice(+p[1], 1); pxStep(); return true; }
    if (t.closest('[data-pxevadd]')) { pxKeep(); P.evidence.push({ text: '', url: '' }); pxStep(); return true; }
    if ((g = t.closest('[data-pxevdel]'))) { pxKeep(); P.evidence.splice(+g.getAttribute('data-pxevdel'), 1); pxStep(); return true; }
    if ((g = t.closest('[data-pxchoose]'))) { var x = ui.pxCands[+g.getAttribute('data-pxchoose')]; if (x && ui.pxPickCb) ui.pxPickCb(x); return true; }
    if ((g = t.closest('[data-pxopen]'))) { openCard(JSON.parse(g.getAttribute('data-pxopen'))); return true; }
    if (t.closest('[data-pxcard]')) { openCard(KN().get('px:' + ui.pxRec).subject.item); return true; }
    if (t.closest('[data-pxedit]')) { pxStart(ui.pxTool, { rec: KN().get('px:' + ui.pxRec) }); return true; }
    if (t.closest('[data-pxupdate]')) { pxStart(ui.pxTool, { rec: KN().get('px:' + ui.pxRec), newVersion: true }); return true; }
    if ((g = t.closest('[data-pxeditv]'))) { pxStart(ui.pxTool, { rec: KN().get('px:' + ui.pxRec), editVersion: +g.getAttribute('data-pxeditv') }); return true; }
    if ((g = t.closest('[data-pxcmp]'))) { var r = KN().get('px:' + ui.pxRec), i = +g.getAttribute('data-pxcmp'); ui.pxCmp = { a: i === r.versions.length - 1 ? i - 1 : i, b: i === r.versions.length - 1 ? i : r.versions.length - 1 }; pxDetail(ui.pxRec); setTimeout(function () { X.ui.body.scrollTop = X.ui.body.scrollHeight; }, 30); return true; }
    if (t.closest('[data-pxdel]')) { var rid0 = ui.pxRec; confirmBox('Delete “' + pxTitle(KN().get('px:' + rid0)) + '”' + (PX[ui.pxTool].versions ? ' and all its versions' : '') + '? Your cards stay as they are.').then(function (ok) { if (!ok) return; KN().set('px:' + rid0, null, true); X.toast('Deleted'); pxHome(ui.pxTool); }); return true; }
    return false;
  }
  function confirmBox(text) { return window.MinestKEdit ? MinestKEdit.confirm(text, 'Delete') : Promise.resolve(confirm(text)); }
  document.addEventListener('input', function (e) { if (ui.view === 'px-pick' && e.target && e.target.matches && e.target.matches('[data-pxpq]')) { ui.pxpq = e.target.value; pxDrawPick(); } });
  Object.keys(PX).forEach(function (id) {
    D.register({ id: id, group: 'philosophy', name: PX[id].name, sub: '', c1: '#2f9e8f', c2: '#1d6f66', pv: '', minItems: 0,
      start: function () { X.shell(); pxHome(id); }, config: function () { X.shell(); pxHome(id); }, open: function () { X.shell(); pxHome(id); }, progress: function () { return ''; },
      click: function (t) { return ui.pxTool === id ? pxClick(t) : false; },
      key: function (e) { if (e.key === 'Escape' && ui.pxTool === id && /^px-(form|pick)/.test(ui.view || '')) { e.stopPropagation(); if (ui.view === 'px-pick') pxStep(); else if (ui.px && ui.px.rec) pxDetail(ui.px.rec.id); else pxHome(id); return true; } return false; } });
  });
  function pxOpen(tool, o) { o = o || {}; if (window.MinestDiscover) D.open(); setTimeout(function () { X.shell(); pcss(); if (o.item) pxStart(tool, { item: o.item }); else pxHome(tool); }, 30); }
  // a card's edit bar: one "Explore…" button → choose a tool for this card
  function exploreMenu(e) {
    if (window.MinestDiscover) D.open();
    setTimeout(function () { X.shell(); css(); ui.view = 'cx-explore'; ui.cxExplore = e; X.head('Explore “' + look(e).title + '”', 'home');
      X.ui.body.innerHTML = '<p class="cx-sub">Pick a way to look at this card. Nothing changes the card itself.</p>' +
        [['connect-my-world', 'Connect My World', 'Link it to other things and say how they relate'], ['understand-this-thing', 'Understand This Thing', 'What it is made of, what makes it what it is, what produced it, what it is for'], ['what-can-i-know', 'What Can I Really Know?', 'Sort what you observed, learned and concluded about it'], ['my-changing-views', 'My Changing Views', 'Follow how your view of it changes over time']].map(function (x) { return '<button type="button" class="dv-row" data-cxtool="' + x[0] + '"><div><b>' + x[1] + '</b><small>' + x[2] + '</small></div><span class="cv">' + X.ICON.chev + '</span></button>'; }).join('');
      X.foot(''); }, 30);
  }

  if (window.MinestKEdit && MinestKEdit.globalExtra) MinestKEdit.globalExtra.push({ key: 'cx-explore', icon: LINK, label: 'Explore…', kinds: ['card', 'item'], run: function (t) { try { MinestKEdit.closeBar(); } catch (x) {} var e = itemFor(t.bid, t.id); if (e) exploreMenu(e); } });

  window.MinestPhilo = { ready: function (toolId) { return toolId === 'connect-my-world' || !!PX[toolId]; }, open: function (toolId, o) { if (toolId === 'connect-my-world') { if (window.MinestDiscover) D.open(); setTimeout(function () { ui.cxTpl = (o && o.template) || null; start(); }, 30); } else if (PX[toolId]) pxOpen(toolId, o); }, explore: function (o) { var e = o && o.bid ? itemFor(o.bid, o.id) : null; if (e) exploreMenu(e); }, records: pxAll,
    connect: connect, relations: all, of: of, graph: graph, types: TYPES, _undo: undo };
  window.MinestRelations = { all: all, of: of, graph: graph, types: TYPES };
})();
