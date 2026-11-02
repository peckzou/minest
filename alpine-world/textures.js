/* Procedural 16×16 pixel-art texture atlas (8 cols × 4 rows) for the Alpine Chalet voxel world.
 * Same atlas layout and painter mechanism as the Venice / Oia ports: one painter per AlpineWorld.T key.
 * Most tiles are near-greyscale and get tinted by the per-voxel palette colour in the mesher;
 * glass, lamp, fire, flower, rug pattern and the sign carry their own colour (palette 0 = white). */
(function (root) {
  'use strict';
  const TS = 16, COLS = 8, ROWS = 4;

  function rng(seed) {
    let a = seed | 0;
    return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  const cl = (v) => Math.max(0, Math.min(255, Math.round(v * 255)));
  const T = root.AlpineWorld ? root.AlpineWorld.T : null;
  const grey = (v) => [v, v, v];

  const painters = {
    grass(x, y, r) { const v = 0.84 + r() * 0.16 - (r() < 0.07 ? 0.14 : 0); return [0.42 * v, 0.68 * v + (r() < 0.05 ? 0.05 : 0), 0.26 * v]; },
    meadow(x, y, r) {
      const v = 0.86 + r() * 0.14;
      const f = r();
      if (f < 0.035) return [1, 0.9, 0.3];        // buttercups
      if (f < 0.06) return [1, 1, 1];             // daisies
      if (f < 0.075) return [0.45, 0.4, 0.95];    // gentians
      return [0.5 * v, 0.72 * v, 0.3 * v];
    },
    grassSide(x, y, r) {
      const edge = 3 + ((x * 7) % 3 === 0 ? 1 : 0) + (r() < 0.2 ? 1 : 0);
      if (y < edge) { const v = 0.82 + r() * 0.16; return [v * 0.62, v * 0.92, v * 0.48]; }
      const v = 0.78 + r() * 0.16 - (r() < 0.08 ? 0.12 : 0); return [v * 0.8, v * 0.6, v * 0.42];
    },
    dirt(x, y, r) { const v = 0.82 + r() * 0.16 - (r() < 0.1 ? 0.14 : 0); return grey(v); },
    stone(x, y, r) {
      const crack = ((x * 3 + y * 5) % 17 === 0) || ((x + y * 7) % 23 === 0);
      const v = crack ? 0.66 : 0.84 + r() * 0.14 - ((y & 7) === 7 ? 0.06 : 0);
      return grey(v);
    },
    snow(x, y, r) { const v = 0.93 + r() * 0.07 - (r() < 0.04 ? 0.06 : 0); return [v * 0.97, v * 0.99, v]; },
    snowSide(x, y, r) {
      const edge = 4 + ((x * 5) % 4 === 0 ? 2 : 0) + (r() < 0.3 ? 1 : 0);
      if (y < edge) { const v = 0.95 + r() * 0.05; return [v * 0.97, v * 0.99, v]; }
      const v = 0.52 + r() * 0.12; return [v, v, v * 1.04];
    },
    path(x, y, r) {   // irregular flagstones
      const cell = ((x + ((y >> 2) & 1) * 3) >> 2) + (y >> 2) * 5;
      const joint = (y & 3) === 0 || ((x + ((y >> 2) & 1) * 3) & 3) === 0;
      const v = joint ? 0.6 : 0.84 + ((cell * 37) % 11) / 80 + r() * 0.06;
      return grey(v);
    },
    planks(x, y, r) {
      const line = (y & 3) === 3, seam = ((x + (y >> 2) * 6) & 15) === 0;
      const grain = Math.sin((x + (y >> 2) * 5) * 1.3) * 0.04;
      const v = line || seam ? 0.6 : 0.86 + grain + r() * 0.08;
      return [v, v * 0.95, v * 0.88];
    },
    logs(x, y, r) {   // horizontal round logs, notched
      const row = y & 3, edge = row === 0 || row === 3;
      let v = edge ? 0.68 : 0.88 + Math.sin(x * 0.9 + y) * 0.04 + r() * 0.06;
      if (row === 0) v -= 0.08;
      if ((x === 0 || x === 15) && !edge) v = 0.95;   // the cut ends at the corners
      return [v, v * 0.94, v * 0.86];
    },
    shingle(x, y, r) {   // wooden shingles, overlapping rows
      const row = y >> 2, off = (row & 1) * 2;
      const gx = (x + off) % 4, gy = y & 3;
      let v = 0.7 + gy * 0.08 + r() * 0.08;
      if (gx === 0) v *= 0.72;
      if (gy === 3) v *= 0.78;
      return grey(v);
    },
    glass(x, y, r) {
      const frame = x <= 1 || y <= 1 || x >= 14 || y >= 14;
      const cross = x === 7 || x === 8 || y === 7 || y === 8;
      if (frame) return [0.95, 0.92, 0.86];
      if (cross) return [0.88, 0.84, 0.76];
      const g = 0.78 + (y < 7 ? 0.18 * (1 - y / 7) : 0) + r() * 0.04;
      return [g * 0.9, g * 0.95, g];
    },
    shutter(x, y, r) {   // with the heart cut-out
      if (x === 0 || x === 15 || y === 0 || y === 15) return grey(0.62);
      const hx = x - 7.5, hy = y - 7;
      const heart = (hx * hx + (hy * 1.2) * (hy * 1.2) < 6) && hy > -2 || (Math.abs(hx) < 2 && hy > 0 && hy < 3 - Math.abs(hx));
      if (heart) return grey(0.3);
      return grey((y & 1) ? 0.78 : 0.94 + r() * 0.04);
    },
    door(x, y, r) {
      if (x === 0 || x === 15) return [0.55, 0.36, 0.2];
      const plank = (x & 3) === 0;
      let c = plank ? [0.48, 0.32, 0.18] : [0.66 + r() * 0.06, 0.45, 0.26];
      if ((y === 3 || y === 12) && x > 1 && x < 14) c = [0.3, 0.3, 0.32];   // iron straps
      if (x === 12 && y >= 7 && y <= 8) c = [0.86, 0.72, 0.3];             // the handle
      return c;
    },
    pine(x, y, r) { const v = 0.74 + r() * 0.26 - (r() < 0.18 ? 0.22 : 0); return [v * 0.9, v, v * 0.9]; },
    bark(x, y, r) { const v = ((x + (y >> 1)) % 4 === 0 ? 0.6 : 0.82) + r() * 0.12; return [v, v * 0.9, v * 0.8]; },
    trunkTop(x, y, r) { const d = Math.hypot(x - 7.5, y - 7.5); const v = d > 6.5 ? 0.62 : (Math.floor(d) & 1 ? 0.95 : 0.84); return [v, v * 0.86, v * 0.66]; },
    plaster(x, y, r) { let v = 0.94 + r() * 0.06; if (((x * 7 + y * 13) % 31) < 2) v -= 0.05; return grey(v); },
    lamp(x, y, r) {
      const border = x < 2 || y < 2 || x > 13 || y > 13;
      if (border) return [0.25, 0.24, 0.24];
      const d = Math.hypot(x - 7.5, y - 7.5);
      return [1, 0.9 - d * 0.03, 0.62 - d * 0.04];
    },
    flower(x, y, r) {   // geraniums in a window box
      if (y >= 12) return [0.55, 0.36, 0.2];
      if (y >= 10) return [0.25, 0.5, 0.2];
      const blossom = ((x * 5 + y * 3) % 7) < 3 && y < 9;
      return blossom ? [0.9 + r() * 0.1, 0.12, 0.18] : [0.2 + r() * 0.1, 0.48 + r() * 0.1, 0.18];
    },
    gravel(x, y, r) { const v = 0.72 + r() * 0.26 - (r() < 0.2 ? 0.16 : 0); return grey(v); },
    rug(x, y, r) {   // a woven rug: border stripes and a diamond
      const b = x < 2 || x > 13 || y < 2 || y > 13;
      const dm = Math.abs(x - 7.5) + Math.abs(y - 7.5);
      if (b) return [0.95, 0.92, 0.82];
      if (dm < 3) return [0.95, 0.8, 0.3];
      if ((dm | 0) % 3 === 0) return [0.95, 0.92, 0.82];
      return grey(0.86 + r() * 0.05);
    },
    fire(x, y, r) {   // logs and flames in the hearth
      if (y > 12) return [0.22, 0.2, 0.2];
      if (y > 10) return [0.45, 0.28, 0.14];
      const k = (12 - y) / 12 + (Math.sin(x * 1.7) * 0.15);
      const f = r();
      if (f < k * 0.35) return [1, 0.92, 0.55];
      if (f < k * 0.85) return [1, 0.55 + r() * 0.2, 0.15];
      return [0.35, 0.12, 0.05];
    },
    hay(x, y, r) { const v = 0.8 + r() * 0.2 - ((x + y * 3) % 5 === 0 ? 0.15 : 0); return [v, v * 0.92, v * 0.7]; },
    rail(x, y, r) {   // balcony railing: carved boards with a gap pattern
      const top = y < 3, bottom = y > 12, post = (x & 7) < 2;
      if (top || bottom || post) return [0.86 + r() * 0.06, 0.8, 0.72];
      const cut = Math.abs((x & 7) - 4.5) < 1.6 && y > 5 && y < 10;
      return cut ? [0.3, 0.26, 0.22] : [0.8 + r() * 0.06, 0.74, 0.66];
    },
    wool(x, y, r) { const v = 0.9 + r() * 0.08 - ((x + y) % 8 === 0 ? 0.1 : 0); return grey(v); },
    books(x, y, r) {
      if (y === 0 || y === 7 || y === 8 || y === 15) return [0.45, 0.3, 0.18];
      const k = (x >> 1) + (y > 7 ? 5 : 0), c = [[0.7, 0.2, 0.15], [0.2, 0.35, 0.6], [0.25, 0.5, 0.3], [0.8, 0.65, 0.3], [0.5, 0.3, 0.55], [0.85, 0.8, 0.7]][k % 6];
      return (x & 1) && r() < 0.5 ? c.map((v) => v * 0.8) : c;
    },
    brook(x, y, r) { const w = Math.sin(x * 0.8 + y * 0.5) * 0.06; const v = 0.84 + w + r() * 0.08; return (r() < 0.06) ? [1, 1, 1] : [v * 0.85, v * 0.95, v]; },
    dark(x, y, r) { const v = 0.5 + r() * 0.12; return grey(v); },
    sign(x, y, r) {   // the inn sign: a cheese and a mug on wood
      if (x < 1 || x > 14 || y < 2 || y > 13) return [0.4, 0.26, 0.15];
      const ch = x > 2 && x < 8 && y > 6 && y < 11 && (x + 10 - y) > 2;
      if (ch) return ((x * 3 + y) % 5 === 0) ? [0.8, 0.62, 0.2] : [0.98, 0.82, 0.32];
      const mug = x > 9 && x < 13 && y > 4 && y < 11;
      if (mug) return y < 6 ? [1, 1, 0.95] : [0.95, 0.7, 0.2];
      return [0.66 + r() * 0.06, 0.46, 0.26];
    }
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

  root.AlpineTex = { TS, COLS, ROWS, buildCanvas };
})(window);
