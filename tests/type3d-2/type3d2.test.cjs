/* 3D Type 2.0 (type3d-2/): the built page is complete, stages every one of the 23 worlds of 1.0,
   and leaves 1.0 alone (its source is imported, never edited; its pages do not load 2.0).
   Run from the repo root: node tests/type3d-2/type3d2.test.cjs */
const fs = require('fs'), path = require('path'), assert = require('assert/strict');
const read = f => fs.readFileSync(f, 'utf8');

/* the built page: every file it names exists */
const html = read('type3d-2/index.html');
const refs = [...html.matchAll(/(?:src|href)="(\.[^"]+)"/g)].map(m => m[1]);
assert(refs.some(r => /^\.\/assets\/index-.+\.js$/.test(r)), 'the page loads its bundle');
assert(refs.some(r => /^\.\/assets\/index-.+\.css$/.test(r)), 'the page loads its stylesheet');
assert(refs.includes('../type3d/lifecycle.js'), 'the page frees its WebGL context the way the 1.0 pages do');
for (const r of refs) assert(fs.existsSync(path.join('type3d-2', r)), r + ' exists');

/* the 23 worlds of 1.0, from its registry */
const registry = read('tools/typing-worlds-app/src/engine/registry.ts');
const worlds = [...registry.matchAll(/\{\s*id: '([\w-]+)',\s*number: (\d+),/g)].map(m => ({ id: m[1], n: Number(m[2]) }));
assert.equal(worlds.length, 23);
assert.deepEqual(worlds.map(w => w.n), Array.from({ length: 23 }, (_, i) => i + 1));

/* each has a 2.0 stage … */
const specs = read('tools/typing-worlds-2-app/src/stage/specs.ts');
const body = specs.slice(specs.indexOf('export const STAGES'), specs.indexOf('export const FALLBACK_STAGE'));
const staged = [...body.matchAll(/^  \/\* (\d+) \*\/ '?([\w-]+)'?: \{/gm)].map(m => ({ id: m[2], n: Number(m[1]) }));
assert.deepEqual(staged, worlds, 'one stage per world, in registry order');
for (const w of worlds) {
  const at = body.indexOf(`/* ${w.n} */`), end = body.indexOf(`/* ${w.n + 1} */`, at);
  const spec = body.slice(at, end < 0 ? undefined : end);
  assert(/backdrop: \{/.test(spec), w.id + ' has a backdrop');
  assert(/look: \{/.test(spec), w.id + ' has a grade');
}

/* … and its 1.0 module in the 2.0 build */
const assets = fs.readdirSync('type3d-2/assets');
for (const w of worlds) assert(assets.some(f => f.startsWith(w.id + '-') && f.endsWith('.js')), w.id + ' is in the build');
for (const w of worlds) assert(fs.existsSync(`type3d-2/thumbs/${w.id}.jpg`), w.id + ' has its dock picture');
const bundle = read(path.join('type3d-2/assets', assets.find(f => /^index-.+\.js$/.test(f))));
for (const w of worlds) assert(bundle.includes(`"${w.id}"`) || bundle.includes(`'${w.id}'`) || bundle.includes('`' + w.id + '`'), w.id + ' is registered in the bundle');

/* 2.0 keeps its settings apart from 1.0 and shares the word list */
const app = read('tools/typing-worlds-2-app/src/ui/app2.ts');
assert(/PREF_KEY = 'tw2\.prefs\.v1'/.test(app) && /PREF_KEY = 'tw\.prefs\.v1'/.test(registry), '2.0 has its own settings key');
assert(/LocalVocabStore/.test(app) && /KEY = 'tw\.vocab\.v1'/.test(read('tools/typing-worlds-app/src/engine/vocab.ts')), 'the word list is the 1.0 one');

/* 2.0 source only imports 1.0 (through the @v1 alias); it holds no copy of a world */
const src = 'tools/typing-worlds-2-app/src';
const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
const files = walk(src);
assert(!files.some(f => f.includes(path.join('src', 'worlds'))), 'no world module is copied into 2.0');
assert(files.filter(f => f.endsWith('.ts')).some(f => /from '@v1\//.test(read(f))), '2.0 imports the 1.0 engine');

/* 1.0 does not load 2.0, and the deployment keeps the 2.0 folder */
for (const f of ['typing-worlds/index.html', 'type3d/index.html', 'type3d/picker.js']) assert(!/type3d-2/.test(read(f)), f + ' is unchanged by 2.0');
const ignore = read('.vercelignore').split('\n').map(l => l.trim());
assert(!ignore.some(l => /^\/?type3d-2/.test(l)), 'type3d-2/ is deployed');

console.log('type3d-2: ok —', worlds.length, 'worlds staged');
