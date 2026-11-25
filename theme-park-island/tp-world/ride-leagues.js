/* 20,000 Leagues Under the Sea (Tokyo DisneySea, Mysterious Island) — rebuilt to the standard of "it's a small
 * world" (2026-11-24). You ride a two-seat exploration pod with a round window and a searchlight that is yours to
 * turn (W A S D, or drag): the sea is dark, and what the light finds wakes up.
 *   the dive through the bubbles → the kelp forest and the reef (turtles, clams that open, shoals) → the graveyard
 *   of ships and what they carried → the giant squid, arms across the window, driven off with the electric charge →
 *   power lost: the long fall into the abyss among jellyfish and anglerfish → the lost city and the shy, round-eyed
 *   people who live there → they push the pod home.
 * Our own shapes and our own lines. Needs ride-kit.js, ride-show.js, ride-props.js. */
(function (root) {
  'use strict';
  var K = root.TPRideKit; if (!K || !K.look || !K.props) return;
  K.ready(function (API) {
    var T = API.THREE, PI = Math.PI, sm = K.sm, tr = K.tr, NEMO = ['尼摩船长', 'Captain Nemo', { pitch: 0.8, rate: 0.9 }];
    var lx = 0, ly = 0, found = 0, total = 0;
    var A = K.stage(API, { id: 'leagues', x: 190, z: 585, oy: 3200, gap: 1400, name: tr('海底两万里（20,000 Leagues Under the Sea）', '20,000 Leagues Under the Sea'), icon: '🐙', fov: 62,
      quest: tr('坐潜水艇下到海底两万里', 'Dive 20,000 leagues under the sea'), tip: tr('神秘岛的潜艇码头', 'The submarine dock on Mysterious Island'), eye: 1.2,
      hud: function (b) { return b + ' · 🔦 ' + found + '/' + total; },
      steer: function (dx, dy) { lx = Math.max(-1, Math.min(1, lx + dx * 0.1)); ly = Math.max(-0.75, Math.min(0.75, ly + dy * 0.1)); } });
    var L = A.L, once = A.once, st = A.st, pose = A.pose;
    A.run(function () {
    var P = K.props(T), chest = P.chest, gold = P.gold, ship = P.ship, skeleton = P.skeleton, IRON = P.IRON, GOLD = P.GOLD, tmp = new T.Vector3(), tmp2 = new T.Vector3();
    function sky(g, col) { var m = new T.Mesh(new T.SphereGeometry(1200, 16, 12), new T.MeshBasicMaterial({ color: col, side: T.BackSide, fog: false, depthWrite: false })); m.renderOrder = -10; g.add(m); return m; }
    var seaL = K.look({ tint: [0.55, 0.85, 1.0], fog: 0x052a40, near: 6, far: 95, amb: 0.3, rim: 0.2, caus: 0.5 });
    var sea = A.scene('sea', 0), seaSky = sky(sea, 0x052a40);
    var path = K.path([[0, 2, 16], [0, 0, 0], [0, -8, -34], [6, -15, -80], [-6, -19, -130], [-8, -22, -185], [4, -24, -235], [10, -26, -285], [2, -30, -330], [-4, -62, -375], [-2, -100, -420], [4, -112, -470], [-4, -113, -520], [2, -112, -570], [0, -90, -620], [0, -30, -670], [0, 2, -705]]);
    var NP = 1400, PT = path.getSpacedPoints(NP), up = new T.Vector3(0, 1, 0);
    function idx(z) { var lo = 0, hi = NP; while (lo < hi) { var m = (lo + hi) >> 1; if (PT[m].z > z) lo = m + 1; else hi = m; } return Math.min(NP, lo); }
    function at(z) { var i = idx(z), p = PT[i], t = new T.Vector3().subVectors(PT[Math.min(NP, i + 1)], PT[Math.max(0, i - 1)]).normalize(), s = new T.Vector3().crossVectors(t, up).normalize(); return { p: p, t: t, s: s }; }
    function floorY(z) { return at(z).p.y - (z < -335 && z > -440 ? 30 : 4.2); }
    function spot(z, side, off, dy) { var a = at(z); return [a.p.x + a.s.x * side * off, floorY(z) + (dy || 0), a.p.z + a.s.z * side * off]; }

    /* ---------------------------------------------------------------- the sea bed, in lengths */
    var rnd = K.rnd(5), CC = [0xff6a8a, 0xffa23a, 0xc86aff, 0x4ad8c8, 0xffe06a, 0xff4a4a];
    function coral(b, x, y, z, col, kind, r) { var k, a, h;
      if (kind === 0) { for (k = 0; k < 5; k++) { a = r() * PI * 2; h = 1 + r() * 1.8; b.glow(0.22).tube(col, [[x, y, z], [x + Math.cos(a) * 0.4, y + h * 0.5, z + Math.sin(a) * 0.4], [x + Math.cos(a) * 0.9, y + h, z + Math.sin(a) * 0.9]], 0.15, 0.05, 6, 5).glow(0.7).sph(K.mix(col, 0xffffff, 0.5), 0.1, x + Math.cos(a) * 0.9, y + h + 0.05, z + Math.sin(a) * 0.9).glow(0); } }
      else if (kind === 1) b.glow(0.18).sph(function (px, py, pz) { return Math.sin(px * 9) * Math.sin(pz * 9 + py * 5) > 0 ? col : K.shade(col, 0.72); }, 0.8 + r() * 0.7, x, y + 0.3, z, 1.2, 0.8, 1.2, 16).glow(0);
      else if (kind === 2) { for (k = 0; k < 4; k++) b.glow(0.22).add(new T.CylinderGeometry(0.9 + k * 0.28, 0.1, 0.9, 12, 1, true), K.shade(col, 0.8 + k * 0.1), x + (r() - 0.5), y + 0.3 + k * 0.26, z + (r() - 0.5), 0, 0, (r() - 0.5) * 0.5); b.glow(0); }
      else { b.cyl(0x8a6a5a, 0.3, 0.36, 0.5, x, y + 0.2, z); b.glow(0.5); for (k = 0; k < 10; k++) { a = k / 10 * PI * 2; b.tube(col, [[x, y + 0.4, z], [x + Math.cos(a) * 0.3, y + 0.85, z + Math.sin(a) * 0.3], [x + Math.cos(a) * 0.6, y + 1.05, z + Math.sin(a) * 0.6]], 0.05, 0.02, 5, 4); } b.glow(0); } }
    for (var c0 = 20; c0 > -720; c0 -= 60) (function (z0) {
      var m = seaL.mesh(sea, function (b) {
        for (var z = z0; z > z0 - 60; z -= 6) { var a = at(z), fy = floorY(z), abyss = z < -335 && z > -440, city = z <= -440 && z > -590, col = z < -330 ? 0x3a4a5a : 0xb8a878;
          for (var k = -3; k <= 3; k++) { var s = 8 + rnd() * 5; b.rock(K.mix(col, 0x7a8a7a, rnd() * 0.4), s, a.p.x + k * 11 + (rnd() - 0.5) * 5, fy - s * 0.56, z + (rnd() - 0.5) * 5, 1 + Math.floor(rnd() * 900), 1.5, 0.45, 1.5, 2, 0.14); }
          /* walls: reef to either side; a chasm's cliffs in the abyss */
          [-1, 1].forEach(function (sd) { var off = (abyss ? 15 : city ? 46 : 24) + rnd() * 10, h = abyss ? 34 : 6 + rnd() * 9, sz = abyss ? 12 : 5 + rnd() * 5; b.rock(K.shade(abyss ? 0x1c2a3a : 0x2f5560, 0.8 + rnd() * 0.4), sz, a.p.x + sd * (off + sz), fy + h * 0.4 + (abyss ? 12 : 0), z, 1 + Math.floor(rnd() * 900), 1, h / sz * 0.8, 1, 2, 0.26); });
          if (!abyss && z < -30 && z > -330) for (k = 0; k < 4; k++) { var cs = rnd() < 0.5 ? -1 : 1, q = [a.p.x + cs * (4.5 + rnd() * 13), fy - 0.1, z + rnd() * 6]; coral(b, q[0], q[1], q[2], CC[Math.floor(rnd() * 6)], Math.floor(rnd() * 4), rnd); }
        }
      }); m.geometry.computeBoundingSphere(); m.frustumCulled = true;
    })(c0);
    /* the surface seen from below, the dock's piles, the first shafts of light */
    var surf = K.water(sea, 300, 300, { a: 0x1a7aa8, b: 0xbfeeff, s: 0xffffff, fog: 0x1a6a9a, near: 40, far: 200, op: 0.9 }, 0, 4.5, -10); surf.rotation.x = PI / 2;
    seaL.mesh(sea, function (b) { for (var i = 0; i < 10; i++) { var s = i % 2 ? 1 : -1; b.cyl(0x5a4a3a, 0.4, 0.45, 26, s * 5.5, -8, 12 - Math.floor(i / 2) * 5, 0, 0, 0, 10).torus(IRON, 0.46, 0.06, s * 5.5, -1 - i, 12 - Math.floor(i / 2) * 5, PI / 2, 0, 0); for (var k = 0; k < 6; k++) b.sph(0x4a7a5a, 0.3, s * 5.5 + Math.cos(k * 2) * 0.4, -3 - k * 2.4, 12 - Math.floor(i / 2) * 5 + Math.sin(k * 2) * 0.4, 1, 0.6, 1, 7); }
      b.box(0x4a3e34, 14, 0.6, 30, 0, 5.2, 6); });
    var shafts = []; for (var si = 0; si < 10; si++) { var sh = K.shaft(sea, 0x9fe4ff, 0.6, 6, 70, (si % 3 - 1) * 15 + si, -28, -20 - si * 18, 0.08); sh.rotation.z = 0.22; shafts.push(sh); }
    var bubbles = K.motes(sea, { n: 200, box: [20, 20, 30], col: 0xd8f6ff, size: 0.2, vel: [0, 2.2, 0], drift: 0.5, op: 0.6, seed: 8 }), snow = K.motes(sea, { n: 300, box: [36, 24, 44], col: 0x9fd0e0, size: 0.09, vel: [0.1, -0.12, 0.6], drift: 0.2, op: 0.55, seed: 9 }), plank = K.motes(sea, { n: 260, box: [40, 30, 50], col: 0x6affd8, size: 0.13, vel: [0, 0.2, 0.4], drift: 0.5, op: 0.0, seed: 10 });

    /* ---------------------------------------------------------------- kelp, shoals, turtles, clams */
    var kelp = []; for (var ki = 0; ki < 22; ki++) (function (i) { var q = spot(-36 - i * 5.2, i % 2 ? 1 : -1, 4.2 + (i % 5) * 2.2, 0), g = new T.Group(); g.position.set(q[0], q[1], q[2]); sea.add(g); kelp.push(K.chain(seaL, g, 7, 1.6, function (b, n) { b.box(i % 3 ? 0x2f8f55 : 0x4aa86a, 0.55, 1.7, 0.05, 0, 0.85, 0, 0, n * 0.6, 0).glow(0.3).sph(0x9ad86a, 0.1, 0.22, 1.1, 0).glow(0); })); })(ki);
    var schools = []; [[0xffc23a, -60, 5, 3], [0x6ad8ff, -105, -5, 2], [0xff7a5a, -150, 6, 4], [0xd8e8f0, -215, -4, 5], [0xb48aff, -270, 5, 3]].forEach(function (q, i) { var g = new T.Group(); sea.add(g); seaL.mesh(g, function (b) { var r = K.rnd(30 + i); b.glow(0.3); for (var k = 0; k < 36; k++) { var a = r() * 0.9, x = Math.cos(a) * 8 + (r() - 0.5) * 2.4, z = Math.sin(a) * 8, y = (r() - 0.5) * 2.6; b.push(x, y, z, -a, 0.8 + r() * 0.6).sph(q[0], 0.2, 0, 0, 0, 0.35, 0.62, 1.3, 8).cone(K.shade(q[0], 0.8), 0.13, 0.22, 0, 0, -0.32, PI / 2, 0, 0, 4).glow(0.9).sph(0x111111, 0.026, 0.06, 0.03, 0.16).sph(0x111111, 0.026, -0.06, 0.03, 0.16).glow(0.3).pop(); } }); var a2 = at(q[1]); schools.push({ g: g, c: [a2.p.x + q[2], a2.p.y + q[3] - 2, q[1]], sp: 0.3 + i * 0.06, ph: i * 1.6, scat: 0 }); });
    var turtles = []; [[-72, -1, 5, 0], [-118, 1, 6, 1.5]].forEach(function (q, i) { var a = at(q[0]), g = new T.Group(); sea.add(g); seaL.mesh(g, function (b) { b.dome(function (x, y, z) { return (Math.floor(x * 3 + 9) + Math.floor(z * 3 + 9)) % 2 ? 0x4a7a4a : 0x6a9a5a; }, 0.9, 0, 0, 0, 0.5, 0, 0, 0, 1, 0.55, 1.25).sph(0xc8c090, 0.86, 0, -0.02, 0, 1, 0.22, 1.22).sph(0x7aa86a, 0.3, 0, 0.08, 1.3, 0.8, 0.75, 1.1).glow(0.8).sph(0x111111, 0.05, 0.16, 0.16, 1.48).sph(0x111111, 0.05, -0.16, 0.16, 1.48).glow(0).cone(0x7aa86a, 0.12, 0.4, 0, 0, -1.2, -PI / 2, 0, 0, 5); });
      var fl = [-1, 1].map(function (s) { var f = new T.Group(); f.position.set(s * 0.8, 0, 0.6); g.add(f); seaL.mesh(f, function (b) { b.sph(0x7aa86a, 0.5, s * 0.5, 0, 0, 1.3, 0.14, 0.5); }); return f; }); turtles.push({ g: g, fl: fl, c: [a.p.x, a.p.y + 1.5, q[0]], side: q[1], r: q[2], ph: q[3] }); });
    var clams = []; [[-90, 1, 5.5], [-140, -1, 5], [-250, 1, 6]].forEach(function (q) { var p = spot(q[0], q[1], q[2], 0.3), g = new T.Group(); g.position.set(p[0], p[1], p[2]); g.rotation.y = q[1] > 0 ? -1.2 : 1.2; sea.add(g); seaL.mesh(g, function (b) { b.dome(0xd8c8e0, 1.3, 0, 0.45, 0, 0.5, PI, 0, 0, 1, 0.5, 1); for (var k = 0; k < 9; k++) b.box(0xb8a8c8, 0.06, 0.1, 1.2, -1 + k * 0.25, 0.1, 0, 0, 0, 0); }); var lid = new T.Group(); lid.position.set(0, 0.45, -1.2); g.add(lid); seaL.mesh(lid, function (b) { b.dome(0xe8d8f0, 1.3, 0, 0, 1.2, 0.5, 0, 0, 0, 1, 0.5, 1); }); var pearl = seaL.mesh(g, function (b) { b.glow(0.95).sph(0xffffff, 0.36, 0, 0.6, 0, 1, 1, 1, 14); }); clams.push({ g: g, lid: lid, pearl: pearl, halo: K.halo(g, 0xffffff, 3, 0, 0.6, 0, 0), open: 0 }); });

    /* ---------------------------------------------------------------- the graveyard of ships */
    seaL.mesh(sea, function (b) { var q, i;
      q = spot(-176, -1, 17, -1.2); b.push(q[0], q[1], q[2], 0.5, 1, 0, 0.5); ship(b, { hull: 0x2a3a3a, trim: 0x3a4a44, sail: 0x5a6a5a, torn: true, flag: 0x1a2420 }); b.pop();
      q = spot(-236, 1, 18, -1.8); b.push(q[0], q[1], q[2], -0.8, 1, 0, -0.2); ship(b, { hull: 0x33342c, trim: 0x4a4a38, sail: 0x6a6a52, torn: true, flag: 0x1a1a14 }); b.pop();
      q = spot(-300, -1, 20, -2.4); b.push(q[0], q[1], q[2], 0.9, 1, 0, 0.12); ship(b, { hull: 0x2c2a30, trim: 0x44404a, sail: 0x5a5a66, torn: true, flag: 0x18161c }); b.pop();
      /* the ribs of the oldest wreck, which the pod goes through; an anchor; cannon and shot */
      for (i = 0; i < 10; i++) { var a = at(-200 - i * 2.4), fy = floorY(-200 - i * 2.4); [-1, 1].forEach(function (s) { b.tube(0x4a3e30, [[a.p.x + s * 0.5, fy + 0.3, a.p.z], [a.p.x + s * 4.4, fy + 1.4, a.p.z], [a.p.x + s * 5.2, fy + 4.8, a.p.z], [a.p.x + s * 4.2, fy + 7.6, a.p.z]], 0.24, 0.12, 10, 6); }); }
      q = spot(-212, 0, 0, 0.3); b.box(0x4a3e30, 0.6, 0.5, 25, q[0], q[1], q[2]);
      q = spot(-192, 1, 5, 1.2); b.push(q[0], q[1], q[2], 0.5, 1.7, 0, 0.5).cyl(IRON, 0.08, 0.08, 2.4, 0, 0, 0).torus(IRON, 0.9, 0.1, 0, -1.2, 0, 0, 0, 0, PI).cone(IRON, 0.22, 0.4, -0.9, -1.1, 0, 0, 0, 0.6, 4).cone(IRON, 0.22, 0.4, 0.9, -1.1, 0, 0, 0, -0.6, 4).torus(IRON, 0.2, 0.05, 0, 1.3, 0).box(IRON, 1.2, 0.1, 0.1, 0, 0.9, 0).pop();
      [[-222, -1, 4.6], [-262, 1, 5]].forEach(function (c, k) { q = spot(c[0], c[1], c[2], 0.5); b.cyl(0x3a4a48, 0.26, 0.34, 2.2, q[0], q[1], q[2], PI / 2 - 0.2, k * 2, 0, 10).box(0x4a3e30, 0.9, 0.4, 1.4, q[0], q[1] - 0.3, q[2], 0, k * 2, 0); for (var n = 0; n < 4; n++) b.sph(0x2a3232, 0.2, q[0] + 0.9 + (n % 2) * 0.4, q[1] - 0.3 + Math.floor(n / 2) * 0.3, q[2] + 0.8); });
      for (i = 0; i < 9; i++) { q = spot(-168 - i * 14, i % 2 ? 1 : -1, 4 + (i % 3) * 2.5, 0.2); b.lathe(0xb8734a, [[0.12, 0], [0.34, 0.3], [0.3, 0.7], [0.1, 0.95], [0.16, 1.1]], q[0], q[1], q[2], 10, (i % 3 - 1) * 0.9, 0, (i % 2 - 0.5) * 1.6); } });
    var helmS = (function () { var q = spot(-236, 1, 12.6, 3.0), s = skeleton(seaL, sea, q[0], q[1], q[2], -2.2, { hat: 'tricorn', vest: 0x2a3a4a, boots: 0x15181c, h: 2.1 }); s.userData.armL.rotation.x = s.userData.armR.rotation.x = -1.3; s.rotation.z = 0.2; return s; })();
    /* what the searchlight is for: things that only show themselves when the light is on them */
    var hid = [];
    function treasure(z, side, off, dy, draw, col, name) { var q = spot(z, side, off, dy), g = new T.Group(); g.position.set(q[0], q[1], q[2]); sea.add(g); seaL.mesh(g, draw); var h = K.halo(g, col, 5, 0, 0.8, 0, 0); hid.push({ g: g, h: h, got: false, name: name, y: q[1] }); return g; }
    treasure(-64, 1, 5.4, 0.2, function (b) { chest(b, 0, 0, 0, -1.0, true); }, 0xffd040, ['一箱金币', 'a chest of gold coins']);
    treasure(-128, -1, 5.8, 0.2, function (b) { b.glow(0.4).lathe(GOLD, [[0.5, 0], [0.62, 0.9], [0.4, 1.7], [0.3, 2.0], [0.42, 2.3], [0.36, 2.9], [0, 3.0]], 0, 0, 0, 10).glow(0.9).sph(0x2ecc71, 0.1, -0.14, 2.55, 0.34).sph(0x2ecc71, 0.1, 0.14, 2.55, 0.34).glow(0); }, 0xffd040, ['一尊黄金神像', 'a golden idol']);
    treasure(-188, -1, 5.2, 0.1, function (b) { gold(b, 0, 0, 0, 1.2, 4); }, 0xffd040, ['一堆金币和宝石', 'a heap of coins and gems']);
    treasure(-214, 1, 3.2, 0.2, function (b) { b.glow(0.5).cyl(GOLD, 0.34, 0.3, 0.2, 0, 0.3, 0, 0, 0, 0, 12); for (var i = 0; i < 7; i++) b.cone(GOLD, 0.06, 0.24, Math.cos(i * 0.9) * 0.3, 0.5, Math.sin(i * 0.9) * 0.3, 0, 0, 0, 5); b.glow(0.95).sph(0xe0245e, 0.07, 0, 0.32, 0.33).sph(0x3498db, 0.06, 0.3, 0.32, 0.12).glow(0).rock(0x6a7a6a, 0.5, 0, -0.1, 0, 3, 1.2, 0.5, 1.2); }, 0xffe080, ['一顶王冠', 'a crown']);
    treasure(-244, -1, 5.6, 0.2, function (b) { chest(b, 0, 0, 0, 0.9, true); chest(b, 1.2, 0, -0.5, 0.2, false); }, 0xffd040, ['船长的宝箱', "the captain's sea-chests"]);
    treasure(-278, 1, 5.4, 0.3, function (b) { b.glow(0.3).torus(0xb8c0c8, 0.9, 0.09, 0, 0.9, 0, 0, 0.4, 0); for (var i = 0; i < 8; i++) b.box(0x8a6a4a, 0.07, 2.2, 0.07, 0, 0.9, 0, 0, 0.4, i * PI / 8); b.glow(0.6).cyl(GOLD, 0.16, 0.16, 0.16, 0, 0.9, 0, PI / 2, 0.4, 0).glow(0); }, 0xbfe0ff, ['一只舵轮', "a ship's wheel"]);
    treasure(-452, -1, 6, 0.4, function (b) { b.glow(0.6); for (var i = 0; i < 6; i++) b.cyl([0x7fe3ff, 0xc8a0ff, 0x8affc0][i % 3], 0.08, 0.22, 1 + i * 0.3, (i - 2.5) * 0.3, 0.6 + i * 0.12, (i % 2) * 0.3, (i - 2.5) * 0.14, 0, (i - 2.5) * 0.2, 6); b.glow(0); }, 0x9fe4ff, ['会发光的深海水晶', 'glowing crystals of the deep']);
    treasure(-506, 1, 6.4, 0.4, function (b) { b.glow(0.4).cyl(0xd8d0c0, 0.5, 0.6, 0.4, 0, 0.2, 0, 0, 0, 0, 12).lathe(0xd8d0c0, [[0.28, 0], [0.2, 0.5], [0.3, 1.2], [0.24, 1.6], [0.3, 1.9], [0, 2.2]], 0, 0.4, 0, 10).glow(0.95).sph(0x8affe0, 0.2, 0, 2.9, 0).glow(0).cyl(0xd8d0c0, 0.05, 0.05, 0.9, 0.34, 2.3, 0, 0, 0, -0.5); }, 0x8affe0, ['古城的石像', 'a statue from the lost city']);
    treasure(-548, -1, 6, 0.4, function (b) { b.glow(0.5).lathe(0x4ad8c8, [[0.3, 0], [0.5, 0.4], [0.5, 0.9], [0.2, 1.3], [0.26, 1.5]], 0, 0, 0, 12).glow(0.9).torus(GOLD, 0.5, 0.04, 0, 0.6, 0, PI / 2, 0, 0).glow(0); }, 0x8affe0, ['海底人的宝瓶', "a sea-people's urn"]);
    total = hid.length;

    /* ---------------------------------------------------------------- the giant squid */
    var sqA = at(-312), squid = new T.Group(); sea.add(squid); var SQ = 0x9a2a2a;
    seaL.mesh(squid, function (b) { b.lathe(function (x, y, z) { return K.mix(SQ, 0xd86a5a, Math.max(0, Math.sin(x * 1.6) * Math.sin(y * 1.3) * Math.sin(z * 1.4))); }, [[0, 0], [1.6, 1.5], [2.6, 5], [2.5, 9], [1.6, 13], [0, 15.5]], 0, 0, 0, 16, -PI / 2, 0, 0).box(K.shade(SQ, 0.85), 8, 0.2, 4.5, 0, 0, -12.5, 0, 0, 0);
      [-1, 1].forEach(function (s) { b.glow(0.9).sph(0xffe14a, 1.15, s * 2.3, 0.4, -3.4, 0.6, 1, 1, 16).glow(0.1).sph(0x100808, 0.5, s * 2.9, 0.4, -3.3, 0.5, 1.4, 1.1).glow(0); });
      b.cone(0x2a1010, 0.9, 1.4, 0, 0, 0.3, PI / 2, 0, 0, 8); });
    var sqArms = []; for (var ai = 0; ai < 8; ai++) (function (i) { var an = i / 8 * PI * 2, g = new T.Group(); g.position.set(Math.cos(an) * 1.5, Math.sin(an) * 1.5, 0); g.rotation.set(PI / 2 - Math.sin(an) * 0.35, 0, -Math.cos(an) * 0.35); squid.add(g);
      sqArms.push({ i: i, js: K.chain(seaL, g, 9, 2.5, function (b, n, k) { var r0 = 0.9 - k * 0.72, r1 = 0.9 - Math.min(1, k + 0.11) * 0.72; b.cyl(SQ, r1, r0, 2.65, 0, 1.25, 0, 0, 0, 0, 10).sph(SQ, r0, 0, 0, 0, 1, 1, 1, 10).glow(0.3); for (var c = 0; c < 3; c++) b.cyl(0xf0c8c8, r0 * 0.34, r0 * 0.4, 0.1, 0, 0.5 + c * 0.85, r0 * 0.92, PI / 2, 0, 0, 8); b.glow(0); }) }); })(ai);
    var ink = K.motes(sea, { n: 200, box: [16, 12, 16], col: 0x0a0a14, size: 1.6, vel: [0, 0.3, 0], drift: 1.2, add: false, op: 0.0, seed: 44 });

    /* ---------------------------------------------------------------- the abyss: jellyfish, anglerfish */
    var jellies = []; for (var ji = 0; ji < 18; ji++) (function (i) { var z = -348 - i * 5.5, a = at(z), g = new T.Group(), col = [0xff8ad8, 0x8ad8ff, 0xc8a0ff, 0x8affc8][i % 4], sc = 0.7 + (i % 5) * 0.25; g.position.set(a.p.x + (i % 2 ? 1 : -1) * (3.5 + (i % 4) * 2.2), a.p.y + ((i * 7) % 9) - 3, z); g.scale.setScalar(sc); sea.add(g);
      var bell = seaL.mesh(g, function (b) { b.glow(0.7).dome(col, 1, 0, 0, 0, 0.5, 0, 0, 0, 1, 0.8, 1).glow(0.95).dome(K.mix(col, 0xffffff, 0.6), 0.6, 0, 0.05, 0, 0.5, 0, 0, 0, 1, 0.7, 1).glow(0.8).torus(K.mix(col, 0xffffff, 0.4), 0.98, 0.06, 0, 0, 0, PI / 2, 0, 0); });
      var legs = seaL.mesh(g, function (b) { b.glow(0.6); for (var k = 0; k < 8; k++) { var an = k / 8 * PI * 2, l = 2 + (k % 3) * 0.9; b.tube(K.mix(col, 0xffffff, 0.3), [[Math.cos(an) * 0.7, 0, Math.sin(an) * 0.7], [Math.cos(an) * 0.8, -l * 0.4, Math.sin(an) * 0.8], [Math.cos(an) * 0.6, -l * 0.75, Math.sin(an) * 0.6], [Math.cos(an) * 0.75, -l, Math.sin(an) * 0.75]], 0.05, 0.015, 8, 4); } });
      K.halo(g, col, 4.5, 0, 0, 0, 0.3); jellies.push({ g: g, bell: bell, legs: legs, y: g.position.y, ph: i * 1.3 }); })(ji);
    var anglers = []; [[-392, 1, 4.4], [-418, -1, 4.0]].forEach(function (q, i) { var a = at(q[0]), g = new T.Group(); g.position.set(a.p.x + q[1] * 9, a.p.y + 1, q[0]); sea.add(g);
      seaL.mesh(g, function (b) { b.rock(function (x, y, z) { return K.mix(0x2a2030, 0x4a3a52, Math.max(0, Math.sin(x * 2) * Math.sin(y * 2.3))); }, 1.5, 0, 0, 0, 7 + i, 1, 0.95, 1.25, 2, 0.1);
        [-1, 1].forEach(function (s) { b.glow(0.9).sph(0xd8fff0, 0.2, s * 0.75, 0.55, 1.35).glow(0.2).sph(0x101010, 0.1, s * 0.78, 0.55, 1.5).glow(0).box(0x3a2a42, 0.06, 0.9, 0.9, s * 1.55, 0, -0.4, 0, s * 0.5, 0); });
        b.cone(0x3a2a42, 0.8, 1.4, 0, 0.1, -2.2, -PI / 2, 0, 0, 5).box(0x3a2a42, 0.06, 1.0, 1.0, 0, 1.3, -0.4, 0.4);
        for (var k = 0; k < 9; k++) b.glow(0.4).cone(0xf4f0e0, 0.07, 0.5, -0.8 + k * 0.2, 0.05, 1.6 - Math.abs(k - 4) * 0.08, PI, 0, 0, 4).glow(0);
        b.tube(0x4a3a52, [[0, 1.2, 0.8], [0, 2.3, 1.4], [0, 2.5, 2.5], [0, 1.9, 3.1]], 0.07, 0.03, 10, 5).glow(1).sph(0xaaffe0, 0.2, 0, 1.85, 3.15).glow(0); });
      var jaw = new T.Group(); jaw.position.set(0, -0.3, 0.6); g.add(jaw); seaL.mesh(jaw, function (b) { b.rock(0x2a2030, 1.0, 0, -0.3, 0.5, 9, 1.1, 0.4, 1.2, 1, 0.1); for (var k = 0; k < 8; k++) b.glow(0.4).cone(0xf4f0e0, 0.07, 0.55, -0.7 + k * 0.2, 0.15, 1.3 - Math.abs(k - 3.5) * 0.08, 0, 0, 0, 4).glow(0); });
      K.halo(g, 0xaaffe0, 3.4, 0, 1.85, 3.15, 0.7); anglers.push({ g: g, jaw: jaw, z: q[0], side: q[1], x0: g.position.x, y0: g.position.y }); });

    /* ---------------------------------------------------------------- the lost city */
    var cityA = at(-520), CY = floorY(-520), domes = [];
    seaL.mesh(sea, function (b) { var r = K.rnd(77), STONE = 0x8fb0a8, i;
      function column(x, y, z, h, broken) { b.cyl(STONE, 0.9, 1.0, 0.5, x, y + 0.25, z, 0, 0, 0, 12); for (var k = 0; k < 12; k++) { var a = k / 12 * PI * 2; b.box(K.shade(STONE, 0.86), 0.16, h, 0.16, x + Math.cos(a) * 0.62, y + 0.5 + h / 2, z + Math.sin(a) * 0.62); } b.cyl(K.shade(STONE, 1.08), 0.62, 0.66, h, x, y + 0.5 + h / 2, z, 0, 0, 0, 12); if (!broken) b.cyl(STONE, 1.1, 0.8, 0.5, x, y + 0.75 + h, z, 0, 0, 0, 12).box(STONE, 2.2, 0.3, 2.2, x, y + 1.1 + h, z); else b.rock(STONE, 0.7, x, y + 0.6 + h, z, k, 1, 0.5, 1); }
      /* the great way: columns either side, lintels across, the pod goes down the middle */
      for (i = 0; i < 12; i++) { var z = -456 - i * 10, a = at(z), fy = floorY(z), broken = i % 4 === 3; [-1, 1].forEach(function (s) { column(a.p.x + s * 8.5, fy, z, broken && s > 0 ? 4 + r() * 3 : 10, broken && s > 0); }); if (!broken) b.box(STONE, 19.4, 1.1, 2.2, a.p.x, fy + 12.3, z).box(K.shade(STONE, 0.9), 20, 0.4, 2.6, a.p.x, fy + 13, z); b.glow(0.85).sph(0x8affe0, 0.34, a.p.x - 8.5, fy + 9.6, z + 1.2).sph(0x8affe0, 0.34, a.p.x + 8.5, fy + 9.6, z + 1.2).glow(0); }
      /* paving */
      for (i = 0; i < 26; i++) { var z2 = -448 - i * 5, a2 = at(z2); b.box(function (x) { return Math.floor(x / 2.4) % 2 ? 0x7a9a94 : 0x86a8a0; }, 15, 0.3, 4.8, a2.p.x, floorY(z2) + 0.12, z2); }
      /* houses with domes of glowing mosaic, stairs, towers, to both sides */
      for (i = 0; i < 22; i++) { var s2 = i % 2 ? 1 : -1, z3 = -450 - i * 6 - r() * 3, a3 = at(z3), x = a3.p.x + s2 * (15 + r() * 22), fy3 = floorY(z3), w = 5 + r() * 4, h = 4 + r() * 9, tower = i % 5 === 2, col = [0x4ad8c8, 0x8a8aff, 0xffc86a, 0xff8ab8][i % 4];
        if (tower) { b.cyl(STONE, w * 0.4, w * 0.5, h * 2, x, fy3 + h, z3, 0, 0, 0, 12).glow(0.45).cone(col, w * 0.55, w * 0.9, x, fy3 + h * 2 + w * 0.45, z3, 0, 0, 0, 12).glow(0.9); for (var k = 0; k < 5; k++) b.box(0xfff0b0, 0.5, 0.9, 0.1, x + Math.sin(k * 1.3 + s2) * w * 0.46, fy3 + 3 + k * h * 0.36, z3 + Math.cos(k * 1.3 + s2) * w * 0.46, 0, k * 1.3 + s2, 0); b.glow(0); }
        else { b.box(K.shade(STONE, 0.9 + r() * 0.2), w, h, w, x, fy3 + h / 2, z3).box(STONE, w + 0.6, 0.4, w + 0.6, x, fy3 + h, z3).glow(0.4).dome(function (px, py, pz) { return (Math.floor(Math.atan2(pz - z3, px - x) * 5 + 20) + Math.floor(py * 1.2)) % 2 ? col : K.mix(col, 0xffffff, 0.45); }, w * 0.46, x, fy3 + h + 0.2, z3, 0.5).glow(0.9).sph(0xfff0b0, 0.3, x, fy3 + h + w * 0.46 + 0.4, z3); b.box(0xfff0b0, 0.9, 1.5, 0.1, x - s2 * (w / 2 + 0.03), fy3 + 1.6, z3, 0, PI / 2, 0).box(0xfff0b0, 0.6, 0.8, 0.1, x - s2 * (w / 2 + 0.03), fy3 + h * 0.7, z3 + w * 0.25, 0, PI / 2, 0).glow(0); domes.push([x, fy3 + h + w * 0.3, z3, col, w]); for (k = 0; k < 4; k++) b.box(STONE, 1.6, 0.3, 0.7, x - s2 * (w / 2 + 0.4 + k * 0.7), fy3 + 0.9 - k * 0.25, z3, 0, PI / 2, 0); } }
      /* the heart of the city: a ring of steps and a great lamp of light over it */
      var hz = -560, ha = at(hz), hy = floorY(hz); for (i = 0; i < 4; i++) b.cyl(K.shade(STONE, 1 + i * 0.05), 13 - i * 2.2, 13.4 - i * 2.2, 0.6, ha.p.x + 14, hy + 0.3 + i * 0.6, hz, 0, 0, 0, 24); for (i = 0; i < 8; i++) { var an = i / 8 * PI * 2; column(ha.p.x + 14 + Math.cos(an) * 9, hy + 1.8, hz + Math.sin(an) * 9, 7, false); }
      b.torus(STONE, 9, 0.7, ha.p.x + 14, hy + 10.6, hz, PI / 2, 0, 0, PI * 2, 24).glow(1).sph(0xfff4c2, 2.4, ha.p.x + 14, hy + 7, hz, 1, 1, 1, 18).glow(0);
      /* fallen blocks and sea-fans grown over the stone */
      for (i = 0; i < 40; i++) { var z4 = -446 - r() * 140, a4 = at(z4), x4 = a4.p.x + (r() < 0.5 ? -1 : 1) * (4.5 + r() * 9), fy4 = floorY(z4); if (i % 2) b.box(K.shade(STONE, 0.8), 1 + r(), 0.8 + r(), 1 + r(), x4, fy4 + 0.5, z4, r(), r() * 3, r()); else coral(b, x4, fy4 + 0.1, z4, CC[i % 6], i % 4, r); } });
    domes.forEach(function (q) { K.halo(sea, q[3], q[4] * 2.6, q[0], q[1], q[2], 0.2); }); var heart = K.halo(sea, 0xfff4c2, 34, cityA.p.x + 0, 0, 0, 0.4); (function () { var ha = at(-560); heart.position.set(ha.p.x + 14, floorY(-560) + 7, -560); })();
    /* the people of the city */
    var folk = []; for (var fi = 0; fi < 9; fi++) (function (i) { var z = -470 - i * 11, side = i % 2 ? 1 : -1, a = at(z), col = [0x7fd8c8, 0xffb0c8, 0xffe08a, 0xb8a0ff, 0x8ad8ff][i % 5], g = new T.Group(); g.position.set(a.p.x + side * (5 + (i % 3) * 1.6), a.p.y + ((i * 5) % 4) - 1.5, z); sea.add(g);
      seaL.mesh(g, function (b) { b.glow(0.25).lathe(function (x, y) { return y < 0.2 ? K.mix(col, 0xffffff, 0.55) : col; }, [[0, -1.3], [0.2, -1.0], [0.42, -0.4], [0.5, 0.1], [0.4, 0.5], [0.2, 0.7]], 0, 0, 0, 14).glow(0.25).box(K.shade(col, 0.8), 0.04, 0.5, 0.5, 0, 0.1, -0.5, 0.5, 0, 0).glow(0); });
      var head = new T.Group(); head.position.y = 0.95; g.add(head);
      seaL.mesh(head, function (b) { b.glow(0.25).sph(col, 0.52, 0, 0, 0, 1.08, 0.96, 1, 16).glow(0.3).sph(K.mix(col, 0xffffff, 0.6), 0.36, 0, -0.14, 0.24, 1.1, 0.7, 0.9).glow(0);
        [-1, 1].forEach(function (s) { b.glow(0.6).sph(0xffffff, 0.2, s * 0.22, 0.08, 0.38).glow(0.2).sph(0x0c1820, 0.12, s * 0.22, 0.07, 0.5).glow(1).sph(0xffffff, 0.04, s * 0.22 + 0.05, 0.13, 0.6).glow(0); b.glow(0.6).sph(0xff9ab0, 0.07, s * 0.36, -0.1, 0.36, 1, 0.7, 0.5).glow(0); });
        b.box(0x7a3a4a, 0.14, 0.025, 0.02, 0, -0.2, 0.45).glow(0.4).tube(K.shade(col, 0.8), [[0, 0.46, 0], [0, 0.8, 0.1], [0, 0.95, 0.35]], 0.03, 0.02, 6, 5).glow(1).sph(0xfff4c2, 0.09, 0, 0.95, 0.38).glow(0); });
      var lids = seaL.mesh(head, function (b) { [-1, 1].forEach(function (s) { b.glow(0.25).sph(col, 0.21, s * 0.22, 0.09, 0.385); }); }); lids.scale.y = 0.01;
      var fins = [-1, 1].map(function (s) { var f = new T.Group(); f.position.set(s * 0.5, 0.05, 0); head.add(f); seaL.mesh(f, function (b) { b.glow(0.3).sph(K.mix(col, 0xffffff, 0.3), 0.3, s * 0.26, 0, 0, 1, 0.9, 0.15); }); return f; });
      var arms = [-1, 1].map(function (s) { var f = new T.Group(); f.position.set(s * 0.42, 0.2, 0.1); g.add(f); seaL.mesh(f, function (b) { b.glow(0.25).tube(col, [[0, 0, 0], [s * 0.2, -0.25, 0.2], [s * 0.1, -0.4, 0.45]], 0.07, 0.05, 6, 5).sph(col, 0.08, s * 0.1, -0.4, 0.45).glow(0); }); return f; });
      var tailRoot = new T.Group(); tailRoot.position.y = -1.25; tailRoot.rotation.x = PI; g.add(tailRoot); var tail = K.chain(seaL, tailRoot, 3, 0.3, function (b, n) { b.glow(0.25).cyl(K.shade(col, 0.9), 0.14 - n * 0.04, 0.18 - n * 0.04, 0.34, 0, 0.15, 0, 0, 0, 0, 8); if (n === 2) b.box(K.mix(col, 0xffffff, 0.35), 0.7, 0.4, 0.03, 0, 0.5, 0); b.glow(0); });
      var lamp = K.halo(g, 0xfff4c2, 1.6, 0, 1.9, 0.38, 0.6); folk.push({ g: g, head: head, lids: lids, fins: fins, arms: arms, tail: tail, lamp: lamp, home: g.position.clone(), side: side, ph: i * 1.7, z: z, brave: 0 }); })(fi);

    /* ---------------------------------------------------------------- the pod */
    var podL = K.look({ tint: [1.0, 0.92, 0.78], fog: 0, near: 500, far: 900, amb: 0.5, rim: 0.16 });
    var pod = new T.Group(); A.R.add(pod); A.car = pod; var BRASS = 0xa8823a;
    podL.mesh(pod, function (b) { b.torus(BRASS, 1.5, 0.2, 0, 1.2, -1.25, 0, 0, 0, PI * 2, 40).torus(0x6a5220, 1.76, 0.1, 0, 1.2, -1.2, 0, 0, 0, PI * 2, 40); for (var i = 0; i < 12; i++) b.sph(0xd8b860, 0.07, Math.cos(i * PI / 6) * 1.5, 1.2 + Math.sin(i * PI / 6) * 1.5, -1.08);
      /* the hull round the window */
      for (i = 0; i < 12; i++) { var a = i * PI / 6; b.box(0x3a4048, 1.1, 1.3, 0.3, Math.cos(a) * 2.25, 1.2 + Math.sin(a) * 2.25, -1.1, 0, 0, a + PI / 2); }
      /* the desk: dials, switches, the searchlight's stick */
      b.box(0x30343c, 2.6, 0.12, 0.6, 0, 0.12, -0.92, 0.5, 0, 0).box(BRASS, 2.64, 0.04, 0.05, 0, 0.3, -1.12);
      [-0.85, -0.4, 0.85].forEach(function (x, k) { b.cyl(BRASS, 0.15, 0.15, 0.05, x, 0.2, -0.98, 1.07, 0, 0, 16).cyl(0xe8dcc0, 0.125, 0.125, 0.06, x, 0.205, -0.975, 1.07, 0, 0, 16); for (var n = 0; n < 7; n++) b.box(0x2a1a12, 0.01, 0.012, 0.03, x + Math.cos(n * 0.5 + 0.1) * 0.1, 0.24 + Math.sin(n * 0.5 + 0.1) * 0.05, -0.99 + Math.sin(n * 0.5 + 0.1) * 0.085, 1.07, 0, 0); if (k !== 1) b.box(0xb3202a, 0.012, 0.02, 0.1, x, 0.23, -0.97, 1.07, 0, 0.5 * (k - 1)); });
      [0.05, 0.2, 0.35].forEach(function (x, k) { b.box(BRASS, 0.05, 0.03, 0.03, x, 0.21, -0.98).glow(0.9).sph([0x6aff8a, 0xffd04a, 0xff5a3c][k], 0.025, x, 0.25, -1.04).glow(0); }); });
    var depthNeedle = podL.mesh(pod, function (b) { b.box(0xb3202a, 0.012, 0.02, 0.11, 0, 0, 0.03); }, -0.4, 0.232, -0.972); depthNeedle.rotation.x = 1.07;
    var stick = new T.Group(); stick.position.set(0.55, 0.16, -0.74); pod.add(stick); podL.mesh(stick, function (b) { b.cyl(BRASS, 0.07, 0.09, 0.05, 0, 0, 0).cyl(0x2a2c30, 0.022, 0.022, 0.3, 0, 0.16, 0).glow(0.7).sph(0xff5a3c, 0.05, 0, 0.33, 0).glow(0); });
    var beam = new T.Group(); beam.position.set(0, 2.6, -1.9); pod.add(beam); var cone = K.shaft(beam, 0xdff4ff, 0.25, 6.5, 30, 0, 0, -15, 0.1); cone.rotation.x = PI / 2; var beamTip = K.halo(beam, 0xeaf8ff, 1.4, 0, 0, -0.2, 0.9);
    /* the squid's arms that come across the window */
    var grab = [[-1.9, 2.6, 0.75], [2.0, 0.4, -0.7], [0.2, 3.2, 0.2]].map(function (q, i) { var g = new T.Group(); g.position.set(q[0], q[1], -1.7); g.rotation.z = q[2] + (q[0] > 0 ? PI / 2 : -PI / 2) + (i === 2 ? PI : 0); pod.add(g); var js = K.chain(seaL, g, 7, 0.62, function (b, n, k) { var r0 = 0.34 - k * 0.2; b.cyl(SQ, r0 - 0.03, r0, 0.66, 0, 0.31, 0, 0, 0, 0, 10).sph(SQ, r0, 0, 0, 0, 1, 1, 1, 10).glow(0.4); for (var c = 0; c < 2; c++) b.cyl(0xf4d0d0, r0 * 0.4, r0 * 0.46, 0.06, 0, 0.14 + c * 0.3, r0 * 0.9, PI / 2, 0, 0, 10).cyl(0xc88a8a, r0 * 0.2, r0 * 0.2, 0.07, 0, 0.14 + c * 0.3, r0 * 0.92, PI / 2, 0, 0, 8); b.glow(0); }); g.visible = false; return { g: g, js: js, i: i }; });
    var zap = K.halo(pod, 0xbfe6ff, 9, 0, 1.2, -1.6, 0);

    /* ---------------------------------------------------------------- the score */
    var score = null, air = null;
    function music() { return K.score({ bpm: 76, step: 2, vol: 0.5, inst: { lead: 'harp', lead2: 'flute', bass: 'bass', pad: 'strings' },
      sections: {
        /* the dive: harp ripples falling, a flute */
        dive: { lead: 'e5 c5 g4 e4 c4 e4 g4 c5 | d5 a4 f4 d4 a3 d4 f4 a4 | c5 g4 e4 c4 g3 c4 e4 g4 | b4 g4 d4 b3 g3 b3 d4 g4', lead2: 'g5 - - - e5 - - - | f5 - - - d5 - - - | e5 - - - c5 - - - | d5 - - - - - - -', pad: 'C - - - - - - - | Dm - - - - - - - | Am - - - - - - - | G - - - - - - -', bass: 'c2 - - - - - - - | d2 - - - - - - - | a1 - - - - - - - | g1 - - - - - - -', mix: { lead: 0.22 } },
        /* the reef: a marimba and pizzicato, light on its feet */
        reef: { inst: { lead: 'marimba' }, lead: 'e5 . g5 . c6 . g5 e5 | f5 . a5 . c6 . a5 f5 | e5 . g5 . c6 . e6 c6 | d6 . b5 . g5 . . .', lead2: 'c5 - - - - - e5 - | f5 - - - - - a5 - | g5 - - - - - e5 - | d5 - - - - - - -', bass: 'c2 . g2 . c3 . g2 . | f2 . c3 . f2 . c3 . | c2 . g2 . e2 . g2 . | g1 . d2 . g2 . b2 .', pad: 'C - - - - - - - | F - - - - - - - | C - - - - - - - | G - - - - - - -', perc: 'h . w . h . w h', mix: { lead: 0.32, lead2: 0.14, perc: 0.16 } },
        /* the graveyard: a cello singing low over a slow harp */
        graves: { inst: { lead2: 'cello' }, lead2: 'a3 - - - c4 - - - | b3 - - - a3 - g3 - | f3 - - - a3 - - - | e3 - - - - - - -', lead: 'a2 e3 a3 c4 e4 c4 a3 e3 | g2 d3 g3 b3 d4 b3 g3 d3 | f2 c3 f3 a3 c4 a3 f3 c3 | e2 b2 e3 g#3 b3 g#3 e3 b2', pad: 'Am - - - - - - - | G - - - - - - - | F - - - - - - - | E - - - - - - -', mix: { lead: 0.18, lead2: 0.26 } },
        /* the squid: horns and drums */
        squid: { inst: { lead2: 'horn', bass: 'cello' }, lead2: 'a3 - - bb3 a3 - - - | c4 - - b3 a3 - g#3 -', bass: 'a1 - - - a1 - bb1 - | a1 - - - c2 - b1 -', pad: 'Adim - - - - - - - | Adim - - - E - - -', perc: 'g . t t k . t s', mix: { lead2: 0.3, bass: 0.22, perc: 0.32 } },
        /* the abyss: almost nothing — a choir far away, a bell now and then */
        abyss: { inst: { lead: 'glock', pad: 'choir' }, lead: 'e6 . . . . . . . | . . . . b5 . . . | . . . . . . . . | a5 . . . . . e6 .', pad: 'Am - - - - - - - | Em - - - - - - - | F - - - - - - - | Em - - - - - - -', bass: 'a1 - - - - - - - | e1 - - - - - - - | f1 - - - - - - - | e1 - - - - - - -', mix: { lead: 0.12, pad: 0.1, bass: 0.2 } },
        /* the lost city: the choir opens into the major; harp, and the flute with the tune */
        city: { inst: { pad: 'choir' }, lead2: 'e5 - g5 - c6 - - b5 | a5 - - g5 e5 - - - | f5 - a5 - c6 - - d6 | b5 - - - g5 - - -', lead: 'c3 g3 c4 e4 g4 e4 c4 g3 | a2 e3 a3 c4 e4 c4 a3 e3 | f2 c3 f3 a3 c4 a3 f3 c3 | g2 d3 g3 b3 d4 b3 g3 d3', pad: 'C - - - - - - - | Am - - - - - - - | F - - - - - - - | G - - - - - - -', bass: 'c2 - - - - - - - | a1 - - - - - - - | f1 - - - - - - - | g1 - - - - - - -', mix: { lead: 0.2, lead2: 0.22, pad: 0.1 } },
        /* home: the horn takes the city's tune */
        home: { inst: { lead2: 'horn' }, lead2: 'e4 - g4 - c5 - - b4 | a4 - - g4 e4 - - - | f4 - a4 - c5 - - d5 | e5 - d5 - c5 - - -', lead: 'c3 g3 c4 e4 g4 e4 c4 g3 | a2 e3 a3 c4 e4 c4 a3 e3 | f2 c3 f3 a3 c4 a3 f3 c3 | g2 d3 g3 b3 c4 e4 g4 c5', pad: 'C - - - - - - - | Am - - - - - - - | F - - - - - - - | G - - - C - - -', bass: 'c2 - - - g1 - - - | a1 - - - e2 - - - | f1 - - - c2 - - - | g1 - - - c2 - - -', perc: 'k . h . s . h .', mix: { lead: 0.2, lead2: 0.28, perc: 0.16 } } } }); }
    function sec(name, cut) { if (!score) score = A.keep(music()); if (cut) score.cut(name); else score.set(name); }
    A.resetHook = function () { score = null; air = null; lx = ly = 0; found = 0; hid.forEach(function (h) { h.got = false; h.h.material.opacity = 0; }); clams.forEach(function (c) { c.open = 0; }); folk.forEach(function (f) { f.brave = 0; f.g.position.copy(f.home); }); grab.forEach(function (g) { g.g.visible = false; }); seaL.u.uFog.value.set(5 / 255, 42 / 255, 64 / 255); };

    /* ---------------------------------------------------------------- the dive */
    var TIME = [[0, 14], [6, -8], [26, -150], [50, -296], [57, -318], [70, -322], [84, -438], [116, -590], [124, -640], [130, -700]];
    function zAt(t) { for (var i = 1; i < TIME.length; i++) if (t <= TIME[i][0]) { var k = (t - TIME[i - 1][0]) / (TIME[i][0] - TIME[i - 1][0]); if (i === 1) k = k * k; return TIME[i - 1][1] + (TIME[i][1] - TIME[i - 1][1]) * k; } return TIME[TIME.length - 1][1]; }
    var bo = new T.Vector3(), bd = new T.Vector3(), lastLit = 0;
    function lit(obj, cosMin, range) { obj.getWorldPosition(tmp); tmp2.subVectors(tmp, bo); var d = tmp2.length(); return d < (range || 42) && tmp2.normalize().dot(bd) > (cosMin || 0.955); }
    function step(t, dt) {
      var z = zAt(t), a = at(z), f = at(z - 8), depth = -a.p.y;
      pose.p = [a.p.x, a.p.y + 1.2, a.p.z]; pose.h = null; pose.t = [f.p.x, f.p.y + 1.2, f.p.z]; pose.roll = Math.sin(t * 0.6) * 0.02;
      /* the searchlight: yours to turn; it drifts slowly back to dead ahead */
      lx *= 1 - Math.min(1, dt * 0.18); ly *= 1 - Math.min(1, dt * 0.18); beam.rotation.set(ly * 0.75, -lx * 0.95, 0); stick.rotation.set(-ly * 0.5, 0, -lx * 0.5);
      beam.getWorldPosition(bo); beam.getWorldDirection(bd); bd.negate(); var power = (t > 70.5 && t < 76) ? (Math.sin(t * 31) > 0.2 ? 0.35 : 0) : 1;
      seaL.spot([bo.x, bo.y, bo.z], [bd.x, bd.y, bd.z], [1.5 * power, 1.6 * power, 1.7 * power], 0.9, 64); cone.material.opacity = 0.045 * power; beamTip.material.opacity = 0.9 * power;
      /* the water darkens with the depth */
      var dk = sm((depth - 4) / 60), u = seaL.u, fc = new T.Color(K.mix(0x0a4a6a, 0x010810, dk)); u.uFog.value.set(fc.r, fc.g, fc.b); seaSky.material.color.copy(fc); u.uAmb.value = 0.42 - dk * 0.26 + (z < -440 && z > -600 ? 0.12 : 0); u.uCaus.value = 0.55 * (1 - sm(depth / 30)); u.uNear.value = 6 + (z < -440 ? 10 : 0); u.uFar.value = 95 + (z < -440 && z > -600 ? 60 : 0);
      shafts.forEach(function (s, i) { s.material.opacity = (0.06 + Math.sin(t * 0.8 + i) * 0.03) * (1 - sm(depth / 26)); });
      bubbles.visible = z > -40 || t > 116; if (bubbles.visible) bubbles.userData.step(dt, a.p.x, a.p.y + 2, a.p.z - 7, t); snow.userData.step(dt, a.p.x, a.p.y + 2, a.p.z - 10, t);
      plank.material.opacity = 0.7 * sm((depth - 40) / 30) * (z > -445 ? 1 : 0.35); plank.userData.step(dt, a.p.x, a.p.y + 1, a.p.z - 12, t);
      depthNeedle.rotation.z = 2.2 - Math.min(1, depth / 115) * 4.4;
      /* life on the reef */
      kelp.forEach(function (js, i) { js.forEach(function (j, n) { j.rotation.z = Math.sin(t * 1.1 + i + n * 0.6) * 0.14; j.rotation.x = Math.cos(t * 0.8 + i * 2 + n * 0.5) * 0.1; }); });
      schools.forEach(function (s) { if (Math.abs(s.c[2] - z) > 70) return; var an = t * s.sp + s.ph; if (lit(s.g, 0.93, 30)) s.scat = Math.min(1, s.scat + dt * 3); else s.scat = Math.max(0, s.scat - dt * 0.4); s.g.position.set(s.c[0], s.c[1] + Math.sin(an * 1.3) * 1.2 + s.scat * 3, s.c[2]); s.g.rotation.y = -an - s.scat * 1.5; s.g.scale.setScalar(1 + s.scat * 0.5); });
      turtles.forEach(function (q) { var an = t * 0.25 + q.ph; q.g.position.set(q.c[0] + q.side * (q.r + Math.sin(an) * 2), q.c[1] + Math.sin(an * 1.7) * 1.2, q.c[2] + Math.cos(an) * 6); q.g.rotation.y = an + PI / 2; q.g.rotation.z = Math.sin(t * 1.4) * 0.1; q.fl.forEach(function (fl, i) { fl.rotation.z = (i ? -1 : 1) * Math.sin(t * 1.8) * 0.5; }); });
      clams.forEach(function (c) { if (lit(c.g, 0.94, 30)) c.open = Math.min(1, c.open + dt * 1.5); c.lid.rotation.x = -c.open * 1.0; c.halo.material.opacity = c.open * 0.5; c.pearl.scale.setScalar(0.4 + c.open * 0.6); if (c.open > 0.5) once('clam' + c.g.id, function () { K.play('glock', 'c7', 0.6, 0.1); K.play('glock', 'g6', 0.6, 0.08, 0.12); }); });
      /* what the light finds */
      hid.forEach(function (h) { if (Math.abs(h.g.position.z - a.p.z) > 60) return; var on = power > 0.5 && lit(h.g, 0.955, 40); if (on && !h.got) { h.got = true; found++; K.play('celesta', 'c6', 0.5, 0.2); K.play('celesta', 'e6', 0.5, 0.18, 0.1); K.play('celesta', 'g6', 0.8, 0.18, 0.2); K.tr('🔦 探照灯找到了：', '🔦 The searchlight has found: '); K.tr(h.name[0], h.name[1]); API.toast('🔦 探照灯找到了：' + h.name[0] + '（' + found + '/' + total + '）'); }
        h.h.material.opacity += ((h.got ? 0.55 + Math.sin(t * 4) * 0.15 : 0) - h.h.material.opacity) * 0.1; if (h.got) h.g.position.y = h.y + Math.sin(t * 2 + h.y) * 0.06; });
      helmS.userData.head.rotation.y = Math.sin(t * 0.5) * 0.3;
      /* the squid */
      var qt = t - 54, come = sm(qt / 5), hold = sm((qt - 4.5) / 2) * (1 - sm((qt - 18.5) / 1.0)), flee = sm((qt - 19) / 4);
      squid.visible = z < -240 && z > -420; if (squid.visible) { var sx = sqA.p.x + 30 - come * 19 + flee * 60, sy = sqA.p.y + 10 - come * 7 + flee * 14, sz = -330 + come * 6 - flee * 30; squid.position.set(sx, sy, sz); squid.lookAt(A.w(pose.p)[0], A.w(pose.p)[1] + 1, A.w(pose.p)[2]); squid.rotateZ(Math.sin(t * 0.7) * 0.15);
        sqArms.forEach(function (q) { q.js.forEach(function (j, n) { j.rotation.x = (n ? 0.06 + hold * 0.1 * (q.i % 2 ? 1 : -0.6) : 0) + Math.sin(t * 1.3 + q.i + n * 0.6) * 0.13; j.rotation.z = Math.cos(t * 1.0 + q.i * 2 + n * 0.5) * 0.13; }); }); }
      grab.forEach(function (gq) { gq.g.visible = hold > 0.02; var k = hold; gq.js.forEach(function (j, n) { j.rotation.z = (n ? 1 : 0) * ((gq.i === 1 ? -1 : 1) * (0.5 - k * 0.24) + Math.sin(t * 2.2 + n + gq.i) * 0.05); j.rotation.x = Math.sin(t * 1.7 + n * 0.7 + gq.i * 2) * 0.05; }); gq.g.scale.setScalar(0.3 + k * 0.7); });
      if (hold > 0.1) { st.shake = Math.max(st.shake, 0.3 * hold); pose.roll += Math.sin(t * 2.3) * 0.07 * hold; }
      var zt = t - 70.5, zf = zt > 0 && zt < 2.2 ? (Math.sin(t * 47) > 0 ? 1 : 0.25) : 0; zap.material.opacity = zf * 0.8; seaL.flash(zf * 0.5, zf * 0.6, zf * 0.8);
      ink.material.opacity = 0.55 * sm((qt - 18) / 1.5) * (1 - sm((qt - 26) / 4)); if (ink.material.opacity > 0.01) ink.userData.step(dt, a.p.x, a.p.y + 1.5, a.p.z - 6, t);
      /* the abyss */
      if (t > 72 && t < 84) { st.shake = Math.max(st.shake, 0.22); pose.roll += Math.sin(t * 1.1) * 0.06; pose.t[1] -= 2.5 * sm((t - 72) / 2) * (1 - sm((t - 82) / 2)); }
      jellies.forEach(function (j) { if (Math.abs(j.g.position.z - a.p.z) > 60) return; var p = Math.sin(t * 1.6 + j.ph), sy2 = 1 - p * 0.18; j.bell.scale.set(1 + p * 0.14, sy2, 1 + p * 0.14); j.legs.scale.set(1 - p * 0.1, 1 + p * 0.12, 1 - p * 0.1); j.g.position.y = j.y + Math.sin(t * 0.5 + j.ph) * 1.2 + (t - 70) * 0.05; j.g.rotation.z = Math.sin(t * 0.4 + j.ph) * 0.2; });
      anglers.forEach(function (an, i) { if (Math.abs(an.z - a.p.z) > 50) return; var near = sm(1 - Math.abs(an.z + 6 - a.p.z) / 16); an.g.position.set(an.x0 - an.side * near * 5.6, an.y0 + Math.sin(t * 0.9 + i) * 0.5, an.z); an.g.lookAt(A.w(pose.p)[0], A.w(pose.p)[1], A.w(pose.p)[2]); an.jaw.rotation.x = 0.15 + near * 0.6 + Math.sin(t * 3) * 0.05; if (near > 0.6) once('ang' + i, function () { K.roar(1.2, 0.2, 1.6); st.shake = 0.5; }); });
      /* the city and its people: shy until the light has touched them, then they come to the window */
      folk.forEach(function (fk, i) { if (Math.abs(fk.z - a.p.z) > 70 && t < 112) return; if (power > 0.5 && lit(fk.g, 0.94, 34)) fk.brave = Math.min(1, fk.brave + dt * 0.8); if (z < fk.z + 6) fk.brave = Math.min(1, fk.brave + dt * 0.5);
        var b2 = sm(fk.brave), push = sm((t - 113) / 3), an = t * 0.8 + fk.ph, tx, ty, tz;
        if (push > 0) { var ring = i / folk.length * PI * 2 + t * 0.3, dv = tmp.set(pose.t[0] - pose.p[0], pose.t[1] - pose.p[1], pose.t[2] - pose.p[2]).normalize(), rv = tmp2.crossVectors(dv, up).normalize(), cr = Math.cos(ring) * 3.6, sr = Math.sin(ring) * 2.3; tx = pose.p[0] + dv.x * 6.2 + rv.x * cr + (rv.z * dv.y) * sr; ty = pose.p[1] + dv.y * 6.2 + sr * Math.sqrt(Math.max(0, 1 - dv.y * dv.y)); tz = pose.p[2] + dv.z * 6.2 + rv.z * cr - (rv.x * dv.y) * sr; } else { tx = fk.home.x - fk.side * b2 * (Math.abs(fk.home.x - a.p.x) - 2.6 - (i % 3) * 0.5) + Math.sin(an) * 0.4; ty = fk.home.y + Math.sin(an * 1.3) * 0.5 + b2 * (a.p.y + 1.1 - fk.home.y) * 0.8; tz = fk.home.z + b2 * Math.max(-10, Math.min(8, a.p.z - 3.2 - fk.home.z)); }
        var fol = push > 0 ? 0.16 : 0.06; fk.g.position.x += (tx - fk.g.position.x) * fol; fk.g.position.y += (ty - fk.g.position.y) * fol; fk.g.position.z += (tz - fk.g.position.z) * fol;
        var w = A.w(pose.p); fk.g.lookAt(w[0], w[1], w[2]); fk.head.rotation.z = Math.sin(an * 1.1) * 0.22; fk.lids.scale.y = Math.sin(t * 0.8 + fk.ph * 3) > 0.96 ? 1 : 0.01;
        fk.fins.forEach(function (fn, k) { fn.rotation.y = (k ? 1 : -1) * (0.3 + Math.sin(t * 6 + fk.ph) * 0.5); }); fk.tail.forEach(function (j, n) { j.rotation.x = Math.sin(t * 5 - n * 0.9 + fk.ph) * 0.35; });
        fk.arms[0].rotation.x = b2 > 0.6 ? -1.6 + Math.sin(t * 7 + i) * 0.5 : 0; fk.arms[1].rotation.x = push > 0 ? -1.2 : 0; fk.lamp.material.opacity = 0.5 + Math.sin(t * 3 + i) * 0.2;
        if (fk.brave > 0.7) once('folk' + i, function () { K.play('celesta', ['e6', 'g6', 'c7', 'a6', 'd7'][i % 5], 0.5, 0.12); }); });
      heart.material.opacity = 0.35 + Math.sin(t * 1.4) * 0.08;
      /* where the eye is drawn when the hand is still */
      var idle = 1 - Math.min(1, (Math.abs(lx) + Math.abs(ly)) * 2);
      function gaze(x, y, zz, w2) { pose.t = [pose.t[0] + (x - pose.t[0]) * w2, pose.t[1] + (y - pose.t[1]) * w2, pose.t[2] + (zz - pose.t[2]) * w2]; }
      if (hold > 0 || come > 0 && flee < 1) { var o = A.w([0, 0, 0]); squid.getWorldPosition(tmp); gaze(tmp.x - o[0], tmp.y - o[1], tmp.z - o[2], 0.6 * come * (1 - flee)); }
      gaze(pose.p[0] + bd.x * 20, pose.p[1] + bd.y * 20, pose.p[2] + bd.z * 20, 0.45 * (1 - idle));
      if (z < -535 && z > -590) { var ha = at(-560); gaze(ha.p.x + 14, floorY(-560) + 6, -560, 0.5 * sm((-535 - z) / 10) * (1 - sm((-578 - z) / 8)) * idle); }

      /* the telling */
      if (t > 0.3) once('a', function () { sec('dive'); air = A.keep(K.air({ freq: 300, vol: 0.05, drone: 49, droneVol: 0.03 })); K.rush(3, 1400, 220, 0.2, 0.5); K.line('🧭', NEMO, '下潜。探照灯归你管——用 W A S D 或者拖动来转它。海底很暗，被灯照到的东西才会醒过来。', 'Dive. The searchlight is yours — turn it with W A S D, or drag. It is dark down here, and only what the light touches wakes up.'); });
      if (z < -40) once('b', function () { sec('reef'); K.line('🐠', null, '海藻林和珊瑚礁。照一照那只大砗磲——它会张开给你看。', 'The kelp forest and the reef. Shine the light on that giant clam — it will open for you.'); });
      if (z < -158) once('c', function () { sec('graves'); K.line('⚓', NEMO, '沉船的坟场。几百年了，没人来过——船上的东西都还在。用灯找一找。', 'The graveyard of ships. No one has come here in hundreds of years — what they carried is all still here. Search with the light.'); });
      if (qt > 0.5) once('d', function () { sec('squid', true); K.roar(4.5, 0.35, 0.5); K.line('🦑', NEMO, '右舷有东西——大王乌贼！它朝我们来了！', 'Something to starboard — a giant squid! It is coming for us!'); });
      if (qt > 5.5) once('e', function () { K.thud(1.2); K.rush(2, 300, 120, 0.3, 0.5); K.line('🐙', null, '它的触手缠住了潜水艇，吸盘压在窗户上！', 'Its arms are round the pod, the suckers pressed against the window!'); });
      if (qt > 11) once('f', function () { K.line('⚡', NEMO, '坚持住——我给艇壳通上电。三，二，一……', 'Hold on — I am putting a charge through the hull. Three, two, one…'); });
      if (zt > 0) once('g', function () { K.rush(2.2, 5000, 900, 0.3, 2); ['a6', 'e7', 'a7'].forEach(function (n, i) { K.play('glock', n, 0.3, 0.14, i * 0.05); }); K.roar(2.6, 0.4, 1.3); st.shake = 0.9; });
      if (t > 74.5) once('h', function () { sec('abyss', true); if (air) air.set(0.03, 160, 0.05); K.line('⬇️', NEMO, '它松手了——可是电也用光了。我们在往下沉……别怕。看窗外。', 'It has let go — but the charge took all our power. We are sinking… do not be afraid. Look out of the window.'); });
      if (t > 80) once('i', function () { K.line('🪼', null, '水母，像一盏一盏的灯。还有长着灯笼的鱼——离它的嘴远一点！', 'Jellyfish, like lamps, one after another. And a fish with a lantern of its own — keep clear of its mouth!'); });
      if (z < -440) once('j', function () { sec('city', true); if (air) air.set(0.04, 420, 0.03); K.line('🏛️', NEMO, '……我的天。海底有一座城。亮着灯的城。', '…Good heavens. A city on the sea bed. A city with its lamps lit.'); });
      if (z < -478) once('k', function () { K.line('🐟', null, '有人住在这里！圆眼睛，小小的，躲在柱子后面看我们。用灯轻轻照一照，他们就敢过来了。', 'There are people living here! Round-eyed and small, peeping at us from behind the columns. Touch them gently with the light and they will dare to come closer.'); });
      if (z < -536) once('l', function () { K.line('💡', null, '城中心那盏大灯——是他们的太阳。', 'The great lamp at the heart of the city — it is their sun.'); });
      if (t > 113) once('m', function () { sec('home', true); K.rush(8, 300, 1800, 0.14, 0.5); K.line('💙', NEMO, '他们知道我们没有动力了。看——他们围过来，在把潜水艇往上推。', 'They know we have no power. Look — they are gathering round, and pushing the pod up.'); });
      if (t > 124) once('n', function () { K.line('👋', null, '快到海面了。他们停下来，朝我们挥手。', 'Nearly at the surface. They stop, and wave to us.'); });
      if (t > 128.6) A.fadeTo(1, '#dff4ff');
    }
    var PH = [
      { n: tr('潜水艇下潜', 'The dive'), sc: 'sea', d: 130, car: 1, f: step },
      { n: tr('返回码头', 'Back at the dock'), sc: 'sea', d: 7, car: 1, f: function (t) { var a = at(14); pose.p = [a.p.x, 2.2 + 1.2, 12]; pose.h = null; pose.t = [a.p.x, 3.6, 2]; seaL.u.uFog.value.set(0.1, 0.42, 0.6); seaSky.material.color.setRGB(0.1, 0.42, 0.6); seaL.u.uAmb.value = 0.6; grab.forEach(function (g) { g.g.visible = false; }); folk.forEach(function (f) { f.g.visible = false; });
          if (t > 0.3) once('z', function () { A.fadeTo(0); K.rush(2, 800, 3000, 0.2, 0.5); ['c5', 'e5', 'g5', 'c6'].forEach(function (n, i) { K.play('harp', n, 1.2, 0.2, i * 0.15); }); K.line('🧭', NEMO, '浮出水面了。你用探照灯找到了 ' + found + ' 件东西——还交到了海底的朋友。这件事，替他们保密。', 'We are up. You found ' + found + ' things with the searchlight — and made friends at the bottom of the sea. Keep their secret for them.'); K.tr('浮出水面了。你用探照灯找到了 ', 'We are up. You found '); K.tr(' 件东西——还交到了海底的朋友。这件事，替他们保密。', ' things with the searchlight — and made friends at the bottom of the sea. Keep their secret for them.'); }); } }
    ];
    var start0 = A.resetHook; A.resetHook = function () { start0(); folk.forEach(function (f) { f.g.visible = true; }); };
    return PH; }, tr('🐙 你到过海底两万里，见到了海底的城市', '🐙 You have been 20,000 leagues under the sea, and seen the city there'));

    /* ---------------------------------------------------------------- the way in, in the park */
    (function () { var x = 190, z = 585, gy = API.groundY(x, z, 62), E = new T.Group(); E.position.set(x, gy, z); API.scene.add(E); var Lm = function (c) { return new T.MeshLambertMaterial({ color: c }); }, add = function (geo, m, px, py, pz) { var o = new T.Mesh(geo, m); o.position.set(px, py, pz); E.add(o); return o; };
      add(new T.SphereGeometry(4.6, 20, 14, 0, PI * 2, 0, PI / 2), Lm(0x3a5a68), 0, 0, 0).scale.set(1.3, 1.25, 1.1); for (var i = 0; i < 9; i++) add(new T.SphereGeometry(0.22, 8, 6), Lm(0xb08a3c), Math.cos(i / 8 * PI) * 5.6, Math.sin(i / 8 * PI) * 5.2 + 0.2, 2.6);
      add(new T.TorusGeometry(2.4, 0.32, 10, 28), Lm(0xb08a3c), 0, 2.5, 4.3); add(new T.CircleGeometry(2.3, 24), new T.MeshBasicMaterial({ color: 0x0a2a3a }), 0, 2.5, 4.25);
      for (i = 0; i < 6; i++) { var a = (i - 2.5) * 0.5, tn = add(new T.CylinderGeometry(0.34, 0.1, 6.4, 8), Lm(0x9a2a2a), Math.sin(a) * 6.4, 3, -1 + Math.cos(a) * 1.5); tn.rotation.z = -Math.sin(a) * 0.7; tn.rotation.x = 0.2; }
      [-3.6, 3.6].forEach(function (px) { add(new T.CylinderGeometry(0.12, 0.12, 3.4, 6), Lm(0x6a5220), px, 1.7, 4.6); add(new T.SphereGeometry(0.42, 10, 8), new T.MeshBasicMaterial({ color: 0x9fe4ff }), px, 3.7, 4.6); });
      add(new T.PlaneGeometry(6.6, 1.6), new T.MeshBasicMaterial({ map: K.paint(660, 160, function (c, w, h) { c.fillStyle = '#0c2430'; c.fillRect(0, 0, w, h); c.strokeStyle = '#b08a3c'; c.lineWidth = 8; c.strokeRect(6, 6, w - 12, h - 12); c.fillStyle = '#7fe3ff'; c.textAlign = 'center'; c.font = '800 36px Georgia,serif'; c.fillText('20,000 LEAGUES UNDER THE SEA', w / 2, 62); c.fillStyle = '#f3ecd6'; c.font = '700 40px "PingFang SC",sans-serif'; c.fillText('海底两万里', w / 2, 124); }) }), 0, 6.6, 4.9); })();
  });
})(window);
