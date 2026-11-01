/* Procedural 16×16 pixel-art texture atlas (8 cols × 4 rows) for the Santorini voxel world.
 * Most tiles are near-greyscale and get tinted by per-vertex colour in the mesher. */
(function (root) {
  'use strict';
  const TS = 16, COLS = 8, ROWS = 4;

  function rng(seed) {
    let a = seed | 0;
    return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  const cl = (v) => Math.max(0, Math.min(255, Math.round(v * 255)));
  const T = root.SantoriniWorld.T;

  const painters = {
    ash(x, y, r) { const v = 0.8 + r() * 0.2 - (r() < 0.08 ? 0.22 : 0) + (r() < 0.05 ? 0.12 : 0); return [v, v, v]; },
    strata(x, y, r) {
      let v = 0.86 + r() * 0.14;
      if (y === 5 || y === 11) v -= 0.12;
      if (((x * 3 + y * 7) % 23) < 1) v -= 0.18;
      if (r() < 0.05) v += 0.08;
      return [v, v, v];
    },
    pave(x, y, r) {
      const row = y >> 2, off = (row & 1) * 4;
      const line = (y & 3) === 3 || ((x + off) & 7) === 7;
      const v = line ? 0.78 : 0.93 + r() * 0.07;
      return [v, v, v];
    },
    plaster(x, y, r) {
      let v = 0.95 + r() * 0.05;
      if (((x * 5 + y * 11) % 31) < 1) v -= 0.05;
      if (y > 13) v -= 0.025;
      return [v, v, v];
    },
    stone(x, y, r) {
      const off = (y >> 3) * 5;
      const line = (y & 7) === 7 || ((x + off) & 15) === 15;
      const v = line ? 0.8 : 0.94 + r() * 0.06;
      return [v, v, v];
    },
    rubble(x, y, r) {
      const row = y >> 2, off = ((row * 3) & 7);
      const mortar = (y & 3) === 3 || ((x + off) & 7) === 7;
      const v = mortar ? 0.55 : 0.72 + r() * 0.28;
      return [v, v * 0.97, v * 0.94];
    },
    thatch(x, y, r) {
      const v = ((y + (x >> 2)) & 1 ? 0.82 : 0.68) + r() * 0.16;
      const streak = (x + y * 2) % 7 === 0 ? -0.1 : 0;
      return [v + streak, (v + streak) * 0.92, (v + streak) * 0.75];
    },
    planks(x, y, r) {
      const line = (y & 3) === 3;
      const grain = Math.sin((x + (y >> 2) * 5) * 1.3) * 0.04;
      const v = line ? 0.55 : 0.82 + grain + r() * 0.08;
      return [v, v * 0.95, v * 0.88];
    },
    glass(x, y, r) {
      const border = x === 0 || y === 0 || x === 15 || y === 15 || x === 1 || x === 14;
      if (border) return [0.18, 0.2, 0.26];
      const mullion = x === 7 || x === 8 || y === 7 || y === 8;
      if (mullion) return [0.3, 0.34, 0.4];
      const g = 0.72 + (y < 6 ? 0.2 * (1 - y / 6) : 0) + r() * 0.04;
      return [g * 0.8, g * 0.92, g];
    },
    shutter(x, y, r) {
      const slat = (y & 1) === 1;
      let v = slat ? 0.66 : 0.92 + r() * 0.05;
      if (x === 0 || x === 15) v *= 0.7;
      return [v, v, v];
    },
    bronze(x, y, r) {
      const v = 0.8 + r() * 0.2;
      return [Math.min(1, 0.86 * v), Math.min(1, 0.6 * v), 0.25 * v];
    },
    dome(x, y, r) {
      const seam = (x & 3) === 3;
      const hl = y < 4 ? 0.08 : 0;
      const v = seam ? 0.78 : 0.92 + r() * 0.06 + hl;
      return [v, v, Math.min(1, v + 0.04)];
    },
    tile(x, y, r) {
      const row = y >> 2, off = (row & 1) * 2;
      const gx = (x + off) & 3, gy = y & 3;
      let v = 0.62 + gy * 0.1 + r() * 0.06;
      if (gx === 3) v *= 0.75;
      return [v, v, v];
    },
    dark(x, y, r) { const v = 0.1 + r() * 0.06; return [v, v, v * 1.15]; },
    lamp(x, y, r) {
      const d = Math.hypot(x - 7.5, y - 7.5);
      if (x === 0 || y === 0 || x === 15 || y === 15) return [0.45, 0.4, 0.3];
      const v = 1 - d / 14;
      return [1, 0.9 + v * 0.1, 0.55 + v * 0.45];
    },
    leaf(x, y, r) {
      const v = 0.45 + r() * 0.5;
      return [0.45 * v + 0.12, 0.9 * v + 0.08, 0.35 * v + 0.05];
    },
    log(x, y, r) {
      const v = (x % 5 === 0 ? 0.62 : 0.85) + r() * 0.12;
      return [v, v * 0.9, v * 0.8];
    },
    pool(x, y, r) {
      const w = Math.sin(x * 0.9 + y * 0.5) * 0.5 + Math.sin(y * 1.3 - x * 0.4) * 0.5;
      const v = 0.84 + w * 0.08 + r() * 0.05;
      const spark = ((x * 7 + y * 13) % 29) < 1 ? 0.12 : 0;
      return [v + spark, v + spark, Math.min(1, v + 0.1 + spark)];
    },
    door(x, y, r) {
      const groove = (x & 3) === 3;
      let v = groove ? 0.6 : 0.88 + r() * 0.08;
      if ((x === 11 || x === 12) && (y === 8 || y === 9)) v = 1.0;
      if (y < 2 || y > 13) v *= 0.82;
      return [v, v, v];
    },
    flower(x, y, r) {
      const k = r();
      if (k > 0.35) { const m = (x * 3 + y * 5) % 5; return m < 3 ? [0.92, 0.18, 0.55] : m < 4 ? [0.98, 0.45, 0.72] : [0.75, 0.1, 0.45]; }
      const v = 0.4 + k * 0.6;
      return [0.18 * v + 0.1, 0.8 * v + 0.05, 0.2 * v + 0.05];
    },
    awnB(x, y, r) { const s = ((x >> 2) & 1) === 0; const v = 0.95 + r() * 0.05; return s ? [0.1 * v, 0.34 * v, 0.76 * v] : [v, v * 0.98, v * 0.94]; },
    awnO(x, y, r) { const s = ((x >> 2) & 1) === 0; const v = 0.95 + r() * 0.05; return s ? [0.95 * v, 0.5 * v, 0.1 * v] : [v, v * 0.98, v * 0.94]; },
    dry(x, y, r) {
      let v = 0.84 + r() * 0.16;
      if (r() < 0.06) v -= 0.18;
      if (r() < 0.04) return [0.6, 0.62, 0.3];
      return [v, v * 0.99, v * 0.96];
    },
    cobble(x, y, r) { const v = 0.85 + r() * 0.15; return [v, v, v]; }
  };

  function buildCanvas() {
    const c = document.createElement('canvas');
    c.width = TS * COLS; c.height = TS * ROWS;
    const ctx = c.getContext('2d');
    const img = ctx.createImageData(c.width, c.height);
    Object.keys(painters).forEach((name) => {
      const idx = T[name];
      if (idx == null) return;
      const ox = (idx % COLS) * TS, oy = Math.floor(idx / COLS) * TS;
      const r = rng(idx * 7919 + 13);
      for (let y = 0; y < TS; y++) for (let x = 0; x < TS; x++) {
        const col = painters[name](x, y, r);
        const o = ((oy + y) * c.width + ox + x) * 4;
        img.data[o] = cl(col[0]); img.data[o + 1] = cl(col[1]); img.data[o + 2] = cl(col[2]); img.data[o + 3] = 255;
      }
    });
    ctx.putImageData(img, 0, 0);
    return c;
  }

  root.SantoriniTex = { TS, COLS, ROWS, buildCanvas };
})(window);
