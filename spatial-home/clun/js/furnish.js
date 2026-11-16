/* Clun · 内饰：按房产手册（7-South-Drive-Magazine.pdf 第 4–15 页）里的房间照片布置家具和软装，风格化的低面数造型。
   房间位置按平面图（手册第 21 页 / 1-8_floorplan.jpg），家具尺寸是常见尺寸，全部 ESTIMATED。
   坐标同其他文件：工程坐标 X 北、Y 进深（正面 0 → 背面）、Z 上；每层的家具放进该层的图层组（关图层 / 剖切时一起走）。
   材质按名字取（C.mats），白模时没有这些名字，自动变成白色。 */
(function () {
  'use strict';
  var C = window.Clun = window.Clun || {}, P = C.P;

  /* —— 贴图：canvas 画的布料、书脊、地毯 —— */
  function cv(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function tex(c, pw, ph) { var t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.encoding = THREE.sRGBEncoding; t.anisotropy = 4; t.repeat.set(1 / pw, 1 / ph); return t; }
  var seed = 11; function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
  function books() {                                   /* 书架正面：一格高 0.36 m，书脊高低、颜色、粗细不一 */
    var c = cv(256, 256), g = c.getContext('2d'), cols = ['#7a2e2a', '#2f4a63', '#556b3a', '#b08a46', '#5c3b2e', '#d8cdb4', '#3d3a52', '#8c5a3c', '#a33e35', '#2d5a57'];
    g.fillStyle = '#3a2a1e'; g.fillRect(0, 0, 256, 256);
    for (var row = 0; row < 2; row++) {
      var y0 = row * 128, x = 0;
      g.fillStyle = '#6b4a30'; g.fillRect(0, y0 + 118, 256, 10);                     /* 层板 */
      while (x < 256) {
        var w = 6 + Math.floor(rnd() * 9), h = 80 + Math.floor(rnd() * 32);
        if (rnd() < 0.08) { x += 10; continue; }
        g.fillStyle = cols[Math.floor(rnd() * cols.length)]; g.fillRect(x, y0 + 118 - h, w - 1, h);
        g.fillStyle = 'rgba(240,215,150,0.55)'; g.fillRect(x + 1, y0 + 118 - h + 10, w - 3, 2); g.fillRect(x + 1, y0 + 118 - 18, w - 3, 2);
        x += w;
      }
    }
    return tex(c, 0.7, 0.72);
  }
  function stripes(c1, c2, n, pw, ph, vertical) {      /* 楼梯地毯、条纹布 */
    var c = cv(128, 128), g = c.getContext('2d'); g.fillStyle = c1; g.fillRect(0, 0, 128, 128); g.fillStyle = c2;
    for (var i = 0; i < n; i++) { var p = (i + 0.5) * 128 / n; if (vertical) g.fillRect(p - 3, 0, 6, 128); else g.fillRect(0, p - 3, 128, 6); }
    return tex(c, pw, ph);
  }
  function check(c1, c2, pw) { var c = cv(64, 64), g = c.getContext('2d'); g.fillStyle = c1; g.fillRect(0, 0, 64, 64); g.fillStyle = c2; g.globalAlpha = 0.55; g.fillRect(0, 0, 32, 64); g.fillRect(0, 0, 64, 32); g.globalAlpha = 1; g.fillRect(0, 0, 32, 32); return tex(c, pw, pw); }
  function motif(bg, fg, leaf, pw, kind) {             /* 印花：toile（蓝白人物花鸟）、floral（白底绿叶花） */
    var c = cv(256, 256), g = c.getContext('2d'); g.fillStyle = bg; g.fillRect(0, 0, 256, 256);
    for (var i = 0; i < 18; i++) {
      var x = rnd() * 256, y = rnd() * 256, r = 10 + rnd() * 18;
      g.fillStyle = leaf; for (var k = 0; k < 4; k++) { var a = k * 1.57 + rnd(); g.beginPath(); g.ellipse(x + Math.cos(a) * r, y + Math.sin(a) * r, r * 0.55, r * 0.22, a, 0, 6.283); g.fill(); }
      g.fillStyle = fg; g.beginPath(); g.arc(x, y, r * (kind === 'toile' ? 0.5 : 0.42), 0, 6.283); g.fill();
      if (kind === 'toile') { g.strokeStyle = fg; g.lineWidth = 2; g.beginPath(); g.arc(x, y, r * 0.85, 0.3, 2.6); g.stroke(); }
    }
    return tex(c, pw, pw);
  }
  function persian(field, border, accent) {            /* 波斯地毯：一整张（贴在一块平面上，贴图坐标 0..1） */
    var c = cv(512, 352), g = c.getContext('2d'), W = 512, H = 352;
    g.fillStyle = border; g.fillRect(0, 0, W, H);
    g.fillStyle = field; g.fillRect(34, 34, W - 68, H - 68);
    g.strokeStyle = accent; g.lineWidth = 3; g.strokeRect(20, 20, W - 40, H - 40); g.strokeRect(40, 40, W - 80, H - 80);
    for (var x = 30; x < W - 20; x += 22) { g.fillStyle = accent; g.beginPath(); g.arc(x, 27, 4, 0, 6.283); g.arc(x, H - 27, 4, 0, 6.283); g.fill(); }
    g.save(); g.translate(W / 2, H / 2);
    [[120, accent], [92, border], [64, '#e8d6a8'], [36, accent], [14, border]].forEach(function (q) { g.fillStyle = q[1]; g.beginPath(); for (var a = 0; a < 16; a++) { var r = q[0] * (a % 2 ? 0.72 : 1), t = a / 16 * 6.283; g.lineTo(Math.cos(t) * r * 1.35, Math.sin(t) * r); } g.closePath(); g.fill(); });
    g.restore();
    for (var i = 0; i < 70; i++) { g.fillStyle = i % 3 ? 'rgba(240,220,170,0.5)' : 'rgba(30,40,70,0.45)'; g.fillRect(50 + rnd() * (W - 100), 50 + rnd() * (H - 100), 5, 5); }
    var t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 4; return t;
  }
  function delft() {                                   /* 手册第 7 页：一整面墙的蓝白小房子（荷航代尔夫特小屋）收藏 */
    var c = cv(256, 256), g = c.getContext('2d'); g.fillStyle = '#e9e6dc'; g.fillRect(0, 0, 256, 256);
    for (var row = 0; row < 2; row++) {
      var y0 = row * 128; g.fillStyle = '#cfc8b6'; g.fillRect(0, y0 + 118, 256, 10);
      for (var x = 4; x < 250; x += 24) {
        var h = 60 + rnd() * 40, w = 20; g.fillStyle = '#f7f6f0'; g.beginPath(); g.moveTo(x, y0 + 118); g.lineTo(x, y0 + 118 - h); g.lineTo(x + w / 2, y0 + 118 - h - 14); g.lineTo(x + w, y0 + 118 - h); g.lineTo(x + w, y0 + 118); g.fill();
        g.fillStyle = '#2c4f8f'; g.fillRect(x + 3, y0 + 118 - h + 8, 5, 7); g.fillRect(x + 12, y0 + 118 - h + 8, 5, 7); g.fillRect(x + 3, y0 + 118 - h + 24, 5, 7); g.fillRect(x + 12, y0 + 118 - h + 24, 5, 7); g.fillRect(x + 7, y0 + 118 - 14, 6, 14);
        g.fillStyle = '#b48a3a'; g.fillRect(x + 8, y0 + 118 - h - 12, 4, 4);
      }
    }
    return tex(c, 0.7, 0.72);
  }
  /* 墙上的画：几幅风格化的小油画（风景、海景、静物花、肖像），整张贴在画布上 */
  function art(kind) {
    var c = cv(256, 192), g = c.getContext('2d'), W = 256, H = 192, i;
    function grad(y0, y1, a, b) { var gr = g.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, a); gr.addColorStop(1, b); g.fillStyle = gr; g.fillRect(0, y0, W, y1 - y0); }
    if (kind === 'land') {
      grad(0, 110, '#9cc0d8', '#e9dcc0'); g.fillStyle = '#7d8f6a'; g.beginPath(); g.moveTo(0, 120); for (i = 0; i <= 8; i++) g.lineTo(i * 32, 100 + Math.sin(i * 1.3) * 14); g.lineTo(W, H); g.lineTo(0, H); g.fill();
      grad(130, H, '#6f8a4a', '#4b5f30'); g.fillStyle = '#3e5228'; for (i = 0; i < 5; i++) { g.beginPath(); g.ellipse(30 + i * 50, 118, 14, 22, 0, 0, 6.283); g.fill(); }
      g.fillStyle = '#c9a46a'; g.fillRect(150, 140, 60, 6);
    } else if (kind === 'sea') {
      grad(0, 100, '#a9c9de', '#e6eef0'); grad(100, H, '#4e7d99', '#2f5870'); g.strokeStyle = 'rgba(255,255,255,0.6)'; g.lineWidth = 2;
      for (i = 0; i < 14; i++) { var y = 110 + i * 6; g.beginPath(); g.moveTo(rnd() * 200, y); g.lineTo(rnd() * 200 + 40, y); g.stroke(); }
      g.fillStyle = '#f4efe2'; g.beginPath(); g.moveTo(120, 96); g.lineTo(140, 50); g.lineTo(140, 96); g.fill(); g.fillStyle = '#5b3a26'; g.fillRect(112, 96, 38, 6);
    } else if (kind === 'flower') {
      grad(0, H, '#3a3f35', '#24271f'); g.fillStyle = '#8a6a44'; g.fillRect(100, 120, 56, 60);
      var cols = ['#e6a3b6', '#f2e3b0', '#c4473f', '#f6f2ea', '#b48ad0']; for (i = 0; i < 16; i++) { g.fillStyle = cols[i % 5]; g.beginPath(); g.arc(128 + (rnd() - 0.5) * 110, 80 + (rnd() - 0.5) * 70, 9 + rnd() * 8, 0, 6.283); g.fill(); }
      g.fillStyle = '#4f6b3a'; for (i = 0; i < 10; i++) { g.beginPath(); g.ellipse(128 + (rnd() - 0.5) * 120, 95 + (rnd() - 0.5) * 60, 12, 4, rnd() * 3, 0, 6.283); g.fill(); }
    } else {
      grad(0, H, '#4a3a2a', '#2a2018'); g.fillStyle = '#2b2f3a'; g.beginPath(); g.ellipse(128, 170, 70, 50, 0, 3.14, 6.283); g.fill(); g.fillRect(58, 165, 140, 30);
      g.fillStyle = '#e2c0a0'; g.beginPath(); g.ellipse(128, 92, 30, 38, 0, 0, 6.283); g.fill(); g.fillStyle = '#5a3a22'; g.beginPath(); g.ellipse(128, 66, 34, 20, 0, 3.0, 6.43); g.fill();
      g.fillStyle = '#f2ece0'; g.beginPath(); g.moveTo(110, 130); g.lineTo(128, 150); g.lineTo(146, 130); g.fill();
    }
    g.globalAlpha = 0.18; for (i = 0; i < 300; i++) { g.fillStyle = rnd() < 0.5 ? '#fff' : '#000'; g.fillRect(rnd() * W, rnd() * H, 3, 1); } g.globalAlpha = 1;   /* 笔触 */
    var t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 4; return t;
  }
  function tiles(c1, c2, size) { var c = cv(128, 128), g = c.getContext('2d'); g.fillStyle = c2; g.fillRect(0, 0, 128, 128); g.fillStyle = c1; g.fillRect(2, 2, 124, 124); return tex(c, size, size); }

  /* 外观模式的家具材质（白模时不加，名字落空就用白墙材质） */
  C.furnMats = function (m) {
    function t(map, rough, color) { return m(color || 0xffffff, rough == null ? 0.85 : rough, { map: map }); }
    var T = C.ftex || (C.ftex = { books: books(), runner: stripes('#7c2f2c', '#d9c49a', 4, 0.7, 0.5, true), toile: motif('#f3f0e6', '#2d4f88', '#5c79ad', 0.6, 'toile'),
      floral: motif('#f2ecd8', '#c98aa0', '#7e9a5c', 0.5, 'floral'), check: check('#f1efe8', '#5d76a0', 0.16), delft: delft(), ktile: tiles('#9a9890', '#7d7b75', 0.6),
      stile: tiles('#e8dfcc', '#c9bfa9', 0.4), rugRed: persian('#8e2b2a', '#2b3550', '#d9b46a'), rugBlue: persian('#34507a', '#8e2b2a', '#e3cf9b'), rugGreen: persian('#5f6e45', '#7a3a2c', '#e0c88f'), artLand: art('land'), artSea: art('sea'), artFlower: art('flower'), artPortrait: art('portrait') });
    return {
      fabCream: m(0xefe3c8, 0.95), fabTeal: m(0x1f5f6b, 0.9), fabRed: m(0xa3302d, 0.9), fabPink: m(0xd88c9e, 0.9), fabBlue: m(0x3c5a86, 0.9), fabLinen: m(0xf4f1ea, 0.95),
      fabFloral: t(T.floral, 0.95), fabToile: t(T.toile, 0.95), fabCheck: t(T.check, 0.95), leather: m(0x6a3523, 0.55), leatherGreen: m(0x2f4a33, 0.55),
      woodDark: m(0x4a2c1b, 0.6), woodMid: m(0x8a5a35, 0.6), woodLight: m(0xc59a68, 0.65), paintCream: m(0xefe8d8, 0.6), paintWhite: m(0xf7f5ef, 0.55), paintNavy: m(0x24324c, 0.5),
      gloss: m(0xf1ece0, 0.22), quartz: m(0xe9e4d8, 0.3), range: m(0x17191c, 0.35), steel: m(0xc9ccce, 0.3, { metalness: 0.6 }), brass: m(0xc29a4a, 0.35, { metalness: 0.6 }),
      ironBlack: m(0x1c1c1e, 0.5), ceramic: m(0xf7f7f3, 0.25), jarBlue: m(0x2f4f8f, 0.3), shade: m(0xf6ead0, 0.9, { emissive: new THREE.Color(0x3a2c14) }), mirror: m(0xbfd0d8, 0.08, { metalness: 0.7 }),
      ovenGlass: m(0x202428, 0.15), tileInset: m(0x3f6f73, 0.4), plant: m(0x4f7a3a, 0.9), bloom: m(0xe7a0b4, 0.9), carpet: m(0xe4dccb, 1.0), carpetBlue: m(0xc9d1d8, 1.0),
      books: t(T.books, 0.9), delft: t(T.delft, 0.6), runner: t(T.runner, 0.95), ktile: t(T.ktile, 0.4), stile: t(T.stile, 0.5),
      rugRed: m(0xffffff, 1, { map: T.rugRed }), rugBlue: m(0xffffff, 1, { map: T.rugBlue }), rugGreen: m(0xffffff, 1, { map: T.rugGreen }),
      artLand: m(0xffffff, 0.8, { map: T.artLand }), artSea: m(0xffffff, 0.8, { map: T.artSea }), artFlower: m(0xffffff, 0.8, { map: T.artFlower }), artPortrait: m(0xffffff, 0.8, { map: T.artPortrait })
    };
  };

  /* —— 摆放工具：o = { x, y, r }，局部坐标 lx 沿宽、ly 沿深（正面在 −ly），r 转角（正面朝向 = (sin r, −cos r)）
     朝 +X：r = π/2 · 朝 −X：r = −π/2 · 朝 +Y：r = π · 朝 −Y：r = 0 —— */
  var PI = Math.PI;
  function at(o, lx, ly) { var c = Math.cos(o.r || 0), s = Math.sin(o.r || 0); return [o.x + lx * c - ly * s, o.y + lx * s + ly * c]; }
  function piece(b, mat, o, lx, ly, hx, hy, z0, z1) { var p = at(o, lx, ly); b.obox(mat, p[0], p[1], hx, hy, o.r || 0, o.z + z0, o.z + z1); }
  function post(b, mat, o, lx, ly, r, z0, z1) { var p = at(o, lx, ly); b.cyl(mat, p[0], p[1], o.z + z0, o.z + z1, r, r, 8); }
  function O(x, y, r, z) { return { x: x, y: y, r: r || 0, z: z || 0 }; }

  function sofa(b, o, w, fab, cush) {                   /* 三人 / 两人沙发：底座、坐垫、靠背、扶手、短腿、靠垫 */
    var d = 0.92, hw = w / 2;
    [-1, 1].forEach(function (s) { [-1, 1].forEach(function (t) { post(b, 'woodDark', o, s * (hw - 0.08), t * (d / 2 - 0.08), 0.025, 0, 0.12); }); });
    piece(b, fab, o, 0, 0, hw, d / 2, 0.12, 0.42);
    piece(b, fab, o, 0, d / 2 - 0.12, hw - 0.14, 0.12, 0.42, 0.88);
    [-1, 1].forEach(function (s) { piece(b, fab, o, s * (hw - 0.07), 0.02, 0.07, d / 2 - 0.02, 0.42, 0.66); });
    var n = w > 1.7 ? 3 : 2, cw = (w - 0.28) / n;
    for (var i = 0; i < n; i++) piece(b, fab, o, -hw + 0.14 + cw * (i + 0.5), -0.06, cw / 2 - 0.015, d / 2 - 0.2, 0.42, 0.53);
    (cush || []).forEach(function (cm, i) { var lx = (i - (cush.length - 1) / 2) * 0.5; piece(b, cm, { x: at(o, lx, d / 2 - 0.28)[0], y: at(o, lx, d / 2 - 0.28)[1], r: (o.r || 0) + (i % 2 ? 0.12 : -0.1), z: o.z }, 0, 0, 0.21, 0.07, 0.5, 0.88); });
  }
  function chair(b, o, fab, wing) {                    /* 扶手椅 / 翼背椅 */
    var hw = 0.42, d = 0.82;
    [-1, 1].forEach(function (s) { [-1, 1].forEach(function (t) { post(b, 'woodDark', o, s * (hw - 0.07), t * (d / 2 - 0.07), 0.022, 0, 0.14); }); });
    piece(b, fab, o, 0, 0, hw, d / 2, 0.14, 0.44);
    piece(b, fab, o, 0, d / 2 - 0.1, hw - 0.04, 0.1, 0.44, wing ? 1.12 : 0.92);
    [-1, 1].forEach(function (s) { piece(b, fab, o, s * (hw - 0.06), wing ? 0.12 : 0.03, 0.06, wing ? d / 2 - 0.12 : d / 2 - 0.03, 0.44, wing ? 1.0 : 0.66); });
    piece(b, fab, o, 0, -0.06, hw - 0.12, d / 2 - 0.16, 0.44, 0.52);
  }
  function dchair(b, o, wood, seat) {                  /* 餐椅 / 书桌椅 */
    [-1, 1].forEach(function (s) { [-1, 1].forEach(function (t) { post(b, wood, o, s * 0.2, t * 0.2, 0.02, 0, 0.45); }); });
    piece(b, seat || wood, o, 0, 0, 0.23, 0.23, 0.43, 0.49);
    [-1, 1].forEach(function (s) { piece(b, wood, o, s * 0.2, 0.21, 0.02, 0.02, 0.45, 0.98); });
    piece(b, wood, o, 0, 0.21, 0.2, 0.02, 0.78, 0.96); piece(b, wood, o, 0, 0.21, 0.2, 0.015, 0.6, 0.66);
  }
  function table(b, o, w, d, h, top, leg) {            /* 桌子：桌面 + 四腿（圆桌：w = d = 直径，用 round） */
    piece(b, top, o, 0, 0, w / 2, d / 2, h - 0.045, h);
    [-1, 1].forEach(function (s) { [-1, 1].forEach(function (t) { post(b, leg || top, o, s * (w / 2 - 0.08), t * (d / 2 - 0.08), 0.03, 0, h - 0.045); }); });
  }
  function roundTable(b, o, r, h, top) { b.cyl(top, o.x, o.y, o.z + h - 0.04, o.z + h, r, r, 20); b.cyl(top, o.x, o.y, o.z, o.z + h - 0.04, 0.05, 0.05, 8); b.cyl(top, o.x, o.y, o.z, o.z + 0.04, r * 0.45, r * 0.45, 14); }
  function bookcase(b, o, w, h, d, face) {             /* 书架：外框 + 正面一层书（贴图） */
    d = d || 0.34; var hw = w / 2;
    piece(b, 'woodMid', o, 0, 0, hw, d / 2, 0, 0.08); piece(b, 'woodMid', o, 0, 0, hw, d / 2, h - 0.05, h);
    [-1, 1].forEach(function (s) { piece(b, 'woodMid', o, s * (hw - 0.025), 0, 0.025, d / 2, 0, h); });
    piece(b, face || 'books', o, 0, 0.03, hw - 0.05, d / 2 - 0.03, 0.08, h - 0.05);
  }
  function lamp(b, x, y, z, jar) {                     /* 台灯：青花瓷罐灯座 + 灯罩 */
    b.cyl(jar || 'jarBlue', x, y, z, z + 0.3, 0.07, 0.1, 12); b.cyl('brass', x, y, z + 0.3, z + 0.42, 0.01, 0.01, 6); b.cyl('shade', x, y, z + 0.38, z + 0.6, 0.2, 0.13, 16);
  }
  function floorLamp(b, x, y, z) { b.cyl('brass', x, y, z, z + 0.03, 0.15, 0.15, 12); b.cyl('brass', x, y, z, z + 1.42, 0.015, 0.015, 6); b.cyl('shade', x, y, z + 1.32, z + 1.62, 0.24, 0.16, 16); }
  function chandelier(b, x, y, zc, mat, arms) {        /* 吊灯：吊杆 + 一圈烛台 */
    mat = mat || 'brass'; b.cyl(mat, x, y, zc - 0.55, zc, 0.012, 0.012, 6); b.cyl(mat, x, y, zc - 0.68, zc - 0.55, 0.05, 0.03, 10);
    for (var i = 0; i < (arms || 6); i++) {
      var a = i / (arms || 6) * 2 * PI, px = x + Math.cos(a) * 0.32, py = y + Math.sin(a) * 0.32;
      b.beam(mat, [x, y, zc - 0.64], [px, py, zc - 0.66], 0.025, 0.025); b.cyl(mat, px, py, zc - 0.67, zc - 0.63, 0.035, 0.03, 8); b.cyl('shade', px, py, zc - 0.63, zc - 0.5, 0.02, 0.02, 6);
    }
  }
  function pendant(b, x, y, zc, drop, r) { b.cyl('steel', x, y, zc - drop, zc, 0.006, 0.006, 4); b.cyl('paintWhite', x, y, zc - drop - 0.2, zc - drop, r || 0.22, 0.03, 18); }
  function rug(G, name, x0, y0, x1, y1, z) {           /* 地毯：一块平面，贴图 0..1 */
    var g = new THREE.PlaneGeometry(x1 - x0, y1 - y0), mesh = new THREE.Mesh(g, C.mats[name] || C.mats.floor);
    mesh.position.set((x0 + x1) / 2, (y0 + y1) / 2, z + 0.025); mesh.userData.mat = name; mesh.receiveShadow = true; mesh.name = 'rug:' + name; G.add(mesh);
  }
  function bed(b, o, w, L, cover, head, foot) {        /* 床：床架、床垫、被子盖过床尾、枕头、床头板 */
    var hw = w / 2;
    piece(b, foot || head, o, 0, 0, hw, L / 2, 0.08, 0.32);
    piece(b, 'fabLinen', o, 0, 0.05, hw - 0.03, L / 2 - 0.08, 0.32, 0.52);
    piece(b, cover, o, 0, -0.16, hw + 0.03, L / 2 - 0.25, 0.3, 0.56);
    [-1, 1].forEach(function (s) { piece(b, 'fabLinen', o, s * hw * 0.48, L / 2 - 0.27, hw * 0.42, 0.17, 0.52, 0.66); });
    piece(b, head, o, 0, L / 2 + 0.04, hw + 0.06, 0.05, 0.08, 1.3);
    if (foot) piece(b, foot, o, 0, -L / 2 - 0.03, hw + 0.04, 0.04, 0.08, 0.68);
  }
  function chest(b, o, w, h, mat) {                    /* 五斗柜：柜体 + 抽屉缝（深色细条） + 拉手 */
    piece(b, mat, o, 0, 0, w / 2, 0.24, 0.05, h);
    for (var i = 1; i < 4; i++) piece(b, 'woodDark', o, 0, -0.245, w / 2 - 0.04, 0.006, 0.05 + (h - 0.05) * i / 4 - 0.006, 0.05 + (h - 0.05) * i / 4 + 0.006);
    for (i = 0; i < 4; i++) [-1, 1].forEach(function (s) { piece(b, 'brass', o, s * w * 0.25, -0.25, 0.03, 0.01, 0.05 + (h - 0.05) * (i + 0.5) / 4 - 0.01, 0.05 + (h - 0.05) * (i + 0.5) / 4 + 0.01); });
  }
  function fireplace(b, x, y0, y1, face, z, dir) {      /* 铸铁壁炉：贴在烟囱垛正面（face = 墙面 X，dir = 朝房间 ±1），两侧青绿瓷砖、炉膛、木炉台 */
    var cy = (y0 + y1) / 2, hw = (y1 - y0) / 2, X = function (d) { return face + dir * d; };
    function bx(mat, d0, d1, ya, yb, za, zb) { b.box(mat, Math.min(X(d0), X(d1)), ya, z + za, Math.max(X(d0), X(d1)), yb, z + zb); }
    bx('ironBlack', 0, 0.06, cy - hw, cy + hw, 0, 1.1);
    bx('tileInset', 0.06, 0.07, cy - hw + 0.12, cy - hw + 0.3, 0.12, 0.9); bx('tileInset', 0.06, 0.07, cy + hw - 0.3, cy + hw - 0.12, 0.12, 0.9);
    bx('range', 0.06, 0.075, cy - 0.28, cy + 0.28, 0.12, 0.72);
    bx('woodDark', 0, 0.2, cy - hw - 0.06, cy + hw + 0.06, 1.1, 1.16);
    bx('stone', 0, 0.42, cy - hw - 0.08, cy + hw + 0.08, 0, 0.04);
  }
  function mirror(b, x, y0, y1, face, z0, z1, dir, frame) { var X = function (d) { return face + dir * d; }; b.box(frame || 'brass', Math.min(X(0), X(0.04)), y0, z0, Math.max(X(0), X(0.04)), y1, z1); b.box('mirror', Math.min(X(0.04), X(0.05)), y0 + 0.07, z0 + 0.07, Math.max(X(0.04), X(0.05)), y1 - 0.07, z1 - 0.07); }
  function curtains(b, x0, y0, x1, y1, z0, z1, fab) {  /* 窗帘：两片垂下的布（沿墙放在窗洞两侧） */
    b.box(fab, Math.min(x0, x1) - 0.06, Math.min(y0, y1) - 0.06, z0, Math.max(x0, x1) + 0.06, Math.max(y0, y1) + 0.06, z1);
  }
  function radiator(b, x0, y0, x1, y1, z) { var L = Math.max(x1 - x0, y1 - y0), n = Math.round(L / 0.07); for (var i = 0; i < n; i++) { var t = (i + 0.5) / n; if (x1 - x0 > y1 - y0) b.box('paintWhite', x0 + (x1 - x0) * t - 0.02, y0, z + 0.15, x0 + (x1 - x0) * t + 0.02, y1, z + 0.75); else b.box('paintWhite', x0, y0 + (y1 - y0) * t - 0.02, z + 0.15, x1, y0 + (y1 - y0) * t + 0.02, z + 0.75); } }
  function vase(b, x, y, z, s) { s = s || 1; b.cyl('ceramic', x, y, z, z + 0.22 * s, 0.05 * s, 0.08 * s, 10); for (var i = 0; i < 6; i++) { var a = i * 1.05; b.cyl(i % 2 ? 'bloom' : 'plant', x + Math.cos(a) * 0.07 * s, y + Math.sin(a) * 0.07 * s, z + 0.2 * s, z + 0.32 * s, 0.05 * s, 0.03 * s, 6); } }
  function plantPot(b, x, y, z, h) { b.cyl('woodMid', x, y, z, z + 0.3, 0.16, 0.2, 12); b.cyl('plant', x, y, z + 0.28, z + (h || 1.0), 0.32, 0.08, 10); }

  /* 画：画框（批量几何）+ 画布（单独一块平面，贴图 0..1）。axis = 所在墙面的法线轴 'x' / 'y'，face = 墙面坐标，dir = 朝房间 ±1 */
  function painting(b, G, name, axis, face, along, zc, w, h, dir, frame) {
    var n = axis === 'x' ? new THREE.Vector3(dir, 0, 0) : new THREE.Vector3(0, dir, 0), up = new THREE.Vector3(0, 0, 1), right = new THREE.Vector3().crossVectors(up, n);
    var c = axis === 'x' ? new THREE.Vector3(face, along, zc) : new THREE.Vector3(along, face, zc), fw = 0.06;
    function bx(u0, u1, v0, v1, d0, d1) { var A = c.clone().addScaledVector(right, u0).addScaledVector(up, v0).addScaledVector(n, d0), B = c.clone().addScaledVector(right, u1).addScaledVector(up, v1).addScaledVector(n, d1); b.box(frame || 'brass', Math.min(A.x, B.x), Math.min(A.y, B.y), Math.min(A.z, B.z), Math.max(A.x, B.x), Math.max(A.y, B.y), Math.max(A.z, B.z)); }
    bx(-w / 2 - fw, w / 2 + fw, h / 2, h / 2 + fw, 0, 0.05); bx(-w / 2 - fw, w / 2 + fw, -h / 2 - fw, -h / 2, 0, 0.05);
    bx(-w / 2 - fw, -w / 2, -h / 2, h / 2, 0, 0.05); bx(w / 2, w / 2 + fw, -h / 2, h / 2, 0, 0.05);
    var mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), C.mats[name] || C.mats.inner);
    mesh.position.copy(c).addScaledVector(n, 0.02); mesh.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(right, up, n));
    mesh.userData.mat = name; mesh.name = 'art:' + name; mesh.receiveShadow = true; G.add(mesh);
  }
  /* 门扇：白色四格面板门、铜把手，开着贴向墙（side = 往墙哪一侧开，ang = 开的角度） */
  function doorLeaf(b, w, s, z, side, ang) {
    var dx = w.b[0] - w.a[0], dy = w.b[1] - w.a[1], L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, nx = -uy * side, ny = ux * side, dw = P.doorW, dh = P.doorH - 0.02;
    var hx = w.a[0] + ux * (s - dw / 2) + nx * w.t / 2, hy = w.a[1] + uy * (s - dw / 2) + ny * w.t / 2, a = (ang == null ? 82 : ang) * PI / 180;
    var ex = ux * Math.cos(a) + nx * Math.sin(a), ey = uy * Math.cos(a) + ny * Math.sin(a), rot = Math.atan2(ey, ex), lw = dw - 0.03;
    function at2(l, off) { return [hx + ex * l - ey * off, hy + ey * l + ex * off]; }
    var c0 = at2(lw / 2, 0); b.obox('paintWhite', c0[0], c0[1], lw / 2, 0.02, rot, z, z + dh);
    [[0.27, 0.55], [0.27, 1.55]].forEach(function (q) { [-1, 1].forEach(function (k) { [0.22, 0.56].forEach(function (u) { var p = at2(lw * u + 0.03, k * 0.021); b.obox('paintCream', p[0], p[1], lw * 0.15, 0.004, rot, z + q[1] - 0.38, z + q[1] + 0.38); }); }); });
    var kn = at2(lw - 0.07, 0); b.obox('brass', kn[0], kn[1], 0.025, 0.045, rot, z + 0.95, z + 1.0);
  }
  /* 真实灯光：每个吊灯 / 台灯一个暖色点光源。walk = 外景进门动画会经过的那几盏（外景里只放这几盏，别的不建，省性能） */
  C.lamps = [];
  function lampLight(G, x, y, z, I, dist, walk) {
    if (C.lampMode === 'walk' && !walk) return;
    var l = new THREE.PointLight(0xffc77d, I * 2.6, dist * 1.2, 1.5); l.position.set(x, y, z); l.castShadow = false; l.name = 'lamp'; G.add(l); C.lamps.push({ light: l, base: l.intensity, walk: !!walk });
  }
  C.setLampLevel = function (k) { C.lamps.forEach(function (o) { o.light.intensity = o.base * k; }); };

  C.buildFurnishings = function (G) {
    C.lamps = [];
    var K = C.Kit, F1 = P.floor1Z, F2 = P.floor2Z, W = P.mainHalfW, X0 = -W + P.wallExt, X1 = W - P.wallExt, YF = P.wallExt, YR = P.mainDepth - P.wallExt;
    var g0 = new K.Batch(), g1 = new K.Batch(), g2 = new K.Batch(), gk = new K.Batch(), gs = new K.Batch();
    var z0 = 0.02, z1 = F1 + 0.02, z2 = F2 + 0.02, c0 = F1 - P.slabT, c1 = F2 - P.slabT;

    /* ============ 一楼 ============ */
    /* 大厅（手册第 9 页）：楼梯红底条纹地毯、门垫、靠墙小桌和花、白色暖气片、吊灯 */
    var r = P.floor1Z / P.stairRise1, g = (P.stairY0 - P.stairYF) / 8, rx0 = P.stairXE + 0.1, rx1 = P.stairXN - 0.1;
    for (var i = 1; i <= 8; i++) { var h = i * r, ya = P.stairY0 - i * g, yb = P.stairY0 - (i - 1) * g; g0.box('runner', rx0, ya, h, rx1, yb, h + 0.012); g0.box('runner', rx0, yb - 0.012, h - r, rx1, yb, h); }
    g0.box('fabRed', -0.45, 0.42, z0, 0.45, 1.0, z0 + 0.015);                          /* 门垫 */
    table(g0, O(-0.72, 3.25, PI / 2, z0), 0.9, 0.36, 0.8, 'woodMid'); vase(g0, -0.72, 3.25, z0 + 0.8, 1.3);
    radiator(g0, -0.9, 0.7, -0.82, 1.5, z0);
    pendant(g0, -0.45, 1.9, c0, 0.5, 0.18);

    /* 客厅 Drawing Room（第 6 页）：红色波斯地毯、两张米色沙发配青绿和红靠垫、凸窗里的青绿贵妃椅、翼背椅、
       黑色铸铁壁炉配青绿瓷砖和金框镜子、壁炉旁的书架、衣柜、水晶吊灯、凸窗花布窗帘 */
    rug(G.ground, 'rugRed', -4.85, 1.35, -2.05, 5.0, 0);
    g0.box('tileInset', X0 + 0.47, 2.95, z0 + 0.12, X0 + 0.48, 3.15, z0 + 1.1); g0.box('tileInset', X0 + 0.47, 3.95, z0 + 0.12, X0 + 0.48, 4.15, z0 + 1.1);   /* 原有石壁炉两侧的青绿瓷砖 */
    mirror(g0, 0, 3.0, 4.1, X0 + 0.4, z0 + 1.3, z0 + 2.35, 1);
    sofa(g0, O(-1.75, 3.6, -PI / 2, z0), 2.1, 'fabCream', ['fabTeal', 'fabRed', 'fabTeal']);
    sofa(g0, O(-3.45, 5.75, 0, z0), 1.9, 'fabCream', ['fabRed', 'fabTeal']);
    var ch = O(-3.42, -0.45, PI, z0); piece(g0, 'fabTeal', ch, 0, 0, 0.8, 0.3, 0.12, 0.42); piece(g0, 'fabTeal', ch, -0.68, 0, 0.12, 0.3, 0.42, 0.8); [-1, 1].forEach(function (s) { [-1, 1].forEach(function (t) { post(g0, 'woodDark', ch, s * 0.72, t * 0.24, 0.02, 0, 0.12); }); });
    chair(g0, O(-4.55, 1.85, -PI * 0.78, z0), 'fabCream', true);
    table(g0, O(-3.45, 3.6, 0, z0), 1.1, 0.6, 0.42, 'woodDark');
    bookcase(g0, O(X0 + 0.19, 1.55, PI / 2, z0), 1.6, 2.2);
    var ar = O(-1.5, 5.8, -PI / 2, z0); piece(g0, 'woodLight', ar, 0, 0, 0.55, 0.3, 0.08, 2.05); piece(g0, 'woodLight', ar, 0, 0, 0.6, 0.33, 2.05, 2.15); piece(g0, 'woodDark', ar, 0, -0.305, 0.006, 0.006, 0.2, 1.95);
    floorLamp(g0, -1.55, 2.35, z0); lamp(g0, -4.55, 5.75, z0 + 0.6); table(g0, O(-4.55, 5.75, 0, z0), 0.45, 0.45, 0.6, 'woodMid');
    chandelier(g0, -3.42, 3.4, c0);
    curtains(g0, -4.7, 0.28, -4.6, 0.38, z0 + 0.1, c0 - 0.1, 'fabFloral'); curtains(g0, -2.24, 0.28, -2.14, 0.38, z0 + 0.1, c0 - 0.1, 'fabFloral');

    /* 餐厅 Dining Room（第 9 页）：长木餐桌、六把椅子、吊灯、深色雕花柜、米色餐具柜、地毯、凸窗窗帘 */
    rug(G.ground, 'rugBlue', 2.75, 0.9, 4.75, 3.4, 0);
    table(g0, O(3.76, 2.15, 0, z0), 1.05, 2.0, 0.76, 'woodMid', 'woodDark');
    [1.65, 2.65].forEach(function (y) { dchair(g0, O(2.98, y, PI / 2, z0), 'woodMid', 'fabCheck'); dchair(g0, O(4.54, y, -PI / 2, z0), 'woodMid', 'fabCheck'); });
    dchair(g0, O(3.76, 0.92, PI, z0), 'woodMid', 'fabCheck'); dchair(g0, O(3.76, 3.38, 0, z0), 'woodMid', 'fabCheck');
    chandelier(g0, 3.76, 2.15, c0, 'brass', 5);
    var cab = O(2.45, 3.6, PI, z0); piece(g0, 'woodDark', cab, 0, 0, 0.55, 0.22, 0.05, 1.95); for (i = 0; i < 4; i++) piece(g0, 'woodMid', cab, -0.4 + i * 0.27, -0.225, 0.008, 0.005, 0.2, 1.8);
    for (i = 0; i < 5; i++) piece(g0, 'woodMid', cab, 0, -0.225, 0.5, 0.005, 0.25 + i * 0.36, 0.26 + i * 0.36);
    chest(g0, O(X1 - 0.26, 2.1, -PI / 2, z0), 1.4, 0.9, 'paintCream'); vase(g0, X1 - 0.26, 2.1, z0 + 0.9);
    curtains(g0, 2.42, 0.28, 2.52, 0.38, z0 + 0.1, c0 - 0.1, 'fabFloral'); curtains(g0, 5.0, 0.28, 5.1, 0.38, z0 + 0.1, c0 - 0.1, 'fabFloral');

    /* 小起居室 Snug（第 9 页 + 第 7 页）：窗两侧书架、两把红扶手椅、地毯、落地灯；一整面蓝白小房子收藏架 */
    rug(G.ground, 'rugGreen', 2.4, 4.4, 4.9, 6.1, 0);
    bookcase(g0, O(2.75, YR - 0.18, 0, z0), 1.0, 2.2); bookcase(g0, O(5.25, YR - 0.18, 0, z0), 0.9, 2.2);
    chair(g0, O(3.35, 4.75, PI * 0.82, z0), 'fabRed'); chair(g0, O(4.6, 4.75, -PI * 0.82, z0), 'fabRed');
    table(g0, O(3.97, 4.55, 0, z0), 0.42, 0.42, 0.5, 'woodDark'); lamp(g0, 3.97, 4.55, z0 + 0.5);
    bookcase(g0, O(1.45, 5.55, PI / 2, z0), 1.4, 2.25, 0.3, 'delft');
    floorLamp(g0, 5.4, 4.4, z0);
    /* 卫生间：马桶、洗手盆 */
    g0.cyl('ceramic', 0.6, 6.15, z0, z0 + 0.4, 0.17, 0.2, 14); g0.box('ceramic', 0.38, 6.3, z0 + 0.4, 0.82, 6.44, z0 + 0.8);
    g0.box('ceramic', -0.92, 5.4, z0 + 0.78, -0.5, 5.9, z0 + 0.88); g0.cyl('ceramic', -0.72, 5.65, z0, z0 + 0.78, 0.08, 0.06, 8); mirror(g0, 0, 5.4, 5.9, -0.92, z0 + 1.1, z0 + 1.7, 1, 'paintWhite');

    /* ============ 厨房扩建（第 4–5 页）：奶白高光无把手柜、长岛台（石英台面、水槽、灶）、黑色炉灶嵌在灶台凹位、
       三盏白色吊灯、高柜里的嵌入式烤箱、后面玻璃凸间里的 L 形卡座和餐桌、灰色大地砖 ============ */
    var kx0 = W + 0.02, kx1 = P.kitX1 - 0.3, ky0 = P.kitY0 + 0.3, ky1 = P.kitY1 - 0.02;
    gk.box('ktile', kx0, ky0, 0.02, kx1, ky1, 0.03);
    gk.box('ktile', P.kitRearBayX0 + 0.25, ky1, 0.02, P.kitRearBayX1 - 0.25, P.kitY1 + P.kitRearBayProj - 0.25, 0.03);
    gk.box('gloss', kx0, 2.9, 0.03, kx0 + 0.62, 5.6, 2.25);                              /* 西墙高柜 */
    for (i = 0; i < 5; i++) gk.box('quartz', kx0 + 0.62, 2.9 + i * 0.54 - 0.004, 0.05, kx0 + 0.625, 2.9 + i * 0.54 + 0.004, 2.22);
    gk.box('ovenGlass', kx0 + 0.62, 3.0, 0.9, kx0 + 0.63, 3.4, 1.5); gk.box('ovenGlass', kx0 + 0.62, 3.0, 1.55, kx0 + 0.63, 3.4, 1.9);
    [[1.4, 3.0], [4.2, 5.9]].forEach(function (q) { gk.box('gloss', kx1 - 0.62, q[0], 0.03, kx1, q[1], 0.88); gk.box('quartz', kx1 - 0.65, q[0], 0.88, kx1, q[1], 0.92); });   /* 北墙地柜 + 台面（中间留给炉灶） */
    gk.box('paintCream', kx1 - 0.25, 3.0, 0.92, kx1, 4.2, 2.3);                            /* 炉灶凹位的墙垛 */
    gk.box('range', kx1 - 0.7, 3.05, 0.03, kx1 - 0.08, 4.15, 0.92);                       /* 黑色炉灶 */
    for (i = 0; i < 2; i++) for (var k = 0; k < 2; k++) { gk.box('steel', kx1 - 0.71, 3.12 + k * 0.52, 0.3 + i * 0.32 + 0.12, kx1 - 0.7, 3.6 + k * 0.52, 0.3 + i * 0.32 + 0.14); }
    gk.box('steel', kx1 - 0.72, 3.05, 0.82, kx1 - 0.7, 4.15, 0.84);
    gk.cyl('range', kx1 - 0.35, 3.6, 0.92, 2.3, 0.07, 0.07, 10);                         /* 黑色烟管 */
    gk.box('paintCream', kx1 - 0.62, 1.4, 1.45, kx1, 2.9, 2.2); gk.box('paintCream', kx1 - 0.62, 4.3, 1.45, kx1, 5.9, 2.2);   /* 吊柜 */
    var ix = 8.25; gk.box('gloss', ix - 0.5, 2.1, 0.03, ix + 0.5, 5.0, 0.88); gk.box('quartz', ix - 0.6, 2.0, 0.88, ix + 0.6, 5.1, 0.93);   /* 岛台 */
    gk.box('range', ix - 0.25, 2.35, 0.925, ix + 0.25, 2.85, 0.935); gk.box('steel', ix + 0.05, 2.5, 0.93, ix + 0.08, 2.53, 1.3); gk.beam('steel', [ix + 0.065, 2.515, 1.3], [ix + 0.065, 2.72, 1.24], 0.025, 0.025);   /* 水槽、龙头 */
    gk.box('range', ix - 0.3, 3.6, 0.93, ix + 0.3, 4.15, 0.94);                           /* 电磁灶 */
    [2.6, 3.55, 4.5].forEach(function (y) { pendant(gk, ix, y, 2.3, 0.4, 0.2); });
    [3.2, 3.9, 4.6].forEach(function (y) { dchair(gk, O(ix - 0.85, y, PI / 2, 0.03), 'paintWhite', 'fabCream'); });
    var bx0 = P.kitRearBayX0 + 0.3, bx1 = P.kitRearBayX1 - 0.3, by1 = P.kitY1 + P.kitRearBayProj - 0.3;
    gk.box('fabCream', bx0, by1 - 0.5, 0.03, bx1, by1, 0.45); gk.box('fabCream', bx0, by1 - 0.1, 0.45, bx1, by1, 0.9);   /* L 形卡座 */
    gk.box('fabCream', bx0, P.kitY1 + 0.05, 0.03, bx0 + 0.5, by1, 0.45); gk.box('fabCream', bx0, P.kitY1 + 0.05, 0.45, bx0 + 0.1, by1, 0.9);
    table(gk, O((bx0 + bx1) / 2 + 0.2, by1 - 0.95, 0, 0.03), 1.2, 0.75, 0.74, 'quartz', 'paintWhite');
    pendant(gk, (bx0 + bx1) / 2 + 0.2, by1 - 0.95, 2.4, 0.6, 0.18);

    /* ============ 阳光房（第 8 页）：两张白底绿花沙发、圆桌摆照片和台灯、扶手椅、黑铁吊灯、绿植、米色地砖 ============ */
    var sx0 = P.sunX0 + 0.25, sx1 = P.sunX1 - 0.25, sy0 = P.mainDepth, sy1 = P.mainDepth + P.sunProj - 0.25;
    gs.box('stile', sx0, sy0, 0.02, sx1, sy1, 0.03);
    rug(G.sunroom, 'rugGreen', -4.6, 7.6, -2.3, 9.6, 0.01);
    sofa(gs, O(-3.4, sy1 - 0.55, 0, 0.03), 2.0, 'fabFloral', ['fabFloral', 'fabCream']);
    sofa(gs, O(sx0 + 0.5, 8.55, PI / 2, 0.03), 1.8, 'fabFloral', ['fabCream']);
    roundTable(gs, O(sx0 + 0.45, sy1 - 0.45, 0, 0.03), 0.38, 0.7, 'paintWhite'); lamp(gs, sx0 + 0.45, sy1 - 0.45, 0.73, 'ceramic');
    for (i = 0; i < 3; i++) gs.box('woodDark', sx0 + 0.25 + i * 0.13, sy1 - 0.72, 0.73, sx0 + 0.33 + i * 0.13, sy1 - 0.7, 0.88);
    chair(gs, O(sx1 - 0.6, sy1 - 0.7, -PI * 0.72, 0.03), 'fabCream');
    table(gs, O(-3.4, 8.4, 0, 0.03), 0.9, 0.5, 0.42, 'woodLight');
    chandelier(gs, -3.45, 8.6, 2.55, 'ironBlack', 6);
    plantPot(gs, sx1 - 0.35, sy0 + 0.45, 0.03, 1.1);

    /* ============ 二楼 ============ */
    /* 卧室 1（第 10 页，北侧前间）：华盖床（蓝白 toile 帷幔）、蓝白被、格纹床尾凳、五斗柜、吊灯、凸窗窗帘、格纹扶手椅 */
    g1.box('carpet', 1.82, YF, F1 + 0.02, X1, 3.82, F1 + 0.03);
    var b1 = O(X1 - 1.15, 2.1, -PI / 2, z1); bed(g1, b1, 1.6, 2.1, 'fabToile', 'fabToile', 'paintWhite');
    g1.box('brass', X1 - 0.18, 1.75, z1 + 2.15, X1, 2.45, z1 + 2.22);                     /* 华盖：墙上的金色冠 + 两侧帷幔 */
    [[1.5, 1.72], [2.48, 2.7]].forEach(function (q) { g1.beam('fabToile', [X1 - 0.12, (q[0] + q[1]) / 2, z1 + 2.15], [X1 - 0.5, q[0] < 2 ? q[0] - 0.15 : q[1] + 0.15, z1 + 0.6], 0.25, 0.04); });
    g1.box('fabToile', X1 - 0.2, 1.72, z1 + 1.3, X1 - 0.02, 2.48, z1 + 2.15);
    var ot = O(X1 - 2.42, 2.1, -PI / 2, z1); piece(g1, 'fabCheck', ot, 0, 0, 0.6, 0.22, 0.1, 0.45);
    chest(g1, O(2.6, 3.55, 0, z1), 1.0, 0.95, 'paintCream'); lamp(g1, 2.35, 3.55, z1 + 0.95);
    [[X1 - 0.3, 0.95], [X1 - 0.3, 3.25]].forEach(function (q) { table(g1, O(q[0], q[1], -PI / 2, z1), 0.45, 0.4, 0.62, 'paintWhite'); lamp(g1, q[0], q[1], z1 + 0.62); });
    chair(g1, O(2.35, 1.05, PI * 0.75, z1), 'fabCheck');
    chandelier(g1, 3.76, 2.1, c1, 'brass', 5);
    curtains(g1, 2.42, 0.28, 2.52, 0.38, z1 + 0.1, c1 - 0.15, 'fabToile'); curtains(g1, 5.0, 0.28, 5.1, 0.38, z1 + 0.1, c1 - 0.15, 'fabToile');

    /* 卧室 2（第 13、15 页，南侧前间）：白色床头的床、两张床头柜配青花瓷台灯、凸窗窗座配粉色靠垫、梳妆台和椭圆镜、花布扶手椅 */
    g1.box('carpet', X0, YF, F1 + 0.02, -1.02, 3.31, F1 + 0.03);
    var b2 = O(X0 + 1.1, 1.85, PI / 2, z1); bed(g1, b2, 1.5, 2.05, 'fabBlue', 'paintWhite', 'paintWhite');
    [[X0 + 0.25, 0.85], [X0 + 0.25, 2.85]].forEach(function (q) { table(g1, O(q[0], q[1], PI / 2, z1), 0.45, 0.4, 0.62, 'paintWhite'); lamp(g1, q[0], q[1], z1 + 0.62); });
    var ws = O(-3.42, -0.75, PI, z1); piece(g1, 'paintCream', ws, 0, 0, 0.75, 0.22, 0, 0.46); piece(g1, 'fabPink', ws, 0, 0, 0.72, 0.2, 0.46, 0.52);
    [-0.45, 0, 0.45].forEach(function (lx) { piece(g1, 'fabPink', ws, lx, 0.12, 0.17, 0.06, 0.52, 0.8); });
    table(g1, O(-1.32, 1.1, -PI / 2, z1), 1.0, 0.45, 0.76, 'paintWhite'); mirror(g1, 0, 0.82, 1.38, -1.1, z1 + 1.0, z1 + 1.65, -1, 'brass');
    chair(g1, O(-2.0, 2.6, PI * 0.8, z1), 'fabFloral');
    pendant(g1, -3.42, 1.8, c1, 0.35, 0.16);

    /* 书房（平面图 STUDY，南侧后间；走进门的终点）：窗前书桌和皮椅、绿罩台灯、两排书架靠前墙、皮扶手椅、地球仪、地毯 */
    rug(G.first, 'rugRed', -4.9, 4.0, -2.2, 6.1, F1);
    table(g1, O(X0 + 0.55, 5.4, PI / 2, z1), 1.5, 0.75, 0.76, 'woodDark');
    dchair(g1, O(X0 + 1.25, 5.4, PI / 2, z1), 'woodDark', 'leather');
    g1.cyl('brass', X0 + 0.45, 4.95, z1 + 0.76, z1 + 1.08, 0.012, 0.012, 6); g1.box('leatherGreen', X0 + 0.38, 4.85, z1 + 1.04, X0 + 0.52, 5.1, z1 + 1.12);   /* 绿罩台灯 */
    g1.box('fabLinen', X0 + 0.55, 5.6, z1 + 0.76, X0 + 0.8, 5.85, z1 + 0.79);
    [-4.95, -3.85, -2.75].forEach(function (x) { bookcase(g1, O(x, 3.75, PI, z1), 1.05, 2.25); });
    chair(g1, O(-1.75, 5.6, -PI * 0.7, z1), 'leather');
    g1.cyl('woodDark', -2.55, 6.15, z1, z1 + 0.6, 0.03, 0.05, 8); g1.geom('jarBlue', new THREE.SphereGeometry(0.17, 14, 10), new THREE.Matrix4().makeTranslation(-2.55, 6.15, z1 + 0.78));   /* 地球仪 */
    floorLamp(g1, -1.45, 6.1, z1);

    /* 浴室（二楼中间后面）：浴缸、洗手台、镜子 */
    g1.box('ceramic', -0.75, YR - 0.75, z1, 1.0, YR, z1 + 0.58); g1.box('mirror', -0.6, YR - 0.62, z1 + 0.56, 0.85, YR - 0.13, z1 + 0.585);
    /* 主卫（第 14 页）：深蓝洗手柜配大理石台面、马桶、镜子 */
    g1.box('paintNavy', X1 - 0.55, 4.4, z1, X1, 5.6, z1 + 0.82); g1.box('quartz', X1 - 0.58, 4.38, z1 + 0.82, X1, 5.62, z1 + 0.86); g1.cyl('ceramic', X1 - 0.3, 5.0, z1 + 0.86, z1 + 0.9, 0.17, 0.17, 14);
    mirror(g1, 0, 4.55, 5.45, X1, z1 + 1.1, z1 + 1.8, -1, 'paintWhite');
    g1.cyl('ceramic', 3.6, YR - 0.3, z1, z1 + 0.4, 0.17, 0.2, 14); g1.box('ceramic', 3.38, YR - 0.15, z1 + 0.4, 3.82, YR, z1 + 0.8);

    /* ============ 阁楼（第 11–12 页）：斜顶下的卧室——软包床头的床、小铸铁壁炉、五斗柜；儿童房的婴儿床和摇摇马 ============ */
    var k0 = P.kneeY0, k1 = P.kneeY1;
    g2.box('carpet', X0, k0, F2 + 0.02, -0.99, k1, F2 + 0.03); g2.box('carpetBlue', 1.79, k0, F2 + 0.02, X1, k1, F2 + 0.03);
    bed(g2, O(-3.1, k1 - 1.4, 0, z2), 1.5, 2.0, 'fabLinen', 'fabFloral', null);
    [[-4.1, k1 - 0.55], [-2.1, k1 - 0.55]].forEach(function (q) { table(g2, O(q[0], q[1], 0, z2), 0.42, 0.38, 0.55, 'paintCream'); lamp(g2, q[0], q[1], z2 + 0.55, 'ceramic'); });
    fireplace(g2, X0 + 0.38, 3.1, 4.0, X0 + 0.38, z2, 1);
    chest(g2, O(-1.4, k0 + 0.3, PI, z2), 0.9, 0.85, 'paintCream');
    pendant(g2, -3.1, 3.5, F2 + P.atticCeil, 0.3, 0.16);
    var cot = O(4.4, k1 - 0.55, 0, z2);                                                     /* 婴儿床：白色栏杆 */
    piece(g2, 'paintWhite', cot, 0, 0, 0.62, 0.34, 0.3, 0.36); piece(g2, 'fabLinen', cot, 0, 0, 0.58, 0.3, 0.36, 0.44);
    for (i = 0; i <= 12; i++) [-1, 1].forEach(function (s) { post(g2, 'paintWhite', cot, -0.6 + i * 0.1, s * 0.32, 0.012, 0, 0.92); });
    [-1, 1].forEach(function (s) { piece(g2, 'paintWhite', cot, 0, s * 0.32, 0.64, 0.02, 0.9, 0.95); piece(g2, 'paintWhite', cot, s * 0.62, 0, 0.02, 0.34, 0, 0.95); });
    var rh = O(2.8, 3.0, PI / 2, z2);                                                       /* 摇摇马：白底花斑马身、红鞍、弧形摇杆 */
    piece(g2, 'paintWhite', rh, 0, 0, 0.14, 0.38, 0.5, 0.75); piece(g2, 'paintWhite', rh, 0, -0.42, 0.09, 0.12, 0.7, 1.0); piece(g2, 'paintWhite', rh, 0, -0.55, 0.07, 0.12, 0.85, 0.98);
    piece(g2, 'fabRed', rh, 0, 0.02, 0.16, 0.14, 0.74, 0.78); piece(g2, 'woodDark', rh, 0, -0.35, 0.03, 0.12, 0.98, 1.06);
    [-1, 1].forEach(function (s) { [-1, 1].forEach(function (t) { var a = at(rh, s * 0.1, t * 0.28); g2.beam('woodLight', [a[0], a[1], z2 + 0.52], [a[0], a[1], z2 + 0.12], 0.04, 0.04); });
      var p0 = at(rh, s * 0.12, -0.62), p1 = at(rh, s * 0.12, 0), p2 = at(rh, s * 0.12, 0.62); g2.beam('woodMid', [p0[0], p0[1], z2 + 0.16], [p1[0], p1[1], z2 + 0.04], 0.05, 0.05); g2.beam('woodMid', [p1[0], p1[1], z2 + 0.04], [p2[0], p2[1], z2 + 0.16], 0.05, 0.05); });
    chest(g2, O(X1 - 0.3, 2.6, -PI / 2, z2), 0.9, 0.8, 'paintWhite');

    /* ============ 门扇：平面图上每个室内门洞一扇（一楼、二楼、阁楼），开着贴墙，门洞照样能走 ============ */
    var SIDE = { '0:0:0': -1, '0:1:0': 1, '0:2:0': -1, '0:3:0': 1, '0:4:0': -1, '1:0:0': -1, '1:0:1': -1, '1:1:0': 1, '1:3:0': -1, '1:4:0': -1, '2:0:0': -1, '2:1:0': 1, '2:12:0': -1 };
    [[0, g0, z0], [1, g1, z1], [2, g2, z2]].forEach(function (f) {
      (C.interiorWalls ? C.interiorWalls(f[0]) : []).forEach(function (w, wi) { (w.d || []).forEach(function (c, di) { doorLeaf(f[1], w, C.wallAlong(w, c), f[2], SIDE[f[0] + ':' + wi + ':' + di] || 1); }); });
    });

    /* ============ 墙上的画（手册第 6、9、13、15 页都能看到墙上挂着画） ============ */
    painting(g0, G.ground, 'artLand', 'x', -1.175, 3.6, z0 + 1.75, 1.1, 0.72, -1);          /* 客厅：沙发上方风景 */
    painting(g0, G.ground, 'artFlower', 'y', YR, -3.45, z0 + 1.72, 0.85, 0.6, -1);          /* 客厅：后墙静物花 */
    painting(g0, G.ground, 'artPortrait', 'x', -0.92, 1.1, z0 + 1.6, 0.48, 0.62, 1, 'woodDark');   /* 大厅：暖气片上方肖像 */
    painting(g0, G.ground, 'artSea', 'y', 3.865, 4.6, z0 + 1.6, 1.0, 0.68, -1);             /* 餐厅：海景 */
    painting(g0, G.ground, 'artPortrait', 'x', X1, 5.3, z0 + 1.6, 0.6, 0.78, -1, 'woodDark');   /* 小起居室 */
    painting(g1, G.first, 'artSea', 'x', X0, 1.85, z1 + 1.75, 0.8, 0.55, 1);                /* 卧室 2：床头上方的海景（第 13 页） */
    painting(g1, G.first, 'artFlower', 'y', 3.825, 2.6, z1 + 1.65, 0.7, 0.5, -1);           /* 卧室 1：五斗柜上方 */
    painting(g1, G.first, 'artLand', 'y', YR, -2.75, z1 + 1.55, 0.75, 0.55, -1, 'woodDark');   /* 书房：两扇后窗之间 */
    painting(g2, G.attic, 'artLand', 'x', X0 + 0.38, 3.55, z2 + 1.45, 0.45, 0.34, 1);       /* 阁楼：壁炉上方 */

    /* ============ 灯：吊灯、台灯、落地灯的位置各放一盏暖色点光源 ============ */
    pendant(g1, 0.0, 2.0, c1, 0.45, 0.16);                                                   /* 二楼平台补一盏吊灯（楼梯上方） */
    pendant(g2, 3.8, 3.0, F2 + P.atticCeil, 0.3, 0.16);                                        /* 儿童房吊灯 */
    lampLight(G.ground, -3.42, 3.4, c0 - 0.8, 1.1, 7); lampLight(G.ground, -1.55, 2.35, z0 + 1.45, 0.5, 3.5); lampLight(G.ground, -4.55, 5.75, z0 + 1.05, 0.4, 3);
    lampLight(G.ground, -0.45, 1.9, c0 - 0.8, 0.9, 5, true);
    lampLight(G.ground, 3.76, 2.15, c0 - 0.8, 1.0, 6); lampLight(G.ground, 3.97, 4.55, z0 + 1.0, 0.6, 4);
    lampLight(G.kitchen, 8.25, 3.55, 1.75, 1.2, 6); lampLight(G.kitchen, 8.7, 7.9, 1.7, 0.6, 4); lampLight(G.sunroom, -3.45, 8.6, 1.9, 0.9, 6);
    lampLight(G.first, 0.0, 2.0, c1 - 0.75, 0.8, 5, true);
    lampLight(G.first, 3.76, 2.1, c1 - 0.8, 1.0, 6); lampLight(G.first, -3.42, 1.8, c1 - 0.65, 0.8, 5);
    lampLight(G.first, X0 + 0.45, 4.95, z1 + 1.0, 0.7, 4, true); lampLight(G.first, -1.45, 6.1, z1 + 1.5, 0.6, 4, true);
    lampLight(G.attic, -3.1, 3.5, F2 + 1.85, 0.7, 5); lampLight(G.attic, 3.8, 3.0, F2 + 1.85, 0.6, 5);

    g0.build(G.ground, C.mats); g1.build(G.first, C.mats); g2.build(G.attic, C.mats); gk.build(G.kitchen, C.mats); gs.build(G.sunroom, C.mats);
  };
})();
