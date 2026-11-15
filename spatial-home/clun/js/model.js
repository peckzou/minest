/* Clun · 材质与组装。C.build(mode) 返回一个 THREE.Group：内部是工程坐标（Z 向上），整体转成 three 的 Y 向上。
   分组（便于以后单独改屋顶、墙体、房间，也用于图层开关）：ground / first / attic / roof / chimneys / kitchen / sunroom / porch。 */
(function () {
  'use strict';
  var C = window.Clun = window.Clun || {};

  /* mode: 'white' = 白模（M1）。M2 在这里加 'final'（红砖、屋瓦、石饰带）。 */
  C.makeMats = function (mode) {
    function m(color, rough, extra) {
      var o = { color: new THREE.Color(color).convertSRGBToLinear(), roughness: rough == null ? 0.9 : rough, metalness: 0, side: THREE.DoubleSide };
      for (var k in (extra || {})) o[k] = extra[k];
      return new THREE.MeshStandardMaterial(o);
    }
    return {
      wall: m(0xefe8dc), tile: m(0xdccdbb), slab: m(0xd6cdbf), trim: m(0xfaf7f0, 0.8),
      roof: m(0x9d958c, 0.95), ridge: m(0x8a8279, 0.95), chimney: m(0xe2d6c6), pot: m(0xcfae98, 0.8),
      door: m(0x8fa3ad, 0.6),
      glass: m(0xa9cadb, 0.12, { transparent: true, opacity: 0.5, depthWrite: false }),
      glassRoof: m(0xc3dde8, 0.1, { transparent: true, opacity: 0.4, depthWrite: false })
    };
  };

  C.LAYERS = [['roof', '屋顶'], ['chimneys', '烟囱'], ['attic', '阁楼层'], ['first', '二层'], ['ground', '一层'], ['kitchen', '厨房扩建'], ['sunroom', '阳光房'], ['porch', '门廊']];

  C.build = function (mode) {
    C.mats = C.makeMats(mode || 'white');
    var root = new THREE.Group(); root.name = 'clun'; root.rotation.x = -Math.PI / 2;   /* 工程 (x,y,z) → three (x, z, −y) */
    var G = {};
    C.LAYERS.forEach(function (l) { var g = new THREE.Group(); g.name = l[0]; G[l[0]] = g; root.add(g); });
    C.buildShell(G); C.buildRoof(G); C.buildKitchen(G); C.buildSunRoom(G); C.buildPorch(G);
    root.userData.groups = G;
    return root;
  };
  C.stats = function (root) {
    var tris = 0, meshes = 0;
    root.traverse(function (o) { if (o.isMesh) { meshes++; tris += o.geometry.attributes.position.count / 3; } });
    return { meshes: meshes, tris: tris };
  };
})();
