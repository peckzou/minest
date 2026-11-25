/* Pirates of the Caribbean: Battle for the Sunken Treasure (Shanghai Disneyland, Treasure Cove) — rebuilt to the
 * standard of "it's a small world" (2026-11-24). The boat drifts through six places, each a full set:
 *   the grotto of the cursed (skeletons at cards, the helmsman in the storm, the heap of gems, and the skeleton
 *   captain who turns into Jack Sparrow) → down under the sea: the graveyard of ships, the reef, mermaids, a shark,
 *   the kraken → Davy Jones at his organ on the sunken treasure, his crew of the drowned, and Jack helping himself →
 *   up between the Black Pearl and the Flying Dutchman, broadside to broadside, Jack and Jones at swords on the
 *   rail → backwards down the fall → Jack on his hill of gold.
 * Our own shapes and our own lines. Needs ride-kit.js and ride-show.js. */
(function (root) {
  'use strict';
  var K = root.TPRideKit; if (!K || !K.look) return;
  K.ready(function (API) {
    var T = API.THREE, PI = Math.PI, sm = K.sm, tr = K.tr;
    var JACK = ['杰克船长', 'Captain Jack', { pitch: 1.05, rate: 1.0 }], JONES = ['戴维·琼斯', 'Davy Jones', { pitch: 0.55, rate: 0.85 }], SKEL = ['骷髅船长', 'The skeleton captain', { pitch: 0.7, rate: 0.9 }];
    var A = K.stage(API, { id: 'pirates_treasure', x: 215, z: 560, oy: 2700, gap: 900, name: tr('加勒比海盗：沉落宝藏之战（Battle for the Sunken Treasure）', 'Pirates of the Caribbean: Battle for the Sunken Treasure'), icon: '🏴‍☠️',
      quest: tr('夺回沉没的宝藏', 'Win back the sunken treasure'), tip: tr('宝藏湾的山洞码头', 'The cave dock in Treasure Cove'), eye: 1.75, fov: 56 });
    var L = A.L, once = A.once, st = A.st, pose = A.pose, tmp = new T.Vector3();
    /* everything below is built the first time someone boards, not when the park loads */
    A.run(function () {
    function sky(g, col, r) { var m = new T.Mesh(new T.SphereGeometry(r || 800, 16, 12), new T.MeshBasicMaterial({ color: col, side: T.BackSide, fog: false, depthWrite: false })); m.renderOrder = -10; g.add(m); return m; }
    var BONE = 0xe6dcc2, WOOD = 0x5a3d28, DARK = 0x33241a, GOLD = 0xe0a81e, IRON = 0x2e3036;

    var P = K.props(T), skeleton = P.skeleton, sword = P.sword, gold = P.gold, chest = P.chest, barrel = P.barrel, lantern = P.lantern, ship = P.ship;

    /* ================================================================ 1 · the grotto of the cursed */
    var cvL = K.look({ tint: [0.76, 0.88, 1.0], fog: 0x05090d, near: 14, far: 100, amb: 0.44, rim: 0.22 });
    var cove = A.scene('cove', 0); sky(cove, 0x05090d);
    var cpath = K.path([[0, 0, 22], [0, 0, 6], [-2.4, 0, -20], [2.4, 0, -48], [-2.4, 0, -76], [2.4, 0, -104], [0, 0, -126], [0, 0, -150]]), TL = 1.7, TR = -2.4, TW = -0.5;
    K.water(cove, 80, 220, { a: 0x04121a, b: 0x1a5a6a, s: 0xbfe6f0, fog: 0x05090d, near: 20, far: 110 }, 0, 0, -60);
    var cvLamps = [];
    cvL.mesh(cove, function (b) { var r = K.rnd(17), i;
      for (var z = 30; z > -165; z -= 5) { var p = cpath.getPointAt(Math.min(1, Math.max(0, (22 - z) / 172))), n = 11; for (var k = 0; k < n; k++) { var an = k / n * PI + r() * 0.2, rr = 11.5 + r() * 2.5, size = 4.4 + r() * 2.6; b.rock(K.shade(0x3c4a52, 0.85 + r() * 0.3), size, p.x + Math.cos(an) * (rr + size * 0.9), Math.sin(an) * (rr * 0.72 + size * 0.9) - 0.5, z, 1 + Math.floor(r() * 900), 1, 0.9, 1, size > 4.5 ? 2 : 1, 0.26); }
        for (k = 0; k < 2; k++) { var sx = (r() - 0.5) * 16, h = 1.5 + r() * 3.5; b.cone(0x46545c, 0.3 + h * 0.08, h, p.x + sx, 9.6 - Math.abs(sx) * 0.3 - h / 2, z + r() * 3, PI, 0, 0, 7); } }
      /* the dock we leave from */
      b.box(WOOD, 5, 0.3, 14, -6.5, 0.6, 14); for (i = 0; i < 6; i++) { b.cyl(DARK, 0.2, 0.2, 2.6, -4.2, 0.2, 8 + i * 2.4); if (i % 2 === 0) { b.cyl(DARK, 0.08, 0.08, 2.6, -4.3, 2.0, 8 + i * 2.4); lantern(b, cvLamps, -4.3, 3.2, 8 + i * 2.4); } } barrel(b, -7, 0.75, 10); barrel(b, -7.7, 0.75, 10.6); chest(b, -6.6, 0.75, 13, 0.4, false);
      /* ledges for the four tableaux */
      [[-7.5 + TL, -22], [8 + TW + 1.5, -48], [-8 + TL, -76], [8.5 + TR, -104]].forEach(function (q, k) { var sg = q[0] < 0 ? -1 : 1; b.cyl(0x4a5660, 3.6, 4.2, 2.4, q[0] + sg * 1.2, -0.42, q[1], 0, 0, 0, 14); for (var e = 0; e < 7; e++) b.rock(K.shade(0x4a5660, 0.85 + (e % 3) * 0.12), 0.9 + (e % 3) * 0.4, q[0] + sg * 1.2 + Math.cos(e * 0.9 + 0.4) * 3.7, 0.1, q[1] + Math.sin(e * 0.9 + 0.4) * 3.7, 300 + k * 9 + e); });
      /* 1: cards and rum */
      b.push(TL, 0, 0).cyl(WOOD, 0.75, 0.75, 0.08, -7.4, 1.72, -22, 0, 0, 0, 14).cyl(DARK, 0.1, 0.16, 0.8, -7.4, 1.3, -22); [[-8.4, -22.6], [-6.5, -21.4]].forEach(function (q) { barrel(b, q[0], 0.85, q[1]); });
      b.glow(0.4).cyl(0x3a6a3a, 0.07, 0.09, 0.3, -7.2, 1.9, -21.8).cyl(0x3a6a3a, 0.03, 0.03, 0.14, -7.2, 2.1, -21.8).glow(0); for (i = 0; i < 5; i++) b.box(0xf4ecd8, 0.1, 0.005, 0.15, -7.7 + i * 0.12, 1.77, -22.1 + (i % 2) * 0.1, 0, i * 0.5, 0);
      chest(b, -9.0, 0.82, -20.2, 0.9, true); lantern(b, cvLamps, -7.4, 3.5, -22); b.cyl(IRON, 0.012, 0.012, 3, -7.4, 5.2, -22).pop();
      /* 2: the wrecked bow, the wheel */
      b.push(9.5 + TW, -1.3, -48, -2.0, 1, 0, 0.22).dome(K.shade(WOOD, 0.8), 1, 0, 3.2, 0, 0.5, PI, 0, 0, 3.2, 3.4, 8).box(WOOD, 5.6, 0.25, 9, 0, 3.2, 0).cyl(WOOD, 0.26, 0.34, 9, 0, 7.4, 1.5, 0, 0, 0.2).cyl(WOOD, 0.1, 0.1, 6, 0.8, 9.6, 1.9, 0, 0, PI / 2 + 0.2);
      for (i = 0; i < 4; i++) b.box(K.shade(0xb8ad8c, 0.7 + (i % 2) * 0.2), 1.2, 2.2 + (i % 3) * 0.8, 0.05, -1.3 + i * 1.3, 8.2 - (i % 3) * 0.4, 2.0, 0.1, 0, 0.2); b.cyl(WOOD, 0.08, 0.08, 1.0, 0, 3.8, -1.6).pop();
      /* 3: the heap of gems */
      b.push(TL, 0, 0); gold(b, -8.2, 0.9, -76, 2.2, 5); gold(b, -6.4, 0.5, -73.6, 1.1, 6); chest(b, -9.4, 1.4, -77.8, 0.7, true); chest(b, -6.6, 1.0, -78.2, -0.5, false); lantern(b, cvLamps, -9.8, 3.6, -75); b.pop();
      /* 4: the captain's rock */
      b.push(TR, 0, 0).rock(0x56626c, 1.6, 7.6, 1.0, -104, 60, 1.3, 0.8, 1.2, 2, 0.14); gold(b, 9.6, 0.9, -105.6, 1.3, 8); chest(b, 6.2, 0.9, -106, -0.6, true); lantern(b, cvLamps, 10.4, 3.4, -102.6); b.pop(); });
    cvLamps.forEach(function (q) { K.halo(cove, 0xffb450, 3.6, q[0], q[1], q[2], 0.5); });
    [[-8.2 + TL, 2.2, -76, 7], [9.6 + TR, 1.8, -105.6, 5]].forEach(function (q) { K.halo(cove, 0xffd040, q[3], q[0], q[1], q[2], 0.22); });
    var moon = K.shaft(cove, 0xbfdcff, 0.6, 3.4, 16, 8.6 + TW, 6, -46, 0.13); moon.rotation.z = 0.2; K.shaft(cove, 0xbfdcff, 0.5, 2.6, 16, 7.2 + TR, 6, -104, 0.12);
    var BIG = 1.3; var card1 = skeleton(cvL, cove, -8.4 + TL, 1.45, -22.9, 0.9, { hat: 'bandana', vest: 0x5a3a2a, sash: 0xa3202a }), card2 = skeleton(cvL, cove, -6.4 + TL, 1.45, -21.0, -2.2, { hat: 'tricorn', vest: 0x2a3a5a, patch: true });
    [card1, card2].forEach(function (s) { s.userData.legL.rotation.x = s.userData.legR.rotation.x = -1.5; s.userData.shinL.rotation.x = s.userData.shinR.rotation.x = 1.5; s.scale.multiplyScalar(BIG); s.position.y -= 0.42 + 0.86 * (BIG - 1); });
    var parrot = new T.Group(); parrot.scale.setScalar(1.6); parrot.position.set(-6.1 + TL, 2.92, -21.0); cove.add(parrot); cvL.mesh(parrot, function (b) { b.glow(0.3).sph(0xd92a2a, 0.12, 0, 0.12, 0, 0.9, 1.3, 1).sph(0xd92a2a, 0.085, 0, 0.3, 0.03).cone(0xf2c230, 0.035, 0.09, 0, 0.28, 0.12, PI / 2, 0, 0, 6).box(0x2a6ad9, 0.03, 0.2, 0.12, 0.1, 0.12, -0.02).box(0x2a6ad9, 0.03, 0.2, 0.12, -0.1, 0.12, -0.02).box(0xf2c230, 0.06, 0.28, 0.03, 0, -0.08, -0.1, 0.5).glow(0.8).sph(0x111111, 0.015, 0.05, 0.32, 0.09).sph(0x111111, 0.015, -0.05, 0.32, 0.09).glow(0); });
    var helm = skeleton(cvL, cove, 8.5 + TW, 2.25, -48.3, -1.9, { hat: 'tricorn', vest: 0x4a2a2a, boots: 0x1c1512, eyes: 0x7affc0 }), wheel = cvL.mesh(cove, function (b) { b.torus(WOOD, 0.62, 0.05, 0, 0, 0, 0, 0, 0); for (var i = 0; i < 8; i++) b.box(WOOD, 0.05, 1.6, 0.05, 0, 0, 0, 0, 0, i * PI / 8); b.cyl(GOLD, 0.1, 0.1, 0.1, 0, 0, 0, PI / 2); }, 7.95 + TW, 3.25, -47.95, -1.9 + PI); helm.scale.multiplyScalar(1.15);
    var rain = K.motes(cove, { n: 200, box: [12, 12, 12], col: 0xbfdcff, size: 0.12, vel: [-2, -16, 0], drift: 0.1, op: 0.5, seed: 2 });
    var gems = skeleton(cvL, cove, -7.4 + TL, 2.05, -75.2, 1.2, { hat: 'bandana', hatC: 0x2a5a8a, vest: 0x6a2a4a }); gems.rotation.x = -1.2; gems.userData.armR.rotation.x = -2.4; gems.scale.multiplyScalar(BIG);
    var crabs = []; for (var ci = 0; ci < 5; ci++) (function (i) { var g = new T.Group(); cove.add(g); cvL.mesh(g, function (b) { b.sph(0xd9502a, 0.16, 0, 0.1, 0, 1.3, 0.6, 1); [-1, 1].forEach(function (s) { b.cone(0xd9502a, 0.06, 0.16, s * 0.2, 0.14, 0.14, 0.6, 0, -s * 0.6, 5); for (var k = 0; k < 3; k++) b.box(0xb83a1a, 0.16, 0.02, 0.02, s * 0.24, 0.05, -0.08 + k * 0.07, 0, 0, s * 0.5); b.glow(0.8).sph(0x111111, 0.02, s * 0.05, 0.2, 0.12).glow(0); }); }); crabs.push({ g: g, ph: i * 1.3 }); })(ci);
    var capS = skeleton(cvL, cove, 7.6 + TR, 2.25, -104, -1.2, { hat: 'tricorn', vest: 0x4a1a1a, sash: 0xa3202a, boots: 0x1c1512, eyes: 0x7affc0, h: 1.85 * BIG }); sword(cvL, capS.userData.foreR);
    function makeJack(Lk, parent, x, y, z, ry) { var d = K.doll(Lk, parent, x, y, z, ry, { h: 1.85, skin: 0xd6a074, top: 0xe6dcc4, bot: 0x3a3028, coat: 0x4a3a2e, sash: 0xc23a2a, belt: 0x2a1c12, boots: 0x241812, hair: 0x1a1410, long: true, beard: 0x1a1410, stache: 0x1a1410, hat: 'tricorn', hatC: 0x3a2a1e, cuff: 0xe6dcc4, brow: 0x0a0806,
        face: function (b) { b.cyl(0xc23a2a, 0.176, 0.176, 0.05, 0, 0.225, 0, 0, 0, 0, 14); [-1, 1].forEach(function (s) { for (var k = 0; k < 3; k++) { b.tube(0x1a1410, [[s * 0.15, 0.16, -0.04 + k * 0.05], [s * 0.19, -0.02, -0.02 + k * 0.05], [s * 0.17, -0.2, 0.02 + k * 0.04]], 0.022, 0.018, 6, 4); b.glow(0.6).sph([0xe0245e, 0x3498db, 0xf2c230][k], 0.022, s * 0.17, -0.21, 0.02 + k * 0.04).glow(0); } b.cone(0x1a1410, 0.016, 0.14, s * 0.03, -0.1, 0.13, PI, 0, 0, 5); b.box(0x0a0806, 0.06, 0.012, 0.01, s * 0.063, 0.14, 0.148); }); } }); sword(Lk, d.userData.foreR); return d; }
    var jack1 = makeJack(cvL, cove, 7.6 + TR, 2.25, -104, -1.2); jack1.scale.multiplyScalar(BIG); jack1.visible = false; var poof = K.halo(cove, 0x9affd0, 8, 7.6 + TR, 3.6, -104, 0);
    var mist = K.motes(cove, { n: 120, box: [26, 3, 40], col: 0x9ab8c8, size: 1.6, vel: [0.2, 0, 0.3], drift: 0.3, add: false, op: 0.12, seed: 6 });

    /* ================================================================ 2 · under the sea */
    var seaL = K.look({ tint: [0.55, 0.85, 1.0], fog: 0x063148, near: 8, far: 105, amb: 0.46, rim: 0.2, caus: 0.55 });
    var deep = A.scene('deep', 1); sky(deep, 0x063148);
    var dpath = K.path([[0, 1, 24], [0, 0, 6], [0, -8, -22], [-3, -13, -50], [3, -13.5, -90], [-2, -13.5, -130], [0, -13.5, -165], [-10, -13.5, -195], [-26, -13.5, -215]]), FLOOR = -16.4;
    seaL.mesh(deep, function (b) { var r = K.rnd(23), i;
      for (i = 0; i < 90; i++) { var x = (r() - 0.5) * 150, z = 30 - r() * 270; var ss = 9 + r() * 8; b.rock(K.mix(0xb8a878, 0x8a9a7a, r() * 0.5), ss, x, FLOOR - ss * 0.56, z, i + 1, 1.5, 0.45, 1.5, 2, 0.14); }            /* the sand */
      for (i = 0; i < 60; i++) { var s = i % 2 ? 1 : -1, zz = 20 - i * 4.2, off = 22 + r() * 20, sz = 3 + r() * 6; b.rock(K.shade(0x2f5560, 0.8 + r() * 0.4), sz, s * off + (r() - 0.5) * 6, FLOOR + sz * 0.5, zz, i + 100, 1, 1.2 + r(), 1, 2, 0.26); }   /* reef walls */
      /* coral gardens */
      var CC = [0xff6a8a, 0xffa23a, 0xc86aff, 0x4ad8c8, 0xffe06a, 0xff4a4a];
      for (i = 0; i < 70; i++) { var cs = i % 2 ? 1 : -1, cz = -20 - i * 2.6, cx = cs * (5 + r() * 9), col = CC[Math.floor(r() * 6)], kind = i % 4;
        if (kind === 0) { for (var k = 0; k < 5; k++) { var a = r() * PI * 2, h = 1 + r() * 1.6; b.glow(0.25).tube(col, [[cx, FLOOR + 0.6, cz], [cx + Math.cos(a) * 0.4, FLOOR + 0.6 + h * 0.5, cz + Math.sin(a) * 0.4], [cx + Math.cos(a) * 0.9, FLOOR + 0.6 + h, cz + Math.sin(a) * 0.9]], 0.14, 0.05, 6, 5).glow(0.7).sph(K.mix(col, 0xffffff, 0.5), 0.09, cx + Math.cos(a) * 0.9, FLOOR + 0.65 + h, cz + Math.sin(a) * 0.9).glow(0); } }
        else if (kind === 1) { b.glow(0.2).sph(col, 0.8 + r() * 0.6, cx, FLOOR + 0.9, cz, 1.2, 0.8, 1.2, 12).glow(0); }
        else if (kind === 2) { for (k = 0; k < 4; k++) b.glow(0.25).add(new T.CylinderGeometry(0.9 + k * 0.25, 0.1, 0.9, 12, 1, true), K.shade(col, 0.8 + k * 0.1), cx + (r() - 0.5), FLOOR + 0.8 + k * 0.25, cz + (r() - 0.5), 0, 0, (r() - 0.5) * 0.5).glow(0); }
        else { b.cyl(0x8a6a5a, 0.28, 0.34, 0.5, cx, FLOOR + 0.7, cz); b.glow(0.5); for (k = 0; k < 9; k++) { var ta = k / 9 * PI * 2; b.tube(col, [[cx, FLOOR + 0.9, cz], [cx + Math.cos(ta) * 0.3, FLOOR + 1.3, cz + Math.sin(ta) * 0.3], [cx + Math.cos(ta) * 0.55, FLOOR + 1.5, cz + Math.sin(ta) * 0.55]], 0.05, 0.02, 5, 4); } b.glow(0); } }
      /* giant clams with pearls, amphorae, an anchor and its chain */
      [[6, -40], [-7, -84], [8, -112]].forEach(function (q) { b.dome(0xd8c8e0, 1.2, q[0], FLOOR + 0.9, q[1], 0.5, PI, 0, 0, 1, 0.5, 1).dome(0xe8d8f0, 1.2, q[0], FLOOR + 1.0, q[1] - 0.5, 0.5, -1.0, 0, 0, 1, 0.5, 1).glow(0.9).sph(0xffffff, 0.3, q[0], FLOOR + 1.0, q[1]).glow(0); });
      for (i = 0; i < 8; i++) { var ax = (i % 2 ? 1 : -1) * (4 + r() * 5), az = -60 - i * 12; b.lathe(0xb8734a, [[0.12, 0], [0.34, 0.3], [0.3, 0.7], [0.1, 0.95], [0.16, 1.1]], ax, FLOOR + 0.6, az, 10, (r() - 0.5) * 1.6, 0, (r() - 0.5) * 1.6); }
      b.push(-6, FLOOR + 1.4, -66, 0.5, 1.6, 0, 0.5).cyl(IRON, 0.08, 0.08, 2.4, 0, 0, 0).torus(IRON, 0.9, 0.1, 0, -1.2, 0, 0, 0, 0, PI).cone(IRON, 0.22, 0.4, -0.9, -1.1, 0, 0, 0, 0.6, 4).cone(IRON, 0.22, 0.4, 0.9, -1.1, 0, 0, 0, -0.6, 4).torus(IRON, 0.2, 0.05, 0, 1.3, 0).box(IRON, 1.2, 0.1, 0.1, 0, 0.9, 0).pop();
      for (i = 0; i < 12; i++) b.torus(IRON, 0.16, 0.04, -6 + i * 0.3, FLOOR + 0.7 + Math.sin(i) * 0.1, -68 - i * 0.45, i % 2 ? 0 : PI / 2, 0.5, 0);
      /* wreck one, on its side to the left; wreck two, upright to the right, in the kraken's arms */
      b.push(-17, FLOOR - 0.5, -58, 0.5, 1, 0, 0.5); ship(b, { hull: 0x2a3a3a, trim: 0x3a4a44, sail: 0x5a6a5a, torn: true, flag: 0x1a2420 }); b.pop();
      b.push(19, FLOOR - 1.2, -128, -0.7, 1, 0, -0.16); ship(b, { hull: 0x33342c, trim: 0x4a4a38, sail: 0x6a6a52, torn: true, flag: 0x1a1a14 }); b.pop();
      /* ribs of an older wreck the boat passes through */
      for (i = 0; i < 9; i++) [-1, 1].forEach(function (s2) { b.tube(0x4a3e30, [[s2 * 0.5, FLOOR + 0.4, -92 - i * 2.4], [s2 * 4.2, FLOOR + 1.5, -92 - i * 2.4], [s2 * 5.0, FLOOR + 4.5, -92 - i * 2.4], [s2 * 4.0, FLOOR + 7.0, -92 - i * 2.4]], 0.22, 0.12, 10, 6); }); b.box(0x4a3e30, 0.6, 0.5, 23, 0, FLOOR + 0.5, -101.6);
      chest(b, 2.6, FLOOR + 0.5, -100, 0.6, true); gold(b, -2.4, FLOOR + 0.3, -104, 1.0, 11); });
    var shafts = []; for (var si = 0; si < 9; si++) { var sh = K.shaft(deep, 0x9fe4ff, 0.6, 5.5, 60, (si % 3 - 1) * 16 + si, 8, -10 - si * 21, 0.07); sh.rotation.z = 0.22; shafts.push(sh); }
    var bubbles = K.motes(deep, { n: 180, box: [26, 20, 34], col: 0xd8f6ff, size: 0.22, vel: [0, 1.8, 0], drift: 0.5, op: 0.6, seed: 8 }), snow = K.motes(deep, { n: 260, box: [40, 24, 50], col: 0x9fd0e0, size: 0.1, vel: [0.1, -0.15, 0.1], drift: 0.2, op: 0.5, seed: 9 });
    /* kelp that sways */
    var kelp = []; for (var ki = 0; ki < 16; ki++) (function (i) { var g = new T.Group(); g.position.set((i % 2 ? 1 : -1) * (6.5 + (i % 5) * 1.8), FLOOR + 0.3, -28 - i * 9.2); deep.add(g); kelp.push(K.chain(seaL, g, 6, 1.5, function (b, n) { b.box(i % 3 ? 0x2f8f55 : 0x4aa86a, 0.5, 1.6, 0.05, 0, 0.8, 0, 0, n * 0.6, 0).glow(0.3).sph(0x9ad86a, 0.09, 0.2, 1.0, 0).glow(0); })); })(ki);
    /* schools of fish, each one mesh that swims a ring */
    var schools = []; [[0xffc23a, -40, 5], [0x6ad8ff, -80, -4], [0xff7a5a, -112, 6], [0xd8e8f0, -150, 0]].forEach(function (q, i) { var g = new T.Group(); deep.add(g); seaL.mesh(g, function (b) { var r = K.rnd(30 + i); b.glow(0.35); for (var k = 0; k < 34; k++) { var a = r() * 0.9, x = Math.cos(a) * 9 + (r() - 0.5) * 2.4, z = Math.sin(a) * 9, y = (r() - 0.5) * 2.4; b.push(x, y, z, -a, 0.8 + r() * 0.6).sph(q[0], 0.2, 0, 0, 0, 0.35, 0.6, 1.3, 8).cone(K.shade(q[0], 0.8), 0.13, 0.22, 0, 0, -0.32, PI / 2, 0, 0, 4).glow(0.9).sph(0x111111, 0.025, 0.06, 0.03, 0.16).sph(0x111111, 0.025, -0.06, 0.03, 0.16).glow(0.35).pop(); } }); schools.push({ g: g, c: [q[2], -10 + (i % 2) * 2.5, q[1]], sp: 0.35 + i * 0.07, ph: i * 1.6 }); });
    var shark = new T.Group(); deep.add(shark); seaL.mesh(shark, function (b) { b.sph(function (x, y) { return y < -0.1 ? 0xd8e0e4 : 0x5a6a78; }, 1, 0, 0, 0, 0.55, 0.6, 2.4, 16).cone(0x5a6a78, 0.3, 0.9, 0, 0.75, 0.1, -0.5, 0, 0, 4); [-1, 1].forEach(function (s) { b.box(0x5a6a78, 0.9, 0.06, 0.5, s * 0.75, -0.2, 0.5, 0, s * 0.5, -s * 0.4).glow(0.8).sph(0x0a0a0a, 0.05, s * 0.36, 0.1, 1.75).glow(0); }); for (var i = 0; i < 7; i++) b.cone(0xffffff, 0.035, 0.09, -0.18 + i * 0.06, -0.25, 2.1, PI, 0, 0, 3); });
    var sharkTail = new T.Group(); sharkTail.position.z = -2.2; shark.add(sharkTail); seaL.mesh(sharkTail, function (b) { b.cone(0x5a6a78, 0.3, 1.0, 0, 0, -0.3, -PI / 2, 0, 0, 6).box(0x5a6a78, 0.06, 1.0, 0.4, 0, 0.4, -0.9, -0.6).box(0x5a6a78, 0.06, 0.6, 0.3, 0, -0.25, -0.8, 0.6); });
    /* the mermaids */
    var mermaids = []; [[0xc23a5a, 0x2f9f8a, 0xe8b88f], [0x2a2a6a, 0x8a4ad8, 0xc98a58], [0xe8c23a, 0x3a9ad8, 0xf3d0b0]].forEach(function (q, i) {
      var d = K.doll(seaL, deep, 0, 0, 0, 0, { h: 1.6, skin: q[2], top: q[2], bot: q[1], hair: q[0], long: true, eye: 0x1a4a3a, extra: function (b) { b.glow(0.4); [-1, 1].forEach(function (s) { b.dome(q[1], 0.085, s * 0.09, 1.3, 0.14, 0.5, PI / 2); }); b.glow(0); }, face: function (b) { b.box(q[0], 0.34, 0.5, 0.08, 0, -0.1, -0.14).glow(0.8).sph(0xffffff, 0.03, 0.12, 0.3, 0.06).glow(0); } });
      d.userData.legL.visible = d.userData.legR.visible = false; var root2 = new T.Group(); root2.position.y = 0.9; root2.rotation.x = PI; d.add(root2);
      var tail = K.chain(seaL, root2, 5, 0.34, function (b, n, k) { b.glow(0.3).cyl(K.shade(q[1], 1 - k * 0.2), 0.19 - k * 0.15 + 0.02, 0.19 - k * 0.15 - 0.012 + 0.02, 0.36, 0, 0.17, 0, 0, 0, 0, 10); if (n === 4) b.box(K.mix(q[1], 0xffffff, 0.35), 0.75, 0.42, 0.03, 0, 0.5, 0, 0, 0, 0).glow(0); });
      mermaids.push({ d: d, tail: tail, ph: i * 2.1, z: -84 - i * 9 }); });
    /* the kraken */
    var kr = new T.Group(); kr.position.set(13, FLOOR - 9, -160); kr.rotation.y = -0.5; deep.add(kr); var KRC = 0x7a2a3e;
    seaL.mesh(kr, function (b) { b.rock(function (x, y, z) { return K.mix(KRC, 0xc85a6a, Math.max(0, Math.sin(x * 1.3) * Math.sin(y * 1.1) * Math.sin(z * 1.2))); }, 6.2, 0, 9, -5, 5, 1, 1.35, 1.15, 2, 0.1).rock(KRC, 4.4, 0, 4.4, -1, 6, 1.2, 0.9, 1.1, 2, 0.1);
      [-1, 1].forEach(function (s) { b.glow(0.9).sph(0xffd84a, 1.25, s * 3.6, 6.4, -0.6, 0.7, 1, 1, 16).glow(0.1).box(0x120808, 0.3, 0.5, 1.5, s * 4.5, 6.4, -0.6).glow(0).rock(K.shade(KRC, 0.7), 1.6, s * 3.5, 7.8, -0.9, 9 + s, 1, 0.4, 1.2, 1, 0.1); }); });
    var tent = []; for (var ti = 0; ti < 8; ti++) (function (i) { var a = (i - 3.5) * 0.5, g = new T.Group(); g.position.set(Math.sin(a) * 3.6, 3.2, Math.cos(a) * 2.6 + 0.6); g.rotation.set(1.0, a, 0); kr.add(g);
      tent.push({ js: K.chain(seaL, g, 9, 2.6, function (b, n, k) { var r0 = 1.05 - k * 0.85, r1 = 1.05 - Math.min(1, k + 0.11) * 0.85; b.cyl(KRC, r1, r0, 2.75, 0, 1.3, 0, 0, 0, 0, 10).sph(KRC, r0, 0, 0, 0, 1, 1, 1, 10); b.glow(0.3); for (var c = 0; c < 3; c++) b.cyl(0xf0c8c8, r0 * 0.34, r0 * 0.4, 0.1, 0, 0.5 + c * 0.9, r0 * 0.92, PI / 2, 0, 0, 8); b.glow(0); }), a: a, i: i }); })(ti);

    /* ================================================================ 3 · Davy Jones' treasure */
    var hallL = K.look({ tint: [0.74, 1.0, 0.88], fog: 0x04161a, near: 14, far: 110, amb: 0.46, rim: 0.24, caus: 0.25 });
    var hall = A.scene('jones', 2); sky(hall, 0x04161a); K.water(hall, 140, 140, { a: 0x03161a, b: 0x1a6a5a, s: 0xffe6a0, fog: 0x04161a, near: 20, far: 110 }, 0, 0, -20);
    var hpath = K.path([[13, 0, 8], [10, 0, 0], [5, 0, -10], [-1, 0, -18], [-4.6, 0, -27], [-5, 0, -37], [-3, 0, -46]]), hLamps = [], pipes = [];
    hallL.mesh(hall, function (b) { var r = K.rnd(41), i;
      for (i = 0; i < 56; i++) { var a = i / 56 * PI * 2, rr = 58 + r() * 5, s = 8 + r() * 6; b.rock(K.shade(0x1f4a4a, 0.8 + r() * 0.4), s, Math.cos(a) * rr, 2 + r() * 4, -20 + Math.sin(a) * rr, i + 1, 1, 1.9, 1, 2, 0.26); }
      for (i = 0; i < 30; i++) { var x = (r() - 0.5) * 70, z = -20 + (r() - 0.5) * 70; b.rock(0x1c3c3e, 9 + r() * 5, x, 26 + r() * 4, z, i + 70, 1.4, 0.7, 1.4, 2, 0.26); b.cone(0x265054, 0.5 + r() * 0.5, 4 + r() * 6, x * 0.9, 19 - r() * 3, z * 0.9, PI, 0, 0, 7); }
      for (i = 0; i < 40; i++) { var fs = 8 + r() * 5; b.rock(0x2a4a44, fs, (r() - 0.5) * 90, -fs * 0.66 - 0.4, -20 + (r() - 0.5) * 90, i + 120, 1.4, 0.5, 1.4, 2, 0.14); }
      /* hills of gold all round the organ's island */
      [[10, -24, 3.6], [15, -34, 2.8], [5, -42, 3.2], [-16, -40, 2.2], [18, -18, 2.4], [-22, -26, 3.2], [-24, -42, 2.6], [22, -6, 2.2], [0, 6, 2.0], [-18, -8, 2.4], [12, -50, 2.4]].forEach(function (q, k) { gold(b, q[0], -1.6 + q[2] * 0.2, q[1], q[2], 20 + k); });
      [[7, -1.0, -20, 0.6, 1], [12.6, -0.6, -27, -0.8, 1], [3, -0.9, -36, 2.1, 0], [-19, -0.9, -22, 0.5, 1], [-21, -1.0, -38, -0.4, 1], [19, -1.1, -12, 1.2, 0], [2, -1.2, 3, 2.6, 1]].forEach(function (q) { chest(b, q[0], q[1], q[2], q[3], q[4]); });
      /* golden idols and urns */
      [[16, -30], [-25, -32], [8, -46]].forEach(function (q, k) { b.glow(0.35).cyl(GOLD, 0.7, 0.9, 0.6, q[0], 0.4, q[1], 0, 0, 0, 8).lathe(GOLD, [[0.5, 0], [0.62, 0.9], [0.4, 1.7], [0.3, 2.0], [0.42, 2.3], [0.36, 2.9], [0, 3.0]], q[0], 0.7, q[1], 10).glow(0.9).sph(k % 2 ? 0xe0245e : 0x2ecc71, 0.1, q[0] - 0.14, 3.25, q[1] + 0.34).sph(k % 2 ? 0xe0245e : 0x2ecc71, 0.1, q[0] + 0.14, 3.25, q[1] + 0.34).glow(0); });
      /* the organ: a coral-grown console, three ranks of pipes */
      b.rock(0x24484a, 6, 4, -3.2, -30, 9, 1.5, 0.5, 1.2, 2, 0.12);
      b.push(4, 0, -31, -0.35).box(0x2a2420, 5.4, 1.5, 1.6, 0, 0.75, 0).box(0x1c1814, 5.0, 0.2, 1.1, 0, 1.55, 0.5, 0.35).box(0xe8e0cc, 4.4, 0.05, 0.42, 0, 1.6, 0.74, 0.35).box(0xe8e0cc, 4.4, 0.05, 0.42, 0, 1.82, 0.36, 0.35); for (i = 0; i < 20; i++) b.box(0x15120f, 0.09, 0.05, 0.24, -2.0 + i * 0.21, 1.66, 0.7, 0.35);
      b.box(0x2a2420, 6.6, 6.5, 0.8, 0, 3.4, -1.2); for (i = 0; i < 23; i++) { var hgt = 4.5 + (1 - Math.abs(i - 11) / 11) * 4.2 + (i % 2) * 0.5; b.cyl(K.mix(0x5a8a7a, 0xb8c8a0, (i % 3) / 3), 0.14, 0.14, hgt, -3.1 + i * 0.28, 2.2 + hgt / 2, -0.66, 0, 0, 0, 8).cone(0x3a5a4a, 0.14, 0.3, -3.1 + i * 0.28, 2.5, -0.5, 0.6, 0, 0, 6); }
      [-1, 1].forEach(function (s) { for (var k = 0; k < 6; k++) { var h2 = 3 + k * 0.7; b.cyl(0x5a8a7a, 0.2, 0.2, h2, s * (3.7 + k * 0.42), 0.4 + h2 / 2, -0.9 + k * 0.12, 0, 0, 0, 8); } b.glow(0.4).tube(0xff6a8a, [[s * 3.4, 0.2, 0.7], [s * 3.9, 1.6, 0.9], [s * 4.6, 2.4, 0.6]], 0.16, 0.05, 6, 5).tube(0xffa23a, [[s * 3.2, 0.2, 0.9], [s * 3.3, 1.2, 1.3], [s * 2.9, 2.0, 1.4]], 0.12, 0.04, 6, 5).glow(0); lantern(b, hLamps, s * 3.1, 3.3, 0.5); });
      b.box(0x2a2420, 1.6, 0.5, 0.7, 0, 0.55, 1.9).pop(); });
    hLamps.forEach(function (q) { K.halo(hall, 0x8affc0, 3.4, q[0], q[1], q[2], 0.5); });
    [[10, 2.6, -24, 12], [-22, 2.4, -26, 10], [5, 2.2, -42, 9], [15, 2, -34, 8]].forEach(function (q) { K.halo(hall, 0xffc83a, q[3], q[0], q[1], q[2], 0.2); });
    var hShafts = [K.shaft(hall, 0x8affd8, 0.8, 6, 44, 4, 16, -30, 0.12), K.shaft(hall, 0xffe08a, 0.6, 4, 44, 10, 16, -24, 0.08)];
    var hBub = K.motes(hall, { n: 160, box: [30, 20, 34], col: 0xbfffe8, size: 0.2, vel: [0, 1.4, 0], drift: 0.5, op: 0.55, seed: 18 });
    function makeJones(Lk, parent, x, y, z, ry) { var d = K.doll(Lk, parent, x, y, z, ry, { h: 2.05, skin: 0x7ab8a2, top: 0x2a4a44, bot: 0x1c2e2c, coat: 0x1f3a36, belt: 0x15201e, boots: 0x101816, hat: 'tricorn', hatC: 0x15201e, eye: 0x1a3a5a, angry: true, brow: 0x3a6a5a, cuff: 0x4a7a6a,
        face: function (b) { b.glow(0.15); for (var i = 0; i < 9; i++) { var a = (i - 4) * 0.2, len = 0.3 + (i % 3) * 0.12; b.tube(K.shade(0x7ab8a2, 0.85 + (i % 2) * 0.15), [[Math.sin(a) * 0.1, 0.07, 0.13 * Math.cos(a)], [Math.sin(a) * 0.13, -0.08, 0.17 * Math.cos(a)], [Math.sin(a) * 0.15 + (i % 2 ? 0.04 : -0.04), -0.08 - len * 0.6, 0.15 * Math.cos(a)], [Math.sin(a) * 0.12, -0.08 - len, 0.2 * Math.cos(a)]], 0.03, 0.012, 8, 5); } b.glow(0).sph(0x8a9a8a, 0.03, 0.1, 0.24, 0.1).sph(0x8a9a8a, 0.025, -0.12, 0.26, 0.06); },
        extra: function (b) { for (var i = 0; i < 5; i++) b.sph(0x8a9a8a, 0.035, -0.18 + i * 0.09, 1.35 - (i % 2) * 0.2, 0.2).sph(0x4a7a5a, 0.05, 0.2 - i * 0.08, 0.9 + (i % 3) * 0.12, 0.22, 1, 0.5, 1); } });
      Lk.mesh(d.userData.foreL, function (b) { b.glow(0.2).sph(0xb83a2a, 0.11, 0, -0.3, 0, 1, 1.3, 0.8).cone(0xb83a2a, 0.07, 0.34, 0.05, -0.52, 0, PI, 0, 0.25, 6).cone(0xb83a2a, 0.05, 0.3, -0.06, -0.5, 0, PI, 0, -0.3, 6).glow(0); }); return d; }
    var jones = makeJones(hallL, hall, 3.3, 0.5, -29.3, PI - 0.35), fishmen = [
      K.doll(hallL, hall, 0.2, -0.2, -26.2, 0.9, { h: 1.9, skin: 0x5a8a9a, top: 0x3a3a4a, bot: 0x2a2a34, sash: 0x6a2a2a, boots: 0x15181c, eye: 0x101010, face: function (b) { b.box(0x5a8a9a, 0.62, 0.1, 0.18, 0, 0.2, 0.04).glow(0.6).sph(0x101010, 0.03, 0.3, 0.2, 0.1).sph(0x101010, 0.03, -0.3, 0.2, 0.1).glow(0).cone(0x5a8a9a, 0.06, 0.2, 0, 0.36, -0.06, -0.3, 0, 0, 4); } }),
      K.doll(hallL, hall, 9.2, -0.2, -33, -1.3, { h: 1.75, skin: 0x8aa86a, top: 0x4a3a2a, bot: 0x2e2a20, belt: 0x1c1612, boots: 0x15120e, hat: 'bandana', hatC: 0x3a5a4a, eye: 0xffe06a, face: function (b) { for (var i = 0; i < 7; i++) b.sph(0xb8b0a0, 0.03 + (i % 3) * 0.012, Math.cos(i * 0.9) * 0.14, 0.1 + Math.sin(i * 1.7) * 0.12, 0.1 + (i % 2) * 0.04); b.glow(0.4).tube(0xff6a8a, [[0.1, 0.28, 0], [0.16, 0.42, 0], [0.24, 0.46, 0.04]], 0.025, 0.01, 5, 4).glow(0); } })];
    jones.scale.multiplyScalar(1.25); sword(hallL, fishmen[0].userData.foreR, 0x9ab8b0); sword(hallL, fishmen[1].userData.foreR, 0x9ab8b0);
    var jack2 = makeJack(hallL, hall, 12.4, 1.9, -25.2, -2.2), loot = new T.Group(); jack2.userData.foreL.add(loot); hallL.mesh(loot, function (b) { chest(b, -0.3, -0.75, 0.05, 0, false); }); loot.scale.setScalar(0.6);

    /* ================================================================ 4 · the battle */
    var batL = K.look({ tint: [0.62, 0.74, 1.0], fog: 0x0c1424, near: 30, far: 260, amb: 0.36, rim: 0.24 });
    var bat = A.scene('battle', 3); sky(bat, 0x0c1424);
    K.cyc(bat, 420, 380, K.paint(2048, 512, function (c, w, h) {
      var gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#05070f'); gr.addColorStop(0.5, '#141e38'); gr.addColorStop(0.74, '#2a3a5a'); gr.addColorStop(0.76, '#0a1220'); gr.addColorStop(1, '#060a12'); c.fillStyle = gr; c.fillRect(0, 0, w, h);
      var mg = c.createRadialGradient(1500, 150, 10, 1500, 150, 240); mg.addColorStop(0, 'rgba(255,246,214,1)'); mg.addColorStop(0.16, 'rgba(255,240,200,.95)'); mg.addColorStop(0.2, 'rgba(160,180,230,.35)'); mg.addColorStop(1, 'rgba(60,80,140,0)'); c.fillStyle = mg; c.fillRect(1200, 0, 600, 420);
      for (var i = 0; i < 300; i++) { c.fillStyle = 'rgba(255,255,255,' + (0.3 + (i % 5) * 0.14) + ')'; c.fillRect((i * 197) % w, (i * 89) % 330, 2, 2); }
      for (i = 0; i < 34; i++) { var x = (i * 163) % w, y = 150 + (i * 59) % 210, s = 60 + (i * 37) % 120; c.fillStyle = 'rgba(' + (i % 2 ? '20,26,44' : '44,54,84') + ',.8)'; for (var k = 0; k < 6; k++) { c.beginPath(); c.ellipse(x + k * s * 0.45, y + (k % 2) * 12, s * 0.6, s * 0.2, 0, 0, 7); c.fill(); } }
      c.fillStyle = 'rgba(255,240,200,.28)'; for (i = 0; i < 80; i++) c.fillRect(1380 + (i * 37) % 240, 392 + i * 1.4, 30 - i * 0.2, 1.5);
    }), 60);
    var batW = K.water(bat, 900, 900, { a: 0x050d18, b: 0x2a4a72, s: 0xfff0c8, fog: 0x0c1424, near: 60, far: 330 }, 0, 0, -30);
    function makeShip(o, x, z, ry) { var g = new T.Group(); g.position.set(x, -0.9, z); g.rotation.y = ry; bat.add(g); var info; batL.mesh(g, function (b) { info = ship(b, o); }); info.lamps.forEach(function (q) { K.halo(g, o.lamp, 4.4, q[0], q[1], q[2], 0.55); });
      info.fl = info.muzzles.map(function (m) { return K.halo(g, 0xffc060, 7, m[0] + m[3] * 0.6, m[1], m[2], 0); }); info.g = g; return info; }
    var pearl = makeShip({ hull: 0x16120f, trim: 0x2a221c, sail: 0x1c1a1c, flag: 0x0c0c0c, skull: true, lamp: 0xffb450 }, -15, -34, 0.06), dutch = makeShip({ hull: 0x23342e, trim: 0x3a5246, sail: 0x56705a, torn: true, flag: 0x1a2a22, lamp: 0x7affc0 }, 15, -30, PI - 0.05);
    var balls = [], splash = [], smoke = [];
    for (var qi = 0; qi < 8; qi++) { balls.push({ m: batL.mesh(bat, function (b) { b.sph(0x15171c, 0.3, 0, 0, 0); }), a: null }); splash.push(batL.mesh(bat, function (b) { b.glow(0.5).add(new T.CylinderGeometry(1.4, 0.3, 5, 10, 1, true), 0xd8f0ff, 0, 2.5, 0).add(new T.CylinderGeometry(0.7, 0.2, 7, 8, 1, true), 0xffffff, 0, 3.5, 0); })); splash[qi].scale.set(0.01, 0.01, 0.01); smoke.push(K.halo(bat, 0xb8c0d0, 6, 0, -50, 0, 0)); smoke[qi].material.blending = T.NormalBlending; }
    /* crews at the rails; Jack and Jones on the Dutchman's rail, steel on steel */
    var pCrew = [], dCrew = [];
    [[3.3, -6, 0x8a2a2a, 0x3a2a1e], [3.3, 0, 0x2a4a6a, 0x1a1410], [3.3, 5.5, 0x5a5a2a, 0x8a5a2a]].forEach(function (q, i) { pCrew.push(K.doll(batL, pearl.g, q[0], 3.72, q[1], PI / 2, { top: q[2], bot: 0x2a2620, sash: 0xc8b48a, hair: q[3], hat: i === 1 ? 'tricorn' : 'bandana', hatC: i === 1 ? 0x241c18 : 0xa3202a, beard: i === 2 ? q[3] : null, skin: [0xe0b088, 0xb07a50, 0xd9a070][i] })); sword(batL, pCrew[i].userData.foreR); });
    [[3.3, -7, 0x7affc0], [3.3, 6.5, 0x7affc0]].forEach(function (q, i) { dCrew.push(skeleton(batL, dutch.g, q[0], 3.72, q[1], PI / 2, { hat: i ? 'bandana' : 'tricorn', hatC: 0x2a4a3a, vest: 0x2a4a44, eyes: q[2], boots: 0x101816 })); sword(batL, dCrew[i].userData.foreR, 0x9ab8b0); });
    var duelJ = makeJack(batL, dutch.g, 3.5, 4.82, -1.4, 0), duelD = makeJones(batL, dutch.g, 3.5, 4.82, 0.6, PI); sword(batL, duelD.userData.foreR, 0x9ab8b0);
    var bRain = K.motes(bat, { n: 300, box: [40, 26, 40], col: 0xbfd0ff, size: 0.12, vel: [-5, -22, 0], drift: 0.1, op: 0.4, seed: 22 });
    var bBolt = batL.mesh(bat, function (b) { b.glow(1).tube(0xeaf2ff, [[-90, 150, -260], [-70, 110, -258], [-96, 80, -262], [-78, 40, -260], [-88, 0, -260]], 1.6, 0.5, 20, 5); }); bBolt.visible = false;

    /* ================================================================ 5 · the fall, 6 · Jack on his gold */
    var endL = K.look({ tint: [1.0, 0.86, 0.6], fog: 0x0a0806, near: 12, far: 80, amb: 0.42, rim: 0.2 });
    var end = A.scene('gold', 4); sky(end, 0x0a0806);
    var eLamps = [], fallW, eW = K.water(end, 60, 90, { a: 0x06141a, b: 0x2a6a70, s: 0xffe6a0, fog: 0x0a0806, near: 20, far: 90 }, 0, 0, -30);
    endL.mesh(end, function (b) { var r = K.rnd(55), i;
      for (var z = 110; z > -78; z -= 5) { var up = z > 28 ? (z - 28) * 0.42 : 0; for (var k = 0; k < 10; k++) { var an = k / 10 * PI + r() * 0.2, rr = (z > 28 ? 11 : 13) + r() * 2, s = 4.4 + r() * 2.4; b.rock(K.shade(0x4a4038, 0.85 + r() * 0.3), s, Math.cos(an) * (rr + s * 0.9), up + Math.sin(an) * (rr * 0.72 + s * 0.9) - 0.5, z, 1 + Math.floor(r() * 900), 1, 0.9, 1, s > 4.5 ? 2 : 1, 0.26); } if (z > 28) b.rock(0x3a342e, 6, 0, up - 6.4, z, 400 + z, 1.6, 0.5, 1, 2, 0.1); }
      /* the fall itself: a sheet of white water down the slope */
      b.glow(0.45); for (i = 0; i < 9; i++) b.box(i % 2 ? 0xd8f0ff : 0xa8d8f0, 1.4, 0.2, 86, -5.6 + i * 1.4, 17.2 + (i % 2) * 0.1, 69, -0.397, 0, 0); b.glow(0);
      /* Jack's hill of gold */
      gold(b, 0, -0.6, -46, 6.5, 71); gold(b, -7, 0.2, -38, 3.2, 72); gold(b, 7.5, 0.2, -40, 3.4, 73); gold(b, -9, 0.2, -52, 2.6, 74); gold(b, 9, 0.2, -54, 2.8, 75); gold(b, 7, 0.1, -27, 1.8, 76); gold(b, -9, 0.1, -28, 1.6, 77);
      [[-5, 0.7, -34, 0.5, 1], [5.6, 0.9, -36, -0.7, 1], [-2.4, 1.8, -42.4, 0.3, 1], [3, 1.7, -42, -0.4, 0], [-10, 0.8, -46, 1.1, 1], [10.4, 0.9, -48, -1.2, 1]].forEach(function (q) { chest(b, q[0], q[1], q[2], q[3], q[4]); });
      b.push(0, -1.2, 0).glow(0.35).box(GOLD, 1.9, 3.0, 0.5, 0, 5.2, -47.7, -0.12).box(0xa3202a, 1.5, 2.3, 0.1, 0, 5.3, -47.4, -0.12).box(GOLD, 1.7, 0.5, 1.5, 0, 3.9, -46.9).sph(GOLD, 0.28, -0.9, 6.8, -47.9).sph(GOLD, 0.28, 0.9, 6.8, -47.9).glow(0).pop();       /* a throne */
      for (i = 0; i < 9; i++) { var a2 = i / 9 * PI * 2; b.cyl(0xf4ecd8, 0.05, 0.06, 0.4, Math.cos(a2) * 1.3, 9.2, -44 + Math.sin(a2) * 1.3).glow(1).sph(0xffc864, 0.07, Math.cos(a2) * 1.3, 9.5, -44 + Math.sin(a2) * 1.3).glow(0); } b.torus(IRON, 1.3, 0.05, 0, 9.0, -44, PI / 2, 0, 0).cyl(IRON, 0.02, 0.02, 4, 0, 11, -44);
      [[-8.6, 3.0, -36], [8.8, 3.2, -38], [-11, 3.4, -50], [11, 3.4, -52]].forEach(function (q) { b.cyl(IRON, 0.04, 0.04, 3, q[0], q[1] - 1.5, q[2]); lantern(b, eLamps, q[0], q[1] + 0.2, q[2]); }); });
    eLamps.forEach(function (q) { K.halo(end, 0xffb450, 3.6, q[0], q[1], q[2], 0.5); }); K.halo(end, 0xffc83a, 22, 0, 3.6, -45, 0.26); K.halo(end, 0xffd870, 5, 0, 9.4, -44, 0.5);
    var jack3 = makeJack(endL, end, 0, 3.2, -46.5, 0); jack3.scale.multiplyScalar(1.5); jack3.userData.legL.rotation.x = jack3.userData.legR.rotation.x = -1.45; jack3.userData.shinL.rotation.x = jack3.userData.shinR.rotation.x = 1.3; jack3.userData.legL.rotation.z = -0.3; jack3.userData.legR.rotation.z = 0.3; jack3.userData.foreR.children[jack3.userData.foreR.children.length - 1].visible = false;
    var goblet = endL.mesh(jack3.userData.foreR, function (b) { b.glow(0.4).lathe(GOLD, [[0.05, 0], [0.012, 0.03], [0.012, 0.1], [0.06, 0.14], [0.065, 0.24]], 0, -0.42, 0.04, 10, PI).glow(0); });
    var crown = endL.mesh(jack3.userData.head, function (b) { b.glow(0.5).cyl(GOLD, 0.14, 0.12, 0.08, 0, 0.44, 0, 0, 0, 0, 12); for (var i = 0; i < 6; i++) b.cone(GOLD, 0.03, 0.09, Math.cos(i * 1.05) * 0.125, 0.52, Math.sin(i * 1.05) * 0.125, 0, 0, 0, 5); b.glow(0.9).sph(0xe0245e, 0.025, 0, 0.45, 0.13).glow(0); });
    var parrot2 = parrot.clone(); parrot2.position.set(0.9, 5.75, -47.85); end.add(parrot2);
    var sparkle = K.motes(end, { n: 140, box: [24, 8, 26], col: 0xfff0a0, size: 0.14, vel: [0, 0.05, 0], drift: 0.1, op: 0.9, seed: 31 }), spray = K.motes(end, { n: 160, box: [14, 10, 14], col: 0xffffff, size: 0.4, vel: [0, 4, 3], drift: 1.2, add: false, op: 0.0, seed: 33 });

    /* ================================================================ the boat */
    var boatL = K.look({ tint: [1.0, 0.9, 0.75], fog: 0, near: 500, far: 900, amb: 0.46, rim: 0.14 });
    var boat = new T.Group(); A.R.add(boat); A.car = boat;
    boatL.mesh(boat, function (b) { [-1, 1].forEach(function (s) { b.box(WOOD, 0.16, 0.5, 4.2, s * 1.35, 0.5, -0.6, 0, 0, 0).box(K.shade(WOOD, 1.25), 0.22, 0.08, 4.2, s * 1.35, 0.78, -0.6); b.box(WOOD, 0.16, 0.5, 1.7, s * 0.72, 0.5, -3.3, 0, s * 0.82, 0).box(K.shade(WOOD, 1.25), 0.22, 0.08, 1.7, s * 0.72, 0.78, -3.3, 0, s * 0.82, 0); });
      b.box(K.shade(WOOD, 0.8), 2.7, 0.1, 5.4, 0, 0.26, -1.2).box(K.shade(WOOD, 1.1), 2.6, 0.1, 0.6, 0, 0.62, -1.9).cyl(DARK, 0.07, 0.09, 0.9, 1.0, 0.95, -3.0).box(IRON, 0.05, 0.05, 0.4, 1.0, 1.36, -2.82); lantern(b, [], 1.0, 1.12, -2.64); });
    var bowLamp = K.halo(boat, 0xffb450, 1.4, 1.0, 1.12, -2.64, 0.6);
    function lamp(Lk, r, g, bl) { var p = A.w(pose.p); Lk.spot(p, [pose.t[0] - pose.p[0], pose.t[1] - pose.p[1], pose.t[2] - pose.p[2]], [r, g, bl], 0.62, 46); }

    /* ================================================================ the score */
    var score = null, bed = null;
    function music() { return K.score({ bpm: 104, step: 3, vol: 0.5, inst: { lead: 'fiddle', lead2: 'accordion', bass: 'bass', pad: 'accordion' }, mix: { lead: 0.2, lead2: 0.16, bass: 0.34, pad: 0.05, perc: 0.26 },
      sections: {
        /* the grotto: a concertina alone with a harp, slow, in six-eight */
        cove: { inst: { lead: 'harp', pad: 'strings' }, lead2: 'd4 - - f4 - - | a4 - - g4 - f4 | e4 - - g4 - - | a4 - - - - - | d4 - - f4 - - | a4 - - d5 - c5 | bb4 - a4 g4 - e4 | d4 - - - - -', lead: 'd3 a3 d4 f4 d4 a3 | d3 a3 d4 f4 d4 a3 | c3 g3 c4 e4 c4 g3 | a2 e3 a3 c#4 a3 e3 | d3 a3 d4 f4 d4 a3 | bb2 f3 bb3 d4 bb3 f3 | g2 d3 g3 bb3 a3 e3 | d3 a3 d4 - - -', pad: 'Dm - - - - - | Dm - - - - - | C - - - - - | A - - - - - | Dm - - - - - | Bb - - - - - | Gm - - A - - | Dm - - - - -', mix: { lead: 0.2, lead2: 0.14, pad: 0.06 } },
        /* Jack's jig: a fiddle, the squeeze-box on the chords, a tambourine */
        jig: { lead: 'd5 - d5 e5 - f5 | g5 - f5 e5 - d5 | c5 - c5 e5 - g5 | a5 - - e5 - - | f5 - f5 g5 - a5 | bb5 - a5 g5 - f5 | e5 - d5 c#5 - e5 | d5 - - - - -', bass: 'd2 - - a2 - - | d2 - - a2 - - | c2 - - g2 - - | a1 - - e2 - - | d2 - - a2 - - | bb1 - - f2 - - | a1 - - a2 - - | d2 - - a1 - -', pad: 'Dm - - Dm - - | Dm - - Dm - - | C - - C - - | A - - A - - | Dm - - Dm - - | Bb - - Bb - - | A - - A - - | Dm - - Dm - -', perc: 'k . b s . b' },
        /* under the sea: a flute over a rocking harp */
        deep: { inst: { lead: 'harp', lead2: 'flute', pad: 'strings' }, lead2: 'a4 - - - - - | d5 - - - - - | f5 - - e5 - d5 | e5 - - - - - | a4 - - - - - | d5 - - - - - | bb4 - - a4 - g4 | a4 - - - - -', lead: 'd3 a3 f4 a4 f4 a3 | d3 a3 f4 a4 f4 a3 | bb2 f3 d4 f4 d4 f3 | a2 e3 c#4 e4 c#4 e3 | d3 a3 f4 a4 f4 a3 | d3 a3 f4 a4 f4 a3 | g2 d3 bb3 d4 bb3 d3 | a2 e3 c#4 e4 c#4 e3', pad: 'Dm - - - - - | Dm - - - - - | Bb - - - - - | A - - - - - | Dm - - - - - | Dm - - - - - | Gm - - - - - | A - - - - -', mix: { lead: 0.2, lead2: 0.2, pad: 0.07 } },
        /* the kraken: low horns and timpani */
        kraken: { inst: { lead2: 'horn', pad: 'strings', bass: 'cello' }, lead2: 'd3 - - eb3 - - | d3 - - - - - | f3 - - e3 - - | d3 - - c#3 - -', bass: 'd2 - - - - - | d2 - - - - - | d2 - - - - - | a1 - - - - -', pad: 'Ddim - - - - - | Ddim - - - - - | Ddim - - - - - | A - - - - -', perc: 't . . t . t', mix: { lead2: 0.3, bass: 0.2, perc: 0.3 } },
        /* Davy Jones at his organ */
        organ: { inst: { lead2: 'organ', bass: 'organ', pad: 'organ' }, lead2: 'd4 - f4 a4 - d5 | c#5 - a4 e4 - a4 | bb4 - d5 f5 - d5 | e5 - c#5 a4 - -', bass: 'd2 - - - - - | a1 - - - - - | bb1 - - - - - | a1 - - - - -', pad: 'Dm - - - - - | A - - - - - | Bb - - - - - | A - - - - -', mix: { lead2: 0.16, bass: 0.16, pad: 0.05 } },
        /* the battle: the jig at full cry, horns under it */
        battle: { inst: { lead2: 'horn' }, lead: 'd5 - d5 e5 - f5 | g5 - f5 e5 - d5 | c5 - c5 e5 - g5 | a5 - - e5 - - | f5 - f5 g5 - a5 | bb5 - a5 g5 - f5 | e5 - d5 c#5 - e5 | d5 - - - - -', lead2: 'd4 - - - - - | d4 - - - - - | e4 - - - - - | e4 - - - - - | f4 - - - - - | f4 - - - - - | e4 - - a4 - - | d4 - - - - -', bass: 'd2 - d2 a2 - a2 | d2 - d2 a2 - a2 | c2 - c2 g2 - g2 | a1 - a1 e2 - e2 | d2 - d2 a2 - a2 | bb1 - bb1 f2 - f2 | a1 - a1 a2 - a2 | d2 - d2 a1 - a1', pad: 'Dm - - Dm - - | Dm - - Dm - - | C - - C - - | A - - A - - | Dm - - Dm - - | Bb - - Bb - - | A - - A - - | Dm - - Dm - -', perc: 'k . b s b b', mix: { lead2: 0.22, perc: 0.3 } },
        /* the gold: the same tune, turned to the major */
        gold: { lead: 'd5 - d5 e5 - f#5 | g5 - f#5 e5 - d5 | a5 - a5 b5 - a5 | f#5 - - d5 - - | g5 - g5 a5 - b5 | a5 - f#5 d5 - f#5 | e5 - d5 c#5 - e5 | d5 - - - - -', bass: 'd2 - - a2 - - | d2 - - a2 - - | a1 - - e2 - - | d2 - - a2 - - | g2 - - d2 - - | d2 - - a2 - - | a1 - - a2 - - | d2 - - a1 - -', pad: 'D - - D - - | D - - D - - | A - - A - - | D - - D - - | G - - G - - | D - - D - - | A - - A - - | D - - D - -', perc: 'k . b s . b' } } }); }
    function sec(name, cut) { if (!score) score = A.keep(music()); if (cut) score.cut(name); else score.set(name); }
    A.resetHook = function () { score = null; bed = null; jack1.visible = false; capS.visible = true; balls.forEach(function (q) { q.a = null; q.m.position.y = -40; }); loot.visible = true; };
    function talk(d, t, on) { var u = d.userData; if (u.jaw) u.jaw.rotation.x = on ? Math.abs(Math.sin(t * 9)) * 0.35 : 0; u.head.rotation.x = on ? Math.sin(t * 5) * 0.06 : 0; }
    function ride(path, u, eyeY) { var p = path.getPointAt(Math.max(0, Math.min(0.999, u))), f = path.getPointAt(Math.max(0, Math.min(1, u + 0.05))); pose.p = [p.x, p.y + eyeY, p.z]; pose.h = [f.x, f.y + eyeY, f.z]; pose.t = [f.x, f.y + eyeY, f.z]; return p; }
    function gaze(x, y, z, w) { pose.t = [pose.t[0] + (x - pose.t[0]) * w, pose.t[1] + (y - pose.t[1]) * w, pose.t[2] + (z - pose.t[2]) * w]; }
    function keyf(t, ks) { for (var i = 1; i < ks.length; i++) if (t <= ks[i][0]) return ks[i - 1][1] + (ks[i][1] - ks[i - 1][1]) * ((t - ks[i - 1][0]) / (ks[i][0] - ks[i - 1][0])); return ks[ks.length - 1][1]; }
    function bump(a, b2, t) { return sm((t - a) / 2.5) * (1 - sm((t - b2) / 2.5)); }
    function fire(shipInfo, k, other, t) { var m = shipInfo.muzzles[k], g = shipInfo.g; tmp.set(m[0], m[1], m[2]); g.localToWorld(tmp); var w0 = A.w([0, 0, 0]), from = [tmp.x - w0[0], tmp.y - w0[1], tmp.z - w0[2]]; var om = other.muzzles[(k + 3) % other.muzzles.length]; tmp.set(om[0] * 0.6, om[1] + (k % 3) * 2 - 1, om[2]); other.g.localToWorld(tmp); var to = [tmp.x - w0[0], k % 3 === 0 ? 0 : tmp.y - w0[1], tmp.z - w0[2] + (k % 3 === 0 ? 6 : 0)];
      var bl = balls[k % 8]; bl.a = { t: 0, from: from, to: to, wet: k % 3 === 0 }; shipInfo.fl[k].material.opacity = 1; var smk = smoke[k % 8]; smk.position.set(from[0], from[1] + 0.5, from[2]); smk.material.opacity = 0.5; smk.scale.set(4, 4, 1); K.thud(0.6 + (k % 3) * 0.15); st.shake = Math.max(st.shake, 0.3); }

    var PH = [
      { n: tr('被诅咒的洞窟', 'The grotto of the cursed'), sc: 'cove', d: 40, car: 1, f: function (t, dt) { var u = t < 4 ? sm(t / 4) * 0.07 : keyf(t, [[4, 0.07], [11, 0.25], [13.5, 0.3], [18.5, 0.405], [20.5, 0.45], [25, 0.565], [27.5, 0.63], [31, 0.70], [37, 0.745], [40, 0.93]]), p = ride(cpath, u, 1.75), z = p.z; pose.p[1] += Math.sin(t * 1.3) * 0.05; pose.roll = Math.sin(t * 0.9) * 0.012;
          gaze(-7.4 + TL, 2.3, -22, 0.9 * bump(4.5, 12.5, t)); gaze(8.4 + TW, 3.9, -48.2, 0.9 * bump(13, 19.5, t)); gaze(-8 + TL, 1.9, -76, 0.9 * bump(20, 26.5, t)); gaze(7.6 + TR, 3.9, -104, 0.92 * bump(27, 38.5, t));
          lamp(cvL, 0.75, 0.6, 0.4);
          /* the card players: one deals, one drinks; the parrot bobs */
          card1.userData.armR.rotation.x = -1.1 + Math.sin(t * 2.4) * 0.3; card1.userData.foreR.rotation.x = -0.8; card1.userData.head.rotation.y = Math.sin(t * 0.8) * 0.5; card2.userData.armL.rotation.x = -1.2; card2.userData.foreL.rotation.x = -1.2 - Math.max(0, Math.sin(t * 1.1)) * 0.9; card2.userData.head.rotation.x = -Math.max(0, Math.sin(t * 1.1)) * 0.4; talk(card1, t, Math.sin(t * 0.7) > 0.2);
          parrot.rotation.y = Math.sin(t * 1.7) * 0.6; parrot.position.y = 2.5 + Math.abs(Math.sin(t * 3.1)) * 0.04;
          /* the helmsman fights his wheel in a storm that is only over him */
          wheel.rotation.z = Math.sin(t * 1.3) * 1.4; helm.userData.armL.rotation.x = -1.3 + Math.sin(t * 1.3) * 0.5; helm.userData.armR.rotation.x = -1.3 - Math.sin(t * 1.3) * 0.5; helm.userData.foreL.rotation.x = helm.userData.foreR.rotation.x = -0.5; helm.rotation.z = Math.sin(t * 1.3) * 0.08; rain.userData.step(dt, 8.5 + TW, 6, -48, t);
          var fl = (Math.sin(t * 2.1) > 0.93 && Math.sin(t * 60) > 0) ? 1 : 0; cvL.flash(fl * 0.5, fl * 0.6, fl * 0.8); moon.material.opacity = 0.13 + fl * 0.3; if (fl && Math.abs(z + 48) < 30) once('cth' + Math.floor(t * 0.33), function () { K.thud(0.5, 0.2); });
          gems.userData.foreR.rotation.x = -0.6 + Math.sin(t * 1.5) * 0.3; gems.userData.head.rotation.y = Math.sin(t * 0.6) * 0.4; talk(gems, t, false);
          crabs.forEach(function (c) { var a = t * 0.5 + c.ph; c.g.position.set(-6.6 + TL + Math.sin(a) * 1.4, 0.8, -72.6 + Math.cos(a * 1.3) * 1.0); c.g.rotation.y = a * 2; });
          /* the captain: bones, then — a flash — Jack */
          var ct = t - 31.5, sp = 0; capS.visible = ct < 0; jack1.visible = ct >= 0; poof.material.opacity = Math.max(0, 1 - Math.abs(ct) * 1.6) * 0.9; poof.scale.setScalar(8 + Math.max(0, 1 - Math.abs(ct)) * 8);
          capS.userData.armR.rotation.x = -2.3 + Math.sin(t * 2) * 0.2; capS.userData.head.rotation.y = 0.3; talk(capS, t, t > 27.5 && t < 31.2); var ju = jack1.userData; ju.armR.rotation.x = -2.2 + Math.sin(t * 2.6) * 0.25; ju.armL.rotation.z = -0.5 + Math.sin(t * 1.7) * 0.2; ju.head.rotation.y = 0.3 + Math.sin(t * 1.2) * 0.2; jack1.rotation.z = Math.sin(t * 1.4) * 0.05; void sp;
          mist.userData.step(dt, p.x, 0.6, z - 12, t);
          if (t > 0.4) once('a', function () { sec('cove'); bed = A.keep(K.air({ freq: 480, vol: 0.045 })); K.line('🕯️', null, '小船滑进了洞窟。听——有人在笑，可这里只有骨头。', 'The boat slides into the grotto. Listen — someone is laughing, and there is nothing here but bones.'); });
          if (t > 7) once('b', function () { K.line('💀', ['骷髅海盗', 'A skeleton pirate'], '再来一把！输了的，把眼珠子押上——哦，我们都没有了。嘿嘿嘿！', 'Deal again! Loser stakes his eyeballs — oh, none of us has any. Heh heh heh!'); });
          if (t > 14.5) once('c', function () { K.rush(4, 600, 300, 0.12, 0.5); K.line('⛈️', null, '舵手还握着舵轮。他的暴风雨，两百年了还没停。', 'The helmsman still holds his wheel. His storm has not stopped in two hundred years.'); });
          if (t > 21.5) once('d', function () { ['e6', 'g6', 'c7'].forEach(function (n, i) { K.play('glock', n, 0.5, 0.08, i * 0.12); }); K.line('💎', null, '被诅咒的宝石——谁拿走一颗，谁就留在这里数它。', 'Cursed gems — take one, and you stay here to count them.'); });
          if (t > 27.5) once('e', function () { K.line('☠️', SKEL, '找宝藏的？戴维·琼斯把它沉到海底去了。想要——得有个不怕死的带路……', 'After treasure? Davy Jones sank it to the bottom of the sea. To get it — you want a guide who is not afraid to die…'); });
          if (ct > 0) once('f', function () { ['d5', 'a5', 'd6', 'f6', 'a6'].forEach(function (n, i) { K.play('harp', n, 0.6, 0.16, i * 0.07); }); K.rush(0.9, 800, 5000, 0.12, 0.6); sec('jig'); });
          if (t > 32.8) once('g', function () { K.line('🏴‍☠️', JACK, '……比如我！杰克·斯派洛船长。宝藏在海底？那就下去拿。深吸一口气，伙计们！', '…such as me! Captain Jack Sparrow. Treasure at the bottom of the sea? Then down we go and fetch it. Deep breath, mates!'); });
          if (t > 38.6) { A.fadeTo(1, '#063148'); once('h', function () { K.rush(3.5, 1800, 200, 0.3, 0.5); }); } } },
      { n: tr('海底沉船', 'The graveyard of ships'), sc: 'deep', d: 40, car: 1, f: function (t, dt) { var u = t < 6 ? sm(t / 6) * 0.14 : 0.14 + (t - 6) / 34 * 0.84, p = ride(dpath, u, 1.75), z = p.z; pose.p[1] += Math.sin(t * 1.1) * 0.06; pose.roll = Math.sin(t * 0.7) * 0.025;
          gaze(-15, FLOOR + 6, -58, 0.8 * bump(6, 13, t)); gaze(mermaids[0].d.position.x, mermaids[0].d.position.y, mermaids[0].d.position.z, 0.75 * bump(16, 24, t)); gaze(14, FLOOR + 9, -150, 0.85 * bump(27, 38, t));
          lamp(seaL, 0.3, 0.42, 0.5);
          shafts.forEach(function (s, i) { s.material.opacity = 0.05 + Math.sin(t * 0.8 + i) * 0.03; }); bubbles.userData.step(dt, p.x, p.y + 2, z - 8, t); snow.userData.step(dt, p.x, p.y + 2, z - 10, t);
          kelp.forEach(function (js, i) { js.forEach(function (j, n) { j.rotation.z = Math.sin(t * 1.1 + i + n * 0.6) * 0.14; j.rotation.x = Math.cos(t * 0.8 + i * 2 + n * 0.5) * 0.1; }); });
          schools.forEach(function (s) { var a = t * s.sp + s.ph; s.g.position.set(s.c[0], s.c[1] + Math.sin(a * 1.3) * 1.2, s.c[2]); s.g.rotation.y = -a; });
          var sa = t * 0.22 + 1; shark.position.set(Math.cos(sa) * 17, -7 + Math.sin(sa * 2) * 1.5, -100 + Math.sin(sa) * 26); shark.rotation.y = -sa + PI; sharkTail.rotation.y = Math.sin(t * 3) * 0.5; shark.rotation.z = Math.sin(t * 3) * 0.04;
          mermaids.forEach(function (m, i) { var a = t * 0.5 + m.ph, cx = p.x + Math.cos(a) * (5.5 + i), cz = Math.max(-118, Math.min(-70, z - 6)) + Math.sin(a) * (5 + i), near = bump(13, 27, t); m.d.position.set(cx, p.y + 1.4 + Math.sin(a * 1.4) * 1.4 - (1 - near) * 14, cz); m.d.rotation.set(-1.15, -a + PI * 0, 0); m.d.rotation.y = -a; m.tail.forEach(function (j, n) { j.rotation.x = Math.sin(t * 4 - n * 0.8 + i) * 0.28; }); var u2 = m.d.userData; u2.armL.rotation.x = -2.6 + Math.sin(t * 2 + i) * 0.4; u2.armR.rotation.x = -2.6 - Math.sin(t * 2 + i) * 0.4; u2.head.rotation.x = -0.9; });
          var kt = t - 26; kr.position.y = FLOOR - 9 + sm(kt / 4) * 9; tent.forEach(function (q) { q.js.forEach(function (j, n) { var grab = sm((kt - 3) / 5) * (q.i > 1 && q.i < 6 ? 1 : 0.4); j.rotation.x = (n ? -0.13 : 0) + Math.sin(t * 1.2 + q.i + n * 0.6) * 0.12 + grab * 0.1 * (n > 3 ? -1.6 : 0.2); j.rotation.z = Math.cos(t * 0.9 + q.i * 2 + n * 0.5) * 0.14; }); }); if (kt > 3) st.shake = Math.max(st.shake, 0.25);
          if (t > 0.3) once('a', function () { A.fadeTo(0); sec('deep'); if (bed) bed.set(0.06, 280); K.line('🌊', JACK, '瞧，沉下来也没那么糟——空气跟着船走。两边都是沉船，全是找这笔宝藏的。', 'See? Sinking is not so bad — the air comes along with the boat. Wrecks on both sides, every one of them after this treasure.'); });
          if (t > 15) once('b', function () { ['a4', 'd5', 'f5', 'e5', 'd5', 'f5', 'a5'].forEach(function (n, i) { K.play('choir', n, 1.0, 0.1, i * 0.58); }); K.line('🧜', null, '美人鱼！她们绕着船游，唱着歌。别伸手——水手都是这么不见的。', 'Mermaids! They circle the boat, singing. Keep your hands in — that is how sailors go missing.'); });
          if (kt > 0.5) once('c', function () { sec('kraken', true); K.roar(4.5, 0.4, 0.5); K.line('🐙', JACK, '啊。克拉肯。它是琼斯养的——千万别看它的眼睛！往左，往左！', 'Ah. The kraken. Jones keeps it as a pet — whatever you do, do not look it in the eye! Hard to port!'); });
          if (t > 38.6) A.fadeTo(1); } },
      { n: tr('戴维·琼斯的宝库', "Davy Jones' treasure"), sc: 'jones', d: 26, car: 1, f: function (t, dt) { var p = ride(hpath, sm(t / 26) * 0.2 + t / 26 * 0.74, 1.75); pose.p[1] += Math.sin(t * 1.1) * 0.05;
          gaze(3.6, 3.2, -29.6, 0.85 * bump(0.5, 15, t)); gaze(12.4, 3.2, -25.2, 0.85 * bump(15.5, 22, t)); hBub.userData.step(dt, p.x, 3, p.z - 8, t); hShafts[0].material.opacity = 0.1 + Math.sin(t * 0.9) * 0.03;
          lamp(hallL, 0.6, 0.6, 0.42);
          /* Jones plays, then turns on us */
          var turn = sm((t - 8) / 1.6), ju = jones.userData, play = 1 - turn; jones.rotation.y = PI - 0.35 - turn * (PI - 0.5); ju.armL.rotation.x = -1.2 * play + Math.sin(t * 7) * 0.25 * play - turn * 0.3; ju.armR.rotation.x = -1.2 * play + Math.cos(t * 7) * 0.25 * play - turn * 2.3 * bump(9.5, 14, t); ju.foreL.rotation.x = ju.foreR.rotation.x = -0.7 * play - 0.2; ju.head.rotation.z = Math.sin(t * 3.5) * 0.12 * play; ju.head.rotation.y = turn * Math.sin(t * 1.5) * 0.2; jones.position.y = 0.5 + Math.abs(Math.sin(t * 3.5)) * 0.03 * play;
          fishmen.forEach(function (f, i) { K.idle(f, t, i * 2); f.userData.armR.rotation.x = -0.3 - turn * 1.9 + Math.sin(t * 3 + i) * 0.15 * turn; });
          /* Jack creeps up the gold with a chest under his arm */
          var jt = sm((t - 14) / 6), j2 = jack2.userData; jack2.position.set(12.4 + jt * 4.6, 1.9 - jt * 0.6, -25.2 + jt * 3.5); jack2.rotation.y = -2.2 + jt * 3.0; j2.legL.rotation.x = Math.sin(t * 7) * 0.5 * (t > 14 && t < 20 ? 1 : 0); j2.legR.rotation.x = -j2.legL.rotation.x; j2.armL.rotation.x = -0.9; j2.foreL.rotation.x = -1.0; j2.armR.rotation.x = -0.2 + Math.sin(t * 7) * 0.3; j2.head.rotation.y = Math.sin(t * 2.2) * 0.5;
          if (t > 0.3) once('a', function () { A.fadeTo(0); sec('organ', true); K.line('💰', null, '整座山都是金子。那个弹管风琴的——他的胡子在自己动。', 'Whole hills of gold. And the one at the organ — his beard is moving by itself.'); });
          if (t > 8.2) once('b', function () { ['d2', 'a2', 'd3', 'f3', 'a3'].forEach(function (n) { K.play('organ', n, 2.6, 0.13); }); st.shake = 0.5; K.line('🦑', JONES, '谁——敢进我的宝库？！这里每一枚金币，都是拿一条命换的！', 'Who — dares enter my vault?! Every coin here was paid for with a life!'); });
          if (t > 15.5) once('c', function () { K.line('🏴‍☠️', JACK, '嘘——我只拿一小箱。他不会数的……他会数的。划船！快划！', 'Shh — just the one small chest. He will not count them… he will count them. Row! Row!'); });
          if (t > 21) once('d', function () { sec('battle'); K.line('🦑', JONES, '斯派洛！！把飞翔的荷兰人号升上去——开炮！', 'SPARROW!! Raise the Flying Dutchman — open fire!'); });
          if (t > 24.6) A.fadeTo(1, '#dff'); } },
      { n: tr('两船大战', 'The battle'), sc: 'battle', d: 30, car: 1, cut: 1, f: function (t, dt) { var z = L(40, -84, t / 30) + (t < 3 ? (1 - sm(t / 3)) * 6 : 0); pose.p = [Math.sin(t * 0.35) * 1.6, 1.75 + Math.sin(t * 1.9) * 0.14, z]; pose.h = [0, 1.75, z - 12]; pose.t = [0, 3.5, z - 14]; pose.roll = Math.sin(t * 1.2) * 0.05;
          gaze(-15, 12, -34, 0.6 * bump(1, 8, t)); gaze(15, 12, -30, 0.6 * bump(6, 13, t)); var dw = duelJ.getWorldPosition(tmp), w0 = A.w([0, 0, 0]); gaze(dw.x - w0[0], dw.y - w0[1] + 1.2, dw.z - w0[2] + 1, 0.85 * bump(12.5, 23, t)); gaze(0, 6, z - 30, 0.5 * bump(24, 30, t));
          [pearl, dutch].forEach(function (s, i) { s.g.rotation.z = Math.sin(t * 0.7 + i * 2) * 0.035; s.g.position.y = -0.9 + Math.sin(t * 0.9 + i) * 0.25; s.fl.forEach(function (h) { h.material.opacity *= 0.86; }); });
          var k = Math.floor(t * 1.15); once('v' + k, function () { if (t < 1) return; var mine = k % 2 ? pearl : dutch, oth = k % 2 ? dutch : pearl, list = mine.muzzles.map(function (m, i) { return i; }).filter(function (i) { return mine.muzzles[i][3] * (mine === pearl ? 1 : 1) > 0; }); fire(mine, list[(k * 5) % list.length], oth, t); });
          balls.forEach(function (bl, i) { var a = bl.a; if (!a) return; a.t += dt * 1.3; var q = Math.min(1, a.t); bl.m.position.set(a.from[0] + (a.to[0] - a.from[0]) * q, a.from[1] + (a.to[1] - a.from[1]) * q + Math.sin(q * PI) * 5, a.from[2] + (a.to[2] - a.from[2]) * q); if (q >= 1) { bl.a = null; bl.m.position.y = -40; if (a.wet) { var sp = splash[i]; sp.position.set(a.to[0], 0, a.to[2]); sp.userData.t = 0; K.rush(0.9, 2400, 500, 0.2, 0.5); } else K.thud(0.4); } });
          splash.forEach(function (sp) { if (sp.userData.t == null) return; sp.userData.t += dt; var q = sp.userData.t / 1.4; if (q >= 1) { sp.scale.set(0.01, 0.01, 0.01); sp.userData.t = null; return; } sp.scale.set(0.6 + q * 1.4, Math.sin(q * PI) * 1.6 + 0.01, 0.6 + q * 1.4); });
          smoke.forEach(function (s) { s.material.opacity *= 0.975; s.position.y += dt * 1.5; s.scale.x = s.scale.y = s.scale.x + dt * 3; });
          /* the crews shake their steel; Jack and Jones fight along the rail */
          pCrew.forEach(function (c, i) { c.userData.armR.rotation.x = -2.4 + Math.sin(t * 5 + i) * 0.4; c.userData.head.rotation.y = Math.sin(t + i) * 0.4; c.position.y = 3.72 + Math.abs(Math.sin(t * 4 + i)) * 0.06; }); dCrew.forEach(function (c, i) { c.userData.armR.rotation.x = -2.3 + Math.sin(t * 4 + i * 2) * 0.5; talk(c, t, true); });
          var d = Math.sin(t * 5.2), sway = Math.sin(t * 0.9) * 1.6; duelJ.position.z = -1.4 + sway; duelD.position.z = 0.6 + sway; duelJ.userData.armR.rotation.x = -1.5 + d * 0.6; duelJ.userData.foreR.rotation.x = -0.6 - d * 0.4; duelD.userData.armR.rotation.x = -1.5 - d * 0.6; duelD.userData.foreR.rotation.x = -0.6 + d * 0.4; duelJ.userData.armL.rotation.z = -1.2; duelJ.userData.legL.rotation.x = d * 0.3; duelJ.userData.legR.rotation.x = -d * 0.3; duelD.userData.legL.rotation.x = -d * 0.25; duelD.userData.legR.rotation.x = d * 0.25; duelJ.rotation.z = d * 0.05;
          if (d > 0.95) once('cl' + Math.floor(t * 0.83), function () { K.play('glock', 96 + (k % 3) * 2, 0.15, 0.06); });
          bRain.userData.step(dt, pose.p[0], 6, z - 8, t); var fl = (Math.sin(t * 1.7) > 0.95 && Math.sin(t * 50) > 0) ? 1 : 0; bBolt.visible = !!fl; batL.flash(fl * 0.5, fl * 0.55, fl * 0.75); batW.userData.u.uFlash.value.set(fl * 0.5, fl * 0.5, fl * 0.6);
          if (t > 0.2) once('a', function () { A.fadeTo(0); sec('battle', true); if (bed) bed.set(0.1, 900); K.rush(3, 300, 2400, 0.3, 0.5); K.line('⚔️', JACK, '浮上来了！左边黑帆的是我的黑珍珠号，右边长满海草的是飞翔的荷兰人——我们正好在中间！', 'Up we come! Black sails to port — my Black Pearl; all over weed to starboard — the Flying Dutchman. And us, right in the middle!'); });
          if (t > 9) once('b', function () { K.line('💣', null, '炮弹从头顶飞过去了——低头！', 'Cannonballs right over our heads — duck!'); });
          if (t > 14) once('c', function () { K.line('🤺', JACK, '琼斯！一百年才上岸一次的人，剑法果然生疏——哎哟！', 'Jones! Ashore but once in a hundred years, and it shows in your swordplay — ow!'); });
          if (t > 21) once('d', function () { K.line('🦑', JONES, '你欠我的，斯派洛，连本带利！', 'What you owe me, Sparrow — with interest!'); });
          if (t > 27.4) once('e', function () { K.thud(1.4); K.rush(1.6, 500, 3000, 0.35, 0.5); st.shake = 1; K.line('💥', null, '一发炮弹打在船头前面——浪把小船往后掀！', 'A ball lands just ahead of the bow — the wave throws the boat backwards!'); });
          if (t > 29) A.fadeTo(1, '#fff'); } },
      { n: tr('倒退跌落', 'Backwards down the fall'), sc: 'gold', d: 9, car: 1, cut: 1, f: function (t, dt) { var k = t < 2 ? sm(t / 2) * 0.08 : 0.08 + Math.pow((t - 2) / 4.4, 1.7) * 0.92; k = Math.min(1, k); var z = 104 - k * 78, up = z > 28 ? (z - 28) * 0.42 : 0, settle = sm((t - 6.4) / 2);
          pose.p = [0, 1.75 + up + (t > 6.4 ? Math.sin((t - 6.4) * 5) * 0.3 * (1 - settle) : 0), z]; pose.h = [0, 1.75 + (z + 12 > 28 ? (z + 12 - 28) * 0.42 : 0), z + 12]; pose.t = [0, pose.h[1] + 1.5, z + 12]; pose.roll = Math.sin(t * 7) * 0.03 * (1 - settle); st.shake = Math.max(st.shake, t > 2 && t < 6.6 ? 0.7 : 0.1);
          spray.material.opacity = 0.5 * bump(5.6, 7.4, t) + 0.12; spray.userData.step(dt, 0, 2 + up, z - 2, t);
          if (t > 0.1) once('a', function () { A.fadeTo(0); sec('gold'); if (bed) bed.set(0.11, 1300); K.rush(6.5, 500, 2600, 0.35, 0.4); K.line('⬅️', null, '船在往后滑——后面是瀑布！抓紧！', 'We are sliding backwards — and behind us is the fall! Hold on!'); });
          if (t > 6.3) once('b', function () { K.thud(1.2); K.rush(1.8, 3000, 400, 0.4, 0.5); }); } },
      { n: tr('杰克和宝藏', 'Jack and the treasure'), sc: 'gold', d: 19, car: 1, cut: 1, f: function (t, dt) { var z = L(26, -37.5, t / 19), x = -5.6 * sm(t / 9); pose.p = [x, 1.75 + Math.sin(t * 1.2) * 0.05, z]; pose.h = [x - 0.4, 1.75, z - 12]; pose.t = [0, 3.2, z - 14]; gaze(0, 4.9, -46.5, 0.92 * sm(t / 5)); pose.roll = Math.sin(t * 0.9) * 0.012;
          lamp(endL, 0.7, 0.58, 0.38);
          var j = jack3.userData; j.armR.rotation.x = -1.7 + Math.sin(t * 1.6) * 0.25; j.foreR.rotation.x = -0.9 - Math.max(0, Math.sin(t * 0.8)) * 0.7; j.armL.rotation.z = -1.0 + Math.sin(t * 1.3) * 0.2; j.armL.rotation.x = -0.4; j.head.rotation.y = Math.sin(t * 0.7) * 0.4; j.head.rotation.z = Math.sin(t * 1.1) * 0.1; jack3.rotation.z = Math.sin(t * 0.9) * 0.04; j.shinL.rotation.x = 1.3 + Math.sin(t * 2) * 0.2;
          parrot2.rotation.y = Math.sin(t * 1.7) * 0.6; sparkle.userData.step(dt, 0, 4, -44, t); sparkle.material.opacity = 0.6 + Math.sin(t * 6) * 0.3; spray.material.opacity = 0.1; spray.userData.step(dt, 0, 2, 34, t);
          if (t > 1.5) once('a', function () { K.line('🏴‍☠️', JACK, '啊，你们也到了！宝藏嘛——我替大家保管。每人一枚金币，别客气。', 'Ah, you made it too! The treasure — I shall look after it for everyone. One coin each, do not be shy.'); });
          if (t > 9) once('b', function () { ['d5', 'f#5', 'a5', 'd6'].forEach(function (n, i) { K.play('celesta', n, 0.9, 0.16, i * 0.15); }); K.line('🦜', JACK, '下次出海记得叫我——杰克·斯派洛船长。明白？干杯！', 'Next time you put to sea, send for me — Captain Jack Sparrow. Savvy? Drink up!'); }); } }
    ];
    return PH; }, tr('🏴‍☠️ 你从戴维·琼斯手里夺回了沉没的宝藏', '🏴‍☠️ You won back the sunken treasure from Davy Jones'));

    /* ================================================================ the way in, in the park */
    (function () { var x = 215, z = 560, gy = API.groundY(x, z, 62), E = new T.Group(); E.position.set(x, gy, z); API.scene.add(E); var Lm = function (c) { return new T.MeshLambertMaterial({ color: c }); }, r = K.rnd(4), add = function (geo, m, px, py, pz) { var o = new T.Mesh(geo, m); o.position.set(px, py, pz); E.add(o); return o; };
      for (var i = 0; i < 11; i++) { var an = i / 11 * PI * 2; if (Math.cos(an - PI / 2) > 0.75) continue; var h = 4 + r() * 5, m = add(K.rockGeo(3.2 + r() * 1.4, i + 20, 1, 0.3), Lm(K.mix(0x3a4a52, 0x56666c, r())), Math.cos(an) * 5.4, h * 0.45, Math.sin(an) * 5.4 - 1); m.scale.y = h / 4.5; }
      add(K.rockGeo(4, 31, 1, 0.3), Lm(0x44545c), 0, 8.4, -1).scale.set(1.5, 0.8, 1.4);
      add(new T.SphereGeometry(1.2, 14, 10), Lm(0xe6dcc2), 0, 7.6, 3.6); [-0.42, 0.42].forEach(function (px) { add(new T.SphereGeometry(0.3, 8, 6), new T.MeshBasicMaterial({ color: 0x111111 }), px, 7.8, 4.62); }); add(new T.BoxGeometry(1.1, 0.6, 0.6), Lm(0xe6dcc2), 0, 6.6, 4.1);
      [-1, 1].forEach(function (s) { var bn = add(new T.CylinderGeometry(0.17, 0.17, 4.2, 6), Lm(0xe6dcc2), 0, 6.4, 3.9); bn.rotation.z = s * 0.95; add(new T.CylinderGeometry(0.1, 0.1, 3.4, 6), Lm(0x5a3d28), s * 3, 1.7, 4.4); add(new T.SphereGeometry(0.32, 8, 6), new T.MeshBasicMaterial({ color: 0xffb866 }), s * 3, 3.6, 4.4); });
      add(new T.CircleGeometry(2.2, 20), new T.MeshBasicMaterial({ color: 0x07090c }), 0, 2.3, 3.9);
      add(new T.PlaneGeometry(7, 1.6), new T.MeshBasicMaterial({ map: K.paint(700, 160, function (c, w, h2) { c.fillStyle = '#1c1410'; c.fillRect(0, 0, w, h2); c.strokeStyle = '#e0a81e'; c.lineWidth = 8; c.strokeRect(6, 6, w - 12, h2 - 12); c.fillStyle = '#ffd24a'; c.textAlign = 'center'; c.font = '800 34px Georgia,serif'; c.fillText('BATTLE FOR THE SUNKEN TREASURE', w / 2, 60); c.fillStyle = '#f3ecd6'; c.font = '700 38px "PingFang SC",sans-serif'; c.fillText('加勒比海盗 · 沉落宝藏之战', w / 2, 122); }) }), 0, 4.9, 4.7); })();
  });
})(window);
