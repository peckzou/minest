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
   board's own lists / section headings / cards make the first one. View state on this device: minest.wiki.v1.
   Course portal (the learning atlas): a course = several boards, one per subject ('wk:course:<id>' = {title, intro,
   boards: [{b, icon, desc}]}) — made from existing boards, or by a "course" JSON. Course → subject → skills / categories
   → topics → entries. Every entry shows its learning state, read from the one Learning Path record (card.learn via
   MinestLearn.cardStatus): not started (plain ink) · viewed (opened — grey) · learning (blue) · mastered (green ✓) ·
   needs review (a red dot). Opening a card only ever makes it "viewed" ('sn:<card>'); nothing here sets mastery. */
(function () {
  if (window.MinestWiki) return;
  var KN = function () { return window.MinestKnowledge; };
  var A = function () { return window.MinestAI || {}; };
  var ST_KEY = 'minest.wiki.v1';
  var S = (function () { try { var v = JSON.parse(localStorage.getItem(ST_KEY) || 'null'); if (v && v.b) return v; } catch (e) {} return { b: {} }; })();
  function st() { var k = ui.course ? 'c:' + ui.course : ui.bid; return S.b[k] = S.b[k] || { scroll: 0, fold: {}, hide: false, layout: 'wiki' }; }
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
  function nodeIds(n) { var ids = {}, out = []; (function c(x) { (x.items || []).forEach(function (i) { if (!ids[i]) { ids[i] = 1; out.push(i); } }); (x.subs || []).forEach(c); })(n); return out; }
  function treeIds(t) { var ids = {}, out = []; t.groups.forEach(function (g) { nodeIds(g).forEach(function (i) { if (!ids[i]) { ids[i] = 1; out.push(i); } }); }); return out; }
  function courses() { return KN().keys('wk:course:').map(function (k) { return KN().get(k); }).filter(function (c) { return c && c.id && Array.isArray(c.boards); }); }
  function courseById(id) { var c = id && KN().get('wk:course:' + id); return c && Array.isArray(c.boards) ? c : null; }

  // ================================================================== learning state (read only)
  // from the Learning Path's record (card.learn → MinestLearn.cardStatus); "viewed" = its details were opened
  var SC = {};
  function stateOf(card, col) {
    if (SC[card.id]) return SC[card.id];
    var s = null; try { if (window.MinestLearn && MinestLearn.cardStatus) s = MinestLearn.cardStatus(card, col); } catch (e) {}
    var k = s && s.mastered ? 'done' : s && s.studied ? 'learn' : (KN().seenAt && KN().seenAt(card.id)) ? 'seen' : 'new';
    return (SC[card.id] = { k: k, rv: !!(s && s.due), m: s ? s.mastery || 0 : 0 });
  }
  var SNAME = { 'new': 'Not started', seen: 'Viewed', learn: 'Learning', done: 'Mastered' };
  function tally(ids, idx) {
    var t = { n: 0, done: 0, learn: 0, seen: 0, rv: 0 };
    ids.forEach(function (id) { var x = idx[id]; if (!x) return; var s = stateOf(x.card, x.col); t.n++; if (s.k !== 'new') t[s.k]++; if (s.rv) t.rv++; });
    return t;
  }
  function add(a, b) { ['n', 'done', 'learn', 'seen', 'rv'].forEach(function (k) { a[k] += b[k]; }); return a; }
  function bar(t) { if (!t.n) return ''; var p = function (v) { return (v / t.n * 100).toFixed(2) + '%'; }; return '<span class="wk-bar"><i class="ok" style="width:' + p(t.done) + '"></i><i class="ln" style="width:' + p(t.learn) + '"></i><i class="sn" style="width:' + p(t.seen) + '"></i></span>'; }
  function frac(t) { return '<span class="wk-fr">✓ ' + t.done + '/' + t.n + (t.rv ? ' · <span class="rv">' + t.rv + ' to review</span>' : '') + '</span>'; }
  function legend() { return '<div class="wk-leg"><span>Not started</span><span class="s-seen">Viewed</span><span class="s-learn">Learning</span><span class="s-done">Mastered</span><span>Needs review<i class="wk-rv"></i></span></div>'; }
  function countItems(n) { var ids = {}; (function c(x) { (x.items || []).forEach(function (i) { ids[i] = 1; }); (x.subs || []).forEach(c); })(n); return Object.keys(ids).length; }

  // ================================================================== UI
  var ui = { open: false }, T = null, IDX = {}, edit = false;
  var CSS = [
    '.wk,.wk-pv,.wk-sheet{--ink:#eef1f6;--seen:rgba(233,237,244,.46);--acc:#7fb0ff;--ok:#4ade80;--bad:#ff6b6b;--trk:rgba(255,255,255,.1);--g1:rgba(255,255,255,.13);--g2:rgba(255,255,255,.05);--gb:rgba(255,255,255,.16);--rim:inset 0 1px 0 rgba(255,255,255,.22),inset 0 -1px 0 rgba(255,255,255,.04);--hair:rgba(255,255,255,.08);--tint:rgba(255,255,255,.06);--lab:rgba(238,241,246,.72)}',
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
    '.wk-fs{width:36px;padding:0!important;display:inline-grid;place-items:center}',
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
    '.wk-a{color:var(--ink);cursor:pointer;text-decoration:none;border-radius:4px;-webkit-tap-highlight-color:transparent;display:inline-block;max-width:100%;overflow-wrap:normal;word-break:normal;line-height:1.45}',
    '.wk-a:hover{text-decoration:underline}',
    '.wk-a.multi:after{content:"⁺";opacity:.55;font-size:11px;margin-left:1px}',
    '.wk-a.hit{background:rgba(10,132,255,.35);color:#fff}',
    '.wk-dot{opacity:.45;margin:0 5px}',
    // learning state: not started = plain ink · viewed = grey · learning = blue · mastered = green ✓ · review = red dot
    '.wk .s-seen,.wk-pv .s-seen{color:var(--seen)}',
    '.wk .s-learn,.wk-pv .s-learn{color:var(--acc)}',
    '.wk .s-done,.wk-pv .s-done{color:var(--ok);font-weight:600}',
    '.wk .s-done:before,.wk-pv .s-done:before{content:"✓";font-weight:800;margin-right:3px}',
    '.wk-rv{display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--bad);margin:0 0 0 3px;vertical-align:.45em}',
    '.wk-leg{display:flex;flex-wrap:wrap;gap:4px 14px;margin:0 2px 12px;font-size:12.5px}',
    '.wk-leg span{white-space:nowrap}',
    '.wk-bar{display:flex;height:4px;border-radius:2px;overflow:hidden;background:var(--trk);margin-top:6px;width:100%}',
    '.wk-bar i{display:block;height:100%}.wk-bar .ok{background:var(--ok)}.wk-bar .ln{background:var(--acc)}.wk-bar .sn{background:var(--seen);opacity:.6}',
    '.wk-fr{font-size:11.5px;font-weight:650;font-variant-numeric:tabular-nums;opacity:.8;white-space:nowrap}',
    '.wk-fr .rv{color:var(--bad);font-weight:650}',
    '.wk-gt .wk-gp{margin-left:auto;display:flex;flex-direction:column;align-items:flex-end;min-width:64px;font-weight:600}',
    '.wk-gt .wk-gp .wk-bar{margin-top:3px;width:64px}',
    '.wk-st small,.wk-tp small{font-size:11px;font-weight:600;opacity:.6;margin-left:4px;font-variant-numeric:tabular-nums}',
    '.wk-sum{margin:0 2px 14px;padding:12px 14px;border-radius:16px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.06)}',
    '.wk-sum b{font-size:14px}.wk-sum .wk-fr{margin-left:8px}',
    '.wk-tp{color:var(--ink);cursor:pointer;display:inline-block;font-weight:600}',
    '.wk-tp:hover{text-decoration:underline}',
    '.wk-boxh .wk-en{cursor:pointer}',
    '.wk-flash{animation:wkflash 1.4s ease-out}@keyframes wkflash{0%,40%{box-shadow:inset 0 0 0 2px #0a84ff}100%{box-shadow:inset 0 0 0 2px transparent}}',
    '.wk-crumb{display:flex;align-items:center;gap:6px;margin:0 2px 12px;font-size:13.5px;opacity:.85}',
    '.wk-crumb button{border:0;background:rgba(255,255,255,.08);color:inherit;font:600 13px -apple-system,system-ui,sans-serif;height:30px;padding:0 12px;border-radius:999px;cursor:pointer}',
    '.wk-cbox{margin-bottom:12px}',
    '.wk-st[data-enter]{cursor:pointer}',
    '.wk-pv .st{margin-top:8px;font-size:12.5px;font-weight:650}',
    '.wk-menu h6{margin:8px 12px 2px;font-size:11px;font-weight:650;letter-spacing:.06em;text-transform:uppercase;opacity:.5}',
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
    '.wk.edit .wk-a.kesel{outline:2px solid #0a84ff;outline-offset:1px}',
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
    'html.kn-open #minest-mini-pet-p0,html.kn-open .mpet-menu,html.kn-open .mpet-say,html.kn-open .mpet-tip{display:none!important}',
    // ---- iOS 27 liquid glass: the page is frosted over the board; tiles, boxes, buttons, preview and sheets are glass
    '.wk{background:linear-gradient(180deg,rgba(22,27,38,.78),rgba(10,13,20,.86));-webkit-backdrop-filter:blur(40px) saturate(180%);backdrop-filter:blur(40px) saturate(180%)}',
    '.wk-head{border-bottom:0;background:linear-gradient(180deg,rgba(0,0,0,.08),transparent);padding-bottom:12px}',
    '.wk-tb b{font-size:30px;font-weight:800;letter-spacing:-.6px}',
    '.wk-x,.wk-hb,.wk-seg,.wk-crumb button,.wk-boxh button,.wk-tools button,.wk-pv .acts button,.wk-sheet .row button,.wk-ed button{background:linear-gradient(180deg,var(--g1),var(--g2));border:1px solid var(--gb);box-shadow:var(--rim),0 6px 18px rgba(0,0,0,.18);color:var(--ink)}',
    '.wk-x{width:36px;height:36px}',
    '.wk-seg{padding:3px;gap:2px}',
    '.wk-seg button{height:30px;padding:0 14px;color:var(--lab)}',
    '.wk-seg button.on{background:rgba(255,255,255,.2);color:var(--ink);box-shadow:var(--rim),0 2px 8px rgba(0,0,0,.18)}',
    '.wk-hb{height:36px;padding:0 14px}',
    '.wk-hb.on,.wk-pv .acts button.pri,.wk-sheet .row button.pri{background:linear-gradient(180deg,#3d9bff,#0a7aff);border-color:rgba(255,255,255,.25);color:#fff}',
    '.wk-band{background:none;color:var(--lab);text-align:left;font-size:13px;font-weight:650;letter-spacing:.06em;text-transform:uppercase;padding:0 4px;margin:6px 0 8px;border-radius:0}',
    '.wk-tile,.wk-sum,.wk-box{background:linear-gradient(180deg,var(--g1),var(--g2));border:1px solid var(--gb);box-shadow:var(--rim),0 10px 30px rgba(0,0,0,.18)}',
    '.wk-tile{border-radius:22px;padding:14px;transition:transform .18s cubic-bezier(.2,.85,.25,1)}',
    '.wk-tile:active{transform:scale(.97);background:linear-gradient(180deg,rgba(255,255,255,.18),rgba(255,255,255,.08))}',
    '.wk-sum{border-radius:22px;padding:14px 16px}',
    '.wk-box{border-radius:22px;overflow:hidden}',
    '.wk-boxh{background:var(--tint);border-bottom:1px solid var(--hair);padding:10px 12px}',
    '.wk-boxh button{height:28px;padding:0 12px;border-radius:999px;font-size:12.5px;color:var(--ink)}',
    '.wk-g{border-top:1px solid var(--hair)}',
    '.wk-g:first-of-type{border-top:0}',
    '.wk-gt{background:var(--tint);color:var(--ink)}',
    '.wk-r{border-top:1px solid var(--hair)}',
    '.wk-st{background:rgba(255,255,255,.025);color:var(--lab);flex-wrap:wrap;column-gap:4px;row-gap:0}',
    '.wk-st small{white-space:nowrap;margin-left:0}',
    '@media (max-width:600px){.wk-r{grid-template-columns:minmax(104px,36%) minmax(0,1fr)}.wk-st{font-size:13px}}',
    '.wk-it .wk-r{border:1px solid var(--hair);border-radius:14px;overflow:hidden}',
    '.wk-tp{color:var(--ink)}',
    '.wk-bar{height:5px;border-radius:3px}',
    '.wk-crumb button{height:32px;padding:0 14px}',
    '.wk-pv{background:linear-gradient(180deg,rgba(66,76,92,.78),rgba(30,36,48,.88));-webkit-backdrop-filter:blur(30px) saturate(180%);backdrop-filter:blur(30px) saturate(180%);border:1px solid rgba(255,255,255,.16);border-radius:24px;box-shadow:var(--rim),0 28px 70px rgba(0,0,0,.45)}',
    '.wk-pv img{margin:8px 8px 0;width:calc(100% - 16px);border-radius:18px}',
    '.wk-pv .acts button{height:36px}',
    '.wk-sheet{background:linear-gradient(180deg,rgba(66,76,92,.78),rgba(30,36,48,.88));-webkit-backdrop-filter:blur(30px) saturate(180%);backdrop-filter:blur(30px) saturate(180%);border-radius:28px;box-shadow:var(--rim),0 28px 70px rgba(0,0,0,.45)}',
    '.wk-sheet input:not([type=checkbox]):not([type=radio]){border-radius:14px;height:44px}',
    '.wk-sheet .row button{height:44px}',
    '.wk-sheet label{border-color:var(--hair)}'
  ].join('\n');
  function ensureCss() { if (document.getElementById('wk-css')) return; var s = document.createElement('style'); s.id = 'wk-css'; s.textContent = CSS; document.head.appendChild(s); }

  var usage = {}, IDXB = {};
  function lookup(id, bid) { var idx = bid ? IDXB[bid] : IDX; return idx ? idx[id] : null; }
  function itemHtml(id, nodeId, bid) {
    var x = lookup(id, bid);
    if (!x) return '';
    var s = stateOf(x.card, x.col), tip = SNAME[s.k] + (s.rv ? ' · needs review' : '') + (usage[id] > 1 ? ' · in ' + usage[id] + ' categories' : '');
    return '<a class="wk-a s-' + s.k + (usage[id] > 1 ? ' multi' : '') + '" data-item="' + esc(id) + '" data-node="' + esc(nodeId) + '"' + (bid ? ' data-b="' + esc(bid) + '"' : '') + ' title="' + esc(tip) + '">' + esc(x.card.title || 'Untitled') + (s.rv ? '<i class="wk-rv"></i>' : '') + '</a>';
  }
  function stFrac(n) { var t = tally(nodeIds(n), IDX); return t.n ? '<small>' + t.done + '/' + t.n + '</small>' : ''; }
  function itemsHtml(n) {
    var parts = (n.items || []).filter(function (id) { return IDX[id]; }).map(function (id) { return itemHtml(id, n.id); });
    return (parts.length ? parts.join('<span class="wk-dot">·</span>') : (edit ? '<span class="wk-empty">No entries yet</span>' : '')) +
      '<span class="wk-add"><span class="wk-ed"><button type="button" data-newin="' + esc(n.id) + '">＋ New</button><button type="button" data-addto="' + esc(n.id) + '">＋ Existing</button></span></span>';
  }
  function ctl(n, isGroup) {
    return '<span class="wk-ed"><button type="button" data-ren="' + esc(n.id) + '" title="Rename">✎</button><button type="button" data-up="' + esc(n.id) + '" title="Move up">↑</button><button type="button" data-down="' + esc(n.id) + '" title="Move down">↓</button><button type="button" data-sub="' + esc(n.id) + '" title="Add a subcategory">＋</button><button type="button" data-del="' + esc(n.id) + '" title="Delete">✕</button></span>';
  }
  function subRows(n) {
    var h = '';
    if ((n.items || []).length || edit || !(n.subs || []).length) h += '<div class="wk-r full"><div class="wk-it">' + itemsHtml(n) + '</div></div>';
    (n.subs || []).forEach(function (s) {
      h += '<div class="wk-r" data-sub-id="' + esc(s.id) + '"><div class="wk-st">' + esc(s.title) + stFrac(s) + ctl(s) + '</div><div class="wk-it">' +
        ((s.items || []).length || edit || !(s.subs || []).length ? itemsHtml(s) : '') +
        (s.subs || []).map(function (ss) { return '<div class="wk-r" data-sub-id="' + esc(ss.id) + '"><div class="wk-st">' + esc(ss.title) + stFrac(ss) + ctl(ss) + '</div><div class="wk-it">' + itemsHtml(ss) + subDeep(ss) + '</div></div>'; }).join('') + '</div></div>';
    });
    return h;
  }
  function subDeep(n) { return (n.subs || []).map(function (s) { return '<div class="wk-r" data-sub-id="' + esc(s.id) + '"><div class="wk-st">' + esc(s.title) + stFrac(s) + ctl(s) + '</div><div class="wk-it">' + itemsHtml(s) + subDeep(s) + '</div></div>'; }).join(''); }
  function render() {
    if (!ui.el) return;
    SC = {};
    S.last = { course: ui.course || null, bid: ui.bid, from: ui.from || null }; stSave();
    ui.el.classList.toggle('course', !!ui.course);
    if (ui.course) return renderCourse();
    var b = boardById(ui.bid); if (!b) return;
    T = treeOf(b); IDX = cardIndex(b); usage = {};
    walk(T, function (n) { (n.items || []).forEach(function (id) { usage[id] = (usage[id] || 0) + 1; }); });
    var s = st();
    ui.el.classList.toggle('compact', s.layout === 'compact');
    var from = ui.from && courseById(ui.from);
    ui.title.textContent = (T.portal && T.portal.title) || b.title || 'Portal';
    ui.kicker.textContent = from ? from.title : 'Portal';
    ui.seg.querySelectorAll('[data-layout]').forEach(function (x) { x.classList.toggle('on', x.getAttribute('data-layout') === s.layout); });
    var areas = {}; ((T.portal || {}).areas || []).forEach(function (a) { areas[a.group] = a; });
    var all = tally(treeIds(T), IDX);
    var crumb = from ? '<div class="wk-crumb"><button type="button" data-crumb>‹ ' + esc(from.title) + '</button><span>›</span><b>' + esc(b.title || '') + '</b></div>' : '';
    var portal = '<div class="wk-portal">' + crumb + ((T.portal || {}).intro ? '<p>' + esc(T.portal.intro) + '</p>' : '') +
      '<div class="wk-sum"><b>' + all.n + ' entries</b>' + frac(all) + bar(all) + '</div><div class="wk-band">Topics</div><div class="wk-tiles">' +
      T.groups.map(function (g) { var a = areas[g.id] || {}, t = tally(nodeIds(g), IDX); return '<button type="button" class="wk-tile" data-goto="' + esc(g.id) + '"><b>' + esc(g.title) + '</b>' + (a.desc ? '<small>' + esc(a.desc) + '</small>' : '') + '<em>' + countItems(g) + ' entries' + ((g.subs || []).length ? ' · ' + g.subs.length + ' subcategories' : '') + '</em>' + frac(t) + bar(t) + '</button>'; }).join('') + '</div></div>';
    var box = '<div class="wk-box"><div class="wk-boxh"><span style="width:44px"></span><b>' + esc(T.title || 'Categories') + '</b><button type="button" data-hide>' + (s.hide ? '[show]' : '[hide]') + '</button></div>' +
      (s.hide ? '' : T.groups.map(function (g) {
        var fold = s.fold[g.id];
        var gt = tally(nodeIds(g), IDX);
        return '<div class="wk-g' + (fold ? ' fold' : '') + '" data-g="' + esc(g.id) + '"><div class="wk-gt" data-fold="' + esc(g.id) + '" data-n="(' + countItems(g) + ')"><span class="tw">▼</span>' + esc(g.title) + ctl(g, true) + (gt.n ? '<span class="wk-gp">' + frac(gt) + bar(gt) + '</span>' : '') + '</div><div class="wk-gb">' + subRows(g) + '</div></div>';
      }).join('')) + '</div>';
    var tools = '<div class="wk-tools"><button type="button" data-addgroup>＋ Category group</button><button type="button" data-savetpl>Save as template</button>' + (KN().keys('wk:tpl:').length ? '<button type="button" data-usetpl>Use a template…</button>' : '') + (T.auto ? '' : '<button type="button" data-rebuild>↺ Rebuild from the board</button>') + '</div>';
    ui.list.innerHTML = (s.layout === 'compact' ? crumb : '') + portal + box + tools;
  }

  // ---------------------------------------------------------------- the course page: every subject at a glance
  function renderCourse() {
    var c = courseById(ui.course); if (!c) { ui.course = null; return render(); }
    var s = st(); IDXB = {}; usage = {};
    ui.el.classList.toggle('compact', s.layout === 'compact');
    ui.title.textContent = c.title || 'Portal'; ui.kicker.textContent = 'Portal';
    ui.seg.querySelectorAll('[data-layout]').forEach(function (x) { x.classList.toggle('on', x.getAttribute('data-layout') === s.layout); });
    var subj = c.boards.map(function (e) { var b = boardById(e.b); if (!b) return null; var t = treeOf(b); IDXB[b.id] = cardIndex(b); return { e: e, b: b, t: t, sum: tally(treeIds(t), IDXB[b.id]) }; }).filter(Boolean);
    var all = subj.reduce(function (a, x) { return add(a, x.sum); }, { n: 0, done: 0, learn: 0, seen: 0, rv: 0 });
    var head = '<div class="wk-portal">' + (c.intro ? '<p>' + esc(c.intro) + '</p>' : '') +
      '<div class="wk-sum"><b>' + subj.length + ' subjects · ' + all.n + ' entries</b>' + frac(all) + bar(all) + '</div>' +
      '<div class="wk-band">Subjects</div><div class="wk-tiles">' + subj.map(function (x) {
        var desc = x.e.desc || (x.t.portal && x.t.portal.intro) || '';
        return '<button type="button" class="wk-tile" data-enter="' + esc(x.b.id) + '"><b>' + esc(x.b.title || 'Board') + '</b>' + (desc ? '<small>' + esc(desc.length > 90 ? desc.slice(0, 88) + '…' : desc) + '</small>' : '') +
          '<em>' + x.t.groups.length + ' skills · ' + x.sum.n + ' entries</em>' + frac(x.sum) + bar(x.sum) + '</button>';
      }).join('') + (subj.length ? '' : '<p>No subjects yet — tap ✎ Edit, then “Subjects…”.</p>') + '</div></div>';
    var boxes = subj.map(function (x) {
      var idx = IDXB[x.b.id], fold = s.fold[x.b.id];
      return '<div class="wk-box wk-cbox"><div class="wk-boxh"><span style="width:44px"></span><b class="wk-en" data-enter="' + esc(x.b.id) + '">' + esc(x.e.icon ? x.e.icon + ' ' : '') + esc(x.b.title || '') + '</b><button type="button" data-cfold="' + esc(x.b.id) + '">' + (fold ? '[show]' : '[hide]') + '</button></div>' +
        (fold ? '' : x.t.groups.map(function (g) {
          var t = tally(nodeIds(g), idx);
          var inner = (g.subs || []).map(function (sb) { var st2 = tally(nodeIds(sb), idx); return '<a class="wk-tp" data-enter="' + esc(x.b.id) + '" data-to="' + esc(sb.id) + '">' + esc(sb.title) + '<small>' + st2.done + '/' + st2.n + '</small></a>'; });
          inner = inner.concat((g.items || []).map(function (id) { return itemHtml(id, g.id, x.b.id); }).filter(Boolean));
          return '<div class="wk-r"><div class="wk-st" data-enter="' + esc(x.b.id) + '" data-to="' + esc(g.id) + '">' + esc(g.title) + '<small>' + t.done + '/' + t.n + '</small></div><div class="wk-it">' + inner.join('<span class="wk-dot">·</span>') + '</div></div>';
        }).join('')) + '</div>';
    }).join('');
    var tools = '<div class="wk-tools"><button type="button" data-csubj>Subjects…</button><button type="button" data-cren>Rename</button><button type="button" data-cdel>Delete this portal</button></div>';
    ui.list.innerHTML = head + boxes + tools;
  }
  function enter(bid, to) {
    keep(); ui.from = ui.course; ui.course = null; ui.bid = bid;
    var s = st(); s.hide = false;
    var b = boardById(bid), t = b && treeOf(b), root = null;
    if (t && to) root = t.groups.filter(function (g) { return g.id === to || findNode({ groups: [g] }, to); })[0] || null;
    if (root) s.fold[root.id] = false;
    stSave(); render();
    var el = to && (ui.list.querySelector('[data-sub-id="' + cssEsc(to) + '"]') || ui.list.querySelector('.wk-g[data-g="' + cssEsc(to) + '"]') || (root && ui.list.querySelector('.wk-g[data-g="' + cssEsc(root.id) + '"]')));
    if (el) { var lr = ui.list.getBoundingClientRect(); ui.list.scrollTop += el.getBoundingClientRect().top - lr.top - 8; el.classList.add('wk-flash'); setTimeout(function () { el.classList.remove('wk-flash'); }, 1400); }
    else ui.list.scrollTop = 0;
  }
  function backToCourse() { keep(); ui.course = ui.from; ui.from = null; render(); ui.list.scrollTop = st().scroll || 0; }
  function courseSheet(c) {
    var cur = {}; (c ? c.boards : []).forEach(function (e) { cur[e.b] = e; });
    var bs = boards().filter(function (b) { return !b.archived; });
    var sh = mkSheet('<h4>' + (c ? 'Subjects in “' + esc(c.title) + '”' : 'New portal from boards') + '</h4>' + (c ? '' : '<input data-title placeholder="Portal name (e.g. EC-6)">') +
      '<div class="list">' + bs.map(function (b) { return '<label><input type="checkbox" value="' + esc(b.id) + '"' + (cur[b.id] ? ' checked' : '') + '>' + esc(b.title || 'Board') + '</label>'; }).join('') + '</div>' +
      '<div class="row"><button type="button" data-no>Cancel</button><button type="button" class="pri" data-ok>' + (c ? 'Done' : 'Create') + '</button></div>');
    sh.addEventListener('click', function (e) {
      if (e.target.closest('[data-no]')) return closeSheet();
      if (!e.target.closest('[data-ok]')) return;
      var chosen = [].slice.call(sh.querySelectorAll('input[type=checkbox]')).filter(function (x) { return x.checked; }).map(function (x) { return x.value; });
      if (!chosen.length) return toast('Pick at least one board');
      var keepOrder = (c ? c.boards.map(function (e) { return e.b; }) : []).filter(function (id) { return chosen.indexOf(id) >= 0; }).concat(chosen.filter(function (id) { return !cur[id]; }));
      var nc = c ? JSON.parse(JSON.stringify(c)) : { id: rid('c-'), title: ((sh.querySelector('[data-title]') || {}).value || '').trim() || 'My portal', intro: '' };
      nc.boards = keepOrder.map(function (id) { return cur[id] || { b: id }; });
      closeSheet(); keep(); ui.course = nc.id; ui.from = null; KN().set('wk:course:' + nc.id, nc);
    });
  }
  function onCourseEdit(t) {
    var c = courseById(ui.course); if (!c) return false;
    if (t.closest('[data-csubj]')) { courseSheet(c); return true; }
    if (t.closest('[data-cren]')) { var nm = prompt('Portal name', c.title); if (nm && nm.trim()) { c.title = nm.trim(); KN().set('wk:course:' + c.id, c); } return true; }
    if (t.closest('[data-cdel]')) { if (confirm('Delete the portal “' + c.title + '”? Its boards and cards stay.')) { ui.course = null; KN().set('wk:course:' + c.id, null); } return true; }
    return false;
  }

  // ---------------------------------------------------------------- preview
  var pv = null, pvTimer = 0, fine = window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches;
  function closePv() { clearTimeout(pvTimer); if (pv) { pv.remove(); pv = null; } }
  function preview(a, sticky) {
    closePv();
    var id = a.getAttribute('data-item'), bid = a.getAttribute('data-b'), x = lookup(id, bid); if (!x) return;
    var ls = stateOf(x.card, x.col);
    var o = KN().get('wk:pv:' + id) || {}, img = o.image || (x.card.cover && x.card.cover.type === 'image' && (x.card.cover.value || x.card.cover.url)) || '';
    var desc = o.desc || x.card.desc || '';
    var cats = []; if (!bid && T) walk(T, function (n) { if ((n.items || []).indexOf(id) >= 0) cats.push(n.title); });
    pv = document.createElement('div'); pv.className = 'wk-pv'; pv.setAttribute('role', 'dialog');
    pv.innerHTML = (img ? '<img alt="" src="' + esc(img) + '">' : '') + '<div class="in"><b>' + esc(x.card.title) + '</b>' + (desc ? '<p>' + esc(desc) + '</p>' : '<p style="opacity:.5">No summary yet.</p>') +
      '<div class="st s-' + ls.k + '">' + SNAME[ls.k] + (ls.k === 'learn' || ls.k === 'done' ? ' · Lv ' + ls.m + '/5' : '') + (ls.rv ? '<span style="color:var(--bad)"> · needs review</span>' : '') + '</div>' +
      (cats.length > 1 ? '<div class="cats">In: ' + esc(cats.join(' · ')) + '</div>' : '') +
      (sticky ? '<div class="acts"><button type="button" class="pri" data-pvopen>Open</button><button type="button" data-pvboard>On the board</button>' + (edit ? '<button type="button" data-pvedit>Edit preview</button>' : '') + '</div>' : '') + '</div>';
    pv.__id = id; pv.__b = bid; pv.classList.add('wk-pvs');
    document.body.appendChild(pv);
    var r = a.getBoundingClientRect(), w = pv.offsetWidth, h = pv.offsetHeight;
    var left = Math.max(10, Math.min(innerWidth - w - 10, r.left + r.width / 2 - w / 2)), top = r.bottom + 8;
    if (top + h > innerHeight - 10) top = Math.max(10, r.top - h - 8);
    pv.style.left = left + 'px'; pv.style.top = top + 'px';
    if (pv.animate) pv.animate([{ opacity: 0, translate: '0 6px' }, { opacity: 1, translate: '0 0' }], { duration: 160, easing: 'ease-out' });
    ['pointerdown', 'touchstart'].forEach(function (ev) { pv.addEventListener(ev, function (e) { e.stopPropagation(); }, { passive: true }); });
    pv.addEventListener('click', function (e) {
      if (e.target.closest('[data-pvopen]')) { closePv(); return details(id, bid); }
      if (e.target.closest('[data-pvboard]')) { closePv(); return onBoard(id, bid); }
      if (e.target.closest('[data-pvedit]')) { closePv(); return editPreview(id); }
    });
  }

  // ---------------------------------------------------------------- details / board, and back to the same place
  function keep() { if (ui.list) { st().scroll = ui.list.scrollTop; stSave(); } }
  function details(id, bid) {
    var x = lookup(id, bid); if (!x || !A().openCardIn) return;
    keep(); ui.el.classList.add('away'); ui.lastItem = id;
    if (KN().markSeen) KN().markSeen(id);
    A().openCardIn(bid || ui.bid, x.col.id, id);
    var t0 = Date.now(), seen = false, gone = 0;
    var modal = function () { return document.querySelector('.mn-dm, .mn-cardsheet, .fixed.inset-0.z-50 .rounded-3xl'); };
    var iv = setInterval(function () {
      if (modal()) { seen = true; gone = 0; return; }
      if (seen) gone++;
      if ((seen && gone >= 2) || (!seen && Date.now() - t0 > 2500)) { clearInterval(iv); if (!ui.el) return; ui.el.classList.remove('away'); render(); ui.list.scrollTop = st().scroll || 0; lit(id, bid); }
    }, 250);
  }
  function lit(id, bid) { var a = ui.list.querySelector('.wk-a[data-item="' + cssEsc(id) + '"]' + (bid ? '[data-b="' + cssEsc(bid) + '"]' : '')); if (a) { a.classList.add('hit'); setTimeout(function () { a.classList.remove('hit'); }, 1600); } }
  function onBoard(id, ib) {
    var x = lookup(id, ib); if (!x) return;
    keep(); var bid = ib || ui.bid, back = { course: ui.course, bid: ui.bid, from: ui.from }; close();
    if (window.MinestContents && MinestContents.goTo) MinestContents.goTo({ b: bid, l: x.col.id, c: id, p: x.parent ? x.parent.id : null }, { label: 'Portal', open: function () { restore(back); setTimeout(function () { lit(id, ib); }, 150); } });
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
  // ---------------------------------------------------------------- editing entries (MinestKEdit: the Outline's basics)
  function editEntry(a) {
    if (!window.MinestKEdit) return;
    var id = a.getAttribute('data-item'), bid = a.getAttribute('data-b') || ui.bid, nodeId = a.getAttribute('data-node'), x = lookup(id, a.getAttribute('data-b'));
    if (!x) return;
    closePv();
    ui.list.querySelectorAll('.wk-a.kesel').forEach(function (e) { e.classList.remove('kesel'); }); a.classList.add('kesel');
    var tree = a.getAttribute('data-b') ? treeOf(boardById(bid)) : T;
    MinestKEdit.bar({ bid: bid, kind: x.parent ? 'item' : 'card', id: id, title: x.card.title }, {
      hide: { up: 1, down: 1 },
      extra: [
        { key: 'uncat', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7h18M3 12h10M3 17h7"/><path d="m16 15 5 5M21 15l-5 5"/></svg>', label: 'Out of this category (the card stays)', run: function () {
          var h = findNode(tree, nodeId); if (!h) return; h.node.items = h.node.items.filter(function (q) { return q !== id; });
          delete tree.auto; KN().set('wk:tree:' + bid, tree); MinestKEdit.closeBar(); render();
        } },
        { key: 'pv', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="3"/><path d="m3 16 5-5 4 4 3-3 6 6"/></svg>', label: 'Preview (summary, picture)', run: function () { MinestKEdit.closeBar(); if (a.getAttribute('data-b')) { IDX = IDXB[bid]; } editPreview(id); } }
      ],
      onDetails: function () { details(id, a.getAttribute('data-b')); },
      onDone: function (m) {
        // a new card made from here joins the same category, right after this entry
        if (m && m.id && m.id !== id && m.kind === 'card') { var h = findNode(tree, nodeId); if (h) { var at = h.node.items.indexOf(id); h.node.items.splice(at + 1, 0, m.id); delete tree.auto; KN().set('wk:tree:' + bid, tree); } }
        else if (!m && !MinestKEdit.find({ bid: bid, kind: x.parent ? 'item' : 'card', id: id }) && !tree.auto) {   // deleted: out of every category too
          walk(tree, function (q) { q.items = (q.items || []).filter(function (z) { return z !== id; }); }); KN().set('wk:tree:' + bid, tree, true);
        }
        var y = ui.list.scrollTop; render(); ui.list.scrollTop = y;
      }
    });
  }
  // ＋ New in a category: a new card on the board (in the category's own list when it has one) that joins the category
  function newIn(nodeId) {
    var b = boardById(ui.bid), h = findNode(T, nodeId); if (!b || !h || !window.MinestKEdit) return;
    var cols = b.columns || []; if (!cols.length) return toast('Add a list to this board first.');
    var root = T.groups.filter(function (g) { return g.id === nodeId || findNode({ groups: [g] }, nodeId); })[0] || h.node;
    var col = cols.filter(function (c) { return 'g-' + c.id === root.id || c.id === 'kl-' + ui.bid + '-' + root.id; })[0];
    if (!col) { var first = nodeIds(h.node).map(function (q) { return IDX[q]; }).filter(Boolean)[0]; col = first ? first.col : cols[0]; }
    MinestKEdit.sheet({ title: 'New entry in “' + h.node.title + '”', ok: 'Add', fields: [{ key: 'title', label: 'Title' }, { key: 'desc', label: 'Summary', type: 'note' }, { key: 'list', label: 'On the board in', type: 'select', options: cols.map(function (c) { return [c.id, c.title || 'List']; }), value: col.id }] })
      .then(function (v) {
        if (!v || !v.title.trim()) return;
        return MinestKEdit.ops.addCardTo(ui.bid, v.list, null, { title: v.title, desc: v.desc }).then(function (m) {
          if (!m || !m.id) return;
          var t2 = treeOf(boardById(ui.bid)), h2 = findNode(t2, nodeId); if (h2) { h2.node.items = (h2.node.items || []).concat([m.id]); delete t2.auto; KN().set('wk:tree:' + ui.bid, t2); }
          render(); setTimeout(function () { lit(m.id); }, 60);
        });
      });
  }
  window.addEventListener('minest:kedit', function () { if (ui.open && ui.el && !ui.el.classList.contains('away') && !sheet) { var y = ui.list.scrollTop; render(); ui.list.scrollTop = y; } });
  function onEditClick(t) {
    var id;
    if ((id = attr(t, 'data-newin'))) return newIn(id), true;
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
  // open(board) = that subject; open() = where you were last (a course portal), else the current board
  function open(boardId, tries) {
    if (ui.open) return;
    if (boardId && !boardById(boardId) && (tries || 0) < 40) return setTimeout(function () { open(boardId, (tries || 0) + 1); }, 50);
    var last = S.last || {};
    if (!boardId && last.course && courseById(last.course)) return restore(last);
    if (!boardId && last.from && courseById(last.from) && last.bid && boardById(last.bid)) return restore(last);
    var a = A().board && A().board();
    ui.course = null; ui.from = null;
    mount(boardId || (a && a.id) || (boards()[0] || {}).id);
  }
  function openCourse(id, tries) {
    if (ui.open) close();
    var c = courseById(id);
    if (!c || c.boards.some(function (e) { return !boardById(e.b); })) { if ((tries || 0) < 40) return setTimeout(function () { openCourse(id, (tries || 0) + 1); }, 60); if (!c) return toast('No such portal.'); }
    ui.course = id; ui.from = null; mount((c.boards[0] || {}).b || ui.bid);
  }
  function restore(p) { if (ui.open) close(); ui.course = p.course && courseById(p.course) ? p.course : null; ui.from = !ui.course && p.from && courseById(p.from) ? p.from : null; mount(p.bid && boardById(p.bid) ? p.bid : (A().board && A().board() || {}).id); }
  function mount(bid) {
    ensureCss(); if (window.MinestKnowledge && MinestKnowledge.applyLook) MinestKnowledge.applyLook();
    ui.bid = bid || (boards()[0] || {}).id;
    if (!ui.bid && !ui.course) return toast('No board yet.');
    var el = document.createElement('div'); el.className = 'wk'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Wiki Portal');
    el.innerHTML = '<div class="wk-head"><button type="button" class="wk-tb" data-boards><small></small><b></b></button>' +
      '<button type="button" class="wk-x" data-x aria-label="Close"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg></button>' +
      '<span class="wk-seg"><button type="button" data-layout="wiki">Wiki</button><button type="button" data-layout="compact">Compact</button></span><button type="button" class="wk-hb" data-edit>✎ Edit</button>' + (window.MinestKEdit ? MinestKEdit.switchBtnHtml('wk-hb wk-fs') : '') + (window.MinestKEdit ? MinestKEdit.fullBtnHtml('wk-hb wk-fs') : '') + '</div><div class="wk-body"></div>';
    ui.el = el; ui.list = el.querySelector('.wk-body'); ui.title = el.querySelector('.wk-tb b'); ui.kicker = el.querySelector('.wk-tb small'); ui.seg = el.querySelector('.wk-seg'); ui.open = true; edit = false;
    document.body.appendChild(el); document.documentElement.classList.add('kn-open');
    if (window.MinestKEdit) { MinestKEdit.fullscreen('portal', el, ['.wk-head']); MinestKEdit.switcher('portal', el, function () { return ui.bid; }); }
    render(); ui.list.scrollTop = st().scroll || 0;
    if (el.animate) el.animate([{ opacity: 0, scale: '.97' }, { opacity: 1, scale: '1' }], { duration: 260, easing: 'cubic-bezier(.2,.85,.25,1)' });
    wire(el);
  }
  function close() {
    if (!ui.open) return;
    if (window.MinestKEdit) MinestKEdit.closeBar();
    keep(); closePv(); closeSheet();
    var el = ui.el; ui.open = false; ui.el = null; document.documentElement.classList.remove('kn-open');
    var m = document.querySelector('.wk-menu'); if (m) m.remove();
    if (el.animate) { var an = el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 180, fill: 'forwards' }); an.onfinish = function () { el.remove(); }; } else el.remove();
  }
  function boardMenu(anchor) {
    var old = document.querySelector('.wk-menu'); if (old) { old.remove(); return; }
    var m = document.createElement('div'); m.className = 'en-menu wk-menu';
    var cs = courses();
    m.innerHTML = '<h6>Portals</h6>' + cs.map(function (c) { return '<button type="button" data-c="' + esc(c.id) + '"' + (c.id === ui.course ? ' class="on"' : '') + '>📚 ' + esc(c.title) + '</button>'; }).join('') +
      '<button type="button" data-cnew>＋ New portal from boards…</button><h6>Boards</h6>' +
      boards().filter(function (b) { return !b.archived; }).map(function (b) { return '<button type="button" data-b="' + esc(b.id) + '"' + (!ui.course && b.id === ui.bid ? ' class="on"' : '') + '>' + esc(b.title || 'Board') + '</button>'; }).join('');
    m.style.maxHeight = '70dvh'; m.style.overflow = 'auto';
    document.body.appendChild(m);
    var r = anchor.getBoundingClientRect(); m.style.left = Math.max(10, r.left) + 'px'; m.style.top = (r.bottom + 8) + 'px';
    m.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
    m.addEventListener('click', function (e) {
      if (e.target.closest('[data-cnew]')) { m.remove(); return courseSheet(null); }
      var c = e.target.closest('[data-c]'); if (c) { m.remove(); keep(); ui.course = c.getAttribute('data-c'); ui.from = null; render(); ui.list.scrollTop = st().scroll || 0; return; }
      var b = e.target.closest('[data-b]'); if (!b) return; m.remove(); keep(); ui.course = null; ui.from = null; ui.bid = b.getAttribute('data-b'); render(); ui.list.scrollTop = st().scroll || 0;
    });
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
      if (t.closest('[data-edit]')) { edit = !edit; t.closest('[data-edit]').classList.toggle('on', edit); el.classList.toggle('edit', edit); closePv(); if (!edit && window.MinestKEdit) MinestKEdit.closeBar(); else toast('Tap an entry to edit it'); return render(); }
      if (t.closest('[data-hide]')) { st().hide = !st().hide; stSave(); return render(); }
      if (t.closest('[data-crumb]')) return backToCourse();
      var cf = attr(t, 'data-cfold'); if (cf) { st().fold[cf] = !st().fold[cf]; stSave(); var y0 = ui.list.scrollTop; render(); ui.list.scrollTop = y0; return; }
      if (edit && ui.course && onCourseEdit(t)) return;
      if (edit && !ui.course && onEditClick(t)) return;
      var en = t.closest('[data-enter]'); if (en && !t.closest('.wk-a')) return enter(en.getAttribute('data-enter'), en.getAttribute('data-to'));
      var a = t.closest('.wk-a');
      if (a) {
        e.preventDefault();
        if (edit) return editEntry(a);   // Edit: the entry's edit bar (text, details, delete, out of this category, preview)
        if (fine) { closePv(); return details(a.getAttribute('data-item'), a.getAttribute('data-b')); }
        if (pv && pv.__id === a.getAttribute('data-item') && pv.__b === a.getAttribute('data-b')) return closePv();
        return preview(a, true);
      }
      var go = attr(t, 'data-goto'); if (go) { st().fold[go] = false; st().hide = false; stSave(); render(); var g = ui.list.querySelector('.wk-g[data-g="' + cssEsc(go) + '"]'); if (g) { var lr = ui.list.getBoundingClientRect(), gr = g.getBoundingClientRect(); ui.list.scrollTo({ top: ui.list.scrollTop + gr.top - lr.top - 8, behavior: 'smooth' }); setTimeout(function () { if (Math.abs(g.getBoundingClientRect().top - lr.top - 8) > 6) ui.list.scrollTop += g.getBoundingClientRect().top - lr.top - 8; }, 650); } return; }
      var f = t.closest('[data-fold]'); if (f && !t.closest('.wk-ed')) { var id = f.getAttribute('data-fold'); st().fold[id] = !st().fold[id]; stSave(); f.parentNode.classList.toggle('fold', !!st().fold[id]); return; }
    });
  }
  if (KN() && KN().onChange) KN().onChange(function () { if (ui.open && !ui.el.classList.contains('away') && !sheet) { var y = ui.list.scrollTop; render(); ui.list.scrollTop = y; } });
  // learning anywhere (Learning Path, Drill, Arcade, stars by hand) shows up here when you come back
  var rt = 0;
  function soon() { clearTimeout(rt); rt = setTimeout(function () { if (ui.open && ui.el && !ui.el.classList.contains('away') && !sheet && !pv) { var y = ui.list.scrollTop; render(); ui.list.scrollTop = y; } }, 400); }
  ['minest:learn', 'minest:study-activity', 'minest:mastery-manual', 'minest:drill-done', 'minest:arcade-done', 'focus'].forEach(function (ev) { window.addEventListener(ev, soon); });
  document.addEventListener('visibilitychange', function () { if (!document.hidden) soon(); });

  window.MinestWiki = { open: open, openCourse: openCourse, close: close, _courses: courses, _state: function (id, bid) { var x = lookup(id, bid); return x ? stateOf(x.card, x.col) : null; }, toggle: function () { if (ui.open) close(); else open(); }, isOpen: function () { return ui.open; },
    _tree: function () { return T; }, _preview: function (id, sticky) { var a = ui.list.querySelector('.wk-a[data-item="' + cssEsc(id) + '"]'); if (a) preview(a, sticky); return !!a; } };
})();
