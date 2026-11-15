/* Clun · 外景：劳特布龙嫩山谷（用户照片做远景）+ 3D 花园。
   比例的办法：照片里木屋（约 12 m）和教堂塔（约 30 m）的像素高度与它们底边离地平线的距离之比，反推出拍摄机位离谷底约 18 m。
   3D 相机放在同样高度、同样视角（照片按水平 66° 视角贴在远处的平面上，地平线在照片中线），房子站在谷底草地上，
   这样它的底边落在照片里对应深度的地面上，大小和旁边的木屋是同一个量级。
   山谷坐标（Z 向上）：相机在 (0,0,18)，看向 +Y；Y 是离镜头的距离。外面整体转成 three 的 Y 向上。 */
(function () {
  'use strict';
  var C = window.Clun = window.Clun || {};
  var D2R = Math.PI / 180;
  var V = C.VALLEY = {
    img: 'art/lauterbrunnen-valley.jpg', IW: 1266, IH: 860, hfov: 66,       /* 照片：假定水平视角 66°（无法确定，影响的只是整体放大倍数） */
    camZ: 18,                                                              /* ESTIMATED：由照片里木屋和教堂的比例反推 */
    house: [-13, 65], houseRot: 30,                                        /* 房子位置（离镜头 65 m，偏左 11°）和朝向 */
    RB: 2500
  };

  function lin(hex) { return new THREE.Color(hex).convertSRGBToLinear(); }
  function mat(hex, rough, extra) { var o = { color: lin(hex), roughness: rough == null ? 0.9 : rough, metalness: 0 }; for (var k in extra || {}) o[k] = extra[k]; return new THREE.MeshStandardMaterial(o); }

  /* 地形高度：镜头脚下的坡（视线之下，基本看不见）落到谷底草地 */
  function terrainZ(x, y) {
    if (y < 5) return 15.6;
    var z = 15.6 - (y - 5) * 0.5;
    if (z > 0) return z;
    return 0.06 * Math.sin(x * 0.35) * Math.sin(y * 0.27);              /* 草地的细微起伏 */
  }
  function rightEdge(y) { return y < 36 ? 30 : 6 + 1.2 * Math.sin(y * 0.21); }

  /* 草坪：大块的明暗斑 + 割草的条纹 + 细草叶，平铺 16 m 一块 */
  function grassTex() {
    var N = 512, cv = document.createElement('canvas'); cv.width = cv.height = N; var g = cv.getContext('2d'), i, s = 3;
    function r() { s = (s * 16807) % 2147483647; return s / 2147483647; }
    g.fillStyle = '#4a8a26'; g.fillRect(0, 0, N, N);
    for (i = 0; i < 8; i++) { g.fillStyle = i % 2 ? 'rgba(70,130,36,0.35)' : 'rgba(52,104,26,0.3)'; g.fillRect(0, i * N / 8, N, N / 8); }
    for (i = 0; i < 70; i++) { var x = r() * N, y = r() * N, rr = 20 + r() * 70, gr = g.createRadialGradient(x, y, 0, x, y, rr), dk = r() < 0.5;
      gr.addColorStop(0, dk ? 'rgba(30,70,18,0.28)' : 'rgba(130,175,60,0.22)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - rr, y - rr, rr * 2, rr * 2); }
    for (i = 0; i < 14000; i++) { var k = r(); g.fillStyle = k < 0.45 ? 'rgba(34,84,20,0.5)' : k < 0.85 ? 'rgba(96,150,44,0.45)' : 'rgba(150,186,72,0.45)'; g.fillRect(r() * N, r() * N, 1, 2 + r() * 4); }
    var t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.encoding = THREE.sRGBEncoding; t.anisotropy = 8; return t;
  }
  /* 树叶：一块块叶团的笔触，给圆树冠加细节（几何体的贴图坐标单位是米，这张铺 1.6 m） */
  function leafTex() {
    var N = 256, cv = document.createElement('canvas'); cv.width = cv.height = N; var g = cv.getContext('2d'), i, s = 5;
    function r() { s = (s * 16807) % 2147483647; return s / 2147483647; }
    g.fillStyle = '#d4d4d4'; g.fillRect(0, 0, N, N);
    for (i = 0; i < 1400; i++) { var x = r() * N, y = r() * N, w = 3 + r() * 7, h = 2 + r() * 5, v = r();
      g.fillStyle = v < 0.4 ? 'rgba(90,90,90,0.5)' : v < 0.8 ? 'rgba(185,185,185,0.5)' : 'rgba(255,255,255,0.6)';
      g.beginPath(); g.ellipse(x, y, w, h, r() * 3.14, 0, 6.28); g.fill(); }
    var t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.encoding = THREE.sRGBEncoding; t.repeat.set(1 / 1.6, 1 / 1.6); t.anisotropy = 4; return t;
  }

  C.buildValley = function (scene, house) {
    var K = C.Kit, disp = [], P = V;
    var root = new THREE.Group(); root.name = 'valley'; scene.add(root);
    var site = new THREE.Group(); site.rotation.x = -Math.PI / 2; root.add(site);          /* 山谷坐标（Z 向上）→ three */
    var LT = leafTex(); disp.push(LT);
    function leaf(hex) { return mat(hex, 1, { map: LT }); }
    var M = {
      leaf1: leaf(0x5f9c35), leaf2: leaf(0x4a8a2e), leaf3: leaf(0x86b845), leafD: leaf(0x356a27), pine: leaf(0x34603a),
      trunk: mat(0x6b4a33), wood: mat(0xa8743f, 0.8), woodD: mat(0x7a5232, 0.8), shingle: mat(0x7d4b35, 0.9),
      white: mat(0xf4f1ea, 0.6), slate: mat(0x6f7378, 0.8), stone: mat(0xb5afa3, 0.95), stoneD: mat(0x8f897e, 0.95), rock: mat(0x9a958c, 0.95),
      water: mat(0x5aa2b0, 0.08, { metalness: 0.2 }), glassT: mat(0x8fb4c4, 0.1, { metalness: 0.2 }), swan: mat(0xfbfbf8, 0.6), beak: mat(0xe0802a, 0.5), black: mat(0x1d1d1d, 0.6),
      pink: mat(0xe86aa0, 0.7), rose: mat(0xd94a6a, 0.7), lilac: mat(0x9a78d0, 0.7), blue: mat(0x7d9be0, 0.7), cream: mat(0xf6f0dc, 0.7), yellow: mat(0xf2c94c, 0.7), soil: mat(0x5a4330)
    };
    for (var mk in M) disp.push(M[mk]);
    var b = new K.Batch();
    function sphere(m, x, y, z, rx, ry, rz, det) { var g = new THREE.IcosahedronGeometry(1, det == null ? 2 : det); var t = new THREE.Matrix4().makeScale(rx, ry, rz); t.setPosition(x, y, z); b.geom(m, g, t); }
    function cylinderAB(m, A, B, r0, r1, seg) {                                         /* 两点之间的圆柱（树枝、梯子） */
      var d = new THREE.Vector3(B[0] - A[0], B[1] - A[1], B[2] - A[2]), L = d.length(), g = new THREE.CylinderGeometry(r1, r0, L, seg || 8);
      var q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize()), t = new THREE.Matrix4().compose(new THREE.Vector3((A[0] + B[0]) / 2, (A[1] + B[1]) / 2, (A[2] + B[2]) / 2), q, new THREE.Vector3(1, 1, 1));
      b.geom(m, g, t);
    }
    var seed = 11; function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
    function canopy(x, y, z, r, n, m) {
      n = Math.round(n * 4.5);
      for (var i = 0; i < n; i++) {                                          /* 很多小叶团堆成一个外轮廓起伏的树冠 */
        var u = rnd() * 2 - 1, a = rnd() * 6.28, q = Math.sqrt(1 - u * u), rr = r * (0.55 + rnd() * 0.35), s = r * (0.2 + rnd() * 0.16);
        var dz = u * r * 0.75;
        sphere(m || (dz < -0.15 * r ? 'leafD' : dz > 0.3 * r ? 'leaf3' : (rnd() < 0.5 ? 'leaf1' : 'leaf2')), x + Math.cos(a) * rr * q, y + Math.sin(a) * rr * q, z + dz, s, s, s * 0.85, 1);
      }
    }
    function tree(x, y, h, r) { var z0 = terrainZ(x, y); cylinderAB('trunk', [x, y, z0 - 0.2], [x, y, z0 + h * 0.6], r * 0.12, r * 0.08, 7); canopy(x, y, z0 + h * 0.68, r, 6); }
    function pine(x, y, h) { var z0 = terrainZ(x, y); cylinderAB('trunk', [x, y, z0], [x, y, z0 + h * 0.3], 0.25, 0.2, 6); for (var i = 0; i < 4; i++) { var g = new THREE.ConeGeometry(h * (0.28 - i * 0.05), h * 0.35, 9), t = new THREE.Matrix4().makeRotationX(Math.PI / 2); t.setPosition(x, y, z0 + h * (0.35 + i * 0.17)); b.geom('pine', g, t); } }
    function hedge(pts, h, step) {
      for (var i = 0; i < pts.length - 1; i++) {
        var a = pts[i], c = pts[i + 1], L = Math.hypot(c[0] - a[0], c[1] - a[1]), n = Math.max(1, Math.round(L / (step || 1.3)));
        for (var k = 0; k <= n; k++) {
          var x = a[0] + (c[0] - a[0]) * k / n + (rnd() - 0.5) * 0.8, y = a[1] + (c[1] - a[1]) * k / n + (rnd() - 0.5) * 0.8, hh = h * (0.55 + rnd() * 0.9);
          if (rnd() < 0.18) { canopy(x, y, terrainZ(x, y) + hh * 1.4, hh * 0.9, 3); continue; }        /* 偶尔一棵高些的灌木 */
          canopy(x, y, terrainZ(x, y) + hh * 0.55, hh * 0.75, 2);
        }
      }
    }
    var FL = ['pink', 'rose', 'lilac', 'cream', 'yellow', 'blue'];
    function flowers(x, y, n, spread, palette, size) {                                     /* 一丛花：绿底 + 花头 */
      size = size || 1;
      for (var i = 0; i < n; i++) {
        var px = x + (rnd() - 0.5) * spread, py = y + (rnd() - 0.5) * spread, z = terrainZ(px, py);
        sphere(rnd() < 0.5 ? 'leaf1' : 'leaf2', px, py, z + 0.18 * size, 0.32 * size, 0.32 * size, 0.24 * size, 1);
        var pm = palette ? palette[i % palette.length] : FL[Math.floor(rnd() * FL.length)];
        for (var j = 0; j < 5; j++) sphere(pm, px + (rnd() - 0.5) * 0.45 * size, py + (rnd() - 0.5) * 0.45 * size, z + (0.32 + rnd() * 0.15) * size, 0.09 * size, 0.09 * size, 0.07 * size, 1);
      }
    }
    function hydrangea(x, y, n) { for (var i = 0; i < n; i++) { var px = x + (rnd() - 0.5) * 1.6, py = y + (rnd() - 0.5) * 0.8, z = terrainZ(px, py); sphere('leaf2', px, py, z + 0.3, 0.45, 0.45, 0.35, 1); sphere(['blue', 'lilac', 'cream'][i % 3], px + 0.05, py - 0.1, z + 0.6, 0.3, 0.3, 0.25, 1); } }

    /* —— 远景照片：一块远处的平面，跟着镜头平移（山是无穷远），所以只在照片范围内转动 —— */
    var tex = new THREE.TextureLoader().load(P.img); tex.encoding = THREE.sRGBEncoding; tex.anisotropy = 8; tex.minFilter = THREE.LinearFilter; tex.generateMipmaps = false; disp.push(tex);
    var BW = 2 * P.RB * Math.tan(P.hfov / 2 * D2R), BH = BW * P.IH / P.IW;
    var back = new THREE.Mesh(new THREE.PlaneGeometry(BW, BH), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false, depthWrite: false, fog: false }));
    back.renderOrder = -10; back.frustumCulled = false; root.add(back); disp.push(back.geometry, back.material);

    /* —— 地形：谷底草地（只铺左半边，右边留给照片里的河）+ 镜头下的坡 —— */
    (function () {
      var x0 = -75, x1 = 30, y0 = 2, y1 = 100, st = 1.5, nx = Math.round((x1 - x0) / st), ny = Math.round((y1 - y0) / st), pos = [], uv = [], idx = [], i, j, map = {};
      var col = [];
      for (j = 0; j <= ny; j++) for (i = 0; i <= nx; i++) { var x = x0 + i * st, y = y0 + j * st; map[j * (nx + 1) + i] = pos.length / 3; pos.push(x, y, terrainZ(x, y)); uv.push(x / 40, y / 40);
        var sh = 1 - 0.22 * Math.max(0, Math.min(1, (y - 82) / 14)) - 0.18 * Math.max(0, Math.min(1, (x - rightEdge(y) + 5) / 5)); col.push(sh, sh, sh); }
      for (j = 0; j < ny; j++) for (i = 0; i < nx; i++) {
        var cx = x0 + (i + 0.5) * st, cy = y0 + (j + 0.5) * st; if (cx > rightEdge(cy) || cy > 97) continue;
        var a = j * (nx + 1) + i; idx.push(a, a + 1, a + nx + 2, a, a + nx + 2, a + nx + 1);
      }
      var g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals();
      var gt = grassTex(); gt.repeat.set(40 / 16, 40 / 16); disp.push(gt, g);
      var gm = new THREE.MeshStandardMaterial({ map: gt, color: lin(0xd2dbc4), roughness: 1, vertexColors: true }); disp.push(gm);
      var m = new THREE.Mesh(g, gm); m.receiveShadow = true; site.add(m);
    })();

    /* —— 房子 —— */
    var H = P.house, th = P.houseRot * D2R, cs = Math.cos(th), sn = Math.sin(th);
    function hp(x, y) { return [H[0] + x * cs - y * sn, H[1] + x * sn + y * cs]; }      /* 房子工程坐标 → 山谷坐标 */
    var holder = new THREE.Group(); holder.position.set(H[0], 0.3, -H[1]); holder.rotation.y = th; root.add(holder);
    if (house.parent) house.parent.remove(house); holder.add(house);

    /* —— 石板路：前门 → 草地前沿；花境沿房前 —— */
    var path = [hp(0, -2.2), hp(0.2, -5), hp(1.5, -8.5), [-9.5, 52], [-8, 47.5], [-7.5, 43]];
    (function () {
      for (var i = 0; i < path.length - 1; i++) {
        var a = path[i], c = path[i + 1], L = Math.hypot(c[0] - a[0], c[1] - a[1]), n = Math.round(L / 0.85);
        for (var k = 0; k < n; k++) {
          var t = (k + 0.5) / n, x = a[0] + (c[0] - a[0]) * t + (rnd() - 0.5) * 0.25, y = a[1] + (c[1] - a[1]) * t + (rnd() - 0.5) * 0.25, r = 0.38 + rnd() * 0.16;
          var g = new THREE.CylinderGeometry(r, r * 1.05, 0.1, 9), m = new THREE.Matrix4().makeRotationX(Math.PI / 2); m.setPosition(x, y, terrainZ(x, y) + 0.04); b.geom(rnd() < 0.5 ? 'stone' : 'stoneD', g, m);
        }
      }
    })();
    [[-5.2, -3.3], [-3.0, -3.4], [-1.6, -3.0], [1.8, -3.0], [3.4, -3.4], [5.6, -3.3]].forEach(function (q, i) { var p = hp(q[0], q[1]); if (i % 2) hydrangea(p[0], p[1], 2); else flowers(p[0], p[1], 4, 1.4); });
    [hp(-6.5, 1.5), hp(6.8, 1.0)].forEach(function (p) { flowers(p[0], p[1], 3, 1.2); });
    [[-11, 50], [-6.5, 49], [-10.6, 46], [-5.6, 45.2]].forEach(function (p) { flowers(p[0], p[1], 3, 1.1); });

    /* —— 树屋：坡上的大树，木屋搭在树杈上，长梯子落到坡脚 —— */
    (function () {
      var x = -14.2, y = 34, z0 = terrainZ(x, y), zp = 10.6;
      cylinderAB('trunk', [x, y, z0 - 0.5], [x, y, zp + 4.5], 0.7, 0.42, 10);
      cylinderAB('trunk', [x, y, zp + 1.5], [x - 2.4, y + 1, zp + 4.8], 0.3, 0.16, 7); cylinderAB('trunk', [x, y, zp + 2], [x + 2.2, y + 0.6, zp + 5.2], 0.28, 0.15, 7);
      canopy(x - 0.6, y + 0.8, zp + 6, 3.8, 10); canopy(x - 2.8, y + 1.2, zp + 4.6, 2.3, 4); canopy(x + 1.6, y + 1.2, zp + 5.6, 2.2, 4);
      var hx = x + 0.6, hy = y - 0.6;
      [[hx - 1.8, hy - 1.6, zp - 0.15, hx + 1.8, hy + 1.6, zp]].forEach(function (q) { boxM('woodD', q); });
      boxM('wood', [hx - 1.15, hy - 1.0, zp, hx + 1.15, hy + 1.1, zp + 2.0]);
      [[-0.75, -0.15], [0.25, 0.85]].forEach(function (w) {
        boxM('white', [hx + w[0] - 0.06, hy - 1.05, zp + 0.84, hx + w[1] + 0.06, hy - 1.0, zp + 1.66]);
        boxM('glassT', [hx + w[0], hy - 1.07, zp + 0.9, hx + w[1], hy - 1.04, zp + 1.6]);
        boxM('white', [hx + (w[0] + w[1]) / 2 - 0.02, hy - 1.08, zp + 0.9, hx + (w[0] + w[1]) / 2 + 0.02, hy - 1.05, zp + 1.6]);
      });
      boxM('woodD', [hx - 1.2, hy - 1.05, zp, hx - 1.12, hy + 1.15, zp + 2.0]); boxM('woodD', [hx + 1.12, hy - 1.05, zp, hx + 1.2, hy + 1.15, zp + 2.0]);
      [-1, 1].forEach(function (s) { b.slab('shingle', [[hx - 1.45, hy, zp + 3.1], [hx + 1.45, hy, zp + 3.1], [hx + 1.45, hy + s * 1.45, zp + 1.85], [hx - 1.45, hy + s * 1.45, zp + 1.85]], 0.1); });
      b.extrude('wood', [[hx - 1.15, hy - 1.1, zp + 2.0], [hx - 1.15, hy + 1.1, zp + 2.0], [hx - 1.15, hy, zp + 3.0]], [2.3, 0, 0]);   /* 两头的山墙三角 */
      for (var i = -3; i <= 3; i++) { boxM('woodD', [hx + i * 0.55 - 0.04, hy - 1.6, zp, hx + i * 0.55 + 0.04, hy - 1.52, zp + 0.95]); }
      boxM('woodD', [hx - 1.8, hy - 1.62, zp + 0.9, hx + 1.8, hy - 1.5, zp + 1.0]); boxM('woodD', [hx - 1.8, hy - 1.62, zp + 0.45, hx + 1.8, hy - 1.52, zp + 0.52]);
      cylinderAB('woodD', [x, y, zp - 2.2], [hx - 1.6, hy - 1.4, zp - 0.1], 0.08, 0.08, 6); cylinderAB('woodD', [x, y, zp - 2.2], [hx + 1.6, hy - 1.4, zp - 0.1], 0.08, 0.08, 6);
      var lx = hx - 1.4, ly = hy - 1.7, gz = terrainZ(lx, ly - 2.4);                    /* 梯子 */
      [-0.25, 0.25].forEach(function (o) { cylinderAB('woodD', [lx + o, ly - 2.4, gz], [lx + o, ly, zp + 0.9], 0.045, 0.045, 6); });
      for (var k = 1; k < 26; k++) { var t = k / 26, ry = ly - 2.4 + 2.4 * t, rz = gz + (zp + 0.9 - gz) * t; cylinderAB('woodD', [lx - 0.25, ry, rz], [lx + 0.25, ry, rz], 0.03, 0.03, 5); }
    })();
    function boxM(m, q) { var g = new THREE.BoxGeometry(q[3] - q[0], q[4] - q[1], q[5] - q[2]), t = new THREE.Matrix4().makeTranslation((q[0] + q[3]) / 2, (q[1] + q[4]) / 2, (q[2] + q[5]) / 2); b.geom(m, g, t); }

    /* —— 凉亭：八角白色木亭，灰石板顶 —— */
    (function () {
      var x = -1.2, y = 55.5, z0 = terrainZ(x, y), R = 1.9, i;
      var fg = new THREE.CylinderGeometry(R + 0.25, R + 0.35, 0.3, 8), fm = new THREE.Matrix4().makeRotationX(Math.PI / 2); fm.setPosition(x, y, z0 + 0.15); b.geom('stone', fg, fm);
      for (i = 0; i < 8; i++) {
        var a = (i + 0.5) * Math.PI / 4, px = x + Math.cos(a) * R, py = y + Math.sin(a) * R, a2 = (i + 1.5) * Math.PI / 4, qx = x + Math.cos(a2) * R, qy = y + Math.sin(a2) * R;
        cylinderAB('white', [px, py, z0 + 0.3], [px, py, z0 + 2.7], 0.07, 0.07, 8);
        cylinderAB('white', [px, py, z0 + 2.65], [qx, qy, z0 + 2.65], 0.08, 0.08, 6);
        if (i !== 6) { cylinderAB('white', [px, py, z0 + 1.15], [qx, qy, z0 + 1.15], 0.05, 0.05, 6); cylinderAB('white', [px, py, z0 + 0.5], [qx, qy, z0 + 0.5], 0.04, 0.04, 6);
          for (var k = 1; k < 5; k++) { var t = k / 5; cylinderAB('white', [px + (qx - px) * t, py + (qy - py) * t, z0 + 0.5], [px + (qx - px) * t, py + (qy - py) * t, z0 + 1.15], 0.022, 0.022, 5); } }
      }
      var rg = new THREE.ConeGeometry(R + 0.55, 1.5, 8), rm = new THREE.Matrix4().makeRotationX(Math.PI / 2); rm.multiply(new THREE.Matrix4().makeRotationY(Math.PI / 8)); rm.setPosition(x, y, z0 + 3.5); b.geom('slate', rg, rm);
      var eg = new THREE.CylinderGeometry(R + 0.5, R + 0.5, 0.14, 8), em = new THREE.Matrix4().makeRotationX(Math.PI / 2); em.multiply(new THREE.Matrix4().makeRotationY(Math.PI / 8)); em.setPosition(x, y, z0 + 2.78); b.geom('white', eg, em);
      cylinderAB('white', [x, y, z0 + 4.2], [x, y, z0 + 4.7], 0.05, 0.02, 6); sphere('white', x, y, z0 + 4.25, 0.1, 0.1, 0.1, 1);
      flowers(x + 2.6, y - 1.0, 3, 1.0); flowers(x - 2.5, y - 1.2, 3, 1.0);
    })();

    /* —— 石桌和四个石凳 —— */
    (function () {
      var x = 2.8, y = 47.5, z0 = terrainZ(x, y);
      var g1 = new THREE.CylinderGeometry(0.35, 0.45, 0.7, 10), m1 = new THREE.Matrix4().makeRotationX(Math.PI / 2); m1.setPosition(x, y, z0 + 0.35); b.geom('stoneD', g1, m1);
      var g2 = new THREE.CylinderGeometry(1.0, 0.95, 0.14, 14), m2 = new THREE.Matrix4().makeRotationX(Math.PI / 2); m2.setPosition(x, y, z0 + 0.76); b.geom('stone', g2, m2);
      for (var i = 0; i < 4; i++) { var a = i * Math.PI / 2 + 0.4, g = new THREE.CylinderGeometry(0.28, 0.3, 0.45, 9), m = new THREE.Matrix4().makeRotationX(Math.PI / 2); m.setPosition(x + Math.cos(a) * 1.45, y + Math.sin(a) * 1.45, z0 + 0.225); b.geom('stone', g, m); }
    })();

    /* —— 小池塘和天鹅 —— */
    (function () {
      var x = -22, y = 50.5, z0 = 0.02, i;
      var wg = new THREE.CircleGeometry(1, 32), wm = new THREE.Matrix4().makeScale(3.4, 2.3, 1); wm.setPosition(x, y, z0 + 0.06); b.geom('water', wg, wm);
      for (i = 0; i < 16; i++) { var a = i / 16 * 6.28, r = 1.05 + rnd() * 0.1; sphere(rnd() < 0.5 ? 'rock' : 'stoneD', x + Math.cos(a) * 3.4 * r, y + Math.sin(a) * 2.3 * r, 0.12, 0.45 + rnd() * 0.3, 0.4 + rnd() * 0.25, 0.25 + rnd() * 0.15, 1); }
      var sx = x + 0.6, sy = y - 0.3;
      sphere('swan', sx, sy, 0.22, 0.45, 0.24, 0.2); sphere('swan', sx + 0.3, sy, 0.3, 0.2, 0.17, 0.14);
      var neck = [[0.42, 0, 0.32], [0.52, 0, 0.45], [0.55, 0, 0.6], [0.52, 0, 0.72], [0.5, 0, 0.8]];
      neck.forEach(function (q) { sphere('swan', sx + q[0], sy + q[1], q[2], 0.055, 0.055, 0.06, 1); });
      sphere('swan', sx + 0.55, sy, 0.84, 0.08, 0.07, 0.065, 1);
      var bg = new THREE.ConeGeometry(0.03, 0.12, 6), bm = new THREE.Matrix4().makeRotationZ(-Math.PI / 2); bm.setPosition(sx + 0.66, sy, 0.83); b.geom('beak', bg, bm);
      flowers(x - 3.6, y + 1.6, 3, 1.2); flowers(x + 2.5, y + 2.6, 2, 1.0);
    })();

    /* —— 木栅栏（右边沿河）、绿篱和树（把草地边缘和照片接上）—— */
    (function () {
      var ys = [], y;
      for (y = 42; y <= 92; y += 2.2) ys.push(y);
      ys.forEach(function (yy, i) { var x = rightEdge(yy) - 0.6, z = terrainZ(x, yy); boxM('woodD', [x - 0.06, yy - 0.06, z, x + 0.06, yy + 0.06, z + 1.05]);
        if (i) { var yp = ys[i - 1], xp = rightEdge(yp) - 0.6; cylinderAB('woodD', [xp, yp, z + 0.9], [x, yy, z + 0.9], 0.04, 0.04, 5); cylinderAB('woodD', [xp, yp, z + 0.45], [x, yy, z + 0.45], 0.035, 0.035, 5); } });
    })();
    hedge([[-70, 95.5], [-30, 96], [-10, 95], [5, 94]], 2.6);
    hedge([[rightEdge(68) - 1.6, 68], [rightEdge(82) - 1.6, 82], [rightEdge(93) - 1.6, 93]], 1.8);
    /* 右边沿河：坡岸上的灌木和小树，接上照片里河岸的树 */
    [[52, 5.5, 2.2], [63, 6.5, 2.4], [77, 6, 2.2]].forEach(function (t) { tree(rightEdge(t[0]) - 2.2, t[0], t[1], t[2]); });
    hedge([[-70, 40], [-45, 41], [-32, 39]], 2.4);
    tree(-34, 70, 11, 4.2); tree(-27, 88, 12, 4.5); tree(-46, 58, 10, 4); tree(-21, 92, 9, 3.6);
    pine(-40, 86, 14); pine(-52, 76, 13);
    tree(-30, 44, 9, 4.2); tree(-38, 50, 13, 5.2); tree(-33, 60, 12, 4.6);                      /* 左边缘：挡住照片里只剩半截的木屋 */
    /* 房子两侧和后面的灌木 */
    [hp(-8.2, 0.5), hp(-8.4, 3.5), hp(9.6, 2.0), hp(10.4, 5.0), hp(-4, 8.5), hp(3, 9)].forEach(function (p) { canopy(p[0], p[1], 0.9, 1.3, 3); });
    /* 画面下沿的花境（粉、白、紫）和一段木栅栏，像效果图前景 */
    for (var fx = -24; fx <= -2; fx += 1.5) flowers(fx, 47.0 + Math.sin(fx) * 0.5, 2, 1.0, null, 1.15);
    (function () { var xs = [], x; for (x = -26; x <= -12; x += 2) xs.push(x);
      xs.forEach(function (x, i) { var y = 46.0, z = terrainZ(x, y); boxM('woodD', [x - 0.07, y - 0.07, z, x + 0.07, y + 0.07, z + 1.0]);
        if (i) { cylinderAB('woodD', [xs[i - 1], y, z + 0.85], [x, y, z + 0.85], 0.045, 0.045, 5); cylinderAB('woodD', [xs[i - 1], y, z + 0.42], [x, y, z + 0.42], 0.04, 0.04, 5); } }); })();
    for (var k2 = 0; k2 < 26; k2++) { var px = -40 + rnd() * 44, py = 46 + rnd() * 40; if (Math.hypot(px - H[0], py - H[1]) < 11 || Math.hypot(px + 1.2, py - 55.5) < 3.5 || px > rightEdge(py) - 2) continue; flowers(px, py, 1, 0.5, null, 0.8); }

    b.build(site, M);
    site.traverse(function (o) { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });

    /* —— 光：和照片一样的晴天，太阳在镜头右后方高处 —— */
    var hemi = new THREE.HemisphereLight(0xd6e6ff, 0x4a6332, 0.55); root.add(hemi);
    var sun = new THREE.DirectionalLight(0xfff0d6, 1.55), tgt = new THREE.Vector3(H[0] + 2, 3, -(H[1] - 10));
    sun.position.set(tgt.x + 55, 95, tgt.z + 70); sun.target.position.copy(tgt); root.add(sun, sun.target);
    sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -0.0003; sun.shadow.normalBias = 0.05;
    var sc = sun.shadow.camera; sc.left = -45; sc.right = 45; sc.top = 45; sc.bottom = -45; sc.near = 10; sc.far = 260;

    /* —— 镜头：固定在照片的拍摄位置附近，只能在照片范围内小幅转动（绕房子）和推近 —— */
    var pivot = new THREE.Vector3(H[0], 4, -H[1]), C0 = new THREE.Vector3(0, P.camZ, 0), photoV = Math.atan(Math.tan(P.hfov / 2 * D2R) * P.IH / P.IW);
    function frame(a, zoom) {
      var hh = Math.min(30 * D2R * zoom, 32 * D2R), vh = Math.atan(Math.tan(hh) / a);
      if (vh > photoV - 4 * D2R) { vh = photoV - 4 * D2R; hh = Math.atan(Math.tan(vh) * a); }
      var yaw0 = a < 1 ? Math.min(0.2, P.hfov / 2 * D2R - hh) : 0, azMax = Math.max(0, P.hfov / 2 * D2R - hh - Math.abs(yaw0) - 0.004);
      return { vfov: vh * 2 / D2R, yaw0: yaw0, azMax: azMax, pMax: Math.max(0, photoV - vh - 0.004), pitch0: -3 * D2R };
    }
    var api = {
      root: root, holder: holder,
      limits: function (a, zoom) { return frame(a, zoom); },
      place: function (camera, O) {
        var f = frame(camera.aspect, O.zoom || 1); O.az = Math.max(-f.azMax, Math.min(f.azMax, O.az)); O.el = Math.max(-f.pMax - 0.08, Math.min(f.pMax, O.el));
        if (Math.abs(camera.fov - f.vfov) > 0.01) { camera.fov = f.vfov; camera.updateProjectionMatrix(); }
        var v = C0.clone().sub(pivot).applyAxisAngle(new THREE.Vector3(0, 1, 0), O.az); camera.position.copy(pivot).add(v);
        camera.rotation.order = 'YXZ'; camera.rotation.set(Math.max(-f.pMax - 0.08, Math.min(f.pMax, f.pitch0 + O.el)), f.yaw0 + O.az, 0);
        back.position.set(camera.position.x, P.camZ, camera.position.z - P.RB);
      },
      dispose: function () { scene.remove(root); disp.forEach(function (d) { try { d.dispose(); } catch (e) {} }); }
    };
    return api;
  };
})();
