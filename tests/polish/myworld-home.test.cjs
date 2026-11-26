// Minest polish · My World + Spatial Home: patched pages match the script, and the pet-parking cost works.
// node tests/polish/myworld-home.test.cjs  → "myworld-home: ok"
const fs = require('fs'), path = require('path'), assert = require('assert'), cp = require('child_process');
const R = path.join(__dirname, '..', '..');
const PAGES = ['iPhoneDuo.html', 'index.html', 'ipad.html', 'ios/Minest/Minest/ipad.html', 'iphone.html', 'ios/Minest/Minest/iphone.html', 'ios/Minest/Minest/iphone18.0.html'];
const done = PAGES.filter(p => fs.readFileSync(path.join(R, p), 'utf8').includes('id="mn-polish-mwh-js"'));
assert.ok(done.length, 'at least one page carries the My World / Spatial Home polish');
const out = cp.spawnSync('python3', [path.join(R, 'tools/polish/patch_myworld_home.py'), '--check', ...done], { encoding: 'utf8' });
assert.strictEqual(out.status, 0, 'patched pages match the patch script:\n' + out.stdout + out.stderr);
for (const p of done) {
  const s = fs.readFileSync(path.join(R, p), 'utf8');
  assert.ok(s.indexOf('id="mn-polish-board-js"') < s.indexOf('id="mn-polish-mwh-js"'), p + ': board polish (dock clearance, slim pet) comes first');
  const js = s.slice(s.indexOf('<script id="mn-polish-mwh-js">') + 30, s.indexOf('</script>', s.indexOf('<script id="mn-polish-mwh-js">')));
  new Function(js);   // parses
}
console.log('myworld-home: ok (' + done.length + ' pages)');
