import fs from 'node:fs';
const F = 'santorini-world/app.js';
let s = fs.readFileSync(F, 'utf8');
const rd = (n) => fs.readFileSync('santorini-world/_sec/' + n, 'utf8');
function between(a, b, text) {
  const i = s.indexOf(a), j = s.indexOf(b);
  if (i < 0 || j < 0 || j < i) throw new Error('marker not found: ' + a + ' / ' + b);
  s = s.slice(0, i) + text + s.slice(j);
}
// renames
s = s.replace(/VeniceWorld/g, 'SantoriniWorld').replace(/VeniceTex/g, 'SantoriniTex').replace(/VeniceMesher/g, 'SantoriniMesher')
  .replace(/VeniceModels/g, 'SantoriniModels').replace(/__venice/g, '__santorini')
  .replace(/gondolas/g, 'rideBoats').replace(/gondola/g, 'boat').replace(/0\.0036/g, '0.0028');
between('  /* ================= boats ================= */', '  /* ================= people', rd('boats.js'));
between('  /* ================= flags ================= */', '  /* ================= external glTF', rd('props.js'));
between('  /* ================= landmarks / teleports', '  /* ================= modes', rd('tele.js'));
const k = s.indexOf('  /* ================= boot');
if (k < 0) throw new Error('boot marker');
s = s.slice(0, k) + rd('boot.js');
fs.writeFileSync(F, s);
console.log('spliced, lines:', s.split('\n').length);
