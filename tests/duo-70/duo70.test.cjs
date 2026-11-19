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

// 2. without the block and the three edits the page is iphone.html, byte for byte
let back = out.slice(0, at) + out.slice(at + block.length);
back = back.replace('<title>Minest Duo 70.0 · iPhone Fold</title>', '<title>Minest Duo 53.85 · iPhone Fold</title>')
  .replace('  if (window.__mn70Quiet > Date.now()) return;   /* duo-70 */\n', '')
  .replace('if(!document.hidden)(window.__mn70Idle||function(f){f();})(scan);', 'if(!document.hidden)scan();');
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
console.log('duo-70: ok');
