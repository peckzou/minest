/* Admont Abbey Library - procedural CC0-equivalent PLACEHOLDER textures (canvas).
 *
 * Every texture here is painted in code so the scene renders with NO network access.
 * They are placeholders for real public-domain / CC0 textures to be dropped in later.
 * When real assets are available, save them under admont/assets/textures/ at these exact
 * paths and have scene.js load them (CanvasTexture -> TextureLoader) to override:
 *
 *   marbleFloor  -> assets/textures/marble_floor_diff.jpg      (e.g. Poly Haven "marble_01", CC0)
 *   stuccoWall   -> assets/textures/white_plaster_diff.jpg     (e.g. Poly Haven "plaster_wall", CC0)
 *   goldTrim     -> assets/textures/gold_leaf_diff.jpg         (e.g. Poly Haven "gold_metal", CC0)
 *   woodCase     -> assets/textures/carved_wood_diff.jpg       (e.g. Poly Haven "wood_cabinet", CC0)
 *   bookSpines   -> assets/textures/leather_books_diff.jpg     (e.g. Poly Haven "book_pattern", CC0)
 *
 * PUBLIC-DOMAIN + CC0 ONLY. No CC BY-SA, no paid API, no attribution page required.
 * Exposes global AdmontTex = { marbleFloor, stuccoWall, goldTrim, woodCase, bookSpines, make }.
 * Each builder returns a THREE.CanvasTexture (THREE must be loaded first).
 */
(function (root) {
  'use strict';

  function rng(seed) {
    let a = seed | 0;
    return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }

  function canvas(size) {
    const c = (typeof document !== 'undefined') ? document.createElement('canvas') : null;
    if (!c) return null;
    c.width = c.height = size;
    return c;
  }

  function finalize(c, repeat) {
    if (!root.THREE || !c) return null;
    const t = new root.THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = root.THREE.RepeatWrapping;
    t.anisotropy = 4;
    if (repeat) t.repeat.set(repeat[0], repeat[1]);
    return t;
  }

  // ---- faux / illusionistic marble floor -----------------------------
  function marbleFloor() {
    const S = 256, c = canvas(S); if (!c) return null;
    const x = c.getContext('2d'), r = rng(31);
    // warm white base with soft grey veining (a calm Baroque marble)
    x.fillStyle = '#efeae0'; x.fillRect(0, 0, S, S);
    for (let i = 0; i < 2400; i++) {
      const px = r() * S, py = r() * S, v = 0.9 + r() * 0.1;
      x.fillStyle = 'rgba(' + (238 * v | 0) + ',' + (232 * v | 0) + ',' + (220 * v | 0) + ',0.5)';
      x.fillRect(px, py, 1, 1);
    }
    // meandering veins
    x.strokeStyle = 'rgba(150,140,125,0.35)'; x.lineWidth = 1.2;
    for (let v = 0; v < 9; v++) {
      x.beginPath();
      let px = r() * S, py = r() * S; x.moveTo(px, py);
      for (let s = 0; s < 40; s++) { px += (r() - 0.5) * 24; py += (r() - 0.5) * 24; x.lineTo(px, py); }
      x.stroke();
    }
    // a subtle diamond grid of inlay (white/ochre marble tiles)
    x.strokeStyle = 'rgba(120,100,70,0.22)'; x.lineWidth = 1.4;
    x.save(); x.translate(S / 2, S / 2); x.rotate(Math.PI / 4);
    for (let g = -S; g <= S; g += S / 4) { x.beginPath(); x.moveTo(g, -S * 1.5); x.lineTo(g, S * 1.5); x.stroke(); x.beginPath(); x.moveTo(-S * 1.5, g); x.lineTo(S * 1.5, g); x.stroke(); }
    x.restore();
    return finalize(c, [6, 2]);
  }

  // ---- white stucco wall ---------------------------------------------
  function stuccoWall() {
    const S = 256, c = canvas(S); if (!c) return null;
    const x = c.getContext('2d'), r = rng(77);
    x.fillStyle = '#f6f2e9'; x.fillRect(0, 0, S, S);
    // fine plaster grain
    for (let i = 0; i < 9000; i++) {
      const px = r() * S, py = r() * S, d = (r() - 0.5) * 18;
      x.fillStyle = 'rgba(' + (246 + d | 0) + ',' + (242 + d | 0) + ',' + (233 + d | 0) + ',0.5)';
      x.fillRect(px, py, 1, 1);
    }
    // soft panel shading top-to-bottom
    const grad = x.createLinearGradient(0, 0, 0, S);
    grad.addColorStop(0, 'rgba(255,255,255,0.12)');
    grad.addColorStop(1, 'rgba(180,170,150,0.12)');
    x.fillStyle = grad; x.fillRect(0, 0, S, S);
    return finalize(c, [2, 2]);
  }

  // ---- gold leaf trim -------------------------------------------------
  function goldTrim() {
    const S = 128, c = canvas(S); if (!c) return null;
    const x = c.getContext('2d'), r = rng(99);
    const grad = x.createLinearGradient(0, 0, S, S);
    grad.addColorStop(0, '#b8860b');
    grad.addColorStop(0.4, '#f6d774');
    grad.addColorStop(0.5, '#fff3bf');
    grad.addColorStop(0.6, '#f6d774');
    grad.addColorStop(1, '#a9760a');
    x.fillStyle = grad; x.fillRect(0, 0, S, S);
    // hammered highlights
    for (let i = 0; i < 400; i++) {
      const px = r() * S, py = r() * S;
      x.fillStyle = r() < 0.5 ? 'rgba(255,248,210,0.5)' : 'rgba(140,100,10,0.4)';
      x.fillRect(px, py, 2, 2);
    }
    return finalize(c, [1, 1]);
  }

  // ---- carved white+gold bookcase wood -------------------------------
  function woodCase() {
    const S = 128, c = canvas(S); if (!c) return null;
    const x = c.getContext('2d'), r = rng(123);
    // the cases are painted white (ivory) with gilt mouldings, not bare wood
    x.fillStyle = '#f3ecdd'; x.fillRect(0, 0, S, S);
    for (let i = 0; i < 3000; i++) {
      const px = r() * S, py = r() * S, d = (r() - 0.5) * 14;
      x.fillStyle = 'rgba(' + (243 + d | 0) + ',' + (236 + d | 0) + ',' + (221 + d | 0) + ',0.5)';
      x.fillRect(px, py, 1, 1);
    }
    // a gilt border frame (the carved moulding)
    x.strokeStyle = '#d9b24a'; x.lineWidth = 6; x.strokeRect(6, 6, S - 12, S - 12);
    x.strokeStyle = '#8a6418'; x.lineWidth = 1.5; x.strokeRect(9, 9, S - 18, S - 18);
    return finalize(c, [1, 2]);
  }

  // ---- leather book spines -------------------------------------------
  function bookSpines() {
    const S = 256, c = canvas(S); if (!c) return null;
    const x = c.getContext('2d'), r = rng(256);
    // Admont's books are famously uniform white-vellum bindings with gilt titles.
    // We paint a shelf-strip of pale spines with occasional tan/brown leather.
    const pale = ['#efe6d2', '#e9ddc4', '#f2ead8', '#e4d9bf'];
    const dark = ['#7a4a2a', '#5a3620', '#8a5a2e', '#3c2a1c'];
    let px = 0;
    while (px < S) {
      const wpx = 6 + Math.floor(r() * 10);
      const isDark = r() < 0.18;
      x.fillStyle = isDark ? dark[(r() * dark.length) | 0] : pale[(r() * pale.length) | 0];
      x.fillRect(px, 0, wpx, S);
      // shading at each spine edge
      x.fillStyle = 'rgba(0,0,0,0.12)'; x.fillRect(px, 0, 1, S);
      x.fillStyle = 'rgba(255,255,255,0.14)'; x.fillRect(px + 1, 0, 1, S);
      // a gilt title band
      x.fillStyle = 'rgba(190,150,60,0.75)';
      x.fillRect(px + 1, S * 0.32 + r() * 16, wpx - 2, 3);
      x.fillRect(px + 1, S * 0.58 + r() * 16, wpx - 2, 2);
      px += wpx;
    }
    return finalize(c, [8, 1]);
  }

  root.AdmontTex = {
    marbleFloor, stuccoWall, goldTrim, woodCase, bookSpines,
    make: { marbleFloor, stuccoWall, goldTrim, woodCase, bookSpines }
  };
  if (typeof module !== 'undefined') module.exports = root.AdmontTex;
})(typeof window !== 'undefined' ? window : globalThis);
