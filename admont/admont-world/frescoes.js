/* Admont Abbey Library - the seven ceiling frescoes (PD-Art PLACEHOLDERS, painted in code).
 *
 * Bartolomeo Altomonte painted the seven ceiling frescoes in 1775-76 (he died in 1783, so the
 * works are in the public domain). They show the stages of human knowledge, rising to
 * Divine Revelation in the central dome. The exact subject of each panel is NOT encoded
 * here: every panel is a procedural stand-in (sky, clouds, draped figures, putti, gilt
 * cartouche) so the scene renders offline.
 *
 * Order along the hall, north -> south:
 *   1 2 3  = the three vaults of the north hall
 *   4      = the central dome (round)
 *   5 6 7  = the three vaults of the south hall
 *
 * Real images: put public-domain photographs (PD-Art, e.g. from Wikimedia Commons, check each
 * file page says public domain / PD-Art and NOT CC BY-SA) at
 *   assets/frescoes/fresco_1.jpg ... assets/frescoes/fresco_7.jpg
 * When the file loads from the same origin, it is painted into the cartouche (cover-fit)
 * and the gilt frame and stucco around it stay. If it is missing, or the page is opened
 * from file:// (the browser blocks reading it back), the procedural placeholder stays.
 *
 * Exposes AdmontFrescoes = { COUNT, INFO, make(i, opts) -> { tex, round } }.
 */
(function (root) {
  'use strict';

  const INFO = [
    { n: 1, where: 'north', label: '北厅 · 第 1 幅' },
    { n: 2, where: 'north', label: '北厅 · 第 2 幅' },
    { n: 3, where: 'north', label: '北厅 · 第 3 幅' },
    { n: 4, where: 'dome', label: '中央穹顶 · 神圣启示' },
    { n: 5, where: 'south', label: '南厅 · 第 5 幅' },
    { n: 6, where: 'south', label: '南厅 · 第 6 幅' },
    { n: 7, where: 'south', label: '南厅 · 第 7 幅' }
  ];
  // one palette per panel so the seven read as distinct paintings
  const PAL = [
    { sky: ['#8fb3d9', '#e9d8b8'], robes: ['#b8402f', '#3d5f9c', '#e0b64c', '#6f8f4a'] },
    { sky: ['#9cbfe0', '#f1dcc0'], robes: ['#8a3a6a', '#d79a3c', '#2f6f78', '#c8c0b0'] },
    { sky: ['#a4c4e2', '#f4e2c6'], robes: ['#3b4f8f', '#c4572f', '#e8cf7a', '#5e7d5a'] },
    { sky: ['#f8e6a8', '#9fc0e6'], robes: ['#c43c2c', '#2f4f9a', '#f0c14c', '#ffffff'] },
    { sky: ['#94b8de', '#efd6b4'], robes: ['#9a2f2f', '#4a6fa8', '#d9a84a', '#7a5a8a'] },
    { sky: ['#a0c2e4', '#f2dfc2'], robes: ['#2f6a5a', '#c8643a', '#e6c56a', '#4a4a8a'] },
    { sky: ['#8cb0d8', '#ead6b6'], robes: ['#7a2f4f', '#3a62a0', '#e2b85a', '#8a9a5a'] }
  ];

  function rng(seed) {
    let a = seed | 0;
    return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }

  // the cartouche outline: a scalloped oval (vaults) or a circle (dome)
  function cartouche(x, w, h, round) {
    const cx = w / 2, cy = h / 2;
    const rx = round ? w * 0.46 : w * 0.40, ry = round ? h * 0.46 : h * 0.42;
    x.beginPath();
    const N = 240;
    for (let i = 0; i <= N; i++) {
      const a = i / N * Math.PI * 2;
      const sc = round ? 1 : 1 + 0.045 * Math.cos(a * 8);      // gentle Rococo scallops
      const px = cx + Math.cos(a) * rx * sc, py = cy + Math.sin(a) * ry * sc;
      if (i) x.lineTo(px, py); else x.moveTo(px, py);
    }
    x.closePath();
    return { cx, cy, rx, ry };
  }

  function cloud(x, cx, cy, r, rnd, tint) {
    for (let i = 0; i < 14; i++) {
      const a = rnd() * Math.PI * 2, d = rnd() * r * 0.8, rr = r * (0.35 + rnd() * 0.45);
      const g = x.createRadialGradient(cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.6 - rr * 0.2, rr * 0.1, cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.6, rr);
      g.addColorStop(0, tint || 'rgba(255,252,244,0.95)'); g.addColorStop(0.7, 'rgba(240,232,220,0.55)'); g.addColorStop(1, 'rgba(230,220,205,0)');
      x.fillStyle = g; x.beginPath(); x.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.6, rr, 0, 7); x.fill();
    }
  }

  // a draped figure seen from below: robe swirl, flesh head and arms, a halo of light behind
  function figure(x, cx, cy, s, ang, robe, rnd) {
    x.save(); x.translate(cx, cy); x.rotate(ang); x.scale(s, s);
    const g = x.createLinearGradient(-30, -40, 30, 60); g.addColorStop(0, '#ffffff'); g.addColorStop(0.15, robe); g.addColorStop(1, '#2a1a10');
    x.fillStyle = g; x.beginPath();
    x.moveTo(-14, -26); x.bezierCurveTo(-46, 0, -40, 52, -10, 62); x.bezierCurveTo(10, 70, 46, 50, 38, 20); x.bezierCurveTo(30, -4, 22, -22, 14, -26); x.closePath(); x.fill();
    // a fluttering sash
    x.fillStyle = robe; x.globalAlpha = 0.75; x.beginPath(); x.moveTo(10, -10); x.quadraticCurveTo(60 + rnd() * 20, -30, 70, 10 + rnd() * 20); x.quadraticCurveTo(50, 0, 14, 4); x.fill(); x.globalAlpha = 1;
    x.fillStyle = '#e9c3a0';
    x.beginPath(); x.ellipse(0, -36, 11, 12, 0, 0, 7); x.fill();                            // head
    x.strokeStyle = '#e2b892'; x.lineWidth = 7; x.lineCap = 'round';
    x.beginPath(); x.moveTo(-10, -18); x.lineTo(-30 - rnd() * 10, -40 - rnd() * 14); x.stroke();  // raised arm
    x.beginPath(); x.moveTo(12, -16); x.lineTo(28, 6); x.stroke();
    x.fillStyle = '#6a4a2a'; x.beginPath(); x.ellipse(0, -44, 11, 6, 0, Math.PI, 0); x.fill();     // hair
    x.restore();
  }
  function putto(x, cx, cy, s) {
    x.save(); x.translate(cx, cy); x.scale(s, s);
    x.fillStyle = 'rgba(255,255,255,0.8)';
    x.beginPath(); x.ellipse(-13, -6, 12, 6, -0.6, 0, 7); x.fill(); x.beginPath(); x.ellipse(13, -6, 12, 6, 0.6, 0, 7); x.fill();
    x.fillStyle = '#f0c8a8'; x.beginPath(); x.ellipse(0, 4, 9, 11, 0, 0, 7); x.fill(); x.beginPath(); x.arc(0, -10, 7, 0, 7); x.fill();
    x.restore();
  }

  // gilt Rococo ornament on the white stucco around the cartouche
  function rocaille(x, w, h, c, round, rnd) {
    x.save();
    x.strokeStyle = '#c99a36'; x.lineCap = 'round';
    const N = round ? 16 : 12;
    for (let i = 0; i < N; i++) {
      const a = i / N * Math.PI * 2 + (round ? 0 : Math.PI / N);
      const ex = c.cx + Math.cos(a) * c.rx * 1.08, ey = c.cy + Math.sin(a) * c.ry * 1.08;
      x.lineWidth = 3.5;
      x.beginPath(); x.moveTo(ex, ey);
      const ox = Math.cos(a) * 46, oy = Math.sin(a) * 46;
      x.bezierCurveTo(ex + ox - oy * 0.6, ey + oy + ox * 0.6, ex + ox * 1.4 + oy * 0.4, ey + oy * 1.4 - ox * 0.4, ex + ox * 0.9, ey + oy * 0.9);
      x.stroke();
      x.beginPath(); x.arc(ex + ox * 0.9, ey + oy * 0.9, 6, 0, 7); x.stroke();
    }
    if (!round) {   // corner shells
      for (const [sx, sy] of [[0.12, 0.08], [0.88, 0.08], [0.12, 0.92], [0.88, 0.92]]) {
        const px = w * sx, py = h * sy;
        for (let k = 0; k < 7; k++) { x.lineWidth = 2.5; x.beginPath(); x.moveTo(px, py); x.lineTo(px + Math.cos(k / 6 * Math.PI) * 34 * (sx < 0.5 ? 1 : -1), py + Math.sin(k / 6 * Math.PI) * 34 * (sy < 0.5 ? 1 : -1)); x.stroke(); }
      }
    }
    x.restore();
  }

  function paintScene(x, w, h, c, i, round) {
    const rnd = rng(1775 + i * 97), pal = PAL[i % PAL.length];
    // sky: light rising from the centre (the dome is brightest: Divine Revelation)
    const sky = x.createRadialGradient(c.cx, c.cy, 0, c.cx, c.cy, Math.max(c.rx, c.ry) * 1.05);
    sky.addColorStop(0, round ? '#fff6d0' : pal.sky[1]); sky.addColorStop(round ? 0.35 : 0.55, round ? pal.sky[0] : '#c9dbee'); sky.addColorStop(1, round ? '#8fb2dc' : pal.sky[0]);
    x.fillStyle = sky; x.fillRect(0, 0, w, h);
    if (round) {
      const glow = x.createRadialGradient(c.cx, c.cy, 0, c.cx, c.cy, c.rx * 0.35);
      glow.addColorStop(0, 'rgba(255,250,220,1)'); glow.addColorStop(1, 'rgba(255,236,170,0)');
      x.fillStyle = glow; x.fillRect(0, 0, w, h);
      x.strokeStyle = 'rgba(255,230,150,0.5)'; x.lineWidth = 3;
      for (let k = 0; k < 36; k++) { const a = k / 36 * Math.PI * 2; x.beginPath(); x.moveTo(c.cx + Math.cos(a) * c.rx * 0.1, c.cy + Math.sin(a) * c.ry * 0.1); x.lineTo(c.cx + Math.cos(a) * c.rx * 0.42, c.cy + Math.sin(a) * c.ry * 0.42); x.stroke(); }
    }
    // a ring of clouds near the rim (the figures sit on them, seen from below)
    const NC = round ? 22 : 16;
    for (let k = 0; k < NC; k++) {
      const a = k / NC * Math.PI * 2 + rnd() * 0.2, d = 0.72 + rnd() * 0.22;
      cloud(x, c.cx + Math.cos(a) * c.rx * d, c.cy + Math.sin(a) * c.ry * d, Math.min(c.rx, c.ry) * (0.16 + rnd() * 0.1), rnd);
    }
    // the figure groups on the clouds, heads toward the centre
    const NF = round ? 14 : 9;
    for (let k = 0; k < NF; k++) {
      const a = k / NF * Math.PI * 2 + rnd() * 0.3, d = 0.62 + rnd() * 0.2;
      const px = c.cx + Math.cos(a) * c.rx * d, py = c.cy + Math.sin(a) * c.ry * d;
      figure(x, px, py, (round ? 1.3 : 1.05) * (0.8 + rnd() * 0.4) * w / 640, a - Math.PI / 2 + (rnd() - 0.5) * 0.6 + Math.PI, pal.robes[(rnd() * pal.robes.length) | 0], rnd);
    }
    for (let k = 0; k < (round ? 10 : 6); k++) {
      const a = rnd() * Math.PI * 2, d = 0.3 + rnd() * 0.3;
      putto(x, c.cx + Math.cos(a) * c.rx * d, c.cy + Math.sin(a) * c.ry * d, (0.9 + rnd() * 0.5) * w / 640);
    }
    // a central allegory: an open book in light (knowledge) or the dove in glory (dome)
    x.save(); x.translate(c.cx, c.cy);
    if (round) {
      x.fillStyle = '#ffffff'; x.beginPath(); x.ellipse(0, 0, 30, 12, 0, 0, 7); x.fill();
      x.beginPath(); x.ellipse(-22, -6, 26, 8, -0.5, 0, 7); x.fill(); x.beginPath(); x.ellipse(22, -6, 26, 8, 0.5, 0, 7); x.fill();
    } else {
      cloud(x, 0, 0, Math.min(c.rx, c.ry) * 0.22, rnd, 'rgba(255,248,230,0.95)');
      x.rotate((rnd() - 0.5) * 0.6);
      x.fillStyle = '#fbf3df'; x.strokeStyle = '#b48a3a'; x.lineWidth = 2;
      x.beginPath(); x.moveTo(-40, -8); x.quadraticCurveTo(-20, -18, 0, -8); x.quadraticCurveTo(20, -18, 40, -8); x.lineTo(40, 18); x.quadraticCurveTo(20, 8, 0, 18); x.quadraticCurveTo(-20, 8, -40, 18); x.closePath(); x.fill(); x.stroke();
    }
    x.restore();
    // aerial haze toward the centre so it reads as deep sky
    const haze = x.createRadialGradient(c.cx, c.cy, 0, c.cx, c.cy, Math.max(c.rx, c.ry));
    haze.addColorStop(0, 'rgba(255,250,235,0.15)'); haze.addColorStop(1, 'rgba(255,250,235,0)');
    x.fillStyle = haze; x.fillRect(0, 0, w, h);
  }

  /* make(i, {q, base}) -> { tex, round }
   *   i     0..6 (panel index, north -> south; 3 is the dome)
   *   q     texture scale (1 desktop, 0.5 mobile)
   *   base  url prefix for assets/frescoes/ */
  function make(i, opts) {
    opts = opts || {};
    const T = root.THREE, round = i === 3, q = opts.q || 1;
    const w = Math.round((round ? 1024 : 640) * q), h = Math.round(1024 * q);
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const x = cv.getContext('2d');

    function frame(paintInside) {
      // stucco ground
      x.fillStyle = '#f6f2e8'; x.fillRect(0, 0, w, h);
      const rr = rng(40 + i);
      for (let k = 0; k < 2000; k++) { x.fillStyle = 'rgba(200,190,170,' + rr() * 0.06 + ')'; x.fillRect(rr() * w, rr() * h, 2, 2); }
      x.save(); x.scale(w / (round ? 1024 : 640), h / 1024);
      const W0 = round ? 1024 : 640, H0 = 1024;
      const c = cartouche(x, W0, H0, round);
      rocaille(x, W0, H0, c, round, rr);
      x.save(); cartouche(x, W0, H0, round); x.clip();
      paintInside(c, W0, H0);
      x.restore();
      // the gilt frame: dark edge, bright leaf, highlight
      for (const [lw, col] of [[22, '#7a5a18'], [16, '#d4a945'], [6, '#fbe7a4'], [2, '#8a6418']]) {
        cartouche(x, W0, H0, round); x.lineWidth = lw; x.strokeStyle = col; x.stroke();
      }
      x.restore();
    }
    frame((c, W0, H0) => paintScene(x, W0, H0, c, i, round));

    const tex = new T.CanvasTexture(cv);
    tex.anisotropy = 8;
    if (T.sRGBEncoding !== undefined) tex.encoding = T.sRGBEncoding;

    // optional real photograph
    if (typeof Image !== 'undefined' && opts.base !== false) {
      const img = new Image();
      img.onload = function () {
        // test on a scratch canvas first: a cross-origin (file://) image would taint the
        // main canvas for good and WebGL would then refuse to upload it
        try {
          const sc = document.createElement('canvas'); sc.width = sc.height = 2;
          const sx = sc.getContext('2d'); sx.drawImage(img, 0, 0, 2, 2); sx.getImageData(0, 0, 1, 1);
        } catch (e) { return; }
        frame((c, W0, H0) => {
          const bw = c.rx * 2.2, bh = c.ry * 2.2, s = Math.max(bw / img.width, bh / img.height);
          x.drawImage(img, c.cx - img.width * s / 2, c.cy - img.height * s / 2, img.width * s, img.height * s);
        });
        tex.needsUpdate = true;
      };
      img.onerror = function () {};
      img.src = (opts.base || '') + 'assets/frescoes/fresco_' + (i + 1) + '.jpg';
    }
    return { tex, round, info: INFO[i] };
  }

  root.AdmontFrescoes = { COUNT: 7, INFO, make };
  if (typeof module !== 'undefined') module.exports = root.AdmontFrescoes;
})(typeof window !== 'undefined' ? window : globalThis);
