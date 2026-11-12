// node tools/santorini-69/tests/test_displays70_unit.mjs — the pure part of ui/world-displays.js
import { createRequire } from 'module';
import assert from 'assert';
const P = createRequire(import.meta.url)('../../../ui/world-displays.js');
let n = 0; const t = (name, fn) => { fn(); n++; console.log('ok', name); };

t('eleven fixtures, every slot inside its footprint', () => {
  assert.equal(P.KIND_IDS.length, 11);
  for (const id of P.KIND_IDS) { const k = P.KINDS[id]; assert.ok(P.capOf(id) >= k.slots.length);
    for (const s of k.slots) { assert.ok(Math.abs(s.x) <= k.w * 4 && s.y >= 0 && s.y <= k.h * 8, id); }
    for (const b of k.boxes) { assert.ok(b[0] < b[3] && b[1] < b[4] && b[2] < b[5], id + ' box'); assert.ok(Math.abs(b[0]) <= k.w * 4 + .2 && Math.abs(b[3]) <= k.w * 4 + .2 && Math.abs(b[2]) <= k.d * 4 + .2 && Math.abs(b[5]) <= k.d * 4 + .2 && b[4] <= k.h * 8, id + ' box in footprint'); } }
});
t('69 displays migrate: untouched seeds go, edited ones stay with their card in slot 0', () => {
  const seeds = [{ id: 'disp-1', kind: 'easel', cardId: 'A', x: 18.5, y: 4, z: 22.5, rot: 0, room: 'r-art-1' }, { id: 'disp-2', kind: 'shelf', cardId: 'B', x: 32.5, y: 3, z: 26.5, rot: 1, room: 'r-art-1' }];
  assert.equal(P.migrate(seeds).length, 0);
  const out = P.migrate([{ ...seeds[1], x: 40.5 }, { id: 'disp-9', kind: 'showcase', cardId: 'C', x: 5.5, y: 9, z: 6.5, rot: 5 }]);
  assert.deepEqual(out.map(d => d.kind), ['bookshelf', 'vitrine']); assert.deepEqual(out[1].it, ['C']); assert.equal(out[1].rot, 1);
});
t('footprints snap to the block grid and turn with the fixture', () => {
  const a = P.normalize({ id: 'a', kind: 'framewall', x: 10.3, y: 5, z: 7.4, rot: 0 }); assert.deepEqual([P.rect(a).x0, P.rect(a).x1, P.rect(a).z0, P.rect(a).z1], [8, 11, 7, 7]); assert.equal(a.x, 10);
  const b = P.normalize({ id: 'b', kind: 'framewall', x: 10.3, y: 5, z: 7.4, rot: 1 }); assert.deepEqual([P.rect(b).x1 - P.rect(b).x0, P.rect(b).z1 - P.rect(b).z0], [0, 3]);
  assert.ok(P.hits(P.rect(a), P.rect(b))); assert.ok(!P.hits(P.rect(a), P.rect(P.normalize({ id: 'c', kind: 'easel', x: 20.5, y: 5, z: 7.5 }))));
  assert.ok(!P.hits(P.rect(a), P.rect(P.normalize({ id: 'c', kind: 'easel', x: 10.5, y: 20, z: 7.5 }))), 'another level');
});
t('front row and facing', () => {
  assert.deepEqual([0, 1, 2, 3].map(r => P.rotToward(P.FRONT[r][0], P.FRONT[r][1])), [0, 1, 2, 3]);
  const f = P.frontOf({ x0: 3, x1: 4, z0: 5, z1: 5, y: 1, h: 2 }, 2); assert.deepEqual([f.z0, f.z1], [4, 5]);
});
t('curation picks by what the list is', () => {
  const mk = (n, o = {}) => ({ cards: Array.from({ length: n }, (_, i) => ({ title: (o.year ? 1900 + i + ' ' : '') + 'T' + i, pic: o.pic ? 'p' : '' })) });
  assert.equal(P.curate(mk(1))[0].kind, 'vitrine'); assert.equal(P.curate(mk(3))[0].kind, 'podium');
  assert.equal(P.curate(mk(5, { year: 1 }))[0].kind, 'timeline'); assert.equal(P.curate(mk(4, { pic: 1 }))[0].kind, 'salon');
  assert.equal(P.curate(mk(10, { pic: 1 }))[0].kind, 'framewall'); assert.equal(P.curate(mk(5))[0].kind, 'cabinet');
  const big = P.curate(mk(16))[0]; assert.equal(big.kind, 'bookshelf'); assert.equal(big.fixtures, 2); assert.equal(big.left, 0);
  assert.equal(P.curate(mk(100, { pic: 1 }))[0].left, 100 - 24); assert.deepEqual(P.curate({ cards: [] }), []);
});
t('rows: side by side, one block apart, never overlapping, in every direction', () => {
  for (const kind of P.KIND_IDS) for (let rot = 0; rot < 4; rot++) { const row = P.planRow(kind, 4, 50.2, 60.7, rot);
    for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) assert.ok(!P.hits(P.rect(row[i]), P.rect(row[j])), kind + rot); }
});
t('sorting keeps every card', () => {
  const c = [{ title: 'b 1999' }, { title: 'a', pic: 'x' }, { title: 'c 1066' }];
  assert.deepEqual(P.sortCards(c, 'title').map(x => x.title[0]), ['a', 'b', 'c']); assert.equal(P.sortCards(c, 'date')[0].title, 'c 1066'); assert.equal(P.sortCards(c, 'pic')[0].title, 'a');
  assert.equal(P.sortCards(c, 'shuffle', 7).length, 3); assert.equal(P.yearOf({ title: 'x', date: '2021-03-04' }) > 2021, true); assert.equal(P.yearOf({ title: 'Room 12345' }), null);
});
console.log(n + ' passed');
