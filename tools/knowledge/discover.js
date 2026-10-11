/* Minest Knowledge · Discover My World — window.MinestDiscover
   Explore → Choose → Compare → Discover → Save. Not a quiz: nothing is right or wrong, it only records what the user chose.
   One shared engine for the three tools (This or That · Tier List · Tournament):
     source (an existing list, a List of Mine card with its stacked items, or a JSON file) → items → a session → choices → result.
   A session is one record 'dv:<id>' = { id, tool, title, source, items:[{id, title, ref}], config, status, choices, result,
   createdAt, updatedAt }. Items keep only a reference (the card / stacked card id, or the knowledge item it links to);
   pictures are read from the card when shown, so nothing is copied and no card is ever changed (no mastery, no "done").
   "Add to My World" writes one result card into "My Discoveries" (stacked cards point to the same items) and is
   logged like any other add, so My World can show it and undo it. */
(function () {
  if (window.MinestDiscover) return;
  var A = function () { return window.MinestAI || {}; };
  var KN = function () { return window.MinestKnowledge; };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function slug(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'x'; }
  function rid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function toast(m) { try { if (window.GlassUI && GlassUI.toast) GlassUI.toast(m); } catch (e) {} }
  function hap(t) { try { if (window.MinestNative && MinestNative.haptic) MinestNative.haptic(t || 'selection'); } catch (e) {} }
  function boards() { try { return (A().boards && A().boards()) || []; } catch (e) { return []; } }
  function boardById(id) { return boards().filter(function (b) { return b.id === id; })[0] || null; }
  function hash(s) { var h = 2166136261; s = String(s); for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), x = a[i]; a[i] = a[j]; a[j] = x; } return a; }
  var reduce = false; try { reduce = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  function day(t) { try { return new Date(t).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }); } catch (e) { return ''; } }

  // ================================================================== sources → items
  function worldIds() { return (KN() ? KN().keys('lom:world:') : []).map(function (k) { return k.slice(10); }).filter(function (id) { return boardById(id); }); }
  function isWorld(bid) { return !!(KN() && KN().get('lom:world:' + bid)); }
  function realCards(col) { return (col.cards || []).filter(function (c) { return c && c.id && !(KN() && KN().isHeading(c.id)); }); }
  // every list the user has: a board list (its cards), or a "My …" card (its stacked cards)
  function sources() {
    var out = [];
    boards().forEach(function (b) {
      (b.columns || []).forEach(function (col) {
        var cs = realCards(col);
        if (cs.length >= 2) out.push({ kind: 'list', bid: b.id, id: col.id, title: col.title, board: b.title, n: cs.length, world: isWorld(b.id) });
        cs.forEach(function (c) { var st = (c.stack || []).length; if (st >= 2) out.push({ kind: 'card', bid: b.id, id: c.id, title: c.title, board: b.title, area: col.title, n: st, world: isWorld(b.id) }); });
      });
    });
    return out;
  }
  function locateCard(b, id) { var hit = null; (b.columns || []).forEach(function (col) { (col.cards || []).forEach(function (c) { if (c && c.id === id) hit = { col: col, card: c }; (c && c.stack || []).forEach(function (s) { if (s.id === id) hit = { col: col, card: c, item: s }; }); }); }); return hit; }
  function itemsOf(src) {
    var b = boardById(src.bid); if (!b) return [];
    if (src.kind === 'list') { var col = (b.columns || []).filter(function (c) { return c.id === src.id; })[0]; return col ? realCards(col).map(function (c) { return { id: c.id, title: c.title, ref: { bid: b.id, id: c.id } }; }) : []; }
    var L = locateCard(b, src.id); if (!L || !L.card) return [];
    var seen = {};
    return (L.card.stack || []).map(function (s) { var key = KN() && KN().get('pk:' + s.id); var id = key || s.id; if (seen[id]) return null; seen[id] = 1; return { id: id, title: s.title, ref: { bid: b.id, id: s.id, key: key || null } }; }).filter(Boolean);
  }
  // what an item looks like now (picture from the card, else from its knowledge item; gone if deleted)
  function view(it) {
    var o = { title: it.title, img: it.img || '', sub: it.sub || '', gone: false };
    if (it.ref) {
      var b = boardById(it.ref.bid), L = b && locateCard(b, it.ref.id), c = L && (L.item || L.card);
      if (c) { o.title = c.title || o.title; var cv = c.cover; if (cv && (cv.value || cv.url) && (!cv.type || cv.type === 'image')) o.img = cv.value || cv.url; o.sub = String(c.desc || '').split('\n')[0].slice(0, 60); }
      else if (!it.ref.key) o.gone = true;
      if (!o.img && it.ref.key) { var r = KN().get(it.ref.key); if (r && r.img) o.img = r.img; if (r && !c) { o.title = r.title || o.title; o.sub = r.sub || ''; } else if (!r && !c) o.gone = true; }
    }
    return o;
  }
  function art(it, cls) {
    var v = view(it), h = hash(v.title), a = h % 360, b2 = (a + 50 + (h >> 9) % 70) % 360;
    if (v.img) return '<span class="dv-art ' + (cls || '') + '" style="background-image:url(&quot;' + esc(v.img) + '&quot;)"></span>';
    return '<span class="dv-art drawn ' + (cls || '') + (v.gone ? ' gone' : '') + '" style="background:linear-gradient(155deg,hsl(' + a + ' 60% 46%),hsl(' + b2 + ' 68% 24%))"><b>' + esc(v.title) + '</b>' + (v.gone ? '<small>removed</small>' : '') + '</span>';
  }

  // ---------------------------------------------------------------- JSON (format minest.discover/1)
  var TOOLS = ['this-or-that', 'tier-list', 'tournament'];
  function fromJson(j) {
    if (!j || typeof j !== 'object') throw new Error('This is not a Discover file.');
    if (j.format && j.format !== 'minest.discover/1') throw new Error('Unknown format "' + j.format + '" (expected minest.discover/1).');
    if (!Array.isArray(j.items) || j.items.length < 2) throw new Error('"items" needs at least 2 items.');
    var ids = {};
    var items = j.items.map(function (x, i) {
      if (!x || !x.title) throw new Error('Item #' + (i + 1) + ' needs a "title".');
      var id = String(x.id || slug(x.title)); if (ids[id]) throw new Error('Two items share the id "' + id + '".'); ids[id] = 1;
      var img = x.image || x.img || '';
      if (img && !/^https:\/\//i.test(img) && !(/^data:image\//.test(img) && img.length < 300000)) img = '';   // only https links or small embedded pictures
      return { id: 'json:' + slug(j.discoveryId || j.title) + ':' + id, title: String(x.title).slice(0, 120), img: img, sub: x.category || '', desc: x.description || '' };
    });
    var tools = (j.enabledTools || TOOLS).filter(function (t) { return TOOLS.indexOf(t) >= 0; });
    return { title: String(j.title || 'My Discovery').slice(0, 80), id: String(j.discoveryId || ''), items: items, tools: tools.length ? tools : TOOLS, config: j.config || {} };
  }

  // ================================================================== sessions
  function all() { return (KN() ? KN().keys('dv:') : []).map(function (k) { return KN().get(k); }).filter(Boolean).sort(function (a, b) { return b.updatedAt - a.updatedAt; }); }
  function get(id) { return KN().get('dv:' + id); }
  function put(s) { s.updatedAt = Date.now(); KN().set('dv:' + s.id, s, true); return s; }
  function create(tool, src, items, config, title) {
    return { id: rid(), tool: tool, title: title, source: src, items: items.map(function (x) { var o = { id: x.id, title: x.title, ref: x.ref || null }; if (x.img) o.img = x.img; if (x.sub) o.sub = x.sub; return o; }),
      config: config || {}, status: 'draft', choices: [], result: null, createdAt: Date.now(), updatedAt: Date.now() };
  }
  function itemById(s, id) { return s.items.filter(function (x) { return x.id === id; })[0] || null; }
  var TOOL_T = { 'this-or-that': 'This or That', 'tier-list': 'Tier List', tournament: 'Tournament' };
  var STATUS_T = { draft: 'Draft', 'in-progress': 'In progress', completed: 'Completed' };

  // ---------------------------------------------------------------- This or That: pairs
  function makePairs(items, max, mode) {
    var ids = items.map(function (x) { return x.id; }), out = [], seen = {}, cap = Math.min(max, ids.length * (ids.length - 1) / 2);
    function add(a, b) { var k = a < b ? a + '|' + b : b + '|' + a; if (a === b || seen[k]) return false; seen[k] = 1; out.push([a, b]); return true; }
    if (mode === 'sequential') {
      for (var i = 0; i + 1 < ids.length && out.length < cap; i += 2) add(ids[i], ids[i + 1]);   // 1–2, 3–4, … then 2–3, 4–5, … then further apart
      for (var off = 1; off < ids.length && out.length < cap; off++) for (var j = 0; j + off < ids.length && out.length < cap; j++) add(ids[j], ids[j + off]);
    } else {
      var tries = 0;
      while (out.length < cap && tries++ < 60) { var sh = shuffle(ids); for (var k = 0; k + 1 < sh.length && out.length < cap; k += 2) add(sh[k], sh[k + 1]); }
    }
    return out.slice(0, cap);
  }
  function questionFor(title) {
    var t = String(title || '');
    if (/skill|learn|course|subject/i.test(t)) return 'Which would you like to learn?';
    if (/trip|travel|place|adventure|hike|camp|recipe|food|hobb/i.test(t)) return 'Which would you rather try?';
    if (/idea|interest|topic|question|book|article/i.test(t)) return 'Which interests you more?';
    return 'Which do you prefer?';
  }
  var QUESTIONS = ['Which do you prefer?', 'Which would you rather try?', 'Which interests you more?', 'Which would you like to learn?'];

  // ================================================================== Add to My World (one result card in "My Discoveries")
  function locate(b, cardId) { var hit = null; (b.columns || []).forEach(function (col) { (col.cards || []).forEach(function (c) { if (c && c.id === cardId) hit = { col: col, card: c }; }); }); return hit; }
  function targetWorld(s) { var src = s.source || {}; if (src.bid && isWorld(src.bid) && boardById(src.bid)) return src.bid; var ws = worldIds(); if (ws.length) return ws[0]; return src.bid && boardById(src.bid) ? src.bid : null; }
  // ranked: [{item, note}] best first
  function addToWorld(s, ranked, summary) {
    var wbid = targetWorld(s); if (!wbid) return Promise.reject(new Error('There is no world to add it to yet — make one in List of Mine first.'));
    var b0 = boardById(wbid), b = JSON.parse(JSON.stringify(b0)), colId = wbid + '-d-mine-discover', cid = wbid + '-l-discover-' + s.id;
    var col = (b.columns || []).filter(function (c) { return c.id === colId; })[0], created = [];
    if (!col) { col = { id: colId, title: 'My Discoveries', color: '#ff9f0a', cards: [] }; b.columns = (b.columns || []).concat([col]); }
    var L = locate(b, cid), card;
    if (L) { card = L.card; card.stack = []; } else { card = { id: cid, title: s.title, desc: '', labels: [], complete: false, createdAt: Date.now(), mastery: 1, checklistItems: [] }; col.cards = (col.cards || []).concat([card]); created.push({ bid: wbid, id: cid }); }
    card.title = s.title; card.desc = summary;
    var side = {}, stacks = [];
    card.stack = ranked.map(function (r, i) {
      var v = view(r.item), sid = cid + '~' + i + '-' + slug(r.item.id);
      var st = { id: sid, title: v.title, desc: r.note || '', labels: [], complete: false, mastery: 1 };
      if (v.img) st.cover = { type: 'image', value: v.img, url: v.img, title: '', size: 'banner' };
      if (r.item.ref && r.item.ref.key) side['pk:' + sid] = r.item.ref.key;
      stacks.push({ bid: wbid, card: cid, id: sid });
      return st;
    });
    card.hasStack = card.stack.length > 0;
    var before = A().boards();
    A().updateBoard(wbid, function () { return b; });
    var log = { id: rid(), at: Date.now(), src: 'discover', kind: 'add', items: [{ key: 'dv:' + s.id, title: s.title, to: [cid] }], lists: {}, created: created, stacks: stacks, note: '' };
    log.lists[cid] = stacks.length;
    side['wl:' + log.id] = log;
    side['wn:' + cid] = Object.assign({ n: 0, since: Date.now() }, KN().get('wn:' + cid) || {}, { isNew: true });
    KN().setMany(side);
    s.saved = { bid: wbid, card: cid, at: Date.now() }; put(s);
    var t0 = Date.now();
    return new Promise(function (done) { (function wait() { if (A().boards() !== before || Date.now() - t0 > 900) { try { window.dispatchEvent(new CustomEvent('minest:kedit', { detail: { bid: wbid } })); } catch (e) {} done(card); } else requestAnimationFrame(wait); })(); });
  }

  // ================================================================== UI
  var I = function (d, w) { return '<svg viewBox="0 0 24 24" width="' + (w || 18) + '" height="' + (w || 18) + '" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + d + '</svg>'; };
  var ICON = { x: I('<path d="M6 6l12 12M18 6 6 18"/>'), back: I('<path d="m15 6-6 6 6 6"/>'), chev: I('<path d="m9 6 6 6-6 6"/>'), undo: I('<path d="M9 14 4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/>'), skip: I('<path d="m5 5 7 7-7 7M13 5l7 7-7 7"/>'), json: I('<path d="M8 4c-2 0-2 2-2 4s-1 3-2 4c1 1 2 2 2 4s0 4 2 4M16 4c2 0 2 2 2 4s1 3 2 4c-1 1-2 2-2 4s0 4-2 4"/>') };
  var CSS = [
    '.dv{position:fixed;inset:0;z-index:2147482006;display:flex;flex-direction:column;color:#f3f5f8;font:15px/1.4 -apple-system,BlinkMacSystemFont,"SF Pro Text",system-ui,sans-serif;-webkit-font-smoothing:antialiased;' +
      'background:linear-gradient(180deg,rgba(20,24,36,.94),rgba(8,10,18,.98));-webkit-backdrop-filter:blur(40px) saturate(180%);backdrop-filter:blur(40px) saturate(180%)}',
    '.dv-head{display:flex;align-items:center;gap:10px;padding:calc(env(safe-area-inset-top,0px) + 12px) 14px 6px}',
    '.dv-head h2{flex:1;min-width:0;margin:0;font-size:24px;font-weight:800;letter-spacing:-.4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.dv-b{flex:none;width:36px;height:36px;border-radius:50%;display:grid;place-items:center;padding:0;cursor:pointer;color:inherit;background:linear-gradient(180deg,rgba(255,255,255,.18),rgba(255,255,255,.06));border:1px solid rgba(255,255,255,.24);box-shadow:inset 0 1px 0 rgba(255,255,255,.35),0 6px 16px rgba(0,0,0,.25)}',
    '.dv-body{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:4px 14px calc(env(safe-area-inset-bottom,0px) + 110px)}',
    '.dv-foot{position:absolute;left:0;right:0;bottom:0;padding:26px 14px calc(env(safe-area-inset-bottom,0px) + 14px);background:linear-gradient(180deg,rgba(8,10,18,0),rgba(8,10,18,.97) 22px);display:flex;gap:10px}',
    '.dv-go{flex:1;height:50px;border-radius:999px;border:1px solid rgba(255,255,255,.25);background:linear-gradient(180deg,#ff9f0a,#f07c00);color:#fff;font:700 16px -apple-system,system-ui,sans-serif;cursor:pointer;box-shadow:0 10px 26px rgba(255,140,0,.32);display:inline-flex;align-items:center;justify-content:center;gap:6px;white-space:nowrap}',
    '.dv-go:disabled{opacity:.4;box-shadow:none}.dv-go.sec{flex:0 0 auto;padding:0 18px;background:rgba(255,255,255,.1);box-shadow:none}',
    '.dv-h{margin:18px 2px 8px;font-size:12px;font-weight:650;letter-spacing:.06em;text-transform:uppercase;opacity:.55}',
    '.dv-sub{margin:0 2px 12px;font-size:14px;opacity:.62}',
    // home tool cards
    '.dv-tools{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px}',
    '.dv-tool{display:flex;flex-direction:column;gap:4px;text-align:left;padding:0 0 12px;border-radius:22px;overflow:hidden;cursor:pointer;color:inherit;font:inherit;background:linear-gradient(180deg,rgba(255,255,255,.12),rgba(255,255,255,.05));border:1px solid rgba(255,255,255,.16);box-shadow:inset 0 1px 0 rgba(255,255,255,.22),0 10px 30px rgba(0,0,0,.2);transition:transform .15s}',
    '.dv-tool:active{transform:scale(.97)}.dv-tool:disabled{opacity:.45;cursor:default}',
    '.dv-tool .pv{height:96px;margin-bottom:6px;background:linear-gradient(150deg,var(--c1),var(--c2));display:grid;place-items:center}',
    '.dv-tool b{padding:0 12px;font-size:16px}.dv-tool small{padding:0 12px;font-size:13px;opacity:.7}',
    '.dv-tool .soon{padding:0 12px;font-size:11.5px;opacity:.55}',
    '.dv-row{display:flex;align-items:center;gap:12px;width:100%;text-align:left;padding:11px 12px;margin-bottom:6px;border-radius:16px;cursor:pointer;color:inherit;font:inherit;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1)}',
    '.dv-row div{flex:1;min-width:0}.dv-row b{display:block;font-size:14.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.dv-row small{display:block;font-size:12px;opacity:.58;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.dv-row .cv{opacity:.4;flex:none}.dv-row em{flex:none;font-style:normal;font-size:12px;opacity:.55}',
    '.dv-pill{flex:none;font-size:11px;font-weight:700;padding:3px 8px;border-radius:999px;background:rgba(255,159,10,.2);color:#ffb340}.dv-pill.done{background:rgba(48,209,88,.18);color:#5de07f}',
    '.dv-find{display:flex;align-items:center;gap:8px;margin:0 0 10px;height:40px;padding:0 12px;border-radius:12px;background:rgba(255,255,255,.09);border:1px solid rgba(255,255,255,.12)}.dv-find input{flex:1;min-width:0;border:0;background:none;color:inherit;font:inherit;outline:none}',
    '.dv-chips{display:flex;flex-wrap:wrap;gap:8px}',
    '.dv-chip{min-height:36px;padding:6px 13px;border-radius:999px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.08);color:inherit;font:600 14px -apple-system,system-ui,sans-serif;cursor:pointer}',
    '.dv-chip.on{background:linear-gradient(180deg,#ff9f0a,#f07c00);border-color:rgba(255,255,255,.4);color:#fff}',
    '.dv-q{width:100%;box-sizing:border-box;height:44px;padding:0 12px;border-radius:12px;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.08);color:inherit;font:inherit;outline:none}',
    // pictures
    '.dv-art{display:flex;flex-direction:column;justify-content:flex-end;background-size:cover;background-position:center;box-sizing:border-box;overflow:hidden}',
    '.dv-art.drawn{padding:12px}.dv-art.drawn b{font:800 19px/1.15 Georgia,"Times New Roman",serif;color:#fff;text-shadow:0 1px 8px rgba(0,0,0,.4);display:-webkit-box;-webkit-line-clamp:5;-webkit-box-orient:vertical;overflow:hidden}',
    '.dv-art.gone{filter:grayscale(1);opacity:.6}.dv-art small{font-size:11px;opacity:.8;color:#fff}',
    // This or That
    '.dv-ask{text-align:center;font-size:22px;font-weight:800;letter-spacing:-.3px;margin:6px 0 2px}',
    '.dv-prog{display:flex;gap:4px;margin:8px 2px 14px}.dv-prog span{flex:1;height:4px;border-radius:4px;background:rgba(255,255,255,.14)}.dv-prog span.on{background:#ff9f0a}.dv-prog span.sk{background:rgba(255,255,255,.35)}',
    '.dv-vs{position:relative;display:grid;grid-template-columns:1fr 1fr;gap:12px;align-items:stretch}',
    '.dv-pick{position:relative;display:flex;flex-direction:column;gap:8px;padding:0;border:0;background:none;color:inherit;font:inherit;cursor:pointer;text-align:center;transition:transform .22s cubic-bezier(.3,1.4,.5,1),opacity .2s}',
    '.dv-pick .dv-art{aspect-ratio:3/4;border-radius:20px;box-shadow:0 14px 34px rgba(0,0,0,.4),inset 0 0 0 1px rgba(255,255,255,.14)}',
    '.dv-pick p{margin:0;font-size:14.5px;font-weight:650;line-height:1.25;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}',
    '.dv-pick:active{transform:scale(.97)}',
    '.dv-pick.won{transform:scale(1.05)}.dv-pick.won .dv-art{box-shadow:0 0 0 3px #ff9f0a,0 16px 40px rgba(255,159,10,.45)}.dv-pick.lost{opacity:.35;transform:scale(.94)}',
    '.dv-pick.was .dv-art{box-shadow:0 0 0 3px rgba(255,159,10,.75),0 14px 34px rgba(0,0,0,.4)}',
    '.dv-vsb{position:absolute;left:50%;top:38%;transform:translate(-50%,-50%);width:46px;height:46px;border-radius:50%;display:grid;place-items:center;font:900 15px -apple-system,system-ui,sans-serif;color:#fff;background:linear-gradient(180deg,#2c2f3a,#14161d);border:2px solid rgba(255,255,255,.6);box-shadow:0 8px 20px rgba(0,0,0,.5);pointer-events:none;z-index:2}',
    '.dv-ctl{display:flex;justify-content:center;gap:10px;margin-top:18px}',
    '.dv-ctl button{height:40px;padding:0 16px;border-radius:999px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.08);color:inherit;font:600 14px -apple-system,system-ui,sans-serif;cursor:pointer;display:inline-flex;align-items:center;gap:6px}',
    '.dv-ctl button:disabled{opacity:.35}',
    '.dv-count{text-align:center;font-size:13px;opacity:.6;margin-top:10px}',
    // results
    '.dv-res{display:grid;grid-template-columns:44px 1fr 44px;align-items:center;gap:10px;padding:8px 10px;border-radius:16px;margin-bottom:6px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);cursor:pointer}',
    '.dv-res .dv-art{width:44px;height:58px;border-radius:9px}.dv-res .dv-art.drawn{padding:4px}.dv-res .dv-art.drawn b{font-size:9px}',
    '.dv-res .mid{min-width:0;font-size:13px;text-align:center}.dv-res .mid b{display:block;font-size:14px}.dv-res .mid span{opacity:.55}',
    '.dv-res .lose{opacity:.35}',
    '.dv-tally{display:flex;align-items:center;gap:10px;padding:8px 10px;margin-bottom:6px;border-radius:14px;background:rgba(255,255,255,.06)}',
    '.dv-tally .dv-art{width:38px;height:50px;border-radius:8px;flex:none}.dv-tally .dv-art.drawn{padding:3px}.dv-tally .dv-art.drawn b{font-size:8px}',
    '.dv-tally div{flex:1;min-width:0}.dv-tally b{display:block;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.dv-tally i{display:block;height:5px;border-radius:5px;background:#ff9f0a;margin-top:5px}',
    '.dv-tally em{font-style:normal;font-size:12.5px;opacity:.6;flex:none}',
    '.dv-note{font-size:12.5px;opacity:.55;margin:10px 2px}',
    '.dv-tiers{display:flex;flex-direction:column;gap:6px}',
    '.dv-tier{display:flex;align-items:stretch;min-height:78px;border-radius:14px;overflow:hidden;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1)}',
    '.dv-tier .lab{flex:none;width:74px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;padding:6px 4px;border:0;color:#1c1f29;font:inherit;cursor:pointer;text-align:center}',
    '.dv-tier .lab b{font-size:17px;font-weight:900;line-height:1.05;overflow-wrap:break-word;hyphens:auto;max-width:100%}.dv-tier .lab b.long{font-size:12.5px;font-weight:800}.dv-tier .lab small{font-size:10px;font-weight:650;opacity:.75;line-height:1.15}',
    '.dv-tiers.ro .lab{cursor:default}',
    '.zone{flex:1;min-width:0;display:flex;flex-wrap:wrap;align-content:flex-start;gap:6px;padding:6px}',
    '.zone.pool{min-height:90px;border-radius:14px;background:rgba(255,255,255,.04);border:1px dashed rgba(255,255,255,.18)}',
    '.dv-ti{width:56px;display:flex;flex-direction:column;align-items:center;gap:3px;cursor:grab;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;touch-action:manipulation}',
    '.dv-ti .dv-art{width:56px;height:72px;border-radius:9px;box-shadow:0 4px 12px rgba(0,0,0,.3),inset 0 0 0 1px rgba(255,255,255,.14)}.dv-ti .dv-art.drawn{padding:4px}.dv-ti .dv-art.drawn b{font-size:9.5px;-webkit-line-clamp:4}',
    '.dv-ti span{font-size:10.5px;line-height:1.15;text-align:center;max-width:56px;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;opacity:.85}',
    '.dv-ti:focus-visible{outline:2px solid #ff9f0a;outline-offset:2px;border-radius:10px}',
    '.dv-ti.lift{opacity:.25}',
    '.dv-ghost{position:fixed;z-index:20;pointer-events:none;transform:scale(1.08) rotate(-2deg);filter:drop-shadow(0 14px 24px rgba(0,0,0,.5))}',
    '.dv-ph{width:56px;height:72px;border-radius:9px;border:2px dashed #ff9f0a;box-sizing:border-box;background:rgba(255,159,10,.12)}',
    '.dv-done{font-size:12.5px;opacity:.5;padding:6px}',
    '.dv-menu{position:absolute;left:10px;right:10px;bottom:calc(env(safe-area-inset-bottom,0px) + 10px);z-index:15;padding:14px;border-radius:24px;background:rgba(30,33,44,.96);-webkit-backdrop-filter:blur(30px);backdrop-filter:blur(30px);border:1px solid rgba(255,255,255,.16);box-shadow:0 20px 50px rgba(0,0,0,.5)}',
    '.dv-menu .mh{display:flex;align-items:center;gap:12px}.dv-menu .mh div{flex:1;min-width:0}.dv-menu .mh b{display:block;font-size:16px}.dv-menu .mh small{display:block;font-size:12.5px;opacity:.6}',
    '.dv-menu .mh .dv-art{width:44px;height:58px;border-radius:8px;flex:none}.dv-menu .mh .dv-art.drawn{padding:3px}.dv-menu .mh .dv-art.drawn b{font-size:8px}',
    '.dv-menu .tl{flex:none;min-width:44px;height:44px;padding:0 8px;border-radius:10px;display:grid;place-items:center;font-weight:900;color:#1c1f29}',
    '.dv-menu .mt{display:grid;grid-template-columns:repeat(auto-fill,minmax(64px,1fr));gap:8px}',
    '.dv-menu .mt button{min-height:46px;padding:4px 6px;border-radius:12px;border:2px solid transparent;background:var(--tc,rgba(255,255,255,.12));color:#1c1f29;font:800 14px -apple-system,system-ui,sans-serif;cursor:pointer;word-break:break-word}',
    '.dv-menu .mt button{word-break:normal}.dv-menu .mt button.un{grid-column:span 2;background:rgba(255,255,255,.12);color:inherit;font-weight:650}.dv-menu .mt button.on{border-color:#fff;box-shadow:0 0 0 2px #ff9f0a}',
    '.dv-chip:disabled{opacity:.35}',
    'html.kn-light .dv-menu{background:rgba(250,251,253,.97);border-color:rgba(0,0,0,.08)}html.kn-light .dv-menu .mt button.un{background:rgba(0,0,0,.06)}',
    'html.kn-light .dv-tier{background:rgba(255,255,255,.7);border-color:rgba(0,0,0,.06)}html.kn-light .zone.pool{background:rgba(0,0,0,.03);border-color:rgba(0,0,0,.18)}',
    '@media (min-width:700px){.dv-ti,.dv-ph{width:72px}.dv-ti .dv-art,.dv-ph{width:72px;height:94px}.dv-ti span{max-width:72px;font-size:11.5px}.dv-tier .lab{width:96px}.dv-menu{left:50%;right:auto;width:420px;transform:translateX(-50%)}}',
    '.dv-empty{padding:16px;text-align:center;opacity:.55;font-size:14px}',
    'html.kn-light .dv{color:#1d1f23;background:linear-gradient(180deg,rgba(244,246,250,.94),rgba(232,236,243,.98))}',
    'html.kn-light .dv-b,html.kn-light .dv-tool,html.kn-light .dv-row,html.kn-light .dv-chip,html.kn-light .dv-find,html.kn-light .dv-q,html.kn-light .dv-ctl button,html.kn-light .dv-res,html.kn-light .dv-tally{background:rgba(255,255,255,.82);border-color:rgba(0,0,0,.08);box-shadow:inset 0 1px 0 #fff,0 6px 18px rgba(30,40,60,.06)}',
    'html.kn-light .dv-chip.on{color:#fff;background:linear-gradient(180deg,#ff9f0a,#f07c00)}',
    'html.kn-light .dv-foot{background:linear-gradient(180deg,rgba(236,239,245,0),rgba(236,239,245,.97) 22px)}html.kn-light .dv-go.sec{background:rgba(0,0,0,.06);color:#1d1f23}',
    'html.kn-light .dv-prog span{background:rgba(0,0,0,.1)}html.kn-light .dv-prog span.on{background:#ff9f0a}',
    '@media (prefers-reduced-motion: reduce){.dv-pick,.dv-tool{transition:none}}',
    '@media (min-width:700px){.dv-vs{max-width:640px;margin:0 auto;gap:28px}.dv-vsb{width:56px;height:56px;font-size:17px}}'
  ].join('\n');
  function css() { if (document.getElementById('dv-css')) return; var s = document.createElement('style'); s.id = 'dv-css'; s.textContent = CSS; document.head.appendChild(s); }

  // tool previews (picture first)
  var PV = {
    'this-or-that': '<svg viewBox="0 0 120 70" width="120" height="70"><rect x="14" y="8" width="38" height="54" rx="8" fill="#fff" fill-opacity=".9"/><rect x="68" y="8" width="38" height="54" rx="8" fill="#fff" fill-opacity=".55"/><circle cx="60" cy="35" r="11" fill="#1c1f29" stroke="#fff" stroke-width="2"/><text x="60" y="39" text-anchor="middle" font-size="9" font-weight="900" fill="#fff" font-family="-apple-system,system-ui,sans-serif">VS</text></svg>',
    'tier-list': '<svg viewBox="0 0 120 70" width="120" height="70" font-family="-apple-system,system-ui,sans-serif" font-weight="800" font-size="8">' + [['S', '#ff6b6b', 3], ['A', '#ffb347', 2], ['B', '#ffe066', 2], ['C', '#9be27a', 1]].map(function (t, i) { var y = 4 + i * 16; var r = '<rect x="14" y="' + y + '" width="14" height="13" rx="3" fill="' + t[1] + '"/><text x="21" y="' + (y + 9.5) + '" text-anchor="middle" fill="#1c1f29">' + t[0] + '</text>'; for (var k = 0; k < t[2]; k++) r += '<rect x="' + (32 + k * 16) + '" y="' + y + '" width="13" height="13" rx="3" fill="#fff" fill-opacity=".8"/>'; return r; }).join('') + '</svg>',
    tournament: '<svg viewBox="0 0 120 70" width="120" height="70" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 10h14v12H14M14 22h14M14 48h14v12H14M28 16h10v19h10M28 54h10V35M92 22h14M92 10h14v12H92M92 48h14v12H92M92 16H82v19H72M92 54H82V35"/><path d="M48 35h24"/><circle cx="60" cy="35" r="7" fill="#fff" stroke="none"/></svg>'
  };
  var TOOL_D = {
    'this-or-that': ['This or That', 'Make quick choices.', '#ff9f0a', '#d6336c'],
    'tier-list': ['Tier List', 'Rank what matters to me.', '#5e5ce6', '#1e88e5'],
    tournament: ['Tournament', 'Find my favorites.', '#30b45a', '#00897b']
  };
  var READY = { 'this-or-that': true, 'tier-list': true };   // Tournament joins next

  var ui = { open: false };
  function shell() {
    if (ui.open) return;
    css(); if (KN() && KN().applyLook) KN().applyLook();
    var el = document.createElement('div'); el.className = 'dv'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Discover My World');
    el.innerHTML = '<div class="dv-head"></div><div class="dv-body"></div><div class="dv-foot" hidden></div><input type="file" accept=".json,application/json" hidden>';
    ['pointerdown', 'touchstart', 'touchmove', 'wheel', 'keydown'].forEach(function (ev) { el.addEventListener(ev, function (e) { e.stopPropagation(); }, { passive: ev !== 'keydown' }); });
    ui.el = el; ui.head = el.querySelector('.dv-head'); ui.body = el.querySelector('.dv-body'); ui.foot = el.querySelector('.dv-foot'); ui.file = el.querySelector('input[type=file]'); ui.open = true;
    document.body.appendChild(el); document.documentElement.classList.add('kn-open');
    if (el.animate && !reduce) el.animate([{ opacity: 0, translate: '0 24px' }, { opacity: 1, translate: '0 0' }], { duration: 300, easing: 'cubic-bezier(.2,.85,.25,1)' });
    el.addEventListener('click', onClick);
    el.addEventListener('input', function (e) { if (e.target.matches('[data-find]')) { ui.q = e.target.value; drawSources(); } if (e.target.matches('[data-qtext]')) ui.cfg.question = e.target.value; if (e.target.matches('[data-title]')) ui.cfg.title = e.target.value; });
    el.addEventListener('keydown', onKey);
    el.addEventListener('pointerdown', tierDown);
    el.addEventListener('touchmove', function (e) { if (ui.drag && ui.drag.on) e.preventDefault(); }, { passive: false });
    el.addEventListener('contextmenu', function (e) { if (e.target.closest('[data-ti]')) e.preventDefault(); });
    ui.file.addEventListener('change', function () {
      var f = ui.file.files && ui.file.files[0]; ui.file.value = ''; if (!f) return;
      var rd = new FileReader(); rd.onload = function () { try { var j = fromJson(JSON.parse(String(rd.result).replace(/^﻿/, ''))); startConfig({ kind: 'json', id: j.id, title: j.title }, j.items, j); } catch (ex) { toast('✗ ' + ex.message); } }; rd.readAsText(f);
    });
  }
  function close() {
    if (!ui.open) return; var el = ui.el; ui.open = false; ui.el = null;
    if (!document.querySelector('.lw,.sk,.wk,.pk,.wc')) document.documentElement.classList.remove('kn-open');
    if (el.animate && !reduce) { var an = el.animate([{ opacity: 1 }, { opacity: 0, translate: '0 18px' }], { duration: 200, fill: 'forwards' }); an.onfinish = function () { el.remove(); }; } else el.remove();
  }
  function head(title, back) { ui.head.innerHTML = (back ? '<button type="button" class="dv-b" data-back="' + esc(back) + '" aria-label="Back">' + ICON.back + '</button>' : '') + '<h2>' + esc(title) + '</h2><button type="button" class="dv-b" data-x aria-label="Close">' + ICON.x + '</button>'; ui.foot.hidden = true; ui.foot.innerHTML = ''; ui.body.scrollTop = 0; }
  function foot(html) { ui.foot.hidden = !html; ui.foot.innerHTML = html || ''; }

  // ---------------------------------------------------------------- home
  function home() {
    shell(); ui.view = 'home'; ui.preset = null; head('Discover My World', null);
    var ss = all(), go = ss.filter(function (s) { return s.status !== 'completed'; }), done = ss.filter(function (s) { return s.status === 'completed'; });
    ui.body.innerHTML = '<p class="dv-sub">Discover what I love. Nothing here is right or wrong — it only keeps what you chose.</p><div class="dv-tools">' + TOOLS.map(function (t) {
      var d = TOOL_D[t];
      return '<button type="button" class="dv-tool" data-tool="' + t + '" style="--c1:' + d[2] + ';--c2:' + d[3] + '"' + (READY[t] ? '' : ' disabled') + '><span class="pv">' + PV[t] + '</span><b>' + d[0] + '</b><small>' + d[1] + '</small>' + (READY[t] ? '' : '<span class="soon">Coming next</span>') + '</button>';
    }).join('') + '</div>' +
      (go.length ? '<div class="dv-h">Continue</div>' + go.map(row).join('') : '') +
      '<div class="dv-h">My Discoveries</div>' + (done.length ? done.slice(0, 30).map(row).join('') : '<div class="dv-empty">Your results will be kept here.</div>');
  }
  function row(s) {
    var n = s.tool === 'this-or-that' ? (s.choices || []).filter(function (c) { return c && c.pick !== undefined; }).length + '/' + ((s.pairs || []).length) : s.tool === 'tier-list' && s.rank ? Object.keys(placedIn(s)).length + '/' + s.items.length : '';
    return '<button type="button" class="dv-row" data-session="' + esc(s.id) + '"><div><b>' + esc(s.title) + '</b><small>' + esc(TOOL_T[s.tool] + ' · ' + s.items.length + ' items · ' + day(s.updatedAt)) + '</small></div>' + (n && s.status !== 'completed' ? '<em>' + n + '</em>' : '') + '<span class="dv-pill' + (s.status === 'completed' ? ' done' : '') + '">' + STATUS_T[s.status] + '</span></button>';
  }

  // ---------------------------------------------------------------- 1 · Select a list (or import JSON)
  function pickSource(tool) {
    ui.tool = tool; ui.view = 'source'; ui.q = ''; head(TOOL_T[tool], 'home');
    ui.body.innerHTML = '<p class="dv-sub">Pick a list to play with — or import a Discover JSON.</p><label class="dv-find"><input data-find placeholder="Search your lists" autocomplete="off"></label><div data-src></div>' +
      '<div class="dv-h">Or</div><button type="button" class="dv-row" data-json><span>' + ICON.json + '</span><div><b>Import JSON…</b><small>format minest.discover/1 — title, items (id, title, image)</small></div></button>';
    drawSources();
  }
  function drawSources() {
    var box = ui.body.querySelector('[data-src]'); if (!box) return;
    var q = String(ui.q || '').toLowerCase(), min = ui.tool === 'tournament' ? 4 : 2;
    var ss = sources().filter(function (s) { return s.n >= min && (!q || (s.title + ' ' + s.board + ' ' + (s.area || '')).toLowerCase().indexOf(q) >= 0); })
      .sort(function (a, b) { return (b.world - a.world) || (b.kind === 'card') - (a.kind === 'card') || b.n - a.n; }).slice(0, 80);
    box.innerHTML = ss.map(function (s) { return '<button type="button" class="dv-row" data-src="' + esc(s.kind + '|' + s.bid + '|' + s.id) + '"><div><b>' + esc(s.title) + '</b><small>' + esc((s.area ? s.area + ' · ' : '') + s.board) + '</small></div><em>' + s.n + '</em><span class="cv">' + ICON.chev + '</span></button>'; }).join('') || '<div class="dv-empty">No list with enough cards yet.</div>';
  }
  function srcFrom(key) { var p = key.split('|'); var s = sources().filter(function (x) { return x.kind === p[0] && x.bid === p[1] && x.id === p.slice(2).join('|'); })[0]; return s || null; }

  // ---------------------------------------------------------------- 2 · Configure
  function startConfig(src, items, json) {
    var tool = ui.tool;
    if (json && json.tools.indexOf(tool) < 0) return toast('This file does not enable ' + TOOL_T[tool] + '.');
    var conf = (json && json.config) || {}, tt = conf.thisOrThat || {}, tl = conf.tierList || {};
    ui.src = src; ui.items = items; ui.json = json || null;
    ui.cfg = { title: src.title + ' — ' + TOOL_T[tool], question: tt.question || questionFor(src.title), maxPairs: Math.max(1, Math.min(50, +tt.maxPairs || 10)), mode: tt.pairing === 'sequential' ? 'sequential' : 'random', preset: /skill/i.test(src.title) ? 'skills' : 'favorites', tiers: Array.isArray(tl.tiers) && tl.tiers.length ? tl.tiers.slice(0, 10) : null };
    if (ui.cfg.tiers) ui.cfg.preset = 'json';
    if (tool === 'this-or-that' && items.length < 2) return toast('This needs at least 2 items.');
    drawConfig();
  }
  function drawConfig() {
    var c = ui.cfg, n = ui.items.length, maxP = n * (n - 1) / 2; ui.view = 'config'; head(TOOL_T[ui.tool], 'source');
    if (ui.tool === 'tier-list') {
      var sets = Object.keys(TIER_SETS).map(function (k) { return [k, TIER_SETS[k].t, TIER_SETS[k].tiers]; }); if (c.tiers) sets.unshift(['json', 'From the file', c.tiers]);
      var curSet = (sets.filter(function (x) { return x[0] === c.preset; })[0] || sets[0]);
      ui.body.innerHTML = '<div class="dv-h">' + n + ' items</div><div class="dv-chips" style="max-height:90px;overflow:hidden">' + ui.items.slice(0, 24).map(function (x) { return '<span class="dv-chip" style="cursor:default">' + esc(x.title) + '</span>'; }).join('') + (n > 24 ? '<span class="dv-chip" style="cursor:default">+' + (n - 24) + '</span>' : '') + '</div>' +
        '<div class="dv-h">Tiers</div><div class="dv-chips">' + sets.map(function (x) { return '<button type="button" class="dv-chip' + (c.preset === x[0] ? ' on' : '') + '" data-preset="' + x[0] + '">' + esc(x[1]) + '</button>'; }).join('') + '</div>' +
        '<div class="dv-tiers ro" style="margin-top:10px">' + tiersFrom(curSet[2]).map(function (t) { return '<div class="dv-tier"><div class="lab" style="background:' + t.color + '"><b' + (t.name.length > 6 ? ' class="long"' : '') + '>' + esc(t.name) + '</b>' + (t.note ? '<small>' + esc(t.note) + '</small>' : '') + '</div><div class="zone"></div></div>'; }).join('') + '</div>' +
        (c.preset === 'skills' ? '<p class="dv-note">How I rank my skills here is my own view — it does not change any skill status or proficiency.</p>' : '<p class="dv-note">You can rename, add or remove tiers while ranking.</p>') +
        '<div class="dv-h">Save as</div><input class="dv-q" data-title value="' + esc(c.title) + '" maxlength="90">';
      c.tiers = c.preset === 'json' ? c.tiers : null; if (c.preset === 'json') c.tiers = curSet[2];
      return foot('<button type="button" class="dv-go" data-start>Start ranking</button>');
    }
    ui.body.innerHTML = '<div class="dv-h">' + n + ' items</div><div class="dv-chips" style="max-height:90px;overflow:hidden">' + ui.items.slice(0, 24).map(function (x) { return '<span class="dv-chip" style="cursor:default">' + esc(x.title) + '</span>'; }).join('') + (n > 24 ? '<span class="dv-chip" style="cursor:default">+' + (n - 24) + '</span>' : '') + '</div>' +
      '<div class="dv-h">Question</div><div class="dv-chips">' + QUESTIONS.map(function (q) { return '<button type="button" class="dv-chip' + (c.question === q ? ' on' : '') + '" data-qset="' + esc(q) + '">' + esc(q) + '</button>'; }).join('') + '</div>' +
      '<input class="dv-q" style="margin-top:8px" data-qtext value="' + esc(c.question) + '" maxlength="80">' +
      '<div class="dv-h">How many pairs</div><div class="dv-chips">' + [5, 10, 15, 20].filter(function (k, i) { return k <= maxP || i === 0; }).map(function (k) { k = Math.min(k, maxP); return '<button type="button" class="dv-chip' + (c.maxPairs === k ? ' on' : '') + '" data-max="' + k + '">' + k + '</button>'; }).join('') + '</div>' +
      '<div class="dv-h">Pairs</div><div class="dv-chips"><button type="button" class="dv-chip' + (c.mode === 'random' ? ' on' : '') + '" data-mode="random">Random</button><button type="button" class="dv-chip' + (c.mode === 'sequential' ? ' on' : '') + '" data-mode="sequential">In list order</button></div>' +
      '<div class="dv-h">Save as</div><input class="dv-q" data-title value="' + esc(c.title) + '" maxlength="90">';
    foot('<button type="button" class="dv-go" data-start>Start</button>');
  }

  // ---------------------------------------------------------------- 3 · This or That
  function startTOT() {
    var c = ui.cfg;
    var s = create('this-or-that', ui.src, ui.items, { question: (c.question || '').trim() || 'Which do you prefer?', maxPairs: c.maxPairs, pairing: c.mode }, (c.title || '').trim() || ui.src.title);
    s.pairs = makePairs(s.items, c.maxPairs, c.mode); s.choices = []; s.at = 0; s.status = 'in-progress';
    put(s); playTOT(s.id);
  }
  function playTOT(id) {
    var s = get(id); if (!s) return home();
    ui.sid = id; ui.view = 'tot'; ui.busy = false;
    if (s.at >= s.pairs.length) return resultTOT(id);
    head(s.title, 'home');
    var p = s.pairs[s.at], A1 = itemById(s, p[0]), B1 = itemById(s, p[1]), was = s.choices[s.at] && s.choices[s.at].pick;
    ui.body.innerHTML = '<div class="dv-prog">' + s.pairs.map(function (x, i) { var ch = s.choices[i]; return '<span class="' + (i < s.at || ch ? (ch && ch.pick === null ? 'sk' : 'on') : '') + '"></span>'; }).join('') + '</div>' +
      '<div class="dv-ask">' + esc(s.config.question) + '</div><div class="dv-count">' + (s.at + 1) + ' of ' + s.pairs.length + '</div>' +
      '<div class="dv-vs" style="margin-top:14px"><button type="button" class="dv-pick' + (was === A1.id ? ' was' : '') + '" data-choose="' + esc(A1.id) + '" aria-label="' + esc(view(A1).title) + '">' + art(A1) + (view(A1).img ? '<p>' + esc(view(A1).title) + '</p>' : '') + '</button>' +
      '<span class="dv-vsb">VS</span>' +
      '<button type="button" class="dv-pick' + (was === B1.id ? ' was' : '') + '" data-choose="' + esc(B1.id) + '" aria-label="' + esc(view(B1).title) + '">' + art(B1) + (view(B1).img ? '<p>' + esc(view(B1).title) + '</p>' : '') + '</button></div>' +
      '<div class="dv-ctl"><button type="button" data-tback' + (s.at ? '' : ' disabled') + '>' + ICON.undo + 'Back</button><button type="button" data-skip>Skip ' + ICON.skip + '</button></div>';
    foot('');
  }
  function chooseTOT(pick) {
    var s = get(ui.sid); if (!s || ui.busy) return; ui.busy = true;
    var p = s.pairs[s.at]; s.choices[s.at] = { a: p[0], b: p[1], pick: pick, at: Date.now() }; s.at++;
    if (s.redo) { s.redo = false; var gap = 0; while (gap < s.pairs.length && s.choices[gap]) gap++; s.at = gap; }   // changed one answer from the results: back to them
    if (s.at >= s.pairs.length) { s.status = 'completed'; s.result = tallyTOT(s); }
    put(s); hap(pick ? 'selection' : 'light');
    var cards = ui.body.querySelectorAll('[data-choose]');
    if (pick && !reduce) cards.forEach(function (c) { c.classList.add(c.getAttribute('data-choose') === pick ? 'won' : 'lost'); });
    setTimeout(function () { ui.busy = false; if (s.status === 'completed') { hap('success'); resultTOT(s.id); } else playTOT(s.id); }, pick && !reduce ? 260 : 60);
  }
  function backTOT() { var s = get(ui.sid); if (!s || !s.at) return; s.at--; if (s.status === 'completed') s.status = 'in-progress'; put(s); playTOT(s.id); }
  function tallyTOT(s) {
    var won = {}, shown = {}, skipped = [];
    (s.choices || []).forEach(function (c) { if (!c) return; shown[c.a] = (shown[c.a] || 0) + 1; shown[c.b] = (shown[c.b] || 0) + 1; if (c.pick) won[c.pick] = (won[c.pick] || 0) + 1; else skipped.push([c.a, c.b]); });
    var order = Object.keys(shown).sort(function (a, b) { return (won[b] || 0) / shown[b] - (won[a] || 0) / shown[a] || (won[b] || 0) - (won[a] || 0); });
    return { won: won, shown: shown, order: order, skipped: skipped };
  }
  function resultTOT(id) {
    var s = get(id); if (!s) return home(); ui.sid = id; ui.view = 'tot-result';
    var r = s.result || tallyTOT(s); head('My Choices', 'home');
    var picked = r.order.filter(function (x) { return r.won[x]; });
    ui.body.innerHTML = '<p class="dv-sub">' + esc(s.title) + ' · ' + esc(day(s.updatedAt)) + '</p>' +
      (picked.length ? '<div class="dv-h">Chosen most</div>' + picked.slice(0, 12).map(function (iid) { var it = itemById(s, iid); if (!it) return ''; var w = r.won[iid], n = r.shown[iid]; return '<div class="dv-tally">' + art(it) + '<div><b>' + esc(view(it).title) + '</b><i style="width:' + Math.round(100 * w / n) + '%"></i></div><em>' + w + ' of ' + n + '</em></div>'; }).join('') : '') +
      '<div class="dv-h">Every choice</div>' + (s.choices || []).map(function (c, i) {
        if (!c) return ''; var a = itemById(s, c.a), b = itemById(s, c.b); if (!a || !b) return '';
        return '<div class="dv-res" data-redo="' + i + '" title="Change this choice"><span class="' + (c.pick && c.pick !== c.a ? 'lose' : '') + '">' + art(a) + '</span><div class="mid">' + (c.pick ? '<b>' + esc(view(itemById(s, c.pick)).title) + '</b><span>over ' + esc(view(c.pick === c.a ? b : a).title) + '</span>' : '<b>Skipped</b><span>' + esc(view(a).title) + ' · ' + esc(view(b).title) + '</span>') + '</div><span class="' + (c.pick && c.pick !== c.b ? 'lose' : '') + '">' + art(b) + '</span></div>';
      }).join('') +
      '<p class="dv-note">One choice is a moment, not a lasting preference — play again any time and compare.</p>' +
      (s.saved ? '<p class="dv-note">Saved to My World ✓ (' + esc(day(s.saved.at)) + ')</p>' : '') +
      '<div class="dv-chips" style="margin-top:6px"><button type="button" class="dv-chip" data-again>Play again</button><button type="button" class="dv-chip" data-export>Export JSON</button><button type="button" class="dv-chip" data-del style="color:#ff6b6b">Delete this result</button></div>';
    foot(s.status === 'completed' ? '<button type="button" class="dv-go" data-save>' + (s.saved ? 'Update in My World' : 'Add to My World') + '</button>' : '<button type="button" class="dv-go" data-resume>Continue</button>');
  }
  function saveTOT() {
    var s = get(ui.sid), r = s.result || tallyTOT(s);
    var ranked = r.order.filter(function (x) { return r.won[x]; }).map(function (iid) { return { item: itemById(s, iid), note: 'Chosen ' + r.won[iid] + ' of ' + r.shown[iid] + ' · ' + day(s.updatedAt) }; }).filter(function (x) { return x.item; });
    var sum = TOOL_T[s.tool] + ' · ' + day(s.updatedAt) + '\n' + s.config.question + '\n' + (s.choices || []).filter(Boolean).length + ' choices · ' + (r.skipped || []).length + ' skipped';
    return addToWorld(s, ranked, sum).then(function () { toast('Added to My World · My Discoveries'); resultTOT(s.id); }).catch(function (e) { toast('✗ ' + e.message); });
  }
  function exportSession(s) {
    var out = { format: 'minest.discover.result/1', id: s.id, tool: s.tool, title: s.title, at: new Date(s.updatedAt).toISOString(), config: s.config,
      items: s.items.map(function (x) { return { id: x.id, title: view(x).title }; }), choices: s.choices, result: s.result, ranking: s.rank ? { tiers: s.rank.tiers.map(function (t) { return { name: t.name, note: t.note, items: s.rank.rows[t.id] || [] }; }) } : undefined };
    var txt = JSON.stringify(out, null, 1);
    try { var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([txt], { type: 'application/json' })); a.download = slug(s.title) + '.json'; document.body.appendChild(a); a.click(); a.remove(); } catch (e) {}
    try { navigator.clipboard && navigator.clipboard.writeText(txt); } catch (e) {}
    toast('Exported (also copied)');
  }

  // ---------------------------------------------------------------- 4 · Tier List
  var TIER_SETS = {
    favorites: { t: 'Favorites', tiers: [['S', 'All-time Favorites'], ['A', 'Love It'], ['B', 'Like It'], ['C', 'It’s Okay'], ['D', 'Not for Me']] },
    skills: { t: 'Skills', tiers: [['Expert', ''], ['Advanced', ''], ['Intermediate', ''], ['Beginner', ''], ['Want to Learn', '']] },
    simple: { t: 'Simple', tiers: [['Love', ''], ['Like', ''], ['Not for me', '']] }
  };
  var TIER_C = ['#ff6b6b', '#ffa94d', '#ffd43b', '#8ce99a', '#74c0fc', '#b197fc', '#f783ac', '#adb5bd'];
  function tiersFrom(list) { return list.map(function (t, i) { t = typeof t === 'string' ? [t, ''] : t; return { id: 't' + i + rid().slice(-4), name: String(t[0]).slice(0, 24), note: String(t[1] || '').slice(0, 40), color: TIER_C[i % TIER_C.length] }; }); }
  function startTier() {
    var c = ui.cfg, set = c.tiers || (TIER_SETS[c.preset] || TIER_SETS.favorites).tiers;
    var s = create('tier-list', ui.src, ui.items, { preset: c.preset || 'custom' }, (c.title || '').trim() || ui.src.title);
    s.rank = { tiers: tiersFrom(set), rows: {} }; s.status = 'in-progress';
    put(s); playTier(s.id);
  }
  function placedIn(s) { var m = {}; (s.rank.tiers || []).forEach(function (t) { (s.rank.rows[t.id] || []).forEach(function (id) { m[id] = t.id; }); }); return m; }
  function moveItem(s, id, tierId, at) {
    Object.keys(s.rank.rows).forEach(function (k) { s.rank.rows[k] = (s.rank.rows[k] || []).filter(function (x) { return x !== id; }); });
    if (tierId) { var r = s.rank.rows[tierId] = s.rank.rows[tierId] || []; r.splice(at == null || at < 0 || at > r.length ? r.length : at, 0, id); }
    if (s.status === 'completed') s.status = 'in-progress';
  }
  function tile(it, extra) { var v = view(it); return '<div class="dv-ti' + (extra || '') + '" data-ti="' + esc(it.id) + '" tabindex="0" role="button" aria-label="' + esc(v.title) + '">' + art(it, 'sm') + '<span>' + esc(v.title) + '</span></div>'; }
  function playTier(id) {
    var s = get(id); if (!s) return home(); ui.sid = id; ui.view = 'tier'; closeMenu();
    head(s.title, 'home');
    var pl = placedIn(s), pool = s.items.filter(function (x) { return !pl[x.id]; });
    ui.body.innerHTML = '<div class="dv-tiers">' + s.rank.tiers.map(function (t) {
      return '<div class="dv-tier"><button type="button" class="lab" data-tlab="' + esc(t.id) + '" style="background:' + esc(t.color) + '"><b' + (t.name.length > 6 ? ' class="long"' : '') + '>' + esc(t.name) + '</b>' + (t.note ? '<small>' + esc(t.note) + '</small>' : '') + '</button><div class="zone" data-zone="' + esc(t.id) + '">' +
        (s.rank.rows[t.id] || []).map(function (iid) { var it = itemById(s, iid); return it ? tile(it) : ''; }).join('') + '</div></div>';
    }).join('') + '</div>' +
      '<div class="dv-chips" style="margin-top:10px"><button type="button" class="dv-chip" data-addtier>＋ Tier</button><button type="button" class="dv-chip" data-reset>Reset ranking</button></div>' +
      '<div class="dv-h">Unranked · ' + pool.length + '</div><div class="zone pool" data-zone="">' + pool.map(function (it) { return tile(it); }).join('') + (pool.length ? '' : '<span class="dv-done">Everything is ranked ✓</span>') + '</div>' +
      '<p class="dv-note">Tap an item to move it' + (matchMedia('(pointer:fine)').matches ? ', or drag it' : ' · press and hold to drag') + '. Ranking never changes the cards themselves.</p>';
    foot('<button type="button" class="dv-go" data-tsave>' + (s.status === 'completed' ? 'Done' : 'Save Ranking') + '</button>');
  }
  // the tap menu (no fine dragging needed): Move to S / A / B / C / D / Unranked, earlier / later, preview
  function closeMenu() { if (ui.menu) { ui.menu.remove(); ui.menu = null; } }
  function menu(html) { closeMenu(); var m = document.createElement('div'); m.className = 'dv-menu'; m.innerHTML = html; ui.el.appendChild(m); ui.menu = m; if (m.animate && !reduce) m.animate([{ translate: '0 30px', opacity: 0 }, { translate: '0 0', opacity: 1 }], { duration: 220, easing: 'cubic-bezier(.2,.85,.25,1)' }); }
  function itemMenu(iid) {
    var s = get(ui.sid), it = itemById(s, iid); if (!it) return; var pl = placedIn(s), cur = pl[iid] || '', v = view(it), row = cur ? s.rank.rows[cur] : null, k = row ? row.indexOf(iid) : -1;
    hap('selection');
    menu('<div class="mh">' + art(it, 'sm') + '<div><b>' + esc(v.title) + '</b>' + (v.sub ? '<small>' + esc(v.sub) + '</small>' : '') + '</div><button type="button" class="dv-b" data-mx aria-label="Close">' + ICON.x + '</button></div>' +
      '<div class="dv-h" style="margin-top:6px">Move to</div><div class="mt">' + s.rank.tiers.map(function (t) { return '<button type="button" data-mv="' + esc(iid + '|' + t.id) + '" style="--tc:' + esc(t.color) + '"' + (cur === t.id ? ' class="on"' : '') + '>' + esc(t.name) + '</button>'; }).join('') +
      '<button type="button" data-mv="' + esc(iid + '|') + '" class="un' + (cur ? '' : ' on') + '">Unranked</button></div>' +
      (row ? '<div class="dv-chips" style="margin-top:10px"><button type="button" class="dv-chip" data-nudge="' + esc(iid) + '|-1"' + (k > 0 ? '' : ' disabled') + '>← Earlier</button><button type="button" class="dv-chip" data-nudge="' + esc(iid) + '|1"' + (k < row.length - 1 ? '' : ' disabled') + '>Later →</button></div>' : ''));
  }
  function tierMenu(tid) {
    var s = get(ui.sid), t = s.rank.tiers.filter(function (x) { return x.id === tid; })[0]; if (!t) return; var i = s.rank.tiers.indexOf(t);
    menu('<div class="mh"><span class="tl" style="background:' + esc(t.color) + '">' + esc(t.name) + '</span><div><b>Tier “' + esc(t.name) + '”</b><small>' + (s.rank.rows[tid] || []).length + ' items</small></div><button type="button" class="dv-b" data-mx aria-label="Close">' + ICON.x + '</button></div>' +
      '<div class="dv-chips" style="margin-top:12px"><button type="button" class="dv-chip" data-trename="' + esc(tid) + '">Rename</button><button type="button" class="dv-chip" data-tmove="' + esc(tid) + '|-1"' + (i ? '' : ' disabled') + '>Move up</button><button type="button" class="dv-chip" data-tmove="' + esc(tid) + '|1"' + (i < s.rank.tiers.length - 1 ? '' : ' disabled') + '>Move down</button>' +
      '<button type="button" class="dv-chip" data-tdel="' + esc(tid) + '" style="color:#ff6b6b"' + (s.rank.tiers.length > 1 ? '' : ' disabled') + '>Remove tier</button></div><p class="dv-note">Removing a tier puts its items back in Unranked.</p>');
  }
  function renameTier(tid, isNew) {
    var s = get(ui.sid), t = s.rank.tiers.filter(function (x) { return x.id === tid; })[0]; if (!t || !window.MinestKEdit) return;
    closeMenu();
    MinestKEdit.sheet({ title: isNew ? 'New tier' : 'Rename tier', fields: [{ key: 'name', label: 'Name', value: t.name }, { key: 'note', label: 'Meaning (optional)', value: t.note }], ok: 'Save' }).then(function (v) {
      var s2 = get(ui.sid), t2 = s2.rank.tiers.filter(function (x) { return x.id === tid; })[0]; if (!t2) return;
      if (!v) { if (isNew) { s2.rank.tiers = s2.rank.tiers.filter(function (x) { return x.id !== tid; }); put(s2); } return playTier(s2.id); }
      t2.name = String(v.name || '').trim().slice(0, 24) || t2.name; t2.note = String(v.note || '').trim().slice(0, 40); put(s2); playTier(s2.id);
    });
  }
  function keepTier(fn) { var y = ui.body.scrollTop; fn(); ui.body.scrollTop = y; }
  // drag & drop (mouse: drag at once; touch: press and hold, so scrolling still works)
  function tierDown(e) {
    if (ui.view !== 'tier' || e.button > 0) return;
    var ti = e.target.closest('[data-ti]'); if (!ti) return;
    var d = ui.drag = { el: ti, id: ti.getAttribute('data-ti'), x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY, touch: e.pointerType !== 'mouse', on: false };
    if (d.touch) d.timer = setTimeout(function () { if (ui.drag === d) dragStart(d); }, 300);
    window.addEventListener('pointermove', tierMove, { passive: false }); window.addEventListener('pointerup', tierUp); window.addEventListener('pointercancel', tierUp);
  }
  function dragStart(d) {
    d.on = true; closeMenu(); hap('light');
    var r = d.el.getBoundingClientRect(); d.dx = d.x - r.left; d.dy = d.y - r.top;
    var g = d.ghost = d.el.cloneNode(true); g.className = 'dv-ti dv-ghost'; g.style.width = r.width + 'px'; g.style.left = (d.x - d.dx) + 'px'; g.style.top = (d.y - d.dy) + 'px';
    ui.el.appendChild(g); d.el.classList.add('lift');
    d.ph = document.createElement('div'); d.ph.className = 'dv-ph';
    (function scroll() { if (!ui.drag || !ui.drag.on) return; var br = ui.body.getBoundingClientRect(); if (Math.abs(d.y - d.y0) < 40) {} else if (d.y < br.top + 60) ui.body.scrollTop -= 10; else if (d.y > br.bottom - 120) ui.body.scrollTop += 10; requestAnimationFrame(scroll); })();
  }
  function tierMove(e) {
    var d = ui.drag; if (!d) return; d.x = e.clientX; d.y = e.clientY;
    if (!d.on) { var m = Math.abs(d.x - d.x0) + Math.abs(d.y - d.y0); if (d.touch) { if (m > 10) { clearTimeout(d.timer); cleanupDrag(); } return; } if (m > 6) dragStart(d); else return; }
    e.preventDefault();
    d.ghost.style.left = (d.x - d.dx) + 'px'; d.ghost.style.top = (d.y - d.dy) + 'px';
    var under = document.elementFromPoint(d.x, d.y), zone = under && under.closest && under.closest('[data-zone]');
    if (!zone || !ui.el.contains(zone)) { if (d.ph.parentNode) d.ph.remove(); d.zone = null; return; }
    var kids = [].slice.call(zone.querySelectorAll('[data-ti]')).filter(function (k) { return k !== d.el; }), at = kids.length;
    for (var i = 0; i < kids.length; i++) { var r = kids[i].getBoundingClientRect(); if (d.y < r.top || (d.y < r.bottom && d.x < r.left + r.width / 2)) { at = i; break; } }
    d.zone = zone.getAttribute('data-zone'); d.at = at;
    if (at < kids.length) zone.insertBefore(d.ph, kids[at]); else { var done = zone.querySelector('.dv-done'); if (done) zone.insertBefore(d.ph, done); else zone.appendChild(d.ph); }
  }
  function tierUp() {
    var d = ui.drag; if (!d) return; clearTimeout(d.timer);
    if (d.on) {
      ui.noClick = true; setTimeout(function () { ui.noClick = false; }, 60);
      if (d.zone != null) { var s = get(ui.sid); moveItem(s, d.id, d.zone, d.at); put(s); hap('selection'); }
      cleanupDrag(); keepTier(function () { playTier(ui.sid); });
    } else cleanupDrag();
  }
  function cleanupDrag() {
    var d = ui.drag; ui.drag = null; if (!d) return;
    if (d.ghost) d.ghost.remove(); if (d.ph && d.ph.parentNode) d.ph.remove(); if (d.el) d.el.classList.remove('lift');
    window.removeEventListener('pointermove', tierMove); window.removeEventListener('pointerup', tierUp); window.removeEventListener('pointercancel', tierUp);
  }
  function resultTier(id) {
    var s = get(id); if (!s) return home(); ui.sid = id; ui.view = 'tier-result'; closeMenu(); head(s.title, 'home');
    var pl = placedIn(s), un = s.items.filter(function (x) { return !pl[x.id]; });
    ui.body.innerHTML = '<p class="dv-sub">Tier List · ' + esc(day(s.updatedAt)) + '</p><div class="dv-tiers ro">' + s.rank.tiers.map(function (t) {
      return '<div class="dv-tier"><div class="lab" style="background:' + esc(t.color) + '"><b' + (t.name.length > 6 ? ' class="long"' : '') + '>' + esc(t.name) + '</b>' + (t.note ? '<small>' + esc(t.note) + '</small>' : '') + '</div><div class="zone">' + ((s.rank.rows[t.id] || []).map(function (iid) { var it = itemById(s, iid); return it ? tile(it) : ''; }).join('') || '<span class="dv-done">—</span>') + '</div></div>';
    }).join('') + '</div>' + (un.length ? '<p class="dv-note">' + un.length + ' left unranked.</p>' : '') +
      (s.saved ? '<p class="dv-note">Saved to My World ✓ (' + esc(day(s.saved.at)) + ')</p>' : '') +
      '<div class="dv-chips" style="margin-top:8px"><button type="button" class="dv-chip" data-tedit>Edit ranking</button><button type="button" class="dv-chip" data-export>Export JSON</button><button type="button" class="dv-chip" data-del style="color:#ff6b6b">Delete this result</button></div>';
    foot('<button type="button" class="dv-go" data-tworld>' + (s.saved ? 'Update in My World' : 'Add to My World') + '</button>');
  }
  function saveTierWorld() {
    var s = get(ui.sid), ranked = [];
    s.rank.tiers.forEach(function (t) { (s.rank.rows[t.id] || []).forEach(function (iid) { var it = itemById(s, iid); if (it) ranked.push({ item: it, note: t.name + (t.note ? ' — ' + t.note : '') }); }); });
    if (!ranked.length) return toast('Rank at least one item first.');
    var sum = 'Tier List · ' + day(s.updatedAt) + '\n' + s.rank.tiers.map(function (t) { var n = (s.rank.rows[t.id] || []).map(function (iid) { var it = itemById(s, iid); return it ? view(it).title : ''; }).filter(Boolean); return t.name + ': ' + (n.join(', ') || '—'); }).join('\n');
    return addToWorld(s, ranked, sum).then(function () { toast('Added to My World · My Discoveries'); resultTier(s.id); }).catch(function (e) { toast('✗ ' + e.message); });
  }
  function tierClick(t, e) {
    var g;
    if (ui.noClick) return true;
    if (ui.menu && !t.closest('.dv-menu') && !t.closest('[data-ti]') && !t.closest('[data-tlab]')) { closeMenu(); return true; }
    if (t.closest('[data-mx]')) { closeMenu(); return true; }
    if ((g = t.closest('[data-mv]'))) { var p = g.getAttribute('data-mv').split('|'), s = get(ui.sid); moveItem(s, p[0], p[1] || '', null); put(s); hap('selection'); keepTier(function () { playTier(s.id); }); return true; }
    if ((g = t.closest('[data-nudge]'))) { var q = g.getAttribute('data-nudge').split('|'), s1 = get(ui.sid), cur = placedIn(s1)[q[0]]; if (!cur) return true; var r = s1.rank.rows[cur], k = r.indexOf(q[0]), j = k + (+q[1]); if (j < 0 || j >= r.length) return true; r.splice(k, 1); r.splice(j, 0, q[0]); put(s1); keepTier(function () { playTier(s1.id); }); itemMenu(q[0]); return true; }
    if ((g = t.closest('[data-tlab]'))) { tierMenu(g.getAttribute('data-tlab')); return true; }
    if ((g = t.closest('[data-trename]'))) { renameTier(g.getAttribute('data-trename')); return true; }
    if ((g = t.closest('[data-tmove]'))) { var mv = g.getAttribute('data-tmove').split('|'), s2 = get(ui.sid), ts = s2.rank.tiers, i = ts.findIndex(function (x) { return x.id === mv[0]; }), j2 = i + (+mv[1]); if (j2 < 0 || j2 >= ts.length) return true; var x = ts[i]; ts[i] = ts[j2]; ts[j2] = x; put(s2); keepTier(function () { playTier(s2.id); }); tierMenu(mv[0]); return true; }
    if ((g = t.closest('[data-tdel]'))) { var s3 = get(ui.sid), tid = g.getAttribute('data-tdel'); if (s3.rank.tiers.length < 2) return true; s3.rank.tiers = s3.rank.tiers.filter(function (x) { return x.id !== tid; }); delete s3.rank.rows[tid]; put(s3); keepTier(function () { playTier(s3.id); }); return true; }
    if (t.closest('[data-addtier]')) { var s4 = get(ui.sid); if (s4.rank.tiers.length >= 10) { toast('Up to 10 tiers.'); return true; } var nt = tiersFrom([['New tier', '']])[0]; nt.color = TIER_C[s4.rank.tiers.length % TIER_C.length]; s4.rank.tiers.push(nt); put(s4); playTier(s4.id); renameTier(nt.id, true); return true; }
    if (t.closest('[data-reset]')) { var ask = window.MinestKEdit ? MinestKEdit.confirm('Move every item back to Unranked? Your tiers stay.', 'Reset') : Promise.resolve(confirm('Reset the ranking?')); ask.then(function (ok) { if (!ok) return; var s5 = get(ui.sid); s5.rank.rows = {}; s5.status = 'in-progress'; put(s5); playTier(s5.id); }); return true; }
    if ((g = t.closest('[data-ti]')) && ui.view === 'tier') { itemMenu(g.getAttribute('data-ti')); return true; }
    if (t.closest('[data-tsave]')) { var s6 = get(ui.sid); s6.status = 'completed'; put(s6); hap('success'); resultTier(s6.id); return true; }
    if (t.closest('[data-tedit]')) { playTier(ui.sid); return true; }
    if (t.closest('[data-tworld]')) { saveTierWorld(); return true; }
    return false;
  }

  // ================================================================== input
  function onKey(e) {
    if (e.key === 'Escape') { if (ui.menu) closeMenu(); else close(); return; }
    if (ui.view === 'tier' && (e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('[data-ti]')) { e.preventDefault(); itemMenu(e.target.getAttribute('data-ti')); return; }
    if (ui.view !== 'tot' || /INPUT|TEXTAREA/.test(e.target.tagName)) return;
    var bs = ui.body.querySelectorAll('[data-choose]');
    if (e.key === 'ArrowLeft' && bs[0]) { e.preventDefault(); chooseTOT(bs[0].getAttribute('data-choose')); }
    else if (e.key === 'ArrowRight' && bs[1]) { e.preventDefault(); chooseTOT(bs[1].getAttribute('data-choose')); }
    else if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') { e.preventDefault(); chooseTOT(null); }
    else if (e.key === 'Backspace' || e.key === 'ArrowUp') { e.preventDefault(); backTOT(); }
  }
  function onClick(e) {
    var t = e.target, g;
    if ((ui.view === 'tier' || ui.view === 'tier-result') && tierClick(t, e)) return;
    if (t.closest('[data-x]')) return close();
    if ((g = t.closest('[data-back]'))) { var b = g.getAttribute('data-back'); if (b === 'source') return ui.preset ? home() : pickSource(ui.tool); return home(); }
    if ((g = t.closest('[data-tool]'))) { var tool = g.getAttribute('data-tool'); if (!READY[tool]) return; if (ui.preset) { ui.tool = tool; var s0 = srcFrom(ui.preset); if (s0) return startConfig(s0, itemsOf(s0)); } return pickSource(tool); }
    if ((g = t.closest('[data-src]')) && g.tagName === 'BUTTON') { var s1 = srcFrom(g.getAttribute('data-src')); if (s1) startConfig(s1, itemsOf(s1)); return; }
    if (t.closest('[data-json]')) return ui.file.click();
    if ((g = t.closest('[data-qset]'))) { ui.cfg.question = g.getAttribute('data-qset'); return drawConfig(); }
    if ((g = t.closest('[data-max]'))) { ui.cfg.maxPairs = +g.getAttribute('data-max'); return drawConfig(); }
    if ((g = t.closest('[data-mode]'))) { ui.cfg.mode = g.getAttribute('data-mode'); return drawConfig(); }
    if ((g = t.closest('[data-preset]'))) { ui.cfg.preset = g.getAttribute('data-preset'); if (ui.cfg.preset !== 'json') ui.cfg.tiers = null; else ui.cfg.tiers = (ui.json && ui.json.config.tierList && ui.json.config.tierList.tiers) || null; return drawConfig(); }
    if (t.closest('[data-start]')) { if (ui.tool === 'this-or-that') return startTOT(); if (ui.tool === 'tier-list') return startTier(); return; }
    if ((g = t.closest('[data-choose]'))) return chooseTOT(g.getAttribute('data-choose'));
    if (t.closest('[data-skip]')) return chooseTOT(null);
    if (t.closest('[data-tback]')) return backTOT();
    if ((g = t.closest('[data-session]'))) { var s = get(g.getAttribute('data-session')); if (!s) return; if (s.tool === 'this-or-that') return s.status === 'completed' ? resultTOT(s.id) : playTOT(s.id); if (s.tool === 'tier-list') return s.status === 'completed' ? resultTier(s.id) : playTier(s.id); return; }
    if ((g = t.closest('[data-redo]'))) { var s2 = get(ui.sid); s2.at = +g.getAttribute('data-redo'); s2.redo = true; s2.status = 'in-progress'; put(s2); return playTOT(s2.id); }
    if (t.closest('[data-resume]')) return playTOT(ui.sid);
    if (t.closest('[data-save]')) return saveTOT();
    if (t.closest('[data-again]')) { var s3 = get(ui.sid); ui.tool = s3.tool; ui.src = s3.source; ui.items = s3.items; ui.cfg = { title: s3.title, question: s3.config.question, maxPairs: s3.config.maxPairs, mode: s3.config.pairing }; return startTOT(); }
    if (t.closest('[data-export]')) return exportSession(get(ui.sid));
    if (t.closest('[data-del]')) {
      var s4 = get(ui.sid); var ask = window.MinestKEdit ? MinestKEdit.confirm('Delete the result “' + s4.title + '”? The cards in your lists stay as they are' + (s4.saved ? ', and so does what you added to My World.' : '.')) : Promise.resolve(confirm('Delete this result?'));
      return ask.then(function (ok) { if (!ok) return; KN().set('dv:' + s4.id, null, true); toast('Deleted'); home(); });
    }
  }

  // from a list: MinestDiscover.open({ bid, listId }) or ({ bid, cardId }) skips "Select a list"
  function open(o) {
    o = o || {}; shell(); home();
    if (o.bid && (o.listId || o.cardId)) { ui.preset = (o.cardId ? 'card' : 'list') + '|' + o.bid + '|' + (o.cardId || o.listId); if (!srcFrom(ui.preset)) { ui.preset = null; toast('This list needs at least 2 items to play.'); } else ui.body.querySelector('.dv-sub').textContent = 'Using “' + srcFrom(ui.preset).title + '” — pick a way to play.'; }
    if (o.tool && READY[o.tool]) { var e = ui.body.querySelector('[data-tool="' + o.tool + '"]'); if (e) e.click(); }
  }
  window.MinestDiscover = { open: open, close: close, isOpen: function () { return ui.open; }, sessions: all, get: get, fromJson: fromJson, makePairs: makePairs, sources: sources, itemsOf: itemsOf };
})();
