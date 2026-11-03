// Dev helper: node venice-world/tools-topdown.js out.png  — renders a top-down map of the generated world.
const fs = require('fs'), zlib = require('zlib');
const V = require('./world.js');
const t0 = Date.now();
const w = V.create(1597);
console.log('create ms', Date.now() - t0, 'houses', w.houses.length, 'palette', w.palette.length, 'lamps', w.lamps.length);
const S = 4, W = w.W, D = w.D;
const img = Buffer.alloc(W * S * D * S * 4);
const tint = { 1: [200, 185, 140], 2: null, 3: [150, 150, 150] };
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const i = x + W * z;
  const h = w.topH[i], b = w.topB[i], c = w.palette[w.topC[i]] || [1, 1, 1];
  let col;
  if (b === V.B.SAND || h <= 1) col = [30, 90, 110];
  else {
    const k = 0.55 + Math.min(h, 40) / 40 * 0.6;
    col = [c[0] * 255 * k, c[1] * 255 * k, c[2] * 255 * k];
    if (b === V.B.GLASS) col = [60, 80, 120];
  }
  for (let dy = 0; dy < S; dy++) for (let dx = 0; dx < S; dx++) {
    const o = ((z * S + dy) * W * S + x * S + dx) * 4;
    img[o] = Math.min(255, col[0]); img[o + 1] = Math.min(255, col[1]); img[o + 2] = Math.min(255, col[2]); img[o + 3] = 255;
  }
}
function png(width, height, rgba) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) { raw[y * (width * 4 + 1)] = 0; rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4); }
  const crcT = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; crcT[n] = c >>> 0; }
  const crc = (b) => { let c = 0xffffffff; for (const v of b) c = crcT[(c ^ v) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (t, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
fs.writeFileSync(process.argv[2] || 'topdown.png', png(W * S, D * S, img));
