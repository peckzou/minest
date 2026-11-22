/* Minest · Spatial Home · Rooms 2.0 — environment "living": the Drawing Room, where guests are received.
   The same house as the Victorian Study and the Atelier, in its lightest room: claret striped paper over a walnut dado,
   a white marble fireplace with a fire that burns, a gilt mirror over it, a chesterfield and two buttoned chairs round
   a low table on the carpet, tall velvet curtains at the garden window, a writing table in its light, a sideboard,
   a chandelier, and the Study's grand piano (a thing of the layout, so it plays and can be moved).
   Textures and furniture are the Study's own (js/study/textures.js, js/furniture.js). Every thing of Spatial Home has
   its place (the same anchor names as the other rooms); light follows the time of day, the fire and the chandelier
   take over at night. */
(function (root) {
  'use strict';
  var THREE = root.THREE, SR = root.SpatialRoom, PT = SR && SR.parts, TX = root.StudyTex;
  if (!SR || !PT || !TX) return;
  (root.SpatialRoomsNew = root.SpatialRoomsNew || []).push('living');
  var X0 = -5.5, X1 = 5.5, Z0 = -4.2, Z1 = 4.2, H = 4.0, PI = Math.PI;
  var WIN = { x0: -2.3, x1: 2.3, y0: 0.7, y1: 3.5 };

  function lin(h) { return new THREE.Color(h).convertSRGBToLinear(); }
  function rep(t, u, v) { if (t) t.repeat.set(u, v); return t; }
  function std(o) { return new THREE.MeshStandardMaterial(o); }
  function box(g, m, x, y, z, w, h, d, ry) {
    var b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); if (ry) b.rotation.y = ry;
    b.castShadow = true; b.receiveShadow = true; g.add(b); return b;
  }
  function cyl(g, m, x, y, z, r0, r1, h, seg) {
    var c = new THREE.Mesh(new THREE.CylinderGeometry(r0, r1, h, seg || 20), m); c.position.set(x, y, z); c.castShadow = true; c.receiveShadow = true; g.add(c); return c;
  }
  function canvasTex(w, h, draw, rx, ry) {
    var c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
    var t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 4;
    if (rx) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); } return t;
  }
  /* the paper: broad claret stripes, a thin gilt line between them, a small sprig on every other stripe */
  function paper() {
    return canvasTex(256, 256, function (x, w, h) {
      var r = TX.rng(9), i, j;
      for (i = 0; i < 4; i++) { x.fillStyle = i % 2 ? '#7a2a30' : '#6a2228'; x.fillRect(i * 64, 0, 64, h); x.fillStyle = 'rgba(214,176,98,.55)'; x.fillRect(i * 64, 0, 1.5, h); }
      for (i = 0; i < 2600; i++) { x.fillStyle = 'rgba(' + (r() < 0.5 ? '0,0,0' : '255,220,200') + ',' + (r() * 0.05) + ')'; x.fillRect(r() * w, r() * h, 1, 2 + r() * 5); }
      x.strokeStyle = 'rgba(224,188,112,.5)'; x.lineWidth = 1.2;
      for (i = 0; i < 4; i += 2) for (j = 0; j < 4; j++) { var cx = i * 64 + 32, cy = j * 64 + 32; x.beginPath(); x.moveTo(cx, cy - 10); x.lineTo(cx, cy + 10); x.moveTo(cx - 7, cy - 3); x.quadraticCurveTo(cx, cy + 2, cx + 7, cy - 3); x.moveTo(cx - 5, cy + 5); x.quadraticCurveTo(cx, cy + 9, cx + 5, cy + 5); x.stroke(); }
    }, 1, 1);
  }
  /* marble: white with soft grey veins */
  function marble() {
    return canvasTex(512, 512, function (x, w, h) {
      var r = TX.rng(23), i, k;
      x.fillStyle = '#efece6'; x.fillRect(0, 0, w, h);
      for (i = 0; i < 26; i++) { x.strokeStyle = 'rgba(120,124,132,' + (0.08 + r() * 0.2) + ')'; x.lineWidth = 0.6 + r() * 2.2; x.beginPath(); var px = r() * w, py = r() * h; x.moveTo(px, py); for (k = 0; k < 7; k++) { px += (r() - 0.3) * 110; py += (r() - 0.5) * 80; x.lineTo(px, py); } x.stroke(); }
    }, 1, 1);
  }
  function flameTex() {
    return canvasTex(128, 256, function (x, w, h) {
      var gr = x.createRadialGradient(64, 200, 6, 64, 150, 120);
      gr.addColorStop(0, 'rgba(255,250,210,1)'); gr.addColorStop(0.25, 'rgba(255,196,80,.95)'); gr.addColorStop(0.6, 'rgba(240,96,24,.55)'); gr.addColorStop(1, 'rgba(160,30,0,0)');
      x.fillStyle = gr; x.beginPath(); x.moveTo(64, 6); x.bezierCurveTo(118, 110, 122, 190, 64, 250); x.bezierCurveTo(6, 190, 10, 110, 64, 6); x.fill();
    });
  }
  /* a landscape for the walls: sky, hills, a river (painted, in a gilt frame) */
  function landscape(seed) {
    return canvasTex(512, 320, function (x, w, h) {
      var r = TX.rng(seed), i, sky = x.createLinearGradient(0, 0, 0, h * 0.6);
      sky.addColorStop(0, '#9cb7cf'); sky.addColorStop(1, '#f0dcb8'); x.fillStyle = sky; x.fillRect(0, 0, w, h);
      ['#8ea08a', '#6f8a66', '#4f6f48', '#3c5a3a'].forEach(function (c, k) {
        x.fillStyle = c; x.beginPath(); x.moveTo(0, h); var y0 = h * (0.42 + k * 0.12); x.lineTo(0, y0);
        for (i = 0; i <= 8; i++) x.lineTo(i * w / 8, y0 + (r() - 0.5) * 46 - Math.sin(i + seed + k) * 14); x.lineTo(w, h); x.fill();
      });
      x.fillStyle = 'rgba(214,226,236,.85)'; x.beginPath(); x.moveTo(w * 0.42, h); x.quadraticCurveTo(w * 0.5, h * 0.78, w * 0.36, h * 0.66); x.quadraticCurveTo(w * 0.6, h * 0.8, w * 0.62, h); x.fill();
      for (i = 0; i < 14; i++) { x.fillStyle = 'rgba(40,62,40,.8)'; var tx = r() * w, ty = h * (0.62 + r() * 0.3), s = 8 + r() * 14; x.beginPath(); x.arc(tx, ty, s, 0, 6.3); x.fill(); }
    });
  }

  function build(scene) {
    var holder = new THREE.Group(); holder.name = 'env-living'; scene.add(holder);
    var g = new THREE.Group(); holder.add(g);
    var M = {
      dark: std({ color: lin(0xb59a86), map: TX.wood('dark'), roughness: 0.55 }),
      light: std({ color: lin(0xd9bda0), map: TX.wood('light'), roughness: 0.5 }),
      brass: std({ color: lin(0xd0aa52), roughness: 0.3, metalness: 0.85 }),
      gilt: std({ color: lin(0xd9b46a), roughness: 0.38, metalness: 0.8 }),
      leather: std({ color: lin(0xffffff), map: TX.leather(), roughness: 0.6 }),
      white: std({ color: lin(0xf2efe8), roughness: 0.7 }),
      marble: std({ color: lin(0xffffff), map: marble(), roughness: 0.28 }),
      soot: std({ color: lin(0x17120f), roughness: 1 }),
      velvet: std({ color: lin(0x234a36), roughness: 0.95 }),
      plaster: std({ color: lin(0xf4eee2), map: rep(TX.plaster(), 5, 4), roughness: 0.95, emissive: lin(0xf4eee2), emissiveIntensity: 0.34 }),
      wall: std({ color: lin(0xffffff), map: paper(), roughness: 0.93 }),
      floor: std({ color: lin(0xffffff), map: rep(TX.parquet(), 12, 9), roughness: 0.62 }),
      carpet: std({ color: lin(0xffffff), map: TX.carpet(), roughness: 0.95 }),
      mirror: new THREE.MeshBasicMaterial({ map: canvasTex(256, 256, function (x, w, h) {            // no reflections here: a soft picture of the room's light in the glass
        var gr = x.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#5d3a3c'); gr.addColorStop(0.45, '#8a6e66'); gr.addColorStop(0.55, '#cfd6da'); gr.addColorStop(0.7, '#8d7a72'); gr.addColorStop(1, '#4a2e30');
        x.fillStyle = gr; x.fillRect(0, 0, w, h); x.fillStyle = 'rgba(255,255,255,.16)'; x.beginPath(); x.moveTo(w * 0.2, 0); x.lineTo(w * 0.42, 0); x.lineTo(w * 0.16, h); x.lineTo(0, h); x.fill();
      }) })
    };
    function noShadow(m) { m.castShadow = false; return m; }
    function wallMat(len) { var m = M.wall.clone(); m.map = M.wall.map.clone(); m.map.needsUpdate = true; m.map.repeat.set(len / 1.1, H / 1.1); return m; }

    /* ── the shell ── */
    noShadow(box(g, M.floor, 0, -0.05, 0, X1 - X0, 0.1, Z1 - Z0));
    noShadow(box(g, M.plaster, 0, H + 0.05, 0, X1 - X0, 0.1, Z1 - Z0));
    var T = 0.2, i, WZ = wallMat(Z1 - Z0), WX = wallMat(X1 - X0), WN = wallMat(X1 - WIN.x1);
    noShadow(box(g, WZ, X0 - T / 2, H / 2, 0, T, H, Z1 - Z0 + 2 * T)); noShadow(box(g, WZ, X1 + T / 2, H / 2, 0, T, H, Z1 - Z0 + 2 * T));
    noShadow(box(g, WX, 0, H / 2, Z1 + T / 2, X1 - X0, H, T));
    noShadow(box(g, WN, (X0 + WIN.x0) / 2, H / 2, Z0 - T / 2, WIN.x0 - X0, H, T)); noShadow(box(g, WN, (X1 + WIN.x1) / 2, H / 2, Z0 - T / 2, X1 - WIN.x1, H, T));
    noShadow(box(g, M.white, 0, WIN.y0 / 2, Z0 - T / 2, WIN.x1 - WIN.x0, WIN.y0, T)); noShadow(box(g, WN, 0, (H + WIN.y1) / 2, Z0 - T / 2, WIN.x1 - WIN.x0, H - WIN.y1, T));
    function dado(axis, fix, a, b, side) {
      var L = b - a, n = Math.max(1, Math.round(L / 1.0)), pw = L / n, k, c = (a + b) / 2;
      function at(u, y, w, h, d, m, off) { return axis === 'z' ? box(g, m, fix + side * (off + d / 2), y, u, d, h, w) : box(g, m, u, y, fix + side * (off + d / 2), w, h, d); }
      at(c, 0.5, L, 1.0, 0.03, M.dark, 0); at(c, 1.02, L, 0.06, 0.07, M.light, 0); at(c, 0.08, L, 0.16, 0.05, M.light, 0);
      for (k = 0; k < n; k++) at(a + (k + 0.5) * pw, 0.56, pw - 0.16, 0.62, 0.02, M.light, 0.03);
      at(c, 3.2, L, 0.05, 0.04, M.gilt, 0); at(c, H - 0.1, L, 0.2, 0.12, M.white, 0);                     // picture rail, cornice
    }
    dado('z', X0, Z0, Z1, 1); dado('z', X1, Z0, -1.3, -1); dado('z', X1, 1.3, Z1, -1); dado('x', Z1, X0, X1, -1);
    dado('x', Z0, X0, WIN.x0 - 0.5, 1); dado('x', Z0, WIN.x1 + 0.5, X1, 1);
    /* the ceiling rose */
    var rose = cyl(g, M.white, 0.6, H - 0.02, 0, 0.7, 0.8, 0.05, 40); rose.castShadow = false; cyl(g, M.white, 0.6, H - 0.06, 0, 0.3, 0.42, 0.06, 32).castShadow = false;

    /* ── the garden window: white glazing bars, a window seat's sill, velvet curtains under a gilt pole; the Scenic
       Window's view stands right behind the bars (anchor 'floor.window'), the plain sky behind that ── */
    var sky = new THREE.Mesh(new THREE.PlaneGeometry(40, 22), new THREE.MeshBasicMaterial({ color: 0xe7f0ff })); sky.position.set(0, 5, Z0 - 9); g.add(sky);
    var hedge = std({ color: lin(0x3d6b3a), roughness: 1 }), back = new THREE.Group(); g.add(back);
    noShadow(box(back, hedge, 0, 0.2, Z0 - 5, 26, 2.0, 1.2));
    for (i = 0; i < 7; i++) { var tr = new THREE.Mesh(new THREE.SphereGeometry(1.5 + (i % 3) * 0.4, 12, 9), hedge); tr.position.set(-10.5 + i * 3.5, 2.3 + (i % 2) * 0.7, Z0 - 6.5); back.add(tr); }
    for (i = 0; i <= 4; i++) box(g, M.white, WIN.x0 + i * (WIN.x1 - WIN.x0) / 4, (WIN.y0 + WIN.y1) / 2, Z0 - 0.05, i % 4 ? 0.05 : 0.1, WIN.y1 - WIN.y0, 0.07);
    [0, 0.34, 0.67, 1].forEach(function (k, q) { box(g, M.white, 0, WIN.y0 + k * (WIN.y1 - WIN.y0), Z0 - 0.05, WIN.x1 - WIN.x0, q % 3 ? 0.05 : 0.1, 0.07); });
    box(g, M.white, 0, WIN.y0 + 0.02, Z0 + 0.1, WIN.x1 - WIN.x0 + 0.2, 0.06, 0.44);
    cyl(g, M.gilt, 0, WIN.y1 + 0.28, Z0 + 0.16, 0.03, 0.03, WIN.x1 - WIN.x0 + 1.5, 12).rotation.z = PI / 2;
    [WIN.x0 - 0.72, WIN.x1 + 0.72].forEach(function (xx) { var f = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 8), M.gilt); f.position.set(xx, WIN.y1 + 0.28, Z0 + 0.16); g.add(f); });
    [-1, 1].forEach(function (sd) {
      for (i = 0; i < 6; i++) { var c = cyl(g, M.velvet, (sd < 0 ? WIN.x0 : WIN.x1) + sd * (0.62 - i * 0.13), (WIN.y1 + 0.28) / 2, Z0 + 0.16, 0.085, 0.1, WIN.y1 + 0.24, 10); c.scale.z = 0.7; }
      cyl(g, M.gilt, (sd < 0 ? WIN.x0 : WIN.x1) + sd * 0.3, 1.25, Z0 + 0.17, 0.42, 0.42, 0.06, 20).scale.z = 0.3;       // the tie-back
    });

    /* ── the fireplace on the east wall: chimney breast, marble surround and mantel, a fire, the gilt mirror ── */
    var FX = X1 - 0.45;
    box(g, WZ, X1 - 0.22, H / 2, 0, 0.44, H, 2.6); box(g, M.white, X1 - 0.22, H - 0.1, 0, 0.6, 0.2, 2.76);
    box(g, M.dark, FX + 0.215, 0.5, 0, 0.03, 1.0, 2.6);
    [-0.85, 0.85].forEach(function (dz) { box(g, M.marble, FX - 0.06, 0.62, dz, 0.16, 1.24, 0.34); box(g, M.marble, FX - 0.1, 0.08, dz, 0.22, 0.16, 0.4); });
    box(g, M.marble, FX - 0.06, 1.12, 0, 0.16, 0.26, 2.04); box(g, M.marble, FX - 0.1, 1.29, 0, 0.34, 0.07, 2.36);          // lintel, mantel shelf
    box(g, M.soot, FX + 0.0, 0.5, 0, 0.03, 1.0, 1.36); box(g, M.marble, FX - 0.42, 0.012, 0, 0.7, 0.024, 2.0);              // firebox, hearth
    box(g, M.brass, FX - 0.74, 0.14, 0, 0.03, 0.26, 1.7); [-0.84, 0.84].forEach(function (dz) { cyl(g, M.brass, FX - 0.74, 0.2, dz, 0.025, 0.025, 0.4, 8); });   // fender
    var logM = std({ color: lin(0x3a2416), roughness: 1, emissive: lin(0xff5a12), emissiveIntensity: 0.5 });
    [[-0.22, 0.1, 0.1], [0.2, 0.1, -0.12], [0, 0.22, 0.25]].forEach(function (q) { var l = cyl(g, logM, FX - 0.1, q[1], q[0], 0.06, 0.07, 0.62, 10); l.rotation.x = PI / 2 + q[2]; l.castShadow = false; });
    var flames = [], fm = new THREE.MeshBasicMaterial({ map: flameTex(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
    [[-0.26, 0.5], [0, 0.66], [0.24, 0.46], [-0.1, 0.4], [0.12, 0.56]].forEach(function (q, k) {
      var f = new THREE.Mesh(new THREE.PlaneGeometry(0.34, q[1]), fm); f.position.set(FX - 0.08 - (k % 2) * 0.05, 0.16 + q[1] / 2, q[0]); f.rotation.y = -PI / 2; f.userData.h = q[1]; g.add(f); flames.push(f);
    });
    var fire = new THREE.PointLight(0xff8a3c, 0.9, 7.5, 2); fire.position.set(FX - 0.35, 0.5, 0); holder.add(fire);
    box(g, M.gilt, FX - 0.23, 2.3, 0, 0.06, 1.5, 1.7); var mir = new THREE.Mesh(new THREE.PlaneGeometry(1.48, 1.28), M.mirror); mir.rotation.y = -PI / 2; mir.position.set(FX - 0.262, 2.3, 0); g.add(mir);
    [-0.95, 0.95].forEach(function (dz) { cyl(g, M.brass, FX - 0.1, 1.36, dz, 0.05, 0.07, 0.07, 12); cyl(g, M.brass, FX - 0.1, 1.5, dz, 0.012, 0.012, 0.22, 8); cyl(g, M.white, FX - 0.1, 1.68, dz, 0.014, 0.014, 0.16, 8); });   // candlesticks
    box(g, M.dark, FX - 0.1, 1.44, 0, 0.14, 0.22, 0.3); cyl(g, M.white, FX - 0.175, 1.47, 0, 0.07, 0.07, 0.01, 20).rotation.z = PI / 2;                       // the mantel clock

    /* ── the seating: the carpet before the fire, a chesterfield facing it, two buttoned chairs, a low table ── */
    var cm = M.carpet.clone(); cm.map = M.carpet.map.clone(); cm.map.needsUpdate = true; cm.map.center.set(0.5, 0.5); cm.map.rotation = PI / 2;
    var cp = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 4.6), cm); cp.rotation.x = -PI / 2; cp.position.set(2.5, 0.006, 0); cp.receiveShadow = true; g.add(cp);
    (function (x, z) {                                                                                                       // the chesterfield, its back to the room, 2.3 m long
      var s = new THREE.Group(); s.position.set(x, 0, z); g.add(s);
      box(s, M.dark, 0, 0.1, 0, 0.9, 0.08, 2.24); [[-0.38, -1.05], [0.38, -1.05], [-0.38, 1.05], [0.38, 1.05]].forEach(function (q) { cyl(s, M.dark, q[0], 0.035, q[1], 0.035, 0.028, 0.07, 10); });
      box(s, M.leather, 0.02, 0.25, 0, 0.9, 0.24, 2.26); box(s, M.leather, 0.12, 0.42, 0, 0.7, 0.14, 1.86);                 // base, seat cushions
      [-0.31, 0.31, 0.93, -0.93].forEach(function (dz) { box(s, M.dark, 0.12, 0.492, dz, 0.7, 0.004, 0.012); });
      box(s, M.leather, -0.36, 0.56, 0, 0.2, 0.5, 2.26); var bk = cyl(s, M.leather, -0.38, 0.84, 0, 0.13, 0.13, 2.26, 18); bk.rotation.x = PI / 2;      // back and its roll
      [-1.02, 1.02].forEach(function (dz) { box(s, M.leather, 0.02, 0.5, dz, 0.86, 0.36, 0.22); var a = cyl(s, M.leather, 0.04, 0.7, dz, 0.13, 0.13, 0.9, 18); a.rotation.z = PI / 2; cyl(s, M.brass, 0.495, 0.7, dz, 0.05, 0.05, 0.01, 14).rotation.z = PI / 2; });
      for (var a2 = 0; a2 < 9; a2++) for (var b2 = 0; b2 < 2; b2++) { var bt = new THREE.Mesh(new THREE.SphereGeometry(0.014, 8, 6), M.brass); bt.position.set(-0.255, 0.6 + b2 * 0.16, -0.84 + a2 * 0.21 + b2 * 0.1); s.add(bt); }
    })(0.95, 0);
    var ticks = [];
    function piece(kind, x, z, ry) {
      var F = root.SpatialFurniture || {}, o = null; try { o = F[kind] && F[kind](THREE); } catch (e) {}
      if (!o || !o.group) return null;
      o.group.position.set(x, 0, z); o.group.rotation.y = ry || 0;
      o.group.traverse(function (m) { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
      g.add(o.group); if (typeof o.tick === 'function') ticks.push(o); return o;
    }
    piece('vic-tufted', 2.75, -1.75, -0.55); piece('vic-tufted', 2.75, 1.75, PI + 0.55);
    box(g, M.dark, 2.55, 0.4, 0, 0.7, 0.04, 1.2); box(g, M.light, 2.55, 0.16, 0, 0.56, 0.03, 1.06); [[-0.3, -0.54], [0.3, -0.54], [-0.3, 0.54], [0.3, 0.54]].forEach(function (q) { cyl(g, M.dark, 2.55 + q[0], 0.2, q[1], 0.025, 0.02, 0.4, 10); });
    cyl(g, M.white, 2.6, 0.47, -0.36, 0.09, 0.06, 0.1, 16); [0xb23a48, 0xe9c46a, 0xd98ca0].forEach(function (c, k) { var fl = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), std({ color: lin(c), roughness: 0.8 })); fl.position.set(2.6 + (k - 1) * 0.05, 0.6 + (k % 2) * 0.04, -0.36 + (k - 1) * 0.03); g.add(fl); });

    /* ── the writing table in the window's light (the desk of this room), its chair on the room side ── */
    var DX = -1.1, DZ = -2.95, top = 0.784;
    if (!piece('vic-desk', DX, DZ, 0)) { box(g, M.dark, DX, 0.39, DZ, 1.7, 0.74, 0.9); box(g, M.leather, DX, 0.77, DZ, 1.6, 0.02, 0.8); }
    piece('vic-chair', DX, DZ + 0.78, PI) || piece('vic-exec', DX, DZ + 0.8, PI);

    /* ── west wall: the sideboard (decanters, the things that stand on a cabinet), two landscapes in gilt frames ── */
    (function () {
      var z0 = -0.9, z1 = 1.7, d = 0.52, hh = 0.86, cx = X0 + d / 2, L = z1 - z0, k;
      box(g, M.dark, cx, hh / 2 + 0.05, (z0 + z1) / 2, d, hh - 0.1, L); box(g, M.light, cx, hh + 0.012, (z0 + z1) / 2, d + 0.05, 0.045, L + 0.06);
      [z0 + 0.08, z1 - 0.08].forEach(function (zz) { [X0 + 0.07, X0 + d - 0.07].forEach(function (xx) { cyl(g, M.dark, xx, 0.05, zz, 0.035, 0.025, 0.1, 10); }); });
      for (k = 0; k < 4; k++) { var zc = z0 + (k + 0.5) * L / 4; box(g, M.light, X0 + d + 0.006, 0.42, zc, 0.02, 0.56, L / 4 - 0.07); box(g, M.brass, X0 + d + 0.024, 0.52, zc + (k % 2 ? -0.2 : 0.2), 0.02, 0.08, 0.02); }
      [[1.3, 1.2], [-0.2, 1.2]].forEach(function (q, n) {
        box(g, M.gilt, X0 + 0.035, 2.25, q[0], 0.05, 0.96, 1.36);
        var p = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.8), std({ map: landscape(n ? 31 : 12), roughness: 0.8 })); p.rotation.y = PI / 2; p.position.set(X0 + 0.062, 2.25, q[0]); g.add(p);
      });
    })();
    /* ── south wall: the double doors (decor), the longcase clock; a potted palm in the corner by the fire ── */
    box(g, M.white, 2.6, 1.25, Z1 - 0.03, 1.9, 2.5, 0.06); [2.16, 3.04].forEach(function (xx) { box(g, M.dark, xx, 1.2, Z1 - 0.07, 0.82, 2.3, 0.03); [1.75, 0.62].forEach(function (yy) { box(g, M.light, xx, yy, Z1 - 0.09, 0.58, yy > 1 ? 0.95 : 0.8, 0.02); }); });
    [2.52, 2.68].forEach(function (xx) { box(g, M.brass, xx, 1.1, Z1 - 0.11, 0.03, 0.14, 0.04); });
    piece('vic-clock', 4.5, Z1 - 0.3, PI);
    (function (x, z) {
      cyl(g, M.white, x, 0.22, z, 0.24, 0.17, 0.44, 18); var leaf = std({ color: lin(0x2f6b3c), roughness: 0.9, side: THREE.DoubleSide });
      for (var k = 0; k < 9; k++) { var lf = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 1.1 + (k % 3) * 0.2), leaf), a = k / 9 * 6.283; lf.position.set(x + Math.cos(a) * 0.22, 1.0 + (k % 3) * 0.1, z + Math.sin(a) * 0.22); lf.rotation.set(0.5 * Math.sin(a), -a, 0.5 * Math.cos(a) + 0.0); lf.castShadow = true; g.add(lf); }
    })(4.9, -3.6);

    /* ── light: the sky through the window, the chandelier, the fire ── */
    var hemi = new THREE.HemisphereLight(0xfff0dc, 0x3b2a1c, 0.74); holder.add(hemi);
    var sun = new THREE.DirectionalLight(0xdbe6ff, 0.9); sun.position.set(-1.0, 6.0, Z0 - 5); sun.target.position.set(0.4, 0.4, 0.2);
    sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); var sc = sun.shadow.camera; sc.left = -7.5; sc.right = 7.5; sc.top = 7.5; sc.bottom = -7.5; sc.near = 0.5; sc.far = 18;
    sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.02; holder.add(sun); holder.add(sun.target);
    var fill = new THREE.DirectionalLight(0xffe2bd, 0.26); fill.position.set(-3, 3.4, 5); holder.add(fill);
    var CH = [0.6, H - 1.25, 0], bulbM = new THREE.MeshBasicMaterial({ color: 0xffe9c4 });
    cyl(g, M.brass, CH[0], H - 0.6, CH[2], 0.012, 0.012, 1.1, 6); cyl(g, M.brass, CH[0], CH[1], CH[2], 0.07, 0.04, 0.3, 14);
    var ring = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.018, 8, 40), M.brass); ring.rotation.x = PI / 2; ring.position.set(CH[0], CH[1] - 0.05, CH[2]); g.add(ring);
    for (i = 0; i < 8; i++) {
      var a = i / 8 * 6.283, bx = CH[0] + Math.cos(a) * 0.5, bz = CH[2] + Math.sin(a) * 0.5;
      var arm = box(g, M.brass, CH[0] + Math.cos(a) * 0.25, CH[1] - 0.05, CH[2] + Math.sin(a) * 0.25, 0.5, 0.014, 0.014, -a); arm.castShadow = false;
      cyl(g, M.white, bx, CH[1] + 0.04, bz, 0.016, 0.016, 0.14, 8).castShadow = false; var bl = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), bulbM); bl.position.set(bx, CH[1] + 0.14, bz); g.add(bl);
      var dr = new THREE.Mesh(new THREE.OctahedronGeometry(0.035), std({ color: lin(0xffffff), roughness: 0.05, metalness: 0.3, transparent: true, opacity: 0.7 })); dr.position.set(bx, CH[1] - 0.14, bz); dr.scale.y = 1.8; g.add(dr);
    }
    var chand = new THREE.PointLight(0xffdfae, 0.5, 9, 2); chand.position.set(CH[0], CH[1] - 0.2, CH[2]); holder.add(chand);
    scene.fog = null; scene.background = new THREE.Color(0x15100c);

    var mode = 'auto', lastApply = -99, night = 0;
    function c3(a, b, k) { return new THREE.Color(a).lerp(new THREE.Color(b), k); }
    function apply() {
      var D = SR.timeOfDay(mode), L = D.light, K = D.dusk; night = D.night;
      sky.material.color.copy(c3('#101a35', '#e7f0ff', L)).lerp(new THREE.Color('#f6b48a'), K * 0.6);
      hedge.color.copy(lin(0x3d6b3a)).multiplyScalar(0.12 + 0.88 * L);
      sun.intensity = 0.06 + 0.84 * L; sun.color.copy(c3('#8fa4ff', '#dbe6ff', L)).lerp(new THREE.Color('#ffb27a'), K * 0.6);
      hemi.intensity = 0.3 + 0.44 * L; fill.intensity = 0.1 + 0.16 * L; M.plaster.emissiveIntensity = 0.1 + 0.3 * L;
      chand.intensity = 0.3 + 0.9 * night; bulbM.color.set(night > 0.3 ? 0xfff0cf : 0xe2d2ac);
    }
    apply();

    /* anchors: where each thing of Spatial Home goes in the Drawing Room (y = the surface it stands on) */
    var SB = X0 + 0.27, anchors = {
      'desk.left': { p: [DX - 0.3, top, DZ + 0.04], ry: 0 }, 'desk.right': { p: [DX + 0.42, top, DZ + 0.1], ry: 0 },
      'desk.quill': { p: [DX - 0.66, top, DZ + 0.16], ry: 0.25 }, 'desk.mochi': { p: [DX + 0.7, top, DZ + 0.2], ry: -0.3 },
      'desk.key': { p: [DX + 0.1, top, DZ + 0.27], ry: 0.3 }, 'desk.book': { p: [2.55, 0.422, 0.2], ry: -PI / 2 },          // the reading stand on the low table
      'sill.left': { p: [1.3, WIN.y0 + 0.052, Z0 + 0.14], ry: 0 },
      'corner.window': { p: [-4.75, 0, -3.5], ry: PI / 2 },                                                                // Octo's aquarium in the north-west corner
      'wall.left': { p: [X0 + 0.06, 1.95, -2.5], ry: PI / 2 },                                                              // the EC–6 board
      'cabinet.left': { p: [SB, 0.9, -0.55], ry: PI / 2 }, 'shelf.mid': { p: [SB, 0.9, 0.1], ry: PI / 2 },
      'cabinet.top': { p: [SB, 0.9, 0.75], ry: PI / 2 }, 'cabinet.right': { p: [SB, 0.9, 1.4], ry: PI / 2 },
      'wall.right': { p: [X0 + 0.03, 3.0, 0.4], ry: PI / 2 },
      'floor.pack': { p: [DX - 1.35, 0, DZ + 0.2], ry: 0.45 }, 'floor.gramo': { p: [4.75, 0, 2.3], ry: -PI / 2 },
      'floor.film': { p: [4.3, 0, -2.55], ry: -PI / 2 }, 'floor.portal': { p: [0.2, 0, Z1 - 0.28], ry: PI },
      'floor.holo': { p: [-2.6, 0, 0.2], ry: PI / 2 },
      'floor.window': { p: [0, WIN.y0, Z0 - 0.17], ry: 0, w: WIN.x1 - WIN.x0, h: WIN.y1 - WIN.y0 }
    };
    var solids = [[DX - 0.95, DZ - 0.5, DX + 0.95, DZ + 0.47], [DX - 0.35, DZ + 0.5, DX + 0.35, DZ + 1.0], [0.45, -1.2, 1.45, 1.2], [2.15, -0.65, 2.95, 0.65],
      [2.3, -2.2, 3.2, -1.3], [2.3, 1.3, 3.2, 2.2], [X1 - 1.25, -1.4, X1, 1.4], [X0, -0.95, X0 + 0.58, 1.75], [4.15, Z1 - 0.55, 4.85, Z1], [4.6, -3.9, 5.2, -3.3]];

    return {
      id: 'living', name: 'The Drawing Room', group: g, holder: holder, far: 80, size: { W: X1, D: Z1, H: H }, realistic: true,
      anchors: anchors, avatar: PT.avatar, backdrop: [sky, back],
      start: { pos: [-1.6, 1.55, 3.0], yaw: -0.62, pitch: -0.08 }, startV: 1,
      seat: { x: DX, z: DZ + 0.8, yaw: PI, approach: [DX + 0.7, DZ + 0.9], y: 0.46 },
      desk: { pos: [DX, 1.42, DZ + 1.06], look: [DX, 0.95, DZ - 0.3] },
      solids: solids,
      /* the Study's grand piano stands in the south-west corner as a thing of the layout: it plays, and it can be moved */
      defaultLayout: function () { return { extras: [{ kind: 'vic-piano', title: '三角钢琴', p: [-3.7, 0, 2.2], ry: PI / 2, uid: 9721 }] }; },
      setTime: function (m) { mode = m || 'auto'; apply(); },
      tick: function (t, dt) {
        if (t - lastApply > 20) { lastApply = t; apply(); }
        var fl = 0.82 + 0.12 * Math.sin(t * 9.1) + 0.08 * Math.sin(t * 23.7 + 1.3);
        fire.intensity = (0.55 + 0.75 * night) * fl; logM.emissiveIntensity = 0.35 + 0.3 * fl;
        for (var k = 0; k < flames.length; k++) { var f = flames[k], s = 0.82 + 0.26 * Math.sin(t * (6 + k * 1.7) + k * 2.1); f.scale.set(0.9 + 0.12 * Math.sin(t * 11 + k), s, 1); f.position.y = 0.16 + f.userData.h * s / 2; }
        for (k = ticks.length - 1; k >= 0; k--) { try { ticks[k].tick(t, dt); } catch (e) { ticks.splice(k, 1); } }
      },
      dispose: function () { SR.disposeTree(holder); scene.background = null; }
    };
  }
  SR.register({ id: 'living', name: 'The Drawing Room · Living Room', zh: '会客室 · 维多利亚客厅', icon: '🛋', build: build });
})(window);
