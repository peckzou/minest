/* Minest · Spatial Home · Rooms 2.0 — environment "yard": the front and back yard of the house.
   One garden round the brick house of the Victorian Study, entered at two places:
     · yard       前庭: the gate in the picket fence, a flagstone walk to the porch round a stone fountain, mown lawns in
                  stripes, tulip borders and round flower beds, hydrangeas under the windows, a bench under the oak
     · yard-back  后院: the terrace under a wisteria pergola (its garden table is the desk there; the front yard has a table of its own on the lawn by the gate), the swimming pool
                  with its loungers, the kitchen garden in raised beds (tomatoes, cabbages, lettuces, carrots, pumpkins,
                  corn, beans, a greenhouse), an apple tree, lavender and sunflowers along the hedge
   A clipped hedge and a belt of trees go round the whole lot; beyond the fence a planted strip, the pavement and the road.
   You walk from one yard to the other past the sides of the house. Light follows the time of day: at night the lamps on
   the walk, the windows of the house and the pool light come on. */
(function (root) {
  'use strict';
  var THREE = root.THREE, SR = root.SpatialRoom, PT = SR && SR.parts, TX = root.StudyTex;
  if (!SR || !PT) return;
  (root.SpatialRoomsNew = root.SpatialRoomsNew || []).push('yard', 'yard-back');
  var W = 12, D = 17, PI = Math.PI;
  var HX = 6, HZ = 3.5, HH = 6.2;                                      // the house: |x| < 6, |z| < 3.5, eaves at 6.2 m
  var POOL = [0.8, -14.2, 9.2, -9.6];                                  // water: x0, z0, x1, z1
  var DOOR = 1.6, PLZ = 10.6;                                          // the front door and the walk are at x 1.6; the fountain at z 10.6

  function rng(s) { return TX && TX.rng ? TX.rng(s) : function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
  function lin(h) { return new THREE.Color(h).convertSRGBToLinear(); }
  function std(o) { if (typeof o.color === 'number') o.color = lin(o.color); if (o.roughness === undefined) o.roughness = 0.9; return new THREE.MeshStandardMaterial(o); }
  function sh(m, cast) { m.castShadow = cast !== false; m.receiveShadow = true; return m; }
  function box(g, m, x, y, z, w, h, d, ry) { var b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); if (ry) b.rotation.y = ry; g.add(sh(b)); return b; }
  function cyl(g, m, x, y, z, r0, r1, h, seg) { var c = new THREE.Mesh(new THREE.CylinderGeometry(r0, r1, h, seg || 16), m); c.position.set(x, y, z); g.add(sh(c)); return c; }
  function ball(g, m, x, y, z, r, sy, seg) { var s = new THREE.Mesh(new THREE.SphereGeometry(r, seg || 12, Math.max(6, (seg || 12) - 4)), m); s.position.set(x, y, z); if (sy) s.scale.y = sy; g.add(sh(s)); return s; }
  function flat(g, m, x, y, z, w, d) { var p = new THREE.Mesh(new THREE.PlaneGeometry(w, d), m); p.rotation.x = -PI / 2; p.position.set(x, y, z); p.receiveShadow = true; g.add(p); return p; }
  function disc(g, m, x, y, z, r) { var p = new THREE.Mesh(new THREE.CircleGeometry(r, 40), m); p.rotation.x = -PI / 2; p.position.set(x, y, z); p.receiveShadow = true; g.add(p); return p; }
  function canvasTex(w, h, draw, rx, ry) {
    var c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
    var t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 8; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx || 1, ry || 1); return t;
  }
  function speckle(x, w, h, r, n, cols, s0, s1) { for (var i = 0; i < n; i++) { x.fillStyle = cols[(r() * cols.length) | 0]; var s = s0 + r() * (s1 - s0); x.fillRect(r() * w, r() * h, s, s * (0.6 + r())); } }
  /* a mown lawn: two stripes across the tile (one pass of the mower each way), fine blades over them */
  function lawnTex(rx, ry) {
    return canvasTex(512, 512, function (x, w, h) {
      var r = rng(41), i; x.fillStyle = '#4f9a3a'; x.fillRect(0, 0, w / 2, h); x.fillStyle = '#62ad45'; x.fillRect(w / 2, 0, w / 2, h);
      for (i = 0; i < 26000; i++) { var px = r() * w, l = px < w / 2; x.fillStyle = 'rgba(' + (l ? (r() < 0.5 ? '30,80,24' : '104,170,72') : (r() < 0.5 ? '46,104,34' : '132,196,90')) + ',' + (0.12 + r() * 0.3) + ')'; x.fillRect(px, r() * h, 1.2, 2 + r() * 4); }
    }, rx, ry);
  }
  function stoneTex(seed, base, rx, ry) {                              // flagstones: irregular courses with dark joints
    return canvasTex(512, 512, function (x, w, h) {
      var r = rng(seed), y = 0, row = 0; x.fillStyle = '#6f685c'; x.fillRect(0, 0, w, h);
      while (y < h) { var rh = 64, px = row % 2 ? -40 : 0; while (px < w) { var bw = 70 + r() * 70, v = (r() - 0.5) * 26; x.fillStyle = 'rgb(' + (base[0] + v | 0) + ',' + (base[1] + v | 0) + ',' + (base[2] + v | 0) + ')'; x.fillRect(px + 2, y + 2, bw - 4, rh - 4); px += bw; } y += rh; row++; }
      speckle(x, w, h, r, 5000, ['rgba(0,0,0,.06)', 'rgba(255,255,255,.07)'], 1, 3);
    }, rx, ry);
  }
  function brickTex(rx, ry) {
    return canvasTex(256, 256, function (x, w, h) {
      var r = rng(7), j, i; x.fillStyle = '#c9bfae'; x.fillRect(0, 0, w, h);
      for (j = 0; j < 8; j++) for (i = -1; i < 4; i++) { var v = (r() - 0.5) * 34; x.fillStyle = 'rgb(' + (150 + v | 0) + ',' + (66 + v * 0.5 | 0) + ',' + (50 + v * 0.4 | 0) + ')'; x.fillRect(i * 64 + (j % 2 ? 32 : 0) + 2, j * 32 + 2, 60, 28); }
      speckle(x, w, h, r, 1800, ['rgba(0,0,0,.08)', 'rgba(255,230,200,.06)'], 1, 3);
    }, rx, ry);
  }
  function slateTex(rx, ry) {
    return canvasTex(256, 256, function (x, w, h) {
      var r = rng(19), j, i; x.fillStyle = '#2c3138'; x.fillRect(0, 0, w, h);
      for (j = 0; j < 8; j++) for (i = -1; i < 8; i++) { var v = (r() - 0.5) * 22; x.fillStyle = 'rgb(' + (70 + v | 0) + ',' + (78 + v | 0) + ',' + (90 + v | 0) + ')'; x.fillRect(i * 32 + (j % 2 ? 16 : 0) + 1, j * 32 + 1, 30, 30); }
    }, rx, ry);
  }
  function leafTex(seed, cols, rx, ry) {
    return canvasTex(256, 256, function (x, w, h) {
      var r = rng(seed), i; x.fillStyle = cols[0]; x.fillRect(0, 0, w, h);
      for (i = 0; i < 2600; i++) { x.fillStyle = cols[1 + ((r() * (cols.length - 1)) | 0)]; x.beginPath(); x.ellipse(r() * w, r() * h, 2 + r() * 4, 1.5 + r() * 2.5, r() * 3, 0, 6.3); x.fill(); }
    }, rx, ry);
  }
  function noiseTex(seed, base, cols, n, rx, ry) { return canvasTex(256, 256, function (x, w, h) { x.fillStyle = base; x.fillRect(0, 0, w, h); speckle(x, w, h, rng(seed), n, cols, 1, 4); }, rx, ry); }
  function waterTex() {                                                // light on the water: pale caustic loops on turquoise
    return canvasTex(256, 256, function (x, w, h) {
      var r = rng(77), i; x.fillStyle = '#35b6d6'; x.fillRect(0, 0, w, h); x.strokeStyle = 'rgba(220,250,255,.5)'; x.lineWidth = 2;
      for (i = 0; i < 70; i++) { var cx = r() * w, cy = r() * h, a = 10 + r() * 22; x.beginPath(); x.ellipse(cx, cy, a, a * (0.5 + r() * 0.5), r() * 3, 0, 6.3); x.stroke(); }
    }, 5, 3);
  }
  function skyTex() {
    var c = document.createElement('canvas'); c.width = 8; c.height = 256; var x = c.getContext('2d'), gr = x.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, '#3f7fd6'); gr.addColorStop(0.42, '#8fbdf0'); gr.addColorStop(0.5, '#dcecff'); gr.addColorStop(0.52, '#b9cfae'); gr.addColorStop(1, '#6f9460');
    x.fillStyle = gr; x.fillRect(0, 0, 8, 256); var t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t;
  }

  /* the Scenic Window stands in the back hedge, a long way from the terrace: until you choose a view for these two places
     yourself, it shows a photo scene (which fills the glass from any distance) instead of the default spatial scene */
  function view0() {
    try {
      var S = root.MinestBackpack && root.MinestBackpack.store, k = 'scenic:winScene', m = (S && S.get(k)) || JSON.parse(localStorage.getItem('minest.' + k) || 'null'), ch = false;
      if (!m || typeof m !== 'object') m = {};
      ['yard', 'yard-back'].forEach(function (q) { if (!m[q]) { m[q] = 'alpine-meadow'; ch = true; } });
      if (ch) { if (S) S.set(k, m); localStorage.setItem('minest.' + k, JSON.stringify(m)); }
    } catch (e) {}
  }

  function make(scene, id) {
    view0();
    var holder = new THREE.Group(), g = new THREE.Group(), r = rng(5), i, k; holder.add(g); scene.add(holder);
    var M = {
      lawn: std({ map: lawnTex(34, 44), roughness: 1 }), flag: std({ map: stoneTex(3, [176, 166, 148], 1, 1) }), stone: std({ color: 0xcfc8ba, roughness: 0.8 }),
      pave: std({ map: stoneTex(11, [196, 184, 162], 4, 1.4) }), gravel: std({ map: noiseTex(13, '#b9ad98', ['#8f8474', '#d8cdb8', '#a39884'], 5200, 3, 8) }),
      brick: std({ map: brickTex(6, 3.4) }), brickZ: std({ map: brickTex(3.5, 3.4) }), slate: std({ map: slateTex(6, 3), roughness: 0.7 }),
      white: std({ color: 0xf2efe8, roughness: 0.6 }), wood: std({ color: 0x8a5a36, roughness: 0.8 }), dark: std({ color: 0x3a2a1e, roughness: 0.7 }), deck: std({ color: 0xb08a5e, roughness: 0.85 }),
      hedge: std({ map: leafTex(21, ['#2f5f2c', '#3d7436', '#285226', '#4a8440'], 6, 1), roughness: 1 }), box: std({ map: leafTex(23, ['#3f7a34', '#4f8f42', '#2f6a2a'], 3, 1), roughness: 1 }),
      leafA: std({ map: leafTex(31, ['#3c7a35', '#4c9040', '#2f6a2c', '#5fa24c'], 2, 2), roughness: 1 }), leafB: std({ map: leafTex(33, ['#2a5a2e', '#356c36', '#234d28'], 2, 2), roughness: 1 }),
      leafC: std({ map: leafTex(35, ['#6f9a3a', '#86b048', '#5d8a30'], 2, 2), roughness: 1 }), bark: std({ color: 0x5a4130, roughness: 1 }),
      soil: std({ map: noiseTex(17, '#4a3626', ['#3a2a1c', '#5c4430', '#2f2218'], 3000, 2, 1), roughness: 1 }), iron: std({ color: 0x1f2226, roughness: 0.5, metalness: 0.6 }),
      chrome: std({ color: 0xdfe5ea, roughness: 0.15, metalness: 0.95 }), tile: std({ color: 0x4fc3dc, roughness: 0.35 }), cloth: std({ color: 0xf4f1ea, roughness: 0.95 }),
      road: std({ color: 0x3b3d40, roughness: 0.95 }), door: std({ color: 0x23483a, roughness: 0.45 }), brass: std({ color: 0xc9a253, roughness: 0.3, metalness: 0.9 }),
      glass: std({ color: 0x2f4a66, roughness: 0.1, metalness: 0.2, emissive: 0xffd9a0, emissiveIntensity: 0 }),
      water: new THREE.MeshStandardMaterial({ map: waterTex(), color: 0xffffff, roughness: 0.06, metalness: 0.25, transparent: true, opacity: 0.8, emissive: lin(0x2fb7d8), emissiveIntensity: 0.08 })
    };

    /* ── the ground: one mown lawn over the whole lot (stripes run north–south), the street beyond the fence ── */
    flat(g, M.lawn, 0, 0, 0, 60, 76);
    flat(g, M.pave, 0, 0.012, D + 2.3, 60, 1.8).material = std({ map: stoneTex(5, [186, 182, 174], 30, 1) });      // the pavement
    flat(g, M.road, 0, 0.01, D + 7.5, 60, 7); for (i = -9; i <= 9; i++) flat(g, M.white, i * 3, 0.016, D + 7.5, 1.4, 0.12);

    /* ── the house ── */
    (function () {
      box(g, M.brick, 0, HH / 2, 0, 2 * HX, HH, 2 * HZ).material = [M.brickZ, M.brickZ, M.slate, M.slate, M.brick, M.brick];
      box(g, M.stone, 0, 0.25, 0, 2 * HX + 0.12, 0.5, 2 * HZ + 0.12); box(g, M.white, 0, 3.15, 0, 2 * HX + 0.1, 0.16, 2 * HZ + 0.1); box(g, M.white, 0, HH, 0, 2 * HX + 0.5, 0.2, 2 * HZ + 0.5);
      function roof(x, z, len, half, rise, ry) {                       // a ridge roof: a triangle drawn in x–y, pushed along z
        var s = new THREE.Shape(); s.moveTo(-half, 0); s.lineTo(half, 0); s.lineTo(0, rise); s.lineTo(-half, 0);
        var m = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: len, bevelEnabled: false }), [M.brickZ, M.slate]); m.position.set(x, HH + 0.1, z); m.rotation.y = ry || 0; g.add(sh(m)); return m;
      }
      roof(-HX - 0.35, 0, 2 * HX + 0.7, HZ + 0.4, 2.7, PI / 2);          // the main ridge runs east–west
      box(g, M.brick, -3.4, HH / 2, HZ + 0.45, 3.2, HH, 0.9).material = M.brickZ; roof(-3.4, HZ - 2.4, 3.5, 1.85, 1.9, 0);   // the front bay and its gable
      [[-4.4, -1.2], [4.3, 0.9]].forEach(function (q) { box(g, M.brickZ, q[0], HH + 2.3, q[1], 0.8, 2.6, 0.6); box(g, M.stone, q[0], HH + 3.64, q[1], 0.95, 0.1, 0.75); cyl(g, M.wood, q[0] - 0.18, HH + 3.86, q[1], 0.1, 0.12, 0.36, 10); cyl(g, M.wood, q[0] + 0.18, HH + 3.86, q[1], 0.1, 0.12, 0.36, 10); });
      function win(x, y, z, w, h, out) {                               // a sash window on a wall facing ±z (out = ±1)
        box(g, M.white, x, y, z + out * 0.03, w + 0.2, h + 0.2, 0.08); box(g, M.glass, x, y, z + out * 0.06, w, h, 0.05).castShadow = false;
        box(g, M.white, x, y, z + out * 0.09, 0.05, h, 0.03); box(g, M.white, x, y, z + out * 0.09, w, 0.05, 0.03); box(g, M.stone, x, y - h / 2 - 0.13, z + out * 0.1, w + 0.36, 0.08, 0.2);
      }
      [-3.4].forEach(function (x) { win(x, 1.75, HZ + 0.9, 2.0, 1.7, 1); win(x, 4.6, HZ + 0.9, 1.6, 1.5, 1); });
      [4.2].forEach(function (x) { win(x, 1.8, HZ, 1.3, 1.7, 1); }); [-0.6, 1.6, 4.2].forEach(function (x) { win(x, 4.6, HZ, 1.1, 1.5, 1); });
      [-4.2, 3.9].forEach(function (x) { win(x, 1.8, -HZ, 1.3, 1.7, -1); }); [-4.2, -1.4, 1.4, 3.9].forEach(function (x) { win(x, 4.6, -HZ, 1.1, 1.5, -1); });
      /* the front door under a porch: two steps, white columns, a small roof */
      box(g, M.white, DOOR, 1.35, HZ + 0.03, 1.5, 2.7, 0.1); box(g, M.door, DOOR, 1.2, HZ + 0.07, 1.05, 2.2, 0.08); box(g, M.glass, DOOR, 2.48, HZ + 0.07, 1.05, 0.3, 0.06); ball(g, M.brass, DOOR + 0.38, 1.15, HZ + 0.14, 0.04);
      box(g, M.stone, DOOR, 0.2, HZ + 0.9, 2.8, 0.4, 1.8); box(g, M.stone, DOOR, 0.1, HZ + 1.95, 2.2, 0.2, 0.36);
      [-1.2, 1.2].forEach(function (dx) { cyl(g, M.white, DOOR + dx, 1.55, HZ + 1.6, 0.09, 0.11, 2.3, 16); box(g, M.white, DOOR + dx, 0.46, HZ + 1.6, 0.3, 0.12, 0.3); box(g, M.white, DOOR + dx, 2.74, HZ + 1.6, 0.28, 0.1, 0.28); });
      box(g, M.white, DOOR, 2.9, HZ + 0.9, 2.9, 0.22, 1.9); roof(DOOR, HZ - 0.1, 2.0, 1.55, 0.7, 0).position.y = 3.0;
      /* the garden doors at the back: two glazed leaves onto the terrace */
      box(g, M.white, 0, 1.3, -HZ - 0.03, 2.6, 2.6, 0.1); [-0.6, 0.6].forEach(function (dx) { box(g, M.glass, dx, 1.25, -HZ - 0.07, 1.05, 2.2, 0.05); box(g, M.white, dx, 1.25, -HZ - 0.1, 0.04, 2.2, 0.03); [0.7, 1.8].forEach(function (yy) { box(g, M.white, dx, yy, -HZ - 0.1, 1.05, 0.04, 0.03); }); });
    })();

    /* ── things that grow ── */
    function tree(x, z, h, rad, m, sq) {                               // a trunk and a crown of four soft masses
      cyl(g, M.bark, x, h * 0.3, z, rad * 0.09, rad * 0.14, h * 0.6, 10);
      [[0, 0.72, 0, 1], [0.5, 0.6, 0.2, 0.7], [-0.45, 0.62, -0.25, 0.72], [0.1, 0.9, -0.1, 0.66], [-0.1, 0.6, 0.5, 0.6]].forEach(function (q) {
        var c = new THREE.Mesh(new THREE.IcosahedronGeometry(rad * q[3], 2), m || M.leafA); c.position.set(x + q[0] * rad, h * q[1], z + q[2] * rad); c.scale.y = sq || 0.85; g.add(sh(c));
      });
    }
    function cypress(x, z, h) { cyl(g, M.bark, x, 0.3, z, 0.07, 0.09, 0.6, 8); var c = new THREE.Mesh(new THREE.ConeGeometry(h * 0.16, h, 12), M.leafB); c.position.set(x, 0.5 + h / 2, z); g.add(sh(c)); }
    function hedge(x0, z0, x1, z1, h, m) { var w = Math.max(0.7, x1 - x0), d = Math.max(0.7, z1 - z0); var b = box(g, m || M.hedge, (x0 + x1) / 2, h / 2, (z0 + z1) / 2, w, h, d); return b; }
    var FL = [], ST = [];                                              // every flower head and stem of the garden: drawn as two instanced meshes
    function flower(x, y, z, hgt, col, s) { ST.push([x, y + hgt / 2, z, hgt]); FL.push([x, y + hgt, z, s || 0.05, col]); }
    function bed(x0, z0, x1, z1, cols, dens, hgt, s) { var n = Math.round((x1 - x0) * (z1 - z0) * dens); for (var q = 0; q < n; q++) flower(x0 + r() * (x1 - x0), 0.02, z0 + r() * (z1 - z0), hgt * (0.7 + r() * 0.5), cols[(r() * cols.length) | 0], s); }
    function shrub(x, z, s, m, bloom) {                                // a rounded bush; with `bloom`, big flower heads on it (hydrangeas, roses)
      ball(g, m || M.box, x, s * 0.45, z, s * 0.55, 0.85, 10);
      if (bloom) for (var q = 0; q < 9; q++) { var a = r() * 6.283, e = 0.25 + r() * 0.9; FL.push([x + Math.cos(a) * Math.cos(e) * s * 0.52, s * 0.45 + Math.sin(e) * s * 0.44, z + Math.sin(a) * Math.cos(e) * s * 0.52, s * 0.14, bloom[(r() * bloom.length) | 0]]); }
    }
    var TULIP = [0xe23d4f, 0xf2c230, 0xf07ab0, 0xffffff, 0x9a52c8, 0xf28a2e], HYD = [0x6f8fe0, 0x9a7fe0, 0xe89ac4, 0x8fb4f0], ROSE = [0xd42a45, 0xf4a6b8, 0xfff0e0, 0xe86a50];

    /* ── the green belt: a clipped hedge round the lot (a gap for the gate, and for the view at the back), trees behind it ── */
    hedge(-W, -D, -W + 0.8, D, 1.9); hedge(W - 0.8, -D, W, D, 1.9); hedge(-W, -D, POOL[0] + 1.6, -D + 0.8, 1.9); hedge(POOL[2] - 1.6, -D, W, -D + 0.8, 1.9);
    box(g, M.hedge, (POOL[0] + POOL[2]) / 2, 3.25, -D + 0.4, POOL[2] - POOL[0] - 3.0, 0.7, 0.8);                    // the hedge goes over the view as an arch
    for (i = 0; i < 9; i++) { tree(-W - 2.2 - (i % 2) * 1.6, -D + 1 + i * 4.2, 6.5 + (i % 3) * 1.2, 2.3 + (i % 2) * 0.5, i % 3 ? M.leafA : M.leafC); tree(W + 2.2 + (i % 2) * 1.6, -D + 2.5 + i * 4.1, 6.2 + ((i + 1) % 3) * 1.3, 2.3 + ((i + 1) % 2) * 0.5, i % 3 === 1 ? M.leafC : M.leafA); }
    for (i = 0; i < 12; i++) { if (i % 2) cypress(-W + 1 + i * 2.1, -D - 1.6, 6 + (i % 3)); else tree(-W + 1 + i * 2.1, -D - 2.6, 6.8 + (i % 3), 2.5, i % 4 ? M.leafA : M.leafB); }
    /* the front: a white picket fence with a gate, a low box hedge inside it, and the planted strip by the road */
    (function () {
      var z = D - 0.25, x;
      for (x = -W + 0.9; x <= W - 0.9; x += 0.16) { if (Math.abs(x - DOOR) < 0.95) continue; box(g, M.white, x, 0.52, z, 0.09, 0.95, 0.03).castShadow = false; }
      [[-W + 0.9, DOOR - 0.95], [DOOR + 0.95, W - 0.9]].forEach(function (q) { [0.3, 0.78].forEach(function (y) { box(g, M.white, (q[0] + q[1]) / 2, y, z - 0.03, q[1] - q[0], 0.08, 0.03); }); hedge(q[0] + 0.1, z - 1.0, q[1] - 0.2, z - 0.35, 0.7, M.box); });
      [-1, 1].forEach(function (sd) { box(g, M.white, DOOR + sd * 1.0, 0.7, z, 0.2, 1.4, 0.2); ball(g, M.white, DOOR + sd * 1.0, 1.5, z, 0.12); });
      for (i = 0; i < 2; i++) box(g, M.white, DOOR + (i ? 1.42 : -1.42), 0.55, z + 0.38, 0.03, 0.9, 0.84, i ? -0.5 : 0.5);                   // the gate stands open
      box(g, M.iron, DOOR + 2.3, 0.55, z + 0.6, 0.08, 1.1, 0.08); box(g, std({ color: 0xb8342c, roughness: 0.5 }), DOOR + 2.3, 1.18, z + 0.6, 0.24, 0.26, 0.44);   // the letter box
      for (x = -W + 2; x <= W - 2; x += 4.4) { if (Math.abs(x - DOOR) < 2) continue; flat(g, M.soil, x, 0.014, D + 0.75, 3.2, 0.9); shrub(x - 1, D + 0.75, 0.8, M.box); shrub(x + 1, D + 0.75, 0.8, M.box); tree(x, D + 0.75, 4.6, 1.5, M.leafC, 1); }
    })();

    /* ── the front yard ── */
    var FRONT;
    (function () {
      var lit = [];
      flat(g, M.flag, DOOR, 0.02, (HZ + 2.1 + D) / 2, 1.7, D - HZ - 2.1).material = std({ map: stoneTex(3, [176, 166, 148], 1, 7) });
      disc(g, std({ map: stoneTex(9, [182, 172, 152], 3, 3) }), DOOR, 0.024, PLZ, 2.9);
      /* the fountain: a round basin, a stem, two bowls, a jet */
      cyl(g, M.stone, DOOR, 0.22, PLZ, 1.25, 1.3, 0.44, 32); disc(g, M.water, DOOR, 0.47, PLZ, 1.16);
      (function () { var t = new THREE.Mesh(new THREE.TorusGeometry(1.22, 0.09, 10, 40), M.stone); t.rotation.x = PI / 2; t.position.set(DOOR, 0.47, PLZ); g.add(sh(t)); })();
      cyl(g, M.stone, DOOR, 0.8, PLZ, 0.14, 0.2, 0.7, 14); cyl(g, M.stone, DOOR, 1.18, PLZ, 0.62, 0.2, 0.14, 24); cyl(g, M.stone, DOOR, 1.5, PLZ, 0.09, 0.12, 0.5, 12); cyl(g, M.stone, DOOR, 1.78, PLZ, 0.32, 0.1, 0.1, 20);
      var jet = cyl(g, new THREE.MeshBasicMaterial({ color: 0xe8f8ff, transparent: true, opacity: 0.6 }), DOOR, 2.1, PLZ, 0.015, 0.05, 0.6, 8); jet.castShadow = false;
      for (i = 0; i < 16; i++) { var a = i / 16 * 6.283; bed(DOOR + Math.cos(a) * 3.25 - 0.3, PLZ + Math.sin(a) * 3.25 - 0.3, DOOR + Math.cos(a) * 3.25 + 0.3, PLZ + Math.sin(a) * 3.25 + 0.3, [TULIP[i % 6]], 22, 0.32, 0.055); }
      /* tulip borders down both sides of the walk */
      [[HZ + 2.3, PLZ - 3.6], [PLZ + 3.6, D - 1.3]].forEach(function (q) { [-1, 1].forEach(function (sd) { var x0 = DOOR + sd * 1.15 - 0.3; flat(g, M.soil, x0 + 0.3, 0.016, (q[0] + q[1]) / 2, 0.6, q[1] - q[0]); for (var zz = q[0]; zz < q[1] - 0.4; zz += 1) bed(x0, zz, x0 + 0.6, zz + 1, [TULIP[((zz | 0) + (sd > 0 ? 2 : 0)) % 6]], 26, 0.34, 0.055); }); });
      /* two round beds on the lawns: rings of colour round a clipped ball */
      [[-5.2, 10.4], [7.6, 10.4]].forEach(function (c, n) {
        disc(g, M.soil, c[0], 0.016, c[1], 1.9); shrub(c[0], c[1], 1.3, M.box);
        [[1.55, 0xf2c230], [1.15, 0xe23d4f], [0.8, 0xffffff]].forEach(function (rg, j) { var cnt = Math.round(rg[0] * 26); for (var q = 0; q < cnt; q++) { var a = q / cnt * 6.283 + j; flower(c[0] + Math.cos(a) * (rg[0] + r() * 0.12), 0.02, c[1] + Math.sin(a) * (rg[0] + r() * 0.12), 0.26 + j * 0.05, n ? [0x9a52c8, 0xf07ab0, 0xffffff][j] : rg[1], 0.06); } });
      });
      /* under the windows: hydrangeas; by the porch: two clipped cones; roses along the side hedges */
      flat(g, M.soil, -3.4, 0.016, HZ + 1.75, 4.6, 1.2); [-5.2, -4.0, -2.8, -1.6].forEach(function (x, n) { shrub(x, HZ + 1.7, 1.25, M.leafB, [HYD[n % 4], HYD[(n + 1) % 4]]); });
      flat(g, M.soil, 4.4, 0.016, HZ + 0.7, 2.6, 1.0); [3.7, 5.0].forEach(function (x, n) { shrub(x, HZ + 0.7, 1.15, M.leafB, [HYD[2], HYD[n]]); });
      [-0.25, 3.45].forEach(function (x) { cyl(g, std({ color: 0xb5643c }), x, 0.22, HZ + 2.1, 0.26, 0.2, 0.44, 16); var c = new THREE.Mesh(new THREE.ConeGeometry(0.36, 1.3, 16), M.box); c.position.set(x, 1.08, HZ + 2.1); g.add(sh(c)); });
      [-W + 1.35, W - 1.35].forEach(function (x) { flat(g, M.soil, x, 0.016, 10.2, 1.0, 11.6); for (var zz = 5.2; zz < 15.6; zz += 1.3) shrub(x, zz, 0.95, M.leafB, [ROSE[((zz * 3) | 0) % 4]]); });
      /* the oak with a bench under it, a birch on the other lawn */
      tree(-8.2, 6.6, 7.2, 2.9, M.leafA); tree(8.6, 14.2, 5.6, 1.9, M.leafC, 1.1);
      (function (x, z) { box(g, M.wood, x, 0.45, z, 1.7, 0.06, 0.5); box(g, M.wood, x, 0.8, z - 0.24, 1.7, 0.4, 0.05); [-0.75, 0.75].forEach(function (dx) { box(g, M.iron, x + dx, 0.22, z, 0.06, 0.44, 0.5); box(g, M.iron, x + dx, 0.62, z - 0.24, 0.06, 0.8, 0.06); }); })(-8.2, 8.9);
      /* lamps on the walk */
      [[DOOR - 1.9, 7.2], [DOOR + 1.9, 13.6]].forEach(function (q) {
        cyl(g, M.iron, q[0], 1.3, q[1], 0.045, 0.07, 2.6, 10); cyl(g, M.iron, q[0], 0.1, q[1], 0.13, 0.16, 0.2, 12); cyl(g, M.iron, q[0], 2.95, q[1], 0.2, 0.05, 0.08, 12);
        var bm = new THREE.MeshBasicMaterial({ color: 0xffe2b0 }); cyl(g, bm, q[0], 2.76, q[1], 0.11, 0.08, 0.3, 10).castShadow = false; var pl = new THREE.PointLight(0xffd9a0, 0, 9, 2); pl.position.set(q[0], 2.7, q[1]); holder.add(pl); lit.push([pl, bm]);
      });
      FRONT = { jet: jet, lit: lit };
    })();
    var jet = FRONT.jet, lamps = FRONT.lit;

    /* ── the sides of the house: a gravel walk with stepping stones on the west, the shed on the east ── */
    flat(g, M.gravel, -8.9, 0.014, 0, 2.6, 9.4); for (i = 0; i < 8; i++) box(g, M.stone, -8.9 + (i % 2 ? 0.18 : -0.18), 0.03, -3.9 + i * 1.12, 0.7, 0.05, 0.55, (i % 3 - 1) * 0.15);
    [-2.6, -0.9, 0.8, 2.5].forEach(function (z, n) { shrub(-6.75, z, 1.1, M.leafB, [HYD[n % 4]]); });
    flat(g, M.gravel, 8.9, 0.014, 0, 2.6, 9.4);
    (function (x, z) {                                                 // the shed, with the wheelbarrow at its door
      box(g, M.deck, x, 1.1, z, 2.2, 2.2, 2.6); box(g, M.dark, x - 1.11, 0.95, z + 0.3, 0.04, 1.9, 0.85); var rf = box(g, M.slate, x, 2.36, z, 2.6, 0.12, 3.0); rf.rotation.z = -0.14;
      var bx = x - 2.1, bz = z - 1.3; box(g, std({ color: 0x3f7f5a, roughness: 0.6 }), bx, 0.42, bz, 0.9, 0.3, 0.6, 0.4); cyl(g, M.iron, bx - 0.5, 0.2, bz + 0.22, 0.2, 0.2, 0.08, 14).rotation.z = PI / 2;
    })(9.9, -0.4);

    /* ── the back yard: the terrace and its pergola ── */
    var DX = -3.1, DZ = -5.7, top = 0.76, FX = -4.4, FZ = 13.1;          // the two garden tables: on the terrace, and on the front lawn by the gate
    var back = id === 'yard-back', KX = back ? DX : FX, KZ = back ? DZ : FZ;   // the desk is the table of the side you came in by: its chair is always a straight walk away
    function table(x, z) {
      box(g, M.deck, x, top - 0.025, z, 1.9, 0.05, 0.95); [[-0.85, -0.38], [0.85, -0.38], [-0.85, 0.38], [0.85, 0.38]].forEach(function (q) { box(g, M.white, x + q[0], (top - 0.05) / 2, z + q[1], 0.07, top - 0.05, 0.07); });
      box(g, M.white, x, top - 0.1, z, 1.78, 0.07, 0.83);
      (function (x, z) { box(g, M.deck, x, 0.46, z, 0.5, 0.04, 0.5); box(g, M.cloth, x, 0.5, z, 0.46, 0.05, 0.46); box(g, M.deck, x, 0.84, z + 0.25, 0.5, 0.5, 0.04); [[-0.22, -0.22], [0.22, -0.22], [-0.22, 0.22], [0.22, 0.22]].forEach(function (q) { box(g, M.white, x + q[0], 0.23, z + q[1], 0.045, 0.46, 0.045); }); })(x, z + 0.82);
      if (x === KX) return;                                            // the other table is laid for tea: a pot, two cups, a jug of flowers
      cyl(g, M.white, x - 0.3, top + 0.09, z, 0.1, 0.12, 0.18, 16); ball(g, M.white, x - 0.3, top + 0.19, z, 0.1, 0.5, 12); ball(g, M.brass, x - 0.3, top + 0.25, z, 0.022); box(g, M.white, x - 0.45, top + 0.12, z, 0.14, 0.03, 0.03, 0, 0.5);
      [[0.02, 0.16], [0.3, -0.12]].forEach(function (q) { cyl(g, M.white, x + q[0], top + 0.006, z + q[1], 0.075, 0.06, 0.012, 16); cyl(g, M.white, x + q[0], top + 0.04, z + q[1], 0.045, 0.032, 0.06, 14); });
      cyl(g, M.tile, x + 0.62, top + 0.1, z + 0.05, 0.06, 0.08, 0.2, 14); [[0xe23d4f, -0.05, 0.02], [0xf2c230, 0.04, -0.03], [0xffffff, 0.01, 0.06], [0xf07ab0, -0.02, -0.06]].forEach(function (q, n) { cyl(g, M.leafB, x + 0.62 + q[1], top + 0.3, z + 0.05 + q[2], 0.008, 0.008, 0.24, 5).castShadow = false; ball(g, std({ color: q[0], roughness: 0.7 }), x + 0.62 + q[1] * 1.3, top + 0.42 + n * 0.012, z + 0.05 + q[2] * 1.3, 0.05); });
    }
    table(FX, FZ);
    flat(g, M.pave, 0, 0.02, -5.55, 2 * HX + 1, 4.1);
    (function () {
      var x0 = -5.6, x1 = -0.6, z0 = -7.3, z1 = -3.75, y = 2.7, x, z;
      [[x0, z0], [x1, z0], [x0, z1], [x1, z1]].forEach(function (q) { box(g, M.white, q[0], y / 2, q[1], 0.16, y, 0.16); });
      [z0, z1].forEach(function (zz) { box(g, M.white, (x0 + x1) / 2, y + 0.08, zz, x1 - x0 + 0.7, 0.16, 0.1); });
      for (x = x0 - 0.2; x <= x1 + 0.21; x += 0.5) box(g, M.white, x, y + 0.2, (z0 + z1) / 2, 0.06, 0.12, z1 - z0 + 0.6);
      var vine = M.leafC, wis = [0xa98ae0, 0xc3a6f0, 0x8f72d0];        // wisteria over the beams: leaves, and flowers hanging in bunches
      for (i = 0; i < 26; i++) { var vx = x0 + r() * (x1 - x0), vz = z0 + r() * (z1 - z0); ball(g, vine, vx, y + 0.3, vz, 0.3 + r() * 0.2, 0.4, 8).castShadow = i % 2 === 0; for (k = 0; k < 4; k++) FL.push([vx + (r() - 0.5) * 0.3, y + 0.05 - k * 0.1, vz + (r() - 0.5) * 0.3, 0.075 - k * 0.012, wis[(r() * 3) | 0]]); }
      cyl(g, M.bark, x0 + 0.1, 1.35, z0 + 0.14, 0.035, 0.05, 2.7, 6);
      /* the garden table and its chair on the house side: the desk of the back yard (the front yard's is on its own lawn) */
      table(DX, DZ);
      /* against the house wall: a potting bench (the things that stand on a cabinet), a lemon tree in a pot, the grill */
      box(g, M.deck, 3.4, 0.86, -HZ - 0.36, 2.9, 0.06, 0.6); box(g, M.deck, 3.4, 0.3, -HZ - 0.36, 2.8, 0.04, 0.54); [[2.05, -0.12], [4.75, -0.12], [2.05, -0.6], [4.75, -0.6]].forEach(function (q) { box(g, M.white, q[0], 0.43, -HZ + q[1], 0.07, 0.86, 0.07); });
      [2.4, 2.9, 4.3].forEach(function (x, n) { cyl(g, std({ color: 0xb5643c }), x, 0.4, -HZ - 0.36, 0.11 + n * 0.02, 0.08, 0.16, 12); });
      cyl(g, std({ color: 0xb5643c }), 5.6, 0.25, -HZ - 0.5, 0.3, 0.22, 0.5, 16); cyl(g, M.bark, 5.6, 0.9, -HZ - 0.5, 0.03, 0.04, 0.9, 8); ball(g, M.leafA, 5.6, 1.6, -HZ - 0.5, 0.5, 0.95, 10); for (i = 0; i < 7; i++) { var a = r() * 6.283; FL.push([5.6 + Math.cos(a) * 0.42, 1.4 + r() * 0.4, -HZ - 0.5 + Math.sin(a) * 0.42, 0.06, 0xf5d83a]); }
      cyl(g, M.iron, 6.0, 0.82, -7.1, 0.3, 0.3, 0.3, 18); var lid = ball(g, M.iron, 6.0, 0.97, -7.1, 0.3, 0.6, 14); [[-0.2, -0.2], [0.2, -0.2], [0, 0.24]].forEach(function (q) { cyl(g, M.chrome, 6.0 + q[0], 0.34, -7.1 + q[1], 0.015, 0.015, 0.68, 6); });
    })();

    /* ── the pool: stone coping, tiled walls, water that moves, a ladder, loungers under a parasol ── */
    var water, ring, bball;
    (function () {
      var x0 = POOL[0], z0 = POOL[1], x1 = POOL[2], z1 = POOL[3], cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, w = x1 - x0, d = z1 - z0, c = 0.5;
      var dk = std({ map: stoneTex(15, [214, 206, 190], 5, 1) }), e = 1.5;                                             // the deck round it: four strips, the water between them
      flat(g, dk, cx, 0.022, z0 - e / 2, w + 2 * e, e); flat(g, dk, cx, 0.022, z1 + e / 2, w + 2 * e, e); flat(g, dk, x0 - e / 2, 0.022, cz, e, d); flat(g, dk, x1 + e / 2, 0.022, cz, e, d);
      box(g, M.stone, cx, 0.06, z0 - c / 2, w + 2 * c, 0.12, c); box(g, M.stone, cx, 0.06, z1 + c / 2, w + 2 * c, 0.12, c); box(g, M.stone, x0 - c / 2, 0.06, cz, c, 0.12, d); box(g, M.stone, x1 + c / 2, 0.06, cz, c, 0.12, d);
      /* the lawn is one plane under everything, so the pool is not dug: a tiled floor lies just over the grass and the water just over that */
      flat(g, std({ map: canvasTex(128, 128, function (x) { x.fillStyle = '#3fb4d2'; x.fillRect(0, 0, 128, 128); x.strokeStyle = 'rgba(255,255,255,.35)'; x.lineWidth = 2; x.strokeRect(0, 0, 128, 128); }, 28, 15), roughness: 0.4 }), cx, 0.026, cz, w, d);
      water = new THREE.Mesh(new THREE.PlaneGeometry(w, d), M.water); water.rotation.x = -PI / 2; water.position.set(cx, 0.05, cz); water.renderOrder = 2; g.add(water);
      [[-0.2, 0.26], [0.2, 0.26]].forEach(function (q) { var t = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.022, 8, 20, PI), M.chrome); t.position.set(x0 + 0.9 + q[0], 0.32, z1 + 0.05); t.rotation.y = PI / 2; g.add(t); });
            ring = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.15, 12, 28), std({ color: 0xff6f91, roughness: 0.4 })); ring.rotation.x = PI / 2; ring.position.set(cx + 1.6, 0.14, cz - 0.6); g.add(sh(ring));
      bball = ball(g, std({ map: canvasTex(64, 32, function (x) { ['#f4f4f4', '#e8433f', '#f4f4f4', '#2f7de0', '#f4f4f4', '#f2c230'].forEach(function (cc, n) { x.fillStyle = cc; x.fillRect(n * 64 / 6, 0, 64 / 6 + 1, 32); }); }), roughness: 0.45 }), cx - 2.2, 0.21, cz + 0.8, 0.2, 1, 16);
      [x0 + 3.2, x0 + 5.2].forEach(function (x) {                       // two loungers on the house side, facing the water
        box(g, M.deck, x, 0.3, z1 + 1.9, 0.7, 0.06, 1.5); var bk = box(g, M.deck, x, 0.55, z1 + 2.9, 0.7, 0.06, 0.75); bk.rotation.x = 0.75;
        box(g, M.cloth, x, 0.36, z1 + 1.9, 0.62, 0.07, 1.4); var cu = box(g, M.cloth, x, 0.62, z1 + 2.86, 0.62, 0.07, 0.7); cu.rotation.x = 0.75; [[-0.3, 1.3], [0.3, 1.3], [-0.3, 2.5], [0.3, 2.5]].forEach(function (q) { box(g, M.deck, x + q[0], 0.14, z1 + q[1], 0.05, 0.28, 0.05); });
      });
      var px = x0 + 4.2, pz = z1 + 2.2; cyl(g, M.white, px, 1.25, pz, 0.025, 0.025, 2.5, 8); cyl(g, M.stone, px, 0.06, pz, 0.25, 0.28, 0.12, 16);
      var can = new THREE.Mesh(new THREE.ConeGeometry(1.5, 0.5, 8, 1, true), std({ color: 0xf2e6c8, roughness: 0.9, side: THREE.DoubleSide })); can.position.set(px, 2.45, pz); g.add(sh(can));
      cyl(g, M.deck, px, 0.2, pz + 0.5, 0.22, 0.22, 0.4, 14); cyl(g, M.white, px, 0.415, pz + 0.5, 0.26, 0.26, 0.03, 16);                     // the small table between them
    })();

    /* ── the kitchen garden: raised beds in gravel, a greenhouse, an apple tree ── */
    (function () {
      var gx0 = -10.9, gx1 = -1.6, gz0 = -15.6, gz1 = -9.0, lf = std({ color: 0x4f9a3c }), lf2 = std({ color: 0x86b85a }), lf3 = std({ color: 0x2f7a3a });
      flat(g, M.gravel, (gx0 + gx1) / 2, 0.016, (gz0 + gz1) / 2, gx1 - gx0, gz1 - gz0);
      function raised(x, z, w, d) { flat(g, M.soil, x, 0.3, z, w - 0.1, d - 0.1); box(g, M.wood, x, 0.16, z - d / 2, w, 0.32, 0.06); box(g, M.wood, x, 0.16, z + d / 2, w, 0.32, 0.06); box(g, M.wood, x - w / 2, 0.16, z, 0.06, 0.32, d); box(g, M.wood, x + w / 2, 0.16, z, 0.06, 0.32, d); }
      var B = [[-9.0, -10.3], [-5.9, -10.3], [-2.9, -10.3], [-5.9, -12.5], [-2.9, -12.5], [-5.9, -14.7], [-2.9, -14.7]], bw = 2.5, bd = 1.3, x, z, n;
      B.forEach(function (b) { raised(b[0], b[1], bw, bd); });
      /* tomatoes on canes */
      for (n = 0; n < 5; n++) { x = B[0][0] - 1 + n * 0.5; z = B[0][1]; cyl(g, M.deck, x, 0.95, z, 0.012, 0.012, 1.3, 6); ball(g, lf3, x, 0.62, z, 0.2, 1.2, 8); ball(g, lf, x + 0.05, 1.0, z, 0.17, 1.3, 8); ball(g, lf, x - 0.04, 1.34, z, 0.12, 1.2, 8); for (k = 0; k < 7; k++) { var ta = r() * 6.283; FL.push([x + Math.cos(ta) * 0.2, 0.5 + r() * 0.8, z + Math.sin(ta) * 0.2, 0.055, r() < 0.75 ? 0xe5372b : 0xb8c83a]); } }
      /* cabbages */
      for (n = 0; n < 8; n++) { x = B[1][0] - 0.95 + (n % 4) * 0.63; z = B[1][1] - 0.3 + ((n / 4) | 0) * 0.6; ball(g, lf2, x, 0.4, z, 0.2, 0.7, 10); ball(g, std({ color: 0xb4d48a }), x, 0.45, z, 0.13, 0.9, 10); }
      /* lettuces, green and red */
      for (n = 0; n < 14; n++) { x = B[2][0] - 1.0 + (n % 7) * 0.34; z = B[2][1] - 0.3 + ((n / 7) | 0) * 0.6; ball(g, n % 3 ? std({ color: 0x9fd060 }) : std({ color: 0x8a3a52 }), x, 0.36, z, 0.14, 0.6, 8).castShadow = false; }
      /* carrots: feathery tops, a little orange at the soil */
      for (n = 0; n < 16; n++) { x = B[3][0] - 1.0 + (n % 8) * 0.29; z = B[3][1] - 0.3 + ((n / 8) | 0) * 0.6; for (k = 0; k < 3; k++) { var ct = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.3, 5), k ? lf : lf2); ct.position.set(x + (k - 1) * 0.045, 0.45, z); ct.rotation.z = (1 - k) * 0.35; ct.castShadow = false; g.add(ct); } FL.push([x, 0.315, z, 0.04, 0xf08a24]); }
      /* pumpkins on their vines */
      for (n = 0; n < 4; n++) { x = B[4][0] - 0.8 + n * 0.55; z = B[4][1] + (n % 2 ? 0.25 : -0.2); ball(g, std({ color: 0xea7a1c, roughness: 0.6 }), x, 0.46, z, 0.2 + (n % 2) * 0.05, 0.75, 12); cyl(g, lf3, x, 0.63, z, 0.02, 0.03, 0.08, 6); ball(g, lf, x + 0.25, 0.34, z - 0.2, 0.2, 0.25, 8).castShadow = false; }
      /* corn */
      for (n = 0; n < 10; n++) { x = B[5][0] - 1.0 + (n % 5) * 0.5; z = B[5][1] - 0.3 + ((n / 5) | 0) * 0.6; cyl(g, lf2, x, 1.15, z, 0.02, 0.03, 1.7, 6); for (k = 0; k < 4; k++) { var l = box(g, lf, x, 0.8 + k * 0.3, z, 0.7, 0.01, 0.07, k * 1.3 + n); l.rotation.z = 0.5; l.castShadow = false; } FL.push([x + 0.06, 1.1, z, 0.045, 0xf0d060]); }
      /* beans on a wigwam of canes; peppers beside */
      (function (x, z) { for (k = 0; k < 5; k++) { var a = k / 5 * 6.283, p = cyl(g, M.deck, x + Math.cos(a) * 0.2, 1.2, z + Math.sin(a) * 0.2, 0.012, 0.012, 1.9, 6); p.rotation.z = Math.cos(a) * 0.2; p.rotation.x = -Math.sin(a) * 0.2; } var c = new THREE.Mesh(new THREE.ConeGeometry(0.42, 1.5, 10), lf); c.position.set(x, 1.1, z); g.add(sh(c)); for (k = 0; k < 8; k++) FL.push([x + (r() - 0.5) * 0.5, 0.6 + r() * 0.9, z + (r() - 0.5) * 0.5, 0.035, 0xd8404a]); })(B[6][0] - 0.6, B[6][1]);
      for (n = 0; n < 3; n++) { x = B[6][0] + 0.25 + n * 0.4; z = B[6][1]; ball(g, lf3, x, 0.5, z, 0.17, 1.1, 8); for (k = 0; k < 3; k++) FL.push([x + (r() - 0.5) * 0.24, 0.45 + r() * 0.2, z + (r() - 0.5) * 0.24, 0.04, [0xe5372b, 0xf2c230, 0x4f9a3c][k]]); }
      /* the greenhouse in the corner: white frame, glass, seedlings inside */
      (function (x, z) {
        var w = 2.6, d = 2.2, h = 2.0, gl = new THREE.MeshStandardMaterial({ color: lin(0xcfe8ee), roughness: 0.05, metalness: 0.3, transparent: true, opacity: 0.28, side: THREE.DoubleSide });
        var b = box(g, gl, x, h / 2, z, w, h, d); b.castShadow = false; box(g, M.brick, x, 0.2, z, w + 0.06, 0.4, d + 0.06);
        [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (q) { box(g, M.white, x + q[0] * w / 2, h / 2, z + q[1] * d / 2, 0.06, h, 0.06); }); [-1, 1].forEach(function (sd) { box(g, M.white, x, h, z + sd * d / 2, w, 0.06, 0.06); box(g, M.white, x + sd * w / 2, h, z, 0.06, 0.06, d); var rf = box(g, gl, x + sd * w / 4, h + 0.33, z, w / 2 + 0.12, 0.02, d); rf.rotation.z = -sd * 0.5; rf.castShadow = false; });
        box(g, M.white, x, h + 0.66, z, 0.06, 0.06, d + 0.1); box(g, M.deck, x, 0.8, z - 0.5, w - 0.4, 0.04, 0.5); for (k = 0; k < 6; k++) { cyl(g, std({ color: 0xb5643c }), x - 0.9 + k * 0.36, 0.88, z - 0.5, 0.07, 0.05, 0.12, 8); ball(g, lf2, x - 0.9 + k * 0.36, 1.0, z - 0.5, 0.08, 1.2, 6).castShadow = false; }
      })(-9.2, -14.0);
      /* a water butt, a watering can; the apple tree by the lawn */
      cyl(g, std({ color: 0x35604a, roughness: 0.6 }), -10.3, 0.5, -12.0, 0.36, 0.32, 1.0, 16); cyl(g, std({ color: 0x8aa0a8, metalness: 0.7, roughness: 0.4 }), -8.0, 0.16, -11.6, 0.11, 0.11, 0.28, 12); var sp = cyl(g, std({ color: 0x8aa0a8, metalness: 0.7, roughness: 0.4 }), -7.8, 0.22, -11.6, 0.015, 0.02, 0.34, 6); sp.rotation.z = -0.9;
      tree(-8.6, -7.2, 4.4, 1.7, M.leafA, 0.9); for (k = 0; k < 16; k++) { var a = r() * 6.283, e = r() * 0.9 - 0.2; FL.push([-8.6 + Math.cos(a) * Math.cos(e) * 1.55, 3.1 + Math.sin(e) * 1.3, -7.2 + Math.sin(a) * Math.cos(e) * 1.55, 0.07, r() < 0.7 ? 0xd8322e : 0xb8d040]); }
      /* lavender between the kitchen garden and the lawn; sunflowers along the back hedge */
      flat(g, M.soil, (gx0 + gx1) / 2, 0.016, gz1 + 0.45, gx1 - gx0, 0.7); for (x = gx0 + 0.4; x < gx1; x += 0.62) { ball(g, std({ color: 0x7f9a78 }), x, 0.2, gz1 + 0.45, 0.26, 0.7, 8).castShadow = false; for (k = 0; k < 7; k++) flower(x + (r() - 0.5) * 0.4, 0.2, gz1 + 0.45 + (r() - 0.5) * 0.4, 0.34 + r() * 0.12, 0x8a6fd8, 0.035); }
      for (x = -0.8; x < POOL[0] + 1.2; x += 0.6) { ST.push([x, 0.95, -D + 1.15, 1.9, 0.02]); FL.push([x, 1.9, -D + 1.15, 0.16, 0xf5c518]); FL.push([x, 1.9, -D + 1.3, 0.08, 0x5a3a1c]); }
      for (x = POOL[2] - 1.2; x < W - 1.1; x += 0.6) { ST.push([x, 0.95, -D + 1.15, 1.9, 0.02]); FL.push([x, 1.9, -D + 1.15, 0.16, 0xf5c518]); FL.push([x, 1.9, -D + 1.3, 0.08, 0x5a3a1c]); }
    })();
    /* east of the pool, by the hedge: a row of roses */
    flat(g, M.soil, W - 1.35, 0.016, -10.5, 1.0, 11); for (i = 0; i < 8; i++) shrub(W - 1.35, -15.3 + i * 1.4, 0.95, M.leafB, [ROSE[i % 4]]);

    /* every flower of the garden in two draws */
    (function () {
      var m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3(), s = new THREE.Vector3(), c = new THREE.Color();
      var st = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.008, 0.01, 1, 5), std({ color: 0x3f8a38 }), ST.length);
      ST.forEach(function (a, n) { var t = a[4] ? a[4] / 0.009 : 1; m4.compose(v.set(a[0], a[1], a[2]), q, s.set(t, a[3], t)); st.setMatrixAt(n, m4); }); g.add(st);
      var fm = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), new THREE.MeshStandardMaterial({ roughness: 0.75 }), FL.length);
      FL.forEach(function (a, n) { m4.compose(v.set(a[0], a[1], a[2]), q, s.set(a[3], a[3] * 1.15, a[3])); fm.setMatrixAt(n, m4); fm.setColorAt(n, c.copy(lin(a[4]))); }); fm.castShadow = true; g.add(fm);
    })();

    /* ── sky and light ── */
    var skyM = new THREE.MeshBasicMaterial({ map: skyTex(), side: THREE.BackSide, fog: false, depthWrite: false }), sky = new THREE.Mesh(new THREE.SphereGeometry(180, 32, 16), skyM); sky.renderOrder = -2; holder.add(sky);
    var clouds = new THREE.Group(), cm = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.92, fog: false }); holder.add(clouds);
    for (i = 0; i < 9; i++) { var cg = new THREE.Group(), a0 = i / 9 * 6.283 + r(); cg.position.set(Math.cos(a0) * (70 + r() * 40), 34 + r() * 16, Math.sin(a0) * (70 + r() * 40)); for (k = 0; k < 5; k++) { var cb = new THREE.Mesh(new THREE.SphereGeometry(5 + r() * 4, 10, 8), cm); cb.position.set((k - 2) * 5.5, r() * 2, r() * 4); cb.scale.y = 0.45; cg.add(cb); } clouds.add(cg); }
    var hemi = new THREE.HemisphereLight(0xdcecff, 0x5c7a48, 0.7); holder.add(hemi);
    var sun = new THREE.DirectionalLight(0xfff4e0, 1.0); sun.position.set(-14, 26, 12); sun.target.position.set(0, 0, 0); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096);
    var sc = sun.shadow.camera; sc.left = -22; sc.right = 22; sc.top = 24; sc.bottom = -24; sc.near = 1; sc.far = 80; sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.04; holder.add(sun); holder.add(sun.target);
    var poolL = new THREE.PointLight(0x7fe6ff, 0, 9, 2); poolL.position.set((POOL[0] + POOL[2]) / 2, 0.6, (POOL[1] + POOL[3]) / 2); holder.add(poolL);
    var terrL = new THREE.PointLight(0xffd9a0, 0, 10, 2); terrL.position.set(DX + 1, 2.4, DZ); holder.add(terrL);
    scene.fog = null; scene.background = new THREE.Color(0x8fbdf0);

    var mode = 'auto', lastApply = -99;
    function apply() {
      var T = SR.timeOfDay(mode), L = T.light, K = T.dusk, N = T.night, c = new THREE.Color();
      c.setRGB(0.1 + 0.9 * L, 0.12 + 0.88 * L, 0.2 + 0.8 * L).lerp(new THREE.Color(1.0, 0.72, 0.56), K * 0.5); skyM.color.copy(c); scene.background.copy(lin(0x8fbdf0)).multiply(c); cm.color.copy(c).lerp(new THREE.Color(1, 0.8, 0.7), K * 0.4);
      sun.intensity = 0.03 + 1.02 * L; sun.color.set(0xfff4e0).lerp(new THREE.Color(0xffb27a), K * 0.7).lerp(new THREE.Color(0x8fa4ff), N * 0.8);
      sun.position.set(-14 + 22 * K, 6 + 20 * L, 12); hemi.intensity = 0.1 + 0.66 * L;
      var eve = Math.max(0, Math.min(1, (N - 0.55) * 3));                    // lamps and windows come on once it is properly dusk
      lamps.forEach(function (q) { q[0].intensity = 1.0 * eve; q[1].color.set(eve > 0.3 ? 0xfff0cf : 0xd9d2c0); }); poolL.intensity = 0.9 * eve; terrL.intensity = 0.9 * eve;
      M.glass.emissiveIntensity = 0.85 * eve; M.water.emissiveIntensity = 0.08 + 0.5 * N;
    }
    apply();

    /* anchors: where each thing of Spatial Home goes in the garden — most of them on and round the terrace */
    var BW = -HZ - 0.36, anchors = {
      'desk.left': { p: [KX - 0.3, top, KZ - 0.06], ry: 0 }, 'desk.right': { p: [KX + 0.45, top, KZ - 0.02], ry: 0 },
      'desk.quill': { p: [KX - 0.75, top, KZ + 0.1], ry: 0.25 }, 'desk.mochi': { p: [KX + 0.78, top, KZ + 0.22], ry: -0.3 },
      'desk.key': { p: [KX + 0.36, top, KZ + 0.3], ry: 0.3 }, 'desk.watch': { p: [KX - 0.36, top, KZ + 0.28], ry: 0.2 },
      'desk.book': { p: [POOL[0] + 4.2, 0.43, POOL[3] + 2.7], ry: PI },                                            // the reading stand on the little table between the loungers
      'sill.left': { p: [2.0, 0.89, BW], ry: PI },
      'corner.window': { p: [5.2, 0, -5.6], ry: -PI / 2 },                                                               // Octo's aquarium at the end of the terrace
      'wall.left': { p: [-3.6, 1.9, -HZ - 0.07], ry: PI },                                                          // the EC–6 board on the house wall, under the pergola
      'cabinet.left': { p: [2.65, 0.89, BW], ry: PI }, 'shelf.mid': { p: [3.3, 0.89, BW], ry: PI },
      'cabinet.top': { p: [3.95, 0.89, BW], ry: PI }, 'cabinet.right': { p: [4.6, 0.89, BW], ry: PI },
      'wall.right': { p: [1.9, 3.0, -HZ - 0.05], ry: PI },
      'floor.pack': { p: [KX + 1.6, 0, KZ + 0.7], ry: 0.5 }, 'floor.gramo': { p: [-5.1, 0, -4.3], ry: PI },
      'floor.film': { p: [-10.1, 0, -5.6], ry: PI / 2 }, 'floor.portal': { p: [-8.9, 0, -4.2], ry: PI },              // the archway stands over the west walk, on the way round the house
      'floor.holo': { p: [0.4, 0, -6.4], ry: PI },
      'floor.window': { p: [(POOL[0] + POOL[2]) / 2, 0, -D + 0.42], ry: 0, w: POOL[2] - POOL[0] - 3.2, h: 2.9 }        // the Scenic Window fills the gap in the back hedge: the view beyond the pool
    };
    var solids = [[-HX, -HZ, HX, HZ + 0.9], [DOOR - 1.4, HZ, DOOR + 1.4, HZ + 1.8], [DOOR - 1.3, PLZ - 1.3, DOOR + 1.3, PLZ + 1.3],
      [POOL[0], POOL[1], POOL[2], POOL[3]], [DX - 0.95, DZ - 0.5, DX + 0.95, DZ + 0.45], [DX - 0.3, DZ + 0.55, DX + 0.3, DZ + 1.1], [FX - 0.95, FZ - 0.5, FX + 0.95, FZ + 0.45], [FX - 0.3, FZ + 0.55, FX + 0.3, FZ + 1.1], [1.9, -HZ - 0.7, 4.9, -HZ],
      [8.7, -1.8, 11, 1.0], [-10.6, -15.2, -7.8, -12.8], [-10.3, -11, -7.7, -9.6], [-7.2, -11, -4.6, -9.6], [-4.2, -11, -1.6, -9.6], [-7.2, -13.2, -4.6, -11.8], [-4.2, -13.2, -1.6, -11.8], [-7.2, -15.4, -4.6, -14], [-4.2, -15.4, -1.6, -14],
      [-9.1, 8.6, -7.3, 9.2], [POOL[0] + 2.8, POOL[3] + 1.1, POOL[0] + 5.6, POOL[3] + 3.3], [5.65, -7.45, 6.35, -6.75], [5.25, -HZ - 0.85, 5.95, -HZ],
      [-6.2, 9.4, -4.2, 11.4], [6.6, 9.4, 8.6, 11.4], [-8.6, 6.2, -7.8, 7.0], [-9.0, -7.6, -8.2, -6.8]];

    return {
      id: id, name: back ? 'The Back Yard' : 'The Front Yard', group: g, holder: holder, far: 420, size: { W: W - 0.9, D: D - 0.9, H: 9 }, realistic: true,
      anchors: anchors, avatar: PT.avatar, backdrop: [sky, clouds],
      start: back ? { pos: [1.4, 1.6, -4.3], yaw: 0.12, pitch: -0.1 } : { pos: [-1.6, 1.6, 15.4], yaw: -0.3, pitch: -0.04 }, startV: 1,
      seat: { x: KX, z: KZ + 0.82, yaw: PI, approach: [KX + 0.8, KZ + 0.95], y: 0.5 },
      desk: { pos: [KX, 1.42, KZ + 1.1], look: [KX, 0.9, KZ - 0.4] },                  // at the garden table: over it to the kitchen garden and the pool, or to the fountain and the house
      solids: solids,
      areas: [[DOOR - 0.75, D - 1.3, DOOR + 0.75, D + 3.0], [-W + 0.5, D + 1.5, W - 0.5, D + 3.0]],   // out of the gate, onto the pavement
      setTime: function (m) { mode = m || 'auto'; apply(); },
      tick: function (t, dt) {
        if (t - lastApply > 20) { lastApply = t; apply(); }
        M.water.map.offset.set(t * 0.012, Math.sin(t * 0.2) * 0.05);
        jet.scale.y = 1 + 0.12 * Math.sin(t * 5.1); jet.position.y = 1.83 + 0.3 * jet.scale.y;
        ring.position.y = 0.14 + 0.015 * Math.sin(t * 1.3); ring.rotation.z = t * 0.07; bball.position.y = 0.21 + 0.012 * Math.sin(t * 1.7 + 1); bball.rotation.y = t * 0.1;
        clouds.rotation.y = t * 0.002;
      },
      dispose: function () { SR.disposeTree(holder); scene.background = null; }
    };
  }
  SR.register({ id: 'yard', name: 'The Front Yard · Garden', zh: '前庭 · 花园与草坪', icon: '🌷', build: function (scene) { return make(scene, 'yard'); } });
  SR.register({ id: 'yard-back', name: 'The Back Yard · Pool & Kitchen Garden', zh: '后院 · 泳池与菜园', icon: '🏊', build: function (scene) { return make(scene, 'yard-back'); } });
})(window);
