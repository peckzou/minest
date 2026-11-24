/* Minest Dream Workshop · 梦工坊 — the World & History library (Phase 8).
 * More things for the shelf: landmarks, people from history, animals and ways to travel — each with a knowledge card
 * (`fact`: where it is from, two sentences a child can read, and one quiz question). Also the scene kits: a corner of
 * the world set out in one tap. Load after dw-models.js; everything here goes into DWModels.KINDS.
 * Same rules as dw-models.js: front facing +z, standing on y = 0, in metres. */
(function (root) {
  'use strict';
  var T = root.THREE, DM = root.DWModels, KINDS = DM.KINDS, PI = Math.PI;
  function mat(c, o) { return new T.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.78, metalness: 0 }, o || {})); }
  function mesh(g, m, x, y, z) { var o = new T.Mesh(g, m); o.position.set(x || 0, y || 0, z || 0); return o; }
  function box(w, h, d, m, x, y, z) { return mesh(new T.BoxGeometry(w, h, d), m, x, y, z); }
  function cyl(rt, rb, h, m, x, y, z, seg) { return mesh(new T.CylinderGeometry(rt, rb, h, seg || 14), m, x, y, z); }
  function sph(r, m, x, y, z) { return mesh(new T.SphereGeometry(r, 18, 14), m, x, y, z); }
  function cone(r, h, m, x, y, z, seg) { return mesh(new T.ConeGeometry(r, h, seg || 10), m, x, y, z); }
  /* a bar from a to b, w wide and h thick (never straight up: lookAt needs a side) */
  function beam(a, b, w, h, m) {
    var va = new T.Vector3(a[0], a[1], a[2]), vb = new T.Vector3(b[0], b[1], b[2]);
    var o = new T.Mesh(new T.BoxGeometry(w, h, va.distanceTo(vb)), m); o.position.copy(va).add(vb).multiplyScalar(0.5); o.lookAt(vb); return o;
  }
  /* a gable roof: w wide, h high, d deep, its two gables facing ±z */
  function prism(w, h, d, m, x, y, z) {
    var s = new T.Shape(); s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(0, h); s.lineTo(-w / 2, 0);
    var geo = new T.ExtrudeGeometry(s, { depth: d, bevelEnabled: false }); geo.translate(0, 0, -d / 2);
    return mesh(geo, m, x, y, z);
  }
  function canvasTex(w, h, draw) {
    var c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
    var t = new T.CanvasTexture(c); t.anisotropy = 4; return t;
  }
  var DARK = '#1f2430';

  /* ================================================================ landmarks */
  function pyramid(o) {
    var g = new T.Group(), sand = mat(o.color || '#d9b97a', { roughness: 0.95 });
    var p = cone(3.1, 3.9, sand, 0, 1.95, 0, 4); p.rotation.y = PI / 4; g.add(p);
    for (var i = 1; i < 6; i++) { var w = 4.38 * (1 - i / 6.5) + 0.03; g.add(box(w, 0.03, w, mat('#b99a5f'), 0, 3.9 * i / 6.5, 0)); }
    var cap = cone(0.34, 0.44, mat('#fbbf24', { metalness: 0.7, roughness: 0.25 }), 0, 3.7, 0, 4); cap.rotation.y = PI / 4; g.add(cap);
    g.add(box(0.5, 0.62, 0.1, mat(DARK), 0, 0.4, 1.97));
    return g;
  }
  function sphinx(o) {
    var g = new T.Group(), st = mat(o.color || '#cfae74', { roughness: 0.95 }), dk = mat('#a58450');
    g.add(box(1.7, 0.22, 4.3, dk, 0, 0.11, 0));
    g.add(box(1.2, 0.95, 2.7, st, 0, 0.7, -0.55));
    g.add(box(1.36, 0.75, 0.9, st, 0, 0.62, -1.6));
    [-0.42, 0.42].forEach(function (x) { g.add(box(0.36, 0.38, 1.6, st, x, 0.41, 1.25)); });
    g.add(box(0.74, 0.5, 0.6, st, 0, 1.35, 0.7));
    g.add(box(0.66, 0.74, 0.62, st, 0, 1.9, 0.82));
    g.add(box(1.1, 0.95, 0.26, mat('#3f6fb0'), 0, 1.92, 0.52));
    [-0.48, 0.48].forEach(function (x) { g.add(box(0.2, 0.9, 0.36, mat('#e0b64a'), x, 1.6, 0.74)); });
    [-0.15, 0.15].forEach(function (x) { g.add(box(0.1, 0.06, 0.03, mat(DARK), x, 2.02, 1.14)); });
    g.add(box(0.12, 0.2, 0.08, dk, 0, 1.88, 1.15)); g.add(box(0.26, 0.04, 0.03, mat('#8a5a3a'), 0, 1.7, 1.14));
    return g;
  }
  function greatwall(o) {
    var g = new T.Group(), st = mat(o.color || '#b8ab95', { roughness: 0.92 }), dk = mat('#8f846f');
    g.add(box(7.2, 1.5, 0.9, st, 0, 0.75, 0)); g.add(box(7.2, 0.06, 0.6, dk, 0, 1.5, 0));
    for (var x = -3.4; x <= 3.41; x += 0.62) [-0.37, 0.37].forEach(function (z) { g.add(box(0.36, 0.36, 0.16, st, x, 1.68, z)); });
    g.add(box(1.9, 2.7, 1.7, st, 0, 1.35, 0)); g.add(box(2.0, 0.1, 1.8, dk, 0, 2.7, 0));
    [-0.75, -0.25, 0.25, 0.75].forEach(function (xx) { [-0.78, 0.78].forEach(function (z) { g.add(box(0.32, 0.36, 0.16, st, xx, 2.92, z)); }); });
    [-0.5, 0, 0.5].forEach(function (z) { [-0.88, 0.88].forEach(function (xx) { g.add(box(0.16, 0.36, 0.3, st, xx, 2.92, z)); }); });
    [-0.42, 0.42].forEach(function (xx) { [-0.86, 0.86].forEach(function (z) { g.add(box(0.3, 0.46, 0.05, mat(DARK), xx, 2.0, z)); }); });
    g.add(cyl(0.3, 0.36, 0.2, dk, 0, 2.85, 0, 10));
    g.add(cone(0.2, 0.5, mat('#fb923c', { emissive: '#f97316', emissiveIntensity: 1.2 }), 0, 3.2, 0));
    return g;
  }
  function pagoda(o) {
    var g = new T.Group(), wallM = mat(o.color || '#b23a2e'), tile = mat('#3f4a4a', { roughness: 0.6 }), gold = mat('#fbbf24', { metalness: 0.7, roughness: 0.25 });
    g.add(box(3.4, 0.3, 3.4, mat('#cfc6b4'), 0, 0.15, 0));
    for (var i = 0; i < 5; i++) {
      var w = 2.4 - i * 0.38, y = 0.3 + i * 1.15;
      g.add(box(w, 0.8, w, wallM, 0, y + 0.4, 0));
      g.add(box(w * 0.3, 0.5, 0.05, mat(DARK), 0, y + 0.3, w / 2 + 0.01));
      var rf = cone(w * 0.98, 0.42, tile, 0, y + 1.0, 0, 4); rf.rotation.y = PI / 4; g.add(rf);
      g.add(box(w * 1.42, 0.05, w * 1.42, tile, 0, y + 0.8, 0));
    }
    g.add(cyl(0.05, 0.07, 0.9, gold, 0, 6.45, 0, 8)); g.add(sph(0.14, gold, 0, 6.95, 0));
    return g;
  }
  function eiffel(o) {
    var g = new T.Group(), iron = mat(o.color || '#7a6552', { metalness: 0.35, roughness: 0.6 });
    [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(function (s) {
      g.add(beam([1.7 * s[0], 0, 1.7 * s[1]], [0.75 * s[0], 2.2, 0.75 * s[1]], 0.3, 0.3, iron));
      g.add(beam([0.75 * s[0], 2.2, 0.75 * s[1]], [0.36 * s[0], 4.2, 0.36 * s[1]], 0.2, 0.2, iron));
      g.add(box(0.5, 0.12, 0.5, mat('#55473a'), 1.7 * s[0], 0.06, 1.7 * s[1]));
    });
    for (var k = 0; k < 4; k++) {
      var sd = new T.Group(); sd.rotation.y = k * PI / 2; g.add(sd);
      var arc = mesh(new T.TorusGeometry(0.95, 0.06, 6, 18, PI), iron, 0, 1.0, 1.28); sd.add(arc);
      sd.add(box(2.5, 0.1, 0.1, iron, 0, 1.1, 1.24)); sd.add(box(1.25, 0.08, 0.08, iron, 0, 3.2, 0.56));
      sd.add(beam([-1.2, 1.1, 1.24], [0.75, 2.2, 0.76], 0.05, 0.05, iron)); sd.add(beam([1.2, 1.1, 1.24], [-0.75, 2.2, 0.76], 0.05, 0.05, iron));
    }
    g.add(box(1.9, 0.14, 1.9, iron, 0, 2.2, 0)); g.add(box(1.0, 0.12, 1.0, iron, 0, 4.2, 0));
    var top = cyl(0.08, 0.38, 3.6, iron, 0, 6.0, 0, 4); top.rotation.y = PI / 4; g.add(top);
    g.add(box(0.34, 0.16, 0.34, iron, 0, 7.85, 0)); g.add(cyl(0.02, 0.03, 0.8, iron, 0, 8.3, 0, 6));
    g.add(sph(0.07, mat('#fde047', { emissive: '#fde047', emissiveIntensity: 1 }), 0, 8.72, 0));
    return g;
  }
  function bigben(o) {
    var g = new T.Group(), st = mat(o.color || '#c9b27a', { roughness: 0.85 }), dk = mat('#3b4a44', { roughness: 0.6 }), gold = mat('#fbbf24', { metalness: 0.6, roughness: 0.3 });
    g.add(box(1.6, 0.3, 1.6, mat('#9c8a5f'), 0, 0.15, 0)); g.add(box(1.3, 6.0, 1.3, st, 0, 3.3, 0));
    for (var i = 0; i < 4; i++) [-0.4, 0, 0.4].forEach(function (x) { g.add(box(0.14, 0.8, 0.03, mat('#8f7d52'), x, 1.4 + i * 1.3, 0.66)); });
    g.add(box(1.56, 1.5, 1.56, st, 0, 7.05, 0)); g.add(box(1.66, 0.1, 1.66, gold, 0, 6.3, 0)); g.add(box(1.66, 0.1, 1.66, gold, 0, 7.8, 0));
    for (var k = 0; k < 4; k++) {
      var f = new T.Group(); f.rotation.y = k * PI / 2; g.add(f);
      var face = cyl(0.56, 0.56, 0.04, mat('#fffbea', { emissive: '#fff4c2', emissiveIntensity: 0.35 }), 0, 7.05, 0.79, 24); face.rotation.x = PI / 2; f.add(face);
      var hh = box(0.05, 0.3, 0.02, mat(DARK), 0.06, 7.16, 0.82); hh.rotation.z = -0.5; f.add(hh);
      f.add(box(0.035, 0.44, 0.02, mat(DARK), 0, 7.26, 0.82));
    }
    var rf = cone(1.12, 1.7, dk, 0, 8.7, 0, 4); rf.rotation.y = PI / 4; g.add(rf);
    g.add(cyl(0.03, 0.05, 0.7, gold, 0, 9.8, 0, 6));
    return g;
  }
  function colosseum(o) {
    var g = new T.Group(), col = o.color || '#d8c9a8', R = 3.2;
    var st = new T.MeshStandardMaterial({ color: col, roughness: 0.9, side: T.DoubleSide });
    g.add(cyl(R + 0.15, R + 0.15, 0.1, mat('#b9a987'), 0, 0.05, 0, 36));
    for (var t = 0; t < 4; t++) {
      var th = t === 3 ? PI * 1.15 : PI * 2;
      g.add(mesh(new T.CylinderGeometry(R, R, 0.9, 40, 1, true, 0.6, th), st, 0, 0.55 + t * 0.9, 0));
      g.add(mesh(new T.CylinderGeometry(R + 0.05, R + 0.05, 0.08, 40, 1, true, 0.6, th), st, 0, 1.0 + t * 0.9, 0));
      for (var i = 0; i < 24; i++) {
        var a = i / 24 * PI * 2, rel = (PI / 2 - a - 0.6 + PI * 6) % (PI * 2);   /* the same angle as the cylinder's theta */
        if (t === 3 && rel > th) continue;
        var w = box(0.42, t === 3 ? 0.3 : 0.6, 0.06, mat(DARK), Math.cos(a) * (R + 0.01), 0.5 + t * 0.9, Math.sin(a) * (R + 0.01)); w.rotation.y = PI / 2 - a; g.add(w);
      }
    }
    g.add(mesh(new T.CylinderGeometry(R - 0.1, 2.1, 2.5, 36, 1, true), new T.MeshStandardMaterial({ color: '#c2b28f', roughness: 0.95, side: T.DoubleSide }), 0, 1.35, 0));
    g.add(cyl(2.1, 2.1, 0.06, mat('#d9c08a', { roughness: 1 }), 0, 0.13, 0, 32));
    return g;
  }
  function parthenon(o) {
    var g = new T.Group(), mb = mat(o.color || '#efe7d6', { roughness: 0.8 });
    g.add(box(4.4, 0.15, 5.7, mb, 0, 0.075, 0)); g.add(box(4.1, 0.15, 5.4, mb, 0, 0.225, 0));
    function colm(x, z) { g.add(cyl(0.16, 0.2, 2.1, mb, x, 1.35, z, 12)); g.add(box(0.44, 0.08, 0.44, mb, x, 2.44, z)); }
    for (var i = 0; i < 8; i++) { colm(-1.75 + i * 0.5, 2.4); colm(-1.75 + i * 0.5, -2.4); }
    for (var j = 1; j < 8; j++) { colm(-1.75, -2.4 + j * 0.6); colm(1.75, -2.4 + j * 0.6); }
    g.add(box(2.4, 2.1, 3.6, mat('#e2d8c0'), 0, 1.35, 0)); g.add(box(0.7, 1.5, 0.05, mat(DARK), 0, 1.05, 1.81));
    g.add(box(4.0, 0.35, 5.3, mb, 0, 2.66, 0));
    g.add(prism(4.2, 0.75, 5.4, mat('#d9cdb4'), 0, 2.83, 0));
    return g;
  }
  function tajmahal(o) {
    var g = new T.Group(), mb = mat(o.color || '#f7f3ea', { roughness: 0.55 }), gold = mat('#fbbf24', { metalness: 0.7, roughness: 0.25 });
    g.add(box(6, 0.4, 6, mat('#e9e2d2'), 0, 0.2, 0));
    g.add(box(3, 2, 3, mb, 0, 1.4, 0));
    for (var k = 0; k < 4; k++) {
      var f = new T.Group(); f.rotation.y = k * PI / 2; g.add(f);
      f.add(box(1.0, 1.75, 0.1, mb, 0, 1.4, 1.52)); f.add(box(0.7, 1.25, 0.06, mat('#3a4254'), 0, 1.1, 1.58));
      var ar = cyl(0.35, 0.35, 0.06, mat('#3a4254'), 0, 1.72, 1.58, 16); ar.rotation.x = PI / 2; f.add(ar);
      [-1.0, 1.0].forEach(function (x) { f.add(box(0.36, 0.5, 0.05, mat('#3a4254'), x, 0.9, 1.52)); f.add(box(0.36, 0.5, 0.05, mat('#3a4254'), x, 1.75, 1.52)); });
    }
    g.add(cyl(0.95, 0.95, 0.5, mb, 0, 2.65, 0, 24));
    var dome = sph(1.1, mb, 0, 3.55, 0); dome.scale.y = 1.15; g.add(dome);
    g.add(cone(0.2, 0.7, mb, 0, 5.05, 0)); g.add(cyl(0.02, 0.03, 0.5, gold, 0, 5.6, 0, 6));
    [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(function (s) {
      g.add(cyl(0.3, 0.3, 0.35, mb, s[0] * 1.05, 2.58, s[1] * 1.05, 10)); g.add(sph(0.36, mb, s[0] * 1.05, 2.92, s[1] * 1.05));
      g.add(cyl(0.15, 0.2, 3.6, mb, s[0] * 2.7, 2.2, s[1] * 2.7, 12)); g.add(cyl(0.26, 0.26, 0.06, mb, s[0] * 2.7, 3.5, s[1] * 2.7, 12));
      g.add(sph(0.22, mb, s[0] * 2.7, 4.12, s[1] * 2.7));
    });
    return g;
  }
  function torii(o) {
    var g = new T.Group(), red = mat(o.color || '#d8372b', { roughness: 0.55 }), blk = mat('#1c1c20');
    [-1.4, 1.4].forEach(function (x) { g.add(cyl(0.16, 0.19, 3.2, red, x, 1.6, 0)); g.add(cyl(0.24, 0.26, 0.3, blk, x, 0.15, 0)); });
    g.add(box(4.2, 0.24, 0.4, red, 0, 3.3, 0)); g.add(box(4.5, 0.1, 0.52, blk, 0, 3.47, 0));
    g.add(box(3.5, 0.18, 0.22, red, 0, 2.6, 0)); g.add(box(0.36, 0.5, 0.1, blk, 0, 2.95, 0)); g.add(box(0.28, 0.4, 0.02, mat('#fbbf24', { metalness: 0.5 }), 0, 2.95, 0.06));
    return g;
  }
  function liberty(o) {
    var g = new T.Group(), cu = mat(o.color || '#5fa893', { roughness: 0.6 }), stn = mat('#b7ae9c', { roughness: 0.9 }), gold = mat('#fbbf24', { metalness: 0.7, roughness: 0.25 });
    var base = cyl(1.5, 1.6, 0.4, mat('#8f8878'), 0, 0.2, 0, 11); g.add(base);
    g.add(box(1.5, 0.5, 1.5, stn, 0, 0.65, 0)); g.add(box(1.15, 1.7, 1.15, stn, 0, 1.75, 0)); g.add(box(1.4, 0.16, 1.4, stn, 0, 2.68, 0));
    g.add(cyl(0.3, 0.5, 1.9, cu, 0, 3.7, 0, 14));
    g.add(box(0.62, 0.5, 0.36, cu, 0, 4.55, 0));
    g.add(cyl(0.09, 0.1, 0.16, cu, 0, 4.86, 0, 10)); g.add(sph(0.19, cu, 0, 5.05, 0));
    for (var i = 0; i < 7; i++) { var a = (i - 3) * 0.42, sp = cone(0.03, 0.26, cu, Math.sin(a) * 0.26, 5.17 + Math.cos(a) * 0.22, 0, 6); sp.rotation.z = -a; g.add(sp); }
    g.add(beam([0.3, 4.7, 0], [0.5, 5.6, 0.02], 0.13, 0.13, cu));
    g.add(cyl(0.07, 0.04, 0.22, gold, 0.52, 5.72, 0.02, 8));
    g.add(sph(0.11, mat('#fde047', { emissive: '#fbbf24', emissiveIntensity: 1.4 }), 0.52, 5.92, 0.02));
    g.add(beam([-0.3, 4.6, 0.05], [-0.34, 4.15, 0.22], 0.12, 0.12, cu));
    var tb = box(0.22, 0.34, 0.05, cu, -0.36, 4.3, 0.3); tb.rotation.x = -0.3; g.add(tb);
    return g;
  }
  function moai(o) {
    var g = new T.Group(), st = mat(o.color || '#6f6a63', { roughness: 1 }), dk = mat('#4f4b46', { roughness: 1 });
    g.add(box(1.5, 0.3, 1.1, dk, 0, 0.15, 0)); g.add(box(0.9, 1.2, 0.6, st, 0, 0.9, 0));
    [-0.4, 0.4].forEach(function (x) { g.add(box(0.14, 0.9, 0.3, st, x * 1.1, 0.85, 0.1)); });
    g.add(box(0.76, 1.3, 0.78, st, 0, 2.15, 0.02));
    g.add(box(0.82, 0.14, 0.2, st, 0, 2.52, 0.36)); g.add(box(0.2, 0.62, 0.26, st, 0, 2.18, 0.46));
    [-0.2, 0.2].forEach(function (x) { g.add(box(0.2, 0.1, 0.05, dk, x, 2.4, 0.4)); });
    g.add(box(0.4, 0.06, 0.06, dk, 0, 1.76, 0.4)); g.add(box(0.46, 0.2, 0.2, st, 0, 1.62, 0.34));
    [-0.42, 0.42].forEach(function (x) { g.add(box(0.1, 0.7, 0.22, st, x, 2.1, 0)); });
    g.add(cyl(0.36, 0.4, 0.42, mat('#8a3b2a', { roughness: 1 }), 0, 3.02, 0, 12));
    return g;
  }
  function igloo(o) {
    var g = new T.Group(), snow = mat(o.color || '#eef6fb', { roughness: 0.9 }), line = mat('#c9dcea');
    g.add(mesh(new T.SphereGeometry(1.6, 22, 12, 0, PI * 2, 0, PI / 2), snow, 0, 0, 0));
    [0.4, 0.8, 1.15].forEach(function (y) { var r = Math.sqrt(1.6 * 1.6 - y * y) + 0.005, t = mesh(new T.TorusGeometry(r, 0.012, 4, 36), line, 0, y, 0); t.rotation.x = PI / 2; g.add(t); });
    var tn = cyl(0.56, 0.56, 1.1, snow, 0, 0.18, 1.75, 16); tn.rotation.x = PI / 2; g.add(tn);
    var dr = cyl(0.42, 0.42, 0.04, mat(DARK), 0, 0.2, 2.31, 16); dr.rotation.x = PI / 2; g.add(dr);
    g.add(cyl(1.9, 2.0, 0.06, mat('#f8fbfd', { roughness: 1 }), 0, 0.03, 0.3, 24));
    return g;
  }
  function stonehenge(o) {
    var g = new T.Group(), st = mat(o.color || '#8b8d8a', { roughness: 1 }), R = 2.6, n = 10;
    g.add(cyl(3.4, 3.5, 0.06, mat('#6f8f55', { roughness: 1 }), 0, 0.03, 0, 28));
    for (var i = 0; i < n; i++) {
      var a = i / n * PI * 2, u = box(0.52, 1.9, 0.4, st, Math.cos(a) * R, 0.98, Math.sin(a) * R); u.rotation.y = PI / 2 - a; g.add(u);
      if (i % 5 !== 4) { var m = a + PI / n, l = box(1.72, 0.3, 0.42, st, Math.cos(m) * R * 0.95, 2.08, Math.sin(m) * R * 0.95); l.rotation.y = PI / 2 - m; g.add(l); }
    }
    for (var k = 0; k < 3; k++) {
      var b = PI / 2 + (k - 1) * 1.15 + PI, tg = new T.Group(); tg.position.set(Math.cos(b) * 1.1, 0, Math.sin(b) * 1.1); tg.rotation.y = PI / 2 - b; g.add(tg);
      [-0.45, 0.45].forEach(function (x) { tg.add(box(0.46, 2.4, 0.4, st, x, 1.23, 0)); }); tg.add(box(1.5, 0.32, 0.44, st, 0, 2.58, 0));
    }
    g.add(box(0.5, 0.2, 1.0, st, 0.2, 0.16, 0.3));
    return g;
  }
  function maya(o) {
    var g = new T.Group(), st = mat(o.color || '#b9b29a', { roughness: 0.95 }), dk = mat('#9a927a', { roughness: 0.95 });
    for (var i = 0; i < 5; i++) { var w = 4.8 - i * 0.85; g.add(box(w, 0.55, w, i % 2 ? dk : st, 0, 0.275 + i * 0.55, 0)); }
    for (var k = 0; k < 4; k++) {
      var s = new T.Group(); s.rotation.y = k * PI / 2; g.add(s);
      s.add(beam([0, 0.02, 2.75], [0, 2.78, 0.72], 0.85, 0.14, mat('#cfc8b0', { roughness: 0.95 })));
      [-0.47, 0.47].forEach(function (x) { s.add(beam([x, 0.1, 2.75], [x, 2.86, 0.72], 0.1, 0.2, dk)); });
    }
    g.add(box(1.05, 0.75, 1.05, st, 0, 3.125, 0)); g.add(box(1.2, 0.12, 1.2, dk, 0, 3.56, 0));
    g.add(box(0.36, 0.5, 0.05, mat(DARK), 0, 3.0, 0.53));
    return g;
  }

  /* ================================================================ people from history (the figure, dressed) */
  function person(opts, deco) { var g = DM.figure(opts), r = g.userData.rig; if (deco) deco(r, r.k, g); return g; }
  function robe(r, k, c) { r.spine.add(box(0.5 * k, 0.86 * k, 0.3 * k, mat(c), 0, -0.44 * k, 0)); }
  function confucius(o) {
    var c = o.color || '#8a6a4a';
    return person({ height: 1.86, coat: c, skin: '#e0b48a', beard: '#cfcfcf', hair: '#bdbdbd', legs: '#3a2f25' }, function (r, k) {
      robe(r, k, c); r.spine.add(box(0.16 * k, 0.6 * k, 0.03 * k, mat('#e9dfc8'), 0, 0.26 * k, 0.14 * k));
      r.head.add(box(0.13 * k, 0.26 * k, 0.05 * k, mat('#cfcfcf'), 0, -0.02 * k, 0.12 * k));
      r.head.add(cyl(0.05 * k, 0.06 * k, 0.1 * k, mat('#2a211c'), 0, 0.45 * k, -0.02 * k, 10)); r.head.add(box(0.26 * k, 0.02 * k, 0.03 * k, mat('#c9a24a'), 0, 0.46 * k, -0.02 * k));
    });
  }
  function zhenghe(o) {
    var c = o.color || '#1f4f9a';
    return person({ height: 1.84, coat: c, skin: '#e0b48a', hair: '#191514', legs: '#1b1b22' }, function (r, k) {
      robe(r, k, c); r.spine.add(box(0.5 * k, 0.07 * k, 0.31 * k, mat('#d9b25a', { metalness: 0.4 }), 0, 0.06 * k, 0));
      r.spine.add(box(0.2 * k, 0.2 * k, 0.02 * k, mat('#d9b25a', { metalness: 0.4 }), 0, 0.36 * k, 0.14 * k));
      r.head.add(box(0.27 * k, 0.1 * k, 0.27 * k, mat('#15151a'), 0, 0.4 * k, 0)); r.head.add(box(0.2 * k, 0.1 * k, 0.14 * k, mat('#15151a'), 0, 0.48 * k, -0.06 * k));
      r.head.add(box(0.62 * k, 0.025 * k, 0.07 * k, mat('#15151a'), 0, 0.4 * k, -0.13 * k));
    });
  }
  function cleopatra(o) {
    var c = o.color || '#f5f0e0';
    return person({ height: 1.68, coat: c, skin: '#c98f62', hair: '#101014', legs: '#c98f62' }, function (r, k) {
      var gold = mat('#fbbf24', { metalness: 0.7, roughness: 0.25 });
      robe(r, k, c); r.spine.add(box(0.44 * k, 0.07 * k, 0.28 * k, gold, 0, 0.6 * k, 0)); r.spine.add(box(0.47 * k, 0.05 * k, 0.31 * k, mat('#2f6fb0'), 0, 0.04 * k, 0));
      r.head.add(box(0.3 * k, 0.34 * k, 0.1 * k, mat('#101014'), 0, 0.2 * k, -0.13 * k));
      [-1, 1].forEach(function (s) { r.head.add(box(0.05 * k, 0.32 * k, 0.2 * k, mat('#101014'), s * 0.14 * k, 0.18 * k, -0.02 * k)); });
      r.head.add(box(0.28 * k, 0.035 * k, 0.28 * k, gold, 0, 0.345 * k, 0)); r.head.add(cone(0.025 * k, 0.1 * k, gold, 0, 0.4 * k, 0.12 * k, 6));
    });
  }
  function davinci(o) {
    var c = o.color || '#6b4a34';
    return person({ height: 1.8, coat: c, beard: '#e6e6e6', hair: '#e6e6e6', legs: '#2f2a26' }, function (r, k) {
      robe(r, k, c);
      r.head.add(box(0.2 * k, 0.3 * k, 0.06 * k, mat('#e6e6e6'), 0, -0.03 * k, 0.11 * k));
      [-1, 1].forEach(function (s) { r.head.add(box(0.04 * k, 0.3 * k, 0.2 * k, mat('#e6e6e6'), s * 0.14 * k, 0.16 * k, -0.03 * k)); });
      r.head.add(cyl(0.16 * k, 0.17 * k, 0.07 * k, mat('#a3262e'), 0, 0.42 * k, 0, 14));
      var bd = box(0.22 * k, 0.03 * k, 0.3 * k, mat('#e9dfc8'), 0, -0.6 * k, 0.1 * k); r.armL.add(bd);
    });
  }
  function mozart(o) {
    var c = o.color || '#b3202a';
    return person({ height: 1.66, coat: c, tails: true, shirt: '#fffdf5', hair: '#f4f4f4', legs: '#f2efe6' }, function (r, k) {
      var wig = mat('#f4f4f4');
      [-1, 1].forEach(function (s) { r.head.add(sph(0.07 * k, wig, s * 0.14 * k, 0.24 * k, 0)); r.head.add(sph(0.065 * k, wig, s * 0.14 * k, 0.14 * k, -0.02 * k)); });
      r.head.add(box(0.26 * k, 0.1 * k, 0.1 * k, wig, 0, 0.3 * k, -0.13 * k)); r.head.add(cyl(0.035 * k, 0.03 * k, 0.24 * k, wig, 0, 0.12 * k, -0.17 * k, 8));
      r.head.add(box(0.1 * k, 0.04 * k, 0.03 * k, mat('#15151a'), 0, 0.22 * k, -0.19 * k));
      [-1, 1].forEach(function (s) { r.spine.add(box(0.03 * k, 0.4 * k, 0.02 * k, mat('#fbbf24', { metalness: 0.6 }), s * 0.1 * k, 0.3 * k, 0.135 * k)); });
    });
  }
  function curie(o) {
    var c = o.color || '#2b2b33';
    return person({ height: 1.62, coat: c, hair: '#5a4636', legs: '#1d1d22' }, function (r, k) {
      robe(r, k, c); r.spine.add(box(0.2 * k, 0.05 * k, 0.03 * k, mat('#f2efe6'), 0, 0.6 * k, 0.135 * k));
      r.head.add(sph(0.09 * k, mat('#5a4636'), 0, 0.4 * k, -0.08 * k)); r.head.add(box(0.26 * k, 0.2 * k, 0.05 * k, mat('#5a4636'), 0, 0.28 * k, -0.13 * k));
      r.armR.add(cyl(0.03 * k, 0.03 * k, 0.14 * k, new T.MeshStandardMaterial({ color: '#bbf7d0', emissive: '#4ade80', emissiveIntensity: 1.3, transparent: true, opacity: 0.9 }), 0, -0.74 * k, 0.04 * k, 8));
    });
  }
  function einstein(o) {
    var c = o.color || '#7d7d86';
    return person({ height: 1.72, coat: c, hair: '#f0f0f0', legs: '#3b3b44' }, function (r, k) {
      var hr = mat('#f0f0f0');
      [[-0.14, 0.34, 0], [0.14, 0.34, 0], [-0.16, 0.24, -0.06], [0.16, 0.24, -0.06], [0, 0.42, -0.04], [-0.08, 0.42, 0.04], [0.08, 0.42, 0.04], [0, 0.3, -0.15]].forEach(function (p) { r.head.add(sph(0.08 * k, hr, p[0] * k, p[1] * k, p[2] * k)); });
      r.head.add(box(0.13 * k, 0.035 * k, 0.03 * k, mat('#d6d6d6'), 0, 0.175 * k, 0.125 * k));
    });
  }

  /* ================================================================ animals (each with the figure's rig, so they can talk, nod and walk) */
  function quad(p) {
    var g = new T.Group(), M0 = mat(p.col, { roughness: 0.75 }), r = p.r, L = p.L, lh = p.legH, lr = p.legR, len = lh + r * 0.5;
    var hips = new T.Group(); hips.position.y = lh + r; g.add(hips);
    var legL = new T.Group(), legR = new T.Group(); hips.add(legL); hips.add(legR);
    [[-1, 1, legL], [1, 1, legR], [-1, -1, legR], [1, -1, legL]].forEach(function (q) {
      q[2].add(cyl(lr, lr * 0.85, len, M0, q[0] * r * 0.55, -(r * 0.5 + len / 2), q[1] * L * 0.36, 10));
      if (p.hoof) q[2].add(cyl(lr * 0.9, lr, 0.1, mat(p.hoof), q[0] * r * 0.55, -(r + lh) + 0.05, q[1] * L * 0.36, 10));
    });
    var spine = new T.Group(); hips.add(spine);
    var body = cyl(r, r, L, M0, 0, 0, 0, 16); body.rotation.x = PI / 2; spine.add(body);
    [1, -1].forEach(function (s) { var e = sph(r, M0, 0, 0, s * L / 2); e.scale.z = 0.6; spine.add(e); });
    var armL = new T.Group(), armR = new T.Group(); spine.add(armL); spine.add(armR);
    var head = new T.Group(); head.position.set(0, r * 0.35, L / 2 + r * 0.15); spine.add(head);
    var nl = p.neck, nt = p.tilt, nk = cyl(p.neckR * 0.85, p.neckR, nl, M0, 0, Math.cos(nt) * nl / 2, Math.sin(nt) * nl / 2, 12); nk.rotation.x = nt; head.add(nk);
    var hs = p.head, c = [0, Math.cos(nt) * nl + hs[1] * 0.2, Math.sin(nt) * nl + hs[2] * 0.25];
    head.add(box(hs[0], hs[1], hs[2], M0, 0, c[1], c[2]));
    var mouth = box(hs[0] * 0.6, 0.04, hs[2] * 0.3, mat(p.mouth || '#7a2e2e'), 0, c[1] - hs[1] * 0.32, c[2] + hs[2] * 0.37); head.add(mouth);
    [-1, 1].forEach(function (s) { head.add(sph(0.04, mat('#15151a'), s * hs[0] * 0.5, c[1] + hs[1] * 0.18, c[2] + hs[2] * 0.15)); });
    g.userData.rig = { spine: spine, head: head, armL: armL, armR: armR, mouth: mouth, legL: legL, legR: legR, k: 1 };
    return { g: g, spine: spine, head: head, M: M0, c: c, hs: hs, p: p };
  }
  function elephant(o) {
    var e = quad({ col: o.color || '#9aa0a8', r: 0.62, L: 1.5, legH: 0.62, legR: 0.17, neck: 0.25, tilt: 1.2, neckR: 0.36, head: [0.66, 0.66, 0.6] }), c = e.c, M = e.M;
    [-1, 1].forEach(function (s) {
      var ear = sph(0.42, M, s * 0.44, c[1] + 0.05, c[2] - 0.12); ear.scale.set(0.12, 1, 0.85); ear.rotation.y = s * 0.45; e.head.add(ear);
      var tk = cone(0.05, 0.46, mat('#fffbea'), s * 0.2, c[1] - 0.32, c[2] + 0.42, 8); tk.rotation.x = 2.1; e.head.add(tk);
    });
    e.head.add(cyl(0.11, 0.13, 0.5, M, 0, c[1] - 0.4, c[2] + 0.36, 10)); e.head.add(cyl(0.09, 0.11, 0.45, M, 0, c[1] - 0.82, c[2] + 0.38, 10));
    var tip = cyl(0.07, 0.09, 0.3, M, 0, c[1] - 1.1, c[2] + 0.45, 10); tip.rotation.x = -0.7; e.head.add(tip);
    var tail = cyl(0.03, 0.02, 0.6, M, 0, -0.2, -1.12, 6); tail.rotation.x = -0.3; e.spine.add(tail);
    return e.g;
  }
  function camel(o) {
    var e = quad({ col: o.color || '#c9a05c', r: 0.42, L: 1.3, legH: 0.95, legR: 0.075, neck: 0.85, tilt: 0.45, neckR: 0.13, head: [0.26, 0.26, 0.46], hoof: '#6b4a2a' }), c = e.c;
    var hump = sph(0.4, e.M, 0, 0.4, -0.05); hump.scale.set(0.8, 1, 1.05); e.spine.add(hump);
    e.spine.add(box(0.9, 0.04, 0.5, mat('#b3202a'), 0, 0.02, 0.42)); e.spine.add(box(0.9, 0.04, 0.5, mat('#1f4f9a'), 0, 0.02, -0.5));
    [-1, 1].forEach(function (s) { e.head.add(sph(0.05, e.M, s * 0.12, c[1] + 0.15, c[2] - 0.16)); });
    var tail = cyl(0.025, 0.02, 0.5, e.M, 0, -0.1, -0.9, 6); tail.rotation.x = -0.25; e.spine.add(tail);
    return e.g;
  }
  function lion(o) {
    var e = quad({ col: o.color || '#d9a441', r: 0.38, L: 1.15, legH: 0.5, legR: 0.09, neck: 0.18, tilt: 1.0, neckR: 0.26, head: [0.42, 0.4, 0.38] }), c = e.c;
    var mane = sph(0.42, mat('#8a5a22', { roughness: 0.95 }), 0, c[1], c[2] - 0.15); mane.scale.set(1.08, 1.12, 0.7); e.head.add(mane);
    [-1, 1].forEach(function (s) { e.head.add(sph(0.07, e.M, s * 0.17, c[1] + 0.24, c[2] - 0.02)); });
    e.head.add(box(0.12, 0.08, 0.06, mat('#3a2a20'), 0, c[1] - 0.02, c[2] + 0.2));
    var tail = cyl(0.03, 0.025, 0.8, e.M, 0, 0.05, -0.95, 6); tail.rotation.x = -0.9; e.spine.add(tail); e.spine.add(sph(0.08, mat('#8a5a22'), 0, 0.3, -1.27));
    return e.g;
  }
  function giraffe(o) {
    var e = quad({ col: o.color || '#e8b84a', r: 0.36, L: 1.05, legH: 1.45, legR: 0.07, neck: 1.7, tilt: 0.3, neckR: 0.14, head: [0.22, 0.24, 0.46], hoof: '#5a3a1c' }), c = e.c, sp = mat('#9a5b1c');
    [-1, 1].forEach(function (s) {
      e.head.add(cyl(0.022, 0.022, 0.16, e.M, s * 0.06, c[1] + 0.2, c[2] - 0.12, 6)); e.head.add(sph(0.035, sp, s * 0.06, c[1] + 0.29, c[2] - 0.12));
      e.head.add(sph(0.05, e.M, s * 0.15, c[1] + 0.1, c[2] - 0.16));
      [[0.1, 0.3], [-0.12, 0.05], [0.14, -0.2], [-0.1, -0.42], [0.02, 0.5]].forEach(function (q) { var d = sph(0.1, sp, s * 0.345, q[0], q[1]); d.scale.x = 0.25; e.spine.add(d); });
    });
    for (var i = 0; i < 5; i++) { var t = 0.25 + i * 0.3, d2 = sph(0.07, sp, 0, Math.cos(0.3) * t - 0.02, Math.sin(0.3) * t - 0.13); d2.scale.z = 0.3; e.head.add(d2); }
    var tail = cyl(0.02, 0.02, 0.7, e.M, 0, -0.25, -0.75, 6); tail.rotation.x = -0.15; e.spine.add(tail); e.spine.add(sph(0.05, sp, 0, -0.6, -0.8));
    return e.g;
  }
  function panda(o) {
    var g = new T.Group(), wh = mat(o.color || '#fafafa', { roughness: 0.9 }), bk = mat('#1b1b1f', { roughness: 0.9 });
    var hips = new T.Group(); hips.position.y = 0.5; g.add(hips);
    var legG = [-1, 1].map(function (s) { var lg = new T.Group(); lg.position.x = s * 0.2; hips.add(lg); lg.add(box(0.26, 0.5, 0.3, bk, 0, -0.25, 0.02)); return lg; });
    var spine = new T.Group(); hips.add(spine);
    var torso = sph(0.5, wh, 0, 0.3, 0); torso.scale.set(1, 1.05, 0.9); spine.add(torso);
    var band = sph(0.5, bk, 0, 0.52, 0); band.scale.set(1.03, 0.42, 0.93); spine.add(band);
    function arm(s) { var a = new T.Group(); a.position.set(s * 0.46, 0.58, 0.05); spine.add(a); a.add(cyl(0.11, 0.1, 0.5, bk, 0, -0.22, 0.05, 10)); return a; }
    var armL = arm(-1), armR = arm(1);
    var head = new T.Group(); head.position.set(0, 0.9, 0.05); spine.add(head);
    head.add(sph(0.36, wh, 0, 0.25, 0));
    [-1, 1].forEach(function (s) {
      head.add(sph(0.12, bk, s * 0.26, 0.52, -0.02));
      var pt = sph(0.09, bk, s * 0.14, 0.28, 0.3); pt.scale.set(1, 1.3, 0.5); head.add(pt);
      head.add(sph(0.03, mat('#ffffff'), s * 0.14, 0.29, 0.345));
    });
    head.add(sph(0.045, bk, 0, 0.2, 0.35));
    var mouth = box(0.12, 0.025, 0.02, mat('#3a3a3a'), 0, 0.12, 0.33); head.add(mouth);
    var bamboo = cyl(0.03, 0.03, 0.7, mat('#4ade80'), 0, -0.4, 0.14, 8); bamboo.rotation.z = 0.5; armR.add(bamboo);
    g.userData.rig = { spine: spine, head: head, armL: armL, armR: armR, mouth: mouth, legL: legG[0], legR: legG[1], k: 1 };
    return g;
  }
  function penguin(o) {
    var g = new T.Group(), bk = mat(o.color || '#1f2937', { roughness: 0.7 }), wh = mat('#fafafa'), or = mat('#f59e0b');
    var hips = new T.Group(); hips.position.y = 0.22; g.add(hips);
    var legG = [-1, 1].map(function (s) { var lg = new T.Group(); lg.position.x = s * 0.13; hips.add(lg); lg.add(box(0.16, 0.06, 0.28, or, 0, -0.19, 0.08)); return lg; });
    var spine = new T.Group(); hips.add(spine);
    var body = sph(0.36, bk, 0, 0.38, 0); body.scale.set(1, 1.45, 0.95); spine.add(body);
    var belly = sph(0.3, wh, 0, 0.36, 0.1); belly.scale.set(0.9, 1.4, 0.8); spine.add(belly);
    function flip(s) { var a = new T.Group(); a.position.set(s * 0.36, 0.62, 0); spine.add(a); a.add(box(0.06, 0.5, 0.2, bk, 0, -0.25, 0)); return a; }
    var armL = flip(-1), armR = flip(1);
    var head = new T.Group(); head.position.set(0, 0.86, 0); spine.add(head);
    head.add(sph(0.24, bk, 0, 0.18, 0));
    [-1, 1].forEach(function (s) { var ck = sph(0.1, mat('#fde68a'), s * 0.13, 0.17, 0.14); ck.scale.set(0.6, 1, 0.6); head.add(ck); head.add(sph(0.025, wh, s * 0.09, 0.24, 0.2)); });
    var beak = cone(0.06, 0.2, or, 0, 0.15, 0.28, 8); beak.rotation.x = PI / 2; head.add(beak);
    var mouth = box(0.07, 0.015, 0.1, mat('#c2410c'), 0, 0.11, 0.26); head.add(mouth);
    g.userData.rig = { spine: spine, head: head, armL: armL, armR: armR, mouth: mouth, legL: legG[0], legR: legG[1], k: 1 };
    return g;
  }

  /* ================================================================ ways to travel */
  function junk(o) {
    var g = new T.Group(), wood = mat('#6b4226', { roughness: 0.85 }), deck = mat('#a8794a'), sailM = new T.MeshStandardMaterial({ color: o.color || '#b3402a', roughness: 0.9, side: T.DoubleSide }), batten = mat('#3f2716');
    g.add(box(1.6, 0.75, 4.6, wood, 0, 0.5, 0)); g.add(box(1.5, 0.06, 4.5, deck, 0, 0.9, 0));
    var bow = box(1.3, 0.75, 1.1, wood, 0, 0.72, 2.6); bow.rotation.x = -0.4; g.add(bow);
    g.add(box(1.7, 0.9, 1.3, wood, 0, 1.3, -1.9)); g.add(box(1.8, 0.08, 1.4, deck, 0, 1.78, -1.9));
    [-0.6, 0.6].forEach(function (x) { g.add(box(0.36, 0.4, 0.05, mat('#fbbf24', { emissive: '#f59e0b', emissiveIntensity: 0.5 }), x * 0.6, 1.35, -1.24)); });
    [[1.5, 3.2, 1.5], [0, 4.4, 2.0], [-1.6, 3.4, 1.4]].forEach(function (m) {
      g.add(cyl(0.06, 0.08, m[1], wood, 0, 0.9 + m[1] / 2, m[0], 8));
      var sh = m[1] - 1.0, sl = mesh(new T.PlaneGeometry(m[2], sh), sailM, 0.05, 1.5 + sh / 2, m[0] + 0.1); sl.rotation.y = 0.25; g.add(sl);
      for (var i = 0; i <= 5; i++) { var b = box(m[2] + 0.06, 0.035, 0.04, batten, 0.05, 1.5 + sh * i / 5, m[0] + 0.1); b.rotation.y = 0.25; g.add(b); }
    });
    g.add(box(0.5, 0.36, 0.02, mat('#fde047'), 0, 5.5, 0.3));
    return g;
  }
  function train(o) {
    var g = new T.Group(), col = o.color || '#b3202a', blk = mat('#1f2430', { metalness: 0.4, roughness: 0.45 }), steel = mat('#9aa3ad', { metalness: 0.6, roughness: 0.4 }), gold = mat('#fbbf24', { metalness: 0.7, roughness: 0.25 });
    [-0.45, 0.45].forEach(function (x) { g.add(box(0.06, 0.06, 4.8, steel, x, 0.07, 0)); });
    for (var i = 0; i < 9; i++) g.add(box(1.3, 0.04, 0.18, mat('#5a4030'), 0, 0.02, -2.2 + i * 0.55));
    g.add(box(0.9, 0.2, 3.7, blk, 0, 0.6, 0));
    var boiler = cyl(0.48, 0.48, 2.2, blk, 0, 1.1, 0.5, 18); boiler.rotation.x = PI / 2; g.add(boiler);
    var front = cyl(0.5, 0.5, 0.14, mat('#2f3644'), 0, 1.1, 1.66, 18); front.rotation.x = PI / 2; g.add(front);
    g.add(sph(0.1, mat('#fef08a', { emissive: '#fde047', emissiveIntensity: 1.2 }), 0, 1.1, 1.76));
    g.add(cyl(0.15, 0.11, 0.55, blk, 0, 1.8, 1.25, 12)); g.add(cyl(0.19, 0.17, 0.08, gold, 0, 2.08, 1.25, 12));
    g.add(cyl(0.16, 0.18, 0.3, gold, 0, 1.68, 0.4, 12)); g.add(sph(0.16, gold, 0, 1.83, 0.4));
    g.add(box(1.15, 1.3, 1.0, mat(col), 0, 1.35, -1.1)); g.add(box(1.3, 0.08, 1.25, blk, 0, 2.04, -1.1));
    [-0.58, 0.58].forEach(function (x) { g.add(box(0.03, 0.42, 0.5, mat('#bfe3f5', { emissive: '#7dd3fc', emissiveIntensity: 0.25 }), x, 1.6, -1.1)); });
    var cc = cone(0.4, 0.6, mat(col), 0, 0.44, 2.05, 4); cc.rotation.x = PI / 2; cc.rotation.y = PI / 4; g.add(cc);
    var spins = [];
    [[-1.1, 0.38], [0, 0.38], [1.0, 0.38], [1.6, 0.24]].forEach(function (w) {
      [-0.53, 0.53].forEach(function (x) {
        var wg = new T.Group(); wg.position.set(x, w[1] + 0.1, w[0]); g.add(wg);
        var d = cyl(w[1], w[1], 0.1, mat('#7a1d24'), 0, 0, 0, 18); d.rotation.z = PI / 2; wg.add(d);
        wg.add(box(0.12, w[1] * 1.7, 0.07, gold)); wg.add(box(0.12, 0.07, w[1] * 1.7, gold));
        spins.push([wg, 'x', 3]);
      });
    });
    g.userData.rig = { prop: 'motion', spins: spins, idle: 0 };
    return g;
  }
  function balloon(o) {
    var g = new T.Group(), col = o.color || '#ef4444', fl = new T.Group(); fl.position.y = 0.5; g.add(fl);
    var tex = canvasTex(256, 32, function (c, w, h) { for (var i = 0; i < 8; i++) { c.fillStyle = i % 2 ? '#fde68a' : col; c.fillRect(i * w / 8, 0, w / 8 + 1, h); } });
    var em = new T.MeshStandardMaterial({ map: tex, roughness: 0.6 });
    var env = mesh(new T.SphereGeometry(1.5, 24, 18), em, 0, 4.0, 0); env.scale.y = 1.12; fl.add(env);
    fl.add(mesh(new T.CylinderGeometry(1.08, 0.42, 1.1, 24, 1, true), new T.MeshStandardMaterial({ map: tex, roughness: 0.6, side: T.DoubleSide }), 0, 2.4, 0));
    fl.add(box(0.7, 0.55, 0.7, mat('#8a5a35', { roughness: 0.95 }), 0, 0.9, 0)); fl.add(box(0.76, 0.06, 0.76, mat('#5a3a20'), 0, 1.18, 0));
    [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(function (s) { fl.add(beam([s[0] * 0.33, 1.18, s[1] * 0.33], [s[0] * 0.4, 1.88, s[1] * 0.4], 0.02, 0.02, mat('#3f2716'))); });
    fl.add(sph(0.14, mat('#fde047', { emissive: '#f97316', emissiveIntensity: 1.5 }), 0, 1.72, 0));
    g.userData.rig = { prop: 'motion', spins: [[fl, 'y', 0.12]], bob: { obj: fl, base: 0.5, amp: 0.22, speed: 1.1, lift: 2.4 } };
    return g;
  }
  function biplane(o) {
    var g = new T.Group(), col = o.color || '#d97706', bodyM = mat(col, { roughness: 0.6 }), wingM = mat('#f5e9c8', { roughness: 0.85 }), dk = mat('#1f2430'), wood = mat('#8a5a35');
    var fus = cyl(0.3, 0.14, 3.0, bodyM, 0, 0.95, 0, 14); fus.rotation.x = PI / 2; g.add(fus);
    var cowl = cyl(0.32, 0.32, 0.25, mat('#9aa3ad', { metalness: 0.6, roughness: 0.4 }), 0, 0.95, 1.55, 14); cowl.rotation.x = PI / 2; g.add(cowl);
    var prop = new T.Group(); prop.position.set(0, 0.95, 1.74); g.add(prop); prop.add(sph(0.08, dk)); prop.add(box(1.5, 0.12, 0.03, wood));
    g.add(box(4.2, 0.06, 0.75, wingM, 0, 0.75, 0.5)); g.add(box(4.4, 0.06, 0.8, wingM, 0, 1.65, 0.6));
    [-1.4, 1.4].forEach(function (x) { [0.3, 0.8].forEach(function (z) { g.add(cyl(0.025, 0.025, 0.9, wood, x, 1.2, z, 6)); }); });
    g.add(box(0.36, 0.16, 0.5, dk, 0, 1.2, 0.1));
    g.add(box(1.3, 0.05, 0.45, wingM, 0, 1.0, -1.4)); g.add(box(0.05, 0.55, 0.5, bodyM, 0, 1.25, -1.4));
    [-0.5, 0.5].forEach(function (x) { var w = cyl(0.22, 0.22, 0.08, dk, x, 0.22, 0.9, 14); w.rotation.z = PI / 2; g.add(w); g.add(beam([x, 0.25, 0.9], [x * 0.4, 0.8, 0.8], 0.04, 0.04, wood)); });
    g.add(beam([0, 0.06, -1.5], [0, 0.85, -1.2], 0.04, 0.04, wood));
    g.userData.rig = { prop: 'motion', spins: [[prop, 'z', 12]], idle: 0.35 };
    return g;
  }
  function globe(o) {
    var g = new T.Group(), wood = mat('#6b4226'), gold = mat('#fbbf24', { metalness: 0.7, roughness: 0.25 });
    g.add(cyl(0.5, 0.6, 0.1, wood, 0, 0.05, 0, 20)); g.add(cyl(0.05, 0.07, 0.55, gold, 0, 0.36, 0, 10));
    var tilt = new T.Group(); tilt.position.y = 1.5; tilt.rotation.z = 0.41; g.add(tilt);
    var tex = canvasTex(512, 256, function (c, w, h) {
      c.fillStyle = o.color || '#2f7fd0'; c.fillRect(0, 0, w, h); c.fillStyle = '#5fae5a';
      [[110, 80, 50, 34], [135, 160, 28, 48], [265, 70, 34, 26], [280, 140, 34, 50], [360, 80, 70, 40], [395, 122, 22, 18], [430, 175, 28, 18], [60, 60, 26, 14]].forEach(function (e) { c.beginPath(); c.ellipse(e[0], e[1], e[2], e[3], 0, 0, 7); c.fill(); });
      c.fillStyle = '#f8fafc'; c.fillRect(0, 0, w, 12); c.fillRect(0, h - 16, w, 16);
    });
    var ball = mesh(new T.SphereGeometry(0.85, 28, 20), new T.MeshStandardMaterial({ map: tex, roughness: 0.55 })); tilt.add(ball);
    var arc = mesh(new T.TorusGeometry(0.95, 0.03, 8, 32, PI), gold); arc.rotation.z = -PI / 2; tilt.add(arc);
    tilt.add(cyl(0.02, 0.02, 2.0, gold, 0, 0, 0, 6));
    g.userData.rig = { prop: 'motion', spins: [[ball, 'y', 0.5]] };
    return g;
  }

  /* ================================================================ the shelf entries and their knowledge cards
   * fact = { where, text, q: [question, [three answers], index of the right one] }; say = what a character answers when tapped */
  function F(where, text, q) { return { where: where, text: text, q: q }; }
  var ADD = {
    pyramid: { name: '金字塔', icon: '🔺', cat: 'set', kidCat: 'landmark', color: '#d9b97a', build: pyramid,
      fact: F('非洲 · 埃及', '胡夫金字塔大约 4500 年前建成，用了大约 230 万块大石头，原来有 146 米高。它是古埃及法老的陵墓。', ['金字塔在哪个国家？', ['埃及', '希腊', '印度'], 0]) },
    sphinx: { name: '狮身人面像', icon: '🏺', cat: 'set', kidCat: 'landmark', color: '#cfae74', build: sphinx,
      fact: F('非洲 · 埃及', '狮身人面像有狮子的身体和人的头，守在吉萨金字塔旁边，长约 73 米，是用一整块巨大的岩石雕出来的。', ['狮身人面像的身体像哪种动物？', ['狮子', '骆驼', '大象'], 0]) },
    greatwall: { name: '长城烽火台', icon: '🐉', cat: 'set', kidCat: 'landmark', color: '#b8ab95', build: greatwall,
      fact: F('亚洲 · 中国', '长城是中国古代保卫家园的城墙，光是明朝修的就有 8800 多公里。发现敌人时，士兵在烽火台上点燃烟火，一座一座把消息传下去。', ['烽火台用什么传递消息？', ['烟和火', '敲大钟', '放风筝'], 0]) },
    pagoda: { name: '中国宝塔', icon: '🏯', cat: 'set', kidCat: 'landmark', color: '#b23a2e', build: pagoda,
      fact: F('亚洲 · 中国', '山西的应县木塔建于 1056 年，高约 67 米，是世界上现存最高的古代木塔之一。木头和木头靠「榫卯」像积木一样扣在一起。', ['木塔的木头主要靠什么连接？', ['榫卯', '胶水', '绳子'], 0]) },
    eiffel: { name: '埃菲尔铁塔', icon: '🗼', cat: 'set', kidCat: 'landmark', color: '#7a6552', build: eiffel,
      fact: F('欧洲 · 法国', '埃菲尔铁塔 1889 年为巴黎世界博览会建成，高约 330 米，由大约 18000 个铁件拼成。它以工程师古斯塔夫·埃菲尔的名字命名。', ['埃菲尔铁塔在哪座城市？', ['巴黎', '伦敦', '罗马'], 0]) },
    bigben: { name: '大本钟', icon: '🔔', cat: 'set', kidCat: 'landmark', color: '#c9b27a', build: bigben,
      fact: F('欧洲 · 英国', '「大本钟」其实是钟楼里那口大钟的名字，钟楼叫伊丽莎白塔，在伦敦。它从 1859 年开始为大家报时。', ['「大本钟」原本是什么的名字？', ['钟楼里的大钟', '一座桥', '一位国王'], 0]) },
    colosseum: { name: '罗马斗兽场', icon: '🏟️', cat: 'set', kidCat: 'landmark', color: '#d8c9a8', build: colosseum,
      fact: F('欧洲 · 意大利', '罗马斗兽场大约在公元 80 年建成，能坐下约 5 万名观众，是古罗马最大的圆形剧场，已经快 2000 岁了。', ['斗兽场在哪座城市？', ['罗马', '雅典', '巴黎'], 0]) },
    parthenon: { name: '帕特农神庙', icon: '🏛️', cat: 'set', kidCat: 'landmark', color: '#efe7d6', build: parthenon,
      fact: F('欧洲 · 希腊', '帕特农神庙在雅典卫城的山顶上，两千四百多年前用大理石建成，是献给智慧女神雅典娜的。', ['帕特农神庙是献给谁的？', ['雅典娜', '宙斯', '法老'], 0]) },
    tajmahal: { name: '泰姬陵', icon: '🕌', cat: 'set', kidCat: 'landmark', color: '#f7f3ea', build: tajmahal,
      fact: F('亚洲 · 印度', '泰姬陵在印度的阿格拉，是皇帝沙贾汗为了纪念妻子而建的，用白色大理石造了二十多年，大约在 1653 年完工。', ['泰姬陵主要用什么石头建成？', ['白色大理石', '红砖', '木头'], 0]) },
    torii: { name: '鸟居', icon: '⛩️', cat: 'set', kidCat: 'landmark', color: '#d8372b', build: torii,
      fact: F('亚洲 · 日本', '鸟居是日本神社入口的大门。走过鸟居，表示从平常的世界走进了一个安静、神圣的地方。', ['鸟居通常立在哪里？', ['神社的入口', '火车站', '海底'], 0]) },
    liberty: { name: '自由女神像', icon: '🗽', cat: 'set', kidCat: 'landmark', color: '#5fa893', build: liberty,
      fact: F('北美洲 · 美国', '自由女神像是法国送给美国的礼物，1886 年在纽约港落成。她是铜做的，原来是铜的颜色，风吹雨打后慢慢变成了绿色。', ['自由女神像是哪个国家送的礼物？', ['法国', '英国', '中国'], 0]) },
    moai: { name: '复活节岛石像', icon: '🗿', cat: 'set', kidCat: 'landmark', color: '#6f6a63', build: moai,
      fact: F('大洋洲 · 复活节岛（智利）', '太平洋上的复活节岛有大约 900 座巨大的石像，叫「摩艾」。它们是岛上的人几百年前用火山岩雕成的。', ['摩艾石像在哪里？', ['复活节岛', '北极', '撒哈拉沙漠'], 0]) },
    igloo: { name: '冰屋', icon: '🧊', cat: 'set', kidCat: 'landmark', color: '#eef6fb', build: igloo,
      fact: F('北极地区', '冰屋是住在北极地区的因纽特人用雪砖砌成的小屋。雪里藏着很多空气，能挡住寒风，所以屋里比外面暖和得多。', ['冰屋是用什么砌成的？', ['雪砖', '石头', '木板'], 0]) },
    stonehenge: { name: '巨石阵', icon: '🪨', cat: 'set', kidCat: 'landmark', color: '#8b8d8a', build: stonehenge,
      fact: F('欧洲 · 英国', '巨石阵是四五千年前的人用巨大的石头围成的圆圈。每年夏至那天，太阳正好从石头之间的方向升起。', ['巨石阵和一年中的哪一天有关？', ['夏至', '春节', '儿童节'], 0]) },
    maya: { name: '玛雅金字塔', icon: '🛕', cat: 'set', kidCat: 'landmark', color: '#b9b29a', build: maya,
      fact: F('北美洲 · 墨西哥', '奇琴伊察的玛雅金字塔四面各有 91 级台阶，加上塔顶的平台一共 365 级，正好是一年的天数。玛雅人很会观察星星和计算日历。', ['玛雅金字塔的 365 级台阶代表什么？', ['一年的天数', '国王的年龄', '星星的数量'], 0]) },

    confucius: { name: '孔子', icon: '🧔', cat: 'character', kidCat: 'people', color: '#8a6a4a', build: confucius, say: '三人行，必有我师焉。每个人身上，都有值得我们学习的地方。',
      fact: F('中国 · 约 2500 年前', '孔子（公元前 551—前 479 年）是中国古代的思想家和教育家。他教过很多学生，他说的话被学生们记在《论语》里。', ['记录孔子和学生说话的书叫什么？', ['《论语》', '《西游记》', '《安徒生童话》'], 0]) },
    zhenghe: { name: '郑和', icon: '⚓', cat: 'character', kidCat: 'people', color: '#1f4f9a', build: zhenghe, say: '我是郑和。我带着大船队七次下西洋，最远到了非洲的东海岸。',
      fact: F('中国 · 明朝', '从 1405 年开始，郑和带领庞大的船队七次远航，到过东南亚、印度、阿拉伯和东非，带去了丝绸和瓷器，也带回了长颈鹿。', ['郑和一共下了几次西洋？', ['七次', '两次', '二十次'], 0]) },
    cleopatra: { name: '埃及女王', icon: '👸', cat: 'character', kidCat: 'people', color: '#f5f0e0', build: cleopatra, say: '我是克利奥帕特拉，古埃及的女王。尼罗河的水，养育了我的国家。',
      fact: F('埃及 · 约 2000 年前', '克利奥帕特拉七世是古埃及最后一位女王。她很爱学习，据说会说好几种语言。', ['克利奥帕特拉是哪个古国的女王？', ['古埃及', '古罗马', '古印度'], 0]) },
    davinci: { name: '达·芬奇', icon: '🎨', cat: 'character', kidCat: 'people', color: '#6b4a34', build: davinci, say: '我是达·芬奇。我喜欢画画，也喜欢观察小鸟，想象人怎样才能飞起来。',
      fact: F('意大利 · 文艺复兴', '列奥纳多·达·芬奇（1452—1519）画了《蒙娜丽莎》。他还是发明家，在笔记本里画过飞行器和各种机器的设计图。', ['《蒙娜丽莎》是谁画的？', ['达·芬奇', '莫扎特', '爱因斯坦'], 0]) },
    mozart: { name: '莫扎特', icon: '🎼', cat: 'character', kidCat: 'people', color: '#b3202a', build: mozart, say: '我是莫扎特！我五岁就开始写曲子了，音乐是我最好的朋友。',
      fact: F('奥地利 · 约 250 年前', '莫扎特（1756—1791）是奥地利作曲家。他 5 岁开始作曲，一生写了 600 多首乐曲。', ['莫扎特几岁开始作曲？', ['5 岁', '15 岁', '50 岁'], 0]) },
    curie: { name: '居里夫人', icon: '⚗️', cat: 'character', kidCat: 'people', color: '#2b2b33', build: curie, say: '我是玛丽·居里。生活中没有什么可怕的东西，只有需要去理解的东西。',
      fact: F('波兰 / 法国 · 约 100 年前', '玛丽·居里发现了「钋」和「镭」两种元素。她是第一位获得诺贝尔奖的女性，还得了两次：物理学奖和化学奖。', ['居里夫人获得过几次诺贝尔奖？', ['两次', '一次', '没有'], 0]) },
    einstein: { name: '爱因斯坦', icon: '🧠', cat: 'character', kidCat: 'people', color: '#7d7d86', build: einstein, say: '我是爱因斯坦。想象力比知识更重要！要一直保持好奇心哦。',
      fact: F('德国 / 美国 · 约 100 年前', '爱因斯坦（1879—1955）是物理学家，提出了相对论，告诉我们时间和空间是连在一起的。他在 1921 年获得诺贝尔物理学奖。', ['爱因斯坦提出了什么理论？', ['相对论', '进化论', '万有引力'], 0]) },

    panda: { name: '大熊猫', icon: '🐼', cat: 'character', kidCat: 'animal', color: '#fafafa', build: panda, say: '嗯嗯～我是大熊猫，我每天要花十几个小时吃竹子呢！',
      fact: F('亚洲 · 中国', '野生大熊猫只生活在中国。它们几乎只吃竹子，一天要吃十几公斤，所以大部分时间都在吃。', ['大熊猫最爱吃什么？', ['竹子', '香蕉', '小鱼'], 0]) },
    elephant: { name: '大象', icon: '🐘', cat: 'character', kidCat: 'animal', color: '#9aa0a8', build: elephant, say: '呜——我是大象，我的长鼻子能喝水、摘树叶，还能和朋友打招呼。',
      fact: F('非洲和亚洲', '非洲象是陆地上最大的动物。大象的鼻子里没有骨头，全是肌肉，既能卷起大树干，也能捡起一粒花生。', ['陆地上最大的动物是什么？', ['非洲象', '长颈鹿', '狮子'], 0]) },
    camel: { name: '骆驼', icon: '🐫', cat: 'character', kidCat: 'animal', color: '#c9a05c', build: camel, say: '我是骆驼，人们叫我「沙漠之舟」。猜猜我的驼峰里装的是什么？',
      fact: F('非洲和亚洲的沙漠', '骆驼的驼峰里装的不是水，是脂肪！找不到食物的时候，它就靠驼峰里的脂肪补充能量。', ['骆驼的驼峰里装的是什么？', ['脂肪', '水', '沙子'], 0]) },
    lion: { name: '狮子', icon: '🦁', cat: 'character', kidCat: 'animal', color: '#d9a441', build: lion, say: '吼——我是狮子！我和家人住在一起，我们的大家庭叫「狮群」。',
      fact: F('非洲草原', '狮子是唯一成群生活的大猫，一个大家庭叫「狮群」。雄狮的吼声很响，几公里外都听得见。', ['狮子的大家庭叫什么？', ['狮群', '狮班', '狮队'], 0]) },
    giraffe: { name: '长颈鹿', icon: '🦒', cat: 'character', kidCat: 'animal', color: '#e8b84a', build: giraffe, say: '你好呀，下面的小朋友！我是长颈鹿，我能吃到最高的树叶。',
      fact: F('非洲草原', '长颈鹿是最高的陆地动物，能长到 5 米多高。它的脖子那么长，却和人一样只有 7 块颈椎骨。', ['长颈鹿的脖子有几块颈椎骨？', ['7 块', '70 块', '700 块'], 0]) },
    penguin: { name: '企鹅', icon: '🐧', cat: 'character', kidCat: 'animal', color: '#1f2937', build: penguin, say: '嘎嘎～我是企鹅！我不会飞，可是我在水里游得像飞一样快。',
      fact: F('南半球 · 南极', '企鹅是不会飞的鸟，却是游泳高手。帝企鹅住在南极，冬天由企鹅爸爸把蛋放在脚背上孵。', ['帝企鹅的蛋由谁来孵？', ['企鹅爸爸', '企鹅奶奶', '海豹'], 0]) },

    junk: { name: '郑和宝船', icon: '⛵', cat: 'set', kidCat: 'vehicle', color: '#b3402a', build: junk,
      fact: F('亚洲 · 中国', '中国古代的大帆船用竹条撑开船帆，船舱被隔成一个个不透水的小舱，一个舱进水了船也不会沉。郑和下西洋坐的就是这样的大船。', ['船舱隔成很多小舱有什么好处？', ['一处进水也不容易沉', '跑得更快', '更好看'], 0]) },
    train: { name: '蒸汽火车', icon: '🚂', cat: 'animated', kidCat: 'vehicle', color: '#b3202a', build: train, acts: ['spin'],
      fact: F('欧洲 · 英国', '1804 年，英国人特里维西克造出了第一台在铁轨上跑的蒸汽机车。烧开的水变成蒸汽，蒸汽推动活塞，车轮就转起来了。', ['蒸汽火车靠什么推动车轮？', ['蒸汽', '风', '电池'], 0]) },
    balloon: { name: '热气球', icon: '🎈', cat: 'animated', kidCat: 'vehicle', color: '#ef4444', build: balloon, acts: ['spin'],
      fact: F('欧洲 · 法国', '1783 年，法国蒙哥尔费兄弟做的热气球第一次带着人飞上了天。热空气比冷空气轻，所以气球会往上飘。', ['热气球为什么能飞起来？', ['热空气比冷空气轻', '它有翅膀', '有人在下面推'], 0]) },
    biplane: { name: '双翼飞机', icon: '🛩️', cat: 'animated', kidCat: 'vehicle', color: '#d97706', build: biplane, acts: ['spin'],
      fact: F('北美洲 · 美国', '1903 年，莱特兄弟的「飞行者一号」第一次靠发动机飞了起来。第一次飞行只有 12 秒，却开启了人类飞行的时代。', ['第一架成功飞行的动力飞机是谁造的？', ['莱特兄弟', '蒙哥尔费兄弟', '格林兄弟'], 0]) },
    globe: { name: '地球仪', icon: '🌍', cat: 'animated', kidCat: 'vehicle', color: '#2f7fd0', build: globe, acts: ['spin'],
      fact: F('我们的地球', '地球表面大约 71% 是海洋，所以从太空看是一颗蓝色的星球。地球自己转一圈大约 24 小时，这就是一天。', ['地球自转一圈大约要多久？', ['24 小时', '一个月', '一年'], 0]) }
  };
  Object.keys(ADD).forEach(function (k) { KINDS[k] = ADD[k]; });

  /* knowledge cards for things that were already on the shelf */
  var MORE = {
    lincoln: [F('北美洲 · 美国', '亚伯拉罕·林肯是美国第 16 任总统。1863 年他在葛底斯堡发表演说，只讲了两分多钟，却成了历史上最有名的演讲之一。', ['林肯是美国第几任总统？', ['第 16 任', '第 1 任', '第 50 任'], 0]), null],
    windmill: [F('欧洲 · 荷兰', '风车用风的力量工作。荷兰人用风车把低洼地里的水抽出去，也用它磨面粉、锯木头。', ['风车靠什么力量转动？', ['风', '电', '蒸汽'], 0]), null],
    rocket: [F('太空探索', '1969 年，「土星五号」火箭把阿波罗 11 号送上月球，阿姆斯特朗成为第一个踏上月球的人。', ['第一个踏上月球的人是谁？', ['阿姆斯特朗', '爱因斯坦', '林肯'], 0]), null],
    astronaut: [F('太空探索', '1961 年，苏联宇航员加加林乘坐「东方一号」飞船绕地球一圈，成为第一个进入太空的人。', ['第一个进入太空的人是谁？', ['加加林', '莱特兄弟', '郑和'], 0]), null],
    dino: [F('史前时代', '恐龙在地球上生活了一亿六千多万年。大约 6600 万年前，大部分恐龙灭绝了，而今天的鸟类是恐龙的后代。', ['今天哪种动物是恐龙的后代？', ['鸟类', '大象', '鲸鱼'], 0]), null],
    bridge: [F('亚洲 · 中国', '河北的赵州桥建于隋朝，已经 1400 多岁了，是世界上现存最古老的敞肩石拱桥。拱形能把重量分散到两岸。', ['赵州桥大约有多少岁了？', ['1400 多岁', '100 岁', '14 岁'], 0]), null]
  };
  Object.keys(MORE).forEach(function (k) { if (KINDS[k]) KINDS[k].fact = MORE[k][0]; });

  /* the new shelf entries bring their own action lists */
  var acts0 = DM.actions;
  DM.actions = function (kind) { var K = KINDS[kind]; return K && K.acts ? K.acts : acts0(kind); };

  /* ================================================================ scene kits: [kind, dx, dz, ry, scale, name] around a centre */
  root.DWKits = { list: [
    { id: 'egypt', icon: '🔺', name: '古埃及一角', note: '金字塔、狮身人面像、女王和骆驼', items: [['pyramid', 0, -2.6], ['sphinx', 3.4, 0.4, -0.5], ['cleopatra', -1.4, 1.6], ['camel', -3.6, 0.6, 0.7], ['sign', 1.2, 2.6, 0, 1, '古埃及']] },
    { id: 'china', icon: '🐉', name: '古代中国一角', note: '长城、宝塔、孔子和大熊猫', items: [['greatwall', 0, -3], ['pagoda', 4.2, 0.4, -0.4], ['confucius', -1.2, 0.6], ['panda', 1.2, 1.2], ['lantern', -3.2, 1.6], ['lantern', 2.8, 2.6]] },
    { id: 'voyage', icon: '⚓', name: '海上丝绸之路', note: '郑和、宝船、地球仪和灯笼', items: [['junk', 0, -2.4, 0.5], ['zhenghe', -2.4, 0.8, 0.3], ['globe', 2.2, 1.0], ['giraffe', 4.0, -0.6, -0.6], ['lantern', -3.6, 2.2]] },
    { id: 'europe', icon: '🗼', name: '欧洲名城', note: '铁塔、大本钟、莫扎特和热气球', items: [['eiffel', -1.2, -2.6], ['bigben', 3.2, -2.2], ['mozart', 0.6, 1.2], ['balloon', -4.6, 0.2], ['lamp', -1.6, 2.4], ['lamp', 2.6, 2.4]] },
    { id: 'classic', icon: '🏛️', name: '希腊与罗马', note: '神庙、斗兽场和达·芬奇', items: [['parthenon', -3.2, -2.6], ['colosseum', 3.8, -2.2], ['davinci', 0.2, 1.4], ['column', -1.6, 2.2], ['column', 2.0, 2.2]] },
    { id: 'savanna', icon: '🦁', name: '非洲大草原', note: '狮子、大象、长颈鹿和大树', items: [['elephant', -2.8, -1.4, 0.4], ['giraffe', 2.4, -2.2, -0.3], ['lion', 0.4, 1.0], ['tree', -4.6, -3.0, 0, 1.3], ['tree', 4.4, 0.4, 0, 1.1], ['tree', 0, -4.2, 0, 1.5]] },
    { id: 'invent', icon: '💡', name: '发明与探索', note: '火车、飞机、居里夫人和爱因斯坦', items: [['train', -3.0, -2.0, 0.5], ['biplane', 3.2, -2.4, -0.5], ['curie', -1.0, 1.2], ['einstein', 1.2, 1.2], ['globe', 0, -0.8]] },
    { id: 'americas', icon: '🗽', name: '美洲之旅', note: '自由女神、玛雅金字塔和林肯', items: [['liberty', -3.0, -2.4], ['maya', 3.2, -2.6], ['lincoln', 0, 1.2], ['flag', -1.6, 2.2], ['moai', 5.6, 1.4, -0.7]] }
  ] };
})(window);
