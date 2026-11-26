/* Watch → phone board edits (2026-11-26): checklist ticks and new checklist items from the watch change the board. */
const assert = require('assert'), fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..', '..');
const src = fs.readFileSync(path.join(ROOT, 'tools/cloud-transport/watch-app.js'), 'utf8');
let boards = [{ id: 'b', columns: [{ id: 'c', cards: [{ id: 'k', title: 'K', complete: false, checklistItems: [{ id: 'i1', text: 'one', done: false }, { id: 'i2', text: 'two', done: true }] }, { id: 'z', title: 'Z' }] }] }];
const listeners = {};
const ctx = { Date, Object, Array, String,
  window: { addEventListener: (n, f) => { listeners[n] = f; }, removeEventListener() {} },
  _: { useEffect: f => f() },
  setBoards: f => { boards = f(boards); } };
vm.createContext(ctx); vm.runInContext(src, ctx);
const send = (event, payload) => listeners.minestNativeEvent({ detail: { event, payload } });
const k = () => boards[0].columns[0].cards[0];
const before = boards;
send('checklistToggled', { cardId: 'k', id: 'i1', isDone: true });
assert.strictEqual(k().checklistItems[0].done, true); assert.strictEqual(k().complete, true, 'all ticked marks the card done');
assert.strictEqual(boards[0].columns[0].cards[1], before[0].columns[0].cards[1], 'other cards untouched');
const after = boards; send('checklistToggled', { cardId: 'k', id: 'i1', isDone: true });
assert.strictEqual(boards, after, 'a repeated message changes nothing');
send('checklistToggled', { cardId: 'k', id: 'i2', isDone: false }); assert.strictEqual(k().checklistItems[1].done, false);
send('checklistToggled', { cardId: 'k', id: 'i2' }); assert.strictEqual(k().checklistItems[1].done, true, 'no state: toggles');
send('checklistItemAdded', { cardId: 'k', id: 'chk-1', text: 'three' });
send('checklistItemAdded', { cardId: 'k', id: 'chk-1', text: 'three' });
assert.deepStrictEqual(k().checklistItems.map(i => i.id), ['i1', 'i2', 'chk-1'], 'added once');
const still = boards; send('checklistToggled', { cardId: 'nope', id: 'i1', isDone: false }); send('other', { cardId: 'k' });
assert.strictEqual(boards, still, 'unknown card or event: same array');
// the Swift side passes the watch's state for a card tick and a checklist tick
const swift = fs.readFileSync(path.join(ROOT, 'ios/Minest/Minest/iPhoneWatchSyncManager.swift'), 'utf8');
assert(/\["cardId": cardId, "isDone": isDone\]/.test(swift) && swift.includes("new CustomEvent('minestCardToggled', { detail: detail })"));
assert(swift.includes('toggled["isDone"] = isDone'));
console.log('PASS: watch checklist ticks and new items reach the board once; card ticks carry the watch state');
