// node tests/knowledge-balloon/map-list.test.cjs
// The Balloon's map list escapes names with the K.esc helper; nothing inside the engine may rebind `esc`.
const fs = require('fs'), path = require('path'), assert = require('assert');
const ROOT = path.resolve(__dirname, '../..');
const src = fs.readFileSync(path.join(ROOT, 'tools/knowledge-balloon/balloon.js'), 'utf8');

const binds = src.match(/\besc\s*=(?!=)|\bfunction\s+esc\b|\(\s*esc\s*[,)]/g) || [];
assert.deepStrictEqual(binds, ['esc ='], 'esc is bound once, to K.esc');
assert.ok(/esc = K\.esc\b/.test(src));
assert.ok(/class="kb-lrow"[^\n]*esc\(co\.name\)/.test(src), 'the map list escapes corridor names');

// every page that carries the engine carries this one
const body = src.slice(src.indexOf('var escort = fi < FEST_ESCORT'), src.indexOf('var escort = fi < FEST_ESCORT') + 200);
assert.ok(body.startsWith('var escort'));
['index.html', 'iphone.html', 'ipad.html', 'iPhone53.8241.html', 'iPhoneDuo.html', 'iPhoneDuo69.html', 'iPhoneDuo70.html', 'vocab-drive.html',
  'ios/Minest/Minest/iphone.html', 'ios/Minest/Minest/iphone18.0.html', 'ios/Minest/Minest/ipad.html', 'ios/Minest/Minest/iPhoneDuo.html',
  'ios/Minest/Minest/index.html', 'ios/MinestProject/MyApp/iphone.html'].forEach(function (f) {
  const page = fs.readFileSync(path.join(ROOT, f), 'utf8');
  assert.ok(page.includes(body), f + ' has the current balloon.js');
  assert.ok(!page.includes('var esc = fi < FEST_ESCORT'), f + ' no longer shadows esc');
});
console.log('knowledge-balloon map list: ok');
