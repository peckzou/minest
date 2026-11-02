/* Trinity College - procedural PLACEHOLDER textures (canvas). CC0-style, painted in code, no network.
 * Real CC0 textures (Poly Haven) can replace them: save as trinity/assets/textures/<name>.jpg and TrinityTex.load() uses
 * them when the page is served over http(s):
 *   stone -> limestone_diff.jpg   grass -> lawn_diff.jpg   slab -> paving_diff.jpg   slate -> roof_slate_diff.jpg
 * Exposes TrinityTex = { stone, grass, slab, slate, road, load }. */
(function (root) {
  'use strict';
  function rng(seed) { let a = seed | 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function cv(w, h) { if (typeof document === 'undefined') return null; const c = document.createElement('canvas'); c.width = w; c.height = h || w; return c; }
  function fin(c, rx, ry) {
    const T = root.THREE; if (!T || !c) return null;
    const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.anisotropy = 8;
    if (T.sRGBEncoding !== undefined) t.encoding = T.sRGBEncoding;
    if (rx) t.repeat.set(rx, ry || rx);
    return t;
  }
  function noise(x, w, h, r, amp) {
    const im = x.getImageData(0, 0, w, h), d = im.data;
    for (let i = 0; i < d.length; i += 4) { const n = (r() - 0.5) * amp; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
    x.putImageData(im, 0, 0);
  }
  // weathered cream limestone ashlar, 0.6 x 0.3 m courses; 1 repeat = 2.4 x 2.4 m
  function stone() {
    const S = 512, c = cv(S); if (!c) return null; const x = c.getContext('2d'), r = rng(11);
    x.fillStyle = '#d8ceb4'; x.fillRect(0, 0, S, S);
    const rows = 8, rh = S / rows;
    for (let j = 0; j < rows; j++) {
      let px = -(j % 2) * 64;
      while (px < S) {
        const w = 112 + r() * 32, v = (r() - 0.5) * 22;
        x.fillStyle = 'rgb(' + (216 + v) + ',' + (206 + v) + ',' + (180 + v) + ')'; x.fillRect(px, j * rh, w, rh);
        x.fillStyle = 'rgba(70,58,40,0.55)'; x.fillRect(px, j * rh, 2, rh); x.fillRect(px, j * rh, w, 2);
        px += w;
      }
    }
    noise(x, S, S, r, 14);
    for (let i = 0; i < 26; i++) { x.fillStyle = 'rgba(80,95,60,' + (0.04 + r() * 0.05) + ')'; x.beginPath(); x.arc(r() * S, r() * S, 10 + r() * 30, 0, 7); x.fill(); }
    return fin(c, 1, 1);
  }
  function grass() {
    const S = 256, c = cv(S); if (!c) return null; const x = c.getContext('2d'), r = rng(23);
    x.fillStyle = '#5b8a3a'; x.fillRect(0, 0, S, S);
    for (let i = 0; i < 9000; i++) { const g = 100 + r() * 70; x.fillStyle = 'rgba(' + (60 + r() * 30 | 0) + ',' + g + ',' + (40 + r() * 20 | 0) + ',0.5)'; x.fillRect(r() * S, r() * S, 1.5, 3); }
    for (let k = 0; k < 8; k++) { const y = k * S / 8; x.fillStyle = k % 2 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'; x.fillRect(0, y, S, S / 8); }   // mower stripes
    return fin(c, 1, 1);
  }
  // stone flagstones, 1.2 x 0.9 m
  function slab() {
    const S = 512, c = cv(S); if (!c) return null; const x = c.getContext('2d'), r = rng(37);
    x.fillStyle = '#b9b2a2'; x.fillRect(0, 0, S, S);
    for (let j = 0; j < 4; j++) { let px = -(j % 2) * 85; while (px < S) { const w = 170, v = (r() - 0.5) * 24; x.fillStyle = 'rgb(' + (186 + v) + ',' + (179 + v) + ',' + (164 + v) + ')'; x.fillRect(px, j * 128, w, 128); x.fillStyle = 'rgba(60,52,40,0.6)'; x.fillRect(px, j * 128, 3, 128); x.fillRect(px, j * 128, w, 3); px += w; } }
    noise(x, S, S, r, 16);
    return fin(c, 1, 1);
  }
  function slate() {
    const S = 256, c = cv(S); if (!c) return null; const x = c.getContext('2d'), r = rng(51);
    x.fillStyle = '#4c5159'; x.fillRect(0, 0, S, S);
    for (let j = 0; j < 16; j++) for (let i = 0; i < 8; i++) { const v = (r() - 0.5) * 18; x.fillStyle = 'rgb(' + (76 + v) + ',' + (81 + v) + ',' + (89 + v) + ')'; x.fillRect(i * 32 + (j % 2) * 16, j * 16, 31, 15); }
    return fin(c, 1, 1);
  }
  function road() {
    const S = 256, c = cv(S); if (!c) return null; const x = c.getContext('2d'), r = rng(63);
    x.fillStyle = '#6c6a66'; x.fillRect(0, 0, S, S); noise(x, S, S, r, 26);
    return fin(c, 1, 1);
  }
  function load(tex, file, base) {
    if (!tex || typeof Image === 'undefined' || !/^https?:/.test(location.protocol)) return;
    const img = new Image();
    img.onload = function () { tex.image = img; tex.needsUpdate = true; };
    img.onerror = function () {};
    img.src = (base || '') + 'assets/textures/' + file;
  }
  root.TrinityTex = { stone, grass, slab, slate, road, load, rng };
  if (typeof module !== 'undefined') module.exports = root.TrinityTex;
})(typeof window !== 'undefined' ? window : globalThis);
