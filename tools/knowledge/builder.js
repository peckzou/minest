/* Minest Knowledge · Custom World Builder — window.MinestBuilder
   Three ways to make a world: Start with a Template (List of Mine), Mix & Match (pick areas / lists from several
   templates into one world), Start from Scratch. Then customize any world:
     Structure — areas (board lists) → categories (section headings) → lists (cards): add, rename, reorder, move,
                 duplicate (structure only), remove, undo. Removing never deletes items unless you say so:
                 "remove from this world" archives the list with its items (restorable from the board's Archive).
     Look      — title, subtitle, colour, icon, cover, default view, layout ('wa:<board>')
     Fields    — per list: the template's fields on / off and your own fields (definitions in 'fd:<board>')
     Template  — save as my template (structure, fields, look — never items, photos or notes), update it,
                 export JSON; exporting with your items is a separate, confirmed choice (private data stays out otherwise).
   Plain ops on the ordinary board — no new database; existing cards are linked, never copied. */
(function () {
  if (window.MinestBuilder) return;
  var A = function () { return window.MinestAI || {}; };
  var KN = function () { return window.MinestKnowledge; };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function slug(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'x'; }
  function rid(p) { return (p || '') + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function toast(m) { try { if (window.GlassUI && GlassUI.toast) GlassUI.toast(m); } catch (e) {} }
  function boards() { try { return (A().boards && A().boards()) || []; } catch (e) { return []; } }
  function boardById(id) { return boards().filter(function (b) { return b.id === id; })[0] || null; }
  function W() { return window.MinestWorld; }
  function tpls() { return W() ? W().templates() : []; }
  function tplById(id) { return tpls().filter(function (t) { return t.id === id; })[0] || null; }
  function sheet(o) { return window.MinestKEdit ? MinestKEdit.sheet(o) : Promise.resolve(null); }
  function confirmBox(text, ok) { return window.MinestKEdit ? MinestKEdit.confirm(text, ok) : Promise.resolve(confirm(text)); }
  var COLORS = ['#0a84ff', '#30b45a', '#f08c3a', '#e8566c', '#9b5de5', '#00a6a6', '#c9a227', '#5d6a8a'];
  var VIEWS = [['home', 'World home'], ['portal', 'Portal'], ['contents', 'Contents'], ['timeline', 'Timeline'], ['map', 'Knowledge Map'], ['kanban', 'Board']];

  // ================================================================== board edits (one update each, with undo)
  var UNDO = [];
  function snapshot(bid) {
    var b = boardById(bid); if (!b) return null; var heads = {};
    (b.columns || []).forEach(function (c) { (c.cards || []).forEach(function (k) { if (KN().isHeading(k.id)) heads[k.id] = 1; }); });
    return { bid: bid, board: JSON.parse(JSON.stringify(b)), fd: KN().get('fd:' + bid), wa: KN().get('wa:' + bid), cfg: KN().get('lm:cfg:' + bid), heads: heads };
  }
  function written(before) { var t0 = Date.now(); return new Promise(function (done) { (function w() { if (A().boards() !== before || Date.now() - t0 > 900) done(); else requestAnimationFrame(w); })(); }); }
  function edit(bid, fn, label) {
    var snap = snapshot(bid); if (!snap) return Promise.reject(new Error('This world is not here any more.'));
    var b = JSON.parse(JSON.stringify(snap.board)), r = fn(b); if (r === false) return Promise.resolve(false);
    UNDO.push(Object.assign(snap, { label: label || 'change' })); if (UNDO.length > 20) UNDO.shift();
    var before = A().boards(); A().updateBoard(bid, function () { return b; });
    return written(before).then(function () { try { window.dispatchEvent(new CustomEvent('minest:kedit', { detail: { bid: bid } })); } catch (e) {} return true; });
  }
  function undo() {
    var u = UNDO.pop(); if (!u) return Promise.resolve(null);
    var before = A().boards(); A().updateBoard(u.bid, function () { return u.board; });
    var m = {}; m['fd:' + u.bid] = u.fd || null; m['wa:' + u.bid] = u.wa || null; m['lm:cfg:' + u.bid] = u.cfg || null; KN().setMany(m);
    (u.board.columns || []).forEach(function (c) { (c.cards || []).forEach(function (k) { var h = !!u.heads[k.id]; if (KN().isHeading(k.id) !== h) KN().setHeading(k.id, h); }); });
    return written(before).then(function () { return u.label; });
  }
  function findCol(b, id) { return (b.columns || []).filter(function (c) { return c.id === id; })[0] || null; }
  function findCard(b, id) { var hit = null; (b.columns || []).forEach(function (c) { (c.cards || []).forEach(function (k, i) { if (k.id === id) hit = { col: c, card: k, i: i }; }); }); return hit; }
  function newCard(title) { return { id: rid('c-'), title: title, desc: '', labels: [], complete: false, createdAt: Date.now(), mastery: 1, checklistItems: [] }; }
  // the lists that belong under a heading: the cards after it until the next heading
  function groupOf(col, i) { var out = []; for (var j = i + 1; j < col.cards.length; j++) { if (KN().isHeading(col.cards[j].id)) break; out.push(col.cards[j]); } return out; }
  function setStage(bid, map) { var cfg = Object.assign({}, KN().get('lm:cfg:' + bid) || {}); cfg.stageOf = Object.assign({}, cfg.stageOf || {}); Object.keys(map).forEach(function (k) { if (map[k]) cfg.stageOf[k] = map[k]; else delete cfg.stageOf[k]; }); KN().set('lm:cfg:' + bid, cfg); }

  // ================================================================== UI
  var I = function (d) { return '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + d + '</svg>'; };
  var ICON = { x: I('<path d="M6 6l12 12M18 6 6 18"/>'), back: I('<path d="m15 6-6 6 6 6"/>'), more: I('<circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>'), plus: I('<path d="M12 5v14M5 12h14"/>'), undo: I('<path d="M9 14 4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/>'), chev: I('<path d="m9 6 6 6-6 6"/>') };
  var CSS = [
    '.bd{position:fixed;inset:0;z-index:2147482008;display:flex;flex-direction:column;color:#f3f5f8;font:15px/1.4 -apple-system,BlinkMacSystemFont,"SF Pro Text",system-ui,sans-serif;-webkit-font-smoothing:antialiased;background:linear-gradient(180deg,rgba(20,24,36,.95),rgba(8,10,18,.98));-webkit-backdrop-filter:blur(40px);backdrop-filter:blur(40px)}',
    '.bd-head{display:flex;align-items:center;gap:10px;padding:calc(env(safe-area-inset-top,0px) + 12px) 14px 6px}.bd-head h2{flex:1;min-width:0;margin:0;font-size:24px;font-weight:800;letter-spacing:-.4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.bd-b{flex:none;width:36px;height:36px;border-radius:50%;display:grid;place-items:center;padding:0;cursor:pointer;color:inherit;background:linear-gradient(180deg,rgba(255,255,255,.18),rgba(255,255,255,.06));border:1px solid rgba(255,255,255,.24)}',
    '.bd-tabs{display:flex;gap:6px;padding:4px 14px 8px;overflow-x:auto;scrollbar-width:none}.bd-tabs button{flex:none;height:34px;padding:0 14px;border-radius:999px;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.07);color:inherit;font:600 13.5px -apple-system,system-ui,sans-serif;cursor:pointer}.bd-tabs button.on{background:#fff;color:#111}',
    '.bd-body{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:4px 14px calc(env(safe-area-inset-bottom,0px) + 110px)}',
    '.bd-foot{position:absolute;left:0;right:0;bottom:0;padding:26px 14px calc(env(safe-area-inset-bottom,0px) + 14px);background:linear-gradient(180deg,rgba(8,10,18,0),rgba(8,10,18,.97) 22px);display:flex;gap:10px}',
    '.bd-go{flex:1;height:50px;border-radius:999px;border:1px solid rgba(255,255,255,.25);background:linear-gradient(180deg,#3d9bff,#0a7aff);color:#fff;font:700 16px -apple-system,system-ui,sans-serif;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:6px;white-space:nowrap}.bd-go:disabled{opacity:.4}.bd-go.sec{flex:0 0 auto;padding:0 18px;background:rgba(255,255,255,.1)}',
    '.bd-h{margin:18px 2px 8px;font-size:12px;font-weight:650;letter-spacing:.06em;text-transform:uppercase;opacity:.55}.bd-sub{margin:0 2px 12px;font-size:14px;opacity:.65}',
    '.bd-ways{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px}',
    '.bd-way{display:flex;flex-direction:column;gap:4px;text-align:left;padding:14px;border-radius:20px;cursor:pointer;color:inherit;font:inherit;background:linear-gradient(180deg,rgba(255,255,255,.12),rgba(255,255,255,.05));border:1px solid rgba(255,255,255,.16)}.bd-way b{font-size:16px}.bd-way small{font-size:13px;opacity:.65}',
    '.bd-area{border-radius:18px;margin-bottom:10px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);overflow:hidden}',
    '.bd-row{display:flex;align-items:center;gap:8px;padding:10px 10px 10px 12px;min-height:44px}.bd-row+.bd-row{border-top:1px solid rgba(255,255,255,.06)}',
    '.bd-row .t{flex:1;min-width:0}.bd-row .t b{display:block;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.bd-row .t small{display:block;font-size:12px;opacity:.55}',
    '.bd-row.area{background:rgba(255,255,255,.05)}.bd-row.area .t b{font-size:16px;font-weight:750}.bd-row.cat .t b{font-size:12.5px;letter-spacing:.05em;text-transform:uppercase;opacity:.8}.bd-row.list{padding-left:26px}.bd-row.list.loose{padding-left:12px}',
    '.bd-dot{width:12px;height:12px;border-radius:50%;flex:none;background:var(--c)}',
    '.bd-m{flex:none;width:34px;height:34px;border-radius:50%;display:grid;place-items:center;border:0;background:rgba(255,255,255,.08);color:inherit;cursor:pointer}',
    '.bd-add{display:flex;gap:6px;flex-wrap:wrap;padding:8px 12px 12px}',
    '.bd-chip{min-height:34px;padding:6px 12px;border-radius:999px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.08);color:inherit;font:600 13px -apple-system,system-ui,sans-serif;cursor:pointer;display:inline-flex;align-items:center;gap:5px}.bd-chip.on{background:#fff;color:#111}.bd-chip:disabled{opacity:.35}',
    '.bd-chips{display:flex;flex-wrap:wrap;gap:8px}',
    '.bd-in{width:100%;box-sizing:border-box;height:44px;padding:0 12px;border-radius:12px;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.07);color:inherit;font:inherit;outline:none}',
    '.bd-sw{width:28px;height:28px;border-radius:50%;border:2px solid transparent;cursor:pointer;padding:0;background:var(--c)}.bd-sw.on{border-color:#fff;box-shadow:0 0 0 2px var(--c)}',
    '.bd-ic{width:44px;height:44px;border-radius:12px;display:grid;place-items:center;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.06);color:inherit;cursor:pointer}.bd-ic svg{width:22px;height:22px}.bd-ic.on{background:#fff;color:#111}',
    '.bd-cover{height:110px;border-radius:16px;background-size:cover;background-position:center;background-color:var(--c);display:grid;place-items:center;margin-bottom:8px}',
    '.bd-menu{position:absolute;left:10px;right:10px;bottom:calc(env(safe-area-inset-bottom,0px) + 10px);z-index:9;padding:12px;border-radius:22px;background:rgba(30,33,44,.97);border:1px solid rgba(255,255,255,.16);box-shadow:0 20px 50px rgba(0,0,0,.5)}',
    '.bd-menu h4{margin:2px 4px 10px;font-size:15px}.bd-menu button{display:block;width:100%;text-align:left;padding:12px;border:0;border-radius:12px;background:none;color:inherit;font:inherit;cursor:pointer}.bd-menu button:hover{background:rgba(255,255,255,.07)}.bd-menu button.danger{color:#ff6b6b}.bd-menu button small{display:block;font-size:12px;opacity:.6}',
    '.bd-tpl{border-radius:16px;margin-bottom:8px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1)}.bd-tpl>button{display:flex;align-items:center;gap:10px;width:100%;padding:12px;border:0;background:none;color:inherit;font:inherit;cursor:pointer;text-align:left}.bd-tpl>button b{flex:1}',
    '.bd-pick{padding:0 12px 12px}.bd-pick .dn{font-size:13px;font-weight:700;margin:8px 0 6px}',
    '.bd-note{font-size:12.5px;opacity:.6;margin:8px 2px}',
    'html.kn-light .bd{color:#1d1f23;background:linear-gradient(180deg,rgba(244,246,250,.96),rgba(232,236,243,.99))}html.kn-light .bd-b,html.kn-light .bd-area,html.kn-light .bd-chip,html.kn-light .bd-in,html.kn-light .bd-way,html.kn-light .bd-tpl,html.kn-light .bd-tabs button,html.kn-light .bd-m,html.kn-light .bd-ic{background:rgba(255,255,255,.85);border-color:rgba(0,0,0,.1)}html.kn-light .bd-chip.on,html.kn-light .bd-tabs button.on,html.kn-light .bd-ic.on{background:#1d1f23;color:#fff}html.kn-light .bd-menu{background:rgba(250,251,253,.98);border-color:rgba(0,0,0,.08)}html.kn-light .bd-foot{background:linear-gradient(180deg,rgba(236,239,245,0),rgba(236,239,245,.97) 22px)}html.kn-light .bd-go.sec{background:rgba(0,0,0,.06);color:#1d1f23}'
  ].join('\n');
  function css() { if (document.getElementById('bd-css')) return; var s = document.createElement('style'); s.id = 'bd-css'; s.textContent = CSS; document.head.appendChild(s); }
  var ui = { open: false };
  function shell() {
    if (ui.open) return; css(); if (KN() && KN().applyLook) KN().applyLook();
    var el = document.createElement('div'); el.className = 'bd'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'World Builder');
    el.innerHTML = '<div class="bd-head"></div><div class="bd-tabs" hidden></div><div class="bd-body"></div><div class="bd-foot" hidden></div><input type="file" accept="image/*" hidden>';
    ['pointerdown', 'touchstart', 'touchmove', 'wheel', 'keydown'].forEach(function (ev) { el.addEventListener(ev, function (e) { e.stopPropagation(); }, { passive: ev !== 'keydown' }); });
    ui.el = el; ui.head = el.querySelector('.bd-head'); ui.tabs = el.querySelector('.bd-tabs'); ui.body = el.querySelector('.bd-body'); ui.foot = el.querySelector('.bd-foot'); ui.file = el.querySelector('input[type=file]'); ui.open = true;
    document.body.appendChild(el); document.documentElement.classList.add('kn-open');
    if (el.animate) el.animate([{ opacity: 0, translate: '0 24px' }, { opacity: 1, translate: '0 0' }], { duration: 280, easing: 'cubic-bezier(.2,.85,.25,1)' });
    el.addEventListener('click', onClick);
    el.addEventListener('keydown', function (e) { if (e.key === 'Escape') { if (ui.menu) closeMenu(); else close(); } });
    ui.file.addEventListener('change', function () { var f = ui.file.files && ui.file.files[0]; ui.file.value = ''; if (!f) return; shrink(f, 1200, function (d) { if (!d) return toast('This picture could not be read.'); if (ui.view === 'scratch') { ui.sc.cover = d; scratch(); } else setLook({ cover: d }); }); });
  }
  function close() { if (!ui.open) return; var el = ui.el; ui.open = false; ui.el = null; ui.menu = null; if (!document.querySelector('.lw,.sk,.wk,.pk,.wc,.dv,.st')) document.documentElement.classList.remove('kn-open'); if (el.animate) { var an = el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 180, fill: 'forwards' }); an.onfinish = function () { el.remove(); }; } else el.remove(); }
  function head(title, back) { ui.head.innerHTML = (back ? '<button type="button" class="bd-b" data-back="' + esc(back) + '" aria-label="Back">' + ICON.back + '</button>' : '') + '<h2>' + esc(title) + '</h2><button type="button" class="bd-b" data-x aria-label="Close">' + ICON.x + '</button>'; ui.foot.hidden = true; ui.foot.innerHTML = ''; ui.tabs.hidden = true; closeMenu(); }
  function foot(h) { ui.foot.hidden = !h; ui.foot.innerHTML = h || ''; }
  function keepY(fn) { var y = ui.body.scrollTop; fn(); ui.body.scrollTop = y; }
  function shrink(f, max, cb) { var rd = new FileReader(); rd.onload = function () { var im = new Image(); im.onload = function () { var k = Math.min(1, max / Math.max(im.naturalWidth, im.naturalHeight)); try { var c = document.createElement('canvas'); c.width = Math.round(im.naturalWidth * k); c.height = Math.round(im.naturalHeight * k); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); cb(c.toDataURL('image/jpeg', .8)); } catch (e) { cb(null); } }; im.onerror = function () { cb(null); }; im.src = rd.result; }; rd.readAsDataURL(f); }
  function closeMenu() { if (ui.menu) { ui.menu.remove(); ui.menu = null; } }
  function menu(title, items) { closeMenu(); var m = document.createElement('div'); m.className = 'bd-menu'; m.innerHTML = '<h4>' + esc(title) + '</h4>' + items.map(function (x, i) { return x ? '<button type="button" data-mi="' + i + '"' + (x.danger ? ' class="danger"' : '') + (x.disabled ? ' disabled style="opacity:.35"' : '') + '>' + esc(x.label) + (x.sub ? '<small>' + esc(x.sub) + '</small>' : '') + '</button>' : ''; }).join('') + '<button type="button" data-mx>Cancel</button>'; ui.el.appendChild(m); ui.menu = m; ui.menuItems = items; }
  var ICONS = function () { var ic = (W() && W()._icons) || {}; return ['world', 'mine', 'my-life', 'whole-earth', 'my-museum', 'britannica', 'everyday-food', 'everyday-memory', 'my-academic-skills', 'my-life-skills'].filter(function (k) { return ic[k]; }).map(function (k) { return [k, ic[k]]; }); };

  // ---------------------------------------------------------------- three ways to start
  function start() {
    shell(); ui.view = 'start'; head('Build My World', null);
    ui.body.innerHTML = '<p class="bd-sub">Everyone has a world. Build yours — and change anything later.</p><div class="bd-ways">' +
      '<button type="button" class="bd-way" data-way="template"><b>Start with a Template</b><small>Pick a ready-made world and switch off what you don’t need.</small></button>' +
      '<button type="button" class="bd-way" data-way="mix"><b>Mix &amp; Match</b><small>Take areas and lists from different templates into one world.</small></button>' +
      '<button type="button" class="bd-way" data-way="scratch"><b>Start from Scratch</b><small>A blank world: your name, your areas, your lists.</small></button></div>';
  }
  // ---------------------------------------------------------------- Start from Scratch
  function scratch() {
    shell(); ui.view = 'scratch'; var s = ui.sc = ui.sc || { title: '', subtitle: '', color: COLORS[0], icon: 'world', cover: '', view: 'home', areas: 'My Lists' };
    head('Start from Scratch', 'start');
    ui.body.innerHTML = '<div class="bd-cover" style="--c:' + esc(s.color) + (s.cover ? ';background-image:url(&quot;' + esc(s.cover) + '&quot;)' : '') + '">' + (s.cover ? '' : '<span style="color:#fff;opacity:.9">' + ((ICONS().filter(function (x) { return x[0] === s.icon; })[0] || ['', ''])[1]) + '</span>') + '</div>' +
      '<div class="bd-chips" style="margin-bottom:10px"><button type="button" class="bd-chip" data-cover>' + (s.cover ? 'Change cover' : 'Add a cover photo') + '</button>' + (s.cover ? '<button type="button" class="bd-chip" data-nocover>Remove</button>' : '') + '</div>' +
      '<div class="bd-h">World name</div><input class="bd-in" data-sv="title" maxlength="60" placeholder="e.g. My Garden World" value="' + esc(s.title) + '">' +
      '<div class="bd-h">Subtitle <span style="text-transform:none;letter-spacing:0;opacity:.8">(optional)</span></div><input class="bd-in" data-sv="subtitle" maxlength="90" value="' + esc(s.subtitle) + '">' +
      '<div class="bd-h">Colour</div><div class="bd-chips">' + COLORS.map(function (c) { return '<button type="button" class="bd-sw' + (s.color === c ? ' on' : '') + '" style="--c:' + c + '" data-scol="' + c + '" aria-label="Colour"></button>'; }).join('') + '</div>' +
      '<div class="bd-h">Icon</div><div class="bd-chips">' + ICONS().map(function (x) { return '<button type="button" class="bd-ic' + (s.icon === x[0] ? ' on' : '') + '" data-sicon="' + x[0] + '">' + x[1] + '</button>'; }).join('') + '</div>' +
      '<div class="bd-h">First areas <span style="text-transform:none;letter-spacing:0;opacity:.8">(one per line — you can change them later)</span></div><textarea class="bd-in" data-sv="areas" style="height:auto;min-height:90px;padding:10px 12px">' + esc(s.areas) + '</textarea>' +
      '<div class="bd-h">Open it in</div><div class="bd-chips">' + VIEWS.map(function (v) { return '<button type="button" class="bd-chip' + (s.view === v[0] ? ' on' : '') + '" data-sview="' + v[0] + '">' + v[1] + '</button>'; }).join('') + '</div>';
    foot('<button type="button" class="bd-go" data-screate>Create My World</button>');
  }
  function keepScratch() { ui.body.querySelectorAll('[data-sv]').forEach(function (e) { ui.sc[e.getAttribute('data-sv')] = e.value; }); }
  function createScratch() {
    keepScratch(); var s = ui.sc, title = String(s.title || '').trim(); if (!title) { toast('Give your world a name.'); return; }
    var areas = String(s.areas || '').split('\n').map(function (x) { return x.trim(); }).filter(Boolean).slice(0, 20); if (!areas.length) areas = ['My Lists'];
    var bid = 'lw-' + slug(title) + '-' + rid().slice(-4);
    var b = { id: bid, title: title, columns: areas.map(function (a, i) { return { id: bid + '-d-' + rid().slice(-5) + i, title: a, color: COLORS[i % COLORS.length], cards: [] }; }), labelDefinitions: [], archivedCards: [], linkedBoardIds: [], showLabelNames: false };
    A().addBoard(b, true);
    var m = {}; m['lom:world:' + bid] = { created: Date.now(), templates: {}, scratch: true }; m['wa:' + bid] = { subtitle: s.subtitle || '', color: s.color, icon: s.icon, cover: s.cover || '', view: s.view, at: Date.now() };
    m['fd:' + bid] = { packs: { custom: { fields: {}, name: title, explore: s.view === 'home' ? 'portal' : s.view, at: Date.now() } }, lists: {} };
    KN().setMany(m); ui.sc = null;
    toast('Created “' + title + '”'); setTimeout(function () { editor(bid, 'structure'); }, 300);
  }

  // ---------------------------------------------------------------- Mix & Match
  function mix(intoBid) {
    shell(); ui.view = 'mix'; ui.mx = ui.mx && ui.mx.into === (intoBid || null) ? ui.mx : { into: intoBid || null, pick: {}, open: {}, title: '', same: {} };
    var M = ui.mx; head(intoBid ? 'Add from templates' : 'Mix & Match', intoBid ? 'editor' : 'start');
    var ts = tpls().filter(function (t) { return !t.hidden && !t.kind; });
    var n = Object.keys(M.pick).filter(function (k) { return M.pick[k]; }).length;
    ui.body.innerHTML = '<p class="bd-sub">' + (intoBid ? 'Pick areas or single lists to add to this world.' : 'Pick areas or single lists from any template. They keep where they came from.') + '</p>' +
      ts.map(function (t) {
        var open = M.open[t.id], cnt = Object.keys(M.pick).filter(function (k) { return M.pick[k] && k.indexOf(t.id + '|') === 0; }).length;
        return '<div class="bd-tpl"><button type="button" data-mopen="' + esc(t.id) + '"><span>' + (open ? '▾' : '▸') + '</span><b>' + esc(t.name) + '</b>' + (cnt ? '<span class="bd-chip on" style="min-height:24px;padding:2px 8px">' + cnt + '</span>' : '') + '</button>' +
          (open ? '<div class="bd-pick">' + t.domains.map(function (d) {
            var dk = t.id + '|d|' + d.id, groups = d.lists && !d.categories ? [{ id: d.id, lists: d.lists, flat: true }] : (d.categories || []);
            return '<div class="dn"><button type="button" class="bd-chip' + (M.pick[dk] ? ' on' : '') + '" data-mpick="' + esc(dk) + '">' + (M.pick[dk] ? '✓ ' : '') + esc(d.title) + ' <small style="opacity:.6">whole area</small></button></div><div class="bd-chips">' +
              groups.map(function (g) { return (g.lists || []).map(function (l) { var lk = t.id + '|l|' + d.id + '|' + g.id + '|' + l.id; return '<button type="button" class="bd-chip' + (M.pick[lk] || M.pick[dk] ? ' on' : '') + '" data-mpick="' + esc(lk) + '"' + (M.pick[dk] ? ' disabled' : '') + '>' + esc(l.title) + '</button>'; }).join(''); }).join('') + '</div>';
          }).join('') + '</div>' : '') + '</div>';
      }).join('') +
      (intoBid ? '' : '<div class="bd-h">World name</div><input class="bd-in" data-mtitle maxlength="60" placeholder="e.g. My World" value="' + esc(M.title) + '">') +
      sameHtml();
    foot('<button type="button" class="bd-go" data-mgo' + (n ? '' : ' disabled') + '>' + (intoBid ? 'Add ' : 'Create with ') + n + ' pick' + (n === 1 ? '' : 's') + '</button>');
  }
  // the same name twice (between picks, or with an area the world already has): reuse or keep separate — the user decides
  function sameNames() {
    var M = ui.mx, seen = {}, out = [];
    if (M.into) { var b = boardById(M.into); (b && b.columns || []).forEach(function (c) { seen[String(c.title).toLowerCase()] = { col: c.id, title: c.title, mine: true }; }); }
    Object.keys(M.pick).forEach(function (k) { if (!M.pick[k]) return; var p = k.split('|'), t = tplById(p[0]); if (!t) return; var d = t.domains.filter(function (x) { return x.id === p[2]; })[0]; if (!d) return;
      var key = String(d.title).toLowerCase(); if (seen[key] && seen[key].src !== p[0] + '|' + d.id) { if (out.every(function (o) { return o.key !== key || o.src !== p[0] + '|' + d.id; })) out.push({ key: key, title: d.title, src: p[0] + '|' + d.id, with: seen[key] }); } else if (!seen[key]) seen[key] = { src: p[0] + '|' + d.id, title: d.title }; });
    return out;
  }
  function sameHtml() {
    var s = sameNames(); if (!s.length) return '';
    return '<div class="bd-h">Same names</div>' + s.map(function (o) { var k = o.src, v = ui.mx.same[k] || 'separate';
      return '<div class="bd-area" style="padding:12px"><b>“' + esc(o.title) + '”</b><div class="bd-note" style="margin:4px 0 8px">' + (o.with.mine ? 'This world already has an area with this name.' : 'Two of your picks have this name.') + ' Nothing is merged unless you choose to.</div><div class="bd-chips"><button type="button" class="bd-chip' + (v === 'reuse' ? ' on' : '') + '" data-msame="' + esc(k) + '|reuse">Put it in the same area</button><button type="button" class="bd-chip' + (v === 'separate' ? ' on' : '') + '" data-msame="' + esc(k) + '|separate">Keep two areas</button></div></div>'; }).join('');
  }
  function mixGo() {
    var M = ui.mx, ti = ui.body.querySelector('[data-mtitle]'); if (ti) M.title = ti.value;
    if (!M.into && !String(M.title || '').trim()) { toast('Give your world a name.'); return; }
    var byT = {}; Object.keys(M.pick).forEach(function (k) { if (!M.pick[k]) return; var p = k.split('|'); (byT[p[0]] = byT[p[0]] || { d: {}, l: {} }); if (p[1] === 'd') byT[p[0]].d[p[2]] = 1; else (byT[p[0]].l[p[2]] = byT[p[0]].l[p[2]] || {})[p[3] + '/' + p[4]] = 1; });
    var order = Object.keys(byT), bid = M.into, same = sameNames(), first = true, made = null, colOf = {};
    function sel(t) {
      var P = byT[t.id], off = {}, reuseCols = {};
      t.domains.forEach(function (d) {
        if (P.d[d.id]) return; var want = P.l[d.id]; if (!want) { off[d.id] = 1; return; }
        var groups = d.lists && !d.categories ? [{ id: d.id, lists: d.lists }] : (d.categories || []);
        groups.forEach(function (g) { var any = false; (g.lists || []).forEach(function (l) { if (want[g.id + '/' + l.id]) any = true; else off['l:' + g.id + '/' + l.id] = 1; }); if (!any && g.id !== d.id) off[g.id] = 1; });
      });
      same.forEach(function (o) { if ((M.same[o.src] || 'separate') !== 'reuse') return; var p = o.src.split('|'); if (p[0] !== t.id) return; var target = o.with.mine ? o.with.col : colOf[o.with.src]; if (target) reuseCols[p[1]] = target; });
      return { off: off, reuseCols: reuseCols, depth: 'standard' };
    }
    try {
      var chain = Promise.resolve();
      order.forEach(function (tid) {
        chain = chain.then(function () {
          var t = tplById(tid), s = sel(t), r = W().generate(t, s, bid || undefined);
          bid = r.bid; if (!made) made = r;
          var p = W().plan(t, bid, s); p.lists.forEach(function (L) { var d = t.domains.filter(function (x) { return L.id === bid + '-d-' + slug(t.id) + '-' + slug(x.id) || s.reuseCols[x.id] === L.id; })[0]; if (d) colOf[t.id + '|' + d.id] = L.id; });
          return new Promise(function (res) { var t0 = Date.now(); (function w() { if (boardById(bid) || Date.now() - t0 > 2500) res(); else setTimeout(w, 80); })(); }).then(function () { if (t.starterPack && window.MinestStarter) return MinestStarter.install(bid, t); });
        });
      });
      chain.then(function () {
        if (!M.into && M.title) A().updateBoard(bid, function (b) { var c = JSON.parse(JSON.stringify(b)); c.title = M.title.trim(); return c; });
        if (!KN().get('fd:' + bid)) KN().set('fd:' + bid, { packs: { custom: { fields: {}, name: M.title || '', explore: 'portal', at: Date.now() } }, lists: {} });
        toast(M.into ? 'Added to your world' : 'Created “' + (M.title || made.title) + '”'); ui.mx = null;
        setTimeout(function () { editor(bid, 'structure'); }, 250);
      }).catch(function (e) { toast('✗ ' + e.message); });
    } catch (e) { toast('✗ ' + e.message); }
  }

  // ---------------------------------------------------------------- the editor
  function editor(bid, tab) {
    shell(); var b = boardById(bid); if (!b) { setTimeout(function () { if (boardById(bid)) editor(bid, tab); }, 200); return; }
    ui.bid = bid; ui.view = 'editor'; ui.tab = tab || ui.tab || 'structure'; head(b.title, null);
    ui.tabs.hidden = false; ui.tabs.innerHTML = [['structure', 'Structure'], ['look', 'Look'], ['fields', 'Fields'], ['template', 'Template']].map(function (x) { return '<button type="button" data-tab="' + x[0] + '"' + (ui.tab === x[0] ? ' class="on"' : '') + '>' + x[1] + '</button>'; }).join('');
    ({ structure: structure, look: look, fields: fields, template: templateTab })[ui.tab](b);
  }
  function structure(b) {
    var h = '<p class="bd-sub">Areas → categories → lists. Tap ⋯ to rename, move, duplicate or remove. Removing keeps your items unless you choose otherwise.</p>';
    (b.columns || []).forEach(function (col, ci) {
      h += '<div class="bd-area" style="--c:' + esc(col.color || '#888') + '"><div class="bd-row area"><span class="bd-dot"></span><div class="t"><b>' + esc(col.title) + '</b><small>' + (col.cards || []).filter(function (k) { return !KN().isHeading(k.id); }).length + ' lists</small></div><button type="button" class="bd-m" data-om="a|' + esc(col.id) + '" aria-label="Area options">' + ICON.more + '</button></div>';
      var inCat = false;
      (col.cards || []).forEach(function (k) {
        var head = KN().isHeading(k.id); if (head) inCat = true;
        var n = (k.stack || []).length;
        h += '<div class="bd-row ' + (head ? 'cat' : 'list' + (inCat ? '' : ' loose')) + '"><div class="t"><b>' + esc(k.title) + '</b>' + (head ? '' : '<small>' + n + ' item' + (n === 1 ? '' : 's') + '</small>') + '</div><button type="button" class="bd-m" data-om="' + (head ? 'c' : 'l') + '|' + esc(k.id) + '" aria-label="Options">' + ICON.more + '</button></div>';
      });
      h += '<div class="bd-add"><button type="button" class="bd-chip" data-addl="' + esc(col.id) + '">' + ICON.plus + 'List</button><button type="button" class="bd-chip" data-addc="' + esc(col.id) + '">' + ICON.plus + 'Category</button></div></div>';
    });
    ui.body.innerHTML = h + '<div class="bd-chips"><button type="button" class="bd-chip" data-adda>' + ICON.plus + 'Area</button><button type="button" class="bd-chip" data-frommix>' + ICON.plus + 'From templates</button>' + (UNDO.length ? '<button type="button" class="bd-chip" data-undo>' + ICON.undo + 'Undo</button>' : '') + '</div>' +
      '<p class="bd-note">Archived lists keep their items — find them in the board’s Archive to bring them back.</p>';
    foot('<button type="button" class="bd-go sec" data-openw>Open my world</button><button type="button" class="bd-go" data-done>Done</button>');
  }
  function look(b) {
    var a = Object.assign({ subtitle: '', color: '', icon: 'world', cover: '', view: 'home', layout: 'comfortable' }, KN().get('wa:' + b.id) || {}), col = a.color || COLORS[0];
    ui.body.innerHTML = '<div class="bd-cover" style="--c:' + esc(col) + (a.cover ? ';background-image:url(&quot;' + esc(a.cover) + '&quot;)' : '') + '">' + (a.cover ? '' : '<span style="color:#fff">' + ((ICONS().filter(function (x) { return x[0] === a.icon; })[0] || ['', ''])[1]) + '</span>') + '</div>' +
      '<div class="bd-chips" style="margin-bottom:6px"><button type="button" class="bd-chip" data-cover>' + (a.cover ? 'Change cover' : 'Add a cover photo') + '</button>' + (a.cover ? '<button type="button" class="bd-chip" data-nocover>Remove</button>' : '') + '</div>' +
      '<div class="bd-h">Title</div><div style="display:flex;gap:8px"><input class="bd-in" data-ltitle maxlength="60" value="' + esc(b.title) + '"><button type="button" class="bd-chip" data-lsave>Save</button></div>' +
      '<div class="bd-h">Subtitle</div><div style="display:flex;gap:8px"><input class="bd-in" data-lsub maxlength="90" value="' + esc(a.subtitle) + '"><button type="button" class="bd-chip" data-lsave>Save</button></div>' +
      '<div class="bd-h">Colour</div><div class="bd-chips">' + COLORS.map(function (c) { return '<button type="button" class="bd-sw' + (col === c ? ' on' : '') + '" style="--c:' + c + '" data-lcol="' + c + '" aria-label="Colour"></button>'; }).join('') + '</div>' +
      '<div class="bd-h">Icon</div><div class="bd-chips">' + ICONS().map(function (x) { return '<button type="button" class="bd-ic' + (a.icon === x[0] ? ' on' : '') + '" data-licon="' + x[0] + '">' + x[1] + '</button>'; }).join('') + '</div>' +
      '<div class="bd-h">Open it in</div><div class="bd-chips">' + VIEWS.map(function (v) { return '<button type="button" class="bd-chip' + (a.view === v[0] ? ' on' : '') + '" data-lview="' + v[0] + '">' + v[1] + '</button>'; }).join('') + '</div>' +
      '<div class="bd-h">Layout</div><div class="bd-chips">' + [['comfortable', 'Comfortable'], ['compact', 'Compact']].map(function (v) { return '<button type="button" class="bd-chip' + (a.layout === v[0] ? ' on' : '') + '" data-llay="' + v[0] + '">' + v[1] + '</button>'; }).join('') + '</div>' +
      '<p class="bd-note">The look never changes your lists or items.</p>';
    foot('<button type="button" class="bd-go" data-done>Done</button>');
  }
  function setLook(patch) { var a = Object.assign({}, KN().get('wa:' + ui.bid) || {}, patch, { at: Date.now() }); KN().set('wa:' + ui.bid, a); keepY(function () { editor(ui.bid, 'look'); }); }
  // fields: per list — the template's fields on / off, and fields of your own
  function fdOf(bid) { var f = KN().get('fd:' + bid) || { packs: {}, lists: {} }; f.packs = Object.assign({}, f.packs); f.lists = Object.assign({}, f.lists); if (!f.packs.custom) f.packs.custom = { fields: {}, at: Date.now() }; return f; }
  var TYPES = [['text', 'Text'], ['number', 'Number'], ['date', 'Date'], ['boolean', 'Yes / No'], ['select', 'One choice'], ['multiselect', 'Several choices'], ['image', 'Picture'], ['url', 'Link'], ['ref', 'Another item']];
  function fields(b) {
    var f = fdOf(b.id), lists = []; (b.columns || []).forEach(function (c) { (c.cards || []).forEach(function (k) { if (!KN().isHeading(k.id)) lists.push({ k: k, col: c }); }); });
    var cur = ui.flist && lists.some(function (x) { return x.k.id === ui.flist; }) ? ui.flist : (lists[0] && lists[0].k.id);
    ui.flist = cur;
    var all = {}; Object.keys(f.packs).forEach(function (p) { Object.keys(f.packs[p].fields || {}).forEach(function (id) { if (!all[id]) all[id] = f.packs[p].fields[id]; }); });
    var on = (f.lists[cur] && f.lists[cur].fields) || [];
    ui.body.innerHTML = '<p class="bd-sub">Choose what each list asks for when you add something. Field definitions are kept apart from your items.</p>' +
      '<div class="bd-h">List</div><div class="bd-chips">' + lists.map(function (x) { return '<button type="button" class="bd-chip' + (x.k.id === cur ? ' on' : '') + '" data-flist="' + esc(x.k.id) + '">' + esc(x.k.title) + '</button>'; }).join('') + '</div>' +
      (cur ? '<div class="bd-h">Fields of “' + esc((lists.filter(function (x) { return x.k.id === cur; })[0] || { k: {} }).k.title) + '”</div><div class="bd-chips">' + Object.keys(all).map(function (id) { var d = all[id], o = on.indexOf(id) >= 0; return '<button type="button" class="bd-chip' + (o ? ' on' : '') + '" data-ftog="' + esc(id) + '">' + (o ? '✓ ' : '') + esc(d.label) + ' <small style="opacity:.6">' + esc((TYPES.filter(function (t) { return t[0] === d.type; })[0] || ['', d.type])[1]) + '</small></button>'; }).join('') + '</div>' +
        '<div class="bd-chips" style="margin-top:12px"><button type="button" class="bd-chip" data-fnew>' + ICON.plus + 'New field</button></div>' : '<p class="bd-sub">Add a list first.</p>');
    foot('<button type="button" class="bd-go" data-done>Done</button>');
  }
  function toggleField(id) {
    var f = fdOf(ui.bid), L = f.lists[ui.flist] || { tpl: 'custom', fields: [] }; L = Object.assign({}, L, { fields: (L.fields || []).slice(), custom: true });
    var at = L.fields.indexOf(id); if (at >= 0) L.fields.splice(at, 1); else L.fields.push(id);
    f.lists[ui.flist] = L; KN().set('fd:' + ui.bid, f); keepY(function () { editor(ui.bid, 'fields'); });
  }
  function newField() {
    sheet({ title: 'New field', text: 'For this list (you can turn it on for others too).', fields: [{ key: 'label', label: 'Name', placeholder: 'e.g. Author' }, { key: 'type', label: 'Kind', type: 'select', value: 'text', options: TYPES }, { key: 'options', label: 'Choices (for one / several choices), comma-separated', placeholder: 'e.g. Yes, No, Maybe' }], ok: 'Add' }).then(function (v) {
      if (!v || !String(v.label || '').trim()) return;
      var f = fdOf(ui.bid), id = 'my-' + slug(v.label) + '-' + rid().slice(-3), def = { id: id, label: v.label.trim().slice(0, 40), type: v.type || 'text' };
      if (def.type === 'select' || def.type === 'multiselect') def.options = String(v.options || '').split(',').map(function (x) { return x.trim(); }).filter(Boolean).slice(0, 20);
      if (def.type === 'text') def.multiline = false;
      if (def.type === 'ref') def.refLists = ['*'];
      f.packs.custom.fields = Object.assign({}, f.packs.custom.fields); f.packs.custom.fields[id] = def;
      var L = Object.assign({ tpl: 'custom', fields: [] }, f.lists[ui.flist] || {}); L.fields = (L.fields || []).concat([id]); L.custom = true; f.lists[ui.flist] = L;
      KN().set('fd:' + ui.bid, f); toast('Field added'); editor(ui.bid, 'fields');
    });
  }
  function templateTab(b) {
    var w = KN().get('lom:world:' + b.id) || {}, mineTpl = Object.keys(w.templates || {}).filter(function (k) { var t = tplById(k); return t && t.mine; })[0];
    ui.body.innerHTML = '<p class="bd-sub">Turn this world into a template you can reuse or share. A template holds the structure, fields and look — never your items, photos, notes or reflections.</p>' +
      '<div class="bd-chips"><button type="button" class="bd-chip" data-tsave>Save as my template</button>' + (w.fromTemplate ? '<button type="button" class="bd-chip" data-tupdate>Update “' + esc((tplById(w.fromTemplate) || {}).name || 'my template') + '”</button>' : '') + '<button type="button" class="bd-chip" data-texport>Export template JSON</button></div>' +
      '<div class="bd-h">My data</div><p class="bd-sub" style="margin-bottom:8px">Exporting your items too is a separate step. Pictures stay out; private worlds (memories, family) are marked.</p><div class="bd-chips"><button type="button" class="bd-chip" data-dexport>Export with my items…</button></div>';
    foot('<button type="button" class="bd-go" data-done>Done</button>');
  }
  // a world → a template (structure + fields + look; no items)
  function toTemplate(b, name) {
    var t = W().fromBoard(b, name), f = KN().get('fd:' + b.id), a = KN().get('wa:' + b.id) || {};
    t.family = 'everyday'; if (a.color) t.color = a.color; if (a.subtitle) t.tagline = a.subtitle; t.versionString = '1.0.0';
    if (f) {
      var F = {}, LF = {}, keyOf = {};   // the template keys fromBoard gives each card (category id / list id)
      (b.columns || []).forEach(function (col) { var cat = null; (col.cards || []).forEach(function (k) { if (KN().isHeading(k.id)) { cat = slug(k.title) + '-' + slug(k.id).slice(-6); return; } keyOf[k.id] = (cat || 'general-' + slug(col.id).slice(-6)) + '/' + slug(k.title) + '-' + slug(k.id).slice(-6); }); });
      Object.keys(f.lists || {}).forEach(function (cid) { var L = f.lists[cid], key = keyOf[cid]; if (!key || !L.fields || !L.fields.length) return; LF[key] = L.fields.slice(); L.fields.forEach(function (id) { var def = null; Object.keys(f.packs || {}).forEach(function (p) { if (!def && f.packs[p].fields && f.packs[p].fields[id]) def = f.packs[p].fields[id]; }); if (def) F[id] = def; }); });
      var pk = Object.keys(f.packs || {}).filter(function (k) { return k !== 'custom'; })[0], P = pk ? f.packs[pk] : {};
      if (Object.keys(LF).length) t.starterPack = { fields: Object.keys(F).map(function (k) { return F[k]; }), listFields: LF, explore: (a.view && a.view !== 'home' ? a.view : P.explore) || 'portal', private: !!P.private, discoveryTools: P.discovery || [] };
    }
    return t;
  }
  function exportWithItems(b) {
    var f = KN().get('fd:' + b.id), priv = f && Object.keys(f.packs || {}).some(function (k) { return f.packs[k].private; });
    confirmBox('Export “' + b.title + '” with all its items? The file will contain your item names, notes and field values' + (priv ? ' — including private memories and people' : '') + '. Pictures are left out. Only share it with people you trust.', 'Export').then(function (ok) {
      if (!ok) return;
      var out = { format: 'minest.world.data/1', exported: new Date().toISOString(), template: toTemplate(b, b.title), items: [] };
      (b.columns || []).forEach(function (col) { (col.cards || []).forEach(function (k) { (k.stack || []).forEach(function (s) { var v = Object.assign({}, KN().get('fv:' + s.id) || {}); delete v.photo; out.items.push({ area: col.title, list: k.title, title: s.title, note: s.desc || '', fields: v }); }); }); });
      download(out, slug(b.title) + '-with-items.json');
    });
  }
  function download(obj, name) { var txt = JSON.stringify(obj, null, 1); try { var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([txt], { type: 'application/json' })); a.download = name; document.body.appendChild(a); a.click(); a.remove(); } catch (e) {} try { navigator.clipboard && navigator.clipboard.writeText(txt); } catch (e) {} toast('Exported (also copied)'); }

  // ---------------------------------------------------------------- structure operations
  function objMenu(kind, id) {
    var b = boardById(ui.bid); if (!b) return;
    if (kind === 'a') { var col = findCol(b, id), n = (col.cards || []).filter(function (k) { return !KN().isHeading(k.id); }), items = n.reduce(function (s, k) { return s + (k.stack || []).length; }, 0), ci = b.columns.indexOf(col);
      return menu(col.title, [{ label: 'Rename', run: function () { rename('a', id, col.title); } }, { label: 'Move up', disabled: ci === 0, run: function () { moveArea(id, -1); } }, { label: 'Move down', disabled: ci === b.columns.length - 1, run: function () { moveArea(id, 1); } },
        { label: 'Duplicate structure', sub: 'A copy of its categories and lists — without items', run: function () { dupArea(id); } },
        { label: n.length ? 'Remove from this world' : 'Remove this empty area', sub: n.length ? 'Its ' + n.length + ' lists (' + items + ' items) are archived — you can bring them back' : '', run: function () { removeArea(id, false); } },
        items ? { label: 'Delete the area and its ' + items + ' items', danger: true, run: function () { confirmBox('Delete “' + col.title + '”, its lists and their ' + items + ' items for good?', 'Delete').then(function (ok) { if (ok) removeArea(id, true); }); } } : null]); }
    var L = findCard(b, id); if (!L) return;
    if (kind === 'c') { var grp = groupOf(L.col, L.i);
      return menu(L.card.title, [{ label: 'Rename', run: function () { rename('c', id, L.card.title); } }, { label: 'Move up', run: function () { moveCat(id, -1); } }, { label: 'Move down', run: function () { moveCat(id, 1); } }, { label: 'Move to another area', run: function () { pickArea(function (to) { moveCatTo(id, to); }); } },
        { label: 'Duplicate structure', sub: 'The category and its lists — without items', run: function () { dupCat(id); } },
        { label: 'Remove the category heading', sub: 'Its ' + grp.length + ' lists stay where they are', run: function () { removeCat(id, 'heading'); } },
        grp.length ? { label: 'Remove from this world', sub: 'The heading goes; its lists are archived with their items', run: function () { removeCat(id, 'archive'); } } : null]); }
    var items2 = (L.card.stack || []).length;
    return menu(L.card.title, [{ label: 'Rename', run: function () { rename('l', id, L.card.title); } }, { label: 'Move up', run: function () { moveList(id, -1); } }, { label: 'Move down', run: function () { moveList(id, 1); } }, { label: 'Move to…', sub: 'Another area or category', run: function () { pickPlace(function (to) { moveListTo(id, to); }); } },
      { label: 'Fields', run: function () { ui.flist = id; editor(ui.bid, 'fields'); } },
      { label: 'Link existing cards', sub: 'Add cards from your other boards — linked, not copied', run: function () { linkExisting(id); } },
      { label: 'Duplicate structure', sub: 'An empty list with the same fields', run: function () { dupList(id); } },
      { label: items2 ? 'Remove from this world' : 'Remove this empty list', sub: items2 ? 'Archived with its ' + items2 + ' items — you can bring it back' : '', run: function () { removeList(id, false); } },
      items2 ? { label: 'Delete the list and its ' + items2 + ' items', danger: true, run: function () { confirmBox('Delete “' + L.card.title + '” and its ' + items2 + ' items for good?', 'Delete').then(function (ok) { if (ok) removeList(id, true); }); } } : null]);
  }
  function rename(kind, id, was) {
    closeMenu(); sheet({ title: 'Rename', fields: [{ key: 't', label: 'Name', value: was }], ok: 'Save' }).then(function (v) {
      var t = v && String(v.t || '').replace(/\s+/g, ' ').trim(); if (!t || t === was) return;
      edit(ui.bid, function (b) { if (kind === 'a') findCol(b, id).title = t; else findCard(b, id).card.title = t; }, 'rename').then(function () { KN().set('lom:orig:' + id, '\u0001user', true); refresh(); });
    });
  }
  function refresh() { keepY(function () { editor(ui.bid, ui.tab); }); }
  function moveArea(id, d) { edit(ui.bid, function (b) { var i = b.columns.findIndex(function (c) { return c.id === id; }), j = i + d; if (j < 0 || j >= b.columns.length) return false; var x = b.columns[i]; b.columns[i] = b.columns[j]; b.columns[j] = x; }, 'move').then(refresh); }
  function moveList(id, d) { edit(ui.bid, function (b) { var L = findCard(b, id), cs = L.col.cards, j = L.i + d; if (j < 0 || j >= cs.length) return false; var x = cs[L.i]; cs[L.i] = cs[j]; cs[j] = x; }, 'move').then(function () { restage(); refresh(); }); }
  function moveCat(id, d) {   // a heading moves with its lists, past the neighbouring category
    edit(ui.bid, function (b) {
      var L = findCard(b, id), loose = [], blocks = [], cur = null;
      L.col.cards.forEach(function (k) { if (KN().isHeading(k.id)) { cur = [k]; blocks.push(cur); } else if (cur) cur.push(k); else loose.push(k); });
      var i = blocks.findIndex(function (bl) { return bl[0].id === id; }), j = i + d; if (i < 0 || j < 0 || j >= blocks.length) return false;
      var x = blocks[i]; blocks[i] = blocks[j]; blocks[j] = x;
      L.col.cards = loose.concat.apply(loose, blocks);
    }, 'move').then(function () { restage(); refresh(); });
  }
  function moveCatTo(id, colId) { edit(ui.bid, function (b) { var L = findCard(b, id), grp = [L.card].concat(groupOf(L.col, L.i)); L.col.cards.splice(L.i, grp.length); var to = findCol(b, colId); to.cards = (to.cards || []).concat(grp); }, 'move').then(function () { restage(); refresh(); }); }
  function moveListTo(id, to) {   // to = { col, after (heading id or null) }
    edit(ui.bid, function (b) { var L = findCard(b, id); L.col.cards.splice(L.i, 1); var c = findCol(b, to.col); c.cards = c.cards || []; if (to.after) { var H = findCard(b, to.after), g = groupOf(H.col, H.i); c.cards.splice(H.i + 1 + g.length, 0, L.card); } else { var fh = c.cards.findIndex(function (k) { return KN().isHeading(k.id); }); c.cards.splice(fh < 0 ? c.cards.length : fh, 0, L.card); } }, 'move').then(function () { restage(); refresh(); });
  }
  function restage() {   // keep the Learning Map's section membership in step with the board
    var b = boardById(ui.bid); if (!b) return; var map = {};
    (b.columns || []).forEach(function (c) { var cur = null; (c.cards || []).forEach(function (k) { if (KN().isHeading(k.id)) cur = k.id; else map[k.id] = cur; }); });
    setStage(ui.bid, map);
  }
  function addArea() { sheet({ title: 'New area', fields: [{ key: 't', label: 'Name', placeholder: 'e.g. My Garden' }], ok: 'Add' }).then(function (v) { var t = v && String(v.t || '').trim(); if (!t) return; edit(ui.bid, function (b) { b.columns = (b.columns || []).concat([{ id: ui.bid + '-d-' + rid().slice(-6), title: t, color: COLORS[(b.columns || []).length % COLORS.length], cards: [] }]); }, 'add').then(refresh); }); }
  function addList(colId) { sheet({ title: 'New list', fields: [{ key: 't', label: 'Name', placeholder: 'e.g. My Seeds' }], ok: 'Add' }).then(function (v) { var t = v && String(v.t || '').trim(); if (!t) return; edit(ui.bid, function (b) { var c = findCol(b, colId); c.cards = (c.cards || []).concat([newCard(t)]); }, 'add').then(function () { restage(); refresh(); }); }); }
  function addCat(colId) { sheet({ title: 'New category', text: 'A heading — lists you add or move under it belong to it.', fields: [{ key: 't', label: 'Name' }], ok: 'Add' }).then(function (v) { var t = v && String(v.t || '').trim(); if (!t) return; var k = newCard(t); edit(ui.bid, function (b) { var c = findCol(b, colId); c.cards = (c.cards || []).concat([k]); }, 'add').then(function () { KN().setHeading(k.id, true); refresh(); }); }); }
  function cloneFields(fromId, toId) { var f = fdOf(ui.bid); if (f.lists[fromId]) { f.lists[toId] = JSON.parse(JSON.stringify(f.lists[fromId])); KN().set('fd:' + ui.bid, f); } }
  function dupList(id) { var nc; edit(ui.bid, function (b) { var L = findCard(b, id); nc = newCard(L.card.title + ' (copy)'); L.col.cards.splice(L.i + 1, 0, nc); }, 'duplicate').then(function () { cloneFields(id, nc.id); restage(); refresh(); }); }
  function dupCat(id) { var pairs = [], nh; edit(ui.bid, function (b) { var L = findCard(b, id), g = groupOf(L.col, L.i); nh = newCard(L.card.title + ' (copy)'); var copy = [nh].concat(g.map(function (k) { var n = newCard(k.title); pairs.push([k.id, n.id]); return n; })); L.col.cards.splice.apply(L.col.cards, [L.i + 1 + g.length, 0].concat(copy)); }, 'duplicate').then(function () { KN().setHeading(nh.id, true); pairs.forEach(function (p) { cloneFields(p[0], p[1]); }); restage(); refresh(); }); }
  function dupArea(id) { var pairs = [], heads = []; edit(ui.bid, function (b) { var c = findCol(b, id), i = b.columns.indexOf(c), nc = { id: ui.bid + '-d-' + rid().slice(-6), title: c.title + ' (copy)', color: c.color, cards: (c.cards || []).map(function (k) { var n = newCard(k.title); if (KN().isHeading(k.id)) heads.push(n.id); else pairs.push([k.id, n.id]); return n; }) }; b.columns.splice(i + 1, 0, nc); }, 'duplicate').then(function () { heads.forEach(function (h) { KN().setHeading(h, true); }); pairs.forEach(function (p) { cloneFields(p[0], p[1]); }); restage(); refresh(); }); }
  function archive(b, col, cards) { b.archivedCards = (Array.isArray(b.archivedCards) ? b.archivedCards : []).concat(cards.map(function (k) { return Object.assign({}, k, { originalColId: col.id, originalColTitle: col.title, archivedAt: Date.now() }); })); }
  function removeList(id, hard) { closeMenu(); edit(ui.bid, function (b) { var L = findCard(b, id); L.col.cards.splice(L.i, 1); if (!hard && (L.card.stack || []).length) archive(b, L.col, [L.card]); }, 'remove').then(function () { toast(hard ? 'Deleted' : 'Removed — archived with its items'); restage(); refresh(); }); }
  function removeCat(id, how) { closeMenu(); edit(ui.bid, function (b) { var L = findCard(b, id), g = groupOf(L.col, L.i); if (how === 'heading') { L.col.cards.splice(L.i, 1); return; } L.col.cards.splice(L.i, 1 + g.length); archive(b, L.col, g); }, 'remove').then(function () { if (how === 'heading') KN().setHeading(id, false); toast(how === 'heading' ? 'Heading removed — its lists stay' : 'Removed — lists archived with their items'); restage(); refresh(); }); }
  function removeArea(id, hard) { closeMenu(); edit(ui.bid, function (b) { var c = findCol(b, id); b.columns = b.columns.filter(function (x) { return x.id !== id; }); if (!hard) archive(b, c, (c.cards || []).filter(function (k) { return !KN().isHeading(k.id) && (k.stack || []).length; })); }, 'remove').then(function () { toast(hard ? 'Deleted' : 'Area removed — its lists are archived with their items'); refresh(); }); }
  function pickArea(cb) { var b = boardById(ui.bid); menu('Move to', b.columns.map(function (c) { return { label: c.title, run: function () { cb(c.id); } }; })); }
  function pickPlace(cb) { var b = boardById(ui.bid), it = []; b.columns.forEach(function (c) { it.push({ label: c.title, sub: 'Area (no category)', run: function () { cb({ col: c.id, after: null }); } }); (c.cards || []).forEach(function (k) { if (KN().isHeading(k.id)) it.push({ label: '   ' + k.title, sub: 'Category in ' + c.title, run: function () { cb({ col: c.id, after: k.id }); } }); }); }); menu('Move to', it); }
  // existing cards from other boards: a linked stacked card (the same knowledge item), never a copy of the card
  function linkExisting(listId) {
    closeMenu(); ui.view = 'link'; ui.linkTo = listId; ui.lq = ''; head('Link existing cards', 'editor');
    ui.body.innerHTML = '<p class="bd-sub">Pick cards from your other boards. Each one is linked into this list — the original stays where it is and stays the only copy of its details.</p><input class="bd-in" data-lq placeholder="Search your cards" autocomplete="off"><div data-llist style="margin-top:10px"></div>';
    drawLink(); foot('<button type="button" class="bd-go" data-linkdone>Done</button>');
  }
  function drawLink() {
    var box = ui.body.querySelector('[data-llist]'); if (!box) return; var q = String(ui.lq || '').toLowerCase(), out = [];
    boards().forEach(function (b) { if (b.id === ui.bid) return; (b.columns || []).forEach(function (c) { (c.cards || []).forEach(function (k) { if (KN().isHeading(k.id)) return; if (q && String(k.title + ' ' + c.title + ' ' + b.title).toLowerCase().indexOf(q) < 0) return; out.push({ b: b, c: c, k: k }); }); }); });
    var have = {}; var L = findCard(boardById(ui.bid), ui.linkTo); ((L && L.card.stack) || []).forEach(function (s) { var key = KN().get('pk:' + s.id); if (key) have[key] = 1; });
    box.innerHTML = out.slice(0, 80).map(function (x) { var key = 'ki:card:' + x.k.id, on = have[key]; return '<button type="button" class="bd-row" style="width:100%;text-align:left;border:0;background:rgba(255,255,255,.05);border-radius:14px;margin-bottom:6px;color:inherit;font:inherit;cursor:pointer" data-link="' + esc(x.b.id + '|' + x.k.id) + '"' + (on ? ' disabled' : '') + '><div class="t"><b>' + esc(x.k.title) + '</b><small>' + esc(x.c.title + ' · ' + x.b.title) + '</small></div><span>' + (on ? '✓' : ICON.plus) + '</span></button>'; }).join('') || '<p class="bd-sub">No cards match.</p>';
  }
  function link(src) {
    var p = src.split('|'), sb = boardById(p[0]), sk = null; (sb.columns || []).forEach(function (c) { (c.cards || []).forEach(function (k) { if (k.id === p[1]) sk = { k: k, c: c }; }); }); if (!sk) return;
    var key = 'ki:card:' + sk.k.id, sid = ui.linkTo + '~link-' + slug(sk.k.title) + '-' + rid().slice(-4);
    edit(ui.bid, function (b) { var L = findCard(b, ui.linkTo); var st = { id: sid, title: sk.k.title, desc: 'Linked from “' + sk.c.title + '” · ' + sb.title, labels: [], complete: false, mastery: 1 }; if (sk.k.cover && (sk.k.cover.value || sk.k.cover.url)) st.cover = sk.k.cover; L.card.stack = (L.card.stack || []).concat([st]); L.card.hasStack = true; }, 'link').then(function () {
      var m = {}; m['pk:' + sid] = key; if (!KN().get(key)) m[key] = { title: sk.k.title, ref: { bid: sb.id, id: sk.k.id }, cat: 'card', at: Date.now() }; KN().setMany(m); toast('Linked'); drawLink();
    });
  }

  // ================================================================== clicks
  function onClick(e) {
    var t = e.target, g;
    if (ui.menu) { var mi = t.closest('[data-mi]'); if (mi) { var it = ui.menuItems[+mi.getAttribute('data-mi')]; closeMenu(); if (it && it.run) it.run(); return; } if (t.closest('[data-mx]') || !t.closest('.bd-menu')) { closeMenu(); return; } return; }
    if (t.closest('[data-x]')) return close();
    if ((g = t.closest('[data-back]'))) { var bk = g.getAttribute('data-back'); if (bk === 'start') return start(); if (bk === 'editor') return editor(ui.bid, ui.tab); return start(); }
    if ((g = t.closest('[data-way]'))) { var w = g.getAttribute('data-way'); if (w === 'template') { close(); setTimeout(function () { W().open(); }, 200); return; } if (w === 'mix') { ui.mx = null; return mix(null); } ui.sc = null; return scratch(); }
    // scratch
    if (ui.view === 'scratch') { keepScratch();
      if ((g = t.closest('[data-scol]'))) { ui.sc.color = g.getAttribute('data-scol'); return keepY(scratch); }
      if ((g = t.closest('[data-sicon]'))) { ui.sc.icon = g.getAttribute('data-sicon'); return keepY(scratch); }
      if ((g = t.closest('[data-sview]'))) { ui.sc.view = g.getAttribute('data-sview'); return keepY(scratch); }
      if (t.closest('[data-cover]')) return ui.file.click();
      if (t.closest('[data-nocover]')) { ui.sc.cover = ''; return keepY(scratch); }
      if (t.closest('[data-screate]')) return createScratch();
    }
    // mix
    if (ui.view === 'mix') { var ti = ui.body.querySelector('[data-mtitle]'); if (ti) ui.mx.title = ti.value;
      if ((g = t.closest('[data-mopen]'))) { var id = g.getAttribute('data-mopen'); ui.mx.open[id] = !ui.mx.open[id]; return keepY(function () { mix(ui.mx.into); }); }
      if ((g = t.closest('[data-mpick]'))) { var k = g.getAttribute('data-mpick'); ui.mx.pick[k] = !ui.mx.pick[k]; return keepY(function () { mix(ui.mx.into); }); }
      if ((g = t.closest('[data-msame]'))) { var s = g.getAttribute('data-msame'), at = s.lastIndexOf('|'); ui.mx.same[s.slice(0, at)] = s.slice(at + 1); return keepY(function () { mix(ui.mx.into); }); }
      if (t.closest('[data-mgo]')) return mixGo();
    }
    // editor
    if ((g = t.closest('[data-tab]'))) return editor(ui.bid, g.getAttribute('data-tab'));
    if ((g = t.closest('[data-om]'))) { var p = g.getAttribute('data-om'), i = p.indexOf('|'); return objMenu(p.slice(0, i), p.slice(i + 1)); }
    if ((g = t.closest('[data-addl]'))) return addList(g.getAttribute('data-addl'));
    if ((g = t.closest('[data-addc]'))) return addCat(g.getAttribute('data-addc'));
    if (t.closest('[data-adda]')) return addArea();
    if (t.closest('[data-frommix]')) { ui.mx = null; return mix(ui.bid); }
    if (t.closest('[data-undo]')) { undo().then(function (l) { toast(l ? '↺ Undone (' + l + ')' : 'Nothing to undo'); refresh(); }); return; }
    if (t.closest('[data-done]')) { var bid = ui.bid; close(); setTimeout(function () { if (window.MinestStarter && MinestStarter.has(bid)) MinestStarter.home(bid); }, 200); return; }
    if (t.closest('[data-openw]')) { var b2 = ui.bid; close(); setTimeout(function () { openIn(b2); }, 200); return; }
    // look
    if (t.closest('[data-cover]')) return ui.file.click();
    if (t.closest('[data-nocover]')) return setLook({ cover: '' });
    if ((g = t.closest('[data-lcol]'))) return setLook({ color: g.getAttribute('data-lcol') });
    if ((g = t.closest('[data-licon]'))) return setLook({ icon: g.getAttribute('data-licon') });
    if ((g = t.closest('[data-lview]'))) return setLook({ view: g.getAttribute('data-lview') });
    if ((g = t.closest('[data-llay]'))) return setLook({ layout: g.getAttribute('data-llay') });
    if (t.closest('[data-lsave]')) { var nt = String(ui.body.querySelector('[data-ltitle]').value || '').trim(), ns = String(ui.body.querySelector('[data-lsub]').value || '').trim(); var b3 = boardById(ui.bid); var go = nt && nt !== b3.title ? edit(ui.bid, function (b) { b.title = nt; }, 'title') : Promise.resolve(); go.then(function () { setLook({ subtitle: ns }); toast('Saved'); }); return; }
    // fields
    if ((g = t.closest('[data-flist]'))) { ui.flist = g.getAttribute('data-flist'); return keepY(function () { editor(ui.bid, 'fields'); }); }
    if ((g = t.closest('[data-ftog]'))) return toggleField(g.getAttribute('data-ftog'));
    if (t.closest('[data-fnew]')) return newField();
    // template
    if (t.closest('[data-tsave]')) { var b4 = boardById(ui.bid); sheet({ title: 'Save as my template', text: 'Structure, fields and look only — your items stay out.', fields: [{ key: 'n', label: 'Template name', value: b4.title }], ok: 'Save' }).then(function (v) { if (!v || !String(v.n || '').trim()) return; var tp = toTemplate(b4, v.n.trim()); W().saveTemplate(tp); var w0 = Object.assign({}, KN().get('lom:world:' + b4.id) || {}, { fromTemplate: tp.id }); KN().set('lom:world:' + b4.id, w0); toast('Saved to My templates'); editor(ui.bid, 'template'); }); return; }
    if (t.closest('[data-tupdate]')) { var b5 = boardById(ui.bid), w1 = KN().get('lom:world:' + b5.id) || {}, old = tplById(w1.fromTemplate); if (!old) return; var tp2 = toTemplate(b5, old.name); tp2.id = old.id; tp2.version = (old.version || 1) + 1; tp2.versionString = '1.' + (tp2.version - 1) + '.0'; W().saveTemplate(tp2); toast('Template updated to version ' + tp2.versionString); return; }
    if (t.closest('[data-texport]')) { var b6 = boardById(ui.bid); return download(toTemplate(b6, b6.title), slug(b6.title) + '.minest-template.json'); }
    if (t.closest('[data-dexport]')) return exportWithItems(boardById(ui.bid));
    // link
    if ((g = t.closest('[data-link]'))) return link(g.getAttribute('data-link'));
    if (t.closest('[data-linkdone]')) return editor(ui.bid, 'structure');
  }
  document.addEventListener('input', function (e) { if (ui.view === 'link' && e.target && e.target.matches && e.target.matches('[data-lq]')) { ui.lq = e.target.value; drawLink(); } });
  // a world opens in the view its owner picked
  function openIn(bid) {
    var a = KN().get('wa:' + bid) || {}, v = a.view || 'home';
    if (v === 'home' && window.MinestStarter && MinestStarter.has(bid)) return MinestStarter.home(bid);
    try { if (A().selectBoard) A().selectBoard(bid); } catch (e) {}
    setTimeout(function () { if (v === 'timeline' && window.MinestTimeline) MinestTimeline.open(bid); else if (v === 'contents' && window.MinestContents) MinestContents.open(); else if (v === 'map' && window.MinestMap) MinestMap.open(bid); else if (v === 'kanban') {} else if (window.MinestWiki) MinestWiki.open(bid); }, 250);
  }

  window.MinestBuilder = { start: function () { start(); }, open: function (bid, tab) { editor(bid, tab); }, mix: function (into) { ui.mx = null; mix(into || null); }, scratch: function () { ui.sc = null; scratch(); }, close: close, isOpen: function () { return ui.open; }, openIn: openIn, toTemplate: toTemplate, _undo: undo };
})();
