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
})(window);
