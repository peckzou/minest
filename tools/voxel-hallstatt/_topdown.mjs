// Offline top-down PNG of the generated Hallstatt world (no WebGL) — proves the layout.
// Writes a minimal PNG by hand (uncompressed-ish via zlib stored blocks).
import zlib from 'node:zlib';
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const W = require('./world.js');
const w = W.create(1846);

const { W: WD, D, WATER_Y, B } = w;
const img = Buffer.alloc(WD * D * 3);
function px(x, z, r, g, b) { const o = (z * WD + x) * 3; img[o] = r; img[o + 1] = g; img[o + 2] = b; }

for (let z = 0; z < D; z++) for (let x = 0; x < WD; x++) {
  const k = x + WD * z, h = w.topH[k], b = w.topB[k];
  const pc = w.palette[w.topC[k]] || [1, 1, 1];
  let r, g, bl;
  if (h <= WATER_Y || b === B.WATER) {
    const d = Math.max(0, WATER_Y - h);
    r = 34 - d; g = 92 - d * 1.2; bl = 96 - d;
  } else {
    const nb = w.topH[Math.min(WD - 1, x + 1) + WD * Math.min(D - 1, z + 1)];
    const sh = 0.55 + Math.min(h, 60) / 60 * 0.6 - (nb > h ? 0.14 : 0);
    r = pc[0] * 255 * sh; g = pc[1] * 255 * sh; bl = pc[2] * 255 * sh;
    if (b === B.TILE_R) { r = 160 * sh; g = 82 * sh; bl = 64 * sh; }
    else if (b === B.COBBLE) { r = 150; g = 144; bl = 134; }
    else if (b === B.SNOW) { r = 242; g = 246; bl = 251; }
  }
  px(x, z, Math.max(0, Math.min(255, r | 0)), Math.max(0, Math.min(255, g | 0)), Math.max(0, Math.min(255, bl | 0)));
}
// mark landmarks
for (const l of w.landmarks) { for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) px(Math.max(0, Math.min(WD - 1, (l.x | 0) + dx)), Math.max(0, Math.min(D - 1, (l.z | 0) + dz)), 255, 60, 60); }

// encode PNG (truecolor, filter 0 per scanline)
function png(width, height, rgb) {
  const raw = Buffer.alloc((width * 3 + 1) * height);
  for (let y = 0; y < height; y++) { raw[y * (width * 3 + 1)] = 0; rgb.copy(raw, y * (width * 3 + 1) + 1, y * width * 3, (y + 1) * width * 3); }
  const idat = zlib.deflateSync(raw);
  const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const t = Buffer.from(type); const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t, data])) >>> 0); return Buffer.concat([len, t, data, crc]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4); ihdr[8] = 8; ihdr[9] = 2;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}
const CRC = (() => { const t = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc32(buf) { let c = 0xffffffff; for (let i = 0; i < buf.length; i++) c = CRC[(c ^ buf[i]) & 0xff] ^ (c >>> 8); return c ^ 0xffffffff; }

fs.writeFileSync('/tmp/hallstatt_top.png', png(WD, D, img));
console.log('wrote /tmp/hallstatt_top.png', WD + 'x' + D, 'buildings', w.buildings.length);
