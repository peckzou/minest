/* Clun 室内 2.0 · 工具。1.0 的脚本（../clun/js/*.js）一个字不改，这里只在它们上面加东西：
   墙纸 / 瓷砖 / 画的贴图和材质、摆家具的小工具、房间表，以及「沿着一个房间的墙贴一圈」（墙纸、踢脚、护墙板、挂镜线、顶角线，
   遇到门洞和窗洞自动断开）。坐标同 1.0：工程坐标，+X 北、+Y 西（屋后）、+Z 上，单位米。 */
(function () {
  'use strict';
  var C = window.Clun, P = C.P, K = C.Kit, PI = Math.PI, V2 = C.V2 = {};
  var F1 = P.floor1Z, F2 = P.floor2Z, W = P.mainHalfW, T = P.wallExt;
  var D = V2.D = { F1: F1, F2: F2, X0: -W + T, X1: W - T, YF: T, YR: P.mainDepth - T, YRN: P.mainDepth - T + P.rearStep,
    z0: 0.02, z1: F1 + 0.02, z2: F2 + 0.02, c0: F1 - P.slabT, c1: F2 - P.slabT, cA: F2 + P.atticCeil, zgT: 2.35, zfT: P.eaveZ - 0.13 };

  /* ================= 贴图 ================= */
  var seed = 20261122;
  function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
  function cv(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function tex(c, pw, ph) { var t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.encoding = THREE.sRGBEncoding; t.anisotropy = 4; t.repeat.set(1 / pw, 1 / (ph || pw)); return t; }
  function once(c) { var t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 4; return t; }
  function tile9(g, w, h, x, y, fn) { for (var i = -1; i <= 1; i++) for (var j = -1; j <= 1; j++) { g.save(); g.translate(x + i * w, y + j * h); fn(g); g.restore(); } }   /* 画在边上的花样从对边接回来（无缝） */
  function petal(g, r, a, col, len) { g.save(); g.rotate(a); g.fillStyle = col; g.beginPath(); g.ellipse(len || r, 0, r, r * 0.42, 0, 0, 6.283); g.fill(); g.restore(); }

  function stripeW(bg, list, pw) {                      /* 竖条墙纸：list = [[位置 0..1, 宽 0..1, 颜色]] */
    var c = cv(128, 8), g = c.getContext('2d'); g.fillStyle = bg; g.fillRect(0, 0, 128, 8);
    list.forEach(function (s) { g.fillStyle = s[2]; g.fillRect(s[0] * 128, 0, s[1] * 128, 8); }); return tex(c, pw, 0.1);
  }
  function damask(bg, fg, pw) {                         /* 同色暗花：菱形排列的花头 */
    var w = 128, h = 192, c = cv(w, h), g = c.getContext('2d'); g.fillStyle = bg; g.fillRect(0, 0, w, h);
    [[w / 2, h / 4], [0, h * 3 / 4]].forEach(function (q) {
      tile9(g, w, h, q[0], q[1], function (g) {
        for (var i = 0; i < 6; i++) petal(g, 15, i * 1.047 + 0.52, fg, 20);
        g.fillStyle = bg; g.beginPath(); g.arc(0, 0, 7, 0, 6.283); g.fill(); g.fillStyle = fg; g.beginPath(); g.arc(0, 0, 3.5, 0, 6.283); g.fill();
        petal(g, 9, -1.571, fg, 46); petal(g, 9, 1.571, fg, 46); petal(g, 6, 0.6, fg, 44); petal(g, 6, 2.54, fg, 44); petal(g, 6, -0.6, fg, 44); petal(g, 6, -2.54, fg, 44);
      });
    });
    return tex(c, pw, pw * 1.5);
  }
  function sprig(bg, bloom, leaf, pw, dot) {            /* 小碎花：交错的小花枝 */
    var w = 128, c = cv(w, w), g = c.getContext('2d'); g.fillStyle = bg; g.fillRect(0, 0, w, w);
    [[32, 30, 0.2], [96, 94, -0.3]].forEach(function (q) {
      tile9(g, w, w, q[0], q[1], function (g) {
        g.rotate(q[2]); g.strokeStyle = leaf; g.lineWidth = 2; g.beginPath(); g.moveTo(0, 20); g.quadraticCurveTo(4, 6, 0, -6); g.stroke();
        petal(g, 7, -0.5, leaf, 9); petal(g, 7, PI + 0.5, leaf, 9); petal(g, 5, 0.9, leaf, 8);
        for (var i = 0; i < 5; i++) { g.save(); g.translate(0, -10); petal(g, 4.5, i * 1.257, bloom, 5); g.restore(); }
        g.fillStyle = dot || '#f2d98a'; g.beginPath(); g.arc(0, -10, 2.4, 0, 6.283); g.fill();
      });
    });
    return tex(c, pw);
  }
  function trellis(bg, line, bud, pw) {                 /* 斜格 + 交点上的小花苞 */
    var w = 96, c = cv(w, w), g = c.getContext('2d'); g.fillStyle = bg; g.fillRect(0, 0, w, w); g.strokeStyle = line; g.lineWidth = 2.2;
    for (var k = -1; k <= 2; k++) { g.beginPath(); g.moveTo(k * w - w, 0); g.lineTo(k * w, w); g.stroke(); g.beginPath(); g.moveTo(k * w, 0); g.lineTo(k * w - w, w); g.stroke(); }
    [[0, 0], [w / 2, w / 2]].forEach(function (q) { tile9(g, w, w, q[0], q[1], function (g) { for (var i = 0; i < 4; i++) petal(g, 4, i * 1.571 + 0.785, bud, 5); }); });
    return tex(c, pw);
  }
  function leaves(bg, cols, berry, pw) {                /* 莫里斯式的密叶：一片片叶子铺满，零星小浆果 */
    var w = 192, c = cv(w, w), g = c.getContext('2d'), i; g.fillStyle = bg; g.fillRect(0, 0, w, w);
    for (i = 0; i < 46; i++) (function (x, y, a, col, r) { tile9(g, w, w, x, y, function (g) { petal(g, r, a, col, r); g.strokeStyle = bg; g.lineWidth = 1; g.save(); g.rotate(a); g.beginPath(); g.moveTo(0, 0); g.lineTo(r * 2, 0); g.stroke(); g.restore(); }); })(rnd() * w, rnd() * w, rnd() * 6.283, cols[i % cols.length], 11 + rnd() * 7);
    for (i = 0; i < 14; i++) (function (x, y) { tile9(g, w, w, x, y, function (g) { g.fillStyle = berry; g.beginPath(); g.arc(0, 0, 3.2, 0, 6.283); g.fill(); }); })(rnd() * w, rnd() * w);
    return tex(c, pw);
  }
  function metro(tileC, grout, shade) {                 /* 白色小方砖，错缝 */
    var c = cv(128, 64), g = c.getContext('2d'); g.fillStyle = grout; g.fillRect(0, 0, 128, 64);
    function t(x, y) { g.fillStyle = tileC; g.fillRect(x + 1.5, y + 1.5, 61, 29); g.fillStyle = shade; g.fillRect(x + 1.5, y + 26, 61, 4.5); }
    t(0, 0); t(64, 0); t(-32, 32); t(32, 32); t(96, 32); return tex(c, 0.3, 0.15);
  }
  function checker(c1, c2, size) { var c = cv(64, 64), g = c.getContext('2d'); g.fillStyle = c1; g.fillRect(0, 0, 64, 64); g.fillStyle = c2; g.fillRect(0, 0, 32, 32); g.fillRect(32, 32, 32, 32); g.strokeStyle = 'rgba(0,0,0,0.18)'; g.lineWidth = 1; g.strokeRect(0, 0, 32, 32); g.strokeRect(32, 32, 32, 32); return tex(c, size * 2); }
  function encaustic() {                                /* 维多利亚几何地砖：米色八角 + 砖红菱形 + 黑色小方 */
    var w = 96, c = cv(w, w), g = c.getContext('2d'); g.fillStyle = '#e3d3ad'; g.fillRect(0, 0, w, w);
    function dia(x, y, r, col) { g.fillStyle = col; g.beginPath(); g.moveTo(x, y - r); g.lineTo(x + r, y); g.lineTo(x, y + r); g.lineTo(x - r, y); g.closePath(); g.fill(); }
    [[0, 0], [w, 0], [0, w], [w, w]].forEach(function (q) { dia(q[0], q[1], 26, '#9c4a33'); dia(q[0], q[1], 11, '#23211f'); });
    dia(w / 2, w / 2, 26, '#3f5d74'); dia(w / 2, w / 2, 11, '#e3d3ad');
    g.strokeStyle = 'rgba(60,40,20,0.35)'; g.lineWidth = 1.5; g.strokeRect(0, 0, w / 2, w / 2); g.strokeRect(w / 2, w / 2, w / 2, w / 2); g.strokeRect(w / 2, 0, w / 2, w / 2); g.strokeRect(0, w / 2, w / 2, w / 2);
    return tex(c, 0.42);
  }
  function oldMap() {                                   /* 书房墙上的老地图 */
    var Wd = 320, H = 200, c = cv(Wd, H), g = c.getContext('2d'), i, k; g.fillStyle = '#e6d3a4'; g.fillRect(0, 0, Wd, H);
    g.strokeStyle = 'rgba(110,80,40,0.35)'; g.lineWidth = 1; for (i = 1; i < 8; i++) { g.beginPath(); g.moveTo(i * 40, 0); g.lineTo(i * 40, H); g.stroke(); } for (i = 1; i < 5; i++) { g.beginPath(); g.moveTo(0, i * 40); g.lineTo(Wd, i * 40); g.stroke(); }
    [[70, 70, 46, '#b9a36a'], [95, 135, 26, '#a99560'], [185, 62, 40, '#c2ad73'], [200, 110, 34, '#b49d63'], [262, 80, 44, '#bca76d'], [280, 150, 22, '#a99560']].forEach(function (q) {
      g.fillStyle = q[3]; g.beginPath(); for (k = 0; k <= 14; k++) { var a = k / 14 * 6.283, r = q[2] * (0.62 + 0.38 * Math.abs(Math.sin(a * 2.3 + q[0]))); if (k) g.lineTo(q[0] + Math.cos(a) * r * 1.25, q[1] + Math.sin(a) * r * 0.8); else g.moveTo(q[0] + r * 1.25, q[1]); } g.closePath(); g.fill(); g.strokeStyle = '#6d5530'; g.lineWidth = 1.2; g.stroke();
    });
    g.strokeStyle = '#7a3324'; g.lineWidth = 1.2; g.beginPath(); g.arc(36, 166, 18, 0, 6.283); g.stroke(); for (i = 0; i < 8; i++) { g.beginPath(); g.moveTo(36, 166); g.lineTo(36 + Math.cos(i * 0.785) * (i % 2 ? 12 : 24), 166 + Math.sin(i * 0.785) * (i % 2 ? 12 : 24)); g.stroke(); }
    g.strokeStyle = '#5b4526'; g.lineWidth = 6; g.strokeRect(3, 3, Wd - 6, H - 6); return once(c);
  }
  function botanical(k) {                               /* 植物图谱：米色纸上的一枝花 */
    var Wd = 120, H = 160, c = cv(Wd, H), g = c.getContext('2d'), i, cols = [['#b9485a', '#e7a3ad'], ['#3f6fa8', '#9cb9dd'], ['#d19a2c', '#eecf7d']][k % 3];
    g.fillStyle = '#f3ecd9'; g.fillRect(0, 0, Wd, H); g.strokeStyle = '#5f7f4a'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(60, 150); g.quadraticCurveTo(52 + k * 6, 100, 60, 52); g.stroke();
    g.save(); g.translate(58, 118); petal(g, 13, -0.5, '#6f9558', 14); petal(g, 13, PI + 0.5, '#5f854a', 14); g.restore(); g.save(); g.translate(57, 88); petal(g, 10, -0.7, '#7da264', 11); petal(g, 10, PI + 0.7, '#6f9558', 11); g.restore();
    g.save(); g.translate(60, 46); for (i = 0; i < 7; i++) petal(g, 10, i * 0.898, i % 2 ? cols[0] : cols[1], 13); g.fillStyle = '#f2d98a'; g.beginPath(); g.arc(0, 0, 6, 0, 6.283); g.fill(); g.restore();
    return once(c);
  }
  function plaque(text) {                               /* 门上的小铜牌 */
    var c = cv(256, 80), g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 80); gr.addColorStop(0, '#e2c77a'); gr.addColorStop(0.5, '#c09a45'); gr.addColorStop(1, '#a37f33'); g.fillStyle = gr; g.fillRect(0, 0, 256, 80);
    g.strokeStyle = '#6b4f1c'; g.lineWidth = 4; g.strokeRect(6, 6, 244, 68); g.fillStyle = '#3a2a0e'; g.font = 'bold 40px Georgia, "Times New Roman", serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 128, 43); return once(c);
  }
  function clockFace() {
    var c = cv(128, 128), g = c.getContext('2d'), i; g.fillStyle = '#f4ecd6'; g.beginPath(); g.arc(64, 64, 62, 0, 6.283); g.fill(); g.strokeStyle = '#b08a3a'; g.lineWidth = 5; g.stroke(); g.fillStyle = '#2a2219';
    for (i = 0; i < 12; i++) { var a = i * 0.5236; g.fillRect(64 + Math.sin(a) * 48 - 2, 64 - Math.cos(a) * 48 - 5, 4, 10); }
    g.strokeStyle = '#2a2219'; g.lineCap = 'round'; g.lineWidth = 5; g.beginPath(); g.moveTo(64, 64); g.lineTo(84, 44); g.stroke(); g.lineWidth = 3.5; g.beginPath(); g.moveTo(64, 64); g.lineTo(60, 22); g.stroke(); return once(c);
  }
  function playRug() {                                  /* 儿童房的小路地毯 */
    var Wd = 256, H = 192, c = cv(Wd, H), g = c.getContext('2d'), i; g.fillStyle = '#8fbf7a'; g.fillRect(0, 0, Wd, H);
    g.strokeStyle = '#6b6f76'; g.lineWidth = 26; g.lineJoin = 'round'; g.beginPath(); g.moveTo(34, 34); g.lineTo(222, 34); g.lineTo(222, 158); g.lineTo(34, 158); g.closePath(); g.stroke(); g.beginPath(); g.moveTo(128, 34); g.lineTo(128, 158); g.stroke();
    g.strokeStyle = '#f4f1e4'; g.lineWidth = 2; g.setLineDash([9, 8]); g.beginPath(); g.moveTo(34, 34); g.lineTo(222, 34); g.lineTo(222, 158); g.lineTo(34, 158); g.closePath(); g.stroke(); g.beginPath(); g.moveTo(128, 34); g.lineTo(128, 158); g.stroke(); g.setLineDash([]);
    [[80, 96, '#d9534a'], [176, 82, '#e9b949'], [176, 122, '#4a7fc0']].forEach(function (q) { g.fillStyle = q[2]; g.fillRect(q[0] - 14, q[1] - 10, 28, 22); g.fillStyle = '#7a3d2c'; g.beginPath(); g.moveTo(q[0] - 18, q[1] - 10); g.lineTo(q[0], q[1] - 24); g.lineTo(q[0] + 18, q[1] - 10); g.closePath(); g.fill(); });
    for (i = 0; i < 6; i++) { g.fillStyle = '#4f8f4a'; g.beginPath(); g.arc(60 + i * 26, 178, 6, 0, 6.283); g.fill(); }
    g.strokeStyle = '#f4f1e4'; g.lineWidth = 5; g.strokeRect(3, 3, Wd - 6, H - 6); return once(c);
  }
  function persian(bg, field, accent) {                 /* 走廊 / 平台的长条地毯 */
    var Wd = 128, H = 256, c = cv(Wd, H), g = c.getContext('2d'), i; g.fillStyle = bg; g.fillRect(0, 0, Wd, H); g.fillStyle = field; g.fillRect(14, 14, Wd - 28, H - 28);
    g.strokeStyle = accent; g.lineWidth = 3; g.strokeRect(8, 8, Wd - 16, H - 16); g.strokeRect(20, 20, Wd - 40, H - 40);
    for (i = 0; i < 4; i++) { g.save(); g.translate(Wd / 2, 46 + i * 55); for (var k = 0; k < 4; k++) petal(g, 9, k * 1.571, accent, 12); g.fillStyle = bg; g.beginPath(); g.arc(0, 0, 5, 0, 6.283); g.fill(); g.restore(); }
    return once(c);
  }
  V2.glowTex = function () {
    if (V2._glow) return V2._glow; var c = cv(64, 64), g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,0.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return (V2._glow = once(c));
  };

  /* ================= 材质（接在 1.0 的家具材质后面） ================= */
  var fm0 = C.furnMats;
  C.furnMats = function (m) {
    var o = fm0(m), white = C.mode !== 'final';
    var X = C.ftex2 || (C.ftex2 = {
      wpDrawing: damask('#f1e3b7', '#ead8a3', 0.5), wpHall: stripeW('#f1e4bb', [[0.0, 0.42, '#eadba9'], [0.47, 0.03, '#d9c48a'], [0.92, 0.03, '#d9c48a']], 0.24),
      wpDining: trellis('#f0e4bf', '#d5cf9f', '#b9824f', 0.34), wpSnug: leaves('#c5cfb0', ['#a9b88f', '#b6c39d', '#98aa80'], '#b9695a', 0.8),
      wpStudy: damask('#2d4a3a', '#375a46', 0.55), wpBed1: sprig('#f3ead0', '#6f8fbd', '#93a889', 0.36), wpBed2: sprig('#f6ead3', '#d98a9e', '#9fb28f', 0.36),
      wpWC: sprig('#27405f', '#f1ead6', '#8fb0a0', 0.3, '#e9b949'), metro: metro('#f6f5ef', '#cfcbc0', '#e7e5dc'), floorCheck: checker('#f3f0e6', '#2b2e33', 0.28), floorEnc: encaustic(),
      artMap: oldMap(), artBot0: botanical(0), artBot1: botanical(1), artBot2: botanical(2), plaqueStudy: plaque('STUDY'), clockFace: clockFace(), playRug: playRug(),
      runnerRed: persian('#7b2a2a', '#a3463b', '#e3c992'), runnerBlue: persian('#27405f', '#3f5d7a', '#e3d3ad')
    });
    function t(map, rough, extra) { var q = { map: map }; for (var k in (extra || {})) q[k] = extra[k]; return m(0xffffff, rough == null ? 0.95 : rough, q); }
    var flat = { polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 };
    /* 墙纸、墙漆属于房子本身：白模里一律变白 */
    ['wpDrawing', 'wpHall', 'wpDining', 'wpSnug', 'wpStudy', 'wpBed1', 'wpBed2', 'wpWC'].forEach(function (k) { o[k] = white ? m(0xf3efe7) : t(X[k]); });
    o.frieze2 = m(white ? 0xf6f3ec : 0xf7efd6, 0.95); o.paintAqua = m(white ? 0xf3efe7 : 0xcfe0d8, 0.9); o.paintStudy = m(white ? 0xf3efe7 : 0x3c2f24, 0.7);
    o.metro = t(X.metro, 0.25); o.floorCheck = t(X.floorCheck, 0.3); o.floorEnc = t(X.floorEnc, 0.5);
    ['artMap', 'artBot0', 'artBot1', 'artBot2', 'plaqueStudy', 'clockFace'].forEach(function (k) { o[k] = t(X[k], k === 'plaqueStudy' ? 0.35 : 0.8, flat); });
    ['playRug', 'runnerRed', 'runnerBlue'].forEach(function (k) { o[k] = t(X[k], 1, flat); });
    o.potTerra = m(0xb5643c, 0.85); o.plantDark = m(0x2f5a2c, 0.9); o.plantLight = m(0x79a35a, 0.9); o.wax = m(0xf3ead2, 0.6); o.rattan = m(0xc9a56c, 0.85);
    o.flame = m(0xffb040, 0.6, { emissive: new THREE.Color(0xff7a18), side: THREE.DoubleSide }); o.ember = m(0x2a1108, 0.9, { emissive: new THREE.Color(0x7a1c04) });
    o.velvetRed = m(0x7a1f28, 0.95); o.velvetGreen = m(0x24493a, 0.95); o.towel = m(0xf4f1ea, 1); o.towelBlue = m(0x9fb7c9, 1); o.toyRed = m(0xd9534a, 0.7); o.toyBlue = m(0x4a7fc0, 0.7); o.toyYellow = m(0xe9b949, 0.7);
    o.teddy = m(0xb98a54, 1); o.silver = m(0xd9dcdf, 0.2, { metalness: 0.8 }); o.wine = m(0x5a1420, 0.3); o.paper = m(0xf2ecdc, 0.9);
    return o;
  };

  /* ================= 摆放小工具（同 1.0：o = {x, y, r 朝向, z}，正面朝局部 −y） ================= */
  V2.O = function (x, y, r, z) { return { x: x, y: y, r: r || 0, z: z || 0 }; };
  var at = V2.at = function (o, lx, ly) { var c = Math.cos(o.r || 0), s = Math.sin(o.r || 0); return [o.x + lx * c - ly * s, o.y + lx * s + ly * c]; };
  V2.piece = function (b, mat, o, lx, ly, hx, hy, za, zb) { var p = at(o, lx, ly); b.obox(mat, p[0], p[1], hx, hy, o.r || 0, o.z + za, o.z + zb); };
  V2.post = function (b, mat, o, lx, ly, r, za, zb, r1, seg) { var p = at(o, lx, ly); b.cyl(mat, p[0], p[1], o.z + za, o.z + zb, r, r1 == null ? r : r1, seg || 10); };
  V2.ball = function (b, mat, x, y, z, r, sx, sy, sz) { b.geom(mat, new THREE.SphereGeometry(r, 10, 7), new THREE.Matrix4().makeTranslation(x, y, z).multiply(new THREE.Matrix4().makeScale(sx || 1, sy || 1, sz || 1))); };
  V2.cone = function (b, mat, x, y, z, h, r, seg) { b.geom(mat, new THREE.ConeGeometry(r, h, seg || 8), new THREE.Matrix4().makeTranslation(x, y, z + h / 2).multiply(new THREE.Matrix4().makeRotationX(PI / 2))); };
  /* 一片叶子：从 (x,y,z) 朝水平方向 a 伸出去，仰角 tilt，长 len、宽 wid */
  V2.leaf = function (b, mat, x, y, z, a, tilt, len, wid) {
    var m = new THREE.Matrix4().makeTranslation(x, y, z).multiply(new THREE.Matrix4().makeRotationZ(a)).multiply(new THREE.Matrix4().makeRotationY(-tilt))
      .multiply(new THREE.Matrix4().makeTranslation(len / 2, 0, 0)).multiply(new THREE.Matrix4().makeScale(len / 2, wid / 2, 0.02));
    b.geom(mat, new THREE.SphereGeometry(1, 8, 5), m);
  };
  /* 贴在墙上的画：axis = 墙面垂直于哪个轴，face = 墙面坐标，dir = 朝房间的方向（±1） */
  V2.art = function (b, G, name, axis, face, along, zc, w, h, dir, frame, fw) {
    var n = axis === 'x' ? new THREE.Vector3(dir, 0, 0) : new THREE.Vector3(0, dir, 0), up = new THREE.Vector3(0, 0, 1), right = new THREE.Vector3().crossVectors(up, n);
    var c = axis === 'x' ? new THREE.Vector3(face, along, zc) : new THREE.Vector3(along, face, zc); fw = fw == null ? 0.045 : fw;
    function bx(u0, u1, v0, v1) { var A = c.clone().addScaledVector(right, u0).addScaledVector(up, v0).addScaledVector(n, 0.004), B = c.clone().addScaledVector(right, u1).addScaledVector(up, v1).addScaledVector(n, 0.045); b.box(frame || 'gilt', Math.min(A.x, B.x), Math.min(A.y, B.y), Math.min(A.z, B.z), Math.max(A.x, B.x), Math.max(A.y, B.y), Math.max(A.z, B.z)); }
    if (fw > 0) { bx(-w / 2 - fw, w / 2 + fw, h / 2, h / 2 + fw); bx(-w / 2 - fw, w / 2 + fw, -h / 2 - fw, -h / 2); bx(-w / 2 - fw, -w / 2, -h / 2, h / 2); bx(w / 2, w / 2 + fw, -h / 2, h / 2); }
    var mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), C.mats[name] || C.mats.inner); mesh.position.copy(c).addScaledVector(n, 0.022); mesh.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(right, up, n));
    mesh.userData.mat = name; mesh.name = 'art:' + name; mesh.receiveShadow = true; G.add(mesh); return mesh;
  };
  /* 铺在地上的一块（地毯）：名字以 rug: 开头，走路和镜头的射线都不理它 */
  V2.rug = function (G, name, x0, y0, x1, y1, z, turn) {
    var w = x1 - x0, h = y1 - y0, mesh = new THREE.Mesh(new THREE.PlaneGeometry(turn ? h : w, turn ? w : h), C.mats[name] || C.mats.floor);
    mesh.position.set((x0 + x1) / 2, (y0 + y1) / 2, z + 0.034); if (turn) mesh.rotation.z = PI / 2; mesh.userData.mat = name; mesh.receiveShadow = true; mesh.name = 'rug:' + name; G.add(mesh); return mesh;
  };

  /* ================= 房间表 =================
     poly = 房间内墙面的一圈（逆时针）。点上的第三项是从这一点出发的那段墙的标记：
     'bay' 凸窗里的墙（整段都是窗：只贴窗台以下和窗头以上）、'w' 挨着楼梯的墙（只贴墙纸，不做踢脚 / 护墙板 / 顶角线）、'skip' 不是墙。 */
  function bayIn(cx) {
    var hw = P.bayHalfW, r = P.bayReturn, c = P.bayCant, k = 0.4142 * T;
    return [[cx - hw + T, D.YF, 'bay'], [cx - hw + T, -r + k, 'bay'], [cx - hw + c + k, -r - c + T, 'bay'], [cx + hw - c - k, -r - c + T, 'bay'], [cx + hw - T, -r + k, 'bay'], [cx + hw - T, D.YF]];
  }
  var X0 = D.X0, X1 = D.X1, YF = D.YF, YR = D.YR, YRN = D.YRN;
  V2.rooms = [
    { id: 'drawing', zh: '客厅', en: 'Drawing Room', F: 0, poly: [[X0, YF]].concat(bayIn(P.bayS), [[-1.175, YF], [-1.175, YR], [X0, YR], [X0, 4.35], [X0 + 0.4, 4.35], [X0 + 0.4, 2.75], [X0, 2.75]]), bay: [0.55, D.zgT] },
    { id: 'hall', zh: '门厅', en: 'Entrance Hall', F: 0, poly: [[-0.925, YF], [0.02, YF, 'w'], [1.59, YF, 'w'], [1.59, 3.0], [1.59, 3.865], [-0.925, 3.865]] },
    { id: 'dining', zh: '餐厅', en: 'Dining Room', F: 0, poly: [[1.79, YF]].concat(bayIn(P.bayN), [[X1, YF], [X1, 3.865], [1.79, 3.865]]), bay: [0.55, D.zgT] },
    { id: 'corridor', zh: '后走廊', en: 'Rear Hall', F: 0, poly: [[-0.925, 4.035], [1.085, 4.035], [1.085, 4.91], [-0.925, 4.91]] },
    { id: 'wc', zh: '卫生间', en: 'Cloakroom', F: 0, poly: [[-0.925, 5.03], [1.085, 5.03], [1.085, YR], [-0.925, YR]] },
    { id: 'snug', zh: '小起居室', en: 'Snug', F: 0, poly: [[1.255, 4.035], [X1, 4.035], [X1, YRN], [2.03, YRN], [2.03, YR], [1.255, YR]] },
    { id: 'kitchen', zh: '厨房', en: 'Kitchen · Breakfast Room', F: 0, poly: [[W, -1.0], [P.kitX1, -1.0], [P.kitX1, P.kitY1 + P.kitRearBayProj], [W, P.kitY1 + P.kitRearBayProj]], bare: true },
    { id: 'sun', zh: '阳光房', en: 'Sun Room', F: 0, poly: [[P.sunX0, P.mainDepth], [P.sunX1, P.mainDepth], [P.sunX1, P.mainDepth + P.sunProj], [P.sunX0, P.mainDepth + P.sunProj]], bare: true },
    { id: 'landing', zh: '二楼平台', en: 'Landing', F: 1, poly: [[-0.84, YF, 'w'], [1.62, YF, 'w'], [1.62, 3.0], [1.62, 4.7], [-0.84, 4.7]] },
    { id: 'bed2', zh: '卧室 2', en: 'Bedroom 2', F: 1, poly: [[X0, YF]].concat(bayIn(P.bayS), [[-1.02, YF], [-1.02, 3.31], [X0, 3.31]]), bay: [F1 + 0.6, D.zfT] },
    { id: 'study', zh: '书房', en: 'Study', F: 1, poly: [[X0, 3.49], [-1.02, 3.49], [-1.02, YR], [X0, YR]] },
    { id: 'bed1', zh: '卧室 1', en: 'Bedroom 1', F: 1, poly: [[1.82, YF]].concat(bayIn(P.bayN), [[X1, YF], [X1, 3.825], [1.82, 3.825]]), bay: [F1 + 0.6, D.zfT] },
    { id: 'bath', zh: '浴室', en: 'Bathroom', F: 1, poly: [[-0.84, 4.82], [1.82, 4.82], [1.82, 3.975], [3.01, 3.975], [3.01, YRN], [2.03, YRN], [2.03, YR], [-0.84, YR]] },
    { id: 'ensuite', zh: '主卫', en: 'En-suite', F: 1, poly: [[3.13, 3.975], [X1, 3.975], [X1, YRN], [3.13, YRN]] },
    { id: 'atticHall', zh: '阁楼平台', en: 'Attic Landing', F: 2, poly: [[-0.855, 0.36], [1.645, 0.36], [1.645, 3.39], [-0.855, 3.39]], bare: true },
    { id: 'bed4', zh: '卧室 4', en: 'Bedroom 4', F: 2, poly: [[X0, P.kneeY0], [-1.005, P.kneeY0], [-1.005, P.rearDormFaceY], [X0, P.rearDormFaceY]], bare: true },
    { id: 'bed3', zh: '卧室 3 · 儿童房', en: 'Bedroom 3 · Nursery', F: 2, poly: [[1.795, P.kneeY0], [X1, P.kneeY0], [X1, YRN], [1.795, YRN]], bare: true },
    { id: 'atticBath', zh: '阁楼浴室', en: 'Attic Bathroom', F: 2, poly: [[-0.855, 3.51], [1.645, 3.51], [1.645, P.kneeY1], [-0.855, P.kneeY1]], bare: true }
  ];
  V2.rooms.forEach(function (r) { r.z = [0, F1, F2][r.F]; r.zc = [D.c0, D.c1, D.cA][r.F]; });
  V2.room = function (id) { return V2.rooms.filter(function (r) { return r.id === id; })[0]; };
  function inPoly(x, y, poly) { var c = false; for (var i = 0, j = poly.length - 1; i < poly.length; j = i++) { var a = poly[i], b = poly[j]; if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; }
  /* 工程坐标里的一点（z = 脚下的标高）在哪个房间 */
  V2.roomAt = function (x, y, z) {
    for (var i = 0; i < V2.rooms.length; i++) { var r = V2.rooms[i]; if (Math.abs(z - r.z) < 1.3 && inPoly(x, y, r.poly)) return r; }
    return null;
  };

  /* 洞口表：{ x, y 洞口中心（落在墙线上）, ax 洞口沿哪个轴, w, z0, z1 }。室内门从 1.0 的隔墙表来，外墙上的窗和门按 1.0 的洞口表抄 */
  V2.holes = function (F) {
    if (V2._holes) return V2._holes[F] || [];
    var H = V2._holes = [[], [], []], zf = [0, F1, F2];
    [0, 1, 2].forEach(function (f) {
      C.interiorWalls(f).forEach(function (w) {
        var alongX = Math.abs(w.b[0] - w.a[0]) > Math.abs(w.b[1] - w.a[1]);
        (w.d || []).forEach(function (c) { H[f].push({ x: alongX ? c : w.a[0], y: alongX ? w.a[1] : c, ax: alongX ? 'x' : 'y', w: P.doorW + 0.16, z0: zf[f] - 0.1, z1: zf[f] + P.doorH + 0.09, door: true }); });
      });
    });
    H[0].push({ x: 0, y: YF, ax: 'x', w: 2.0, z0: -0.1, z1: 2.22 },                                   /* 正门和两条侧窗 */
      { x: -3.5, y: YR, ax: 'x', w: 1.56, z0: -0.1, z1: 2.19 },                                         /* 客厅 → 阳光房 */
      { x: X0, y: 5.45, ax: 'y', w: 1.62, z0: 0.74, z1: 2.26 },                                         /* 客厅南窗 */
      { x: X0 + 0.4, y: 3.55, ax: 'y', w: 1.6, z0: -0.1, z1: 1.27 },                                    /* 客厅壁炉 */
      { x: 0.3, y: YR, ax: 'x', w: 0.82, z0: 0.84, z1: 2.36 },                                          /* 卫生间窗 */
      { x: 4.0, y: YRN, ax: 'x', w: 1.42, z0: 0.54, z1: 2.46 },                                         /* 小起居室窗 */
      { x: X1, y: 5.75, ax: 'y', w: 1.01, z0: -0.1, z1: 2.14 });                                        /* 小起居室 → 厨房 */
    H[1].push({ x: P.dormX, y: YF, ax: 'x', w: 1.57, z0: F1 + 0.04, z1: F1 + 1.66 },                    /* 楼梯窗 */
      { x: 3.95, y: YRN, ax: 'x', w: 1.12, z0: F1 + 0.84, z1: F1 + 2.06 }, { x: 0.75, y: YR, ax: 'x', w: 0.82, z0: F1 + 0.94, z1: F1 + 2.06 },
      { x: -1.6, y: YR, ax: 'x', w: 0.87, z0: F1 + 0.84, z1: F1 + 2.06 }, { x: -3.9, y: YR, ax: 'x', w: 1.12, z0: F1 + 0.84, z1: F1 + 2.06 });
    return H[F] || [];
  };

  function edges(room) {
    var p = room.poly, n = p.length, area = 0, i, out = [];
    for (i = 0; i < n; i++) { var a0 = p[i], b0 = p[(i + 1) % n]; area += a0[0] * b0[1] - b0[0] * a0[1]; }
    for (i = 0; i < n; i++) {
      var a = p[i], b = p[(i + 1) % n], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy), u = [dx / L, dy / L], s = area > 0 ? 1 : -1;
      out.push({ a: a, b: b, L: L, u: u, n: [-u[1] * s, u[0] * s], flag: a[2] || null, i: i });
    }
    return out;
  }
  function holesOn(room, e) {
    if (e.flag === 'bay') return room.bay ? [{ s0: -1, s1: e.L + 1, z0: room.bay[0] - 0.02, z1: room.bay[1] + 0.02 }] : [];
    var ax = Math.abs(e.u[0]) > 0.95 ? 'x' : Math.abs(e.u[1]) > 0.95 ? 'y' : null, list = [];
    V2.holes(room.F).forEach(function (h) {
      if (h.ax !== ax) return;
      if (Math.abs(ax === 'x' ? h.y - e.a[1] : h.x - e.a[0]) > 0.2) return;
      var s = (h.x - e.a[0]) * e.u[0] + (h.y - e.a[1]) * e.u[1]; if (s + h.w / 2 < 0.01 || s - h.w / 2 > e.L - 0.01) return;
      list.push({ s0: s - h.w / 2, s1: s + h.w / 2, z0: h.z0, z1: h.z1 });
    });
    return list;
  }
  /* 房间的墙在标高 zA..zB 之间、避开洞口后剩下的一块块矩形：{ e 墙段, sa, sb 沿墙, za, zb } */
  V2.spans = function (room, zA, zB, opt) {
    opt = opt || {}; var out = [];
    edges(room).forEach(function (e) {
      if (e.flag === 'skip' || (e.flag === 'w' && !opt.paper) || (opt.only && !opt.only(e))) return;
      var hs = holesOn(room, e), cuts = [0, e.L], i;
      hs.forEach(function (h) { if (h.s0 > 0 && h.s0 < e.L) cuts.push(h.s0); if (h.s1 > 0 && h.s1 < e.L) cuts.push(h.s1); });
      cuts.sort(function (a, b) { return a - b; });
      for (i = 0; i < cuts.length - 1; i++) {
        var sa = cuts[i], sb = cuts[i + 1], sm = (sa + sb) / 2, free = [[zA, zB]]; if (sb - sa < 0.012) continue;
        hs.forEach(function (h) {
          if (sm < h.s0 || sm > h.s1) return; var nx = [];
          free.forEach(function (f) { if (h.z1 <= f[0] || h.z0 >= f[1]) { nx.push(f); return; } if (h.z0 > f[0]) nx.push([f[0], h.z0]); if (h.z1 < f[1]) nx.push([h.z1, f[1]]); });
          free = nx;
        });
        free.forEach(function (f) { if (f[1] - f[0] > 0.004) out.push({ e: e, sa: sa, sb: sb, za: f[0], zb: f[1] }); });
      }
    });
    return out;
  };
  /* 沿墙贴一条：厚 thick，背面离墙面 off */
  V2.band = function (b, mat, room, zA, zB, thick, opt) {
    opt = opt || {}; var off = opt.off || 0;
    V2.spans(room, zA, zB, opt).forEach(function (q) {
      var e = q.e, m = (q.sa + q.sb) / 2, d = off + thick / 2;
      b.obox(mat, e.a[0] + e.u[0] * m + e.n[0] * d, e.a[1] + e.u[1] * m + e.n[1] * d, (q.sb - q.sa) / 2 + (opt.ext || 0), thick / 2, Math.atan2(e.u[1], e.u[0]), q.za, q.zb);
    });
  };
  /* 一个房间的墙面做法：
     paper 墙纸（踢脚到挂镜线）、frieze 挂镜线以上的墙漆、rail 挂镜线离地高、wains { h, mat, cap } 护墙板、tile { h, band } 半墙瓷砖、cornice、skirt */
  V2.finish = function (b, id, o) {
    var r = V2.room(id), z = r.z, zc = r.zc, rail = o.rail ? z + o.rail : zc, low = z;
    if (o.wains) {
      var wh = z + o.wains.h, wm = o.wains.mat || 'paintCream';
      V2.band(b, wm, r, z, wh, 0.012);
      V2.spans(r, z + 0.16, wh - 0.02).forEach(function (q) {                 /* 护墙板的竖梃：每块之间一条 */
        var e = q.e, n = Math.max(1, Math.round((q.sb - q.sa) / 0.55)), i;
        for (i = 0; i <= n; i++) { var s = Math.min(q.sb - 0.035, Math.max(q.sa + 0.035, q.sa + (q.sb - q.sa) * i / n)); b.obox(o.wains.stile || wm, e.a[0] + e.u[0] * s + e.n[0] * 0.017, e.a[1] + e.u[1] * s + e.n[1] * 0.017, 0.035, 0.008, Math.atan2(e.u[1], e.u[0]), q.za, q.zb); }
      });
      V2.band(b, o.wains.stile || wm, r, wh - 0.09, wh - 0.02, 0.022); V2.band(b, o.wains.cap || 'trim', r, wh - 0.02, wh + 0.035, 0.04, { ext: 0.01 });
      low = wh + 0.035;
    }
    if (o.tile) {
      var th = z + o.tile.h; V2.band(b, 'metro', r, z, th - 0.06, 0.008); V2.band(b, o.tile.band || 'paintNavy', r, th - 0.06, th, 0.014); low = th;
    }
    if (o.paper) V2.band(b, o.paper, r, low, rail, 0.005, { paper: true });
    if (o.rail) { V2.band(b, o.frieze || 'frieze2', r, rail, zc, 0.005, { paper: true }); V2.band(b, o.railMat || 'trim', r, rail - 0.025, rail + 0.03, 0.028); }
    if (o.skirt !== false && !o.tile) V2.band(b, o.skirtMat || 'trim', r, z, z + 0.15, 0.022, { ext: 0.01 });
    if (o.cornice !== false) { V2.band(b, o.corniceMat || 'trim', r, zc - 0.07, zc, 0.07); V2.band(b, o.corniceMat || 'trim', r, zc - 0.11, zc - 0.07, 0.03); }
  };
  /* 吊灯上方的石膏灯盘 */
  V2.rose = function (b, x, y, zc, r) { r = r || 0.3; b.cyl('trim', x, y, zc - 0.022, zc, r, r, 28); b.cyl('trim', x, y, zc - 0.04, zc - 0.022, r * 0.62, r * 0.7, 24); b.cyl('trim', x, y, zc - 0.055, zc - 0.04, r * 0.3, r * 0.36, 18); };
  V2.edges = edges;
})();
