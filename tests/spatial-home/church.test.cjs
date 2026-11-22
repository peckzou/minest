// Spatial Home · Rooms 2.0 · the Cathedral (rooms/env-church.js): the thirty verses, the painted glass and murals,
// and the room itself built for real on three.js (no WebGL needed: geometry, materials and lights only).
// node tests/spatial-home/church.test.cjs  → "church: ok"
const fs = require('fs'), path = require('path'), assert = require('assert');
const R = path.join(__dirname, '..', '..'), SH = path.join(R, 'spatial-home'), read = p => fs.readFileSync(path.join(SH, p), 'utf8');

// ---------------------------------------------------------------- a browser, as far as the room needs one
const drawn = [];                                                    // every string painted on a canvas
function ctx2d() {
  let font = '10px serif';
  const grad = { addColorStop() {} };
  const own = {
    measureText: s => ({ width: String(s).length * (parseFloat((/([\d.]+)px/.exec(font) || [0, 10])[1]) || 10) * (/[\u3000-\u9fff\uff00-\uffef]/.test(s) ? 1 : 0.5) }),
    fillText: s => { drawn.push(String(s)); }, strokeText: () => {},
    createLinearGradient: () => grad, createRadialGradient: () => grad, createPattern: () => ({}),
    getImageData: (x, y, w, h) => ({ data: new Uint8ClampedArray(w * h * 4), width: w, height: h })
  };
  return new Proxy(own, {
    get: (t, k) => k === 'font' ? font : k in t ? t[k] : (t[k] = () => {}),
    set: (t, k, v) => { if (k === 'font') font = v; else t[k] = v; return true; }
  });
}
const canvases = [];
global.window = global; global.self = global;
global.document = { createElement: () => { const c = { width: 300, height: 150, style: {}, getContext: () => c.ctx || (c.ctx = ctx2d()), addEventListener() {} }; canvases.push(c); return c; }, createElementNS: () => global.document.createElement() };
global.THREE = require(path.join(R, 'vendor/three.min.js'));
const load = p => { (0, eval)(read(p)); };

// ---------------------------------------------------------------- 1 · the page loads the church, in order, and nothing else changed
const html = read('rooms.html'), at = s => html.indexOf('<script src="' + s + '"></script>');
['rooms/church-verses.js', 'rooms/church-art.js', 'rooms/env-church.js'].forEach(s => assert(at(s) > 0, 'rooms.html loads ' + s));
assert(at('js/room.js') < at('rooms/church-verses.js') && at('rooms/church-verses.js') < at('rooms/church-art.js') && at('rooms/church-art.js') < at('rooms/env-church.js'), 'data and art before the room');
assert(at('rooms/env-church.js') < at('rooms/rooms.js') && at('rooms/rooms.js') < at('js/app.js'), 'the room registers before rooms.js picks one');
['rooms/env-studio.js', 'rooms/env-living.js', 'rooms/env-yard.js'].forEach(s => assert(at(s) > 0, 'still loads ' + s));

// ---------------------------------------------------------------- 2 · the thirty verses
load('rooms/church-verses.js');
const V = global.SpatialChurchVerses;
assert.strictEqual(V.length, 30, 'thirty verses');
V.forEach((v, i) => {
  assert.strictEqual(v.length, 4, 'verse ' + (i + 1) + ': [ref zh, ref en, 经文, verse]');
  v.forEach(s => assert(typeof s === 'string' && s.trim() === s && s.length > 3, 'verse ' + (i + 1) + ' has text'));
  assert(/[\u4e00-\u9fff]/.test(v[0]) && /\d+:\d+/.test(v[0]), 'Chinese reference with chapter:verse: ' + v[0]);
  assert(/^[1-3]? ?[A-Z][a-z]+ \d+:\d+/.test(v[1]), 'English reference: ' + v[1]);
  assert(/[\u4e00-\u9fff]/.test(v[2]) && !/[\u4e00-\u9fff]/.test(v[3]), 'Chinese then English: ' + v[1]);
  assert.strictEqual(v[0].replace(/^\D+/, ''), v[1].replace(/^[1-3]? ?[A-Za-z ]+? (?=\d)/, ''), 'both references name the same verse: ' + v[0] + ' / ' + v[1]);
});
assert.strictEqual(new Set(V.map(v => v[1])).size, 30, 'no verse twice');
['John 3:16', 'Psalm 23:1', 'Philippians 4:13', 'Romans 8:28', 'Jeremiah 29:11'].forEach(r => assert(V.some(v => v[1].indexOf(r) === 0), 'has ' + r));

// ---------------------------------------------------------------- 3 · the painted things
load('rooms/church-art.js');
const ART = global.SpatialChurchArt;
assert.strictEqual(ART.STORIES.length, 15, 'fifteen windows');
assert.deepStrictEqual(ART.STORIES.map(s => s.id), ['creation', 'eden', 'noah', 'moses', 'david', 'daniel', 'annunciation', 'nativity', 'baptism', 'loaves', 'prodigal', 'supper', 'crucifixion', 'resurrection', 'ascension']);
assert.deepStrictEqual(ART.MURALS.map(s => s.id), ['shepherd', 'sermon', 'jacob', 'jonah']);
ART.STORIES.concat(ART.MURALS).forEach(s => assert(s.zh && s.en, s.id + ' is named in both languages'));
ART.STORIES.forEach(s => { drawn.length = 0; ART.glass(ctx2d(), 384, 720, s.id); assert(drawn.indexOf(s.zh) >= 0, 'the window names its story: ' + s.id); });
ART.MURALS.forEach(s => { drawn.length = 0; ART.mural(ctx2d(), 768, 883, s.id); assert(drawn.indexOf(s.zh) >= 0, 'the mural names its story: ' + s.id); });
ART.rose(ctx2d(), 1024); ART.frieze(ctx2d(), 2048, 320); [0, 1, 2, 3].forEach(k => ART.saint(ctx2d(), 256, 448, k));
V.forEach((v, i) => {
  drawn.length = 0; ART.tablet(ctx2d(), 512, 768, i + 1, v);
  assert(drawn.indexOf(String(i + 1)) >= 0 && drawn.indexOf(v[0]) >= 0 && drawn.indexOf(v[1]) >= 0, 'tablet ' + (i + 1) + ' carries its number and reference');
  assert.strictEqual(drawn.filter(s => v[2].indexOf(s) >= 0 && s.length > 1 && s !== v[0]).join(''), v[2], 'tablet ' + (i + 1) + ': the whole Chinese verse, in order');
  assert.strictEqual(drawn.filter(s => v[3].indexOf(s) >= 0 && s !== v[1] && s !== String(i + 1)).join(' '), v[3], 'tablet ' + (i + 1) + ': the whole English verse, in order');
});

// ---------------------------------------------------------------- 4 · the room
['js/voxel.js', 'js/room.js', 'js/study/world.js', 'js/study/textures.js'].forEach(load);
const SR = global.SpatialRoom, before = SR.list ? SR.list().length : 0;
load('rooms/env-church.js');
assert(global.SpatialRoomsNew.indexOf('church') >= 0, 'church is one of the new rooms');
assert(typeof global.SpatialFurniture['church-organ'] === 'function' && global.SpatialFurnitureCatalog.some(c => c.id === 'church-organ'), 'the organ console is a piece of furniture');
const scene = new THREE.Scene(), room = SR.build(scene, 'church');
assert.strictEqual(room.id, 'church', 'the church built (no fallback to another room)');
assert(typeof room.avatar === 'function' && typeof room.tick === 'function' && typeof room.setTime === 'function' && typeof room.dispose === 'function');
// every place the things of Spatial Home ask for
const ANCHORS = ['desk.left', 'desk.right', 'desk.quill', 'desk.mochi', 'desk.key', 'desk.book', 'desk.watch', 'sill.left', 'corner.window', 'wall.left', 'wall.right',
  'cabinet.left', 'cabinet.top', 'cabinet.right', 'shelf.mid', 'floor.pack', 'floor.gramo', 'floor.film', 'floor.portal', 'floor.holo', 'floor.window'];
const W = room.size.W, D = room.size.D;
ANCHORS.forEach(k => {
  const a = room.anchors[k]; assert(a && a.p.length === 3 && a.p.every(Number.isFinite) && Number.isFinite(a.ry), 'anchor ' + k);
  assert(Math.abs(a.p[0]) <= W + 0.01 && Math.abs(a.p[2]) <= D + 0.01 && a.p[1] >= 0 && a.p[1] < 3, 'anchor ' + k + ' is inside the church');
});
assert(room.anchors['floor.window'].w > 1 && room.anchors['floor.window'].h > 1, 'the Scenic Window has its size');
const used = new Set(); (read('js/objects.js') + read('js/entries.js')).replace(/anchor: '([a-z.]+)'/g, (m, k) => { used.add(k); return m; });
used.forEach(k => assert(room.anchors[k], 'objects.js / entries.js place something at ' + k));
// the thirty tablets: 1–15 east along the south aisle, 16–30 back west along the north
assert.strictEqual(room.verses.length, 30, 'thirty tablets on the walls');
room.verses.forEach((m, i) => {
  assert.strictEqual(m.name, 'verse-' + (i + 1));
  assert(Math.abs(Math.abs(m.position.x) - W) < 0.1 && m.position.y > 1.2 && m.position.y < 2 , 'tablet ' + (i + 1) + ' hangs on an aisle wall at eye height');
  assert.strictEqual(Math.sign(m.position.x), i < 15 ? 1 : -1, 'tablet ' + (i + 1) + ' is in the ' + (i < 15 ? 'south' : 'north') + ' aisle');
  if (i % 15) assert((m.position.z - room.verses[i - 1].position.z) * (i < 15 ? -1 : 1) >= 1, 'tablet ' + (i + 1) + ' follows ' + i + ' along the walk, without overlapping');
});
// where you start, sit and walk
const inSolid = (x, z) => room.solids.some(s => x > s[0] && x < s[2] && z > s[1] && z < s[3]);
room.solids.forEach(s => assert(s.length === 4 && s[0] < s[2] && s[1] < s[3], 'solid ' + s));
assert(!inSolid(room.start.pos[0], room.start.pos[2]), 'you do not start inside something');
assert(!inSolid(room.seat.approach[0], room.seat.approach[1]), 'the chair can be reached');
for (let z = -8; z <= 9; z += 0.5) { assert(!inSolid(0, z), 'the middle walk is clear at z=' + z); assert(!inSolid(5, z) && !inSolid(-5, z), 'the aisles are clear at z=' + z); }
room.verses.forEach((m, i) => assert(!inSolid(m.position.x - Math.sign(m.position.x) * 1.2, m.position.z), 'you can stand in front of tablet ' + (i + 1)));
// the organ console in the layout, clear of the door
const ex = room.defaultLayout().extras; assert(ex.length === 1 && ex[0].kind === 'church-organ' && Math.abs(ex[0].p[0]) > 1.6, 'the console stands beside the door, not in it');
const organ = global.SpatialFurniture['church-organ'](THREE); assert(organ.group.isGroup && organ.hb.length === 3 && typeof organ.press === 'function');
assert(/放不出声音/.test(organ.press()), 'without Web Audio the console says so instead of throwing');
// it is a cathedral: tall, long, glass and paint in it
assert(room.size.H > 12 && D >= 12, 'nave height ' + room.size.H);
let glass = 0, painted = 0, lights = 0, meshes = 0;
room.holder.traverse(o => { if (o.isLight) lights++; if (o.isMesh) { meshes++; if (o.material.isMeshBasicMaterial && o.material.map && o.material.side === THREE.DoubleSide && !o.material.transparent) glass++; if (o.material.emissiveMap) painted++; } });
assert(glass >= 15 + 16 + 4 + 1, 'story windows, clerestory, the rose: ' + glass); assert(painted >= 30 + 2 + 4 + 2, 'tablets, murals, friezes: ' + painted); assert(lights >= 6 && meshes > 400);
// day, dusk, night, a few frames, then gone
['day', 'dusk', 'night', 'auto'].forEach(m => room.setTime(m)); for (let t = 0; t < 3; t += 0.016) room.tick(t, 0.016);
room.dispose(); assert.strictEqual(scene.background, null); assert.strictEqual(room.holder.parent, null, 'the church leaves the scene');
console.log('church: ok (' + V.length + ' verses, ' + ART.STORIES.length + ' windows, ' + ART.MURALS.length + ' murals, ' + meshes + ' meshes, ' + canvases.length + ' canvases)');
