/* Minest · Spatial Home · Rooms 2.0 — the painted things of the Cathedral (rooms/env-church.js), all drawn here on canvas:
   · the stained glass: fifteen Bible stories (six of the Old Testament down the north aisle, six of the New down the south,
     the Crucifixion, the Resurrection and the Ascension in the apse), the west rose, and the standing saints of the clerestory;
   · the murals: four frescoes (the Good Shepherd, the Sermon on the Mount, Jacob's Ladder, Jonah) and the painted frieze
     of angels and saints that runs along the triforium;
   · the thirty verse tablets of the aisles (the verses themselves: rooms/church-verses.js).
   One small drawing kit serves both: in glass every piece is leaded and saturated, in fresco the same shapes are earthen and
   soft. Exposes SpatialChurchArt = { STORIES, MURALS, glass, rose, saint, mural, frieze, tablet, title }. */
(function (root) {
  'use strict';
  var PI = Math.PI, TAU = PI * 2;
  var GLASS = { blue: '#1d46c8', sky: '#3f7fe8', night: '#131a66', red: '#c8202a', gold: '#f2b632', yellow: '#ffe27a', green: '#2f9a4a', dgreen: '#17662f', white: '#f3efe2',
    skin: '#f0c39a', brown: '#8a5226', dbrown: '#55301a', purple: '#7a35a8', grey: '#9aa3b5', stone: '#c9b79a', orange: '#ee7a22', water: '#2aa3d8', pink: '#e58aa0', black: '#15131c' };
  var FRESCO = { blue: '#5f7fa6', sky: '#b4c8d2', night: '#3d4a6b', red: '#a8483a', gold: '#c9a04e', yellow: '#e6d391', green: '#74925c', dgreen: '#4f6b45', white: '#efe6d2',
    skin: '#dcb592', brown: '#8a6a4a', dbrown: '#5b4332', purple: '#7d5f86', grey: '#a39c8f', stone: '#cbbd9f', orange: '#c98248', water: '#7fa7b5', pink: '#cf9a94', black: '#3a2f2a' };
  var SERIF = '"Noto Serif SC","Songti SC","STSong","SimSun","Noto Serif CJK SC",Georgia,serif';
  function rng(s) { s = s || 1; return function () { s = (s * 16807) % 2147483647; return (s & 0xffffff) / 0x1000000; }; }

  /* ── the drawing kit: shapes in a 100-wide box, y down ── */
  function kit(x, fresco, H) {
    var PAL = fresco ? FRESCO : GLASS, K = { H: H || 130 }, LEAD = fresco ? 'rgba(74,48,28,.8)' : '#0c0a14', LW = fresco ? 0.45 : 1.0;
    function c(n) { return PAL[n] || n; }
    function ink(col) { x.fillStyle = c(col); x.fill(); x.strokeStyle = LEAD; x.lineWidth = LW; x.lineJoin = 'round'; x.stroke(); }
    K.P = function (col, p) { x.beginPath(); x.moveTo(p[0], p[1]); for (var i = 2; i < p.length; i += 2) x.lineTo(p[i], p[i + 1]); x.closePath(); ink(col); };
    K.Q = function (col, p) {                                   // a closed soft shape through the points
      var n = p.length / 2, i, a, b; x.beginPath(); x.moveTo((p[0] + p[2 * n - 2]) / 2, (p[1] + p[2 * n - 1]) / 2);
      for (i = 0; i < n; i++) { a = i * 2; b = ((i + 1) % n) * 2; x.quadraticCurveTo(p[a], p[a + 1], (p[a] + p[b]) / 2, (p[a + 1] + p[b + 1]) / 2); }
      x.closePath(); ink(col);
    };
    K.C = function (col, cx, cy, r) { x.beginPath(); x.arc(cx, cy, r, 0, TAU); ink(col); };
    K.E = function (col, cx, cy, rx, ry, rot) { x.beginPath(); x.ellipse(cx, cy, rx, ry, rot || 0, 0, TAU); ink(col); };
    K.R = function (col, x0, y0, w, h) { x.beginPath(); x.rect(x0, y0, w, h); ink(col); };
    K.L = function (col, p, lw) { x.beginPath(); x.moveTo(p[0], p[1]); for (var i = 2; i < p.length; i += 2) x.lineTo(p[i], p[i + 1]); x.strokeStyle = c(col); x.lineWidth = lw || 1; x.lineCap = 'round'; x.stroke(); };
    K.dot = function (col, cx, cy, r) { x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.fillStyle = c(col); x.fill(); };
    K.blob = function (col, cs) { var i; for (i = 0; i < cs.length; i += 3) { x.beginPath(); x.arc(cs[i], cs[i + 1], cs[i + 2], 0, TAU); x.strokeStyle = LEAD; x.lineWidth = LW * 2; x.stroke(); } for (i = 0; i < cs.length; i += 3) K.dot(col, cs[i], cs[i + 1], cs[i + 2]); };
    K.bg = function (a, b) {
      var g = x.createLinearGradient(0, 0, 0, K.H); g.addColorStop(0, c(a)); g.addColorStop(1, c(b || a)); x.fillStyle = g; x.fillRect(0, 0, 100, K.H);
      if (!fresco) { x.strokeStyle = 'rgba(8,8,20,.5)'; x.lineWidth = 0.4; x.beginPath(); for (var i = -K.H; i < 100 + K.H; i += 10) { x.moveTo(i, 0); x.lineTo(i + K.H, K.H); x.moveTo(i, 0); x.lineTo(i - K.H, K.H); } x.stroke(); }
    };
    K.ground = function (col, y, bump) { x.beginPath(); x.moveTo(-2, y); x.quadraticCurveTo(50, y - (bump || 0) * 2, 102, y); x.lineTo(102, K.H + 2); x.lineTo(-2, K.H + 2); x.closePath(); ink(col); };
    K.water = function (y, col) {
      K.ground(col || 'water', y, 0); x.strokeStyle = fresco ? 'rgba(255,255,255,.4)' : 'rgba(255,255,255,.6)'; x.lineWidth = 0.7;
      for (var r = y + 5, k = 0; r < K.H; r += 7, k++) { x.beginPath(); for (var i = (k % 2) * 7 - 4; i < 100; i += 14) { x.moveTo(i, r); x.quadraticCurveTo(i + 3.5, r - 3, i + 7, r); } x.stroke(); }
    };
    K.star = function (cx, cy, r, col, n) { var p = [], i, a, q; n = n || 4; for (i = 0; i < n * 2; i++) { a = i * PI / n - PI / 2; q = i % 2 ? r * 0.38 : r; p.push(cx + Math.cos(a) * q, cy + Math.sin(a) * q); } K.P(col || 'yellow', p); };
    K.stars = function (n, seed, ymax) { var r = rng(seed || 3); for (var i = 0; i < n; i++) K.star(6 + r() * 88, 5 + r() * (ymax || 50), 1.6 + r() * 1.6, 'yellow'); };
    K.rays = function (col, cx, cy, r0, r1, n, a0, a1) {
      a0 = a0 == null ? 0 : a0; a1 = a1 == null ? TAU : a1; var full = a1 - a0 >= TAU - 0.01;
      for (var i = 0; i < n; i++) { var a = a0 + (a1 - a0) * (full ? i / n : i / (n - 1)), w = 0.09; K.P(col, [cx + Math.cos(a - w) * r0, cy + Math.sin(a - w) * r0, cx + Math.cos(a) * r1, cy + Math.sin(a) * r1, cx + Math.cos(a + w) * r0, cy + Math.sin(a + w) * r0]); }
    };
    K.cloud = function (cx, cy, r, col) { K.blob(col || 'white', [cx - r * 0.75, cy + r * 0.12, r * 0.48, cx, cy - r * 0.1, r * 0.62, cx + r * 0.78, cy + r * 0.14, r * 0.46, cx + r * 0.3, cy + r * 0.3, r * 0.4, cx - r * 0.3, cy + r * 0.3, r * 0.4]); };
    K.tree = function (cx, by, h, leaf) { K.P('brown', [cx - h * 0.05, by, cx - h * 0.035, by - h * 0.55, cx + h * 0.035, by - h * 0.55, cx + h * 0.05, by]); K.blob(leaf || 'green', [cx - h * 0.17, by - h * 0.6, h * 0.19, cx + h * 0.17, by - h * 0.6, h * 0.19, cx, by - h * 0.78, h * 0.22]); };
    K.fish = function (cx, cy, s, col, d) { d = d || 1; K.P(col, [cx - d * s * 0.8, cy, cx - d * s * 1.5, cy - s * 0.5, cx - d * s * 1.5, cy + s * 0.5]); K.E(col, cx, cy, s, s * 0.45); K.dot('black', cx + d * s * 0.55, cy - s * 0.1, s * 0.09); };
    K.dove = function (cx, cy, s, d) {
      d = d || 1; K.P('white', [cx - d * s * 0.7, cy, cx - d * s * 1.5, cy - s * 0.35, cx - d * s * 1.45, cy + s * 0.3]); K.E('white', cx, cy, s * 0.85, s * 0.42, -d * 0.15);
      K.Q('white', [cx - d * s * 0.2, cy - s * 0.2, cx - d * s * 0.55, cy - s * 1.25, cx + d * s * 0.25, cy - s * 0.95, cx + d * s * 0.3, cy - s * 0.15]);
      K.C('white', cx + d * s * 0.85, cy - s * 0.32, s * 0.3); K.P('gold', [cx + d * s * 1.1, cy - s * 0.38, cx + d * s * 1.5, cy - s * 0.26, cx + d * s * 1.1, cy - s * 0.18]); K.dot('black', cx + d * s * 0.92, cy - s * 0.38, s * 0.06);
    };
    K.sheep = function (cx, by, s, d) {
      d = d || 1; K.L('dbrown', [cx - s * 0.5, by - s * 0.5, cx - s * 0.5, by, cx + s * 0.45, by - s * 0.5, cx + s * 0.45, by], s * 0.13);
      K.blob('white', [cx - s * 0.45, by - s * 0.72, s * 0.42, cx + s * 0.4, by - s * 0.72, s * 0.42, cx, by - s * 0.86, s * 0.46, cx, by - s * 0.55, s * 0.4]);
      K.E('grey', cx + d * s * 0.92, by - s * 0.98, s * 0.26, s * 0.32, d * 0.3); K.dot('black', cx + d * s * 0.98, by - s * 1.04, s * 0.045);
    };
    K.lion = function (cx, by, s, d) {
      d = d || 1; K.L('gold', [cx - d * s * 1.0, by - s * 0.55, cx - d * s * 1.6, by - s * 0.95, cx - d * s * 1.75, by - s * 0.6], s * 0.11);
      K.Q('gold', [cx - d * s * 1.2, by - s * 0.9, cx + d * s * 0.9, by - s * 0.95, cx + d * s * 1.3, by, cx - d * s * 1.25, by]);
      K.C('orange', cx + d * s * 0.85, by - s * 0.82, s * 0.62); K.C('gold', cx + d * s * 0.95, by - s * 0.78, s * 0.38);
      K.dot('black', cx + d * s * 0.84, by - s * 0.86, s * 0.05); K.dot('black', cx + d * s * 1.08, by - s * 0.86, s * 0.05); K.P('dbrown', [cx + d * s * 0.88, by - s * 0.72, cx + d * s * 1.04, by - s * 0.72, cx + d * s * 0.96, by - s * 0.62]);
    };
    K.cross = function (cx, by, h, col, t) { t = t || h * 0.09; K.R(col || 'brown', cx - t / 2, by - h, t, h); K.R(col || 'brown', cx - h * 0.3, by - h * 0.76, h * 0.6, t); };
    /* a robed figure standing on `by`, `h` tall. o: halo, cloak, hair, beard, veil, wings, arms ('up','out','pray','fwd','down'), dir, kneel, crown */
    K.man = function (cx, by, h, robe, o) {
      o = o || {}; var hw = h * 0.2, sh = by - h * 0.8, hr = h * 0.095, hy = by - h * 0.89, d = o.dir || 1, hem = o.kneel ? 1.75 : 1.12, sk = o.skin || 'skin', s, k;
      if (o.wings) for (s = -1; s <= 1; s += 2) K.Q(o.wings, [cx + s * hw * 0.3, sh + h * 0.02, cx + s * h * 0.34, sh - h * 0.3, cx + s * h * 0.56, sh - h * 0.02, cx + s * h * 0.4, by - h * 0.3, cx + s * hw * 0.5, by - h * 0.42]);
      if (o.halo) K.C(o.halo === true ? 'gold' : o.halo, cx, hy, hr * 1.8);
      if (o.arms === 'up') for (s = -1; s <= 1; s += 2) { K.P(robe, [cx + s * hw * 0.55, sh, cx + s * hw * 1.55, sh - h * 0.24, cx + s * hw * 1.9, sh - h * 0.2, cx + s * hw * 0.75, sh + h * 0.17]); K.C(sk, cx + s * hw * 1.8, sh - h * 0.26, h * 0.036); }
      K.P(robe, [cx - hw * 0.75, sh, cx + hw * 0.75, sh, cx + hw * hem, by, cx - hw * hem, by]);
      if (o.cloak) K.P(o.cloak, [cx - d * hw * 0.75, sh, cx - d * hw * 0.05, sh, cx + d * hw * 0.2, by - h * 0.3, cx - d * hw * 0.3, by - h * 0.1, cx - d * hw * hem, by]);
      if (o.arms === 'out') for (s = -1; s <= 1; s += 2) { K.P(robe, [cx + s * hw * 0.7, sh, cx + s * hw * 2.0, sh + h * 0.2, cx + s * hw * 1.85, sh + h * 0.28, cx + s * hw * 0.72, sh + h * 0.2]); K.C(sk, cx + s * hw * 2.02, sh + h * 0.25, h * 0.036); }
      if (o.arms === 'fwd') { K.P(robe, [cx + d * hw * 0.5, sh + h * 0.02, cx + d * hw * 2.0, sh - h * 0.03, cx + d * hw * 2.0, sh + h * 0.07, cx + d * hw * 0.6, sh + h * 0.2]); K.C(sk, cx + d * hw * 2.12, sh + h * 0.01, h * 0.036); }
      if (o.arms === 'pray') { K.P(robe, [cx - d * hw * 0.3, sh + h * 0.08, cx + d * hw * 0.85, sh + h * 0.02, cx + d * hw * 0.9, sh + h * 0.12, cx - d * hw * 0.2, sh + h * 0.24]); K.C(sk, cx + d * hw * 0.98, sh + h * 0.05, h * 0.036); }
      if (o.arms === 'down') for (s = -1; s <= 1; s += 2) { K.P(robe, [cx + s * hw * 0.72, sh, cx + s * hw * 1.2, sh + h * 0.36, cx + s * hw * 0.92, sh + h * 0.4, cx + s * hw * 0.6, sh + h * 0.1]); K.C(sk, cx + s * hw * 1.08, sh + h * 0.41, h * 0.034); }
      if (o.veil) K.Q(o.veil, [cx - hr * 1.5, hy + hr * 2.2, cx - hr * 1.5, hy - hr * 1.5, cx + hr * 1.5, hy - hr * 1.5, cx + hr * 1.5, hy + hr * 2.2]);
      if (o.hair && o.long) K.Q(o.hair, [cx - hr * 1.25, hy + hr * 1.5, cx - hr * 1.3, hy - hr * 1.3, cx + hr * 1.3, hy - hr * 1.3, cx + hr * 1.25, hy + hr * 1.5]);
      K.C(sk, cx, hy, hr);
      if (o.hair) { x.beginPath(); x.arc(cx, hy, hr * 1.02, PI * 1.08, PI * 1.92); x.closePath(); ink(o.hair); }
      if (o.beard) K.P(o.beard, [cx - hr * 0.75, hy + hr * 0.3, cx + hr * 0.75, hy + hr * 0.3, cx, hy + hr * 1.55]);
      if (o.crown) K.P('gold', [cx - hr, hy - hr * 0.7, cx - hr, hy - hr * 1.7, cx - hr * 0.5, hy - hr * 1.2, cx, hy - hr * 1.8, cx + hr * 0.5, hy - hr * 1.2, cx + hr, hy - hr * 1.7, cx + hr, hy - hr * 0.7]);
      for (k = -1; k <= 1; k += 2) K.dot('black', cx + k * hr * 0.38 + d * hr * 0.08, hy - hr * 0.02, Math.max(0.28, hr * 0.1));
    };
    K.christ = function (cx, by, h, o) { o = o || {}; var q = { halo: 'gold', hair: 'dbrown', long: true, beard: 'dbrown', cloak: o.cloak === undefined ? 'blue' : o.cloak, arms: o.arms || 'out', dir: o.dir }; K.man(cx, by, h, o.robe || 'red', q); var hy = by - h * 0.89, hr = h * 0.095; K.L('red', [cx - hr * 1.7, hy, cx - hr * 1.05, hy, cx + hr * 1.05, hy, cx + hr * 1.7, hy], h * 0.012); };
    K.c = c; return K;
  }

  /* ── the fifteen windows. Each scene is drawn in a 100 × 130 box. ── */
  var STORIES = [
    { id: 'creation', zh: '创造天地', en: 'The Creation', ref: 'Genesis 1', draw: function (K) {
      K.bg('night', 'blue'); K.stars(12, 5, 44); K.rays('yellow', 76, 24, 9, 16, 12); K.C('gold', 76, 24, 9);
      K.C('white', 22, 22, 7); K.dot(K.c('night'), 25.5, 20, 6);
      K.rays('yellow', 50, 4, 8, 34, 7, PI * 0.3, PI * 0.7); K.cloud(50, 3, 20); K.P('skin', [46, 10, 54, 10, 53, 20, 50, 24, 47, 20]);
      K.water(84); K.fish(26, 100, 6, 'orange'); K.fish(48, 116, 5, 'gold', -1); K.fish(20, 121, 4, 'red');
      K.Q('green', [52, 132, 56, 84, 80, 70, 104, 78, 104, 132]); K.tree(78, 82, 26); K.tree(92, 88, 16, 'dgreen'); K.dove(30, 56, 5); K.dove(46, 66, 4, -1);
      K.sheep(66, 104, 6); K.lion(84, 118, 6, -1);
    } },
    { id: 'eden', zh: '伊甸园', en: 'Adam and Eve in Eden', ref: 'Genesis 3', draw: function (K) {
      K.bg('sky', 'blue'); K.ground('green', 104, 3); K.P('brown', [45, 106, 47, 50, 53, 50, 55, 106]);
      K.blob('dgreen', [30, 44, 15, 50, 32, 18, 70, 44, 15, 40, 56, 11, 60, 56, 11]);
      [[30, 40], [42, 26], [58, 28], [70, 42], [50, 44], [38, 54], [63, 54]].forEach(function (p) { K.C('red', p[0], p[1], 2.6); });
      K.L('black', [47, 98, 56, 90, 44, 80, 56, 70, 45, 62, 57, 56], 4.4); K.L('green', [47, 98, 56, 90, 44, 80, 56, 70, 45, 62, 57, 56], 2.8); K.C('green', 59, 55, 2.6); K.dot('red', 60, 54.5, 0.6);
      K.man(22, 108, 52, 'skin', { hair: 'dbrown', arms: 'down' }); K.P('green', [15, 76, 29, 76, 31, 88, 13, 88]);
      K.man(78, 108, 50, 'skin', { hair: 'gold', long: true, arms: 'fwd', dir: -1 }); K.P('green', [71, 70, 85, 70, 87, 90, 69, 90]); K.C('red', 65.5, 67, 2.4);
      K.Q('dgreen', [0, 132, 4, 104, 16, 112, 10, 132]); K.Q('dgreen', [100, 132, 96, 104, 86, 112, 90, 132]);
    } },
    { id: 'noah', zh: '挪亚方舟', en: "Noah's Ark", ref: 'Genesis 6–9', draw: function (K) {
      K.bg('sky', 'sky'); var cols = ['red', 'orange', 'yellow', 'green', 'blue', 'purple'];
      cols.forEach(function (c, i) { K.L('black', arc(50, 74, 46 - i * 3.6), 4.2); }); cols.forEach(function (c, i) { K.L(c, arc(50, 74, 46 - i * 3.6), 3.2); });
      K.cloud(14, 24, 11); K.cloud(86, 20, 10); K.water(92);
      K.Q('brown', [12, 82, 88, 82, 80, 106, 50, 108, 20, 106]); K.R('stone', 30, 64, 40, 18); K.P('red', [26, 64, 50, 50, 74, 64]);
      [36, 47, 58].forEach(function (wx) { K.R('night', wx, 69, 6, 8); }); K.L('dbrown', [14, 90, 86, 90], 1); K.L('dbrown', [17, 98, 83, 98], 1);
      K.man(50, 82, 24, 'purple', { hair: 'white', beard: 'white', arms: 'up' }); K.dove(70, 40, 6, -1); K.L('green', [62, 39, 57, 42, 60, 44], 1.4);
    } },
    { id: 'moses', zh: '摩西与十诫', en: 'Moses and the Ten Commandments', ref: 'Exodus 20', draw: function (K) {
      K.bg('purple', 'orange'); K.cloud(50, 12, 24, 'grey'); K.rays('yellow', 50, 14, 6, 40, 9, PI * 0.2, PI * 0.8);
      K.P('yellow', [30, 14, 36, 30, 31, 30, 38, 46, 27, 28, 32, 28]);
      K.P('stone', [-2, 132, 20, 70, 44, 96, 60, 78, 80, 60, 102, 96, 102, 132]); K.ground('brown', 112, 2);
      K.man(46, 112, 58, 'red', { hair: 'white', beard: 'white', cloak: 'blue', halo: 'yellow' });
      for (var s = 0; s < 2; s++) { var tx = 34 + s * 13; K.Q('white', [tx, 86, tx, 60, tx + 12, 60, tx + 12, 86]); for (var l = 0; l < 5; l++) K.L('black', [tx + 2.5, 67 + l * 3.6, tx + 9.5, 67 + l * 3.6], 0.7); }
      K.blob('dgreen', [84, 100, 8, 78, 108, 7, 90, 108, 7]); K.Q('orange', [78, 100, 84, 76, 90, 100, 84, 106]); K.Q('yellow', [81, 100, 84, 86, 87, 100, 84, 104]);
    } },
    { id: 'david', zh: '大卫与歌利亚', en: 'David and Goliath', ref: '1 Samuel 17', draw: function (K) {
      K.bg('sky', 'yellow'); K.Q('dgreen', [-4, 132, 0, 84, 30, 92, 60, 104, 104, 96, 104, 132]); K.ground('green', 110, 3); K.cloud(22, 18, 10); K.tree(8, 96, 20, 'dgreen');
      K.man(72, 112, 86, 'grey', { hair: 'dbrown', beard: 'dbrown', arms: 'down', dir: -1 }); K.P('gold', [61, 44, 83, 44, 80, 70, 64, 70]); K.Q('grey', [62, 34, 64, 22, 80, 22, 82, 34]);
      K.L('dbrown', [91, 112, 91, 20], 1.8); K.P('grey', [88, 20, 91, 8, 94, 20]); K.E('red', 58, 74, 6, 12); K.C('gold', 58, 74, 2);
      K.man(24, 112, 40, 'green', { hair: 'orange', arms: 'fwd' }); K.L('dbrown', [33, 79, 40, 66, 44, 60], 0.9); K.C('stone', 45, 58, 2.2); K.C('stone', 54, 46, 1.8);
      K.sheep(10, 122, 5);
    } },
    { id: 'daniel', zh: '但以理在狮子坑', en: "Daniel in the Lions' Den", ref: 'Daniel 6', draw: function (K) {
      K.bg('dbrown', 'brown'); K.Q('night', [8, 132, 6, 30, 50, 4, 94, 30, 92, 132]); K.stars(5, 9, 30);
      K.rays('yellow', 50, 22, 10, 30, 9, PI * 0.15, PI * 0.85); K.man(50, 40, 34, 'white', { wings: 'yellow', halo: 'gold', hair: 'gold', arms: 'out' });
      K.ground('stone', 108, 2); K.man(50, 110, 54, 'blue', { hair: 'dbrown', beard: 'dbrown', cloak: 'red', arms: 'up', halo: 'yellow' });
      K.lion(22, 116, 11, 1); K.lion(78, 116, 11, -1); K.lion(50, 128, 8, 1);
    } },
    { id: 'annunciation', zh: '天使报喜', en: 'The Annunciation', ref: 'Luke 1', draw: function (K) {
      K.bg('blue', 'sky'); K.R('stone', 58, 20, 44, 92); K.Q('night', [66, 112, 66, 36, 80, 24, 94, 36, 94, 112]); K.ground('red', 110, 0);
      for (var i = 0; i < 10; i++) K.R(i % 2 ? 'white' : 'gold', i * 10, 110, 10, 22);
      K.rays('yellow', 50, 14, 5, 46, 7, PI * 0.2, PI * 0.5); K.dove(50, 16, 7);
      K.man(26, 110, 60, 'white', { wings: 'gold', halo: 'yellow', hair: 'gold', long: true, cloak: 'pink', arms: 'fwd' }); K.L('green', [40, 62, 42, 40], 1.2); K.star(42, 38, 4, 'white', 6);
      K.man(76, 110, 46, 'blue', { halo: 'gold', veil: 'white', kneel: true, arms: 'pray', dir: -1, cloak: 'blue' });
    } },
    { id: 'nativity', zh: '耶稣降生', en: 'The Nativity', ref: 'Luke 2', draw: function (K) {
      K.bg('night', 'blue'); K.stars(10, 12, 34); K.rays('yellow', 50, 16, 4, 30, 8, 0, TAU); K.star(50, 16, 8, 'white', 8);
      K.P('brown', [8, 54, 50, 34, 92, 54, 92, 60, 50, 41, 8, 60]); K.R('dbrown', 12, 58, 4, 54); K.R('dbrown', 84, 58, 4, 54); K.ground('gold', 110, 1);
      K.man(26, 110, 52, 'brown', { hair: 'dbrown', beard: 'dbrown', cloak: 'green', halo: 'yellow', arms: 'pray' }); K.L('dbrown', [15, 110, 15, 62], 1.4);
      K.man(72, 110, 44, 'blue', { halo: 'gold', veil: 'white', kneel: true, arms: 'pray', dir: -1 });
      K.P('brown', [36, 96, 62, 96, 58, 110, 40, 110]); K.L('yellow', [36, 95, 40, 90, 44, 95, 48, 89, 53, 95, 57, 90, 62, 95], 1.4);
      K.C('gold', 42, 90, 5.4); K.E('white', 50, 92, 9, 4); K.C('skin', 42, 90, 3.2); K.sheep(84, 124, 6, -1); K.sheep(12, 124, 5);
    } },
    { id: 'baptism', zh: '耶稣受洗', en: 'The Baptism of Christ', ref: 'Matthew 3', draw: function (K) {
      K.bg('sky', 'yellow'); K.Q('green', [-4, 132, -2, 70, 26, 78, 34, 132]); K.Q('green', [104, 132, 102, 66, 74, 80, 68, 132]); K.tree(90, 74, 26, 'dgreen'); K.tree(8, 76, 18);
      K.rays('yellow', 50, 12, 6, 40, 7, PI * 0.25, PI * 0.75); K.cloud(50, 8, 16); K.dove(50, 26, 7);
      K.christ(50, 122, 62, { robe: 'skin', cloak: null, arms: 'pray' }); K.water(92);
      K.man(22, 96, 56, 'brown', { hair: 'dbrown', beard: 'dbrown', long: true, arms: 'fwd', halo: 'yellow' }); K.Q('white', [35, 48, 42, 44, 44, 50, 38, 53]); K.L('white', [43, 52, 46, 60, 45, 66], 1);
      K.man(82, 100, 46, 'white', { wings: 'pink', halo: 'yellow', hair: 'gold', arms: 'pray', dir: -1 });
    } },
    { id: 'loaves', zh: '五饼二鱼', en: 'The Loaves and the Fishes', ref: 'John 6', draw: function (K) {
      K.bg('sky', 'white'); K.Q('dgreen', [-4, 132, 0, 60, 40, 74, 104, 56, 104, 132]); K.water(62, 'blue'); K.ground('green', 86, 4); K.P('white', [70, 50, 78, 30, 80, 50]); K.P('brown', [66, 52, 84, 52, 81, 57, 69, 57]);
      for (var i = 0; i < 9; i++) K.man(8 + i * 10.5, 100 + (i % 2) * 5, 30, ['red', 'green', 'purple', 'orange', 'blue'][i % 5], { hair: i % 3 ? 'dbrown' : 'white', skin: i % 4 === 1 ? 'brown' : 'skin' });
      K.christ(50, 112, 60, { arms: 'up' }); K.man(26, 122, 30, 'yellow', { hair: 'dbrown', arms: 'fwd' });
      K.Q('brown', [34, 112, 66, 112, 62, 128, 38, 128]); for (i = 0; i < 5; i++) K.E('gold', 40 + i * 5, 112 - (i % 2) * 3, 3.6, 2.6); K.fish(46, 120, 4.5, 'grey'); K.fish(56, 122, 4.5, 'grey', -1);
    } },
    { id: 'prodigal', zh: '浪子回头', en: 'The Prodigal Son', ref: 'Luke 15', draw: function (K) {
      K.bg('orange', 'yellow'); K.rays('yellow', 82, 20, 9, 15, 12); K.C('gold', 82, 20, 8); K.Q('green', [-4, 132, 0, 78, 50, 70, 104, 84, 104, 132]);
      K.R('stone', 4, 44, 34, 44); K.P('red', [0, 44, 21, 26, 42, 44]); K.Q('dbrown', [15, 88, 15, 66, 27, 66, 27, 88]); K.R('night', 8, 52, 7, 9); K.R('night', 27, 52, 7, 9);
      K.L('stone', [56, 132, 60, 104, 80, 90, 100, 84], 9); K.ground('green', 116, 2); K.tree(92, 82, 22, 'dgreen');
      K.man(44, 116, 62, 'purple', { hair: 'white', beard: 'white', cloak: 'red', arms: 'fwd', halo: null });
      K.man(64, 118, 40, 'brown', { hair: 'dbrown', kneel: true, arms: 'pray', dir: -1 }); K.L('dbrown', [78, 118, 84, 86], 1.4);
      K.man(16, 90, 22, 'green', { hair: 'dbrown', arms: 'up' });
    } },
    { id: 'supper', zh: '最后的晚餐', en: 'The Last Supper', ref: 'Matthew 26', draw: function (K) {
      K.bg('red', 'purple'); for (var i = 0; i < 3; i++) K.Q('night', [12 + i * 30, 50, 12 + i * 30, 16, 28 + i * 30, 16, 28 + i * 30, 50]); K.stars(3, 21, 30);
      var cs = ['green', 'blue', 'orange', 'purple', 'green', 'gold'], xs = [10, 23, 36, 64, 77, 90];
      xs.forEach(function (px, k) { K.man(px, 98, 46, cs[k], { halo: 'yellow', hair: k % 2 ? 'dbrown' : 'white', beard: k % 3 ? 'dbrown' : null, dir: px < 50 ? 1 : -1, arms: 'pray' }); });
      K.christ(50, 100, 58, { arms: 'out' });
      K.R('white', 2, 86, 96, 10); K.P('white', [2, 96, 98, 96, 94, 122, 6, 122]); for (i = 0; i < 6; i++) K.L('grey', [12 + i * 15, 97, 11 + i * 15, 121], 0.6); K.ground('dbrown', 122, 0);
      K.P('gold', [46, 76, 54, 76, 52, 82, 51, 82, 51, 85, 54, 86, 46, 86, 49, 85, 49, 82, 48, 82]); K.E('gold', 34, 85, 5, 2.4); K.E('gold', 67, 85, 5, 2.4); K.E('brown', 22, 86, 3, 1.6); K.E('brown', 80, 86, 3, 1.6);
    } },
    { id: 'crucifixion', zh: '十字架', en: 'The Crucifixion', ref: 'John 19', draw: function (K) {
      K.bg('night', 'purple'); K.C('red', 16, 16, 7); K.C('white', 84, 16, 7); K.dot(K.c('night'), 87, 14, 6); K.Q('dbrown', [-4, 132, 10, 104, 50, 92, 90, 104, 104, 132]);
      K.cross(50, 106, 96, 'brown', 6); K.R('white', 44, 12, 12, 5);
      K.C('gold', 50, 30, 8); K.P('skin', [44, 38, 56, 38, 54, 64, 46, 64]); K.P('skin', [44, 38, 22, 31, 22, 35, 44, 45]); K.P('skin', [56, 38, 78, 31, 78, 35, 56, 45]);
      K.P('white', [44, 60, 56, 60, 58, 72, 42, 72]); K.P('skin', [46, 72, 54, 72, 52, 96, 48, 96]); K.C('skin', 50, 30, 4.6); K.P('dbrown', [45.5, 30, 46, 25, 54, 25, 54.5, 30, 53, 36, 47, 36]); K.C('skin', 50, 31, 3.4);
      K.man(20, 116, 52, 'blue', { halo: 'gold', veil: 'white', arms: 'pray' }); K.man(80, 116, 52, 'green', { halo: 'gold', hair: 'dbrown', cloak: 'red', arms: 'pray', dir: -1 });
    } },
    { id: 'resurrection', zh: '复活', en: 'The Resurrection', ref: 'Matthew 28', draw: function (K) {
      K.bg('yellow', 'orange'); K.rays('white', 50, 44, 20, 70, 18); K.E('yellow', 50, 54, 24, 44); K.Q('stone', [-4, 132, 0, 70, 30, 60, 50, 82, 70, 60, 100, 70, 104, 132]);
      K.Q('night', [34, 118, 34, 82, 66, 82, 66, 118]); K.C('grey', 80, 106, 13); K.ground('green', 116, 2);
      K.christ(50, 104, 70, { robe: 'white', cloak: 'red', arms: 'up' }); K.L('dbrown', [64, 96, 64, 22], 1.2); K.P('white', [64, 22, 84, 22, 80, 29, 84, 36, 64, 36]); K.L('red', [66, 29, 81, 29], 1.6); K.L('red', [72, 23, 72, 35], 1.6);
      K.E('grey', 18, 122, 14, 5); K.C('skin', 31, 119, 3.4); K.Q('grey', [28, 118, 30, 113, 35, 115, 34, 119]); K.L('dbrown', [4, 126, 34, 110], 1.1);
    } },
    { id: 'ascension', zh: '耶稣升天', en: 'The Ascension', ref: 'Acts 1', draw: function (K) {
      K.bg('sky', 'white'); K.rays('yellow', 50, 34, 16, 60, 16); K.E('yellow', 50, 36, 20, 30); K.christ(50, 64, 52, { robe: 'white', cloak: 'gold', arms: 'up' });
      K.cloud(50, 68, 26); K.cloud(18, 50, 12); K.cloud(84, 46, 12); K.man(14, 40, 22, 'white', { wings: 'pink', halo: 'yellow', hair: 'gold', arms: 'pray' }); K.man(86, 36, 22, 'white', { wings: 'pink', halo: 'yellow', hair: 'gold', arms: 'pray', dir: -1 });
      K.Q('green', [-4, 132, 0, 106, 50, 96, 100, 106, 104, 132]);
      var cs = ['red', 'blue', 'green', 'purple', 'orange', 'blue', 'red']; for (var i = 0; i < 7; i++) K.man(10 + i * 13.4, 122 - Math.abs(i - 3) * 1.5, 36, cs[i], { halo: 'gold', hair: i % 2 ? 'dbrown' : 'white', beard: i % 3 === 0 ? 'white' : null, veil: i === 3 ? 'white' : null, arms: i % 2 ? 'up' : 'pray', dir: i < 3 ? 1 : -1 });
    } }
  ];
  function arc(cx, cy, r) { var p = [], i, a; for (i = 0; i <= 24; i++) { a = PI + PI * i / 24; p.push(cx + Math.cos(a) * r, cy + Math.sin(a) * r); } return p; }

  /* ── the four frescoes, each in a 100 × 100 box ── */
  var MURALS = [
    { id: 'shepherd', zh: '好牧人', en: 'The Good Shepherd', ref: 'John 10', draw: function (K) {
      K.bg('sky', 'yellow'); K.cloud(20, 16, 10); K.cloud(78, 12, 9); K.Q('dgreen', [-4, 104, 0, 52, 34, 46, 62, 58, 104, 44, 104, 104]); K.ground('green', 82, 4);
      K.tree(12, 70, 30, 'dgreen'); K.tree(90, 64, 24); K.christ(50, 90, 62, { arms: 'up', robe: 'white', cloak: 'red' });
      K.Q('white', [38, 36, 50, 28, 62, 36, 60, 44, 40, 44]); K.E('grey', 64, 36, 3.2, 4); K.L('dbrown', [42, 44, 41, 51], 1.2); K.L('dbrown', [58, 44, 59, 51], 1.2);
      K.sheep(20, 92, 8); K.sheep(34, 98, 6, -1); K.sheep(72, 96, 7, -1); K.sheep(86, 90, 8); K.L('dbrown', [68, 90, 70, 34, 74, 30, 77, 34], 1.3);
    } },
    { id: 'sermon', zh: '登山宝训', en: 'The Sermon on the Mount', ref: 'Matthew 5–7', draw: function (K) {
      K.bg('sky', 'white'); K.cloud(16, 14, 10); K.cloud(84, 18, 11); K.Q('green', [-4, 104, 6, 70, 50, 34, 94, 70, 104, 104]); K.tree(8, 64, 20, 'dgreen'); K.tree(93, 62, 18, 'dgreen');
      K.rays('yellow', 50, 22, 10, 16, 14); K.christ(50, 62, 48, { arms: 'out' });
      var cs = ['red', 'blue', 'purple', 'orange', 'green', 'brown', 'pink'], i;
      for (i = 0; i < 6; i++) K.man(12 + i * 15.5, 82 + Math.abs(i - 2.5) * -3, 28, cs[i], { hair: i % 2 ? 'dbrown' : 'white', veil: i === 4 ? 'white' : null, kneel: true, arms: 'pray', dir: i < 3 ? 1 : -1 });
      for (i = 0; i < 7; i++) K.man(6 + i * 14.6, 98, 30, cs[(i + 3) % 7], { hair: i % 3 ? 'dbrown' : 'orange', skin: i % 3 === 1 ? 'brown' : 'skin', kneel: true, dir: i < 4 ? 1 : -1 });
    } },
    { id: 'jacob', zh: '雅各的梯子', en: "Jacob's Ladder", ref: 'Genesis 28', draw: function (K) {
      K.bg('night', 'purple'); K.stars(16, 31, 60); K.rays('yellow', 84, 10, 8, 24, 12); K.C('white', 84, 10, 8); K.cloud(84, 20, 12);
      K.Q('dbrown', [-4, 104, 0, 78, 40, 72, 104, 82, 104, 104]);
      K.L('gold', [24, 84, 74, 16], 1.6); K.L('gold', [36, 88, 86, 20], 1.6); for (var i = 0; i < 9; i++) K.L('gold', [27.5 + i * 5.4, 79.5 - i * 7.3, 39.5 + i * 5.4, 83.5 - i * 7.3], 1.2);
      K.man(42, 72, 24, 'white', { wings: 'yellow', halo: 'gold', hair: 'gold', arms: 'up' }); K.man(58, 50, 22, 'pink', { wings: 'white', halo: 'gold', hair: 'dbrown', arms: 'pray' }); K.man(72, 30, 20, 'white', { wings: 'yellow', halo: 'gold', hair: 'gold', arms: 'up' });
      K.E('stone', 12, 90, 7, 4); K.Q('red', [14, 86, 52, 84, 56, 96, 16, 98]); K.C('skin', 14, 85, 4.6); K.P('dbrown', [10, 82, 18, 81, 17, 85, 10, 86]);
    } },
    { id: 'jonah', zh: '约拿与大鱼', en: 'Jonah and the Great Fish', ref: 'Jonah 1–2', draw: function (K) {
      K.bg('grey', 'sky'); K.cloud(24, 14, 14, 'grey'); K.cloud(70, 10, 12, 'grey'); K.P('yellow', [60, 16, 66, 30, 62, 30, 68, 44, 58, 28, 62, 28]);
      K.water(50, 'blue'); K.Q('brown', [58, 46, 96, 46, 90, 60, 64, 60]); K.L('dbrown', [77, 46, 77, 14], 1.4); K.P('white', [77, 16, 94, 40, 77, 42]); K.P('white', [76, 20, 64, 40, 76, 42]);
      K.Q('green', [4, 76, 30, 52, 62, 60, 72, 78, 56, 94, 22, 96]); K.P('green', [8, 80, -4, 64, -2, 96]); K.Q('red', [50, 70, 70, 68, 70, 82, 52, 80]);
      K.C('white', 44, 66, 4); K.dot('black', 45, 66, 1.8); K.man(62, 86, 26, 'orange', { hair: 'dbrown', beard: 'dbrown', arms: 'up' }); K.P('white', [53, 70, 56, 76, 59, 70]); K.P('white', [61, 70, 64, 76, 67, 70]);
      K.water(88, 'blue');
    } }
  ];

  function leadAndLight(x, w, h, seed, bars) {
    var r = rng(seed), i;
    for (i = 0; i < 520; i++) { x.fillStyle = 'rgba(' + (r() < 0.5 ? '255,255,255,' : '0,0,20,') + (0.02 + r() * 0.07) + ')'; x.fillRect(r() * w, r() * h, 6 + r() * w * 0.07, 6 + r() * w * 0.07); }
    x.fillStyle = '#0b0a12'; for (i = 1; i < bars; i++) x.fillRect(0, Math.round(h * i / bars) - 1.5, w, 3);
    var g = x.createRadialGradient(w / 2, h * 0.45, w * 0.1, w / 2, h * 0.5, Math.max(w, h) * 0.75); g.addColorStop(0, 'rgba(255,250,225,.16)'); g.addColorStop(1, 'rgba(0,0,20,.3)'); x.fillStyle = g; x.fillRect(0, 0, w, h);
  }
  function border(x, w, h, b) {
    var cols = ['#c8202a', '#f2b632', '#1d46c8', '#f3efe2'], n, i, s;
    function seg(px, py, sw, sh, k) { x.fillStyle = cols[k % 4]; x.fillRect(px, py, sw, sh); x.strokeStyle = '#0c0a14'; x.lineWidth = 2.5; x.strokeRect(px, py, sw, sh); }
    n = Math.round(w / (b * 1.4)); s = w / n; for (i = 0; i < n; i++) { seg(i * s, 0, s, b, i); seg(i * s, h - b, s, b, i + 2); }
    n = Math.round((h - 2 * b) / (b * 1.4)); s = (h - 2 * b) / n; for (i = 0; i < n; i++) { seg(0, b + i * s, b, s, i + 1); seg(w - b, b + i * s, b, s, i + 3); }
  }
  function quarries(x, x0, y0, w, h, d, a, b) {
    x.save(); x.beginPath(); x.rect(x0, y0, w, h); x.clip(); x.fillStyle = a; x.fillRect(x0, y0, w, h);
    var i, j, k = 0; x.strokeStyle = '#0c0a14'; x.lineWidth = 2;
    for (j = y0 - d; j < y0 + h + d; j += d / 2, k++) for (i = x0 - d + (k % 2) * d / 2; i < x0 + w + d; i += d) {
      x.beginPath(); x.moveTo(i, j - d / 2); x.lineTo(i + d / 2, j); x.lineTo(i, j + d / 2); x.lineTo(i - d / 2, j); x.closePath(); x.fillStyle = (k + Math.round(i / d)) % 3 ? a : b; x.fill(); x.stroke();
      x.fillStyle = '#f2b632'; x.beginPath(); x.arc(i, j, d * 0.09, 0, TAU); x.fill();
    }
    x.restore();
  }
  function rosette(x, cx, cy, r, k) {
    var i, a, cols = ['#c8202a', '#1d46c8', '#2f9a4a', '#7a35a8'];
    x.strokeStyle = '#0c0a14'; x.lineWidth = 2.5; x.fillStyle = '#f2b632'; x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.fill(); x.stroke();
    for (i = 0; i < 8; i++) { a = i * PI / 4; x.fillStyle = cols[(i + k) % 2 ? k % 4 : (k + 1) % 4]; x.beginPath(); x.arc(cx + Math.cos(a) * r * 0.56, cy + Math.sin(a) * r * 0.56, r * 0.3, 0, TAU); x.fill(); x.stroke(); }
    x.fillStyle = '#f3efe2'; x.beginPath(); x.arc(cx, cy, r * 0.27, 0, TAU); x.fill(); x.stroke();
  }
  function label(x, w, x0, y0, bw, bh, zh, en, dark) {
    x.fillStyle = dark ? '#2a1c12' : '#f3e6bd'; x.fillRect(x0, y0, bw, bh); x.strokeStyle = dark ? '#c9a04e' : '#0c0a14'; x.lineWidth = dark ? 2 : 3; x.strokeRect(x0, y0, bw, bh);
    x.fillStyle = dark ? '#ecd9a6' : '#1a1410'; x.textAlign = 'center'; x.textBaseline = 'middle';
    var fz = bh * 0.44, fe = bh * 0.24; x.font = '700 ' + fz + 'px ' + SERIF; while (x.measureText(zh).width > bw * 0.92 && fz > 6) { fz -= 1; x.font = '700 ' + fz + 'px ' + SERIF; }
    x.fillText(zh, x0 + bw / 2, y0 + bh * 0.36);
    x.font = 'italic ' + fe + 'px ' + SERIF; while (x.measureText(en).width > bw * 0.94 && fe > 5) { fe -= 0.5; x.font = 'italic ' + fe + 'px ' + SERIF; }
    x.fillText(en, x0 + bw / 2, y0 + bh * 0.78);
  }

  /* a story window on a w × h canvas (the lancet's arch crops the top): border, the scene under a round head, the name below it */
  function glass(x, w, h, id) {
    var st = STORIES.filter(function (s) { return s.id === id; })[0] || STORIES[0], k = STORIES.indexOf(st), b = w * 0.065;
    var sw = w - 2 * b - w * 0.07, sh = sw * 1.3, sx = (w - sw) / 2, lh = w * 0.2, sy = h - b - lh - w * 0.05 - sh, r = sw / 2, y;
    x.fillStyle = '#0a0d2a'; x.fillRect(0, 0, w, h);
    quarries(x, b, b, w - 2 * b, h - 2 * b, w * 0.115, k % 2 ? '#a31b26' : '#1a3aa8', k % 2 ? '#1a3aa8' : '#a31b26');
    for (y = sy - w * 0.3, k = 0; y > w * 0.5; y -= w * 0.52, k++) rosette(x, w / 2, y, w * 0.2, k);
    x.save(); x.beginPath(); x.moveTo(sx, sy + sh); x.lineTo(sx, sy + r * 0.55); x.quadraticCurveTo(sx, sy, w / 2, sy - r * 0.12); x.quadraticCurveTo(sx + sw, sy, sx + sw, sy + r * 0.55); x.lineTo(sx + sw, sy + sh); x.closePath();
    x.save(); x.clip(); x.translate(sx, sy - r * 0.12); x.scale(sw / 100, (sh + r * 0.12) / 130); st.draw(kit(x, false, 130)); x.restore();
    x.strokeStyle = '#0c0a14'; x.lineWidth = w * 0.03; x.stroke(); x.strokeStyle = '#f2b632'; x.lineWidth = w * 0.014; x.stroke(); x.restore();
    label(x, w, sx, sy + sh + w * 0.025, sw, lh, st.zh, st.en + ' · ' + st.ref);
    border(x, w, h, b); leadAndLight(x, w, h, 40 + STORIES.indexOf(st), Math.round(h / w * 3.2));
  }
  /* a standing saint under a canopy, for the clerestory (four of them, k = 0..3) */
  function saint(x, w, h, k) {
    var b = w * 0.07, K, robe = ['red', 'blue', 'green', 'purple'][k % 4], cloak = ['blue', 'gold', 'red', 'white'][k % 4];
    x.fillStyle = '#0a0d2a'; x.fillRect(0, 0, w, h); quarries(x, b, b, w - 2 * b, h - 2 * b, w * 0.13, k % 2 ? '#1a3aa8' : '#8a1a24', '#d8dcec');
    x.save(); x.translate(b, h * 0.2); x.scale((w - 2 * b) / 100, (w - 2 * b) / 100); K = kit(x, false, 200); var H = (h * 0.76) / ((w - 2 * b) / 100);
    K.Q(k % 2 ? 'red' : 'blue', [12, H, 12, 8, 50, -14, 88, 8, 88, H]); K.man(50, H - 6, H * 0.86, robe, { halo: 'gold', hair: k % 2 ? 'white' : 'dbrown', beard: k % 2 ? 'white' : 'dbrown', cloak: cloak, arms: 'pray' });
    if (k % 4 === 0) K.R('gold', 56, H * 0.36, 13, 17); else if (k % 4 === 1) { K.L('gold', [68, H * 0.3, 68, H * 0.56], 2.4); K.C('gold', 68, H * 0.28, 4.5); } else if (k % 4 === 2) K.L('dbrown', [72, H - 6, 72, H * 0.14], 2.2); else { K.L('grey', [70, H * 0.62, 70, H * 0.2], 3); K.L('gold', [64, H * 0.5, 76, H * 0.5], 2.4); }
    x.restore(); rosette(x, w / 2, h * 0.12, w * 0.17, k); border(x, w, h, b); leadAndLight(x, w, h, 70 + k, Math.round(h / w * 3.2));
  }
  /* the west rose on an s × s canvas: the Virgin and Child at the heart, twelve petals, then twenty-four */
  function rose(x, s) {
    var c = s / 2, R = s * 0.485, i, a, cols = ['#1d46c8', '#c8202a', '#7a35a8', '#1d46c8', '#2f9a4a', '#c8202a'], K;
    x.fillStyle = '#07081c'; x.fillRect(0, 0, s, s); x.save(); x.translate(c, c);
    x.strokeStyle = '#0c0a14'; x.lineWidth = s * 0.008; x.fillStyle = '#16308a'; x.beginPath(); x.arc(0, 0, R, 0, TAU); x.fill();
    function petal(r0, r1, n, i, col, med) {
      var a0 = i * TAU / n, half = PI / n * 0.9;
      x.save(); x.rotate(a0); x.beginPath(); x.moveTo(r0, -Math.tan(half) * r0 * 0.9); x.lineTo(r1 * 0.86, -Math.sin(half) * r1 * 0.86); x.quadraticCurveTo(r1 * 1.02, -Math.sin(half) * r1 * 0.8, r1, 0);
      x.quadraticCurveTo(r1 * 1.02, Math.sin(half) * r1 * 0.8, r1 * 0.86, Math.sin(half) * r1 * 0.86); x.lineTo(r0, Math.tan(half) * r0 * 0.9); x.closePath(); x.fillStyle = col; x.fill(); x.stroke();
      var mr = Math.sin(half) * (r0 + r1) / 2 * 0.62, mx = r0 + (r1 - r0) * 0.62; x.beginPath(); x.arc(mx, 0, mr, 0, TAU); x.fillStyle = med; x.fill(); x.stroke();
      x.beginPath(); x.arc(mx, 0, mr * 0.42, 0, TAU); x.fillStyle = '#f2b632'; x.fill(); x.stroke();
      x.beginPath(); x.arc(r0 + (r1 - r0) * 0.2, 0, mr * 0.34, 0, TAU); x.fillStyle = '#f3efe2'; x.fill(); x.stroke(); x.restore();
    }
    for (i = 0; i < 24; i++) petal(R * 0.56, R * 0.97, 24, i + 0.5, cols[i % 6], i % 2 ? '#f3efe2' : '#f2b632');
    x.beginPath(); x.arc(0, 0, R * 0.56, 0, TAU); x.fillStyle = '#0d1450'; x.fill(); x.stroke();
    for (i = 0; i < 12; i++) petal(R * 0.2, R * 0.54, 12, i, cols[(i + 1) % 6 === 4 ? 0 : (i + 1) % 6], i % 2 ? '#c8202a' : '#1d46c8');
    for (i = 0; i < 24; i++) { a = (i + 0.5) * TAU / 24; x.beginPath(); x.arc(Math.cos(a) * R * 0.985, Math.sin(a) * R * 0.985, R * 0.035, 0, TAU); x.fillStyle = i % 2 ? '#c8202a' : '#f2b632'; x.fill(); }
    x.beginPath(); x.arc(0, 0, R * 0.2, 0, TAU); x.fillStyle = '#f2b632'; x.fill(); x.stroke();
    x.save(); x.scale(R * 0.4 / 100, R * 0.4 / 100); x.translate(-50, -52); K = kit(x, false, 100);
    K.man(50, 100, 96, 'blue', { halo: 'white', veil: 'white', crown: true, cloak: 'red' }); K.C('white', 50, 62, 12); K.man(50, 86, 38, 'red', { hair: 'gold', arms: 'out' }); x.restore();
    x.lineWidth = s * 0.016; x.strokeStyle = '#0c0a14'; x.beginPath(); x.arc(0, 0, R, 0, TAU); x.stroke(); x.beginPath(); x.arc(0, 0, R * 0.56, 0, TAU); x.stroke();
    x.restore(); var g = x.createRadialGradient(c, c, s * 0.05, c, c, s * 0.5); g.addColorStop(0, 'rgba(255,250,225,.2)'); g.addColorStop(1, 'rgba(0,0,20,.22)'); x.fillStyle = g; x.fillRect(0, 0, s, s);
  }

  function plaster(x, w, h, seed, base) {
    var r = rng(seed), i, k, px, py; x.fillStyle = base || '#d9c9a6'; x.fillRect(0, 0, w, h);
    for (i = 0; i < 900; i++) { x.fillStyle = 'rgba(' + (r() < 0.5 ? '90,62,34,' : '255,246,224,') + (0.02 + r() * 0.05) + ')'; x.beginPath(); x.arc(r() * w, r() * h, 3 + r() * w * 0.04, 0, TAU); x.fill(); }
    x.strokeStyle = 'rgba(70,50,34,.22)'; x.lineWidth = 1;
    for (i = 0; i < 9; i++) { px = r() * w; py = r() * h; x.beginPath(); x.moveTo(px, py); for (k = 0; k < 6; k++) { px += (r() - 0.5) * w * 0.12; py += r() * h * 0.06; x.lineTo(px, py); } x.stroke(); }
  }
  /* a fresco on a w × h canvas (h a little more than w): a painted border, the scene, its name on a banner below */
  function mural(x, w, h, id) {
    var m = MURALS.filter(function (s) { return s.id === id; })[0] || MURALS[0], b = w * 0.055, sw = w - 2 * b, bh = h - w, i, n, s, r = rng(11 + MURALS.indexOf(m));
    plaster(x, w, h, 5 + MURALS.indexOf(m));
    x.save(); x.beginPath(); x.rect(b, b, sw, sw); x.clip(); x.translate(b, b); x.scale(sw / 100, sw / 100); m.draw(kit(x, true, 100)); x.restore();
    x.fillStyle = '#8f3b2c'; x.fillRect(0, 0, w, b); x.fillRect(0, 0, b, h); x.fillRect(w - b, 0, b, h); x.fillRect(0, sw + b, w, h - sw - b);
    n = Math.round(w / (b * 1.2)); s = w / n; x.fillStyle = '#d2ac5c'; for (i = 0; i < n; i++) { x.beginPath(); x.arc(i * s + s / 2, b / 2, b * 0.22, 0, TAU); x.fill(); x.beginPath(); x.arc(b / 2, i * s + s / 2, b * 0.22, 0, TAU); x.fill(); x.beginPath(); x.arc(w - b / 2, i * s + s / 2, b * 0.22, 0, TAU); x.fill(); }
    x.strokeStyle = '#d2ac5c'; x.lineWidth = w * 0.008; x.strokeRect(b, b, sw, sw);
    label(x, w, b * 1.6, sw + b + (bh - b) * 0.14, w - b * 3.2, (bh - b) * 0.72, m.zh, m.en + ' · ' + m.ref, true);
    for (i = 0; i < 1400; i++) { x.fillStyle = 'rgba(' + (r() < 0.6 ? '226,212,180,' : '80,60,40,') + (0.03 + r() * 0.1) + ')'; x.fillRect(r() * w, r() * h, 1 + r() * 4, 1 + r() * 4); }
    var g = x.createRadialGradient(w / 2, h / 2, w * 0.25, w / 2, h / 2, w * 0.8); g.addColorStop(0, 'rgba(255,240,210,0)'); g.addColorStop(1, 'rgba(60,40,25,.28)'); x.fillStyle = g; x.fillRect(0, 0, w, h);
  }
  /* the triforium frieze (tiles sideways): angels and saints walking east under a painted arcade */
  function frieze(x, w, h) {
    var n = 8, cw = w / n, i, K, r = rng(77), robes = ['red', 'blue', 'green', 'purple', 'orange', 'blue', 'red', 'green'];
    plaster(x, w, h, 19, '#cdb98f'); x.fillStyle = '#31496f'; x.fillRect(0, h * 0.1, w, h * 0.8);
    for (i = 0; i < n; i++) {
      x.save(); x.translate(i * cw, h * 0.1); x.scale(cw / 100, cw / 100); K = kit(x, true, 200); var H = h * 0.8 / (cw / 100);
      K.Q(i % 2 ? 'gold' : 'stone', [6, H + 4, 6, 26, 50, -22, 94, 26, 94, H + 4]); K.Q(i % 2 ? 'blue' : 'night', [13, H + 4, 13, 30, 50, -10, 87, 30, 87, H + 4]); K.star(50, 22, 5, 'gold', 6);
      K.man(50, H, H * 0.74, robes[i], i % 2 ? { halo: 'gold', hair: i % 4 === 1 ? 'white' : 'dbrown', beard: i % 4 === 1 ? 'white' : null, cloak: 'white', arms: 'pray' } : { wings: 'white', halo: 'gold', hair: 'gold', long: true, arms: 'fwd' });
      x.restore();
    }
    x.fillStyle = '#8f3b2c'; x.fillRect(0, 0, w, h * 0.1); x.fillRect(0, h * 0.9, w, h * 0.1); x.fillStyle = '#d2ac5c';
    for (i = 0; i < w; i += h * 0.14) { x.beginPath(); x.arc(i + h * 0.07, h * 0.05, h * 0.022, 0, TAU); x.fill(); x.beginPath(); x.arc(i + h * 0.07, h * 0.95, h * 0.022, 0, TAU); x.fill(); }
    for (i = 0; i < 900; i++) { x.fillStyle = 'rgba(' + (r() < 0.6 ? '226,212,180,' : '80,60,40,') + (0.03 + r() * 0.1) + ')'; x.fillRect(r() * w, r() * h, 1 + r() * 4, 1 + r() * 4); }
  }

  /* ── the verse tablets ── */
  var NOBREAK = '，。；：、？！”’）》';
  function wrapZh(x, s, mw) { var out = [], line = '', i, ch; for (i = 0; i < s.length; i++) { ch = s[i]; if (line && x.measureText(line + ch).width > mw && NOBREAK.indexOf(ch) < 0) { out.push(line); line = ch; } else line += ch; } if (line) out.push(line); return out; }
  function wrapEn(x, s, mw) { var out = [], line = ''; s.split(' ').forEach(function (wd) { var t = line ? line + ' ' + wd : wd; if (line && x.measureText(t).width > mw) { out.push(line); line = wd; } else line = t; }); if (line) out.push(line); return out; }
  function parchment(x, w, h, seed) {
    var r = rng(seed), i, g = x.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#f3e8cc'); g.addColorStop(1, '#e6d5ae'); x.fillStyle = g; x.fillRect(0, 0, w, h);
    for (i = 0; i < 260; i++) { x.fillStyle = 'rgba(' + (r() < 0.5 ? '120,84,40,' : '255,250,235,') + (0.02 + r() * 0.05) + ')'; x.beginPath(); x.arc(r() * w, r() * h, 4 + r() * w * 0.06, 0, TAU); x.fill(); }
    x.strokeStyle = '#8f2a22'; x.lineWidth = w * 0.012; x.strokeRect(w * 0.035, w * 0.035, w - w * 0.07, h - w * 0.07);
    x.strokeStyle = '#b8892e'; x.lineWidth = w * 0.005; x.strokeRect(w * 0.055, w * 0.055, w - w * 0.11, h - w * 0.11);
    [[0.055, 0.055], [0.945, 0.055], [0.055, 1], [0.945, 1]].forEach(function (q) { var cx = w * q[0], cy = q[1] === 1 ? h - w * 0.055 : w * q[1]; x.fillStyle = '#b8892e'; x.beginPath(); x.arc(cx, cy, w * 0.018, 0, TAU); x.fill(); });
  }
  /* tablet n (1..30) of v = [ref zh, ref en, zh, en]: number, reference, the verse in Chinese, then in English, sized to fit */
  function tablet(x, w, h, n, v) {
    parchment(x, w, h, 100 + n); var mw = w * 0.8, cx = w / 2, y = w * 0.17, fz, fe, zl, el, need, room, i;
    x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillStyle = '#8f2a22'; x.beginPath(); x.arc(cx, y, w * 0.062, 0, TAU); x.fill(); x.strokeStyle = '#b8892e'; x.lineWidth = w * 0.008; x.stroke();
    x.fillStyle = '#f6e7b8'; x.font = '700 ' + w * 0.066 + 'px ' + SERIF; x.fillText(String(n), cx, y + w * 0.004);
    y += w * 0.125; x.fillStyle = '#5c1c16'; x.font = '700 ' + w * 0.076 + 'px ' + SERIF; x.fillText(v[0], cx, y);
    y += w * 0.074; x.fillStyle = '#7a5a2a'; x.font = 'italic ' + w * 0.043 + 'px ' + SERIF; x.fillText(v[1], cx, y);
    y += w * 0.052; x.strokeStyle = '#b8892e'; x.lineWidth = w * 0.004; x.beginPath(); x.moveTo(cx - w * 0.28, y); x.lineTo(cx - w * 0.03, y); x.moveTo(cx + w * 0.03, y); x.lineTo(cx + w * 0.28, y); x.stroke();
    x.fillStyle = '#b8892e'; x.beginPath(); x.moveTo(cx, y - w * 0.014); x.lineTo(cx + w * 0.014, y); x.lineTo(cx, y + w * 0.014); x.lineTo(cx - w * 0.014, y); x.fill();
    y += w * 0.045; room = h - w * 0.1 - y;
    for (fz = w * 0.07; fz >= w * 0.036; fz -= w * 0.002) {
      fe = fz * 0.6; x.font = '600 ' + fz + 'px ' + SERIF; zl = wrapZh(x, v[2], mw); x.font = 'italic ' + fe + 'px ' + SERIF; el = wrapEn(x, v[3], mw);
      need = zl.length * fz * 1.42 + fz * 0.7 + el.length * fe * 1.36; if (need <= room) break;
    }
    y += (room - need) * 0.42 + fz * 0.7; x.fillStyle = '#2a1a10'; x.font = '600 ' + fz + 'px ' + SERIF;
    for (i = 0; i < zl.length; i++) { x.fillText(zl[i], cx, y); y += fz * 1.42; }
    y += fz * 0.7 - fz * 0.4; x.fillStyle = '#5b452a'; x.font = 'italic ' + fe + 'px ' + SERIF;
    for (i = 0; i < el.length; i++) { x.fillText(el[i], cx, y); y += fe * 1.36; }
    return { zh: zl.length, en: el.length, size: fz };
  }
  /* the title tablet at the head of each aisle */
  function title(x, w, h, lines) {
    parchment(x, w, h, 99); x.textAlign = 'center'; x.textBaseline = 'middle'; var cx = w / 2;
    x.fillStyle = '#8f2a22'; x.font = '700 ' + w * 0.2 + 'px ' + SERIF; x.fillText('✝', cx, h * 0.17);
    x.fillStyle = '#5c1c16'; x.font = '700 ' + w * 0.115 + 'px ' + SERIF; x.fillText(lines[0], cx, h * 0.36);
    x.fillStyle = '#7a5a2a'; x.font = 'italic ' + w * 0.052 + 'px ' + SERIF; x.fillText(lines[1], cx, h * 0.46);
    x.fillStyle = '#2a1a10'; x.font = '600 ' + w * 0.056 + 'px ' + SERIF; x.fillText(lines[2], cx, h * 0.62); x.fillText(lines[3], cx, h * 0.7);
    x.fillStyle = '#5b452a'; x.font = 'italic ' + w * 0.04 + 'px ' + SERIF; x.fillText(lines[4], cx, h * 0.82); x.fillText(lines[5], cx, h * 0.87);
  }

  root.SpatialChurchArt = { STORIES: STORIES, MURALS: MURALS, glass: glass, rose: rose, saint: saint, mural: mural, frieze: frieze, tablet: tablet, title: title, wrapZh: wrapZh, wrapEn: wrapEn };
})(typeof window !== 'undefined' ? window : globalThis);
