// Reachability check: which rooms can a walker reach from the spawn (step up 1 block, fall any, doors passable, 2 m tall)
const W = require('../ns-world/world.js'); const w = W.create(); const B = w.B;
const solid = (x, y, z) => { const b = w.get(x, y, z); return b !== 0 && b !== B.DOOR; };
const free = (x, y, z) => !solid(x, y, z);
const key = (x, y, z) => x + ',' + y + ',' + z;
const s = w.spawn; let q = [[Math.floor(s.x), s.y, Math.floor(s.z)]]; const seen = new Set([key(...q[0])]);
while (q.length) { const nq = []; for (const [x, y, z] of q) { for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, nz = z + dz; if (nx < 0 || nz < 0 || nx >= w.W || nz >= w.D) continue;
  if (solid(nx, y, nz)) { if (free(nx, y + 1, nz) && free(nx, y + 2, nz)) { const k = key(nx, y + 1, nz); if (!seen.has(k)) { seen.add(k); nq.push([nx, y + 1, nz]); } } continue; }
  if (!free(nx, y + 1, nz)) continue; let ny = y; while (ny > 0 && free(nx, ny - 1, nz) && y - ny < 12) ny--; if (!solid(nx, ny - 1, nz)) continue; const k = key(nx, ny, nz); if (!seen.has(k)) { seen.add(k); nq.push([nx, ny, nz]); } } } q = nq; }
const chk = { throne: [60, 53, 94], apseTop: [45, 57, 94], balcony: [61, 53, 108], singers: [85, 60, 90], stage: [72, 61, 90], bed: [86, 53, 98], dine: [94, 53, 94], living: [75, 53, 95], grotto: [76, 53, 87], study: [72, 53, 86], corridor: [90, 53, 86], kitchen: [60, 43, 99], vestibule: [86, 43, 94], bridge: [64, 48, 140], gate: [184, 40, 96], upper: [120, 43, 96], galleryUp: [60, 60, 85], knights: [125, 43, 78], bower: [118, 43, 112], hohen: [222, 26, 138] };
let bad = 0;
for (const k in chk) { const [x, y, z] = chk[k]; let ok = false; for (let yy = y - 2; yy <= y + 4; yy++) if (seen.has(key(x, yy, z))) { ok = yy; break; } if (ok === false) bad++; console.log(k.padEnd(10), ok === false ? 'UNREACHED' : 'ok y=' + ok); }
console.log('cells', seen.size, 'unreached', bad);
