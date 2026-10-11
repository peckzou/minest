/* Minest Knowledge · Phase 6 — Wiki Portal + Category (after Wikipedia's portals and navigation boxes)
   Portal: the subject's front page — one tile per category group (icon, a line, how many entries).
   Category: a dense navigation box — group column · subcategory column · entries joined by " · ". Groups fold,
   the whole box hides ([hide] / [show]); subcategories can nest (Tertiary → Higher). One entry can sit in several
   categories — it is still one card (categories point at card ids; nothing is copied).
   Preview: hover an entry (mouse) or tap it (touch) for its picture, title and summary — from the card (cover,
   description) or a preview set here; never fetched from Wikipedia. Open → the card details, and back to the same
   place in the page.
   Layouts: Default Wiki (portal + box) and Compact Table (the box alone, tighter).
   Edit: rename / add / delete / reorder groups and subcategories, add entries (any card, so an entry can be in many
   categories), remove an entry from one category, edit an entry's preview, save the structure as a template.
   Data: MinestKnowledge 'wk:tree:<board>' (synced), 'wk:pv:<card>' (preview), 'wk:tpl:<name>'; without a tree a
   board's own lists / section headings / cards make the first one. View state on this device: minest.wiki.v1. */
(function () {
  if (window.MinestWiki) return;
  var KN = function () { return window.MinestKnowledge; };
  var A = function () { return window.MinestAI || {}; };
  var ST_KEY = 'minest.wiki.v1';
  var S = (function () { try { var v = JSON.parse(localStorage.getItem(ST_KEY) || 'null'); if (v && v.b) return v; } catch (e) {} return { b: {} }; })();
  function st() { return S.b[ui.bid] = S.b[ui.bid] || { scroll: 0, fold: {}, hide: false, layout: 'wiki' }; }
  function stSave() { try { localStorage.setItem(ST_KEY, JSON.stringify(S)); } catch (e) {} }
  function boards() { try { return (A().boards && A().boards()) || []; } catch (e) { return []; } }
  function boardById(id) { return boards().filter(function (b) { return b.id === id; })[0] || null; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function toast(m) { try { if (window.GlassUI && GlassUI.toast) GlassUI.toast(m); } catch (e) {} }
  function rid(p) { return p + Date.now().toString(36) + Math.random().toString(36).slice(2, 5); }
  function cssEsc(s) { return window.CSS && CSS.escape ? CSS.escape(s) : String(s).replace(/"/g, '\\"'); }

  // ================================================================== the category tree of a board
  function cardIndex(b) {
    var idx = {};
    (b.columns || []).forEach(function (col) { (col.cards || []).forEach(function (c) { if (c && c.id) { idx[c.id] = { card: c, col: col }; (Array.isArray(c.stack) ? c.stack : []).forEach(function (s) { if (s && s.id) idx[s.id] = { card: s, col: col, parent: c }; }); } }); });
    return idx;
  }
  function defaultTree(b) {
    // lists → groups, section headings → subcategories, cards → entries
    return { title: b.title || 'Categories', portal: { title: b.title || 'Portal', intro: '', areas: [] }, auto: true, groups: (b.columns || []).map(function (col) {
      var g = { id: 'g-' + col.id, title: col.title || 'List', items: [], subs: [] }, cur = null;
      (col.cards || []).forEach(function (c) {
        if (!c || !c.id) return;
        if (KN().isHeading(c.id)) { cur = { id: 's-' + c.id, title: c.title || 'Section', items: [], subs: [] }; g.subs.push(cur); return; }
        (cur || g).items.push(c.id);
      });
      return g;
    }) };
  }
  function treeOf(b) { var t = KN().get('wk:tree:' + b.id); return t && Array.isArray(t.groups) ? JSON.parse(JSON.stringify(t)) : defaultTree(b); }
  function saveTree(t) { delete t.auto; KN().set('wk:tree:' + ui.bid, t); }
  function walk(t, fn) { (function w(list, depth, parent) { list.forEach(function (n, i) { fn(n, depth, parent, i, list); w(n.subs || [], depth + 1, n); }); })(t.groups, 0, null); }
  function findNode(t, id) { var hit = null; walk(t, function (n, d, p, i, list) { if (n.id === id) hit = { node: n, parent: p, list: list, i: i, depth: d }; }); return hit; }
  function countItems(n) { var ids = {}; (function c(x) { (x.items || []).forEach(function (i) { ids[i] = 1; }); (x.subs || []).forEach(c); })(n); return Object.keys(ids).length; }

  // ================================================================== UI
  var ui = { open: false }, T = null, IDX = {}, edit = false;
  var CSS = [
    '.wk{position:fixed;inset:0;z-index:2147482000;display:flex;flex-direction:column;color:#e9edf4;font:15px/1.45 -apple-system,BlinkMacSystemFont,"SF Pro Text",system-ui,sans-serif;-webkit-font-smoothing:antialiased;background:linear-gradient(180deg,#161b26,#0d1017)}',
    '.wk.away{visibility:hidden}',
    '.wk-head{position:relative;padding:calc(env(safe-area-inset-top,0px) + 14px) 16px 10px;border-bottom:1px solid rgba(255,255,255,.07);display:flex;align-items:flex-end;gap:8px;flex-wrap:wrap}',
    '.wk-tb{flex:1 1 100%;border:0;background:none;color:inherit;text-align:left;padding:0 48px 0 0;cursor:pointer;font:inherit;min-width:0}',
    '.wk-tb small{display:block;font-size:12px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;opacity:.5}',
    '.wk-tb b{display:block;font-size:26px;line-height:1.15;font-weight:750;letter-spacing:-.4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.wk-tb b:after{content:" ⌄";font-size:17px;opacity:.45}',
    '.wk-x{position:absolute;right:16px;top:calc(env(safe-area-inset-top,0px) + 18px);width:34px;height:34px;border-radius:50%;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.1);color:#fff;display:grid;place-items:center;cursor:pointer}',
    '.wk-seg{display:inline-flex;padding:3px;border-radius:999px;background:rgba(255,255,255,.07);gap:2px}',
    '.wk-seg button,.wk-hb{height:30px;padding:0 12px;border-radius:999px;border:0;background:none;color:rgba(255,255,255,.7);font:600 13px -apple-system,system-ui,sans-serif;cursor:pointer}',
    '.wk-seg button.on{background:rgba(255,255,255,.16);color:#fff}',
    '.wk-hb{border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.06);color:#fff}',
    '.wk-hb.on{background:#0a84ff;border-color:#0a84ff}',
    '.wk-body{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:14px 12px calc(env(safe-area-inset-bottom,0px) + 40px)}',
    // portal
    '.wk-portal h2{margin:0 2px 2px;font-size:20px;font-weight:750}',
    '.wk-portal p{margin:0 2px 12px;font-size:14px;opacity:.65}',
    '.wk-band{margin:4px 0 10px;padding:6px 12px;border-radius:10px;background:linear-gradient(90deg,#f6b73c,#f59e0b);color:#2a1b00;font-weight:800;text-align:center;font-size:15px;letter-spacing:.3px}',
    '.wk-tiles{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px;margin-bottom:18px}',
    '.wk-tile{display:flex;flex-direction:column;gap:2px;padding:12px;border-radius:16px;background:rgba(255,255,255,.065);border:1px solid rgba(255,255,255,.06);cursor:pointer;text-align:left;color:inherit;font:inherit}',
    '.wk-tile:active{background:rgba(255,255,255,.12)}',
    '.wk-tile i{font-style:normal;font-size:24px}.wk-tile b{font-size:15px;line-height:1.25}.wk-tile small{font-size:12px;opacity:.55}.wk-tile em{font-style:normal;font-size:11.5px;opacity:.45;margin-top:2px}',
    // the navigation box
    '.wk-box{border:1px solid rgba(160,170,255,.28);border-radius:14px;overflow:hidden;background:rgba(255,255,255,.025)}',
    '.wk-boxh{display:flex;align-items:center;gap:8px;padding:8px 12px;background:linear-gradient(180deg,rgba(150,160,255,.32),rgba(120,130,240,.22))}',
    '.wk-boxh b{flex:1;text-align:center;font-size:16px;font-weight:750}',
    '.wk-boxh button{border:0;background:none;color:#b9c3ff;font:600 13px -apple-system,system-ui,sans-serif;cursor:pointer;padding:2px 4px}',
    '.wk-g{display:grid;grid-template-columns:minmax(92px,27%) 1fr;border-top:1px solid rgba(160,170,255,.16)}',
    '.wk-gt{padding:10px 10px;background:rgba(150,160,255,.12);font-weight:750;font-size:14px;display:flex;align-items:center;justify-content:flex-end;text-align:right;gap:6px;cursor:pointer;-webkit-user-select:none;user-select:none}',
    '.wk-gt .tw{font-size:10px;opacity:.6;transition:transform .2s}',
    '.wk-g.fold .wk-gt .tw{transform:rotate(-90deg)}',
    '.wk-g.fold .wk-gb{display:none}',
    '.wk-g.fold .wk-gt:after{content:attr(data-n);font-size:11px;font-weight:600;opacity:.5;margin-left:4px}',
    '.wk-gb{min-width:0}',
    '.wk-r{display:grid;grid-template-columns:minmax(80px,30%) minmax(0,1fr);border-top:1px solid rgba(160,170,255,.1)}',
    '.wk-r:first-child{border-top:0}',
    '.wk-r.full{grid-template-columns:1fr}',
    '.wk-st{padding:8px 10px;background:rgba(150,160,255,.07);font-weight:650;font-size:13.5px;color:#b9c3ff;text-align:right;display:flex;align-items:center;justify-content:flex-end;gap:4px}',
    '.wk-it{padding:8px 10px;min-width:0;font-size:14px;line-height:1.75}',
    '.wk-it .wk-r{border:1px solid rgba(160,170,255,.1);border-radius:8px;margin-top:6px}',
    '.wk-a{color:#8fb4ff;cursor:pointer;text-decoration:none;border-radius:4px;-webkit-tap-highlight-color:transparent;display:inline-block;max-width:100%;overflow-wrap:normal;word-break:normal;line-height:1.45}',
    '.wk-a:hover{text-decoration:underline}',
    '.wk-a.multi:after{content:"⁺";opacity:.55;font-size:11px;margin-left:1px}',
    '.wk-a.hit{background:rgba(10,132,255,.35);color:#fff}',
    '.wk-dot{opacity:.45;margin:0 5px}',
    '.wk-empty{opacity:.4;font-style:italic;font-size:13px}',
    // a phone: the group becomes a header row above its subcategories (three columns do not fit)
    '@media (max-width:600px){.wk-g{grid-template-columns:1fr}.wk-gt{justify-content:flex-start;text-align:left;padding:9px 12px;background:rgba(150,160,255,.16);position:sticky;top:0;z-index:1}.wk-r{grid-template-columns:minmax(76px,32%) minmax(0,1fr)}.wk-it .wk-r{grid-template-columns:minmax(58px,30%) minmax(0,1fr)}}',
    '.wk.compact .wk-portal{display:none}',
    '.wk.compact .wk-it{font-size:13px;line-height:1.6;padding:6px 8px}',
    '.wk.compact .wk-gt{font-size:13px;padding:7px 8px}.wk.compact .wk-st{font-size:12.5px;padding:6px 8px}',
    // edit controls
    '.wk-ed{display:none;gap:2px;flex-wrap:wrap;justify-content:flex-end}',
    '.wk.edit .wk-ed{display:inline-flex}',
    '.wk-ed button{height:24px;min-width:24px;padding:0 6px;border-radius:7px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.08);color:#fff;font:600 11.5px -apple-system,system-ui,sans-serif;cursor:pointer}',
    '.wk.edit .wk-a{padding:1px 3px;background:rgba(255,255,255,.06)}',
    '.wk.edit .wk-a:after{content:" ✕";color:#ff8a80;font-size:11px}',
    '.wk-add{display:none;margin-left:6px}',
    '.wk.edit .wk-add{display:inline}',
    '.wk-tools{display:none;gap:6px;flex-wrap:wrap;margin:12px 0 0}',
    '.wk.edit .wk-tools{display:flex}',
    '.wk-tools button{height:34px;padding:0 12px;border-radius:999px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.08);color:#fff;font:600 13px -apple-system,system-ui,sans-serif;cursor:pointer}',
    // preview
    '.wk-pv{position:fixed;z-index:2147482004;width:min(320px,calc(100vw - 20px));border-radius:16px;overflow:hidden;background:#1d2330;border:1px solid rgba(255,255,255,.14);box-shadow:0 24px 60px rgba(0,0,0,.55);color:#eef1f6;font:14px/1.5 -apple-system,system-ui,sans-serif}',
    '.wk-pv img{display:block;width:100%;height:150px;object-fit:cover;background:#2a3140}',
    '.wk-pv .in{padding:12px 14px 12px}',
    '.wk-pv b{font-size:16px}',
    '.wk-pv p{margin:6px 0 0;display:-webkit-box;-webkit-line-clamp:6;-webkit-box-orient:vertical;overflow:hidden;opacity:.85}',
    '.wk-pv .cats{margin-top:8px;font-size:12px;opacity:.55}',
    '.wk-pv .acts{display:flex;gap:6px;margin-top:10px;flex-wrap:wrap}',
    '.wk-pv .acts button{height:34px;padding:0 14px;border-radius:999px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.08);color:#fff;font:600 13px -apple-system,system-ui,sans-serif;cursor:pointer}',
    '.wk-pv .acts button.pri{background:#0a84ff;border-color:#0a84ff}',
    '.wk-sheet{position:fixed;left:50%;bottom:calc(env(safe-area-inset-bottom,0px) + 12px);transform:translateX(-50%);z-index:2147482005;width:min(440px,calc(100vw - 20px));max-height:70dvh;display:flex;flex-direction:column;padding:14px;border-radius:22px;background:linear-gradient(180deg,rgba(60,70,88,.98),rgba(26,32,44,.99));border:1px solid rgba(255,255,255,.14);box-shadow:0 24px 60px rgba(0,0,0,.5);color:#fff;font:15px -apple-system,system-ui,sans-serif}',
    '.wk-sheet h4{margin:0 0 8px;font-size:17px}',
    '.wk-sheet input{height:40px;border-radius:12px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.08);color:#fff;font:15px -apple-system,system-ui,sans-serif;padding:0 12px;margin-bottom:8px}',
    '.wk-sheet .list{overflow:auto;flex:1;min-height:0}',
    '.wk-sheet label{display:flex;align-items:center;gap:10px;min-height:40px;border-top:1px solid rgba(255,255,255,.06);font-size:14.5px}',
    '.wk-sheet label input{width:20px;height:20px;margin:0;accent-color:#0a84ff}',
    '.wk-sheet .row{display:flex;gap:8px;margin-top:10px}',
    '.wk-sheet .row button{flex:1;height:40px;border-radius:999px;border:0;background:rgba(255,255,255,.1);color:#fff;font:600 14px -apple-system,system-ui,sans-serif;cursor:pointer}',
    '.wk-sheet .row button.pri{background:#0a84ff}',
    'html.kn-open #minest-mini-pet-p0,html.kn-open .mpet-menu,html.kn-open .mpet-say,html.kn-open .mpet-tip{display:none!important}'
  ].join('\n');
  function ensureCss() { if (document.getElementById('wk-css')) return; var s = document.createElement('style'); s.id = 'wk-css'; s.textContent = CSS; document.head.appendChild(s); }

  var usage = {};
  function itemHtml(id, nodeId) {
    var x = IDX[id];
    if (!x) return '';
    return '<a class="wk-a' + (usage[id] > 1 ? ' multi' : '') + '" data-item="' + esc(id) + '" data-node="' + esc(nodeId) + '" title="' + (usage[id] > 1 ? 'In ' + usage[id] + ' categories' : '') + '">' + esc(x.card.title || 'Untitled') + '</a>';
  }
  function itemsHtml(n) {
    var parts = (n.items || []).filter(function (id) { return IDX[id]; }).map(function (id) { return itemHtml(id, n.id); });
    return (parts.length ? parts.join('<span class="wk-dot">·</span>') : (edit ? '<span class="wk-empty">No entries yet</span>' : '')) +
      '<span class="wk-add"><span class="wk-ed"><button type="button" data-addto="' + esc(n.id) + '">＋ Entries</button></span></span>';
  }
  function ctl(n, isGroup) {
    return '<span class="wk-ed"><button type="button" data-ren="' + esc(n.id) + '" title="Rename">✎</button><button type="button" data-up="' + esc(n.id) + '" title="Move up">↑</button><button type="button" data-down="' + esc(n.id) + '" title="Move down">↓</button><button type="button" data-sub="' + esc(n.id) + '" title="Add a subcategory">＋</button><button type="button" data-del="' + esc(n.id) + '" title="Delete">✕</button></span>';
  }
  function subRows(n) {
    var h = '';
    if ((n.items || []).length || edit || !(n.subs || []).length) h += '<div class="wk-r full"><div class="wk-it">' + itemsHtml(n) + '</div></div>';
    (n.subs || []).forEach(function (s) {
      h += '<div class="wk-r" data-sub-id="' + esc(s.id) + '"><div class="wk-st">' + esc(s.title) + ctl(s) + '</div><div class="wk-it">' +
        ((s.items || []).length || edit || !(s.subs || []).length ? itemsHtml(s) : '') +
        (s.subs || []).map(function (ss) { return '<div class="wk-r"><div class="wk-st">' + esc(ss.title) + ctl(ss) + '</div><div class="wk-it">' + itemsHtml(ss) + subDeep(ss) + '</div></div>'; }).join('') + '</div></div>';
    });
    return h;
  }
  function subDeep(n) { return (n.subs || []).map(function (s) { return '<div class="wk-r"><div class="wk-st">' + esc(s.title) + ctl(s) + '</div><div class="wk-it">' + itemsHtml(s) + subDeep(s) + '</div></div>'; }).join(''); }
  function render() {
    if (!ui.el) return;
    var b = boardById(ui.bid); if (!b) return;
    T = treeOf(b); IDX = cardIndex(b); usage = {};
    walk(T, function (n) { (n.items || []).forEach(function (id) { usage[id] = (usage[id] || 0) + 1; }); });
    var s = st();
    ui.el.classList.toggle('compact', s.layout === 'compact');
    ui.title.textContent = (T.portal && T.portal.title) || b.title || 'Portal';
    ui.seg.querySelectorAll('[data-layout]').forEach(function (x) { x.classList.toggle('on', x.getAttribute('data-layout') === s.layout); });
    var areas = {}; ((T.portal || {}).areas || []).forEach(function (a) { areas[a.group] = a; });
    var portal = '<div class="wk-portal">' + ((T.portal || {}).intro ? '<p>' + esc(T.portal.intro) + '</p>' : '') + '<div class="wk-band">Topics</div><div class="wk-tiles">' +
      T.groups.map(function (g) { var a = areas[g.id] || {}; return '<button type="button" class="wk-tile" data-goto="' + esc(g.id) + '"><i>' + esc(a.icon || g.icon || '📂') + '</i><b>' + esc(g.title) + '</b>' + (a.desc ? '<small>' + esc(a.desc) + '</small>' : '') + '<em>' + countItems(g) + ' entries' + ((g.subs || []).length ? ' · ' + g.subs.length + ' subcategories' : '') + '</em></button>'; }).join('') + '</div></div>';
    var box = '<div class="wk-box"><div class="wk-boxh"><span style="width:44px"></span><b>' + esc(T.title || 'Categories') + '</b><button type="button" data-hide>' + (s.hide ? '[show]' : '[hide]') + '</button></div>' +
      (s.hide ? '' : T.groups.map(function (g) {
        var fold = s.fold[g.id];
        return '<div class="wk-g' + (fold ? ' fold' : '') + '" data-g="' + esc(g.id) + '"><div class="wk-gt" data-fold="' + esc(g.id) + '" data-n="(' + countItems(g) + ')"><span class="tw">▼</span>' + esc(g.title) + ctl(g, true) + '</div><div class="wk-gb">' + subRows(g) + '</div></div>';
      }).join('')) + '</div>';
    var tools = '<div class="wk-tools"><button type="button" data-addgroup>＋ Category group</button><button type="button" data-savetpl>Save as template</button>' + (KN().keys('wk:tpl:').length ? '<button type="button" data-usetpl>Use a template…</button>' : '') + (T.auto ? '' : '<button type="button" data-rebuild>↺ Rebuild from the board</button>') + '</div>';
    ui.list.innerHTML = portal + box + tools;
  }

  // ---------------------------------------------------------------- preview
  var pv = null, pvTimer = 0, fine = window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches;
  function closePv() { clearTimeout(pvTimer); if (pv) { pv.remove(); pv = null; } }
  function preview(a, sticky) {
    closePv();
    var id = a.getAttribute('data-item'), x = IDX[id]; if (!x) return;
    var o = KN().get('wk:pv:' + id) || {}, img = o.image || (x.card.cover && x.card.cover.type === 'image' && x.card.cover.url) || '';
    var desc = o.desc || x.card.desc || '';
    var cats = []; walk(T, function (n) { if ((n.items || []).indexOf(id) >= 0) cats.push(n.title); });
    pv = document.createElement('div'); pv.className = 'wk-pv'; pv.setAttribute('role', 'dialog');
    pv.innerHTML = (img ? '<img alt="" src="' + esc(img) + '">' : '') + '<div class="in"><b>' + esc(x.card.title) + '</b>' + (desc ? '<p>' + esc(desc) + '</p>' : '<p style="opacity:.5">No summary yet.</p>') +
      (cats.length > 1 ? '<div class="cats">In: ' + esc(cats.join(' · ')) + '</div>' : '') +
      (sticky ? '<div class="acts"><button type="button" class="pri" data-pvopen>Open</button><button type="button" data-pvboard>On the board</button>' + (edit ? '<button type="button" data-pvedit>Edit preview</button>' : '') + '</div>' : '') + '</div>';
    pv.__id = id;
    document.body.appendChild(pv);
    var r = a.getBoundingClientRect(), w = pv.offsetWidth, h = pv.offsetHeight;
    var left = Math.max(10, Math.min(innerWidth - w - 10, r.left + r.width / 2 - w / 2)), top = r.bottom + 8;
    if (top + h > innerHeight - 10) top = Math.max(10, r.top - h - 8);
    pv.style.left = left + 'px'; pv.style.top = top + 'px';
    if (pv.animate) pv.animate([{ opacity: 0, translate: '0 6px' }, { opacity: 1, translate: '0 0' }], { duration: 160, easing: 'ease-out' });
    ['pointerdown', 'touchstart'].forEach(function (ev) { pv.addEventListener(ev, function (e) { e.stopPropagation(); }, { passive: true }); });
    pv.addEventListener('click', function (e) {
      if (e.target.closest('[data-pvopen]')) { closePv(); return details(id); }
      if (e.target.closest('[data-pvboard]')) { closePv(); return onBoard(id); }
      if (e.target.closest('[data-pvedit]')) { closePv(); return editPreview(id); }
    });
  }

  // ---------------------------------------------------------------- details / board, and back to the same place
  function keep() { if (ui.list) { st().scroll = ui.list.scrollTop; stSave(); } }
  function details(id) {
    var x = IDX[id]; if (!x || !A().openCardIn) return;
    keep(); ui.el.classList.add('away'); ui.lastItem = id;
    A().openCardIn(ui.bid, x.col.id, id);
    var t0 = Date.now(), seen = false, gone = 0;
    var modal = function () { return document.querySelector('.mn-dm, .mn-cardsheet, .fixed.inset-0.z-50 .rounded-3xl'); };
    var iv = setInterval(function () {
      if (modal()) { seen = true; gone = 0; return; }
      if (seen) gone++;
      if ((seen && gone >= 2) || (!seen && Date.now() - t0 > 2500)) { clearInterval(iv); if (!ui.el) return; ui.el.classList.remove('away'); render(); ui.list.scrollTop = st().scroll || 0; lit(id); }
    }, 250);
  }
  function lit(id) { var a = ui.list.querySelector('.wk-a[data-item="' + cssEsc(id) + '"]'); if (a) { a.classList.add('hit'); setTimeout(function () { a.classList.remove('hit'); }, 1600); } }
  function onBoard(id) {
    var x = IDX[id]; if (!x) return;
    keep(); var bid = ui.bid; close();
    if (window.MinestContents && MinestContents.goTo) MinestContents.goTo({ b: bid, l: x.col.id, c: id, p: x.parent ? x.parent.id : null }, { label: 'Wiki', open: function () { open(bid); setTimeout(function () { lit(id); }, 150); } });
  }

  // ---------------------------------------------------------------- editing
  var sheet = null;
  function closeSheet() { if (sheet) { sheet.remove(); sheet = null; } }
  function mkSheet(h) {
    closeSheet(); sheet = document.createElement('div'); sheet.className = 'wk-sheet'; sheet.innerHTML = h; document.body.appendChild(sheet);
    ['pointerdown', 'touchstart'].forEach(function (ev) { sheet.addEventListener(ev, function (e) { e.stopPropagation(); }, { passive: true }); });
    if (sheet.animate) sheet.animate([{ opacity: 0, translate: '0 24px' }, { opacity: 1, translate: '0 0' }], { duration: 240, easing: 'cubic-bezier(.2,.85,.25,1)' });
    return sheet;
  }
  function pickEntries(nodeId) {
    var hit = findNode(T, nodeId); if (!hit) return;
    var cur = {}; (hit.node.items || []).forEach(function (id) { cur[id] = 1; });
    var all = Object.keys(IDX).filter(function (id) { return !KN().isHeading(id) && !IDX[id].parent; });
    var sh = mkSheet('<h4>Entries in “' + esc(hit.node.title) + '”</h4><input type="search" placeholder="Search cards" data-q><div class="list">' +
      all.map(function (id) { return '<label data-t="' + esc((IDX[id].card.title || '').toLowerCase()) + '"><input type="checkbox" value="' + esc(id) + '"' + (cur[id] ? ' checked' : '') + '>' + esc(IDX[id].card.title) + (usage[id] && !cur[id] ? ' <span style="opacity:.45;font-size:12px">· in ' + usage[id] + '</span>' : '') + '</label>'; }).join('') +
      '</div><div class="row"><button type="button" data-no>Cancel</button><button type="button" class="pri" data-ok>Done</button></div>');
    sh.querySelector('[data-q]').addEventListener('input', function (e) { var q = e.target.value.toLowerCase(); sh.querySelectorAll('label').forEach(function (l) { l.style.display = l.getAttribute('data-t').indexOf(q) >= 0 ? '' : 'none'; }); });
    sh.addEventListener('click', function (e) {
      if (e.target.closest('[data-no]')) return closeSheet();
      if (!e.target.closest('[data-ok]')) return;
      var chosen = [].slice.call(sh.querySelectorAll('input[type=checkbox]')).filter(function (c) { return c.checked; }).map(function (c) { return c.value; });
      // keep the existing order, add new ones at the end
      hit.node.items = (hit.node.items || []).filter(function (id) { return chosen.indexOf(id) >= 0; }).concat(chosen.filter(function (id) { return !cur[id]; }));
      saveTree(T); closeSheet(); render();
    });
  }
  function editPreview(id) {
    var o = KN().get('wk:pv:' + id) || {}, x = IDX[id];
    var sh = mkSheet('<h4>Preview · ' + esc(x.card.title) + '</h4><input data-desc placeholder="Summary (empty = the card’s description)" value="' + esc(o.desc || '') + '"><input data-img placeholder="Picture URL (empty = the card’s cover)" value="' + esc(o.image || '') + '"><div class="row"><button type="button" data-no>Cancel</button><button type="button" class="pri" data-ok>Save</button></div>');
    sh.addEventListener('click', function (e) {
      if (e.target.closest('[data-no]')) return closeSheet();
      if (!e.target.closest('[data-ok]')) return;
      var d = sh.querySelector('[data-desc]').value.trim(), im = sh.querySelector('[data-img]').value.trim();
      KN().set('wk:pv:' + id, d || im ? { desc: d, image: im } : null); closeSheet(); toast('Preview saved');
    });
  }
  function onEditClick(t) {
    var id;
    if ((id = attr(t, 'data-addto'))) return pickEntries(id), true;
    if ((id = attr(t, 'data-ren'))) { var h = findNode(T, id), nm = prompt('Name', h.node.title); if (nm && nm.trim()) { h.node.title = nm.trim(); saveTree(T); render(); } return true; }
    if ((id = attr(t, 'data-del'))) { var h2 = findNode(T, id); if (confirm('Delete the category “' + h2.node.title + '”? (Its entries stay on the board.)')) { h2.list.splice(h2.i, 1); saveTree(T); render(); } return true; }
    if ((id = attr(t, 'data-up')) || (id = attr(t, 'data-down'))) { var h3 = findNode(T, id), j = h3.i + (attr(t, 'data-up') ? -1 : 1); if (j >= 0 && j < h3.list.length) { h3.list.splice(j, 0, h3.list.splice(h3.i, 1)[0]); saveTree(T); render(); } return true; }
    if ((id = attr(t, 'data-sub'))) { var h4 = findNode(T, id), nm2 = prompt('New subcategory in “' + h4.node.title + '”'); if (nm2 && nm2.trim()) { (h4.node.subs = h4.node.subs || []).push({ id: rid('s-'), title: nm2.trim(), items: [], subs: [] }); saveTree(T); render(); } return true; }
    if (t.closest('[data-addgroup]')) { var nm3 = prompt('New category group (e.g. “By location”)'); if (nm3 && nm3.trim()) { T.groups.push({ id: rid('g-'), title: nm3.trim(), items: [], subs: [] }); saveTree(T); render(); } return true; }
    if (t.closest('[data-savetpl]')) { var nm4 = prompt('Template name', T.title || 'My categories'); if (nm4 && nm4.trim()) { var skel = JSON.parse(JSON.stringify(T)); walk(skel, function (n) { n.items = []; }); KN().set('wk:tpl:' + nm4.trim(), { title: skel.title, groups: skel.groups }); toast('Saved the template “' + nm4.trim() + '”'); render(); } return true; }
    if (t.closest('[data-usetpl]')) {
      var names = KN().keys('wk:tpl:').map(function (k) { return k.slice(7); });
      var sh = mkSheet('<h4>Use a template</h4><div class="list">' + names.map(function (n) { return '<label><input type="radio" name="tpl" value="' + esc(n) + '">' + esc(n) + '</label>'; }).join('') + '</div><div class="row"><button type="button" data-no>Cancel</button><button type="button" class="pri" data-ok>Add its categories</button></div>');
      sh.addEventListener('click', function (e) {
        if (e.target.closest('[data-no]')) return closeSheet();
        if (!e.target.closest('[data-ok]')) return;
        var r = sh.querySelector('input:checked'); if (!r) return;
        var tp = KN().get('wk:tpl:' + r.value); if (!tp) return;
        var have = {}; T.groups.forEach(function (g) { have[g.title] = 1; });
        JSON.parse(JSON.stringify(tp.groups)).forEach(function (g) { if (!have[g.title]) { walk({ groups: [g] }, function (n) { n.id = rid('g-'); }); T.groups.push(g); } });
        saveTree(T); closeSheet(); render();
      });
      return true;
    }
    if (t.closest('[data-rebuild]')) { if (confirm('Rebuild the categories from the board’s lists and sections? Your category edits are replaced.')) { KN().set('wk:tree:' + ui.bid, null); render(); } return true; }
    return false;
  }
  function attr(t, a) { var e = t.closest('[' + a + ']'); return e ? e.getAttribute(a) : null; }

  // ---------------------------------------------------------------- open / close
  function open(boardId, tries) {
    if (ui.open) return;
    if (boardId && !boardById(boardId) && (tries || 0) < 40) return setTimeout(function () { open(boardId, (tries || 0) + 1); }, 50);
    ensureCss();
    var a = A().board && A().board();
    ui.bid = boardId || (a && a.id) || (boards()[0] || {}).id;
    if (!ui.bid) return toast('No board yet.');
    var el = document.createElement('div'); el.className = 'wk'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Wiki Portal');
    el.innerHTML = '<div class="wk-head"><button type="button" class="wk-tb" data-boards><small>Portal</small><b></b></button>' +
      '<button type="button" class="wk-x" data-x aria-label="Close"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg></button>' +
      '<span class="wk-seg"><button type="button" data-layout="wiki">Wiki</button><button type="button" data-layout="compact">Compact</button></span><button type="button" class="wk-hb" data-edit>✎ Edit</button></div><div class="wk-body"></div>';
    ui.el = el; ui.list = el.querySelector('.wk-body'); ui.title = el.querySelector('.wk-tb b'); ui.seg = el.querySelector('.wk-seg'); ui.open = true; edit = false;
    document.body.appendChild(el); document.documentElement.classList.add('kn-open');
    render(); ui.list.scrollTop = st().scroll || 0;
    if (el.animate) el.animate([{ opacity: 0, scale: '.97' }, { opacity: 1, scale: '1' }], { duration: 260, easing: 'cubic-bezier(.2,.85,.25,1)' });
    wire(el);
  }
  function close() {
    if (!ui.open) return;
    keep(); closePv(); closeSheet();
    var el = ui.el; ui.open = false; ui.el = null; document.documentElement.classList.remove('kn-open');
    var m = document.querySelector('.wk-menu'); if (m) m.remove();
    if (el.animate) { var an = el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 180, fill: 'forwards' }); an.onfinish = function () { el.remove(); }; } else el.remove();
  }
  function boardMenu(anchor) {
    var old = document.querySelector('.wk-menu'); if (old) { old.remove(); return; }
    var m = document.createElement('div'); m.className = 'en-menu wk-menu';
    m.innerHTML = boards().filter(function (b) { return !b.archived; }).map(function (b) { return '<button type="button" data-b="' + esc(b.id) + '"' + (b.id === ui.bid ? ' class="on"' : '') + '>' + esc(b.title || 'Board') + '</button>'; }).join('');
    document.body.appendChild(m);
    var r = anchor.getBoundingClientRect(); m.style.left = Math.max(10, r.left) + 'px'; m.style.top = (r.bottom + 8) + 'px';
    m.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
    m.addEventListener('click', function (e) { var b = e.target.closest('[data-b]'); if (!b) return; m.remove(); keep(); ui.bid = b.getAttribute('data-b'); render(); ui.list.scrollTop = st().scroll || 0; });
  }
  function wire(el) {
    ['pointerdown', 'touchstart', 'touchmove', 'wheel'].forEach(function (ev) { el.addEventListener(ev, function (e) { e.stopPropagation(); }, { passive: true }); });
    el.addEventListener('pointerdown', function (e) { if (pv && !pv.contains(e.target) && !e.target.closest('.wk-a')) closePv(); if (sheet && !sheet.contains(e.target)) closeSheet(); });
    ui.list.addEventListener('scroll', function () { if (pv && !fine) closePv(); }, { passive: true });
    // mouse: preview on hover; touch: preview on tap (with Open)
    el.addEventListener('mouseover', function (e) { if (!fine || edit) return; var a = e.target.closest('.wk-a'); if (!a) return; clearTimeout(pvTimer); pvTimer = setTimeout(function () { preview(a, false); }, 350); });
    el.addEventListener('mouseout', function (e) { if (!fine) return; var a = e.target.closest('.wk-a'); if (a && !(e.relatedTarget && a.contains(e.relatedTarget))) { clearTimeout(pvTimer); if (pv && !pv.matches(':hover')) closePv(); } });
    el.addEventListener('click', function (e) {
      var t = e.target;
      if (t.closest('[data-x]')) return close();
      if (t.closest('[data-boards]')) return boardMenu(t.closest('[data-boards]'));
      var ly = attr(t, 'data-layout'); if (ly) { st().layout = ly; stSave(); return render(); }
      if (t.closest('[data-edit]')) { edit = !edit; t.closest('[data-edit]').classList.toggle('on', edit); el.classList.toggle('edit', edit); closePv(); return render(); }
      if (t.closest('[data-hide]')) { st().hide = !st().hide; stSave(); return render(); }
      if (edit && onEditClick(t)) return;
      var a = t.closest('.wk-a');
      if (a) {
        e.preventDefault();
        if (edit) { var h = findNode(T, a.getAttribute('data-node')); if (h) { h.node.items = h.node.items.filter(function (x) { return x !== a.getAttribute('data-item'); }); saveTree(T); render(); } return; }
        if (fine) { closePv(); return details(a.getAttribute('data-item')); }
        if (pv && pv.__id === a.getAttribute('data-item')) return closePv();
        return preview(a, true);
      }
      var go = attr(t, 'data-goto'); if (go) { st().fold[go] = false; st().hide = false; stSave(); render(); var g = ui.list.querySelector('.wk-g[data-g="' + cssEsc(go) + '"]'); if (g) { var lr = ui.list.getBoundingClientRect(), gr = g.getBoundingClientRect(); ui.list.scrollTo({ top: ui.list.scrollTop + gr.top - lr.top - 8, behavior: 'smooth' }); setTimeout(function () { if (Math.abs(g.getBoundingClientRect().top - lr.top - 8) > 6) ui.list.scrollTop += g.getBoundingClientRect().top - lr.top - 8; }, 650); } return; }
      var f = t.closest('[data-fold]'); if (f && !t.closest('.wk-ed')) { var id = f.getAttribute('data-fold'); st().fold[id] = !st().fold[id]; stSave(); f.parentNode.classList.toggle('fold', !!st().fold[id]); return; }
    });
  }
  if (KN() && KN().onChange) KN().onChange(function () { if (ui.open && !ui.el.classList.contains('away') && !sheet) { var y = ui.list.scrollTop; render(); ui.list.scrollTop = y; } });

  window.MinestWiki = { open: open, close: close, toggle: function () { if (ui.open) close(); else open(); }, isOpen: function () { return ui.open; },
    _tree: function () { return T; }, _preview: function (id, sticky) { var a = ui.list.querySelector('.wk-a[data-item="' + cssEsc(id) + '"]'); if (a) preview(a, sticky); return !!a; } };
})();
