/* Santorini (Oia) Voxel World — procedural generator (no DOM / no THREE dependency).
 * Exposes global SantoriniWorld = { W, D, H, P, B, BI, T, create(seed) }.
 * Layout: the caldera sea lies to the WEST (sunset side); the whitewashed town climbs down the cliff.
 * x east, z south, y up. Cell (x,y,z) occupies [x,x+1)×[y,y+1)×[z,z+1).
 * hm[x,z] = number of solid layers in a column (top block y = hm-1, first air cell y = hm).
 */
(function (root) {
  'use strict';

  const W = 272, D = 224, H = 96;
  const P = 44;              // plateau height
  const WATER_Y = 10.85;     // water surface
  const QUAY = 13;           // harbour deck height

  // ---- tiles & blocks -------------------------------------------------
  const T = {
    ash: 0, strata: 1, pave: 2, plaster: 3, stone: 4, rubble: 5, thatch: 6, planks: 7, glass: 8, shutter: 9,
    bronze: 10, dome: 11, tile: 12, dark: 13, lamp: 14, leaf: 15, log: 16, pool: 17, door: 18, flower: 19,
    awnB: 20, dry: 21, cobble: 22, awnO: 23
  };
  const B = {
    AIR: 0, ASH: 1, ROCK: 2, PAVE: 3, PLASTER: 4, STONE: 5, RUBBLE: 6, THATCH: 7, WOOD: 8, GLASS: 9,
    SHUTTER: 10, BRONZE: 11, DOME: 12, TILE: 13, DARK: 14, LAMP: 15, LEAF: 16, LOG: 17, POOL: 18, DOOR: 19,
    FLOWER: 20, AWN_B: 21, AWN_O: 22, DRY: 23
  };
  const BI = [];
  function def(id, name, top, side, bottom, glow, jit) {
    BI[id] = { name, top, side, bottom: bottom == null ? side : bottom, glow: !!glow, jit: jit == null ? 0.08 : jit };
  }
  def(B.AIR, 'air', 0, 0);
  def(B.ASH, 'ash', T.ash, T.ash, T.ash, false, 0.12);
  def(B.ROCK, 'rock', T.strata, T.strata, T.strata, false, 0.09);
  def(B.PAVE, 'pave', T.pave, T.plaster, T.plaster, false, 0.05);
  def(B.PLASTER, 'plaster', T.plaster, T.plaster, T.plaster, false, 0.035);
  def(B.STONE, 'stone', T.stone, T.stone, T.stone, false, 0.05);
  def(B.RUBBLE, 'rubble', T.rubble, T.rubble, T.rubble, false, 0.12);
  def(B.THATCH, 'thatch', T.thatch, T.thatch, T.thatch, false, 0.1);
  def(B.WOOD, 'wood', T.planks, T.planks, T.planks, false, 0.08);
  def(B.GLASS, 'glass', T.glass, T.glass, T.glass, true, 0);
  def(B.SHUTTER, 'shutter', T.shutter, T.shutter, T.shutter, false, 0.05);
  def(B.BRONZE, 'bronze', T.bronze, T.bronze, T.bronze, false, 0.04);
  def(B.DOME, 'dome', T.dome, T.dome, T.dome, false, 0.04);
  def(B.TILE, 'tile', T.tile, T.tile, T.tile, false, 0.1);
  def(B.DARK, 'dark', T.dark, T.dark, T.dark, false, 0.04);
  def(B.LAMP, 'lamp', T.lamp, T.lamp, T.lamp, true, 0);
  def(B.LEAF, 'leaf', T.leaf, T.leaf, T.leaf, false, 0.16);
  def(B.LOG, 'log', T.log, T.log, T.log, false, 0.08);
  def(B.POOL, 'pool', T.pool, T.pool, T.pool, false, 0.03);
  def(B.DOOR, 'door', T.door, T.door, T.door, false, 0.04);
  def(B.FLOWER, 'flower', T.flower, T.flower, T.flower, false, 0.1);
  def(B.AWN_B, 'awning', T.awnB, T.awnB, T.awnB, false, 0.03);
  def(B.AWN_O, 'awning', T.awnO, T.awnO, T.awnO, false, 0.03);
  def(B.DRY, 'soil', T.dry, T.dry, T.dry, false, 0.12);

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

  // ---- terrain shape --------------------------------------------------
  const XC = (z) => 136 + 8 * Math.sin(z / 48 + 0.4) + 3.5 * Math.sin(z / 15 + 2.0);   // caldera cliff edge
  const ZN = (x) => 22 + 6 * Math.sin(x / 37);                                            // northern cliff edge
  const ZS = 188;                                                                          // southern cliff edge
  const XE = (z) => 242 + 6 * Math.sin(z / 40);                                           // Aegean shore
  const LANES = [38, 56, 124, 152, 174];
  const ALLEYS = [30, 44, 58, 72, 86, 100, 114, 128, 142, 156, 170, 184];

  const FACADES = [
    [0.97, 0.97, 0.95], [0.96, 0.95, 0.92], [0.97, 0.97, 0.95], [0.95, 0.94, 0.9], [0.97, 0.97, 0.95], [0.97, 0.96, 0.93],
    [0.93, 0.80, 0.55], [0.92, 0.70, 0.58], [0.95, 0.88, 0.66], [0.88, 0.62, 0.50], [0.84, 0.82, 0.84], [0.94, 0.78, 0.50]
  ];
  const SHUTTERS = [[0.10, 0.36, 0.76], [0.12, 0.42, 0.80], [0.08, 0.30, 0.66], [0.10, 0.36, 0.76], [0.18, 0.46, 0.52], [0.55, 0.22, 0.18]];

  // ---- world creation -------------------------------------------------
  function create(seed) {
    seed = seed == null ? 2021 : seed;
    const rnd = mulberry32(seed);
    const R = (a, b) => a + rnd() * (b - a);
    const RI = (a, b) => Math.floor(R(a, b + 1));
    const pick = (a) => a[Math.floor(rnd() * a.length)];

    const blocks = new Uint8Array(W * H * D);
    const cols = new Uint8Array(W * H * D);
    const idx = (x, y, z) => x + W * (z + D * y);
    const inb = (x, y, z) => x >= 0 && x < W && y >= 0 && y < H && z >= 0 && z < D;
    const get = (x, y, z) => (inb(x, y, z) ? blocks[idx(x, y, z)] : (y < 0 ? B.ASH : 0));
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
    const WHITE = pal(0.97, 0.97, 0.95), IVORY = pal(0.95, 0.93, 0.88), STONE_C = pal(0.9, 0.88, 0.83), GREY_C = pal(0.62, 0.6, 0.58);
    const BLUE = pal(0.09, 0.36, 0.78), BLUE_D = pal(0.10, 0.42, 0.86), BLUE_L = pal(0.30, 0.58, 0.9);
    const WOODC = pal(0.55, 0.38, 0.22), WOOD_W = pal(0.92, 0.9, 0.84), THATCH_C = pal(0.46, 0.34, 0.22);
    const PV_A = pal(0.92, 0.9, 0.84), PV_B = pal(0.82, 0.8, 0.74), PV_C = pal(0.74, 0.72, 0.68);
    const SOIL = [pal(0.74, 0.60, 0.40), pal(0.70, 0.57, 0.38), pal(0.78, 0.65, 0.45), pal(0.66, 0.56, 0.38), pal(0.56, 0.52, 0.33)];
    const SAND_D = [pal(0.20, 0.18, 0.17), pal(0.27, 0.24, 0.21), pal(0.15, 0.14, 0.14)];
    const SB = [pal(0.78, 0.74, 0.62), pal(0.62, 0.66, 0.6), pal(0.36, 0.52, 0.54), pal(0.2, 0.4, 0.52), pal(0.13, 0.3, 0.45), pal(0.09, 0.22, 0.38), pal(0.06, 0.16, 0.3)];
    const PUMICE = [pal(0.9, 0.84, 0.72), pal(0.84, 0.76, 0.64), pal(0.78, 0.7, 0.58), pal(0.92, 0.88, 0.8)];
    const OCHRE = [pal(0.8, 0.52, 0.3), pal(0.7, 0.42, 0.24), pal(0.84, 0.64, 0.4), pal(0.62, 0.34, 0.2)];
    const REDS = [pal(0.45, 0.2, 0.14), pal(0.55, 0.26, 0.17), pal(0.3, 0.14, 0.11), pal(0.64, 0.32, 0.2), pal(0.2, 0.17, 0.16)];
    const DARKS = [pal(0.13, 0.12, 0.13), pal(0.22, 0.17, 0.16), pal(0.3, 0.14, 0.11), pal(0.17, 0.15, 0.15), pal(0.38, 0.2, 0.15)];
    const VOLC = [pal(0.12, 0.11, 0.12), pal(0.2, 0.15, 0.14), pal(0.34, 0.16, 0.12), pal(0.16, 0.14, 0.14), pal(0.45, 0.22, 0.14), pal(0.1, 0.09, 0.1)];
    const TERR = [WHITE, WHITE, WHITE, WHITE, IVORY, pal(0.93, 0.8, 0.56), pal(0.92, 0.7, 0.58), pal(0.95, 0.88, 0.66), pal(0.84, 0.82, 0.84), pal(0.82, 0.55, 0.42)];
    function strata(x, y, z, volc) {
      const yy = y + vn(x / 14, z / 14, 5) * 2.6;
      const k = Math.floor(yy / 1.8), r = hash3(k, 9, 7);
      if (volc) return VOLC[Math.floor(r * VOLC.length)];
      let s = yy > 38 ? PUMICE : yy > 26 ? OCHRE : yy > 16 ? REDS : DARKS;
      if (hash3(x, y, z) < 0.07) s = yy > 30 ? OCHRE : REDS;
      return s[Math.floor(r * s.length)];
    }

    // ---------- heightmap ----------
    const hm = new Uint8Array(W * D);
    const kind = new Uint8Array(W * D);     // 0 sea/beach, 1 soil, 2 rock
    const occ = new Uint8Array(W * D);      // 0 free, 1 building, 2 street/reserved, 3 landmark
    const town = new Uint8Array(W * D);
    const walk = new Uint8Array(W * D);
    const roadH = new Uint8Array(W * D);

    function islandH(x, z) {
      let hI = 0;
      const u = ((x - 20) / 13) ** 2 + ((z - 112) / 84) ** 2;
      if (u < 1) hI = Math.max(hI, 11 + Math.floor(36 * Math.pow(1 - u, 0.55) + 2 * vn(x / 6, z / 6, 11)));
      const r = Math.hypot(x - 64, z - 132);
      if (r < 17) {
        let v = 11 + 26 * Math.pow(1 - r / 17, 1.25) + 3 * vn(x / 5, z / 5, 12);
        if (r < 4.5) v -= (4.5 - r) * 2.2;
        hI = Math.max(hI, Math.floor(v));
      }
      return hI;
    }
    for (let z = 0; z < D; z++) {
      for (let x = 0; x < W; x++) {
        const dw = XC(z) - x, dn = ZN(x) - z, ds = z - ZS;
        const d = Math.hypot(Math.max(dw, 0), Math.max(dn, 0), Math.max(ds, 0));
        let h = P, rock = false;
        if (d > 0) {
          const sc = 1 + 0.7 * smoothstep(160, 192, z);
          const step = Math.max(3, Math.round(3 * sc));
          const off = 1.2 + 1.1 * Math.sin(z / 7 + x / 11);
          const k = Math.floor((d + off) / 3);
          h = P - step * k;
          if (k >= 1) rock = true;
        }
        const hE = Math.floor(12 + 0.4 * (XE(z) - x) + (XE(z) - x < 34 ? 0.35 * vn(x / 12, z / 12, 3) : 0));
        if (hE < h) { h = hE; rock = false; }
        const hI = islandH(x, z);
        if (hI > h) { h = hI; rock = true; }
        const sf = 3 + Math.floor(1.6 * vn(x / 9, z / 9, 21));
        if (sf >= h) { h = sf; rock = false; }
        const i = zi(x, z);
        hm[i] = clamp(h, 1, H - 1);
        kind[i] = h <= 13 && !rock ? 0 : (rock ? 2 : 1);
      }
    }
    for (let z = 42; z <= 184; z++) for (let x = 0; x < W; x++) {
      const t = x - XC(z);
      if (t >= -33 && t <= 54 && hm[zi(x, z)] >= 14 && x > 90) town[zi(x, z)] = 1;
    }

    // ---------- fill solid ----------
    for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
      const i = zi(x, z), h = hm[i], k = kind[i];
      const volc = Math.hypot(x - 64, z - 132) < 20;
      for (let y = 0; y < h; y++) {
        let id, c;
        if (y <= 11) { id = k === 2 ? B.ROCK : B.ASH; c = SB[clamp(11 - y, 0, 6)]; if (k === 2 && y >= h - 1 && y > 8) c = SB[clamp(11 - y, 0, 6)]; }
        else if (k === 2) { id = B.ROCK; c = strata(x, y, z, volc); }
        else if (h <= 13) { id = B.ASH; c = pick(SAND_D); }
        else if (y >= h - 2) { id = B.DRY; c = hash3(x, 3, z) < 0.12 ? SOIL[4] : SOIL[Math.floor(hash3(x, 1, z) * 4)]; }
        else { id = B.ROCK; c = strata(x, y, z, false); }
        set(x, y, z, id, c);
      }
    }
    // whitewashed, pastel-tinted retaining terraces down the caldera cliff
    for (let z = 42; z <= 184; z++) for (let x = 0; x < W; x++) {
      const i = zi(x, z);
      if (!town[i] || kind[i] !== 2) continue;
      const t = x - XC(z);
      if (t >= -0.5) continue;
      const h = hm[i];
      const tint = TERR[Math.floor(hash3(h, 5, z >> 3) * TERR.length)];
      set(x, h - 1, z, B.PAVE, tint); set(x, h - 2, z, B.PLASTER, tint); set(x, h - 3, z, B.PLASTER, tint);
    }

    // ---------- ground editing ----------
    function setGround(x, z, nh, topId, topC, fillId, fillC) {
      if (x < 1 || x >= W - 1 || z < 1 || z >= D - 1) return;
      const i = zi(x, z), oh = hm[i];
      if (nh > oh) for (let y = oh; y < nh - 1; y++) set(x, y, z, fillId, fillC);
      else for (let y = nh; y < oh; y++) set(x, y, z, B.AIR, 0);
      set(x, nh - 1, z, topId, topC);
      hm[i] = nh; kind[i] = 1;
    }
    const roadColor = (x, z) => {
      const a = ((x >> 1) + (z >> 1)) & 1;
      return hash3(x, 2, z) < 0.08 ? PV_C : a ? PV_A : PV_B;
    };
    function roadCell(x, z, hp, c) {
      if (x < 1 || x >= W - 1 || z < 1 || z >= D - 1) return;
      setGround(x, z, hp, B.PAVE, c == null ? roadColor(x, z) : c, B.PLASTER, WHITE);
      const i = zi(x, z); roadH[i] = hp; walk[i] = 1; occ[i] = 2;
    }
    function markOcc(x0, z0, x1, z1, v, m) {
      m = m || 0;
      for (let z = z0 - m; z <= z1 + m; z++) for (let x = x0 - m; x <= x1 + m; x++)
        if (x >= 0 && x < W && z >= 0 && z < D && occ[zi(x, z)] < v) occ[zi(x, z)] = v;
    }
    function platform(x0, z0, x1, z1, level, c) {
      for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) roadCell(x, z, level, c);
    }

    // --- promenade along the cliff edge (Nikolaou Nomikou)
    for (let z = 24; z <= 184; z++) {
      const xs = Math.round(XC(z) + 3.5);
      let x = xs; while (x > 2 && hm[zi(x - 1, z)] === P) x--;
      for (let xx = x; xx <= xs + 2; xx++) roadCell(xx, z, P);
    }
    // --- E-W alleys
    for (const za of ALLEYS) {
      const xs = Math.round(XC(za) + 3.5) + 3, xe = Math.round(XC(za) + 62);
      for (let x = xs; x <= xe; x++) for (let z = za - 1; z <= za + 1; z++) { if (hm[zi(x, z)] >= 14) roadCell(x, z, hm[zi(x, z)]); }
    }
    // --- N-S alleys (follow the cliff edge)
    for (const off of [22, 40]) for (let z = 40; z <= 184; z++) {
      const xc = Math.round(XC(z) + off);
      for (let x = xc - 1; x <= xc + 1; x++) if (hm[zi(x, z)] >= 14) roadCell(x, z, hm[zi(x, z)]);
    }
    // --- stair lanes down the cliff: one block lower per step
    for (const zl of LANES) {
      const xc = XC(zl);
      for (let x = Math.round(xc + 2); x >= Math.round(xc - 35); x--) {
        const dd = xc - x;
        const hp = dd <= 0 ? P : Math.max(QUAY, P - Math.floor(dd));
        for (let z = zl - 1; z <= zl + 1; z++) roadCell(x, z, hp);
      }
    }

    // --- Ammoudi zig-zag (flat landings, stairs at the switchbacks)
    const donkeyPath = [];
    const ZA = 64, ZB = 84;
    {
      const d0 = 3;
      const hpAt = (x, z) => { const dd = XC(z) - x; return dd <= 0 ? P : Math.max(QUAY, P - Math.floor(dd)); };

      // connector from the promenade
      for (let x = Math.round(XC(ZA) + 3); x >= Math.round(XC(ZA) - d0); x--) {
        const hp = hpAt(x, ZA);
        for (let z = ZA - 1; z <= ZA + 1; z++) roadCell(x, z, hp);
        donkeyPath.push([x + 0.5, hp, ZA + 0.5]);
      }
      let dir = 1;                          // 1 = southwards
      for (let k = 0; k < 5; k++) {
        const dk = d0 + 7 * k, hpLeg = P - dk;
        const zStart = dir > 0 ? ZA : ZB, zEnd = dir > 0 ? ZB : ZA;
        for (let z = zStart; ; z += dir) {
          const xcen = Math.round(XC(z) - dk);
          for (let x = xcen - 1; x <= xcen + 1; x++) roadCell(x, z, hpLeg);
          donkeyPath.push([xcen + 0.5, hpLeg, z + 0.5]);
          if (z === zEnd) break;
        }
        if (k < 4) {
          const zt = zEnd, dn = dk + 7;
          for (let x = Math.round(XC(zt) - dk) - 1; x >= Math.round(XC(zt) - dn); x--) {
            const hp = hpAt(x, zt) > hpLeg ? hpLeg : hpAt(x, zt);
            for (let z = zt - 1; z <= zt + 1; z++) roadCell(x, z, Math.min(hpLeg, Math.max(P - dn, hp)));
            donkeyPath.push([x + 0.5, Math.min(hpLeg, Math.max(P - dn, hp)), zt + 0.5]);
          }
        }
        dir = -dir;
      }
    }
    // reserve a clear flank around the zig-zag so houses do not block the descent
    markOcc(Math.round(XC(ZA)) - 40, ZA - 3, Math.round(XC(ZB)) + 4, ZB + 3, 2, 0);

    // --- harbour quay, pier and tavernas
    const harbour = { qx0: 0, qx1: 0, z0: 62, z1: 98, pierZ: 76, pierX0: 0 };
    {
      const xr = Math.round(XC(ZB) - 31);
      harbour.qx1 = xr + 2; harbour.qx0 = xr - 15;
      for (let z = harbour.z0; z <= harbour.z1; z++) for (let x = harbour.qx0; x <= harbour.qx1; x++) {
        if (hm[zi(x, z)] <= QUAY && !(x > xr + 1 && hm[zi(x, z)] > 12)) roadCell(x, z, QUAY, ((x + z) & 1) ? PV_B : PV_C);
      }
    }

    const landmarks = [], lamps = [], flags = [], windmills = [], poles = [], parapets = [], moorings = [];
    function lamp(x, z) {
      const y0 = hm[zi(x, z)];
      if (get(x, y0, z) !== B.AIR || occ[zi(x, z)] === 1) return;
      set(x, y0, z, B.DARK, 0); set(x, y0 + 1, z, B.DARK, 0); set(x, y0 + 2, z, B.LAMP, 0);
      lamps.push([x + 0.5, y0 + 2.5, z + 0.5]);
    }

    // ---------- helpers for architecture ----------
    function dome(cx, cy, cz, Rr, id, c, hRatio) {
      hRatio = hRatio || 1.0;
      const hMax = Math.round(Rr * hRatio);
      for (let j = 0; j <= hMax; j++) {
        const t = j / (Rr * hRatio + 0.4);
        const r = Rr * Math.sqrt(Math.max(0, 1 - t * t)) + (j < Rr * 0.4 ? 0.2 : 0);
        const ri = Math.ceil(r);
        for (let dz = -ri; dz <= ri; dz++) for (let dx = -ri; dx <= ri; dx++)
          if (dx * dx + dz * dz <= r * r + 0.5) set(cx + dx, cy + j, cz + dz, id, c);
      }
      return cy + hMax;
    }
    function drum(cx, cy, cz, Rr, h, windows, c) {
      const ri = Math.ceil(Rr);
      for (let j = 0; j < h; j++) for (let dz = -ri; dz <= ri; dz++) for (let dx = -ri; dx <= ri; dx++) {
        const d = Math.hypot(dx, dz);
        if (d > Rr + 0.5) continue;
        let id = B.PLASTER, cc = c == null ? WHITE : c;
        if (windows && d > Rr - 0.8 && j === 0) {
          const ang = Math.atan2(dz, dx) / (Math.PI * 2) + 0.5;
          if (Math.floor(ang * 12) % 2 === 0) { id = B.GLASS; cc = 0; }
        }
        set(cx + dx, cy + j, cz + dz, id, cc);
      }
    }
    function cross(x, y, z, c) {
      c = c == null ? WHITE : c;
      set(x, y, z, B.PLASTER, c); set(x, y + 1, z, B.PLASTER, c); set(x, y + 2, z, B.PLASTER, c);
      set(x, y + 1, z - 1, B.PLASTER, c); set(x, y + 1, z + 1, B.PLASTER, c);
    }
    function disc(cx, y, cz, r, id, c) {
      const ri = Math.ceil(r);
      for (let dz = -ri; dz <= ri; dz++) for (let dx = -ri; dx <= ri; dx++) if (dx * dx + dz * dz <= r * r + 0.4) set(cx + dx, y, cz + dz, id, c);
    }
    function flag(x, y, z, h) {
      for (let k = 0; k < h; k++) set(x, y + k, z, B.PLASTER, WHITE);
      set(x, y + h, z, B.BRONZE, 0);
      flags.push([x + 0.5, y + h - 0.6, z + 0.5]);
    }
    function bellTower(cx, cz, y0, h1, caps) {
      fillBox(cx - 2, y0, cz - 2, cx + 2, y0 + h1 - 1, cz + 2, B.PLASTER, WHITE);
      for (let y = y0 + 2; y < y0 + h1 - 2; y += 4) for (const [px, pz] of [[cx, cz - 2], [cx, cz + 2], [cx - 2, cz], [cx + 2, cz]]) { set(px, y, pz, B.DARK, 0); set(px, y + 1, pz, B.DARK, 0); }
      const y1 = y0 + h1;
      fillBox(cx - 2, y1, cz - 2, cx + 2, y1, cz + 2, B.STONE, STONE_C);
      fillBox(cx - 2, y1 + 1, cz - 2, cx + 2, y1 + 4, cz + 2, B.PLASTER, WHITE);
      fillBox(cx - 1, y1 + 1, cz - 1, cx + 1, y1 + 4, cz + 1, B.AIR, 0);
      for (let y = y1 + 1; y <= y1 + 3; y++) {
        const w = y === y1 + 3 ? 0 : 0;
        set(cx + w, y, cz - 2, B.AIR, 0); set(cx + w, y, cz + 2, B.AIR, 0); set(cx - 2, y, cz + w, B.AIR, 0); set(cx + 2, y, cz + w, B.AIR, 0);
      }
      set(cx, y1 + 3, cz, B.BRONZE, 0); set(cx, y1 + 2, cz, B.BRONZE, 0);
      fillBox(cx - 2, y1 + 5, cz - 2, cx + 2, y1 + 5, cz + 2, B.STONE, STONE_C);
      let top = y1 + 6;
      if (caps) {
        fillBox(cx - 1, top, cz - 1, cx + 1, top + 1, cz + 1, B.PLASTER, WHITE);
        const t = dome(cx, top + 2, cz, 2, B.DOME, BLUE_D, 1.0);
        cross(cx, t + 1, cz); top = t + 4;
      }
      return top;
    }

    // ================= LANDMARKS =================
    // --- Three Blue Domes (Anastasis church) on the caldera edge
    function anastasis() {
      const az = 104, ax = Math.round(XC(az));
      platform(ax - 11, az - 14, ax + 1, az + 21, P, PV_A);
      const x0 = ax - 7, x1 = ax - 1, z0 = az - 12, z1 = az + 12, y0 = P;
      fillBox(x0, y0, z0, x1, y0 + 5, z1, B.PLASTER, WHITE);
      fillBox(x0, y0 + 6, z0, x1, y0 + 6, z1, B.PLASTER, IVORY);
      for (const zc of [az - 8, az, az + 8]) {
        for (const xx of [x0, x1]) {
          for (let dz = -1; dz <= 1; dz++) for (let y = 0; y <= 2; y++) set(xx, y0 + y, zc + dz, B.DARK, 0);
          set(xx, y0 + 3, zc, B.DARK, 0);
          set(xx, y0, zc, B.DOOR, BLUE); set(xx, y0 + 1, zc, B.DOOR, BLUE);
        }
        drum(ax - 4, y0 + 7, zc, 3.4, 2, true);
        const t = dome(ax - 4, y0 + 9, zc, 3.6, B.DOME, BLUE_D, 0.95);
        cross(ax - 4, t + 1, zc);
      }
      for (const zc of [az - 4, az + 4, az - 12 + 1, az + 12 - 1]) for (const xx of [x0, x1]) { set(xx, y0 + 2, zc, B.GLASS, 0); set(xx, y0 + 3, zc, B.GLASS, 0); }
      for (let z = z0; z <= z1; z += 2) { set(x0, y0 + 5, z, B.PLASTER, IVORY); }
      const topT = bellTower(ax - 4, az + 17, y0, 11, true);
      flag(ax - 9, y0, az - 12, 12);
      markOcc(ax - 12, az - 15, ax + 3, az + 22, 3, 1);
      landmarks.push({ id: 'anastasis', name: '三蓝顶教堂', en: 'Anastasis · Three Blue Domes', x: ax - 4 + 0.5, z: az + 0.5, top: topT + 3, r: 26 });
    }

    // --- Panagia Platsani on the central square
    function platsani() {
      const pz = 138, px = Math.round(XC(pz)) + 13;
      platform(px - 9, pz - 8, px + 11, pz + 13, P, PV_A);
      for (let z = pz - 8; z <= pz + 13; z++) for (let x = px - 9; x <= px + 11; x++) {
        if (((x - px + 9) % 6 === 0 || (z - pz + 8) % 6 === 0)) set(x, P - 1, z, B.PAVE, PV_C);
      }
      const x0 = px + 2, x1 = px + 10, z0 = pz - 5, z1 = pz + 5, y0 = P;
      fillBox(x0, y0, z0, x1, y0 + 6, z1, B.PLASTER, WHITE);
      fillBox(x0, y0 + 7, z0, x1, y0 + 7, z1, B.PLASTER, IVORY);
      for (let dz = -1; dz <= 1; dz++) for (let y = 0; y <= 2; y++) set(x0, y0 + y, pz + dz, B.DARK, 0);
      set(x0, y0, pz, B.DOOR, BLUE); set(x0, y0 + 1, pz, B.DOOR, BLUE); set(x0, y0 + 3, pz, B.DARK, 0);
      for (const zz of [pz - 4, pz - 3, pz + 3, pz + 4]) { set(x0, y0 + 3, zz, B.GLASS, 0); set(x0, y0 + 4, zz, B.GLASS, 0); }
      for (const zz of [z0, z1]) for (let x = x0 + 2; x <= x1 - 2; x += 3) { set(x, y0 + 3, zz, B.GLASS, 0); set(x, y0 + 4, zz, B.GLASS, 0); }
      for (let z = z0; z <= z1; z += 2) set(x0, y0 + 6, z, B.PLASTER, IVORY);
      for (let k = 0; k < 3; k++) { const zz = pz - 2 + k * 2; for (let y = 0; y <= 4; y++) set(x0 - 1, y0 + y, zz, B.PLASTER, WHITE); }
      fillBox(x0 - 1, y0 + 5, pz - 3, x0 - 1, y0 + 5, pz + 3, B.PLASTER, IVORY);
      const cxm = px + 6;
      drum(cxm, y0 + 8, pz, 3.6, 2, true);
      const t = dome(cxm, y0 + 10, pz, 3.9, B.DOME, BLUE_D, 0.95);
      cross(cxm, t + 1, pz);
      const topT = bellTower(px + 5, pz + 9, y0, 12, true);
      // café parasols & planters
      function parasol(x, z, tall) {
        for (let k = 0; k < tall; k++) set(x, P + k, z, B.PLASTER, WOOD_W);
        for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) set(x + dx, P + tall, z + dz, B.AWN_B, 0);
        set(x, P + tall + 1, z, B.PLASTER, WHITE);
      }
      for (const [dx, dz] of [[-7, -5], [-3, -5], [-7, 0], [-3, 0], [-7, 5], [-3, 5], [-5, 9], [-1, 10]]) parasol(px + dx, pz + dz, 3);
      for (const [dx, dz] of [[-9, -8], [-9, 13], [11, -8], [0, -8], [0, 13]]) { set(px + dx, P, pz + dz, B.FLOWER, 0); set(px + dx, P + 1, pz + dz, B.FLOWER, 0); }
      markOcc(px - 10, pz - 9, px + 12, pz + 14, 3, 1);
      landmarks.push({ id: 'platsani', name: '普拉察尼广场', en: 'Panagia Platsani · Main Square', x: px + 0.5, z: pz + 3.5, top: topT + 3, r: 22 });
      return { x: px, z: pz };
    }

    // --- Castle of Agios Nikolaos ruins on the NW headland
    function castle() {
      const cx = 147, cz = 29;
      platform(cx - 11, cz - 11, cx + 11, cz + 11, P, PV_B);
      const rub = [pal(0.6, 0.48, 0.4), pal(0.5, 0.4, 0.34), pal(0.68, 0.56, 0.46), pal(0.42, 0.34, 0.3), pal(0.74, 0.66, 0.56)];
      for (let dz = -10; dz <= 10; dz++) for (let dx = -10; dx <= 10; dx++) {
        const r = Math.hypot(dx, dz), ang = Math.atan2(dz, dx);
        if (r >= 7.0 && r <= 8.7) {
          if (Math.abs(wrapA(ang - 0)) < 0.28) continue;                      // gate (east)
          if (Math.abs(wrapA(ang - 2.4)) < 0.34) continue;                    // collapsed bay
          const hh = 3 + Math.floor(vn(ang * 3 + 7, r, 31) * 7) + (hash3(dx, 4, dz) < 0.3 ? 1 : 0);
          for (let y = 0; y < hh; y++) set(cx + dx, P + y, cz + dz, hash3(dx, y, dz) < 0.08 ? B.PLASTER : B.RUBBLE, hash3(dx, y, dz) < 0.08 ? WHITE : pick(rub));
        }
      }
      // keep (tower) at the NW corner
      const tx = cx - 6, tz = cz - 6;
      for (let dz = -5; dz <= 5; dz++) for (let dx = -5; dx <= 5; dx++) {
        const r = Math.hypot(dx, dz);
        if (r > 4.1 || r < 2.5) continue;
        const ang = Math.atan2(dz, dx);
        if (Math.abs(wrapA(ang - 0.8)) < 0.3) continue;
        const hh = 9 + Math.floor(vn(ang * 4 + 3, r, 33) * 6);
        for (let y = 0; y < hh; y++) set(tx + dx, P + y, tz + dz, B.RUBBLE, pick(rub));
        set(tx + dx, P + 5, tz + dz, hash3(dx, 5, dz) < 0.3 ? B.DARK : B.RUBBLE, 0);
      }
      for (let y = 0; y < 3; y++) set(tx - 3, P + 3 + y, tz, B.DARK, 0);
      fillBox(tx - 1, P, tz - 1, tx + 1, P, tz + 1, B.PAVE, PV_B);
      // inner stones, benches and fallen blocks
      for (let n = 0; n < 34; n++) {
        const a = R(0, 6.28), rr2 = R(8.9, 12.5), x = Math.round(cx + Math.cos(a) * rr2), z = Math.round(cz + Math.sin(a) * rr2);
        if (isAir(x, P, z)) { set(x, P, z, B.RUBBLE, pick(rub)); if (rnd() < 0.4) set(x, P + 1, z, B.RUBBLE, pick(rub)); }
      }
      for (const [dx, dz] of [[-2, 2], [-1, 2], [0, 2], [2, -2], [3, -2]]) set(cx + dx, P, cz + dz, B.STONE, STONE_C);
      flag(cx + 2, P, cz + 3, 9);
      markOcc(cx - 12, cz - 12, cx + 12, cz + 12, 3, 1);
      landmarks.push({ id: 'castle', name: '圣尼古拉斯城堡遗址', en: 'Castle of Agios Nikolaos · Sunset Point', x: cx + 0.5, z: cz + 0.5, top: P + 14, r: 18 });
    }
    function wrapA(a) { while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; return a; }

    // --- Windmills
    function windmill(cx, cz) {
      for (let y = 0; y < 12; y++) disc(cx, P + y, cz, 3.3 - y * 0.06, B.PLASTER, WHITE);
      disc(cx, P + 12, cz, 3.8, B.STONE, STONE_C);
      const xe = cx - Math.round(3.3 - 0.06 * 6);
      set(cx - 3, P, cz, B.DOOR, BLUE); set(cx - 3, P + 1, cz, B.DOOR, BLUE);
      set(xe, P + 6, cz, B.GLASS, 0); set(cx, P + 6, cz - 3, B.GLASS, 0); set(cx, P + 6, cz + 3, B.GLASS, 0);
      for (let j = 0; j < 6; j++) disc(cx, P + 13 + j, cz, Math.max(0.5, 3.7 - j * 0.65), B.THATCH, THATCH_C);
      set(cx, P + 19, cz, B.THATCH, THATCH_C);
      windmills.push({ x: cx + 0.5, z: cz + 0.5, hubX: cx + 0.5 - 4.0, hubY: P + 13.2, hubZ: cz + 0.5 });
      markOcc(cx - 5, cz - 5, cx + 5, cz + 5, 3, 1);
    }

    // --- Ammoudi fishing tavernas
    function ammoudiBuildings() {
      const xr = harbour.qx1 - 2;
      for (const [zz, w, d] of [[66, 6, 7], [79, 7, 7], [90, 6, 6]]) {
        const x0 = xr - w - 1 + (zz === 79 ? 0 : 1);
        if (house(x0, zz, w, d, 1, pick([[0.97, 0.97, 0.95], [0.93, 0.8, 0.55], [0.92, 0.7, 0.58]]), { tav: true, flat: true })) markOcc(x0, zz, x0 + w - 1, zz + d - 1, 3, 0);
      }
      // wooden pier with moored caiques
      const pz = 76, px1 = harbour.qx0, px0 = px1 - 22;
      harbour.pierZ = pz; harbour.pierX0 = px0;
      for (let x = px0; x <= px1; x++) for (let z = pz - 1; z <= pz + 1; z++) {
        set(x, QUAY - 1, z, B.WOOD, WOODC); walk[zi(x, z)] = 1; occ[zi(x, z)] = 3;
        if (x % 4 === 0 && z !== pz) for (let y = hm[zi(x, z)] > 11 ? 11 : hm[zi(x, z)]; y < QUAY - 1; y++) set(x, y, z, B.LOG, WOODC);
        if (x === px0 && z === pz) { for (let k = 0; k < 3; k++) set(x - 1, QUAY - 1 + k, pz, B.LOG, WOODC); }
      }
      for (let x = px0 + 3; x <= px1 - 3; x += 7) {
        moorings.push({ x: x + 0.5, z: pz - 3.2, yaw: Math.PI / 2, color: pick([0, 1, 2, 3]) });
        moorings.push({ x: x + 3.5, z: pz + 3.2, yaw: -Math.PI / 2, color: pick([0, 1, 2, 3]) });
      }
      moorings.push({ x: px0 - 4.5, z: pz + 0.5, yaw: Math.PI / 2, color: 2 });
      for (let z = harbour.z0 + 4; z <= harbour.z1 - 4; z += 6) lamp(harbour.qx0 + 3, z);
      markOcc(harbour.qx0 - 2, harbour.z0, harbour.qx1 + 2, harbour.z1, 3, 0);
      landmarks.push({ id: 'ammoudi', name: '阿穆迪湾', en: 'Ammoudi Bay', x: harbour.qx0 + 8.5, z: 80.5, top: QUAY + 4, r: 22 });
    }

    // ================= HOUSES =================
    function wallPattern(x, z, x0, z0, x1, z1, y0, floors, wallC, o) {
      const horiz = z === z0 || z === z1;
      const corner = (x === x0 || x === x1) && (z === z0 || z === z1);
      const i = horiz ? x - x0 : z - z0;
      const j = i - 1, m = (((j + o.ph) % 4) + 4) % 4;
      for (let fl = 0; fl < floors; fl++) for (let r = 0; r < 4; r++) {
        const y = y0 + fl * 4 + r;
        let id = B.PLASTER, c = wallC;
        if (!corner) {
          if (r === 1 || r === 2) {
            if (m === 1) {
              const doorSlot = fl === 0 && ((((j + o.ph) >> 2) + o.ph2) & 1) === 0;
              if (doorSlot && !o.tav) { id = B.DOOR; c = o.door; } else if (doorSlot && o.tav) { id = B.DARK; c = 0; } else { id = B.GLASS; c = 0; }
            } else if ((m === 0 || m === 2) && o.shut) { id = B.SHUTTER; c = o.shutC; }
          }
        }
        set(x, y, z, id, c);
      }
    }
    function cube(x0, z0, w, d, y0, floors, wallC, o) {
      const x1 = x0 + w - 1, z1 = z0 + d - 1, top = y0 + floors * 4;
      fillBox(x0, y0, z0, x1, top - 1, z1, B.PLASTER, wallC);
      for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++)
        if (x === x0 || x === x1 || z === z0 || z === z1) wallPattern(x, z, x0, z0, x1, z1, y0, floors, wallC, o);
      fillBox(x0, top, z0, x1, top, z1, B.PLASTER, wallC);
      for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++)
        if (x === x0 || x === x1 || z === z0 || z === z1) set(x, top + 1, z, B.PLASTER, wallC);
      return top;
    }
    function roofDeco(x0, z0, w, d, top, wallC, o) {
      const ix0 = x0 + 1, iz0 = z0 + 1, ix1 = x0 + w - 2, iz1 = z0 + d - 2, y = top + 1;
      if (ix1 - ix0 < 1 || iz1 - iz0 < 1) return;
      const r = rnd();
      if (r < 0.22) {              // pergola with blue/white awning
        const px0 = ix0, pz0 = iz0, px1 = Math.min(ix1, ix0 + 3), pz1 = Math.min(iz1, iz0 + 3);
        for (const [px, pz] of [[px0, pz0], [px1, pz0], [px0, pz1], [px1, pz1]]) for (let k = 0; k < 3; k++) set(px, y + k, pz, B.PLASTER, WOOD_W);
        for (let z = pz0; z <= pz1; z++) for (let x = px0; x <= px1; x++) set(x, y + 3, z, o.tav ? B.AWN_O : B.AWN_B, 0);
      } else if (r < 0.40) {       // loungers
        for (let k = 0; k < 2; k++) {
          const px = ix0 + k * 2; if (px > ix1) break;
          set(px, y, iz0, B.PLASTER, WHITE); if (iz0 + 1 <= iz1) set(px, y, iz0 + 1, B.PAVE, BLUE_L);
        }
      } else if (r < 0.54) {       // water tank + stair box
        set(ix1, y, iz1, B.DOME, BLUE); set(ix1, y + 1, iz1, B.DOME, BLUE);
        if (ix1 - 1 >= ix0) { set(ix1 - 1, y, iz1, B.DOME, BLUE); set(ix1 - 1, y + 1, iz1, B.DOME, BLUE); }
      } else if (r < 0.68) {       // bougainvillea planters on the parapet line
        for (let x = ix0; x <= ix1; x++) if (hash3(x, 8, z0) < 0.6) set(x, y, iz0, B.FLOWER, 0);
        for (let z = iz0; z <= iz1; z++) if (hash3(x0, 8, z) < 0.5) set(ix0, y, z, B.FLOWER, 0);
      } else if (r < 0.78 && w >= 6 && d >= 6) {  // small blue dome
        const cx = x0 + (w >> 1), cz = z0 + (d >> 1);
        drum(cx, y, cz, 1.8, 1, false);
        const t = dome(cx, y + 1, cz, 2.2, B.DOME, BLUE_D, 1.0);
        set(cx, t + 1, cz, B.PLASTER, WHITE); set(cx, t + 2, cz, B.PLASTER, WHITE);
      }
    }
    function house(x0, z0, w, d, floors, wallRGB, o) {
      o = o || {};
      const x1 = x0 + w - 1, z1 = z0 + d - 1;
      let sum = 0;
      for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) sum += hm[zi(x, z)];
      const b = Math.round(sum / (w * d));
      const wallC = pal(wallRGB);
      for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) {
        const h = hm[zi(x, z)];
        if (h < b) for (let y = h; y < b; y++) set(x, y, z, B.PLASTER, wallC);
        else if (h > b) for (let y = b; y < h; y++) set(x, y, z, B.AIR, 0);
        if (h !== b) { set(x, b - 1, z, B.PLASTER, wallC); }
      }
      const shutC = pal(pick(SHUTTERS));
      const oo = { ph: RI(0, 3), ph2: RI(0, 1), shut: rnd() < 0.55, shutC, door: pal(pick(SHUTTERS)), tav: !!o.tav };
      const stack = floors >= 2 && w >= 6 && d >= 6 && rnd() < 0.6;
      let top;
      if (stack) {
        top = cube(x0, z0, w, d, b, 1, wallC, oo);
        const ux0 = x0 + RI(1, 2), uz0 = z0 + RI(1, 2), uw = w - RI(2, 3), ud = d - RI(2, 3);
        const top2 = cube(ux0, uz0, uw, ud, top + 1, floors - 1, wallC, oo);
        roofDeco(x0, z0, w, d, top, wallC, oo);
        roofDeco(ux0, uz0, uw, ud, top2, wallC, oo);
        top = top2;
      } else {
        top = cube(x0, z0, w, d, b, floors, wallC, oo);
        roofDeco(x0, z0, w, d, top, wallC, oo);
      }
      if (o.tav) {
        for (let k = 0; k < d - 2; k++) for (let a = 1; a <= 2; a++) { if (isAir(x1 + a, b + 3, z0 + 1 + k)) set(x1 + a, b + 3, z0 + 1 + k, B.AWN_O, 0); }
        for (let k = 0; k < 3; k++) { const pz = z0 + 1 + k * 2; for (let y = 0; y < 3; y++) set(x1 + 3, b + y, Math.min(z1 - 1, pz), B.PLASTER, WOOD_W); }
      }
      for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) { occ[zi(x, z)] = 1; walk[zi(x, z)] = 0; hm[zi(x, z)] = Math.min(H - 1, b + 1); }
      if (!o.tav && rnd() < 0.45) {   // bougainvillea against a wall
        const side = RI(0, 3), n = RI(1, 3);
        for (let k = 0; k < n; k++) {
          const fx = side === 0 ? x0 - 1 : side === 1 ? x1 + 1 : x0 + 1 + k, fz = side === 2 ? z0 - 1 : side === 3 ? z1 + 1 : z0 + 1 + k;
          if (inb(fx, b, fz) && occ[zi(fx, fz)] === 0 && Math.abs(hm[zi(fx, fz)] - b) <= 0) { set(fx, b, fz, B.FLOWER, 0); if (rnd() < 0.6) set(fx, b + 1, fz, B.FLOWER, 0); }
        }
      }
      return true;
    }
    function vaultHouse(x0, z0, w, d, wallRGB) {
      const x1 = x0 + w - 1, z1 = z0 + d - 1;
      let sum = 0; for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) sum += hm[zi(x, z)];
      const b = Math.round(sum / (w * d)), wallC = pal(wallRGB), cx = (x0 + x1) / 2;
      for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) {
        const h = hm[zi(x, z)];
        if (h < b) for (let y = h; y < b; y++) set(x, y, z, B.PLASTER, wallC);
        else if (h > b) for (let y = b; y < h; y++) set(x, y, z, B.AIR, 0);
        const rr2 = w / 2, dx = x - cx, ah = Math.floor(Math.sqrt(Math.max(0, rr2 * rr2 - dx * dx)) * 0.95);
        for (let y = 0; y < 3 + ah; y++) set(x, b + y, z, B.PLASTER, wallC);
        occ[zi(x, z)] = 1; walk[zi(x, z)] = 0; hm[zi(x, z)] = Math.min(H - 1, b + 4 + ah);
      }
      const door = pal(pick(SHUTTERS)); const ph = RI(0, 2);
      for (let z = z0 + 1; z < z1; z++) {
        if ((z + ph) % 3 === 0) { set(x0, b, z, B.DOOR, door); set(x0, b + 1, z, B.DOOR, door); }
        else if ((z + ph) % 3 === 1) { set(x0, b + 1, z, B.GLASS, 0); set(x0, b + 2, z, B.GLASS, 0); }
      }
    }
    function chapel(x0, z0) {
      const w = 6, d = 8, x1 = x0 + w - 1, z1 = z0 + d - 1;
      let sum = 0; for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) sum += hm[zi(x, z)];
      const b = Math.round(sum / (w * d));
      for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) {
        const h = hm[zi(x, z)];
        if (h < b) for (let y = h; y < b; y++) set(x, y, z, B.PLASTER, WHITE); else for (let y = b; y < h; y++) set(x, y, z, B.AIR, 0);
        set(x, b - 1, z, B.PAVE, PV_A);
      }
      fillBox(x0, b, z0, x1, b + 4, z1, B.PLASTER, WHITE); fillBox(x0, b + 5, z0, x1, b + 5, z1, B.PLASTER, IVORY);
      set(x0, b, z0 + 3, B.DOOR, BLUE); set(x0, b + 1, z0 + 3, B.DOOR, BLUE); set(x0, b, z0 + 4, B.DOOR, BLUE); set(x0, b + 1, z0 + 4, B.DOOR, BLUE);
      for (const zz of [z0 + 1, z1 - 1]) { set(x0, b + 2, zz, B.GLASS, 0); set(x0, b + 3, zz, B.GLASS, 0); }
      drum(x0 + 3, b + 6, z0 + 4, 2.4, 1, false);
      const t = dome(x0 + 3, b + 7, z0 + 4, 2.7, B.DOME, BLUE_D, 1.0);
      cross(x0 + 3, t + 1, z0 + 4);
      fillBox(x0, b + 6, z0, x0, b + 8, z0 + 1, B.PLASTER, WHITE); set(x0, b + 7, z0, B.DARK, 0);
      for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) { occ[zi(x, z)] = 1; walk[zi(x, z)] = 0; hm[zi(x, z)] = Math.min(H - 1, b + 6); }
      return b;
    }
    function pool(x0, z0, w, d) {
      let sum = 0; for (let z = z0; z < z0 + d; z++) for (let x = x0; x < x0 + w; x++) sum += hm[zi(x, z)];
      const b = Math.round(sum / (w * d));
      for (let z = z0; z < z0 + d; z++) for (let x = x0; x < x0 + w; x++) {
        const edge = x === x0 || x === x0 + w - 1 || z === z0 || z === z0 + d - 1;
        roadCell(x, z, b, edge ? PV_A : PV_B);
        if (!edge) { set(x, b - 1, z, B.POOL, pal(0.30, 0.78, 0.92)); walk[zi(x, z)] = 0; }
      }
      for (let k = 0; k < 2; k++) { set(x0 + 1 + k * 2, b, z0, B.PLASTER, WHITE); set(x0 + 1 + k * 2, b, z0 + d - 1, B.PAVE, BLUE_L); }
      // parasol
      for (let k = 0; k < 3; k++) set(x0 + w - 1, b + k, z0, B.PLASTER, WOOD_W);
      for (let dz = 0; dz <= 1; dz++) for (let dx = -1; dx <= 0; dx++) set(x0 + w - 1 + dx, b + 3, z0 + dz, B.AWN_B, 0);
    }

    function canBuild(x0, z0, w, d, maxRange) {
      let mn = 99, mx = 0;
      for (let z = z0; z < z0 + d; z++) for (let x = x0; x < x0 + w; x++) {
        if (x < 2 || z < 2 || x >= W - 2 || z >= D - 2) return false;
        const i = zi(x, z);
        if (!town[i] || occ[i] !== 0) return false;
        const h = hm[i];
        if (h < 14) return false;
        if (h < mn) mn = h; if (h > mx) mx = h;
      }
      return mx - mn <= maxRange;
    }

    // --- build landmarks first so houses fill the gaps around them
    anastasis();
    const sq = platsani();
    castle();
    windmill(155, 41); windmill(167, 48); windmill(155, 57);
    ammoudiBuildings();
    landmarks.push({ id: 'windmills', name: '伊亚风车', en: 'Oia Windmills', x: 160.5, z: 48.5, top: P + 20, r: 18 });
    landmarks.push({ id: 'kameni', name: '新卡梅尼火山岛', en: 'Nea Kameni · Volcano', x: 64.5, z: 132.5, top: 38, r: 30 });
    landmarks.push({ id: 'thirassia', name: '提拉希亚岛', en: 'Thirassia', x: 20.5, z: 112.5, top: 48, r: 40 });

    // --- main town
    const houseCount = { n: 0, vault: 0, chapel: 0, pool: 0, small: 0 };
    for (let n = 0; n < 900 && houseCount.chapel < 8; n++) {          // blue-domed chapels
      const z = RI(46, 178), x = Math.round(XC(z)) + RI(14, 46);
      if (canBuild(x, z, 6, 8, 1)) { chapel(x, z); markOcc(x, z, x + 5, z + 7, 1, 1); houseCount.chapel++; }
    }
    for (let n = 0; n < 1200 && houseCount.pool < 9; n++) {           // infinity pools hanging over the caldera
      const z = RI(46, 176), x = Math.round(XC(z)) - RI(5, 24);
      if (canBuild(x, z, 6, 9, 6)) { pool(x, z, 6, 9); markOcc(x, z, x + 5, z + 8, 2, 1); houseCount.pool++; }
    }
    for (let z = 42; z <= 184; z++) for (let x = 90; x < W - 2; x++) {
      const i = zi(x, z);
      if (!town[i] || occ[i] !== 0 || hm[i] < 14) continue;
      const t = x - XC(z);
      const cliff = t < -1;
      let placed = false;
      for (let tries = 0; tries < 6 && !placed; tries++) {
        let w = RI(5, 10) - tries, d = RI(5, 10) - tries;
        if (w < 4) w = 4; if (d < 4) d = 4;
        if (!canBuild(x, z, w, d, cliff ? 5 : 3)) continue;
        const wallRGB = pick(FACADES);
        if (cliff && rnd() < 0.3) { vaultHouse(x, z, Math.max(5, w | 1), d, wallRGB); houseCount.vault++; }
        else {
          const nearEdge = t < 24;
          const floors = cliff ? RI(1, 2) : (nearEdge ? RI(1, 3) : RI(1, 2));
          house(x, z, w, d, floors, wallRGB);
        }
        houseCount.n++;
        markOcc(x, z, x + w - 1, z + d - 1, 1, 0);
        if (rnd() < 0.5) markOcc(x + w, z, x + w, z + d - 1, 2, 0);
        if (rnd() < 0.5) markOcc(x, z + d, x + w - 1, z + d, 2, 0);
        placed = true;
      }
    }

    // --- infill: small cubes in the leftover gaps
    for (let z = 42; z <= 184; z++) for (let x = 90; x < W - 2; x++) {
      const i = zi(x, z);
      if (!town[i] || occ[i] !== 0 || hm[i] < 14 || rnd() < 0.25) continue;
      for (let tries = 0; tries < 3; tries++) {
        const w = RI(3, 5), d = RI(3, 5);
        if (!canBuild(x, z, w, d, 4)) continue;
        house(x, z, w, d, RI(1, 2), pick(FACADES), { noDeco: true });
        markOcc(x, z, x + w - 1, z + d - 1, 1, 0);
        houseCount.small++;
        break;
      }
    }

    // --- tiny dotted houses along Thirassia's rim (distant backdrop)
    for (let z = 40; z <= 186; z += 5) {
      let bx = -1, bh = 0;
      for (let x = 4; x <= 34; x++) if (hm[zi(x, z)] > bh) { bh = hm[zi(x, z)]; bx = x; }
      if (bh < 38 || rnd() < 0.3) continue;
      const x0 = bx + RI(-1, 2), z0 = z;
      let mx = 0; for (let zz = z0; zz < z0 + 3; zz++) for (let xx = x0; xx < x0 + 3; xx++) mx = Math.max(mx, hm[zi(xx, zz)]);
      fillBox(x0, hm[zi(x0, z0)] - 1, z0, x0 + 2, mx + 1, z0 + 2, B.PLASTER, WHITE);
      if (rnd() < 0.25) dome(x0 + 1, mx + 2, z0 + 1, 1.6, B.DOME, BLUE_D, 1.0);
    }

    // ================= decorations =================
    for (let z = 30; z <= 184; z += 9) lamp(Math.round(XC(z) + 5.2), z);
    for (const zl of [38, 56, 124, 152, 174]) for (let x = Math.round(XC(zl)) + 3; x < Math.round(XC(zl)) + 36; x += 9) lamp(x, zl + 2);

    // cypress / olive trees around the squares and edges of town
    function tree(x, z, tall) {
      const y0 = hm[zi(x, z)];
      if (get(x, y0, z) !== B.AIR || occ[zi(x, z)] === 1) return;
      for (let y = 0; y < tall; y++) set(x, y0 + y, z, B.LOG, pal(0.38, 0.3, 0.22));
      const lc = [pal(0.22, 0.38, 0.22), pal(0.28, 0.44, 0.26), pal(0.34, 0.46, 0.28)];
      for (let dy = 0; dy < tall - 1; dy++) {
        const r = dy < tall / 2 ? 1.2 : 0.6;
        for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++)
          if (dx * dx + dz * dz <= r * r + 0.2 && isAir(x + dx, y0 + 1 + dy, z + dz)) set(x + dx, y0 + 1 + dy, z + dz, B.LEAF, pick(lc));
      }
    }
    for (let n = 0; n < 7; n++) tree(sq.x - 9 + n * 3, sq.z - 9, RI(5, 7));
    // dry scrub and rocks outside of town
    const bush = [pal(0.42, 0.5, 0.3), pal(0.48, 0.54, 0.32), pal(0.36, 0.46, 0.28), pal(0.55, 0.52, 0.3)];
    for (let z = 4; z < D - 4; z++) for (let x = 4; x < W - 4; x++) {
      const i = zi(x, z);
      if (kind[i] !== 1 || occ[i] !== 0 || hm[i] < 15 || hm[i] > P + 1) continue;
      if (town[i] && hash3(x, 13, z) > 0.1) continue;
      const rr0 = hash3(x, 17, z);
      if (rr0 < 0.014) {
        const y0 = hm[i];
        if (!isAir(x, y0, z)) continue;
        set(x, y0, z, B.LEAF, pick(bush));
        if (rr0 < 0.006) set(x, y0 + 1, z, B.LEAF, pick(bush));
        if (rr0 < 0.003) { set(x + 1, y0, z, B.LEAF, pick(bush)); }
      } else if (rr0 > 0.992 && kind[i] === 1) {
        const y0 = hm[i];
        if (isAir(x, y0, z)) set(x, y0, z, B.ROCK, strata(x, y0, z, false));
      }
    }

    // ---- parapets along every exposed road edge ----
    const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    for (let z = 2; z < D - 2; z++) for (let x = 2; x < W - 2; x++) {
      const i = zi(x, z), hp = roadH[i];
      if (!hp) continue;
      for (const [dx, dz] of N4) {
        const nx = x + dx, nz = z + dz, ni = zi(nx, nz);
        if (roadH[ni] || occ[ni] === 1 || occ[ni] === 3 && hm[ni] > hp) continue;
        const nh = hm[ni];
        if (nh >= hp) continue;
        if (walk[ni] && !roadH[ni]) continue;
        const tall = hp - nh > 4;
        for (let y = nh; y <= hp; y++) set(nx, y, nz, tall && y < hp - 1 ? B.RUBBLE : B.PLASTER, tall && y < hp - 1 ? pal(0.66, 0.62, 0.58) : WHITE);
        hm[ni] = hp + 1; occ[ni] = Math.max(occ[ni], 2);
        if (hash3(nx, 6, nz) < 0.18) parapets.push([nx + 0.5, hp + 1, nz + 0.5]);
      }
    }

    // ================= derived data =================
    const topH = new Uint8Array(W * D), topB = new Uint8Array(W * D), topC = new Uint8Array(W * D);
    for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
      for (let y = H - 1; y >= 0; y--) {
        const b = blocks[idx(x, y, z)];
        if (b) { topH[zi(x, z)] = y + 1; topB[zi(x, z)] = b; topC[zi(x, z)] = cols[idx(x, y, z)]; break; }
      }
    }


    return {
      W, D, H, BASE: P, GY: P, WATER_Y, QUAY, blocks, cols, palette, pal, get, set, idx, inb, B, BI,
      hm, walk, occ, land: null, topH, topB, topC, landmarks, lamps, flags, windmills, poles, parapets, moorings,
      donkeyPath, harbour, XC, ZN, ZS, XE, town, houseCount
    };
  }

  root.SantoriniWorld = { W, D, H, P, WATER_Y, B, BI, T, create, hash3, mulberry32, XC, ZN, XE };
  if (typeof module !== 'undefined') module.exports = root.SantoriniWorld;
})(typeof window !== 'undefined' ? window : globalThis);
