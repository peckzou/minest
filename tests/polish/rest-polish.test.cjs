// node tests/polish/rest-polish.test.cjs → rest-polish: ok
// The remaining modules (tools/polish/patch_rest_polish.py): Card FX opens Card FX, the More fan stays on screen,
// and the CSS fixes for Wallpaper Studio, Board Settings, Activity Rings and 3D Type.
'use strict';
const fs = require('fs'), path = require('path'), assert = require('assert'), cp = require('child_process');
const R = path.join(__dirname, '..', '..');
const PAGES = ['iPhoneDuo.html', 'index.html', 'ipad.html', 'iphone.html', 'ios/Minest/Minest/ipad.html', 'ios/Minest/Minest/iphone.html', 'ios/Minest/Minest/iphone18.0.html'];
const SRC = ['tools/duo/patch_dock_more.py', 'tools/fx-71/card-fx.js'];

// 1. every page and source carries the patch (and running it again changes nothing)
cp.execFileSync('python3', [path.join(R, 'tools/polish/patch_rest_polish.py'), '--check', ...PAGES.concat(SRC).map(f => path.join(R, f))], { stdio: 'pipe' });
const css = fs.readFileSync(path.join(R, 'tools/polish/rest-polish.css'), 'utf8');
for (const f of PAGES) {
  const s = fs.readFileSync(path.join(R, f), 'utf8');
  const count = (n) => s.split(n).length - 1;
  assert.strictEqual(count('<style id="mn-rest-polish-css">\n' + css + '</style>'), 1, f + ': rest-polish css once');
  assert.ok(s.indexOf('id="mn-rest-polish-css"') < s.indexOf('id="mn-polish-board-css"'), f + ': css sits before the board polish');
  assert.strictEqual(count("'.ios-tab-item.dock-fx-tab, '"), 0, f + ': the Light FX picker no longer takes the Card FX tab');
  assert.strictEqual(count('/* rest-polish: opened from the pill Dock */'), 1, f + ': More fan has a box when ⋯ has none');
  assert.strictEqual(count('/* rest-polish: labels on screen */'), 1, f + ': More fan keeps its labels on screen');
  assert.strictEqual(count("it.style.setProperty('--x', p.x + 'px');"), 0, f + ': every fan item takes shiftX');
}
new Function(fs.readFileSync(path.join(R, 'tools/fx-71/card-fx.js'), 'utf8'));   // still parses

// 2. the Light FX selector really skips the Card FX tab
{
  const src = fs.readFileSync(path.join(R, 'tools/fx-71/card-fx.js'), 'utf8');
  const m = src.match(/'\.ios-tab-item\.dock-fx-tab([^']*), '/);
  assert.ok(m && /:not\(\[title\^="Card"\]\)/.test(m[1]) && /:not\(\[aria-label\^="Card"\]\)/.test(m[1]), 'card-fx.js selector');
}

// 3. the More fan's placement: run its own geometry with the pill Dock's zero-size ⋯ and check every item and label is on screen
{
  const py = fs.readFileSync(path.join(R, 'tools/duo/patch_dock_more.py'), 'utf8');
  const a = py.indexOf("    var r = anchor.getBoundingClientRect()"), b = py.indexOf('    o.forEach(function (orig, i) {', a);
  const geo = py.slice(a, b);
  const run = new Function('anchor', 'o', 'innerWidth', 'innerHeight', 'document', geo + '\nreturn pts.map(function (p) { return { x: p.x + shiftX, y: p.y + shiftY }; });');
  const dock = { getBoundingClientRect: () => ({ left: 115, right: 275, top: 786, bottom: 832, width: 160, height: 46 }) };
  const anchor = { getBoundingClientRect: () => ({ left: 0, top: 0, width: 0, height: 0 }), closest: () => dock };
  const document = { createElement: () => ({ dataset: {}, setAttribute() {}, classList: { toggle() {} } }) };
  const pts = run(anchor, [1, 2, 3, 4, 5], 390, 844, document);
  for (const p of pts) {
    assert.ok(p.x - 23 - 112 >= 8 && p.x + 23 <= 390 - 8, 'item and its label on screen: x ' + p.x);
    assert.ok(p.y - 23 >= 8 && p.y + 23 <= 844 - 8, 'item on screen: y ' + p.y);
  }
}
console.log('rest-polish: ok');
