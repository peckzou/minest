/* Journey to the Center of the Earth (Tokyo DisneySea, Mysterious Island) — rebuilt to the standard of "it's a small
 * world" (2026-11-24): one unbroken cavern the mine car really travels through, lit by its own headlamps.
 *   Nemo's laboratory → the Terravator, 800 fathoms down → base camp and the timbered drift → the crystal cavern →
 *   the forest of giant mushrooms and the gentle creatures that live in it → the shore of the underground sea, with
 *   lightning over the water → an earthquake: the drift ahead falls in and the car swerves into an unexplored tunnel →
 *   the nest of giant eggs → the lava cavern and the Lava Monster → full speed up the vent → out of the side of
 *   Mount Prometheus into daylight, and down to the station.
 * Our own shapes and our own lines; nothing is taken from the attraction itself. Needs ride-kit.js and ride-show.js. */
(function (root) {
  'use strict';
  var K = root.TPRideKit; if (!K || !K.look) return;
  K.ready(function (API) {
    var T = API.THREE, PI = Math.PI, sm = K.sm, tr = K.tr;
    var NEMO = ['尼摩船长', 'Captain Nemo', { pitch: 0.8, rate: 0.9 }];
    var A = K.stage(API, { id: 'center_earth', x: 240, z: 585, oy: 2200, gap: 1400, name: tr('地心探险（Journey to the Center of the Earth）', 'Journey to the Center of the Earth'), icon: '🌋',
      quest: tr('到地心去探险', 'Journey to the center of the Earth'), tip: tr('神秘岛的火山口', 'The volcano on Mysterious Island'), eye: 2.0 });
    var L = A.L, once = A.once, st = A.st, pose = A.pose;
    /* everything below is built the first time someone boards, not when the park loads */
    A.run(function () {
    function sky(g, col, r) { var m = new T.Mesh(new T.SphereGeometry(r || 900, 16, 12), new T.MeshBasicMaterial({ color: col, side: T.BackSide, fog: false, depthWrite: false })); m.renderOrder = -10; g.add(m); return m; }

    /* ================================================================ 1 · Nemo's laboratory */
    var labL = K.look({ tint: [1.0, 0.86, 0.66], fog: 0x1a1410, near: 14, far: 60, amb: 0.5, rim: 0.16 });
    var lab = A.scene('lab', 0); sky(lab, 0x1a1410, 80);
    labL.mesh(lab, function (b) {
      var wood = 0x6b4a30, dark = 0x3d2a1c, brass = 0xc79a3e, iron = 0x3c4048, i;
      b.box(function (x, y, z) { return (Math.floor(x / 0.6) + Math.floor(z / 3)) % 2 ? 0x5a3e28 : 0x664830; }, 14, 0.2, 30, 0, -0.1, -8);            /* plank floor */
      b.box(0x4a3a30, 0.3, 7, 30, -7, 3.5, -8).box(0x4a3a30, 0.3, 7, 30, 7, 3.5, -8).box(0x4a3a30, 14, 7, 0.3, 0, 3.5, -23).box(0x2e241c, 14, 0.3, 30, 0, 7, -8);
      for (i = 0; i < 6; i++) { b.box(dark, 14, 0.35, 0.4, 0, 6.6, 5 - i * 5.4); b.box(dark, 0.4, 7, 0.4, -6.7, 3.5, 5 - i * 5.4).box(dark, 0.4, 7, 0.4, 6.7, 3.5, 5 - i * 5.4); }
      for (i = 0; i < 3; i++) b.cyl(brass, 0.12, 0.12, 30, -4 + i * 4, 6.2, -8, PI / 2, 0, 0, 8);                                                   /* pipes */
      b.box(0x7a2a2a, 5, 0.03, 12, 0, 0.02, -6).box(0xc79a3e, 4.4, 0.035, 11.4, 0, 0.022, -6).box(0x8a3030, 4, 0.04, 11, 0, 0.024, -6);             /* rug */
      /* benches along both walls with flasks, books, a globe and a microscope */
      [-1, 1].forEach(function (s) { for (var k = 0; k < 3; k++) { var z = 1 - k * 7.4, x = s * 5.4;
        b.box(wood, 2.2, 0.12, 4.6, x, 1.0, z); [-1, 1].forEach(function (a) { [-1, 1].forEach(function (c) { b.box(dark, 0.14, 1, 0.14, x + a * 0.9, 0.5, z + c * 2.1); }); }); b.box(dark, 2.0, 0.5, 4.2, x, 0.72, z);
        for (var f = 0; f < 4; f++) { var fc = [0x38e8ff, 0xff8a3c, 0x8affc0, 0xd08aff][(f + k) % 4], fz = z - 1.7 + f * 0.9; b.cyl(0xbfd8e0, 0.05, 0.05, 0.3, x - s * 0.4, 1.5, fz).glow(0.85).sph(fc, 0.17, x - s * 0.4, 1.25, fz).glow(0); }
        for (f = 0; f < 5; f++) b.box([0x8a2a2a, 0x2a5a8a, 0x2f6f3f, 0x8a6a2a, 0x5a2a6a][f], 0.3, 0.09, 0.42, x + s * 0.5, 1.11 + f * 0.09, z + 1.4, 0, f * 0.2, 0);
        if (k === 0) { b.sph(0x2f6f9a, 0.42, x + s * 0.3, 1.75, z - 0.2).torus(brass, 0.47, 0.02, x + s * 0.3, 1.75, z - 0.2, 0.4, 0, 0).cyl(brass, 0.04, 0.2, 0.36, x + s * 0.3, 1.22, z - 0.2); }
        if (k === 1) { b.cyl(brass, 0.07, 0.07, 0.5, x + s * 0.2, 1.4, z, 0.5, 0, 0).cyl(iron, 0.2, 0.22, 0.08, x + s * 0.2, 1.1, z + 0.1).cyl(brass, 0.04, 0.04, 0.6, x + s * 0.2, 1.4, z - 0.25); }
        /* a specimen case: a glass box with a crystal or a small glowing mushroom inside */
        b.box(dark, 1.3, 1.1, 1.3, x, 0.55, z + 3.4).box(brass, 1.36, 0.06, 1.36, x, 1.12, z + 3.4);
        if ((k + (s > 0 ? 1 : 0)) % 2) { b.glow(0.8); for (f = 0; f < 5; f++) b.cyl([0x7fe3ff, 0xc8a0ff][f % 2], 0.02, 0.09, 0.5 + f * 0.08, x - 0.2 + f * 0.1, 1.4 + f * 0.04, z + 3.4 + (f % 2) * 0.12, 0.2 * (f - 2), 0, 0.25 * (f - 2), 6); b.glow(0); }
        else { b.cyl(0xe8dcc0, 0.06, 0.08, 0.4, x, 1.35, z + 3.4).glow(0.75).dome(0xff7ad0, 0.26, x, 1.55, z + 3.4).glow(0); }
      } });
      /* bookshelves on the end wall, either side of the great chart */
      [-1, 1].forEach(function (s) { b.box(dark, 2.6, 5, 0.6, s * 5.2, 2.5, -22.5); for (var r = 0; r < 5; r++) { b.box(wood, 2.5, 0.07, 0.55, s * 5.2, 0.5 + r * 0.95, -22.4); for (var q = 0; q < 11; q++) b.box([0x8a2a2a, 0x2a5a8a, 0x2f6f3f, 0x8a6a2a, 0x5a2a6a, 0x3a3a3a][(q + r) % 6], 0.17, 0.62 + (q % 3) * 0.08, 0.36, s * 5.2 - 1.05 + q * 0.21, 0.86 + r * 0.95, -22.3); } });
      /* Nemo's desk under the chart, his brass voice-pipe above it */
      b.box(wood, 4.4, 0.14, 1.8, 0, 1.05, -20.5).box(dark, 4.0, 0.9, 1.5, 0, 0.5, -20.5).box(0xe8dcc0, 1.6, 0.02, 1.1, -0.6, 1.13, -20.4, 0, 0.2, 0).box(0xe8dcc0, 1.2, 0.02, 0.9, 1.0, 1.135, -20.6, 0, -0.3, 0);
      b.cyl(brass, 0.05, 0.05, 1.5, 2.6, 4.4, -22.4).cone(brass, 0.55, 0.9, 2.6, 3.5, -21.9, PI / 2 + 0.5, 0, 0, 14).torus(brass, 0.55, 0.05, 2.6, 3.26, -21.5, 0.5, 0, 0);
      /* the drilling machine model in the middle of the room */
      b.box(dark, 2.4, 0.5, 2.4, 0, 0.25, -11).cyl(iron, 0.7, 0.8, 1.5, 0, 1.25, -11, 0, 0, PI / 2, 14).cone(brass, 0.72, 1.6, -1.5, 1.25, -11, 0, 0, PI / 2, 14);
      for (i = 0; i < 6; i++) b.torus(0x8a6a2a, 0.55 - i * 0.08, 0.05, -1.0 - i * 0.22, 1.25, -11, 0, PI / 2, 0);
      b.cyl(iron, 0.3, 0.3, 0.3, 0.9, 0.75, -10.3, PI / 2, 0, 0, 12).cyl(iron, 0.3, 0.3, 0.3, 0.9, 0.75, -11.7, PI / 2, 0, 0, 12).cyl(brass, 0.12, 0.12, 0.9, 0.6, 2.3, -11);
      /* hanging lamps */
      for (i = 0; i < 4; i++) { b.cyl(iron, 0.02, 0.02, 1.6, 0, 5.9, 2 - i * 6.5).cone(brass, 0.5, 0.35, 0, 5.05, 2 - i * 6.5, 0, 0, 0, 12).glow(1).sph(0xffe2a0, 0.16, 0, 4.9, 2 - i * 6.5).glow(0); }
    });
    for (var li = 0; li < 4; li++) K.halo(lab, 0xffc878, 3.2, 0, 4.9, 2 - li * 6.5, 0.5);
    /* the chart of the descent, painted */
    K.flat(lab, 6.2, 3.6, K.paint(620, 360, function (c, w, h) {
      c.fillStyle = '#d9c8a0'; c.fillRect(0, 0, w, h); c.strokeStyle = '#6b4a30'; c.lineWidth = 8; c.strokeRect(4, 4, w - 8, h - 8);
      var bands = ['#b89a6a', '#a07c50', '#8a6a4a', '#6f5a4a', '#5a4a48', '#7a3a2a']; for (var i = 0; i < 6; i++) { c.fillStyle = bands[i]; c.beginPath(); c.moveTo(20, 90 + i * 42); for (var x = 20; x <= w - 20; x += 20) c.lineTo(x, 90 + i * 42 + Math.sin(x * 0.02 + i) * 8); c.lineTo(w - 20, h - 20); c.lineTo(20, h - 20); c.fill(); }
      c.fillStyle = '#6a8fb0'; c.fillRect(20, 20, w - 40, 40); c.fillStyle = '#7a6a5a'; c.beginPath(); c.moveTo(220, 60); c.lineTo(310, 14); c.lineTo(400, 60); c.fill();
      c.strokeStyle = '#2a1a12'; c.lineWidth = 3; c.setLineDash([8, 6]); c.beginPath(); c.moveTo(310, 30); c.lineTo(310, 150); c.bezierCurveTo(300, 220, 420, 230, 470, 300); c.stroke(); c.setLineDash([]);
      c.fillStyle = '#ff7a1a'; c.beginPath(); c.arc(470, 310, 14, 0, 7); c.fill(); c.fillStyle = '#7fe3ff'; [[250, 170], [360, 200]].forEach(function (q) { c.beginPath(); c.moveTo(q[0], q[1] - 12); c.lineTo(q[0] + 8, q[1]); c.lineTo(q[0], q[1] + 12); c.lineTo(q[0] - 8, q[1]); c.fill(); });
      c.fillStyle = '#2a1a12'; c.font = 'italic 700 22px Georgia,serif'; c.fillText('Voyage au centre de la Terre', 28, 48); c.font = '700 13px Georgia,serif'; c.fillText('TERRAVATOR', 322, 110); c.fillText('CRYSTALS', 200, 150); c.fillText('FUNGI', 372, 186); c.fillText('SEA', 120, 250); c.fillText('?', 490, 300);
    }), 0, 3.9, -22.8, 0, { transparent: false });
    var crew = [K.doll(labL, lab, -4.3, 0, -5.2, PI / 2 + 0.4, { top: 0x2a4a6a, bot: 0x22303a, coat: 0x2a4a6a, belt: 0x3a2a1c, hair: 0x3a2a1c, hat: 'cap', hatC: 0x22303a, beard: 0x3a2a1c, cuff: 0xc79a3e }),
                K.doll(labL, lab, 4.2, 0, -13, -PI / 2 - 0.3, { top: 0xe8e2d0, bot: 0x3a3028, coat: 0xe8e2d0, hair: 0x8a8a8a, beard: 0xb0b0b0, skin: 0xd9a888, h: 1.68 })];
    crew[1].userData.foreR.rotation.x = -1.3;

    /* ================================================================ 2 · the Terravator */
    var liftL = K.look({ tint: [1.0, 0.8, 0.6], fog: 0x0c0a09, near: 6, far: 30, amb: 0.45, rim: 0.2 });
    var lift = A.scene('lift', 1); sky(lift, 0x0c0a09, 60);
    liftL.mesh(lift, function (b) {
      var brass = 0xc79a3e, iron = 0x3c4048, i;
      b.box(function (x, y, z) { return (Math.floor(x / 0.25) + Math.floor(z / 0.25)) % 2 ? 0x2a2c32 : 0x40444c; }, 5, 0.12, 5, 0, -0.06, 0).box(iron, 5, 0.14, 5, 0, 4.3, 0);
      for (i = 0; i < 4; i++) { var a = i * PI / 2 + PI / 4; b.box(brass, 0.22, 4.4, 0.22, Math.cos(a) * 3.4, 2.2, Math.sin(a) * 3.4); }
      for (i = 0; i < 9; i++) { b.box(brass, 0.07, 4.4, 0.07, -2.4 + i * 0.6, 2.2, -2.45); b.box(brass, 0.07, 4.4, 0.07, -2.45, 2.2, -2.4 + i * 0.6).box(brass, 0.07, 4.4, 0.07, 2.45, 2.2, -2.4 + i * 0.6); }
      [0.9, 2.9].forEach(function (y) { b.box(brass, 5, 0.1, 0.1, 0, y, -2.45).box(brass, 0.1, 0.1, 5, -2.45, y, 0).box(brass, 0.1, 0.1, 5, 2.45, y, 0); });
      b.cyl(iron, 0.5, 0.5, 0.12, 1.7, 2.2, -2.36, PI / 2, 0, 0, 20).cyl(0xe8dcc0, 0.44, 0.44, 0.13, 1.7, 2.2, -2.35, PI / 2, 0, 0, 20); for (i = 0; i < 8; i++) b.box(0x2a1a12, 0.03, 0.1, 0.02, 1.7 + Math.cos(i * 0.6 - 0.6) * 0.36, 2.2 + Math.sin(i * 0.6 - 0.6) * 0.36, -2.27);
      b.cone(brass, 0.42, 0.3, 0, 4.05, 0, 0, 0, 0, 12).glow(1).sph(0xffd9a0, 0.14, 0, 3.92, 0).glow(0);
      b.box(iron, 0.5, 1.1, 0.4, -1.9, 0.55, -2.1).cyl(brass, 0.04, 0.04, 0.7, -1.9, 1.4, -2.1, 0.4, 0, 0).glow(0.9).sph(0xff5a3c, 0.08, -1.9, 1.72, -2.24).glow(0);
    });
    K.halo(lift, 0xffb060, 3, 0, 3.9, 0, 0.5);
    var needle = liftL.mesh(lift, function (b) { b.box(0xb3202a, 0.04, 0.4, 0.02, 0, 0.16, 0); }, 1.7, 2.2, -2.26);
    /* the shaft wall sliding past: painted strata on three sides, the texture scrolled */
    var strataTex = K.paint(256, 1024, function (c, w, h) { var cols = ['#6b5236', '#8a5a35', '#4a3a2c', '#9a6b3f', '#3a2c20', '#7a4a30', '#5a5048', '#3a3438']; for (var y = 0; y < h; y += 16) { c.fillStyle = cols[(y / 16 * 7 + (y > 512 ? 3 : 0)) % 8 | 0]; c.fillRect(0, y, w, 16); }
      for (var i = 0; i < 500; i++) { c.fillStyle = 'rgba(' + (i % 2 ? '0,0,0' : '255,230,190') + ',' + (0.06 + (i % 5) * 0.03) + ')'; c.fillRect((i * 97) % w, (i * 53) % h, 6 + (i % 9) * 5, 2 + (i % 3)); }
      c.fillStyle = '#7fe3ff'; for (i = 0; i < 9; i++) { var x = (i * 71) % w, y2 = 600 + (i * 131) % 400; c.beginPath(); c.moveTo(x, y2 - 9); c.lineTo(x + 5, y2); c.lineTo(x, y2 + 9); c.lineTo(x - 5, y2); c.fill(); } });
    strataTex.wrapS = strataTex.wrapT = T.RepeatWrapping; strataTex.repeat.set(1, 0.25);
    [[0, -3.2, 0], [-3.2, 0, PI / 2], [3.2, 0, -PI / 2]].forEach(function (q) { K.flat(lift, 8, 12, strataTex, q[0], 2.2, q[1], q[2], { transparent: false, color: 0x9a8a7a }); });
    var sparks = K.motes(lift, { n: 40, box: [6, 8, 6], col: 0xffc060, size: 0.09, vel: [0, 9, 0], seed: 3 });

    /* ================================================================ 3 · the caverns */
    var cvL = K.look({ tint: [1.0, 0.82, 0.62], fog: 0x070505, near: 10, far: 115, amb: 0.3, rim: 0.1, underY: -40 });
    var cv = A.scene('cave', 2); var cvSky = sky(cv, 0x070505, 1100);
    var path = K.path([[0, 2, 14], [0, 2, 0], [0, 2, -30], [8, 1, -70], [14, 0, -110], [6, -3, -150], [-10, -5, -195], [-18, -6, -240], [-8, -7, -285], [10, -8, -325], [20, -8, -370], [14, -9, -410], [-6, -12, -440],
      [-22, -16, -475], [-24, -20, -520], [-8, -22, -560], [10, -22, -600], [16, -18, -640], [10, 0, -690], [0, 30, -740], [0, 70, -795], [0, 100, -845]]);
    var NP = 1400, PT = path.getSpacedPoints(NP), up = new T.Vector3(0, 1, 0);
    function idx(z) { var lo = 0, hi = NP; while (lo < hi) { var m = (lo + hi) >> 1; if (PT[m].z > z) lo = m + 1; else hi = m; } return Math.min(NP, lo); }
    function at(z) { var i = idx(z), p = PT[i], q = PT[Math.min(NP, i + 1)], t = new T.Vector3().subVectors(q, PT[Math.max(0, i - 1)]).normalize(), s = new T.Vector3().crossVectors(t, up).normalize(); return { p: p, t: t, s: s, u: i / NP }; }
    function spot(z, side, off, dy) { var a = at(z); return [a.p.x + a.s.x * side * off, a.p.y + (dy || 0), a.p.z + a.s.z * side * off]; }
    /* what each stretch of the cavern is: radius, rock colour */
    var ZONES = [[20, -45, 5.2, 0x6a5644, 'camp'], [-45, -165, 12, 0x4c4a64, 'crystal'], [-165, -305, 15, 0x3e4c3c, 'forest'], [-305, -402, 13, 0x3a4652, 'sea'], [-402, -440, 6.5, 0x4a3c34, 'quake'],
      [-440, -535, 5.6, 0x3a2e2c, 'eggs'], [-535, -645, 21, 0x3c1e16, 'lava'], [-645, -860, 5, 0x321c16, 'vent']];
    function zone(z) { for (var i = 0; i < ZONES.length; i++) if (z <= ZONES[i][0] && z > ZONES[i][1]) return ZONES[i]; return ZONES[ZONES.length - 1]; }
    function rad(z) { var a = zone(z), k = Math.min(1, Math.min(a[0] - z, z - a[1]) / 14); return 5 + (a[2] - 5) * sm(k); }
    /* the rock shell, in lengths so that what is out of sight is not drawn */
    var rnd = K.rnd(11);
    for (var c0 = 20; c0 > -860; c0 -= 55) (function (z0) {
      var m = cvL.mesh(cv, function (b) {
        for (var z = z0; z > z0 - 55; z -= 5) { var a = at(z), zn = zone(z), r = rad(z), n = Math.max(8, Math.round(r * 1.25)), sea = zn[4] === 'sea', lava = zn[4] === 'lava';
          for (var k = 0; k < n; k++) { var an = k / n * PI * 2 + rnd() * 0.3, cx = Math.cos(an), sy = Math.sin(an), rr = r * (1 + rnd() * 0.25);
            if (sea && cx > 0.15) { if (sy < 0.5) continue; rr = r * 2.2; } if (lava && sy < -0.3) rr *= 1.25;
            var size = Math.max(2.4, rr * 0.48) * (0.85 + rnd() * 0.5);
            b.rock(K.shade(zn[3], 0.86 + rnd() * 0.24), size, a.p.x + a.s.x * cx * (rr + size * 0.95), a.p.y + 1.6 + sy * (rr * (sy < 0 ? 0.5 : 0.8) + size * 0.95) - (sy < 0 ? 1.6 : 0), a.p.z + a.s.z * cx * (rr + size * 0.95), 1 + Math.floor(rnd() * 900), 1, 0.8 + rnd() * 0.4, 1, size > 4.5 ? 2 : 1, 0.26); }
          /* stalactites, and veins of lava in the vent */
          if (zn[4] !== 'camp' && zn[4] !== 'vent') for (k = 0; k < 2; k++) { var sx = (rnd() - 0.5) * r * 1.3, h = 1.5 + rnd() * r * 0.35; b.cone(K.shade(zn[3], 1.1), 0.3 + h * 0.09, h, a.p.x + a.s.x * sx, a.p.y + 1.6 + r * 0.8 - h / 2, a.p.z + a.s.z * sx, PI, 0, 0, 7); }
          if (zn[4] === 'vent' || zn[4] === 'lava') { b.glow(0.9); for (k = 0; k < (zn[4] === 'vent' ? 3 : 1); k++) { var an2 = rnd() * PI * 2, r2 = r * (zn[4] === 'vent' ? 1.02 : 1.2); b.box(k % 2 ? 0xff5a1a : 0xffa030, 0.35, 0.25, 3.6 + rnd() * 3, a.p.x + a.s.x * Math.cos(an2) * r2, a.p.y + 1.6 + Math.sin(an2) * r2 * 0.8, a.p.z, rnd() - 0.5, Math.atan2(a.t.x, a.t.z), an2); } b.glow(0); }
        }
      });
      m.geometry.computeBoundingSphere(); m.frustumCulled = true;
    })(c0);
    /* the track: rails on sleepers all the way, timber trestles where the floor falls away */
    cvL.mesh(cv, function (b) { K.rails(b, path, { tie: 0x4a3626, rail: 0x9a9080, gauge: 1.5, step: 1.2, dy: 0.02 });
      for (var z = 10; z > -645; z -= 6) { var a = at(z), zn = zone(z)[4]; if (zn === 'camp' || zn === 'quake' || zn === 'eggs') continue; var drop = zn === 'lava' ? 7 : zn === 'sea' ? 3.2 : 2.4;
        [-1, 1].forEach(function (s) { b.box(0x4a3626, 0.28, drop, 0.28, a.p.x + a.s.x * s * 1.1, a.p.y - drop / 2, a.p.z + a.s.z * s * 1.1); }); b.box(0x3d2c20, 2.6, 0.2, 0.24, a.p.x, a.p.y - 0.25, a.p.z, 0, Math.atan2(a.t.x, a.t.z), 0).box(0x3d2c20, 3.2, 0.16, 0.16, a.p.x, a.p.y - drop * 0.55, a.p.z, 0, Math.atan2(a.t.x, a.t.z), 0.5); } });

    /* ---- base camp and the timbered drift */
    var lampAt = [];
    cvL.mesh(cv, function (b) { var wood = 0x6b4a30, dark = 0x3d2a1c, brass = 0xc79a3e, iron = 0x3c4048, i;
      b.box(0x4a3e34, 9, 0.3, 26, 0, 0.75, 4);                                                                                 /* station floor */
      for (var z = 12; z > -46; z -= 6.5) { var a = at(z), ry = Math.atan2(a.t.x, a.t.z);
        [-1, 1].forEach(function (s) { b.box(wood, 0.4, 5.6, 0.4, a.p.x + a.s.x * s * 3.3, a.p.y + 1.4, a.p.z + a.s.z * s * 3.3); b.box(dark, 0.3, 1.8, 0.3, a.p.x + a.s.x * s * 2.7, a.p.y + 3.6, a.p.z + a.s.z * s * 2.7, 0, ry, s * 0.75); });
        b.box(wood, 7.4, 0.45, 0.45, a.p.x, a.p.y + 4.2, a.p.z, 0, ry, 0).cyl(iron, 0.015, 0.015, 0.7, a.p.x, a.p.y + 3.7, a.p.z).cone(brass, 0.3, 0.2, a.p.x, a.p.y + 3.4, a.p.z, 0, 0, 0, 10).glow(1).sph(0xffd9a0, 0.11, a.p.x, a.p.y + 3.28, a.p.z).glow(0); lampAt.push([a.p.x, a.p.y + 3.28, a.p.z]); }
      for (i = 0; i < 9; i++) { var q = spot(8 - i * 5.5, i % 2 ? 1 : -1, 3.6 + (i % 3) * 0.3, 0.9); if (i % 3 === 0) { b.cyl(0x7a5a3a, 0.42, 0.42, 1.1, q[0], q[1] + 0.55, q[2], 0, 0, 0, 12).torus(iron, 0.43, 0.03, q[0], q[1] + 0.3, q[2], PI / 2, 0, 0).torus(iron, 0.43, 0.03, q[0], q[1] + 0.8, q[2], PI / 2, 0, 0); }
        else { b.box(wood, 1.1, 0.9, 1.1, q[0], q[1] + 0.45, q[2], 0, i, 0).box(dark, 1.16, 0.08, 1.16, q[0], q[1] + 0.9, q[2], 0, i, 0); if (i % 3 === 1) b.box(wood, 0.8, 0.7, 0.8, q[0], q[1] + 1.3, q[2], 0, i * 2, 0); } }
      [[-3.7, 1.0, 8], [3.7, 1.0, -14]].forEach(function (q, k) { b.box(wood, 0.1, 0.9, 0.5, q[0], q[1] + 0.4, q[2]); for (var j = 0; j < 3; j++) b.box(0x8a8f98, 0.06, 1.3, 0.06, q[0] + (k ? -0.2 : 0.2), q[1] + 0.6, q[2] - 0.3 + j * 0.3, 0, 0, (k ? 1 : -1) * 0.25).box(iron, 0.3, 0.12, 0.08, q[0] + (k ? -0.38 : 0.38), q[1] + 1.2, q[2] - 0.3 + j * 0.3); });   /* picks and shovels */
      b.cyl(iron, 0.1, 0.1, 60, -3.9, 4.5, -16, PI / 2, 0, 0, 8).cyl(brass, 0.07, 0.07, 60, -3.9, 4.25, -16, PI / 2, 0, 0, 8);
      /* the barrier across the old drift, which the earthquake will bring down */
    });
    lampAt.forEach(function (q) { K.halo(cv, 0xffc070, 2.6, q[0], q[1], q[2], 0.45); });

    /* ---- the crystal cavern */
    var CR = [0x7fe3ff, 0xc8a0ff, 0xfff0a0, 0x8affc0, 0xff9ad0];
    function crystal(b, x, y, z, h, r, col, rx, rz) { b.push(x, y, z, 0, 1, rx, rz).glow(0.55).cyl(col, r * 0.82, r, h, 0, h / 2, 0, 0, 0, 0, 6).cone(K.shade(col, 1.25), r * 0.82, r * 1.5, 0, h + r * 0.75, 0, 0, 0, 0, 6).glow(0).pop(); }
    cvL.mesh(cv, function (b) { var r = K.rnd(5);
      for (var i = 0; i < 46; i++) { var z = -52 - i * 2.5, side = i % 2 ? 1 : -1, zz = rad(z), top = i % 5 === 4, off = top ? r() * 4 : 3.2 + r() * (zz - 5), q = spot(z, side, off, top ? zz * 0.75 : -1.4 - r() * 1.2), col = CR[Math.floor(r() * 5)], n = 4 + Math.floor(r() * 5), big = 0.6 + r() * 1.5 + (i % 9 === 0 ? 2.2 : 0);
        b.rock(0x3a3a50, 1.2 * big, q[0], q[1] - (top ? -0.6 : 0.5), q[2], i + 3, 1.3, 0.5, 1.3);
        for (var k = 0; k < n; k++) crystal(b, q[0] + (r() - 0.5) * big, q[1], q[2] + (r() - 0.5) * big, (1.2 + r() * 3) * big, (0.16 + r() * 0.22) * big, K.mix(col, 0xffffff, r() * 0.3), (top ? PI : 0) + (r() - 0.5) * 0.9, (r() - 0.5) * 0.9); }
      /* three giants the track goes between */
      [[-84, 1, 5.5, 9, 0x7fe3ff, 0.35], [-104, -1, 6, 11, 0xc8a0ff, -0.3], [-128, 1, 5, 8, 0x8affc0, 0.5], [-140, -1, 7, 12, 0xfff0a0, -0.45]].forEach(function (g) { var q = spot(g[0], g[1], g[2], -3); crystal(b, q[0], q[1], q[2], g[3], 1.1, g[4], 0, g[5]); crystal(b, q[0] + 1.4, q[1], q[2] + 1, g[3] * 0.6, 0.7, K.mix(g[4], 0xffffff, 0.3), 0.3, g[5] * 1.6); crystal(b, q[0] - 1.2, q[1], q[2] - 0.8, g[3] * 0.45, 0.6, g[4], -0.4, g[5] * 0.5); });
    });
    [[-84, 1, 5.5, 0x7fe3ff], [-104, -1, 6, 0xc8a0ff], [-128, 1, 5, 0x8affc0], [-140, -1, 7, 0xfff0a0], [-66, -1, 6, 0xff9ad0], [-118, 1, 8, 0x7fe3ff]].forEach(function (g) { var q = spot(g[0], g[1], g[2], 1.5); K.halo(cv, g[3], 9, q[0], q[1] + 2, q[2], 0.16); });
    var glints = K.motes(cv, { n: 160, box: [26, 14, 40], col: 0xdff6ff, size: 0.16, vel: [0, 0.1, 0], drift: 0.25, seed: 9 });

    /* ---- the mushroom forest */
    var MC = [0xff5ad8, 0x38e8ff, 0xffa63c, 0xa0ff6a, 0xc88aff];
    function mushroom(b, x, y, z, h, cr, col, lean, seed) { var r = K.rnd(seed + 1);
      b.push(x, y, z, seed, 1, lean, lean * 0.6); b.lathe(function (px, py, pz, ly) { return K.shade(0xe8dcc0, 0.7 + ly / h * 0.4); }, [[cr * 0.2, 0], [cr * 0.13, h * 0.3], [cr * 0.1, h * 0.8], [cr * 0.14, h]], 0, 0, 0, 10);
      b.torus(0xf4ecd8, cr * 0.2, cr * 0.04, 0, h * 0.72, 0, PI / 2, 0, 0);
      b.glow(0.9).disc(K.mix(col, 0xffffff, 0.55), cr * 0.96, 0, h + 0.02, 0, PI / 2).glow(0.3).dome(col, cr, 0, h, 0, 0.5, 0, 0, 0, 1, 0.62, 1);
      b.glow(0.8); for (var i = 0; i < 9; i++) { var a = r() * PI * 2, d = r() * 0.8; b.sph(K.mix(col, 0xffffff, 0.7), cr * (0.05 + r() * 0.07), Math.cos(a) * cr * d, h + cr * 0.62 * Math.sqrt(1 - d * d) * 0.98, Math.sin(a) * cr * d, 1, 0.5, 1); } b.glow(0).pop(); }
    var capHalos = [];
    cvL.mesh(cv, function (b) { var r = K.rnd(21);
      for (var i = 0; i < 64; i++) { var z = -172 - i * 2.05, side = i % 2 ? 1 : -1, R0 = rad(z), big = i % 7 === 3, off = 3.4 + r() * (R0 - 5.5), h = big ? 7 + r() * 4 : 1.2 + r() * 3.4, cr = big ? 3.6 + r() * 1.6 : 0.7 + r() * 1.4, col = MC[Math.floor(r() * 5)], q = spot(z, side, big ? Math.max(off, 6) : off, -2.6 - r() * 0.6);
        mushroom(b, q[0], q[1], q[2], h, cr, col, (r() - 0.5) * 0.3, i); if (big) capHalos.push([q[0], q[1] + h, q[2], col, cr]);
        /* a tuft of tiny glowing fungi and curled ferns at its foot */
        b.glow(0.85); for (var k = 0; k < 5; k++) { var fx = q[0] + (r() - 0.5) * 3, fz = q[2] + (r() - 0.5) * 3, fh = 0.2 + r() * 0.5; b.cyl(0xe8dcc0, 0.03, 0.04, fh, fx, q[1] + fh / 2 + 0.3, fz).dome(MC[(i + k) % 5], 0.13 + r() * 0.1, fx, q[1] + fh + 0.3, fz); } b.glow(0);
        if (i % 3 === 0) for (k = 0; k < 4; k++) { var fa = r() * PI * 2; b.tube(0x3f7a4a, [[q[0] + 1.6, q[1] + 0.2, q[2]], [q[0] + 1.6 + Math.cos(fa) * 0.5, q[1] + 1.0, q[2] + Math.sin(fa) * 0.5], [q[0] + 1.6 + Math.cos(fa) * 1.1, q[1] + 1.3, q[2] + Math.sin(fa) * 1.1], [q[0] + 1.6 + Math.cos(fa) * 1.3, q[1] + 1.0, q[2] + Math.sin(fa) * 1.3]], 0.07, 0.02, 10, 5); } }
      /* hanging vines with glowing buds */
      for (i = 0; i < 26; i++) { var zv = -176 - i * 4.8, qv = spot(zv, i % 2 ? 1 : -1, r() * 7, rad(zv) * 0.72), len = 2.5 + r() * 4; b.tube(0x2f5a3a, [[qv[0], qv[1], qv[2]], [qv[0] + 0.4, qv[1] - len * 0.5, qv[2] + 0.3], [qv[0] - 0.2, qv[1] - len, qv[2]]], 0.07, 0.03, 8, 5).glow(0.9).sph(MC[i % 5], 0.14, qv[0] - 0.2, qv[1] - len - 0.1, qv[2]).glow(0); }
    });
    capHalos.forEach(function (q) { K.halo(cv, q[3], q[4] * 4.2, q[0], q[1] + 0.4, q[2], 0.22); });
    var spores = K.motes(cv, { n: 220, box: [30, 16, 44], col: 0xc8ff9a, size: 0.2, vel: [0, 0.5, 0], drift: 0.4, seed: 4 });
    /* the creatures: round-eyed and curious, peeping from behind the mushrooms as the car goes by */
    var critters = [];
    [[-196, -1, 3.6, 0xf2c14e], [-214, 1, 3.4, 0x7fd8c8], [-232, -1, 3.8, 0xff9a6a], [-250, 1, 3.3, 0xb9a0ff], [-266, -1, 3.5, 0x8fe07a], [-284, 1, 3.6, 0xf2c14e], [-222, 1, 6.2, 0xff9a6a], [-258, -1, 6.4, 0x7fd8c8]].forEach(function (c, i) {
      var q = spot(c[0], c[1], c[2], -2.2), g = new T.Group(); g.position.set(q[0], q[1], q[2]); cv.add(g); var a = at(c[0]); g.rotation.y = Math.atan2(-a.s.x * c[1], -a.s.z * c[1]);
      var body = cvL.mesh(g, function (b) { var col = c[3]; b.glow(0.25).sph(col, 0.55, 0, 0.55, 0, 1, 0.95, 1.25, 14).sph(K.mix(col, 0xffffff, 0.5), 0.4, 0, 0.42, 0.22, 1, 0.8, 1).glow(0);
        [-1, 1].forEach(function (s) { b.sph(col, 0.16, s * 0.34, 0.14, 0.3, 1, 0.6, 1.4).sph(col, 0.16, s * 0.36, 0.14, -0.3, 1, 0.6, 1.4); });
        b.tube(col, [[0, 0.5, -0.6], [0, 0.7, -1.1], [0.2, 1.0, -1.4], [0.5, 1.0, -1.3]], 0.16, 0.04, 10, 6).glow(0.9).sph(0xfff4a0, 0.1, 0.5, 1.0, -1.3).glow(0); });
      var head = new T.Group(); head.position.set(0, 1.05, 0.5); g.add(head);
      cvL.mesh(head, function (b) { var col = c[3]; b.glow(0.25).sph(col, 0.46, 0, 0, 0, 1.1, 0.95, 1, 14).glow(0);
        [-1, 1].forEach(function (s) { b.glow(0.6).sph(0xffffff, 0.19, s * 0.2, 0.08, 0.34).glow(0.3).sph(0x161616, 0.1, s * 0.2, 0.08, 0.48).glow(1).sph(0xffffff, 0.035, s * 0.2 + 0.04, 0.13, 0.56).glow(0);
          b.cone(col, 0.11, 0.42, s * 0.34, 0.42, -0.05, 0, 0, -s * 0.5, 6).tube(col, [[s * 0.12, 0.38, 0.1], [s * 0.2, 0.75, 0.2], [s * 0.34, 0.9, 0.42]], 0.03, 0.02, 6, 5).glow(1).sph(0xa0ffe0, 0.07, s * 0.34, 0.9, 0.42).glow(0); });
        b.sph(0x3a2a2a, 0.05, 0, -0.08, 0.45).box(0x7a3a3a, 0.16, 0.025, 0.02, 0, -0.2, 0.42); });
      var lids = cvL.mesh(head, function (b) { [-1, 1].forEach(function (s) { b.sph(c[3], 0.2, s * 0.2, 0.1, 0.345, 1, 1, 1); }); }); lids.scale.y = 0.01;
      critters.push({ g: g, head: head, lids: lids, y: q[1], z: c[0], ph: i * 1.7, hide: i > 5 }); });
    /* the glowing flyers */
    var bugs = [];
    for (var bi = 0; bi < 14; bi++) (function (i) { var q = spot(-186 - i * 8, i % 2 ? 1 : -1, 1.8 + (i % 3), 1.2 + (i % 4) * 0.8), g = new T.Group(); g.position.set(q[0], q[1], q[2]); cv.add(g);
      cvL.mesh(g, function (b) { b.glow(0.9).sph(0xa0ffd0, 0.16, 0, 0, 0, 1, 0.8, 1.5).glow(0.4).sph(0x2a3a3a, 0.08, 0, 0.02, 0.2); });
      var w1 = cvL.mesh(g, function (b) { b.glow(0.5).plane(0xe6fff4, 0.5, 0.24, 0.27, 0, 0, -PI / 2, 0, 0); }), w2 = cvL.mesh(g, function (b) { b.glow(0.5).plane(0xe6fff4, 0.5, 0.24, -0.27, 0, 0, -PI / 2, 0, 0); });
      K.halo(g, 0x8affc0, 1.4, 0, 0, 0, 0.5); bugs.push({ g: g, w1: w1, w2: w2, p: q, ph: i * 2.3 }); })(bi);

    /* ---- the underground sea */
    var seaP = spot(-355, 1, 60, -5.4), seaW = K.water(cv, 260, 220, { a: 0x031520, b: 0x15566e, s: 0xbfefff, fog: 0x05101a, near: 40, far: 200 }, seaP[0] + 40, seaP[1], seaP[2]);
    var seaCyc = K.cyc(cv, 175, 110, K.paint(1024, 512, function (c, w, h) {
      var gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#05080c'); gr.addColorStop(0.45, '#0d2a3a'); gr.addColorStop(0.62, '#2a6a80'); gr.addColorStop(0.66, '#0a2630'); gr.addColorStop(1, '#040c10'); c.fillStyle = gr; c.fillRect(0, 0, w, h);
      c.fillStyle = 'rgba(160,230,255,.10)'; for (var i = 0; i < 9; i++) { c.beginPath(); c.ellipse(60 + i * 120, 300, 90, 20, 0, 0, 7); c.fill(); }
      c.fillStyle = '#030507'; for (i = 0; i < 46; i++) { var x = i * 23 + (i % 3) * 5, l = 60 + ((i * 53) % 150); c.beginPath(); c.moveTo(x - 14, 0); c.lineTo(x, l); c.lineTo(x + 14, 0); c.fill(); }
      for (i = 0; i < 16; i++) { var bx = i * 66, bh = 30 + (i * 37) % 60; c.beginPath(); c.moveTo(bx - 40, 340); c.lineTo(bx, 340 - bh); c.lineTo(bx + 44, 340); c.fill(); }
      c.fillStyle = 'rgba(120,220,255,.5)'; for (i = 0; i < 60; i++) c.fillRect((i * 131) % w, 318 + (i * 17) % 20, 10 + (i % 4) * 6, 1.5);
    }), seaP[1] + 40, PI * 1.1, -PI * 0.05); seaCyc.position.x = seaP[0] - 30; seaCyc.position.z = seaP[2];
    var bolts = []; for (var bo = 0; bo < 3; bo++) (function (i) { var x = seaP[0] + 30 + i * 34, z = seaP[2] - 40 + i * 45, r = K.rnd(40 + i), pts = [], y = seaP[1] + 62, xx = x; for (var k = 0; k < 9; k++) { pts.push([xx, y, z + (r() - 0.5) * 5]); y -= 7.6; xx += (r() - 0.5) * 12; }
      var m = cvL.mesh(cv, function (b) { b.glow(1).tube(0xeaf6ff, pts, 0.5, 0.14, 30, 5).tube(0xcfe6ff, [pts[3], [pts[3][0] + 10, pts[3][1] - 10, pts[3][2] + 4], [pts[3][0] + 14, pts[3][1] - 22, pts[3][2]]], 0.24, 0.06, 10, 5); }); m.visible = false; bolts.push({ m: m, h: K.halo(cv, 0xbfe0ff, 90, x, seaP[1] + 30, z, 0) }); })(bo);
    cvL.mesh(cv, function (b) { var r = K.rnd(8);     /* the shore: boulders, pale shells, a wrecked raft */
      for (var i = 0; i < 26; i++) { var q = spot(-312 - i * 3.4, 1, 5 + r() * 9, -4.6); b.rock(0x46525c, 1 + r() * 2.2, q[0], q[1], q[2], i + 60, 1.3, 0.6, 1.2); if (i % 4 === 0) { b.glow(0.3).cone(0xf0e2d0, 0.5, 1.2, q[0] + 2, q[1] + 1.2, q[2] + 1, 0.9, i, 0, 9).glow(0); } }
      var q2 = spot(-352, 1, 9, -4.9); for (i = 0; i < 6; i++) b.cyl(0x6b4a30, 0.22, 0.22, 4.6, q2[0] + i * 0.46, q2[1] + 0.4, q2[2], PI / 2, 0.3, 0.06, 8); b.cyl(0x6b4a30, 0.09, 0.09, 4.2, q2[0] + 1.2, q2[1] + 2.4, q2[2], 0, 0, 0.25).box(0xd9cdb0, 2.2, 1.8, 0.04, q2[0] + 1.5, q2[1] + 3.0, q2[2], 0, 0.3, 0.25); });

    /* ---- the earthquake: a barrier across the drift, the roof coming down behind it */
    var qz = at(-406), barrier = new T.Group(); barrier.position.set(qz.p.x + qz.s.x * 5, qz.p.y, qz.p.z - 9); cv.add(barrier);
    cvL.mesh(barrier, function (b) { b.box(0x6b4a30, 0.3, 2.6, 0.3, -2, 1.3, 0).box(0x6b4a30, 0.3, 2.6, 0.3, 2, 1.3, 0).box(0xd9a82a, 4.6, 0.4, 0.14, 0, 1.9, 0.1, 0, 0, 0.12).box(0xd9a82a, 4.6, 0.4, 0.14, 0, 1.1, 0.1, 0, 0, -0.1);
      for (var i = 0; i < 6; i++) b.box(0x1a1a1a, 0.4, 0.42, 0.15, -1.9 + i * 0.76, 1.9 + (i - 2.5) * 0.09, 0.11, 0, 0, 0.12); b.glow(1).sph(0xff3020, 0.2, 0, 2.9, 0).glow(0); });
    var warn = K.halo(barrier, 0xff3020, 5, 0, 2.9, 0, 0);
    var falls = []; for (var fi = 0; fi < 16; fi++) (function (i) { var r = K.rnd(70 + i), z = -398 - r() * 40, a = at(z), x = a.p.x + (r() - 0.5) * 8 + (i < 6 ? a.s.x * 5 : 0), m = cvL.mesh(cv, function (b) { b.rock(0x5a4a40, 0.5 + r() * 1.3, 0, 0, 0, i + 5); }); m.position.set(x, a.p.y + 9, a.p.z + (i < 6 ? -8 : 0)); falls.push({ m: m, y0: a.p.y + 9 + r() * 4, y1: a.p.y - (i < 6 ? 0.2 : 2.5), t0: 0.4 + r() * 5.5, sp: 1 + r() }); })(fi);
    var dust = K.motes(cv, { n: 160, box: [22, 12, 30], col: 0xb09a80, size: 0.5, vel: [0, -1.2, 0], drift: 0.8, add: false, op: 0.0, seed: 12 });

    /* ---- the nest */
    var eyes = [];
    cvL.mesh(cv, function (b) { var r = K.rnd(31);
      for (var i = 0; i < 30; i++) { var z = -452 - i * 2.6, q = spot(z, i % 2 ? 1 : -1, 2.6 + r() * 1.6, -0.5), s = 0.7 + r() * 0.8, cracked = i % 4 === 1;
        b.push(q[0], q[1], q[2], r() * 6, s, (r() - 0.5) * 0.6, (r() - 0.5) * 0.6);
        b.sph(function (x, y, zz, ly) { return K.mix(0xd8d0b8, 0x7a8a6a, hash3(x, y, zz) > 0.72 ? 0.8 : 0.05); }, 0.6, 0, 0.7, 0, 1, 1.35, 1, 16);
        if (cracked) { b.glow(0.95); for (var k = 0; k < 4; k++) b.box(0xffb040, 0.05, 0.5, 0.03, Math.cos(k * 1.4) * 0.52, 0.8 + k * 0.1, Math.sin(k * 1.4) * 0.52, 0.3 * k, k * 1.4, 0.5); b.glow(0); }
        b.torus(0x5a4a3a, 0.7, 0.16, 0, 0.1, 0, PI / 2, 0, 0, PI * 2, 12).pop(); }
      for (i = 0; i < 16; i++) { var z2 = -448 - i * 5.2, a = at(z2), R0 = 5.4; b.tube(0xb8c0a8, [[a.p.x - a.s.x * R0, a.p.y + 4.4, a.p.z], [a.p.x - a.s.x * 1.5, a.p.y + 3.2 + r(), a.p.z + (r() - 0.5) * 2], [a.p.x + a.s.x * 2, a.p.y + 4 + r(), a.p.z], [a.p.x + a.s.x * R0, a.p.y + 2 + r() * 2, a.p.z + 1]], 0.05, 0.03, 14, 4); } });
    function hash3(x, y, z) { var s = Math.sin(Math.round(x * 3) * 12.9898 + Math.round(y * 3) * 78.233 + Math.round(z * 3) * 37.719) * 43758.5453; return s - Math.floor(s); }
    for (var ei = 0; ei < 9; ei++) (function (i) { var q = spot(-462 - i * 8, i % 2 ? -1 : 1, 4.4, 1.2 + (i % 3) * 0.9), g = new T.Group(); g.position.set(q[0], q[1], q[2]); cv.add(g); cvL.mesh(g, function (b) { b.glow(1).sph(0xff3a2a, 0.11, -0.2, 0, 0, 1.3, 0.7, 1).sph(0xff3a2a, 0.11, 0.2, 0, 0, 1.3, 0.7, 1); }); eyes.push({ g: g, ph: i * 1.9, z: -462 - i * 8 }); })(ei);

    /* ---- the lava cavern */
    var lvA = at(-590), lavaY = lvA.p.y - 7.5, lavaW = K.water(cv, 150, 170, { a: 0xc22a00, b: 0xffb020, s: 0xfff0a0, fog: 0x1a0803, near: 40, far: 200 }, lvA.p.x, lavaY, lvA.p.z);
    cvL.mesh(cv, function (b) { var r = K.rnd(51);
      for (var i = 0; i < 20; i++) { var z = -545 - i * 4.8, side = i % 2 ? 1 : -1, q = spot(z, side, 8 + r() * 12, 0), h = 6 + r() * 12; b.rock(0x30170f, 2.4 + r() * 2, q[0], lavaY + h * 0.35, q[2], i + 90, 1, h / 4, 1, 1, 0.4); b.glow(0.9); for (var k = 0; k < 3; k++) b.box(0xff6a1a, 0.16, 1.2 + r() * 2, 0.16, q[0] + (r() - 0.5) * 2.4, lavaY + 1 + r() * h * 0.4, q[2] + (r() - 0.5) * 2.4, r() - 0.5, 0, r() - 0.5); b.glow(0); }
      /* falls of lava down the far wall */
      b.glow(1); [[-560, -1, 19, 0.9], [-585, -1, 22, 1.3], [-612, 1, 23, 1.1], [-630, -1, 18, 0.8]].forEach(function (f) { var q = spot(f[0], f[1], f[2], 0); b.tube(function (x, y) { return K.mix(0xff3a00, 0xffd040, Math.max(0, Math.min(1, (y - lavaY) / 26))); }, [[q[0], lavaY + 27, q[2]], [q[0] - f[1] * 1.2, lavaY + 18, q[2]], [q[0] - f[1] * 2.2, lavaY + 8, q[2]], [q[0] - f[1] * 2.6, lavaY, q[2]]], f[3], f[3] * 1.7, 14, 8); }); b.glow(0); });
    [[-560, -1, 17], [-585, -1, 20], [-612, 1, 21], [-630, -1, 16]].forEach(function (f) { var q = spot(f[0], f[1], f[2], 0); K.halo(cv, 0xff6a1a, 26, q[0], lavaY + 6, q[2], 0.3); });
    var embers = K.motes(cv, { n: 240, box: [40, 24, 50], col: 0xff9a3a, size: 0.26, vel: [0, 2.6, 0], drift: 0.9, seed: 14 });
    /* the Lava Monster: a great armoured worm of cooled lava, rising out of the lake */
    var mq = spot(-628, 1, 14, 0), mon = new T.Group(); mon.position.set(mq[0], lavaY - 12, mq[2]); mon.scale.setScalar(1.3); cv.add(mon);
    (function () { var a = at(-588); mon.rotation.y = Math.atan2(a.p.x - mq[0], a.p.z - mq[2]); })();
    var ROCK = 0x2a1510, CRK = 0xff6a1a;
    var spine = K.chain(cvL, mon, 7, 2.5, function (b, i, k) { var r = 2.5 - k * 0.8;
      b.rock(K.shade(ROCK, 1 + (i % 2) * 0.25), r, 0, 1.25, 0, i + 200, 1, 0.85, 1, 2, 0.16);
      b.glow(0.95); for (var c = 0; c < 7; c++) { var an = c / 7 * PI * 2 + i; b.box(c % 2 ? CRK : 0xffa030, 0.14, 1.5, 0.1, Math.cos(an) * r * 0.97, 1.25, Math.sin(an) * r * 0.97, 0, -an, 0.4 * (c % 2 ? 1 : -1)); } b.torus(CRK, r * 0.9, 0.1, 0, 0.1, 0, PI / 2, 0, 0).glow(0);
      for (c = 0; c < 4; c++) b.cone(0x1c0e0a, 0.36, 1.5 - k * 0.5, 0, 1.3 + (c - 1.5) * 0.35, -r * 0.95, -PI / 2 - 0.3, 0, 0, 6);                    /* back spines */
      if (i > 0 && i < 6) [-1, 1].forEach(function (s) { b.tube(0x1c0e0a, [[s * r * 0.8, 1.2, 0.4], [s * (r + 1.2), 1.7, 1.2], [s * (r + 1.5), 0.9, 2.3], [s * (r + 0.9), 0.3, 2.9]], 0.3, 0.06, 12, 6); }); });
    var mhead = new T.Group(); mhead.position.y = 2.9; spine[6].add(mhead);
    cvL.mesh(mhead, function (b) {
      b.rock(ROCK, 2.3, 0, 0.6, 0.6, 77, 1.15, 0.85, 1.4, 2, 0.14).rock(K.shade(ROCK, 1.3), 1.5, 0, 0.2, 2.5, 78, 1.1, 0.6, 1.2, 1, 0.14);                 /* skull and snout */
      [-1, 1].forEach(function (s) { b.rock(0x1c0e0a, 0.9, s * 1.15, 1.5, 1.7, 80 + s, 1.2, 0.5, 1.5, 1, 0.2);                                       /* brow */
        b.glow(1).sph(0xffd21a, 0.62, s * 1.2, 1.0, 2.2, 1, 0.8, 0.7, 14).glow(0.2).sph(0x140600, 0.24, s * 1.24, 1.0, 2.62, 0.45, 1.5, 0.6).glow(0);
        b.cone(0x1c0e0a, 0.42, 3.0, s * 1.5, 2.3, -0.8, -1.0, 0, -s * 0.5, 6).cone(0x1c0e0a, 0.3, 2.0, s * 0.7, 2.5, -1.0, -1.2, 0, -s * 0.2, 6);
        b.glow(0.9).box(CRK, 0.12, 0.1, 1.6, s * 0.6, 1.0, 3.0, 0, s * 0.2, 0).glow(0).cone(0x140a08, 0.16, 0.2, s * 0.35, 0.55, 3.62, PI / 2, 0, 0, 5); });
      b.glow(0.95).sph(0xff5a10, 1.0, 0, -0.25, 2.2, 1, 0.4, 1.3).glow(0);
      for (var i = 0; i < 9; i++) b.glow(0.3).cone(0xfff0c8, 0.14, 0.6, -1.0 + i * 0.25, -0.38, 3.2 - Math.abs(i - 4) * 0.16, PI, 0, 0, 5).glow(0); });
    var jaw = new T.Group(); jaw.position.set(0, -0.3, 0.9); mhead.add(jaw);
    cvL.mesh(jaw, function (b) { b.rock(K.shade(ROCK, 1.15), 1.4, 0, -0.5, 1.5, 85, 1.05, 0.4, 1.35, 1, 0.14); for (var i = 0; i < 8; i++) b.glow(0.3).cone(0xfff0c8, 0.13, 0.55, -0.88 + i * 0.25, -0.02, 2.5 - Math.abs(i - 3.5) * 0.15, 0, 0, 0, 5).glow(0); b.glow(0.9).sph(0xff7a20, 0.8, 0, -0.3, 1.4, 1, 0.3, 1.2).glow(0); });
    var mand = [-1, 1].map(function (s) { var g = new T.Group(); g.position.set(s * 1.5, -0.2, 2.2); mhead.add(g); cvL.mesh(g, function (b) { b.tube(0x1c0e0a, [[0, 0, 0], [s * 1.2, -0.3, 1.2], [s * 0.9, -0.6, 2.6], [s * 0.1, -0.7, 3.2]], 0.34, 0.05, 14, 6); }); return g; });
    var marms = [-1, 1].map(function (s) { var sh = new T.Group(); sh.position.set(s * 2.0, 1.4, 0.6); sh.rotation.z = -s * 1.1; sh.rotation.x = 0.5; spine[4].add(sh);
      var js = K.chain(cvL, sh, 3, 3.1, function (b, i) { b.rock(ROCK, 0.85 - i * 0.14, 0, 1.55, 0, 120 + i, 0.9, 2.1, 0.9, 1, 0.18).glow(0.95).torus(CRK, 0.6 - i * 0.1, 0.08, 0, 0.1, 0, PI / 2, 0, 0).glow(0);
        if (i === 2) for (var c = 0; c < 3; c++) b.cone(0xfff0c8, 0.2, 1.7, (c - 1) * 0.45, 3.6, 0.2, 0.25, 0, -(c - 1) * 0.3, 6); }); return { sh: sh, js: js, s: s }; });
    var monHalo = K.halo(mhead, 0xff7a20, 16, 0, 0, 2.6, 0), fireCone = K.shaft(mhead, 0xff6a18, 0.4, 1.9, 11, 0, -0.5, 8.6, 0); fireCone.rotation.x = PI / 2;

    /* ---- the mine car */
    var car = new T.Group(); A.R.add(car); A.car = car; var carL = K.look({ tint: [1.0, 0.85, 0.65], fog: 0, near: 500, far: 900, amb: 0.42, rim: 0.12 });
    carL.mesh(car, function (b) { var brass = 0x8f6c2c, iron = 0x34383f, wood = 0x5a3e28, i;
      b.box(iron, 2.5, 0.5, 0.3, 0, 0.72, -1.75).box(brass, 2.56, 0.07, 0.36, 0, 0.99, -1.75).box(wood, 2.3, 0.1, 0.5, 0, 0.9, -1.45, 0.5, 0, 0);
      [-1, 1].forEach(function (s) { b.box(iron, 0.14, 0.7, 3.4, s * 1.25, 0.62, -0.2).box(brass, 0.18, 0.06, 3.4, s * 1.25, 0.99, -0.2);
        b.cyl(brass, 0.16, 0.2, 0.34, s * 0.95, 0.9, -2.0, PI / 2, 0, 0, 12).glow(1).sph(0xfff0c0, 0.12, s * 0.95, 0.9, -2.14).glow(0);
        for (var w = 0; w < 2; w++) b.cyl(iron, 0.34, 0.34, 0.14, s * 0.78, 0.18, -1.6 + w * 2.6, 0, 0, PI / 2, 14); });
      b.cone(brass, 0.6, 1.5, 0, 0.55, -2.7, -PI / 2, 0, 0, 6); for (i = 0; i < 4; i++) b.torus(iron, 0.52 - i * 0.12, 0.04, 0, 0.55, -2.2 - i * 0.3, 0, 0, 0);
      [-0.6, 0, 0.6].forEach(function (x, k) { b.cyl(brass, 0.13, 0.13, 0.05, x, 0.97, -1.42, 1.05, 0, 0, 14).cyl(0xe8dcc0, 0.11, 0.11, 0.06, x, 0.975, -1.415, 1.05, 0, 0, 14).box(0xb3202a, 0.015, 0.02, 0.1, x + (k - 1) * 0.02, 1.01, -1.4, 1.05, 0, 0.4 * (k - 1)); });
      b.box(wood, 2.3, 0.12, 0.9, 0, 0.42, 0.15).box(K.shade(wood, 0.8), 2.3, 0.7, 0.12, 0, 0.75, 0.62); });
    [-1, 1].forEach(function (s) { K.halo(car, 0xffe0a0, 0.9, s * 0.95, 0.9, -2.2, 0.7); });

    /* ================================================================ 4 · out of the mountain */
    var outL = K.look({ tint: [1.0, 0.95, 0.86], fog: 0xbcd9ec, near: 70, far: 520, amb: 0.62, rim: 0.14 });
    var out = A.scene('out', 3); sky(out, 0xbcd9ec, 1100);
    K.cyc(out, 560, 520, K.paint(2048, 512, function (c, w, h) {
      var gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#3f86d6'); gr.addColorStop(0.5, '#9fd0f2'); gr.addColorStop(0.62, '#e6f2f6'); gr.addColorStop(0.63, '#2f7fae'); gr.addColorStop(1, '#165a86'); c.fillStyle = gr; c.fillRect(0, 0, w, h);
      for (var i = 0; i < 26; i++) { var x = (i * 173) % w, y = 60 + (i * 47) % 190, s = 30 + (i * 29) % 60; c.fillStyle = 'rgba(255,255,255,.85)'; for (var k = 0; k < 5; k++) { c.beginPath(); c.ellipse(x + k * s * 0.5, y + (k % 2) * 8, s * 0.6, s * 0.28, 0, 0, 7); c.fill(); } }
      c.fillStyle = 'rgba(90,110,120,.55)'; [[300, 90, 320], [1300, 60, 240], [1750, 110, 380]].forEach(function (q) { c.beginPath(); c.moveTo(q[0] - q[2] / 2, 322); c.lineTo(q[0] - 20, 322 - q[1]); c.lineTo(q[0] + 30, 322 - q[1] + 8); c.lineTo(q[0] + q[2] / 2, 322); c.fill(); });
      c.fillStyle = 'rgba(255,255,255,.35)'; for (i = 0; i < 160; i++) c.fillRect((i * 97) % w, 330 + (i * 31) % 170, 14 + (i % 5) * 8, 1.5);
    }), 40);
    var path2 = K.path([[0, 60, 30], [0, 62, 0], [0, 64, -22], [3, 52, -52], [14, 38, -82], [32, 31, -104], [52, 28.5, -114], [78, 28, -116], [92, 28, -116]]);
    outL.mesh(out, function (b) { var r = K.rnd(61), i;
      /* the flank of the volcano */
      for (i = 0; i < 150; i++) { var x = (r() - 0.35) * 190, z = 60 - r() * 250, dz = z + 30, base = 64 - Math.max(0, -dz) * 0.36 - Math.max(0, x - 10) * 0.2 + Math.max(0, dz) * 0.5 + Math.max(0, -x) * 0.5; var s = 7 + r() * 9, cy = base - s * 0.9 - 3, hit = false; for (var pk = 0; pk <= 50; pk++) { var pp = path2.getPointAt(pk / 50); if (Math.hypot(pp.x - x, (pp.y + 2 - cy) / 0.9, pp.z - z) < s * 1.8 + 3.5) { hit = true; break; } } if (hit) continue;
        b.rock(K.mix(0x6a5448, 0x80583e, r() * 0.6), s, x, base - s * 0.9 - 3, z, i + 300, 1.2, 0.9, 1.2, 2, 0.26); }
      for (i = 0; i < 14; i++) { var an = i / 14 * PI * 2; b.rock(0x5a463c, 4.5, Math.cos(an) * 10.5, 63 + Math.sin(an) * 9.5, 14, i + 30, 1, 1, 2.4); }                          /* the mouth of the vent */
      K.rails(b, path2, { tie: 0x4a3626, rail: 0x9a9080, gauge: 1.5, step: 1.2, dy: 0.02 });
      for (i = 2; i < 60; i++) { var p = path2.getPointAt(i / 60), t = path2.getTangentAt(i / 60), h = 5 + (i % 3); [-1, 1].forEach(function (s) { b.box(0x5a3e28, 0.3, h, 0.3, p.x - t.z * s * 1.1, p.y - h / 2, p.z + t.x * s * 1.1); }); b.box(0x4a3626, 3, 0.2, 0.2, p.x, p.y - h * 0.5, p.z, 0, Math.atan2(t.x, t.z), 0.55); }
      /* the station shed */
      b.box(0x6b4a30, 20, 0.3, 6, 82, 27.6, -116); [-1, 1].forEach(function (s) { for (var k = 0; k < 4; k++) b.box(0x5a3e28, 0.4, 5, 0.4, 73 + k * 6, 30.2, -116 + s * 2.8); }); b.box(0x7a3a2a, 22, 0.3, 4, 82, 33.2, -114.4, 0.35, 0, 0).box(0x7a3a2a, 22, 0.3, 4, 82, 33.2, -117.6, -0.35, 0, 0);
      b.glow(0.9); for (i = 0; i < 4; i++) b.sph(0xffe2a0, 0.2, 74 + i * 5.4, 32.2, -116); b.glow(0);
      /* far below: Nemo's submarine at its mooring in the caldera, and the ring walk */
      b.push(60, 1.2, -40, 0.6, 1).sph(0x4a4a52, 4, 0, 0, 0, 1, 0.9, 4.5, 16).cyl(0x5a5a62, 1.6, 2, 2.4, 0, 3.6, -3, 0, 0, 0, 10).cone(0x8a8a92, 1, 6, 0, 0.6, 20, PI / 2, 0, 0, 4); for (i = 0; i < 9; i++) b.cone(0x6a6a72, 0.5, 1.6, 0, 3.6, -10 + i * 3, 0, 0, 0, 4); b.glow(0.9).sph(0xfff0a0, 0.8, 1.6, 2.4, 10).sph(0xfff0a0, 0.8, -1.6, 2.4, 10).glow(0).pop();
      for (i = 0; i < 26; i++) { var a2 = i / 26 * PI * 1.3 + 0.4; b.box(0x8a7a6a, 9, 2, 3, 70 + Math.cos(a2) * 78, 1, -30 + Math.sin(a2) * 78, 0, -a2, 0); if (i % 3 === 0) b.box(0x7a5a4a, 4, 7, 4, 70 + Math.cos(a2) * 84, 4, -30 + Math.sin(a2) * 84, 0, -a2, 0).cone(0x8a3a2a, 3.4, 3, 70 + Math.cos(a2) * 84, 9, -30 + Math.sin(a2) * 84, 0, -a2, 0, 4); } });
    K.water(out, 1200, 1200, { a: 0x1a6a9a, b: 0x9fdcf2, s: 0xffffff, fog: 0xbcd9ec, near: 150, far: 600 }, 60, 0.6, -40);
    var steam = K.motes(out, { n: 120, box: [16, 18, 16], col: 0xffffff, size: 2.2, vel: [0, 3, 0], drift: 1.2, add: false, op: 0.35, seed: 5 });

    /* ================================================================ the score */
    var score = null, hum = null;
    function music() { return K.score({ bpm: 84, step: 2, vol: 0.5, inst: { lead: 'celesta', lead2: 'flute', bass: 'bass', pad: 'strings' },
      sections: {
        /* the laboratory: a curious little tune on the celesta over strings */
        lab: { lead: 'd5 - f5 a5 g5 - e5 - | f5 - a5 d6 c#6 - - - | d5 - f5 a5 bb5 - g5 - | a5 g5 f5 e5 d5 - - -', pad: 'Dm - - - - - - - | Dm - - - A - - - | Bb - - - Gm - - - | A - - - Dm - - -', bass: 'd2 - - - a2 - - - | d2 - - - a1 - - - | bb1 - - - g1 - - - | a1 - - - d2 - - -' },
        /* going down: cellos, and a far-off drum */
        down: { inst: { lead2: 'cello' }, lead2: 'd3 - - - - - - - | e3 - - - - - - - | f3 - - - - - - - | e3 - - - c#3 - - -', pad: 'Dm - - - - - - - | Dm - - - - - - - | Dm - - - - - - - | A - - - - - - -', perc: 't . . . . . g . | . . . . . . . .', mix: { lead2: 0.26, perc: 0.22 } },
        /* the crystal cavern: harp arpeggios, a flute above them */
        wonder: { inst: { lead: 'harp' }, lead: 'f3 a3 c4 f4 a4 f4 c4 a3 | d3 f3 a3 d4 f4 d4 a3 f3 | bb2 d3 f3 bb3 d4 bb3 f3 d3 | c3 e3 g3 c4 e4 c4 g3 e3', lead2: 'a5 - - - c6 - a5 - | f5 - - - a5 - - - | d6 - - - c6 - bb5 - | g5 - - - - - - .', pad: 'F - - - - - - - | Dm - - - - - - - | Bb - - - - - - - | C - - - - - - -', bass: 'f2 - - - - - - - | d2 - - - - - - - | bb1 - - - - - - - | c2 - - - - - - -', mix: { lead: 0.26 } },
        /* the mushroom forest: a marimba skipping along, a woodblock */
        forest: { inst: { lead: 'marimba' }, lead: 'f5 . a5 . c6 a5 f5 . | g5 . bb5 . d6 bb5 g5 . | a5 . c6 . f6 c6 a5 . | g5 a5 bb5 c6 d6 . c6 .', lead2: 'c5 - - - - - - - | d5 - - - - - - - | f5 - - - - - - - | e5 - - - - - - -', bass: 'f2 . c3 . f2 . c3 . | g2 . d3 . g2 . d3 . | f2 . c3 . a2 . c3 . | c2 . g2 . c3 . e3 .', pad: 'F - - - - - - - | Gm - - - - - - - | F - - - - - - - | C - - - - - - -', perc: 'w . h . w h h .', mix: { lead: 0.34, lead2: 0.12, perc: 0.2 } },
        /* the underground sea: a horn calling over slow harp ripples */
        sea: { inst: { lead: 'harp', lead2: 'horn' }, lead2: 'd4 - - - a4 - - - | g4 - - - f4 - e4 - | f4 - - - c5 - - - | a4 - - - - - - -', lead: 'd3 a3 d4 f4 a4 f4 d4 a3 | g2 d3 g3 bb3 d4 bb3 g3 d3 | f2 c3 f3 a3 c4 a3 f3 c3 | a2 e3 a3 c#4 e4 c#4 a3 e3', pad: 'Dm - - - - - - - | Gm - - - - - - - | F - - - - - - - | A - - - - - - -', mix: { lead: 0.2, lead2: 0.24, pad: 0.09 } },
        /* the earthquake and the nest: hurried strings, timpani */
        danger: { inst: { lead2: 'fiddle' }, lead2: 'd4 d4 f4 d4 e4 e4 g4 e4 | f4 f4 a4 f4 e4 e4 c#4 e4', bass: 'd2 . d2 . d2 . d2 . | d2 . d2 . a1 . a1 .', pad: 'Dm - - - - - - - | Dm - - - A - - -', perc: 't . h . t . h h', mix: { lead2: 0.16 } },
        /* the monster: low horns, drums */
        monster: { inst: { lead2: 'horn', bass: 'cello' }, lead2: 'd3 - - eb3 d3 - - - | f3 - - e3 d3 - c#3 -', bass: 'd2 - - - d2 - eb2 - | d2 - - - f2 - e2 -', pad: 'Ddim - - - - - - - | Ddim - - - A - - -', perc: 'g . t t k . t s', mix: { lead2: 0.3, bass: 0.22, perc: 0.34 } },
        /* the escape: fiddles racing, horns under them */
        escape: { inst: { lead: 'fiddle', lead2: 'horn' }, lead: 'd5 a4 d5 f5 e5 a4 e5 g5 | f5 d5 f5 a5 g5 e5 c#5 a4', lead2: 'd4 - - - e4 - - - | f4 - - - a4 - - -', bass: 'd2 d2 d2 d2 a1 a1 a1 a1 | bb1 bb1 bb1 bb1 a1 a1 a1 a1', pad: 'Dm - - - A - - - | Bb - - - A - - -', perc: 'k h s h k h s h', mix: { lead: 0.18, lead2: 0.24 } },
        /* daylight: the horn takes the tune home in the major */
        finale: { inst: { lead: 'harp', lead2: 'horn' }, lead2: 'f4 - a4 c5 f5 - - c5 | d5 - c5 - a4 - f4 - | bb4 - d5 f5 bb5 - a5 - | g5 - c5 - f5 - - -', lead: 'f3 a3 c4 f4 a4 f4 c4 a3 | d3 f3 a3 d4 f4 d4 a3 f3 | bb2 d3 f3 bb3 d4 bb3 f3 d3 | c3 e3 g3 c4 f3 a3 c4 f4', pad: 'F - - - - - - - | Dm - - - - - - - | Bb - - - - - - - | C - - - F - - -', bass: 'f2 - - - c2 - - - | d2 - - - a1 - - - | bb1 - - - f2 - - - | c2 - - - f2 - - -', perc: 'k . h . s . h .', mix: { lead: 0.2, lead2: 0.28, perc: 0.2 } } } }); }
    function sec(name) { if (!score) { score = A.keep(music()); } score.set(name); }

    /* ================================================================ the ride */
    var TIME = [[0, 13], [9, -40], [27, -160], [47, -300], [60, -396], [66, -432], [78, -532], [82, -556], [95, -612], [99, -642], [107, -843]];
    function zAt(t) { for (var i = 1; i < TIME.length; i++) if (t <= TIME[i][0]) { var k = (t - TIME[i - 1][0]) / (TIME[i][0] - TIME[i - 1][0]); if (i === 1 || i === TIME.length - 1) k = k * k; return TIME[i - 1][1] + (TIME[i][1] - TIME[i - 1][1]) * k; } return TIME[TIME.length - 1][1]; }
    var look = new T.Vector3(), tmp = new T.Vector3(), lastZ = 13;
    function lamp(Lk, on) { var p = A.w(pose.p), d = [pose.t[0] - pose.p[0], pose.t[1] - pose.p[1], pose.t[2] - pose.p[2]]; Lk.spot(p, d, on ? [0.8, 0.68, 0.5] : [0, 0, 0], 0.74, 66); }
    function caveStep(t, dt) {
      var z = zAt(t), a = at(z), f = at(z - 9), zn = zone(z)[4], speed = Math.abs(z - lastZ) / Math.max(dt, 0.001); lastZ = z;
      pose.p = [a.p.x, a.p.y + 1.55, a.p.z]; look.set(f.p.x, f.p.y + 1.45, f.p.z); pose.h = [look.x, look.y, look.z];
      function gaze(x, y, zz, w) { look.lerp(tmp.set(x, y, zz), w); }
      var k;
      /* where the eye is drawn */
      if (zn === 'crystal') { k = Math.sin(t * 0.45); gaze(a.p.x + a.s.x * k * 9 + a.t.x * 12, a.p.y + 3 + Math.sin(t * 0.3) * 2, a.p.z + a.s.z * k * 9 + a.t.z * 12, 0.55); }
      if (zn === 'forest') { k = Math.sin(t * 0.5 + 1); gaze(a.p.x + a.s.x * k * 8 + a.t.x * 10, a.p.y + 1.2 + Math.sin(t * 0.35) * 1.6, a.p.z + a.s.z * k * 8 + a.t.z * 10, 0.6); }
      if (zn === 'sea') { k = sm((-312 - z) / 20) * (1 - sm((-384 - z) / 14)); gaze(a.p.x + a.s.x * 40 + a.t.x * 14, a.p.y + 4, a.p.z + a.s.z * 40 + a.t.z * 14, 0.75 * k); }
      if (zn === 'lava') { k = sm((-546 - z) / 14) * (1 - sm((-630 - z) / 8)); mhead.getWorldPosition(tmp); gaze(tmp.x - A.w([0, 0, 0])[0], tmp.y - A.w([0, 0, 0])[1], tmp.z - A.w([0, 0, 0])[2], 0.8 * k); }
      tmp.set(look.x - pose.p[0], look.y - pose.p[1], look.z - pose.p[2]).normalize(); if (tmp.dot(a.t) < 0.3) { look.set(pose.p[0] + (tmp.x + a.t.x * 0.9) * 10, pose.p[1] + (tmp.y + a.t.y * 0.9) * 10, pose.p[2] + (tmp.z + a.t.z * 0.9) * 10); }
      pose.t = [look.x, look.y, look.z];
      /* banking, and the shake of the rails */
      var ahead = at(z - 14), turn = (ahead.t.x * a.t.z - ahead.t.z * a.t.x); pose.roll = Math.max(-0.2, Math.min(0.2, turn * 0.9)) + Math.sin(t * 9) * 0.003 * Math.min(4, speed / 6);
      st.shake = Math.max(st.shake, Math.min(0.5, speed * 0.006));
      lamp(cvL, true);
      carL.u.uAmb.value = 0.42; carL.u.uUnder.value.copy(cvL.u.uUnder.value).multiplyScalar(0.5); carL.u.uUnderY.value = 1e5;
      /* the light of each place */
      var u = cvL.u, lavaK = sm((-528 - z) / 26), ventK = sm((-640 - z) / 30);
      u.uUnder.value.set(1.6 * lavaK, 0.55 * lavaK, 0.12 * lavaK); u.uUnderY.value = A.w([0, lavaY, 0])[1];
      var fogC = lavaK > 0 ? K.mix(0x070505, 0x2a0c04, lavaK) : zn === 'forest' ? 0x06100a : zn === 'crystal' ? 0x07081a : zn === 'sea' ? 0x05101a : 0x070505, fc = new T.Color(fogC);
      u.uFog.value.lerp(tmp.set(fc.r, fc.g, fc.b), 0.05); cvSky.material.color.setRGB(u.uFog.value.x, u.uFog.value.y, u.uFog.value.z); u.uAmb.value += ((zn === 'eggs' ? 0.16 : zn === 'lava' ? 0.42 : zn === 'forest' || zn === 'crystal' ? 0.36 : 0.3) - u.uAmb.value) * 0.05;
      /* motes travel with the car, each where it belongs */
      glints.visible = zn === 'crystal'; spores.visible = zn === 'forest'; embers.visible = lavaK > 0.05; dust.visible = z < -396 && z > -450;
      if (glints.visible) glints.userData.step(dt, a.p.x, a.p.y + 2, a.p.z - 8, t); if (spores.visible) spores.userData.step(dt, a.p.x, a.p.y + 2, a.p.z - 8, t); if (embers.visible) embers.userData.step(dt, a.p.x, a.p.y + 1, a.p.z - 10, t);
      if (dust.visible) { dust.material.opacity = 0.5 * sm((-398 - z) / 6) * (1 - sm((-436 - z) / 10)); dust.userData.step(dt, a.p.x, a.p.y + 2, a.p.z - 6, t); }
      /* creatures */
      critters.forEach(function (c) { var near = Math.abs(c.z - z) < 30, pk = c.hide ? sm(1 - Math.abs(c.z - 6 - z) / 16) : 1; if (!near) return; c.g.position.y = c.y - (1 - pk) * 1.6 + Math.abs(Math.sin(t * 2.2 + c.ph)) * 0.08; tmp.set(a.p.x, c.g.position.y + 1, a.p.z); c.head.rotation.y = Math.max(-1.1, Math.min(1.1, Math.atan2(tmp.x - c.g.position.x, tmp.z - c.g.position.z) - c.g.rotation.y)); c.head.rotation.z = Math.sin(t * 1.3 + c.ph) * 0.18; c.lids.scale.y = (Math.sin(t * 0.9 + c.ph) > 0.97) ? 1 : 0.01; });
      bugs.forEach(function (b) { b.g.position.set(b.p[0] + Math.sin(t * 0.7 + b.ph) * 1.6, b.p[1] + Math.sin(t * 1.1 + b.ph * 2) * 0.7, b.p[2] + Math.cos(t * 0.6 + b.ph) * 1.6); b.g.rotation.y = t * 0.7 + b.ph; b.w1.rotation.z = Math.sin(t * 34 + b.ph) * 0.7; b.w2.rotation.z = -Math.sin(t * 34 + b.ph) * 0.7; });
      /* lightning over the sea */
      var fl = 0; if (zn === 'sea') bolts.forEach(function (b, i) { var ph = (t * 0.55 + i * 0.37) % 1, on = ph < 0.07 && Math.sin(t * 70) > -0.3; b.m.visible = on; b.h.material.opacity = on ? 0.5 : 0; if (on) { fl = 0.5; once('th' + i + Math.floor(t * 0.55 + i * 0.37), function () { K.thud(0.7, 0.25); K.rush(1.6, 2400, 200, 0.12, 0.4, 0.2); }); } }); else bolts.forEach(function (b) { b.m.visible = false; b.h.material.opacity = 0; });
      cvL.flash(fl * 0.6, fl * 0.75, fl); seaW.userData.u.uFlash.value.set(fl, fl, fl);
      /* the earthquake */
      var qt = t - 60.5; if (qt > 0 && qt < 9) { st.shake = Math.max(st.shake, 0.9 * (1 - qt / 9) + 0.2); pose.roll += Math.sin(t * 13) * 0.04 * (1 - qt / 9); warn.material.opacity = Math.sin(t * 10) > 0 ? 0.8 : 0.1;
        falls.forEach(function (fa) { var ft = (qt - fa.t0) * fa.sp; if (ft < 0) { fa.m.position.y = fa.y0; return; } var y = fa.y0 - ft * ft * 9; if (y < fa.y1) { y = fa.y1; once('fall' + fa.t0, function () { K.thud(0.35); }); } fa.m.position.y = y; fa.m.rotation.x = ft * 2; }); } else warn.material.opacity = 0;
      eyes.forEach(function (e) { var open = Math.sin(t * 0.8 + e.ph) > -0.5 && Math.abs(e.z - z) < 40; e.g.scale.y = open ? 1 : 0.05; e.g.lookAt(A.w(pose.p)[0], A.w(pose.p)[1], A.w(pose.p)[2]); });
      /* the monster */
      var mt = t - 81.5, rise = sm(mt / 3.5), lunge = sm((mt - 11) / 1.2) * (1 - sm((mt - 15.5) / 1.5));
      mon.visible = z < -520; mon.position.y = lavaY - 20 + rise * 21;
      spine.forEach(function (j, i) { j.rotation.x = (i ? 0.1 : 0) + Math.sin(t * 0.9 + i * 0.6) * 0.07 + lunge * 0.1 * (i > 1 ? 1 : 0.3); j.rotation.z = Math.sin(t * 0.7 + i * 0.8) * 0.09; });
      mon.getWorldPosition(tmp); var cw = A.w(pose.p), yaw = Math.atan2(cw[0] - tmp.x, cw[2] - tmp.z) - mon.rotation.y; while (yaw > PI) yaw -= PI * 2; while (yaw < -PI) yaw += PI * 2; var lean = 0; spine.forEach(function (j) { lean += j.rotation.x; }); mhead.rotation.y = Math.max(-1.4, Math.min(1.4, yaw)) + Math.sin(t * 1.4) * 0.1; mhead.rotation.x = -lean * 0.75 + 0.2 + Math.sin(t * 1.9) * 0.06 + lunge * 0.15;
      var roar = Math.max(0, Math.sin((mt - 2.5) * 1.1)) * (mt > 2.5 && mt < 16.5 ? 1 : 0); jaw.rotation.x = 0.12 + roar * 0.65 + lunge * 0.3; mand.forEach(function (m, i) { m.rotation.y = (i ? -1 : 1) * (0.25 + roar * 0.5 + Math.sin(t * 5) * 0.06); });
      marms.forEach(function (m) { m.sh.rotation.x = 0.5 + Math.sin(t * 1.2 + m.s) * 0.25 + lunge * 0.8; m.js.forEach(function (j, i) { j.rotation.x = i ? 0.35 + Math.sin(t * 1.5 + i + m.s) * 0.2 + lunge * 0.35 : 0; }); });
      monHalo.material.opacity = 0.25 + roar * 0.4; fireCone.material.opacity = lunge * 0.22 * (0.7 + Math.sin(t * 40) * 0.3);
      if (mt > 0 && mt < 17) st.shake = Math.max(st.shake, 0.18 + roar * 0.35 + lunge * 0.4);
      if (ventK > 0) st.shake = Math.max(st.shake, 0.55);

      /* the telling of it */
      if (t > 0.3) once('c0', function () { sec('down'); hum = A.keep(K.air({ freq: 320, vol: 0.04, drone: 55, droneVol: 0.035 })); K.line('🚃', NEMO, '勘探车出发。前灯照到哪里，你们就看到哪里——坐稳。', 'The mine car is away. You will see what the headlamps find — sit tight.'); });
      if (z < -48) once('c1', function () { sec('wonder'); K.line('💎', null, '水晶洞——比房子还高的水晶，每一根都自己发着光。', 'The crystal cavern — crystals taller than houses, each one alight from within.'); });
      if (z < -168) once('c2', function () { sec('forest'); K.line('🍄', null, '巨型蘑菇森林。看那些圆眼睛的小家伙——它们从没见过人，一点也不怕。', 'The forest of giant mushrooms. See the round-eyed little ones — they have never met people, and are not afraid at all.'); });
      if (z < -250) once('c2b', function () { ['a5', 'c6', 'f6'].forEach(function (n, i) { K.play('glock', n, 0.4, 0.08, i * 0.14); }); });
      if (z < -306) once('c3', function () { sec('sea'); K.rush(6, 500, 900, 0.07, 0.5); K.line('🌊', null, '地下海！一片看不到边的水，头顶上打着地底的雷电。', 'The underground sea! Water without end, and lightning under the roof of the world.'); });
      if (t > 60.5) once('c4', function () { sec('danger'); K.thud(1.3); K.rush(7, 200, 80, 0.3, 0.4); K.line('⚠️', NEMO, '地震！前面的巷道塌了——勘探车转进了没人到过的岔道！', 'Earthquake! The drift ahead has fallen in — the car is turning into a tunnel no one has explored!'); });
      if (z < -448) once('c5', function () { K.roar(2.4, 0.14, 0.6); K.line('🥚', null, '好大的蛋……有的已经裂开了。黑暗里，有眼睛在看着我们。', 'Enormous eggs… and some have hatched. In the dark, eyes are watching us.'); });
      if (z < -536) once('c6', function () { sec('monster'); if (hum) hum.set(0.07, 520); K.line('🔥', null, '岩浆湖。好烫——有东西在岩浆里动！', 'A lake of lava. The heat — and something is moving in it!'); });
      if (mt > 2.6) once('c7', function () { K.roar(3.4, 0.55, 1); K.line('👹', null, '熔岩怪物！！', 'The Lava Monster!!'); });
      if (mt > 11.2) once('c8', function () { K.roar(3.0, 0.6, 0.85); K.rush(2.6, 400, 2600, 0.2, 0.6); });
      if (t > 98.6) once('c9', function () { sec('escape'); if (score) score.cut('escape'); K.rush(9, 300, 3200, 0.35, 0.5); if (hum) hum.set(0.13, 1500); K.line('🚀', NEMO, '火山要喷发了——全速，从喷口冲上去！', 'The volcano is about to blow — full power, up the vent!'); });
      if (t > 106) A.fadeTo(1, '#fff');
    }
    var PH = [
      { n: tr('尼摩船长的实验室', "Captain Nemo's laboratory"), sc: 'lab', d: 14, f: function (t) { var z = L(9, -15, t / 14); pose.h = null; pose.p = [Math.sin(t * 0.5) * 0.5, 1.68 + Math.abs(Math.sin(t * 3.4)) * 0.03, z]; pose.t = t < 4 ? [L(-4, 0, t / 4), 1.6, z - 8] : t < 9 ? [L(0, 4, (t - 4) / 3), 1.6, z - 7] : [0, 3.4, -23];
          lamp(labL, false); K.idle(crew[0], t, 0); K.idle(crew[1], t, 2); crew[0].userData.armR.rotation.x = -2.6 + Math.sin(t * 6) * 0.25 * (t > 2 && t < 6 ? 1 : 0); crew[0].userData.armR.rotation.x = t > 2 && t < 6 ? -2.6 + Math.sin(t * 6) * 0.25 : -0.1; crew[1].userData.foreR.rotation.x = -1.3 + Math.sin(t * 2) * 0.2;
          if (t > 0.4) once('a', function () { sec('lab'); K.line('🧭', NEMO, '欢迎来到神秘岛。我在火山深处找到了一条通往地心的路。', 'Welcome to Mysterious Island. Deep in this volcano I have found a way to the centre of the Earth.'); });
          if (t > 7.5) once('b', function () { K.line('🗺️', NEMO, '地心电梯会送你们下去。水晶、巨菌、地下的海——都在图上；图上没有的，你们自己去看。', 'The Terravator will take you down. Crystals, giant fungi, a sea under the ground — all on the chart; what is not on the chart, you must see for yourselves.'); }); } },
      { n: tr('地心电梯', 'The Terravator'), sc: 'lift', d: 11, f: function (t, dt) { pose.h = null; pose.p = [0, 1.68, 1.5]; pose.t = [L(0, 1.4, (t - 4) / 3), L(2.0, 2.2, t / 4), -3]; lamp(liftL, false); var v = sm(t / 2) * (1 - sm((t - 9) / 1.6));
          strataTex.offset.y += dt * 0.42 * v; needle.rotation.z = 2.2 - sm(t / 10) * 4.4; st.shake = Math.max(st.shake, 0.14 * v); sparks.visible = v > 0.3; sparks.userData.step(dt, 0, 2, 0, t);
          if (t > 0.3) once('d', function () { sec('down'); K.rush(9.5, 260, 150, 0.12, 0.5); K.line('⬇️', null, '地心电梯下降：四百米……八百米……一千六百米……', 'The Terravator descends: four hundred metres… eight hundred… sixteen hundred…'); });
          if (t > 9.4) once('e', function () { K.thud(0.6); K.play('glock', 'e6', 0.8, 0.12); }); } },
      { n: tr('地心探险', 'Journey to the center of the Earth'), sc: 'cave', d: 107.4, car: 1, f: caveStep },
      { n: tr('冲出火山', 'Out of the volcano'), sc: 'out', d: 17, cut: 1, car: 1, f: function (t, dt) { var u = t < 2.2 ? L(0.02, 0.2, t / 2.2) : t < 9 ? 0.2 + (t - 2.2) / 6.8 * 0.62 : 0.82 + sm((t - 9) / 6) * 0.16, p = path2.getPointAt(Math.min(0.995, u)), f = path2.getPointAt(Math.min(1, u + 0.04)), tg = path2.getTangentAt(Math.min(0.995, u)), f2 = path2.getTangentAt(Math.min(0.995, u + 0.05));
          pose.p = [p.x, p.y + 1.55, p.z]; pose.h = [f.x, f.y + 1.45, f.z]; var k = sm((t - 1.6) / 2) * (1 - sm((t - 8) / 3)); pose.t = [f.x + 30 * k, f.y + 1.45 - 6 * k, f.z + 4 * k]; pose.roll = Math.max(-0.3, Math.min(0.3, (f2.x * tg.z - f2.z * tg.x) * 1.6)); st.shake = Math.max(st.shake, t < 9 ? 0.4 : 0.05);
          lamp(outL, false); carL.u.uAmb.value = 0.55; carL.u.uUnder.value.set(0, 0, 0); steam.userData.step(dt, 0, 66, 4, t);
          if (t > 0.1) once('f', function () { A.fadeTo(0); sec('finale'); if (score) score.cut('finale'); if (hum) hum.set(0.09, 900, 0); K.rush(7, 2600, 500, 0.3, 0.4); K.thud(1.2); });
          if (t > 2.4) once('g', function () { K.line('🌋', NEMO, '你们从火山的侧面冲出来了！下面就是神秘岛的港湾——鹦鹉螺号在等着。', 'You have burst from the side of the volcano! Below lies the harbour of Mysterious Island — the Nautilus is waiting.'); });
          if (t > 11) once('h', function () { if (hum) hum.set(0.03, 600, 0); K.line('🧭', NEMO, '地心的秘密，现在你们也知道了。替我好好保守它。', 'Now you too know the secrets of the centre of the Earth. Keep them well for me.'); }); } }
    ];
    A.resetHook = function () { score = null; hum = null; lastZ = 13; strataTex.offset.y = 0; cvL.u.uFog.value.set(7 / 255, 5 / 255, 5 / 255); };
    return PH; }, tr('🌋 你去过地心，又活着回来了', '🌋 You have been to the centre of the Earth, and come back'));

    /* ================================================================ the way in, in the park */
    (function () { var x = 240, z = 585, gy = API.groundY(x, z, 62), E = new T.Group(); E.position.set(x, gy, z); API.scene.add(E); var Lm = function (c, e) { var m = new T.MeshLambertMaterial({ color: c }); if (e) m.emissive = new T.Color(e); return m; };
      var r = K.rnd(3); for (var i = 0; i < 16; i++) { var an = i / 16 * PI * 2, rr = 5 + r() * 2.4, h = 5 + r() * 9 + (Math.abs(Math.sin(an)) < 0.4 ? 0 : 3); if (Math.cos(an - PI / 2) > 0.8) continue; var m = new T.Mesh(K.rockGeo(3.4 + r() * 1.6, i + 1, 1, 0.3), Lm(K.mix(0x5a4636, 0x7a5038, r()))); m.position.set(Math.cos(an) * rr, h * 0.45, Math.sin(an) * rr - 1.5); m.scale.y = h / 5; E.add(m); }
      var top = new T.Mesh(K.rockGeo(4.2, 9, 1, 0.3), Lm(0x4a3a30)); top.position.set(0, 13.5, -1.5); top.scale.set(1.5, 1, 1.5); E.add(top);
      var cr = new T.Mesh(new T.SphereGeometry(2.0, 12, 8), new T.MeshBasicMaterial({ color: 0xff6a1a })); cr.position.set(0, 16.6, -1.5); cr.scale.y = 0.5; E.add(cr);
      [-2.6, 2.6].forEach(function (px) { var p = new T.Mesh(new T.BoxGeometry(0.5, 5, 0.5), Lm(0x5a3e28)); p.position.set(px, 2.5, 4.6); E.add(p); var lp = new T.Mesh(new T.SphereGeometry(0.28, 10, 8), new T.MeshBasicMaterial({ color: 0xffd28a })); lp.position.set(px, 4.2, 5.0); E.add(lp); });
      var beam = new T.Mesh(new T.BoxGeometry(6.4, 0.6, 0.6), Lm(0x5a3e28)); beam.position.set(0, 5.2, 4.6); E.add(beam);
      var hole = new T.Mesh(new T.CircleGeometry(2.3, 20), new T.MeshBasicMaterial({ color: 0x07090c })); hole.position.set(0, 2.4, 4.2); E.add(hole);
      var sign = new T.Mesh(new T.PlaneGeometry(6.6, 1.6), new T.MeshBasicMaterial({ map: K.paint(660, 160, function (c, w, h) { c.fillStyle = '#2a1c12'; c.fillRect(0, 0, w, h); c.strokeStyle = '#c79a3e'; c.lineWidth = 8; c.strokeRect(6, 6, w - 12, h - 12); c.fillStyle = '#ffb03c'; c.textAlign = 'center'; c.font = '800 38px Georgia,serif'; c.fillText('CENTER OF THE EARTH', w / 2, 64); c.fillStyle = '#f3ecd6'; c.font = '700 40px "PingFang SC",sans-serif'; c.fillText('地心探险', w / 2, 124); }) })); sign.position.set(0, 6.4, 4.95); E.add(sign); })();
  });
})(window);
