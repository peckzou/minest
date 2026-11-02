/* Neuschwanstein — procedural pixel-art texture atlas (8 x 8 tiles of 32 px), painted in code (no files, nothing to attribute).
 * One painter per NSWorld.T key. Most tiles are near-white or greyscale and get tinted by the per-voxel palette colour in the
 * mesher (limestone, slate, plaster, gold, oak); glass, lamp, fire, flowers, mosaic, the vault stars and the books carry colour. */
(function (root) {
  'use strict';
  const TS = 32, COLS = 8, ROWS = 8, S = TS;
  function rng(seed) { let a = seed | 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const cl = (v) => Math.max(0, Math.min(255, Math.round(v * 255)));
  const T = root.NSWorld ? root.NSWorld.T : null;
  const grey = (v) => [v, v, v];
  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const ring = (x, y, cx, cy) => Math.hypot(x - cx, y - cy);

  const painters = {
    grass(x, y, r) { const v = 0.84 + r() * 0.16 - (r() < 0.07 ? 0.14 : 0); return [0.4 * v, 0.66 * v + (r() < 0.05 ? 0.05 : 0), 0.26 * v]; },
    meadow(x, y, r) { const v = 0.86 + r() * 0.14, f = r(); if (f < 0.02) return [1, 0.9, 0.3]; if (f < 0.04) return [1, 1, 1]; if (f < 0.05) return [0.55, 0.45, 0.95]; return [0.48 * v, 0.7 * v, 0.3 * v]; },
    grassSide(x, y, r) { const edge = 6 + ((x * 7) % 3 === 0 ? 2 : 0) + (r() < 0.2 ? 1 : 0); if (y < edge) { const v = 0.82 + r() * 0.16; return [v * 0.6, v * 0.9, v * 0.46]; } const v = 0.78 + r() * 0.16 - (r() < 0.08 ? 0.12 : 0); return [v * 0.78, v * 0.6, v * 0.44]; },
    dirt(x, y, r) { const v = 0.8 + r() * 0.16 - (r() < 0.1 ? 0.14 : 0); return [v * 0.72, v * 0.56, v * 0.4]; },
    rock(x, y, r) {   // grey limestone crag with strata
      const strata = Math.sin(y * 0.55 + Math.sin(x * 0.3) * 1.4) * 0.06, crack = ((x * 3 + y * 5) % 29 === 0) || ((x + y * 7) % 37 === 0);
      return grey(crack ? 0.6 : 0.82 + strata + r() * 0.1);
    },
    snow(x, y, r) { const v = 0.93 + r() * 0.07; return [v * 0.97, v * 0.99, v]; },
    snowSide(x, y, r) { if (y < 8 + (r() < 0.3 ? 2 : 0)) return grey(0.96); return grey(0.6 + r() * 0.1); },
    path(x, y, r) {   // cobbles
      const cx = (x + ((y >> 3) & 1) * 4) & 7, cy = y & 7, d = Math.hypot(cx - 3.5, cy - 3.5);
      return grey(d > 3.6 ? 0.52 : 0.82 + ((((x + 4 * ((y >> 3) & 1)) >> 3) * 13 + (y >> 3) * 7) % 9) / 60 + r() * 0.05 - d * 0.02);
    },
    gravel(x, y, r) { const v = 0.72 + r() * 0.26 - (r() < 0.2 ? 0.16 : 0); return grey(v); },
    pine(x, y, r) { const v = 0.72 + r() * 0.28 - (r() < 0.2 ? 0.25 : 0); return [v * 0.88, v, v * 0.9]; },
    beech(x, y, r) { const v = 0.74 + r() * 0.26 - (r() < 0.16 ? 0.22 : 0); return [v * 0.95, v, v * 0.82]; },
    bark(x, y, r) { const v = ((x + (y >> 2)) % 6 === 0 ? 0.6 : 0.82) + r() * 0.12; return [v, v * 0.9, v * 0.8]; },
    trunkTop(x, y, r) { const d = ring(x, y, 15.5, 15.5); const v = d > 13 ? 0.62 : (Math.floor(d / 2) & 1 ? 0.95 : 0.84); return [v, v * 0.86, v * 0.66]; },
    brook(x, y, r) { const w = Math.sin(x * 0.4 + y * 0.25) * 0.06; const v = 0.84 + w + r() * 0.08; return r() < 0.06 ? [1, 1, 1] : [v * 0.45, v * 0.75, v * 0.85]; },
    fall(x, y, r) { const s = Math.sin(x * 1.3 + Math.floor(y / 3) * 0.7); const v = 0.86 + s * 0.06 + r() * 0.08; return r() < 0.18 ? [1, 1, 1] : [v * 0.82, v * 0.92, v]; },
    ashlar(x, y, r) {   // the white limestone of the Palas: cut blocks in courses
      const row = y >> 3, off = (row & 1) * 8, joint = (y & 7) === 7 || ((x + off) & 15) === 15;
      const blk = (((x + off) >> 4) * 31 + row * 17) % 7;
      return grey(joint ? 0.8 : 0.95 + blk * 0.006 + r() * 0.04 - (r() < 0.03 ? 0.05 : 0));
    },
    limeSmooth(x, y, r) { return grey(0.96 + r() * 0.04 - (y === 0 || y === S - 1 ? 0.06 : 0)); },
    limeCarved(x, y, r) {   // a carved band: a row of round arches (the Romanesque frieze)
      if (y < 3 || y > S - 4) return grey(0.9 + r() * 0.04);
      const cx = (x & 7) - 3.5, ay = y - 8, inArch = cx * cx + (ay < 0 ? ay * ay : 0) < 9 && y < S - 6;
      return grey(inArch ? 0.74 + r() * 0.04 : 0.97 + r() * 0.03);
    },
    brick(x, y, r) { const row = y >> 2, off = (row & 1) * 4, joint = (y & 3) === 3 || ((x + off) & 7) === 7; return joint ? [0.86, 0.82, 0.76] : [0.95 + r() * 0.05, 0.92 + r() * 0.04, 0.9]; },
    slate(x, y, r) {   // scalloped slate (fish-scale)
      const row = y >> 2, off = (row & 1) * 3, cx = ((x + off) % 6) - 2.5, cy = (y & 3);
      let v = 0.78 + r() * 0.1; if (cx * cx * 0.25 + (cy - 3) * (cy - 3) * 0.3 > 1.6) v *= 0.72; if (cy === 0) v *= 0.8;
      return grey(v);
    },
    glass(x, y, r) {   // leaded glass in a stone frame: small diamonds
      if (x < 2 || x > S - 3 || y < 2) return [0.96, 0.95, 0.9];
      const d = ((x + y) % 6 === 0) || ((x - y + 60) % 6 === 0);
      if (d) return [0.32, 0.32, 0.34];
      const g = 0.74 + (y < 12 ? 0.2 * (1 - y / 12) : 0) + r() * 0.05;
      return [g * 0.88, g * 0.94, g];
    },
    door(x, y, r) {   // a heavy oak door with gilded fittings
      if (x < 2 || x > S - 3) return [0.36, 0.22, 0.12];
      const plank = (x % 6) === 0; let c = plank ? [0.36, 0.23, 0.13] : [0.52 + r() * 0.05, 0.34, 0.19];
      if ((y === 6 || y === 7 || y === 24 || y === 25) && x > 2 && x < S - 3) c = [0.88, 0.7, 0.3];
      if (x === 24 && y >= 14 && y <= 17) c = [0.96, 0.8, 0.36];
      return c;
    },
    gold(x, y, r) {   // gilding: highlights and darker relief
      const h = Math.sin(x * 0.7) * Math.cos(y * 0.6), v = 0.82 + h * 0.14 + r() * 0.06;
      return (x + y) % 11 === 0 ? [1, 1, 0.9] : [v, v * 0.96, v * 0.86];
    },
    marble(x, y, r) {   // white marble with veins
      const vein = Math.abs(Math.sin(x * 0.18 + y * 0.31 + Math.sin(y * 0.2) * 2.2)) < 0.07;
      return vein ? grey(0.78) : grey(0.95 + r() * 0.05);
    },
    porphyry(x, y, r) { const v = 0.82 + r() * 0.18; return r() < 0.12 ? [1, 0.9, 0.85] : [v, v * 0.94, v * 0.92]; },
    lapis(x, y, r) { const v = 0.8 + r() * 0.2; return r() < 0.06 ? [1, 0.92, 0.6] : [v * 0.95, v * 0.97, v]; },   // with the pyrite flecks
    oak(x, y, r) { const g = Math.sin(x * 0.5 + Math.sin(y * 0.15) * 3) * 0.06; return [0.86 + g + r() * 0.05, 0.84 + g, 0.8 + g]; },
    oakCarved(x, y, r) {   // carved panels with gothic tracery
      const px = x & 15, py = y & 15, frame = px < 2 || py < 2;
      if (frame) return grey(0.66);
      const arch = Math.hypot(px - 8, Math.max(0, 8 - py)) < 5.5, tr = Math.abs(px - 8) < 1 && py > 4;
      return grey(arch ? (tr ? 0.7 : 0.98) : 0.82 + r() * 0.05);
    },
    parquet(x, y, r) {   // herringbone parquet
      const u = (x + y) & 15, v = (x - y + 64) & 15, a = ((Math.floor((x + y) / 8) + Math.floor((x - y + 64) / 8)) & 1);
      const line = a ? u === 0 : v === 0; const g = 0.86 + Math.sin((a ? x : y) * 0.9) * 0.04 + r() * 0.05;
      return line ? grey(0.62) : [g, g * 0.96, g * 0.9];
    },
    plaster(x, y, r) {   // painted wall with a stencilled pattern (lilies)
      const px = (x + ((y >> 4) & 1) * 8) & 15, py = y & 15, f = Math.hypot(px - 8, py - 8) < 2.2 || (Math.abs(px - 8) < 0.8 && py > 8 && py < 13);
      return grey(f ? 0.78 : 0.95 + r() * 0.04);
    },
    vault(x, y, r) {   // the starry vault: deep blue with gold stars (carries its own colour: used with palette 0)
      const sx = x & 15, sy = y & 15, d = Math.abs(sx - 8) + Math.abs(sy - 8), st = d < 2 || (sx === 8 && Math.abs(sy - 8) < 4) || (sy === 8 && Math.abs(sx - 8) < 4);
      return st ? [1, 0.86, 0.42] : [0.16 + r() * 0.03, 0.24 + r() * 0.03, 0.58 + r() * 0.05];
    },
    coffer(x, y, r) {   // coffered ceiling: deep square panels with a gilded rosette
      const px = x & 15, py = y & 15, beam = px < 3 || py < 3, inner = px > 4 && py > 4 && px < 14 && py < 14;
      if (beam) return grey(0.62 + r() * 0.04);
      if (Math.hypot(px - 9, py - 9) < 2.2) return [1, 0.86, 0.44];
      return grey(inner ? 0.92 : 0.78);
    },
    carpet(x, y, r) { const b = x < 3 || x > S - 4; if (b) return [0.95, 0.8, 0.35]; return [0.75 + r() * 0.05, 0.14, 0.14]; },
    lamp(x, y, r) { const d = ring(x, y, 15.5, 15.5); if (d > 14) return [0.25, 0.22, 0.18]; return [1, 0.92 - d * 0.02, 0.62 - d * 0.02]; },
    wool(x, y, r) { const q = ((x >> 2) + (y >> 2)) & 1; return grey(q ? 0.92 : 0.84 + r() * 0.04); },   // quilted
    planks(x, y, r) { const line = (y & 7) === 7, seam = ((x + (y >> 3) * 11) & 31) === 0; const v = line || seam ? 0.6 : 0.86 + Math.sin(x * 0.6) * 0.04 + r() * 0.06; return [v, v * 0.95, v * 0.88]; },
    curtain(x, y, r) { const f = Math.sin(x * 0.8) * 0.08; const pat = ((x >> 3) + (y >> 3)) & 1 && Math.hypot((x & 7) - 3.5, (y & 7) - 3.5) < 1.6; return pat ? [1, 0.9, 0.6] : grey(0.88 + f + r() * 0.03); },
    tuff(x, y, r) { const v = 0.7 + r() * 0.28 - (vn(x, y) < 0.3 ? 0.2 : 0); return grey(v); },
    moss(x, y, r) { const v = 0.75 + r() * 0.25; return [v * 0.7, v, v * 0.6]; },
    iron(x, y, r) { const rivet = (x % 8 === 2 && y % 8 === 2); return grey(rivet ? 0.95 : 0.6 + r() * 0.1 - ((y & 7) === 0 ? 0.1 : 0)); },
    balus(x, y, r) {   // stone balustrade: little columns
      if (y < 4 || y > S - 5) return grey(0.95);
      const cx = (x & 7) - 3.5, w = 2.4 - Math.sin((y - 4) / (S - 8) * Math.PI) * 1.1;
      return Math.abs(cx) < w ? grey(0.94 + r() * 0.04) : grey(0.22);
    },
    stove(x, y, r) { const t = (x & 7) === 0 || (y & 7) === 0; return t ? grey(0.55) : grey(0.85 + Math.hypot((x & 7) - 4, (y & 7) - 4) * -0.04 + r() * 0.04); },
    mural(x, y, r) { const v = 0.8 + Math.sin(x * 0.3) * Math.cos(y * 0.2) * 0.1 + r() * 0.05; return [v, v * 0.9, v * 0.75]; },
    books(x, y, r) {
      const sh = y & 15; if (sh === 0 || sh === 15) return [0.45, 0.3, 0.18];
      const k = (x >> 2) + (y > 15 ? 7 : 0), c = [[0.6, 0.18, 0.14], [0.2, 0.3, 0.55], [0.25, 0.42, 0.28], [0.7, 0.55, 0.25], [0.4, 0.25, 0.45], [0.75, 0.7, 0.6]][k % 6];
      return (sh === 3 || sh === 12) ? [0.85, 0.7, 0.3] : c.map((v) => v * (0.9 + r() * 0.1));
    },
    fire(x, y, r) { if (y > S - 6) return [0.22, 0.2, 0.2]; if (y > S - 10) return [0.45, 0.28, 0.14]; const k = (S - 6 - y) / S + Math.sin(x * 0.8) * 0.15, f = r(); if (f < k * 0.35) return [1, 0.92, 0.55]; if (f < k * 0.85) return [1, 0.55 + r() * 0.2, 0.15]; return [0.35, 0.12, 0.05]; },
    flower(x, y, r) { if (y > S - 8) return [0.3, 0.5, 0.2]; const b = ((x * 5 + y * 3) % 9) < 3; return b ? (r() < 0.5 ? [0.95, 0.85, 0.3] : [0.85, 0.3, 0.6]) : [0.25, 0.5, 0.2]; },
    mosaic(x, y, r) {   // the Throne Hall floor: tesserae in rings and a border of animals' leaves (abstracted)
      const px = x & 15, py = y & 15, d = ring(px, py, 7.5, 7.5);
      const ringI = Math.floor(d / 2.2), pal = [[0.95, 0.85, 0.5], [0.3, 0.45, 0.75], [0.85, 0.85, 0.82], [0.7, 0.3, 0.25], [0.35, 0.55, 0.4], [0.9, 0.88, 0.84]];
      const c = pal[Math.min(ringI, 5)], grout = ((x + y) & 1) && r() < 0.15;
      return grout ? grey(0.6) : c.map((v) => v * (0.92 + r() * 0.08));
    },
    goldMosaic(x, y, r) { const t = (x & 1) === 0 && (y & 1) === 0; const v = 0.86 + r() * 0.14; return t ? [0.6, 0.48, 0.2] : [v, v * 0.92, v * 0.62]; }
  };
  function vn(x, y) { const h = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453; return h - Math.floor(h); }

  function buildCanvas() {
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
  root.NSTex = { TS, COLS, ROWS, buildCanvas };
})(window);
