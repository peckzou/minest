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
    return {
      id: 'projector', name: '全息投影仪', en: 'Holo projector', icon: '🔮', feature: 'holo', anchor: 'cabinet.top', group: g,
      hit: hitBox(g, -0.17, 0, -0.17, 0.17, 0.5, 0.17), label: [0, 0.6, 0],
      focus: { pos: [1.55, 1.38, 1.2], look: [2.8, 1.02, 1.2] },
      set: function (k) { kk = k; var e = ease(k); beam.material.opacity = 0.2 * e; hm.material.opacity = 0.85 * e; holo.scale.setScalar(0.25 + 0.95 * e); holo.position.y = 0.14 + 0.22 * e; dm.material.opacity = 0.25 + 0.5 * e; },
      idle: function (t) { holo.rotation.y = t * (0.5 + kk * 0.8); dm.rotation.y = -t * 0.3; lens.material.opacity = 0.7 + 0.3 * Math.sin(t * 2.2); if (kk > 0) beam.material.opacity = 0.2 * ease(kk) * (0.86 + 0.14 * Math.sin(t * 17)); }
    };
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
