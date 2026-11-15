/* Clun · 附属体量：北侧厨房扩建、西南阳光房、正面木门廊。M1 只做外部体量。 */
(function () {
  'use strict';
  var C = window.Clun = window.Clun || {}, P = C.P;

  /* —— 北侧厨房扩建：单层，南北向屋脊顶在主体北山墙上，北端斜脊面；正面凸窗上有小山墙，背面有玻璃凸间 —— */
  C.buildKitchen = function (G) {
    var K = C.Kit, b = new K.Batch(), W = P.mainHalfW, x1 = P.kitX1, y0 = P.kitY0, y1 = P.kitY1, ez = P.kitEaveZ, t = 0.3;
    var hw = P.kitBayHalfW, cant = P.kitBayCant, ret = P.kitBayReturn, cl = cant * Math.SQRT2;
    var rx0 = P.kitRearBayX0, rx1 = P.kitRearBayX1, rp = P.kitRearBayProj;
    var out = [{ p: [W, y0], n: 'f.s' }].concat(C.bayPts(P.kitBayX, y0, hw, ret, cant, 'bay')).concat([
      { p: [P.kitBayX + hw, y0], n: 'f.n' }, { p: [x1, y0], n: 'north' }, { p: [x1, y1], n: 'r.n' },
      { p: [rx1, y1], n: 'r.bay' }, { p: [rx0, y1], n: 'r.s' }, { p: [W, y1], n: 'end' }]);
    var ops = {
      'bay.f': [{ s: hw - cant, w: 2 * (hw - cant) - 0.2, z0: 0.6, z1: 2.1 }],
      'bay.c0': [{ s: cl / 2, w: cl - 0.25, z0: 0.6, z1: 2.1 }], 'bay.c1': [{ s: cl / 2, w: cl - 0.25, z0: 0.6, z1: 2.1 }],
      'bay.r0': [{ s: ret / 2 + 0.05, w: 0.42, z0: 0.6, z1: 2.1 }], 'bay.r1': [{ s: ret / 2 - 0.05, w: 0.42, z0: 0.6, z1: 2.1 }],
      'r.bay': [{ s: (rx1 - rx0) / 2, w: rx1 - rx0 - 0.3, z0: 0, z1: 2.15, kind: 'open' }],
      'r.s': [{ s: (rx0 - W) / 2, w: 0.85, z0: 0, z1: 2.05, kind: 'door' }]
    };
    b.walls('wall', out, false, t, P.groundZ, ez, ops);
    b.prism('slab', out.map(function (o) { return o.p; }), P.groundZ, 0);

    /* 屋顶 */
    var tk = K.tan(P.kitPitch), th = K.tan(P.kitHipPitch), o = 0.3, yc = (y0 + y1) / 2, half = (y1 - y0) / 2;
    var rz = ez + half * tk, zl = ez - o * tk, oh = o * tk / th, xr = x1 - (rz - ez) / th, rt = 0.15;
    b.slab('roof', [[W, y0 - o, zl], [x1 + oh, y0 - o, zl], [xr, yc, rz], [W, yc, rz]], rt);
    b.slab('roof', [[W, y1 + o, zl], [x1 + oh, y1 + o, zl], [xr, yc, rz], [W, yc, rz]], rt);
    b.slab('roof', [[x1 + oh, y0 - o, zl], [x1 + oh, y1 + o, zl], [xr, yc, rz]], rt);
    b.box('ridge', W, yc - 0.08, rz - 0.05, xr, yc + 0.08, rz + 0.06);
    /* 正面凸窗上的小山墙（挂瓦） */
    K.gable(b, b, { cx: P.kitBayX, faceY: y0 - ret - cant + 0.12, dir: -1, halfW: hw + 0.15, ovh: 0.25, verge: 0.3, pitch: 45, plateZ: ez,
      parentY: function (z) { return y0 + (z - ez) / tk; }, limitY: y0 - o, roofMat: 'roof', faceMat: 'tile', faceT: 0.18, roofT: 0.13 });
    b.box('trim', P.kitBayX - hw - 0.15, y0 - ret - cant + 0.12, ez - 0.12, P.kitBayX + hw + 0.15, y0, ez - 0.02);
    /* 背面玻璃凸间：矮墙 + 玻璃 + 玻璃山墙顶 */
    var gz = 2.3, gout = [{ p: [rx1, y1], n: 'n' }, { p: [rx1, y1 + rp], n: 'w' }, { p: [rx0, y1 + rp], n: 's' }, { p: [rx0, y1], n: 'x' }];
    b.walls('wall', gout, false, 0.25, P.groundZ, 0.75, null);
    b.walls('trim', gout, false, 0.1, 0.75, gz, {
      n: [{ s: rp / 2, w: rp - 0.3, z0: 0.82, z1: gz - 0.12 }], s: [{ s: rp / 2, w: rp - 0.3, z0: 0.82, z1: gz - 0.12 }],
      w: [{ s: (rx1 - rx0) / 2, w: rx1 - rx0 - 0.3, z0: 0.82, z1: gz - 0.12 }] });
    b.box('slab', rx0, y1, P.groundZ, rx1, y1 + rp, 0);
    K.gable(b, b, { cx: (rx0 + rx1) / 2, faceY: y1 + rp, dir: 1, halfW: (rx1 - rx0) / 2, ovh: 0.12, verge: 0.12, pitch: P.kitPitch, plateZ: gz,
      parentY: function (z) { return y1 - (z - ez) / tk; }, limitY: y1 + o, roofMat: 'glassRoof', faceMat: 'glass', faceT: 0.05, roofT: 0.05 });
    /* 烟囱：照片里立在屋脊与斜脊面交点附近 */
    C.chimney(b, P.kitChimX, yc, 0.33, 0.45, 0, ez, P.kitChimTopZ, [[0, -0.2], [0, 0.2]]);
    b.build(G.kitchen, C.mats);
  };

  /* —— 西南阳光房：矮砖墙 + 通高玻璃 + 玻璃山墙顶（屋脊东西向，顶在主体后墙上）—— */
  C.buildSunRoom = function (G) {
    var K = C.Kit, b = new K.Batch(), D = P.mainDepth, x0 = P.sunX0, x1 = P.sunX1, y1 = D + P.sunProj, dz = P.sunDwarfZ, ez = P.sunEaveZ;
    var out = [{ p: [x1, D], n: 'n' }, { p: [x1, y1], n: 'w' }, { p: [x0, y1], n: 's' }, { p: [x0, D], n: 'x' }];
    function panes(L) { var n = Math.max(1, Math.round(L / 1.15)), a = [], i; for (i = 0; i < n; i++) a.push({ s: (i + 0.5) * L / n, w: L / n - 0.12, z0: dz + 0.06, z1: ez - 0.14 }); return a; }
    b.walls('wall', out, false, 0.25, P.groundZ, dz, null);
    b.walls('trim', out, false, 0.1, dz, ez, { n: panes(P.sunProj), w: panes(x1 - x0), s: panes(P.sunProj) });
    b.box('slab', x0, D, P.groundZ, x1, y1, 0);
    K.gable(b, b, { cx: (x0 + x1) / 2, faceY: y1, dir: 1, halfW: (x1 - x0) / 2, ovh: 0.12, verge: 0.12, pitch: P.sunPitch, plateZ: ez,
      parentY: function () { return D; }, roofMat: 'glassRoof', faceMat: 'glass', faceT: 0.05, roofT: 0.05 });
    b.build(G.sunroom, C.mats);
  };

  /* —— 正面木门廊：两片侧壁 + 陡坡小山墙顶 + 台阶（M1 体量；马蹄形拱板等细节在 M2）—— */
  C.buildPorch = function (G) {
    var K = C.Kit, b = new K.Batch(), hw = P.porchHalfW, pr = P.porchProj, pz = P.porchPlateZ, side = [{ s: pr / 2, w: 0.6, z0: 0.75, z1: 1.35, kind: 'open' }];
    b.wall('trim', [-hw, 0], [-hw, -pr], 0.14, P.groundZ, pz, side);
    b.wall('trim', [hw, -pr], [hw, 0], 0.14, P.groundZ, pz, side);
    K.gable(b, b, { cx: 0, faceY: -pr, dir: -1, halfW: hw, ovh: 0.3, verge: 0.2, pitch: P.porchPitch, plateZ: pz,
      parentY: function () { return 0; }, roofMat: 'roof', faceMat: 'trim', faceT: 0.08, roofT: 0.12, faceBaseZ: pz + hw * K.tan(P.porchPitch) - 0.75 });
    b.box('slab', -hw, -pr, P.groundZ, hw, 0, -0.02);
    b.box('slab', -hw - 0.3, -pr - 0.45, P.groundZ, hw + 0.3, -pr, P.groundZ + P.stepRise);
    b.build(G.porch, C.mats);
  };
})();
