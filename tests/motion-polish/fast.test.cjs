// node tests/motion-polish/fast.test.cjs → motion-polish fast: ok
// Motion polish (tools/motion-polish) asks the engine whether a hover rule's move is a return to rest. On a touch
// screen it did that between its own style-sheet edits, so every hover rule cost one style pass over the whole 22MB
// page: about 30 s frozen after the iPhone page opened (2026-11-26 perf trace). Now it reads everything first and
// writes after. This runs the script against a mock style sheet that counts style passes, and checks it still takes
// out the same moves.
'use strict';
const fs = require('fs'), path = require('path'), assert = require('assert'), cp = require('child_process'), vm = require('vm');
const R = path.join(__dirname, '..', '..');
cp.execFileSync('python3', [path.join(R, 'tools/motion-polish/apply.py'), '--check'], { stdio: 'pipe' });
const src = fs.readFileSync(path.join(R, 'tools/motion-polish/motion-polish.js'), 'utf8');
for (const f of ['iphone.html', 'index.html', 'ios/Minest/Minest/iphone.html', 'ios/Minest/Minest/iphone18.0.html'])
  assert.ok(fs.readFileSync(path.join(R, f), 'utf8').includes('<script id="mn-motion-polish-js">\n' + src.trim() + '\n</script>'), f + ': current motion polish');

function run(touch, rules) {
  let dirty = true, passes = 0;
  const decl = (o) => {
    const names = Object.keys(o);
    const st = {
      get length() { return names.length; },
      getPropertyValue: (p) => o[p] || '', getPropertyPriority: () => '',
      removeProperty: (p) => { if (p in o) { delete o[p]; names.splice(names.indexOf(p), 1); dirty = true; } },
      setProperty: (p, v) => { if (!(p in o)) names.push(p); o[p] = v; dirty = true; },
    };
    names.forEach((n, i) => Object.defineProperty(st, i, { get: () => names[i] }));
    return st;
  };
  const sheet = { ownerNode: { id: 'page-css' }, cssRules: rules.map(([sel, o]) => ({ selectorText: sel, style: decl(o), _o: o })) };
  const probeVals = {};
  const probe = { style: { cssText: '', setProperty: (p, v) => { probeVals[p] = v; }, removeProperty: (p) => { delete probeVals[p]; } } };
  const rest = (v) => /^(none|translate[XY]?\(0(px)?\)|scale\(1\)|rotate\(0(deg)?\))$/.test(v.trim());
  const ctx = {
    window: {}, matchMedia: () => ({ matches: !touch }), setInterval: () => 0, setTimeout: () => 0, clearTimeout: () => {},
    MutationObserver: function () { this.observe = () => {}; }, addEventListener: () => {},
    getComputedStyle: () => { if (dirty) { passes++; dirty = false; } return { getPropertyValue: (p) => (rest(probeVals[p] || 'none') ? 'matrix(1, 0, 0, 1, 0, 0)' : 'matrix(1, 0, 0, 1, 0, -2)') }; },
    document: { readyState: 'complete', styleSheets: [sheet], body: { appendChild: () => {} }, documentElement: {}, createElement: () => probe, addEventListener: () => {} },
  };
  ctx.window = ctx; ctx.window.addEventListener = () => {};
  vm.runInNewContext(src, ctx);
  return { passes, stats: ctx.MinestMotionPolish.stats, rules: sheet.cssRules.map((r) => r._o) };
}

const make = (n) => {
  const rs = [];
  for (let i = 0; i < n; i++) {
    rs.push(['.card' + i + ':hover', { transform: 'translateY(-2px)', 'box-shadow': '0 2px 4px #000' }]);   // a lift: taken out on touch
    rs.push(['.btn' + i + ':hover', { transform: 'scale(1)' }]);                                           // back to rest: kept
    rs.push(['.row' + i + ':hover .act', { transform: 'translateX(4px)' }]);                                // the hovered element is an ancestor: kept
    rs.push(['.tip' + i + ':hover', { transform: 'scale(1.1)', opacity: '1' }]);                           // it shows something: kept
    rs.push(['.fade' + i, { 'transition-property': 'all', 'transition-duration': '.2s' }]);                 // "all" narrowed
  }
  return rs;
};
const N = 200, t = run(true, make(N));
assert.ok(t.passes <= 2, 'touch: style passes ' + t.passes + ' for ' + N * 5 + ' rules (was one per hover rule)');
assert.deepStrictEqual({ ...t.stats }, { hover: N, all: N }, 'touch: same rules changed');
for (let i = 0; i < N; i++) {
  const [card, btn, row, tip, fade] = t.rules.slice(i * 5, i * 5 + 5);
  assert.ok(!('transform' in card) && card['box-shadow'], 'lift taken out, shadow kept');
  assert.strictEqual(btn.transform, 'scale(1)'); assert.strictEqual(row.transform, 'translateX(4px)'); assert.strictEqual(tip.transform, 'scale(1.1)');
  assert.ok(!/\ball\b/.test(fade['transition-property']) && /opacity/.test(fade['transition-property']), 'transition: all narrowed');
}
const d = run(false, make(N));
assert.deepStrictEqual({ ...d.stats }, { hover: 0, all: N }, 'mouse: hover rules left alone');
console.log('motion-polish fast: ok');
