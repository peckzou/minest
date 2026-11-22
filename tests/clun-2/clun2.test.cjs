// Clun 室内 2.0 (spatial-home/clun-2/): the page is a layer over the unchanged 1.0 Clun scripts; every room door starts
// open except the study and the sun room (peck's "studio": the room at the back-left that reaches into the garden), an
// open door is drawn open, both stay clickable, and nothing stands in a doorway.
// node tests/clun-2/clun2.test.cjs → "clun-2: ok"
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const R = path.join(__dirname, '..', '..'), rd = p => fs.readFileSync(path.join(R, p), 'utf8');
const html = rd('spatial-home/clun-2/index.html'), html1 = rd('spatial-home/clun/index.html');

// ---------------------------------------------------------------- 1 · the page and the 1.0 scripts
const srcs = h => [...h.matchAll(/<script src="([^"?]+)/g)].map(m => m[1]);
const ONE = srcs(html1), TWO = srcs(html);
assert(/<base href="\.\.\/clun\/">/.test(html), 'relative addresses resolve in the 1.0 folder, so its scripts and pictures load as they are');
assert.deepStrictEqual(TWO.filter(s => !/clun-2|^\.\.\/js\//.test(s)), ONE, 'every 1.0 script, in the 1.0 order');
assert.deepStrictEqual(TWO.filter(s => /^\.\.\/js\//.test(s)), ['../js/home-store.js', '../js/home-defaults.js'], 'the rooms\' synced store and the default things editor (shared with Spatial Home)');
assert.deepStrictEqual(TWO.filter(s => /clun-2/.test(s)), ['../clun-2/v2-kit.js', '../clun-2/v2-rooms.js', '../clun-2/v2-objects.js', '../clun-2/v2-live.js']);
assert(TWO.indexOf('../clun-2/v2-objects.js') < TWO.indexOf('js/app.js') && TWO.indexOf('../js/home-defaults.js') < TWO.indexOf('../clun-2/v2-objects.js'), 'the things layer comes before the 1.0 app (it notes the canvas and camera the app makes), after the store and editor');
assert(TWO.indexOf('js/furnish.js') < TWO.indexOf('../clun-2/v2-kit.js') && TWO.indexOf('../clun-2/v2-rooms.js') < TWO.indexOf('js/model.js') && TWO.indexOf('js/app.js') < TWO.indexOf('../clun-2/v2-live.js'),
  '2.0 wraps the furnishing before the model is built, and adds its live layer after the app starts');
TWO.forEach(s => assert(fs.existsSync(path.join(R, 'spatial-home/clun', s)), s + ' exists'));
assert(!fs.existsSync(path.join(R, 'spatial-home/clun-2/js')), '2.0 keeps no copy of the 1.0 scripts');
assert(!rd('.vercelignore').split('\n').some(l => /^\/?spatial-home/.test(l)), 'spatial-home/ is deployed');

// ---------------------------------------------------------------- 2 · build the house (three.js + 1.0 + 2.0, no browser)
const ctx2d = new Proxy({}, { get: (t, k) => k === 'measureText' ? () => ({ width: 10 }) : /^create.*Gradient$|^createPattern$/.test(k) ? () => ({ addColorStop() {} })
  : k === 'getImageData' || k === 'createImageData' ? (a, b, w, h) => ({ data: new Uint8ClampedArray((w || a) * (h || b) * 4) }) : k in t ? t[k] : () => {}, set: (t, k, v) => (t[k] = v, true) });
const win = { document: { createElement: () => ({ getContext: () => ctx2d, style: {}, width: 0, height: 0 }), createElementNS: () => ({ getContext: () => ctx2d, style: {} }) },
  console, Math, performance: { now: () => 0 }, location: { search: '' }, navigator: { userAgent: 'node' }, addEventListener() {}, setTimeout, clearTimeout };
win.window = win; win.self = win; vm.createContext(win);
const run = f => vm.runInContext(rd(f), win, { filename: f });
run('vendor/three.min.js');
const upto = TWO.indexOf('../clun-2/v2-rooms.js');
TWO.slice(1, upto + 1).concat('js/model.js').forEach(s => run(path.posix.join('spatial-home/clun', s)));   // not the page's own scripts (painterly, hero, plate, app): they need a screen
const C = win.Clun, V2 = C.V2, THREE = win.THREE, P = C.P;
const root = C.build('final'); root.updateMatrixWorld(true);

// ---------------------------------------------------------------- 3 · the doors
const DEG = 180 / Math.PI, swing = d => Math.round((d.pivot.rotation.z - d.base) * DEG);
const keys = [...new Set(Array.from(C.doors).map(d => d.key))];
assert.strictEqual(C.doors.length, 15, 'the 13 room doors of 1.0, and the pair of glazed doors 2.0 hangs in the drawing room → sun room opening');
assert(C.doors.every(d => d.key && d.room && V2.room(d.room)), 'every door has its key and the room it leads into');
assert.deepStrictEqual(Object.keys(V2.CLOSED).sort(), ['0:sun', '1:0:1'], 'two doors start closed');
assert.deepStrictEqual(Array.from(C.doors).filter(d => !d.open).map(d => d.room), ['study', 'sun', 'sun'], 'the study and the sun room; every other door starts open');
C.doors.forEach(d => {
  assert.strictEqual(d.a, d.open ? 1 : 0, d.key + ' is not caught mid-swing');
  assert.strictEqual(Math.abs(swing(d)), d.open ? 82 : 0, d.key + (d.open ? ' is drawn open, at the angle 1.0 opens a door to' : ' is drawn shut'));
});
assert.deepStrictEqual(keys.filter(k => !V2.CLOSED[k]).length, 12);
// the sun room doors: in the rear wall opening 1.0 leaves empty, meeting in the middle, opening into the sun room
const sun = Array.from(C.doors).filter(d => d.key === '0:sun'), op = C.openings().g['rear.s'].filter(o => o.kind === 'open')[0];
assert(op && op.c[0] === -3.5 && op.w === 1.4, 'the opening 1.0 has between the drawing room and the sun room');
assert.deepStrictEqual(sun.map(d => +d.pivot.position.x.toFixed(3)).sort(), [-3.5 - 0.695, -3.5 + 0.695].sort(), 'hinged on the two jambs');
sun.forEach(d => assert(Math.abs(d.pivot.position.y - P.mainDepth) < 0.1 && d.pivot.name === 'door', 'in the rear wall, and a door to plate.js (which finds a tapped door by that name)'));
const tip = d => d.pivot.localToWorld(new THREE.Vector3(0.69, 0, 1));           // world is three's (x, z, −y)
sun.forEach(d => assert(Math.abs(tip(d).x + 3.5) < 0.02, 'shut, the two leaves meet in the middle of the opening'));
// 1.0 opens and shuts a door with `d.open = !d.open` on the one it finds: the pair moves together
sun[0].open = !sun[0].open; assert(sun[0].open && sun[1].open, 'opening one leaf opens both');
sun.forEach(d => { d.pivot.rotation.z = d.base + d.side * 82 / DEG; d.pivot.updateMatrixWorld(true); assert(-tip(d).z > P.mainDepth + 0.5, 'and they swing out into the sun room'); });
sun[1].open = !sun[1].open; assert(!sun[0].open && !sun[1].open, 'and shutting one shuts both');
sun.forEach(d => { d.pivot.rotation.z = d.base; d.pivot.updateMatrixWorld(true); });
const study = C.doors.filter(d => d.key === '1:0:1')[0]; study.open = !study.open; assert(study.open, 'the study door opens when asked'); study.open = false;

// ---------------------------------------------------------------- 4 · nothing in a doorway or behind an open door
const solids = []; root.traverse(o => { if (o.isMesh && !/^rug:|^art:/.test(o.name) && !/^glass/.test(o.userData.mat || '')) solids.push(o); });
const ray = new THREE.Raycaster(), E = (x, y, z) => root.localToWorld(new THREE.Vector3(x, y, z));
const inLeaf = (o, d) => { for (; o; o = o.parent) if (o === d.pivot) return true; return false; };
const hits = (a, b, skip) => { const dir = b.clone().sub(a), L = dir.length(); ray.set(a, dir.normalize()); ray.far = L; return Array.from(ray.intersectObjects(solids, false)).filter(h => !skip || !skip(h.object)).map(h => h.object.userData.mat || h.object.name); };
C.doors.filter(d => d.open).forEach(d => {
  const lw = d.key === '0:sun' ? 0.69 : P.doorW - 0.03;
  [0.25, 0.9, 1.6].forEach(z => [-1, 1].forEach(s => {                         // the open leaf, both faces, hinge to edge
    const h = hits(d.pivot.localToWorld(new THREE.Vector3(0.05, s * 0.06, z)), d.pivot.localToWorld(new THREE.Vector3(lw + 0.02, s * 0.06, z)), o => inLeaf(o, d));
    assert.deepStrictEqual(h, [], 'the open ' + d.room + ' door swings clear of the furniture');
  }));
  const p = d.pivot.position, ux = Math.cos(d.base), uy = Math.sin(d.base), cx = p.x + ux * P.doorW / 2, cy = p.y + uy * P.doorW / 2;
  [0.56, 1.1].forEach(h => {                                                   // the two heights plate.js tests a step at
    const w = hits(E(cx + uy * 0.45, cy - ux * 0.45, p.z + h), E(cx - uy * 0.45, cy + ux * 0.45, p.z + h));
    assert.deepStrictEqual(w, [], 'the way through the ' + d.room + ' door is clear');
  });
});
// a closed door stops you: plate.js casts its two rays at one point, so the pair of leaves must not leave a slit down the middle
[0.56, 1.1].forEach(h => {
  assert(hits(E(-3.5, P.mainDepth - 0.6, h), E(-3.5, P.mainDepth + 0.4, h)).length, 'no way through between the two closed sun room leaves');
  const d = study.pivot.position, ux = Math.cos(study.base), uy = Math.sin(study.base), cx = d.x + ux * P.doorW / 2, cy = d.y + uy * P.doorW / 2;
  assert(hits(E(cx + uy * 0.45, cy - ux * 0.45, d.z + h), E(cx - uy * 0.45, cy + ux * 0.45, d.z + h)).length, 'no way through the closed study door');
});
// the snug → kitchen opening has no door; in 1.0 the kitchen's tall cupboards stand across it
const kop = C.openings().g.north.filter(o => o.kind === 'open')[0], W = P.mainHalfW;
[0.56, 1.1].forEach(h => [-0.2, 0, 0.2].forEach(o => assert.deepStrictEqual(hits(E(W - 1.0, kop.c[1] + o, h), E(W + 0.9, kop.c[1] + o, h)), [], 'the way from the snug into the kitchen is clear')));

// a chair that was moved out of a doorway is still where its "sit" spot is: every seat has upholstery or a frame under it
Array.from(C.seats).forEach(q => assert(hits(E(q.x, q.y, q.z + 1.2), E(q.x, q.y, q.z + 0.15)).length, 'the seat at ' + [q.x.toFixed(2), q.y.toFixed(2), q.z.toFixed(2)] + ' has a chair or a bed under it'));

// ---------------------------------------------------------------- 5 · the rooms
const ids = V2.rooms.map(r => r.id);
['drawing', 'hall', 'dining', 'snug', 'kitchen', 'sun', 'wc', 'bed1', 'bed2', 'study', 'bath', 'ensuite', 'bed3', 'bed4', 'atticBath'].forEach(id => assert(ids.includes(id), id + ' is a room of the house'));
V2.rooms.forEach(r => { assert(r.zh && r.en, r.id + ' has its name in both languages'); const c = r.poly.reduce((a, q) => [a[0] + q[0] / r.poly.length, a[1] + q[1] / r.poly.length], [0, 0]);
  if (r.poly.length === 4) assert.strictEqual(V2.roomAt(c[0], c[1], r.z + 1).id, r.id, 'standing in the middle of ' + r.id + ' shows its name'); });
console.log('clun-2: ok');
