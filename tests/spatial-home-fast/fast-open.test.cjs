// node tests/spatial-home-fast/fast-open.test.cjs → spatial-home-fast: ok
// Spatial Home opens fast and never sits on black (tools/spatial-home-fast/patch_fast_open.py).
'use strict';
const fs = require('fs'), path = require('path'), assert = require('assert'), cp = require('child_process');
const R = path.join(__dirname, '..', '..');
const PAGES = ['iPhoneDuo.html', 'index.html', 'ipad.html', 'iphone.html', 'ios/Minest/Minest/ipad.html', 'ios/Minest/Minest/iphone.html', 'ios/Minest/Minest/iphone18.0.html'];
const SRC = ['spatial-home/js/env-glb.js', 'spatial-home/js/app.js', 'spatial-home/js/entries.js'];

// 1. every page and source file carries the patch, once
cp.execFileSync('python3', [path.join(R, 'tools/spatial-home-fast/patch_fast_open.py'), ...SRC.concat(PAGES).map(f => path.join(R, f)), '--check'], { stdio: 'pipe' });
for (const f of PAGES) {
  const s = fs.readFileSync(path.join(R, f), 'utf8');
  const once = (needle) => assert.strictEqual(s.split(needle).length - 1, 1, f + ': ' + needle);
  once('root.SpatialGLB = { prefetch');
  once("GL.parse(got[1], url.replace(");                               // the model is parsed from bytes fetched as the room is built
  once("lite: 'interiors-glb/assets/victorian_study_1k.glb'");
  once('<div id="sh-loadcover" hidden aria-hidden="true"><b></b></div>');
  once('function exitHome(force) { if (busy && force !== true) return; snapSave();');
  once("document.addEventListener('DOMContentLoaded', function () { setTimeout(boot, 0); }, { once: true }); else setTimeout(boot, 0);");
  assert.strictEqual(s.split("try { PUB.close(true); } catch (e) {}").length - 1, 2, f + ': Home and House close the room even mid-transition');
  once("root.SpatialGLB.pending()");
  assert.ok(!s.includes("GL.load(siteBase() + def.glb"), f + ': old loader left');
  assert.ok(!s.includes("window.addEventListener('load', function () { setTimeout(boot, 300); }"), f + ': old boot left');
}
for (const f of SRC) new Function(fs.readFileSync(path.join(R, f), 'utf8'));   // still parses

// 2. env-glb: the bytes are asked for synchronously when the room is built, and the env says when it is ready
{
  const src = fs.readFileSync(path.join(R, 'spatial-home/js/env-glb.js'), 'utf8');
  const sent = [], listeners = {};
  function XHR() { this.listeners = {}; }
  XHR.prototype.open = function (m, u) { this.u = u; }; XHR.prototype.send = function () { sent.push(this.u); };
  const win = { location: { protocol: 'https:', pathname: '/iphone.html', search: '' }, navigator: { userAgent: 'iPhone', maxTouchPoints: 5 },
    XMLHttpRequest: XHR, console: { warn() {} }, document: { createElement: () => ({}), head: { appendChild() {} } },
    addEventListener: (t, f) => { (listeners[t] = listeners[t] || []).push(f); }, removeEventListener() {}, dispatchEvent: (e) => { (listeners[e.type] || []).forEach(f => f(e)); }, CustomEvent: function (t, o) { this.type = t; this.detail = o && o.detail; } };
  const envs = [];
  win.SpatialRoom = { register: (e) => envs.push(e), parts: {}, timeOfDay: () => ({}), disposeTree() {} };
  win.THREE = new Proxy({}, { get: () => function () { return new Proxy({}, { get: () => function () {} }); } });
  try { new Function('window', 'XMLHttpRequest', 'navigator', 'location', 'document', 'CustomEvent', src)(win, XHR, win.navigator, win.location, win.document, win.CustomEvent); } catch (e) { /* the scene helpers need a real THREE; registering is what we read */ }
  assert.ok(win.SpatialGLB && typeof win.SpatialGLB.prefetch === 'function', 'SpatialGLB exposed');
  assert.ok(win.SpatialGLB.has('victorian'), 'the Victorian Study is a model room');
  assert.strictEqual(win.SpatialGLB.prefetch('victorian'), true);
  assert.deepStrictEqual(sent, ['interiors-glb/assets/victorian_study_1k.glb'], 'a phone fetches the 1024² model, once');
  win.SpatialGLB.prefetch('victorian'); assert.strictEqual(sent.length, 1, 'a second prefetch reuses the first');
}

// 3. the light model: same nodes, every texture at most 1024², a fraction of the bytes
{
  function read(f) { const b = fs.readFileSync(path.join(R, f)); const n = b.readUInt32LE(12); return { b, j: JSON.parse(b.slice(20, 20 + n)), off: 20 + n + 8 }; }
  const full = read('interiors-glb/assets/victorian_study.glb'), lite = read('interiors-glb/assets/victorian_study_1k.glb');
  assert.deepStrictEqual(lite.j.nodes.map(n => n.name), full.j.nodes.map(n => n.name), 'same nodes (cut / movables / niches find theirs)');
  assert.strictEqual(lite.j.materials.length, full.j.materials.length); assert.strictEqual(lite.j.images.length, full.j.images.length);
  assert.deepStrictEqual(lite.j.extensionsRequired.sort(), full.j.extensionsRequired.sort());
  for (const im of lite.j.images) {
    const v = lite.j.bufferViews[im.bufferView], d = lite.b.slice(lite.off + (v.byteOffset || 0), lite.off + (v.byteOffset || 0) + v.byteLength);
    assert.strictEqual(im.mimeType, 'image/webp'); assert.strictEqual(d.toString('ascii', 0, 4), 'RIFF');
    let w = 0, h = 0; const kind = d.toString('ascii', 12, 16);
    if (kind === 'VP8 ') { w = d.readUInt16LE(26) & 0x3fff; h = d.readUInt16LE(28) & 0x3fff; }
    else if (kind === 'VP8L') { const x = d.readUInt32LE(21); w = (x & 0x3fff) + 1; h = ((x >> 14) & 0x3fff) + 1; }
    else if (kind === 'VP8X') { w = 1 + d.readUIntLE(24, 3); h = 1 + d.readUIntLE(27, 3); }
    assert.ok(w > 0 && w <= 1024 && h <= 1024, 'texture ' + w + 'x' + h);
  }
  assert.ok(lite.b.length < full.b.length * 0.5, 'less than half the bytes: ' + lite.b.length);
}
console.log('spatial-home-fast: ok');
