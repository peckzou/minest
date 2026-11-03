/* Venice Voxel World — procedural generator (no DOM / no THREE dependency).
 * Exposes global VeniceWorld = { W, D, H, B, BI, T, create(seed) }.
 * Coordinates: x east, z south, y up. Cell (x,y,z) occupies [x,x+1)×[y,y+1)×[z,z+1).
 */
(function (root) {
  'use strict';

  const W = 224, D = 192, H = 96;
  const GY = 4;            // top block of dry land
  const BASE = GY + 1;     // first free air cell above land
  const WATER_Y = 3.85;    // water surface height

  // ---- tiles & blocks -------------------------------------------------
  const T = {
    sand: 0, wall: 1, pave: 2, plaster: 3, stone: 4, brick: 5, roof: 6, planks: 7,
    glass: 8, shutter: 9, gold: 10, dome: 11, diamond: 12, dark: 13, lamp: 14,
    leaf: 15, log: 16, mosaic: 17, door: 18, flower: 19, awnR: 20, awnB: 21, clock: 22
  };
  const B = {
    AIR: 0, SAND: 1, WALL: 2, PAVE: 3, PLASTER: 4, STONE: 5, BRICK: 6, ROOF: 7, WOOD: 8,
    GLASS: 9, SHUTTER: 10, GOLD: 11, DOME: 12, DIAMOND: 13, DARK: 14, LAMP: 15, LEAF: 16,
    LOG: 17, MOSAIC: 18, DOOR: 19, FLOWER: 20, AWN_R: 21, AWN_B: 22, CLOCK: 23
  };
  const BI = [];
  function def(id, name, top, side, bottom, glow, jit) {
    BI[id] = { name, top, side, bottom: bottom == null ? side : bottom, glow: !!glow, jit: jit == null ? 0.10 : jit };
  }
  def(B.AIR, 'air', 0, 0);
  def(B.SAND, 'sand', T.sand, T.sand, T.sand, false, 0.12);
  def(B.WALL, 'wall', T.wall, T.wall);
  def(B.PAVE, 'pave', T.pave, T.wall, T.wall, false, 0.07);
  def(B.PLASTER, 'plaster', T.plaster, T.plaster, T.plaster, false, 0.06);
  def(B.STONE, 'stone', T.stone, T.stone, T.stone, false, 0.05);
  def(B.BRICK, 'brick', T.brick, T.brick, T.brick, false, 0.08);
  def(B.ROOF, 'roof', T.roof, T.roof, T.roof, false, 0.10);
  def(B.WOOD, 'wood', T.planks, T.planks, T.planks, false, 0.08);
  def(B.GLASS, 'glass', T.glass, T.glass, T.glass, true, 0);
  def(B.SHUTTER, 'shutter', T.shutter, T.shutter, T.shutter, false, 0.06);
  def(B.GOLD, 'gold', T.gold, T.gold, T.gold, false, 0.04);
  def(B.DOME, 'dome', T.dome, T.dome, T.dome, false, 0.05);
  def(B.DIAMOND, 'diamond', T.diamond, T.diamond, T.diamond, false, 0.03);
  def(B.DARK, 'dark', T.dark, T.dark, T.dark, false, 0.04);
  def(B.LAMP, 'lamp', T.lamp, T.lamp, T.lamp, true, 0);
  def(B.LEAF, 'leaf', T.leaf, T.leaf, T.leaf, false, 0.16);
  def(B.LOG, 'log', T.log, T.log, T.log, false, 0.08);
  def(B.MOSAIC, 'mosaic', T.mosaic, T.mosaic, T.mosaic, false, 0.03);
  def(B.DOOR, 'door', T.door, T.door, T.door, false, 0.05);
  def(B.FLOWER, 'flower', T.flower, T.flower, T.flower, false, 0.10);
  def(B.AWN_R, 'awning', T.awnR, T.awnR, T.awnR, false, 0.04);
  def(B.AWN_B, 'awning', T.awnB, T.awnB, T.awnB, false, 0.04);
  def(B.CLOCK, 'clock', T.clock, T.clock, T.clock, false, 0.02);

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
  function inPoly(x, z, poly) {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const xi = poly[i][0], zi = poly[i][1], xj = poly[j][0], zj = poly[j][1];
      if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) inside = !inside;
    }
    return inside;
  }
  function segDist(px, pz, ax, az, bx, bz) {
    const dx = bx - ax, dz = bz - az;
    const l2 = dx * dx + dz * dz;
    let t = l2 ? ((px - ax) * dx + (pz - az) * dz) / l2 : 0;
    t = Math.max(0, Math.min(1, t));
    const qx = ax + t * dx, qz = az + t * dz;
    return Math.hypot(px - qx, pz - qz);
  }

  // ---- layout data ----------------------------------------------------
  const MAIN_POLY = [[20, 24], [60, 18], [100, 16], [140, 20], [172, 32], [198, 52], [210, 80], [212, 120],
    [212, 138], [126, 138], [114, 142], [112, 150], [100, 152], [90, 144], [60, 130], [36, 118], [22, 98],
    [12, 68], [14, 40]];
  const GIUDECCA_POLY = [[30, 164], [70, 160], [120, 162], [150, 166], [156, 174], [100, 178], [50, 176], [28, 172]];
  const GIORGIO_POLY = [[160, 152], [192, 150], [194, 172], [160, 172]];

  const GRAND_CANAL = [[118, 156], [117, 134], [110, 122], [98, 114], [90, 104], [90, 76], [80, 62],
    [62, 52], [46, 44], [28, 38], [12, 34]];
  const GC_RADIUS = 5;
  // [x1,z1,x2,z2,width(odd)]  — axis aligned secondary canals ("rii")
  const RII = [
    [8, 57, 71, 57, 3], [56, 49, 56, 10, 3], [86, 70, 164, 70, 5], [125, 70, 125, 10, 3],
    [164, 70, 164, 10, 3], [164, 70, 220, 70, 3], [196, 70, 196, 150, 3], [14, 100, 86, 100, 3],
    [60, 100, 60, 142, 3], [36, 57, 36, 124, 3], [100, 70, 100, 10, 3]
  ];

  const FACADES = [
    [0.88, 0.66, 0.36], [0.82, 0.46, 0.33], [0.92, 0.62, 0.52], [0.90, 0.72, 0.70], [0.93, 0.88, 0.72],
    [0.93, 0.82, 0.52], [0.76, 0.36, 0.28], [0.86, 0.84, 0.80], [0.76, 0.82, 0.72], [0.90, 0.58, 0.30],
    [0.84, 0.74, 0.55]
  ];
  const ROOFS = [[0.78, 0.36, 0.22], [0.72, 0.32, 0.20], [0.82, 0.42, 0.26], [0.68, 0.30, 0.22]];
  const SHUTTERS = [[0.20, 0.45, 0.30], [0.18, 0.40, 0.28], [0.25, 0.30, 0.45], [0.35, 0.25, 0.18], [0.16, 0.35, 0.32]];

  // ---- world creation -------------------------------------------------
  function create(seed) {
    seed = seed == null ? 1597 : seed;
    const rnd = mulberry32(seed);
    const R = (a, b) => a + rnd() * (b - a);
    const RI = (a, b) => Math.floor(R(a, b + 1));
    const pick = (a) => a[Math.floor(rnd() * a.length)];

    const blocks = new Uint8Array(W * H * D);
    const cols = new Uint8Array(W * H * D);
    const idx = (x, y, z) => x + W * (z + D * y);
    const inb = (x, y, z) => x >= 0 && x < W && y >= 0 && y < H && z >= 0 && z < D;
    const get = (x, y, z) => (inb(x, y, z) ? blocks[idx(x, y, z)] : (y < 0 ? B.SAND : 0));
    const set = (x, y, z, id, c) => {
      if (!inb(x, y, z)) return;
      const i = idx(x, y, z); blocks[i] = id; cols[i] = c || 0;
    };
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
          for (let x = Math.max(0, x0); x <= Math.min(W - 1, x1); x++) {
            const i = idx(x, y, z); blocks[i] = id; cols[i] = c || 0;
          }
    }
    function isAir(x, y, z) { return get(x, y, z) === B.AIR; }

    // ---------- land, canals ----------
    const land = new Uint8Array(W * D);
    const gcMask = new Uint8Array(W * D);
    const riMask = new Uint8Array(W * D);
    const zone = new Uint8Array(W * D);   // 1 = piazza pattern, 2 = marble floor
    const occ = new Uint8Array(W * D);    // 0 free, 1 building, 2 street/reserved, 3 landmark
    const zi = (x, z) => x + W * z;

    for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
      if (inPoly(x, z, MAIN_POLY) || inPoly(x, z, GIUDECCA_POLY) || inPoly(x, z, GIORGIO_POLY)) land[zi(x, z)] = 1;
    }
    for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
      for (let i = 0; i < GRAND_CANAL.length - 1; i++) {
        const a = GRAND_CANAL[i], b = GRAND_CANAL[i + 1];
        if (segDist(x, z, a[0], a[1], b[0], b[1]) <= GC_RADIUS + 0.001) { gcMask[zi(x, z)] = 1; break; }
      }
      for (const c of RII) {
        if (segDist(x, z, c[0], c[1], c[2], c[3]) <= (c[4] - 1) / 2 + 0.001) { riMask[zi(x, z)] = 1; break; }
      }
      if (gcMask[zi(x, z)] || riMask[zi(x, z)]) land[zi(x, z)] = 0;
    }
    // Piazza floor zones
    const zoneRects = [
      [1, 112, 94, 160, 111], [1, 149, 112, 160, 137], [1, 130, 112, 148, 118], [1, 130, 136, 205, 137],
      [2, 161, 116, 193, 136], [2, 130, 120, 148, 136], [1, 161, 114, 188, 115], [2, 112, 84, 160, 93],
      [2, 112, 112, 132, 119], [2, 104, 94, 111, 110]
    ];
    for (const r of zoneRects) for (let z = r[2]; z <= r[4]; z++) for (let x = r[1]; x <= r[3]; x++) zone[zi(x, z)] = r[0];

    // distance to water (Manhattan)
    const dist = new Uint8Array(W * D).fill(255);
    const q = [];
    for (let i = 0; i < W * D; i++) if (!land[i]) { dist[i] = 0; q.push(i); }
    for (let h = 0; h < q.length; h++) {
      const i = q[h], x = i % W, z = (i / W) | 0, d = dist[i];
      if (x > 0 && dist[i - 1] > d + 1) { dist[i - 1] = d + 1; q.push(i - 1); }
      if (x < W - 1 && dist[i + 1] > d + 1) { dist[i + 1] = d + 1; q.push(i + 1); }
      if (z > 0 && dist[i - W] > d + 1) { dist[i - W] = d + 1; q.push(i - W); }
      if (z < D - 1 && dist[i + W] > d + 1) { dist[i + W] = d + 1; q.push(i + W); }
    }
    // distance to Grand Canal only (for palazzi heights)
    const distGC = new Uint8Array(W * D).fill(255);
    const q2 = [];
    for (let i = 0; i < W * D; i++) if (gcMask[i]) { distGC[i] = 0; q2.push(i); }
    for (let h = 0; h < q2.length; h++) {
      const i = q2[h], x = i % W, z = (i / W) | 0, d = distGC[i];
      if (d >= 40) continue;
      if (x > 0 && distGC[i - 1] > d + 1) { distGC[i - 1] = d + 1; q2.push(i - 1); }
      if (x < W - 1 && distGC[i + 1] > d + 1) { distGC[i + 1] = d + 1; q2.push(i + 1); }
      if (z > 0 && distGC[i - W] > d + 1) { distGC[i - W] = d + 1; q2.push(i - W); }
      if (z < D - 1 && distGC[i + W] > d + 1) { distGC[i + W] = d + 1; q2.push(i + W); }
    }

    // ---------- ground voxels ----------
    const C_SAND = pal(0.80, 0.74, 0.56), C_W1 = pal(0.42, 0.42, 0.46), C_W2 = pal(0.38, 0.5, 0.4);
    const C_STREET = pal(0.74, 0.70, 0.64), C_PZ_LINE = pal(0.92, 0.90, 0.85), C_PZ_A = pal(0.62, 0.62, 0.62),
      C_PZ_B = pal(0.70, 0.68, 0.64), C_MARBLE_A = pal(0.88, 0.80, 0.74), C_MARBLE_B = pal(0.80, 0.70, 0.64);
    for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
      set(x, 0, z, B.SAND, C_SAND);
      if (!land[zi(x, z)]) continue;
      set(x, 1, z, B.WALL, C_W1); set(x, 2, z, B.WALL, C_W1); set(x, 3, z, B.WALL, C_W2);
      let c = C_STREET;
      const zn = zone[zi(x, z)];
      if (zn === 1) {
        const a = (x + z) % 8, b = (((x - z) % 8) + 8) % 8;
        c = (a === 0 || b === 0) ? C_PZ_LINE : (((x >> 2) + (z >> 2)) & 1 ? C_PZ_A : C_PZ_B);
      } else if (zn === 2) {
        c = ((x + z) & 1) ? C_MARBLE_A : C_MARBLE_B;
      }
      set(x, GY, z, B.PAVE, c);
    }

    const markOcc = (x0, z0, x1, z1, v, margin) => {
      margin = margin || 0;
      for (let z = z0 - margin; z <= z1 + margin; z++) for (let x = x0 - margin; x <= x1 + margin; x++)
        if (x >= 0 && x < W && z >= 0 && z < D) { if (occ[zi(x, z)] < v) occ[zi(x, z)] = v; }
    };

    // ---------- generic helpers ----------
    const C_STONE = pal(0.93, 0.91, 0.86), C_WHITE = pal(0.97, 0.96, 0.93), C_GOLD = pal(1, 1, 1);
    const C_LEAD = pal(0.62, 0.65, 0.68), C_DARK = pal(0.4, 0.4, 0.42), C_COPPER = pal(0.40, 0.72, 0.60);

    function dome(cx, cy, cz, Rr, id, c, hRatio) {
      hRatio = hRatio || 1.3;
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
    function drum(cx, cy, cz, Rr, h, windows) {
      const ri = Math.ceil(Rr);
      for (let j = 0; j < h; j++)
        for (let dz = -ri; dz <= ri; dz++) for (let dx = -ri; dx <= ri; dx++) {
          const d = Math.hypot(dx, dz);
          if (d > Rr + 0.5) continue;
          let id = B.STONE, c = C_STONE;
          if (windows && d > Rr - 0.7 && j === Math.floor(h / 2)) {
            const ang = Math.atan2(dz, dx) / (Math.PI * 2) + 0.5;
            if (Math.floor(ang * 16) % 2 === 0) { id = B.GLASS; c = 0; }
          }
          set(cx + dx, cy + j, cz + dz, id, c);
        }
    }
    function spire(x, y, z, h, tip) {
      for (let j = 0; j < h; j++) set(x, y + j, z, B.STONE, C_WHITE);
      if (tip) { set(x, y + h, z, B.GOLD, 0); }
    }

    // ----- generic Venetian house -----
    function house(x0, z0, w, d, floors, wallC, roofC, opt) {
      opt = opt || {};
      const x1 = x0 + w - 1, z1 = z0 + d - 1;
      const wallCol = pal(wallC), stoneCol = pal(opt.trim || [0.94, 0.92, 0.87]), roofCol = pal(roofC);
      const shutCol = pal(opt.shutter || pick(SHUTTERS));
      const doorCol = pal(0.30, 0.20, 0.14);
      const top = BASE + floors * 5;
      const ph = RI(0, 3), ph2 = RI(0, 1);
      fillBox(x0, BASE, z0, x1, top - 1, z1, B.PLASTER, wallCol);
      for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) {
        const onEdge = x === x0 || x === x1 || z === z0 || z === z1;
        if (!onEdge) continue;
        const corner = (x === x0 || x === x1) && (z === z0 || z === z1);
        const horiz = z === z0 || z === z1;
        const ox = x === x0 ? -1 : (x === x1 ? 1 : 0), oz = z === z0 ? -1 : (z === z1 ? 1 : 0);
        const i = horiz ? x - x0 : z - z0, len = horiz ? w : d;
        const j = i - 1, m = (((j + ph) % 4) + 4) % 4;
        for (let fl = 0; fl < floors; fl++) for (let r = 0; r < 5; r++) {
          const y = BASE + fl * 5 + r;
          let id = B.PLASTER, c = wallCol;
          if (corner || r === 0) { id = B.STONE; c = stoneCol; }
          else if (!corner) {
            if (r === 1 || r === 2) {
              if (m === 1) {
                const doorSlot = fl === 0 && ((((j + ph) >> 2) + ph2) & 1) === 0;
                if (doorSlot) { id = B.DOOR; c = doorCol; } else { id = B.GLASS; c = 0; }
              } else if (m === 0 || m === 2) { id = B.SHUTTER; c = shutCol; }
            } else if (r === 3 && m === 1) { id = B.STONE; c = stoneCol; }
          }
          set(x, y, z, id, c);
          if (!corner && m === 1 && id === B.GLASS && r === 1 && fl >= 1) {
            const fx = x + ox, fz = z + oz;
            if (rnd() < 0.2 && isAir(fx, y, fz)) set(fx, y, fz, B.FLOWER, 0);
          }
          if (!corner && m === 1 && r === 0 && fl === 1 && rnd() < 0.22) {
            const fx = x + ox, fz = z + oz;
            if (isAir(fx, y, fz)) set(fx, y, fz, B.STONE, stoneCol);
          }
        }
      }
      // roof
      if (opt.flat) {
        fillBox(x0, top, z0, x1, top, z1, B.STONE, stoneCol);
        for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++)
          if ((x === x0 || x === x1 || z === z0 || z === z1) && ((x + z) % 2 === 0)) set(x, top + 1, z, B.STONE, stoneCol);
        return top + 1;
      }
      const gable = opt.gable != null ? opt.gable : rnd() < 0.4;
      let ridgeTop = top;
      if (!gable || Math.min(w, d) < 4) {
        for (let k = 0; ; k++) {
          const ax0 = x0 + k, ax1 = x1 - k, az0 = z0 + k, az1 = z1 - k;
          if (ax0 > ax1 || az0 > az1) break;
          fillBox(ax0, top + k, az0, ax1, top + k, az1, B.ROOF, roofCol);
          ridgeTop = top + k;
        }
      } else {
        const alongX = w >= d;
        const a0 = alongX ? z0 : x0, a1 = alongX ? z1 : x1;
        for (let k = 0; ; k++) {
          const c0 = a0 + k, c1 = a1 - k;
          if (c0 > c1) break;
          for (let c = c0; c <= c1; c++) {
            const edge = c === c0 || c === c1;
            if (alongX) {
              fillBox(x0, top + k, c, x1, top + k, c, B.ROOF, roofCol);
              if (!edge) { set(x0, top + k, c, B.PLASTER, wallCol); set(x1, top + k, c, B.PLASTER, wallCol); }
            } else {
              fillBox(c, top + k, z0, c, top + k, z1, B.ROOF, roofCol);
              if (!edge) { set(c, top + k, z0, B.PLASTER, wallCol); set(c, top + k, z1, B.PLASTER, wallCol); }
            }
          }
          ridgeTop = top + k;
        }
      }
      // chimney with flared top
      if (!opt.noChimney && rnd() < 0.55 && w >= 4 && d >= 4) {
        const cx = RI(x0 + 1, x1 - 1), cz = RI(z0 + 1, z1 - 1);
        let k = 0; for (; k < 20; k++) if (get(cx, top + k + 1, cz) === B.AIR) break;
        const yb = top + k + 1;
        const bc = pal(0.72, 0.42, 0.34);
        for (let j = 0; j < 3; j++) set(cx, yb + j, cz, B.BRICK, bc);
        set(cx, yb + 3, cz, B.STONE, stoneCol);
        for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (isAir(cx + dx, yb + 3, cz + dz)) set(cx + dx, yb + 3, cz + dz, B.STONE, stoneCol);
        set(cx, yb + 4, cz, B.DARK, 0);
      }
      return ridgeTop;
    }

    // ----- arcade overlay on ground floor, side: 'N','S','E','W' (the facade facing outward) -----
    function arcade(x0, z0, x1, z1, side, galleryDepth) {
      galleryDepth = galleryDepth || 3;
      const horiz = side === 'N' || side === 'S';
      const len = horiz ? (x1 - x0 + 1) : (z1 - z0 + 1);
      const dirx = side === 'W' ? 1 : side === 'E' ? -1 : 0, dirz = side === 'N' ? 1 : side === 'S' ? -1 : 0;
      for (let i = 0; i < len; i++) {
        const fx = horiz ? x0 + i : (side === 'W' ? x0 : x1);
        const fz = horiz ? (side === 'N' ? z0 : z1) : z0 + i;
        const column = i % 4 === 0 || i === len - 1;
        for (let y = BASE; y < BASE + 5; y++) {
          const r = y - BASE;
          let open = false;
          if (!column) { if (r <= 2) open = true; else if (r === 3 && i % 4 === 2) open = true; }
          if (open) set(fx, y, fz, B.AIR, 0);
          else set(fx, y, fz, B.STONE, C_STONE);
        }
        if (i >= 1 && i <= len - 2) {
          for (let k = 1; k <= galleryDepth; k++)
            for (let y = BASE; y <= BASE + 3; y++) set(fx + dirx * k, y, fz + dirz * k, B.AIR, 0);
        }
        // lintel/ceiling row above gallery already stone (r=4)
      }
    }

    // ================= LANDMARKS =================
    const landmarks = [];
    const lamps = [];
    function lamp(x, z, y0) {
      y0 = y0 == null ? BASE : y0;
      if (!isAir(x, y0, z) || get(x, y0 - 1, z) === B.AIR) return;
      set(x, y0, z, B.DARK, 0); set(x, y0 + 1, z, B.DARK, 0); set(x, y0 + 2, z, B.LAMP, 0);
      lamps.push([x + 0.5, y0 + 2.5, z + 0.5]);
    }

    // --- Campanile di San Marco ---
    function campanile() {
      const cx = 147, cz = 114, x0 = cx - 3, x1 = cx + 3, z0 = cz - 3, z1 = cz + 3;
      const brick = pal(0.80, 0.42, 0.30), brickD = pal(0.68, 0.34, 0.26), white = C_WHITE;
      fillBox(x0, BASE, z0, x1, BASE + 43, z1, B.BRICK, brick);
      // base loggia-style stone plinth
      fillBox(x0 - 1, BASE, z0 - 1, x1 + 1, BASE + 5, z1 + 1, B.STONE, C_STONE);
      for (let y = BASE; y <= BASE + 3; y++) for (const [dx, dz] of [[0, -4], [0, 4], [-4, 0], [4, 0]]) {
        for (let k = -1; k <= 1; k++) {
          const px = cx + (dz ? k : dx), pz = cz + (dz ? dz : k);
          if (y <= BASE + 2) set(px, y, pz, B.DARK, 0);
        }
      }
      // pilaster corners + slits
      for (let y = BASE + 6; y <= BASE + 43; y++) {
        for (const [px, pz] of [[x0, z0], [x0, z1], [x1, z0], [x1, z1]]) set(px, y, pz, B.BRICK, brickD);
        if ((y - BASE) % 10 === 6 || (y - BASE) % 10 === 7) {
          for (const [px, pz] of [[cx, z0], [cx, z1], [x0, cz], [x1, cz]]) set(px, y, pz, B.DARK, 0);
        }
        if ((y - BASE) % 14 === 0) for (let k = x0; k <= x1; k++) {
          set(k, y, z0, B.STONE, C_STONE); set(k, y, z1, B.STONE, C_STONE);
          set(x0, y, z0 + k - x0, B.STONE, C_STONE); set(x1, y, z0 + k - x0, B.STONE, C_STONE);
        }
      }
      // belfry (hollow with arched openings)
      const by = BASE + 44;
      fillBox(x0, by, z0, x1, by + 5, z1, B.STONE, white);
      fillBox(x0 + 1, by, z0 + 1, x1 - 1, by + 4, z1 - 1, B.AIR, 0);
      for (let y = by; y <= by + 3; y++) {
        const half = y === by + 3 ? 0 : 1;
        for (let k = -half; k <= half; k++) {
          set(cx + k, y, z0, B.AIR, 0); set(cx + k, y, z1, B.AIR, 0);
          set(x0, y, cz + k, B.AIR, 0); set(x1, y, cz + k, B.AIR, 0);
        }
      }
      set(cx, by, cz, B.STONE, white);
      set(cx, by + 1, cz, B.GOLD, 0); set(cx, by + 2, cz, B.GOLD, 0);
      // cell with lion reliefs
      const cy = by + 6;
      fillBox(x0 + 1, cy, z0 + 1, x1 - 1, cy + 2, z1 - 1, B.STONE, white);
      for (const [px, pz] of [[cx, z0 + 1], [cx, z1 - 1], [x0 + 1, cz], [x1 - 1, cz]]) set(px, cy + 1, pz, B.GOLD, 0);
      // balustrade ring at cy-1 is the belfry roof top; spire
      let y = cy + 3; let half = 2;
      for (let k = 0; k < 2; k++) { fillBox(cx - half, y, cz - half, cx + half, y, cz + half, B.DOME, C_COPPER); y++; }
      half = 1;
      for (let k = 0; k < 3; k++) { fillBox(cx - half, y, cz - half, cx + half, y, cz + half, B.DOME, C_COPPER); y++; }
      for (let k = 0; k < 4; k++) { set(cx, y, cz, B.DOME, C_COPPER); y++; }
      set(cx, y, cz, B.GOLD, 0); set(cx - 1, y + 1, cz, B.GOLD, 0); set(cx + 1, y + 1, cz, B.GOLD, 0); set(cx, y + 1, cz, B.GOLD, 0);
      set(cx, y + 2, cz, B.GOLD, 0);
      markOcc(x0 - 1, z0 - 1, x1 + 1, z1 + 1, 3, 1);
      landmarks.push({ id: 'campanile', name: '圣马可钟楼', en: 'Campanile', x: cx + 0.5, z: cz + 0.5, top: y + 3, r: 14 });
    }

    // --- Basilica San Marco ---
    function basilica() {
      const x0 = 161, x1 = 188, z0 = 93, z1 = 113;
      const stoneC = pal(0.91, 0.86, 0.76), gold = 0, lead = pal(0.66, 0.70, 0.72);
      fillBox(x0, BASE, z0, x1, BASE + 11, z1, B.STONE, stoneC);
      fillBox(x0, BASE + 12, z0, x1, BASE + 12, z1, B.DOME, lead);
      // facade portals (x = x0)
      const portals = [[94, 96], [98, 100], [102, 104], [106, 108], [110, 112]];
      portals.forEach((p, n) => {
        const center = n === 2;
        for (let z = p[0]; z <= p[1]; z++) {
          for (let y = BASE; y <= BASE + 3; y++) set(x0, y, z, B.DARK, 0);
          set(x0, BASE + 4, z, B.GOLD, gold);
        }
        set(x0, BASE + 5, (p[0] + p[1]) / 2, B.GOLD, gold);
        if (center) {
          for (let z = p[0]; z <= p[1]; z++) set(x0, BASE + 5, z, B.GOLD, gold);
          set(x0, BASE + 6, (p[0] + p[1]) / 2, B.GOLD, gold);
          for (let y = BASE + 4; y <= BASE + 6; y++) { set(x0, y, p[0] - 1, B.GOLD, gold); set(x0, y, p[1] + 1, B.GOLD, gold); }
        }
        // upper lunette
        const cz = (p[0] + p[1]) / 2;
        const hw = center ? 2 : 1;
        for (let y = BASE + 8; y <= BASE + 10; y++) for (let z = cz - hw; z <= cz + hw; z++) set(x0, y, z, B.GOLD, gold);
        set(x0, BASE + 11, cz, B.GOLD, gold);
        if (center) { for (let z = cz - 1; z <= cz + 1; z++) set(x0, BASE + 11, z, B.GOLD, gold); }
      });
      for (let z = z0; z <= z1; z++) { set(x0, BASE + 6, z, B.MOSAIC, 0); set(x0, BASE + 7, z, B.MOSAIC, 0); }

      // columns in front of piers
      for (const z of [93, 97, 101, 105, 109, 113]) {
        for (let y = BASE; y <= BASE + 4; y++) set(x0 - 1, y, z, B.STONE, C_WHITE);
        set(x0 - 1, BASE + 5, z, B.STONE, C_STONE);
      }
      // balcony with quadriga
      for (let z = 101; z <= 105; z++) set(x0 - 1, BASE + 7, z, B.STONE, C_STONE);
      for (const z of [101, 102, 104, 105]) { set(x0 - 1, BASE + 8, z, B.GOLD, 0); set(x0 - 1, BASE + 9, z, B.GOLD, 0); }
      // gable crest + pinnacles
      for (let z = 101; z <= 105; z++) set(x0, BASE + 13, z, B.STONE, C_STONE);
      for (let z = 102; z <= 104; z++) set(x0, BASE + 14, z, B.STONE, C_STONE);
      set(x0, BASE + 15, 103, B.STONE, C_STONE); set(x0, BASE + 16, 103, B.GOLD, 0); set(x0, BASE + 17, 103, B.GOLD, 0);
      for (const z of [93, 97, 101, 105, 109, 113]) { spire(x0, BASE + 13, z, z === 101 || z === 105 ? 3 : 2, true); }
      // windows on other walls

      for (let x = x0 + 4; x <= x1 - 3; x += 4) for (let y = BASE + 5; y <= BASE + 8; y++) {
        set(x, y, z0, B.GLASS, 0); set(x, y, z1, B.GLASS, 0);
      }
      for (let z = z0 + 4; z <= z1 - 3; z += 4) for (let y = BASE + 5; y <= BASE + 8; y++) set(x1, y, z, B.GLASS, 0);
      // five domes
      const cxm = 174, czm = 103;
      const doms = [[cxm, czm, 4.5, 3], [166, czm, 3, 2], [182, czm, 3, 2], [cxm, 96, 3, 2], [cxm, 110, 3, 2]];
      doms.forEach(([dx, dz, Rr, dh]) => {
        drum(dx, BASE + 13, dz, Rr, dh, true);
        const topY = dome(dx, BASE + 13 + dh, dz, Rr, B.DOME, lead, 1.35);
        spire(dx, topY + 1, dz, 2, true);
        set(dx, topY + 4, dz, B.GOLD, 0); set(dx - 1, topY + 4, dz, B.GOLD, 0); set(dx + 1, topY + 4, dz, B.GOLD, 0); set(dx, topY + 5, dz, B.GOLD, 0);
      });
      markOcc(x0 - 2, z0 - 1, x1 + 1, z1 + 1, 3, 1);
      landmarks.push({ id: 'basilica', name: '圣马可大教堂', en: 'Basilica San Marco', x: 158, z: 103, top: BASE + 20, r: 18 });
    }

    // --- Doge's Palace ---
    function palace() {
      const x0 = 161, x1 = 193, z0 = 116, z1 = 136;
      const pink = 0, stone = C_STONE;
      fillBox(x0, BASE, z0, x1, BASE + 10, z1, B.STONE, stone);        // y5..15
      fillBox(x0, BASE + 11, z0, x1, BASE + 20, z1, B.DIAMOND, pink);  // y16..25
      fillBox(x0, BASE + 21, z0, x1, BASE + 21, z1, B.STONE, stone);   // y26 cornice
      for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++)
        if ((x === x0 || x === x1 || z === z0 || z === z1) && ((x + z) % 2 === 0)) set(x, BASE + 22, z, B.STONE, C_WHITE);
      // inner courtyard
      fillBox(x0 + 12, BASE + 1, z0 + 6, x1 - 8, BASE + 22, z1 - 6, B.AIR, 0);
      fillBox(x0 + 12, BASE, z0 + 6, x1 - 8, BASE, z1 - 6, B.PAVE, C_PZ_B);
      const southLen = x1 - x0 + 1, westLen = z1 - z0 + 1;
      // ground arcade (period 4, 5 tall opening) on S & W; loggia (period 2) above
      function facadeCell(fx, fz, i, len, dirx, dirz, hollowDepth) {
        const col4 = i % 4 === 0 || i === len - 1;
        for (let r = 0; r <= 5; r++) {
          const y = BASE + r;
          let open = false;
          if (!col4) { if (r <= 3) open = true; else if (r === 4 && i % 4 === 2) open = true; }
          set(fx, y, fz, open ? B.AIR : B.STONE, open ? 0 : stone);
        }
        if (i >= 1 && i <= len - 2) for (let k = 1; k <= 3; k++) for (let r = 0; r <= 4; r++) set(fx + dirx * k, BASE + r, fz + dirz * k, B.AIR, 0);
        // loggia
        const col2 = i % 2 === 0 || i === len - 1;
        for (let r = 6; r <= 10; r++) {
          const y = BASE + r;
          let open = false;
          if (!col2) { if (r >= 7 && r <= 9) open = true; }
          if (r === 6) { set(fx, y, fz, B.STONE, stone); continue; }
          if (r === 10) { set(fx, y, fz, B.STONE, stone); continue; }
          set(fx, y, fz, open ? B.AIR : B.STONE, open ? 0 : stone);
        }
        if (i >= 1 && i <= len - 2) for (let k = 1; k <= 2; k++) for (let r = 7; r <= 9; r++) set(fx + dirx * k, BASE + r, fz + dirz * k, B.AIR, 0);
      }
      for (let i = 0; i < southLen; i++) facadeCell(x0 + i, z1, i, southLen, 0, -1);
      for (let i = 0; i < westLen; i++) facadeCell(x0, z0 + i, i, westLen, 1, 0);
      // window pairs on upper wall: south and west
      function upperWindows(fx, fz, i, ox, oz) {
        const m = i % 8;
        if (m < 2 || m > 5) return;
        for (let r = 12; r <= 15; r++) set(fx, BASE + r, fz, (m === 3 || m === 4) ? B.GLASS : B.STONE, (m === 3 || m === 4) ? 0 : stone);
        set(fx, BASE + 16, fz, B.STONE, stone);
        if (isAir(fx + ox, BASE + 11, fz + oz)) set(fx + ox, BASE + 11, fz + oz, B.STONE, stone);
      }
      for (let i = 0; i < southLen; i++) upperWindows(x0 + i, z1, i, 0, 1);
      for (let i = 0; i < westLen; i++) upperWindows(x0, z0 + i, i, -1, 0);
      // N & E plain faces: small windows
      for (let i = 2; i < southLen - 2; i += 4) for (let r of [2, 3, 8, 9]) { set(x0 + i, BASE + r, z0, B.GLASS, 0); }
      for (let i = 2; i < westLen - 2; i += 4) for (let r of [2, 3, 8, 9, 14, 15]) { set(x1, BASE + r, z0 + i, B.GLASS, 0); }
      // corner finials
      for (const [px, pz] of [[x0, z0], [x0, z1], [x1, z0], [x1, z1]]) spire(px, BASE + 23, pz, 3, true);
      markOcc(x0 - 1, z0 - 1, x1 + 1, z1 + 1, 3, 0);
      landmarks.push({ id: 'palace', name: '总督宫', en: "Palazzo Ducale", x: 177, z: 139, top: BASE + 25, r: 20 });
    }

    // --- Piazzetta columns ---
    function columns() {
      const z = 136;
      const gran = pal(0.62, 0.60, 0.58);
      for (const x of [152, 157]) {
        fillBox(x, BASE, z, x, BASE + 8, z, B.STONE, gran);
        set(x, BASE + 9, z, B.STONE, C_STONE);
        for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) set(x + dx, BASE + 9, z + dz, B.STONE, C_STONE);
      }
      // winged lion
      const lx = 152;
      set(lx, BASE + 10, z, B.GOLD, 0); set(lx, BASE + 10, z - 1, B.GOLD, 0); set(lx, BASE + 11, z - 1, B.GOLD, 0);
      set(lx - 1, BASE + 11, z, B.GOLD, 0); set(lx + 1, BASE + 11, z, B.GOLD, 0); set(lx, BASE + 10, z + 1, B.GOLD, 0);
      // St Theodore
      const sx = 157;
      for (let y = BASE + 10; y <= BASE + 12; y++) set(sx, y, z, B.STONE, pal(0.55, 0.62, 0.60));
      set(sx, BASE + 13, z, B.STONE, C_STONE); set(sx + 1, BASE + 12, z, B.LOG, pal(0.5, 0.35, 0.2)); set(sx + 1, BASE + 13, z, B.LOG, pal(0.5, 0.35, 0.2));
      set(sx + 1, BASE + 14, z, B.GOLD, 0);
    }

    // --- Procuratie, Library, Napoleonic wing, Clock Tower ---
    function procuratie() {
      const cream = [0.90, 0.88, 0.80], pale = [0.92, 0.88, 0.78], grey = [0.58, 0.60, 0.62];
      // Vecchie (north), 3 floors
      house(112, 84, 49, 10, 3, cream, grey, { gable: false, trim: [0.97, 0.96, 0.92], noChimney: true, shutter: [0.3, 0.45, 0.4] });
      arcade(112, 84, 160, 93, 'S', 3);
      markOcc(112, 84, 160, 93, 3, 0);
      // clock tower
      const tx0 = 133, tx1 = 139, tz0 = 84, tz1 = 93;
      fillBox(tx0, BASE + 15, tz0, tx1, BASE + 30, tz1, B.STONE, pal(0.93, 0.90, 0.84));
      for (let x = 135; x <= 137; x++) { for (let z = 84; z <= 93; z++) for (let y = BASE; y <= BASE + 3; y++) set(x, y, z, B.AIR, 0); }
      for (let x = 134; x <= 138; x++) for (let y = BASE + 20; y <= BASE + 24; y++) set(x, y, 93, B.CLOCK, 0);
      for (let y = BASE + 26; y <= BASE + 28; y++) for (let x = 134; x <= 138; x++) set(x, y, 93, B.STONE, C_WHITE);
      set(136, BASE + 27, 93, B.GOLD, 0);
      fillBox(tx0, BASE + 31, tz0, tx1, BASE + 31, tz1, B.DOME, C_COPPER);
      fillBox(tx0 + 1, BASE + 32, tz0 + 1, tx1 - 1, BASE + 32, tz1 - 1, B.DOME, C_COPPER);
      set(136, BASE + 33, 88, B.GOLD, 0); set(135, BASE + 33, 88, B.DARK, 0); set(137, BASE + 33, 88, B.DARK, 0);
      // Nuove (south)
      house(116, 112, 17, 8, 3, pale, grey, { gable: false, trim: [0.97, 0.96, 0.92], noChimney: true });
      arcade(116, 112, 132, 119, 'N', 3);
      markOcc(116, 112, 132, 119, 3, 0);
      // Napoleonic wing (west)
      house(104, 94, 8, 17, 3, [0.88, 0.86, 0.78], grey, { gable: false, trim: [0.97, 0.96, 0.92], noChimney: true });
      arcade(104, 94, 111, 110, 'E', 3);
      markOcc(104, 94, 111, 110, 3, 0);
      // Library
      house(130, 120, 19, 17, 3, [0.94, 0.92, 0.86], [0.7, 0.72, 0.72], { gable: false, trim: [0.98, 0.97, 0.94], noChimney: true, flat: true, shutter: [0.4, 0.4, 0.38] });
      arcade(130, 120, 148, 136, 'E', 3);
      for (let z = 120; z <= 136; z += 4) { set(148, BASE + 16, z, B.STONE, C_WHITE); set(148, BASE + 17, z, B.STONE, C_WHITE); set(148, BASE + 18, z, B.STONE, C_WHITE); set(148, BASE + 19, z, B.GOLD, 0); }
      markOcc(130, 120, 148, 136, 3, 0);
      landmarks.push({ id: 'clock', name: '钟塔', en: 'Torre dell\'Orologio', x: 136.5, z: 98, top: BASE + 33, r: 10 });
    }

    // --- Santa Maria della Salute ---
    function salute() {
      const cx = 99, cz = 134;
      const white = pal(0.96, 0.95, 0.92), lead = pal(0.82, 0.85, 0.86);
      // platform steps toward the canal (east)
      for (let dz = -10; dz <= 10; dz++) for (let dx = -12; dx <= 12; dx++) {
        if (!land[zi(cx + dx, cz + dz)]) continue;
        set(cx + dx, BASE, cz + dz, B.STONE, C_STONE);
        if (Math.abs(dx) <= 10 && Math.abs(dz) <= 9) set(cx + dx, BASE + 1, cz + dz, B.STONE, C_STONE);
      }
      // octagon body y=BASE+2 .. +13 (top ring is wider = cornice)
      for (let y = BASE + 2; y <= BASE + 13; y++)
        for (let dz = -9; dz <= 9; dz++) for (let dx = -9; dx <= 9; dx++) {
          const m = y === BASE + 13 ? 1 : 0;
          if (Math.abs(dx) + Math.abs(dz) > 11 + m || Math.abs(dx) > 8 + m || Math.abs(dz) > 8 + m) continue;
          const edge = Math.abs(dx) + Math.abs(dz) > 10 || Math.abs(dx) === 8 || Math.abs(dz) === 8;
          let id = B.STONE, c = y === BASE + 13 ? C_STONE : white;
          if (edge && (y === BASE + 7 || y === BASE + 8) && ((dx + dz + 16) % 4 === 0)) { id = B.GLASS; c = 0; }
          set(cx + dx, y, cz + dz, id, c);
        }
      // volutes (scrolls) at 8 points around the drum
      const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]];
      for (const [vx, vz] of dirs) {
        const n = Math.hypot(vx, vz);
        for (let s = 0; s < 4; s++) {
          const rr = 8 - s * 1.2;
          const px = Math.round(cx + vx / n * rr), pz = Math.round(cz + vz / n * rr);
          for (let y = BASE + 13; y <= BASE + 13 + s + 1; y++) set(px, y, pz, B.STONE, white);
        }
        const gx = Math.round(cx + vx / n * 9.5), gz = Math.round(cz + vz / n * 9.5);
        for (let y = BASE + 13; y <= BASE + 14; y++) set(gx, y, gz, B.STONE, white);
        set(gx, BASE + 15, gz, B.STONE, white);
        for (const f of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { /* statues */ }
        set(gx, BASE + 16, gz, B.STONE, C_STONE);
      }
      // drum & dome
      drum(cx, BASE + 14, cz, 5.5, 5, true);
      const topY = dome(cx, BASE + 19, cz, 6, B.DOME, lead, 1.15);
      spire(cx, topY + 1, cz, 4, false);
      set(cx, topY + 5, cz, B.GOLD, 0);
      set(cx, topY + 6, cz, B.GOLD, 0);
      // small second dome behind
      const sx = cx - 13;
      fillBox(sx - 4, BASE + 2, cz - 4, sx + 4, BASE + 9, cz + 4, B.STONE, white);
      drum(sx, BASE + 10, cz, 3.5, 3, true);
      const t2 = dome(sx, BASE + 13, cz, 4, B.DOME, lead, 1.15);
      spire(sx, t2 + 1, cz, 2, true);
      markOcc(cx - 16, cz - 11, cx + 12, cz + 11, 3, 1);
      landmarks.push({ id: 'salute', name: '安康圣母教堂', en: 'Santa Maria della Salute', x: cx + 0.5, z: cz + 0.5, top: topY + 8, r: 16 });
    }

    // --- San Giorgio Maggiore ---
    function giorgio() {
      const x0 = 168, x1 = 186, z0 = 155, z1 = 169;
      const white = pal(0.95, 0.93, 0.88);
      fillBox(x0, BASE, z0, x1, BASE + 13, z1, B.STONE, white);
      // gable roof
      for (let k = 0; k < 6; k++) fillBox(x0, BASE + 14 + k, z0 + k + 1, x1, BASE + 14 + k, z1 - k - 1, B.ROOF, pal(0.70, 0.36, 0.26));
      // facade (z=z0): 4 pilasters, pediment, windows, door
      for (let x = x0; x <= x1; x++) {
        const i = x - x0;
        for (let y = BASE; y <= BASE + 13; y++) {
          let id = B.STONE, c = white;
          if (i % 5 === 0 || i === 18) { id = B.STONE; c = C_STONE; set(x, y, z0 - 1, B.STONE, C_STONE); }
          else if (y >= BASE + 1 && y <= BASE + 4 && (i % 5 === 2 || i % 5 === 3)) { id = B.DARK; c = 0; }
          else if (y >= BASE + 7 && y <= BASE + 10 && i % 5 === 2) { id = B.GLASS; c = 0; }
          set(x, y, z0, id, c);
        }
      }
      for (let k = 0; k < 7; k++) for (let x = x0 + 4 + k; x <= x1 - 4 - k; x++) set(x, BASE + 14 + k, z0 - 1, B.STONE, white);
      fillBox(x0 + 6, BASE + 14, z0 - 1, x1 - 6, BASE + 14, z0 - 1, B.STONE, C_STONE);
      set(177, BASE + 21, z0 - 1, B.GOLD, 0);
      // dome
      drum(177, BASE + 20, 163, 4, 3, true);
      const td = dome(177, BASE + 23, 163, 4.5, B.DOME, pal(0.55, 0.72, 0.66), 1.2);
      spire(177, td + 1, 163, 2, true);
      // brick campanile
      const bx = 190, bz = 157;
      fillBox(bx - 2, BASE, bz - 2, bx + 2, BASE + 33, bz + 2, B.BRICK, pal(0.80, 0.42, 0.30));
      for (let y = BASE; y <= BASE + 33; y += 11) fillBox(bx - 2, y, bz - 2, bx + 2, y, bz + 2, B.STONE, C_STONE);
      fillBox(bx - 2, BASE + 34, bz - 2, bx + 2, BASE + 38, bz + 2, B.STONE, white);
      fillBox(bx - 1, BASE + 34, bz - 1, bx + 1, BASE + 37, bz + 1, B.AIR, 0);
      for (let y = BASE + 34; y <= BASE + 36; y++) { set(bx, y, bz - 2, B.AIR, 0); set(bx, y, bz + 2, B.AIR, 0); set(bx - 2, y, bz, B.AIR, 0); set(bx + 2, y, bz, B.AIR, 0); }
      let y = BASE + 39, half = 2;
      for (let k = 0; k < 2; k++) { fillBox(bx - half, y, bz - half, bx + half, y, bz + half, B.DOME, pal(0.55, 0.72, 0.66)); y++; }
      half = 1;
      for (let k = 0; k < 2; k++) { fillBox(bx - half, y, bz - half, bx + half, y, bz + half, B.DOME, pal(0.55, 0.72, 0.66)); y++; }
      for (let k = 0; k < 4; k++) { set(bx, y, bz, B.DOME, pal(0.55, 0.72, 0.66)); y++; }
      set(bx, y, bz, B.GOLD, 0); set(bx, y + 1, bz, B.GOLD, 0);
      markOcc(x0 - 2, z0 - 2, bx + 3, z1 + 1, 3, 1);
      landmarks.push({ id: 'giorgio', name: '圣乔治岛', en: 'San Giorgio Maggiore', x: 177, z: 150, top: BASE + 40, r: 16 });
    }

    // --- Prison + Bridge of Sighs ---
    function sighs() {
      house(198, 112, 13, 22, 3, [0.90, 0.89, 0.84], [0.6, 0.6, 0.6], { flat: true, noChimney: true, trim: [0.98, 0.97, 0.94], shutter: [0.35, 0.35, 0.35] });
      markOcc(198, 112, 210, 133, 3, 0);
      const y = BASE + 12, wc = pal(0.97, 0.95, 0.9);
      for (let x = 194; x <= 197; x++) {
        for (let z = 122; z <= 125; z++) {
          set(x, y, z, B.STONE, wc); set(x, y + 4, z, B.STONE, wc);
          const wall = z === 122 || z === 125;
          for (let k = 1; k <= 3; k++) set(x, y + k, z, wall ? B.STONE : B.AIR, wall ? wc : 0);
        }
        if (x === 195 || x === 196) { set(x, y + 2, 122, B.DARK, 0); set(x, y + 2, 125, B.DARK, 0); }
      }
      for (const z of [123, 124]) for (let k = 1; k <= 2; k++) { set(193, y + k, z, B.AIR, 0); set(198, y + k, z, B.AIR, 0); }
      set(195, y + 5, 123, B.STONE, wc); set(196, y + 5, 124, B.STONE, wc);
      landmarks.push({ id: 'sighs', name: '叹息桥', en: 'Ponte dei Sospiri', x: 195.5, z: 123.5, top: y + 6, r: 10 });
    }

    // --- Rialto Bridge ---
    function rialto() {
      const cx = 90, z0 = 84, z1 = 96;
      const prof = [11, 11, 11, 10, 10, 9, 9, 8, 7, 6, 5];  // by dx 0..10
      const stone = pal(0.94, 0.92, 0.86), shopC = pal(0.90, 0.76, 0.52), roofC = pal(0.78, 0.74, 0.66);
      for (let x = cx - 10; x <= cx + 10; x++) {
        const dx = Math.abs(x - cx), top = prof[dx];
        for (let z = z0; z <= z1; z++) {
          const over = dx <= 5;
          const bottom = over ? top - 1 : BASE;
          for (let y = bottom; y <= top; y++) set(x, y, z, B.STONE, stone);
          // balustrade
          if (z === z0 || z === z1) { set(x, top + 1, z, B.STONE, stone); }
          else if (z === z0 + 1 || z === z1 - 1) { if ((x + z) % 2 === 0) set(x, top + 1, z, B.STONE, stone); }
          // shop rows
          const row1 = z >= z0 + 2 && z <= z0 + 4, row2 = z >= z1 - 4 && z <= z1 - 2;
          if (dx <= 8 && (row1 || row2)) {
            const edge = (row1 && (z === z0 + 2 || z === z0 + 4)) || (row2 && (z === z1 - 2 || z === z1 - 4));
            for (let k = 1; k <= 4; k++) {
              const wall = edge || dx === 8 || dx === 0;
              if (!wall) { set(x, top + k, z, B.PLASTER, shopC); continue; }
              let id = B.PLASTER, c = shopC;
              if (k === 2 && (dx % 2 === 1) && edge && (z === z0 + 4 || z === z1 - 4)) { id = B.GLASS; c = 0; }
              else if (k === 2 && (dx % 2 === 1) && edge && (z === z0 + 2 || z === z1 - 2)) { id = B.DARK; c = 0; }
              set(x, top + k, z, id, c);
            }
            set(x, top + 5, z, B.ROOF, roofC);
            if (row1 && z === z0 + 4 && dx % 2 === 0 && dx <= 6) set(x, top + 3, z, B.AWN_R, 0);
            if (row2 && z === z1 - 4 && dx % 2 === 0 && dx <= 6) set(x, top + 3, z, B.AWN_B, 0);
          }
        }
      }
      markOcc(cx - 12, z0 - 1, cx + 12, z1 + 1, 3, 4);
      landmarks.push({ id: 'rialto', name: '里亚托桥', en: 'Ponte di Rialto', x: cx + 0.5, z: 90.5, top: 17, r: 14 });
    }

    // --- Simple bridges over minor canals ---
    const bridges = [];
    function minorBridges() {
      for (const c of RII) {
        const horizontal = c[1] === c[3];
        const len = horizontal ? Math.abs(c[2] - c[0]) : Math.abs(c[3] - c[1]);
        const hw = (c[4] - 1) / 2;
        const n = c[4] + 4;
        const lo = horizontal ? Math.min(c[0], c[2]) : Math.min(c[1], c[3]);
        for (let p = lo + 8 + RI(0, 6); p < lo + len - 4; p += 17 + RI(0, 8)) {
          // p is the coordinate along the canal; bridge crosses it
          const ok = (() => {
            for (let i = -(hw + 2); i <= hw + 2; i++) for (let j = -2; j <= 2; j++) {
              const x = horizontal ? p + j : c[0] + i, z = horizontal ? c[1] + i : p + j;
              if (x < 1 || z < 1 || x >= W - 1 || z >= D - 1) return false;
              if (occ[zi(x, z)] >= 3) return false;
              const isWater = !land[zi(x, z)];
              const inside = Math.abs(i) <= hw;
              if (inside && !isWater) return false;
              if (!inside && (isWater || get(x, BASE, z) !== B.AIR)) return false;
              if (inside && !isAir(x, BASE + 1, z)) return false;
            }
            return true;
          })();
          if (!ok) continue;
          const stone = pal(0.90, 0.88, 0.82);
          for (let i = -(hw + 2); i <= hw + 2; i++) {
            const k = i + hw + 2;
            const top = Math.min(7, 5 + Math.min(k, n - 1 - k));
            const over = Math.abs(i) <= hw;
            for (let j = -2; j <= 2; j++) {
              const x = horizontal ? p + j : c[0] + i, z = horizontal ? c[1] + i : p + j;
              const rail = Math.abs(j) === 2;
              const bottom = over ? top : BASE;
              for (let y = bottom; y <= top; y++) set(x, y, z, B.STONE, stone);
              if (rail) set(x, top + 1, z, B.STONE, stone);
            }
          }
          const bx = horizontal ? p : c[0], bz = horizontal ? c[1] : p;
          markOcc(horizontal ? p - 3 : c[0] - hw - 7, horizontal ? c[1] - hw - 7 : p - 3, horizontal ? p + 3 : c[0] + hw + 7, horizontal ? c[1] + hw + 7 : p + 3, 2, 0);
          // street leading to bridge ends
          bridges.push([bx, bz]);
          lamp(horizontal ? p + 3 : c[0] - hw - 3, horizontal ? c[1] - hw - 3 : p + 3);
        }
      }
    }

    // --- reserve landmark footprints BEFORE random buildings ---
    campanile(); basilica(); palace(); columns(); procuratie(); salute(); giorgio(); sighs(); rialto();
    minorBridges();

    // Reserve extra civic space: piazza & piazzetta streets
    for (const r of zoneRects) markOcc(r[1], r[2], r[3], r[4], 2, 0);
    // square in front of Salute
    markOcc(86, 122, 112, 148, 2, 0);

    // ================= generic city fill =================
    const houses = [];
    function canBuild(x0, z0, w, d) {
      for (let z = z0 - 0; z < z0 + d; z++) for (let x = x0; x < x0 + w; x++) {
        if (x < 1 || z < 1 || x >= W - 1 || z >= D - 1) return false;
        const i = zi(x, z);
        if (!land[i] || occ[i] !== 0) return false;
        const need = distGC[i] <= 3 ? 3 : 2;
        if (dist[i] < need) return false;
        if (get(x, BASE, z) !== B.AIR) return false;
      }
      return true;
    }
    function campo(x0, z0, s) {
      markOcc(x0, z0, x0 + s - 1, z0 + s - 1, 2, 0);
      const cx = x0 + (s >> 1), cz = z0 + (s >> 1);
      // well
      for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) set(cx + dx, BASE, cz + dz, dx === 0 && dz === 0 ? B.DARK : B.STONE, dx === 0 && dz === 0 ? 0 : C_STONE);
      set(cx - 1, BASE + 1, cz - 1, B.WOOD, pal(0.5, 0.35, 0.2)); set(cx + 1, BASE + 1, cz + 1, B.WOOD, pal(0.5, 0.35, 0.2));
      // tree in a corner
      if (rnd() < 0.7) {
        const tx = x0 + 1, tz = z0 + 1;
        for (let y = BASE; y < BASE + 3; y++) set(tx, y, tz, B.LOG, pal(0.45, 0.32, 0.2));
        for (let dy = 0; dy <= 2; dy++) for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) {
          if (Math.abs(dx) + Math.abs(dz) + dy * 1.2 > 3.4) continue;
          if (isAir(tx + dx, BASE + 3 + dy, tz + dz)) set(tx + dx, BASE + 3 + dy, tz + dz, B.LEAF, pal(0.30 + rnd() * 0.1, 0.56 + rnd() * 0.12, 0.26));
        }
      }
    }
    for (let z = 2; z < D - 2; z++) for (let x = 2; x < W - 2; x++) {
      const i = zi(x, z);
      if (!land[i] || occ[i] !== 0) continue;
      if (dist[i] < (distGC[i] <= 3 ? 3 : 2)) continue;
      if (rnd() < 0.012 && canBuild(x, z, 7, 7)) { campo(x, z, 7); continue; }
      let placed = false;
      const near = distGC[i] < 16;
      for (let tries = 0; tries < 6 && !placed; tries++) {
        let w = RI(5, 11), d = RI(6, 11);
        w -= tries; d -= tries;
        if (w < 4) w = 4; if (d < 4) d = 4;
        if (!canBuild(x, z, w, d)) continue;
        const floors = near ? RI(3, 4) : RI(2, 3);
        const wallC = pick(FACADES);
        const trim = rnd() < 0.5 ? [0.95, 0.93, 0.88] : [0.82, 0.78, 0.70];
        house(x, z, w, d, floors, wallC, pick(ROOFS), { trim });
        markOcc(x, z, x + w - 1, z + d - 1, 1, 0);
        if (rnd() < 0.82) markOcc(x + w, z, x + w, z + d - 1, 2, 0);
        if (rnd() < 0.85) markOcc(x, z + d, x + w - 1, z + d, 2, 0);
        houses.push([x, z, w, d]);
        placed = true;
      }
    }

    // ================= decorations =================
    // street lamps along quays
    for (let z = 2; z < D - 2; z++) for (let x = 2; x < W - 2; x++) {
      const i = zi(x, z);
      if (!land[i] || dist[i] !== 1 || occ[i] === 1) continue;
      if (hash3(x, 7, z) < 0.06 && get(x, BASE, z) === B.AIR && get(x, BASE + 1, z) === B.AIR) {
        // make sure not on a bridge ramp / building wall neighbor
        lamp(x, z);
      }
    }
    // piazza lamps
    for (let x = 114; x <= 158; x += 8) { lamp(x, 94); lamp(x, 111); }
    for (let z = 120; z <= 134; z += 7) { lamp(150, z); lamp(159, z); }
    // flag poles in front of the Basilica
    const flags = [];
    for (const z of [97, 103, 109]) {
      const x = 156;
      for (let y = BASE; y <= BASE + 22; y++) set(x, y, z, B.LOG, pal(0.5, 0.5, 0.52));
      set(x, BASE + 23, z, B.GOLD, 0);
      flags.push([x + 0.5, BASE + 22, z + 0.5]);
    }
    // mooring poles (pali): striped at the Piazzetta & Molo, plain elsewhere
    const poles = [];
    function pole(x, z, striped) {
      if (land[zi(x, z)] || get(x, BASE, z) !== B.AIR) return;
      for (let y = 1; y <= 7; y++) {
        const stripe = striped ? (y >= 5 ? (y % 2 ? pal(0.2, 0.3, 0.7) : pal(0.95, 0.95, 0.95)) : pal(0.45, 0.32, 0.2)) : pal(0.42, 0.30, 0.20);
        set(x, y, z, B.LOG, stripe);
      }
      poles.push([x, z]);
    }
    for (let x = 134; x <= 200; x += 3) pole(x, 139, true);
    for (let z = 2; z < D - 2; z++) for (let x = 2; x < W - 2; x++) {
      const i = zi(x, z);
      if (land[i] || !gcMask[i]) continue;
      if (hash3(x, 11, z) < 0.04) {
        const adj = land[i - 1] || land[i + 1] || land[i - W] || land[i + W];
        if (adj) pole(x, z, false);
      }
    }
    // potted flowers & awnings along the Procuratie arcades are covered by house details.

    // ================= derived data =================
    // column top height & colour for the minimap
    const topH = new Uint8Array(W * D), topB = new Uint8Array(W * D), topC = new Uint8Array(W * D);
    for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
      for (let y = H - 1; y >= 0; y--) {
        const b = blocks[idx(x, y, z)];
        if (b) { topH[zi(x, z)] = y; topB[zi(x, z)] = b; topC[zi(x, z)] = cols[idx(x, y, z)]; break; }
      }
    }

    // Grand-canal centreline (dense) for boats
    const gcPath = GRAND_CANAL.map(p => [p[0], p[1]]);

    const moorings = [];
    for (let x = 138; x <= 194; x += 14) moorings.push({ x: x + 0.5, z: 141.6, yaw: 0 });

    return {
      W, D, H, BASE, GY, WATER_Y, blocks, cols, palette, pal, get, set, idx, inb, B, BI,
      land, gcMask, riMask, topH, topB, topC, occ, dist, houses, landmarks, lamps, flags, poles, bridges,
      gcPath, moorings, zoneRects
    };
  }

  root.VeniceWorld = { W, D, H, GY, BASE, WATER_Y, B, BI, T, create, hash3, mulberry32, GRAND_CANAL, GIUDECCA_POLY };
  if (typeof module !== 'undefined') module.exports = root.VeniceWorld;
})(typeof window !== 'undefined' ? window : globalThis);
