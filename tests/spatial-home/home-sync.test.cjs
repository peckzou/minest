/* Spatial Home sync repair (2026-11-26): on Minest's page the room's keys go up with Minest's own save, never a direct
   SDK write. node tests/spatial-home/home-sync.test.cjs */
const assert = require('assert'), fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..', '..');
const src = fs.readFileSync(path.join(ROOT, 'spatial-home/js/home-store.js'), 'utf8');
const store = {}, ls = { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } };
const K = { x: {}, set(k, v) { this.x[k] = { v, t: Date.now() }; }, get(k) { return this.x[k] ? this.x[k].v : null; }, keys() { return []; }, _cloud() { return { x: this.x }; }, onChange() {} };
let asks = 0, sdkWrites = 0, timers = [];
const win = {
  localStorage: ls, MinestKnowledge: K, navigator: { onLine: true },
  firebase: { auth: () => ({ currentUser: { uid: 'u' }, onAuthStateChanged() {} }), firestore: () => ({ collection() { sdkWrites++; throw Error('no direct writes'); } }) },
  addEventListener() {}, dispatchEvent(e) { if (e.type === 'minest:cloud-dirty') { asks++; store['minest.cloud.dirtyAt'] = String(Date.now() + 1); } return true; },
  CustomEvent: function (type, init) { this.type = type; this.detail = init && init.detail; }
};
win.parent = win; win.top = win;
const ctx = { window: win, document: { readyState: 'complete', getElementsByTagName: () => [] }, setTimeout: (f, ms) => { timers.push(f); return timers.length; }, clearTimeout() {}, setInterval() {}, JSON, Object, Date, Math, Number, String, Promise, location: { origin: 'x' } };
vm.createContext(ctx); vm.runInContext(src.replace(/\}\)\(window\);\s*$/, '})(window);'), ctx);
const S = win.MinestHomeStore;
store['minest.cloud.dirtyAt'] = '5'; store['minest.cloud.ackAt'] = '5';
S.set('bp:home:study', { a: 1 });
assert.strictEqual(asks, 1, 'asks Minest for a cloud save'); assert.strictEqual(sdkWrites, 0, 'no direct SDK write');
assert.strictEqual(S.status().pending, 1, 'waits for that save');
S.flush(); assert.strictEqual(asks, 1, 'does not ask again while the save is under way'); assert.strictEqual(S.status().pending, 1);
store['minest.cloud.ackAt'] = store['minest.cloud.dirtyAt'];   // Minest's save took it
S.flush(); assert.strictEqual(S.status().pending, 0, 'leaves the outbox once Minest has saved');
// a key set after the save was asked for is not dropped by that save's acknowledgement
S.set('sh:def:study', { v: 1 }); const before = asks;
store['minest.cloud.ackAt'] = store['minest.cloud.dirtyAt'];
S.flush(); assert(asks >= before, 'asked'); assert.strictEqual(sdkWrites, 0);
// pages carry the repair
for (const p of ['iPhoneDuo.html', 'index.html', 'ipad.html', 'iphone.html', 'ios/Minest/Minest/iphone18.0.html'])
  assert(fs.readFileSync(path.join(ROOT, p), 'utf8').includes('Spatial Home sync repair (tools/spatial-home/patch_home_sync.py)'), p);
console.log('PASS: Spatial Home keys go up with Minest\'s own save and leave the outbox once it has them');
