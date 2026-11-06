
    /* 78 · 展馆 — the exhibition flow of the voxel world, on My World's own building / room / display logic:
       state() what the island holds (buildings, their rooms, the board's lists and how much of each is out),
       hall(k) a new exhibition building on a free spot, fill(id[, listId]) its rooms and displays with the cards
       (listId '*': every list its own room, named after it · one listId: that list · none: My World's Smart arrange).
       Every write is one history step (↶ ↷). */
    window.__showStore = {
      card: function (ref) {   // one card, front and back, as the voxel world shows it
        if (!V) return null; try { index(); } catch (e) {} var t = thing(ref); if (!t || !t.s) return null; var s = t.s, u = '';
        try { u = picOf(s) || ''; if (u) u = S(u); } catch (e) { u = ''; }
        return { title: String(s.title || ''), zh: String(s.titleZh || ''), text: String(s.meaning || s.desc || s.description || ''), img: u || '', list: String((t.k && t.k.title) || ''),
          sub: (s.stack || []).filter(function (x) { return x && x.title; }).slice(0, 8).map(function (x) { return String(x.title); }),
          checks: (s.checklistItems || []).filter(function (x) { return x && (x.text || x.title); }).slice(0, 8).map(function (x) { return String(x.text || x.title); }) };
      },
      pieces: function () {   // the displays in the scene that is open (the island or a room): where each stands and what it holds
        if (!V) return []; return (V.d.pc || []).filter(function (p) { return (p.it || []).length && !isBld(p) && BUILD[p.k]; }).map(function (p) {
          var f = foot(p); return { id: p.id, k: p.k, n: (K[p.k] && K[p.k].n) || p.k, x0: f.x0, x1: f.x1, y0: f.y0, y1: f.y1, refs: (p.it || []).filter(thing), label: p.label || '' }; });
      },
      state: function () {
        if (!V) return null; index(); var R = islandD(), on = placed();
        var bl = (R.pc || []).filter(isBld).map(function (p) { return { id: p.id, k: p.k, name: bldName(p), rooms: (p.rooms || []).map(function (r) {
          var n = 0, t = 0; ((r.d && r.d.pc) || []).forEach(function (q) { var its = (q.it || []).filter(thing); if (its.length) { n++; t += its.length; } });
          return { id: r.id, n: r.n || (ROOMS[r.k] || ROOMS.hall)[0], ic: (ROOMS[r.k] || ROOMS.hall)[1], displays: n, things: t }; }) }; });
        var ls = lists(board(V.bid)).map(function (L) { var refs = (L.k.stack || []).filter(function (s) { return s && s.id; }).map(function (s) { return L.k.id + '/' + s.id; });
          return { id: L.k.id, title: String(L.k.title || 'List'), n: refs.length, out: refs.filter(function (r) { return on[r]; }).length }; });
        return { buildings: bl, lists: ls, at: V.at ? { pc: V.at.pc, room: V.at.room || null } : null };
      },
      hall: function (k) {
        if (!V || V.visit || V.at) return null; var R = islandD(); k = k || 'bld:building_30_design_exhibition_pavilion'; ensureBld(k);
        var p = { id: uid(), k: k, x: 0, y: 0, f: R.rot || 0, s: 1.25, it: [], rooms: [], roomsInit: 1, label: '' };
        var spot = function () { return typeof bldSpot === 'function' ? (bldSpot(p, 2) || bldSpot(p, 1)) : (freeSpot(p, 1) || freeSpot(p)); }, ok = spot();
        for (var g = 0; g < 4 && !ok && typeof growLand === 'function'; g++) { if (!growLand()) break; refreshLand(); ok = spot(); }   // a full island grows, as My World's own arranging does
        if (!ok) return null; R.pc.push(p); save(true); try { render(); } catch (e) {} return p.id;
      },
      fill: function (id, listId) {
        var each = listId === '*'; if (each) listId = null;
        if (!V || V.visit || V.at) return { rooms: 0, displays: 0 }; var R = islandD(), p = (R.pc || []).filter(function (q) { return q.id === id; })[0];
        if (!p || !isBld(p)) return { rooms: 0, displays: 0 };
        var at0 = V.at; V.at = { pc: id }; var made = [], n = 0;
        try {
          index();
          if (!listId && !each) (p.rooms || []).forEach(function (r) { if (r.d) r.d.pc = r.d.pc.filter(function (q) { return !q.auto; }); });
          var plan = makePlan('build'), on = placed(), mine = {};
          (p.rooms || []).forEach(function (r) { (r.d && r.d.pc || []).forEach(function (q) { if (q.auto) (q.it || []).forEach(function (x) { mine[x] = 1; }); }); });
          plan.groups.forEach(function (g) { g.refs = g.refs.filter(function (x) { return !on[x] || (!listId && mine[x]); }); });
          plan.groups = plan.groups.filter(function (g) { return g.on && g.refs.length && (!listId || g.id === 'l:' + listId); });
          var byRoom = {}, order = [];
          plan.groups.forEach(function (g) { var rk = listId || each ? 'list:' + g.id : roomFor(g); if (!byRoom[rk]) { byRoom[rk] = []; order.push(rk); } byRoom[rk].push(g); });
          var big = (p.rooms || []).length + order.length > 5;
          order.forEach(function (rk) {
            var g0 = byRoom[rk][0], per = listId || each, kind = per ? roomFor(g0) : rk, room = per ? (p.rooms || []).filter(function (r) { return r.lid === g0.id; })[0] : (p.rooms || []).filter(function (r) { return r.k === rk; })[0];
            if (!room) { var T = ROOMS[kind] || ROOMS.hall; room = { id: 'r' + uid().slice(1), k: kind, lid: per ? g0.id : undefined, n: per ? String(g0.n) : T[0], fl: per ? 1 + Math.floor(((p.rooms || []).length) / 4) : big && /^(bedroom|study|dreams|reading)$/.test(kind) ? 2 : 1, seeded: 1, auto: 1, d: { scene: 'room', rot: 0, pc: [], land: DEF_LAND.slice(), floor: T[3], wall: T[4] } }; placeIn(p, room, room.fl, 1e9); made.push(room.n); }
            roomD(room); var res = withD(room.d, function () { return placeGroups(byRoom[rk], 'build'); }); n += res.made;
          });
        } finally { V.at = at0; }
        save(true); try { render(); } catch (e) {}
        return { rooms: made.length, displays: n, names: made };
      }
    };