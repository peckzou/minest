/* Clun · 主体：外墙（按层）、楼板、正面两层凸窗，以及勒脚、墙角石、凸窗线脚。洞口位置来自平面图和照片，尺寸都是 ESTIMATED。 */
(function () {
  'use strict';
  var C = window.Clun = window.Clun || {}, P = C.P;

  /* 一个斜切凸窗的外轮廓点（沿 +X 行进，室内在左），c = 中心 X，y0 = 所在墙面的 Y，name = 段名前缀 */
  C.bayPts = function (c, y0, hw, ret, cant, name) {
    return [
      { p: [c - hw, y0], n: name + '.r0' }, { p: [c - hw, y0 - ret], n: name + '.c0' },
      { p: [c - hw + cant, y0 - ret - cant], n: name + '.f' }, { p: [c + hw - cant, y0 - ret - cant], n: name + '.c1' },
      { p: [c + hw, y0 - ret], n: name + '.r1' }
    ];
  };
  /* 同一个凸窗的折线（含回到墙面的终点），给线脚 / 勒脚用 */
  C.bayLine = function (c, y0, hw, ret, cant) {
    return C.bayPts(c, y0, hw, ret, cant, '').map(function (o) { return o.p; }).concat([[c + hw, y0]]);
  };
  /* 凸窗洞口：正面三扇、斜边两扇、直边一扇；窗台由整圈石带代替 */
  C.bayOps = function (name, hw, ret, cant, zs, zh) {
    var o = {}, cl = cant * Math.SQRT2, fl = 2 * (hw - cant);
    o[name + '.f'] = [{ s: fl / 2, w: fl - 0.16, z0: zs, z1: zh, lights: 3, sill: false }];
    o[name + '.c0'] = [{ s: cl / 2, w: cl - 0.16, z0: zs, z1: zh, lights: 2, sill: false }];
    o[name + '.c1'] = [{ s: cl / 2, w: cl - 0.16, z0: zs, z1: zh, lights: 2, sill: false }];
    o[name + '.r0'] = [{ s: ret / 2 + 0.04, w: ret - 0.26, z0: zs, z1: zh, lights: 1, sill: false }];
    o[name + '.r1'] = [{ s: ret / 2 - 0.04, w: ret - 0.26, z0: zs, z1: zh, lights: 1, sill: false }];
    return o;
  };
  /* 凸窗四个转角的白色木柱（把转角的砖条盖住），窗台石带，窗头线脚 */
  C.bayTrim = function (b, c, y0, hw, ret, cant, zs, zh, cornice) {
    var v = [[c - hw, y0 - ret, 22.5], [c - hw + cant, y0 - ret - cant, 67.5], [c + hw - cant, y0 - ret - cant, 112.5], [c + hw, y0 - ret, 157.5]];
    v.forEach(function (q) { var a = q[2] * Math.PI / 180; b.obox('trim', q[0] + Math.cos(a) * 0.07, q[1] + Math.sin(a) * 0.07, 0.1, 0.1, a, zs, zh); });
    var line = C.bayLine(c, y0, hw, ret, cant);
    b.band('stone', line, false, 0.06, zs - 0.1, zs + 0.012);
    if (cornice) { b.band('trim', line, false, 0.09, zh, zh + 0.1); b.band('iron', line, false, 0.12, zh + 0.1, zh + 0.14); }
  };
  /* 墙角石：长短交替的石块。(x,y) 是外墙角，sx / sy = 朝室内的方向（±1） */
  C.quoins = function (b, x, y, sx, sy, z0, z1) {
    var h = 0.3, i = 0, z, o = 0.025, d = 0.06;                /* 只贴在两个外墙面上，不穿进室内 */
    function bx(xa, xb, ya, yb, za, zb) { b.box('stone', Math.min(xa, xb), Math.min(ya, yb), za, Math.max(xa, xb), Math.max(ya, yb), zb); }
    for (z = z0; z + h <= z1 + 0.05; z += h, i++) {
      var lx = i % 2 ? 0.24 : 0.46, ly = i % 2 ? 0.46 : 0.24, za = z + 0.01, zb = Math.min(z1, z + h - 0.01);
      bx(x - sx * o, x + sx * lx, y - sy * o, y + sy * d, za, zb);
      bx(x - sx * o, x + sx * d, y - sy * o, y + sy * ly, za, zb);
    }
  };
  /* 主体一、二层共用的外轮廓（逆时针，室内在左） */
  C.mainOutline = function () {
    var W = P.mainHalfW, D = P.mainDepth, hw = P.bayHalfW;
    return [{ p: [-W, 0], n: 'front.s' }]
      .concat(C.bayPts(P.bayS, 0, hw, P.bayReturn, P.bayCant, 'bayS'))
      .concat([{ p: [P.bayS + hw, 0], n: 'front.c' }])
      .concat(C.bayPts(P.bayN, 0, hw, P.bayReturn, P.bayCant, 'bayN'))
      .concat([
        { p: [P.bayN + hw, 0], n: 'front.n' }, { p: [W, 0], n: 'north' }, { p: [W, D + P.rearStep], n: 'rear.n' },
        { p: [P.rearStepX, D + P.rearStep], n: 'rear.step' }, { p: [P.rearStepX, D], n: 'rear.s' }, { p: [-W, D], n: 'south' }
      ]);
  };
  /* 阁楼层楼板轮廓：不含凸窗；檐口一侧内收 i，让楼板角不顶穿屋面（屋面在外墙线上只有檐口标高）。
     e = 南北山墙端内收量。前沿留出楼梯口：北侧梯段和楼梯井到 stairY0 前，南侧到 stairYA。 */
  C.atticOutline = function (e) {
    var Wo = P.mainHalfW, W = Wo - (e || 0), D = P.mainDepth, i = 0.36, sx = P.rearStepX + i, ry = D + P.rearStep - P.wallExt, yb = C.STAIR_TOP;
    return [[-W, i], [P.stairXS, i], [P.stairXS, P.stairYA], [P.stairXW, P.stairYA], [P.stairXW, yb], [P.stairXN, yb], [P.stairXN, i],
      [W, i], [W, D - i], [Wo - i, D - i], [Wo - i, ry], [sx, ry], [sx, D - i], [-W, D - i]];
  };
  C.STAIR_TOP = 2.6;                                         /* 二楼、阁楼楼板上楼梯口的后沿 Y */
  function merge() { var o = {}; for (var i = 0; i < arguments.length; i++) for (var k in arguments[i]) o[k] = arguments[i][k]; return o; }

  /* 洞口表（标高为绝对值） */
  C.openings = function () {
    var F1 = P.floor1Z, hw = P.bayHalfW, r = P.bayReturn, c = P.bayCant, zg = [0.55, 2.35], zf = [F1 + 0.6, P.eaveZ - 0.13];
    return {
      zg: zg, zf: zf,
      g: merge(C.bayOps('bayS', hw, r, c, zg[0], zg[1]), C.bayOps('bayN', hw, r, c, zg[0], zg[1]), {
        'front.c': [{ c: [0, 0], w: 1.0, z0: 0, z1: 2.12, kind: 'door', glazed: true },
          { c: [-0.73, 0], w: 0.3, z0: 0.85, z1: 2.12, lights: 1, transom: false }, { c: [0.73, 0], w: 0.3, z0: 0.85, z1: 2.12, lights: 1, transom: false }],
        'rear.n': [{ c: [4.0, 0], w: 1.3, z0: 0.6, z1: 2.4, lights: 2, surround: true }],
        'rear.s': [{ c: [0.3, 0], w: 0.7, z0: 0.9, z1: 2.3, lights: 1, surround: true }, { c: [-3.5, 0], w: 1.4, z0: 0, z1: 2.1, kind: 'open', frame: true }],
        'south': [{ c: [0, 5.45], w: 1.5, z0: 0.8, z1: 2.2, lights: 3, surround: true }],
        'north': [{ c: [0, 5.75], w: 0.85, z0: 0, z1: 2.05, kind: 'open', frame: true }]
      }),
      f: merge(C.bayOps('bayS', hw, r, c, zf[0], zf[1]), C.bayOps('bayN', hw, r, c, zf[0], zf[1]), {
        'front.c': [{ c: [P.dormX, 0], w: 1.45, z0: F1 + 0.1, z1: F1 + 1.6, lights: 3, surround: true }],
        'rear.n': [{ c: [3.95, 0], w: 1.0, z0: F1 + 0.9, z1: F1 + 2.0, lights: 2, surround: true }],
        'rear.s': [{ c: [0.75, 0], w: 0.7, z0: F1 + 1.0, z1: F1 + 2.0, lights: 1, surround: true }, { c: [-1.6, 0], w: 0.75, z0: F1 + 0.9, z1: F1 + 2.0, lights: 1, surround: true },
          { c: [-3.9, 0], w: 1.0, z0: F1 + 0.9, z1: F1 + 2.0, lights: 2, surround: true }]
      })
    };
  };

  C.buildShell = function (G) {
    var K = C.Kit, t = P.wallExt, out = C.mainOutline(), ops = C.openings(), W = P.mainHalfW, D = P.mainDepth;
    var pts2 = out.map(function (o) { return o.p; }), hw = P.bayHalfW, r = P.bayReturn, c = P.bayCant;
    function mat(n) { return n.indexOf('rear') === 0 ? 'wallRear' : 'wall'; }
    /* 一层：楼板（边缘即基座）+ 墙到二楼楼板底 */
    var b0 = new K.Batch(), hole = [[P.stairXW, 0.36], [P.stairXN, 0.36], [P.stairXN, C.STAIR_TOP], [P.stairXW, C.STAIR_TOP]];
    b0.prism('slab', pts2, P.groundZ, 0);
    b0.prism('floor', K.inset(pts2, t), 0, 0.02);
    b0.walls(mat, out, true, t, 0, P.floor1Z - P.slabT, ops.g, 'inner');
    /* 石勒脚：正面和南侧（背面是砖到地）。在门廊处断开。 */
    var zp = 0.44;
    b0.band('stone', [[-W, D], [-W, 0]].concat(C.bayLine(P.bayS, 0, hw, r, c), [[-P.porchHalfW, 0]]), false, 0.04, P.groundZ, zp);
    b0.band('stone', [[P.porchHalfW, 0]].concat(C.bayLine(P.bayN, 0, hw, r, c), [[W, 0], [W, P.kitY0]]), false, 0.04, P.groundZ, zp);
    [P.bayS, P.bayN].forEach(function (cx) { C.bayTrim(b0, cx, 0, hw, r, c, ops.zg[0], ops.zg[1], true); });
    /* 二层：二楼楼板（边缘即层间石带）+ 墙到檐口 */
    var b1 = new K.Batch();
    b1.prism('slab', pts2, P.floor1Z - P.slabT, P.floor1Z, [hole], 'ceil');
    b1.prism('floor', K.inset(pts2, t), P.floor1Z, P.floor1Z + 0.02, [hole]);
    b1.walls(mat, out, true, t, P.floor1Z, P.eaveZ, ops.f, 'inner');
    [P.bayS, P.bayN].forEach(function (cx) { C.bayTrim(b1, cx, 0, hw, r, c, ops.zf[0], ops.zf[1], false); });
    /* 墙角石：四个外角 + 后墙错位处，按层分开（剖切 / 关图层时跟着走） */
    [[-W, 0, 1, 1], [W, 0, -1, 1], [-W, D, 1, -1], [W, D + P.rearStep, -1, -1], [P.rearStepX, D + P.rearStep, 1, -1]].forEach(function (q) {
      C.quoins(b0, q[0], q[1], q[2], q[3], zp, P.floor1Z - P.slabT); C.quoins(b1, q[0], q[1], q[2], q[3], P.floor1Z, P.eaveZ - 0.1);
    });
    /* 阁楼层楼板（凸窗顶部由山墙底板盖住，见 roof.js） */
    var b2 = new K.Batch();
    b2.prism('slab', C.atticOutline(0.02), P.floor2Z - P.slabT, P.floor2Z, null, 'ceil');
    b2.prism('floor', C.atticOutline(t), P.floor2Z, P.floor2Z + 0.02);
    b0.build(G.ground, C.mats); b1.build(G.first, C.mats); b2.build(G.attic, C.mats);
  };
})();
