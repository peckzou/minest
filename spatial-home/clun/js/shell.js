/* Clun · 主体：外墙（按层）、楼板、正面两层凸窗。洞口位置来自平面图和照片，尺寸都是 ESTIMATED。 */
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
  /* 阁楼层楼板轮廓：不含凸窗；檐口一侧内收 i，让楼板角不顶穿屋面（屋面在外墙线上只有檐口标高） */
  C.atticOutline = function () {
    var W = P.mainHalfW, D = P.mainDepth, i = 0.36, sx = P.rearStepX + i, ry = D + P.rearStep - P.wallExt;
    return [[-W, i], [W, i], [W, D - i], [W - i, D - i], [W - i, ry], [sx, ry], [sx, D - i], [-W, D - i]];
  };
  function bayOps(name, zs, zh) {
    var o = {}, cl = P.bayCant * Math.SQRT2;
    o[name + '.f'] = [{ s: (P.bayHalfW - P.bayCant), w: 2 * (P.bayHalfW - P.bayCant) - 0.2, z0: zs, z1: zh }];
    o[name + '.c0'] = [{ s: cl / 2, w: cl - 0.3, z0: zs, z1: zh }];
    o[name + '.c1'] = [{ s: cl / 2, w: cl - 0.3, z0: zs, z1: zh }];
    o[name + '.r0'] = [{ s: P.bayReturn / 2 + 0.05, w: 0.45, z0: zs, z1: zh }];
    o[name + '.r1'] = [{ s: P.bayReturn / 2 - 0.05, w: 0.45, z0: zs, z1: zh }];
    return o;
  }
  function merge() { var o = {}; for (var i = 0; i < arguments.length; i++) for (var k in arguments[i]) o[k] = arguments[i][k]; return o; }

  /* 洞口表（标高为绝对值）。M2 会在这些洞口上加窗框、分格、石质窗套。 */
  C.openings = function () {
    var W = P.mainHalfW, D = P.mainDepth, F1 = P.floor1Z;
    return {
      g: merge(bayOps('bayS', 0.55, 2.35), bayOps('bayN', 0.55, 2.35), {
        'front.c': [{ c: [0, 0], w: 1.05, z0: 0, z1: 2.15, kind: 'door' }],
        'rear.n': [{ c: [4.0, 0], w: 1.3, z0: 0.6, z1: 2.4 }],
        'rear.s': [{ c: [0.3, 0], w: 0.7, z0: 0.9, z1: 2.3 }, { c: [-3.5, 0], w: 1.4, z0: 0, z1: 2.1, kind: 'open' }],
        'south': [{ c: [0, 5.45], w: 1.5, z0: 0.8, z1: 2.2 }],
        'north': [{ c: [0, 5.2], w: 0.9, z0: 0, z1: 2.05, kind: 'open' }]
      }),
      f: merge(bayOps('bayS', F1 + 0.6, P.eaveZ - 0.13), bayOps('bayN', F1 + 0.6, P.eaveZ - 0.13), {
        'front.c': [{ c: [0, 0], w: 1.4, z0: F1 + 0.1, z1: F1 + 1.55 }],
        'rear.n': [{ c: [3.95, 0], w: 1.0, z0: F1 + 0.9, z1: F1 + 2.15 }],
        'rear.s': [{ c: [0.75, 0], w: 0.7, z0: F1 + 1.0, z1: F1 + 2.15 }, { c: [-1.6, 0], w: 0.75, z0: F1 + 0.9, z1: F1 + 2.15 },
          { c: [-3.9, 0], w: 1.0, z0: F1 + 0.9, z1: F1 + 2.15 }]
      })
    };
  };

  C.buildShell = function (G) {
    var K = C.Kit, t = P.wallExt, out = C.mainOutline(), ops = C.openings();
    var pts2 = out.map(function (o) { return o.p; });
    /* 一层：地坪到二楼楼面 */
    var b0 = new K.Batch();
    b0.walls('wall', out, true, t, P.groundZ, P.floor1Z - P.slabT, ops.g);
    b0.prism('slab', pts2, P.groundZ, 0);
    /* 二层：二楼楼板 + 墙到檐口 */
    var b1 = new K.Batch();
    b1.prism('slab', pts2, P.floor1Z - P.slabT, P.floor1Z);
    b1.walls('wall', out, true, t, P.floor1Z, P.eaveZ, ops.f);
    /* 阁楼层楼板（凸窗顶部由山墙底板盖住，见 roof.js） */
    var b2 = new K.Batch();
    b2.prism('slab', C.atticOutline(), P.floor2Z - P.slabT, P.floor2Z);
    b0.build(G.ground, C.mats); b1.build(G.first, C.mats); b2.build(G.attic, C.mats);
  };
})();
