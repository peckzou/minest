// Minest Duo 70: the new page is iphone.html plus the listed edits and the v70 block, and nothing else.
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const root = path.join(__dirname, '..', '..');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');
const src = read('iphone.html'), out = read('iPhoneDuo70.html');
const css = read('tools/duo-70/v70.css').replace(/^\n+|\n+$/g, ''), js = read('tools/duo-70/v70.js').replace(/^\n+|\n+$/g, '');

// 1. the block sits just before </body> and holds exactly the two source files
const block = '<style id="mn70-css">\n' + css + '\n</style>\n<script id="mn70-js">\n' + js + '\n</script>\n';
const at = out.lastIndexOf(block);
assert(at > 0 && out.slice(at + block.length).startsWith('</body>'), 'v70 block is before </body>');

// 2. without the block and the five edits the page is iphone.html, byte for byte
let back = out.slice(0, at) + out.slice(at + block.length);
back = back.replace('<title>Minest Duo 70.0 · iPhone Fold</title>', '<title>Minest Duo 53.85 · iPhone Fold</title>')
  .replace('  if (window.__mn70Quiet > Date.now()) return;   /* duo-70 */\n', '')
  .replace("    var ls = a.closest('.kanban-cards-scroll'), lr = ls && ls.getBoundingClientRect(); if (lr && (r.bottom < lr.top + 30 || r.top > lr.bottom)) return;   /* duo-70 */\n", '')
  .replace('if(!document.hidden)(window.__mn70Idle||function(f){f();})(scan);', 'if(!document.hidden)scan();')
  .replace('var v=(window.__mn70Ver||C.version)(s.value,c,C.version);', 'var v=C.version(s.value);');
assert.strictEqual(back, src, 'iPhoneDuo70.html = iphone.html + edits + v70 block');

// 3. a card inside a closed stack is shown on the board by the stack's top card
const el = { classList: { add() {}, remove() {}, toggle() {}, contains: () => false } };
const win = { addEventListener() {}, MutationObserver: function () { this.observe = () => {}; }, setTimeout: () => 0, clearTimeout() {},
  matchMedia: () => ({ matches: false }), document: { documentElement: el, body: {}, hidden: false, addEventListener() {}, querySelector: () => null, querySelectorAll: () => [] } };
win.window = win;
vm.runInNewContext(js, win);
const board = { columns: [{ cards: [{ id: 'a', stack: [{ id: 'a1' }, { id: 'a2', stack: [{ id: 'a2x' }] }] }, { id: 'b' }] }, { cards: [{ id: 'c' }] }] };
assert.strictEqual(win.MinestV70._stackTop(board, 'a1'), 'a');
assert.strictEqual(win.MinestV70._stackTop(board, 'a2x'), 'a');
assert.strictEqual(win.MinestV70._stackTop(board, 'b'), 'b');
assert.strictEqual(win.MinestV70._stackTop(board, 'c'), 'c');
assert.strictEqual(win.MinestV70._stackTop(board, 'nope'), null);

// 4. the remembered version is always the one MinestSyncCore.version gives, and unchanged data is not hashed again
const fn = (name) => { const m = src.match(new RegExp('^function ' + name + '\\(v\\)\\{.*$', 'm')); assert(m, name + ' is in iphone.html'); return m[0]; };
const core = { MinestSyncCore: vm.runInNewContext(fn('stable') + '\n' + fn('version') + '\n({ version: version })') };
let calls = 0; const version = (v) => { calls++; return core.MinestSyncCore.version(v); };
const data = [{ id: 'b1', columns: [{ cards: [{ id: 'a', title: '卡片', n: 1 }] }] }];
assert.strictEqual(win.__mn70Ver(data, 'boards', version), core.MinestSyncCore.version(data));
assert.strictEqual(win.__mn70Ver(data, 'boards', version), core.MinestSyncCore.version(data));
assert.strictEqual(calls, 1, 'unchanged data is hashed once');
data[0].columns[0].cards[0].n = 2;   // changed in place: seen through the JSON, not the object
assert.strictEqual(win.__mn70Ver(data, 'boards', version), core.MinestSyncCore.version(data));
assert.strictEqual(calls, 2);
assert.strictEqual(win.__mn70Ver({ x: 1 }, 'routine', version), core.MinestSyncCore.version({ x: 1 }));
assert.strictEqual(win.__mn70Ver(data, 'boards', version), core.MinestSyncCore.version(data));
assert.strictEqual(calls, 3, 'categories are remembered apart');

// Spatial Home's album: My World opens as before, then the inventory on top for a board that has a list
{
  const log = [];
  const boards = [{ id: 'empty', columns: [{ cards: [] }] }, { id: 'heads', columns: [{ cards: [{ id: 'h1' }] }] },
    { id: 'full', columns: [{ cards: [{ id: 'h2' }, { id: 'l1' }] }] }];
  const mk = (cur, uv, invOpen) => ({
    setTimeout: (f) => { f(); return 0; },
    document: { querySelector: (q) => (q === '.mn-invx' ? (invOpen ? {} : null) : uv ? {} : null) },
    MinestAI: { board: () => ({ id: cur }), boards: () => boards },
    MinestUniverse: { isOpen: () => uv },
    MinestKnowledge: { isHeading: (id) => id[0] === 'h' },
    MinestInventory: { open: (n) => log.push('inv ' + n.t + ' ' + n.bid), close: () => log.push('inv close') },
  });
  const target = { id: 'MinestUniverse', open: () => log.push('uv open'), close: () => log.push('uv close') };
  const bridge = { FEATURES: { lists: { targets: [target] } } };
  assert.strictEqual(win.MinestV70._albumWire(bridge), true);
  assert.strictEqual(win.MinestV70._albumWire(bridge), false, 'wired once');
  target.open(mk('full', true));
  assert.deepStrictEqual(log.splice(0), ['uv open', 'inv world full'], 'the board in use');
  target.open(mk('empty', true));
  assert.deepStrictEqual(log.splice(0), ['uv open', 'inv world full'], 'else the first board with a list');
  target.open(mk('heads', true));
  assert.deepStrictEqual(log.splice(0), ['uv open', 'inv world full'], 'a board of section headings only has no list');
  target.open(mk('full', false));
  assert.deepStrictEqual(log.splice(0), ['uv open'], 'My World did not come up: no inventory');
  target.open(mk('full', true, true));
  assert.deepStrictEqual(log.splice(0), ['uv open'], 'an inventory that is still open is left as it is');
  target.close(mk('full', true));
  assert.deepStrictEqual(log.splice(0), ['inv close', 'uv close']);
  assert.strictEqual(win.MinestV70._albumWire({ FEATURES: {} }), false);
  assert.strictEqual(win.MinestV70._albumWire(undefined), false);
}
console.log('duo-70: ok');
