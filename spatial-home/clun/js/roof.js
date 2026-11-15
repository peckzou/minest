/* Clun · 主屋顶、南北山墙端、正面两座山墙、中央老虎窗、后山墙、后老虎窗、主烟囱、檐沟和雨水管。 */
(function () {
  'use strict';
  var C = window.Clun = window.Clun || {}, P = C.P;

  /* 主屋面：屋脊南北向，位于进深正中。eastZ / westZ = 两坡上表面在 Y 处的标高。 */
  C.roofFns = function () {
    var K = C.Kit, tm = K.tan(P.roofPitch), D = P.mainDepth, ry = D / 2;
    return {
      tm: tm, ridgeY: ry, ridgeZ: P.eaveZ + tm * ry,
      eastZ: function (y) { return P.eaveZ + tm * y; }, westZ: function (y) { return P.eaveZ + tm * (D - y); },
      eastY: function (z) { return (z - P.eaveZ) / tm; }, westY: function (z) { return D - (z - P.eaveZ) / tm; }
    };
  };

  /* 烟囱：砖身 + 两道出挑线脚 + 陶罐。hx/hy = 半长（转 rot 前沿 X / Y）。pots = 罐在局部坐标里的位置。 */
  C.chimney = function (b, x, y, hx, hy, rot, z0, zTop, pots) {
    b.obox('chimney', x, y, hx, hy, rot, z0, zTop - 0.42);
    b.obox('chimney', x, y, hx + 0.05, hy + 0.05, rot, zTop - 0.42, zTop - 0.3);
    b.obox('chimney', x, y, hx + 0.1, hy + 0.1, rot, zTop - 0.3, zTop - 0.12);
    b.obox('chimney', x, y, hx + 0.03, hy + 0.03, rot, zTop - 0.12, zTop);
    b.obox('stone', x, y, hx - 0.03, hy - 0.03, rot, zTop, zTop + 0.05);
    var c = Math.cos(rot), s = Math.sin(rot);
    pots.forEach(function (p) {
      var px = x + p[0] * c - p[1] * s, py = y + p[0] * s + p[1] * c;
      b.cyl('pot', px, py, zTop + 0.05, zTop + 0.05 + P.chimPotH, 0.125, 0.1, 12);
      b.cyl('pot', px, py, zTop + P.chimPotH - 0.03, zTop + 0.05 + P.chimPotH, 0.125, 0.125, 12);
    });
  };

  /* 屋面上表面在 (x,y) 处的标高（主屋面、正面山墙、老虎窗、后山墙取最高者）。阁楼里的墙顶据此算。 */
  C.roofSurface = function (x, y) {
    var K = C.Kit, R = C.roofFns(), W = P.mainHalfW, z = Math.min(R.eastZ(y), R.westZ(y)), d;
    if (y < R.ridgeY) [P.bayS, P.bayN].forEach(function (cx) {
      d = Math.abs(x - cx); if (d < P.gableHalfW + P.roofOvh) z = Math.max(z, P.eaveZ + (P.gableHalfW - d) * K.tan(P.gablePitch));
    });
    if (Math.abs(x - P.dormX) < P.dormHalfW + 0.2 && y >= P.dormFaceY - 0.2) z = Math.max(z, P.dormEaveZ + K.tan(P.dormPitch) * (y - P.dormFaceY));
    if (y > R.ridgeY) {
      d = Math.abs(x - (P.rearStepX + W) / 2); if (d < P.rearGableHalfW + 0.3) z = Math.max(z, P.eaveZ + (P.rearGableHalfW - d) * R.tm);
      d = Math.abs(x - P.rearDormX); if (d < P.rearDormHalfW + 0.3 && y <= P.rearDormFaceY + 0.25) z = Math.max(z, P.rearDormEaveZ + (P.rearDormHalfW - d) * K.tan(P.rearDormPitch));
    }
    return z;
  };

  C.buildRoof = function (G) {
    var K = C.Kit, R = C.roofFns(), W = P.mainHalfW, D = P.mainDepth, o = P.roofOvh, L = W + P.roofVerge, t = P.roofT;
    var roof = new K.Batch(), attic = new K.Batch(), chim = new K.Batch();
    function east(x0, x1, ya, yb) { roof.slab('roof', [[x0, ya, R.eastZ(ya)], [x1, ya, R.eastZ(ya)], [x1, yb, R.eastZ(yb)], [x0, yb, R.eastZ(yb)]], t); }
    function west(pts) { roof.slab('roof', pts.map(function (p) { return [p[0], p[1], R.westZ(p[1])]; }), t); }

    /* —— 中央老虎窗（楼梯间）：斜披顶从主屋面中上部伸出，窗面略退在檐口线后；七扇窗 —— */
    var dw = P.dormHalfW, dx0 = P.dormX - dw, dx1 = P.dormX + dw, fy = P.dormFaceY, td = K.tan(P.dormPitch), ze = P.dormEaveZ;
    var yM = (ze - td * fy - P.eaveZ) / (R.tm - td);                 /* 披顶与主屋面相交处 */
    function dz(y) { return ze + td * (y - fy); }
    roof.slab('roof', [[dx0 - 0.2, fy - 0.2, dz(fy - 0.2)], [dx1 + 0.2, fy - 0.2, dz(fy - 0.2)], [dx1 + 0.2, yM, dz(yM)], [dx0 - 0.2, yM, dz(yM)]], 0.14);
    roof.box('trim', dx0 - 0.22, fy - 0.24, dz(fy - 0.2) - 0.2, dx1 + 0.22, fy - 0.19, dz(fy - 0.2) + 0.02);
    attic.wall('trim', [dx0, fy], [dx1, fy], 0.18, R.eastZ(fy) - 0.05, ze, [{ s: dw, w: 2 * dw - 0.2, z0: P.floor2Z + 0.22, z1: ze - 0.16, lights: 7, transom: false, sill: false }], 0, 0, 'inner');
    [[dx0, 1], [dx1, -1]].forEach(function (q) {
      attic.extrude('trim', [[q[0], fy, R.eastZ(fy)], [q[0], fy, ze - 0.08], [q[0], yM - 0.15, dz(yM - 0.15) - 0.08]], [q[1] * 0.15, 0, 0]);
    });

    /* —— 东坡（正面）：中央老虎窗处开口，留檐口一条 —— */
    east(-L, dx0, -o, R.ridgeY); east(dx1, L, -o, R.ridgeY); east(dx0, dx1, -o, fy); east(dx0, dx1, yM, R.ridgeY);

    /* —— 正面两座山墙：压在两层凸窗上方，挂瓦，白色封檐板和托架；屋脊向后插入东坡 —— */
    [P.bayS, P.bayN].forEach(function (cx) {
      K.gable(roof, attic, { cx: cx, faceY: P.gableFaceY, dir: -1, halfW: P.gableHalfW, ovh: o, verge: P.gableVerge, pitch: P.gablePitch,
        plateZ: P.eaveZ, parentY: R.eastY, limitY: -o, roofMat: 'roof', faceMat: 'tile', faceT: 0.22, roofT: t, barge: 'trim', bargeD: 0.26 });
      attic.box('trim', cx - P.gableHalfW, P.gableFaceY, P.eaveZ - 0.12, cx + P.gableHalfW, 0, P.eaveZ - 0.02);   /* 山墙底板（凸窗顶） */
      attic.box('trim', cx - P.gableHalfW, P.gableFaceY - 0.04, P.eaveZ - 0.16, cx + P.gableHalfW, P.gableFaceY + 0.02, P.eaveZ + 0.06);   /* 山墙脚横木 */
      [-1, 1].forEach(function (s) {                           /* 托架 */
        var x = cx + s * (P.bayHalfW + 0.2);
        attic.extrude('trim', [[x, 0, P.eaveZ - 1.0], [x, 0, P.eaveZ - 0.14], [x, -0.95, P.eaveZ - 0.14]], [s * 0.08, 0, 0]);
      });
    });

    /* —— 后山墙（北段，外凸 rearStep），阁楼窗 —— */
    var gx = (P.rearStepX + W) / 2, gh = P.rearGableHalfW, gov = 0.3, ghs = gh + gov;
    var rg = K.gable(roof, attic, { cx: gx, faceY: D + P.rearStep, dir: 1, halfW: gh, ovh: gov, verge: 0.3, pitch: P.roofPitch,
      plateZ: P.eaveZ, parentY: R.westY, limitY: D + o, roofMat: 'roof', faceMat: 'wallRear', faceT: P.wallExt, roofT: t, barge: 'trim',
      wins: [{ s0: -0.55, s1: 0.55, z0: P.floor2Z + 0.5, z1: P.floor2Z + 1.15, lights: 2, transom: false }] });
    var yA = R.westY(rg.apexZ), yE = Math.min(R.westY(rg.lowZ), D + o), yV = yA + (L - gx) * (yE - yA) / ghs;

    /* —— 后老虎窗（南段，Bedroom 4）：小山墙顶，挂瓦 —— */
    var rx = P.rearDormX, rw = P.rearDormHalfW, rf = P.rearDormFaceY, rz = P.rearDormEaveZ, yP = R.westY(rz);
    K.gable(roof, attic, { cx: rx, faceY: rf, dir: 1, halfW: rw, ovh: 0.3, verge: 0.25, pitch: P.rearDormPitch,
      plateZ: rz, parentY: R.westY, limitY: D + o, roofMat: 'roof', faceMat: 'tile', faceT: 0.18, roofT: 0.13, barge: 'trim', bargeD: 0.2 });
    attic.wall('tile', [rx + rw, rf], [rx - rw, rf], 0.18, R.westZ(rf) - 0.05, rz, [{ s: rw, w: 2 * rw - 0.5, z0: R.westZ(rf) + 0.15, z1: rz - 0.15, lights: 3, transom: false }]);
    [-1, 1].forEach(function (s) {
      attic.extrude('tile', [[rx + s * rw, rf, R.westZ(rf)], [rx + s * rw, rf, rz], [rx + s * rw, yP, rz]], [-s * 0.15, 0, 0]);
    });

    /* —— 西坡（背面）：后老虎窗处开口，后山墙下方按天沟线裁开 —— */
    var ry = R.ridgeY;
    west([[-L, ry], [rx - rw, ry], [rx - rw, D + o], [-L, D + o]]);
    west([[rx - rw, ry], [rx + rw, ry], [rx + rw, yP], [rx - rw, yP]]);
    west([[rx - rw, rf], [rx + rw, rf], [rx + rw, D + o], [rx - rw, D + o]]);
    west([[rx + rw, ry], [gx - ghs, ry], [gx - ghs, D + o], [rx + rw, D + o]]);
    west([[gx - ghs, ry], [gx, ry], [gx, yA], [gx - ghs, yE]]);
    west([[gx, ry], [L, ry], [L, yV], [gx, yA]]);
    /* 西坡上的天窗（浴室） */
    (function () {
      function q(x0, x1, y0, y1, up) { return [[x0, y0, R.westZ(y0) + up], [x1, y0, R.westZ(y0) + up], [x1, y1, R.westZ(y1) + up], [x0, y1, R.westZ(y1) + up]]; }
      roof.slab('iron', q(-0.72, 0.02, 4.5, 5.4, 0.05), 0.05); roof.slab('glass', q(-0.66, -0.04, 4.57, 5.33, 0.07), 0.02);
    })();

    /* —— 南北山墙端（檐口以上的三角墙），各有阁楼小窗；顶边收在屋面板内 —— */
    var gp = [[0.12, P.eaveZ], [D - 0.12, P.eaveZ], [ry, R.ridgeZ - 0.12 * R.tm]], we = P.wallExt;
    function gw(s0, k) { return { s0: s0, s1: s0 + 0.55, z0: P.floor2Z + 0.7, z1: P.floor2Z + 1.4, lights: 1, transom: false, kind: k }; }
    K.face(attic, { org: [-W, 0], U: [0, 1], N: [1, 0], pts: gp, t: we, mat: 'wall', wins: [gw(4.2)] });
    K.face(attic, { org: [W, 0], U: [0, 1], N: [-1, 0], pts: gp, t: we, mat: 'wall', wins: [gw(2.05), gw(4.2)] });
    /* 室内一面的抹灰（贴在山墙内侧） */
    K.face(attic, { org: [-W + we, 0], U: [0, 1], N: [1, 0], pts: gp, t: 0.01, mat: 'inner', wins: [gw(4.2, 'open')] });
    K.face(attic, { org: [W - we, 0], U: [0, 1], N: [-1, 0], pts: gp, t: 0.01, mat: 'inner', wins: [gw(2.05, 'open'), gw(4.2, 'open')] });
    (function () {                                             /* 后山墙内侧抹灰 */
      var tg = R.tm, aF = rg.apexZ - t * 0.6 * Math.sqrt(1 + tg * tg), hw = (aF - P.eaveZ) / tg;
      K.face(attic, { org: [gx, D + P.rearStep - we], U: [1, 0], N: [0, -1], pts: [[-hw, P.eaveZ], [hw, P.eaveZ], [0, aF]], t: 0.01, mat: 'inner',
        wins: [{ s0: -0.55, s1: 0.55, z0: P.floor2Z + 0.5, z1: P.floor2Z + 1.15, kind: 'open' }] });
    })();
    /* 阁楼屋脊下的水平吊顶（两坡之间） */
    (function () {
      var zc = P.floor2Z + P.atticCeil, y0 = R.eastY(zc + 0.25), y1 = R.westY(zc + 0.25);
      roof.box('ceil', -W + we, y0, zc - 0.05, W - we, y1, zc);
    })();
    /* 屋脊 */
    roof.box('ridge', -L, ry - 0.1, R.ridgeZ - 0.06, L, ry + 0.1, R.ridgeZ + 0.08);

    /* —— 檐沟和雨水管（铸铁） —— */
    var hs = P.gableHalfW + o, zg = P.eaveZ - o * R.tm;
    [[-L, P.bayS - hs], [P.bayS + hs, P.bayN - hs], [P.bayN + hs, L]].forEach(function (s) { if (s[1] - s[0] > 0.1) roof.box('iron', s[0], -o - 0.1, zg - 0.22, s[1], -o + 0.03, zg - 0.1); });
    roof.box('iron', -L, D + o - 0.03, zg - 0.22, gx - ghs, D + o + 0.1, zg - 0.1);
    [P.bayS - P.bayHalfW - 0.14, P.bayS + P.bayHalfW + 0.14, P.bayN - P.bayHalfW - 0.14, P.bayN + P.bayHalfW + 0.14].forEach(function (x) { roof.cyl('iron', x, -0.07, P.groundZ, zg - 0.2, 0.045, 0.045, 10); });
    [P.rearStepX - 0.14, -1.25].forEach(function (x) { roof.cyl('iron', x, D + 0.07, P.groundZ, zg - 0.2, 0.045, 0.045, 10); });

    /* —— 主烟囱：屋脊南北两端。南：斜向 45°；北：长边垂直于屋脊 —— */
    var zc0 = P.floor2Z + P.atticCeil - 0.05;
    C.chimney(chim, -W + P.chimInset, ry, 0.5, 0.5, Math.PI / 4, zc0, P.chimTopZ, [[-0.22, -0.22], [0.22, -0.22], [-0.22, 0.22], [0.22, 0.22]]);
    C.chimney(chim, W - P.chimInset, ry, 0.4, 0.68, 0, zc0, P.chimTopZ, [[0, -0.42], [0, -0.14], [0, 0.14], [0, 0.42]]);

    roof.build(G.roof, C.mats); attic.build(G.attic, C.mats); chim.build(G.chimneys, C.mats);
  };
})();
