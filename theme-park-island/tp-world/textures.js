/* Philosophers' Island — procedural pixel-art texture atlas (8 x 8 tiles of 32 px), painted in code.
 * Covers Aegean marble, terracotta roof tiles, Cotswold/Lyceum limestone, Königsberg brick, bamboo/oriental tiles,
 * Cartesian coordinate marble, Humean green billiard baize, Alpine stone/snow, bookshelves, hearth fires and glowing portals. */
(function (root) {
  'use strict';
  const TS = 32, COLS = 8, ROWS = 8, S = TS;
  function rng(seed) { let a = seed | 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const cl = (v) => Math.max(0, Math.min(255, Math.round(v * 255)));
  const grey = (v) => [v, v, v];
  const ring = (x, y, cx, cy) => Math.hypot(x - cx, y - cy);
  function vn(x, y) { const h = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453; return h - Math.floor(h); }

  const cyc = (b, x) => { let k = 0; for (const v of b) if (x >= v) k++; return k % b.length; };
  const RUB = new Int16Array(S * S), RUBE = new Float32Array(S * S);
  (function () {
    const lr = rng(1380), rows = [0, 5, 11, 16, 22, 27, 32];
    for (let c = 0; c < rows.length - 1; c++) {
      const n = 3 + Math.floor(lr() * 2), b = [];
      for (let i = 0; i < n; i++) b.push(Math.floor((i + lr() * 0.7) / n * S));
      b.sort((p, q) => p - q);
      for (let y = rows[c]; y < rows[c + 1]; y++) for (let x = 0; x < S; x++) {
        const joint = y === rows[c] || b.includes(x);
        const k = cyc(b, x) + c * 5;
        RUB[y * S + x] = joint ? -1 : k;
        const top = y - rows[c], bot = rows[c + 1] - 1 - y;
        let dx = 99;
        for (const v of b) dx = Math.min(dx, Math.abs(x - v), Math.abs(x - v - S), Math.abs(x - v + S));
        RUBE[y * S + x] = Math.max(0, 1 - Math.min(top, bot, dx - 1) / 1.5);
      }
    }
  })();

  const SLB = [];
  (function () {
    const lr = rng(77);
    for (let i = 0; i < 8; i++) {
      const n = 4 + Math.floor(lr() * 2), b = [];
      for (let k = 0; k < n; k++) b.push(Math.floor((k + lr() * 0.6) / n * S));
      SLB.push(b.sort((p, q) => p - q));
    }
  })();

  const DSR = new Int8Array(S), DSB = [];
  (function () {
    const lr = rng(91);
    let y = 0, row = 0;
    while (y < S) {
      const h = 2 + Math.floor(lr() * 3);
      DSR[y] = -1;
      for (let k = 1; k < h && y + k < S; k++) DSR[y + k] = row;
      y += h; row++;
    }
    for (let i = 0; i < 8; i++) {
      const n = 3 + Math.floor(lr() * 3), b = [];
      for (let k = 0; k < n; k++) b.push(Math.floor((k + lr() * 0.7) / n * S));
      DSB.push(b.sort((p, q) => p - q));
    }
  })();

  const painters = {
    grass(x, y, r) { const v = 0.84 + r() * 0.16 - (r() < 0.07 ? 0.14 : 0); return [0.42 * v, 0.68 * v + (r() < 0.05 ? 0.05 : 0), 0.28 * v]; },
    meadow(x, y, r) { const v = 0.86 + r() * 0.14, f = r(); if (f < 0.025) return [1, 0.9, 0.32]; if (f < 0.045) return [1, 1, 1]; if (f < 0.06) return [0.6, 0.5, 0.95]; return [0.48 * v, 0.72 * v, 0.32 * v]; },
    grassSide(x, y, r) { const edge = 6 + ((x * 7) % 3 === 0 ? 2 : 0) + (r() < 0.2 ? 1 : 0); if (y < edge) { const v = 0.82 + r() * 0.16; return [v * 0.6, v * 0.9, v * 0.46]; } const v = 0.78 + r() * 0.16 - (r() < 0.08 ? 0.12 : 0); return [v * 0.78, v * 0.6, v * 0.44]; },
    dirt(x, y, r) { const v = 0.8 + r() * 0.16 - (r() < 0.1 ? 0.14 : 0); return [v * 0.72, v * 0.56, v * 0.4]; },
    rock(x, y, r) {
      const strata = Math.sin(y * 0.55 + Math.sin(x * 0.3) * 1.4) * 0.06, crack = ((x * 3 + y * 5) % 29 === 0) || ((x + y * 7) % 37 === 0);
      return grey(crack ? 0.58 : 0.82 + strata + r() * 0.1);
    },
    rubble(x, y, r) { const k = RUB[y * S + x]; if (k < 0) return grey(0.56 + r() * 0.08); const e = RUBE[y * S + x]; const v = 0.8 + (k % 13) / 13 * 0.18 + r() * 0.06 - e * 0.08; return [v, v * 0.985, v * 0.95]; },
    slates(x, y, r) {
      const row = y >> 2, cy = y & 3, b = SLB[row & 7], k = cyc(b, x); if (cy === 3) return grey(0.42 + r() * 0.06);
      if (b.includes(x)) return grey(0.5);
      const v = 0.7 + ((k * 7 + row * 3) % 9) / 9 * 0.2 + r() * 0.05 - cy * 0.02; return [v, v * 0.98, v * 0.93];
    },
    path(x, y, r) {
      const cx = (x + ((y >> 3) & 1) * 4) & 7, cy = y & 7, d = Math.hypot(cx - 3.5, cy - 3.5);
      return grey(d > 3.6 ? 0.54 : 0.84 + r() * 0.06 - d * 0.02);
    },
    gravel(x, y, r) { const v = 0.76 + r() * 0.22 - (r() < 0.2 ? 0.14 : 0); return grey(v); },
    pine(x, y, r) { const v = 0.72 + r() * 0.28 - (r() < 0.2 ? 0.22 : 0); return [v * 0.85, v, v * 0.88]; },
    bark(x, y, r) { const v = ((x + (y >> 2)) % 6 === 0 ? 0.62 : 0.84) + r() * 0.1; return [v, v * 0.9, v * 0.8]; },
    trunkTop(x, y, r) { const d = ring(x, y, 15.5, 15.5); const v = d > 13 ? 0.62 : (Math.floor(d / 2) & 1 ? 0.95 : 0.84); return [v, v * 0.86, v * 0.66]; },
    beech(x, y, r) { const v = 0.76 + r() * 0.24 - (r() < 0.16 ? 0.2 : 0); return [v * 0.95, v, v * 0.82]; },
    brook(x, y, r) { const w = Math.sin(x * 0.4 + y * 0.25) * 0.06; const v = 0.84 + w + r() * 0.08; return r() < 0.06 ? [1, 1, 1] : [v * 0.45, v * 0.75, v * 0.85]; },
    ashlar(x, y, r) {
      const row = y >> 3, off = (row & 1) * 8, joint = (y & 7) === 7 || ((x + off) & 15) === 15;
      const blk = (((x + off) >> 4) * 31 + row * 17) % 7;
      return grey(joint ? 0.82 : 0.95 + blk * 0.006 + r() * 0.04);
    },
    limeSmooth(x, y, r) { return grey(0.96 + r() * 0.04 - (y === 0 || y === S - 1 ? 0.06 : 0)); },
    limeCarved(x, y, r) {
      // Fluted Greek column / Triglyph frieze texture
      if (y < 3 || y > S - 4) return grey(0.92 + r() * 0.04);
      const flute = Math.sin((x / S) * Math.PI * 8);
      return grey(0.88 + flute * 0.09 + r() * 0.02);
    },
    brick(x, y, r) {
      const row = y >> 2, off = (row & 1) * 4, joint = (y & 3) === 3 || ((x + off) & 7) === 7;
      return joint ? [0.85, 0.82, 0.76] : [0.95 + r() * 0.05, 0.9 + r() * 0.04, 0.88];
    },
    slate(x, y, r) {
      const row = y >> 2, off = (row & 1) * 3, cx = ((x + off) % 6) - 2.5, cy = (y & 3);
      let v = 0.78 + r() * 0.1; if (cx * cx * 0.25 + (cy - 3) * (cy - 3) * 0.3 > 1.6) v *= 0.72; if (cy === 0) v *= 0.8;
      return grey(v);
    },
    glass(x, y, r) {
      if (x < 2 || x > S - 3 || y < 2) return [0.96, 0.95, 0.9];
      const d = ((x + y) % 6 === 0) || ((x - y + 60) % 6 === 0);
      if (d) return [0.32, 0.34, 0.38];
      const g = 0.76 + (y < 12 ? 0.2 * (1 - y / 12) : 0) + r() * 0.04;
      return [g * 0.88, g * 0.94, g];
    },
    door(x, y, r) {
      if (x < 1 || x > S - 2 || y < 1) return grey(0.42);
      if (x % 8 === 0) return grey(0.62);
      if ((y >= 5 && y <= 7) || (y >= 23 && y <= 25)) { if (x < 12) return grey(0.25); return grey(0.74); }
      if (x >= 24 && x <= 26 && y >= 14 && y <= 16) return [0.95, 0.82, 0.35];
      return grey(0.84 + Math.sin(y * 0.7 + x) * 0.02 + r() * 0.05);
    },
    gold(x, y, r) {
      const h = Math.sin(x * 0.7) * Math.cos(y * 0.6), v = 0.84 + h * 0.14 + r() * 0.05;
      return (x + y) % 11 === 0 ? [1, 1, 0.92] : [v, v * 0.96, v * 0.82];
    },
    marble(x, y, r) {
      const vein = Math.abs(Math.sin(x * 0.18 + y * 0.31 + Math.sin(y * 0.2) * 2.2)) < 0.065;
      return vein ? grey(0.81) : grey(0.96 + r() * 0.04);
    },
    drystone(x, y, r) { const row = DSR[y]; if (row < 0) return grey(0.24 + r() * 0.05); const b = DSB[row % 8], k = cyc(b, x); if (b.includes(x)) return grey(0.28); const v = 0.72 + ((k * 5 + row * 7) % 11) / 11 * 0.22 + r() * 0.05; return grey(v); },
    coping(x, y, r) { const k = (x + ((y >> 3) & 1) * 2) % 4; if (k === 0) return grey(0.32); return grey(0.74 + ((x >> 2) * 7 % 5) * 0.04 + r() * 0.05); },
    oak(x, y, r) { const g = Math.sin(x * 0.5 + Math.sin(y * 0.15) * 3) * 0.06; return [0.86 + g + r() * 0.05, 0.84 + g, 0.8 + g]; },
    oakCarved(x, y, r) {
      const px = x & 15, py = y & 15, frame = px < 2 || py < 2;
      if (frame) return grey(0.66);
      const arch = Math.hypot(px - 8, Math.max(0, 8 - py)) < 5.5;
      return grey(arch ? 0.96 : 0.82 + r() * 0.05);
    },
    parquet(x, y, r) {
      // Checkerboard / Cartesian coordinate grid floor!
      const cell = ((x >> 4) + (y >> 4)) & 1;
      const border = (x & 15) === 0 || (y & 15) === 0;
      if (border) return grey(0.55);
      return grey(cell ? 0.94 + r() * 0.04 : 0.36 + r() * 0.04);
    },
    plaster(x, y, r) { const p = vn(x >> 2, y >> 2) * 0.03; return grey(0.94 + r() * 0.03 + p); },
    beams(x, y, r) { const j = x & 15; if (j < 5) { const g = 0.32 + r() * 0.04; return [g * 1.25, g * 0.85, g * 0.5]; } return grey(0.92 + r() * 0.04); },
    coffer(x, y, r) {
      const px = x & 15, py = y & 15, beam = px < 3 || py < 3, inner = px > 4 && py > 4 && px < 14 && py < 14;
      if (beam) return grey(0.64 + r() * 0.04);
      if (Math.hypot(px - 9, py - 9) < 2.2) return [1, 0.86, 0.44];
      return grey(inner ? 0.94 : 0.78);
    },
    carpet(x, y, r) { const b = x < 3 || x > S - 4 || y < 3 || y > S - 4; if (b) return [0.95, 0.82, 0.38]; return grey(0.84 + r() * 0.06); },
    lamp(x, y, r) { const d = ring(x, y, 15.5, 15.5); if (d > 14) return [0.25, 0.22, 0.18]; return [1, 0.94 - d * 0.015, 0.65 - d * 0.02]; },
    wool(x, y, r) { const q = ((x >> 2) + (y >> 2)) & 1; return grey(q ? 0.92 : 0.84 + r() * 0.04); },
    planks(x, y, r) { const line = (y & 7) === 7, seam = ((x + (y >> 3) * 11) & 31) === 0; const v = line || seam ? 0.62 : 0.86 + Math.sin(x * 0.6) * 0.04 + r() * 0.05; return [v, v * 0.95, v * 0.88]; },
    curtain(x, y, r) { const f = Math.sin(x * 0.8) * 0.08; return grey(0.88 + f + r() * 0.03); },
    dresser(x, y, r) {
      if (x < 2 || x > S - 3 || y % 10 === 0) return [0.42, 0.27, 0.15];
      return [0.52 + r() * 0.05, 0.35, 0.2];
    },
    moss(x, y, r) { const v = 0.76 + r() * 0.24; return [v * 0.7, v, v * 0.6]; },
    iron(x, y, r) { const rivet = (x % 8 === 2 && y % 8 === 2); return grey(rivet ? 0.95 : 0.62 + r() * 0.1); },
    balus(x, y, r) {
      if (y < 4 || y > S - 5) return grey(0.95);
      const cx = (x & 7) - 3.5, w = 2.4 - Math.sin((y - 4) / (S - 8) * Math.PI) * 1.1;
      return Math.abs(cx) < w ? grey(0.94 + r() * 0.04) : grey(0.24);
    },
    stove(x, y, r) { const t = (x & 7) === 0 || (y & 7) === 0; return t ? grey(0.55) : grey(0.86 + r() * 0.04); },
    stained(x, y, r) {
      // Glowing Philosophy Portal / Starry Astral Glass
      const d = ring(x, y, 15.5, 15.5);
      if (Math.abs(d - 12) < 1.2 || Math.abs(d - 6) < 1.0) return [1.0, 0.88, 0.42];
      const a = Math.atan2(y - 15.5, x - 15.5);
      const spoke = Math.abs(Math.sin(a * 4)) < 0.12 && d < 12;
      if (spoke) return [0.95, 0.82, 0.35];
      return [0.22 + r() * 0.08, 0.55 + r() * 0.12, 0.95];
    },
    books(x, y, r) {
      const sh = y & 15; if (sh === 0 || sh === 15) return [0.45, 0.3, 0.18];
      const k = (x >> 2) + (y > 15 ? 7 : 0), c = [[0.65, 0.18, 0.14], [0.18, 0.32, 0.58], [0.22, 0.45, 0.28], [0.75, 0.58, 0.22], [0.42, 0.24, 0.48], [0.78, 0.72, 0.6]][k % 6];
      return (sh === 3 || sh === 12) ? [0.88, 0.72, 0.32] : c.map((v) => v * (0.9 + r() * 0.1));
    },
    fire(x, y, r) {
      if (y > S - 5) return [0.24, 0.2, 0.18];
      const k = (S - 4 - y) / S + Math.sin(x * 0.8) * 0.15, f = r();
      if (f < k * 0.4) return [1, 0.95, 0.6];
      if (f < k * 0.88) return [1, 0.58 + r() * 0.2, 0.14];
      return [0.42, 0.15, 0.05];
    },
    flower(x, y, r) { if (y > S - 8) return [0.3, 0.5, 0.2]; const b = ((x * 5 + y * 3) % 9) < 3; return b ? (r() < 0.5 ? [0.95, 0.85, 0.3] : [0.85, 0.35, 0.65]) : [0.28, 0.54, 0.24]; },
    fall(x, y, r) { const s = Math.sin(x * 1.3 + Math.floor(y / 3) * 0.7); const v = 0.86 + s * 0.06 + r() * 0.08; return r() < 0.18 ? [1, 1, 1] : [v * 0.82, v * 0.92, v]; },
    tarmac(x, y, r) { return grey(0.54 + vn(x >> 2, y >> 2) * 0.06 + r() * 0.05); },
    flagstone(x, y, r) {
      const row = y < 14 ? 0 : 1, off = row ? 9 : 0, jx = ((x + off) % 18 === 0) || ((x + off) % 18 === 11 && row), jy = y === 0 || y === 14;
      if (jx || jy) return grey(0.55);
      const k = (((x + off) / 18 | 0) * 5 + row * 3) % 7;
      return grey(0.82 + k * 0.022 + r() * 0.04);
    },
    bath(x, y, r) {
      const row = y >> 3, off = (row & 1) * 10, joint = (y & 7) === 7 || ((x + off) % 20) === 19;
      return grey(joint ? 0.84 : 0.96 + r() * 0.04);
    },
    wheat(x, y, r) { const v = 0.88 + r() * 0.12; return [v, v * 0.94, v * 0.72]; },
    loom(x, y, r) { return grey(0.82 + r() * 0.08); },
    lead(x, y, r) { const seam = (x % 16) === 0; return grey(seam ? 0.7 : 0.86 + r() * 0.06); },
    hedge(x, y, r) { const v = 0.72 + r() * 0.28 - (r() < 0.15 ? 0.18 : 0); return [v * 0.78, v, v * 0.76]; },
    silk(x, y, r) { return grey(0.92 + r() * 0.05); },
    cedar(x, y, r) { const v = 0.7 + r() * 0.28; return [v * 0.85, v, v * 0.88]; },
    rug(x, y, r) {
      const d = Math.max(Math.abs(x - 15.5) * 0.8, Math.abs(y - 15.5));
      const k = Math.floor(d / 2.2) % 5;
      return [[0.65, 0.22, 0.18], [0.88, 0.74, 0.42], [0.26, 0.42, 0.56], [0.5, 0.58, 0.34], [0.86, 0.84, 0.76]][k].map((v) => v * (0.92 + r() * 0.08));
    },
    ivy(x, y, r) { const g = 0.65 + r() * 0.35; return [0.24 * g, 0.48 * g, 0.22 * g]; },
    casement(x, y, r) {
      if (x < 3 || x > S - 4 || y < 3 || y > S - 4) return [0.92, 0.89, 0.82];
      if ((x - 3) % 7 === 6 || (y - 3) % 9 === 8) return [0.26, 0.26, 0.28];
      const g = 0.74 + (y < 14 ? 0.2 * (1 - y / 14) : 0) + r() * 0.04;
      return [g * 0.86, g * 0.93, g];
    },
    yew(x, y, r) { const v = 0.58 + r() * 0.34 - (r() < 0.2 ? 0.18 : 0); return [v * 0.7, v, v * 0.78]; },
    willow(x, y, r) { const s = Math.sin(x * 1.9 + Math.floor(y / 6)) * 0.12; const v = 0.8 + s + r() * 0.16; return [v * 0.9, v, v * 0.68]; },
    sack(x, y, r) { return [0.84 + r() * 0.05, 0.74, 0.54]; },
    millstone(x, y, r) { const d = ring(x, y, 15.5, 15.5); if (d < 3) return grey(0.35); return grey(0.78 + r() * 0.08); },
    hood(x, y, r) { return grey(0.82 + r() * 0.08); },
    bottles(x, y, r) { return [0.42 + r() * 0.08, 0.28, 0.16]; }
  };

  function buildCanvas() {
    const T = root.PIWorld.T;
    const c = document.createElement('canvas'); c.width = TS * COLS; c.height = TS * ROWS;
    const ctx = c.getContext('2d'), img = ctx.createImageData(c.width, c.height);
    Object.keys(painters).forEach((name) => {
      const idx = T[name]; if (idx == null) return;
      const ox = (idx % COLS) * TS, oy = Math.floor(idx / COLS) * TS, r = rng(idx * 7919 + 13);
      for (let y = 0; y < TS; y++) for (let x = 0; x < TS; x++) {
        const col = painters[name](x, y, r), o = ((oy + y) * c.width + ox + x) * 4;
        img.data[o] = cl(col[0]); img.data[o + 1] = cl(col[1]); img.data[o + 2] = cl(col[2]); img.data[o + 3] = 255;
      }
    });
    ctx.putImageData(img, 0, 0);
    return c;
  }

  function tile(name) {
    const T = root.PIWorld.T;
    const c = document.createElement('canvas'); c.width = TS; c.height = TS;
    const ctx = c.getContext('2d'), img = ctx.createImageData(TS, TS), r = rng((T[name] || 0) * 7919 + 13);
    const fn = painters[name] || painters.slates;
    for (let y = 0; y < TS; y++) for (let x = 0; x < TS; x++) {
      const col = fn(x, y, r), o = (y * TS + x) * 4;
      img.data[o] = cl(col[0]); img.data[o + 1] = cl(col[1]); img.data[o + 2] = cl(col[2]); img.data[o + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    return c;
  }

  root.PITex = { TS, COLS, ROWS, buildCanvas, tile };
})(window);
