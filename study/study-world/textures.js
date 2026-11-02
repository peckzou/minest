/* The Study - procedural textures (canvas, no files, no network; nothing to attribute).
 * wood(dark|light), parquet, carpet, leather, damask, plaster, spine (generic book), and spineAtlas(books)
 * which paints the real spines (title, author) of the user's books into one atlas.
 * Exposes StudyTex = { wood, parquet, carpet, leather, damask, plaster, spine, spineAtlas, color }. */
(function (root) {
  'use strict';
  function rng(seed) { let a = seed | 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function cv(w, h) { if (typeof document === 'undefined') return null; const c = document.createElement('canvas'); c.width = w; c.height = h || w; return c; }
  function tex(c, rep, srgb) {
    const T = root.THREE; if (!T || !c) return null;
    const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.anisotropy = 4;
    if (srgb !== false && T.sRGBEncoding !== undefined) t.encoding = T.sRGBEncoding;
    if (rep) t.repeat.set(rep[0], rep[1]); return t;
  }
  function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  // book cloth colours: oxblood, bottle green, navy, tan calf, black, burgundy, ochre, slate
  const CLOTH = ['#5a1a1c', '#1f4a33', '#1d2f55', '#7b5632', '#201a18', '#6e2230', '#8a6a2a', '#3d4752', '#4a2d1d', '#2c5446'];
  function color(id) { return CLOTH[hash(String(id)) % CLOTH.length]; }

  /* mahogany / walnut: long vertical grain with darker streaks. Grain runs along v. */
  function wood(kind) {
    const c = cv(512, 512), x = c.getContext('2d'), r = rng(kind === 'light' ? 11 : 7);
    const base = kind === 'light' ? [120, 78, 44] : [62, 36, 22];
    x.fillStyle = 'rgb(' + base.join(',') + ')'; x.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 420; i++) {
      const px = r() * 512, w = 0.6 + r() * 3.2, a = 0.05 + r() * 0.14, d = r() < 0.5 ? -1 : 1, k = 28 * d;
      x.fillStyle = 'rgba(' + (base[0] + k) + ',' + (base[1] + k * .7) + ',' + (base[2] + k * .5) + ',' + a + ')';
      let off = 0; for (let y = 0; y < 512; y += 16) { off += (r() - .5) * 1.4; x.fillRect(px + off, y, w, 17); }
    }
    for (let i = 0; i < 6; i++) { const cx = r() * 512, cy = r() * 512; for (let k = 1; k < 7; k++) { x.strokeStyle = 'rgba(20,10,4,' + (0.05 + 0.02 * k) + ')'; x.lineWidth = 1; x.beginPath(); x.ellipse(cx, cy, 5 + k * 5, 12 + k * 16, 0, 0, 7); x.stroke(); } }   // knots
    return tex(c);
  }
  /* herringbone parquet, tiles every 1.2 m */
  function parquet() {
    const c = cv(512, 512), x = c.getContext('2d'), r = rng(5), n = 6, L = 512 / n * 2, W = 512 / n / 2;
    x.fillStyle = '#6b4a2c'; x.fillRect(0, 0, 512, 512);
    for (let gy = -1; gy <= n * 2; gy++) for (let gx = -1; gx <= n; gx++) {
      const bx = gx * (512 / n) + (gy & 1 ? 512 / n / 2 : 0), by = gy * W;
      const sh = 88 + r() * 40; x.fillStyle = 'rgb(' + sh + ',' + (sh * .66 | 0) + ',' + (sh * .4 | 0) + ')';
      x.fillRect(bx, by, 512 / n, W - 1);
      x.fillStyle = 'rgba(30,15,5,.16)'; x.fillRect(bx, by + W - 1, 512 / n, 1);
    }
    return tex(c);
  }
  /* a Persian-style carpet: deep red field, indigo border, ivory medallions */
  function carpet() {
    const c = cv(512, 768), x = c.getContext('2d'), r = rng(23);
    x.fillStyle = '#6a1c22'; x.fillRect(0, 0, 512, 768);
    for (let i = 0; i < 9000; i++) { x.fillStyle = 'rgba(' + (r() < .5 ? '255,220,200' : '20,5,5') + ',' + (r() * .05) + ')'; x.fillRect(r() * 512, r() * 768, 2, 2); }
    function frame(i, col, w) { x.strokeStyle = col; x.lineWidth = w; x.strokeRect(i, i, 512 - 2 * i, 768 - 2 * i); }
    frame(14, '#d9c590', 5); frame(34, '#1f2e5c', 40); frame(60, '#d9c590', 4); frame(70, '#8a2d2f', 2);
    x.fillStyle = '#d9c590';
    for (let k = 0; k < 14; k++) { const yy = 60 + k * 49; x.beginPath(); x.moveTo(34, yy); x.lineTo(46, yy + 10); x.lineTo(34, yy + 20); x.lineTo(22, yy + 10); x.fill(); x.beginPath(); x.moveTo(478, yy); x.lineTo(490, yy + 10); x.lineTo(478, yy + 20); x.lineTo(466, yy + 10); x.fill(); }
    // central medallion + corner motifs
    function medallion(cx, cy, rr) {
      for (let k = 0; k < 5; k++) { x.fillStyle = ['#1f2e5c', '#d9c590', '#8a2d2f', '#e8ddc0', '#1f2e5c'][k]; x.beginPath(); x.ellipse(cx, cy, rr * (1 - k * .18), rr * 1.5 * (1 - k * .18), 0, 0, 7); x.fill(); }
      x.strokeStyle = '#d9c590'; x.lineWidth = 2; for (let k = 0; k < 12; k++) { const a = k / 12 * 6.283; x.beginPath(); x.moveTo(cx + Math.cos(a) * rr * .3, cy + Math.sin(a) * rr * .45); x.lineTo(cx + Math.cos(a) * rr * .9, cy + Math.sin(a) * rr * 1.35); x.stroke(); }
    }
    medallion(256, 384, 110);
    for (const [px, py] of [[130, 190], [382, 190], [130, 578], [382, 578]]) { x.fillStyle = '#b8a36c'; x.beginPath(); x.ellipse(px, py, 34, 44, 0, 0, 7); x.fill(); x.fillStyle = '#1f2e5c'; x.beginPath(); x.ellipse(px, py, 20, 28, 0, 0, 7); x.fill(); }
    for (let i = 0; i < 160; i++) { x.fillStyle = 'rgba(217,197,144,.35)'; x.fillRect(90 + r() * 330, 100 + r() * 570, 3, 3); }
    return tex(c);
  }
  /* desk-top leather: dark green with a gold-tooled border */
  function leather() {
    const c = cv(256, 256), x = c.getContext('2d'), r = rng(2);
    x.fillStyle = '#1f3a2a'; x.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 4000; i++) { x.fillStyle = 'rgba(0,0,0,' + (r() * .12) + ')'; x.fillRect(r() * 256, r() * 256, 1.5, 1.5); }
    x.strokeStyle = '#c9a24a'; x.lineWidth = 2; x.strokeRect(10, 10, 236, 236); x.lineWidth = 1; x.strokeRect(16, 16, 224, 224);
    return tex(c);
  }
  /* curtain damask: olive green with gold lozenges */
  function damask() {
    const c = cv(256, 256), x = c.getContext('2d');
    x.fillStyle = '#4f5a34'; x.fillRect(0, 0, 256, 256);
    for (let gy = 0; gy < 4; gy++) for (let gx = 0; gx < 4; gx++) {
      const cx = gx * 64 + (gy & 1 ? 32 : 0), cy = gy * 64 + 32;
      x.fillStyle = '#b79a4c'; x.beginPath(); x.moveTo(cx, cy - 26); x.quadraticCurveTo(cx + 14, cy, cx, cy + 26); x.quadraticCurveTo(cx - 14, cy, cx, cy - 26); x.fill();
      x.fillStyle = '#31391f'; x.beginPath(); x.arc(cx, cy, 6, 0, 7); x.fill();
      x.strokeStyle = 'rgba(183,154,76,.5)'; x.beginPath(); x.arc(cx + 32, cy + 32, 10, 0, 7); x.stroke();
    }
    return tex(c);
  }
  function plaster() {
    const c = cv(256, 256), x = c.getContext('2d'), r = rng(3);
    x.fillStyle = '#35402f'; x.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 5000; i++) { x.fillStyle = 'rgba(255,255,255,' + (r() * .035) + ')'; x.fillRect(r() * 256, r() * 256, 2, 2); }
    return tex(c);
  }
  /* one generic book spine, cloth colour comes from the instance; gold bands near top and bottom */
  function spine() {
    const c = cv(32, 128), x = c.getContext('2d');
    x.fillStyle = '#ffffff'; x.fillRect(0, 0, 32, 128);
    x.fillStyle = 'rgba(0,0,0,.18)'; x.fillRect(0, 0, 2, 128); x.fillRect(30, 0, 2, 128);
    x.fillStyle = '#c9a24a'; for (const y of [10, 14, 108, 112]) x.fillRect(0, y, 32, 2);
    x.fillStyle = 'rgba(201,162,74,.85)'; x.fillRect(5, 32, 22, 22);
    const t = tex(c); if (t) { t.wrapS = t.wrapT = root.THREE.ClampToEdgeWrapping; } return t;
  }
  /* the user's books: one atlas, a column per book. returns { texture, cols, rows, cw, ch, cell(i) -> uv rect } */
  const CW = 40, CH = 240, AW = 2048, AH = 1024;
  function spineAtlas(books) {
    const c = cv(AW, AH), x = c.getContext('2d'), perRow = Math.floor(AW / CW), rows = Math.floor(AH / CH);
    x.fillStyle = '#222'; x.fillRect(0, 0, AW, AH);
    const cap = perRow * rows, n = Math.min(books.length, cap), cells = [];
    for (let i = 0; i < n; i++) {
      const b = books[i], col = i % perRow, row = Math.floor(i / perRow), ox = col * CW, oy = row * CH, base = b.color || color(b.id || b.title);
      x.fillStyle = base; x.fillRect(ox, oy, CW, CH);
      const g = x.createLinearGradient(ox, 0, ox + CW, 0); g.addColorStop(0, 'rgba(0,0,0,.35)'); g.addColorStop(.25, 'rgba(255,255,255,.08)'); g.addColorStop(.75, 'rgba(0,0,0,.06)'); g.addColorStop(1, 'rgba(0,0,0,.4)');
      x.fillStyle = g; x.fillRect(ox, oy, CW, CH);
      x.fillStyle = '#c9a24a'; for (const y of [8, 13, CH - 13, CH - 8]) x.fillRect(ox + 1, oy + y, CW - 2, 2);
      x.save(); x.translate(ox + CW / 2, oy + CH / 2); x.rotate(Math.PI / 2);
      x.fillStyle = '#f0dfa8'; x.textAlign = 'center'; x.textBaseline = 'middle';
      let t = String(b.title || '?'); let fs = 17; x.font = '700 ' + fs + 'px Georgia,"Songti SC",serif';
      while (x.measureText(t).width > CH - 56 && fs > 10) { fs--; x.font = '700 ' + fs + 'px Georgia,"Songti SC",serif'; }
      if (x.measureText(t).width > CH - 56) { while (t.length > 3 && x.measureText(t + '…').width > CH - 56) t = t.slice(0, -1); t += '…'; }
      x.fillText(t, 0, -3);
      if (b.author) { x.font = '600 10px Georgia,"Songti SC",serif'; x.fillStyle = 'rgba(240,223,168,.75)'; let a = String(b.author); while (a.length > 2 && x.measureText(a).width > CH - 70) a = a.slice(0, -1); x.fillText(a, 0, 11); }
      x.restore();
      cells.push([ox / AW, 1 - (oy + CH) / AH, (ox + CW) / AW, 1 - oy / AH]);
    }
    const T = root.THREE, t = tex(c); if (t) { t.wrapS = t.wrapT = T.ClampToEdgeWrapping; t.anisotropy = 8; }
    return { texture: t, cells, count: n, capacity: cap };
  }
  root.StudyTex = { wood, parquet, carpet, leather, damask, plaster, spine, spineAtlas, color, hash, rng };
})(typeof window !== 'undefined' ? window : globalThis);
