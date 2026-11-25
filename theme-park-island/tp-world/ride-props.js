/* Props the rides share (2026-11-24): skeletons, swords, hills of gold, chests, barrels, lanterns, full-rigged ships.
 * Each draws into a builder of ride-show.js (or, for figures, makes its own meshes with a look). */
(function (root) {
  'use strict';
  var K = root.TPRideKit; if (!K || !K.look) return;
  K.props = function (T) {
    var PI = Math.PI, BONE = 0xe6dcc2, WOOD = 0x5a3d28, DARK = 0x33241a, GOLD = 0xe0a81e, IRON = 0x2e3036;
    function skeleton(Lk, parent, x, y, z, ry, o) { o = o || {}; var g = new T.Group(), u = {}, s = (o.h || 1.75) / 1.75; g.position.set(x, y, z); g.rotation.y = ry || 0; g.scale.setScalar(s); parent.add(g);
      Lk.mesh(g, function (b) { b.sph(BONE, 0.16, 0, 0.9, 0, 1.1, 0.6, 0.8).cyl(BONE, 0.035, 0.035, 0.6, 0, 1.2, -0.03); for (var i = 0; i < 5; i++) b.torus(BONE, 0.17 - Math.abs(i - 2) * 0.012, 0.018, 0, 1.08 + i * 0.075, 0.01, PI / 2, 0, 0, PI * 2, 14); b.box(BONE, 0.04, 0.3, 0.02, 0, 1.24, 0.17).box(BONE, 0.42, 0.03, 0.04, 0, 1.44, 0).cyl(BONE, 0.03, 0.03, 0.1, 0, 1.52, 0);
        if (o.vest != null) { [-1, 1].forEach(function (sd) { b.box(o.vest, 0.14, 0.42, 0.04, sd * 0.13, 1.24, 0.19, 0, 0, sd * 0.06).box(o.vest, 0.04, 0.42, 0.3, sd * 0.2, 1.24, 0.02); }); b.box(o.vest, 0.4, 0.44, 0.04, 0, 1.24, -0.16); }
        if (o.sash != null) b.cyl(o.sash, 0.17, 0.17, 0.09, 0, 0.98, 0, 0, 0, 0, 12).box(o.sash, 0.06, 0.3, 0.03, 0.15, 0.82, 0.1); });
      var head = new T.Group(); head.position.y = 1.58; g.add(head); u.head = head;
      Lk.mesh(head, function (b) { b.sph(BONE, 0.16, 0, 0.15, 0, 0.95, 1.05, 1.02, 16).box(BONE, 0.2, 0.1, 0.16, 0, 0.03, 0.06);
        [-1, 1].forEach(function (sd) { b.sph(0x120c08, 0.045, sd * 0.062, 0.16, 0.13, 1.1, 1.2, 0.7); if (o.eyes != null) b.glow(1).sph(o.eyes, 0.018, sd * 0.062, 0.16, 0.155).glow(0); });
        b.cone(0x120c08, 0.025, 0.05, 0, 0.095, 0.158, 0, 0, 0, 3); for (var i = 0; i < 6; i++) b.box(0xf4ecd8, 0.022, 0.035, 0.012, -0.065 + i * 0.026, 0.02, 0.142);
        if (o.hat === 'bandana') b.dome(o.hatC || 0xa3202a, 0.17, 0, 0.17, 0, 0.5, -0.1).box(o.hatC || 0xa3202a, 0.05, 0.18, 0.03, 0.15, 0.1, -0.12, 0, 0, -0.3);
        if (o.hat === 'tricorn') b.cyl(o.hatC || 0x241c18, 0.12, 0.15, 0.1, 0, 0.33, 0).cyl(o.hatC || 0x241c18, 0.31, 0.31, 0.025, 0, 0.285, 0, 0, 0, 0, 3).box(GOLD, 0.3, 0.02, 0.02, 0, 0.295, 0.145);
        if (o.patch) b.box(0x120c08, 0.08, 0.07, 0.02, -0.062, 0.16, 0.15).box(0x120c08, 0.3, 0.015, 0.02, 0, 0.2, 0.13, 0, 0, 0.2); });
      var jaw = new T.Group(); jaw.position.set(0, -0.01, 0.02); head.add(jaw); u.jaw = jaw; Lk.mesh(jaw, function (b) { b.box(BONE, 0.17, 0.045, 0.15, 0, -0.035, 0.05); for (var i = 0; i < 5; i++) b.box(0xf4ecd8, 0.022, 0.03, 0.012, -0.052 + i * 0.026, -0.005, 0.125); });
      function limb(sd, arm) { var p = new T.Group(), f = new T.Group(); if (arm) { p.position.set(sd * 0.23, 1.44, 0); f.position.y = -0.28; Lk.mesh(p, function (b) { b.sph(BONE, 0.04, 0, 0, 0).cyl(BONE, 0.024, 0.02, 0.28, 0, -0.14, 0); }); Lk.mesh(f, function (b) { b.sph(BONE, 0.03, 0, 0, 0).cyl(BONE, 0.018, 0.018, 0.26, -0.012, -0.13, 0).cyl(BONE, 0.015, 0.015, 0.26, 0.016, -0.13, 0); for (var i = 0; i < 4; i++) b.box(BONE, 0.012, 0.09, 0.012, -0.03 + i * 0.02, -0.31, 0, 0, 0, (i - 1.5) * 0.12); }); }
        else { p.position.set(sd * 0.09, 0.86, 0); f.position.y = -0.42; Lk.mesh(p, function (b) { b.sph(BONE, 0.045, 0, 0, 0).cyl(BONE, 0.03, 0.026, 0.42, 0, -0.21, 0); }); Lk.mesh(f, function (b) { b.sph(BONE, 0.04, 0, 0, 0).cyl(BONE, 0.024, 0.02, 0.38, 0, -0.19, 0).box(BONE, 0.07, 0.03, 0.2, 0, -0.4, 0.06); if (o.boots != null) b.cyl(o.boots, 0.06, 0.07, 0.26, 0, -0.27, 0).box(o.boots, 0.12, 0.08, 0.24, 0, -0.4, 0.05); }); }
        p.add(f); g.add(p); return [p, f]; }
      var aL = limb(-1, true), aR = limb(1, true), lL = limb(-1, false), lR = limb(1, false); u.armL = aL[0]; u.foreL = aL[1]; u.armR = aR[0]; u.foreR = aR[1]; u.legL = lL[0]; u.shinL = lL[1]; u.legR = lR[0]; u.shinR = lR[1]; g.userData = u; return g; }
    function sword(Lk, hand, col) { return Lk.mesh(hand, function (b) { b.box(col || 0xcfd6dc, 0.035, 0.9, 0.012, 0, -0.78, 0.05).box(GOLD, 0.2, 0.03, 0.05, 0, -0.33, 0.05).cyl(DARK, 0.022, 0.022, 0.14, 0, -0.27, 0.05).torus(GOLD, 0.07, 0.012, 0, -0.33, 0.1, 0, PI / 2, 0, PI); }); }
    function gold(b, x, y, z, r, seed) { var rn = K.rnd(seed + 3), AX = r * 1.3, BY = r * 0.6, C = [0xd8a41c, 0xf0c030, 0xb88a14, 0xffd858];
      function top(d) { return y + BY * Math.sqrt(Math.max(0, 1 - (d / AX) * (d / AX))); }
      /* the heap itself, dark and polished, with smaller heaps slumped against it so the outline is not one smooth curve */
      b.glow(-0.5).rock(function (px, py) { return K.mix(0x4a3206, 0x9a7214, Math.min(1, Math.max(0, (py - y) / BY))); }, r, x, y, z, seed, 1.3, 0.6, 1.3, 2, 0.12);
      for (var k = 0; k < 7; k++) { var ka = rn() * PI * 2, kd = AX * (0.4 + rn() * 0.4), kr = r * (0.14 + rn() * 0.12); b.rock(K.mix(0x5a3e08, 0xa87a16, rn()), kr, x + Math.cos(ka) * kd, top(kd) - kr * 0.25, z + Math.sin(ka) * kd, seed * 7 + k, 1.3, 0.75, 1.3, 1, 0.16); }
      /* coins, lying to the slope, every one catching the light */
      var n = Math.round(70 + r * 80); b.glow(-1); for (var i = 0; i < n; i++) { var a = rn() * PI * 2, d = Math.sqrt(rn()) * AX * 1.02, px = x + Math.cos(a) * d, pz = z + Math.sin(a) * d, h = top(Math.min(d, AX * 0.98)), sl = Math.min(1.2, (d / AX) * 1.3), cr = 0.1 + rn() * 0.07;
        b.cyl(C[i % 4], cr, cr, 0.03, px, h + 0.03 + rn() * 0.08, pz, Math.sin(a) * sl + (rn() - 0.5) * 0.7, rn() * 3, -Math.cos(a) * sl + (rn() - 0.5) * 0.7, 6); }
      /* a skirt of coins spilled on the floor round it, little stacks, and the things that are not coins */
      for (i = 0; i < n * 0.25; i++) { a = rn() * PI * 2; d = AX * (1.0 + rn() * 0.35); b.cyl(C[i % 4], 0.11, 0.11, 0.03, x + Math.cos(a) * d, y + 0.04, z + Math.sin(a) * d, (rn() - 0.5) * 0.3, 0, (rn() - 0.5) * 0.3, 6); }
      for (i = 0; i < 3 + r * 2; i++) { a = rn() * PI * 2; d = rn() * AX * 0.9; var sh = 0.12 + rn() * 0.3; b.cyl(C[i % 2], 0.12, 0.12, sh, x + Math.cos(a) * d, top(d) + sh / 2, z + Math.sin(a) * d, 0, 0, 0, 8); }
      for (i = 0; i < 2 + r * 2.4; i++) { a = rn() * PI * 2; d = rn() * AX * 0.85; px = x + Math.cos(a) * d; pz = z + Math.sin(a) * d; h = top(d) + 0.04; var kind = i % 5;
        if (kind === 0) b.glow(-1).lathe(0xf2c230, [[0.1, 0], [0.03, 0.05], [0.03, 0.17], [0.13, 0.23], [0.15, 0.42]], px, h, pz, 8, (rn() - 0.5), 0, (rn() - 0.5));
        else if (kind === 1) { b.glow(-1).cyl(0xf2c230, 0.17, 0.15, 0.1, px, h + 0.06, pz, (rn() - 0.5) * 0.8, 0, (rn() - 0.5) * 0.8, 10); for (var q = 0; q < 5; q++) b.cone(0xf2c230, 0.035, 0.1, px + Math.cos(q * 1.257) * 0.15, h + 0.15, pz + Math.sin(q * 1.257) * 0.15, 0, 0, 0, 4); b.glow(0.85).sph(0xe0245e, 0.035, px, h + 0.08, pz + 0.16).glow(-1); }
        else if (kind === 2) { b.glow(0.5); for (q = 0; q < 9; q++) b.sph(0xfaf6ee, 0.045, px + Math.cos(q * 0.5) * (0.1 + q * 0.035), h + 0.03, pz + Math.sin(q * 0.5) * (0.1 + q * 0.035)); b.glow(-1); }
        else b.glow(0.85).add(new T.OctahedronGeometry(0.11 + rn() * 0.06, 0), [0xe0245e, 0x2ecc71, 0x3498db, 0x9b59b6][i % 4], px, h + 0.1, pz, rn(), rn() * 3, rn()).glow(-1); }
      b.glow(0); }
    function chest(b, x, y, z, ry, open) { b.push(x, y, z, ry).box(WOOD, 1.0, 0.55, 0.65, 0, 0.28, 0).box(GOLD, 1.04, 0.06, 0.69, 0, 0.5, 0).box(GOLD, 0.1, 0.56, 0.67, -0.35, 0.28, 0).box(GOLD, 0.1, 0.56, 0.67, 0.35, 0.28, 0).box(GOLD, 0.14, 0.16, 0.04, 0, 0.42, 0.34);
      if (open) { b.glow(0.8).box(0xffd84a, 0.9, 0.16, 0.56, 0, 0.6, 0).sph(0xe0245e, 0.08, 0.2, 0.72, 0.1).sph(0x3498db, 0.07, -0.25, 0.71, -0.1).sph(0xf4f4f4, 0.05, 0, 0.72, 0.18).glow(0); b.push(0, 0.55, -0.32, 0, 1, -1.1).add(new T.CylinderGeometry(0.33, 0.33, 1.0, 10, 1, false, 0, PI), WOOD, 0, 0, 0.32, 0, 0, PI / 2).pop(); }
      else b.add(new T.CylinderGeometry(0.33, 0.33, 1.0, 10, 1, false, 0, PI), WOOD, 0, 0.55, 0, 0, 0, PI / 2); b.pop(); }
    function barrel(b, x, y, z) { b.lathe(0x7a5a3a, [[0.3, 0], [0.38, 0.4], [0.38, 0.6], [0.3, 1.0], [0, 1.0]], x, y, z, 12).torus(IRON, 0.36, 0.025, x, y + 0.25, z, PI / 2, 0, 0).torus(IRON, 0.36, 0.025, x, y + 0.75, z, PI / 2, 0, 0); }
    function lantern(b, list, x, y, z) { b.box(IRON, 0.24, 0.05, 0.24, x, y + 0.2, z).box(IRON, 0.24, 0.05, 0.24, x, y - 0.2, z).glow(1).box(0xffc864, 0.17, 0.34, 0.17, x, y, z).glow(0).torus(IRON, 0.07, 0.012, x, y + 0.29, z, 0, 0, 0); list.push(b.pt(x, y, z)); }
    /* a full-rigged ship, bow to +z, keel at y = 0. o: hull, trim, sail, torn, flag */
    function ship(b, o) { var hc = o.hull, tc = o.trim, i, muzzles = [], lamps = [];
      b.dome(function (x, y) { return y < 1.2 ? K.shade(hc, 0.7) : y > 3.0 ? tc : hc; }, 1, 0, 3.6, 0, 0.5, PI, 0, 0, 4.3, 4.4, 15.5);
      b.box(K.shade(WOOD, 1.2), 7.9, 0.25, 27, 0, 3.6, 0); [-1, 1].forEach(function (s) { b.box(hc, 0.3, 1.0, 21, s * 4.0, 4.2, 0).box(tc, 0.36, 0.12, 21, s * 4.0, 4.75, 0); for (var k = 0; k < 6; k++) { b.box(0x0c0a08, 0.1, 0.7, 0.9, s * 4.12, 2.9, -8.5 + k * 3.2).cyl(IRON, 0.2, 0.24, 1.5, s * 4.6, 2.9, -8.5 + k * 3.2, 0, 0, PI / 2, 10); muzzles.push([s * 5.4, 2.9, -8.5 + k * 3.2, s]); } });
      /* the stern castle with its lit windows and lanterns */
      b.box(hc, 7.6, 3.4, 6.4, 0, 5.4, -11.6).box(tc, 7.9, 0.2, 6.7, 0, 7.15, -11.6).box(hc, 6.2, 1.6, 3.4, 0, 8.0, -12.8).box(tc, 6.5, 0.18, 3.7, 0, 8.85, -12.8);
      b.glow(0.9); for (i = 0; i < 5; i++) { b.box(0xffc864, 0.8, 0.9, 0.08, -2.6 + i * 1.3, 5.6, -14.83); if (i < 3) [-1, 1].forEach(function (s) { b.box(0xffc864, 0.08, 0.8, 0.9, s * 3.82, 5.6, -13.4 + i * 1.6); }); } b.glow(0);
      for (i = 0; i < 9; i++) b.box(tc, 0.1, 0.8, 0.1, -3.4 + i * 0.85, 7.6, -8.5); b.box(tc, 7.2, 0.1, 0.14, 0, 8.0, -8.5);
      [-2.6, 0, 2.6].forEach(function (x) { b.cyl(IRON, 0.04, 0.04, 1.0, x, 9.4, -14.4); lantern(b, lamps, x, 10.1, -14.4); });
      /* the forecastle, the bowsprit and the figurehead */
      b.box(hc, 6.0, 1.5, 5.4, 0, 4.4, 10.6).box(tc, 6.3, 0.16, 5.7, 0, 5.2, 10.6).cyl(WOOD, 0.2, 0.3, 12, 0, 6.8, 18.6, PI / 2 - 0.33, 0, 0, 8).sph(tc, 0.5, 0, 4.6, 15.2, 1, 1.6, 1.4);
      /* masts, yards, sails */
      [[-5.5, 23], [2.2, 27], [9.4, 21]].forEach(function (m, mi) { var z = m[0], h = m[1];
        b.cyl(WOOD, 0.24, 0.42, h, 0, 3.6 + h / 2, z, 0, 0, 0, 10).cyl(WOOD, 0.9, 0.7, 0.3, 0, 3.6 + h * 0.62, z, 0, 0, 0, 10);
        [0.34, 0.62, 0.9].forEach(function (f, yi) { var w = 12.5 - yi * 2.6 - (mi === 1 ? 0 : 1.6), y = 3.6 + h * f; b.cyl(WOOD, 0.13, 0.13, w, 0, y, z + 0.4, 0, 0, PI / 2, 8);
          if (yi < 2) { var sh = h * 0.26, sw = w * 0.92; if (o.torn) { for (var k = 0; k < 4; k++) { var th = sh * (0.5 + ((k * 7 + mi * 3 + yi) % 5) * 0.12); b.box(K.shade(o.sail, 0.8 + (k % 2) * 0.25), sw / 4 - 0.25, th, 0.06, -sw / 2 + sw / 8 + k * sw / 4, y + (yi ? 0 : 0) + h * 0.28 - th / 2 - 0.2, z + 0.6 + (k % 2) * 0.3, 0.12, 0, (k - 1.5) * 0.03); } }
            else b.add(new T.SphereGeometry(1, 10, 6, PI / 2 - 0.7, 1.4, PI / 2 - 0.5, 1.0), o.sail, 0, y + h * 0.28 - sh / 2 - 0.2, z - 1.4, 0, 0, 0, sw / 1.29, sh / 0.96, 3.2); } });
        [-1, 1].forEach(function (s) { for (var k = 0; k < 3; k++) b.tube(0x1c1612, [[s * 4.0, 4.8, z - 1.2 + k * 1.2], [s * 0.3, 3.6 + h * 0.62, z]], 0.035, 0.035, 2, 4); });
        if (mi === 1) { b.cyl(WOOD, 0.05, 0.05, 2.4, 0, 3.6 + h + 1.2, z).box(o.flag || 0x111111, 2.2, 1.3, 0.04, 1.15, 3.6 + h + 1.7, z); if (o.skull) b.glow(0.5).sph(0xf4ecd8, 0.3, 1.15, 3.6 + h + 1.8, z + 0.04, 1, 1, 0.2).box(0xf4ecd8, 0.9, 0.08, 0.02, 1.15, 3.6 + h + 1.4, z + 0.04, 0, 0, 0.5).box(0xf4ecd8, 0.9, 0.08, 0.02, 1.15, 3.6 + h + 1.4, z + 0.04, 0, 0, -0.5).glow(0); } });
      /* deck clutter: the wheel, hatches, barrels, a boat */
      b.torus(WOOD, 0.6, 0.05, 0, 8.0, -10.2, 0, 0, 0).cyl(WOOD, 0.08, 0.08, 0.9, 0, 7.6, -10.3); for (i = 0; i < 8; i++) b.box(WOOD, 0.05, 1.5, 0.05, 0, 8.0, -10.2, 0, 0, i * PI / 8);
      b.box(DARK, 2.4, 0.3, 2.4, 0, 3.9, -1.5).box(DARK, 2.0, 0.3, 2.0, 0, 3.9, 6); barrel(b, 2.6, 3.72, 4); barrel(b, -2.8, 3.72, -3); barrel(b, -2.2, 3.72, -3.6);
      if (o.torn) { var rn = K.rnd(9); for (i = 0; i < 40; i++) { var s2 = rn() < 0.5 ? -1 : 1, zz = (rn() - 0.5) * 26, yy = 0.5 + rn() * 3; b.sph(K.mix(0x4a7a5a, 0x8a9a6a, rn()), 0.25 + rn() * 0.4, s2 * 4.25 * Math.sqrt(Math.max(0, 1 - Math.pow(zz / 15.5, 2))) * Math.sqrt(Math.max(0.1, 1 - Math.pow((3.6 - yy) / 4.4, 2))), yy, zz, 1, 0.6, 1, 7); } for (i = 0; i < 14; i++) { var s3 = i % 2 ? -1 : 1, z3 = -12 + i * 1.8; b.tube(0x3f6a4a, [[s3 * 4.1, 4.6, z3], [s3 * 4.3, 3.4, z3 + 0.2], [s3 * 4.2, 2.0 - rn() * 1.5, z3]], 0.08, 0.02, 6, 4); } }
      return { muzzles: muzzles, lamps: lamps }; }

    return { skeleton: skeleton, sword: sword, gold: gold, chest: chest, barrel: barrel, lantern: lantern, ship: ship, BONE: BONE, WOOD: WOOD, DARK: DARK, GOLD: GOLD, IRON: IRON };
  };
})(window);
