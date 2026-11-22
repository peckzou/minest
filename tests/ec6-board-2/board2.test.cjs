// EC–6 布告栏 2.0 (ec6-board-2/): 1.0's board runs unchanged under it, 2.0 keeps its own saved board, and the hooks 2.0 presses still exist in 1.0.
// node tests/ec6-board-2/board2.test.cjs → "ec6-board-2: ok"
const fs = require('fs'), path = require('path'), assert = require('assert'), vm = require('vm');
const R = path.join(__dirname, '..', '..'), rd = p => fs.readFileSync(path.join(R, p), 'utf8');
const html = rd('ec6-board-2/index.html'), v1 = rd('spatial-home/js/board-ec6.js'), v2 = rd('ec6-board-2/v2.js');
const K1 = 'minest.ec6board.v1', K2 = 'minest.ec6board2.v1', KD = 'minest.ec6board2.demo';

// ---------------------------------------------------------------- 1 · the page: 1.0's script as it is, then 2.0's
const scripts = [...html.matchAll(/<script(?: src="([^"]+)")?>([\s\S]*?)<\/script>/g)].map(m => ({ src: m[1], code: m[2] }));
const srcs = scripts.filter(s => s.src).map(s => s.src);
assert.deepStrictEqual(srcs, ['../spatial-home/js/board-ec6.js', 'v2.js'], '1.0 is loaded from its own file, 2.0 after it');
const keys = scripts.find(s => !s.src && s.code.includes(K2));
assert(keys && scripts.indexOf(keys) < scripts.findIndex(s => s.src === srcs[0]), 'the saved-board switch runs before 1.0 reads its board');

// ---------------------------------------------------------------- 2 · a page of its own: 1.0's saved board is read once, never written
function page(search, stored) {
  const m = Object.assign({}, stored);
  function Storage() {}
  Storage.prototype.getItem = function (k) { return k in m ? m[k] : null; };
  Storage.prototype.setItem = function (k, v) { m[k] = String(v); };
  const w = { Storage, localStorage: new Storage(), location: { search, pathname: '/ec6-board-2/', hash: '' }, document: { hidden: false }, addEventListener() {}, setInterval() { return 0; }, clearInterval() {}, setTimeout, console };
  w.window = w; vm.createContext(w);
  vm.runInContext(keys.code, w); vm.runInContext(v1, w);
  return { w, m };
}
const mine = JSON.stringify({ v: 1, exam: { name: 'x', date: '2027-05-01' }, src: {}, picks: {}, skip: {}, mastered: [], opened: {}, big3: {}, words: {}, layout: null, pins: [] });
let p = page('', { [K1]: mine });
assert.strictEqual(p.w.EC6V2_FRESH, true, 'the first visit is marked');
assert.strictEqual(p.w.SpatialEC6._.S().exam.date, '2027-05-01', '2.0 starts from 1.0\'s board as it is now');
p.w.SpatialEC6._.S().exam.date = '2027-06-01'; p.w.localStorage.setItem(K1, JSON.stringify(p.w.SpatialEC6._.S()));
assert.strictEqual(JSON.parse(p.m[K2]).exam.date, '2027-06-01', '2.0 saves to its own board');
assert.strictEqual(p.m[K1], mine, '1.0\'s board is left exactly as it was');
p = page('', { [K1]: mine, [K2]: p.m[K2] });
assert(!p.w.EC6V2_FRESH && p.w.SpatialEC6._.S().exam.date === '2027-06-01', 'later visits open 2.0\'s own board');
p = page('?demo=1', { [K1]: mine });
assert(p.w.EC6V2_DEMO && p.w.SpatialEC6._.S().exam.date === '2027-02-28' && !(K2 in p.m), 'the sample board starts clean and apart');
p.w.localStorage.setItem(K1, '{"v":1}'); assert(KD in p.m && p.m[K1] === mine);
p.w.localStorage.setItem('minest.gptstudy.v1', '{}'); assert(p.m['minest.gptstudy.demo'] === '{}' && !('minest.gptstudy.v1' in p.m), 'sample words never reach the study store');
p.w.localStorage.setItem('other', '1'); assert.strictEqual(p.w.localStorage.getItem('other'), '1', 'every other key is left alone');
assert(/UI_KEY = 'minest\.ec6board2\.ui' \+ \(window\.EC6V2_DEMO \? '\.demo' : ''\)/.test(v2), 'the sample keeps its own tool settings');
p = page('', {}); p.w.localStorage.setItem('minest.gptstudy.v1', '{}'); assert('minest.gptstudy.v1' in p.m, 'your own words still go to the study store');

// ---------------------------------------------------------------- 3 · 1.0 works on a host handed to it (the app in a frame, or the sample)
p = page('?demo=1', {});
const card = (id, title) => ({ id, title, mastery: 1 });
const boards = [{ id: 'b', title: 'EC-6 Anchor Charts', columns: [['Language Arts', 'a'], ['Math', 'm'], ['Science', 's'], ['Social Studies', 'o'], ['Fine Arts', 'f']].map(([t, id]) => ({ id: 'c' + id, title: t, cards: [card(id + 1, t + ' 1'), card(id + 2, t + ' 2')] })) }];
p.w.SpatialEC6._.setHost(() => ({ MinestAI: { boards: () => boards } }));
assert.strictEqual(p.w.SpatialEC6._.chartsBoard().id, 'b');
assert.deepStrictEqual(['ela', 'math', 'sci', 'ss', 'other'].map(s => p.w.SpatialEC6._.pick(s).k.id[0]), ['a', 'm', 's', 'o', 'f'], 'one chart per subject');

// ---------------------------------------------------------------- 4 · what 2.0 presses and reads is still in 1.0
['undo', 'add', 'deco', 'tidy', 'natural', 'theme', 'reset', 'edit', 'kanban', 'close'].forEach(b => assert(v1.includes('data-b="' + b + '"'), '1.0 key: ' + b));
['class="e6-cork"', 'class="e6-bar"', "id = 'sh-ec6'", 'data-a="swap"', 'data-a="word"', "'e6-edit'", 'e6-toast', 'e6-prog', 'e6-ttl', 'e6-cal', 'e6-tools', "e.key === 'ArrowLeft'", "e.key === 'ArrowRight'", "feature: 'kanban'", 'ctx.container', 'ctx.host', "id: 'note'"]
  .forEach(h => assert(v1.includes(h), '1.0 hook: ' + h));
assert(p.w.SpatialEC6.open && p.w.SpatialEC6._.S && p.w.SpatialEC6._.daysLeft, '1.0 API');
[...v2.matchAll(/bar\('([a-z]+)'\)/g)].forEach(m => assert(v1.includes('data-b="' + m[1] + '"'), '2.0 presses a key 1.0 has: ' + m[1]));
new vm.Script(v2);                                                                    // 2.0 parses
console.log('ec6-board-2: ok');
