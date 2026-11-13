/* Minest · Spatial Home — the things that are the apps (the fishing rod became the Octo aquarium in entries.js).
   Each one: a voxel model with its moving parts, set(k) (k = 0 at rest … 1 opened / in use, the short physical
   feedback), idle(t), a hit box, an anchor in the room, the camera's close-up, and the feature it stands for
   (bridge.js). Record shape kept by Phase 3: { id, feature, env, anchor, p, ry, s }. */
(function (root) {
  'use strict';
  var THREE = root.THREE, SV = root.SpatialVoxel, VB = SV.VB, MAT = SV.MAT;
  function ease(k) { return k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; }
  function seg(k, a, b) { return Math.max(0, Math.min(1, (k - a) / (b - a))); }
  function hitBox(g, x0, y0, z0, x1, y1, z1) {
    var m = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), new THREE.MeshBasicMaterial({ visible: false }));
    m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); g.add(m); return m;
  }

  /* ---------------------------------------------------------------- typewriter (a mint portable, after the Hermes 3000) */
  function typewriter() {
    var g = new THREE.Group(), v = new VB(201), i, r;
    v.box(-0.18, 0, -0.15, 0.18, 0.045, 0.17, 'mintDark'); v.box(-0.17, 0.045, -0.15, 0.17, 0.11, 0.0, 'mint', 0.03);
    v.box(-0.17, 0.045, 0.0, 0.17, 0.085, 0.05, 'mint'); v.box(-0.17, 0.045, 0.05, 0.17, 0.068, 0.1, 'mint'); v.box(-0.17, 0.045, 0.1, 0.17, 0.052, 0.165, 'mint');
    v.box(-0.1, 0.11, -0.1, 0.1, 0.115, -0.02, 'dark'); v.box(-0.05, 0.085, 0.0, 0.05, 0.1, 0.012, 'plaster'); v.box(-0.04, 0.088, 0.012, 0.04, 0.097, 0.014, 'red');
    g.add(v.mesh());
    var rows = [];
    for (r = 0; r < 3; r++) {
      var kv = new VB(210 + r), z = 0.025 + r * 0.05, y = 0.088 - r * 0.018, n = r === 2 ? 8 : 9;
      for (i = 0; i < n; i++) { var x = -0.135 + i * 0.03 + (r === 1 ? 0.012 : 0) + (r === 2 ? 0.02 : 0); kv.box(x + 0.008, y - 0.01, z + 0.008, x + 0.016, y, z + 0.016, 'dark'); kv.box(x, y, z, x + 0.024, y + 0.008, z + 0.024, 'cream', 0.04); }
      if (r === 2) kv.box(-0.07, y - 0.012, z + 0.036, 0.07, y - 0.004, z + 0.052, 'cream');
      var km = kv.mesh(); g.add(km); rows.push(km);
    }
    var car = new THREE.Group(), cv = new VB(220);
    cv.box(-0.2, 0.11, -0.13, 0.2, 0.15, -0.07, 'dark'); cv.box(-0.23, 0.115, -0.115, -0.2, 0.145, -0.085, 'metal'); cv.box(0.2, 0.115, -0.115, 0.23, 0.145, -0.085, 'metal');
    cv.box(-0.2, 0.15, -0.075, 0.2, 0.156, -0.066, 'metal'); cv.box(-0.215, 0.13, -0.07, -0.205, 0.2, -0.06, 'metal'); cv.box(-0.24, 0.19, -0.07, -0.205, 0.2, -0.06, 'metal');
    car.add(cv.mesh());
    var paper = new THREE.Group(), pv = new VB(221);
    pv.box(-0.105, 0.13, -0.105, 0.105, 0.33, -0.1, 'paper');
    for (i = 0; i < 5; i++) pv.box(-0.085, 0.3 - i * 0.022, -0.1, 0.085 - ((i * 37) % 5) * 0.02, 0.305 - i * 0.022, -0.099, 'ink');
    paper.add(pv.mesh()); car.add(paper); g.add(car);
    return {
      id: 'typewriter', name: '打字机', en: 'Typewriter', icon: '⌨️', feature: 'type', anchor: 'desk.left', group: g,
      hit: hitBox(g, -0.24, 0, -0.16, 0.24, 0.36, 0.18), label: [0, 0.42, 0],
      focus: { pos: [-0.36, 1.2, -1.28], look: [-0.36, 0.9, -1.95] },
      set: function (k) {
        var t = seg(k, 0, 0.62), n = Math.floor(t * 6), f = t * 6 - n;
        for (var j = 0; j < 3; j++) rows[j].position.y = (t < 1 && n % 3 === j) ? -0.007 * Math.sin(f * Math.PI) : 0;
        car.position.x = t < 1 ? -0.012 * Math.min(6, n + (f > 0.5 ? 1 : 0)) : -0.072 * (1 - ease(seg(k, 0.62, 0.85)));
        paper.position.y = 0.012 * Math.min(6, t * 6) * 0.5 + 0.03 * ease(seg(k, 0.8, 1));
      }, idle: function () {}
    };
  }

  /* ---------------------------------------------------------------- planner: the cover really opens on its spine */
  function planner() {
    var g = new THREE.Group(), v = new VB(301), i;
    v.box(-0.118, 0, -0.158, 0.118, 0.006, 0.158, 'blueDeep'); v.box(-0.112, 0.006, -0.152, 0.112, 0.026, 0.152, 'paper');
    for (i = 0; i < 4; i++) v.box(-0.112, 0.009 + i * 0.004, -0.1525, 0.1125, 0.01 + i * 0.004, 0.1525, 'plaster2');
    v.box(-0.122, 0, -0.158, -0.112, 0.03, 0.158, 'blueDeep');                                          // spine
    /* the day inside: hour lines and three time blocks */
    for (i = 0; i < 9; i++) v.box(-0.09, 0.026, -0.125 + i * 0.03, 0.095, 0.0265, -0.123 + i * 0.03, 'grout');
    v.box(-0.06, 0.026, -0.12, 0.07, 0.0275, -0.068, 'blueSoft'); v.box(-0.06, 0.026, -0.06, 0.03, 0.0275, -0.036, 'gold'); v.box(-0.06, 0.026, 0.0, 0.09, 0.0275, 0.052, 'pink2');
    v.box(-0.06, 0.026, 0.09, 0.05, 0.0275, 0.114, 'leaf2');
    v.box(0.05, 0, 0.158, 0.064, 0.027, 0.2, 'red');                                                    // ribbon
    v.box(0.16, 0, -0.1, 0.172, 0.012, 0.08, 'ink'); v.box(0.16, 0, 0.08, 0.172, 0.012, 0.1, 'gold');   // pen beside it
    g.add(v.mesh());
    var piv = new THREE.Group(); piv.position.set(-0.118, 0.029, 0);
    var c = new VB(302);
    c.box(0, 0, -0.158, 0.236, 0.006, 0.158, 'blue', 0.03); c.box(0.19, 0.006, -0.158, 0.204, 0.008, 0.158, 'gold');
    c.box(0.05, 0.006, -0.07, 0.16, 0.0075, 0.0, 'cream'); c.box(0.065, 0.0075, -0.05, 0.145, 0.008, -0.042, 'ink'); c.box(0.065, 0.0075, -0.03, 0.12, 0.008, -0.022, 'ink');
    c.box(0, -0.001, -0.15, 0.228, 0, 0.15, 'paper');
    piv.add(c.mesh()); g.add(piv);
    return {
      id: 'planner', name: '日程本', en: 'Planner', icon: '📘', feature: 'routine', anchor: 'desk.right', group: g,
      hit: hitBox(g, -0.14, 0, -0.17, 0.19, 0.1, 0.2), label: [0, 0.2, 0],
      focus: { pos: [0.42, 1.28, -1.3], look: [0.42, 0.8, -1.88] },
      set: function (k) { var e = ease(k); piv.rotation.z = e * 3.02; piv.position.y = 0.029 + Math.sin(e * Math.PI) * 0.012; }, idle: function () {}
    };
  }

  /* ---------------------------------------------------------------- bulletin board: three columns, a card moves on */
  function board() {
    var g = new THREE.Group(), v = new VB(501), i, j;
    v.box(-0.8, -0.55, 0, 0.8, 0.55, 0.03, 'wood', 0.04); v.box(-0.76, -0.51, 0.03, 0.76, 0.51, 0.036, 'cork');
    for (i = 0; i < 60; i++) v.cb(-0.72 + v.r() * 1.44, -0.48 + v.r() * 0.94, 0.036, 0.03, 0.03, 0.001, v.r() < 0.5 ? '#c9a474' : '#e0c093');
    var heads = ['blue', 'gold', 'coral'], cols = [['paper', 'cream', '#dbe9fb'], ['paper', '#fde9b8'], ['#d8f0d2']], pins = ['red', 'blue', 'gold'];
    function card(b, cx, cy, col, pin) {
      b.box(cx - 0.19, cy - 0.075, 0, cx + 0.19, cy + 0.075, 0.008, col, 0.03);
      b.box(cx - 0.15, cy + 0.025, 0.008, cx + 0.1, cy + 0.04, 0.0095, 'ink'); b.box(cx - 0.15, cy - 0.01, 0.008, cx + 0.14, cy, 0.0095, 'grout'); b.box(cx - 0.15, cy - 0.04, 0.008, cx + 0.04, cy - 0.03, 0.0095, 'grout');
      b.box(cx + 0.12, cy + 0.03, 0.008, cx + 0.165, cy + 0.055, 0.0095, pin === 'red' ? 'gold' : 'coral');
      b.box(cx - 0.012, cy + 0.05, 0.008, cx + 0.012, cy + 0.074, 0.03, pin);
    }
    for (i = 0; i < 3; i++) {
      var cx = -0.5 + i * 0.5;
      v.box(cx - 0.2, 0.4, 0.036, cx + 0.2, 0.47, 0.044, heads[i]); v.box(cx - 0.15, 0.425, 0.044, cx + 0.02, 0.445, 0.046, 'paper');
      var b = new VB(510 + i);
      for (j = 0; j < cols[i].length - (i === 0 ? 1 : 0); j++) card(b, cx, 0.28 - j * 0.185, cols[i][j], pins[(i + j) % 3]);
      var m = b.mesh(); m.position.z = 0.037; g.add(m);
    }
    g.add(v.mesh());
    var mv = new VB(520); card(mv, 0, 0, '#dbe9fb', 'blue');
    var mover = mv.mesh(); g.add(mover);
    var A = [-0.5, 0.28 - 2 * 0.185], B = [0, 0.28 - 2 * 0.185];
    return {
      id: 'board', name: '布告栏', en: 'Bulletin board', icon: '📌', feature: 'kanban', anchor: 'wall.left', group: g,
      hit: hitBox(g, -0.8, -0.55, 0, 0.8, 0.55, 0.08), label: [0, 0.7, 0.05],
      focus: { pos: [-1.35, 1.56, -0.3], look: [-3, 1.58, -0.3] },
      set: function (k) {
        var e = ease(seg(k, 0.1, 0.9)), lift = Math.sin(e * Math.PI);
        mover.position.set(A[0] + (B[0] - A[0]) * e, A[1] + (B[1] - A[1]) * e + lift * 0.03, 0.037 + lift * 0.09); mover.rotation.z = lift * -0.12;
      }, idle: function () {}
    };
  }

  /* ---------------------------------------------------------------- collection album on its stand */
  function album() {
    var g = new THREE.Group(), body = new THREE.Group(), v = new VB(601), i, j;
    v.box(-0.17, 0, -0.09, 0.17, 0.02, 0.07, 'woodLight'); v.box(-0.17, 0.02, 0.05, 0.17, 0.045, 0.07, 'wood'); v.box(-0.02, 0.02, -0.09, 0.02, 0.26, -0.07, 'wood');
    g.add(v.mesh());
    body.position.set(0, 0.022, 0.035); body.rotation.x = -0.2; g.add(body);
    var bv = new VB(602), cols = ['coral', 'blueSoft', 'gold', 'leaf2', 'pink2', 'cyan'];
    bv.box(-0.13, 0, -0.045, 0.13, 0.32, -0.039, 'ink'); bv.box(-0.124, 0.006, -0.039, 0.124, 0.314, -0.006, 'paper'); bv.box(-0.135, 0, -0.045, -0.125, 0.32, 0.0, 'ink');
    bv.box(-0.136, 0.05, -0.046, -0.124, 0.065, 0.001, 'gold'); bv.box(-0.136, 0.255, -0.046, -0.124, 0.27, 0.001, 'gold');
    for (i = 0; i < 2; i++) for (j = 0; j < 3; j++) { var x = -0.085 + i * 0.105, y = 0.03 + j * 0.095; bv.box(x, y, -0.006, x + 0.075, y + 0.075, -0.005, 'plaster2'); bv.box(x + 0.008, y + 0.014, -0.005, x + 0.067, y + 0.067, -0.004, cols[i * 3 + j]); }
    body.add(bv.mesh());
    var piv = new THREE.Group(); piv.position.set(-0.13, 0, -0.004); body.add(piv);
    var cv = new VB(603);
    cv.box(0, 0, 0, 0.26, 0.32, 0.007, 'ink', 0.03); cv.box(0.005, 0.005, -0.001, 0.255, 0.315, 0, 'paper');
    [[0.012, 0.012], [0.218, 0.012], [0.012, 0.278], [0.218, 0.278]].forEach(function (p) { cv.box(p[0], p[1], 0.007, p[0] + 0.03, p[1] + 0.03, 0.009, 'gold'); });
    [[0.115, 0.2, 0.03, 0.03], [0.085, 0.17, 0.09, 0.03], [0.1, 0.14, 0.06, 0.03], [0.085, 0.11, 0.03, 0.03], [0.145, 0.11, 0.03, 0.03]].forEach(function (s) { cv.box(s[0], s[1], 0.007, s[0] + s[2], s[1] + s[3], 0.0095, 'gold'); });
    cv.box(0.07, 0.05, 0.007, 0.19, 0.062, 0.0085, 'gold');
    piv.add(cv.mesh());
    return {
      id: 'album', name: '收藏册', en: 'Collection album', icon: '📔', feature: 'lists', anchor: 'shelf.mid', group: g,
      hit: hitBox(g, -0.18, 0, -0.1, 0.18, 0.38, 0.12), label: [0, 0.46, 0],
      focus: { pos: [1.72, 1.28, -0.82], look: [2.8, 1.14, -0.82] },
      set: function (k) { var e = ease(k); body.position.z = 0.035 + 0.1 * ease(seg(k, 0, 0.45)); body.position.y = 0.022 + 0.02 * Math.sin(seg(k, 0, 0.45) * Math.PI); piv.rotation.y = -2.25 * ease(seg(k, 0.3, 1)); body.rotation.x = -0.2 + 0.08 * e; }, idle: function () {}
    };
  }

  /* ---------------------------------------------------------------- holographic projector */
  function projector() {
    var g = new THREE.Group(), v = new VB(701), i;
    [[-0.12, -0.12], [0.09, -0.12], [-0.12, 0.09], [0.09, 0.09]].forEach(function (p) { v.box(p[0], 0, p[1], p[0] + 0.03, 0.015, p[1] + 0.03, 'brass'); });
    v.cb(0, 0.015, 0, 0.3, 0.04, 0.3, 'ink', 0.03); v.cb(0, 0.055, 0, 0.26, 0.012, 0.26, 'brass'); v.cb(0, 0.067, 0, 0.22, 0.035, 0.22, 'ink'); v.cb(0, 0.102, 0, 0.17, 0.012, 0.17, 'brass');
    v.box(-0.05, 0.03, 0.15, 0.05, 0.05, 0.156, 'dark'); v.box(0.08, 0.028, 0.15, 0.1, 0.048, 0.16, 'brass');
    g.add(v.mesh());
    var lv = new VB(702); lv.cb(0, 0.114, 0, 0.12, 0.008, 0.12, 'cyan'); lv.box(-0.04, 0.036, 0.156, -0.02, 0.044, 0.158, 'cyan'); lv.box(-0.01, 0.036, 0.156, 0.01, 0.044, 0.158, '#9af7c6');
    var lens = lv.mesh(MAT.glow(1), true); lens.material.transparent = true; g.add(lens);
    var beam = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.05, 0.5, 20, 1, true), new THREE.MeshBasicMaterial({ color: 0x63e6ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
    beam.position.y = 0.37; g.add(beam);
    var holo = new THREE.Group(); holo.position.y = 0.3; g.add(holo);
    var hv = new VB(703);
    hv.cb(0, 0, 0, 0.2, 0.02, 0.2, '#3fc8ff'); hv.cb(-0.03, 0.02, 0.0, 0.09, 0.07, 0.09, '#d8fbff'); hv.cb(0.05, 0.02, -0.03, 0.06, 0.05, 0.06, '#bff4ff');
    hv.cb(-0.03, 0.09, 0, 0.07, 0.02, 0.07, '#3fa0ff'); hv.cb(-0.03, 0.11, 0, 0.045, 0.02, 0.045, '#3fa0ff'); hv.cb(0.05, 0.07, -0.03, 0.02, 0.05, 0.02, '#8fe8ff');
    hv.cb(0.06, 0.02, 0.06, 0.03, 0.03, 0.03, '#7dffb0'); hv.cb(-0.07, 0.02, 0.07, 0.025, 0.02, 0.025, '#7dffb0');
    var hm = hv.mesh(MAT.holo(0), true); holo.add(hm);
    var dots = new VB(704); for (i = 0; i < 14; i++) dots.cb((dots.r() - 0.5) * 0.26, dots.r() * 0.34, (dots.r() - 0.5) * 0.26, 0.008, 0.008, 0.008, 'cyan');
    var dm = dots.mesh(MAT.holo(0.25), true); dm.position.y = 0.14; g.add(dm);
    var kk = 0;
    /* 2026-11-13: the holo screen — your own words, typed in, always showing above the lens (seen from anywhere in the room) */
    var HS = holoScreen(g);
    return {
      id: 'projector', name: '全息投影仪', en: 'Holo projector', icon: '🔮', feature: 'holo', anchor: 'cabinet.top', group: g,
      hit: hitBox(g, -0.17, 0, -0.17, 0.17, 0.62, 0.17), label: [0, 0.7, 0],
      focus: { pos: [1.85, 1.3, 1.2], look: [2.8, 0.98, 1.2] },
      panel: function (ctx) { return HS.edit(ctx && ctx.container); },
      set: function (k) { kk = k; var e = ease(k), txt = HS.has(); beam.material.opacity = (txt ? 0.04 : 0) + (txt ? 0.06 : 0.2) * e; hm.material.opacity = txt ? 0 : 0.85 * e; holo.scale.setScalar(0.25 + 0.95 * e); holo.position.y = 0.14 + 0.22 * e; dm.material.opacity = 0.25 + 0.5 * e; },
      idle: function (t) {
        holo.rotation.y = t * (0.5 + kk * 0.8); dm.rotation.y = -t * 0.3; lens.material.opacity = 0.7 + 0.3 * Math.sin(t * 2.2);
        var txt = HS.has(); if (kk > 0 || txt) beam.material.opacity = (txt ? 0.04 + 0.06 * ease(kk) : 0.2 * ease(kk)) * (0.86 + 0.14 * Math.sin(t * 17));
        if (txt) hm.material.opacity = 0; else if (kk > 0) hm.material.opacity = 0.85 * ease(kk); HS.tick(t);
      }
    };
  }
  /* the holo screen: a pane of light above the projector, text drawn on a canvas (cyan scanlines, a typing reveal when the
     text changes). Kept on this device ('minest.holoScreen.v1'); the panel can fill it from today's board. */
  var HKEY = 'minest.holoScreen.v1', HCOL = { cyan: [99, 230, 255], green: [125, 255, 176], amber: [255, 196, 99], violet: [196, 150, 255] };
  function holoScreen(g) {
    var st = { text: '', color: 'cyan' }; try { var raw = JSON.parse(localStorage.getItem(HKEY) || 'null'); if (raw && typeof raw.text === 'string') st = { text: raw.text.slice(0, 160), color: HCOL[raw.color] ? raw.color : 'cyan' }; } catch (e) {}
    var cv = document.createElement('canvas'); cv.width = 640; cv.height = 400; var c = cv.getContext('2d');
    var tex = new THREE.CanvasTexture(cv); tex.encoding = THREE.sRGBEncoding; tex.anisotropy = 4;
    var mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false, toneMapped: false });
    var pane = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.2875), mat); pane.position.set(0, 0.42, 0.02); pane.rotation.x = -0.12; g.add(pane);
    var shown = -1, revealFrom = 0, lastPaint = -1, t0 = 0;
    function lines(text, font, maxW) {
      c.font = font; var out = [];
      String(text).split('\n').forEach(function (para) {
        var cjk = /[\u3400-\u9fff]/.test(para), parts = cjk ? para.split('') : para.split(/(\s+)/), line = '';
        parts.forEach(function (w) { var tt = line + w; if (c.measureText(tt).width > maxW && line) { out.push(line.trim()); line = w.replace(/^\s+/, ''); } else line = tt; });
        out.push(line.trim());
      });
      return out;
    }
    function paint(t) {
      var W = cv.width, H = cv.height, col = HCOL[st.color] || HCOL.cyan, rgb = col.join(',');
      c.clearRect(0, 0, W, H);
      c.strokeStyle = 'rgba(' + rgb + ',0.75)'; c.lineWidth = 4;                                   // corner brackets
      [[14, 14, 1, 1], [W - 14, 14, -1, 1], [14, H - 14, 1, -1], [W - 14, H - 14, -1, -1]].forEach(function (q) { c.beginPath(); c.moveTo(q[0] + 46 * q[2], q[1]); c.lineTo(q[0], q[1]); c.lineTo(q[0], q[1] + 46 * q[3]); c.stroke(); });
      c.fillStyle = 'rgba(3,14,22,0.62)'; c.fillRect(14, 14, W - 28, H - 28); c.fillStyle = 'rgba(' + rgb + ',0.08)'; c.fillRect(14, 14, W - 28, H - 28);
      var text = st.text, n = Math.min(text.length, Math.floor((t - revealFrom) * 26)), vis = text.slice(0, Math.max(0, n));
      var fs = 64, L; do { L = lines(text, '600 ' + fs + 'px -apple-system,"PingFang SC",sans-serif', W - 80); if (L.length * fs * 1.22 <= H - 70) break; fs -= 4; } while (fs > 20);
      L = lines(vis, '600 ' + fs + 'px -apple-system,"PingFang SC",sans-serif', W - 80);
      c.textAlign = 'center'; c.textBaseline = 'middle'; c.shadowColor = 'rgba(' + rgb + ',0.9)'; c.shadowBlur = 18; c.fillStyle = 'rgba(' + col.map(function (v) { return Math.min(255, v + 60); }).join(',') + ',1)';
      var total = lines(text, c.font, W - 80).length, y0 = H / 2 - (total - 1) * fs * 0.61;
      L.forEach(function (ln, i) { c.fillText(ln, W / 2, y0 + i * fs * 1.22); });
      if (n < text.length && Math.floor(t * 4) % 2 === 0) { var last = L[L.length - 1] || ''; c.fillRect(W / 2 + c.measureText(last).width / 2 + 6, y0 + (L.length - 1) * fs * 1.22 - fs * 0.45, fs * 0.08, fs * 0.9); }
      c.shadowBlur = 0; c.fillStyle = 'rgba(0,0,0,0.16)'; for (var y = (t * 40) % 6; y < H; y += 6) c.fillRect(14, y, W - 28, 2);   // scanlines
      tex.needsUpdate = true;
    }
    function apply() { pane.visible = !!st.text; revealFrom = t0; shown = -1; }
    function save() { try { localStorage.setItem(HKEY, JSON.stringify(st)); } catch (e) {} }
    apply();
    var api = {
      has: function () { return !!st.text; },
      tick: function (t) {
        t0 = t; if (!st.text) return;
        mat.opacity = 0.88 + 0.12 * Math.sin(t * 23) * Math.sin(t * 3.1);
        var typing = (t - revealFrom) * 26 < st.text.length + 4;
        if (t - lastPaint > (typing ? 0.04 : 0.12)) { lastPaint = t; paint(t); }
        pane.position.y = 0.42 + Math.sin(t * 1.3) * 0.006;
      },
      set: function (text, color) { st.text = String(text || '').slice(0, 160); if (color && HCOL[color]) st.color = color; save(); apply(); },
      /* the panel: type your own words (it shows live on the screen behind), or take today's word / chart / countdown */
      edit: function (container) {
        return new Promise(function (res) {
          var box = document.createElement('div'); box.className = 'sh-holoed';
          box.innerHTML = '<style>.sh-holoed{position:absolute;z-index:9;left:50%;bottom:calc(16px + env(safe-area-inset-bottom));transform:translateX(-50%);width:min(440px,calc(100% - 24px));padding:12px;border-radius:18px;background:rgba(10,22,34,.86);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);border:1px solid rgba(99,230,255,.35);color:#dff8ff;font:14px/1.4 -apple-system,"PingFang SC",sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.35)}' +
            '.sh-holoed b{font-size:14px}.sh-holoed textarea{width:100%;box-sizing:border-box;margin:8px 0;min-height:64px;resize:none;border-radius:12px;border:1px solid rgba(99,230,255,.4);background:rgba(0,0,0,.35);color:#eaffff;font:16px/1.35 -apple-system,"PingFang SC",sans-serif;padding:8px 10px}' +
            '.sh-holoed .r{display:flex;gap:6px;flex-wrap:wrap;margin-top:6px}.sh-holoed button{flex:1 1 auto;padding:8px 10px;border-radius:11px;border:1px solid rgba(99,230,255,.35);background:rgba(99,230,255,.1);color:#dff8ff;font:inherit;font-weight:600;cursor:pointer}' +
            '.sh-holoed button.pri{background:#2fa6d6;border-color:transparent;color:#fff}.sh-holoed .c{flex:0 0 30px;height:30px;padding:0;border-radius:50%}.sh-holoed .c.on{box-shadow:0 0 0 2px #fff}.sh-holoed small{opacity:.65}<\/style>' +
            '<b>🔮 全息屏</b> <small>打字就会显示在投影仪上方 · 最多 160 字</small><textarea maxlength="160" placeholder="在这里输入要投影的文字…"></textarea>' +
            '<div class="r" data-r="fill"><button type="button" data-f="word">今日单词</button><button type="button" data-f="chart">今日 Anchor Chart</button><button type="button" data-f="exam">考试倒计时</button></div>' +
            '<div class="r" data-r="col">' + Object.keys(HCOL).map(function (k) { return '<button type="button" class="c' + (k === st.color ? ' on' : '') + '" data-c="' + k + '" title="' + k + '" style="background:rgb(' + HCOL[k].join(',') + ')"></button>'; }).join('') + '<button type="button" data-a="clear">清空</button></div>' +
            '<div class="r"><button type="button" data-a="holo">打开全息展示</button><button type="button" class="pri" data-a="done">✓ 好了</button></div>';
          (container || document.body).appendChild(box);
          var ta = box.querySelector('textarea'); ta.value = st.text;
          ta.addEventListener('input', function () { api.set(ta.value); });
          ['keydown', 'keyup', 'keypress'].forEach(function (k) { ta.addEventListener(k, function (e) { e.stopPropagation(); if (k === 'keydown' && e.key === 'Escape') finish(null); }); });
          setTimeout(function () { try { ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length); } catch (e) {} }, 60);
          function finish(r) { box.remove(); res(r); }
          function fill(kind) {
            var E = root.SpatialEC6 && root.SpatialEC6._, txt = '';
            try {
              if (kind === 'word') { var w = E && E.wordState(); txt = w && w.card ? w.card.title + (w.card.meaning ? '\n' + w.card.meaning : '') : ''; if (!txt) return '今天还没有单词任务'; }
              else if (kind === 'chart') { var subs = ['ela', 'math', 'sci', 'ss', 'other']; for (var i = 0; i < subs.length && !txt; i++) { var h = E && E.pick(subs[i]); if (h && h.k) txt = h.k.title; } if (!txt) return '今天还没有选 Anchor Chart'; }
              else if (kind === 'exam') { var S = E && E.S(), d = E && E.daysLeft(); if (!S || !isFinite(d)) return '还没有设置考试日期'; txt = (S.exam && S.exam.name || '考试') + '\n还有 ' + d + ' 天'; }
            } catch (e) { return '没能读到布告栏的数据'; }
            ta.value = txt.slice(0, 160); api.set(ta.value); return '';
          }
          box.addEventListener('click', function (e) {
            var b = e.target.closest('button'); if (!b) return; e.stopPropagation();
            if (b.dataset.f) { var msg = fill(b.dataset.f); if (msg) { b.textContent = msg; setTimeout(function () { b.textContent = { word: '今日单词', chart: '今日 Anchor Chart', exam: '考试倒计时' }[b.dataset.f]; }, 1800); } return; }
            if (b.dataset.c) { st.color = b.dataset.c; save(); apply(); [].forEach.call(box.querySelectorAll('.c'), function (x) { x.classList.toggle('on', x === b); }); return; }
            if (b.dataset.a === 'clear') { ta.value = ''; api.set(''); return; }
            if (b.dataset.a === 'holo') { finish({ feature: 'holo' }); return; }
            if (b.dataset.a === 'done') finish(null);
          });
          ['pointerdown', 'touchstart', 'wheel'].forEach(function (k) { box.addEventListener(k, function (e) { e.stopPropagation(); }, { passive: true }); });
        });
      }
    };
    return api;
  }

  /* ---------------------------------------------------------------- magic ornament: a little world under glass, a ring round it */
  function ornament() {
    var g = new THREE.Group(), v = new VB(801), i;
    v.cb(0, 0, 0, 0.16, 0.025, 0.16, 'woodDark'); v.cb(0, 0.025, 0, 0.13, 0.02, 0.13, 'wood'); v.cb(0, 0.045, 0, 0.1, 0.008, 0.1, 'brass');
    g.add(v.mesh());
    var inner = new THREE.Group(); inner.position.y = 0.15; g.add(inner);
    var iv = new VB(802);
    iv.cb(0, -0.05, 0, 0.05, 0.02, 0.05, '#a88a74'); iv.cb(0, -0.03, 0, 0.09, 0.02, 0.09, '#b89b82'); iv.cb(0, -0.01, 0, 0.11, 0.012, 0.11, 'leaf2');
    iv.cb(-0.012, 0.002, 0, 0.045, 0.035, 0.045, 'plaster'); iv.cb(-0.012, 0.037, 0, 0.035, 0.012, 0.035, 'blue'); iv.cb(-0.012, 0.049, 0, 0.02, 0.01, 0.02, 'blue');
    iv.cb(0.035, 0.002, 0.02, 0.012, 0.03, 0.012, 'wood'); iv.cb(0.035, 0.028, 0.02, 0.035, 0.03, 0.035, 'leaf'); iv.cb(0.03, 0.002, -0.03, 0.02, 0.018, 0.02, 'plaster');
    inner.add(iv.mesh());
    var ring = new THREE.Group(); ring.position.y = 0.15; g.add(ring);
    var rv = new VB(803);
    for (i = 0; i < 16; i++) { var a = i / 16 * Math.PI * 2; rv.cb(Math.cos(a) * 0.088, Math.sin(a) * 0.088 - 0.007, 0, 0.014, 0.014, 0.014, i % 4 === 0 ? '#fff3b0' : 'gold'); }
    ring.add(rv.mesh(MAT.glow(), true));
    var glass = new THREE.Mesh(new THREE.IcosahedronGeometry(0.105, 1), new THREE.MeshPhongMaterial({ color: 0xdff3ff, transparent: true, opacity: 0.22, shininess: 120, specular: 0xffffff, flatShading: true, depthWrite: false }));
    glass.position.y = 0.15; g.add(glass);
    var glow = new THREE.Mesh(new THREE.IcosahedronGeometry(0.1, 1), new THREE.MeshBasicMaterial({ color: 0xb48cff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
    glow.position.y = 0.15; g.add(glow);
    var kk = 0, spin = 0, last = 0;
    return {
      id: 'ornament', name: '魔法摆件', en: 'Magic ornament', icon: '🌀', feature: 'portal', anchor: 'sill.left', group: g,
      hit: hitBox(g, -0.12, 0, -0.12, 0.12, 0.28, 0.12), label: [0, 0.34, 0],
      focus: { pos: [-0.72, 1.3, -1.82], look: [-0.82, 1.08, -2.63] },
      set: function (k) { kk = k; glow.material.opacity = 0.16 * ease(k); glow.scale.setScalar(1 + 0.35 * ease(k)); },
      idle: function (t) { var dt = Math.min(0.1, t - last); last = t; spin += dt * (0.6 + kk * 9); ring.rotation.y = spin; inner.rotation.y = -spin * 0.3; inner.position.y = 0.15 + Math.sin(t * 1.3) * 0.006; }
    };
  }

  function build(room, scene, opts) {
    var list = [typewriter(), planner(), board(), album(), projector(), ornament()];
    if (root.SpatialEntries) list = list.concat(root.SpatialEntries.make(opts || {}));
    if (root.SpatialEC6) list.forEach(function (o) { if (o.id === 'board') root.SpatialEC6.attach(o); });   // EC–6 Study Studio: the board is the daily hub
    if (root.SpatialMochiDay) list.forEach(function (o) { if (o.id === 'mochi') root.SpatialMochiDay.attach(o); });   // Mochi follows the EC–6 day
    list.forEach(function (o) {
      var a = room.anchors[o.anchor]; o.group.position.set(a.p[0], a.p[1], a.p[2]); o.group.rotation.y = a.ry;
      o.hit.userData.obj = o; o.k = 0; o.set(0); scene.add(o.group);
      o.group.updateMatrixWorld(true);
      o.labelAt = new THREE.Vector3(o.label[0], o.label[1], o.label[2]).applyMatrix4(o.group.matrixWorld);
      o.centre = new THREE.Box3().setFromObject(o.hit).getCenter(new THREE.Vector3());
      if (o.afterBuild) o.afterBuild();
    });
    return list;
  }
  root.SpatialObjects = { build: build };
})(window);
