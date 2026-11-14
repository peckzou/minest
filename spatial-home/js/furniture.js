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

  /* ───────── the King's Hall presidential desk and its one chair (2026-11-13). A grand partners-style desk: two carved
     pedestals, a closed front with a gilt laurel-and-crown medallion (it faces the room), drawers and the kneehole on the
     chair side, a tooled leather top. The chair: a high-backed, buttoned crimson velvet armchair in walnut and gilt. */
  function emblem(T) {
    if (F._em) return F._em;
    var c = document.createElement('canvas'); c.width = c.height = 256; var x = c.getContext('2d'), i;
    x.fillStyle = '#2a170d'; x.fillRect(0, 0, 256, 256);
    x.strokeStyle = '#d9b46a'; x.lineWidth = 6; x.beginPath(); x.arc(128, 128, 118, 0, 6.3); x.stroke();
    for (var sd = -1; sd <= 1; sd += 2) for (i = 0; i < 9; i++) { var a = Math.PI / 2 + sd * (0.35 + i * 0.27), r = 92; x.save(); x.translate(128 + Math.cos(a) * r, 128 + Math.sin(a) * r); x.rotate(a + sd * 0.9); x.fillStyle = '#c9a24a'; x.beginPath(); x.ellipse(0, 0, 15, 6, 0, 0, 6.3); x.fill(); x.restore(); }
    x.fillStyle = '#d9b46a'; x.beginPath(); x.moveTo(78, 150); x.lineTo(178, 150); x.lineTo(186, 92); x.lineTo(156, 118); x.lineTo(128, 78); x.lineTo(100, 118); x.lineTo(70, 92); x.closePath(); x.fill();
    x.fillRect(76, 152, 104, 14); [[70, 88], [128, 72], [186, 88]].forEach(function (q) { x.beginPath(); x.arc(q[0], q[1], 8, 0, 6.3); x.fill(); });
    x.fillStyle = '#8a1f2c'; x.beginPath(); x.arc(128, 132, 7, 0, 6.3); x.fill(); x.fillStyle = '#1f5ad0'; x.beginPath(); x.arc(100, 140, 5, 0, 6.3); x.arc(156, 140, 5, 0, 6.3); x.fill();
    var t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; return (F._em = new T.MeshStandardMaterial({ map: t, roughness: 0.35, metalness: 0.5 }));
  }
  F['kh-desk'] = function (T) {
    var V = vmats(T), K = kmats(T), L = function (h) { return new T.Color(h).convertSRGBToLinear(); };
    var oak = F._oak || (F._oak = new T.MeshStandardMaterial({ color: L(0x3a2214), roughness: 0.36, metalness: 0.05 })), oakL = F._oakL || (F._oakL = new T.MeshStandardMaterial({ color: L(0x5c3820), roughness: 0.32, metalness: 0.05 }));
    var g = new T.Group(), W = 1.95, D = 1.1, H = 0.79, PW = 0.56, i;                        // the closed front faces +z (the room), the chair sits at −z
    box(T, g, oak, 0, 0.045, 0, W + 0.06, 0.09, D + 0.06); box(T, g, K.gilt, 0, 0.092, 0, W + 0.04, 0.008, D + 0.04);   // plinth
    box(T, g, oak, 0, (0.09 + H - 0.11) / 2, 0, W, H - 0.2, D);                            // the carcass
    box(T, g, oakL, 0, H - 0.075, 0, W + 0.02, 0.07, D + 0.02); box(T, g, K.gilt, 0, H - 0.11, 0, W + 0.025, 0.01, D + 0.025);   // frieze
    box(T, g, oak, 0, H - 0.022, 0, W + 0.1, 0.045, D + 0.1); box(T, g, oakL, 0, H - 0.05, 0, W + 0.07, 0.015, D + 0.07);         // the top, moulded
    var top = new T.Mesh(new T.PlaneGeometry(W - 0.12, D - 0.12), V.leather); top.rotation.x = -Math.PI / 2; top.position.y = H + 0.0008; top.receiveShadow = true; g.add(top);
    /* the front: two pedestal panels and a centre door with the medallion, pilasters between */
    var fz = D / 2 + 0.004;
    [-1, 1].forEach(function (sd) { var cx = sd * (W / 2 - PW / 2);
      box(T, g, oakL, cx, 0.4, fz, PW - 0.1, 0.46, 0.012); box(T, g, oak, cx, 0.4, fz + 0.008, PW - 0.2, 0.36, 0.01);
      [[0, 0.18], [0, -0.18]].forEach(function (q) { box(T, g, K.gilt, cx, 0.4 + q[1], fz + 0.014, PW - 0.2, 0.008, 0.004); }); [-1, 1].forEach(function (k) { box(T, g, K.gilt, cx + k * (PW - 0.2) / 2, 0.4, fz + 0.014, 0.008, 0.36, 0.004); });
      var ros = new T.Mesh(new T.CylinderGeometry(0.035, 0.035, 0.012, 16), K.gilt); ros.rotation.x = Math.PI / 2; ros.position.set(cx, 0.4, fz + 0.02); g.add(ros);
      [cx - sd * (PW / 2), sd * (W / 2)].forEach(function (px) { var pil = new T.Mesh(new T.CylinderGeometry(0.035, 0.04, H - 0.22, 14), oakL); pil.position.set(px, (0.1 + H - 0.12) / 2, fz); g.add(pil);
        var cap = new T.Mesh(new T.CylinderGeometry(0.05, 0.035, 0.04, 14), K.gilt); cap.position.set(px, H - 0.135, fz); g.add(cap); var bs = new T.Mesh(new T.CylinderGeometry(0.045, 0.05, 0.03, 14), K.gilt); bs.position.set(px, 0.11, fz); g.add(bs); }); });
    var CW = W - 2 * PW - 0.08;
    box(T, g, oakL, 0, 0.38, fz, CW, 0.5, 0.012);
    var med = new T.Mesh(new T.CircleGeometry(0.16, 40), emblem(T)); med.position.set(0, 0.4, fz + 0.012); g.add(med);
    var ring = new T.Mesh(new T.TorusGeometry(0.165, 0.012, 8, 40), K.gilt); ring.position.set(0, 0.4, fz + 0.014); g.add(ring);
    [[0, 0.62], [0, 0.14]].forEach(function (q) { box(T, g, K.gilt, 0, q[1], fz + 0.008, CW - 0.06, 0.01, 0.006); });
    /* the chair side: drawers in the pedestals, a centre drawer over the kneehole */
    var bz = -D / 2 - 0.004;
    [-1, 1].forEach(function (sd) { var cx = sd * (W / 2 - PW / 2);
      for (i = 0; i < 3; i++) { var yc = 0.19 + i * 0.17; box(T, g, oakL, cx, yc, bz, PW - 0.08, 0.15, 0.012);
        var pull = new T.Mesh(new T.TorusGeometry(0.032, 0.006, 6, 14, Math.PI), V.brass); pull.rotation.z = Math.PI; pull.position.set(cx, yc + 0.01, bz - 0.006); g.add(pull); } });
    box(T, g, oak, 0, (0.09 + H - 0.2) / 2, 0, CW + 0.06, H - 0.31, D - 0.3);              // the kneehole is open at the back: carve it out visually with a dark recess
    var hole = new T.Mesh(new T.PlaneGeometry(CW - 0.02, H - 0.34), new T.MeshStandardMaterial({ color: 0x120a06, roughness: 1 })); hole.rotation.y = Math.PI; hole.position.set(0, (0.1 + H - 0.24) / 2, bz - 0.001); g.add(hole);
    box(T, g, oakL, 0, H - 0.165, bz, CW, 0.08, 0.012);
    return { group: g, hb: [W + 0.1, H, D + 0.1], place: 'floor' };
  };
  F['kh-exec'] = function (T) {
    var K = kmats(T), L = function (h) { return new T.Color(h).convertSRGBToLinear(); }, g = new T.Group(), i, j;
    var vel = F._vel || (F._vel = new T.MeshStandardMaterial({ color: L(0x7a1a22), roughness: 0.82 })), wal = F._oak || (F._oak = new T.MeshStandardMaterial({ color: L(0x3a2214), roughness: 0.36, metalness: 0.05 }));
    var SW = 0.66, SD = 0.6, SH = 0.47, BH = 1.36;                                          // the seat faces +z
    box(T, g, wal, 0, SH - 0.05, 0, SW, 0.08, SD); box(T, g, K.gilt, 0, SH - 0.09, SD / 2 - 0.002, SW, 0.012, 0.01);
    var cush = new T.Mesh(new T.BoxGeometry(SW - 0.06, 0.09, SD - 0.06), vel); cush.position.set(0, SH + 0.03, 0.01); g.add(cush);
    [[-1, 1], [1, 1], [-1, -1], [1, -1]].forEach(function (q) { var lg = new T.Mesh(new T.LatheGeometry([[0, 0], [0.035, 0], [0.04, 0.03], [0.026, 0.1], [0.032, 0.2], [0.024, 0.3], [0.03, SH - 0.09], [0, SH - 0.09]].map(function (p) { return new T.Vector2(p[0], p[1]); }), 12), wal);
      lg.position.set(q[0] * (SW / 2 - 0.05), 0, q[1] * (SD / 2 - 0.05)); g.add(lg); var ft = new T.Mesh(new T.SphereGeometry(0.03, 10, 8), K.gilt); ft.position.set(q[0] * (SW / 2 - 0.05), 0.02, q[1] * (SD / 2 - 0.05)); g.add(ft); });
    var back = new T.Group(); back.position.set(0, SH, -SD / 2 + 0.04); back.rotation.x = -0.1; g.add(back);
    [-1, 1].forEach(function (sd) { box(T, back, wal, sd * (SW / 2 - 0.035), (BH - SH) / 2, 0, 0.06, BH - SH, 0.07); var fn = new T.Mesh(new T.SphereGeometry(0.035, 12, 8), K.gilt); fn.position.set(sd * (SW / 2 - 0.035), BH - SH + 0.03, 0); back.add(fn); });
    box(T, back, wal, 0, BH - SH - 0.04, 0, SW, 0.09, 0.07); box(T, back, K.gilt, 0, BH - SH + 0.03, 0, 0.22, 0.07, 0.03);
    var pad = new T.Mesh(new T.BoxGeometry(SW - 0.1, BH - SH - 0.16, 0.06), vel); pad.position.set(0, (BH - SH) / 2 - 0.02, 0.02); back.add(pad);
    var btn = new T.SphereGeometry(0.01, 6, 4);
    for (i = 0; i < 4; i++) for (j = 0; j < 3 + (i % 2); j++) { var bm = new T.Mesh(btn, K.gilt); bm.position.set((j - (2 + (i % 2)) / 2) * 0.14, 0.18 + i * 0.17, 0.052); back.add(bm); }
    box(T, back, K.gilt, 0, 0.05, 0.055, SW - 0.1, 0.012, 0.01);
    [-1, 1].forEach(function (sd) { var ax = sd * (SW / 2 - 0.02);                      // the arms: padded rests on carved supports
      box(T, g, wal, ax, SH + 0.21, -0.02, 0.07, 0.04, SD - 0.06); var ap = new T.Mesh(new T.BoxGeometry(0.065, 0.04, SD - 0.2), vel); ap.position.set(ax, SH + 0.245, -0.04); g.add(ap);
      var sup = new T.Mesh(new T.CylinderGeometry(0.022, 0.028, 0.21, 10), wal); sup.position.set(ax, SH + 0.1, SD / 2 - 0.07); g.add(sup);
      var sc = new T.Mesh(new T.SphereGeometry(0.035, 12, 8), K.gilt); sc.position.set(ax, SH + 0.235, SD / 2 - 0.05); g.add(sc); });
    g.traverse(function (o) { if (o.isMesh) o.castShadow = true; });
    return { group: g, hb: [SW, BH, SD], place: 'floor' };
  };
  [{ id: 'kh-desk', name: '总统大书桌', en: 'Presidential desk', size: [2.05, 0.79, 1.2] }, { id: 'kh-exec', name: '高背御座椅', en: 'High-back chair', size: [0.66, 1.36, 0.6] }].forEach(function (c) {
    if (!CAT.some(function (x) { return x.id === c.id; })) CAT.push({ id: c.id, name: c.name, en: c.en, icon: '▣', place: 'floor', size: c.size, note: '国王大厅的家具' }); });

  /* ───────── the King's Hall as a state study (after the oval-office arrangement the user showed): a great oval carpet
     with a crown-and-laurel emblem, two standards behind the desk, console tables with bronze busts either side */
  F['kh-oval'] = function (T) {
    if (!F._ov) {
      var c = document.createElement('canvas'); c.width = 1536; c.height = 1312; var x = c.getContext('2d'), W = c.width, H = c.height, cx = W / 2, cy = H / 2, i;
      x.clearRect(0, 0, W, H);
      function ell(rx, ry, col) { x.fillStyle = col; x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, 0, 6.3); x.fill(); }
      ell(W / 2 - 2, H / 2 - 2, '#c9a24a'); ell(W / 2 - 22, H / 2 - 22, '#1b2a5c'); ell(W / 2 - 40, H / 2 - 40, '#d9b46a'); ell(W / 2 - 50, H / 2 - 50, '#13204a');
      for (i = 0; i < 2600; i++) { var a = Math.random() * 6.3, r = Math.random(); x.fillStyle = 'rgba(255,255,255,' + (Math.random() * 0.03) + ')'; x.fillRect(cx + Math.cos(a) * r * (W / 2 - 60), cy + Math.sin(a) * r * (H / 2 - 60), 3, 1); }
      x.strokeStyle = 'rgba(201,162,74,.5)'; x.lineWidth = 3; x.beginPath(); x.ellipse(cx, cy, W / 2 - 90, H / 2 - 90, 0, 0, 6.3); x.stroke();
      for (i = 0; i < 72; i++) { var b = i / 72 * Math.PI * 2; x.save(); x.translate(cx + Math.cos(b) * (W / 2 - 70), cy + Math.sin(b) * (H / 2 - 70)); x.rotate(b + Math.PI / 2); x.fillStyle = '#c9a24a'; x.beginPath(); x.ellipse(0, 0, 9, 4, 0, 0, 6.3); x.fill(); x.restore(); }
      /* the emblem: a crimson ring, gold beads, a ring of stars, a laurel wreath round a crown */
      var R = 380; x.fillStyle = '#a8202c'; x.beginPath(); x.arc(cx, cy, R, 0, 6.3); x.fill();
      x.fillStyle = '#e0b850'; x.beginPath(); x.arc(cx, cy, R - 22, 0, 6.3); x.fill(); x.fillStyle = '#13204a'; x.beginPath(); x.arc(cx, cy, R - 40, 0, 6.3); x.fill();
      for (i = 0; i < 48; i++) { var g2 = i / 48 * Math.PI * 2; x.fillStyle = '#f4d77a'; x.beginPath(); x.arc(cx + Math.cos(g2) * (R - 31), cy + Math.sin(g2) * (R - 31), 8, 0, 6.3); x.fill(); }
      function star(px, py, r1, r2) { x.beginPath(); for (var k = 0; k < 10; k++) { var q = k / 10 * Math.PI * 2 - Math.PI / 2, rr = k % 2 ? r2 : r1; x.lineTo(px + Math.cos(q) * rr, py + Math.sin(q) * rr); } x.closePath(); x.fill(); }
      x.fillStyle = '#f2ecd8'; for (i = 0; i < 40; i++) { var st = i / 40 * Math.PI * 2; star(cx + Math.cos(st) * (R - 80), cy + Math.sin(st) * (R - 80), 15, 6); }
      for (var sd = -1; sd <= 1; sd += 2) for (i = 0; i < 13; i++) { var la = Math.PI / 2 + sd * (0.3 + i * 0.19), lr = R - 150; x.save(); x.translate(cx + Math.cos(la) * lr, cy + Math.sin(la) * lr); x.rotate(la + sd * 0.8); x.fillStyle = i % 2 ? '#5f8a3a' : '#7aa04a'; x.beginPath(); x.ellipse(0, 0, 30, 11, 0, 0, 6.3); x.fill(); x.restore(); }
      x.fillStyle = '#e0b850'; x.beginPath(); x.moveTo(cx - 120, cy + 70); x.lineTo(cx + 120, cy + 70); x.lineTo(cx + 140, cy - 70); x.lineTo(cx + 70, cy - 10); x.lineTo(cx, cy - 110); x.lineTo(cx - 70, cy - 10); x.lineTo(cx - 140, cy - 70); x.closePath(); x.fill();
      x.fillRect(cx - 125, cy + 72, 250, 34); x.fillStyle = '#f4e3a0'; [[cx - 140, cy - 78], [cx, cy - 122], [cx + 140, cy - 78]].forEach(function (q) { x.beginPath(); x.arc(q[0], q[1], 16, 0, 6.3); x.fill(); });
      x.fillStyle = '#a8202c'; x.beginPath(); x.arc(cx, cy + 89, 11, 0, 6.3); x.fill(); x.fillStyle = '#2f6fd6'; x.beginPath(); x.arc(cx - 60, cy + 89, 9, 0, 6.3); x.arc(cx + 60, cy + 89, 9, 0, 6.3); x.fill();
      x.fillStyle = '#a8202c'; x.beginPath(); x.moveTo(cx - 110, cy + 60); x.quadraticCurveTo(cx, cy - 40, cx + 110, cy + 60); x.closePath(); x.globalAlpha = 0.55; x.fill(); x.globalAlpha = 1;
      var im = x.getImageData(0, 0, W, H), D = im.data; for (i = 0; i < D.length; i += 4) { if (!D[i + 3]) continue; var n = (Math.random() - 0.5) * 14; D[i] += n; D[i + 1] += n; D[i + 2] += n; } x.putImageData(im, 0, 0);
      var tx = new T.CanvasTexture(c); tx.encoding = T.sRGBEncoding; tx.anisotropy = 8; F._ov = new T.MeshStandardMaterial({ map: tx, roughness: 0.95, transparent: true, alphaTest: 0.5 });
    }
    var g = new T.Group(), RW = 8.0, RD = 6.8, m = new T.Mesh(new T.PlaneGeometry(RW, RD), F._ov); m.rotation.x = -Math.PI / 2; m.position.y = 0.058; m.receiveShadow = true; g.add(m);
    return { group: g, hb: [RW, 0.07, RD], place: 'floor' };
  };
  function banner(T, col, trim) {
    var K = kmats(T), g = new T.Group(), i;
    for (i = 0; i < 3; i++) { var a = i / 3 * Math.PI * 2, ft = new T.Mesh(new T.BoxGeometry(0.05, 0.04, 0.26), K.gilt); ft.position.set(Math.sin(a) * 0.12, 0.03, Math.cos(a) * 0.12); ft.rotation.y = a; ft.rotation.x = -0.3; g.add(ft); }
    var pole = new T.Mesh(new T.CylinderGeometry(0.018, 0.022, 2.55, 10), K.gilt); pole.position.y = 1.3; g.add(pole);
    var orb = new T.Mesh(new T.SphereGeometry(0.045, 14, 10), K.gilt); orb.position.y = 2.62; g.add(orb); var sp = new T.Mesh(new T.ConeGeometry(0.03, 0.16, 8), K.gilt); sp.position.y = 2.74; g.add(sp);
    var c = document.createElement('canvas'); c.width = 256; c.height = 512; var x = c.getContext('2d');
    x.fillStyle = col; x.fillRect(0, 0, 256, 512); x.strokeStyle = trim; x.lineWidth = 10; x.strokeRect(14, 14, 228, 484);
    x.fillStyle = trim; x.beginPath(); x.moveTo(78, 280); x.lineTo(178, 280); x.lineTo(188, 210); x.lineTo(156, 236); x.lineTo(128, 190); x.lineTo(100, 236); x.lineTo(68, 210); x.closePath(); x.fill(); x.fillRect(76, 282, 104, 16);
    for (i = 0; i < 12; i++) { x.fillRect(16 + i * 20, 470, 10, 42); }
    var tx = new T.CanvasTexture(c); tx.encoding = T.sRGBEncoding;
    var geo = new T.PlaneGeometry(0.6, 1.2, 12, 1), pos = geo.attributes.position;          // the cloth hangs in soft folds
    for (i = 0; i < pos.count; i++) pos.setZ(i, Math.sin((pos.getX(i) + 0.3) * 22) * 0.025);
    geo.computeVertexNormals();
    var cloth = new T.Mesh(geo, new T.MeshStandardMaterial({ map: tx, roughness: 0.75, side: T.DoubleSide })); cloth.position.set(0.33, 1.9, 0); g.add(cloth);
    var bar = new T.Mesh(new T.CylinderGeometry(0.01, 0.01, 0.66, 8), K.gilt); bar.rotation.z = Math.PI / 2; bar.position.set(0.33, 2.5, 0); g.add(bar);
    var tas = new T.Mesh(new T.ConeGeometry(0.03, 0.12, 8), K.gilt); tas.position.set(0.02, 2.4, 0.03); g.add(tas);
    return { group: g, hb: [0.7, 2.8, 0.3], place: 'floor' };
  }
  F['kh-banner'] = function (T) { return banner(T, '#8a1a24', '#e0b850'); };
  F['kh-banner2'] = function (T) { return banner(T, '#16245a', '#e0b850'); };
  F['kh-console'] = function (T) {                                                          // a carved pedestal table and a bronze bust on it
    var K = kmats(T), L = function (h) { return new T.Color(h).convertSRGBToLinear(); }, g = new T.Group();
    var oak = F._oak || (F._oak = new T.MeshStandardMaterial({ color: L(0x3a2214), roughness: 0.36, metalness: 0.05 })), bronze = F._brz || (F._brz = new T.MeshStandardMaterial({ color: L(0x4a3424), roughness: 0.35, metalness: 0.75 }));
    box(T, g, oak, 0, 0.8, 0, 0.95, 0.05, 0.42); box(T, g, oak, 0, 0.75, 0, 0.88, 0.06, 0.36); box(T, g, K.gilt, 0, 0.775, 0.183, 0.88, 0.008, 0.004);
    var col = new T.Mesh(new T.LatheGeometry([[0, 0.1], [0.09, 0.1], [0.1, 0.16], [0.05, 0.26], [0.08, 0.42], [0.045, 0.6], [0.06, 0.7], [0.08, 0.72], [0, 0.72]].map(function (p) { return new T.Vector2(p[0], p[1]); }), 16), oak); g.add(col);
    for (var i = 0; i < 4; i++) { var a = i / 4 * Math.PI * 2 + Math.PI / 4, f = new T.Mesh(new T.BoxGeometry(0.06, 0.08, 0.34), oak); f.position.set(Math.sin(a) * 0.14, 0.05, Math.cos(a) * 0.14); f.rotation.y = a; g.add(f);
      var paw = new T.Mesh(new T.SphereGeometry(0.035, 10, 8), K.gilt); paw.position.set(Math.sin(a) * 0.29, 0.03, Math.cos(a) * 0.29); g.add(paw); }
    var bust = new T.Group(); bust.position.y = 0.825; g.add(bust);
    var pl = new T.Mesh(new T.CylinderGeometry(0.07, 0.09, 0.1, 16), bronze); pl.position.y = 0.05; bust.add(pl);
    var sh = new T.Mesh(new T.SphereGeometry(0.14, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2), bronze); sh.scale.set(1.2, 0.8, 0.7); sh.position.y = 0.1; bust.add(sh);
    var nk = new T.Mesh(new T.CylinderGeometry(0.045, 0.05, 0.1, 12), bronze); nk.position.y = 0.2; bust.add(nk);
    var hd = new T.Mesh(new T.SphereGeometry(0.085, 18, 14), bronze); hd.scale.set(0.9, 1.12, 1); hd.position.y = 0.32; bust.add(hd);
    var hair = new T.Mesh(new T.SphereGeometry(0.088, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2.2), bronze); hair.scale.set(0.95, 1.05, 1.05); hair.position.set(0, 0.335, -0.008); bust.add(hair);
    var nose = new T.Mesh(new T.ConeGeometry(0.014, 0.04, 6), bronze); nose.rotation.x = Math.PI / 2; nose.position.set(0, 0.31, 0.088); bust.add(nose);
    g.traverse(function (o) { if (o.isMesh) o.castShadow = true; });
    return { group: g, hb: [0.95, 1.25, 0.42], place: 'floor' };
  };
  [{ id: 'kh-oval', name: '椭圆国事地毯', en: 'State oval carpet', size: [8, 0.07, 6.8] }, { id: 'kh-banner', name: '深红旗帜', en: 'Crimson standard', size: [0.7, 2.8, 0.3] }, { id: 'kh-banner2', name: '藏蓝旗帜', en: 'Navy standard', size: [0.7, 2.8, 0.3] }, { id: 'kh-console', name: '雕花边桌 · 铜像', en: 'Console with bust', size: [0.95, 1.25, 0.42] }].forEach(function (c) {
    if (!CAT.some(function (x) { return x.id === c.id; })) CAT.push({ id: c.id, name: c.name, en: c.en, icon: '▣', place: 'floor', size: c.size, note: '国王大厅的家具' }); });

  /* the study's desk chair after the user's reference: a high buttoned (chesterfield) back in brown leather, rolled arms,
     brass nailheads, turned legs on castors */
  F['vic-exec'] = function (T) {
    var V = vmats(T), L = function (h) { return new T.Color(h).convertSRGBToLinear(); }, g = new T.Group(), i, j;
    var lea = F._lea || (F._lea = new T.MeshStandardMaterial({ color: L(0x5a3220), roughness: 0.45, metalness: 0.02 })), dark = F._leaD || (F._leaD = new T.MeshStandardMaterial({ color: L(0x3a1e12), roughness: 0.5 }));
    var SW = 0.68, SD = 0.62, SH = 0.48, BH = 1.3;                                          // the seat faces +z
    box(T, g, lea, 0, SH - 0.06, 0, SW, 0.12, SD); var cu = new T.Mesh(new T.BoxGeometry(SW - 0.12, 0.08, SD - 0.1), lea); cu.position.set(0, SH + 0.04, 0.03); g.add(cu);
    var back = new T.Mesh(new T.BoxGeometry(SW, BH - SH + 0.06, 0.16), lea); back.position.set(0, (SH + BH) / 2 - 0.02, -SD / 2 + 0.06); back.rotation.x = -0.08; g.add(back);
    var roll = new T.Mesh(new T.CylinderGeometry(0.085, 0.085, SW, 16), lea); roll.rotation.z = Math.PI / 2; roll.position.set(0, BH, -SD / 2 + 0.03); g.add(roll);
    var btn = new T.SphereGeometry(0.012, 6, 4);
    for (i = 0; i < 5; i++) for (j = 0; j < 4 + (i % 2); j++) { var bm = new T.Mesh(btn, dark); bm.position.set((j - (3 + (i % 2)) / 2) * 0.13, SH + 0.12 + i * 0.14, -SD / 2 + 0.145 + i * 0.011); g.add(bm); }
    [-1, 1].forEach(function (sd) { var ax = sd * (SW / 2 + 0.03);
      box(T, g, lea, ax, SH + 0.1, -0.02, 0.1, 0.32, SD - 0.04);
      var ar = new T.Mesh(new T.CylinderGeometry(0.075, 0.075, SD - 0.02, 14), lea); ar.rotation.x = Math.PI / 2; ar.position.set(ax + sd * 0.01, SH + 0.27, -0.02); g.add(ar);
      for (i = 0; i < 12; i++) { var nh = new T.Mesh(new T.SphereGeometry(0.008, 6, 4), V.brass); nh.position.set(ax + sd * 0.05, SH - 0.03, -SD / 2 + 0.05 + i * (SD - 0.1) / 11); g.add(nh); } });
    for (i = 0; i < 16; i++) { var nf = new T.Mesh(new T.SphereGeometry(0.008, 6, 4), V.brass); nf.position.set(-SW / 2 + 0.04 + i * (SW - 0.08) / 15, SH - 0.03, SD / 2 + 0.002); g.add(nf); }
    [[-1, 1], [1, 1], [-1, -1], [1, -1]].forEach(function (q) { var lg = new T.Mesh(new T.CylinderGeometry(0.03, 0.022, SH - 0.12, 10), dark); lg.position.set(q[0] * (SW / 2 - 0.06), (SH - 0.12) / 2 + 0.03, q[1] * (SD / 2 - 0.06)); g.add(lg);
      var cs = new T.Mesh(new T.SphereGeometry(0.03, 10, 8), V.brass); cs.position.set(q[0] * (SW / 2 - 0.06), 0.03, q[1] * (SD / 2 - 0.06)); g.add(cs); });
    g.traverse(function (o) { if (o.isMesh) o.castShadow = true; });
    return { group: g, hb: [SW + 0.2, BH + 0.08, SD], place: 'floor' };
  };
  if (!CAT.some(function (x) { return x.id === 'vic-exec'; })) CAT.push({ id: 'vic-exec', name: '皮质高背椅', en: 'Buttoned leather chair', icon: '▣', place: 'floor', size: [0.88, 1.38, 0.62], note: 'EC–6 维多利亚书房的家具' });

  /* ───────── after the user's second reference photo (2026-11-13): an executive study desk and a tufted executive chair ─────────
     Desk: dark espresso walnut, double pedestal. The side the visitor (and the home view) sees has raised panels — two
     on each pedestal, one on each outer side — fluted corner pilasters, a carved frieze over a panelled modesty board,
     a moulded top with an ogee edge and a stepped plinth. The chair side has the drawers with brass bail pulls.
     Chair: brown leather, a tall camel-back with deep diamond tufting (buttons and the creases between them), rolled
     arms, brass nailheads round the back, the arms and the seat, turned legs on brass castors. */
  function emats(T) {
    if (F._e) return F._e;
    var L = function (h) { return new T.Color(h).convertSRGBToLinear(); };
    var c = document.createElement('canvas'); c.width = 256; c.height = 1024; var x = c.getContext('2d'), i;   // a quiet walnut grain
    x.fillStyle = '#3a2214'; x.fillRect(0, 0, 256, 1024);
    for (i = 0; i < 140; i++) { x.strokeStyle = 'rgba(' + (Math.random() < 0.5 ? '20,10,4' : '96,58,32') + ',' + (0.08 + Math.random() * 0.12) + ')'; x.lineWidth = 1 + Math.random() * 3;
      var x0 = Math.random() * 256; x.beginPath(); x.moveTo(x0, 0); x.bezierCurveTo(x0 + (Math.random() - 0.5) * 40, 340, x0 + (Math.random() - 0.5) * 40, 680, x0 + (Math.random() - 0.5) * 30, 1024); x.stroke(); }
    var g = new T.CanvasTexture(c); g.encoding = T.sRGBEncoding; g.wrapS = g.wrapT = T.RepeatWrapping; g.anisotropy = 4;
    return (F._e = {
      wood: new T.MeshStandardMaterial({ color: L(0xb08a70), map: g, roughness: 0.42, metalness: 0.04 }),
      woodD: new T.MeshStandardMaterial({ color: L(0x8a6a56), map: g, roughness: 0.46, metalness: 0.04 }),
      woodL: new T.MeshStandardMaterial({ color: L(0xd0a888), map: g, roughness: 0.36, metalness: 0.04 }),
      groove: new T.MeshStandardMaterial({ color: L(0x1c0f08), roughness: 0.6 }),
      brass: new T.MeshStandardMaterial({ color: L(0xc79a48), roughness: 0.28, metalness: 0.9 }),
      blotter: new T.MeshStandardMaterial({ color: L(0x2a1a12), roughness: 0.55 }),
      leather: new T.MeshStandardMaterial({ color: L(0x6a3a22), roughness: 0.38, metalness: 0.03 }),
      leatherD: new T.MeshStandardMaterial({ color: L(0x3c1e10), roughness: 0.5, metalness: 0.02 }),
      crease: new T.MeshStandardMaterial({ color: L(0x2a1208), roughness: 0.6 })
    });
  }
  /* a raised panel on a face: a frame of stiles and rails, a bevelled field, a raised centre. axis 'z': the face is a
     plane z = f (out = ±1 is the outward side); axis 'x': plane x = f. (u, v) is the panel centre along the face. */
  function rpanel(T, g, E, axis, f, out, u, v, w, h) {
    var t = 0.012, rw = 0.035;
    function put(m, du, dv, ww, hh, dd, off) {
      var b = new T.Mesh(new T.BoxGeometry(axis === 'z' ? ww : dd, hh, axis === 'z' ? dd : ww), m);
      if (axis === 'z') b.position.set(u + du, v + dv, f + out * off); else b.position.set(f + out * off, v + dv, u + du);
      b.castShadow = true; b.receiveShadow = true; g.add(b); return b;
    }
    put(E.woodL, 0, h / 2 - rw / 2, w, rw, t, t / 2); put(E.woodL, 0, -h / 2 + rw / 2, w, rw, t, t / 2);              // rails
    put(E.woodL, -w / 2 + rw / 2, 0, rw, h - 2 * rw, t, t / 2); put(E.woodL, w / 2 - rw / 2, 0, rw, h - 2 * rw, t, t / 2);   // stiles
    put(E.groove, 0, 0, w - 2 * rw, h - 2 * rw, 0.004, 0.002);                                                    // the shadow line
    put(E.woodD, 0, 0, w - 2 * rw - 0.02, h - 2 * rw - 0.02, t * 0.8, t * 0.4);                                   // bevelled field
    put(E.wood, 0, 0, w - 2 * rw - 0.08, h - 2 * rw - 0.08, t * 1.4, t * 0.7);                                    // raised centre
  }
  F['vic-exec-desk'] = function (T) {
    var E = emats(T), g = new T.Group(), W = 2.1, D = 1.05, H = 0.78, PW = 0.6, PB = 0.1, i;   // drawers face +z (the chair side); the front is −z
    function bx(m, x, y, z, w, h, d) { return box(T, g, m, x, y, z, w, h, d); }
    /* the top: a slab with an ogee edge (two steps), a leather blotter */
    bx(E.wood, 0, H - 0.022, 0, W + 0.08, 0.044, D + 0.08);
    bx(E.woodD, 0, H - 0.055, 0, W + 0.04, 0.024, D + 0.04);
    bx(E.woodL, 0, H - 0.071, 0, W + 0.01, 0.01, D + 0.01);
    var bl = new T.Mesh(new T.BoxGeometry(0.95, 0.004, 0.55), E.blotter); bl.position.set(0, H + 0.002, 0.12); bl.receiveShadow = true; g.add(bl);
    [-1, 1].forEach(function (k) { bx(E.woodD, k * 0.49, H + 0.006, 0.12, 0.05, 0.012, 0.57); });          // blotter corners (leather-bound ends)
    var CH = H - 0.075;                                                                                     // carcase height (under the top)
    [-1, 1].forEach(function (sd) {
      var cx = sd * (W / 2 - PW / 2 - 0.01);
      /* plinth: a step and a moulding */
      bx(E.woodD, cx, PB / 2, 0, PW + 0.05, PB, D - 0.02);
      bx(E.woodL, cx, PB + 0.008, 0, PW + 0.03, 0.016, D - 0.04);
      /* the pedestal body */
      bx(E.wood, cx, (PB + CH) / 2, 0, PW, CH - PB, D - 0.08);
      /* front (−z): two raised panels, fluted pilasters at the corners */
      var fz = -(D - 0.08) / 2, ph = CH - PB - 0.06;
      rpanel(T, g, E, 'z', fz, -1, cx, PB + 0.03 + ph * 0.79, PW - 0.14, ph * 0.38);
      rpanel(T, g, E, 'z', fz, -1, cx, PB + 0.03 + ph * 0.3, PW - 0.14, ph * 0.56);
      [-1, 1].forEach(function (k) {
        var px = cx + k * (PW / 2 - 0.025);
        bx(E.woodL, px, (PB + CH) / 2, fz - 0.012, 0.05, CH - PB - 0.02, 0.024);
        for (var f = -1; f <= 1; f++) bx(E.groove, px + f * 0.013, (PB + CH) / 2, fz - 0.025, 0.004, CH - PB - 0.12, 0.004);
        bx(E.woodD, px, CH - 0.02, fz - 0.016, 0.062, 0.03, 0.032); bx(E.woodD, px, PB + 0.04, fz - 0.016, 0.062, 0.03, 0.032);   // capital, base
      });
      /* the outer side: two raised panels */
      var sx = cx + sd * PW / 2;
      rpanel(T, g, E, 'x', sx, sd, 0, PB + 0.03 + ph * 0.79, D - 0.24, ph * 0.38);
      rpanel(T, g, E, 'x', sx, sd, 0, PB + 0.03 + ph * 0.3, D - 0.24, ph * 0.56);
      /* the chair side (+z): three drawers, brass bail pulls */
      var bz = (D - 0.08) / 2, dh = (CH - PB - 0.04) / 3;
      for (i = 0; i < 3; i++) {
        var yc = PB + 0.02 + dh * (i + 0.5);
        bx(E.woodL, cx, yc, bz + 0.006, PW - 0.06, dh - 0.02, 0.012);
        var bail = new T.Mesh(new T.TorusGeometry(0.035, 0.005, 6, 16, Math.PI), E.brass); bail.rotation.z = Math.PI; bail.position.set(cx, yc - 0.005, bz + 0.024); g.add(bail);
        [-1, 1].forEach(function (k) { bx(E.brass, cx + k * 0.035, yc + 0.008, bz + 0.016, 0.018, 0.026, 0.008); });
      }
    });
    /* between the pedestals: the frieze (a drawer at the back, a carved band at the front) and the modesty board */
    var MW = W - 2 * PW - 0.02, fz2 = -(D - 0.08) / 2;
    bx(E.wood, 0, CH - 0.065, 0, MW, 0.13, D - 0.08);
    bx(E.woodL, 0, CH - 0.065, fz2 - 0.008, MW - 0.04, 0.09, 0.016);
    for (i = 0; i < 9; i++) bx(E.woodD, -MW / 2 + 0.06 + i * (MW - 0.12) / 8, CH - 0.065, fz2 - 0.018, 0.026, 0.06, 0.01);   // carved dentils
    bx(E.brass, 0, CH - 0.065, fz2 - 0.02, 0.07, 0.03, 0.006);                                                  // a small cartouche
    bx(E.woodL, 0, CH - 0.065, (D - 0.08) / 2 + 0.006, MW - 0.06, 0.09, 0.012);                                 // the centre drawer (chair side)
    var cb = new T.Mesh(new T.TorusGeometry(0.04, 0.005, 6, 16, Math.PI), E.brass); cb.rotation.z = Math.PI; cb.position.set(0, CH - 0.07, (D - 0.08) / 2 + 0.024); g.add(cb);
    var mz = fz2 + 0.1;                                                                                         // the modesty board, set back a little
    bx(E.wood, 0, (PB + CH - 0.13) / 2 + 0.01, mz, MW, CH - 0.13 - PB, 0.03);
    rpanel(T, g, E, 'z', mz - 0.015, -1, 0, (PB + CH - 0.13) / 2 + 0.01, MW - 0.12, CH - 0.13 - PB - 0.1);
    g.traverse(function (o) { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    return { group: g, hb: [W + 0.08, H, D + 0.08], place: 'floor' };
  };
  F['vic-tufted'] = function (T) {
    var E = emats(T), g = new T.Group(), SW = 0.76, SD = 0.66, SH = 0.49, i, j;   // the seat faces +z
    function bx(m, x, y, z, w, h, d) { return box(T, g, m, x, y, z, w, h, d); }
    /* turned legs on brass castors, a seat rail with nailheads */
    [[-1, 1], [1, 1], [-1, -1], [1, -1]].forEach(function (q) {
      var p = [[0, 0], [0.03, 0], [0.032, 0.03], [0.022, 0.07], [0.03, 0.12], [0.026, 0.18], [0.034, 0.22], [0.034, SH - 0.17], [0, SH - 0.17]].map(function (r) { return new T.Vector2(r[0], r[1]); });
      var lg = new T.Mesh(new T.LatheGeometry(p, 12), E.woodD); lg.position.set(q[0] * (SW / 2 - 0.07), 0.04, q[1] * (SD / 2 - 0.07)); g.add(lg);
      var cs = new T.Mesh(new T.SphereGeometry(0.035, 10, 8), E.brass); cs.position.set(q[0] * (SW / 2 - 0.07), 0.035, q[1] * (SD / 2 - 0.07)); g.add(cs);
    });
    bx(E.leather, 0, SH - 0.1, 0, SW, 0.14, SD);                                                                 // the seat box
    var cu = new T.Mesh(new T.BoxGeometry(SW - 0.16, 0.09, SD - 0.12), E.leather); cu.position.set(0, SH + 0.01, 0.04); g.add(cu);
    var roll = new T.Mesh(new T.CylinderGeometry(0.06, 0.06, SW - 0.16, 16), E.leather); roll.rotation.z = Math.PI / 2; roll.position.set(0, SH - 0.005, SD / 2 - 0.02); g.add(roll);   // the cushion's front roll
    /* the back: a camel-back outline, extruded and bevelled, leaning back a little */
    var BW = SW + 0.04, BH = 0.86, sh = new T.Shape(), r = 0.12;
    sh.moveTo(-BW / 2, 0); sh.lineTo(BW / 2, 0); sh.lineTo(BW / 2, BH - 0.2);
    sh.bezierCurveTo(BW / 2, BH - 0.08, BW / 4, BH - 0.1, 0.12, BH - 0.02); sh.quadraticCurveTo(0, BH + 0.03, -0.12, BH - 0.02);
    sh.bezierCurveTo(-BW / 4, BH - 0.1, -BW / 2, BH - 0.08, -BW / 2, BH - 0.2); sh.lineTo(-BW / 2, 0);
    var bg = new T.ExtrudeGeometry(sh, { depth: 0.12, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.035, bevelSegments: 4, curveSegments: 18 });
    var back = new T.Group(); back.position.set(0, SH - 0.02, -SD / 2 + 0.02); back.rotation.x = -0.1; g.add(back);
    var bm = new T.Mesh(bg, E.leather); bm.position.z = -0.08; back.add(bm);
    /* diamond tufting on the front face: buttons on a staggered grid, the creases between them */
    var fzb = 0.08, cols = 6, rows = 6, dx = (BW - 0.16) / cols, dy = (BH - 0.22) / rows, pts = [];
    for (i = 0; i <= rows; i++) for (j = 0; j <= cols; j++) {
      if ((i + j) % 2) continue; var x = -BW / 2 + 0.08 + j * dx, y = 0.1 + i * dy;
      var limit = BH - 0.2 + (1 - Math.min(1, Math.abs(x) / (BW / 2))) * 0.12; if (y > limit - 0.04) continue;
      pts.push([x, y]); var bt = new T.Mesh(new T.SphereGeometry(0.014, 8, 6), E.leatherD); bt.position.set(x, y, fzb + 0.008); back.add(bt);
    }
    pts.forEach(function (a) { pts.forEach(function (b) {
      var ddx = b[0] - a[0], ddy = b[1] - a[1]; if (ddy <= 0 || Math.abs(Math.abs(ddx) - dx) > 1e-3 || Math.abs(ddy - dy) > 1e-3) return;
      var L = Math.hypot(ddx, ddy), cr = new T.Mesh(new T.BoxGeometry(0.006, L, 0.004), E.crease); cr.position.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, fzb + 0.004);
      cr.rotation.z = -Math.atan2(ddx, ddy); back.add(cr);
    }); });
    /* nailheads round the back's outline */
    sh.getSpacedPoints(70).forEach(function (q, k) { if (q.y < 0.02) return; var n = new T.Mesh(new T.SphereGeometry(0.008, 6, 4), E.brass); n.position.set(q.x * 0.985, q.y * 0.985, fzb + 0.012); back.add(n); });
    /* rolled arms with scroll fronts and a row of nailheads */
    [-1, 1].forEach(function (sd) {
      var ax = sd * (SW / 2 + 0.04);
      bx(E.leather, ax, SH + 0.08, -0.02, 0.1, 0.3, SD - 0.06);
      var ar = new T.Mesh(new T.CylinderGeometry(0.075, 0.075, SD - 0.04, 16), E.leather); ar.rotation.x = Math.PI / 2; ar.position.set(ax + sd * 0.015, SH + 0.25, -0.02); g.add(ar);
      var sc = new T.Mesh(new T.CylinderGeometry(0.078, 0.078, 0.02, 16), E.leatherD); sc.rotation.x = Math.PI / 2; sc.position.set(ax + sd * 0.015, SH + 0.25, SD / 2 - 0.04); g.add(sc);
      for (i = 0; i < 12; i++) { var nh = new T.Mesh(new T.SphereGeometry(0.008, 6, 4), E.brass); nh.position.set(ax + sd * 0.052, SH - 0.06, -SD / 2 + 0.06 + i * (SD - 0.12) / 11); g.add(nh); }
    });
    for (i = 0; i < 18; i++) { var nf = new T.Mesh(new T.SphereGeometry(0.008, 6, 4), E.brass); nf.position.set(-SW / 2 + 0.04 + i * (SW - 0.08) / 17, SH - 0.13, SD / 2 + 0.002); g.add(nf); }
    g.traverse(function (o) { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    return { group: g, hb: [SW + 0.22, SH + BH, SD + 0.1], place: 'floor' };
  };
  [{ id: 'vic-exec-desk', name: '大班桌', en: 'Executive pedestal desk', size: [2.18, 0.78, 1.13] },
   { id: 'vic-tufted', name: '拉扣高背大班椅', en: 'Tufted executive chair', size: [0.98, 1.35, 0.76] }].forEach(function (c) {
    if (!CAT.some(function (x) { return x.id === c.id; })) CAT.push({ id: c.id, name: c.name, en: c.en, icon: '▣', place: 'floor', size: c.size, note: 'EC–6 维多利亚书房的家具' }); });

  /* ───────── the study's collection (2026-11-13, the user's list): a grand piano, the Thinker in marble, a Gothic
     armour, a floor globe, a longcase clock. Front: +z. ───────── */
  function dmats(T) {
    if (F._d) return F._d;
    var L = function (h) { return new T.Color(h).convertSRGBToLinear(); };
    var v = document.createElement('canvas'); v.width = 256; v.height = 256; var x = v.getContext('2d'), i;   // a marble with faint grey veins
    x.fillStyle = '#f1eee8'; x.fillRect(0, 0, 256, 256);
    for (i = 0; i < 14; i++) { x.strokeStyle = 'rgba(120,118,112,' + (0.06 + Math.random() * 0.12) + ')'; x.lineWidth = 0.6 + Math.random() * 1.6; x.beginPath(); var a = Math.random() * 256, b = Math.random() * 256; x.moveTo(a, b);
      for (var k = 0; k < 6; k++) { a += (Math.random() - 0.3) * 60; b += (Math.random() - 0.5) * 50; x.lineTo(a, b); } x.stroke(); }
    var mt = new T.CanvasTexture(v); mt.encoding = T.sRGBEncoding; mt.wrapS = mt.wrapT = T.RepeatWrapping;
    return (F._d = {
      gloss: new T.MeshStandardMaterial({ color: L(0x0b0b0d), roughness: 0.1, metalness: 0.15, envMapIntensity: 1.4 }),
      ivory: new T.MeshStandardMaterial({ color: L(0xf4efe2), roughness: 0.3 }),
      ebony: new T.MeshStandardMaterial({ color: L(0x111012), roughness: 0.25 }),
      felt: new T.MeshStandardMaterial({ color: L(0x7a1420), roughness: 0.9 }),
      plate: new T.MeshStandardMaterial({ color: L(0xb8913c), roughness: 0.35, metalness: 0.8 }),
      sound: new T.MeshStandardMaterial({ color: L(0xd9b47a), roughness: 0.55 }),
      wire: new T.MeshStandardMaterial({ color: L(0xd8d8d8), roughness: 0.2, metalness: 1 }),
      marble: new T.MeshStandardMaterial({ map: mt, color: 0xffffff, roughness: 0.32, metalness: 0 }),
      statue: new T.MeshStandardMaterial({ color: L(0xf3f0ea), roughness: 0.38, metalness: 0 }),
      steel: new T.MeshStandardMaterial({ color: L(0xc6cad0), roughness: 0.2, metalness: 1.0, envMapIntensity: 1.3 }),
      steelD: new T.MeshStandardMaterial({ color: L(0x8a8f96), roughness: 0.3, metalness: 1.0 }),
      dark: new T.MeshStandardMaterial({ color: L(0x101010), roughness: 0.8 }),
      paper: new T.MeshStandardMaterial({ color: L(0xf2ead6), roughness: 0.85 }),
      glass: new T.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.12, roughness: 0.05, metalness: 0.3, depthWrite: false })
    });
  }
  /* a cylinder from a to b (radius r0 at a, r1 at b), and a ball at each end */
  function limb(T, g, m, a, b, r0, r1, balls) {
    var A = new T.Vector3().fromArray(a), B = new T.Vector3().fromArray(b), d = B.clone().sub(A), L = d.length();
    var c = new T.Mesh(new T.CylinderGeometry(r1, r0, L, 14), m); c.position.copy(A).add(B).multiplyScalar(0.5);
    c.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.normalize()); c.castShadow = true; g.add(c);
    if (balls) [[A, r0], [B, r1]].forEach(function (q) { var s = new T.Mesh(new T.SphereGeometry(q[1], 14, 10), m); s.position.copy(q[0]); g.add(s); });
    return c;
  }
  function ball(T, g, m, p, r, sc) { var s = new T.Mesh(new T.SphereGeometry(r, 20, 14), m); s.position.fromArray(p); if (sc) s.scale.fromArray(sc); s.castShadow = true; g.add(s); return s; }

  /* 1 · a concert grand in black gloss: the bent rim, the lid up on its stick (gold plate, strings and soundboard inside),
     the keyboard (52 white, 36 black), a music desk with a score, three turned legs, the pedal lyre, a bench */
  F['vic-piano'] = function (T) {
    var M = dmats(T), E = emats(T), root0 = new T.Group(), g = new T.Group(); root0.add(g); g.position.z = 0.42;
    var sh = new T.Shape(); sh.moveTo(-0.74, 0); sh.lineTo(0.74, 0); sh.lineTo(0.74, 0.42);
    sh.bezierCurveTo(0.74, 0.86, 0.12, 0.9, 0.06, 1.3); sh.bezierCurveTo(0.0, 1.72, -0.3, 1.92, -0.52, 1.9); sh.bezierCurveTo(-0.7, 1.88, -0.74, 1.78, -0.74, 1.6); sh.lineTo(-0.74, 0);
    function slab(shape, depth, m, y) { var ge = new T.ExtrudeGeometry(shape, { depth: depth, bevelEnabled: false, curveSegments: 40 }); var me = new T.Mesh(ge, m); me.rotation.x = -Math.PI / 2; me.position.y = y; me.castShadow = true; me.receiveShadow = true; g.add(me); return me; }
    var rim = new T.Shape(); rim.curves = sh.curves.slice(); rim.holes.push(new T.Path(sh.getPoints(60).map(function (p) { return new T.Vector2(p.x * 0.955, 0.03 + p.y * 0.955); })));
    slab(rim, 0.34, M.gloss, 0.62); slab(sh, 0.03, M.gloss, 0.62);                                       // the rim, the bottom
    var inner = new T.Shape(sh.getPoints(60).map(function (p) { return new T.Vector2(p.x * 0.95, 0.035 + p.y * 0.95); }));
    slab(inner, 0.01, M.sound, 0.66);                                                                   // the soundboard
    var pl = new T.Shape(sh.getPoints(60).map(function (p) { return new T.Vector2(p.x * 0.88, 0.08 + p.y * 0.86); }));
    slab(pl, 0.02, M.plate, 0.86);                                                                      // the gold iron plate
    for (var si = 0; si < 44; si++) { var sx = -0.62 + si * 0.028, len = 0.5 + 1.25 * (1 - si / 44) * (1 - si / 44) + 0.25; var st = new T.Mesh(new T.BoxGeometry(0.003, 0.003, len), M.wire); st.position.set(sx, 0.885, -0.12 - len / 2); g.add(st); }
    [0.3, 0.65, 1.0].forEach(function (zz) { var hole = new T.Mesh(new T.CylinderGeometry(0.05, 0.05, 0.022, 20), M.dark); hole.position.set(0.1 - zz * 0.2, 0.882, -zz); g.add(hole); });
    /* the lid, hinged on the straight side, up on its stick */
    var lidG = new T.Group(); lidG.position.set(-0.74, 0.965, 0); lidG.rotation.z = 0.62; g.add(lidG);
    var lid = new T.Mesh(new T.ExtrudeGeometry(sh, { depth: 0.022, bevelEnabled: false, curveSegments: 40 }), M.gloss); lid.rotation.x = -Math.PI / 2; lid.position.x = 0.74; lidG.add(lid);
    limb(T, g, M.gloss, [0.5, 0.96, -0.85], [0.42, 1.78, -0.85], 0.012, 0.01);
    /* the keyboard */
    box(T, g, M.gloss, 0, 0.66, 0.15, 1.48, 0.08, 0.3);                                                 // the keybed
    [-1, 1].forEach(function (s) { box(T, g, M.gloss, s * 0.7, 0.74, 0.15, 0.08, 0.1, 0.3); });          // the cheeks
    box(T, g, M.ivory, 0, 0.712, 0.17, 1.3, 0.018, 0.24);
    for (var w = 1; w < 52; w++) box(T, g, M.dark, -0.65 + w * 1.3 / 52, 0.722, 0.17, 0.0015, 0.003, 0.235);
    var pat = [1, 1, 0, 1, 1, 1, 0], wk = 1.3 / 52;
    for (var k = 0; k < 51; k++) if (pat[(k + 5) % 7]) box(T, g, M.ebony, -0.65 + (k + 1) * wk, 0.73, 0.125, wk * 0.55, 0.022, 0.15);
    box(T, g, M.gloss, 0, 0.7, 0.305, 1.4, 0.05, 0.012);                                                // the key slip
    box(T, g, M.felt, 0, 0.724, 0.045, 1.3, 0.01, 0.012);
    var fb = box(T, g, M.gloss, 0, 0.8, 0.03, 1.32, 0.13, 0.02); fb.rotation.x = -0.3;                  // the fallboard, open
    var desk = new T.Group(); desk.position.set(0, 0.97, -0.08); desk.rotation.x = -0.28; g.add(desk);
    box(T, desk, M.gloss, 0, 0.15, 0, 0.82, 0.3, 0.02); box(T, desk, M.gloss, 0, 0.0, 0.03, 0.82, 0.02, 0.06);
    box(T, desk, M.paper, -0.12, 0.15, 0.013, 0.21, 0.28, 0.003); box(T, desk, M.paper, 0.1, 0.15, 0.013, 0.21, 0.28, 0.003);
    for (var ln = 0; ln < 9; ln++) [-0.12, 0.1].forEach(function (px) { box(T, desk, M.dark, px, 0.27 - ln * 0.027, 0.016, 0.18, 0.0015, 0.001); });
    /* legs, castors, the lyre and pedals */
    [[-0.62, 0.12], [0.62, 0.12], [-0.42, -1.66]].forEach(function (q) {
      var lg = lathe(T, [[0, 0], [0.04, 0], [0.05, 0.06], [0.035, 0.12], [0.05, 0.3], [0.042, 0.48], [0.06, 0.55], [0.06, 0.62], [0, 0.62]], M.gloss, 20); lg.position.set(q[0], 0, q[1]); lg.castShadow = true; g.add(lg);
      var cs = new T.Mesh(new T.CylinderGeometry(0.03, 0.03, 0.025, 14), E.brass); cs.rotation.z = Math.PI / 2; cs.position.set(q[0], 0.02, q[1]); g.add(cs); });
    box(T, g, M.gloss, 0, 0.62, -0.32, 0.36, 0.04, 0.12);
    [-1, 1].forEach(function (s) { limb(T, g, M.gloss, [s * 0.12, 0.6, -0.32], [s * 0.06, 0.12, -0.32], 0.018, 0.018); });
    box(T, g, M.gloss, 0, 0.1, -0.3, 0.26, 0.06, 0.12);
    [-0.06, 0, 0.06].forEach(function (px) { var pd = box(T, g, E.brass, px, 0.1, -0.2, 0.026, 0.012, 0.11); pd.rotation.x = 0.15; });
    /* the bench */
    var bench = new T.Group(); bench.position.set(0, 0, 0.82); g.add(bench);
    box(T, bench, M.gloss, 0, 0.44, 0, 0.8, 0.07, 0.36); box(T, bench, E.leather, 0, 0.5, 0, 0.76, 0.05, 0.33);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (q) { var bl = lathe(T, [[0, 0], [0.025, 0], [0.032, 0.05], [0.022, 0.2], [0.03, 0.38], [0.03, 0.42], [0, 0.42]], M.gloss, 14); bl.position.set(q[0] * 0.34, 0, q[1] * 0.14); g.add(bl); bench.add(bl); });
    return { group: root0, hb: [1.56, 1.85, 2.9], place: 'floor' };
  };

  /* 2 · the Thinker, a white marble replica about 76 cm high, on a veined marble pedestal */
  F['vic-thinker'] = function (T) {
    var M = dmats(T), g = new T.Group(), H = 1.0, i;
    box(T, g, M.marble, 0, 0.05, 0, 0.6, 0.1, 0.6); box(T, g, M.marble, 0, 0.13, 0, 0.54, 0.06, 0.54);
    box(T, g, M.marble, 0, 0.55, 0, 0.44, 0.78, 0.44);
    [-1, 1].forEach(function (s) { box(T, g, M.statue, s * 0.221, 0.55, 0, 0.004, 0.62, 0.32); box(T, g, M.statue, 0, 0.55, s * 0.221, 0.32, 0.62, 0.004); });
    box(T, g, M.marble, 0, 0.96, 0, 0.54, 0.05, 0.54); box(T, g, M.marble, 0, 0.99, 0, 0.58, 0.03, 0.58);
    var s = new T.Group(); s.position.y = H; s.scale.setScalar(1.8); g.add(s);                      // 1.8×: about 76 cm, readable across the room
    box(T, s, M.statue, 0, 0.015, 0.02, 0.2, 0.03, 0.26);                                             // its own base
    var rock = new T.Mesh(new T.DodecahedronGeometry(0.075, 1), M.statue); rock.scale.set(1.15, 1.0, 1.3); rock.position.set(0, 0.095, -0.02); rock.castShadow = true; s.add(rock);
    var J = { hipL: [-0.035, 0.16, 0], hipR: [0.035, 0.16, 0], kneeL: [-0.045, 0.17, 0.12], kneeR: [0.045, 0.165, 0.11], ftL: [-0.05, 0.04, 0.13], ftR: [0.05, 0.04, 0.1],
      shL: [-0.062, 0.29, 0.055], shR: [0.062, 0.29, 0.055], elR: [-0.025, 0.19, 0.115], hdR: [0.0, 0.305, 0.13], elL: [-0.085, 0.215, 0.085], hdL: [-0.058, 0.18, 0.155] };
    limb(T, s, M.statue, J.hipL, J.kneeL, 0.026, 0.02, true); limb(T, s, M.statue, J.hipR, J.kneeR, 0.026, 0.02, true);
    limb(T, s, M.statue, J.kneeL, J.ftL, 0.019, 0.013, true); limb(T, s, M.statue, J.kneeR, J.ftR, 0.019, 0.013, true);
    [J.ftL, J.ftR].forEach(function (f) { var ft = new T.Mesh(new T.BoxGeometry(0.026, 0.016, 0.06), M.statue); ft.position.set(f[0], f[1] - 0.006, f[2] + 0.02); s.add(ft); });
    var torso = ball(T, s, M.statue, [0, 0.235, 0.035], 0.07, [0.95, 1.2, 0.68]); torso.rotation.x = 0.45;
    ball(T, s, M.statue, [0, 0.17, 0.01], 0.055, [1.1, 0.7, 0.9]);
    limb(T, s, M.statue, J.shL, J.shR, 0.024, 0.024, true);
    limb(T, s, M.statue, J.shR, J.elR, 0.017, 0.014, true); limb(T, s, M.statue, J.elR, J.hdR, 0.014, 0.012, true);
    limb(T, s, M.statue, J.shL, J.elL, 0.017, 0.014, true); limb(T, s, M.statue, J.elL, J.hdL, 0.014, 0.012, true);
    ball(T, s, M.statue, [J.hdR[0], J.hdR[1] - 0.004, J.hdR[2] + 0.004], 0.016, [1, 1.2, 0.8]); ball(T, s, M.statue, J.hdL, 0.015, [1, 0.8, 1.2]);
    limb(T, s, M.statue, [0, 0.3, 0.07], [0, 0.322, 0.1], 0.016, 0.015);
    var head = ball(T, s, M.statue, [0, 0.345, 0.122], 0.031, [0.92, 1.08, 1.0]); head.rotation.x = 0.5;
    ball(T, s, M.statue, [0, 0.36, 0.11], 0.031, [0.95, 0.8, 0.95]);                                    // the hair's cap
    return { group: g, hb: [0.62, 1.8, 0.62], place: 'floor' };
  };

  /* 3 · a 15th-century Gothic armour: sallet and bevor, fluted breastplate, fauld and tassets, pauldrons with couters,
     gauntlets, cuisses, poleyns with fans, greaves, pointed sabatons — bright steel, on a walnut stand */
  F['vic-armour'] = function (T) {
    var M = dmats(T), E = emats(T), g = new T.Group(), i;
    box(T, g, E.woodD, 0, 0.03, 0, 0.6, 0.06, 0.46); box(T, g, E.brass, 0, 0.061, 0.231, 0.6, 0.006, 0.004);
    [-1, 1].forEach(function (s) {
      var x = s * 0.1;
      var sab = new T.Mesh(new T.ConeGeometry(0.045, 0.32, 12), M.steel); sab.rotation.x = Math.PI / 2; sab.scale.set(1, 1, 0.55); sab.position.set(x, 0.09, 0.1); g.add(sab);
      for (i = 0; i < 4; i++) { var lm = new T.Mesh(new T.CylinderGeometry(0.048 - i * 0.006, 0.05 - i * 0.006, 0.02, 14, 1, false, -Math.PI / 2, Math.PI), M.steelD); lm.rotation.x = Math.PI / 2 - 0.2; lm.position.set(x, 0.1, 0.0 + i * 0.05); g.add(lm); }
      limb(T, g, M.steel, [x, 0.14, 0], [x, 0.52, 0.0], 0.046, 0.058);                                  // greave
      ball(T, g, M.steel, [x, 0.56, 0.025], 0.068, [1, 1, 0.9]);                                         // poleyn
      var fan = new T.Mesh(new T.CylinderGeometry(0.075, 0.075, 0.008, 18, 1, false, 0, Math.PI), M.steel); fan.rotation.z = Math.PI / 2; fan.rotation.y = s > 0 ? 0 : Math.PI; fan.position.set(x + s * 0.06, 0.56, 0.0); g.add(fan);
      limb(T, g, M.steel, [x, 0.6, 0.0], [x * 1.05, 0.93, 0.0], 0.062, 0.078);                           // cuisse
      for (i = 0; i < 3; i++) { var ts = new T.Mesh(new T.CylinderGeometry(0.1, 0.11, 0.05, 16, 1, true, -0.9, 1.8), M.steel); ts.position.set(x * 0.9, 0.97 - i * 0.045, 0.02); ts.material = M.steel; ts.rotation.y = 0; g.add(ts); }   // tassets
      /* the arm */
      var sh = [s * 0.21, 1.42, 0], el = [s * 0.27, 1.13, 0.06], wr = [s * 0.235, 0.9, 0.14];
      ball(T, g, M.steel, [s * 0.2, 1.43, 0], 0.105, [1, 0.85, 1.05]);                                  // pauldron
      ball(T, g, M.steelD, [s * 0.215, 1.38, 0], 0.09, [1, 0.6, 1.0]);
      limb(T, g, M.steel, sh, el, 0.045, 0.04); ball(T, g, M.steel, el, 0.05);
      var cf = new T.Mesh(new T.CylinderGeometry(0.065, 0.065, 0.008, 18, 1, false, 0, Math.PI), M.steel); cf.rotation.z = Math.PI / 2; cf.position.set(el[0] + s * 0.04, el[1], el[2]); g.add(cf);
      limb(T, g, M.steel, el, wr, 0.04, 0.034);
      var cuff = new T.Mesh(new T.CylinderGeometry(0.045, 0.06, 0.07, 14, 1, true), M.steel); cuff.position.set(wr[0], wr[1] - 0.02, wr[2]); g.add(cuff);
      var gnt = box(T, g, M.steel, wr[0], wr[1] - 0.1, wr[2] + 0.01, 0.06, 0.11, 0.04); gnt.rotation.x = 0.15;
      for (i = 0; i < 4; i++) box(T, g, M.steelD, wr[0] + (i - 1.5) * 0.014, wr[1] - 0.17, wr[2] + 0.02, 0.012, 0.05, 0.03);
    });
    /* the body */
    for (i = 0; i < 3; i++) { var fa = new T.Mesh(new T.CylinderGeometry(0.175 + i * 0.01, 0.185 + i * 0.01, 0.045, 24, 1, true), M.steel); fa.material.side = T.DoubleSide; fa.position.set(0, 1.08 - i * 0.04, 0.0); fa.scale.z = 0.75; g.add(fa); }
    var br = ball(T, g, M.steel, [0, 1.27, 0.0], 0.2, [0.95, 1.12, 0.72]);                              // breast and back
    var plack = ball(T, g, M.steel, [0, 1.17, 0.045], 0.15, [1.0, 0.75, 0.72]);
    for (i = -3; i <= 3; i++) { var fl = new T.Mesh(new T.TorusGeometry(0.2, 0.004, 4, 24, 1.4), M.steelD); fl.rotation.set(0, Math.PI / 2, Math.PI / 2 - 0.7); fl.scale.set(1.12, 1, 0.72); fl.position.set(i * 0.035, 1.27, 0.0); g.add(fl); }
    box(T, g, M.steelD, 0, 1.3, 0.143, 0.012, 0.3, 0.012);                                            // the medial ridge
    var gor = new T.Mesh(new T.TorusGeometry(0.075, 0.03, 10, 24), M.steel); gor.rotation.x = Math.PI / 2; gor.position.y = 1.49; g.add(gor);
    /* the sallet with its long tail, the bevor, the sight */
    var hel = new T.Mesh(new T.SphereGeometry(0.12, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.55), M.steel); hel.scale.set(0.95, 1.05, 1.15); hel.position.set(0, 1.6, -0.01); g.add(hel);
    var tail = new T.Mesh(new T.CylinderGeometry(0.11, 0.15, 0.09, 24, 1, true, Math.PI * 0.6, Math.PI * 0.8), M.steel); tail.material.side = T.DoubleSide; tail.position.set(0, 1.56, -0.02); g.add(tail);
    box(T, g, M.steelD, 0, 1.74, -0.02, 0.012, 0.03, 0.24);                                           // the comb
    var bev = new T.Mesh(new T.SphereGeometry(0.1, 20, 12, -Math.PI * 0.45, Math.PI * 0.9, Math.PI * 0.45, Math.PI * 0.4), M.steel); bev.position.set(0, 1.56, 0.03); bev.scale.set(1, 1, 1.1); g.add(bev);
    box(T, g, M.dark, 0, 1.62, 0.13, 0.15, 0.014, 0.02);                                              // the sight
    return { group: g, hb: [0.66, 1.8, 0.5], place: 'floor' };
  };

  /* 4 · a library floor globe: an old map on the ball, a brass meridian at 23.5°, a carved mahogany horizon ring on four
     turned legs joined by a cross stretcher with a compass */
  F['vic-globe'] = function (T) {
    var E = emats(T), g = new T.Group(), Y = 0.74, i;
    var c = document.createElement('canvas'); c.width = 1024; c.height = 512; var x = c.getContext('2d');
    x.fillStyle = '#c9c8a0'; x.fillRect(0, 0, 1024, 512);
    function P(lon, lat) { return [(lon + 180) / 360 * 1024, (90 - lat) / 180 * 512]; }
    var land = [[[-168, 66], [-140, 70], [-95, 72], [-75, 62], [-60, 50], [-80, 25], [-97, 18], [-105, 22], [-117, 32], [-125, 48], [-140, 60]],
      [[-80, 10], [-60, 8], [-35, -7], [-40, -22], [-58, -38], [-70, -55], [-75, -40], [-70, -15], [-81, -5]],
      [[-17, 15], [-5, 35], [10, 37], [32, 31], [43, 12], [51, 11], [40, -15], [32, -29], [20, -35], [12, -18], [9, 4], [-8, 5]],
      [[-10, 36], [-9, 44], [0, 50], [5, 58], [20, 70], [60, 70], [100, 77], [140, 72], [170, 66], [160, 58], [140, 50], [130, 35], [120, 22], [105, 10], [100, 2], [95, 15], [80, 8], [72, 20], [57, 25], [50, 30], [35, 36], [28, 41], [15, 38]],
      [[114, -22], [130, -12], [142, -11], [153, -27], [146, -39], [135, -34], [115, -34]], [[-55, 60], [-20, 70], [-30, 83], [-60, 80]]];
    land.forEach(function (poly) { x.beginPath(); poly.forEach(function (q, k) { var p = P(q[0], q[1]); if (k) x.lineTo(p[0], p[1]); else x.moveTo(p[0], p[1]); }); x.closePath();
      x.fillStyle = '#d8bf86'; x.fill(); x.strokeStyle = '#8a6a3a'; x.lineWidth = 2; x.stroke(); });
    x.fillStyle = '#e2d6b0'; x.fillRect(0, 470, 1024, 42);
    x.strokeStyle = 'rgba(110,80,40,.35)'; x.lineWidth = 1; for (i = 1; i < 12; i++) { x.beginPath(); x.moveTo(i * 1024 / 12, 0); x.lineTo(i * 1024 / 12, 512); x.stroke(); } for (i = 1; i < 6; i++) { x.beginPath(); x.moveTo(0, i * 512 / 6); x.lineTo(1024, i * 512 / 6); x.stroke(); }
    x.fillStyle = 'rgba(90,60,30,.85)'; x.font = 'italic 22px Georgia, serif'; x.fillText('TERRESTRIAL GLOBE', 380, 300); x.font = 'italic 14px Georgia, serif'; x.fillText('Atlantic Ocean', 300, 230); x.fillText('Pacific Ocean', 60, 270); x.fillText('Indian Ocean', 700, 330);
    var t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; t.anisotropy = 4;
    var tilt = new T.Group(); tilt.position.y = Y; tilt.rotation.z = 0.41; g.add(tilt);
    var sph = new T.Mesh(new T.SphereGeometry(0.27, 40, 28), new T.MeshStandardMaterial({ map: t, roughness: 0.4, metalness: 0 })); sph.rotation.y = 1.6; sph.castShadow = true; tilt.add(sph);
    var mer = new T.Mesh(new T.TorusGeometry(0.285, 0.01, 8, 64), E.brass); mer.rotation.y = Math.PI / 2; tilt.add(mer);
    [-1, 1].forEach(function (s) { var pin = new T.Mesh(new T.CylinderGeometry(0.008, 0.008, 0.04, 8), E.brass); pin.position.y = s * 0.29; tilt.add(pin); });
    var ring = lathe(T, [[0.3, 0], [0.42, 0], [0.43, 0.015], [0.42, 0.035], [0.3, 0.035]], E.wood, 48); ring.position.y = Y - 0.02; g.add(ring);
    var paper = new T.Mesh(new T.RingGeometry(0.31, 0.41, 48), new T.MeshStandardMaterial({ color: new T.Color(0xe8dcb8).convertSRGBToLinear(), roughness: 0.7 })); paper.rotation.x = -Math.PI / 2; paper.position.y = Y + 0.016; g.add(paper);
    for (i = 0; i < 72; i++) { var tk = new T.Mesh(new T.BoxGeometry(0.002, 0.001, i % 6 ? 0.02 : 0.05), E.groove); var a = i / 72 * Math.PI * 2; tk.position.set(Math.cos(a) * 0.395, Y + 0.017, Math.sin(a) * 0.395); tk.rotation.y = -a + Math.PI / 2; g.add(tk); }
    for (i = 0; i < 4; i++) {
      var a2 = Math.PI / 4 + i * Math.PI / 2, lx = Math.cos(a2) * 0.37, lz = Math.sin(a2) * 0.37;
      var lg = lathe(T, [[0, 0], [0.04, 0], [0.045, 0.05], [0.025, 0.12], [0.04, 0.28], [0.022, 0.46], [0.035, 0.6], [0.035, 0.72], [0, 0.72]], E.wood, 16); lg.position.set(lx, 0, lz); lg.castShadow = true; g.add(lg);
      var str = new T.Mesh(new T.BoxGeometry(0.37, 0.04, 0.04), E.woodD); str.position.set(lx / 2, 0.16, lz / 2); str.rotation.y = -a2; g.add(str);
    }
    var hub = lathe(T, [[0, 0.13], [0.09, 0.13], [0.1, 0.16], [0.09, 0.19], [0, 0.19]], E.wood, 24); g.add(hub);
    var cm = new T.Mesh(new T.CylinderGeometry(0.05, 0.05, 0.01, 24), E.brass); cm.position.y = 0.195; g.add(cm);
    var col = lathe(T, [[0, 0.19], [0.05, 0.19], [0.03, 0.3], [0.045, 0.42], [0.025, 0.5], [0, 0.5]], E.woodD, 18); g.add(col);
    return { group: g, hb: [0.9, 1.04, 0.9], place: 'floor', tick: function (T0) { sph.rotation.y = 1.6 + T0 * 0.03; } };
  };

  /* 5 · a longcase clock, after an English 19th-century tall case: ogee bracket feet, a panelled plinth with gilt scrolls,
     a trunk with quarter columns and a glazed arched door under Gothic fretwork (lit softly inside, so the brass shows),
     a lyre pendulum and three polished weights on chains, a hood with turned columns, an engraved brass dial with a silver
     chapter ring, a seconds dial and the real moon in the arch, a broken-arch crest with three flame finials.
     It keeps real time: the hands follow the device clock (the seconds hand steps once a second), and the seconds
     pendulum swings in step with it — one beat a second, a full swing every two. */
  F['vic-clock'] = function (T) {
    var E = emats(T), M = dmats(T), g = new T.Group(), i, W = 0.56, D = 0.3;
    var L = function (h) { return new T.Color(h).convertSRGBToLinear(); };
    var brassP = new T.MeshStandardMaterial({ color: L(0xe8bf62), roughness: 0.14, metalness: 1.0, envMapIntensity: 1.5 });
    var blued = new T.MeshStandardMaterial({ color: L(0x1b2440), roughness: 0.25, metalness: 0.8 });
    /* the base */
    [-1, 1].forEach(function (sx) { [-1, 1].forEach(function (sz) {
      var ft = lathe(T, [[0, 0], [0.05, 0], [0.058, 0.02], [0.045, 0.05], [0.06, 0.08], [0, 0.08]], E.woodD, 16); ft.position.set(sx * (W / 2 - 0.03), 0, sz * (D / 2 - 0.02)); g.add(ft); }); });
    box(T, g, E.woodD, 0, 0.1, 0, W + 0.06, 0.04, D + 0.06);
    box(T, g, E.wood, 0, 0.4, 0, W, 0.56, D);
    rpanel(T, g, E, 'z', D / 2, 1, 0, 0.4, W - 0.12, 0.42);
    [-1, 1].forEach(function (s) { var sc = new T.Mesh(new T.TorusGeometry(0.05, 0.007, 6, 16, Math.PI * 1.4), brassP); sc.position.set(s * 0.09, 0.4, D / 2 + 0.03); sc.rotation.z = s > 0 ? 0.6 : Math.PI - 0.6 - Math.PI * 0.4; g.add(sc); });
    ball(T, g, brassP, [0, 0.4, D / 2 + 0.03], 0.018, [1, 1, 0.5]);
    box(T, g, E.woodD, 0, 0.7, 0, W + 0.05, 0.035, D + 0.05); box(T, g, E.woodL, 0, 0.725, 0, W + 0.02, 0.02, D + 0.02);
    /* the trunk: carcase, quarter columns, the arched glazed door with its fretwork, the lit back */
    var TY0 = 0.74, TY1 = 1.66, TH = TY1 - TY0, TC = (TY0 + TY1) / 2, TW = W - 0.08, FZ = (D - 0.04) / 2;
    box(T, g, E.wood, -TW / 2 + 0.03, TC, 0, 0.06, TH, D - 0.04); box(T, g, E.wood, TW / 2 - 0.03, TC, 0, 0.06, TH, D - 0.04);
    box(T, g, E.wood, 0, TC, -FZ + 0.01, TW, TH, 0.02);
    [-1, 1].forEach(function (s) {
      var col = lathe(T, [[0, 0], [0.022, 0], [0.022, 0.03], [0.016, 0.05], [0.016, TH - 0.05], [0.022, TH - 0.03], [0.022, TH], [0, TH]], E.woodL, 16); col.position.set(s * (TW / 2 + 0.005), TY0, FZ + 0.005); g.add(col);
      ball(T, g, brassP, [s * (TW / 2 + 0.005), TY1 - 0.015, FZ + 0.005], 0.02, [1, 0.6, 1]); ball(T, g, brassP, [s * (TW / 2 + 0.005), TY0 + 0.015, FZ + 0.005], 0.02, [1, 0.6, 1]);
    });
    var OW = TW - 0.14, OH = TH - 0.16, OR = OW / 2;
    function archShape(sh, w, h, r) { sh.moveTo(-w / 2, 0); sh.lineTo(w / 2, 0); sh.lineTo(w / 2, h - r); sh.absarc(0, h - r, r, 0, Math.PI, false); sh.lineTo(-w / 2, 0); return sh; }
    var dr = new T.Shape(); dr.moveTo(-TW / 2 + 0.02, 0); dr.lineTo(TW / 2 - 0.02, 0); dr.lineTo(TW / 2 - 0.02, TH); dr.lineTo(-TW / 2 + 0.02, TH); dr.lineTo(-TW / 2 + 0.02, 0);
    dr.holes.push(archShape(new T.Path(), OW, OH, OR));
    var door = new T.Mesh(new T.ExtrudeGeometry(dr, { depth: 0.025, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.006, bevelSegments: 2, curveSegments: 20 }), E.wood); door.position.set(0, TY0 + 0.0, FZ - 0.01); door.geometry.translate(0, 0, 0); g.add(door);
    door.position.y = TY0; door.geometry.translate(0, 0, 0);
    var bead = new T.Shape(); archShape(bead, OW + 0.02, OH + 0.01, OR + 0.01); bead.holes.push(archShape(new T.Path(), OW, OH, OR));
    var bm = new T.Mesh(new T.ExtrudeGeometry(bead, { depth: 0.008, bevelEnabled: false, curveSegments: 20 }), brassP); bm.position.set(0, TY0 + 0.08 - 0.005, FZ + 0.02); g.add(bm);
    var glass = new T.Mesh(new T.ShapeGeometry(archShape(new T.Shape(), OW, OH, OR), 20), M.glass); glass.position.set(0, TY0 + 0.08, FZ + 0.004); g.add(glass);
    /* Gothic fretwork over the top of the glass: a pointed arch, two lancets, a quatrefoil */
    var fy = TY0 + 0.08 + OH - OR;
    [-1, 1].forEach(function (s) { var a = new T.Mesh(new T.TorusGeometry(OR * 0.92, 0.006, 6, 20, Math.PI / 2), E.woodL); a.position.set(-s * OR * 0.3, fy - 0.02, FZ + 0.008); a.rotation.z = s > 0 ? 0 : Math.PI / 2; g.add(a); });
    [-1, 1].forEach(function (s) { var a = new T.Mesh(new T.TorusGeometry(OR * 0.45, 0.005, 6, 16, Math.PI), E.woodL); a.position.set(s * OR * 0.48, fy - 0.12, FZ + 0.008); g.add(a);
      box(T, g, E.woodL, s * OR * 0.48 + OR * 0.45, fy - 0.2, FZ + 0.008, 0.01, 0.16, 0.008); box(T, g, E.woodL, s * OR * 0.48 - OR * 0.45, fy - 0.2, FZ + 0.008, 0.01, 0.16, 0.008); });
    for (i = 0; i < 4; i++) { var q = new T.Mesh(new T.TorusGeometry(0.022, 0.004, 6, 16), E.woodL); var qa = i * Math.PI / 2; q.position.set(Math.cos(qa) * 0.024, fy + 0.05 + Math.sin(qa) * 0.024, FZ + 0.008); g.add(q); }
    box(T, g, E.woodL, 0, fy - 0.2, FZ + 0.008, 0.01, 0.2, 0.008);
    var keyh = box(T, g, brassP, TW / 2 - 0.05, TC, FZ + 0.03, 0.02, 0.035, 0.004);
    var backC = document.createElement('canvas'); backC.width = 64; backC.height = 256; var bx = backC.getContext('2d'), bgr = bx.createLinearGradient(0, 0, 0, 256);
    bgr.addColorStop(0, '#6a3a20'); bgr.addColorStop(0.45, '#8a5230'); bgr.addColorStop(1, '#3a1e10'); bx.fillStyle = bgr; bx.fillRect(0, 0, 64, 256);
    var bt = new T.CanvasTexture(backC); bt.encoding = T.sRGBEncoding;
    var back = new T.Mesh(new T.PlaneGeometry(TW - 0.12, TH - 0.04), new T.MeshStandardMaterial({ map: bt, roughness: 0.55 })); back.position.set(0, TC, -FZ + 0.025); g.add(back);
    var inL = new T.PointLight(0xffd9a0, 0.45, 1.1, 2); inL.position.set(0, TY1 - 0.12, 0.02); g.add(inL);
    /* the weights and their chains, the pendulum */
    [-0.085, 0, 0.085].forEach(function (wx, k) {
      var wy = TY1 - 0.32 - k * 0.07;
      limb(T, g, brassP, [wx, wy, -0.05], [wx, wy - 0.24, -0.05], 0.026, 0.026);
      [0, -0.24].forEach(function (dy) { var cap = new T.Mesh(new T.TorusGeometry(0.026, 0.004, 6, 18), brassP); cap.rotation.x = Math.PI / 2; cap.position.set(wx, wy + dy, -0.05); g.add(cap); });
      var hook = new T.Mesh(new T.TorusGeometry(0.008, 0.002, 4, 10), brassP); hook.position.set(wx, wy + 0.012, -0.05); g.add(hook);
      for (var c = wy + 0.02; c < TY1 + 0.02; c += 0.018) { var ln = new T.Mesh(new T.TorusGeometry(0.0055, 0.0013, 4, 8), M.wire); ln.position.set(wx, c, -0.05); ln.rotation.y = (Math.round(c / 0.018) % 2) * Math.PI / 2; ln.scale.y = 1.5; g.add(ln); }
    });
    var pend = new T.Group(); pend.position.set(0, TY1 + 0.05, 0.03); g.add(pend);
    box(T, pend, brassP, 0, -0.33, 0, 0.012, 0.66, 0.003);
    [-1, 1].forEach(function (s) { var ly = new T.Mesh(new T.TorusGeometry(0.06, 0.004, 6, 20, Math.PI * 0.9), brassP); ly.position.set(s * 0.03, -0.42, 0); ly.rotation.z = s > 0 ? -0.15 : Math.PI + 0.15 - Math.PI * 0.9 + Math.PI * 0.9; ly.scale.y = 1.8; g.add(ly); pend.add(ly); });
    var bob = new T.Mesh(new T.CylinderGeometry(0.085, 0.085, 0.02, 40), brassP); bob.rotation.x = Math.PI / 2; bob.position.y = -0.7; pend.add(bob);
    [0.085, 0.06, 0.035].forEach(function (r) { var rg = new T.Mesh(new T.TorusGeometry(r, 0.0025, 6, 40), E.brass); rg.position.set(0, -0.7, 0.011); pend.add(rg); });
    ball(T, pend, brassP, [0, -0.7, 0.012], 0.012, [1, 1, 0.4]);
    /* the hood */
    var HY0 = 1.7, HY1 = 2.26, HC = (HY0 + HY1) / 2;
    box(T, g, E.woodD, 0, 1.685, 0, W + 0.06, 0.04, D + 0.06);
    box(T, g, E.wood, 0, HC, -0.01, W + 0.02, HY1 - HY0, D);
    [-1, 1].forEach(function (s) {
      var c2 = lathe(T, [[0, 0], [0.02, 0], [0.02, 0.025], [0.014, 0.04], [0.016, 0.2], [0.012, 0.42], [0.02, 0.44], [0.02, 0.48], [0, 0.48]], E.woodL, 16); c2.position.set(s * (W / 2 + 0.005), HY0 + 0.02, D / 2 + 0.01); g.add(c2);
      ball(T, g, brassP, [s * (W / 2 + 0.005), HY0 + 0.5, D / 2 + 0.01], 0.022, [1, 0.7, 1]); ball(T, g, brassP, [s * (W / 2 + 0.005), HY0 + 0.04, D / 2 + 0.01], 0.02, [1, 0.7, 1]);
    });
    /* the dial: a gilt plate with an engraved centre, a silver chapter ring, gilt spandrels, a seconds dial, the moon */
    var DW = 0.4, DH = 0.5, dc = document.createElement('canvas'); dc.width = 800; dc.height = 1000; var x = dc.getContext('2d');
    var CX = 400, CY = 600, RR = 330;
    function plate() {
      var gr = x.createLinearGradient(0, 0, 800, 1000); gr.addColorStop(0, '#f0cf7a'); gr.addColorStop(0.5, '#c79a40'); gr.addColorStop(1, '#e9c56c'); x.fillStyle = gr; x.fillRect(0, 0, 800, 1000);
      x.strokeStyle = 'rgba(120,80,20,.25)'; x.lineWidth = 1; for (var r = 20; r < 240; r += 6) { x.beginPath(); x.arc(CX, CY, r, 0, Math.PI * 2); x.stroke(); }   // the engraved centre
      [[70, 330], [730, 330], [70, 930], [730, 930]].forEach(function (c) {                   // spandrels
        x.fillStyle = '#d6aa4c'; x.strokeStyle = '#8a6420'; x.lineWidth = 2;
        for (var k = 0; k < 5; k++) { x.beginPath(); x.ellipse(c[0] + (k - 2) * 14 * (c[0] < 400 ? 1 : -1), c[1] + (k % 2 ? -14 : 14) * (c[1] < 600 ? 1 : -1), 22 - k * 2, 10, k * 0.6, 0, Math.PI * 2); x.fill(); x.stroke(); }
      });
      x.fillStyle = '#e8e6e0'; x.beginPath(); x.arc(CX, CY, RR, 0, Math.PI * 2); x.arc(CX, CY, RR - 80, 0, Math.PI * 2, true); x.fill();    // the silver ring
      x.strokeStyle = '#2a2420'; x.lineWidth = 2; [RR, RR - 22, RR - 80].forEach(function (r) { x.beginPath(); x.arc(CX, CY, r, 0, Math.PI * 2); x.stroke(); });
      for (var m = 0; m < 60; m++) { var a = m / 60 * Math.PI * 2 - Math.PI / 2, r0 = RR - (m % 5 ? 10 : 22); x.lineWidth = m % 5 ? 2 : 4; x.beginPath(); x.moveTo(CX + Math.cos(a) * RR, CY + Math.sin(a) * RR); x.lineTo(CX + Math.cos(a) * r0, CY + Math.sin(a) * r0); x.stroke(); }
      x.fillStyle = '#1a1612'; x.font = '600 50px Georgia, "Times New Roman", serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
      ['XII', 'I', 'II', 'III', 'IIII', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'].forEach(function (n, k) { var a = k / 12 * Math.PI * 2 - Math.PI / 2; x.save(); x.translate(CX + Math.cos(a) * (RR - 52), CY + Math.sin(a) * (RR - 52)); x.rotate(a + Math.PI / 2); x.fillText(n, 0, 0); x.restore(); });
      x.fillStyle = '#e8e6e0'; x.beginPath(); x.arc(CX, CY - 150, 62, 0, Math.PI * 2); x.fill(); x.stroke();   // the seconds dial
      for (var sm = 0; sm < 60; sm++) { var sa = sm / 60 * Math.PI * 2 - Math.PI / 2; x.lineWidth = sm % 5 ? 1 : 2.5; x.beginPath(); x.moveTo(CX + Math.cos(sa) * 60, CY - 150 + Math.sin(sa) * 60); x.lineTo(CX + Math.cos(sa) * (sm % 5 ? 52 : 46), CY - 150 + Math.sin(sa) * (sm % 5 ? 52 : 46)); x.stroke(); }
      x.font = 'italic 34px Georgia, serif'; x.fillStyle = '#2a2016'; x.fillText('Minest · London', CX, CY + 150);
    }
    function moon() {                                                                                  // the arch: a night sky and the moon as it is tonight
      var syn = 29.530588853, ph = (((Date.now() / 86400000) - 10962.76) % syn + syn) % syn / syn;    // 0 new … 0.5 full
      x.save(); x.beginPath(); x.arc(CX, 230, 205, Math.PI, 0); x.closePath(); x.clip();
      var sk = x.createLinearGradient(0, 30, 0, 230); sk.addColorStop(0, '#0e1a3a'); sk.addColorStop(1, '#27406e'); x.fillStyle = sk; x.fillRect(0, 0, 800, 240);
      x.fillStyle = '#f4ecc0'; for (var k = 0; k < 40; k++) { x.beginPath(); x.arc(220 + ((k * 97) % 360), 60 + ((k * 53) % 150), 1.5 + (k % 3), 0, 6.3); x.fill(); }
      var mx = CX, my = 140, mr = 62;
      x.fillStyle = '#2a3048'; x.beginPath(); x.arc(mx, my, mr, 0, Math.PI * 2); x.fill();
      x.fillStyle = '#f2e8c0'; x.beginPath();
      var k2 = Math.cos(ph * Math.PI * 2);                                                           // the lit part: a half disc and an ellipse
      if (ph < 0.5) { x.arc(mx, my, mr, -Math.PI / 2, Math.PI / 2, false); x.ellipse(mx, my, Math.abs(k2) * mr, mr, 0, Math.PI / 2, -Math.PI / 2, k2 > 0); }
      else { x.arc(mx, my, mr, Math.PI / 2, -Math.PI / 2, false); x.ellipse(mx, my, Math.abs(k2) * mr, mr, 0, -Math.PI / 2, Math.PI / 2, k2 > 0); }
      x.fill(); x.restore();
      x.strokeStyle = '#8a6420'; x.lineWidth = 4; x.beginPath(); x.arc(CX, 230, 205, Math.PI, 0); x.stroke();
    }
    plate(); moon();
    var dt = new T.CanvasTexture(dc); dt.encoding = T.sRGBEncoding; dt.anisotropy = 4;
    var dial = new T.Mesh(new T.PlaneGeometry(DW, DH), new T.MeshStandardMaterial({ map: dt, roughness: 0.3, metalness: 0.35 })); dial.position.set(0, HC, D / 2 - 0.005); g.add(dial);
    var hood = new T.Shape(); hood.moveTo(-W / 2 + 0.005, 0); hood.lineTo(W / 2 - 0.005, 0); hood.lineTo(W / 2 - 0.005, HY1 - HY0); hood.lineTo(-W / 2 + 0.005, HY1 - HY0); hood.lineTo(-W / 2 + 0.005, 0);
    hood.holes.push(archShape(new T.Path(), DW - 0.02, DH - 0.03, (DW - 0.02) / 2));
    var hd = new T.Mesh(new T.ExtrudeGeometry(hood, { depth: 0.02, bevelEnabled: true, bevelThickness: 0.005, bevelSize: 0.005, bevelSegments: 2, curveSegments: 24 }), E.wood); hd.position.set(0, HY0 + 0.015, D / 2 - 0.004); g.add(hd);
    var hb2 = new T.Shape(); archShape(hb2, DW, DH - 0.02, DW / 2); hb2.holes.push(archShape(new T.Path(), DW - 0.02, DH - 0.03, (DW - 0.02) / 2));
    var hbm = new T.Mesh(new T.ExtrudeGeometry(hb2, { depth: 0.006, bevelEnabled: false, curveSegments: 24 }), brassP); hbm.position.set(0, HY0 + 0.015, D / 2 + 0.02); g.add(hbm);
    var hg = new T.Mesh(new T.ShapeGeometry(archShape(new T.Shape(), DW - 0.02, DH - 0.03, (DW - 0.02) / 2), 24), M.glass); hg.position.set(0, HY0 + 0.015, D / 2 + 0.012); g.add(hg);
    /* the hands: blued steel, spade hour hand, a long minute hand, a fine seconds hand */
    var px = function (v) { return v / 800 * DW; }, cX = 0, cY = HC + DH / 2 - px(CY), cZ = D / 2 + 0.002;
    function handShape(len, w, spade) {
      var sh = new T.Shape(); sh.moveTo(-w * 0.6, -len * 0.18); sh.lineTo(w * 0.6, -len * 0.18); sh.lineTo(w * 0.35, len * 0.6);
      if (spade) { sh.bezierCurveTo(w * 2.6, len * 0.66, w * 2.2, len * 0.86, 0, len); sh.bezierCurveTo(-w * 2.2, len * 0.86, -w * 2.6, len * 0.66, -w * 0.35, len * 0.6); }
      else { sh.lineTo(w * 0.2, len * 0.95); sh.lineTo(0, len); sh.lineTo(-w * 0.2, len * 0.95); sh.lineTo(-w * 0.35, len * 0.6); }
      sh.lineTo(-w * 0.6, -len * 0.18); return new T.ShapeGeometry(sh, 12);
    }
    var hh = new T.Mesh(handShape(px(205), px(10), true), blued), mh = new T.Mesh(handShape(px(300), px(7), false), blued);
    hh.position.set(cX, cY, cZ + 0.001); mh.position.set(cX, cY, cZ + 0.0025); g.add(hh); g.add(mh);
    ball(T, g, brassP, [cX, cY, cZ + 0.004], 0.009, [1, 1, 0.5]);
    var sY = cY + px(150), sh2 = new T.Mesh(handShape(px(56), px(3), false), blued); sh2.position.set(cX, sY, cZ + 0.001); g.add(sh2);
    ball(T, g, brassP, [cX, sY, cZ + 0.002], 0.004, [1, 1, 0.5]);
    /* the crest: a broken arch of two scrolls, pierced fretwork, three flame finials */
    box(T, g, E.woodD, 0, HY1 + 0.02, -0.01, W + 0.1, 0.05, D + 0.06); box(T, g, E.woodL, 0, HY1 + 0.05, -0.01, W + 0.06, 0.015, D + 0.03);
    var fret = new T.Shape(); fret.moveTo(-W / 2, 0); fret.lineTo(W / 2, 0); fret.lineTo(W / 2, 0.06); fret.bezierCurveTo(W / 2 - 0.05, 0.16, 0.08, 0.2, 0.05, 0.14); fret.lineTo(-0.05, 0.14); fret.bezierCurveTo(-0.08, 0.2, -W / 2 + 0.05, 0.16, -W / 2, 0.06); fret.lineTo(-W / 2, 0);
    for (i = -2; i <= 2; i++) if (i) { var hl = new T.Path(); hl.absellipse(i * 0.09, 0.055, 0.025, 0.03, 0, Math.PI * 2, false); fret.holes.push(hl); }
    var fm = new T.Mesh(new T.ExtrudeGeometry(fret, { depth: 0.02, bevelEnabled: false, curveSegments: 16 }), E.wood); fm.position.set(0, HY1 + 0.058, D / 2 - 0.03); g.add(fm);
    [-1, 1].forEach(function (s) { var sc = new T.Mesh(new T.TorusGeometry(0.035, 0.012, 8, 16, Math.PI * 1.5), E.woodL); sc.position.set(s * 0.085, HY1 + 0.19, D / 2 - 0.02); sc.rotation.z = s > 0 ? -0.4 : Math.PI + 0.4 - Math.PI * 0.5; g.add(sc); });
    [[-W / 2 + 0.02, 0], [0, 0.11], [W / 2 - 0.02, 0]].forEach(function (q) {
      var fin = lathe(T, [[0, 0], [0.026, 0], [0.03, 0.02], [0.016, 0.035], [0.028, 0.06], [0.03, 0.08], [0.014, 0.1], [0.02, 0.12], [0.006, 0.17], [0, 0.18]], brassP, 18); fin.position.set(q[0], HY1 + 0.058 + q[1], 0.05); g.add(fin); });
    var lastMoon = Date.now();
    return { group: g, hb: [0.66, 2.55, 0.42], place: 'floor', tick: function () {
      var now = Date.now(), d = new Date(now), sec = d.getSeconds(), ms = d.getMilliseconds(), t = now / 1000;
      pend.rotation.z = 0.075 * Math.cos(Math.PI * t);                                                // one beat a second: at each end of its swing the seconds hand steps
      var snap = ms < 90 ? 1 - Math.pow(1 - ms / 90, 2) : 1;                                          // the escapement lets the seconds hand go
      sh2.rotation.z = -((sec - 1 + snap) / 60) * Math.PI * 2;
      var m = d.getMinutes() + (sec + ms / 1000) / 60, h = (d.getHours() % 12) + m / 60;
      mh.rotation.z = -m / 60 * Math.PI * 2; hh.rotation.z = -h / 12 * Math.PI * 2;
      if (now - lastMoon > 3600000) { lastMoon = now; plate(); moon(); dt.needsUpdate = true; }
    } };
  };

  /* 6 · a Victorian push-button light switch: a chased brass plate, two mother-of-pearl buttons (on above, off below),
     for the study's two chandeliers. A tap presses it; the room listens for 'spatial:chandeliers'. */
  F['vic-lightswitch'] = function (T) {
    var E = emats(T), g = new T.Group(), L = function (h) { return new T.Color(h).convertSRGBToLinear(); };
    var brassP = new T.MeshStandardMaterial({ color: L(0xe8bf62), roughness: 0.16, metalness: 1.0, envMapIntensity: 1.5 });
    var pearl = new T.MeshStandardMaterial({ color: L(0xf4eee0), roughness: 0.18, metalness: 0.1, emissive: L(0x221a10) });
    var ebon = new T.MeshStandardMaterial({ color: L(0x15100c), roughness: 0.3 });
    var plate = new T.Shape(); var w = 0.045, h = 0.07, r = 0.012;
    plate.moveTo(-w + r, -h); plate.lineTo(w - r, -h); plate.quadraticCurveTo(w, -h, w, -h + r); plate.lineTo(w, h - r); plate.quadraticCurveTo(w, h, w - r, h); plate.lineTo(-w + r, h); plate.quadraticCurveTo(-w, h, -w, h - r); plate.lineTo(-w, -h + r); plate.quadraticCurveTo(-w, -h, -w + r, -h);
    var pm = new T.Mesh(new T.ExtrudeGeometry(plate, { depth: 0.006, bevelEnabled: true, bevelThickness: 0.003, bevelSize: 0.003, bevelSegments: 3 }), brassP); g.add(pm);
    var bk = new T.Mesh(new T.BoxGeometry(0.11, 0.165, 0.008), E.woodD); bk.position.z = -0.004; g.add(bk);
    [[0, 0.06], [0, -0.06]].forEach(function (q) { var sc = new T.Mesh(new T.CylinderGeometry(0.004, 0.004, 0.004, 10), brassP); sc.rotation.x = Math.PI / 2; sc.position.set(q[0], q[1], 0.011); g.add(sc); });
    var btn = [], ON = 0.022;
    [ON, -ON].forEach(function (y, k) {
      var ring = new T.Mesh(new T.TorusGeometry(0.013, 0.003, 8, 20), brassP); ring.position.set(0, y, 0.011); g.add(ring);
      var b = new T.Mesh(new T.CylinderGeometry(0.0095, 0.0095, 0.012, 20), k ? ebon : pearl); b.rotation.x = Math.PI / 2; b.position.set(0, y, 0.014); g.add(b); btn.push(b);
    });
    var st = function () { try { return localStorage.getItem('minest.study.chandeliers') === '1'; } catch (e) { return false; } };
    function show(on) { btn[0].position.z = on ? 0.009 : 0.014; btn[1].position.z = on ? 0.014 : 0.009; }
    show(st());
    root.addEventListener('spatial:chandeliers', function (e) { show(!!(e.detail && e.detail.on)); });
    g.position.y = 0;
    return { group: g, hb: [0.14, 0.2, 0.08], hbY: 0, place: 'floor', press: function () {
      var on = !st(); try { localStorage.setItem('minest.study.chandeliers', on ? '1' : '0'); } catch (e) {}
      show(on); root.dispatchEvent(new CustomEvent('spatial:chandeliers', { detail: { on: on } }));
      return on ? '吊灯点亮了 · 再按一下熄灭' : '吊灯熄灭了';
    } };
  };
  [{ id: 'vic-piano', name: '三角钢琴', en: 'Concert grand piano', size: [1.56, 1.85, 2.9] },
   { id: 'vic-thinker', name: '思想者（大理石复刻）', en: 'The Thinker, marble replica', size: [0.62, 1.8, 0.62] },
   { id: 'vic-armour', name: '哥特式骑士盔甲', en: 'Gothic armour', size: [0.66, 1.8, 0.5] },
   { id: 'vic-globe', name: '古典落地地球仪', en: 'Library floor globe', size: [0.9, 1.04, 0.9] },
   { id: 'vic-clock', name: '落地摆钟', en: 'Longcase clock', size: [0.66, 2.55, 0.42] },
   { id: 'vic-lightswitch', name: '吊灯开关', en: 'Chandelier switch', size: [0.14, 0.2, 0.08] }].forEach(function (c) {
    if (!CAT.some(function (x) { return x.id === c.id; })) CAT.push({ id: c.id, name: c.name, en: c.en, icon: '▣', place: 'floor', size: c.size, note: 'EC–6 维多利亚书房的陈设' }); });
})(window);
