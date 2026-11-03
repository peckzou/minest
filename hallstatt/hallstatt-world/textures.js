/* Procedural 16×16 pixel-art texture atlas (8 cols × 4 rows) for the Hallstatt voxel world.
 * Most tiles are near-greyscale and get tinted by per-vertex colour in the mesher. */
(function (root) {
  'use strict';
  const TS = 16, COLS = 8, ROWS = 4;

  function rng(seed) {
    let a = seed | 0;
    return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  const cl = (v) => Math.max(0, Math.min(255, Math.round(v * 255)));
  const T = root.HallstattWorld.T;

  const painters = {
    // bare limestone / mountain rock: blocky strata with cracks
    rock(x, y, r) {
      let v = 0.88 + r() * 0.12;
      if ((y & 3) === 3) v -= 0.1;
      if (((x * 3 + y * 7) % 19) < 1) v -= 0.16;
      if (r() < 0.05) v += 0.07;
      return [v, v, v];
    },
    // loose scree / gravel
    scree(x, y, r) {
      const v = 0.68 + r() * 0.32;
      const d = ((x * 5 + y * 11) % 7) === 0 ? -0.12 : 0;
      return [v + d, (v + d) * 0.99, (v + d) * 0.96];
    },
    // cobblestone street
    cobble(x, y, r) {
      const row = y >> 2, off = (row & 1) * 2;
      const gx = (x + off) & 3, gy = y & 3;
      const seam = gx === 3 || gy === 3;
      const v = seam ? 0.6 : 0.86 + r() * 0.12;
      return [v, v * 0.98, v * 0.95];
    },
    // smooth plaster façade
    plaster(x, y, r) {
      let v = 0.95 + r() * 0.05;
      if (((x * 5 + y * 11) % 37) < 1) v -= 0.05;
      if (y > 13) v -= 0.02;
      return [v, v, v];
    },
    // dressed stone (church tower, plinths)
    stone(x, y, r) {
      const off = (y >> 2) * 3;
      const line = (y & 3) === 3 || ((x + off) & 7) === 7;
      const v = line ? 0.74 : 0.92 + r() * 0.06;
      return [v, v, v];
    },
    // vertical timber planking (Alpine wall accents)
    timber(x, y, r) {
      const board = (x % 3) === 2;
      const grain = Math.sin(y * 1.1 + x * 3) * 0.05;
      const v = board ? 0.6 : 0.82 + grain + r() * 0.07;
      return [v, v * 0.9, v * 0.78];
    },
    // wooden roof shingles (overlapping scales)
    shingle(x, y, r) {
      const row = y >> 2, off = (row & 1) * 2;
      const edge = (y & 3) === 0;
      const gx = (x + off) & 3;
      let v = edge ? 0.5 : 0.72 + (3 - gx) * 0.05 + r() * 0.07;
      return [v, v * 0.88, v * 0.74];
    },
    // floor / deck planks
    planks(x, y, r) {
      const line = (y & 3) === 3;
      const grain = Math.sin((x + (y >> 2) * 5) * 1.3) * 0.05;
      const v = line ? 0.55 : 0.82 + grain + r() * 0.08;
      return [v, v * 0.93, v * 0.82];
    },
    // window glass with mullions; tops lit at night via the glow material
    glass(x, y, r) {
      const border = x === 0 || y === 0 || x === 15 || y === 15 || x === 1 || x === 14;
      if (border) return [0.26, 0.2, 0.14];
      const mullion = x === 7 || x === 8 || y === 7 || y === 8;
      if (mullion) return [0.38, 0.3, 0.22];
      const g = 0.72 + (y < 6 ? 0.2 * (1 - y / 6) : 0) + r() * 0.04;
      return [g * 0.92, g, g * 0.82];
    },
    // louvered shutters
    shutter(x, y, r) {
      const slat = (y & 1) === 1;
      let v = slat ? 0.62 : 0.9 + r() * 0.06;
      if (x === 0 || x === 15) v *= 0.68;
      return [v, v, v];
    },
    // gilt church ornaments
    gold(x, y, r) {
      const v = 0.82 + r() * 0.18;
      return [Math.min(1, 1.0 * v), Math.min(1, 0.78 * v), 0.3 * v];
    },
    // slate spire
    spire(x, y, r) {
      const seam = (y & 3) === 3 || (x & 3) === 3;
      const v = seam ? 0.66 : 0.86 + r() * 0.06;
      return [v, v, Math.min(1, v + 0.03)];
    },
    // clay roof tiles (reddish, tinted per-building)
    tileR(x, y, r) {
      const row = y >> 2, off = (row & 1) * 2;
      const gx = (x + off) & 3, gy = y & 3;
      let v = 0.66 + gy * 0.08 + r() * 0.06;
      if (gx === 3) v *= 0.78;
      return [v, v * 0.96, v * 0.94];
    },
    // green glazed tile accent
    tileG(x, y, r) {
      const seam = (x & 3) === 3 || (y & 3) === 3;
      const v = seam ? 0.6 : 0.86 + r() * 0.06;
      return [v * 0.85, v, v * 0.88];
    },
    dark(x, y, r) { const v = 0.1 + r() * 0.06; return [v, v, v * 1.05]; },
    lamp(x, y, r) {
      const d = Math.hypot(x - 7.5, y - 7.5);
      if (x === 0 || y === 0 || x === 15 || y === 15) return [0.4, 0.34, 0.24];
      const v = 1 - d / 14;
      return [1, 0.86 + v * 0.12, 0.5 + v * 0.45];
    },
    // pine needles (tinted dark green per-tree)
    pine(x, y, r) {
      const v = 0.42 + r() * 0.5;
      const spike = ((x + y) % 3 === 0) ? 0.1 : 0;
      return [0.5 * v + 0.06 + spike * 0.3, 0.95 * v + 0.05 + spike, 0.4 * v + 0.05];
    },
    // tree trunk / timber log
    log(x, y, r) {
      const v = (x % 5 === 0 ? 0.6 : 0.84) + r() * 0.12;
      return [v, v * 0.86, v * 0.72];
    },
    // lake water tile (subtle, main shimmer is in the water shader)
    water(x, y, r) {
      const w = Math.sin(x * 0.8 + y * 0.5) * 0.5 + Math.sin(y * 1.2 - x * 0.4) * 0.5;
      const v = 0.8 + w * 0.08 + r() * 0.05;
      return [v * 0.7, v * 0.92, v];
    },
    // house door (timber with iron studs)
    door(x, y, r) {
      const groove = (x & 3) === 3;
      let v = groove ? 0.56 : 0.86 + r() * 0.08;
      if ((x === 11 || x === 12) && (y === 8 || y === 9)) v = 0.95;
      if (y < 2 || y > 13) v *= 0.8;
      return [v, v * 0.92, v * 0.8];
    },
    // geranium flower boxes
    flower(x, y, r) {
      const k = r();
      if (k > 0.4) { const m = (x * 3 + y * 5) % 5; return m < 3 ? [0.9, 0.2, 0.22] : m < 4 ? [0.96, 0.5, 0.3] : [0.85, 0.15, 0.35]; }
      const v = 0.4 + k * 0.6;
      return [0.18 * v + 0.08, 0.72 * v + 0.05, 0.2 * v + 0.05];
    },
    // alpine snow cap
    snow(x, y, r) {
      const v = 0.94 + r() * 0.06;
      const sp = ((x * 7 + y * 13) % 23) < 1 ? 0.0 : 0.0;
      return [v, v, Math.min(1, v + 0.02 + sp)];
    },
    // meadow grass
    grass(x, y, r) {
      const v = 0.6 + r() * 0.4;
      const blade = ((x + y * 2) % 5) === 0 ? 0.08 : 0;
      return [0.5 * v + 0.04 + blade * 0.2, 0.95 * v + 0.05 + blade, 0.4 * v + 0.04];
    },
    // split-rail fence
    fence(x, y, r) {
      const rail = (y > 4 && y < 7) || (y > 10 && y < 13) || (x < 3);
      const v = rail ? 0.78 + r() * 0.1 : 0.5 + r() * 0.06;
      return [v, v * 0.84, v * 0.68];
    }
  };

  function buildCanvas() {
    const c = document.createElement('canvas');
    c.width = TS * COLS; c.height = TS * ROWS;
    const ctx = c.getContext('2d');
    const img = ctx.createImageData(c.width, c.height);
    // transparent default (fence has holes); start cleared
    for (let i = 0; i < img.data.length; i++) img.data[i] = 0;
    Object.keys(painters).forEach((name) => {
      const idx = T[name];
      if (idx == null) return;
      const ox = (idx % COLS) * TS, oy = Math.floor(idx / COLS) * TS;
      const r = rng(idx * 7919 + 17);
      for (let y = 0; y < TS; y++) for (let x = 0; x < TS; x++) {
        const col = painters[name](x, y, r);
        const o = ((oy + y) * c.width + ox + x) * 4;
        const alpha = 255;
        img.data[o] = cl(col[0]); img.data[o + 1] = cl(col[1]); img.data[o + 2] = cl(col[2]); img.data[o + 3] = alpha;
      }
    });
    ctx.putImageData(img, 0, 0);
    return c;
  }

  root.HallstattTex = { TS, COLS, ROWS, buildCanvas };
})(window);
