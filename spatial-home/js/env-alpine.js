/* Minest · Spatial Home — environment "alpine": Alpine Meadow Chalet (阿尔卑斯高山草甸木屋).
   A Swiss chalet room in summer: log walls, ceiling beams, larch floor, a stone fireplace, and one wide horizontal window the
   desk looks through. Outside, three depths: the meadow right under the window (wildflowers, a split-rail fence, grass that
   moves), the middle distance (rolling slopes and pine forest), and far away a snow massif after the Eiger – Mönch – Jungfrau
   line. A small terrace through the glass door is walkable (areas). Day / night / dusk alpenglow from the local time.
   Performance: each depth is one merged mesh (no shadows outside), cell size grows with distance, the grass is one
   InstancedMesh swayed in its vertex shader, and the far range lives in aerial fog. */
(function (root) {
  'use strict';
  var THREE = root.THREE, SV = root.SpatialVoxel, VB = SV.VB, MAT = SV.MAT, SR = root.SpatialRoom, PT = SR.parts;
  var W = PT.size.W, D = PT.size.D, H = 3.1;
  var WIN = { x0: -1.75, x1: 2.5, y0: 0.95, y1: 2.62 }, DOOR = { x0: -2.75, x1: -1.95, y1: 2.15 };
  var THEME = {
    woodLight: '#c48a50', wood: '#9a6436', woodDark: '#6b4423', blue: '#a8322a', blueDeep: '#7a241e', blueSoft: '#e9dcc0',
    plaster: '#efe5d0', plaster2: '#e2d5bb', stone: '#b9b2a6', stone2: '#a69f93', cream: '#f3ead8', straw: '#d2ad6a', terracotta: '#9a5b3a',
    gold: '#c9a25a', coral: '#c7463a'
  };
  function hash(x, z) { var s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453; return s - Math.floor(s); }
  function noise(x, z) {                                             // smooth value noise
    var xi = Math.floor(x), zi = Math.floor(z), xf = x - xi, zf = z - zi, u = xf * xf * (3 - 2 * xf), v = zf * zf * (3 - 2 * zf);
    var a = hash(xi, zi), b = hash(xi + 1, zi), c = hash(xi, zi + 1), d = hash(xi + 1, zi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  /* the land: d = distance out from the window wall. A meadow falling gently from the chalet, a valley, then the massif. */
  var PEAKS = [
    { x: -1150, d: 3300, h: 1150, s: 360, p: 0.5 },                  // a sharp, steep peak (after the Eiger)
    { x: 150, d: 3650, h: 1080, s: 380, p: 1.6 },                    // a rounded snow dome (after the Mönch)
    { x: 1350, d: 3950, h: 1280, s: 460, p: 0.75 },                   // a broad crowned summit with shoulders (after the Jungfrau)
    { x: 1950, d: 3700, h: 820, s: 300, p: 1.2 }, { x: -2100, d: 3500, h: 760, s: 420, p: 1.2 }
  ];
  function land(x, d) {
    var h = -0.8 - d * 0.035 + (noise(x / 14, d / 14) - 0.5) * 1.2;
    h += Math.max(0, d - 120) * 0.035 - Math.max(0, d - 450) * 0.02;   // the valley, then the far side rising
    h += (noise(x / 160, d / 160) - 0.4) * Math.min(1, d / 300) * 70;  // rolling slopes
    var ridge = 480 * Math.exp(-Math.pow((d - 3500) / 700, 2)) * (0.8 + 0.4 * noise(x / 400, 3));
    var m = 0; PEAKS.forEach(function (P) { var g = Math.exp(-((x - P.x) * (x - P.x) + (d - P.d) * (d - P.d)) / (2 * P.s * P.s)); m = Math.max(m, P.h * Math.pow(g, 1 / P.p)); });
    return h + Math.max(ridge, m) * Math.min(1, Math.max(0, (d - 1200) / 900)) + (d > 1500 ? (noise(x / 60, d / 60) - 0.5) * 60 : 0);
  }

  function terrain(holder) {
    /* three rings, cell size growing with distance; each one merged mesh */
    function ring(seed, d0, d1, cell, xmax, colour) {
      var v = new VB(seed), d, x;
      for (d = d0; d < d1; d += cell) {
        var half = Math.min(xmax, 40 + d * 1.15);                    // only what the window can see
        for (x = -half; x < half; x += cell) {
          var cx = x + cell / 2, cd = d + cell / 2, h = land(cx, cd), top = Math.round(h / (cell * 0.5)) * cell * 0.5;
          v.box(x, top - cell * 1.6 - 4, -D - 0.3 - d - cell, x + cell, top, -D - 0.3 - d, colour(h, cx, cd, v.r));
        }
      }
      var m = v.mesh(null, true); holder.add(m); return m;
    }
    function grassy(h, x, d, r) { var n = noise(x / 9, d / 9); return n < 0.33 ? '#6fa94f' : (n < 0.7 ? '#7cb85a' : '#8cc363'); }
    function hills(h, x, d) { return h > 260 ? '#8a9a7c' : (noise(x / 40, d / 40) < 0.5 ? '#5f9a48' : '#6aa652'); }
    function massif(h, x, d) {
      var snow = 520 + noise(x / 90, d / 90) * 160;
      if (h > snow) return h > snow + 120 ? '#f4f7fb' : '#e2e8f0';
      if (h > snow - 220) return noise(x / 30, d / 30) < 0.45 ? '#8d8f93' : '#7a7d82';
      return h > 160 ? '#6f8a63' : '#5d8d4a';
    }
    ring(3101, 0.5, 70, 1.5, 70, grassy);
    ring(3102, 70, 700, 10, 900, hills);
    ring(3103, 700, 5200, 45, 3600, massif);
  }
  /* wildflowers, the fence, pines: the near and middle life */
  function meadow(holder) {
    var v = new VB(3201), r = v.r, i, k, FL = ['#f6f2e8', '#f2cf3a', '#9b6fd0', '#e0483e', '#ffffff', '#f29ab8'];
    for (i = 0; i < 520; i++) {
      var x = (r() - 0.5) * 70, d = 1 + r() * 55, h = land(x, d), top = Math.round(h / 0.75) * 0.75, z = -D - 0.3 - d;
      v.box(x, top, z, x + 0.03, top + 0.18, z + 0.03, '#4f8a3c'); v.box(x - 0.04, top + 0.18, z - 0.04, x + 0.07, top + 0.24, z + 0.07, FL[(r() * FL.length) | 0]);
    }
    /* a split-rail fence across the meadow */
    for (i = 0; i < 26; i++) {
      var fx = -38 + i * 3, fd = 16 + Math.sin(i * 0.4) * 1.5, fh = land(fx, fd), ft = Math.round(fh / 0.75) * 0.75, fz = -D - 0.3 - fd;
      v.box(fx, ft - 0.2, fz, fx + 0.14, ft + 1.1, fz + 0.14, '#8a6a4a');
      if (i < 25) { var nh = Math.round(land(fx + 3, 16 + Math.sin((i + 1) * 0.4) * 1.5) / 0.75) * 0.75; for (k = 0; k < 2; k++) v.box(fx, Math.min(ft, nh) + 0.45 + k * 0.4, fz + 0.03, fx + 3, Math.min(ft, nh) + 0.53 + k * 0.4, fz + 0.11, '#9a7a56'); }
    }
    /* pines: stacked tiers, in bands on the slopes */
    for (i = 0; i < 340; i++) {
      var px = (r() - 0.5) * (300 + i * 3), pd = 45 + r() * 520; if (noise(px / 120, pd / 120) < 0.42) continue;
      if (Math.abs(px) < 30 + pd * 0.45 && pd < 260) continue;                // keep the line of sight to the peaks open
      var ph = land(px, pd), s = 5 + r() * 6, pz = -D - 0.3 - pd, top2 = ph + 1;
      v.box(px - s * 0.06, ph - 2, pz - s * 0.06, px + s * 0.06, top2 + s * 0.3, pz + s * 0.06, '#5b3f2a');
      for (k = 0; k < 4; k++) { var w2 = s * (0.42 - k * 0.09), y0 = top2 + s * (0.2 + k * 0.28); v.box(px - w2, y0, pz - w2, px + w2, y0 + s * 0.3, pz + w2, k % 2 ? '#2f5a34' : '#2a5030', 0.08); }
    }
    /* a hay barn and a far chalet for scale */
    function barn(x, d, s) { var h = land(x, d), z = -D - 0.3 - d; v.box(x - 4 * s, h - 1, z - 3 * s, x + 4 * s, h + 3.2 * s, z + 3 * s, '#8b5a32'); for (k = 0; k < 4; k++) v.box(x - 4.6 * s + k * 0.6 * s, h + 3.2 * s + k * 0.8 * s, z - 3.4 * s, x + 4.6 * s - k * 0.6 * s, h + 3.2 * s + (k + 1) * 0.8 * s, z + 3.4 * s, '#6b4628'); v.box(x - 1, h, z + 3 * s, x + 1, h + 2 * s, z + 3 * s + 0.05, '#4a2f1c'); }
    barn(-24, 34, 1); barn(60, 180, 2.2); barn(-140, 260, 2.4);
    var m = v.mesh(null, true); holder.add(m);
  }
  /* grass that moves: one InstancedMesh, swayed in the vertex shader (tips move, roots stay) */
  function grass(holder) {
    var N = 900, geo = new THREE.BoxGeometry(0.035, 0.32, 0.035); geo.translate(0, 0.16, 0);
    var mat = new THREE.MeshLambertMaterial({ color: 0x6fae4c }), U = { uTime: { value: 0 } };
    mat.onBeforeCompile = function (sh) {
      sh.uniforms.uTime = U.uTime;
      sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace('#include <begin_vertex>',
        '#include <begin_vertex>\n#ifdef USE_INSTANCING\n float ph = instanceMatrix[3].x * 0.9 + instanceMatrix[3].z * 0.6;\n transformed.x += sin(uTime * 1.6 + ph) * 0.06 * position.y / 0.32;\n transformed.z += cos(uTime * 1.1 + ph * 1.3) * 0.035 * position.y / 0.32;\n#endif');
    };
    var im = new THREE.InstancedMesh(geo, mat, N), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), p = new THREE.Vector3(), r = SV.rng(3301), col = new THREE.Color();
    for (var i = 0; i < N; i++) {
      var x = (r() - 0.5) * 34, d = 2.6 + r() * 22, h = Math.round(land(x, d) / 0.75) * 0.75;
      p.set(x, h, -D - 0.3 - d); q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), r() * 6); sc.set(1, 0.6 + r() * 0.9, 1);
      im.setMatrixAt(i, m4.compose(p, q, sc)); im.setColorAt(i, col.setHSL(0.26 + r() * 0.05, 0.45, 0.32 + r() * 0.12));
    }
    holder.add(im); return U;
  }
  function sky(holder) {
    var sg = new THREE.SphereGeometry(7000, 24, 12), col = new Float32Array(sg.attributes.position.count * 3);
    sg.setAttribute('color', new THREE.BufferAttribute(col, 3));
    holder.add(new THREE.Mesh(sg, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false })));
    var top = new THREE.Color(), hor = new THREE.Color(), t = new THREE.Color();
    return { set: function (a, b) { top.copy(a).convertSRGBToLinear(); hor.copy(b).convertSRGBToLinear(); var P = sg.attributes.position; for (var i = 0; i < P.count; i++) { var k = Math.max(0, Math.min(1, (P.getY(i) + 200) / 3600)); t.copy(hor).lerp(top, Math.pow(k, 0.6)); col[i * 3] = t.r; col[i * 3 + 1] = t.g; col[i * 3 + 2] = t.b; } sg.attributes.color.needsUpdate = true; } };
  }
  function clouds(holder) {
    var v = new VB(3401), r = v.r, i, k;
    for (i = 0; i < 18; i++) { var ox = -4000 + r() * 8000, oy = 900 + r() * 700, oz = -1500 - r() * 4000, n = 4 + ((r() * 4) | 0); for (k = 0; k < n; k++) v.box(ox + k * 120 - r() * 60, oy + r() * 40, oz - r() * 80, ox + k * 120 + 180 + r() * 100, oy + 50 + r() * 70, oz + 120 + r() * 80, '#ffffff'); }
    var mat = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.9, depthWrite: false });
    var m = new THREE.Mesh(v.geometry(), mat); holder.add(m); return { mesh: m, mat: mat };
  }

  /* ------------------------------------------------------------ the chalet room */
  function logs(v, x0, x1, z0, z1, y0, y1, along) {                // a log wall: courses of rounded logs, alternating tones
    for (var y = y0, i = 0; y < y1 - 0.001; y += 0.2, i++) {
      var t = Math.min(y1, y + 0.2), col = i % 2 ? '#a86d3c' : '#b47a45';
      v.box(x0, y, z0, x1, t, z1, col, 0.06);
      if (along === 'x') v.box(x0, y + 0.085, z0 - 0.012, x1, y + 0.115, z1 + 0.012, '#7d4f2b'); else v.box(x0 - 0.012, y + 0.085, z0, x1 + 0.012, y + 0.115, z1, '#7d4f2b');
    }
  }
  function shell(g) {
    var v = new VB(3001), x, z;
    v.box(-W - 0.3, -0.2, -D - 0.3, W + 0.3, -0.02, D + 0.3, '#7a5233');
    for (x = -W; x < W; x += 0.3) v.box(x + 0.006, -0.02, -D - 0.3, x + 0.294, 0, D + 0.3, ((x * 10) | 0) % 2 ? '#c99a62' : '#bf8f58', 0.07);
    logs(v, -W - 0.3, -W, -D - 0.3, D + 0.3, 0, H, 'z'); logs(v, W, W + 0.3, -D - 0.3, D + 0.3, 0, H, 'z'); logs(v, -W, W, D, D + 0.3, 0, H, 'x');
    /* window wall: logs around a wide opening and the terrace door */
    logs(v, -W, W, -D - 0.3, -D, WIN.y1, H, 'x');
    logs(v, WIN.x1, W, -D - 0.3, -D, WIN.y0, WIN.y1, 'x');
    logs(v, DOOR.x1, WIN.x0, -D - 0.3, -D, WIN.y0, WIN.y1, 'x');
    logs(v, -W, DOOR.x0, -D - 0.3, -D, WIN.y0, WIN.y1, 'x');
    g.add(v.mesh());
    /* the door opening: carve the logs below the window back out (a frame and a threshold over them) */
    var dv = new VB(3002);
    dv.box(DOOR.x0 - 0.08, 0, -D - 0.32, DOOR.x0, DOOR.y1 + 0.08, -D + 0.02, '#6b4423'); dv.box(DOOR.x1, 0, -D - 0.32, DOOR.x1 + 0.08, DOOR.y1 + 0.08, -D + 0.02, '#6b4423');
    dv.box(DOOR.x0 - 0.08, DOOR.y1, -D - 0.32, DOOR.x1 + 0.08, DOOR.y1 + 0.08, -D + 0.02, '#6b4423'); dv.box(DOOR.x0, 0, -D - 0.32, DOOR.x1, 0.02, -D + 0.02, '#6b4423');
    /* window frame, mullions, a deep larch sill */
    dv.box(WIN.x0 - 0.08, WIN.y0 - 0.05, -D - 0.32, WIN.x1 + 0.08, WIN.y0, -D + 0.08, '#c48a50');
    dv.box(WIN.x0 - 0.08, WIN.y1, -D - 0.32, WIN.x1 + 0.08, WIN.y1 + 0.08, -D + 0.02, '#6b4423');
    dv.box(WIN.x0 - 0.08, WIN.y0, -D - 0.32, WIN.x0, WIN.y1, -D + 0.02, '#6b4423'); dv.box(WIN.x1, WIN.y0, -D - 0.32, WIN.x1 + 0.08, WIN.y1, -D + 0.02, '#6b4423');
    for (x = WIN.x0 + 1.06; x < WIN.x1 - 0.2; x += 1.06) dv.box(x - 0.03, WIN.y0, -D - 0.26, x + 0.03, WIN.y1, -D - 0.2, '#6b4423');
    /* posts and ceiling beams, a ridge beam */
    [[-W, -D], [W - 0.2, -D], [-W, D - 0.2], [W - 0.2, D - 0.2]].forEach(function (p) { dv.box(p[0], 0, p[1], p[0] + 0.2, H, p[1] + 0.2, '#7d4f2b'); });
    for (z = -D + 0.4; z < D; z += 1.0) dv.box(-W, H - 0.22, z, W, H, z + 0.18, '#7d4f2b', 0.05);
    dv.box(-0.12, H - 0.3, -D, 0.12, H, D, '#6b4423');
    dv.box(-W - 0.3, H, -D - 0.3, W + 0.3, H + 0.25, D + 0.3, '#c99a62');
    g.add(dv.mesh());
    var glassM = new THREE.MeshPhongMaterial({ color: 0xd7ecff, transparent: true, opacity: 0.08, shininess: 160, specular: 0xffffff, depthWrite: false });
    var pane = new THREE.Mesh(new THREE.PlaneGeometry(WIN.x1 - WIN.x0, WIN.y1 - WIN.y0), glassM); pane.position.set((WIN.x0 + WIN.x1) / 2, (WIN.y0 + WIN.y1) / 2, -D - 0.24); g.add(pane);
  }
  /* the wall under the window, open where the terrace door is (and the logs over the door) */
  function lowerWall(g) { var v = new VB(3003); logs(v, -W, DOOR.x0, -D - 0.3, -D, 0, WIN.y0, 'x'); logs(v, DOOR.x1, W, -D - 0.3, -D, 0, WIN.y0, 'x'); logs(v, DOOR.x0, DOOR.x1, -D - 0.3, -D, DOOR.y1, WIN.y1, 'x'); g.add(v.mesh()); }
  function fireplace(g) {
    var v = new VB(3011), r = v.r, x, y;
    for (y = 0; y < H; y += 0.16) for (x = -0.85; x < 0.85; x += 0.28) {
      var w = 0.24 + r() * 0.06, inMouth = y < 0.75 && x > -0.5 && x < 0.45 && y > 0.12; if (inMouth) continue;
      if (y > 1.4 && (x < -0.55 || x > 0.5)) continue;                // the chimney breast narrows
      v.box(x + (y * 7 % 0.14), y, D - 0.45, x + w + (y * 7 % 0.14), y + 0.15, D - 0.02, r() < 0.5 ? '#a8a197' : (r() < 0.5 ? '#948d83' : '#b8b1a6'), 0.08);
    }
    v.box(-0.95, 0, D - 0.62, 0.95, 0.1, D - 0.02, '#8e877d');           // hearth
    v.box(-0.95, 0.8, D - 0.55, 0.95, 0.88, D - 0.02, '#7d4f2b');        // mantel beam
    v.box(-0.45, 0.12, D - 0.4, 0.4, 0.75, D - 0.38, '#2a2522');          // back of the firebox
    v.box(-0.3, 0.12, D - 0.32, 0.25, 0.2, D - 0.24, '#6b4423'); v.box(-0.25, 0.2, D - 0.3, 0.2, 0.27, D - 0.26, '#5b3a20');
    v.box(-0.7, 0.88, D - 0.3, -0.62, 1.05, D - 0.22, '#c9a25a'); v.box(0.5, 0.88, D - 0.3, 0.62, 0.98, D - 0.22, '#e9dcc0');   // a brass candlestick, a little clock
    g.add(v.mesh());
    var fv = new VB(3012); fv.box(-0.22, 0.2, D - 0.32, 0.18, 0.45, D - 0.28, '#ffb347'); fv.box(-0.12, 0.25, D - 0.31, 0.08, 0.58, D - 0.29, '#ffe08a');
    var fire = fv.mesh(MAT.glow(0.9), true); g.add(fire); return fire;
  }
  function decor(g) {
    var v = new VB(3021), i;
    /* a cowbell on a leather strap, a pair of old skis, a lantern by the door */
    v.box(-W + 0.02, 1.9, 1.2, -W + 0.05, 2.3, 1.26, '#5b3a20'); v.cb(-W + 0.12, 1.72, 1.23, 0.12, 0.18, 0.14, '#c9a25a');
    v.box(-W + 0.02, 0.4, 1.7, -W + 0.06, 2.2, 1.78, '#7d4f2b'); v.box(-W + 0.02, 0.4, 1.86, -W + 0.06, 2.2, 1.94, '#7d4f2b');
    v.cb(DOOR.x1 + 0.3, 0, -D + 0.25, 0.18, 0.04, 0.18, '#2a2522'); v.cb(DOOR.x1 + 0.3, 0.04, -D + 0.25, 0.14, 0.26, 0.14, '#3a3330');
    /* red-and-white checked cushions on the bench */
    for (i = 0; i < 6; i++) v.box(-2.98, 0.42, -0.9 + i * 0.2, -2.88, 0.66, -0.72 + i * 0.2, i % 2 ? '#c7463a' : '#f3ead8');
    /* heart cut-outs above the window (the chalet's own ornament) */
    for (i = 0; i < 4; i++) { var hx = -1.2 + i * 1.0; v.box(hx, WIN.y1 + 0.12, -D + 0.005, hx + 0.12, WIN.y1 + 0.22, -D + 0.02, '#7a241e'); }
    g.add(v.mesh());
    var lv = new VB(3022); lv.cb(DOOR.x1 + 0.3, 0.1, -D + 0.25, 0.08, 0.14, 0.08, '#ffd58a'); g.add(lv.mesh(MAT.glow(), true));
  }
  /* the terrace: larch deck, a railing with geraniums, two chairs and a small table */
  function terrace(g) {
    var v = new VB(3031), x, i, Z0 = -D - 0.3, Z1 = -D - 2.8, X0 = -3.5, X1 = 1.9;
    v.box(X0, -0.4, Z1, X1, -0.02, Z0, '#7a5233');
    for (x = X0; x < X1; x += 0.25) v.box(x + 0.005, -0.02, Z1, x + 0.245, 0, Z0, ((x * 8) | 0) % 2 ? '#c99a62' : '#bc8b53', 0.07);
    for (x = X0; x <= X1; x += 0.9) v.box(x, 0, Z1, x + 0.1, 1.05, Z1 + 0.1, '#7d4f2b');
    for (i = 0; i <= 3; i++) { var zz = Z0 - i * 0.9; v.box(X0, 0, zz - 0.1, X0 + 0.1, 1.05, zz, '#7d4f2b'); v.box(X1 - 0.1, 0, zz - 0.1, X1, 1.05, zz, '#7d4f2b'); }
    v.box(X0, 1.0, Z1, X1, 1.08, Z1 + 0.12, '#9a6436'); v.box(X0, 0.5, Z1, X1, 0.56, Z1 + 0.08, '#9a6436');
    v.box(X0, 1.0, Z1, X0 + 0.12, 1.08, Z0, '#9a6436'); v.box(X1 - 0.12, 1.0, Z1, X1, 1.08, Z0, '#9a6436');
    v.box(X0, 0.5, Z1, X0 + 0.08, 0.56, Z0, '#9a6436'); v.box(X1 - 0.08, 0.5, Z1, X1, 0.56, Z0, '#9a6436');
    /* flower boxes on the railing */
    for (i = 0; i < 3; i++) { var bx = X0 + 0.6 + i * 1.7; v.box(bx, 1.08, Z1 - 0.02, bx + 0.9, 1.26, Z1 + 0.22, '#8b5a32'); v.ball(bx + 0.45, 1.3, Z1 + 0.1, 0.24, 0.06, null, 0.2, true, function (rr) { return rr() < 0.55 ? (rr() < 0.6 ? '#d8352a' : '#e85a4f') : (rr() < 0.7 ? '#3f7a3c' : null); }); }
    /* two chairs and a table looking at the peaks */
    [[-2.6, -4.1], [-1.2, -4.1]].forEach(function (p) { v.box(p[0] - 0.25, 0, p[1] - 0.25, p[0] + 0.25, 0.42, p[1] + 0.25, '#9a6436'); v.box(p[0] - 0.25, 0.42, p[1] + 0.18, p[0] + 0.25, 0.9, p[1] + 0.25, '#9a6436'); v.box(p[0] - 0.22, 0.42, p[1] - 0.22, p[0] + 0.22, 0.47, p[1] + 0.18, '#c7463a'); });
    v.cb(-1.9, 0, -3.7, 0.5, 0.5, 0.5, '#7d4f2b'); v.cb(-1.9, 0.5, -3.7, 0.6, 0.04, 0.6, '#c48a50'); v.cb(-1.8, 0.54, -3.7, 0.08, 0.1, 0.08, '#f3ead8');
    g.add(v.mesh());
  }

  function build(scene) {
    var holder = new THREE.Group(); holder.name = 'env-alpine'; scene.add(holder);
    var g = new THREE.Group(); holder.add(g);
    PT.theme(THEME);
    shell(g); lowerWall(g); PT.rug(g); PT.desk(g); PT.chair(g); PT.bookshelf(g); PT.cabinet(g); PT.bench(g);
    PT.theme(null);
    var fire = fireplace(g); decor(g); terrace(g);
    var out = new THREE.Group(); holder.add(out);
    terrain(out); meadow(out); var G = grass(out), S = sky(out), CL = clouds(out);

    var hemi = new THREE.HemisphereLight(0xe9f2ff, 0x6a8a4a, 0.85); holder.add(hemi);
    var sun = new THREE.DirectionalLight(0xfff1d6, 1.1); sun.position.set(5, 7, -6); sun.target.position.set(0.2, 0.3, 0.3);
    sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); var sc = sun.shadow.camera; sc.left = -6; sc.right = 6; sc.top = 6; sc.bottom = -6; sc.near = 1; sc.far = 26;
    sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.02; holder.add(sun); holder.add(sun.target);
    var hearth = new THREE.PointLight(0xffa04a, 0.6, 6, 2); hearth.position.set(0, 0.5, D - 0.6); holder.add(hearth);
    var lamp = new THREE.PointLight(0xffd9a0, 0.3, 7, 2); lamp.position.set(0, H - 0.6, -0.2); holder.add(lamp);
    scene.fog = new THREE.Fog(0xcfe0ef, 1800, 14000); scene.background = null;

    var mode = 'auto', lastApply = -99, last = 0;
    function c3(a, b, k) { return new THREE.Color(a).lerp(new THREE.Color(b), k); }
    function apply() {
      var T = SR.timeOfDay(mode), L = T.light, K = T.dusk, N = T.night;
      var top = c3('#0a1430', '#4f94dd', L), hor = c3('#1f2b4a', '#d6e8f7', L); top.lerp(new THREE.Color('#5a5e9a'), K * 0.4); hor.lerp(new THREE.Color('#f2b08f'), K * 0.7);
      S.set(top, hor); scene.fog.color.copy(hor);
      sun.intensity = 0.12 + 1.0 * L; sun.color.copy(c3('#8fa4ff', '#fff3dc', L)).lerp(new THREE.Color('#ff9a6b'), K * 0.75);   // alpenglow at dusk
      hemi.intensity = 0.3 + 0.55 * L; hemi.color.copy(c3('#4b5a86', '#e9f2ff', L)).lerp(new THREE.Color('#ffc4a8'), K * 0.4);
      CL.mat.color.copy(c3('#2e3550', '#ffffff', L)).lerp(new THREE.Color('#ffc9ad'), K * 0.6);
      lamp.intensity = 0.25 + 0.55 * N; hearth.userData.base = 0.45 + 0.6 * N;
    }
    apply();
    return {
      id: 'alpine', name: 'Alpine Meadow Chalet', group: g, holder: holder, far: 8000, size: { W: W, D: D, H: H },
      anchors: PT.anchors(WIN.y0), start: PT.start, avatar: PT.avatar,
      desk: { pos: PT.deskCam.pos, look: [0, 1.1, -2.2] },   // a little higher than elsewhere: the peaks are the point
      solids: PT.solids().concat([[-0.95, 2.0, 0.95, 2.5]]),
      /* walkable beyond the room: the doorway and the terrace (x0, z0, x1, z1) */
      areas: [[DOOR.x0 + 0.05, -D - 0.6, DOOR.x1 - 0.05, -D + 0.3], [-3.5 + 0.3, -D - 2.8 + 0.3, 1.9 - 0.3, -D - 0.3]],
      setTime: function (m) { mode = m || 'auto'; apply(); },
      tick: function (t) {
        var dt = Math.min(0.1, Math.max(0, t - last)); last = t;
        if (t - lastApply > 20) { lastApply = t; apply(); }
        G.uTime.value = t;
        CL.mesh.position.x = ((t * 6) % 2400) - 1200;
        var f = 0.75 + 0.25 * Math.sin(t * 9.3) * Math.sin(t * 5.1 + 1); fire.material.opacity = 0.75 + 0.25 * f; fire.scale.y = 0.9 + 0.2 * f; hearth.intensity = (hearth.userData.base || 0.5) * (0.8 + 0.3 * f);
      },
      dispose: function () { SR.disposeTree(holder); scene.fog = null; }
    };
  }
  SR.register({ id: 'alpine', name: 'Alpine Meadow Chalet', zh: '阿尔卑斯高山草甸木屋', icon: '🏔', build: build });
})(window);
