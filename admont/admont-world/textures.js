/* Admont Abbey Library - procedural CC0-equivalent PLACEHOLDER textures (canvas).
 *
 * Every texture here is painted in code so the scene renders with NO network access.
 * They stand in for real CC0 textures. To use real files, save them under
 * admont/assets/textures/ with these names (scene.js tries them first, see AdmontTex.load):
 *
 *   marbleFloor -> assets/textures/marble_floor_diff.jpg   (CC0, e.g. Poly Haven marble)
 *   stuccoWall  -> assets/textures/white_plaster_diff.jpg  (CC0, e.g. Poly Haven plaster)
 *   goldTrim    -> assets/textures/gold_leaf_diff.jpg      (CC0)
 *   woodCase    -> assets/textures/carved_wood_diff.jpg    (CC0, painted wood)
 *   bookSpine   -> assets/textures/leather_books_diff.jpg  (CC0, one spine, vertical)
 *
 * PUBLIC-DOMAIN + CC0 ONLY. No CC BY-SA, no paid API, no attribution page required.
 * Exposes AdmontTex = { marbleFloor, stuccoWall, goldTrim, woodCase, bookSpine, bookSpines,
 *   windowGlass, relief, load }.  Builders return THREE.CanvasTexture (THREE loaded first).
 */
(function (root) {
  'use strict';

  function rng(seed) {
    let a = seed | 0;
    return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  function canvas(w, h) {
    if (typeof document === 'undefined') return null;
    const c = document.createElement('canvas'); c.width = w; c.height = h || w; return c;
  }
  function finalize(c, repeat, srgb) {
    const T = root.THREE; if (!T || !c) return null;
    const t = new T.CanvasTexture(c);
    t.wrapS = t.wrapT = T.RepeatWrapping;
    t.anisotropy = 8;
    if (srgb !== false && T.sRGBEncoding !== undefined) t.encoding = T.sRGBEncoding;
    if (repeat) t.repeat.set(repeat[0], repeat[1]);
    return t;
  }
  // soft marble veins over the whole canvas (they cross tile edges, like real stone)
  function veins(x, w, h, r, n, col, lw) {
    x.save(); x.lineCap = 'round';
    for (let v = 0; v < n; v++) {
      x.strokeStyle = col; x.lineWidth = lw * (0.4 + r());
      x.beginPath();
      let px = r() * w, py = r() * h, a = r() * Math.PI * 2; x.moveTo(px, py);
      for (let s = 0; s < 60; s++) { a += (r() - 0.5) * 0.7; px += Math.cos(a) * 9; py += Math.sin(a) * 9; x.lineTo(px, py); }
      x.stroke();
    }
    x.restore();
  }

  /* ---- illusionistic marble floor ------------------------------------
   * Admont's floor is a rhomb inlay of white, grey and red marble laid so it reads as
   * tumbling 3D cubes. One canvas = 4 x 2 hexagons, so it tiles seamlessly.
   * userData.tile = [metres per repeat in x, in z]  (cube edge s = 0.45 m). */
  function marbleFloor() {
    const SW = 1024, s = SW / (4 * Math.sqrt(3)), SH = Math.round(6 * s);
    const c = canvas(SW, SH); if (!c) return null;
    const x = c.getContext('2d'), r = rng(31);
    const hw = Math.sqrt(3) / 2 * s;            // half hex width
    const top = '#f3eee4', left = '#9c9c98', right = '#a75a40';
    function rhomb(pts, fill) { x.beginPath(); x.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < 4; i++) x.lineTo(pts[i][0], pts[i][1]); x.closePath(); x.fillStyle = fill; x.fill(); }
    // pointy-top hexes; cube seen from above: top rhomb, left rhomb, right rhomb
    for (let row = -1; row <= 4; row++) {
      for (let col = -1; col <= 5; col++) {
        const cx = col * 2 * hw + (row & 1 ? hw : 0), cy = row * 1.5 * s;
        const T = [cx, cy - s], TR = [cx + hw, cy - s / 2], BR = [cx + hw, cy + s / 2], B = [cx, cy + s], BL = [cx - hw, cy + s / 2], TL = [cx - hw, cy - s / 2], C = [cx, cy];
        rhomb([T, TR, C, TL], top);
        rhomb([TL, C, B, BL], left);
        rhomb([C, TR, BR, B], right);
      }
    }
    // stone grain
    const img = x.getImageData(0, 0, SW, SH), d = img.data;
    for (let i = 0; i < d.length; i += 4) { const n = (r() - 0.5) * 10; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
    x.putImageData(img, 0, 0);
    veins(x, SW, SH, r, 26, 'rgba(110,100,92,0.18)', 2.2);
    veins(x, SW, SH, r, 18, 'rgba(255,255,255,0.22)', 1.6);
    // grout lines
    x.strokeStyle = 'rgba(70,58,48,0.45)'; x.lineWidth = 1.6;
    for (let row = -1; row <= 4; row++) for (let col = -1; col <= 5; col++) {
      const cx = col * 2 * hw + (row & 1 ? hw : 0), cy = row * 1.5 * s;
      x.beginPath();
      x.moveTo(cx, cy - s); x.lineTo(cx + hw, cy - s / 2); x.lineTo(cx + hw, cy + s / 2); x.lineTo(cx, cy + s); x.lineTo(cx - hw, cy + s / 2); x.lineTo(cx - hw, cy - s / 2); x.closePath();
      x.moveTo(cx, cy); x.lineTo(cx, cy + s); x.moveTo(cx, cy); x.lineTo(cx + hw, cy - s / 2); x.moveTo(cx, cy); x.lineTo(cx - hw, cy - s / 2);
      x.stroke();
    }
    const t = finalize(c);
    const S = 0.45; if (t) { t.userData = t.userData || {}; t.userData.tile = [4 * Math.sqrt(3) * S, 6 * S]; }
    return t;
  }

  /* ---- white stucco (walls, vaults) ---------------------------------- */
  function stuccoWall() {
    const S = 256, c = canvas(S); if (!c) return null;
    const x = c.getContext('2d'), r = rng(77);
    x.fillStyle = '#f7f4ec'; x.fillRect(0, 0, S, S);
    const img = x.getImageData(0, 0, S, S), d = img.data;
    for (let i = 0; i < d.length; i += 4) { const n = (r() - 0.5) * 9; d[i] += n; d[i + 1] += n; d[i + 2] += n - 1; }
    x.putImageData(img, 0, 0);
    for (let i = 0; i < 40; i++) { x.fillStyle = 'rgba(230,222,205,' + (0.05 + r() * 0.06) + ')'; x.beginPath(); x.arc(r() * S, r() * S, 8 + r() * 30, 0, 7); x.fill(); }
    return finalize(c);
  }

  /* ---- gold leaf ------------------------------------------------------ */
  function goldTrim() {
    const S = 128, c = canvas(S); if (!c) return null;
    const x = c.getContext('2d'), r = rng(99);
    x.fillStyle = '#e8c46a'; x.fillRect(0, 0, S, S);
    for (let i = 0; i < 260; i++) { x.fillStyle = r() < 0.5 ? 'rgba(255,240,190,0.35)' : 'rgba(150,105,25,0.25)'; const q = 2 + r() * 7; x.fillRect(r() * S, r() * S, q, q); }
    return finalize(c);
  }

  /* ---- ivory-painted carved wood (bookcases) ------------------------- */
  function woodCase() {
    const S = 128, c = canvas(S); if (!c) return null;
    const x = c.getContext('2d'), r = rng(123);
    x.fillStyle = '#f2ebdb'; x.fillRect(0, 0, S, S);
    for (let i = 0; i < 70; i++) { x.strokeStyle = 'rgba(200,185,160,' + (0.08 + r() * 0.1) + ')'; x.lineWidth = 1; const y = r() * S; x.beginPath(); x.moveTo(0, y); x.bezierCurveTo(S / 3, y + (r() - 0.5) * 6, 2 * S / 3, y + (r() - 0.5) * 6, S, y); x.stroke(); }
    return finalize(c);
  }

  /* ---- one book spine (pale vellum with gilt bands and a title label) --
   * Mapped onto a unit box; the per-instance colour tints it (most of Admont's
   * books are white pigskin/vellum bindings). */
  function bookSpine() {
    const c = canvas(64, 256); if (!c) return null;
    const x = c.getContext('2d'), r = rng(256);
    x.fillStyle = '#ffffff'; x.fillRect(0, 0, 64, 256);
    for (let i = 0; i < 500; i++) { x.fillStyle = 'rgba(0,0,0,' + r() * 0.05 + ')'; x.fillRect(r() * 64, r() * 256, 2, 2); }
    const g = x.createLinearGradient(0, 0, 64, 0); g.addColorStop(0, 'rgba(0,0,0,0.22)'); g.addColorStop(0.25, 'rgba(0,0,0,0)'); g.addColorStop(0.75, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.25)');
    x.fillStyle = g; x.fillRect(0, 0, 64, 256);
    x.fillStyle = '#b8892c';
    for (const y of [22, 30, 224, 232]) x.fillRect(4, y, 56, 4);
    x.fillStyle = '#7a3a26'; x.fillRect(8, 60, 48, 34);      // title label
    x.fillStyle = '#e2bd5c'; x.fillRect(12, 72, 40, 3); x.fillRect(16, 80, 32, 2);
    x.fillStyle = 'rgba(184,137,44,0.8)'; x.fillRect(10, 150, 44, 2);
    return finalize(c);
  }
  // kept for FEAT-001 callers
  const bookSpines = bookSpine;

  /* ---- window: bright sky through leaded glass ----------------------- */
  function windowGlass() {
    const c = canvas(128, 256); if (!c) return null;
    const x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, 0, 256); g.addColorStop(0, '#e9f3ff'); g.addColorStop(0.6, '#fbfdff'); g.addColorStop(1, '#fff7e4');
    x.fillStyle = g; x.fillRect(0, 0, 128, 256);
    x.fillStyle = 'rgba(214,226,214,0.35)';
    for (let i = 0; i < 6; i++) for (let j = 0; j < 12; j++) if ((i + j) & 1) x.fillRect(i * 21.3, j * 21.3, 21.3, 21.3);
    x.strokeStyle = 'rgba(95,95,90,0.55)'; x.lineWidth = 1.2;
    for (let i = 1; i < 6; i++) { x.beginPath(); x.moveTo(i * 21.3, 0); x.lineTo(i * 21.3, 256); x.stroke(); }
    for (let j = 1; j < 12; j++) { x.beginPath(); x.moveTo(0, j * 21.3); x.lineTo(128, j * 21.3); x.stroke(); }
    x.fillStyle = '#efe8d8'; x.fillRect(60, 0, 8, 256); x.fillRect(0, 84, 128, 7); x.fillRect(0, 170, 128, 7);   // mullion + transoms
    x.strokeStyle = '#efe8d8'; x.lineWidth = 10; x.strokeRect(0, 0, 128, 256);
    return finalize(c);
  }

  /* ---- gilt relief medallion (Stammel's two reliefs) ----------------- */
  function relief(seed) {
    const S = 256, c = canvas(S); if (!c) return null;
    const x = c.getContext('2d'), r = rng(seed || 5);
    const g = x.createRadialGradient(100, 90, 10, 128, 128, 140); g.addColorStop(0, '#fbe7a4'); g.addColorStop(0.6, '#d3a63e'); g.addColorStop(1, '#8a6414');
    x.fillStyle = g; x.fillRect(0, 0, S, S);
    // embossed figures: draw each shape dark offset, then light
    function fig(cx, cy, sc) {
      for (const [dx, dy, col] of [[2, 3, 'rgba(90,60,10,0.55)'], [-1, -1, 'rgba(255,245,200,0.55)'], [0, 0, '#c99a36']]) {
        x.fillStyle = col; x.beginPath();
        x.ellipse(cx + dx, cy - 40 * sc + dy, 9 * sc, 10 * sc, 0, 0, 7); x.fill();
        x.beginPath(); x.moveTo(cx - 14 * sc + dx, cy - 28 * sc + dy); x.quadraticCurveTo(cx - 26 * sc + dx, cy + 30 * sc + dy, cx - 20 * sc + dx, cy + 38 * sc + dy);
        x.lineTo(cx + 22 * sc + dx, cy + 38 * sc + dy); x.quadraticCurveTo(cx + 24 * sc + dx, cy + 10 * sc + dy, cx + 14 * sc + dx, cy - 28 * sc + dy); x.closePath(); x.fill();
      }
    }
    for (let i = 0; i < 4; i++) fig(60 + i * 46, 140 + (r() - 0.5) * 20, 0.85 + r() * 0.3);
    x.strokeStyle = 'rgba(255,240,190,0.6)'; x.lineWidth = 2;
    for (let i = 0; i < 9; i++) { x.beginPath(); x.arc(128, 128, 112 - i * 0.5, 0, 7); x.stroke(); }
    return finalize(c);
  }

  /* ---- optional real-file override ----------------------------------
   * Try base + 'assets/textures/<file>'; when it loads, swap it into tex.image.
   * Silent on 404 / file:// (cross-origin) so the placeholder stays. */
  function load(tex, file, base) {
    if (!tex || typeof Image === 'undefined') return;
    const img = new Image();
    img.onload = function () {
      try {
        const c = canvas(img.width, img.height); const x = c.getContext('2d'); x.drawImage(img, 0, 0);
        x.getImageData(0, 0, 1, 1);              // throws if the canvas is tainted (file://)
        tex.image = c; tex.needsUpdate = true;
      } catch (e) { /* keep the procedural placeholder */ }
    };
    img.onerror = function () {};
    img.src = (base || '') + 'assets/textures/' + file;
  }

  root.AdmontTex = { marbleFloor, stuccoWall, goldTrim, woodCase, bookSpine, bookSpines, windowGlass, relief, load, rng, canvas, finalize };
  if (typeof module !== 'undefined') module.exports = root.AdmontTex;
})(typeof window !== 'undefined' ? window : globalThis);
