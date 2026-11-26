/* Board sync repair (2026-11-26): the three-way board merge and the built-in board edits. node tests/cloud-sync/board-merge.test.cjs */
const assert = require('assert'), fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..', '..');
const merge = require(path.join(ROOT, 'tools/cloud-transport/board-merge.js'));
const C = x => JSON.parse(JSON.stringify(x));
const card = (id, t, extra) => Object.assign({ id, title: t || id }, extra || {});
const board = (id, cols) => ({ id, title: id, columns: cols.map(([cid, cards]) => ({ id: cid, title: cid, cards })) });
const cardIds = b => b.columns.map(c => c.id + ':' + c.cards.map(k => k.id).join(','));

const base = [board('b1', [['A', [card('1'), card('2'), card('3')]], ['B', [card('4')]]]), board('b2', [['X', []]])];

// a reorder made on this device survives a merge with an untouched server copy (before: the server's order always won)
let l = C(base); l[0].columns[0].cards = [l[0].columns[0].cards[2], l[0].columns[0].cards[0], l[0].columns[0].cards[1]];
assert.deepStrictEqual(cardIds(merge(base, l, C(base), false)[0]), ['A:3,1,2', 'B:4']);
// … and the same from the other side
assert.deepStrictEqual(cardIds(merge(base, C(base), l, true)[0]), ['A:3,1,2', 'B:4']);
// lists and boards reorder too
l = C(base); l[0].columns.reverse(); assert.deepStrictEqual(merge(base, l, C(base), false)[0].columns.map(c => c.id), ['B', 'A']);
l = C(base); l.reverse(); assert.deepStrictEqual(merge(base, l, C(base), false).map(b => b.id), ['b2', 'b1']);

// a card moved here while another device edited it: it ends up moved, with the edit
l = C(base); const moved = l[0].columns[0].cards.splice(0, 1)[0]; l[0].columns[1].cards.push(moved);
let r = C(base); r[0].columns[0].cards[0].title = 'new';
let m = merge(base, l, r, false)[0];
assert.deepStrictEqual(cardIds(m), ['A:2,3', 'B:4,1']);
assert.strictEqual(m.columns[1].cards[1].title, 'new');

// field-level: a tick here and a title edit elsewhere both survive, whichever side is newer
l = C(base); l[0].columns[0].cards[1].isDone = true;
r = C(base); r[0].columns[0].cards[1].title = 'renamed';
for (const newer of [true, false]) {
  const k = merge(base, l, r, newer)[0].columns[0].cards[1];
  assert.strictEqual(k.isDone, true); assert.strictEqual(k.title, 'renamed');
}
// both changed the same field: the newer side wins
l = C(base); l[0].columns[0].cards[0].title = 'mine'; r = C(base); r[0].columns[0].cards[0].title = 'theirs';
assert.strictEqual(merge(base, l, r, true)[0].columns[0].cards[0].title, 'mine');
assert.strictEqual(merge(base, l, r, false)[0].columns[0].cards[0].title, 'theirs');

// deleted here, untouched there: gone; deleted here, edited there: kept
l = C(base); l[0].columns[0].cards.splice(1, 1);
assert.deepStrictEqual(cardIds(merge(base, l, C(base), false)[0]), ['A:1,3', 'B:4']);
r = C(base); r[0].columns[0].cards[1].title = 'edited';
assert.deepStrictEqual(cardIds(merge(base, l, r, true)[0]), ['A:1,2,3', 'B:4']);
// added on both sides: both kept, each after its neighbour
l = C(base); l[0].columns[0].cards.splice(1, 0, card('L'));
r = C(base); r[0].columns[0].cards.push(card('R'));
assert.deepStrictEqual(cardIds(merge(base, l, r, false)[0]), ['A:1,L,2,3,R', 'B:4']);
// no base: nothing is inferred deleted
assert.deepStrictEqual(cardIds(merge(null, l, r, true)[0]).join('|').split(/[:,|]/).filter(x => /^\w$/.test(x) && x !== 'A' && x !== 'B').sort(), ['1', '2', '3', '4', 'L', 'R']);
// fields the merge does not know (★ favourite) are kept
l = C(base); l[0].columns[0].cards[0].favorite = true;
assert.strictEqual(merge(base, l, C(base), false)[0].columns[0].cards[0].favorite, true);

// a card's stacked cards (My World items) and checklist items merge item by item
{
  const sb = [board('w', [['A', [card('k', 'K', { stack: [card('s1'), card('s2')], checklistItems: [{ id: 'i1', text: 'x', done: false }] })]]])];
  const sl = C(sb), sr = C(sb), kl = sl[0].columns[0].cards[0], kr = sr[0].columns[0].cards[0];
  kl.stack.push(card('s3')); kl.checklistItems[0].done = true; kl.stack.reverse();
  kr.stack[0].title = 'renamed'; kr.checklistItems.push({ id: 'i2', text: 'y', done: false }); kr.stack.splice(1, 1);
  const k = merge(sb, sl, sr, false)[0].columns[0].cards[0];
  assert.deepStrictEqual(k.stack.map(s => s.id), ['s3', 's1']); assert.strictEqual(k.stack[1].title, 'renamed');
  assert.deepStrictEqual(k.checklistItems.map(i => i.id + ':' + i.done), ['i1:true', 'i2:false']);
}
// laws: merge(b, x, x) = x, merge(b, l, b) = l, merge(b, b, r) = r
for (const x of [l, r, base]) {
  assert.deepStrictEqual(merge(base, x, C(x), true), x);
  assert.deepStrictEqual(merge(base, C(x), C(base), true), x);
  assert.deepStrictEqual(merge(base, C(base), C(x), false), x);
}

// fuzz: random edits on two sides never duplicate or lose an id that one side kept and nobody deleted
let seed = 7; const rnd = n => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed % n; };
function mutate(bs, tag) {
  const out = C(bs);
  for (let i = 0; i < 6; i++) {
    const b = out[rnd(out.length)], cols = b.columns, c = cols[rnd(cols.length)], op = rnd(5);
    if (op === 0) c.cards.push(card(tag + i));
    else if (op === 1 && c.cards.length) c.cards.splice(rnd(c.cards.length), 1);
    else if (op === 2 && c.cards.length) { const k = c.cards.splice(rnd(c.cards.length), 1)[0]; cols[rnd(cols.length)].cards.push(k); }
    else if (op === 3 && c.cards.length > 1) c.cards.reverse();
    else if (c.cards.length) c.cards[rnd(c.cards.length)].title = tag + i;
  }
  return out;
}
for (let n = 0; n < 300; n++) {
  const a = mutate(base, 'l' + n + '_'), b = mutate(base, 'r' + n + '_'), out = merge(base, a, b, n % 2 === 0);
  const all = out.flatMap(x => x.columns.flatMap(c => c.cards.map(k => k.id)));
  assert.strictEqual(new Set(all).size, all.length, 'duplicate card in fuzz ' + n);
  const has = new Set(all);
  [a, b].forEach(side => side.forEach(x => x.columns.forEach(c => c.cards.forEach(k => { if (k.id.length > 1) assert(has.has(k.id), 'lost new card ' + k.id); }))));
  assert.deepStrictEqual(merge(base, out, C(out), true), out);
}

// built-in boards: this device's ticks travel as per-card edits and come back on a fresh default on another device
const app = fs.readFileSync(path.join(ROOT, 'tools/cloud-transport/board-app.js'), 'utf8');
function device() {
  const store = {};
  const ctx = { window: {}, JSON, Object, Array, Number, Math, Date, String,
    localStorage: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); } },
    MINEST_EC6_OUTLINE: board('board-ec6-outline', [['o1', [card('c1'), card('c2'), card('c3')]], ['o2', [card('c4')]]]),
    MINEST_EC6_GLOSSARY: board('board-ec6-glossary', [['g1', [card('w1')]]]),
    sanitizeLoadedBoards: list => C(list) };
  ctx.window.MinestBoardMerge = merge;
  vm.createContext(ctx); vm.runInContext(app, ctx);
  return ctx;
}
const A = device(), Bd = device();
const fresh = d => C([d.MINEST_EC6_OUTLINE, d.MINEST_EC6_GLOSSARY, board('mine', [['m', [card('k')]]])]);
let aBoards = fresh(A); aBoards[0].columns[0].cards[1].isDone = true; aBoards[0].columns[0].cards[1].mastery = 3;
const moveC3 = aBoards[0].columns[0].cards.splice(2, 1)[0]; aBoards[0].columns[1].cards.push(moveC3);
const payload = A.minestBuiltinEditsPayload(aBoards);
assert(payload && payload['board-ec6-outline'] && payload['board-ec6-outline'].c2 && payload['board-ec6-outline'].c3);
assert.strictEqual(Bd.minestBuiltinEditsPayload(fresh(Bd)), null, 'untouched built-in boards send nothing');
let bBoards = fresh(Bd);
const todo = Bd.minestBuiltinIncoming(C(payload), bBoards);
const patched = Bd.minestBuiltinPatchAll(bBoards, todo);
assert.strictEqual(JSON.stringify(patched[0]), JSON.stringify(aBoards[0]), 'built-in edits arrive whole on the other device');
assert.strictEqual(patched[2], bBoards[2], 'other boards untouched');
assert.strictEqual(JSON.stringify(Bd.minestBuiltinIncoming(C(payload), patched)), '{}', 'an edit is applied once');
assert.strictEqual(JSON.stringify(Bd.minestBuiltinEditsPayload(patched)), JSON.stringify(payload), 'taking an edit in does not restamp it (no echo)');
// keepBuiltins keeps this device's built-in boards over whatever a cloud copy has
const kept = Bd.minestKeepBuiltins([board('board-ec6-outline', [['o1', []]]), board('mine', [])], patched);
assert.strictEqual(kept[0], patched[0]); assert.deepStrictEqual(Array.from(kept, b => b.id), ['board-ec6-outline', 'board-ec6-glossary', 'mine']);

// the patched pages carry the repair
const pages = ['iPhoneDuo.html', 'index.html', 'ipad.html', 'iphone.html', 'ios/Minest/Minest/iphone18.0.html'];
for (const p of pages) {
  const f = path.join(ROOT, p); if (!fs.existsSync(f)) continue;
  const s = fs.readFileSync(f, 'utf8');
  if (!s.includes('board sync repair (tools/cloud-transport/board-app.js')) { console.log('not yet patched: ' + p); continue; }
  assert(s.includes('minestBoardsBoot.then(function() { return minestCloudBoards(data); })'), p + ': cloud waits for local boards');
  assert(s.includes('return Object.assign({}, card, {'), p + ': unknown card fields kept');
  assert(s.includes('if (builtinEdits) base.builtinEdits = builtinEdits;'), p + ': built-in edits in the payload');
}
console.log('PASS: board merge keeps reorders, moves with edits, field-level edits, adds and edited deletes; laws and fuzz hold; built-in board edits round-trip');
