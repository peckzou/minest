/* My World sync repair (2026-11-26): node tests/cloud-sync/myworld.test.cjs */
const assert = require('assert'), fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..', '..');
const ctx = { window: {}, atob, btoa, Blob, Response, CompressionStream, DecompressionStream, Uint8Array, JSON, Object, Promise, localStorage: { getItem: () => null } };
ctx.window = ctx; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'tools/cloud-transport/reconcile.js'), 'utf8'), ctx);
const R = ctx.MinestSyncReconcile;
async function gz(v) { const b = new Uint8Array(await new Response(new Blob([JSON.stringify(v)]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer()); let t = ''; for (const x of b) t += String.fromCharCode(x); return btoa(t); }
async function ungz(s) { const b = Uint8Array.from(atob(s), c => c.charCodeAt(0)); return JSON.parse(await new Response(new Blob([b]).stream().pipeThrough(new DecompressionStream('gzip'))).text()); }
const map = x => Object.assign({ h: {}, off: {}, o: {}, m: {}, t: {}, x: {} }, x);
(async () => {
  // the cloud has a plain `knowledge` (an older client's direct write) and a compressed copy: keys from both survive
  const remote = { clientUpdatedAt: 5, knowledge: map({ h: { a: { on: 1, t: 30 } } }), knowledgeGz: await gz(map({ h: { b: { on: 1, t: 20 } }, x: { v: { v: 1, t: 10 } } })) };
  const local = { clientUpdatedAt: 9, knowledgeGz: await gz(map({ h: { c: { on: 1, t: 40 } }, x: { v: { v: 2, t: 5 } } })) };
  const out = await R.merge(local, remote, {});
  const k = await ungz(out.knowledgeGz);
  assert.deepStrictEqual(Object.keys(k.h).sort(), ['a', 'b', 'c']);
  assert.strictEqual(k.x.v.v, 1, 'the newer stamp wins per key');
  // a tie keeps this device's value; the plain copy's older key loses to the compressed copy's newer one
  const r2 = { knowledge: map({ m: { p: { dx: 1, t: 5 } } }), knowledgeGz: await gz(map({ m: { p: { dx: 2, t: 9 } } })) };
  const o2 = await ungz((await R.merge({ knowledgeGz: await gz(map({ m: { p: { dx: 3, t: 9 } } })) }, r2, {})).knowledgeGz);
  assert.strictEqual(o2.m.p.dx, 3);
  // the pages: no direct write of `knowledge` outside the transport; a change asks for a cloud save
  for (const p of ['iPhoneDuo.html', 'index.html', 'ipad.html', 'iphone.html', 'ios/Minest/Minest/iphone18.0.html']) {
    const s = fs.readFileSync(path.join(ROOT, p), 'utf8');
    assert(!s.includes(".set({ knowledge: JSON.parse(JSON.stringify(K)) }"), p + ': direct knowledge write gone');
    assert(s.includes("detail: { immediate: true, domain: 'myworld' }"), p + ': a My World change marks the cloud copy unsynced');
    assert(s.includes('function knMerge(a,b)'), p + ': head reconcile merges both cloud copies');
  }
  console.log('PASS: My World keys from both cloud copies and this device merge per key; pages save My World through the sync transport');
})().catch(e => { console.error(e); process.exit(1); });
