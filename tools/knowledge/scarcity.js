/* Minest Knowledge · Discover My World V2 — the Scarcity Choice Engine (Choose → Limit → Reflect → Save)
   Plugs into window.MinestDiscover (register). One engine, two tools:
     My Desert Island ('desert-island') — "If you could only keep five…", light, island-themed
     What Truly Matters? ('what-matters') — quiet reflection on values, priorities and unfinished dreams
   A session (the same 'dv:<id>' record as the other Discover tools) adds:
     limits [10, 5, 3]     how many stay after each round (JSON roundLimits, or automatic)
     rounds [[ids], …]      what was kept in each round — each round only from what the round before kept
     theme                  the template id (or 'list:<id>') — results of the same theme can be compared over time
     notes                  optional reflection / note (never required, never added to My World unless asked)
     finalIds, completedAt
   Changing an earlier round keeps later choices only where they still fit; a round left short is marked to look at again.
   Items keep references only (card / knowledge item); no card is ever changed (owned, mastered, favourite stay as they are). */
(function () {
  if (window.MinestScarcity || !window.MinestDiscover || !MinestDiscover.register) return;
  var D = MinestDiscover, X = D._x, ui = X.ui, esc = X.esc, KN = function () { return window.MinestKnowledge; };
  var TPL = window.__MINEST_DISCOVER || {};

  // ================================================================== engine
  function autoLimits(n) { return n >= 13 ? [10, 5, 3] : n >= 10 ? [7, 5, 3] : n >= 7 ? [5, 3] : n >= 5 ? [3] : n >= 3 ? [n - 1] : []; }
  function parseLimits(v, n) {
    var a = (Array.isArray(v) ? v : String(v || '').split(/[^0-9]+/)).map(function (x) { return parseInt(x, 10); }).filter(function (x) { return x > 0; });
    if (!a.length) return null;
    for (var i = 0; i < a.length; i++) if (a[i] >= (i ? a[i - 1] : n)) return null;   // each round keeps fewer than the one before
    return a.slice(0, 6);
  }
  function pool(s, r) { return r === 0 ? s.items.map(function (x) { return x.id; }) : (s.rounds[r - 1] || []); }
  // keep every round consistent with the one before; returns the first round that still needs choosing
  function normalize(s) {
    var trimmed = [];
    s.rounds = s.rounds || [];
    for (var r = 0; r < s.limits.length; r++) {
      var p = pool(s, r), before = (s.rounds[r] || []).length;
      s.rounds[r] = (s.rounds[r] || []).filter(function (id) { return p.indexOf(id) >= 0; }).slice(0, s.limits[r]);
      if (s.rounds[r].length < before) trimmed.push(r);
    }
    var at = s.limits.length;
    for (var k = 0; k < s.limits.length; k++) if (s.rounds[k].length !== s.limits[k]) { at = k; break; }
    return { at: at, trimmed: trimmed };
  }
  function complete(s) { return normalize(s).at >= s.limits.length; }

  // ================================================================== sources
  function catalogItems(ref) {
    var m = /^pickers:(.+)$/.exec(ref || ''), c = m && (window.__MINEST_PICKERS || {})[m[1]];
    return c ? c.items.map(function (it) { var key = 'ki:' + m[1] + ':' + it.id; return { id: key, key: key, title: it.title, sub: [it.sub, it.tag].filter(Boolean).join(' · ') }; }) : [];
  }
  function tplItems(t) {
    if (t.items) return t.items.map(function (x) { return { id: 'tpl:' + t.id + ':' + x.id, title: x.title, sub: x.sub || '' }; });
    if (t.from) return catalogItems(t.from);
    if (t.fromLists) return fromMyLists(t.fromLists);
    return [];
  }
  // the user's own lists (e.g. My Dreams, My Goals, My Bucket List): their cards / stacked cards, by reference
  function fromMyLists(re) {
    var rx = new RegExp('\\b(' + re + ')', 'i'), out = [], seen = {};
    X.worldIds().forEach(function (bid) {
      var b = X.boardById(bid);
      (b.columns || []).forEach(function (col) { (col.cards || []).forEach(function (c) {
        if (!c || !rx.test(c.title || '')) return;
        (c.stack || []).forEach(function (st) { var key = KN().get('pk:' + st.id), id = key || st.id; if (seen[id]) return; seen[id] = 1; out.push({ id: id, title: st.title, ref: { bid: bid, id: st.id, key: key || null }, sub: c.title }); });
      }); });
    });
    return out;
  }
  var GROUP = { 'desert-island': 'desertIsland', 'what-matters': 'whatMatters' };
  function templatesOf(kind) { return (TPL[GROUP[kind] || kind] || []); }
  function tplById(kind, id) { return templatesOf(kind).filter(function (t) { return t.id === id; })[0] || null; }
  function themeOf(kind, src) {   // a list that fits a template shares its theme (so its results can be compared)
    if (src.kind === 'template') return src.id;
    var hit = templatesOf(kind).filter(function (t) { return t.match && new RegExp('\\b(' + t.match + ')', 'i').test(src.title || ''); })[0];
    return hit ? hit.id : (src.kind === 'json' ? 'json:' + (src.id || X.slug(src.title)) : 'list:' + src.id);
  }

  // ================================================================== UI
  var I = function (d, w) { return '<svg viewBox="0 0 24 24" width="' + (w || 16) + '" height="' + (w || 16) + '" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">' + d + '</svg>'; };
  var CHECK = I('<path d="M5 12.5l4.5 4.5L19 7.5"/>', 14);
  var ISLAND = function (n, k) {   // the scene: sea, a small island, one slot per place on it (filled = chosen)
    var dots = ''; for (var i = 0; i < n; i++) { var x = 160 - (n - 1) * 11 + i * 22; dots += '<circle cx="' + x + '" cy="74" r="7" fill="' + (i < k ? '#fff' : 'rgba(255,255,255,.25)') + '" stroke="rgba(255,255,255,.7)" stroke-width="1.5"/>'; }
    return '<svg viewBox="0 0 320 96" preserveAspectRatio="xMidYMax meet" width="100%" height="96"><defs><linearGradient id="dvsea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7fd3f7"/><stop offset="1" stop-color="#1c8fc9"/></linearGradient></defs>' +
      '<rect width="320" height="96" fill="url(#dvsea)"/><circle cx="270" cy="22" r="11" fill="#fff6c9" opacity=".9"/>' +
      '<path d="M0 60c30-6 50 6 80 0s50-6 80 0 50 6 80 0 50-6 80 0V96H0z" fill="#ffffff" opacity=".18"/>' +
      '<ellipse cx="160" cy="80" rx="' + (40 + n * 11) + '" ry="16" fill="#f3d79b"/><ellipse cx="160" cy="78" rx="' + (32 + n * 10) + '" ry="11" fill="#f8e3b2"/>' +
      '<path d="M' + (98 - n * 6) + ' 72c0-18 2-30 8-40" stroke="#7a5230" stroke-width="3" fill="none"/><path d="M' + (106 - n * 6) + ' 32c-10-6-22-4-28 2 9-2 18 0 28-2zm0 0c8-8 20-10 28-6-9 0-18 2-28 6zm0 0c-4-10-2-18 4-24-2 8-2 16-4 24z" fill="#3fae5a"/>' + dots + '</svg>';
  };
  var CSS = [
    '.sc-scene{margin:0 -14px 10px;position:relative;overflow:hidden;background:linear-gradient(180deg,#7fd3f7,#1c8fc9)}.sc-scene svg{display:block}',
    '.sc-scene .lbl{position:absolute;left:14px;top:10px;color:#fff;font-size:12px;font-weight:750;letter-spacing:.06em;text-transform:uppercase;text-shadow:0 1px 4px rgba(0,60,100,.5)}',
    '.sc-ask{font-size:21px;font-weight:800;letter-spacing:-.3px;margin:2px 2px 2px}',
    '.sc-left{font-size:13.5px;opacity:.7;margin:0 2px 12px}.sc-left b{color:#4fc3f7}',
    '.sc-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(102px,1fr));gap:12px 10px}',
    '.sc-t{position:relative;cursor:pointer;min-width:0}',
    '.sc-t .dv-art{aspect-ratio:2/3;border-radius:12px;box-shadow:0 8px 20px rgba(0,0,0,.35),inset 0 0 0 1px rgba(255,255,255,.14);transition:transform .18s,box-shadow .18s,opacity .18s}',
    '.sc-t .dv-art.drawn{padding:8px}.sc-t .dv-art.drawn b{font-size:13.5px}',
    '.sc-t p{margin:5px 2px 0;font-size:12px;font-weight:600;line-height:1.2;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}',
    '.sc-t.on .dv-art{box-shadow:0 0 0 3px #29b6f6,0 10px 24px rgba(41,182,246,.4);transform:scale(.96)}',
    '.sc-t.full .dv-art{opacity:.55}',
    '.sc-sel{position:absolute;left:6px;top:6px;width:30px;height:30px;border-radius:50%;display:grid;place-items:center;padding:0;cursor:pointer;color:#fff;background:rgba(0,0,0,.42);border:2px solid rgba(255,255,255,.9);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}',
    '.sc-sel svg{opacity:0}.sc-t.on .sc-sel{background:#29b6f6;border-color:#fff}.sc-t.on .sc-sel svg{opacity:1}',
    '.sc-t.out{opacity:.35;cursor:default}.sc-t.out .sc-sel{display:none}',
    '.sc-tog{margin:14px 2px 8px;font-size:13px;opacity:.7;background:none;border:0;color:inherit;cursor:pointer;padding:0;text-decoration:underline}',
    '.sc-pv{position:absolute;inset:0;z-index:12;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:30px 24px;text-align:center;background:rgba(6,10,18,.84);-webkit-backdrop-filter:blur(24px);backdrop-filter:blur(24px)}',
    '.sc-pv .dv-art{width:min(52vw,220px);aspect-ratio:2/3;border-radius:16px;box-shadow:0 20px 50px rgba(0,0,0,.5)}.sc-pv .dv-art.drawn{padding:12px}.sc-pv .dv-art.drawn b{font-size:20px}',
    '.sc-pv h3{margin:0;font-size:21px;font-weight:800}.sc-pv .meta{opacity:.65;font-size:14px}.sc-pv .row{display:flex;gap:10px;flex-wrap:wrap;justify-content:center}',
    '.sc-final{display:flex;flex-wrap:wrap;justify-content:center;gap:12px;margin:4px 0 6px}',
    '.sc-final .it{width:96px;text-align:center;cursor:pointer}.sc-final .dv-art{width:96px;aspect-ratio:2/3;border-radius:12px;box-shadow:0 10px 24px rgba(0,0,0,.4)}.sc-final .dv-art.drawn{padding:7px}.sc-final .dv-art.drawn b{font-size:12.5px}',
    '.sc-final .it span{display:block;font-size:12.5px;font-weight:650;margin-top:5px;line-height:1.2}',
    '.sc-round{padding:10px 12px;border-radius:14px;margin-bottom:6px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1)}',
    '.sc-round summary{cursor:pointer;font-weight:650;font-size:14px}.sc-round summary small{opacity:.6;font-weight:500;margin-left:6px}',
    '.sc-round .ls{font-size:13px;line-height:1.5;margin-top:6px}.sc-round .ls span{opacity:.45}',
    '.sc-note{width:100%;box-sizing:border-box;min-height:80px;padding:10px 12px;border-radius:12px;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.07);color:inherit;font:inherit;resize:vertical;outline:none}',
    '.sc-chk{display:flex;align-items:center;gap:8px;font-size:13.5px;margin:8px 2px;cursor:pointer}',
    '.sc-cfg input.dv-q{margin-top:8px}',
    '.sc-cmp{padding:10px 12px;border-radius:14px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);font-size:14px;line-height:1.45}',
    '.sc-cmp-l{margin-bottom:6px}.sc-cmp-l em{display:block;font-style:normal;font-size:12px;font-weight:650;opacity:.6}.sc-cmp p{margin:4px 0 0;font-size:12.5px;opacity:.55}',
    'html.kn-light .sc-cmp{background:rgba(255,255,255,.8);border-color:rgba(0,0,0,.08)}',
    'html.kn-light .sc-round{background:rgba(255,255,255,.8);border-color:rgba(0,0,0,.08)}html.kn-light .sc-note{background:rgba(255,255,255,.85);border-color:rgba(0,0,0,.1)}html.kn-light .sc-pv{background:rgba(240,243,248,.9)}',
    '@media (min-width:700px){.sc-grid{grid-template-columns:repeat(auto-fill,minmax(128px,1fr))}}'
  ].join('\n');
  function css() { if (document.getElementById('sc-css')) return; var s = document.createElement('style'); s.id = 'sc-css'; s.textContent = CSS; document.head.appendChild(s); }

  // ---------------------------------------------------------------- configure (rounds + title)
  function configure(kind, src, items, json, tpl) {
    css();
    if (items.length < 3 && kind !== 'what-matters') { X.toast('This needs at least 3 items.'); return; }   // What Truly Matters? lets you add your own
    var auto = autoLimits(items.length), fromJson = json && parseLimits(json.limits, items.length);
    ui.sc = { kind: kind, src: src, items: items, tpl: tpl || null, theme: themeOf(kind, src),
      limits: fromJson || (tpl && parseLimits(tpl.limits, items.length)) || auto, auto: auto,
      title: (tpl && tpl.title) || (function () { var t = templatesOf(kind).filter(function (x) { return x.id === themeOf(kind, src); })[0]; return t ? t.title : (kind === 'desert-island' ? 'Desert Island — ' : '') + src.title; })(),
      noun: (tpl && tpl.noun) || (templatesOf(kind).filter(function (x) { return x.id === themeOf(kind, src); })[0] || {}).noun || 'items',
      question: (tpl && tpl.question) || (templatesOf(kind).filter(function (x) { return x.id === themeOf(kind, src); })[0] || {}).question || null };
    if (kind === 'what-matters') { if (!tpl && ui.sc.title === src.title) ui.sc.title = 'What matters — ' + src.title; return wmConfig(); }
    quiet(false); drawConfig();
  }
  function drawConfig() {
    var c = ui.sc, n = c.items.length; ui.view = 'sc-config'; X.head(c.kind === 'desert-island' ? 'My Desert Island' : 'What Truly Matters?', 'home');
    var opts = [c.auto, [Math.min(5, n - 1)], [Math.min(3, n - 1)]].filter(function (a, i, all) { return a.length && all.findIndex(function (b) { return b.join() === a.join(); }) === i; });
    X.ui.body.innerHTML = '<div class="sc-cfg"><div class="dv-h">' + n + ' ' + esc(c.noun) + '</div><div class="dv-chips" style="max-height:90px;overflow:hidden">' + c.items.slice(0, 24).map(function (x) { return '<span class="dv-chip" style="cursor:default">' + esc(x.title) + '</span>'; }).join('') + (n > 24 ? '<span class="dv-chip" style="cursor:default">+' + (n - 24) + '</span>' : '') + '</div>' +
      '<div class="dv-h">Rounds</div><div class="dv-chips">' + opts.map(function (a) { return '<button type="button" class="dv-chip' + (a.join() === c.limits.join() ? ' on' : '') + '" data-sclim="' + a.join(',') + '">' + n + ' → ' + a.join(' → ') + '</button>'; }).join('') + '</div>' +
      '<input class="dv-q" data-sccustom placeholder="Your own, e.g. ' + esc(c.auto.join(', ')) + '" value="' + esc(opts.some(function (a) { return a.join() === c.limits.join(); }) ? '' : c.limits.join(', ')) + '">' +
      '<p class="dv-note">Each round keeps fewer than the one before. Final: ' + c.limits[c.limits.length - 1] + ' ' + esc(c.noun) + '.</p>' +
      '<div class="dv-h">Save as</div><input class="dv-q" data-sctitle value="' + esc(c.title) + '" maxlength="90"></div>';
    X.foot('<button type="button" class="dv-go" data-scstart>Start</button>');
  }
  function start() {
    var c = ui.sc, s = X.create(c.kind, c.src, c.items, { noun: c.noun, question: c.question || null }, (c.title || '').trim() || c.src.title);
    s.limits = c.limits.slice(); s.rounds = []; s.theme = c.theme; s.template = c.tpl ? { id: c.tpl.id, version: c.tpl.version || 1 } : null; s.status = 'in-progress'; s.notes = null;
    X.put(s); round(s.id);
  }

  // ---------------------------------------------------------------- a round
  function round(id, r) {
    var s = X.get(id); if (!s) return X.home(); css(); ui.sid = id; closePv();
    var nz = normalize(s); if (r == null) { if (nz.at >= s.limits.length) return result(id); r = nz.at; }
    if (s.tool === 'what-matters') return wmRound(s, r);
    ui.scr = r; ui.view = 'sc-round'; X.head(s.title, 'home');
    var lim = s.limits[r], kept = s.rounds[r] || [], p = pool(s, r), last = r === s.limits.length - 1, full = kept.length >= lim;
    var outs = r ? s.items.filter(function (x) { return p.indexOf(x.id) < 0; }) : [];
    var question = s.tool === 'desert-island' ? 'If you could only keep ' + lim + ' ' + (s.config.noun || 'items') + '…' : (s.config.question || 'What matters most?');
    X.ui.body.innerHTML = '<div class="sc-scene">' + ISLAND(lim, kept.length) + '<span class="lbl">' + (last ? 'Final round' : 'Round ' + (r + 1) + ' of ' + s.limits.length) + '</span></div>' +
      '<div class="sc-ask">' + esc(question) + '</div><p class="sc-left">' + (kept.length >= lim ? 'All ' + lim + ' places taken — tap one to swap it out.' : '<b>' + (lim - kept.length) + '</b> of ' + lim + ' place' + (lim === 1 ? '' : 's') + ' left · tap ○ to keep, the picture to look closer') + '</p>' +
      '<div class="sc-grid">' + p.map(function (iid) { var it = X.itemById(s, iid); if (!it) return ''; var on = kept.indexOf(iid) >= 0, v = X.view(it);
        return '<div class="sc-t' + (on ? ' on' : full ? ' full' : '') + '" data-scpv="' + esc(iid) + '">' + X.art(it) + '<button type="button" class="sc-sel" data-sck="' + esc(iid) + '" aria-pressed="' + on + '" aria-label="' + (on ? 'Let go of ' : 'Keep ') + esc(v.title) + '">' + CHECK + '</button>' + (v.img ? '<p>' + esc(v.title) + '</p>' : '') + '</div>'; }).join('') + '</div>' +
      (outs.length ? '<button type="button" class="sc-tog" data-scouts>' + (ui.showOut ? 'Hide' : 'Show') + ' the ' + outs.length + ' left behind earlier</button>' + (ui.showOut ? '<div class="sc-grid">' + outs.map(function (it) { return '<div class="sc-t out">' + X.art(it) + '<p>' + esc(X.view(it).title) + '</p></div>'; }).join('') + '</div>' : '') : '');
    X.foot((r ? '<button type="button" class="dv-go sec" data-scprev>Back</button>' : '') + '<button type="button" class="dv-go" data-scnext' + (kept.length === lim ? '' : ' disabled') + '>' + (kept.length === lim ? (last ? 'See my island' : 'Next round · keep ' + s.limits[r + 1]) : 'Choose ' + (lim - kept.length) + ' more') + '</button>');
  }
  function toggle(iid) {
    var s = X.get(ui.sid), r = ui.scr, kept = s.rounds[r] = s.rounds[r] || [], k = kept.indexOf(iid);
    if (k >= 0) kept.splice(k, 1);
    else if (s.tool === 'what-matters') { if (kept.length >= s.limits[r]) { X.toast('You’ve chosen ' + s.limits[r] + ' — let one go first.'); return; } kept.push(iid); }   // quiet: no haptics
    else { if (kept.length >= s.limits[r]) { X.toast('All places are taken — let one go first.'); X.hap('warning'); return; } kept.push(iid); X.hap('selection'); }
    if (s.status === 'completed') { s.status = 'in-progress'; }
    var nz = normalize(s); X.put(s);
    var y = X.ui.body.scrollTop; round(s.id, r); X.ui.body.scrollTop = y;
    if (nz.trimmed.some(function (t) { return t > r; })) X.toast('Later rounds changed too — have another look there.');
  }
  function next() {
    var s = X.get(ui.sid), r = ui.scr; if ((s.rounds[r] || []).length !== s.limits[r]) return;
    var nz = normalize(s);
    if (r === s.limits.length - 1 || nz.at >= s.limits.length) { if (nz.at >= s.limits.length) { s.status = 'completed'; s.finalIds = s.rounds[s.limits.length - 1].slice(); s.completedAt = Date.now(); X.put(s); if (s.tool === 'what-matters') return s.reflected ? result(s.id) : reflect(s.id); X.hap('success'); return result(s.id); } return round(s.id, nz.at); }
    X.put(s); X.ui.body.scrollTop = 0; round(s.id, r + 1);
  }
  // a closer look (and back to the original card)
  function closePv() { if (ui.scpv) { ui.scpv.remove(); ui.scpv = null; } }
  function preview(iid) {
    var s = X.get(ui.sid), it = X.itemById(s, iid); if (!it) return; var v = X.view(it), on = (s.rounds[ui.scr] || []).indexOf(iid) >= 0;
    var pv = document.createElement('div'); pv.className = 'sc-pv';
    pv.innerHTML = X.art(it) + '<h3>' + esc(v.title) + '</h3>' + (v.sub ? '<div class="meta">' + esc(v.sub) + '</div>' : '') +
      '<div class="row"><button type="button" class="dv-go" style="flex:0 0 auto;padding:0 22px" data-scpvk="' + esc(iid) + '">' + (on ? 'Let it go' : 'Keep it') + '</button>' + (it.ref ? '<button type="button" class="dv-go sec" data-scorig="' + esc(iid) + '">Open the card</button>' : '') + '<button type="button" class="dv-go sec" data-scpvx>Close</button></div>';
    X.ui.el.appendChild(pv); ui.scpv = pv;
  }
  function openOriginal(it) {
    if (!it || !it.ref) return; var b = X.boardById(it.ref.bid), L = b && X.locateCard(b, it.ref.id); if (!L) return X.toast('That card is not there any more.');
    X.close(); setTimeout(function () { try { MinestAI.openCardIn(it.ref.bid, L.col.id, L.card.id); } catch (e) {} }, 220);
  }

  // ---------------------------------------------------------------- results
  function result(id) {
    var s = X.get(id); if (!s) return X.home(); css(); ui.sid = id; ui.view = 'sc-result'; closePv();
    if (s.tool === 'what-matters') return wmResult(s);
    quiet(false);
    var fin = s.finalIds || s.rounds[s.limits.length - 1] || [], island = s.tool === 'desert-island';
    X.head(island ? 'My Desert Island' : 'What Truly Matters', 'home');
    X.ui.body.innerHTML = (island ? '<div class="sc-scene">' + ISLAND(fin.length, fin.length) + '<span class="lbl">' + esc(X.day(s.completedAt || s.updatedAt)) + '</span></div>' : '') +
      '<div class="sc-ask" style="text-align:center">' + esc(s.title) + '</div><p class="sc-left" style="text-align:center">' + s.items.length + ' → ' + s.limits.join(' → ') + '</p>' +
      '<div class="sc-final">' + fin.map(function (iid) { var it = X.itemById(s, iid); return it ? '<div class="it" data-scopen="' + esc(iid) + '">' + X.art(it) + '<span>' + esc(X.view(it).title) + '</span></div>' : ''; }).join('') + '</div>' +
      '<div class="dv-h">Each round</div>' + s.limits.map(function (lim, r) { var p = pool(s, r), kept = s.rounds[r] || [], gone = p.filter(function (x) { return kept.indexOf(x) < 0; });
        return '<details class="sc-round"><summary>' + (r === s.limits.length - 1 ? 'Final round' : 'Round ' + (r + 1)) + '<small>kept ' + kept.length + ' of ' + p.length + '</small></summary><div class="ls">' + kept.map(function (x) { return esc(X.view(X.itemById(s, x) || { title: '?' }).title); }).join(', ') + (gone.length ? '<br><span>Left behind: ' + gone.map(function (x) { return esc(X.view(X.itemById(s, x) || { title: '?' }).title); }).join(', ') + '</span>' : '') + '</div></details>'; }).join('') +
      '<div class="dv-h">My note <span style="text-transform:none;letter-spacing:0;opacity:.8">(optional)</span></div><textarea class="sc-note" data-scnote placeholder="Anything you want to remember about these choices…">' + esc((s.notes && s.notes.note) || '') + '</textarea>' +
      (s.notes && s.notes.note ? '<button type="button" class="sc-tog" data-scdelnote>Delete my note</button>' : '') +
      '<label class="sc-chk"><input type="checkbox" data-scincl' + (s.notes && s.notes.include ? ' checked' : '') + '> Include my note when saving to My Essentials</label>' +
      '<p class="dv-note">These are this day’s choices — not a rule about what you like. Play again any time.</p>' + compareHtml(s) +
      (s.saved ? '<p class="dv-note">Saved to My Essentials ✓ (' + esc(X.day(s.saved.at)) + ')</p>' : '') +
      '<div class="dv-chips" style="margin-top:6px"><button type="button" class="dv-chip" data-scedit>Edit choices</button><button type="button" class="dv-chip" data-scagain>Replay</button>' + (s.source && s.source.bid ? '<button type="button" class="dv-chip" data-scsrc>Back to the list</button>' : '') + '<button type="button" class="dv-chip" data-export>Export JSON</button><button type="button" class="dv-chip" data-del style="color:#ff6b6b">Delete</button></div>';
    X.foot('<button type="button" class="dv-go" data-scsave>' + (s.saved ? 'Update in My Essentials' : 'Save to My Essentials') + '</button>');
  }
  function saveNote(text, include) {
    var s = X.get(ui.sid); if (!s) return; var t = String(text == null ? ((s.notes || {}).note || '') : text).slice(0, 4000);
    var ans = s.notes && s.notes.answers && s.notes.answers.some(Boolean);
    s.notes = t || include || ans ? Object.assign({}, s.notes || {}, { note: t, include: include == null ? !!(s.notes && s.notes.include) : !!include, at: Date.now() }) : null; X.put(s);
  }
  function saveEssentials(msg) {
    var s = X.get(ui.sid), fin = s.finalIds || [], d = X.day(s.completedAt || s.updatedAt);
    var ranked = fin.map(function (iid) { return { item: X.itemById(s, iid), note: 'Kept · ' + d }; }).filter(function (x) { return x.item; });
    var sum = (s.tool === 'desert-island' ? 'My Desert Island' : 'What Truly Matters?') + ' · ' + d + '\n' + s.items.length + ' → ' + s.limits.join(' → ') + (s.notes && s.notes.include && s.notes.note ? '\n\n' + s.notes.note : '') +
      (s.notes && s.notes.include && s.notes.answers ? s.notes.answers.map(function (a, i) { return a ? '\n\n' + QUESTIONS[i] + '\n' + a : ''; }).join('') : '');
    X.addToWorld(s, ranked, sum, { id: 'essentials', title: 'My Essentials', color: '#00a6a6' }).then(function () { X.toast(msg || 'Saved to My Essentials'); result(s.id); }).catch(function (e) { X.toast('✗ ' + e.message); });
  }

  // the same theme played before: what stayed, what is new, what wasn't chosen this time (only that — never "no longer matters")
  function compareHtml(s) {
    if (s.status !== 'completed' || !s.theme) return '';
    var prev = X.all().filter(function (x) { return x.id !== s.id && x.tool === s.tool && x.theme === s.theme && x.status === 'completed' && (x.completedAt || 0) < (s.completedAt || Infinity); })
      .sort(function (a, b) { return (b.completedAt || 0) - (a.completedAt || 0); })[0];
    if (!prev) return '';
    function names(x) { return (x.finalIds || []).map(function (iid) { var it = X.itemById(x, iid); return it ? X.view(it).title : null; }).filter(Boolean); }
    var a = names(prev), b = names(s), low = function (l) { return l.map(function (v) { return String(v).toLowerCase(); }); }, la = low(a), lb = low(b);
    var still = b.filter(function (v) { return la.indexOf(v.toLowerCase()) >= 0; }), fresh = b.filter(function (v) { return la.indexOf(v.toLowerCase()) < 0; }), not = a.filter(function (v) { return lb.indexOf(v.toLowerCase()) < 0; });
    var line = function (h, l) { return l.length ? '<div class="sc-cmp-l"><em>' + h + '</em>' + l.map(esc).join(', ') + '</div>' : ''; };
    return '<div class="dv-h">Compared with ' + esc(X.day(prev.completedAt || prev.updatedAt)) + '</div><div class="sc-cmp">' +
      line(s.tool === 'what-matters' ? 'Still important' : 'Kept again', still) + line('Newly chosen', fresh) + line('Not chosen this time', not) +
      '<p>“Not chosen this time” only means it wasn’t in this list today.</p></div>';
  }

  // ---------------------------------------------------------------- clicks
  function click(t) {
    if (!/^sc-/.test(ui.view || '') || X.ui.view === 'home') return false;
    var g;
    if (ui.scpv && (t.closest('[data-scpvx]') || t === ui.scpv)) { closePv(); return true; }
    if ((g = t.closest('[data-scpvk]'))) { closePv(); toggle(g.getAttribute('data-scpvk')); return true; }
    if ((g = t.closest('[data-scorig]')) || (g = t.closest('[data-scopen]'))) { var s0 = X.get(ui.sid), it0 = X.itemById(s0, g.getAttribute('data-scorig') || g.getAttribute('data-scopen')); if (it0 && it0.ref) openOriginal(it0); else if (g.hasAttribute('data-scorig')) X.toast('This one comes from a template, not a card.'); return true; }
    if ((g = t.closest('[data-sck]'))) { toggle(g.getAttribute('data-sck')); return true; }
    if ((g = t.closest('[data-scpv]'))) { preview(g.getAttribute('data-scpv')); return true; }
    if (t.closest('[data-scouts]')) { ui.showOut = !ui.showOut; var y = X.ui.body.scrollTop; round(ui.sid, ui.scr); X.ui.body.scrollTop = y; return true; }
    if (t.closest('[data-scnext]')) { next(); return true; }
    if (t.closest('[data-scprev]')) { X.ui.body.scrollTop = 0; round(ui.sid, Math.max(0, ui.scr - 1)); return true; }
    if ((g = t.closest('[data-sclim]'))) { ui.sc.limits = g.getAttribute('data-sclim').split(',').map(Number); drawConfig(); return true; }
    if (t.closest('[data-scstart]')) {
      var cu = X.ui.body.querySelector('[data-sccustom]').value.trim(), ti = X.ui.body.querySelector('[data-sctitle]').value;
      if (cu) { var L = parseLimits(cu, ui.sc.items.length); if (!L) { X.toast('Rounds must keep fewer each time, and fewer than ' + ui.sc.items.length + '.'); return true; } ui.sc.limits = L; }
      ui.sc.title = ti; start(); return true;
    }
    if (t.closest('[data-scedit]')) { var s1 = X.get(ui.sid); s1.status = 'in-progress'; X.put(s1); round(s1.id, 0); return true; }
    if (t.closest('[data-scagain]')) { var s2 = X.get(ui.sid); ui.sc = { kind: s2.tool, src: s2.source, items: s2.items, tpl: s2.template ? tplById(s2.tool === 'desert-island' ? 'desertIsland' : 'whatMatters', s2.template.id) : null, theme: s2.theme, limits: s2.limits.slice(), auto: autoLimits(s2.items.length), title: s2.title.replace(/ — \d{4}$/, ''), noun: s2.config.noun, question: s2.config.question || null }; start(); return true; }
    if (t.closest('[data-scsrc]')) { var s3 = X.get(ui.sid), src = s3.source; X.close(); setTimeout(function () { if (window.MinestCapture && src.kind === 'card') { try { MinestCapture.open({ wbid: src.bid }); } catch (e) {} } else if (window.MinestContents && MinestContents.goTo) MinestContents.goTo({ b: src.bid, l: src.kind === 'list' ? src.id : null }, { label: 'Discover', open: function () { D.open(); } }); }, 220); return true; }
    if (t.closest('[data-scsave]')) { var ta = X.ui.body.querySelector('[data-scnote]'), ch = X.ui.body.querySelector('[data-scincl]'); saveNote(ta ? ta.value : null, ch ? ch.checked : false); saveEssentials(); return true; }
    if (t.closest('[data-scdelnote]')) { var s4 = X.get(ui.sid), wasIn = s4.notes && s4.notes.include; s4.notes = null; X.put(s4); if (s4.saved && wasIn) saveEssentials('Note deleted — also from My Essentials'); else { X.toast('Note deleted'); result(s4.id); } return true; }
    if (t.closest('[data-scincl]')) { setTimeout(function () { var c = X.ui.body.querySelector('[data-scincl]'), ta2 = X.ui.body.querySelector('[data-scnote]'); saveNote(ta2 ? ta2.value : null, c.checked); }, 0); return false; }
    return false;
  }
  // the note is kept as it is typed (only on this result; nothing else reads it)
  document.addEventListener('input', function (e) { if (e.target && e.target.matches && e.target.matches('[data-scnote]') && ui.view === 'sc-result') { clearTimeout(ui.noteT); var v = e.target.value; ui.noteT = setTimeout(function () { saveNote(v, null); }, 400); } });
  function key(e) { if (e.key === 'Escape' && ui.scpv) { closePv(); e.stopPropagation(); return true; } return false; }

  // ================================================================== What Truly Matters? — the same engine, a quiet page
  // (no win / lose animation, no sounds, no countdown, no haptics; every question can be skipped)
  var HORIZON = '<svg viewBox="0 0 320 80" preserveAspectRatio="xMidYMax meet" width="100%" height="80"><defs><linearGradient id="wmsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2c3550"/><stop offset="1" stop-color="#5d6a8a"/></linearGradient><radialGradient id="wmsun" cx=".5" cy="1" r=".6"><stop offset="0" stop-color="#ffe9c4" stop-opacity=".95"/><stop offset="1" stop-color="#ffe9c4" stop-opacity="0"/></radialGradient></defs>' +
    '<rect width="320" height="80" fill="url(#wmsky)"/><ellipse cx="160" cy="80" rx="120" ry="46" fill="url(#wmsun)"/><circle cx="160" cy="80" r="14" fill="#fff3dc" opacity=".9"/><path d="M0 80h320" stroke="#e9e3d6" stroke-width="1" opacity=".7"/><path d="M160 80 150 56M160 80l10-24M160 80l-26-16M160 80l26-16" stroke="#fff3dc" stroke-width=".8" opacity=".35"/></svg>';
  var QUESTIONS = ['Why does this matter to me?', 'What does this say about what I want to prioritize?', 'Is there something I want to do differently?'];
  var ABOUT = 'Inspired by Martin Heidegger’s Being and Time: noticing that our time is limited can help us see our own possibilities — and our choices — more clearly. Here it is simply a quiet way to notice what you care about. There are no right answers, nothing is scored, and you can stop or skip at any point.';
  var WCSS = [
    '.dv.quiet{background:linear-gradient(180deg,rgba(32,38,56,.96),rgba(18,21,32,.98))}',
    '.dv.quiet .dv-go{background:linear-gradient(180deg,#e9e3d6,#cfc6b4);color:#1f2433;box-shadow:none;border-color:rgba(255,255,255,.4)}.dv.quiet .dv-go.sec{background:rgba(255,255,255,.08);color:inherit}',
    '.dv.quiet .dv-chip.on{background:#e9e3d6;color:#1f2433;border-color:#e9e3d6}',
    '.wm-scene{margin:0 -14px 14px;background:linear-gradient(180deg,#2c3550,#5d6a8a)}.wm-scene svg{display:block}',
    '.wm-q{font:500 23px/1.3 Georgia,"Times New Roman",serif;letter-spacing:-.2px;margin:2px 2px 6px}',
    '.wm-sub{font-size:13.5px;opacity:.6;margin:0 2px 14px}',
    '.wm-list{display:flex;flex-direction:column;gap:8px}',
    '.wm-row{display:flex;align-items:center;gap:12px;width:100%;text-align:left;padding:14px 14px;border-radius:16px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.04);color:inherit;font:inherit;cursor:pointer}',
    '.wm-row b{flex:1;min-width:0;font:500 17px/1.3 Georgia,"Times New Roman",serif}.wm-row small{display:block;font:12px -apple-system,system-ui,sans-serif;opacity:.5;margin-top:2px}',
    '.wm-row i{flex:none;width:24px;height:24px;border-radius:50%;border:1.5px solid rgba(233,227,214,.6);display:grid;place-items:center;font-style:normal;color:#1f2433}',
    '.wm-row.on{background:rgba(233,227,214,.1);border-color:rgba(233,227,214,.45)}.wm-row.on i{background:#e9e3d6;border-color:#e9e3d6}',
    '.wm-row.full{opacity:.55}.wm-row.out{opacity:.3;cursor:default}',
    '.wm-chip{display:inline-flex;align-items:center;gap:6px}.wm-chip button{border:0;background:none;color:inherit;opacity:.55;cursor:pointer;padding:0 0 0 2px;font-size:15px}',
    '.wm-add{display:flex;gap:8px;margin-top:10px}.wm-add input{flex:1;min-width:0;height:42px;padding:0 12px;border-radius:12px;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.06);color:inherit;font:inherit;outline:none}',
    '.wm-add button{height:42px;padding:0 14px;border-radius:12px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.1);color:inherit;font:600 14px -apple-system,system-ui,sans-serif;cursor:pointer}',
    '.wm-final{display:flex;flex-direction:column;gap:6px;margin:8px 0 6px}.wm-final div{padding:16px;border-radius:16px;background:rgba(233,227,214,.08);border:1px solid rgba(233,227,214,.25);font:500 20px/1.25 Georgia,"Times New Roman",serif;text-align:center}',
    '.wm-ref label{display:block;font:500 16px/1.35 Georgia,"Times New Roman",serif;margin:16px 2px 8px}',
    '.wm-about{margin:14px 2px;font-size:13px;opacity:.75}.wm-about summary{cursor:pointer;opacity:.85}',
    '.wm-said{white-space:pre-line;padding:10px 12px;border-radius:12px;background:rgba(255,255,255,.05);font-size:14.5px;margin-bottom:6px}.wm-said em{display:block;font-style:normal;font-size:12px;opacity:.55;margin-bottom:3px}',
    'html.kn-light .dv.quiet{background:linear-gradient(180deg,rgba(243,240,233,.97),rgba(232,228,219,.98))}html.kn-light .dv.quiet .dv-go{background:#2c3550;color:#f3f0e9}',
    'html.kn-light .wm-row{background:rgba(255,255,255,.7);border-color:rgba(0,0,0,.08)}html.kn-light .wm-row.on{background:rgba(44,53,80,.08);border-color:rgba(44,53,80,.35)}html.kn-light .wm-row i{border-color:rgba(44,53,80,.5);color:#fff}html.kn-light .wm-row.on i{background:#2c3550}',
    'html.kn-light .wm-final div{background:rgba(255,255,255,.75);border-color:rgba(44,53,80,.2)}html.kn-light .wm-add input,html.kn-light .wm-said{background:rgba(255,255,255,.8);border-color:rgba(0,0,0,.1)}'
  ].join('\n');
  function quiet(on) { if (!document.getElementById('wm-css')) { var st = document.createElement('style'); st.id = 'wm-css'; st.textContent = WCSS; document.head.appendChild(st); } if (X.ui.el) X.ui.el.classList.toggle('quiet', !!on); }
  // gather: the template's options, minus any the user takes out, plus their own
  function wmConfig() {
    var c = ui.sc; quiet(true); ui.view = 'sc-config'; X.head('What Truly Matters?', 'home');
    var n = c.items.length, ok = n >= 3;
    if (!c.custom) c.limits = autoLimits(n);
    X.ui.body.innerHTML = '<div class="wm-scene">' + HORIZON + '</div><div class="wm-q">' + esc(c.question || 'What matters most to me?') + '</div>' +
      '<p class="wm-sub">' + (c.tpl && c.tpl.id === 'unfinished-dreams' ? 'From your own dreams, goals and bucket list — or write new ones. You can skip this one.' : 'Take out anything that isn’t yours, and add your own.') + '</p>' +
      '<div class="dv-chips">' + c.items.map(function (x) { return '<span class="dv-chip wm-chip" style="cursor:default">' + esc(x.title) + '<button type="button" data-wmrm="' + esc(x.id) + '" aria-label="Take out ' + esc(x.title) + '">×</button></span>'; }).join('') + '</div>' +
      '<div class="wm-add"><input data-wmown maxlength="60" placeholder="' + (c.tpl && c.tpl.id === 'unfinished-dreams' ? 'Something I’d regret never trying…' : 'Add my own…') + '" autocomplete="off"><button type="button" data-wmadd>Add</button></div>' +
      (ok ? '<div class="dv-h">Rounds</div><div class="dv-chips">' + [autoLimits(n), [Math.min(5, n - 1)], [Math.min(3, n - 1)]].filter(function (a, i, all) { return a.length && all.findIndex(function (b) { return b.join() === a.join(); }) === i; }).map(function (a) { return '<button type="button" class="dv-chip' + (a.join() === c.limits.join() ? ' on' : '') + '" data-wmlim="' + a.join(',') + '">' + n + ' → ' + a.join(' → ') + '</button>'; }).join('') + '</div>' : '<p class="dv-note">Add at least ' + (3 - n) + ' more to begin.</p>') +
      '<div class="dv-h">Save as</div><input class="dv-q" data-sctitle value="' + esc(c.title) + '" maxlength="90">' +
      '<details class="wm-about"><summary>About this reflection</summary><p>' + esc(ABOUT) + '</p></details>';
    X.foot((c.tpl && c.tpl.optional ? '<button type="button" class="dv-go sec" data-wmskip>Skip this one</button>' : '') + '<button type="button" class="dv-go" data-wmstart' + (ok ? '' : ' disabled') + '>Begin</button>');
  }
  function wmRound(s, r) {
    quiet(true); ui.scr = r; ui.view = 'sc-round'; X.head(s.title, 'home');
    var lim = s.limits[r], kept = s.rounds[r] || [], p = pool(s, r), last = r === s.limits.length - 1, full = kept.length >= lim;
    X.ui.body.innerHTML = '<div class="wm-scene">' + HORIZON + '</div><div class="wm-q">' + esc(s.config.question || 'What matters most to me?') + '</div>' +
      '<p class="wm-sub">' + (last ? 'Last step · ' : 'Step ' + (r + 1) + ' of ' + s.limits.length + ' · ') + 'keep ' + lim + (kept.length < lim ? ' — ' + (lim - kept.length) + ' to go' : ' — tap one to change it') + '</p>' +
      '<div class="wm-list">' + p.map(function (iid) { var it = X.itemById(s, iid); if (!it) return ''; var on = kept.indexOf(iid) >= 0, v = X.view(it);
        return '<button type="button" class="wm-row' + (on ? ' on' : full ? ' full' : '') + '" data-sck="' + esc(iid) + '" aria-pressed="' + on + '"><b>' + esc(v.title) + (it.own ? '<small>my own</small>' : v.sub && it.ref ? '<small>' + esc(v.sub) + '</small>' : '') + '</b><i>' + (on ? CHECK : '') + '</i></button>'; }).join('') + '</div>';
    X.foot((r ? '<button type="button" class="dv-go sec" data-scprev>Back</button>' : '') + '<button type="button" class="dv-go" data-scnext' + (kept.length === lim ? '' : ' disabled') + '>' + (kept.length === lim ? (last ? 'Continue' : 'Next') : 'Keep ' + (lim - kept.length) + ' more') + '</button>');
  }
  // final reflection: three optional questions, any can stay empty
  function reflect(id) {
    var s = X.get(id); if (!s) return X.home(); quiet(true); ui.sid = id; ui.view = 'sc-reflect'; X.head('A moment to reflect', 'home');
    var n = s.notes || {}, fin = s.finalIds || [];
    X.ui.body.innerHTML = '<div class="wm-final">' + fin.map(function (iid) { var it = X.itemById(s, iid); return it ? '<div>' + esc(X.view(it).title) + '</div>' : ''; }).join('') + '</div>' +
      '<p class="wm-sub" style="text-align:center">Only if you want to. Nothing here is required, and it stays private.</p><div class="wm-ref">' +
      QUESTIONS.map(function (q, i) { return '<label for="wmq' + i + '">' + esc(q) + '</label><textarea class="sc-note" id="wmq' + i + '" data-wmq="' + i + '" placeholder="A word, a sentence, or nothing at all">' + esc((n.answers || [])[i] || '') + '</textarea>'; }).join('') + '</div>';
    X.foot('<button type="button" class="dv-go sec" data-wmrskip>Skip</button><button type="button" class="dv-go" data-wmrdone>Done</button>');
  }
  function keepAnswers(save) {
    var s = X.get(ui.sid); if (!s) return; var a = [].slice.call(X.ui.body.querySelectorAll('[data-wmq]')).map(function (t) { return String(t.value || '').trim().slice(0, 4000); });
    var any = a.some(Boolean); s.reflected = true;
    s.notes = any ? Object.assign({}, s.notes || {}, { answers: a, at: Date.now(), include: !!(s.notes && s.notes.include) }) : (s.notes && s.notes.note ? Object.assign({}, s.notes, { answers: null }) : null);
    if (save !== false) X.put(s);
  }
  function wmResult(s) {
    quiet(true); ui.view = 'sc-result'; X.head('What Truly Matters', 'home');
    var fin = s.finalIds || [], ans = (s.notes && s.notes.answers) || [];
    X.ui.body.innerHTML = '<div class="wm-scene">' + HORIZON + '</div><div class="wm-q" style="text-align:center">' + esc(s.title) + '</div><p class="wm-sub" style="text-align:center">' + esc(X.day(s.completedAt || s.updatedAt)) + ' · ' + s.items.length + ' → ' + s.limits.join(' → ') + '</p>' +
      '<div class="wm-final">' + fin.map(function (iid) { var it = X.itemById(s, iid); return it ? '<div' + (it.ref ? ' data-scopen="' + esc(iid) + '" style="cursor:pointer"' : '') + '>' + esc(X.view(it).title) + '</div>' : ''; }).join('') + '</div>' +
      '<div class="dv-h">Each step</div>' + s.limits.map(function (lim, r) { var p = pool(s, r), kept = s.rounds[r] || [], gone = p.filter(function (x) { return kept.indexOf(x) < 0; });
        return '<details class="sc-round"><summary>' + (r === s.limits.length - 1 ? 'Last step' : 'Step ' + (r + 1)) + '<small>kept ' + kept.length + ' of ' + p.length + '</small></summary><div class="ls">' + kept.map(function (x) { return esc(X.view(X.itemById(s, x) || { title: '?' }).title); }).join(', ') + (gone.length ? '<br><span>Not this time: ' + gone.map(function (x) { return esc(X.view(X.itemById(s, x) || { title: '?' }).title); }).join(', ') + '</span>' : '') + '</div></details>'; }).join('') +
      '<div class="dv-h">My reflection</div>' + (ans.some(Boolean) ? QUESTIONS.map(function (q, i) { return ans[i] ? '<div class="wm-said"><em>' + esc(q) + '</em>' + esc(ans[i]) + '</div>' : ''; }).join('') +
        '<div class="dv-chips" style="margin:6px 0 4px"><button type="button" class="dv-chip" data-wmredit>Edit</button><button type="button" class="dv-chip" data-wmrdel style="color:#ff6b6b">Delete my reflection</button></div>' +
        '<label class="sc-chk"><input type="checkbox" data-scincl' + (s.notes && s.notes.include ? ' checked' : '') + '> Include my reflection when saving to My Essentials</label>'
        : '<p class="dv-note">No reflection — that’s fine. <button type="button" class="sc-tog" style="margin:0" data-wmredit>Add one</button></p>') +
      '<p class="dv-note">This is what you chose today. Something not chosen this time hasn’t stopped mattering.</p>' + compareHtml(s) +
      (s.saved ? '<p class="dv-note">Saved to My Essentials ✓ (' + esc(X.day(s.saved.at)) + ')</p>' : '') +
      '<details class="wm-about"><summary>About this reflection</summary><p>' + esc(ABOUT) + '</p></details>' +
      '<div class="dv-chips" style="margin-top:6px"><button type="button" class="dv-chip" data-scedit>Edit choices</button><button type="button" class="dv-chip" data-scagain>Again</button><button type="button" class="dv-chip" data-export>Export JSON</button><button type="button" class="dv-chip" data-del style="color:#ff6b6b">Delete</button></div>';
    X.foot('<button type="button" class="dv-go" data-scsave>' + (s.saved ? 'Update in My Essentials' : 'Save to My Essentials') + '</button>');
  }
  function wmClick(t) {
    var g, c = ui.sc;
    if ((g = t.closest('[data-wmrm]'))) { var id = g.getAttribute('data-wmrm'); c.items = c.items.filter(function (x) { return x.id !== id; }); X.keep(wmConfig); return true; }
    if (t.closest('[data-wmadd]')) { addOwn(); return true; }
    if ((g = t.closest('[data-wmlim]'))) { c.limits = g.getAttribute('data-wmlim').split(',').map(Number); c.custom = c.limits.join() !== autoLimits(c.items.length).join(); X.keep(wmConfig); return true; }
    if (t.closest('[data-wmskip]')) { X.toast('Skipped — come back any time.'); X.home(); return true; }
    if (t.closest('[data-wmstart]')) { c.title = X.ui.body.querySelector('[data-sctitle]').value; if (c.custom && parseLimits(c.limits, c.items.length) == null) c.limits = autoLimits(c.items.length); start(); return true; }
    if (t.closest('[data-wmrskip]')) { var s0 = X.get(ui.sid); s0.reflected = true; X.put(s0); result(s0.id); return true; }
    if (t.closest('[data-wmrdone]')) { keepAnswers(); result(ui.sid); return true; }
    if (t.closest('[data-wmredit]')) { reflect(ui.sid); return true; }
    if (t.closest('[data-wmrdel]')) {
      var ask = window.MinestKEdit ? MinestKEdit.confirm('Delete your reflection? Your choices stay.', 'Delete') : Promise.resolve(confirm('Delete your reflection?'));
      ask.then(function (ok) { if (!ok) return; var s1 = X.get(ui.sid), wasIn = s1.notes && s1.notes.include; s1.notes = null; X.put(s1); if (s1.saved && wasIn) saveEssentials('Reflection deleted — also from My Essentials'); else { X.toast('Reflection deleted'); result(s1.id); } });
      return true;
    }
    return false;
  }
  function addOwn() {
    var inp = X.ui.body.querySelector('[data-wmown]'), v = inp && String(inp.value || '').trim(); if (!v) return;
    var c = ui.sc, k = v.toLowerCase();
    if (c.items.some(function (x) { return String(x.title).toLowerCase() === k; })) { X.toast('Already on the list.'); return; }
    c.items.push({ id: 'own:' + X.slug(v) + '-' + X.rid().slice(-3), title: v.slice(0, 60), own: true });
    X.keep(wmConfig); var n = X.ui.body.querySelector('[data-wmown]'); if (n) n.focus();
  }

  // ================================================================== the tools
  function kindNow() { if (ui.view === 'sc-config' && ui.sc) return ui.sc.kind; var s = ui.sid && /^sc-/.test(ui.view || '') && X.get(ui.sid); return s ? s.tool : null; }
  D.register({ id: 'desert-island', name: 'My Desert Island', sub: 'What would you keep?', c1: '#4fc3f7', c2: '#1565c0', minItems: 3,
    pv: '<svg viewBox="0 0 120 70" width="120" height="70"><ellipse cx="60" cy="58" rx="40" ry="9" fill="#f8e3b2"/><path d="M44 56c0-14 2-24 7-32" stroke="#7a5230" stroke-width="3" fill="none"/><path d="M51 24c-8-5-18-3-23 2 8-2 15 0 23-2zm0 0c7-7 17-8 23-5-8 0-15 2-23 5zm0 0c-3-8-1-15 3-20-1 7-1 13-3 20z" fill="#5ccf74"/><rect x="62" y="40" width="12" height="16" rx="2" fill="#fff"/><rect x="77" y="44" width="10" height="12" rx="2" fill="#fff" fill-opacity=".75"/><circle cx="98" cy="16" r="7" fill="#fff6c9"/></svg>',
    templates: function () { return templatesOf('desertIsland').map(function (t) { var n = tplItems(t).length; return { id: t.id, title: t.title, sub: 'Template · ' + n + ' ' + (t.noun || 'items'), n: n }; }); },
    fromTemplate: function (id) { var t = tplById('desertIsland', id); if (!t) return; configure('desert-island', { kind: 'template', id: t.id, title: t.title }, tplItems(t), null, t); },
    config: function (src, items, json) { configure('desert-island', src, items, json, null); },
    open: function (s) { css(); quiet(false); ui.showOut = false; return s.status === 'completed' ? result(s.id) : round(s.id); },
    progress: function (s) { var nz = normalize(s); return nz.at >= s.limits.length ? '' : 'Round ' + (nz.at + 1) + '/' + s.limits.length; },
    click: function (t) { return kindNow() === 'desert-island' ? click(t) : false; },
    key: key });
  D.register({ id: 'what-matters', name: 'What Truly Matters?', sub: 'Discover your priorities.', c1: '#6b7798', c2: '#262d45', minItems: 3,
    pv: '<svg viewBox="0 0 120 70" width="120" height="70"><defs><radialGradient id="wmpv" cx=".5" cy="1" r=".7"><stop offset="0" stop-color="#ffe9c4" stop-opacity=".9"/><stop offset="1" stop-color="#ffe9c4" stop-opacity="0"/></radialGradient></defs><ellipse cx="60" cy="52" rx="56" ry="30" fill="url(#wmpv)"/><circle cx="60" cy="52" r="9" fill="#fff3dc"/><path d="M4 52h112" stroke="#f3ecdf" stroke-width="1.2" opacity=".8"/><path d="M60 70 54 52M60 70l6-18" stroke="#f3ecdf" stroke-width="1" opacity=".5"/><circle cx="24" cy="16" r="1.2" fill="#fff" opacity=".7"/><circle cx="92" cy="12" r="1" fill="#fff" opacity=".6"/><circle cx="104" cy="26" r="1.2" fill="#fff" opacity=".5"/></svg>',
    templates: function () { return templatesOf('whatMatters').map(function (t) { var n = tplItems(t).length; return { id: t.id, title: t.title, sub: t.question + (t.optional ? ' · optional' : ''), n: n || '' }; }); },
    fromTemplate: function (id) { var t = tplById('whatMatters', id); if (!t) return; configure('what-matters', { kind: 'template', id: t.id, title: t.title }, tplItems(t), null, t); },
    config: function (src, items, json) { configure('what-matters', src, items, json, null); },
    open: function (s) { css(); quiet(true); return s.status === 'completed' ? result(s.id) : round(s.id); },
    progress: function (s) { var nz = normalize(s); return nz.at >= s.limits.length ? '' : 'Step ' + (nz.at + 1) + '/' + s.limits.length; },
    click: function (t) { return kindNow() === 'what-matters' ? (wmClick(t) || click(t)) : false; },
    key: key });

  window.MinestScarcity = { autoLimits: autoLimits, parseLimits: parseLimits, normalize: normalize, complete: complete, templates: templatesOf, tplItems: tplItems, fromMyLists: fromMyLists, _configure: configure, _round: round, _result: result, _click: click };
})();
