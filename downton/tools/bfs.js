// Reachability check: which rooms can a walker reach from the spawn (step up 1 block, fall any, doors passable, 2 m tall)
const W = require('../da-world/world.js'); const w = W.create(); const B = w.B;
const solid = (x, y, z) => { const b = w.get(x, y, z); return b !== 0 && b !== B.DOOR; };
const free = (x, y, z) => !solid(x, y, z);
const key = (x, y, z) => x + ',' + y + ',' + z;
const s = w.spawn; let q = [[Math.floor(s.x), s.y, Math.floor(s.z)]]; const seen = new Set([key(...q[0])]);
while (q.length) { const nq = []; for (const [x, y, z] of q) { for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, nz = z + dz; if (nx < 0 || nz < 0 || nx >= w.W || nz >= w.D) continue;
  if (solid(nx, y, nz)) { if (free(nx, y + 1, nz) && free(nx, y + 2, nz)) { const k = key(nx, y + 1, nz); if (!seen.has(k)) { seen.add(k); nq.push([nx, y + 1, nz]); } } continue; }
  if (!free(nx, y + 1, nz)) continue; let ny = y; while (ny > 0 && free(nx, ny - 1, nz) && y - ny < 12) ny--; if (!solid(nx, ny - 1, nz)) continue; const k = key(nx, ny, nz); if (!seen.has(k)) { seen.add(k); nq.push([nx, ny, nz]); } } } q = nq; }
const chk = { forecourt: [128, 37, 80], entrance: [128, 41, 98], saloon: [128, 41, 115], library1: [110, 41, 114], library2: [110, 41, 131], dining: [110, 41, 103], study: [146, 41, 102], music: [128, 41, 131], drawing: [146, 41, 131], stairsFoot: [138, 41, 114], landing: [146, 45, 114], gallery: [138, 48, 114], saloonGallery: [128, 48, 108], bedN: [146, 48, 102], bedS: [146, 48, 131], bedW: [110, 48, 131], corridorW: [110, 48, 114], southLawn: [128, 37, 160], garden: [180, 37, 115], heaven: [36, 50, 40], jackdaws: [182, 37, 205], fountain: [128, 37, 66] };
let bad = 0;
for (const k in chk) { const [x, y, z] = chk[k]; let ok = false; for (let yy = y - 2; yy <= y + 4; yy++) if (seen.has(key(x, yy, z))) { ok = yy; break; } if (ok === false) bad++; console.log(k.padEnd(10), ok === false ? 'UNREACHED' : 'ok y=' + ok); }
console.log('cells', seen.size, 'unreached', bad);
