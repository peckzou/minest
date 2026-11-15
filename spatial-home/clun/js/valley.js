/* Clun · 外景：劳特布龙嫩山谷（用户照片做远景）+ 照交付效果图（图 2）布置的 3D 花园。
   比例：照片里木屋（约 12 m）和教堂塔（约 30 m）的像素高度与它们底边离地平线的距离之比，反推出拍摄机位离谷底约 18 m。
   3D 相机放在同样高度、同样视角（照片按水平 66° 贴在远处平面上，地平线在照片中线）。房子放在河左岸的缓坡台地上，
   离镜头 61 m：底边落在画面 7 成高处（和效果图一样），大小比效果图小约三成，和身后照片里的木屋比例协调。
   山谷坐标（Z 向上）：相机在 (0,0,18)，看向 +Y；Y 是离镜头的距离；照片里的河在画面右侧（+8.6° 以右），3D 地面只铺到河左岸。
   风格：写实一点的动画风。树冠是叶片卡片簇（手绘叶片贴图 + 球形法线），草坪、石阶、树皮、木板都是细节贴图。 */
(function () {
  'use strict';
  var C = window.Clun = window.Clun || {};
  var D2R = Math.PI / 180;
  var V = C.VALLEY = {
    img: 'art/lauterbrunnen-valley.jpg', IW: 1266, IH: 860, hfov: 66,       /* 照片：假定水平视角 66° */
    camZ: 10,                                                              /* 机位离谷底的高度（照用户的构图参考定的） */
    house: [-11.1, 54], houseRot: 11.6, viewHfov: 64, RB: 2500, backYaw: 5.5   /* 远景照片往右挪 5.5°：教堂、瀑布、桥落在参考图的位置 */
  };
  function lin(hex) { return new THREE.Color(hex).convertSRGBToLinear(); }
  function canvas(n) { var c = document.createElement('canvas'); c.width = c.height = n; return c; }
  function texOf(cv, rep) { var t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.encoding = THREE.sRGBEncoding; t.anisotropy = 8; if (rep) t.repeat.set(1 / rep, 1 / rep); return t; }
  function prng(s) { return function () { s = (s * 16807) % 2147483647; return s / 2147483647; }; }

  /* —— 贴图 —— */
  function grassTex() {                                                    /* 草坪：多层斑块 + 细草叶，铺 6 m */
    var N = 1024, cv = canvas(N), g = cv.getContext('2d'), r = prng(3), i;
    g.fillStyle = '#649f33'; g.fillRect(0, 0, N, N);
    for (i = 0; i < 120; i++) { var x = r() * N, y = r() * N, rr = 60 + r() * 160, gr = g.createRadialGradient(x, y, 0, x, y, rr), k = r();
      gr.addColorStop(0, k < 0.5 ? 'rgba(60,110,30,0.14)' : 'rgba(140,182,64,0.14)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - rr, y - rr, rr * 2, rr * 2); }
    for (i = 0; i < 70000; i++) {
      var x2 = r() * N, y2 = r() * N, a = -1.2 - r() * 0.7, L = 2 + r() * 5, k2 = r();
      g.strokeStyle = k2 < 0.35 ? 'rgba(58,104,30,0.3)' : k2 < 0.75 ? 'rgba(104,156,48,0.3)' : k2 < 0.95 ? 'rgba(146,188,74,0.3)' : 'rgba(186,204,108,0.3)';
      g.lineWidth = 1 + r() * 0.8; g.beginPath(); g.moveTo(x2, y2); g.lineTo(x2 + Math.cos(a) * L, y2 + Math.sin(a) * L); g.stroke();
    }
    return texOf(cv, 7);
  }
  function leafTex() {                                                     /* 几团叶簇（透明底）：每团左上受光、右下背光，边缘是一片片叶子 */
    var N = 512, cv = canvas(N), g = cv.getContext('2d'), r = prng(5), i, j;
    var clumps = [[256, 300, 150], [170, 220, 105], [340, 210, 110], [250, 150, 100], [130, 330, 90], [385, 330, 95]];
    clumps.forEach(function (cl) {
      for (j = 0; j < 420; j++) {
        var a = r() * 6.28, d = Math.pow(r(), 0.6) * cl[2], x = cl[0] + Math.cos(a) * d, y = cl[1] + Math.sin(a) * d;
        if (Math.hypot(x - 256, y - 256) > 245) continue;
        var lx = ((x - cl[0]) * -0.6 + (y - cl[1]) * -0.8) / cl[2], k = Math.max(0, Math.min(1, 0.5 + lx * 0.6 + (r() - 0.5) * 0.35));
        var c0 = [42, 82, 26], c1 = [92, 140, 44], c2 = [158, 196, 78], c = k < 0.5 ? mix(c0, c1, k * 2) : mix(c1, c2, (k - 0.5) * 2);
        var L = 9 + r() * 9, W = 4 + r() * 3.5, rot = a + (r() - 0.5) * 1.2;
        g.fillStyle = 'rgb(' + c.join(',') + ')';
        g.save(); g.translate(x, y); g.rotate(rot); g.beginPath(); g.moveTo(-L, 0); g.quadraticCurveTo(0, -W, L, 0); g.quadraticCurveTo(0, W, -L, 0); g.fill(); g.restore();
      }
    });
    function mix(a, b, t) { return [Math.round(a[0] + (b[0] - a[0]) * t), Math.round(a[1] + (b[1] - a[1]) * t), Math.round(a[2] + (b[2] - a[2]) * t)]; }
    var t = texOf(cv); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; return t;
  }
  function flowerTex() {                                                   /* 一簇小花（白色，按颜色染） */
    var N = 128, cv = canvas(N), g = cv.getContext('2d'), r = prng(9), i, p;
    for (i = 0; i < 26; i++) {
      var a = r() * 6.28, d = Math.sqrt(r()) * 50, x = 64 + Math.cos(a) * d, y = 64 + Math.sin(a) * d, R = 5 + r() * 4;
      for (p = 0; p < 5; p++) { var pa = p * 1.2566 + r(); g.fillStyle = 'rgba(' + (225 + r() * 30 | 0) + ',' + (225 + r() * 30 | 0) + ',' + (225 + r() * 30 | 0) + ',1)';
        g.beginPath(); g.ellipse(x + Math.cos(pa) * R * 0.6, y + Math.sin(pa) * R * 0.6, R * 0.55, R * 0.35, pa, 0, 6.28); g.fill(); }
      g.fillStyle = 'rgb(240,200,90)'; g.beginPath(); g.arc(x, y, R * 0.22, 0, 6.28); g.fill();
    }
    var t = texOf(cv); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; t.encoding = THREE.LinearEncoding; return t;
  }
  function stoneTex() {
    var N = 256, cv = canvas(N), g = cv.getContext('2d'), r = prng(13), i;
    g.fillStyle = '#a49d92'; g.fillRect(0, 0, N, N);
    for (i = 0; i < 3000; i++) { var k = r(); g.fillStyle = k < 0.5 ? 'rgba(120,114,104,0.35)' : 'rgba(196,190,180,0.35)'; g.fillRect(r() * N, r() * N, 1 + r() * 3, 1 + r() * 3); }
    for (i = 0; i < 18; i++) { g.strokeStyle = 'rgba(80,76,70,0.35)'; g.lineWidth = 1; g.beginPath(); var x = r() * N, y = r() * N; g.moveTo(x, y); for (var j = 0; j < 4; j++) { x += (r() - 0.5) * 40; y += (r() - 0.5) * 40; g.lineTo(x, y); } g.stroke(); }
    return texOf(cv, 1.2);
  }
  function barkTex() {
    var N = 256, cv = canvas(N), g = cv.getContext('2d'), r = prng(17), i;
    g.fillStyle = '#5b4434'; g.fillRect(0, 0, N, N);
    for (i = 0; i < 260; i++) { var x = r() * N, k = r(); g.strokeStyle = k < 0.5 ? 'rgba(40,30,22,0.6)' : 'rgba(120,100,80,0.45)'; g.lineWidth = 1 + r() * 3; g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + (r() - 0.5) * 20, N * 0.3, x + (r() - 0.5) * 20, N * 0.7, x + (r() - 0.5) * 10, N); g.stroke(); }
    return texOf(cv, 1.0);
  }
  function plankTex(base) {
    var N = 256, cv = canvas(N), g = cv.getContext('2d'), r = prng(23), i, j, ph = N / 8;
    g.fillStyle = base; g.fillRect(0, 0, N, N);
    for (i = 0; i < 8; i++) {
      g.fillStyle = 'rgba(' + (r() < 0.5 ? '255,235,200,0.1' : '60,35,15,0.14') + ')'; g.fillRect(0, i * ph, N, ph);
      for (j = 0; j < 14; j++) { g.strokeStyle = 'rgba(70,40,20,0.18)'; g.lineWidth = 0.7; g.beginPath(); var y = i * ph + r() * ph; g.moveTo(0, y); g.bezierCurveTo(N * 0.3, y + (r() - 0.5) * 6, N * 0.6, y + (r() - 0.5) * 6, N, y); g.stroke(); }
      g.fillStyle = 'rgba(40,24,12,0.6)'; g.fillRect(0, i * ph, N, 1.5);
    }
    return texOf(cv, 1.6);
  }
  function shingleTex() {
    var N = 256, cv = canvas(N), g = cv.getContext('2d'), r = prng(29), i, j, rows = 10, ch = N / rows, w = N / 6;
    g.fillStyle = '#3d2a20'; g.fillRect(0, 0, N, N);
    for (i = 0; i < rows; i++) for (j = -1; j < 7; j++) { var k = (r() - 0.5) * 0.2; g.fillStyle = 'rgb(' + Math.round(128 * (1 + k)) + ',' + Math.round(80 * (1 + k)) + ',' + Math.round(58 * (1 + k)) + ')'; g.fillRect(j * w + (i % 2) * w / 2 + 1, N - (i + 1) * ch, w - 2, ch - 2); }
    return texOf(cv, 1.4);
  }

  /* —— 地形 —— */
  var H = V.house, TH = V.houseRot * D2R, CS = Math.cos(TH), SN = Math.sin(TH), HP = 2.6;
  /* 构图（照用户给的参考图）：镜头脚下是木栈道和花，地面从脚下向远处缓缓下降（远处的东西不会被近处挡住），
     房子在约 54 m 外的台地上，宽约占画面 1/4；小溪从画面底部斜着流到照片里桥下的那段河，上面接照片自己的河。 */
  var EYE = 10, WZ = 4.55;
  function kz(y) { var d = Math.max(y, 3); return EYE - d * (0.154 + 0.216 * Math.pow(5.4 / d, 0.8)); }   /* 地面标高随距离下降 */
  var RY1 = 33;                                                            /* 小溪在这里接上照片里桥下的河 */
  function riverX(y) { var t = Math.max(0, Math.min(1, (y - 9) / (RY1 - 9))); return 1.1 + 9.0 * (t * t * (3 - 2 * t) * 0.55 + t * 0.45); }
  function riverHW(y) { var t = Math.max(0, Math.min(1, (y - 9) / (RY1 - 9))); return 1.5 - 0.15 * t + 0.15 * Math.sin(y * 0.6); }
  function waterZ(y) { return kz(y) - 0.6; }                                 /* 水面跟着地面坡度走，始终比两岸低 0.6 m */
  function riverEdge(y) { return riverX(y) - riverHW(y); }
  function viewR(y) { return y * Math.tan(34 * D2R) + 3; }                 /* 画面右边缘外一点 */
  function inSite(x, y) {                                                 /* 3D 地面的范围：近处整幅；远处只在左边（右边留给照片里的河、桥和村子） */
    if (y < 3 || y > 64) return false;
    if (x < -0.72 * y - 4) return false;
    return y < RY1 + 0.5 ? x < viewR(y) : x < 0.24 * y - 0.5;
  }
  function local(x, y) { var dx = x - H[0], dy = y - H[1]; return [dx * CS + dy * SN, -dx * SN + dy * CS]; }   /* 山谷 → 房子工程坐标 */
  function hp(x, y) { return [H[0] + x * CS - y * SN, H[1] + x * SN + y * CS]; }                               /* 房子工程坐标 → 山谷 */
  function sstep(a, b, v) { var t = Math.max(0, Math.min(1, (v - a) / (b - a))); return t * t * (3 - 2 * t); }
  function baseZ(x, y) {                                                    /* 镜头相对的下降坡；右岸往右略升；近处有小溪的沟 */
    var z = kz(y), c = riverX(y), hw = riverHW(y);
    if (x > c) z += Math.max(0, x - c - hw) * 0.05;
    if (y < RY1 + 1.5) { var ad = Math.abs(x - c) - hw, bank = sstep(-0.2, 1.0, ad) + sstep(RY1 + 0.5, RY1 + 1.5, y) * (1 - sstep(-0.2, 1.0, ad)), zb = waterZ(y) - 0.4; z = zb + (z - zb) * bank; }
    return z + 0.06 * Math.sin(x * 0.43) * Math.sin(y * 0.31);
  }
  function plateauW(x, y) {                                                 /* 房子台地：房子四周 1，向外 5 m 内降到 0 */
    var l = local(x, y), ox = Math.max(0, Math.abs(l[0] - 1.5) - 11.5), oyF = Math.max(0, -3.4 - l[1]), oyB = Math.max(0, l[1] - 13);
    var d = Math.sqrt(ox * ox + Math.max(oyF, oyB) * Math.max(oyF, oyB));
    var t = Math.max(0, Math.min(1, d / 7)); return 1 - t * t * t * (t * (t * 6 - 15) + 10);
  }
  function rawZ(x, y) { var w = plateauW(x, y), b = baseZ(x, y); return b + (HP - b) * w; }
  var ST = { y0: -3.6, y1: -7.8, w: 1.7 }, stFoot = null;                  /* 门前台阶（房子工程坐标） */
  function stairZ(ly) { if (stFoot == null) { var f = hp(0, ST.y1); stFoot = rawZ(f[0], f[1]); } return HP + (stFoot - HP) * Math.max(0, Math.min(1, (ST.y0 - ly) / (ST.y0 - ST.y1))); }
  function terrainZ(x, y) {                                                 /* 台阶两侧 0.6 m 以内按台阶斜线下挖，台阶不被坡面埋住 */
    var z = rawZ(x, y), l = local(x, y), ax = Math.abs(l[0]) - (ST.w / 2 + 0.25);
    if (l[1] < ST.y0 + 0.3 && l[1] > ST.y1 - 1 && ax < 0.8) { var zs = stairZ(l[1]) - 0.08; z = ax <= 0 ? Math.min(z, zs) : Math.min(z, zs + (z - zs) * (ax / 0.8)); }
    return z;
  }
  C.VALLEY.terrainZ = terrainZ;

  /* —— 叶片卡片：一批卡片合成一个网格，法线取树冠球心方向，卡片正面朝镜头 —— */
  function Cards(tex, alphaTest) { this.p = []; this.n = []; this.u = []; this.c = []; this.tex = tex; this.at = alphaTest; }
  var CAM = new THREE.Vector3(0, 0, V.camZ);
  Cards.prototype.card = function (pos, size, nrm, col, rot) {
    var to = CAM.clone().sub(pos).normalize(), up0 = new THREE.Vector3(0, 0, 1), right = new THREE.Vector3().crossVectors(up0, to).normalize(), up = new THREE.Vector3().crossVectors(to, right);
    var c = Math.cos(rot), s = Math.sin(rot), R = right.clone().multiplyScalar(c).addScaledVector(up, s), U = up.clone().multiplyScalar(c).addScaledVector(right, -s), h = size / 2, self = this;
    var q = [[-1, -1, 0, 0], [1, -1, 1, 0], [1, 1, 1, 1], [-1, 1, 0, 1]], idx = [0, 1, 2, 0, 2, 3];
    idx.forEach(function (i) { var v = pos.clone().addScaledVector(R, q[i][0] * h).addScaledVector(U, q[i][1] * h); self.p.push(v.x, v.y, v.z); self.n.push(nrm.x, nrm.y, nrm.z); self.u.push(q[i][2], q[i][3]); self.c.push(col[0], col[1], col[2]); });
  };
  Cards.prototype.mesh = function () {
    var g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.u, 2)); g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3));
    var m = new THREE.MeshStandardMaterial({ map: this.tex, alphaTest: this.at, side: THREE.DoubleSide, vertexColors: true, roughness: 0.95 });
    var mesh = new THREE.Mesh(g, m); mesh.castShadow = true; mesh.receiveShadow = true;
    mesh.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: this.tex, alphaTest: this.at });
    return mesh;
  };

  C.buildValley = function (scene, house, renderer) {
    var K = C.Kit, P = V, disp = [], rnd = prng(11);
    var root = new THREE.Group(); root.name = 'valley'; scene.add(root);
    var site = new THREE.Group(); site.rotation.x = -Math.PI / 2; root.add(site);          /* 山谷坐标（Z 向上）→ three */
    var T = { grass: grassTex(), leaf: leafTex(), flower: flowerTex(), stone: stoneTex(), bark: barkTex(), plank: plankTex('#9a6a40'), plankD: plankTex('#6e4a2e'), shingle: shingleTex() };
    for (var tk in T) disp.push(T[tk]);
    function sm(map, hex, rough) { var m = new THREE.MeshStandardMaterial({ map: map || null, color: lin(hex == null ? 0xffffff : hex), roughness: rough == null ? 0.9 : rough }); disp.push(m); return m; }
    var M = { stone: sm(T.stone), stoneD: sm(T.stone, 0xcfc8bd), bark: sm(T.bark), wood: sm(T.plank), woodD: sm(T.plankD), shingle: sm(T.shingle), shingleD: sm(T.shingle, 0x8c8478), gravel: sm(T.stone, 0xe8dcc4),
      white: sm(null, 0xf3efe6, 0.6), glassT: sm(null, 0x7d9fae, 0.15), soil: sm(null, 0x4a3a2c, 1) };
    var b = new K.Batch();
    function boxM(m, q) { b.box(m, q[0], q[1], q[2], q[3], q[4], q[5]); }
    function cyl(m, A, B, r0, r1, seg) {
      var d = new THREE.Vector3(B[0] - A[0], B[1] - A[1], B[2] - A[2]), L = d.length(), g = new THREE.CylinderGeometry(r1, r0, L, seg || 8, 1, true);
      var q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize());
      b.geom(m, g, new THREE.Matrix4().compose(new THREE.Vector3((A[0] + B[0]) / 2, (A[1] + B[1]) / 2, (A[2] + B[2]) / 2), q, new THREE.Vector3(1, 1, 1)));
    }

    /* —— 远景照片：远处一块平面，跟着镜头平移（山是无穷远） —— */
    var back, tex = new THREE.TextureLoader().load(P.img, function () {                  /* 照片载入后一次性绘画化，再显示 */
      var rt = C.Paint.paintBackdrop(renderer, tex, 2048, Math.round(2048 * P.IH / P.IW)); disp.push(rt);
      back.material.map = rt.texture; back.material.needsUpdate = true; back.visible = true;
    });
    tex.minFilter = THREE.LinearFilter; tex.generateMipmaps = false; disp.push(tex);
    var BW = 2 * P.RB * Math.tan(P.hfov / 2 * D2R), BH = BW * P.IH / P.IW;
    back = new THREE.Mesh(new THREE.PlaneGeometry(BW, BH), new THREE.MeshBasicMaterial({ toneMapped: false, depthWrite: false, fog: false })); back.visible = false;
    back.renderOrder = -10; back.frustumCulled = false; root.add(back); disp.push(back.geometry, back.material);

    /* —— 地形：河左岸往左上坡，房子在台地上 —— */
    (function () {
      var x0 = -52, x1 = 24, y0 = 2, y1 = 66, st = 0.5, nx = Math.round((x1 - x0) / st), ny = Math.round((y1 - y0) / st), pos = [], uv = [], col = [], idx = [], i, j;
      for (j = 0; j <= ny; j++) for (i = 0; i <= nx; i++) {
        var y = y0 + j * st, x = x0 + i * st, z = terrainZ(x, y); pos.push(x, y, z); uv.push(x, y);
        var sl = Math.abs(terrainZ(x + 0.5, y) - terrainZ(x - 0.5, y)) + Math.abs(terrainZ(x, y + 0.5) - terrainZ(x, y - 0.5));
        var sh = 1 - 0.16 * Math.min(1, sl * 0.8) - (y < 26 ? 0.25 * (1 - sstep(0, 2.0, Math.abs(x - riverX(y)) - riverHW(y))) : 0) + (rnd() - 0.5) * 0.04; col.push(sh, sh, sh);
      }
      for (j = 0; j < ny; j++) for (i = 0; i < nx; i++) {
        if (!inSite(x0 + (i + 0.5) * st, y0 + (j + 0.5) * st)) continue;
        var a = j * (nx + 1) + i; idx.push(a, a + 1, a + nx + 2, a, a + nx + 2, a + nx + 1);
      }
      var g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals();
      var gm = new THREE.MeshStandardMaterial({ map: T.grass, color: lin(0xc8d0ba), roughness: 1, vertexColors: true }); disp.push(g, gm);
      var m = new THREE.Mesh(g, gm); m.receiveShadow = true; site.add(m);
    })();

    /* —— 房子 —— */
    var holder = new THREE.Group(); holder.position.set(H[0], HP + 0.3, -H[1]); holder.rotation.y = TH; root.add(holder);
    if (house.parent) house.parent.remove(house); holder.add(house);

    /* —— 植物 —— */
    var leaves = new Cards(T.leaf, 0.42), fls = new Cards(T.flower, 0.45);
    function canopy(cx, cy, cz, rx, rz, density, tint) {                 /* 一团树冠：卡片散在椭球里，越往外越密 */
      var n = Math.max(3, Math.round(rx * rz * (density || 9) * 0.45)), i, c0 = new THREE.Vector3(cx, cy, cz);
      for (i = 0; i < n; i++) {
        var u = rnd() * 2 - 1, a = rnd() * 6.28, q = Math.sqrt(1 - u * u), rr = 0.45 + 0.55 * Math.sqrt(rnd());
        var p = new THREE.Vector3(cx + Math.cos(a) * q * rx * rr, cy + Math.sin(a) * q * rx * rr, cz + u * rz * rr);
        var nrm = p.clone().sub(c0); nrm.z *= 1.4; nrm.normalize(); nrm.z += 0.25; nrm.normalize();
        var shade = 0.8 + 0.3 * (u * 0.5 + 0.5) + (rnd() - 0.5) * 0.1, t = tint || [1, 1, 1];
        leaves.card(p, Math.max(0.9, rx * (0.6 + rnd() * 0.35)), nrm, [shade * t[0] * 0.95, shade * t[1] * 0.93, shade * t[2] * 0.78], (rnd() - 0.5) * 0.8);
      }
    }
    function tree(x, y, h, r, tint) {
      var z0 = terrainZ(x, y);
      cyl('bark', [x, y, z0 - 0.3], [x, y, z0 + h * 0.62], r * 0.11, r * 0.07, 9);
      cyl('bark', [x, y, z0 + h * 0.45], [x - r * 0.4, y + 0.3, z0 + h * 0.7], r * 0.05, r * 0.03, 6); cyl('bark', [x, y, z0 + h * 0.5], [x + r * 0.45, y - 0.2, z0 + h * 0.74], r * 0.05, r * 0.03, 6);
      canopy(x, y, z0 + h * 0.7, r, h * 0.3, 9, tint);
      canopy(x - r * 0.45, y + 0.4, z0 + h * 0.62, r * 0.6, h * 0.2, 9, tint); canopy(x + r * 0.5, y + 0.2, z0 + h * 0.66, r * 0.55, h * 0.2, 9, tint);
    }
    function conifer(x, y, h) {                                             /* 冷杉：一层层下垂的枝叶 */
      var z0 = terrainZ(x, y), i; cyl('bark', [x, y, z0], [x, y, z0 + h * 0.95], 0.28, 0.06, 7);
      for (i = 0; i < 9; i++) { var t = i / 9, z = z0 + h * (0.18 + t * 0.8), r = h * 0.24 * (1 - t) + 0.3; canopy(x, y, z, r, 0.55, 10, [0.62, 0.78, 0.7]); }
    }
    function bush(x, y, r, h, tint) { var z = terrainZ(x, y); canopy(x, y, z + h * 0.5, r, h * 0.5, 13, tint); }
    var PAL = {}; [['pink', 0xf27aae], ['rose', 0xe0466e], ['white', 0xfbf8f0], ['lilac', 0xa98ae0], ['blue', 0x7f9fe8], ['yellow', 0xf4cf52], ['magenta', 0xd2459a]].forEach(function (q) {
      var c = lin(q[1]); PAL[q[0]] = [c.r, c.g, c.b]; });                  /* 顶点色是线性值 */
    function flowerBush(x, y, r, colors, h) {                               /* 一丛花：叶子打底，上面一簇簇花 */
      h = h || 0.7; var z = terrainZ(x, y), i, n = Math.max(3, Math.round(r * r * 14));
      canopy(x, y, z + h * 0.4, r, h * 0.45, 16, [0.95, 1, 0.9]);
      for (i = 0; i < n * 2; i++) { var a = rnd() * 6.28, d = Math.sqrt(rnd()) * r * 0.9, col = PAL[colors[i % colors.length]], k = 0.9 + rnd() * 0.15;
        fls.card(new THREE.Vector3(x + Math.cos(a) * d, y + Math.sin(a) * d - 0.15, z + h * (0.6 + rnd() * 0.5)), 0.5 + rnd() * 0.25, new THREE.Vector3(0.1, -0.5, 0.86).normalize(), [col[0] * k, col[1] * k, col[2] * k], rnd() * 6.28); }
    }
    function hydrangea(x, y) { var z = terrainZ(x, y), i, cols = ['blue', 'lilac', 'white'];
      canopy(x, y, z + 0.45, 0.65, 0.42, 16, [0.85, 0.95, 0.85]);
      for (i = 0; i < 10; i++) { var a = rnd() * 6.28, d = rnd() * 0.55, col = PAL[cols[i % 3]]; fls.card(new THREE.Vector3(x + Math.cos(a) * d, y + Math.sin(a) * d - 0.15, z + 0.75 + rnd() * 0.25), 0.6, new THREE.Vector3(0, -0.4, 0.92).normalize(), col, rnd() * 6.28); } }

    /* —— 台阶：从坡上的草地走上房前台地，两边是花 —— */
    (function () {
      var n = 12, y0 = ST.y0, y1 = ST.y1, w = ST.w, i;
      var zTop = HP, zBot = stairZ(y1), rise = (zTop - zBot) / n;
      for (i = 0; i < n; i++) {
        var ya = y0 + (y1 - y0) * (i + 1) / n, yb = y0 + (y1 - y0) * i / n, zt = zTop - rise * i;
        var c = [hp(-w / 2, ya), hp(w / 2, ya), hp(w / 2, yb + 0.03), hp(-w / 2, yb + 0.03)];
        b.extrude(i % 2 ? 'stone' : 'stoneD', c.map(function (p) { return [p[0], p[1], zt]; }), [0, 0, -(rise + 0.25)]);
      }
      [-1, 1].forEach(function (s) {                                       /* 两侧矮石墙 */
        var a = hp(s * (w / 2 + 0.18), y0), c = hp(s * (w / 2 + 0.18), y1);
        b.extrude('stone', [[a[0] - 0.15 * CS, a[1] - 0.15 * SN, zTop + 0.25], [c[0] - 0.15 * CS, c[1] - 0.15 * SN, zBot + 0.35], [c[0] + 0.15 * CS, c[1] + 0.15 * SN, zBot + 0.35], [a[0] + 0.15 * CS, a[1] + 0.15 * SN, zTop + 0.25]], [0, 0, -1.4]);
      });
      /* 台阶两侧的花坡、门前花境 */
      for (i = 0; i < 6; i++) { var t = (i + 0.5) / 6, yy = y0 + (y1 - y0) * t;
        var L = hp(-(w / 2 + 0.9 + rnd() * 0.3), yy), R = hp(w / 2 + 0.9 + rnd() * 0.3, yy);
        flowerBush(L[0], L[1], 0.55, i % 2 ? ['pink', 'white'] : ['white', 'lilac']); flowerBush(R[0], R[1], 0.55, i % 2 ? ['rose', 'white'] : ['pink', 'lilac']); }
      [[-5.5, -3.0], [-3.6, -3.0], [-2.0, -2.9], [2.2, -2.9], [3.8, -3.0], [5.6, -3.0], [7.6, -2.6]].forEach(function (q, k) { var p = hp(q[0], q[1]); if (k % 3 === 1) hydrangea(p[0], p[1]); else flowerBush(p[0], p[1], 0.7, k % 2 ? ['pink', 'white', 'magenta'] : ['white', 'lilac', 'pink']); });
      [hp(-9.5, -1), hp(-9.8, 2.5), hp(10.8, 0.5), hp(11.2, 4)].forEach(function (p, k) { k % 2 ? hydrangea(p[0], p[1]) : bush(p[0], p[1], 1.1, 1.6); });
      C.VALLEY.stairFoot = hp(0, y1 - 0.6);
    })();

    /* —— 石板小路：从画面下沿弯到台阶脚下 —— */
    (function () {
      var f = C.VALLEY.stairFoot, path = [[-1.2, 10.4], [-2.0, 15], [-4.0, 23], [-6.6, 33], [f[0] + 0.5, f[1] - 2.5], f], i;
      for (i = 0; i < path.length - 1; i++) {
        var a = path[i], c = path[i + 1], L = Math.hypot(c[0] - a[0], c[1] - a[1]), n = Math.max(1, Math.round(L / 0.75));
        for (var k = 0; k < n; k++) {
          var t = (k + 0.5) / n, x = a[0] + (c[0] - a[0]) * t + (rnd() - 0.5) * 0.3, y = a[1] + (c[1] - a[1]) * t + (rnd() - 0.5) * 0.3, r = 0.33 + rnd() * 0.12, sides = 7 + (rnd() * 3 | 0);
          var g = new THREE.CylinderGeometry(r, r * 1.04, 0.1, sides), m = new THREE.Matrix4().makeRotationX(Math.PI / 2); m.premultiply(new THREE.Matrix4().makeRotationZ(rnd() * 3)); m.setPosition(x, y, terrainZ(x, y) + 0.03);
          b.geom(rnd() < 0.5 ? 'stone' : 'stoneD', g, m);
        }
      }
      for (i = 0; i < 8; i++) { var q = path[2 + (i % 3)]; flowerBush(q[0] + (i % 2 ? 1.6 : -1.6) + (rnd() - 0.5), q[1] + (rnd() - 0.5) * 3, 0.5, ['pink', 'white', 'lilac', 'magenta']); }
    })();

    /* —— 小溪：从画面底部斜着流到照片里桥下那段河（之后接照片自己的河）；岸石、岸边灌木 —— */
    (function () {
      var pos = [], uv = [], idx = [], y, k = 0;
      for (y = 5; y <= RY1 + 0.6; y += 0.4, k++) {
        var c = riverX(y), hw = riverHW(y) + 0.3, wz = waterZ(y); pos.push(c - hw, y, wz, c + hw, y, wz); uv.push(0, y / 2.2, 1, y / 2.2);
        if (k) { var a = (k - 1) * 2; idx.push(a, a + 1, a + 3, a, a + 3, a + 2); }
      }
      var g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
      var wm = new THREE.ShaderMaterial({ uniforms: { uTime: C.Paint.time }, vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
        fragmentShader: [
          'uniform float uTime; varying vec2 vUv;',
          'float h2(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }',
          'float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h2(i), h2(i + vec2(1.0, 0.0)), f.x), mix(h2(i + vec2(0.0, 1.0)), h2(i + vec2(1.0, 1.0)), f.x), f.y); }',
          'float fbm(vec2 p){ float s = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { s += a * vn(p); p *= 2.07; a *= 0.5; } return s; }',
          'void main(){',
          '  float u = vUv.x, f = vUv.y + uTime * 0.9;',
          '  float n = fbm(vec2(u * 3.0, f * 1.2));',
          '  float s = fbm(vec2(u * 8.0 + n * 1.5, f * 0.5));',
          '  vec3 deep = vec3(0.42, 0.68, 0.74), mid = vec3(0.68, 0.86, 0.88), foam = vec3(0.96, 0.98, 0.98);',
          '  vec3 c = mix(deep, mid, smoothstep(0.32, 0.68, n));',
          '  float edge = smoothstep(0.18, 0.02, min(u, 1.0 - u));',
          '  float fo = smoothstep(0.56, 0.76, s) + edge * 0.8 + smoothstep(0.64, 0.8, n) * 0.6;',
          '  c = mix(c, foam, clamp(fo, 0.0, 1.0) * 0.88);',
          '  gl_FragColor = vec4(c, 1.0);',
          '}'].join('\n') });
      var wmesh = new THREE.Mesh(g, wm); site.add(wmesh); disp.push(g, wm);
      for (y = 7; y < RY1; y += 0.9 + rnd() * 1.2) [-1, 1].forEach(function (sd) {                  /* 岸边和水里的石头 */
        if (rnd() < 0.55) return;
        var x = riverX(y) + sd * (riverHW(y) + 0.05 + rnd() * 0.45), r = 0.15 + rnd() * 0.3, gg = new THREE.IcosahedronGeometry(1, 1), m = new THREE.Matrix4().makeScale(r * (1 + rnd() * 0.5), r, r * 0.6); m.setPosition(x, y, waterZ(y));
        b.geom(rnd() < 0.5 ? 'stone' : 'stoneD', gg, m);
      });
      for (y = 12; y < RY1; y += 2.2 + rnd() * 2) { var lx = riverEdge(y) - 0.8 - rnd() * 0.5; bush(lx, y, 0.6 + rnd() * 0.4, 0.7 + rnd() * 0.6, [0.86, 0.92, 0.86]); }
      bush(riverX(RY1) - 2.0, RY1 + 0.2, 1.0, 1.3); bush(riverX(RY1) + 2.0, RY1 + 0.2, 1.1, 1.5);
    })();

    /* —— 右岸：沿河栅栏、石桌和四个石凳、灌木、花、树 —— */
    (function () {
      var ys = [], y; for (y = 6; y <= RY1 - 1; y += 1.7) ys.push(y);
      function fx(yy) { return riverX(yy) + riverHW(yy) + 0.55; }
      ys.forEach(function (yy, i) { var x = fx(yy), z = terrainZ(x, yy); boxM('woodD', [x - 0.06, yy - 0.06, z - 0.15, x + 0.06, yy + 0.06, z + 1.05]);
        if (i) { var yp = ys[i - 1], xp = fx(yp), zp = terrainZ(xp, yp); cyl('woodD', [xp, yp, zp + 0.95], [x, yy, z + 0.95], 0.045, 0.045, 6); cyl('woodD', [xp, yp, zp + 0.5], [x, yy, z + 0.5], 0.04, 0.04, 6); } });
      var tx = 5.7, ty = 11.2, tz = terrainZ(tx, ty);
      var g1 = new THREE.CylinderGeometry(0.42, 0.6, 0.72, 9), m1 = new THREE.Matrix4().makeRotationX(Math.PI / 2); m1.setPosition(tx, ty, tz + 0.36); b.geom('stoneD', g1, m1);
      var g2 = new THREE.CylinderGeometry(1.1, 1.04, 0.2, 12), m2 = new THREE.Matrix4().makeRotationX(Math.PI / 2); m2.setPosition(tx, ty, tz + 0.82); b.geom('stone', g2, m2);
      for (var i = 0; i < 4; i++) { var a = i * Math.PI / 2 + 0.5, g = new THREE.CylinderGeometry(0.32, 0.36, 0.46, 8), m = new THREE.Matrix4().makeRotationX(Math.PI / 2); var sx = tx + Math.cos(a) * 1.45, sy = ty + Math.sin(a) * 1.45; m.setPosition(sx, sy, terrainZ(sx, sy) + 0.23); b.geom('stone', g, m); }
      bush(9.5, 16, 1.0, 1.2); flowerBush(11.5, 20, 0.7, ['magenta', 'pink']); bush(15, 26, 1.3, 1.8); flowerBush(8.8, 14.5, 0.6, ['pink', 'white']);
      for (var x = 13; x < 28; x += 1.8 + rnd()) bush(x, RY1 + rnd(), 0.9 + rnd() * 0.5, 1.2 + rnd() * 0.8);     /* 右岸远端：接照片 */
      tree(17, 24, 7, 3.0); tree(21, 30, 8, 3.4);
    })();

    /* —— 前景：木栈道（两侧栅栏）接石板路；左下斜栅栏后面一片粉花 —— */
    (function () {
      var cx = -1.2, w = 0.85, y, z;
      for (y = 2.5; y < 10.6; y += 0.24) { z = Math.max(terrainZ(cx - w, y), terrainZ(cx + w, y)) + 0.14; b.box('wood', cx - w, y, z - 0.05, cx + w, y + 0.2, z); }
      [-1, 1].forEach(function (sd) {
        var ys = []; for (y = 3; y <= 10; y += 1.4) ys.push(y);
        ys.forEach(function (yy, i) { var x = cx + sd * (w + 0.06), zz = terrainZ(x, yy) + 0.12; boxM('woodD', [x - 0.055, yy - 0.055, zz - 0.3, x + 0.055, yy + 0.055, zz + 0.95]);
          if (i) { var yp = ys[i - 1]; cyl('woodD', [x, yp, terrainZ(x, yp) + 0.98], [x, yy, zz + 0.86], 0.04, 0.04, 6); cyl('woodD', [x, yp, terrainZ(x, yp) + 0.55], [x, yy, zz + 0.43], 0.035, 0.035, 6); } });
      });
      var fp = [[-5.6, 7.6], [-3.9, 6.3], [cx - w - 0.06, 5.0]];                                       /* 左下斜栅栏 */
      fp.forEach(function (p, i) { var zz = terrainZ(p[0], p[1]); boxM('woodD', [p[0] - 0.06, p[1] - 0.06, zz - 0.2, p[0] + 0.06, p[1] + 0.06, zz + 1.0]);
        if (i) { var q = fp[i - 1], zq = terrainZ(q[0], q[1]); cyl('woodD', [q[0], q[1], zq + 0.9], [p[0], p[1], zz + 0.9], 0.045, 0.045, 6); cyl('woodD', [q[0], q[1], zq + 0.48], [p[0], p[1], zz + 0.48], 0.04, 0.04, 6); } });
      for (var fx2 = -6.2; fx2 < -2.3; fx2 += 0.55 + rnd() * 0.3) flowerBush(fx2, 7.4 - (fx2 + 6.2) * 0.45 + rnd() * 1.4, 0.45, ['pink', 'magenta', 'white', 'pink'], 0.75);
    })();

    /* —— 大橡树和树屋（照细节图）：粗壮的树干、根部外张，约 4 m 高处分出几根向外平伸的粗枝，宽而低的树冠由沿枝条的几大团叶子组成；
          木板小屋搭在分叉处，悬挑的瓦顶、窗和门，前面一圈带栏杆的阳台，斜撑和立柱托着，长梯落地。小屋正面朝镜头。 —— */
    (function () {
      var ox = -12.5, oy = 25, z0 = terrainZ(ox, oy), i, k;
      /* 局部坐标：u 向右（垂直于看过来的方向），v 朝镜头 */
      var vd = [-ox, -oy], vl = Math.hypot(vd[0], vd[1]); vd = [vd[0] / vl, vd[1] / vl]; var ud = [-vd[1], vd[0]];
      function W(u, v, z) { return [ox + ud[0] * u + vd[0] * v, oy + ud[1] * u + vd[1] * v, z]; }
      function lbox(m, u0, v0, z0b, u1, v1, z1) { b.extrude(m, [W(u0, v0, z1), W(u1, v0, z1), W(u1, v1, z1), W(u0, v1, z1)], [0, 0, z0b - z1]); }
      function seg(m, A, B, r0, r1, sides) { cyl(m, A, B, r0, r1, sides || 10); }
      /* 树干：几段略弯的粗圆柱，根部外张 */
      var tx = 0, tv = -1.9, trunk = [[0, 0, -0.6, 1.1], [0.15, 0.1, 1.6, 0.92], [-0.2, 0.05, 3.4, 0.8], [0.1, -0.1, 5.0, 0.72], [0.0, -0.2, 6.0, 0.62]];
      var TP = trunk.map(function (q) { return W(tx + q[0], tv + q[1], z0 + q[2]); });
      for (i = 0; i < TP.length - 1; i++) seg('bark', TP[i], TP[i + 1], trunk[i][3], trunk[i + 1][3], 14);
      for (k = 0; k < 6; k++) { var a = k / 6 * 6.28 + 0.4, rb = W(tx + Math.cos(a) * 0.5, tv + Math.sin(a) * 0.5, z0 + 0.9), re = W(tx + Math.cos(a) * 2.0, tv + Math.sin(a) * 2.0, z0 - 0.15); seg('bark', rb, re, 0.42, 0.12, 8); }
      /* 粗枝：从树干顶部向外平伸再上扬，末端是一团团树冠 */
      var top = TP[TP.length - 1], limbs = [[-1, 0.1, 3.0], [-0.6, -0.8, 2.6], [0.6, -0.8, 2.6], [1, 0.12, 3.0], [0.05, -1, 2.2], [-0.9, -0.45, 2.1], [0.9, -0.45, 2.1]];   /* 不往镜头方向伸，免得挡住小屋 */
      limbs.forEach(function (L, j) {
        var dl = Math.hypot(L[0], L[1]), du = L[0] / dl, dv = L[1] / dl, len = L[2];
        var P0 = [top[0], top[1], top[2] - 0.6], P1 = W(tx + du * len * 1.1, tv + dv * len * 1.1, z0 + 7.2 + j % 2 * 0.5), P2 = W(tx + du * len * 2.0, tv + dv * len * 2.0, z0 + 8.9 + (j % 3) * 0.4);
        seg('bark', P0, P1, 0.42, 0.28, 10); seg('bark', P1, P2, 0.28, 0.13, 8);
        var Ps = W(tx + du * len * 1.5 + dv * 0.9, tv + dv * len * 1.5 - du * 0.9, z0 + 8.4); seg('bark', P1, Ps, 0.14, 0.06, 6);
        canopy(P2[0], P2[1], P2[2] + 1.1, 2.7 + (j % 2) * 0.4, 1.6, 10);
        canopy(Ps[0], Ps[1], Ps[2] + 0.9, 1.9, 1.2, 10);
      });
      canopy(top[0] - vd[0] * 1.0, top[1] - vd[1] * 1.0, z0 + 11.2, 3.6, 2.0, 10); canopy(top[0] + ud[0] * 1.8 - vd[0] * 0.8, top[1] + ud[1] * 1.8 - vd[1] * 0.8, z0 + 10.4, 2.6, 1.5, 10);
      /* 树屋 */
      var zd = z0 + 4.4, cu = 0.2;                                   /* 平台面标高、小屋中心 */
      lbox('woodD', -2.3, -1.2, zd - 0.22, 2.5, 1.95, zd);            /* 平台（树干从后部穿过） */
      for (i = -2; i <= 2; i++) lbox('woodD', -2.3 + (i + 2) * 1.2, 1.85, zd - 0.42, -2.3 + (i + 2) * 1.2 + 0.12, 1.97, zd - 0.2);   /* 平台前沿的梁头 */
      var cw = 1.45, cv0 = -1.0, cv1 = 0.75, ch = 2.15;              /* 小屋：u 方向半宽、v 范围、墙高 */
      lbox('wood', cu - cw, cv0, zd, cu + cw, cv1, zd + ch);
      [[-1, cv1], [1, cv1], [-1, cv0], [1, cv0]].forEach(function (c) { lbox('woodD', cu + c[0] * cw - 0.08, c[1] - 0.08, zd, cu + c[0] * cw + 0.08, c[1] + 0.08, zd + ch); });
      /* 正面：中间门洞，两边窗 */
      lbox('soil', cu - 0.36, cv1, zd, cu + 0.36, cv1 + 0.02, zd + 1.75); lbox('woodD', cu - 0.45, cv1, zd, cu - 0.36, cv1 + 0.06, zd + 1.84); lbox('woodD', cu + 0.36, cv1, zd, cu + 0.45, cv1 + 0.06, zd + 1.84); lbox('woodD', cu - 0.45, cv1, zd + 1.75, cu + 0.45, cv1 + 0.06, zd + 1.84);
      [-0.95, 0.95].forEach(function (wu) {
        var u0 = cu + wu - 0.32, u1 = cu + wu + 0.32;
        lbox('glassT', u0, cv1, zd + 0.85, u1, cv1 + 0.02, zd + 1.6);
        lbox('woodD', u0 - 0.07, cv1, zd + 0.78, u1 + 0.07, cv1 + 0.06, zd + 0.85); lbox('woodD', u0 - 0.07, cv1, zd + 1.6, u1 + 0.07, cv1 + 0.06, zd + 1.67);
        lbox('woodD', u0 - 0.07, cv1, zd + 0.85, u0, cv1 + 0.06, zd + 1.6); lbox('woodD', u1, cv1, zd + 0.85, u1 + 0.07, cv1 + 0.06, zd + 1.6);
        lbox('woodD', cu + wu - 0.025, cv1, zd + 0.85, cu + wu + 0.025, cv1 + 0.05, zd + 1.6); lbox('woodD', u0, cv1, zd + 1.2, u1, cv1 + 0.05, zd + 1.25);
        lbox('woodD', u0 - 0.05, cv1, zd + 0.62, u1 + 0.05, cv1 + 0.24, zd + 0.78);                 /* 窗下花箱 */
        var fb = W(cu + wu, cv1 + 0.18, 0); for (var f = 0; f < 4; f++) fls.card(new THREE.Vector3(fb[0] + ud[0] * (f - 1.5) * 0.16, fb[1] + ud[1] * (f - 1.5) * 0.16, zd + 0.86), 0.22, new THREE.Vector3(0, -0.4, 0.9).normalize(), PAL[f % 2 ? 'rose' : 'pink'], f);
      });
      /* 侧面一扇小窗 */
      [-1, 1].forEach(function (sg) { var uu = cu + sg * (cw + 0.01); lbox('glassT', Math.min(uu, uu + sg * 0.02), -0.4, zd + 0.95, Math.max(uu, uu + sg * 0.02), 0.2, zd + 1.5); });
      /* 屋顶：屋脊前后走向，三角山墙正对镜头（门上方），悬挑 0.4 m，深色瓦 */
      var zr = zd + ch, ridge = zr + 1.4, ov = 0.4, ou = cw + 0.4, ze = ridge - 1.4 * ou / cw;
      [-1, 1].forEach(function (sg) {
        b.slab('shingleD', [W(cu, cv0 - ov, ridge), W(cu, cv1 + ov, ridge), W(cu + sg * ou, cv1 + ov, ze), W(cu + sg * ou, cv0 - ov, ze)], 0.12);
        seg('woodD', W(cu + sg * ou, cv1 + ov + 0.03, ze - 0.05), W(cu, cv1 + ov + 0.03, ridge - 0.02), 0.07, 0.07, 6);    /* 前山墙封檐 */
      });
      [[cv1, -1], [cv0, 1]].forEach(function (g) {                    /* 前后山墙三角 */
        b.extrude('wood', [W(cu - cw, g[0], zr), W(cu + cw, g[0], zr), W(cu, g[0], ridge - 0.08)], [vd[0] * g[1] * 0.12, vd[1] * g[1] * 0.12, 0]);
      });
      lbox('glassT', cu - 0.28, cv1, zr + 0.25, cu + 0.28, cv1 + 0.03, zr + 0.75);   /* 山墙上的小窗 */
      lbox('woodD', cu - 0.34, cv1, zr + 0.19, cu + 0.34, cv1 + 0.06, zr + 0.25); lbox('woodD', cu - 0.34, cv1, zr + 0.75, cu + 0.34, cv1 + 0.06, zr + 0.81);
      lbox('woodD', cu - 0.03, cv1, zr + 0.25, cu + 0.03, cv1 + 0.05, zr + 0.75);
      lbox('woodD', cu - 0.08, cv0 - ov, ridge - 0.02, cu + 0.08, cv1 + ov, ridge + 0.1);
      /* 阳台栏杆：前面和两侧，左前角留出梯子口 */
      var ry = zd + 0.95, fu0 = -2.2, fu1 = 2.4, fv = 1.85, sv0 = -1.1;
      function railRun(A, B, gapAt) {
        var L = Math.hypot(B[0] - A[0], B[1] - A[1]), n = Math.round(L / 0.16), j;
        for (j = 0; j <= n; j++) { var t = j / n, u = A[0] + (B[0] - A[0]) * t, v = A[1] + (B[1] - A[1]) * t; if (gapAt && gapAt(u, v)) continue;
          var post = j % 4 === 0; lbox('woodD', u - (post ? 0.06 : 0.025), v - (post ? 0.06 : 0.025), zd, u + (post ? 0.06 : 0.025), v + (post ? 0.06 : 0.025), ry + (post ? 0.08 : 0)); }
        seg('woodD', W(A[0], A[1], ry), W(B[0], B[1], ry), 0.055, 0.055, 6); seg('woodD', W(A[0], A[1], zd + 0.45), W(B[0], B[1], zd + 0.45), 0.035, 0.035, 5);
      }
      var gap = function (u, v) { return u < fu0 + 0.75 && v > fv - 0.1; };
      railRun([fu0 + 0.75, fv], [fu1, fv]); railRun([fu0, sv0], [fu0, fv - 0.05], function (u, v) { return v > fv - 0.7; }); railRun([fu1, sv0], [fu1, fv]);
      /* 支撑：前角两根立柱落地，两根斜撑回到树干 */
      [[fu0 + 0.15, fv - 0.1], [fu1 - 0.15, fv - 0.1]].forEach(function (c) { var g = W(c[0], c[1], 0); seg('woodD', W(c[0], c[1], terrainZ(g[0], g[1]) - 0.3), W(c[0], c[1], zd - 0.2), 0.11, 0.1, 8); });
      seg('woodD', W(tx - 0.5, tv + 0.4, zd - 2.0), W(fu0 + 0.4, fv - 0.3, zd - 0.24), 0.08, 0.08, 6); seg('woodD', W(tx + 0.5, tv + 0.4, zd - 2.0), W(fu1 - 0.4, fv - 0.3, zd - 0.24), 0.08, 0.08, 6);
      /* 梯子：从左前角的缺口落到草地，略微斜 */
      var lu = fu0 + 0.38, lvTop = fv + 0.05, lvBot = fv + 1.3, gb = W(lu, lvBot, 0), gz = terrainZ(gb[0], gb[1]);
      [-0.26, 0.26].forEach(function (o) { seg('woodD', W(lu + o, lvBot, gz - 0.1), W(lu + o, lvTop, zd + 1.05), 0.05, 0.05, 6); });
      var nr = Math.round((zd - gz) / 0.3);
      for (i = 1; i <= nr; i++) { var t2 = i / (nr + 0.5), lv = lvBot + (lvTop - lvBot) * t2, lz = gz + (zd + 1.05 - gz) * t2; seg('woodD', W(lu - 0.26, lv, lz), W(lu + 0.26, lv, lz), 0.03, 0.03, 5); }
      flowerBush(W(fu1 + 1.0, fv + 1.0, 0)[0], W(fu1 + 1.0, fv + 1.0, 0)[1], 0.7, ['pink', 'white']); bush(W(-3.2, 0.5, 0)[0], W(-3.2, 0.5, 0)[1], 1.0, 1.0);
    })();


    /* —— 树和灌木：左边大树框住画面，房子两侧和后面的树把草地边缘接上照片 —— */
    tree(-13, 11, 12, 5.0); canopy(-8.5, 10, 14.2, 3.2, 1.8, 10); canopy(-11, 8, 13.4, 2.8, 1.6, 10);   /* 左上角的树冠，盖住远景照片的左边缘 */ tree(-24, 40, 12, 5.0); tree(-28, 54, 13, 5.4); tree(-20, 60, 11, 4.4);
    conifer(-34, 60, 15);
    [hp(-4, 12.5), hp(4, 13), hp(12, 9), hp(-12, 6)].forEach(function (p) { tree(p[0], p[1], 8, 3.2); });
    for (var hxp = -40; hxp < 12; hxp += 2.2 + rnd() * 1.4) { var hy = 61 + rnd() * 2.5; if (hxp > 0.24 * hy - 1.8) continue; bush(hxp, hy, 1.1 + rnd() * 0.5, 1.4 + rnd() * 1.2); }

    b.build(site, M);
    site.traverse(function (o) { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    var lm = leaves.mesh(), fm = fls.mesh(); site.add(lm, fm); disp.push(lm.geometry, lm.material, fm.geometry, fm.material);
    lm.userData.sway = 0.07; fm.userData.sway = 0.03;

    /* —— 统一画风：3D 全换成柔和分层的卡通光照；草坪铺随风摆的草叶 —— */
    C.Paint.toonTree(site, function (o) { return { sway: o.userData.sway || 0, rim: o.userData.sway ? 1.3 : 1 }; });
    C.Paint.toonTree(holder);
    (function () {
      var pts = [], n = 0, y, x, l;
      var N = (navigator.maxTouchPoints > 0 || Math.min(screen.width, screen.height) < 700) ? 12000 : 36000;   /* 手机上少铺一些 */
      while (n < N) {
        y = 3 + Math.pow(rnd(), 1.15) * 60; x = -0.72 * y - 4 + rnd() * (viewR(y) + 0.72 * y + 4);
        if (!inSite(x, y)) continue;
        if (y < RY1 + 1 && Math.abs(x - riverX(y)) < riverHW(y) + 0.4) continue;                       /* 水里 */
        if (Math.abs(x + 1.2) < 1.0 && y < 10.8) continue;                                           /* 木栈道 */
        if (Math.hypot(x - 5.7, y - 11.2) < 2.2) continue;                                            /* 石桌 */
        l = local(x, y);
        if (l[0] > -9.2 && l[0] < 11.6 && l[1] > -3.0 && l[1] < 11.2) continue;          /* 房子底下 */
        if (Math.abs(l[0]) < 1.4 && l[1] < -3.2 && l[1] > -8.6) continue;                  /* 台阶 */
        pts.push([x, terrainZ(x, y) - 0.03, -y, (0.35 + rnd() * 0.3) * (0.6 + 0.4 * Math.min(1, y / 20))]); n++;
      }
      var gm = C.Paint.grass(pts, rnd); root.add(gm); disp.push(gm.geometry, gm.material);
    })();

    /* —— 光：照片里的晴天，太阳在右前上方 —— */
    var hemi = new THREE.HemisphereLight(0xf3f4ee, 0x5f7a3c, 0.6); root.add(hemi);
    var sun = new THREE.DirectionalLight(0xfff1dc, 1.7), tgt = new THREE.Vector3(-5, 2, -30);
    sun.position.set(tgt.x + 60, 90, tgt.z + 55); sun.target.position.copy(tgt); root.add(sun, sun.target);
    sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.06;
    var sc = sun.shadow.camera; sc.left = -40; sc.right = 40; sc.top = 40; sc.bottom = -40; sc.near = 10; sc.far = 260;

    /* —— 镜头：照片机位，只能在照片范围内小幅转动和推近 —— */
    var pivot = new THREE.Vector3(H[0], HP + 4, -H[1]), C0 = new THREE.Vector3(0, P.camZ, 0), photoV = Math.atan(Math.tan(P.hfov / 2 * D2R) * P.IH / P.IW);
    function frame(a, zoom) {
      var hh = Math.min(P.viewHfov / 2 * D2R * zoom, 32.5 * D2R), vh = Math.atan(Math.tan(hh) / a);
      if (vh > photoV - 4 * D2R) { vh = photoV - 4 * D2R; hh = Math.atan(Math.tan(vh) * a); }
      var yaw0 = a < 1 ? Math.min(0.2, P.hfov / 2 * D2R - hh) : 0, azMax = Math.max(0, P.hfov / 2 * D2R - hh - Math.abs(yaw0) - 0.004);
      return { vfov: vh * 2 / D2R, yaw0: yaw0, azMax: azMax, pMax: Math.max(0, photoV - vh - 0.004), pitch0: -1 * D2R };
    }
    return {
      root: root, holder: holder,
      tick: function (t) { C.Paint.time.value = t; },
      limits: function (a, zoom) { return frame(a, zoom); },
      place: function (camera, O) {
        var f = frame(camera.aspect, O.zoom || 1); O.az = Math.max(-f.azMax, Math.min(f.azMax, O.az)); O.el = Math.max(-f.pMax - 0.06, Math.min(f.pMax, O.el));
        if (Math.abs(camera.fov - f.vfov) > 0.01) { camera.fov = f.vfov; camera.updateProjectionMatrix(); }
        var v = C0.clone().sub(pivot).applyAxisAngle(new THREE.Vector3(0, 1, 0), O.az); camera.position.copy(pivot).add(v);
        camera.rotation.order = 'YXZ'; camera.rotation.set(Math.max(-f.pMax - 0.06, Math.min(f.pMax, f.pitch0 + O.el)), f.yaw0 + O.az, 0);
        var by = P.backYaw * D2R; back.position.set(camera.position.x + Math.sin(by) * P.RB, P.camZ, camera.position.z - Math.cos(by) * P.RB); back.rotation.y = -by;
      },
      dispose: function () { scene.remove(root); disp.forEach(function (d) { try { d.dispose(); } catch (e) {} }); }
    };
  };
})();
