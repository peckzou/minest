  /* ── My World · Island System · Terrain (patch_terrain.py) — hills, rivers and lakes are part of the island itself
     The island record keeps them per block cell: V.d.terr = { h: { 'x,y': level 1–8 }, w: { 'x,y': 1 river | 2 lake } }
     (world blocks, before the view turns; a level is half a block). Drawn with the pieces (so they sort in depth):
     stepped grass/dirt/stone/snow hills, water a hair above the ground, sand on lake shores, a waterfall where water
     meets the island's edge. Pieces standing on a hill are lifted onto it; a piece over water rides a little higher
     (a bridge). The 🚶 walk builds the same terrain (hills are climbable, half a block a step).
     ✨ Smart terrain makes it in the free land only (nothing built is moved): two or three hills, a lake, and a
     river from the hills down into the lake (or over the edge as a waterfall). The brush: raise, lower, river,
     lake, erase — tap or drag on the island. One undo step per stroke. */
  var TR = (function () {
    var H = .5;
    function T(d) { d = d || (V && V.d); return d && d.scene !== 'room' && d.terr ? d.terr : null; }
    function on() { var t = T(); return !!(t && !(V.at && V.at.room) && ((t.h && Object.keys(t.h).length) || (t.w && Object.keys(t.w).length))); }
    function ck(x, y) { return Math.floor(x) + ',' + Math.floor(y); }
    function hAt(x, y) { var t = T(); return t && t.h ? t.h[ck(x, y)] || 0 : 0; }
    function wAt(x, y) { var t = T(); return t && t.w ? t.w[ck(x, y)] || 0 : 0; }
    function liftOf(p) {   // how high a piece stands: the highest cell under it (half blocks); over water, a bridge's height
      if (!on() || !K[p.k] || K[p.k].air) return 0; var f = foot(p), m = 0, wet = false;
      for (var x = Math.floor(f.x0 + .02); x < f.x1 - .02; x++) for (var y = Math.floor(f.y0 + .02); y < f.y1 - .02; y++) { m = Math.max(m, hAt(x, y)); if (wAt(x, y)) wet = true; }
      return m * H + (wet && !m && !(K[p.k] && K[p.k].flat && /water|pond|lake|river|beach|w_/.test(p.k)) ? .22 : 0);
    }
    function lift1(p) { var z = liftOf(p); return z ? Object.assign({}, p, { z: (+p.z || 0) + z }) : p; }
    function lift(list) { if (!on()) return list; var o = list.map(lift1); o.__ter = true; return o; }
    function mark(list) { list.__ter = true; return list; }
    function rects(set) {   // greedy: merge cells (keys) into rectangles [x0, y0, x1, y1]
      var left = {}, out = []; Object.keys(set).forEach(function (k) { left[k] = 1; });
      Object.keys(set).sort(function (a, b) { var A = a.split(','), B = b.split(','); return (+A[1] - +B[1]) || (+A[0] - +B[0]); }).forEach(function (k) {
        if (!left[k]) return; var c = k.split(','), x0 = +c[0], y0 = +c[1], x1 = x0 + 1, y1 = y0 + 1;
        while (left[x1 + ',' + y0]) x1++;
        grow: for (;;) { for (var x = x0; x < x1; x++) if (!left[x + ',' + y1]) break grow; y1++; }
        for (var yy = y0; yy < y1; yy++) for (var xx = x0; xx < x1; xx++) delete left[xx + ',' + yy];
        out.push([x0, y0, x1, y1]); });
      return out;
    }
    function looks() { var gr = (V && V.d.ground) || 'grass'; return { top: { grass: 'grass_top', snow: 'snow', sand: 'sand', moss: 'moss', cherry: 'grass_top' }[gr] || 'grass_top', side: { snow: 'snow_side', sand: 'sand', moss: 'moss_side' }[gr] || 'grass_side' }; }
    function boxes(rotv) {   // the terrain as box parts in world blocks (turned by rotv for the island view)
      var t = T(); if (!t) return []; var out = [], L = looks(), maxL = 0, hs = t.h || {}, ws = t.w || {};
      Object.keys(hs).forEach(function (k) { maxL = Math.max(maxL, hs[k]); });
      function add(x0, y0, x1, y1, z0, z1, top, side) { if (rotv) { var a = rot(x0, y0, rotv), b = rot(x1, y1, rotv); x0 = Math.min(a[0], b[0]); x1 = Math.max(a[0], b[0]); y0 = Math.min(a[1], b[1]); y1 = Math.max(a[1], b[1]); }
        out.push({ t: 'box', x0: x0, x1: x1, y0: y0, y1: y1, z0: z0, z1: z1, top: top, side: side, o: {}, vf: -1, ter: 1 }); }
      for (var lv = 1; lv <= maxL; lv++) { var S = {}; Object.keys(hs).forEach(function (k) { if (hs[k] >= lv) S[k] = 1; });
        rects(S).forEach(function (r) { var top = lv >= 7 ? 'snow' : lv >= 5 ? 'stone' : L.top, side = lv >= 5 ? 'stone' : lv >= 2 ? 'dirt' : L.side; add(r[0], r[1], r[2], r[3], (lv - 1) * H, lv * H, top, side); }); }
      var W = {}; Object.keys(ws).forEach(function (k) { if (!hs[k]) W[k] = 1; });
      rects(W).forEach(function (r) { add(r[0], r[1], r[2], r[3], 0, .04, 'water', 'water'); });
      var shore = {}; Object.keys(ws).forEach(function (k) { if (ws[k] !== 2) return; var c = k.split(','), x = +c[0], y = +c[1];
        [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) { var n = (x + d[0]) + ',' + (y + d[1]); if (!ws[n] && !hs[n] && V.ls[plotAt(x + d[0] + .5, y + d[1] + .5)]) shore[n] = 1; }); });
      rects(shore).forEach(function (r) { add(r[0], r[1], r[2], r[3], 0, .02, 'sand', 'sand'); });
      Object.keys(W).forEach(function (k) { var c = k.split(','), x = +c[0], y = +c[1];   // where water meets the edge: a waterfall down the island's side
        [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) { if (V.ls[plotAt(x + d[0] + .5, y + d[1] + .5)]) return;
          var x0 = d[0] > 0 ? x + 1 : d[0] < 0 ? x - .06 : x, x1 = d[0] > 0 ? x + 1.06 : d[0] < 0 ? x : x + 1, y0 = d[1] > 0 ? y + 1 : d[1] < 0 ? y - .06 : y, y1 = d[1] > 0 ? y + 1.06 : d[1] < 0 ? y : y + 1;
          add(x0, y0, x1, y1, -1.4, .04, 'water', 'water'); }); });
      return out;
    }
    // ---- making it: in the free land only
    function grid() {
      var b = lbox(), occ = {}, land = function (x, y) { return !!V.ls[plotAt(x + .5, y + .5)]; };
      (V.d.pc || []).forEach(function (p) { if (!BUILD[p.k] || !K[p.k] || K[p.k].air || K[p.k].mob) return; var f = foot(p);
        for (var x = Math.floor(f.x0 + .02); x < f.x1 - .02; x++) for (var y = Math.floor(f.y0 + .02); y < f.y1 - .02; y++) occ[x + ',' + y] = 1; });
      var dist = {}, q = [];   // how far each free cell is from anything built (or the edge)
      for (var x = b.x0; x < b.x1; x++) for (var y = b.y0; y < b.y1; y++) { var k = x + ',' + y; if (!land(x, y) || occ[k]) { dist[k] = 0; q.push([x, y]); } }
      for (var x2 = b.x0 - 1; x2 <= b.x1; x2++) [b.y0 - 1, b.y1].forEach(function (y3) { dist[x2 + ',' + y3] = 0; q.push([x2, y3]); });
      for (var y2 = b.y0; y2 < b.y1; y2++) [b.x0 - 1, b.x1].forEach(function (x3) { dist[x3 + ',' + y2] = 0; q.push([x3, y2]); });
      for (var i = 0; i < q.length; i++) { var c = q[i], d0 = dist[c[0] + ',' + c[1]]; [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) { var X = c[0] + d[0], Y = c[1] + d[1], kk = X + ',' + Y; if (X < b.x0 || Y < b.y0 || X >= b.x1 || Y >= b.y1 || dist[kk] != null) return; dist[kk] = d0 + 1; q.push([X, Y]); }); }
      return { b: b, occ: occ, dist: dist, land: land, free: function (x, y) { return land(x, y) && !occ[x + ',' + y]; } };
    }
    function rnd(seed) { var a = seed >>> 0; return function () { a = (a + 0x6D2B79F5) >>> 0; var t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
    function path(G, from, goal, cost) {   // cheapest 4-way path over free cells (Dijkstra; a little noise makes it wander)
      var b = G.b, best = {}, prev = {}, open = [[0, from[0], from[1]]], fk = from[0] + ',' + from[1]; best[fk] = 0;
      while (open.length) { var mi = 0; for (var i = 1; i < open.length; i++) if (open[i][0] < open[mi][0]) mi = i; var cur = open.splice(mi, 1)[0], k = cur[1] + ',' + cur[2];
        if (cur[0] > best[k]) continue; if (goal(cur[1], cur[2])) { var out = [], kk = k; while (kk) { out.unshift(kk); kk = prev[kk]; } return out; }
        [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) { var X = cur[1] + d[0], Y = cur[2] + d[1], n = X + ',' + Y; if (X < b.x0 || Y < b.y0 || X >= b.x1 || Y >= b.y1) return; if (!G.free(X, Y) && !goal(X, Y)) return;
          var c2 = cur[0] + cost(X, Y); if (best[n] == null || c2 < best[n]) { best[n] = c2; prev[n] = k; open.push([c2, X, Y]); } }); }
      return null;
    }
    function gen(seed) {
      var G = grid(), r = rnd(seed), h = {}, w = {}, free = [], b = G.b;
      Object.keys(G.dist).forEach(function (k) { var c = k.split(','), x = +c[0], y = +c[1]; if (x >= b.x0 && y >= b.y0 && x < b.x1 && y < b.y1 && G.free(x, y)) free.push([x, y, G.dist[k]]); });
      if (free.length < 12) return null;
      free.sort(function (a, c) { return c[2] - a[2] + (r() - .5) * 2.5; });
      var hills = [];   // hills: in the roomiest places, never touching what is built
      free.forEach(function (c) { if (hills.length >= 3 || c[2] < 3) return; if (hills.some(function (o) { return Math.hypot(o[0] - c[0], o[1] - c[1]) < 9; })) return; hills.push(c); });
      hills.forEach(function (c, i) { var R = Math.min(c[2] + 1.5, 4 + r() * 5), peak = Math.max(2, Math.min(8, Math.round(R * (.9 + r() * .5)))), ext = Math.ceil(R);
        for (var x = c[0] - ext; x <= c[0] + ext; x++) for (var y = c[1] - ext; y <= c[1] + ext; y++) { var k = x + ',' + y; if (!G.free(x, y)) continue;
          var d = Math.hypot(x - c[0], y - c[1]) * (1 + (r() - .5) * .25); if (d >= R) continue; var v = Math.round(peak * Math.pow(1 - d / R, 1.15)); v = Math.min(v, (G.dist[k] || 0) - 1); if (v > 0) h[k] = Math.max(h[k] || 0, v); } });
      var lake = null;   // a lake: a roomy flat place away from the hills
      free.some(function (c) { if (c[2] < 3 || h[c[0] + ',' + c[1]]) return false; if (hills.some(function (o) { return Math.hypot(o[0] - c[0], o[1] - c[1]) < 6; })) return false; lake = c; return true; });
      if (lake) { var rx = 1.8 + r() * 2.4, ry = 1.6 + r() * 2;
        for (var lx = lake[0] - 5; lx <= lake[0] + 5; lx++) for (var ly = lake[1] - 5; ly <= lake[1] + 5; ly++) { var kk = lx + ',' + ly; if (!G.free(lx, ly) || h[kk] || (G.dist[kk] || 0) < 2) continue;
          var e = Math.pow((lx - lake[0]) / rx, 2) + Math.pow((ly - lake[1]) / ry, 2); if (e <= 1 + (r() - .5) * .5) w[kk] = 2; } }
      // a river: from the first hill (or an edge) down to the lake (or over the edge, a waterfall)
      var edge = function (x, y) { return !G.land(x + 1, y) || !G.land(x - 1, y) || !G.land(x, y + 1) || !G.land(x, y - 1); };
      var hs2 = lake ? hills.slice().sort(function (a, c) { return Math.hypot(c[0] - lake[0], c[1] - lake[1]) - Math.hypot(a[0] - lake[0], a[1] - lake[1]); }) : hills, src = hs2[0] ? [hs2[0][0], hs2[0][1]] : null;   // the hill farthest from the lake
      if (!src && lake) { var far = free.filter(function (c) { return edge(c[0], c[1]); }).sort(function (a, c) { return Math.hypot(c[0] - lake[0], c[1] - lake[1]) - Math.hypot(a[0] - lake[0], a[1] - lake[1]); })[0]; if (far) src = [far[0], far[1]]; }
      var cost = function (x, y) { return 1 + r() * 1.4 + (h[x + ',' + y] ? .8 : 0) + ((G.dist[x + ',' + y] || 0) < 2 ? 1.2 : 0); };
      function river(P) { if (P) P.forEach(function (k, i) { if (w[k] === 2) return; w[k] = 1; delete h[k]; if (i > 3 && i % 5 < 2 && P.length > 10) { var c = k.split(','), side = (+c[0] + +c[1]) % 2 ? [1, 0] : [0, 1], n = (+c[0] + side[0]) + ',' + (+c[1] + side[1]); if (G.free(+c[0] + side[0], +c[1] + side[1]) && !w[n] && !h[n]) w[n] = 1; } }); return P; }
      var hasLake = Object.keys(w).length > 0;
      if (src && G.free(src[0], src[1])) river(path(G, src, hasLake ? function (x, y) { return w[x + ',' + y] === 2; } : function (x, y) { return edge(x, y) && Math.hypot(x - src[0], y - src[1]) > 8; }, cost));   // from the hill down into the lake
      if (hasLake) {   // and out of the lake to the far shore: over the edge, a waterfall
        var lk = Object.keys(w).filter(function (k) { return w[k] === 2; }).map(function (k) { var c = k.split(','); return [+c[0], +c[1]]; }), away = src ? [lake[0] * 2 - src[0], lake[1] * 2 - src[1]] : [lake[0] + 9, lake[1]];
        var st0 = lk.sort(function (a, c) { return Math.hypot(a[0] - away[0], a[1] - away[1]) - Math.hypot(c[0] - away[0], c[1] - away[1]); })[0];
        if (st0) river(path(G, st0, function (x, y) { return edge(x, y) && Math.hypot(x - lake[0], y - lake[1]) > 6 && !w[x + ',' + y]; }, cost));
      }
      return { h: h, w: w };
    }
    function brush(mode, x, y) {   // one dab at world cell (x, y): radius 1 for hills and lakes, one cell for a river
      var t = V.d.terr || (V.d.terr = { h: {}, w: {} }); t.h = t.h || {}; t.w = t.w || {}; var cx = Math.floor(x), cy = Math.floor(y), changed = false;
      var cells = mode === 'river' ? [[0, 0]] : [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]];
      cells.forEach(function (d) { var X = cx + d[0], Y = cy + d[1], k = X + ',' + Y; if (!V.ls[plotAt(X + .5, Y + .5)]) return; var c = d[0] || d[1];
        if (mode === 'raise') { var v = Math.min(8, (t.h[k] || 0) + (c ? (t.h[k] || 0) < (t.h[cx + ',' + cy] || 0) ? 1 : 0 : 1)); if (v !== (t.h[k] || 0)) { t.h[k] = v; delete t.w[k]; changed = true; } }
        else if (mode === 'lower') { if (t.h[k] && (!c || t.h[k] > (t.h[cx + ',' + cy] || 0))) { t.h[k]--; if (!t.h[k]) delete t.h[k]; changed = true; } }
        else if (mode === 'river' || mode === 'lake') { var wv = mode === 'river' ? 1 : 2; if (t.w[k] !== wv || t.h[k]) { t.w[k] = wv; delete t.h[k]; changed = true; } }
        else if (mode === 'erase') { if (t.h[k] || t.w[k]) { delete t.h[k]; delete t.w[k]; changed = true; } } });
      return changed;
    }
    function walk(box) {   // the 🚶 walk: the same terrain, solid (hills climb half a block a step), water to wade through
      boxes(0).forEach(function (q) { box(q); });
    }
    return { on: on, lift: lift, lift1: lift1, mark: mark, parts: function (rotv) { return on() ? boxes(rotv == null ? V.d.rot : rotv) : []; }, gen: gen, brush: brush, walk: walk, hAt: hAt, wAt: wAt, H: H };
  })();
