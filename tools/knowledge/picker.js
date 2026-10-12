/* Minest Knowledge · Visual Quick Add (List of Mine, Phase E) — window.MinestPicker
   Three ways to fill a "My …" list, one shared core:
     Gallery (IMDb-style)  — movies, books…: a poster grid; the round button top-left selects, the poster opens a preview
     Bubble (Apple Music)  — artists, hobbies…: tap a bubble to pick it (it grows a little), tap again to drop it
     Profile (step by step) — goals, values, habits, and the skills of a My Skills world
   The core: one selection, de-duplication (against what the list already holds), one save, and links —
   every picked thing is one knowledge item 'ki:<catalog>:<id>'; each stacked card that shows it points to it with
   'pk:<stacked card>' (so the same movie in two lists is one item). Skills keep their own record 'sk:<card>' (st).
   Pictures come only from the catalog data or the user's own photos — never from the web.
   Catalogs: window.__MINEST_PICKERS (tools/knowledge/pickers/*.json). Nothing here deletes anything. */
(function () {
  if (window.MinestPicker) return;
  var A = function () { return window.MinestAI || {}; };
  var KN = function () { return window.MinestKnowledge; };
  var UNDO = 'minest.world.undo';
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function slug(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'x'; }
  function norm(s) { return String(s || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/^(the|a|an)\s+/, '').replace(/[^a-z0-9一-鿿]+/g, ''); }
  function toast(m) { try { if (window.GlassUI && GlassUI.toast) GlassUI.toast(m); } catch (e) {} }
  function boards() { try { return (A().boards && A().boards()) || []; } catch (e) { return []; } }
  function boardById(id) { return boards().filter(function (b) { return b.id === id; })[0] || null; }
  function hash(s) { var h = 2166136261; s = String(s); for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

  // ================================================================== catalogs
  var ORDER = ['movies', 'books', 'artists', 'hobbies', 'goals', 'values', 'habits', 'experiences'];
  function cats() { var C = window.__MINEST_PICKERS || {}; return ORDER.filter(function (k) { return C[k]; }).map(function (k) { return C[k]; }).concat(Object.keys(C).filter(function (k) { return ORDER.indexOf(k) < 0; }).map(function (k) { return C[k]; })); }
  function cat(id) { return (window.__MINEST_PICKERS || {})[id] || null; }
  function catFor(title) { var t = String(title || ''); return cats().filter(function (c) { try { return new RegExp('\\b(' + c.match + ')', 'i').test(t); } catch (e) { return false; } })[0] || null; }

  // ================================================================== the shared core
  function locate(b, cardId) { var hit = null; (b.columns || []).forEach(function (col) { (col.cards || []).forEach(function (c) { if (c && c.id === cardId) hit = { col: col, card: c }; }); }); return hit; }
  function kiKey(catId, itemId) { return 'ki:' + catId + ':' + itemId; }
  // what a list already holds: knowledge items it links to, and the names of all its stacked cards
  function holds(card) {
    var keys = {}, names = {};
    (card.stack || []).forEach(function (s) { names[norm(s.title)] = 1; var k = KN().get('pk:' + s.id); if (k) keys[k] = 1; });
    return { keys: keys, names: names };
  }
  function inList(h, catId, it) { return !!(h.keys[kiKey(catId, it.id)] || h.names[norm(it.title)]); }
  // the other lists a knowledge item is in (the same item, not a copy)
  function placesOf(key) {
    var ids = {}; KN().keys('pk:').forEach(function (k) { if (KN().get(k) === key) ids[k.slice(3)] = 1; });
    var out = []; boards().forEach(function (b) { (b.columns || []).forEach(function (col) { (col.cards || []).forEach(function (c) { (c.stack || []).forEach(function (s) { if (ids[s.id]) out.push({ bid: b.id, board: b.title, list: c.title, cardId: c.id }); }); }); }); });
    return out;
  }
  function pushUndo(bid, old, title) {
    try { var u = JSON.parse(localStorage.getItem(UNDO) || '[]'); u.unshift({ at: Date.now(), bid: bid, board: old, title: title, cfg: KN().get('lm:cfg:' + bid), world: KN().get('lom:world:' + bid) }); localStorage.setItem(UNDO, JSON.stringify(u.slice(0, 5))); } catch (e) {}
  }
  function written(bid, before) {
    var t0 = Date.now();
    return new Promise(function (done) { (function wait() { if (A().boards() !== before || Date.now() - t0 > 900) { try { window.dispatchEvent(new CustomEvent('minest:kedit', { detail: { bid: bid } })); } catch (e) {} done(); } else requestAnimationFrame(wait); })(); });
  }
  // picks: [{cat, item:{id,title,sub,tag,img}}] → stacked cards under the "My …" card. Returns {added, skipped}
  function save(bid, cardId, picks) {
    var b0 = boardById(bid); if (!b0) return Promise.reject(new Error('This world is not here any more.'));
    var b = JSON.parse(JSON.stringify(b0)), L = locate(b, cardId); if (!L) return Promise.reject(new Error('The list is not here any more.'));
    var h = holds(L.card), add = [], side = {}, skipped = 0;
    picks.forEach(function (p) {
      var it = p.item, key = kiKey(p.cat, it.id);
      if (inList(h, p.cat, it)) { skipped++; return; }
      h.keys[key] = 1; h.names[norm(it.title)] = 1;
      var rec = Object.assign({}, KN().get(key) || {}, { title: it.title, sub: it.sub || '', tag: it.tag || '', cat: p.cat, own: !!it.own, at: Date.now() });
      var img = it.img || rec.img; if (it.img) rec.img = it.img;
      var sid = cardId + '~' + slug(p.cat) + '-' + slug(it.id), n = 2; while ((L.card.stack || []).some(function (s) { return s.id === sid; })) sid = cardId + '~' + slug(p.cat) + '-' + slug(it.id) + '-' + (n++);
      var s = { id: sid, title: it.title, desc: [it.sub, it.tag].filter(Boolean).join(' · '), labels: [], complete: false, mastery: 1 };
      if (img) s.cover = { type: 'image', value: img, url: img, title: '', size: 'banner' };
      add.push(s); side[key] = rec; side['pk:' + sid] = key;
    });
    if (!add.length) return Promise.resolve({ added: 0, skipped: skipped });
    L.card.stack = (L.card.stack || []).concat(add); L.card.hasStack = true;
    pushUndo(bid, b0, 'Quick Add · ' + L.card.title);
    var before = A().boards();
    A().updateBoard(bid, function () { return b; });
    KN().setMany(side);
    return written(bid, before).then(function () { return { added: add.length, skipped: skipped }; });
  }
  // a new "My Favorite …" list card (in a "My Favorites" area), or the one made before
  function ensureList(bid, c) {
    var b0 = boardById(bid); if (!b0) return Promise.reject(new Error('This world is not here any more.'));
    var colId = bid + '-d-quick-favorites', cid = bid + '-l-quick-' + slug(c.id);
    if (locate(b0, cid)) return Promise.resolve(cid);
    var b = JSON.parse(JSON.stringify(b0)), col = (b.columns || []).filter(function (x) { return x.id === colId; })[0];
    if (!col) { col = { id: colId, title: 'My Favorites', color: '#ff375f', cards: [] }; b.columns = (b.columns || []).concat([col]); }
    col.cards = (col.cards || []).concat([{ id: cid, title: c.listTitle || 'My Favorite ' + c.title, desc: '', labels: [], complete: false, createdAt: Date.now(), mastery: 1, checklistItems: [] }]);
    var before = A().boards();
    A().updateBoard(bid, function () { return b; });
    return written(bid, before).then(function () { return cid; });
  }

  // ---------------------------------------------------------------- skills (My Skills worlds): the learner's own status
  function skillAreas(b) {
    var out = [];
    (b.columns || []).forEach(function (col) {
      var sk = [];
      (col.cards || []).forEach(function (c) { var r = c && KN().get('sk:' + c.id); if (r) sk.push({ card: c, rec: r }); });
      if (!sk.length) return;
      var r0 = sk[0].rec;
      out.push({ col: col, kind: r0.kind || 'life', grade: (r0.grades && r0.grades[0]) || '', subject: r0.subject || col.title, title: col.title, skills: sk });
    });
    return out;
  }
  function saveSkills(bid, changes, own) {
    var m = {}, n = 0;
    Object.keys(changes).forEach(function (id) { var r = KN().get('sk:' + id); if (!r) return; if ((r.st || '') === (changes[id] || '')) return; m['sk:' + id] = Object.assign({}, r, { st: changes[id] || null, at: Date.now() }); n++; });
    var made = 0, p = Promise.resolve();
    if (own.length) {
      var b0 = boardById(bid); if (!b0) return Promise.reject(new Error('This world is not here any more.'));
      var b = JSON.parse(JSON.stringify(b0));
      own.forEach(function (o) {
        var col = (b.columns || []).filter(function (c) { return c.id === o.colId; })[0]; if (!col) return;
        if ((col.cards || []).some(function (c) { return norm(c.title) === norm(o.title); })) return;   // already there
        var id = o.colId + '-own-' + slug(o.title), k = 2; while (locate(b, id)) id = o.colId + '-own-' + slug(o.title) + '-' + (k++);
        col.cards = (col.cards || []).concat([{ id: id, title: o.title, desc: '', labels: [], complete: false, createdAt: Date.now(), mastery: 1, checklistItems: [] }]);
        m['sk:' + id] = { tpl: 'own', sid: slug(o.title), kind: o.kind, subject: o.subject || null, grades: o.grade ? [o.grade] : [], group: 'My own', area: col.title, std: [], src: [], st: o.st || null, own: true, at: Date.now() };
        made++;
      });
      if (made) { pushUndo(bid, b0, 'Quick Add · skills'); var before = A().boards(); A().updateBoard(bid, function () { return b; }); p = written(bid, before); }
    }
    if (Object.keys(m).length) KN().setMany(m);
    return p.then(function () { return { changed: n, made: made }; });
  }

  // ================================================================== pictures (the catalog's own, the user's own, else a drawn poster)
  function look(it) { var h = hash(it.title), a = h % 360, b2 = (a + 40 + (h >> 9) % 80) % 360; return 'linear-gradient(155deg,hsl(' + a + ' 62% 46%),hsl(' + b2 + ' 70% 24%))'; }
  function imgOf(c, it) { if (it.img) return it.img; var r = KN().get(kiKey(c.id, it.id)); return (r && r.img) || ''; }
  function poster(c, it) {
    var im = imgOf(c, it);
    if (im) return '<span class="pk-art" style="background-image:url(&quot;' + esc(im) + '&quot;)"></span>';
    return '<span class="pk-art drawn" style="background:' + look(it) + '"><b>' + esc(it.title) + '</b>' + (it.sub ? '<small>' + esc(it.sub) + '</small>' : '') + '</span>';
  }
  function initials(t) { var w = String(t).replace(/[^A-Za-z0-9À-ɏ一-鿿 ]/g, ' ').trim().split(/\s+/); return (w.length > 1 ? w[0][0] + w[w.length - 1][0] : String(t).slice(0, 2)).toUpperCase(); }

  // ================================================================== UI
  var ICON = {
    x: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    back: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
    check: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    plus: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    search: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/></svg>',
    gallery: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><rect x="3.5" y="3.5" width="7" height="9" rx="1.6"/><rect x="13.5" y="3.5" width="7" height="9" rx="1.6"/><rect x="3.5" y="15.5" width="7" height="5" rx="1.6"/><rect x="13.5" y="15.5" width="7" height="5" rx="1.6"/></svg>',
    bubble: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="8" cy="9" r="4.5"/><circle cx="16.5" cy="7" r="3"/><circle cx="15" cy="16.5" r="4.5"/></svg>',
    profile: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="5" cy="6" r="1.6"/><circle cx="5" cy="12" r="1.6"/><circle cx="5" cy="18" r="1.6"/><path d="M10 6h10M10 12h10M10 18h6"/></svg>'
  };
  var KIND_T = { gallery: 'Gallery', bubble: 'Bubbles', profile: 'Step by step' };
  var CSS = [
    '.pk{position:fixed;inset:0;z-index:2147482010;display:flex;flex-direction:column;color:#f3f5f8;font:15px/1.4 -apple-system,BlinkMacSystemFont,"SF Pro Text",system-ui,sans-serif;-webkit-font-smoothing:antialiased;' +
      'background:linear-gradient(180deg,rgba(20,24,36,.93),rgba(8,10,18,.97));-webkit-backdrop-filter:blur(40px) saturate(180%);backdrop-filter:blur(40px) saturate(180%)}',
    '.pk-head{display:flex;align-items:center;gap:10px;padding:calc(env(safe-area-inset-top,0px) + 12px) 14px 6px}',
    '.pk-head h2{flex:1;min-width:0;margin:0;font-size:24px;font-weight:800;letter-spacing:-.4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.pk-b{flex:none;width:36px;height:36px;border-radius:50%;display:grid;place-items:center;padding:0;cursor:pointer;color:inherit;background:linear-gradient(180deg,rgba(255,255,255,.18),rgba(255,255,255,.06));border:1px solid rgba(255,255,255,.24);box-shadow:inset 0 1px 0 rgba(255,255,255,.35),0 6px 16px rgba(0,0,0,.25)}',
    '.pk-sub{margin:0 16px 8px;font-size:13.5px;opacity:.62}',
    '.pk-find{display:flex;align-items:center;gap:8px;margin:2px 14px 8px;height:38px;padding:0 12px;border-radius:12px;background:rgba(255,255,255,.09);border:1px solid rgba(255,255,255,.12)}',
    '.pk-find svg{opacity:.55;flex:none}.pk-find input{flex:1;min-width:0;border:0;background:none;color:inherit;font:inherit;outline:none}',
    '.pk-body{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:4px 14px calc(env(safe-area-inset-bottom,0px) + 110px)}',
    '.pk-h{margin:16px 2px 8px;font-size:12px;font-weight:650;letter-spacing:.06em;text-transform:uppercase;opacity:.55}',
    '.pk-foot{position:absolute;left:0;right:0;bottom:0;padding:26px 14px calc(env(safe-area-inset-bottom,0px) + 14px);background:linear-gradient(180deg,rgba(8,10,18,0),rgba(8,10,18,.97) 22px);display:flex;gap:10px}',
    '.pk-go{flex:1;height:50px;border-radius:999px;border:1px solid rgba(255,255,255,.25);background:linear-gradient(180deg,#3d9bff,#0a7aff);color:#fff;font:700 16px -apple-system,system-ui,sans-serif;cursor:pointer;box-shadow:0 10px 26px rgba(10,122,255,.35)}',
    '.pk-go:disabled{opacity:.4;box-shadow:none}',
    '.pk-go.sec{flex:0 0 auto;padding:0 20px;background:rgba(255,255,255,.1);box-shadow:none}',
    // home
    '.pk-row{display:flex;align-items:center;gap:12px;width:100%;text-align:left;padding:12px;margin-bottom:8px;border-radius:18px;cursor:pointer;color:inherit;font:inherit;background:linear-gradient(180deg,rgba(255,255,255,.12),rgba(255,255,255,.05));border:1px solid rgba(255,255,255,.16)}',
    '.pk-row:active{transform:scale(.98)}',
    '.pk-row i{flex:none;width:40px;height:40px;border-radius:12px;display:grid;place-items:center;font-style:normal;color:#fff;background:var(--c,#5e5ce6)}',
    '.pk-row div{flex:1;min-width:0}.pk-row b{display:block;font-size:15.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.pk-row small{display:block;font-size:12.5px;opacity:.6;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.pk-row em{flex:none;font-style:normal;font-size:12px;opacity:.5}',
    '.pk-chips{display:flex;flex-wrap:wrap;gap:8px}',
    '.pk-chip{min-height:36px;padding:6px 14px;border-radius:999px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.08);color:inherit;font:600 14px -apple-system,system-ui,sans-serif;cursor:pointer;display:inline-flex;align-items:center;gap:6px;transition:transform .15s,background .15s}',
    '.pk-chip:active{transform:scale(.95)}',
    '.pk-chip.on{background:linear-gradient(180deg,#3d9bff,#0a7aff);border-color:rgba(255,255,255,.4);color:#fff}',
    '.pk-chip.can.on{background:linear-gradient(180deg,#34c759,#1f9d43)}.pk-chip.want.on{background:linear-gradient(180deg,#bf5af2,#9b3fd0)}',
    '.pk-chip.in{opacity:.5;cursor:default}',
    '.pk-chip.add{border-style:dashed}',
    '.pk-chip small{opacity:.65;font-weight:500}',
    // gallery
    '.pk-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(104px,1fr));gap:12px 10px}',
    '.pk-tile{position:relative;display:block;min-width:0;cursor:pointer}',
    '.pk-tile .pk-art{display:flex;flex-direction:column;justify-content:flex-end;aspect-ratio:2/3;border-radius:12px;background-size:cover;background-position:center;overflow:hidden;padding:8px;box-sizing:border-box;box-shadow:0 8px 20px rgba(0,0,0,.35),inset 0 0 0 1px rgba(255,255,255,.14);transition:transform .18s,box-shadow .18s}',
    '.pk-art.drawn b{font:800 14px/1.15 Georgia,"Times New Roman",serif;color:#fff;text-shadow:0 1px 6px rgba(0,0,0,.4);display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden}',
    '.pk-art.drawn small{font-size:11px;color:rgba(255,255,255,.8);margin-top:3px}',
    '.pk-tile.on .pk-art{box-shadow:0 0 0 3px #0a84ff,0 10px 24px rgba(10,132,255,.4);transform:scale(.96)}',
    '.pk-tile p{margin:6px 2px 0;font-size:12.5px;font-weight:600;line-height:1.25;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}',
    '.pk-tile p small{display:block;font-weight:400;opacity:.55}',
    '.pk-sel{position:absolute;left:6px;top:6px;width:30px;height:30px;border-radius:50%;display:grid;place-items:center;padding:0;cursor:pointer;color:#fff;background:rgba(0,0,0,.42);border:2px solid rgba(255,255,255,.9);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}',
    '.pk-sel svg{opacity:0}.pk-tile.on .pk-sel{background:#0a84ff;border-color:#fff}.pk-tile.on .pk-sel svg{opacity:1}',
    '.pk-tile.in .pk-sel{background:rgba(52,199,89,.9);border-color:#fff;cursor:default}.pk-tile.in .pk-sel svg{opacity:1}.pk-tile.in .pk-art{opacity:.55}',
    '.pk-tile.own .pk-art{display:grid;place-items:center;background:rgba(255,255,255,.06);border:1.5px dashed rgba(255,255,255,.3);box-shadow:none;text-align:center;font-weight:650;font-size:13px}',
    // preview
    '.pk-pv{position:absolute;inset:0;z-index:5;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:30px 24px;background:rgba(6,8,14,.82);-webkit-backdrop-filter:blur(24px);backdrop-filter:blur(24px);text-align:center}',
    '.pk-pv .pk-art{width:min(56vw,230px);aspect-ratio:2/3;border-radius:16px;display:flex;flex-direction:column;justify-content:flex-end;padding:12px;box-sizing:border-box;background-size:cover;background-position:center;box-shadow:0 20px 50px rgba(0,0,0,.5);text-align:left}',
    '.pk-pv .pk-art.drawn b{font-size:20px}',
    '.pk-pv h3{margin:0;font-size:21px;font-weight:800;letter-spacing:-.3px}.pk-pv .meta{opacity:.65;font-size:14px}.pk-pv .also{font-size:12.5px;opacity:.6;max-width:320px}',
    '.pk-pv .row{display:flex;gap:10px;flex-wrap:wrap;justify-content:center}',
    // bubbles
    '.pk-bub{display:flex;flex-wrap:wrap;justify-content:center;align-items:flex-start;gap:6px 10px;padding:8px 0 20px}',
    '.pk-bb:nth-child(3n+2){margin-top:26px}.pk-bb:nth-child(3n+3){margin-top:10px}',
    '.pk-bb{display:flex;flex-direction:column;align-items:center;gap:5px;width:calc(var(--s) + 8px);cursor:pointer;background:none;border:0;padding:0;color:inherit;font:inherit}',
    '.pk-bb i{width:var(--s);height:var(--s);border-radius:50%;display:grid;place-items:center;font-style:normal;color:#fff;font:800 calc(var(--s) * .3) -apple-system,system-ui,sans-serif;background-size:cover;background-position:center;' +
      'box-shadow:0 8px 20px rgba(0,0,0,.35),inset 0 1px 0 rgba(255,255,255,.35);transition:transform .22s cubic-bezier(.3,1.5,.5,1),box-shadow .2s}',
    '.pk-bb span{font-size:12px;font-weight:600;line-height:1.2;max-width:100%;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}',
    '.pk-bb.on span{transform:translateY(6px)}.pk-bb span{transition:transform .22s}',
    '.pk-bb.on i{transform:scale(1.12);box-shadow:0 0 0 3px #fff,0 0 0 6px #0a84ff,0 14px 30px rgba(10,132,255,.45)}',
    '.pk-bb.in i{opacity:.45}.pk-bb.in span:after{content:" ✓";color:#30d158}',
    '.pk-bb.own i{background:rgba(255,255,255,.07)!important;border:1.5px dashed rgba(255,255,255,.35);box-shadow:none}',
    // steps
    '.pk-steps{display:flex;gap:5px;margin:4px 16px 10px}.pk-steps span{flex:1;height:4px;border-radius:4px;background:rgba(255,255,255,.14)}.pk-steps span.on{background:#0a84ff}',
    '.pk-q{margin:6px 2px 4px;font-size:20px;font-weight:750;letter-spacing:-.3px}',
    '.pk-hint{margin:0 2px 14px;font-size:13.5px;opacity:.6}',
    '.pk-own{display:flex;gap:8px;margin-top:14px}.pk-own input{flex:1;min-width:0;height:40px;padding:0 12px;border-radius:12px;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.08);color:inherit;font:inherit;outline:none}',
    '.pk-own button{height:40px;padding:0 14px;border-radius:12px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.12);color:inherit;font:650 14px -apple-system,system-ui,sans-serif;cursor:pointer;display:inline-flex;align-items:center;gap:4px}',
    '.pk-sum{margin:0 0 8px;padding:12px 14px;border-radius:16px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12)}.pk-sum b{display:block;font-size:13px;opacity:.6;margin-bottom:6px}',
    '.pk-empty{padding:40px 16px;text-align:center;opacity:.6}',
    // light
    'html.kn-light .pk{color:#1d1f23;background:linear-gradient(180deg,rgba(244,246,250,.93),rgba(232,236,243,.97))}',
    'html.kn-light .pk-b,html.kn-light .pk-row,html.kn-light .pk-chip,html.kn-light .pk-find,html.kn-light .pk-own input,html.kn-light .pk-own button,html.kn-light .pk-sum{background:rgba(255,255,255,.82);border-color:rgba(0,0,0,.08);box-shadow:inset 0 1px 0 #fff,0 6px 18px rgba(30,40,60,.07)}',
    'html.kn-light .pk-chip.on{color:#fff;background:linear-gradient(180deg,#3d9bff,#0a7aff)}',
    'html.kn-light .pk-foot{background:linear-gradient(180deg,rgba(236,239,245,0),rgba(236,239,245,.97) 22px)}',
    'html.kn-light .pk-go.sec{background:rgba(0,0,0,.06);color:#1d1f23}',
    'html.kn-light .pk-pv{background:rgba(240,242,247,.88)}',
    'html.kn-light .pk-steps span{background:rgba(0,0,0,.1)}.pk-steps span.on{background:#0a84ff!important}',
    'html.kn-light .pk-tile.own .pk-art,html.kn-light .pk-bb.own i{border-color:rgba(0,0,0,.25);color:#1d1f23}'
  ].join('\n');
  function css() { if (document.getElementById('pk-css')) return; var s = document.createElement('style'); s.id = 'pk-css'; s.textContent = CSS; document.head.appendChild(s); }

  var ui = { open: false };
  function shell() {
    if (ui.open) return;
    css(); if (KN() && KN().applyLook) KN().applyLook();
    var el = document.createElement('div'); el.className = 'pk'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Quick Add');
    el.innerHTML = '<div class="pk-head"></div><div class="pk-top"></div><div class="pk-body"></div><div class="pk-foot" hidden></div>';
    ['pointerdown', 'touchstart', 'touchmove', 'wheel', 'keydown'].forEach(function (ev) { el.addEventListener(ev, function (e) { e.stopPropagation(); }, { passive: ev !== 'keydown' }); });
    ui.el = el; ui.head = el.querySelector('.pk-head'); ui.top = el.querySelector('.pk-top'); ui.body = el.querySelector('.pk-body'); ui.foot = el.querySelector('.pk-foot'); ui.open = true;
    document.body.appendChild(el); document.documentElement.classList.add('kn-open');
    if (el.animate) el.animate([{ opacity: 0, translate: '0 24px' }, { opacity: 1, translate: '0 0' }], { duration: 300, easing: 'cubic-bezier(.2,.85,.25,1)' });
    el.addEventListener('click', onClick);
    el.addEventListener('input', function (e) { if (e.target.matches('[data-find]')) { ui.q = e.target.value; ui.draw && ui.draw(); } });
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && e.target.matches('[data-ownin]')) { e.preventDefault(); addOwn(e.target); }
      if (e.key === 'Escape') { if (ui.pv) closePv(); else close(); }
    });
  }
  function close() {
    if (!ui.open) return;
    var el = ui.el, after = ui.after; ui.open = false; ui.el = null; ui.pv = null;
    if (!document.querySelector('.lw,.sk,.wk')) document.documentElement.classList.remove('kn-open');
    if (el.animate) { var an = el.animate([{ opacity: 1 }, { opacity: 0, translate: '0 18px' }], { duration: 200, fill: 'forwards' }); an.onfinish = function () { el.remove(); }; } else el.remove();
    if (after) setTimeout(after, 50);
  }
  function head(title, back, sub) {
    ui.head.innerHTML = (back ? '<button type="button" class="pk-b" data-back aria-label="Back">' + ICON.back + '</button>' : '') + '<h2>' + esc(title) + '</h2><button type="button" class="pk-b" data-x aria-label="Close">' + ICON.x + '</button>';
    ui.top.innerHTML = sub ? '<p class="pk-sub">' + esc(sub) + '</p>' : '';
    ui.back = back || null; ui.draw = null; ui.q = ''; ui.foot.hidden = true; ui.foot.innerHTML = ''; ui.body.scrollTop = 0;
  }
  function findBox(ph) { ui.top.insertAdjacentHTML('beforeend', '<label class="pk-find">' + ICON.search + '<input data-find type="search" placeholder="' + esc(ph) + '" autocomplete="off"></label>'); }
  function match(it) { var q = norm(ui.q || ''); return !q || norm(it.title + ' ' + (it.sub || '') + ' ' + (it.tag || '')).indexOf(q) >= 0; }

  // ---------------------------------------------------------------- Quick Add home: the lists of a world you can fill
  function home(bid) {
    shell(); ui.bid = bid; ui.after = null;
    var b = boardById(bid); if (!b) { close(); return toast('This world is not here any more.'); }
    head('Quick Add', null, b.title);
    var rows = [], seen = {};
    (b.columns || []).forEach(function (col) { (col.cards || []).forEach(function (c) {
      if (!c || KN().isHeading(c.id) || KN().get('sk:' + c.id)) return;
      var k = catFor(c.title); if (!k) return; seen[k.id] = 1;
      rows.push('<button type="button" class="pk-row" data-fill="' + esc(c.id) + '" data-cat="' + esc(k.id) + '" style="--c:' + esc(col.color || '#5e5ce6') + '"><i>' + ICON[k.kind] + '</i><div><b>' + esc(c.title) + '</b><small>' + esc(col.title) + ' · ' + KIND_T[k.kind] + '</small></div><em>' + ((c.stack || []).length || '') + '</em></button>');
    }); });
    var sk = skillAreas(b), kinds = {}; sk.forEach(function (a) { kinds[a.kind] = (kinds[a.kind] || 0) + a.skills.length; });
    var skr = Object.keys(kinds).map(function (k) { return '<button type="button" class="pk-row" data-skills="' + k + '" style="--c:' + (k === 'academic' ? '#0a84ff' : '#30d158') + '"><i>' + ICON.profile + '</i><div><b>' + (k === 'academic' ? 'My Academic Skills' : 'My Life Skills') + '</b><small>Step by step · what you can do, what you want to learn</small></div><em>' + kinds[k] + '</em></button>'; }).join('');
    ui.body.innerHTML = (skr ? '<div class="pk-h">Skills</div>' + skr : '') +
      (rows.length ? '<div class="pk-h">Fill a list</div>' + rows.join('') : '') +
      '<div class="pk-h">Start a new list</div><div class="pk-chips">' + cats().filter(function (k) { return !locate(b, bid + '-l-quick-' + slug(k.id)); }).map(function (k) { return '<button type="button" class="pk-chip add" data-newlist="' + esc(k.id) + '">' + ICON.plus + esc(k.listTitle || 'My Favorite ' + k.title) + '</button>'; }).join('') + '</div>';
    ui.view = 'home';
  }

  // ---------------------------------------------------------------- the selection, shared by all three pickers
  function startPick(bid, cardId, c, back) {
    shell(); ui.bid = bid; ui.cardId = cardId; ui.cat = c; ui.sel = {}; ui.own = [];
    var b = boardById(bid), L = b && locate(b, cardId); if (!L) { toast('The list is not here any more.'); return false; }
    ui.list = L.card; ui.have = holds(L.card);
    head(L.card.title, back, null);
    return true;
  }
  function itemsNow() { return (ui.cat.items || []).concat(ui.own); }
  function isIn(it) { return inList(ui.have, ui.cat.id, it); }
  function nSel() { return Object.keys(ui.sel).length; }
  function toggle(id) { var it = itemsNow().filter(function (x) { return x.id === id; })[0]; if (!it || isIn(it)) return false; if (ui.sel[id]) delete ui.sel[id]; else ui.sel[id] = it; return true; }
  function addFoot() {
    var n = nSel();
    ui.foot.hidden = false;
    ui.foot.innerHTML = '<button type="button" class="pk-go" data-commit' + (n ? '' : ' disabled') + '>Add Selected (' + n + ')</button>';
  }
  function commit() {
    var picks = Object.keys(ui.sel).map(function (k) { return { cat: ui.cat.id, item: ui.sel[k] }; }); if (!picks.length) return;
    var btn = ui.foot.querySelector('[data-commit]'); if (btn) btn.disabled = true;
    save(ui.bid, ui.cardId, picks).then(function (r) {
      toast('Added ' + r.added + ' to “' + ui.list.title + '”' + (r.skipped ? ' · ' + r.skipped + ' already there' : ''));
      if (ui.back === 'home') home(ui.bid); else close();
    }).catch(function (e) { toast('✗ ' + e.message); if (btn) btn.disabled = false; });
  }
  function ownSheet() {
    if (!window.MinestKEdit) return;
    var g = ui.cat.kind === 'gallery';
    MinestKEdit.sheet({ title: 'Add my own', ok: 'Add', fields: [{ key: 'title', label: 'Name' }, { key: 'sub', label: g ? (ui.cat.id === 'books' ? 'Author' : 'Year') : 'Note (optional)' }].concat(g ? [{ key: 'img', label: 'My picture (optional)', type: 'image' }] : []) }).then(function (v) {
      if (!v || !String(v.title || '').trim()) return;
      pushOwn({ title: v.title.trim(), sub: (v.sub || '').trim(), img: v.img || '' });
    });
  }
  function pushOwn(o) {
    var t = o.title, it = itemsNow().filter(function (x) { return norm(x.title) === norm(t); })[0];
    if (!it) { it = { id: 'own-' + slug(t), title: t, sub: o.sub || '', tag: o.tag || '', img: o.img || '', own: true }; ui.own.push(it); }
    else if (o.img && !it.own) it = Object.assign({}, it, { img: o.img });
    if (isIn(it)) toast('“' + it.title + '” is already in this list'); else ui.sel[it.id] = it;
    ui.draw && ui.draw();
  }

  // ---------------------------------------------------------------- 16 · Gallery (IMDb-style)
  function gallery(bid, cardId, c, back) {
    if (!startPick(bid, cardId, c, back)) return;
    ui.view = 'gallery'; ui.top.innerHTML = '<p class="pk-sub">Tap ○ to pick · tap the poster to see it</p>'; findBox('Search ' + c.title.toLowerCase());
    ui.draw = function () {
      var list = itemsNow().filter(match);
      ui.body.innerHTML = '<div class="pk-grid">' + list.map(function (it) {
        var inn = isIn(it), on = !!ui.sel[it.id];
        return '<div class="pk-tile' + (on ? ' on' : '') + (inn ? ' in' : '') + '" data-open="' + esc(it.id) + '">' + poster(c, ui.sel[it.id] || it) +
          '<button type="button" class="pk-sel" data-pick="' + esc(it.id) + '" aria-label="' + (inn ? 'Already in the list' : on ? 'Unselect ' : 'Select ') + esc(it.title) + '" aria-pressed="' + on + '">' + ICON.check + '</button>' +
          (imgOf(c, ui.sel[it.id] || it) ? '<p>' + esc(it.title) + (it.sub ? '<small>' + esc(it.sub) + '</small>' : '') + '</p>' : '') + '</div>';
      }).join('') + '<div class="pk-tile own" data-own><span class="pk-art">' + ICON.plus + '<br>Add My Own</span></div></div>';
      addFoot();
    };
    ui.draw();
  }
  function preview(id) {
    var it = itemsNow().filter(function (x) { return x.id === id; })[0]; if (!it) return;
    it = ui.sel[id] || it;
    var key = kiKey(ui.cat.id, it.id), inn = isIn(it), on = !!ui.sel[id];
    var also = placesOf(key).map(function (p) { return p.list + (p.bid !== ui.bid ? ' (' + p.board + ')' : ''); });
    var pv = document.createElement('div'); pv.className = 'pk-pv'; pv.setAttribute('role', 'dialog');
    pv.innerHTML = poster(ui.cat, it) + '<h3>' + esc(it.title) + '</h3><div class="meta">' + esc([it.sub, it.tag].filter(Boolean).join(' · ')) + '</div>' +
      (also.length ? '<div class="also">In: ' + esc(also.join(' · ')) + '</div>' : '') +
      '<div class="row">' + (inn ? '<button type="button" class="pk-go sec" disabled>✓ In this list</button>' : '<button type="button" class="pk-go" style="flex:0 0 auto;padding:0 22px" data-pvpick="' + esc(id) + '">' + (on ? 'Selected ✓' : 'Select') + '</button>') +
      '<button type="button" class="pk-go sec" data-pvimg="' + esc(id) + '">My picture</button><button type="button" class="pk-go sec" data-pvx>Close</button></div>';
    ui.el.appendChild(pv); ui.pv = pv;
    if (pv.animate) pv.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200 });
  }
  function closePv() { if (ui.pv) { ui.pv.remove(); ui.pv = null; } }
  function myPicture(id) {
    var it = itemsNow().filter(function (x) { return x.id === id; })[0]; if (!it || !window.MinestKEdit) return;
    var cur = (ui.sel[id] && ui.sel[id].img) || imgOf(ui.cat, it);
    MinestKEdit.sheet({ title: it.title, text: 'Use your own picture for it.', ok: 'Use', fields: [{ key: 'img', label: 'Picture', type: 'image', value: cur }] }).then(function (v) {
      if (!v) return;
      var key = kiKey(ui.cat.id, it.id), r = KN().get(key);
      if (r) { var r2 = Object.assign({}, r, { at: Date.now() }); if (v.img) r2.img = v.img; else delete r2.img; KN().set(key, r2); }   // the one item: every list that shows it reads this
      var copy = Object.assign({}, it, { img: v.img || '' });
      if (it.own) ui.own = ui.own.map(function (x) { return x.id === id ? copy : x; });
      if (!isIn(it)) ui.sel[id] = copy;
      closePv(); ui.draw && ui.draw(); preview(id);
    });
  }

  // ---------------------------------------------------------------- 17 · Bubbles (Apple Music-style) — plain CSS, no physics
  function bubbles(bid, cardId, c, back) {
    if (!startPick(bid, cardId, c, back)) return;
    ui.view = 'bubble'; ui.top.innerHTML = '<p class="pk-sub">Tap the ones you love · tap again to drop</p>'; findBox('Search ' + c.title.toLowerCase());
    ui.draw = function () {
      var list = itemsNow().filter(match);
      ui.body.innerHTML = '<div class="pk-bub">' + list.map(function (it) {
        var h = hash(it.title), s = 74 + h % 34, inn = isIn(it), on = !!ui.sel[it.id], im = imgOf(c, ui.sel[it.id] || it);
        return '<button type="button" class="pk-bb' + (on ? ' on' : '') + (inn ? ' in' : '') + '" data-bub="' + esc(it.id) + '" style="--s:' + s + 'px" aria-pressed="' + on + '">' +
          '<i style="' + (im ? 'background-image:url(&quot;' + esc(im) + '&quot;)' : 'background:' + look(it)) + '">' + (im ? '' : esc(initials(it.title))) + '</i><span>' + esc(it.title) + '</span></button>';
      }).join('') + '<button type="button" class="pk-bb own" data-own style="--s:80px"><i>' + ICON.plus + '</i><span>Add My Own</span></button></div>';
      addFoot();
    };
    ui.draw();
  }

  // ---------------------------------------------------------------- 18 · Profile (step by step), for a list
  function profile(bid, cardId, c, back) {
    if (!startPick(bid, cardId, c, back)) return;
    ui.view = 'profile'; var steps = (c.steps && c.steps.length ? c.steps : ['']).concat(['__review']); ui.step = 0;
    ui.draw = function () {
      var s = steps[ui.step], last = s === '__review';
      ui.top.innerHTML = '<div class="pk-steps">' + steps.map(function (x, i) { return '<span' + (i <= ui.step ? ' class="on"' : '') + '></span>'; }).join('') + '</div>';
      if (last) {
        var picked = Object.keys(ui.sel).map(function (k) { return ui.sel[k]; });
        ui.body.innerHTML = '<div class="pk-q">Your ' + esc(c.title.toLowerCase()) + '</div><p class="pk-hint">' + (picked.length ? 'These go into “' + esc(ui.list.title) + '”.' : 'Nothing picked yet — go back, or add your own.') + '</p>' +
          '<div class="pk-chips">' + picked.map(function (it) { return '<button type="button" class="pk-chip on" data-chip="' + esc(it.id) + '">' + esc(it.title) + ' ✕</button>'; }).join('') + '</div>' + ownRow('Something else?');
      } else {
        var list = itemsNow().filter(function (it) { return (it.tag || (it.own ? steps[0] : '')) === s; });
        ui.body.innerHTML = '<div class="pk-q">' + esc(s || c.title) + '</div><p class="pk-hint">Pick any that fit you.</p><div class="pk-chips">' + list.map(function (it) {
          var inn = isIn(it), on = !!ui.sel[it.id];
          return '<button type="button" class="pk-chip' + (on ? ' on' : '') + (inn ? ' in' : '') + '" data-chip="' + esc(it.id) + '"' + (inn ? ' aria-disabled="true"' : '') + '>' + (inn ? '✓ ' : '') + esc(it.title) + '</button>';
        }).join('') + '</div>' + ownRow('+ Add My Own');
      }
      ui.foot.hidden = false;
      ui.foot.innerHTML = (ui.step ? '<button type="button" class="pk-go sec" data-prev>Back</button>' : '') +
        (last ? '<button type="button" class="pk-go" data-commit' + (nSel() ? '' : ' disabled') + '>Add Selected (' + nSel() + ')</button>' : '<button type="button" class="pk-go" data-next>Next' + (nSel() ? ' · ' + nSel() : '') + '</button>');
    };
    ui.steps = steps; ui.draw();
  }
  function ownRow(ph) { return '<div class="pk-own"><input data-ownin placeholder="' + esc(ph.replace(/^\+ /, '')) + '" autocomplete="off"><button type="button" data-ownadd>' + ICON.plus + 'Add My Own</button></div>'; }
  function addOwn(inp) {
    var t = String(inp.value || '').trim(); if (!t) { inp.focus(); return; }
    if (ui.view === 'skills') return skillOwn(t);
    var s = ui.steps && ui.steps[ui.step]; pushOwn({ title: t, tag: s && s !== '__review' ? s : '' });
    ui.draw(); var n = ui.body.querySelector('[data-ownin]'); if (n) n.focus();
  }

  // ---------------------------------------------------------------- 18 · Profile for skills: grade → subject → can do → want to learn → review
  function skills(bid, kind, back) {
    shell(); ui.bid = bid; ui.after = null;
    var b = boardById(bid); if (!b) return toast('This world is not here any more.');
    var areas = skillAreas(b).filter(function (a) { return !kind || a.kind === kind; }); if (!areas.length) { toast('No skills in this world yet.'); if (!back) close(); return; }
    kind = kind || areas[0].kind;
    head(kind === 'academic' ? 'My Academic Skills' : 'My Life Skills', back, null);
    ui.view = 'skills'; ui.areas = areas; ui.kind = kind; ui.ownSk = [];
    ui.st = {}; areas.forEach(function (a) { a.skills.forEach(function (x) { ui.st[x.card.id] = x.rec.st || ''; }); });
    ui.st0 = Object.assign({}, ui.st);
    var grades = []; areas.forEach(function (a) { if (a.grade && grades.indexOf(a.grade) < 0) grades.push(a.grade); });
    grades.sort(function (x, y) { return (x === 'K' ? 0 : +x) - (y === 'K' ? 0 : +y); });
    ui.sk = { grades: grades, grade: grades.length === 1 ? grades[0] : null, subs: {} };
    ui.steps = (grades.length > 1 ? ['grade'] : []).concat(['subject', 'can', 'want', '__review']); ui.step = 0;
    ui.draw = drawSkills; drawSkills();
  }
  function areaT(a) { return String(a.title).replace(/^.*·\s*/, '').replace(/^My\s+/, '').replace(/\s+Skills$/, '') || a.title; }
  function gradeT(g) { return g === 'K' ? 'Kindergarten' : 'Grade ' + g; }
  function skArea() { return ui.areas.filter(function (a) { return (!ui.sk.grade || a.grade === ui.sk.grade) && ui.sk.subs[a.col.id]; }); }
  function drawSkills() {
    var s = ui.steps[ui.step], h = '', ok = true;
    ui.top.innerHTML = '<div class="pk-steps">' + ui.steps.map(function (x, i) { return '<span' + (i <= ui.step ? ' class="on"' : '') + '></span>'; }).join('') + '</div>';
    if (s === 'grade') {
      h = '<div class="pk-q">Which grade are you in?</div><p class="pk-hint">You can come back and pick another.</p><div class="pk-chips">' + ui.sk.grades.map(function (g) { return '<button type="button" class="pk-chip' + (ui.sk.grade === g ? ' on' : '') + '" data-grade="' + esc(g) + '">' + esc(gradeT(g)) + '</button>'; }).join('') + '</div>';
      ok = !!ui.sk.grade;
    } else if (s === 'subject') {
      var as = ui.areas.filter(function (a) { return !ui.sk.grade || a.grade === ui.sk.grade; });
      h = '<div class="pk-q">' + (ui.kind === 'academic' ? 'Which subjects?' : 'Which areas?') + '</div><p class="pk-hint">' + (ui.sk.grade ? esc(gradeT(ui.sk.grade)) + ' · ' : '') + 'Pick one or more.</p><div class="pk-chips">' + as.map(function (a) {
        return '<button type="button" class="pk-chip' + (ui.sk.subs[a.col.id] ? ' on' : '') + '" data-sub="' + esc(a.col.id) + '">' + esc(areaT(a)) + ' <small>' + a.skills.length + '</small></button>';
      }).join('') + '</div>';
      ok = skArea().length > 0;
    } else if (s === 'can' || s === 'want') {
      var can = s === 'can';
      h = '<div class="pk-q">' + (can ? 'What can you already do?' : 'What do you want to learn next?') + '</div><p class="pk-hint">' + (can ? 'Tap the skills you can do on your own.' : 'Tap the ones you want to work on. Skills you can do are left out.') + '</p>' +
        skArea().map(function (a) {
          var xs = a.skills.filter(function (x) { return can || ui.st[x.card.id] !== 'can'; }).concat(ui.ownSk.filter(function (o) { return o.colId === a.col.id && (can || o.st !== 'can'); }).map(function (o) { return { own: o }; }));
          if (!xs.length) return '';
          return '<div class="pk-h">' + esc(areaT(a)) + '</div><div class="pk-chips">' + xs.map(function (x) {
            if (x.own) return '<button type="button" class="pk-chip ' + s + (x.own.st === s ? ' on' : '') + '" data-ownsk="' + esc(x.own.title) + '">' + esc(x.own.title) + ' <small>mine</small></button>';
            var v = ui.st[x.card.id];
            return '<button type="button" class="pk-chip ' + s + (v === s ? ' on' : '') + '" data-sk="' + esc(x.card.id) + '">' + esc(x.card.title) + (!can && v === 'learning' ? ' <small>learning</small>' : '') + '</button>';
          }).join('') + '</div>';
        }).join('') + ownRow('A skill of my own');
    } else {
      var ch = { can: [], want: [], learning: [], '': [] };
      Object.keys(ui.st).forEach(function (id) { if (ui.st[id] !== ui.st0[id]) { var x = null; ui.areas.forEach(function (a) { a.skills.forEach(function (y) { if (y.card.id === id) x = y; }); }); if (x) ch[ui.st[id] || ''].push(x.card.title); } });
      ui.ownSk.forEach(function (o) { ch[o.st || ''].push(o.title + ' (mine)'); });
      var blk = function (k, t) { return ch[k].length ? '<div class="pk-sum"><b>' + t + ' · ' + ch[k].length + '</b>' + ch[k].map(esc).join(' · ') + '</div>' : ''; };
      var any = ch.can.length + ch.want.length + ch.learning.length + ch[''].length;
      h = '<div class="pk-q">All set?</div><p class="pk-hint">' + (any ? 'This is your own status — it stays separate from what the Learning Path records.' : 'Nothing changed yet.') + '</p>' + blk('can', 'Can do') + blk('want', 'Want to learn') + blk('learning', 'Learning') + blk('', 'Cleared');
      ui.skAny = any;
    }
    ui.body.innerHTML = h;
    var last = s === '__review';
    ui.foot.hidden = false;
    ui.foot.innerHTML = (ui.step ? '<button type="button" class="pk-go sec" data-prev>Back</button>' : '') +
      (last ? '<button type="button" class="pk-go" data-sksave' + (ui.skAny ? '' : ' disabled') + '>Save</button>' : '<button type="button" class="pk-go" data-next' + (ok ? '' : ' disabled') + '>Next</button>');
  }
  function skillOwn(t) {
    var s = ui.steps[ui.step], a = skArea()[0]; if (!a) return;
    var dup = a.skills.filter(function (x) { return norm(x.card.title) === norm(t); })[0];
    if (dup) { ui.st[dup.card.id] = s === 'can' || s === 'want' ? s : ui.st[dup.card.id]; toast('“' + dup.card.title + '” is already here — picked it'); }
    else if (!ui.ownSk.some(function (o) { return norm(o.title) === norm(t); })) ui.ownSk.push({ title: t, colId: a.col.id, kind: ui.kind, subject: a.subject, grade: a.grade, st: s === 'can' || s === 'want' ? s : 'want' });
    drawSkills(); var n = ui.body.querySelector('[data-ownin]'); if (n) n.focus();
  }

  // ================================================================== clicks
  function onClick(e) {
    var t = e.target;
    if (ui.pv) {
      if (t.closest('[data-pvx]') || t === ui.pv) return closePv();
      var pp = t.closest('[data-pvpick]'); if (pp) { var id0 = pp.getAttribute('data-pvpick'); toggle(id0); closePv(); ui.draw(); return; }
      var pi = t.closest('[data-pvimg]'); if (pi) return myPicture(pi.getAttribute('data-pvimg'));
      return;
    }
    if (t.closest('[data-x]')) return close();
    if (t.closest('[data-back]')) { if (ui.back === 'home') return home(ui.bid); return close(); }
    var fl = t.closest('[data-fill]'); if (fl) return openList(ui.bid, fl.getAttribute('data-fill'), 'home');
    var sk = t.closest('[data-skills]'); if (sk) return skills(ui.bid, sk.getAttribute('data-skills'), 'home');
    var nl = t.closest('[data-newlist]'); if (nl) { var c = cat(nl.getAttribute('data-newlist')); if (c) ensureList(ui.bid, c).then(function (cid) { openList(ui.bid, cid, 'home'); }).catch(function (ex) { toast('✗ ' + ex.message); }); return; }
    if (t.closest('[data-commit]')) return commit();
    if (t.closest('[data-own]')) return ownSheet();
    if (t.closest('[data-ownadd]')) return addOwn(ui.body.querySelector('[data-ownin]'));
    var pk = t.closest('[data-pick]'); if (pk) { e.stopPropagation(); if (toggle(pk.getAttribute('data-pick'))) { var y = ui.body.scrollTop; ui.draw(); ui.body.scrollTop = y; } else toast('Already in this list'); return; }
    var op = t.closest('[data-open]'); if (op) return preview(op.getAttribute('data-open'));
    var bb = t.closest('[data-bub]'); if (bb) { if (!toggle(bb.getAttribute('data-bub'))) return toast('Already in this list'); bb.classList.toggle('on', !!ui.sel[bb.getAttribute('data-bub')]); bb.setAttribute('aria-pressed', !!ui.sel[bb.getAttribute('data-bub')]); addFoot(); return; }
    var ch = t.closest('[data-chip]'); if (ch) { if (toggle(ch.getAttribute('data-chip'))) { var y2 = ui.body.scrollTop; ui.draw(); ui.body.scrollTop = y2; } return; }
    if (t.closest('[data-next]')) { if (ui.step < ui.steps.length - 1) { ui.step++; ui.body.scrollTop = 0; ui.draw(); } return; }
    if (t.closest('[data-prev]')) { if (ui.step > 0) { ui.step--; ui.body.scrollTop = 0; ui.draw(); } return; }
    // skills
    var gr = t.closest('[data-grade]'); if (gr) { var g = gr.getAttribute('data-grade'); if (ui.sk.grade !== g) ui.sk.subs = {}; ui.sk.grade = g; return drawSkills(); }
    var su = t.closest('[data-sub]'); if (su) { var sid = su.getAttribute('data-sub'); ui.sk.subs[sid] = !ui.sk.subs[sid]; if (!ui.sk.subs[sid]) delete ui.sk.subs[sid]; return drawSkills(); }
    var sc = t.closest('[data-sk]'); if (sc) { var cid = sc.getAttribute('data-sk'), st = ui.steps[ui.step]; ui.st[cid] = ui.st[cid] === st ? (ui.st0[cid] !== st ? ui.st0[cid] : '') : st; var y3 = ui.body.scrollTop; drawSkills(); ui.body.scrollTop = y3; return; }
    var os = t.closest('[data-ownsk]'); if (os) { var o = ui.ownSk.filter(function (x) { return x.title === os.getAttribute('data-ownsk'); })[0], st2 = ui.steps[ui.step]; if (o) { if (o.st === st2) ui.ownSk.splice(ui.ownSk.indexOf(o), 1); else o.st = st2; } var y4 = ui.body.scrollTop; drawSkills(); ui.body.scrollTop = y4; return; }
    if (t.closest('[data-sksave]')) {
      var btn = t.closest('[data-sksave]'); btn.disabled = true;
      saveSkills(ui.bid, ui.st, ui.ownSk).then(function (r) {
        toast('Saved · ' + (r.changed + r.made) + ' skill' + (r.changed + r.made === 1 ? '' : 's') + (r.made ? ' (' + r.made + ' of your own)' : ''));
        if (ui.back === 'home') home(ui.bid); else close();
      }).catch(function (ex) { toast('✗ ' + ex.message); btn.disabled = false; });
    }
  }

  // ================================================================== entry points
  function openList(bid, cardId, back, catalog) {
    var b = boardById(bid), L = b && locate(b, cardId); if (!L) return toast('The list is not here any more.');
    var c = (catalog && cat(catalog)) || catFor(L.card.title) || cat('hobbies');   // a starter pack may name its catalog
    (c.kind === 'gallery' ? gallery : c.kind === 'bubble' ? bubbles : profile)(bid, cardId, c, back || null);
  }
  function open(o) {
    o = o || {}; var a = A().board && A().board(), bid = o.bid || (a && a.id); if (!bid) return;
    if (o.cardId) return openList(bid, o.cardId, o.back || null, o.catalog || null);
    if (o.skills) return skills(bid, o.skills === true ? null : o.skills, o.back || null);
    home(bid);
  }

  window.MinestPicker = { open: open, home: home, skills: function (bid, kind) { return skills(bid, kind || null, null); }, close: close, isOpen: function () { return ui.open; },
    save: save, saveSkills: saveSkills, ensureList: ensureList, catalogs: cats, catalogFor: catFor, placesOf: placesOf };
})();
