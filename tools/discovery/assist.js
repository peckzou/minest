/* Minest · Building Assist — suggestions exactly when you are building (window.MinestAssist)
   Not a place to visit: a thin layer next to what you are typing, picking or deciding.
   1 Inline   — names and things as you type: World · Category (area / section) · List · Item (Capture) · Search (Visual Library).
                Sources, in order: what you used before ('as:hist:<kind>') · template vocabulary (every Worldview Template) ·
                your own worlds (to avoid duplicates — shown as a gentle "already have") · local catalogues (pickers).
                Local only, so every keystroke is cheap (debounced); nothing is sent anywhere.
   2 Choice   — the Visual Library's related row (discovery.js) — this file only keeps it compact.
   3 Decision — where things belong: 2–3 explained options in the Visual Library's "Add to My World" and in My World's
                New List (area). Local rules first; "Ask AI" (the existing Minest AI endpoint) only when you tap it.
   A suggestion is never a decision: tapping fills a field or ticks a box; saving stays with the existing flows (and their Undo). */
(function () {
  if (window.MinestAssist) return;
  var KN = function () { return window.MinestKnowledge; };
  var A = function () { return window.MinestAI || {}; };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function boards() { try { return (A().boards && A().boards()) || []; } catch (e) { return []; } }
  function worlds() { return window.MinestWorld ? MinestWorld.worlds() : []; }
  function isHead(id) { return !!(KN() && KN().isHeading && KN().isHeading(id)); }
  function norm(s) { return String(s || '').toLowerCase().replace(/^my\s+/, '').replace(/[^a-z0-9一-鿿 ]+/g, ' ').replace(/\s+/g, ' ').trim(); }
  function stem(w) { return w.length > 4 ? w.replace(/(ies)$/, 'y').replace(/(es|s)$/, '') : w; }
  function words(s) { return norm(s).split(' ').filter(function (w) { return w.length > 2; }).map(stem); }

  // ================================================================== vocabulary (built once, refreshed when worlds change)
  var VOC = null, VOCAT = 0;
  function vocab() {
    if (VOC && Date.now() - VOCAT < 20000) return VOC;
    var v = { world: [], category: [], list: [], item: [], mine: { world: [], category: [], list: [] } }, seen = {};
    function add(kind, title, src) { var k = kind + ':' + norm(title); if (!title || seen[k]) return; seen[k] = 1; v[kind].push({ t: String(title), src: src }); }
    (window.MinestWorld ? MinestWorld.templates() : []).forEach(function (t) {
      var src = 'Template · ' + (t.name || t.id);
      add('world', t.worldTitle || t.name, src);
      (t.domains || []).forEach(function (d) {
        add('category', d.title, src);
        (d.lists || []).forEach(function (l) { add('list', l.title, src); (l.lists || []).forEach(function (x) { add('list', x.title, src); }); });
        (d.categories || []).forEach(function (c) { add('category', c.title, src); (c.lists || []).forEach(function (l) { add('list', l.title, src); (l.lists || []).forEach(function (x) { add('list', x.title, src); }); }); });
      });
    });
    var P = window.__MINEST_PICKERS || {};
    Object.keys(P).forEach(function (k) { (P[k].items || []).forEach(function (it) { add('item', it.title, (P[k].title || k) + (it.sub ? ' · ' + it.sub : '')); }); });
    worlds().forEach(function (w) {
      v.mine.world.push({ t: w.b.title, where: 'your worlds', bid: w.b.id });
      (w.b.columns || []).forEach(function (c) {
        v.mine.category.push({ t: c.title, where: w.b.title, bid: w.b.id, col: c.id });
        (c.cards || []).forEach(function (k) { if (!k || !k.id) return; if (isHead(k.id)) v.mine.category.push({ t: k.title, where: w.b.title + ' › ' + c.title, bid: w.b.id }); else v.mine.list.push({ t: k.title, where: w.b.title + ' › ' + c.title, bid: w.b.id, col: c.id, card: k.id, n: (k.stack || []).length }); });
      });
    });
    VOC = v; VOCAT = Date.now(); return v;
  }
  window.addEventListener('minest:kedit', function () { VOC = null; });
  function hist(kind) { return (KN() && KN().get('as:hist:' + kind)) || []; }
  function remember(kind, value) { if (!KN() || !value) return; var h = hist(kind).filter(function (x) { return norm(x) !== norm(value); }); h.unshift(String(value)); KN().set('as:hist:' + kind, h.slice(0, 20), true); }
  function myFirst(kind, s) { s = String(s).trim(); return kind === 'item' || kind === 'search' || /^my\s/i.test(s) ? s : 'My ' + s.charAt(0).toUpperCase() + s.slice(1); }

  // matches for a typed text: history → starts-with → any word starts-with (template vocabulary / catalogues)
  function complete(kind, text, ctx) {
    var q = norm(text), raw = String(text || '').trim(); if (q.length < (kind === 'item' || kind === 'search' ? 2 : 1)) return { items: [], dup: null };
    var v = vocab(), pool = kind === 'world' ? v.world : kind === 'category' ? v.category : kind === 'list' ? v.list : v.item, out = [], seen = {};
    function push(t, src, why) { var k = norm(t); if (!k || seen[k] || k === q) return; seen[k] = 1; out.push({ t: t, src: src, why: why }); }
    hist(kind === 'search' ? 'search' + (ctx && ctx.cat ? ':' + ctx.cat : '') : kind).forEach(function (h) { if (norm(h).indexOf(q) === 0) push(h, 'You used this before', 'hist'); });
    var src = kind === 'search' ? v.item.filter(function (x) { return !ctx || !ctx.catTitle || x.src.indexOf(ctx.catTitle) === 0; }) : pool;
    src.forEach(function (x) { if (norm(x.t).indexOf(q) === 0) push(x.t, x.src, 'start'); });
    src.forEach(function (x) { if (out.length < 12 && norm(x.t).split(' ').some(function (w) { return w.indexOf(q) === 0; })) push(x.t, x.src, 'word'); });
    // "already have": the same name in your world (lists / areas / worlds) — so you can reuse instead of duplicating
    var mine = kind === 'world' ? v.mine.world : kind === 'category' ? v.mine.category : kind === 'list' ? v.mine.list : [];
    var dup = mine.filter(function (m) { return norm(m.t) === q || (q.length > 3 && norm(m.t) === norm(myFirst(kind, raw))); })[0] || null;
    var itemDup = null;
    if (kind === 'item' && q.length > 2) worlds().some(function (w) { return (w.b.columns || []).some(function (c) { return (c.cards || []).some(function (k) { return (k.stack || []).some(function (s) { if (norm(s.title) === q) { itemDup = { t: s.title, where: k.title + ' · ' + w.b.title }; return true; } return false; }); }); }); });
    return { items: out.slice(0, kind === 'item' ? 5 : 6), dup: dup || itemDup };
  }

  // ================================================================== the inline dropdown (one at a time)
  var CSS = [
    '.as-pop{position:fixed;z-index:2147483300;min-width:220px;max-width:min(420px,92vw);padding:6px;border-radius:16px;background:rgba(28,32,44,.97);color:#f3f5f8;border:1px solid rgba(255,255,255,.14);box-shadow:0 18px 44px rgba(0,0,0,.42);font:14px/1.3 -apple-system,BlinkMacSystemFont,system-ui,sans-serif;-webkit-backdrop-filter:blur(20px);backdrop-filter:blur(20px)}',
    'html.kn-light .as-pop{background:rgba(255,255,255,.98);color:#15171c;border-color:rgba(0,0,0,.1);box-shadow:0 18px 44px rgba(20,30,50,.18)}',
    '.as-pop .h{display:flex;align-items:center;gap:6px;padding:4px 8px 6px;font-size:11.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;opacity:.55}.as-pop .h span{flex:1}.as-pop .h button{border:0;background:none;color:inherit;font-size:15px;cursor:pointer;opacity:.8;padding:0 2px}',
    '.as-it{display:flex;flex-direction:column;width:100%;text-align:left;padding:8px 10px;border:0;border-radius:11px;background:none;color:inherit;font:inherit;cursor:pointer}.as-it b{font-weight:600}.as-it small{font-size:11.5px;opacity:.55;margin-top:1px}',
    '.as-it:hover,.as-it.on{background:rgba(127,127,127,.18)}',
    '.as-dup{display:flex;align-items:center;gap:8px;margin:0 2px 4px;padding:8px 10px;border-radius:11px;background:rgba(255,159,10,.14);font-size:13px}.as-dup b{font-weight:650}.as-dup button{margin-left:auto;border:0;border-radius:999px;padding:4px 10px;background:rgba(255,159,10,.3);color:inherit;font:600 12px -apple-system,system-ui,sans-serif;cursor:pointer;white-space:nowrap}',
    // decision blocks
    '.as-dec{margin:6px 0 12px;padding:10px;border-radius:16px;border:1px solid rgba(127,127,127,.25);background:rgba(127,127,127,.08)}',
    '.as-dec .t{font-size:12px;font-weight:750;letter-spacing:.06em;text-transform:uppercase;opacity:.6;margin:0 2px 6px}',
    '.as-opt{display:flex;align-items:center;gap:10px;width:100%;text-align:left;padding:9px 10px;margin-bottom:5px;border-radius:12px;border:1px solid rgba(127,127,127,.25);background:none;color:inherit;font:inherit;cursor:pointer}',
    '.as-opt div{flex:1;min-width:0}.as-opt b{display:block;font-size:14.5px}.as-opt small{display:block;font-size:12px;opacity:.65;margin-top:1px}.as-opt i{font-style:normal;width:22px;height:22px;border-radius:50%;border:1.5px solid rgba(127,127,127,.5);display:grid;place-items:center;font-size:12px;flex:none}',
    '.as-opt.on{border-color:#0a84ff;background:rgba(10,132,255,.12)}.as-opt.on i{background:#0a84ff;border-color:#0a84ff;color:#fff}',
    '.as-ai{border:0;background:none;color:#5ac8fa;font:650 13px -apple-system,system-ui,sans-serif;cursor:pointer;padding:4px 2px}',
    '.as-chips{display:flex;flex-wrap:wrap;gap:6px;margin:2px 0 8px}.as-chip{border:1px solid rgba(127,127,127,.3);border-radius:999px;padding:5px 11px;background:none;color:inherit;font:600 12.5px -apple-system,system-ui,sans-serif;cursor:pointer;text-align:left}.as-chip small{display:block;font-weight:500;font-size:11px;opacity:.6}.as-chip.on{background:#0a84ff;border-color:transparent;color:#fff}'
  ].join('\n');
  function css() { if (document.getElementById('as-css')) return; var s = document.createElement('style'); s.id = 'as-css'; s.textContent = CSS; document.head.appendChild(s); }
  var P = { el: null, input: null, kind: null, items: [], idx: -1, off: {} };
  function close() { if (P.el) P.el.remove(); P.el = null; P.idx = -1; }
  function show(input, kind, res, ctx) {
    css(); close();
    if (!res.items.length && !res.dup) return;
    var el = document.createElement('div'); el.className = 'as-pop'; el.setAttribute('role', 'listbox');
    var label = { world: 'World names', category: 'Area names', list: 'List names', item: 'Things you might mean', search: 'Try' }[kind] || 'Suggestions';
    el.innerHTML = '<div class="h"><span>' + label + '</span><button type="button" data-asx aria-label="Ignore">×</button></div>' +
      (res.dup ? '<div class="as-dup"><span>Already have <b>' + esc(res.dup.t) + '</b><br><small style="opacity:.7">' + esc(res.dup.where) + '</small></span>' + (res.dup.card && ctx && ctx.onReuse ? '<button type="button" data-asreuse>Use it</button>' : '') + '</div>' : '') +
      res.items.map(function (x, i) { return '<button type="button" class="as-it" data-asi="' + i + '" role="option"><b>' + esc(x.t) + '</b><small>' + esc(x.src) + '</small></button>'; }).join('');
    ['pointerdown', 'mousedown', 'touchstart'].forEach(function (t) { el.addEventListener(t, function (e) { e.preventDefault(); e.stopPropagation(); }, { passive: false }); });   // keep the focus in the field
    el.addEventListener('click', function (e) {
      e.stopPropagation(); var b;
      if (e.target.closest('[data-asx]')) { P.off[kind + ':' + norm(input.value)] = 1; return close(); }
      if (e.target.closest('[data-asreuse]')) { close(); return ctx.onReuse(res.dup); }
      if ((b = e.target.closest('[data-asi]'))) accept(+b.getAttribute('data-asi'));
    });
    document.body.appendChild(el); P.el = el; P.input = input; P.kind = kind; P.items = res.items; P.ctx = ctx || {};
    place();
  }
  function place() {
    if (!P.el || !P.input || !P.input.isConnected) return close();
    var r = P.input.getBoundingClientRect(), h = P.el.offsetHeight, below = window.innerHeight - r.bottom;
    P.el.style.left = Math.max(8, Math.min(window.innerWidth - P.el.offsetWidth - 8, r.left)) + 'px';
    P.el.style.minWidth = Math.min(r.width, 420) + 'px';
    P.el.style.top = (below > h + 12 || below > r.top ? r.bottom + 6 : Math.max(8, r.top - h - 6)) + 'px';
  }
  function accept(i) {
    var x = P.items[i], input = P.input, kind = P.kind, ctx = P.ctx || {}; if (!x || !input) return;
    var val = kind === 'item' || kind === 'search' ? x.t : myFirst(kind, x.t);
    input.value = val; input.dispatchEvent(new Event('input', { bubbles: true }));
    remember(kind === 'search' ? 'search' + (ctx.cat ? ':' + ctx.cat : '') : kind, val);
    close(); input.focus(); try { input.setSelectionRange(val.length, val.length); } catch (e) {}
    if (ctx.onAccept) ctx.onAccept(val, x);
  }
  var T = 0;
  function onInput(input, kind, ctxFn) {
    clearTimeout(T);
    T = setTimeout(function () {
      if (document.activeElement !== input) return;
      if (P.off[kind + ':' + norm(input.value)]) return close();
      var ctx = ctxFn ? ctxFn() : {};
      show(input, kind, complete(kind, input.value, ctx), ctx);
    }, 120);
  }
  // attach to any field: MinestAssist.attach(input, 'list', () => ({ onReuse(dup) {…} }))
  function attach(input, kind, ctxFn) {
    if (!input || input.__as) return; input.__as = kind; input.setAttribute('autocomplete', 'off');
    input.addEventListener('input', function () { onInput(input, kind, ctxFn); });
    input.addEventListener('focus', function () { if (input.value) onInput(input, kind, ctxFn); });
    input.addEventListener('blur', function () { setTimeout(function () { if (P.input === input) close(); }, 150); });
    input.addEventListener('keydown', function (e) {
      if (!P.el || P.input !== input) return;
      var n = P.items.length;
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); P.idx = n ? (P.idx + (e.key === 'ArrowDown' ? 1 : -1) + n) % n : -1; P.el.querySelectorAll('.as-it').forEach(function (b, i) { b.classList.toggle('on', i === P.idx); }); return; }
      if (e.key === 'Enter' && P.idx >= 0) { e.preventDefault(); e.stopPropagation(); return accept(P.idx); }   // Enter only takes a suggestion you moved to
      if (e.key === 'Escape') { e.stopPropagation(); P.off[kind + ':' + norm(input.value)] = 1; close(); }
    }, true);
  }
  window.addEventListener('resize', place); document.addEventListener('scroll', place, true);

  // ---------------------------------------------------------------- where each field lives (attached as it appears)
  var PICKCAT = { movies: 'Movies', books: 'Books', music: 'Artists', food: 'Foods' };
  function scan() {
    // My World 3.0 · New List name
    document.querySelectorAll('.uv [data-nlname]').forEach(function (i) { attach(i, 'list', function () { return { onReuse: function (d) { if (window.MinestUniverse) { MinestUniverse.go([{ t: 'home' }, { t: 'world', bid: d.bid }, { t: 'cat', bid: d.bid, col: d.col }, { t: 'list', bid: d.bid, col: d.col, card: d.card }]); } } }; }); });
    // World Builder · world name; the editor's New area / New category / New list sheets
    document.querySelectorAll('.bd [data-sv="title"]').forEach(function (i) { attach(i, 'world'); });
    document.querySelectorAll('.ke-sheet').forEach(function (sh) {
      var h = (sh.querySelector('h4') || {}).textContent || '', i = sh.querySelector('input');
      if (!i) return;
      if (/^New area$|^New category$/.test(h)) attach(i, 'category');
      else if (/^New list$/.test(h)) attach(i, 'list');
    });
    // Visual Library · its new-list name and its search
    document.querySelectorAll('.vl input.vl-new').forEach(function (i) { attach(i, 'list'); });
    var vs = document.querySelector('.vl input[type=search]');
    if (vs) attach(vs, 'search', function () { var on = document.querySelector('.vl [data-category][aria-pressed="true"]'), cat = on ? on.getAttribute('data-category') : ''; return { cat: cat, catTitle: PICKCAT[cat] || '' }; });
    // Quick Capture · the thing you are adding
    document.querySelectorAll('.wc [data-cap]').forEach(function (i) { attach(i, 'item'); });
  }
  var mo = new MutationObserver(function () { clearTimeout(mo.t); mo.t = setTimeout(scan, 60); });
  function watch() { if (!document.body) return setTimeout(watch, 200); mo.observe(document.body, { childList: true, subtree: true }); }
  watch();
  // the search you actually ran becomes history for next time
  document.addEventListener('keydown', function (e) { if (e.key === 'Enter' && e.target && e.target.__as === 'search' && String(e.target.value).trim().length > 1) { var c = (P.ctx && P.ctx.cat) || ''; remember('search' + (c ? ':' + c : ''), e.target.value.trim()); } }, true);

  // ================================================================== decisions: where does it belong?
  var KINDRX = { movies: /movie|film|cinema|watch|screen|show/, books: /book|read|librar|novel/, music: /music|album|song|artist|singer|band|playlist/, people: /people|person|hero|thinker|scientist|philosopher|figure/,
    history: /history|event|ancient/, nature: /nature|animal|plant|bird|tree|garden|wild/, sports: /sport|team|athlete|game day/, places: /place|travel|trip|visit|landmark|countr|city/, food: /food|recipe|meal|dish|cook|bak/,
    brands: /brand|shop|wish/, games: /game/, art: /art|paint|museum|gallery/, images: /image|photo|inspiration|picture/ };
  var CATOF = { tmdb: 'movies', openlibrary: 'books', googlebooks: 'books', itunes: 'music', musicbrainz: 'music', inaturalist: 'nature', themealdb: 'food', artic: 'art', openverse: 'images' };
  function catOf(x) { return CATOF[x.source && x.source.provider] || (x.metadata && x.metadata.category) || 'people'; }
  // score each list for these entities: name · what it already holds · where you put this kind before
  function destOptions(entities, bid) {
    var cats = {}; entities.forEach(function (x) { cats[catOf(x)] = 1; }); var cl = Object.keys(cats), one = cl.length === 1 ? cl[0] : null;
    var typeOf = {}; entities.forEach(function (x) { typeOf[x.entityType] = 1; });
    var past = (KN() && KN().get('as:dest')) || {}, out = [];
    var b = boards().filter(function (z) { return z.id === bid; })[0]; if (!b) return [];
    (b.columns || []).forEach(function (c) { (c.cards || []).forEach(function (k) {
      if (!k || !k.id || isHead(k.id) || /inbox/i.test(k.title || '')) return;
      var s = 0, why = [], t = String(k.title).toLowerCase() + ' ' + String(c.title).toLowerCase();
      if (one && KINDRX[one] && KINDRX[one].test(String(k.title).toLowerCase())) { s += 3; why.push('Its name fits ' + one); }
      else if (one && KINDRX[one] && KINDRX[one].test(String(c.title).toLowerCase())) { s += 1.5; why.push('In ' + c.title); }
      var same = (k.stack || []).filter(function (st) { var key = KN().get('pk:' + st.id), r = key && KN().get(key); return r && (typeOf[r.type] || typeOf[r.entityType]); }).length;
      if (same) { s += Math.min(3, 1 + same * .4); why.push('Already holds ' + same + ' like these'); }
      var p = one && past[one] && past[one][k.id]; if (p) { s += Math.min(2, p * .7); why.push('Where you put ' + one + ' before'); }
      if (/favou?rite/.test(t) && s) { s += .3; }
      if (s > 0) out.push({ id: k.id, title: k.title, area: c.title, score: s, why: why.join(' · ') });
    }); });
    return out.sort(function (a, z) { return z.score - a.score; }).slice(0, 3);
  }
  function learnDest(entities, listIds) {
    if (!KN() || !listIds.length) return; var past = Object.assign({}, KN().get('as:dest') || {});
    var cats = {}; entities.forEach(function (x) { cats[catOf(x)] = 1; });
    Object.keys(cats).forEach(function (c) { var m = Object.assign({}, past[c] || {}); listIds.forEach(function (id) { m[id] = (m[id] || 0) + 1; }); past[c] = m; });
    KN().set('as:dest', past, true);
  }
  // Ask AI (only on tap): the existing Minest AI endpoint, names only — never notes
  function askAI(entities, lists) {
    var url = 'https://minest-app.vercel.app/api/minest/ai-chat'; try { url = localStorage.getItem('minest_ai_chat_endpoint') || url; } catch (e) {}
    var prompt = 'Choose where these items belong in a personal collection. Reply with JSON only: {"lists":[up to 3 existing list names, best first],"why":"one short reason"}.\nItems: ' + JSON.stringify(entities.slice(0, 20).map(function (x) { return x.title + ' (' + (x.entityType || catOf(x)) + ')'; })) + '\nExisting lists: ' + JSON.stringify(lists.slice(0, 160).map(function (l) { return l.title; }));
    var headers = typeof minestAIHeaders === 'function' ? minestAIHeaders() : { 'Content-Type': 'application/json' };
    return fetch(url, { method: 'POST', headers: headers, body: JSON.stringify({ prompt: prompt, model: 'chatgpt', attachments: [], history: [], mode: 'conversation' }) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (p) { if (!r.ok || p.error) throw new Error(p.error || 'AI is not available (' + r.status + ')'); return p.reply || p.message || p.text || ''; }); })
      .then(function (txt) { var m = String(txt).match(/\{[\s\S]*\}/); if (!m) throw new Error('The AI answer could not be read.'); var j = JSON.parse(m[0]); return { lists: (j.lists || []).map(function (n) { return lists.filter(function (l) { return norm(l.title) === norm(n); })[0]; }).filter(Boolean).slice(0, 3), why: String(j.why || '').slice(0, 140) }; });
  }
  // the Visual Library's "Add to My World": a small "Suggested" block above its list of destinations
  var VLD = { key: '' };
  function vlSelected() { try { return window.MinestVisualLibrary && MinestVisualLibrary.selected ? MinestVisualLibrary.selected() : []; } catch (e) { return []; } }
  function vlDecision() {
    var vl = document.querySelector('.vl'); if (!vl) return;
    var first = vl.querySelector('input[data-dest]'); if (!first) return;
    var box = first.closest('.vl-dest'), body = box && box.parentNode; if (!body) return;
    var sel = vlSelected(); if (!sel.length) return;
    var w = vl.querySelector('select.vl-select'), bid = w ? w.value : (worlds()[0] || { b: {} }).b.id;
    var key = bid + '|' + sel.map(function (x) { return x.entityId; }).join(',');
    var old = body.querySelector('.as-dec'); if (old && old.__key === key) { syncChecks(old); return; } if (old) old.remove();
    css();
    var opts = destOptions(sel, bid), h3 = Array.prototype.filter.call(body.querySelectorAll('h3'), function (x) { return /Destination lists/.test(x.textContent); })[0];
    var dec = document.createElement('div'); dec.className = 'as-dec'; dec.__key = key;
    var lists = []; var b = boards().filter(function (z) { return z.id === bid; })[0]; (b && b.columns || []).forEach(function (c) { (c.cards || []).forEach(function (k) { if (k && !isHead(k.id) && !/inbox/i.test(k.title || '')) lists.push({ id: k.id, title: k.title, area: c.title }); }); });
    function draw(ai) {
      var all = opts.slice(); (ai && ai.lists || []).forEach(function (l) { if (!all.some(function (o) { return o.id === l.id; })) all.push({ id: l.id, title: l.title, area: l.area, why: 'AI: ' + (ai.why || 'a likely fit') }); });
      dec.innerHTML = '<div class="t">Suggested for ' + (sel.length === 1 ? '“' + esc(sel[0].title) + '”' : sel.length + ' things') + '</div>' +
        (all.length ? all.slice(0, 3).map(function (o) { return '<button type="button" class="as-opt" data-asdest="' + esc(o.id) + '"><i></i><div><b>' + esc(o.title) + '</b><small>' + esc(o.why || o.area) + '</small></div></button>'; }).join('')
          : '<p style="margin:2px 4px 6px;font-size:13px;opacity:.7">No clear fit in this world — choose below, make a new list, or keep it in the Inbox.</p>') +
        (!ai && (!opts.length || opts[0].score < 3) ? '<button type="button" class="as-ai" data-asai>✨ Not sure? Ask AI</button>' : '') + (ai && ai.error ? '<p style="margin:4px;font-size:12.5px;opacity:.7">' + esc(ai.error) + '</p>' : '');
      syncChecks(dec);
    }
    draw(null);
    dec.addEventListener('click', function (e) {
      var o = e.target.closest('[data-asdest]');
      if (o) { e.stopPropagation(); var cb = body.querySelector('input[data-dest="' + (window.CSS && CSS.escape ? CSS.escape(o.getAttribute('data-asdest')) : o.getAttribute('data-asdest')) + '"]'); if (cb) { cb.checked = !cb.checked; cb.dispatchEvent(new Event('change', { bubbles: true })); } syncChecks(dec); return; }
      if (e.target.closest('[data-asai]')) { e.stopPropagation(); e.target.textContent = 'Asking…'; askAI(sel, lists).then(function (r) { draw(r); }, function (er) { draw({ lists: [], error: er.message }); }); }
    });
    if (h3) body.insertBefore(dec, h3); else body.insertBefore(dec, box);
  }
  function syncChecks(dec) { dec.querySelectorAll('[data-asdest]').forEach(function (o) { var cb = document.querySelector('.vl input[data-dest="' + (window.CSS && CSS.escape ? CSS.escape(o.getAttribute('data-asdest')) : o.getAttribute('data-asdest')) + '"]'); o.classList.toggle('on', !!(cb && cb.checked)); }); }
  document.addEventListener('change', function (e) { if (e.target && e.target.matches && e.target.matches('.vl input[data-dest]')) { var d = document.querySelector('.vl .as-dec'); if (d) syncChecks(d); } }, true);
  // remember where things went (only on Save — a suggestion alone teaches nothing)
  document.addEventListener('click', function (e) {
    var s = e.target.closest && e.target.closest('.vl [data-save]'); if (!s) return;
    var ids = Array.prototype.map.call(document.querySelectorAll('.vl input[data-dest]:checked'), function (i) { return i.getAttribute('data-dest'); });
    learnDest(vlSelected(), ids);
  }, true);
  var mo2 = new MutationObserver(function () { clearTimeout(mo2.t); mo2.t = setTimeout(vlDecision, 50); });
  function watch2() { if (!document.body) return setTimeout(watch2, 200); mo2.observe(document.body, { childList: true, subtree: true }); }
  watch2();

  // My World's New List: 2–3 areas that fit the name, each with its reason
  function near(a, b) { return a === b || (a.length >= 4 && b.length >= 4 && (a.indexOf(b) === 0 || b.indexOf(a) === 0)); }
  function areaOptions(bid, name, hint) {
    css(); var b = boards().filter(function (z) { return z.id === bid; })[0]; if (!b) return [];
    var ws = words(name), recent = hist('area'), out = [];
    if (!ws.length) return [];
    (b.columns || []).forEach(function (c) {
      var s = 0, why = [], cw = words(c.title), sib = (c.cards || []).filter(function (k) { return k && !isHead(k.id); });
      var hit = ws.filter(function (w) { return cw.some(function (x) { return near(w, x); }); }); if (hit.length) { s += 3; why.push('Its name shares “' + hit[0] + '”'); }
      var hv = hint ? hint(c) : null; if (hv) { s += hv.score; why.push(hv.why); }
      var like = sib.filter(function (k) { var kw = words(k.title); return ws.some(function (w) { return kw.some(function (x) { return near(w, x); }); }); });
      if (like.length) { s += 1.5 + Math.min(1.5, like.length * .5); why.push('Has ' + like.slice(0, 2).map(function (k) { return k.title; }).join(', ')); }
      if (recent.indexOf(c.id) >= 0 && s) { s += .5; }
      if (s > 0) out.push({ col: c.id, title: c.title, score: s, why: why.join(' · ') });
    });
    return out.sort(function (a, z) { return z.score - a.score; }).slice(0, 3);
  }

  window.MinestAssist = { attach: attach, complete: complete, destOptions: destOptions, areaOptions: areaOptions, remember: remember, close: close, _vocab: vocab };
})();
