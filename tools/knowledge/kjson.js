/* Minest Knowledge · JSON import (Phases 5–6) — "minest.knowledge/1" → a real Minest board, merged by id.
   One knowledge base: the JSON becomes ordinary lists and cards, so the Kanban, card details, learning progress,
   games, Contents, Outline, Map and Timeline all see it. View settings go to MinestKnowledge (synced side tables).
     template "regions":  subject → board · state → list · stage → section-heading card · block → card
     template "route":    subject → board · journey → list · stop → card (its place: places[] — lon/lat or x/y)
   Stable ids: board kb-<id>, list kl-<board>-<state>, stage ks-<board>-<stage>, block kc-<board>-<block>.
   Importing again merges: JSON items are updated in place, new ones added, cards you added yourself stay where they
   were (after the card they followed); items no longer in the JSON are only reported, never deleted.
   Before every import the board and its view settings are kept, so it can be undone (last 5, this device).
   Unknown fields are listed as warnings; missing coordinates are flagged, never made up. */
(function () {
  if (window.MinestKJ) return;
  var A = function () { return window.MinestAI || {}; };
  var KN = function () { return window.MinestKnowledge; };
  var UNDO = 'minest.kjson.undo';
  var PAL = ['#f18c4f', '#5097f4', '#49b07a', '#eabf3b', '#a381f2', '#eb5e55', '#61bd4f', '#e879b9'];
  function slug(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'x'; }
  function str(v, max) { return v == null ? '' : String(v).slice(0, max || 4000); }
  var KNOWN = {
    root: ['format', 'id', 'subject', 'template', 'route', 'states', 'categories', 'note', 'places', 'journeys', 'description', 'style', 'portal', 'items'],
    item: ['id', 'title', 'desc', 'image', 'date'],
    group: ['id', 'title', 'items', 'subs', 'icon', 'desc'],
    state: ['id', 'title', 'icon', 'color', 'desc', 'stages'],
    stage: ['id', 'title', 'desc', 'blocks', 'requires', 'icon'],
    block: ['id', 'title', 'desc', 'image', 'categories', 'date', 'preview'],
    place: ['id', 'title', 'lon', 'lat', 'x', 'y', 'desc'],
    journey: ['id', 'title', 'color', 'stops'],
    stop: ['place', 'title', 'desc', 'date']
  };
  function check(o, kind, where, warn) { Object.keys(o || {}).forEach(function (k) { if (KNOWN[kind].indexOf(k) < 0) warn.push(where + ': "' + k + '" is not a known field (ignored)'); }); }
  function needId(o, where, i) { var id = o && o.id != null ? String(o.id) : null; if (!id) throw new Error(where + ' #' + (i + 1) + ' has no "id" — ids keep your layout when you import again.'); return slug(id); }

  // ---------------------------------------------------------------- JSON → { board, view settings, dates }
  function build(J) {
    if (!J || typeof J !== 'object') throw new Error('This is not a JSON object.');
    if (J.format && J.format !== 'minest.knowledge/1') throw new Error('Unknown format "' + J.format + '" (expected minest.knowledge/1).');
    var warn = [], tpl = J.template === 'route' ? 'route' : J.template === 'wiki' ? 'wiki' : 'regions';
    check(J, 'root', 'root', warn);
    if (!J.subject) throw new Error('"subject" is missing.');
    var bid = 'kb-' + slug(J.id || J.subject);
    var board = { id: bid, title: str(J.subject, 200), columns: [], labelDefinitions: [], archivedCards: [], linkedBoardIds: [], showLabelNames: false }, dates = {}, cats = {}, cfg = { template: tpl, note: J.note ? str(J.note, 400) : '' };
    var wiki = null;
    if (tpl === 'wiki') {
      // template "wiki": items once each (cards), categories that point at them — an item can sit in many categories
      if (!Array.isArray(J.items) || !J.items.length) throw new Error('"items" is missing or empty.');
      if (!J.categories || !Array.isArray(J.categories.groups) || !J.categories.groups.length) throw new Error('"categories.groups" is missing or empty.');
      var items = {}, order = [];
      J.items.forEach(function (it, i) { check(it, 'item', 'item ' + (it.id || i + 1), warn); var iid = needId(it, 'item', i); items[iid] = it; order.push(iid); });
      var home = {}, used = {};
      function walkG(g, gi, path) {
        check(g, 'group', 'category ' + (g.id || gi + 1), warn);
        var gid = needId(g, 'category', gi), node = { id: gid, title: str(g.title || g.id, 160), icon: g.icon ? str(g.icon, 8) : '', items: [], subs: [] };
        (Array.isArray(g.items) ? g.items : []).forEach(function (r) { var iid = slug(r); if (!items[iid]) { warn.push('Category ' + gid + ': unknown item "' + r + '" (skipped)'); return; } node.items.push('kc-' + bid + '-' + iid); used[iid] = 1; if (!home[iid]) home[iid] = path[0]; });
        (Array.isArray(g.subs) ? g.subs : []).forEach(function (sg, k) { node.subs.push(walkG(sg, k, path.concat([gid]))); });
        return node;
      }
      var groups = J.categories.groups.map(function (g, gi) { var gid = needId(g, 'category', gi); return walkG(g, gi, [gid]); });
      // the Kanban needs one home list per card: the first top-level category it appears in
      groups.forEach(function (g, gi) { board.columns.push({ id: 'kl-' + bid + '-' + g.id, title: g.title, color: PAL[gi % PAL.length], cards: [] }); });
      var other = null;
      order.forEach(function (iid) {
        var it = items[iid], c = { id: 'kc-' + bid + '-' + iid, title: str(it.title || it.id, 200), desc: str(it.desc) };
        if (it.image) c.cover = { type: 'image', url: str(it.image, 2000) };
        if (it.date && typeof it.date.y === 'number') dates[c.id] = it.date;
        var col = home[iid] ? board.columns.filter(function (x) { return x.id === 'kl-' + bid + '-' + home[iid]; })[0] : null;
        if (!col) { if (!other) { other = { id: 'kl-' + bid + '-uncategorised', title: 'Not in a category', color: '#8d99ae', cards: [] }; board.columns.push(other); } col = other; warn.push('Item "' + iid + '" is in no category — it is on the board under "Not in a category".'); }
        col.cards.push(c);
      });
      var portal = J.portal || {};
      wiki = { title: str(J.categories.title || J.subject, 160), groups: groups,
        portal: { title: str(portal.title || J.subject, 160), intro: str(portal.intro, 600), areas: (Array.isArray(portal.areas) ? portal.areas : []).map(function (a) { return { group: slug(a.group), icon: str(a.icon, 8), desc: str(a.desc, 200) }; }) } };
      cfg.template = 'wiki';
    } else if (tpl === 'regions') {
      if (!Array.isArray(J.states) || !J.states.length) throw new Error('"states" is missing or empty.');
      cfg.mode = J.route && J.route.mode === 'free' ? 'free' : 'guided';
      cfg.order = []; cfg.states = {}; cfg.requires = {}; cfg.stageOf = {};
      J.states.forEach(function (st, i) {
        check(st, 'state', 'state ' + (st.id || i + 1), warn);
        var sid = needId(st, 'state', i), lid = 'kl-' + bid + '-' + sid;
        var col = { id: lid, title: str(st.title || st.id, 200), color: st.color || PAL[i % PAL.length], cards: [] };
        cfg.states[lid] = { icon: st.icon ? str(st.icon, 8) : '', desc: str(st.desc, 400) };
        (Array.isArray(st.stages) ? st.stages : []).forEach(function (sg, j) {
          check(sg, 'stage', 'stage ' + (sg.id || j + 1), warn);
          var gid = needId(sg, 'stage', j), cid = 'ks-' + bid + '-' + gid;
          col.cards.push({ id: cid, title: str(sg.title || sg.id, 200), desc: str(sg.desc), __heading: true });
          cfg.order.push(cid);
          if (sg.icon) (cfg.icons = cfg.icons || {})[cid] = str(sg.icon, 8);
          if (Array.isArray(sg.requires)) cfg.requires[cid] = sg.requires.map(function (r) { return 'ks-' + bid + '-' + slug(r); });
          (Array.isArray(sg.blocks) ? sg.blocks : []).forEach(function (bk, k) {
            check(bk, 'block', 'block ' + (bk.id || k + 1), warn);
            var kid = 'kc-' + bid + '-' + needId(bk, 'block', k);
            var c = { id: kid, title: str(bk.title || bk.id, 200), desc: str(bk.desc) };
            if (bk.image) c.cover = { type: 'image', url: str(bk.image, 2000) };
            col.cards.push(c);
            cfg.stageOf[kid] = cid;   // the Kanban may reorder cards (mastered ones sink): the stage is kept by id
            if (bk.date && typeof bk.date.y === 'number') dates[kid] = bk.date;
            if (Array.isArray(bk.categories)) cats[kid] = bk.categories.map(function (x) { return str(x, 80); });
          });
        });
        board.columns.push(col);
      });
      if (J.route && Array.isArray(J.route.order)) cfg.order = J.route.order.map(function (r) { return 'ks-' + bid + '-' + slug(r); }).filter(function (id) { return cfg.order.indexOf(id) >= 0; }).concat(cfg.order.filter(function (id) { return J.route.order.map(function (r) { return 'ks-' + bid + '-' + slug(r); }).indexOf(id) < 0; }));
    } else {
      if (!Array.isArray(J.places) || !J.places.length) throw new Error('"places" is missing or empty.');
      if (!Array.isArray(J.journeys) || !J.journeys.length) throw new Error('"journeys" is missing or empty.');
      var places = {}, lons = [], lats = [];
      J.places.forEach(function (p, i) {
        check(p, 'place', 'place ' + (p.id || i + 1), warn);
        var pid = needId(p, 'place', i);
        places[pid] = { id: pid, title: str(p.title || p.id, 120), lon: num(p.lon), lat: num(p.lat), x: num(p.x), y: num(p.y), desc: str(p.desc, 400) };
        if (places[pid].lon != null && places[pid].lat != null) { lons.push(places[pid].lon); lats.push(places[pid].lat); }
      });
      // lon / lat → map units (equirectangular, cos-corrected), fitted to 1000 × 620; x / y (0–1000, 0–620) used as given
      var missing = [];
      if (lons.length) {
        var lo0 = Math.min.apply(0, lons), lo1 = Math.max.apply(0, lons), la0 = Math.min.apply(0, lats), la1 = Math.max.apply(0, lats);
        var k = Math.cos((la0 + la1) / 2 * Math.PI / 180), w = Math.max(.01, (lo1 - lo0) * k), h = Math.max(.01, la1 - la0);
        var sc = Math.min(880 / w, 520 / h), ox = (1000 - w * sc) / 2, oy = (620 - h * sc) / 2;
        Object.keys(places).forEach(function (id) { var p = places[id]; if (p.x == null && p.lon != null && p.lat != null) { p.x = Math.round(ox + (p.lon - lo0) * k * sc); p.y = Math.round(oy + (la1 - p.lat) * sc); } });
      }
      Object.keys(places).forEach(function (id, i) { var p = places[id]; if (p.x == null || p.y == null) { missing.push(p.title); p.x = 60 + (i % 12) * 80; p.y = 590; p.noPos = true; } });
      if (missing.length) warn.push('No coordinates for: ' + missing.join(', ') + ' — placed in a row at the bottom; add lon/lat or x/y.');
      cfg.places = places; cfg.journeys = [];
      J.journeys.forEach(function (jn, i) {
        check(jn, 'journey', 'journey ' + (jn.id || i + 1), warn);
        var jid = needId(jn, 'journey', i), lid = 'kl-' + bid + '-' + jid;
        var col = { id: lid, title: str(jn.title || jn.id, 200), color: jn.color || PAL[i % PAL.length], cards: [] }, stops = [];
        (Array.isArray(jn.stops) ? jn.stops : []).forEach(function (s, k) {
          check(s, 'stop', 'stop ' + (k + 1) + ' of ' + jid, warn);
          var pid = slug(s.place); if (!places[pid]) { warn.push('Journey ' + jid + ', stop ' + (k + 1) + ': unknown place "' + s.place + '" (skipped)'); return; }
          var cid = 'kc-' + bid + '-' + jid + '-' + (k + 1) + '-' + pid;
          col.cards.push({ id: cid, title: (k + 1) + '. ' + (s.title ? str(s.title, 200) : places[pid].title), desc: str(s.desc) });
          stops.push({ cardId: cid, place: pid });
          if (s.date && typeof s.date.y === 'number') dates[cid] = s.date;
        });
        cfg.journeys.push({ listId: lid, title: col.title, color: col.color, stops: stops });
        board.columns.push(col);
      });
    }
    if (J.categories) cfg.categories = J.categories;
    return { board: board, cfg: cfg, dates: dates, cats: cats, warn: warn, wiki: wiki };
  }
  function num(v) { return typeof v === 'number' && isFinite(v) ? v : null; }

  // ---------------------------------------------------------------- merge into the boards
  function fresh(c) { return Object.assign({ labels: [], complete: false, mastery: 1, createdAt: Date.now(), checklistItems: [] }, c); }
  function mergeBoard(old, nb) {
    if (!old) { nb.columns.forEach(function (col) { col.cards = col.cards.map(function (c) { var x = fresh(c); delete x.__heading; return x; }); }); return { board: nb, added: count(nb), updated: 0, gone: [] }; }
    var b = JSON.parse(JSON.stringify(old)), added = 0, updated = 0, gone = [];
    var jsonIds = {}; nb.columns.forEach(function (c) { jsonIds[c.id] = 1; c.cards.forEach(function (k) { jsonIds[k.id] = 1; }); });
    b.title = nb.title;
    var oldCols = {}; b.columns.forEach(function (c) { oldCols[c.id] = c; });
    var cols = nb.columns.map(function (nc) {
      var oc = oldCols[nc.id];
      if (!oc) { added += nc.cards.length; return Object.assign({}, nc, { cards: nc.cards.map(function (c) { var x = fresh(c); delete x.__heading; return x; }) }); }
      var oldCards = {}; (oc.cards || []).forEach(function (c) { oldCards[c.id] = c; });
      var seq = nc.cards.map(function (c) {
        var o = oldCards[c.id];
        if (!o) { added++; var x = fresh(c); delete x.__heading; return x; }
        if (o.title !== c.title || (o.desc || '') !== (c.desc || '')) updated++;
        var m = Object.assign({}, o, { title: c.title, desc: c.desc }); if (c.cover) m.cover = c.cover; return m;
      });
      // your own cards keep their place: right after the card they followed
      (oc.cards || []).forEach(function (c, i) {
        if (jsonIds[c.id]) return;
        if (/^k[sc]-/.test(c.id)) { gone.push(c.title); }
        var prev = i > 0 ? oc.cards[i - 1].id : null, at = prev ? seq.findIndex(function (x) { return x.id === prev; }) : -1;
        seq.splice(at + 1, 0, c);
      });
      return Object.assign({}, oc, { title: nc.title, color: oc.color || nc.color, cards: seq });
    });
    // lists you added (not from the JSON) stay at the end
    b.columns.forEach(function (c) { if (!jsonIds[c.id]) { if (/^kl-/.test(c.id)) gone.push(c.title); cols.push(c); } });
    b.columns = cols;
    return { board: b, added: added, updated: updated, gone: gone };
  }
  function count(b) { return b.columns.reduce(function (a, c) { return a + c.cards.length; }, 0); }

  function importJSON(J, opts) {
    var r = build(typeof J === 'string' ? JSON.parse(J) : J);
    var ai = A(); if (!ai.boards || !ai.updateBoard || !ai.addBoard) throw new Error('The board is still loading — try again in a moment.');
    var old = ai.boards().filter(function (b) { return b.id === r.board.id; })[0] || null;
    var headings = []; r.board.columns.forEach(function (c) { c.cards.forEach(function (k) { if (k.__heading) headings.push(k.id); }); });
    var m = mergeBoard(old, r.board);
    // undo point: the board as it was (or "not there"), and the view settings this import replaces
    var cfgKey = 'lm:cfg:' + r.board.id;
    var u = loadUndo(); u.unshift({ at: Date.now(), bid: r.board.id, title: r.board.title, board: old, cfg: KN().get(cfgKey), tree: KN().get('wk:tree:' + r.board.id) }); saveUndo(u.slice(0, 5));
    if (old) ai.updateBoard(r.board.id, function () { return m.board; }); else ai.addBoard(m.board, opts && opts.select !== false);
    headings.forEach(function (id) { if (!KN().isHeading(id)) KN().setHeading(id, true); });
    var prevCfg = KN().get(cfgKey) || {};
    // keep what you changed in the view (route mode) when importing again
    if (prevCfg.mode && old) r.cfg.mode = prevCfg.mode;
    KN().set(cfgKey, r.cfg, true);
    Object.keys(r.dates).forEach(function (id) { if (!KN().dateOf(id)) KN().setDate(id, r.dates[id]); });
    if (r.wiki) { var wk = 'wk:tree:' + r.board.id; if (!KN().get(wk) || (opts && opts.replaceCategories)) KN().set(wk, r.wiki, true); else r.warn.push('Kept your edited categories (import with "replace categories" to start over).'); }
    var cm = {}; Object.keys(r.cats).forEach(function (id) { if (KN().get('wk:cat:' + id) == null) cm['wk:cat:' + id] = r.cats[id]; });
    if (Object.keys(cm).length) KN().setMany(cm);
    if (old && opts && opts.select !== false && ai.selectBoard) ai.selectBoard(r.board.id);
    return { boardId: r.board.id, title: r.board.title, template: r.cfg.template, isNew: !old, added: m.added, updated: m.updated, gone: m.gone, warnings: r.warn };
  }
  function loadUndo() { try { return JSON.parse(localStorage.getItem(UNDO) || '[]'); } catch (e) { return []; } }
  function saveUndo(u) { try { localStorage.setItem(UNDO, JSON.stringify(u)); } catch (e) { try { localStorage.setItem(UNDO, JSON.stringify(u.slice(0, 1))); } catch (x) {} } }
  function undo() {
    var u = loadUndo(), last = u.shift(); if (!last) return null;
    var ai = A();
    if (last.board) ai.updateBoard(last.bid, function () { return last.board; });
    else if (ai.removeBoard) ai.removeBoard(last.bid);
    KN().set('lm:cfg:' + last.bid, last.cfg, true);
    KN().set('wk:tree:' + last.bid, last.tree || null, true);
    saveUndo(u);
    return last;
  }

  window.MinestKJ = { importJSON: importJSON, build: build, undo: undo, undoList: function () { return loadUndo().map(function (x) { return { at: x.at, title: x.title }; }); }, samples: function () { return window.__MINEST_KN_SAMPLES || {}; } };
})();
