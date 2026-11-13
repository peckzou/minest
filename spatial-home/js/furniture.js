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
})(window);
