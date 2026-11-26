// Minest polish · board: MutationObserver batching semantics + patched pages are current.
// node tests/polish/board-polish.test.cjs  → "board-polish: ok"
const fs = require('fs'), path = require('path'), assert = require('assert'), vm = require('vm'), cp = require('child_process');
const R = path.join(__dirname, '..', '..');

// ---------------------------------------------------------------- 1 · mo-batch.js in a fake window
const frames = [], timers = [];
class FakeMO {
  constructor(cb) { this.cb = cb; this.recs = []; FakeMO.all.push(this); }
  observe(t, o) { this.t = t; this.o = o; }
  disconnect() { this.t = null; }
  takeRecords() { const r = this.recs; this.recs = []; return r; }
  fire(recs) { if (this.t) this.cb(recs, this); }
}
FakeMO.all = [];
const doc = { documentElement: { id: 'html' }, body: { id: 'body' } };
const win = { MutationObserver: FakeMO, document: doc, requestAnimationFrame: f => frames.push(f), setTimeout: (f, ms) => timers.push(f) };
win.window = win;
vm.runInNewContext(fs.readFileSync(path.join(R, 'tools/polish/mo-batch.js'), 'utf8'), win);
const MO = win.MutationObserver;
assert.ok(MO.__mnBatched && MO.Native === FakeMO, 'MutationObserver is wrapped once');
let whole = [], small = [];
const a = new MO(r => whole.push(r.length)); a.observe(doc.body, { childList: true, subtree: true });
const b = new MO(r => small.push(r.length)); b.observe({ id: 'div' }, { childList: true, subtree: true });
const c = new MO(r => small.push(-r.length)); c.observe(doc.documentElement, { attributes: true });
const raw = FakeMO.all;
raw[0].fire([1]); raw[0].fire([2, 3]); raw[1].fire([1]); raw[2].fire([1]);
assert.deepStrictEqual(whole, [], 'whole-document observer waits for the frame');
assert.deepStrictEqual(small, [1, -1], 'observers of one element or of attributes stay synchronous');
frames.shift()();
assert.deepStrictEqual(whole, [3], 'one call per frame with every record');
timers.shift()();
assert.deepStrictEqual(whole, [3], 'the timeout fallback does not call twice');
raw[0].fire([9]); a.disconnect(); frames.shift()();
assert.deepStrictEqual(whole, [3], 'a disconnected observer gets no late records');
assert.ok(a instanceof MO && raw[0] instanceof MO, 'instanceof works for wrapped and native observers');
assert.throws(() => MO(function () {}), /use the 'new' operator/, 'calling without new throws like the native one');

// ---------------------------------------------------------------- 2 · pages are patched and current
const PAGES = ['iPhoneDuo.html', 'index.html', 'ipad.html', 'ios/Minest/Minest/ipad.html', 'iphone.html', 'ios/Minest/Minest/iphone.html', 'ios/Minest/Minest/iphone18.0.html'];
const done = PAGES.filter(p => fs.readFileSync(path.join(R, p), 'utf8').includes('id="mn-polish-board-js"'));
assert.ok(done.length, 'at least one page carries the board polish');
const out = cp.spawnSync('python3', [path.join(R, 'tools/polish/patch_board_polish.py'), '--check', ...done], { encoding: 'utf8' });
assert.strictEqual(out.status, 0, 'patched pages match the patch script:\n' + out.stdout + out.stderr);
for (const p of done) {
  const s = fs.readFileSync(path.join(R, p), 'utf8');
  assert.ok(s.indexOf('<meta charset="utf-8">') < 1024, p + ': charset inside the first 1 KB');
  assert.ok(s.indexOf('id="mn-polish-mo"') < s.indexOf('<script', s.indexOf('id="mn-polish-mo"') + 20), p + ': batching is the first script');
  if (s.includes('mn-sk-world')) assert.ok(!s.includes("if (dock.firstElementChild !== ex) dock.insertBefore(ex, dock.firstElementChild);"), p + ': dock ensure no longer fights mount()');
}
console.log('board-polish: ok (' + done.length + ' pages)');
