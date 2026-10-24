  /* ── 53.85 · ✨ Smart build, on every level: one tap makes a whole layout and shows it at once —
     the island (buildings → rooms → displays → things), a building (its rooms, made for its things and the Box's — other
     buildings stay as they are), a room (its displays and the things on them), a display you selected (its things in
     order, its kind). The dollhouse is drawn as big as the view allows (its picture is cropped to the house). 🔄 Change makes another (4 ways per level); three suggestions add on top of
     what you see — 🌳 Decor, 🐾 Moving things, 🖼 Displays; ✓ Keep saves it all (one undo step); ✕ Cancel puts it back
     exactly as it was. Nothing is saved while you look. Land mode ends with a tap on empty space. */
  var SB = null;
  var SB_WAYS = {
    island: [
      { n: 'Your Kanban lists, each in the room that suits it', mode: 'build', lay: 'cluster' },
      { n: 'Sorted by what the things are', mode: 'smart', lay: 'row' },
      { n: 'Your lists, in other buildings, round the island', mode: 'build', lay: 'ring', alt: 1 },
      { n: 'Sorted by kind, in other buildings, spread out', mode: 'smart', lay: 'spread', alt: 1 }],
    building: [
      { n: 'Rooms for your things — up to 3 lists a room', mode: 'build', plan: 'suggest' },
      { n: 'A room for each Kanban list', mode: 'build', plan: 'one' },
      { n: 'Sorted by kind, quiet rooms upstairs', mode: 'smart', plan: 'suggest', floors: 1 },
      { n: 'By kind, a room each', mode: 'smart', plan: 'one' }],
    room: [
      { n: 'Your lists, along the walls', mode: 'list', lay: 'walls' },
      { n: 'Sorted by kind, in rows', mode: 'smart', lay: 'rows' },
      { n: 'Your lists on other displays, facing rows', mode: 'list', lay: 'gallery', alt: 1 },
      { n: 'By kind on other displays, in the middle', mode: 'smart', lay: 'center', alt: 1 }],
    fixture: [
      { n: 'A → Z', order: 'name' },
      { n: 'Things of one list together, another display', order: 'list', kind: 1 },
      { n: 'The other way round, another display', order: 'reverse', kind: 2 },
      { n: 'A fresh mix, another display', order: 'shuffle', kind: 3 }]
  };
  var SB_LABEL = { island: 'Smart build', building: 'Smart rooms', room: 'Smart room', fixture: 'Smart display' };
  function sbLevel() {
    if (!V || V.visit) return null;
    if (V.sel && V.sel.pc && !(V.at && !V.at.room)) { var f = pieceOf(V.sel.pc); if (f && (f.it || []).length && capOf(f) > 0) return { lv: 'fixture', p: f }; }
    if (V.at && V.at.room) return { lv: 'room' };
    if (!V.at) return { lv: 'island' };
    var b = bldOf(); return b ? { lv: 'building', p: b } : null;
  }
  /* a building's rooms, made for its things: the things already in this building and the ones still in the Box (things in
     other buildings or on the island stay where they are); groups by Kanban list (or by kind), the room that suits each */
  function sbBldRooms(b, w) {
    var I = islandD(), inB = {}, away = {};
    (I.pc || []).forEach(function (p) { if (p.rooms) p.rooms.forEach(function (r) { (r.d && r.d.pc || []).forEach(function (q) { (q.it || []).forEach(function (ref) { (p === b ? inB : away)[ref] = 1; }); }); }); else (p.it || []).forEach(function (ref) { away[ref] = 1; }); });
    var plan = makePlan('build'), groups = plan.groups.map(function (g) { var c = Object.assign({}, g); c.refs = g.refs.filter(function (r) { return inB[r] || !away[r]; }); return c; }).filter(function (g) { return g.on && g.refs.length; });
    if (w.mode === 'smart') {   // by kind: the same things, each in the group its own words say (your earlier moves count)
      var G = {}, ord = [], tk = THEME_FOR[lookId(V.bid, (board(V.bid) || {}).title)] || [];
      groups.forEach(function (g) { g.refs.forEach(function (r) { var c = (V.d.cat || {})[r]; if (!CAT[c]) c = sortOne(r, tk).cat; if (!G[c]) { G[c] = { id: c, n: (V.d.gname || {})[c] || CAT[c].n, ic: CAT[c].ic, k: (V.d.gkind || {})[c] || CAT[c].k, refs: [], on: true }; ord.push(c); } G[c].refs.push(r); }); });
      groups = ord.sort(function (a, b2) { return CAT[a].at - CAT[b2].at; }).map(function (c) { return G[c]; });
    }
    if (!groups.length) {   // nothing free for it (the things are in other buildings): rooms made ready — furnished, displays waiting
      var SETS = [suggestRooms(b), suggestRooms(b).slice(0, 3), suggestRooms(b).concat(['gallery', 'reading']), ['living', 'gallery', 'study', 'memory']],
        ks = SETS[(SB.i || 0) % SETS.length].filter(function (k, i, a) { return ROOMS[k] && a.indexOf(k) === i; });
      b.rooms = ks.map(function (k) { var r = { id: 'r' + uid().slice(1), k: k, n: ROOMS[k][0], auto: 1 }; roomD(r); return r; }); b.roomsInit = 1; b.floors = 1;
      SB.ready = b.rooms.length; return 0;
    }
    SB.ready = 0;
    var byRoom = {}, order = [];
    groups.forEach(function (g) { var rk = roomFor(g); if (!ROOMS[rk]) rk = 'hall'; if (!byRoom[rk]) { byRoom[rk] = []; order.push(rk); } byRoom[rk].push(g); });
    var chunks = []; order.forEach(function (rk) { var cur = null, cnt = 0, n = 0;
      byRoom[rk].forEach(function (g) { if (cur && (w.plan === 'one' || cur.gs.length >= 3 || cnt + g.refs.length > 24)) cur = null; if (!cur) { n++; cur = { rk: rk, nth: n, gs: [] }; chunks.push(cur); cnt = 0; } cur.gs.push(g); cnt += g.refs.length; }); });
    b.rooms = []; b.roomsInit = 1; b.floors = 1;
    chunks.forEach(function (c) {
      var T = ROOMS[c.rk], up = w.floors && /^(bedroom|study|dreams|reading|music|memory)$/.test(c.rk) && chunks.length > 2;
      var room = { id: 'r' + uid().slice(1), k: c.rk, n: T[0] + (c.nth > 1 ? ' ' + c.nth : ''), nth: c.nth > 1 ? c.nth : undefined, fl: up ? 2 : undefined, seeded: 1, auto: 1, d: { scene: 'room', rot: 0, pc: [], land: DEF_LAND.slice(), floor: T[3], wall: T[4] } };
      if (!room.nth) delete room.nth; if (!room.fl) delete room.fl; b.rooms.push(room); roomD(room);
      withD(room.d, function () { placeGroups(c.gs, 'build'); });
    });
    if (b.rooms.some(function (r) { return r.fl > 1; })) b.floors = 2;
    return groups.length;
  }
  function sbRestore() { var o = JSON.parse(SB.snap), d = SB.d; Object.keys(d).forEach(function (k) { delete d[k]; }); Object.assign(d, o); if (V && V.d === d) refreshLand();
    if (SB.L.lv === 'fixture' || SB.L.lv === 'building') SB.L.p = (d.pc || []).filter(function (q) { return q.id === SB.pid; })[0] || SB.L.p; }
  function sbAlt(on, fn) {   // the island's other buildings for a variation (school → library, exhibition hall → a Studio museum, house → cabin)
    var keep = {}; Object.keys(CLUSTER).forEach(function (c) { keep[c] = CLUSTER[c][1]; });
    if (on) { var L = window.MinestAssets3D && MinestAssets3D.lib4;
      if (K.library && BUILD.library && CLUSTER.school) CLUSTER.school[1] = 'library';
      if (L && L.buildings.indexOf('BD-101') >= 0) { ensureBld('bld:BD-101'); CLUSTER.museum[1] = 'bld:BD-101'; }
      if (K.cabin && BUILD.cabin) CLUSTER.home[1] = 'cabin'; }
    try { return fn(); } finally { Object.keys(keep).forEach(function (c) { CLUSTER[c][1] = keep[c]; }); }
  }
  var SB_ALTK = ['museum', 'gallery', 'wall', 'shelf', 'books', 'grid'];
  function quiet(fn) { var t0 = toast; toast = function () {}; try { return fn(); } finally { toast = t0; } }
  function sbRun(i) {
    sbRestore(); var W = SB_WAYS[SB.L.lv], w = W[i % W.length], plan; index(); SB.i = i; SB.added = {};
    quiet(function () {
      if (SB.L.lv === 'fixture') {
        roApply({ lv: 'fixture', p: SB.L.p }, w.order);
        if (w.kind) { var st = roStyles({ lv: 'fixture', p: SB.L.p }); if (st.length) { var d0 = V.d; try { st[(w.kind - 1) % st.length].go(); } finally { V.d = d0; } } }
        SB.groups = SB.L.p.it.length; return;
      }
      if (SB.L.lv === 'building') { SB.groups = sbBldRooms(SB.L.p, w); return; }
      plan = makePlan(w.mode); SB.groups = plan.groups.filter(function (g) { return g.on; }).length;
      if (!plan.groups.length) return;
      if (SB.L.lv === 'island') { plan.mode = 'build'; sbAlt(w.alt, function () { buildApply(plan); }); roApply({ lv: 'island' }, w.lay); return; }
      plan.groups.forEach(function (g, k) { if (w.alt) { var alt = SB_ALTK.filter(function (x) { return x !== g.k && K[x] && BUILD[x]; }); g.k = alt[k % alt.length]; } });
      plan.mode = w.mode === 'list' ? 'list' : 'smart'; applyPlan(plan); roApply({ lv: 'room' }, w.lay);
    });
    if (SB.L.lv === 'building' && BV) bvDraw(); render(); if (SB.L.lv !== 'fixture' && SB.L.lv !== 'building') fit(); sbDraw();
    if (!SB.groups && !(SB.L.lv === 'building' && SB.ready)) toast(SB.L.lv === 'building' ? 'No things for this building yet — everything is in other buildings or on the island' : SB.L.lv === 'room' ? 'Nothing in the Box for this room — add things, or ✕ to close' : 'Everything is already out on pieces you placed yourself — ✕ to close');
  }
  // ---- suggestions: added on top of the layout you are looking at
  function ids(a) { return (a || []).map(function (v) { return Array.isArray(v) ? v[0] : v; }); }
  function pickSome(a, n) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a.slice(0, n); }
  function lib4Ids(group, prefix) { var L = window.MinestAssets3D && MinestAssets3D.lib4; return L ? (group ? L.objects[group] : []).map(function (id) { return prefix + id; }) : []; }
  function sbPlace(k, nx, ny) {   // one piece near (nx, ny) or anywhere free, without a word if there is no room
    if (/^obj:/.test(k)) lib4Kind(k); else if (/^bld:/.test(k)) ensureBld(k); if (!K[k] || !BUILD[k] || (indoor() && isOutdoor(k))) return null;
    var lb = lbox(), p = null;
    quiet(function () { for (var t = 0; t < 12 && !p; t++) { var x = nx != null ? nx + (Math.random() * 4 - 2) : lb.x0 + 1 + Math.random() * Math.max(1, lb.x1 - lb.x0 - 2), y = ny != null ? ny + (Math.random() * 4 - 2) : lb.y0 + 1 + Math.random() * Math.max(1, lb.y1 - lb.y0 - 2); p = add(k, x, y); } });
    return p;
  }
  function sbSuggestRooms(kind) {   // a building: a little in each of its rooms
    var b = SB.L.p, n = 0, mobs = MOB_KINDS.filter(function (k) { return /cat|dog|rabbit|bunny|parrot|hamster|fox/.test(k); });
    (b.rooms || []).forEach(function (r, i) {
      var list = kind === 'decor' ? pickSome(((FURNISH[r.k]) || []).concat(['f_plant', 'f_lamp']), 2).concat(pickSome(lib4Ids('indoor', 'obj:'), 1))
        : kind === 'move' ? (i < 3 ? pickSome(mobs.length ? mobs : MOB_KINDS, 1) : [])
        : [((ROOMS[r.k] && ROOMS[r.k][2]) || ['museum'])[0]];
      roomD(r); withD(r.d, function () { list.forEach(function (k) { if (sbPlace(k)) n++; }); });
    });
    SB.added[kind] = (SB.added[kind] || 0) + n; if (BV) bvDraw(); render(); sbDraw(); hap(n ? 'light' : 'warning');
    toast(n ? ({ decor: '🌳 ', move: '🐾 ', display: '🖼 ' }[kind]) + n + ' added across the rooms — ✓ Keep when you like it' : 'No free space for more in these rooms');
  }
  function sbSuggest(kind) {
    if (SB.L.lv === 'building') return sbSuggestRooms(kind);
    var lv = SB.L.lv, f = SB.L.p, r = roomOf(), near = lv === 'fixture' ? [f.x, f.y] : [null, null], list, n;
    if (kind === 'decor') {
      list = lv === 'island' || (lv === 'fixture' && !indoor())
        ? pickSome(DECOR_KINDS.filter(function (k) { return /^(tree|birch|cherry|spruce|palm|bamboo|bush|flowers|rock|fountain|lamp|bench|well|beehive)$/.test(k); }).concat(ids(FLOWER_KINDS)), lv === 'fixture' ? 2 : 3).concat(pickSome(lib4Ids('outdoor', 'obj:'), lv === 'fixture' ? 0 : 1))
        : pickSome(((r && FURNISH[r.k]) || []).concat(['f_plant', 'f_lamp', 'f_rug']), 2).concat(pickSome(lib4Ids('indoor', 'obj:'), lv === 'fixture' ? 1 : 2));
    } else if (kind === 'move') {
      var mobs = MOB_KINDS.filter(function (k) { return !indoor() || !isOutdoor(k); });
      list = lv === 'island' ? pickSome(mobs, 2).concat(pickSome(CRITTER_KINDS, 2)) : pickSome(mobs, lv === 'fixture' ? 1 : 2);
    } else {
      if (lv === 'island') { var pres = ['sculpture_garden', 'open_air_gallery', 'market_collection', 'discovery_park'], pre = pres[(SB.added.display || 0) % pres.length], made = null;
        quiet(function () { try { made = exSample(pre); } catch (e) {} });
        if (made) { SB.added.display = (SB.added.display || 0) + 1; render(); sbDraw(); toast('🖼 ' + EX_PRESETS[pre].n + ' — an outdoor exhibition, ready for your things'); return; }
        list = pickSome(lib4Ids('expo', 'obj:'), 2);
      } else if (lv === 'room') list = [((r && ROOMS[r.k] && ROOMS[r.k][2]) || ['museum'])[0]].concat(pickSome(lib4Ids('museum', 'obj:'), 2));
      else list = [f.k].concat(pickSome(lib4Ids('museum', 'obj:'), 1));
    }
    n = 0; list.forEach(function (k) { if (sbPlace(k, near[0], near[1])) n++; });
    SB.added[kind] = (SB.added[kind] || 0) + n; render(); sbDraw(); hap(n ? 'light' : 'warning');
    toast(n ? ({ decor: '🌳 ', move: '🐾 ', display: '🖼 ' }[kind]) + n + ' added — tap again for more, ✓ Keep when you like it' : 'No free space for more here');
  }
  function sbDraw() {
    var o = document.querySelector('.mn-sb'); if (!SB) { if (o) o.remove(); sbPill(); return; }
    if (!o) { o = document.createElement('div'); o.className = 'mn-ro mn-sb'; o.setAttribute('role', 'dialog'); o.setAttribute('aria-label', 'Smart build'); document.body.appendChild(o);
      o.addEventListener('pointerdown', function (e) { e.stopPropagation(); }, true);
      o.addEventListener('click', function (e) { e.stopPropagation(); e.preventDefault(); var g;
        if (e.target.closest('[data-sbnext]')) { hap('selection'); return sbRun(SB.i + 1); }
        if ((g = e.target.closest('[data-sbadd]'))) return sbSuggest(g.getAttribute('data-sbadd'));
        if (e.target.closest('[data-sbok]')) { SB = null; sbDraw(); save(); render(); hap('success'); toast('✓ Kept — ↶ Undo brings the old one back'); return; }
        if (e.target.closest('[data-sbx]')) return sbCancel();
      }, true); }
    var W = SB_WAYS[SB.L.lv], w = W[SB.i % W.length], A = SB.added || {}, where = { island: 'buildings and rooms', building: 'its rooms', room: 'this room', fixture: 'this display' }[SB.L.lv];
    var chip = function (k, ic, n) { return '<button type="button" data-sbadd="' + k + '"><b>' + ic + ' + ' + n + '</b><small>' + (A[k] ? A[k] + ' added' : 'add some') + '</small></button>'; };
    o.innerHTML = '<div class="h"><b>✨ ' + SB_LABEL[SB.L.lv] + '</b><span>Option ' + (SB.i % W.length + 1) + ' of ' + W.length + '</span></div>' +
      '<p class="t"><b>' + esc(SB.L.lv === 'building' && SB.ready ? 'Rooms ready for new things' : w.n) + '</b>' + (SB.L.lv === 'building' && SB.ready ? ' — ' + SB.ready + ' rooms, furnished, their displays waiting (your things are already in other buildings; new ones from the Box go in).' : '') + (SB.groups ? ' — ' + (SB.L.lv === 'fixture' ? SB.groups + ' things' : SB.groups + ' group' + (SB.groups === 1 ? '' : 's')) + ' in ' + where + '.' : '') + ' Nothing is saved yet.</p>' +
      '<div class="w sbw">' + chip('decor', '🌳', 'Decor') + chip('move', '🐾', 'Moving things') + chip('display', '🖼', 'Displays') + '</div>' +
      '<div class="f"><button type="button" class="no" data-sbx>✕ Cancel</button><button type="button" class="alt" data-sbnext>🔄 Change</button><button type="button" class="ok" data-sbok>✓ Keep</button></div>';
    sbPill();
  }
  function sbCancel() { if (!SB) return; var lv = SB.L.lv; sbRestore(); SB = null; sbDraw(); if (lv === 'building' && BV) bvDraw(); render(); if (lv !== 'fixture' && lv !== 'building') fit(); toast('↶ As it was'); }
  function sbOpen() {
    var L = sbLevel(); if (!L) { toast('Open a room, or go back out to the island'); return; }
    if (RO) roCancel(); try { smartClose(); } catch (e) {} V.expand = false; if (L.lv !== 'fixture') V.sel = null;
    var D0 = L.lv === 'building' ? islandD() : V.d;
    SB = { L: L, pid: L.p && L.p.id, snap: JSON.stringify(D0), d: D0, bid: V.bid, at: atKey(), i: 0, added: {} }; sbRun(0);
  }
  function atKey() { return V && V.at ? (V.at.pc || '') + '/' + (V.at.room || '') : ''; }
  function sbPill() {   // the ✨ button: on the island, in a room, or for the display you selected
    var p = el && el.querySelector('.mn-sbgo'), L = el && !SB && !RO && V && !V.expand && !el.querySelector('.mn-pick, .mn-sa') ? sbLevel() : null;
    if (L && V.sel && L.lv !== 'fixture') L = null;   // a thing is selected: its own bar is the tool, the ✨ waits
    if (!L) { if (p) p.remove(); return; }
    if (!p) { p = document.createElement('button'); p.type = 'button'; p.className = 'mn-sbgo'; el.appendChild(p); }
    var bar = el.querySelector('.mn-dsp-sel'), up = bar && bar.offsetParent ? Math.round(el.getBoundingClientRect().bottom - bar.getBoundingClientRect().top + 8) + 'px' : '';
    if (p.style.bottom !== up) p.style.bottom = up;   // above the selected display's bar, never on it
    var h = '✨ <b>' + SB_LABEL[L.lv] + '</b>'; if (p.innerHTML !== h) { p.innerHTML = h; p.setAttribute('aria-label', SB_LABEL[L.lv] + ' — make a layout, then change it or keep it'); }
  }
  (function () {
    var bv0 = bvDraw; bvDraw = function () { var out = bv0.apply(null, arguments); try { sbPill(); } catch (e) {} return out; };   // the building's own redraws name the ✨ right too
    var r0 = render; render = function () {
      if (SB && (!V || V.bid !== SB.bid || atKey() !== SB.at)) { try { sbRestore(); } catch (e) {} SB = null; var o = document.querySelector('.mn-sb'); if (o) o.remove(); }   // left the level while looking: put it back
      var out = r0.apply(null, arguments); try { sbPill(); } catch (e) {} return out; };
    var dq = false; new MutationObserver(function () { if (dq || !el) return; dq = true; requestAnimationFrame(function () { dq = false;
      var s = el && el.querySelector('.mn-fp-doll svg:not([data-fit])'); if (!s) return; s.setAttribute('data-fit', '1');
      var ghost = [].slice.call(s.querySelectorAll('.dh-next, .dh-nexthit, .dh-lab.add')); ghost.forEach(function (g) { g.style.display = 'none'; });
      try { var b = s.getBBox(); ghost.forEach(function (g) { g.style.display = ''; }); if (b.width > 10 && b.height > 10) { var px = b.width * .04, py = b.height * .04; s.setAttribute('viewBox', [b.x - px, b.y - py, b.width + 2 * px, b.height + 2 * py].map(function (v) { return v.toFixed(1); }).join(' ')); } } catch (e) { ghost.forEach(function (g) { g.style.display = ''; }); } }); })
      .observe(document.documentElement, { childList: true, subtree: true });
    // land mode: a tap on anything but ＋ / − (and not a drag) ends it
    var down = null;
    document.addEventListener('pointerdown', function (e) { down = { x: e.clientX, y: e.clientY }; }, true);
    document.addEventListener('click', function (e) {
      if (!el || !V || !V.expand || !el.contains(e.target)) return;
      if (down && Math.abs(e.clientX - down.x) + Math.abs(e.clientY - down.y) > 8) return;
      if (e.target.closest('[data-land], [data-unland], [data-expand], [data-landfast], .mn-hud-left, .mn-hud-right, .mn-dsp-top, .mn-bq58, button')) return;
      if (!e.target.closest('.mn-dsp-stage')) return;
      e.preventDefault(); e.stopPropagation(); V.expand = false; render(); toast('✓ Done — the ' + (V.at && V.at.room ? 'room' : 'island') + ' is ' + landOf().length + ' plots');
    }, true);
    document.addEventListener('keydown', function (e) { if (SB && e.key === 'Escape') { e.preventDefault(); sbCancel(); } }, true);
    // the ✨ button: on the document (the island's own click handler stops clicks inside the view from going further)
    document.addEventListener('pointerdown', function (e) { if (e.target.closest && e.target.closest('.mn-sbgo')) e.stopPropagation(); }, true);
    document.addEventListener('click', function (e) { if (!(e.target.closest && e.target.closest('.mn-sbgo'))) return; e.preventDefault(); e.stopImmediatePropagation(); sbOpen(); }, true);
  })();

