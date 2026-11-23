/* Minest My World · Walt Disney World (Magic Kingdom) Realistic Architectural Scale Model Engine
 * High-Craft Procedural Materials: Château Ashlar Limestone, Scalloped Royal-Blue Slate Roofs,
 * 1900s Victorian Brick & Mullioned Shopfronts, Mossy Mayan Temple Stone, Renaissance Carousel Canopy,
 * 18-Spire Cinderella Castle, 3 Rideable Attractions, Steam Railroad & Soft-Glow 3D Fireworks Show. */
(function (root) {
  'use strict';

  function build(world, T, scene) {
    const group = new T.Group(); group.name = 'tp-props'; scene.add(group);
    const Y = world.PARK_Y || 40;

    const cvs = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
    function finTex(c, wrap) {
      const t = new T.CanvasTexture(c);
      if (wrap) t.wrapS = t.wrapT = T.RepeatWrapping;
      if (T.sRGBEncoding !== undefined) t.encoding = T.sRGBEncoding;
      t.anisotropy = 4;
      return t;
    }

    function Merger() { this.list = []; }
    Merger.prototype.add = function (geo, m) {
      const g = geo.index ? geo.toNonIndexed() : geo.clone();
      g.applyMatrix4(m);
      this.list.push(g);
    };
    Merger.prototype.mesh = function (mat, shadow) {
      if (!this.list.length) return null;
      let n = 0; this.list.forEach((g) => { n += g.attributes.position.count; });
      const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), uv = new Float32Array(n * 2);
      let o = 0;
      this.list.forEach((g) => {
        pos.set(g.attributes.position.array, o * 3);
        nor.set(g.attributes.normal.array, o * 3);
        if (g.attributes.uv) uv.set(g.attributes.uv.array, o * 2);
        o += g.attributes.position.count;
        g.dispose();
      });
      const geo = new T.BufferGeometry();
      geo.setAttribute('position', new T.BufferAttribute(pos, 3));
      geo.setAttribute('normal', new T.BufferAttribute(nor, 3));
      geo.setAttribute('uv', new T.BufferAttribute(uv, 2));
      geo.computeBoundingSphere();
      const me = new T.Mesh(geo, mat);
      me.receiveShadow = true;
      if (shadow !== false) me.castShadow = true;
      group.add(me);
      return me;
    };

    const _q = new T.Quaternion(), _e = new T.Euler(), _p = new T.Vector3(), _s = new T.Vector3(), _upV = new T.Vector3(0, 1, 0);
    function M(x, y, z, rx, ry, rz, sx, sy, sz) {
      _p.set(x || 0, y || 0, z || 0);
      _e.set(rx || 0, ry || 0, rz || 0);
      _q.setFromEuler(_e);
      _s.set(sx == null ? 1 : sx, sy == null ? 1 : sy, sz == null ? 1 : sz);
      return new T.Matrix4().compose(_p, _q, _s);
    }
    const unitBox = new T.BoxGeometry(1, 1, 1);
    const box = (mg, w, h, d, x, y, z, rx, ry, rz) => mg.add(unitBox, M(x, y, z, rx, ry, rz, w, h, d));
    const cyl = (rt, rb, h, seg) => new T.CylinderGeometry(rt, rb, h, seg || 10);
    const sph = (r, seg) => new T.SphereGeometry(r, seg || 10, 8);
    function addRibSeg(mg, a, b, r0, r1) {
      const va = new T.Vector3(a[0], a[1], a[2]), vb = new T.Vector3(b[0], b[1], b[2]);
      const d = vb.clone().sub(va), L = d.length(); if (L < 1e-4) return;
      const q = new T.Quaternion().setFromUnitVectors(_upV, d.normalize());
      mg.add(new T.CylinderGeometry(r1 == null ? r0 : r1, r0, L * 1.04, 6), new T.Matrix4().compose(va.clone().add(vb).multiplyScalar(0.5), q, new T.Vector3(1, 1, 1)));
    }
    function addMesh(geo, mat, x, y, z, rx, ry, rz, cast) {
      const m = new T.Mesh(geo, mat);
      m.position.set(x || 0, y || 0, z || 0);
      m.rotation.set(rx || 0, ry || 0, rz || 0);
      if (cast) m.castShadow = true;
      m.receiveShadow = true;
      group.add(m);
      return m;
    }

    /* ============================================================================
     * 1. REALISTIC ARCHITECTURAL PROCEDURAL MATERIALS (ZERO FLAT PLASTIC!)
     * ============================================================================ */
    function makeAshlarTex(baseHex, varA, mortarCol, rows, cols) {
      const c = cvs(256, 256), x = c.getContext('2d');
      x.fillStyle = baseHex; x.fillRect(0, 0, 256, 256);
      const rh = 256 / rows, cw = 256 / cols;
      for (let r = 0; r < rows; r++) {
        const off = (r % 2) * (cw * 0.5);
        for (let k = -1; k <= cols; k++) {
          const shade = ((r * 17 + k * 31) % 7) - 3;
          x.fillStyle = shade > 0 ? `rgba(255,252,245,${shade * varA})` : `rgba(40,35,30,${-shade * varA})`;
          x.fillRect(k * cw + off + 1, r * rh + 1, cw - 2, rh - 2);
          x.strokeStyle = mortarCol; x.lineWidth = 1.5;
          x.strokeRect(k * cw + off, r * rh, cw, rh);
        }
      }
      return finTex(c, true);
    }

    function makeBlueSlateTex() {
      const c = cvs(256, 256), x = c.getContext('2d');
      const g = x.createLinearGradient(0, 0, 0, 256);
      g.addColorStop(0, '#1e3a8a'); g.addColorStop(0.5, '#1d4ed8'); g.addColorStop(1, '#172554');
      x.fillStyle = g; x.fillRect(0, 0, 256, 256);
      for (let r = 0; r < 16; r++) {
        const ry = r * 16, off = (r % 2) * 16;
        for (let k = -1; k < 10; k++) {
          const cx = k * 32 + off;
          x.fillStyle = (k + r) % 3 === 0 ? 'rgba(147,197,253,0.16)' : 'rgba(15,23,42,0.18)';
          x.beginPath(); x.arc(cx + 16, ry + 8, 15, 0, Math.PI); x.fill();
          x.strokeStyle = 'rgba(191,219,254,0.22)'; x.lineWidth = 1.2;
          x.beginPath(); x.arc(cx + 16, ry + 8, 15, 0, Math.PI); x.stroke();
        }
      }
      return finTex(c, true);
    }

    function makeVictorianShopTex(wallHex, trimHex, awningHex) {
      const c = cvs(256, 256), x = c.getContext('2d');
      x.fillStyle = wallHex; x.fillRect(0, 0, 256, 256);
      // Subtle horizontal Victorian clapboard / brick siding lines
      x.strokeStyle = 'rgba(0,0,0,0.09)'; x.lineWidth = 1;
      for (let y = 0; y < 256; y += 10) { x.beginPath(); x.moveTo(0, y); x.lineTo(256, y); x.stroke(); }
      // Upper cornice & stringcourse molding
      x.fillStyle = trimHex; x.fillRect(0, 0, 256, 14); x.fillRect(0, 128, 256, 10);
      // 3 Upper Arched Multi-Pane Victorian Sash Windows with dark interiors & cream mullions
      for (const wx of [22, 102, 182]) {
        x.fillStyle = '#1e293b'; x.fillRect(wx, 30, 52, 76);
        x.fillStyle = 'rgba(253,230,138,0.28)'; x.fillRect(wx + 4, 34, 44, 68);
        x.strokeStyle = trimHex; x.lineWidth = 4; x.strokeRect(wx, 30, 52, 76);
        x.lineWidth = 2;
        x.beginPath(); x.moveTo(wx + 26, 30); x.lineTo(wx + 26, 106); x.moveTo(wx, 68); x.lineTo(wx + 52, 68); x.stroke();
      }
      // Ground-Floor Warm Illuminated Turn-of-the-Century Mullioned Display Windows!
      for (const wx of [18, 138]) {
        const wg = x.createLinearGradient(0, 156, 0, 240);
        wg.addColorStop(0, '#fef3c7'); wg.addColorStop(0.55, '#f59e0b'); wg.addColorStop(1, '#78350f');
        x.fillStyle = wg; x.fillRect(wx, 156, 100, 82);
        x.strokeStyle = trimHex; x.lineWidth = 5; x.strokeRect(wx, 156, 100, 82);
        x.lineWidth = 2;
        for (const mx of [wx + 33, wx + 66]) { x.beginPath(); x.moveTo(mx, 156); x.lineTo(mx, 238); x.stroke(); }
        x.beginPath(); x.moveTo(wx, 182); x.lineTo(wx + 100, 182); x.stroke();
      }
      // Striped Canvas Awning Valence Band
      for (let i = 0; i < 16; i++) {
        x.fillStyle = i % 2 === 0 ? awningHex : '#fffbeb';
        x.fillRect(i * 16, 138, 16, 18);
      }
      return finTex(c, false);
    }

    function makeCastleWindowTex() {
      const c = cvs(128, 256), x = c.getContext('2d');
      x.fillStyle = '#e5dfd5'; x.fillRect(0, 0, 128, 256);
      x.fillStyle = '#1e2b48';
      x.beginPath(); x.moveTo(16, 248); x.lineTo(16, 86); x.quadraticCurveTo(16, 22, 64, 10); x.quadraticCurveTo(112, 22, 112, 86); x.lineTo(112, 248); x.closePath(); x.fill();
      x.strokeStyle = '#d4af37'; x.lineWidth = 4;
      x.beginPath(); x.moveTo(64, 18); x.lineTo(64, 248); x.moveTo(16, 118); x.lineTo(112, 118); x.moveTo(16, 182); x.lineTo(112, 182); x.stroke();
      x.beginPath(); x.arc(64, 62, 18, 0, Math.PI * 2); x.stroke();
      return finTex(c, false);
    }

    function makeSparkTex() {
      const c = cvs(64, 64), x = c.getContext('2d');
      const g = x.createRadialGradient(32, 32, 1, 32, 32, 30);
      g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.28, 'rgba(255,255,255,0.85)');
      g.addColorStop(0.65, 'rgba(255,255,255,0.22)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      x.fillStyle = g; x.fillRect(0, 0, 64, 64);
      return finTex(c, false);
    }

    function makeGlowWashTex() {
      const c = cvs(128, 256), x = c.getContext('2d');
      const g = x.createRadialGradient(64, 210, 6, 64, 150, 118);
      g.addColorStop(0, 'rgba(186,230,253,0.92)');
      g.addColorStop(0.35, 'rgba(96,165,250,0.42)');
      g.addColorStop(0.75, 'rgba(99,102,241,0.12)');
      g.addColorStop(1, 'rgba(30,58,138,0)');
      x.fillStyle = g; x.fillRect(0, 0, 128, 256);
      return finTex(c, false);
    }

    function makeAwningTex(hex) {
      const c = cvs(128, 64), x = c.getContext('2d');
      for (let i = 0; i < 8; i++) {
        x.fillStyle = i % 2 === 0 ? hex : '#fffbf0';
        x.fillRect(i * 16, 0, 16, 56);
      }
      x.fillStyle = '#e2b13c'; x.fillRect(0, 56, 128, 8);
      return finTex(c, true);
    }

    function makeCarouselCanopyTex() {
      const c = cvs(256, 256), x = c.getContext('2d');
      for (let i = 0; i < 16; i++) {
        x.fillStyle = i % 2 === 0 ? '#9f1239' : '#fdf6e7';
        x.fillRect(i * 16, 0, 16, 256);
      }
      // Gilded Victorian scallop frieze along bottom rim
      x.fillStyle = '#1e3a8a'; x.fillRect(0, 212, 256, 44);
      x.strokeStyle = '#f5c542'; x.lineWidth = 4;
      x.strokeRect(0, 214, 256, 40);
      for (let i = 0; i < 16; i++) {
        x.fillStyle = '#fde047'; x.beginPath(); x.arc(i * 16 + 8, 234, 4, 0, Math.PI * 2); x.fill();
      }
      return finTex(c, true);
    }

    function makeBannerTex(title, sub, bg, border) {
      const c = cvs(512, 112), x = c.getContext('2d');
      x.fillStyle = bg || '#172038'; x.fillRect(0, 0, 512, 112);
      x.strokeStyle = border || '#d4af37'; x.lineWidth = 5; x.strokeRect(6, 6, 500, 100);
      x.fillStyle = '#fef3c7'; x.font = '800 28px "Songti SC", Georgia, serif';
      x.textAlign = 'center'; x.textBaseline = 'middle';
      x.fillText(title, 256, 44);
      x.fillStyle = '#cbd5e1'; x.font = '700 15px Georgia, serif';
      x.fillText(sub, 256, 82);
      return finTex(c, false);
    }

    // Textured Architectural Materials (Real Disney World Palette — Refined, Tactile, NOT Toy-Like!)
    const castleBaseMat = new T.MeshLambertMaterial({ map: makeAshlarTex('#b8b5ae', 0.04, 'rgba(72,70,66,0.34)', 8, 6), emissive: 0x10100e });
    const castleUpperMat = new T.MeshLambertMaterial({ map: makeAshlarTex('#ebe3da', 0.025, 'rgba(155,140,130,0.22)', 10, 8), emissive: 0x181512 });
    const castleBlushMat = new T.MeshLambertMaterial({ map: makeAshlarTex('#ead8d4', 0.022, 'rgba(165,132,126,0.20)', 10, 8), emissive: 0x1a1312 });
    const blueSlateMat = new T.MeshPhongMaterial({ map: makeBlueSlateTex(), specular: 0x93c5fd, shininess: 42, emissive: 0x091638 });
    const goldMat = new T.MeshPhongMaterial({ color: 0xe2b13c, specular: 0xfef08a, shininess: 70, emissive: 0x261a04 });
    const whiteTrimMat = new T.MeshLambertMaterial({ map: makeAshlarTex('#f5f2eb', 0.02, 'rgba(170,165,158,0.16)', 8, 6), emissive: 0x181816 });
    const brickMat = new T.MeshLambertMaterial({ map: makeAshlarTex('#9e4036', 0.04, 'rgba(220,210,198,0.35)', 14, 7), emissive: 0x140806 });
    const slateDarkMat = new T.MeshLambertMaterial({ map: makeAshlarTex('#364152', 0.035, 'rgba(20,25,35,0.35)', 12, 6), emissive: 0x0a0d12 });
    const woodMat = new T.MeshLambertMaterial({ map: makeAshlarTex('#7c522d', 0.04, 'rgba(42,26,12,0.35)', 12, 4), emissive: 0x0e0804 });
    const darkIronMat = new T.MeshPhongMaterial({ color: 0x272d38, specular: 0x94a3b8, shininess: 40 });
    const mayanStoneMat = new T.MeshLambertMaterial({ map: makeAshlarTex('#7a7d65', 0.055, 'rgba(38,48,30,0.45)', 8, 5), emissive: 0x0b0d08 });
    const chromeMat = new T.MeshPhongMaterial({ color: 0xe6eef6, specular: 0xffffff, shininess: 92, emissive: 0x121a24 });
    const cyanNeonMat = new T.MeshBasicMaterial({ color: 0x38bdf8 });
    const warmLampMat = new T.MeshBasicMaterial({ color: 0xfff3c4 });
    const crimsonMat = new T.MeshLambertMaterial({ color: 0x9f1239, emissive: 0x180408 });
    const leafMat = new T.MeshLambertMaterial({ color: 0x2b6e38, emissive: 0x061408 });
    const waterJetMat = new T.MeshPhongMaterial({ color: 0x93c5fd, specular: 0xffffff, shininess: 105, transparent: true, opacity: 0.62, side: T.DoubleSide });
    const holoMat = new T.MeshBasicMaterial({ color: 0x38bdf8, wireframe: true, transparent: true, opacity: 0.72 });
    const castleWinMat = new T.MeshLambertMaterial({ map: makeCastleWindowTex(), emissive: 0x121828 });
    const carouselCanopyMat = new T.MeshLambertMaterial({ map: makeCarouselCanopyTex() });
    const bronzeMat = new T.MeshPhongMaterial({ color: 0x5c4632, specular: 0xc29b6e, shininess: 48, emissive: 0x160f08 });
    const horsePorcelainMats = [
      new T.MeshPhongMaterial({ color: 0xfaf7f0, specular: 0xffffff, shininess: 68, emissive: 0x181612 }),
      new T.MeshPhongMaterial({ color: 0xf4dce0, specular: 0xfff0f2, shininess: 65, emissive: 0x1a1214 }),
      new T.MeshPhongMaterial({ color: 0xf0e4ca, specular: 0xfff8e6, shininess: 65, emissive: 0x18150e })
    ];
    const sparkTex = makeSparkTex();
    const glowWashTex = makeGlowWashTex();

    // Shared Mergers
    const mBase = new Merger(), mUpper = new Merger(), mBlush = new Merger(), mBlueRoof = new Merger();
    const mGold = new Merger(), mWhite = new Merger(), mBrick = new Merger(), mSlate = new Merger();
    const mWood = new Merger(), mIron = new Merger(), mMayan = new Merger(), mChrome = new Merger();
    const mCyan = new Merger(), mLamp = new Merger(), mRed = new Merger(), mLeaf = new Merger();

    function addSign(cx, y, z, w, title, sub, bg, border, rotY) {
      const tex = makeBannerTex(title, sub, bg, border);
      addMesh(new T.PlaneGeometry(w, w * 0.22), new T.MeshLambertMaterial({ map: tex, emissiveMap: tex, emissive: 0xfff0cc, emissiveIntensity: 0.42 }), cx, y, z, 0, rotY || 0);
    }

    /* ============================================================================
     * 2. MAIN GATE, FLORAL EMBANKMENT & VICTORIAN MAIN STREET RAILROAD STATION
     * ============================================================================ */
    // Grand Wrought-Iron & Cream Limestone Entrance Arch + Ticket Pavilions (z = 342)
    for (const sd of [-1, 1]) {
      box(mUpper, 1.5, 7.8, 1.5, 192.5 + sd * 8.4, Y + 3.9, 342);
      box(mWhite, 1.8, 0.4, 1.8, 192.5 + sd * 8.4, Y + 7.9, 342);
      mBlueRoof.add(new T.ConeGeometry(1.15, 3.2, 8), M(192.5 + sd * 8.4, Y + 9.6, 342));
      mGold.add(sph(0.28), M(192.5 + sd * 8.4, Y + 11.4, 342));
      // Victorian Octagonal Ticket Booth Pavilions
      mUpper.add(cyl(2.2, 2.3, 3.8, 8), M(192.5 + sd * 15.0, Y + 1.9, 342));
      mWhite.add(cyl(2.5, 2.5, 0.35, 8), M(192.5 + sd * 15.0, Y + 3.9, 342));
      mSlate.add(new T.ConeGeometry(2.6, 2.4, 8), M(192.5 + sd * 15.0, Y + 5.2, 342));
      mGold.add(sph(0.24), M(192.5 + sd * 15.0, Y + 6.5, 342));
    }
    box(mIron, 16.8, 0.45, 0.55, 192.5, Y + 7.6, 342);
    addSign(192.5, Y + 6.4, 342.4, 10.2, 'MAGIC KINGDOM · 奇想迪士尼世界', 'WALT DISNEY WORLD ARCHITECTURAL EDITION', '#172038', '#e2b13c');

    // Sloped Floral Mickey-Style Garden Embankment facing the Main Gate (z = 331)
    mLeaf.add(cyl(5.2, 6.4, 1.35, 24), M(192.5, Y + 0.68, 331));
    mWhite.add(cyl(3.4, 3.8, 1.48, 20), M(192.5, Y + 0.74, 331));
    mRed.add(cyl(1.8, 2.1, 1.56, 16), M(192.5, Y + 0.78, 331));
    mGold.add(new T.OctahedronGeometry(1.1, 0), M(192.5, Y + 2.1, 331));

    // Authentic Victorian Red-Brick & Gingerbread Main Street Railroad Station (z = 318 — wide open dual portals!)
    box(mBrick, 11.5, 8.6, 8.2, 180.5, Y + 4.3, 318);
    box(mBrick, 11.5, 8.6, 8.2, 204.5, Y + 4.3, 318);
    box(mUpper, 12.6, 3.4, 8.2, 192.5, Y + 6.9, 318); // Grand 12.4m x 5.2m open entrance tunnel!
    box(mWhite, 36.2, 0.55, 9.0, 192.5, Y + 8.75, 318);
    // Steep Mansard Slate Roof + Ornate Gabled Victorian Clock Tower & Spire!
    box(mSlate, 35.0, 2.8, 7.2, 192.5, Y + 10.3, 318);
    box(mWhite, 35.4, 0.25, 7.5, 192.5, Y + 11.75, 318);
    box(mUpper, 5.8, 7.4, 5.8, 192.5, Y + 14.8, 318);
    box(mWhite, 6.4, 0.45, 6.4, 192.5, Y + 18.6, 318);
    mSlate.add(new T.ConeGeometry(4.1, 7.2, 4), M(192.5, Y + 22.4, 318, 0, Math.PI / 4, 0));
    mGold.add(cyl(0.10, 0.14, 2.4, 6), M(192.5, Y + 27.0, 318));
    // Illuminated Station Clock Face with Clock Hands
    mGold.add(new T.TorusGeometry(1.35, 0.14, 6, 18), M(192.5, Y + 15.2, 321.02));
    addMesh(new T.CircleGeometry(1.28, 18), whiteTrimMat, 192.5, Y + 15.2, 320.98);
    box(mIron, 0.10, 0.78, 0.08, 192.5, Y + 15.5, 321.08);
    box(mIron, 0.58, 0.10, 0.08, 192.74, Y + 15.2, 321.08);

    /* ============================================================================
     * 3. MAIN STREET, U.S.A. — AUTHENTIC 1900s VICTORIAN ARCHITECTURE (z=234..298)
     * ============================================================================ */
    const shopConfigs = [
      { z: 288, side: -1, wall: '#e8d5c4', trim: '#fffaf0', awn: '#9f1239', roof: mSlate, cupola: true,  label: 'EMPORIUM · 百年百货' },
      { z: 272, side: -1, wall: '#c45b4d', trim: '#fdf6e7', awn: '#166534', roof: mSlate, cupola: false, label: 'MAIN ST CINEMA · 复古影院' },
      { z: 256, side: -1, wall: '#d8e2dc', trim: '#ffffff', awn: '#1d4ed8', roof: mBlueRoof, cupola: true, label: 'CASEY CORNER · 棒球咖啡馆' },
      { z: 240, side: -1, wall: '#f0dfd5', trim: '#fffef8', awn: '#b45309', roof: mSlate, cupola: false, label: 'CRYSTAL ARTS · 水晶工坊' },
      { z: 288, side: 1,  wall: '#d5a8a0', trim: '#fffaf0', awn: '#9f1239', roof: mSlate, cupola: true,  label: 'CONFECTIONERY · 糖果殿堂' },
      { z: 272, side: 1,  wall: '#ede4d3', trim: '#ffffff', awn: '#0f766e', roof: mBlueRoof, cupola: false, label: 'MAIN ST BAKERY · 烘焙馆', open: true },
      { z: 256, side: 1,  wall: '#c7d5e0', trim: '#fffef8', awn: '#9f1239', roof: mSlate, cupola: true,  label: 'PLAZA ICE CREAM · 冰品沙龙' },
      { z: 240, side: 1,  wall: '#e6d8c3', trim: '#ffffff', awn: '#166534', roof: mSlate, cupola: false, label: 'UPTOWN JEWELERS · 珠宝廊' }
    ];
    shopConfigs.forEach((sh) => {
      const sx = 192.5 + sh.side * 15.6, sz = sh.z, faceX = sx - sh.side * 4.8;
      const shopTex = makeVictorianShopTex(sh.wall, sh.trim, sh.awn);
      const shopMat = new T.MeshLambertMaterial({ map: shopTex, emissive: 0x16120c });
      if (sh.open) {
        box(mUpper, 9.4, 9.8, 2.2, sx, Y + 4.9, sz - 5.6);
        box(mUpper, 9.4, 9.8, 2.2, sx, Y + 4.9, sz + 5.6);
        box(mUpper, 1.2, 9.8, 13.4, sx + sh.side * 4.1, Y + 4.9, sz);
        box(mUpper, 1.2, 5.0, 13.4, faceX, Y + 7.4, sz);
        box(mWood, 1.6, 0.85, 1.6, sx, Y + 0.42, sz - 1.6);
        box(mWood, 1.6, 0.85, 1.6, sx, Y + 0.42, sz + 1.6);
      } else {
        addMesh(new T.BoxGeometry(9.6, 9.8, 13.6), shopMat, sx, Y + 4.9, sz, 0, 0, 0, true);
      }
      // Ornate Victorian Bracketed Cornice, 3D Relief Pilasters, Rooftop Dormers & Mansard Slate Roof!
      box(mWhite, 10.2, 0.52, 14.0, sx, Y + 9.95, sz);
      box(sh.roof, 8.8, 2.4, 12.8, sx, Y + 11.4, sz);
      box(mGold, 9.0, 0.18, 13.0, sx, Y + 12.65, sz);
      // 3D Vertical Architectural Pilasters & 2nd-Floor Window Pediments + Mansard Dormers!
      for (const pz of [-6.4, -2.1, 2.1, 6.4]) {
        box(mWhite, 0.36, 9.8, 0.42, faceX - sh.side * 0.14, Y + 4.9, sz + pz);
      }
      for (const dz of [-3.6, 0, 3.6]) {
        box(mWhite, 0.32, 0.24, 2.2, faceX - sh.side * 0.16, Y + 8.95, sz + dz); // Window pediment hood
        box(mWhite, 0.28, 0.18, 2.1, faceX - sh.side * 0.14, Y + 5.75, sz + dz); // Window sill
        // Mansard Roof Dormer Gables
        box(mWhite, 1.2, 1.45, 1.4, faceX + sh.side * 0.65, Y + 11.2, sz + dz);
        mBlueRoof.add(new T.ConeGeometry(1.05, 1.1, 4), M(faceX + sh.side * 0.65, Y + 12.45, sz + dz, 0, Math.PI / 4, 0));
      }
      // Projecting 2nd-Floor Wrought-Iron Victorian Balcony, Sloped Striped Canvas Awning & Hanging Shop Sign!
      box(mWhite, 1.5, 0.18, 12.4, faceX - sh.side * 0.75, Y + 4.85, sz);
      const awnMat = new T.MeshLambertMaterial({ map: makeAwningTex(sh.awn), side: T.DoubleSide });
      addMesh(new T.BoxGeometry(1.7, 0.10, 12.2), awnMat, faceX - sh.side * 0.85, Y + 4.45, sz, 0, 0, sh.side * 0.24);
      box(mIron, 0.08, 0.95, 12.4, faceX - sh.side * 1.45, Y + 5.4, sz);
      // Perpendicular Hanging Victorian Gilded Shop Signboard
      box(mIron, 1.4, 0.08, 0.08, faceX - sh.side * 0.75, Y + 5.9, sz + 4.8);
      box(mGold, 1.15, 0.58, 0.10, faceX - sh.side * 0.95, Y + 5.5, sz + 4.8);
      for (const bz of [-5.8, -2.9, 0, 2.9, 5.8]) {
        box(mIron, 0.08, 4.8, 0.08, faceX - sh.side * 1.4, Y + 2.4, sz + bz);
      }
      if (sh.cupola) {
        const cxp = faceX + sh.side * 0.6, czp = sz + 5.6;
        mWhite.add(cyl(1.35, 1.45, 2.8, 8), M(cxp, Y + 13.6, czp));
        mBlueRoof.add(new T.ConeGeometry(1.55, 3.6, 8), M(cxp, Y + 16.8, czp));
        mGold.add(sph(0.22), M(cxp, Y + 18.7, czp));
      }
    });

    // Ornate Wrought-Iron Main Street Victorian Streetlamps with Hanging Flower Baskets, Park Benches, Town Square Flagpole & Iron Trolley Tracks!
    // Town Square Ceremonial Flagpole (z = 305)
    mWhite.add(cyl(1.4, 1.7, 0.75, 12), M(192.5, Y + 0.38, 305));
    mGold.add(cyl(0.10, 0.14, 12.5, 8), M(192.5, Y + 6.9, 305));
    mGold.add(sph(0.26), M(192.5, Y + 13.3, 305));
    addMesh(new T.PlaneGeometry(2.4, 1.4), crimsonMat, 193.75, Y + 12.1, 305);
    for (let z = 234; z <= 300; z += 11) {
      for (const sd of [-1, 1]) {
        const lx = 192.5 + sd * 8.4;
        mIron.add(cyl(0.08, 0.16, 4.4, 8), M(lx, Y + 2.2, z));
        mLamp.add(sph(0.30, 8), M(lx, Y + 4.6, z));
        mIron.add(new T.ConeGeometry(0.40, 0.34, 6), M(lx, Y + 4.94, z));
        // Ornate Wrought-Iron Hanging Bracket + Terracotta Planter Basket + Multi-Color Floral Bouquet!
        box(mIron, 0.62, 0.06, 0.06, lx - sd * 0.30, Y + 3.92, z);
        mBrick.add(cyl(0.24, 0.14, 0.22, 8), M(lx - sd * 0.54, Y + 3.62, z));
        mLeaf.add(sph(0.20, 6), M(lx - sd * 0.54, Y + 3.78, z));
        mRed.add(sph(0.11, 5), M(lx - sd * 0.64, Y + 3.84, z + 0.08));
        mGold.add(sph(0.10, 5), M(lx - sd * 0.44, Y + 3.86, z - 0.08));
        mWhite.add(sph(0.09, 5), M(lx - sd * 0.54, Y + 3.92, z + 0.02));
        // Victorian Wooden Park Bench beside every other streetlamp!
        if ((z - 234) % 22 === 0) {
          box(mWood, 0.55, 0.12, 2.2, lx + sd * 1.1, Y + 0.52, z + 3.2);
          box(mWood, 0.10, 0.52, 2.2, lx + sd * 1.35, Y + 0.82, z + 3.2);
          box(mIron, 0.55, 0.52, 0.10, lx + sd * 1.1, Y + 0.26, z + 2.2);
          box(mIron, 0.55, 0.52, 0.10, lx + sd * 1.1, Y + 0.26, z + 4.2);
        }
      }
    }
    box(mIron, 0.14, 0.05, 76, 191.5, Y + 0.03, 266);
    box(mIron, 0.14, 0.05, 76, 193.5, Y + 0.03, 266);
    // Festive Disneyland Main Street Overhead Golden Fairy-Light Canopies (0 Extra Draw Calls — merged into mLamp!)
    for (let z = 240; z <= 300; z += 12) {
      for (let i = 0; i <= 10; i++) {
        const u = i / 10, lx = 192.5 - 9.2 + u * 18.4;
        const sag = Math.sin(u * Math.PI) * 1.15;
        mLamp.add(sph(0.14, 5), M(lx, Y + 7.9 - sag, z));
      }
    }

    // Classic Disneyland Main Street Vintage Red-and-Gold Popcorn Cart (x=185.4, z=260)
    box(mRed, 1.2, 1.05, 1.65, 185.4, Y + 0.72, 260);
    box(mGold, 1.28, 0.14, 1.72, 185.4, Y + 1.28, 260);
    box(mLamp, 0.95, 0.78, 1.35, 185.4, Y + 1.72, 260); // Warm glowing glass popcorn case!
    box(mRed, 1.35, 0.26, 1.85, 185.4, Y + 2.24, 260);
    mIron.add(new T.TorusGeometry(0.45, 0.06, 6, 12), M(184.7, Y + 0.45, 260, 0, Math.PI / 2, 0));
    mIron.add(new T.TorusGeometry(0.45, 0.06, 6, 12), M(186.1, Y + 0.45, 260, 0, Math.PI / 2, 0));

    // Detailed Vintage Main Street Streetcar Trolley
    const trolleyGrp = new T.Group();
    trolleyGrp.position.set(192.5, Y + 0.1, 270);
    const tBody = new T.Mesh(new T.BoxGeometry(2.3, 1.35, 5.6), crimsonMat); tBody.position.y = 0.98; trolleyGrp.add(tBody);
    const tTrim = new T.Mesh(new T.BoxGeometry(2.42, 0.18, 5.72), goldMat); tTrim.position.y = 1.62; trolleyGrp.add(tTrim);
    const tRoof = new T.Mesh(new T.BoxGeometry(2.55, 0.38, 6.0), whiteTrimMat); tRoof.position.y = 3.0; trolleyGrp.add(tRoof);
    const tClere = new T.Mesh(new T.BoxGeometry(1.4, 0.35, 4.4), crimsonMat); tClere.position.y = 3.35; trolleyGrp.add(tClere);
    for (const sx of [-1.05, 1.05]) for (const sz of [-2.3, -0.8, 0.8, 2.3]) {
      const post = new T.Mesh(new T.BoxGeometry(0.10, 1.35, 0.10), woodMat); post.position.set(sx, 2.25, sz); trolleyGrp.add(post);
    }
    group.add(trolleyGrp);

    // "Festival of Fantasy" Golden Royal Princess Parade Float rolling gracefully along Main Street!
    const floatGrp = new T.Group();
    floatGrp.position.set(192.5, Y + 0.1, 244);
    const fDeck = new T.Mesh(new T.BoxGeometry(2.6, 0.85, 5.4), goldMat); fDeck.position.y = 0.65; floatGrp.add(fDeck);
    const fArch = new T.Mesh(new T.TorusGeometry(1.35, 0.16, 6, 16, Math.PI), goldMat); fArch.position.set(0, 1.35, 0); floatGrp.add(fArch);
    const fCrown = new T.Mesh(new T.OctahedronGeometry(0.55, 0), warmLampMat); fCrown.position.set(0, 2.85, 0); floatGrp.add(fCrown);
    const fDress = new T.Mesh(new T.ConeGeometry(0.55, 1.25, 8), crimsonMat); fDress.position.set(0, 1.72, 0.4); floatGrp.add(fDress);
    const fHead = new T.Mesh(sph(0.24, 6), whiteTrimMat); fHead.position.set(0, 2.48, 0.4); floatGrp.add(fHead);
    group.add(floatGrp);

    // Classic Disneyland Floating Mickey-Ear Balloon Bouquets on Main Street & Central Hub!
    const balloonMats = [
      new T.MeshPhongMaterial({ color: 0xe11d48, specular: 0xffffff, shininess: 90, transparent: true, opacity: 0.88 }),
      new T.MeshPhongMaterial({ color: 0x2563eb, specular: 0xffffff, shininess: 90, transparent: true, opacity: 0.88 }),
      new T.MeshPhongMaterial({ color: 0xf59e0b, specular: 0xffffff, shininess: 90, transparent: true, opacity: 0.88 }),
      new T.MeshPhongMaterial({ color: 0xec4899, specular: 0xffffff, shininess: 90, transparent: true, opacity: 0.88 })
    ];
    const balloonClusters = [];
    for (const [bx, bz] of [[186.2, 278], [198.8, 250], [184.2, 223]]) {
      const bg = new T.Group(); bg.position.set(bx, Y + 1.8, bz);
      // Vendor ribbon post / tether
      const stem = new T.Mesh(cyl(0.03, 0.03, 2.2, 5), whiteTrimMat); stem.position.y = 1.1; bg.add(stem);
      const offsets = [[0, 2.55, 0], [-0.46, 2.85, 0.22], [0.46, 2.80, -0.20], [0.06, 3.18, 0.34], [-0.28, 3.12, -0.32]];
      offsets.forEach(([ox, oy, oz], idx) => {
        const bm = balloonMats[idx % balloonMats.length];
        const mHead = new T.Mesh(sph(0.28, 8), bm); mHead.position.set(ox, oy, oz); bg.add(mHead);
        const earL = new T.Mesh(sph(0.16, 6), bm); earL.position.set(ox - 0.22, oy + 0.24, oz); bg.add(earL);
        const earR = new T.Mesh(sph(0.16, 6), bm); earR.position.set(ox + 0.22, oy + 0.24, oz); bg.add(earR);
      });
      group.add(bg);
      balloonClusters.push({ grp: bg, phase: bx * 0.5 + bz * 0.2 });
    }

    // Lively Strolling Park Guests walking gently along Main Street sidewalks!
    const guestColors = [0x3b82f6, 0xec4899, 0x10b981, 0xf59e0b, 0x8b5cf6, 0xef4444];
    const guests = [];
    for (let i = 0; i < 6; i++) {
      const gg = new T.Group();
      const side = i % 2 === 0 ? -1 : 1;
      const gx = 192.5 + side * (8.9 + (i % 3) * 0.35);
      const shirt = new T.Mesh(new T.BoxGeometry(0.42, 0.68, 0.26), new T.MeshLambertMaterial({ color: guestColors[i] })); shirt.position.y = 1.02; gg.add(shirt);
      const pants = new T.Mesh(new T.BoxGeometry(0.38, 0.68, 0.24), darkIronMat); pants.position.y = 0.34; gg.add(pants);
      const head = new T.Mesh(sph(0.20, 6), new T.MeshLambertMaterial({ color: 0xf4cfa8 })); head.position.y = 1.56; gg.add(head);
      // Iconic Disneyland Mickey Ears Headband on every second guest!
      if (i % 2 === 0) {
        const e1 = new T.Mesh(sph(0.09, 5), darkIronMat); e1.position.set(-0.14, 1.78, 0); gg.add(e1);
        const e2 = new T.Mesh(sph(0.09, 5), darkIronMat); e2.position.set(0.14, 1.78, 0); gg.add(e2);
      }
      gg.position.set(gx, Y, 240 + i * 9);
      group.add(gg);
      guests.push({ grp: gg, x: gx, baseZ: 242 + i * 8, amp: 14 + (i % 3) * 4, spd: 0.16 + (i % 2) * 0.05, ph: i * 1.1 });
    }

    /* ============================================================================
     * 4. CENTRAL HUB PARTNERS MONUMENT & 18-SPIRE CINDERELLA CASTLE (MAGIC KINGDOM!)
     * ============================================================================ */
    // Central Hub "Partners" Aged-Bronze Monument & Tiered Rose-Garden Fountain Plaza (x=192.5, z=216)
    mWhite.add(cyl(5.4, 5.8, 0.65, 24), M(192.5, Y + 0.32, 216));
    mLeaf.add(cyl(4.6, 5.0, 0.85, 20), M(192.5, Y + 0.55, 216));
    // Sculpted Crimson & Gold Rose Bushes ringing the Partners Plinth
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      const rx = 192.5 + Math.cos(a) * 3.45, rz = 216 + Math.sin(a) * 3.45;
      mLeaf.add(sph(0.46, 6), M(rx, Y + 1.15, rz));
      (i % 2 === 0 ? mRed : mGold).add(sph(0.18, 5), M(rx + Math.cos(a) * 0.2, Y + 1.48, rz + Math.sin(a) * 0.2));
    }
    mWhite.add(cyl(1.45, 1.85, 2.25, 16), M(192.5, Y + 1.5, 216));
    mGold.add(cyl(1.52, 1.52, 0.14, 16), M(192.5, Y + 2.65, 216));
    // Sculpted Aged-Bronze "Partners" Statue (Walt pointing forward + Mickey with iconic round ears holding hands!)
    const partnersGrp = new T.Group();
    partnersGrp.position.set(192.5, Y + 2.72, 216);
    const addB = (geo, px, py, pz, rx, ry, rz) => {
      const m = new T.Mesh(geo, bronzeMat); m.position.set(px, py, pz);
      if (rx || ry || rz) m.rotation.set(rx || 0, ry || 0, rz || 0);
      partnersGrp.add(m);
    };
    // Walt Disney (left figure: tailored suit, legs, right arm extended pointing ahead, left arm holding Mickey's hand)
    addB(cyl(0.10, 0.11, 0.92, 8), -0.52, 0.46, 0);
    addB(cyl(0.10, 0.11, 0.92, 8), -0.26, 0.46, 0);
    addB(cyl(0.24, 0.28, 0.95, 10), -0.39, 1.32, 0); // Coat torso
    addB(sph(0.21, 10), -0.39, 2.02, 0);              // Head
    addB(cyl(0.07, 0.08, 0.85, 8), -0.68, 1.65, 0.36, 1.05, 0, 0.35); // Extended pointing right arm!
    addB(cyl(0.07, 0.08, 0.68, 8), -0.08, 1.25, 0.05, 0, 0, 0.42);    // Left arm reaching to Mickey
    // Mickey Mouse (right figure: iconic round ears, head, torso, legs, hand raised to Walt!)
    addB(cyl(0.08, 0.09, 0.56, 8), 0.26, 0.28, 0);
    addB(cyl(0.08, 0.09, 0.56, 8), 0.48, 0.28, 0);
    addB(sph(0.22, 10), 0.37, 0.78, 0);               // Torso
    addB(sph(0.21, 10), 0.37, 1.22, 0);               // Head
    addB(sph(0.13, 8), 0.18, 1.44, 0);                // Iconic Mickey Left Ear!
    addB(sph(0.13, 8), 0.56, 1.44, 0);                // Iconic Mickey Right Ear!
    addB(cyl(0.06, 0.07, 0.48, 6), 0.12, 0.98, 0.04, 0, 0, -0.55); // Hand holding Walt's!
    group.add(partnersGrp);

    // Twin Symmetrical Flanking 2-Tier Classical Marble Hub Fountains + Live Sparkling Water Spray!
    const fountainSprays = [];
    for (const sd of [-1, 1]) {
      const fx = 192.5 + sd * 12.5, fz = 212;
      mWhite.add(cyl(3.2, 3.5, 0.55, 20), M(fx, Y + 0.28, fz));
      mWhite.add(cyl(0.55, 0.72, 1.35, 12), M(fx, Y + 1.05, fz));
      mWhite.add(cyl(1.45, 0.65, 0.38, 16), M(fx, Y + 1.68, fz)); // Lower scalloped bowl
      mWhite.add(cyl(0.28, 0.36, 0.95, 10), M(fx, Y + 2.25, fz));
      mWhite.add(cyl(0.75, 0.32, 0.28, 14), M(fx, Y + 2.70, fz)); // Upper finial bowl
      addMesh(new T.CircleGeometry(2.95, 20), waterJetMat, fx, Y + 0.58, fz, -Math.PI / 2);
      // Sparkling animated water droplets cascading from the fountain crown!
      const pCount = 26, pos = new Float32Array(pCount * 3), phase = [];
      for (let k = 0; k < pCount; k++) {
        phase.push({ ang: (k / pCount) * Math.PI * 2 + Math.random() * 0.3, off: Math.random(), r: 0.75 + Math.random() * 1.35 });
      }
      const fGeo = new T.BufferGeometry();
      fGeo.setAttribute('position', new T.BufferAttribute(pos, 3));
      const fMat = new T.PointsMaterial({ color: 0xe0f2fe, size: 0.48, map: sparkTex, transparent: true, opacity: 0.85, blending: T.AdditiveBlending, depthWrite: false });
      const fPts = new T.Points(fGeo, fMat);
      fPts.position.set(fx, Y + 2.85, fz);
      group.add(fPts);
      fountainSprays.push({ geo: fGeo, phase });
    }

    // REALISTIC WALT DISNEY WORLD CINDERELLA CASTLE (x=192.5, z=176.5 — 18 Asymmetric Spires, Battered Stone Fortress Base, Royal Clock, Gothic Windows & Enterable Breezeway!)
    const cx = 192.5, cz = 176.5;
    // Arched Stone Moat Bridge Parapets & Ornate Lantern Posts (z=192..203) + Graceful Moat Swan Boats!
    const swanBoats = [];
    for (let i = 0; i < 2; i++) {
      const sg = new T.Group();
      const sHull = new T.Mesh(sph(0.95, 8), whiteTrimMat); sHull.scale.set(0.85, 0.45, 1.55); sHull.position.y = 0.25; sg.add(sHull);
      const sNeck = new T.Mesh(cyl(0.12, 0.16, 1.15, 6), whiteTrimMat); sNeck.position.set(0, 0.95, 1.05); sNeck.rotation.x = 0.25; sg.add(sNeck);
      const sHead = new T.Mesh(sph(0.18, 6), whiteTrimMat); sHead.position.set(0, 1.52, 1.22); sg.add(sHead);
      const sCrown = new T.Mesh(new T.ConeGeometry(0.12, 0.24, 5), goldMat); sCrown.position.set(0, 1.72, 1.22); sg.add(sCrown);
      group.add(sg);
      swanBoats.push({ grp: sg, phase: i * Math.PI });
    }
    for (const sd of [-1, 1]) {
      box(mBase, 0.65, 1.25, 12.5, cx + sd * 4.0, Y + 0.62, 197.5);
      box(mWhite, 0.85, 0.22, 12.7, cx + sd * 4.0, Y + 1.30, 197.5);
      for (const lz of [193, 197.5, 202.5]) {
        mIron.add(cyl(0.08, 0.12, 1.4, 6), M(cx + sd * 4.0, Y + 2.0, lz));
        mLamp.add(sph(0.24, 6), M(cx + sd * 4.0, Y + 2.8, lz));
      }
    }
    // Tier 1: Battered Dove-Grey Fortress Keep Base (split around 5.6m x 7.0m grand Gothic Breezeway!)
    box(mBase, 11.2, 11.2, 20.0, cx - 8.4, Y + 5.6, cz);
    box(mBase, 11.2, 11.2, 20.0, cx + 8.4, Y + 5.6, cz);
    box(mBase, 5.6, 4.2, 20.0, cx, Y + 9.1, cz);
    // Projecting Stone Fortress Buttresses + Carved Limestone Crenellations along Front Parapet!
    for (const bx of [-13.8, -9.2, -3.2, 3.2, 9.2, 13.8]) {
      box(mBase, 1.2, 11.5, 1.5, cx + bx, Y + 5.75, cz + 10.2);
      mWhite.add(new T.ConeGeometry(0.65, 2.2, 4), M(cx + bx, Y + 12.6, cz + 10.2));
    }
    for (let mx = -12.5; mx <= 12.5; mx += 2.5) {
      if (Math.abs(mx) < 3.0) continue;
      box(mBase, 1.15, 0.95, 0.95, cx + mx, Y + 11.65, cz + 9.8);
      box(mWhite, 1.28, 0.20, 1.08, cx + mx, Y + 12.2, cz + 9.8);
    }
    // Warm Golden Sconce Lanterns flanking the Cinderella Castle Gothic Breezeway!
    for (const sd of [-1, 1]) {
      mIron.add(cyl(0.08, 0.12, 0.85, 6), M(cx + sd * 3.15, Y + 3.6, cz + 10.4));
      mLamp.add(sph(0.24, 6), M(cx + sd * 3.15, Y + 4.15, cz + 10.4));
    }
    // Breezeway Interior Checkered Carpet, Vault Ribs, Crystal Chandelier & Glittering Cinderella Storybook Mosaic Murals!
    box(mRed, 3.6, 0.05, 21.0, cx, Y + 0.03, cz);
    mGold.add(new T.TorusGeometry(1.4, 0.10, 6, 16), M(cx, Y + 5.8, cz, Math.PI / 2, 0, 0));
    mLamp.add(sph(0.32), M(cx, Y + 5.8, cz));
    {
      const mc = cvs(256, 128), mx = mc.getContext('2d');
      const mg = mx.createLinearGradient(0, 0, 256, 128);
      mg.addColorStop(0, '#1e3a8a'); mg.addColorStop(0.5, '#6366f1'); mg.addColorStop(1, '#312e81');
      mx.fillStyle = mg; mx.fillRect(0, 0, 256, 128);
      mx.strokeStyle = '#f5c542'; mx.lineWidth = 6; mx.strokeRect(5, 5, 246, 118);
      // Golden fairy carriage & castle mosaic silhouette
      mx.fillStyle = '#fde047'; mx.beginPath(); mx.arc(128, 74, 24, 0, Math.PI * 2); mx.fill();
      mx.fillStyle = '#93c5fd'; mx.beginPath(); mx.arc(128, 74, 14, 0, Math.PI * 2); mx.fill();
      mx.fillStyle = '#fef3c7'; for (let i = 0; i < 12; i++) { mx.beginPath(); mx.arc(24 + i * 19, 24 + (i % 2) * 10, 3, 0, Math.PI * 2); mx.fill(); }
      const mTex = finTex(mc, false);
      const mMat = new T.MeshLambertMaterial({ map: mTex, emissiveMap: mTex, emissive: 0xffe4a0, emissiveIntensity: 0.45 });
      for (const sd of [-1, 1]) {
        addMesh(new T.PlaneGeometry(7.2, 3.6), mMat, cx + sd * 2.74, Y + 3.4, cz, 0, -sd * Math.PI / 2);
      }
    }
    // Pointed Gothic Entrance Archway + Iconic Cinderella Castle Royal Clock (`11:55`!) right above the Arch!
    addRibSeg(mGold, [cx - 2.8, Y + 5.2, cz + 10.25], [cx, Y + 8.6, cz + 10.25], 0.18, 0.14);
    addRibSeg(mGold, [cx + 2.8, Y + 5.2, cz + 10.25], [cx, Y + 8.6, cz + 10.25], 0.18, 0.14);
    mGold.add(new T.TorusGeometry(1.55, 0.18, 8, 20), M(cx, Y + 14.2, cz + 8.15));
    addMesh(new T.CircleGeometry(1.42, 20), blueSlateMat, cx, Y + 14.2, cz + 8.10);
    box(mGold, 0.10, 0.95, 0.08, cx - 0.15, Y + 14.55, cz + 8.20, 0, 0, 0.25); // 11:55 minute hand!
    box(mGold, 0.12, 0.72, 0.08, cx - 0.08, Y + 14.48, cz + 8.20, 0, 0, 0.08); // 11:55 hour hand!

    // Tier 2 & 3: Warm Ivory & Soft Blush-Limestone French-Château Upper Palace Tiers + Gothic Tracery Windows!
    box(mUpper, 23.0, 8.2, 16.0, cx, Y + 15.2, cz - 0.2);
    box(mWhite, 23.8, 0.55, 16.8, cx, Y + 11.3, cz - 0.2);
    box(mWhite, 23.6, 0.55, 16.6, cx, Y + 19.4, cz - 0.2);
    box(mBlush, 14.8, 7.6, 12.2, cx, Y + 23.2, cz - 1.2);
    box(mWhite, 15.4, 0.50, 12.8, cx, Y + 27.1, cz - 1.2);
    // Pointed Gothic Castle Windows across the Upper Facade!
    for (const [wx, wy, ww, wh] of [[-7.2, 15.2, 2.0, 4.4], [7.2, 15.2, 2.0, 4.4], [-4.2, 23.0, 1.8, 4.0], [0, 23.4, 2.2, 4.6], [4.2, 23.0, 1.8, 4.0]]) {
      addMesh(new T.PlaneGeometry(ww, wh), castleWinMat, cx + wx, Y + wy, cz + (wy > 20 ? 5.02 : 7.92));
    }

    // 18 ASYMMETRIC SOARING GOTHIC-RENAISSANCE TOWERS (True Cinderella Castle Magic Kingdom Silhouette — apex 54m!)
    const cindTowers = [
      // Towering Central Great Spire (apex Y + 54!)
      { dx: 1.2,   dz: -1.8, y0: 27.0, r: 2.9, h: 12.5, spH: 14.5, mat: mUpper },
      // Tall Asymmetric Companion Spire (slightly left & forward, classic Cinderella Castle profile!)
      { dx: -4.8,  dz: -0.5, y0: 25.0, r: 2.3, h: 11.0, spH: 12.2, mat: mBlush },
      // Mid-Upper Flanking Spires
      { dx: 6.4,   dz: 0.2,  y0: 21.0, r: 2.1, h: 10.5, spH: 10.5, mat: mUpper },
      { dx: -7.6,  dz: 4.8,  y0: 14.0, r: 2.1, h: 11.5, spH: 10.2, mat: mUpper },
      { dx: 7.6,   dz: 4.8,  y0: 14.0, r: 2.1, h: 11.5, spH: 10.2, mat: mUpper },
      // Front Entrance Framing Turrets
      { dx: -4.0,  dz: 9.2,  y0: 9.0,  r: 1.45, h: 9.2, spH: 7.6,  mat: mBlush },
      { dx: 4.0,   dz: 9.2,  y0: 9.0,  r: 1.45, h: 9.2, spH: 7.6,  mat: mBlush },
      // Outer Fortress Bastion Corner Towers
      { dx: -13.6, dz: 8.6,  y0: 0,    r: 2.6, h: 14.5, spH: 9.8,  mat: mBase },
      { dx: 13.6,  dz: 8.6,  y0: 0,    r: 2.6, h: 14.5, spH: 9.8,  mat: mBase },
      { dx: -13.4, dz: -8.2, y0: 0,    r: 2.5, h: 16.5, spH: 10.4, mat: mBase },
      { dx: 13.4,  dz: -8.2, y0: 0,    r: 2.5, h: 16.5, spH: 10.4, mat: mBase },
      // High Slender Bartizan Turrets & Rear Choir Spires
      { dx: -10.8, dz: 1.5,  y0: 11.0, r: 1.5, h: 10.0, spH: 8.2,  mat: mUpper },
      { dx: 10.8,  dz: 1.5,  y0: 11.0, r: 1.5, h: 10.0, spH: 8.2,  mat: mUpper },
      { dx: -6.2,  dz: -7.2, y0: 16.0, r: 2.0, h: 11.5, spH: 9.5,  mat: mUpper },
      { dx: 6.2,   dz: -7.2, y0: 16.0, r: 2.0, h: 11.5, spH: 9.5,  mat: mUpper },
      { dx: 0,     dz: -9.0, y0: 18.0, r: 2.2, h: 12.0, spH: 11.0, mat: mBlush },
      { dx: -2.4,  dz: 5.5,  y0: 19.0, r: 1.25, h: 7.2, spH: 6.4,  mat: mUpper },
      { dx: 3.4,   dz: 5.5,  y0: 19.0, r: 1.25, h: 7.2, spH: 6.4,  mat: mUpper }
    ];
    cindTowers.forEach((tw) => {
      const tx = cx + tw.dx, tz = cz + tw.dz;
      tw.mat.add(cyl(tw.r * 0.94, tw.r, tw.h, 12), M(tx, Y + tw.y0 + tw.h / 2, tz));
      // Corbeled White-Stone Machicolation Crown + Golden Collar Band!
      mWhite.add(cyl(tw.r * 1.15, tw.r * 1.02, 0.72, 12), M(tx, Y + tw.y0 + tw.h, tz));
      mGold.add(cyl(tw.r * 1.18, tw.r * 1.18, 0.20, 12), M(tx, Y + tw.y0 + tw.h + 0.42, tz));
      // Scalloped Royal-Blue Slate Conical Spire + Golden Filigree Finial & Pennant!
      mBlueRoof.add(new T.ConeGeometry(tw.r * 1.16, tw.spH, 12), M(tx, Y + tw.y0 + tw.h + 0.4 + tw.spH / 2, tz));
      const apexY = Y + tw.y0 + tw.h + 0.4 + tw.spH;
      mGold.add(cyl(0.08, 0.14, 2.4, 6), M(tx, apexY + 1.1, tz));
      mGold.add(sph(0.24), M(tx, apexY + 0.2, tz));
      // Golden dormer accent & royal pennant on major spires
      if (tw.r >= 2.1) {
        box(mGold, 0.55, 1.35, 0.65, tx, Y + tw.y0 + tw.h + tw.spH * 0.25, tz + tw.r * 0.85);
        box(mRed, 1.15, 0.42, 0.08, tx + 0.62, apexY + 1.75, tz);
      }
    });

    // Soft Feathered Architectural Nighttime Illumination for Cinderella Castle (Real PointLights + Soft Radial Glow Wash — ZERO sharp cones!)
    const castleNightBlue = new T.PointLight(0x60a5fa, 0, 62, 1.3);
    castleNightBlue.position.set(cx, Y + 22, cz + 15);
    group.add(castleNightBlue);
    const castleNightGold = new T.PointLight(0xfde68a, 0, 44, 1.4);
    castleNightGold.position.set(cx, Y + 10, cz + 14);
    group.add(castleNightGold);
    const castleBeams = [];
    const beamMat = new T.MeshBasicMaterial({ map: glowWashTex, transparent: true, opacity: 0.0, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide });
    for (const bx of [-7.5, 0, 7.5]) {
      castleBeams.push(addMesh(new T.PlaneGeometry(16, 36), beamMat, cx + bx, Y + 20, cz + 10.6));
    }

    /* ============================================================================
     * 5. FANTASYLAND + RIDE A: PRINCE CHARMING REGAL CARROUSEL (x=192.5, z=122.5)
     * ============================================================================ */
    const carX = 192.5, carZ = 122.5;
    // Stepped Cream-Marble Pavilion Platform
    mWhite.add(cyl(8.6, 9.2, 0.55, 24), M(carX, Y + 0.28, carZ));
    mUpper.add(cyl(8.2, 8.3, 0.25, 24), M(carX, Y + 0.65, carZ));
    const carouselSpinGrp = new T.Group();
    carouselSpinGrp.position.set(carX, Y + 0.78, carZ);
    // Mirrored Ornate Cream-and-Gold Center Column + Renaissance Painted Striped Tent Canopy!
    const carCol = new T.Mesh(cyl(1.5, 1.75, 6.0, 16), whiteTrimMat); carCol.position.y = 3.0; carouselSpinGrp.add(carCol);
    const carColG = new T.Mesh(cyl(1.85, 1.85, 0.35, 16), goldMat); carColG.position.y = 5.8; carouselSpinGrp.add(carColG);
    const carRoof = new T.Mesh(new T.ConeGeometry(8.8, 4.2, 24), carouselCanopyMat); carRoof.position.y = 8.1; carouselSpinGrp.add(carRoof);
    const carValance = new T.Mesh(cyl(8.8, 8.8, 0.95, 24), carouselCanopyMat); carValance.position.y = 5.75; carouselSpinGrp.add(carValance);
    const carFin = new T.Mesh(new T.ConeGeometry(0.42, 2.4, 8), goldMat); carFin.position.y = 11.3; carouselSpinGrp.add(carFin);
    // 24 Warm-White Twinkling Fairy Bulbs around Canopy Valance
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      const bulb = new T.Mesh(sph(0.14, 6), warmLampMat);
      bulb.position.set(Math.cos(a) * 8.85, 5.55, Math.sin(a) * 8.85);
      carouselSpinGrp.add(bulb);
    }
    // 10 Sculpted Multi-Part Prancing Royal Steeds (smooth lacquered porcelain-enamel, arched neck, gilded saddle & legs — ZERO brick textures!)
    const horseMats = horsePorcelainMats;
    const carouselHorses = [];
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      const rH = (i % 2 === 0) ? 6.4 : 4.8;
      const pole = new T.Mesh(cyl(0.06, 0.06, 5.8, 6), goldMat);
      pole.position.set(Math.cos(a) * rH, 2.9, Math.sin(a) * rH);
      carouselSpinGrp.add(pole);

      const hGrp = new T.Group();
      hGrp.position.set(Math.cos(a) * rH, 1.65, Math.sin(a) * rH);
      hGrp.rotation.y = -a;
      const hm = horseMats[i % horseMats.length];
      // Sculpted rounded torso + saddle blanket + arched neck + tapered muzzle + prancing legs + flowing tail!
      const torso = new T.Mesh(cyl(0.32, 0.34, 1.35, 8), hm); torso.rotation.x = Math.PI / 2; hGrp.add(torso);
      const chest = new T.Mesh(sph(0.34, 8), hm); chest.position.set(0, 0.04, 0.62); hGrp.add(chest);
      const rump = new T.Mesh(sph(0.35, 8), hm); rump.position.set(0, 0.02, -0.62); hGrp.add(rump);
      const saddle = new T.Mesh(new T.BoxGeometry(0.66, 0.14, 0.62), i % 2 === 0 ? crimsonMat : blueSlateMat); saddle.position.y = 0.32; hGrp.add(saddle);
      const neck = new T.Mesh(cyl(0.16, 0.26, 0.88, 8), hm); neck.position.set(0, 0.48, 0.78); neck.rotation.x = 0.42; hGrp.add(neck);
      const head = new T.Mesh(cyl(0.10, 0.17, 0.56, 8), hm); head.position.set(0, 0.82, 1.08); head.rotation.x = 1.25; hGrp.add(head);
      const tail = new T.Mesh(cyl(0.05, 0.12, 0.75, 6), goldMat); tail.position.set(0, -0.15, -0.95); tail.rotation.x = -0.45; hGrp.add(tail);
      for (const [lx, lz, rot] of [[-0.18, 0.55, -0.45], [0.18, 0.55, -0.15], [-0.18, -0.55, 0.35], [0.18, -0.55, 0.15]]) {
        const leg = new T.Mesh(cyl(0.06, 0.08, 0.85, 6), hm); leg.position.set(lx, -0.45, lz); leg.rotation.x = rot; hGrp.add(leg);
      }
      carouselSpinGrp.add(hGrp);
      carouselHorses.push({ grp: hGrp, phase: i * (Math.PI * 0.4), angle: a, radius: rH });
    }
    group.add(carouselSpinGrp);

    // Fantasyland European Timber-Framed Storybook Cottages & Magic Wishing Well
    [[154, 108, mBlush, mBlueRoof], [230, 108, mUpper, mSlate]].forEach(([fx, fz, wm, rm]) => {
      box(wm, 12.0, 7.2, 10.8, fx, Y + 3.6, fz);
      // Half-timbered Tudor oak beams across facade
      for (const tx of [-5.8, -2.0, 2.0, 5.8]) box(mWood, 0.28, 7.2, 0.25, fx + tx, Y + 3.6, fz + 5.45);
      box(mWood, 12.2, 0.28, 0.25, fx, Y + 3.8, fz + 5.45);
      rm.add(new T.ConeGeometry(8.6, 6.8, 4), M(fx, Y + 10.6, fz, 0, Math.PI / 4, 0));
      box(mWood, 2.4, 3.8, 0.28, fx, Y + 1.9, fz + 5.45);
      addMesh(new T.PlaneGeometry(1.8, 2.4), castleWinMat, fx - 3.6, Y + 4.4, fz + 5.48);
      addMesh(new T.PlaneGeometry(1.8, 2.4), castleWinMat, fx + 3.6, Y + 4.4, fz + 5.48);
    });
    mBase.add(cyl(1.4, 1.6, 1.2, 12), M(174, Y + 0.6, 134));
    addMesh(new T.CircleGeometry(1.2, 12), waterJetMat, 174, Y + 1.15, 134, -Math.PI / 2);
    const magicCrystal = addMesh(new T.OctahedronGeometry(0.52, 0), cyanNeonMat, 174, Y + 2.5, 134);
    // Rapunzel's Storybook Stone Lantern Tower (x=236, z=132) + 10 Floating Golden Sky Lanterns bobbing over Fantasyland!
    mBase.add(cyl(2.1, 2.5, 14.5, 12), M(236, Y + 7.25, 132));
    mUpper.add(cyl(2.7, 2.3, 4.2, 12), M(236, Y + 16.5, 132));
    mBlueRoof.add(new T.ConeGeometry(3.1, 6.2, 12), M(236, Y + 21.7, 132));
    mGold.add(sph(0.32), M(236, Y + 25.0, 132));
    const skyLanterns = [];
    for (let i = 0; i < 10; i++) {
      const lx = 172 + (i * 13) % 68, lz = 104 + (i * 19) % 36, ly = Y + 12 + (i % 4) * 2.8;
      const lm = addMesh(cyl(0.24, 0.18, 0.48, 8), warmLampMat, lx, ly, lz);
      skyLanterns.push({ mesh: lm, baseY: ly, phase: i * 0.9 });
    }

    /* ============================================================================
     * 6. ADVENTURELAND + RIDE B: JUNGLE CRUISE EXPEDITION LAUNCH (dock x=126.5, z=204.5)
     * ============================================================================ */
    // Adventureland Weathered Timber & Tiki Entry Gateway (x=148, z=204)
    for (const sd of [-1, 1]) {
      mWood.add(cyl(0.55, 0.72, 7.8, 8), M(148, Y + 3.9, 204 + sd * 6.0));
      mGold.add(sph(0.36), M(148, Y + 8.1, 204 + sd * 6.0));
    }
    box(mWood, 1.2, 1.2, 13.4, 148, Y + 7.4, 204);
    addSign(148.7, Y + 7.4, 204, 9.0, '探险世界 · ADVENTURELAND', 'JUNGLE CRUISE & ANCIENT MAYAN TEMPLE', '#2e1d10', '#e2b13c', Math.PI / 2);

    // Weathered Timber Jungle Cruise Boathouse Dock (x=127.5, z=204.5)
    box(mWood, 7.8, 0.45, 7.8, 127.5, Y - 0.1, 204.5);
    for (const dx of [-3.4, 3.4]) for (const dz of [-3.4, 3.4]) mWood.add(cyl(0.18, 0.22, 4.6, 6), M(127.5 + dx, Y + 2.2, 204.5 + dz));
    mSlate.add(new T.ConeGeometry(5.8, 2.4, 4), M(127.5, Y + 5.6, 204.5, 0, Math.PI / 4, 0));

    // Multi-Tier Cascading Jungle Waterfall plunging into the NW River Bend (x=82, z=172)
    addMesh(new T.PlaneGeometry(7.8, 14.8), waterJetMat, 82, Y + 3.4, 173, 0.26, 0.42, 0);
    addMesh(new T.PlaneGeometry(4.4, 10.5), waterJetMat, 86, Y + 1.8, 170, 0.22, 0.35, 0);
    addMesh(new T.CircleGeometry(5.2, 16), whiteTrimMat, 84, world.WATER_Y + 0.08, 176, -Math.PI / 2);

    // Mossy Ancient Mayan Step-Pyramid Temple Ruins on the River Island (x=100, z=200)!
    for (let tier = 0; tier < 5; tier++) {
      const sz = 16.5 - tier * 2.6;
      box(mMayan, sz, 2.2, sz, 100, Y + tier * 2.2 + 1.1, 200);
    }
    // Ceremonial Stone Staircase climbing all 4 sides of the Mayan Pyramid + Ancient Carved Stone River Archway & Flickering Tiki Torches!
    box(mMayan, 3.4, 11.0, 14.5, 100, Y + 5.2, 200, 0, 0, 0);
    box(mMayan, 4.6, 3.6, 4.6, 100, Y + 12.8, 200);
    const templeIdol = addMesh(new T.OctahedronGeometry(0.95, 0), goldMat, 100, Y + 15.8, 200);
    // Ancient Stone River Archway that the Jungle Cruise Boat glides directly underneath (x=100, z=222)!
    box(mMayan, 2.2, 8.5, 2.4, 100, Y + 1.5, 217.0);
    box(mMayan, 2.2, 8.5, 2.4, 100, Y + 1.5, 227.0);
    box(mMayan, 2.6, 2.2, 12.6, 100, Y + 6.4, 222.0);
    // Tiki Torch Posts lining the Adventureland Walkway
    for (const [tx, tz] of [[144, 199], [144, 209], [134, 199], [134, 209]]) {
      mWood.add(cyl(0.10, 0.14, 2.8, 6), M(tx, Y + 1.4, tz));
      mLamp.add(new T.ConeGeometry(0.24, 0.55, 6), M(tx, Y + 3.05, tz));
    }

    // RIDE B — Detailed Jungle Cruise Expedition Launch (weathered timber hull, striped canvas awning, bow lantern & cargo crates!)
    const boatGrp = new T.Group();
    const bHull = new T.Mesh(new T.BoxGeometry(2.8, 0.85, 6.4), woodMat); bHull.position.y = 0.35; boatGrp.add(bHull);
    const bBow = new T.Mesh(new T.ConeGeometry(1.42, 1.8, 4), woodMat); bBow.rotation.set(Math.PI / 2, Math.PI / 4, 0); bBow.position.set(0, 0.45, 4.1); boatGrp.add(bBow);
    const bDeck = new T.Mesh(new T.BoxGeometry(2.5, 0.16, 5.6), castleUpperMat); bDeck.position.y = 0.82; boatGrp.add(bDeck);
    const bCanopy = new T.Mesh(new T.BoxGeometry(2.75, 0.22, 4.8), carouselCanopyMat); bCanopy.position.y = 2.95; boatGrp.add(bCanopy);
    for (const sx of [-1.18, 1.18]) for (const sz of [-2.1, 0, 2.1]) {
      const p = new T.Mesh(cyl(0.06, 0.06, 2.1, 6), darkIronMat); p.position.set(sx, 1.9, sz); boatGrp.add(p);
    }
    const bCrate = new T.Mesh(new T.BoxGeometry(0.7, 0.65, 0.7), woodMat); bCrate.position.set(-0.6, 1.2, 2.2); boatGrp.add(bCrate);
    const bLamp = new T.Mesh(sph(0.22, 8), warmLampMat); bLamp.position.set(0, 1.38, 3.4); boatGrp.add(bLamp);
    boatGrp.position.set(123.5, world.WATER_Y + 0.05, 200);
    group.add(boatGrp);

    /* ============================================================================
     * 7. TOMORROWLAND + RIDE C: GOLDEN PLANETARY ASTRO ORBITER & 32-RIB SPACE MOUNTAIN
     * ============================================================================ */
    // Tomorrowland Sleek Googie Futuristic Entry Arch (x=236, z=202)
    for (const sd of [-1, 1]) {
      box(mChrome, 1.3, 8.6, 1.8, 236, Y + 4.3, 202 + sd * 6.5);
      box(mCyan, 0.24, 8.0, 0.24, 235.25, Y + 4.3, 202 + sd * 6.5);
    }
    box(mChrome, 1.5, 1.1, 14.6, 236, Y + 8.8, 202);
    addSign(235.1, Y + 8.8, 202, 9.4, '未来世界 · TOMORROWLAND', 'ASTRO ORBITER · SPACE MOUNTAIN · PEOPLEMOVER', '#0c2d48', '#38bdf8', -Math.PI / 2);

    // RIDE C — Magic Kingdom Golden Planetary Astro Orbiter (x=266.5, z=194.5 — Brass Orrery Rings + Orbiting Sleek Starjets!)
    const sjX = 266.5, sjZ = 194.5;
    mChrome.add(cyl(4.6, 5.6, 1.3, 24), M(sjX, Y + 0.65, sjZ));
    mCyan.add(new T.TorusGeometry(5.0, 0.14, 6, 24), M(sjX, Y + 1.35, sjZ, Math.PI / 2, 0, 0));
    const starjetHubGrp = new T.Group();
    starjetHubGrp.position.set(sjX, Y + 1.3, sjZ);
    const sjSpire = new T.Mesh(cyl(1.15, 2.3, 15.2, 16), chromeMat); sjSpire.position.y = 7.6; starjetHubGrp.add(sjSpire);
    // Iconic Magic Kingdom Intersecting Golden Planetary Orrery Rings crowning the Astro Orbiter!
    for (const [rx, rz] of [[0.55, 0.25], [-0.45, 0.72], [0.15, -0.62]]) {
      const ring = new T.Mesh(new T.TorusGeometry(3.8, 0.14, 8, 28), goldMat);
      ring.position.y = 14.8; ring.rotation.set(rx, 0, rz); starjetHubGrp.add(ring);
    }
    const sjSun = new T.Mesh(sph(1.45, 14), goldMat); sjSun.position.y = 14.8; starjetHubGrp.add(sjSun);
    const starjetShips = [];
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const armGrp = new T.Group(); armGrp.position.y = 6.8; armGrp.rotation.y = a;
      const arm = new T.Mesh(new T.BoxGeometry(9.8, 0.22, 0.22), chromeMat); arm.position.set(4.9, 0, 0); armGrp.add(arm);
      const ship = new T.Group(); ship.position.set(9.8, 0, 0);
      const fus = new T.Mesh(cyl(0.46, 0.72, 3.4, 12), chromeMat); fus.rotation.x = Math.PI / 2; ship.add(fus);
      const nose = new T.Mesh(new T.ConeGeometry(0.46, 1.2, 12), crimsonMat); nose.rotation.x = Math.PI / 2; nose.position.z = 2.3; ship.add(nose);
      const wing = new T.Mesh(new T.BoxGeometry(2.6, 0.10, 0.95), goldMat); wing.position.set(0, 0, -0.35); ship.add(wing);
      const thr = new T.Mesh(sph(0.32, 8), cyanNeonMat); thr.position.set(0, 0, -1.75); ship.add(thr);
      armGrp.add(ship); starjetHubGrp.add(armGrp);
      starjetShips.push({ armGrp, ship, baseAngle: a });
    }
    group.add(starjetHubGrp);

    // Authentic 32-Flute Gleaming White Concrete SPACE MOUNTAIN Dome (x=298, z=174)!
    const smX = 298, smZ = 174;
    mWhite.add(cyl(15.2, 16.5, 3.8, 32), M(smX, Y + 1.9, smZ));
    mWhite.add(new T.ConeGeometry(15.6, 20.5, 32), M(smX, Y + 14.0, smZ));
    mChrome.add(cyl(3.8, 5.2, 2.2, 16), M(smX, Y + 22.8, smZ)); // Space Mountain iconic upper crown cap!
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      addRibSeg(mChrome, [smX + Math.cos(a) * 15.8, Y + 3.6, smZ + Math.sin(a) * 15.8], [smX + Math.cos(a) * 3.8, Y + 23.6, smZ + Math.sin(a) * 3.8], 0.34, 0.18);
    }
    mCyan.add(new T.TorusGeometry(15.8, 0.22, 6, 32), M(smX, Y + 3.8, smZ, Math.PI / 2, 0, 0));
    // Space Mountain Illuminated Entry Concourse & Retro-Futuristic Chrome Palm Sculptures!
    box(mChrome, 6.2, 4.4, 5.2, smX - 14.5, Y + 2.2, smZ + 10.2, 0, -0.58, 0);
    box(mCyan, 6.4, 0.28, 5.4, smX - 14.5, Y + 4.5, smZ + 10.2, 0, -0.58, 0);
    addSign(smX - 16.5, Y + 5.6, smZ + 11.8, 7.6, '太空山 · SPACE MOUNTAIN', 'HIGH-SPEED GALACTIC ROLLER COASTER', '#0f172a', '#38bdf8', -0.58);
    for (const [px, pz] of [[252, 212], [282, 212], [250, 178]]) {
      mChrome.add(cyl(0.22, 0.36, 7.2, 8), M(px, Y + 3.6, pz));
      for (let f = 0; f < 6; f++) {
        const fa = (f / 6) * Math.PI * 2;
        box(mCyan, 0.36, 0.10, 3.2, px + Math.cos(fa) * 1.4, Y + 7.2, pz + Math.sin(fa) * 1.4, 0.28, Math.PI / 2 - fa, 0);
      }
    }

    // Elevated Tomorrowland PeopleMover Concrete Guideway Track + Animated Sleek PeopleMover Tram!
    mChrome.add(new T.TorusGeometry(21.5, 0.42, 6, 36), M(sjX, Y + 5.6, sjZ, Math.PI / 2, 0, 0));
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      mChrome.add(cyl(0.45, 0.58, 5.6, 8), M(sjX + Math.cos(a) * 21.5, Y + 2.8, sjZ + Math.sin(a) * 21.5));
    }
    const pmCars = [];
    for (let c = 0; c < 3; c++) {
      const cg = new T.Group();
      const b = new T.Mesh(new T.BoxGeometry(1.6, 1.15, 3.4), c === 0 ? cyanNeonMat : whiteTrimMat); b.position.y = 0.72; cg.add(b);
      group.add(cg); pmCars.push(cg);
    }
    // Hologram Console & Robot (x=280, z=226)!
    box(mChrome, 5.4, 1.2, 5.4, 280, Y + 0.6, 226);
    mCyan.add(new T.TorusGeometry(2.5, 0.10, 6, 20), M(280, Y + 1.25, 226, Math.PI / 2, 0, 0));
    const holoCity = new T.Group(); holoCity.position.set(280, Y + 2.4, 226);
    for (const [hx, hz, hh] of [[0, 0, 3.0], [-1.1, 0.6, 1.9], [1.1, -0.5, 2.2], [0.4, 1.1, 1.6], [-0.8, -0.9, 1.7]]) {
      const b = new T.Mesh(new T.BoxGeometry(0.55, hh, 0.55), holoMat); b.position.set(hx, hh / 2, hz); holoCity.add(b);
    }
    group.add(holoCity);
    const robotGrp = new T.Group(); robotGrp.position.set(275.5, Y, 226);
    const rBody = new T.Mesh(cyl(0.45, 0.55, 1.3, 10), chromeMat); rBody.position.y = 0.95; robotGrp.add(rBody);
    const rHead = new T.Mesh(sph(0.42, 10), whiteTrimMat); rHead.position.y = 1.92; robotGrp.add(rHead);
    const rVisor = new T.Mesh(new T.BoxGeometry(0.56, 0.18, 0.16), cyanNeonMat); rVisor.position.set(0, 1.94, 0.38); robotGrp.add(rVisor);
    const rArm = new T.Mesh(new T.BoxGeometry(0.18, 0.85, 0.18), cyanNeonMat); rArm.position.set(0.62, 1.25, 0); robotGrp.add(rArm);
    group.add(robotGrp);

    /* ============================================================================
     * 8. PERIMETER WALT DISNEY WORLD STEAM RAILROAD (Live Chugging Locomotive!)
     * ============================================================================ */
    const trainCars = [];
    for (let c = 0; c < 4; c++) {
      const cg = new T.Group();
      const isEngine = c === 0;
      const body = new T.Mesh(new T.BoxGeometry(2.6, isEngine ? 2.2 : 1.85, 5.4), isEngine ? crimsonMat : (c % 2 === 1 ? blueSlateMat : goldMat));
      body.position.y = 1.35; cg.add(body);
      if (isEngine) {
        const stack = new T.Mesh(cyl(0.36, 0.25, 1.6, 8), darkIronMat); stack.position.set(0, 2.8, 1.8); cg.add(stack);
        const lamp = new T.Mesh(sph(0.28, 8), warmLampMat); lamp.position.set(0, 1.6, 2.8); cg.add(lamp);
      } else {
        const roof = new T.Mesh(new T.BoxGeometry(2.8, 0.25, 5.6), castleUpperMat); roof.position.y = 2.4; cg.add(roof);
      }
      group.add(cg); trainCars.push(cg);
    }

    /* ---------------- Build Full Disneyland Landmarks, Star Wars Galaxy's Edge & 3D Parkland ---------------- */
    const landmarks = root.TPLandmarks ? root.TPLandmarks.build(scene, world, group) : null;
    const starWars = root.TPStarWars ? root.TPStarWars.build(scene, world, group) : null;
    const orlando = root.TPOrlando ? root.TPOrlando.build(scene, world, group) : null;

    /* ---------------- Flush All Static Merged Architectural Meshes ---------------- */
    mBase.mesh(castleBaseMat); mUpper.mesh(castleUpperMat); mBlush.mesh(castleBlushMat, false); mBlueRoof.mesh(blueSlateMat);
    mGold.mesh(goldMat, false); mWhite.mesh(whiteTrimMat, false); mBrick.mesh(brickMat); mSlate.mesh(slateDarkMat, false);
    mWood.mesh(woodMat, false); mIron.mesh(darkIronMat, false); mMayan.mesh(mayanStoneMat, false); mChrome.mesh(chromeMat, false);
    mCyan.mesh(cyanNeonMat, false); mLamp.mesh(warmLampMat, false); mRed.mesh(crimsonMat, false); mLeaf.mesh(leafMat, false);

    /* ============================================================================
     * 9. REALISTIC SOFT-GLOW 3D CASTLE FIREWORKS ENGINE (Radial Starburst Sprites!)
     * ============================================================================ */
    const fwBursts = [];
    const fwColors = [0xfef08a, 0xf472b6, 0x38bdf8, 0x34d399, 0xc084fc, 0xfb923c];
    let fwShowTimer = 0, fwLaunchCooldown = 0;

    function spawnFireworkBurst() {
      const fx = cx + (Math.random() - 0.5) * 48;
      const fy = Y + 42 + Math.random() * 24;
      const fz = cz - 14 + (Math.random() - 0.5) * 18;
      const col = fwColors[(Math.random() * fwColors.length) | 0];
      const count = 64;
      const pos = new Float32Array(count * 3);
      const vels = [];
      for (let i = 0; i < count; i++) {
        const th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1);
        const sp = 9 + Math.random() * 11;
        vels.push([Math.sin(ph) * Math.cos(th) * sp, Math.cos(ph) * sp, Math.sin(ph) * Math.sin(th) * sp]);
      }
      const geo = new T.BufferGeometry();
      geo.setAttribute('position', new T.BufferAttribute(pos, 3));
      const mat = new T.PointsMaterial({ color: col, map: sparkTex, size: 3.4, transparent: true, opacity: 1, blending: T.AdditiveBlending, depthWrite: false });
      const pts = new T.Points(geo, mat);
      pts.position.set(fx, fy, fz);
      group.add(pts);
      fwBursts.push({ pts, geo, mat, vels, age: 0, life: 2.6 });
    }

    function triggerFireworks() {
      fwShowTimer = 28;
      fwLaunchCooldown = 0;
      spawnFireworkBurst();
    }

    /* ============================================================================
     * 10. THREE RIDEABLE ATTRACTIONS STATE MACHINE
     * ============================================================================ */
    const rideState = {
      carousel:   { running: true, angle: 0, speed: 0.52 },
      river_boat: { running: false, t: 0, speed: 0.042, eventIdx: -1 },
      starjet:    { running: false, angle: 0, speed: 0, targetSpeed: 0.92, lift: 0 }
    };

    const rides = {
      carousel: {
        id: 'carousel', name: '皇家童话旋转木马', land: 'Fantasyland',
        boardPos: { x: carX, y: Y, z: carZ + 10.2 },
        exitPos:  { x: carX, y: Y, z: carZ + 11.8, yaw: 0 },
        start: () => { rideState.carousel.running = true; },
        stop:  () => { rideState.carousel.running = false; },
        isRunning: () => rideState.carousel.running,
        getCameraPose: (thirdPerson) => {
          const h = carouselHorses[0];
          const worldAng = rideState.carousel.angle + h.angle;
          const hx = carX + Math.cos(worldAng) * h.radius, hz = carZ + Math.sin(worldAng) * h.radius;
          const hy = Y + 0.78 + h.grp.position.y + 1.15;
          if (thirdPerson) {
            return { px: carX + Math.cos(worldAng - 0.55) * 15.2, py: Y + 5.6, pz: carZ + Math.sin(worldAng - 0.55) * 15.2, tx: carX + (hx - carX) * 0.45, ty: hy + 0.65, tz: carZ + (hz - carZ) * 0.45 };
          }
          return { px: hx, py: hy, pz: hz, tx: carX + Math.cos(worldAng + 0.45) * h.radius, ty: hy - 0.12, tz: carZ + Math.sin(worldAng + 0.45) * h.radius };
        }
      },
      river_boat: {
        id: 'river_boat', name: '丛林河流探险船', land: 'Adventureland',
        boardPos: { x: 127.5, y: Y, z: 204.5 },
        exitPos:  { x: 133.0, y: Y, z: 204.5, yaw: Math.PI / 2 },
        start: () => { rideState.river_boat.running = true; },
        stop:  () => { rideState.river_boat.running = false; },
        isRunning: () => rideState.river_boat.running,
        getCameraPose: (thirdPerson) => {
          const bp = boatGrp.position, yaw = boatGrp.rotation.y;
          const fwdX = Math.sin(yaw), fwdZ = Math.cos(yaw);
          if (thirdPerson) return { px: bp.x - fwdX * 7.8, py: bp.y + 4.3, pz: bp.z - fwdZ * 7.8, tx: bp.x + fwdX * 6, ty: bp.y + 1.6, tz: bp.z + fwdZ * 6 };
          return { px: bp.x + fwdX * 0.8, py: bp.y + 2.05, pz: bp.z + fwdZ * 0.8, tx: bp.x + fwdX * 14, ty: bp.y + 2.1, tz: bp.z + fwdZ * 14 };
        }
      },
      starjet: {
        id: 'starjet', name: '星际轨道飞行器', land: 'Tomorrowland',
        boardPos: { x: sjX - 8.5, y: Y, z: sjZ + 8.5 },
        exitPos:  { x: sjX - 11.5, y: Y, z: sjZ + 11.0, yaw: -0.7 },
        start: () => { rideState.starjet.running = true; },
        stop:  () => { rideState.starjet.running = false; },
        isRunning: () => rideState.starjet.running,
        getCameraPose: (thirdPerson) => {
          const s = starjetShips[0], wp = new T.Vector3(); s.ship.getWorldPosition(wp);
          const worldAng = rideState.starjet.angle + s.baseAngle;
          const fwdX = -Math.sin(worldAng), fwdZ = Math.cos(worldAng);
          if (thirdPerson) return { px: wp.x - fwdX * 10.5 + Math.cos(worldAng) * 5.2, py: wp.y + 3.8, pz: wp.z - fwdZ * 10.5 + Math.sin(worldAng) * 5.2, tx: sjX, ty: Y + 9.2, tz: sjZ };
          return { px: wp.x, py: wp.y + 1.15, pz: wp.z, tx: wp.x + fwdX * 16, ty: wp.y - 0.6, tz: wp.z + fwdZ * 16 };
        }
      }
    };
    if (landmarks && landmarks.smallWorldRide) rides.small_world_boat = landmarks.smallWorldRide;
    if (starWars && starWars.falconRide) rides.falcon_flight = starWars.falconRide;
    if (orlando && orlando.skylinerRide) rides.skyliner_ride = orlando.skylinerRide;
    if (orlando && orlando.everestRide) rides.everest_ride = orlando.everestRide;

    const interactables = [
      { id: 'wishing_well', name: '魔法许愿井', x: 174, y: Y, z: 134, msg: '✨ 魔法许愿井泛起金色星光，你的愿望已飞向灰姑娘城堡！' },
      { id: 'temple_idol', name: '古神庙黄金圣像', x: 100, y: Y + 12, z: 200, msg: '🔥 古老玛雅机关触发！神庙金像发出神秘轰鸣！' },
      { id: 'holo_console', name: '未来城市全息台', x: 280, y: Y, z: 226, msg: '🤖 未来城市全息投影切换至「2150 悬浮云城」模式！机器人向你挥手致意！' },
      { id: 'savi_lightsaber', name: '萨维光剑工坊', x: 141.5, y: Y, z: 84, msg: '⚔️ 凯伯水晶共鸣！你已亲手组装并点亮专属绝地光剑——愿原力与你同在！' }
    ];

    let elapsed = 0;
    function update(dt, time, cam, nightF, onEvent) {
      elapsed += dt;
      if (landmarks) landmarks.update(dt, elapsed, onEvent);
      if (starWars) starWars.update(dt, elapsed, onEvent);
      if (orlando) orlando.update(dt, elapsed, nightF, onEvent);
      trolleyGrp.position.z = 266 + Math.sin(elapsed * 0.24) * 26;
      floatGrp.position.z = 266 - Math.sin(elapsed * 0.24) * 24;
      floatGrp.position.x = 192.5 + 3.1;
      fCrown.rotation.y = elapsed * 1.8;
      swanBoats.forEach((sb) => {
        const a = elapsed * 0.18 + sb.phase;
        const sx = cx + Math.cos(a) * 21.8, sz = cz + Math.sin(a) * 21.8;
        const nx = cx + Math.cos(a + 0.04) * 21.8, nz = cz + Math.sin(a + 0.04) * 21.8;
        sb.grp.position.set(sx, world.WATER_Y + 0.06, sz);
        sb.grp.rotation.y = Math.atan2(nx - sx, nz - sz);
      });
      balloonClusters.forEach((b) => {
        b.grp.rotation.z = Math.sin(elapsed * 1.8 + b.phase) * 0.09;
        b.grp.rotation.x = Math.cos(elapsed * 1.4 + b.phase) * 0.06;
      });
      guests.forEach((g) => {
        const nz = g.baseZ + Math.sin(elapsed * g.spd + g.ph) * g.amp;
        g.grp.rotation.y = nz >= g.grp.position.z ? 0 : Math.PI;
        g.grp.position.z = nz;
      });
      const trAngle = elapsed * 0.082;
      trainCars.forEach((cg, idx) => {
        const a = trAngle - idx * 0.044;
        const tx = 192 + Math.cos(a) * 147.5, tz = 192 + Math.sin(a) * 145.5;
        const nx = 192 + Math.cos(a + 0.02) * 147.5, nz = 192 + Math.sin(a + 0.02) * 145.5;
        cg.position.set(tx, Y + 0.05, tz); cg.rotation.y = Math.atan2(nx - tx, nz - tz);
      });
      if (rideState.carousel.running) rideState.carousel.angle += dt * rideState.carousel.speed;
      carouselSpinGrp.rotation.y = rideState.carousel.angle;
      carouselHorses.forEach((h) => { h.grp.position.y = 1.65 + Math.sin(rideState.carousel.angle * 3.0 + h.phase) * 0.42; });

      if (rideState.river_boat.running) {
        rideState.river_boat.t += dt * rideState.river_boat.speed;
        const a = rideState.river_boat.t * Math.PI * 2;
        const bx = 100 + Math.cos(a) * 23.5, bz = 200 + Math.sin(a) * 22.0;
        const nx = 100 + Math.cos(a + 0.03) * 23.5, nz = 200 + Math.sin(a + 0.03) * 22.0;
        boatGrp.position.set(bx, world.WATER_Y + 0.08 + Math.sin(elapsed * 3) * 0.05, bz);
        boatGrp.rotation.y = Math.atan2(nx - bx, nz - bz);
        const ev = Math.floor((rideState.river_boat.t % 1) * 4);
        if (ev !== rideState.river_boat.eventIdx) {
          rideState.river_boat.eventIdx = ev;
          if (onEvent) onEvent(['⛵ 探险船启航！前方进入热带棕榈河谷…', '🏛️ 左侧出现苔藓覆盖的玛雅阶梯神庙遗迹！', '🌊 小心水花！我们正在驶过轰鸣的丛林大瀑布！', '🏝️ 旅程即将圆满结束，探险船正在平稳返航码头！'][ev]);
        }
        if (rideState.river_boat.t >= 1.0) {
          rideState.river_boat.t = 0; rideState.river_boat.running = false; rideState.river_boat.eventIdx = -1;
          boatGrp.position.set(123.5, world.WATER_Y + 0.05, 200);
          if (onEvent) onEvent('⚓ 丛林探险船已安全靠岸！点击「启动」可再次启航，或点击「离开设施」。');
        }
      }

      const sj = rideState.starjet;
      const targetSpd = sj.running ? sj.targetSpeed : 0.14;
      sj.speed += (targetSpd - sj.speed) * Math.min(1, dt * 1.8);
      sj.angle += dt * sj.speed;
      sj.lift += ((sj.running ? 1.0 : 0.0) - sj.lift) * Math.min(1, dt * 1.4);
      starjetHubGrp.rotation.y = sj.angle;
      starjetShips.forEach((s, idx) => {
        const wave = Math.sin(elapsed * 1.6 + idx * 1.05) * 0.18;
        s.armGrp.rotation.z = sj.lift * (0.36 + wave) - 0.18;
        s.ship.rotation.z = -sj.lift * 0.35;
      });

      magicCrystal.rotation.y = elapsed * 1.6;
      magicCrystal.position.y = Y + 2.5 + Math.sin(elapsed * 2.5) * 0.25;
      skyLanterns.forEach((l) => { l.mesh.position.y = l.baseY + Math.sin(elapsed * 1.4 + l.phase) * 0.65; });
      const pmA = elapsed * 0.36;
      pmCars.forEach((cg, idx) => {
        const a = pmA - idx * 0.19;
        const px = sjX + Math.cos(a) * 21.5, pz = sjZ + Math.sin(a) * 21.5;
        const nx = sjX + Math.cos(a + 0.04) * 21.5, nz = sjZ + Math.sin(a + 0.04) * 21.5;
        cg.position.set(px, Y + 5.85, pz); cg.rotation.y = Math.atan2(nx - px, nz - pz);
      });
      templeIdol.rotation.y = elapsed * 0.9;
      holoCity.rotation.y = elapsed * 0.7;
      rArm.rotation.z = Math.sin(elapsed * 3.5) * 0.45 + 0.4;

      // Animate Sparkling Hub Fountain Water-Spray Droplets!
      fountainSprays.forEach((fs) => {
        const arr = fs.geo.attributes.position.array;
        for (let k = 0; k < fs.phase.length; k++) {
          const ph = fs.phase[k];
          const t = (elapsed * 0.85 + ph.off) % 1.0;
          arr[k * 3] = Math.cos(ph.ang) * ph.r * t;
          arr[k * 3 + 1] = t * 2.2 - t * t * 4.45;
          arr[k * 3 + 2] = Math.sin(ph.ang) * ph.r * t;
        }
        fs.geo.attributes.position.needsUpdate = true;
      });

      const showGlow = fwShowTimer > 0 ? 1.0 : 0.0;
      const nightGlow = Math.max(nightF, showGlow);
      castleNightBlue.intensity = nightGlow * (2.6 + Math.sin(elapsed * 2.1) * 0.35);
      castleNightGold.intensity = nightGlow * (1.8 + showGlow * 0.6);
      beamMat.opacity = Math.max(nightF * 0.28, showGlow * 0.42);
      castleBeams.forEach((bm, idx) => { bm.position.y = Y + 20 + Math.sin(elapsed * 0.9 + idx * 1.4) * 1.2; });

      if (fwShowTimer > 0) {
        fwShowTimer -= dt; fwLaunchCooldown -= dt;
        if (fwLaunchCooldown <= 0) { spawnFireworkBurst(); fwLaunchCooldown = 0.5 + Math.random() * 0.4; }
      }
      for (let i = fwBursts.length - 1; i >= 0; i--) {
        const b = fwBursts[i]; b.age += dt;
        if (b.age >= b.life) { group.remove(b.pts); b.geo.dispose(); b.mat.dispose(); fwBursts.splice(i, 1); continue; }
        const arr = b.geo.attributes.position.array, p = b.age / b.life;
        for (let k = 0; k < b.vels.length; k++) {
          const v = b.vels[k];
          arr[k * 3] = v[0] * b.age * (1 - p * 0.35);
          arr[k * 3 + 1] = v[1] * b.age - 3.6 * b.age * b.age;
          arr[k * 3 + 2] = v[2] * b.age * (1 - p * 0.35);
        }
        b.geo.attributes.position.needsUpdate = true;
        b.mat.opacity = Math.max(0, 1 - p * p);
      }
    }

    return { update, rides, interactables, triggerFireworks, isFireworksActive: () => fwShowTimer > 0 };
  }

  root.TPProps = { build };
})(window);
