/* Neuschwanstein Castle — voxel world generator (no DOM / no THREE dependency). Exposes NSWorld = { W, D, H, B, BI, T, create(seed) }.
 * 1 voxel = 1 m. x east, z south, y up. Cell (x,y,z) occupies [x,x+1)x[y,y+1)x[z,z+1). hm[x,z] = first air cell above the ground.
 *
 * Layout (after the real castle, sizes rounded to whole metres; see README for what is documented and what is estimated):
 *   - the castle rock: a ridge running east-west, the castle plateau at y 40 (lower courtyard) / 43 (upper courtyard, Palas);
 *     the Poellat gorge to the south with the river and the Poellat waterfall, Marienbruecke (Queen Mary's Bridge) across it;
 *     the plain to the north (Forggensee beyond the map), Alpsee and Hohenschwangau to the east-south-east, mountains south.
 *   - west -> east: the Palas (palace, 5 storeys, slate roof, corner turrets, west balcony), the tall stair tower at its
 *     north-east corner, the upper courtyard between the Knights' House (north) and the Bower (south), the Square Tower,
 *     the lower courtyard (outline of the unbuilt chapel), the red Gatehouse with its towers, the road from the east.
 *   - Palas inside: F1 (y 43) vestibule with columns and vaults + the kitchen; F3 (y 53) the Throne Hall (two-storey,
 *     arcades of red porphyry and blue lapis columns, apse with steps, mosaic floor, star vault) and the royal rooms
 *     (dining room, bedroom, living room, grotto, study, corridor); F4 (y 60) the Singers' Hall with its gallery and stage.
 *   - the stair tower holds the spiral main staircase (courtyard -> F3 -> F4) around a column.
 * Everything is built from whole modules (walls, floors, rooms, towers, roofs), never by hand block by block.
 * Mesh details that voxels cannot carry (chandeliers, murals, the apse mosaic, mosaic floor) are listed in world.props
 * and drawn by props.js. */
(function (root) {
  'use strict';
  const W = 256, D = 224, H = 112;
  const WATER_Y = 14.6;   // Alpsee

  const T = {
    grass: 0, grassSide: 1, dirt: 2, rock: 3, snow: 4, snowSide: 5, path: 6, gravel: 7,
    pine: 8, bark: 9, trunkTop: 10, beech: 11, brook: 12, ashlar: 13, limeSmooth: 14, limeCarved: 15,
    brick: 16, slate: 17, glass: 18, door: 19, gold: 20, marble: 21, porphyry: 22, lapis: 23,
    oak: 24, oakCarved: 25, parquet: 26, plaster: 27, vault: 28, coffer: 29, carpet: 30, lamp: 31,
    wool: 32, planks: 33, curtain: 34, tuff: 35, moss: 36, iron: 37, balus: 38, meadow: 39,
    stove: 40, mural: 41, books: 42, fire: 43, flower: 44, fall: 45, mosaic: 46, goldMosaic: 47
  };
  const B = {
    AIR: 0, GRASS: 1, DIRT: 2, ROCK: 3, SNOW: 4, PATH: 5, GRAVEL: 6, PINE: 7, BARK: 8, BEECH: 9, BROOK: 10,
    LIME: 11, LIMES: 12, LIMEC: 13, BRICK: 14, SLATE: 15, GLASS: 16, DOOR: 17, GOLD: 18, MARBLE: 19, PORPH: 20, LAPIS: 21,
    OAK: 22, OAKC: 23, PARQ: 24, PLASTER: 25, VAULT: 26, COFFER: 27, CARPET: 28, LAMP: 29, BED: 30, TABLE: 31, CHAIR: 32,
    BENCH: 33, CURTAIN: 34, TUFF: 35, MOSS: 36, IRON: 37, BALUS: 38, MEADOW: 39, STOVE: 40, MURAL: 41, BOOKS: 42, FIRE: 43,
    FLOWER: 44, FALL: 45, MOSAIC: 46, GMOS: 47, MARBLEV: 48, PLANKS: 49
  };
  const BI = [];
  function def(id, name, top, side, bottom, glow, jit, lit) { BI[id] = { name, top, side, bottom: bottom == null ? side : bottom, glow: !!glow, lit: !!lit, jit: jit == null ? 0.07 : jit }; }
  def(B.AIR, 'air', 0, 0);
  def(B.GRASS, 'grass', T.grass, T.grassSide, T.dirt, false, 0.1);
  def(B.MEADOW, 'meadow', T.meadow, T.grassSide, T.dirt, false, 0.1);
  def(B.DIRT, 'dirt', T.dirt, T.dirt, T.dirt, false, 0.1);
  def(B.ROCK, 'rock', T.rock, T.rock, T.rock, false, 0.1);
  def(B.SNOW, 'snow', T.snow, T.snowSide, T.rock, false, 0.04);
  def(B.PATH, 'cobbles', T.path, T.rock, T.rock, false, 0.05);
  def(B.GRAVEL, 'gravel', T.gravel, T.gravel, T.gravel, false, 0.1);
  def(B.PINE, 'spruce', T.pine, T.pine, T.pine, false, 0.16);
  def(B.BEECH, 'beech', T.beech, T.beech, T.beech, false, 0.16);
  def(B.BARK, 'trunk', T.trunkTop, T.bark, T.trunkTop, false, 0.08);
  def(B.BROOK, 'river', T.brook, T.brook, T.brook, false, 0.06);
  def(B.FALL, 'waterfall', T.fall, T.fall, T.fall, false, 0.08);
  def(B.LIME, 'limestone', T.ashlar, T.ashlar, T.ashlar, false, 0.035);
  def(B.LIMES, 'smooth limestone', T.limeSmooth, T.limeSmooth, T.limeSmooth, false, 0.03);
  def(B.LIMEC, 'carved limestone', T.limeSmooth, T.limeCarved, T.limeSmooth, false, 0.03);
  def(B.BRICK, 'red brick', T.brick, T.brick, T.brick, false, 0.05);
  def(B.SLATE, 'slate roof', T.slate, T.slate, T.slate, false, 0.06);
  def(B.GLASS, 'window', T.glass, T.glass, T.glass, true, 0);
  def(B.DOOR, 'door', T.door, T.door, T.door, false, 0.02);
  def(B.GOLD, 'gilding', T.gold, T.gold, T.gold, false, 0.04);
  def(B.MARBLE, 'marble', T.marble, T.marble, T.marble, false, 0.03);
  def(B.MARBLEV, 'marble floor / vault', T.marble, T.marble, T.vault, false, 0.02);
  def(B.MOSAIC, 'mosaic floor', T.mosaic, T.marble, T.marble, false, 0.01);
  def(B.GMOS, 'gold mosaic', T.goldMosaic, T.goldMosaic, T.goldMosaic, false, 0.03);
  def(B.PORPH, 'red porphyry', T.porphyry, T.porphyry, T.porphyry, false, 0.03);
  def(B.LAPIS, 'lapis lazuli', T.lapis, T.lapis, T.lapis, false, 0.03);
  def(B.OAK, 'oak panelling', T.oak, T.oak, T.oak, false, 0.04);
  def(B.OAKC, 'carved oak', T.oakCarved, T.oakCarved, T.oakCarved, false, 0.04);
  def(B.PARQ, 'parquet / coffered ceiling', T.parquet, T.oak, T.coffer, false, 0.03);
  def(B.COFFER, 'coffered ceiling', T.coffer, T.coffer, T.coffer, false, 0.02);
  def(B.PLASTER, 'painted wall', T.plaster, T.plaster, T.plaster, false, 0.02);
  def(B.VAULT, 'painted vault', T.vault, T.vault, T.vault, false, 0.02);
  def(B.CARPET, 'carpet', T.carpet, T.oak, T.oak, false, 0.02);
  def(B.LAMP, 'lantern', T.lamp, T.lamp, T.lamp, true, 0);
  def(B.BED, 'bed', T.wool, T.oakCarved, T.oak, false, 0.02);
  def(B.TABLE, 'table', T.oak, T.oakCarved, T.oak, false, 0.03);
  def(B.CHAIR, 'chair', T.curtain, T.oakCarved, T.oak, false, 0.03);
  def(B.BENCH, 'bench', T.oak, T.oakCarved, T.oak, false, 0.03);
  def(B.CURTAIN, 'silk', T.curtain, T.curtain, T.curtain, false, 0.03);
  def(B.TUFF, 'tuff (grotto)', T.tuff, T.tuff, T.tuff, false, 0.16);
  def(B.MOSS, 'moss', T.moss, T.tuff, T.tuff, false, 0.14);
  def(B.IRON, 'iron', T.iron, T.iron, T.iron, false, 0.04);
  def(B.BALUS, 'balustrade', T.limeSmooth, T.balus, T.limeSmooth, false, 0.02);
  def(B.STOVE, 'tiled stove', T.stove, T.stove, T.stove, false, 0.02);
  def(B.MURAL, 'mural', T.mural, T.mural, T.mural, false, 0.02);
  def(B.BOOKS, 'bookcase', T.oak, T.books, T.oak, false, 0.02);
  def(B.FIRE, 'hearth fire', T.fire, T.fire, T.fire, false, 0, true);
  def(B.FLOWER, 'flowers', T.flower, T.flower, T.flower, false, 0.1);
  def(B.PLANKS, 'planks', T.planks, T.planks, T.planks, false, 0.06);

  function mulberry32(a) { return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function hash3(x, y, z) { let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(z | 0, 2147483647); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
  function vnoise(x, z, s) { const xi = Math.floor(x), zi = Math.floor(z), fx = x - xi, fz = z - zi, u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz);
    const a = hash3(xi, s, zi), b = hash3(xi + 1, s, zi), c = hash3(xi, s, zi + 1), d = hash3(xi + 1, s, zi + 1); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; }
  function fbm(x, z, s, oct) { let v = 0, a = 0.5, f = 1, n = 0; for (let i = 0; i < (oct || 4); i++) { v += vnoise(x * f, z * f, s + i * 17) * a; n += a; a *= 0.5; f *= 2; } return v / n; }
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

  /* the plan (all the numbers the castle is built from) */
  const P = {
    yLow: 40, yUp: 43,                                   // lower / upper courtyard
    palas: { x0: 44, x1: 100, z0: 82, z1: 106, f1: 43, f2: 48, f3: 53, f4: 60, roof: 70 },
    throne: { x0: 50, x1: 69, z0: 84, z1: 104, y0: 53, y1: 66, colZ0: 87, colZ1: 101, apse: { cx: 50, cz: 94, r: 6 } },
    singers: { x0: 71, x1: 98, z0: 84, z1: 97, y0: 60, y1: 69, galZ0: 99, galZ1: 104 },
    stair: { cx: 104, cz: 86, r: 4.6 },
    knights: { x0: 111, x1: 138, z0: 74, z1: 82, top: 58 },
    bower: { x0: 106, x1: 132, z0: 108, z1: 116, top: 58 },
    square: { x0: 134, x1: 142, z0: 108, z1: 116, top: 76 },
    gate: { x0: 176, x1: 192, z0: 80, z1: 112, top: 58 },
    plateau: { x0: 40, x1: 198, z0: 72, z1: 120 },
    bridge: { x: 64, z0: 121, z1: 152, y: 48 },
    lake: { x: 226, z: 186, rx: 27, rz: 25 },
    hohen: { x: 222, z: 138 }
  };

  function create(seed) {
    seed = seed == null ? 1869 : seed;   // 1869: the foundation stone
    const rnd = mulberry32(seed);
    const RI = (a, b) => Math.floor(a + rnd() * (b - a + 1));
    const pick = (a) => a[Math.floor(rnd() * a.length)];
    const blocks = new Uint8Array(W * H * D), cols = new Uint8Array(W * H * D);
    const idx = (x, y, z) => x + W * (z + D * y);
    const inb = (x, y, z) => x >= 0 && x < W && y >= 0 && y < H && z >= 0 && z < D;
    const get = (x, y, z) => (inb(x, y, z) ? blocks[idx(x, y, z)] : (y < 0 ? B.ROCK : 0));
    const set = (x, y, z, id, c) => { if (!inb(x, y, z)) return; const i = idx(x, y, z); blocks[i] = id; cols[i] = c || 0; };
    const isAir = (x, y, z) => get(x, y, z) === B.AIR;
    const zi = (x, z) => x + W * z;
    const palette = [[1, 1, 1]], palMap = new Map([['100,100,100', 0]]);
    function pal(r, g, b) {
      if (Array.isArray(r)) { b = r[2]; g = r[1]; r = r[0]; }
      const k = Math.round(r * 100) + ',' + Math.round(g * 100) + ',' + Math.round(b * 100);
      let i = palMap.get(k); if (i !== undefined) return i;
      if (palette.length >= 255) { let best = 0, bd = 1e9; palette.forEach((p, n) => { const d = (p[0] - r) ** 2 + (p[1] - g) ** 2 + (p[2] - b) ** 2; if (d < bd) { bd = d; best = n; } }); return best; }
      i = palette.length; palette.push([r, g, b]); palMap.set(k, i); return i;
    }
    function box(x0, y0, z0, x1, y1, z1, id, c) { for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) set(x, y, z, id, c); }
    function clear(x0, y0, z0, x1, y1, z1) { box(x0, y0, z0, x1, y1, z1, B.AIR, 0); }
    const C = {
      lime: pal(0.94, 0.93, 0.89), limeW: pal(0.97, 0.96, 0.93), limeS: pal(0.86, 0.84, 0.79), limeD: pal(0.76, 0.74, 0.69),
      slate: pal(0.38, 0.44, 0.52), slateD: pal(0.3, 0.35, 0.42), gold: pal(1.0, 0.82, 0.38), goldD: pal(0.86, 0.66, 0.26),
      brick: pal(0.78, 0.42, 0.3), brickD: pal(0.66, 0.34, 0.24), marble: pal(0.96, 0.95, 0.91), marbleG: pal(0.8, 0.8, 0.78),
      porph: pal(0.68, 0.2, 0.17), lapis: pal(0.2, 0.32, 0.7), oak: pal(0.5, 0.33, 0.19), oakD: pal(0.38, 0.24, 0.13), parq: pal(0.66, 0.46, 0.26),
      throneW: pal(0.38, 0.5, 0.76), singW: pal(0.9, 0.76, 0.5), bedW: pal(0.36, 0.46, 0.76), liveW: pal(0.42, 0.62, 0.62), dineW: pal(0.7, 0.32, 0.26),
      studyW: pal(0.38, 0.56, 0.38), corrW: pal(0.92, 0.84, 0.62), kitchenW: pal(0.92, 0.9, 0.84), vaultB: pal(0.3, 0.42, 0.78), vaultW: pal(0.96, 0.9, 0.72),
      red: pal(0.72, 0.14, 0.16), blue: pal(0.2, 0.32, 0.72), green: pal(0.25, 0.48, 0.3), tuff: pal(0.62, 0.58, 0.52), moss: pal(0.45, 0.6, 0.32),
      iron: pal(0.36, 0.36, 0.38), grass: pal(0.92, 1, 0.9), rock: pal(0.78, 0.76, 0.73), rockD: pal(0.62, 0.6, 0.58), yellow: pal(0.96, 0.82, 0.44),
      pine: [pal(0.32, 0.5, 0.32), pal(0.28, 0.44, 0.3), pal(0.36, 0.54, 0.34)], beech: [pal(0.5, 0.7, 0.32), pal(0.58, 0.74, 0.36), pal(0.46, 0.64, 0.3)],
      bark: pal(0.6, 0.48, 0.38), stoveG: pal(0.36, 0.6, 0.56)
    };
    const landmarks = [], lamps = [], doors = [], seats = [], flags = [], buildings = [], chimneys = [];
    const props = { chandeliers: [], murals: [], apse: null, mosaic: [], palms: [], swans: [], candles: [], canopies: [] };

    /* ================= terrain ================= */
    const hf = new Float32Array(W * D), hm = new Uint8Array(W * D), occ = new Uint8Array(W * D), pathM = new Uint8Array(W * D);
    const PL = P.plateau, LK = P.lake;
    const gorgeZ = (x) => 134 + 4 * Math.sin(x / 30);
    for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
      let h = 15.6 + fbm(x / 40, z / 40, 3, 4) * 3;                                    // the plain (meadows)
      // the castle ridge, steeper to the south
      const rz = (z - 96) / (z < 96 ? 36 : 24), sx = smooth(18, 50, x) * (1 - smooth(196, 222, x));
      const ridge = Math.max(0, 1 - rz * rz) * 27 * sx + fbm(x / 9, z / 9, 7, 3) * 3 * sx;
      h = Math.max(h, 15.6 + ridge);
      // mountains south of the gorge and wrapping round the east end, the foot of the Saeuling / Tegelberg
      if (z > 140) { const m = 30 + (z - 140) * 0.75 + fbm(x / 26, z / 26, 11, 4) * 14; const fadeE = 1 - smooth(186, 214, x) * (1 - smooth(208, 222, z)); h = Math.max(h, m * Math.max(fadeE, 0)); }
      // the Poellat gorge
      if (x < 206) { const dz = Math.abs(z - gorgeZ(x)), wd = 12 + 3 * fbm(x / 20, 1, 13, 2); if (dz < wd + 8) { const k = dz / wd; const floor = 17.2 + fbm(x / 14, z / 14, 19, 2) * 1.5 + Math.pow(k, 3) * 34; h = Math.min(h, floor); } }
      // Alpsee basin
      { const e = ((x - LK.x) / LK.rx) ** 2 + ((z - LK.z) / LK.rz) ** 2 + (fbm(x / 12, z / 12, 23, 2) - 0.5) * 0.4; if (e < 2.2) h = Math.min(h, e < 1 ? 9 + e * 5 : 14 + (e - 1) * 6); }
      // Hohenschwangau hill
      { const d = Math.hypot(x - P.hohen.x, z - P.hohen.z); if (d < 16) h = Math.max(h, 26 - d * d * 0.03); }
      hf[zi(x, z)] = h;
    }
    // the castle plateau: lower courtyard x >= 142, upper and the Palas x < 142, a terrace south of the buildings
    for (let z = PL.z0; z <= PL.z1; z++) for (let x = PL.x0; x <= PL.x1; x++) hf[zi(x, z)] = (x >= 142 ? P.yLow : P.yUp);
    // the Marienbruecke abutments: a rock spur on the south side, a terrace on the north
    for (let z = 148; z < 162; z++) for (let x = 56; x < 74; x++) hf[zi(x, z)] = Math.max(hf[zi(x, z)], P.bridge.y - (z > 155 ? (z - 155) * 1.2 : 0));
    for (let z = 116; z < 123; z++) for (let x = 58; x < 71; x++) hf[zi(x, z)] = P.bridge.y;

    for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
      const i = zi(x, z), h = Math.round(hf[i]);
      const sl = Math.max(Math.abs(hf[zi(Math.min(W - 1, x + 1), z)] - hf[zi(Math.max(0, x - 1), z)]), Math.abs(hf[zi(x, Math.min(D - 1, z + 1))] - hf[zi(x, Math.max(0, z - 1))]));
      const plate = x >= PL.x0 && x <= PL.x1 && z >= PL.z0 && z <= PL.z1;
      for (let y = 0; y < h; y++) {
        let id = B.ROCK, c = (y % 5 === 0 || hash3(x, y, z) < 0.2) ? C.rockD : C.rock;
        if (!plate && sl < 3.2 && y >= h - 3) id = y === h - 1 ? (h > 34 || rnd() < 0.5 ? B.GRASS : B.MEADOW) : B.DIRT, c = id === B.DIRT ? 0 : C.grass;
        if (h <= WATER_Y + 0.6 && y === h - 1 && Math.hypot((x - LK.x) / LK.rx, (z - LK.z) / LK.rz) < 1.5) { id = B.GRAVEL; c = 0; }
        if (plate && y === h - 1) { id = B.GRAVEL; c = C.limeS; }
        set(x, y, z, id, c);
      }
      hm[i] = h;
    }
    // the river in the gorge (west to east it falls 1 m), the Poellat falls under the bridge
    for (let x = 0; x < 206; x++) { const zc = Math.round(gorgeZ(x)); for (let z = zc - 2; z <= zc + 2; z++) { if (z < 0 || z >= D) continue; const i = zi(x, z), y = hm[i]; if (y < 24) { set(x, y - 1, z, B.BROOK, 0); occ[i] = 2; } } }
    { const x0 = P.bridge.x - 2, x1 = P.bridge.x + 2; for (let x = x0; x <= x1; x++) { for (let z = 140; z < 158; z++) { const i = zi(x, z); for (let y = hm[i] - 1; y >= 17; y--) { if (get(x, y, z) !== B.AIR && (get(x, y, z - 1) === B.AIR || z === 140)) { set(x, y, z, B.FALL, 0); } } } }
      landmarks.push({ id: 'falls', name: '珀拉特瀑布', en: 'Pöllatfall · Pöllat waterfall', x: P.bridge.x, z: 140, top: 30, r: 10, tp: { mode: 'fly', p: [P.bridge.x - 14, 30, 124], t: [P.bridge.x, 26, 145] } }); }

    /* ================= paths ================= */
    function road(pts, w) {   // a cobbled road: [x, z, y] points, cut and filled to the road height
      for (let s = 0; s < pts.length - 1; s++) {
        const a = pts[s], b = pts[s + 1], n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) * 2);
        for (let k = 0; k <= n; k++) {
          const t = k / n, cx = a[0] + (b[0] - a[0]) * t, cz = a[1] + (b[1] - a[1]) * t, cy = Math.round(a[2] + (b[2] - a[2]) * t);
          for (let dz = -w; dz <= w; dz++) for (let dx = -w; dx <= w; dx++) {
            if (dx * dx + dz * dz > w * w + 0.5) continue; const x = Math.round(cx + dx), z = Math.round(cz + dz); if (x < 0 || x >= W || z < 0 || z >= D) continue;
            const i = zi(x, z); for (let y = Math.min(hm[i], cy - 1); y < cy - 1; y++) set(x, y, z, B.ROCK, C.rock);
            set(x, cy - 1, z, B.PATH, C.limeS); for (let y = cy; y < cy + 5; y++) if (get(x, y, z) !== B.LIME) set(x, y, z, B.AIR, 0);
            hm[i] = cy; pathM[i] = 1; occ[i] = 1;
          }
        }
      }
    }
    road([[253, 128, 17], [238, 124, 19], [222, 118, 23], [212, 110, 28], [204, 102, 34], [198, 96, 40]], 2);      // up from Hohenschwangau to the Gatehouse
    road([[238, 124, 19], [228, 132, 22]], 1);                                                                       // to Hohenschwangau
    road([[62, 112, 43], [62, 116, 46], [64, 121, 48]], 1);                                                          // terrace -> Marienbruecke
    road([[P.bridge.x, 152, 48], [P.bridge.x, 160, 44], [P.bridge.x + 8, 168, 40]], 1);                             // the far end into the woods

    /* ================= castle helpers ================= */
    // window column: glass h high with a carved arch over it
    function win(x, y, z, h, arch) { for (let k = 0; k < h; k++) set(x, y + k, z, B.GLASS, 0); if (arch !== false) set(x, y + h, z, B.LIMEC, C.limeW); }
    function walls(x0, z0, x1, z1, y0, y1, id, c) { for (let y = y0; y <= y1; y++) { for (let x = x0; x <= x1; x++) { set(x, y, z0, id, c); set(x, y, z1, id, c); } for (let z = z0; z <= z1; z++) { set(x0, y, z, id, c); set(x1, y, z, id, c); } } }
    function crenels(x0, z0, x1, z1, y, id, c) { for (let x = x0; x <= x1; x++) { if ((x & 1) === 0) { set(x, y, z0, id, c); set(x, y, z1, id, c); } } for (let z = z0; z <= z1; z++) { if ((z & 1) === 0) { set(x0, y, z, id, c); set(x1, y, z, id, c); } } }
    function gableRoof(x0, x1, z0, z1, yb, slope, axis, gableC) {   // ridge along x (axis 'x') or z; the gable ends in limestone
      const half = axis === 'x' ? (z1 - z0 + 2) / 2 : (x1 - x0 + 2) / 2, n = Math.ceil(half * slope);
      for (let k = 0; k < n + 1; k++) {
        const d = Math.floor(k / slope), y = yb + k;
        if (axis === 'x') {
          const a = z0 - 1 + d, b = z1 + 1 - d; if (a > b) break;
          for (let x = x0 - 1; x <= x1 + 1; x++) for (let z = a; z <= b; z++) set(x, y, z, (x === x0 || x === x1) && z > a && z < b ? B.LIME : B.SLATE, (x === x0 || x === x1) && z > a && z < b ? gableC : ((k + z) % 7 === 0 ? C.slateD : C.slate));
          if (a + 1 >= b - 1) { for (let x = x0 - 1; x <= x1 + 1; x += 4) set(x, y + 1, a + ((b - a) >> 1), B.GOLD, C.gold); }
        } else {
          const a = x0 - 1 + d, b = x1 + 1 - d; if (a > b) break;
          for (let z = z0 - 1; z <= z1 + 1; z++) for (let x = a; x <= b; x++) set(x, y, z, (z === z0 || z === z1) && x > a && x < b ? B.LIME : B.SLATE, (z === z0 || z === z1) && x > a && x < b ? gableC : ((k + x) % 7 === 0 ? C.slateD : C.slate));
        }
      }
      return yb + n;
    }
    function cone(cx, cz, r, yb, h, gold) {   // a pointed slate cone with a gilded finial
      for (let k = 0; k < h; k++) {
        const rr = (r + 0.7) * (1 - k / h) + 0.25;
        for (let dz = -Math.ceil(rr); dz <= Math.ceil(rr); dz++) for (let dx = -Math.ceil(rr); dx <= Math.ceil(rr); dx++) if (Math.hypot(dx + 0.5 - (cx % 1 ? 0.5 : 0), dz) <= rr) set(Math.floor(cx + dx), yb + k, Math.floor(cz + dz), B.SLATE, (k % 4 === 0) ? C.slateD : C.slate);
      }
      if (gold !== false) { set(Math.floor(cx), yb + h, Math.floor(cz), B.GOLD, C.gold); set(Math.floor(cx), yb + h + 1, Math.floor(cz), B.GOLD, C.gold); set(Math.floor(cx), yb + h + 2, Math.floor(cz), B.LIMES, C.gold); }
    }
    function tower(cx, cz, r, y0, y1, opts) {   // a round tower: wall ring, slit / arched windows, corbel ring, cone
      opts = opts || {};
      const R = Math.ceil(r) + 1;
      for (let y = y0; y <= y1; y++) for (let dz = -R; dz <= R; dz++) for (let dx = -R; dx <= R; dx++) {
        const d = Math.hypot(dx + 0.5, dz + 0.5), x = Math.floor(cx) + dx, z = Math.floor(cz) + dz;
        if (d <= r && d > r - 1.15) set(x, y, z, B.LIME, C.lime);
        else if (d <= r - 1.15 && opts.solid) set(x, y, z, B.LIME, C.limeS);
        else if (d <= r - 1.15 && opts.hollow) set(x, y, z, B.AIR, 0);
      }
      // windows on 8 sides every 6 m, arched
      for (let y = y0 + 3; y < y1 - 3; y += 6) for (let a = 0; a < 8; a++) {
        if (opts.noWin && opts.noWin(a, y)) continue; const ang = a * Math.PI / 4 + (y / 6 % 2) * Math.PI / 8;
        const x = Math.floor(cx + Math.cos(ang) * (r - 0.5)), z = Math.floor(cz + Math.sin(ang) * (r - 0.5)); win(x, y, z, 2);
      }
      // corbel ring and the cone
      for (let dz = -R - 1; dz <= R + 1; dz++) for (let dx = -R - 1; dx <= R + 1; dx++) { const d = Math.hypot(dx + 0.5, dz + 0.5); if (d <= r + 0.7 && d > r - 0.6) { set(Math.floor(cx) + dx, y1 + 1, Math.floor(cz) + dz, B.LIMES, C.limeW); } }
      cone(cx, cz, r, y1 + 2, opts.cone || Math.round(r * 2.6), opts.gold);
    }
    function lamp(x, y, z, room, inten) { lamps.push([x + 0.5, y + 0.5, z + 0.5, room ? 1 : 0, inten || 1]); }
    function seat(x, y, z, yaw) { seats.push({ x: x + 0.5, y: y + 1, z: z + 0.5, yaw: yaw || 0 }); }
    function door(x, y, z, face) { set(x, y, z, B.DOOR, 0); set(x, y + 1, z, B.DOOR, 0); doors.push({ x, y, z, face, open: false }); }
    function chair(x, y, z, yaw) { set(x, y, z, B.CHAIR, C.red); seat(x, y, z, yaw); }
    function mural(x, y, z, w, h, face, theme) { props.murals.push({ x, y, z, w, h, face, theme }); }
    function paint(x, y, z, id, c) {   // an inner wall cell: where the outer wall next to it has a window, the window goes through
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (get(x + dx, y, z + dz) === B.GLASS) { set(x, y, z, B.GLASS, 0); return; }
      set(x, y, z, id, c);
    }

    /* ================= the plateau: retaining walls down the cliff ================= */
    for (let z = PL.z0; z <= PL.z1; z++) for (let x = PL.x0; x <= PL.x1; x++) {
      const edge = z === PL.z0 || z === PL.z1 || x === PL.x0 || x === PL.x1;
      if (!edge) continue; const top = x >= 142 ? P.yLow : P.yUp;
      for (let y = top - 1; y >= top - 14 && y > 0; y--) { set(x, y, z, B.LIME, (y % 3 === 0) ? C.limeS : C.lime); }
      set(x, top, z, B.BALUS, C.limeW);   // a parapet round the terrace
    }
    // the upper / lower courtyard step
    for (let z = P.knights.z1 + 1; z < P.bower.z0; z++) { set(141, P.yUp - 1, z, B.LIMES, C.limeS); set(140, P.yUp - 1, z, B.LIMES, C.limeS); }
    for (let z = 90; z <= 100; z++) { for (let k = 0; k < 3; k++) { clear(142 + k, P.yLow, z, 142 + k, P.yLow + 4, z); box(142 + k, P.yLow - 1, z, 142 + k, P.yLow + 1 - k, z, B.MARBLE, C.limeS); } }
    for (let z = P.knights.z1 + 1; z < P.bower.z0; z++) if (z < 90 || z > 100) { set(141, P.yUp, z, B.BALUS, C.limeW); box(142, P.yLow, z, 142, P.yUp - 1, z, B.LIME, C.limeS); }

    /* ================= the Palas ================= */
    const pa = P.palas;
    // shell: limestone walls, five storeys, floors
    walls(pa.x0, pa.z0, pa.x1, pa.z1, pa.f1, pa.roof - 1, B.LIME, C.lime);
    box(pa.x0 + 1, pa.f1 - 1, pa.z0 + 1, pa.x1 - 1, pa.f1 - 1, pa.z1 - 1, B.MARBLE, C.marbleG);
    box(pa.x0 + 1, pa.f2 - 1, pa.z0 + 1, pa.x1 - 1, pa.f2 - 1, pa.z1 - 1, B.MARBLEV, 0);
    box(pa.x0 + 1, pa.f3 - 1, pa.z0 + 1, pa.x1 - 1, pa.f3 - 1, pa.z1 - 1, B.PARQ, C.parq);
    box(pa.x0 + 1, pa.f4 - 1, pa.z0 + 1, pa.x1 - 1, pa.f4 - 1, pa.z1 - 1, B.PARQ, C.parq);
    box(pa.x0 + 1, pa.roof - 1, pa.z0 + 1, pa.x1 - 1, pa.roof - 1, pa.z1 - 1, B.COFFER, C.oak);
    // string courses between storeys (a carved band all round)
    for (const y of [pa.f2 - 1, pa.f3 - 1, pa.f4 - 1, pa.roof - 1]) for (let x = pa.x0 - 1; x <= pa.x1 + 1; x++) for (const z of [pa.z0 - 1, pa.z1 + 1]) set(x, y, z, B.LIMES, C.limeW);
    for (const y of [pa.f2 - 1, pa.f3 - 1, pa.f4 - 1, pa.roof - 1]) for (let z = pa.z0 - 1; z <= pa.z1 + 1; z++) for (const x of [pa.x0 - 1, pa.x1 + 1]) set(x, y, z, B.LIMES, C.limeW);
    // windows: plain on F1/F2, arched pairs on F3/F4, tall throne-hall windows on the west front
    function facadeWindows(face) {
      const along = face === 'n' || face === 's', a0 = along ? pa.x0 + 2 : pa.z0 + 2, a1 = along ? pa.x1 - 2 : pa.z1 - 2, fix = face === 'n' ? pa.z0 : face === 's' ? pa.z1 : face === 'w' ? pa.x0 : pa.x1;
      for (let a = a0; a <= a1; a++) {
        const m = (a - a0) % 4; if (m !== 0 && m !== 1) continue;
        const put = (y, h, arch) => { if (along) win(a, y, fix, h, arch); else win(fix, y, a, h, arch); };
        if (face === 'e' && a >= 84 && a <= 89) continue;   // the stair tower stands here
        put(pa.f1 + 1, 2, false); put(pa.f2 + 1, 2, false);
        const throneHere = along ? (a >= P.throne.x0 && a <= P.throne.x1) : face === 'w';
        if (throneHere) { if (m === 0) put(pa.f3 + 1, 9, true); }
        else { put(pa.f3 + 1, 3, true); put(pa.f4 + 2, 4, true); }
      }
    }
    ['n', 's', 'w', 'e'].forEach(facadeWindows);
    // the balcony of the Throne Hall, on the south front over the Poellat gorge (a view to Marienbruecke)
    box(57, pa.f3 - 1, pa.z1 + 1, 65, pa.f3 - 1, pa.z1 + 4, B.MARBLE, C.limeS);
    for (let x = 57; x <= 65; x++) set(x, pa.f3, pa.z1 + 4, B.BALUS, C.limeW); for (let z = pa.z1 + 1; z <= pa.z1 + 4; z++) { set(57, pa.f3, z, B.BALUS, C.limeW); set(65, pa.f3, z, B.BALUS, C.limeW); }
    for (const x of [57, 61, 65]) for (let y = pa.f3 - 5; y < pa.f3 - 1; y++) set(x, y, pa.z1 + 1 + Math.max(0, y - (pa.f3 - 5) - 1), B.LIMES, C.limeS);   // brackets
    landmarks.push({ id: 'balcony', name: '王座厅阳台', en: 'Throne Hall balcony · over the gorge', x: 61, z: pa.z1 + 3, top: pa.f3 + 2, r: 5, tp: { mode: 'walk', p: [61.5, pa.f3, pa.z1 + 2.5], t: [64, 44, 150] } });
    // roof: steep slate gable along x, limestone gables with gilded finials, corner turrets on the west front, oriels
    const ridgeY = gableRoof(pa.x0, pa.x1, pa.z0, pa.z1, pa.roof, 1.45, 'x', C.limeW);
    for (const x of [pa.x0, pa.x1]) { for (let y = pa.roof; y <= ridgeY + 2; y++) { if ((y & 1) === 0) { const span = Math.max(0, Math.floor((ridgeY - y) / 1.45)); for (const z of [94 - span, 94 + span]) set(x, y, z, B.LIMES, C.limeW); } } set(x, ridgeY + 2, 94, B.GOLD, C.gold); set(x, ridgeY + 3, 94, B.GOLD, C.gold); }
    tower(pa.x0 + 1.5, pa.z0 + 1.5, 3.2, pa.f1, ridgeY - 4, { solid: true, cone: 13 });
    tower(pa.x0 + 1.5, pa.z1 - 0.5, 3.2, pa.f1, ridgeY - 4, { solid: true, cone: 13 });
    for (const [x, z] of [[pa.x1 - 1, pa.z1], [pa.x1 - 1, pa.z0], [72, pa.z1], [72, pa.z0]]) tower(x + 0.5, z + 0.5, 1.8, pa.f4 + 2, pa.roof + 6, { solid: true, cone: 7 });
    // dormers on the roof
    for (let x = pa.x0 + 8; x < pa.x1 - 4; x += 8) for (const [z, zo] of [[pa.z0 + 1, 1], [pa.z1 - 1, -1]]) { box(x, pa.roof + 3, z, x + 2, pa.roof + 6, z, B.LIME, C.limeW); win(x + 1, pa.roof + 3, z, 2); box(x, pa.roof + 7, z, x + 2, pa.roof + 7, z + zo, B.SLATE, C.slate); set(x + 1, pa.roof + 8, z, B.GOLD, C.gold); }
    flags.push([pa.x0 + 1.5, ridgeY + 13, pa.z0 + 1.5]);
    buildings.push({ id: 'palas', name: '宫殿主楼 Palas', x0: pa.x0, z0: pa.z0, x1: pa.x1, z1: pa.z1, y: pa.f1 });

    /* ---- F1: the lower vestibule (columns and vaults) and the kitchen ---- */
    const f1 = pa.f1;
    for (let z = pa.z0 + 1; z < pa.z1; z++) set(73, f1, z, B.LIME, C.limeS), box(73, f1, z, 73, pa.f2 - 2, z, B.LIME, C.limeS);
    door(73, f1, 94, 'w');
    // vestibule x 74..98: columns every 4 m, vault ceiling (the F2 floor shows its painted underside)
    for (let x = 77; x <= 95; x += 6) for (const z of [89, 99]) { box(x, f1, z, x, pa.f2 - 2, z, B.MARBLE, C.marbleG); set(x, pa.f2 - 2, z, B.LIMEC, C.limeW); }
    for (let x = 74; x < pa.x1; x++) for (let z = pa.z0 + 1; z < pa.z1; z++) { if ((x + z) % 2 === 0) set(x, f1 - 1, z, B.MARBLE, C.marble); }
    box(74, pa.f2 - 1, pa.z0 + 1, pa.x1 - 1, pa.f2 - 1, pa.z1 - 1, B.MARBLEV, 0);
    door(pa.x1, f1, 96, 'e'); clear(pa.x1, f1, 95, pa.x1, f1 + 2, 95); set(pa.x1, f1 + 2, 96, B.LIMEC, C.limeW);   // the main door from the upper courtyard
    lamp(86, f1 + 3, 94, true, 0.8); lamp(78, f1 + 3, 94, true, 0.6);
    landmarks.push({ id: 'vestibule', name: '下层前厅', en: 'Lower Vestibule', x: 86, z: 94, top: f1 + 4, r: 8, tp: { mode: 'walk', p: [96.5, f1, 96.5], t: [76, f1 + 2, 92] } });
    // the kitchen x 45..72: hearth, the big stove, tables, copper (one of the most modern kitchens of its day)
    for (let x = pa.x0 + 1; x <= 72; x++) for (let z = pa.z0 + 1; z < pa.z1; z++) set(x, f1 - 1, z, B.MARBLE, ((x + z) & 1) ? C.marbleG : C.limeS);
    box(pa.x0 + 1, f1, 86, pa.x0 + 3, f1 + 2, 92, B.STOVE, C.stoveG); box(pa.x0 + 1, f1, 88, pa.x0 + 1, f1, 90, B.FIRE, 0); chimneys.push([pa.x0 + 2, pa.roof + 4, 89]);
    box(55, f1, 92, 62, f1, 96, B.TABLE, C.oak); box(64, f1, 92, 70, f1, 93, B.TABLE, C.oak);
    for (let x = 56; x < 62; x += 2) { chair(x, f1, 91, 0); chair(x, f1, 97, Math.PI); }
    box(pa.x0 + 1, f1 + 2, 97, pa.x0 + 1, f1 + 3, 104, B.BOOKS, C.oak);
    lamp(60, f1 + 3, 94, true, 0.9); lamp(pa.x0 + 3, f1 + 1, 89, true, 1.1);
    landmarks.push({ id: 'kitchen', name: '御膳房', en: 'Royal kitchen', x: 58, z: 94, top: f1 + 4, r: 9, tp: { mode: 'walk', p: [70.5, f1, 100.5], t: [48, f1 + 1, 89] } });

    /* ---- F3: the Throne Hall ---- */
    const th = P.throne;
    box(th.x0, th.y0, th.z0, th.x1, th.y1, th.z1, B.AIR, 0);                                  // two storeys open
    box(th.x0, th.y0 - 1, th.z0, th.x1, th.y0 - 1, th.z1, B.MOSAIC, C.marble);                 // mosaic floor
    box(th.x0, th.y1 + 1, th.z0, th.x1, th.y1 + 1, th.z1, B.VAULT, 0);                  // the blue starry vault
    box(th.x1 + 1, th.y0, pa.z0 + 1, th.x1 + 1, pa.roof - 2, pa.z1 - 1, B.LIME, C.limeS);       // the east wall (to the royal rooms)
    for (let y = th.y0; y <= th.y1; y++) for (let z = th.z0; z <= th.z1; z++) { set(th.x0 - 1, y, z, B.PLASTER, C.throneW); set(th.x1 + 1, y, z, B.PLASTER, C.throneW); }
    for (let y = th.y0; y <= th.y1; y++) for (let x = th.x0; x <= th.x1; x++) { paint(x, y, th.z0 - 1, B.PLASTER, C.throneW); paint(x, y, th.z1 + 1, B.PLASTER, C.throneW); }
    // gallery floors over the aisles, balustrade at the column line
    for (const [a, b, cl] of [[th.z0, th.colZ0 - 1, th.colZ0], [th.colZ1 + 1, th.z1, th.colZ1]]) {
      box(th.x0, pa.f4 - 1, a, th.x1, pa.f4 - 1, b, B.MARBLEV, 0);
      for (let x = th.x0; x <= th.x1; x++) set(x, pa.f4, cl, B.BALUS, C.goldD);
    }
    // the columns: lower storey red porphyry, upper storey lapis blue, gilded capitals, arches between
    for (let x = th.x0 + 1; x <= th.x1 - 1; x += 3) for (const z of [th.colZ0, th.colZ1]) {
      box(x, th.y0, z, x, pa.f4 - 3, z, B.PORPH, C.porph); set(x, pa.f4 - 2, z, B.GOLD, C.gold); set(x, pa.f4 - 1, z, B.GOLD, C.goldD);
      box(x, pa.f4 + 1, z, x, th.y1 - 2, z, B.LAPIS, C.lapis); set(x, th.y1 - 1, z, B.GOLD, C.gold); set(x, th.y1, z, B.GOLD, C.goldD);
      for (const dx of [1, 2]) if (x + dx <= th.x1) { set(x + dx, pa.f4 - 1, z, B.GOLD, C.goldD); set(x + dx, th.y1, z, B.GOLD, C.goldD); }
    }
    // wainscot and gold band; murals between (props)
    for (let x = th.x0; x <= th.x1; x++) for (const z of [th.z0 - 1, th.z1 + 1]) { if (get(x, th.y0, z) !== B.GLASS) set(x, th.y0, z, B.MARBLE, C.porph); if (get(x, pa.f4 + 6, z) !== B.GLASS) set(x, pa.f4 + 6, z, B.GOLD, C.gold); }
    for (let x = th.x0 + 2; x <= th.x1 - 3; x += 5) { mural(x, th.y0 + 1, th.z0, 4, 4, '+z', 'saints'); mural(x, th.y0 + 1, th.z1 + 1, 4, 4, '-z', 'saints'); mural(x, pa.f4 + 1, th.z0, 4, 4, '+z', 'apostles'); mural(x, pa.f4 + 1, th.z1 + 1, 4, 4, '-z', 'apostles'); }
    mural(th.x1 + 1, th.y0 + 2, th.colZ0 + 2, 10, 7, '-x', 'saints');
    // the apse: steps of white marble with a gilded edge, gold mosaic wall, painted half dome (props)
    const ap = th.apse;
    for (let dz = -ap.r; dz <= ap.r; dz++) for (let dx = -ap.r; dx <= 0; dx++) {
      const d = Math.hypot(dx, dz), x = ap.cx + dx, z = ap.cz + dz; if (d > ap.r + 0.5) continue;
      for (let y = th.y0; y <= th.y1; y++) set(x, y, z, B.AIR, 0);
      set(x, th.y1 + 1, z, B.VAULT, 0);
      if (d > ap.r - 0.6) for (let y = th.y0 - 1; y <= th.y1; y++) set(x, y, z, B.GMOS, C.gold);
    }
    for (let k = 0; k < 9; k++) { const x = th.x0 + 2 - k; if (x < ap.cx - ap.r) break; for (let z = ap.cz - 4; z <= ap.cz + 4; z++) { const yy = th.y0 + Math.min(4, Math.floor(k / 2)); box(x, th.y0, z, x, yy - 1, z, B.MARBLE, C.marble); if (k % 2 === 1 && yy > th.y0) set(x, yy - 1, z, B.MARBLE, k === 1 ? C.gold : C.marble); } }
    props.apse = { cx: ap.cx + 0.5, cz: ap.cz + 0.5, r: ap.r, y0: th.y0 + 4, y1: th.y1 + 1 };
    props.canopies.push({ x: ap.cx - 2, y: th.y0 + 4, z: ap.cz + 0.5 });
    props.mosaic.push({ x0: th.x0 + 3, x1: th.x1 + 1, z0: th.colZ0 + 1, z1: th.colZ1, y: th.y0 + 0.01, theme: 'throne' });
    props.chandeliers.push({ x: (th.x0 + th.x1 + 1) / 2, y: th.y0 + 6.5, z: ap.cz + 0.5, top: th.y1 + 1, r: 2.4, candles: 96, kind: 'crown' });
    lamp((th.x0 + th.x1) >> 1, th.y0 + 6, ap.cz, true, 1.6); lamp(th.x0 + 1, th.y0 + 3, ap.cz, true, 0.8);
    for (let x = th.x0 + 3; x < th.x1; x += 6) for (const z of [th.z0 + 1, th.z1 - 1]) props.candles.push({ x: x + 0.5, y: th.y0, z: z + 0.5, h: 2.4 });
    clear(61, th.y0, th.z1 + 1, 61, th.y0 + 1, pa.z1); door(61, th.y0, pa.z1, 's');   // to the balcony
    landmarks.push({ id: 'throne', name: '王座厅', en: 'Thronsaal · Throne Hall', x: 60, z: 94, top: th.y1, r: 11, tp: { mode: 'walk', p: [68.5, th.y0, 94.5], t: [ap.cx - 2, th.y0 + 5, ap.cz + 0.5] } });

    /* ---- F3: the royal rooms (x 71..98): corridor (north), dining room, bedroom, living room, grotto, study ---- */
    const f3 = pa.f3, rc = 59 - 1;   // room ceiling = F4 slab at y 59
    const ry0 = f3, ry1 = pa.f4 - 2;
    function room(x0, z0, x1, z1, wallC, floorC, name) {   // painted walls with an oak wainscot, parquet, coffered ceiling
      clear(x0, ry0, z0, x1, ry1, z1);
      const wc = (y) => [y === ry0 ? B.OAK : y === ry1 ? B.GOLD : B.PLASTER, y === ry0 ? C.oakD : y === ry1 ? C.goldD : wallC];
      for (let y = ry0; y <= ry1; y++) { const [id, c] = wc(y); for (let x = x0 - 1; x <= x1 + 1; x++) for (const z of [z0 - 1, z1 + 1]) paint(x, y, z, id, c); for (let z = z0; z <= z1; z++) for (const x of [x0 - 1, x1 + 1]) paint(x, y, z, id, c); }
      box(x0, ry0 - 1, z0, x1, ry0 - 1, z1, B.PARQ, floorC || C.parq);
      return { x0, z0, x1, z1, name };
    }
    // wall line between the north corridor and the rooms: z 90
    const corr = room(78, pa.z0 + 2, 98, 89, C.corrW);
    box(corr.x0, ry1, corr.z0, corr.x1, ry1, corr.z1, B.VAULT, 0);
    for (let x = 80; x <= 97; x += 3) { set(x, ry0, corr.z0, B.OAKC, C.oak); }
    const dine = room(91, 91, 98, pa.z1 - 2, C.dineW);
    const bed = room(81, 91, 89, pa.z1 - 2, C.bedW);
    const live = room(71, 91, 79, pa.z1 - 2, C.liveW);
    const grotto = { x0: 75, z0: pa.z0 + 2, x1: 77, z1: 89 };
    const study = room(71, pa.z0 + 2, 73, 89, C.studyW);
    // doors: stair -> corridor, corridor -> dining / bedroom, bedroom <-> living, living <-> throne, living -> grotto -> study, corridor -> grotto
    door(95, f3, 90, 's'); door(85, f3, 90, 's'); door(90, f3, 98, 'w'); door(80, f3, 98, 'w');
    // the grotto: an artificial cave of tuff with a little waterfall and coloured light (between the living room and the study)
    clear(grotto.x0, ry0, grotto.z0, grotto.x1, ry1, grotto.z1);
    for (let z = grotto.z0 - 1; z <= grotto.z1 + 1; z++) for (let x = grotto.x0 - 1; x <= grotto.x1 + 1; x++) for (let y = ry0 - 1; y <= ry1 + 1; y++) {
      const inner = x >= grotto.x0 && x <= grotto.x1 && z >= grotto.z0 && z <= grotto.z1 && y >= ry0 && y <= ry1;
      const h = hash3(x, y, z); if (!inner) { set(x, y, z, h < 0.25 ? B.MOSS : B.TUFF, h < 0.25 ? C.moss : C.tuff); continue; }
      if (y === ry1 && h < 0.45) set(x, y, z, B.TUFF, C.tuff);                // stalactites
      if (y === ry0 && h < 0.2 && x !== 76) set(x, y, z, B.TUFF, C.tuff);    // rocks on the floor
    }
    for (let y = ry0; y <= ry1; y++) set(grotto.x0, y, pa.z0 + 2, B.FALL, 0);
    door(76, f3, 90, 's'); door(74, f3, 86, 'w'); door(78, f3, 85, 'e');
    lamp(76, ry0 + 2, 86, true, 0.7);
    props.candles.push({ x: 76.5, y: ry0, z: 87.5, h: 0, glow: 0x50a0ff });
    // furniture
    { const r = bed; // the bedroom: carved oak canopy bed (the carvers worked four and a half years on it), washstand, chairs
      box(82, ry0, 99, 84, ry0, 103, B.BED, C.blue); for (const [x, z] of [[82, 99], [84, 99], [82, 104], [84, 104]]) box(x, ry0, z, x, ry1 - 1, z, B.OAKC, C.oakD);
      box(82, ry1 - 1, 99, 84, ry1 - 1, 104, B.OAKC, C.oakD); box(82, ry1 - 2, 104, 84, ry1 - 2, 104, B.CURTAIN, C.blue);
      for (let k = 0; k < 3; k++) { set(83, ry1 - 1 - k, 99, B.OAKC, C.oakD); }
      box(88, ry0, 103, 89, ry0, 103, B.TABLE, C.oak); chair(87, ry0, 96, -Math.PI / 2); chair(87, ry0, 93, -Math.PI / 2);
      mural(r.x0, ry0 + 1, r.z0, 9, 3, '+z', 'tristan'); lamp(85, ry1 - 1, 96, true, 0.7); props.chandeliers.push({ x: 85.5, y: ry1 - 0.5, z: 96.5, top: rc, r: 0.7, candles: 12, kind: 'small' }); }
    { const r = dine; box(93, ry0, 95, 96, ry0, 101, B.TABLE, C.oak); set(94, ry0 + 1, 98, B.GOLD, C.gold); set(95, ry0 + 1, 98, B.GOLD, C.gold);   // the gilded centrepiece
      for (let z = 96; z <= 100; z += 2) { chair(92, ry0, z, Math.PI / 2); chair(97, ry0, z, -Math.PI / 2); }
      mural(r.x0, ry0 + 1, r.z0, 8, 3, '+z', 'minstrels'); lamp(94, ry1 - 1, 98, true, 0.8); props.chandeliers.push({ x: 94.5, y: ry1 - 0.5, z: 98.5, top: rc, r: 0.8, candles: 16, kind: 'small' }); }
    { const r = live; // the living room: the swan corner, a bench at the window, a table
      box(72, ry0, 104, 78, ry0, 104, B.BENCH, C.oak); for (let x = 72; x <= 78; x += 2) seats.push({ x: x + 0.5, y: ry0 + 1, z: 104.5, yaw: 0 });
      box(74, ry0, 97, 76, ry0, 99, B.TABLE, C.oak); chair(73, ry0, 98, Math.PI / 2); chair(77, ry0, 98, -Math.PI / 2);
      mural(r.x0, ry0 + 1, r.z0, 9, 3, '+z', 'lohengrin'); props.swans.push({ x: 72.5, y: ry0 + 1, z: 92.5 }); lamp(75, ry1 - 1, 98, true, 0.8);
      props.chandeliers.push({ x: 75.5, y: ry1 - 0.5, z: 97.5, top: rc, r: 0.8, candles: 16, kind: 'small' }); }
    { box(71, ry0, 84, 72, ry0, 84, B.TABLE, C.oak); chair(72, ry0, 85, Math.PI); box(71, ry0, 88, 73, ry1 - 1, 88, B.BOOKS, C.oak); lamp(72, ry1 - 1, 86, true, 0.6);
      mural(71, ry0 + 1, pa.z0 + 1, 3, 3, '+z', 'tannhauser'); }
    lamp(88, ry1 - 1, 86, true, 0.6);
    landmarks.push({ id: 'royal', name: '国王寝宫', en: 'Royal apartments · bedroom', x: 85, z: 98, top: ry1, r: 6, tp: { mode: 'walk', p: [88.5, ry0, 93.5], t: [83, ry0 + 1, 101] } });
    landmarks.push({ id: 'grotto', name: '人工钟乳石洞', en: 'The Grotto', x: 76, z: 86, top: ry1, r: 3, tp: { mode: 'walk', p: [76.5, ry0, 88.5], t: [75, ry0 + 1, 83] } });

    /* ---- F4: the Singers' Hall (after the hall of the Wartburg), its gallery and the stage ---- */
    const sg = P.singers, f4 = pa.f4;
    clear(sg.x0, f4, sg.z0, sg.x1, sg.y1 - 1, sg.galZ1);
    for (let y = f4; y < sg.y1; y++) { for (let x = sg.x0; x <= sg.x1; x++) { paint(x, y, sg.z0 - 1, B.PLASTER, C.singW); paint(x, y, sg.galZ1 + 1, B.PLASTER, C.singW); } for (let z = sg.z0; z <= sg.galZ1; z++) { paint(sg.x0 - 1, y, z, B.PLASTER, C.singW); paint(sg.x1 + 1, y, z, B.PLASTER, C.singW); } }
    box(sg.x0, f4 - 1, sg.z0, sg.x1, f4 - 1, sg.galZ1, B.PARQ, C.parq);
    box(sg.x0, sg.y1 - 1, sg.z0, sg.x1, sg.y1 - 1, sg.galZ1, B.COFFER, C.oak);
    // the arcade between the hall and its gallery: columns with arches
    for (let x = sg.x0 + 4; x <= sg.x1; x++) { const col = (x - sg.x0) % 3 === 1; if (col) box(x, f4, 98, x, sg.y1 - 2, 98, B.LIMES, C.limeW); else set(x, sg.y1 - 2, 98, B.LIMEC, C.gold); }
    // oak wainscot, gold band, murals of the Parzival legend
    for (let x = sg.x0; x <= sg.x1; x++) { const z = sg.z0 - 1; set(x, f4, z, B.OAK, C.oakD); set(x, f4 + 1, z, B.OAK, C.oakD); if (get(x, f4 + 6, z) !== B.GLASS) set(x, f4 + 6, z, B.GOLD, C.gold); set(x, f4, sg.galZ1 + 1, B.OAK, C.oakD); }
    for (let x = sg.x0 + 6; x <= sg.x1 - 4; x += 5) mural(x, f4 + 2, sg.z0, 4, 4, '+z', 'parzival');
    for (let x = sg.x0 + 5; x <= sg.x1 - 4; x += 5) mural(x, f4 + 2, sg.galZ1 + 1, 4, 4, '-z', 'grail');
    // the stage (the "Laube"): raised, arches, a painted forest backdrop
    box(sg.x0, f4, sg.z0 + 4, sg.x0 + 3, f4, sg.galZ1 - 1, B.PARQ, C.oakD);   // (the north end is kept free: the door from the Throne Hall gallery)
    for (let z = sg.z0 + 4; z <= sg.galZ1 - 1; z++) set(sg.x0 + 3, f4 + 1, z, z % 3 === 0 ? B.LIMES : B.AIR, C.limeW);
    for (let z = sg.z0 + 4; z <= 97; z++) { if ((z - sg.z0) % 4 === 0) box(sg.x0 + 3, f4 + 1, z, sg.x0 + 3, sg.y1 - 3, z, B.LIMES, C.limeW); else set(sg.x0 + 3, sg.y1 - 3, z, B.LIMEC, C.gold); }
    mural(sg.x0, f4 + 1, sg.z0 + 5, 10, 6, '+x', 'forest');
    // benches along the walls, candelabra, chandeliers
    for (let x = sg.x0 + 6; x < sg.x1 - 1; x += 4) { set(x, f4, sg.z0, B.BENCH, C.oak); set(x + 1, f4, sg.z0, B.BENCH, C.oak); seat(x, f4, sg.z0, Math.PI); }
    for (let x = sg.x0 + 7; x < sg.x1; x += 7) { props.chandeliers.push({ x: x + 0.5, y: sg.y1 - 3.5, z: 90.5, top: sg.y1 - 1, r: 1.3, candles: 24, kind: 'ring' }); props.candles.push({ x: x + 0.5, y: f4, z: 97.4, h: 2.2 }); }
    lamp(80, sg.y1 - 3, 90, true, 1.0); lamp(92, sg.y1 - 3, 90, true, 1.0); lamp(74, f4 + 3, 90, true, 0.7);
    door(P.throne.x1 + 1, P.throne.y0, 98, 'e'); door(P.throne.x1 + 1, pa.f4, 85, 'e');   // throne hall -> living room, upper gallery -> Singers' Hall (after the rooms painted their walls)
    landmarks.push({ id: 'singers', name: '歌手大厅', en: 'Sängersaal · Singers\' Hall', x: 85, z: 90, top: sg.y1, r: 10, tp: { mode: 'walk', p: [97.5, f4, 90.5], t: [sg.x0, f4 + 2, 90] } });

    /* ---- the stair tower: spiral main staircase round a column, palm-tree capital, star vault ---- */
    const st = P.stair, sTop = 92;
    tower(st.cx, st.cz, st.r, P.yUp, sTop, { hollow: true, cone: 15, noWin: (a, y) => a === 4 && y > pa.f3 - 2 && y < pa.f4 + 4 });
    box(Math.floor(st.cx) - 3, P.yUp - 1, Math.floor(st.cz) - 3, Math.floor(st.cx) + 3, P.yUp - 1, Math.floor(st.cz) + 3, B.MARBLE, C.marble);
    (function spiral() {
      // steps: courtyard (y 43, east) -> F3 (y 53, west) in 10 steps (1.5 turns), F3 -> F4 (y 60, west) in 7 steps (1 turn)
      const segs = [{ i0: 0, n: 10, a0: 0, a1: Math.PI * 3 }, { i0: 10, n: 7, a0: Math.PI * 3, a1: Math.PI * 5 }];
      const R = Math.ceil(st.r);
      for (let dz = -R; dz <= R; dz++) for (let dx = -R; dx <= R; dx++) {
        const d = Math.hypot(dx + 0.5, dz + 0.5); if (d > st.r - 1.15 || d < 1.1) continue;
        const x = Math.floor(st.cx) + dx, z = Math.floor(st.cz) + dz; let ang = Math.atan2(dz + 0.5, dx + 0.5); if (ang < 0) ang += Math.PI * 2;
        for (const s of segs) { const da = (s.a1 - s.a0) / s.n; for (let k = 1; k <= s.n; k++) { let a = s.a0 + da * (k - 1); const am = ((a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2); let rel = ang - am; if (rel < 0) rel += Math.PI * 2; if (rel < da) { const y = P.yUp + s.i0 + k - 1; set(x, y, z, B.MARBLE, k % 2 ? C.marble : C.marbleG); } } }
      }
      // landings at F3 and F4 next to the doors (west)
      for (const y of [pa.f3 - 1, pa.f4 - 1]) for (let dz = -1; dz <= 1; dz++) for (let dx = -3; dx <= -2; dx++) set(Math.floor(st.cx) + dx, y, Math.floor(st.cz) + dz, B.MARBLE, C.marble);
      box(Math.floor(st.cx) - 1, P.yUp, Math.floor(st.cz) - 1, Math.floor(st.cx), sTop - 4, Math.floor(st.cz), B.LIMES, C.limeW);   // the column
      box(Math.floor(st.cx) - 3, sTop - 3, Math.floor(st.cz) - 3, Math.floor(st.cx) + 3, sTop - 3, Math.floor(st.cz) + 3, B.VAULT, 0);
    })();
    // doors: courtyard (east), Palas F3 and F4 (west, through both walls)
    clear(Math.floor(st.cx + st.r) - 1, P.yUp, Math.floor(st.cz), Math.floor(st.cx + st.r) + 1, P.yUp + 1, Math.floor(st.cz)); door(Math.floor(st.cx + st.r), P.yUp, Math.floor(st.cz), 'e');
    for (const y of [pa.f3, pa.f4]) { clear(pa.x1 - 1, y, 86, Math.floor(st.cx) - 3, y + 1, 86); door(pa.x1, y, 86, 'e'); }
    props.palms.push({ x: st.cx, y: sTop - 8, z: st.cz, top: sTop - 3 });
    lamp(Math.floor(st.cx), pa.f3 + 2, Math.floor(st.cz) - 2, true, 0.7); lamp(Math.floor(st.cx), sTop - 6, Math.floor(st.cz) + 2, true, 0.7);
    flags.push([st.cx, sTop + 18, st.cz]);
    landmarks.push({ id: 'stair', name: '主楼梯（北塔）', en: 'Main staircase · the stair tower', x: st.cx, z: st.cz, top: sTop, r: 5, tp: { mode: 'walk', p: [st.cx + 2.5, P.yUp, st.cz + 0.5], t: [st.cx, P.yUp + 8, st.cz] } });

    /* ================= the Knights' House, the Bower, the Square Tower ================= */
    function house(b, roofC, opts) {
      walls(b.x0, b.z0, b.x1, b.z1, P.yUp, b.top, B.LIME, C.lime);
      box(b.x0 + 1, P.yUp - 1, b.z0 + 1, b.x1 - 1, P.yUp - 1, b.z1 - 1, B.MARBLE, C.limeS);
      for (const y of [P.yUp + 5, P.yUp + 10]) box(b.x0 + 1, y - 1, b.z0 + 1, b.x1 - 1, y - 1, b.z1 - 1, B.PARQ, C.parq);
      for (let x = b.x0 + 2; x < b.x1 - 1; x += 3) for (const y of [P.yUp + 1, P.yUp + 6, P.yUp + 11]) { win(x, y, b.z0, 2); win(x, y, b.z1, 2); }
      for (const y of [P.yUp + 4, P.yUp + 9]) for (let x = b.x0 - 1; x <= b.x1 + 1; x++) for (const z of [b.z0 - 1, b.z1 + 1]) set(x, y, z, B.LIMES, C.limeW);
      gableRoof(b.x0, b.x1, b.z0, b.z1, b.top + 1, 1.4, 'x', C.limeW);
    }
    const kn = P.knights; house(kn); for (let x = kn.x0 + 2; x < kn.x1 - 1; x += 4) { clear(x, P.yUp, kn.z1, x + 1, P.yUp + 2, kn.z1); set(x, P.yUp + 3, kn.z1, B.LIMEC, C.limeW); }   // arcade to the courtyard
    door(kn.x0 + 1, P.yUp, kn.z1, 's');
    const bw = P.bower; house(bw); door(bw.x0 + 4, P.yUp, bw.z0, 'n');
    buildings.push({ id: 'knights', name: '骑士楼 Knights\' House', ...kn }, { id: 'bower', name: '闺房楼 Bower', ...bw });
    const sq = P.square;
    walls(sq.x0, sq.z0, sq.x1, sq.z1, P.yLow, sq.top, B.LIME, C.lime);
    for (let y = P.yLow + 4; y < sq.top - 2; y += 5) for (const [x, z] of [[(sq.x0 + sq.x1) >> 1, sq.z0], [(sq.x0 + sq.x1) >> 1, sq.z1], [sq.x0, (sq.z0 + sq.z1) >> 1], [sq.x1, (sq.z0 + sq.z1) >> 1]]) win(x, y, z, 2);
    box(sq.x0 - 1, sq.top + 1, sq.z0 - 1, sq.x1 + 1, sq.top + 1, sq.z1 + 1, B.LIMES, C.limeW);
    crenels(sq.x0 - 1, sq.z0 - 1, sq.x1 + 1, sq.z1 + 1, sq.top + 2, B.LIME, C.lime);
    for (const [x, z] of [[sq.x0, sq.z0], [sq.x1, sq.z0], [sq.x0, sq.z1], [sq.x1, sq.z1]]) tower(x + 0.5, z + 0.5, 1.6, sq.top - 4, sq.top + 3, { solid: true, cone: 6 });
    flags.push([(sq.x0 + sq.x1) / 2, sq.top + 9, (sq.z0 + sq.z1) / 2]);
    landmarks.push({ id: 'courtyard', name: '上层庭院', en: 'Upper courtyard', x: 120, z: 96, top: P.yUp + 2, r: 12, tp: { mode: 'walk', p: [128.5, P.yUp, 96.5], t: [100, 60, 92] } });

    /* ================= the lower courtyard and the Gatehouse ================= */
    // the outline of the chapel that was never built (with its apse), in pale stone in the gravel
    for (let x = 150; x <= 168; x++) for (const z of [90, 101]) set(x, P.yLow - 1, z, B.MARBLE, C.limeW);
    for (let z = 90; z <= 101; z++) { set(150, P.yLow - 1, z, B.MARBLE, C.limeW); set(168, P.yLow - 1, z, B.MARBLE, C.limeW); }
    landmarks.push({ id: 'lowercourt', name: '下层庭院（未建成的教堂地基）', en: 'Lower courtyard · the unbuilt chapel', x: 160, z: 96, top: P.yLow + 2, r: 10, tp: { mode: 'walk', p: [172.5, P.yLow, 96.5], t: [120, 60, 92] } });
    // curtain walls with walkways and crenels along both sides of both courtyards
    for (const z of [PL.z0 + 1, PL.z1 - 1]) for (let x = 143; x < P.gate.x0; x++) { const y0 = P.yLow; box(x, y0, z, x, y0 + 5, z, B.LIME, C.lime); if (x & 1) set(x, y0 + 6, z, B.LIME, C.lime); }
    const gt = P.gate;
    walls(gt.x0, gt.z0, gt.x1, gt.z1, P.yLow, gt.top, B.BRICK, C.brick);
    for (const y of [P.yLow + 6, P.yLow + 12]) box(gt.x0 + 1, y - 1, gt.z0 + 1, gt.x1 - 1, y - 1, gt.z1 - 1, B.PARQ, C.parq);
    for (const y of [P.yLow + 5, P.yLow + 11, gt.top]) for (let z = gt.z0 - 1; z <= gt.z1 + 1; z++) for (const x of [gt.x0 - 1, gt.x1 + 1]) set(x, y, z, B.LIMES, C.limeW);
    for (let z = gt.z0 + 2; z < gt.z1 - 1; z += 3) for (const y of [P.yLow + 7, P.yLow + 13]) { win(gt.x0, y, z, 2); win(gt.x1, y, z, 2); }
    // the gate passage through the middle (a tall arch), its gates open
    clear(gt.x0, P.yLow, 93, gt.x1, P.yLow + 4, 99);
    for (let x = gt.x0; x <= gt.x1; x++) { set(x, P.yLow + 5, 93, B.LIMEC, C.limeW); set(x, P.yLow + 5, 99, B.LIMEC, C.limeW); for (let z = 94; z <= 98; z++) set(x, P.yLow - 1, z, B.PATH, C.limeS); }
    for (let z = 93; z <= 99; z++) for (const x of [gt.x0, gt.x1]) set(x, P.yLow + 5, z, B.LIMEC, C.limeW);
    for (let x = gt.x0 + 1; x < gt.x1; x++) for (let z = 93; z <= 99; z++) set(x, P.yLow + 5, z, B.VAULT, 0);
    lamp(gt.x0 + 3, P.yLow + 3, 96, false, 1); lamp(gt.x1 - 3, P.yLow + 3, 96, false, 1);
    gableRoof(gt.x0, gt.x1, gt.z0, gt.z1, gt.top + 1, 1.2, 'z', C.brick);
    for (const z of [gt.z0, gt.z1]) { const x0 = gt.x0 - 2, z0 = z - 2; walls(x0, z0, x0 + 4, z0 + 4, P.yLow - 6, gt.top + 6, B.BRICK, C.brickD); box(x0 - 1, gt.top + 7, z0 - 1, x0 + 5, gt.top + 7, z0 + 5, B.LIMES, C.limeW); crenels(x0 - 1, z0 - 1, x0 + 5, z0 + 5, gt.top + 8, B.BRICK, C.brick); win(x0, gt.top + 1, z0 + 2, 2); win(x0, P.yLow + 4, z0 + 2, 2); }
    for (const z of [gt.z0, gt.z1]) { const x1 = gt.x1 + 2, z0 = z - 2; walls(x1 - 4, z0, x1, z0 + 4, P.yLow - 6, gt.top + 4, B.BRICK, C.brickD); box(x1 - 5, gt.top + 5, z0 - 1, x1 + 1, gt.top + 5, z0 + 5, B.LIMES, C.limeW); crenels(x1 - 5, z0 - 1, x1 + 1, z0 + 5, gt.top + 6, B.BRICK, C.brick); }
    flags.push([gt.x0, gt.top + 14, gt.z0]); flags.push([gt.x0, gt.top + 14, gt.z1]);
    buildings.push({ id: 'gate', name: '门楼 Gatehouse', ...gt, y: P.yLow });
    landmarks.push({ id: 'gate', name: '城门楼', en: 'Torbau · Gatehouse', x: gt.x1 + 4, z: 96, top: P.yLow + 4, r: 9, tp: { mode: 'walk', p: [gt.x1 + 6.5, P.yLow, 96.5], t: [gt.x0, P.yLow + 8, 96] } });
    // lanterns in the courtyards, a path of cobbles from the gate to the Palas door
    for (let x = 102; x < gt.x0; x++) for (let z = 94; z <= 98; z++) if (get(x, x >= 142 ? P.yLow - 1 : P.yUp - 1, z) === B.GRAVEL) set(x, x >= 142 ? P.yLow - 1 : P.yUp - 1, z, B.PATH, C.limeS);
    for (const [x, y] of [[112, P.yUp], [128, P.yUp], [150, P.yLow], [170, P.yLow]]) for (const z of [92, 100]) { box(x, y, z, x, y + 2, z, B.IRON, C.iron); set(x, y + 3, z, B.LAMP, 0); lamp(x, y + 3, z, false, 1); }
    for (let x = 102; x < 140; x++) for (let z = 94; z <= 98; z++) { const i = zi(x, z); pathM[i] = 1; hm[i] = P.yUp; }
    for (let x = 145; x < gt.x0; x++) for (let z = 94; z <= 98; z++) { const i = zi(x, z); pathM[i] = 1; hm[i] = P.yLow; }

    /* ================= Marienbruecke: an iron truss bridge over the gorge ================= */
    const br = P.bridge;
    for (let z = br.z0; z <= br.z1; z++) {
      for (let x = br.x - 1; x <= br.x + 1; x++) { set(x, br.y - 1, z, B.PLANKS, C.oak); for (let y = br.y; y < br.y + 4; y++) if (get(x, y, z) !== B.IRON) set(x, y, z, B.AIR, 0); }
      for (const x of [br.x - 2, br.x + 2]) { set(x, br.y - 1, z, B.IRON, C.iron); if (z % 3 === 0) set(x, br.y, z, B.IRON, C.iron); set(x, br.y + 1, z, B.BALUS, C.iron); }   // posts and a lattice rail
      if (z % 2 === 0) for (let x = br.x - 2; x <= br.x + 2; x++) set(x, br.y - 2, z, B.IRON, C.iron);
    }
    for (const z of [br.z0 + 6, br.z1 - 6]) for (let y = 20; y < br.y - 2; y++) { set(br.x - 2, y, z, B.IRON, C.iron); set(br.x + 2, y, z, B.IRON, C.iron); }
    landmarks.push({ id: 'bridge', name: '玛丽恩桥', en: 'Marienbrücke · Queen Mary\'s Bridge', x: br.x, z: (br.z0 + br.z1) / 2, top: br.y + 2, r: 9, tp: { mode: 'walk', p: [br.x + 0.5, br.y, br.z1 - 4.5], t: [80, 62, 92] } });
    for (let z = br.z0; z <= br.z1; z++) { const i = zi(br.x, z); hm[i] = br.y; pathM[i] = 1; }

    /* ================= Hohenschwangau (the yellow castle of Ludwig's childhood), far below ================= */
    { const hx = P.hohen.x, hz = P.hohen.z, hy = 26; box(hx - 9, hy - 8, hz - 6, hx + 9, hy - 1, hz + 6, B.LIME, C.limeS); walls(hx - 8, hz - 5, hx + 8, hz + 5, hy, hy + 9, B.PLASTER, C.yellow); box(hx - 7, hy - 1, hz - 4, hx + 7, hy - 1, hz + 4, B.PLASTER, C.yellow);
      for (let x = hx - 6; x <= hx + 6; x += 3) { win(x, hy + 2, hz - 5, 2); win(x, hy + 6, hz - 5, 2); win(x, hy + 2, hz + 5, 2); }
      crenels(hx - 8, hz - 5, hx + 8, hz + 5, hy + 10, B.PLASTER, C.yellow);
      for (const [x, z] of [[hx - 8, hz - 5], [hx + 8, hz - 5], [hx + 8, hz + 5]]) { for (let y = hy; y < hy + 14; y++) for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) set(x + dx, y, z + dz, B.PLASTER, C.yellow); crenels(x - 1, z - 1, x + 1, z + 1, hy + 14, B.PLASTER, C.yellow); }
      landmarks.push({ id: 'hohen', name: '旧天鹅堡', en: 'Hohenschwangau', x: hx, z: hz, top: hy + 10, r: 10, tp: { mode: 'fly', p: [hx + 24, 40, hz + 24], t: [hx, 30, hz] } }); }

    /* ================= forest ================= */
    function spruce(x, z) {
      const y = hm[zi(x, z)], hgt = RI(8, 14); if (y + hgt >= H - 2) return;
      for (let k = 0; k < hgt - 1; k++) set(x, y + k, z, B.BARK, C.bark);
      const pc = pick(C.pine);
      for (let k = 2; k <= hgt; k++) { const r = Math.max(0, Math.round((hgt - k) / 3.1)); for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) { if (Math.abs(dx) + Math.abs(dz) > r + (r > 1 ? 1 : 0)) continue; if (dx === 0 && dz === 0 && k < hgt - 1) continue; if (isAir(x + dx, y + k, z + dz)) set(x + dx, y + k, z + dz, B.PINE, pc); } }
    }
    function beech(x, z) {
      const y = hm[zi(x, z)], hgt = RI(6, 9); if (y + hgt + 3 >= H - 2) return; for (let k = 0; k < hgt - 2; k++) set(x, y + k, z, B.BARK, C.bark);
      const pc = pick(C.beech), r = RI(2, 3);
      for (let dy = -1; dy <= 2; dy++) for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) { if (dx * dx + dz * dz + dy * dy * 2 > r * r + 1 || hash3(x + dx, y + dy, z + dz) < 0.12) continue; const yy = y + hgt - 2 + dy; if (isAir(x + dx, yy, z + dz)) set(x + dx, yy, z + dz, B.BEECH, pc); }
    }
    for (let t = 0; t < 5200; t++) {
      const x = RI(2, W - 3), z = RI(2, D - 3), i = zi(x, z), y = hm[i];
      if (occ[i] || pathM[i] || y <= WATER_Y + 1) continue;
      if (x >= PL.x0 - 2 && x <= PL.x1 + 2 && z >= PL.z0 - 2 && z <= PL.z1 + 2) continue;
      if (Math.abs(x - br.x) < 5 && z > 110 && z < 165) continue;
      const top = get(x, y - 1, z); if (top !== B.GRASS && top !== B.MEADOW && top !== B.ROCK) continue;
      const forest = fbm(x / 20, z / 20, 61, 3), dens = (z > 140 || (z < 72 && z > 40) || forest > 0.56) ? 0.7 : 0.05;
      if (rnd() > dens || (top === B.ROCK && rnd() < 0.7)) continue;
      let ok = true; for (let dz = -2; dz <= 2 && ok; dz++) for (let dx = -2; dx <= 2; dx++) if (get(x + dx, y, z + dz) === B.BARK) { ok = false; break; }
      if (!ok) continue;
      if (y > 30 || rnd() < 0.55) spruce(x, z); else beech(x, z);
      occ[i] = 3;
    }
    for (let t = 0; t < 800; t++) { const x = RI(2, W - 3), z = RI(2, 70), i = zi(x, z), y = hm[i]; if (!occ[i] && !pathM[i] && get(x, y - 1, z) === B.MEADOW && isAir(x, y, z)) set(x, y, z, B.FLOWER, 0); }

    /* ================= derived ================= */
    { const seen = {}; for (let i = doors.length - 1; i >= 0; i--) { const k = doors[i].x + ',' + doors[i].y + ',' + doors[i].z; if (seen[k] || get(doors[i].x, doors[i].y, doors[i].z) !== B.DOOR) doors.splice(i, 1); else seen[k] = 1; } }
    const walk = new Uint8Array(W * D);
    for (let i = 0; i < W * D; i++) if (pathM[i]) { const x = i % W, z = (i / W) | 0, y = hm[i]; if (get(x, y - 1, z) !== B.AIR && get(x, y, z) === B.AIR && get(x, y + 1, z) === B.AIR) walk[i] = 1; }
    const topH = new Uint8Array(W * D), topB = new Uint8Array(W * D), topC = new Uint8Array(W * D);
    for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) for (let y = H - 1; y >= 0; y--) { const b = blocks[idx(x, y, z)]; if (b) { topH[zi(x, z)] = y; topB[zi(x, z)] = b; topC[zi(x, z)] = cols[idx(x, y, z)]; break; } }
    const spawn = { x: gt.x1 + 4.5, y: P.yLow, z: 96.5, yaw: Math.PI / 2 };
    const tour = {
      cam: [[64, 52, 158], [20, 70, 150], [10, 66, 60], [70, 76, 30], [150, 80, 40], [236, 60, 110], [200, 54, 150], [110, 58, 150]],
      tgt: [[80, 60, 94], [70, 58, 94], [72, 58, 96], [80, 60, 94], [110, 54, 96], [150, 50, 96], [110, 56, 96], [80, 60, 94]],
      dur: 150
    };
    return {
      W, D, H, BASE: 16, GY: 15, WATER_Y, blocks, cols, palette, pal, get, set, idx, inb, B, BI, P,
      hm, walk, occ, land: null, topH, topB, topC, landmarks, lamps, flags, chimneys, doors, seats, pasture: [], buildings, props,
      spawn, tour, lake: { x: LK.x, z: LK.z, w: LK.rx * 2.2, d: LK.rz * 2.2 }, moorings: []
    };
  }

  root.NSWorld = { W, D, H, WATER_Y, B, BI, T, P, create, hash3, mulberry32 };
  if (typeof module !== 'undefined') module.exports = root.NSWorld;
})(typeof window !== 'undefined' ? window : globalThis);
