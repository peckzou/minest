/* Procedural 16×16 pixel-art texture atlas (8 cols × 4 rows) for the Venice voxel world.
 * Most tiles are near-greyscale and get tinted by per-vertex colour in the mesher. */
(function (root) {
  'use strict';
  const TS = 16, COLS = 8, ROWS = 4;

  function rng(seed) {
    let a = seed | 0;
    return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  const cl = (v) => Math.max(0, Math.min(255, Math.round(v * 255)));

  const T = root.VeniceWorld ? root.VeniceWorld.T : null;

  const painters = {
    sand(x, y, r) { const v = 0.86 + r() * 0.14 - (r() < 0.06 ? 0.15 : 0); return [v, v, v * 0.97]; },
    wall(x, y, r) {
      const row = y >> 2, off = (row & 1) * 4;
      const mortar = (y & 3) === 3 || ((x + off) & 7) === 7;
      const v = mortar ? 0.62 : 0.82 + r() * 0.14;
      return [v, v, v];
    },
    pave(x, y, r) {
      const line = (x & 7) === 0 || (y & 7) === 0;
      const v = line ? 0.72 : 0.9 + r() * 0.1;
      return [v, v, v];
    },
    plaster(x, y, r) {
      let v = 0.93 + r() * 0.07;
      if (((x * 7 + y * 13) % 29) < 2) v -= 0.07;       // stains
      if (y > 12) v -= 0.05 + r() * 0.04;               // damp near the waterline
      return [v, v, v];
    },
    stone(x, y, r) {
      const off = (y >> 3) * 5;
      const line = (y & 7) === 7 || ((x + off) & 15) === 15;
      const v = line ? 0.78 : 0.93 + r() * 0.07;
      return [v, v, v];
    },
    brick(x, y, r) {
      const row = y >> 2, off = (row & 1) * 4;
      const mortar = (y & 3) === 3 || ((x + off) & 7) === 7;
      const v = mortar ? 0.88 : 0.72 + r() * 0.22;
      return [v, v * 0.97, v * 0.95];
    },
    roof(x, y, r) {
      const row = y >> 2, off = (row & 1) * 2;
      const gx = (x + off) & 3, gy = y & 3;
      let v = 0.62 + gy * 0.12 + r() * 0.06;
      if (gx === 3) v *= 0.72;
      if (gy === 3) v *= 0.82;
      return [v, v, v];
    },
    planks(x, y, r) {
      const line = (y & 3) === 3;
      const grain = Math.sin((x + (y >> 2) * 5) * 1.3) * 0.04;
      const v = line ? 0.55 : 0.82 + grain + r() * 0.08;
      return [v, v * 0.95, v * 0.88];
    },
    glass(x, y, r) {
      const border = x === 0 || y === 0 || x === 15 || y === 15 || x === 1 || x === 14;
      const mullion = x === 7 || x === 8 || y === 7 || y === 8;
      if (border) return [0.28, 0.24, 0.2];
      if (mullion) return [0.38, 0.33, 0.28];
      const g = 0.82 + (y < 6 ? 0.18 * (1 - y / 6) : 0) + r() * 0.04;
      return [g, g, g];
    },
    shutter(x, y, r) {
      const slat = (y & 1) === 1;
      let v = slat ? 0.62 : 0.88 + r() * 0.05;
      if (x === 0 || x === 15) v *= 0.7;
      return [v, v, v];
    },
    gold(x, y, r) {
      const grid = (x & 3) === 3 || (y & 3) === 3;
      const base = grid ? 0.62 : 0.85 + r() * 0.2;
      return [Math.min(1, 1.0 * base), Math.min(1, 0.78 * base), 0.2 * base];
    },
    dome(x, y, r) {
      const seam = (y % 5) === 4 || (x & 7) === 7;
      const v = seam ? 0.66 : 0.86 + r() * 0.1;
      return [v, v, v];
    },
    diamond(x, y, r) {
      const a = x + y, b = x - y + 16;
      const c = (((a >> 3) + (b >> 3)) & 1) === 0;
      const edge = ((a & 7) === 0) || ((b & 7) === 0);
      const n = r() * 0.05;
      if (c) return edge ? [0.78, 0.46, 0.42] : [0.86 + n, 0.54 + n, 0.50 + n];
      return edge ? [0.82, 0.78, 0.72] : [0.97 - n, 0.95 - n, 0.9 - n];
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
    mosaic(x, y, r) {
      const k = r();
      const cell = ((x >> 1) + (y >> 1) * 3) % 11;
      if (cell === 3) return [0.15, 0.3, 0.6];
      if (cell === 7) return [0.7, 0.15, 0.15];
      const b = 0.8 + k * 0.25;
      return [Math.min(1, 1.0 * b), Math.min(1, 0.76 * b), 0.2 * b];
    },
    door(x, y, r) {
      const groove = (x & 3) === 3;
      let v = groove ? 0.55 : 0.82 + r() * 0.1;
      if ((x === 11 || x === 12) && (y === 8 || y === 9)) v = 1.0;
      if (y < 2 || y > 13) v *= 0.8;
      return [v, v * 0.96, v * 0.9];
    },
    flower(x, y, r) {
      const k = r();
      if (y < 6) { // flowers
        const c = (x * 3 + y * 5) % 7;
        if (k > 0.55) return c < 2 ? [0.9, 0.15, 0.2] : c < 4 ? [1, 0.85, 0.2] : [0.96, 0.5, 0.7];
      }
      const v = 0.4 + k * 0.5;
      return [0.18 * v + 0.1, 0.8 * v + 0.05, 0.2 * v + 0.05];
    },
    awnR(x, y, r) { const s = ((x >> 2) & 1) === 0; const v = 0.94 + r() * 0.05; return s ? [0.85 * v, 0.15 * v, 0.15 * v] : [v, v * 0.97, v * 0.9]; },
    awnB(x, y, r) { const s = ((x >> 2) & 1) === 0; const v = 0.94 + r() * 0.05; return s ? [0.15 * v, 0.28 * v, 0.7 * v] : [v, v * 0.97, v * 0.9]; },
    clock(x, y, r) {
      const d = Math.hypot(x - 7.5, y - 7.5);
      let c = [0.1, 0.2, 0.5];
      if (d > 5.2 && d < 6.4) c = [0.95, 0.78, 0.25];
      if (((x * 5 + y * 3) % 11) === 0) c = [0.95, 0.78, 0.25];
      if (d < 1.6) c = [1, 0.85, 0.3];
      return c;
    }
  };

  function buildCanvas() {
    const c = document.createElement('canvas');
    c.width = TS * COLS; c.height = TS * ROWS;
    const ctx = c.getContext('2d');
    const img = ctx.createImageData(c.width, c.height);
    const names = Object.keys(painters);
    names.forEach((name) => {
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

  root.VeniceTex = { TS, COLS, ROWS, buildCanvas };
})(window);
