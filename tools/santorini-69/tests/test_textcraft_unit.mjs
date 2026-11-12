// node tools/santorini-69/tests/test_textcraft_unit.mjs — the pure part of ui/world-textcraft.js
import { createRequire } from 'module';
import assert from 'assert';
const P = createRequire(import.meta.url)('../../../ui/world-textcraft.js');
let n = 0; const t = (name, fn) => { fn(); n++; console.log('ok', name); };

t('text is kept, cleaned and counted by grapheme cluster', () => {
  assert.equal(P.normalizeText('a​b\r\nc\u0007\td'), 'ab\nc d');
  assert.equal(P.normalizeText('<b onclick=x>hi</b>'), '<b onclick=x>hi</b>');   // kept as text, never read as markup
  assert.equal(P.count('école'), 5); assert.equal(P.count('发现世界'), 4); assert.equal(P.count('我的 World 2026'), 13);
  assert.equal(P.count('👨‍👩‍👧'), 1); assert.equal(P.count('a\nb'), 2);
});
t('thresholds: 1–32 solid on at most two lines · 33–120 plaque · longer: title + reader', () => {
  const m = (s) => P.classify(s).mode;
  assert.equal(m(''), 'empty'); assert.equal(m(' \n\n '), 'empty'); assert.equal(m('\u0007'), 'empty');
  assert.equal(m('a'.repeat(32)), 'solid'); assert.equal(m('a'.repeat(33)), 'plaque');
  assert.equal(m('字'.repeat(120)), 'plaque'); assert.equal(m('字'.repeat(121)), 'entry');
  assert.equal(m('a\nb'), 'solid'); assert.equal(m('a\nb\nc'), 'plaque');
  assert.equal(P.classify('字'.repeat(121)).n, 121);
});
t('titles: the first line, at most 24, never silently the whole text', () => {
  assert.equal(P.titleOf('短标题\n正文'), '短标题');
  const long = P.titleOf('字'.repeat(60)); assert.equal(P.count(long), 24); assert.ok(long.endsWith('…'));
});
t('eight kits, each with its own kind of geometry, display, tool and palettes', () => {
  assert.deepEqual(P.KIT_IDS, ['stone', 'letterpress', 'glass', 'voxel', 'wood', 'thread', 'botanical', 'ceramic']);
  const kinds = new Set(P.KIT_IDS.map((k) => P.KITS[k].geometryKind)); assert.equal(kinds.size, 8);
  for (const k of P.KIT_IDS) { const K = P.KITS[k]; assert.ok(K.display && K.tool && K.seconds >= 3 && K.seconds <= 6 && K.pals.length >= 3, k); assert.ok(P.palOf(k, 'nope') === K.pals[0][2]); }
});
t('recipes: unknown kit, palette or size fall back; the words survive; nothing else is kept', () => {
  const s = P.cleanSpec({ text: '你好', kit: 'lava', pal: 7, size: 'huge', seed: -5, evil: 'x()', src: { mode: 'card', ref: 'l/c', extra: 1 } });
  assert.equal(s.text, '你好'); assert.equal(s.kit, 'voxel'); assert.equal(s.unknownKit, 'lava'); assert.equal(s.size, 'm'); assert.equal(s.evil, undefined); assert.deepEqual(s.src, { mode: 'card', ref: 'l/c' });
  assert.equal(P.scaleOf('l'), 1.5);
});
t('same recipe → same key; anything that changes the shape changes it', () => {
  const a = P.cleanSpec({ text: '发现世界', kit: 'wood', seed: 9 }), k = P.cacheKey(a);
  assert.equal(P.cacheKey(P.cleanSpec({ text: '发现世界', kit: 'wood', seed: 9 })), k);
  for (const ch of [{ text: '发现世界!' }, { kit: 'stone' }, { seed: 10 }, { pal: 'walnut' }, { size: 'l' }]) assert.notEqual(P.cacheKey(P.cleanSpec({ ...a, ...ch })), k);
});
t('seeded numbers repeat', () => {
  const a = P.rng(42), b = P.rng(42), c = P.rng(43); const x = [a(), a(), a()], y = [b(), b(), b()];
  assert.deepEqual(x, y); assert.notEqual(c(), x[0]); assert.ok(x.every((v) => v >= 0 && v < 1)); assert.equal(P.h2(3, 4, 5), P.h2(3, 4, 5));
});
t('slab mesher: no faces between filled cells, strips merged, reveal order kept', () => {
  const rec = () => { const q = []; return { q, box: (x0, y0, z0, x1, y1, z1, col, mask) => q.push({ x0, y0, x1, y1, mask, col }) }; };
  const red = [1, 0, 0], full = () => true, g = { x0: 0, y0: 0, c: 1, z0: 0, z1: 1 };
  let B = rec(); P.slab(B, 3, 2, full, () => red, g, { order: 'x' });
  const faces = B.q.filter((b) => b.mask & 48), sides = B.q.filter((b) => b.mask & 15);
  assert.equal(faces.length, 3); assert.ok(faces.every((b) => b.y1 - b.y0 === 2));   // one strip per column
  const bits = (m) => [1, 2, 4, 8].filter((x) => m & x).length; assert.equal(sides.reduce((a, b) => a + bits(b.mask), 0), 10);   // only the outline: 3+3+2+2
  assert.deepEqual(faces.map((b) => b.x0), [0, 1, 2]);   // left → right
  B = rec(); P.slab(B, 3, 2, full, () => red, g, { order: 'y' }); assert.deepEqual(B.q.filter((b) => b.mask & 48).map((b) => b.y0), [0, 1]);   // bottom → top
  B = rec(); P.slab(B, 2, 1, full, (i) => (i ? red : [0, 1, 0]), g, { order: 'y' }); assert.equal(B.q.filter((b) => b.mask & 48).length, 2);   // colours are not merged
  B = rec(); P.slab(B, 3, 1, (i) => i !== 1, () => red, g, { back: false }); assert.ok(B.q.filter((b) => b.mask & 48).every((b) => b.mask === 16)); assert.equal(B.q.filter((b) => b.mask & 48).length, 2);
});
console.log(n + ' passed');
