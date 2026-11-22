// 动态呈现 2.0 (dynamic-2/): the page is a layer over the eleven unchanged 1.0 presentations, is deployed with the
// scripts it loads, reads boards without writing them, keeps its own saved progress apart from Minest's, and its lens
// (画风 and 氛围) leaves a renderer exactly as 1.0 has it when both are off.
// node tests/dynamic-2/dynamic2.test.cjs → "dynamic-2: ok"
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const R = path.join(__dirname, '..', '..'), rd = p => fs.readFileSync(path.join(R, p), 'utf8');
const html = rd('dynamic-2/index.html'), v2 = rd('dynamic-2/v2.js'), fx = rd('dynamic-2/v2-fx.js'), data = rd('dynamic-2/v2-data.js'), entry = rd('tools/knowledge-drive/entry.js');

// ---------------------------------------------------------------- 1 · the page and the 1.0 scripts
const srcs = [...html.matchAll(/<script src="([^"]+)"/g)].map(m => m[1]), css = [...html.matchAll(/<link rel="stylesheet" href="([^"]+)"/g)].map(m => m[1]);
const ONE = ['knowledge-drive/sfx.js', 'knowledge-drive/drive.js', 'knowledge-drive/cars.js', 'knowledge-rail/rail-common.js', 'knowledge-rail/train.js', 'knowledge-rail/metro.js', 'knowledge-rail/tower.js', 'knowledge-rail/showcase-common.js',
  'knowledge-rail/rack.js', 'knowledge-rail/library.js', 'knowledge-rail/museum.js', 'knowledge-rail/city.js', 'knowledge-rail/galaxy.js', 'knowledge-balloon/balloon.js'];
assert.deepStrictEqual(srcs, ['../vendor/three.min.js', 'v2-data.js', 'v2-fx.js'].concat(ONE.map(f => '../tools/' + f), ['v2.js']), 'three.js, the cards and the lens, then the 1.0 scripts as they are, then the 2.0 layer');
assert.deepStrictEqual(css, ['../tools/knowledge-drive/drive.css', '../tools/knowledge-rail/rail.css', '../tools/knowledge-rail/phase3.css', '../tools/knowledge-balloon/balloon.css', 'v2.css']);
srcs.concat(css).forEach(s => assert(fs.existsSync(path.join(R, 'dynamic-2', s)), s + ' exists'));
// the order Minest itself puts them in its pages (patch_knowledge_drive.py), without its own gallery (entry.js) and Duo layer
const patch = rd('tools/knowledge-drive/patch_knowledge_drive.py'), inPatch = [...patch.slice(patch.indexOf("js = '\\n'.join")).matchAll(/\((HERE|RAIL|BALLOON), '([^']+\.js)'\)/g)].map(m => ({ HERE: 'knowledge-drive', RAIL: 'knowledge-rail', BALLOON: 'knowledge-balloon' })[m[1]] + '/' + m[2]);
assert.deepStrictEqual(ONE, inPatch.filter(f => !/entry\.js|duo-dyn\.js/.test(f)), 'every script of the 1.0 presentations, in Minest\'s order');
const ignore = rd('.vercelignore').split('\n'), iAll = ignore.indexOf('tools/*');
ONE.concat(css.filter(c => /tools/.test(c)).map(c => c.replace('../tools/', ''))).forEach(f => {
  const d = f.split('/')[0], iDir = ignore.indexOf('!tools/' + d), iRest = ignore.indexOf('tools/' + d + '/*'), iKeep = ignore.indexOf('!tools/' + f);
  assert(iAll >= 0 && iAll < iDir && iDir < iRest && iRest < iKeep, f + ' is deployed (tools/ is otherwise left out)');
});
assert(!ignore.some(l => /^\/?(dynamic-2|vendor)/.test(l)), 'dynamic-2/ and vendor/ are deployed');

// the eleven: every 1.0 presentation, in the gallery's order, under its 1.0 name
const ids10 = [...entry.slice(entry.indexOf('var MODES = {'), entry.indexOf('var mode =')).matchAll(/^\s{4}(\w+): \{ icon: '[^']*', name: '([^']+)'/gm)].map(m => [m[1], m[2]]);
const MODES = eval(v2.match(/var MODES = (\[[\s\S]*?\n  \]);/)[1]);
assert.strictEqual(ids10.length, 11); assert.deepStrictEqual(MODES.map(m => [m[0], m[3]]), ids10, 'the hall has the eleven 1.0 presentations, in the same order');
assert.strictEqual(eval(v2.match(/var KEYS = (\[[^\]]*\]);/)[1]).length, 11, 'a key for each');
MODES.forEach(m => { assert(/^#[0-9a-f]{6}$/.test(m[6]), m[0] + ' has a colour'); assert(m[2] && m[4] && m[5] && m[7].length === 2, m[0] + ' is described'); assert(new RegExp('\\n    ' + m[0] + ': \\{ api:').test(v2), m[0] + ' has a way in'); });

// ---------------------------------------------------------------- 2 · saved progress apart from Minest's
function storage() { const m = new Map(); class Storage { getItem(k) { return m.has(k) ? m.get(k) : null; } setItem(k, v) { m.set(k, String(v)); } removeItem(k) { m.delete(k); } } return { Storage, ls: new Storage(), raw: m }; }
{
  const s = storage(); s.raw.set('minest.drive.v1', '{"a":1}'); s.raw.set('minest-galaxy-v2', 'g'); s.raw.set('minest.dynamic.mode', 'metro'); s.raw.set('focusboard_boards_v7_2', '[]');
  vm.runInNewContext(html.match(/<script>\/\* 2\.0 keeps its own progress[\s\S]*?<\/script>/)[0].replace(/^<script>|<\/script>$/g, ''), { Storage: s.Storage, String });
  assert.strictEqual(s.ls.getItem('minest.drive.v1'), null, '2.0 does not start from where a 1.0 drive stopped');
  s.ls.setItem('minest.drive.v1', '{"b":2}'); s.ls.setItem('minest-galaxy-v2', 'h'); s.ls.setItem('minest.sfx', 'off'); s.ls.setItem('minest.dyn2.state', '{}');
  assert.strictEqual(s.raw.get('minest.drive.v1'), '{"a":1}', 'a 1.0 drive is not overwritten'); assert.strictEqual(s.raw.get('minest-galaxy-v2'), 'g'); assert.strictEqual(s.raw.get('minest.dynamic.mode'), 'metro');
  assert.strictEqual(s.raw.get('minest.dyn2.drive.v1'), '{"b":2}'); assert.strictEqual(s.raw.get('minest.dyn2.galaxy-v2'), 'h'); assert.strictEqual(s.raw.get('minest.dyn2.sfx'), 'off'); assert(!s.raw.has('minest.sfx'));
  assert.strictEqual(s.raw.get('minest.dyn2.state'), '{}', '2.0\'s own keys are not moved twice'); assert.strictEqual(s.ls.getItem('minest.drive.v1'), '{"b":2}');
  s.ls.removeItem('minest.drive.v1'); assert.strictEqual(s.raw.get('minest.drive.v1'), '{"a":1}'); assert(!s.raw.has('minest.dyn2.drive.v1'));
  assert.strictEqual(s.ls.getItem('focusboard_boards_v7_2'), '[]', 'other keys pass through');
}

// ---------------------------------------------------------------- 3 · the cards: Minest's boards (read only), else the samples
function dataPage(stored, search) {
  const s = storage(); Object.keys(stored || {}).forEach(k => s.raw.set(k, stored[k])); let writes = 0; const set = s.ls.setItem.bind(s.ls); s.ls.setItem = (k, v) => { writes++; set(k, v); };
  const w = { location: { search: search || '' }, localStorage: s.ls, dispatchEvent() {}, CustomEvent: function () {}, indexedDB: null }; w.window = w;
  vm.runInNewContext(data, w); return { D: w.Dyn2Data, writes: () => writes, w };
}
{
  const p = dataPage(); assert(p.D.sample(), 'no boards on this device: the samples');
  const B = p.D.boards(), ids = new Set(); assert(B.length >= 3);
  B.forEach(b => b.columns.forEach(c => { assert(c.cards.length >= 6, c.title + ' has enough cards to travel through'); c.cards.forEach(k => { assert(!ids.has(k.id)); ids.add(k.id); assert(k.title && k.titleZh && k.back && /^data:image\/svg\+xml,/.test(k.cover.value), k.id + ' has both names, a back and a picture drawn here'); }); }));
  assert.strictEqual(p.D.provider.boards(), B); assert.strictEqual(p.D.provider.openCard, null);
  // the 1.0 data layer reads them (MinestDrive.plan: a board's lists become roads, a list is where the trip starts)
  const w = p.w; w.document = { addEventListener() {} }; w.addEventListener = () => {}; vm.runInNewContext(rd('tools/knowledge-drive/drive.js'), w);
  const plan = w.MinestDrive.plan({ type: 'board', bid: B[0].id }, p.D.provider); assert.strictEqual(plan.roads.length, B[0].columns.length); assert.strictEqual(plan.roads.reduce((n, r) => n + r.items.length, 0), p.D.count(B[0]));
  assert.strictEqual(w.MinestDrive.plan({ type: 'list', bid: B[0].id, col: B[0].columns[2].id }, p.D.provider).start, 2);
  assert.strictEqual(w.MinestDrive.plan({ type: 'workspace' }, p.D.provider).roads.length, B.reduce((n, b) => n + b.columns.length, 0));
}
{
  const mine = JSON.stringify([{ id: 'b1', title: 'Mine', columns: [{ id: 'c1', title: 'L', cards: [{ id: 'k1', title: 'A' }, { id: 'k2', title: 'B', stack: [{ id: 'k3', title: 'C' }] }] }] }, { id: 'b2', title: 'Empty', columns: [] }]);
  const p = dataPage({ focusboard_boards_v7_2: mine }); assert(!p.D.sample()); assert.strictEqual(p.D.boards().map(b => b.id).join(), 'b1', 'Minest\'s boards, without the empty ones'); assert.strictEqual(p.D.count(p.D.boards()[0]), 3);
  assert.strictEqual(p.writes(), 0, 'nothing is written'); assert(!/setItem|\.put\(|readwrite/.test(data), 'the data file has no way to write');
  assert(dataPage({ focusboard_boards_v7_2: mine }, '?sample').D.sample(), '?sample asks for the samples');
}

// ---------------------------------------------------------------- 4 · the lens over a 1.0 renderer
function three() {
  const log = [];
  class V { constructor(x, y, z) { this.x = x || 0; this.y = y || 0; this.z = z || 0; } set(x, y) { this.x = x; this.y = y; return this; } fromArray(a) { this.x = a[0]; this.y = a[1]; this.z = a[2]; return this; } multiplyScalar(k) { this.x *= k; this.y *= k; this.z *= k; return this; } }
  class RT { constructor(w, h) { this.width = w; this.height = h; this.texture = { encoding: 0 }; } setSize(w, h) { this.width = w; this.height = h; } dispose() { this.gone = true; } }
  class Obj { constructor() { this.children = []; this.parent = null; } add(o) { o.parent = this; this.children.push(o); } remove(o) { o.parent = null; this.children = this.children.filter(c => c !== o); } }
  class Mat { constructor(p) { Object.assign(this, p); } dispose() {} } class Geo { setAttribute() {} dispose() {} }
  function WebGLRenderer() {   // as three r128 makes one: its methods are its own
    let target = null; this.autoClear = true; this.outputEncoding = 3001; this.capabilities = { isWebGL2: true };
    this.getPixelRatio = () => 1; this.getDrawingBufferSize = v => v.set(this.w || 800, this.h || 600);
    this.setRenderTarget = t => { target = t; }; this.getRenderTarget = () => target;
    this.render = (scene, cam) => { log.push({ scene, cam, target, clear: this.autoClear }); }; this.dispose = () => { log.push('dispose'); };
  }
  const T = { WebGLRenderer, Vector2: V, Vector3: V, WebGLRenderTarget: RT, WebGLMultisampleRenderTarget: class extends RT { constructor(w, h) { super(w, h); this.multi = true; } }, ShaderMaterial: Mat, BufferGeometry: Geo, PlaneBufferGeometry: Geo, BufferAttribute: class {},
    Scene: Obj, Mesh: class extends Obj { constructor(g, m) { super(); this.geometry = g; this.material = m; } }, Points: class extends Obj { constructor(g, m) { super(); this.geometry = g; this.material = m; } },
    OrthographicCamera: class {}, LinearFilter: 1, RGBAFormat: 2, AdditiveBlending: 2, NormalBlending: 1 };
  return { T, log, Obj };
}
(async () => {
  const { T, log, Obj } = three(), First = T.WebGLRenderer, w = { THREE: T, performance: { now: () => 0 }, Promise, Float32Array, Math, Array }; w.window = w; vm.runInNewContext(fx, w);
  const FX = w.Dyn2FX; assert(FX && T.WebGLRenderer !== First && T.WebGLRenderer.prototype === First.prototype, 'the lens stands in for the renderer the 1.0 scripts make');
  assert.deepStrictEqual(JSON.parse(JSON.stringify(FX.get())), { look: 'off', air: 'none', scale: 1 }); assert.strictEqual(FX.looks[0].id, 'off'); assert.strictEqual(FX.airs[0].id, 'none'); assert(FX.looks.length >= 6 && FX.airs.length >= 5);
  const r = new T.WebGLRenderer({}), scene = new Obj(), inside = new Obj(), cam = { isPerspectiveCamera: true, fov: 60, getWorldPosition: v => v }, frame = async () => { r.autoClear = true; r.render(scene, cam); r.autoClear = false; r.render(inside, cam); r.autoClear = true; await null; await null; };
  assert(r instanceof First);
  // 原片 + 无: the two passes of a 1.0 frame reach the screen as they are, and nothing is added to the scene
  await frame(); assert.deepStrictEqual(log.map(l => [l.scene, l.target, l.clear]), [[scene, null, true], [inside, null, false]]); assert.strictEqual(scene.children.length, 0); assert.strictEqual(FX.live()[0].on, false);
  // a look: both passes go to one buffer, and the finished frame is drawn to the screen once, after them
  log.length = 0; FX.set({ look: 'film' }); await frame();
  const buf = log[0].target; assert(buf && buf.multi && buf.width === 800 && buf.height === 600, 'the frame is drawn into a buffer the size of the canvas'); assert.strictEqual(buf.texture.encoding, 3001, 'in the colours the presentation asked for');
  assert.strictEqual(log[1].target, buf); assert.strictEqual(log[1].scene, inside); assert.strictEqual(log[1].clear, false, 'the second pass still draws over the first');
  const post = log.slice(2); assert(post.length >= 4 && post.every(l => l.scene !== scene && l.scene !== inside), 'then the lens'); assert.strictEqual(post.filter(l => l.target === null).length, 1, 'which reaches the screen once'); assert.strictEqual(post[post.length - 1].target, null);
  assert.strictEqual(r.getRenderTarget(), buf, 'and the next frame starts in the buffer again'); assert.strictEqual(r.autoClear, true, 'the presentation\'s own setting is put back');
  r.setRenderTarget(null); assert.strictEqual(r.getRenderTarget(), buf, 'a presentation asking for the screen gets the buffer'); const own = {}; r.setRenderTarget(own); assert.strictEqual(r.getRenderTarget(), own); r.setRenderTarget(null);
  r.w = 400; r.h = 300; log.length = 0; await frame(); assert(buf.width === 400 && buf.height === 300, 'the buffer follows the canvas');
  assert.strictEqual(FX.set({ look: 'nope' }), undefined); assert.strictEqual(FX.get().look, 'film', 'an unknown look is ignored');
  // weather: in the scene drawn first, once, and gone again with 无
  FX.set({ air: 'snow', scale: 2 }); await frame(); assert.strictEqual(scene.children.length, 1); assert.strictEqual(inside.children.length, 0, 'weather is outside the window'); const snow = scene.children[0];
  assert.strictEqual(snow.material.uniforms.rad.value, 18, 'sized to the scene'); assert.strictEqual(snow.material.depthWrite, false); assert.doesNotThrow(() => snow.raycast(), 'a tap goes through it');
  await frame(); assert.strictEqual(scene.children[0], snow, 'kept from frame to frame'); FX.set({ air: 'rain' }); await frame(); assert(scene.children.length === 1 && scene.children[0] !== snow);
  FX.set({ air: 'none' }); await frame(); assert.strictEqual(scene.children.length, 0);
  // back to 原片: the screen again
  log.length = 0; FX.set({ look: 'off' }); await frame(); assert.deepStrictEqual(log.map(l => l.target), [null, null]); assert.strictEqual(r.getRenderTarget(), null);
  FX.set({ look: 'neon' }); await frame(); r.dispose(); assert(buf.gone && log.includes('dispose'), 'closing a presentation frees the buffer'); assert.strictEqual(FX.live().length, 0);
  console.log('dynamic-2: ok');
})().catch(e => { console.error(e); process.exit(1); });
