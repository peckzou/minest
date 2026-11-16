/* Clun · 材质与组装。C.build(mode) 返回一个 THREE.Group：内部是工程坐标（Z 向上），整体转成 three 的 Y 向上。
   分组（便于以后单独改屋顶、墙体、房间，也用于图层开关）：ground / first / attic / roof / chimneys / kitchen / sunroom / porch。 */
(function () {
  'use strict';
  var C = window.Clun = window.Clun || {};

  /* 材质名（几何体只认名字）：
     wall 正面/侧面砖墙 · wallRear 背面砖墙 · chimney 烟囱砖 · stone 石（勒脚、窗台、窗套、墙角石）· slab 楼板（边缘露在立面上就是层间饰带）
     inner 室内抹灰墙 · ceil 天花 / 檐下封板 · floor 木地板 · stair 楼梯木作 · rail 扶手和立柱
     tile 挂瓦 · roof 屋瓦 · ridge 脊瓦 · trim 白色木作 · door 门扇 · pot 烟囱陶罐 · iron 铸铁雨水管 · porchFloor 门廊地砖 · glass / glassRoof
     mode: 'white' 白模 / 'final' 外观。 */
  C.makeMats = function (mode) {
    var T = mode === 'final' ? (C.tex || (C.tex = C.makeTextures())) : {};
    function m(color, rough, extra) {
      var o = { color: new THREE.Color(color).convertSRGBToLinear(), roughness: rough == null ? 0.9 : rough, metalness: 0, side: THREE.DoubleSide };
      for (var k in (extra || {})) o[k] = extra[k];
      return new THREE.MeshStandardMaterial(o);
    }
    function t(map, rough) { return m(0xffffff, rough == null ? 0.92 : rough, { map: map }); }
    var fm = C.furnMats ? C.furnMats(m) : {};                                  /* 家具、软装（furnish.js）：白模里也保留本色，只有房子本身变白 */
    function withFurn(o) { for (var k in fm) o[k] = fm[k]; return o; }
    if (mode !== 'final') return withFurn({
      wall: m(0xefe8dc), wallRear: m(0xefe8dc), tile: m(0xdccdbb), slab: m(0xd6cdbf), stone: m(0xe6dfd2), trim: m(0xfaf7f0, 0.8),
      roof: m(0x9d958c, 0.95), ridge: m(0x8a8279, 0.95), chimney: m(0xe2d6c6), pot: m(0xcfae98, 0.8), iron: m(0xb9b4ac), porchFloor: m(0xd6cdbf),
      door: m(0x8fa3ad, 0.6), inner: m(0xf3efe7), ceil: m(0xf7f4ee), floor: m(0xddd5c7), stair: m(0xd3cabb), rail: m(0xbdb2a2),
      glass: m(0xa9cadb, 0.12, { transparent: true, opacity: 0.5, depthWrite: false }),
      glassRoof: m(0xc3dde8, 0.1, { transparent: true, opacity: 0.4, depthWrite: false })
    });
    var base = {
      wall: t(T.band), wallRear: t(T.rear), chimney: t(T.brick), tile: t(T.hung, 0.85), roof: t(T.roof, 0.95), porchFloor: t(T.floorTile, 0.8),
      stone: m(0xd6ae66, 0.9), slab: m(0xd3ab62, 0.9), trim: m(0xf5f0e3, 0.7), ridge: m(0x6b4439, 0.9), pot: m(0xc9663c, 0.75), iron: m(0x26272a, 0.5),
      door: m(0x244853, 0.45), inner: m(0xf0e2b6, 0.95), ceil: m(0xf8f3e7, 0.95),   /* 室内墙：手册照片里大厅、客厅、餐厅、卧室都是奶油黄 */ floor: t(T.boards, 0.75), stair: m(0x9a6a43, 0.7), rail: m(0x5b3a26, 0.6),
      glass: m(0x6f8f9f, 0.08, { transparent: true, opacity: 0.62, depthWrite: false, metalness: 0.25 }),
      glassRoof: m(0xbfd8e2, 0.08, { transparent: true, opacity: 0.38, depthWrite: false, metalness: 0.2 })
    };
    return withFurn(base);
  };

  C.LAYERS = [['roof', '屋顶'], ['chimneys', '烟囱'], ['attic', '阁楼层'], ['first', '二层'], ['ground', '一层'], ['kitchen', '厨房扩建'], ['sunroom', '阳光房'], ['porch', '门廊']];

  C.build = function (mode) {
    C.mode = mode || 'final'; C.mats = C.makeMats(C.mode);
    var root = new THREE.Group(); root.name = 'clun'; root.rotation.x = -Math.PI / 2;   /* 工程 (x,y,z) → three (x, z, −y) */
    var G = {};
    C.LAYERS.forEach(function (l) { var g = new THREE.Group(); g.name = l[0]; G[l[0]] = g; root.add(g); });
    C.buildShell(G); C.buildRoof(G); C.buildKitchen(G); C.buildSunRoom(G); C.buildPorch(G); C.buildInterior(G); if (C.buildFurnishings) C.buildFurnishings(G);
    root.userData.groups = G;
    return root;
  };
  /* 换材质（白模 ↔ 外观），几何不动 */
  C.setMode = function (root, mode) {
    C.mode = mode; C.mats = C.makeMats(mode);
    root.traverse(function (o) { if (o.isMesh && o.userData.mat) o.material = C.mats[o.userData.mat] || C.mats.wall; });
  };
  C.stats = function (root) {
    var tris = 0, meshes = 0;
    root.traverse(function (o) { if (o.isMesh) { meshes++; tris += o.geometry.attributes.position.count / 3; } });
    return { meshes: meshes, tris: tris };
  };
})();
