/* Hallstatt (Salzkammergut) Voxel World — procedural generator (no DOM / no THREE dependency).
 * Exposes global HallstattWorld = { W, D, H, P, B, BI, T, create(seed) }.
 * Layout: the alpine lake (Hallstätter See) lies to the WEST; the colourful village clings to a narrow
 *   shelf between the water and the limestone peaks that climb steeply to the EAST.
 * x east, z south, y up. Cell (x,y,z) occupies [x,x+1)×[y,y+1)×[z,z+1).
 * hm[x,z] = number of solid layers in a column (top block y = hm-1, first air cell y = hm).
 */
(function (root) {
  'use strict';
  const W = 272, D = 224, H = 120;
  const P = 22;              // village shelf height (lakeside promenade level)
  const WATER_Y = 18.4;      // lake surface
  const DOCK = 20;           // wooden dock deck height

  // ---- tiles & blocks -------------------------------------------------
  const T = {
    rock: 0, scree: 1, cobble: 2, plaster: 3, stone: 4, timber: 5, shingle: 6, planks: 7, glass: 8, shutter: 9,
    gold: 10, spire: 11, tileR: 12, dark: 13, lamp: 14, pine: 15, log: 16, water: 17, door: 18, flower: 19,
    snow: 20, grass: 21, fence: 22, tileG: 23
  };
  const B = {
    AIR: 0, ROCK: 1, SCREE: 2, COBBLE: 3, PLASTER: 4, STONE: 5, TIMBER: 6, SHINGLE: 7, WOOD: 8, GLASS: 9,
    SHUTTER: 10, GOLD: 11, SPIRE: 12, TILE_R: 13, DARK: 14, LAMP: 15, PINE: 16, LOG: 17, WATER: 18, DOOR: 19,
    FLOWER: 20, SNOW: 21, GRASS: 22, FENCE: 23, TILE_G: 24,
    // compatibility aliases used by app/mesher/minimap (map onto alpine blocks)
    SAND: 2, ROOF: 13, PAVE: 3, BRICK: 13, DOME: 12, DIAMOND: 9
  };
  const BI = [];
  function def(id, name, top, side, bottom, glow, jit) {
    BI[id] = { name, top, side, bottom: bottom == null ? side : bottom, glow: !!glow, jit: jit == null ? 0.08 : jit };
  }
  def(B.AIR, 'air', 0, 0);
  def(B.ROCK, 'rock', T.rock, T.rock, T.rock, false, 0.1);
  def(B.SCREE, 'scree', T.scree, T.scree, T.scree, false, 0.14);
  def(B.COBBLE, 'cobble', T.cobble, T.cobble, T.cobble, false, 0.06);
  def(B.PLASTER, 'plaster', T.plaster, T.plaster, T.plaster, false, 0.035);
  def(B.STONE, 'stone', T.stone, T.stone, T.stone, false, 0.05);
  def(B.TIMBER, 'timber', T.timber, T.timber, T.timber, false, 0.06);
  def(B.SHINGLE, 'shingle', T.shingle, T.shingle, T.shingle, false, 0.08);
  def(B.WOOD, 'wood', T.planks, T.planks, T.planks, false, 0.07);
  def(B.GLASS, 'glass', T.glass, T.glass, T.glass, true, 0);
  def(B.SHUTTER, 'shutter', T.shutter, T.shutter, T.shutter, false, 0.05);
  def(B.GOLD, 'gold', T.gold, T.gold, T.gold, false, 0.04);
  def(B.SPIRE, 'spire', T.spire, T.spire, T.spire, false, 0.05);
  def(B.TILE_R, 'tileR', T.tileR, T.tileR, T.tileR, false, 0.1);
  def(B.DARK, 'dark', T.dark, T.dark, T.dark, false, 0.04);
  def(B.LAMP, 'lamp', T.lamp, T.lamp, T.lamp, true, 0);
  def(B.PINE, 'pine', T.pine, T.pine, T.pine, false, 0.17);
  def(B.LOG, 'log', T.log, T.log, T.log, false, 0.08);
  def(B.WATER, 'water', T.water, T.water, T.water, false, 0.03);
  def(B.DOOR, 'door', T.door, T.door, T.door, false, 0.04);
  def(B.FLOWER, 'flower', T.flower, T.flower, T.flower, false, 0.1);
  def(B.SNOW, 'snow', T.snow, T.snow, T.snow, false, 0.05);
  def(B.GRASS, 'grass', T.grass, T.grass, T.grass, false, 0.12);
  def(B.FENCE, 'fence', T.fence, T.fence, T.fence, false, 0.06);
  def(B.TILE_G, 'tileG', T.tileG, T.tileG, T.tileG, false, 0.1);

  // ---- utils ----------------------------------------------------------
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hash3(x, y, z) {
    let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(z | 0, 2147483647);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smoothstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  function vn(x, z, s) {
    const xi = Math.floor(x), zi = Math.floor(z), fx = x - xi, fz = z - zi;
    const sx = fx * fx * (3 - 2 * fx), sz = fz * fz * (3 - 2 * fz);
    const a = hash3(xi, s, zi), b = hash3(xi + 1, s, zi), c = hash3(xi, s, zi + 1), d = hash3(xi + 1, s, zi + 1);
    return lerp(lerp(a, b, sx), lerp(c, d, sx), sz);
  }
  function fbm(x, z, s, oct) {
    let v = 0, amp = 0.5, f = 1;
    for (let o = 0; o < (oct || 4); o++) { v += amp * vn(x * f / s, z * f / s, 5 + o); amp *= 0.5; f *= 2; }
    return v;
  }

  // ---- terrain shape --------------------------------------------------
  // The shoreline runs roughly N-S; lake to the west (small x), village shelf hugging it,
  // then the mountain wall rising steeply to the east (large x).
  const SHORE = (z) => 92 + 10 * Math.sin(z / 60 + 0.5) + 4 * Math.sin(z / 19 + 1.3) + 6 * fbm(z, 0, 40, 3); // lake edge x
  const ZN = 8, ZS = D - 8;

  root.HallstattWorld = { W, D, H, P, WATER_Y, DOCK, B, BI, T, create, hash3, mulberry32, SHORE, ZN, ZS };
  if (typeof module !== 'undefined') module.exports = root.HallstattWorld;

  function create(seed) {
    seed = seed == null ? 1846 : seed;
    const rnd = mulberry32(seed);
    const R = (a, b) => a + rnd() * (b - a);
    const RI = (a, b) => Math.floor(R(a, b + 1));
    const pick = (a) => a[Math.floor(rnd() * a.length)];

    const blocks = new Uint8Array(W * H * D);
    const cols = new Uint8Array(W * H * D);
    const idx = (x, y, z) => x + W * (z + D * y);
    const inb = (x, y, z) => x >= 0 && x < W && y >= 0 && y < H && z >= 0 && z < D;
    const get = (x, y, z) => (inb(x, y, z) ? blocks[idx(x, y, z)] : (y < 0 ? B.ROCK : 0));
    const set = (x, y, z, id, c) => { if (!inb(x, y, z)) return; const i = idx(x, y, z); blocks[i] = id; cols[i] = c || 0; };
    const isAir = (x, y, z) => get(x, y, z) === B.AIR;
    const zi = (x, z) => x + W * z;

    const palette = [[1, 1, 1]];
    const palMap = new Map([['100,100,100', 0]]);
    function pal(r, g, b) {
      if (Array.isArray(r)) { b = r[2]; g = r[1]; r = r[0]; }
      const k = Math.round(r * 100) + ',' + Math.round(g * 100) + ',' + Math.round(b * 100);
      let i = palMap.get(k);
      if (i === undefined) {
        if (palette.length >= 255) {
          let best = 0, bd = 1e9;
          palette.forEach((p, n) => { const d = (p[0] - r) ** 2 + (p[1] - g) ** 2 + (p[2] - b) ** 2; if (d < bd) { bd = d; best = n; } });
          return best;
        }
        i = palette.length; palette.push([r, g, b]); palMap.set(k, i);
      }
      return i;
    }
    function fillBox(x0, y0, z0, x1, y1, z1, id, c) {
      for (let y = Math.max(0, y0); y <= Math.min(H - 1, y1); y++)
        for (let z = Math.max(0, z0); z <= Math.min(D - 1, z1); z++)
          for (let x = Math.max(0, x0); x <= Math.min(W - 1, x1); x++) { const i = idx(x, y, z); blocks[i] = id; cols[i] = c || 0; }
    }

    // ---------- colours ----------
    const WHITE = pal(0.95, 0.95, 0.93), IVORY = pal(0.94, 0.91, 0.84), STONE_C = pal(0.72, 0.70, 0.66), GREY_C = pal(0.55, 0.54, 0.52);
    const WOODC = pal(0.46, 0.31, 0.19), WOOD_D = pal(0.34, 0.23, 0.15), WOOD_W = pal(0.78, 0.62, 0.42), BALCONY = pal(0.40, 0.27, 0.16);
    const ROOF_A = pal(0.42, 0.26, 0.22), ROOF_B = pal(0.34, 0.22, 0.20), ROOF_C = pal(0.46, 0.34, 0.28), ROOF_SLATE = pal(0.34, 0.36, 0.40);
    // pastel alpine façades — the famous colourful Hallstatt houses
    const FACADES = [
      [0.93, 0.90, 0.82], [0.90, 0.86, 0.72], [0.86, 0.80, 0.66], [0.78, 0.82, 0.80],
      [0.82, 0.74, 0.64], [0.90, 0.84, 0.78], [0.72, 0.78, 0.74], [0.88, 0.80, 0.70],
      [0.76, 0.72, 0.66], [0.92, 0.88, 0.80], [0.84, 0.78, 0.70], [0.70, 0.74, 0.78],
      [0.88, 0.72, 0.58], [0.80, 0.70, 0.60]
    ];
    const SHUTTERS = [[0.20, 0.34, 0.26], [0.30, 0.22, 0.16], [0.18, 0.24, 0.36], [0.44, 0.18, 0.16], [0.24, 0.26, 0.28]];
    // lakebed / depth gradient (shallow → deep teal-green alpine water)
    const LB = [pal(0.60, 0.62, 0.52), pal(0.42, 0.56, 0.52), pal(0.28, 0.48, 0.50), pal(0.18, 0.40, 0.46), pal(0.12, 0.32, 0.40), pal(0.08, 0.24, 0.34), pal(0.05, 0.17, 0.27)];
    const SOIL = [pal(0.40, 0.32, 0.22), pal(0.36, 0.29, 0.20), pal(0.44, 0.35, 0.24), pal(0.33, 0.27, 0.19)];
    const GRASSES = [pal(0.34, 0.50, 0.26), pal(0.40, 0.56, 0.30), pal(0.30, 0.46, 0.24), pal(0.44, 0.58, 0.32)];
    const PINES = [pal(0.16, 0.34, 0.22), pal(0.20, 0.40, 0.26), pal(0.13, 0.30, 0.20), pal(0.24, 0.44, 0.28)];
    const ROCKS = [pal(0.56, 0.54, 0.50), pal(0.48, 0.47, 0.44), pal(0.64, 0.62, 0.58), pal(0.42, 0.42, 0.40), pal(0.60, 0.58, 0.55)];
    const SCREES = [pal(0.62, 0.60, 0.56), pal(0.54, 0.52, 0.49), pal(0.68, 0.66, 0.62), pal(0.58, 0.56, 0.53)];
    const SNOWS = [pal(0.96, 0.97, 0.99), pal(0.90, 0.93, 0.97), pal(0.99, 0.99, 1.0)];
    function strata(x, y, z) {
      const yy = y + vn(x / 16, z / 16, 7) * 3;
      const r = hash3(Math.floor(yy / 2), 9, 7);
      return ROCKS[Math.floor(r * ROCKS.length)];
    }

    // ---------- heightmap ----------
    const hm = new Uint8Array(W * D);
    const kind = new Uint8Array(W * D);     // 0 lake/shore, 1 meadow/soil, 2 rock/mountain
    const occ = new Uint8Array(W * D);      // 0 free, 1 building, 2 street/reserved, 3 landmark
    const town = new Uint8Array(W * D);
    const walk = new Uint8Array(W * D);
    const roadH = new Uint8Array(W * D);

    // peak ridgeline east of the village: several limestone summits
    const PEAKS = [];
    for (let z = 0; z < D; z += 1) {
      // mountain base rises east of the shelf; summit height varies along z to make distinct peaks
      PEAKS.push(0);
    }
    function mountainH(x, z) {
      const sh = SHORE(z);
      const inland = x - (sh + 34);              // distance east past the village shelf
      if (inland <= 0) return 0;
      // staircase-ish steep rise with noise, a few dominant summits
      const ridge = 46 + 30 * Math.sin(z / 70 + 1.1) + 20 * Math.sin(z / 31 + 4.0);
      const t = clamp(inland / 120, 0, 1);
      let hM = P + Math.pow(t, 0.78) * ridge + 10 * fbm(x, z, 26, 4) * t;
      // sharp cliff just behind the houses
      hM += smoothstep(0, 22, inland) * 14;
      return hM;
    }

    for (let z = 0; z < D; z++) {
      for (let x = 0; x < W; x++) {
        const i = zi(x, z), sh = SHORE(z);
        let h, k;
        if (x < sh) {
          // lake: bed deepens away from shore to the west
          const depth = clamp((sh - x) / 46, 0, 1);
          h = Math.round(WATER_Y - 1.5 - depth * 13 - fbm(x, z, 30, 3) * 2.5);
          h = clamp(h, 2, WATER_Y);
          k = 0;
        } else {
          // the narrow green/soil shelf, then the mountain
          const shelf = x - sh;                       // distance east from shore
          let hS = P - 1 + smoothstep(0, 6, shelf) * 2 + fbm(x, z, 14, 3) * 1.5;
          const hM = mountainH(x, z);
          if (hM > hS) { h = Math.round(hM); k = 2; }
          else { h = Math.round(hS); k = 1; }
        }
        hm[i] = clamp(h, 1, H - 1);
        kind[i] = k;
      }
    }

    // mark the buildable village shelf (a strip east of the shore, below the cliff)
    for (let z = 20; z <= D - 20; z++) for (let x = 0; x < W; x++) {
      const sh = SHORE(z), t = x - sh;
      if (t >= 2 && t <= 40 && kind[zi(x, z)] !== 0 && hm[zi(x, z)] <= P + 10) town[zi(x, z)] = 1;
    }

    // ---------- fill solid columns ----------
    for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
      const i = zi(x, z), h = hm[i], k = kind[i];
      for (let y = 0; y < h; y++) {
        let id, c;
        if (k === 0) {
          // lakebed
          id = B.ROCK; const d = clamp(WATER_Y - y, 0, 6); c = LB[Math.round(d)];
          if (y >= h - 1 && h >= WATER_Y - 1) { id = B.SCREE; c = pick(SCREES); }
        } else if (k === 2) {
          const snow = y > 78 - vn(x / 20, z / 20, 8) * 10;
          const treeline = y < 52;
          if (y >= h - 1 && snow) { id = B.SNOW; c = pick(SNOWS); }
          else if (y >= h - 1 && treeline && hash3(x, 1, z) < 0.5) { id = B.GRASS; c = pick(PINES); }
          else { id = B.ROCK; c = strata(x, y, z); if (hash3(x, y, z) < 0.1) { id = B.SCREE; c = pick(SCREES); } }
        } else {
          // shelf: soil below, a grassy / cobbled top
          if (y >= h - 1) { id = B.GRASS; c = pick(GRASSES); }
          else if (y >= h - 3) { id = B.ROCK; c = pick(SOIL); }
          else { id = B.ROCK; c = strata(x, y, z); }
        }
        set(x, y, z, id, c);
      }
    }

    const landmarks = [], lamps = [], flags = [], boats = [], poles = [], parapets = [], moorings = [], buildings = [];
    const doors = [], inter = new Map(), interList = [];   // doors you can open, things you can use
    const donkeyPath = [];
    const harbour = { qx0: 0, qx1: 0, z0: 0, z1: 0, pierZ: 0, pierX0: 0 };

    function markOcc(x0, z0, x1, z1, v, m) {
      m = m || 0;
      for (let z = z0 - m; z <= z1 + m; z++) for (let x = x0 - m; x <= x1 + m; x++)
        if (x >= 0 && x < W && z >= 0 && z < D && occ[zi(x, z)] < v) occ[zi(x, z)] = v;
    }
    function setGround(x, z, nh, topId, topC, fillId, fillC) {
      if (x < 1 || x >= W - 1 || z < 1 || z >= D - 1) return;
      const i = zi(x, z), oh = hm[i];
      if (nh > oh) for (let y = oh; y < nh - 1; y++) set(x, y, z, fillId, fillC);
      else for (let y = nh; y < oh; y++) set(x, y, z, B.AIR, 0);
      set(x, nh - 1, z, topId, topC);
      hm[i] = nh; kind[i] = 1;
    }
    const COB_A = pal(0.60, 0.56, 0.50), COB_B = pal(0.52, 0.49, 0.44), COB_C = pal(0.44, 0.42, 0.38);
    const roadColor = (x, z) => {
      const a = ((x >> 1) + (z >> 1)) & 1;
      return hash3(x, 2, z) < 0.1 ? COB_C : a ? COB_A : COB_B;
    };
    function roadCell(x, z, hp, c) {
      if (x < 1 || x >= W - 1 || z < 1 || z >= D - 1) return;
      setGround(x, z, hp, B.COBBLE, c == null ? roadColor(x, z) : c, B.ROCK, pick(SOIL));
      const i = zi(x, z); roadH[i] = hp; walk[i] = 1; occ[i] = 2;
    }
    function platform(x0, z0, x1, z1, level, c) {
      for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) roadCell(x, z, level, c);
    }
    function lamp(x, z) {
      const y0 = hm[zi(x, z)];
      if (get(x, y0, z) !== B.AIR || occ[zi(x, z)] === 1) return;
      const post = pal(0.36, 0.25, 0.16);
      set(x, y0, z, B.LOG, post); set(x, y0 + 1, z, B.LOG, post); set(x, y0 + 2, z, B.LOG, post); set(x, y0 + 3, z, B.LAMP, 0);
      lamps.push([x + 0.5, y0 + 3.5, z + 0.5]);
    }

    const ctx = {
      W, D, H, P, WATER_Y, DOCK, B, BI, T, blocks, cols, palette, pal, get, set, isAir, zi, idx, inb, fillBox,
      hm, kind, occ, town, walk, roadH, rnd, R, RI, pick, hash3, vn, fbm, clamp, lerp, smoothstep, strata,
      SHORE, ZN, ZS, landmarks, lamps, flags, boats, poles, parapets, moorings, buildings, donkeyPath, harbour,
      markOcc, setGround, roadCell, platform, lamp, roadColor, doors, inter, interList, idx,
      WHITE, IVORY, STONE_C, GREY_C, WOODC, WOOD_D, WOOD_W, BALCONY, COB_A, COB_B, COB_C,
      ROOF_A, ROOF_B, ROOF_C, ROOF_SLATE, SNOWS, PINES, GRASSES, ROCKS, SCREES, SOIL, FACADES, SHUTTERS
    };
    buildVillage(ctx);

    // top surface tables (for minimap / NPC surface finding)
    const topH = new Uint8Array(W * D), topB = new Uint8Array(W * D), topC = new Uint8Array(W * D);
    for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
      for (let y = H - 1; y >= 0; y--) {
        const b = blocks[idx(x, y, z)];
        if (b) { topH[zi(x, z)] = y + 1; topB[zi(x, z)] = b; topC[zi(x, z)] = cols[idx(x, y, z)]; break; }
      }
    }

    return {
      W, D, H, BASE: P, GY: P, WATER_Y, QUAY: DOCK, blocks, cols, palette, pal, get, set, idx, inb, B, BI,
      hm, walk, occ, land: null, topH, topB, topC, landmarks, lamps, flags, windmills: [], poles, parapets, moorings,
      donkeyPath, harbour, XC: SHORE, ZN, ZS, XE: SHORE, town, kind, buildings, doors, inter, interList, houseCount: { n: buildings.length }
    };
  }

  // ===================================================================
  // Village builder — streets, colourful houses, church, Marktplatz,
  // dock + boats, pines, fences, lamps, and the registered buildings[].
  // ===================================================================
  function buildVillage(c) {
    const { W, D, P, WATER_Y, DOCK, B, set, get, isAir, zi, fillBox, hm, kind, occ, town, walk,
      rnd, R, RI, pick, hash3, vn, clamp, SHORE, landmarks, flags, moorings, buildings, donkeyPath, harbour,
      markOcc, roadCell, platform, lamp, pal, doors, inter, interList, idx, lamps, setGround,
      WHITE, IVORY, STONE_C, GREY_C, WOODC, WOOD_D, WOOD_W, BALCONY,
      ROOF_A, ROOF_B, ROOF_C, ROOF_SLATE, SNOWS, PINES, GRASSES, SOIL, FACADES, SHUTTERS } = c;
    const ROOFS = [ROOF_A, ROOF_B, ROOF_C, ROOF_SLATE];
    function addDoor(x, y, z, col) {   // a closed door = two DOOR blocks; the app swaps them for air to open it
      const d = { id: doors.length, x: x + 0.5, y: y + 1, z: z + 0.5, cells: [[x, y, z], [x, y + 1, z]], col, open: false };
      doors.push(d);
      d.cells.forEach((c) => { set(c[0], c[1], c[2], B.DOOR, col); inter.set(idx(c[0], c[1], c[2]), { type: 'door', door: d, label: '开门' }); });
      return d;
    }
    function addInter(x, y, z, type, label, text) {
      const o = { type, label, text, x: x + 0.5, y: y + 0.5, z: z + 0.5 };
      inter.set(idx(x, y, z), o); interList.push(o); return o;
    }
    function hangLamp(x, y, z) { set(x, y, z, B.LAMP, 0); lamps.push([x + 0.5, y + 0.5, z + 0.5]); }
    function stoop(x0, b, dz) {   // a paved doorstep two blocks deep, then cobble steps down to the ground
      for (let s = 1; s <= 7; s++) {
        const x = x0 - s, lvl = b - Math.max(0, s - 2);
        if (x < 2) break;
        let reached = true;
        for (let z = dz - 1; z <= dz + 1; z++) {
          const i = zi(x, z), h = hm[i];
          if (h >= lvl && s > 2) continue;
          reached = false;
          for (let y = h; y < lvl - 1; y++) set(x, y, z, B.STONE, STONE_C);
          for (let y = lvl; y < lvl + 4; y++) if (get(x, y, z) !== B.AIR && !(s > 2)) set(x, y, z, B.AIR, 0);
          set(x, lvl - 1, z, B.COBBLE, c.roadColor(x, z));
          hm[i] = lvl; walk[i] = 1; occ[i] = 2;
        }
        if (reached) break;
      }
    }

    // ---- lakeside promenade (Seestraße) running N-S just inland of the shore ----
    for (let z = 18; z <= D - 18; z++) {
      const sh = Math.round(SHORE(z));
      for (let x = sh + 2; x <= sh + 5; x++) if (hm[zi(x, z)] >= WATER_Y) roadCell(x, z, P, null);
    }
    // ---- a second lane higher up, against the cliff ----
    for (let z = 24; z <= D - 24; z++) {
      const sh = Math.round(SHORE(z));
      for (let x = sh + 20; x <= sh + 23; x++) if (hm[zi(x, z)] >= P && hm[zi(x, z)] <= P + 8) roadCell(x, z, hm[zi(x, z)], null);
    }
    // ---- E-W connecting alleys (Gasse) ----
    for (let z = 34; z <= D - 34; z += RI(14, 20)) {
      const sh = Math.round(SHORE(z));
      for (let x = sh + 2; x <= sh + 30; x++) for (let zz = z - 1; zz <= z; zz++)
        if (hm[zi(x, zz)] >= WATER_Y && hm[zi(x, zz)] <= P + 9) roadCell(x, zz, Math.max(P, hm[zi(x, zz)]), null);
    }

    // ---- the colourful alpine houses: pitched roofs, timber balconies, shutters, flower boxes ----
    function gableHouse(x0, z0, w, d, floors, wallRGB, o) {
      o = o || {};
      const x1 = x0 + w - 1, z1 = z0 + d - 1;
      let sum = 0; for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) sum += hm[zi(x, z)];
      const b = Math.round(sum / (w * d));
      const wallC = pal(wallRGB);
      // level the footprint
      for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) {
        const h = hm[zi(x, z)];
        if (h < b) for (let y = h; y < b; y++) set(x, y, z, B.STONE, STONE_C);
        else if (h > b) for (let y = b; y < h; y++) set(x, y, z, B.AIR, 0);
      }
      const wallTop = b + floors * 4;
      // ground floor stone/plaster base, upper floors plaster with timber trim
      fillBox(x0, b, z0, x1, wallTop - 1, z1, B.PLASTER, wallC);
      // hollow the interior so you can enter later (walls 1 thick)
      fillBox(x0 + 1, b, z0 + 1, x1 - 1, wallTop - 1, z1 - 1, B.AIR, 0);
      // floors
      for (let fl = 1; fl < floors; fl++) fillBox(x0 + 1, b + fl * 4 - 1, z0 + 1, x1 - 1, b + fl * 4 - 1, z1 - 1, B.WOOD, WOODC);
      // stone ground course
      for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++)
        if (x === x0 || x === x1 || z === z0 || z === z1) { set(x, b, z, B.STONE, STONE_C); set(x, b + 1, z, hash3(x, 0, z) < 0.5 ? B.STONE : B.PLASTER, hash3(x, 0, z) < 0.5 ? STONE_C : wallC); }
      // windows + shutters along the long walls, door on the lake side
      const shutC = pal(pick(SHUTTERS)), doorC = pal(pick(SHUTTERS));
      for (let fl = 0; fl < floors; fl++) {
        const wy = b + fl * 4 + 2;
        for (let x = x0 + 1; x < x1; x += 2) {
          for (const zz of [z0, z1]) {
            if ((x + fl) % 2 === 0) { set(x, wy, zz, B.GLASS, 0); set(x, wy + 1, zz, B.GLASS, 0); if (o.shut !== false) { set(x - 1 > x0 ? x - 1 : x0, wy, zz, B.SHUTTER, shutC); set(x + 1 < x1 ? x + 1 : x1, wy, zz, B.SHUTTER, shutC); } }
          }
        }
        for (let z = z0 + 1; z < z1; z += 2) for (const xx of [x0, x1]) if ((z + fl) % 2 === 0) { set(xx, wy, z, B.GLASS, 0); set(xx, wy + 1, z, B.GLASS, 0); }
      }
      // front door on the lakeside (small-x) wall
      const dz = z0 + ((d >> 1));
      addDoor(x0, b, dz, doorC);
      stoop(x0, b, dz);
      // ---- inside: wooden floor and ceiling, a stair run per floor, furniture you can use ----
      fillBox(x0 + 1, b - 1, z0 + 1, x1 - 1, b - 1, z1 - 1, B.WOOD, WOOD_W);
      fillBox(x0 + 1, wallTop - 1, z0 + 1, x1 - 1, wallTop - 1, z1 - 1, B.WOOD, WOODC);
      for (let fl = 0; fl < floors - 1; fl++) {
        const yF = b + fl * 4, col = fl % 2 === 0 ? x1 - 1 : x0 + 1, zs = fl % 2 === 0 ? z0 + 1 : z1 - 1, dir = fl % 2 === 0 ? 1 : -1;
        for (let i = 0; i < 4; i++) {
          const zz = zs + dir * i;
          for (let y = yF; y <= yF + i; y++) set(col, y, zz, B.WOOD, WOOD_W);
          if (i < 3) set(col, yF + 3, zz, B.AIR, 0);   // the stairwell opening in the floor above
        }
      }
      const xm = x0 + 3, zm = dz + 1, red = pal(0.74, 0.26, 0.26), linen = pal(0.93, 0.92, 0.88), stoveC = pal(0.5, 0.6, 0.52), shelfC = pal(0.5, 0.34, 0.2);
      set(xm, b, zm, B.WOOD, WOOD_W);                                    // table
      set(xm - 1, b, zm, B.WOOD, WOOD_D); if (zm + 1 <= z1 - 1) set(xm, b, zm + 1, B.WOOD, WOOD_D);   // chairs
      addInter(xm, b, zm, 'table', '餐桌', '桌上摆着热腾腾的面包和一壶茶。');
      hangLamp(xm, b + 2, zm);
      set(x1 - 1, b, z1 - 1, B.STONE, stoveC); set(x1 - 1, b + 1, z1 - 1, B.STONE, stoveC);   // tiled stove
      addInter(x1 - 1, b, z1 - 1, 'stove', '瓷砖炉', '炉子暖暖的,屋里很舒服。'); addInter(x1 - 1, b + 1, z1 - 1, 'stove', '瓷砖炉', '炉子暖暖的,屋里很舒服。');
      set(x0 + 2, b, z0 + 1, B.TIMBER, shelfC); set(x0 + 2, b + 1, z0 + 1, B.TIMBER, shelfC);   // bookcase
      addInter(x0 + 2, b, z0 + 1, 'shelf', '书架', '翻开一本旧书:《盐之湖的传说》。'); addInter(x0 + 2, b + 1, z0 + 1, 'shelf', '书架', '翻开一本旧书:《盐之湖的传说》。');
      for (let fl = 1; fl < floors; fl++) {
        const yF = b + fl * 4;
        set(x0 + 2, yF, z0 + 1, B.PLASTER, red); set(x0 + 3, yF, z0 + 1, B.PLASTER, linen);          // bed: blanket + pillow
        addInter(x0 + 2, yF, z0 + 1, 'bed', '睡觉', ''); addInter(x0 + 3, yF, z0 + 1, 'bed', '睡觉', '');
        set(x1 - 1, yF, z1 - 1, B.WOOD, WOOD_D); addInter(x1 - 1, yF, z1 - 1, 'chest', '木箱', '木箱里叠着手织的羊毛毯。');
        hangLamp(x0 + 3, yF + 2, dz + 1);
      }
      // timber balcony on the upper lakeside floor
      if (floors >= 2 && w >= 5 && !o.noBalcony) {
        const by = b + 4;
        for (let z = z0; z <= z1; z++) { set(x0 - 1, by - 1, z, B.LOG, BALCONY); set(x0 - 1, by, z, B.FENCE, WOOD_W); }
        for (const zz of [z0, z1]) set(x0 - 1, by + 1, zz, B.LOG, BALCONY);
        // flower boxes
        for (let z = z0; z <= z1; z += 2) if (rnd() < 0.7) set(x0 - 1, by, z, B.FLOWER, 0);
      }
      // ---- pitched gable roof along the z-axis ----
      const roofC = pick(ROOFS), peak = Math.floor(w / 2);
      for (let dxx = 0; dxx <= peak; dxx++) {
        const ry = wallTop + dxx;
        for (const xx of [x0 + dxx, x1 - dxx]) {
          for (let z = z0 - 1; z <= z1 + 1; z++) set(xx, ry, z, B.TILE_R, roofC);
        }
        // fill the gable triangle ends
        for (let z = z0; z <= z1; z += (z1 - z0)) for (let x = x0 + dxx; x <= x1 - dxx; x++) set(x, ry, z, B.PLASTER, wallC);
      }
      // ridge cap
      const rc = wallTop + peak;
      for (let z = z0 - 1; z <= z1 + 1; z++) set(x0 + peak, rc, z, B.TILE_R, roofC);
      // chimney
      if (rnd() < 0.8) { const cx2 = x0 + RI(1, w - 2), cz2 = z0 + RI(1, d - 2); for (let y = wallTop; y <= rc + 2; y++) set(cx2, y, cz2, B.STONE, GREY_C); }
      // register the building
      for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) { occ[zi(x, z)] = 1; walk[zi(x, z)] = 0; hm[zi(x, z)] = Math.min(H - 1, rc + 1); }
      buildings.push({ id: 'b' + buildings.length, kind: o.kind || 'house', x0, z0, x1, z1, y: b, floors });
      return b;
    }

    function canBuild(x0, z0, w, d) {
      if (x0 < 2 || z0 < 2 || x0 + w >= W - 2 || z0 + d >= D - 2) return false;
      let base = -1;
      for (let z = z0; z < z0 + d; z++) for (let x = x0; x < x0 + w; x++) {
        const i = zi(x, z);
        if (!town[i] || occ[i] !== 0 || kind[i] === 0 || hm[i] < WATER_Y) return false;
        if (base < 0) base = hm[i];
        if (Math.abs(hm[i] - base) > 5) return false;
      }
      // the door faces the lake (west): the three cells in front of it must be open ground, not another house
      const ref = hm[zi(x0, z0 + (d >> 1))];
      for (let s2 = 1; s2 <= 3; s2++) for (let zz = z0 + (d >> 1) - 1; zz <= z0 + (d >> 1) + 1; zz++) {
        const j = zi(x0 - s2, zz); if (x0 - s2 < 2 || hm[j] > ref + 2 || occ[j] === 3) return false;
      }
      return true;
    }

    // ================= LANDMARKS =================
    // --- the lakeside Protestant church with a tall spire (the postcard view) ---
    (function church() {
      const cz = Math.floor(D / 2) - 6;
      const cx = Math.round(SHORE(cz)) + 9;
      // level a platform
      let b = P;
      for (let z = cz - 4; z <= cz + 10; z++) for (let x = cx - 4; x <= cx + 6; x++) { const h = hm[zi(x, z)]; if (h > WATER_Y) b = Math.max(b, Math.min(h, P + 3)); }
      platform(cx - 4, cz - 4, cx + 6, cz + 10, b, null);
      // nave
      fillBox(cx - 2, b, cz, cx + 4, b + 7, cz + 8, B.PLASTER, IVORY);
      fillBox(cx - 1, b, cz + 1, cx + 3, b + 7, cz + 7, B.AIR, 0);
      // windows
      for (let z = cz + 2; z <= cz + 6; z += 2) { set(cx - 2, b + 3, z, B.GLASS, 0); set(cx - 2, b + 4, z, B.GLASS, 0); set(cx + 4, b + 3, z, B.GLASS, 0); set(cx + 4, b + 4, z, B.GLASS, 0); }
      addDoor(cx + 1, b, cz + 8, pal(0.3, 0.22, 0.16));
      fillBox(cx - 1, b - 1, cz + 1, cx + 3, b - 1, cz + 7, B.WOOD, WOOD_W);
      for (const pz of [cz + 3, cz + 5]) for (const px of [cx - 1, cx, cx + 2, cx + 3]) set(px, b, pz, B.WOOD, WOOD_D);   // pews
      set(cx + 1, b, cz + 1, B.STONE, WHITE); set(cx + 1, b + 1, cz + 1, B.GOLD, 0);   // altar + cross
      addInter(cx + 1, b, cz + 1, 'altar', '祭坛', '烛光里很安静,湖面的风声隐约传来。'); addInter(cx + 1, b + 1, cz + 1, 'altar', '祭坛', '烛光里很安静,湖面的风声隐约传来。');
      hangLamp(cx + 1, b + 5, cz + 4);
      // steep nave roof
      for (let dxx = 0; dxx <= 3; dxx++) { const ry = b + 8 + dxx; for (const xx of [cx - 2 + dxx, cx + 4 - dxx]) for (let z = cz - 1; z <= cz + 9; z++) set(xx, ry, z, B.TILE_R, ROOF_B); }
      for (let z = cz - 1; z <= cz + 9; z++) set(cx + 1, b + 11, z, B.TILE_R, ROOF_B);
      // tower + spire at the lake end
      const tx = cx + 1, tz = cz - 2;
      fillBox(tx - 2, b, tz - 2, tx + 2, b + 18, tz + 2, B.STONE, STONE_C);
      fillBox(tx - 1, b, tz - 1, tx + 1, b + 17, tz + 1, B.AIR, 0);
      // clock + belfry openings
      for (const [dx, dz] of [[0, -2], [0, 2], [-2, 0], [2, 0]]) { set(tx + dx, b + 14, tz + dz, B.GOLD, 0); set(tx + dx, b + 12, tz + dz, B.DARK, 0); set(tx + dx, b + 13, tz + dz, B.DARK, 0); }
      // the pointed spire
      for (let j = 0; j <= 8; j++) { const r = Math.max(0, 2 - Math.floor(j * 2.2 / 8)); for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) set(tx + dx, b + 19 + j, tz + dz, B.SPIRE, ROOF_SLATE); }
      set(tx, b + 28, tz, B.GOLD, 0); set(tx, b + 29, tz, B.GOLD, 0);
      markOcc(cx - 5, cz - 5, cx + 7, cz + 11, 3, 1);
      flags.push([cx - 4 + 0.5, b, cz - 4 + 0.5, 6]);
      buildings.push({ id: 'church', kind: 'church', x0: cx - 2, z0: cz, x1: cx + 4, z1: cz + 8, y: b, floors: 1, name: '基督新教教堂' });
      landmarks.push({ id: 'church', name: '湖畔教堂', en: 'Evangelische Pfarrkirche', x: tx + 0.5, z: tz + 0.5, top: b + 30, r: 30 });
    })();

    // --- Marktplatz (market square) with the Holy Trinity column ---
    (function marktplatz() {
      const mz = Math.floor(D / 2) + 24;
      const mx = Math.round(SHORE(mz)) + 14;
      let b = P;
      platform(mx - 7, mz - 7, mx + 7, mz + 7, b, pal(0.58, 0.54, 0.48));
      // the column in the centre
      for (let y = 0; y < 7; y++) set(mx, b + y, mz, B.STONE, WHITE);
      set(mx, b + 7, mz, B.GOLD, 0); set(mx, b + 8, mz, B.GOLD, 0);
      // a small fountain trough
      for (const [dx, dz] of [[-2, 0], [2, 0], [0, -2], [0, 2]]) set(mx + dx, b, mz + dz, B.STONE, STONE_C);
      // trees + lamps around the square
      for (const [dx, dz] of [[-6, -6], [6, -6], [-6, 6], [6, 6]]) tree(mx + dx, mz + dz, RI(5, 7));
      for (const [dx, dz] of [[-6, 0], [6, 0], [0, -6], [0, 6]]) lamp(mx + dx, mz + dz);
      markOcc(mx - 7, mz - 7, mx + 7, mz + 7, 2, 0);
      landmarks.push({ id: 'markt', name: '集市广场', en: 'Marktplatz', x: mx + 0.5, z: mz + 0.5, top: b + 9, r: 20 });
    })();

    // --- the lakefront wooden dock with moored rowboats + a little steamer ---
    (function dock() {
      const dz = Math.floor(D / 2) + 2;
      const sh = Math.round(SHORE(dz));
      const px1 = sh + 1, px0 = sh - 18;
      harbour.z0 = dz - 6; harbour.z1 = dz + 6; harbour.pierZ = dz; harbour.pierX0 = px0; harbour.qx0 = px0; harbour.qx1 = px1;
      for (let x = px0; x <= px1; x++) for (let z = dz - 1; z <= dz + 1; z++) {
        set(x, DOCK - 1, z, B.WOOD, WOODC); walk[zi(x, z)] = 1; occ[zi(x, z)] = 3;
        if (x % 4 === 0 && z !== dz) for (let y = Math.min(hm[zi(x, z)], WATER_Y - 1); y < DOCK - 1; y++) set(x, y, z, B.LOG, WOOD_D);
      }
      // boat houses at the shore end
      for (const zz of [dz - 5, dz + 4]) { if (canShoreHut(px1 - 3, zz)) shoreHut(px1 - 3, zz); }
      for (let x = px0 + 3; x <= px1 - 3; x += 6) {
        moorings.push({ x: x + 0.5, z: dz - 3.0, yaw: Math.PI / 2, color: pick([0, 1, 2, 3]) });
        moorings.push({ x: x + 2.5, z: dz + 3.0, yaw: -Math.PI / 2, color: pick([0, 1, 2, 3]) });
      }
      moorings.push({ x: px0 - 5.0, z: dz + 0.5, yaw: Math.PI / 2, color: 2 });
      for (let z = dz - 5; z <= dz + 5; z += 5) lamp(px1 - 1, z);
      landmarks.push({ id: 'dock', name: '湖畔码头', en: 'Lakefront Dock', x: px0 + 9.5, z: dz + 0.5, top: DOCK + 4, r: 22 });
    })();
    function canShoreHut(x, z) { return x > 2 && z > 2 && z < D - 2 && hm[zi(x, z)] >= WATER_Y - 1 && occ[zi(x, z)] === 0; }
    function shoreHut(x, z) {
      const b = Math.max(P, hm[zi(x, z)]);
      fillBox(x, b, z, x + 2, b + 3, z + 2, B.WOOD, WOOD_D);
      fillBox(x + 1, b, z + 1, x + 1, b + 2, z + 1, B.AIR, 0);
      for (let dxx = 0; dxx <= 1; dxx++) for (let zz = z - 1; zz <= z + 3; zz++) { set(x + dxx, b + 4 + dxx, zz, B.TILE_R, ROOF_C); set(x + 2 - dxx, b + 4 + dxx, zz, B.TILE_R, ROOF_C); }
      markOcc(x, z, x + 2, z + 2, 1, 0);
    }

    // houses go in last: the church square, market square and dock are already marked, so no house is built over them
    // ---- place the houses in rows climbing the shelf ----
    let placed = 0;
    for (let z = 22; z <= D - 22; z++) for (let x = 2; x < W - 2; x++) {
      const i = zi(x, z);
      if (!town[i] || occ[i] !== 0 || rnd() < 0.3) continue;
      const w = RI(6, 8), d = RI(7, 10);
      if (!canBuild(x, z, w, d)) continue;
      const floors = RI(2, 3);
      gableHouse(x, z, w, d, floors, pick(FACADES), {});
      markOcc(x, z, x + w - 1, z + d - 1, 1, 1);
      placed++;
      if (placed > 180) break;
    }

    // ---- pines up the lower mountain slopes + scattered on the shelf ----
    function tree(x, z, tall) {
      const y0 = hm[zi(x, z)];
      if (get(x, y0, z) !== B.AIR || occ[zi(x, z)] === 1 || occ[zi(x, z)] === 3) return;
      for (let y = 0; y < Math.max(2, tall - 3); y++) set(x, y0 + y, z, B.LOG, pal(0.34, 0.24, 0.16));
      const top = y0 + tall;
      for (let y = y0 + 1; y <= top; y++) {
        const r = Math.round((top - y) / tall * 2.2);
        for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++)
          if (dx * dx + dz * dz <= r * r + 0.3 && isAir(x + dx, y, z + dz)) set(x + dx, y, z + dz, B.PINE, pick(PINES));
      }
      set(x, top + 1, z, B.PINE, pick(PINES));
    }
    for (let z = 10; z < D - 10; z++) for (let x = 2; x < W - 2; x++) {
      const i = zi(x, z);
      if (kind[i] !== 2 || occ[i] !== 0) continue;
      if (hm[i] < P || hm[i] > 54) continue;
      if (hash3(x, 7, z) < 0.07) tree(x, z, RI(5, 9));
    }
    // a few on the green shelf fringes
    for (let n = 0; n < 40; n++) {
      const z = RI(24, D - 24), sh = Math.round(SHORE(z)), x = sh + RI(26, 32);
      if (x < W - 2 && kind[zi(x, z)] === 1 && occ[zi(x, z)] === 0) tree(x, z, RI(4, 7));
    }

    // ---- split-rail fences + flower patches along the upper lane ----
    for (let z = 28; z <= D - 28; z += 3) {
      const sh = Math.round(SHORE(z)), x = sh + 25;
      if (x < W - 2 && occ[zi(x, z)] === 0 && kind[zi(x, z)] !== 0) { const y0 = hm[zi(x, z)]; set(x, y0, z, B.FENCE, WOOD_W); if (hash3(x, 3, z) < 0.3) set(x, y0, z + 1, B.FLOWER, 0); }
    }

    // ---- lamps along the promenade ----
    for (let z = 24; z <= D - 24; z += 10) { const sh = Math.round(SHORE(z)); lamp(sh + 4, z); }

    // ---- a swan / rowboat landing marker in the lake (distant interest) ----
    landmarks.push({ id: 'lake', name: '哈尔施塔特湖', en: 'Hallstätter See', x: Math.round(SHORE(D / 2)) - 40 + 0.5, z: D / 2 + 0.5, top: WATER_Y + 2, r: 44 });
    landmarks.push({ id: 'dachstein', name: '达赫施泰因峰', en: 'Dachstein', x: W - 30 + 0.5, z: D / 2 + 0.5, top: 92, r: 50 });
  }
})(typeof window !== 'undefined' ? window : globalThis);
