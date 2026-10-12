/* Minest · List of Mine — the Worldview Template Engine (Phase B / C)
   Choose a template → preview its world (switch off what you don't want) → one tap makes it a real Minest board.
   One World = one board. Each template says what its levels become (here: domain → list, category → section heading
   card, "My …" list → card, the things you add → stacked cards), so every view (Kanban, Contents, Outline, Map,
   Portal …) shows the world with nothing copied.
   Templates (format "minest.world/1"): built in (tools/knowledge/templates/*.json → window.__MINEST_WORLD_TEMPLATES)
   or the user's own ('lom:tpl:<id>', synced; made with "Save as my template", or imported from a JSON file).
   Stable ids: every list / heading / card id comes from the template's ids (board id + template id + item id), so
   generating again — or a newer template version — only adds what is missing: nothing is deleted, nothing doubled,
   and a name the user changed stays (the template's own name is kept in 'lom:orig:<id>' to tell the difference).
   A world remembers its templates in 'lom:world:<board>'. Every generate can be undone (this device, last 5). */
(function () {
  if (window.MinestWorld) return;
  var A = function () { return window.MinestAI || {}; };
  var KN = function () { return window.MinestKnowledge; };
  var UNDO = 'minest.world.undo';
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function slug(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'x'; }
  function toast(m) { try { if (window.GlassUI && GlassUI.toast) GlassUI.toast(m); } catch (e) {} }
  function boards() { try { return (A().boards && A().boards()) || []; } catch (e) { return []; } }
  function boardById(id) { return boards().filter(function (b) { return b.id === id; })[0] || null; }
  var PAL = ['#2f6fd6', '#2e9e6b', '#f0965a', '#a78bfa', '#e85d9c', '#5a9cf0', '#c8873a', '#38bdf8', '#4caf50', '#e57373'];

  // ================================================================== templates
  function check(t) {
    if (!t || typeof t !== 'object') throw new Error('This is not a template.');
    if (t.format && t.format !== 'minest.world/1') throw new Error('Unknown format "' + t.format + '" (expected minest.world/1).');
    if (!t.id || !t.name) throw new Error('A template needs an "id" and a "name".');
    if (!Array.isArray(t.domains) || !t.domains.length) throw new Error('"domains" is missing or empty.');
    var seen = {};
    t.domains.forEach(function (d, i) {
      if (!d.id || !d.title) throw new Error('Area #' + (i + 1) + ' needs an "id" and a "title".');
      if (seen['d' + d.id]) throw new Error('Two areas share the id "' + d.id + '".'); seen['d' + d.id] = 1;
      (d.categories || []).forEach(function (c, j) {
        if (!c.id || !c.title) throw new Error(d.title + ': category #' + (j + 1) + ' needs an "id" and a "title".');
        if (seen['c' + c.id]) throw new Error('Two categories share the id "' + c.id + '".'); seen['c' + c.id] = 1;
        (c.lists || []).forEach(function (l, k) { if (!l.id || !l.title) throw new Error(c.title + ': list #' + (k + 1) + ' needs an "id" and a "title".'); });
      });
    });
    return t;
  }
  function templates() {
    var built = window.__MINEST_WORLD_TEMPLATES || {}, out = [];
    ['my-life', 'everyday-food', 'everyday-memory', 'everyday-nature', 'everyday-cultural', 'everyday-places', 'everyday-creative', 'everyday-maker', 'everyday-family', 'whole-earth', 'my-museum', 'britannica', 'dewey', 'my-academic-skills', 'my-life-skills', 'philosophy-spinoza', 'philosophy-aristotle', 'philosophy-kant', 'philosophy-hegel', 'philosophy-heidegger', 'kant', 'aristotle', 'encyclopedie', 'bacon'].concat(Object.keys(built)).forEach(function (k) { if (built[k] && out.indexOf(built[k]) < 0) out.push(built[k]); });
    (KN() ? KN().keys('lom:tpl:') : []).forEach(function (k) { var t = KN().get(k); if (t && t.domains) out.push(Object.assign({ mine: true }, t)); });
    return out;
  }
  function tplById(id) { return templates().filter(function (t) { return t.id === id; })[0] || null; }
  function worlds() { return (KN() ? KN().keys('lom:world:') : []).map(function (k) { var b = boardById(k.slice(10)); return b ? { b: b, w: KN().get(k) } : null; }).filter(Boolean); }

  // ================================================================== generate (new world, or more of a template into a world)
  // sel: { off: {domainId|categoryId: 1} } — what the user switched off in the preview
  function newCard(id, title) { return { id: id, title: title, desc: '', labels: [], complete: false, createdAt: Date.now(), mastery: 1, checklistItems: [] }; }
  function plan(t, bid, sel) {
    var off = (sel && sel.off) || {}, codes = !!(sel && sel.codes && t.codes), tid = slug(t.id), out = { lists: [], counts: { lists: 0, sections: 0, cards: 0 } };
    var depth = (sel && sel.depth) || t.defaultDepth || 'standard', names = (sel && sel.names) || {}, reuseCols = (sel && sel.reuseCols) || {}, reuseLists = (sel && sel.reuseLists) || {};
    out.alias = {};
    function nm(key, title) { return names[key] ? { title: names[key], orig: null } : { title: title, orig: title }; }   // a name typed in the preview is the user's (a later template update never replaces it)
    t.domains.forEach(function (d, i) {
      if (off[d.id]) return;
      var dn = nm(d.id, (codes && d.code ? d.code + ' ' : '') + d.title);
      var L = { id: reuseCols[d.id] || bid + '-d-' + tid + '-' + slug(d.id), title: dn.title, orig: dn.orig, color: d.color || PAL[i % PAL.length], items: [], reused: !!reuseCols[d.id] };
      if (d.lists && !d.categories) {   // two levels: the area's lists go straight in (no section heading)
        var F = { id: null, flat: true, lists: [] };
        d.lists.forEach(function (l) {
          var lk = 'l:' + d.id + '/' + l.id; if (off[lk]) return;
          var lid = bid + '-l-' + tid + '-' + slug(d.id) + '-' + slug(l.id), ln = nm(lk, l.title);
          if (reuseLists[lk]) { out.alias[lid] = reuseLists[lk]; return; }
          F.lists.push({ id: lid, title: ln.title, orig: ln.orig });
          if (depth === 'complete') (l.lists || []).forEach(function (x) { var xk = lk + '/' + x.id; if (off[xk]) return; var xn = nm(xk, x.title); F.lists.push({ id: lid + '-' + slug(x.id), title: xn.title, orig: xn.orig, parent: lid }); });
        });
        L.items.push(F);
      }
      (d.categories || []).forEach(function (c) {
        if (off[c.id]) return;
        var cn = nm(c.id, c.title);
        var H = { id: bid + '-c-' + tid + '-' + slug(c.id), title: cn.title, orig: cn.orig, heading: depth !== 'simple', asCard: depth === 'simple', lists: [] };
        if (depth !== 'simple') (c.lists || []).forEach(function (l) {
          var lk = 'l:' + c.id + '/' + l.id; if (off[lk]) return;
          var lid = bid + '-l-' + tid + '-' + slug(c.id) + '-' + slug(l.id), ln = nm(lk, (codes && l.code ? l.code + ' ' : '') + l.title);
          if (reuseLists[lk]) { out.alias[lid] = reuseLists[lk]; return; }
          H.lists.push({ id: lid, title: ln.title, orig: ln.orig });
          if (depth === 'complete') (l.lists || []).forEach(function (x) { var xk = lk + '/' + x.id; if (off[xk]) return; var xn = nm(xk, x.title); H.lists.push({ id: lid + '-' + slug(x.id), title: xn.title, orig: xn.orig, parent: lid }); });
        });
        L.items.push(H);
      });
      out.lists.push(L);
    });
    return out;
  }
  function counts(p, b) {
    var have = {}, n = { lists: 0, sections: 0, cards: 0 };
    if (b) (b.columns || []).forEach(function (c) { have[c.id] = 1; (c.cards || []).forEach(function (k) { have[k.id] = 1; }); });
    p.lists.forEach(function (L) { if (!have[L.id]) n.lists++; L.items.forEach(function (H) { if (!H.flat && !have[H.id]) { if (H.asCard) n.cards++; else n.sections++; } H.lists.forEach(function (x) { if (!have[x.id]) n.cards++; }); }); });
    return n;
  }
  var MADE = {}, USER = '\u0001user';   // lom:orig = USER: named by the user, never replaced by a template update
  function generate(t, sel, intoBid) {
    check(t);
    var ai = A(); if (!ai.addBoard || !ai.updateBoard) throw new Error('The board is still loading — try again in a moment.');
    var old = intoBid ? boardById(intoBid) : null;
    if (intoBid && !old) throw new Error('That world is not here any more.');
    // a new id — also never one handed out moments ago (a new board takes a moment to show up in boards())
    var bid = old ? old.id : (function () { var base = 'lw-' + slug(t.id), id = base, n = 2; while (boardById(id) || MADE[id]) id = base + '-' + (n++); MADE[id] = 1; return id; })();
    var p = plan(t, bid, sel), orig = {}, heads = [], stage = {};
    var b = old ? JSON.parse(JSON.stringify(old)) : { id: bid, title: t.worldTitle || t.name, columns: [], labelDefinitions: [], archivedCards: [], linkedBoardIds: [], showLabelNames: false };
    var byId = {}; (b.columns || []).forEach(function (c) { byId[c.id] = c; (c.cards || []).forEach(function (k) { byId[k.id] = k; }); });
    // a name from the template is updated only while the user has not renamed it
    function name(o, title, tplTitle) { var was = KN().get('lom:orig:' + o.id); if (tplTitle === null) { o.title = title; orig['lom:orig:' + o.id] = USER; return; } if (was == null || o.title === was) o.title = title; orig['lom:orig:' + o.id] = was === USER && o.title !== title ? USER : title; }
    function first(id, tplTitle) { orig['lom:orig:' + id] = tplTitle === null ? USER : tplTitle; }
    var parents = {};
    var prevCol = null;
    p.lists.forEach(function (L) {
      var col = byId[L.id];
      if (!col) {   // a new area goes where the template has it: after the area before it (else at the end)
        col = { id: L.id, title: L.title, color: L.color, cards: [] };
        var at = prevCol ? b.columns.indexOf(prevCol) : -1;
        if (at >= 0) b.columns.splice(at + 1, 0, col); else if (!prevCol && old) b.columns.push(col); else b.columns.push(col);
      }
      else if (!L.reused) name(col, L.title, L.orig);
      if (!L.reused && (!byId[L.id] || !orig['lom:orig:' + L.id])) first(L.id, L.orig);
      col.cards = col.cards || [];
      L.items.forEach(function (H) {
        if (H.flat) {
          var lastC = null;
          H.lists.forEach(function (x) {
            var c = byId[x.id];
            if (!c) { c = newCard(x.id, x.title); var at2 = lastC ? col.cards.indexOf(lastC) + 1 : col.cards.length; col.cards.splice(at2 > 0 ? at2 : col.cards.length, 0, c); first(x.id, x.orig); }
            else name(c, x.title, x.orig);
            lastC = c; if (x.parent) parents['lom:parent:' + x.id] = x.parent;
          });
          return;
        }
        var h = byId[H.id];
        if (!h) { h = newCard(H.id, H.title); col.cards.push(h); first(H.id, H.orig); } else name(h, H.title, H.orig);
        if (H.heading) heads.push(H.id);
        var at = col.cards.indexOf(h);
        H.lists.forEach(function (x) {
          var c = byId[x.id];
          if (!c) { c = newCard(x.id, x.title); var i = col.cards.indexOf(h); var j = i + 1; while (j < col.cards.length && stage[col.cards[j].id] === H.id) j++; col.cards.splice(at >= 0 ? Math.max(j, at + 1) : col.cards.length, 0, c); first(x.id, x.orig); }
          else name(c, x.title, x.orig);
          stage[x.id] = H.id; if (x.parent) parents['lom:parent:' + x.id] = x.parent;
        });
      });
      prevCol = col;
    });
    // one undo step: the board as it was (or "not there")
    var u = loadUndo(); u.unshift({ at: Date.now(), bid: bid, board: old, title: b.title, cfg: KN().get('lm:cfg:' + bid), world: KN().get('lom:world:' + bid) }); saveUndo(u.slice(0, 5));
    if (old) ai.updateBoard(bid, function () { return b; }); else ai.addBoard(b, true);
    heads.forEach(function (id) { if (!KN().isHeading(id)) KN().setHeading(id, true); });
    var cfg = Object.assign({}, KN().get('lm:cfg:' + bid) || {}); cfg.stageOf = Object.assign({}, cfg.stageOf || {}, stage);   // sections keep their lists (the Kanban may reorder)
    var w = Object.assign({ created: Date.now(), templates: {} }, KN().get('lom:world:' + bid) || {}); w.templates = Object.assign({}, w.templates); w.templates[t.id] = { version: t.version || 1, name: t.name, at: Date.now(), off: (sel && sel.off) || {}, codes: !!(sel && sel.codes), depth: (sel && sel.depth) || t.defaultDepth || 'standard' };
    var m = {}; m['lm:cfg:' + bid] = cfg; m['lom:world:' + bid] = w; Object.keys(orig).forEach(function (k) { m[k] = orig[k]; }); Object.keys(parents).forEach(function (k) { m[k] = parents[k]; }); Object.keys(p.alias || {}).forEach(function (k) { m['lom:alias:' + k] = p.alias[k]; });   // a template list that is one of yours: remembered, not copied
    if (t.kind === 'skills') {   // the Unified Skill record of each skill card: 'sk:<card>' (the learner's status / proficiency survive)
      var tid = slug(t.id), off = (sel && sel.off) || {};
      t.domains.forEach(function (d) { if (off[d.id]) return; (d.categories || []).forEach(function (c) { if (off[c.id]) return; (c.lists || []).forEach(function (x) {
        var cid = bid + '-l-' + tid + '-' + slug(c.id) + '-' + slug(x.id), prev = KN().get('sk:' + cid) || {};
        m['sk:' + cid] = Object.assign({}, prev, { tpl: t.id, sid: x.id, kind: t.skillKind || 'life', subject: d.subject || null, grades: d.grade ? [d.grade] : [], group: c.title, area: d.title, std: x.standards || [], src: t.sources || [] });
      }); }); });
    }
    KN().setMany(m);
    return { bid: bid, isNew: !old, title: b.title };
  }
  function loadUndo() { try { return JSON.parse(localStorage.getItem(UNDO) || '[]'); } catch (e) { return []; } }
  function saveUndo(u) { try { localStorage.setItem(UNDO, JSON.stringify(u)); } catch (e) { try { localStorage.setItem(UNDO, JSON.stringify(u.slice(0, 1))); } catch (x) {} } }
  function undo() {
    var u = loadUndo(), last = u.shift(); if (!last) return null;
    var ai = A();
    if (last.board) ai.updateBoard(last.bid, function () { return last.board; }); else if (ai.removeBoard) ai.removeBoard(last.bid);
    var m = {}; m['lm:cfg:' + last.bid] = last.cfg || null; m['lom:world:' + last.bid] = last.world || null; KN().setMany(m);
    saveUndo(u); return last;
  }

  // ================================================================== a world (any board) → a template of your own
  function fromBoard(b, name) {
    var stageOf = ((KN().get('lm:cfg:' + b.id) || {}).stageOf) || {};
    var t = { format: 'minest.world/1', id: 'my-' + slug(name || b.title) + '-' + Date.now().toString(36), name: name || b.title, version: 1, description: 'Made from “' + b.title + '”.', inspiration: 'Your own template.', levels: { domain: 'list', category: 'section', list: 'card', item: 'stack' }, domains: [] };
    (b.columns || []).forEach(function (col) {
      var d = { id: slug(col.title) + '-' + slug(col.id).slice(-6), title: col.title, color: col.color, categories: [] }, secs = {}, cur = null, loose = null;
      (col.cards || []).forEach(function (c) {
        if (!c || !c.id) return;
        if (KN().isHeading(c.id)) { cur = secs[c.id] = { id: slug(c.title) + '-' + slug(c.id).slice(-6), title: c.title, lists: [] }; d.categories.push(cur); return; }
        var into = (stageOf[c.id] && secs[stageOf[c.id]]) || cur;
        if (!into) { if (!loose) { loose = { id: 'general-' + slug(col.id).slice(-6), title: 'General', lists: [] }; d.categories.unshift(loose); } into = loose; }
        into.lists.push({ id: slug(c.title) + '-' + slug(c.id).slice(-6), title: c.title });
      });
      t.domains.push(d);
    });
    return t;
  }
  function saveTemplate(t) { check(t); KN().set('lom:tpl:' + t.id, t); return t; }
  function download(t) {
    var s = JSON.stringify(t, null, 1), name = slug(t.name) + '.minest-world.json';
    try { var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([s], { type: 'application/json' })); a.download = name; document.body.appendChild(a); a.click(); setTimeout(function () { a.remove(); }, 500); } catch (e) {}
    try { if (navigator.clipboard) navigator.clipboard.writeText(s); } catch (e) {}
    toast('Template exported (and copied as JSON)');
  }

  // ================================================================== UI
  var I = function (d) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">' + d + '</svg>'; };
  var ICON = {
    britannica: I('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.8 3 2.8 15 0 18M12 3c-2.8 3-2.8 15 0 18"/>'),
    'my-life': I('<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>'),
    'my-academic-skills': I('<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c3 2.5 9 2.5 12 0v-5"/>'),
    'my-life-skills': I('<path d="M12 3v4M12 17v4M3 12h4M17 12h4"/><circle cx="12" cy="12" r="4"/>'),
    'whole-earth': I('<circle cx="12" cy="12" r="9"/><path d="M4.5 9.5c3 1 4.5-1 7-.5s2 3 5 2.5M6 17c2-1.5 4-1 5.5 0s3.5 1 6-1"/>'),
    'my-museum': I('<path d="M3 9.5 12 4l9 5.5M4.5 20h15M6 10.5V18M10 10.5V18M14 10.5V18M18 10.5V18"/>'),
    dewey: I('<path d="M4 4.5h3v15H4zM8.5 4.5h3v15h-3zM13.2 5.2l2.9-.8 3.9 14.5-2.9.8z"/>'),
    kant: I('<circle cx="12" cy="12" r="9"/><path d="M9.6 9.3a2.5 2.5 0 1 1 3.4 2.3c-.7.3-1 .8-1 1.5v.6M12 17h.01"/>'),
    aristotle: I('<path d="M12 3 3 19h18z"/><circle cx="12" cy="13.5" r="2.2"/>'),
    encyclopedie: I('<path d="M12 21v-8M12 13 7 8M12 13l5-5M12 9V4"/><circle cx="12" cy="4" r="1.6"/><circle cx="6" cy="7" r="1.6"/><circle cx="18" cy="7" r="1.6"/>'),
    bacon: I('<circle cx="7" cy="9" r="3.2"/><circle cx="17" cy="9" r="3.2"/><circle cx="12" cy="16.5" r="3.2"/>'),
    mine: I('<path d="m12 3 2.6 5.6 6 .7-4.5 4.1 1.3 6L12 16.4 6.6 19.4l1.3-6L3.4 9.3l6-.7z"/>'),
    world: I('<rect x="3" y="4" width="7" height="16" rx="2"/><rect x="14" y="4" width="7" height="10" rx="2"/>'),
    back: I('<path d="m15 6-6 6 6 6"/>'), x: I('<path d="M6 6l12 12M18 6 6 18"/>'), chev: I('<path d="m9 6 6 6-6 6"/>')
  };
  // each template is recognised by its picture first (a small scene), the words only explain it
  var S = function (d) { return '<svg viewBox="0 0 160 84" preserveAspectRatio="xMidYMid slice" fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round">' + d + '</svg>'; };
  var dots = function (pts, r) { return pts.map(function (p) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + (p[2] || r || 2.5) + '" fill="#fff" stroke="none"/>'; }).join(''); };
  var ART = {
    britannica: S('<g opacity=".9" stroke-width="1.6"><circle cx="80" cy="46" r="30"/><ellipse cx="80" cy="46" rx="13" ry="30"/><path d="M50 46h60M54 31h52M54 61h52"/></g><g opacity=".7" stroke-width="1">' + '<path d="M18 18l14 8 10-10M126 14l12 10 12-4M130 70l10-8"/></g>' + dots([[18, 18], [32, 26], [42, 16], [126, 14], [138, 24], [150, 20], [130, 70], [140, 62]], 2)),
    'whole-earth': S('<g stroke-width="1.8" opacity=".95"><path d="M8 84a72 40 0 0 1 144 0"/><path d="M40 60v-14M34 50l6-8 6 8M30 56l10-10 10 10"/><path d="M104 40l14 14M100 44a5 5 0 1 0 7-7l-3 3-3-1-1-3z"/><path d="M70 30h18v20H70zM79 30v20"/></g>' + dots([[130, 22, 6]], 0) + '<circle cx="130" cy="22" r="10" stroke-width="1" opacity=".5"/>'),
    'my-life': S('<g stroke-width="1.2" opacity=".55"><path d="M80 44 48 24M80 44l34-22M80 44 44 64M80 44l38 20M80 44v-30"/></g><circle cx="80" cy="44" r="12" fill="#fff" fill-opacity=".9" stroke="none"/>' + dots([[48, 24, 7], [114, 22, 6], [44, 64, 6], [118, 64, 8], [80, 14, 5], [22, 42, 4], [140, 42, 4]])),
    'my-museum': S('<g stroke-width="1.8" opacity=".95"><path d="M40 30 80 12l40 18M36 74h88M46 34v34M62 34v34M98 34v34M114 34v34"/><rect x="72" y="40" width="16" height="20" rx="1.5"/></g>'),
    dewey: S('<g stroke-width="1.6" opacity=".95">' + [[30, 22], [42, 16], [54, 26], [66, 18], [78, 22], [90, 14], [102, 24], [114, 20]].map(function (p) { return '<rect x="' + p[0] + '" y="' + p[1] + '" width="9" height="' + (66 - p[1]) + '" rx="1.5"/>'; }).join('') + '<path d="M126 66l10-46 8 2-10 46z"/><path d="M22 70h124"/></g>'),
    'my-academic-skills': S('<g stroke-width="1.4" opacity=".7"><path d="M80 72V52M80 52 56 34M80 52l24-18M56 34 44 16M56 34l12-18M104 34l-8-18M104 34l14-16"/></g>' + dots([[80, 72, 5], [80, 52, 6], [56, 34, 5], [104, 34, 5], [44, 16, 4], [68, 16, 4], [96, 16, 4], [118, 18, 4]]) + '<g opacity=".35">' + dots([[80, 52, 11], [104, 34, 9]]) + '</g>'),
    'my-life-skills': S('<g stroke-width="1.4" opacity=".7"><path d="M30 60h28l14-24h22l14 20h24M72 36 64 18M94 36l10-18"/></g>' + dots([[30, 60, 5], [58, 60, 4], [72, 36, 6], [94, 36, 6], [108, 56, 4], [132, 56, 5], [64, 18, 4], [104, 18, 4]]) + '<g opacity=".35">' + dots([[72, 36, 11]]) + '</g>'),
    kant: S('<g stroke-width="1.4" opacity=".85"><circle cx="80" cy="42" r="34" opacity=".35"/><circle cx="80" cy="42" r="24" opacity=".6"/><circle cx="80" cy="42" r="14"/><path d="M76 38a4 4 0 1 1 5.5 3.7c-1 .5-1.5 1.2-1.5 2.3M80 48.5h.01" stroke-width="2.2"/></g>'),
    aristotle: S('<g stroke-width="1.6" opacity=".9"><path d="M80 12 46 70h68z"/></g>' + dots([[80, 12, 6], [46, 70, 6], [114, 70, 6]]) + '<circle cx="80" cy="50" r="7" stroke-width="1.4" opacity=".7"/>'),
    encyclopedie: S('<g stroke-width="1.6" opacity=".9"><path d="M80 80V50M80 50 52 30M80 50l28-20M80 50V24M52 30l-14-6M52 30l-6-14M108 30l14-6M108 30l6-14M80 24l-8-12M80 24l8-12"/></g>' + dots([[38, 24], [46, 16], [122, 24], [114, 16], [72, 12], [88, 12]], 3)),
    bacon: S('<g stroke-width="1.6" opacity=".9"><circle cx="66" cy="36" r="18"/><circle cx="94" cy="36" r="18"/><circle cx="80" cy="58" r="18"/></g>'),
    'everyday-food': S('<g stroke-width="1.8" opacity=".95"><ellipse cx="80" cy="56" rx="38" ry="12"/><path d="M42 56c0 14 17 22 38 22s38-8 38-22"/><path d="M60 40c0-8 6-10 6-18M80 40c0-8 6-10 6-18M100 40c0-8 6-10 6-18" opacity=".8"/><path d="M128 18v52M124 18v14a4 4 0 0 0 8 0V18"/></g>'),
    'everyday-memory': S('<g stroke-width="1.6" opacity=".95"><rect x="36" y="20" width="44" height="40" rx="3" transform="rotate(-8 58 40)"/><rect x="74" y="16" width="48" height="44" rx="3" transform="rotate(6 98 38)"/><circle cx="96" cy="32" r="5"/><path d="M78 56l12-12 10 8 8-6 12 10" transform="rotate(6 98 38)"/></g>'),
    'everyday-nature': S('<g stroke-width="1.7" opacity=".95"><path d="M30 72c10-26 30-40 56-44"/><path d="M48 54c-8-4-14-2-18 4 8 2 12 0 18-4zM62 42c-2-8 2-14 8-16 0 8-2 12-8 16z"/><path d="M104 40c6-6 14-8 20-4-4 2-6 6-8 10M112 38l-4 14M96 48h22"/><path d="M20 76h120" opacity=".5"/></g>' + dots([[118, 34, 2]])),
    'everyday-cultural': S('<g stroke-width="1.7" opacity=".95"><rect x="28" y="18" width="14" height="52" rx="2"/><rect x="45" y="24" width="12" height="46" rx="2"/><rect x="62" y="20" width="34" height="50" rx="3"/><path d="M70 30l16 10-16 10z"/><circle cx="118" cy="52" r="14"/><circle cx="118" cy="52" r="4"/><path d="M118 38V22l10 4"/></g>'),
    'everyday-places': S('<g stroke-width="1.7" opacity=".95"><path d="M20 66l30-12 30 12 30-12 30 12V30l-30 12-30-12-30 12-30-12z" opacity=".7"/><path d="M80 18c-9 0-15 6-15 14 0 11 15 24 15 24s15-13 15-24c0-8-6-14-15-14z"/><circle cx="80" cy="32" r="5"/></g>'),
    'everyday-creative': S('<g stroke-width="1.7" opacity=".95"><path d="M66 46a14 14 0 1 1 22 0c-3 3-4 6-4 9H70c0-3-1-6-4-9z"/><path d="M70 62h14M72 68h10"/><path d="M40 30l6 6M120 30l-6 6M30 48h8M122 48h8M80 14v6"/><path d="M104 66l12-12 6 6-12 12z" opacity=".8"/></g>'),
    'everyday-maker': S('<g stroke-width="1.8" opacity=".95"><path d="M44 66l22-22M60 40a10 10 0 0 0 14 14l-6 6-14-14z"/><path d="M96 24l10 10-30 30-10 2 2-10z"/><circle cx="116" cy="60" r="8"/><path d="M116 48v4M116 68v4M104 60h4M124 60h4"/></g>'),
    'everyday-family': S('<g stroke-width="1.6" opacity=".95"><path d="M80 76V44M80 44 54 26M80 44l26-18M80 56 60 48M80 56l20-8"/></g>' + dots([[54, 24, 6], [106, 24, 6], [60, 46, 4.5], [100, 46, 4.5], [80, 40, 7]])),
    'philosophy-spinoza': S('<g stroke-width="1.3" opacity=".75"><path d="M40 22 80 42 122 20M40 22l-8 40M80 42 60 70M80 42l40 26M122 20l10 36M32 62l28 8M120 68l12-12M80 42 80 12"/></g>' + dots([[40, 22, 4], [80, 42, 7], [122, 20, 4], [32, 62, 3.5], [60, 70, 4], [120, 68, 4], [132, 56, 3], [80, 12, 3.5]])),
    'philosophy-aristotle': S('<g stroke-width="1.6" opacity=".95"><rect x="30" y="16" width="30" height="22" rx="4"/><rect x="65" y="16" width="30" height="22" rx="4"/><rect x="100" y="16" width="30" height="22" rx="4"/><rect x="30" y="46" width="30" height="22" rx="4"/><rect x="65" y="46" width="30" height="22" rx="4"/><rect x="100" y="46" width="30" height="22" rx="4"/></g>' + dots([[45, 27, 3], [80, 57, 3], [115, 27, 3]])),
    'philosophy-kant': S('<g stroke-width="1.5" opacity=".9"><circle cx="80" cy="44" r="30" opacity=".4"/><path d="M80 14v60M50 44h60" opacity=".55"/><circle cx="80" cy="44" r="16"/></g><path d="M76 40a4 4 0 1 1 5.5 3.7c-1 .5-1.5 1.2-1.5 2.3M80 50.5h.01" stroke-width="2.2"/>' + dots([[80, 14, 3], [110, 44, 3], [80, 74, 3], [50, 44, 3]])),
    'philosophy-hegel': S('<path d="M20 70c18 0 22-14 36-14s16 10 28 10 14-22 28-22 16-14 28-24" stroke-width="2" opacity=".95"/><g opacity=".5" stroke-width="1"><path d="M20 76h120"/></g>' + dots([[20, 70, 4], [56, 56, 4.5], [84, 66, 5], [112, 44, 5.5], [140, 20, 6.5]])),
    'philosophy-heidegger': S('<path d="M10 64h140" stroke-width="1.3" opacity=".7"/><path d="M80 64c-10-16-30-26-62-30M80 64c10-16 30-26 62-30M80 64V18" stroke-width="1.6" opacity=".9"/><circle cx="80" cy="64" r="6" fill="#fff" stroke="none"/><path d="M60 78h40" stroke-width="1" opacity=".5"/>' + dots([[18, 34, 3], [142, 34, 3], [80, 18, 3]])),
    mine: S('<path d="M80 14l8 17 19 2-14 13 4 19-17-9-17 9 4-19-14-13 19-2z" stroke-width="1.8"/>')
  };
  function artOf(t) { return t.mine ? ART.mine : ART[t.id] || S('<circle cx="80" cy="42" r="22" stroke-width="1.8"/>'); }
  function iconOf(t) { return t.mine ? ICON.mine : ICON[t.id] || ICON.mine; }
  var CSS = [
    '.lw{position:fixed;inset:0;z-index:2147482001;display:flex;flex-direction:column;color:#f3f5f8;font:15px/1.4 -apple-system,BlinkMacSystemFont,"SF Pro Text",system-ui,sans-serif;-webkit-font-smoothing:antialiased;' +
      'background:linear-gradient(180deg,rgba(22,27,40,.86),rgba(10,13,22,.94));-webkit-backdrop-filter:blur(40px) saturate(180%);backdrop-filter:blur(40px) saturate(180%)}',
    '.lw-head{display:flex;align-items:center;gap:10px;padding:calc(env(safe-area-inset-top,0px) + 12px) 14px 8px}',
    '.lw-head h2{flex:1;min-width:0;margin:0;font-size:26px;font-weight:800;letter-spacing:-.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.lw-b{flex:none;width:36px;height:36px;border-radius:50%;display:grid;place-items:center;padding:0;cursor:pointer;color:inherit;background:linear-gradient(180deg,rgba(255,255,255,.18),rgba(255,255,255,.06));border:1px solid rgba(255,255,255,.24);box-shadow:inset 0 1px 0 rgba(255,255,255,.35),0 6px 16px rgba(0,0,0,.25)}',
    '.lw-b svg{width:17px;height:17px}',
    '.lw-body{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:4px 14px calc(env(safe-area-inset-bottom,0px) + 110px)}',
    '.lw-sub{margin:0 2px 14px;opacity:.65;font-size:14px}',
    '.lw-h{margin:18px 2px 8px;font-size:12px;font-weight:650;letter-spacing:.06em;text-transform:uppercase;opacity:.55}',
    '.lw-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:10px}',
    '.lw-card{position:relative;display:flex;flex-direction:column;gap:6px;text-align:left;padding:14px;border-radius:22px;cursor:pointer;color:inherit;font:inherit;' +
      'background:linear-gradient(180deg,rgba(255,255,255,.13),rgba(255,255,255,.05));border:1px solid rgba(255,255,255,.16);box-shadow:inset 0 1px 0 rgba(255,255,255,.22),0 10px 30px rgba(0,0,0,.2);transition:transform .15s}',
    '.lw-card:active{transform:scale(.97)}',
    '.lw-card.wide{grid-column:1/-1}.lw-card.wide:active{transform:none}',
    '.lw-card.art{padding-top:0;overflow:hidden}',
    '.lw-art{display:block;margin:0 -14px 4px;height:84px;background:radial-gradient(120% 90% at 20% 0%,rgba(255,255,255,.35),rgba(255,255,255,0) 55%),linear-gradient(150deg,color-mix(in srgb,var(--c) 92%,#fff),color-mix(in srgb,var(--c) 62%,#000));border-bottom:1px solid rgba(255,255,255,.18)}',
    '.lw-art svg{display:block;width:100%;height:100%}',
    '.lw-tag{margin:0;font-size:13.5px;font-weight:600;line-height:1.3;opacity:.85}',
    '.lw-card i{width:40px;height:40px;border-radius:50%;display:grid;place-items:center;color:#fff;font-style:normal;' +
      'background:radial-gradient(120% 80% at 30% 15%,rgba(255,255,255,.55),rgba(255,255,255,0) 50%),linear-gradient(160deg,color-mix(in srgb,var(--c) 85%,#fff),color-mix(in srgb,var(--c) 70%,#000));border:1px solid rgba(255,255,255,.45);box-shadow:inset 0 1px 0 rgba(255,255,255,.6),0 4px 12px color-mix(in srgb,var(--c) 40%,transparent)}',
    '.lw-card i svg{width:20px;height:20px}',
    '.lw-card b{font-size:16px;font-weight:700;letter-spacing:-.2px}',
    '.lw-card small{font-size:12.5px;opacity:.65;line-height:1.35}',
    '.lw-card em{font-style:normal;font-size:11.5px;opacity:.5}',
    '.lw-row{display:flex;gap:8px;flex-wrap:wrap;margin-top:6px}',
    '.lw-pill{height:36px;padding:0 14px;border-radius:999px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.08);color:inherit;font:600 13.5px -apple-system,system-ui,sans-serif;cursor:pointer}',
    '.lw-pill.pri{background:linear-gradient(180deg,#3d9bff,#0a7aff);border-color:rgba(255,255,255,.25);color:#fff}',
    // preview tree
    '.lw-about{margin:0 2px 12px;padding:12px 14px;border-radius:16px;background:rgba(255,255,255,.06);font-size:13.5px;opacity:.85}',
    '.lw-about summary{cursor:pointer;font-weight:650;opacity:.9}',
    '.lw-dom{margin-bottom:8px;border-radius:18px;background:linear-gradient(180deg,rgba(255,255,255,.1),rgba(255,255,255,.04));border:1px solid rgba(255,255,255,.12);overflow:hidden}',
    '.lw-dom.off{opacity:.45}',
    '.lw-dh{display:flex;align-items:center;gap:10px;padding:10px 12px;cursor:pointer}',
    '.lw-dh .dot{width:12px;height:12px;border-radius:50%;flex:none;background:var(--c);box-shadow:0 0 0 3px color-mix(in srgb,var(--c) 30%,transparent)}',
    '.lw-dh b{flex:1;min-width:0;font-size:15.5px;font-weight:700}',
    '.lw-dh em{font-style:normal;font-size:12px;opacity:.55}',
    '.lw-note{display:block;font-size:12px;font-weight:500;opacity:.55;margin-top:1px}',
    '.lw-by{display:block;font-size:12px;opacity:.6;font-weight:500}',
    '.lw-ab{margin-top:10px}.lw-ab b{display:block;font-size:12px;letter-spacing:.04em;text-transform:uppercase;opacity:.6;margin-bottom:3px}',
    '.lw-tags{display:flex;flex-wrap:wrap;gap:5px}.lw-tags i{font-style:normal;font-size:12.5px;padding:3px 9px;border-radius:999px;background:rgba(255,255,255,.1)}',
    '.lw-fine{font-size:12.5px;opacity:.6;margin:10px 0 0}',
    '.lw-qs{margin:8px 0 0;padding-left:18px}.lw-qs li{margin:4px 0}',
    '.lw-tool{display:grid;grid-template-columns:1fr auto;gap:2px 8px;margin:0 2px 12px;padding:12px 14px;border-radius:16px;background:rgba(255,255,255,.06);border:1px dashed rgba(255,255,255,.2)}.lw-tool b{font-size:14.5px}.lw-tool span{grid-column:1/2;font-size:12.5px;opacity:.65}.lw-tool em{grid-row:1/3;grid-column:2;align-self:center;font-style:normal;font-size:11px;font-weight:700;padding:3px 8px;border-radius:999px;background:rgba(255,255,255,.12)}',
    '.lw-ls{display:flex;flex-wrap:wrap;gap:5px;margin-top:5px}.lw-li{border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.07);color:inherit;font:500 12.5px -apple-system,system-ui,sans-serif;padding:4px 9px;border-radius:999px;cursor:pointer}',
    '.lw-li.off{opacity:.4;text-decoration:line-through}.lw-li.sub{font-size:11.5px;opacity:.8;border-style:dashed}.lw-li.sub.off{opacity:.35}',
    '[data-rn]{cursor:pointer;text-decoration:underline dotted;text-underline-offset:3px}',
    'html.kn-light .lw-tags i,html.kn-light .lw-li{background:rgba(0,0,0,.05);border-color:rgba(0,0,0,.1)}html.kn-light .lw-tool{background:rgba(0,0,0,.03);border-color:rgba(0,0,0,.18)}',
    '.lw-code{font-style:normal;font:700 11.5px ui-monospace,SFMono-Regular,Menlo,monospace;padding:2px 6px;border-radius:6px;background:rgba(255,255,255,.12);opacity:.85}',
    '.lw-opt{margin:0 0 4px;padding:10px 12px;border:0;border-radius:16px;background:rgba(255,255,255,.06)}',
    '.lw-lens{margin-top:10px;padding:10px 12px;border-radius:12px;background:rgba(255,255,255,.06)}.lw-lens b{font-size:13.5px}.lw-lens .nt{font-size:12.5px;opacity:.65;margin:2px 0 6px}',
    '.lw-lens .gr{display:flex;flex-wrap:wrap;align-items:center;gap:5px;margin-top:5px}.lw-lens .gr span{font-size:11.5px;font-weight:650;opacity:.6;min-width:76px}.lw-lens .gr i{font-style:normal;font-size:12px;padding:2px 8px;border-radius:999px;background:rgba(255,255,255,.1)}',
    'html.kn-light .lw-code,html.kn-light .lw-lens .gr i{background:rgba(0,0,0,.07)}html.kn-light .lw-lens,html.kn-light .lw-opt{background:rgba(0,0,0,.04)}',
    '.lw-dh .cv{width:22px;height:22px;display:grid;place-items:center;opacity:.55;transition:transform .2s}',
    '.lw-dh .cv svg{width:14px;height:14px}',
    '.lw-dom.open .lw-dh .cv{transform:rotate(90deg)}',
    '.lw-cats{display:none;padding:0 12px 10px 34px}',
    '.lw-dom.open .lw-cats{display:block}',
    '.lw-cat{display:flex;align-items:flex-start;gap:10px;padding:8px 0;border-top:1px solid rgba(255,255,255,.07)}',
    '.lw-cat.off{opacity:.4}',
    '.lw-cat b{display:block;font-size:14px;font-weight:650}',
    '.lw-cat span{display:block;font-size:12.5px;opacity:.6;margin-top:2px}',
    // switches
    '.lw-sw{flex:none;position:relative;width:44px;height:26px;border-radius:13px;border:0;padding:0;cursor:pointer;background:rgba(255,255,255,.18);transition:background .2s}',
    '.lw-sw:after{content:"";position:absolute;left:3px;top:3px;width:20px;height:20px;border-radius:50%;background:#fff;box-shadow:0 2px 4px rgba(0,0,0,.25);transition:transform .2s}',
    '.lw-sw.on{background:#34c759}.lw-sw.on:after{transform:translateX(18px)}',
    // bottom bar
    '.lw-foot{position:absolute;left:0;right:0;bottom:0;padding:26px 14px calc(env(safe-area-inset-bottom,0px) + 14px);background:linear-gradient(180deg,rgba(10,13,22,0),rgba(10,13,22,.97) 22px)}',
    '.lw-sum{font-size:12.5px;opacity:.7;margin:0 4px 8px}',
    '.lw-go{width:100%;height:50px;border-radius:999px;border:1px solid rgba(255,255,255,.25);background:linear-gradient(180deg,#3d9bff,#0a7aff);color:#fff;font:700 16px -apple-system,system-ui,sans-serif;cursor:pointer;box-shadow:0 10px 26px rgba(10,122,255,.35)}',
    '.lw-go[disabled]{opacity:.45}',
    '.lw-target{display:flex;gap:6px;flex-wrap:wrap;margin:0 2px 12px}',
    '.lw-target button{height:34px;padding:0 12px;border-radius:999px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.06);color:inherit;font:600 13px -apple-system,system-ui,sans-serif;cursor:pointer}',
    '.lw-target button.on{background:rgba(255,255,255,.22);border-color:rgba(255,255,255,.4)}',
    // light
    'html.kn-light .lw{color:#1d1f23;background:linear-gradient(180deg,rgba(244,246,250,.9),rgba(232,236,243,.95))}',
    'html.kn-light .lw-b,html.kn-light .lw-card,html.kn-light .lw-dom,html.kn-light .lw-pill,html.kn-light .lw-target button{background:rgba(255,255,255,.8);border-color:rgba(255,255,255,.95);box-shadow:inset 0 1px 0 #fff,0 6px 18px rgba(30,40,60,.08)}',
    'html.kn-light .lw-pill.pri,html.kn-light .lw-go{color:#fff}',
    'html.kn-light .lw-about{background:rgba(0,0,0,.04)}html.kn-light .lw-cat{border-color:rgba(0,0,0,.06)}',
    'html.kn-light .lw-foot{background:linear-gradient(180deg,rgba(236,240,246,0),rgba(236,240,246,.98) 22px)}',
    'html.kn-light .lw-target button.on{background:#fff;border-color:#0a84ff;color:#0a6cdf}'
  ].join('\n');
  function css() { if (document.getElementById('lw-css')) return; var s = document.createElement('style'); s.id = 'lw-css'; s.textContent = CSS; document.head.appendChild(s); }

  var ui = { open: false };
  function open() {
    if (ui.open) return choose();
    css(); if (KN() && KN().applyLook) KN().applyLook();
    var el = document.createElement('div'); el.className = 'lw'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'List of Mine');
    el.innerHTML = '<div class="lw-head"></div><div class="lw-body"></div><div class="lw-foot" hidden></div><input type="file" accept=".json,application/json" hidden>';
    ['pointerdown', 'touchstart', 'touchmove', 'wheel'].forEach(function (ev) { el.addEventListener(ev, function (e) { e.stopPropagation(); }, { passive: true }); });
    ui.el = el; ui.head = el.querySelector('.lw-head'); ui.body = el.querySelector('.lw-body'); ui.foot = el.querySelector('.lw-foot'); ui.file = el.querySelector('input[type=file]'); ui.open = true;
    document.body.appendChild(el); document.documentElement.classList.add('kn-open');
    if (el.animate) el.animate([{ opacity: 0, scale: '.97' }, { opacity: 1, scale: '1' }], { duration: 280, easing: 'cubic-bezier(.2,.85,.25,1)' });
    el.addEventListener('click', onClick);
    ui.file.addEventListener('change', function () {
      var f = ui.file.files && ui.file.files[0]; if (!f) return;
      var rd = new FileReader();
      rd.onload = function () { try { var t = check(JSON.parse(rd.result)); t = Object.assign({}, t); delete t.mine; if (tplById(t.id) && !tplById(t.id).mine) t.id = t.id + '-mine'; saveTemplate(t); toast('Template “' + t.name + '” added'); choose(); } catch (e) { toast('✗ ' + e.message); } };
      rd.readAsText(f); ui.file.value = '';
    });
    choose();
  }
  function close() {
    if (!ui.open) return;
    var el = ui.el; ui.open = false; ui.el = null; document.documentElement.classList.remove('kn-open');
    if (el.animate) { var a = el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 180, fill: 'forwards' }); a.onfinish = function () { el.remove(); }; } else el.remove();
  }
  function head(title, back) {
    ui.head.innerHTML = (back ? '<button type="button" class="lw-b" data-back aria-label="Back">' + ICON.back + '</button>' : '') + '<h2>' + esc(title) + '</h2><button type="button" class="lw-b" data-x aria-label="Close">' + ICON.x + '</button>';
  }

  // ---------------------------------------------------------------- Choose Your World
  function choose() {
    ui.view = 'choose'; ui.foot.hidden = true; head('Choose Your World', false);
    var ts = templates(), ws = worlds(), size = function (t) { return t.domains.length + ' areas · ' + t.domains.reduce(function (a, d) { return a + (d.lists && !d.categories ? d.lists.length : 0) + (d.categories || []).reduce(function (x, c) { return x + (c.lists || []).length; }, 0); }, 0) + ' lists'; };
    var card = function (t) { return '<button type="button" class="lw-card art" data-tpl="' + esc(t.id) + '" style="--c:' + esc(t.color || '#7c8cff') + '"><span class="lw-art" aria-hidden="true">' + artOf(t) + '</span><b>' + esc(t.name) + '</b>' + (t.philosopher ? '<small class="lw-by">Inspired by ' + esc(t.philosopher) + '</small>' : '') + (t.tagline ? '<p class="lw-tag">' + esc(t.tagline) + '</p>' : t.description ? '<small>' + esc(t.description) + '</small>' : '') + '<em>' + size(t) + '</em></button>'; };
    var built = ts.filter(function (t) { return !t.mine && !t.hidden; }), mine = ts.filter(function (t) { return t.mine; });
    var FAM = [['everyday', 'Everyday Worlds', 'Pick any you like — they don’t assume who you are, and you can use several.'], ['knowledge', 'Knowledge atlases', ''], ['skills', 'My Skills', ''], ['advanced-philosophy', 'Explore Philosophical Worlds', 'Five ways of seeing one personal world — no philosophy needed to start.'], ['classical', 'Classical Worldviews', 'Inspired by great thinkers — shown in everyday words.']];
    var fams = FAM.map(function (f) { var xs = built.filter(function (t) { return (t.family || 'everyday') === f[0]; }); return xs.length ? '<div class="lw-h">' + f[1] + '</div>' + (f[2] ? '<p class="lw-sub" style="margin-top:-4px">' + f[2] + '</p>' : '') + '<div class="lw-grid">' + xs.map(card).join('') + '</div>' : ''; }).join('');
    var other = built.filter(function (t) { return !FAM.some(function (f) { return f[0] === (t.family || 'everyday'); }); });
    ui.body.innerHTML = (window.MinestCapture && ws.length ? '<button type="button" class="lw-go" style="margin:2px 0 14px" data-capture>＋ Add to My World</button>' : '') +
      (window.MinestBuilder ? '<div class="lw-row" style="margin:0 0 6px"><button type="button" class="lw-pill" data-bmix>Mix &amp; Match</button><button type="button" class="lw-pill" data-bscratch>Start from Scratch</button></div>' : '') + '<p class="lw-sub">Pick a template — you will see its world first, and you can switch off anything you don’t want.</p>' +
      fams + (other.length ? '<div class="lw-h">More templates</div><div class="lw-grid">' + other.map(card).join('') + '</div>' : '') +
      (mine.length ? '<div class="lw-h">My templates</div><div class="lw-grid">' + mine.map(card).join('') + '</div>' : '') +
      (ws.length ? '<div class="lw-h">My worlds</div><div class="lw-grid">' + ws.map(function (x) {
        var names = Object.keys(x.w.templates || {}).map(function (k) { return (x.w.templates[k] || {}).name || k; }).join(' + ');
        return '<div class="lw-card wide" style="--c:#7c8cff;cursor:default"><i>' + ICON.world + '</i><b>' + esc(x.b.title) + '</b><small>' + esc(names) + ' · ' + (x.b.columns || []).length + ' areas</small>' +
          '<div class="lw-row"><button type="button" class="lw-pill pri" data-openw="' + esc(x.b.id) + '">Open' + (window.MinestCapture && MinestCapture.newCount(x.b.id) ? ' <span style="background:#fff;color:#0a7aff;border-radius:999px;padding:1px 7px;margin-left:4px;font-size:12px">+' + MinestCapture.newCount(x.b.id) + '</span>' : '') + '</button>' + (window.MinestPicker ? '<button type="button" class="lw-pill" data-quick="' + esc(x.b.id) + '">＋ Quick Add</button>' : '') + (window.MinestBuilder ? '<button type="button" class="lw-pill" data-bcustom="' + esc(x.b.id) + '">Customize</button>' : '') + Object.keys(x.w.templates || {}).map(function (k) { var tt = tplById(k), d = tt && tt.discoveryTool; return d && window.MinestPhilo && MinestPhilo.ready(d.id) ? '<button type="button" class="lw-pill" data-ptool="' + esc(d.id) + '">' + esc(d.name) + '</button>' : ''; }).join('') + '<button type="button" class="lw-pill" data-savew="' + esc(x.b.id) + '">Save as my template</button></div></div>';
      }).join('') + '</div>' : '') +
      '<div class="lw-h">More</div><div class="lw-row"><button type="button" class="lw-pill" data-import>Import a template…</button>' +
      (A().board && A().board() ? '<button type="button" class="lw-pill" data-savecur>Make a template from “' + esc(A().board().title) + '”</button>' : '') +
      (loadUndo().length ? '<button type="button" class="lw-pill" data-undo>Undo “' + esc(loadUndo()[0].title) + '”</button>' : '') + '</div>';
    ui.body.scrollTop = 0;
  }

  // ---------------------------------------------------------------- Preview
  function preview(t) {
    ui.view = 'preview'; ui.tpl = t; ui.off = {}; ui.openD = {}; ui.names = {}; ui.depth = t.defaultDepth || 'standard'; ui.renaming = false;
    ui.groups = t.groups ? (t.defaultGroups || t.groups.map(function (g) { return g.id; })).slice() : null;   // e.g. the grades to make
    var ws = worlds(); ui.into = null; ui.codes = !!(t.codes && t.codes.default);
    head(t.name, true);
    render(); ui.body.scrollTop = 0;
    function render() {
      var tgt = ui.into ? boardById(ui.into) : null, n = counts(plan(t, ui.into || ('lw-' + slug(t.id)), { off: offAll(), codes: ui.codes, depth: ui.depth, names: ui.names }), tgt);
      var NM = function (key, title) { return esc(ui.names[key] || title); }, RN = function (key, title) { return ui.renaming ? ' data-rn="' + esc(key) + '" data-rt="' + esc(title) + '"' : ''; };
      var shown = t.domains.filter(function (d) { return !ui.groups || ui.groups.indexOf(d.group) >= 0; });
      ui.body.innerHTML = (t.description ? '<p class="lw-sub">' + esc(t.description) + '</p>' : '') +
        (t.philosopher ? '<p class="lw-by" style="margin:-8px 2px 12px">Inspired by ' + esc(t.philosopher) + ' · version ' + esc(t.versionString || t.version || 1) + '</p>' : '') +
        (t.philosophy ? '<details class="lw-about"><summary>About this template</summary>' +
          '<div class="lw-ab"><b>The original ideas</b><div>' + esc(String(t.philosophy.original || '').replace(/^Original:\s*/, '')) + '</div></div>' +
          '<div class="lw-ab"><b>How Minest adapts them</b><div>' + esc(String(t.philosophy.adaptation || '').replace(/^Minest adaptation:\s*/, '')) + '</div></div>' +
          ((t.philosophy.primaryWorks || []).length ? '<div class="lw-ab"><b>Main works</b><div>' + t.philosophy.primaryWorks.map(esc).join(' · ') + '</div></div>' : '') +
          ((t.philosophy.coreConcepts || []).length ? '<div class="lw-ab"><b>Core ideas</b><div class="lw-tags">' + t.philosophy.coreConcepts.map(function (c) { return '<i>' + esc(c) + '</i>'; }).join('') + '</div></div>' : '') +
          lensHtml(t) + '<p class="lw-fine">Choosing a template never means you hold its views — it is only a way to sort your own world.</p></details>' : '') +
        ((t.thinkingQuestions || []).length ? '<details class="lw-about"><summary>Thinking questions</summary><ul class="lw-qs">' + t.thinkingQuestions.map(function (q) { return '<li>' + esc(q.text) + '</li>'; }).join('') + '</ul></details>' : '') +
        (t.discoveryTool ? (function (d) { var ready = window.MinestPhilo && MinestPhilo.ready(d.id); return '<div class="lw-tool"><b>' + esc(d.name) + '</b><span>' + esc(d.summary || '') + '</span>' + (ready ? '<button type="button" class="lw-pill pri" style="grid-row:1/3;grid-column:2;align-self:center;height:32px" data-ptool="' + esc(d.id) + '">Open</button>' : '<em>Coming next</em>') + '</div>'; })(t.discoveryTool) : '') +
        (t.starterPack ? starterHtml(t) : '') +
        ((t.recommendedViews || []).length ? '<div class="lw-h">Good views for it</div><div class="lw-tags">' + t.recommendedViews.map(function (v) { return '<i>' + esc(VIEW_T[v] || v) + '</i>'; }).join('') + '</div>' : '') +
        (!t.philosophy && t.inspiration ? '<details class="lw-about"><summary>About this template</summary><div style="margin-top:6px">' + esc(t.inspiration) + '</div>' +
          lensHtml(t) + (t.mine ? '<div class="lw-row" style="margin-top:10px"><button type="button" class="lw-pill" data-exp>Export JSON</button><button type="button" class="lw-pill" data-duptpl>Duplicate</button><button type="button" class="lw-pill" data-deltpl style="color:#ff6b6b">Delete this template</button></div>' : '') + '</details>' : '') +
        ((t.depths || []).length > 1 ? '<div class="lw-h">How much to make</div><div class="lw-target">' + t.depths.map(function (k) { return '<button type="button" data-depth="' + k + '"' + (ui.depth === k ? ' class="on"' : '') + '>' + DEPTH_T[k] + '</button>'; }).join('') + '</div><p class="lw-fine" style="margin:6px 2px 0">' + DEPTH_D[ui.depth] + '</p>' : '') +
        (ws.length ? '<div class="lw-h">Where</div><div class="lw-target"><button type="button" data-into=""' + (ui.into ? '' : ' class="on"') + '>New world</button>' + ws.map(function (x) { return '<button type="button" data-into="' + esc(x.b.id) + '"' + (ui.into === x.b.id ? ' class="on"' : '') + '>Add to “' + esc(x.b.title) + '”</button>'; }).join('') + '</div>' : '') +
        (t.groups ? '<div class="lw-h">' + esc(t.groupsLabel || 'Groups') + '</div><div class="lw-target">' + t.groups.map(function (g) { return '<button type="button" data-group="' + esc(g.id) + '"' + (ui.groups.indexOf(g.id) >= 0 ? ' class="on"' : '') + '>' + esc(g.title) + '</button>'; }).join('') + '</div>' : '') +
        (t.codes ? '<div class="lw-cat lw-opt"><div style="flex:1;min-width:0"><b>' + esc(t.codes.label || 'Show numbers') + '</b><span>Adds them to the names, e.g. “' + esc(((t.domains[5] || t.domains[0]).code || '') + ' ' + (t.domains[5] || t.domains[0]).title) + '”</span></div><button type="button" class="lw-sw' + (ui.codes ? ' on' : '') + '" data-codes aria-label="' + esc(t.codes.label || 'Show numbers') + '"></button></div>' : '') +
        (function () { if (!tgt) return ''; var have = {}; (tgt.columns || []).forEach(function (c) { have[String(c.title).toLowerCase()] = 1; }); var mineIds = {}; plan(t, tgt.id, { off: {} }).lists.forEach(function (L) { mineIds[L.id] = 1; });
          var dup = shown.filter(function (d) { var nm = String(ui.names[d.id] || d.title).toLowerCase(); return have[nm] && !(tgt.columns || []).some(function (c) { return mineIds[c.id] && String(c.title).toLowerCase() === nm; }); }).map(function (d) { return ui.names[d.id] || d.title; });
          return dup.length ? '<p class="lw-fine" style="margin:0 2px 10px;opacity:.8">“' + dup.map(esc).join('”, “') + '” already exist' + (dup.length === 1 ? 's' : '') + ' in this world. They are added as separate areas — nothing is merged by name. Use ✎ Rename if you want to tell them apart.</p>' : ''; })() +
        '<div class="lw-h" style="display:flex;align-items:center">Your world<button type="button" class="lw-pill' + (ui.renaming ? ' pri' : '') + '" style="margin-left:auto;height:30px;font-size:12.5px;text-transform:none;letter-spacing:0" data-renaming>' + (ui.renaming ? 'Done renaming' : '✎ Rename') + '</button></div>' + (ui.renaming ? '<p class="lw-fine" style="margin:-2px 2px 8px">Tap any name to change it.</p>' : '') +
        (shown.length ? '' : '<p class="lw-sub">Pick at least one.</p>') +
        shown.map(function (d, i) {
          var dOff = !!ui.off[d.id];
          return '<div class="lw-dom' + (dOff ? ' off' : '') + (ui.openD[d.id] ? ' open' : '') + '" style="--c:' + esc(d.color || PAL[i % PAL.length]) + '"><div class="lw-dh" data-dopen="' + esc(d.id) + '"><span class="cv">' + ICON.chev + '</span><span class="dot"></span>' + (d.code ? '<i class="lw-code">' + esc(d.code) + '</i>' : '') + '<b' + RN(d.id, d.title) + '>' + NM(d.id, d.title) + (d.note ? '<small class="lw-note">' + esc(d.note) + '</small>' : '') + '</b><em>' + (d.categories || d.lists || []).length + '</em><button type="button" class="lw-sw' + (dOff ? '' : ' on') + '" data-toggle="' + esc(d.id) + '" aria-label="Include ' + esc(d.title) + '"></button></div>' +
            '<div class="lw-cats">' + (d.lists && !d.categories ? '<div class="lw-cat"><div style="flex:1;min-width:0"><div class="lw-ls">' + d.lists.map(function (l) { var lk = 'l:' + d.id + '/' + l.id, lOff = dOff || !!ui.off[lk];
                return '<button type="button" class="lw-li' + (lOff ? ' off' : '') + '"' + (ui.renaming ? RN(lk, l.title) : ' data-ltog="' + esc(lk) + '"') + (dOff ? ' disabled' : '') + '>' + NM(lk, l.title) + '</button>'; }).join('') + '</div>' +
                (t.starterPack && t.starterPack.listFields ? '<span>' + esc(fieldsLine(t, d.id)) + '</span>' : '') + '</div></div>' : '') + (d.categories || []).map(function (c) {
              var cOff = dOff || !!ui.off[c.id];
              var lsH = ui.depth === 'simple' ? '' : '<div class="lw-ls">' + (c.lists || []).map(function (l) { var lk = 'l:' + c.id + '/' + l.id, lOff = cOff || !!ui.off[lk];
                  return '<button type="button" class="lw-li' + (lOff ? ' off' : '') + '"' + (ui.renaming ? RN(lk, l.title) : ' data-ltog="' + esc(lk) + '"') + (cOff ? ' disabled' : '') + '>' + NM(lk, l.title) + '</button>' +
                    (ui.depth === 'complete' ? (l.lists || []).map(function (x) { var xk = lk + '/' + x.id, xOff = lOff || !!ui.off[xk]; return '<button type="button" class="lw-li sub' + (xOff ? ' off' : '') + '"' + (ui.renaming ? RN(xk, x.title) : ' data-ltog="' + esc(xk) + '"') + (lOff ? ' disabled' : '') + '>↳ ' + NM(xk, x.title) + '</button>'; }).join('') : ''); }).join('') + '</div>';
              return '<div class="lw-cat' + (cOff ? ' off' : '') + '"><div style="flex:1;min-width:0"><b' + RN(c.id, c.title) + '>' + NM(c.id, c.title) + '</b>' + lsH + '</div><button type="button" class="lw-sw' + (cOff ? '' : ' on') + '" data-toggle="' + esc(c.id) + '"' + (dOff ? ' disabled' : '') + ' aria-label="Include ' + esc(c.title) + '"></button></div>';
            }).join('') + '</div></div>';
        }).join('');
      var total = n.lists + n.sections + n.cards;
      ui.foot.hidden = false;
      ui.foot.innerHTML = '<div class="lw-sum">' + (tgt ? (total ? 'Adds ' : 'Nothing new to add — ') : 'Creates ') + (total || tgt ? n.lists + ' areas · ' + (n.sections ? n.sections + ' categories · ' : '') + n.cards + ' lists' : '') + (tgt ? ' · nothing you have is changed or removed' : '') + '</div>' +
        '<button type="button" class="lw-go" data-go' + (total ? '' : ' disabled') + '>' + (tgt ? 'Add to My World' : 'Create My World') + '</button>';
    }
    ui.renderPreview = render;
  }
  // a classical template's advanced lens (e.g. Kant's twelve categories): shown to read, never generated as lists
  // Starter Pack preview: quick add, fields, pickers, gallery and suggested Discover tools
  function fieldsLine(t, did) {
    var sp = t.starterPack, F = {}; (sp.fields || []).forEach(function (f) { F[f.id] = f.label; });
    var ids = []; Object.keys(sp.listFields || {}).forEach(function (k) { if (k.split('/')[0] === did) (sp.listFields[k] || []).forEach(function (x) { if (ids.indexOf(x) < 0) ids.push(x); }); });
    return ids.length ? 'Fields: ' + ids.map(function (x) { return F[x] || x; }).join(' · ') : '';
  }
  function starterHtml(t) {
    var sp = t.starterPack, tools = (sp.discoveryTools || []).map(function (id) { return { 'this-or-that': 'This or That', 'tier-list': 'Tier List', tournament: 'Tournament', 'desert-island': 'My Desert Island', 'connect-my-world': 'Connect My World' }[id] || null; }).filter(Boolean);
    return '<div class="lw-h">Starter pack</div><div class="lw-tool" style="display:block"><b>' + esc(sp.quickAdd ? sp.quickAdd.label : 'Quick Add') + '</b>' +
      '<span style="display:block;margin-top:3px">' + esc([(sp.more || []).map(function (m) { return m.label; }).join(' · '), (sp.pickers || []).map(function (p) { return p.label; }).join(' · '), sp.gallery ? sp.gallery.label : '', sp.quickAdd && sp.quickAdd.importText ? 'Paste a recipe as text' : ''].filter(Boolean).join(' · ')) + '</span>' +
      (tools.length ? '<span style="display:block;margin-top:6px">Try with it: ' + esc(tools.join(' · ')) + '</span>' : '') +
      (sp.private ? '<span style="display:block;margin-top:6px">Private by default — never shared or exported with your items unless you say so.</span>' : '') + '</div>';
  }
  var DEPTH_T = { simple: 'Simple', standard: 'Standard', complete: 'Complete' };
  var DEPTH_D = { simple: 'Areas and categories only — fewest lists to start with.', standard: 'Areas, categories and their lists.', complete: 'Everything, including the more detailed sub-lists.' };
  var VIEW_T = { gallery: 'Gallery', list: 'List', contents: 'Contents', 'knowledge-map': 'Knowledge Map', timeline: 'Timeline', portal: 'Portal', kanban: 'Kanban', map: 'Knowledge Map' };
  function lensHtml(t) {
    return (t.lenses || []).map(function (L) {
      return '<div class="lw-lens"><b>' + esc(L.title) + '</b>' + (L.note ? '<div class="nt">' + esc(L.note) + '</div>' : '') +
        (L.groups || []).map(function (g) { return '<div class="gr"><span>' + esc(g.title) + '</span>' + (g.items || []).map(function (x) { return '<i>' + esc(x) + '</i>'; }).join('') + '</div>'; }).join('') + '</div>';
    }).join('');
  }
  // what is left out: switched off by hand, or outside the chosen groups
  function offAll() {
    var off = Object.assign({}, ui.off);
    if (ui.groups && ui.tpl) ui.tpl.domains.forEach(function (d) { if (ui.groups.indexOf(d.group) < 0) off[d.id] = 1; });
    return off;
  }

  function onClick(e) {
    var t = e.target;
    if (t.closest('[data-x]')) return close();
    if (t.closest('[data-back]')) return choose();
    var tp = t.closest('[data-tpl]'); if (tp) { var tt = tplById(tp.getAttribute('data-tpl')); if (tt) preview(tt); return; }
    if (t.closest('[data-capture]')) { close(); setTimeout(function () { MinestCapture.open(); }, 200); return; }
    if (t.closest('[data-bmix]')) { close(); setTimeout(function () { MinestBuilder.mix(); }, 200); return; }
    if (t.closest('[data-bscratch]')) { close(); setTimeout(function () { MinestBuilder.scratch(); }, 200); return; }
    var bc = t.closest('[data-bcustom]'); if (bc) { var cb = bc.getAttribute('data-bcustom'); close(); setTimeout(function () { MinestBuilder.open(cb); }, 200); return; }
    if (t.closest('[data-duptpl]')) { var cp = JSON.parse(JSON.stringify(ui.tpl)); delete cp.mine; cp.id = 'my-' + slug(cp.name) + '-' + Date.now().toString(36); cp.name = cp.name + ' (copy)'; saveTemplate(cp); toast('Duplicated'); choose(); return; }
    var pt = t.closest('[data-ptool]'); if (pt) { var tid = ui.tpl && ui.tpl.id; close(); setTimeout(function () { MinestPhilo.open(pt.getAttribute('data-ptool'), { template: tid }); }, 200); return; }
    var qa = t.closest('[data-quick]'); if (qa) { if (window.MinestPicker) MinestPicker.open({ bid: qa.getAttribute('data-quick') }); return; }
    var ow = t.closest('[data-openw]'); if (ow) { var obid = ow.getAttribute('data-openw'); if (window.MinestBuilder && KN().get('wa:' + obid) && KN().get('wa:' + obid).view && KN().get('wa:' + obid).view !== 'home') { close(); setTimeout(function () { MinestBuilder.openIn(obid); }, 220); return; } if (window.MinestStarter && MinestStarter.has(obid)) { close(); setTimeout(function () { MinestStarter.home(obid); }, 220); return; } return openWorld(obid); }
    var sw = t.closest('[data-savew]'); if (sw) { var b = boardById(sw.getAttribute('data-savew')); if (b) mineFrom(b); return; }
    if (t.closest('[data-savecur]')) { var cb = A().board && A().board(); if (cb) mineFrom(cb); return; }
    if (t.closest('[data-import]')) return ui.file.click();
    if (t.closest('[data-undo]')) { var u = undo(); toast(u ? '↺ Undid “' + u.title + '”' : 'Nothing to undo'); setTimeout(choose, 300); return; }
    if (ui.view !== 'preview') return;
    if (t.closest('[data-exp]')) return download(ui.tpl);
    if (t.closest('[data-deltpl]')) { if (confirm('Delete the template “' + ui.tpl.name + '”? Worlds made from it stay.')) { KN().set('lom:tpl:' + ui.tpl.id, null); choose(); } return; }
    if (t.closest('[data-codes]')) { ui.codes = !ui.codes; var yc = ui.body.scrollTop; ui.renderPreview(); ui.body.scrollTop = yc; return; }
    var dp = t.closest('[data-depth]'); if (dp) { ui.depth = dp.getAttribute('data-depth'); var yd = ui.body.scrollTop; ui.renderPreview(); ui.body.scrollTop = yd; return; }
    if (t.closest('[data-renaming]')) { ui.renaming = !ui.renaming; var yr = ui.body.scrollTop; ui.renderPreview(); ui.body.scrollTop = yr; return; }
    var rn = ui.renaming && t.closest('[data-rn]'); if (rn) { e.stopPropagation(); var key = rn.getAttribute('data-rn'), was = rn.getAttribute('data-rt'); if (!window.MinestKEdit) return;
      MinestKEdit.sheet({ title: 'Rename', text: 'Template name: ' + was, fields: [{ key: 'title', label: 'Name', value: ui.names[key] || was }], ok: 'Save' }).then(function (v) { if (!v) return; var nv = String(v.title || '').replace(/\s+/g, ' ').trim(); if (!nv || nv === was) delete ui.names[key]; else ui.names[key] = nv.slice(0, 80); var y4 = ui.body.scrollTop; ui.renderPreview(); ui.body.scrollTop = y4; }); return; }
    var lt = t.closest('[data-ltog]'); if (lt) { e.stopPropagation(); var lk = lt.getAttribute('data-ltog'); if (ui.off[lk]) delete ui.off[lk]; else ui.off[lk] = 1; var y5 = ui.body.scrollTop; ui.renderPreview(); ui.body.scrollTop = y5; return; }
    var tg = t.closest('[data-toggle]'); if (tg) { e.stopPropagation(); var id = tg.getAttribute('data-toggle'); if (ui.off[id]) delete ui.off[id]; else ui.off[id] = 1; var y = ui.body.scrollTop; ui.renderPreview(); ui.body.scrollTop = y; return; }
    var dh = t.closest('[data-dopen]'); if (dh) { var did = dh.getAttribute('data-dopen'); ui.openD[did] = !ui.openD[did]; dh.parentNode.classList.toggle('open', !!ui.openD[did]); return; }
    var gr = t.closest('[data-group]'); if (gr) { var gid = gr.getAttribute('data-group'), at = ui.groups.indexOf(gid); if (at >= 0) ui.groups.splice(at, 1); else ui.groups.push(gid); var y3 = ui.body.scrollTop; ui.renderPreview(); ui.body.scrollTop = y3; return; }
    var into = t.closest('[data-into]'); if (into) { ui.into = into.getAttribute('data-into') || null; if (ui.tpl.codes) { var wt = ((ui.into && KN().get('lom:world:' + ui.into)) || {}).templates || {}; ui.codes = wt[ui.tpl.id] ? !!wt[ui.tpl.id].codes : !!ui.tpl.codes.default; } var y2 = ui.body.scrollTop; ui.renderPreview(); ui.body.scrollTop = y2; return; }
    if (t.closest('[data-go]')) {
      try {
        var r = generate(ui.tpl, { off: offAll(), codes: ui.codes, depth: ui.depth, names: ui.names }, ui.into);
        toast(r.isNew ? 'Created “' + r.title + '”' : 'Added to “' + r.title + '”');
        if (ui.tpl.starterPack && window.MinestStarter) { var tpl0 = ui.tpl; close(); MinestStarter.install(r.bid, tpl0).then(function () { MinestStarter.welcome(r.bid, tpl0.id); }); return; }
        openWorld(r.bid, true);
      } catch (ex) { toast('✗ ' + ex.message); }
    }
  }
  function mineFrom(b) {
    var name = prompt('Name your template', b.title + ' (mine)'); if (!name || !name.trim()) return;
    var t = fromBoard(b, name.trim()); saveTemplate(t);
    if (confirm('Saved “' + t.name + '”. Export it as a JSON file too?')) download(t);
    choose();
  }
  // open a world: its board on the Kanban, then its Portal (the world at a glance)
  function openWorld(bid, fresh) {
    close();
    var tries = 0;
    (function go() {
      if (!boardById(bid) && tries++ < 40) return setTimeout(go, 60);
      try { if (A().selectBoard && (A().board() || {}).id !== bid) A().selectBoard(bid); } catch (e) {}
      var w = KN().get('lom:world:' + bid) || {}, skills = Object.keys(w.templates || {}).some(function (k) { var tt = tplById(k); return tt && tt.kind === 'skills'; });
      setTimeout(function () { if (skills && window.MinestSkills) MinestSkills.open(bid); else if (window.MinestWiki && MinestWiki.open) MinestWiki.open(bid); }, fresh ? 400 : 250);
    })();
  }

  window.MinestWorld = { _art: artOf, _icons: ICON, _openWorld: function (bid) { openWorld(bid); }, plan: plan, open: open, close: close, isOpen: function () { return ui.open; }, templates: templates, generate: generate, undo: undo, fromBoard: fromBoard, saveTemplate: saveTemplate, check: check, worlds: worlds, _plan: plan };
})();
