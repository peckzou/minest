/* Bibury — voxel world generator (no DOM / no THREE dependency). Exposes BBWorld = { W, D, H, B, BI, T, create(seed) }.
 * 1 voxel = 1 m. x east, z south, y up. hm[x,z] = first air cell above the ground.
 * The Cotswold village on the River Coln (Gloucestershire): Arlington Row (built about 1380 as a monastic wool store, turned into
 * weavers' cottages in the 17th century) along the lane on Awkward Hill, the leat and the Rack Isle water meadow in front of it,
 * the Coln with its stone bridge, Arlington Mill, the trout farm, the Swan Hotel, St Mary's church and its churchyard, cottages up
 * Awkward Hill and along the road, fields with dry-stone walls on the wolds.
 * Everything is built from whole modules (a cottage, a dormer, a roof, an inn, a mill, a church, a bridge, a pond, furniture),
 * never block by block. The smooth stone-tile roof planes, gable infills, ivy, reeds, fences, swans and candles are listed in
 * world.props and drawn by props.js; the voxels under them carry the collision and the stepped fill. */
(function (root) {
  'use strict';
  const W = 256, D = 240, H = 80;
  const WATER_Y = 38.6;   // the Coln, the leat, the trout ponds

  const T = {
    grass: 0, grassSide: 1, dirt: 2, rock: 3, rubble: 4, slates: 5, path: 6, gravel: 7,
    pine: 8, bark: 9, trunkTop: 10, beech: 11, brook: 12, ashlar: 13, limeSmooth: 14, limeCarved: 15,
    brick: 16, slate: 17, glass: 18, door: 19, gold: 20, marble: 21, drystone: 22, coping: 23,
    oak: 24, oakCarved: 25, parquet: 26, plaster: 27, beams: 28, coffer: 29, carpet: 30, lamp: 31,
    wool: 32, planks: 33, curtain: 34, dresser: 35, moss: 36, iron: 37, balus: 38, meadow: 39,
    stove: 40, stained: 41, books: 42, fire: 43, flower: 44, fall: 45, tarmac: 46, flagstone: 47,
    bath: 48, wheat: 49, loom: 50, lead: 51, hedge: 52, silk: 53, cedar: 54, rug: 55,
    ivy: 56, casement: 57, yew: 58, willow: 59, sack: 60, millstone: 61, hood: 62, bottles: 63
  };
  const B = {
    AIR: 0, GRASS: 1, DIRT: 2, ROCK: 3, SNOW: 4, PATH: 5, GRAVEL: 6, PINE: 7, BARK: 8, BEECH: 9, BROOK: 10,
    LIME: 11, LIMES: 12, LIMEC: 13, BRICK: 14, SLATE: 15, GLASS: 16, DOOR: 17, GOLD: 18, MARBLE: 19, PORPH: 20, LAPIS: 21,
    OAK: 22, OAKC: 23, PARQ: 24, PLASTER: 25, VAULT: 26, COFFER: 27, CARPET: 28, LAMP: 29, BED: 30, TABLE: 31, CHAIR: 32,
    BENCH: 33, CURTAIN: 34, TUFF: 35, MOSS: 36, IRON: 37, BALUS: 38, MEADOW: 39, STOVE: 40, MURAL: 41, BOOKS: 42, FIRE: 43,
    FLOWER: 44, FALL: 45, MOSAIC: 46, GMOS: 47, MARBLEV: 48, PLANKS: 49,
    BATH: 50, BATHC: 51, WHEAT: 52, LEATHER: 53, LEAD: 54, HEDGE: 55, SILK: 56, CEDAR: 57, CHEQ: 58, SOFA: 59, PIANO: 60,
    ROOF: 61, RUBBLE: 62, DRYW: 63, LANE: 64, FLAGS: 65, BEAM: 66, DRESSER: 67, LOOM: 68, STAINED: 69, CASE: 70,
    YEW: 71, WILLOW: 72, SACK: 73, MILLST: 74, IVY: 75, HOOD: 76, BOTTLES: 77, RUG: 78
  };
  const BI = [];
  function def(id, name, top, side, bottom, glow, jit, lit) { BI[id] = { name, top, side, bottom: bottom == null ? side : bottom, glow: !!glow, lit: !!lit, jit: jit == null ? 0.07 : jit }; }
  def(B.AIR, 'air', 0, 0);
  def(B.GRASS, 'grass', T.grass, T.grassSide, T.dirt, false, 0.1);
  def(B.MEADOW, 'water meadow', T.meadow, T.grassSide, T.dirt, false, 0.1);
  def(B.DIRT, 'earth', T.dirt, T.dirt, T.dirt, false, 0.1);
  def(B.ROCK, 'oolitic limestone', T.rock, T.rock, T.rock, false, 0.1);
  def(B.PATH, 'cobbles', T.path, T.rock, T.rock, false, 0.05);
  def(B.GRAVEL, 'gravel / river bed', T.gravel, T.gravel, T.gravel, false, 0.1);
  def(B.BEECH, 'leaves', T.beech, T.beech, T.beech, false, 0.16);
  def(B.BARK, 'trunk', T.trunkTop, T.bark, T.trunkTop, false, 0.08);
  def(B.BROOK, 'water', T.brook, T.brook, T.brook, false, 0.06);
  def(B.LIME, 'dressed stone', T.ashlar, T.ashlar, T.ashlar, false, 0.035);
  def(B.LIMES, 'smooth stone', T.limeSmooth, T.limeSmooth, T.limeSmooth, false, 0.03);
  def(B.LIMEC, 'carved stone', T.limeSmooth, T.limeCarved, T.limeSmooth, false, 0.03);
  def(B.GLASS, 'window', T.glass, T.glass, T.glass, true, 0);
  def(B.DOOR, 'door', T.door, T.door, T.door, false, 0.02);
  def(B.GOLD, 'brass', T.gold, T.gold, T.gold, false, 0.04);
  def(B.MARBLE, 'marble', T.marble, T.marble, T.marble, false, 0.03);
  def(B.OAK, 'oak', T.oak, T.oak, T.oak, false, 0.04);
  def(B.OAKC, 'carved oak', T.oakCarved, T.oakCarved, T.oakCarved, false, 0.04);
  def(B.PLASTER, 'limewash', T.plaster, T.plaster, T.plaster, false, 0.02);
  def(B.CARPET, 'carpet', T.carpet, T.oak, T.oak, false, 0.02);
  def(B.LAMP, 'lantern', T.lamp, T.lamp, T.lamp, true, 0);
  def(B.BED, 'bed', T.wool, T.oakCarved, T.oak, false, 0.02);
  def(B.TABLE, 'table', T.oak, T.oakCarved, T.oak, false, 0.03);
  def(B.CHAIR, 'chair', T.curtain, T.oakCarved, T.oak, false, 0.03);
  def(B.BENCH, 'bench / pew', T.oak, T.oakCarved, T.oak, false, 0.03);
  def(B.CURTAIN, 'altar cloth', T.curtain, T.curtain, T.curtain, false, 0.03);
  def(B.MOSS, 'moss', T.moss, T.moss, T.moss, false, 0.14);
  def(B.IRON, 'iron / louvres', T.iron, T.iron, T.iron, false, 0.04);
  def(B.BALUS, 'banister', T.oak, T.balus, T.oak, false, 0.02);
  def(B.STOVE, 'range', T.stove, T.stove, T.stove, false, 0.02);
  def(B.BOOKS, 'bookshelf', T.oak, T.books, T.oak, false, 0.02);
  def(B.FIRE, 'hearth fire', T.fire, T.fire, T.fire, false, 0, true);
  def(B.FLOWER, 'flowers', T.flower, T.flower, T.flower, false, 0.1);
  def(B.PLANKS, 'boards', T.planks, T.planks, T.planks, false, 0.06);
  def(B.BATH, 'honey ashlar', T.bath, T.bath, T.bath, false, 0.035);
  def(B.WHEAT, 'rape / barley', T.wheat, T.wheat, T.dirt, false, 0.08);
  def(B.LEAD, 'lead', T.lead, T.lead, T.lead, false, 0.04);
  def(B.HEDGE, 'shrub', T.hedge, T.hedge, T.hedge, false, 0.12);
  def(B.SOFA, 'armchair / settle', T.curtain, T.curtain, T.oak, false, 0.03);
  def(B.ROOF, 'stone-tile roof', T.slates, T.slates, T.beams, false, 0.05);
  def(B.RUBBLE, 'Cotswold stone', T.rubble, T.rubble, T.rubble, false, 0.03);
  def(B.DRYW, 'dry-stone wall', T.coping, T.drystone, T.drystone, false, 0.06);
  def(B.LANE, 'lane', T.tarmac, T.rock, T.rock, false, 0.03);
  def(B.FLAGS, 'flagstones', T.flagstone, T.rubble, T.rubble, false, 0.03);
  def(B.BEAM, 'boards on oak beams', T.planks, T.oak, T.beams, false, 0.02);
  def(B.DRESSER, 'dresser', T.oak, T.dresser, T.oak, false, 0.02);
  def(B.LOOM, 'hand loom', T.oak, T.loom, T.oak, false, 0.02);
  def(B.STAINED, 'stained glass', T.stained, T.stained, T.stained, false, 0, true);
  def(B.CASE, 'leaded casement', T.casement, T.casement, T.casement, true, 0);
  def(B.YEW, 'yew', T.yew, T.yew, T.yew, false, 0.14);
  def(B.WILLOW, 'willow', T.willow, T.willow, T.willow, false, 0.14);
  def(B.SACK, 'flour sacks', T.sack, T.sack, T.sack, false, 0.05);
  def(B.MILLST, 'millstone', T.millstone, T.rock, T.millstone, false, 0.03);
  def(B.IVY, 'ivy', T.ivy, T.ivy, T.ivy, false, 0.12);
  def(B.HOOD, 'drip mould', T.limeSmooth, T.hood, T.limeSmooth, false, 0.02);
  def(B.BOTTLES, 'bar shelves', T.oak, T.bottles, T.oak, false, 0.02);
  def(B.RUG, 'rag rug', T.rug, T.oak, T.beams, false, 0.02);

  function mulberry32(a) { return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function hash3(x, y, z) { let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(z | 0, 2147483647); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
  function vnoise(x, z, s) { const xi = Math.floor(x), zi = Math.floor(z), fx = x - xi, fz = z - zi, u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz);
    const a = hash3(xi, s, zi), b = hash3(xi + 1, s, zi), c = hash3(xi, s, zi + 1), d = hash3(xi + 1, s, zi + 1); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; }
  function fbm(x, z, s, oct) { let v = 0, a = 0.5, f = 1, n = 0; for (let i = 0; i < (oct || 4); i++) { v += vnoise(x * f, z * f, s + i * 17) * a; n += a; a *= 0.5; f *= 2; } return v / n; }
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const lerp = (a, b, t) => a + (b - a) * t;
  const yawOf = (dx, dz) => Math.atan2(-dx, -dz);   // the camera yaw that looks along (dx, dz)

  /* the plan (rounded to whole metres; see README for what is estimated) */
  const RIVER = [[-6, 58], [30, 60], [60, 66], [100, 70], [140, 72], [170, 76], [192, 84], [206, 100], [213, 122], [222, 160], [236, 200], [250, 246]];
  const LEAT = [[44, 63], [48, 88], [54, 110], [70, 113], [150, 113], [190, 112], [203, 108], [210, 103]];   // the mill stream along Rack Isle
  const RACK = [[44, 64], [60, 66], [100, 70], [140, 72], [170, 76], [192, 84], [206, 100], [210, 103], [203, 108], [190, 112], [150, 113], [70, 113], [54, 110], [48, 88]];
  const P = {
    row: { x0: 80, n: 10, zf: 123 },                       // Arlington Row: ten cottages, the front wall on z 123, facing north over the lane
    lane: { z: 119 },
    bridge: { x0: 204, x1: 224, z0: 117, z1: 121, y: 41 },
    mill: { x0: 36, x1: 52, z0: 47, z1: 55 },
    trout: { x0: 66, x1: 154, z0: 10, z1: 42 },
    swan: { x0: 232, x1: 242, z0: 102, z1: 124 },
    church: { x0: 206, x1: 246, z0: 32, z1: 44 },
    yard: { x0: 200, x1: 252, z0: 20, z1: 64 }
  };
  const laneY = (x) => 41 + smooth(152, 76, x) * 3 + smooth(76, 26, x) * 4;   // the lane climbs Awkward Hill westward

  function segD(px, pz, pts) { let b = 1e9; for (let i = 0; i < pts.length - 1; i++) { const ax = pts[i][0], az = pts[i][1], dx = pts[i + 1][0] - ax, dz = pts[i + 1][1] - az, t = clamp(((px - ax) * dx + (pz - az) * dz) / (dx * dx + dz * dz), 0, 1); b = Math.min(b, Math.hypot(px - ax - dx * t, pz - az - dz * t)); } return b; }
  function inPoly(px, pz, poly) { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const a = poly[i], b = poly[j]; if ((a[1] > pz) !== (b[1] > pz) && px < (b[0] - a[0]) * (pz - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; }

  function create(seed) {
    seed = seed == null ? 1380 : seed;   // 1380: the wool store that became Arlington Row
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
      stone: [pal(0.86, 0.8, 0.69), pal(0.83, 0.78, 0.67), pal(0.89, 0.83, 0.71), pal(0.8, 0.76, 0.66), pal(0.87, 0.82, 0.73)],
      stoneL: pal(0.95, 0.91, 0.82), stoneD: pal(0.72, 0.67, 0.58), honey: pal(0.96, 0.85, 0.65), honeyL: pal(1.0, 0.92, 0.76), church: pal(0.9, 0.85, 0.74),
      roofV: pal(0.74, 0.72, 0.66), flag: pal(0.86, 0.82, 0.74), beam: pal(1.0, 0.96, 0.9),
      oak: pal(0.5, 0.33, 0.19), oakD: pal(0.32, 0.21, 0.12), oakL: pal(0.66, 0.48, 0.3), white: pal(0.97, 0.96, 0.92),
      cream: pal(0.94, 0.88, 0.74), red: pal(0.62, 0.16, 0.16), crimson: pal(0.7, 0.2, 0.22), green: pal(0.4, 0.56, 0.42), blue: pal(0.36, 0.46, 0.66), rose: pal(0.84, 0.62, 0.6),
      grass: pal(0.92, 1, 0.9), marsh: pal(0.86, 0.98, 0.76), hedge: pal(0.36, 0.54, 0.3), hedgeD: pal(0.26, 0.42, 0.24), photinia: pal(0.78, 0.24, 0.26), box: pal(0.3, 0.46, 0.26),
      rape: pal(1.0, 0.94, 0.32), rock: pal(0.86, 0.82, 0.72), gravel: pal(0.86, 0.82, 0.74), lane: pal(0.92, 0.92, 0.95), bed: pal(0.6, 0.64, 0.5), weed: pal(0.42, 0.58, 0.34),
      bark: pal(0.56, 0.46, 0.36), iron: pal(0.3, 0.3, 0.32), dry: pal(0.88, 0.84, 0.74), yew: pal(0.3, 0.42, 0.28), willow: pal(0.82, 0.94, 0.56),
      leaf: [pal(0.42, 0.6, 0.3), pal(0.36, 0.54, 0.28), pal(0.5, 0.66, 0.32), pal(0.46, 0.62, 0.36)],
      doors: [pal(0.62, 0.72, 0.6), pal(0.62, 0.74, 0.78), pal(0.92, 0.88, 0.76), pal(0.52, 0.58, 0.42), pal(0.46, 0.54, 0.66), pal(0.36, 0.44, 0.38), pal(0.72, 0.4, 0.32)]
    };
    const landmarks = [], lamps = [], doors = [], seats = [], flags = [], buildings = [], chimneys = [], pasture = [], checks = [];
    const props = { chandeliers: [], murals: [], apse: null, mosaic: [], palms: [], swans: [], ducks: [], candles: [], canopies: [], roofs: [], pots: [], creepers: [], tufts: [], fences: [], fish: [] };
    function lamp(x, y, z, room, inten) { lamps.push([x + 0.5, y + 0.5, z + 0.5, room ? 1 : 0, inten || 1]); }
    function seat(x, y, z, yaw) { seats.push({ x: x + 0.5, y: y + 1, z: z + 0.5, yaw: yaw || 0 }); }
    function door(x, y, z, face, c) { doors.push({ x, y, z, face, open: false, col: c }); }   // the leaves are set at the end
    function mural(x, y, z, w, h, face, theme) { props.murals.push({ x, y, z, w, h, face, theme }); }
    const chimSeen = {};
    function chimney(x, z, y0, y1, c, smoke) {   // a stack with a cap and a clay pot; smoke when a fire burns below
      for (let y = y0; y < y1; y++) set(x, y, z, B.RUBBLE, c); set(x, y1, z, B.LIMES, C.stoneL);
      const k = x + ',' + z; if (chimSeen[k]) return; chimSeen[k] = 1;
      props.pots.push([x + 0.5, y1 + 1, z + 0.5]); if (smoke) chimneys.push([x + 0.5, y1 + 1.6, z + 0.5]);
    }

    /* ================= the valley: the Coln, the leat, Rack Isle, Awkward Hill, the wolds ================= */
    const hf = new Float32Array(W * D), hm = new Uint8Array(W * D), occ = new Uint8Array(W * D), pathM = new Uint8Array(W * D);
    const DR = new Float32Array(W * D), DL = new Float32Array(W * D), RK = new Uint8Array(W * D);
    for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
      const i = zi(x, z), dR = segD(x, z, RIVER), dL = segD(x, z, LEAT); DR[i] = dR; DL[i] = dL;
      let h = 41.2 + (fbm(x / 40, z / 40, 3, 4) - 0.5) * 2.4 + smooth(32, 0, z) * 3.5 + smooth(64, 0, x) * 4.5 + smooth(136, 232, z) * 11 * (0.7 + fbm(x / 60, z / 60, 9, 2) * 0.6);
      const rack = inPoly(x + 0.5, z + 0.5, RACK); RK[i] = rack ? 1 : 0;
      if (rack) h = 40 + (fbm(x / 9, z / 9, 41, 2) - 0.5) * 0.8;                                         // the water meadow, just above the river
      if (x >= 50 && x <= 212 && z >= 113 && z < 116.5 && !rack) h = lerp(40, laneY(x), smooth(113.5, 116.5, z));   // the grass bank down to the leat
      if (x >= 50 && x <= 212 && z >= 116.5 && z <= 121.5) h = laneY(x);                               // the lane
      else if (x >= 50 && x <= 212 && z > 121.5 && z < 148) { const ly = laneY(x); h = ly + Math.max(0, h - ly) * smooth(121.5, 148, z); }
      { const t = P.trout, e = Math.min(x - t.x0, t.x1 - x, z - t.z0, t.z1 - z); if (e > -6) h = lerp(h, 40.2, smooth(-6, 2, e)); }
      if (dR < 6.5) h = Math.min(h, 39.3); else if (dR < 14 && h > 39.3) h = 39.3 + (h - 39.3) * smooth(6.5, 14, dR);
      if (dR < 4.4) h = 36.6 + dR * 0.22;
      if (dL < 2.3) h = Math.min(h, 39.3); if (dL < 1.4) h = 37.4;
      hf[i] = Math.max(36, h);
    }
    for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
      const i = zi(x, z), h = Math.round(hf[i]);
      for (let y = 0; y < h; y++) {
        let id = B.ROCK, c = C.rock;
        if (y >= h - 3) { id = B.DIRT; c = 0; }
        if (y === h - 1) {
          if (h <= 38) { id = B.GRAVEL; c = hash3(x, 7, z) < 0.35 ? C.weed : C.bed; }   // the clear chalk-stream bed with water crowfoot
          else if (RK[i]) { id = B.MEADOW; c = C.marsh; } else { id = B.GRASS; c = C.grass; }
        }
        set(x, y, z, id, c);
      }
      hm[i] = h;
    }
    // the wolds beyond: fields of rape, barley and pasture inside dry-stone walls
    const fieldAt = (x, z) => hash3(Math.floor((x + 9) / 36), 3, Math.floor((z + 4) / 30));
    for (let z = 1; z < D - 1; z++) for (let x = 1; x < W - 1; x++) {
      const field = z > 152 || (z < 9 && x < 196) || (x < 16 && z > 30 && z < 100); if (!field) continue;
      const i = zi(x, z), y = hm[i]; if (DR[i] < 8 || get(x, y - 1, z) !== B.GRASS) continue;
      if ((x + 9) % 36 === 0 || (z + 4) % 30 === 0) { set(x, y, z, B.DRYW, C.dry); occ[i] = 1; continue; }
      const k = fieldAt(x, z);
      if (k < 0.28) set(x, y - 1, z, B.WHEAT, C.rape); else if (k < 0.48) set(x, y - 1, z, B.MEADOW, C.grass); else if (k > 0.6) pasture.push([x, z]);
    }

    /* ================= roads, the lane, paths ================= */
    function road(pts, w, id, c) {
      for (let s = 0; s < pts.length - 1; s++) {
        const a = pts[s], b = pts[s + 1], n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) * 2);
        for (let k = 0; k <= n; k++) {
          const t = k / n, cx = a[0] + (b[0] - a[0]) * t, cz = a[1] + (b[1] - a[1]) * t;
          for (let dz = -w; dz <= w; dz++) for (let dx = -w; dx <= w; dx++) {
            if (dx * dx + dz * dz > w * w + 0.5) continue; const x = Math.round(cx + dx), z = Math.round(cz + dz); if (x < 0 || x >= W || z < 0 || z >= D) continue;
            const i = zi(x, z); if (hm[i] <= 38) continue;   // bridges carry roads over water
            set(x, hm[i] - 1, z, id || B.LANE, c == null ? C.lane : c);
            for (let y = hm[i]; y < hm[i] + 3; y++) { const q = get(x, y, z); if (q === B.HEDGE || q === B.WHEAT || q === B.DRYW) set(x, y, z, B.AIR, 0); }
            pathM[i] = 1; occ[i] = 1;
          }
        }
      }
    }
    road([[0, 40], [40, 42], [80, 45], [120, 47], [160, 50], [184, 58], [200, 72], [214, 88], [224, 106], [228, 122], [232, 150], [238, 190], [244, 239]], 2);   // the B4425 through the village
    road([[203, 119], [56, 119], [44, 122], [36, 130], [32, 146], [30, 175], [26, 239]], 2);                                                                // Arlington: the lane along the Row and up Awkward Hill
    road([[190, 61], [199, 53], [216, 53], [224, 50]], 1, B.GRAVEL, C.gravel);                                                                                 // the churchyard path to the porch
    road([[110, 46], [110, 41]], 1, B.GRAVEL, C.gravel);                                                                                                       // into the trout farm

    /* ================= building helpers ================= */
    const SOFT = new Uint8Array(256); for (const b of [B.GRASS, B.DIRT, B.ROCK, B.MEADOW, B.GRAVEL, B.BEECH, B.BARK, B.WILLOW, B.YEW, B.HEDGE, B.FLOWER, B.WHEAT, B.DRYW, B.LANE]) SOFT[b] = 1;
    function level(x0, z0, x1, z1, y, topId, topC) {   // a level plot: earth up to y, a top block, nothing above
      for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) {
        if (x < 0 || z < 0 || x >= W || z >= D) continue; const i = zi(x, z);
        for (let yy = Math.min(hm[i], y) - 1; yy <= y - 2; yy++) set(x, yy, z, B.DIRT, 0);
        set(x, y - 1, z, topId, topC); hm[i] = y; occ[i] = 1;
        for (let yy = y; yy <= y + 18; yy++) if (SOFT[get(x, yy, z)]) set(x, yy, z, B.AIR, 0);   // terrain and plants go; a neighbour's walls stay
      }
    }
    // a pitched roof: stepped voxels under the plane (collision, the ceiling inside), the smooth plane itself is drawn by props.js
    function roof(x0, z0, x1, z1, axis, y0, s, wallId, wallC, o) {
      o = o || {};
      const ax = axis === 'x', a0 = ax ? x0 : z0, a1 = ax ? x1 : z1, b0 = ax ? z0 : x0, b1 = ax ? z1 : x1;
      for (let a = a0; a <= a1; a++) for (let b = b0; b <= b1; b++) {
        const d = Math.min(b - b0, b1 - b), top = y0 + Math.floor(s * d + 1e-6);
        const gable = (a === a0 && o.g0 !== false) || (a === a1 && o.g1 !== false);
        for (let y = y0; y < top; y++) { const x = ax ? a : b, z = ax ? b : a; set(x, y, z, gable ? wallId : B.ROOF, gable ? wallC : C.roofV); }
      }
      props.roofs.push({ x0, z0, x1, z1, axis, y0, s, ov: o.ov == null ? 0.32 : o.ov, og: o.og == null ? 0.16 : o.og, e0: o.e0 || 0, e1: o.e1 || 0,
        g0: o.g0 !== false, g1: o.g1 !== false, c: o.c || [0.84, 0.81, 0.74], gc: palette[wallC] || [1, 1, 1], gt: o.gt || 'rubble' });
    }
    const faceOf = (dx, dz) => dx > 0 ? '+x' : dx < 0 ? '-x' : dz > 0 ? '+z' : '-z';
    function wallPlane(list, x, z, dx, dz, y, w, h, along, extra) {   // a plane on the face of wall cell (x, z) looking along (dx, dz); w cells along `along`
      const face = faceOf(dx, dz), e = Object.assign({ x: x + (dx > 0 ? 1 : 0), y, z: z + (dz > 0 ? 1 : 0), w, h, face }, extra || {});
      if (along[0] < 0) e.x -= w - 1; if (along[1] < 0) e.z -= w - 1;
      if (face === '+x' || face === '-x') e.x = x + (dx > 0 ? 1 : 0); else e.z = z + (dz > 0 ? 1 : 0);
      list.push(e); return e;
    }
    function chair(x, y, z, yaw, c) { set(x, y, z, B.CHAIR, c || C.oak); seat(x, y, z, yaw); }
    function bench(x, y, z, yaw, c) { set(x, y, z, B.BENCH, c || C.oak); seat(x, y, z, yaw); }
    function sofa(x, y, z, yaw, c) { set(x, y, z, B.SOFA, c || C.green); seat(x, y, z, yaw); }
    function candle(x, y, z) { props.candles.push({ x: x + 0.5, y, z: z + 0.5, one: true }); }
    function shrub(x, z, y, c, h) { for (let k = 0; k < (h || 1); k++) if (isAir(x, y + k, z)) set(x, y + k, z, B.HEDGE, c || C.hedge); }

    /* ================= the cottage: one whole module (walls, floors, stair, hearth, roof, dormer, chimney, rooms) =================
     * Local frame: u across the front (0..6), v from the front wall (0) to the back wall (6). f = the side the front faces. */
    const KIND = {
      weaver: { name: '织工小屋', en: 'A weaver\'s cottage' },
      kitchen: { name: '农舍厨房', en: 'The cottage kitchen' },
      parlour: { name: '小起居室', en: 'The parlour' },
      cottage: { name: '小屋', en: 'A cottage' }
    };
    function cottage(o) {
      const f = o.f, f0 = o.f0, a0 = o.a0, g = o.g, Wd = 6, Dp = 6, mir = !!o.mirror, wc = o.wallC, y0 = g + 6;
      const L = (u, v) => { const uu = mir ? Wd - u : u; if (f === 'n') return [a0 + uu, f0 + v]; if (f === 's') return [a0 + uu, f0 - v]; if (f === 'w') return [f0 + v, a0 + uu]; return [f0 - v, a0 + uu]; };
      const S = (u, v, y, id, c) => { const p = L(u, v); set(p[0], y, p[1], id, c); };
      const p00 = L(0, 0), pu = L(1, 0), pv = L(0, 1), dU = [pu[0] - p00[0], pu[1] - p00[1]], dV = [pv[0] - p00[0], pv[1] - p00[1]];
      const yawL = (du, dv) => yawOf(dU[0] * du + dV[0] * dv, dU[1] * du + dV[1] * dv);
      const at = (u, v) => L(u, v);
      // the plot: the house, a front strip with shrubs (v = -1), a path behind (v = 7)
      { const a = L(0, -1), b = L(Wd, Dp + 1); level(Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[0], b[0]), Math.max(a[1], b[1]), g, B.GRASS, C.grass); }
      for (let u = 0; u <= Wd; u++) for (let v = 0; v <= Dp; v++) S(u, v, g - 1, B.FLAGS, C.flag);
      for (let y = g; y <= g + 5; y++) for (let u = 0; u <= Wd; u++) for (let v = 0; v <= Dp; v++) if (u === 0 || u === Wd || v === 0 || v === Dp) S(u, v, y, B.RUBBLE, wc);
      for (let u = 1; u < Wd; u++) for (let v = 1; v < Dp; v++) S(u, v, g + 3, B.BEAM, C.beam);
      // the roof: Cotswold stone tiles, steep (about 51 degrees), the ridge along the front
      { const a = L(0, 0), b = L(Wd, Dp); roof(Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[0], b[0]), Math.max(a[1], b[1]), (f === 'n' || f === 's') ? 'x' : 'z', y0, 1.25, B.RUBBLE, wc, { c: o.roofC }); }
      // openings: the door, a two-light window with its drip mould, the bedroom window under the dormer, the back windows
      const dp = L(1, 0); door(dp[0], g, dp[1], f, o.doorC); S(1, 0, g + 2, B.HOOD, wc);
      for (const u of [3, 4]) { S(u, 0, g + 1, B.CASE, 0); S(u, 0, g + 2, B.HOOD, wc); }
      S(3, 0, g + 5, B.CASE, 0);
      S(3, Dp, g + 1, B.CASE, 0); S(3, Dp, g + 2, B.HOOD, wc); S(4, Dp, g + 5, B.CASE, 0);
      if (o.gable0) { S(0, 3, g + 1, B.CASE, 0); S(0, 3, g + 2, B.HOOD, wc); S(0, 2, g + 5, B.CASE, 0); }
      // the gabled dormer: the wall rises through the eaves with its own little roof
      for (let u = 2; u <= 4; u++) for (let v = 0; v <= 2; v++) for (let y = y0; y <= y0 + 1; y++) S(u, v, y, B.RUBBLE, wc);
      S(3, 0, y0, B.CASE, 0); S(3, 0, y0 + 1, B.HOOD, wc);
      { const a = L(2, 0), b = L(4, 2), ext = (y0 + 2 + 1.25 * 1.5 - y0) / 1.25 - 3 + 0.05;   // the dormer ridge runs back until it meets the main roof
        const front0 = (f === 'n' || f === 'w');   // is the front the low end of the box?
        roof(Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[0], b[0]), Math.max(a[1], b[1]), (f === 'n' || f === 's') ? 'z' : 'x', y0 + 2, 1.25, B.RUBBLE, wc,
          { c: o.roofC, g0: front0, g1: !front0, e0: front0 ? 0 : ext, e1: front0 ? ext : 0, og: 0.12, ov: 0.22 }); }
      // the hearth: a stone chimney breast with an oak bressummer; the stack rises from the party wall
      for (const v of [1, 3]) for (let y = g; y <= g + 2; y++) S(5, v, y, B.RUBBLE, wc);
      S(5, 2, g, B.FIRE, 0); S(5, 2, g + 1, B.OAK, C.oakD); S(5, 2, g + 2, B.RUBBLE, wc); S(4, 2, g - 1, B.FLAGS, C.stoneD);
      { const p = L(5, 2); lamp(p[0], g, p[1], true, 0.9); const q = L(Wd, 3); chimney(q[0], q[1], y0 + 3, y0 + 5, wc, true); }
      // the stair: a steep straight flight along the back wall, the landing at u 1, a banister round the well
      S(4, 5, g, B.PLANKS, C.oak); S(3, 5, g, B.PLANKS, C.oak); S(3, 5, g + 1, B.PLANKS, C.oak); for (let y = g; y <= g + 2; y++) S(2, 5, y, B.PLANKS, C.oak);
      for (let u = 2; u <= 4; u++) S(u, 5, g + 3, B.AIR, 0);   // the stair well: headroom over every step
      for (let u = 2; u <= 4; u++) S(u, 4, g + 4, B.BALUS, C.oak); S(5, 5, g + 4, B.BALUS, C.oak);
      // the ground-floor room
      const K = o.kind, cU = (u, v, du, dv, c, y) => { const p = at(u, v); chair(p[0], y == null ? g : y, p[1], yawL(du, dv), c); };
      const sU = (u, v, du, dv, c) => { const p = at(u, v); sofa(p[0], g, p[1], yawL(du, dv), c); };
      const tU = (u, v, y, c) => { const p = at(u, v); set(p[0], y == null ? g : y, p[1], B.TABLE, c || C.oak); };
      const cdl = (u, v, y) => { const p = at(u, v); candle(p[0], y, p[1]); };
      if (K === 'weaver') { for (const u of [2, 3]) { S(u, 1, g, B.LOOM, 0); S(u, 1, g + 1, B.LOOM, 0); } cU(2, 2, 0, -1); sU(4, 3, 1, 0, C.green); tU(3, 3); cdl(3, 3, g + 1); }
      else if (K === 'kitchen') { for (const u of [2, 3]) { S(u, 1, g, B.DRESSER, 0); S(u, 1, g + 1, B.DRESSER, 0); } tU(3, 2); tU(3, 3); cU(2, 2, 1, 0); cU(2, 3, 1, 0); cU(4, 3, -1, 0); cdl(3, 2, g + 1); S(5, 1, g, B.STOVE, C.iron); }
      else if (K === 'parlour') { sU(2, 1, 0, 1, C.rose); sU(3, 1, 0, 1, C.rose); for (let u = 2; u <= 4; u++) for (let v = 2; v <= 3; v++) S(u, v, g - 1, B.RUG, 0); cU(4, 3, 1, 0, C.crimson); tU(3, 3); cdl(3, 3, g + 1); for (const v of [4, 5]) { S(5, v, g, B.BOOKS, C.oak); S(5, v, g + 1, B.BOOKS, C.oak); } }
      else { tU(2, 2); tU(3, 2); cU(2, 3, 0, -1); cU(3, 3, 0, -1); cU(2, 1, 0, 1); cU(3, 1, 0, 1); sU(4, 3, 1, 0, C.blue); cdl(2, 2, g + 1); }
      // a framed print on the side wall
      { const p = L(0, 2), q = L(0, 3); const along = [q[0] - p[0], q[1] - p[1]]; wallPlane(props.murals, p[0], p[1], dU[0], dU[1], g + 1, 2, 1, along, { theme: K === 'weaver' ? 'portrait' : 'landscape' }); }
      // upstairs: a bed under the roof, a washstand, a chest
      for (const u of [4, 5]) for (const v of [1, 2]) S(u, v, g + 4, B.BED, o.bedC || C.cream);
      tU(2, 1, g + 4); cdl(2, 1, g + 5); cU(2, 2, 0, -1, C.oak, g + 4); S(5, 3, g + 4, B.OAK, C.oakD);
      { const p = L(3, 2); lamp(p[0], g + 4, p[1], true, 0.7); }
      // outside: shrubs and flowers in the front strip, a climber on the wall
      for (let u = 0; u <= Wd; u++) { if (u === 1) { S(1, -1, g - 1, B.FLAGS, C.stoneD); continue; } const p = L(u, -1), hsh = hash3(p[0], g, p[1]); if (hsh < 0.5) shrub(p[0], p[1], g, hsh < 0.3 ? C.hedge : C.box, hsh < 0.16 ? 2 : 1); else if (hsh < 0.8) set(p[0], g, p[1], B.FLOWER, 0); }
      if (o.creeper) { const p = L(o.creeper.u, 0), q = L(o.creeper.u + 1, 0); wallPlane(props.creepers, p[0], p[1], -dV[0], -dV[1], g, 2, o.creeper.h || 5, [q[0] - p[0], q[1] - p[1]], { kind: o.creeper.kind }); }
      // the names (the banner shows them when you step inside); bfs checkpoints
      const c = L(3, 3), cx = c[0] + 0.5, cz = c[1] + 0.5, k = KIND[K] || KIND.cottage;
      if (o.lm) {
        const ins = L(1, 2), fire = L(5, 2);
        landmarks.push({ id: o.lm, name: (o.label || k.name), en: o.en || k.en, x: cx, z: cz, top: g + 3, r: 3.8, hide: !o.tele, tp: { mode: 'walk', p: [ins[0] + 0.5, g, ins[1] + 0.5], t: [fire[0] + 0.5, g + 1, fire[1] + 0.5] } });
        landmarks.push({ id: o.lm + 'Up', name: '阁楼卧室', en: 'The bedroom under the roof', x: cx, z: cz, top: g + 7, r: 3.8, hide: true });
      }
      { const p = L(2, 4), q = L(1, 3); checks.push([(o.lm || 'cottage') + '-ground', p[0], g, p[1]], [(o.lm || 'cottage') + '-up', q[0], g + 4, q[1]]); }
      buildings.push({ id: o.lm || 'cottage', x0: Math.min(p00[0], L(Wd, Dp)[0]), z0: Math.min(p00[1], L(Wd, Dp)[1]), x1: Math.max(p00[0], L(Wd, Dp)[0]), z1: Math.max(p00[1], L(Wd, Dp)[1]), y: g });
    }

    /* ---- Arlington Row: ten cottages under one stepped roofline, mirrored in pairs so the hearths share the stacks ---- */
    const RW = P.row, kinds = ['weaver', 'kitchen', 'parlour', 'cottage'];
    const rowG = [];
    for (let i = 0; i < RW.n; i++) {
      const a0 = RW.x0 + i * 6, g = Math.round(laneY(a0 + 3)); rowG.push(g);
      const kind = kinds[i % 4], n = RW.n - i;   // the cottages are numbered from the bottom of the hill
      cottage({ f: 'n', f0: RW.zf, a0, g, mirror: i % 2 === 1, kind, wallC: C.stone[i % C.stone.length], doorC: C.doors[(i * 3) % C.doors.length], bedC: [C.cream, C.blue, C.rose, C.white][i % 4],
        roofC: [[0.84, 0.81, 0.74], [0.8, 0.78, 0.72], [0.86, 0.82, 0.74]][i % 3], lm: 'row' + n, label: n === 9 ? '9 号小屋（国民信托）' : KIND[kind].name + ' · ' + n + ' 号', en: n === 9 ? 'No. 9 Arlington Row (National Trust)' : KIND[kind].en + ' · No. ' + n,
        tele: i === 2 || i === 4 || i === 5 || i === 7, gable0: i === 0 || i === RW.n - 1, creeper: hash3(i, 1, 9) < 0.6 ? { u: 5, kind: ['rose', 'wisteria', 'ivy'][i % 3], h: 4 + (i % 3) } : null });
    }
    landmarks.push({ id: 'arlington', name: '阿灵顿排屋', en: 'Arlington Row · c. 1380, weavers\' cottages from the 1600s', x: 110, z: 121, top: rowG[5] + 10, r: 38,
      tp: { mode: 'walk', p: [161.5, Math.round(laneY(161)), 119.5], t: [100, rowG[5] + 3, 124] } });
    // the end walls of the row stand on the hill; a dry-stone wall and gardens behind
    for (let x = RW.x0 - 2; x <= RW.x0 + RW.n * 6 + 2; x++) { const z = RW.zf + 14, i = zi(x, z), y = hm[i]; if (!occ[i]) { set(x, y, z, B.DRYW, C.dry); occ[i] = 1; } }

    /* ---- cottages up Awkward Hill and along the road ---- */
    function lone(o) { cottage(Object.assign({ gable0: true, wallC: pick(C.stone), doorC: pick(C.doors), roofC: [0.82, 0.8, 0.74] }, o)); }
    lone({ f: 'e', f0: 28, a0: 134, g: hm[zi(25, 137)], kind: 'parlour', lm: 'hill1', label: '坡上小屋', en: 'Awkward Hill cottage', tele: true, creeper: { u: 4, kind: 'rose', h: 4 } });
    lone({ f: 'e', f0: 27, a0: 150, g: hm[zi(24, 153)], kind: 'kitchen', lm: 'hill2', label: '坡上小屋 · 厨房', en: 'Awkward Hill cottage · kitchen' });
    lone({ f: 'w', f0: 38, a0: 138, g: hm[zi(41, 141)], kind: 'weaver', lm: 'hill3', label: '坡上织工小屋', en: 'Awkward Hill · weaver\'s cottage', creeper: { u: 5, kind: 'wisteria', h: 5 } });
    lone({ f: 's', f0: 47, a0: 154, g: hm[zi(157, 44)], kind: 'cottage', lm: 'road1', label: '路边小屋', en: 'A cottage on the B4425', creeper: { u: 5, kind: 'ivy', h: 6 } });
    lone({ f: 's', f0: 49, a0: 164, g: hm[zi(167, 46)], kind: 'kitchen', lm: 'road2', label: '路边小屋 · 厨房', en: 'A cottage on the B4425 · kitchen', mirror: true });
    lone({ f: 's', f0: 52, a0: 174, g: hm[zi(177, 49)], kind: 'parlour', lm: 'road3', label: '路边小屋 · 起居室', en: 'A cottage on the B4425 · parlour', creeper: { u: 4, kind: 'rose', h: 4 } });

    /* ================= the bridge over the Coln and the footbridge to Rack Isle ================= */
    { const Bd = P.bridge, y = Bd.y;   // three low arches of rubble stone, parapets, the lane on top
      for (let x = Bd.x0; x <= Bd.x1; x++) for (let z = Bd.z0 - 1; z <= Bd.z1 + 1; z++) {
        const i = zi(x, z);
        for (let yy = 37; yy < y; yy++) {   // the river bed under the arches stays
          let open = false; for (const ac of [209, 213, 217]) { const dx = x - ac; if (Math.abs(dx) <= 1 && yy <= 38) open = true; if (dx === 0 && yy === 39) open = true; }
          if (!open) set(x, yy, z, B.RUBBLE, C.stone[1]); else set(x, yy, z, B.AIR, 0);
        }
        if (z < Bd.z0 || z > Bd.z1) { set(x, y, z, B.RUBBLE, C.stone[3]); set(x, y - 1, z, B.RUBBLE, C.stone[3]); hm[i] = y + 1; occ[i] = 1; continue; }
        set(x, y - 1, z, B.LANE, C.lane); clear(x, y, z, x, y + 6, z); hm[i] = y; pathM[i] = 1; occ[i] = 1;
      }
      landmarks.push({ id: 'bridge', name: '科恩河石桥', en: 'The bridge over the Coln', x: 214, z: 119, top: y + 2, r: 9, tp: { mode: 'walk', p: [214.5, y, 119.5], t: [180, 40, 90] } });
      checks.push(['bridge', 214, y, 119]); }
    { const x0 = 149, x1 = 151, z0 = 111, z1 = 115, y = 40;   // a plank footbridge over the leat to the bird hide on Rack Isle
      for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) { const i = zi(x, z); if (hm[i] < y) { set(x, y - 1, z, B.PLANKS, C.oakL); clear(x, y, z, x, y + 3, z); hm[i] = y; } else set(x, hm[i] - 1, z, B.PLANKS, C.oakL); occ[i] = 1; pathM[i] = 1; }
      props.fences.push([x0 - 0.4, z0, x0 - 0.4, z1 + 1, y], [x1 + 1.4, z0, x1 + 1.4, z1 + 1, y]);
      for (let z = 98; z <= 110; z++) { const i = zi(150, z); set(150, hm[i] - 1, z, B.PLANKS, C.oakL); occ[i] = 1; }
      const pz = 94, py = hm[zi(150, pz)]; for (let x = 147; x <= 153; x++) for (let z = pz - 2; z <= pz + 3; z++) { const i = zi(x, z); set(x, py - 1, z, B.PLANKS, C.oakL); clear(x, py, z, x, py + 4, z); hm[i] = py; occ[i] = 1; }
      for (const x of [148, 150, 152]) bench(x, py, pz - 1, 0, C.oakL);
      props.fences.push([146.6, pz - 2, 146.6, pz + 4, py], [154.4, pz - 2, 154.4, pz + 4, py], [146.6, pz - 2, 154.4, pz - 2, py]);
      landmarks.push({ id: 'rackisle', name: '拉克岛水草甸', en: 'Rack Isle · water meadow and bird reserve', x: 130, z: 92, top: py + 2, r: 34, tp: { mode: 'walk', p: [150.5, py, pz + 1.5], t: [130, 40, 70] } });
      checks.push(['rackisle', 150, py, pz]); }

    /* ================= Arlington Mill (17th century, on the Coln) ================= */
    { const M = P.mill, g = Math.max(hm[zi(44, 46)], 41), wc = C.stone[2];
      level(M.x0 - 1, M.z0 - 2, M.x1 + 1, M.z1 + 1, g, B.GRASS, C.grass);
      for (let x = M.x0; x <= M.x1; x++) for (let z = M.z0; z <= M.z1; z++) set(x, g - 1, z, B.FLAGS, C.flag);
      for (let y = g; y <= g + 10; y++) for (let x = M.x0; x <= M.x1; x++) for (let z = M.z0; z <= M.z1; z++) if (x === M.x0 || x === M.x1 || z === M.z0 || z === M.z1) set(x, y, z, B.RUBBLE, wc);
      for (const y of [g + 3, g + 7]) box(M.x0 + 1, y, M.z0 + 1, M.x1 - 1, y, M.z1 - 1, B.BEAM, C.beam);
      roof(M.x0, M.z0, M.x1, M.z1, 'x', g + 11, 1.2, B.RUBBLE, wc, { c: [0.8, 0.78, 0.72] });
      for (let x = M.x0 + 2; x <= M.x1 - 2; x += 3) for (const z of [M.z0, M.z1]) { if (z === M.z0 && (x === 44 || x === 45)) continue; for (const y of [g + 1, g + 5, g + 9]) { set(x, y, z, B.CASE, 0); set(x, y + 1, z, B.HOOD, wc); } }
      for (const z of [M.z0 + 3, M.z0 + 5]) for (const x of [M.x0, M.x1]) { set(x, g + 5, z, B.CASE, 0); set(x, g + 9, z, B.CASE, 0); }
      door(44, g, M.z0, 'n', C.doors[5]); door(45, g, M.z0, 'n', C.doors[5]); box(44, g + 2, M.z0, 45, g + 2, M.z0, B.OAK, C.oakD);
      set(44, g + 9, M.z0, B.DOOR, C.doors[5]); set(45, g + 9, M.z0, B.DOOR, C.doors[5]); set(44, g + 10, M.z0, B.OAK, C.oakD); set(45, g + 10, M.z0, B.OAK, C.oakD);   // the sack hoist doors
      // inside: two pairs of millstones with hoppers, the main post, sacks of flour, a bench
      for (const [mx, mz] of [[39, 50], [48, 50]]) { box(mx, g, mz, mx + 1, g, mz + 1, B.MILLST, C.stoneL); set(mx, g + 1, mz, B.OAK, C.oak); set(mx + 1, g + 1, mz + 1, B.OAKC, C.oakD); }
      box(44, g, 52, 44, g + 2, 52, B.OAK, C.oakD);
      for (const [sx, sz, sh] of [[37, 53, 2], [37, 54, 2], [38, 54, 1], [51, 48, 1], [50, 48, 1], [51, 49, 2]]) for (let k = 0; k < sh; k++) set(sx, g + k, sz, B.SACK, 0);
      bench(48, g, 54, Math.PI, C.oakL); bench(49, g, 54, Math.PI, C.oakL);
      lamp(44, g + 1, 50, true, 0.8); lamp(40, g + 1, 53, true, 0.6);
      chimney(M.x1, 51, g + 11 + 4, g + 11 + 6, wc, false);
      landmarks.push({ id: 'mill', name: '阿灵顿磨坊', en: 'Arlington Mill', x: 44, z: 51, top: g + 12, r: 14, tp: { mode: 'walk', p: [44.5, g, M.z0 - 4.5], t: [44, g + 6, 51] } });
      landmarks.push({ id: 'millIn', name: '磨坊内 · 石磨', en: 'Inside the mill · the millstones', x: 44, z: 51, top: g + 3, r: 8, hide: true });
      checks.push(['mill-inside', 44, g, 50]); buildings.push({ id: 'mill', x0: M.x0, z0: M.z0, x1: M.x1, z1: M.z1, y: g }); }

    /* ================= the trout farm: stone-edged ponds, a hut ================= */
    { const t = P.trout, y = 40;
      const ponds = [[72, 18, 84, 36], [90, 18, 102, 36], [108, 18, 120, 36], [126, 18, 136, 30]];
      for (const [x0, z0, x1, z1] of ponds) {
        for (let z = z0 - 1; z <= z1 + 1; z++) for (let x = x0 - 1; x <= x1 + 1; x++) {
          const i = zi(x, z), rim = x === x0 - 1 || x === x1 + 1 || z === z0 - 1 || z === z1 + 1;
          if (rim) { level(x, z, x, z, y, B.LIMES, C.stoneL); pathM[i] = 1; continue; }
          for (let yy = 34; yy <= 36; yy++) set(x, yy, z, B.GRAVEL, C.bed); clear(x, 37, z, x, y + 6, z); hm[i] = 37; occ[i] = 1;
        }
        for (let k = 0; k < 7; k++) props.fish.push({ x: (x0 + x1 + 1) / 2, z: (z0 + z1 + 1) / 2, rx: (x1 - x0) / 2 - 0.8, rz: (z1 - z0) / 2 - 0.8, y: 37.9, ph: rnd() * 6.28, sp: 0.25 + rnd() * 0.35 });
      }
      // the hut (feed for sale), boarded, with a little stone-tile roof
      { const x0 = 140, x1 = 148, z0 = 14, z1 = 22, g = y; level(x0 - 1, z0 - 1, x1 + 1, z1 + 1, g, B.GRAVEL, C.gravel);
        for (let yy = g; yy <= g + 2; yy++) for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) if (x === x0 || x === x1 || z === z0 || z === z1) set(x, yy, z, B.PLANKS, C.oakL);
        box(x0, g - 1, z0, x1, g - 1, z1, B.PLANKS, C.oak);
        roof(x0, z0, x1, z1, 'x', g + 3, 1.0, B.PLANKS, C.oakL, { c: [0.78, 0.76, 0.7], gt: 'planks' });
        door(144, g, z1, 's', C.doors[1]); for (const x of [142, 146]) set(x, g + 1, z1, B.CASE, 0);
        box(141, g, 15, 147, g, 15, B.TABLE, C.oakL); for (const [sx, sz] of [[141, 18], [141, 19], [147, 20]]) set(sx, g, sz, B.SACK, 0); bench(147, g, 17, -Math.PI / 2, C.oakL);
        lamp(144, g + 1, 18, true, 0.7); checks.push(['trout-hut', 144, g, 19]); }
      // a fence round the ponds, gravel walks between them
      props.fences.push([t.x0 + 2, t.z0 + 2, t.x1 - 16, t.z0 + 2, y], [t.x0 + 2, t.z0 + 2, t.x0 + 2, t.z1 - 2, y], [t.x0 + 2, t.z1 - 2, 106, t.z1 - 2, y], [114, t.z1 - 2, t.x1 - 16, t.z1 - 2, y]);
      for (let z = 14; z <= 40; z++) for (let x = 68; x <= 138; x++) { const i = zi(x, z); if (!occ[i] && hm[i] === y && (z === 16 || z === 38 || x % 18 === 15)) { set(x, y - 1, z, B.GRAVEL, C.gravel); pathM[i] = 1; occ[i] = 1; } }
      landmarks.push({ id: 'trout', name: '拜伯里鳟鱼养殖场', en: 'Bibury Trout Farm (1902)', x: 104, z: 27, top: y + 4, r: 26, tp: { mode: 'walk', p: [110.5, y, 40.5], t: [100, 38, 26] } });
      checks.push(['trout', 110, y, 38]); }

    /* ================= the Swan Hotel: an ivy-clad coaching inn by the bridge ================= */
    { const S = P.swan, g = Math.max(hm[zi(237, 113)], 41), wc = C.honey, fx = S.x0;
      level(S.x0 - 3, S.z0 - 1, S.x1 + 1, S.z1 + 1, g, B.GRASS, C.grass);
      for (let z = S.z0 - 1; z <= S.z1 + 1; z++) for (let x = S.x0 - 3; x < S.x0; x++) { set(x, g - 1, z, B.FLAGS, C.flag); pathM[zi(x, z)] = 1; }
      for (let x = S.x0; x <= S.x1; x++) for (let z = S.z0; z <= S.z1; z++) set(x, g - 1, z, B.FLAGS, C.flag);
      for (let y = g; y <= g + 7; y++) for (let x = S.x0; x <= S.x1; x++) for (let z = S.z0; z <= S.z1; z++) if (x === S.x0 || x === S.x1 || z === S.z0 || z === S.z1) set(x, y, z, B.RUBBLE, wc);
      box(S.x0 + 1, g + 3, S.z0 + 1, S.x1 - 1, g + 3, S.z1 - 1, B.BEAM, C.beam);
      box(S.x0 + 1, g + 7, S.z0 + 1, S.x1 - 1, g + 7, S.z1 - 1, B.BEAM, C.beam);
      roof(S.x0, S.z0, S.x1, S.z1, 'z', g + 8, 1.2, B.RUBBLE, wc, { c: [0.82, 0.79, 0.72], ov: 0.4 });
      // three gabled dormers on the front, mullioned windows on both floors, the door under a little hood
      const winZ = [104, 105, 108, 109, 117, 118, 121, 122], upZ = [104, 105, 106, 108, 109, 112, 113, 117, 118, 121, 122];
      for (const z of winZ) { set(fx, g + 1, z, B.CASE, 0); set(fx, g + 2, z, B.HOOD, wc); set(S.x1, g + 1, z, B.CASE, 0); }
      for (const z of upZ) { set(fx, g + 5, z, B.CASE, 0); set(fx, g + 6, z, B.HOOD, wc); }
      for (const zc of [105, 113, 121]) {
        const y0 = g + 8; for (let z = zc - 1; z <= zc + 1; z++) for (let x = fx; x <= fx + 2; x++) for (let y = y0; y <= y0 + 1; y++) set(x, y, z, B.RUBBLE, wc);
        set(fx, y0, zc, B.CASE, 0); set(fx, y0 + 1, zc, B.HOOD, wc);
        roof(fx, zc - 1, fx + 2, zc + 1, 'x', y0 + 2, 1.2, B.RUBBLE, wc, { c: [0.82, 0.79, 0.72], g0: true, g1: false, e1: (1.2 * 1.5 + 2) / 1.2 - 3 + 0.05, og: 0.12, ov: 0.22 });
      }
      door(fx, g, 112, 'w', C.doors[5]); set(fx, g + 2, 112, B.HOOD, wc); door(fx, g, 113, 'w', C.doors[5]); set(fx, g + 2, 113, B.HOOD, wc);
      lamp(fx - 1, g + 2, 111, false, 1.2); lamp(fx - 1, g + 2, 114, false, 1.2);
      mural(fx, g + 3, 111.5, 2, 1.2, '-x', 'swan');
      for (const [z0, z1] of [[102, 103], [106, 107], [110, 111], [114, 116], [119, 120], [123, 124]]) props.creepers.push({ x: fx, y: g, z: z0, w: z1 - z0 + 1, h: 7 + (z0 % 2), face: '-x', kind: 'ivy' });
      props.creepers.push({ x: fx, y: g + 3, z: 102, w: 23, h: 1.6, face: '-x', kind: 'ivy' });
      props.creepers.push({ x: S.x0, y: g, z: S.z0, w: 11, h: 7, face: '-z', kind: 'ivy' });
      chimney(237, S.z0, g + 8 + 5, g + 8 + 8, wc, true); chimney(237, S.z1, g + 8 + 5, g + 8 + 8, wc, true); chimney(240, 116, g + 8 + 3, g + 8 + 8, wc, false);
      // inside: the bar (a long counter, shelves of bottles, stools, tables, an inglenook) and the dining room
      box(S.x0 + 1, g, 115, S.x1 - 1, g + 2, 115, B.RUBBLE, wc); door(236, g, 115, 's', C.oak);
      box(239, g, 105, 239, g, 111, B.TABLE, C.oakD); for (let z = 104; z <= 112; z++) { set(241, g, z, B.BOTTLES, 0); set(241, g + 1, z, B.BOTTLES, 0); }
      for (const z of [106, 108, 110]) chair(238, g, z, -Math.PI / 2, C.oakD);
      for (const z of [109, 112]) { set(235, g, z, B.TABLE, C.oak); chair(234, g, z, -Math.PI / 2, C.oak); chair(236, g, z, Math.PI / 2, C.oak); candle(235, g + 1, z); }
      for (let x = 235; x <= 237; x++) for (let y = g; y <= g + 2; y++) set(x, y, S.z0 + 1, B.RUBBLE, wc); set(236, g, S.z0 + 1, B.FIRE, 0); set(236, g + 1, S.z0 + 1, B.OAK, C.oakD);
      sofa(235, g, 105, 0, C.green); sofa(237, g, 105, 0, C.crimson);
      lamp(236, g, 104, true, 1); lamp(238, g + 1, 108, true, 0.8);
      mural(237, g + 1, 115, 3, 1.2, '-z', 'hunt'); mural(S.x0 + 1, g + 1, 106, 2, 1, '+x', 'landscape');
      for (const [tx, tz] of [[235, 118], [235, 121], [239, 118], [239, 121]]) { set(tx, g, tz, B.TABLE, C.white); chair(tx - 1, g, tz, -Math.PI / 2, C.crimson); chair(tx + 1, g, tz, Math.PI / 2, C.crimson); candle(tx, g + 1, tz); }
      for (let x = 237; x <= 239; x++) for (let y = g; y <= g + 2; y++) set(x, y, S.z1 - 1, B.RUBBLE, wc); set(238, g, S.z1 - 1, B.FIRE, 0); set(238, g + 1, S.z1 - 1, B.OAK, C.oakD);
      lamp(238, g, 122, true, 1); lamp(236, g + 1, 119, true, 0.8);
      mural(S.x1, g + 1, 118, 3, 1.4, '-x', 'portrait');
      landmarks.push({ id: 'swan', name: '天鹅酒店', en: 'The Swan Hotel', x: 237, z: 113, top: g + 10, r: 15, tp: { mode: 'walk', p: [226.5, hm[zi(226, 112)], 112.5], t: [232, g + 4, 113] } });
      landmarks.push({ id: 'swanBar', name: '天鹅酒店 · 酒吧', en: 'The Swan · the bar', x: 237, z: 108, top: g + 3, r: 7.5, tp: { mode: 'walk', p: [233.5, g, 113.5], t: [239, g + 1, 108] } });
      landmarks.push({ id: 'swanDine', name: '天鹅酒店 · 餐厅', en: 'The Swan · the dining room', x: 237, z: 120, top: g + 3, r: 5.5, hide: true });
      checks.push(['swan-bar', 233, g, 113], ['swan-dining', 237, g, 119]); buildings.push({ id: 'swan', x0: S.x0, z0: S.z0, x1: S.x1, z1: S.z1, y: g }); }

    /* ================= St Mary's church: a west tower, the nave, the chancel, the south porch, the churchyard ================= */
    { const Y = P.yard, g = Math.max(hm[zi(226, 38)], 41), wc = C.church, nz0 = 32, nz1 = 44;
      // the churchyard: a dry-stone wall, headstones, yews
      level(Y.x0, Y.z0, Y.x1, Y.z1, g, B.GRASS, C.grass);
      for (let x = Y.x0; x <= Y.x1; x++) for (let z = Y.z0; z <= Y.z1; z++) { const edge = x === Y.x0 || x === Y.x1 || z === Y.z0 || z === Y.z1; if (edge && !(x === Y.x0 && z >= 51 && z <= 55)) set(x, g, z, B.DRYW, C.dry); }
      road([[Y.x0 - 2, 53], [216, 53], [224, 50]], 1, B.GRAVEL, C.gravel);
      // the tower: four stages, battlements and pinnacles, belfry louvres, a flag of St George
      const tx0 = 206, tx1 = 214, tz0 = 34, tz1 = 42, tt = g + 19;
      for (let y = g; y <= tt; y++) for (let x = tx0; x <= tx1; x++) for (let z = tz0; z <= tz1; z++) if (x === tx0 || x === tx1 || z === tz0 || z === tz1) set(x, y, z, B.LIME, wc);
      for (const y of [g + 6, g + 12]) { for (let x = tx0; x <= tx1; x++) for (const z of [tz0, tz1]) set(x, y, z, B.HOOD, wc); for (let z = tz0; z <= tz1; z++) for (const x of [tx0, tx1]) set(x, y, z, B.HOOD, wc); }
      box(tx0 + 1, tt, tz0 + 1, tx1 - 1, tt, tz1 - 1, B.LEAD, C.iron);
      for (let x = tx0; x <= tx1; x++) for (const z of [tz0, tz1]) { set(x, tt + 1, z, B.LIME, wc); if ((x - tx0) % 2 === 0) set(x, tt + 2, z, B.LIME, wc); }
      for (let z = tz0; z <= tz1; z++) for (const x of [tx0, tx1]) { set(x, tt + 1, z, B.LIME, wc); if ((z - tz0) % 2 === 0) set(x, tt + 2, z, B.LIME, wc); }
      for (const [px, pz] of [[tx0, tz0], [tx1, tz0], [tx0, tz1], [tx1, tz1]]) { box(px, tt + 2, pz, px, tt + 4, pz, B.LIMEC, wc); set(px, tt + 5, pz, B.LIMES, C.stoneL); }
      for (const y of [g + 14, g + 15, g + 16]) { for (const x of [209, 210, 211]) { set(x, y, tz0, y === g + 16 ? B.LIMEC : B.IRON, y === g + 16 ? wc : C.iron); set(x, y, tz1, y === g + 16 ? B.LIMEC : B.IRON, y === g + 16 ? wc : C.iron); } for (const z of [37, 38, 39]) { set(tx0, y, z, y === g + 16 ? B.LIMEC : B.IRON, y === g + 16 ? wc : C.iron); set(tx1, y, z, y === g + 16 ? B.LIMEC : B.IRON, y === g + 16 ? wc : C.iron); } }
      for (const y of [g + 8, g + 9]) set(tx0, y, 38, B.CASE, 0);
      flags.push([210, tt + 7, 38.5]);
      box(tx0 + 1, g - 1, tz0 + 1, tx1 - 1, g - 1, tz1 - 1, B.FLAGS, C.flag); box(tx0 + 1, g + 6, tz0 + 1, tx1 - 1, g + 6, tz1 - 1, B.BEAM, C.beam);
      door(tx0, g, 38, 'w', C.oakD); set(tx0, g + 2, 38, B.LIMEC, wc);
      // the nave and the chancel
      const nx0 = tx1, nx1 = 236, cx1 = 246, cz0 = 34, cz1 = 42;
      for (let y = g; y <= g + 7; y++) for (let x = nx0; x <= nx1; x++) for (let z = nz0; z <= nz1; z++) if (x === nx0 || x === nx1 || z === nz0 || z === nz1) set(x, y, z, B.LIME, wc);
      for (let y = g; y <= g + 6; y++) for (let x = nx1; x <= cx1; x++) for (let z = cz0; z <= cz1; z++) if (x === nx1 || x === cx1 || z === cz0 || z === cz1) set(x, y, z, B.LIME, wc);
      box(nx0 + 1, g - 1, nz0 + 1, cx1 - 1, g - 1, nz1 - 1, B.FLAGS, C.flag);
      roof(nx0 + 1, nz0, nx1, nz1, 'x', g + 8, 1.15, B.LIME, wc, { c: [0.8, 0.78, 0.72], gt: 'ashlar', g0: false });   // from the tower's east face
      for (const z of [nz0 + 1, nz1 - 1]) set(nx0, g + 8, z, B.LIME, wc);
      roof(nx1 + 1, cz0, cx1, cz1, 'x', g + 7, 1.15, B.LIME, wc, { c: [0.8, 0.78, 0.72], gt: 'ashlar', g0: false });   // from the nave's east gable
      // arches: the tower arch, the chancel arch
      clear(nx0, g, 37, nx0, g + 3, 39); clear(nx1, g, 36, nx1, g + 4, 40); for (let z = 36; z <= 40; z++) set(nx1, g + 5, z, B.LIMEC, C.stoneL); for (let z = 37; z <= 39; z++) set(nx0, g + 4, z, B.LIMEC, C.stoneL);
      // tall windows of stained glass (lit, so they glow inside by day and outside at night)
      for (const x of [217, 218, 229, 230, 233, 234]) for (let y = g + 2; y <= g + 4; y++) set(x, y, nz1, B.STAINED, 0);
      for (const x of [217, 218, 223, 224, 229, 230]) for (let y = g + 2; y <= g + 4; y++) set(x, y, nz0, B.STAINED, 0);
      for (const x of [217, 218, 223, 224, 229, 230, 233, 234]) { if (get(x, g + 2, nz0) === B.STAINED) set(x, g + 5, nz0, B.LIMEC, C.stoneL); if (get(x, g + 2, nz1) === B.STAINED) set(x, g + 5, nz1, B.LIMEC, C.stoneL); }
      for (const z of [37, 38, 39]) for (let y = g + 2; y <= g + 5; y++) set(cx1, y, z, B.STAINED, 0); for (const z of [37, 38, 39]) set(cx1, g + 6, z, B.LIMEC, C.stoneL);
      for (const x of [240, 241]) for (let y = g + 2; y <= g + 4; y++) { set(x, y, cz0, B.STAINED, 0); set(x, y, cz1, B.STAINED, 0); }
      // the south porch with stone benches, the door into the nave
      for (let y = g; y <= g + 3; y++) for (let x = 222; x <= 226; x++) for (let z = nz1; z <= 49; z++) if (x === 222 || x === 226 || z === 49) set(x, y, z, B.LIME, wc);
      box(222, g - 1, nz1 + 1, 226, g - 1, 49, B.FLAGS, C.flag); clear(223, g, 49, 225, g + 2, 49); for (let x = 223; x <= 225; x++) set(x, g + 3, 49, B.LIMEC, C.stoneL);
      roof(222, nz1 + 1, 226, 49, 'z', g + 4, 1.15, B.LIME, wc, { c: [0.8, 0.78, 0.72], gt: 'ashlar', g0: false });
      for (const z of [45, 46, 47]) { bench(223, g, z, -Math.PI / 2, C.stoneL); bench(225, g, z, Math.PI / 2, C.stoneL); }
      door(224, g, nz1, 's', C.oakD); lamp(224, g + 2, 48, false, 1.1);
      // inside: pews either side of the aisle, the font, choir stalls, the communion rail, the altar
      for (const x of [218, 220, 222, 226, 228, 230, 232]) for (const z of [33, 34, 35, 36, 40, 41, 42, 43]) bench(x, g, z, -Math.PI / 2, C.oak);
      set(216, g, 34, B.LIMES, C.stoneL); set(216, g + 1, 34, B.LIMEC, C.stoneL);
      for (const x of [238, 239, 240]) { bench(x, g, 35, Math.PI, C.oakD); bench(x, g, 41, 0, C.oakD); }
      for (let z = 35; z <= 41; z++) if (z !== 38) set(242, g, z, B.BALUS, C.oakD);
      for (const z of [37, 38, 39]) set(245, g, z, B.CURTAIN, C.crimson); candle(245, g + 1, 37); candle(245, g + 1, 39);
      props.chandeliers.push({ x: 221.5, y: g + 5, z: 38.5, top: g + 8, r: 0.9, candles: 8, kind: 'small' }, { x: 229.5, y: g + 5, z: 38.5, top: g + 8, r: 0.9, candles: 8, kind: 'small' });
      for (const x of [220, 228, 241]) lamp(x, g + 3, 38, true, 0.9);
      mural(nx0 + 1, g + 3, 34, 2, 1.4, '+x', 'saints');
      // headstones and chest tombs, yews
      for (let t = 0; t < 140; t++) { const x = RI(Y.x0 + 2, Y.x1 - 2), z = RI(Y.z0 + 2, Y.z1 - 2), i = zi(x, z); if (x >= 203 && x <= 249 && z >= 29 && z <= 52) continue; if (pathM[i] || get(x, g, z) !== B.AIR || get(x + 1, g, z) !== B.AIR || get(x - 1, g, z) !== B.AIR) continue; if (rnd() < 0.15) { set(x, g, z, B.LIMES, C.stoneD); set(x, g, z + 1, B.LIMES, C.stoneD); } else set(x, g, z, B.LIMEC, pick([C.stoneL, C.stoneD, C.church])); occ[i] = 1; }
      for (const [x, z] of [[204, 24], [248, 24], [204, 60], [249, 58], [236, 58]]) yew(x, z);
      landmarks.push({ id: 'church', name: '圣玛丽教堂', en: 'St Mary\'s Church (Saxon origins)', x: 226, z: 38, top: g + 14, r: 26, tp: { mode: 'walk', p: [212.5, g, 54.5], t: [224, g + 6, 40] } });
      landmarks.push({ id: 'nave', name: '教堂中殿', en: 'St Mary\'s · the nave', x: 225, z: 38, top: g + 6, r: 11, tp: { mode: 'walk', p: [216.5, g, 38.5], t: [246, g + 3, 38.5] } });
      landmarks.push({ id: 'chancel', name: '圣坛', en: 'St Mary\'s · the chancel', x: 241, z: 38, top: g + 6, r: 5, hide: true });
      landmarks.push({ id: 'tower', name: '钟楼', en: 'The west tower', x: 210, z: 38, top: g + 4, r: 4, hide: true });
      checks.push(['church-porch', 224, g, 47], ['church-nave', 224, g, 38], ['church-chancel', 243, g, 38], ['church-tower', 210, g, 38]);
      buildings.push({ id: 'church', x0: tx0, z0: nz0, x1: cx1, z1: nz1, y: g }); }

    /* ================= the river: swans and mallards, willows, reeds ================= */
    for (const [x, z] of [[118, 71], [126, 72], [160, 75], [74, 67], [196, 90], [210, 112]]) props.swans.push({ x: x + 0.5, y: WATER_Y - 0.22, z: z + 0.5, r: rnd() * 6.28 });
    for (const [x, z] of [[96, 70], [100, 71], [104, 69], [150, 73], [154, 74], [186, 82], [214, 132], [216, 136]]) props.ducks.push({ x: x + 0.5, y: WATER_Y - 0.12, z: z + 0.5, r: rnd() * 6.28 });
    landmarks.push({ id: 'coln', name: '科恩河', en: 'The River Coln', x: 150, z: 74, top: 42, r: 20, tp: { mode: 'fly', p: [176, 50, 96], t: [130, 39, 72] } });

    /* ---- trees: weeping willows on the banks, beech, ash and horse chestnut on the slopes, yews in the churchyard ---- */
    function yew(x, z) {   // dark, dense, broad
      const y = hm[zi(x, z)], hgt = RI(6, 8); for (let k = 0; k < 2; k++) set(x, y + k, z, B.BARK, C.bark);
      for (let dy = 1; dy <= hgt; dy++) { const r = Math.max(1, 3.4 - Math.abs(dy - 3) * 0.6); for (let dz = -4; dz <= 4; dz++) for (let dx = -4; dx <= 4; dx++) { if (dx * dx + dz * dz > r * r + hash3(x + dx, dy, z + dz)) continue; if (isAir(x + dx, y + dy, z + dz)) set(x + dx, y + dy, z + dz, B.YEW, C.yew); } }
      occ[zi(x, z)] = 3;
    }
    function willow(x, z) {   // a short trunk, a wide dome, curtains of fronds down to the water
      const y = hm[zi(x, z)], hgt = RI(5, 6), r = RI(4, 5); for (let k = 0; k < hgt; k++) set(x, y + k, z, B.BARK, C.bark);
      for (let dz = -r - 1; dz <= r + 1; dz++) for (let dx = -r - 1; dx <= r + 1; dx++) {
        const d = Math.hypot(dx, dz); if (d > r + 0.6) continue;
        const top = y + hgt + Math.round((1 - d / (r + 1)) * 2.4); for (let yy = top - 1; yy <= top; yy++) if (isAir(x + dx, yy, z + dz)) set(x + dx, yy, z + dz, B.WILLOW, C.willow);
        if (d > r - 1.2 && hash3(x + dx, 3, z + dz) < 0.72) { const len = 2 + Math.floor(hash3(x + dx, 4, z + dz) * (hgt - 1)); for (let k = 1; k <= len; k++) if (isAir(x + dx, top - 1 - k, z + dz)) set(x + dx, top - 1 - k, z + dz, B.WILLOW, C.willow); }
      }
      occ[zi(x, z)] = 3;
    }
    function broadleaf(x, z, cset, big) {
      const y = hm[zi(x, z)], hgt = big ? RI(10, 13) : RI(7, 9), r = big ? RI(4, 6) : RI(3, 4); for (let k = 0; k < hgt - 2; k++) set(x, y + k, z, B.BARK, C.bark);
      const pc = pick(cset); for (let dy = -2; dy <= 3; dy++) for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) { if (dx * dx + dz * dz + dy * dy * 1.6 > r * r + 1 || hash3(x + dx, y + dy, z + dz) < 0.1) continue; const yy = y + hgt - 2 + dy; if (isAir(x + dx, yy, z + dz)) set(x + dx, yy, z + dz, B.BEECH, pc); }
      occ[zi(x, z)] = 3;
    }
    const treeOK = (x, z, rad) => { if (x < 3 || z < 3 || x > W - 4 || z > D - 4) return false; for (let dz = -rad; dz <= rad; dz++) for (let dx = -rad; dx <= rad; dx++) { const i = zi(clamp(x + dx, 0, W - 1), clamp(z + dz, 0, D - 1)); if (occ[i] || pathM[i]) return false; } const i = zi(x, z); return hm[i] > 38 && get(x, hm[i] - 1, z) !== B.AIR; };
    // willows along the banks of the Coln and the leat
    const wl = [];
    for (let t = 0; t < 900 && wl.length < 13; t++) { const x = RI(30, 230), z = RI(50, 200), i = zi(x, z); if (DR[i] < 5.2 || DR[i] > 7.5 || !treeOK(x, z, 3)) continue; let near = false; for (const q of wl) if (Math.hypot(q[0] - x, q[1] - z) < 18) near = true; if (near) continue; willow(x, z); wl.push([x, z]); }
    // big trees behind the row and at the top of the lane (as in the view up Arlington Row), the slopes, round the inn and the church
    for (const [x, z, big] of [[166, 128, 1], [172, 134, 1], [158, 140, 1], [84, 140, 1], [100, 142, 1], [122, 144, 1], [140, 143, 0], [62, 128, 1], [52, 140, 0], [196, 130, 1], [184, 140, 0], [244, 92, 1], [250, 132, 0], [190, 30, 1], [60, 30, 0], [24, 60, 1]]) if (treeOK(x, z, 2)) broadleaf(x, z, C.leaf, !!big);
    for (let t = 0; t < 2400; t++) {
      const x = RI(3, W - 4), z = RI(3, D - 4), i = zi(x, z);
      if (RK[i] || DR[i] < 10 || !treeOK(x, z, 3)) continue;
      const top = get(x, hm[i] - 1, z); if (top !== B.GRASS) continue;
      const clump = fbm(x / 20, z / 20, 61, 3); if (clump < 0.57 || rnd() > 0.45) continue;
      broadleaf(x, z, C.leaf, rnd() < 0.4);
    }
    // a red photinia and a dry-stone wall at the bottom of the lane, as in the photograph
    for (const [x, z, h] of [[143, 122, 2], [144, 122, 1], [143, 123, 1]]) shrub(x, z, hm[zi(x, z)], C.photinia, h);
    for (let x = 168; x <= 200; x++) { const z = 116, i = zi(x, z); if (!pathM[i] && !occ[i]) { set(x, hm[i], z, B.DRYW, C.dry); occ[i] = 1; } }

    /* ---- reeds, grasses, cow parsley and wild flowers (drawn as crossed planes by props.js) ---- */
    for (let t = 0; t < 26000 && props.tufts.length < 7000; t++) {
      const x = RI(1, W - 2), z = RI(1, D - 2), i = zi(x, z), y = hm[i]; if (pathM[i] || occ[i] === 1) continue;
      const top = get(x, y - 1, z); if ((top !== B.GRASS && top !== B.MEADOW) || !isAir(x, y, z)) continue;
      let kind = -1;
      if (RK[i]) kind = hash3(x, 9, z) < 0.55 ? 1 : hash3(x, 8, z) < 0.5 ? 3 : 0;            // Rack Isle: reeds and rushes, meadowsweet, grass
      else if (DR[i] < 8 || DL[i] < 3.4) kind = hash3(x, 9, z) < 0.6 ? 1 : 0;                  // the banks
      else if (Math.abs(z - P.lane.z) < 6 && x > 50 && x < 210) kind = hash3(x, 9, z) < 0.35 ? 2 : hash3(x, 8, z) < 0.3 ? 3 : 0;   // the verges of the lane
      else if (rnd() < 0.35) kind = hash3(x, 9, z) < 0.12 ? 3 : 0; else continue;
      props.tufts.push([x + 0.2 + rnd() * 0.6, y, z + 0.2 + rnd() * 0.6, kind, 0.75 + rnd() * 0.5]);
    }

    /* ================= derived ================= */
    doors.forEach((d) => { set(d.x, d.y, d.z, B.DOOR, d.col || C.oak); set(d.x, d.y + 1, d.z, B.DOOR, d.col || C.oak); });
    { const seen = {}; for (let i = doors.length - 1; i >= 0; i--) { const k = doors[i].x + ',' + doors[i].y + ',' + doors[i].z; if (seen[k] || get(doors[i].x, doors[i].y, doors[i].z) !== B.DOOR) doors.splice(i, 1); else seen[k] = 1; } }
    const walk = new Uint8Array(W * D);
    for (let i = 0; i < W * D; i++) if (pathM[i]) { const x = i % W, z = (i / W) | 0, y = hm[i]; if (get(x, y - 1, z) !== B.AIR && get(x, y, z) === B.AIR && get(x, y + 1, z) === B.AIR) walk[i] = 1; }
    const topH = new Uint8Array(W * D), topB = new Uint8Array(W * D), topC = new Uint8Array(W * D);
    for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) for (let y = H - 1; y >= 0; y--) { const b = blocks[idx(x, y, z)]; if (b) { topH[zi(x, z)] = y; topB[zi(x, z)] = b; topC[zi(x, z)] = cols[idx(x, y, z)]; break; } }
    const sy = hm[zi(161, 119)];
    const spawn = { x: 161.5, y: sy, z: 119.5, yaw: Math.PI / 2 };   // the view up Arlington Row from the bottom of the lane
    checks.unshift(['lane-row', 110, hm[zi(110, 119)], 119], ['lane-top', 60, hm[zi(60, 119)], 119], ['road-village', 120, hm[zi(120, 47)], 47]);
    const tour = {
      cam: [[176, 47, 124], [146, 47, 108], [108, 48, 106], [70, 52, 110], [40, 58, 84], [62, 58, 30], [118, 56, 26], [192, 62, 30], [246, 60, 78], [236, 52, 140], [196, 49, 132]],
      tgt: [[120, 46, 125], [108, 46, 126], [96, 47, 126], [86, 47, 126], [44, 47, 52], [52, 46, 52], [104, 39, 27], [226, 52, 38], [236, 46, 113], [212, 42, 119], [140, 46, 124]],
      dur: 170
    };
    return {
      W, D, H, BASE: 41, GY: 40, WATER_Y, blocks, cols, palette, pal, get, set, idx, inb, B, BI, P,
      hm, walk, occ, land: null, topH, topB, topC, landmarks, lamps, flags, chimneys, doors, seats, pasture, buildings, props, checks,
      spawn, tour, lake: { x: W / 2, z: D / 2, w: W, d: D }, moorings: []
    };
  }

  root.BBWorld = { W, D, H, WATER_Y, B, BI, T, P, create, hash3, mulberry32 };
  if (typeof module !== 'undefined') module.exports = root.BBWorld;
})(typeof window !== 'undefined' ? window : globalThis);
