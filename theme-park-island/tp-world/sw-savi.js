/* Savi's Workshop — Handbuilt Lightsabers, as a place to walk through (2026-11-24).
 * A likeness of the workshop at Star Wars: Galaxy's Edge, after Disney's own description and visitors' accounts: an
 * unmarked scrap yard ("Savi & Son Salvage") where the Gatherers check guests in and each chooses a hilt theme and
 * takes its pin; a dim passage; then the build chamber — round, dark, a ring-shaped counter with a station for every
 * builder on its outside and the Gatherers inside it, a great crystal in the middle under a ring of light, the kyber
 * crystals in a lit alcove, the parts on carts by the wall, and an activation chamber (a white tube) at every station.
 *
 * The guest goes through it as a traveller seen from behind (third person), walking from place to place:
 *   yard: step onto the pad of one of the four hilt displays → the passage → the crystal alcove: step up to a crystal
 *   → the carts: fetch the tray of your theme → your station at the counter: build the hilt with your hands (drag the
 *   crystal into the chassis, then the plate, two sleeves, the emitter, the pommel; hold to screw) → drop the hilt in
 *   the activation chamber; the lights go down and the ring turns your colour → draw it, ignite it, raise it.
 * Little is written on screen: a picture and a few words; the Gatherer speaks the rest, and a beam of light shows the way.
 * Walk: WASD / arrows (or the pad); drag to turn the view; stand on a glowing pad (or press E / the round button) to act. */
(function (root) {
  'use strict';
  var API = null, T = null, W = null, Kit = null, PARTS = null, S = null, clock = 0, X = null, hud = null, keys = {}, ray = null, ndc = null;
  var AT = { x: 198, z: 104 }, R = 10, H = 6.5, FY = 0.15, amb = { doors: [], gath: [], npcs: [], crystals: [], peds: [], carts: [], tubes: [], spin: [] };
  var KY = ['#3b82f6', '#22c55e', '#a855f7', '#ef4444', '#facc15'];
  function tex(w, h, rep, draw) { var c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); var t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(rep[0], rep[1]); return t; }
  var L = function (c, o) { return new T.MeshLambertMaterial(Object.assign({ color: c }, o || {})); }, B = function (c, o) { return new T.MeshBasicMaterial(Object.assign({ color: c }, o || {})); };
  function add(g, geo, m, x, y, z, ry) { var o = new T.Mesh(geo, m); o.position.set(x || 0, y || 0, z || 0); if (ry) o.rotation.y = ry; g.add(o); return o; }
  function pol(a, r) { return [Math.sin(a) * r, Math.cos(a) * r]; }
  var brass = null;

  /* a Gatherer: a robe in folds, a mantle, a belt with its buckle, pouch and strap, sleeves and hands round the hilt, a face under a hood — each a little different */
  function gatherer(n2) {
    var ROBES = ['#6b5438', '#59606a', '#5d6b45', '#7a4f36', '#4f4a63'], SKINS = [0xe2b48c, 0xc98f62, 0xf0c8a0, 0x8a5a3a, 0xd9a878];
    var cloth = function (base) { return new T.MeshLambertMaterial({ side: T.DoubleSide, map: tex(64, 128, [6, 1], function (c, w, h) { c.fillStyle = base; c.fillRect(0, 0, w, h); var gr = c.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, 'rgba(0,0,0,.34)'); gr.addColorStop(0.5, 'rgba(255,255,255,.10)'); gr.addColorStop(1, 'rgba(0,0,0,.34)'); c.fillStyle = gr; c.fillRect(0, 0, w, h); c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(0, h - 10, w, 10); c.fillStyle = 'rgba(255,220,150,.35)'; c.fillRect(0, h - 16, w, 3); }) }); };
    var q = new T.Group(); q.scale.setScalar(0.96 + (n2 % 3) * 0.05);
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
      try { var sb = W.buildSaber({ color: KY[n2], hilt: n2 % 2 ? 'gold' : 'steel' }); sb.position.set(0, 1.12, 0.37); sb.rotation.set(0, 0, 0); q.add(sb); q.userData.sb = sb; } catch (e) {}
    return q;
  }

  /* the traveller: boots, trousers, a tunic and vest, a belt with its pouch, a scarf, goggles pushed up, a pack with a bedroll */
  function traveler(o) {
    o = o || {}; var g = new T.Group(), rig = {}, tunic = L(o.tunic || 0xd9c8a0), dark = L(new T.Color(o.tunic || 0xd9c8a0).multiplyScalar(0.8).getHex()), vest = L(o.vest || 0x6b4a2a), trs = L(o.trousers || 0x3b3f4a), boot = L(0x2a1c12), leather = L(0x4a3220), skin = L(o.skin || 0xe2b48c), hair = L(o.hair || 0x3a2a20, { side: T.DoubleSide }), scarf = L(o.scarf || 0x2f8f8a), pack = L(o.pack || 0x7a5a3a), gold = new T.MeshPhongMaterial({ color: 0xc9a24a, shininess: 60 });
    [-1, 1].forEach(function (s) { var hip = new T.Group(); hip.position.set(s * 0.11, 0.84, 0); g.add(hip); add(hip, new T.BoxGeometry(0.16, 0.62, 0.18), trs, 0, -0.31, 0); add(hip, new T.BoxGeometry(0.18, 0.24, 0.3), boot, 0, -0.72, 0.04); add(hip, new T.BoxGeometry(0.19, 0.05, 0.31), leather, 0, -0.6, 0.04); rig[s < 0 ? 'legL' : 'legR'] = hip; });
    var body = new T.Group(); g.add(body); rig.body = body;
    add(body, new T.BoxGeometry(0.44, 0.58, 0.26), tunic, 0, 1.15, 0); add(body, new T.BoxGeometry(0.47, 0.18, 0.29), tunic, 0, 0.82, 0); [-0.15, 0.15].forEach(function (x) { add(body, new T.BoxGeometry(0.16, 0.5, 0.29), vest, x, 1.17, 0); }); add(body, new T.BoxGeometry(0.46, 0.5, 0.04), vest, 0, 1.17, -0.13);
    add(body, new T.BoxGeometry(0.48, 0.07, 0.3), leather, 0, 0.91, 0); add(body, new T.BoxGeometry(0.08, 0.07, 0.02), gold, 0, 0.91, 0.16); add(body, new T.BoxGeometry(0.12, 0.15, 0.08), leather, 0.2, 0.83, 0.13); add(body, new T.BoxGeometry(0.05, 0.72, 0.02), leather, 0.02, 1.18, 0.15).rotation.z = 0.6;
    var sc = add(body, new T.TorusGeometry(0.15, 0.05, 6, 16), scarf, 0, 1.46, 0.01); sc.rotation.x = Math.PI / 2; add(body, new T.BoxGeometry(0.1, 0.3, 0.04), scarf, 0.1, 1.3, 0.15);
    add(body, new T.BoxGeometry(0.34, 0.44, 0.17), pack, 0, 1.18, -0.23); add(body, new T.BoxGeometry(0.36, 0.14, 0.19), leather, 0, 1.36, -0.23); add(body, new T.CylinderGeometry(0.08, 0.08, 0.42, 10), scarf, 0, 1.49, -0.23).rotation.z = Math.PI / 2; [-0.12, 0.12].forEach(function (x) { add(body, new T.BoxGeometry(0.04, 0.5, 0.3), leather, x, 1.2, -0.02); });
    [-1, 1].forEach(function (s) { var sh = new T.Group(); sh.position.set(s * 0.29, 1.4, 0); body.add(sh); add(sh, new T.BoxGeometry(0.12, 0.34, 0.14), tunic, 0, -0.17, 0); add(sh, new T.BoxGeometry(0.11, 0.28, 0.13), dark, 0, -0.47, 0); add(sh, new T.BoxGeometry(0.12, 0.12, 0.13), leather, 0, -0.66, 0); var h = new T.Group(); h.position.set(0, -0.72, 0.04); sh.add(h); rig[s < 0 ? 'armL' : 'armR'] = sh; rig[s < 0 ? 'handL' : 'handR'] = h; });
    var hd = new T.Group(); hd.position.y = 1.56; body.add(hd); rig.head = hd;
    add(hd, new T.CylinderGeometry(0.06, 0.07, 0.1, 10), skin, 0, 0, 0); var face = add(hd, new T.SphereGeometry(0.16, 16, 12), skin, 0, 0.17, 0); face.scale.set(1, 1.05, 0.95);
    add(hd, new T.SphereGeometry(0.172, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.52), hair, 0, 0.19, -0.01).rotation.x = -0.28; if (o.long) add(hd, new T.BoxGeometry(0.3, 0.26, 0.08), hair, 0, 0.08, -0.13);
    [-1, 1].forEach(function (s) { add(hd, new T.SphereGeometry(0.022, 6, 5), B(0x1a1410), s * 0.06, 0.19, 0.145); add(hd, new T.BoxGeometry(0.055, 0.012, 0.02), hair, s * 0.06, 0.235, 0.148); add(hd, new T.CylinderGeometry(0.045, 0.045, 0.03, 12), gold, s * 0.06, 0.31, 0.12).rotation.x = Math.PI / 2 - 0.5; add(hd, new T.CircleGeometry(0.035, 12), B(0x1e3a5f), s * 0.06, 0.318, 0.134).rotation.x = -0.5; });
    add(hd, new T.ConeGeometry(0.024, 0.06, 6), skin, 0, 0.16, 0.165).rotation.x = Math.PI / 2; add(hd, new T.BoxGeometry(0.06, 0.012, 0.02), L(0x9a4a3a), 0, 0.1, 0.15); var strap = add(hd, new T.TorusGeometry(0.165, 0.014, 4, 18), leather, 0, 0.29, 0); strap.rotation.x = Math.PI / 2 - 0.12;
    var chest = new T.Group(); chest.position.set(-0.13, 1.3, 0.15); body.add(chest); rig.chest = chest;
    g.userData = { rig: rig, ph: 0, mode: '', raise: 0 }; return g;
  }
  function animate(av, dt, speed) {
    var u = av.userData, r = u.rig, amp = Math.min(1, speed / 3); u.ph += speed * dt * 3.3; var sw = Math.sin(u.ph) * amp * 0.75;
    r.legL.rotation.x = sw; r.legR.rotation.x = -sw; r.body.position.y = Math.abs(Math.cos(u.ph)) * 0.03 * amp + Math.sin(clock * 1.7) * 0.004;
    if (u.mode === 'tray') { r.armL.rotation.set(-1.25, 0, 0.12); r.armR.rotation.set(-1.25, 0, -0.12); }
    else if (u.mode === 'saber') { r.armL.rotation.set(-sw * 0.5, 0, 0); r.armR.rotation.set(-0.95 - u.raise * 1.75, 0, -0.1 - u.raise * 0.12); }
    else { r.armL.rotation.set(-sw * 0.8, 0, 0); r.armR.rotation.set(sw * 0.8, 0, 0); }
  }

  /* ================================================================ the place */
  function build() {
    var gy = API.groundY(AT.x, AT.z, 62); S = new T.Group(); S.position.set(AT.x, gy, AT.z); API.scene.add(S);
    brass = new T.MeshPhongMaterial({ color: 0x5e4322, specular: 0x241a0e, shininess: 18 });
    var rock = new T.MeshLambertMaterial({ side: T.DoubleSide, map: tex(256, 256, [10, 2], function (c, w, h) { c.fillStyle = '#3b3028'; c.fillRect(0, 0, w, h); for (var i = 0; i < 300; i++) { c.fillStyle = 'rgba(' + (i % 3 ? '20,14,10' : '120,96,70') + ',.12)'; c.fillRect((i * 97) % w, (i * 61) % h, 10 + i % 40, 3 + i % 7); } c.fillStyle = '#2a211a'; c.fillRect(0, h * 0.46, w, 5); c.fillStyle = '#5a4634'; c.fillRect(0, h * 0.5, w, 3); c.strokeStyle = 'rgba(15,10,6,.6)'; c.lineWidth = 4; c.strokeRect(0, 0, w, h); c.fillStyle = '#6b5a44'; [[18, 18], [w - 24, 18], [18, h - 24], [w - 24, h - 24]].forEach(function (q) { c.fillRect(q[0], q[1], 6, 6); }); }) });
    var rust = new T.MeshLambertMaterial({ side: T.DoubleSide, map: tex(128, 128, [8, 2], function (c, w, h) { c.fillStyle = '#6b4a34'; c.fillRect(0, 0, w, h); for (var i = 0; i < 120; i++) { c.fillStyle = 'rgba(' + (i % 2 ? '40,24,14' : '170,110,70') + ',.14)'; c.fillRect((i * 53) % w, (i * 31) % h, 8 + i % 24, 4 + i % 10); } c.strokeStyle = '#3a2616'; c.lineWidth = 3; c.strokeRect(1, 1, w - 2, h - 2); }) });
    var stone = new T.MeshLambertMaterial({ map: tex(256, 256, [5, 5], function (c, w, h) { c.fillStyle = '#4a4138'; c.fillRect(0, 0, w, h); c.strokeStyle = '#2a241d'; c.lineWidth = 4; c.strokeRect(2, 2, w - 4, h - 4); c.beginPath(); c.moveTo(w / 2, 0); c.lineTo(w / 2, h); c.moveTo(0, h / 2); c.lineTo(w, h / 2); c.stroke(); for (var i = 0; i < 60; i++) { c.fillStyle = 'rgba(255,240,210,.05)'; c.fillRect((i * 71) % w, (i * 37) % h, 14, 3); } }) });
    var sand = new T.MeshLambertMaterial({ map: tex(128, 128, [9, 6], function (c, w, h) { c.fillStyle = '#b9a58a'; c.fillRect(0, 0, w, h); c.strokeStyle = '#8a7860'; c.lineWidth = 3; c.strokeRect(1, 1, w - 2, h - 2); for (var i = 0; i < 40; i++) { c.fillStyle = 'rgba(60,40,20,.08)'; c.fillRect((i * 43) % w, (i * 29) % h, 12, 4); } }) });
    var plaster = new T.MeshLambertMaterial({ side: T.DoubleSide, map: tex(256, 256, [3, 1], function (c, w, h) { c.fillStyle = '#b8a384'; c.fillRect(0, 0, w, h); for (var i = 0; i < 200; i++) { c.fillStyle = 'rgba(' + (i % 2 ? '50,36,22' : '255,240,210') + ',.08)'; c.fillRect((i * 97) % w, (i * 53) % h, 8 + i % 30, 2 + i % 6); } c.fillStyle = 'rgba(50,36,22,.4)'; c.fillRect(0, h * 0.72, w, 6); }) });
    var iron = L(0x2a2118), wood = L(0x4a3826), dark = B(0x120e0b);
    /* floors */
    add(S, new T.CylinderGeometry(R + 0.4, R + 0.4, FY, 48), stone, 0, FY / 2, 0); add(S, new T.BoxGeometry(3.4, FY, 6.4), stone, 0, FY / 2, 12.6); add(S, new T.BoxGeometry(18.4, FY, 11.4), sand, 0, FY / 2, 21);
    var fr = add(S, new T.RingGeometry(4.7, 5.9, 48), B(0x6b5236, { transparent: true, opacity: 0.55 }), 0, FY + 0.01, 0); fr.rotation.x = -Math.PI / 2;
    /* the chamber: the round wall with its way in, the ribs outside, the roof, the dark ceiling */
    var gap = 0.36;
    add(S, new T.CylinderGeometry(R, R, H, 48, 1, true, gap / 2, Math.PI * 2 - gap), rock, 0, H / 2, 0); add(S, new T.CylinderGeometry(R, R, H - 3.5, 8, 1, true, -gap / 2, gap), rock, 0, 3.5 + (H - 3.5) / 2, 0);
    for (var b = 0; b < 16; b++) { var ba = (b + 0.5) / 16 * Math.PI * 2; if (Math.abs(Math.atan2(Math.sin(ba), Math.cos(ba))) < 0.55) continue; var bp = pol(ba, R + 0.25); add(S, new T.BoxGeometry(0.55, H + 0.8, 0.8), L(0x4a3a2a), bp[0], (H + 0.8) / 2, bp[1], ba); }
    add(S, new T.ConeGeometry(R + 1.3, 4.4, 20), rust, 0, H + 2.2, 0); add(S, new T.CylinderGeometry(1.3, 1.6, 1.2, 12), L(0x3a2c20), 0, H + 4.6, 0); add(S, new T.CylinderGeometry(0.06, 0.06, 3, 6), L(0x4b5563), 0.6, H + 6.4, 0); add(S, new T.SphereGeometry(0.16, 8, 6), B(0xef4444), 0.6, H + 7.9, 0);
    add(S, new T.CircleGeometry(R, 40), dark, 0, H - 0.02, 0).rotation.x = Math.PI / 2;
    /* the passage and the front */
    [-1, 1].forEach(function (s) { add(S, new T.BoxGeometry(0.3, 3.7, 5.5), rock, s * 1.7, 1.85, 12.55); add(S, new T.BoxGeometry(0.3, 4.7, 6.6), plaster, s * 5, 2.35, 11.95); add(S, new T.BoxGeometry(3.5, 4.7, 0.4), plaster, s * 3.25, 2.35, 15.2);
      for (var k = 0; k < 3; k++) { add(S, new T.BoxGeometry(0.1, 0.34, 0.2), iron, s * 1.52, 2.3, 10.9 + k * 1.6); add(S, new T.SphereGeometry(0.09, 8, 6), B(0xffb866), s * 1.44, 2.3, 10.9 + k * 1.6); } });
    add(S, new T.BoxGeometry(3.7, 0.3, 5.5), dark, 0, 3.72, 12.55); add(S, new T.BoxGeometry(10.4, 0.35, 6.9), L(0x8c7a60), 0, 4.87, 11.95); add(S, new T.BoxGeometry(3.0, 1.3, 0.4), plaster, 0, 4.05, 15.2);
    [-1, 1].forEach(function (s) { var d = add(S, new T.BoxGeometry(1.5, 3.4, 0.16), L(0x3a2c20), s * 0.75, 1.7 + FY, 15.2); add(d, new T.BoxGeometry(1.2, 0.12, 0.18), B(0xf97316), 0, 0.4, 0); add(d, new T.BoxGeometry(1.2, 1.1, 0.18), L(0x4a3a2a), 0, -0.7, 0); amb.doors.push({ m: d, x0: s * 0.75, s: s }); });
    var sgn = document.createElement('canvas'); sgn.width = 768; sgn.height = 192; var q2 = sgn.getContext('2d'); q2.fillStyle = '#17120d'; q2.fillRect(0, 0, 768, 192); q2.strokeStyle = '#c9a24a'; q2.lineWidth = 10; q2.strokeRect(6, 6, 756, 180); q2.fillStyle = '#e8d9b8'; q2.textAlign = 'center'; q2.font = '800 62px Georgia, serif'; q2.fillText("SAVI'S WORKSHOP", 384, 80); q2.fillStyle = '#a78bfa'; q2.font = '700 40px "PingFang SC",sans-serif'; q2.fillText('萨维的工坊 · 手工光剑', 384, 146);
    add(S, new T.PlaneGeometry(6.4, 1.6), new T.MeshBasicMaterial({ map: new T.CanvasTexture(sgn) }), 0, 6.0, 15.46); add(S, new T.BoxGeometry(6.7, 1.9, 0.2), iron, 0, 6.0, 15.32); [-3, 3].forEach(function (x) { add(S, new T.BoxGeometry(0.16, 1.2, 0.16), iron, x, 5.3, 15.3); });
    var awn = add(S, new T.BoxGeometry(5.2, 0.12, 2.2), L(0x7a3a2a), 0, 4.0, 16.3); awn.rotation.x = 0.22; [-2.4, 2.4].forEach(function (x) { add(S, new T.CylinderGeometry(0.06, 0.06, 3.7, 6), iron, x, 1.9, 17.3); });
    /* the yard: posts and a string of lamps, heaps of scrap, crates, the four hilt displays, the Gatherer who checks guests in */
    for (var f = 0; f < 14; f++) { var fx = f < 5 ? -9 : f < 10 ? 9 : -6.75 + (f - 10) * 4.5, fz = f < 10 ? 16.4 + (f % 5) * 2.35 : 26.5; if (f >= 10 && Math.abs(fx) < 3) continue; add(S, new T.CylinderGeometry(0.07, 0.09, 2.8, 6), wood, fx, 1.4, fz); add(S, new T.SphereGeometry(0.11, 8, 6), B(f % 2 ? 0xffc46b : 0x9bd8ff), fx, 2.9, fz); }
    [-2.6, 2.6].forEach(function (x) { add(S, new T.BoxGeometry(0.3, 4.2, 0.3), wood, x, 2.1, 26.5); }); add(S, new T.BoxGeometry(5.8, 0.3, 0.3), wood, 0, 4.2, 26.5);
    var heap = function (x, z, n, seed) { for (var i = 0; i < n; i++) { var rr = function (k) { var v = Math.sin((seed + i * 7.3 + k) * 91.7) * 43758.5; return v - Math.floor(v); }, col = [0x6b4a34, 0x4b5563, 0x8a6a44, 0x3a3d44, 0x7a3a2a, 0x9aa3ad][Math.floor(rr(1) * 6)], w = 0.3 + rr(2) * 0.8, m = rr(3) > 0.5 ? new T.BoxGeometry(w, 0.2 + rr(4) * 0.6, 0.3 + rr(5) * 0.7) : new T.CylinderGeometry(w * 0.4, w * 0.4, 0.3 + rr(4) * 0.9, 10); var o = add(S, m, L(col), x + (rr(6) - 0.5) * 2.2, FY + 0.2 + rr(7) * 0.9, z + (rr(8) - 0.5) * 1.6); o.rotation.set(rr(9) * 1.2, rr(10) * 3, rr(11) * 1.2); } };
    heap(-7.2, 17.4, 16, 1); heap(7.2, 17.6, 16, 5); heap(-7.6, 24.6, 9, 9); heap(7.6, 24.4, 9, 13);
    add(S, new T.BoxGeometry(1.5, 0.95, 0.7), wood, -3.4, FY + 0.48, 16.9); add(S, new T.BoxGeometry(1.6, 0.06, 0.8), L(0x8a6a44), -3.4, FY + 0.98, 16.9); var clerk = gatherer(3); clerk.position.set(-3.4, FY, 16.2); S.add(clerk); if (clerk.userData.sb) clerk.userData.sb.visible = false; amb.clerk = clerk;
    PARTS.THEMES.forEach(function (t, i) {
      var x = -4.5 + i * 3, z = 20.3; add(S, new T.CylinderGeometry(0.5, 0.6, 0.14, 20), iron, x, FY + 0.07, z); add(S, new T.CylinderGeometry(0.1, 0.14, 1.1, 10), wood, x, FY + 0.6, z); add(S, new T.CylinderGeometry(0.34, 0.2, 0.12, 14), brass, x, FY + 1.2, z);
      var sm = PARTS.saber({ theme: t.id, color: KY[i], sleeves: [i % 4, (i + 2) % 4], emitter: i % 2, pommel: (i + 1) % 2, sw: i % 2 }); sm.userData.blade.visible = false; sm.scale.setScalar(2.8); sm.position.set(x, FY + 1.85, z); S.add(sm); amb.spin.push(sm);
      add(S, new T.CylinderGeometry(0.05, 0.05, 3.4, 6), wood, x, FY + 1.7, z - 0.75); add(S, new T.PlaneGeometry(1.25, 1.25), new T.MeshBasicMaterial({ map: Kit.label(t.icon, '', t.bg) }), x, FY + 3.2, z - 0.7); add(S, new T.BoxGeometry(1.4, 1.4, 0.06), wood, x, FY + 3.2, z - 0.75);
      var pad = add(S, new T.TorusGeometry(0.85, 0.06, 6, 28), B(t.bg), x, FY + 0.05, 22.1); pad.rotation.x = Math.PI / 2; amb.peds.push({ t: t, x: x, z: 22.1, pad: pad, saber: sm });
    });
    /* the ring counter: a station for every builder on its outside, each with its mat and its activation chamber */
    var top = new T.MeshLambertMaterial({ map: tex(512, 512, [1, 1], function (c, w, h) { c.fillStyle = '#4a3826'; c.fillRect(0, 0, w, h); c.translate(w / 2, h / 2); for (var i = 0; i < 24; i++) { c.rotate(Math.PI / 12); c.fillStyle = i % 2 ? '#5a4630' : '#4a3826'; c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, 256, 0, Math.PI / 12); c.fill(); c.strokeStyle = '#2a2118'; c.lineWidth = 2; c.beginPath(); c.moveTo(170, 0); c.lineTo(256, 0); c.stroke(); } [250, 176].forEach(function (r) { c.strokeStyle = '#9a7a44'; c.lineWidth = 5; c.beginPath(); c.arc(0, 0, r, 0, 7); c.stroke(); }); }) });
    var panel = new T.MeshLambertMaterial({ side: T.DoubleSide, map: tex(128, 128, [24, 1], function (c, w, h) { c.fillStyle = '#3a2c1e'; c.fillRect(0, 0, w, h); c.fillStyle = '#231a11'; c.fillRect(0, 0, 12, h); c.fillRect(w - 12, 0, 12, h); c.fillStyle = '#6b5236'; c.fillRect(26, 16, w - 52, h - 32); c.fillStyle = '#3a2c1e'; c.fillRect(34, 24, w - 68, h - 48); c.fillStyle = '#c9a24a'; [[18, 8], [w - 24, 8], [18, h - 14], [w - 24, h - 14]].forEach(function (q) { c.fillRect(q[0], q[1], 6, 6); }); }) });
    add(S, new T.CylinderGeometry(4.4, 4.5, 1.05, 48, 1, true), panel, 0, FY + 0.525, 0); add(S, new T.CylinderGeometry(3.0, 3.0, 1.05, 40, 1, true), panel, 0, FY + 0.525, 0);
    var ct = add(S, new T.RingGeometry(2.95, 4.45, 64), top, 0, FY + 1.05, 0); ct.rotation.x = -Math.PI / 2; [2.98, 4.44].forEach(function (r) { var rm = add(S, new T.TorusGeometry(r, 0.05, 6, 64), brass, 0, FY + 1.05, 0); rm.rotation.x = Math.PI / 2; });
    for (var st = 0; st < 12; st++) { var sg = new T.Group(); sg.rotation.y = st * Math.PI / 6; S.add(sg);
      add(sg, new T.BoxGeometry(1.5, 0.02, 0.86), L(0x1c2430), 0, FY + 1.065, 3.72); add(sg, new T.BoxGeometry(1.54, 0.012, 0.9), brass, 0, FY + 1.058, 3.72);
      var tb = new T.Group(); tb.position.set(1.02, FY + 1.06, 3.74); sg.add(tb); add(tb, new T.CylinderGeometry(0.13, 0.13, 0.7, 18, 1, true), L(0xf1f5f9, { side: T.DoubleSide }), 0, 0.37, 0); add(tb, new T.CylinderGeometry(0.16, 0.18, 0.06, 18), L(0x6b7280), 0, 0.03, 0); add(tb, new T.TorusGeometry(0.13, 0.014, 6, 20), L(0x6b7280), 0, 0.72, 0).rotation.x = Math.PI / 2;
      var gl = add(tb, new T.CylinderGeometry(0.115, 0.115, 0.68, 14, 1, true), B(0xffffff, { transparent: true, opacity: 0, side: T.DoubleSide }), 0, 0.37, 0); amb.tubes.push({ g: tb, glow: gl });
      add(sg, new T.SphereGeometry(0.06, 8, 6), B(0xffc46b), -0.86, FY + 1.12, 4.2); }
    /* the middle: the dais, the great crystal under its beam, and the Gatherers inside the ring */
    add(S, new T.CylinderGeometry(1.5, 1.7, 0.3, 28), L(0x2a2118), 0, FY + 0.15, 0); add(S, new T.CylinderGeometry(0.34, 0.5, 1.5, 14), brass, 0, FY + 1.05, 0);
    for (var cl = 0; cl < 3; cl++) { var claw = add(S, new T.ConeGeometry(0.07, 0.6, 6), brass, Math.sin(cl * 2.094) * 0.26, FY + 2.0, Math.cos(cl * 2.094) * 0.26); claw.rotation.set(-Math.cos(cl * 2.094) * 0.45, 0, Math.sin(cl * 2.094) * 0.45); }
    amb.great = add(S, new T.OctahedronGeometry(0.36, 0), B(0xdff4ff), 0, FY + 2.5, 0); amb.great.scale.y = 1.6;
    amb.beam = add(S, new T.CylinderGeometry(0.7, 0.2, H - 3.2, 16, 1, true), B(0x9bd8ff, { transparent: true, opacity: 0.22, side: T.DoubleSide, depthWrite: false }), 0, FY + 2.7 + (H - 3.2) / 2, 0);
    for (var g5 = 0; g5 < 5; g5++) { var ga = g5 * Math.PI * 2 / 5, gp = pol(ga, 2.25), gt = gatherer(g5); gt.position.set(gp[0], FY, gp[1]); gt.rotation.y = ga; S.add(gt); amb.gath.push({ g: gt, sb: gt.userData.sb, ry: ga, ph: g5 * 1.3 }); }
    /* overhead: the ring of light, the trusses, scrap on cables */
    amb.ring = add(S, new T.TorusGeometry(4.3, 0.16, 8, 56), B(0xffd9a0), 0, H - 0.9, 0); amb.ring.rotation.x = Math.PI / 2; var r2 = add(S, new T.TorusGeometry(4.3, 0.3, 6, 56), iron, 0, H - 0.72, 0); r2.rotation.x = Math.PI / 2;
    for (var tr = 0; tr < 8; tr++) { var tp = pol(tr * Math.PI / 4, 7.1); add(S, new T.BoxGeometry(0.2, 0.3, 5.6), iron, tp[0], H - 0.5, tp[1], tr * Math.PI / 4); if (tr % 2) { var hp = pol(tr * Math.PI / 4 + 0.3, 6.6); add(S, new T.CylinderGeometry(0.015, 0.015, 1.6, 4), iron, hp[0], H - 0.9, hp[1]); add(S, tr % 4 === 1 ? new T.CylinderGeometry(0.3, 0.22, 0.7, 10) : new T.BoxGeometry(0.6, 0.4, 0.5), L(tr % 4 === 1 ? 0x6b7280 : 0x7a4a2a), hp[0], H - 1.9, hp[1], tr); } }
    /* the wall: lit niches of parts; the kyber alcove (to the left of the way in); the parts carts (to the right) */
    for (var n = 0; n < 16; n++) { var na = (n + 0.5) * Math.PI / 8, d = Math.abs(Math.atan2(Math.sin(na), Math.cos(na))); if (d < 0.5 || Math.abs(d - Math.PI / 2) < 0.52) continue; var np = pol(na, R - 0.25), ng = new T.Group(); ng.position.set(np[0], FY, np[1]); ng.rotation.y = na + Math.PI; S.add(ng);
      add(ng, new T.PlaneGeometry(2.0, 2.2), B(0xffb866, { transparent: true, opacity: 0.5 }), 0, 2.3, 0.06); add(ng, new T.BoxGeometry(2.3, 0.14, 0.5), wood, 0, 1.2, 0.25); add(ng, new T.BoxGeometry(2.3, 0.1, 0.5), wood, 0, 2.3, 0.25); add(ng, new T.BoxGeometry(2.5, 0.2, 0.3), iron, 0, 3.5, 0.12); [-1.2, 1.2].forEach(function (x) { add(ng, new T.BoxGeometry(0.16, 2.6, 0.3), iron, x, 2.3, 0.12); });
      for (var k = 0; k < 5; k++) { var th = PARTS.THEMES[(n + k) % 4].id, pc = PARTS.hiltPart(['emitter', 'sleeve', 'pommel', 'sleeve', 'emitter'][k], th, (n + k) % 2); pc.scale.setScalar(3.2); pc.position.set(-0.8 + k * 0.4, k % 2 ? 2.5 : 1.42, 0.28); ng.add(pc); } }
    var AL = -Math.PI / 2, CR = Math.PI / 2, ap = pol(AL, R - 0.3); var arch = new T.Group(); arch.position.set(ap[0], FY, ap[1]); arch.rotation.y = AL + Math.PI; S.add(arch);
    add(arch, new T.PlaneGeometry(6.2, 3.6), B(0x1e2a5a, { transparent: true, opacity: 0.85 }), 0, 2.0, 0.08); [-3.2, 3.2].forEach(function (x) { add(arch, new T.BoxGeometry(0.4, 4.2, 0.6), iron, x, 2.1, 0.3); }); add(arch, new T.BoxGeometry(6.8, 0.4, 0.6), iron, 0, 4.2, 0.3);
    PARTS.KYBER.forEach(function (k, i) { var a = AL + (i - 1.5) * 0.19, p = pol(a, 8.3), f = pol(a, 7.05);
      add(S, new T.CylinderGeometry(0.22, 0.3, 1.05, 12), iron, p[0], FY + 0.52, p[1]); add(S, new T.CylinderGeometry(0.3, 0.3, 0.06, 12), brass, p[0], FY + 1.08, p[1]);
      var m = add(S, new T.OctahedronGeometry(0.18, 0), B(k[0]), p[0], FY + 1.5, p[1]); m.scale.y = 1.5; add(S, new T.CylinderGeometry(0.34, 0.1, 2.2, 12, 1, true), B(k[0], { transparent: true, opacity: 0.16, side: T.DoubleSide, depthWrite: false }), p[0], FY + 2.6, p[1]);
      var pad = add(S, new T.TorusGeometry(0.6, 0.05, 6, 24), B(k[0]), f[0], FY + 0.05, f[1]); pad.rotation.x = Math.PI / 2; amb.crystals.push({ k: k, m: m, x: f[0], z: f[1], px: p[0], pz: p[1], pad: pad }); });
    PARTS.THEMES.forEach(function (t, i) { var a = CR + (i - 1.5) * 0.19, p = pol(a, 8.25), f = pol(a, 6.95), cg = new T.Group(); cg.position.set(p[0], FY, p[1]); cg.rotation.y = a + Math.PI; S.add(cg);
      add(cg, new T.BoxGeometry(1.1, 0.7, 0.7), wood, 0, 0.6, 0); add(cg, new T.BoxGeometry(1.2, 0.06, 0.8), brass, 0, 0.98, 0); [[-0.45, 0.3], [0.45, 0.3], [-0.45, -0.3], [0.45, -0.3]].forEach(function (q) { add(cg, new T.CylinderGeometry(0.14, 0.14, 0.08, 12), iron, q[0], 0.14, q[1]).rotation.z = Math.PI / 2; });
      add(cg, new T.PlaneGeometry(0.6, 0.6), new T.MeshBasicMaterial({ map: Kit.label(t.icon, '', t.bg) }), 0, 0.6, 0.36); add(cg, new T.CylinderGeometry(0.04, 0.04, 1.6, 6), iron, 0.5, 1.8, -0.3); add(cg, new T.SphereGeometry(0.12, 8, 6), B(t.bg), 0.5, 2.65, -0.3);
      var tray = trayOf(t.id); tray.position.set(0, 1.02, 0); cg.add(tray);
      var pad = add(S, new T.TorusGeometry(0.6, 0.05, 6, 24), B(t.bg), f[0], FY + 0.05, f[1]); pad.rotation.x = Math.PI / 2; amb.carts.push({ t: t, x: f[0], z: f[1], pad: pad, tray: tray, g: cg }); });
    /* other travellers at their stations */
    [[1.05, 0], [2.6, 1], [-2.6, 2], [-1.05, 3]].forEach(function (q, i) { var p = pol(q[0], 5.25), n2 = traveler([{ tunic: 0x8fa3b8, vest: 0x3a4a5a, scarf: 0xd97706, hair: 0x191514, skin: 0xc98f62 }, { tunic: 0xc9b08a, vest: 0x5a3a4a, scarf: 0x7c3aed, hair: 0x6b4a2a, long: 1 }, { tunic: 0x9aa88a, vest: 0x4a4a3a, scarf: 0xb3202a, hair: 0xc9a24a, skin: 0xf0c8a0, long: 1 }, { tunic: 0xb8a0a0, vest: 0x3a2c20, scarf: 0x16a34a, hair: 0x3a2a20, skin: 0x8a5a3a }][i]); n2.position.set(p[0], FY, p[1]); n2.rotation.y = q[0] + Math.PI; n2.scale.setScalar(0.92 + i * 0.03); S.add(n2);
      var sb = PARTS.saber({ theme: PARTS.THEMES[q[1]].id, color: KY[(i + 1) % 4], sleeves: [i % 4, (i + 1) % 4], emitter: i % 2, pommel: i % 2, sw: 0 }); sb.userData.blade.visible = false; sb.position.set(0, 0.12, 0); sb.rotation.x = Math.PI / 2 - 0.2; n2.userData.rig.handR.add(sb); n2.userData.mode = 'saber'; amb.npcs.push({ g: n2, sb: sb }); });
    var lamp = new T.PointLight(0xffd9a0, 0.9, 24, 2); lamp.position.set(0, H - 1.6, 0); S.add(lamp); amb.lamp = lamp;
    var e = { id: 'savi-yard', name: '萨维的工坊 · 亲手造一把光剑', x: AT.x, z: AT.z + 21 }; Object.defineProperty(e, 'msg', { get: function () { setTimeout(start, 0); return '⚔️'; } }); API.getProps().interactables.push(e);
  }
  function trayOf(theme) {   /* the tray of parts for one theme: four sleeves, two emitters, two pommels, two plates */
    var g = new T.Group(); add(g, new T.BoxGeometry(0.9, 0.04, 0.5), L(0x1f1811), 0, 0, 0); [[-0.45, 0.02, 0.5], [0.45, 0.02, 0.5]].forEach(function (q) { add(g, new T.BoxGeometry(0.03, 0.08, q[2]), L(0x3a2616), q[0], 0.04, 0); });
    [['sleeve', 0], ['sleeve', 1], ['sleeve', 2], ['sleeve', 3], ['emitter', 0], ['emitter', 1], ['pommel', 0], ['pommel', 1], ['switch', 0], ['switch', 1]].forEach(function (q, i) { var p = PARTS.hiltPart(q[0], theme, q[1]); p.scale.setScalar(1.7); p.position.set(-0.36 + (i % 5) * 0.18, 0.1, i < 5 ? 0.12 : -0.12); g.add(p); });
    return g;
  }

  /* ================================================================ the HUD: a picture and a few words; the Gatherer speaks the rest */
  function ensureHud() {
    if (hud) return; var el = document.createElement('div'); el.id = 'savi';
    el.innerHTML = '<div id="savi-dim"></div><div class="top"><b id="savi-ic"></b><span id="savi-cap"></span><div id="savi-dots"></div><div id="savi-chips"></div></div><div id="savi-ring"><i></i></div>' +
      '<button type="button" id="savi-x" title="离开 (Esc)">✕</button><button type="button" id="savi-act"></button>' +
      '<div id="savi-pad"><button type="button" data-k="ArrowUp">▲</button><button type="button" data-k="ArrowLeft">◀</button><button type="button" data-k="ArrowDown">▼</button><button type="button" data-k="ArrowRight">▶</button></div>';
    document.body.appendChild(el);
    var css = document.createElement('style');
    css.textContent = '#savi{position:fixed;inset:0;z-index:90;pointer-events:none;display:none;font-family:-apple-system,"PingFang SC",sans-serif}body.savi-on #savi{display:block}body.savi-on #tp-action-prompt,body.savi-on #hint,body.savi-on #hotbar,body.savi-on #mmWrap,body.savi-on #title,body.savi-on #mip-fab,body.savi-on #crosshair,body.savi-on #sw-saber-btn,body.savi-on #toast{display:none!important}' +
      '#savi .top{position:absolute;left:50%;top:14px;transform:translateX(-50%);padding:8px 20px 10px;border-radius:22px;background:rgba(10,14,26,.82);border:1.5px solid rgba(125,211,252,.7);color:#fde68a;text-align:center}#savi-ic{font-size:34px;vertical-align:middle;margin-right:10px}#savi-cap{font-size:19px;font-weight:800;vertical-align:middle;letter-spacing:.05em}' +
      '#savi-dots{margin-top:6px}#savi-dots i{display:inline-block;width:9px;height:9px;border-radius:50%;margin:0 4px;background:rgba(255,255,255,.22)}#savi-dots i.on{background:#fde047;box-shadow:0 0 8px #fde047}#savi-dots i.ok{background:#4ade80}' +
      '#savi-chips{display:flex;gap:8px;justify-content:center;margin-top:8px}#savi-chips:empty{display:none}#savi-chips span{min-width:44px;padding:4px 9px;border-radius:999px;background:rgba(255,255,255,.08);border:1.5px solid rgba(255,255,255,.25);font-size:19px}#savi-chips span.now{border-color:#fde047;background:rgba(253,224,71,.18)}#savi-chips span.ok{border-color:#4ade80;opacity:.55}' +
      '#savi-ring{position:absolute;left:50%;bottom:132px;transform:translateX(-50%);width:240px;height:12px;border-radius:999px;background:rgba(10,14,26,.8);border:1.5px solid #7dd3fc;overflow:hidden;display:none}#savi-ring i{display:block;height:100%;width:0;background:linear-gradient(90deg,#38bdf8,#fde047)}' +
      '#savi-x{pointer-events:auto;position:absolute;right:16px;top:16px;width:44px;height:44px;border-radius:50%;border:1.5px solid rgba(255,255,255,.4);background:rgba(10,14,26,.85);color:#fff;font-size:18px;cursor:pointer}' +
      '#savi-act{pointer-events:auto;display:none;position:absolute;right:28px;bottom:40px;width:92px;height:92px;border-radius:50%;border:3px solid #fde047;background:radial-gradient(circle,#1e3a8a,#0b1020);font-size:42px;cursor:pointer;box-shadow:0 0 26px rgba(253,224,71,.55);touch-action:none;animation:saviPulse 1.1s infinite}@keyframes saviPulse{50%{transform:scale(1.08)}}' +
      '#savi-pad{pointer-events:auto;position:absolute;left:24px;bottom:30px;display:none;grid-template-columns:repeat(3,58px);grid-template-rows:repeat(2,58px);gap:6px}#savi-pad button{border-radius:16px;border:1.5px solid #7dd3fc;background:rgba(10,14,26,.72);color:#e0f2fe;font-size:22px;cursor:pointer;touch-action:none}#savi-pad button[data-k=ArrowUp]{grid-column:2;grid-row:1}#savi-pad button[data-k=ArrowLeft]{grid-column:1;grid-row:2}#savi-pad button[data-k=ArrowDown]{grid-column:2;grid-row:2}#savi-pad button[data-k=ArrowRight]{grid-column:3;grid-row:2}' +
      '#savi-dim{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 55%,rgba(0,0,0,0) 20%,rgba(2,4,12,.9) 80%);opacity:0;transition:opacity 1.6s}';
    document.head.appendChild(css);
    hud = { el: el, ic: el.querySelector('#savi-ic'), cap: el.querySelector('#savi-cap'), dots: el.querySelector('#savi-dots'), chips: el.querySelector('#savi-chips'), ring: el.querySelector('#savi-ring'), bar: el.querySelector('#savi-ring i'), act: el.querySelector('#savi-act'), pad: el.querySelector('#savi-pad'), dim: el.querySelector('#savi-dim') };
    el.querySelector('#savi-x').onclick = function (e) { e.stopPropagation(); stop(false); };
    hud.act.addEventListener('pointerdown', function (e) { e.preventDefault(); e.stopPropagation(); keys.Act = true; if (X && X.onAct) X.onAct(); }); ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (ev) { hud.act.addEventListener(ev, function () { keys.Act = false; }); });
    [].forEach.call(hud.pad.querySelectorAll('button'), function (b) { var k = b.dataset.k; b.addEventListener('pointerdown', function (e) { e.preventDefault(); e.stopPropagation(); keys[k] = true; }); ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (ev) { b.addEventListener(ev, function () { keys[k] = false; }); }); });
  }
  function cap(icon, text, n) { hud.ic.textContent = icon; hud.cap.textContent = text; var h = ''; for (var i = 0; i < 7; i++) h += '<i class="' + (i < n ? 'ok' : i === n ? 'on' : '') + '"></i>'; hud.dots.innerHTML = h; }
  function say(text) { try { var ss = root.speechSynthesis; if (ss && root.SpeechSynthesisUtterance) { ss.cancel(); var u = new root.SpeechSynthesisUtterance(text); u.lang = 'zh-CN'; u.rate = 1.0; u.pitch = 0.9; ss.speak(u); } } catch (e) {} }
  function actBtn(icon) { hud.act.style.display = icon ? 'block' : 'none'; if (icon) hud.act.textContent = icon; }
  function tween(o, to, dur, cb) { X.tw = X.tw.filter(function (w) { return w.o !== o; }); X.tw.push({ o: o, p0: o.position.clone(), p1: to.pos ? new T.Vector3(to.pos[0], to.pos[1], to.pos[2]) : null, r0: o.rotation.clone(), r1: to.rot || null, s0: o.scale.x, s1: to.scale == null ? null : to.scale, t: 0, d: dur || 0.5, cb: cb, arc: to.arc || 0 }); }
  function later(sec, fn) { X.timers.push({ t: sec, fn: fn }); }
  function hot(o, opt) { o.userData.hx = opt; opt.on = opt.on !== false; if (X.hot.indexOf(o) < 0) X.hot.push(o); return o; }
  function mark(list) { X.marks = (list || []).filter(Boolean); }
  function goals(list) { X.goals = list || []; X.dwell = 0; }

  /* ================================================================ the experience */
  function start() {
    if (X || !S) return; ensureHud();
    try { if (document.pointerLockElement) document.exitPointerLock(); } catch (e) {}
    API.setUI(true); W.busy(true); document.body.classList.add('savi-on'); hud.pad.style.display = 'grid'; hud.dim.style.opacity = 0; hud.chips.innerHTML = ''; actBtn(null);
    var av = traveler(); av.position.set(0, FY, 24.6); av.rotation.y = Math.PI; S.add(av); var tmp = new T.Group(); S.add(tmp);
    X = { av: av, ax: 0, az: 24.6, ah: Math.PI, speed: 0, camYaw: 0, mode: 'walk', tw: [], timers: [], hot: [], marks: [], goals: [], undo: [], tmp: tmp, spec: { theme: null, color: null }, cp: null, ct: null, done: false, raise: 0 };
    X.undo.push(function () { S.remove(av); S.remove(tmp); });
    themeStep();
  }
  function stop(done) {
    if (!X) return; var x = X; X = null; x.undo.forEach(function (f) { try { f(); } catch (e) {} });
    (amb.beacons || []).forEach(function (b) { b.visible = false; }); (amb.marks || []).forEach(function (m) { m.visible = false; });
    try { root.speechSynthesis.cancel(); } catch (e) {} document.body.classList.remove('savi-on'); API.canvas.style.cursor = ''; keys = {};
    amb.lamp.intensity = 0.9; amb.ring.material.color.set(0xffd9a0); amb.beam.material.color.set(0x9bd8ff); amb.gath.forEach(function (q) { if (q.sb) { q.sb.userData.blade.visible = true; q.sb.userData.blade.scale.y = 1; q.sb.position.y = 1.12; } }); amb.npcs.forEach(function (n) { n.sb.userData.blade.visible = false; n.g.userData.raise = 0; }); amb.tubes[0].glow.material.opacity = 0;
    if (!done) W.hum(false);
    API.setUI(false); W.busy(false);
    var p = done ? [AT.x, AT.z + 6.6] : [AT.x, AT.z + 24.5]; API.teleport({ mode: 'walk', p: [p[0], API.groundY(p[0], p[1], 62) + (done ? FY : 0), p[1]], t: [AT.x, S.position.y + 1.8, AT.z] });
  }
  /* 1 — the yard: choose a path */
  function themeStep() {
    cap('🧭', '选一条道路', 0); say('欢迎来到萨维的工坊。四把剑柄，四条道路。走到你喜欢的那一把面前。');
    goals(amb.peds.map(function (p) { return { x: p.x, z: p.z, r: 0.95, col: p.t.bg, go: function () {
      X.spec.theme = p.t.id; Kit.snd.chime(); var pin = add(X.av.userData.rig.chest, new T.CylinderGeometry(0.055, 0.055, 0.014, 16), B(p.t.bg), 0, 0, 0); pin.rotation.x = Math.PI / 2; add(X.av.userData.rig.chest, new T.TorusGeometry(0.055, 0.008, 4, 16), brass, 0, 0, 0.004);
      amb.peds.forEach(function (o) { o.pad.visible = o === p; }); X.undo.push(function () { amb.peds.forEach(function (o) { o.pad.visible = true; }); });
      later(0.6, crystalStep); } }; }));
  }
  /* 2 — the alcove: a crystal chooses you */
  function crystalStep() {
    cap('💎', '去找你的水晶', 1); say('徽章别好了。里面请——凯伯水晶在左手边的壁龛里。哪一颗在呼唤你，就走到它面前。');
    goals(amb.crystals.map(function (c) { return { x: c.x, z: c.z, r: 0.75, col: c.k[0], go: function () {
      X.spec.color = c.k[0]; Kit.snd.chime(); Kit.tone(1760, 1.2, 'sine', 0.05); c.m.visible = false; X.undo.push(function () { c.m.visible = true; });
      var gem = add(X.tmp, new T.OctahedronGeometry(0.1, 0), B(c.k[0]), c.px, FY + 1.5, c.pz); gem.scale.y = 1.5; X.gem = gem;
      later(0.7, trayStep); } }; }));
  }
  /* 3 — the carts: the tray of your path */
  function trayStep() {
    var t = PARTS.THEMES.filter(function (q) { return q.id === X.spec.theme; })[0], cart = amb.carts.filter(function (c) { return c.t === t; })[0];
    cap(t.icon, '拿你的零件盘', 2); say('水晶选中了你。对面墙边的零件车上，有你这条道路的零件盘。去把它端过来。');
    goals([{ x: cart.x, z: cart.z, r: 0.8, col: t.bg, go: function () {
      cart.tray.visible = false; X.undo.push(function () { cart.tray.visible = true; }); Kit.snd.latch();
      var tray = trayOf(t.id); tray.position.set(0, 1.02, 0.46); X.av.add(tray); X.tray = tray; X.av.userData.mode = 'tray';
      later(0.4, stationStep); } }]);
  }
  /* 4 — your station at the ring */
  function stationStep() {
    cap('🛠', '到你的工位', 3); say('端稳了。圆台边上亮着光的那一格，就是你的工位。');
    goals([{ x: 0, z: 5.35, r: 0.8, col: '#fde047', go: buildStep }]);
  }
  /* 5 — build the hilt with your hands */
  var K = 2.2, C = [0, FY + 1.24, 3.66], ORDER = ['crystal', 'switch', 'sleeve', 'emitter', 'pommel'], ICON = { crystal: '💎', 'switch': '🔘', sleeve: '▮▮', emitter: '🔺', pommel: '🔩' };
  function buildStep() {
    var x = X; x.mode = 'close'; x.av.visible = false; x.av.remove(x.tray); x.av.userData.mode = ''; hud.pad.style.display = 'none'; x.ax = 0; x.az = 5.35; x.ah = Math.PI;
    x.cam = { p: [0, FY + 2.25, 5.2], t: [0, FY + 1.15, 3.72] }; cap('🖐', '动手组装', 4); say('把零件拖到剑柄上。先放水晶，再扣激活板，然后两段握套，最后是发射口和尾盖。');
    var loose = [], mounted = { 'switch': null, sleeveA: null, sleeveB: null, emitter: null, pommel: null }, seated = false, gem = x.gem;
    var core = PARTS.chassis(null); core.scale.setScalar(K); core.position.set(C[0], C[1], C[2]); core.rotation.z = -Math.PI / 2; x.tmp.add(core);
    [-0.2, 0.2].forEach(function (dx) { add(x.tmp, new T.BoxGeometry(0.03, 0.12, 0.1), brass, dx, C[1] - 0.08, C[2]); });
    tween(gem, { pos: [-0.68, C[1] + 0.1, 3.72], scale: 0.9 }, 0.6);
    function need() { return !seated ? 'crystal' : !mounted['switch'] ? 'switch' : (!mounted.sleeveA || !mounted.sleeveB) ? 'sleeve' : !mounted.emitter ? 'emitter' : !mounted.pommel ? 'pommel' : 'done'; }
    function refresh() { var n = need(), ni = n === 'done' ? 9 : ORDER.indexOf(n); hud.chips.innerHTML = ORDER.map(function (k, i) { return '<span class="' + (i < ni ? 'ok' : i === ni ? 'now' : '') + '">' + ICON[k] + '</span>'; }).join('');
      mark(n === 'crystal' ? [gem] : loose.filter(function (p) { return p.userData.kind === n && !p.userData.slot; })); if (n === 'done') { mark([]); later(0.5, screwStep); } }
    function home(p) { if (p.userData.slot) { mounted[p.userData.slot] = null; p.userData.slot = null; } tween(p, { pos: p.userData.home, rot: new T.Euler(0, 0, 0), arc: 0.1 }, 0.35); }
    function fit(p) {
      var kind = p.userData.kind, n = need(), ki = ORDER.indexOf(kind), ni = n === 'done' ? 9 : ORDER.indexOf(n);
      if (ki > ni) { Kit.snd.buzz(); home(p); return; }
      if (kind === 'crystal') { if (seated) return; seated = true; gem.userData.hx.on = false; Kit.snd.chime(); tween(gem, { pos: [C[0] - 0.005 * K, C[1], C[2]], scale: 0.3 }, 0.4, function () { gem.visible = false; core.userData.gem.visible = true; core.userData.gem.material.color.set(x.spec.color); core.userData.glass.material.color.set(x.spec.color); core.userData.glass.material.opacity = 0.6; Kit.tone(1320, 0.8, 'sine', 0.08); refresh(); }); return; }
      var slot = kind === 'sleeve' ? (!mounted.sleeveA ? 'sleeveA' : !mounted.sleeveB ? 'sleeveB' : 'sleeveA') : kind;
      if (mounted[slot] && mounted[slot] !== p) home(mounted[slot]);
      if (p.userData.slot && p.userData.slot !== slot) mounted[p.userData.slot] = null;
      mounted[slot] = p; p.userData.slot = slot; tween(p, { pos: [C[0] + PARTS.SLOT_Y[slot] * K, C[1], C[2]], rot: new T.Euler(0, 0, -Math.PI / 2), arc: 0.1 }, 0.3, function () { Kit.snd.latch(); }); refresh();
    }
    var dragOpt = function (p) { return { tap: function () { if (p.userData.slot) { home(p); Kit.snd.tick(); refresh(); } else fit(p); }, drop: function () { var d = p.position; if (Math.abs(d.z - C[2]) < 0.26 && Math.abs(d.x - C[0]) < 0.62) fit(p); else { home(p); refresh(); } }, drag: true }; };
    var lay = function (kind, i, hx, hz) { var p = PARTS.hiltPart(kind, x.spec.theme, i); p.scale.setScalar(0.001); p.position.set(hx, C[1] - 0.04, hz); p.userData = { kind: kind, i: i, home: [hx, C[1] - 0.04, hz], slot: null }; x.tmp.add(p); tween(p, { scale: K }, 0.4); loose.push(p); hot(p, dragOpt(p)); };
    [0, 1, 2, 3].forEach(function (i) { lay('sleeve', i, -0.62 + i * 0.22, 4.02); }); [0, 1].forEach(function (i) { lay('switch', i, 0.36 + i * 0.2, 4.02); lay('emitter', i, 0.36 + i * 0.2, 3.36); lay('pommel', i, -0.6 + i * 0.2, 3.36); });
    gem.userData.kind = 'crystal'; gem.userData.home = [-0.68, C[1] + 0.1, 3.72]; hot(gem, dragOpt(gem)); later(0.7, refresh);
    /* the emitter and the pommel screw in */
    function screwStep() {
      loose.forEach(function (p) { p.userData.hx.on = false; if (!p.userData.slot) tween(p, { scale: 0.001 }, 0.4); });
      x.spec.sleeves = [mounted.sleeveA.userData.i, mounted.sleeveB.userData.i]; x.spec.emitter = mounted.emitter.userData.i; x.spec.pommel = mounted.pommel.userData.i; x.spec.sw = mounted['switch'].userData.i;
      cap('🔧', '按住，拧紧', 4); say('发射口和尾盖要拧进去。按住它们不放，直到拧紧。'); hud.chips.innerHTML = '';
      var left = 2; [mounted.emitter, mounted.pommel].forEach(function (p) { p.userData.hx = { on: true, hold: { dur: 1.4, k: 0, tick: function (k, dt) { p.rotation.x += dt * 9; if (Math.floor(k * 12) !== Math.floor((k - dt / 1.4) * 12)) Kit.snd.tick(); }, done: function () { p.userData.hx.on = false; Kit.snd.latch(); Kit.tone(520, 0.2, 'triangle', 0.1); left--; mark([mounted.emitter, mounted.pommel].filter(function (q) { return q.userData.hx.on; })); if (!left) later(0.4, inspect); } } }; });
      mark([mounted.emitter, mounted.pommel]);
    }
    /* the Gatherer looks it over; then into the activation chamber */
    function inspect() {
      loose.forEach(function (p) { x.tmp.remove(p); }); x.tmp.remove(core); x.hot = [];
      var hilt = PARTS.saber(x.spec); hilt.userData.blade.visible = false; hilt.scale.setScalar(K); hilt.position.set(C[0], C[1], C[2]); hilt.rotation.z = -Math.PI / 2; x.tmp.add(hilt); x.hilt = hilt;
      cap('👀', '采集者检查', 5); say('让我看看。握套服帖，开关利落，水晶在唱歌。很好——现在把它放进旁边的激活舱。'); Kit.snd.chime(); x.lean = clock;
      tween(hilt, { pos: [C[0], C[1] + 0.2, C[2]], rot: new T.Euler(0.5, 0, -Math.PI / 2) }, 0.8);
      later(1.6, function () { cap('⬇️', '放进激活舱', 5); var into = function () { hilt.userData.hx.on = false; mark([]); Kit.snd.tick(); tween(hilt, { pos: [1.02, FY + 2.4, 3.74], rot: new T.Euler(0, 0, 0), arc: 0.1 }, 0.6, function () { tween(hilt, { pos: [1.02, FY + 1.48, 3.74] }, 0.7, function () { Kit.snd.thump(); dimStep(); }); }); };
        hot(hilt, { tap: into, drag: true, drop: function () { if (Math.hypot(hilt.position.x - 1.02, hilt.position.z - 3.74) < 0.45) into(); else tween(hilt, { pos: [C[0], C[1] + 0.2, C[2]] }, 0.3); } }); mark([hilt]); });
    }
  }
  /* 6 — the lights go down; the ring turns your colour */
  function dimStep() {
    var x = X; cap('🌌', '静下来，听', 5); say('灯暗下来了。水晶和剑柄，正在原力里连成一体。'); hud.dim.style.opacity = 1; x.dim = clock;
    amb.gath.forEach(function (q) { if (q.sb) q.sb.userData.blade.visible = false; }); Kit.tone(55, 5.2, 'sine', 0.16, 110); Kit.tone(82.5, 5.2, 'sine', 0.08, 165);
    later(5.2, function () { x.dim = 0; hud.dim.style.opacity = 0.45; igniteStep(); });
  }
  /* 7 — draw it, ignite it, raise it: the traveller among the Gatherers */
  function igniteStep() {
    var x = X; x.mode = 'show'; x.tmp.remove(x.hilt); x.hot = []; mark([]); x.av.visible = true; x.av.position.set(0, FY, 5.35); x.av.rotation.y = Math.PI; x.av.userData.mode = 'saber';
    var sb = PARTS.saber(x.spec); sb.userData.blade.visible = false; sb.position.set(0, 0.1, 0); x.av.userData.rig.handR.add(sb); x.av.userData.sb = sb; x.sb = sb;
    x.cam = { p: [3.3, FY + 2.2, 8.4], t: [0, FY + 1.75, 3.6] }; cap('⚡', '点亮！', 6); actBtn('⚡'); Kit.snd.chime(); say('它是你的了。按下开关！');
    x.onAct = function () {
      if (x.lit) return; x.lit = clock; sb.userData.blade.visible = true; sb.userData.blade.scale.y = 0.001; W.fx(true); W.hum(true); hud.dim.style.opacity = 0.25;
      amb.gath.forEach(function (q, i) { later(0.5 + i * 0.2, function () { if (q.sb) { q.sb.userData.blade.visible = true; q.sb.userData.blade.scale.y = 0.001; q.lit = clock; Kit.noise(0.3, 300, 3000, 0.08); } }); });
      amb.npcs.forEach(function (n, i) { later(0.9 + i * 0.25, function () { n.sb.userData.blade.visible = true; n.sb.userData.blade.scale.y = 0.001; n.lit = clock; Kit.noise(0.3, 300, 3000, 0.08); }); });
      later(1.5, function () { cap('🙌', '举起来！', 6); actBtn('🙌'); say('举起你的光剑！'); x.canRaise = true; });
    };
  }
  function finale() {
    var x = X; x.done = true; actBtn(null); Kit.snd.fanfare(); amb.lamp.intensity = 1.5; hud.dim.style.opacity = 0; cap('✨', '愿原力与你同在', 7); say('愿原力与你同在，旅行者。');
    amb.npcs.forEach(function (n) { n.up = true; }); amb.gath.forEach(function (q) { q.up = clock; });
    later(5, function () { var s = x.spec; stop(true); W.set('saber', { theme: s.theme, color: s.color, sleeves: s.sleeves, emitter: s.emitter, pommel: s.pommel, sw: s.sw }); });
  }

  /* ================================================================ walking, the camera, the pointer */
  function ok(x, z) {   /* where a traveller can stand: the yard, the passage, the chamber outside the ring — and not in a cart or a pedestal */
    var r = Math.hypot(x, z), i;
    if (!((r < 9.3 && r > 4.95) || (Math.abs(x) < 1.3 && z > 8.8 && z < 16.4) || (Math.abs(x) < 8.4 && z >= 15.9 && z < 25.8))) return false;
    for (i = 0; i < amb.crystals.length; i++) if (Math.hypot(x - amb.crystals[i].px, z - amb.crystals[i].pz) < 0.6) return false;
    for (i = 0; i < amb.carts.length; i++) if (Math.hypot(x - amb.carts[i].g.position.x, z - amb.carts[i].g.position.z) < 0.85) return false;
    for (i = 0; i < amb.peds.length; i++) if (Math.hypot(x - amb.peds[i].x, z - 20.3) < 0.75) return false;
    for (i = 0; i < amb.npcs.length; i++) if (Math.hypot(x - amb.npcs[i].g.position.x, z - amb.npcs[i].g.position.z) < 0.6) return false;
    if (Math.hypot(x + 3.4, z - 16.6) < 1.1 || (Math.abs(x) > 5.8 && (z < 18.8 || z > 23.4))) return false;
    return true;
  }
  function camOk(x, z) { var r = Math.hypot(x, z); return r < 9.6 || (Math.abs(x) < 1.45 && z > 8.8 && z < 15.3) || z >= 15.5; }
  function pick(e) {
    var r = API.canvas.getBoundingClientRect(); ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); X.my = ndc.y; ray.setFromCamera(ndc, API.camera);
    var list = X.hot.filter(function (o) { return o.userData.hx && o.userData.hx.on && o.parent; }), h = ray.intersectObjects(list, true);
    for (var i = 0; i < h.length; i++) for (var o = h[i].object; o; o = o.parent) if (o.userData && o.userData.hx && o.userData.hx.on) return o;
    return null;
  }
  function tick(now) {
    requestAnimationFrame(tick); var dt = Math.min(0.05, (now - (tick.last || now)) / 1000), i; tick.last = now; clock += dt; if (!S) return;
    /* always: the place is alive */
    var P = API.player, lx = P.pos.x - AT.x, lz = P.pos.z - AT.z, near = Math.min(Math.hypot(lx, lz - 15.2), X ? Math.hypot(X.ax, X.az - 15.2) : 99), open = Math.max(0, Math.min(1, (9 - near) / 4));
    amb.doors.forEach(function (d) { d.m.position.x += (d.x0 + d.s * 1.42 * open - d.m.position.x) * Math.min(1, dt * 5); });
    amb.spin.forEach(function (o) { o.rotation.y += dt * 0.7; }); amb.crystals.forEach(function (c, k) { c.m.rotation.y += dt * 1.2; c.m.position.y = FY + 1.5 + Math.sin(clock * 2 + k) * 0.05; });
    amb.great.rotation.y -= dt * 0.6; amb.great.position.y = FY + 2.5 + Math.sin(clock * 1.2) * 0.05; amb.beam.material.opacity = 0.18 + Math.sin(clock * 2.2) * 0.07;
    amb.gath.forEach(function (q, k) { var lean = X && X.lean && k === 0 ? Math.max(0, 1 - Math.abs(clock - X.lean - 0.8) / 0.8) : 0; q.g.rotation.y = q.ry + Math.sin(clock * 0.5 + q.ph) * 0.1; q.g.rotation.x = lean * 0.22; if (q.sb) { var up = q.up ? Math.min(1, (clock - q.up) / 0.6) : 0; q.sb.position.y = 1.12 + Math.sin(clock * 0.8 + q.ph) * 0.02 + up * 0.5; if (q.lit) q.sb.userData.blade.scale.y = Math.max(0.001, Math.min(1, (clock - q.lit) / 0.5)); } });
    amb.npcs.forEach(function (n) { var u = n.g.userData; u.raise += ((n.up ? 1 : 0) - u.raise) * Math.min(1, dt * 3); animate(n.g, dt, 0); n.sb.rotation.x = -u.rig.armR.rotation.x + 0.12; if (n.lit) n.sb.userData.blade.scale.y = Math.max(0.001, Math.min(1, (clock - n.lit) / 0.5)); });
    if (!X) return; var x = X, av = x.av; if (!API.state.ui) API.setUI(true);
    /* walking */
    if (x.mode === 'walk') {
      var fw = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0), sd = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0), fx = -Math.sin(x.camYaw), fz = -Math.cos(x.camYaw), mx = fx * fw + -fz * sd, mz = fz * fw + fx * sd, ml = Math.hypot(mx, mz);
      if (ml > 0.01) { mx /= ml; mz /= ml; var sp = (keys.ShiftLeft ? 5.2 : 3.6), nx = x.ax + mx * sp * dt, nz = x.az + mz * sp * dt; if (ok(nx, nz)) { x.ax = nx; x.az = nz; } else if (ok(nx, x.az)) x.ax = nx; else if (ok(x.ax, nz)) x.az = nz;
        var want = Math.atan2(mx, mz); x.ah += Math.atan2(Math.sin(want - x.ah), Math.cos(want - x.ah)) * Math.min(1, dt * 10); x.speed = sp; if (sd && !x.look) x.camYaw += Math.atan2(Math.sin(x.ah + Math.PI - x.camYaw), Math.cos(x.ah + Math.PI - x.camYaw)) * Math.min(1, dt * 1.1);
        var st = Math.floor(av.userData.ph / Math.PI); if (st !== x.stepN) { x.stepN = st; Kit.noise(0.05, 420, 160, 0.05); } } else x.speed = 0;
      av.position.set(x.ax, FY, x.az); av.rotation.y = x.ah;
      /* the pads: stand on one (or press the button) */
      var on = null; x.goals.forEach(function (g) { if (Math.hypot(x.ax - g.x, x.az - g.z) < g.r) on = g; });
      if (on) { x.dwell += dt; actBtn('✋'); hud.ring.style.display = 'block'; hud.bar.style.width = Math.min(100, x.dwell / 0.9 * 100) + '%'; if (x.dwell > 0.9 || keys.Act || keys.KeyE || keys.Space || keys.Enter) { keys.Act = keys.KeyE = keys.Space = keys.Enter = false; actBtn(null); hud.ring.style.display = 'none'; var g0 = on; goals([]); try { g0.go(); } catch (e) { if (root.console) console.warn('[savi]', e); } if (X !== x) return; } }
      else if (x.dwell) { x.dwell = 0; actBtn(null); hud.ring.style.display = 'none'; }
    }
    animate(av, dt, x.mode === 'walk' ? x.speed : 0);
    if (x.gem && x.gem.visible && x.mode === 'walk') { var gx = x.ax - Math.cos(x.ah) * 0.38, gz = x.az + Math.sin(x.ah) * 0.38; x.gem.position.x += (gx - x.gem.position.x) * Math.min(1, dt * 5); x.gem.position.z += (gz - x.gem.position.z) * Math.min(1, dt * 5); x.gem.position.y += (FY + 1.7 + Math.sin(clock * 3) * 0.06 - x.gem.position.y) * Math.min(1, dt * 5); x.gem.rotation.y += dt * 2; }
    /* the show: ignite, raise */
    if (x.mode === 'show') {
      if (keys.Space || keys.Enter || keys.KeyE) { if (!x.lit && x.onAct) x.onAct(); }
      if (x.lit) { x.sb.userData.blade.scale.y = Math.max(0.001, Math.min(1, (clock - x.lit) / 0.45)); var up = x.done ? 1 : x.canRaise && (keys.KeyW || keys.ArrowUp || keys.Act || keys.Space || (x.my || 0) > 0.35) ? 1 : 0, pr = av.userData.raise; av.userData.raise += (up - pr) * Math.min(1, dt * 5); W.swing(Math.min(6, Math.abs(av.userData.raise - pr) / Math.max(dt, 0.001) * 3));
        if (!x.done && x.canRaise) { x.hold = av.userData.raise > 0.85 ? (x.hold || 0) + dt : 0; if (x.hold > 0.9) finale(); } }
      x.sb.rotation.x = -av.userData.rig.armR.rotation.x + 0.12;
      if (x.done) { amb.ring.material.color.setHSL((clock * 0.3) % 1, 0.8, 0.7); }
    }
    if (x.dim) { var k = Math.min(1, (clock - x.dim) / 4.5); amb.lamp.intensity = 0.9 - k * 0.78; amb.ring.material.color.set(x.spec.color); amb.beam.material.color.set(x.spec.color); amb.tubes[0].glow.material.color.set(x.spec.color); amb.tubes[0].glow.material.opacity = k * (0.55 + 0.3 * Math.sin(clock * 9)); amb.great.scale.set(1 + k * 0.5, 1.6 + k * 0.8, 1 + k * 0.5); }
    /* timers, tweens, holds */
    for (i = x.timers.length - 1; i >= 0; i--) { var tm = x.timers[i]; tm.t -= dt; if (tm.t <= 0) { x.timers.splice(i, 1); try { tm.fn(); } catch (e) { if (root.console) console.warn('[savi]', e); } if (X !== x) return; } }
    for (i = x.tw.length - 1; i >= 0; i--) { var w = x.tw[i]; w.t = Math.min(1, w.t + dt / w.d); var s = w.t * w.t * (3 - 2 * w.t); if (w.p1) { w.o.position.lerpVectors(w.p0, w.p1, s); w.o.position.y += Math.sin(s * Math.PI) * w.arc; } if (w.r1) w.o.rotation.set(w.r0.x + (w.r1.x - w.r0.x) * s, w.r0.y + (w.r1.y - w.r0.y) * s, w.r0.z + (w.r1.z - w.r0.z) * s); if (w.s1 != null) w.o.scale.setScalar(w.s0 + (w.s1 - w.s0) * s); if (w.t >= 1) { x.tw.splice(x.tw.indexOf(w), 1); if (w.cb) { try { w.cb(); } catch (e) { if (root.console) console.warn('[savi]', e); } if (X !== x) return; } } }
    if (x.held) { var hx = x.held.userData.hx, Hh = hx.hold; if (!hx.on) { x.held = null; hud.ring.style.display = 'none'; } else { Hh.k = Math.min(1, Hh.k + dt / Hh.dur); hud.ring.style.display = 'block'; hud.bar.style.width = (Hh.k * 100) + '%'; Hh.tick(Hh.k, dt); if (Hh.k >= 1) { x.held = null; hud.ring.style.display = 'none'; Hh.done(); if (X !== x) return; } } }
    /* the camera: behind the traveller, or where the station puts it */
    var cp, ct;
    if (x.mode === 'walk') { var dist = 4.4; ct = new T.Vector3(x.ax, FY + 1.55, x.az); for (; dist > 1; dist -= 0.3) if (camOk(x.ax + Math.sin(x.camYaw) * dist, x.az + Math.cos(x.camYaw) * dist)) break; cp = new T.Vector3(x.ax + Math.sin(x.camYaw) * dist, FY + 1.75 + dist * 0.28, x.az + Math.cos(x.camYaw) * dist); }
    else { cp = new T.Vector3(x.cam.p[0], x.cam.p[1], x.cam.p[2]); ct = new T.Vector3(x.cam.t[0], x.cam.t[1], x.cam.t[2]); }
    if (!x.cp) { x.cp = cp.clone(); x.ct = ct.clone(); } var kc = Math.min(1, dt * (x.mode === 'walk' ? 7 : 2.6)); x.cp.lerp(cp, kc); x.ct.lerp(ct, kc);
    var o = S.position, dx = x.ct.x - x.cp.x, dy = x.ct.y - x.cp.y, dz = x.ct.z - x.cp.z; P.pos.set(o.x + x.cp.x, o.y + x.cp.y - 1.62, o.z + x.cp.z); if (P.vel) P.vel.set(0, 0, 0); P.yaw = Math.atan2(-dx, -dz); P.pitch = Math.atan2(dy, Math.hypot(dx, dz));
    /* the beams of light that show the way, and the arrows over what to pick up */
    amb.beacons = amb.beacons || []; for (i = 0; i < Math.max(amb.beacons.length, x.goals.length); i++) { var bc = amb.beacons[i]; if (!bc) { bc = new T.Group(); add(bc, new T.CylinderGeometry(0.5, 0.75, 5, 18, 1, true), B(0xffffff, { transparent: true, opacity: 0.2, side: T.DoubleSide, depthWrite: false }), 0, 2.5, 0); add(bc, new T.ConeGeometry(0.22, 0.4, 4), B(0xffffff), 0, 2.6, 0).rotation.x = Math.PI; S.add(bc); amb.beacons[i] = bc; }
      var gl = x.goals[i]; if (!gl || x.mode !== 'walk') { bc.visible = false; continue; } bc.visible = true; bc.position.set(gl.x, FY, gl.z); bc.children[0].material.color.set(gl.col); bc.children[1].material.color.set(gl.col); bc.children[1].position.y = 2.5 + Math.abs(Math.sin(clock * 3 + i)) * 0.35; bc.children[1].rotation.y = clock * 2; bc.children[0].material.opacity = 0.14 + Math.sin(clock * 3) * 0.05; }
    amb.marks = amb.marks || []; var v = new T.Vector3(), bx = new T.Box3(); for (i = 0; i < Math.max(amb.marks.length, x.marks.length); i++) { var m = amb.marks[i]; if (!m) { m = new T.Mesh(new T.ConeGeometry(0.035, 0.09, 8), B(0xfde047, { depthTest: false })); m.rotation.x = Math.PI; m.renderOrder = 9; API.scene.add(m); amb.marks[i] = m; }
      var mo = x.marks[i]; if (!mo || !mo.parent || !(mo.userData.hx && mo.userData.hx.on) || (x.drag && x.drag.o === mo)) { m.visible = false; continue; } bx.setFromObject(mo); bx.getCenter(v); m.visible = true; m.position.set(v.x, bx.max.y + 0.07 + Math.abs(Math.sin(clock * 4)) * 0.04, v.z); }
  }
  function attach(api) {
    if (API || !api) return; API = api; T = api.THREE; ray = new T.Raycaster(); ndc = new T.Vector2();
    var go = function () { W = root.TPStarWarsWorkshops; Kit = root.TPSWKit; PARTS = root.TPSWParts; if (!W || !Kit || !PARTS) return setTimeout(go, 200); try { build(); } catch (e) { if (root.console) console.warn('[savi]', e); return; } requestAnimationFrame(tick); if (/[?&]goto=savi/.test(location.search)) setTimeout(goThere, 700); };
    go();
    var cv = API.canvas;
    cv.addEventListener('pointerdown', function (e) { if (!X) return; e.stopPropagation(); var o = X.mode === 'close' ? pick(e) : null;
      if (o) { var h = o.userData.hx; if (h.hold) X.held = o; else X.drag = { o: o, sx: e.clientX, sy: e.clientY, moved: false }; }
      else { X.look = { x: e.clientX }; if (X.mode === 'show' && X.onAct && !X.lit) X.onAct(); } }, true);
    cv.addEventListener('pointermove', function (e) { if (!X) return; var d = X.drag;
      if (d) { if (!d.moved && Math.hypot(e.clientX - d.sx, e.clientY - d.sy) > 7 && d.o.userData.hx.drag) { d.moved = true; X.tw = X.tw.filter(function (w) { return w.o !== d.o; }); d.o.rotation.set(0, 0, d.o.userData.slot || d.o === X.hilt ? -Math.PI / 2 : 0); }
        if (d.moved) { pick(e); var py = S.position.y + C[1] + 0.06, t = (py - ray.ray.origin.y) / ray.ray.direction.y; if (t > 0) d.o.position.set(ray.ray.origin.x + ray.ray.direction.x * t - S.position.x, C[1] + 0.06, ray.ray.origin.z + ray.ray.direction.z * t - S.position.z); } return; }
      if (X.look && X.mode === 'walk') { X.camYaw -= (e.clientX - X.look.x) * 0.006; X.look.x = e.clientX; }
      if (X.mode === 'close') { var o = pick(e); cv.style.cursor = o ? 'grab' : 'default'; if (X.held && o !== X.held) { X.held = null; hud.ring.style.display = 'none'; } } else { var r = cv.getBoundingClientRect(); X.my = -((e.clientY - r.top) / r.height) * 2 + 1; } }, true);
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (ev) { cv.addEventListener(ev, function () { if (!X) return; X.look = null; if (X.held) { X.held = null; hud.ring.style.display = 'none'; } var d = X.drag; X.drag = null; if (d && d.o.userData.hx.on) { try { if (d.moved) d.o.userData.hx.drop(); else d.o.userData.hx.tap(); } catch (er) { if (root.console) console.warn('[savi]', er); } } }, true); });
    ['mousedown', 'click', 'touchstart'].forEach(function (ev) { cv.addEventListener(ev, function (e) { if (X) e.stopPropagation(); }, true); });
    root.addEventListener('keydown', function (e) { if (!X) return; e.stopImmediatePropagation(); e.preventDefault(); if (e.key === 'Escape') return stop(false); keys[e.code] = true; }, true);
    root.addEventListener('keyup', function (e) { if (!X) return; e.stopImmediatePropagation(); keys[e.code] = false; }, true);
  }
  function goThere() { if (!API) return; var x = document.getElementById('tp-close-guide'); if (x) x.click(); API.teleport({ mode: 'walk', p: [AT.x, API.groundY(AT.x, AT.z + 30, 62), AT.z + 30], t: [AT.x, 42.5, AT.z + 15] }); API.toast('⚔️ 萨维的工坊：走进院子，按 E 开始'); }
  if (root.TPParkAPI) attach(root.TPParkAPI); else root.addEventListener('tp:park-ready', function (e) { attach(e.detail || root.TPParkAPI); });
  root.TPSWSavi = { _warp: function (x, z) { if (X) { X.ax = x; X.az = z; } }, start: start, stop: function () { stop(false); }, go: goThere, at: AT, _x: function () { return X; }, _amb: amb };
})(window);
