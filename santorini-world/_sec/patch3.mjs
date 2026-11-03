import fs from 'node:fs';
const F = 'santorini-world/app.js';
let s = fs.readFileSync(F, 'utf8');
function rep(a, b) { if (!s.includes(a)) throw new Error('missing: ' + a.slice(0, 70)); s = s.replace(a, b); }
// Aegean palette: [t, skyTop, horizon, waterDeep, waterShallow]
const a = s.indexOf('  const KEYS = ['), b = s.indexOf('  ];', a) + 4;
s = s.slice(0, a) + `  const KEYS = [
    [0, 0x040716, 0x0c1330, 0x020b1e, 0x08203a],
    [5, 0x080f2c, 0x2a2858, 0x03122c, 0x0c2c52],
    [6.3, 0x2f5aa8, 0xf5a070, 0x0a3a74, 0x2a7aa8],
    [8, 0x2f86e8, 0xb5dcf6, 0x0452a8, 0x1ea0d8],
    [12, 0x1f78ec, 0x9fd0f8, 0x044aa6, 0x14a8dc],
    [16.5, 0x2c82e4, 0xb0d6f4, 0x0648a0, 0x1a9ed4],
    [18, 0x3a6cc8, 0xfbbc7c, 0x083c84, 0x2a82b4],
    [19.2, 0x2a2e72, 0xea6a52, 0x061f4a, 0x1a4a74],
    [20.6, 0x0c1238, 0x34305c, 0x031430, 0x0c2c52],
    [24, 0x040716, 0x0c1330, 0x020b1e, 0x08203a]
  ];` + s.slice(b);
rep("new THREE.MeshLambertMaterial({ color: 0x8a8060 })", "new THREE.MeshLambertMaterial({ color: 0x0b3f78 })");
rep("pos: new V3(128.5, 5, 102.5)", "pos: new V3(150.5, 44, 100.5)");
rep("yaw: -Math.PI / 2, pitch: 0.02", "yaw: Math.PI / 2, pitch: 0.02");
rep("p.pos.set(128.5, 8, 102.5)", "p.pos.set(150.5, 46, 100.5)");
rep("time: parseFloat(qs.get('t')) || 17.8", "time: parseFloat(qs.get('t')) || 17.4");
fs.writeFileSync(F, s); console.log('ok');
