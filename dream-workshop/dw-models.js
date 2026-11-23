/* Minest Dream Workshop · 梦工坊 — the things a work is made of (Model Studio's shelf).
 * Each kind builds a three.js (r128) group, front facing +z, standing on y = 0, in metres.
 * A figure carries a rig (spine, head, armL, armR, mouth) that Behavior Studio and the timeline move.
 * A spot carries its SpotLight and light cone; a lamp its bulb; the engine dims them with the stage level. */
(function (root) {
  'use strict';
  var T = root.THREE;
  function mat(c, o) { return new T.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.78, metalness: 0 }, o || {})); }
  function mesh(g, m, x, y, z) { var o = new T.Mesh(g, m); o.position.set(x || 0, y || 0, z || 0); return o; }
  function box(w, h, d, m, x, y, z) { return mesh(new T.BoxGeometry(w, h, d), m, x, y, z); }
  function cyl(rt, rb, h, m, x, y, z, seg) { return mesh(new T.CylinderGeometry(rt, rb, h, seg || 14), m, x, y, z); }
  function sph(r, m, x, y, z) { return mesh(new T.SphereGeometry(r, 18, 14), m, x, y, z); }
  function canvasTex(w, h, draw) {
    var c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
    var t = new T.CanvasTexture(c); t.anisotropy = 4; return t;
  }

  /* ---------------------------------------------------------------- figures */
  function figure(o) {
    var k = (o.height || 1.8) / 1.8, g = new T.Group();
    var skin = mat(o.skin || '#e2b48c'), coat = mat(o.coat || '#4f6d8f'), legs = mat(o.legs || '#2f3542'), shoe = mat('#1d1d22');
    var hips = new T.Group(); hips.position.y = 0.92 * k; g.add(hips);
    var legG = [-1, 1].map(function (s) {
      var lg = new T.Group(); lg.position.x = s * 0.11 * k; hips.add(lg);
      lg.add(box(0.17 * k, 0.86 * k, 0.2 * k, legs, 0, -0.45 * k, 0));
      lg.add(box(0.19 * k, 0.09 * k, 0.3 * k, shoe, 0, -0.88 * k, 0.05 * k));
      return lg;
    });
    var spine = new T.Group(); hips.add(spine);
    spine.add(box(0.46 * k, 0.62 * k, 0.26 * k, coat, 0, 0.31 * k, 0));
    if (o.tails) { spine.add(box(0.48 * k, 0.5 * k, 0.04 * k, coat, 0, -0.18 * k, -0.12 * k)); [-1, 1].forEach(function (s) { spine.add(box(0.12 * k, 0.42 * k, 0.04 * k, coat, s * 0.18 * k, -0.14 * k, 0.12 * k)); }); }
    if (o.shirt) { spine.add(box(0.14 * k, 0.3 * k, 0.02 * k, mat(o.shirt), 0, 0.46 * k, 0.135 * k)); }
    if (o.tie) spine.add(box(0.13 * k, 0.05 * k, 0.03 * k, mat(o.tie), 0, 0.58 * k, 0.15 * k));
    function arm(s) {
      var a = new T.Group(); a.position.set(s * 0.29 * k, 0.56 * k, 0); spine.add(a);
      a.add(cyl(0.065 * k, 0.055 * k, 0.6 * k, coat, 0, -0.3 * k, 0));
      a.add(sph(0.065 * k, skin, 0, -0.64 * k, 0));
      a.rotation.z = s * 0.06; return a;
    }
    var armL = arm(-1), armR = arm(1);
    var head = new T.Group(); head.position.y = 0.66 * k; spine.add(head);
    head.add(cyl(0.06 * k, 0.07 * k, 0.1 * k, skin, 0, 0.04 * k, 0));
    head.add(box(0.24 * k, 0.28 * k, 0.24 * k, skin, 0, 0.22 * k, 0));
    var eye = mat('#1c1c22');
    [-1, 1].forEach(function (s) { head.add(box(0.035 * k, 0.035 * k, 0.01 * k, eye, s * 0.055 * k, 0.26 * k, 0.122 * k)); });
    var mouth = box(0.08 * k, 0.025 * k, 0.012 * k, mat('#7a2e2e'), 0, 0.15 * k, 0.123 * k); head.add(mouth);
    if (o.beard) { var bd = mat(o.beard); head.add(box(0.25 * k, 0.1 * k, 0.06 * k, bd, 0, 0.1 * k, 0.1 * k)); [-1, 1].forEach(function (s) { head.add(box(0.03 * k, 0.16 * k, 0.2 * k, bd, s * 0.125 * k, 0.17 * k, 0.03 * k)); }); }
    if (o.hair) head.add(box(0.26 * k, 0.07 * k, 0.26 * k, mat(o.hair), 0, 0.37 * k, -0.005 * k));
    if (o.hat) { var hm = mat(o.hat, { roughness: 0.55 }); head.add(cyl(0.2 * k, 0.2 * k, 0.02 * k, hm, 0, 0.37 * k, 0, 20)); head.add(cyl(0.13 * k, 0.14 * k, 0.32 * k, hm, 0, 0.54 * k, 0, 20)); head.add(cyl(0.141 * k, 0.141 * k, 0.04 * k, mat('#2b2b30'), 0, 0.4 * k, 0, 20)); }
    g.userData.rig = { spine: spine, head: head, armL: armL, armR: armR, mouth: mouth, legL: legG[0], legR: legG[1], k: k };
    return g;
  }

  /* ---------------------------------------------------------------- set pieces */
  function stage(o) {
    var g = new T.Group(), wood = mat(o.color || '#8a5a35'), dark = mat('#4b2e1c');
    g.add(box(8, 0.6, 5, wood, 0, 0.3, 0));
    g.add(box(8.1, 0.08, 0.12, mat('#d9b25a', { metalness: 0.4, roughness: 0.4 }), 0, 0.56, 2.52));
    g.add(box(8, 0.5, 0.05, dark, 0, 0.25, 2.51));
    for (var i = 0; i < 3; i++) g.add(box(1.2, 0.2, 0.35, wood, 3.2, 0.1 + i * 0.2, 2.85 - i * 0.35 + 0.35));
    g.userData.surface = { hw: 4, hd: 2.5, top: 0.6 };
    return g;
  }
  function podium(o) {
    var g = new T.Group(), w = mat(o.color || '#6b4226'), trim = mat('#d9b25a', { metalness: 0.4, roughness: 0.45 });
    g.add(box(0.75, 1.05, 0.5, w, 0, 0.525, 0));
    var top = box(0.85, 0.06, 0.6, w, 0, 1.12, 0.02); top.rotation.x = 0.28; g.add(top);
    g.add(box(0.5, 0.3, 0.02, trim, 0, 0.7, 0.26));
    g.add(box(0.9, 0.06, 0.6, mat('#3f2716'), 0, 0.03, 0));
    return g;
  }
  function bench(o) {
    var g = new T.Group(), w = mat(o.color || '#7b5434'), iron = mat('#2a2a30', { metalness: 0.5, roughness: 0.5 });
    for (var i = 0; i < 3; i++) g.add(box(2.2, 0.05, 0.13, w, 0, 0.46, -0.16 + i * 0.16));
    for (var j = 0; j < 2; j++) { var b = box(2.2, 0.12, 0.04, w, 0, 0.72 + j * 0.18, -0.26); b.rotation.x = -0.12; g.add(b); }
    [-0.95, 0.95].forEach(function (x) { g.add(box(0.06, 0.46, 0.45, iron, x, 0.23, 0)); g.add(box(0.06, 0.55, 0.06, iron, x, 0.72, -0.26)); });
    return g;
  }
  function chair(o) {
    var g = new T.Group(), w = mat(o.color || '#8c2f39'), leg = mat('#3a2a22');
    g.add(box(0.5, 0.08, 0.5, w, 0, 0.46, 0)); g.add(box(0.5, 0.55, 0.07, w, 0, 0.77, -0.22));
    [[-0.21, -0.21], [0.21, -0.21], [-0.21, 0.21], [0.21, 0.21]].forEach(function (p) { g.add(box(0.05, 0.44, 0.05, leg, p[0], 0.22, p[1])); });
    return g;
  }
  function spot(o) {
    var g = new T.Group(), iron = mat('#2b2d33', { metalness: 0.6, roughness: 0.4 });
    g.add(cyl(0.3, 0.35, 0.06, iron, 0, 0.03, 0)); g.add(cyl(0.03, 0.03, 2.8, iron, 0, 1.43, 0));
    var head = new T.Group(); head.position.set(0, 2.85, 0); head.rotation.x = o.tilt == null ? 0.55 : +o.tilt; g.add(head);   /* tilt: how far down it aims */
    head.add(cyl(0.16, 0.12, 0.45, iron, 0, 0, 0)); head.children[0].rotation.x = Math.PI / 2;
    var lens = cyl(0.13, 0.13, 0.02, mat('#fff6d8', { emissive: '#ffe9a8', emissiveIntensity: 0 }), 0, 0, 0.23); lens.rotation.x = Math.PI / 2; head.add(lens);
    var L = new T.SpotLight(o.color || '#fff1cf', 0, 18, 0.42, 0.45, 1.4); L.position.set(0, 0, 0.25); head.add(L);
    var tgt = new T.Object3D(); tgt.position.set(0, 0, 6); head.add(tgt); L.target = tgt;
    var cone = new T.Mesh(new T.ConeGeometry(1.6, 6, 24, 1, true), new T.MeshBasicMaterial({ color: o.color || '#fff1cf', transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide }));
    cone.rotation.x = -Math.PI / 2; cone.position.z = 3.2; head.add(cone);
    g.userData.spot = { light: L, lens: lens.material, cone: cone.material };
    return g;
  }
  function flag(o) {
    var g = new T.Group(), pole = mat('#c9a24a', { metalness: 0.6, roughness: 0.35 });
    g.add(cyl(0.025, 0.03, 3.2, pole, 0, 1.6, 0)); g.add(sph(0.06, pole, 0, 3.24, 0)); g.add(cyl(0.22, 0.26, 0.08, mat('#2b2d33'), 0, 0.04, 0));
    var tex = canvasTex(256, 160, function (c, w, h) {
      for (var i = 0; i < 13; i++) { c.fillStyle = i % 2 ? '#f5f1e8' : '#b22234'; c.fillRect(0, i * h / 13, w, h / 13 + 1); }
      c.fillStyle = '#3c3b6e'; c.fillRect(0, 0, w * 0.42, h * 7 / 13);
      c.fillStyle = '#fff'; for (var y = 0; y < 5; y++) for (var x = 0; x < 6; x++) { c.beginPath(); c.arc(10 + x * 17, 9 + y * 17, 2.6, 0, 7); c.fill(); }
    });
    var cl = mesh(new T.PlaneGeometry(1.3, 0.82, 12, 4), new T.MeshStandardMaterial({ map: tex, side: T.DoubleSide, roughness: 0.9 }), 0.68, 2.7, 0);
    g.add(cl); g.userData.cloth = cl;
    return g;
  }
  function curtain(o) {
    var g = new T.Group(), red = mat(o.color || '#7d1424', { roughness: 0.9 }), gold = mat('#d9b25a', { metalness: 0.45, roughness: 0.4 });
    for (var i = 0; i < 20; i++) g.add(cyl(0.25, 0.27, 5, red, -4.5 + i * 0.474, 2.5, (i % 2) * 0.12, 10));
    g.add(box(9.6, 0.7, 0.4, red, 0, 5.05, 0.35)); g.add(box(9.7, 0.08, 0.45, gold, 0, 4.68, 0.36));
    return g;
  }
  function column(o) {
    var g = new T.Group(), m = mat(o.color || '#e8e2d4');
    g.add(box(0.7, 0.2, 0.7, m, 0, 0.1, 0)); g.add(cyl(0.24, 0.27, 3.4, m, 0, 1.9, 0, 16)); g.add(box(0.7, 0.2, 0.7, m, 0, 3.7, 0));
    return g;
  }
  function tree(o) {
    var g = new T.Group();
    g.add(cyl(0.1, 0.14, 1.2, mat('#6b4a2f'), 0, 0.6, 0));
    var lf = mat(o.color || '#4f7a3d');
    g.add(sph(0.85, lf, 0, 1.9, 0)); g.add(sph(0.6, lf, 0.45, 2.35, 0.15)); g.add(sph(0.55, lf, -0.4, 2.3, -0.2));
    return g;
  }
  function lamp(o) {
    var g = new T.Group(), iron = mat('#24262c', { metalness: 0.5, roughness: 0.45 });
    g.add(cyl(0.14, 0.18, 0.2, iron, 0, 0.1, 0)); g.add(cyl(0.045, 0.05, 2.9, iron, 0, 1.55, 0));
    var bulbM = mat('#fff3cf', { emissive: '#ffd98a', emissiveIntensity: 1 });
    g.add(sph(0.17, bulbM, 0, 3.1, 0)); g.add(cyl(0.05, 0.22, 0.12, iron, 0, 3.3, 0));
    var L = new T.PointLight('#ffd98a', 0.7, 7, 2); L.position.set(0, 3.0, 0); g.add(L);
    g.userData.lamp = { light: L, bulb: bulbM };
    return g;
  }
  function sign(o) {
    var g = new T.Group(), w = mat('#6b4a2f');
    [-0.85, 0.85].forEach(function (x) { g.add(box(0.08, 1.9, 0.08, w, x, 0.95, 0)); });
    var text = String(o.text || '梦工坊');
    var tex = canvasTex(512, 200, function (c, W, H) {
      c.fillStyle = '#f3e6c8'; c.fillRect(0, 0, W, H); c.strokeStyle = '#8a5a35'; c.lineWidth = 12; c.strokeRect(6, 6, W - 12, H - 12);
      c.fillStyle = '#3a2414'; c.textAlign = 'center'; c.textBaseline = 'middle';
      var lines = text.split(/\n|·/).map(function (s) { return s.trim(); }).filter(Boolean).slice(0, 2);
      lines.forEach(function (s, i) { var fs = i ? 34 : 46; c.font = '700 ' + fs + 'px -apple-system,"PingFang SC",sans-serif'; while (c.measureText(s).width > W - 50 && fs > 16) { fs -= 2; c.font = '700 ' + fs + 'px -apple-system,"PingFang SC",sans-serif'; } c.fillText(s, W / 2, lines.length > 1 ? (i ? 135 : 72) : H / 2); });
    });
    g.add(mesh(new T.BoxGeometry(1.9, 0.75, 0.06), [w, w, w, w, new T.MeshStandardMaterial({ map: tex, roughness: 0.85 }), w], 0, 1.55, 0));
    return g;
  }

  /* ---------------------------------------------------------------- phase 2: the magic portrait and the boat ride's scenery */
  /* a painted bust in a gilt frame that can turn its head, follow the guest with its eyes, blink, smile, wink and talk */
  function portrait(o) {
    var mirror = o.frame === 'silver', g = new T.Group(), gold = mirror ? mat('#d7dde6', { metalness: 0.8, roughness: 0.2 }) : mat('#c9a24a', { metalness: 0.55, roughness: 0.35 }), W = 1.15, H = 1.45;
    var f = new T.Group(); f.position.y = 1.75; g.add(f);
    f.add(box(W + 0.2, 0.14, 0.12, gold, 0, H / 2 + 0.03, 0)); f.add(box(W + 0.2, 0.14, 0.12, gold, 0, -H / 2 - 0.03, 0));
    f.add(box(0.14, H + 0.2, 0.12, gold, -W / 2 - 0.03, 0, 0)); f.add(box(0.14, H + 0.2, 0.12, gold, W / 2 + 0.03, 0, 0));
    var bg = canvasTex(128, 160, function (c, w, h) { var gr = c.createRadialGradient(w / 2, h * 0.35, 8, w / 2, h / 2, h * 0.75); gr.addColorStop(0, mirror ? '#d9f0ff' : '#5d7a52'); gr.addColorStop(1, mirror ? '#5a7a9a' : '#17210f'); c.fillStyle = gr; c.fillRect(0, 0, w, h); });
    f.add(mesh(new T.PlaneGeometry(W, H), new T.MeshStandardMaterial({ map: bg, roughness: 0.95 }), 0, 0, -0.03));
    f.add(box(W + 0.34, H + 0.34, 0.04, mat('#2a1c12'), 0, 0, -0.07));
    f.add(box(0.5, 0.04, 0.06, mat('#fff3cf', { emissive: '#ffd98a', emissiveIntensity: 0.6 }), 0, H / 2 + 0.16, 0.1));
    var coat = mat(o.color || '#5b2a3a'), skin = mat('#e6bf98'), wig = mat(o.hair || '#dcd6c8');
    f.add(box(0.84, 0.4, 0.16, coat, 0, -0.52, 0.03));
    f.add(box(0.2, 0.2, 0.1, mat('#f1ead8'), 0, -0.34, 0.1));
    var head = new T.Group(); head.position.set(0, -0.2, 0.07); f.add(head);
    head.add(box(0.36, 0.44, 0.26, skin, 0, 0.24, 0));
    head.add(box(0.42, 0.13, 0.3, wig, 0, 0.5, -0.01)); [-1, 1].forEach(function (s) { head.add(box(0.08, 0.32, 0.26, wig, s * 0.22, 0.28, -0.02)); });
    head.add(box(0.05, 0.09, 0.05, skin, 0, 0.22, 0.145));
    var dark = mat('#1c1c22'), white = mat('#f4f1ea'), pupils = [], lids = [], brows = [];
    [-1, 1].forEach(function (s) {
      head.add(box(0.095, 0.055, 0.01, white, s * 0.08, 0.3, 0.132));
      var p = box(0.036, 0.04, 0.01, dark, s * 0.08, 0.3, 0.138); p.userData.base = { x: s * 0.08, y: 0.3 }; head.add(p); pupils.push(p);
      var lid = new T.Group(); lid.position.set(s * 0.08, 0.33, 0.143); head.add(lid);
      lid.add(box(0.1, 0.062, 0.01, skin, 0, -0.031, 0)); lid.scale.y = 0.06; lids.push(lid);
      var b = box(0.1, 0.022, 0.012, mat('#7d746a'), s * 0.08, 0.37, 0.135); b.userData.base = { y: 0.37, s: s }; head.add(b); brows.push(b);
    });
    var mouth = box(0.12, 0.026, 0.012, mat('#8a2f34'), 0, 0.13, 0.133); head.add(mouth);
    g.userData.rig = { head: head, mouth: mouth, pupils: pupils, lids: lids, brows: brows, portrait: true };
    return g;
  }
  function wall(o) {
    var g = new T.Group(), w = mat(o.color || '#3d5a4a', { roughness: 0.95 }), gold = mat('#c9a24a', { metalness: 0.45, roughness: 0.4 });
    g.add(box(6, 3.6, 0.25, w, 0, 1.8, 0));
    if (o.plain) { g.add(box(6.08, 0.14, 0.33, gold, 0, 3.56, 0)); return g; }   /* a plain screen (the shadow theater) */
    g.add(box(6.02, 1, 0.29, mat('#2c2018'), 0, 0.5, 0));
    g.add(box(6.06, 0.08, 0.31, gold, 0, 1.02, 0)); g.add(box(6.08, 0.14, 0.33, gold, 0, 3.56, 0));
    return g;
  }
  function boat(o) {
    var g = new T.Group(), hull = mat(o.color || '#8a5a35'), trim = mat('#d9b25a', { metalness: 0.4, roughness: 0.45 }), seat = mat('#a23b3b');
    g.add(box(1.4, 0.42, 2.6, hull, 0, 0.21, -0.2));
    var bow = box(0.99, 0.42, 0.99, hull, 0, 0.21, 1.1); bow.rotation.y = Math.PI / 4; bow.scale.x = 0.72; g.add(bow);
    g.add(box(1.44, 0.06, 2.64, trim, 0, 0.44, -0.2));
    g.add(box(1.2, 0.12, 0.5, seat, 0, 0.5, -0.9)); g.add(box(1.2, 0.12, 0.5, seat, 0, 0.5, 0.2));
    if (!o.ride) { g.add(cyl(0.03, 0.03, 1.1, trim, 0, 0.95, 1.25)); g.add(sph(0.11, mat('#ffcf6b', { emissive: '#ffb347', emissiveIntensity: 1 }), 0, 1.55, 1.25)); }   /* the boat a guest rides has no mast in front of their eyes */
    return g;
  }
  function house(o) {
    var g = new T.Group(), wl = mat(o.color || '#efe1c4'), roofM = mat('#8c3b2e'), glow = mat('#ffe2a0', { emissive: '#ffc766', emissiveIntensity: 0.9 });
    g.add(box(2, 1.8, 2, wl, 0, 0.9, 0));
    var roof = cyl(0.01, 1.62, 1.2, roofM, 0, 2.4, 0, 4); roof.rotation.y = Math.PI / 4; g.add(roof);
    g.add(box(0.5, 0.9, 0.05, mat('#5b3a22'), 0, 0.45, 1.01));
    [-0.55, 0.55].forEach(function (x) { g.add(box(0.36, 0.36, 0.04, glow, x, 1.15, 1.01)); });
    g.add(box(0.3, 0.7, 0.3, mat('#7a6a5a'), 0.55, 2.6, -0.3));
    return g;
  }
  function windmill(o) {
    var g = new T.Group(), wl = mat(o.color || '#e9dcc0');
    g.add(cyl(0.55, 0.9, 4.2, wl, 0, 2.1, 0, 12)); g.add(cyl(0.05, 0.8, 1.1, mat('#6b3a2a'), 0, 4.75, 0, 12));
    g.add(box(0.5, 0.9, 0.05, mat('#5b3a22'), 0, 0.45, 0.86));
    var hub = new T.Group(); hub.position.set(0, 4.1, 0.8); g.add(hub);
    hub.add(cyl(0.12, 0.12, 0.2, mat('#3a2a22'), 0, 0, 0)); hub.children[0].rotation.x = Math.PI / 2;
    var sail = mat('#f4efe2', { side: T.DoubleSide });
    for (var i = 0; i < 4; i++) { var arm = new T.Group(); arm.rotation.z = i * Math.PI / 2; arm.add(box(0.06, 2.3, 0.05, mat('#5b3a22'), 0, 1.2, 0.05)); arm.add(box(0.42, 1.7, 0.02, sail, 0.22, 1.35, 0.06)); hub.add(arm); }
    g.userData.spin = { obj: hub, speed: 0.9 };
    return g;
  }
  function bridge(o) {
    var g = new T.Group(), st = mat(o.color || '#b9ad98'), rail = mat('#6b4a2f');
    for (var i = -3; i <= 3; i++) {
      var x = i * 0.62, y = 2.05 - 0.055 * i * i, d = box(0.64, 0.16, 1.4, st, x, y, 0); d.rotation.z = -0.11 * i; g.add(d);
      [-0.66, 0.66].forEach(function (z) { g.add(box(0.06, 0.55, 0.06, rail, x, y + 0.35, z)); });
    }
    [-2.4, 2.4].forEach(function (x) { g.add(box(0.6, 1.6, 1.5, st, x, 0.8, 0)); });
    [-0.66, 0.66].forEach(function (z) { var r = box(4.4, 0.06, 0.06, rail, 0, 2.25, z); g.add(r); });
    return g;
  }
  function lantern(o) {
    var g = new T.Group(), wood = mat('#4a3324');
    g.add(box(0.1, 2.3, 0.1, wood, 0, 1.15, 0)); g.add(box(0.7, 0.08, 0.08, wood, 0.3, 2.26, 0));
    var glow = mat(o.color || '#ff5a4a', { emissive: o.color || '#ff5a4a', emissiveIntensity: 1 });
    g.add(cyl(0.18, 0.18, 0.42, glow, 0.6, 1.95, 0, 12)); g.add(cyl(0.12, 0.12, 0.05, wood, 0.6, 2.18, 0, 12)); g.add(cyl(0.12, 0.12, 0.05, wood, 0.6, 1.72, 0, 12));
    var L = new T.PointLight(o.color || '#ff7a5a', 0.6, 6, 2); L.position.set(0.6, 1.95, 0); g.add(L);
    g.userData.lamp = { light: L, bulb: glow };
    return g;
  }

  /* ---------------------------------------------------------------- phase 4: props that come to life, and imported works */
  /* a giant pop-up book on a reading table: the cover opens, pages turn, a paper scene stands up */
  function book(o) {
    var g = new T.Group(), wood = mat('#5a3a24'), coverM = mat(o.color || '#2f5d8a', { roughness: 0.6 }), paper = mat('#f6efdc', { side: T.DoubleSide, roughness: 0.95 });
    g.add(box(3.6, 0.08, 1.7, wood, 0, 0.78, 0)); [[-1.65, -0.7], [1.65, -0.7], [-1.65, 0.7], [1.65, 0.7]].forEach(function (p) { g.add(box(0.1, 0.78, 0.1, wood, p[0], 0.39, p[1])); });
    var root2 = new T.Group(); root2.position.y = 0.83; g.add(root2);
    root2.add(box(1.6, 0.04, 1.2, coverM, 0.8, 0.02, 0)); root2.add(box(1.5, 0.08, 1.12, paper, 0.78, 0.08, 0));
    var cover = new T.Group(); cover.position.y = 0.04; root2.add(cover);
    var title = canvasTex(256, 192, function (c, w, h) { c.fillStyle = o.color || '#2f5d8a'; c.fillRect(0, 0, w, h); c.strokeStyle = '#e3c06a'; c.lineWidth = 8; c.strokeRect(14, 14, w - 28, h - 28); c.fillStyle = '#f3dc9a'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = '700 30px -apple-system,"PingFang SC",sans-serif'; String(o.text || '故事书').split('\n').slice(0, 2).forEach(function (s, i, a) { c.fillText(s, w / 2, h / 2 + (i - (a.length - 1) / 2) * 40); }); });
    var cv = mesh(new T.BoxGeometry(1.6, 0.04, 1.2), [coverM, coverM, new T.MeshStandardMaterial({ map: title, roughness: 0.6 }), coverM, coverM, coverM], -0.8, 0.02, 0); cover.add(cv);
    cover.add(box(1.48, 0.012, 1.1, paper, -0.78, 0.045, 0));
    var pages = [];
    for (var i = 0; i < 4; i++) { var pg = new T.Group(); pg.position.y = 0.125 + i * 0.006; var pm = box(1.46, 0.006, 1.08, paper, 0.75, 0, 0); pg.add(pm); root2.add(pg); pages.push(pg); }
    /* the paper scene on the right page: a tree, a cottage and a moon, standing up as the book opens */
    var pop = new T.Group(); pop.position.set(0.8, 0.13, -0.1); root2.add(pop);
    var card = function (w, h, col, x) { var m = mesh(new T.PlaneGeometry(w, h), new T.MeshStandardMaterial({ color: col, side: T.DoubleSide, roughness: 0.9 }), x, h / 2, 0); pop.add(m); };
    card(0.36, 0.55, '#4f7a3d', -0.4); card(0.42, 0.38, '#d9a066', 0.05); card(0.2, 0.2, '#f3dc9a', 0.42);
    pop.children[2].position.y = 0.62;
    g.userData.rig = { prop: 'book', cover: cover, pages: pages, pop: pop };
    return g;
  }
  /* a grandfather clock that is also a time machine: the hands, the pendulum, the orb on top */
  function clockM(o) {
    var g = new T.Group(), wood = mat(o.color || '#6b3f24'), gold = mat('#c9a24a', { metalness: 0.55, roughness: 0.35 });
    g.add(box(1.1, 0.3, 0.8, wood, 0, 0.15, 0)); g.add(box(0.9, 2.3, 0.6, wood, 0, 1.45, 0)); g.add(box(1.1, 0.25, 0.75, wood, 0, 2.7, 0));
    var faceT = canvasTex(256, 256, function (c, w, h) { c.fillStyle = '#f6efdc'; c.beginPath(); c.arc(128, 128, 124, 0, 7); c.fill(); c.strokeStyle = '#3a2414'; c.lineWidth = 6; c.stroke(); c.fillStyle = '#3a2414'; c.font = '700 26px Georgia,serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; ['XII', 'III', 'VI', 'IX'].forEach(function (s, i) { var a = i * Math.PI / 2; c.fillText(s, 128 + Math.sin(a) * 96, 128 - Math.cos(a) * 96); }); });
    var face = mesh(new T.CircleGeometry(0.36, 32), new T.MeshStandardMaterial({ map: faceT, roughness: 0.8 }), 0, 2.2, 0.31); g.add(face);
    var ring = mesh(new T.TorusGeometry(0.37, 0.03, 8, 40), gold, 0, 2.2, 0.31); g.add(ring);
    var hand = function (len, w) { var h = new T.Group(); h.position.set(0, 2.2, 0.33); h.add(box(w, len, 0.015, mat('#1d1d22'), 0, len / 2, 0)); g.add(h); return h; };
    var hour = hand(0.2, 0.035), minute = hand(0.3, 0.022);
    g.add(box(0.5, 1.2, 0.02, mat('#2a1a10'), 0, 1.15, 0.305));
    var pend = new T.Group(); pend.position.set(0, 1.7, 0.32); g.add(pend); pend.add(box(0.025, 0.8, 0.015, gold, 0, -0.4, 0)); pend.add(cyl(0.11, 0.11, 0.03, gold, 0, -0.82, 0, 20)); pend.children[1].rotation.x = Math.PI / 2;
    var orbM = mat('#9fd8ff', { emissive: '#5ab8ff', emissiveIntensity: 0.4, transparent: true, opacity: 0.9 });
    g.add(sph(0.22, orbM, 0, 3.05, 0)); g.add(cyl(0.18, 0.25, 0.1, gold, 0, 2.85, 0, 16));
    var lever = new T.Group(); lever.position.set(0.5, 1.2, 0.1); g.add(lever); lever.add(box(0.05, 0.5, 0.05, gold, 0, 0.25, 0)); lever.add(sph(0.07, mat('#b22234'), 0, 0.52, 0));
    g.userData.rig = { prop: 'clock', hour: hour, minute: minute, pend: pend, orb: orbM, lever: lever };
    return g;
  }
  /* a music box the size of a table: the lid opens, a little stage turns with two dancers */
  function musicbox(o) {
    var g = new T.Group(), wood = mat(o.color || '#7a2f3a', { roughness: 0.55 }), gold = mat('#d9b25a', { metalness: 0.5, roughness: 0.35 });
    g.add(box(2.2, 0.8, 1.6, wood, 0, 0.4, 0)); g.add(box(2.26, 0.06, 1.66, gold, 0, 0.82, 0)); g.add(box(2.26, 0.06, 1.66, gold, 0, 0.03, 0));
    [-0.7, 0, 0.7].forEach(function (x) { g.add(sph(0.06, gold, x, 0.45, 0.81)); });
    var lid = new T.Group(); lid.position.set(0, 0.85, -0.8); g.add(lid);
    lid.add(box(2.2, 0.08, 1.6, wood, 0, 0.04, 0.8));
    var mirror = mesh(new T.PlaneGeometry(1.9, 1.3), new T.MeshStandardMaterial({ color: '#cfe6f5', metalness: 0.9, roughness: 0.15 }), 0, -0.002, 0.8); mirror.rotation.x = Math.PI / 2; lid.add(mirror);
    var plat = new T.Group(); plat.position.y = 0.86; g.add(plat);
    plat.add(cyl(0.6, 0.6, 0.06, mat('#f3e6c8'), 0, 0.03, 0, 32)); plat.add(cyl(0.62, 0.62, 0.03, gold, 0, 0.0, 0, 32));
    var dancer = function (x, z, col) { var f = figure({ height: 0.55, coat: col, hair: '#3a2a20', shirt: '#fff' }); f.position.set(x, 0.06, z); plat.add(f); return f; };
    var d1 = dancer(-0.25, 0, '#e86a8a'), d2 = dancer(0.25, 0, '#4a7fc1'); d2.rotation.y = Math.PI;
    plat.add(cone(0.14, 0.4, mat('#4f7a3d'), 0, 0.26, -0.35));
    g.userData.rig = { prop: 'musicbox', lid: lid, plat: plat, dancers: [d1, d2] };
    return g;
  }
  /* phase 5 ---------------------------------------------------------------------------------------------------------- */
  /* a thought machine: three meshing gears, a crank and a pointer — it turns when alive, faster on 旋转 */
  function gearsM(o) {
    var g = new T.Group(), brass = mat(o.color || '#c9a24a', { metalness: 0.6, roughness: 0.35 }), dark = mat('#2b2d33', { metalness: 0.4 });
    g.add(box(2.6, 0.8, 0.9, mat('#5a3a24'), 0, 0.4, -0.2)); g.add(box(2.4, 2.2, 0.12, mat('#3b2a1e'), 0, 1.9, -0.5));
    function gear(r, teeth, x, y) { var gr = new T.Group(); gr.position.set(x, y, -0.38); g.add(gr); gr.add(cyl(r, r, 0.12, brass, 0, 0, 0, 24)); gr.children[0].rotation.x = Math.PI / 2;
      for (var i = 0; i < teeth; i++) { var a = i / teeth * Math.PI * 2, t = box(0.12, 0.12, 0.12, brass, Math.cos(a) * (r + 0.05), Math.sin(a) * (r + 0.05), 0); t.rotation.z = a; gr.add(t); }
      gr.add(cyl(0.06, 0.06, 0.2, dark, 0, 0, 0, 10)); gr.children[gr.children.length - 1].rotation.x = Math.PI / 2; return gr; }
    var g1 = gear(0.55, 14, -0.6, 1.8), g2 = gear(0.35, 9, 0.35, 2.15), g3 = gear(0.42, 11, 0.55, 1.25);
    var crank = new T.Group(); crank.position.set(1.15, 0.85, 0.25); g.add(crank); crank.add(box(0.06, 0.45, 0.06, dark, 0, 0.22, 0)); crank.add(sph(0.08, mat('#b22234'), 0, 0.46, 0));
    g.userData.rig = { prop: 'gears', gears: [[g1, 1], [g2, -1.57], [g3, -1.31]], crank: crank };
    return g;
  }
  /* a concept top: three labelled rings on a spindle that spins and can be opened out */
  function topM(o) {
    var g = new T.Group(), spinG = new T.Group(); spinG.position.y = 0.3; g.add(spinG);
    g.add(cyl(0.9, 1, 0.15, mat('#3b2a1e'), 0, 0.075, 0, 32));
    spinG.add(cyl(0.05, 0.05, 2.6, mat('#c9a24a', { metalness: 0.6 }), 0, 1.3, 0, 10)); spinG.add(cone(0.35, 0.5, mat('#c9a24a', { metalness: 0.6 }), 0, 0.25, 0)); spinG.children[1].rotation.x = Math.PI;
    var labels = String(o.text || '感知\n理解\n行动').split('\n'), cols = ['#e86a8a', '#f3b23c', '#4a9fd8'], rings = [];
    for (var i = 0; i < 3; i++) {
      var rg = new T.Group(); rg.userData.base = 0.7 + i * 0.6; rg.position.y = rg.userData.base; spinG.add(rg);
      var r = 0.95 - i * 0.22; rg.add(cyl(r, r * 0.92, 0.2, mat(cols[i], { roughness: 0.5 }), 0, 0, 0, 28));
      var lb = labels[i] || ''; if (lb) { var tx = canvasTex(256, 64, function (c, w, h) { c.fillStyle = '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = '700 40px -apple-system,"PingFang SC",sans-serif'; c.fillText(lb, w / 2, h / 2); });
        for (var q = 0; q < 2; q++) { var pl = mesh(new T.PlaneGeometry(0.8, 0.2), new T.MeshBasicMaterial({ map: tx, transparent: true, side: T.DoubleSide }), 0, 0, 0); pl.rotation.y = q * Math.PI; pl.position.z = q ? -r - 0.01 : r + 0.01; rg.add(pl); } }
      rings.push(rg);
    }
    g.userData.rig = { prop: 'top', spin: spinG, rings: rings };
    return g;
  }
  /* a knowledge star: a glowing node floating at its height with its name; stars can be linked into a constellation */
  function star(o) {
    var g = new T.Group(), col = o.color || '#ffd86b', h = 1.2 + (o.lift == null ? 1.5 : +o.lift);
    var core = mesh(new T.IcosahedronGeometry(0.28, 1), new T.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 1.2, roughness: 0.3 }), 0, h, 0); g.add(core);
    var halo = mesh(new T.SphereGeometry(0.55, 16, 12), new T.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.18, depthWrite: false }), 0, h, 0); g.add(halo);
    g.add(cyl(0.01, 0.01, h - 0.3, mat('#ffffff', { transparent: true, opacity: 0.25 }), 0, (h - 0.3) / 2, 0, 6));
    var t = String(o.text || '想法').slice(0, 12), tx = canvasTex(256, 64, function (c, w, hh) { c.fillStyle = 'rgba(10,14,28,.75)'; c.fillRect(0, 8, w, 48); c.fillStyle = '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = '700 34px -apple-system,"PingFang SC",sans-serif'; c.fillText(t, w / 2, 32); });
    var sp = new T.Sprite(new T.SpriteMaterial({ map: tx, transparent: true, depthWrite: false })); sp.scale.set(1.6, 0.4, 1); sp.position.set(0, h + 0.65, 0); g.add(sp);
    g.userData.starAt = h; g.userData.rig = { prop: 'star', core: core, halo: halo };
    return g;
  }
  /* an idea that grows: a stem, branching leaves and a flower with the idea's words; 生长 grows it, 枯萎 lets it fall */
  function sprout(o) {
    var g = new T.Group(), plant = new T.Group(); g.add(plant);
    g.add(cyl(0.45, 0.35, 0.4, mat('#9a5b3a'), 0, 0.2, 0, 16)); g.add(cyl(0.42, 0.42, 0.04, mat('#3b2a1e'), 0, 0.41, 0, 16));
    var stem = mat('#4f8a3d'), leaf = mat(o.color || '#6abf4b', { side: T.DoubleSide });
    plant.position.y = 0.42; plant.add(cyl(0.04, 0.06, 1.8, stem, 0, 0.9, 0, 8));
    [[0.5, 1, 0.6], [1.0, -1, 0.5], [1.4, 1, 0.45]].forEach(function (b) { var br = new T.Group(); br.position.y = b[0]; br.rotation.z = -b[1] * 0.7; plant.add(br); br.add(cyl(0.025, 0.03, b[2], stem, 0, b[2] / 2, 0, 6)); var lf = sph(0.16, leaf, 0, b[2], 0); lf.scale.set(1.4, 0.5, 1); br.add(lf); });
    var fl = new T.Group(); fl.position.y = 1.85; plant.add(fl);
    for (var i = 0; i < 6; i++) { var pt = sph(0.13, mat('#ffcfe0'), Math.cos(i) * 0.16, 0, Math.sin(i) * 0.16); pt.scale.y = 0.4; fl.add(pt); } fl.add(sph(0.1, mat('#ffd86b'), 0, 0.02, 0));
    var t = String(o.text || '一个想法').slice(0, 12), tx = canvasTex(256, 64, function (c, w, h) { c.fillStyle = 'rgba(255,255,255,.85)'; c.fillRect(0, 8, w, 48); c.fillStyle = '#2f5a2a'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = '700 32px -apple-system,"PingFang SC",sans-serif'; c.fillText(t, w / 2, 32); });
    var sp = new T.Sprite(new T.SpriteMaterial({ map: tx, transparent: true, depthWrite: false })); sp.scale.set(1.4, 0.35, 1); sp.position.set(0, 2.75, 0); g.add(sp);
    g.userData.rig = { prop: 'sprout', plant: plant, label: sp };
    return g;
  }
  function cone(r, h, m, x, y, z) { return mesh(new T.ConeGeometry(r, h, 10), m, x, y, z); }
  /* a door in its own frame: opens on its hinge (what is behind it is up to the director) */
  function door(o) {
    var g = new T.Group(), frameM = mat('#4a3324'), leafM = mat(o.color || '#2f6b5a', { roughness: 0.6 }), gold = mat('#d9b25a', { metalness: 0.5, roughness: 0.35 });
    g.add(box(0.2, 2.6, 0.3, frameM, -0.7, 1.3, 0)); g.add(box(0.2, 2.6, 0.3, frameM, 0.7, 1.3, 0)); g.add(box(1.6, 0.25, 0.3, frameM, 0, 2.72, 0));
    var leaf = new T.Group(); leaf.position.set(-0.6, 0, 0.05); g.add(leaf);
    leaf.add(box(1.2, 2.45, 0.08, leafM, 0.6, 1.23, 0)); leaf.add(sph(0.06, gold, 1.05, 1.2, 0.07));
    [0.6, 1.7].forEach(function (y) { leaf.add(box(0.9, 0.7, 0.02, mat('#25574a'), 0.6, y, 0.045)); });
    g.userData.rig = { prop: 'door', leaf: leaf };
    return g;
  }
  /* a Type Workshop word as a glowing neon sign (its text and colour come with the import) */
  function word(o) {
    var g = new T.Group(), text = String(o.text || 'Minest').slice(0, 24), col = o.color || '#ff5ac8';
    var W = Math.max(1.4, Math.min(6, 0.35 + text.length * 0.42));
    var tex = canvasTex(1024, 256, function (c, w, h) { c.fillStyle = 'rgba(0,0,0,0)'; c.clearRect(0, 0, w, h); var fs = 150; c.font = '800 ' + fs + 'px -apple-system,"PingFang SC",sans-serif'; while (c.measureText(text).width > w - 60 && fs > 40) { fs -= 6; c.font = '800 ' + fs + 'px -apple-system,"PingFang SC",sans-serif'; } c.textAlign = 'center'; c.textBaseline = 'middle'; c.shadowColor = col; c.shadowBlur = 28; c.fillStyle = '#ffffff'; c.fillText(text, w / 2, h / 2); c.shadowBlur = 0; c.strokeStyle = col; c.lineWidth = 6; c.strokeText(text, w / 2, h / 2); });
    g.add(box(W + 0.2, 0.9, 0.06, mat('#141824'), 0, 1.6, -0.04));
    var sign = mesh(new T.PlaneGeometry(W, W / 4), new T.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }), 0, 1.6, 0.0); g.add(sign);
    [-W / 2 + 0.1, W / 2 - 0.1].forEach(function (x) { g.add(box(0.06, 1.2, 0.06, mat('#2b2d33'), x, 0.6, -0.04)); });
    var L = new T.PointLight(col, 0.8, 5, 2); L.position.set(0, 1.6, 0.6); g.add(L);
    return g;
  }
  /* a thing from My World (a card in a collection) in a frame on an easel: its picture when it has one, else its title */
  function picture(o) {
    var g = new T.Group(), wood = mat('#6b4a2f'), gold = mat('#c9a24a', { metalness: 0.5, roughness: 0.35 });
    [-0.45, 0.45].forEach(function (x) { var l = box(0.06, 1.7, 0.06, wood, x, 0.85, 0.1); l.rotation.x = -0.12; g.add(l); });
    var back = box(0.06, 1.6, 0.06, wood, 0, 0.8, -0.35); back.rotation.x = 0.3; g.add(back);
    g.add(box(1.16, 0.06, 0.12, wood, 0, 0.82, 0.15));
    var t = String(o.text || '我的收藏');
    var tex = canvasTex(256, 320, function (c, w, h) { c.fillStyle = '#fbf7ee'; c.fillRect(0, 0, w, h); c.fillStyle = '#1d2b4f'; c.textAlign = 'center'; c.font = '700 26px -apple-system,"PingFang SC",sans-serif'; (t.match(/.{1,8}/g) || ['']).slice(0, 6).forEach(function (s, i) { c.fillText(s, w / 2, 70 + i * 40); }); });
    var pm = new T.MeshStandardMaterial({ map: tex, roughness: 0.9 });
    var pic = mesh(new T.PlaneGeometry(0.9, 1.12), pm, 0, 1.45, 0.16); pic.rotation.x = -0.12; g.add(pic);
    var fr = box(1.04, 1.26, 0.05, gold, 0, 1.45, 0.13); fr.rotation.x = -0.12; g.add(fr);
    if (o.img && /^https?:|^data:image\//.test(o.img)) { try { var ld = new T.TextureLoader(); ld.setCrossOrigin('anonymous'); ld.load(o.img, function (tx) { pm.map = tx; pm.needsUpdate = true; }); } catch (e) {} }
    return g;
  }

  var KINDS = {
    lincoln: { name: '林肯', icon: '🎩', cat: 'character', build: function (o) { return figure({ height: 1.93, coat: '#17171b', legs: '#26262c', skin: '#d9a982', beard: '#2a211c', hair: '#2a211c', hat: '#141417', tails: true, shirt: '#f2efe6', tie: '#0e0e10' }); } },
    figure: { name: '人物', icon: '🧍', cat: 'character', color: '#4f6d8f', build: function (o) { return figure({ coat: o.color || '#4f6d8f', hair: '#3a2a20', shirt: '#f2efe6' }); } },
    guide: { name: '讲解员', icon: '🧑‍🏫', cat: 'character', color: '#2f7d6b', build: function (o) { return figure({ height: 1.7, coat: o.color || '#2f7d6b', hair: '#191514', legs: '#3b3b44', shirt: '#fff' }); } },
    podium: { name: '演讲台', icon: '🪧', cat: 'prop', build: podium },
    stage: { name: '舞台', icon: '🟫', cat: 'set', build: stage },
    curtain: { name: '幕布', icon: '🎭', cat: 'set', color: '#7d1424', build: curtain },
    bench: { name: '长椅', icon: '🪑', cat: 'set', build: bench },
    chair: { name: '座椅', icon: '💺', cat: 'set', color: '#8c2f39', build: chair },
    spot: { name: '聚光灯', icon: '🔦', cat: 'light', color: '#fff1cf', build: spot },
    lamp: { name: '路灯', icon: '🏮', cat: 'light', build: lamp },
    flag: { name: '旗帜', icon: '🚩', cat: 'prop', build: flag },
    column: { name: '立柱', icon: '🏛️', cat: 'set', color: '#e8e2d4', build: column },
    tree: { name: '树', icon: '🌳', cat: 'nature', color: '#4f7a3d', build: tree },
    sign: { name: '告示牌', icon: '📜', cat: 'prop', text: '梦工坊', build: sign },
    portrait: { name: '魔法画像', icon: '🖼️', cat: 'portrait', color: '#5b2a3a', build: portrait },
    wall: { name: '墙面', icon: '🧱', cat: 'set', color: '#3d5a4a', build: wall },
    boat: { name: '小船', icon: '🛶', cat: 'prop', color: '#8a5a35', build: boat },
    house: { name: '小屋', icon: '🏠', cat: 'set', color: '#efe1c4', build: house },
    windmill: { name: '风车', icon: '🌬️', cat: 'set', color: '#e9dcc0', build: windmill },
    bridge: { name: '拱桥', icon: '🌉', cat: 'set', color: '#b9ad98', build: bridge },
    lantern: { name: '灯笼', icon: '🏮', cat: 'light', color: '#ff5a4a', build: lantern },
    book: { name: '立体故事书', icon: '📖', cat: 'animated', color: '#2f5d8a', text: '故事书', build: book },
    clock: { name: '时光钟', icon: '🕰️', cat: 'animated', color: '#6b3f24', build: clockM },
    musicbox: { name: '音乐盒', icon: '🎶', cat: 'animated', color: '#7a2f3a', build: musicbox },
    door: { name: '神秘之门', icon: '🚪', cat: 'animated', color: '#2f6b5a', build: door },
    word: { name: '霓虹字', icon: '✨', cat: 'prop', color: '#ff5ac8', text: 'Minest', build: word },
    picture: { name: '画框', icon: '🖼', cat: 'animated', text: '我的收藏', build: picture },
    gears: { name: '思想机械仪', icon: '⚙️', cat: 'animated', color: '#c9a24a', build: gearsM },
    top: { name: '概念陀螺', icon: '🌀', cat: 'animated', text: '感知\n理解\n行动', build: topM },
    star: { name: '知识之星', icon: '⭐', cat: 'animated', color: '#ffd86b', text: '想法', build: star },
    sprout: { name: '思想之芽', icon: '🌱', cat: 'animated', color: '#6abf4b', text: '一个想法', build: sprout }
  };
  KINDS.lamp.icon = '💡';
  function build(o) {
    var K = KINDS[o.kind] || KINDS.figure, g = K.build(o);
    g.traverse(function (m) { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
    return g;
  }
  root.DWModels = {
    KINDS: KINDS, build: build,
    isFigure: function (kind) { return (KINDS[kind] || {}).cat === 'character'; },
    /* what Bring to Life works on: characters and the magic portrait */
    canLive: function (kind) { var c = (KINDS[kind] || {}).cat; return c === 'character' || c === 'portrait' || c === 'animated'; },
    isProp: function (kind) { return (KINDS[kind] || {}).cat === 'animated'; },
    /* what each living thing can do on the timeline (and when a guest taps it) */
    actions: function (kind) {
      return ({ portrait: ['smile', 'surprise', 'wink', 'turnHead', 'nod'], book: ['open', 'turnPage', 'close'], clock: ['timeTravel'], musicbox: ['open', 'spin', 'close'], door: ['open', 'close'],
        picture: [], word: [], gears: ['spin'], top: ['spin', 'open', 'close'], star: ['spin'], sprout: ['grow', 'wilt'] })[kind] ||
        ['raiseHand', 'turnHead', 'nod', 'openArms', 'point', 'bow', 'smile', 'stroll'];
    }
  };
})(window);
