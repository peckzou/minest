/* Downton Abbey (Highclere Castle) — voxel world generator (no DOM / no THREE dependency). Exposes DAWorld = { W, D, H, B, BI, T, create(seed) }.
 * 1 voxel = 1 m. x east, z south, y up. hm[x,z] = first air cell above the ground.
 * After Highclere Castle (Charles Barry, 1839-1842; the house of Downton Abbey): a square Bath-stone house on a terrace, a 3 x 3 plan of
 * state rooms round the Saloon, which rises into the central tower; four corner towers and a pinnacled strapwork parapet; the porte-cochere
 * on the north front. Inside: the Saloon (gothic arcades, gilded leather, a gallery), the Grand Staircase, the double Library, the Dining
 * Room, the Drawing Room, the Music Room, the Study, the entrance hall, and bedrooms on the first floor. Outside: the terrace, the lawns
 * with cedars of Lebanon, the forecourt fountain, the lime avenue of the drive, the walled garden, Heaven's Gate on Siddown hill,
 * Jackdaws Castle by Milford Lake, fields and hedgerows of the downs.
 * Everything is built from whole modules (walls, floors, rooms, furniture), never block by block. Mesh details (chandeliers, paintings,
 * candles) are listed in world.props and drawn by props.js. */
(function (root) {
  'use strict';
  const W = 256, D = 240, H = 96;
  const WATER_Y = 34.6;   // Milford Lake

  const T = {
    grass: 0, grassSide: 1, dirt: 2, rock: 3, snow: 4, snowSide: 5, path: 6, gravel: 7,
    pine: 8, bark: 9, trunkTop: 10, beech: 11, brook: 12, ashlar: 13, limeSmooth: 14, limeCarved: 15,
    brick: 16, slate: 17, glass: 18, door: 19, gold: 20, marble: 21, porphyry: 22, lapis: 23,
    oak: 24, oakCarved: 25, parquet: 26, plaster: 27, vault: 28, coffer: 29, carpet: 30, lamp: 31,
    wool: 32, planks: 33, curtain: 34, tuff: 35, moss: 36, iron: 37, balus: 38, meadow: 39,
    stove: 40, mural: 41, books: 42, fire: 43, flower: 44, fall: 45, mosaic: 46, goldMosaic: 47,
    bath: 48, wheat: 49, leather: 50, lead: 51, hedge: 52, silk: 53, cedar: 54, chequer: 55
  };
  const B = {
    AIR: 0, GRASS: 1, DIRT: 2, ROCK: 3, SNOW: 4, PATH: 5, GRAVEL: 6, PINE: 7, BARK: 8, BEECH: 9, BROOK: 10,
    LIME: 11, LIMES: 12, LIMEC: 13, BRICK: 14, SLATE: 15, GLASS: 16, DOOR: 17, GOLD: 18, MARBLE: 19, PORPH: 20, LAPIS: 21,
    OAK: 22, OAKC: 23, PARQ: 24, PLASTER: 25, VAULT: 26, COFFER: 27, CARPET: 28, LAMP: 29, BED: 30, TABLE: 31, CHAIR: 32,
    BENCH: 33, CURTAIN: 34, TUFF: 35, MOSS: 36, IRON: 37, BALUS: 38, MEADOW: 39, STOVE: 40, MURAL: 41, BOOKS: 42, FIRE: 43,
    FLOWER: 44, FALL: 45, MOSAIC: 46, GMOS: 47, MARBLEV: 48, PLANKS: 49,
    BATH: 50, BATHC: 51, WHEAT: 52, LEATHER: 53, LEAD: 54, HEDGE: 55, SILK: 56, CEDAR: 57, CHEQ: 58, SOFA: 59, PIANO: 60
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
  def(B.BATH, 'Bath stone', T.bath, T.bath, T.bath, false, 0.035);
  def(B.BATHC, 'carved Bath stone', T.limeSmooth, T.limeCarved, T.limeSmooth, false, 0.03);
  def(B.WHEAT, 'wheat', T.wheat, T.wheat, T.dirt, false, 0.08);
  def(B.LEATHER, 'gilded leather', T.leather, T.leather, T.leather, false, 0.02);
  def(B.LEAD, 'lead roof', T.lead, T.lead, T.lead, false, 0.04);
  def(B.HEDGE, 'box hedge', T.hedge, T.hedge, T.hedge, false, 0.1);
  def(B.SILK, 'silk wall', T.silk, T.silk, T.silk, false, 0.02);
  def(B.CEDAR, 'cedar', T.cedar, T.cedar, T.cedar, false, 0.14);
  def(B.CHEQ, 'chequered marble', T.chequer, T.marble, T.marble, false, 0.01);
  def(B.SOFA, 'sofa', T.curtain, T.curtain, T.oak, false, 0.03);
  def(B.PIANO, 'piano', T.oak, T.oak, T.oak, false, 0.02);

  function mulberry32(a) { return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function hash3(x, y, z) { let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(z | 0, 2147483647); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
  function vnoise(x, z, s) { const xi = Math.floor(x), zi = Math.floor(z), fx = x - xi, fz = z - zi, u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz);
    const a = hash3(xi, s, zi), b = hash3(xi + 1, s, zi), c = hash3(xi, s, zi + 1), d = hash3(xi + 1, s, zi + 1); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; }
  function fbm(x, z, s, oct) { let v = 0, a = 0.5, f = 1, n = 0; for (let i = 0; i < (oct || 4); i++) { v += vnoise(x * f, z * f, s + i * 17) * a; n += a; a *= 0.5; f *= 2; } return v / n; }
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };


  /* the plan: Highclere Castle, the house of Downton Abbey (rounded to whole metres; see README for what is estimated) */
  const P = {
    house: { x0: 100, x1: 156, z0: 90, z1: 140, g: 41, f1: 48, f2: 54, roof: 58 },     // floor levels: stand heights
    xs: [100, 120, 136, 156], zs: [90, 106, 123, 140],                                 // the inner wall lines of the 3 x 3 plan
    tower: { x0: 120, x1: 136, z0: 106, z1: 123, top: 74 },                             // the central tower over the Saloon
    lake: { x: 52, z: 196, rx: 34, rz: 18 },
    fountain: { x: 128, z: 74 },
    garden: { x0: 166, x1: 204, z0: 98, z1: 134 }
  };

  function create(seed) {
    seed = seed == null ? 1842 : seed;   // 1842: Barry's house finished
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
      bath: pal(0.9, 0.82, 0.64), bathL: pal(0.95, 0.89, 0.74), bathD: pal(0.78, 0.7, 0.54), lead: pal(0.52, 0.55, 0.58),
      oak: pal(0.42, 0.27, 0.15), oakD: pal(0.3, 0.19, 0.1), oakL: pal(0.6, 0.42, 0.24), walnut: pal(0.34, 0.22, 0.14), parq: pal(0.62, 0.43, 0.24),
      gold: pal(1.0, 0.82, 0.4), goldD: pal(0.84, 0.64, 0.28), marble: pal(0.96, 0.95, 0.92), marbleB: pal(0.3, 0.3, 0.32), marbleR: pal(0.62, 0.32, 0.26),
      green: pal(0.36, 0.56, 0.42), greenD: pal(0.22, 0.38, 0.28), red: pal(0.6, 0.12, 0.14), crimson: pal(0.7, 0.18, 0.2), blue: pal(0.3, 0.42, 0.66), cream: pal(0.94, 0.88, 0.74),
      gilt: pal(0.86, 0.66, 0.36), rose: pal(0.84, 0.6, 0.6), plum: pal(0.46, 0.26, 0.4), ivory: pal(0.96, 0.93, 0.84), black: pal(0.16, 0.15, 0.15),
      grass: pal(0.92, 1, 0.9), lawn: pal(0.86, 1.02, 0.84), hedge: pal(0.3, 0.46, 0.26), cedar: pal(0.3, 0.42, 0.32), wheat: pal(0.98, 0.86, 0.52), rock: pal(0.8, 0.77, 0.7),
      gravel: pal(0.86, 0.8, 0.68), brick: pal(0.72, 0.4, 0.3), bark: pal(0.56, 0.46, 0.36), iron: pal(0.3, 0.3, 0.32),
      leaf: [pal(0.42, 0.6, 0.3), pal(0.36, 0.54, 0.28), pal(0.5, 0.66, 0.32)], lime: [pal(0.5, 0.68, 0.34), pal(0.46, 0.64, 0.3)]
    };
    const landmarks = [], lamps = [], doors = [], seats = [], flags = [], buildings = [], chimneys = [], pasture = [];
    const props = { chandeliers: [], murals: [], apse: null, mosaic: [], palms: [], swans: [], candles: [], canopies: [] };
    function lamp(x, y, z, room, inten) { lamps.push([x + 0.5, y + 0.5, z + 0.5, room ? 1 : 0, inten || 1]); }
    function seat(x, y, z, yaw) { seats.push({ x: x + 0.5, y: y + 1, z: z + 0.5, yaw: yaw || 0 }); }
    function door(x, y, z, face) { doors.push({ x, y, z, face, open: false }); }   // the door leaves are set at the end, after every room has painted its walls
    function mural(x, y, z, w, h, face, theme) { props.murals.push({ x, y, z, w, h, face, theme }); }
    function win(x, y, z, h, arch) { for (let k = 0; k < h; k++) set(x, y + k, z, B.GLASS, 0); if (arch !== false) set(x, y + h, z, B.BATHC, C.bathL); }
    function walls(x0, z0, x1, z1, y0, y1, id, c) { for (let y = y0; y <= y1; y++) { for (let x = x0; x <= x1; x++) { set(x, y, z0, id, c); set(x, y, z1, id, c); } for (let z = z0; z <= z1; z++) { set(x0, y, z, id, c); set(x1, y, z, id, c); } } }
    let shell = null;   // the outer walls of the house (set once the plan is known): wallpaper goes on the cell inside them, so the fronts stay Bath stone
    function paint(x, y, z, id, c) {
      if (get(x, y, z) === B.GLASS || get(x, y, z) === B.DOOR) return;
      if (shell && y >= shell.y0) {
        if (z === shell.z0 && x > shell.x0 && x < shell.x1) z++; else if (z === shell.z1 && x > shell.x0 && x < shell.x1) z--;
        else if (x === shell.x0 && z > shell.z0 && z < shell.z1) x++; else if (x === shell.x1 && z > shell.z0 && z < shell.z1) x--;
        else if (x === shell.x0 || x === shell.x1 || z === shell.z0 || z === shell.z1) return;
      }
      set(x, y, z, id, c);
    }   // windows and doors already cut through the wall are kept; neighbours are not touched (the old neighbour rule spread glass along whole walls)

    /* ================= the park: rolling downland, a lake, fields with hedgerows ================= */
    const hf = new Float32Array(W * D), hm = new Uint8Array(W * D), occ = new Uint8Array(W * D), pathM = new Uint8Array(W * D);
    const HS = P.house, LK = P.lake;
    for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
      const d = Math.hypot((x - 128) / 1.2, z - 115);
      let h = 37 + fbm(x / 46, z / 46, 3, 4) * 5 - 2.2 + smooth(70, 150, d) * 9 * fbm(x / 70, z / 70, 9, 3);    // downs rising away from the house
      { const hx = Math.hypot(x - 36, z - 34); if (hx < 40) h = Math.max(h, 52 - hx * 0.32); }                  // Siddown hill with Heaven's Gate
      { const e = ((x - LK.x) / LK.rx) ** 2 + ((z - LK.z) / LK.rz) ** 2 + (fbm(x / 12, z / 12, 23, 2) - 0.5) * 0.35; if (e < 2) h = Math.min(h, e < 1 ? 30 + e * 3.5 : 34.2 + (e - 1) * 4); }
      if (d < 46) h = h + (37 - h) * smooth(46, 30, d);                                                          // the lawns round the house are level
      hf[zi(x, z)] = h;
    }
    for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
      const i = zi(x, z), h = Math.round(hf[i]);
      for (let y = 0; y < h; y++) {
        let id = B.ROCK, c = C.rock;
        if (y >= h - 3) { id = y === h - 1 ? B.GRASS : B.DIRT; c = id === B.GRASS ? C.grass : 0; }
        if (y === h - 1 && h <= WATER_Y + 0.6 && Math.hypot((x - LK.x) / LK.rx, (z - LK.z) / LK.rz) < 1.3) { id = B.GRAVEL; c = 0; }
        set(x, y, z, id, c);
      }
      hm[i] = h;
    }
    // fields (wheat, meadow, pasture) in a patchwork with hedgerows, north-east and south-east; the near park stays grass
    const fieldAt = (x, z) => { const fx = Math.floor((x + 7) / 38), fz = Math.floor((z + 11) / 34); return { fx, fz, k: hash3(fx, 3, fz) }; };
    for (let z = 2; z < D - 2; z++) for (let x = 2; x < W - 2; x++) {
      const d = Math.hypot((x - 128) / 1.2, z - 115); if (d < 78) continue; if (Math.hypot(x - 36, z - 34) < 30) continue;
      const i = zi(x, z), y = hm[i], f = fieldAt(x, z), edge = (x + 7) % 38 === 0 || (z + 11) % 34 === 0;
      if (get(x, y - 1, z) !== B.GRASS) continue;
      if (edge) { set(x, y, z, B.HEDGE, C.hedge); if (hash3(x, 5, z) < 0.05) set(x, y + 1, z, B.HEDGE, C.hedge); occ[i] = 1; continue; }
      if (f.k < 0.33) set(x, y - 1, z, B.WHEAT, C.wheat);
      else if (f.k < 0.55) set(x, y - 1, z, B.MEADOW, C.grass);
      else if (f.k > 0.85 && x < 128) pasture.push([x, z]);
    }

    /* ================= paths ================= */
    function road(pts, w, id, c) {
      for (let s = 0; s < pts.length - 1; s++) {
        const a = pts[s], b = pts[s + 1], n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) * 2);
        for (let k = 0; k <= n; k++) {
          const t = k / n, cx = a[0] + (b[0] - a[0]) * t, cz = a[1] + (b[1] - a[1]) * t;
          for (let dz = -w; dz <= w; dz++) for (let dx = -w; dx <= w; dx++) {
            if (dx * dx + dz * dz > w * w + 0.5) continue; const x = Math.round(cx + dx), z = Math.round(cz + dz); if (x < 0 || x >= W || z < 0 || z >= D) continue;
            const i = zi(x, z); set(x, hm[i] - 1, z, id || B.GRAVEL, c == null ? C.gravel : c); for (let y = hm[i]; y < hm[i] + 3; y++) if (get(x, y, z) === B.HEDGE || get(x, y, z) === B.WHEAT) set(x, y, z, B.AIR, 0); pathM[i] = 1; occ[i] = 1;
          }
        }
      }
    }
    road([[128, 1], [128, 64]], 2);                                               // the long drive from the north lodge
    road([[128, 64], [118, 70], [118, 80], [128, 86], [138, 80], [138, 70], [128, 64]], 1);   // round the fountain
    road([[160, 115], [P.garden.x0, 115], [P.garden.x1, 115]], 1);                 // into the garden
    road([[128, 145], [128, 175], [150, 200], [176, 214]], 1);                     // down the lawn to Jackdaws Castle
    road([[96, 115], [70, 90], [48, 60], [38, 40]], 1);                            // up Siddown to Heaven's Gate

    /* ================= the house ================= */
    const g = HS.g, f1 = HS.f1, f2 = HS.f2, rf = HS.roof;
    // the terrace: a stone platform with balustrades, steps down to the lawn
    box(HS.x0 - 5, 36, HS.z0 - 5, HS.x1 + 5, g - 1, HS.z1 + 5, B.BATH, C.bathD);
    for (let x = HS.x0 - 5; x <= HS.x1 + 5; x++) for (let z = HS.z0 - 5; z <= HS.z1 + 5; z++) { set(x, g - 1, z, B.CHEQ, ((x + z) & 1) ? C.bathL : C.bath); const i = zi(x, z); hm[i] = g; }
    for (let x = HS.x0 - 5; x <= HS.x1 + 5; x++) for (const z of [HS.z0 - 5, HS.z1 + 5]) if (Math.abs(x - 128) > 4) set(x, g, z, B.BALUS, C.bathL);
    for (let z = HS.z0 - 5; z <= HS.z1 + 5; z++) for (const x of [HS.x0 - 5, HS.x1 + 5]) if (Math.abs(z - 115) > 3) set(x, g, z, B.BALUS, C.bathL);
    for (let k = 1; k <= 4; k++) { box(124, 36, HS.z1 + 5 + k, 132, g - 1 - k, HS.z1 + 5 + k, B.BATH, C.bathL); box(124, 36, HS.z0 - 5 - k, 132, g - 1 - k, HS.z0 - 5 - k, B.BATH, C.bathL); box(HS.x1 + 5 + k, 36, 112, HS.x1 + 5 + k, g - 1 - k, 118, B.BATH, C.bathL); box(HS.x0 - 5 - k, 36, 112, HS.x0 - 5 - k, g - 1 - k, 118, B.BATH, C.bathL); }
    for (let x = HS.x0 - 5; x <= HS.x1 + 5; x++) for (let z = HS.z0 - 5; z <= HS.z1 + 5; z++) { const i = zi(x, z); pathM[i] = (x === HS.x0 - 4 || x === HS.x1 + 4 || z === HS.z0 - 4 || z === HS.z1 + 4) ? 1 : pathM[i]; occ[i] = 1; }
    // the shell: Bath stone walls to the roof, floors (each slab is the ceiling of the room below)
    walls(HS.x0, HS.z0, HS.x1, HS.z1, g, rf, B.BATH, C.bath);
    box(HS.x0 + 1, g - 1, HS.z0 + 1, HS.x1 - 1, g - 1, HS.z1 - 1, B.PARQ, C.parq);
    box(HS.x0 + 1, f1 - 1, HS.z0 + 1, HS.x1 - 1, f1 - 1, HS.z1 - 1, B.PARQ, C.parq);
    box(HS.x0 + 1, f2 - 1, HS.z0 + 1, HS.x1 - 1, f2 - 1, HS.z1 - 1, B.PARQ, C.oakL);
    box(HS.x0 + 1, rf, HS.z0 + 1, HS.x1 - 1, rf, HS.z1 - 1, B.LEAD, C.lead);
    // the inner walls of the 3 x 3 plan, ground and first floor
    for (const x of [P.xs[1], P.xs[2]]) box(x, g, HS.z0 + 1, x, f2 - 2, HS.z1 - 1, B.BATH, C.bathD);
    for (const z of [P.zs[1], P.zs[2]]) box(HS.x0 + 1, g, z, HS.x1 - 1, f2 - 2, z, B.BATH, C.bathD);
    // string courses, a plinth, the strapwork parapet with pinnacles, chimney stacks
    for (const y of [f1 - 1, f2 - 1, rf]) { for (let x = HS.x0 - 1; x <= HS.x1 + 1; x++) for (const z of [HS.z0 - 1, HS.z1 + 1]) set(x, y, z, B.BATHC, C.bathL); for (let z = HS.z0 - 1; z <= HS.z1 + 1; z++) for (const x of [HS.x0 - 1, HS.x1 + 1]) set(x, y, z, B.BATHC, C.bathL); }
    for (let x = HS.x0; x <= HS.x1; x++) for (const z of [HS.z0, HS.z1]) { set(x, rf + 1, z, B.BATHC, C.bathL); if ((x - HS.x0) % 4 === 0) { set(x, rf + 2, z, B.BATHC, C.bathL); set(x, rf + 3, z, B.BATH, C.bathL); } }
    for (let z = HS.z0; z <= HS.z1; z++) for (const x of [HS.x0, HS.x1]) { set(x, rf + 1, z, B.BATHC, C.bathL); if ((z - HS.z0) % 4 === 0) { set(x, rf + 2, z, B.BATHC, C.bathL); set(x, rf + 3, z, B.BATH, C.bathL); } }
    for (const [x, z] of [[108, 98], [148, 98], [108, 132], [148, 132], [110, 115], [146, 115]]) { box(x, rf + 1, z, x + 1, rf + 5, z + 1, B.BATH, C.bathD); set(x, rf + 6, z, B.BATHC, C.bathL); set(x + 1, rf + 6, z + 1, B.BATHC, C.bathL); chimneys.push([x + 1, rf + 7, z + 1]); }
    // windows: tall mullioned windows on the state floor, smaller above, in pairs every 3 m
    function facade(face) {
      const along = face === 'n' || face === 's', a0 = along ? HS.x0 + 2 : HS.z0 + 2, a1 = along ? HS.x1 - 2 : HS.z1 - 2, fix = face === 'n' ? HS.z0 : face === 's' ? HS.z1 : face === 'w' ? HS.x0 : HS.x1;
      const inner = along ? P.xs.slice(1, 3) : P.zs.slice(1, 3);
      for (let a = a0; a <= a1; a++) {
        const m = (a - a0) % 5; if (m === 0 || m >= 3) continue;   // two-light mullioned windows with three-metre piers between them (Barry's Highclere fronts are more wall than glass) if (inner.some((w) => Math.abs(a - w) < 1)) continue;
        const put = (y, h, arch) => { if (along) win(a, y, fix, h, arch); else win(fix, y, a, h, arch); };
        put(g + 1, 4, true); put(f1 + 1, 3, true); put(f2 + 1, 2, false);
        if (m === 1 || m === 2) { const y = g + 3; if (along) set(a, y, fix, B.BATHC, C.bathL); else set(fix, y, a, B.BATHC, C.bathL); }   // the transom of the state-floor windows
      }
    }
    ['n', 's', 'w', 'e'].forEach(facade);
    shell = { x0: HS.x0, z0: HS.z0, x1: HS.x1, z1: HS.z1, y0: g };
    // the four corner towers: square, one storey higher, with pinnacles
    for (const [cx, cz] of [[HS.x0, HS.z0], [HS.x1, HS.z0], [HS.x0, HS.z1], [HS.x1, HS.z1]]) {
      const x0 = cx - 4, z0 = cz - 4, x1 = cx + 4, z1 = cz + 4;
      walls(x0, z0, x1, z1, g, rf + 6, B.BATH, C.bath);
      for (let y = g; y <= rf + 6; y++) for (let z = z0 + 1; z < z1; z++) for (let x = x0 + 1; x < x1; x++) { const inside = x > HS.x0 && x < HS.x1 && z > HS.z0 && z < HS.z1; if (!inside) set(x, y, z, B.BATH, C.bathD); }
      box(x0 + 1, rf + 6, z0 + 1, x1 - 1, rf + 6, z1 - 1, B.LEAD, C.lead);
      for (let x = x0; x <= x1; x++) for (const z of [z0, z1]) { set(x, rf + 7, z, B.BATHC, C.bathL); }
      for (let z = z0; z <= z1; z++) for (const x of [x0, x1]) { set(x, rf + 7, z, B.BATHC, C.bathL); }
      for (const [px, pz] of [[x0, z0], [x1, z0], [x0, z1], [x1, z1]]) { box(px, rf + 7, pz, px, rf + 10, pz, B.BATH, C.bathL); set(px, rf + 11, pz, B.BATHC, C.bathL); set(px, rf + 12, pz, B.GOLD, C.goldD); }
      for (const y of [g + 1, f1 + 1, f2 + 1, rf + 2]) { const hh = y === g + 1 ? 4 : y === rf + 2 ? 2 : 3; for (const d of [-2, 2]) { win(cx + d, y, cz - 4, hh, false); win(cx + d, y, cz + 4, hh, false); win(cx - 4, y, cz + d, hh, false); win(cx + 4, y, cz + d, hh, false); } }
      for (const y of [f1 - 1, f2 - 1, rf]) { for (let x = x0 - 1; x <= x1 + 1; x++) for (const z of [z0 - 1, z1 + 1]) set(x, y, z, B.BATHC, C.bathL); for (let z = z0 - 1; z <= z1 + 1; z++) for (const x of [x0 - 1, x1 + 1]) set(x, y, z, B.BATHC, C.bathL); }
    }
    // the central tower: rises over the Saloon, lit by its tall windows; corner turrets with pinnacles, a pierced parapet
    const tw = P.tower;
    walls(tw.x0, tw.z0, tw.x1, tw.z1, g, tw.top, B.BATH, C.bath);
    box(tw.x0 + 1, tw.top - 1, tw.z0 + 1, tw.x1 - 1, tw.top - 1, tw.z1 - 1, B.COFFER, C.gilt);
    box(tw.x0, tw.top, tw.z0, tw.x1, tw.top, tw.z1, B.LEAD, C.lead);
    for (let a = 0; a <= 16; a++) {
      const m = a % 4; if (m === 0) continue;
      for (const y of [rf + 3]) { if (tw.x0 + a <= tw.x1) { win(tw.x0 + a, y, tw.z0, 8, m === 2); win(tw.x0 + a, y, tw.z1, 8, m === 2); } if (tw.z0 + a <= tw.z1) { win(tw.x0, y, tw.z0 + a, 8, m === 2); win(tw.x1, y, tw.z0 + a, 8, m === 2); } }
    }
    for (const y of [rf + 1, rf + 2, tw.top - 2]) { for (let x = tw.x0 - 1; x <= tw.x1 + 1; x++) for (const z of [tw.z0 - 1, tw.z1 + 1]) set(x, y, z, B.BATHC, C.bathL); for (let z = tw.z0 - 1; z <= tw.z1 + 1; z++) for (const x of [tw.x0 - 1, tw.x1 + 1]) set(x, y, z, B.BATHC, C.bathL); }
    for (let x = tw.x0; x <= tw.x1; x++) for (const z of [tw.z0, tw.z1]) { set(x, tw.top + 1, z, B.BATHC, C.bathL); if (x % 2 === 0) set(x, tw.top + 2, z, B.BATH, C.bathL); }
    for (let z = tw.z0; z <= tw.z1; z++) for (const x of [tw.x0, tw.x1]) { set(x, tw.top + 1, z, B.BATHC, C.bathL); if (z % 2 === 0) set(x, tw.top + 2, z, B.BATH, C.bathL); }
    for (const [px, pz] of [[tw.x0, tw.z0], [tw.x1, tw.z0], [tw.x0, tw.z1], [tw.x1, tw.z1]]) { box(px - 1, tw.top - 4, pz - 1, px + 1, tw.top + 3, pz + 1, B.BATH, C.bath); for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) set(px + dx, tw.top + 4, pz + dz, B.BATHC, C.bathL); box(px, tw.top + 4, pz, px, tw.top + 7, pz, B.BATH, C.bathL); set(px, tw.top + 8, pz, B.GOLD, C.goldD); }
    for (const [px, pz] of [[128, tw.z0], [128, tw.z1], [tw.x0, 114], [tw.x1, 114]]) { box(px, tw.top + 1, pz, px, tw.top + 4, pz, B.BATH, C.bathL); set(px, tw.top + 5, pz, B.BATHC, C.bathL); }
    flags.push([128, tw.top + 13, 114]);
    // the porte-cochere on the north front: arches on piers, a parapet
    { const x0 = 122, x1 = 134, z0 = HS.z0 - 9, z1 = HS.z0 - 1;
      for (const [px, pz] of [[x0, z0], [x1, z0], [x0, z1 - 2], [x1, z1 - 2], [127, z0], [129, z0]]) box(px, g, pz, px + (px === 127 || px === 129 ? 0 : 1), g + 5, pz + 1, B.BATH, C.bath);
      box(x0, g + 6, z0, x1 + 1, g + 6, z1, B.BATH, C.bathL); box(x0, g + 7, z0, x1 + 1, g + 7, z1, B.BATHC, C.bathL);
      for (let x = x0; x <= x1 + 1; x += 2) set(x, g + 8, z0, B.BATH, C.bathL); for (let x = x0 + 2; x < x1; x++) set(x, g + 5, z0, B.BATHC, C.bathL);
      box(x0 + 1, g + 5, z0 + 1, x1, g + 5, z1, B.COFFER, C.bathL);
      lamp(128, g + 4, z0 + 4, false, 1.2); }
    buildings.push({ id: 'house', name: '海克利尔城堡 Highclere Castle', x0: HS.x0, z0: HS.z0, x1: HS.x1, z1: HS.z1, y: g });

    /* ================= the state rooms (ground floor, y 41..46) ================= */
    const gy1 = f1 - 2;   // the highest air cell of a ground-floor room (46): the slab at 47 is its ceiling
    const X = P.xs, Z = P.zs;
    // the doors between the state rooms are planned first, so bookcases and furniture keep clear of them
    door(X[1], g, 98, 'e'); door(110, g, Z[1], 's'); door(X[2], g, 98, 'w'); door(146, g, Z[1], 's'); door(X[2], g, 131, 'w'); door(X[1], g, 131, 'w'); door(146, g, Z[2], 'n');
    function room(x0, z0, x1, z1, y0, y1, wallId, wallC, floorId, floorC) {   // inner faces: wallpaper / silk / leather; skirting, a cornice
      clear(x0, y0, z0, x1, y1, z1);
      for (let y = y0; y <= y1; y++) { const id = y === y0 ? B.OAK : y === y1 ? B.BATHC : wallId, c = y === y0 ? C.oakD : y === y1 ? C.gilt : wallC; for (let x = x0 - 1; x <= x1 + 1; x++) { paint(x, y, z0 - 1, id, c); paint(x, y, z1 + 1, id, c); } for (let z = z0; z <= z1; z++) { paint(x0 - 1, y, z, id, c); paint(x1 + 1, y, z, id, c); } }
      if (floorId) box(x0, y0 - 1, z0, x1, y0 - 1, z1, floorId, floorC);
      return { x0, z0, x1, z1 };
    }
    function rug(x0, z0, x1, z1, c) { box(x0, g - 1, z0, x1, g - 1, z1, B.CARPET, c); }
    function fireplace(x, z, face, y0, painting) {   // a marble chimneypiece with a fire, a painting above it
      const along = face === 'n' || face === 's', dx = along ? 1 : 0, dz = along ? 0 : 1, o = face === 's' ? -1 : face === 'n' ? 1 : face === 'e' ? -1 : 1;
      for (let k = -1; k <= 1; k++) { const xx = x + dx * k, zz = z + dz * k; set(xx, y0, zz, k === 0 ? B.FIRE : B.MARBLE, C.marble); set(xx, y0 + 1, zz, k === 0 ? B.MARBLE : B.MARBLE, C.marble); set(xx, y0 + 2, zz, B.BATHC, C.marble); }
      set(x + dx * -2, y0 + 2, z + dz * -2, B.BATHC, C.marble); set(x + dx * 2, y0 + 2, z + dz * 2, B.BATHC, C.marble);
      lamp(along ? x : x + o, y0, along ? z + o : z, true, 0.9); chimneys.push([x, rf + 7, z]);
      if (painting) { const fy = y0 + 3; if (face === 'n') mural(x - 1, fy, z + 1, 3, 2, '+z', painting); else if (face === 's') mural(x - 1, fy, z, 3, 2, '-z', painting); else if (face === 'w') mural(x + 1, fy, z - 1, 3, 2, '+x', painting); else mural(x, fy, z - 1, 3, 2, '-x', painting); }
    }
    function chair(x, z, yaw, c, y0) { set(x, y0 == null ? g : y0, z, B.CHAIR, c || C.crimson); seat(x, y0 == null ? g : y0, z, yaw); }
    function sofa(x0, z0, x1, z1, yaw, c, y0) { const yy = y0 == null ? g : y0; box(x0, yy, z0, x1, yy, z1, B.SOFA, c); for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) seat(x, yy, z, yaw); }
    const doorAt = (x, z) => doors.some((d) => d.x === x && d.z === z);
    function bookcases(r, y0, y1, skip) {   // dark wood bookcases round the walls, except at doors, windows and the fireplace
      for (let y = y0; y <= y1; y++) {
        for (let x = r.x0; x <= r.x1; x++) for (const [z, out] of [[r.z0, r.z0 - 1], [r.z1, r.z1 + 1]]) if (get(x, y, out) !== B.GLASS && !doorAt(x, out) && !(skip && skip(x, z))) set(x, y, z, y === y1 ? B.OAKC : B.BOOKS, C.walnut);
        for (let z = r.z0; z <= r.z1; z++) for (const [x, out] of [[r.x0, r.x0 - 1], [r.x1, r.x1 + 1]]) if (get(out, y, z) !== B.GLASS && !doorAt(out, z) && !(skip && skip(x, z))) set(x, y, z, y === y1 ? B.OAKC : B.BOOKS, C.walnut);
      }
    }

    // ---- the Saloon: the great central hall, open to the tower; gothic arcades, gilded leather walls, a gallery all round ----
    const sa = { x0: X[1] + 1, z0: Z[1] + 1, x1: X[2] - 1, z1: Z[2] - 1 };
    clear(sa.x0, g, sa.z0, sa.x1, tw.top - 2, sa.z1);
    for (let y = g; y < tw.top - 1; y++) { for (let x = sa.x0 - 1; x <= sa.x1 + 1; x++) { paint(x, y, sa.z0 - 1, y < f1 - 1 || y > f2 ? B.LEATHER : B.BATH, C.gilt); paint(x, y, sa.z1 + 1, y < f1 - 1 || y > f2 ? B.LEATHER : B.BATH, C.gilt); } for (let z = sa.z0; z <= sa.z1; z++) { paint(sa.x0 - 1, y, z, y < f1 - 1 || y > f2 ? B.LEATHER : B.BATH, C.gilt); paint(sa.x1 + 1, y, z, y < f1 - 1 || y > f2 ? B.LEATHER : B.BATH, C.gilt); } }
    box(sa.x0, g - 1, sa.z0, sa.x1, g - 1, sa.z1, B.CHEQ, C.marble); for (let x = sa.x0; x <= sa.x1; x++) for (let z = sa.z0; z <= sa.z1; z++) if ((x + z) & 1) set(x, g - 1, z, B.CHEQ, C.marbleB);
    rug(sa.x0 + 4, sa.z0 + 4, sa.x1 - 4, sa.z1 - 4, C.crimson);
    // the gallery (first floor) on all four sides, 2 m deep, carried on a gothic arcade
    for (let x = sa.x0; x <= sa.x1; x++) for (let z = sa.z0; z <= sa.z1; z++) { const ring = x < sa.x0 + 2 || x > sa.x1 - 2 || z < sa.z0 + 2 || z > sa.z1 - 2; if (ring) set(x, f1 - 1, z, B.PARQ, C.oak); }
    for (let x = sa.x0 + 2; x <= sa.x1 - 2; x++) for (const z of [sa.z0 + 2, sa.z1 - 2]) set(x, f1, z, B.BALUS, C.oak);
    for (let z = sa.z0 + 2; z <= sa.z1 - 2; z++) for (const x of [sa.x0 + 2, sa.x1 - 2]) set(x, f1, z, B.BALUS, C.oak);
    for (let x = sa.x0 + 2; x <= sa.x1 - 2; x++) for (const z of [sa.z0 + 2, sa.z1 - 2]) { const col = (x - sa.x0 - 2) % 3 === 0; if (col) box(x, g, z, x, f1 - 2, z, B.BATH, C.bathL); else set(x, f1 - 2, z, B.BATHC, C.bathL); }
    for (let z = sa.z0 + 2; z <= sa.z1 - 2; z++) for (const x of [sa.x0 + 2, sa.x1 - 2]) { const col = (z - sa.z0 - 2) % 3 === 0; if (col) box(x, g, z, x, f1 - 2, z, B.BATH, C.bathL); else set(x, f1 - 2, z, B.BATHC, C.bathL); }
    // the upper arcade (first floor) and the high windows of the tower above
    for (let x = sa.x0 + 2; x <= sa.x1 - 2; x += 3) for (const z of [sa.z0 + 2, sa.z1 - 2]) box(x, f1 + 1, z, x, f2 - 1, z, B.BATH, C.bathL);
    for (let z = sa.z0 + 2; z <= sa.z1 - 2; z += 3) for (const x of [sa.x0 + 2, sa.x1 - 2]) box(x, f1 + 1, z, x, f2 - 1, z, B.BATH, C.bathL);
    for (let x = sa.x0 + 2; x <= sa.x1 - 2; x++) for (const z of [sa.z0 + 2, sa.z1 - 2]) set(x, f2, z, B.BATHC, C.gilt);
    for (let z = sa.z0 + 2; z <= sa.z1 - 2; z++) for (const x of [sa.x0 + 2, sa.x1 - 2]) set(x, f2, z, B.BATHC, C.gilt);
    // the arches out of the Saloon: north to the entrance hall, west to the library, east to the staircase, south to the music room
    clear(125, g, Z[1], 130, g + 4, Z[1]); clear(125, g, Z[2], 130, g + 4, Z[2]); clear(X[1], g, 112, X[1], g + 4, 117); clear(X[2], g, 112, X[2], g + 4, 117);
    for (const [a, b, fix, ax] of [[125, 130, Z[1], 'x'], [125, 130, Z[2], 'x'], [112, 117, X[1], 'z'], [112, 117, X[2], 'z']]) for (let k = a - 1; k <= b + 1; k++) { if (ax === 'x') set(k, g + 5, fix, B.BATHC, C.gilt); else set(fix, g + 5, k, B.BATHC, C.gilt); }
    fireplace(sa.x0 + 7, sa.z0, 'n', g, null);   // (in the arcade aisle)
    sofa(124, 116, 126, 116, Math.PI, C.crimson); sofa(129, 116, 131, 116, Math.PI, C.crimson); chair(127, 111, 0, C.crimson); chair(128, 111, 0, C.crimson);
    props.chandeliers.push({ x: 128.5, y: f2 + 3, z: 115, top: tw.top - 1, r: 1.8, candles: 32, kind: 'ring' });
    lamp(128, f1, 115, true, 1.5); lamp(128, f2 + 4, 115, true, 1.0);
    for (const [x, z, f] of [[sa.x0 + 2, sa.z0, '+z'], [sa.x1 - 5, sa.z0, '+z'], [sa.x0 + 2, sa.z1 + 1, '-z'], [sa.x1 - 5, sa.z1 + 1, '-z']]) mural(x, f1 + 1, z, 3, 3, f, 'portrait');
    landmarks.push({ id: 'saloon', name: '中央大厅（沙龙）', en: 'The Saloon', x: 128, z: 115, top: g + 6, r: 7, tp: { mode: 'walk', p: [128.5, g, 108.5], t: [128, g + 6, 122] } });

    // ---- the entrance hall (north centre), the front door under the porte-cochere ----
    const eh = room(X[1] + 1, Z[0] + 1, X[2] - 1, Z[1] - 1, g, gy1, B.PLASTER, C.cream, B.CHEQ, C.marble);
    for (let x = eh.x0; x <= eh.x1; x++) for (let z = eh.z0; z <= eh.z1; z++) set(x, g - 1, z, B.CHEQ, (x + z) & 1 ? C.marble : C.marbleB);
    clear(127, g, HS.z0, 128, g + 1, HS.z0); door(127, g, HS.z0, 'n'); door(128, g, HS.z0, 'n'); set(127, g + 2, HS.z0, B.BATHC, C.bathL); set(128, g + 2, HS.z0, B.BATHC, C.bathL);
    for (const z of [94, 102]) for (const x of [eh.x0 + 1, eh.x1 - 1]) box(x, g, z, x, gy1, z, B.MARBLE, C.marble);
    set(eh.x0, g, 95, B.TABLE, C.oak); set(eh.x1, g, 95, B.TABLE, C.oak); chair(eh.x0, 93, Math.PI / 2, C.green); chair(eh.x1, 93, -Math.PI / 2, C.green);
    lamp(128, gy1 - 1, 98, true, 0.9); props.chandeliers.push({ x: 128.5, y: gy1 - 0.4, z: 98.5, top: gy1 + 1, r: 0.8, candles: 12, kind: 'small' });
    landmarks.push({ id: 'front', name: '正门 · 门廊', en: 'Front door · porte-cochère', x: 128, z: HS.z0 - 6, top: g + 4, r: 8, tp: { mode: 'walk', p: [128.5, g, HS.z0 - 10.5], t: [128, g + 10, HS.z0] } });

    // ---- the Library (the whole west side, a double library joined by an arch): dark bookcases, fireplaces, sofas, a desk ----
    const lb1 = room(X[0] + 1, Z[1] + 1, X[1] - 1, Z[2] - 1, g, gy1, B.SILK, C.red, B.PARQ, C.parq);
    const lb2 = room(X[0] + 1, Z[2] + 1, X[1] - 1, Z[3] - 1, g, gy1, B.SILK, C.red, B.PARQ, C.parq);
    clear(104, g, Z[2], 116, gy1 - 1, Z[2]); for (let x = 103; x <= 117; x++) set(x, gy1, Z[2], B.OAKC, C.oakD); for (const x of [103, 117]) box(x, g, Z[2], x, gy1, Z[2], B.OAKC, C.oakD);   // the arch between the two rooms
    clear(X[1], g, 112, X[1], g + 4, 117);
    bookcases(lb1, g, g + 3, (x, z) => (x >= 104 && x <= 116 && z === lb1.z1) || (z >= 112 && z <= 117 && x === lb1.x1));
    bookcases(lb2, g, g + 3, (x, z) => (x >= 104 && x <= 116 && z === lb2.z0));
    // the fireplaces stand out from the bookcases
    for (const z of [114, 131]) { box(X[0] + 1, g, z - 2, X[0] + 1, g + 2, z + 2, B.MARBLE, C.marble); }
    fireplace(X[0] + 1, 114, 'w', g, 'landscape'); fireplace(X[0] + 1, 131, 'w', g, 'portrait');
    rug(104, 109, 114, 120, C.crimson); rug(104, 126, 114, 137, C.blue);
    sofa(106, 112, 106, 116, -Math.PI / 2, C.crimson); sofa(112, 112, 112, 116, Math.PI / 2, C.crimson); box(108, g, 113, 110, g, 115, B.TABLE, C.oak);
    box(107, g, 129, 110, g, 130, B.TABLE, C.walnut); chair(108, 131, Math.PI, C.green); chair(109, 128, 0, C.green);   // the writing table
    sofa(105, 134, 108, 134, Math.PI, C.green); chair(112, 133, Math.PI, C.crimson); chair(113, 129, -Math.PI / 2, C.crimson);
    for (const [x, z] of [[110, 114], [109, 129]]) props.candles.push({ x: x + 0.5, y: g + 1, z: z + 0.5, h: 0.5 });
    for (const [x, z] of [[110, 114], [110, 131]]) { props.chandeliers.push({ x: x + 0.5, y: gy1 - 0.5, z: z + 0.5, top: gy1 + 1, r: 1.0, candles: 18, kind: 'small' }); lamp(x, gy1 - 1, z, true, 1.0); }
    landmarks.push({ id: 'library', name: '图书馆', en: 'The Library', x: 110, z: 122, top: g + 5, r: 10, tp: { mode: 'walk', p: [116.5, g, 136.5], t: [104, g + 1.5, 112] } });

    // ---- the Dining Room (north-west): the long table, the great equestrian portrait, sideboards, two chandeliers ----
    const dn = room(X[0] + 1, Z[0] + 1, X[1] - 1, Z[1] - 1, g, gy1, B.SILK, C.crimson, B.PARQ, C.parq);
    rug(103, 94, 117, 102, C.crimson);
    box(106, g, 97, 115, g, 99, B.TABLE, C.walnut);
    for (let x = 107; x <= 114; x += 1) { chair(x, 96, 0, C.crimson); chair(x, 100, Math.PI, C.crimson); } chair(105, 98, Math.PI / 2, C.crimson); chair(116, 98, -Math.PI / 2, C.crimson);
    for (let x = 107; x <= 114; x += 3) props.candles.push({ x: x + 0.5, y: g + 1, z: 98.5, h: 0.6 });
    box(dn.x0, g, 94, dn.x0, g, 102, B.TABLE, C.oak); box(dn.x1, g, 93, dn.x1, g, 95, B.TABLE, C.oak);
    mural(dn.x0, g + 1, 94, 9, 5, '+x', 'equestrian');                         // Charles I on horseback (after Van Dyck): here a stylised painting
    mural(108, g + 2, dn.z0, 4, 3, '+z', 'portrait'); mural(112, g + 2, dn.z1 + 1, 4, 3, '-z', 'portrait');
    for (const x of [108, 113]) { props.chandeliers.push({ x: x + 0.5, y: gy1 - 0.5, z: 98.5, top: gy1 + 1, r: 1.0, candles: 18, kind: 'small' }); lamp(x, gy1 - 1, 98, true, 1.0); }
    door(X[1], g, 98, 'e'); door(110, g, Z[1], 's');
    landmarks.push({ id: 'dining', name: '正式餐厅', en: 'The Dining Room', x: 110, z: 98, top: g + 5, r: 8, tp: { mode: 'walk', p: [117.5, g, 103.5], t: [102, g + 2, 97] } });

    // ---- the Study (north-east): the Earl's desk, bookcases, leather chairs ----
    const sd = room(X[2] + 1, Z[0] + 1, X[3] - 1, Z[1] - 1, g, gy1, B.PLASTER, C.green, B.PARQ, C.parq);
    bookcases(sd, g, g + 3, (x, z) => z === sd.z1 || (x === sd.x0 && z >= 96 && z <= 100));
    box(145, g, 97, 148, g, 98, B.TABLE, C.walnut); chair(146, 99, Math.PI, C.oakD); chair(147, 95, 0, C.oak);
    sofa(141, 101, 143, 101, Math.PI, C.oakD); chair(151, 101, Math.PI, C.oakD);
    fireplace(X[3] - 1, 98, 'e', g, 'hunt'); rug(140, 94, 152, 103, C.blue);
    props.candles.push({ x: 145.5, y: g + 1, z: 97.5, h: 0.5 });
    door(X[2], g, 98, 'w'); door(146, g, Z[1], 's');
    lamp(146, gy1 - 1, 98, true, 0.9); props.chandeliers.push({ x: 146.5, y: gy1 - 0.4, z: 98.5, top: gy1 + 1, r: 0.8, candles: 12, kind: 'small' });
    landmarks.push({ id: 'study', name: '书房（伯爵的书房）', en: 'The Study', x: 146, z: 98, top: g + 5, r: 7, tp: { mode: 'walk', p: [139.5, g, 103.5], t: [150, g + 1, 96] } });

    // ---- the Music Room (south centre) and the Drawing Room (south-east: green silk, gilded French furniture) ----
    const mu = room(X[1] + 1, Z[2] + 1, X[2] - 1, Z[3] - 1, g, gy1, B.SILK, C.rose, B.PARQ, C.parq);
    box(124, g, 130, 126, g, 132, B.PIANO, C.black); chair(125, 129, 0, C.black);   // the grand piano
    sofa(129, 135, 132, 135, Math.PI, C.rose); chair(130, 130, 0, C.gilt); chair(132, 130, 0, C.gilt); rug(123, 127, 133, 137, C.plum);
    mural(122, g + 2, mu.z0, 4, 3, '+z', 'landscape'); mural(129, g + 2, mu.z0, 4, 3, '+z', 'landscape');
    clear(127, g, HS.z1, 128, g + 1, HS.z1); door(127, g, HS.z1, 's'); door(128, g, HS.z1, 's');   // to the south terrace and the lawn
    lamp(128, gy1 - 1, 131, true, 0.9); props.chandeliers.push({ x: 128.5, y: gy1 - 0.4, z: 131.5, top: gy1 + 1, r: 1.0, candles: 16, kind: 'small' });
    const dr = room(X[2] + 1, Z[2] + 1, X[3] - 1, Z[3] - 1, g, gy1, B.SILK, C.green, B.PARQ, C.parq);
    rug(139, 126, 153, 137, C.cream);
    sofa(141, 129, 141, 133, -Math.PI / 2, C.gilt); sofa(147, 129, 147, 133, Math.PI / 2, C.gilt); box(143, g, 130, 145, g, 132, B.TABLE, C.gilt);
    chair(150, 127, 0, C.rose); chair(152, 127, 0, C.rose); chair(150, 136, Math.PI, C.rose); chair(152, 136, Math.PI, C.rose);
    fireplace(X[3] - 1, 131, 'e', g, 'portrait'); mural(140, g + 2, dr.z0, 4, 3, '+z', 'landscape'); mural(147, g + 2, dr.z0, 4, 3, '+z', 'portrait');
    door(X[2], g, 131, 'w'); door(X[1], g, 131, 'w'); door(146, g, Z[2], 'n');
    for (const x of [142, 150]) { props.chandeliers.push({ x: x + 0.5, y: gy1 - 0.5, z: 131.5, top: gy1 + 1, r: 1.0, candles: 18, kind: 'small' }); lamp(x, gy1 - 1, 131, true, 1.0); }
    landmarks.push({ id: 'drawing', name: '起居室（绿色丝绸客厅）', en: 'The Drawing Room', x: 146, z: 131, top: g + 5, r: 8, tp: { mode: 'walk', p: [138.5, g, 126.5], t: [153, g + 2, 132] } });
    landmarks.push({ id: 'music', name: '音乐室', en: 'The Music Room', x: 128, z: 131, top: g + 5, r: 6, tp: { mode: 'walk', p: [128.5, g, 125.5], t: [125, g + 1, 132] } });

    // ---- the grand staircase hall (east centre): an oak staircase, up to the gallery of the first floor ----
    const sh = { x0: X[2] + 1, z0: Z[1] + 1, x1: X[3] - 1, z1: Z[2] - 1 };
    clear(sh.x0, g, sh.z0, sh.x1, f2 - 2, sh.z1);
    for (let y = g; y <= f2 - 2; y++) { for (let x = sh.x0 - 1; x <= sh.x1 + 1; x++) { paint(x, y, sh.z0 - 1, y === g ? B.OAK : B.PLASTER, y === g ? C.oakD : C.cream); paint(x, y, sh.z1 + 1, y === g ? B.OAK : B.PLASTER, y === g ? C.oakD : C.cream); } for (let z = sh.z0; z <= sh.z1; z++) paint(sh.x1 + 1, y, z, y === g ? B.OAK : B.PLASTER, y === g ? C.oakD : C.cream); }
    box(sh.x0, f2 - 1, sh.z0, sh.x1, f2 - 1, sh.z1, B.COFFER, C.oakL);
    clear(X[2], g, 112, X[2], g + 4, 117);
    // the lower flight (3 steps east), a wide landing, two return flights back west to the gallery (first floor)
    for (let k = 0; k < 3; k++) box(140 + k, g, 112, 140 + k, g + k, 117, B.PARQ, C.oak);
    box(143, g, sh.z0, 149, g + 3, sh.z1, B.PARQ, C.oak);
    for (const [za, zb] of [[sh.z0, sh.z0 + 2], [sh.z1 - 2, sh.z1]]) for (let k = 0; k < 3; k++) box(142 - k, g, za, 142 - k, g + 4 + k, zb, B.PARQ, C.oak);
    box(sh.x0, f1 - 1, sh.z0, 139, f1 - 1, sh.z1, B.PARQ, C.oak);                    // the gallery
    for (let z = sh.z0 + 3; z <= sh.z1 - 3; z++) set(140, f1, z, B.BALUS, C.oakD);
    for (let x = 140; x <= 142; x++) { set(x, g + 5 + (142 - x) + 1 > f1 ? f1 : g + 5 + (142 - x), sh.z0 + 3, B.BALUS, C.oakD); set(x, g + 5 + (142 - x) + 1 > f1 ? f1 : g + 5 + (142 - x), sh.z1 - 3, B.BALUS, C.oakD); }
    for (let k = 0; k < 3; k++) { set(140 + k, g + k + 1, 111, B.BALUS, C.oakD); set(140 + k, g + k + 1, 118, B.BALUS, C.oakD); }
    for (let z = sh.z0 + 3; z <= sh.z1 - 3; z++) if (z < 112 || z > 117) set(143, g + 4, z, B.BALUS, C.oakD);
    for (let z = 112; z <= 117; z++) set(150, g + 4, z, B.BALUS, C.oakD);
    for (let x = 144; x <= 149; x++) { set(x, g + 4, sh.z0 + 3 > sh.z0 ? sh.z0 + 3 : sh.z0, B.AIR, 0); }
    mural(sh.x1 + 1, g + 5, 111, 8, 5, '-x', 'portrait');
    box(151, g, 114, 152, g + 1, 115, B.OAKC, C.oakD);   // a newel and a long-case clock by the landing
    door(X[2], f1, 114, 'w');                              // gallery -> Saloon gallery
    door(138, f1, Z[1], 'n'); door(138, f1, Z[2], 's');    // gallery -> bedrooms
    props.chandeliers.push({ x: 146.5, y: f1 + 2, z: 114.5, top: f2 - 1, r: 1.3, candles: 24, kind: 'ring' }); lamp(146, f1 + 2, 114, true, 1.2); lamp(141, g + 2, 114, true, 0.6);
    landmarks.push({ id: 'stairs', name: '宏伟主楼梯', en: 'The Grand Staircase', x: 146, z: 114, top: f1 + 3, r: 7, tp: { mode: 'walk', p: [137.5, g, 114.5], t: [148, g + 5, 114] } });

    /* ================= the first floor: the Saloon gallery, bedrooms ================= */
    // west side: the gallery door to a corridor over the library; three bedrooms furnished
    door(X[1], f1, 114, 'w');
    const fy1 = f2 - 2;
    const bedN = room(X[2] + 1, Z[0] + 1, X[3] - 1, Z[1] - 1, f1, fy1, B.SILK, C.blue, null);
    const bedS = room(X[2] + 1, Z[2] + 1, X[3] - 1, Z[3] - 1, f1, fy1, B.SILK, C.rose, null);
    const corW = room(X[0] + 1, Z[1] + 1, X[1] - 1, Z[2] - 1, f1, fy1, B.PLASTER, C.cream, null);
    const bedW = room(X[0] + 1, Z[2] + 1, X[1] - 1, Z[3] - 1, f1, fy1, B.SILK, C.green, null);
    function bedroom(r, c, art, fire) {
      const bx = r.x0 + 3, bz = (r.z0 + r.z1) >> 1;
      box(bx, f1, bz - 1, bx + 2, f1, bz + 1, B.BED, c); for (const [x, z] of [[bx, bz - 1], [bx, bz + 1]]) box(x, f1, z, x, f1 + 3, z, B.OAKC, C.walnut); box(bx, f1 + 3, bz - 1, bx + 1, f1 + 3, bz + 1, B.CURTAIN, c);
      box(r.x1, f1, r.z0 + 2, r.x1, f1, r.z0 + 4, B.TABLE, C.walnut); chair(r.x1 - 2, r.z1 - 1, Math.PI, C.cream, f1); chair(r.x1 - 4, r.z1 - 1, Math.PI, C.cream, f1);
      box(r.x1 - 1, f1, r.z0, r.x1, f1 + 2, r.z0, B.OAK, C.walnut);   // a wardrobe
      mural(bx + 4, f1 + 2, r.z0, 3, 2, '+z', art); lamp(bx + 5, fy1 - 1, bz, true, 0.8);
      set(bx, f1, bz - 2, B.TABLE, C.walnut); set(bx, f1, bz + 2, B.TABLE, C.walnut);                       // bedside tables with candles
      props.candles.push({ x: bx + 0.5, y: f1 + 1, z: bz - 1.5, h: 0.35 }, { x: bx + 0.5, y: f1 + 1, z: bz + 2.5, h: 0.35 });
      sofa(bx + 4, bz - 1, bx + 4, bz + 1, Math.PI / 2, c, f1);                                               // a day-bed at the foot of the bed
      if (fire === 'n') fireplace(r.x1 - 4, r.z0, 'n', f1, 'landscape'); else fireplace(r.x1 - 4, r.z1, 's', f1, 'landscape');
      const ax = fire === 'n' ? r.z0 + 2 : r.z1 - 2;                                                          // two armchairs by the fire
      chair(r.x1 - 6, ax, fire === 'n' ? Math.PI : 0, c, f1); chair(r.x1 - 2, ax, fire === 'n' ? Math.PI : 0, c, f1);
      box(r.x0, f1, r.z1, r.x0 + 1, f1, r.z1, B.TABLE, C.oakD); chair(r.x0 + 2, r.z1, -Math.PI / 2, C.cream, f1);   // a writing table in the corner
    }
    bedroom(bedN, C.blue, 'portrait', 's'); bedroom(bedS, C.rose, 'landscape', 'n'); bedroom(bedW, C.green, 'portrait', 'n');
    door(110, f1, Z[2], 's');
    for (let x = corW.x0; x <= corW.x1; x += 4) mural(x, f1 + 1, corW.z0, 3, 2, '+z', 'portrait');
    lamp(110, fy1 - 1, 114, true, 0.7);
    landmarks.push({ id: 'bedroom', name: '楼上卧室', en: 'Bedrooms · first floor', x: 146, z: 98, top: f1 + 5, r: 7, tp: { mode: 'walk', p: [139.5, f1, 103.5], t: [143, f1 + 1, 98] } });
    landmarks.push({ id: 'bedroomS', name: '楼上卧室 · 南', en: 'Bedroom · first floor, south', x: 146, z: 131, top: f1 + 5, r: 8 });
    landmarks.push({ id: 'bedroomW', name: '楼上卧室 · 西', en: 'Bedroom · first floor, west', x: 110, z: 131, top: f1 + 5, r: 8 });
    landmarks.push({ id: 'gallery', name: '沙龙楼上回廊', en: 'The Saloon gallery', x: 128, z: 108, top: f1 + 5, r: 6, tp: { mode: 'walk', p: [133.5, f1, 108.5], t: [122, g + 1, 120] } });

    /* ================= the gardens and the park ================= */
    // the fountain in the forecourt: a round basin, a stone bowl, water
    { const F = P.fountain, y = hm[zi(F.x, F.z)];
      for (let dz = -5; dz <= 5; dz++) for (let dx = -5; dx <= 5; dx++) { const d = Math.hypot(dx, dz), x = F.x + dx, z = F.z + dz; if (d > 5.3) continue; if (d > 4.4) { set(x, y, z, B.BALUS, C.bathL); set(x, y - 1, z, B.BATH, C.bath); } else { set(x, y - 1, z, B.BROOK, 0); set(x, y - 2, z, B.BATH, C.bath); } occ[zi(x, z)] = 1; }
      box(F.x, y - 1, F.z, F.x, y + 1, F.z, B.BATH, C.bathL); for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) set(F.x + dx, y + 2, F.z + dz, B.BATH, C.bathL); set(F.x, y + 3, F.z, B.FALL, 0); set(F.x, y + 4, F.z, B.FALL, 0);
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) set(F.x + dx * 2, y, F.z + dz * 2, B.FALL, 0);
      landmarks.push({ id: 'fountain', name: '前庭喷泉', en: 'Forecourt fountain', x: F.x, z: F.z, top: y + 4, r: 8, tp: { mode: 'walk', p: [F.x + 0.5, y, F.z - 9.5], t: [128, 50, 100] } }); }
    // the walled formal garden east of the house: box hedges, flower beds, a sundial, gravel walks
    { const G = P.garden;
      for (let x = G.x0; x <= G.x1; x++) for (let z = G.z0; z <= G.z1; z++) {
        const i = zi(x, z), y = hm[i]; const wall = x === G.x0 || x === G.x1 || z === G.z0 || z === G.z1;
        if (wall) { if (!(z >= 113 && z <= 117 && x === G.x0)) { box(x, y, z, x, y + 2, z, B.BRICK, C.brick); set(x, y + 3, z, B.BATHC, C.bathL); } occ[i] = 1; continue; }
        const cx = (x - G.x0) % 9, cz = (z - G.z0) % 9, walkL = cx === 0 || cz === 0 || z === 115;
        if (walkL) { set(x, y - 1, z, B.GRAVEL, C.gravel); pathM[i] = 1; occ[i] = 1; continue; }
        if (cx === 1 || cx === 8 || cz === 1 || cz === 8) set(x, y, z, B.HEDGE, C.hedge); else set(x, y, z, B.FLOWER, 0);
        occ[i] = 1;
      }
      const cx = (G.x0 + G.x1) >> 1, y = hm[zi(cx, 115)]; box(cx, y, 115, cx, y + 1, 115, B.BATH, C.bathL); set(cx, y + 2, 115, B.IRON, C.iron);
      landmarks.push({ id: 'garden', name: '花园', en: 'The walled garden', x: cx, z: 115, top: y + 2, r: 14, tp: { mode: 'walk', p: [G.x0 + 3.5, y, 115.5], t: [G.x1, y + 1, 115] } }); }
    // Heaven's Gate on Siddown hill (a folly arch of 1749) and Jackdaws Castle (a temple front) by the lake
    { const x0 = 32, z = 34, y = hm[zi(36, 34)];
      box(x0, y - 2, z, x0 + 9, y - 1, z + 2, B.BRICK, C.brick);
      for (const px of [x0, x0 + 7]) box(px, y, z, px + 2, y + 11, z + 2, B.BRICK, C.brick);
      box(x0 + 3, y + 8, z, x0 + 6, y + 11, z + 2, B.BRICK, C.brick); for (let x = x0; x <= x0 + 9; x++) set(x, y + 12, z, (x & 1) ? B.BRICK : B.AIR, C.brick); box(x0 + 3, y + 7, z, x0 + 6, y + 7, z + 2, B.BATHC, C.bathL);
      landmarks.push({ id: 'heaven', name: '天堂之门（山顶门楼）', en: 'Heaven\'s Gate · Siddown hill', x: x0 + 4, z: z + 1, top: y + 12, r: 10, tp: { mode: 'walk', p: [x0 + 5, y, z + 12], t: [128, 55, 115] } }); }
    { const cx = 182, cz = 214, y = Math.max(hm[zi(cx, cz)], 36); box(cx - 5, 30, cz - 3, cx + 5, y - 1, cz + 3, B.BATH, C.bath);
      for (const px of [cx - 4, cx - 1, cx + 2, cx + 5]) box(px - 0, y, cz - 2, px, y + 6, cz - 2, B.BATH, C.bathL);
      box(cx - 5, y + 7, cz - 3, cx + 5, y + 7, cz + 2, B.BATHC, C.bathL); for (let k = 0; k < 3; k++) box(cx - 4 + k, y + 8 + k, cz - 3, cx + 4 - k, y + 8 + k, cz - 3, B.BATH, C.bathL);
      box(cx - 4, y, cz - 1, cx + 4, y + 6, cz + 2, B.BATH, C.bath);
      landmarks.push({ id: 'jackdaws', name: '寒鸦堡（湖边神庙）', en: 'Jackdaws Castle', x: cx, z: cz, top: y + 8, r: 10, tp: { mode: 'walk', p: [cx + 0.5, y, cz - 10], t: [cx, y + 4, cz] } }); }
    landmarks.push({ id: 'lake', name: '米尔福德湖', en: 'Milford Lake', x: LK.x, z: LK.z, top: 40, r: 26, tp: { mode: 'fly', p: [LK.x + 40, 50, LK.z - 30], t: [LK.x, 35, LK.z] } });

    /* ---- trees: cedars of Lebanon on the lawns, the lime avenue along the drive, oak and beech clumps in the park ---- */
    function cedar(x, z) {   // wide, flat layered branches
      const y = hm[zi(x, z)], hgt = RI(13, 17); for (let k = 0; k < hgt - 2; k++) set(x, y + k, z, B.BARK, C.bark);
      for (const [ly, r] of [[5, 7], [8, 6], [11, 4.5], [hgt - 1, 2.5]]) { if (ly >= hgt) continue; for (let dz = -Math.ceil(r); dz <= Math.ceil(r); dz++) for (let dx = -Math.ceil(r); dx <= Math.ceil(r); dx++) { const d = Math.hypot(dx, dz) + (hash3(x + dx, ly, z + dz) - 0.5) * 1.6; if (d > r) continue; for (let t = 0; t < 2; t++) if (isAir(x + dx, y + ly + t, z + dz) && (t === 0 || d < r - 1.5)) set(x + dx, y + ly + t, z + dz, B.CEDAR, C.cedar); } }
      occ[zi(x, z)] = 3;
    }
    function broadleaf(x, z, cset, big) {   // oak / lime / beech: a round crown
      const y = hm[zi(x, z)], hgt = big ? RI(9, 12) : RI(7, 9), r = big ? RI(4, 5) : RI(3, 4); for (let k = 0; k < hgt - 2; k++) set(x, y + k, z, B.BARK, C.bark);
      const pc = pick(cset); for (let dy = -2; dy <= 3; dy++) for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) { if (dx * dx + dz * dz + dy * dy * 1.6 > r * r + 1 || hash3(x + dx, y + dy, z + dz) < 0.1) continue; const yy = y + hgt - 2 + dy; if (isAir(x + dx, yy, z + dz)) set(x + dx, yy, z + dz, B.BEECH, pc); }
      occ[zi(x, z)] = 3;
    }
    for (const [x, z] of [[92, 156], [166, 154], [80, 128], [176, 82], [100, 170], [150, 178]]) cedar(x, z);
    for (let z = 6; z < 60; z += 8) for (const x of [121, 135]) broadleaf(x, z, C.lime, false);
    for (let t = 0; t < 2600; t++) {
      const x = RI(3, W - 4), z = RI(3, D - 4), i = zi(x, z), y = hm[i];
      if (occ[i] || pathM[i] || y <= WATER_Y + 1) continue; if (Math.hypot((x - 128) / 1.2, z - 115) < 62) continue;
      const top = get(x, y - 1, z); if (top !== B.GRASS) continue;
      const clump = fbm(x / 22, z / 22, 61, 3); if (clump < 0.58 || rnd() > 0.5) continue;
      let ok = true; for (let dz = -3; dz <= 3 && ok; dz++) for (let dx = -3; dx <= 3; dx++) if (get(x + dx, y, z + dz) === B.BARK) { ok = false; break; }
      if (ok) broadleaf(x, z, C.leaf, rnd() < 0.4);
    }

    /* ================= derived ================= */
    doors.forEach((d) => {   // a door in the outer wall: the wallpaper layer inside it is cut away
      const ix = d.x === HS.x0 ? 1 : d.x === HS.x1 ? -1 : 0, iz = d.z === HS.z0 ? 1 : d.z === HS.z1 ? -1 : 0;
      if (ix || iz) for (let k = 0; k < 2; k++) set(d.x + ix, d.y + k, d.z + iz, B.AIR, 0);
    });
    doors.forEach((d) => { set(d.x, d.y, d.z, B.DOOR, 0); set(d.x, d.y + 1, d.z, B.DOOR, 0); if (get(d.x, d.y + 2, d.z) === B.AIR) set(d.x, d.y + 2, d.z, B.BATHC, C.bathL); });
    { const seen = {}; for (let i = doors.length - 1; i >= 0; i--) { const k = doors[i].x + ',' + doors[i].y + ',' + doors[i].z; if (seen[k] || get(doors[i].x, doors[i].y, doors[i].z) !== B.DOOR) doors.splice(i, 1); else seen[k] = 1; } }
    const walk = new Uint8Array(W * D);
    for (let i = 0; i < W * D; i++) if (pathM[i]) { const x = i % W, z = (i / W) | 0, y = hm[i]; if (get(x, y - 1, z) !== B.AIR && get(x, y, z) === B.AIR && get(x, y + 1, z) === B.AIR) walk[i] = 1; }
    const topH = new Uint8Array(W * D), topB = new Uint8Array(W * D), topC = new Uint8Array(W * D);
    for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) for (let y = H - 1; y >= 0; y--) { const b = blocks[idx(x, y, z)]; if (b) { topH[zi(x, z)] = y; topB[zi(x, z)] = b; topC[zi(x, z)] = cols[idx(x, y, z)]; break; } }
    const spawn = { x: 128.5, y: hm[zi(128, 58)], z: 58.5, yaw: Math.PI };
    const tour = {
      cam: [[128, 52, 40], [190, 62, 80], [210, 58, 150], [160, 52, 196], [90, 50, 200], [40, 60, 140], [60, 66, 70], [128, 46, 30]],
      tgt: [[128, 50, 110], [130, 52, 112], [128, 50, 118], [128, 52, 118], [128, 52, 115], [126, 52, 112], [128, 54, 112], [128, 50, 100]],
      dur: 140
    };
    return {
      W, D, H, BASE: 37, GY: 36, WATER_Y, blocks, cols, palette, pal, get, set, idx, inb, B, BI, P,
      hm, walk, occ, land: null, topH, topB, topC, landmarks, lamps, flags, chimneys, doors, seats, pasture, buildings, props,
      spawn, tour, lake: { x: LK.x, z: LK.z, w: LK.rx * 2.3, d: LK.rz * 2.4 }, moorings: []
    };
  }

  root.DAWorld = { W, D, H, WATER_Y, B, BI, T, P, create, hash3, mulberry32 };
  if (typeof module !== 'undefined') module.exports = root.DAWorld;
})(typeof window !== 'undefined' ? window : globalThis);
