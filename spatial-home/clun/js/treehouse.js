/* 树屋里面：一间可以走进去的小木屋（探索空间）。
   本地坐标：地板 y = 0，+X 是阳台一侧，−Z 是朝山谷的大窗。plate.js 负责把它摆到树上、接上走动和按钮。
   里面有：望远镜、地图桌和墙上的地图、百宝箱、提灯、地铺、小凳、书架；外面一圈是树冠、树干、林子和草地（只在进树屋时显示）。 */
(function () {
  var C = window.Clun = window.Clun || {};
  var D2R = Math.PI / 180;
  C.Treehouse = { build: function (opt) {
    opt = opt || {};
    var HX = 1.7, HZ = 1.5, WH = 2.05, RH = 3.0, T = 0.08, drop = opt.drop || 5;      /* 半宽、半深、墙高、屋脊高、墙厚；地板离草地多高 */
    var group = new THREE.Group(); group.name = 'treehouse';
    var solids = [], all = [], items = [], seats = [], mats = {};
    function col(hex) { return new THREE.Color(hex).convertSRGBToLinear(); }
    function mat(hex, o) { var k = hex + JSON.stringify(o || ''); if (!mats[k]) { var p = { color: col(hex), roughness: 1 }; for (var q in o || {}) p[q] = o[q]; mats[k] = new THREE.MeshStandardMaterial(p); } return mats[k]; }
    function canvas(w, h, draw) { var cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h); var t = new THREE.CanvasTexture(cv); t.encoding = THREE.sRGBEncoding; t.anisotropy = 4; return t; }
    var sd = 11; function rnd() { sd = (sd * 16807) % 2147483647; return sd / 2147483647; }

    /* 木板：1 m 见方的贴图里 4 块横板，深浅略有不同；贴图坐标按实际尺寸算，各块墙板的缝对得上 */
    var plankT = canvas(256, 256, function (g, w, h) {
      ['#c99a62', '#bd8d56', '#d0a26b', '#c29259'].forEach(function (c, i) { g.fillStyle = c; g.fillRect(0, i * h / 4, w, h / 4); });
      g.strokeStyle = 'rgba(80,48,20,.55)'; g.lineWidth = 3; for (var i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(0, i * h / 4); g.lineTo(w, i * h / 4); g.stroke(); }
      g.strokeStyle = 'rgba(90,56,26,.22)'; g.lineWidth = 1.5; for (var k = 0; k < 26; k++) { var y = rnd() * h, x = rnd() * w; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 30 + rnd() * 60, y + (rnd() - 0.5) * 3); g.stroke(); }
    }); plankT.wrapS = plankT.wrapT = THREE.RepeatWrapping;
    var plankM = new THREE.MeshStandardMaterial({ map: plankT, roughness: 1 }), floorM = new THREE.MeshStandardMaterial({ map: plankT, color: col(0xcdb898), roughness: 1 });
    function box(w, h, d, m, x, y, z, parent) { var o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); (parent || group).add(o); return o; }
    function plank(w, h, d, x, y, z, m, turn) {                                  /* 木板墙 / 地板的一块：贴图按米铺；turn = 板缝转 90°（地板） */
      var o = box(w, h, d, m || plankM, x, y, z), uv = o.geometry.attributes.uv, dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
      for (var f = 0; f < 6; f++) for (var k = 0; k < 4; k++) { var i = f * 4 + k, u = uv.getX(i) * dims[f][0], v = uv.getY(i) * dims[f][1] + (f === 2 || f === 3 ? 0 : y - h / 2); if (turn) uv.setXY(i, v, u); else uv.setXY(i, u, v); }
      uv.needsUpdate = true; all.push(o); solids.push(o); return o;
    }
    function hide(w, h, d, x, y, z) { var o = box(w, h, d, new THREE.MeshBasicMaterial(), x, y, z); o.visible = false; solids.push(o); return o; }   /* 看不见的挡块：家具不让穿过去 */
    function cyl(r0, r1, h, m, x, y, z, parent, seg) { var o = new THREE.Mesh(new THREE.CylinderGeometry(r0, r1, h, seg || 10), m); o.position.set(x, y, z); (parent || group).add(o); return o; }
    function rod(a, b, r, m, parent) {                                           /* 两点之间的一根圆杆 */
      var d = b.clone().sub(a), o = cyl(r, r, d.length(), m, 0, 0, 0, parent, 7); o.position.copy(a).addScaledVector(d, 0.5);
      o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); return o;
    }
    var V = function (x, y, z) { return new THREE.Vector3(x, y, z); };

    /* —— 地板、阳台 —— */
    plank(2 * HX + 0.16, 0.12, 2 * HZ + 0.16, 0, -0.06, 0, floorM, true);
    plank(1.4, 0.12, 2 * HZ + 0.2, HX + 0.78, -0.06, 0, floorM, true);
    /* —— 四面墙：朝山谷的大窗、阳台门、两扇小窗 —— */
    plank(2 * HX, 0.9, T, 0, 0.45, -HZ); plank(2 * HX, 0.3, T, 0, 1.9, -HZ); plank(0.8, 0.85, T, -1.3, 1.325, -HZ); plank(0.8, 0.85, T, 1.3, 1.325, -HZ);
    plank(1.9, WH, T, -0.75, WH / 2, HZ); plank(0.7, WH, T, 1.35, WH / 2, HZ); plank(0.8, 1.0, T, 0.6, 0.5, HZ); plank(0.8, 0.45, T, 0.6, 1.825, HZ);
    plank(T, WH, 1.2, -HX, WH / 2, -0.9); plank(T, WH, 1.2, -HX, WH / 2, 0.9); plank(T, 1.15, 0.6, -HX, 0.575, 0); plank(T, 0.4, 0.6, -HX, 1.85, 0);
    plank(T, WH, 1.08, HX, WH / 2, -0.96); plank(T, WH, 1.08, HX, WH / 2, 0.96); plank(T, 0.25, 0.84, HX, 1.925, 0);
    var trimM = mat(0x7a5632), darkM = mat(0x5a3f26);
    box(2.0, 0.05, 0.22, trimM, 0, 0.9, -HZ); box(0.92, 0.05, 0.16, trimM, 0.6, 1.0, HZ); box(0.16, 0.05, 0.7, trimM, -HX, 1.15, 0);       /* 窗台 */
    [[-0.93, 1.325], [0.93, 1.325]].forEach(function (q) { box(0.06, 0.85, T + 0.03, trimM, q[0], q[1], -HZ); });
    [-0.45, 0.45].forEach(function (z) { box(T + 0.03, 1.8, 0.06, trimM, HX, 0.9, z); });
    /* 山墙（三角）和屋顶：屋脊顺着 X，两坡落向前后 */
    [-HX, HX].forEach(function (x) {
      var g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([x, WH, -HZ, x, WH, HZ, x, RH, 0], 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute([-HZ, WH, HZ, WH, 0, RH], 2)); g.computeVertexNormals();
      var m = plankM.clone(); m.side = THREE.DoubleSide; var o = new THREE.Mesh(g, m); group.add(o); all.push(o);
    });
    var EV = 0.38, rise = RH - (WH - 0.14), run = HZ + EV, slope = Math.atan2(rise, run), SL = Math.hypot(rise, run), roofM = mat(0x6b5a48), roofTop = mat(0x55473a);
    [-1, 1].forEach(function (s) {
      var o = box(2 * HX + 0.7, 0.07, SL, roofM, 0, RH - rise / 2 + 0.035, s * run / 2); o.rotation.x = s * slope; all.push(o);
      for (var k = 0; k < 4; k++) { var x = -HX + 0.2 + k * (2 * HX - 0.4) / 3, r = box(0.07, 0.09, SL - 0.1, darkM, x, RH - rise / 2 - 0.03, s * run / 2); r.rotation.x = s * slope; }   /* 椽子 */
      var cap = box(2 * HX + 0.74, 0.03, SL + 0.04, roofTop, 0, RH - rise / 2 + 0.09, s * run / 2); cap.rotation.x = s * slope;
    });
    box(2 * HX + 0.5, 0.11, 0.11, darkM, 0, RH - 0.1, 0);                                                                              /* 脊檩 */
    /* 屋脊下挂一串小彩旗 */
    ['#e05a4a', '#f2c14e', '#4e9bd8', '#6cc070', '#e05a4a', '#f2c14e', '#4e9bd8', '#6cc070', '#e05a4a'].forEach(function (c, i) {
      var x = -1.4 + i * 0.35, g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([x - 0.11, 2.78, 0.07, x + 0.11, 2.78, 0.07, x, 2.56, 0.07], 3)); g.computeVertexNormals();
      group.add(new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: col(c), side: THREE.DoubleSide })));
    });

    /* —— 阳台栏杆（前沿右端留一个口子：绳梯从那里上来） —— */
    var BX0 = HX + 0.1, BX1 = HX + 1.44, BZ = HZ + 0.06, railM = mat(0xb48a58);
    [[BX0, -BZ], [BX1, -BZ], [BX1, 0], [BX1, BZ], [BX0, BZ], [BX0 + 0.55, BZ], [BX0 + 0.7, -BZ]].forEach(function (q) { box(0.08, 0.95, 0.08, railM, q[0], 0.475, q[1]); });
    box(BX1 - BX0, 0.07, 0.09, railM, (BX0 + BX1) / 2, 0.92, -BZ); box(0.09, 0.07, 2 * BZ, railM, BX1, 0.92, 0); box(0.55, 0.07, 0.09, railM, BX0 + 0.275, 0.92, BZ);
    for (var bi = 0; bi < 9; bi++) box(0.04, 0.82, 0.04, railM, BX1, 0.45, -BZ + 0.3 + bi * (2 * BZ - 0.6) / 8);
    for (bi = 0; bi < 4; bi++) box(0.04, 0.82, 0.04, railM, BX0 + 0.25 + bi * 0.3, 0.45, -BZ);

    /* —— 圆地毯（不挡路） —— */
    var rug = cyl(0.85, 0.85, 0.012, new THREE.MeshStandardMaterial({ roughness: 1, map: canvas(256, 256, function (g, w) {
      [['#b5483a', 128], ['#f0dcae', 104], ['#3f6f8f', 92], ['#f0dcae', 62], ['#b5483a', 52], ['#f2c14e', 18]].forEach(function (q) { g.fillStyle = q[0]; g.beginPath(); g.arc(w / 2, w / 2, q[1], 0, 6.3); g.fill(); });
    }) }), 0.1, 0.008, -0.1, group, 28); rug.name = 'rug';

    /* —— 望远镜：三脚架架在朝山谷的大窗前，黄铜镜筒伸向窗外 —— */
    var brass = mat(0xc79a3a), brassD = mat(0x8a6a24), scope = new THREE.Group(); scope.position.set(0.35, 0, -1.0); group.add(scope);
    var hub = V(0, 1.02, 0); [[0.3, 0.26], [-0.3, 0.26], [0, -0.34]].forEach(function (q) { rod(V(q[0], 0, q[1]), hub, 0.022, darkM, scope); });
    cyl(0.05, 0.05, 0.1, brassD, 0, 1.06, 0, scope);
    var tube = new THREE.Group(); tube.position.set(0, 1.17, 0); tube.rotation.x = 0.1; scope.add(tube);                                   /* 镜筒顺着 −Z，略微上扬 */
    [[0.075, 0.07, 0.55, -0.42, brass], [0.058, 0.058, 0.4, 0.02, brassD], [0.045, 0.045, 0.22, 0.3, brass], [0.082, 0.082, 0.04, -0.7, brassD], [0.032, 0.04, 0.07, 0.44, darkM]].forEach(function (q) {
      var o = cyl(q[0], q[1], q[2], q[4], 0, 0, q[3], tube, 14); o.rotation.x = Math.PI / 2;
    });
    var lens = cyl(0.066, 0.066, 0.01, new THREE.MeshBasicMaterial({ color: col(0xbfe4ff) }), 0, 0, -0.722, tube, 14); lens.rotation.x = Math.PI / 2;
    hide(0.6, 1.4, 0.55, 0.35, 0.7, -1.05);
    items.push({ id: 'scope', label: '🔭 看望远镜', at: V(0.35, 0, -0.55), obj: scope, reach: 1.15 });

    /* —— 地图桌：靠着后墙，桌上摊着地图、指南针和蜡烛；墙上钉着一大张山谷地图 —— */
    var mapT = canvas(512, 340, function (g, w, h) {
      g.fillStyle = '#ecd9a8'; g.fillRect(0, 0, w, h);
      var gr = g.createRadialGradient(w / 2, h / 2, 60, w / 2, h / 2, 330); gr.addColorStop(0, 'rgba(255,246,214,.7)'); gr.addColorStop(1, 'rgba(150,104,48,.45)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      g.strokeStyle = '#6b4a22'; g.lineWidth = 3; g.lineJoin = 'round';
      g.beginPath(); [[20, 150], [70, 70], [110, 120], [150, 40], [200, 115], [250, 60], [300, 130], [350, 50], [400, 110], [450, 30], [495, 120]].forEach(function (q, i) { if (i) g.lineTo(q[0], q[1]); else g.moveTo(q[0], q[1]); }); g.stroke();   /* 群山 */
      g.strokeStyle = '#3f7fa8'; g.lineWidth = 7; g.beginPath(); g.moveTo(420, 120); g.bezierCurveTo(380, 180, 330, 200, 300, 250); g.bezierCurveTo(280, 290, 230, 300, 200, 338); g.stroke();   /* 小溪 */
      g.strokeStyle = '#8a5a2a'; g.lineWidth = 3; g.setLineDash([9, 8]); g.beginPath(); g.moveTo(70, 235); g.bezierCurveTo(130, 250, 170, 215, 215, 245); g.bezierCurveTo(250, 265, 320, 230, 400, 262); g.stroke(); g.setLineDash([]);   /* 小路 */
      g.fillStyle = '#5a8a3a'; [[60, 215], [45, 235], [85, 208]].forEach(function (q) { g.beginPath(); g.arc(q[0], q[1], 13, 0, 6.3); g.fill(); });                                           /* 大树 */
      g.fillStyle = '#b5483a'; g.fillRect(205, 205, 30, 22); g.beginPath(); g.moveTo(200, 207); g.lineTo(220, 188); g.lineTo(240, 207); g.fill();                                                 /* 家 */
      g.strokeStyle = '#b5483a'; g.lineWidth = 4; g.beginPath(); g.moveTo(392, 250); g.lineTo(412, 272); g.moveTo(412, 250); g.lineTo(392, 272); g.stroke();                                     /* ✕ 石桌 */
      g.strokeStyle = '#6b4a22'; g.lineWidth = 2; g.beginPath(); g.arc(455, 290, 26, 0, 6.3); g.moveTo(455, 258); g.lineTo(455, 322); g.moveTo(423, 290); g.lineTo(487, 290); g.stroke();
      g.fillStyle = '#6b4a22'; g.beginPath(); g.moveTo(455, 256); g.lineTo(448, 276); g.lineTo(462, 276); g.fill();
      g.strokeStyle = 'rgba(107,74,34,.7)'; g.lineWidth = 5; g.strokeRect(6, 6, w - 12, h - 12);
    });
    var paperM = new THREE.MeshBasicMaterial({ map: mapT }), desk = new THREE.Group(); desk.position.set(-0.85, 0, 1.12); group.add(desk);
    box(1.3, 0.05, 0.62, trimM, 0, 0.64, 0, desk); [[-0.58, -0.25], [0.58, -0.25], [-0.58, 0.25], [0.58, 0.25]].forEach(function (q) { box(0.06, 0.62, 0.06, darkM, q[0], 0.31, q[1], desk); });
    var sheet = new THREE.Mesh(new THREE.PlaneGeometry(0.74, 0.48), paperM); sheet.rotation.x = -Math.PI / 2; sheet.rotation.z = 0.12; sheet.position.set(-0.1, 0.668, -0.02); desk.add(sheet);
    cyl(0.06, 0.06, 0.03, brass, 0.42, 0.68, -0.16, desk, 16); cyl(0.045, 0.045, 0.006, new THREE.MeshBasicMaterial({ color: col(0xf6efd8) }), 0.42, 0.697, -0.16, desk, 16);   /* 指南针 */
    cyl(0.025, 0.025, 0.12, mat(0xf4ecd6), 0.5, 0.725, 0.14, desk); cyl(0.04, 0.05, 0.02, brassD, 0.5, 0.675, 0.14, desk);                                                       /* 蜡烛 */
    var roll = cyl(0.035, 0.035, 0.5, mat(0xe6d3a0), -0.45, 0.7, 0.2, desk); roll.rotation.z = Math.PI / 2; roll.rotation.y = 0.3;                                                 /* 卷着的另一张图 */
    var wallMap = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.73), paperM); wallMap.position.set(-0.85, 1.42, HZ - T / 2 - 0.012); wallMap.rotation.y = Math.PI; group.add(wallMap);
    box(1.16, 0.035, 0.03, darkM, -0.85, 1.8, HZ - T / 2 - 0.02); box(1.16, 0.035, 0.03, darkM, -0.85, 1.04, HZ - T / 2 - 0.02);
    hide(1.3, 1.4, 0.62, -0.85, 0.7, 1.12);
    items.push({ id: 'map', label: '🗺 看地图', at: V(-0.85, 0, 0.55), obj: desk, extra: [wallMap], reach: 1.1 });

    /* —— 小凳（坐下来正好对着大窗） —— */
    cyl(0.19, 0.16, 0.06, trimM, 0.35, 0.35, 0.35, group, 14); [[0.12, 0.1], [-0.12, 0.1], [0, -0.14]].forEach(function (q) { rod(V(0.35 + q[0] * 1.2, 0, 0.35 + q[1] * 1.2), V(0.35 + q[0] * 0.6, 0.33, 0.35 + q[1] * 0.6), 0.02, darkM); });
    hide(0.3, 1.4, 0.3, 0.35, 0.7, 0.35);
    seats.push({ p: V(0.35, 0, 0.35), front: V(0, 0, -1), h: 0.38, kind: 'sit' });

    /* —— 地铺：靠左墙，枕头朝大窗那头 —— */
    var bed = box(0.82, 0.16, 1.75, mat(0xe9dcc0), -1.2, 0.08, -0.5); solids.push(bed); all.push(bed);
    box(0.84, 0.05, 1.0, mat(0x4f7fb0), -1.2, 0.175, -0.1); box(0.84, 0.052, 0.14, mat(0xf2c14e), -1.2, 0.176, -0.52);
    var pillow = box(0.56, 0.1, 0.3, mat(0xf7f1e2), -1.2, 0.21, -1.16); pillow.rotation.x = -0.12;
    seats.push({ p: V(-1.2, 0, -0.45), front: V(0, 0, 1), h: 0.16, kind: 'lie' });
    /* 床头上方的书架 */
    box(0.2, 0.03, 0.95, trimM, -HX + 0.14, 1.52, -0.98); box(0.2, 0.03, 0.95, trimM, -HX + 0.14, 1.86, -0.98);
    [['#b5483a', 0.2], ['#3f6f8f', 0.24], ['#d9a441', 0.18], ['#5a8a3a', 0.22], ['#7a4a8a', 0.2]].forEach(function (q, i) { box(0.14, q[1], 0.055, mat(q[0]), -HX + 0.14, 1.535 + q[1] / 2, -1.38 + i * 0.07); });
    cyl(0.06, 0.05, 0.14, mat(0x9fd3c7, { transparent: true, opacity: 0.75 }), -HX + 0.14, 1.605, -0.86); cyl(0.045, 0.045, 0.02, trimM, -HX + 0.14, 1.685, -0.86);     /* 玻璃罐 */
    var pine = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.13, 8), mat(0x7a5632)); pine.position.set(-HX + 0.14, 1.6, -0.68); group.add(pine);                           /* 捡来的松果 */
    /* 墙上钉着的画 */
    [[0xf2c14e, 1.36, 1.25, 0.26, 0.2, 0.06], [0x8fc1e3, 1.34, 1.52, 0.2, 0.26, -0.08]].forEach(function (q) { var p = new THREE.Mesh(new THREE.PlaneGeometry(q[3], q[4]), new THREE.MeshBasicMaterial({ color: col(q[0]) })); p.position.set(q[1], q[2], HZ - T / 2 - 0.012); p.rotation.set(0, Math.PI, q[5]); group.add(p); });

    /* —— 百宝箱：右后角，掀开盖子能翻到小东西 —— */
    var chest = new THREE.Group(); chest.position.set(1.18, 0, 1.12); group.add(chest);
    box(0.72, 0.36, 0.44, mat(0x8a5a32), 0, 0.18, 0, chest); [-0.26, 0.26].forEach(function (x) { box(0.07, 0.37, 0.455, brassD, x, 0.18, 0, chest); });
    var lid = new THREE.Group(); lid.position.set(0, 0.36, 0.22); chest.add(lid);
    box(0.74, 0.11, 0.46, mat(0x7a4e2a), 0, 0.055, -0.22, lid); [-0.26, 0.26].forEach(function (x) { box(0.07, 0.12, 0.475, brassD, x, 0.055, -0.22, lid); }); box(0.09, 0.09, 0.03, brass, 0, 0.0, -0.455, lid);
    var loot = new THREE.Group(); loot.position.y = 0.3; chest.add(loot); loot.visible = false;
    [[0xf2c14e, -0.2, 0.05], [0xe05a4a, 0.02, -0.06], [0x6cc070, 0.2, 0.04], [0x8fc1e3, -0.06, 0.1]].forEach(function (q) { var s = new THREE.Mesh(new THREE.IcosahedronGeometry(0.05, 0), new THREE.MeshBasicMaterial({ color: col(q[0]) })); s.position.set(q[1], 0.04, q[2]); loot.add(s); });
    hide(0.72, 1.4, 0.44, 1.18, 0.7, 1.12);
    var chestItem = { id: 'chest', label: '🧰 打开百宝箱', at: V(1.18, 0, 0.6), obj: chest, reach: 1.05, open: false };
    items.push(chestItem);

    /* —— 提灯：挂在屋脊下，可以点亮 —— */
    var lamp = new THREE.Group(); lamp.position.set(0.1, 2.12, -0.1); group.add(lamp);
    rod(V(0, 0.16, 0), V(0, 0.78, 0), 0.008, darkM, lamp); cyl(0.07, 0.09, 0.03, brassD, 0, 0.15, 0, lamp); cyl(0.09, 0.07, 0.03, brassD, 0, -0.1, 0, lamp);
    var glassM = new THREE.MeshBasicMaterial({ color: col(0x8a8168), transparent: true, opacity: 0.85 }), glass = cyl(0.062, 0.062, 0.22, glassM, 0, 0.025, 0, lamp, 12);
    var glow = new THREE.PointLight(0xffc27a, 0, 7, 1.6); glow.position.set(0, 0.02, 0); lamp.add(glow);
    var lampItem = { id: 'lamp', label: '🏮 点亮提灯', at: V(0.1, 0, -0.1), obj: lamp, reach: 0.75, on: false };
    items.push(lampItem);

    /* —— 屋外（只在进树屋时显示）：树干和斜撑、头顶和左右的树冠、远处一圈林子、脚下的草地、天空 —— */
    var env = new THREE.Group(); env.name = 'treehouse-env'; group.add(env);
    var bark = mat(0x6a5038); cyl(0.42, 0.62, drop, bark, -0.5, -drop / 2 - 0.1, 0.1, env, 12);
    rod(V(-0.4, -1.9, 0.1), V(1.9, -0.12, 0.9), 0.09, bark, env); rod(V(-0.4, -1.9, 0.1), V(1.9, -0.12, -0.9), 0.09, bark, env);
    rod(V(-0.9, -0.9, 0.3), V(-2.3, -0.3, 0.6), 0.22, bark, env); rod(V(-2.3, -0.3, 0.6), V(-3.3, 4.2, 1.3), 0.2, bark, env); rod(V(-0.8, -0.9, -0.5), V(-2.0, -0.3, -1.9), 0.2, bark, env); rod(V(-2.0, -0.3, -1.9), V(-2.9, 4.6, -3.0), 0.17, bark, env); rod(V(0, -0.9, 0.5), V(0.7, -0.3, 2.0), 0.19, bark, env); rod(V(0.7, -0.3, 2.0), V(1.7, 4.6, 3.3), 0.16, bark, env);
    var leafM = [mat(0x2f5a26), mat(0x3b6e2e), mat(0x274c22), mat(0x4a8236)], leafG = new THREE.IcosahedronGeometry(1, 1);
    function leaf(x, y, z, r) { var o = new THREE.Mesh(leafG, leafM[Math.floor(rnd() * 4)]); o.position.set(x, y, z); o.scale.set(r * (0.9 + rnd() * 0.3), r * (0.7 + rnd() * 0.25), r * (0.9 + rnd() * 0.3)); o.rotation.set(rnd() * 3, rnd() * 3, 0); env.add(o); }
    function leafAt(az, dist, y, r) { var a = az * D2R; leaf(Math.sin(a) * dist, y, -Math.cos(a) * dist, r); }                                 /* az：从大窗正前方往右转的角度 */
    for (var li = 0; li < 16; li++) leafAt(rnd() * 360, 1.5 + rnd() * 4.2, 4.7 + rnd() * 2.6, 1.7 + rnd() * 1.1);                                 /* 头顶 */
    var azL = opt.treeAz == null ? -24 : opt.treeAz;                                                                                               /* 大窗左边：从这个角度往左全是树冠（挡住底图里画着的那棵树） */
    for (li = 0; li < 26; li++) leafAt(azL - 20 - rnd() * 60, 8 + rnd() * 4, -3.5 + rnd() * 9, 1.6 + rnd() * 0.7);
    for (li = 0; li < 9; li++) leafAt(azL - 13 - rnd() * 4, 7 + rnd() * 2, -4 + li * 1.25, 1.5);
    var azR = opt.edgeAz == null ? 24 : opt.edgeAz;
    for (li = 0; li < 12; li++) leafAt(azR + 16 + rnd() * 80, 5.5 + rnd() * 4, 0.5 + rnd() * 5, 1.8 + rnd() * 1.0);
    for (li = 0; li < 14; li++) leafAt(120 + rnd() * 170, 5 + rnd() * 5, -2 + rnd() * 8, 2 + rnd() * 1.2);
    /* 远处一圈林子：画在圆筒内壁上的一排排树（山谷那一段空着） */
    var woodsT = canvas(1024, 512, function (g, w, h) {
      g.clearRect(0, 0, w, h);
      [['#2c5a2a', 150, 46], ['#376b2e', 210, 40], ['#447c33', 270, 36], ['#55913a', 330, 30]].forEach(function (L, li2) {
        g.fillStyle = L[0]; g.beginPath(); g.moveTo(0, h);
        for (var x = 0; x <= w; x += 8) { var u = x / w * Math.PI * 2; g.lineTo(x, L[1] - L[2] * (0.5 * Math.sin(u * (7 + li2 * 2) + li2) + 0.3 * Math.sin(u * (17 + li2 * 3) + 1.7 * li2) + 0.2 * Math.sin(u * 41 + li2))); }
        g.lineTo(w, h); g.closePath(); g.fill();
      });
    }); woodsT.wrapS = THREE.RepeatWrapping; woodsT.repeat.x = 4;
    var a0 = azR + 2, a1 = 360 + azL - 4, woods = new THREE.Mesh(new THREE.CylinderGeometry(34, 34, 30, 64, 1, true, (180 - a1) * D2R, (a1 - a0) * D2R), new THREE.MeshBasicMaterial({ map: woodsT, transparent: true, side: THREE.BackSide, depthWrite: false }));
    woods.position.y = -drop + 15; woods.renderOrder = -4; env.add(woods);
    var grassT = canvas(256, 256, function (g, w) { var gr = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); gr.addColorStop(0, 'rgba(110,170,62,1)'); gr.addColorStop(0.72, 'rgba(98,158,56,1)'); gr.addColorStop(1, 'rgba(98,158,56,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, w); });
    var grass = new THREE.Mesh(new THREE.CircleGeometry(40, 48), new THREE.MeshBasicMaterial({ map: grassT, transparent: true, depthWrite: false })); grass.rotation.x = -Math.PI / 2; grass.position.y = -drop; grass.renderOrder = -5; env.add(grass);
    var sky = new THREE.Mesh(new THREE.SphereGeometry(3400, 24, 12), new THREE.MeshBasicMaterial({ color: col(0x9cc8ee), side: THREE.BackSide, depthWrite: false, fog: false })); sky.renderOrder = -20; sky.frustumCulled = false; env.add(sky);

    return {
      group: group, env: env, solids: solids, all: all, items: items, seats: seats,
      spawn: V(HX + 0.75, 0, 0.35), exitX: HX + 0.12,                      /* 进来时站在阳台上；过了这条线就是阳台 */
      scopeEye: V(0.35, 1.2, -HZ - 0.55), scopeAxis: V(0, 0, -1),          /* 望远镜的视点（在窗外一点，不被窗框挡）和朝向 */
      setLamp: function (on) { lampItem.on = on; lampItem.label = on ? '🏮 熄灭提灯' : '🏮 点亮提灯'; glow.intensity = on ? 1.1 : 0; glassM.color.copy(col(on ? 0xffe2a0 : 0x8a8168)); },
      setChest: function (open) { chestItem.open = open; chestItem.label = open ? '🧰 合上百宝箱' : '🧰 打开百宝箱'; loot.visible = open; },
      tick: function (dt) { var want = chestItem.open ? 1.25 : 0; lid.rotation.x += (want - lid.rotation.x) * Math.min(1, dt * 6); },
      dispose: function () { group.traverse(function (o) { if (o.isMesh) { o.geometry.dispose(); [].concat(o.material).forEach(function (m) { if (m.map) m.map.dispose(); m.dispose(); }); } }); }
    };
  } };
})();
