  /* ── 53.85 · Duo (iPhone Fold) inside My World.
     1 · Fold / unfold keeps the camera on what you were looking at: a resize keeps the scene point in the middle of the
         view in the middle and scales the zoom with the view; a camera the user never moved (still the fit) is fitted
         again. Selection, the piece being moved (V.hold) and its unsaved spot are left alone — nothing is confirmed or
         cancelled by folding.
     2 · Kanban × Island: MinestDuoWorld.locate(cardId, boardId) finds where a card is shown — as a thing on a display,
         or (a card with sub-cards) as a whole list — goes into its room if needed, selects it, centres it and pulses it;
         shown in several places → a chooser; not shown yet → "Place it" (the Universal Add flow). Nothing in the
         Kanban is changed: the island only reads card references.
     3 · Selecting a thing / display on the island tells the Kanban side (event 'minest:duo-world-sel') which card or
         list it is, so the board can scroll to it.
     4 · Build & Arrange in the split: 🔨 docks the library in the left half (the scene stays on the right). One tap on
         anything puts it in the scene at once — at the spot you last tapped on empty ground, else the first free place —
         selected, ready to drag / turn, with the ✓ / ✕ chip beside it (the 53.81 chip). The library follows the level:
         the island gets buildings, outdoor decor, land; a building or room gets furniture and displays. 🎒 Saved items
         are your things not on the island yet (they go to a display the usual way); 🔭 opens the Visual Library. */
  var DUO_API = null;   // the Build console's parts, for the Fold flow console (world_fold.js)
  (function () {
    var lastR = null, fitCam = null, quiet = false, lastSelKey = '';
    function sceneR() { var s = el && el.querySelector('.mn-dsp-scene'); var r = s && s.getBoundingClientRect(); return r && r.width > 0 && r.height > 0 ? r : null; }
    function same(a, b) { return a && b && Math.abs(a.x - b.x) < .5 && Math.abs(a.y - b.y) < .5 && Math.abs(a.z - b.z) < 1e-3; }
    var fit0 = fit;
    fit = function () {
      var ev = window.event, r = sceneR();
      if (ev && ev.type === 'resize' && V && V.cam && r && lastR && !same(V.cam, fitCam)) {   // the user moved the camera: keep their focus
        var z = V.cam.z, cx = (lastR.width / 2 - V.cam.x) / z, cy = (lastR.height / 2 - V.cam.y) / z;
        var k = Math.sqrt((r.width * r.height) / (lastR.width * lastR.height)), z2 = clamp(z * k, .3, 2.2);
        V.cam.z = z2; V.cam.x = r.width / 2 - cx * z2; V.cam.y = r.height / 2 - cy * z2; camera(); lastR = r; return;
      }
      var out = fit0.apply(null, arguments); lastR = sceneR(); fitCam = V && V.cam ? { x: V.cam.x, y: V.cam.y, z: V.cam.z } : null; return out;
    };
    function centreOn(p) {
      var r = sceneR(); if (!r || !p) return; var f = foot(p), c = P((f.x0 + f.x1) / 2, (f.y0 + f.y1) / 2, 0);
      var z = clamp(Math.max(V.cam.z, 1), .3, 2.2); V.cam.z = z; V.cam.x = r.width / 2 - c[0] * z; V.cam.y = r.height / 2 - c[1] * z + 40 * z; camera(); lastR = r;
    }
    function pulse(id) {
      setTimeout(function () { var g = el && el.querySelector('.mn-dsp-scene'); if (!g) return; g.classList.remove('duo-pulse'); void g.offsetWidth; g.classList.add('duo-pulse'); setTimeout(function () { g.classList.remove('duo-pulse'); }, 1600); }, 60);
    }
    function refsFor(cardId) {   // the island's refs for a card: the card as a thing, or a card with sub-cards as a list
      var thingRefs = [], listRefs = [];
      Object.keys(IX).forEach(function (r) { var t = IX[r]; if (t.s && t.s.id === cardId) thingRefs.push(r); else if (t.k && t.k.id === cardId) listRefs.push(r); });
      return { things: thingRefs, lists: listRefs };
    }
    function hitsFor(set) {   // every piece showing one of the refs: { p, bld, room } (rooms one level in)
      var out = [], R = V.root || V.d;
      (R.pc || []).forEach(function (p) {
        var its = p.it || []; for (var i = 0; i < its.length; i++) if (set[its[i]]) { out.push({ p: p, ref: its[i] }); break; }
        (p.rooms || []).forEach(function (rm) { ((rm.d && rm.d.pc) || []).forEach(function (q) { var qi = q.it || []; for (var j = 0; j < qi.length; j++) if (set[qi[j]]) { out.push({ p: q, ref: qi[j], bld: p, room: rm }); break; } }); });
      });
      return out;
    }
    function nameOf(h) { var k = K[h.p.k]; return (h.room ? (h.room.n || h.room.k || 'Room') + ' · ' : '') + (h.p.label || (k && k.n) || 'Display'); }
    function go(h) {
      quiet = true;
      try {
        if (h.room) { if (!(V.at && V.at.pc === h.bld.id && V.at.room === h.room.id)) enterRoom(h.bld.id, h.room.id); }
        else if (V.at) { var guard = 4; while (V.at && guard--) leaveRoom(); }
        V.sel = { pc: h.p.id, ref: h.ref }; render(); centreOn(h.p); pulse(h.p.id);
      } finally { quiet = false; }
      lastSelKey = selKey();
    }
    function bar(html) {   // a small strip over the island: several places to choose from, or "not placed yet"
      var b = el && el.querySelector('.duo-wbar'); if (!el) return null;
      if (!html) { if (b) b.remove(); return null; }
      if (!b) { b = document.createElement('div'); b.className = 'duo-wbar'; el.appendChild(b); }
      b.innerHTML = html + '<button type="button" class="x" data-duowx aria-label="Close">✕</button>'; return b;
    }
    function locate(cardId, bid) {
      if (!cardId) return false;
      if (bid && (!V || V.bid !== bid)) {
        try { if (window.MinestUniverse && !document.querySelector('.uv')) MinestUniverse.open({ path: [{ t: 'home' }, { t: 'world', bid: bid }] }); } catch (e) {}
        open({ t: 'world', bid: bid });
      }
      if (!V) return false;
      index(); var R = refsFor(cardId), set = {}; R.things.concat(R.lists).forEach(function (r) { set[r] = 1; });
      var hits = hitsFor(set);
      if (!hits.length) {
        var ref = R.things[0], t = ref && IX[ref], lt = !t && R.lists.length && IX[R.lists[0]];
        bar(t ? '<span>「' + esc(t.s.title || 'This card') + '」is not on the island yet</span><button type="button" class="go" data-duowplace="' + esc(ref) + '">🧱 Place it</button>'
          : lt ? '<span>「' + esc(lt.k.title || 'This list') + '」(' + R.lists.length + ' things) is not on show yet</span><button type="button" class="go" data-duowbox>🎒 Put it on show</button>'
          : '<span>This card has no place on this island</span>');
        return false;
      }
      go(hits[0]);
      if (hits.length > 1) {
        var b = bar('<span>Shown in ' + hits.length + ' places</span>' + hits.map(function (h, i) { return '<button type="button" class="' + (i ? '' : 'on') + '" data-duowhit="' + i + '">' + esc(nameOf(h)) + '</button>'; }).join(''));
        if (b) b._hits = hits;
      } else bar(null);
      return true;
    }
    document.addEventListener('click', function (e) {
      var t = e.target; if (!t.closest || !el || !el.contains(t)) return;
      var b = t.closest('[data-duowhit], [data-duowplace], [data-duowbox], [data-duowx]'); if (!b) return;
      e.preventDefault(); e.stopPropagation();
      var w = el.querySelector('.duo-wbar');
      if (b.hasAttribute('data-duowx')) { bar(null); return; }
      if (b.hasAttribute('data-duowbox')) { bar(null); try { hudSheet('box'); } catch (x) {} return; }
      if (b.hasAttribute('data-duowplace')) { bar(null); try { MinestDisplay.display(b.getAttribute('data-duowplace')); } catch (x) {} return; }
      var h = w && w._hits && w._hits[+b.getAttribute('data-duowhit')]; if (!h) return;
      [].forEach.call(w.querySelectorAll('[data-duowhit]'), function (x) { x.classList.toggle('on', x === b); }); go(h);
    }, true);
    // 3 · a selection on the island → the Kanban side
    function selKey() { return V && V.sel ? (V.bid + '|' + (V.sel.pc || '') + '|' + (V.sel.ref || '')) : ''; }
    var r0 = render;
    render = function () {
      var out = r0.apply(null, arguments);
      try {
        var k = selKey();
        if (k !== lastSelKey) {
          lastSelKey = k;
          if (k && !quiet) {
            var p = pieceOf(V.sel.pc), ref = V.sel.ref || (p && (p.it || [])[0]), t = ref && thing(ref);
            if (t) window.dispatchEvent(new CustomEvent('minest:duo-world-sel', { detail: { bid: V.bid, cardId: V.sel.ref ? t.s.id : null, listId: t.k && !t.k.native ? t.k.id : null, colId: t.col && t.col.id } }));
          }
        }
      } catch (e) {}
      return out;
    };
    // 4 · Build & Arrange: the library in the left half
    var LIB = { on: false, tab: null, grp: {}, spot: null, key: '', fillT: 0, resume: false };
    function split() { return document.documentElement.classList.contains('duo-split'); }
    function lvl() { return V && V.at && V.at.room ? 'room' : V && V.at ? 'building' : 'island'; }
    function boxRefs() { if (!V) return []; index(); var on = placed(); return Object.keys(IX).filter(function (r) { return !on[r] && !/^v\//.test(r); }); }
    function libTabs() {
      var T = pkTabs().filter(function (t) { return t.groups && t.groups.length; });
      var bx = boxRefs(); T.push({ id: 'box', ic: '🎒', n: 'Saved items (' + bx.length + ')', refs: bx }); T.push({ id: 'vl', ic: '🔭', n: 'Visual Library' });
      T.unshift({ id: 'ctl', ic: '🎛', n: 'Controls' });   // Miniature Workshop: the console for the piece you are placing
      return T;
    }
    function libDraw() {
      if (!LIB.on || !V) return; var d = document.querySelector('.duo-lib');
      if (!d) { d = document.createElement('aside'); d.className = 'duo-lib'; d.setAttribute('aria-label', 'Build library'); document.body.appendChild(d); d.addEventListener('click', libClick); }
      var T = libTabs(), t = T.filter(function (x) { return x.id === LIB.tab; })[0] || T[0]; LIB.tab = t.id; LIB.key = V.bid + '|' + lvl();
      var count = {}, body = ''; (V.d.pc || []).forEach(function (q) { count[q.k] = (count[q.k] || 0) + 1; });
      if (t.id === 'ctl') body = ctlHtml();
      else if (t.id === 'box') body = t.refs.length ? '<div class="duo-lib-list">' + t.refs.slice(0, 120).map(function (r) { var x = IX[r]; return '<button type="button" data-dlref="' + esc(r) + '"><b>' + esc(x.s.title || 'Thing') + '</b><small>' + esc((x.k && x.k.title) || '') + '</small></button>'; }).join('') + '</div>' : '<p class="duo-lib-m">Everything you saved is on the island already.</p>';
      else if (t.id === 'vl') body = '<p class="duo-lib-m">Find films, books, music, people and places, save them to a list, then put them on show here.</p><button type="button" class="duo-lib-go" data-dlvl>🔭 Open the Visual Library</button>';
      else { var gi = Math.min(LIB.grp[t.id] || 0, t.groups.length - 1);
        body = '<div class="duo-lib-chips">' + t.groups.map(function (g, i) { return '<button type="button" data-dlg="' + i + '"' + (i === gi ? ' class="on"' : '') + '>' + esc(g.n) + '</button>'; }).join('') + '</div>' +
          '<div class="duo-lib-grid">' + t.groups[gi].kinds.map(function (k) { return pkCard(k, count[k] || 0); }).join('') + '</div>'; }
      var where = { island: 'the island', building: 'this building', room: 'this room' }[lvl()];
      d.innerHTML = '<header><b>🔨 Build · ' + esc(where) + '</b><button type="button" class="x" data-dlx aria-label="Close the library">✕</button></header>' +
        '<p class="duo-lib-hint">' + (LIB.spot ? '📍 Next one goes where you tapped' : 'Tap a piece — it appears in the scene, ready to move from 🎛 · tap empty ground first to choose the spot') + '</p>' +
        '<nav class="duo-lib-tabs">' + T.map(function (x) { return '<button type="button" data-dlt="' + x.id + '"' + (x.id === t.id ? ' class="on"' : '') + ' title="' + esc(x.n) + '">' + x.ic + '</button>'; }).join('') + '</nav>' +
        '<h3>' + esc(t.n) + '</h3>' + body;
      clearTimeout(LIB.fillT); LIB.fillT = setTimeout(libFill, 500);
    }
    function libFill() {   // Studio pictures arrive one by one
      var d = document.querySelector('.duo-lib'); if (!d) return; var left = 0;
      d.querySelectorAll('.mn-pk-card').forEach(function (c) { var pic = c.querySelector('.pic'); if (!pic || !pic.querySelector('.mn-a3wait')) return; var h = bldIcon(c.getAttribute('data-pkkind'), 132); if (h.indexOf('mn-a3wait') < 0) pic.innerHTML = h; else left++; });
      if (left) LIB.fillT = setTimeout(libFill, 700);
    }
    function libOpen(tab, keep) { if (!V || V.visit) return; if (typeof WFAPI !== 'undefined' && WFAPI && WFAPI.on()) return WFAPI.sync();   /* half folded upright: the Fold flow console is the builder */ editOn(); if (!keep) { V.sel = null; V.menu = null; V.hold = null; V.ghost = null; } LIB.on = true; LIB.resume = false; document.documentElement.classList.add('duo-build'); if (tab) LIB.tab = tab; else if (!LIB.tab) LIB.tab = V.at && V.at.room ? 'furn' : 'bld'; libDraw(); render(); }
    function libClose() { LIB.on = false; LIB.spot = null; spotMark(); document.documentElement.classList.remove('duo-build'); var d = document.querySelector('.duo-lib'); if (d) d.remove(); }
    function placeKind(k) {
      if (!V || !K[k]) return;
      var probe = { id: 'duo-probe', k: k, x: 0, y: 0, f: V.d.rot, s: 1, it: [] }, ok = LIB.spot ? settle(probe, LIB.spot[0], LIB.spot[1]) : (freeSpot(probe, 1) || freeSpot(probe));
      if (!ok) { toast(LIB.spot ? 'No room right there — tap a freer spot' : 'No room left here — tap ⛰ for more land, or clear a little space'); return; }
      var q = null; change(function () { q = add(k, probe.x, probe.y); if (q) { V.hold = null; V.sel = { pc: q.id }; } });
      if (!q) return;
      LIB.spot = null; spotMark(); hap('light'); libDraw();
      var r = sceneR(), f = foot(q), c = P((f.x0 + f.x1) / 2, (f.y0 + f.y1) / 2, 0);   // keep it in view
      if (r) { var sx = V.cam.x + c[0] * V.cam.z, sy = V.cam.y + c[1] * V.cam.z; if (sx < 40 || sx > r.width - 40 || sy < 60 || sy > r.height - 120) centreOn(q); }
      bqChipShow(q.id);
      LIB.back = LIB.tab === 'ctl' ? LIB.back : LIB.tab; LIB.tab = 'ctl'; libDraw();   // straight to the console for it
    }
    function libClick(e) {
      var g = e.target.closest('button'); if (!g) return; e.preventDefault(); e.stopPropagation();
      if (g.hasAttribute('data-dlx')) { LIB.resume = false; return libClose(); }
      if (g.hasAttribute('data-dlt')) { LIB.tab = g.getAttribute('data-dlt'); return libDraw(); }
      if (g.hasAttribute('data-dlg')) { LIB.grp[LIB.tab] = +g.getAttribute('data-dlg'); return libDraw(); }
      if (g.hasAttribute('data-wk')) return wkAct(g.getAttribute('data-wk'));
      if (g.hasAttribute('data-pkkind')) return placeKind(g.getAttribute('data-pkkind'));
      if (g.hasAttribute('data-dlref')) { try { MinestDisplay.display(g.getAttribute('data-dlref')); } catch (x) {} return; }
      if (g.hasAttribute('data-dlvl')) { try { MinestVisualLibrary.open({ bid: V.bid }); } catch (x) {} return; }
    }
    // ── Miniature Workshop: the console under the scene (Desk posture) or beside it (Book) — a touchpad that moves the
    //    selected piece, nudges, turn, size, undo, ✓ done and remove, so the hand never has to reach into the scene
    function selPiece() { return V && V.sel && V.sel.pc && !V.sel.ref ? pieceOf(V.sel.pc) : null; }
    function ctlHtml() {
      var p = selPiece();
      if (!p) return '<p class="duo-lib-m">Tap a piece in the scene, or place one from 🏠 / 🌳 — its controls appear here.</p>';
      var nm = p.label || (K[p.k] && K[p.k].n) || 'Piece', sz = p.s || 1;
      return '<div class="duo-wk"><div class="duo-wk-t"><b>' + esc(nm) + '</b><small>drag on the pad to move it · it stays where it fits</small></div>' +
        '<div class="duo-wk-pad" data-wkpad><span>✥</span></div>' +
        '<div class="duo-wk-row"><button type="button" data-wk="rotl" aria-label="Turn left">⟲</button><button type="button" data-wk="up" aria-label="Up">▲</button><button type="button" data-wk="rotr" aria-label="Turn right">⟳</button>' +
        '<button type="button" data-wk="left" aria-label="Left">◀</button><button type="button" data-wk="down" aria-label="Down">▼</button><button type="button" data-wk="right" aria-label="Right">▶</button></div>' +
        '<label class="duo-wk-size">Size <input type="range" min="0.5" max="2.5" step="0.05" value="' + sz + '" data-wksize><em>' + Math.round(sz * 100) + '%</em></label>' +
        '<div class="duo-wk-row act"><button type="button" data-wk="undo">↶ Undo</button><button type="button" data-wk="rm" class="rm">🗑 Remove</button><button type="button" data-wk="ok" class="ok">✓ Done</button></div></div>';
    }
    function scrDelta(dx, dy) { var r = sceneR(); if (!r) return [0, 0]; var cx = r.left + r.width / 2, cy = r.top + r.height / 2, a = toFloor(cx, cy), b = toFloor(cx + dx, cy + dy); return [b[0] - a[0], b[1] - a[1]]; }
    function tryAt(p, x, y) {   // the spot, or slide along an edge: x alone, then y alone
      var ox = p.x, oy = p.y, nx = Math.round(x * 2) / 2, ny = Math.round(y * 2) / 2;
      var tries = [[nx, ny], [nx, oy], [ox, ny]];
      for (var i = 0; i < tries.length; i++) { if (tries[i][0] === ox && tries[i][1] === oy) continue; p.x = tries[i][0]; p.y = tries[i][1]; if (fits(p)) return true; }
      p.x = ox; p.y = oy; return false;
    }
    function wkAct(a) {
      var p = selPiece(); if (!p && a !== 'undo') return libDraw();
      if (a === 'undo') { var keep = p && p.id; histGo(true); if (keep && pieceOf(keep)) { V.sel = { pc: keep }; render(); } libDraw(); return; }
      if (a === 'ok') { var ok = document.querySelector('.mn-bq [data-bqok]'); if (ok) ok.click(); else { V.sel = null; render(); } LIB.tab = LIB.back || (V.at && V.at.room ? 'furn' : 'bld'); libDraw(); hap('success'); return; }
      if (a === 'rm') { var no = document.querySelector('.mn-bq [data-bqno]'); if (no) no.click(); else change(function () { V.d.pc = V.d.pc.filter(function (q) { return q.id !== p.id; }); V.sel = null; }); LIB.tab = LIB.back || 'bld'; libDraw(); return; }
      if (a === 'rotl' || a === 'rotr') { change(function () { var f0 = p.f; p.f = ((p.f || 0) + (a === 'rotr' ? 1 : 3)) % 4; if (!fits(p) && !settle(p, p.x, p.y)) p.f = f0; }); hap('light'); return; }
      var v = { up: [0, -34], down: [0, 34], left: [-34, 0], right: [34, 0] }[a]; if (!v) return;
      var d = scrDelta(v[0], v[1]), sx = Math.round(d[0] * 2) / 2, sy = Math.round(d[1] * 2) / 2;
      if (!sx && !sy) { if (Math.abs(d[0]) > Math.abs(d[1])) sx = d[0] > 0 ? .5 : -.5; else sy = d[1] > 0 ? .5 : -.5; }
      change(function () { if (!tryAt(p, p.x + sx, p.y + sy)) toast('No room there'); }); hap('light');
    }
    document.addEventListener('change', function (e) {
      var t = e.target; if (!t.matches || !t.matches('.duo-lib [data-wksize], .wf [data-wksize]')) return; var p = selPiece(); if (!p) return; var v = +t.value;
      change(function () { var s0 = p.s || 1; p.s = v; if (!fits(p) && !settle(p, p.x, p.y)) { p.s = s0; toast('No room for it that big here'); } }); libDraw();
    }, true);
    document.addEventListener('input', function (e) { var t = e.target; if (t.matches && t.matches('.duo-lib [data-wksize], .wf [data-wksize]')) { var em = t.parentNode.querySelector('em'); if (em) em.textContent = Math.round(t.value * 100) + '%'; } }, true);
    var PAD = null;   // the touchpad: the finger's travel moves the piece the same way on screen
    document.addEventListener('pointerdown', function (e) {
      var pad = e.target.closest && e.target.closest('.duo-lib [data-wkpad], .wf [data-wkpad]'); if (!pad) return; var p = selPiece(); if (!p) return;
      e.preventDefault(); try { pad.setPointerCapture(e.pointerId); } catch (x) {} pad.classList.add('on');
      PAD = { id: e.pointerId, x: e.clientX, y: e.clientY, px: p.x, py: p.y, p: p, q: false };
    }, true);
    document.addEventListener('pointermove', function (e) {
      if (!PAD || e.pointerId !== PAD.id) return; e.preventDefault();
      var d = scrDelta((e.clientX - PAD.x) * 1.5, (e.clientY - PAD.y) * 1.5);
      if (tryAt(PAD.p, PAD.px + d[0], PAD.py + d[1]) && !PAD.q) { PAD.q = true; requestAnimationFrame(function () { if (PAD) PAD.q = false; render(); }); }
    }, true);
    document.addEventListener('pointerup', function (e) {
      if (!PAD || e.pointerId !== PAD.id) return; var pad = document.querySelector('.duo-lib [data-wkpad], .wf [data-wkpad]'); if (pad) pad.classList.remove('on');
      PAD = null; change(function () {}); hap('light');   // saved, and one step for ↶ Undo
    }, true);

    // the spot: a tap on empty ground while the library is out
    function spotMark() {
      var m = el && el.querySelector('.duo-spot');
      if (!LIB.spot || !el || !V) { if (m) m.remove(); return; }
      if (!m) { m = document.createElement('i'); m.className = 'duo-spot'; m.textContent = '📍'; el.querySelector('.mn-dsp-stage').appendChild(m); }
      var c = P(LIB.spot[0], LIB.spot[1], 0); m.style.left = Math.round(V.cam.x + c[0] * V.cam.z) + 'px'; m.style.top = Math.round(V.cam.y + c[1] * V.cam.z) + 'px';
    }
    var dn = null;
    document.addEventListener('pointerdown', function (e) { dn = LIB.on && el && e.target.closest && e.target.closest('.mn-dsp-scene') ? { x: e.clientX, y: e.clientY } : null; }, true);
    document.addEventListener('pointerup', function (e) {
      if (!dn || !LIB.on || !V || V.hold) return; var moved = Math.abs(e.clientX - dn.x) + Math.abs(e.clientY - dn.y) > 8; dn = null; if (moved) return;
      if (e.target.closest('[data-pc], [data-it]')) return;   // a piece: the usual select
      LIB.spot = toFloor(e.clientX, e.clientY); spotMark(); libDraw();
    }, true);
    var pk0 = pkOpen;
    pkOpen = function (tab) { if (split() && el && V && !V.visit) return libOpen(tab === 'decor' ? 'decor' : null); return pk0.apply(null, arguments); };
    var cam0 = camera;
    camera = function () { var o = cam0.apply(null, arguments); if (LIB.spot) spotMark(); return o; };
    var r1 = render;
    render = function () {
      var out = r1.apply(null, arguments);
      if (LIB.on && V && el) { var sk = V.sel && V.sel.pc && !V.sel.ref ? V.sel.pc : ''; if (sk && sk !== LIB.selKey && LIB.tab !== 'ctl') { LIB.back = LIB.tab; LIB.tab = 'ctl'; LIB.selKey = sk; setTimeout(libDraw, 0); } else if (sk !== LIB.selKey) { LIB.selKey = sk; if (LIB.tab === 'ctl') setTimeout(libDraw, 0); } }
      if (LIB.on) { if (!el || !V) libClose(); else if (!split()) { LIB.resume = true; libClose(); } else if (LIB.key !== V.bid + '|' + lvl()) { LIB.spot = null; LIB.tab = null; LIB.tab = V.at && V.at.room ? 'furn' : 'bld'; libDraw(); } }
      return out;
    };
    // folding puts the library away and unfolding brings it back, the piece you are placing still selected with its ✓
    window.addEventListener('resize', function () { if (LIB.on && !split()) { LIB.resume = true; libClose(); } else if (!LIB.on && LIB.resume && split() && el && V) libOpen(LIB.tab, true); });

    function buildHere(bid) {   // the island of a board on screen, then its build library (unfolding the phone)
      if (bid && (!V || V.bid !== bid)) {
        try { if (window.MinestUniverse && !document.querySelector('.uv')) MinestUniverse.open({ path: [{ t: 'home' }, { t: 'world', bid: bid }] }); } catch (e) {}
        open({ t: 'world', bid: bid });
      }
      if (!V) return false; if (typeof WFAPI !== 'undefined' && WFAPI && WFAPI.on()) { WFAPI.sync(); return true; }   // the Fold flow keeps the level you are on
      if (V.at) { var g = 4; while (V.at && g--) leaveRoom(); }
      libOpen(); fit(); return true;
    }
    DUO_API = { LIB: LIB, ctlHtml: ctlHtml, wkAct: wkAct, placeKind: placeKind, libClose: libClose, centreOn: centreOn, selPiece: selPiece };
    window.MinestDuoWorld = { buildHere: buildHere, sel: function () { var p = selPiece(); return p ? { id: p.id, k: p.k, x: p.x, y: p.y, f: p.f || 0, s: p.s || 1 } : null; }, placed: function (ref) { return !!(V && placed()[ref]); }, holding: function () { return !!(V && V.hold); }, locate: locate, build: function (tab) { return libOpen(tab); }, place: function (k) { return placeKind(k); }, libOn: function () { return LIB.on; }, open: function () { return !!V; }, board: function () { return V ? V.bid : null; } };
  })();
