/* Clun · 内饰：复刻原屋主的家具和软装。依据是房产手册（09_Original_Documents/7-South-Drive-Magazine.pdf）第 4–15 页的房间照片：
   每件家具按照片里的样子做（造型、布料花色、颜色、摆放位置），布料和地毯是 canvas 画的花样；尺寸是常见家具尺寸，全部 ESTIMATED。
   房间位置按平面图（手册第 21 页）。书房、卫生间、浴室没有照片，按同一户人家的风格布置。
   坐标：工程坐标 X 北、Y 进深（正面 0 → 背面）、Z 上；每层的东西放进该层的图层组（关图层 / 剖切时一起走）。
   材质按名字取（C.mats）；白模里家具也保留本色（model.js 把这些材质合进两种模式）。 */
(function () {
  'use strict';
  var C = window.Clun = window.Clun || {}, P = C.P, PI = Math.PI;

  /* ================= 贴图 ================= */
  function cv(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function tex(c, pw, ph) { var t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.encoding = THREE.sRGBEncoding; t.anisotropy = 4; t.repeat.set(1 / pw, 1 / (ph || pw)); return t; }
  function once(c) { var t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 4; return t; }
  var seed = 11; function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
  function blob(g, x, y, r, col, petals) {          /* 一朵花：一圈花瓣 + 花心 */
    g.fillStyle = col; for (var k = 0; k < petals; k++) { var a = k / petals * 6.283 + x; g.beginPath(); g.ellipse(x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.55, r * 0.55, r * 0.38, a, 0, 6.283); g.fill(); }
    g.fillStyle = 'rgba(0,0,0,0.12)'; g.beginPath(); g.arc(x, y, r * 0.3, 0, 6.283); g.fill();
  }
  function leaf(g, x, y, r, a, col) { g.fillStyle = col; g.beginPath(); g.ellipse(x, y, r, r * 0.36, a, 0, 6.283); g.fill(); }
  /* 印花布：bg 底色，blooms = [[颜色, 大小], …]，leaves 叶色，n 朵数，pw 一个花样多少米 */
  function floral(bg, blooms, leaves, n, pw, stems) {
    var c = cv(256, 256), g = c.getContext('2d'), i; g.fillStyle = bg; g.fillRect(0, 0, 256, 256);
    for (i = 0; i < n; i++) {
      var x = rnd() * 256, y = rnd() * 256, b = blooms[i % blooms.length], r = b[1] * (0.75 + rnd() * 0.5);
      if (stems) { g.strokeStyle = leaves; g.lineWidth = 2; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 20, y + 30, x + 5, y + 60); g.stroke(); }
      for (var k = 0; k < 3; k++) leaf(g, x + Math.cos(k * 2.1 + i) * r * 1.3, y + Math.sin(k * 2.1 + i) * r * 1.3, r * 0.9, k * 2.1 + i, leaves);
      blob(g, x, y, r, b[0], 6);
      [[-256, 0], [256, 0], [0, -256], [0, 256]].forEach(function (o) { if ((o[0] && Math.abs(x + o[0] - 128) < 128 + r * 2) || (o[1] && Math.abs(y + o[1] - 128) < 128 + r * 2)) blob(g, x + o[0], y + o[1], r, b[0], 6); });
    }
    return tex(c, pw);
  }
  function check(c1, c2, pw, alpha) { var c = cv(64, 64), g = c.getContext('2d'); g.fillStyle = c1; g.fillRect(0, 0, 64, 64); g.fillStyle = c2; g.globalAlpha = alpha || 0.5; g.fillRect(0, 0, 32, 64); g.fillRect(0, 0, 64, 32); g.globalAlpha = 1; g.fillRect(0, 0, 32, 32); return tex(c, pw); }
  function stripes(bg, list, pw, vertical) {         /* list = [[位置 0..1, 宽 0..1, 颜色], …] */
    var c = cv(128, 128), g = c.getContext('2d'); g.fillStyle = bg; g.fillRect(0, 0, 128, 128);
    list.forEach(function (q) { g.fillStyle = q[2]; if (vertical) g.fillRect(q[0] * 128, 0, q[1] * 128, 128); else g.fillRect(0, q[0] * 128, 128, q[1] * 128); });
    return tex(c, pw);
  }
  function tartan(bg, bands, pw) {                    /* bands = [[位置, 宽, 颜色, 透明度]] 横竖各画一遍 */
    var c = cv(128, 128), g = c.getContext('2d'); g.fillStyle = bg; g.fillRect(0, 0, 128, 128);
    bands.forEach(function (q) { g.globalAlpha = q[3]; g.fillStyle = q[2]; g.fillRect(q[0] * 128, 0, q[1] * 128, 128); g.fillRect(0, q[0] * 128, 128, q[1] * 128); }); g.globalAlpha = 1;
    return tex(c, pw);
  }
  function toileRibbon() {                            /* 卧室 1（第 10 页）：米白底，蓝色缎带竖条，条间一束束蓝色花 */
    var c = cv(256, 256), g = c.getContext('2d'), i; g.fillStyle = '#f3ecdc'; g.fillRect(0, 0, 256, 256);
    for (i = 0; i < 2; i++) { var x = 20 + i * 128; g.fillStyle = '#5d79a8'; g.fillRect(x, 0, 14, 256); g.fillStyle = '#f3ecdc'; for (var y = 0; y < 256; y += 16) g.fillRect(x + 3, y, 8, 6); }
    for (i = 0; i < 4; i++) { var bx = 84 + (i % 2) * 128 - 64 * (i > 1), by = 50 + (i % 2) * 128 + Math.floor(i / 2) * 64; for (var k = 0; k < 7; k++) blob(g, bx + (rnd() - 0.5) * 30, by + (rnd() - 0.5) * 30, 7, '#34558f', 5); for (k = 0; k < 5; k++) leaf(g, bx + (rnd() - 0.5) * 40, by + (rnd() - 0.5) * 40, 8, rnd() * 3, '#5d79a8'); }
    return tex(c, 0.36);
  }
  function jarBW() {                                   /* 青花瓷：白底蓝花 */
    var c = cv(128, 128), g = c.getContext('2d'); g.fillStyle = '#f4f5f6'; g.fillRect(0, 0, 128, 128); g.strokeStyle = '#27458a'; g.lineWidth = 3;
    for (var i = 0; i < 6; i++) { var x = rnd() * 128, y = rnd() * 128; g.beginPath(); g.moveTo(x, y); g.bezierCurveTo(x + 20, y - 20, x + 30, y + 20, x + 50, y); g.stroke(); blob(g, x, y, 8, '#27458a', 5); }
    g.fillStyle = '#27458a'; g.fillRect(0, 0, 128, 8); g.fillRect(0, 120, 128, 8);
    return tex(c, 0.25, 0.25);
  }
  function delftTile() {                               /* 客厅壁炉两侧的蓝白代尔夫特瓷砖 */
    var c = cv(64, 64), g = c.getContext('2d'); g.fillStyle = '#f2f1ea'; g.fillRect(0, 0, 64, 64); g.strokeStyle = '#9aa3b0'; g.lineWidth = 2; g.strokeRect(1, 1, 62, 62);
    g.fillStyle = '#2e4f96'; g.beginPath(); for (var k = 0; k < 8; k++) { var a = k / 8 * 6.283; g.lineTo(32 + Math.cos(a) * (k % 2 ? 9 : 18), 32 + Math.sin(a) * (k % 2 ? 9 : 18)); } g.fill();
    [[6, 6], [58, 6], [6, 58], [58, 58]].forEach(function (p) { g.beginPath(); g.arc(p[0], p[1], 5, 0, 6.283); g.fill(); });
    return tex(c, 0.15);
  }
  function bamboo() { var c = cv(64, 64), g = c.getContext('2d'); g.fillStyle = '#e4d7b8'; g.fillRect(0, 0, 64, 64); for (var y = 0; y < 64; y += 4) { g.fillStyle = y % 8 ? '#d6c69f' : '#efe4c8'; g.fillRect(0, y, 64, 2); } g.fillStyle = 'rgba(120,100,60,0.3)'; for (var x = 8; x < 64; x += 21) g.fillRect(x, 0, 1, 64); return tex(c, 0.12); }
  function dapple() { var c = cv(128, 128), g = c.getContext('2d'); g.fillStyle = '#f2f0ea'; g.fillRect(0, 0, 128, 128); g.fillStyle = '#6e7276'; for (var i = 0; i < 40; i++) { g.beginPath(); g.ellipse(rnd() * 128, rnd() * 128, 3 + rnd() * 5, 2 + rnd() * 4, rnd() * 3, 0, 6.283); g.fill(); } return tex(c, 0.25); }
  function frieze() { var c = cv(64, 32), g = c.getContext('2d'); g.fillStyle = '#f5f3ec'; g.fillRect(0, 0, 64, 32); g.strokeStyle = '#c9c4b6'; g.lineWidth = 3; for (var x = 8; x < 64; x += 16) { g.beginPath(); g.arc(x, 16, 7, 0, 6.283); g.stroke(); } return tex(c, 0.08, 0.04); }
  function coir() { var c = cv(64, 64), g = c.getContext('2d'); g.fillStyle = '#b48a52'; g.fillRect(0, 0, 64, 64); for (var i = 0; i < 400; i++) { g.fillStyle = rnd() < 0.5 ? 'rgba(90,60,25,0.35)' : 'rgba(220,180,120,0.35)'; g.fillRect(rnd() * 64, rnd() * 64, 2, 1); } return tex(c, 0.12); }
  function tiles(c1, c2, size, var1) {
    var c = cv(128, 128), g = c.getContext('2d'); g.fillStyle = c2; g.fillRect(0, 0, 128, 128);
    for (var i = 0; i < 2; i++) for (var k = 0; k < 2; k++) { g.fillStyle = c1; g.fillRect(i * 64 + 1.5, k * 64 + 1.5, 61, 61); if (var1) { g.fillStyle = 'rgba(255,255,255,' + (rnd() * 0.08) + ')'; g.fillRect(i * 64 + 1.5, k * 64 + 1.5, 61, 61); } }
    return tex(c, size * 2);
  }
  function books() {                                   /* 书架正面：一格高 0.36 m，书脊高低、颜色、粗细不一 */
    var c = cv(256, 256), g = c.getContext('2d'), cols = ['#7a2e2a', '#2f4a63', '#556b3a', '#b08a46', '#5c3b2e', '#d8cdb4', '#3d3a52', '#8c5a3c', '#a33e35', '#2d5a57', '#c9a227', '#e8e2d0'];
    g.fillStyle = '#3a2a1e'; g.fillRect(0, 0, 256, 256);
    for (var row = 0; row < 2; row++) {
      var y0 = row * 128, x = 0;
      while (x < 256) {
        var w = 6 + Math.floor(rnd() * 9), h = 78 + Math.floor(rnd() * 34);
        if (rnd() < 0.06) { x += 12; continue; }
        g.fillStyle = cols[Math.floor(rnd() * cols.length)]; g.fillRect(x, y0 + 118 - h, w - 1, h);
        g.fillStyle = 'rgba(240,215,150,0.5)'; g.fillRect(x + 1, y0 + 118 - h + 10, w - 3, 2); g.fillRect(x + 1, y0 + 118 - 18, w - 3, 2);
        x += w;
      }
    }
    return tex(c, 0.7, 0.72);
  }
  function delft() {                                   /* 手册第 7 页：一整面墙的蓝白小房子收藏 */
    var c = cv(256, 256), g = c.getContext('2d'); g.fillStyle = '#c9cfc3'; g.fillRect(0, 0, 256, 256);
    for (var row = 0; row < 2; row++) {
      var y0 = row * 128; g.fillStyle = '#b6bdb0'; g.fillRect(0, y0 + 118, 256, 10);
      for (var x = 4; x < 250; x += 24) {
        var h = 60 + rnd() * 40, w = 20; g.fillStyle = '#f7f6f0'; g.beginPath(); g.moveTo(x, y0 + 118); g.lineTo(x, y0 + 118 - h); g.lineTo(x + w / 2, y0 + 118 - h - 14); g.lineTo(x + w, y0 + 118 - h); g.lineTo(x + w, y0 + 118); g.fill();
        g.fillStyle = '#2c4f8f'; g.fillRect(x + 3, y0 + 118 - h + 8, 5, 7); g.fillRect(x + 12, y0 + 118 - h + 8, 5, 7); g.fillRect(x + 3, y0 + 118 - h + 24, 5, 7); g.fillRect(x + 12, y0 + 118 - h + 24, 5, 7); g.fillRect(x + 7, y0 + 118 - 14, 6, 14);
        g.fillStyle = '#b48a3a'; g.fillRect(x + 8, y0 + 118 - h - 12, 4, 4);
      }
    }
    return tex(c, 0.7, 0.72);
  }
  /* 地毯（整张贴在一块平面上） */
  function agra() {                                    /* 客厅（第 6 页）：浅米底、粉红酒红大花，粉米色花边 */
    var W = 512, H = 352, c = cv(W, H), g = c.getContext('2d'), i;
    g.fillStyle = '#d9b9a5'; g.fillRect(0, 0, W, H); g.fillStyle = '#e3d6be'; g.fillRect(30, 30, W - 60, H - 60);
    g.strokeStyle = '#a5465a'; g.lineWidth = 2; g.strokeRect(14, 14, W - 28, H - 28); g.strokeRect(30, 30, W - 60, H - 60);
    for (i = 0; i < 26; i++) { blob(g, 18 + i * 19, 22, 5, '#b04a5e', 5); blob(g, 18 + i * 19, H - 22, 5, '#b04a5e', 5); }
    for (i = 0; i < 16; i++) { blob(g, 22, 22 + i * 20, 5, '#b04a5e', 5); blob(g, W - 22, 22 + i * 20, 5, '#b04a5e', 5); }
    [[W / 2, H / 2, 46, '#8e2236'], [W * 0.25, H * 0.3, 26, '#c46b7c'], [W * 0.75, H * 0.7, 26, '#c46b7c'], [W * 0.25, H * 0.72, 22, '#8e2236'], [W * 0.75, H * 0.28, 22, '#8e2236']].forEach(function (q) { blob(g, q[0], q[1], q[2], q[3], 8); blob(g, q[0], q[1], q[2] * 0.5, '#e6c7b4', 6); });
    for (i = 0; i < 60; i++) { var x = 45 + rnd() * (W - 90), y = 45 + rnd() * (H - 90); if (rnd() < 0.5) blob(g, x, y, 5 + rnd() * 6, rnd() < 0.5 ? '#b55366' : '#7e8a63', 5); else leaf(g, x, y, 7, rnd() * 3, '#8f9a6e'); }
    return once(c);
  }
  function aubusson() {                                /* 餐厅（第 9 页）：米白底、花环花边 */
    var W = 512, H = 352, c = cv(W, H), g = c.getContext('2d'), i;
    g.fillStyle = '#e7dcc4'; g.fillRect(0, 0, W, H); g.fillStyle = '#d6c4a0'; g.fillRect(0, 0, W, 34); g.fillRect(0, H - 34, W, 34); g.fillRect(0, 0, 34, H); g.fillRect(W - 34, 0, 34, H);
    for (i = 0; i < 30; i++) { blob(g, 10 + i * 18, 17, 6, i % 2 ? '#c27c7c' : '#9aa77c', 5); blob(g, 10 + i * 18, H - 17, 6, i % 2 ? '#c27c7c' : '#9aa77c', 5); }
    for (i = 0; i < 20; i++) { blob(g, 17, 10 + i * 18, 6, '#c27c7c', 5); blob(g, W - 17, 10 + i * 18, 6, '#c27c7c', 5); }
    g.strokeStyle = '#b98d76'; g.lineWidth = 3; g.beginPath(); g.ellipse(W / 2, H / 2, 120, 80, 0, 0, 6.283); g.stroke();
    for (i = 0; i < 16; i++) { var a = i / 16 * 6.283; blob(g, W / 2 + Math.cos(a) * 120, H / 2 + Math.sin(a) * 80, 8, i % 2 ? '#c27c7c' : '#8fa07a', 6); }
    blob(g, W / 2, H / 2, 24, '#c98e86', 8);
    return once(c);
  }
  function terraRug() { var W = 384, H = 256, c = cv(W, H), g = c.getContext('2d'); g.fillStyle = '#b8695a'; g.fillRect(0, 0, W, H); g.strokeStyle = '#e1b49b'; g.lineWidth = 6; g.strokeRect(14, 14, W - 28, H - 28); for (var i = 0; i < 90; i++) { g.fillStyle = 'rgba(' + (rnd() < 0.5 ? '230,180,150' : '120,50,40') + ',0.35)'; g.fillRect(30 + rnd() * (W - 60), 30 + rnd() * (H - 60), 8, 3); } return once(c); }
  function studyRug() { var W = 384, H = 256, c = cv(W, H), g = c.getContext('2d'); g.fillStyle = '#26334f'; g.fillRect(0, 0, W, H); g.fillStyle = '#8e2b2a'; g.fillRect(26, 26, W - 52, H - 52); blob(g, W / 2, H / 2, 40, '#d9b46a', 8); blob(g, W / 2, H / 2, 18, '#26334f', 6); for (var i = 0; i < 40; i++) blob(g, 40 + rnd() * (W - 80), 40 + rnd() * (H - 80), 5, '#d9b46a', 5); return once(c); }
  function art(kind) {                                 /* 墙上的画 */
    var c = cv(256, 192), g = c.getContext('2d'), W = 256, H = 192, i;
    function grad(y0, y1, a, b) { var gr = g.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, a); gr.addColorStop(1, b); g.fillStyle = gr; g.fillRect(0, y0, W, y1 - y0); }
    if (kind === 'land') {
      grad(0, 110, '#9cc0d8', '#e9dcc0'); g.fillStyle = '#7d8f6a'; g.beginPath(); g.moveTo(0, 120); for (i = 0; i <= 8; i++) g.lineTo(i * 32, 100 + Math.sin(i * 1.3) * 14); g.lineTo(W, H); g.lineTo(0, H); g.fill();
      grad(130, H, '#6f8a4a', '#4b5f30'); g.fillStyle = '#3e5228'; for (i = 0; i < 5; i++) { g.beginPath(); g.ellipse(30 + i * 50, 118, 14, 22, 0, 0, 6.283); g.fill(); }
    } else if (kind === 'old') {                       /* 客厅那幅金框老油画：暗色风景 */
      grad(0, H, '#4c4a36', '#2a2a1c'); g.fillStyle = '#8b8459'; g.beginPath(); g.ellipse(170, 60, 60, 30, 0, 0, 6.283); g.fill(); g.fillStyle = '#29321f'; for (i = 0; i < 6; i++) { g.beginPath(); g.ellipse(30 + i * 40, 130, 26, 40, 0, 0, 6.283); g.fill(); } g.fillStyle = '#6b5b3a'; g.fillRect(0, 160, W, 32);
    } else if (kind === 'sea') {
      grad(0, 100, '#7fa0c8', '#e6eef0'); grad(100, H, '#6d8e5c', '#a7a35d'); g.fillStyle = 'rgba(255,255,255,0.7)'; g.beginPath(); g.ellipse(150, 50, 50, 18, 0, 0, 6.283); g.fill();
    } else if (kind === 'water') {                     /* 卧室 2 的水彩：风车和草地 */
      grad(0, 110, '#cfe0ec', '#f2efe4'); grad(110, H, '#b5c48b', '#8fa36a'); g.fillStyle = '#5a4a3a'; g.fillRect(180, 70, 10, 40); g.beginPath(); g.moveTo(185, 70); g.lineTo(165, 60); g.lineTo(205, 82); g.fill();
    } else if (kind === 'flower') {
      grad(0, H, '#3a3f35', '#24271f'); g.fillStyle = '#8a6a44'; g.fillRect(100, 120, 56, 60);
      var cols = ['#e6a3b6', '#f2e3b0', '#c4473f', '#f6f2ea', '#b48ad0']; for (i = 0; i < 16; i++) blob(g, 128 + (rnd() - 0.5) * 110, 80 + (rnd() - 0.5) * 70, 9 + rnd() * 8, cols[i % 5], 6);
    } else {
      grad(0, H, '#4a3a2a', '#2a2018'); g.fillStyle = '#2b2f3a'; g.beginPath(); g.ellipse(128, 170, 70, 50, 0, 3.14, 6.283); g.fill(); g.fillRect(58, 165, 140, 30);
      g.fillStyle = '#e2c0a0'; g.beginPath(); g.ellipse(128, 92, 30, 38, 0, 0, 6.283); g.fill(); g.fillStyle = '#5a3a22'; g.beginPath(); g.ellipse(128, 66, 34, 20, 0, 3.0, 6.43); g.fill();
    }
    g.globalAlpha = 0.16; for (i = 0; i < 300; i++) { g.fillStyle = rnd() < 0.5 ? '#fff' : '#000'; g.fillRect(rnd() * W, rnd() * H, 3, 1); } g.globalAlpha = 1;
    return once(c);
  }

  /* 家具材质（两种模式都用） */
  C.furnMats = function (m) {
    function t(map, rough, extra) { var o = { map: map }; for (var k in (extra || {})) o[k] = extra[k]; return m(0xffffff, rough == null ? 0.9 : rough, o); }
    var T = C.ftex || (C.ftex = {
      books: books(), delft: delft(), crewel: floral('#f1e6cc', [['#8c2333', 20], ['#b5434d', 14], ['#d07d6a', 9]], '#8a8a52', 9, 0.7, true),
      peony: floral('#f2eee0', [['#fbfaf4', 22], ['#e9eee0', 16]], '#7f9c64', 10, 0.5, true), toile: toileRibbon(),
      ticking: stripes('#f4f4f0', [[0.1, 0.06, '#6f86ab'], [0.6, 0.06, '#6f86ab']], 0.05, true), bedStripe: stripes('#dfe4ea', [[0.1, 0.25, '#b8c3d2'], [0.6, 0.25, '#b8c3d2']], 0.03, true),
      buffalo: check('#f5f5f2', '#2c3a64', 0.14, 0.55), hound: check('#e8e4da', '#4d4c48', 0.025, 0.45), pinkCheck: check('#f7eef0', '#d98a9e', 0.04, 0.5),
      tartan: tartan('#6b3550', [[0.1, 0.18, '#2f5b3a', 0.7], [0.45, 0.05, '#e3c86a', 0.8], [0.62, 0.22, '#d26a7c', 0.6], [0.9, 0.04, '#f2efe6', 0.8]], 0.18),
      tartanRed: tartan('#b23a30', [[0.1, 0.2, '#2a3550', 0.7], [0.5, 0.05, '#f2e6c0', 0.8], [0.7, 0.15, '#1f4a32', 0.6]], 0.16),
      chintzGreen: floral('#8fb07a', [['#c43c3c', 18], ['#e0a0a0', 12]], '#4f7a44', 10, 0.45, false), peacock: floral('#efe2c8', [['#c98a7a', 14], ['#8a6a4a', 10], ['#b9a07a', 12]], '#8f8a5a', 12, 0.45, true),
      crewelMulti: floral('#f2ecdf', [['#c8323a', 16], ['#e3a12e', 13], ['#3a6db0', 12], ['#7a3b8f', 11]], '#5a8a3a', 12, 0.45, true),
      floralRG: floral('#f0e8d6', [['#c23b35', 15], ['#e78a6a', 11]], '#4f7f45', 10, 0.4, false), stripeBlind: stripes('#cdb79a', [[0.05, 0.1, '#8c6b4c'], [0.3, 0.04, '#e8dcc4'], [0.55, 0.12, '#a2805c']], 0.25, false),
      jar: jarBW(), delftTile: delftTile(), bamboo: bamboo(), dapple: dapple(), frieze: frieze(), coir: coir(),
      runner: stripes('#7a6652', [[0.08, 0.05, '#e6d8b8'], [0.16, 0.02, '#e6d8b8'], [0.82, 0.02, '#e6d8b8'], [0.87, 0.05, '#e6d8b8']], 0.7, true),
      terracotta: tiles('#a65a3e', '#7c3e2a', 0.15, true), limestone: tiles('#ddd2bd', '#c7bba3', 0.6, true), ktile: tiles('#6f655c', '#5a524b', 0.6, true),
      rugAgra: agra(), rugAubusson: aubusson(), rugTerra: terraRug(), rugStudy: studyRug(),
      artLand: art('land'), artOld: art('old'), artSea: art('sea'), artWater: art('water'), artFlower: art('flower'), artPortrait: art('portrait') });
    var o = {
      /* 布 */
      fabButter: m(0xf0dfa6, 0.95), fabTeal: m(0x1d6470, 0.75), fabRed: m(0x9e1e2c, 0.8), fabGreyBlue: m(0xb9c6c8, 0.9), fabLinen: m(0xf6f3ec, 0.95), fabCream: m(0xefe5cf, 0.95),
      fabCoral: m(0xd47a72, 0.9), fabOatmeal: m(0xd6ccb8, 0.95), fabTaupe: m(0xb3a593, 0.95), fabRaspberry: m(0xb3284f, 0.85), fabPink: m(0xe7aeba, 0.9), fabTealDeep: m(0x2c6e78, 0.9),
      fabCrewel: t(T.crewel), fabPeony: t(T.peony), fabToile: t(T.toile), fabTicking: t(T.ticking), fabBedStripe: t(T.bedStripe), fabBuffalo: t(T.buffalo), fabHound: t(T.hound),
      fabPinkCheck: t(T.pinkCheck), fabTartan: t(T.tartan), fabTartanRed: t(T.tartanRed), fabChintzGreen: t(T.chintzGreen), fabPeacock: t(T.peacock), fabCrewelMulti: t(T.crewelMulti),
      fabFloralRG: t(T.floralRG), fabStripeBlind: t(T.stripeBlind), bamboo: t(T.bamboo, 0.9), leather: m(0x6a3523, 0.55), leatherCream: m(0xe8dfcf, 0.5), leatherGreen: m(0x2f4a33, 0.55),
      /* 漆 / 木 */
      paintWhite: m(0xf6f4ee, 0.55), paintCream: m(0xeee5d0, 0.6), paintGrey: m(0xc9c8bf, 0.6), paintSage: m(0xa7b09a, 0.6), paintStone: m(0xdcd2bd, 0.7), paintCharcoal: m(0x34383a, 0.5),
      paintNavy: m(0x1f2c4a, 0.45), paintTaupe: m(0x9b8a76, 0.25), frieze: t(T.frieze, 0.6),
      woodDark: m(0x3e2316, 0.5), woodOak: m(0x5c3a22, 0.5), woodWalnut: m(0x6b4428, 0.5), woodMid: m(0x8a5a35, 0.55), woodLight: m(0xc59a68, 0.6),
      /* 金属 */
      brass: m(0xc29a4a, 0.35, { metalness: 0.6 }), gilt: m(0xd8b05a, 0.3, { metalness: 0.7 }), steel: m(0xc9ccce, 0.25, { metalness: 0.7 }), chrome: m(0xe6e9ec, 0.15, { metalness: 0.85 }), ironBlack: m(0x1c1c1e, 0.5),
      /* 其他 */
      gloss: m(0xf2ecdc, 0.15), glossTaupe: m(0x8f7f6c, 0.2), quartz: m(0xeeeae0, 0.25), marble: m(0xe7dcc4, 0.2), range: m(0x121316, 0.2), ovenGlass: m(0x1d2125, 0.1), slate: m(0x26282a, 0.6),
      ceramic: m(0xf7f7f3, 0.25), jar: t(T.jar, 0.3), delftTile: t(T.delftTile, 0.35), mirror: m(0xbfd0d8, 0.05, { metalness: 0.8 }), crystal: m(0xeef6ff, 0.05, { emissive: new THREE.Color(0x404850), metalness: 0.3 }),
      shade: m(0xf6ead0, 0.9, { emissive: new THREE.Color(0x4a3818) }), shadeNavy: m(0x1d2a48, 0.8), shadeRed: m(0xa8402e, 0.8, { emissive: new THREE.Color(0x401808) }), shadeAmber: m(0xe6a34a, 0.8, { emissive: new THREE.Color(0x5a3008) }),
      shadeTeal: m(0x2f7d86, 0.8), shadeCheck: t(T.buffalo, 0.8), opal: m(0xfbf6ea, 0.4, { emissive: new THREE.Color(0x6a5a3a) }), enamelGreen: m(0x23423a, 0.4),
      plant: m(0x4f7a3a, 0.9), bloom: m(0xe7a0b4, 0.9), fruit: m(0xd8a03a, 0.6), carpet: m(0xe2d9c5, 1.0), carpetBlue: m(0xc3ccd3, 1.0), carpetBeige: m(0xcfc3ab, 1.0),
      books: t(T.books), delft: t(T.delft, 0.6), runner: t(T.runner, 0.95), runnerPlain: m(0x7a6652, 0.95), coir: t(T.coir, 1), terracotta: t(T.terracotta, 0.6), limestone: t(T.limestone, 0.5), ktile: t(T.ktile, 0.35),
      dapple: t(T.dapple, 0.6)
    };
    ['rugAgra', 'rugAubusson', 'rugTerra', 'rugStudy', 'artLand', 'artOld', 'artSea', 'artWater', 'artFlower', 'artPortrait'].forEach(function (k) { o[k] = m(0xffffff, k.indexOf('art') === 0 ? 0.8 : 1, { map: T[k], polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }); });   /* 贴在地板 / 墙上的平面往前挪一点，不和地板抢深度（不闪） */
    return o;
  };

  /* ================= 摆放工具 =================
     o = { x, y, r, z }：局部 lx 沿宽、ly 沿深（正面在 −ly），正面朝向 = (sin r, −cos r)
     朝 +X：r = π/2 · 朝 −X：r = −π/2 · 朝 +Y：r = π · 朝 −Y：r = 0 */
  function O(x, y, r, z) { return { x: x, y: y, r: r || 0, z: z || 0 }; }
  function at(o, lx, ly) { var c = Math.cos(o.r || 0), s = Math.sin(o.r || 0); return [o.x + lx * c - ly * s, o.y + lx * s + ly * c]; }
  function piece(b, mat, o, lx, ly, hx, hy, z0, z1) { var p = at(o, lx, ly); b.obox(mat, p[0], p[1], hx, hy, o.r || 0, o.z + z0, o.z + z1); }
  function post(b, mat, o, lx, ly, r, z0, z1, r1) { var p = at(o, lx, ly); b.cyl(mat, p[0], p[1], o.z + z0, o.z + z1, r, r1 == null ? r : r1, 10); }
  function M(o, lx, ly, z, rx, ry, rz, sx, sy, sz) {    /* 局部旋转 (rx, ry, rz) + 缩放 → 摆到 o 上 */
    var p = at(o, lx, ly);
    return new THREE.Matrix4().compose(new THREE.Vector3(p[0], p[1], o.z + z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx || 0, ry || 0, (rz || 0) + (o.r || 0), 'ZYX')), new THREE.Vector3(sx || 1, sy || 1, sz || 1));
  }
  function hcyl(b, mat, o, lx, ly, z, r, len, axis, seg) { b.geom(mat, new THREE.CylinderGeometry(r, r, len, seg || 14), M(o, lx, ly, z, 0, 0, axis === 'x' ? PI / 2 : 0)); }   /* 横放的圆柱：axis 'x' 沿局部宽、'y' 沿局部深 */
  function ball(b, mat, o, lx, ly, z, r, sx, sy, sz) { b.geom(mat, new THREE.SphereGeometry(r, 12, 8), M(o, lx, ly, z, 0, 0, 0, sx, sy, sz)); }
  function cushion(b, mat, o, lx, ly, z, w, h, t, tilt, turn) { b.geom(mat, new THREE.BoxGeometry(w, t, h), M(o, lx, ly, z, tilt || 0, 0, turn || 0)); }   /* 靠垫：w 宽、h 高、t 厚，往后仰 tilt */
  function oval(b, mat, o, lx, ly, z, rx, rz, tube) { b.geom(mat, new THREE.TorusGeometry(1, tube, 6, 22), M(o, lx, ly, z, PI / 2, 0, 0, rx, 1, rz)); }   /* 竖着的椭圆圈（椅背） */
  function turned(b, mat, o, lx, ly, z0, h, rr) { rr = rr || 0.035; post(b, mat, o, lx, ly, rr * 0.8, z0, z0 + h * 0.15, rr); ball(b, mat, o, lx, ly, z0 + h * 0.32, rr * 2.1, 1, 1, 1.3); post(b, mat, o, lx, ly, rr, z0 + h * 0.45, z0 + h, rr * 0.8); }   /* 车旋腿：下细、中间鼓 */

  /* ---- 座椅 ---- */
  function rollSofa(b, o, w, fab, cush, legs) {       /* 卷扶手大沙发（客厅黄油色、阳光房白底绿花）：深坐垫、厚靠垫、圆卷扶手、短腿 / 铜脚轮 */
    var d = 0.98, hw = w / 2;
    [-1, 1].forEach(function (s) { [-1, 1].forEach(function (t) { post(b, legs || 'woodDark', o, s * (hw - 0.12), t * (d / 2 - 0.1), 0.028, 0, 0.12, 0.02); if (legs === 'brass') ball(b, 'brass', o, s * (hw - 0.12), t * (d / 2 - 0.1), 0.03, 0.03); }); });
    piece(b, fab, o, 0, 0.02, hw - 0.02, d / 2, 0.12, 0.42);
    piece(b, fab, o, 0, d / 2 - 0.1, hw - 0.12, 0.1, 0.42, 0.78);
    [-1, 1].forEach(function (s) { piece(b, fab, o, s * (hw - 0.1), 0.04, 0.1, d / 2 - 0.04, 0.42, 0.56); hcyl(b, fab, o, s * (hw - 0.08), 0.04, 0.6, 0.13, d - 0.06, 'y'); });
    var n = w > 1.8 ? 3 : 2, cw = (w - 0.4) / n, i;
    for (i = 0; i < n; i++) { cushion(b, fab, o, -hw + 0.2 + cw * (i + 0.5), -0.05, 0.49, cw - 0.03, d - 0.36, 0.14, PI / 2); cushion(b, fab, o, -hw + 0.2 + cw * (i + 0.5), d / 2 - 0.24, 0.72, cw - 0.04, 0.42, 0.2, -0.22); }
    (cush || []).forEach(function (cm, k) { var L = cush.length, lx = L > 1 ? (k - (L - 1) / 2) * (w - 0.5) / (L - 1) : 0; cushion(b, cm, o, lx, d / 2 - 0.4, 0.78, 0.44, 0.42, 0.14, -0.3, (k % 2 ? 0.18 : -0.15)); });
  }
  function armchair(b, o, fab, wing, legs) {          /* 卷扶手 / 翼背扶手椅 */
    var hw = 0.43, d = 0.86;
    [-1, 1].forEach(function (s) { [-1, 1].forEach(function (t) { post(b, legs || 'woodDark', o, s * (hw - 0.08), t * (d / 2 - 0.08), 0.025, 0, 0.13, 0.02); }); });
    piece(b, fab, o, 0, 0, hw, d / 2, 0.13, 0.44);
    piece(b, fab, o, 0, d / 2 - 0.1, hw - 0.04, 0.1, 0.44, wing ? 1.12 : 0.9);
    [-1, 1].forEach(function (s) { if (wing) piece(b, fab, o, s * (hw - 0.05), d / 2 - 0.25, 0.05, 0.17, 0.62, 1.08); piece(b, fab, o, s * (hw - 0.07), 0.04, 0.07, d / 2 - 0.05, 0.44, 0.6); hcyl(b, fab, o, s * (hw - 0.06), 0.0, 0.63, 0.09, d - 0.12, 'y'); });
    cushion(b, fab, o, 0, -0.05, 0.5, hw * 2 - 0.26, d - 0.3, 0.12, PI / 2);
  }
  function bergere(b, o) {                             /* 客厅（第 6 页）：木框扶手椅，灰白千鸟格布，两个米色方靠垫 */
    var hw = 0.38, d = 0.72;
    [-1, 1].forEach(function (s) { [-1, 1].forEach(function (t) { post(b, 'woodWalnut', o, s * (hw - 0.05), t * (d / 2 - 0.05), 0.022, 0, 0.42, 0.016); }); });
    piece(b, 'woodWalnut', o, 0, 0, hw, d / 2, 0.36, 0.42); piece(b, 'fabHound', o, 0, -0.02, hw - 0.04, d / 2 - 0.04, 0.42, 0.52);
    oval(b, 'woodWalnut', o, 0, d / 2 - 0.05, 0.78, 0.36, 0.3, 0.025); b.geom('fabHound', new THREE.CylinderGeometry(1, 1, 0.06, 22), M(o, 0, d / 2 - 0.05, 0.78, PI / 2, 0, 0, 0.34, 1, 0.28));
    [-1, 1].forEach(function (s) { piece(b, 'woodWalnut', o, s * hw, 0, 0.025, d / 2 - 0.05, 0.42, 0.68); piece(b, 'fabHound', o, s * hw, 0.05, 0.035, 0.18, 0.62, 0.7); });
    [-0.17, 0.17].forEach(function (lx, k) { cushion(b, 'fabCream', o, lx, d / 2 - 0.2, 0.72, 0.32, 0.3, 0.1, -0.3, k ? 0.15 : -0.15); });
  }
  function ovalChair(b, o, paint, seat) {              /* 古斯塔夫椭圆背椅 */
    [-1, 1].forEach(function (s) { [-1, 1].forEach(function (t) { post(b, paint, o, s * 0.2, t * 0.2, 0.022, 0, 0.46, 0.015); }); });
    piece(b, seat || paint, o, 0, 0, 0.23, 0.23, 0.44, 0.5);
    [-1, 1].forEach(function (s) { post(b, paint, o, s * 0.19, 0.21, 0.018, 0.46, 0.66); });
    oval(b, paint, o, 0, 0.21, 0.82, 0.17, 0.2, 0.022); b.geom(seat || paint, new THREE.CylinderGeometry(1, 1, 0.03, 18), M(o, 0, 0.21, 0.82, PI / 2, 0, 0, 0.14, 1, 0.16));
  }
  function slipperChair(b, o, fab) { piece(b, fab, o, 0, 0, 0.32, 0.36, 0.0, 0.42); piece(b, fab, o, 0, 0.3, 0.32, 0.07, 0.42, 0.95); hcyl(b, fab, o, 0, 0.3, 0.95, 0.07, 0.64, 'x'); }   /* 卧室 1：无扶手软椅，裙边到地 */
  function chaise(b, o, len) {                         /* 客厅凸窗（第 6 页）：青绿丝绒贵妃椅，深色涡卷木架，背后一排车旋小立柱 */
    var hl = len / 2;
    [-1, 1].forEach(function (s) { [-1, 1].forEach(function (t) { turned(b, 'woodDark', o, s * (hl - 0.08), t * 0.24, 0, 0.24, 0.025); }); });
    piece(b, 'woodDark', o, 0, 0, hl, 0.3, 0.24, 0.3); piece(b, 'fabTeal', o, 0.06, 0, hl - 0.1, 0.28, 0.3, 0.42);
    hcyl(b, 'fabTeal', o, -hl + 0.12, 0, 0.52, 0.17, 0.56, 'y'); hcyl(b, 'woodDark', o, -hl + 0.02, 0, 0.62, 0.09, 0.6, 'y');
    hcyl(b, 'woodDark', o, -0.05, 0.27, 0.72, 0.025, len * 0.72, 'x');
    for (var i = 0; i < 9; i++) post(b, 'woodDark', o, -hl + 0.3 + i * len * 0.72 / 9, 0.27, 0.012, 0.42, 0.72);
  }
  function victorianChair(b, o) {                      /* 阳光房：胡桃木维多利亚椅，米色布，搭一条格子毯 */
    [-1, 1].forEach(function (s) { turned(b, 'woodWalnut', o, s * 0.22, -0.2, 0, 0.42, 0.024); post(b, 'woodWalnut', o, s * 0.22, 0.2, 0.022, 0, 1.0); });
    ball(b, 'brass', o, -0.22, -0.2, 0.02, 0.025); ball(b, 'brass', o, 0.22, -0.2, 0.02, 0.025);
    piece(b, 'fabCream', o, 0, 0, 0.26, 0.24, 0.4, 0.5); piece(b, 'fabCream', o, 0, 0.2, 0.19, 0.03, 0.56, 0.92); piece(b, 'woodWalnut', o, 0, 0.21, 0.26, 0.03, 0.93, 1.05);
    piece(b, 'fabTartanRed', o, 0, 0.12, 0.2, 0.06, 0.66, 0.84);
  }
  function tufted(b, o, w, d, h, fab, legs) { [-1, 1].forEach(function (s) { [-1, 1].forEach(function (t) { post(b, legs || 'paintCream', o, s * (w / 2 - 0.05), t * (d / 2 - 0.05), 0.025, 0, h - 0.12); }); }); piece(b, fab, o, 0, 0, w / 2, d / 2, h - 0.14, h); }   /* 床尾凳 / 搁脚凳 */

  /* ---- 桌柜 ---- */
  function table(b, o, w, d, h, top, leg) { piece(b, top, o, 0, 0, w / 2, d / 2, h - 0.045, h); [-1, 1].forEach(function (s) { [-1, 1].forEach(function (t) { post(b, leg || top, o, s * (w / 2 - 0.07), t * (d / 2 - 0.07), 0.025, 0, h - 0.045, 0.018); }); }); }
  function refectory(b, o, w, L) {                     /* 餐厅（第 9 页）：深色橡木长桌，球形车旋腿，下有横撑 */
    piece(b, 'woodOak', o, 0, 0, w / 2, L / 2, 0.71, 0.76); piece(b, 'woodOak', o, 0, 0, w / 2 - 0.06, L / 2 - 0.08, 0.62, 0.71);
    [-1, 1].forEach(function (s) { [-1, 1].forEach(function (t) { turned(b, 'woodOak', o, s * (w / 2 - 0.12), t * (L / 2 - 0.15), 0, 0.62, 0.045); }); });
    piece(b, 'woodOak', o, 0, 0, 0.03, L / 2 - 0.15, 0.1, 0.16);
  }
  function roundTable(b, x, y, z, r, h, top) { b.cyl(top, x, y, z + h - 0.035, z + h, r, r, 22); b.cyl(top, x, y, z, z + h - 0.035, 0.035, 0.045, 10); b.cyl(top, x, y, z, z + 0.03, r * 0.42, r * 0.42, 16); }
  function chest(b, o, w, h, mat, rows, knob, d) {     /* 五斗柜：柜体、抽屉缝、拉手 */
    d = d || 0.48; rows = rows || 4;
    piece(b, mat, o, 0, 0, w / 2, d / 2, 0.08, h); piece(b, mat, o, 0, 0, w / 2 + 0.02, d / 2 + 0.02, h - 0.03, h + 0.01);
    [-1, 1].forEach(function (s) { [-1, 1].forEach(function (t) { post(b, mat, o, s * (w / 2 - 0.04), t * (d / 2 - 0.04), 0.025, 0, 0.08); }); });
    for (var i = 0; i < rows; i++) {
      var za = 0.08 + (h - 0.08) * i / rows, zb = 0.08 + (h - 0.08) * (i + 1) / rows;
      piece(b, mat, o, 0, -d / 2 - 0.006, w / 2 - 0.04, 0.008, za + 0.015, zb - 0.015);
      [-1, 1].forEach(function (s) { if (knob === 'ceramic') ball(b, 'ceramic', o, s * w * 0.25, -d / 2 - 0.02, (za + zb) / 2, 0.018); else piece(b, 'brass', o, s * w * 0.25, -d / 2 - 0.018, 0.04, 0.008, (za + zb) / 2 - 0.012, (za + zb) / 2 + 0.012); });
    }
  }
  function bedside(b, o, mat, h, shelf) {              /* 床头柜：一个抽屉、细方腿、下层隔板；古斯塔夫款带雕花横饰 */
    var w = 0.5, d = 0.4; piece(b, mat, o, 0, 0, w / 2, d / 2, h - 0.04, h);
    piece(b, shelf === 'frieze' ? 'frieze' : mat, o, 0, -0.005, w / 2 - 0.02, d / 2 - 0.02, h - 0.17, h - 0.04); ball(b, 'brass', o, 0, -d / 2 - 0.01, h - 0.1, 0.014);
    [-1, 1].forEach(function (s) { [-1, 1].forEach(function (t) { post(b, mat, o, s * (w / 2 - 0.03), t * (d / 2 - 0.03), 0.02, 0, h - 0.04, 0.014); }); });
    piece(b, mat, o, 0, 0, w / 2 - 0.03, d / 2 - 0.03, 0.12, 0.14);
  }
  function bookcase(b, o, w, h, d, face, frame, arch) {   /* 书架：外框 + 正面一层书（贴图）；arch = 顶上做拱 */
    d = d || 0.34; var hw = w / 2; frame = frame || 'woodMid';
    piece(b, frame, o, 0, 0, hw, d / 2, 0, 0.1); piece(b, frame, o, 0, 0, hw, d / 2, h - 0.06, h);
    [-1, 1].forEach(function (s) { piece(b, frame, o, s * (hw - 0.03), 0, 0.03, d / 2, 0, h); });
    piece(b, face || 'books', o, 0, 0.03, hw - 0.06, d / 2 - 0.03, 0.1, h - (arch ? 0.3 : 0.06));
    if (arch) { piece(b, frame, o, 0, -d / 2 + 0.02, hw, 0.02, h - 0.3, h); b.geom(frame, new THREE.CylinderGeometry(hw - 0.06, hw - 0.06, 0.03, 18, 1, false, -PI / 2, PI), M(o, 0, -d / 2 + 0.005, h - 0.3, PI / 2, 0, 0, 1, 1, 0.45)); }
  }
  function armoire(b, o, w, h, paint, gilt) {          /* 客厅（第 6 页）：法式彩绘大衣柜，拱形顶檐，两扇嵌板门，下部抽屉 */
    var d = 0.6, hw = w / 2, i;
    piece(b, paint, o, 0, 0, hw, d / 2, 0.12, h - 0.25);
    [-1, 1].forEach(function (s) { post(b, paint, o, s * (hw - 0.06), -d / 2 + 0.06, 0.04, 0, 0.12); post(b, paint, o, s * (hw - 0.06), d / 2 - 0.06, 0.04, 0, 0.12); });
    var pts = [], n = 10; for (i = 0; i <= n; i++) { var a = i / n; pts.push([-hw - 0.04 + a * (w + 0.08), h - 0.25 + 0.18 * Math.sin(a * PI) + 0.05]); }
    pts.push([hw + 0.04, h - 0.3]); pts.push([-hw - 0.04, h - 0.3]);
    var p3 = pts.map(function (q) { var p = at(o, q[0], -d / 2 - 0.03); return [p[0], p[1], o.z + q[1]]; }), off = at(O(0, 0, o.r), 0, d + 0.04);
    b.extrude(paint, p3, [off[0], off[1], 0]);
    [-1, 1].forEach(function (s) { piece(b, paint, o, s * hw / 2, -d / 2 - 0.01, hw / 2 - 0.05, 0.01, 0.75, h - 0.45); piece(b, paint, o, s * hw / 2, -d / 2 - 0.02, hw / 2 - 0.12, 0.01, 0.9, h - 0.6); });
    piece(b, gilt || 'gilt', o, 0, -d / 2 - 0.025, 0.012, 0.01, 1.2, 1.5); [-1, 1].forEach(function (s) { piece(b, gilt || 'gilt', o, s * hw * 0.5, -d / 2 - 0.02, 0.05, 0.01, 0.45, 0.48); });
    piece(b, paint, o, 0, -d / 2 - 0.01, hw - 0.04, 0.01, 0.2, 0.62); piece(b, 'woodDark', o, 0, -d / 2 - 0.015, hw - 0.04, 0.005, 0.405, 0.415);
  }
  function bureau(b, o, w) {                           /* 客厅（第 6 页）：斜盖写字台，米白做旧，下部三层抽屉，斜盖打开 */
    var d = 0.5, hw = w / 2;
    chest(b, o, w, 0.78, 'paintStone', 3, 'brass', d);
    var tri = [[-d / 2, 0.8], [d / 2 - 0.22, 1.05], [d / 2, 1.05], [d / 2, 0.8]].map(function (q) { var p = at(o, -hw, q[0]); return [p[0], p[1], o.z + q[1]]; }), off = at(O(0, 0, o.r), w, 0);
    b.extrude('paintStone', tri, [off[0], off[1], 0]);
    for (var i = 0; i < 4; i++) piece(b, 'paintStone', o, -hw + 0.12 + i * (w - 0.24) / 3, d / 2 - 0.12, 0.08, 0.1, 0.8, 0.98);
    piece(b, 'paintStone', o, 0, -d / 2 - 0.12, hw - 0.02, 0.17, 0.78, 0.8);
  }
  function lattice(b, o, w, h) {                       /* 餐厅（第 9 页）：深色中式雕花格子柜 */
    var d = 0.5, hw = w / 2, i;
    piece(b, 'woodDark', o, 0, 0, hw, d / 2, 0, h); piece(b, 'woodDark', o, 0, 0, hw + 0.04, d / 2 + 0.03, h, h + 0.08);
    for (i = 0; i < 9; i++) piece(b, 'woodWalnut', o, -hw + 0.12 + i * (w - 0.24) / 8, -d / 2 - 0.01, 0.012, 0.01, 0.95, h - 0.25);
    for (i = 0; i < 4; i++) piece(b, 'woodWalnut', o, 0, -d / 2 - 0.012, hw - 0.08, 0.01, 1.0 + i * (h - 1.3) / 3, 1.02 + i * (h - 1.3) / 3);
    piece(b, 'woodWalnut', o, 0, -d / 2 - 0.01, hw - 0.08, 0.01, h - 0.22, h - 0.06); piece(b, 'woodWalnut', o, 0, -d / 2 - 0.01, hw - 0.08, 0.01, 0.1, 0.8);
  }
  function cornerCupboard(b, x, y, sx, sy, za, zb) {   /* 墙角吊柜（桃花心木） */
    var pts = [[x, y], [x + sx * 0.55, y], [x + sx * 0.55, y + sy * 0.18], [x + sx * 0.18, y + sy * 0.55], [x, y + sy * 0.55]];
    if (sx * sy < 0) pts.reverse(); b.prism('woodWalnut', pts, za, zb);
  }

  /* ---- 灯 ---- */
  function lamp(b, x, y, z, base, shade, kind, s) {    /* 台灯：灯座（青花罐 / 金属）+ 灯罩（pleat / square / cone / drum） */
    s = s || 1; base = base || 'jar';
    if (base === 'jar') { b.cyl('woodDark', x, y, z, z + 0.03 * s, 0.09 * s, 0.09 * s, 12); b.cyl('jar', x, y, z + 0.03 * s, z + 0.12 * s, 0.07 * s, 0.11 * s, 14); b.cyl('jar', x, y, z + 0.12 * s, z + 0.32 * s, 0.11 * s, 0.07 * s, 14); b.cyl('jar', x, y, z + 0.32 * s, z + 0.36 * s, 0.07 * s, 0.04 * s, 10); }
    else { b.cyl(base, x, y, z, z + 0.03 * s, 0.08 * s, 0.08 * s, 12); b.cyl(base, x, y, z, z + 0.36 * s, 0.015 * s, 0.015 * s, 6); }
    b.cyl('brass', x, y, z + 0.36 * s, z + 0.42 * s, 0.008, 0.008, 6);
    var sh = shade || 'shade', zb = z + 0.36 * s, zt = z + 0.62 * s;
    if (kind === 'square') b.geom(sh, new THREE.CylinderGeometry(0.13 * s, 0.22 * s, zt - zb, 4), new THREE.Matrix4().makeTranslation(x, y, (zb + zt) / 2).multiply(new THREE.Matrix4().makeRotationX(PI / 2)).multiply(new THREE.Matrix4().makeRotationY(PI / 4)));
    else if (kind === 'cone') b.cyl(sh, x, y, zb + 0.04, zt, 0.17 * s, 0.07 * s, 18);
    else if (kind === 'drum') b.cyl(sh, x, y, zb, zt, 0.18 * s, 0.18 * s, 18);
    else b.cyl(sh, x, y, zb, zt, 0.21 * s, 0.13 * s, 20);
  }
  function standardLamp(b, x, y, z, shade, h) { h = h || 1.45; b.cyl('brass', x, y, z, z + 0.03, 0.16, 0.16, 14); b.cyl('brass', x, y, z, z + h, 0.014, 0.014, 6); b.cyl(shade || 'shade', x, y, z + h - 0.1, z + h + 0.2, 0.22, 0.14, 18); }
  function tripodLamp(b, x, y, z) { [0, 2.09, 4.19].forEach(function (a) { b.beam('woodDark', [x + Math.cos(a) * 0.28, y + Math.sin(a) * 0.28, z], [x, y, z + 1.0], 0.025, 0.025); }); b.cyl('woodDark', x, y, z + 0.95, z + 1.45, 0.014, 0.014, 6); b.cyl('shade', x, y, z + 1.32, z + 1.62, 0.32, 0.17, 20); }
  function chandelier(b, x, y, zc, mat, arms, shade, drop) {   /* 吊灯：吊杆 + 一圈烛台；shade 给每支加小灯罩 */
    drop = drop || 0.55; mat = mat || 'gilt'; b.cyl(mat, x, y, zc - drop, zc, 0.012, 0.012, 6); b.cyl(mat, x, y, zc - drop - 0.14, zc - drop, 0.05, 0.03, 10); ball(b, mat, O(x, y, 0, zc), 0, 0, -drop - 0.17, 0.05);
    for (var i = 0; i < (arms || 6); i++) {
      var a = i / (arms || 6) * 2 * PI, px = x + Math.cos(a) * 0.32, py = y + Math.sin(a) * 0.32;
      b.beam(mat, [x, y, zc - drop - 0.1], [px, py, zc - drop - 0.12], 0.022, 0.022); b.cyl(mat, px, py, zc - drop - 0.13, zc - drop - 0.09, 0.035, 0.03, 8);
      if (shade) b.cyl(shade, px, py, zc - drop - 0.09, zc - drop + 0.05, 0.075, 0.045, 12); else b.cyl('shade', px, py, zc - drop - 0.09, zc - drop + 0.03, 0.016, 0.016, 6);
    }
  }
  function flushLight(b, x, y, zc, mat) { b.cyl(mat || 'gilt', x, y, zc - 0.06, zc, 0.12, 0.16, 16); b.cyl('opal', x, y, zc - 0.16, zc - 0.06, 0.15, 0.12, 16); for (var i = 0; i < 6; i++) { var a = i * 1.047; b.beam(mat || 'gilt', [x, y, zc - 0.08], [x + Math.cos(a) * 0.3, y + Math.sin(a) * 0.3, zc - 0.13], 0.06, 0.012); } }   /* 客厅：金色叶形吸顶灯 */
  function tole(b, x, y, zc) {                         /* 阳光房（第 8 页）：黑铁叶子吊灯 */
    chandelier(b, x, y, zc, 'ironBlack', 6, null, 0.7);
    for (var i = 0; i < 14; i++) { var a = rnd() * 6.283, r = 0.08 + rnd() * 0.3, z = zc - 0.75 - rnd() * 0.3; b.obox('ironBlack', x + Math.cos(a) * r, y + Math.sin(a) * r, 0.05, 0.02, a, z, z + 0.06); }
  }
  function crystalDrop(b, x, y, zc) { b.cyl('brass', x, y, zc - 0.25, zc, 0.01, 0.01, 6); for (var i = 0; i < 3; i++) b.cyl('crystal', x, y, zc - 0.25 - 0.1 * (i + 1), zc - 0.25 - 0.1 * i, 0.06 + i * 0.025, 0.04 + i * 0.025, 10); b.cyl('crystal', x, y, zc - 0.62, zc - 0.55, 0.01, 0.09, 10); }   /* 卧室 2：水晶小吊灯 */
  function globe(b, x, y, zc, drop) { b.cyl('brass', x, y, zc - drop, zc, 0.008, 0.008, 4); b.geom('opal', new THREE.SphereGeometry(0.17, 16, 12), new THREE.Matrix4().makeTranslation(x, y, zc - drop - 0.14)); }   /* 大厅：乳白玻璃球吊灯 */
  function coneShade(b, x, y, zc, drop, mat) { b.cyl('brass', x, y, zc - drop, zc, 0.006, 0.006, 4); b.cyl(mat || 'enamelGreen', x, y, zc - drop - 0.2, zc - drop, 0.24, 0.05, 18); }   /* 阁楼：墨绿搪瓷锥形吊灯 */
  function saucer(b, x, y, zr, z) {                    /* 厨房：飞碟形白玻璃吊灯 */
    b.cyl('steel', x, y, z, zr, 0.004, 0.004, 4); b.cyl('steel', x, y, z, z + 0.06, 0.012, 0.012, 6);
    b.geom('opal', new THREE.SphereGeometry(0.26, 18, 6, 0, 2 * PI, 0, PI / 2), new THREE.Matrix4().makeTranslation(x, y, z - 0.05).multiply(new THREE.Matrix4().makeScale(1, 1, 0.22)).multiply(new THREE.Matrix4().makeRotationX(PI / 2)));
    b.cyl('opal', x, y, z - 0.06, z - 0.05, 0.26, 0.26, 18);
  }

  /* ---- 软装 ---- */
  function rug(G, name, x0, y0, x1, y1, z) { var mesh = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, y1 - y0), C.mats[name] || C.mats.floor); mesh.position.set((x0 + x1) / 2, (y0 + y1) / 2, z + 0.032); mesh.userData.mat = name; mesh.receiveShadow = true; mesh.name = 'rug:' + name; G.add(mesh); }
  function vase(b, x, y, z, s, bloom) { s = s || 1; b.cyl('ceramic', x, y, z, z + 0.24 * s, 0.05 * s, 0.07 * s, 12); for (var i = 0; i < 7; i++) { var a = i * 0.9; ball(b, i % 3 ? (bloom || 'bloom') : 'plant', O(x, y, 0, z), Math.cos(a) * 0.07 * s, Math.sin(a) * 0.07 * s, (0.28 + (i % 2) * 0.05) * s, 0.045 * s); } }
  function frames(b, x, y, z, n, dx, dy) { for (var i = 0; i < n; i++) { var px = x + dx * (i % 4) + (rnd() - 0.5) * 0.04, py = y + dy * Math.floor(i / 4) + (rnd() - 0.5) * 0.04, h = 0.12 + rnd() * 0.1; b.obox('steel', px, py, 0.06, 0.008, rnd() - 0.5, z, z + h); } }   /* 阳光房圆桌上一堆银相框 */
  function radiator(b, x0, y0, x1, y1, z, h) { var L = Math.max(x1 - x0, y1 - y0), n = Math.max(3, Math.round(L / 0.065)), i; h = h || 0.62; for (i = 0; i < n; i++) { var t = (i + 0.5) / n; if (x1 - x0 > y1 - y0) b.box('paintWhite', x0 + (x1 - x0) * t - 0.022, y0, z + 0.12, x0 + (x1 - x0) * t + 0.022, y1, z + 0.12 + h); else b.box('paintWhite', x0, y0 + (y1 - y0) * t - 0.022, z + 0.12, x1, y0 + (y1 - y0) * t + 0.022, z + 0.12 + h); } }   /* 铸铁柱式暖气片 */
  function mirror(b, axis, face, a0, a1, za, zb, dir, frame, fw) { fw = fw || 0.07; function bx(mm, d0, d1, u0, u1, v0, v1) { if (axis === 'x') b.box(mm, Math.min(face + dir * d0, face + dir * d1), u0, v0, Math.max(face + dir * d0, face + dir * d1), u1, v1); else b.box(mm, u0, Math.min(face + dir * d0, face + dir * d1), v0, u1, Math.max(face + dir * d0, face + dir * d1), v1); } bx(frame || 'gilt', 0, 0.04, a0, a1, za, zb); bx('mirror', 0.04, 0.045, a0 + fw, a1 - fw, za + fw, zb - fw); }
  /* 凸窗内沿：把凸窗外轮廓（室内在左）往室内偏 d，得到窗洞内侧那条折线 */
  function bayInner(cx, d) {
    var pts = C.bayLine(cx, 0, P.bayHalfW, P.bayReturn, P.bayCant), segs = [], out = [], i;
    for (i = 0; i < pts.length - 1; i++) { var a = pts[i], c = pts[i + 1], L = Math.hypot(c[0] - a[0], c[1] - a[1]), n = [-(c[1] - a[1]) / L, (c[0] - a[0]) / L]; segs.push([[a[0] + n[0] * d, a[1] + n[1] * d], [c[0] + n[0] * d, c[1] + n[1] * d]]); }
    out.push(segs[0][0]);
    for (i = 0; i < segs.length - 1; i++) { var p = segs[i], q = segs[i + 1], r = [p[1][0] - p[0][0], p[1][1] - p[0][1]], s = [q[1][0] - q[0][0], q[1][1] - q[0][1]], den = r[0] * s[1] - r[1] * s[0], t = ((q[0][0] - p[0][0]) * s[1] - (q[0][1] - p[0][1]) * s[0]) / den; out.push([p[0][0] + r[0] * t, p[0][1] + r[1] * t]); }
    out.push(segs[segs.length - 1][1]); return out;
  }
  function alongPoly(b, mat, pts, za, zb, t, skipEnds) { for (var i = skipEnds ? 1 : 0; i < pts.length - 1 - (skipEnds ? 1 : 0); i++) { var a = pts[i], c = pts[i + 1], L = Math.hypot(c[0] - a[0], c[1] - a[1]); b.obox(mat, (a[0] + c[0]) / 2, (a[1] + c[1]) / 2, L / 2, t, Math.atan2(c[1] - a[1], c[0] - a[0]), za, zb); } }   /* 沿折线放一条 */
  function bayDress(b, cx, zTop, zBot, opts) {         /* 凸窗：罗马帘 / 卷帘、两侧落地窗帘、帘头、窗下暖气片、窗座 */
    var inner = bayInner(cx, P.wallExt + 0.07), mx0 = cx - P.bayHalfW + P.wallExt, mx1 = cx + P.bayHalfW - P.wallExt;
    if (opts.blind) alongPoly(b, opts.blind, inner, zTop - (opts.blindH || 0.38), zTop, 0.02, true);
    if (opts.roller) alongPoly(b, opts.roller, inner, zTop - 0.12, zTop, 0.03, true);
    if (opts.curtain) [-1, 1].forEach(function (s) { var x = cx + s * (P.bayHalfW - P.wallExt + 0.12); b.box(opts.curtain, x - 0.14, P.wallExt + 0.015, zBot, x + 0.14, P.wallExt + 0.16, zTop + 0.12); });
    if (opts.pelmet) b.box(opts.pelmet, mx0 - 0.25, P.wallExt + 0.015, zTop - 0.05, mx1 + 0.25, P.wallExt + 0.18, zTop + 0.18);
    if (opts.radiator) { var f = inner.slice(2, 4); radiator(b, Math.min(f[0][0], f[1][0]) + 0.25, f[0][1] + 0.02, Math.max(f[0][0], f[1][0]) - 0.25, f[0][1] + 0.12, opts.z, 0.55); }
    if (opts.seat) { var sp = bayInner(cx, P.wallExt + 0.03 + 0.25); alongPoly(b, 'paintCream', sp, opts.z, opts.z + 0.46, 0.25, true); alongPoly(b, opts.seat, sp, opts.z + 0.46, opts.z + 0.54, 0.23, true); }
  }
  function canvasArt(b, G, name, axis, face, along, zc, w, h, dir, frame) {   /* 画：画框 + 画布（单独一块平面） */
    var n = axis === 'x' ? new THREE.Vector3(dir, 0, 0) : new THREE.Vector3(0, dir, 0), up = new THREE.Vector3(0, 0, 1), right = new THREE.Vector3().crossVectors(up, n);
    var c = axis === 'x' ? new THREE.Vector3(face, along, zc) : new THREE.Vector3(along, face, zc), fw = 0.06;
    function bx(u0, u1, v0, v1, d0, d1) { var A = c.clone().addScaledVector(right, u0).addScaledVector(up, v0).addScaledVector(n, d0), B = c.clone().addScaledVector(right, u1).addScaledVector(up, v1).addScaledVector(n, d1); b.box(frame || 'gilt', Math.min(A.x, B.x), Math.min(A.y, B.y), Math.min(A.z, B.z), Math.max(A.x, B.x), Math.max(A.y, B.y), Math.max(A.z, B.z)); }
    bx(-w / 2 - fw, w / 2 + fw, h / 2, h / 2 + fw, 0, 0.05); bx(-w / 2 - fw, w / 2 + fw, -h / 2 - fw, -h / 2, 0, 0.05); bx(-w / 2 - fw, -w / 2, -h / 2, h / 2, 0, 0.05); bx(w / 2, w / 2 + fw, -h / 2, h / 2, 0, 0.05);
    var mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), C.mats[name] || C.mats.inner); mesh.position.copy(c).addScaledVector(n, 0.02); mesh.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(right, up, n));
    mesh.userData.mat = name; mesh.name = 'art:' + name; mesh.receiveShadow = true; G.add(mesh);
  }
  /* 门扇：白色四格面板门、黑色圆把手。每扇单独一个绕门轴转的组，默认关着；进屋探索里点门开 / 关（plate.js 转动 pivot）。
     side = 往墙哪一侧开（开向房间） */
  C.doors = [];
  function doorLeaf(G, w, s, z, side) {
    var dx = w.b[0] - w.a[0], dy = w.b[1] - w.a[1], L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, nx = -uy * side, ny = ux * side, dw = P.doorW, dh = P.doorH - 0.02, lw = dw - 0.03;
    var pivot = new THREE.Group(); pivot.name = 'door'; pivot.position.set(w.a[0] + ux * (s - dw / 2) + nx * (w.t / 2 - 0.03), w.a[1] + uy * (s - dw / 2) + ny * (w.t / 2 - 0.03), z);
    var base = Math.atan2(uy, ux), b = new C.Kit.Batch();
    b.box('paintWhite', 0.015, -0.02, 0, lw + 0.015, 0.02, dh);
    [0.55, 1.55].forEach(function (zc) { [-1, 1].forEach(function (k) { [0.22, 0.56].forEach(function (u) { var x0 = lw * u + 0.03 - lw * 0.15; b.box('paintCream', x0, k > 0 ? 0.02 : -0.024, zc - 0.38, x0 + lw * 0.3, k > 0 ? 0.024 : -0.02, zc + 0.38); }); }); });
    [-1, 1].forEach(function (k) { b.cyl('ironBlack', lw - 0.06, k * 0.045, 0.94, 1.0, 0.028, 0.028, 10); });
    b.build(pivot, C.mats); G.add(pivot);
    pivot.rotation.z = base; C.doors.push({ pivot: pivot, base: base, side: side, open: false, a: 0 });
  }
  /* 真实灯光：每个吊灯 / 台灯一盏暖色点光源；walk = 外景进门路上那几盏（外景只建这几盏） */
  C.lamps = [];
  function lampLight(G, x, y, z, I, dist, walk) {
    if (C.lampMode === 'walk' && !walk) return;
    var l = new THREE.PointLight(0xffc77d, I * 2.6, dist * 1.2, 1.5); l.position.set(x, y, z); l.castShadow = false; l.name = 'lamp'; G.add(l); C.lamps.push({ light: l, base: l.intensity, walk: !!walk });
  }
  C.setLampLevel = function (k) { C.lamps.forEach(function (o) { o.light.intensity = o.base * k; }); };

  /* ================= 各房间 ================= */
  /* 可以坐 / 躺的地方（进屋探索里小人用）：工程坐标，o.r 是正面朝向，h 座高（躺：床面高），n 个位子沿宽排开 */
  C.seats = [];
  function seat(o, h, n, span) { n = n || 1; for (var i = 0; i < n; i++) { var lx = n > 1 ? (i - (n - 1) / 2) * span : 0, p = at(o, lx, 0.05); C.seats.push({ x: p[0], y: p[1], z: o.z, r: o.r || 0, h: h, kind: 'sit' }); } }
  function berth(o, top) { C.seats.push({ x: o.x, y: o.y, z: o.z, r: o.r || 0, h: top, kind: 'lie' }); }   /* 床：o 是床的中心，床头在局部 +ly */
  C.buildFurnishings = function (G) {
    C.lamps = []; C.seats = []; C.doors = []; C.features = [];
    var K = C.Kit, F1 = P.floor1Z, F2 = P.floor2Z, W = P.mainHalfW, X0 = -W + P.wallExt, X1 = W - P.wallExt, YF = P.wallExt, YR = P.mainDepth - P.wallExt, YRN = YR + P.rearStep;
    var g0 = new K.Batch(), g1 = new K.Batch(), g2 = new K.Batch(), gk = new K.Batch(), gs = new K.Batch();
    var z0 = 0.02, z1 = F1 + 0.02, z2 = F2 + 0.02, c0 = F1 - P.slabT, c1 = F2 - P.slabT, cA = F2 + P.atticCeil, i, k;
    var zgT = 2.35, zfT = P.eaveZ - 0.13;

    /* ======== 大厅（第 9 页）：楼梯蘑菇棕底、米色边条的地毯；门口赤陶地砖和椰棕垫，里面一块；白色柱式暖气片、粉色牡丹；
       白色护墙线；两盏乳白玻璃球吊灯 ======== */
    var r = P.floor1Z / P.stairRise1, gq = (P.stairY0 - P.stairYF) / 8, rx0 = P.stairXE + 0.1, rx1 = P.stairXN - 0.1;
    for (i = 1; i <= 8; i++) { var h = i * r, ya = P.stairY0 - i * gq, yb = P.stairY0 - (i - 1) * gq; g0.box('runner', rx0, ya, h, rx1, yb, h + 0.012); g0.box('runnerPlain', rx0, yb - 0.012, h - r, rx1, yb, h); }
    g0.box('terracotta', -0.62, YF, z0, 0.62, 0.95, z0 + 0.008); g0.box('coir', -0.38, 0.4, z0 + 0.008, 0.38, 0.85, z0 + 0.025); g0.box('coir', -0.5, 1.3, z0, 0.3, 1.85, z0 + 0.018);
    radiator(g0, -0.92, 0.55, -0.8, 1.4, z0, 0.7);
    table(g0, O(-0.72, 3.2, PI / 2, z0), 0.8, 0.34, 0.82, 'woodWalnut'); vase(g0, -0.72, 3.2, z0 + 0.82, 1.5, 'bloom');
    g0.box('paintWhite', -0.92, YF, z0 + 0.92, -0.9, 1.75, z0 + 0.96); g0.box('paintWhite', -0.92, 2.65, z0 + 0.92, -0.9, 3.86, z0 + 0.96);
    globe(g0, -0.3, 1.25, c0, 0.35); globe(g0, -0.3, 2.9, c0, 0.35);

    /* ======== 客厅 Drawing Room（第 6 页） ======== */
    rug(G.ground, 'rugAgra', -4.95, 1.0, -2.0, 5.3, 0);
    /* 壁炉：深炭灰铸铁壁炉罩、两侧蓝白代尔夫特瓷砖、黑石板炉前石、铜护栏；上方一面很高的金框壁镜，顶上金色横饰 */
    var fx = X0 + 0.47, fy0 = 2.82, fy1 = 4.28;
    g0.box('paintCharcoal', fx, fy0, z0, fx + 0.1, fy0 + 0.22, z0 + 1.18); g0.box('paintCharcoal', fx, fy1 - 0.22, z0, fx + 0.1, fy1, z0 + 1.18);
    g0.box('paintCharcoal', fx, fy0, z0 + 0.95, fx + 0.1, fy1, z0 + 1.18); g0.box('paintCharcoal', fx - 0.02, fy0 - 0.06, z0 + 1.18, fx + 0.2, fy1 + 0.06, z0 + 1.24);
    g0.box('delftTile', fx + 0.035, fy0 + 0.22, z0 + 0.1, fx + 0.045, fy0 + 0.4, z0 + 0.95); g0.box('delftTile', fx + 0.035, fy1 - 0.4, z0 + 0.1, fx + 0.045, fy1 - 0.22, z0 + 0.95);
    g0.box('range', fx + 0.035, fy0 + 0.4, z0 + 0.1, fx + 0.04, fy1 - 0.4, z0 + 0.8);
    g0.box('slate', fx - 0.05, fy0 - 0.15, z0, fx + 0.5, fy1 + 0.15, z0 + 0.06);   /* 比原有的石炉前台高 1 cm，顶面不重合（不闪） */
    for (i = 0; i < 8; i++) g0.box('brass', fx + 0.15, fy0 + 0.35 + i * (fy1 - fy0 - 0.7) / 7, z0 + 0.03, fx + 0.17, fy0 + 0.36 + i * (fy1 - fy0 - 0.7) / 7, z0 + 0.6);
    g0.box('brass', fx + 0.15, fy0 + 0.35, z0 + 0.58, fx + 0.17, fy1 - 0.35, z0 + 0.62);
    mirror(g0, 'x', X0 + 0.4, 2.95, 4.15, z0 + 1.26, z0 + 2.45, 1, 'gilt', 0.09); g0.box('gilt', X0 + 0.4, 2.9, z0 + 2.45, X0 + 0.48, 4.2, z0 + 2.6);
    vase(g0, fx + 0.35, fy1 - 0.1, z0 + 0.03, 1.6, 'bloom'); [3.0, 3.5, 4.0].forEach(function (y) { g0.cyl('ceramic', fx + 0.1, y, z0 + 1.24, z0 + 1.36, 0.04, 0.05, 10); });
    standardLamp(g0, -5.2, 4.65, z0, 'shadeNavy', 1.4);
    /* 黄油色卷扶手大沙发，背靠大厅那面墙、对着壁炉；六个靠垫：青绿、灰蓝、红 */
    rollSofa(g0, O(-1.85, 3.75, -PI / 2, z0), 2.45, 'fabButter', ['fabTeal', 'fabGreyBlue', 'fabRed', 'fabRed', 'fabTeal', 'fabGreyBlue']);
    roundTable(g0, -1.62, 5.3, z0, 0.28, 0.6, 'woodWalnut'); lamp(g0, -1.62, 5.3, z0 + 0.6, 'brass', 'shadeRed', 'cone');
    bookcase(g0, O(-1.35, 5.75, -PI / 2, z0), 1.3, 2.3, 0.32, 'books', 'paintCream');
    bureau(g0, O(-1.45, 1.05, -PI / 2, z0), 1.0); lamp(g0, -1.42, 0.78, z0 + 1.05, 'jar', 'shadeNavy', 'cone', 0.9); ovalChair(g0, O(-2.05, 1.05, PI / 2, z0), 'paintGrey', 'fabGreyBlue');
    canvasArt(g0, G.ground, 'artOld', 'x', -1.175, 1.05, z0 + 1.85, 0.62, 0.5, -1, 'gilt');
    chaise(g0, O(-3.42, -0.55, PI, z0), 1.75);
    standardLamp(g0, -3.42, -1.05, z0, 'shade', 1.35);
    ovalChair(g0, O(-4.9, 0.6, PI * 0.82, z0), 'paintGrey', 'fabBuffalo');
    armoire(g0, O(X0 + 0.32, 1.75, PI / 2, z0), 1.35, 2.35, 'paintStone', 'gilt');
    bergere(g0, O(-4.45, 2.55, PI * 0.72, z0));
    flushLight(g0, -3.42, 3.3, c0); flushLight(g0, -3.42, -0.4, c0);
    bayDress(g0, P.bayS, zgT, z0, { roller: 'fabLinen', curtain: 'fabCrewel', pelmet: 'fabCrewel', radiator: true, z: z0 });

    /* ======== 餐厅（第 9 页） ======== */
    rug(G.ground, 'rugAubusson', 2.55, 0.75, 4.95, 3.55, 0);
    refectory(g0, O(3.76, 2.1, 0, z0), 0.95, 2.1);
    [1.45, 2.1, 2.75].forEach(function (y) { ovalChair(g0, O(3.0, y, PI / 2, z0), 'paintGrey', 'fabCream'); ovalChair(g0, O(4.52, y, -PI / 2, z0), 'paintGrey', 'fabCream'); });
    ovalChair(g0, O(3.76, 0.75, PI, z0), 'paintGrey', 'fabCream');
    chest(g0, O(X1 - 0.27, 2.0, -PI / 2, z0), 1.25, 0.88, 'paintCream', 3, 'brass', 0.5); vase(g0, X1 - 0.27, 2.25, z0 + 0.88, 1.2, 'bloom'); lamp(g0, X1 - 0.27, 1.55, z0 + 0.88, 'jar', 'shade', 'pleat', 0.8);
    cornerCupboard(g0, X1, YF, -1, 1, z0 + 1.45, z0 + 2.25);
    lattice(g0, O(1.79 + 0.27, 3.0, PI / 2, z0), 1.15, 2.1);
    chandelier(g0, 3.76, 2.1, c0, 'brass', 5, 'shade', 0.6);
    armchair(g0, O(X1 - 0.6, 3.3, -PI * 0.78, z0), 'fabChintzGreen');
    tufted(g0, O(2.4, 3.45, 0, z0), 0.5, 0.4, 0.45, 'fabRed', 'woodDark');
    canvasArt(g0, G.ground, 'artWater', 'x', X1, 2.0, z0 + 1.6, 0.55, 0.32, -1, 'gilt');
    bayDress(g0, P.bayN, zgT, z0, { curtain: 'fabPeacock', roller: 'fabLinen', radiator: true, z: z0 });

    /* ======== 小起居室 Snug（第 9 页）+ 第 7 页蓝白小房子收藏架 ======== */
    rug(G.ground, 'rugTerra', 2.3, 4.35, 5.0, 6.3, 0);
    bookcase(g0, O(2.95, YRN - 0.18, 0, z0), 1.2, 2.45, 0.34, 'books', 'paintSage', true); bookcase(g0, O(5.15, YRN - 0.18, 0, z0), 1.05, 2.45, 0.34, 'books', 'paintSage', true);
    g0.box('fabStripeBlind', 3.45, YRN - 0.06, z0 + 1.85, 4.55, YRN - 0.02, z0 + 2.35);
    armchair(g0, O(3.15, 5.85, PI * 0.88, z0), 'fabTartan', true);
    armchair(g0, O(4.75, 4.55, -PI * 0.7, z0), 'fabCoral'); armchair(g0, O(5.05, 5.55, -PI * 0.55, z0), 'fabCoral');
    cushion(g0, 'fabHound', O(4.75, 4.55, -PI * 0.7, z0), 0, 0.22, 0.68, 0.36, 0.34, 0.12, -0.3); cushion(g0, 'fabPinkCheck', O(5.05, 5.55, -PI * 0.55, z0), 0, 0.22, 0.68, 0.36, 0.34, 0.12, -0.3);
    g0.box('paintSage', X1 - 0.3, 4.3, z0 + 1.5, X1, 5.5, z0 + 1.55);
    table(g0, O(X1 - 0.25, 4.9, -PI / 2, z0), 0.8, 0.4, 0.74, 'woodLight'); lamp(g0, X1 - 0.25, 5.15, z0 + 0.74, 'brass', 'shadeRed', 'drum', 0.8);
    g0.box('fabRed', X1 - 0.45, 4.2, z0, X1 - 0.15, 4.45, z0 + 0.25);
    chandelier(g0, 3.9, 5.25, c0, 'brass', 5, 'shadeAmber', 0.6);
    tripodLamp(g0, 5.3, 6.35, z0);
    bookcase(g0, O(1.42, 5.6, PI / 2, z0), 1.5, 2.3, 0.3, 'delft', 'paintSage');

    /* 卫生间（无照片） */
    g0.cyl('ceramic', 0.6, 6.15, z0, z0 + 0.4, 0.17, 0.2, 14); g0.box('ceramic', 0.38, 6.3, z0 + 0.4, 0.82, YR, z0 + 0.8);
    g0.box('ceramic', -0.92, 5.4, z0 + 0.78, -0.5, 5.9, z0 + 0.88); g0.cyl('ceramic', -0.72, 5.65, z0, z0 + 0.78, 0.08, 0.06, 8); mirror(g0, 'x', -0.92, 5.4, 5.9, z0 + 1.1, z0 + 1.7, 1, 'gilt');

    /* ======== 厨房（第 4–5 页） ======== */
    var kx0 = W + 0.02, kx1 = P.kitX1 - 0.3, ky0 = P.kitY0 + 0.3, ky1 = P.kitY1 - 0.02, ix = 8.3;
    gk.box('ktile', kx0, ky0, 0.02, kx1, ky1, 0.03);
    gk.box('ktile', P.kitRearBayX0 + 0.25, ky1, 0.02, P.kitRearBayX1 - 0.25, P.kitY1 + P.kitRearBayProj - 0.25, 0.03);
    /* 西墙：通顶奶白高光高柜，竖向长条不锈钢拉手，嵌不锈钢烤箱两台和微波炉 */
    gk.box('gloss', kx0, 1.75, 0.03, kx0 + 0.62, 6.0, 2.32);
    for (i = 0; i <= 7; i++) gk.box('quartz', kx0 + 0.62, 1.75 + i * 0.6 - 0.004, 0.05, kx0 + 0.626, 1.75 + i * 0.6 + 0.004, 2.3);
    for (i = 0; i < 7; i++) if (i !== 3) gk.box('steel', kx0 + 0.63, 1.75 + i * 0.6 + 0.08, 0.95, kx0 + 0.65, 1.75 + i * 0.6 + 0.1, 1.85);
    [[0.95, 1.5], [1.55, 1.95], [2.0, 2.25]].forEach(function (q) { gk.box('steel', kx0 + 0.62, 3.6, q[0], kx0 + 0.63, 4.3, q[1]); gk.box('ovenGlass', kx0 + 0.63, 3.68, q[0] + 0.07, kx0 + 0.635, 4.22, q[1] - 0.12); });
    /* 北墙：地柜 + 厚石英台面 + 白玻璃挡水板；中间炉灶凹位：黑色四门 AGA 炉、两个镀铬圆盖、横杆，上方大炉台搁板、钟、斜插进烟囱的黑烟管 */
    function baseRun(ya, yb) {
      gk.box('gloss', kx1 - 0.62, ya, 0.12, kx1, yb, 0.88); gk.box('ktile', kx1 - 0.55, ya, 0.03, kx1, yb, 0.12); gk.box('quartz', kx1 - 0.66, ya, 0.88, kx1, yb, 0.94); gk.box('paintWhite', kx1 - 0.02, ya, 0.94, kx1, yb, 1.5);
      for (var z = 0.3; z < 0.85; z += 0.27) gk.box('steel', kx1 - 0.64, ya + 0.08, z, kx1 - 0.62, yb - 0.08, z + 0.02);
    }
    baseRun(1.2, 2.95); baseRun(4.35, 6.0);
    gk.box('paintCream', kx1 - 0.66, 2.95, 0.03, kx1, 3.05, 2.32); gk.box('paintCream', kx1 - 0.66, 4.25, 0.03, kx1, 4.35, 2.32);
    gk.box('paintCream', kx1 - 0.66, 2.95, 1.72, kx1, 4.35, 1.8); gk.box('paintCream', kx1 - 0.7, 2.9, 1.8, kx1, 4.4, 1.86);
    gk.box('steel', kx1 - 0.04, 3.45, 1.95, kx1, 3.85, 2.25);
    var ax = kx1 - 0.36; gk.box('range', kx1 - 0.7, 3.05, 0.04, kx1 - 0.05, 4.25, 0.9);
    [[3.35, 0.5], [3.95, 0.5], [3.35, 0.22], [3.95, 0.22]].forEach(function (q) { gk.box('range', kx1 - 0.715, q[0] - 0.24, q[1] + 0.02, kx1 - 0.7, q[0] + 0.24, q[1] + 0.3); gk.box('chrome', kx1 - 0.725, q[0] + 0.12, q[1] + 0.2, kx1 - 0.715, q[0] + 0.2, q[1] + 0.24); });
    gk.box('chrome', kx1 - 0.76, 3.05, 0.82, kx1 - 0.74, 4.25, 0.84);
    [3.35, 3.95].forEach(function (y) { gk.geom('chrome', new THREE.SphereGeometry(0.2, 16, 6, 0, 2 * PI, 0, PI / 2), new THREE.Matrix4().makeTranslation(ax, y, 0.9).multiply(new THREE.Matrix4().makeScale(1, 1, 0.45)).multiply(new THREE.Matrix4().makeRotationX(PI / 2))); });
    gk.cyl('range', ax + 0.15, 3.65, 0.9, 1.55, 0.065, 0.065, 12); gk.beam('range', [ax + 0.15, 3.65, 1.55], [kx1 - 0.05, 3.65, 1.75], 0.13, 0.13);
    gk.box('glossTaupe', kx1 - 0.35, 1.2, 1.55, kx1, 2.95, 2.25);
    /* 长岛台 */
    gk.box('gloss', ix - 0.5, 1.95, 0.1, ix + 0.5, 5.55, 0.86); gk.box('shade', ix - 0.45, 2.0, 0.03, ix + 0.45, 5.5, 0.1);
    gk.box('quartz', ix - 0.6, 1.85, 0.86, ix + 0.6, 5.65, 0.95); gk.box('quartz', ix - 0.6, 1.85, 0.03, ix + 0.6, 1.93, 0.86); gk.box('quartz', ix - 0.6, 5.57, 0.03, ix + 0.6, 5.65, 0.86);
    [-1, 1].forEach(function (s) { for (var z = 0.32; z < 0.85; z += 0.26) gk.box('steel', s > 0 ? ix + 0.5 : ix - 0.52, 2.1, z, s > 0 ? ix + 0.52 : ix - 0.5, 5.4, z + 0.02); });
    gk.box('range', ix - 0.32, 3.4, 0.95, ix + 0.32, 4.2, 0.955); gk.box('steel', ix - 0.22, 4.8, 0.945, ix + 0.22, 5.25, 0.952);
    gk.box('chrome', ix + 0.32, 5.0, 0.95, ix + 0.36, 5.04, 1.32); gk.box('chrome', ix + 0.13, 5.0, 1.28, ix + 0.36, 5.04, 1.32); gk.box('chrome', ix + 0.13, 5.0, 1.2, ix + 0.17, 5.04, 1.32);
    gk.box('steel', ix - 0.03, 1.9, 2.3, ix + 0.03, 5.6, 2.34);
    [2.3, 3.3, 4.3, 5.2].forEach(function (y) { saucer(gk, ix, y, 2.3, 1.72); });
    /* 前凸窗：一对奶白皮躺椅；奶白罗马帘 */
    var rec = O(P.kitBayX, -0.25, PI, 0.03); [-0.38, 0.38].forEach(function (lx) { piece(gk, 'leatherCream', rec, lx, 0, 0.36, 0.42, 0, 0.45); piece(gk, 'leatherCream', rec, lx, 0.32, 0.34, 0.1, 0.45, 0.95); piece(gk, 'leatherCream', rec, lx, 0.33, 0.25, 0.08, 0.95, 1.08); });
    [-1, 1].forEach(function (s) { piece(gk, 'leatherCream', rec, s * 0.8, 0, 0.06, 0.42, 0, 0.62); });
    alongPoly(gk, 'fabLinen', C.bayLine(P.kitBayX, P.kitY0, P.kitBayHalfW, P.kitBayReturn, P.kitBayCant).map(function (p) { return [p[0], p[1] + 0.32]; }), 1.7, 2.1, 0.02, true);
    /* 后面玻璃凸间：燕麦色 U 形卡座、白色圆角桌配镀铬独脚、果盘、竹编罗马帘 */
    var bx0 = P.kitRearBayX0 + 0.3, bx1 = P.kitRearBayX1 - 0.3, by1 = P.kitY1 + P.kitRearBayProj - 0.3, by0 = P.kitY1 + 0.05;
    gk.box('fabOatmeal', bx0, by1 - 0.5, 0.03, bx1, by1, 0.46); gk.box('fabOatmeal', bx0, by1 - 0.12, 0.46, bx1, by1, 0.92);
    gk.box('fabOatmeal', bx0, by0, 0.03, bx0 + 0.5, by1, 0.46); gk.box('fabOatmeal', bx0, by0, 0.46, bx0 + 0.12, by1, 0.92);
    gk.box('fabOatmeal', bx1 - 0.5, by0 + 0.3, 0.03, bx1, by1, 0.46); gk.box('fabOatmeal', bx1 - 0.12, by0 + 0.3, 0.46, bx1, by1, 0.92);
    [[bx0 + 0.3, by1 - 0.3], [bx1 - 0.35, by1 - 0.3]].forEach(function (q) { cushion(gk, 'fabCream', O(q[0], q[1], 0, 0.03), 0, 0, 0.7, 0.42, 0.38, 0.12, -0.3); });
    var tx = (bx0 + bx1) / 2, ty = by1 - 0.95; gk.geom('quartz', new THREE.CylinderGeometry(1, 1, 0.04, 28), new THREE.Matrix4().makeTranslation(tx, ty, 0.76).multiply(new THREE.Matrix4().makeScale(0.7, 0.42, 1)).multiply(new THREE.Matrix4().makeRotationX(PI / 2)));
    gk.cyl('chrome', tx, ty, 0.03, 0.74, 0.04, 0.04, 10); gk.cyl('chrome', tx, ty, 0.03, 0.06, 0.25, 0.25, 18);
    gk.cyl('ceramic', tx, ty, 0.78, 0.86, 0.12, 0.18, 18); for (i = 0; i < 4; i++) ball(gk, 'fruit', O(tx, ty, 0, 0), (i - 1.5) * 0.06, 0.02, 0.86, 0.04);
    gk.box('bamboo', bx0 - 0.2, by1 + 0.18, 1.6, bx1 + 0.2, by1 + 0.22, 2.12);
    saucer(gk, tx, ty, 2.35, 1.6);

    /* ======== 阳光房（第 8 页） ======== */
    var sx0 = P.sunX0 + 0.25, sx1 = P.sunX1 - 0.25, sy0 = P.mainDepth, sy1 = P.mainDepth + P.sunProj - 0.25;
    gs.box('limestone', sx0, sy0, 0.02, sx1, sy1, 0.03);
    rollSofa(gs, O(-3.35, sy1 - 0.6, 0, 0.03), 2.05, 'fabPeony', ['fabPeony', 'fabPeony'], 'brass');
    rollSofa(gs, O(sx0 + 0.55, 8.4, PI / 2, 0.03), 1.9, 'fabPeony', ['fabPeony'], 'brass');
    (function (o) { var pts = []; for (var a = 0; a <= 12; a++) { var t = PI * a / 12; pts.push(at(o, Math.cos(t) * 0.5, -Math.sin(t) * 0.35)); } if (THREE.ShapeUtils.isClockWise(pts.map(function (p) { return new THREE.Vector2(p[0], p[1]); }))) pts.reverse(); gs.prism('paintGrey', pts, o.z + 0.72, o.z + 0.76); [0.15, 0.5, 0.85].forEach(function (u) { var t = PI * u, p = at(o, Math.cos(t) * 0.42, -Math.sin(t) * 0.28); gs.cyl('paintGrey', p[0], p[1], o.z, o.z + 0.72, 0.02, 0.028, 8); }); })(O(sx0 + 0.28, sy1 - 0.42, PI * 0.75, 0.03));
    frames(gs, sx0 + 0.1, sy1 - 0.55, 0.79, 9, 0.11, 0.1); lamp(gs, sx0 + 0.25, sy1 - 0.25, 0.79, 'jar', 'shade', 'pleat', 1.1);
    gs.box('woodDark', sx0 + 0.45, sy1 - 0.65, 0.79, sx0 + 0.75, sy1 - 0.45, 0.81); gs.cyl('ceramic', sx0 + 0.55, sy1 - 0.55, 0.81, 0.95, 0.05, 0.06, 10);
    victorianChair(gs, O(sx1 - 0.5, sy1 - 0.65, -PI * 0.85, 0.03));
    lamp(gs, sx1 - 0.12, sy1 - 1.4, 0.58, 'brass', 'shadeCheck', 'drum', 0.9); gs.cyl('ceramic', sx1 - 0.12, sy1 - 0.9, 0.58, 0.78, 0.08, 0.1, 12);
    tole(gs, -3.45, 8.55, 2.75);
    alongPoly(gs, 'bamboo', [[sx0 + 0.05, sy0 + 0.4], [sx0 + 0.05, sy1 - 0.05], [sx1 - 0.05, sy1 - 0.05], [sx1 - 0.05, sy0 + 0.4]], 1.75, 2.2, 0.015, false);

    /* ======== 二楼 · 卧室 1（第 10 页） ======== */
    g1.box('carpet', 1.82, YF, F1 + 0.02, X1, 3.82, F1 + 0.03);
    var b1 = O(X1 - 1.15, 2.1, -PI / 2, z1);
    piece(g1, 'paintWhite', b1, 0, 0, 0.82, 1.06, 0.1, 0.3); piece(g1, 'fabLinen', b1, 0, 0.03, 0.8, 1.02, 0.3, 0.52);
    piece(g1, 'fabToile', b1, 0, -0.12, 0.86, 0.94, 0.28, 0.58); piece(g1, 'fabToile', b1, 0, -1.04, 0.86, 0.03, 0.08, 0.58); [-1, 1].forEach(function (s) { piece(g1, 'fabToile', b1, s * 0.86, -0.1, 0.03, 0.95, 0.08, 0.58); });
    [-0.4, 0.4].forEach(function (lx) { cushion(g1, 'fabToile', b1, lx, 0.85, 0.66, 0.66, 0.32, 0.14, -0.25); }); cushion(g1, 'fabToile', b1, 0, 0.72, 0.68, 0.36, 0.3, 0.1, -0.2);
    piece(g1, 'fabToile', b1, 0, 1.1, 0.88, 0.06, 0.1, 1.15); g1.geom('fabToile', new THREE.CylinderGeometry(0.88, 0.88, 0.12, 24, 1, false, -PI / 2, PI), M(b1, 0, 1.1, 1.15, PI / 2, 0, 0, 1, 1, 0.3));
    var cz = z1 + 2.25; g1.geom('gilt', new THREE.CylinderGeometry(0.32, 0.32, 0.12, 14, 1, false, PI, PI), new THREE.Matrix4().makeTranslation(X1 - 0.02, 2.1, cz)); g1.box('fabToile', X1 - 0.25, 1.8, cz - 0.12, X1 - 0.02, 2.4, cz);
    [[1.55, 1.15], [2.65, 3.05]].forEach(function (q) { g1.beam('fabToile', [X1 - 0.15, q[0] + (q[0] < 2 ? 0.25 : -0.25), cz - 0.05], [X1 - 0.5, q[1], z1 + 1.15], 0.3, 0.05); g1.box('fabToile', X1 - 0.6, Math.min(q[1], q[1] + (q[0] < 2 ? -0.18 : 0.18)), z1, X1 - 0.4, Math.max(q[1], q[1] + (q[0] < 2 ? -0.18 : 0.18)), z1 + 1.2); });
    g1.box('fabTaupe', X1 - 0.04, 1.7, z1 + 1.2, X1 - 0.02, 2.5, cz - 0.1);
    [0.75, 3.45].forEach(function (y) { bedside(g1, O(X1 - 0.27, y, -PI / 2, z1), 'paintWhite', 0.66); lamp(g1, X1 - 0.27, y, z1 + 0.66, 'jar', 'shade', 'pleat'); mirror(g1, 'x', X1, y - 0.17, y + 0.17, z1 + 1.35, z1 + 1.8, -1, 'gilt', 0.04); });
    slipperChair(g1, O(2.55, 1.0, PI * 0.72, z1), 'fabBuffalo');
    tufted(g1, O(X1 - 2.35, 2.1, -PI / 2, z1), 1.3, 0.42, 0.46, 'fabBuffalo', 'paintCream');
    chest(g1, O(P.bayN, -0.75, PI, z1), 1.1, 0.88, 'paintSage', 3, 'ceramic', 0.48); g1.cyl('jar', P.bayN + 0.3, -0.75, z1 + 0.88, z1 + 1.1, 0.12, 0.14, 14); lamp(g1, P.bayN + 0.3, -0.75, z1 + 1.1, 'brass', 'shade', 'cone', 0.8);
    chandelier(g1, P.bayN, -0.4, c1, 'gilt', 6, null, 0.4); chandelier(g1, 3.6, 2.1, c1, 'gilt', 5, null, 0.35);
    bayDress(g1, P.bayN, zfT, z1, { roller: 'fabLinen', curtain: 'fabTaupe' });
    canvasArt(g1, G.first, 'artWater', 'y', 3.825, 2.6, z1 + 1.65, 0.55, 0.35, -1, 'gilt');

    /* ======== 卧室 2（第 13–15 页） ======== */
    g1.box('carpetBlue', X0, YF, F1 + 0.02, -1.02, 3.31, F1 + 0.03);
    var b2 = O(X0 + 1.1, 1.85, PI / 2, z1);
    piece(g1, 'paintWhite', b2, 0, 0, 0.78, 1.05, 0.15, 0.32); piece(g1, 'fabLinen', b2, 0, 0.02, 0.76, 1.0, 0.32, 0.54); piece(g1, 'fabBedStripe', b2, 0, -0.12, 0.8, 0.92, 0.3, 0.58);
    [-0.38, 0.38].forEach(function (lx) { cushion(g1, 'fabBedStripe', b2, lx, 0.85, 0.66, 0.62, 0.3, 0.14, -0.2); });
    [[1.08, 1.15], [-1.1, 0.75]].forEach(function (q) { var din = q[0] > 0 ? -0.045 : 0.045; piece(g1, 'paintWhite', b2, 0, q[0], 0.82, 0.04, 0.15, q[1]); piece(g1, 'fabTicking', b2, 0, q[0] + din, 0.7, 0.008, 0.35, q[1] - 0.12); piece(g1, 'frieze', b2, 0, q[0] + din, 0.78, 0.008, q[1] - 0.1, q[1] - 0.02);
      [-1, 1].forEach(function (s) { piece(g1, 'paintWhite', b2, s * 0.82, q[0], 0.05, 0.05, 0, q[1] + 0.05); ball(g1, 'paintWhite', b2, s * 0.82, q[0], q[1] + 0.12, 0.05, 1, 1, 1.4); }); });
    [0.65, 3.05].forEach(function (y) { bedside(g1, O(X0 + 0.27, y, PI / 2, z1), 'paintWhite', 0.66, 'frieze'); g1.cyl('jar', X0 + 0.27, y, z1 + 0.14, z1 + 0.36, 0.1, 0.11, 14); lamp(g1, X0 + 0.27, y, z1 + 0.66, 'jar', 'shade', 'square'); });
    canvasArt(g1, G.first, 'artSea', 'x', X0, 1.85, z1 + 1.75, 0.62, 0.45, 1, 'gilt');
    armchair(g1, O(X0 + 0.55, 3.0, PI * 0.62, z1), 'fabPeacock');
    bayDress(g1, P.bayS, zfT, z1, { blind: 'fabPinkCheck', roller: 'fabLinen', seat: 'fabRaspberry', z: z1 });
    [[-3.9, -0.95], [-2.95, -0.95], [-4.55, -0.4]].forEach(function (q, kk) { cushion(g1, kk === 2 ? 'fabPink' : 'fabPinkCheck', O(q[0], q[1], PI, z1), 0, 0, 0.7, 0.36, 0.34, 0.12, -0.25); });
    var dsk = O(-1.55, 0.6, PI, z1); table(g1, dsk, 1.0, 0.48, 0.76, 'paintWhite'); piece(g1, 'paintWhite', dsk, 0, 0.16, 0.48, 0.08, 0.76, 0.98); for (k = 0; k < 4; k++) piece(g1, 'paintCream', dsk, -0.36 + k * 0.24, 0.1, 0.1, 0.02, 0.8, 0.94);
    (function () { var x = -1.55, y = YF + 0.02; g1.geom('gilt', new THREE.TorusGeometry(1, 0.06, 6, 24), new THREE.Matrix4().makeTranslation(x, y + 0.03, z1 + 1.5).multiply(new THREE.Matrix4().makeScale(0.26, 1, 0.19)).multiply(new THREE.Matrix4().makeRotationX(PI / 2))); g1.geom('mirror', new THREE.CylinderGeometry(1, 1, 0.01, 24), new THREE.Matrix4().makeTranslation(x, y + 0.035, z1 + 1.5).multiply(new THREE.Matrix4().makeScale(0.25, 1, 0.18))); g1.beam('brass', [x - 0.15, y + 0.03, z1 + 1.66], [x, y + 0.03, z1 + 1.95], 0.01, 0.01); g1.beam('brass', [x + 0.15, y + 0.03, z1 + 1.66], [x, y + 0.03, z1 + 1.95], 0.01, 0.01); })();
    lamp(g1, -1.95, 0.62, z1 + 0.98, 'jar', 'shadeRed', 'cone', 0.9); ovalChair(g1, O(-1.55, 1.15, PI, z1), 'paintWhite', 'fabTicking');
    tufted(g1, O(X0 + 2.35, 1.85, PI / 2, z1), 1.25, 0.4, 0.46, 'fabTicking', 'paintWhite');
    crystalDrop(g1, -3.42, -0.45, c1); crystalDrop(g1, -3.42, 1.85, c1);

    /* ======== 书房（平面图 STUDY，无照片） ======== */
    rug(G.first, 'rugStudy', -4.9, 4.0, -2.2, 6.1, F1);
    table(g1, O(X0 + 0.55, 5.4, PI / 2, z1), 1.5, 0.75, 0.76, 'woodDark'); ovalChair(g1, O(X0 + 1.25, 5.4, PI / 2, z1), 'woodDark', 'leather');
    g1.cyl('brass', X0 + 0.45, 4.95, z1 + 0.76, z1 + 1.08, 0.012, 0.012, 6); g1.box('leatherGreen', X0 + 0.38, 4.85, z1 + 1.04, X0 + 0.52, 5.1, z1 + 1.12);
    g1.box('fabLinen', X0 + 0.55, 5.6, z1 + 0.76, X0 + 0.8, 5.85, z1 + 0.79);
    /* 书桌上：一台老式打字机（墨绿机身、三排圆键、滚筒和一张纸）、墨水瓶和一支羽毛笔。进屋探索时点它们 → 进 Minest 打开打字机 / 3D 字 */
    (function () {
      var tw = new THREE.Group(), b = new K.Batch(), dz = z1 + 0.76;
      b.box('enamelGreen', -0.2, -0.17, 0, 0.2, 0.14, 0.09); b.prism('enamelGreen', [[-0.2, 0.0], [0.2, 0.0], [0.2, 0.14], [-0.2, 0.14]], 0.09, 0.15);
      for (var row = 0; row < 3; row++) for (var c2 = 0; c2 < 9 - row; c2++) b.cyl(c2 % 4 ? 'ceramic' : 'chrome', -0.16 + row * 0.02 + c2 * 0.04, -0.13 + row * 0.045, 0.09 + row * 0.015, 0.11 + row * 0.015, 0.014, 0.014, 8);
      b.geom('range', new THREE.CylinderGeometry(0.035, 0.035, 0.46, 14), new THREE.Matrix4().makeTranslation(0, 0.1, 0.19).multiply(new THREE.Matrix4().makeRotationZ(PI / 2)));
      b.box('fabLinen', -0.11, 0.08, 0.2, 0.11, 0.1, 0.42); b.box('chrome', 0.23, 0.08, 0.17, 0.27, 0.1, 0.19);
      b.build(tw, C.mats); tw.rotation.z = PI / 2; tw.position.set(X0 + 0.5, 5.3, dz); tw.name = 'feat:typewriter'; G.first.add(tw); C.features.push({ id: 'typewriter', obj: tw });
      var ql = new THREE.Group(), q = new K.Batch();
      q.cyl('range', 0, 0, 0, 0.07, 0.04, 0.045, 12); q.cyl('woodDark', 0, 0, 0.07, 0.08, 0.02, 0.02, 8);
      q.geom('fabLinen', new THREE.ConeGeometry(0.03, 0.32, 8), new THREE.Matrix4().makeTranslation(0.05, 0.02, 0.22).multiply(new THREE.Matrix4().makeRotationY(0.4)).multiply(new THREE.Matrix4().makeRotationX(PI / 2)));
      q.beam('woodLight', [0, 0, 0.06], [0.1, 0.04, 0.38], 0.008, 0.008);
      q.build(ql, C.mats); ql.position.set(X0 + 0.4, 5.85, dz); ql.name = 'feat:quill'; G.first.add(ql); C.features.push({ id: 'quill', obj: ql });
    })();
    [-4.95, -3.85, -2.75].forEach(function (x) { bookcase(g1, O(x, 3.75, PI, z1), 1.05, 2.25); });
    armchair(g1, O(-1.75, 5.6, -PI * 0.7, z1), 'leather');
    g1.cyl('woodDark', -2.55, 6.15, z1, z1 + 0.6, 0.03, 0.05, 8); g1.geom('jar', new THREE.SphereGeometry(0.17, 14, 10), new THREE.Matrix4().makeTranslation(-2.55, 6.15, z1 + 0.78));
    standardLamp(g1, -1.45, 6.1, z1, 'shade');

    /* 浴室（无照片）；主卫（第 14 页）：深蓝洗手柜、米色大理石台面和挡水板、两个台下盆、入墙镀铬龙头、金框镜 */
    g1.box('ceramic', -0.75, YR - 0.75, z1, 1.0, YR, z1 + 0.58); g1.box('mirror', -0.6, YR - 0.62, z1 + 0.56, 0.85, YR - 0.13, z1 + 0.585);
    g1.box('paintNavy', X1 - 0.56, 4.25, z1 + 0.1, X1, 5.85, z1 + 0.82); g1.box('marble', X1 - 0.6, 4.2, z1 + 0.82, X1, 5.9, z1 + 0.86); g1.box('marble', X1 - 0.02, 4.2, z1 + 0.86, X1, 5.9, z1 + 1.12);
    [4.65, 5.45].forEach(function (y) { g1.cyl('ceramic', X1 - 0.3, y, z1 + 0.855, z1 + 0.865, 0.18, 0.18, 16); g1.box('chrome', X1 - 0.08, y - 0.02, z1 + 1.0, X1 - 0.02, y + 0.02, z1 + 1.04); g1.box('chrome', X1 - 0.18, y - 0.015, z1 + 1.0, X1 - 0.02, y + 0.015, z1 + 1.03); });
    for (k = 0; k < 3; k++) g1.box('paintNavy', X1 - 0.57, 4.3 + k * 0.52, z1 + 0.15, X1 - 0.56, 4.78 + k * 0.52, z1 + 0.78);
    mirror(g1, 'x', X1, 4.5, 5.6, z1 + 1.2, z1 + 1.95, -1, 'gilt', 0.05);
    g1.cyl('ceramic', 3.6, YRN - 0.3, z1, z1 + 0.4, 0.17, 0.2, 14); g1.box('ceramic', 3.38, YRN - 0.15, z1 + 0.4, 3.82, YRN, z1 + 0.8);

    /* ======== 阁楼（第 11–12 页） ======== */
    var k0 = P.kneeY0, k1 = P.kneeY1;
    g2.box('carpetBeige', X0, k0, F2 + 0.02, -0.99, k1, F2 + 0.03); g2.box('carpetBeige', 1.79, k0, F2 + 0.02, X1, k1, F2 + 0.03);
    /* 卧室 4：白色矮床、多彩刺绣花布弧形床头、白羽绒被；白床头柜配铜杆青绿灯罩台灯；奶白五斗柜；小黑铸铁壁炉和金框镜；墨绿锥形吊灯；青绿罗马帘；藤编洗衣凳 */
    var b4 = O(-3.1, k1 - 1.25, 0, z2);
    [-1, 1].forEach(function (s) { [-1, 1].forEach(function (t) { piece(g2, 'paintWhite', b4, s * 0.7, t * 0.95, 0.05, 0.05, 0, 0.2); }); }); piece(g2, 'paintWhite', b4, 0, 0, 0.78, 1.02, 0.18, 0.3);
    piece(g2, 'fabLinen', b4, 0, -0.08, 0.86, 0.98, 0.3, 0.58); [-0.38, 0.38].forEach(function (lx) { cushion(g2, 'fabLinen', b4, lx, 0.8, 0.64, 0.62, 0.3, 0.14, -0.2); });
    piece(g2, 'fabCrewelMulti', b4, 0, 1.06, 0.8, 0.05, 0.3, 1.0); g2.geom('fabCrewelMulti', new THREE.CylinderGeometry(0.8, 0.8, 0.1, 22, 1, false, -PI / 2, PI), M(b4, 0, 1.06, 1.0, PI / 2, 0, 0, 1, 1, 0.3));
    [-4.1, -2.1].forEach(function (x) { bedside(g2, O(x, k1 - 0.3, 0, z2), 'paintWhite', 0.58); lamp(g2, x, k1 - 0.3, z2 + 0.58, 'brass', 'shadeTeal', 'square', 0.9); });
    chest(g2, O(-1.45, k0 + 0.3, PI, z2), 0.95, 0.95, 'paintCream', 4, 'brass', 0.46);
    var fz = X0 + 0.38; g2.box('ironBlack', fz, 3.15, z2, fz + 0.06, 3.95, z2 + 0.95); g2.box('range', fz + 0.06, 3.35, z2 + 0.08, fz + 0.065, 3.75, z2 + 0.6); g2.box('paintWhite', fz, 3.05, z2 + 0.95, fz + 0.16, 4.05, z2 + 1.0); g2.box('slate', fz, 3.1, z2, fz + 0.35, 4.0, z2 + 0.03);
    mirror(g2, 'x', fz, 3.25, 3.85, z2 + 1.15, z2 + 1.85, 1, 'gilt', 0.08);
    coneShade(g2, -3.1, 3.5, cA, 0.35);
    g2.box('fabTealDeep', P.rearDormX - P.rearDormHalfW + 0.1, P.rearDormFaceY - 0.25, z2 + 1.35, P.rearDormX + P.rearDormHalfW - 0.1, P.rearDormFaceY - 0.2, z2 + 1.75);
    g2.box('woodLight', -4.9, k0 + 0.25, z2, -4.45, k0 + 0.7, z2 + 0.5); g2.box('paintCream', -4.95, k0 + 0.2, z2 + 0.5, -4.4, k0 + 0.75, z2 + 0.55);
    /* 卧室 3 / 儿童房：绿底红花沙发床、白色婴儿床、斑点木马、红格子扶手椅、暖气片、五斗柜和台灯、小壁炉和金框镜、红绿花布罗马帘、墨绿吊灯 */
    rollSofa(g2, O(2.75, 3.3, PI / 2, z2), 1.9, 'fabChintzGreen', ['fabChintzGreen'], 'woodDark');
    var cot = O(4.5, k1 - 0.55, 0, z2);
    piece(g2, 'paintWhite', cot, 0, 0, 0.62, 0.34, 0.3, 0.36); piece(g2, 'fabLinen', cot, 0, 0, 0.58, 0.3, 0.36, 0.44);
    for (i = 0; i <= 12; i++) [-1, 1].forEach(function (s) { post(g2, 'paintWhite', cot, -0.6 + i * 0.1, s * 0.32, 0.012, 0, 0.92); });
    [-1, 1].forEach(function (s) { piece(g2, 'paintWhite', cot, 0, s * 0.32, 0.64, 0.02, 0.9, 0.95); piece(g2, 'paintWhite', cot, s * 0.62, 0, 0.025, 0.34, 0, 0.98); });
    var rh = O(4.9, 2.35, -PI * 0.65, z2);
    ball(g2, 'dapple', rh, 0, 0, 0.66, 0.2, 1, 2.0, 0.85); ball(g2, 'dapple', rh, 0, -0.42, 0.9, 0.09, 1, 1.5, 1.3); ball(g2, 'dapple', rh, 0, -0.55, 0.98, 0.08, 1, 1.6, 0.8);
    piece(g2, 'fabRed', rh, 0, 0.02, 0.17, 0.15, 0.78, 0.83); piece(g2, 'woodDark', rh, 0, -0.36, 0.03, 0.14, 0.95, 1.08); piece(g2, 'woodDark', rh, 0, 0.45, 0.03, 0.04, 0.55, 0.8);
    [-1, 1].forEach(function (s) { [-1, 1].forEach(function (t) { var a = at(rh, s * 0.1, t * 0.26); g2.beam('dapple', [a[0], a[1], z2 + 0.56], [a[0], a[1], z2 + 0.14], 0.045, 0.045); });
      var p0 = at(rh, s * 0.13, -0.62), p1 = at(rh, s * 0.13, 0), p2 = at(rh, s * 0.13, 0.62); g2.beam('fabRed', [p0[0], p0[1], z2 + 0.17], [p1[0], p1[1], z2 + 0.05], 0.05, 0.05); g2.beam('fabRed', [p1[0], p1[1], z2 + 0.05], [p2[0], p2[1], z2 + 0.17], 0.05, 0.05); });
    armchair(g2, O(2.6, k0 + 0.6, PI * 0.8, z2), 'fabTartanRed');
    radiator(g2, 1.95, k1 - 0.14, 2.9, k1 - 0.04, z2, 0.6);
    chest(g2, O(X1 - 0.27, 2.55, -PI / 2, z2), 0.85, 0.8, 'paintCream', 3, 'brass', 0.44); lamp(g2, X1 - 0.27, 2.75, z2 + 0.8, 'jar', 'shade', 'pleat', 0.8);
    var fz2 = X1 - 0.38; g2.box('ironBlack', fz2 - 0.06, 3.0, z2, fz2, 3.85, z2 + 0.95); g2.box('range', fz2 - 0.065, 3.2, z2 + 0.08, fz2 - 0.06, 3.65, z2 + 0.6); g2.box('paintWhite', fz2 - 0.16, 2.9, z2 + 0.95, fz2, 3.95, z2 + 1.0);
    mirror(g2, 'x', fz2, 3.15, 3.7, z2 + 1.15, z2 + 1.85, -1, 'gilt', 0.08);
    coneShade(g2, 3.8, 3.0, cA, 0.35);
    g2.box('fabFloralRG', 2.2, k0 - 0.02, z2 + 1.25, 3.7, k0 + 0.02, z2 + 1.6);

    /* ======== 可以坐、躺的地方 ======== */
    seat(O(-1.85, 3.75, -PI / 2, z0), 0.5, 3, 0.72); seat(O(-3.42, -0.55, PI, z0), 0.42); seat(O(-4.45, 2.55, PI * 0.72, z0), 0.52); seat(O(-2.05, 1.05, PI / 2, z0), 0.5); seat(O(-4.9, 0.6, PI * 0.82, z0), 0.5);
    [1.45, 2.1, 2.75].forEach(function (y) { seat(O(3.0, y, PI / 2, z0), 0.5); seat(O(4.52, y, -PI / 2, z0), 0.5); }); seat(O(3.76, 0.75, PI, z0), 0.5); seat(O(X1 - 0.6, 3.3, -PI * 0.78, z0), 0.5);
    seat(O(3.15, 5.85, PI * 0.88, z0), 0.5); seat(O(4.75, 4.55, -PI * 0.7, z0), 0.5); seat(O(5.05, 5.55, -PI * 0.55, z0), 0.5);
    seat(O(P.kitBayX, -0.25, PI, 0.03), 0.45, 2, 0.76); seat(O(tx, by1 - 0.25, 0, 0.03), 0.46, 2, 0.75);
    seat(O(-3.35, sy1 - 0.6, 0, 0.03), 0.5, 3, 0.6); seat(O(sx0 + 0.55, 8.4, PI / 2, 0.03), 0.5, 2, 0.6); seat(O(sx1 - 0.5, sy1 - 0.65, -PI * 0.85, 0.03), 0.5);
    berth(O(X1 - 1.15, 2.1, -PI / 2, z1), 0.58); seat(O(2.55, 1.0, PI * 0.72, z1), 0.42);
    berth(O(X0 + 1.1, 1.85, PI / 2, z1), 0.58); seat(O(X0 + 0.55, 3.0, PI * 0.62, z1), 0.5); seat(O(-1.55, 1.15, PI, z1), 0.5);
    seat(O(X0 + 1.25, 5.4, PI / 2, z1), 0.5); seat(O(-1.75, 5.6, -PI * 0.7, z1), 0.5);
    berth(O(-3.1, k1 - 1.25, 0, z2), 0.58); seat(O(2.75, 3.3, PI / 2, z2), 0.5, 2, 0.7); seat(O(2.6, k0 + 0.6, PI * 0.8, z2), 0.5);

    /* ======== 门扇：每个室内门洞一扇，往房间里开（不挡走廊、楼梯口） ======== */
    var SIDE = { '0:0:0': 1, '0:1:0': -1, '0:2:0': 1, '0:3:0': -1, '0:4:0': 1, '1:0:0': 1, '1:0:1': 1, '1:1:0': -1, '1:3:0': 1, '1:4:0': -1, '2:0:0': 1, '2:1:0': -1, '2:12:0': 1 };
    [[0, G.ground, z0], [1, G.first, z1], [2, G.attic, z2]].forEach(function (f) {
      (C.interiorWalls ? C.interiorWalls(f[0]) : []).forEach(function (w, wi) { (w.d || []).forEach(function (c, di) { doorLeaf(f[1], w, C.wallAlong(w, c), f[2], SIDE[f[0] + ':' + wi + ':' + di] || 1); }); });
    });

    /* ======== 灯光（真实光源） ======== */
    globe(g1, 0.0, 2.0, c1, 0.4);
    lampLight(G.ground, -3.42, 3.3, c0 - 0.3, 1.1, 7); lampLight(G.ground, -1.62, 5.3, z0 + 1.0, 0.45, 3.5); lampLight(G.ground, -5.2, 4.65, z0 + 1.45, 0.5, 4); lampLight(G.ground, -3.42, -0.9, z0 + 1.4, 0.5, 4);
    lampLight(G.ground, -0.3, 1.9, c0 - 0.55, 0.9, 5, true);
    lampLight(G.ground, 3.76, 2.1, c0 - 0.75, 1.0, 6); lampLight(G.ground, 3.9, 5.25, c0 - 0.75, 0.8, 5); lampLight(G.ground, X1 - 0.25, 5.15, z0 + 1.1, 0.4, 3);
    lampLight(G.kitchen, ix, 3.8, 1.6, 1.2, 7); lampLight(G.kitchen, tx, ty, 1.5, 0.6, 4); lampLight(G.sunroom, -3.45, 8.55, 1.85, 0.9, 6);
    lampLight(G.first, 0.0, 2.0, c1 - 0.6, 0.8, 5, true);
    lampLight(G.first, 3.6, 2.1, c1 - 0.6, 1.0, 6); lampLight(G.first, X1 - 0.27, 0.75, z1 + 0.95, 0.4, 3); lampLight(G.first, -3.42, 1.85, c1 - 0.7, 0.8, 5); lampLight(G.first, X0 + 0.27, 3.05, z1 + 0.95, 0.4, 3);
    lampLight(G.first, X0 + 0.45, 4.95, z1 + 1.0, 0.7, 4, true); lampLight(G.first, -1.45, 6.1, z1 + 1.5, 0.6, 4, true);
    lampLight(G.attic, -3.1, 3.5, cA - 0.6, 0.7, 5); lampLight(G.attic, 3.8, 3.0, cA - 0.6, 0.6, 5);

    g0.build(G.ground, C.mats); g1.build(G.first, C.mats); g2.build(G.attic, C.mats); gk.build(G.kitchen, C.mats); gs.build(G.sunroom, C.mats);
  };
})();
