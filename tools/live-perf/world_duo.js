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
         list it is, so the board can scroll to it. */
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
        var ref = R.things[0], t = ref && IX[ref];
        bar(t ? '<span>「' + esc(t.s.title || 'This card') + '」is not on the island yet</span><button type="button" class="go" data-duowplace="' + esc(ref) + '">🧱 Place it</button>'
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
      var b = t.closest('[data-duowhit], [data-duowplace], [data-duowx]'); if (!b) return;
      e.preventDefault(); e.stopPropagation();
      var w = el.querySelector('.duo-wbar');
      if (b.hasAttribute('data-duowx')) { bar(null); return; }
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
    window.MinestDuoWorld = { locate: locate, open: function () { return !!V; }, board: function () { return V ? V.bid : null; } };
  })();
