/* Other records in the cloud doc (2026-11-26): node tests/cloud-sync/other-records.test.cjs */
const assert = require('assert'), fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..', '..');
const ctx = { atob, btoa, Blob, Response, CompressionStream, DecompressionStream, Uint8Array, JSON, Object, Promise, Map, localStorage: { getItem: () => null } };
ctx.window = ctx; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'tools/cloud-transport/reconcile.js'), 'utf8'), ctx);
const R = ctx.MinestSyncReconcile;
async function gz(v) { const b = new Uint8Array(await new Response(new Blob([JSON.stringify(v)]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer()); let t = ''; for (const x of b) t += String.fromCharCode(x); return btoa(t); }
async function ungz(s) { const b = Uint8Array.from(atob(s), c => c.charCodeAt(0)); return JSON.parse(await new Response(new Blob([b]).stream().pipeThrough(new DecompressionStream('gzip'))).text()); }
(async () => {
  // study log: another device's days and sessions survive a commit from a device that has not seen them
  const remote = { learning: { v: 2, devs: { A: { days: { d1: { activeMs: 900, sessions: 2 } } }, B: { days: { d1: { activeMs: 100, sessions: 1 } } } }, sessions: [{ id: 'a1', at: 1 }] },
    gptstudyGz: await gz({ version: 1, lists: { L: { cards: { c1: { seenAt: 50 }, c2: { learnedAt: 9 } }, last: 20, round: 3, history: [{ at: 1, ev: 'seen', id: 'c1' }] }, R: { cards: {}, last: 1 } } }) };
  const local = { learning: { v: 2, devs: { A: { days: { d1: { activeMs: 300, sessions: 1 } } }, B: { days: { d1: { activeMs: 400, sessions: 3 }, d2: { activeMs: 5 } } } }, sessions: [{ id: 'b1', at: 2 }] },
    gptstudyGz: await gz({ version: 1, lists: { L: { cards: { c1: { seenAt: 10 }, c2: { learnedAt: 30 } }, last: 5, round: 2, nativeSeq: 7, history: [{ at: 2, ev: 'learned', id: 'c2' }] } } }) };
  const out = await R.merge(local, remote, {});
  assert.strictEqual(out.learning.devs.A.days.d1.activeMs, 900); assert.strictEqual(out.learning.devs.B.days.d1.activeMs, 400);
  assert(out.learning.devs.B.days.d2); assert.deepStrictEqual(Array.from(out.learning.sessions, s => s.id), ['a1', 'b1']);
  const g = await ungz(out.gptstudyGz);
  assert.strictEqual(g.lists.L.cards.c1.seenAt, 50); assert.strictEqual(g.lists.L.cards.c2.learnedAt, 30);
  assert.strictEqual(g.lists.L.round, 3, 'the newer round wins'); assert.strictEqual(g.lists.L.nativeSeq, 7, 'this device keeps its own native counter');
  assert.strictEqual(g.lists.L.history.length, 2); assert(g.lists.R, 'a list only the cloud has is kept');
  // nothing to merge with: unchanged
  const solo = await R.merge({ learning: local.learning }, {}, {}); assert.strictEqual(JSON.stringify(solo.learning), JSON.stringify(local.learning));
  for (const p of ['iPhoneDuo.html', 'index.html', 'ipad.html', 'iphone.html', 'ios/Minest/Minest/iphone18.0.html']) {
    const s = fs.readFileSync(path.join(ROOT, p), 'utf8');
    assert(s.includes('function gptMerge(r,l)'), p + ': head reconcile');
    assert(s.includes("detail: { domain: 'learning' }"), p + ': study log asks for a save');
    assert(s.includes("return window.MinestSyncManagement && window.MinestSyncManagement.ref ? window.MinestSyncManagement.ref(r) : r;"), p + ': toolkit doc through the transport');
  }
  console.log('PASS: study log and CarPlay record merge with the cloud before a commit; pages carry the repair');
})().catch(e => { console.error(e); process.exit(1); });
