// 动态卡片 2.0 (cards-2/): the page is a layer over the unchanged 1.0 engine, reads Minest's boards without writing them,
// and keeps its own settings apart from Minest's.
// node tests/cards-2/cards2.test.cjs → "cards-2: ok"
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const R = path.join(__dirname, '..', '..'), rd = p => fs.readFileSync(path.join(R, p), 'utf8');
const html = rd('cards-2/index.html'), data = rd('cards-2/v2-data.js'), v2 = rd('cards-2/v2.js'), engine = rd('tools/cover-modes/cover-modes.js');

// ---------------------------------------------------------------- 1 · the page and the 1.0 engine
const srcs = [...html.matchAll(/<script src="([^"]+)"/g)].map(m => m[1]);
assert.deepStrictEqual(srcs, ['v2-data.js', '../tools/cover-modes/card-styles.js', '../tools/cover-modes/cover-modes.js', '../tools/cover-modes/explode.js', 'v2.js'], 'the 1.0 scripts are loaded as they are, between the data and the 2.0 layer');
srcs.forEach(s => assert(fs.existsSync(path.join(R, 'cards-2', s)), s + ' exists'));
assert(/window\.__cmStandalone = 1/.test(html) && html.indexOf('__cmStandalone = 1') < html.indexOf('src="../tools/cover-modes/cover-modes.js"'), 'the engine is told it stands alone before it loads');
assert(/class="sf-slot[^"]*" data-sf-view="coverflow"/.test(html) && /<body class="[^"]*mode-coverflow/.test(html), 'the slot the engine draws in');
const ignore = rd('.vercelignore').split('\n');
['cover-modes.js', 'card-styles.js', 'explode.js'].forEach(f => assert(ignore.includes('!tools/cover-modes/' + f), f + ' is deployed (tools/ is otherwise left out)'));
assert(!ignore.some(l => /^\/?cards-2/.test(l)), 'cards-2/ is deployed');

const modes10 = eval(engine.match(/var MODES = (\[[\s\S]*?\]);/)[1]).map(m => m[0]), zh10 = eval('(' + engine.match(/MZH = (\{[^}]*\})/)[1] + ')');
const modes20 = eval(v2.match(/var MODES = (\[[\s\S]*?\]);/)[1]);
assert.deepStrictEqual(modes20.map(m => m[0]), modes10, 'the deck has every 1.0 mode, in the same order');
assert.strictEqual(modes10.length, 11);
modes20.forEach(m => { assert.strictEqual(m[1], zh10[m[0]], m[0] + ' keeps its name'); assert(/^#[0-9a-f]{6}$/.test(m[3]), m[0] + ' has a colour'); });
assert.strictEqual(eval(v2.match(/var KEYS = (\[[^\]]*\]);/)[1]).length, modes20.length, 'a key for every mode');

// ---------------------------------------------------------------- 2 · settings apart from Minest's
function storage() { const m = new Map(); class Storage { getItem(k) { return m.has(k) ? m.get(k) : null; } setItem(k, v) { m.set(k, String(v)); } removeItem(k) { m.delete(k); } } return { Storage, ls: new Storage(), raw: m }; }
{
  const s = storage(); s.raw.set('minest.coverMode', 'wall'); s.raw.set('minest.cardStyle', 'neon'); s.raw.set('focusboard_active_id_v7_2', 'b1');
  const remap = html.match(/<script>\/\* 2\.0 remembers its own[\s\S]*?<\/script>/)[0].replace(/^<script>|<\/script>$/g, '');
  vm.runInNewContext(remap, { Storage: s.Storage, String });
  assert.strictEqual(s.ls.getItem('minest.coverMode'), null, '2.0 does not start from the 1.0 mode');
  s.ls.setItem('minest.coverMode', 'sphere'); s.ls.setItem('minest.cardStyle', 'glass'); s.ls.setItem('minest.coverSpeed', '2');
  assert.strictEqual(s.raw.get('minest.coverMode'), 'wall', 'the 1.0 mode is not overwritten');
  assert.strictEqual(s.raw.get('minest.cardStyle'), 'neon', 'the 1.0 card style is not overwritten');
  assert.strictEqual(s.raw.get('minest.cards2.coverMode'), 'sphere'); assert.strictEqual(s.raw.get('minest.cards2.cardStyle'), 'glass'); assert.strictEqual(s.raw.get('minest.cards2.coverSpeed'), '2');
  assert.strictEqual(s.ls.getItem('minest.coverMode'), 'sphere');
  s.ls.removeItem('minest.coverMode'); assert.strictEqual(s.raw.get('minest.coverMode'), 'wall'); assert(!s.raw.has('minest.cards2.coverMode'));
  assert.strictEqual(s.ls.getItem('focusboard_active_id_v7_2'), 'b1', 'other keys pass through');
}

// ---------------------------------------------------------------- 3 · the cards
function load(opts) {   // opts: { ls: {key: value}, idb: boards | undefined, search }
  const s = storage(); Object.entries(opts.ls || {}).forEach(([k, v]) => s.raw.set(k, v));
  const before = new Map(s.raw), events = [], win = { dispatchEvent: e => events.push(e.type), indexedDB: undefined };
  let opened = 0, wrote = false;
  if ('idb' in opts) win.indexedDB = { open(name, version) {
    opened++; assert.strictEqual(name, 'focusboard_idb_v1'); assert.strictEqual(version, undefined, 'opened at whatever version Minest left it');
    const req = {}; setImmediate(() => {
      if (opts.idb === null) { req.transaction = { abort() { req.aborted = true; } }; req.onupgradeneeded(); assert(req.aborted, 'a database Minest has not made is not created'); req.onerror(); return; }
      req.result = { objectStoreNames: { contains: n => n === 'kv' }, close() {}, transaction(n, mode) { if (mode !== 'readonly') wrote = true; return { objectStore: () => ({ get(k) { assert.strictEqual(k, 'boards'); const g = {}; setImmediate(() => { g.result = opts.idb; g.onsuccess(); }); return g; } }) }; } };
      req.onsuccess();
    }); return req; } };
  const ctx = { window: win, localStorage: s.ls, location: { search: opts.search || '' }, CustomEvent: function (t) { this.type = t; }, indexedDB: win.indexedDB, JSON, Array, encodeURIComponent };
  vm.runInNewContext(data, ctx);
  return new Promise(res => win.Cards2Data.ready(() => res({ D: win.Cards2Data, AI: win.MinestAI, IV: win.MinestImageViews, raw: s.raw, before, events, opened, wrote: () => wrote })));
}
const ids = l => Array.from(l, c => c.id);   // (lists made inside the vm are another realm's arrays)
const card = (id, title, extra) => Object.assign({ id, title }, extra || {});
const mine = [
  { id: 'b1', title: 'Reading', columns: [{ id: 'c1', title: 'Now', color: '#ff0000', cards: [card('a', 'Dune', { cover: { type: 'image', value: 'https://x/dune.jpg', thumbnailUrl: 'https://x/dune-s.jpg', width: 3, height: 4 }, stack: [card('a1', 'Dune II'), null] }), card('b', 'Emma')] }, { id: 'c2', title: 'Later', cards: [card('c', 'Ulysses', { image: { url: 'https://x/u.jpg' } })] }, { id: 'c3', title: 'Empty', cards: [] }] },
  { id: 'b2', title: 'Trips', columns: [{ id: 'd1', title: 'Asia', cards: [card('k', 'Kyoto')] }] },
  { id: 'b3', title: 'Nothing yet', columns: [{ id: 'e1', title: 'x', cards: [] }] }
];
(async () => {
  // nothing on this device: the sample deck, and nothing is written or created
  let r = await load({ idb: null });
  assert(r.D.sample() && r.D.boards().length === 1 && r.D.count(r.D.board()) >= 24, 'a sample deck when there are no boards');
  const sample = Array.from(r.IV.cards(r.AI.board()));
  assert(sample.every(c => c.id && c.title && /^data:image\/svg\+xml,/.test(r.IV.image(c).thumb)), 'sample cards carry their own artwork (nothing fetched)');
  assert.strictEqual(new Set(sample.map(c => c.id)).size, sample.length);
  assert.deepStrictEqual([...r.raw], [], 'nothing written');

  // Minest's boards from localStorage; the board it has open is the one shown
  r = await load({ ls: { focusboard_boards_v7_2: JSON.stringify(mine), focusboard_active_id_v7_2: 'b2' } });
  assert(!r.D.sample()); assert.deepStrictEqual(ids(r.D.boards()), ['b1', 'b2'], 'boards without cards are left out');
  assert.strictEqual(r.D.board().id, 'b2'); assert.strictEqual(r.AI.board().id, 'b2');
  r.D.pick('b1', ''); let cards = r.IV.cards(r.AI.board());
  assert.deepStrictEqual(ids(cards), ['a', 'a1', 'b', 'c'], 'every card, stacked ones after their parent');
  assert.deepStrictEqual([cards[0].columnId, cards[0].columnTitle, cards[0].columnColor, cards[0].parentCardId], ['c1', 'Now', '#ff0000', null]);
  assert.strictEqual(cards[1].parentCardId, 'a'); assert.strictEqual(cards[3].columnColor, '#30d158');
  assert.deepStrictEqual(JSON.parse(JSON.stringify(r.IV.image(cards[0]))), { full: 'https://x/dune.jpg', thumb: 'https://x/dune-s.jpg', asset: null, width: 3, height: 4 });
  assert.strictEqual(r.IV.image(cards[3]).thumb, 'https://x/u.jpg'); assert.strictEqual(r.IV.image(cards[2]).thumb, '');
  assert.strictEqual(r.D.count(mine[0]), 4);
  r.D.pick('b1', 'c2'); assert.strictEqual(r.D.listId(), 'c2'); assert.deepStrictEqual(ids(r.IV.cards(r.AI.board())), ['c'], 'one list');
  assert.notStrictEqual(r.AI.board().id, 'b1', 'the engine sees a list as a different deck'); assert.strictEqual(r.D.board().columns.length, 3, 'the board itself is not cut down');
  r.D.pick('b1', 'nope'); assert.strictEqual(r.D.listId(), ''); r.D.pick('nope', ''); assert.strictEqual(r.D.board().id, 'b1');
  r.D.pick('b1', 'c2');
  assert(r.events.length >= 4 && r.events.every(e => e === 'cards2:data'));
  const changed = [...r.raw.keys()].filter(k => r.raw.get(k) !== r.before.get(k));
  assert.deepStrictEqual(changed, ['minest.cards2.board'], 'only its own choice is written; Minest\'s boards and open board are untouched');
  const kept = Object.fromEntries(r.raw);

  // the choice is remembered; IndexedDB (the full copy) wins over localStorage
  const full = JSON.parse(JSON.stringify(mine)); full[0].columns[1].cards.push(card('z', 'Zadig'));
  r = await load({ ls: kept, idb: full });
  assert.strictEqual(r.opened, 1); assert(!r.wrote(), 'IndexedDB is only read');
  assert.strictEqual(r.D.board().id, 'b1'); assert.strictEqual(r.D.listId(), 'c2');
  assert.deepStrictEqual(ids(r.IV.cards(r.AI.board())), ['c', 'z']);
  // the same cards with other words in IndexedDB: a newer deck to the engine (it keeps a deck by its id), and to the page
  const reworded = JSON.parse(JSON.stringify(mine)); reworded[0].columns[0].cards[1].title = 'Emma (1815)';
  r = await load({ ls: { focusboard_boards_v7_2: JSON.stringify(mine) }, idb: reworded });
  assert.strictEqual(r.D.rev(), 2); assert.strictEqual(r.AI.board().id, 'b1@2'); assert.strictEqual(r.D.board().id, 'b1');
  assert.strictEqual(r.IV.cards(r.AI.board())[2].title, 'Emma (1815)');
  r.D.pick('b1', 'c2'); assert.strictEqual(r.AI.board().id, 'b1#c2@2'); assert.strictEqual(r.D.rev(), 2, 'choosing a list is not new data');
  r = await load({ ls: { focusboard_boards_v7_2: JSON.stringify(mine) }, idb: JSON.parse(JSON.stringify(mine)) });
  assert.strictEqual(r.D.rev(), 1, 'the same boards in both copies: nothing to show again'); assert.strictEqual(r.AI.board().id, 'b1');
  r = await load({ idb: JSON.stringify(mine) }); assert(!r.D.sample() && r.D.boards().length === 2, 'boards only in IndexedDB are found');
  r = await load({ ls: { focusboard_boards_v7_2: '{broken' }, idb: [{ id: 'q' }, null, 7] }); assert(r.D.sample(), 'unreadable data falls back to the sample');

  // ?sample
  r = await load({ ls: { focusboard_boards_v7_2: JSON.stringify(mine) }, idb: mine, search: '?sample' });
  assert(r.D.sample() && r.opened === 0, '?sample shows the sample deck whatever is stored');
  console.log('cards-2: ok');
})().catch(e => { console.error(e); process.exit(1); });
