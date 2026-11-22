/* Clun 室内 2.0 · 各房间。接在 1.0 的 C.buildFurnishings 后面：1.0 的家具照旧摆好，再加
   ① 每个房间的墙面做法（墙纸、护墙板、踢脚、挂镜线、顶角线、灯盘；手册里有照片的房间仍是奶油黄的底，只加同色暗花）
   ② 1.0 里空着或很素的地方：书房、三个卫浴、走廊、平台、阳光房的植物、餐桌的摆设、客厅的炉火和茶几……
   ③ 门：除书房、阳光房外默认开着；客厅通阳光房的洞口装上一对玻璃门；挡在门洞里或门扇后面的几件家具挪开（1.0 里门关着看不出来）。 */
(function () {
  'use strict';
  var C = window.Clun, P = C.P, K = C.Kit, V2 = C.V2, D = V2.D, PI = Math.PI;
  var O = V2.O, at = V2.at, piece = V2.piece, post = V2.post, ball = V2.ball, cone = V2.cone, leaf = V2.leaf, art = V2.art, rug = V2.rug, finish = V2.finish, rose = V2.rose;
  var F1 = D.F1, F2 = D.F2, X0 = D.X0, X1 = D.X1, YF = D.YF, YR = D.YR, YRN = D.YRN, z0 = D.z0, z1 = D.z1, z2 = D.z2, c0 = D.c0, c1 = D.c1, cA = D.cA;

  /* 默认关着的门（键 = 楼层:隔墙序号:门序号，同 1.0 furnish.js 的 SIDE 表；'0:sun' = 2.0 新做的客厅 → 阳光房双开玻璃门）。其余都开着 */
  V2.CLOSED = { '1:0:1': 'study', '0:sun': 'sun' };
  V2.DOOR_ROOM = { '0:0:0': 'drawing', '0:1:0': 'dining', '0:2:0': 'corridor', '0:3:0': 'snug', '0:4:0': 'wc', '0:sun': 'sun', '1:0:0': 'bed2', '1:0:1': 'study', '1:1:0': 'bed1', '1:3:0': 'bath', '1:4:0': 'ensuite', '2:0:0': 'bed4', '2:1:0': 'bed3', '2:12:0': 'atticBath' };
  /* 1.0 的家具里要挪开的几件：门关着时看不出来，门一开它们正好在门洞里或门扇扫过的地方。
     每条 = { m 材质, o [x, y, r] 这件家具在 1.0 里的位置和朝向, h [半宽, 半深], z [底, 顶], d [dx, dy], legs [lx, ly]（只挪这四条腿） }，先中的那条算数 */
  var MOVES = [
    { m: /^wood(Dark|Walnut)$/, kind: 'obox', o: [2.06, 3.0, 0], h: [0.31, 0.62], z: [0, 2.6], d: [0, -0.66] },                  /* 餐厅门口的格子柜 */
    { m: /^(fabRed|woodDark)$/, o: [2.4, 3.45, 0], h: [0.3, 0.25], z: [0, 2.6], d: [0.95, 0.05] },                               /* 餐厅门口的红脚凳 */
    { m: /^(fabCoral|fabPinkCheck)$/, o: [5.05, 5.55, -PI * 0.55], h: [0.46, 0.46], z: [0, 1.3], d: [-0.55, 0.15] },             /* 起居室通厨房的门洞前的珊瑚色扶手椅 */
    { m: /^woodDark$/, o: [5.05, 5.55, -PI * 0.55], legs: [0.35, 0.35], z: [0, 0.3], d: [-0.55, 0.15] },
    { m: /^fabTartanRed$/, o: [2.6, 2.3, PI * 0.8], h: [0.5, 0.5], z: [F2, F2 + 1.3], d: [0.6, -0.1] },                          /* 儿童房门后的红格子扶手椅 */
    { m: /^woodDark$/, o: [2.6, 2.3, PI * 0.8], legs: [0.35, 0.35], z: [F2, F2 + 0.3], d: [0.6, -0.1] },
    { m: /^(fabChintzGreen|woodDark)$/, o: [2.75, 3.3, PI / 2], h: [1.0, 0.56], z: [F2, F2 + 1.3], d: [0.4, 0.75] }             /* 儿童房门后的沙发床 */
  ];
  function withMoves(fn) {
    var B = K.Batch.prototype, ob = B.obox, ge = B.geom;
    function shift(kind, mat, x, y, z) {
      for (var i = 0; i < MOVES.length; i++) {
        var m = MOVES[i]; if ((m.kind && m.kind !== kind) || !m.m.test(mat) || z < m.z[0] || z > m.z[1]) continue;
        var c = Math.cos(m.o[2]), s = Math.sin(m.o[2]), lx = Math.abs((x - m.o[0]) * c + (y - m.o[1]) * s), ly = Math.abs(-(x - m.o[0]) * s + (y - m.o[1]) * c);
        if (m.legs ? Math.abs(lx - m.legs[0]) < 0.03 && Math.abs(ly - m.legs[1]) < 0.03 : lx < m.h[0] && ly < m.h[1]) return m.d;
      }
      return null;
    }
    B.obox = function (mat, cx, cy, hx, hy, rot, za, zb) { var d = shift('obox', mat, cx, cy, (za + zb) / 2); return ob.call(this, mat, cx + (d ? d[0] : 0), cy + (d ? d[1] : 0), hx, hy, rot, za, zb); };
    B.geom = function (mat, g, mx) { var e = mx.elements, d = shift('geom', mat, e[12], e[13], e[14]); if (d) mx = new THREE.Matrix4().makeTranslation(d[0], d[1], 0).multiply(mx); return ge.call(this, mat, g, mx); };   /* 圆柱（cyl）也走这里 */
    /* 厨房西墙的通顶高柜在 1.0 里一直排到 y = 6.0，把起居室通厨房的门洞（y 5.33–6.18）挡死了：2.0 让它停在门洞前，洞口里的那两条柜门缝和一根拉手不画 */
    var bx = B.box, kx = P.mainHalfW + 0.02;
    B.box = function (mat, x0, y0, z0, x1, y1, z1) {
      if (mat === 'gloss' && Math.abs(x0 - kx) < 1e-6 && Math.abs(y1 - 6.0) < 1e-6 && z1 > 2.3) y1 = 5.2;
      else if ((mat === 'quartz' || mat === 'steel') && x0 > kx + 0.6 && x1 < kx + 0.66 && y0 > 5.2 && y1 < 6.1 && z1 > 1.8) return this;
      return bx.call(this, mat, x0, y0, z0, x1, y1, z1);
    };
    try { fn(); } finally { B.obox = ob; B.geom = ge; B.box = bx; }
  }

  /* ---------------- 小件 ---------------- */
  function wbox(b, mat, axis, face, dir, u0, u1, d0, d1, za, zb) {      /* 贴墙的盒：axis = 墙面垂直于哪个轴，d = 离墙面的距离 */
    var p = face + dir * d0, q = face + dir * d1, lo = Math.min(p, q), hi = Math.max(p, q);
    if (axis === 'x') b.box(mat, lo, u0, za, hi, u1, zb); else b.box(mat, u0, lo, za, u1, hi, zb);
  }
  function curtains(b, mat, axis, face, dir, c, w, zb, zt, hw) {        /* 一对落地窗帘 + 铜杆 */
    hw = hw || 0.13;
    [-1, 1].forEach(function (s) { var u = c + s * (w / 2 + 0.1); wbox(b, mat, axis, face, dir, u - hw, u + hw, 0.03, 0.11, zb, zt + 0.07); });
    wbox(b, 'brass', axis, face, dir, c - w / 2 - 0.26, c + w / 2 + 0.26, 0.06, 0.082, zt + 0.07, zt + 0.092);
  }
  function blind(b, mat, axis, face, dir, c, w, zt, drop) { wbox(b, mat, axis, face, dir, c - w / 2 - 0.03, c + w / 2 + 0.03, 0.012, 0.03, zt - drop, zt + 0.04); }
  function mirror(b, axis, face, dir, a0, a1, za, zb, frame, fw) { fw = fw || 0.05; wbox(b, frame || 'gilt', axis, face, dir, a0, a1, 0.005, 0.04, za, zb); wbox(b, 'mirror', axis, face, dir, a0 + fw, a1 - fw, 0.04, 0.045, za + fw, zb - fw); }
  function towelRail(b, axis, face, dir, c, w, za, zb, towel) {         /* 镀铬梯形毛巾架 + 搭着的毛巾 */
    [-1, 1].forEach(function (s) { wbox(b, 'chrome', axis, face, dir, c + s * w / 2 - 0.012, c + s * w / 2 + 0.012, 0.04, 0.064, za, zb); });
    for (var i = 0; i < 6; i++) { var z = za + 0.06 + (zb - za - 0.12) * i / 5; wbox(b, 'chrome', axis, face, dir, c - w / 2, c + w / 2, 0.045, 0.06, z - 0.01, z + 0.01); }
    wbox(b, towel || 'towel', axis, face, dir, c - w / 2 + 0.05, c + w / 2 - 0.05, 0.035, 0.075, zb - 0.5, zb - 0.07);
  }
  function pot(b, x, y, z, r, h, mat) { b.cyl(mat || 'potTerra', x, y, z, z + h, r * 0.72, r, 14); b.cyl('woodDark', x, y, z + h - 0.03, z + h - 0.01, r * 0.9, r * 0.9, 12); }
  function palm(b, x, y, z, h) {
    pot(b, x, y, z, 0.2, 0.34); b.cyl('woodMid', x, y, z + 0.3, z + h * 0.55, 0.035, 0.022, 6);
    for (var i = 0; i < 10; i++) leaf(b, i % 2 ? 'plant' : 'plantDark', x, y, z + h * 0.55, i * 0.628 + 0.2, 0.85 - (i % 3) * 0.32, h * 0.48, 0.2);
  }
  function fern(b, x, y, z, s, potMat) {
    s = s || 1; pot(b, x, y, z, 0.13 * s, 0.2 * s, potMat || 'ceramic');
    for (var i = 0; i < 11; i++) leaf(b, i % 2 ? 'plantLight' : 'plant', x, y, z + 0.19 * s, i * 0.571, 0.6 - (i % 3) * 0.3, 0.42 * s, 0.11 * s);
  }
  function ficus(b, x, y, z, h) {
    pot(b, x, y, z, 0.19, 0.32, 'rattan'); b.cyl('woodDark', x, y, z + 0.3, z + h * 0.62, 0.022, 0.018, 6);
    for (var i = 0; i < 7; i++) { var a = i * 0.898; ball(b, i % 2 ? 'plantDark' : 'plant', x + Math.cos(a) * (i < 6 ? 0.17 : 0), y + Math.sin(a) * (i < 6 ? 0.17 : 0), z + h * (0.66 + (i % 3) * 0.1), 0.21, 1, 1, 0.85); }
  }
  function herb(b, x, y, z) { b.cyl('potTerra', x, y, z, z + 0.1, 0.042, 0.058, 10); ball(b, 'plantLight', x, y, z + 0.16, 0.075, 1, 1, 0.9); }
  var BOOK = ['velvetRed', 'paintNavy', 'velvetGreen', 'leather', 'fabButter'];
  function books(b, x, y, z, n, r) { for (var i = 0; i < n; i++) b.obox(BOOK[(i + (x > 0 ? 1 : 0)) % 5], x, y, 0.11 - i * 0.006, 0.078 - i * 0.003, (r || 0) + (i % 2 ? 0.14 : -0.09), z + i * 0.036, z + i * 0.036 + 0.033); return z + n * 0.036; }
  function cup(b, x, y, z) { b.cyl('ceramic', x, y, z, z + 0.008, 0.062, 0.062, 12); b.cyl('ceramic', x, y, z + 0.008, z + 0.065, 0.026, 0.036, 10); }
  function setting(b, x, y, z, gx, gy) { b.cyl('ceramic', x, y, z, z + 0.012, 0.085, 0.12, 16); b.cyl('fabLinen', x, y, z + 0.012, z + 0.02, 0.05, 0.05, 8); b.cyl('crystal', x + gx, y + gy, z, z + 0.11, 0.022, 0.03, 8); }
  function candle(b, x, y, z, h) { b.cyl('brass', x, y, z, z + 0.015, 0.05, 0.05, 10); b.cyl('brass', x, y, z + 0.015, z + h, 0.012, 0.016, 6); b.cyl('wax', x, y, z + h, z + h + 0.16, 0.012, 0.012, 6); cone(b, 'flame', x, y, z + h + 0.165, 0.045, 0.012, 6); }
  function bowl(b, x, y, z, r, fruit) { b.cyl('ceramic', x, y, z, z + r * 0.45, r * 0.5, r, 16); if (fruit) for (var i = 0; i < 5; i++) ball(b, i % 2 ? 'fruit' : 'toyRed', x + Math.cos(i * 1.257) * r * 0.45, y + Math.sin(i * 1.257) * r * 0.45, z + r * 0.5, r * 0.3); }
  function wardrobe(b, o, w, h, d, mat, n) {                             /* 衣柜：柜体、顶檐、底座、门板和铜拉手 */
    piece(b, mat, o, 0, 0, w / 2, d / 2, 0.07, h); piece(b, mat, o, 0, -0.01, w / 2 + 0.03, d / 2 + 0.03, h, h + 0.07); piece(b, mat, o, 0, 0, w / 2 + 0.015, d / 2 + 0.01, 0, 0.07);
    for (var k = 0; k < n; k++) { var cx = -w / 2 + (k + 0.5) * w / n; piece(b, 'paintWhite', o, cx, -d / 2 - 0.006, w / n / 2 - 0.05, 0.006, 0.22, h * 0.48); piece(b, 'paintWhite', o, cx, -d / 2 - 0.006, w / n / 2 - 0.05, 0.006, h * 0.52, h - 0.14);
      piece(b, 'brass', o, cx + (k % 2 ? -1 : 1) * (w / n / 2 - 0.025), -d / 2 - 0.02, 0.008, 0.012, h * 0.47, h * 0.56); }
  }
  function lowTable(b, o, w, d, h, top, leg) { piece(b, top, o, 0, 0, w / 2, d / 2, h - 0.04, h); piece(b, leg || top, o, 0, 0, w / 2 - 0.05, d / 2 - 0.05, 0.12, 0.15); [-1, 1].forEach(function (s) { [-1, 1].forEach(function (t) { post(b, leg || top, o, s * (w / 2 - 0.05), t * (d / 2 - 0.05), 0.022, 0, h - 0.04); }); }); }
  function basin(b, o) {                                                 /* 立柱洗手盆，靠墙一侧是局部 +y */
    post(b, 'ceramic', o, 0, 0.06, 0.085, 0, 0.7, 0.07); piece(b, 'ceramic', o, 0, 0, 0.27, 0.2, 0.7, 0.86); piece(b, 'mirror', o, 0, -0.02, 0.2, 0.13, 0.855, 0.865);
    post(b, 'chrome', o, 0, 0.14, 0.012, 0.86, 0.98); piece(b, 'chrome', o, 0, 0.09, 0.012, 0.06, 0.96, 0.98);
  }
  function toilet(b, o) {                                                /* 马桶：水箱在局部 +y（靠墙） */
    post(b, 'ceramic', o, 0, -0.08, 0.2, 0, 0.4, 0.17, 14); post(b, 'paintWhite', o, 0, -0.08, 0.2, 0.4, 0.425, 0.2, 14);
    piece(b, 'ceramic', o, 0, 0.2, 0.22, 0.09, 0.38, 0.82); piece(b, 'ceramic', o, 0, 0.2, 0.24, 0.1, 0.82, 0.85); post(b, 'chrome', o, 0, 0.2, 0.02, 0.85, 0.865);
  }
  function pendant(b, x, y, zc, drop, shade, r) { rose(b, x, y, zc, 0.2); b.cyl('brass', x, y, zc - drop, zc - 0.04, 0.008, 0.008, 6); b.cyl(shade, x, y, zc - drop - 0.2, zc - drop, r, r * 0.3, 18); b.cyl('opal', x, y, zc - drop - 0.21, zc - drop - 0.2, r * 0.7, r * 0.7, 12); }
  /* 面向家具正面（局部 −y）的一张贴图平面 */
  function facePlane(G, name, o, lx, ly, z, w, h) {
    var r = o.r || 0, n = new THREE.Vector3(Math.sin(r), -Math.cos(r), 0), up = new THREE.Vector3(0, 0, 1), right = new THREE.Vector3().crossVectors(up, n), p = at(o, lx, ly);
    var mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), C.mats[name]); mesh.position.set(p[0], p[1], o.z + z); mesh.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(right, up, n));
    mesh.userData.mat = name; mesh.name = 'art:' + name; G.add(mesh); return mesh;
  }
  function longClock(b, G, o) {                                          /* 落地大座钟 */
    piece(b, 'woodWalnut', o, 0, 0, 0.23, 0.14, 0, 0.36); piece(b, 'woodWalnut', o, 0, 0, 0.17, 0.11, 0.36, 1.46); piece(b, 'woodWalnut', o, 0, 0, 0.24, 0.15, 1.46, 1.96); piece(b, 'woodDark', o, 0, 0, 0.27, 0.17, 1.96, 2.02);
    piece(b, 'brass', o, 0, -0.112, 0.035, 0.004, 0.62, 1.3); post(b, 'brass', o, 0, -0.118, 0.06, 0.56, 0.575);
    facePlane(G, 'clockFace', o, 0, -0.153, 1.71, 0.36, 0.36);
  }
  /* 灯的光晕（面向镜头的小光斑，不参与碰撞） */
  V2.glows = [];
  function glow(G, x, y, z, s, color) {
    var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: V2.glowTex(), color: color || 0xffc27a, blending: THREE.AdditiveBlending, transparent: true, opacity: 0.5, depthWrite: false }));
    sp.position.set(x, y, z); sp.scale.set(s, s, 1); sp.name = 'glow'; G.add(sp); V2.glows.push(sp); return sp;
  }

  var bf0 = C.buildFurnishings;
  C.buildFurnishings = function (G) {
    withMoves(function () { bf0(G); });
    C.seats.forEach(function (q) {                                                                 /* 挪开的椅子、沙发床：「坐下 / 躺下」的位置跟着挪 */
      for (var k = 0; k < MOVES.length; k++) {
        var m = MOVES[k]; if (!m.h || q.z < m.z[0] - 0.05 || q.z > m.z[1]) continue;
        var c = Math.cos(m.o[2]), s = Math.sin(m.o[2]), dx = q.x - m.o[0], dy = q.y - m.o[1];
        if (Math.abs(dx * c + dy * s) < m.h[0] && Math.abs(-dx * s + dy * c) < m.h[1]) { q.x += m.d[0]; q.y += m.d[1]; break; }
      }
    });
    var g0 = new K.Batch(), g1 = new K.Batch(), g2 = new K.Batch(), gk = new K.Batch(), gs = new K.Batch(), i;
    V2.glows = []; V2.spots = [];

    /* ================= 墙面做法 ================= */
    finish(g0, 'drawing', { paper: 'wpDrawing', rail: 2.16 });
    finish(g0, 'hall', { paper: 'wpHall', wains: { h: 0.92 } });
    finish(g0, 'dining', { paper: 'wpDining', rail: 2.16 });
    finish(g0, 'corridor', { paper: 'wpHall', wains: { h: 0.92 } });
    finish(g0, 'wc', { paper: 'wpWC', tile: { h: 1.2 } });
    finish(g0, 'snug', { paper: 'wpSnug', rail: 2.16 });
    finish(g1, 'landing', { paper: 'wpHall', wains: { h: 0.92 } });
    finish(g1, 'bed2', { paper: 'wpBed2', rail: 2.14 });
    finish(g1, 'bed1', { paper: 'wpBed1', rail: 2.14 });
    finish(g1, 'study', { paper: 'wpStudy', rail: 2.14, railMat: 'woodWalnut', skirtMat: 'woodWalnut', wains: { h: 1.0, mat: 'woodOak', stile: 'woodWalnut', cap: 'woodWalnut' } });
    finish(g1, 'bath', { paper: 'paintAqua', tile: { h: 1.25 } });
    finish(g1, 'ensuite', { paper: 'paintAqua', tile: { h: 1.25 } });
    [[g0, -3.42, 3.3, c0, 0.34], [g0, 3.76, 2.1, c0, 0.34], [g0, 3.9, 5.25, c0, 0.3], [g0, -0.3, 1.25, c0, 0.2], [g0, -0.3, 2.9, c0, 0.2], [g1, 3.6, 2.1, c1, 0.3], [g1, -3.42, 1.85, c1, 0.26]].forEach(function (q) { rose(q[0], q[1], q[2], q[3], q[4]); });
    /* 地面：后走廊的几何地砖，三个卫浴的黑白格 */
    g0.box('floorEnc', -0.925, 4.035, z0, 1.085, 4.91, z0 + 0.01); g0.box('floorCheck', -0.925, 5.03, z0, 1.085, YR, z0 + 0.01);
    g1.box('floorCheck', -0.84, 4.82, z1, 3.01, YR, z1 + 0.01); g1.box('floorCheck', 1.82, 3.975, z1, 3.01, 4.82, z1 + 0.01); g1.box('floorCheck', 2.03, YR, z1, 3.01, YRN, z1 + 0.01);
    g1.box('floorCheck', 3.13, 3.975, z1, X1, YRN, z1 + 0.01); g2.box('floorCheck', -0.855, 3.51, z2, 1.645, P.kneeY1, z2 + 0.01);

    /* ================= 门厅、后走廊、卫生间 ================= */
    g0.box('woodWalnut', -0.921, 1.42, z0 + 1.6, -0.9, 1.72, z0 + 1.69); [1.47, 1.57, 1.67].forEach(function (y) { g0.box('brass', -0.9, y - 0.012, z0 + 1.62, -0.85, y + 0.012, z0 + 1.645); });
    g0.box('fabTealDeep', -0.9, 1.44, z0 + 0.98, -0.82, 1.6, z0 + 1.64); g0.box('fabRed', -0.9, 1.62, z0 + 1.2, -0.855, 1.7, z0 + 1.64);
    g0.cyl('brass', -0.72, 0.47, z0, z0 + 0.5, 0.09, 0.105, 14); g0.beam('ironBlack', [-0.74, 0.46, z0 + 0.1], [-0.7, 0.5, z0 + 0.92], 0.025, 0.025); g0.beam('velvetRed', [-0.7, 0.45, z0 + 0.1], [-0.76, 0.5, z0 + 0.86], 0.03, 0.03);
    mirror(g0, 'x', -0.925, 1, 2.92, 3.48, z0 + 1.22, z0 + 2.0, 'gilt', 0.06);
    art(g0, G.ground, 'artBot0', 'x', 1.59, 2.72, z0 + 1.72, 0.27, 0.36, -1, 'woodDark', 0.03); art(g0, G.ground, 'artBot1', 'x', 1.59, 2.2, z0 + 2.05, 0.27, 0.36, -1, 'woodDark', 0.03);
    art(g0, G.ground, 'artLand', 'y', 3.865, -0.47, z0 + 1.62, 0.42, 0.3, -1, 'gilt'); art(g0, G.ground, 'artFlower', 'y', 3.865, 1.14, z0 + 1.62, 0.34, 0.42, -1, 'gilt');
    art(g0, G.ground, 'artSea', 'x', -0.925, 4.47, z0 + 1.6, 0.4, 0.28, 1, 'gilt');
    g0.cyl('opal', 0.08, 4.47, c0 - 0.1, c0, 0.13, 0.09, 14); glow(G.ground, 0.08, 4.47, c0 - 0.12, 0.5);
    blind(g0, 'fabLinen', 'y', YR, -1, 0.3, 0.7, z0 + 2.3, 0.4); wbox(g0, 'chrome', 'y', 5.03, 1, 0.82, 0.98, 0.02, 0.05, z0 + 1.0, z0 + 1.02); wbox(g0, 'towel', 'y', 5.03, 1, 0.84, 0.96, 0.03, 0.06, z0 + 0.72, z0 + 1.01);
    herb(g0, 0.6, 6.38, z0 + 0.8); art(g0, G.ground, 'artBot2', 'x', 1.085, 5.75, z0 + 1.66, 0.25, 0.33, -1, 'woodDark', 0.03);
    g0.cyl('opal', 0.08, 5.75, c0 - 0.1, c0, 0.13, 0.09, 14); glow(G.ground, 0.08, 5.75, c0 - 0.12, 0.5);

    /* ================= 客厅：炉火、茶几、南窗窗帘、棕榈 ================= */
    var fx = X0 + 0.47;
    (function () {
      var fb = new K.Batch(), fg = new THREE.Group(), lb = g0;
      lb.box('ember', fx + 0.045, 3.3, z0 + 0.07, fx + 0.14, 3.8, z0 + 0.12);
      [3.42, 3.6].forEach(function (y, k) { lb.geom('woodDark', new THREE.CylinderGeometry(0.035, 0.035, 0.4, 8), new THREE.Matrix4().makeTranslation(fx + 0.085 + k * 0.02, y + 0.05, z0 + 0.15 + k * 0.04).multiply(new THREE.Matrix4().makeRotationZ(k ? 0.25 : -0.2))); });
      [[-0.17, 0.2], [-0.08, 0.3], [0.02, 0.24], [0.1, 0.33], [0.18, 0.19]].forEach(function (q) { cone(fb, 'flame', 0, q[0], 0, q[1], 0.045, 7); });
      fb.build(fg, C.mats); fg.position.set(fx + 0.09, 3.55, z0 + 0.14); fg.name = 'fire'; G.ground.add(fg); V2.fire = fg;
      V2.fireGlow = glow(G.ground, fx + 0.16, 3.55, z0 + 0.3, 0.9, 0xff8a3a);
    })();
    var ct = O(-3.25, 3.72, PI / 2, z0); lowTable(g0, ct, 1.0, 0.55, 0.42, 'woodWalnut'); books(g0, -3.3, 3.4, z0 + 0.42, 3, 0.3);
    g0.box('brass', -3.42, 3.72, z0 + 0.42, -3.08, 4.12, z0 + 0.435); cup(g0, -3.33, 3.83, z0 + 0.435); cup(g0, -3.17, 4.0, z0 + 0.435); g0.cyl('ceramic', -3.3, 4.02, z0 + 0.435, z0 + 0.55, 0.05, 0.065, 12);
    curtains(g0, 'fabCrewel', 'x', X0, 1, 5.45, 1.5, z0, z0 + 2.22);
    palm(g0, -2.28, 6.08, z0, 1.75);

    /* ================= 餐厅：摆好的餐桌、落地钟、画 ================= */
    [1.45, 2.1, 2.75].forEach(function (y) { setting(g0, 3.48, y, z0 + 0.76, 0.1, 0.16); setting(g0, 4.04, y, z0 + 0.76, -0.1, 0.16); }); setting(g0, 3.76, 1.22, z0 + 0.76, 0.17, 0.08);
    candle(g0, 3.76, 1.72, z0 + 0.76, 0.2); candle(g0, 3.76, 2.48, z0 + 0.76, 0.2); bowl(g0, 3.76, 2.1, z0 + 0.76, 0.16, true);
    longClock(g0, G.ground, O(1.79 + 0.16, 1.0, PI / 2, z0));
    art(g0, G.ground, 'artFlower', 'y', 3.865, 4.25, z0 + 1.62, 0.44, 0.54, -1, 'gilt');

    /* ================= 小起居室：皮脚凳、画、盆栽 ================= */
    g0.cyl('leather', 4.02, 5.22, z0 + 0.06, z0 + 0.38, 0.3, 0.3, 20); g0.cyl('woodDark', 4.02, 5.22, z0, z0 + 0.06, 0.26, 0.26, 16); books(g0, 4.05, 5.18, z0 + 0.38, 2, 0.5); cup(g0, 3.88, 5.32, z0 + 0.38);
    art(g0, G.ground, 'artLand', 'y', 4.035, 3.3, z0 + 1.62, 0.62, 0.42, 1, 'gilt');
    ficus(g0, 1.95, 6.18, z0, 1.6);

    /* ================= 厨房：岛台和台面上的东西 ================= */
    var ix = 8.3, kx1 = P.kitX1 - 0.3;
    gk.cyl('ceramic', ix, 2.55, 0.95, 1.2, 0.06, 0.085, 12); for (i = 0; i < 7; i++) ball(gk, i % 3 ? 'bloom' : 'plant', ix + Math.cos(i * 0.9) * 0.09, 2.55 + Math.sin(i * 0.9) * 0.09, 1.26 + (i % 2) * 0.05, 0.055);
    bowl(gk, ix + 0.05, 3.0, 0.95, 0.17, true); gk.box('woodLight', ix - 0.3, 2.1, 0.95, ix + 0.1, 2.35, 0.972); gk.geom('woodMid', new THREE.SphereGeometry(0.09, 10, 6), new THREE.Matrix4().makeTranslation(ix - 0.12, 2.22, 1.0).multiply(new THREE.Matrix4().makeScale(1.6, 0.9, 0.7)));
    gk.cyl('steel', kx1 - 0.3, 4.75, 0.94, 1.12, 0.085, 0.07, 14); gk.cyl('range', kx1 - 0.3, 4.75, 1.12, 1.14, 0.03, 0.03, 8);
    gk.cyl('ceramic', kx1 - 0.25, 5.2, 0.94, 1.1, 0.06, 0.065, 12); [[-0.02, 0.03], [0.02, -0.02], [0.0, 0.0]].forEach(function (q, k) { gk.beam(k ? 'woodLight' : 'steel', [kx1 - 0.25 + q[0], 5.2 + q[1], 1.05], [kx1 - 0.25 + q[0] * 3, 5.2 + q[1] * 3, 1.3], 0.014, 0.014); });
    [1.45, 1.68, 1.91].forEach(function (y) { herb(gk, kx1 - 0.18, y, 0.94); });
    [5.62, 5.76].forEach(function (y, k) { gk.cyl(k ? 'wine' : 'enamelGreen', kx1 - 0.2, y, 0.94, 1.14, 0.034, 0.034, 10); gk.cyl(k ? 'wine' : 'enamelGreen', kx1 - 0.2, y, 1.14, 1.24, 0.034, 0.012, 10); });

    /* ================= 阳光房：藤茶几和茶具、棕榈、琴叶榕 ================= */
    var st = O(-3.35, 8.68, 0, 0.03); lowTable(gs, st, 0.9, 0.5, 0.4, 'rattan'); gs.box('paintWhite', -3.6, 8.55, 0.43, -3.2, 8.82, 0.445); gs.cyl('ceramic', -3.5, 8.68, 0.445, 0.56, 0.06, 0.075, 12); cup(gs, -3.33, 8.62, 0.445); cup(gs, -3.3, 8.76, 0.445); fern(gs, -3.05, 8.68, 0.43, 0.5);
    palm(gs, -1.78, 7.22, 0.03, 1.9); ficus(gs, -5.24, 7.14, 0.03, 1.7); fern(gs, -1.7, 10.0, 0.03, 0.9, 'potTerra');

    /* ================= 二楼平台：两块地毯、小书柜、植物图谱 ================= */
    rug(G.first, 'runnerRed', -0.72, 0.62, -0.14, 2.5, F1); rug(G.first, 'runnerRed', -0.5, 3.2, 1.3, 4.1, F1, true);
    g1.box('paintCream', 1.06, 4.42, z1, 1.56, 4.7, z1 + 1.1); g1.box('books', 1.09, 4.412, z1 + 0.06, 1.53, 4.42, z1 + 1.06); g1.box('paintCream', 1.04, 4.4, z1 + 1.1, 1.58, 4.7, z1 + 1.13); fern(g1, 1.3, 4.56, z1 + 1.13, 0.7);
    [1.0, 1.5, 2.0].forEach(function (y, k) { art(g1, G.first, 'artBot' + k, 'x', -0.84, y, z1 + 1.6, 0.27, 0.36, 1, 'woodDark', 0.03); });

    /* ================= 卧室 1、卧室 2：衣柜 ================= */
    wardrobe(g1, O(1.82 + 0.3, 2.3, PI / 2, z1), 1.1, 2.05, 0.56, 'paintCream', 2);
    wardrobe(g1, O(-2.8, 3.31 - 0.3, 0, z1), 1.2, 2.05, 0.56, 'paintWhite', 3);
    books(g1, X1 - 0.27, 3.32, z1 + 0.66, 2, 0.2);

    /* ================= 书房：橡木护墙板、墨绿暗花墙纸（finish），红丝绒窗帘、老地图、书梯、边几和酒瓶、绿罩吊灯 ================= */
    curtains(g1, 'velvetRed', 'y', YR, -1, -1.6, 0.75, z1, z1 + 2.04, 0.095); curtains(g1, 'velvetRed', 'y', YR, -1, -3.9, 1.0, z1, z1 + 2.04);
    art(g1, G.first, 'artMap', 'x', X0, 5.4, z1 + 1.72, 0.96, 0.6, 1, 'woodWalnut', 0.05);
    [-0.2, 0.2].forEach(function (s) { g1.beam('woodMid', [-3.3 + s, 4.42, z1], [-3.3 + s, 3.86, z1 + 2.12], 0.04, 0.05); });
    for (i = 1; i <= 7; i++) { var ly = 4.42 - 0.56 * i / 7.6, lz = z1 + 2.12 * i / 7.6; g1.box('woodMid', -3.5, ly - 0.02, lz - 0.015, -3.1, ly + 0.02, lz + 0.015); }
    g1.cyl('woodDark', -2.3, 5.25, z1 + 0.53, z1 + 0.56, 0.24, 0.24, 18); g1.cyl('woodDark', -2.3, 5.25, z1, z1 + 0.53, 0.03, 0.03, 8); g1.cyl('woodDark', -2.3, 5.25, z1, z1 + 0.03, 0.16, 0.16, 12);
    g1.cyl('crystal', -2.36, 5.3, z1 + 0.56, z1 + 0.7, 0.05, 0.045, 10); g1.cyl('wine', -2.36, 5.3, z1 + 0.565, z1 + 0.64, 0.044, 0.04, 10); g1.cyl('crystal', -2.36, 5.3, z1 + 0.7, z1 + 0.78, 0.018, 0.018, 8); g1.cyl('crystal', -2.2, 5.18, z1 + 0.56, z1 + 0.64, 0.028, 0.03, 8);
    books(g1, X0 + 0.72, 4.82, z1 + 0.76, 3, 0.2); books(g1, -1.42, 5.02, z1, 4, 0.4);
    pendant(g1, -3.5, 5.0, c1, 0.5, 'enamelGreen', 0.26); glow(G.first, -3.5, 5.0, c1 - 0.72, 0.75);
    V2.spots.push([-3.5, 5.0, c1 - 0.75]);

    /* ================= 浴室、主卫 ================= */
    g1.box('chrome', 0.84, 6.02, z1 + 0.58, 0.9, 6.18, z1 + 0.72); g1.box('towelBlue', -0.35, 5.18, z1 + 0.01, 0.45, 5.66, z1 + 0.022); fern(g1, -0.6, 6.3, z1 + 0.58, 0.55);
    basin(g1, O(3.01 - 0.21, 5.45, -PI / 2, z1)); mirror(g1, 'x', 3.01, -1, 5.17, 5.73, z1 + 1.32, z1 + 1.98, 'chrome', 0.03);
    toilet(g1, O(2.52, YRN - 0.3, 0, z1)); towelRail(g1, 'y', 3.975, 1, 2.42, 0.5, z1 + 0.75, z1 + 1.75, 'towelBlue');
    g1.cyl('rattan', 2.72, 4.36, z1, z1 + 0.5, 0.17, 0.2, 14); g1.cyl('towel', 2.72, 4.36, z1 + 0.5, z1 + 0.56, 0.17, 0.17, 12);
    blind(g1, 'fabLinen', 'y', YR, -1, 0.75, 0.7, z1 + 2.0, 0.34); g1.cyl('opal', 1.0, 5.55, c1 - 0.1, c1, 0.15, 0.1, 16); glow(G.first, 1.0, 5.55, c1 - 0.12, 0.6);
    g1.box('ceramic', 3.13, 4.5, z1 + 0.01, 4.0, 5.6, z1 + 0.07); g1.box('glass', 3.99, 4.5, z1 + 0.07, 4.005, 5.6, z1 + 2.0); g1.box('glass', 3.13, 4.5, z1 + 0.07, 4.0, 4.515, z1 + 2.0);
    g1.box('chrome', 3.98, 4.49, z1 + 0.07, 4.012, 4.522, z1 + 2.0); g1.box('chrome', 3.98, 5.58, z1 + 0.07, 4.012, 5.612, z1 + 2.0);
    g1.cyl('chrome', 3.17, 5.05, z1 + 1.0, z1 + 2.06, 0.012, 0.012, 6); g1.beam('chrome', [3.17, 5.05, z1 + 2.05], [3.42, 5.05, z1 + 2.05], 0.02, 0.02); g1.cyl('chrome', 3.42, 5.05, z1 + 2.0, z1 + 2.04, 0.1, 0.1, 14);
    towelRail(g1, 'y', YRN, -1, 4.92, 0.5, z1 + 0.75, z1 + 1.75); blind(g1, 'fabLinen', 'y', YRN, -1, 3.95, 1.0, z1 + 2.0, 0.34); fern(g1, X1 - 0.3, 5.05, z1 + 0.86, 0.45);
    g1.cyl('opal', 4.5, 5.2, c1 - 0.1, c1, 0.15, 0.1, 16); glow(G.first, 4.5, 5.2, c1 - 0.12, 0.6);

    /* ================= 阁楼：卧室 4 的地毯和绿植，儿童房的小路地毯、积木、小熊，阁楼浴室 ================= */
    rug(G.attic, 'runnerBlue', -3.9, 2.0, -2.1, 2.9, F2, true); fern(g2, -1.3, P.kneeY0 + 0.3, z2 + 0.95, 0.6); books(g2, -1.62, P.kneeY0 + 0.3, z2 + 0.95, 2, 0.1);
    rug(G.attic, 'playRug', 3.3, 2.35, 4.9, 3.55, F2 + 0.012);
    [[3.75, 2.62, 'toyRed', 0], [3.9, 2.74, 'toyBlue', 0.5], [3.72, 2.86, 'toyYellow', 0.2], [3.82, 2.72, 'toyYellow', 0.3, 0.1], [4.2, 3.2, 'toyBlue', 0.8]].forEach(function (q) { g2.obox(q[2], q[0], q[1], 0.05, 0.05, q[3], z2 + 0.012 + (q[4] || 0), z2 + 0.112 + (q[4] || 0)); });
    ball(g2, 'toyRed', 4.45, 2.75, z2 + 0.11, 0.1);
    (function (x, y, z) { ball(g2, 'teddy', x, y, z + 0.13, 0.13, 1, 1, 1.1); ball(g2, 'teddy', x, y, z + 0.33, 0.095); [-1, 1].forEach(function (s) { ball(g2, 'teddy', x + s * 0.07, y, z + 0.42, 0.035); ball(g2, 'teddy', x + s * 0.13, y - 0.03, z + 0.17, 0.045, 1, 1, 1.6); ball(g2, 'teddy', x + s * 0.08, y - 0.1, z + 0.045, 0.05, 1, 1.5, 1); }); ball(g2, 'paintCream', x, y - 0.08, z + 0.31, 0.04); })(4.05, 4.1, z2 + 0.012);
    g2.box('ceramic', -0.7, 4.75, z2, 1.0, 5.36, z2 + 0.55); g2.box('mirror', -0.6, 4.84, z2 + 0.53, 0.9, 5.28, z2 + 0.555); g2.box('chrome', 0.86, 4.98, z2 + 0.55, 0.92, 5.12, z2 + 0.68);
    toilet(g2, O(1.38, 4.15, -PI / 2, z2)); basin(g2, O(-0.855 + 0.21, 4.25, PI / 2, z2)); mirror(g2, 'x', -0.855, 1, 3.98, 4.52, z2 + 1.25, z2 + 1.85, 'chrome', 0.03);
    g2.box('towelBlue', -0.2, 4.1, z2 + 0.01, 0.6, 4.6, z2 + 0.022); g2.cyl('opal', 0.4, 4.2, cA - 0.1, cA, 0.15, 0.1, 16); glow(G.attic, 0.4, 4.2, cA - 0.12, 0.6);

    g0.build(G.ground, C.mats); g1.build(G.first, C.mats); g2.build(G.attic, C.mats); gk.build(G.kitchen, C.mats); gs.build(G.sunroom, C.mats);

    /* ================= 灯的光晕（位置同 1.0 的灯表） ================= */
    var kx = (P.kitRearBayX0 + P.kitRearBayX1) / 2, ky = P.kitY1 + P.kitRearBayProj - 1.25;
    [[G.ground, -3.42, 3.3, c0 - 0.14, 0.7], [G.ground, -1.62, 5.3, z0 + 0.98, 0.5], [G.ground, -5.2, 4.65, z0 + 1.42, 0.55], [G.ground, -3.42, -1.05, z0 + 1.36, 0.55], [G.ground, -0.3, 1.25, c0 - 0.49, 0.6], [G.ground, -0.3, 2.9, c0 - 0.49, 0.6],
      [G.ground, 3.76, 2.1, c0 - 0.6, 0.8], [G.ground, 3.9, 5.25, c0 - 0.6, 0.7], [G.ground, X1 - 0.25, 5.15, z0 + 1.08, 0.45], [G.kitchen, ix, 2.3, 1.74, 0.5], [G.kitchen, ix, 3.3, 1.74, 0.5], [G.kitchen, ix, 4.3, 1.74, 0.5], [G.kitchen, ix, 5.2, 1.74, 0.5],
      [G.kitchen, kx, ky, 1.62, 0.5], [G.sunroom, -3.45, 8.55, 2.2, 0.7], [G.first, 0.0, 2.0, c1 - 0.54, 0.6], [G.first, 3.6, 2.1, c1 - 0.4, 0.7], [G.first, X1 - 0.27, 0.75, z1 + 0.98, 0.45], [G.first, X1 - 0.27, 3.45, z1 + 0.98, 0.45],
      [G.first, -3.42, 1.85, c1 - 0.5, 0.6], [G.first, X0 + 0.27, 0.65, z1 + 0.98, 0.45], [G.first, X0 + 0.27, 3.05, z1 + 0.98, 0.45], [G.first, X0 + 0.45, 4.95, z1 + 1.05, 0.4], [G.first, -1.45, 6.1, z1 + 1.42, 0.55],
      [G.attic, -3.1, 3.5, cA - 0.5, 0.6], [G.attic, 3.8, 3.0, cA - 0.5, 0.6]].forEach(function (q) { glow(q[0], q[1], q[2], q[3], q[4]); });
    /* 外景只建了进门路上的 4 盏灯；另外两盏跟着人走：走到哪个房间，就挪到那里最近的两处灯位（见 v2-live.js） */
    V2.spots = V2.spots.concat([[-3.42, 3.3, c0 - 0.3], [-3.42, -0.9, z0 + 1.4], [3.76, 2.1, c0 - 0.75], [3.9, 5.25, c0 - 0.75], [ix, 3.3, 1.6], [ix, 5.0, 1.6], [kx, ky, 1.5], [-3.45, 8.55, 1.85], [0.08, 5.1, c0 - 0.3],
      [3.6, 2.1, c1 - 0.6], [-3.42, 1.85, c1 - 0.7], [1.0, 5.55, c1 - 0.3], [4.5, 5.2, c1 - 0.3], [-3.1, 3.5, cA - 0.6], [3.8, 3.0, cA - 0.6], [0.4, 4.2, cA - 0.3]]);
    V2.rovers = [];
    if (C.lampMode === 'walk') for (i = 0; i < 2; i++) { var l = new THREE.PointLight(0xffc77d, 2.2, 7, 1.5); l.position.set(V2.spots[i][0], V2.spots[i][1], V2.spots[i][2]); l.name = 'lamp'; G.ground.parent.add(l); C.lamps.push({ light: l, base: l.intensity, walk: true }); V2.rovers.push(l); }

    /* ================= 门：除书房、阳光房外默认开着 ================= */
    var keys = []; [0, 1, 2].forEach(function (F) { C.interiorWalls(F).forEach(function (w, wi) { (w.d || []).forEach(function (c, di) { keys.push(F + ':' + wi + ':' + di); }); }); });
    C.doors.forEach(function (d, k) {
      d.key = keys[k]; d.room = V2.DOOR_ROOM[d.key] || null;
      if (d.key === '1:0:1') {                                                                       /* 书房门朝平台的一面钉一块小铜牌 */
        var n = new THREE.Vector3(0, -d.side, 0), up = new THREE.Vector3(0, 0, 1), right = new THREE.Vector3().crossVectors(up, n), pl = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.094), C.mats.plaqueStudy);
        pl.position.set((P.doorW - 0.03) / 2 + 0.015, -d.side * 0.027, 1.52); pl.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(right, up, n)); pl.userData.mat = 'plaqueStudy'; pl.name = 'art:plaque'; d.pivot.add(pl);
      }
    });
    /* 客厅 → 阳光房：1.0 只有一个带门套的洞口，这里装上一对白框玻璃门（朝阳光房开）。两扇共用一个开关状态：点哪一扇都一起开 / 关 */
    (function () {
      var st = { open: false }, lw = 0.69, dh = 2.06, y = P.mainDepth - 0.045;
      [-1, 1].forEach(function (s) {
        var pivot = new THREE.Group(), b = new K.Batch(), base = s < 0 ? 0 : PI, i;
        pivot.name = 'door'; pivot.position.set(-3.5 + s * 0.695, y, 0.03);
        b.box('paintWhite', 0, -0.02, 0, 0.07, 0.02, dh); b.box('paintWhite', lw - 0.07, -0.02, 0, lw, 0.02, dh);          /* 两根边梃 */
        b.box('paintWhite', 0.07, -0.02, 0, lw - 0.07, 0.02, 0.24); b.box('paintWhite', 0.07, -0.02, dh - 0.09, lw - 0.07, 0.02, dh);   /* 下冒头、上冒头 */
        b.box('paintWhite', lw / 2 - 0.011, -0.014, 0.24, lw / 2 + 0.011, 0.014, dh - 0.09);                                 /* 玻璃格条：一竖三横 */
        for (i = 1; i <= 3; i++) { var z = 0.24 + (dh - 0.33) * i / 4; b.box('paintWhite', 0.07, -0.014, z - 0.011, lw - 0.07, 0.014, z + 0.011); }
        b.box('glass', 0.07, -0.004, 0.24, lw - 0.07, 0.004, dh - 0.09);
        [-1, 1].forEach(function (k) { b.cyl('brass', lw - 0.035, k * 0.04, 0.98, 1.02, 0.02, 0.02, 10); b.box('brass', lw - 0.15, k * 0.05 - 0.008, 0.992, lw - 0.03, k * 0.05 + 0.008, 1.008); });
        if (s < 0) b.box('paintWhite', lw - 0.015, 0.02, 0, lw + 0.025, 0.032, dh);                                       /* 盖缝条：钉在一扇上，盖住两扇中间的缝 */
        b.build(pivot, C.mats); G.ground.add(pivot); pivot.rotation.z = base;
        var d = { pivot: pivot, base: base, side: -s, a: 0, key: '0:sun', room: 'sun' };
        Object.defineProperty(d, 'open', { get: function () { return st.open; }, set: function (v) { st.open = !!v; }, enumerable: true });
        C.doors.push(d);
      });
    })();
    C.doors.forEach(function (d) {
      d.open = !V2.CLOSED[d.key]; d.a = d.open ? 1 : 0;
      d.pivot.rotation.z = d.base + d.side * d.a * 82 * PI / 180;                                   /* 同 1.0 plate.js 的开门角度 */
    });
  };
})();
