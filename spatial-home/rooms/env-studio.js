/* Minest · Spatial Home · Rooms 2.0 — environment "studio": the Atelier, a studio room next to the Victorian Study.
   The same house and the same hand as the study (walnut panelling, brass, green leather, parquet, a Persian carpet —
   the Study's own textures, js/study/textures.js, and its Victorian furniture, js/furniture.js), but a room to MAKE
   things in: a wall of north-light studio glass, a drafting table under it, an easel, a plan chest and a pin-up wall,
   a long workbench, and the pedestal desk in the middle. Every thing of Spatial Home has its place (the same anchor
   names as the other rooms). Light follows the time of day: daylight through the glass, brass pendants at night. */
(function (root) {
  'use strict';
  var THREE = root.THREE, SR = root.SpatialRoom, PT = SR && SR.parts, TX = root.StudyTex;
  if (!SR || !PT || !TX) return;
  (root.SpatialRoomsNew = root.SpatialRoomsNew || []).push('studio');
  var X0 = -5, X1 = 5, Z0 = -4, Z1 = 4, H = 4.4, PI = Math.PI;
  var WIN = { x0: -2.7, x1: 2.7, y0: 0.9, y1: 3.9 };

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
  function canvasTex(w, h, draw) {
    var c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
    var t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 4; return t;
  }
  /* a draughtsman's sheet: blueprint blue or cream paper, a gridded drawing with dimension lines */
  function sheet(kind, seed) {
    return canvasTex(512, 360, function (x, w, h) {
      var r = TX.rng(seed), blue = kind === 'blue', ink = blue ? 'rgba(220,236,255,' : 'rgba(40,52,74,', i;
      x.fillStyle = blue ? '#1d4f86' : '#efe6d0'; x.fillRect(0, 0, w, h);
      x.strokeStyle = ink + '.16)'; x.lineWidth = 1;
      for (i = 16; i < w; i += 16) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, h); x.stroke(); }
      for (i = 16; i < h; i += 16) { x.beginPath(); x.moveTo(0, i); x.lineTo(w, i); x.stroke(); }
      x.strokeStyle = ink + '.9)'; x.lineWidth = 2; x.strokeRect(14, 14, w - 28, h - 28);
      var cx = 150 + r() * 60, cy = 170, R = 70 + r() * 30;
      for (i = 0; i < 3; i++) { x.beginPath(); x.arc(cx, cy, R - i * 22, 0, 6.3); x.stroke(); }
      for (i = 0; i < 12; i++) { var a = i / 12 * 6.283; x.beginPath(); x.moveTo(cx + Math.cos(a) * (R - 44), cy + Math.sin(a) * (R - 44)); x.lineTo(cx + Math.cos(a) * (R + 8), cy + Math.sin(a) * (R + 8)); x.stroke(); }
      x.strokeRect(300, 70, 150, 96); x.beginPath(); x.moveTo(300, 118); x.lineTo(450, 118); x.moveTo(350, 70); x.lineTo(350, 166); x.stroke();
      x.beginPath(); x.moveTo(300, 200); x.lineTo(450, 200); x.lineTo(450, 290); x.lineTo(380, 250); x.lineTo(300, 290); x.closePath(); x.stroke();
      x.lineWidth = 1; x.beginPath(); x.moveTo(40, 300); x.lineTo(260, 300); x.moveTo(40, 294); x.lineTo(40, 306); x.moveTo(260, 294); x.lineTo(260, 306); x.stroke();
      x.fillStyle = ink + '.9)'; x.font = '600 15px Georgia, serif'; x.fillText('ATELIER · PLATE ' + (1 + (seed % 9)), 30, 40);
      x.font = '11px Georgia, serif'; x.fillText('scale 1 : ' + [2, 5, 10, 20][seed % 4] + '   ·   Minest Studio', 30, 332);
    });
  }
  /* the pin-up wall: cork, with sheets, swatches and photographs pinned to it */
  function pinboard() {
    return canvasTex(1024, 512, function (x, w, h) {
      var r = TX.rng(41), i;
      x.fillStyle = '#b08a5a'; x.fillRect(0, 0, w, h);
      for (i = 0; i < 9000; i++) { x.fillStyle = 'rgba(' + (r() < 0.5 ? '70,45,20' : '225,190,140') + ',' + (0.05 + r() * 0.12) + ')'; x.fillRect(r() * w, r() * h, 1 + r() * 3, 1 + r() * 3); }
      var cols = ['#f3ead6', '#e9dcc0', '#1d4f86', '#f6f1e6', '#c9d9c0', '#e8c9b0', '#d8dfee', '#274b3a', '#8a2f2a', '#d9b46a'];
      for (i = 0; i < 26; i++) {
        var pw = 70 + r() * 110, ph = 60 + r() * 100, px = 20 + r() * (w - pw - 40), py = 16 + r() * (h - ph - 32), c = cols[(r() * cols.length) | 0];
        x.save(); x.translate(px + pw / 2, py + ph / 2); x.rotate((r() - 0.5) * 0.16);
        x.fillStyle = 'rgba(0,0,0,.22)'; x.fillRect(-pw / 2 + 3, -ph / 2 + 4, pw, ph); x.fillStyle = c; x.fillRect(-pw / 2, -ph / 2, pw, ph);
        var dark = c === '#1d4f86' || c === '#274b3a' || c === '#8a2f2a'; x.strokeStyle = dark ? 'rgba(255,255,255,.7)' : 'rgba(40,50,70,.55)'; x.lineWidth = 1.2;
        var k = (r() * 3) | 0, j;
        if (k === 0) for (j = 0; j < 5; j++) { x.beginPath(); x.moveTo(-pw / 2 + 8, -ph / 2 + 12 + j * 11); x.lineTo(pw / 2 - 8 - r() * 30, -ph / 2 + 12 + j * 11); x.stroke(); }
        else if (k === 1) { x.beginPath(); x.arc(0, 0, Math.min(pw, ph) * 0.3, 0, 6.3); x.stroke(); x.strokeRect(-pw * 0.36, -ph * 0.36, pw * 0.72, ph * 0.72); }
        else { x.beginPath(); x.moveTo(-pw * 0.4, ph * 0.3); x.lineTo(-pw * 0.1, -ph * 0.25); x.lineTo(pw * 0.12, ph * 0.1); x.lineTo(pw * 0.4, -ph * 0.3); x.stroke(); }
        x.fillStyle = ['#c0392b', '#d9b46a', '#2e6f9e'][i % 3]; x.beginPath(); x.arc(0, -ph / 2 + 7, 4, 0, 6.3); x.fill();
        x.restore();
      }
    });
  }

  function build(scene) {
    var holder = new THREE.Group(); holder.name = 'env-studio'; scene.add(holder);
    var g = new THREE.Group(); holder.add(g);
    var M = {
      dark: std({ color: lin(0xb59a86), map: TX.wood('dark'), roughness: 0.55 }),
      light: std({ color: lin(0xd9bda0), map: TX.wood('light'), roughness: 0.5 }),
      brass: std({ color: lin(0xc9a24a), roughness: 0.32, metalness: 0.85 }),
      iron: std({ color: lin(0x23262b), roughness: 0.55, metalness: 0.6 }),
      leather: std({ color: lin(0xffffff), map: TX.leather(), roughness: 0.6 }),
      paper: std({ color: lin(0xf3ecdc), roughness: 0.9 }),
      plaster: std({ color: lin(0xf2ebde), map: rep(TX.plaster(), 5, 4), roughness: 0.95, emissive: lin(0xf2ebde), emissiveIntensity: 0.2 }),
      wall: std({ color: lin(0x8f9a8a), map: rep(TX.damask(), 18, 9), roughness: 0.94 }),
      floor: std({ color: lin(0xffffff), map: rep(TX.parquet(), 11, 9), roughness: 0.62 }),
      carpet: std({ color: lin(0xffffff), map: TX.carpet(), roughness: 0.95 })
    };
    function noShadow(m) { m.castShadow = false; return m; }

    /* ── the shell: parquet, plaster ceiling with walnut beams, damask walls over a panelled walnut dado ── */
    noShadow(box(g, M.floor, 0, -0.05, 0, X1 - X0, 0.1, Z1 - Z0));
    noShadow(box(g, M.plaster, 0, H + 0.05, 0, X1 - X0, 0.1, Z1 - Z0));
    var T = 0.2, i, x, z;
    noShadow(box(g, M.wall, X0 - T / 2, H / 2, 0, T, H, Z1 - Z0 + 2 * T));                              // west
    noShadow(box(g, M.wall, X1 + T / 2, H / 2, 0, T, H, Z1 - Z0 + 2 * T));                              // east
    noShadow(box(g, M.wall, 0, H / 2, Z1 + T / 2, X1 - X0, H, T));                                      // south
    noShadow(box(g, M.wall, (X0 + WIN.x0) / 2, H / 2, Z0 - T / 2, WIN.x0 - X0, H, T));                  // north, around the glass
    noShadow(box(g, M.wall, (X1 + WIN.x1) / 2, H / 2, Z0 - T / 2, X1 - WIN.x1, H, T));
    noShadow(box(g, M.dark, 0, WIN.y0 / 2, Z0 - T / 2, WIN.x1 - WIN.x0, WIN.y0, T));
    noShadow(box(g, M.wall, 0, (H + WIN.y1) / 2, Z0 - T / 2, WIN.x1 - WIN.x0, H - WIN.y1, T));
    for (x = -4; x <= 4.01; x += 2) box(g, M.dark, x, H - 0.11, 0, 0.2, 0.22, Z1 - Z0);                   // beams
    [-2, 2].forEach(function (zz) { box(g, M.dark, 0, H - 0.16, zz, X1 - X0, 0.32, 0.26); });
    /* dado: a walnut band with raised panels, a rail on top, a skirting; a picture rail and a cornice above */
    function dado(axis, fix, a, b, side) {
      var L = b - a, n = Math.max(1, Math.round(L / 0.95)), pw = L / n, k, c = (a + b) / 2;
      function at(u, y, w, h, d, m, off) { return axis === 'z' ? box(g, m, fix + side * (off + d / 2), y, u, d, h, w) : box(g, m, u, y, fix + side * (off + d / 2), w, h, d); }
      at(c, 0.56, L, 1.12, 0.03, M.dark, 0); at(c, 1.14, L, 0.06, 0.07, M.light, 0); at(c, 0.08, L, 0.16, 0.05, M.light, 0);
      for (k = 0; k < n; k++) at(a + (k + 0.5) * pw, 0.62, pw - 0.16, 0.72, 0.02, M.light, 0.03);
      at(c, 3.42, L, 0.05, 0.04, M.dark, 0); at(c, H - 0.09, L, 0.18, 0.1, M.light, 0);
    }
    dado('z', X0, Z0, Z1, 1); dado('z', X1, Z0, Z1, -1); dado('x', Z1, X0, X1, -1);
    dado('x', Z0, X0, WIN.x0 - 0.12, 1); dado('x', Z0, WIN.x1 + 0.12, X1, 1);

    /* ── the studio glass: an iron grid of panes across the north wall, a deep walnut sill; the Scenic Window's view
       stands right behind the grid (anchor 'floor.window'), the plain sky behind that ── */
    var sky = new THREE.Mesh(new THREE.PlaneGeometry(40, 22), new THREE.MeshBasicMaterial({ color: 0xe7f0ff })); sky.position.set(0, 5, Z0 - 9); g.add(sky);
    for (i = 0; i <= 6; i++) box(g, M.iron, WIN.x0 + i * (WIN.x1 - WIN.x0) / 6, (WIN.y0 + WIN.y1) / 2, Z0 - 0.05, i % 2 ? 0.035 : 0.07, WIN.y1 - WIN.y0, 0.06);
    for (i = 0; i <= 4; i++) box(g, M.iron, 0, WIN.y0 + i * (WIN.y1 - WIN.y0) / 4, Z0 - 0.05, WIN.x1 - WIN.x0, i % 4 ? 0.035 : 0.07, 0.06);
    box(g, M.light, 0, WIN.y0 + 0.02, Z0 + 0.06, WIN.x1 - WIN.x0 + 0.3, 0.05, 0.36);                        // sill
    [WIN.x0 - 0.09, WIN.x1 + 0.09].forEach(function (xx) { box(g, M.dark, xx, (WIN.y0 + WIN.y1) / 2 + 0.05, Z0 + 0.03, 0.16, WIN.y1 - WIN.y0 + 0.3, 0.1); });
    box(g, M.dark, 0, WIN.y1 + 0.1, Z0 + 0.03, WIN.x1 - WIN.x0 + 0.34, 0.16, 0.1);
    /* the north light: a strip of roof glass over the window, iron glazing bars, the same sky above it */
    var roofSky = new THREE.Mesh(new THREE.PlaneGeometry(WIN.x1 - WIN.x0, 1.5), new THREE.MeshBasicMaterial({ color: 0xe7f0ff })); roofSky.rotation.x = PI / 2; roofSky.position.set(0, H - 0.004, Z0 + 0.95); g.add(roofSky);
    for (i = 0; i <= 6; i++) noShadow(box(g, M.iron, WIN.x0 + i * (WIN.x1 - WIN.x0) / 6, H - 0.02, Z0 + 0.95, i % 6 ? 0.03 : 0.08, 0.04, 1.5));
    [Z0 + 0.2, Z0 + 1.7].forEach(function (zz) { noShadow(box(g, M.iron, 0, H - 0.02, zz, WIN.x1 - WIN.x0 + 0.08, 0.04, 0.08)); });
    /* a garden wall and tree tops beyond the glass, so the view has depth before a window scene is chosen */
    var hedge = std({ color: lin(0x3d6b3a), roughness: 1 }), back = new THREE.Group(); g.add(back);
    noShadow(box(back, hedge, 0, 0.2, Z0 - 5, 26, 2.2, 1.2));
    for (i = 0; i < 7; i++) { var tr = new THREE.Mesh(new THREE.SphereGeometry(1.5 + (i % 3) * 0.4, 12, 9), hedge); tr.position.set(-10.5 + i * 3.5, 2.4 + (i % 2) * 0.7, Z0 - 6.5); back.add(tr); }

    /* ── the Persian carpet and, on it, the Study's pedestal desk and buttoned chair ── */
    var cp = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 3.3), M.carpet); cp.rotation.x = -PI / 2; cp.position.set(0, 0.006, -0.9); cp.receiveShadow = true; g.add(cp);
    var ticks = [];
    function piece(kind, x, z, ry) {
      var F = root.SpatialFurniture || {}, o = null; try { o = F[kind] && F[kind](THREE); } catch (e) {}
      if (!o || !o.group) return null;
      o.group.position.set(x, 0, z); o.group.rotation.y = ry || 0;
      o.group.traverse(function (m) { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
      g.add(o.group); if (typeof o.tick === 'function') ticks.push(o); return o;
    }
    var DZ = -0.9, top = 0.784;
    if (!piece('vic-desk', 0, DZ, PI)) { box(g, M.dark, 0, 0.39, DZ, 1.7, 0.74, 0.9); box(g, M.leather, 0, 0.77, DZ, 1.6, 0.02, 0.8); }
    piece('vic-exec', 0, DZ - 0.9, 0);

    /* ── the drafting table under the glass: a raked board on a walnut trestle, a sheet, a T-square, a brass lamp ── */
    (function (x, z) {
      var d = new THREE.Group(); d.position.set(x, 0, z); g.add(d);
      [-0.72, 0.72].forEach(function (dx) { box(d, M.dark, dx, 0.45, 0, 0.07, 0.9, 0.62); box(d, M.dark, dx, 0.03, 0, 0.1, 0.06, 0.8); });
      box(d, M.dark, 0, 0.3, 0.05, 1.44, 0.06, 0.08); box(d, M.brass, 0, 0.3, 0.05, 0.2, 0.08, 0.1);
      var b = new THREE.Group(); b.position.set(0, 0.98, 0); b.rotation.x = 0.36; d.add(b);
      box(b, M.light, 0, 0, 0, 1.7, 0.045, 1.05); box(b, M.dark, 0, 0.03, 0.5, 1.7, 0.03, 0.05);
      var sh = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.84), std({ map: sheet('blue', 3), roughness: 0.9 })); sh.rotation.x = -PI / 2; sh.position.set(-0.1, 0.026, -0.02); b.add(sh);
      box(b, M.light, -0.1, 0.034, 0.3, 1.3, 0.008, 0.05); box(b, M.light, -0.74, 0.034, 0.3, 0.05, 0.01, 0.3);    // T-square
      box(b, M.brass, 0.72, 0.04, -0.3, 0.05, 0.012, 0.32);                                                        // scale rule
      cyl(d, M.brass, 0.78, 1.42, -0.42, 0.012, 0.012, 0.7); var arm = box(d, M.brass, 0.6, 1.78, -0.36, 0.42, 0.02, 0.02); arm.rotation.y = -0.3;
      var shade = cyl(d, M.brass, 0.42, 1.72, -0.3, 0.05, 0.13, 0.12); shade.material = M.brass;
      box(d, M.dark, 0, 0.24, 0.72, 0.42, 0.04, 0.42); cyl(d, M.brass, 0, 0.36, 0.72, 0.02, 0.02, 0.24); cyl(d, M.leather, 0, 0.5, 0.72, 0.2, 0.2, 0.06);   // stool
    })(-3.2, -3.05);

    /* ── the easel by the window, a canvas in progress on it (the Grande Jatte the house already owns) ── */
    (function (x, z, ry) {
      var e = new THREE.Group(); e.position.set(x, 0, z); e.rotation.y = ry; g.add(e);
      [-0.38, 0.38].forEach(function (dx) { var p = box(e, M.dark, dx, 1.1, 0, 0.05, 2.2, 0.05); p.rotation.x = -0.12; });
      var bk = box(e, M.dark, 0, 1.05, -0.42, 0.05, 2.15, 0.05); bk.rotation.x = 0.28;
      box(e, M.dark, 0, 0.74, 0.1, 0.95, 0.05, 0.12); box(e, M.dark, 0, 2.0, -0.11, 0.7, 0.05, 0.05);
      var art = std({ color: lin(0xe9e2d0), roughness: 0.85 });
      try { art.map = new THREE.TextureLoader().load('art/grande-jatte.jpg', function (t) { t.encoding = THREE.sRGBEncoding; art.color.set(0xffffff); art.needsUpdate = true; }); } catch (er) {}
      var cv = box(e, M.paper, 0, 1.3, 0.06, 1.3, 0.9, 0.03); cv.rotation.x = -0.12;
      var face = new THREE.Mesh(new THREE.PlaneGeometry(1.24, 0.84), art); face.position.set(0, 1.3, 0.082); face.rotation.x = -0.12; e.add(face);
      box(e, M.light, 0.3, 0.79, 0.13, 0.3, 0.02, 0.1);                                                  // brushes on the ledge
    })(2.35, -2.9, -0.45);

    /* ── east wall: material shelves (books, rolls, boxes), then the long workbench with drawers ── */
    (function () {
      var a = -2.7, b = -0.7, d = 0.4, hh = 3.2, cx = X1 - d / 2;
      box(g, M.dark, cx, hh / 2, a, d, hh, 0.05); box(g, M.dark, cx, hh / 2, b, d, hh, 0.05); box(g, M.dark, cx, hh / 2, (a + b) / 2, d, hh, 0.04);
      box(g, M.dark, X1 - 0.015, hh / 2, (a + b) / 2, 0.03, hh, b - a); box(g, M.light, cx, hh + 0.04, (a + b) / 2, d + 0.06, 0.1, b - a + 0.12);
      var rows = 7, r = TX.rng(77), n = 0, list = [], k, zz;
      for (k = 0; k < rows; k++) {
        var y = 0.2 + k * 0.44; box(g, M.light, cx, y - 0.015, (a + b) / 2, d - 0.02, 0.03, b - a);
        [[a + 0.05, (a + b) / 2 - 0.04], [(a + b) / 2 + 0.04, b - 0.05]].forEach(function (seg) {
          zz = seg[0];
          while (zz < seg[1] - 0.06) {
            var w = 0.025 + r() * 0.04, bh = 0.24 + r() * 0.14, lean = r() < 0.06;
            if (r() < 0.1) { zz += 0.08 + r() * 0.12; continue; }
            list.push([cx - 0.05 - r() * 0.03, y + bh / 2, zz + w / 2, 0.2 + r() * 0.05, bh, w, lean ? 0.2 : 0, r()]); zz += w + 0.004 + (lean ? 0.03 : 0);
          }
        });
      }
      var bm = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), std({ roughness: 0.8 }), list.length), o = new THREE.Object3D(), c = new THREE.Color();
      var hues = [0x5a1f1c, 0x1f3d2c, 0x24304f, 0x6b4a1f, 0x3b2a22, 0x7a6a4a, 0x2e2e33, 0x8a5a2a];
      list.forEach(function (q) { o.position.set(q[0], q[1], q[2]); o.rotation.set(q[6], 0, 0); o.scale.set(q[3], q[4], q[5]); o.updateMatrix(); bm.setMatrixAt(n, o.matrix); bm.setColorAt(n, c.copy(lin(hues[(q[7] * hues.length) | 0])).multiplyScalar(0.8 + q[7] * 0.5)); n++; });
      bm.castShadow = true; bm.receiveShadow = true; g.add(bm);
      /* the workbench */
      var z0 = 0.1, z1 = 3.0, bd = 0.56, bh2 = 0.8, bx = X1 - bd / 2, L = z1 - z0;
      box(g, M.dark, bx, bh2 / 2, (z0 + z1) / 2, bd, bh2 - 0.02, L); box(g, M.light, bx, bh2 + 0.012, (z0 + z1) / 2, bd + 0.05, 0.045, L + 0.06);
      for (k = 0; k < 4; k++) for (var j = 0; j < 2; j++) {
        var zc = z0 + (k + 0.5) * L / 4, yc = 0.22 + j * 0.32;
        box(g, M.light, X1 - bd - 0.006, yc, zc, 0.02, 0.27, L / 4 - 0.05); box(g, M.brass, X1 - bd - 0.024, yc, zc, 0.02, 0.025, 0.14);
      }
      var fr = [sheet('cream', 5), sheet('blue', 8)];                                                   // two framed plates over the bench
      [0.85, 2.3].forEach(function (zc, q) {
        box(g, M.dark, X1 - 0.03, 2.2, zc, 0.04, 0.86, 1.16);
        var p = new THREE.Mesh(new THREE.PlaneGeometry(1.04, 0.74), std({ map: fr[q], roughness: 0.8 })); p.rotation.y = -PI / 2; p.position.set(X1 - 0.052, 2.2, zc); g.add(p);
      });
    })();

    /* ── west wall: the board's place, then the pin-up wall over the plan chest (shallow drawers for drawings) ── */
    (function () {
      var z0 = 1.35, z1 = 3.55, d = 0.7, hh = 0.92, cx = X0 + d / 2, L = z1 - z0, k;
      box(g, M.dark, cx, hh / 2, (z0 + z1) / 2, d, hh - 0.02, L); box(g, M.light, cx, hh + 0.012, (z0 + z1) / 2, d + 0.05, 0.045, L + 0.06);
      for (k = 0; k < 7; k++) { box(g, M.light, X0 + d + 0.006, 0.12 + k * 0.115, (z0 + z1) / 2, 0.02, 0.095, L - 0.08); [-0.6, 0.6].forEach(function (dz) { box(g, M.brass, X0 + d + 0.024, 0.12 + k * 0.115, (z0 + z1) / 2 + dz, 0.02, 0.02, 0.16); }); }
      for (k = 0; k < 5; k++) { var rl = cyl(g, M.paper, cx - 0.1 + (k % 2) * 0.12, hh + 0.075 + (k > 2 ? 0.07 : 0), z0 + 0.35 + (k % 3) * 0.09, 0.04, 0.04, 0.9, 12); rl.rotation.x = PI / 2; rl.position.z = z0 + 0.62 + (k % 2) * 0.1; }
      box(g, M.dark, cx + 0.05, hh + 0.1, z1 - 0.45, 0.3, 0.14, 0.4); box(g, M.brass, cx + 0.05, hh + 0.18, z1 - 0.45, 0.06, 0.02, 0.1);          // an instrument case
      box(g, M.dark, X0 + 0.03, 2.25, (z0 + z1) / 2, 0.04, 1.36, L + 0.1);
      var pb = new THREE.Mesh(new THREE.PlaneGeometry(L, 1.26), std({ map: pinboard(), roughness: 0.95 })); pb.rotation.y = PI / 2; pb.position.set(X0 + 0.052, 2.25, (z0 + z1) / 2); g.add(pb);
    })();

    /* ── the reading corner (south-west of the carpet): two buttoned chairs and a round walnut table ── */
    piece('vic-tufted', -1.6, 2.8, PI - 0.5); piece('vic-tufted', -0.1, 2.98, PI + 0.45);
    cyl(g, M.dark, -0.87, 0.02, 2.5, 0.24, 0.26, 0.04); cyl(g, M.light, -0.87, 0.32, 2.5, 0.035, 0.05, 0.6); cyl(g, M.dark, -0.87, 0.635, 2.5, 0.36, 0.36, 0.035, 28);
    /* ── south wall: the door (decor), the longcase clock; the globe by the bench ── */
    box(g, M.dark, 3.7, 1.15, Z1 - 0.03, 1.2, 2.3, 0.06); box(g, M.light, 3.7, 1.15, Z1 - 0.07, 0.96, 2.06, 0.03);
    [[3.46, 1.6], [3.94, 1.6], [3.46, 0.6], [3.94, 0.6]].forEach(function (q) { box(g, M.dark, q[0], q[1], Z1 - 0.09, 0.36, q[1] > 1 ? 0.9 : 0.8, 0.02); });
    box(g, M.brass, 3.3, 1.05, Z1 - 0.11, 0.04, 0.12, 0.04);
    piece('vic-clock', 1.25, Z1 - 0.3, PI); piece('vic-globe', -1.7, -3.3, 0.5);

    /* ── light: the sky through the glass (casts the shadows), three brass pendants over the desk and the bench ── */
    var hemi = new THREE.HemisphereLight(0xfff0dc, 0x3b2a1c, 0.72); holder.add(hemi);
    var sun = new THREE.DirectionalLight(0xdbe6ff, 1.05); sun.position.set(1.2, 6.2, Z0 - 5); sun.target.position.set(0, 0.4, 0.2);
    sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); var sc = sun.shadow.camera; sc.left = -7; sc.right = 7; sc.top = 7; sc.bottom = -7; sc.near = 0.5; sc.far = 18;
    sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.02; holder.add(sun); holder.add(sun.target);
    var fill = new THREE.DirectionalLight(0xffe2bd, 0.28); fill.position.set(-2, 3.6, 5); holder.add(fill);
    var bulbs = [], lamps = [];
    [[0, -0.9], [-2.6, 0.9], [2.6, 0.9]].forEach(function (q, k) {
      cyl(g, M.brass, q[0], H - 0.72, q[1], 0.008, 0.008, 1.0, 6); var sh = cyl(g, M.brass, q[0], H - 1.3, q[1], 0.06, 0.26, 0.2, 24); sh.castShadow = false;
      var bm = new THREE.MeshBasicMaterial({ color: 0xffe2b0 }), b = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 8), bm); b.position.set(q[0], H - 1.38, q[1]); g.add(b); bulbs.push(bm);
      var pl = new THREE.PointLight(0xffd9a0, 0.4, 7, 2); pl.position.set(q[0], H - 1.45, q[1]); holder.add(pl); lamps.push(pl);
    });
    var boardLight = new THREE.SpotLight(0xffe2b8, 0.5, 6, 0.6, 0.6, 1.5); boardLight.position.set(X0 + 2.0, H - 0.4, -0.5); boardLight.target.position.set(X0 + 0.1, 1.7, -0.5); holder.add(boardLight); holder.add(boardLight.target);
    scene.fog = null; scene.background = new THREE.Color(0x15100c);

    var mode = 'auto', lastApply = -99;
    function c3(a, b, k) { return new THREE.Color(a).lerp(new THREE.Color(b), k); }
    function apply() {
      var D = SR.timeOfDay(mode), L = D.light, K = D.dusk, N = D.night;
      sky.material.color.copy(c3('#101a35', '#e7f0ff', L)).lerp(new THREE.Color('#f6b48a'), K * 0.6); roofSky.material.color.copy(sky.material.color);
      M.plaster.emissiveIntensity = 0.06 + 0.2 * L;
      hedge.color.copy(lin(0x3d6b3a)).multiplyScalar(0.12 + 0.88 * L);
      sun.intensity = 0.06 + 0.84 * L; sun.color.copy(c3('#8fa4ff', '#dbe6ff', L)).lerp(new THREE.Color('#ffb27a'), K * 0.6);
      hemi.intensity = 0.3 + 0.42 * L; fill.intensity = 0.1 + 0.18 * L;
      lamps.forEach(function (l) { l.intensity = 0.25 + 0.75 * N; }); bulbs.forEach(function (b) { b.color.set(N > 0.3 ? 0xffe9c4 : 0xd9c8a0); });
      boardLight.intensity = 0.3 + 0.5 * N;
    }
    apply();

    /* anchors: where each thing of Spatial Home goes in the Atelier (y = the surface it stands on) */
    var anchors = {
      'desk.left': { p: [-0.12, top, DZ - 0.2], ry: PI }, 'desk.right': { p: [0.3, top, DZ + 0.06], ry: PI },
      'desk.quill': { p: [-0.42, top, DZ - 0.26], ry: PI + 0.25 }, 'desk.mochi': { p: [0.68, top, DZ - 0.24], ry: PI - 0.3 },
      'desk.key': { p: [0.0, top, DZ + 0.28], ry: PI + 0.3 }, 'desk.book': { p: [-0.87, 0.655, 2.5], ry: PI },          // the reading stand on the round table
      'sill.left': { p: [-1.2, WIN.y0 + 0.046, Z0 + 0.1], ry: 0 },
      'corner.window': { p: [4.05, 0, -3.42], ry: 0 },                                                                 // Octo's aquarium in the north-east corner, in the light
      'wall.left': { p: [X0 + 0.06, 1.85, -0.5], ry: PI / 2 },                                                          // the EC–6 board on the west wall
      'cabinet.left': { p: [X1 - 0.29, 0.836, 0.62], ry: -PI / 2 }, 'shelf.mid': { p: [X1 - 0.29, 0.836, 1.2], ry: -PI / 2 },
      'cabinet.top': { p: [X1 - 0.29, 0.836, 1.9], ry: -PI / 2 }, 'cabinet.right': { p: [X1 - 0.29, 0.836, 2.6], ry: -PI / 2 },
      'wall.right': { p: [X1 - 0.03, 2.95, 1.55], ry: -PI / 2 },
      'floor.pack': { p: [-1.35, 0, DZ + 0.15], ry: 0.45 }, 'floor.gramo': { p: [4.22, 0, -0.3], ry: -PI / 2 },
      'floor.film': { p: [2.35, 0, 1.9], ry: 0 }, 'floor.portal': { p: [-3.3, 0, Z1 - 0.28], ry: PI },
      'floor.holo': { p: [-0.6, 0, 1.5], ry: PI },
      'floor.window': { p: [0, WIN.y0, Z0 - 0.17], ry: 0, w: WIN.x1 - WIN.x0, h: WIN.y1 - WIN.y0 }     // the Scenic Window IS the studio glass: its view, behind the iron grid
    };
    var solids = [[-0.95, DZ - 1.3, 0.95, DZ + 0.5], [-4.15, Z0, -2.25, -2.3], [1.85, -3.35, 2.85, -2.45], [X1 - 0.45, -2.75, X1, -0.65], [X1 - 0.6, 0.05, X1, 3.05],
      [X0, 1.3, X0 + 0.75, 3.6], [-2.15, 2.3, 0.45, 3.45], [0.9, Z1 - 0.55, 1.6, Z1], [-2.2, -3.8, -1.2, -2.8], [3.5, Z0, 4.6, -3.1]];

    return {
      id: 'studio', name: 'The Atelier · Studio Room', group: g, holder: holder, far: 80, size: { W: X1, D: Z1, H: H }, realistic: true,
      anchors: anchors, avatar: PT.avatar, backdrop: [sky, back],                       // hidden when a window view is chosen (views.js)
      start: { pos: [1.1, 1.55, 2.6], yaw: 0.2, pitch: -0.07 }, startV: 1,
      seat: { x: 0, z: DZ - 0.9, yaw: 0, approach: [0.9, DZ - 0.85], y: 0.46 },
      desk: { pos: [0, 1.5, DZ - 1.1], look: [0, 0.78, DZ + 1.1] },
      solids: solids,
      setTime: function (m) { mode = m || 'auto'; apply(); },
      tick: function (t, dt) {
        if (t - lastApply > 20) { lastApply = t; apply(); }
        for (var k = ticks.length - 1; k >= 0; k--) { try { ticks[k].tick(t, dt); } catch (e) { ticks.splice(k, 1); } }
      },
      dispose: function () { SR.disposeTree(holder); scene.background = null; }
    };
  }
  SR.register({ id: 'studio', name: 'The Atelier · Studio Room', zh: '工作室 · 维多利亚画室', icon: '🎨', build: build });
})(window);
