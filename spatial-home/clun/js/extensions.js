/* Clun · 附属部分：北侧厨房扩建、西南阳光房、正面木门廊（外部）。 */
(function () {
  'use strict';
  var C = window.Clun = window.Clun || {}, P = C.P;

  /* —— 北侧厨房扩建：单层，南北向屋脊顶在主体北山墙上，北端斜脊面；正面凸窗上有挂瓦小山墙，背面有玻璃凸间 —— */
  C.buildKitchen = function (G) {
    var K = C.Kit, b = new K.Batch(), W = P.mainHalfW, x1 = P.kitX1, y0 = P.kitY0, y1 = P.kitY1, ez = P.kitEaveZ, t = 0.3;
    var hw = P.kitBayHalfW, cant = P.kitBayCant, ret = P.kitBayReturn;
    var rx0 = P.kitRearBayX0, rx1 = P.kitRearBayX1, rp = P.kitRearBayProj;
    var out = [{ p: [W, y0], n: 'f.s' }].concat(C.bayPts(P.kitBayX, y0, hw, ret, cant, 'bay')).concat([
      { p: [P.kitBayX + hw, y0], n: 'f.n' }, { p: [x1, y0], n: 'north' }, { p: [x1, y1], n: 'r.n' },
      { p: [rx1, y1], n: 'r.bay' }, { p: [rx0, y1], n: 'r.s' }, { p: [W, y1], n: 'end' }]);
    var ops = C.bayOps('bay', hw, ret, cant, 0.6, 2.1);
    ops['r.bay'] = [{ s: (rx1 - rx0) / 2, w: rx1 - rx0 - 0.3, z0: 0, z1: 2.15, kind: 'open' }];
    ops['r.s'] = [{ s: (rx0 - W) / 2, w: 0.85, z0: 0, z1: 2.05, kind: 'door', glazed: true }];
    b.prism('slab', out.map(function (o) { return o.p; }), P.groundZ, 0);
    b.walls(function (n) { return (n.indexOf('f.') === 0 || n.indexOf('bay') === 0) ? 'wall' : 'wallRear'; }, out, false, t, 0, ez, ops);
    b.band('stone', [[W, y0]].concat(C.bayLine(P.kitBayX, y0, hw, ret, cant), [[x1, y0]]), false, 0.04, P.groundZ, 0.44);
    C.bayTrim(b, P.kitBayX, y0, hw, ret, cant, 0.6, 2.1, false);
    C.quoins(b, x1, y0, -1, 1, 0.44, ez - 0.1); C.quoins(b, x1, y1, -1, -1, 0, ez - 0.1);

    /* 屋顶 */
    var tk = K.tan(P.kitPitch), th = K.tan(P.kitHipPitch), o = 0.3, yc = (y0 + y1) / 2, half = (y1 - y0) / 2;
    var rz = ez + half * tk, zl = ez - o * tk, oh = o * tk / th, xr = x1 - (rz - ez) / th, rt = 0.15;
    b.slab('roof', [[W, y0 - o, zl], [x1 + oh, y0 - o, zl], [xr, yc, rz], [W, yc, rz]], rt);
    b.slab('roof', [[W, y1 + o, zl], [x1 + oh, y1 + o, zl], [xr, yc, rz], [W, yc, rz]], rt);
    b.slab('roof', [[x1 + oh, y0 - o, zl], [x1 + oh, y1 + o, zl], [xr, yc, rz]], rt);
    b.box('ridge', W, yc - 0.09, rz - 0.05, xr, yc + 0.09, rz + 0.07);
    /* 正面凸窗上的小山墙（挂瓦，白封檐板） */
    var gy = y0 - ret - cant + 0.12;
    K.gable(b, b, { cx: P.kitBayX, faceY: gy, dir: -1, halfW: hw + 0.15, ovh: 0.25, verge: 0.3, pitch: 45, plateZ: ez,
      parentY: function (z) { return y0 + (z - ez) / tk; }, limitY: y0 - o, roofMat: 'roof', faceMat: 'tile', faceT: 0.18, roofT: 0.13, barge: 'trim', bargeD: 0.2 });
    b.box('trim', P.kitBayX - hw - 0.15, gy, ez - 0.12, P.kitBayX + hw + 0.15, y0, ez - 0.02);
    b.box('trim', P.kitBayX - hw - 0.15, gy - 0.04, ez - 0.14, P.kitBayX + hw + 0.15, gy + 0.02, ez + 0.05);
    b.box('iron', P.kitBayX + hw + 0.45, y0 - o - 0.1, zl - 0.2, x1 + oh, y0 - o + 0.03, zl - 0.08);
    /* 背面玻璃凸间：矮砖墙 + 白色木窗 + 玻璃山墙顶 */
    var gz = 2.3, dz = 0.75, gout = [{ p: [rx1, y1], n: 'n' }, { p: [rx1, y1 + rp], n: 'w' }, { p: [rx0, y1 + rp], n: 's' }, { p: [rx0, y1], n: 'x' }];
    function pane(L, n) { return [{ s: L / 2, w: L - 0.16, z0: dz + 0.02, z1: gz - 0.1, lights: n, sill: false }]; }
    b.walls('wallRear', gout, false, 0.25, 0, dz, null);
    b.walls('trim', gout, false, 0.12, dz, gz, { n: pane(rp, 2), s: pane(rp, 2), w: pane(rx1 - rx0, 4) });
    b.box('slab', rx0, y1, P.groundZ, rx1, y1 + rp, 0);
    K.gable(b, b, { cx: (rx0 + rx1) / 2, faceY: y1 + rp, dir: 1, halfW: (rx1 - rx0) / 2, ovh: 0.12, verge: 0.12, pitch: P.kitPitch, plateZ: gz,
      parentY: function (z) { return y1 - (z - ez) / tk; }, limitY: y1 + o, roofMat: 'glassRoof', faceMat: 'glass', faceT: 0.04, roofT: 0.05, barge: 'trim', bargeD: 0.12 });
    /* 烟囱：照片里立在屋脊与斜脊面交点附近 */
    C.chimney(b, P.kitChimX, yc, 0.33, 0.45, 0, ez, P.kitChimTopZ, [[0, -0.2], [0, 0.2]]);
    b.build(G.kitchen, C.mats);
  };

  /* —— 西南阳光房：矮砖墙 + 白色木窗 + 玻璃山墙顶（屋脊东西向，顶在主体后墙上）—— */
  C.buildSunRoom = function (G) {
    var K = C.Kit, b = new K.Batch(), D = P.mainDepth, x0 = P.sunX0, x1 = P.sunX1, y1 = D + P.sunProj, dz = P.sunDwarfZ, ez = P.sunEaveZ, cx = (x0 + x1) / 2, hw = (x1 - x0) / 2;
    var out = [{ p: [x1, D], n: 'n' }, { p: [x1, y1], n: 'w' }, { p: [x0, y1], n: 's' }, { p: [x0, D], n: 'x' }];
    function panes(L) { var n = Math.max(1, Math.round(L / 1.15)), a = [], i; for (i = 0; i < n; i++) a.push({ s: (i + 0.5) * L / n, w: L / n - 0.1, z0: dz + 0.02, z1: ez - 0.1, lights: 2, sill: false }); return a; }
    b.walls('wallRear', out, false, 0.25, 0, dz, null);
    b.band('stone', out.map(function (o) { return o.p; }), false, 0.03, dz - 0.07, dz + 0.02);
    b.walls('trim', out, false, 0.12, dz, ez, { n: panes(P.sunProj), w: panes(x1 - x0), s: panes(P.sunProj) });
    b.box('slab', x0, D, P.groundZ, x1, y1, 0);
    var g = K.gable(b, b, { cx: cx, faceY: y1, dir: 1, halfW: hw, ovh: 0.12, verge: 0.12, pitch: P.sunPitch, plateZ: ez,
      parentY: function () { return D; }, roofMat: 'glassRoof', faceMat: 'glass', faceT: 0.04, roofT: 0.05, barge: 'trim', bargeD: 0.13 });
    /* 玻璃顶的白色椽条、脊条，山墙面上的竖棂 */
    var tg = K.tan(P.sunPitch), n = Math.round(P.sunProj / 0.62), i, hs = hw + 0.12;
    for (i = 1; i < n; i++) [-1, 1].forEach(function (s) {
      var y = D + i * P.sunProj / n;
      b.slab('trim', [[cx + s * hs, y - 0.022, g.lowZ + 0.035], [cx, y - 0.022, g.apexZ + 0.035], [cx, y + 0.022, g.apexZ + 0.035], [cx + s * hs, y + 0.022, g.lowZ + 0.035]], 0.07);
    });
    b.box('trim', cx - 0.04, D, g.apexZ - 0.04, cx + 0.04, y1 + 0.12, g.apexZ + 0.07);
    for (i = -2; i <= 2; i++) { var x = cx + i * hw / 3; b.box('trim', x - 0.022, y1 - 0.07, ez, x + 0.022, y1 - 0.02, g.apexZ - Math.abs(x - cx) * tg - 0.06); }
    b.build(G.sunroom, C.mats);
  };

  /* —— 正面木门廊：白色木作，正面是一整块带马蹄形拱洞的木板山墙，两侧下半截封板、上半截敞开；陡坡瓦顶；红地砖 —— */
  C.buildPorch = function (G) {
    var K = C.Kit, b = new K.Batch(), hw = P.porchHalfW, pr = P.porchProj, pz = P.porchPlateZ, tg = K.tan(P.porchPitch), fz = -0.02;
    var side = [{ s: pr / 2 - 0.05, w: pr - 0.4, z0: 0.95, z1: pz - 0.16, kind: 'open' }];
    b.wall('trim', [-hw, 0], [-hw, -pr], 0.12, fz, pz, side);
    b.wall('trim', [hw, -pr], [hw, 0], 0.12, fz, pz, side);
    var g = K.gable(b, b, { cx: 0, faceY: -pr, dir: -1, halfW: hw, ovh: 0.3, verge: 0.22, pitch: P.porchPitch, plateZ: pz,
      parentY: function () { return 0; }, roofMat: 'roof', roofT: 0.12, barge: 'trim', bargeD: 0.22 });
    /* 正面木板：五边形外轮廓，中间挖一个马蹄形（钥匙孔）拱洞 */
    var aF = g.apexZ - 0.12, R = 0.74, zc = 1.3, a0 = -50 * Math.PI / 180, hole = [], i, N = 28;
    hole.push([R * Math.cos(a0) - 0.06, fz + 0.03]);
    for (i = 0; i <= N; i++) { var a = a0 + (Math.PI - 2 * a0) * i / N; hole.push([R * Math.cos(a), zc + R * Math.sin(a)]); }
    hole.push([-R * Math.cos(a0) + 0.06, fz + 0.03]);
    K.face(b, { org: [0, -pr], U: [1, 0], N: [0, 1], t: 0.07, mat: 'trim', holes: [hole],
      pts: [[-hw, fz], [hw, fz], [hw, pz], [0, aF], [-hw, pz]] });
    b.box('porchFloor', -hw, -pr, P.groundZ, hw, 0, fz);
    b.box('stone', -hw - 0.3, -pr - 0.45, P.groundZ, hw + 0.3, -pr, P.groundZ + P.stepRise);
    b.build(G.porch, C.mats);
  };
})();
