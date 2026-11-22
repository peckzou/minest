/* 卡片风格 2.0 (card-styles-2/): the page loads the unchanged 1.0 script, adds its materials to that script's
   list, keeps its own saved choice, and is deployed with the script it loads. Run from the repo root. */
const fs = require('fs'), vm = require('vm'), assert = require('assert/strict');
const read = f => fs.readFileSync(f, 'utf8');
const html = read('card-styles-2/index.html');

/* the scripts the page loads, in order, all present */
const srcs = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1]);
assert.deepEqual(srcs, ['../tools/cover-modes/card-styles.js', 'materials.js', 'v2.js']);
for (const s of srcs) assert(fs.existsSync(require('path').join('card-styles-2', s)), s + ' exists');
assert(/<link rel="stylesheet" href="v2\.css">/.test(html) && fs.existsSync('card-styles-2/v2.css'));
const ignore = read('.vercelignore').split('\n');
const iAll = ignore.indexOf('tools/*'), iDir = ignore.indexOf('!tools/cover-modes'), iRest = ignore.indexOf('tools/cover-modes/*'), iKeep = ignore.indexOf('!tools/cover-modes/card-styles.js');
assert(iAll >= 0 && iAll < iDir && iDir < iRest && iRest < iKeep, 'the deployment keeps tools/cover-modes/card-styles.js');

/* a small page to run the scripts in */
function page(stored) {
  const store = new Map(Object.entries(stored || {}));
  function Storage() {}
  Storage.prototype.getItem = function (k) { return store.has(k) ? store.get(k) : null; };
  Storage.prototype.setItem = function (k, v) { store.set(k, String(v)); };
  Storage.prototype.removeItem = function (k) { store.delete(k); };
  const sheets = {}, ready = [];
  const node = () => ({ style: { setProperty() {}, removeProperty() {} }, dataset: {}, classList: { add() {}, remove() {}, toggle() {} }, appendChild() {}, setAttribute() {}, addEventListener() {}, querySelector: () => null, querySelectorAll: () => [] });
  const document = Object.assign(node(), { readyState: 'loading', hidden: false, documentElement: node(), body: node(),
    head: { appendChild(e) { if (e.id) sheets[e.id] = e.textContent || ''; } },
    createElement: () => node(), getElementById: id => (id in sheets ? { textContent: sheets[id] } : null),
    addEventListener(t, f) { if (t === 'DOMContentLoaded') ready.push(f); } });
  const win = { document, Storage, localStorage: new Storage(), addEventListener() {}, requestAnimationFrame() {}, matchMedia: () => ({ matches: false }), performance: { now: () => 0 }, location: { hash: '', pathname: '/card-styles-2/', search: '' }, console };
  win.window = win;
  const ctx = vm.createContext(win);
  return { ctx, store, sheets, ready, run(code, name) { vm.runInContext(code, ctx, { filename: name }); } };
}
const inline = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
const remap = inline.find(s => s.includes('CS2Store'));
assert(remap, 'the page keeps its own storage keys');

/* 1.0 on its own: 25 materials */
const v1 = page(); v1.run(read('tools/cover-modes/card-styles.js'), 'card-styles.js');
const ids1 = v1.ctx.MinestCardStyles.styles.map(s => s.id);
assert.equal(ids1.length, 25);

/* 2.0: the app's saved style is neither read nor written; 2.0's own is */
const p = page({ 'minest.cardStyle': 'chrome', 'minest.cardStyle2': 'swiss' });
p.run(remap, 'index.html'); p.run(read('tools/cover-modes/card-styles.js'), 'card-styles.js');
assert.equal(p.ctx.MinestCardStyles.get(), 'swiss', '2.0 starts from its own saved material');
p.ctx.localStorage.setItem('minest.cardStyle', 'aurora'); p.ctx.localStorage.setItem('minest.cardStyle.mindful', '{}');
assert.equal(p.store.get('minest.cardStyle'), 'chrome', "the app's key is left alone");
assert.equal(p.store.get('minest.cardStyle2'), 'aurora'); assert.equal(p.store.get('minest.cardStyle2.mindful'), '{}');
p.ctx.localStorage.setItem('other', '1'); assert.equal(p.store.get('other'), '1');
assert.equal(p.ctx.CS2Store.get('minest.cardStyle'), 'chrome');
p.ctx.CS2Store.set('minest.cardStyle', 'noir-gold'); assert.equal(p.store.get('minest.cardStyle'), 'noir-gold', '"用到 Minest" writes the app key');

/* the new materials join the 1.0 list, before its gallery is built */
p.run(read('card-styles-2/materials.js'), 'materials.js');
const styles = p.ctx.MinestCardStyles.styles, ids = styles.map(s => s.id), added = [...p.ctx.MinestCardStyles2Materials];
assert.equal(ids.slice(0, 25).join(), ids1.join(), 'the 25 originals keep their place');
assert.equal(added.length, 8); assert.equal(ids.slice(25).join(), added.join());
assert.equal(new Set(ids).size, ids.length, 'no id twice');
assert(p.ready.length >= 1, '1.0 builds its gallery after the materials are in');
const css = p.sheets['cs2-materials'];
for (const s of styles.slice(25)) {
  assert(['light', 'material', 'east', 'art'].includes(s.cat), s.id + ' sits under a gallery tab');
  for (const k of ['name', 'zh', 'desc']) assert(s[k] && s[k].length > 1, s.id + '.' + k);
  assert(/^#[0-9a-f]{6}$/i.test(s.accent), s.id + ' accent');
  const q = '"' + s.id + '"';
  for (const sel of ['html[data-card-style=' + q + '] .cm-c', 'html[data-card-style=' + q + '] [data-card-id]:not(.coverflow-card-item)', 'html[data-card-style=' + q + '] .coverflow-card-item .face-front',
    '.cs-prev[data-s=' + q + ']', '.cs-prev[data-s=' + q + '] span', '.cs-prev[data-s=' + q + '] span.cs-pl', '.cs-opt.on .cs-prev[data-s=' + q + ']', '.cs-prev[data-s=' + q + ']::after'])
    assert(css.includes(sel), s.id + ' styles ' + sel);
  assert(!p.sheets['cs-style-sheet'].includes(q), s.id + ' is not a 1.0 material');
}
/* every rule of the new sheet is for a new material */
for (const m of css.matchAll(/data-(?:card-style|s)="([^"]+)"/g)) assert(added.includes(m[1]), m[1]);
console.log('PASS: card styles 2.0 loads the unchanged 1.0 script, adds 8 materials (33), keeps its own saved choice and ships with its script');
