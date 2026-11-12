/* Minest · Spatial Home — the Santorini Atelier (environment "santorini").
   A 6 × 5 m whitewashed room with a deep arched window over the caldera. Everything is built from boxes (voxel.js).
   Coordinates: x right, y up, z towards the door; the window wall is z = -D. Units are metres.
   The room only builds the place and the furniture; the seven interactive things live in objects.js and are put on
   the anchors returned here (so another environment can offer the same anchors later — Phase 4). */
(function (root) {
  'use strict';
  var THREE = root.THREE, SV = root.SpatialVoxel, VB = SV.VB, MAT = SV.MAT;
  var W = 3, D = 2.5, H = 3, T = 0.3;
  var WIN = { a: 1.25, y0: 0.95, y1: 1.75, b: 0.75 };            // half width, sill, spring line, arch rise

  /* furniture can be rebuilt in another environment's materials: TH maps palette names to that environment's colours */
  var TH = null;
  function themed(v, th) {
    if (!th) return v;
    var box = v.box;
    v.box = function (x0, y0, z0, x1, y1, z1, colour, jit) { return box.call(v, x0, y0, z0, x1, y1, z1, (typeof colour === 'string' && th[colour]) || colour, jit); };
    return v;                                                          // cb and ball go through box
  }
  function mk(seed) { return themed(new VB(seed), TH); }
  function archTop(x) { var k = 1 - (x * x) / (WIN.a * WIN.a); return WIN.y1 + (k > 0 ? WIN.b * Math.sqrt(k) : 0); }
  function q(v) { return Math.round(v * 20) / 20; }

  function shell(g) {
    var v = new VB(11), x, z;
    /* floor: stone tiles on a grout bed */
    v.box(-W - T, -0.2, -D - T, W + T, -0.02, D + T, 'grout');
    for (x = -W; x < W - 0.01; x += 0.5) for (z = -D; z < D - 0.01; z += 0.5)
      v.box(x + 0.01, -0.02, z + 0.01, x + 0.49, 0, z + 0.49, ((x * 2 + z * 2) & 1) ? 'stone' : 'stone2', 0.07);
    /* side walls, door wall, ceiling */
    v.box(-W - T, 0, -D - T, -W, H, D + T, 'plaster', 0);
    v.box(W, 0, -D - T, W + T, H, D + T, 'plaster', 0);
    v.box(-W, 0, D, W, H, D + T, 'plaster', 0);
    v.box(-W - T, H, -D - T, W + T, H + 0.25, D + T, 'plaster', 0);
    /* window wall: two solid ends, a sill block, and stepped columns over the arch */
    v.box(-W, 0, -D - T, -WIN.a, H, -D, 'plaster');
    v.box(WIN.a, 0, -D - T, W, H, -D, 'plaster');
    v.box(-WIN.a, 0, -D - T, WIN.a, WIN.y0 - 0.05, -D, 'plaster');
    v.box(-WIN.a - 0.05, WIN.y0 - 0.05, -D - T - 0.04, WIN.a + 0.05, WIN.y0, -D + 0.06, 'stone', 0.04);   // sill slab
    for (x = -WIN.a; x < WIN.a - 0.001; x += 0.05) {
      var top = q(archTop(x + 0.025));
      v.box(x, top, -D - T, x + 0.05, H, -D, 'plaster');
      var low = Math.min(top, q(archTop(x - 0.025)), q(archTop(x + 0.075)));                           // no gaps where the arch is steep
      v.box(x, Math.max(WIN.y1, low - 0.06), -D - 0.2, x + 0.05, top, -D - 0.1, 'blue');                 // arched frame
    }
    v.box(-WIN.a, WIN.y0, -D - 0.2, -WIN.a + 0.06, WIN.y1 + 0.05, -D - 0.1, 'blue');                     // jambs
    v.box(WIN.a - 0.06, WIN.y0, -D - 0.2, WIN.a, WIN.y1 + 0.05, -D - 0.1, 'blue');
    v.box(-WIN.a, WIN.y1 - 0.025, -D - 0.18, WIN.a, WIN.y1 + 0.025, -D - 0.12, 'blue');                  // transom
    /* blue skirting, the Santorini way */
    v.box(-W, 0, -D, -W + 0.03, 0.12, D, 'blue'); v.box(W - 0.03, 0, -D, W, 0.12, D, 'blue');
    v.box(-W, 0, D - 0.03, W, 0.12, D, 'blue');
    v.box(-W, 0, -D, -1.05, 0.12, -D + 0.03, 'blue'); v.box(1.05, 0, -D, W, 0.12, -D + 0.03, 'blue');
    /* ceiling beams */
    for (x = -2.4; x <= 2.41; x += 1.2) v.box(x - 0.07, H - 0.16, -D, x + 0.07, H, D, 'wood', 0.08);
    v.box(-W, H - 0.1, -0.06, W, H, 0.06, 'woodDark');
    /* the door (decor) with a small arch light over it */
    v.box(1.0, 0, D - 0.06, 1.9, 2.05, D, 'blue'); v.box(1.06, 0.12, D - 0.08, 1.42, 0.95, D - 0.05, 'blueDeep');
    v.box(1.48, 0.12, D - 0.08, 1.84, 0.95, D - 0.05, 'blueDeep'); v.box(1.06, 1.05, D - 0.08, 1.42, 1.95, D - 0.05, 'blueDeep');
    v.box(1.48, 1.05, D - 0.08, 1.84, 1.95, D - 0.05, 'blueDeep'); v.box(1.08, 0.98, D - 0.11, 1.13, 1.03, D - 0.06, 'brass');
    v.box(0.94, 0, D - 0.05, 1.0, 2.11, D, 'plaster2'); v.box(1.9, 0, D - 0.05, 1.96, 2.11, D, 'plaster2');
    v.box(0.94, 2.05, D - 0.05, 1.96, 2.11, D, 'plaster2');
    g.add(v.mesh());
  }

  function rug(g) {
    var v = mk(21), z, i = 0;
    for (z = -1.45; z < 0.35; z += 0.15, i++) v.box(-1.15, 0, z, 1.15, 0.018, z + 0.15, i % 3 === 1 ? 'blue' : (i % 3 === 2 ? 'blueSoft' : 'cream'), 0.05);
    for (var x = -1.12; x < 1.13; x += 0.09) { v.box(x, 0, -1.5, x + 0.04, 0.012, -1.45, 'cream'); v.box(x, 0, 0.35, x + 0.04, 0.012, 0.4, 'cream'); }
    var m = v.mesh(); m.castShadow = false; g.add(m);
  }

  function desk(g) {
    var v = mk(31), z0 = -2.38, z1 = -1.55;
    v.box(-1.05, 0.73, z0, 1.05, 0.78, z1, 'woodLight', 0.03);                    // top
    for (var x = -1.05; x < 1.04; x += 0.3) v.box(x, 0.781, z0, x + 0.004, 0.782, z1, 'wood');
    v.box(-1.0, 0.63, z0 + 0.04, 1.0, 0.73, z1 - 0.04, 'wood');                   // apron
    [[-0.98, z0 + 0.04], [0.92, z0 + 0.04], [-0.98, z1 - 0.1], [0.92, z1 - 0.1]].forEach(function (p) { v.box(p[0], 0, p[1], p[0] + 0.06, 0.63, p[1] + 0.06, 'wood', 0.05); });
    v.box(0.45, 0.33, z0 + 0.06, 0.92, 0.63, z1 - 0.06, 'woodLight');             // drawer unit
    v.box(0.48, 0.5, z1 - 0.065, 0.89, 0.61, z1 - 0.05, 'wood'); v.box(0.48, 0.36, z1 - 0.065, 0.89, 0.47, z1 - 0.05, 'wood');
    v.box(0.66, 0.54, z1 - 0.05, 0.71, 0.57, z1 - 0.035, 'brass'); v.box(0.66, 0.4, z1 - 0.05, 0.71, 0.43, z1 - 0.035, 'brass');
    /* desk lamp (brass arm, blue shade) at the far left corner */
    v.cb(-0.86, 0.78, -2.2, 0.12, 0.02, 0.12, 'brass'); v.cb(-0.86, 0.8, -2.2, 0.025, 0.3, 0.025, 'brass');
    v.box(-0.87, 1.08, -2.21, -0.7, 1.105, -2.19, 'brass'); v.cb(-0.7, 1.0, -2.2, 0.16, 0.03, 0.16, 'blueDeep');
    v.cb(-0.7, 1.03, -2.2, 0.12, 0.05, 0.12, 'blue'); v.cb(-0.7, 1.08, -2.2, 0.07, 0.03, 0.07, 'blue');
    /* mug and a pencil pot — small, to the back, the working area stays free */
    v.cb(0.12, 0.78, -2.22, 0.07, 0.08, 0.07, 'plaster'); v.box(0.155, 0.8, -2.235, 0.18, 0.84, -2.205, 'plaster');
    v.cb(0.12, 0.855, -2.22, 0.05, 0.004, 0.05, 'woodDark');
    v.cb(0.96, 0.78, -2.24, 0.07, 0.09, 0.07, 'terracotta'); v.cb(0.95, 0.87, -2.245, 0.012, 0.07, 0.012, 'gold');
    v.cb(0.975, 0.87, -2.235, 0.012, 0.09, 0.012, 'blue'); v.cb(0.96, 0.87, -2.225, 0.012, 0.05, 0.012, 'red');
    g.add(v.mesh());
    var b = mk(32); b.cb(-0.7, 0.975, -2.2, 0.06, 0.025, 0.06, '#ffe9a8');
    g.add(b.mesh(MAT.glow(), true));
  }

  function chair(g) {
    var v = mk(41), cx = 0, cz = -1.18;
    [[-0.2, -0.2], [0.16, -0.2], [-0.2, 0.16], [0.16, 0.16]].forEach(function (p) { v.box(cx + p[0], 0, cz + p[1], cx + p[0] + 0.04, 0.43, cz + p[1] + 0.04, 'wood', 0.05); });
    v.box(cx - 0.22, 0.43, cz - 0.22, cx + 0.22, 0.47, cz + 0.22, 'woodLight');
    v.box(cx - 0.2, 0.47, cz - 0.2, cx + 0.2, 0.51, cz + 0.2, 'blue', 0.04);                          // cushion
    v.box(cx - 0.2, 0.47, cz + 0.16, cx - 0.16, 0.95, cz + 0.2, 'wood'); v.box(cx + 0.16, 0.47, cz + 0.16, cx + 0.2, 0.95, cz + 0.2, 'wood');
    v.box(cx - 0.2, 0.8, cz + 0.165, cx + 0.2, 0.92, cz + 0.195, 'woodLight'); v.box(cx - 0.2, 0.62, cz + 0.165, cx + 0.2, 0.68, cz + 0.195, 'woodLight');
    g.add(v.mesh());
  }

  function bookshelf(g) {
    var v = mk(51), x0 = 2.62, x1 = 3.0, z0 = -1.5, z1 = -0.1, ys = [0.06, 0.52, 0.98, 1.44, 1.9], r = v.r;
    v.box(x1 - 0.03, 0, z0, x1, 2.0, z1, 'blue');                                                     // painted back
    v.box(x0, 0, z0, x1, 2.0, z0 + 0.04, 'plaster2'); v.box(x0, 0, z1 - 0.04, x1, 2.0, z1, 'plaster2');
    v.box(x0 - 0.02, 1.96, z0 - 0.02, x1, 2.02, z1 + 0.02, 'woodLight');
    ys.forEach(function (y) { v.box(x0, y - 0.04, z0 + 0.04, x1 - 0.03, y, z1 - 0.04, 'woodLight', 0.04); });
    var cols = ['blue', 'cream', 'coral', 'ink', 'gold', 'leafDark', 'plaster', 'blueSoft', 'terracotta', 'woodDark'];
    function books(y, a, b) {
      for (var z = a; z < b - 0.03;) {
        var t = 0.03 + r() * 0.035, h = 0.24 + r() * 0.12, d = 0.2 + r() * 0.06;
        if (z + t > b) break;
        v.box(x1 - 0.04 - d, y, z, x1 - 0.04, y + h, z + t, cols[(r() * cols.length) | 0], 0.06);
        if (r() < 0.35) v.box(x1 - 0.045 - d, y + h * 0.7, z, x1 - 0.04 - d, y + h * 0.78, z + t, 'gold');
        z += t + (r() < 0.12 ? 0.03 : 0.004);
      }
    }
    books(ys[0], z0 + 0.06, z1 - 0.3); books(ys[1], z0 + 0.3, z1 - 0.06); books(ys[3], z0 + 0.06, z1 - 0.5);
    books(ys[2], z0 + 0.06, z0 + 0.36); books(ys[2], z1 - 0.4, z1 - 0.06);                            // the middle of this shelf is the album's place
    /* a storage box, a trailing plant and a little amphora */
    v.box(x0 + 0.04, ys[0], z1 - 0.28, x1 - 0.06, ys[0] + 0.2, z1 - 0.07, 'straw', 0.08);
    v.cb(x0 + 0.17, ys[1], z0 + 0.17, 0.14, 0.12, 0.14, 'terracotta');
    v.ball(x0 + 0.17, ys[1] + 0.19, z0 + 0.17, 0.12, 0.05, 'leaf', 0.25);
    v.box(x0 + 0.02, ys[1] - 0.12, z0 + 0.1, x0 + 0.06, ys[1] + 0.14, z0 + 0.14, 'leaf2'); v.box(x0 + 0.02, ys[1] - 0.2, z0 + 0.2, x0 + 0.06, ys[1] + 0.1, z0 + 0.24, 'leaf');
    v.cb(x0 + 0.18, ys[3], z1 - 0.3, 0.1, 0.05, 0.1, 'blue'); v.cb(x0 + 0.18, ys[3] + 0.05, z1 - 0.3, 0.15, 0.12, 0.15, 'plaster');
    v.cb(x0 + 0.18, ys[3] + 0.17, z1 - 0.3, 0.07, 0.07, 0.07, 'blue');
    v.cb(x0 + 0.2, 2.02, z0 + 0.3, 0.2, 0.16, 0.2, 'straw', 0.1); v.cb(x0 + 0.2, 2.02, z1 - 0.35, 0.16, 0.24, 0.16, 'blueSoft');
    g.add(v.mesh());
  }

  function cabinet(g) {
    var v = mk(61), x0 = 2.5, x1 = 3.0, z0 = 0.5, z1 = 1.9;
    v.box(x0 + 0.02, 0.08, z0 + 0.02, x1, 0.74, z1 - 0.02, 'plaster');
    v.box(x0 + 0.06, 0, z0 + 0.06, x1, 0.08, z1 - 0.06, 'plaster2');
    v.box(x0 - 0.02, 0.74, z0 - 0.02, x1, 0.8, z1 + 0.02, 'woodLight', 0.03);
    for (var i = 0; i < 3; i++) {
      var a = z0 + 0.06 + i * 0.44;
      v.box(x0, 0.13, a, x0 + 0.03, 0.7, a + 0.4, 'blue', 0.03); v.box(x0 - 0.01, 0.2, a + 0.05, x0, 0.63, a + 0.35, 'blueDeep');
      v.box(x0 - 0.03, 0.4, a + 0.33, x0 - 0.01, 0.45, a + 0.36, 'brass');
    }
    g.add(v.mesh());
  }

  function bench(g) {
    var v = mk(71), x0 = -3.0, x1 = -2.52, z0 = -1.0, z1 = 0.4;
    v.box(x0, 0, z0, x1, 0.36, z1, 'plaster'); v.box(x0, 0.36, z0, x1 - 0.02, 0.42, z1, 'blue', 0.03);
    v.box(x0, 0.42, z0 + 0.04, x0 + 0.1, 0.72, z0 + 0.42, 'gold', 0.05); v.box(x0, 0.42, z0 + 0.5, x0 + 0.1, 0.7, z0 + 0.88, 'cream', 0.05);
    v.box(x0, 0.42, z1 - 0.44, x0 + 0.1, 0.72, z1 - 0.06, 'blueSoft', 0.05);
    v.box(x1 - 0.2, 0.42, z0 + 0.6, x1 - 0.06, 0.45, z0 + 0.85, 'cream'); v.box(x1 - 0.19, 0.45, z0 + 0.62, x1 - 0.08, 0.47, z0 + 0.83, 'coral');
    g.add(v.mesh());
  }

  function plants(g) {
    var v = new VB(81), r = v.r, i;
    /* olive tree by the door wall */
    v.cb(-2.45, 0, 1.95, 0.42, 0.1, 0.42, 'terracotta'); v.cb(-2.45, 0.1, 1.95, 0.5, 0.3, 0.5, 'terracotta', 0.05);
    v.cb(-2.45, 0.38, 1.95, 0.4, 0.03, 0.4, 'woodDark');
    v.cb(-2.45, 0.4, 1.95, 0.07, 0.5, 0.07, 'wood'); v.cb(-2.42, 0.9, 1.93, 0.06, 0.4, 0.06, 'wood'); v.cb(-2.38, 1.3, 1.9, 0.05, 0.25, 0.05, 'wood');
    v.box(-2.42, 1.0, 1.93, -2.2, 1.04, 1.97, 'wood'); v.box(-2.62, 1.18, 1.9, -2.42, 1.22, 1.94, 'wood');
    function leaves(cx, cy, cz, rad) {
      v.ball(cx, cy, cz, rad, 0.08, null, 0.2, false, function (rr) { return rr() < 0.82 ? (rr() < 0.5 ? 'leaf' : (rr() < 0.6 ? 'leaf2' : 'leafDark')) : null; });
    }
    leaves(-2.36, 1.72, 1.9, 0.36); leaves(-2.12, 1.25, 1.96, 0.24); leaves(-2.66, 1.42, 1.94, 0.22); leaves(-2.4, 2.0, 2.0, 0.24);
    /* bougainvillea in a pot on the sill, right side, spilling over */
    v.cb(0.92, WIN.y0, -D - 0.14, 0.16, 0.14, 0.16, 'terracotta', 0.04);
    for (i = 0; i < 46; i++) {
      var a = r() * 6.28, rad = r() * 0.17, hh = r() * 0.3;
      v.cb(0.92 + Math.cos(a) * rad, WIN.y0 + 0.14 + hh, -D - 0.14 + Math.sin(a) * rad * 0.7, 0.05, 0.05, 0.05, r() < 0.6 ? (r() < 0.5 ? 'pink' : 'pink2') : 'leaf', 0.2);
    }
    /* a vine hanging over the arch from outside */
    for (i = 0; i < 90; i++) {
      var x = WIN.a - r() * 1.1, drop = r() * r() * 0.55 * (1 - (WIN.a - x) / 1.2);
      v.cb(x, q(archTop(Math.min(x, WIN.a - 0.03))) - 0.1 - drop, -D - T - 0.02 + r() * 0.1, 0.06, 0.06, 0.06, r() < 0.55 ? (r() < 0.5 ? 'pink' : 'pink2') : (r() < 0.5 ? 'leaf' : 'leafDark'), 0.2);
    }
    /* small pot on the bench side table and a hanging basket by the door */
    v.cb(-2.7, 0.42, -0.08, 0.1, 0.1, 0.1, 'blue'); v.ball(-2.7, 0.56, -0.08, 0.09, 0.045, 'leaf2', 0.25);
    v.box(-0.6, H - 0.5, D - 0.42, -0.59, H, D - 0.41, 'woodDark'); v.cb(-0.6, H - 0.66, D - 0.42, 0.24, 0.16, 0.24, 'straw', 0.1);
    v.ball(-0.6, H - 0.48, D - 0.42, 0.2, 0.06, null, 0.2, false, function (rr) { return rr() < 0.75 ? (rr() < 0.5 ? 'leaf' : 'leaf2') : null; });
    for (i = 0; i < 9; i++) v.cb(-0.6 + (r() - 0.5) * 0.32, H - 0.9 - r() * 0.35, D - 0.42 + (r() - 0.5) * 0.3, 0.04, 0.24, 0.04, 'leaf', 0.25);
    g.add(v.mesh());
  }

  function decor(g) {
    var v = new VB(91);
    /* pendant: cord, woven shade */
    v.box(-0.01, H - 0.75, -0.21, 0.01, H - 0.1, -0.19, 'woodDark');
    v.cb(0, H - 0.84, -0.2, 0.2, 0.09, 0.2, 'straw', 0.1); v.cb(0, H - 0.93, -0.2, 0.34, 0.09, 0.34, 'straw', 0.1); v.cb(0, H - 1.02, -0.2, 0.46, 0.09, 0.46, 'straw', 0.1);
    /* two framed pictures on the door wall: a dome and a boat */
    v.box(-2.2, 1.3, D - 0.03, -1.5, 2.1, D, 'woodLight'); v.box(-2.14, 1.36, D - 0.04, -1.56, 2.04, D - 0.03, 'blueSoft');
    v.box(-2.14, 1.36, D - 0.045, -1.56, 1.6, D - 0.04, 'blue'); v.box(-2.0, 1.6, D - 0.05, -1.7, 1.78, D - 0.04, 'plaster');
    v.box(-1.94, 1.78, D - 0.05, -1.76, 1.84, D - 0.04, 'blue'); v.box(-1.9, 1.84, D - 0.05, -1.8, 1.88, D - 0.04, 'blue');
    v.box(-1.2, 1.45, D - 0.03, -0.75, 1.95, D, 'blue'); v.box(-1.15, 1.5, D - 0.04, -0.8, 1.9, D - 0.03, 'cream');
    v.box(-1.08, 1.58, D - 0.045, -0.87, 1.62, D - 0.04, 'wood'); v.box(-0.99, 1.62, D - 0.045, -0.97, 1.82, D - 0.04, 'woodDark'); v.box(-0.97, 1.66, D - 0.045, -0.88, 1.8, D - 0.04, 'coral');
    /* hat and bag by the door */
    v.box(2.3, 1.62, D - 0.05, 2.34, 1.66, D, 'brass'); v.box(2.14, 1.44, D - 0.07, 2.5, 1.47, D - 0.01, 'straw', 0.08); v.box(2.23, 1.47, D - 0.07, 2.41, 1.58, D - 0.01, 'straw', 0.08);
    v.box(2.23, 1.5, D - 0.075, 2.41, 1.53, D - 0.07, 'blue');
    /* niche shelf on the left wall, towards the window: two jars */
    v.box(-W, 1.25, -2.25, -W + 0.2, 1.29, -1.55, 'woodLight'); v.cb(-W + 0.1, 1.29, -2.05, 0.1, 0.15, 0.1, 'blue'); v.cb(-W + 0.1, 1.44, -2.05, 0.05, 0.04, 0.05, 'blue');
    v.cb(-W + 0.1, 1.29, -1.78, 0.12, 0.1, 0.12, 'plaster'); v.cb(-W + 0.1, 1.39, -1.78, 0.07, 0.03, 0.07, 'gold');
    g.add(v.mesh());
    var b = new VB(92); b.cb(0, H - 1.06, -0.2, 0.14, 0.05, 0.14, '#fff0c2'); g.add(b.mesh(MAT.glow(), true));
  }

  /* ---- outside: terrace, the village stepping down the cliff, the caldera, the sea */
  function outside(g) {
    var v = new VB(101), r = v.r, i;
    function house(x, y, z, w, h, d, col, dome) {
      v.box(x - w / 2, y - 6, z - d / 2, x + w / 2, y + h, z + d / 2, col || 'plaster', 0.03);
      v.box(x - w / 2 - 0.08, y + h, z - d / 2 - 0.08, x + w / 2 + 0.08, y + h + 0.12, z + d / 2 + 0.08, 'plaster');
      v.box(x - 0.3, y + h * 0.3, z + d / 2, x + 0.3, y + h * 0.75, z + d / 2 + 0.05, 'blue');
      if (dome) v.ball(x, y + h + 0.1, z, Math.min(w, d) * 0.42, 0.25, 'blue', 0.05, true);
    }
    /* terrace under the window with a low parapet */
    v.box(-W - T, -0.4, -D - T - 2.2, W + T + 1.5, -0.05, -D - T, 'stone', 0.04);
    v.box(-W - T, -0.05, -D - T - 2.2, W + T + 1.5, 0.45, -D - T - 1.95, 'plaster'); v.box(-W - T - 0.05, 0.45, -D - T - 2.25, W + T + 1.55, 0.52, -D - T - 1.9, 'plaster2');
    v.cb(-2.2, -0.05, -D - T - 1.2, 0.4, 0.4, 0.4, 'terracotta'); v.ball(-2.2, 0.55, -D - T - 1.2, 0.34, 0.11, null, 0.2, false, function (rr) { return rr() < 0.8 ? (rr() < 0.5 ? 'pink' : 'leaf') : null; });
    /* the village: white cubes, blue domes, a bell tower, a windmill */
    house(-4.2, -2.2, -8.5, 3.2, 2.6, 3, 'plaster', true);
    house(-1.2, -3.6, -10.5, 2.6, 2.2, 2.6, '#f6e3cf');
    house(1.8, -2.8, -9.5, 2.8, 2.4, 2.6, 'plaster');
    house(4.6, -1.6, -8.2, 3, 2.8, 3, 'plaster', true);
    house(0.4, -5.6, -13.5, 3.4, 2.4, 3, 'plaster', true);
    house(-3.6, -6.2, -14.5, 3, 2.4, 3, '#f3d9d2');
    house(4.2, -6, -14, 3, 2.6, 3, 'plaster');
    house(-7.5, -4.4, -12, 3.2, 3, 3.2, 'plaster'); house(8, -4.8, -12.5, 3.2, 3, 3.2, '#f6e3cf', true);
    v.box(2.5, -0.4, -9.9, 3.1, 1.5, -9.3, 'plaster'); v.box(2.6, 0.7, -9.95, 3.0, 1.2, -9.25, 'blueDeep'); v.box(2.45, 1.5, -9.95, 3.15, 1.62, -9.25, 'plaster2');
    v.box(2.72, 1.62, -9.68, 2.88, 2.0, -9.52, 'plaster'); v.box(2.66, 1.78, -9.62, 2.94, 1.84, -9.58, 'plaster');
    v.box(-6.6, -1.4, -10.6, -5.4, 1.1, -9.4, 'plaster', 0.03); v.ball(-6, 1.1, -10, 0.72, 0.24, 'straw', 0.1, true);
    for (i = 0; i < 4; i++) { var a = i * Math.PI / 2 + 0.5; v.cb(-6 + Math.cos(a) * 0.8, 0.5 + Math.sin(a) * 0.8 - 0.06, -9.3, 0.12 + Math.abs(Math.cos(a)) * 1.3, 0.12 + Math.abs(Math.sin(a)) * 1.3, 0.04, 'cream'); }
    /* the cliff they stand on */
    for (i = 0; i < 26; i++) {
      var cx = -11 + r() * 22, cz = -7.5 - r() * 9, top = -2.5 - (-(cz) - 7.5) * 0.55 - r() * 1.2;
      v.box(cx - 2, -15, cz - 2, cx + 2, top, cz + 2, r() < 0.5 ? '#b89b82' : '#a88a74', 0.1);
    }
    /* the far rim of the caldera */
    for (i = 0; i < 34; i++) {
      var fx = -150 + i * 9 + r() * 4, fh = 5 + Math.sin(i * 0.45) * 4 + r() * 4;
      v.box(fx, -14, -190 - r() * 14, fx + 10, -14 + fh, -176, i % 5 === 0 ? '#7f93ad' : '#8fa3bd', 0.06);
      if (r() < 0.25) v.box(fx + 2, -14 + fh, -186, fx + 5, -14 + fh + 0.7, -180, 'plaster');
    }
    v.box(-34, -14, -92, -12, -9.5, -78, '#7c8ea6', 0.05); v.box(-30, -9.5, -90, -18, -7.6, -82, '#8a9bb3', 0.05);
    var m = v.mesh(null, true); g.add(m);

    /* sea */
    var c = document.createElement('canvas'); c.width = c.height = 64; var x2 = c.getContext('2d'), rr = SV.rng(77);
    x2.fillStyle = '#2f86cc'; x2.fillRect(0, 0, 64, 64);
    for (i = 0; i < 150; i++) { x2.fillStyle = rr() < 0.5 ? '#3d97da' : (rr() < 0.6 ? '#2877bb' : '#8fd0f6'); x2.fillRect((rr() * 64) | 0, (rr() * 64) | 0, 2 + ((rr() * 5) | 0), 1); }
    var tex = new THREE.CanvasTexture(c); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(70, 70); tex.magFilter = THREE.NearestFilter; tex.encoding = THREE.sRGBEncoding;
    var sea = new THREE.Mesh(new THREE.PlaneGeometry(700, 700), new THREE.MeshBasicMaterial({ map: tex }));
    sea.rotation.x = -Math.PI / 2; sea.position.set(0, -14, -150); g.add(sea);

    /* sky dome: vertical gradient */
    var sg = new THREE.SphereGeometry(420, 24, 12), col = [], P = sg.attributes.position, top = new THREE.Color('#6fb4ee').convertSRGBToLinear(), hor = new THREE.Color('#e6f4ff').convertSRGBToLinear(), t = new THREE.Color();
    for (i = 0; i < P.count; i++) { var k = Math.max(0, Math.min(1, P.getY(i) / 260)); t.copy(hor).lerp(top, Math.pow(k, 0.6)); col.push(t.r, t.g, t.b); }
    sg.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    g.add(new THREE.Mesh(sg, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false })));

    /* clouds and a sailing boat */
    var cv = new VB(102), cr = cv.r;
    for (i = 0; i < 7; i++) {
      var ox = -90 + i * 30 + cr() * 10, oy = 16 + cr() * 14, oz = -150 - cr() * 30;
      for (var k2 = 0; k2 < 5; k2++) cv.box(ox + k2 * 4 - cr() * 2, oy + cr() * 1.5, oz, ox + k2 * 4 + 5 + cr() * 3, oy + 2 + cr() * 2.5, oz + 4, '#ffffff');
    }
    var clouds = cv.mesh(MAT.glow(0.92), true); g.add(clouds);
    var bv = new VB(103);
    bv.box(-1.6, 0, -0.5, 1.6, 0.5, 0.5, 'plaster'); bv.box(-1.9, 0.25, -0.35, -1.6, 0.5, 0.35, 'plaster'); bv.box(-1.6, 0.5, -0.5, 1.6, 0.58, 0.5, 'blue');
    bv.box(-0.05, 0.5, -0.05, 0.05, 3.6, 0.05, 'wood'); bv.box(0.05, 0.9, -0.03, 1.3, 1.5, 0.03, 'cream'); bv.box(0.05, 1.5, -0.03, 0.95, 2.2, 0.03, 'cream'); bv.box(0.05, 2.2, -0.03, 0.55, 2.9, 0.03, 'cream'); bv.box(0.05, 2.9, -0.03, 0.25, 3.4, 0.03, 'cream');
    bv.box(-0.9, 0.9, -0.03, -0.05, 1.6, 0.03, 'coral'); bv.box(-0.55, 1.6, -0.03, -0.05, 2.4, 0.03, 'coral');
    var boat = bv.mesh(null, true); boat.position.set(-14, -14, -52); boat.scale.setScalar(1.4); g.add(boat);

    return { sea: tex, clouds: clouds, boat: boat };
  }

  function avatar() {
    var g = new THREE.Group(), v = new VB(111);
    v.box(-0.13, 0, -0.07, -0.02, 0.62, 0.07, 'blueDeep'); v.box(0.02, 0, -0.07, 0.13, 0.62, 0.07, 'blueDeep');
    v.box(-0.17, 0.62, -0.09, 0.17, 1.12, 0.09, 'plaster'); v.box(-0.17, 0.62, -0.095, 0.17, 0.7, 0.095, 'blue');
    v.box(-0.25, 0.68, -0.06, -0.17, 1.1, 0.06, 'plaster'); v.box(0.17, 0.68, -0.06, 0.25, 1.1, 0.06, 'plaster');
    v.box(-0.25, 0.6, -0.06, -0.17, 0.68, 0.06, '#e8b995'); v.box(0.17, 0.6, -0.06, 0.25, 0.68, 0.06, '#e8b995');
    v.box(-0.13, 1.12, -0.12, 0.13, 1.38, 0.12, '#e8b995'); v.box(-0.14, 1.3, -0.13, 0.14, 1.4, 0.13, 'woodDark');
    v.box(-0.26, 1.38, -0.26, 0.26, 1.41, 0.26, 'straw', 0.08); v.box(-0.15, 1.41, -0.15, 0.15, 1.5, 0.15, 'straw', 0.08); v.box(-0.155, 1.41, -0.155, 0.155, 1.44, 0.155, 'blue');
    g.add(v.mesh()); return g;
  }

  function build(scene) {
    TH = null;
    var holder = new THREE.Group(); holder.name = 'env-santorini'; scene.add(holder);
    scene = holder;                                                   // lights and fog target below go into the holder
    var g = new THREE.Group(); g.name = 'santorini-atelier';
    shell(g); rug(g); desk(g); chair(g); bookshelf(g); cabinet(g); bench(g); plants(g); decor(g);
    var out = outside(g);
    scene.add(g);

    /* light: sky fill, sun through the window (the only shadow caster), a warm pendant */
    var hemi = new THREE.HemisphereLight(0xeaf4ff, 0xe9dcc4, 0.82); scene.add(hemi);
    var sun = new THREE.DirectionalLight(0xfff1d6, 1.15); sun.position.set(-2.6, 5.2, -8.5); sun.target.position.set(0.5, 0.4, 0.6);
    sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
    var sc = sun.shadow.camera; sc.left = -5; sc.right = 5; sc.top = 5; sc.bottom = -5; sc.near = 1; sc.far = 22;
    sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.02;
    scene.add(sun); scene.add(sun.target);
    var lamp = new THREE.PointLight(0xffd9a0, 0.5, 7, 2); lamp.position.set(0, H - 1.15, -0.2); scene.add(lamp);
    var fill = new THREE.PointLight(0xfff4e2, 0.28, 9, 2); fill.position.set(0, 1.6, 1.4); scene.add(fill);
    holder.parent.fog = new THREE.Fog(0xd3e9fa, 60, 330); holder.parent.background = null;

    return {
      id: 'santorini', name: 'Santorini Atelier', group: g, holder: holder, far: 900,
      dispose: function () { disposeTree(holder); }, size: { W: W, D: D, H: H }, out: out,
      /* where the seven things go (position + quarter turn). Phase 4: every environment offers the same anchor names. */
      anchors: {
        'desk.left': { p: [-0.36, 0.78, -1.93], ry: 0 }, 'desk.right': { p: [0.5, 0.78, -1.86], ry: 0 },
        'corner.window': { p: [2.36, 0, -2.06], ry: 0 }, 'wall.left': { p: [-W + 0.005, 1.6, -0.3], ry: Math.PI / 2 },
        'shelf.mid': { p: [2.74, 0.98, -0.82], ry: -Math.PI / 2 }, 'cabinet.top': { p: [2.74, 0.8, 1.2], ry: -Math.PI / 2 },
        'sill.left': { p: [-0.82, WIN.y0, -D - 0.13], ry: 0 },
        /* entry update: the desk keeps a free middle — quill front-left, key front-middle, Mochi right of the planner, the book behind it */
        'desk.quill': { p: [-0.82, 0.78, -1.78], ry: 0.25 }, 'desk.key': { p: [0.1, 0.78, -1.7], ry: 0.3 },
        'desk.mochi': { p: [0.84, 0.78, -1.78], ry: -0.3 }, 'desk.book': { p: [0.6, 0.78, -2.2], ry: 0 },
        'cabinet.left': { p: [2.74, 0.8, 0.72], ry: -Math.PI / 2 }, 'cabinet.right': { p: [2.74, 0.8, 1.66], ry: -Math.PI / 2 },
        'wall.right': { p: [W - 0.005, 1.55, 1.66], ry: -Math.PI / 2 }, 'floor.pack': { p: [-1.45, 0, -1.85], ry: 0.45 }
      },
      desk: { pos: [0, 1.34, -0.92], look: [0, 0.93, -2.2] },
      start: { pos: [0.75, 1.5, 1.75], yaw: 0.18, pitch: -0.1 },
      /* things you cannot walk through (x0, z0, x1, z1) */
      solids: [[-1.1, -2.5, 1.1, -1.5], [-0.26, -1.45, 0.26, -0.92], [2.55, -1.56, 3, -0.04], [2.45, 0.44, 3, 1.96], [-3, -1.06, -2.46, 0.46], [-2.8, 1.6, -2.1, 2.5], [1.9, -2.5, 3, -1.8]],
      avatar: avatar,
      tick: function (t) { out.sea.offset.x = t * 0.004; out.sea.offset.y = Math.sin(t * 0.2) * 0.02; out.clouds.position.x = (t * 0.35) % 40; out.boat.position.x = -14 + ((t * 0.25) % 60); out.boat.rotation.z = Math.sin(t * 0.9) * 0.03; }
    };
  }

  /* ---------------------------------------------------------------- environments (Phase 4)
     Every environment returns the same shape: anchors with the same names (the things are put on them), desk, start,
     solids, optional areas (walkable rectangles beyond the room, e.g. a terrace), avatar, tick(t), setTime(mode), dispose().
     The interior furniture keeps its footprint in every environment, so each thing lands in the same kind of place. */
  function disposeTree(o) {
    if (o.parent) o.parent.remove(o);
    o.traverse(function (m) { if (m.geometry) m.geometry.dispose(); if (m.material) [].concat(m.material).forEach(function (x) { if (x.map && x.map !== SV.grainMap) { /* shared grain stays */ } x.dispose(); }); });
  }
  var ENVS = [{ id: 'santorini', name: 'Santorini Atelier', zh: '圣托里尼工作室', icon: '🏛', build: build }];
  function register(def) { ENVS = ENVS.filter(function (e) { return e.id !== def.id; }); ENVS.push(def); }
  /* the same day / night for every environment: 0 night … 1 noon, with dawn and dusk tints */
  function timeOfDay(mode) {
    var h;
    if (mode === 'day') h = 13; else if (mode === 'dusk') h = 18.6; else if (mode === 'night') h = 22.5;
    else { var d = new Date(); h = d.getHours() + d.getMinutes() / 60; }
    var sun = Math.sin((h - 6.5) / 13 * Math.PI);                    // > 0 between 6:30 and 19:30
    var light = Math.max(0, Math.min(1, sun * 1.6 + 0.15));
    var dusk = Math.max(0, 1 - Math.abs(sun - 0.08) / 0.32) * (light > 0.02 ? 1 : 0.4);
    return { h: h, light: light, dusk: dusk, night: 1 - light };
  }
  var PT0 = { theme: function (th) { TH = th || null; } };
  root.SpatialRoom = {
    build: function (scene, id) {
      var e = ENVS.filter(function (x) { return x.id === id; })[0] || ENVS[0], r;
      try { r = e.build(scene); if (typeof r.avatar !== 'function') throw new Error('incomplete environment'); }
      catch (err) {                                                     // never a blank room: fall back to the Atelier
        if (root.console) console.warn('Spatial Home: environment ' + e.id + ' failed, using santorini', err);
        for (var i = scene.children.length - 1; i >= 0; i--) if (/^env-/.test(scene.children[i].name || '') ) disposeTree(scene.children[i]);
        PT0.theme(null); e = ENVS[0]; r = e.build(scene);
      }
      r.envId = e.id; return r;
    },
    envs: function () { return ENVS.map(function (e) { return { id: e.id, name: e.name, zh: e.zh, icon: e.icon }; }); },
    register: register, timeOfDay: timeOfDay, disposeTree: disposeTree,
    /* the shared pieces, in another environment's materials */
    parts: {
      theme: function (th) { TH = th || null; }, mk: mk,
      rug: rug, desk: desk, chair: chair, bookshelf: bookshelf, cabinet: cabinet, bench: bench, avatar: avatar,
      size: { W: W, D: D, H: H, T: T },
      anchors: function (sillY) {
        return {
          'desk.left': { p: [-0.36, 0.78, -1.93], ry: 0 }, 'desk.right': { p: [0.5, 0.78, -1.86], ry: 0 },
          'corner.window': { p: [2.36, 0, -2.06], ry: 0 }, 'wall.left': { p: [-W + 0.005, 1.6, -0.3], ry: Math.PI / 2 },
          'shelf.mid': { p: [2.74, 0.98, -0.82], ry: -Math.PI / 2 }, 'cabinet.top': { p: [2.74, 0.8, 1.2], ry: -Math.PI / 2 },
          'sill.left': { p: [-0.82, sillY, -D - 0.13], ry: 0 },
          'desk.quill': { p: [-0.82, 0.78, -1.78], ry: 0.25 }, 'desk.key': { p: [0.1, 0.78, -1.7], ry: 0.3 },
          'desk.mochi': { p: [0.84, 0.78, -1.78], ry: -0.3 }, 'desk.book': { p: [0.6, 0.78, -2.2], ry: 0 },
          'cabinet.left': { p: [2.74, 0.8, 0.72], ry: -Math.PI / 2 }, 'cabinet.right': { p: [2.74, 0.8, 1.66], ry: -Math.PI / 2 },
          'wall.right': { p: [W - 0.005, 1.55, 1.66], ry: -Math.PI / 2 },
          'floor.pack': { p: [-1.45, 0, -1.85], ry: 0.45 }   // the backpack, on the floor left of the desk
        };
      },
      solids: function () { return [[-1.1, -2.5, 1.1, -1.5], [-0.26, -1.45, 0.26, -0.92], [2.55, -1.56, 3, -0.04], [2.45, 0.44, 3, 1.96], [-3, -1.06, -2.46, 0.46], [1.9, -2.5, 3, -1.8]]; },
      deskCam: { pos: [0, 1.34, -0.92], look: [0, 0.93, -2.2] }, start: { pos: [0.75, 1.5, 1.75], yaw: 0.18, pitch: -0.1 }
    }
  };
})(window);
