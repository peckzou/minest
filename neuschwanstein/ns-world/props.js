/* Neuschwanstein — mesh details the 1 m voxels cannot carry, read from world.props, plus the far landscape.
 *   chandeliers: the Byzantine crown of the Throne Hall (gilded, two tiers, 96 candles), rings in the Singers' Hall, small ones in the rooms
 *   murals: painted panels in gilded frames (stylised, painted in code: saints / apostles / Parzival / Grail / Tristan / Lohengrin /
 *     Tannhaeuser / minstrels / forest). They are NOT copies of the real paintings, which are by several painters (see README).
 *   the apse of the Throne Hall: a gold-mosaic half-cylinder with a figure in majesty and kings, a starry half dome
 *   the mosaic floor of the Throne Hall (one big painted plane), candelabra, the palm-tree capital of the stair column, a swan
 *   far away: the Alps (Tegelberg / Saeuling side) as a low-poly ring with snow, the Forggensee to the north.
 * All candles of all chandeliers are 2 InstancedMeshes (wax + flame); every chandelier is merged into one mesh per material.
 * Exposes NSProps = { build(world, THREE, scene, opts) -> { update(dt, time, cam, night), stats() } }. */
(function (root) {
  'use strict';
  function rng(seed) { let a = seed | 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  function build(world, T, scene, opts) {
    opts = opts || {};
    const group = new T.Group(); group.name = 'ns-props'; scene.add(group);
    const P = world.props, made = { meshes: 0, textures: 0 };
    const gold = new T.MeshPhongMaterial({ color: 0xd9ad48, specular: 0xfff0b0, shininess: 70, emissive: 0x3a2a08 });
    const goldD = new T.MeshPhongMaterial({ color: 0xa8802c, specular: 0xffe0a0, shininess: 50, emissive: 0x241804 });
    const wax = new T.MeshLambertMaterial({ color: 0xf6efdc, emissive: 0x2a2416 });
    const flameM = new T.MeshBasicMaterial({ color: 0xffd47a });
    const crystal = new T.MeshPhongMaterial({ color: 0xcfe2ff, specular: 0xffffff, shininess: 120, transparent: true, opacity: 0.75, emissive: 0x223044 });

    /* ---------------- merge helper: many small parts -> one geometry per material ---------------- */
    function Merger() { this.list = []; }
    Merger.prototype.add = function (geo, m) { const g = geo.index ? geo.toNonIndexed() : geo.clone(); g.applyMatrix4(m); this.list.push(g); };
    Merger.prototype.mesh = function (mat) {
      if (!this.list.length) return null; let n = 0; this.list.forEach((g) => { n += g.attributes.position.count; });
      const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), uv = new Float32Array(n * 2); let o = 0;
      this.list.forEach((g) => { pos.set(g.attributes.position.array, o * 3); nor.set(g.attributes.normal.array, o * 3); if (g.attributes.uv) uv.set(g.attributes.uv.array, o * 2); o += g.attributes.position.count; g.dispose(); });
      const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.BufferAttribute(pos, 3)); geo.setAttribute('normal', new T.BufferAttribute(nor, 3)); geo.setAttribute('uv', new T.BufferAttribute(uv, 2)); geo.computeBoundingSphere();
      const me = new T.Mesh(geo, mat); group.add(me); made.meshes++; return me;
    };
    const M = (x, y, z, rx, ry, rz, sx, sy, sz) => new T.Matrix4().compose(new T.Vector3(x, y, z), new T.Quaternion().setFromEuler(new T.Euler(rx || 0, ry || 0, rz || 0)), new T.Vector3(sx || 1, sy || 1, sz || 1));
    const mGold = new Merger(), mGoldD = new Merger(), mCrys = new Merger();
    const candleXf = [], flameXf = [];

    /* ---------------- chandeliers ---------------- */
    const torus = (r, t) => new T.TorusGeometry(r, t, 6, Math.max(16, Math.round(r * 18)));
    const cyl = (r0, r1, h, s) => new T.CylinderGeometry(r0, r1, h, s || 8);
    const sph = (r) => new T.SphereGeometry(r, 10, 8);
    P.chandeliers.forEach((c) => {
      const { x, y, z, r } = c, top = c.top != null ? c.top : y + 3;
      mGoldD.add(cyl(0.025, 0.025, top - y, 6), M(x, (top + y) / 2, z));                         // the chain
      if (c.kind === 'crown') {
        // the Throne Hall crown: two gilded rings with arches, gables and spikes, a ball and a cross below
        for (const [ry, rr, th] of [[0, r, 0.12], [0.55, r, 0.08], [-0.35, r * 0.96, 0.06]]) mGold.add(torus(rr, th), M(x, y + ry, z, Math.PI / 2));
        const n = 16; for (let i = 0; i < n; i++) {
          const a = i / n * Math.PI * 2, cx = x + Math.cos(a) * r, cz = z + Math.sin(a) * r;
          mGold.add(cyl(0.04, 0.04, 0.9, 6), M(cx, y + 0.1, cz));                                 // posts
          mGold.add(new T.ConeGeometry(0.16, 0.5, 4), M(cx, y + 0.85, cz, 0, a));                 // gables / spikes
          mCrys.add(sph(0.07), M(cx, y - 0.45, cz));
          if (i % 2 === 0) mGoldD.add(cyl(0.012, 0.012, Math.hypot(r, top - y - 0.5), 4), M((cx + x) / 2, (y + 0.6 + top) / 2, (cz + z) / 2, 0, -a, Math.atan2(r, top - y - 0.6)));   // chains to the top
        }
        mGold.add(sph(0.35), M(x, y - 1.0, z)); mGold.add(cyl(0.05, 0.05, 0.8, 6), M(x, y - 1.6, z)); mGold.add(new T.BoxGeometry(0.5, 0.06, 0.06), M(x, y - 1.75, z));
        // candles on both rings (96 in all)
        const per = Math.round(c.candles / 2);
        for (const [ry, rr] of [[0.2, r], [0.75, r * 0.98]]) for (let i = 0; i < per; i++) { const a = (i + 0.5) / per * Math.PI * 2; candleXf.push([x + Math.cos(a) * rr, y + ry, z + Math.sin(a) * rr, 0.13]); }
      } else {
        const tiers = c.kind === 'ring' ? [[0, r], [0.5, r * 0.6]] : [[0, r]];
        tiers.forEach(([ry, rr]) => mGold.add(torus(rr, 0.05), M(x, y + ry, z, Math.PI / 2)));
        for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; mGoldD.add(cyl(0.012, 0.012, top - y, 4), M(x + Math.cos(a) * r * 0.5, (y + top) / 2, z + Math.sin(a) * r * 0.5, 0, 0, Math.atan2(r * 0.5, top - y) * (i & 1 ? 1 : -1))); }
        mGold.add(sph(0.12), M(x, y - 0.15, z));
        let k = 0; tiers.forEach(([ry, rr], t) => { const per = Math.round(c.candles * (t === 0 ? 0.66 : 0.34)); for (let i = 0; i < per && k < c.candles; i++, k++) { const a = (i + 0.5) / per * Math.PI * 2; candleXf.push([x + Math.cos(a) * rr, y + ry + 0.05, z + Math.sin(a) * rr, 0.1]); } });
      }
    });
    // candelabra (standing) and coloured glow points
    const glows = [];
    P.candles.forEach((c) => {
      if (!c.h) { glows.push(c); return; }
      mGold.add(cyl(0.05, 0.16, c.h, 8), M(c.x, c.y + c.h / 2, c.z)); mGold.add(cyl(0.22, 0.22, 0.05, 10), M(c.x, c.y + 0.03, c.z));
      for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2, rr = i === 4 ? 0 : 0.28; const xx = c.x + Math.cos(a) * rr, zz = c.z + Math.sin(a) * rr; if (rr) mGold.add(cyl(0.02, 0.02, rr * 2, 4), M((xx + c.x) / 2, c.y + c.h, (zz + c.z) / 2, 0, -a, Math.PI / 2)); candleXf.push([xx, c.y + c.h + 0.02, zz, 0.12]); }
    });
    // the palm-tree capital of the stair column (the column ends in a palm whose fronds carry the vault)
    P.palms.forEach((p) => {
      const h = p.top - p.y; mGold.add(cyl(0.35, 0.45, 0.4, 10), M(p.x, p.y, p.z));
      const leaf = new T.BoxGeometry(2.6, 0.08, 0.5); leaf.translate(1.3, 0, 0);
      for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; mGold.add(leaf, M(p.x, p.y + h * 0.35 + (i & 1) * 0.4, p.z, 0, -a, 0.55 + (i & 1) * 0.25)); }
      const pm = new T.MeshPhongMaterial({ color: 0x6f9a5a, specular: 0xd0e0a0, shininess: 30 }); const leafs = new Merger();
      for (let i = 0; i < 14; i++) { const a = (i + 0.5) / 14 * Math.PI * 2; leafs.add(leaf, M(p.x, p.y + h * 0.5, p.z, 0, -a, 0.35)); }
      leafs.mesh(pm);
    });
    // the swan (Ludwig's emblem; the Schwanstein of the castle's name)
    P.swans.forEach((s) => {
      const wm = new T.MeshPhongMaterial({ color: 0xf8f8f4, specular: 0xffffff, shininess: 40 }), mw = new Merger();
      const body = sph(0.32); mw.add(body, M(s.x, s.y + 0.3, s.z, 0, 0, 0, 1.3, 0.75, 0.8));
      for (let k = 0; k < 8; k++) { const t = k / 7; mw.add(sph(0.07), M(s.x + 0.32 - Math.sin(t * Math.PI) * 0.18, s.y + 0.45 + t * 0.55, s.z)); }
      mw.add(sph(0.09), M(s.x + 0.28, s.y + 1.02, s.z)); mw.mesh(wm);
      mGold.add(new T.ConeGeometry(0.04, 0.16, 6), M(s.x + 0.42, s.y + 1.0, s.z, 0, 0, -Math.PI / 2)); mGold.add(cyl(0.35, 0.4, 0.1, 12), M(s.x, s.y + 0.02, s.z));
    });
    mGold.mesh(gold); mGoldD.mesh(goldD); mCrys.mesh(crystal);
    // candles + flames: 2 instanced meshes for every candle in the castle
    let flames = null, candlesMesh = null;
    if (candleXf.length) {
      const cg = cyl(0.025, 0.025, 1, 6); cg.translate(0, 0.5, 0); const fg = new T.ConeGeometry(0.035, 0.11, 6); fg.translate(0, 0.055, 0);
      candlesMesh = new T.InstancedMesh(cg, wax, candleXf.length); flames = new T.InstancedMesh(fg, flameM, candleXf.length);
      const m = new T.Matrix4();
      candleXf.forEach((c, i) => { m.makeScale(1, c[3], 1).setPosition(c[0], c[1], c[2]); candlesMesh.setMatrixAt(i, m); m.makeTranslation(c[0], c[1] + c[3], c[2]); flames.setMatrixAt(i, m); });
      group.add(candlesMesh, flames); made.meshes += 2;
    }
    // coloured glow (the grotto)
    glows.forEach((g) => { const sm = new T.SpriteMaterial({ map: glowTex(), color: g.glow || 0xffd080, transparent: true, depthWrite: false, blending: T.AdditiveBlending }); const sp = new T.Sprite(sm); sp.scale.set(2.4, 2.4, 1); sp.position.set(g.x, g.y + 1.6, g.z); group.add(sp); });

    /* ---------------- painted panels ---------------- */
    const muralCache = {};
    function muralTex(theme, k) {
      const key = theme + k; if (muralCache[key]) return muralCache[key];
      const c = document.createElement('canvas'); c.width = 256; c.height = 256; paintMural(c.getContext('2d'), theme, k); const t = new T.CanvasTexture(c);
      if (T.sRGBEncoding !== undefined) t.encoding = T.sRGBEncoding; t.anisotropy = 4; muralCache[key] = t; made.textures++; return t;
    }
    let mi = 0;
    P.murals.forEach((m) => {
      const tex = muralTex(m.theme, mi++ % 3), mat = new T.MeshLambertMaterial({ map: tex }), g = new T.PlaneGeometry(m.w, m.h), me = new T.Mesh(g, mat);
      const o = 0.02;
      if (m.face === '+z') me.position.set(m.x + m.w / 2, m.y + m.h / 2, m.z + o);
      else if (m.face === '-z') { me.position.set(m.x + m.w / 2, m.y + m.h / 2, m.z - o); me.rotation.y = Math.PI; }
      else if (m.face === '+x') { me.position.set(m.x + o, m.y + m.h / 2, m.z + m.w / 2); me.rotation.y = Math.PI / 2; }
      else { me.position.set(m.x - o, m.y + m.h / 2, m.z + m.w / 2); me.rotation.y = -Math.PI / 2; }
      group.add(me); made.meshes++;
    });

    /* ---------------- the apse: gold mosaic and a starry half dome ---------------- */
    if (P.apse) {
      const a = P.apse, R = a.r - 0.62, spring = a.y0 + (a.y1 - a.y0 - R);
      const ct = document.createElement('canvas'); ct.width = 1024; ct.height = 256; paintApse(ct.getContext('2d')); const at = new T.CanvasTexture(ct); if (T.sRGBEncoding !== undefined) at.encoding = T.sRGBEncoding; made.textures++;
      const wall = new T.Mesh(new T.CylinderGeometry(R, R, spring - a.y0, 40, 1, true, Math.PI, Math.PI), new T.MeshPhongMaterial({ map: at, side: T.BackSide, specular: 0x8a6a20, shininess: 30, emissive: 0x1a1204 }));
      wall.position.set(a.cx, (a.y0 + spring) / 2, a.cz); group.add(wall);
      const cd = document.createElement('canvas'); cd.width = 512; cd.height = 256; paintDome(cd.getContext('2d')); const dt = new T.CanvasTexture(cd); if (T.sRGBEncoding !== undefined) dt.encoding = T.sRGBEncoding; made.textures++;
      const dome = new T.Mesh(new T.SphereGeometry(R, 32, 12, -Math.PI / 2, Math.PI, 0, Math.PI / 2), new T.MeshPhongMaterial({ map: dt, side: T.BackSide, shininess: 10, emissive: 0x0a0c18 }));
      dome.position.set(a.cx, spring, a.cz); group.add(dome); made.meshes += 2;
    }
    /* ---------------- the mosaic floor ---------------- */
    P.mosaic.forEach((f) => {
      const c = document.createElement('canvas'); c.width = 1024; c.height = 768; paintFloor(c.getContext('2d')); const t = new T.CanvasTexture(c); if (T.sRGBEncoding !== undefined) t.encoding = T.sRGBEncoding; t.anisotropy = 8; made.textures++;
      const me = new T.Mesh(new T.PlaneGeometry(f.x1 - f.x0, f.z1 - f.z0), new T.MeshLambertMaterial({ map: t })); me.rotation.x = -Math.PI / 2; me.position.set((f.x0 + f.x1) / 2, f.y, (f.z0 + f.z1) / 2); me.receiveShadow = true; group.add(me); made.meshes++;
    });

    /* ---------------- far landscape: the Alps and the Forggensee ---------------- */
    const far = buildFar(world, T); scene.add(far.group); made.meshes += far.n;

    function update(dt, time, cam, night) {
      if (flames) { const f = 0.85 + Math.sin(time * 13.1) * 0.06 + Math.sin(time * 7.3) * 0.05; flameM.color.setRGB(1, 0.8 * f, 0.45 * f); }
      far.group.position.set(0, 0, 0);
    }
    return { group, update, stats: () => ({ meshes: made.meshes, textures: made.textures, candles: candleXf.length, murals: P.murals.length, chandeliers: P.chandeliers.length }) };
  }

  /* ================= painting ================= */
  let _glow = null;
  function glowTex() { if (_glow) return _glow; const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.4, 'rgba(255,255,255,.35)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); _glow = new THREE.CanvasTexture(c); return _glow; }
  function frame(x, w, h) { x.lineWidth = 12; x.strokeStyle = '#b8862e'; x.strokeRect(6, 6, w - 12, h - 12); x.lineWidth = 3; x.strokeStyle = '#f2d27a'; x.strokeRect(13, 13, w - 26, h - 26); x.strokeStyle = '#6a4a14'; x.strokeRect(3, 3, w - 6, h - 6); }
  function figure(x, cx, base, hgt, robe, halo, r) {   // a standing robed figure, simple and flat like the Nazarene style it stands for
    x.fillStyle = robe; x.beginPath(); x.moveTo(cx - hgt * 0.16, base); x.lineTo(cx + hgt * 0.16, base); x.lineTo(cx + hgt * 0.09, base - hgt * 0.72); x.lineTo(cx - hgt * 0.09, base - hgt * 0.72); x.closePath(); x.fill();
    x.fillStyle = 'rgba(0,0,0,.18)'; x.fillRect(cx - 1, base - hgt * 0.7, 2, hgt * 0.7);
    x.fillStyle = '#e8c8a8'; x.beginPath(); x.arc(cx, base - hgt * 0.8, hgt * 0.075, 0, 7); x.fill();
    if (halo) { x.strokeStyle = '#f6d36a'; x.lineWidth = 3; x.beginPath(); x.arc(cx, base - hgt * 0.8, hgt * 0.12, 0, 7); x.stroke(); }
    x.fillStyle = robe; x.fillRect(cx - hgt * 0.13, base - hgt * 0.68, hgt * 0.26, hgt * 0.07);
  }
  function landscape(x, w, h, r, sky, hills) {
    const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, sky[0]); g.addColorStop(1, sky[1]); x.fillStyle = g; x.fillRect(0, 0, w, h);
    hills.forEach((c, i) => { x.fillStyle = c; x.beginPath(); x.moveTo(0, h); for (let k = 0; k <= 16; k++) x.lineTo(k / 16 * w, h * (0.55 + i * 0.12) - Math.sin(k * 0.9 + i * 2 + r() * 0.5) * h * 0.06); x.lineTo(w, h); x.fill(); });
  }
  function tree(x, cx, base, s, col) { x.fillStyle = '#4a3420'; x.fillRect(cx - s * 0.05, base - s * 0.4, s * 0.1, s * 0.4); x.fillStyle = col; x.beginPath(); x.arc(cx, base - s * 0.55, s * 0.28, 0, 7); x.fill(); }
  function castle(x, cx, base, s) { x.fillStyle = '#f2efe6'; x.fillRect(cx - s * 0.3, base - s * 0.5, s * 0.6, s * 0.5); x.fillRect(cx + s * 0.18, base - s * 0.85, s * 0.12, s * 0.85); x.fillStyle = '#5a6a7e'; x.beginPath(); x.moveTo(cx + s * 0.16, base - s * 0.85); x.lineTo(cx + s * 0.24, base - s * 1.1); x.lineTo(cx + s * 0.32, base - s * 0.85); x.fill(); x.beginPath(); x.moveTo(cx - s * 0.32, base - s * 0.5); x.lineTo(cx, base - s * 0.72); x.lineTo(cx + s * 0.32, base - s * 0.5); x.fill(); }
  function paintMural(x, theme, k) {
    const w = 256, h = 256, r = rng(theme.length * 131 + k * 17 + 5);
    if (theme === 'saints' || theme === 'apostles') {   // gold ground, arcade, standing figures with haloes
      const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#e9c25a'); g.addColorStop(1, '#b8862e'); x.fillStyle = g; x.fillRect(0, 0, w, h);
      for (let i = 0; i < 300; i++) { x.fillStyle = r() < 0.5 ? 'rgba(255,240,180,.35)' : 'rgba(120,80,20,.25)'; x.fillRect(r() * w, r() * h, 2, 2); }
      const n = theme === 'saints' ? 2 : 3, robes = ['#2a4a8a', '#8a2a2a', '#3a6a3a', '#6a3a7a', '#a87a2a'];
      for (let i = 0; i < n; i++) { const cx = (i + 0.5) / n * w; x.fillStyle = 'rgba(40,30,80,.55)'; x.beginPath(); x.arc(cx, 80, w / n * 0.38, Math.PI, 0); x.lineTo(cx + w / n * 0.38, 230); x.lineTo(cx - w / n * 0.38, 230); x.fill(); figure(x, cx, 226, 170, robes[(i + k) % robes.length], true, r); }
      x.fillStyle = '#6a2018'; x.fillRect(0, 232, w, 24);
    } else if (theme === 'parzival' || theme === 'grail' || theme === 'tannhauser') {
      landscape(x, w, h, r, ['#9ec4e8', '#f2e2c0'], ['#7a9a5a', '#5a7a44', '#3e5a30']);
      for (let i = 0; i < 5; i++) tree(x, 20 + r() * 216, 200 + r() * 30, 50 + r() * 30, ['#3e6a34', '#4a7a3a', '#2e5428'][i % 3]);
      if (theme === 'grail') { castle(x, 150, 140, 90); x.fillStyle = '#f6d36a'; x.beginPath(); x.arc(70, 70, 22, 0, 7); x.fill(); x.fillStyle = '#d9ad48'; x.fillRect(62, 70, 16, 30); }
      else castle(x, 190, 150, 70);
      figure(x, 90 + k * 20, 236, 140, theme === 'tannhauser' ? '#7a2a5a' : '#8a2a2a', false, r);
      x.fillStyle = '#9aa0a8'; x.fillRect(84 + k * 20, 150, 4, 70);   // a spear
    } else if (theme === 'tristan') {   // night garden in blue
      landscape(x, w, h, r, ['#1a2448', '#3a4a7a'], ['#2a3a5a', '#1e2c48']);
      x.fillStyle = '#f2ecd0'; x.beginPath(); x.arc(200, 50, 16, 0, 7); x.fill();
      for (let i = 0; i < 40; i++) { x.fillStyle = '#f6eebc'; x.fillRect(r() * w, r() * 120, 1.5, 1.5); }
      figure(x, 100, 236, 130, '#3a4a9a', false, r); figure(x, 150, 236, 120, '#d8d0e8', false, r);
    } else if (theme === 'lohengrin') {   // the swan knight on the lake
      landscape(x, w, h, r, ['#a8cce8', '#e8f0f6'], ['#6a8a9a']);
      x.fillStyle = '#4a7aa8'; x.fillRect(0, 170, w, 86); for (let i = 0; i < 30; i++) { x.fillStyle = 'rgba(255,255,255,.4)'; x.fillRect(r() * w, 175 + r() * 80, 10, 1.5); }
      x.fillStyle = '#fff'; x.beginPath(); x.ellipse(120, 196, 34, 12, 0, 0, 7); x.fill(); x.lineWidth = 7; x.strokeStyle = '#fff'; x.beginPath(); x.moveTo(146, 192); x.quadraticCurveTo(170, 170, 156, 150); x.stroke();
      x.fillStyle = '#7a5a2a'; x.beginPath(); x.moveTo(60, 210); x.lineTo(110, 210); x.lineTo(100, 222); x.lineTo(68, 222); x.fill(); figure(x, 84, 210, 90, '#c8ccd8', false, r);
    } else if (theme === 'minstrels') {
      const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#8a3a2a'); g.addColorStop(1, '#4a1a12'); x.fillStyle = g; x.fillRect(0, 0, w, h);
      for (let i = 0; i < 4; i++) figure(x, 40 + i * 58, 236, 120 + r() * 30, ['#d8b048', '#2a4a8a', '#3a6a3a', '#e8e0d0'][i], false, r);
      x.fillStyle = '#d9ad48'; x.fillRect(0, 0, w, 16); x.fillRect(0, 240, w, 16);
    } else if (theme === 'forest') {   // the stage backdrop: a forest clearing
      landscape(x, w, h, r, ['#bcd8ec', '#eaf2e0'], ['#7a9a5a', '#5a7a44']);
      for (let i = 0; i < 18; i++) tree(x, r() * w, 160 + r() * 90, 50 + r() * 70, ['#3e6a34', '#4a7a3a', '#2e5428', '#5a8a44'][i % 4]);
    }
    frame(x, w, h);
  }
  function paintApse(x) {
    const w = 1024, h = 256, r = rng(77);
    const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#f2cf6a'); g.addColorStop(1, '#c0902e'); x.fillStyle = g; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 9000; i++) { x.fillStyle = r() < 0.5 ? 'rgba(255,245,200,.35)' : 'rgba(120,80,10,.22)'; x.fillRect(Math.floor(r() * w / 3) * 3, Math.floor(r() * h / 3) * 3, 2, 2); }
    // palm trees between the figures, a figure in majesty in the middle, kings at the sides
    for (let i = 0; i < 7; i++) { const cx = (i + 0.5) / 7 * w; if (i === 3) { x.fillStyle = '#2a4a8a'; x.beginPath(); x.ellipse(cx, 120, 70, 110, 0, 0, 7); x.fill(); figure(x, cx, 240, 220, '#f2f0ea', true, r); } else figure(x, cx, 244, 170, ['#8a2a2a', '#2a4a8a', '#3a6a3a', '', '#6a3a7a', '#8a2a2a', '#2a4a8a'][i], true, r); }
    for (let i = 0; i < 6; i++) { const cx = (i + 1) / 7 * w; x.strokeStyle = '#3e6a34'; x.lineWidth = 6; x.beginPath(); x.moveTo(cx, 250); x.lineTo(cx, 120); x.stroke(); for (let k = 0; k < 6; k++) { x.beginPath(); x.moveTo(cx, 120); x.quadraticCurveTo(cx + Math.cos(k) * 30, 100, cx + Math.cos(k) * 46, 120 + Math.sin(k) * 10); x.stroke(); } }
    x.fillStyle = '#6a2018'; x.fillRect(0, 0, w, 10); x.fillRect(0, h - 10, w, 10);
  }
  function paintDome(x) {
    const w = 512, h = 256, r = rng(91);
    const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#1a2a6a'); g.addColorStop(1, '#2a4a9a'); x.fillStyle = g; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 160; i++) { const sx = r() * w, sy = r() * h, s = 2 + r() * 3; x.fillStyle = '#f6d36a'; x.beginPath(); for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2, rr = k & 1 ? s * 0.4 : s; x.lineTo(sx + Math.cos(a) * rr, sy + Math.sin(a) * rr); } x.fill(); }
    x.fillStyle = '#f6d36a'; x.fillRect(0, h - 12, w, 12);
  }
  function paintFloor(x) {   // the mosaic floor: a great circle with the animals and plants of the world (here abstracted), a border
    const w = 1024, h = 768, r = rng(13);
    x.fillStyle = '#e8e2d2'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 26000; i++) { x.fillStyle = ['rgba(200,190,170,.5)', 'rgba(255,255,250,.5)'][i & 1]; x.fillRect(Math.floor(r() * w / 4) * 4, Math.floor(r() * h / 4) * 4, 3, 3); }
    x.lineWidth = 26; x.strokeStyle = '#2a4a7a'; x.strokeRect(20, 20, w - 40, h - 40); x.lineWidth = 8; x.strokeStyle = '#b8862e'; x.strokeRect(46, 46, w - 92, h - 92);
    for (let k = 0; k < 40; k++) { const t = k / 40; x.fillStyle = k & 1 ? '#8a2a2a' : '#3a6a3a'; x.beginPath(); x.arc(70 + t * (w - 140), 70, 10, 0, 7); x.fill(); x.beginPath(); x.arc(70 + t * (w - 140), h - 70, 10, 0, 7); x.fill(); }
    const cx = w / 2, cy = h / 2;
    [[300, '#c8b07a'], [280, '#2a4a7a'], [262, '#e8e2d2'], [190, '#3a6a3a'], [176, '#e8e2d2'], [110, '#b8862e'], [96, '#2a4a7a']].forEach(([rr, c]) => { x.fillStyle = c; x.beginPath(); x.arc(cx, cy, rr, 0, 7); x.fill(); });
    for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2, px = cx + Math.cos(a) * 222, py = cy + Math.sin(a) * 222; x.fillStyle = ['#8a2a2a', '#3a6a3a', '#b8862e', '#2a4a7a'][k % 4]; x.beginPath(); x.ellipse(px, py, 26, 14, a, 0, 7); x.fill(); x.fillStyle = '#e8e2d2'; x.beginPath(); x.arc(px + Math.cos(a) * 14, py + Math.sin(a) * 14, 5, 0, 7); x.fill(); }
    for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; x.strokeStyle = '#3a6a3a'; x.lineWidth = 5; x.beginPath(); x.moveTo(cx + Math.cos(a) * 110, cy + Math.sin(a) * 110); x.lineTo(cx + Math.cos(a) * 170, cy + Math.sin(a) * 170); x.stroke(); }
    x.fillStyle = '#f6d36a'; for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx + Math.cos(a) * 90, cy + Math.sin(a) * 90); x.lineTo(cx + Math.cos(a + 0.3) * 40, cy + Math.sin(a + 0.3) * 40); x.fill(); }
  }

  /* ================= the far landscape ================= */
  function buildFar(world, T) {
    const group = new T.Group(); group.name = 'ns-far'; let n = 0;
    const r = rng(1886), cx = world.W / 2, cz = world.D / 2;
    const pos = [], col = [];
    const cRock = [0.5, 0.52, 0.55], cForest = [0.24, 0.36, 0.24], cSnow = [0.95, 0.96, 1.0];
    function peak(px, pz, base, top, rad, sides) {   // a jagged pyramid: forest at the foot, rock, snow above 1800 m (scaled)
      const ring = [], ring2 = []; for (let i = 0; i < sides; i++) { const a = i / sides * Math.PI * 2 + r() * 0.3, rr = rad * (0.75 + r() * 0.5); ring.push([px + Math.cos(a) * rr, base, pz + Math.sin(a) * rr]); ring2.push([px + Math.cos(a) * rr * 0.45, base + (top - base) * (0.5 + r() * 0.15), pz + Math.sin(a) * rr * 0.45]); }
      const apex = [px + (r() - 0.5) * rad * 0.2, top, pz + (r() - 0.5) * rad * 0.2];
      const shade = (y) => { const t = (y - base) / (top - base); if (top > 210 && t > 0.62) return cSnow; if (t < 0.32) return cForest; return cRock; };
      const tri = (a, b, c) => { [a, b, c].forEach((p) => { pos.push(p[0], p[1], p[2]); const s = shade(p[1]); const k = 0.85 + r() * 0.15; col.push(s[0] * k, s[1] * k, s[2] * k); }); };
      for (let i = 0; i < sides; i++) { const j = (i + 1) % sides; tri(ring[i], ring2[j], ring2[i]); tri(ring[i], ring[j], ring2[j]); tri(ring2[i], ring2[j], apex); }
    }
    // the Alps south and east (Saeuling, Tegelberg, Ammergau range), lower hills west, the plain north
    for (let i = 0; i < 46; i++) {
      const a = -0.25 + r() * 3.6, d = 420 + r() * 700;          // angles from east (0) round the south (pi/2) to the west (pi)
      const px = cx + Math.cos(a) * d, pz = cz + Math.sin(a) * d;
      const top = (a > 0.4 && a < 2.4 ? 230 : 120) + r() * (a > 0.4 && a < 2.4 ? 250 : 90);
      peak(px, pz, 10, top, 160 + r() * 220, 7);
    }
    for (let i = 0; i < 18; i++) { const a = Math.PI + 0.2 + r() * 1.2, d = 700 + r() * 600; peak(cx + Math.cos(a) * d, cz + Math.sin(a) * d, 10, 70 + r() * 60, 260, 6); }   // the foothills north-west
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new T.Float32BufferAttribute(col, 3)); g.computeVertexNormals();
    const m = new T.Mesh(g, new T.MeshLambertMaterial({ vertexColors: true, flatShading: true })); group.add(m); n++;
    // the Forggensee (north) as a still sheet of water
    const lake = new T.Mesh(new T.PlaneGeometry(1600, 700), new T.MeshPhongMaterial({ color: 0x4a7a9a, specular: 0xbfdfff, shininess: 80, transparent: true, opacity: 0.92 }));
    lake.rotation.x = -Math.PI / 2; lake.position.set(cx - 100, 14.7, -420); group.add(lake); n++;
    return { group, n };
  }

  root.NSProps = { build };
})(window);
