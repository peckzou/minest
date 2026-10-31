/* Knowledge Drive × My World: a 🚗 button in My World's header opens the Presentation Gallery (Dynamic → Knowledge Drive),
   which starts a drive from the List / Board you are in, or the whole Workspace. My World closes while you drive (its 3D stops)
   and opens again where you were when you leave. Reads boards through MinestAI.boards(); writes nothing to Kanban. */
(function () {
  'use strict';
  if (!window.MinestDrive || window.MinestDrive.gallery) return;
  var D = window.MinestDrive, SAVE = 'minest.drive.v1';
  var CAR = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 16V11.5L7 6.5h10l2 5V16"/><path d="M3.5 11.5h17"/><rect x="3.5" y="11.5" width="17" height="5" rx="1.5"/><circle cx="7.5" cy="16.5" r="1.6"/><circle cx="16.5" cy="16.5" r="1.6"/></svg>';
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function boards() { try { return (window.MinestAI && MinestAI.boards && MinestAI.boards()) || []; } catch (e) { return []; } }
  function U() { return window.MinestUniverse; }
  function saved(m) { try { return JSON.parse(localStorage.getItem(MODES[m].store) || '{}') || {}; } catch (e) { return {}; } }
  // the Dynamic presentations: the same Board / List / Card, three ways to travel through them
  var MODES = {
    drive: { icon: '🚗', name: 'Knowledge Drive', tag: 'Drive the roads', desc: 'Lists become roads, cards become billboards. Tap one to look at it; flip it to read.', store: SAVE, unit: ['road', 'roads'], stop: 'stops',
      api: function () { return window.MinestDrive; }, styles: function () { return D.styles; }, styleLabel: 'Landscape',
      resume: function (r, sv) { return r.name + ' · ' + Math.min(r.items.length, Math.max(0, Math.round((sv.s - 70) / 46) + 1)) + '/' + r.items.length; } },
    train: { icon: '🚆', name: 'Knowledge Train', tag: 'Journey Through Knowledge', desc: 'Sit by the window; each list is a railway line. Tap what you pass — the train stops, flip it to read.', store: 'minest.train.v1', unit: ['line', 'lines'], stop: 'stops',
      api: function () { return window.MinestTrain; }, styles: function () { return D.styles; }, styleLabel: 'Scenery',
      resume: function (r, sv) { return String(r.title).replace(/\s*[(（]\s*\d+\s*[)）]\s*$/, '') + ' Line · ' + Math.min(r.items.length, Math.max(0, Math.round(((sv.s || 0) - 140) / 54) + 1)) + '/' + r.items.length; } },
    metro: { icon: '🚇', name: 'Knowledge Metro', tag: 'Navigate the Connections', desc: 'Every list is a metro line, every card a station. Board trains, transfer, and explore the Metro Map.', store: 'minest.metro.v1', unit: ['line', 'lines'], stop: 'stations', max: 8,
      api: function () { return window.MinestMetro; }, styles: function () { return (window.MinestMetro && MinestMetro.themes || []).map(function (t) { return { id: t.id, name: t.name, icon: t.icon }; }); }, styleLabel: 'Station style',
      resume: function (r, sv) { return String(r.title).replace(/\s*[(（]\s*\d+\s*[)）]\s*$/, '') + ' · station ' + ((sv.si || 0) + 1) + '/' + r.items.length; } },
    tower: { icon: '🏙', name: 'Knowledge Skyscraper', tag: 'Explore Knowledge Vertically', desc: 'A board becomes a glass tower: ride the elevator, open the cutaway, tap a floor and pull items off the shelves.', store: 'minest.tower.v1', unit: ['list', 'lists'], stop: 'items', noWorkspace: 1,
      api: function () { return window.MinestTower; }, styles: function () { return (window.MinestTower && MinestTower.exteriors || []).map(function (e) { return { id: e.id, name: e.name, icon: '🏢' }; }); }, styleLabel: 'Exterior',
      key: function (src) { return 'tower:' + src.bid; }, resumeOf: function (sv) { return sv && sv.floor ? 'floor ' + (sv.floor + 1) : null; } },
    // Dynamic Presentation Phase 2 (showcase-common.js): the same cards as objects you find, pull out and read
    rack: { icon: '🎠', name: 'Rotating Rack', tag: 'Rotate · Select · Pull', desc: 'Up to 12 cards ride a turning display as books, memory orbs and medals. Tap one: it turns to you and slides out; flip it to read.', store: 'minest.rack.v1', unit: ['list', 'lists'], stop: 'items',
      api: function () { return window.MinestRack; }, styles: function () { return (window.MinestRack && MinestRack.shapes || []).map(function (s) { return { id: s[0], name: s[1].replace(/^\S+\s/, ''), icon: s[1].split(' ')[0] }; }); }, styleLabel: 'Rack',
      key: function (src) { return D.plan(src).key; }, resumeOf: function (sv) { return sv && sv.shape ? ({ ring: 'Ring Turntable', tower: 'Vertical Tower', tiers: 'Two-Tier Carousel' }[sv.shape] || sv.shape) : null; } },
    library: { icon: '📚', name: 'Library Corridor', tag: 'Walk · Browse · Pull', desc: 'Walk a walnut library: every list a section of tall shelves, every card a book. Tap a shelf to step up, tap a book to pull it out.', store: 'minest.library.v1', unit: ['section', 'sections'], stop: 'books',
      api: function () { return window.MinestLibrary; }, styles: function () { return (window.MinestLibrary && MinestLibrary.atmospheres || []).map(function (a) { return { id: a.id, name: a.name.replace(/^\S+\s/, ''), icon: a.name.split(' ')[0] }; }); }, styleLabel: 'Atmosphere',
      key: function (src) { return D.plan(src).key; }, resumeOf: function (sv) { return sv && sv.z != null && sv.z < 1 ? 'shelf ' + Math.max(1, Math.round(-sv.z / 1.2)) : null; } },
    museum: { icon: '🏛', name: 'Museum Walkthrough', tag: 'Walk · Discover · Read', desc: 'Halls of pictures, sculptures and glass cases. Take the Guided Tour or walk freely; tap an exhibit to step up, tap again to read it.', store: 'minest.museum.v1', unit: ['hall', 'halls'], stop: 'exhibits',
      api: function () { return window.MinestMuseum; }, styles: function () { return []; }, styleLabel: '',
      key: function (src) { return D.plan(src).key; }, resumeOf: function (sv) { return sv && sv.z != null ? 'exhibit ' + ((sv.idx || 0) + 1) : null; } },
    // Dynamic Presentation Phase 3: a downtown avenue of shops, and a flight between planets
    city: { icon: '🌆', name: 'Knowledge City', tag: 'Stroll · Shop · Read', desc: 'Run down a downtown avenue by day or night. Every list is a shop between real neighbours; its cards sit in the shop window. Tap a window to step up, tap a card to read it.', store: 'minest.city.v2', unit: ['shop', 'shops'], stop: 'cards',
      api: function () { return window.MinestCity; }, styles: function () { return (window.MinestCity && MinestCity.styles || []).map(function (s) { return { id: s.id, name: s.name.replace(/^\S+\s/, ''), icon: s.icon }; }); }, styleLabel: 'District',
      key: function (src) { return D.plan(src).key; }, resumeOf: function (sv) { return sv && sv.z != null ? (sv.night ? 'Night' : 'Day') + ' · ' + Math.round(-sv.z) + ' m' : null; } },
    galaxy: { icon: '🌌', name: 'Knowledge Galaxy', tag: 'Fly · Land · Explore', desc: 'Fly a freighter down a route of planets — each board a world. Tap a planet as it passes to land, walk the trail of card monuments, or jump to hyperspace.', store: 'minest-galaxy-v2', unit: ['planet', 'planets'], stop: 'cards',
      api: function () { return window.MinestGalaxy; }, styles: function () { return []; }, styleLabel: '',
      key: function () { return 'galaxy'; }, resumeOf: function (sv) { return sv && sv.pi != null ? 'planet ' + (sv.pi + 1) : null; } }
  };
  var mode = 'drive'; try { var m0 = localStorage.getItem('minest.dynamic.mode'); if (MODES[m0]) mode = m0; } catch (e) {}
  function hap() { try { webkit.messageHandlers.minest.postMessage({ action: 'haptic', data: { style: 'selection' } }); } catch (e) {} }

  // where you are in My World → what a drive can start from
  function sources() {
    var p = (U() && U().path && U().path()) || [], bid = null, col = null, out = [], B = boards();
    p.forEach(function (n) { if (n.bid) bid = n.bid; if (n.col) col = n.col; });
    var b = bid && B.filter(function (x) { return x.id === bid; })[0], l = b && col && (b.columns || []).filter(function (c) { return c.id === col; })[0];
    if (l) out.push({ src: { type: 'list', bid: bid, col: col }, icon: '🛣', title: l.title || 'This list', sub: 'Start on this road' });
    if (b) out.push({ src: { type: 'board', bid: bid }, icon: '🗺', title: b.title || 'This board', sub: 'Every list is a road' });
    if (!b) B.slice(0, 6).forEach(function (x) { out.push({ src: { type: 'board', bid: x.id }, icon: '🗺', title: x.title || 'Board', sub: 'Every list is a road' }); });
    out.push({ src: { type: 'workspace' }, icon: '🌐', title: 'Workspace', sub: 'Every board is a region' });
    var S = saved(mode), MO = MODES[mode];
    return out.map(function (o) {
      var pl = null; try { pl = D.plan(o.src); } catch (e) {}
      var roads = pl ? pl.roads.slice(0, MO.max || 1e9) : [];
      o.roads = roads.length; o.stops = roads.reduce(function (n, r) { return n + r.items.length; }, 0);
      if (MO.resumeOf) { o.resume = MO.resumeOf(S[MO.key(o.src)]); return o; }
      var sv = pl && S[pl.key], id = sv && (sv.road || sv.li || sv.line), r = id && roads.filter(function (x) { return x.id === id; })[0]; o.resume = r ? MO.resume(r, sv) : null;
      return o;
    }).filter(function (o) { return o.stops > 0 && !(MO.noWorkspace && o.src.type === 'workspace'); });
  }

  // ---------------- Presentation Gallery sheet
  var sheet = null, style = null;
  function gallery(redraw) {
    if (sheet && !redraw) return close();
    var list = sources(), MO = MODES[mode];
    sheet = sheet || document.createElement('div'); sheet.className = 'kdg' + (sheet.isConnected ? ' on' : ''); sheet.setAttribute('role', 'dialog'); sheet.setAttribute('aria-label', 'Presentation Gallery');
    sheet.innerHTML = '<div class="kdg-card"><div class="kdg-head"><div><small>Presentation Gallery</small><b>Dynamic</b></div><button type="button" class="kdg-x" data-kdg="x" aria-label="Close">✕</button></div>' +
      '<div class="kdg-modes" role="tablist">' + Object.keys(MODES).filter(function (k) { return MODES[k].api(); }).map(function (k) { var M = MODES[k]; return '<button type="button" role="tab" aria-selected="' + (k === mode) + '" data-kdg="mode" data-m="' + k + '" class="kdg-mode kdg-m-' + k + (k === mode ? ' on' : '') + '"><span class="kdg-art" aria-hidden="true"><i></i><i></i><i></i><span></span></span><b>' + M.icon + ' ' + M.name.replace('Knowledge ', '') + '</b><small>' + M.tag + '</small></button>'; }).join('') + '</div>' +
      '<p class="kdg-desc"><b>' + MO.icon + ' ' + MO.name + '</b> · ' + MO.desc + '</p>' +
      '<h4>Start from</h4><div class="kdg-src">' + (list.length ? list.map(function (o, i) {
        return '<button type="button" data-kdg="go" data-i="' + i + '"><span class="kdg-ic">' + o.icon + '</span><span class="kdg-t"><b>' + esc(o.title) + '</b><small>' + esc(o.sub.replace('road', MO.unit[0])) + ' · ' + o.roads + ' ' + (o.roads === 1 ? MO.unit[0] : MO.unit[1]) + ' · ' + o.stops + ' ' + MO.stop + '</small>' +
          (o.resume ? '<em>↺ Resume · ' + esc(o.resume) + '</em>' : '') + '</span><span class="kdg-go">▶</span></button>';
      }).join('') : '<p class="kdg-empty">Add some cards to a board first.</p>') + '</div>' +
      (MO.styleLabel ? '<h4>' + MO.styleLabel + '</h4>' : '') + '<div class="kdg-styles">' + MO.styles().map(function (s) { return '<button type="button" data-kdg="style" data-s="' + s.id + '"' + (style === s.id ? ' class="on"' : '') + '>' + s.icon + ' ' + s.name + '</button>'; }).join('') + '</div></div>';
    sheet.__list = list;
    if (sheet.__wired) return; sheet.__wired = true;
    ['pointerdown', 'touchstart', 'touchmove', 'wheel'].forEach(function (ev) { sheet.addEventListener(ev, function (e) { e.stopPropagation(); }, { passive: true }); });
    sheet.addEventListener('click', function (e) {
      var b = e.target.closest('[data-kdg]'); if (!b) { if (e.target === sheet) close(); return; }
      var k = b.dataset.kdg;
      if (k === 'x') close();
      else if (k === 'style') { style = style === b.dataset.s ? null : b.dataset.s; sheet.querySelectorAll('[data-kdg="style"]').forEach(function (x) { x.classList.toggle('on', x.dataset.s === style); }); hap(); }
      else if (k === 'go') start(sheet.__list[+b.dataset.i].src);
      else if (k === 'mode' && b.dataset.m !== mode) { mode = b.dataset.m; style = null; try { localStorage.setItem('minest.dynamic.mode', mode); } catch (x) {} hap(); gallery(true); }
    });
    document.body.appendChild(sheet); requestAnimationFrame(function () { if (sheet) sheet.classList.add('on'); });
  }
  function close() { var s = sheet; sheet = null; if (!s) return; s.classList.remove('on'); setTimeout(function () { s.remove(); }, 220); }
  function onEsc(e) { if (e.key === 'Escape' && sheet) { e.stopPropagation(); close(); } }
  document.addEventListener('keydown', onEsc, true);

  function start(src) {
    var u = U(), back = u && u.isOpen && u.isOpen() ? (u.path && u.path()) : null;
    close(); hap();
    if (back && u.close) u.close();   // My World's 3D stops while you drive
    try {
      var MO = MODES[mode], o = { source: src, onExit: function () { if (back && U() && U().go) U().go(back); } };
      if (mode === 'metro') { o.maxLines = MO.max; if (style) try { var a = JSON.parse(localStorage.getItem(MO.store) || '{}'), k = D.plan(src).key; a[k] = Object.assign(a[k] || {}, { theme: style }); localStorage.setItem(MO.store, JSON.stringify(a)); } catch (x) {} }
      else if (mode === 'tower') o.ext = style || undefined;
      else if (mode === 'rack') o.shape = style || undefined;
      else if (mode === 'library') o.atm = style || undefined;
      else if (mode === 'museum') {}
      else o.style = style || undefined;
      MO.api().open(o);
    } catch (e) { if (back && U() && U().go) U().go(back); try { window.showToast && showToast(MODES[mode].name + ': ' + e.message); } catch (x) {} }
  }

  // ---------------- the 🚗 button in My World's header (the header is redrawn on every render, so it is put back)
  function addButton() {
    var root = document.querySelector('.uv'), head = root && root.querySelector('.uv-head'); if (!head || head.querySelector('.mn-kd-trigger')) return;
    var b = document.createElement('button'); b.type = 'button'; b.className = 'uv-b mn-kd-trigger'; b.innerHTML = CAR; b.title = 'Dynamic presentations'; b.setAttribute('aria-label', 'Presentation Gallery: Dynamic');
    b.addEventListener('click', function (e) { e.stopPropagation(); e.preventDefault(); gallery(); });
    var more = head.querySelector('[data-more]'); if (more) more.before(b); else head.appendChild(b);
  }
  var headObs = null, watched = null;
  function watch() {
    var root = document.querySelector('.uv');
    if (root === watched) return; watched = root; if (headObs) { headObs.disconnect(); headObs = null; }
    if (!root) { close(); return; }
    var main = root.querySelector('.uv-main') || root; headObs = new MutationObserver(addButton); headObs.observe(main, { childList: true, subtree: false });
    var head = root.querySelector('.uv-head'); if (head) headObs.observe(head, { childList: true });
    addButton();
  }
  new MutationObserver(watch).observe(document.body, { childList: true });
  watch();

  D.gallery = gallery;
  D.startFrom = start;
})();
