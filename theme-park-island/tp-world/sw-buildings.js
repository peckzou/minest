/* Star Wars: Galaxy's Edge — two buildings to walk into (2026-11-24).
 * Droid Depot (机器人工坊): a long industrial shed with a flat roof, pipes and a radar dish; inside, a conveyor of parts,
 * shelves of finished droids and the build station. Savi's Workshop (光剑工坊): a round scrap-metal rotunda with a
 * conical roof; inside, dim, the kyber table and the Gatherers. Each is a real hollow model standing in the park: the
 * doors slide open as the guest comes near, and the guest walks in. At the bench inside, E opens the builder
 * (sw-workshops.js); the droid then follows its maker and the lightsaber is in the hand. */
(function (root) {
  'use strict';
  var API, T, doors = [], spin = [], clock = 0;
  var DEPOT = { x: 164, z: 112 }, SAVI = { x: 186, z: 112 };
  function tex(w, h, rep, draw) { var c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); var t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(rep[0], rep[1]); return t; }
  function build() {
    var L = function (c, o) { return new T.MeshLambertMaterial(Object.assign({ color: c }, o || {})); }, B = function (c) { return new T.MeshBasicMaterial({ color: c }); };
    var W = root.TPStarWarsWorkshops, COLS = ['#2563eb', '#f97316', '#dc2626', '#16a34a', '#7c3aed', '#f8fafc'], KY = ['#3b82f6', '#22c55e', '#a855f7', '#ef4444', '#facc15', '#f8fafc'];
    var plaster = function (base, rep) { return new T.MeshLambertMaterial({ side: T.DoubleSide, map: tex(256, 256, rep, function (c, w, h) { c.fillStyle = base; c.fillRect(0, 0, w, h); for (var i = 0; i < 240; i++) { c.fillStyle = 'rgba(' + (i % 2 ? '40,30,20' : '255,240,210') + ',.09)'; c.fillRect((i * 97) % w, (i * 53) % h, 8 + i % 26, 2 + i % 6); } c.strokeStyle = 'rgba(40,30,20,.5)'; c.lineWidth = 3; c.strokeRect(2, 2, w - 4, h - 4); c.fillStyle = 'rgba(40,30,20,.35)'; c.fillRect(0, h * 0.7, w, 6); }) }); };
    var plate = new T.MeshLambertMaterial({ map: tex(128, 128, [8, 6], function (c, w, h) { c.fillStyle = '#4a4238'; c.fillRect(0, 0, w, h); c.strokeStyle = '#2a241d'; c.lineWidth = 3; c.strokeRect(1, 1, w - 2, h - 2); c.fillStyle = '#6b5f50'; [[10, 10], [w - 16, 10], [10, h - 16], [w - 16, h - 16]].forEach(function (q) { c.fillRect(q[0], q[1], 6, 6); }); }) });
    var sign = function (g, txt, sub, col, w, x, y, z) { var c = document.createElement('canvas'); c.width = 640; c.height = 160; var q = c.getContext('2d'); q.fillStyle = '#0b0f1a'; q.fillRect(0, 0, 640, 160); q.strokeStyle = col; q.lineWidth = 10; q.strokeRect(6, 6, 628, 148); q.shadowColor = col; q.shadowBlur = 16; q.fillStyle = col; q.textAlign = 'center'; q.font = '800 62px sans-serif'; q.fillText(txt, 320, 72); q.shadowBlur = 0; q.fillStyle = '#e0f2fe'; q.font = '700 40px "PingFang SC",sans-serif'; q.fillText(sub, 320, 128); var m = new T.Mesh(new T.PlaneGeometry(w, w / 4), new T.MeshBasicMaterial({ map: new T.CanvasTexture(c) })); m.position.set(x, y, z); g.add(m); };
    var add = function (g, geo, m, x, y, z, ry) { var o = new T.Mesh(geo, m); o.position.set(x, y, z); if (ry) o.rotation.y = ry; g.add(o); return o; };
    var slide = function (g, x, z, w, h, col, at) { [-1, 1].forEach(function (s) { var d = add(g, new T.BoxGeometry(w / 2, h, 0.18), L(col), x + s * w / 4, h / 2 + 0.1, z); add(d, new T.BoxGeometry(w / 2 - 0.3, 0.12, 0.2), B(0xf97316), 0, 0.3, 0); d.position.set(x + s * w / 4, h / 2 + 0.1, z); doors.push({ m: d, x0: x + s * w / 4, s: s, w: w / 2, at: at }); }); };

    /* ---------------- Droid Depot: a long shed, 18 × 12, flat roof ---------------- */
    var gy = API.groundY(DEPOT.x, DEPOT.z, 62), g = new T.Group(); g.position.set(DEPOT.x, gy, DEPOT.z); API.scene.add(g);
    var wm = plaster('#c9b592', [4, 1]), HW = 9, HD = 6, H = 5.2;
    add(g, new T.BoxGeometry(18.4, 0.2, 12.4), plate, 0, 0.1, 0);                                        /* floor */
    add(g, new T.BoxGeometry(18, H, 0.3), wm, 0, H / 2, -HD); [-1, 1].forEach(function (s) { add(g, new T.BoxGeometry(0.3, H, 12), wm, s * HW, H / 2, 0); add(g, new T.BoxGeometry(7.2, H, 0.3), wm, s * 5.4, H / 2, HD); });
    add(g, new T.BoxGeometry(3.6, H - 3.4, 0.3), wm, 0, 3.4 + (H - 3.4) / 2, HD);                       /* over the door */
    add(g, new T.BoxGeometry(19, 0.4, 13), L(0x8c7a60), 0, H + 0.2, 0);                                  /* roof */
    add(g, new T.BoxGeometry(18, 0.06, 12), B(0x2a241d), 0, H - 0.02, 0);                                 /* ceiling */
    slide(g, 0, HD, 3.6, 3.3, 0x6b7280, { x: DEPOT.x, z: DEPOT.z + HD });
    sign(g, 'DROID DEPOT', '机器人工坊', '#f97316', 8, 0, H + 1.6, HD + 0.2); add(g, new T.BoxGeometry(8.4, 2.3, 0.2), L(0x1f2937), 0, H + 1.6, HD);
    var dish = add(g, new T.SphereGeometry(1.5, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2.6), L(0x9aa3ad, { side: T.DoubleSide }), -6, H + 2.4, -2); dish.rotation.x = Math.PI * 0.8; spin.push(dish); add(g, new T.CylinderGeometry(0.1, 0.14, 1.8, 8), L(0x4b5563), -6, H + 1.2, -2);
    [[-8.6, 2], [8.6, -1]].forEach(function (q) { add(g, new T.CylinderGeometry(0.22, 0.22, H + 1.4, 10), L(0x7a4a2a), q[0] * 1.06, (H + 1.4) / 2, q[1]); });
    [-6, 6].forEach(function (x) { add(g, new T.BoxGeometry(2.4, 1.3, 0.1), B(0x9bd8f5), x, 3, HD + 0.18); add(g, new T.BoxGeometry(2.9, 0.25, 0.9), L(0xf97316), x, 4.0, HD + 0.5); });
    [-2.6, 2.6].forEach(function (x, i) { try { var d = W.buildDroid({ body: i ? 'bb' : 'r2', color: i ? '#f97316' : '#2563eb', head: 'dome' }); d.position.set(x, 0.2, HD + 1.8); d.scale.setScalar(1.25); g.add(d); } catch (e) {} });
    /* inside: the conveyor along the back wall, shelves of droids at both ends, the build station in the middle */
    add(g, new T.BoxGeometry(13, 0.25, 1.3), L(0x1f2937), 0, 1.0, -4.6); [-0.7, 0.7].forEach(function (d) { add(g, new T.BoxGeometry(13, 0.3, 0.1), L(0x9aa3ad), 0, 1.1, -4.6 + d); }); [-5.5, 0, 5.5].forEach(function (x) { add(g, new T.BoxGeometry(0.4, 0.9, 1.1), L(0x4b5563), x, 0.55, -4.6); });
    var parts = []; for (var k = 0; k < 11; k++) { var pm = L(COLS[k % 6]), geo = k % 3 === 0 ? new T.CylinderGeometry(0.3, 0.3, 0.6, 14) : k % 3 === 1 ? new T.SphereGeometry(0.34, 14, 10) : new T.SphereGeometry(0.3, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2); parts.push(add(g, geo, pm, -6 + k * 1.18, 1.45, -4.6)); }
    [-1, 1].forEach(function (s) { for (var r = 0; r < 2; r++) { add(g, new T.BoxGeometry(0.9, 0.08, 7), L(0x6b5a44), s * 8.3, 1.0 + r * 1.5, -1); for (var n = 0; n < 4; n++) { try { var sd = W.buildDroid({ body: (n + r) % 2 ? 'bb' : 'r2', color: COLS[(n + r * 3 + (s > 0 ? 2 : 0)) % 6], head: n % 2 ? 'cone' : 'dome' }); sd.position.set(s * 8.3, 1.04 + r * 1.5, -3.6 + n * 1.75); sd.rotation.y = -s * Math.PI / 2; sd.scale.setScalar(0.85); g.add(sd); } catch (e) {} } } });
    add(g, new T.CylinderGeometry(1.4, 1.6, 0.4, 24), L(0x6b7280), 0, 0.4, -0.6); var ring = add(g, new T.TorusGeometry(1.4, 0.06, 8, 36), B(0x38bdf8), 0, 0.62, -0.6); ring.rotation.x = Math.PI / 2;
    /* the two assembly arms: a bolted base, a turret, an upper arm with its hydraulic ram, an elbow, a forearm, a wrist and a two-finger gripper with a welding tip */
    var hazard = new T.MeshLambertMaterial({ map: tex(64, 64, [1, 3], function (c, w, h) { c.fillStyle = '#f59e0b'; c.fillRect(0, 0, w, h); c.fillStyle = '#1f2937'; for (var i = -2; i < 4; i++) { c.beginPath(); c.moveTo(i * 32, 0); c.lineTo(i * 32 + 16, 0); c.lineTo(i * 32 + 48, h); c.lineTo(i * 32 + 32, h); c.fill(); } }) });
    var steel = L(0x9aa3ad), gun = L(0x374151), chrome = new T.MeshPhongMaterial({ color: 0xe5e7eb, shininess: 90 });
    var arms = [-1, 1].map(function (s) {
      var x = s * 1.9, z = -0.6;
      add(g, new T.CylinderGeometry(0.42, 0.48, 0.24, 16), gun, x, 0.32, z); for (var b2 = 0; b2 < 6; b2++) add(g, new T.CylinderGeometry(0.04, 0.04, 0.08, 6), chrome, x + Math.cos(b2 * 1.047) * 0.36, 0.46, z + Math.sin(b2 * 1.047) * 0.36);
      var turret = new T.Group(); turret.position.set(x, 0.44, z); g.add(turret);
      add(turret, new T.CylinderGeometry(0.24, 0.3, 0.5, 14), steel, 0, 0.25, 0); add(turret, new T.BoxGeometry(0.2, 0.14, 0.34), B(0x22c55e), 0, 0.3, 0.2);
      var shoulder = new T.Group(); shoulder.position.y = 0.55; turret.add(shoulder);
      var j1 = add(shoulder, new T.CylinderGeometry(0.2, 0.2, 0.42, 14), gun, 0, 0, 0); j1.rotation.x = Math.PI / 2;
      add(shoulder, new T.BoxGeometry(0.2, 1.4, 0.26), hazard, 0, 0.7, 0); add(shoulder, new T.CylinderGeometry(0.05, 0.05, 0.9, 8), chrome, s * 0.16, 0.6, 0); add(shoulder, new T.CylinderGeometry(0.07, 0.07, 0.4, 8), gun, s * 0.16, 0.25, 0);
      [0.3, 1.1].forEach(function (y) { [-0.14, 0.14].forEach(function (zz) { add(shoulder, new T.SphereGeometry(0.035, 6, 5), chrome, 0, y, zz); }); });
      var elbow = new T.Group(); elbow.position.y = 1.4; shoulder.add(elbow);
      var j2 = add(elbow, new T.CylinderGeometry(0.16, 0.16, 0.36, 14), gun, 0, 0, 0); j2.rotation.x = Math.PI / 2;
      add(elbow, new T.BoxGeometry(0.15, 1.05, 0.18), steel, 0, 0.55, 0); add(elbow, new T.BoxGeometry(0.17, 0.12, 0.2), B(0xf97316), 0, 0.3, 0); add(elbow, new T.CylinderGeometry(0.025, 0.025, 0.9, 6), L(0x111827), -s * 0.1, 0.5, 0.06);
      var wrist = new T.Group(); wrist.position.y = 1.08; elbow.add(wrist); add(wrist, new T.CylinderGeometry(0.09, 0.09, 0.14, 10), gun, 0, 0, 0);
      var fingers = [-1, 1].map(function (f) { var fg = new T.Group(); fg.position.set(0, 0.07, f * 0.07); wrist.add(fg); add(fg, new T.BoxGeometry(0.05, 0.3, 0.04), chrome, 0, 0.15, 0); add(fg, new T.BoxGeometry(0.05, 0.05, 0.08), chrome, 0, 0.3, -f * 0.03); return { g: fg, f: f }; });
      var tip = add(wrist, new T.SphereGeometry(0.07, 8, 6), B(0xfff7ae), 0, 0.42, 0);
      return { s: s, turret: turret, shoulder: shoulder, elbow: elbow, wrist: wrist, fingers: fingers, tip: tip };
    });
    try { var demo = W.buildDroid({ body: 'r2', color: '#dc2626', head: 'dome' }); demo.position.set(0, 0.6, -0.6); demo.scale.setScalar(1.2); g.add(demo); spin.push(demo); } catch (e) {}
    [-5, 0, 5].forEach(function (x) { add(g, new T.BoxGeometry(1.6, 0.1, 0.5), B(0xfff1c2), x, H - 0.1, 0); });
    sign(g, 'BUILD', '在这里组装', '#38bdf8', 3.6, 0, 3.9, -5.8);
    var lamp = new T.PointLight(0xffe2b0, 0.9, 16, 2); lamp.position.set(0, H - 0.8, 0); g.add(lamp);

    /* ---------------- Savi's Workshop: a round rotunda, radius 6.5, conical roof ---------------- */
    var gy2 = API.groundY(SAVI.x, SAVI.z, 62), s2 = new T.Group(); s2.position.set(SAVI.x, gy2, SAVI.z); API.scene.add(s2);
    var R = 6.5, H2 = 4.6, gap = 0.52, rust = plaster('#7a5a3e', [8, 1]);
    add(s2, new T.CylinderGeometry(R + 0.3, R + 0.3, 0.2, 36), plate, 0, 0.1, 0);
    add(s2, new T.CylinderGeometry(R, R, H2, 40, 1, true, gap / 2, Math.PI * 2 - gap), rust, 0, H2 / 2 + 0.2, 0);                  /* the wall, open at the door (towards +z) */
    add(s2, new T.CylinderGeometry(R, R, H2 - 3.2, 12, 1, true, -gap / 2, gap), rust, 0, 3.4 + (H2 - 3.2) / 2, 0);
    add(s2, new T.ConeGeometry(R + 0.9, 3.6, 12), L(0x5a3d28, { side: T.DoubleSide }), 0, H2 + 2.0, 0); add(s2, new T.CylinderGeometry(0.5, 0.7, 1.2, 10), L(0x3a2c20), 0, H2 + 4.2, 0);
    for (var b = 0; b < 12; b++) { var ba = b / 12 * Math.PI * 2 + 0.26; add(s2, new T.BoxGeometry(0.3, H2 + 0.6, 0.5), L(0x4a3a2a), Math.sin(ba) * (R + 0.15), (H2 + 0.6) / 2, Math.cos(ba) * (R + 0.15), ba); }
    slide(s2, 0, R - 0.1, 3.2, 3.3, 0x3a2c20, { x: SAVI.x, z: SAVI.z + R });
    sign(s2, "SAVI'S", '光剑工坊', '#a78bfa', 4.4, 0, 4.0, R + 1.5); add(s2, new T.BoxGeometry(4.6, 1.25, 0.12), L(0x1f1811), 0, 4.0, R + 1.42); [-2.1, 2.1].forEach(function (x) { add(s2, new T.BoxGeometry(0.14, 3.6, 0.14), L(0x3a2c20), x, 1.9, R + 1.42); });   /* the sign stands clear of the eaves, on two posts either side of the way in */ [-2.4, 2.4].forEach(function (x) { add(s2, new T.CylinderGeometry(0.05, 0.05, 3.4, 6), L(0x3a2c20), x, 1.9, R + 0.7); add(s2, new T.SphereGeometry(0.2, 10, 8), B(0xffc46b), x, 3.7, R + 0.7); });
    /* inside: dim; the kyber table, the crystals, the Gatherers with their sabers, lamps round the wall */
    /* the kyber table: a ribbed drum, an inlaid top with a brass rim and rivets, a clawed pedestal for the great crystal, a stand and a ring of light for each of the six, and trays of hilt parts */
    var drum = new T.MeshLambertMaterial({ map: tex(128, 128, [12, 1], function (c, w, h) { c.fillStyle = '#3a2c1e'; c.fillRect(0, 0, w, h); c.fillStyle = '#231a11'; c.fillRect(0, 0, 14, h); c.fillRect(w - 14, 0, 14, h); c.fillStyle = '#6b5236'; c.fillRect(30, 18, w - 60, h - 36); c.fillStyle = '#3a2c1e'; c.fillRect(38, 26, w - 76, h - 52); c.fillStyle = '#c9a24a'; [[22, 10], [w - 28, 10], [22, h - 16], [w - 28, h - 16]].forEach(function (q) { c.fillRect(q[0], q[1], 6, 6); }); }) });
    var brass = new T.MeshPhongMaterial({ color: 0x5e4322, specular: 0x241a0e, shininess: 18 })   /* aged bronze, not bright yellow */, iron = L(0x2a2118);
    add(s2, new T.CylinderGeometry(2.0, 2.2, 0.9, 36), drum, 0, 0.65, -0.6); add(s2, new T.CylinderGeometry(2.25, 2.3, 0.1, 36), iron, 0, 0.25, -0.6); add(s2, new T.CylinderGeometry(2.1, 2.1, 0.08, 36), L(0x4a3826), 0, 1.14, -0.6);
    var top = add(s2, new T.CircleGeometry(2.05, 48), new T.MeshLambertMaterial({ map: tex(512, 512, [1, 1], function (c, w, h) {
      c.fillStyle = '#5a4630'; c.fillRect(0, 0, w, h); c.translate(w / 2, h / 2);
      for (var i = 0; i < 12; i++) { c.rotate(Math.PI / 6); c.fillStyle = i % 2 ? '#6b5338' : '#4a3826'; c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, 250, 0, Math.PI / 6); c.fill(); c.strokeStyle = '#2a2118'; c.lineWidth = 3; c.beginPath(); c.moveTo(0, 0); c.lineTo(250, 0); c.stroke(); }
      [240, 196, 150, 70].forEach(function (r, i) { c.strokeStyle = i % 2 ? '#2a2118' : '#9a7a44'; c.lineWidth = i ? 4 : 8; c.beginPath(); c.arc(0, 0, r, 0, 7); c.stroke(); });
      c.fillStyle = '#9a7a44'; for (var k = 0; k < 24; k++) { c.rotate(Math.PI / 12); c.fillRect(214, -3, 16 + (k % 3) * 5, 6); c.fillRect(170, -2, 6, 4 + (k % 4) * 3); }
      c.fillStyle = '#2a2118'; c.beginPath(); for (var p = 0; p < 16; p++) { var rr = p % 2 ? 26 : 62, a = p * Math.PI / 8; c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } c.fill();
    }) }), 0, 1.185, -0.6); top.rotation.x = -Math.PI / 2;
    var rim = add(s2, new T.TorusGeometry(2.1, 0.06, 8, 48), brass, 0, 1.17, -0.6); rim.rotation.x = Math.PI / 2;
    for (var rv = 0; rv < 24; rv++) add(s2, new T.SphereGeometry(0.035, 6, 5), brass, Math.sin(rv * 0.2618) * 2.12, 1.1, -0.6 + Math.cos(rv * 0.2618) * 2.12);
    add(s2, new T.CylinderGeometry(0.3, 0.38, 0.24, 14), brass, 0, 1.3, -0.6);
    for (var cl = 0; cl < 3; cl++) { var claw = add(s2, new T.ConeGeometry(0.05, 0.42, 6), brass, Math.sin(cl * 2.094) * 0.2, 1.58, -0.6 + Math.cos(cl * 2.094) * 0.2); claw.rotation.set(-Math.cos(cl * 2.094) * 0.45, 0, Math.sin(cl * 2.094) * 0.45); }
    var great = add(s2, new T.OctahedronGeometry(0.24, 0), new T.MeshBasicMaterial({ color: 0xdff4ff }), 0, 1.86, -0.6); great.scale.y = 1.5;
    var cry = KY.map(function (c, i) { var a = i / 6 * Math.PI * 2 + 0.52, cx = Math.sin(a) * 1.3, cz = -0.6 + Math.cos(a) * 1.3;
      add(s2, new T.CylinderGeometry(0.09, 0.12, 0.12, 10), iron, cx, 1.25, cz); add(s2, new T.CylinderGeometry(0.02, 0.02, 0.1, 6), brass, cx, 1.34, cz);
      var halo = add(s2, new T.RingGeometry(0.14, 0.24, 20), new T.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.7, side: T.DoubleSide }), cx, 1.195, cz); halo.rotation.x = -Math.PI / 2;
      var m = add(s2, new T.OctahedronGeometry(0.13, 0), B(c), cx, 1.52, cz); m.scale.y = 1.4; return m; });
    var trays = [];
    for (var tr = 0; tr < 6; tr++) { var ta = tr / 6 * Math.PI * 2, tg = new T.Group(); tg.position.set(Math.sin(ta) * 1.62, 1.2, -0.6 + Math.cos(ta) * 1.62); tg.rotation.y = ta; s2.add(tg); trays.push(tg);
      add(tg, new T.BoxGeometry(0.56, 0.03, 0.3), L(0x1f1811), 0, 0, 0); [[-0.17, steel], [0, brass], [0.17, gun]].forEach(function (q, i) { var pc = add(tg, new T.CylinderGeometry(0.035, i === 2 ? 0.045 : 0.035, 0.22, 10), q[1], q[0], 0.05, 0); pc.rotation.x = Math.PI / 2; add(tg, new T.CylinderGeometry(0.04, 0.04, 0.03, 10), i ? gun : brass, q[0], 0.05, 0.06).rotation.x = Math.PI / 2; }); }
    var pillar = add(s2, new T.CylinderGeometry(0.1, 0.22, 2.2, 12, 1, true), new T.MeshBasicMaterial({ color: 0x9bd8ff, transparent: true, opacity: 0.3, side: T.DoubleSide, depthWrite: false }), 0, 3.1, -0.6);
    var chand = add(s2, new T.TorusGeometry(1.7, 0.05, 6, 32), iron, 0, 3.9, -0.6); chand.rotation.x = Math.PI / 2;
    for (var ch = 0; ch < 8; ch++) { var ca = ch * 0.785; add(s2, new T.SphereGeometry(0.09, 8, 6), B(0xffd08a), Math.sin(ca) * 1.7, 3.78, -0.6 + Math.cos(ca) * 1.7); if (ch % 2 === 0) add(s2, new T.CylinderGeometry(0.012, 0.012, 1.0, 4), iron, Math.sin(ca) * 1.7, 4.4, -0.6 + Math.cos(ca) * 1.7); }
    /* the Gatherers: a robe in folds, a mantle, a belt with its buckle, pouch and strap, sleeves and hands round the hilt, a face under a hood — each a little different */
    var ROBES = ['#6b5438', '#59606a', '#5d6b45', '#7a4f36', '#4f4a63'], SKINS = [0xe2b48c, 0xc98f62, 0xf0c8a0, 0x8a5a3a, 0xd9a878], gath = [];
    var cloth = function (base) { return new T.MeshLambertMaterial({ side: T.DoubleSide, map: tex(64, 128, [6, 1], function (c, w, h) { c.fillStyle = base; c.fillRect(0, 0, w, h); var gr = c.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, 'rgba(0,0,0,.34)'); gr.addColorStop(0.5, 'rgba(255,255,255,.10)'); gr.addColorStop(1, 'rgba(0,0,0,.34)'); c.fillStyle = gr; c.fillRect(0, 0, w, h); c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(0, h - 10, w, 10); c.fillStyle = 'rgba(255,220,150,.35)'; c.fillRect(0, h - 16, w, 3); }) }); };
    for (var n2 = 0; n2 < 5; n2++) { var a3 = Math.PI * 0.62 + n2 * 0.44, q = new T.Group(); q.position.set(Math.sin(a3) * 4.2, 0.2, -0.6 + Math.cos(a3) * 4.2); q.rotation.y = a3 + Math.PI; q.scale.setScalar(0.96 + (n2 % 3) * 0.05); s2.add(q);
      var robe = cloth(ROBES[n2]), mantle = L(new T.Color(ROBES[n2]).multiplyScalar(0.62).getHex(), { side: T.DoubleSide }), skin = L(SKINS[n2]), leather = L(0x3a2616);
      add(q, new T.CylinderGeometry(0.21, 0.47, 1.06, 16), robe, 0, 0.53, 0); add(q, new T.CylinderGeometry(0.25, 0.22, 0.52, 14), robe, 0, 1.3, 0); add(q, new T.BoxGeometry(0.34, 0.1, 0.2), leather, 0.09, 0.04, 0.2); add(q, new T.BoxGeometry(0.34, 0.1, 0.2), leather, -0.12, 0.04, 0.16);
      var belt = add(q, new T.TorusGeometry(0.235, 0.035, 6, 20), leather, 0, 1.06, 0); belt.rotation.x = Math.PI / 2; add(q, new T.BoxGeometry(0.1, 0.09, 0.03), brass, 0, 1.06, 0.26); add(q, new T.BoxGeometry(0.13, 0.16, 0.08), leather, -0.24, 0.96, 0.1); add(q, new T.BoxGeometry(0.03, 0.03, 0.03), brass, -0.24, 0.99, 0.15);
      var strap = add(q, new T.BoxGeometry(0.05, 0.72, 0.02), leather, 0.02, 1.32, 0.235); strap.rotation.z = 0.62;
      add(q, new T.ConeGeometry(0.4, 0.3, 14, 1, true), mantle, 0, 1.5, 0); var scarf = add(q, new T.TorusGeometry(0.13, 0.05, 6, 14), L(n2 % 2 ? 0x8a3a2a : 0xc9a24a), 0, 1.6, 0.01); scarf.rotation.x = Math.PI / 2;
      [-1, 1].forEach(function (s) { var up = add(q, new T.CylinderGeometry(0.075, 0.1, 0.44, 10), robe, s * 0.27, 1.34, 0.1); up.rotation.set(-0.75, 0, -s * 0.22); var fo = add(q, new T.CylinderGeometry(0.09, 0.07, 0.3, 10), robe, s * 0.17, 1.2, 0.29); fo.rotation.set(-1.25, 0, s * 0.55); add(q, new T.SphereGeometry(0.055, 8, 6), skin, s * 0.045, 1.17 + s * 0.045, 0.37); });
      add(q, new T.CylinderGeometry(0.07, 0.08, 0.1, 10), skin, 0, 1.6, 0); add(q, new T.SphereGeometry(0.165, 14, 12), skin, 0, 1.76, 0);
      [-1, 1].forEach(function (s) { add(q, new T.SphereGeometry(0.024, 6, 5), B(0x1a1410), s * 0.06, 1.79, 0.15); add(q, new T.BoxGeometry(0.06, 0.012, 0.02), L(0x3a2616), s * 0.06, 1.83, 0.152); });
      add(q, new T.ConeGeometry(0.025, 0.07, 6), skin, 0, 1.755, 0.175).rotation.x = Math.PI / 2; add(q, new T.BoxGeometry(0.06, 0.012, 0.02), L(0x7a3a2a), 0, 1.7, 0.155);
      if (n2 % 2 === 0) { add(q, new T.ConeGeometry(0.1, 0.22, 8), L(n2 ? 0xd8d8d8 : 0x8a8a8a), 0, 1.6, 0.12).rotation.x = Math.PI; }
      if (n2 % 3 === 1) { [-1, 1].forEach(function (s) { add(q, new T.CylinderGeometry(0.04, 0.04, 0.03, 10), brass, s * 0.06, 1.88, 0.14).rotation.x = Math.PI / 2; }); var gs = add(q, new T.TorusGeometry(0.17, 0.012, 4, 16), leather, 0, 1.88, 0); gs.rotation.x = Math.PI / 2; }
      /* a hood, not a helmet: a shell round the back and sides of the head, open at the face from brow to chin, a small crown over the top, and its edge folded back */
      add(q, new T.SphereGeometry(0.215, 18, 12, Math.PI / 2 + 0.95, Math.PI * 2 - 1.9, 0, Math.PI * 0.8), mantle, 0, 1.76, -0.015); add(q, new T.SphereGeometry(0.217, 14, 6, 0, Math.PI * 2, 0, 0.5), mantle, 0, 1.76, -0.015);
      var brim = add(q, new T.TorusGeometry(0.2, 0.022, 6, 18, Math.PI * 1.25), mantle, 0, 1.75, 0.105); brim.rotation.z = -Math.PI * 0.125; add(q, new T.ConeGeometry(0.11, 0.3, 8), mantle, 0, 1.93, -0.17).rotation.x = -1.0;
      try { var sb = W.buildSaber({ color: KY[n2], hilt: n2 % 2 ? 'gold' : 'steel' }); sb.position.set(0, 1.12, 0.37); sb.rotation.set(0, 0, 0); q.add(sb); gath.push({ g: q, sb: sb, ry: a3 + Math.PI, ph: n2 * 1.3 }); } catch (e) {} }
    for (var lp = 0; lp < 10; lp++) { var la = lp / 10 * Math.PI * 2 + 0.3; add(s2, new T.SphereGeometry(0.13, 8, 6), B(0xffc46b), Math.sin(la) * (R - 0.5), 3.4, Math.cos(la) * (R - 0.5)); }
    for (var sh = 0; sh < 6; sh++) { var sa = Math.PI + (sh - 2.5) * 0.3; add(s2, new T.BoxGeometry(1.4, 0.08, 0.5), L(0x4a3a2a), Math.sin(sa) * (R - 0.6), 1.5, Math.cos(sa) * (R - 0.6), sa); add(s2, new T.CylinderGeometry(0.04, 0.04, 0.5, 8), L(0x9aa3ad), Math.sin(sa) * (R - 0.6), 1.8, Math.cos(sa) * (R - 0.6)); }
    var lamp2 = new T.PointLight(0x9bd0ff, 0.8, 12, 2); lamp2.position.set(0, 3.2, -0.6); s2.add(lamp2);

    var list = API.getProps().interactables, reg = function (x, z, name, kind) { var e = { id: 'swb-' + kind, name: name, x: x, z: z }; Object.defineProperty(e, 'msg', { get: function () { setTimeout(function () { if (root.TPSWExperience) root.TPSWExperience.start(kind); else W.open(kind); }, 0); return name; } }); list.push(e); };
    reg(DEPOT.x, DEPOT.z + 1.6, '机器人工坊 · 造一个自己的机器人', 'droid'); reg(SAVI.x, SAVI.z + 1.8, '光剑工坊 · 造一把自己的光剑', 'saber');
    Object.assign(root.TPStarWarsBuildings, { saviGroup: s2, depotGroup: g, gath: gath, lamp2: lamp2, trays: trays, parts: parts, demo: typeof demo === 'undefined' ? null : demo, ring: ring, great: great, R: R, HD: HD });
    /* a way straight to the two workshops: the button in the park's top bar, or ?goto=savi / ?goto=depot */
    var goTo = function (at, r) { var x = document.getElementById('tp-close-guide'); if (x) x.click(); API.teleport({ mode: 'walk', p: [at.x, API.groundY(at.x, at.z + r + 7, 62), at.z + r + 7], t: [at.x, 41.6, at.z] }); API.toast(at === SAVI ? '⚔️ 光剑工坊就在前面：一直往前走，门会自己打开' : '🤖 机器人工坊就在前面：一直往前走，门会自己打开'); };
    root.TPStarWarsBuildings.goSavi = function () { goTo(SAVI, R); }; root.TPStarWarsBuildings.goDepot = function () { goTo(DEPOT, HD); };
    var addBtn = function () { var row = document.getElementById('mn-pav-btns'); if (!row || document.getElementById('sw-go-btn')) return; [['sw-go-btn', '⚔️ 光剑工坊', SAVI, R], ['sw-go-btn2', '🤖 机器人工坊', DEPOT, HD]].forEach(function (q) { var b = document.createElement('button'); b.type = 'button'; b.id = q[0]; b.textContent = q[1]; b.style.cssText = 'padding:5px 12px;border-radius:999px;border:none;background:linear-gradient(135deg,#0f172a,#4c1d95);color:#e0e7ff;font-weight:900;font-size:11.5px;cursor:pointer;box-shadow:0 2px 10px rgba(0,0,0,.35)'; b.onclick = function (e) { e.stopPropagation(); goTo(q[2], q[3]); }; row.appendChild(b); }); };
    addBtn(); new MutationObserver(addBtn).observe(document.body, { childList: true, subtree: true });
    var want = /[?&]goto=(savi|depot)/.exec(location.search); if (want) setTimeout(function () { goTo(want[1] === 'savi' ? SAVI : DEPOT, want[1] === 'savi' ? R : HD); }, 600);
    var last = performance.now();
    (function tick(now) {
      requestAnimationFrame(tick); var dt = Math.min(0.05, (now - last) / 1000); last = now; clock += dt; var P = API.player.pos;
      doors.forEach(function (d) { var open = Math.max(0, Math.min(1, (14 - Math.hypot(P.x - d.at.x, P.z - d.at.z)) / 4))   /* wide open well before the guest reaches them */, to = d.x0 + d.s * d.w * 0.96 * open; d.m.position.x += (to - d.m.position.x) * Math.min(1, dt * 5); });
      parts.forEach(function (p, i) { p.position.x += dt * 0.8; if (p.position.x > 6.4) p.position.x -= 12.98; p.rotation.y += dt * (i % 2 ? 1 : -0.7); });
      arms.forEach(function (a, i) { var w = Math.sin(clock * 0.9 + i * 2.2), weld = Math.sin(clock * 0.9 + i * 2.2 + 1.2) > 0.45;
        a.turret.rotation.y = w * 0.35; a.shoulder.rotation.z = a.s * (0.52 + w * 0.16); a.elbow.rotation.z = a.s * (0.95 + Math.sin(clock * 1.5 + i) * 0.22); a.wrist.rotation.y += dt * 2.4;
        var gp = 0.5 + 0.5 * Math.sin(clock * 3 + i); a.fingers.forEach(function (f) { f.g.rotation.x = f.f * gp * 0.35; }); a.tip.visible = weld && Math.sin(clock * 47 + i) > -0.2; a.tip.scale.setScalar(0.7 + Math.random() * 1.1); });
      spin.forEach(function (o, i) { o.rotation.y += dt * (i ? 0.8 : 0.5); });
      cry.forEach(function (c, i) { c.rotation.y += dt * 1.3; c.position.y = 1.52 + Math.sin(clock * 2 + i) * 0.05; }); pillar.material.opacity = 0.22 + Math.sin(clock * 2.4) * 0.1; great.rotation.y -= dt * 0.8; great.position.y = 1.86 + Math.sin(clock * 1.3) * 0.04;
      gath.forEach(function (q) { q.g.rotation.y = q.ry + Math.sin(clock * 0.5 + q.ph) * 0.12; q.sb.position.y = 1.12 + Math.sin(clock * 0.8 + q.ph) * 0.03; q.sb.rotation.z = Math.sin(clock * 0.6 + q.ph) * 0.06; });
    })(last);
  }
  function attach(api) { if (API || !api) return; API = api; T = api.THREE; var go = function () { if (!root.TPStarWarsWorkshops) return setTimeout(go, 200); try { build(); } catch (e) { if (root.console) console.warn('[sw buildings]', e); } }; go(); }
  if (root.TPParkAPI) attach(root.TPParkAPI); else root.addEventListener('tp:park-ready', function (e) { attach(e.detail || root.TPParkAPI); });
  root.TPStarWarsBuildings = { depot: DEPOT, savi: SAVI };
})(window);
