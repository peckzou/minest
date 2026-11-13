/* Minest · Spatial Home — period furniture for the King's Hall showroom (2026-11-13). Clean models made here to replace
   the scanned table and chairs (the scan's furniture is fused into the room mesh and full of holes): the same size and
   place as the originals (measured from the scan: table top 0.86 × 1.51 m at 0.80 m; high-back chairs, two a side).
   They are Magical Backpack fixtures ('kh-table', 'kh-chair'): move them, turn them, put things on the table top. */
(function (root) {
  'use strict';
  var F = root.SpatialFurniture = root.SpatialFurniture || {};
  function mats(T) {
    if (F._m) return F._m;
    var L = function (h) { return new T.Color(h).convertSRGBToLinear(); };   // r128: material colours are linear
    return (F._m = {
      walnut: new T.MeshStandardMaterial({ color: L(0x4a2a18), roughness: 0.48, metalness: 0.05 }),
      walnutL: new T.MeshStandardMaterial({ color: L(0x7a4a2a), roughness: 0.42, metalness: 0.05 }),
      inlay: new T.MeshStandardMaterial({ color: L(0xa8743e), roughness: 0.38, metalness: 0.05 }),
      gold: new T.MeshStandardMaterial({ color: L(0xc9a24a), roughness: 0.3, metalness: 0.85 }),
      velvet: new T.MeshStandardMaterial({ color: L(0x7a2e2e), roughness: 0.85, metalness: 0 })
    });
  }
  function box(T, g, m, x, y, z, w, h, d) { var b = new T.Mesh(new T.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.castShadow = true; b.receiveShadow = true; g.add(b); return b; }
  /* a turned leg: a lathe profile (bun foot, vase, ring, column, block) */
  function leg(T, g, m, x, z, h) {
    var p = [[0, 0], [0.045, 0], [0.05, 0.03], [0.035, 0.06], [0.03, 0.09], [0.045, 0.16], [0.05, 0.24], [0.04, 0.32], [0.026, 0.38], [0.034, 0.42], [0.024, 0.46],
      [0.022, h - 0.2], [0.03, h - 0.17], [0.032, h - 0.14], [0.032, h], [0, h]].map(function (q) { return new T.Vector2(q[0], q[1]); });
    var l = new T.Mesh(new T.LatheGeometry(p, 14), m); l.position.set(x, 0, z); l.castShadow = true; g.add(l); return l;
  }
  F['kh-table'] = function (T) {
    var M = mats(T), g = new T.Group(), W = 0.86, D = 1.51, H = 0.80;
    box(T, g, M.walnut, 0, H - 0.025, 0, W, 0.05, D);                       // top
    box(T, g, M.inlay, 0, H + 0.0015, 0, W - 0.16, 0.003, D - 0.16);        // inlaid field
    box(T, g, M.walnutL, 0, H + 0.002, 0, W - 0.3, 0.003, D - 0.3);
    [[0, H - 0.002, W / 2 - 0.004, 0.012, 0.012, D], [0, H - 0.002, -W / 2 + 0.004, 0.012, 0.012, D]].forEach(function (q) { box(T, g, M.gold, q[2], q[1], 0, q[3], q[4], q[5]); });
    [[D / 2 - 0.004], [-D / 2 + 0.004]].forEach(function (q) { box(T, g, M.gold, 0, H - 0.002, q[0], W, 0.012, 0.012); });
    box(T, g, M.walnut, 0, H - 0.11, D / 2 - 0.06, W - 0.1, 0.12, 0.03);      // aprons
    box(T, g, M.walnut, 0, H - 0.11, -D / 2 + 0.06, W - 0.1, 0.12, 0.03);
    box(T, g, M.walnut, W / 2 - 0.06, H - 0.11, 0, 0.03, 0.12, D - 0.1);
    box(T, g, M.walnut, -W / 2 + 0.06, H - 0.11, 0, 0.03, 0.12, D - 0.1);
    box(T, g, M.gold, 0, H - 0.17, D / 2 - 0.045, 0.16, 0.03, 0.01);         // carved cartouches
    box(T, g, M.gold, 0, H - 0.17, -D / 2 + 0.045, 0.16, 0.03, 0.01);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (s) { leg(T, g, M.walnutL, s[0] * (W / 2 - 0.08), s[1] * (D / 2 - 0.1), H - 0.05); });
    box(T, g, M.walnut, -(W / 2 - 0.08), 0.12, 0, 0.035, 0.035, D - 0.2);   // H-stretcher
    box(T, g, M.walnut, W / 2 - 0.08, 0.12, 0, 0.035, 0.035, D - 0.2);
    box(T, g, M.walnut, 0, 0.12, 0, W - 0.16, 0.035, 0.035);
    return { group: g, hb: [W, H, D], place: 'floor' };
  };
  F['kh-chair'] = function (T) {
    var M = mats(T), g = new T.Group(), S = 0.46, SH = 0.46, BH = 1.18;     // the seat faces +z
    box(T, g, M.walnut, 0, SH - 0.03, 0, S, 0.06, S);
    box(T, g, M.velvet, 0, SH + 0.02, 0.01, S - 0.05, 0.05, S - 0.06);      // the cushion
    [[-1, 1], [1, 1]].forEach(function (s) { leg(T, g, M.walnutL, s[0] * (S / 2 - 0.04), s[1] * (S / 2 - 0.04), SH - 0.03); });
    [[-1, -1], [1, -1]].forEach(function (s) { box(T, g, M.walnut, s[0] * (S / 2 - 0.04), BH / 2, -S / 2 + 0.03, 0.045, BH, 0.045); });   // back posts to the floor
    box(T, g, M.velvet, 0, (SH + BH) / 2 + 0.03, -S / 2 + 0.035, S - 0.14, BH - SH - 0.16, 0.035);   // upholstered back
    box(T, g, M.walnut, 0, BH - 0.04, -S / 2 + 0.03, S - 0.02, 0.07, 0.05);  // crest rail
    box(T, g, M.gold, 0, BH + 0.02, -S / 2 + 0.03, 0.14, 0.06, 0.03);        // carved crest
    box(T, g, M.gold, 0, SH + 0.07, -S / 2 + 0.035, S - 0.12, 0.012, 0.04);
    box(T, g, M.walnut, 0, 0.12, S / 2 - 0.04, S - 0.1, 0.03, 0.03);          // front stretcher
    [-1, 1].forEach(function (s) { box(T, g, M.walnut, s * (S / 2 - 0.04), 0.12, 0, 0.03, 0.03, S - 0.1); });
    return { group: g, hb: [S, BH, S], place: 'floor' };
  };

  /* ───────── the EC–6 Victorian Study set (2026-11-13): a pedestal desk with a tooled green-leather top, a buttoned
     leather desk chair. Mahogany, brass, gilt tooling — the study's own palette. */
  function vmats(T) {
    if (F._v) return F._v;
    var L = function (h) { return new T.Color(h).convertSRGBToLinear(); };
    var c = document.createElement('canvas'); c.width = 1024; c.height = 576; var x = c.getContext('2d'), i;
    x.fillStyle = '#1f4a2e'; x.fillRect(0, 0, 1024, 576);
    for (i = 0; i < 9000; i++) { x.fillStyle = 'rgba(' + (Math.random() < 0.5 ? '0,0,0' : '80,140,90') + ',' + (Math.random() * 0.08) + ')'; x.fillRect(Math.random() * 1024, Math.random() * 576, 2 + Math.random() * 4, 1 + Math.random() * 2); }
    x.strokeStyle = '#d9b46a'; x.lineWidth = 5; x.strokeRect(22, 22, 980, 532); x.lineWidth = 2; x.strokeRect(36, 36, 952, 504);
    x.setLineDash([6, 6]); x.strokeRect(48, 48, 928, 480); x.setLineDash([]);
    [[36, 36], [988, 36], [36, 540], [988, 540]].forEach(function (q) { x.fillStyle = '#d9b46a'; x.beginPath(); x.arc(q[0], q[1], 10, 0, 6.3); x.fill(); });
    var tx = new T.CanvasTexture(c); tx.encoding = T.sRGBEncoding; tx.anisotropy = 8;
    return (F._v = {
      mahog: new T.MeshStandardMaterial({ color: L(0x4a1f12), roughness: 0.38, metalness: 0.05 }),
      mahogL: new T.MeshStandardMaterial({ color: L(0x6e3220), roughness: 0.34, metalness: 0.05 }),
      leather: new T.MeshStandardMaterial({ map: tx, roughness: 0.55, metalness: 0 }),
      oxblood: new T.MeshStandardMaterial({ color: L(0x5a1a18), roughness: 0.42, metalness: 0.02 }),
      brass: new T.MeshStandardMaterial({ color: L(0xc9a24a), roughness: 0.26, metalness: 0.9 })
    });
  }
  F['vic-desk'] = function (T) {
    var M = vmats(T), g = new T.Group(), W = 1.7, D = 0.9, H = 0.78, PW = 0.44, i, s;   // the drawers face +z (the chair side)
    box(T, g, M.mahog, 0, H - 0.02, 0, W + 0.04, 0.04, D + 0.04);                         // the top, its moulded edge
    box(T, g, M.mahogL, 0, H - 0.045, 0, W + 0.01, 0.012, D + 0.01);
    var top = new T.Mesh(new T.PlaneGeometry(W - 0.14, D - 0.14), M.leather); top.rotation.x = -Math.PI / 2; top.position.y = H + 0.0008; top.receiveShadow = true; g.add(top);
    box(T, g, M.brass, 0, H - 0.003, D / 2 + 0.021, W + 0.04, 0.006, 0.004);
    [-1, 1].forEach(function (sd) {
      var cx = sd * (W / 2 - PW / 2 - 0.01);
      box(T, g, M.mahog, cx, 0.035, 0, PW + 0.04, 0.07, D + 0.02);                        // plinth
      box(T, g, M.mahog, cx, (0.07 + H - 0.05) / 2, 0, PW, H - 0.12, D - 0.04);           // the pedestal
      for (i = 0; i < 3; i++) {                                                           // three drawers, panelled, brass pulls
        var y0 = 0.1 + i * 0.19, y1 = y0 + 0.17, yc = (y0 + y1) / 2;
        box(T, g, M.mahogL, cx, yc, D / 2 - 0.015, PW - 0.05, 0.165, 0.012);
        box(T, g, M.mahog, cx, yc, D / 2 - 0.006, PW - 0.11, 0.115, 0.008);
        var pull = new T.Mesh(new T.TorusGeometry(0.03, 0.006, 6, 14, Math.PI), M.brass); pull.rotation.z = Math.PI; pull.position.set(cx, yc + 0.01, D / 2 + 0.004); g.add(pull);
        box(T, g, M.brass, cx, yc + 0.035, D / 2, 0.025, 0.035, 0.006);
      }
      box(T, g, M.mahogL, cx, (0.07 + H - 0.05) / 2, -D / 2 + 0.012, PW - 0.06, H - 0.24, 0.01);   // back panel
      [-1, 1].forEach(function (k) { box(T, g, M.mahogL, cx + k * (PW / 2 + 0.004), (0.07 + H - 0.05) / 2, 0, 0.01, H - 0.24, D - 0.18); });
    });
    box(T, g, M.mahog, 0, H - 0.1, 0, W - 2 * PW - 0.02, 0.1, D - 0.04);                  // the middle drawer over the kneehole
    box(T, g, M.mahogL, 0, H - 0.1, D / 2 - 0.015, W - 2 * PW - 0.08, 0.075, 0.012);
    var mp = new T.Mesh(new T.TorusGeometry(0.035, 0.006, 6, 14, Math.PI), M.brass); mp.rotation.z = Math.PI; mp.position.set(0, H - 0.095, D / 2 + 0.004); g.add(mp);
    box(T, g, M.mahog, 0, (0.07 + H - 0.15) / 2, -D / 2 + 0.03, W - 2 * PW - 0.02, H - 0.2, 0.02);   // modesty panel
    return { group: g, hb: [W, H, D], place: 'floor' };
  };
  F['vic-chair'] = function (T) {
    var M = vmats(T), g = new T.Group(), SH = 0.48, R = 0.27, i;                          // the seat faces +z
    var seat = new T.Mesh(new T.CylinderGeometry(R, R - 0.02, 0.09, 28), M.oxblood); seat.position.y = SH; seat.castShadow = true; g.add(seat);
    var rim = new T.Mesh(new T.CylinderGeometry(R + 0.01, R + 0.01, 0.03, 28), M.mahog); rim.position.y = SH - 0.055; g.add(rim);
    var back = new T.Mesh(new T.CylinderGeometry(R - 0.01, R - 0.01, 0.36, 28, 1, true, Math.PI - 1.25, 2.5), M.oxblood); back.material = M.oxblood; back.position.y = SH + 0.23; g.add(back);
    var inner = back.clone(); inner.scale.set(0.9, 1, 0.9); g.add(inner);
    var pts = []; for (i = 0; i <= 20; i++) { var a = Math.PI - 1.3 + 2.6 * i / 20; pts.push(new T.Vector3(Math.sin(a) * (R - 0.005), SH + 0.42, Math.cos(a) * (R - 0.005))); }
    var rail = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 30, 0.032, 8, false), M.mahog); rail.castShadow = true; g.add(rail);
    pts.forEach(function (p, k) { if (k % 5) return; box(T, g, M.mahog, p.x, SH + 0.2, p.z, 0.03, 0.4, 0.03); });
    var btn = new T.SphereGeometry(0.009, 6, 4);
    for (var r = 0; r < 3; r++) for (i = 0; i < 7; i++) { var b2 = Math.PI - 0.95 + 1.9 * (i + (r % 2) * 0.5) / 7; if (b2 > Math.PI + 0.95) continue; var bm = new T.Mesh(btn, M.brass); bm.position.set(Math.sin(b2) * (R * 0.9 - 0.012), SH + 0.12 + r * 0.1, Math.cos(b2) * (R * 0.9 - 0.012)); g.add(bm); }
    var col = new T.Mesh(new T.CylinderGeometry(0.035, 0.045, SH - 0.14, 12), M.mahog); col.position.y = (SH - 0.14) / 2 + 0.08; g.add(col);
    for (i = 0; i < 4; i++) { var a2 = i / 4 * Math.PI * 2 + Math.PI / 4, leg = new T.Mesh(new T.BoxGeometry(0.05, 0.04, 0.32), M.mahog); leg.position.set(Math.sin(a2) * 0.15, 0.08, Math.cos(a2) * 0.15); leg.rotation.y = a2; leg.rotation.x = 0.25; g.add(leg);
      var cs = new T.Mesh(new T.SphereGeometry(0.028, 10, 8), M.brass); cs.position.set(Math.sin(a2) * 0.29, 0.028, Math.cos(a2) * 0.29); g.add(cs); }
    return { group: g, hb: [0.58, SH + 0.45, 0.58], place: 'floor' };
  };
  var CAT = root.SpatialFurnitureCatalog = root.SpatialFurnitureCatalog || [];
  [{ id: 'vic-desk', name: '维多利亚书桌', en: 'Victorian pedestal desk', size: [1.7, 0.78, 0.9] }, { id: 'vic-chair', name: '维多利亚书桌椅', en: 'Victorian desk chair', size: [0.58, 0.93, 0.58] }].forEach(function (c) {
    if (!CAT.some(function (x) { return x.id === c.id; })) CAT.push({ id: c.id, name: c.name, en: c.en, icon: '▣', place: 'floor', size: c.size, note: 'EC–6 维多利亚书房的家具' }); });

  /* ───────── the King's Hall set (2026-11-13): marble columns for the display things, a Savonnerie-style carpet under the
     table, gilt girandoles with candles at its head */
  function kmats(T) {
    if (F._k) return F._k;
    var L = function (h) { return new T.Color(h).convertSRGBToLinear(); };
    var c = document.createElement('canvas'); c.width = c.height = 256; var x = c.getContext('2d'), i;           // white marble, grey veins
    x.fillStyle = '#eee9df'; x.fillRect(0, 0, 256, 256);
    for (i = 0; i < 14; i++) { x.strokeStyle = 'rgba(120,115,110,' + (0.15 + Math.random() * 0.25) + ')'; x.lineWidth = 0.6 + Math.random() * 1.6; x.beginPath(); var px = Math.random() * 256, py = 0; x.moveTo(px, py); while (py < 256) { px += (Math.random() - 0.5) * 28; py += 10 + Math.random() * 16; x.lineTo(px, py); } x.stroke(); }
    var mt = new T.CanvasTexture(c); mt.encoding = T.sRGBEncoding; mt.wrapS = mt.wrapT = T.RepeatWrapping;
    return (F._k = {
      marble: new T.MeshStandardMaterial({ map: mt, roughness: 0.18, metalness: 0 }),
      verde: new T.MeshStandardMaterial({ color: L(0x1f3a30), roughness: 0.2, metalness: 0.05 }),
      gilt: new T.MeshStandardMaterial({ color: L(0xc9a24a), roughness: 0.28, metalness: 0.88 }),
      wax: new T.MeshStandardMaterial({ color: L(0xf3ead6), roughness: 0.6 })
    });
  }
  function lathe(T, pts, m, seg) { return new T.Mesh(new T.LatheGeometry(pts.map(function (q) { return new T.Vector2(q[0], q[1]); }), seg || 24), m); }
  F['kh-plinth'] = function (T) {                                                          // the same height and top as the pedestal it replaces (0.91)
    var M = kmats(T), g = new T.Group();
    box(T, g, M.verde, 0, 0.04, 0, 0.44, 0.08, 0.44); box(T, g, M.marble, 0, 0.1, 0, 0.38, 0.04, 0.38);
    var base = lathe(T, [[0, 0.12], [0.16, 0.12], [0.165, 0.14], [0.15, 0.16], [0.14, 0.18], [0, 0.18]], M.gilt); g.add(base);
    var shaft = lathe(T, [[0, 0.18], [0.125, 0.18], [0.13, 0.4], [0.12, 0.66], [0.11, 0.74], [0, 0.74]], M.marble); shaft.castShadow = true; g.add(shaft);
    var cap = lathe(T, [[0, 0.74], [0.12, 0.74], [0.13, 0.76], [0.12, 0.78], [0.15, 0.8], [0.17, 0.83], [0, 0.83]], M.gilt); g.add(cap);
    box(T, g, M.marble, 0, 0.855, 0, 0.38, 0.05, 0.38); box(T, g, M.gilt, 0, 0.83, 0, 0.39, 0.008, 0.39); box(T, g, M.verde, 0, 0.895, 0, 0.42, 0.03, 0.42);
    return { group: g, hb: [0.44, 0.91, 0.44], place: 'floor' };
  };
  F['kh-carpet'] = function (T) {
    if (!F._kc) {
      var c = document.createElement('canvas'); c.width = 1024; c.height = 1408; var x = c.getContext('2d'), W = c.width, H = c.height, i;
      x.fillStyle = '#1e2a4a'; x.fillRect(0, 0, W, H);                                     // the border: deep blue, gold acanthus
      x.strokeStyle = '#c9a24a'; x.lineWidth = 8; x.strokeRect(16, 16, W - 32, H - 32); x.strokeRect(118, 118, W - 236, H - 236);
      for (i = 0; i < 96; i++) { var t = i / 96, P = 2 * (W - 134) + 2 * (H - 134), d = t * P, px, py;
        if (d < W - 134) { px = 67 + d; py = 67; } else if ((d -= W - 134) < H - 134) { px = W - 67; py = 67 + d; } else if ((d -= H - 134) < W - 134) { px = W - 67 - d; py = H - 67; } else { d -= W - 134; px = 67; py = H - 67 - d; }
        x.save(); x.translate(px, py); x.rotate(t * 40); x.fillStyle = i % 2 ? '#d9b46a' : '#a8323a'; x.beginPath(); x.ellipse(0, 0, 18, 7, 0, 0, 6.3); x.fill(); x.fillStyle = '#e8dcc0'; x.beginPath(); x.arc(0, 0, 3.5, 0, 6.3); x.fill(); x.restore(); }
      x.fillStyle = '#5e1e22'; x.fillRect(126, 126, W - 252, H - 252);                    // the field: aged ivory, a lattice of small flowers, rose garlands
      x.strokeStyle = 'rgba(201,162,74,.38)'; x.lineWidth = 2;
      for (var gx = 160; gx < W - 140; gx += 56) for (var gy = 160; gy < H - 140; gy += 56) { x.beginPath(); x.moveTo(gx - 9, gy); x.lineTo(gx, gy - 9); x.lineTo(gx + 9, gy); x.lineTo(gx, gy + 9); x.closePath(); x.stroke(); x.fillStyle = (gx + gy) % 112 ? 'rgba(232,220,192,.55)' : 'rgba(201,162,74,.6)'; x.beginPath(); x.arc(gx, gy, 3, 0, 6.3); x.fill(); }
      for (i = 0; i < 260; i++) { var fx = 150 + Math.random() * (W - 300), fy = 150 + Math.random() * (H - 300); x.fillStyle = ['rgba(232,220,192,.3)', 'rgba(110,140,90,.35)', 'rgba(201,162,74,.35)'][i % 3]; x.beginPath(); x.arc(fx, fy, 3 + Math.random() * 6, 0, 6.3); x.fill(); }
      function ring(r, col, lw) { x.strokeStyle = col; x.lineWidth = lw; x.beginPath(); x.ellipse(W / 2, H / 2, r, r * 1.3, 0, 0, 6.3); x.stroke(); }
      x.fillStyle = '#e3d4b4'; x.beginPath(); x.ellipse(W / 2, H / 2, 260, 340, 0, 0, 6.3); x.fill(); x.fillStyle = '#1e2a4a'; x.beginPath(); x.ellipse(W / 2, H / 2, 170, 222, 0, 0, 6.3); x.fill();
      ring(260, '#b8903a', 8); ring(240, '#1e2a4a', 4); ring(150, 'rgba(201,162,74,.8)', 3);
      for (i = 0; i < 36; i++) { var b = i / 36 * Math.PI * 2; x.fillStyle = i % 2 ? '#b8903a' : '#e8dcc0'; x.beginPath(); x.arc(W / 2 + Math.cos(b) * 250, H / 2 + Math.sin(b) * 325, 5, 0, 6.3); x.fill(); }
      for (i = 0; i < 24; i++) { var a = i / 24 * Math.PI * 2; x.save(); x.translate(W / 2 + Math.cos(a) * 190, H / 2 + Math.sin(a) * 248); x.rotate(a); x.fillStyle = i % 2 ? '#c9a24a' : '#a8323a'; x.beginPath(); x.ellipse(0, 0, 26, 9, 0, 0, 6.3); x.fill(); x.restore(); }
      x.fillStyle = '#c9a24a'; x.beginPath(); x.ellipse(W / 2, H / 2, 90, 117, 0, 0, 6.3); x.fill(); x.fillStyle = '#1e2a4a'; x.beginPath(); x.ellipse(W / 2, H / 2, 50, 65, 0, 0, 6.3); x.fill();
      [[126, 126], [W - 126, 126], [126, H - 126], [W - 126, H - 126]].forEach(function (q) { x.fillStyle = '#1e2a4a'; x.beginPath(); x.arc(q[0], q[1], 110, 0, 6.3); x.fill(); x.strokeStyle = '#b8903a'; x.lineWidth = 4; x.beginPath(); x.arc(q[0], q[1], 92, 0, 6.3); x.stroke(); x.fillStyle = '#e3d4b4'; x.beginPath(); x.arc(q[0], q[1], 60, 0, 6.3); x.fill(); x.fillStyle = 'rgba(201,162,74,.8)'; x.beginPath(); x.arc(q[0], q[1], 18, 0, 6.3); x.fill(); });
      x.strokeStyle = '#c9a24a'; x.lineWidth = 8; x.strokeRect(118, 118, W - 236, H - 236);
      var im = x.getImageData(0, 0, W, H), D = im.data; for (i = 0; i < D.length; i += 4) { var n = (Math.random() - 0.5) * 22 - ((i / 4 / W | 0) % 3 === 0 ? 7 : 0); D[i] = D[i] * 0.9 + n; D[i + 1] = D[i + 1] * 0.88 + n; D[i + 2] = D[i + 2] * 0.88 + n; } x.putImageData(im, 0, 0);
      var tx = new T.CanvasTexture(c); tx.encoding = T.sRGBEncoding; tx.anisotropy = 8; F._kc = new T.MeshStandardMaterial({ map: tx, roughness: 0.95 });
    }
    var g = new T.Group(), CW = 2.6, CD = 3.6, m = new T.Mesh(new T.BoxGeometry(CW, 0.012, CD), [F._kc.clone(), F._kc.clone(), F._kc, F._kc.clone(), F._kc.clone(), F._kc.clone()]);
    [0, 1, 3, 4, 5].forEach(function (k) { m.material[k] = new T.MeshStandardMaterial({ color: 0x1e2a4a, roughness: 1 }); });
    m.position.y = 0.055; m.receiveShadow = true; g.add(m);                         // the scanned floor stands ~5 cm proud
    return { group: g, hb: [CW, 0.07, CD], place: 'floor' };
  };
  F['kh-girandole'] = function (T) {                                                       // a gilt torchère, three candles
    var M = kmats(T), g = new T.Group(), i, flames = [];
    for (i = 0; i < 3; i++) { var a = i / 3 * Math.PI * 2, ft = new T.Mesh(new T.BoxGeometry(0.05, 0.03, 0.2), M.gilt); ft.position.set(Math.sin(a) * 0.1, 0.03, Math.cos(a) * 0.1); ft.rotation.y = a; ft.rotation.x = -0.35; g.add(ft); }
    var col = lathe(T, [[0, 0.04], [0.06, 0.04], [0.07, 0.1], [0.04, 0.16], [0.06, 0.3], [0.035, 0.5], [0.025, 0.9], [0.045, 0.98], [0.03, 1.08], [0.05, 1.18], [0.065, 1.22], [0, 1.22]], M.gilt, 16); col.castShadow = true; g.add(col);
    var fT = (function () { var c = document.createElement('canvas'); c.width = 32; c.height = 64; var x = c.getContext('2d'), gr = x.createRadialGradient(16, 46, 2, 16, 40, 30); gr.addColorStop(0, 'rgba(255,245,200,1)'); gr.addColorStop(0.4, 'rgba(255,190,90,.8)'); gr.addColorStop(1, 'rgba(255,120,30,0)'); x.fillStyle = gr; x.beginPath(); x.moveTo(16, 2); x.quadraticCurveTo(30, 40, 24, 60); x.lineTo(8, 60); x.quadraticCurveTo(2, 40, 16, 2); x.fill(); var t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; return t; })();
    var fm = new T.MeshBasicMaterial({ map: fT, transparent: true, depthWrite: false, blending: T.AdditiveBlending, toneMapped: false });
    [[0, 0, 1.34], [-0.17, 0, 1.28], [0.17, 0, 1.28]].forEach(function (q, k) {
      if (k) { var arm = new T.Mesh(new T.TorusGeometry(0.085, 0.01, 6, 16, Math.PI), M.gilt); arm.position.set(q[0] / 2, 1.2, 0); arm.rotation.z = q[0] > 0 ? 0 : 0; arm.scale.y = 0.5; g.add(arm); }
      var cup = lathe(T, [[0, 0], [0.03, 0], [0.04, 0.025], [0, 0.025]], M.gilt, 12); cup.position.set(q[0], q[2] - 0.08, q[1]); g.add(cup);
      var cd = new T.Mesh(new T.CylinderGeometry(0.014, 0.014, 0.1, 10), M.wax); cd.position.set(q[0], q[2] - 0.03, q[1]); g.add(cd);
      var fl = new T.Mesh(new T.PlaneGeometry(0.035, 0.07), fm); fl.position.set(q[0], q[2] + 0.055, q[1]); g.add(fl); flames.push(fl);
      var fl2 = fl.clone(); fl2.rotation.y = Math.PI / 2; g.add(fl2); flames.push(fl2);
    });
    var light = new T.PointLight(0xffc27a, 0.35, 3.2, 2); light.position.set(0, 1.4, 0); g.add(light);
    return { group: g, hb: [0.3, 1.42, 0.3], place: 'floor',
      tick: function (t) { var f = 0.9 + 0.1 * Math.sin(t * 11) * Math.sin(t * 4.3); light.intensity = 0.35 * f; flames.forEach(function (m, k) { m.scale.y = 0.85 + 0.2 * Math.sin(t * (9 + k) + k); }); } };
  };
  [{ id: 'kh-plinth', name: '大理石展示柱', en: 'Marble column', size: [0.44, 0.91, 0.44] }, { id: 'kh-carpet', name: '宫廷地毯', en: 'Savonnerie carpet', size: [2.6, 0.01, 3.6] }, { id: 'kh-girandole', name: '镀金烛台', en: 'Gilt girandole', size: [0.3, 1.42, 0.3] }].forEach(function (c) {
    if (!CAT.some(function (x) { return x.id === c.id; })) CAT.push({ id: c.id, name: c.name, en: c.en, icon: '▣', place: 'floor', size: c.size, note: '国王大厅的家具' }); });
})(window);
