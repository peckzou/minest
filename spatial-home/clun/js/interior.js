/* Clun · 室内基础结构：各层隔墙和门洞、阁楼矮墙与贴屋面的墙、烟囱壁炉垛、开放井式楼梯（方立柱、木扶手）。
   坐标按平面图 1-8.jpg 量取后换算（≈84.5 px/m，以外墙为准对齐模型），全部 ESTIMATED。低细节材质：抹灰墙、木地板、木楼梯。 */
(function () {
  'use strict';
  var C = window.Clun = window.Clun || {}, P = C.P;

  /* 隔墙表：[起点, 终点, 厚, 门洞（沿墙中心坐标 c、宽 w）]。墙用中线表示；门洞位置用所在轴上的坐标。 */
  function walls(F) {
    var S = P.wallSpine, I = P.wallInt, X0 = -P.mainHalfW + P.wallExt, X1 = P.mainHalfW - P.wallExt, YF = P.wallExt, YR = P.mainDepth - P.wallExt, YRN = YR + P.rearStep;
    if (F === 0) return [   /* 一楼 */
      { a: [-1.05, YF], b: [-1.05, YR], t: 0.25, d: [2.22] },               /* 客厅 | 大厅，客厅门 */
      { a: [1.69, YF], b: [1.69, 3.95], t: 0.2, d: [3.45] },                /* 大厅 | 餐厅，餐厅门在楼梯起步之后 */
      { a: [-1.05, 3.95], b: [X1, 3.95], t: 0.17, d: [0.3] },               /* 大厅后墙（通后走廊）/ 餐厅 | 起居室 */
      { a: [1.17, 3.95], b: [1.17, YR], t: 0.17, d: [4.52] },               /* 后走廊 | 起居室（Snug） */
      { a: [-1.05, 4.97], b: [1.17, 4.97], t: I, d: [0.3] }                 /* 后走廊 | 卫生间 */
    ];
    if (F === 1) return [   /* 二楼 */
      { a: [-0.93, YF], b: [-0.93, YR], t: 0.18, d: [2.95, 4.1] },          /* 平台 | 卧室 2、书房 */
      { a: [1.72, YF], b: [1.72, 4.76], t: 0.2, d: [3.45] },                /* 平台 | 卧室 1 */
      { a: [X0, 3.4], b: [-0.93, 3.4], t: 0.18, d: [] },                    /* 卧室 2 | 书房 */
      { a: [-0.93, 4.76], b: [1.72, 4.76], t: I, d: [0.55] },               /* 平台 | 浴室 */
      { a: [1.72, 3.9], b: [X1, 3.9], t: 0.15, d: [4.3] },                  /* 卧室 1 | 浴室凹间、主卫 */
      { a: [3.07, 3.9], b: [3.07, YRN], t: I, d: [] }                       /* 浴室 | 主卫 */
    ];
    return [];
  }
  /* 阁楼：墙顶贴着屋面（屋面以下 0.25 m，最高到水平吊顶）。矮墙以外是檐下空间。 */
  function atticWalls() {
    var X0 = -P.mainHalfW + P.wallExt, X1 = P.mainHalfW - P.wallExt, k0 = P.kneeY0, k1 = P.kneeY1, YRN = P.mainDepth + P.rearStep - P.wallExt;
    var rx0 = P.rearDormX - P.rearDormHalfW, rx1 = P.rearDormX + P.rearDormHalfW, ga = 3.2, gb = 4.6, rf = P.rearDormFaceY - 0.18;
    return [
      { a: [-0.93, 0.36], b: [-0.93, k1], t: 0.15, d: [2.83] },             /* 楼梯间 | 卧室 4 */
      { a: [1.72, 0.36], b: [1.72, k1], t: 0.15, d: [3.05] },               /* 楼梯间 | 卧室 3 */
      { a: [X0, k0], b: [-0.93, k0], t: I() }, { a: [1.72, k0], b: [X1, k0], t: I() },        /* 前矮墙 */
      { a: [X0, k1], b: [rx0, k1], t: I() }, { a: [rx1, k1], b: [1.72, k1], t: I() },          /* 后矮墙（卧室 4、浴室） */
      { a: [rx0, k1], b: [rx0, rf], t: I() }, { a: [rx1, k1], b: [rx1, rf], t: I() },          /* 后老虎窗凹间 */
      { a: [1.72, k1], b: [ga, k1], t: I() }, { a: [gb, k1], b: [X1, k1], t: I() },            /* 卧室 3 后矮墙 */
      { a: [ga, k1], b: [ga, YRN], t: I() }, { a: [gb, k1], b: [gb, YRN], t: I() },            /* 后山墙凹间 */
      { a: [-0.93, 3.45], b: [1.72, 3.45], t: I(), d: [0.5] }               /* 平台 | 浴室 */
    ];
    function I() { return P.wallInt; }
  }
  /* 门洞在墙上的沿墙距离：墙沿 X 走用 X，沿 Y 走用 Y */
  function along(w, c) { var dx = w.b[0] - w.a[0], dy = w.b[1] - w.a[1]; return Math.abs(dx) > Math.abs(dy) ? (c - w.a[0]) * Math.sign(dx) : (c - w.a[1]) * Math.sign(dy); }

  function buildWalls(b, F, z0, z1) {
    walls(F).forEach(function (w) {
      var dx = w.b[0] - w.a[0], dy = w.b[1] - w.a[1], L = Math.sqrt(dx * dx + dy * dy), nx = -dy / L * w.t / 2, ny = dx / L * w.t / 2;
      b.wall('inner', [w.a[0] - nx, w.a[1] - ny], [w.b[0] - nx, w.b[1] - ny], w.t, z0, z1,
        (w.d || []).map(function (c) { return { s: along(w, c), w: P.doorW, z0: z0, z1: z0 + P.doorH, kind: 'open', frame: true }; }));
    });
  }

  /* —— 楼梯 —— */
  /* 转角踏步：N 内角（立柱处），从 N→S1 方向扫到 N→S2 方向，外沿是 S1→O→S2。返回 n 块踏面多边形。 */
  function winders(N, S1, O, S2, n) {
    var a0 = Math.atan2(S1[1] - N[1], S1[0] - N[0]), a1 = Math.atan2(S2[1] - N[1], S2[0] - N[0]), da = a1 - a0, segs = [[S1, O], [O, S2]], hits = [], i;
    if (da > Math.PI) da -= 2 * Math.PI; if (da < -Math.PI) da += 2 * Math.PI;
    for (i = 0; i <= n; i++) {
      var a = a0 + da * i / n, d = [Math.cos(a), Math.sin(a)];
      for (var k = 0; k < 2; k++) {
        var p = segs[k][0], q = segs[k][1], e = [q[0] - p[0], q[1] - p[1]], den = d[0] * e[1] - d[1] * e[0]; if (Math.abs(den) < 1e-9) continue;
        var w = [p[0] - N[0], p[1] - N[1]], t = (w[0] * e[1] - w[1] * e[0]) / den, s = (w[0] * d[1] - w[1] * d[0]) / den;
        if (t > 0 && s >= -1e-6 && s <= 1 + 1e-6) { hits.push({ p: [N[0] + d[0] * t, N[1] + d[1] * t], k: k }); break; }
      }
    }
    var polys = [];
    for (i = 0; i < n; i++) { var poly = [N, hits[i].p]; if (hits[i].k === 0 && hits[i + 1].k === 1) poly.push(O); poly.push(hits[i + 1].p); polys.push(poly); }
    return polys;
  }
  function step(b, poly, h, depth) { b.extrude('stair', poly.map(function (p) { return [p[0], p[1], h]; }), [0, 0, -depth]); }
  function newel(b, x, y, z0, z1) { b.box('rail', x - 0.055, y - 0.055, z0, x + 0.055, y + 0.055, z1); b.box('rail', x - 0.075, y - 0.075, z1, x + 0.075, y + 0.075, z1 + 0.06); }
  /* 扶手 + 栏杆：A、B 是踏步前沿线上的点（x,y,z），扶手在其上 0.9 m */
  function rail(b, A, B) {
    var H = 0.9, L = Math.sqrt(Math.pow(B[0] - A[0], 2) + Math.pow(B[1] - A[1], 2)), n = Math.max(1, Math.round(L / 0.12)), i;
    b.beam('rail', [A[0], A[1], A[2] + H], [B[0], B[1], B[2] + H], 0.065, 0.075);
    for (i = 1; i < n; i++) {
      var k = i / n, x = A[0] + (B[0] - A[0]) * k, y = A[1] + (B[1] - A[1]) * k, z = A[2] + (B[2] - A[2]) * k;
      b.box('trim', x - 0.016, y - 0.016, z - 0.02, x + 0.016, y + 0.016, z + H - 0.03);
    }
  }
  /* 斜梁（井侧的梯梁）：沿踏步前沿线，从 A 到 B */
  function string(b, A, B) { b.beam('stair', [A[0], A[1], A[2] - 0.1], [B[0], B[1], B[2] - 0.1], 0.05, 0.32); }

  /* 一层楼梯：北侧梯段（向正面上）→ 正面北角转角踏步 → 正面横跑（向南）→ [正面南角转角踏步 → 南侧短跑]。
     base 起点标高，H 层高，n 踢面数，south = 是否继续转到南侧上行（阁楼那一跑），solid = 北梯段下面做实（梯下储物间）。 */
  function stair(b, base, H, n, south, solid) {
    var r = H / n, xs = P.stairXS, xw = P.stairXW, xe = P.stairXE, xn = P.stairXN, yf = P.stairYF, y0 = P.stairY0, yw = P.wallExt;
    var nN = 8, g = (y0 - yf) / nN, i, h = 0, d = r + 0.12;
    for (i = 1; i <= nN; i++) { h = base + i * r; step(b, [[xe, y0 - i * g], [xn, y0 - i * g], [xn, y0 - (i - 1) * g], [xe, y0 - (i - 1) * g]], h, solid ? h - base : d); }
    winders([xe, yf], [xn, yf], [xn, yw], [xe, yw], 3).forEach(function (poly, k) { h = base + (nN + 1 + k) * r; step(b, poly, h, solid ? h - base : d); });
    var gx = (xe - xw) / 2;
    for (i = 0; i < 2; i++) { h = base + (nN + 4 + i) * r; step(b, [[xe - (i + 1) * gx, yw], [xe - i * gx, yw], [xe - i * gx, yf], [xe - (i + 1) * gx, yf]], h, d); }
    var top = base + H, kF = nN + 3;                       /* 扶手 */
    newel(b, xe, y0, base, base + r + 1.0);
    rail(b, [xe, y0, base + r], [xe, yf, base + (nN + 1) * r]); string(b, [xe, y0 + 0.1, base], [xe, yf, base + (nN + 1) * r]);
    newel(b, xe, yf, solid ? base : base + nN * r - 0.4, base + (kF + 1) * r + 1.0);
    rail(b, [xe, yf, base + (kF + 1) * r], [xw, yf, base + (kF + 3) * r]); string(b, [xe, yf, base + (kF + 1) * r], [xw, yf, base + (kF + 3) * r]);
    if (!south) { newel(b, xw, yf, base + (kF + 1) * r - 0.4, top + 1.05); return; }
    winders([xw, yf], [xw, yw], [xs, yw], [xs, yf], 3).forEach(function (poly, k) { step(b, poly, base + (kF + 3 + k) * r, d); });
    var kS = kF + 6;
    for (i = 0; base + (kS + i) * r < top - 1e-6; i++) step(b, [[xs, yf + i * 0.3], [xw, yf + i * 0.3], [xw, yf + (i + 1) * 0.3], [xs, yf + (i + 1) * 0.3]], base + (kS + i) * r, d);
    newel(b, xw, yf, base + (kF + 2) * r - 0.4, base + kS * r + 1.0);
    rail(b, [xw, yf, base + kS * r], [xw, P.stairYA, top]);
  }
  /* 楼板边上的平栏杆 */
  function landingRail(b, A, B, z) { rail(b, [A[0], A[1], z], [B[0], B[1], z]); }

  /* 给内饰用（furnish.js 挂门扇）：各层隔墙和门洞，同上面的表 */
  C.interiorWalls = function (F) { return F === 2 ? atticWalls() : walls(F); };
  C.wallAlong = along;
  C.buildInterior = function (G) {
    var K = C.Kit, F1 = P.floor1Z, F2 = P.floor2Z, b0 = new K.Batch(), b1 = new K.Batch(), b2 = new K.Batch(), Y2 = C.STAIR_TOP;
    buildWalls(b0, 0, 0, F1 - P.slabT);
    buildWalls(b1, 1, F1, F2 - P.slabT);
    /* 阁楼的墙：顶边跟屋面走 */
    var zc = F2 + P.atticCeil;
    function top(x, y) { return Math.min(zc, C.roofSurface(x, y) - 0.25); }
    atticWalls().forEach(function (w) {
      var dx = w.b[0] - w.a[0], dy = w.b[1] - w.a[1];
      K.cutWall(b2, 'inner', w.a, w.b, w.t, F2, top, (w.d || []).map(function (c) { return { s: along(w, c), w: P.doorW, h: P.doorH }; }));
    });
    /* 壁炉垛：客厅南墙；阁楼两间卧室贴着烟囱的山墙 */
    var X = P.mainHalfW - P.wallExt;
    b0.box('inner', -X, 2.75, 0, -X + 0.4, 4.35, F1 - P.slabT); b0.box('stone', -X + 0.4, 2.9, 0, -X + 0.47, 4.2, 1.2); b0.box('iron', -X + 0.46, 3.2, 0.05, -X + 0.49, 3.9, 0.9); b0.box('stone', -X + 0.38, 2.82, 1.2, -X + 0.6, 4.28, 1.27); b0.box('stone', -X, 2.75, 0, -X + 0.95, 4.35, 0.05);
    b2.box('inner', -X, 3.0, F2, -X + 0.38, 4.1, zc); b2.box('inner', X - 0.38, 2.75, F2, X, 4.1, zc);
    /* 楼梯：一楼→二楼（下面做实，作梯下储物间）、二楼→阁楼（叠在上面，最后转到南侧向后到阁楼平台） */
    stair(b0, 0, F1, P.stairRise1, false, true);
    stair(b1, F1, F2 - F1, P.stairRise2, true, false);
    /* 楼板边栏杆：二楼平台沿楼梯井；阁楼平台沿楼梯口后沿 */
    landingRail(b1, [P.stairXW, P.stairYF], [P.stairXW, Y2], F1); newel(b1, P.stairXW, Y2, F1 - 0.25, F1 + 1.05);
    landingRail(b1, [P.stairXW, Y2], [P.stairXE, Y2], F1); newel(b1, P.stairXE, Y2, F1 - 0.25, F1 + 1.05);
    landingRail(b2, [P.stairXW, P.stairYA], [P.stairXW, Y2], F2); newel(b2, P.stairXW, Y2, F2 - 0.25, F2 + 1.05);
    landingRail(b2, [P.stairXW, Y2], [P.stairXN, Y2], F2);
    b0.build(G.ground, C.mats); b1.build(G.first, C.mats); b2.build(G.attic, C.mats);
  };
})();
