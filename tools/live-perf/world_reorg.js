  /* ── 53.83 · Reorganize (steps 2–3 of the 53.811 brief): one 🔀 for every level — 🧭 another layout, 🎨 another look
     The level is where you are: the island (its buildings and outdoor displays), a building (its rooms: order and floors),
     a room (its displays), or a display you selected (the order of its things). Each level has its own ways (chips);
     picking one shows it at once — nothing is saved. ✓ keeps it (one undo step), ✕ puts everything back as it was.
     Only that level changes: other buildings, other rooms and the Kanban board are never touched. */
  var RO = null;
  var RO_WAYS = {
    island: [['row', '🏘 A row', 'buildings side by side along the back'], ['ring', '⭕ A ring', 'round the middle of the island'], ['cluster', '🏙 Together', 'close together in the middle'], ['spread', '🌳 Spread out', 'one to each corner, open ground between']],
    building: [['tour', '🚶 Visiting order', 'the fullest rooms first'], ['theme', '🗂 By kind', 'rooms of a kind next to each other'], ['floors', '🏢 Two floors', 'living rooms below, quiet rooms upstairs'], ['reverse', '↕ Turn around', 'the same rooms the other way round']],
    room: [['walls', '🧱 Along the walls', 'displays against the back and side walls'], ['rows', '▤ In rows', 'rows from the back to the front'], ['center', '⬤ In the middle', 'an island of displays, room to walk round'], ['gallery', '🖼 Facing rows', 'two rows with a walk between']],
    fixture: [['name', '🔤 A → Z', 'by name'], ['list', '🗂 By list', 'things of one list (or stack) together'], ['reverse', '↕ Reverse', 'the other way round'], ['shuffle', '🎲 Mix', 'a fresh mix']]
  };
  // 🎨 the looks a level can switch to (step 3): the island's ground, a building's outside (its rooms stay), a room's
  // floor and walls, a display's kind (its things stay, it grows when it must)
  var RO_GROUND = [['grass', '🌱 Grass'], ['snow', '❄️ Snow'], ['sand', '🏖 Sand'], ['moss', '🍃 Moss']];
  var RO_FINISH = [['oak', 'plaster', '🪵 Warm oak'], ['quartz', 'white', '🤍 Bright gallery'], ['spruce', 'stone_bricks', '🏰 Old library'], ['dark', 'plaster', '🌙 Dark & cosy'], ['andesite', 'stone_bricks', '🪨 Stone hall']];
  var RO_BLD = ['school', 'house', 'domehall', 'bld:building_30_design_exhibition_pavilion', 'library'];
  function roStyles(L) {
    if (L.lv === 'island') return RO_GROUND.filter(function (g) { return g[0] !== (V.d.ground || 'grass'); }).map(function (g) { return { n: g[1], d: 'the island\u2019s ground', go: function () { V.d.ground = g[0]; } }; });
    if (L.lv === 'room') { var rd = V.d; return RO_FINISH.filter(function (f) { return f[0] !== rd.floor || f[1] !== rd.wall; }).slice(0, 4).map(function (f) { return { n: f[2], d: f[0].replace('_', ' ') + ' floor · ' + f[1].replace('_', ' ') + ' walls', go: function () { rd.floor = f[0]; rd.wall = f[1]; } }; }); }
    if (L.lv === 'building') { var b = L.p; return RO_BLD.filter(function (k) { return k !== b.k && (K[k] || /^bld:/.test(k)); }).slice(0, 4).map(function (k) { ensureBld(k); return { n: (K[k] ? K[k].n : 'Building'), d: 'same rooms, another building', go: function () { b.k = k; b.s = /^bld:/.test(k) ? 1.25 : 1; V.d = V.root || V.d; if (!bldOk(b)) { var x0 = b.x, y0 = b.y; if (!bldSpot(b, 2) && !bldSpot(b, 1)) { b.x = x0; b.y = y0; } } } }; }); }
    var f = L.p, r = roomOf(), want = (r && ROOMS[r.k] ? ROOMS[r.k][2] : []).concat(['shelf', 'gallery', 'museum', 'wall', 'books', 'grid']), seen = {};
    return want.filter(function (k) { if (seen[k] || k === f.k || !K[k] || !BUILD[k] || K[k].decor) return false; seen[k] = 1; return true; }).slice(0, 4).map(function (k) { return { n: K[k].n, d: K[k].use || 'another way to show them', go: function () { f.k = k; f.s = 1; while (capOf(f) < f.it.length && f.s < 2.5) f.s = Math.round((f.s + .25) * 100) / 100; if (!fits(f)) roNear(f, f.x, f.y, 0, 0); } }; });
  }
  // 🏝 the archipelago (step 4): every board of this workspace is an island; build the ones that are still empty in one go
  function wsBoards() { var b = board(V.bid), ws = b && b.workspace; return (A().boards() || []).filter(function (x) { return x && x.id && !x.archived && !/^hub:|^tile:/.test(x.id) && (x.workspace || null) === (ws || null); }); }
  function hasThings(d) { return !!d && (d.pc || []).some(function (p) { return (p.it || []).length || (p.rooms || []).some(function (r) { return r.d && (r.d.pc || []).some(function (q) { return (q.it || []).length; }); }); }); }
  function genQuiet(bid) {   // one island, built (buildings → rooms → displays) without opening it
    var V0 = V, t0 = toast, out = { groups: 0, pieces: 0 }; var d = load(bid), fresh = !d;
    V = { bid: bid, d: d || { v: 1, scene: 'island', rot: 0, pc: [] }, cam: { x: 0, y: 0, z: 1 }, sel: null, hold: null, menu: null };
    try { refreshLand(); if (fresh) seedIsland(bid); index(); var plan = makePlan('build'); out.groups = plan.groups.length;
      if (plan.groups.length) { toast = function () {}; try { out.pieces = buildApply(plan); } finally { toast = t0; } }
      save(true);
    } finally { V = V0; if (V) { refreshLand(); index(); } }
    return out;
  }
  function roArch(o) {
    var bs = wsBoards(), empty = bs.filter(function (b) { return b.id !== V.bid && !hasThings(load(b.id)); }), ws = (board(V.bid) || {}).workspace || 'this workspace', tight = !!(window.MinestHubs && MinestHubs.tight && MinestHubs.tight());
    return '<p class="t">' + esc(ws) + ' · ' + bs.length + ' islands (one per board) · ' + (bs.length - empty.length) + ' already set out.</p>' +
      '<div class="w"><button type="button" data-roall' + (empty.length ? '' : ' disabled') + '><b>✦ Build every island</b><small>' + (empty.length ? empty.length + ' empty island' + (empty.length === 1 ? '' : 's') + ': buildings, rooms and displays from each board' : 'every island is set out already') + '</small></button>' +
      '<button type="button" data-rotight><b>' + (tight ? '🌊 Spread the islands' : '🏝 Gather the islands') + '</b><small>' + (tight ? 'round the middle again' : 'each one beside its main island') + '</small></button></div>' +
      (RO.prog ? '<p class="t">' + esc(RO.prog) + '</p>' : '<p class="t">Islands you have already set out are left as they are.</p>');
  }
  function roAll() {
    var list = wsBoards().filter(function (b) { return b.id !== V.bid && !hasThings(load(b.id)); }), i = 0, made = 0;
    if (!list.length) return; RO.prog = 'Building 0 / ' + list.length + '…'; roDraw();
    (function next() {
      if (!RO) return; if (i >= list.length) { RO.prog = '✓ ' + made + ' island' + (made === 1 ? '' : 's') + ' built — open one from the home to see it'; roDraw(); hap('success'); try { MinestUniverse.refresh(); } catch (e) {} return; }
      var b = list[i++]; try { if (genQuiet(b.id).groups) made++; } catch (e) {}
      RO.prog = 'Building ' + i + ' / ' + list.length + ' — ' + (b.title || 'island'); roDraw(); setTimeout(next, 30);
    })();
  }
  function roLevel() {
    if (!V || V.visit) return null;
    if (V.sel && V.sel.pc && !(V.at && !V.at.room)) { var f = pieceOf(V.sel.pc); if (f && (f.it || []).length > 1) return { lv: 'fixture', p: f, name: f.label || (K[f.k] ? K[f.k].n : 'this display') }; }
    if (V.at && !V.at.room && BV) { var b = bldOf(); if (b && (b.rooms || []).length > 1) return { lv: 'building', p: b, name: bldName(b) }; return null; }
    if (V.at && V.at.room) { var r = roomOf(); return { lv: 'room', r: r, name: r ? (r.n || 'this room') : 'this room' }; }
    return { lv: 'island', name: 'the island' };
  }
  function roMovers(lv) {   // what a layout moves: buildings and displays that hold things on the island; displays in a room
    return (V.d.pc || []).filter(function (p) { if (!K[p.k] || !BUILD[p.k]) return false; if (lv === 'island') return isBld(p) || (p.it || []).length > 0; return capOf(p) > 0 && !(K[p.k].decor && !(p.it || []).length) && !isBld(p); });
  }
  function roSnap(L) { var S = roSnap0(L); S.st = L.lv === 'island' ? { g: V.d.ground } : L.lv === 'room' ? { fl: V.d.floor, wa: V.d.wall } : { k: L.p.k, s: L.p.s, x: L.p.x, y: L.p.y }; return S; }
  function roSnap0(L) {
    if (L.lv === 'fixture') return { it: L.p.it.slice(), d: V.d };
    if (L.lv === 'building') return { d: V.root || V.d, order: L.p.rooms.map(function (r) { return r.id; }), fl: L.p.rooms.map(function (r) { return r.fl || 1; }), floors: L.p.floors || 1 };
    return { pos: roMovers(L.lv).map(function (p) { return [p, p.x, p.y, p.f || 0]; }), d: V.d, order: V.d.pc.slice(), land: landOf().slice() };
  }
  function roRestore(L, S) {
    var st = S.st || {}; if (L.lv === 'island') { if (st.g) S.d.ground = st.g; else delete S.d.ground; } else if (L.lv === 'room') { S.d.floor = st.fl; S.d.wall = st.wa; } else if (st.k) { L.p.k = st.k; L.p.s = st.s; L.p.x = st.x; L.p.y = st.y; }
    if (L.lv === 'fixture') { L.p.it = S.it.slice(); return; }
    if (L.lv === 'building') { var by = {}; L.p.rooms.forEach(function (r) { by[r.id] = r; }); L.p.rooms = S.order.map(function (id, i) { var r = by[id]; r.fl = S.fl[i] > 1 ? S.fl[i] : undefined; if (!r.fl) delete r.fl; return r; }); L.p.floors = S.floors; return; }
    S.pos.forEach(function (a) { a[0].x = a[1]; a[0].y = a[2]; a[0].f = a[3]; }); S.d.pc = S.order.slice(); S.d.land = S.land.slice(); if (V.d === S.d) refreshLand();
  }
  function roNear(p, tx, ty, gap, m) {   // the free place nearest (tx, ty): `gap` blocks from buildings, m blocks in from the edges
    var lb = lbox(), f0 = foot(Object.assign({}, p, { x: 0, y: 0 })), hw = (f0.x1 - f0.x0) / 2, hd = (f0.y1 - f0.y0) / 2;
    var xa = lb.x0 + m + hw, xb = lb.x1 - m - hw, ya = lb.y0 + m + hd, yb = lb.y1 - m - hd; if (xa > xb || ya > yb) return false;
    var cl = function (v, a, b2) { return Math.min(b2, Math.max(a, Math.round(v * 2) / 2)); }, R = Math.max(lb.x1 - lb.x0, lb.y1 - lb.y0);
    for (var rad = 0; rad <= R; rad += .5) for (var a = -rad; a <= rad; a += .5) for (var b2 = -rad; b2 <= rad; b2 += .5) {
      if (rad && Math.abs(a) !== rad && Math.abs(b2) !== rad) continue;
      p.x = cl(tx + a, xa, xb); p.y = cl(ty + b2, ya, yb); if (gap > 0 ? roomy(p, gap) : fits(p)) return true;
    }
    return false;
  }
  function roTargets(way, n, lv) {   // where each mover would like to stand, in order
    var lb = lbox(), m = lv === 'island' ? 1 : .5, x0 = lb.x0 + m, x1 = lb.x1 - m, y0 = lb.y0 + m, y1 = lb.y1 - m, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, out = [], i;
    if (way === 'row' || way === 'rows') { var per = way === 'row' ? Math.max(1, Math.min(n, Math.ceil(Math.sqrt(n * 2)))) : Math.max(1, Math.ceil(Math.sqrt(n))); for (i = 0; i < n; i++) { var c = i % per, r = Math.floor(i / per), rows = Math.ceil(n / per); out.push([x0 + (x1 - x0) * (c + .5) / per, y0 + (y1 - y0) * (rows > 1 ? r / (rows - 1) * .8 : 0)]); } }
    else if (way === 'ring') { var rr = Math.min(x1 - x0, y1 - y0) / 2 - 1.5; for (i = 0; i < n; i++) { var an = -Math.PI / 2 + i * 2 * Math.PI / Math.max(n, 1); out.push([cx + Math.cos(an) * rr, cy + Math.sin(an) * rr]); } }
    else if (way === 'spread') { var pts = [[x0, y0], [x1, y1], [x1, y0], [x0, y1], [cx, y0], [cx, y1], [x0, cy], [x1, cy], [cx, cy]]; for (i = 0; i < n; i++) out.push(pts[i % pts.length]); }
    else if (way === 'walls') { for (i = 0; i < n; i++) out.push(i % 2 ? [x0, y0 + (y1 - y0) * (Math.floor(i / 2) + 1) / (Math.ceil(n / 2) + 1)] : [x0 + (x1 - x0) * (Math.floor(i / 2) + .5) / Math.ceil(n / 2), y0]); }
    else if (way === 'gallery') { for (i = 0; i < n; i++) { var k2 = Math.floor(i / 2); out.push([x0 + (x1 - x0) * (k2 + .5) / Math.ceil(n / 2), i % 2 ? y1 : y0]); } }
    else { for (i = 0; i < n; i++) out.push([cx, cy]); }   // cluster / center: the nearest free place to the middle, one after another
    return out;
  }
  function roApply(L, way) {
    if (L.lv === 'fixture') {
      var it = L.p.it.slice(), nm = function (r) { var t = thing(r); return t ? String(t.s.title || '').toLowerCase() : '~'; };
      if (way === 'name') it.sort(function (a, b2) { return nm(a) < nm(b2) ? -1 : nm(a) > nm(b2) ? 1 : 0; });
      else if (way === 'list') it.sort(function (a, b2) { var la = a.split('/')[0], lb2 = b2.split('/')[0]; return la < lb2 ? -1 : la > lb2 ? 1 : L.p.it.indexOf(a) - L.p.it.indexOf(b2); });
      else if (way === 'reverse') it.reverse(); else for (var i = it.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), x = it[i]; it[i] = it[j]; it[j] = x; }
      L.p.it = it; return true;
    }
    if (L.lv === 'building') {
      var R = L.p.rooms.slice(), cnt = function (r) { var n = 0; (r.d && r.d.pc || []).forEach(function (q) { n += (q.it || []).length; }); return n; };
      if (way === 'tour') R.sort(function (a, b2) { return cnt(b2) - cnt(a); });
      else if (way === 'theme') R.sort(function (a, b2) { return ROOM_ORDER.indexOf(a.k) - ROOM_ORDER.indexOf(b2.k); });
      else if (way === 'reverse') R.reverse();
      var up = way === 'floors' ? function (r) { return /^(bedroom|study|dreams|reading|music)$/.test(r.k); } : null;
      R.forEach(function (r) { if (up) { if (up(r) && R.length > 2) r.fl = 2; else delete r.fl; } });
      if (up) { R.sort(function (a, b2) { return (a.fl || 1) - (b2.fl || 1); }); L.p.floors = R.some(function (r) { return r.fl > 1; }) ? Math.max(2, L.p.floors || 1) : L.p.floors; }
      L.p.rooms = R; return true;
    }
    var mv = roMovers(L.lv); if (!mv.length) return false;
    mv.sort(function (a, b2) { var fa = foot(a), fb = foot(b2); return (fb.x1 - fb.x0) * (fb.y1 - fb.y0) - (fa.x1 - fa.x0) * (fa.y1 - fa.y0); });
    var keep = V.d.pc.filter(function (p) { return mv.indexOf(p) < 0; }), T = roTargets(way, mv.length, L.lv), placed = 0;
    V.d.pc = keep.slice();   // lifted off, then set down one by one where the way wants them
    mv.forEach(function (p, i) {
      var x0 = p.x, y0 = p.y, gap = L.lv === 'island' ? (isBld(p) ? 2 : 1) : .5, m = L.lv === 'island' ? 1 : 0;
      var ok = roNear(p, T[i][0], T[i][1], gap, m) || roNear(p, T[i][0], T[i][1], L.lv === 'island' ? 1 : 0, m) || roNear(p, T[i][0], T[i][1], 0, 0);
      if (!ok) { p.x = x0; p.y = y0; } else placed++;
      V.d.pc.push(p);
    });
    return placed > 0;
  }
  function roDraw() {
    var o = document.querySelector('.mn-ro'); if (!RO) { if (o) o.remove(); return; }
    if (!o) { o = document.createElement('div'); o.className = 'mn-ro'; o.setAttribute('role', 'dialog'); o.setAttribute('aria-label', 'Reorganize'); document.body.appendChild(o);
      o.addEventListener('pointerdown', function (e) { e.stopPropagation(); }, true); o.addEventListener('click', roClick, true); }
    var W = RO.tab === 'style' ? RO.styles.map(function (s) { return [0, s.n, s.d]; }) : RO_WAYS[RO.L.lv], LV = { island: 'Island', building: 'Building', room: 'Room', fixture: 'Display' }[RO.L.lv];
    o.innerHTML = '<div class="h"><b>🔀 Reorganize</b><span>' + LV + ' · ' + esc(RO.L.name) + '</span></div>' +
      '<div class="tabs"><button type="button" data-rotab="layout"' + (RO.tab === 'layout' ? ' class="on"' : '') + '>🧭 Layout</button><button type="button" data-rotab="style"' + (RO.tab === 'style' ? ' class="on"' : '') + (RO.styles.length ? '' : ' disabled') + '>🎨 Style</button>' + (RO.L.lv === 'island' ? '<button type="button" data-rotab="arch"' + (RO.tab === 'arch' ? ' class="on"' : '') + '>🏝 All islands</button>' : '') + '</div>' + (RO.tab === 'arch' ? roArch() + '<div class="f"><button type="button" class="no" data-rox>Close</button></div>' :
      '<div class="w">' + W.map(function (w, i) { return '<button type="button" data-row="' + i + '"' + (RO.i === i ? ' class="on"' : '') + '><b>' + w[1] + '</b><small>' + w[2] + '</small></button>'; }).join('') + '</div>' +
      '<p class="t">' + (RO.i < 0 ? 'Pick a way — you see it at once. Nothing is saved until ✓.' : 'This is a preview: only ' + LV.toLowerCase() + ' changes. ✓ keeps it (↶ undoes it later), ✕ puts it back.') + '</p>' +
      '<div class="f"><button type="button" class="no" data-rox>✕ Cancel</button><button type="button" class="alt" data-ronext' + (RO.i < 0 ? '' : '') + '>⟳ Another</button><button type="button" class="ok" data-rook' + (RO.i < 0 ? ' disabled' : '') + '>✓ Keep</button></div>');
  }
  function roShow() { if (RO.L.lv === 'building') bvDraw(); render(); roDraw(); }
  function roPick(i) {
    roRestore(RO.L, RO.snap); RO.i = i;
    if (RO.tab === 'style') { var s = RO.styles[i]; if (s) { var d0 = V.d; try { s.go(); } finally { V.d = d0; } } }
    else { var ok = roApply(RO.L, RO_WAYS[RO.L.lv][i][0]); if (!ok) toast('Nothing here to move yet'); }
    hap('selection'); roShow(); }
  function roClick(e) {
    e.stopPropagation(); e.preventDefault(); var g;
    if ((g = e.target.closest('[data-rotab]'))) { if (g.disabled) return; roRestore(RO.L, RO.snap); RO.tab = g.getAttribute('data-rotab'); RO.i = -1; return roShow(); }
    if (e.target.closest('[data-roall]')) return roAll();
    if (e.target.closest('[data-rotight]')) { try { MinestHubs.setTight(!MinestHubs.tight()); } catch (x) {} return roDraw(); }
    if ((g = e.target.closest('[data-row]'))) return roPick(+g.getAttribute('data-row'));
    if (e.target.closest('[data-ronext]')) return roPick((RO.i + 1) % (RO.tab === 'style' ? Math.max(1, RO.styles.length) : RO_WAYS[RO.L.lv].length));
    if (e.target.closest('[data-rook]')) { if (RO.i < 0) return; RO = null; roDraw(); save(); render(); hap('success'); toast('✓ New layout kept — ↶ Undo brings the old one back'); return; }
    if (e.target.closest('[data-rox]')) return roCancel();
  }
  function roCancel() { if (!RO) return; var L = RO.L, S = RO.snap; RO = null; roRestore(L, S); roDraw(); if (L.lv === 'building' && BV) bvDraw(); render(); toast('↶ Back as it was'); }
  function roOpen() {
    if (RO) return roCancel(); var L = roLevel(); if (!L) { toast('Open a building with two or more rooms, or select a display, to reorganize it'); return; }
    smartClose(); RO = { L: L, snap: roSnap(L), i: -1, tab: 'layout', styles: roStyles(L), bid: V.bid, at: JSON.stringify(V.at || null) }; roDraw();
  }
  document.addEventListener('click', function (e) { var b = e.target.closest && e.target.closest('[data-reorg]'); if (!b || !el || !el.contains(b)) return; e.preventDefault(); e.stopPropagation(); roOpen(); }, true);
  document.addEventListener('keydown', function (e) { if (RO && e.key === 'Escape') { e.preventDefault(); roCancel(); } }, true);
  (function () {   // leaving the level (or the island) while previewing puts things back
    var r0 = render;
    render = function () { if (RO && (!V || V.bid !== RO.bid || JSON.stringify(V.at || null) !== RO.at)) { var L = RO.L, S = RO.snap; RO = null; try { roRestore(L, S); } catch (x) {} roDraw(); } return r0.apply(null, arguments); };
  })();

  /* ── 53.83 · House Sample (step 5): a cottage with a living room, kitchen, bedroom and study, furnished with their
     displays, empty and ready — try moving in, dropping things from the Box into the rooms, reorganizing and restyling. */
  EX_SAMPLES.push({ id: 'house_sample', pre: 'house_sample', n: 'House Sample', ic: '🏠', tip: 'A home with four furnished rooms — try living with your collection' });
  function houseSample() {
    if (!V || V.visit || V.at || (typeof indoor === 'function' && indoor())) { toast('Open the island itself to put a house down'); return null; }
    var b = { id: uid(), k: 'house', x: 0, y: 0, f: V.d.rot, s: 1, it: [], label: 'House Sample', sample: 1, roomsInit: 1,
      rooms: ['living', 'kitchen', 'bedroom', 'study'].map(function (k, i) { return { id: 'r' + uid().slice(1), k: k, n: ROOMS[k][0], fl: k === 'bedroom' || k === 'study' ? 2 : undefined }; }) };
    b.floors = 2; b.rooms.forEach(function (r) { if (!r.fl) delete r.fl; roomD(r); });
    var ok = false; for (var t = 0; t < 4 && !ok; t++) { ok = bldSpot(b, 2); if (!ok && !growLand()) { ok = bldSpot(b, 1) || freeSpot(b); break; } }
    if (!ok) { toast('No room left on the island — clear a little space first'); return null; }
    change(function () { V.d.pc.push(b); refreshLand(); });
    return b;
  }
  document.addEventListener('click', function (e) {
    var g = e.target.closest && e.target.closest('[data-exsample="house_sample"]'); if (!g || !el || !el.contains(g)) return;
    e.preventDefault(); e.stopPropagation(); try { exClose(); } catch (x) {}
    var b = houseSample(); if (b) { hap('success'); toast('🏠 House Sample — double-tap it to go in; drop things from the Box into its rooms', { duration: 6000 }); }
  }, true);

