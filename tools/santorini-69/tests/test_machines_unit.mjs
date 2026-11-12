// node tools/santorini-69/tests/test_machines_unit.mjs — the pure part of ui/world-machines.js
import { createRequire } from 'module';
import assert from 'assert';
const P = createRequire(import.meta.url)('../../../ui/world-machines.js');
let n = 0; const t = (name, fn) => { fn(); n++; console.log('ok', name); };
const Q = Math.PI / 2;

t('the eleven machines of the brief are listed; only what is built says ready', () => {
  assert.deepEqual(P.CATALOG.map((m) => m.no).sort(), ['03', '09', '10', '11', '12', '13', '14', '19', '20', '78', '79']);
  assert.deepEqual(P.CATALOG.filter((m) => m.ready).map((m) => m.id), ['carousel']);
});
t('32 pockets: each its own place, 8 a face', () => {
  const seen = new Set(), per = [0, 0, 0, 0];
  for (let s = 0; s < P.CAR.cap; s++) { const p = P.pocket(s); seen.add([p.face, p.tier, p.col].join()); per[p.face]++; assert.ok(p.y > 0.4 && p.y < 2.3 && Math.abs(p.x) < 0.3); }
  assert.equal(seen.size, 32); assert.deepEqual(per, [8, 8, 8, 8]); assert.equal(P.pocket(0).tier, 0); assert.equal(P.pocket(9).face, 1);
});
t('faces and angles agree, whichever way round and however many turns', () => {
  for (let f = 0; f < 4; f++) { assert.equal(P.faceAt(P.angleFor(f)), f); assert.equal(P.faceAt(P.angleFor(f) + 4 * Math.PI), f); assert.equal(P.faceAt(P.angleFor(f) - 6 * Math.PI + 0.2), f); }
  const a = P.angleFor(3, 20); assert.ok(Math.abs(a - 20) <= Math.PI + 1e-9); assert.equal(P.faceAt(a), 3);
});
t('let go while turning: it coasts the way it was going, slows, and settles exactly on a face', () => {
  for (const w0 of [7, -7, 2.5, -0.8, 0.2]) { const s = { a: 0.37, w: w0, target: null }; let steps = 0, moved = 0, a0 = s.a; while (P.spin(s, 1 / 60) && steps++ < 2000) moved = s.a - a0;
    assert.ok(steps < 2000, 'settles'); assert.equal(s.w, 0); assert.ok(Math.abs(s.a / Q - Math.round(s.a / Q)) < 1e-9, 'on a face'); if (Math.abs(w0) > 2) assert.ok(Math.sign(moved) === Math.sign(w0), 'coasted the right way'); }
  const fast = { a: 0, w: 8, target: null }, slow = { a: 0, w: 3, target: null }; while (P.spin(fast, 1 / 60)); while (P.spin(slow, 1 / 60)); assert.ok(fast.a > slow.a, 'a harder flick turns it further');
});
t('order: the list\'s own, A–Z, or yours — a list that changed is followed, nothing is lost or doubled', () => {
  const cards = ['b', 'a', 'c', 'd'].map((x) => ({ ref: 'L/' + x, title: x }));
  assert.deepEqual(P.orderRefs(cards, { order: 'list' }), ['L/b', 'L/a', 'L/c', 'L/d']);
  assert.deepEqual(P.orderRefs(cards, { order: 'title' }), ['L/a', 'L/b', 'L/c', 'L/d']);
  const mine = P.orderRefs(cards, { order: 'custom', it: ['L/d', 'L/gone', 'L/a', 'L/d'] }); assert.deepEqual(mine, ['L/d', 'L/a', 'L/b', 'L/c']);
  const sw = P.swapped(['x', 'y', 'z'], 0, 2); assert.deepEqual(sw, ['z', 'y', 'x']); assert.equal(P.pages(33, 32), 2); assert.equal(P.pages(0, 32), 1);
  assert.deepEqual(cards.map((c) => c.ref), ['L/b', 'L/a', 'L/c', 'L/d'], 'the list itself is untouched');
});
t('the record keeps choices only', () => {
  const m = P.cleanMx({ type: 'carousel', list: 7, order: 'custom', it: ['a', 2], face: -1, page: -3, auto: 1, angle: 1.234, speed: 9, evil: () => 1 });
  assert.deepEqual(m, { v: 1, type: 'carousel', list: '7', order: 'custom', face: 3, page: 0, auto: true, it: ['a', '2'] });
  assert.equal(P.cleanMx({ type: 'rolodex' }).unknown, 'rolodex'); assert.equal(P.cleanMx({ order: 'list', it: ['a'] }).it, undefined);
});
console.log(n + ' passed');
