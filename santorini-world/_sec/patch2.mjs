import fs from 'node:fs';
const F = 'santorini-world/app.js';
let s = fs.readFileSync(F, 'utf8');
function rep(a, b) { if (!s.includes(a)) throw new Error('missing: ' + a.slice(0, 60)); s = s.replace(a, b); }
rep('/* Venezia Voxel — main application', '/* Santorini Voxel — main application');
// NPCs
rep("      if (c < world.BASE) continue;\n", "      if (c < 3) continue;\n");
rep("      const crowd = npcs.length < NPC_N * 0.5;\n      const x = crowd ? Math.floor(rr(104, 160)) : Math.floor(rr(4, world.W - 4));\n      const z = crowd ? Math.floor(rr(94, 136)) : Math.floor(rr(4, world.D - 4));\n      if (!world.land[x + world.W * z]) continue;\n      const y = surfaceAt(x, z, world.BASE);",
  "      const crowd = npcs.length < NPC_N * 0.5;\n      const x = crowd ? Math.floor(rr(132, 172)) : Math.floor(rr(100, world.W - 6));\n      const z = crowd ? Math.floor(rr(90, 158)) : Math.floor(rr(26, 188));\n      if (!world.walk[x + world.W * z]) continue;\n      const y = surfaceAt(x, z, world.hm[x + world.W * z]);");
rep("      const y = surfaceAt(nx, nz, n.y);\n      if (y < 0) continue;\n      let w = 1;", "      if (!world.walk[nx + world.W * nz]) continue;\n      const y = surfaceAt(nx, nz, n.y);\n      if (y < 0) continue;\n      let w = 1;");
// birds: gulls only
const a = s.indexOf("    for (let i = 0; i < 34; i++) {\n      const g = makePigeon()");
const b = s.indexOf("  function updateBirds");
s = s.slice(0, a) + "  }\n" + s.slice(b);
rep("gulls.push({ g, cx: rr(60, 190), cz: rr(60, 175), R: rr(18, 55), h: rr(24, 60)", "gulls.push({ g, cx: rr(40, 150), cz: rr(40, 190), R: rr(18, 55), h: rr(40, 85)");
const c = s.indexOf("    const pp = player.pos;\n    for (const b of pigeons)");
const d = s.indexOf("  /* ================= flags (Greek)");
s = s.slice(0, c) + "  }\n\n" + s.slice(d);
// remove makePigeon
const e = s.indexOf("  function makePigeon()"), f = s.indexOf("  function spawnBirds()");
s = s.slice(0, e) + s.slice(f);
rep("const gulls = [], pigeons = [];", "const gulls = [];");
fs.writeFileSync(F, s);
console.log('ok');
