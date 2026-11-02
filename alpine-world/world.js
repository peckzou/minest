/* Alpine Chalet Voxel World — procedural generator (no DOM / no THREE dependency).
 * Exposes global AlpineWorld = { W, D, H, B, BI, T, create(seed) }.
 * A Swiss alpine valley: snowy peaks to the north, green slopes and pine forest, a chalet village on a stone lane,
 * a Gasthaus, a white chapel with a shingle spire, a barn with a fenced pasture, a mountain lake with a jetty and a
 * Berghütte high on the slope. Every building has a real interior (stone ground floor, log upper floor, fireplace,
 * table and chairs, benches, beds, shelves, lamps, stairs) and a door you can open.
 * Coordinates: x east, z south, y up. Cell (x,y,z) occupies [x,x+1)×[y,y+1)×[z,z+1).
 * hm[x,z] = first air cell above the ground (top ground block y = hm-1).
 */
(function (root) {
  'use strict';

  const W = 192, D = 160, H = 80;
  const WATER_Y = 11.85;    // the lake surface (the only water; all other ground is above it)

  // ---- tiles & blocks -------------------------------------------------
  const T = {
    grass: 0, grassSide: 1, dirt: 2, stone: 3, snow: 4, snowSide: 5, path: 6, planks: 7, logs: 8, shingle: 9,
    glass: 10, shutter: 11, door: 12, pine: 13, bark: 14, plaster: 15, lamp: 16, flower: 17, gravel: 18, rug: 19,
    fire: 20, hay: 21, rail: 22, wool: 23, books: 24, brook: 25, dark: 26, sign: 27, trunkTop: 28, meadow: 29
  };
  const B = {
    AIR: 0, GRASS: 1, DIRT: 2, STONE: 3, SNOW: 4, ROCKSNOW: 5, PATH: 6, PLANKS: 7, LOGW: 8, ROOF: 9,
    GLASS: 10, SHUTTER: 11, DOOR: 12, PINE: 13, BARK: 14, PLASTER: 15, LAMP: 16, FLOWER: 17, GRAVEL: 18, RUG: 19,
    FIRE: 20, HAY: 21, RAIL: 22, BED: 23, BOOKS: 24, BROOK: 25, DARK: 26, TABLE: 27, CHAIR: 28, BENCH: 29, SIGN: 30,
    MEADOW: 31
  };
  const BI = [];
  function def(id, name, top, side, bottom, glow, jit, lit) {
    BI[id] = { name, top, side, bottom: bottom == null ? side : bottom, glow: !!glow, lit: !!lit, jit: jit == null ? 0.08 : jit };
  }
  def(B.AIR, 'air', 0, 0);
  def(B.GRASS, 'grass', T.grass, T.grassSide, T.dirt, false, 0.1);
  def(B.MEADOW, 'meadow', T.meadow, T.grassSide, T.dirt, false, 0.1);
  def(B.DIRT, 'dirt', T.dirt, T.dirt, T.dirt, false, 0.1);
  def(B.STONE, 'stone', T.stone, T.stone, T.stone, false, 0.09);
  def(B.SNOW, 'snow', T.snow, T.snow, T.snow, false, 0.04);
  def(B.ROCKSNOW, 'snowy rock', T.snow, T.snowSide, T.stone, false, 0.06);
  def(B.PATH, 'stone path', T.path, T.stone, T.stone, false, 0.06);
  def(B.PLANKS, 'planks', T.planks, T.planks, T.planks, false, 0.07);
  def(B.LOGW, 'log wall', T.logs, T.logs, T.logs, false, 0.07);
  def(B.ROOF, 'shingles', T.shingle, T.shingle, T.planks, false, 0.08);
  def(B.GLASS, 'window', T.glass, T.glass, T.glass, true, 0);
  def(B.SHUTTER, 'shutter', T.shutter, T.shutter, T.shutter, false, 0.04);
  def(B.DOOR, 'door', T.door, T.door, T.door, false, 0.03);
  def(B.PINE, 'pine', T.pine, T.pine, T.pine, false, 0.16);
  def(B.BARK, 'trunk', T.trunkTop, T.bark, T.trunkTop, false, 0.08);
  def(B.PLASTER, 'plaster', T.plaster, T.plaster, T.plaster, false, 0.03);
  def(B.LAMP, 'lamp', T.lamp, T.lamp, T.lamp, true, 0);
  def(B.FLOWER, 'geraniums', T.flower, T.flower, T.flower, false, 0.1);
  def(B.GRAVEL, 'gravel', T.gravel, T.gravel, T.gravel, false, 0.12);
  def(B.RUG, 'rug', T.rug, T.planks, T.planks, false, 0.02);
  def(B.FIRE, 'fire', T.fire, T.fire, T.fire, false, 0, true);
  def(B.HAY, 'hay', T.hay, T.hay, T.hay, false, 0.08);
  def(B.RAIL, 'railing', T.rail, T.rail, T.planks, false, 0.05);
  def(B.BED, 'bed', T.wool, T.planks, T.planks, false, 0.02);
  def(B.BOOKS, 'shelf', T.planks, T.books, T.planks, false, 0.03);
  def(B.BROOK, 'brook', T.brook, T.brook, T.brook, false, 0.06);
  def(B.DARK, 'iron', T.dark, T.dark, T.dark, false, 0.04);
  def(B.TABLE, 'table', T.planks, T.planks, T.planks, false, 0.05);
  def(B.CHAIR, 'chair', T.planks, T.planks, T.planks, false, 0.05);
  def(B.BENCH, 'bench', T.planks, T.planks, T.planks, false, 0.05);
  def(B.SIGN, 'sign', T.sign, T.sign, T.planks, false, 0.02);

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
  const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  function vnoise(x, z, s) {
    const xi = Math.floor(x), zi = Math.floor(z), fx = x - xi, fz = z - zi;
    const a = hash3(xi, s, zi), b = hash3(xi + 1, s, zi), c = hash3(xi, s, zi + 1), d = hash3(xi + 1, s, zi + 1);
    const ux = fx * fx * (3 - 2 * fx), uz = fz * fz * (3 - 2 * fz);
    return lerp(lerp(a, b, ux), lerp(c, d, ux), uz);
  }
  function fbm(x, z, s, oct) { let v = 0, a = 0.5, f = 1, n = 0; for (let i = 0; i < (oct || 4); i++) { v += vnoise(x * f, z * f, s + i * 17) * a; n += a; a *= 0.5; f *= 2.03; } return v / n; }
  function ridged(x, z, s) { let v = 0, a = 0.55, f = 1, n = 0; for (let i = 0; i < 5; i++) { const r = 1 - Math.abs(vnoise(x * f, z * f, s + i * 31) * 2 - 1); v += r * r * a; n += a; a *= 0.5; f *= 2.1; } return v / n; }

  // ---- layout ---------------------------------------------------------
  const LAKE = { x: 146, z: 126, rx: 20, rz: 12 };
  const SQUARE = { x: 90, z: 100 };
  // [x, z, w, d, floors, kind, name]  — fronts face south (the lake and the valley)
  const PLAN = [
    [72, 84, 9, 8, 2, 'chalet', 'Chalet Edelweiss'],
    [58, 96, 9, 7, 2, 'chalet', 'Chalet Enzian'],
    [104, 84, 9, 8, 2, 'chalet', 'Chalet Bergblick'],
    [117, 96, 8, 7, 2, 'chalet', 'Chalet Alpenrose'],
    [46, 110, 8, 7, 2, 'chalet', 'Chalet Murmeli'],
    [68, 114, 8, 7, 1, 'chalet', 'Chalet Heidi'],
    [108, 114, 8, 7, 2, 'chalet', 'Chalet Seeblick'],
    [80, 70, 8, 7, 2, 'chalet', 'Chalet Tannenhof'],
    [95, 118, 13, 10, 3, 'inn', 'Gasthaus Zum Matterhorn'],
    [124, 76, 8, 13, 1, 'chapel', 'Kapelle St. Niklaus'],
    [36, 84, 12, 9, 1, 'barn', 'Heustadel · Barn'],
    [96, 40, 9, 8, 1, 'hut', 'Berghütte · Mountain Hut']
  ];

  // ---- world creation -------------------------------------------------
  function create(seed) {
    seed = seed == null ? 1291 : seed;
    const rnd = mulberry32(seed);
    const R = (a, b) => a + rnd() * (b - a);
    const RI = (a, b) => Math.floor(R(a, b + 1));
    const pick = (a) => a[Math.floor(rnd() * a.length)];

    const blocks = new Uint8Array(W * H * D);
    const cols = new Uint8Array(W * H * D);
    const idx = (x, y, z) => x + W * (z + D * y);
    const inb = (x, y, z) => x >= 0 && x < W && y >= 0 && y < H && z >= 0 && z < D;
    const get = (x, y, z) => (inb(x, y, z) ? blocks[idx(x, y, z)] : (y < 0 ? B.STONE : 0));
    const set = (x, y, z, id, c) => { if (!inb(x, y, z)) return; const i = idx(x, y, z); blocks[i] = id; cols[i] = c || 0; };
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
    const zi = (x, z) => x + W * z;
    const isAir = (x, y, z) => get(x, y, z) === B.AIR;

    // ---- colours
    const C = {
      grass: [0, pal(0.93, 0.96, 0.92), pal(1, 1, 0.92), pal(0.9, 0.94, 0.9)],
      meadow: 0, dirt: pal(0.55, 0.4, 0.27), stone: pal(0.6, 0.6, 0.62), stoneD: pal(0.48, 0.48, 0.52),
      stoneW: pal(0.78, 0.76, 0.72), snow: pal(0.97, 0.98, 1.0), path: pal(0.7, 0.68, 0.64), gravel: pal(0.66, 0.63, 0.58),
      larch: pal(0.82, 0.6, 0.34), wood: pal(0.62, 0.42, 0.24), woodD: pal(0.42, 0.27, 0.15), woodDD: pal(0.32, 0.2, 0.12),
      roof: pal(0.36, 0.25, 0.18), roofG: pal(0.44, 0.44, 0.46), plaster: pal(0.96, 0.94, 0.88),
      pine: [pal(0.17, 0.36, 0.22), pal(0.14, 0.32, 0.2), pal(0.2, 0.4, 0.24)], bark: pal(0.4, 0.28, 0.18),
      shutters: [pal(0.72, 0.16, 0.14), pal(0.2, 0.42, 0.26), pal(0.86, 0.86, 0.82)], red: pal(0.78, 0.15, 0.14),
      rug: [pal(0.72, 0.18, 0.16), pal(0.24, 0.36, 0.6), pal(0.3, 0.5, 0.32)], wool: [pal(0.92, 0.9, 0.84), pal(0.74, 0.2, 0.18), pal(0.3, 0.45, 0.7)],
      hay: pal(0.88, 0.76, 0.4), dark: pal(0.22, 0.22, 0.24), brook: pal(0.4, 0.66, 0.86)
    };

    // ---------- terrain heights ----------
    const hf = new Float32Array(W * D);
    for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
      const n1 = fbm(x / 46, z / 46, 3, 4), n2 = fbm(x / 18, z / 18, 9, 3);
      let h = 13 + n1 * 6 + (1 - z / D) * 9;                                  // the valley floor rises gently northwards
      const north = smooth(74, 8, z) * (24 + 34 * ridged(x / 30 + 3, z / 26, 21) + 8 * n2);   // the range
      const edge = Math.min(x, W - 1 - x, D - 1 - z);
      const ring = smooth(30, 0, edge) * (14 + 20 * ridged(x / 24, z / 24 + 7, 44));          // the side ridges close the valley
      h += Math.max(north, ring);
      // the lake basin
      const dl = Math.hypot((x - LAKE.x) / LAKE.rx, (z - LAKE.z) / LAKE.rz) + (n2 - 0.5) * 0.16;
      if (dl < 1) h = Math.min(h, WATER_Y - 1.2 - 3.2 * (1 - dl));
      else if (dl < 1.7) h = Math.min(h, lerp(WATER_Y + 0.9, h, smooth(1, 1.7, dl)));
      hf[zi(x, z)] = h;
    }
    // building pads: level and slightly sunk into the slope
    const occ = new Uint8Array(W * D);   // 0 free, 1 building, 2 path, 3 reserved
    const pads = PLAN.map((p) => {
      const [x, z, w, d] = p;
      let s = 0, n = 0;
      for (let k = z; k < z + d; k++) for (let i = x; i < x + w; i++) { s += hf[zi(i, k)]; n++; }
      return Math.round(s / n);
    });
    PLAN.forEach((p, n) => {
      const [x0, z0, w, d] = p, y = pads[n];
      for (let z = z0 - 5; z < z0 + d + 7; z++) for (let x = x0 - 5; x < x0 + w + 5; x++) {
        if (x < 0 || z < 0 || x >= W || z >= D) continue;
        const dx = Math.max(x0 - x, 0, x - (x0 + w - 1)), dz = Math.max(z0 - z, 0, z - (z0 + d + 1));
        const t = smooth(0, 5, Math.max(dx, dz));
        hf[zi(x, z)] = lerp(y, hf[zi(x, z)], t);
      }
    });
    // the village square: level
    for (let z = SQUARE.z - 8; z <= SQUARE.z + 8; z++) for (let x = SQUARE.x - 10; x <= SQUARE.x + 10; x++) {
      const d = Math.max(Math.abs(x - SQUARE.x) - 6, Math.abs(z - SQUARE.z) - 4, 0);
      hf[zi(x, z)] = lerp(hf[zi(SQUARE.x, SQUARE.z)], hf[zi(x, z)], smooth(0, 4, d));
    }
    const hm = new Uint8Array(W * D);
    for (let i = 0; i < W * D; i++) hm[i] = clamp(Math.round(hf[i]), 3, H - 6);

    // ---------- paths (stone lanes) ----------
    const pathM = new Uint8Array(W * D);
    function lane(ax, az, bx, bz, r) {
      const L = Math.hypot(bx - ax, bz - az) || 1;
      for (let s = 0; s <= L; s += 0.5) {
        const px = ax + (bx - ax) * s / L, pz = az + (bz - az) * s / L;
        for (let z = Math.floor(pz - r); z <= Math.ceil(pz + r); z++) for (let x = Math.floor(px - r); x <= Math.ceil(px + r); x++) {
          if (x < 1 || z < 1 || x >= W - 1 || z >= D - 1) continue;
          if (Math.hypot(x + 0.5 - px, z + 0.5 - pz) <= r) pathM[zi(x, z)] = 1;
        }
      }
    }
    const MAIN = [[90, 100], [90, 108], [101, 112], [126, 116], [136, 122], [132, 128]];   // square → inn → lakeside
    for (let i = 0; i < MAIN.length - 1; i++) lane(MAIN[i][0], MAIN[i][1], MAIN[i + 1][0], MAIN[i + 1][1], 1.5);
    lane(90, 100, 90, 82, 1.2); lane(90, 82, 96, 62, 1.0); lane(96, 62, 100, 49, 0.9);          // up to the hut
    lane(90, 92, 128, 90, 1.1); lane(90, 92, 52, 94, 1.1); lane(52, 94, 42, 95, 1.0);         // the village lane east / west
    // each building's doorstep joins the nearest lane
    const doorsAt = PLAN.map((p) => [p[0] + (p[2] >> 1), p[1] + p[3] + 1]);
    const laneCells = []; for (let i = 0; i < W * D; i++) if (pathM[i]) laneCells.push(i);
    doorsAt.forEach(([dx, dz]) => {
      let best = -1, bd = 1e9;
      for (const c of laneCells) { const x = c % W, z = (c / W) | 0, d = Math.hypot(x - dx, z - dz); if (d < bd) { bd = d; best = c; } }
      if (best >= 0 && bd < 40) { const bx = best % W, bz = (best / W) | 0; lane(dx + 0.5, dz, dx + 0.5, (dz + bz) / 2, 0.8); lane(dx + 0.5, (dz + bz) / 2, bx + 0.5, bz + 0.5, 0.8); }
    });
    // keep lanes walkable: no step higher than 1 along them
    for (let pass = 0; pass < 3; pass++) for (let z = 1; z < D - 1; z++) for (let x = 1; x < W - 1; x++) {
      const i = zi(x, z); if (!pathM[i]) continue;
      for (const j of [i - 1, i + 1, i - W, i + W]) if (pathM[j] && hm[i] > hm[j] + 1) hm[i] = hm[j] + 1;
    }

    // ---------- the brook from the snowfield to the lake ----------
    const brookM = new Uint8Array(W * D);
    { let x = 132, z = 44; for (let s = 0; s < 140; s++) { const t = s / 140; const tx = lerp(132, 140, t) + Math.sin(s / 9) * 4, tz = lerp(44, LAKE.z - LAKE.rz + 1, t); x = tx; z = tz;
      for (let k = -1; k <= 0; k++) { const xi = Math.round(x) + k, zz = Math.round(z); if (xi > 0 && zz > 0 && xi < W && zz < D) brookM[zi(xi, zz)] = 1; } } }

    // ---------- fill the columns ----------
    for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
      const i = zi(x, z), top = hm[i] - 1;
      const sl = Math.max(Math.abs(hf[zi(Math.min(W - 1, x + 1), z)] - hf[zi(Math.max(0, x - 1), z)]), Math.abs(hf[zi(x, Math.min(D - 1, z + 1))] - hf[zi(x, Math.max(0, z - 1))])) / 2;
      const snowLine = 40 + (fbm(x / 9, z / 9, 77, 2) - 0.5) * 10;
      const lakeBed = top < WATER_Y;
      for (let y = 0; y <= top; y++) {
        let id = B.STONE, c = (y + x + z) % 5 ? C.stone : C.stoneD;
        if (y >= top - 2 && sl < 1.6 && !lakeBed && y < snowLine) { id = B.DIRT; c = C.dirt; }
        if (y > snowLine + 5 + hash3(x, y, z) * 4 || (y >= snowLine && y >= top - 3 && sl < 3.2)) { id = B.SNOW; c = C.snow; }   // the peaks: white, the rock showing through below
        if (y === top) {
          if (lakeBed) { id = B.GRAVEL; c = C.gravel; }
          else if (y >= snowLine) { id = sl < 2.4 ? B.SNOW : B.ROCKSNOW; c = C.snow; }
          else if (sl >= 1.8 || y > snowLine - 6 && sl > 1.1) { id = B.STONE; c = C.stone; }
          else if (pathM[i]) { id = B.PATH; c = C.path; }
          else if (top < WATER_Y + 1.5 && Math.hypot((x - LAKE.x) / LAKE.rx, (z - LAKE.z) / LAKE.rz) < 1.9) { id = B.GRAVEL; c = C.gravel; }
          else { const gn = fbm(x / 7, z / 7, 5, 2); id = gn > 0.62 ? B.MEADOW : B.GRASS; c = id === B.MEADOW ? C.meadow : C.grass[Math.floor(hash3(x, 7, z) * 4)]; }
        }
        blocks[idx(x, y, z)] = id; cols[idx(x, y, z)] = c;
      }
      if (brookM[i] && !lakeBed && top > WATER_Y + 1 && top < snowLine) { set(x, top, z, B.BROOK, C.brook); if (top - 1 >= 0) set(x, top - 1, z, B.GRAVEL, C.gravel); }
    }

    // ---------- buildings ----------
    const landmarks = [], lamps = [], flags = [], chimneys = [], doors = [], seats = [], buildings = [];
    function markOcc(x0, z0, x1, z1, v) { for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) if (x >= 0 && z >= 0 && x < W && z < D) occ[zi(x, z)] = Math.max(occ[zi(x, z)], v); }
    function lamp(x, y, z) { set(x, y, z, B.LAMP, 0); lamps.push([x + 0.5, y + 0.5, z + 0.5]); }
    function postLamp(x, z) {
      const y = hm[zi(x, z)]; if (!isAir(x, y, z)) return;
      set(x, y, z, B.DARK, C.dark); set(x, y + 1, z, B.DARK, C.dark); lamp(x, y + 2, z);
    }
    function seat(x, y, z, yaw) { seats.push({ x: x + 0.5, y: y + 1, z: z + 0.5, yaw }); }
    function chair(x, y, z, yaw) { set(x, y, z, B.CHAIR, C.woodD); seat(x, y, z, yaw); }
    function bench(x, y, z, yaw) { set(x, y, z, B.BENCH, C.wood); seat(x, y, z, yaw); }
    function door(x, y, z, face) { set(x, y, z, B.DOOR, 0); set(x, y + 1, z, B.DOOR, 0); doors.push({ x, y, z, face, open: false }); }

    // a gabled roof, ridge along z (gable to the south), with an overhang; returns the ridge height
    function roof(x0, z0, x1, z1, y, mat, snowCap) {
      const w = x1 - x0 + 1, layers = Math.ceil((w + 2) / 2);
      for (let k = 0; k < layers; k++) {
        const xa = x0 - 1 + k, xb = x1 + 1 - k, yy = y + k;
        for (let z = z0 - 1; z <= z1 + 2; z++) {
          set(xa, yy, z, B.ROOF, mat); set(xb, yy, z, B.ROOF, mat);
          if (snowCap && xa === xb) set(xa, yy + 1, z, B.SNOW, C.snow);
          for (let x = xa + 1; x < xb; x++) {   // gable walls: logs, a little window up top
            set(x, yy, z0, B.LOGW, C.woodD); set(x, yy, z1, B.LOGW, C.woodD);
          }
        }
        if (xb - xa === 2 && k > 1) { set(x0 + (w >> 1), yy, z1, B.GLASS, 0); }
      }
      return y + layers;
    }
    // shutters + flower box either side of a window in a wall facing +z (front) or ±x
    function windowAt(x, y, z, dir, shut, flowers) {
      set(x, y, z, B.GLASS, 0);
      if (dir === 'z') { if (isWall(x - 1, y, z)) set(x - 1, y, z, B.SHUTTER, shut); if (isWall(x + 1, y, z)) set(x + 1, y, z, B.SHUTTER, shut); if (flowers && isAir(x, y - 1, z + 1)) set(x, y - 1, z + 1, B.FLOWER, 0); }
      else { if (isWall(x, y, z - 1)) set(x, y, z - 1, B.SHUTTER, shut); if (isWall(x, y, z + 1)) set(x, y, z + 1, B.SHUTTER, shut); }
    }
    function isWall(x, y, z) { const b = get(x, y, z); return b === B.LOGW || b === B.PLASTER || b === B.STONE || b === B.PLANKS; }

    function furnishGround(x0, z0, x1, z1, y, n) {   // y = floor surface (first air)
      const cx = (x0 + x1) >> 1;
      // fireplace on the back wall
      for (let dx = -1; dx <= 1; dx++) for (let dy = 0; dy <= 2; dy++) set(cx + dx, y + dy, z0 + 1, B.STONE, C.stoneW);
      set(cx, y, z0 + 1, B.FIRE, 0); set(cx, y + 1, z0 + 1, B.STONE, C.stoneD); lamps.push([cx + 0.5, y + 0.6, z0 + 2.2]);
      // rug, table and chairs
      const rc = pick(C.rug);
      for (let z = z0 + 3; z <= Math.min(z1 - 2, z0 + 5); z++) for (let x = cx - 1; x <= cx + 1; x++) set(x, y - 1, z, B.RUG, rc);
      const tz = Math.min(z1 - 2, z0 + 4);
      set(cx, y, tz, B.TABLE, C.wood); chair(cx - 1, y, tz, -Math.PI / 2); chair(cx + 1, y, tz, Math.PI / 2);
      // a corner bench and a shelf
      if (x1 - x0 >= 6) { bench(x1 - 1, y, z1 - 1, Math.PI / 2); bench(x1 - 1, y, z1 - 2, Math.PI / 2); set(x1 - 1, y, z0 + 1, B.BOOKS, 0); set(x1 - 1, y + 1, z0 + 1, B.BOOKS, 0); }
      lamp(cx, y + 2, tz - 1 < z0 + 2 ? z0 + 2 : tz - 1);
    }
    function stairs(x0, z0, y) {   // three steps up towards the back wall (by the west wall), the hole in the floor above them; the landing is to the east
      for (let k = 0; k < 3; k++) for (let j = 0; j <= k; j++) set(x0 + 1, y + j, z0 + 3 - k, B.PLANKS, C.woodD);
      for (let k = 0; k < 3; k++) set(x0 + 1, y + 3, z0 + 1 + k, B.AIR, 0);
    }
    function furnishUpper(x0, z0, x1, z1, y, n) {
      const wc = pick(C.wool);
      set(x1 - 1, y, z0 + 1, B.BED, wc); set(x1 - 1, y, z0 + 2, B.BED, wc);
      if (x1 - x0 >= 7) { set(x1 - 3, y, z0 + 1, B.BED, wc); set(x1 - 3, y, z0 + 2, B.BED, wc); }
      set(x0 + 1, y, z1 - 1, B.TABLE, C.wood); chair(x0 + 2, y, z1 - 1, Math.PI / 2);
      set(x1 - 1, y, z1 - 1, B.BOOKS, 0);
      lamp(x0 + 1, y + 1, z1 - 1 - 0 > z0 ? z1 - 1 : z0 + 1);
    }

    function chalet(n) {
      const [x0, z0, w, d, floors, kind, name] = PLAN[n];
      const x1 = x0 + w - 1, z1 = z0 + d - 1, y0 = pads[n] + 1;   // y0 = floor surface
      const shut = pick(C.shutters);
      // foundation down into the slope, then a clean interior
      for (let z = z0 - 1; z <= z1 + 2; z++) for (let x = x0 - 1; x <= x1 + 1; x++) {
        const g = hm[zi(x, z)];
        for (let y = Math.min(g, y0 - 1); y <= y0 + 4 * floors + 8; y++) set(x, y, z, y <= y0 - 1 ? B.STONE : B.AIR, C.stoneW);
        if (x >= 0 && z >= 0 && x < W && z < D) hm[zi(x, z)] = y0;
      }
      fillBox(x0, y0 - 1, z0, x1, y0 - 1, z1, B.STONE, C.stoneW);
      fillBox(x0 + 1, y0 - 1, z0 + 1, x1 - 1, y0 - 1, z1 - 1, B.PLANKS, C.wood);
      // porch / terrace in front
      fillBox(x0 - 1, y0 - 1, z1 + 1, x1 + 1, y0 - 1, z1 + 2, B.PATH, C.path);
      for (let f = 0; f < floors; f++) {
        const yb = y0 + f * 4, ground = f === 0;
        const wallM = ground ? (kind === 'chapel' ? B.PLASTER : B.STONE) : B.LOGW, wallC = ground ? (kind === 'chapel' ? C.plaster : C.stoneW) : (kind === 'hut' ? C.woodDD : C.woodD);
        for (let y = yb; y < yb + 3; y++) for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) {
          if (x !== x0 && x !== x1 && z !== z0 && z !== z1) continue;
          const corner = (x === x0 || x === x1) && (z === z0 || z === z1);
          set(x, y, z, corner && !ground ? B.LOGW : wallM, corner && !ground ? C.woodDD : (ground && kind !== 'chapel' && (x + y + z) % 3 === 0 ? C.stone : wallC));
        }
        fillBox(x0, yb + 3, z0, x1, yb + 3, z1, B.PLANKS, C.woodD);       // the floor above
        // windows: front, back, sides
        for (let x = x0 + 2; x <= x1 - 2; x += 3) { if (!(ground && Math.abs(x - (x0 + (w >> 1))) < 2)) windowAt(x, yb + 1, z1, 'z', shut, !ground); windowAt(x, yb + 1, z0, 'z', shut, false); }
        for (let z = z0 + 2; z <= z1 - 2; z += 3) { windowAt(x0, yb + 1, z, 'x', shut); windowAt(x1, yb + 1, z, 'x', shut); }
      }
      const roofY = y0 + 4 * floors - 1;
      // the front door, a lamp beside it, and its doorstep
      const dx = x0 + (w >> 1);
      door(dx, y0, z1, 'z');
      set(dx + 1, y0 + 2, z1 + 1, B.AIR, 0); lamp(dx + 1, y0 + 2, z1 + 1 > z1 ? z1 + 1 : z1);
      // a wooden balcony across the upper floor, with geraniums along the rail
      if (floors >= 2) {
        const yb = y0 + 4;
        fillBox(x0, yb - 1, z1 + 1, x1, yb - 1, z1 + 1, B.PLANKS, C.wood);
        for (let x = x0; x <= x1; x++) { set(x, yb, z1 + 1, B.RAIL, C.woodD); if (x % 2) set(x, yb + 1, z1 + 1, B.FLOWER, 0); }
        set(dx, yb, z1, B.AIR, 0); set(dx, yb + 1, z1, B.AIR, 0);   // a door out onto it
        set(dx, yb, z1 + 1, B.PLANKS, C.wood); set(dx, yb + 1, z1 + 1, B.AIR, 0); set(dx, yb, z1 + 1, B.AIR, 0); set(dx, yb - 1, z1 + 1, B.PLANKS, C.wood);
        for (let x = x0; x <= x1; x++) if (x !== dx) set(x, yb, z1 + 1, B.RAIL, C.woodD);
      }
      // interior
      const ix0 = x0, iz0 = z0, ix1 = x1, iz1 = z1;
      if (kind === 'chapel') {
        for (let z = z0 + 3; z <= z1 - 2; z += 2) for (const x of [x0 + 2, x0 + 3, x1 - 3, x1 - 2]) bench(x, y0, z, Math.PI);
        set(dx, y0, z0 + 1, B.TABLE, C.plaster); lamp(dx - 1, y0 + 1, z0 + 1); lamp(dx + 1, y0 + 1, z0 + 1);
        lamps.push([dx + 0.5, y0 + 2, z0 + 2]);
      } else if (kind === 'barn') {
        for (let z = z0 + 1; z <= z1 - 1; z++) for (let x = x0 + 1; x <= x0 + 3; x++) for (let y = y0; y < y0 + 2 + (z & 1); y++) set(x, y, z, B.HAY, C.hay);
        fillBox(dx - 1, y0, z1, dx + 1, y0 + 2, z1, B.AIR, 0); door(dx, y0, z1, 'z'); set(dx, y0, z1, B.DOOR, 0); set(dx, y0 + 1, z1, B.DOOR, 0);
        bench(x1 - 1, y0, z1 - 1, Math.PI / 2); lamp(x1 - 1, y0 + 2, z0 + 1);
      } else {
        furnishGround(ix0, iz0, ix1, iz1, y0, n);
        for (let f = 0; f < floors - 1; f++) stairs(x0, z0, y0 + 4 * f);
        for (let f = 1; f < floors; f++) furnishUpper(ix0, iz0, ix1, iz1, y0 + 4 * f, n);
      }
      // roof
      const ridge = roof(x0, z0, x1, z1, roofY, kind === 'chapel' ? C.roofG : C.roof, kind === 'hut');
      // chimney
      if (kind !== 'chapel') {
        const cx = (x0 + x1) >> 1, cz = z0 + 1;
        for (let y = y0 + 3; y <= ridge + 1; y++) set(cx, y, cz, B.STONE, C.stoneW);
        for (let y = y0 + 1; y < y0 + 3; y++) if (kind === 'barn') set(cx, y, cz, B.AIR, 0);
        chimneys.push([cx + 0.5, ridge + 2.1, cz + 0.5]);
      }
      // a chapel bell tower with a pointed spire, over the entrance
      if (kind === 'chapel') {
        const tx0 = dx - 1, tz0 = z1 - 2;
        for (let y = y0; y < ridge + 4; y++) for (let z = tz0; z <= tz0 + 2; z++) for (let x = tx0; x <= tx0 + 2; x++) set(x, y, z, x === dx && y < y0 + 3 ? B.AIR : B.PLASTER, C.plaster);   // the way in runs through the tower
        set(dx, ridge + 2, z1, B.DARK, C.dark); set(dx, ridge + 2, tz0, B.DARK, C.dark);
        for (let k = 0; k < 6; k++) { const r = k < 2 ? 1 : 0, y = ridge + 4 + k; for (let z = tz0 + 1 - r; z <= tz0 + 1 + r; z++) for (let x = dx - r; x <= dx + r; x++) set(x, y, z, B.ROOF, C.roofG); }
        set(dx, ridge + 10, tz0 + 1, B.DARK, pal(0.86, 0.72, 0.3));
        door(dx, y0, z1, 'z');
      }
      if (kind === 'inn' || kind === 'hut') { const fx = x1 + 2, fz = z1 + 2, g = hm[zi(fx, fz)]; for (let y = g; y < g + 9; y++) set(fx, y, fz, B.DARK, C.dark); flags.push([fx, g + 8, fz]); }
      if (kind === 'inn') { set(dx - 2, y0 + 2, z1 + 1, B.SIGN, 0); bench(x0 + 1, y0, z1 + 2, 0); bench(x1 - 1, y0, z1 + 2, 0); set(x0 + 3, y0, z1 + 2, B.TABLE, C.wood); }
      markOcc(x0 - 2, z0 - 2, x1 + 2, z1 + 3, 1);
      const nm = { chalet: '木屋', inn: '旅馆', chapel: '小教堂', barn: '谷仓', hut: '山屋' }[kind];
      buildings.push({ id: 'a' + n, kind, x0, z0, x1, z1, y: y0, floors, name, door: [dx, y0, z1] });
      landmarks.push({ id: 'a' + n, name: (kind === 'chalet' ? name.replace('Chalet ', '') + ' ' + nm : name.split(' · ')[0].replace(/^Gasthaus /, '旅馆 ').replace(/^Kapelle /, '小教堂 ')), en: name, x: dx + 0.5, z: z1 + 2, top: ridge, r: 9 });
    }
    PLAN.forEach((_, n) => chalet(n));

    // ---------- the village square: a wooden fountain, benches, lamps ----------
    {
      const sx = SQUARE.x, sz = SQUARE.z, y = hm[zi(sx, sz)];
      for (let z = sz - 4; z <= sz + 4; z++) for (let x = sx - 6; x <= sx + 6; x++) { set(x, y - 1, z, B.PATH, C.path); for (let k = 0; k < 6; k++) set(x, y + k, z, B.AIR, 0); hm[zi(x, z)] = y; pathM[zi(x, z)] = 1; }
      for (let z = sz - 1; z <= sz + 1; z++) for (let x = sx - 2; x <= sx + 2; x++) set(x, y, z, (Math.abs(z - sz) === 1 || Math.abs(x - sx) === 2) ? B.LOGW : B.BROOK, (Math.abs(z - sz) === 1 || Math.abs(x - sx) === 2) ? C.woodD : C.brook);
      for (let k = 1; k <= 3; k++) set(sx, y + k, sz - 1, B.LOGW, C.woodD); set(sx, y + 3, sz, B.LOGW, C.woodD);
      bench(sx - 5, y, sz - 3, 0); bench(sx - 4, y, sz - 3, 0); bench(sx + 4, y, sz + 3, Math.PI); bench(sx + 5, y, sz + 3, Math.PI);
      postLamp(sx - 6, sz + 4); postLamp(sx + 6, sz - 4);
      markOcc(sx - 6, sz - 4, sx + 6, sz + 4, 3);
      landmarks.push({ id: 'square', name: '村庄广场', en: 'Dorfplatz', x: sx + 0.5, z: sz + 0.5, top: y + 3, r: 8 });
    }
    // lamps along the main lane
    for (let i = 1; i < MAIN.length - 1; i++) postLamp(Math.round(MAIN[i][0]) + 2, Math.round(MAIN[i][1]) - 2);

    // ---------- the lake jetty and a bench at its end ----------
    {
      const jx = LAKE.x - 8, z0 = LAKE.z - LAKE.rz - 3, z1 = LAKE.z - 2, y = Math.floor(WATER_Y);
      for (let z = z0; z <= z1; z++) for (let x = jx; x <= jx + 1; x++) { set(x, y, z, B.PLANKS, C.wood); for (let k = 1; k < 4; k++) if (get(x, y + k, z) !== B.AIR && hm[zi(x, z)] <= y + 1) set(x, y + k, z, B.AIR, 0); if (z % 4 === 0) for (let k = hm[zi(x, z)]; k < y; k++) set(x, k, z, B.BARK, C.bark); }
      bench(jx, y + 1, z1, Math.PI); set(jx + 1, y + 1, z1, B.RAIL, C.woodD);
      landmarks.push({ id: 'lake', name: '湖边栈桥', en: 'Bergsee · Lake jetty', x: jx + 1, z: z1, top: y + 2, r: 10 });
    }
    // ---------- the pasture: a fence round a meadow by the barn ----------
    const pasture = [];
    {
      const bx0 = 22, bz0 = 98, bx1 = 46, bz1 = 122;
      for (let z = bz0; z <= bz1; z++) for (let x = bx0; x <= bx1; x++) {
        const i = zi(x, z), y = hm[i];
        if (occ[i] || pathM[i]) continue;
        const edge = x === bx0 || x === bx1 || z === bz0 || z === bz1;
        if (edge) { if (!(z === bz0 && (x === 34 || x === 35))) set(x, y, z, B.RAIL, C.woodD); }
        else { pasture.push([x, z]); occ[i] = 3; }
      }
    }
    // ---------- pine forest (denser on the slopes), a few by the lake ----------
    function pine(x, z, big) {
      const y = hm[zi(x, z)], hgt = big ? RI(9, 13) : RI(6, 9);
      if (y >= H - hgt - 2) return;
      const snowy = y > 34;
      for (let k = 0; k < hgt - 1; k++) set(x, y + k, z, B.BARK, C.bark);
      const pc = pick(C.pine);
      for (let k = 2; k <= hgt; k++) {
        const r = Math.max(0, Math.round((hgt - k) / (big ? 3.2 : 2.8))) + ((k & 1) ? 0 : 0);
        for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) {
          if (Math.abs(dx) + Math.abs(dz) > r + (r > 1 ? 1 : 0)) continue;
          if (dx === 0 && dz === 0 && k < hgt - 1) continue;
          if (isAir(x + dx, y + k, z + dz)) set(x + dx, y + k, z + dz, B.PINE, pc);
        }
        if (snowy && (k & 1) === 0 && r > 0) for (const [dx, dz] of [[r, 0], [-r, 0], [0, r], [0, -r]]) if (isAir(x + dx, y + k + 1, z + dz)) set(x + dx, y + k + 1, z + dz, B.SNOW, C.snow);
      }
      set(x, y + hgt, z, snowy ? B.SNOW : B.PINE, snowy ? C.snow : pc);
    }
    for (let t = 0; t < 2600; t++) {
      const x = RI(3, W - 4), z = RI(3, D - 4), i = zi(x, z), y = hm[i];
      if (occ[i] || pathM[i] || brookM[i] || y < WATER_Y + 2 || y > 44) continue;
      const top = get(x, y - 1, z); if (top !== B.GRASS && top !== B.MEADOW) continue;
      const forest = fbm(x / 22, z / 22, 61, 3);
      const slope = Math.abs(hf[zi(x + 1, z)] - hf[zi(x - 1, z)]) + Math.abs(hf[zi(x, z + 1)] - hf[zi(x, z - 1)]);
      const dens = forest > 0.55 || y > 26 ? 0.75 : 0.06;
      if (rnd() > dens) continue;
      let ok = true; for (let dz = -2; dz <= 2 && ok; dz++) for (let dx = -2; dx <= 2; dx++) if (get(x + dx, y, z + dz) === B.BARK || occ[zi(clamp(x + dx, 0, W - 1), clamp(z + dz, 0, D - 1))] === 1) { ok = false; break; }
      if (!ok || slope > 3.4) continue;
      pine(x, z, rnd() < 0.35);
      markOcc(x - 1, z - 1, x + 1, z + 1, 3);
    }
    // wild flowers and hay bales in the meadows
    for (let t = 0; t < 900; t++) {
      const x = RI(2, W - 3), z = RI(2, D - 3), i = zi(x, z), y = hm[i];
      if (occ[i] || pathM[i] || get(x, y - 1, z) !== B.MEADOW || !isAir(x, y, z)) continue;
      set(x, y, z, B.FLOWER, 0);
    }
    for (const [x, z] of [[54, 128], [58, 130], [62, 127], [120, 132], [124, 135]]) { const y = hm[zi(x, z)]; if (!occ[zi(x, z)] && isAir(x, y, z)) { set(x, y, z, B.HAY, C.hay); set(x + 1, y, z, B.HAY, C.hay); } }

    // ---------- the snowy summit cairn with a cross ----------
    {
      let bx = 96, bz = 20, by = 0;
      for (let z = 8; z < 40; z++) for (let x = 64; x < 132; x++) if (hm[zi(x, z)] > by) { by = hm[zi(x, z)]; bx = x; bz = z; }
      for (let k = 0; k < 4; k++) set(bx, by + k, bz, B.BARK, C.woodDD); set(bx - 1, by + 2, bz, B.BARK, C.woodDD); set(bx + 1, by + 2, bz, B.BARK, C.woodDD);
      landmarks.push({ id: 'summit', name: '雪峰之巅', en: 'Gipfel · Summit', x: bx + 0.5, z: bz + 0.5, top: by + 4, r: 14 });
    }

    // ---------- derived data ----------
    { const seen = {}; for (let i = doors.length - 1; i >= 0; i--) { const k = doors[i].x + ',' + doors[i].y + ',' + doors[i].z; if (seen[k]) doors.splice(i, 1); else seen[k] = 1; } }
    const walk = new Uint8Array(W * D);
    for (let i = 0; i < W * D; i++) if (pathM[i] && get(i % W, hm[i] - 1, (i / W) | 0) === B.PATH && get(i % W, hm[i], (i / W) | 0) === B.AIR) walk[i] = 1;
    const topH = new Uint8Array(W * D), topB = new Uint8Array(W * D), topC = new Uint8Array(W * D);
    for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
      for (let y = H - 1; y >= 0; y--) { const b = blocks[idx(x, y, z)]; if (b) { topH[zi(x, z)] = y; topB[zi(x, z)] = b; topC[zi(x, z)] = cols[idx(x, y, z)]; break; } }
    }
    const sq = landmarks.find((l) => l.id === 'square');
    const spawn = { x: SQUARE.x - 3.5, y: hm[zi(SQUARE.x - 4, SQUARE.z + 3)] + 0.01, z: SQUARE.z + 3.5, yaw: -0.5 };
    const tour = {
      cam: [[90, 34, 150], [140, 30, 150], [176, 44, 112], [150, 58, 60], [96, 64, 70], [40, 50, 72], [24, 38, 128], [60, 28, 140]],
      tgt: [[92, 20, 104], [110, 18, 112], [140, 16, 120], [104, 30, 84], [96, 40, 40], [70, 20, 96], [60, 20, 104], [92, 20, 108]],
      dur: 140
    };
    return {
      W, D, H, BASE: 12, GY: 11, WATER_Y, blocks, cols, palette, pal, get, set, idx, inb, B, BI,
      hm, walk, occ, land: null, topH, topB, topC, landmarks, lamps, flags, chimneys, doors, seats, pasture, buildings,
      spawn, tour, moorings: []
    };
  }

  root.AlpineWorld = { W, D, H, WATER_Y, B, BI, T, create, hash3, mulberry32 };
  if (typeof module !== 'undefined') module.exports = root.AlpineWorld;
})(typeof window !== 'undefined' ? window : globalThis);
