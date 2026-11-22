/* Minest · Spatial Home · Rooms 2.0 — environment "studio": the Studio, a music production room next to the Victorian Study.
   The same house and the same hand as the study (walnut panelling, brass, parquet, a Persian carpet — the Study's own
   textures, js/study/textures.js), fitted out to make records in: a production desk with two Pro Display XDRs side by
   side, near-field monitors and a Mac Pro, three-way mains on stands, a MIDI keyboard, a glass-fronted recording booth
   with a condenser microphone, a DJ booth with two Pioneer CDJ players and a DJM mixer, a drum kit, guitars and an
   amplifier stack, a couch behind the mix position, absorbers on the walls and a cloud over the desk.
   Every thing of Spatial Home has its place (the same anchor names as the other rooms). Light follows the time of day:
   daylight through the studio glass, the cloud's strip and the brass pendants at night. Meters move, the booth's REC
   sign and the DJ booth's light strip glow (still when the system asks for reduced motion). */
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
  function canvasTex(w, h, draw, rx, ry) {
    var c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
    var t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 4;
    if (rx) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); } return t;
  }
  /* what is on the two displays: a session's arrangement (left) and its mixer (right) */
  function dawTex(kind) {
    return canvasTex(1024, 576, function (x, w, h) {
      var r = TX.rng(kind === 'mix' ? 61 : 17), i, j, cols = ['#ff5a5f', '#ffb400', '#00c2a8', '#3fa7ff', '#b07cff', '#7bd33f', '#ff7ac6', '#ffd166'];
      x.fillStyle = '#17181c'; x.fillRect(0, 0, w, h); x.fillStyle = '#23252b'; x.fillRect(0, 0, w, 34);
      x.fillStyle = '#9aa0aa'; x.font = '600 15px Helvetica, Arial, sans-serif'; x.fillText(kind === 'mix' ? 'Mixer — Minest Session' : 'Minest Session — Tracks', 16, 23);
      ['#ff5f57', '#febc2e', '#28c840'].forEach(function (c, k) { x.fillStyle = c; x.beginPath(); x.arc(w - 70 + k * 22, 17, 6, 0, 6.3); x.fill(); });
      if (kind === 'mix') {
        for (i = 0; i < 16; i++) {
          var cx = 12 + i * 63; x.fillStyle = i % 2 ? '#1d1f24' : '#202228'; x.fillRect(cx, 42, 59, h - 52);
          x.fillStyle = cols[i % 8]; x.fillRect(cx, 42, 59, 8);
          for (j = 0; j < 3; j++) { x.strokeStyle = '#6b7280'; x.lineWidth = 2; x.beginPath(); x.arc(cx + 30, 80 + j * 44, 13, 0.8 * Math.PI, 2.2 * Math.PI); x.stroke(); x.strokeStyle = cols[i % 8]; x.beginPath(); x.arc(cx + 30, 80 + j * 44, 13, 0.8 * Math.PI, (0.9 + r() * 1.2) * Math.PI); x.stroke(); }
          x.fillStyle = '#0f1013'; x.fillRect(cx + 12, 220, 8, 300); x.fillRect(cx + 38, 220, 10, 300);
          var lv = 0.3 + r() * 0.6; var gr = x.createLinearGradient(0, 520, 0, 220); gr.addColorStop(0, '#1fd16b'); gr.addColorStop(0.7, '#e6d32a'); gr.addColorStop(1, '#ff4d4d');
          x.fillStyle = gr; x.fillRect(cx + 38, 520 - 300 * lv, 10, 300 * lv);
          x.fillStyle = '#d7dae0'; x.fillRect(cx + 5, 500 - 240 * (0.3 + r() * 0.5), 22, 12);
        }
      } else {
        x.fillStyle = '#1d1f24'; x.fillRect(0, 34, 150, h); x.fillStyle = '#2a2d34'; for (i = 0; i < 20; i++) x.fillRect(150 + i * 44, 34, 1, h);
        var names = ['Kick', 'Snare', 'Hats', 'Bass', 'Keys', 'Gtr L', 'Gtr R', 'Pad', 'Lead Vox', 'BGV', 'FX', 'Strings'];
        for (i = 0; i < 12; i++) {
          var y = 44 + i * 44; x.fillStyle = cols[i % 8]; x.fillRect(0, y, 6, 38); x.fillStyle = '#c5c9d1'; x.font = '13px Helvetica, Arial, sans-serif'; x.fillText(names[i], 16, y + 24);
          var px = 156 + r() * 60;
          while (px < w - 40) {
            var cw = 60 + r() * 190; if (px + cw > w - 8) cw = w - 8 - px; x.globalAlpha = 0.85; x.fillStyle = cols[i % 8]; x.fillRect(px, y, cw, 38); x.globalAlpha = 1;
            x.strokeStyle = 'rgba(0,0,0,.55)'; x.lineWidth = 1; x.beginPath(); for (j = 0; j < cw; j += 3) { var a = (4 + r() * 13) * (0.4 + 0.6 * Math.abs(Math.sin(j * 0.05 + i))); x.moveTo(px + j, y + 19 - a); x.lineTo(px + j, y + 19 + a); } x.stroke();
            px += cw + 6 + (r() < 0.3 ? 40 + r() * 80 : 0);
          }
        }
        x.fillStyle = '#ffffff'; x.fillRect(520, 34, 2, h);
      }
    });
  }
  /* the machined lattice of the Mac Pro and the back of a Pro Display XDR: rows of dark spherical holes in aluminium */
  function latticeTex(rx, ry) {
    return canvasTex(128, 128, function (x, w, h) {
      x.fillStyle = '#c9ccd1'; x.fillRect(0, 0, w, h);
      for (var j = 0; j < 4; j++) for (var i = 0; i < 4; i++) { var cx = i * 32 + (j % 2 ? 16 : 0) + 8, cy = j * 32 + 16, gr = x.createRadialGradient(cx - 3, cy - 3, 2, cx, cy, 13); gr.addColorStop(0, '#3b3d42'); gr.addColorStop(1, '#8e9197'); x.fillStyle = gr; x.beginPath(); x.arc(cx, cy, 12.5, 0, 6.3); x.fill(); if (cx + 12 > w) { x.beginPath(); x.arc(cx - w, cy, 12.5, 0, 6.3); x.fill(); } }
    }, rx, ry);
  }
  /* acoustic foam: rows of dark wedges */
  function foamTex(rx, ry) {
    return canvasTex(128, 128, function (x, w, h) {
      for (var j = 0; j < 4; j++) for (var i = 0; i < 4; i++) { var gr = (i + j) % 2 ? x.createLinearGradient(i * 32, 0, i * 32 + 32, 0) : x.createLinearGradient(0, j * 32, 0, j * 32 + 32); gr.addColorStop(0, '#1c1d20'); gr.addColorStop(0.5, '#4a4c52'); gr.addColorStop(1, '#1c1d20'); x.fillStyle = gr; x.fillRect(i * 32, j * 32, 32, 32); }
    }, rx, ry);
  }
  function keysTex() {
    return canvasTex(1024, 96, function (x, w, h) {
      x.fillStyle = '#f4f2ec'; x.fillRect(0, 0, w, h); var n = 52, kw = w / n, i; x.fillStyle = '#9a9a9a'; for (i = 1; i < n; i++) x.fillRect(i * kw - 0.6, 0, 1.2, h);
      x.fillStyle = '#111'; for (i = 0; i < n - 1; i++) { var k = i % 7; if (k === 1 || k === 4) continue; x.fillRect((i + 1) * kw - kw * 0.3, 0, kw * 0.6, h * 0.62); }
    });
  }
  function labelTex(text, bg, fg, w, h, font) {
    return canvasTex(w || 256, h || 64, function (x, W, Hh) { x.fillStyle = bg; x.fillRect(0, 0, W, Hh); x.fillStyle = fg; x.font = font || '700 30px Helvetica, Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, W / 2, Hh / 2 + 1); });
  }
  function waveTex(seed) {
    return canvasTex(256, 128, function (x, w, h) {
      var r = TX.rng(seed), i; x.fillStyle = '#0b0d12'; x.fillRect(0, 0, w, h); x.fillStyle = '#1a1d26'; x.fillRect(0, 0, w, 22);
      x.fillStyle = '#e8eaf0'; x.font = '700 13px Helvetica, Arial, sans-serif'; x.fillText(seed % 2 ? '124.0 BPM' : '126.0 BPM', 8, 16); x.fillStyle = '#ff9f1c'; x.fillText(seed % 2 ? '-02:14' : '-03:41', w - 62, 16);
      for (i = 0; i < w; i += 2) { var a = 6 + r() * 30 * (0.35 + 0.65 * Math.abs(Math.sin(i * 0.04 + seed))); x.fillStyle = i < w * 0.45 ? '#2f6bff' : '#57b5ff'; x.fillRect(i, 72 - a, 1.5, a * 2); }
      x.fillStyle = '#ff3b30'; x.fillRect(w * 0.45, 26, 2, h - 30);
    });
  }

  function build(scene) {
    var holder = new THREE.Group(); holder.name = 'env-studio'; scene.add(holder);
    var g = new THREE.Group(); holder.add(g);
    var M = {
      dark: std({ color: lin(0xb59a86), map: TX.wood('dark'), roughness: 0.55 }),
      light: std({ color: lin(0xd9bda0), map: TX.wood('light'), roughness: 0.5 }),
      brass: std({ color: lin(0xc9a24a), roughness: 0.32, metalness: 0.85 }),
      gilt: std({ color: lin(0xd9b46a), roughness: 0.3, metalness: 0.9 }),
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

    /* ── more materials: the studio's gear ── */
    M.black = std({ color: lin(0x121214), roughness: 0.6 }); M.gloss = std({ color: lin(0x0c0c0e), roughness: 0.18, metalness: 0.3 });
    M.alu = std({ color: lin(0xd4d6da), roughness: 0.32, metalness: 0.85 }); M.chrome = std({ color: lin(0xe8eaee), roughness: 0.12, metalness: 1 });
    M.fabric = std({ color: lin(0x34363b), roughness: 1 }); M.wine = std({ color: lin(0x5b2028), roughness: 1 });
    M.glass = std({ color: lin(0xcfe4ee), roughness: 0.05, transparent: true, opacity: 0.16, depthWrite: false });
    M.foam = std({ color: lin(0xffffff), map: foamTex(8, 6), roughness: 1 });
    M.cone = std({ color: lin(0xf1efe8), roughness: 0.7 }); M.coneDark = std({ color: lin(0x2a2b2f), roughness: 0.5, metalness: 0.2 });
    M.shell = std({ color: lin(0x8f1820), roughness: 0.25, metalness: 0.45 }); M.head = std({ color: lin(0xf3f1ea), roughness: 0.8 });
    M.cym = std({ color: lin(0xe0bb58), roughness: 0.35, metalness: 0.55, emissive: lin(0x3a2a08) });
    function basic(c) { return new THREE.MeshBasicMaterial({ color: c }); }
    function disc(p, m, x, y, z, r, th, seg) { var c = cyl(p, m, x, y, z, r, r, th || 0.012, seg || 28); c.rotation.x = PI / 2; return c; }   // a disc facing ±z
    var meters = [], glow = [];
    function meter(p, x, y, z, n, w, hMax, col) {                                                   // a row of level bars that move with the music
      for (var k = 0; k < n; k++) { var b = new THREE.Mesh(new THREE.BoxGeometry(w, 1, 0.004), basic(col || 0x35e07a)); b.position.set(x + k * w * 1.5, y, z); p.add(b); meters.push({ m: b, y: y, h: hMax, f: 2.1 + k * 0.63, ph: k * 1.7 + meters.length }); }
    }
    /* a loudspeaker: cabinet, woofer and tweeter with trim rings (big = a three-way main) */
    function spk(p, x, y, z, w, h, d, ry, big) {
      var s = new THREE.Group(); s.position.set(x, y, z); s.rotation.y = ry || 0; p.add(s);
      box(s, big ? M.dark : M.black, 0, 0, 0, w, h, d); box(s, M.black, 0, 0, d / 2 + 0.004, w - 0.02, h - 0.02, 0.008);
      var rw = w * 0.36, f = d / 2 + 0.012;
      disc(s, big ? M.coneDark : M.cone, 0, -h * (big ? 0.24 : 0.14), f, rw, 0.012); disc(s, M.black, 0, -h * (big ? 0.24 : 0.14), f + 0.004, rw * 0.3, 0.012);
      var t1 = new THREE.Mesh(new THREE.TorusGeometry(rw, 0.008, 8, 32), big ? M.brass : M.gloss); t1.position.set(0, -h * (big ? 0.24 : 0.14), f + 0.004); s.add(t1);
      if (big) { disc(s, M.coneDark, 0, h * 0.1, f, rw * 0.6, 0.012); var t2 = new THREE.Mesh(new THREE.TorusGeometry(rw * 0.6, 0.006, 8, 28), M.brass); t2.position.set(0, h * 0.1, f + 0.004); s.add(t2); }
      disc(s, M.gloss, 0, h * (big ? 0.34 : 0.28), f, w * 0.12, 0.012); var led = new THREE.Mesh(new THREE.SphereGeometry(0.006, 6, 4), basic(0xffffff)); led.position.set(w * 0.36, -h * 0.44, f); s.add(led);
      return s;
    }

    /* ── the carpet; on it the production desk: two Pro Display XDRs side by side on a bridge, near-fields beside them,
       keyboard and mouse, outboard racks in the pedestals; the Mac Pro and a gear rack on the floor to the right ── */
    var cp = new THREE.Mesh(new THREE.PlaneGeometry(5.0, 3.4), M.carpet); cp.rotation.x = -PI / 2; cp.position.set(0, 0.006, -0.95); cp.receiveShadow = true; g.add(cp);
    var ticks = [];
    function piece(kind, x, z, ry) {
      var F = root.SpatialFurniture || {}, o = null; try { o = F[kind] && F[kind](THREE); } catch (e) {}
      if (!o || !o.group) return null;
      o.group.position.set(x, 0, z); o.group.rotation.y = ry || 0;
      o.group.traverse(function (m) { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
      g.add(o.group); if (typeof o.tick === 'function') ticks.push(o); return o;
    }
    var DZ = -1.3, top = 0.765;
    box(g, M.light, 0, 0.74, DZ, 2.5, 0.045, 1.0);
    [-0.98, 0.98].forEach(function (dx, q) {
      box(g, M.dark, dx, 0.36, DZ, 0.5, 0.72, 0.9);
      for (var k = 0; k < 4; k++) { box(g, M.black, dx, 0.13 + k * 0.155, DZ + 0.452, 0.44, 0.14, 0.012); [-0.17, -0.11, -0.05].forEach(function (kx) { disc(g, M.alu, dx + kx, 0.13 + k * 0.155, DZ + 0.462, 0.016, 0.012, 12); }); if (k % 2 === q) meter(g, dx + 0.04, 0.13 + k * 0.155, DZ + 0.46, 8, 0.012, 0.09); else { var lcd = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.06), basic(0x2f8cff)); lcd.position.set(dx + 0.11, 0.13 + k * 0.155, DZ + 0.4585); g.add(lcd); } }
    });
    box(g, M.dark, 0, 0.5, DZ - 0.44, 1.46, 0.42, 0.03);
    box(g, M.light, 0, 0.885, DZ - 0.3, 2.3, 0.03, 0.34); [-1.12, 0, 1.12].forEach(function (dx) { box(g, M.dark, dx, 0.816, DZ - 0.3, 0.04, 0.108, 0.32); });
    var screenL = new THREE.MeshBasicMaterial({ map: dawTex('arr') }), screenR = new THREE.MeshBasicMaterial({ map: dawTex('mix') }), latt = std({ color: lin(0xffffff), map: latticeTex(9, 5), roughness: 0.35, metalness: 0.7 });
    [[-0.47, 0.14, screenL], [0.47, -0.14, screenR]].forEach(function (q) {
      var d = new THREE.Group(); d.position.set(q[0], 0.9, DZ - 0.3); d.rotation.y = q[1]; d.scale.setScalar(1.28); g.add(d);
      box(d, M.alu, 0, 0.006, -0.02, 0.2, 0.012, 0.18); box(d, M.alu, 0, 0.2, -0.07, 0.055, 0.38, 0.025); box(d, M.alu, 0, 0.33, -0.04, 0.09, 0.09, 0.05);
      box(d, M.alu, 0, 0.335, 0, 0.718, 0.412, 0.027); box(d, M.gloss, 0, 0.335, 0.0138, 0.714, 0.408, 0.002);
      var sc = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.394), q[2]); sc.position.set(0, 0.335, 0.0152); d.add(sc);
      var bk = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.394), latt); bk.position.set(0, 0.335, -0.0142); bk.rotation.y = PI; d.add(bk);
    });
    box(g, M.light, 0, 0.885, DZ - 0.3, 2.74, 0.03, 0.34); spk(g, -1.2, 1.075, DZ - 0.3, 0.22, 0.35, 0.24, 0.42); spk(g, 1.2, 1.075, DZ - 0.3, 0.22, 0.35, 0.24, -0.42);
    box(g, M.alu, 0.28, top + 0.005, DZ + 0.3, 0.42, 0.008, 0.115); box(g, M.cone, 0.28, top + 0.0095, DZ + 0.3, 0.4, 0.002, 0.1);
    var mouse = new THREE.Mesh(new THREE.SphereGeometry(0.03, 14, 10), M.cone); mouse.scale.set(1, 0.4, 1.7); mouse.position.set(0.6, top + 0.012, DZ + 0.32); g.add(mouse);
    spk(g, 0, 0.23, DZ - 0.12, 0.42, 0.44, 0.44, 0);                                                  // the subwoofer under the desk
    (function (x, z) {                                                                                // the mix chair: low back, so the screens stay in view
      var c = new THREE.Group(); c.position.set(x, 0, z); c.rotation.y = PI; g.add(c);
      for (var k = 0; k < 5; k++) { var a = k * PI * 0.4, l = box(c, M.alu, Math.sin(a) * 0.15, 0.06, Math.cos(a) * 0.15, 0.04, 0.025, 0.3); l.rotation.y = a; cyl(c, M.black, Math.sin(a) * 0.29, 0.03, Math.cos(a) * 0.29, 0.03, 0.03, 0.03, 10).rotation.z = PI / 2; }
      cyl(c, M.chrome, 0, 0.25, 0, 0.025, 0.025, 0.36, 10); box(c, M.black, 0, 0.45, 0, 0.5, 0.07, 0.48); box(c, M.fabric, 0, 0.49, 0, 0.46, 0.03, 0.44);
      box(c, M.alu, 0, 0.62, -0.24, 0.05, 0.3, 0.02); var bk = box(c, M.fabric, 0, 0.84, -0.25, 0.46, 0.42, 0.05); bk.rotation.x = -0.1;
      [-0.27, 0.27].forEach(function (dx) { box(c, M.alu, dx, 0.58, -0.02, 0.02, 0.2, 0.03); box(c, M.black, dx, 0.69, 0.02, 0.05, 0.03, 0.26); });
    })(0, DZ + 0.8);
    (function (x, z) {                                                                                // the Mac Pro: aluminium tower, lattice front and back, steel frame
      var body = new THREE.Mesh(new THREE.BoxGeometry(0.218, 0.5, 0.45), [M.alu, M.alu, M.alu, M.alu, std({ color: lin(0xffffff), map: latticeTex(3, 7), roughness: 0.35, metalness: 0.7 }), latt]);
      body.position.set(x, 0.31, z); body.castShadow = true; g.add(body);
      [[-0.1, -0.2], [0.1, -0.2], [-0.1, 0.2], [0.1, 0.2]].forEach(function (q) { cyl(g, M.chrome, x + q[0], 0.31, z + q[1], 0.011, 0.011, 0.62, 8); });
      [-0.2, 0.2].forEach(function (dz) { box(g, M.chrome, x, 0.625, z + dz, 0.22, 0.014, 0.022); });
    })(1.5, DZ + 0.12);
    (function (x, z) {                                                                                // the gear rack: compressors and preamps, their meters moving
      box(g, M.black, x, 0.44, z, 0.56, 0.88, 0.5); box(g, M.light, x, 0.895, z, 0.6, 0.03, 0.54);
      for (var k = 0; k < 5; k++) { var y = 0.13 + k * 0.165; box(g, k % 2 ? M.alu : M.gloss, x, y, z + 0.252, 0.5, 0.15, 0.008); [-0.2, -0.13, -0.06].forEach(function (kx) { disc(g, k % 2 ? M.black : M.alu, x + kx, y, z + 0.262, 0.018, 0.014, 12); }); if (k % 2) meter(g, x + 0.04, y, z + 0.258, 9, 0.012, 0.1, 0xffb02e); else { var vu = new THREE.Mesh(new THREE.PlaneGeometry(0.17, 0.09), basic(0xf2d58a)); vu.position.set(x + 0.13, y, z + 0.2565); g.add(vu); } }
    })(2.08, DZ + 0.14);
    spk(g, -2.05, 1.3, -2.0, 0.42, 0.7, 0.38, 0.94, true); spk(g, 2.05, 1.3, -2.0, 0.42, 0.7, 0.38, -0.94, true);     // the mains, on heavy stands, toed in to the chair
    [-2.05, 2.05].forEach(function (xx) { cyl(g, M.black, xx, 0.02, -2.0, 0.24, 0.26, 0.04, 24); cyl(g, M.black, xx, 0.48, -2.0, 0.045, 0.045, 0.9, 12); box(g, M.black, xx, 0.94, -2.0, 0.36, 0.02, 0.34, xx < 0 ? 0.94 : -0.94); });

    /* ── the MIDI keyboard on its stand, to the left of the chair ── */
    (function (x, z) {
      var k = new THREE.Group(); k.position.set(x, 0, z); k.rotation.y = PI / 2; g.add(k);
      [-0.45, 0.45].forEach(function (dx) { var a = box(k, M.black, dx, 0.36, 0, 0.03, 0.82, 0.03); a.rotation.x = 0.45; var b = box(k, M.black, dx, 0.36, 0, 0.03, 0.82, 0.03); b.rotation.x = -0.45; });
      box(k, M.black, 0, 0.71, 0, 1.0, 0.02, 0.3);
      box(k, M.gloss, 0, 0.765, 0, 1.3, 0.09, 0.3);
      var keys = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.15), new THREE.MeshStandardMaterial({ map: keysTex(), roughness: 0.4 })); keys.rotation.x = -PI / 2; keys.position.set(0.02, 0.8115, 0.06); k.add(keys);
      for (var i = 0; i < 8; i++) { cyl(k, M.alu, -0.3 + i * 0.07, 0.82, -0.09, 0.013, 0.015, 0.02, 12); var pad = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.006, 0.04), basic([0xff5a5f, 0xffb400, 0x00c2a8, 0x3fa7ff][i % 4])); pad.position.set(0.3 + (i % 4) * 0.05, 0.813, -0.115 + ((i / 4) | 0) * 0.05); k.add(pad); }
      [-0.6, -0.565].forEach(function (dx) { box(k, M.alu, dx, 0.815, 0.05, 0.02, 0.012, 0.09); });
      var lc = new THREE.Mesh(new THREE.PlaneGeometry(0.14, 0.04), basic(0x7fd4ff)); lc.rotation.x = -PI / 2; lc.position.set(-0.45, 0.8115, -0.09); k.add(lc);
    })(-1.8, DZ + 0.45);

    /* ── the recording booth in the north-west corner: glass front and door, foam inside, a condenser microphone ── */
    var BX = -2.75, BZ = -1.95, BH = 2.7, recM = new THREE.MeshBasicMaterial({ map: labelTex('● REC', '#2a0606', '#ff3b30', 256, 80, '700 44px Helvetica, Arial, sans-serif') });
    (function () {
      var mx = (X0 + BX) / 2, mz = (Z0 + BZ) / 2, WX = -3.66;
      noShadow(box(g, M.fabric, mx, 0.012, mz, BX - X0, 0.02, BZ - Z0));
      box(g, M.dark, BX - 0.04, BH / 2, mz, 0.08, BH, BZ - Z0); box(g, M.light, mx, BH + 0.04, mz, BX - X0 + 0.1, 0.08, BZ - Z0 + 0.1);
      [[-0.55, M.fabric], [0.45, M.wine]].forEach(function (q) { box(g, M.light, BX + 0.02, 1.75, mz + q[0], 0.05, 1.38, 0.88); box(g, q[1], BX + 0.04, 1.75, mz + q[0], 0.06, 1.3, 0.8); });       // absorbers on the booth's outside
      box(g, M.dark, (X0 + WX) / 2, 0.45, BZ - 0.04, WX - X0, 0.9, 0.08); box(g, M.dark, mx, 2.5, BZ - 0.04, BX - X0, 0.4, 0.08);
      [X0 + 0.04, WX, BX - 0.04].forEach(function (xx) { box(g, M.dark, xx, BH / 2, BZ - 0.04, 0.08, BH, 0.09); });
      var w1 = new THREE.Mesh(new THREE.PlaneGeometry(WX - X0 - 0.1, 1.4), M.glass); w1.position.set((X0 + WX) / 2, 1.6, BZ - 0.04); g.add(w1);
      var dr = new THREE.Mesh(new THREE.PlaneGeometry(BX - WX - 0.14, 2.24), M.glass); dr.position.set((BX + WX) / 2 - 0.02, 1.15, BZ - 0.04); g.add(dr);
      box(g, M.alu, WX + 0.12, 1.1, BZ + 0.01, 0.025, 0.4, 0.025); box(g, M.alu, (BX + WX) / 2 - 0.02, 0.03, BZ - 0.04, BX - WX - 0.14, 0.06, 0.04);
      var fw = new THREE.Mesh(new THREE.PlaneGeometry(BZ - Z0 - 0.1, 1.5), M.foam); fw.rotation.y = PI / 2; fw.position.set(X0 + 0.08, 1.95, mz); g.add(fw);
      var fn = new THREE.Mesh(new THREE.PlaneGeometry(BX - X0 - 0.1, 1.5), M.foam); fn.position.set(mx, 1.95, Z0 + 0.08); g.add(fn);
      var fe = new THREE.Mesh(new THREE.PlaneGeometry(BZ - Z0 - 0.1, 2.3), M.foam); fe.rotation.y = -PI / 2; fe.position.set(BX - 0.085, 1.3, mz); g.add(fe);
      var sign = box(g, M.black, (BX + WX) / 2, 2.52, BZ + 0.02, 0.56, 0.2, 0.05); sign.castShadow = false; var sg = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.16), recM); sg.position.set((BX + WX) / 2, 2.52, BZ + 0.047); g.add(sg);
      /* inside: the microphone on its boom, a pop filter, a music stand, a stool, headphones on the wall */
      var mxp = -3.95, mzp = -3.05;
      cyl(g, M.black, mxp, 0.015, mzp, 0.17, 0.19, 0.03, 20); cyl(g, M.chrome, mxp, 0.75, mzp, 0.012, 0.012, 1.46, 8);
      var boom = cyl(g, M.chrome, mxp + 0.06, 1.52, mzp + 0.18, 0.009, 0.009, 0.5, 8); boom.rotation.x = PI / 2 - 0.25; boom.rotation.z = -0.3;
      cyl(g, M.alu, mxp + 0.12, 1.5, mzp + 0.42, 0.03, 0.03, 0.17, 16); cyl(g, M.gloss, mxp + 0.12, 1.6, mzp + 0.42, 0.031, 0.031, 0.06, 16);
      var shock = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.006, 6, 20), M.black); shock.rotation.x = PI / 2; shock.position.set(mxp + 0.12, 1.5, mzp + 0.42); g.add(shock);
      var pop = disc(g, std({ color: lin(0x111111), roughness: 1, transparent: true, opacity: 0.6 }), mxp + 0.12, 1.58, mzp + 0.54, 0.075, 0.004, 24); pop.castShadow = false;
      cyl(g, M.black, -3.35, 0.6, -2.55, 0.01, 0.01, 1.2, 8); var ms = box(g, M.black, -3.35, 1.25, -2.57, 0.42, 0.3, 0.012); ms.rotation.x = -0.3; var sh = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 0.25), M.paper); sh.rotation.x = -0.3; sh.position.set(-3.35, 1.255, -2.56); g.add(sh);
      cyl(g, M.black, -4.45, 0.3, -2.6, 0.012, 0.012, 0.6, 8); cyl(g, M.leather, -4.45, 0.62, -2.6, 0.17, 0.17, 0.05, 20);
      var hb = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.012, 8, 20, PI), M.black); hb.rotation.y = PI / 2; hb.position.set(BX - 0.11, 1.7, -3.3); g.add(hb);
      [-0.09, 0.09].forEach(function (dz) { var cup = cyl(g, M.black, BX - 0.11, 1.69, -3.3 + dz, 0.045, 0.045, 0.03, 14); cup.rotation.x = PI / 2; });
      var bl = new THREE.PointLight(0xffe0b0, 0.45, 4.2, 2); bl.position.set(mx, 2.4, mz); holder.add(bl);
    })();

    /* ── the DJ booth on the east wall: two Pioneer CDJ players and a DJM mixer, headphones, sleeves on the wall ── */
    var ledM = basic(0xff2d95);
    (function () {
      var z0 = -2.9, z1 = -0.95, zc = (z0 + z1) / 2, d = 0.72, cx = X1 - d / 2, L = z1 - z0, k;
      box(g, M.dark, cx, 0.45, zc, d, 0.9, L); box(g, M.black, cx, 0.925, zc, d + 0.06, 0.05, L + 0.06);
      var led = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.03, L - 0.04), ledM); led.position.set(X1 - d - 0.036, 0.88, zc); g.add(led); glow.push(led);
      var lg = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.16), new THREE.MeshBasicMaterial({ map: labelTex('Pioneer DJ', '#3a2418', '#f2efe8', 512, 96, '700 58px Helvetica, Arial, sans-serif') })); lg.rotation.y = -PI / 2; lg.position.set(X1 - d - 0.002, 0.5, zc); g.add(lg);
      function deck(z, seed) {
        var c = new THREE.Group(); c.position.set(cx - 0.02, 0.95, z); c.rotation.y = -PI / 2; c.scale.setScalar(1.3); g.add(c);
        box(c, M.black, 0, 0.05, 0, 0.33, 0.1, 0.45); box(c, M.gloss, 0, 0.102, 0, 0.32, 0.004, 0.44);
        cyl(c, M.gloss, 0, 0.115, 0.07, 0.108, 0.112, 0.024, 36); cyl(c, M.alu, 0, 0.129, 0.07, 0.085, 0.085, 0.004, 36);
        var ring = new THREE.Mesh(new THREE.TorusGeometry(0.113, 0.004, 6, 40), basic(0xffffff)); ring.rotation.x = PI / 2; ring.position.set(0, 0.106, 0.07); c.add(ring);
        var jd = new THREE.Mesh(new THREE.CircleGeometry(0.035, 24), basic(0x9fd0ff)); jd.rotation.x = -PI / 2; jd.position.set(0, 0.1315, 0.07); c.add(jd);
        var scr = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.11), new THREE.MeshBasicMaterial({ map: waveTex(seed) })); scr.rotation.x = -1.05; scr.position.set(0, 0.125, -0.145); c.add(scr); box(c, M.black, 0, 0.11, -0.16, 0.25, 0.05, 0.1);
        [[0x35e07a, 0.2], [0xffa41c, 0.155]].forEach(function (q) { var b = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.008, 16), basic(q[0])); b.position.set(-0.125, 0.108, q[1]); c.add(b); });
        box(c, M.alu, 0.135, 0.108, 0.09, 0.016, 0.01, 0.15); box(c, M.cone, 0.135, 0.114, 0.06 + seed * 0.02, 0.026, 0.012, 0.02);
        for (var i = 0; i < 8; i++) { var hc = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.006, 0.014), basic([0x35e07a, 0x3fa7ff, 0xff5a5f, 0xffb400][i % 4])); hc.position.set(-0.1 + i * 0.03, 0.107, -0.075); c.add(hc); }
        return c;
      }
      deck(zc - 0.62, 1); deck(zc + 0.62, 2);
      var mxr = new THREE.Group(); mxr.position.set(cx - 0.02, 0.95, zc); mxr.rotation.y = -PI / 2; mxr.scale.setScalar(1.3); g.add(mxr);
      box(mxr, M.black, 0, 0.05, 0, 0.32, 0.1, 0.42); box(mxr, M.gloss, 0, 0.102, 0, 0.31, 0.004, 0.41);
      for (k = 0; k < 4; k++) { for (var j = 0; j < 5; j++) cyl(mxr, j < 3 ? M.alu : M.black, -0.105 + k * 0.07, 0.115, -0.17 + j * 0.045, 0.011, 0.013, 0.022, 10); box(mxr, M.alu, -0.105 + k * 0.07, 0.108, 0.12, 0.008, 0.008, 0.1); box(mxr, M.cone, -0.105 + k * 0.07, 0.114, 0.09 + k * 0.012, 0.022, 0.012, 0.014); }
      box(mxr, M.alu, 0, 0.108, 0.185, 0.1, 0.008, 0.008); box(mxr, M.cone, 0.01, 0.114, 0.185, 0.014, 0.012, 0.022);
      var mm = new THREE.Group(); mm.position.set(-0.105, 0.108, 0.02); mm.rotation.x = -PI / 2; mxr.add(mm); for (k = 0; k < 4; k++) meter(mm, k * 0.07 - 0.009, 0, 0, 2, 0.006, 0.06, k % 2 ? 0x35e07a : 0xffb02e);
      var hp = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.013, 8, 20, PI), M.black); hp.position.set(cx + 0.12, 0.96, z1 - 0.2); hp.rotation.set(-PI / 2, 0, 0.4); g.add(hp);
      [-0.085, 0.085].forEach(function (dq) { cyl(g, M.black, cx + 0.12 + dq * Math.cos(0.4), 0.975, z1 - 0.2 + dq * Math.sin(0.4), 0.045, 0.045, 0.035, 14); });
      box(g, M.dark, X1 - 0.07, 1.62, zc, 0.12, 0.03, L - 0.1);                                                      // the sleeves on their ledge
      [0xe4572e, 0x17bebb, 0xffc914, 0x2e282a, 0x76b041, 0xd7263d].forEach(function (c, q) { var s2 = box(g, std({ color: lin(c), roughness: 0.7 }), X1 - 0.05, 1.795, z0 + 0.2 + q * 0.315, 0.012, 0.31, 0.31); s2.rotation.z = -0.1; var lb = new THREE.Mesh(new THREE.CircleGeometry(0.07 + (q % 2) * 0.04, 20), std({ color: lin(q % 2 ? 0xf2efe8 : 0x111111), roughness: 0.6 })); lb.rotation.y = -PI / 2; lb.rotation.x = 0; lb.position.set(X1 - 0.058, 1.795, z0 + 0.2 + q * 0.315); g.add(lb); });
    })();

    /* ── the east wall: the long gear bench with drawers (the things that stand on a cabinet), absorbers over it ── */
    (function () {
      var z0 = 0.1, z1 = 3.0, bd = 0.56, bh2 = 0.8, bx = X1 - bd / 2, L = z1 - z0, k;
      box(g, M.dark, bx, bh2 / 2, (z0 + z1) / 2, bd, bh2 - 0.02, L); box(g, M.light, bx, bh2 + 0.012, (z0 + z1) / 2, bd + 0.05, 0.045, L + 0.06);
      for (k = 0; k < 4; k++) for (var j = 0; j < 2; j++) { var zc = z0 + (k + 0.5) * L / 4, yc = 0.22 + j * 0.32; box(g, M.light, X1 - bd - 0.006, yc, zc, 0.02, 0.27, L / 4 - 0.05); box(g, M.brass, X1 - bd - 0.024, yc, zc, 0.02, 0.025, 0.14); }
      [[0.6, M.fabric], [1.55, M.wine], [2.5, M.fabric]].forEach(function (q) { box(g, M.light, X1 - 0.025, 2.25, q[0], 0.05, 1.38, 0.78); box(g, q[1], X1 - 0.05, 2.25, q[0], 0.06, 1.3, 0.7); for (var k = 1; k < 6; k++) box(g, M.light, X1 - 0.085, 2.25, q[0] - 0.35 + k * 0.7 / 6, 0.012, 1.3, 0.035); });
    })();

    /* ── the drum kit on its rug in the south-west corner, guitars on the wall behind it, an amplifier stack ── */
    (function (x, z, ry) {
      var d = new THREE.Group(); d.position.set(x, 0, z); d.rotation.y = ry; g.add(d);
      var rug = cyl(d, std({ color: lin(0x3a1418), roughness: 1 }), 0, 0.008, 0, 1.15, 1.15, 0.012, 40); rug.castShadow = false;
      function drum(px, py, pz, r, len, tiltX, tiltZ) {
        var q = new THREE.Group(); q.position.set(px, py, pz); q.rotation.set(tiltX || 0, 0, tiltZ || 0); d.add(q);
        cyl(q, M.shell, 0, 0, 0, r, r, len, 28); cyl(q, M.head, 0, len / 2 + 0.003, 0, r * 0.97, r * 0.97, 0.006, 28); [-1, 1].forEach(function (s) { var hp = new THREE.Mesh(new THREE.TorusGeometry(r, 0.008, 6, 32), M.chrome); hp.rotation.x = PI / 2; hp.position.y = s * len / 2; q.add(hp); });
        return q;
      }
      function stand(px, pz, h) { cyl(d, M.chrome, px, h / 2, pz, 0.01, 0.01, h, 8); [0, 2.1, 4.2].forEach(function (a) { var l = cyl(d, M.chrome, px + Math.cos(a) * 0.1, 0.1, pz + Math.sin(a) * 0.1, 0.007, 0.007, 0.3, 6); l.rotation.set(Math.sin(a) * 0.75, 0, -Math.cos(a) * 0.75); }); }
      var kick = drum(0, 0.29, 0.25, 0.28, 0.42, PI / 2, 0); var lg = new THREE.Mesh(new THREE.CircleGeometry(0.1, 24), std({ color: lin(0x111111), roughness: 0.6 })); lg.position.set(0, 0.29, 0.47); d.add(lg);
      drum(-0.42, 0.62, -0.1, 0.18, 0.14, 0.1, 0); stand(-0.42, -0.1, 0.55);                                           // snare
      drum(-0.17, 0.82, 0.2, 0.14, 0.2, 0.5, 0); drum(0.19, 0.82, 0.2, 0.16, 0.22, 0.5, 0);                            // rack toms
      drum(0.5, 0.42, -0.16, 0.2, 0.38, 0.06, 0); [[0.36, -0.02], [0.64, -0.02], [0.5, -0.34]].forEach(function (q) { cyl(d, M.chrome, q[0], 0.14, q[1], 0.008, 0.008, 0.28, 6); });   // floor tom
      stand(-0.72, 0.12, 0.92); cyl(d, M.cym, -0.72, 0.92, 0.12, 0.18, 0.18, 0.006, 28); cyl(d, M.cym, -0.72, 0.94, 0.12, 0.18, 0.18, 0.006, 28);    // hi-hat
      stand(-0.5, 0.52, 1.28); var cr = cyl(d, M.cym, -0.5, 1.28, 0.52, 0.23, 0.23, 0.005, 32); cr.rotation.x = 0.25;                     // crash
      stand(0.62, 0.4, 1.12); var rd = cyl(d, M.cym, 0.62, 1.12, 0.4, 0.27, 0.27, 0.005, 32); rd.rotation.set(0.2, 0, -0.15);           // ride
      cyl(d, M.chrome, 0, 0.24, -0.5, 0.02, 0.02, 0.48, 8); cyl(d, M.black, 0, 0.5, -0.5, 0.17, 0.17, 0.07, 20);                         // the throne
      box(d, M.chrome, 0, 0.03, 0.02, 0.08, 0.02, 0.26);                                                                                // the pedal
    })(-3.75, 2.75, 2.36);
    function guitar(x, y, z, ry, tilt, kind) {
      var G = new THREE.Group(); G.position.set(x, y, z); G.rotation.set(tilt || 0, ry, 0, 'YXZ'); g.add(G);
      var ac = kind === 'acoustic', col = { sunburst: 0xb8561a, cherry: 0x8f1820, black: 0x161616, acoustic: 0xd6a45c }[kind], bm = std({ color: lin(col), roughness: ac ? 0.5 : 0.22, metalness: ac ? 0 : 0.2 }), dp = ac ? 0.1 : 0.045;
      disc(G, bm, 0, 0, 0, ac ? 0.2 : 0.17, dp, 32); disc(G, bm, 0, ac ? 0.24 : 0.2, 0, ac ? 0.15 : 0.13, dp, 32); box(G, bm, 0, 0.11, 0, ac ? 0.25 : 0.2, 0.2, dp);
      if (ac) { disc(G, M.black, 0, 0.14, dp / 2 + 0.002, 0.05, 0.004, 24); box(G, M.dark, 0, -0.04, dp / 2 + 0.006, 0.14, 0.03, 0.012); }
      else { if (kind !== 'cherry') disc(G, kind === 'black' ? M.cone : M.head, 0.03, 0.06, dp / 2 + 0.002, 0.1, 0.003, 24); [0.02, 0.13].forEach(function (yy) { box(G, M.chrome, 0, yy, dp / 2 + 0.008, 0.08, 0.03, 0.012); }); box(G, M.chrome, 0, -0.07, dp / 2 + 0.008, 0.09, 0.025, 0.014); [[0.09, -0.08], [0.12, -0.02]].forEach(function (q) { cyl(G, M.alu, q[0], q[1], dp / 2 + 0.012, 0.012, 0.012, 0.016, 10).rotation.x = PI / 2; }); }
      box(G, M.dark, 0, 0.62, dp / 2 - 0.012, 0.048, 0.66, 0.022); box(G, kind === 'acoustic' ? M.dark : bm, 0, 1.02, dp / 2 - 0.014, 0.075, 0.17, 0.018);
      var st = new THREE.Mesh(new THREE.PlaneGeometry(0.034, 0.98), std({ color: lin(0xcfd2d6), roughness: 0.3, metalness: 0.8, transparent: true, opacity: 0.55 })); st.position.set(0, 0.45, dp / 2 + 0.016); G.add(st);
      for (var i = 0; i < 6; i++) cyl(G, M.chrome, (i % 2 ? 0.045 : -0.045), 0.96 + ((i / 2) | 0) * 0.045, dp / 2 - 0.014, 0.008, 0.008, 0.012, 8).rotation.z = PI / 2;
      return G;
    }
    [['sunburst', 1.55], ['acoustic', 2.3], ['cherry', 3.05]].forEach(function (q) { guitar(X0 + 0.11, 1.75, q[1], PI / 2, 0, q[0]); box(g, M.black, X0 + 0.06, 2.72, q[1], 0.1, 0.03, 0.08); });
    (function (z) {                                                                                     // the amplifier: a head on a 4×12 cabinet
      var x = X0 + 0.24; box(g, M.black, x, 0.4, z, 0.38, 0.78, 0.76); box(g, std({ color: lin(0x4a4338), roughness: 1 }), x + 0.193, 0.4, z, 0.004, 0.66, 0.66); box(g, M.gilt, x + 0.196, 0.75, z, 0.004, 0.03, 0.66);
      box(g, M.black, x, 0.93, z, 0.26, 0.26, 0.7); box(g, M.gilt, x + 0.132, 0.9, z, 0.004, 0.07, 0.62); for (var i = 0; i < 6; i++) { var kn = cyl(g, M.black, x + 0.14, 0.9, z - 0.2 + i * 0.08, 0.014, 0.014, 0.016, 10); kn.rotation.z = PI / 2; }
      var pl = new THREE.Mesh(new THREE.SphereGeometry(0.01, 8, 6), basic(0xff3b30)); pl.position.set(x + 0.136, 0.9, z + 0.27); g.add(pl);
    })(1.05);
    guitar(X0 + 0.32, 0.28, 0.32, PI / 2, -0.16, 'black'); box(g, M.black, X0 + 0.3, 0.1, 0.32, 0.3, 0.02, 0.34); cyl(g, M.black, X0 + 0.2, 0.42, 0.32, 0.01, 0.01, 0.66, 8);   // one on a stand, by the amp

    /* ── south wall: the couch behind the mix position, gold records over it, a side table; the door (decor) ── */
    (function (x, z) {
      var s = new THREE.Group(); s.position.set(x, 0, z); s.rotation.y = PI; g.add(s);
      var lm = std({ color: lin(0x1d1d20), roughness: 0.45 });
      box(s, lm, 0, 0.2, 0, 2.1, 0.3, 0.9); box(s, lm, 0, 0.55, -0.36, 2.1, 0.5, 0.2); [-0.96, 0.96].forEach(function (dx) { box(s, lm, dx, 0.42, 0.02, 0.2, 0.28, 0.88); });
      [-0.58, 0, 0.58].forEach(function (dx) { box(s, lm, dx, 0.4, 0.07, 0.56, 0.12, 0.66); box(s, lm, dx, 0.63, -0.24, 0.56, 0.36, 0.14).rotation.x = -0.12; });
      [[-0.95, -0.38], [0.95, -0.38], [-0.95, 0.38], [0.95, 0.38]].forEach(function (q) { cyl(s, M.chrome, q[0], 0.03, q[1], 0.02, 0.02, 0.06, 8); });
      box(s, M.wine, -0.62, 0.56, -0.02, 0.36, 0.36, 0.1).rotation.set(-0.3, 0.2, 0);
    })(1.2, Z1 - 0.52);
    [0.5, 1.2, 1.9].forEach(function (xx, q) {
      box(g, M.black, xx, 2.3, Z1 - 0.025, 0.5, 0.5, 0.03); disc(g, q === 1 ? M.chrome : M.gilt, xx, 2.34, Z1 - 0.05, 0.16, 0.006, 40); disc(g, std({ color: lin([0x8f1820, 0x1d4f86, 0x234a36][q]), roughness: 0.6 }), xx, 2.34, Z1 - 0.056, 0.055, 0.006, 24);
      box(g, M.gilt, xx, 2.12, Z1 - 0.045, 0.2, 0.05, 0.004);
    });
    cyl(g, M.dark, -0.2, 0.02, Z1 - 0.5, 0.2, 0.22, 0.04); cyl(g, M.light, -0.2, 0.32, Z1 - 0.5, 0.03, 0.045, 0.6); cyl(g, M.dark, -0.2, 0.635, Z1 - 0.5, 0.3, 0.3, 0.035, 28);
    box(g, M.dark, 3.7, 1.15, Z1 - 0.03, 1.2, 2.3, 0.06); box(g, M.light, 3.7, 1.15, Z1 - 0.07, 0.96, 2.06, 0.03);
    [[3.46, 1.6], [3.94, 1.6], [3.46, 0.6], [3.94, 0.6]].forEach(function (q) { box(g, M.dark, q[0], q[1], Z1 - 0.09, 0.36, q[1] > 1 ? 0.9 : 0.8, 0.02); });
    box(g, M.brass, 3.3, 1.05, Z1 - 0.11, 0.04, 0.12, 0.04);

    /* ── the cloud over the mix position: an absorber hung from the beams, a warm light strip round it ── */
    box(g, M.light, 0, 3.34, -1.1, 2.78, 0.07, 1.88).castShadow = false; box(g, std({ color: lin(0x6a6d74), roughness: 1 }), 0, 3.31, -1.1, 2.66, 0.07, 1.76).castShadow = false; [[-1.2, -1.85], [1.2, -1.85], [-1.2, -0.35], [1.2, -0.35]].forEach(function (q) { cyl(g, M.black, q[0], 3.36 + (H - 3.36) / 2, q[1], 0.004, 0.004, H - 3.36, 4).castShadow = false; });
    var stripM = basic(0xffc477); [[0, -2.01, 2.7, 0.02], [0, -0.19, 2.7, 0.02], [-1.36, -1.1, 0.02, 1.8], [1.36, -1.1, 0.02, 1.8]].forEach(function (q) { var st = new THREE.Mesh(new THREE.BoxGeometry(q[2], 0.02, q[3]), stripM); st.position.set(q[0], 3.275, q[1]); g.add(st); });

    /* ── light: the sky through the glass (casts the shadows), three brass pendants over the desk and the bench ── */
    var hemi = new THREE.HemisphereLight(0xfff0dc, 0x3b2a1c, 0.72); holder.add(hemi);
    var sun = new THREE.DirectionalLight(0xdbe6ff, 1.05); sun.position.set(1.2, 6.2, Z0 - 5); sun.target.position.set(0, 0.4, 0.2);
    sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); var sc = sun.shadow.camera; sc.left = -7; sc.right = 7; sc.top = 7; sc.bottom = -7; sc.near = 0.5; sc.far = 18;
    sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.02; holder.add(sun); holder.add(sun.target);
    var fill = new THREE.DirectionalLight(0xffe2bd, 0.28); fill.position.set(-2, 3.6, 5); holder.add(fill);
    var bulbs = [], lamps = [];
    var cloud = new THREE.PointLight(0xffd9a0, 0.45, 7, 2); cloud.position.set(0, 3.1, -1.0); holder.add(cloud);
    [[-2.6, 1.0], [2.6, 1.0]].forEach(function (q, k) {
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
      lamps.forEach(function (l) { l.intensity = 0.25 + 0.75 * N; }); cloud.intensity = 0.3 + 0.7 * N; bulbs.forEach(function (b) { b.color.set(N > 0.3 ? 0xffe9c4 : 0xd9c8a0); });
      boardLight.intensity = 0.3 + 0.5 * N;
    }
    apply();

    /* anchors: where each thing of Spatial Home goes in the studio (y = the surface it stands on) */
    var anchors = {
      'desk.left': { p: [-0.55, top, DZ + 0.12], ry: 0 }, 'desk.right': { p: [0.95, top, DZ + 0.14], ry: 0 },
      'desk.quill': { p: [-1.02, top, DZ + 0.22], ry: 0.25 }, 'desk.mochi': { p: [1.1, top, DZ + 0.42], ry: -0.3 },
      'desk.key': { p: [0.8, top, DZ + 0.4], ry: -0.4 }, 'desk.watch': { p: [-0.22, top, DZ + 0.3], ry: 0.22 }, 'desk.book': { p: [-0.2, 0.655, Z1 - 0.5], ry: PI },           // the reading stand on the table by the couch
      'sill.left': { p: [-1.2, WIN.y0 + 0.046, Z0 + 0.1], ry: 0 },
      'corner.window': { p: [4.05, 0, -3.42], ry: 0 },                                                                 // Octo's aquarium in the north-east corner, in the light
      'wall.left': { p: [X0 + 0.06, 1.85, -0.6], ry: PI / 2 },                                                          // the EC–6 board on the west wall
      'cabinet.left': { p: [X1 - 0.29, 0.836, 0.62], ry: -PI / 2 }, 'shelf.mid': { p: [X1 - 0.29, 0.836, 1.2], ry: -PI / 2 },
      'cabinet.top': { p: [X1 - 0.29, 0.836, 1.9], ry: -PI / 2 }, 'cabinet.right': { p: [X1 - 0.29, 0.836, 2.6], ry: -PI / 2 },
      'wall.right': { p: [X1 - 0.03, 3.1, 1.55], ry: -PI / 2 },
      'floor.pack': { p: [2.85, 0, Z1 - 0.55], ry: PI + 0.3 }, 'floor.gramo': { p: [4.22, 0, -0.42], ry: -PI / 2 },
      'floor.film': { p: [3.55, 0, 1.6], ry: 0 }, 'floor.portal': { p: [-1.6, 0, Z1 - 0.28], ry: PI },
      'floor.holo': { p: [-2.4, 0, 0.5], ry: PI / 2 },
      'floor.window': { p: [0, WIN.y0, Z0 - 0.17], ry: 0, w: WIN.x1 - WIN.x0, h: WIN.y1 - WIN.y0 }     // the Scenic Window IS the studio glass: its view, behind the iron grid
    };
    var solids = [[-1.3, DZ - 0.55, 1.3, DZ + 0.5], [-0.4, DZ + 0.5, 0.4, DZ + 1.0], [-2.0, DZ - 0.22, -1.6, DZ + 1.12], [1.38, DZ - 0.15, 2.4, DZ + 0.42],
      [-2.3, -2.25, -1.8, -1.75], [1.8, -2.25, 2.3, -1.75], [X0, Z0, BX, BZ], [X1 - 0.76, -2.95, X1, -0.9], [X1 - 0.6, 0.05, X1, 3.05],
      [-4.85, 1.65, -2.7, 3.85], [X0, 0.65, X0 + 0.5, 1.45], [X0, 0.1, X0 + 0.5, 0.55], [0.1, Z1 - 1.0, 2.3, Z1], [2.5, Z1 - 0.9, 3.15, Z1 - 0.2], [-0.5, Z1 - 0.8, 0.1, Z1 - 0.2], [3.5, Z0, 4.6, -3.1]];

    return {
      id: 'studio', name: 'The Studio · Music Production', group: g, holder: holder, far: 80, size: { W: X1, D: Z1, H: H }, realistic: true,
      anchors: anchors, avatar: PT.avatar, backdrop: [sky, back],                       // hidden when a window view is chosen (views.js)
      start: { pos: [1.55, 1.6, 1.35], yaw: 0.42, pitch: -0.12 }, startV: 2,
      seat: { x: 0, z: DZ + 0.8, yaw: PI, approach: [0.7, DZ + 0.9], y: 0.46 },
      desk: { pos: [0, 1.42, DZ + 1.06], look: [0, 0.95, DZ - 0.3] },                    // in the desk chair, facing the glass
      solids: solids,
      setTime: function (m) { mode = m || 'auto'; apply(); },
      tick: function (t, dt) {
        if (t - lastApply > 20) { lastApply = t; apply(); }
        for (var k = ticks.length - 1; k >= 0; k--) { try { ticks[k].tick(t, dt); } catch (e) { ticks.splice(k, 1); } }
        if (!root.matchMedia || !root.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          for (k = 0; k < meters.length; k++) { var q = meters[k], lv = 0.12 + 0.88 * Math.abs(Math.sin(t * q.f + q.ph) * Math.sin(t * 0.9 + q.ph * 0.3)); q.m.scale.y = q.h * lv; q.m.position.y = q.y - q.h / 2 + q.h * lv / 2; }
          ledM.color.setHSL((t * 0.05) % 1, 0.95, 0.55); recM.color.setScalar(0.55 + 0.45 * Math.abs(Math.sin(t * 1.6)));
        }
      },
      dispose: function () { SR.disposeTree(holder); scene.background = null; }
    };
  }
  SR.register({ id: 'studio', name: 'The Studio · Music Production', zh: '音乐工作室 · Studio', icon: '🎛', build: build });
})(window);
