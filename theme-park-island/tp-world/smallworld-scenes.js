/* Minest My World · "it's a small world" show scenes (`smallworld-scenes.js`)
 * Painted Mary Blair backdrops for the eight show rooms, every doll tableau and animated set piece,
 * the Mr. Lincoln stage (rising audio-animatronic) and the white-and-gold finale. Driven by smallworld.js. */
(function (root) {
  'use strict';

  function seeded(seed) { let s = seed % 2147483647; return () => (s = s * 16807 % 2147483647) / 2147483647; }

  /* ------------------------------------------------------------------ backdrops (512x512, tile horizontally) */
  function backdrops(cvs) {
    const TAU = Math.PI * 2;
    const circ = (x, cx, cy, r, col) => { x.fillStyle = col; x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.fill(); };
    const tri = (x, cx, by, w, h, col) => { x.fillStyle = col; x.beginPath(); x.moveTo(cx - w / 2, by); x.lineTo(cx, by - h); x.lineTo(cx + w / 2, by); x.closePath(); x.fill(); };
    const box = (x, cx, by, w, h, col) => { x.fillStyle = col; x.fillRect(cx - w / 2, by - h, w, h); };
    const star = (x, px, py, s, col) => { x.fillStyle = col; x.beginPath(); x.moveTo(px, py - s * 2); x.lineTo(px + s * 0.5, py - s * 0.5); x.lineTo(px + s * 2, py); x.lineTo(px + s * 0.5, py + s * 0.5); x.lineTo(px, py + s * 2); x.lineTo(px - s * 0.5, py + s * 0.5); x.lineTo(px - s * 2, py); x.lineTo(px - s * 0.5, py - s * 0.5); x.closePath(); x.fill(); };
    const stars = (x, r, n, col, y0, y1) => { for (let i = 0; i < n; i++) star(x, 24 + r() * 464, y0 + r() * (y1 - y0), 1.5 + r() * 3.5, col); };
    const zig = (x, y, h, n, colA, colB) => { const w = 512 / n; x.fillStyle = colA; x.fillRect(0, y, 512, h); for (let i = 0; i < n; i++) tri(x, i * w + w / 2, y + h, w, h, colB); };
    const wave = (x, y, amp, cycles, col) => { x.fillStyle = col; x.beginPath(); x.moveTo(0, 512); for (let px = 0; px <= 512; px += 4) x.lineTo(px, y + Math.sin(px / 512 * TAU * cycles) * amp); x.lineTo(512, 512); x.closePath(); x.fill(); };
    const house = (x, cx, w, h, col, roof) => { box(x, cx, 474, w, h, col); tri(x, cx, 474 - h, w * 1.15, w * 0.7, roof); for (let k = 0; k < Math.floor(h / 34); k++) box(x, cx, 474 - 14 - k * 34, w * 0.36, 16, 'rgba(255,240,170,0.85)'); };

    const DEFS = [
      { top: '#081a4a', bot: '#7fd4ff', paint(x, r) { // Hello / Arctic
        for (let k = 0; k < 3; k++) { x.globalAlpha = 0.28; wave(x, 120 + k * 46, 26, 2, ['#5dffb0', '#ff8fd0', '#8fd3ff'][k]); }
        x.globalAlpha = 1; wave(x, 250, 0, 1, 'rgba(8,26,74,0)');
        const g = x.createLinearGradient(0, 220, 0, 512); g.addColorStop(0, 'rgba(127,212,255,0)'); g.addColorStop(1, '#bfeaff'); x.fillStyle = g; x.fillRect(0, 220, 512, 292);
        stars(x, r, 46, '#ffffff', 16, 300);
        [[70, 150, 190], [190, 110, 130], [300, 170, 230], [430, 130, 160]].forEach(([cx, w, h], i) => { tri(x, cx, 474, w, h, i % 2 ? '#e8f8ff' : '#ffffff'); tri(x, cx + w * 0.16, 474, w * 0.5, h * 0.8, 'rgba(120,190,235,0.45)'); });
      } },
      { top: '#3b2a7a', bot: '#f3b6dc', paint(x, r) { // Europe
        stars(x, r, 30, '#fff3b0', 16, 230);
        circ(x, 410, 96, 36, '#fff3b0');
        [[46, 60, 150, '#ffd6e8', '#c0447a'], [118, 50, 220, '#d9c8ff', '#5b3fa8'], [186, 70, 130, '#fff1c2', '#d97a2b'], [262, 46, 250, '#c8ecff', '#2f7fb8'],
         [330, 74, 160, '#ffd0c2', '#b8402f'], [404, 52, 200, '#e6ffd6', '#3f8f4a'], [468, 56, 140, '#ffe3f4', '#8f3fa8']].forEach((h) => house(x, h[0], h[1], h[2], h[3], h[4]));
      } },
      { top: '#7a124f', bot: '#ffa64d', paint(x, r) { // Asia
        circ(x, 256, 150, 84, '#ffd76e'); circ(x, 256, 150, 62, '#ffb347');
        for (let i = 0; i < 9; i++) { const cx = 40 + i * 54, cy = 70 + (i % 3) * 38; x.strokeStyle = '#f5c542'; x.lineWidth = 2; x.beginPath(); x.moveTo(cx, 0); x.lineTo(cx, cy - 16); x.stroke(); circ(x, cx, cy, 16, '#e0263c'); box(x, cx, cy - 13, 16, 5, '#f5c542'); box(x, cx, cy + 20, 16, 5, '#f5c542'); }
        [[90, 4], [400, 5]].forEach(([cx, n]) => { for (let k = 0; k < n; k++) { const w = 110 - k * 18, y = 474 - k * 48; box(x, cx, y, w * 0.6, 34, '#b3122e'); tri(x, cx, y - 30, w, 18, '#2a0a3a'); } });
        for (let i = 0; i < 8; i++) circ(x, 32 + i * 64, 474, 30, 'rgba(255,214,235,0.75)');
        stars(x, r, 16, '#fff3b0', 200, 380);
      } },
      { top: '#062e24', bot: '#2fae6b', paint(x, r) { // Africa
        circ(x, 380, 120, 60, '#ffd43b'); circ(x, 380, 120, 42, '#ff922b');
        for (let i = 0; i < 26; i++) { const cx = 20 + r() * 472, cy = 200 + r() * 250; x.save(); x.translate(cx, cy); x.rotate((r() - 0.5) * 1.6); x.fillStyle = ['#0f6b3f', '#1d8a4f', '#7bd389', '#0a4f2e'][i % 4]; x.beginPath(); x.ellipse(0, 0, 14 + r() * 10, 52 + r() * 30, 0, 0, TAU); x.fill(); x.restore(); }
        zig(x, 40, 22, 16, '#f5c542', '#c2410c'); zig(x, 430, 22, 16, '#f5c542', '#7a1f0a');
        stars(x, r, 10, '#fff3b0', 80, 200);
      } },
      { top: '#ff6b2b', bot: '#ffe066', paint(x, r) { // Latin America
        for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; x.strokeStyle = '#fff3b0'; x.lineWidth = 9; x.beginPath(); x.moveTo(256 + Math.cos(a) * 70, 170 + Math.sin(a) * 70); x.lineTo(256 + Math.cos(a) * (i % 2 ? 108 : 132), 170 + Math.sin(a) * (i % 2 ? 108 : 132)); x.stroke(); }
        circ(x, 256, 170, 64, '#ffd43b');
        for (let i = 0; i < 12; i++) { const cx = 21 + i * 42.6; box(x, cx, 62, 36, 40, ['#e0263c', '#2f9e44', '#7b2cbf', '#0ea5e9', '#f5c542', '#ff5d8f'][i % 6]); tri(x, cx, 62, 36, -16, ['#e0263c', '#2f9e44', '#7b2cbf', '#0ea5e9', '#f5c542', '#ff5d8f'][i % 6]); circ(x, cx, 42, 6, 'rgba(255,255,255,0.8)'); }
        [[60, 120], [150, 80], [372, 100], [460, 130]].forEach(([cx, h]) => { box(x, cx, 474, 20, h, '#2f9e44'); box(x, cx - 20, 474 - h * 0.4, 12, h * 0.35, '#2f9e44'); box(x, cx + 20, 474 - h * 0.55, 12, h * 0.3, '#2f9e44'); box(x, cx - 12, 474 - h * 0.4, 14, 10, '#2f9e44'); box(x, cx + 12, 474 - h * 0.55, 14, 10, '#2f9e44'); });
        stars(x, r, 12, '#ffffff', 250, 400);
      } },
      { top: '#0a2a6b', bot: '#35d6cf', paint(x, r) { // South Seas
        stars(x, r, 24, '#ffffff', 16, 180);
        for (let k = 0; k < 5; k++) wave(x, 250 + k * 50, 12, 4 + (k % 2) * 2, ['#1877c9', '#1e9bd6', '#27b9d9', '#35d6cf', '#8ff0e6'][k]);
        for (let i = 0; i < 9; i++) { const cx = 40 + r() * 430, cy = 290 + r() * 150, c = ['#ff922b', '#ffd43b', '#ff5d8f'][i % 3]; x.fillStyle = c; x.beginPath(); x.ellipse(cx, cy, 16, 8, 0, 0, TAU); x.fill(); tri(x, cx - 18, cy + 9, 14, 18, c); circ(x, cx + 8, cy - 2, 2, '#0a2a6b'); }
        for (let i = 0; i < 18; i++) circ(x, 20 + r() * 472, 220 + r() * 240, 2 + r() * 4, 'rgba(255,255,255,0.55)');
      } },
      { top: '#3a1d6b', bot: '#ff9a4d', paint(x, r) { // North America
        circ(x, 150, 250, 58, '#ffd76e');
        stars(x, r, 30, '#fff3b0', 16, 210);
        [[70, 130, 150], [230, 180, 110], [400, 150, 180]].forEach(([cx, w, h]) => { box(x, cx, 474, w, h, '#b8442a'); box(x, cx, 474 - h, w * 0.7, 26, '#c9562f'); box(x, cx - w * 0.3, 474, w * 0.16, h * 0.7, '#8f2f1c'); });
        [[150, 70], [318, 90], [480, 60]].forEach(([cx, h]) => { box(x, cx, 474, 14, h, '#1f6b3a'); box(x, cx - 15, 474 - h * 0.4, 9, h * 0.35, '#1f6b3a'); box(x, cx + 15, 474 - h * 0.5, 9, h * 0.3, '#1f6b3a'); box(x, cx - 9, 474 - h * 0.4, 12, 8, '#1f6b3a'); box(x, cx + 9, 474 - h * 0.5, 12, 8, '#1f6b3a'); });
      } },
      { top: '#fffaf0', bot: '#ffffff', paint(x, r) { // Finale
        for (let gy = 0; gy < 8; gy++) for (let gx = 0; gx < 8; gx++) {
          const cx = gx * 64 + 32, cy = gy * 64 + 32, k = (gx + gy * 3) % 4;
          if (k === 0) star(x, cx, cy, 9, '#e6b83c');
          else if (k === 1) { circ(x, cx, cy, 15, ['#ffd6e8', '#cfeaff', '#fff1b8', '#e3d6ff'][(gx + gy) % 4]); circ(x, cx, cy, 5, '#e6b83c'); }
          else if (k === 2) { x.strokeStyle = '#e6b83c'; x.lineWidth = 3; x.strokeRect(cx - 14, cy - 14, 28, 28); }
          else tri(x, cx, cy + 14, 30, 28, 'rgba(230,184,60,0.45)');
        }
      } }
    ];
    return DEFS.map((d, i) => {
      const c = cvs(512, 512), x = c.getContext('2d'), g = x.createLinearGradient(0, 0, 0, 512);
      g.addColorStop(0, d.top); g.addColorStop(1, d.bot); x.fillStyle = g; x.fillRect(0, 0, 512, 512);
      d.paint(x, seeded(i * 977 + 13));
      return c;
    });
  }

  /* ------------------------------------------------------------------ scenes */
  function populate(K) {
    const { T, PI, FLOOR, WY, ROOMS, inner, Bld, M, sNear, put, dollAt, portal, light, signMesh, anim } = K;
    const TAU = PI * 2;
    const GOLD = 0xf5c542, WHITE = 0xffffff, GRN = 0x2f9e44, GRN2 = 0x7bd389, DKG = 0x1d6b3a;

    function scene(room, s, side, off, build, rot) {
      const g = put(new T.Group(), s, side, off, 0, rot), b = Bld();
      build(b, g);
      g.add(M(b, room));
      return g;
    }
    function world(room, x, z, ry, build, dy) {
      const g = new T.Group(); g.position.set(x, FLOOR + (dy || 0), z); g.rotation.y = ry || 0; inner.add(g);
      const b = Bld(); build(b, g); g.add(M(b, room));
      return g;
    }
    function sub(g, room, build, x, y, z) {
      const b = Bld(); build(b);
      const m = M(b, room); m.position.set(x || 0, y || 0, z || 0); g.add(m);
      return m;
    }
    const gl = (g, x, y, z, hex, size, sp) => {
      const c = Math.cos(g.rotation.y), s = Math.sin(g.rotation.y);
      light(g.position.x + x * c + z * s, g.position.y + y, g.position.z - x * s + z * c, hex, size, sp);
    };
    const dl = (room, g, x, z, o, an, ry, sc, y) => dollAt(room, g, x, y || 0, z, ry || 0, sc ? Object.assign({}, o, { sc }) : o, an);
    const leaf = (b, col, x, y, z, ry, rz, len, w) => b.add(new T.SphereGeometry(0.5, 8, 5), col, x, y, z, 0, ry, rz, w || 0.5, len, 0.14);

    function quad(b, o, ox, oz, dir) {
      const d = dir || 1, c = o.c, r = o.r, len = o.len, leg = o.leg, by = leg + r * 0.8, hr = o.head || r * 0.6;
      b.sph(c, r, ox, by, oz, len / (2 * r), 0.9, 0.85);
      for (const a of [-1, 1]) for (const k of [-1, 1]) b.cyl(o.legC || c, r * 0.24, r * 0.2, leg, ox + a * len * 0.32, leg / 2, oz + k * r * 0.45);
      const na = o.neckA === undefined ? 0.5 : o.neckA, nl = o.neck || r, nx = ox + d * len * 0.4, ny = by + r * 0.3;
      b.cyl(c, r * 0.3, r * 0.4, nl, nx + d * Math.sin(na) * nl / 2, ny + Math.cos(na) * nl / 2, oz, 0, 0, -d * na);
      const hx = nx + d * (Math.sin(na) * nl + hr * 0.5), hy = ny + Math.cos(na) * nl;
      b.sph(o.headC || c, hr, hx, hy, oz, 1.3, 0.9, 0.9);
      b.sph(0x1c1c1c, hr * 0.15, hx + d * hr * 0.55, hy + hr * 0.25, oz + hr * 0.78);
      b.cyl(o.tailC || c, r * 0.07, r * 0.05, r * 1.1, ox - d * (len * 0.5 + 0.06), by - r * 0.2, oz, 0, 0, -d * 0.5);
      return { hx, hy, hr, by };
    }
    function palm(b, x, z, h, lean) {
      const l = lean || 0.18;
      b.cyl(0x9c6b3a, 0.1, 0.16, h, x + Math.sin(l) * h / 2, h / 2, z, 0, 0, -l);
      const tx = x + Math.sin(l) * h;
      for (let i = 0; i < 7; i++) { const a = i / 7 * TAU; leaf(b, i % 2 ? GRN : GRN2, tx + Math.cos(a) * 0.62, h - 0.22, z + Math.sin(a) * 0.62, -a, -(PI / 2 + 0.38), 1.7, 0.42); }
      for (let i = 0; i < 3; i++) b.sph(0x7a4a21, 0.11, tx + Math.cos(i * 2.1) * 0.14, h - 0.12, z + Math.sin(i * 2.1) * 0.14);
    }
    function cactus(b, x, z, h) {
      b.cyl(GRN, 0.17, 0.19, h, x, h / 2, z).sph(GRN, 0.17, x, h, z);
      b.cyl(GRN, 0.1, 0.1, 0.36, x - 0.3, h * 0.5, z, 0, 0, PI / 2).cyl(GRN, 0.1, 0.1, h * 0.36, x - 0.46, h * 0.5 + h * 0.18, z).sph(0xff5d8f, 0.08, x - 0.46, h * 0.5 + h * 0.38, z);
      b.cyl(GRN, 0.1, 0.1, 0.36, x + 0.3, h * 0.62, z, 0, 0, PI / 2).cyl(GRN, 0.1, 0.1, h * 0.26, x + 0.46, h * 0.62 + h * 0.13, z).sph(0xff5d8f, 0.08, x, h + 0.16, z);
    }
    function jungle(b, x, z, n, h) {
      for (let i = 0; i < n; i++) leaf(b, [DKG, GRN, GRN2][i % 3], x + (i - n / 2) * 0.34, h * (0.45 + (i % 3) * 0.12), z - (i % 2) * 0.15, 0, (i - n / 2) * 0.16, h * (1.5 + (i % 3) * 0.35), 0.5);
    }

    const D = {
      eskimo: { skin: 1, hair: 0x1c1c1c, hat: 'fur', hatC: 0xffffff, top: 0x5bb8e8, bot: 0xf2f2f2 },
      skater: { skin: 0, hair: 0xf2c94c, hat: 'bow', hatC: 0xff5d8f, top: 0xff8fb8, bot: 0xffffff, skirt: 1 },
      nordic: { skin: 0, hair: 0xf2c94c, hat: 'bonnet', top: 0xd62828, bot: 0x1d3557, skirt: 1 },
      guard: { skin: 0, hair: 0x7a4a21, hat: 'bearskin', top: 0xd62828, bot: 0x1c1c1c },
      dutch: { skin: 0, hair: 0xf2c94c, hat: 'bonnet', top: 0x3b82c4, bot: 0x3b82c4, skirt: 1, shoe: 0xe9c46a },
      cancan: { skin: 0, hair: 0x7a4a21, hat: 'flower', top: 0xe63946, bot: 0xff5d8f, skirt: 1 },
      gondolier: { skin: 4, hair: 0x1c1c1c, hat: 'cowboy', hatC: 0xf2e3a0, top: 0xffffff, bot: 0x1c1c1c, trim: 0xd62828 },
      flamenco: { skin: 4, hair: 0x1c1c1c, hat: 'flower', top: 0xd62828, bot: 0xd62828, skirt: 1, trim: 0x1c1c1c },
      matador: { skin: 4, hair: 0x1c1c1c, hat: 'beret', hatC: 0x1c1c1c, top: 0xf5c542, bot: 0xc0272d },
      yodel: { skin: 0, hair: 0xf2c94c, hat: 'beret', hatC: 0x2d6a4f, top: 0xffffff, bot: 0x2d6a4f },
      cossack: { skin: 0, hair: 0x7a4a21, hat: 'fur', hatC: 0x3a2a22, top: 0xd62828, bot: 0x1c1c1c },
      indian: { skin: 2, hair: 0x1c1c1c, hat: 'crown', top: 0xff5d8f, bot: 0xf5c542, skirt: 1 },
      charmer: { skin: 2, hair: 0x1c1c1c, hat: 'turban', hatC: 0x7b2cbf, top: 0xf4a261, bot: 0xffffff },
      chinese: { skin: 1, hair: 0x1c1c1c, hat: 'cone', hatC: 0xe9c46a, top: 0xd62828, bot: 0x1d3557 },
      kimono: { skin: 1, hair: 0x1c1c1c, hat: 'buns', top: 0xff8fb8, bot: 0xc77dff, skirt: 1 },
      thai: { skin: 1, hair: 0x1c1c1c, hat: 'spire', top: 0xf5c542, bot: 0x2f9e44, skirt: 1 },
      african: { skin: 3, hair: 0x1c1c1c, hat: 'flower', top: 0xffb703, bot: 0xfb8500, skirt: 1 },
      drummer: { skin: 3, hair: 0x1c1c1c, top: 0xe63946, bot: 0xffb703 },
      cleo: { skin: 2, hair: 0x1c1c1c, hat: 'crown', top: 0xffffff, bot: 0xffffff, skirt: 1, trim: 0xf5c542 },
      mariachi: { skin: 2, hair: 0x1c1c1c, hat: 'sombrero', hatC: 0xf2b84b, top: 0x1c1c1c, bot: 0x1c1c1c, trim: 0xd62828 },
      carnival: { skin: 2, hair: 0x1c1c1c, hat: 'flower', top: 0xffd43b, bot: 0x2f9e44, skirt: 1, trim: 0xff5d8f },
      hula: { skin: 2, hair: 0x1c1c1c, hat: 'flower', top: 0xff5d8f, bot: 0x7bd389, skirt: 1, trim: 0xffd43b },
      surfer: { skin: 2, hair: 0xf2c94c, top: 0xff922b, bot: 0x3b82c4 },
      native: { skin: 2, hair: 0x1c1c1c, hat: 'feather', top: 0xd9a066, bot: 0xd9a066, trim: 0x3bb0c9 },
      cowboy: { skin: 0, hair: 0x7a4a21, hat: 'cowboy', hatC: 0x8a5a2b, top: 0xd62828, bot: 0x2f5d9e },
      cowgirl: { skin: 0, hair: 0xf2c94c, hat: 'cowboy', hatC: 0xffffff, top: 0xffffff, bot: 0x2f5d9e, skirt: 1, trim: 0xd62828 },
      farm: { skin: 0, hair: 0xd9480f, hat: 'cowboy', hatC: 0xf2e3a0, top: 0x3b82c4, bot: 0x2f5d9e }
    };
    const S = sNear;

    /* ---------------- portals */
    portal(S(308.5, 83.9), 0, 0xdff3ff, 0x8fd3ff, ['HELLO · 你好 · BONJOUR', 'HOLA · こんにちは · CIAO · ALOHA · JAMBO']);
    portal(S(321, 75), 1, ROOMS[1].accent, GOLD); portal(S(321, 58.5), 2, ROOMS[2].accent, GOLD);
    portal(S(311, 62.6), 3, ROOMS[3].accent, GOLD); portal(S(301, 56.5), 4, ROOMS[4].accent, GOLD);
    portal(S(291, 58), 5, ROOMS[5].accent, GOLD); portal(S(291, 68), 6, ROOMS[6].accent, GOLD);
    portal(S(294.5, 79.5), 7, WHITE, GOLD);
    portal(S(303.5, 83.9), 7, WHITE, GOLD, ['GOODBYE · 再见 · AU REVOIR', 'ADIÓS · さようなら · CIAO · ALOHA · KWAHERI']);

    /* ---------------- 0 · Hello / Arctic & Scandinavia */
    scene(0, S(313.2, 79.5), 1, 3.3, (b, g) => {
      b.cyl(0xdff6ff, 1.45, 1.55, 0.14, 0, 0.07, 0.2, 0, 0, 0, 20);
      b.cone(WHITE, 0.9, 2.8, -1.3, 1.4, -1.1, 0, 0, 0, 5).cone(0xbfe9ff, 0.7, 2.0, 0.1, 1.0, -1.3, 0, 0, 0, 5).cone(WHITE, 0.85, 3.4, 1.4, 1.7, -1.0, 0, 0, 0, 5);
      const rink = new T.Group(); rink.position.set(0, 0.14, 0.2); g.add(rink);
      for (let i = 0; i < 3; i++) dl(0, rink, Math.cos(i * 2.094) * 0.85, Math.sin(i * 2.094) * 0.85, D.skater, 'spin', i * 2.094, 0.8);
      anim((t) => { rink.rotation.y = t * 0.7; });
      for (let i = 0; i < 9; i++) gl(g, -1.8 + i * 0.45, 3.4 + Math.sin(i * 0.8) * 0.5, -1.3, [0x5dffb0, 0xff8fd0, 0x8fd3ff][i % 3], 0.3, 1.2);
    });
    scene(0, S(313.6, 79.5), -1, 3.3, (b, g) => {
      b.dome(WHITE, 1.2, -0.6, 0, -0.4).box(0x1d3557, 0.5, 0.6, 0.3, -0.6, 0.3, 0.7).box(WHITE, 0.7, 0.75, 0.4, -0.6, 0.37, 0.6);
      quad(b, { c: 0xfdfdfd, r: 0.42, len: 1.3, leg: 0.42, neck: 0.3, neckA: 1.0, head: 0.26 }, 1.2, -0.3, -1);
      dl(0, g, -1.5, 1.0, D.eskimo, 'wave'); dl(0, g, 0.3, 1.1, D.eskimo, 'sway', 0, 0.85); dl(0, g, 1.3, 1.0, D.nordic, 'sway');
    });
    scene(0, S(317.6, 79.5), -1, 3.2, (b, g) => {
      b.cyl(0xbfe9ff, 1.1, 1.2, 0.2, 0, 0.1, 0, 0, 0, 0, 14);
      for (const sx of [-0.5, 0.5]) {
        const seal = sub(g, 0, (q) => { q.sph(0x6b7280, 0.3, 0, 0.3, 0, 0.9, 0.85, 1.5).sph(0x6b7280, 0.2, 0, 0.62, 0.38).sph(0x1c1c1c, 0.035, 0.08, 0.68, 0.55).sph(0x1c1c1c, 0.035, -0.08, 0.68, 0.55); }, sx, 0.2, 0);
        const ball = sub(g, 0, (q) => { q.sph(sx < 0 ? 0xe63946 : 0xffd43b, 0.17, 0, 0, 0); }, sx, 1.25, 0.42);
        anim((t) => { seal.rotation.x = Math.sin(t * 2 + sx * 3) * 0.14; ball.position.y = 1.25 + Math.abs(Math.sin(t * 2.4 + sx * 3)) * 0.5; ball.rotation.z = t * 3; });
      }
    });
    scene(0, S(317.4, 79.5), 1, 3.0, (b, g) => {
      b.box(0xd62828, 1.5, 1.1, 1.0, 0, 0.55, -0.6).cone(0x3a2a22, 1.2, 0.8, 0, 1.5, -0.6, 0, PI / 4, 0, 4).box(0xfff3b0, 0.3, 0.4, 0.05, 0, 0.6, -0.08);
      b.cone(DKG, 0.5, 1.6, 1.3, 0.8, -0.7).cone(DKG, 0.45, 1.3, -1.3, 0.65, -0.8);
      dl(0, g, -0.7, 0.8, D.nordic, 'wave'); dl(0, g, 0.7, 0.8, D.dutch, 'sway');
    });
    scene(0, S(321, 76.6), -1, 2.9, (b, g) => { b.cone(WHITE, 0.7, 2.2, 0, 1.1, -0.8, 0, 0, 0, 5); dl(0, g, -0.5, 0.3, D.eskimo, 'bob'); dl(0, g, 0.5, 0.3, D.skater, 'wave'); });

    /* ---------------- 1 · Europe */
    scene(1, S(321, 72.4), -1, 3.4, (b, g) => { // Big Ben + guards
      b.box(0xd9b98a, 1.1, 5.2, 1.1, 0, 2.6, -0.7).box(0xc9a36e, 1.3, 0.3, 1.3, 0, 4.2, -0.7).cone(0x5b4636, 0.9, 1.5, 0, 5.95, -0.7, 0, PI / 4, 0, 4);
      b.cyl(WHITE, 0.4, 0.4, 0.06, 0, 4.7, -0.13, PI / 2, 0, 0, 16).box(0x1c1c1c, 0.04, 0.3, 0.03, 0, 4.8, -0.09).box(0x1c1c1c, 0.22, 0.04, 0.03, 0.09, 4.7, -0.09);
      dl(1, g, -0.9, 0.8, D.guard, 'march'); dl(1, g, 0.9, 0.8, D.guard, 'march');
      gl(g, 0, 4.7, 0.1, 0xfff3b0, 0.5, 0.6);
    });
    scene(1, S(321, 72), 1, 3.4, (b, g) => { // Dutch windmill
      b.cyl(WHITE, 0.6, 0.95, 2.6, 0, 1.3, -0.6, 0, 0, 0, 8).cone(0xb8402f, 0.75, 0.8, 0, 3.0, -0.6, 0, 0, 0, 8).box(0x7a4a21, 0.4, 0.7, 0.05, 0, 0.35, 0.3);
      for (let i = 0; i < 7; i++) b.cyl(GRN, 0.02, 0.02, 0.4, -1.5 + i * 0.5, 0.2, 0.7).sph([0xe63946, 0xffd43b, 0xff8fb8][i % 3], 0.1, -1.5 + i * 0.5, 0.45, 0.7, 1, 1.3, 1);
      const sails = sub(g, 1, (q) => { for (let i = 0; i < 4; i++) q.box(0xfff3d6, 0.36, 1.7, 0.05, Math.sin(i * PI / 2) * 0.95, Math.cos(i * PI / 2) * 0.95, 0, 0, 0, -i * PI / 2).box(0x7a4a21, 0.06, 1.9, 0.07, Math.sin(i * PI / 2) * 0.9, Math.cos(i * PI / 2) * 0.9, 0.02, 0, 0, -i * PI / 2); }, 0, 2.5, 0.25);
      anim((t) => { sails.rotation.z = t * 0.9; });
      dl(1, g, -1.0, 1.0, D.dutch, 'sway'); dl(1, g, 1.0, 1.0, D.dutch, 'wave');
    });
    scene(1, S(321, 67), -1, 3.4, (b, g) => { // Eiffel + can-can
      b.cone(GOLD, 1.25, 2.0, 0, 1.0, -0.7, 0, PI / 4, 0, 4).box(0xfff3b0, 1.2, 0.12, 1.2, 0, 1.6, -0.7).cone(GOLD, 0.7, 2.2, 0, 2.7, -0.7, 0, PI / 4, 0, 4)
        .box(0xfff3b0, 0.6, 0.1, 0.6, 0, 3.3, -0.7).cone(GOLD, 0.3, 2.6, 0, 4.6, -0.7, 0, PI / 4, 0, 4);
      for (let i = 0; i < 12; i++) { const f = i / 11; gl(g, (1 - f) * 0.85, 0.2 + f * 5.6, -0.3, 0xfff3b0, 0.16); gl(g, -(1 - f) * 0.85, 0.2 + f * 5.6, -0.3, 0xfff3b0, 0.16); }
      for (let i = 0; i < 3; i++) dl(1, g, -0.9 + i * 0.9, 0.9, D.cancan, 'kick');
    });
    scene(1, S(321, 66.6), 1, 3.4, (b, g) => { // Pisa + gondola
      for (let k = 0; k < 5; k++) b.cyl(k % 2 ? 0xf0e6d2 : WHITE, 0.5, 0.5, 0.62, -1.0 + k * 0.1, 0.31 + k * 0.62, -0.8, 0, 0, -0.16, 12);
      b.cyl(0xd9c8a0, 0.36, 0.36, 0.4, -0.45, 3.3, -0.8, 0, 0, -0.16, 12);
      b.cyl(0x1877c9, 1.25, 1.25, 0.08, 0.7, 0.04, 0.3, 0, 0, 0, 18);
      const gon = new T.Group(); gon.position.set(0.7, 0.1, 0.3); g.add(gon);
      sub(gon, 1, (q) => { q.sph(0x1c1c1c, 0.3, 0, 0.16, 0, 3.4, 0.6, 0.9).cone(0x1c1c1c, 0.1, 0.5, 1.05, 0.5, 0, 0, 0, -0.5).cone(GOLD, 0.08, 0.4, -1.05, 0.48, 0, 0, 0, 0.5).cyl(0x9c6b3a, 0.025, 0.025, 2.0, -0.35, 1.0, 0.25, 0.2, 0, 0.25); });
      dl(1, gon, -0.3, 0, D.gondolier, 'sway', 0, 0.8, 0.2);
      anim((t) => { gon.rotation.z = Math.sin(t * 1.3) * 0.09; gon.position.y = 0.1 + Math.sin(t * 1.9) * 0.03; });
    });
    scene(1, S(321, 61.6), -1, 3.2, (b, g) => { // Spain
      b.box(0xfff1c2, 2.4, 1.9, 0.5, 0, 0.95, -1.0).box(0xc0447a, 2.6, 0.2, 0.7, 0, 1.95, -1.0);
      for (const sx of [-0.7, 0.7]) b.box(0x5b3fa8, 0.5, 0.9, 0.06, sx, 0.9, -0.72).cyl(0x5b3fa8, 0.25, 0.25, 0.06, sx, 1.35, -0.72, PI / 2);
      const bull = sub(g, 1, (q) => { const h = quad(q, { c: 0x2a1a14, r: 0.34, len: 1.1, leg: 0.34, neck: 0.2, neckA: 1.3, head: 0.24 }, 0, 0, 1); q.cone(WHITE, 0.04, 0.22, h.hx, h.hy + 0.22, 0.12, 0.5).cone(WHITE, 0.04, 0.22, h.hx, h.hy + 0.22, -0.12, -0.5); }, -1.0, 0, 0.5);
      anim((t) => { bull.position.x = -1.0 + Math.sin(t * 1.2) * 0.25; });
      dl(1, g, 0.4, 0.7, D.matador, 'wave'); dl(1, g, 1.3, 0.8, D.flamenco, 'spin');
    });
    scene(1, S(321, 61.4), 1, 3.3, (b, g) => { // Alps chalet
      b.cone(WHITE, 1.3, 3.4, -1.1, 1.7, -1.0, 0, 0, 0, 6).cone(0xcfe4f7, 1.0, 2.6, 0.9, 1.3, -1.2, 0, 0, 0, 6);
      b.box(0x9c6b3a, 1.3, 0.9, 0.9, 0.3, 0.45, -0.3).box(0x7a4a21, 1.6, 0.12, 1.1, 0.3, 1.1, -0.3, 0, 0, 0.5).box(0x7a4a21, 1.6, 0.12, 1.1, 0.3, 1.1, -0.3, 0, 0, -0.5);
      quad(b, { c: WHITE, r: 0.22, len: 0.7, leg: 0.3, neck: 0.22, neckA: 0.5, head: 0.14 }, -1.2, 0.7, 1);
      dl(1, g, 1.2, 0.9, D.yodel, 'bob'); dl(1, g, 0.2, 1.0, D.nordic, 'sway', 0, 0.85);
    });
    { // Hot-air balloons over the Europe channel
      const bl = [];
      for (let i = 0; i < 3; i++) {
        const g = new T.Group(); g.position.set(321 + (i - 1) * 1.6, FLOOR + 5.4, 69.5 - i * 4.2); inner.add(g);
        sub(g, 1, (q) => { for (let k = 0; k < 6; k++) q.add(new T.SphereGeometry(0.75, 6, 8, k * TAU / 6, TAU / 6), [[0xe63946, WHITE], [0x3b82c4, 0xffd43b], [0x7b2cbf, 0xff8fb8]][i][k % 2], 0, 0.9, 0, 0, 0, 0, 1, 1.15, 1); q.box(0x9c6b3a, 0.36, 0.3, 0.36, 0, -0.35, 0); for (const sx of [-0.16, 0.16]) q.cyl(0x7a4a21, 0.012, 0.012, 0.6, sx, 0.05, 0.16).cyl(0x7a4a21, 0.012, 0.012, 0.6, sx, 0.05, -0.16); });
        dl(1, g, 0, 0, D[['nordic', 'yodel', 'cancan'][i]], 'wave', 0, 0.45, -0.38);
        bl.push(g);
      }
      anim((t) => { bl.forEach((g, i) => { g.position.y = FLOOR + 5.4 + Math.sin(t * 0.8 + i * 2) * 0.45; g.rotation.y = Math.sin(t * 0.3 + i) * 0.6; }); });
    }

    /* ---------------- 2 · Asia */
    scene(2, S(321, 55.9), -1, 3.4, (b, g) => { // onion-dome palace + cossacks
      b.box(0xfff1c2, 2.6, 1.6, 0.8, 0, 0.8, -0.9);
      [[-0.9, 1.4, 0xe63946], [0, 2.1, 0x3b82c4], [0.9, 1.4, 0x2f9e44]].forEach(([x, h, c]) => { b.cyl(WHITE, 0.3, 0.3, h, x, 1.6 + h / 2, -0.9).sph(c, 0.44, x, 1.9 + h, -0.9, 1, 1.2, 1).cone(GOLD, 0.14, 0.6, x, 2.6 + h, -0.9); });
      dl(2, g, -0.7, 0.8, D.cossack, 'kick'); dl(2, g, 0.7, 0.8, D.cossack, 'kick');
    });
    scene(2, S(317.4, 53), -1, 3.4, (b, g) => { // Taj Mahal
      b.box(WHITE, 3.0, 0.3, 1.5, 0, 0.15, -0.7).box(WHITE, 1.7, 1.3, 1.0, 0, 0.95, -0.7).sph(WHITE, 0.62, 0, 2.0, -0.7, 1, 1.25, 1).cone(GOLD, 0.07, 0.6, 0, 3.0, -0.7)
        .box(0x1d3557, 0.5, 0.8, 0.05, 0, 0.75, -0.18);
      for (const sx of [-1.3, 1.3]) b.cyl(WHITE, 0.1, 0.12, 2.2, sx, 1.4, -0.2).sph(WHITE, 0.16, sx, 2.6, -0.2, 1, 1.2, 1);
      dl(2, g, -0.8, 0.9, D.indian, 'hula'); dl(2, g, 0.1, 1.0, D.indian, 'hula'); dl(2, g, 1.0, 0.9, D.indian, 'hula');
      for (let i = 0; i < 6; i++) gl(g, -1.5 + i * 0.6, 3.3, -0.4, 0xff8fd0, 0.22);
    });
    scene(2, S(315.6, 53), 1, 3.0, (b, g) => { // snake charmer + peacock
      b.cyl(0xc98a58, 0.26, 0.2, 0.36, 0.6, 0.18, 0.2, 0, 0, 0, 10);
      quad(b, { c: 0x1877c9, r: 0.2, len: 0.5, leg: 0.28, neck: 0.4, neckA: 0.2, head: 0.1 }, -1.2, 0, 1);
      for (let i = 0; i < 9; i++) { const a = (i - 4) * 0.2; leaf(b, i % 2 ? 0x2f9e44 : 0x35d6cf, -1.45 + Math.sin(a) * 0.55, 0.85 + Math.cos(a) * 0.55, -0.12, 0, -a, 1.3, 0.3); }
      const snake = sub(g, 2, (q) => { q.cyl(0x2f9e44, 0.05, 0.07, 0.7, 0, 0.35, 0).sph(0x2f9e44, 0.1, 0, 0.75, 0.04, 1.2, 0.7, 1.5); }, 0.6, 0.3, 0.2);
      anim((t) => { snake.rotation.z = Math.sin(t * 2.2) * 0.4; snake.rotation.x = Math.cos(t * 1.7) * 0.2; });
      dl(2, g, -0.1, 0.4, D.charmer, 'drum');
    });
    { // Flying carpets
      const piv = new T.Group(); piv.position.set(318.4, FLOOR + 5.0, 55.6); inner.add(piv);
      for (let i = 0; i < 2; i++) {
        const c = new T.Group(); c.position.set(i ? -1.9 : 1.9, i * 0.6, 0); piv.add(c);
        sub(c, 2, (q) => { q.box(i ? 0x7b2cbf : 0xe63946, 0.9, 0.05, 1.4, 0, 0, 0).box(GOLD, 0.96, 0.04, 0.12, 0, 0, 0.7).box(GOLD, 0.96, 0.04, 0.12, 0, 0, -0.7).box(GOLD, 0.5, 0.06, 0.5, 0, 0, 0, 0, PI / 4); });
        dl(2, c, 0, 0, D.charmer, 'wave', i ? PI : 0, 0.6, -0.2);
        anim((t) => { c.rotation.z = Math.sin(t * 1.4 + i * 2) * 0.16; c.position.y = i * 0.6 + Math.sin(t * 1.1 + i) * 0.25; });
      }
      anim((t) => { piv.rotation.y = t * 0.45; });
    }
    scene(2, S(311, 57.6), -1, 3.4, (b, g) => { // pagoda + lion dance
      for (let k = 0; k < 4; k++) { const w = 1.7 - k * 0.3; b.box(0xd62828, w * 0.7, 0.7, w * 0.7, 0, 0.35 + k * 1.0, -0.8).cone(k % 2 ? 0x2f9e44 : GOLD, w * 0.85, 0.36, 0, 0.9 + k * 1.0, -0.8, 0, PI / 4, 0, 4); }
      b.cone(GOLD, 0.1, 0.7, 0, 4.5, -0.8);
      dl(2, g, -1.0, 0.8, D.chinese, 'sway'); dl(2, g, 1.0, 0.8, D.chinese, 'drum');
      for (let k = 0; k < 4; k++) { gl(g, -0.9 + k * 0.2, 0.95 + k * 1.0, -0.2, 0xff3b3b, 0.2); gl(g, 0.9 - k * 0.2, 0.95 + k * 1.0, -0.2, 0xff3b3b, 0.2); }
    });
    scene(2, S(311, 60.4), 1, 3.3, (b, g) => { // torii + cherry tree + kimono dolls
      for (const sx of [-0.9, 0.9]) b.cyl(0xd62828, 0.1, 0.12, 2.6, sx, 1.3, -0.6);
      b.box(0xd62828, 2.6, 0.18, 0.24, 0, 2.7, -0.6).box(0x1c1c1c, 2.9, 0.1, 0.3, 0, 2.86, -0.6).box(0xd62828, 2.1, 0.12, 0.16, 0, 2.2, -0.6);
      b.cyl(0x5b4636, 0.08, 0.13, 1.7, 1.5, 0.85, -1.0, 0, 0, -0.15);
      for (let i = 0; i < 8; i++) b.sph(i % 2 ? 0xffc2dc : 0xff8fb8, 0.42, 1.7 + Math.cos(i * 0.8) * 0.55, 2.0 + Math.sin(i * 1.3) * 0.35, -1.0 + Math.sin(i * 0.8) * 0.35);
      [-0.6, 0.5].forEach((x, i) => {
        const d = dl(2, g, x, 0.8, D.kimono, 'sway');
        const par = sub(d, 2, (q) => { q.cone(i ? 0xffd43b : 0xe63946, 0.5, 0.2, 0, 0.5, 0, 0, 0, 0, 10).cyl(0x7a4a21, 0.015, 0.015, 0.6, 0, 0.2, 0); }, 0.28, 1.15, 0);
        anim((t) => { par.rotation.y = t * 2.2; });
      });
    });
    scene(2, S(311, 57.2), 1, 3.3, (b, g) => { // Thai temple
      for (let k = 0; k < 3; k++) b.box(k % 2 ? 0xe63946 : GOLD, 1.8 - k * 0.5, 0.5, 1.0 - k * 0.2, 0, 0.25 + k * 0.5, -0.8);
      b.cone(GOLD, 0.4, 2.2, 0, 2.6, -0.8, 0, 0, 0, 8);
      for (let i = 0; i < 3; i++) dl(2, g, -0.9 + i * 0.9, 0.8, D.thai, 'hula', 0, 0.9);
    });
    { // Chinese dragon winding overhead
      const segs = [];
      for (let i = 0; i < 13; i++) {
        const head = i === 12, g = new T.Group(); inner.add(g);
        sub(g, 2, (q) => {
          if (head) q.sph(0xe63946, 0.5, 0, 0, 0.1, 1, 0.85, 1.25).sph(WHITE, 0.12, 0.22, 0.2, 0.5).sph(WHITE, 0.12, -0.22, 0.2, 0.5).sph(0x1c1c1c, 0.06, 0.22, 0.2, 0.6).sph(0x1c1c1c, 0.06, -0.22, 0.2, 0.6)
            .cone(GOLD, 0.08, 0.5, 0.22, 0.55, -0.1).cone(GOLD, 0.08, 0.5, -0.22, 0.55, -0.1).box(GOLD, 0.7, 0.08, 0.3, 0, -0.3, 0.5);
          else q.sph(i % 2 ? 0xe63946 : 0xffd43b, 0.36 - (12 - i) * 0.012, 0, 0, 0, 1, 0.85, 1.3).cone(GOLD, 0.1, 0.3, 0, 0.36, 0);
        });
        segs.push(g);
      }
      anim((t) => { for (let i = 0; i < 13; i++) { const a = t * 1.5 + i * 0.55; segs[i].position.set(311 + Math.sin(a) * 1.3, FLOOR + 5.3 + Math.cos(a * 1.3) * 0.45, 55.6 + i * 0.5); segs[i].rotation.y = Math.cos(a) * 0.6; } });
    }

    /* ---------------- 3 · Africa */
    scene(3, S(307.6, 66), 1, 3.4, (b, g) => { // giraffes
      jungle(b, 0, -1.2, 9, 2.6);
      [[-0.9, 0.95, 1], [0.9, 0.75, -1]].forEach(([x, sc, d], i) => {
        const gi = sub(g, 3, (q) => {
          const h = quad(q, { c: 0xf2b84b, r: 0.4, len: 1.25, leg: 1.2, neck: 1.7, neckA: 0.3, head: 0.24, tailC: 0x7a4a21 }, 0, 0, d);
          for (let k = 0; k < 9; k++) q.sph(0x9c5a1e, 0.1, -0.45 + (k % 5) * 0.22, 1.35 + (k % 3) * 0.18, 0.3, 1, 1, 0.3);
          q.cyl(0x7a4a21, 0.025, 0.025, 0.2, h.hx - d * 0.05, h.hy + 0.25, 0.07).cyl(0x7a4a21, 0.025, 0.025, 0.2, h.hx - d * 0.05, h.hy + 0.25, -0.07);
        }, x, 0, -0.3 + i * 0.3);
        gi.scale.setScalar(sc);
        anim((t) => { gi.rotation.z = Math.sin(t * 1.3 + i * 2) * 0.06 * d; });
      });
    });
    scene(3, S(304.8, 66), 1, 3.0, (b, g) => { // drummers
      jungle(b, 0, -1.4, 7, 2.2);
      for (const sx of [-0.8, 0.8]) { b.cyl(0x9c5a1e, 0.24, 0.18, 0.6, sx, 0.3, 0.75, 0, 0, 0, 10).cyl(0xf2e3a0, 0.25, 0.25, 0.04, sx, 0.62, 0.75, 0, 0, 0, 10); dl(3, g, sx, 0.25, D.drummer, 'drum'); }
      dl(3, g, 0, -0.3, D.african, 'hula');
    });
    world(3, 298.4, 68.6, PI * 0.75, (b, g) => { // elephant in the corner
      palm(b, -1.4, -0.6, 3.2, 0.2);
      const h = quad(b, { c: 0x8d99ae, r: 0.75, len: 1.9, leg: 0.8, neck: 0.3, neckA: 1.2, head: 0.6 }, 0, 0, 1);
      b.sph(0x9aa5b8, 0.55, h.hx - 0.25, h.hy + 0.1, 0.55, 0.9, 1, 0.2).sph(0x9aa5b8, 0.55, h.hx - 0.25, h.hy + 0.1, -0.55, 0.9, 1, 0.2)
        .cone(WHITE, 0.06, 0.5, h.hx + 0.5, h.hy - 0.35, 0.25, 0, 0, -1.9).cone(WHITE, 0.06, 0.5, h.hx + 0.5, h.hy - 0.35, -0.25, 0, 0, -1.9);
      const trunk = sub(g, 3, (q) => { q.cyl(0x8d99ae, 0.17, 0.1, 1.3, 0, -0.65, 0).sph(0x8d99ae, 0.1, 0, -1.3, 0); }, h.hx + 0.6, h.hy, 0);
      anim((t) => { trunk.rotation.z = 0.5 + Math.sin(t * 1.5) * 0.55; });
      dl(3, g, -0.2, 0, D.african, 'wave', 0, 0.7, h.by + 0.55);
    });
    scene(3, S(301, 61.4), 1, 3.3, (b, g) => { // hippo pond + zebra
      b.cyl(0x1877c9, 1.0, 1.0, 0.08, -0.8, 0.04, 0.3, 0, 0, 0, 16);
      const z = quad(b, { c: WHITE, r: 0.34, len: 1.1, leg: 0.5, neck: 0.5, neckA: 0.7, head: 0.2, tailC: 0x1c1c1c }, 1.0, -0.4, -1);
      for (let k = 0; k < 6; k++) b.box(0x1c1c1c, 0.06, 0.5, 0.6, 0.6 + k * 0.16, z.by, -0.4);
      jungle(b, 0, -1.3, 8, 2.4);
      const hip = sub(g, 3, (q) => { q.sph(0x9b8aa6, 0.5, 0, 0, 0, 1.4, 0.7, 1).sph(0x9b8aa6, 0.3, 0.6, 0.12, 0, 1.3, 0.8, 1).sph(0x1c1c1c, 0.04, 0.65, 0.34, 0.16).sph(0x9b8aa6, 0.07, 0.4, 0.42, 0.15).sph(0x9b8aa6, 0.07, 0.4, 0.42, -0.15); }, -0.9, 0.15, 0.3);
      anim((t) => { hip.position.y = 0.12 + Math.sin(t * 1.1) * 0.12; });
    });
    scene(3, S(301, 58.8), 1, 3.0, (b, g) => {
      palm(b, -1.3, -0.9, 3.0, -0.15); palm(b, 1.3, -1.0, 2.6, 0.2);
      for (let i = 0; i < 3; i++) dl(3, g, -0.8 + i * 0.8, 0.5, D.african, 'hula');
    });
    scene(3, S(301, 60.2), -1, 3.3, (b, g) => { // lion on a rock
      b.sph(0x8a7a66, 0.9, 0, 0.3, -0.5, 1.4, 0.7, 1);
      const l = quad(b, { c: 0xe0a84a, r: 0.34, len: 1.0, leg: 0.36, neck: 0.2, neckA: 1.1, head: 0.24 }, 0, -0.5, 1);
      b.sph(0x9c5a1e, 0.36, l.hx - 0.14, l.hy, -0.5, 0.7, 1, 1);
      for (let k = 0; k < 9; k++) b.box(0xe0a84a, 0.2, 0.04, 0.04, -1.4, 0.2 + k * 0.01, 0);
      jungle(b, 1.5, -1.0, 5, 2.4);
      dl(3, g, -1.3, 0.8, D.african, 'wave', 0, 0.85);
    });
    scene(3, S(301, 57.6), -1, 3.4, (b, g) => { // pyramid + Cleopatra
      b.cone(0xe9c46a, 1.5, 2.2, 0, 1.1, -0.9, 0, PI / 4, 0, 4).cone(0xd9a94a, 0.8, 1.2, 1.4, 0.6, -1.2, 0, PI / 4, 0, 4);
      quad(b, { c: 0xc98a58, r: 0.3, len: 1.0, leg: 0.6, neck: 0.6, neckA: 0.5, head: 0.18 }, -1.3, 0.2, 1);
      b.sph(0xc98a58, 0.2, -1.3, 1.15, 0.2);
      dl(3, g, 0.2, 0.8, D.cleo, 'wave');
    });
    { // Monkeys swinging over the channel
      [[301, 59.6], [301, 62.4]].forEach(([x, z], i) => {
        const piv = new T.Group(); piv.position.set(x, FLOOR + 6.4, z); inner.add(piv);
        sub(piv, 3, (q) => { q.cyl(0x7a4a21, 0.03, 0.03, 2.8, 0, -1.4, 0).sph(0x8a5633, 0.24, 0, -3.05, 0, 1, 1.25, 1).sph(0x8a5633, 0.2, 0, -2.66, 0).sph(0xeebd8e, 0.12, 0, -2.68, 0.14).sph(0x1c1c1c, 0.03, 0.06, -2.62, 0.24).sph(0x1c1c1c, 0.03, -0.06, -2.62, 0.24).cyl(0x8a5633, 0.035, 0.035, 0.5, 0.12, -2.6, 0, 0, 0, -0.3).cyl(0x8a5633, 0.03, 0.03, 0.6, -0.2, -3.4, 0, 0, 0, 0.7); });
        anim((t) => { piv.rotation.z = Math.sin(t * 1.6 + i * 2.2) * 0.55; });
      });
    }

    /* ---------------- 4 · Latin America */
    scene(4, S(296.4, 53), -1, 3.7, (b, g) => { // sun + mariachi
      const sun = sub(g, 4, (q) => { for (let i = 0; i < 12; i++) q.box(i % 2 ? GOLD : 0xff922b, 0.2, 0.9, 0.06, Math.sin(i * PI / 6) * 1.35, Math.cos(i * PI / 6) * 1.35, 0, 0, 0, -i * PI / 6); }, 0, 4.4, -0.9);
      b.cyl(0xffd43b, 0.95, 0.95, 0.12, 0, 4.4, -0.85, PI / 2, 0, 0, 24).sph(0x7a4a21, 0.08, -0.3, 4.6, -0.75).sph(0x7a4a21, 0.08, 0.3, 4.6, -0.75).box(0xc2410c, 0.5, 0.07, 0.04, 0, 4.1, -0.76)
        .sph(0xff8fa3, 0.14, -0.55, 4.25, -0.76, 1, 1, 0.3).sph(0xff8fa3, 0.14, 0.55, 4.25, -0.76, 1, 1, 0.3);
      anim((t) => { sun.rotation.z = t * 0.5; });
      b.box(0xffe8c2, 2.6, 1.5, 0.4, 0, 0.75, -1.0).box(0xc2410c, 2.8, 0.16, 0.55, 0, 1.55, -1.0).box(0x7a4a21, 0.5, 0.9, 0.05, 0, 0.45, -0.78);
      for (let i = 0; i < 3; i++) dl(4, g, -1.0 + i * 1.0, 0.4, D.mariachi, i === 1 ? 'drum' : 'sway');
      for (let i = 0; i < 12; i++) gl(g, Math.sin(i * PI / 6) * 1.9, 4.4 + Math.cos(i * PI / 6) * 1.9, -0.7, 0xffd43b, 0.24);
    });
    scene(4, S(294.2, 53), -1, 3.3, (b, g) => { // llama + cacti
      cactus(b, -1.1, -0.8, 1.8); cactus(b, 1.3, -0.9, 1.3);
      const l = quad(b, { c: 0xfff3d6, r: 0.3, len: 0.9, leg: 0.6, neck: 0.75, neckA: 0.15, head: 0.17 }, 0.1, -0.2, 1);
      b.box(0xe63946, 0.5, 0.06, 0.56, 0.1, l.by + 0.27, -0.2).box(0x0ea5e9, 0.2, 0.07, 0.58, 0.1, l.by + 0.27, -0.2);
      dl(4, g, -0.6, 0.7, D.mariachi, 'wave', 0, 0.8);
    });
    scene(4, S(296.2, 53), 1, 3.0, (b, g) => { // carnival dancers
      b.box(0x7b2cbf, 3.2, 0.2, 1.2, 0, 0.1, -0.2);
      for (let i = 0; i < 4; i++) dl(4, g, -1.2 + i * 0.8, -0.2, D.carnival, i % 2 ? 'spin' : 'hula', 0, 1, 0.2);
      for (let i = 0; i < 8; i++) b.cyl([0xe63946, 0xffd43b, 0x2f9e44, 0x0ea5e9][i % 4], 0.03, 0.03, 2.6, -1.5 + i * 0.43, 1.5, -1.0);
    });
    { // Piñata over the channel + circling toucans
      const pin = new T.Group(); pin.position.set(296.4, FLOOR + 6.2, 53); inner.add(pin);
      sub(pin, 4, (q) => { q.cyl(0x7a4a21, 0.02, 0.02, 2.2, 0, -1.1, 0); });
      sub(pin, 4, (q) => { const h = quad(q, { c: 0xff5d8f, r: 0.26, len: 0.8, leg: 0.34, neck: 0.36, neckA: 0.5, head: 0.16, legC: 0x0ea5e9, tailC: 0xffd43b }, 0, 0, 1); q.box(0xffd43b, 0.5, 0.06, 0.46, 0, h.by + 0.2, 0); }, 0, -3.0, 0);
      anim((t) => { pin.rotation.x = Math.sin(t * 1.4) * 0.35; });
      const tp = new T.Group(); tp.position.set(292.6, FLOOR + 5.6, 52.8); inner.add(tp);
      for (let i = 0; i < 3; i++) sub(tp, 4, (q) => { q.sph(0x1c1c1c, 0.18, 0, 0, 0, 1, 0.9, 1.6).sph(WHITE, 0.12, 0, 0.02, 0.2).cone(0xff922b, 0.08, 0.42, 0, 0.02, 0.5, PI / 2).box(0x1c1c1c, 1.0, 0.03, 0.26, 0, 0.06, -0.02); }, Math.cos(i * 2.094) * 1.5, i * 0.3, Math.sin(i * 2.094) * 1.5).rotation.y = -i * 2.094;
      anim((t) => { tp.rotation.y = -t * 0.7; tp.children.forEach((c, i) => { c.rotation.z = Math.sin(t * 6 + i) * 0.25; }); });
    }

    /* ---------------- 5 · South Seas */
    scene(5, S(291, 60.2), -1, 3.2, (b, g) => { // hula + tiki
      palm(b, -1.4, -1.0, 3.4, 0.22); palm(b, 1.5, -0.9, 2.8, -0.2);
      b.cyl(0x7a4a21, 0.3, 0.34, 1.5, 0.2, 0.75, -1.1, 0, 0, 0, 8).box(0xf2e3a0, 0.34, 0.1, 0.05, 0.2, 0.6, -0.78).sph(WHITE, 0.08, 0.08, 1.05, -0.8).sph(WHITE, 0.08, 0.32, 1.05, -0.8);
      for (let i = 0; i < 3; i++) dl(5, g, -0.9 + i * 0.9, 0.6, D.hula, 'hula');
      gl(g, 0.2, 1.7, -1.0, 0xff922b, 0.4, 7);
    });
    scene(5, S(291, 64.4), -1, 3.4, (b, g) => { // volcano + rainbow
      b.cyl(0x5b4636, 0.4, 1.5, 2.4, 0, 1.2, -0.8, 0, 0, 0, 10).cyl(0xff5d2b, 0.42, 0.42, 0.08, 0, 2.42, -0.8, 0, 0, 0, 10);
      [0xe63946, 0xff922b, 0xffd43b, 0x2f9e44, 0x3b82c4, 0x7b2cbf].forEach((c, i) => b.add(new T.TorusGeometry(2.0 - i * 0.13, 0.065, 5, 22, PI), c, 0, 0.3, -1.35));
      for (let i = 0; i < 5; i++) gl(g, (i - 2) * 0.12, 2.6 + i * 0.3, -0.8, 0xff7a2b, 0.34, 5 + i);
      dl(5, g, -1.2, 0.8, D.hula, 'wave'); dl(5, g, 1.2, 0.8, D.surfer, 'bob');
    });
    scene(5, S(291, 61.2), 1, 3.2, (b, g) => { // mermaid rock + surfer
      b.sph(0x6b7280, 0.7, -0.9, 0.3, -0.4, 1.2, 0.8, 1).sph(0x35d6cf, 0.22, -0.9, 0.95, -0.4, 1, 0.9, 1).cone(0x2f9e44, 0.2, 0.9, -0.5, 0.75, -0.2, 0, 0, -1.9).box(0x2f9e44, 0.06, 0.4, 0.4, -0.05, 0.62, -0.2)
        .sph(0xf8d9b8, 0.2, -1.1, 1.35, -0.4).sph(0xe63946, 0.23, -1.12, 1.4, -0.48, 1, 1, 0.9).cyl(0xf8d9b8, 0.11, 0.14, 0.4, -1.02, 1.1, -0.4, 0, 0, 0.3);
      const surf = new T.Group(); surf.position.set(0.9, 0, 0.1); g.add(surf);
      sub(surf, 5, (q) => { q.sph(0x1e9bd6, 0.8, 0, 0.2, -0.3, 1.5, 0.9, 0.7).sph(WHITE, 0.3, 0.5, 0.85, -0.3, 1.6, 0.5, 0.8).sph(WHITE, 0.2, -0.3, 0.8, -0.3, 1.6, 0.5, 0.8).sph(0xffd43b, 0.5, 0, 0.92, 0.1, 1.5, 0.08, 0.45); });
      dl(5, surf, 0, 0.1, D.surfer, 'sway', 0, 0.8, 0.95);
      anim((t) => { surf.rotation.z = Math.sin(t * 1.8) * 0.16; surf.position.y = Math.sin(t * 2.3) * 0.08; });
    });
    scene(5, S(291, 65.6), 1, 3.2, (b, g) => { // kangaroo + koala tree
      const k = quad(b, { c: 0xc98a58, r: 0.34, len: 0.7, leg: 0.5, neck: 0.55, neckA: 0.2, head: 0.18 }, -0.8, 0, 1);
      b.cone(0xc98a58, 0.14, 0.9, -1.45, 0.45, 0, 0, 0, 1.2).sph(0xc98a58, 0.14, -0.55, k.by - 0.05, 0.28).cone(0xc98a58, 0.05, 0.22, k.hx - 0.1, k.hy + 0.22, 0.08).cone(0xc98a58, 0.05, 0.22, k.hx - 0.1, k.hy + 0.22, -0.08);
      b.cyl(0x9c8a72, 0.12, 0.16, 2.6, 0.9, 1.3, -0.7);
      for (let i = 0; i < 6; i++) b.sph(i % 2 ? 0x5fa878 : 0x7bbf8f, 0.5, 0.9 + Math.cos(i) * 0.5, 2.6 + Math.sin(i * 1.7) * 0.3, -0.7 + Math.sin(i) * 0.4);
      b.sph(0x9aa5b8, 0.2, 1.05, 1.6, -0.55).sph(0x9aa5b8, 0.15, 1.05, 1.86, -0.5).sph(0x9aa5b8, 0.08, 0.92, 1.96, -0.5).sph(0x9aa5b8, 0.08, 1.18, 1.96, -0.5).sph(0x1c1c1c, 0.04, 1.05, 1.84, -0.36);
      dl(5, g, 0.1, 0.7, D.surfer, 'wave', 0, 0.85);
    });
    { // Fish leaping across the channel
      const fish = [];
      for (let i = 0; i < 4; i++) { const g = new T.Group(); inner.add(g); sub(g, 5, (q) => { q.sph([0xff922b, 0xffd43b, 0xff5d8f, 0x35d6cf][i], 0.2, 0, 0, 0, 1.6, 1, 0.5).cone([0xff922b, 0xffd43b, 0xff5d8f, 0x35d6cf][i], 0.16, 0.26, -0.4, 0, 0, 0, 0, -PI / 2, 4).sph(0x1c1c1c, 0.03, 0.2, 0.05, 0.09); }); fish.push(g); }
      anim((t) => { fish.forEach((g, i) => { const p = (t * 0.45 + i * 0.27) % 1, d = i % 2 ? -1 : 1; g.position.set(291 + d * (p - 0.5) * 3.0, WY - 0.25 + Math.sin(p * PI) * 1.7, 61.2 + i * 1.3); g.rotation.y = d > 0 ? 0 : PI; g.rotation.z = (0.5 - p) * 2.2; }); });
    }

    /* ---------------- 6 · North America */
    scene(6, S(291, 70.2), -1, 3.3, (b, g) => { // tepee + campfire
      b.cone(0xf2e3c2, 1.1, 2.4, -0.6, 1.2, -0.7, 0, 0, 0, 8).cone(0x7a4a21, 0.36, 0.9, -0.6, 0.45, 0.1, 0, 0, 0, 3);
      for (let i = 0; i < 8; i++) b.cone(0xd62828, 0.14, 0.24, -0.6 + Math.cos(i * 0.785) * 0.74, 0.9, -0.7 + Math.sin(i * 0.785) * 0.74);
      for (let i = 0; i < 3; i++) b.cyl(0x7a4a21, 0.02, 0.02, 0.7, -0.6 + (i - 1) * 0.1, 2.6, -0.7, 0, 0, (i - 1) * 0.3);
      for (let i = 0; i < 4; i++) b.cyl(0x5b4636, 0.05, 0.05, 0.5, 1.0, 0.08, 0.3, PI / 2, i * 0.8, 0);
      const fire = sub(g, 6, (q) => { q.cone(0xff922b, 0.18, 0.5, 0, 0.25, 0).cone(0xffd43b, 0.1, 0.34, 0.03, 0.2, 0.05); }, 1.0, 0.1, 0.3);
      anim((t) => { fire.scale.y = 1 + Math.sin(t * 9) * 0.25; fire.rotation.y = t * 3; });
      gl(g, 1.0, 0.5, 0.3, 0xff7a2b, 0.5, 9); gl(g, 1.0, 0.8, 0.3, 0xffd43b, 0.3, 11);
      dl(6, g, 0.3, 0.8, D.native, 'sway'); dl(6, g, 1.7, 0.7, D.native, 'drum', 0, 0.85);
    });
    scene(6, S(291, 70.6), 1, 3.3, (b, g) => { // cowboy + horse
      cactus(b, 1.6, -0.9, 1.9);
      const h = quad(b, { c: 0x9c5a1e, r: 0.36, len: 1.2, leg: 0.6, neck: 0.6, neckA: 0.6, head: 0.2, tailC: 0x3a2a22 }, -0.9, -0.5, 1);
      b.box(0x3a2a22, 0.4, 0.08, 0.5, -0.9, h.by + 0.32, -0.5);
      b.box(0x9c6b3a, 2.4, 0.07, 0.07, 0.3, 0.7, -1.2).box(0x9c6b3a, 2.4, 0.07, 0.07, 0.3, 0.4, -1.2);
      const cb = dl(6, g, 0.3, 0.7, D.cowboy, 'wave');
      const lasso = sub(cb, 6, (q) => { q.add(new T.TorusGeometry(0.45, 0.02, 4, 16), 0xf2e3a0, 0, 0, 0, PI / 2); }, -0.3, 2.0, 0);
      anim((t) => { lasso.rotation.y = t * 5; lasso.rotation.z = 0.25; });
      dl(6, g, 1.1, 0.8, D.cowgirl, 'sway');
    });
    scene(6, S(291, 74.4), -1, 3.3, (b, g) => { // farm
      b.box(0xc0272d, 1.8, 1.5, 0.8, -0.7, 0.75, -1.0).box(WHITE, 0.5, 0.9, 0.05, -0.7, 0.45, -0.58).cone(0x7a4a21, 1.3, 0.8, -0.7, 1.9, -1.0, 0, PI / 4, 0, 4);
      b.cyl(0xf2d16b, 0.5, 0.6, 0.7, 1.2, 0.35, -0.6, 0, 0, 0, 10).sph(0xf2d16b, 0.5, 1.2, 0.7, -0.6, 1, 0.5, 1);
      for (let i = 0; i < 5; i++) b.cyl(GRN, 0.03, 0.03, 1.3, -1.6 + i * 0.3, 0.65, 0.2).sph(0xffd43b, 0.07, -1.6 + i * 0.3, 1.0, 0.24, 1, 1.8, 1);
      dl(6, g, 0.2, 0.8, D.farm, 'wave'); dl(6, g, 1.2, 0.3, D.farm, 'bob', 0, 0.8, 0.9);
    });
    scene(6, S(291, 73.4), 1, 3.3, (b, g) => { // covered wagon
      b.box(0x9c6b3a, 1.8, 0.4, 0.9, 0, 0.75, -0.5);
      for (let i = 0; i < 5; i++) b.add(new T.TorusGeometry(0.5, 0.2, 5, 10, PI), 0xfff3d6, -0.72 + i * 0.36, 0.9, -0.5, 0, PI / 2, 0);
      for (const sx of [-0.6, 0.6]) b.add(new T.TorusGeometry(0.34, 0.05, 5, 14), 0x5b4636, sx, 0.4, 0).box(0x5b4636, 0.6, 0.04, 0.04, sx, 0.4, 0).box(0x5b4636, 0.04, 0.6, 0.04, sx, 0.4, 0);
      dl(6, g, -1.5, 0.6, D.cowgirl, 'wave', 0, 0.85); dl(6, g, 1.5, 0.6, D.farm, 'sway', 0, 0.85);
    });

    /* ---------------- Mr. Lincoln */
    const LX = 291, LZ = 82.7, STAGE = 0.35;
    const stage = world(6, LX, LZ, PI, (b) => {
      b.box(0x7a1420, 5.0, STAGE, 2.3, 0, STAGE / 2, -0.1).box(0xe2b23a, 5.1, 0.07, 2.4, 0, STAGE, -0.1);
      b.box(0x16224f, 5.0, 4.8, 0.12, 0, 2.7, -1.3);
      for (const sd of [-1, 1]) {
        for (let i = 0; i < 5; i++) b.cyl(i % 2 ? 0x8f1626 : 0xb91c2c, 0.16, 0.2, 4.4, sd * (1.55 + i * 0.2), 2.55, -1.12 + (i % 2) * 0.06);
        b.cyl(WHITE, 0.16, 0.18, 3.9, sd * 2.42, 2.3, 0.8).box(WHITE, 0.5, 0.14, 0.5, sd * 2.42, 4.3, 0.8).box(WHITE, 0.5, 0.14, 0.5, sd * 2.42, 0.42, 0.8);
        b.cyl(0xe2b23a, 0.03, 0.03, 3.2, sd * 1.25, 1.95, -0.9).sph(0xe2b23a, 0.08, sd * 1.25, 3.6, -0.9);
      }
      for (let i = 0; i < 10; i++) b.sph(0xb91c2c, 0.32, -2.25 + i * 0.5, 4.75, -1.0, 1, 1.2, 0.5);
      b.box(0xe2b23a, 5.0, 0.1, 0.2, 0, 5.1, -1.0);
      b.cyl(0xe2b23a, 0.62, 0.62, 0.06, 0, 3.75, -1.2, PI / 2, 0, 0, 20).cyl(0x1d3a8a, 0.5, 0.5, 0.07, 0, 3.75, -1.19, PI / 2, 0, 0, 20)
        .box(0xe2b23a, 0.44, 0.15, 0.05, -0.22, 3.86, -1.13, 0, 0, -0.5).box(0xe2b23a, 0.44, 0.15, 0.05, 0.22, 3.86, -1.13, 0, 0, 0.5)
        .sph(0xe2b23a, 0.13, 0, 3.72, -1.12, 1, 1.5, 0.4).sph(0xe2b23a, 0.08, 0, 3.98, -1.12).cone(0xe2b23a, 0.14, 0.2, 0, 3.47, -1.12, PI, 0, 0, 3);
      for (let i = 0; i < 7; i++) b.box(i % 2 ? 0xf8fafc : 0xb91c2c, 0.95, 0.075, 0.03, -1.25 + 0.5, 3.45 - i * 0.075, -0.9);
      b.box(0x1e3a8a, 0.42, 0.3, 0.035, -1.25 + 0.235, 3.34, -0.9);
      b.box(0x1e3a8a, 0.95, 0.52, 0.03, 1.25 - 0.5, 3.2, -0.9).cyl(0xe2b23a, 0.16, 0.16, 0.04, 1.25 - 0.5, 3.2, -0.88, PI / 2, 0, 0, 12);
      b.box(0x7a1420, 0.72, 0.12, 0.62, 0, STAGE + 0.49, -0.55).box(0x7a1420, 0.72, 1.0, 0.1, 0, STAGE + 1.0, -0.88).box(0xe2b23a, 0.8, 0.08, 0.12, 0, STAGE + 1.52, -0.88);
      for (const sx of [-0.32, 0.32]) for (const sz of [-0.82, -0.28]) b.cyl(0xe2b23a, 0.04, 0.04, 0.45, sx, STAGE + 0.22, sz);
    });
    {
      const sign = signMesh(['GREAT MOMENTS WITH MR. LINCOLN', '与林肯先生共度伟大时刻'], 4.4, 0.85, '#16224f', '#f5d776', '#e2b23a');
      sign.position.set(0, 5.75, -0.85); stage.add(sign);
      for (let i = 0; i < 9; i++) gl(stage, -2.0 + i * 0.5, STAGE + 0.1, 1.0, 0xfff0c2, 0.3, 0.8);
      for (let i = 0; i < 11; i++) gl(stage, -2.5 + i * 0.5, 5.25, -0.85, i % 2 ? 0xfff0c2 : 0xff6b6b, 0.2);
      const SKIN = 0xd9b08c, BLK = 0x16161a, HAIR = 0x2a211c;
      const man = new T.Group(); man.position.set(0, STAGE, 0.05); man.scale.setScalar(1.15); stage.add(man);
      const hip = new T.Group(); man.add(hip);
      const torso = new T.Group(); hip.add(torso);
      sub(torso, 6, (q) => {
        q.box(BLK, 0.6, 0.78, 0.32, 0, 0.39, 0).box(BLK, 0.66, 0.1, 0.34, 0, 0.75, 0).box(BLK, 0.58, 0.42, 0.08, 0, -0.16, -0.13)
          .box(0xf5f5f0, 0.2, 0.3, 0.02, 0, 0.6, 0.165).box(BLK, 0.12, 0.06, 0.03, 0, 0.73, 0.17).box(0x2a2a30, 0.24, 0.44, 0.02, 0, 0.23, 0.165);
      });
      const head = new T.Group(); head.position.set(0, 0.84, 0); torso.add(head);
      sub(head, 6, (q) => {
        q.cyl(SKIN, 0.07, 0.08, 0.1, 0, 0.02, 0).sph(SKIN, 0.19, 0, 0.26, 0, 0.9, 1.15, 0.95)
          .add(new T.SphereGeometry(0.2, 10, 6, 0, TAU, 0, PI * 0.5), HAIR, 0, 0.3, -0.02, -0.25, 0, 0, 0.92, 1, 1);
        q.sph(HAIR, 0.17, 0, 0.12, 0.03, 0.95, 0.62, 0.9).box(HAIR, 0.05, 0.22, 0.16, 0.16, 0.22, 0).box(HAIR, 0.05, 0.22, 0.16, -0.16, 0.22, 0)
          .box(SKIN, 0.05, 0.1, 0.07, 0, 0.26, 0.19).sph(0x1c1c1c, 0.022, 0.07, 0.32, 0.165).sph(0x1c1c1c, 0.022, -0.07, 0.32, 0.165)
          .box(HAIR, 0.09, 0.022, 0.03, 0.07, 0.365, 0.165).box(HAIR, 0.09, 0.022, 0.03, -0.07, 0.365, 0.165).sph(SKIN, 0.05, 0.18, 0.27, 0, 0.4, 1, 0.7).sph(SKIN, 0.05, -0.18, 0.27, 0, 0.4, 1, 0.7);
      });
      const jaw = sub(head, 6, (q) => { q.box(0x5a2a22, 0.07, 0.018, 0.02, 0, 0, 0); }, 0, 0.19, 0.178);
      const arms = [-1, 1].map((sd) => {
        const a = new T.Group(); a.position.set(sd * 0.37, 0.72, 0); torso.add(a);
        sub(a, 6, (q) => { q.cyl(BLK, 0.075, 0.065, 0.36, 0, -0.18, 0).sph(BLK, 0.07, 0, -0.36, 0); });
        const f = new T.Group(); f.position.set(0, -0.36, 0); a.add(f);
        sub(f, 6, (q) => { q.cyl(BLK, 0.065, 0.055, 0.3, 0, -0.15, 0).box(0xf5f5f0, 0.12, 0.03, 0.12, 0, -0.3, 0).sph(SKIN, 0.065, 0, -0.36, 0); });
        return { a, f, sd };
      });
      const legs = [-1, 1].map((sd) => {
        const th = new T.Group(); th.position.set(sd * 0.15, 0, 0); hip.add(th);
        sub(th, 6, (q) => { q.cyl(BLK, 0.105, 0.09, 0.5, 0, -0.25, 0); });
        const sh = new T.Group(); sh.position.set(0, -0.5, 0); th.add(sh);
        sub(sh, 6, (q) => { q.cyl(BLK, 0.09, 0.075, 0.55, 0, -0.275, 0).box(0x0c0c0e, 0.14, 0.09, 0.3, 0, -0.555, 0.06); });
        return { th, sh };
      });
      const beamMat = new T.MeshBasicMaterial({ color: 0xfff2c8, transparent: true, opacity: 0.1, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide });
      const beamGeo = new T.ConeGeometry(1.15, 5.0, 18, 1, true); beamGeo.translate(0, -2.5, 0);
      const beam = new T.Mesh(beamGeo, beamMat); beam.position.set(0, 5.6, 0.1); stage.add(beam);
      anim((t) => {
        const st = K.state, r = st.rise, e = r * r * (3 - 2 * r), sit = 1 - e, sp = st.speak ? 1 : 0;
        hip.position.set(0, 0.6 + e * 0.5, -0.5 + e * 0.5);
        torso.rotation.x = Math.sin(r * PI) * 0.42 + sp * Math.sin(t * 0.9) * 0.03;
        torso.rotation.y = sp * Math.sin(t * 0.55) * 0.14 * e;
        legs.forEach((l) => { l.th.rotation.x = -sit * PI / 2; l.sh.rotation.x = sit * PI / 2; });
        const talk = sp * e;
        head.rotation.y = talk * Math.sin(t * 0.8) * 0.3; head.rotation.x = talk * Math.sin(t * 2.3) * 0.05 + sit * 0.08;
        jaw.position.y = 0.19 - talk * Math.abs(Math.sin(t * 9.5) * Math.sin(t * 3.1)) * 0.022; jaw.scale.y = 1 + talk * Math.abs(Math.sin(t * 9.5)) * 1.6;
        const R = arms[0], Lf = arms[1];
        R.a.rotation.x = -0.72 * sit + talk * (-0.55 + Math.sin(t * 1.5) * 0.3); R.a.rotation.z = talk * -0.18;
        R.f.rotation.x = -0.25 * sit + talk * (-0.8 + Math.sin(t * 2.1 + 1) * 0.35);
        Lf.a.rotation.x = -0.72 * sit + talk * -0.15; Lf.a.rotation.z = 0;
        Lf.f.rotation.x = -0.25 * sit + talk * -1.5;
        beamMat.opacity = 0.05 + e * 0.13 + Math.sin(t * 2) * 0.01;
      });
    }

    /* ---------------- 7 · Finale */
    const HATS = ['bonnet', 'sombrero', 'cone', 'flower', 'bearskin', 'turban', 'feather', 'beret', 'crown', 'cowboy', 'spire', 'fez', 'bow', 'buns'];
    const fin = (i) => ({ skin: i % 5, hair: [0x1c1c1c, 0xf2c94c, 0x7a4a21, 0xd9480f][i % 4], hat: HATS[i % HATS.length], hatC: i % 3 ? GOLD : WHITE, top: WHITE, bot: i % 4 === 1 ? 0xfff1c2 : WHITE, skirt: i % 2, trim: GOLD, shoe: GOLD });
    const ANIMS = ['sway', 'wave', 'hula', 'bob', 'sway', 'march'];
    const fg = world(7, 301, 72.9, 0, (b, g) => {
      b.box(WHITE, 9.6, 0.4, 3.5, 0, -0.2, 0).box(0xfff6d8, 9.6, 0.35, 1.1, 0, 0.175, -0.25).box(WHITE, 9.6, 0.7, 1.0, 0, 0.35, -1.25).box(GOLD, 9.6, 0.06, 0.08, 0, 0.36, 0.3).box(GOLD, 9.6, 0.06, 0.08, 0, 0.71, -0.75);
      let n = 0;
      for (let i = 0; i < 6; i++) dl(7, g, -1.4 + i * 0.95, 2.7, fin(n), ANIMS[n++ % 6], 0, 0.95);
      for (let i = 0; i < 8; i++) dl(7, g, -4.1 + i * 0.85, -0.2, fin(n), ANIMS[n++ % 6], 0, 0.95, 0.35);
      for (let i = 0; i < 7; i++) dl(7, g, -4.2 + i * 0.85, -1.2, fin(n), ANIMS[n++ % 6], 0, 0.95, 0.7);
      // carousel
      b.cyl(WHITE, 1.05, 1.1, 0.16, -3.4, 0.08, 1.5, 0, 0, 0, 18).cyl(GOLD, 0.07, 0.07, 2.4, -3.4, 1.2, 1.5);
      const car = new T.Group(); car.position.set(-3.4, 0.16, 1.5); g.add(car);
      sub(car, 7, (q) => { for (let k = 0; k < 12; k++) q.add(new T.ConeGeometry(1.2, 0.6, 12, 1, false, k * TAU / 12, TAU / 12), k % 2 ? GOLD : WHITE, 0, 2.4, 0); for (let k = 0; k < 12; k++) q.sph(k % 2 ? WHITE : GOLD, 0.09, Math.cos(k * TAU / 12) * 1.18, 2.1, Math.sin(k * TAU / 12) * 1.18); for (let k = 0; k < 4; k++) q.cyl(GOLD, 0.025, 0.025, 2.1, Math.cos(k * PI / 2) * 0.75, 1.05, Math.sin(k * PI / 2) * 0.75); });
      const riders = [];
      for (let k = 0; k < 4; k++) riders.push(dl(7, car, Math.cos(k * PI / 2) * 0.75, Math.sin(k * PI / 2) * 0.75, fin(k + 3), 'wave', -k * PI / 2, 0.6, 0.3));
      anim((t) => { car.rotation.y = t * 0.8; riders.forEach((r, k) => { r.position.y = 0.35 + Math.sin(t * 2.4 + k * PI / 2) * 0.22; }); });
      // ferris wheel
      for (const sx of [-0.5, 0.5]) b.cyl(GOLD, 0.05, 0.05, 3.3, 3.4 + sx, 2.3, -1.5, 0, 0, -sx * 0.6);
      const wheel = new T.Group(); wheel.position.set(3.4, 3.75, -1.3); g.add(wheel);
      sub(wheel, 7, (q) => { q.add(new T.TorusGeometry(1.6, 0.05, 5, 28), GOLD, 0, 0, 0).add(new T.TorusGeometry(1.1, 0.03, 5, 24), WHITE, 0, 0, 0); for (let k = 0; k < 8; k++) q.box(k % 2 ? WHITE : GOLD, 0.05, 3.2, 0.05, 0, 0, 0, 0, 0, k * PI / 8); q.cyl(GOLD, 0.2, 0.2, 0.2, 0, 0, 0, PI / 2); });
      const pods = [];
      for (let k = 0; k < 8; k++) pods.push(sub(wheel, 7, (q) => { q.box([0xffd6e8, 0xcfeaff, 0xfff1b8, 0xe3d6ff][k % 4], 0.4, 0.26, 0.3, 0, -0.3, 0).cone(GOLD, 0.3, 0.2, 0, 0.05, 0, 0, PI / 4, 0, 4).cyl(GOLD, 0.015, 0.015, 0.3, 0, -0.08, 0); }, Math.cos(k * PI / 4) * 1.6, Math.sin(k * PI / 4) * 1.6, 0.12));
      anim((t) => { wheel.rotation.z = t * 0.45; pods.forEach((p) => { p.rotation.z = -wheel.rotation.z; }); });
      for (let k = 0; k < 16; k++) gl(g, 3.4 + Math.cos(k * PI / 8) * 1.6, 3.75 + Math.sin(k * PI / 8) * 1.6, -1.1, k % 2 ? 0xffffff : 0xffe28a, 0.2);
      // smiling sun + balloon
      b.cyl(GOLD, 0.9, 0.9, 0.1, -0.6, 5.6, -1.6, PI / 2, 0, 0, 24).sph(0x7a4a21, 0.07, -0.88, 5.8, -1.5).sph(0x7a4a21, 0.07, -0.32, 5.8, -1.5).box(0xc2410c, 0.44, 0.06, 0.04, -0.6, 5.36, -1.52);
      const rays = sub(g, 7, (q) => { for (let i = 0; i < 16; i++) q.box(i % 2 ? GOLD : WHITE, 0.14, 0.7, 0.05, Math.sin(i * PI / 8) * 1.3, Math.cos(i * PI / 8) * 1.3, 0, 0, 0, -i * PI / 8); }, -0.6, 5.6, -1.62);
      const bal = new T.Group(); bal.position.set(-2.4, 5.4, -0.4); g.add(bal);
      sub(bal, 7, (q) => { for (let k = 0; k < 8; k++) q.add(new T.SphereGeometry(0.8, 6, 8, k * TAU / 8, TAU / 8), [0xffd6e8, WHITE, 0xcfeaff, GOLD][k % 4], 0, 0.95, 0, 0, 0, 0, 1, 1.15, 1); q.box(GOLD, 0.36, 0.3, 0.36, 0, -0.35, 0).cyl(GOLD, 0.012, 0.012, 0.6, 0.16, 0.05, 0.16).cyl(GOLD, 0.012, 0.012, 0.6, -0.16, 0.05, -0.16); });
      dl(7, bal, 0, 0, fin(9), 'wave', 0, 0.45, -0.38);
      anim((t) => { rays.rotation.z = -t * 0.4; bal.position.y = 5.4 + Math.sin(t * 0.9) * 0.4; bal.rotation.y = t * 0.3; });
      const r = seeded(77);
      for (let i = 0; i < 70; i++) gl(g, -4.6 + r() * 9.2, 1.6 + r() * 6.4, -1.7 + r() * 0.2, [0xffffff, 0xffe28a, 0xffd6e8, 0xcfeaff][i % 4], 0.14 + r() * 0.14);
    });
    world(7, 298.5, 82.7, PI, (b, g) => {
      b.box(WHITE, 5.0, 0.3, 1.2, 0, 0.15, -0.5).box(GOLD, 5.0, 0.05, 0.08, 0, 0.31, 0.1);
      for (let i = 0; i < 5; i++) {
        dl(7, g, -1.9 + i * 0.95, 0.5, fin(i + 21), ANIMS[(i + 2) % 6], 0, 0.95);
        b.cyl(GOLD, 0.03, 0.03, 2.4, -1.9 + i * 0.95, 1.5, -0.7);
        const pw = sub(g, 7, (q) => { for (let k = 0; k < 4; k++) q.box([0xffd6e8, 0xcfeaff, 0xfff1b8, WHITE][k], 0.5, 0.2, 0.03, Math.cos(k * PI / 2) * 0.25, Math.sin(k * PI / 2) * 0.25, 0, 0, 0, k * PI / 2 + 0.4); q.sph(GOLD, 0.06, 0, 0, 0.03); }, -1.9 + i * 0.95, 2.7, -0.66);
        anim((t) => { pw.rotation.z = t * (2 + i * 0.4) * (i % 2 ? 1 : -1); });
        gl(g, -1.9 + i * 0.95, 3.3, -0.66, 0xffe28a, 0.24);
      }
    });
    { // sweeping light beams
      const geo = new T.ConeGeometry(1.5, 8.2, 16, 1, true); geo.translate(0, -4.1, 0);
      [[297.6, 77.2, 0xfff1b8], [300.8, 76.2, 0xffd6e8], [303.8, 77.4, 0xcfeaff], [299.4, 81.2, 0xffffff]].forEach(([x, z, c], i) => {
        const m = new T.Mesh(geo, new T.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.075, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide }));
        m.position.set(x, FLOOR + 8.5, z); inner.add(m);
        anim((t) => { m.rotation.x = Math.sin(t * 0.7 + i * 1.6) * 0.4; m.rotation.z = Math.cos(t * 0.5 + i * 2.1) * 0.4; });
      });
    }
    void fg;

    return { x: LX, y: FLOOR + STAGE + 2.05, z: LZ };
  }

  root.TPSmallWorldScenes = { backdrops, populate };
})(window);
