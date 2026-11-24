/* Minest My World · 1:1 Disneyland Resort Architectural Core Engine (`props.js`)
 * Builds at True 1:1 Scale along CX = 272.5:
 *  - Esplanade Compass Plaza, Main Entrance Turnstiles, Sloped Floral Mickey, Twin "Here You Leave Today" Entry Tunnels
 *  - Grand Victorian Main Street Railroad Station + RIDEABLE 4-Station Disneyland Steam Railroad (`railroad_tour`) + Primeval World Dino Tunnel!
 *  - Continuous Shoulder-to-Shoulder 120m Main Street, U.S.A. (14 Victorian Buildings across North & South Blocks, Emporium, Cinema,
 *    Penny Arcade, Carnation Cafe, Casey's Piano Corner, Enterable Bakery, Streetcar, Double-Decker Omnibus, Dapper Dans & Balloons!)
 *  - Central Plaza Hub ("Partners" Statue, Sparkling Fountains, 4 Lighting Turrets) + 18-Spire Castle, Swan Moat & Snow White Wishing Well Grotto!
 *  - King Arthur / Regal Carrousel (`carousel`), Expanded Jungle Cruise w/ Hippos, Elephants & Backside of Water (`river_boat`),
 *  - Tomorrowland Astro Orbiter (`starjet`), 32-Rib Space Mountain Exterior, PeopleMover & Nighttime Castle Fireworks Show! */
(function (root) {
  'use strict';

  function build(world, T, scene) {
    const group = new T.Group(); group.name = 'tp-props'; scene.add(group);
    const Y = world.PARK_Y || 40;
    const AX = world.CX || 272.5;

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

    /* ================= 1. PROCEDURAL ARCHITECTURAL MATERIALS ================= */
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
        }
      }
      return finTex(c, true);
    }
    function makeVictorianShopTex(wallHex, trimHex, awningHex) {
      const c = cvs(256, 256), x = c.getContext('2d');
      x.fillStyle = wallHex; x.fillRect(0, 0, 256, 256);
      x.strokeStyle = 'rgba(0,0,0,0.09)'; x.lineWidth = 1;
      for (let y = 0; y < 256; y += 10) { x.beginPath(); x.moveTo(0, y); x.lineTo(256, y); x.stroke(); }
      x.fillStyle = trimHex; x.fillRect(0, 0, 256, 14); x.fillRect(0, 128, 256, 10);
      for (const wx of [22, 102, 182]) {
        x.fillStyle = '#1e293b'; x.fillRect(wx, 30, 52, 76);
        x.fillStyle = 'rgba(253,230,138,0.28)'; x.fillRect(wx + 4, 34, 44, 68);
        x.strokeStyle = trimHex; x.lineWidth = 4; x.strokeRect(wx, 30, 52, 76);
      }
      for (const wx of [18, 138]) {
        const wg = x.createLinearGradient(0, 156, 0, 240);
        wg.addColorStop(0, '#fef3c7'); wg.addColorStop(0.55, '#f59e0b'); wg.addColorStop(1, '#78350f');
        x.fillStyle = wg; x.fillRect(wx, 156, 100, 82);
        x.strokeStyle = trimHex; x.lineWidth = 5; x.strokeRect(wx, 156, 100, 82);
      }
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
      x.beginPath(); x.moveTo(64, 18); x.lineTo(64, 248); x.moveTo(16, 118); x.lineTo(112, 118); x.stroke();
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
      g.addColorStop(0, 'rgba(186,230,253,0.92)'); g.addColorStop(0.35, 'rgba(96,165,250,0.42)');
      g.addColorStop(0.75, 'rgba(99,102,241,0.12)'); g.addColorStop(1, 'rgba(30,58,138,0)');
      x.fillStyle = g; x.fillRect(0, 0, 128, 256);
      return finTex(c, false);
    }
    function makeAwningTex(hex) {
      const c = cvs(128, 64), x = c.getContext('2d');
      for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 === 0 ? hex : '#fffbf0'; x.fillRect(i * 16, 0, 16, 56); }
      x.fillStyle = '#e2b13c'; x.fillRect(0, 56, 128, 8);
      return finTex(c, true);
    }
    function makeCarouselCanopyTex() {
      const c = cvs(256, 256), x = c.getContext('2d');
      for (let i = 0; i < 16; i++) { x.fillStyle = i % 2 === 0 ? '#9f1239' : '#fdf6e7'; x.fillRect(i * 16, 0, 16, 256); }
      x.fillStyle = '#1e3a8a'; x.fillRect(0, 212, 256, 44);
      x.strokeStyle = '#f5c542'; x.lineWidth = 4; x.strokeRect(0, 214, 256, 40);
      return finTex(c, true);
    }
    function makeBannerTex(title, sub, bg, border) {
      const c = cvs(512, 112), x = c.getContext('2d');
      x.fillStyle = bg || '#172038'; x.fillRect(0, 0, 512, 112);
      x.strokeStyle = border || '#d4af37'; x.lineWidth = 5; x.strokeRect(6, 6, 500, 100);
      x.fillStyle = '#fef3c7'; x.font = '800 26px "PingFang SC","Songti SC",Georgia,serif';
      x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(title, 256, 44);
      x.fillStyle = '#cbd5e1'; x.font = '700 14px Georgia,serif'; x.fillText(sub, 256, 82);
      return finTex(c, false);
    }

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

    const mBase = new Merger(), mUpper = new Merger(), mBlush = new Merger(), mBlueRoof = new Merger();
    const mGold = new Merger(), mWhite = new Merger(), mBrick = new Merger(), mSlate = new Merger();
    const mWood = new Merger(), mIron = new Merger(), mMayan = new Merger(), mChrome = new Merger();
    const mCyan = new Merger(), mLamp = new Merger(), mRed = new Merger(), mLeaf = new Merger();

    function addSign(cx, y, z, w, title, sub, bg, border, rotY) {
      const tex = makeBannerTex(title, sub, bg, border);
      addMesh(new T.PlaneGeometry(w, w * 0.22), new T.MeshLambertMaterial({ map: tex, emissiveMap: tex, emissive: 0xfff0cc, emissiveIntensity: 0.42, side: T.DoubleSide }), cx, y, z, 0, rotY || 0);
    }

    /* ============================================================================
     * 2. 1:1 MAIN ENTRANCE TURNSTILES, FLORAL MICKEY & TWIN "HERE YOU LEAVE TODAY" TUNNELS!
     * ============================================================================ */
    for (const sd of [-1, 1]) {
      box(mUpper, 1.6, 8.2, 1.6, AX + sd * 10.5, Y + 4.1, 488);
      mBlueRoof.add(new T.ConeGeometry(1.3, 3.4, 8), M(AX + sd * 10.5, Y + 10.0, 488));
      mGold.add(sph(0.30), M(AX + sd * 10.5, Y + 11.9, 488));
      // Turnstile Ticket Booths across Esplanade
      mUpper.add(cyl(2.2, 2.3, 3.8, 8), M(AX + sd * 18.5, Y + 1.9, 488));
      mSlate.add(new T.ConeGeometry(2.6, 2.4, 8), M(AX + sd * 18.5, Y + 5.1, 488));
    }
    box(mIron, 21.0, 0.5, 0.6, AX, Y + 8.0, 488);
    addSign(AX, Y + 6.8, 488.5, 12.6, 'DISNEYLAND · 奇想迪士尼乐园 (1:1 真实还原版)', 'THE HAPPIEST PLACE ON EARTH · ARCHITECTURAL EDITION', '#172038', '#e2b13c');

    // Authentic Sloped Floral Mickey Portrait Embankment in front of Main Street Station (z = 474)!
    mLeaf.add(cyl(8.4, 9.8, 1.8, 28), M(AX, Y + 0.9, 474));
    mWhite.add(cyl(3.8, 4.2, 1.95, 24), M(AX, Y + 0.98, 474.5)); // Mickey floral face!
    mWhite.add(cyl(2.1, 2.3, 1.95, 18), M(AX - 3.6, Y + 1.05, 471.2)); // Left Mickey floral ear!
    mWhite.add(cyl(2.1, 2.3, 1.95, 18), M(AX + 3.6, Y + 1.05, 471.2)); // Right Mickey floral ear!
    mRed.add(cyl(1.6, 1.8, 2.02, 16), M(AX, Y + 1.02, 476.4));

    // Grand Victorian Main Street Disneyland Railroad Station + Twin Brick Entry Tunnels (z = 460)!
    // Earthen Berm flanking central floral embankment, leaving TWIN 9m-wide entry tunnels at AX - 15 and AX + 15!
    box(mBrick, 16.0, 5.2, 8.6, AX, Y + 2.6, 460); // Center berm under station
    box(mBrick, 10.0, 5.2, 8.6, AX - 24.5, Y + 2.6, 460);
    box(mBrick, 10.0, 5.2, 8.6, AX + 24.5, Y + 2.6, 460);
    box(mBrick, 58.0, 0.8, 9.2, AX, Y + 5.2, 460); // Elevated platform deck spanning both tunnels!
    for (const sd of [-1, 1]) {
      addSign(AX + sd * 14.5, Y + 4.5, 464.5, 8.4, 'HERE YOU LEAVE TODAY · 在此告别今日', 'AND ENTER THE WORLD OF YESTERDAY, TOMORROW AND FANTASY', '#451a03', '#eab308');
    }
    // 2nd-Level Victorian Depot Building & Clock Tower atop the Station Berm!
    box(mUpper, 30.0, 6.2, 7.2, AX, Y + 8.6, 460);
    box(mWhite, 31.2, 0.5, 8.0, AX, Y + 11.9, 460);
    box(mSlate, 29.5, 2.6, 6.8, AX, Y + 13.4, 460);
    box(mUpper, 6.2, 7.6, 6.2, AX, Y + 17.8, 460);
    mSlate.add(new T.ConeGeometry(4.4, 7.6, 4), M(AX, Y + 25.4, 460, 0, Math.PI / 4, 0));
    mGold.add(cyl(0.10, 0.14, 2.8, 6), M(AX, Y + 30.2, 460));
    mGold.add(new T.TorusGeometry(1.45, 0.15, 6, 18), M(AX, Y + 18.2, 463.2));
    addMesh(new T.CircleGeometry(1.38, 18), whiteTrimMat, AX, Y + 18.2, 463.16);

    /* ============================================================================
     * 3. 1:1 CONTINUOUS MAIN STREET, U.S.A. (z = 292..402 — 14 Seamless Buildings!)
     * ============================================================================ */
    const shopConfigs = [
      // SOUTH BLOCK (z = 360..402, South of Center Street!)
      { z: 395, d: 14.2, side: -1, wall: '#f6efe4', trim: '#ffffff', awn: '#9f1239', roof: mSlate, cupola: true,  label: 'THE EMPORIUM · 百年百货南翼' },
      { z: 381, d: 14.0, side: -1, wall: '#f2e8da', trim: '#ffffff', awn: '#9f1239', roof: mSlate, cupola: false, label: 'THE EMPORIUM · 百年百货中庭' },
      { z: 367, d: 14.2, side: -1, wall: '#efe2d0', trim: '#fffaf0', awn: '#166534', roof: mBlueRoof, cupola: true, label: 'EMPORIUM NORTH · 百货玩具厅' },
      { z: 395, d: 14.2, side: 1,  wall: '#d8a79e', trim: '#fffaf0', awn: '#9f1239', roof: mSlate, cupola: true,  label: 'MAIN ST. CINEMA · 复古默片影院' },
      { z: 381, d: 14.0, side: 1,  wall: '#c85d4e', trim: '#fdf6e7', awn: '#166534', roof: mSlate, cupola: false, label: 'MARKET HOUSE · 小镇咖啡集市' },
      { z: 367, d: 14.2, side: 1,  wall: '#d8e3dd', trim: '#ffffff', awn: '#1d4ed8', roof: mBlueRoof, cupola: true, label: 'DISNEY CLOTHIERS · 维多利亚服饰馆' },
      // NORTH BLOCK (z = 294..340, North of Center Street!)
      { z: 335, d: 11.8, side: -1, wall: '#e8d0b8', trim: '#fffaf0', awn: '#b45309', roof: mSlate, cupola: false, label: 'PENNY ARCADE · 百年投币游艺廊' },
      { z: 323, d: 12.0, side: -1, wall: '#f4dce2', trim: '#ffffff', awn: '#be185d', roof: mSlate, cupola: true,  label: 'CANDY PALACE · 手工糖果殿堂' },
      { z: 311, d: 12.0, side: -1, wall: '#f5efe6', trim: '#ffffff', awn: '#dc2626', roof: mBlueRoof, cupola: false, label: 'CARNATION CAFE · 康乃馨露天咖啡' },
      { z: 299, d: 12.2, side: -1, wall: '#f8f4ec', trim: '#dc2626', awn: '#dc2626', roof: mSlate, cupola: true,  label: "CASEY'S / REFRESHMENT · 热狗钢琴角" },
      { z: 335, d: 11.8, side: 1,  wall: '#ede4d3', trim: '#ffffff', awn: '#0f766e', roof: mBlueRoof, cupola: false, label: 'MAIN ST. BAKERY · 奇想烘焙馆', open: true },
      { z: 323, d: 12.0, side: 1,  wall: '#c7d5e0', trim: '#fffef8', awn: '#1d4ed8', roof: mSlate, cupola: true,  label: 'CRYSTAL ARCADE · 水晶玻璃艺廊' },
      { z: 311, d: 12.0, side: 1,  wall: '#fce7f3', trim: '#ffffff', awn: '#db2777', roof: mSlate, cupola: false, label: 'GIBSON GIRL · 圣代冰淇淋沙龙' },
      { z: 299, d: 12.2, side: 1,  wall: '#e6d8c3', trim: '#ffffff', awn: '#166534', roof: mBlueRoof, cupola: true, label: 'PLAZA POINT · 中央转角精品店' }
    ];
    shopConfigs.forEach((sh) => {
      const sx = AX + sh.side * 16.4, sz = sh.z, faceX = sx - sh.side * 5.0;
      const shopTex = makeVictorianShopTex(sh.wall, sh.trim, sh.awn);
      const shopMat = new T.MeshLambertMaterial({ map: shopTex, emissive: 0x16120c });
      if (sh.open) {
        box(mUpper, 10.0, 10.2, 2.0, sx, Y + 5.1, sz - sh.d * 0.42);
        box(mUpper, 10.0, 10.2, 2.0, sx, Y + 5.1, sz + sh.d * 0.42);
        box(mUpper, 1.2, 10.2, sh.d, sx + sh.side * 4.4, Y + 5.1, sz);
        box(mUpper, 1.2, 5.2, sh.d, faceX, Y + 7.6, sz);
        box(mWood, 1.6, 0.85, 1.6, sx, Y + 0.42, sz - 1.8);
        box(mWood, 1.6, 0.85, 1.6, sx, Y + 0.42, sz + 1.8);
      } else {
        addMesh(new T.BoxGeometry(10.0, 10.2, sh.d), shopMat, sx, Y + 5.1, sz, 0, 0, 0, true);
      }
      box(mWhite, 10.6, 0.55, sh.d + 0.3, sx, Y + 10.35, sz);
      box(sh.roof, 9.2, 2.5, sh.d - 0.6, sx, Y + 11.8, sz);
      box(mGold, 9.4, 0.18, sh.d - 0.4, sx, Y + 13.1, sz);
      for (const pz of [-sh.d * 0.46, 0, sh.d * 0.46]) {
        box(mWhite, 0.38, 10.2, 0.42, faceX - sh.side * 0.14, Y + 5.1, sz + pz);
      }
      box(mWhite, 1.6, 0.18, sh.d - 0.4, faceX - sh.side * 0.8, Y + 4.95, sz);
      const awnMat = new T.MeshLambertMaterial({ map: makeAwningTex(sh.awn), side: T.DoubleSide });
      addMesh(new T.BoxGeometry(1.8, 0.10, sh.d - 0.6), awnMat, faceX - sh.side * 0.9, Y + 4.55, sz, 0, 0, sh.side * 0.24);
      box(mIron, 0.08, 0.95, sh.d - 0.4, faceX - sh.side * 1.5, Y + 5.5, sz);
      box(mGold, 1.2, 0.58, 0.12, faceX - sh.side * 1.0, Y + 5.6, sz + sh.d * 0.32);
      if (sh.cupola) {
        const cxp = faceX + sh.side * 0.6, czp = sz + (sz < 310 ? -sh.d * 0.35 : sh.d * 0.35);
        mWhite.add(cyl(1.45, 1.55, 3.0, 8), M(cxp, Y + 14.2, czp));
        mBlueRoof.add(new T.ConeGeometry(1.65, 3.8, 8), M(cxp, Y + 17.6, czp));
        mGold.add(sph(0.24), M(cxp, Y + 19.6, czp));
      }
    });

    // Main Street Victorian Gas Streetlamps, Hanging Flower Baskets, Benches, Trolley Iron Rails & Fairy Lights (z=288..452)!
    for (let z = 290; z <= 450; z += 12) {
      for (const sd of [-1, 1]) {
        const lx = AX + sd * 8.6;
        mIron.add(cyl(0.08, 0.16, 4.5, 8), M(lx, Y + 2.25, z));
        mLamp.add(sph(0.30, 8), M(lx, Y + 4.7, z));
        box(mIron, 0.62, 0.06, 0.06, lx - sd * 0.30, Y + 3.95, z);
        mLeaf.add(sph(0.22, 6), M(lx - sd * 0.54, Y + 3.8, z));
        mRed.add(sph(0.11, 5), M(lx - sd * 0.64, Y + 3.88, z + 0.08));
        if ((z - 290) % 24 === 0) {
          box(mWood, 0.55, 0.12, 2.2, lx + sd * 1.1, Y + 0.52, z + 3.2);
          box(mWood, 0.10, 0.52, 2.2, lx + sd * 1.35, Y + 0.82, z + 3.2);
        }
      }
    }
    box(mIron, 0.14, 0.05, 168, AX - 1.0, Y + 0.03, 368);
    box(mIron, 0.14, 0.05, 168, AX + 1.0, Y + 0.03, 368);
    for (let z = 294; z <= 402; z += 14) {
      for (let i = 0; i <= 10; i++) {
        const u = i / 10, lx = AX - 9.8 + u * 19.6;
        mLamp.add(sph(0.14, 5), M(lx, Y + 8.2 - Math.sin(u * Math.PI) * 1.2, z));
      }
    }
    // Vintage Main Street Popcorn Cart & Dapper Dans Quartet (in striped vests at Center Street corner x=265, z=352)!
    box(mRed, 1.25, 1.05, 1.7, AX - 7.2, Y + 0.72, 342);
    box(mLamp, 0.98, 0.78, 1.38, AX - 7.2, Y + 1.72, 342);
    const dapperColors = [0xdc2626, 0x2563eb, 0xf59e0b, 0x9333ea];
    for (let i = 0; i < 4; i++) {
      const dx = AX - 8.2, dz = 353.5 + i * 0.85;
      box(mWhite, 0.38, 0.65, 0.24, dx, Y + 0.32, dz);
      addMesh(new T.BoxGeometry(0.42, 0.68, 0.26), new T.MeshLambertMaterial({ color: dapperColors[i] }), dx, Y + 1.0, dz);
      mUpper.add(sph(0.19, 6), M(dx, Y + 1.54, dz));
      mGold.add(cyl(0.24, 0.24, 0.10, 8), M(dx, Y + 1.74, dz)); // Straw boater hat!
    }

    // Animated Horse-Drawn Streetcar Trolley AND Double-Decker Yellow Omnibus cruising Main Street!
    const trolleyGrp = new T.Group();
    trolleyGrp.position.set(AX - 2.2, Y + 0.1, 355);
    const tBody = new T.Mesh(new T.BoxGeometry(2.3, 1.35, 5.8), crimsonMat); tBody.position.y = 0.98; trolleyGrp.add(tBody);
    const tTrim = new T.Mesh(new T.BoxGeometry(2.42, 0.18, 5.92), goldMat); tTrim.position.y = 1.62; trolleyGrp.add(tTrim);
    const tRoof = new T.Mesh(new T.BoxGeometry(2.55, 0.38, 6.2), whiteTrimMat); tRoof.position.y = 3.0; trolleyGrp.add(tRoof);
    for (const sx of [-1.05, 1.05]) for (const sz of [-2.4, -0.8, 0.8, 2.4]) {
      const post = new T.Mesh(new T.BoxGeometry(0.10, 1.35, 0.10), woodMat); post.position.set(sx, 2.25, sz); trolleyGrp.add(post);
    }
    group.add(trolleyGrp);

    const floatGrp = new T.Group(); // Double-Decker Main Street Omnibus!
    floatGrp.position.set(AX + 2.6, Y + 0.1, 330);
    const fDeck = new T.Mesh(new T.BoxGeometry(2.5, 1.9, 6.4), goldMat); fDeck.position.y = 1.15; floatGrp.add(fDeck);
    const fUpper = new T.Mesh(new T.BoxGeometry(2.4, 0.85, 5.6), crimsonMat); fUpper.position.y = 2.55; floatGrp.add(fUpper);
    const fCrown = new T.Mesh(new T.OctahedronGeometry(0.45, 0), warmLampMat); fCrown.position.set(0, 3.55, 2.4); floatGrp.add(fCrown);
    group.add(floatGrp);

    // Mickey-Ear Balloon Bouquets & Strolling Main Street Guests!
    const balloonMats = [
      new T.MeshPhongMaterial({ color: 0xe11d48, specular: 0xffffff, shininess: 90, transparent: true, opacity: 0.88 }),
      new T.MeshPhongMaterial({ color: 0x2563eb, specular: 0xffffff, shininess: 90, transparent: true, opacity: 0.88 }),
      new T.MeshPhongMaterial({ color: 0xf59e0b, specular: 0xffffff, shininess: 90, transparent: true, opacity: 0.88 }),
      new T.MeshPhongMaterial({ color: 0xec4899, specular: 0xffffff, shininess: 90, transparent: true, opacity: 0.88 })
    ];
    const balloonClusters = [];
    for (const [bx, bz] of [[AX - 6.6, 386], [AX + 6.6, 334], [AX - 8.5, 274], [AX + 8.5, 428]]) {
      const bg = new T.Group(); bg.position.set(bx, Y + 1.8, bz);
      const stem = new T.Mesh(cyl(0.03, 0.03, 2.2, 5), whiteTrimMat); stem.position.y = 1.1; bg.add(stem);
      [[0, 2.55, 0], [-0.46, 2.85, 0.22], [0.46, 2.80, -0.20], [0.06, 3.18, 0.34], [-0.28, 3.12, -0.32]].forEach(([ox, oy, oz], idx) => {
        const bm = balloonMats[idx % balloonMats.length];
        const mHead = new T.Mesh(sph(0.28, 8), bm); mHead.position.set(ox, oy, oz); bg.add(mHead);
        const earL = new T.Mesh(sph(0.16, 6), bm); earL.position.set(ox - 0.22, oy + 0.24, oz); bg.add(earL);
        const earR = new T.Mesh(sph(0.16, 6), bm); earR.position.set(ox + 0.22, oy + 0.24, oz); bg.add(earR);
      });
      group.add(bg);
      balloonClusters.push({ grp: bg, phase: bx * 0.5 + bz * 0.2 });
    }

    const guestColors = [0x3b82f6, 0xec4899, 0x10b981, 0xf59e0b, 0x8b5cf6, 0xef4444, 0x06b6d4, 0xf43f5e];
    const guests = [];
    for (let i = 0; i < 8; i++) {
      const gg = new T.Group();
      const side = i % 2 === 0 ? -1 : 1;
      const gx = AX + side * (9.2 + (i % 3) * 0.4);
      const shirt = new T.Mesh(new T.BoxGeometry(0.42, 0.68, 0.26), new T.MeshLambertMaterial({ color: guestColors[i] })); shirt.position.y = 1.02; gg.add(shirt);
      const pants = new T.Mesh(new T.BoxGeometry(0.38, 0.68, 0.24), darkIronMat); pants.position.y = 0.34; gg.add(pants);
      const head = new T.Mesh(sph(0.20, 6), new T.MeshLambertMaterial({ color: 0xf4cfa8 })); head.position.y = 1.56; gg.add(head);
      if (i % 2 === 0) {
        const e1 = new T.Mesh(sph(0.09, 5), darkIronMat); e1.position.set(-0.14, 1.78, 0); gg.add(e1);
        const e2 = new T.Mesh(sph(0.09, 5), darkIronMat); e2.position.set(0.14, 1.78, 0); gg.add(e2);
      }
      gg.position.set(gx, Y, 300 + i * 14);
      group.add(gg);
      guests.push({ grp: gg, x: gx, baseZ: 304 + i * 13, amp: 18 + (i % 3) * 5, spd: 0.15 + (i % 2) * 0.05, ph: i * 1.1 });
    }

    /* ============================================================================
     * 4. CENTRAL PLAZA HUB (z=258) & 18-SPIRE FAIRYTALE CASTLE (z=208.5) + WISHING WELL GROTTO!
     * ============================================================================ */
    const hubZ = 258;
    mWhite.add(cyl(5.8, 6.2, 0.65, 24), M(AX, Y + 0.32, hubZ));
    mLeaf.add(cyl(4.8, 5.2, 0.85, 20), M(AX, Y + 0.55, hubZ));
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      const rx = AX + Math.cos(a) * 3.8, rz = hubZ + Math.sin(a) * 3.8;
      mLeaf.add(sph(0.46, 6), M(rx, Y + 1.15, rz));
      (i % 2 === 0 ? mRed : mGold).add(sph(0.18, 5), M(rx, Y + 1.48, rz));
    }
    mWhite.add(cyl(1.45, 1.85, 2.25, 16), M(AX, Y + 1.5, hubZ));
    mGold.add(cyl(1.52, 1.52, 0.14, 16), M(AX, Y + 2.65, hubZ));
    // Bronze "Partners" Statue (Walt & Mickey)
    const partnersGrp = new T.Group(); partnersGrp.position.set(AX, Y + 2.72, hubZ);
    const addB = (geo, px, py, pz, rx, ry, rz) => {
      const m = new T.Mesh(geo, bronzeMat); m.position.set(px, py, pz);
      if (rx || ry || rz) m.rotation.set(rx || 0, ry || 0, rz || 0);
      partnersGrp.add(m);
    };
    addB(cyl(0.10, 0.11, 0.92, 8), -0.52, 0.46, 0); addB(cyl(0.10, 0.11, 0.92, 8), -0.26, 0.46, 0);
    addB(cyl(0.24, 0.28, 0.95, 10), -0.39, 1.32, 0); addB(sph(0.21, 10), -0.39, 2.02, 0);
    addB(cyl(0.07, 0.08, 0.85, 8), -0.68, 1.65, 0.36, 1.05, 0, 0.35);
    addB(cyl(0.07, 0.08, 0.68, 8), -0.08, 1.25, 0.05, 0, 0, 0.42);
    addB(cyl(0.08, 0.09, 0.56, 8), 0.26, 0.28, 0); addB(cyl(0.08, 0.09, 0.56, 8), 0.48, 0.28, 0);
    addB(sph(0.22, 10), 0.37, 0.78, 0); addB(sph(0.21, 10), 0.37, 1.22, 0);
    addB(sph(0.13, 8), 0.18, 1.44, 0); addB(sph(0.13, 8), 0.56, 1.44, 0);
    addB(cyl(0.06, 0.07, 0.48, 6), 0.12, 0.98, 0.04, 0, 0, -0.55);
    group.add(partnersGrp);

    const fountainSprays = [];
    for (const sd of [-1, 1]) {
      const fx = AX + sd * 15.0, fz = hubZ - 4;
      mWhite.add(cyl(3.2, 3.5, 0.55, 20), M(fx, Y + 0.28, fz));
      mWhite.add(cyl(0.55, 0.72, 1.35, 12), M(fx, Y + 1.05, fz));
      mWhite.add(cyl(1.45, 0.65, 0.38, 16), M(fx, Y + 1.68, fz));
      addMesh(new T.CircleGeometry(2.95, 20), waterJetMat, fx, Y + 0.58, fz, -Math.PI / 2);
      const pCount = 26, pos = new Float32Array(pCount * 3), phase = [];
      for (let k = 0; k < pCount; k++) phase.push({ ang: (k / pCount) * Math.PI * 2 + Math.random() * 0.3, off: Math.random(), r: 0.75 + Math.random() * 1.35 });
      const fGeo = new T.BufferGeometry(); fGeo.setAttribute('position', new T.BufferAttribute(pos, 3));
      const fPts = new T.Points(fGeo, new T.PointsMaterial({ color: 0xe0f2fe, size: 0.48, map: sparkTex, transparent: true, opacity: 0.85, blending: T.AdditiveBlending, depthWrite: false }));
      fPts.position.set(fx, Y + 2.85, fz); group.add(fPts);
      fountainSprays.push({ geo: fGeo, phase });
    }

    // CASTLE (cx = AX, cz = 208.5)
    const cx = AX, cz = 208.5;
    // Snow White's Grotto & Wishing Well Waterfall on East Castle Moat Bank (x=301, z=214)!
    mBase.add(cyl(1.4, 1.6, 1.2, 12), M(302, Y + 0.6, 214));
    addMesh(new T.PlaneGeometry(3.2, 4.6), waterJetMat, 299.5, Y - 0.8, 214, 0, -Math.PI / 2);
    const magicCrystal = addMesh(new T.OctahedronGeometry(0.52, 0), cyanNeonMat, 302, Y + 2.4, 214);

    const swanBoats = [];
    for (let i = 0; i < 2; i++) {
      const sg = new T.Group();
      const sHull = new T.Mesh(sph(0.95, 8), whiteTrimMat); sHull.scale.set(0.85, 0.45, 1.55); sHull.position.y = 0.25; sg.add(sHull);
      const sNeck = new T.Mesh(cyl(0.12, 0.16, 1.15, 6), whiteTrimMat); sNeck.position.set(0, 0.95, 1.05); sNeck.rotation.x = 0.25; sg.add(sNeck);
      const sHead = new T.Mesh(sph(0.18, 6), whiteTrimMat); sHead.position.set(0, 1.52, 1.22); sg.add(sHead);
      group.add(sg); swanBoats.push({ grp: sg, phase: i * Math.PI });
    }
    for (const sd of [-1, 1]) {
      box(mBase, 0.65, 1.25, 15.5, cx + sd * 4.2, Y + 0.62, cz + 21.5);
      box(mWhite, 0.85, 0.22, 15.7, cx + sd * 4.2, Y + 1.30, cz + 21.5);
      for (const lz of [cz + 15, cz + 21.5, cz + 28]) {
        mIron.add(cyl(0.08, 0.12, 1.4, 6), M(cx + sd * 4.2, Y + 2.0, lz));
        mLamp.add(sph(0.24, 6), M(cx + sd * 4.2, Y + 2.8, lz));
      }
    }
    box(mBase, 11.2, 11.2, 20.0, cx - 8.4, Y + 5.6, cz);
    box(mBase, 11.2, 11.2, 20.0, cx + 8.4, Y + 5.6, cz);
    box(mBase, 5.6, 4.2, 20.0, cx, Y + 9.1, cz);
    for (const bx of [-13.8, -9.2, -3.2, 3.2, 9.2, 13.8]) {
      box(mBase, 1.2, 11.5, 1.5, cx + bx, Y + 5.75, cz + 10.2);
      mWhite.add(new T.ConeGeometry(0.65, 2.2, 4), M(cx + bx, Y + 12.6, cz + 10.2));
    }
    box(mRed, 3.6, 0.05, 21.0, cx, Y + 0.03, cz);
    mGold.add(new T.TorusGeometry(1.4, 0.10, 6, 16), M(cx, Y + 5.8, cz, Math.PI / 2, 0, 0));
    mLamp.add(sph(0.32), M(cx, Y + 5.8, cz));
    {
      const mc = cvs(256, 128), mx = mc.getContext('2d');
      const mg = mx.createLinearGradient(0, 0, 256, 128);
      mg.addColorStop(0, '#1e3a8a'); mg.addColorStop(0.5, '#6366f1'); mg.addColorStop(1, '#312e81');
      mx.fillStyle = mg; mx.fillRect(0, 0, 256, 128);
      mx.strokeStyle = '#f5c542'; mx.lineWidth = 6; mx.strokeRect(5, 5, 246, 118);
      mx.fillStyle = '#fde047'; mx.beginPath(); mx.arc(128, 74, 24, 0, Math.PI * 2); mx.fill();
      const mTex = finTex(mc, false);
      const mMat = new T.MeshLambertMaterial({ map: mTex, emissiveMap: mTex, emissive: 0xffe4a0, emissiveIntensity: 0.45 });
      for (const sd of [-1, 1]) addMesh(new T.PlaneGeometry(7.2, 3.6), mMat, cx + sd * 2.74, Y + 3.4, cz, 0, -sd * Math.PI / 2);
    }
    addRibSeg(mGold, [cx - 2.8, Y + 5.2, cz + 10.25], [cx, Y + 8.6, cz + 10.25], 0.18, 0.14);
    addRibSeg(mGold, [cx + 2.8, Y + 5.2, cz + 10.25], [cx, Y + 8.6, cz + 10.25], 0.18, 0.14);
    mGold.add(new T.TorusGeometry(1.55, 0.18, 8, 20), M(cx, Y + 14.2, cz + 8.15));
    addMesh(new T.CircleGeometry(1.42, 20), blueSlateMat, cx, Y + 14.2, cz + 8.10);

    box(mUpper, 23.0, 8.2, 16.0, cx, Y + 15.2, cz - 0.2);
    box(mWhite, 23.8, 0.55, 16.8, cx, Y + 11.3, cz - 0.2);
    box(mWhite, 23.6, 0.55, 16.6, cx, Y + 19.4, cz - 0.2);
    box(mBlush, 14.8, 7.6, 12.2, cx, Y + 23.2, cz - 1.2);
    box(mWhite, 15.4, 0.50, 12.8, cx, Y + 27.1, cz - 1.2);
    for (const [wx, wy, ww, wh] of [[-7.2, 15.2, 2.0, 4.4], [7.2, 15.2, 2.0, 4.4], [-4.2, 23.0, 1.8, 4.0], [0, 23.4, 2.2, 4.6], [4.2, 23.0, 1.8, 4.0]]) {
      addMesh(new T.PlaneGeometry(ww, wh), castleWinMat, cx + wx, Y + wy, cz + (wy > 20 ? 5.02 : 7.92));
    }
    const cindTowers = [
      { dx: 1.2,   dz: -1.8, y0: 27.0, r: 2.9, h: 12.5, spH: 14.5, mat: mUpper },
      { dx: -4.8,  dz: -0.5, y0: 25.0, r: 2.3, h: 11.0, spH: 12.2, mat: mBlush },
      { dx: 6.4,   dz: 0.2,  y0: 21.0, r: 2.1, h: 10.5, spH: 10.5, mat: mUpper },
      { dx: -7.6,  dz: 4.8,  y0: 14.0, r: 2.1, h: 11.5, spH: 10.2, mat: mUpper },
      { dx: 7.6,   dz: 4.8,  y0: 14.0, r: 2.1, h: 11.5, spH: 10.2, mat: mUpper },
      { dx: -4.0,  dz: 9.2,  y0: 9.0,  r: 1.45, h: 9.2, spH: 7.6,  mat: mBlush },
      { dx: 4.0,   dz: 9.2,  y0: 9.0,  r: 1.45, h: 9.2, spH: 7.6,  mat: mBlush },
      { dx: -13.6, dz: 8.6,  y0: 0,    r: 2.6, h: 14.5, spH: 9.8,  mat: mBase },
      { dx: 13.6,  dz: 8.6,  y0: 0,    r: 2.6, h: 14.5, spH: 9.8,  mat: mBase },
      { dx: -13.4, dz: -8.2, y0: 0,    r: 2.5, h: 16.5, spH: 10.4, mat: mBase },
      { dx: 13.4,  dz: -8.2, y0: 0,    r: 2.5, h: 16.5, spH: 10.4, mat: mBase },
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
      mWhite.add(cyl(tw.r * 1.15, tw.r * 1.02, 0.72, 12), M(tx, Y + tw.y0 + tw.h, tz));
      mGold.add(cyl(tw.r * 1.18, tw.r * 1.18, 0.20, 12), M(tx, Y + tw.y0 + tw.h + 0.42, tz));
      mBlueRoof.add(new T.ConeGeometry(tw.r * 1.16, tw.spH, 12), M(tx, Y + tw.y0 + tw.h + 0.4 + tw.spH / 2, tz));
      const apexY = Y + tw.y0 + tw.h + 0.4 + tw.spH;
      mGold.add(cyl(0.08, 0.14, 2.4, 6), M(tx, apexY + 1.1, tz));
      mGold.add(sph(0.24), M(tx, apexY + 0.2, tz));
    });
    const castleNightBlue = new T.PointLight(0x60a5fa, 0, 68, 1.3); castleNightBlue.position.set(cx, Y + 22, cz + 15); group.add(castleNightBlue);
    const castleNightGold = new T.PointLight(0xfde68a, 0, 48, 1.4); castleNightGold.position.set(cx, Y + 10, cz + 14); group.add(castleNightGold);
    const castleBeams = [];
    const beamMat = new T.MeshBasicMaterial({ map: glowWashTex, transparent: true, opacity: 0.0, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide });
    for (const bx of [-7.5, 0, 7.5]) castleBeams.push(addMesh(new T.PlaneGeometry(16, 36), beamMat, cx + bx, Y + 20, cz + 10.6));

    /* ============================================================================
     * 5. KING ARTHUR / REGAL CARROUSEL (carX = AX, carZ = 162) & RAPUNZEL TOWER!
     * ============================================================================ */
    const carX = AX, carZ = 162.0;
    mWhite.add(cyl(8.6, 9.2, 0.55, 24), M(carX, Y + 0.28, carZ));
    mUpper.add(cyl(8.2, 8.3, 0.25, 24), M(carX, Y + 0.65, carZ));
    const carouselSpinGrp = new T.Group(); carouselSpinGrp.position.set(carX, Y + 0.78, carZ);
    const carCol = new T.Mesh(cyl(1.5, 1.75, 6.0, 16), whiteTrimMat); carCol.position.y = 3.0; carouselSpinGrp.add(carCol);
    const carRoof = new T.Mesh(new T.ConeGeometry(8.8, 4.2, 24), carouselCanopyMat); carRoof.position.y = 8.1; carouselSpinGrp.add(carRoof);
    const carValance = new T.Mesh(cyl(8.8, 8.8, 0.95, 24), carouselCanopyMat); carValance.position.y = 5.75; carouselSpinGrp.add(carValance);
    const carFin = new T.Mesh(new T.ConeGeometry(0.42, 2.4, 8), goldMat); carFin.position.y = 11.3; carouselSpinGrp.add(carFin);
    const carouselHorses = [];
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2, rH = (i % 2 === 0) ? 6.4 : 4.8;
      const pole = new T.Mesh(cyl(0.06, 0.06, 5.8, 6), goldMat); pole.position.set(Math.cos(a) * rH, 2.9, Math.sin(a) * rH); carouselSpinGrp.add(pole);
      const hGrp = new T.Group(); hGrp.position.set(Math.cos(a) * rH, 1.65, Math.sin(a) * rH); hGrp.rotation.y = -a;
      const hm = horsePorcelainMats[i % horsePorcelainMats.length];
      const torso = new T.Mesh(cyl(0.32, 0.34, 1.35, 8), hm); torso.rotation.x = Math.PI / 2; hGrp.add(torso);
      const saddle = new T.Mesh(new T.BoxGeometry(0.66, 0.14, 0.62), i % 2 === 0 ? crimsonMat : blueSlateMat); saddle.position.y = 0.32; hGrp.add(saddle);
      const neck = new T.Mesh(cyl(0.16, 0.26, 0.88, 8), hm); neck.position.set(0, 0.48, 0.78); neck.rotation.x = 0.42; hGrp.add(neck);
      const head = new T.Mesh(cyl(0.10, 0.17, 0.56, 8), hm); head.position.set(0, 0.82, 1.08); head.rotation.x = 1.25; hGrp.add(head);
      carouselSpinGrp.add(hGrp);
      carouselHorses.push({ grp: hGrp, phase: i * (Math.PI * 0.4), angle: a, radius: rH });
    }
    group.add(carouselSpinGrp);

    // Rapunzel's Tangled Stone Lantern Tower (x=224, z=152) + Floating Sky Lanterns!
    mBase.add(cyl(2.1, 2.5, 14.5, 12), M(224, Y + 7.25, 152));
    mUpper.add(cyl(2.7, 2.3, 4.2, 12), M(224, Y + 16.5, 152));
    mBlueRoof.add(new T.ConeGeometry(3.1, 6.2, 12), M(224, Y + 21.7, 152));
    const skyLanterns = [];
    for (let i = 0; i < 10; i++) {
      const lx = 236 + (i * 11) % 72, lz = 132 + (i * 17) % 42, ly = Y + 12 + (i % 4) * 2.8;
      const lm = addMesh(cyl(0.24, 0.18, 0.48, 8), warmLampMat, lx, ly, lz);
      skyLanterns.push({ mesh: lm, baseY: ly, phase: i * 0.9 });
    }

    /* ============================================================================
     * 6. EXPANDED ADVENTURELAND JUNGLE CRUISE (center 166, 332 — Hippos, Elephants, Backside of Water!)
     * ============================================================================ */
    for (const sd of [-1, 1]) {
      mWood.add(cyl(0.55, 0.72, 7.8, 8), M(236 + sd * 5.2, Y + 3.9, 268));
      mGold.add(sph(0.36), M(236 + sd * 5.2, Y + 8.1, 268));
    }
    box(mWood, 11.6, 1.2, 1.2, 236, Y + 7.4, 268);
    addSign(236, Y + 7.4, 267.2, 9.2, '探险世界 · ADVENTURELAND', 'ENCHANTED TIKI ROOM · INDIANA JONES · JUNGLE CRUISE', '#2e1d10', '#e2b13c', Math.PI);

    // Jungle Cruise Boathouse Dock (x=193, z=322)
    box(mWood, 7.8, 0.45, 8.2, 193, Y - 0.1, 322);
    for (const dx of [-3.4, 3.4]) for (const dz of [-3.6, 3.6]) mWood.add(cyl(0.18, 0.22, 4.6, 6), M(193 + dx, Y + 2.2, 322 + dz));
    mSlate.add(new T.ConeGeometry(5.8, 2.4, 4), M(193, Y + 5.6, 322, 0, Math.PI / 4, 0));

    // Schweitzer Falls & "The Eighth Wonder of the World: THE BACKSIDE OF WATER!" (x=146, z=320)
    addMesh(new T.PlaneGeometry(8.5, 13.0), waterJetMat, 146, Y + 3.0, 322, 0.22, 0.45, 0);
    // Jungle Cruise River Island Ancient Shrine (x=166, z=332)
    for (let tier = 0; tier < 4; tier++) box(mMayan, 15.0 - tier * 2.8, 2.2, 15.0 - tier * 2.8, 166, Y + tier * 2.2 + 1.1, 332);
    const templeIdol = addMesh(new T.OctahedronGeometry(0.95, 0), goldMat, 166, Y + 11.2, 332);
    // Hippo Pool (x=166, z=352) & Indian Elephant Bathing Pool (x=142, z=338) + Trapped Safari Pole (x=178, z=348)!
    for (const [hx, hz] of [[162, 353], [168, 355], [172, 351]]) {
      mSlate.add(sph(1.15, 7), M(hx, world.WATER_Y + 0.1, hz, 0, 0, 0, 1.3, 0.65, 0.95)); // Surfacing Hippos!
    }
    for (const [ex, ez] of [[141, 336], [143, 343]]) {
      mBase.add(sph(1.45, 8), M(ex, world.WATER_Y + 1.1, ez, 0, 0, 0, 1.2, 0.95, 1.4)); // Bathing Elephants!
      mBase.add(cyl(0.22, 0.32, 1.8, 6), M(ex + 1.2, world.WATER_Y + 1.8, ez + 0.8, 0, 0, -0.6)); // Raised spraying trunk!
    }
    mWood.add(cyl(0.18, 0.24, 6.2, 6), M(180, Y + 3.1, 346)); // Trapped Safari Explorer pole + Rhino below!
    mSlate.add(sph(1.1, 7), M(179, Y + 0.9, 346, 0, 0, 0, 1.4, 0.85, 0.9));

    const boatGrp = new T.Group();
    const bHull = new T.Mesh(new T.BoxGeometry(2.8, 0.85, 6.4), woodMat); bHull.position.y = 0.35; boatGrp.add(bHull);
    const bCanopy = new T.Mesh(new T.BoxGeometry(2.75, 0.22, 4.8), carouselCanopyMat); bCanopy.position.y = 2.95; boatGrp.add(bCanopy);
    for (const sx of [-1.18, 1.18]) for (const sz of [-2.1, 0, 2.1]) {
      const p = new T.Mesh(cyl(0.06, 0.06, 2.1, 6), darkIronMat); p.position.set(sx, 1.9, sz); boatGrp.add(p);
    }
    boatGrp.position.set(190, world.WATER_Y + 0.05, 328);
    group.add(boatGrp);

    /* ============================================================================
     * 7. TOMORROWLAND CONCOURSE, ASTRO ORBITER (352, 258) & 32-RIB SPACE MOUNTAIN EXTERIOR (428, 286)!
     * ============================================================================ */
    for (const sd of [-1, 1]) {
      mMayan.add(new T.ConeGeometry(3.8, 11.5, 5), M(322, Y + 5.6, 258 + sd * 11.5, 0, 0.3, -sd * 0.22)); // Tomorrowland Entrance Rocks!
      box(mChrome, 1.3, 8.8, 1.8, 330, Y + 4.4, 258 + sd * 7.2);
      box(mCyan, 0.24, 8.2, 0.24, 329.2, Y + 4.4, 258 + sd * 7.2);
    }
    box(mChrome, 1.5, 1.1, 16.0, 330, Y + 9.0, 258);
    addSign(329.1, Y + 9.0, 258, 10.2, '明日世界 · TOMORROWLAND', 'SPACE MOUNTAIN · ASTRO ORBITER · STAR TOURS · AUTOPIA', '#0c2d48', '#38bdf8', -Math.PI / 2);

    const sjX = 352.0, sjZ = 258.0;
    mChrome.add(cyl(4.6, 5.6, 1.3, 24), M(sjX, Y + 0.65, sjZ));
    const starjetHubGrp = new T.Group(); starjetHubGrp.position.set(sjX, Y + 1.3, sjZ);
    const sjSpire = new T.Mesh(cyl(1.15, 2.3, 15.2, 16), chromeMat); sjSpire.position.y = 7.6; starjetHubGrp.add(sjSpire);
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
      armGrp.add(ship); starjetHubGrp.add(armGrp);
      starjetShips.push({ armGrp, ship, baseAngle: a });
    }
    group.add(starjetHubGrp);

    // 32-Rib Iconic White SPACE MOUNTAIN Spire Dome (x=428, z=286)!
    const smX = 428, smZ = 286;
    mWhite.add(cyl(18.5, 20.2, 4.4, 32), M(smX, Y + 2.2, smZ));
    mWhite.add(new T.ConeGeometry(19.0, 24.5, 32), M(smX, Y + 16.5, smZ));
    mChrome.add(cyl(4.4, 6.0, 2.6, 16), M(smX, Y + 27.2, smZ));
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      addRibSeg(mChrome, [smX + Math.cos(a) * 19.2, Y + 4.2, smZ + Math.sin(a) * 19.2], [smX + Math.cos(a) * 4.4, Y + 28.2, smZ + Math.sin(a) * 4.4], 0.36, 0.20);
    }
    box(mChrome, 7.2, 4.6, 6.0, smX - 18.5, Y + 2.3, smZ - 10.0, 0, 0.52, 0);
    addSign(smX - 20.5, Y + 5.8, smZ - 11.5, 9.2, '太空山 · SPACE MOUNTAIN (可乘坐!)', 'PRESS E TO LAUNCH INTO DEEP SPACE COASTER!', '#0f172a', '#38bdf8', 0.52 + Math.PI);

    // PeopleMover Elevated Loop + Hologram City & Robot (x=396, z=258)
    mChrome.add(new T.TorusGeometry(22.0, 0.42, 6, 36), M(396, Y + 5.6, 258, Math.PI / 2, 0, 0));
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      mChrome.add(cyl(0.45, 0.58, 5.6, 8), M(396 + Math.cos(a) * 22.0, Y + 2.8, 258 + Math.sin(a) * 22.0));
    }
    const pmCars = [];
    for (let c = 0; c < 3; c++) {
      const cg = new T.Group();
      const b = new T.Mesh(new T.BoxGeometry(1.6, 1.15, 3.4), c === 0 ? cyanNeonMat : whiteTrimMat); b.position.y = 0.72; cg.add(b);
      group.add(cg); pmCars.push(cg);
    }
    box(mChrome, 5.4, 1.2, 5.4, 396, Y + 0.6, 258);
    const holoCity = new T.Group(); holoCity.position.set(396, Y + 2.4, 258);
    for (const [hx, hz, hh] of [[0, 0, 3.0], [-1.1, 0.6, 1.9], [1.1, -0.5, 2.2]]) {
      const b = new T.Mesh(new T.BoxGeometry(0.55, hh, 0.55), holoMat); b.position.set(hx, hh / 2, hz); holoCity.add(b);
    }
    group.add(holoCity);
    const robotGrp = new T.Group(); robotGrp.position.set(391.5, Y, 258);
    const rBody = new T.Mesh(cyl(0.45, 0.55, 1.3, 10), chromeMat); rBody.position.y = 0.95; robotGrp.add(rBody);
    const rHead = new T.Mesh(sph(0.42, 10), whiteTrimMat); rHead.position.y = 1.92; robotGrp.add(rHead);
    const rArm = new T.Mesh(new T.BoxGeometry(0.18, 0.85, 0.18), cyanNeonMat); rArm.position.set(0.62, 1.25, 0); robotGrp.add(rArm);
    group.add(robotGrp);

    /* ============================================================================
     * 8. RIDEABLE 4-STATION DISNEYLAND STEAM RAILROAD + PRIMEVAL WORLD DINOSAUR TUNNEL!
     * ============================================================================ */
    // Primeval World / Grand Canyon Dinosaur Diorama Tunnel along East Berm (a ≈ 0.35..0.68 rad around 266,268, rx=202, rz=202)!
    for (let i = 0; i < 7; i++) {
      const a = 0.36 + i * 0.052;
      const tx = 266 + Math.cos(a) * 202, tz = 268 + Math.sin(a) * 202, rot = Math.atan2(-Math.cos(a), Math.sin(a));
      box(mMayan, 9.6, 6.2, 11.5, tx, Y + 3.1, tz, 0, rot, 0);
      if (i === 2 || i === 4) {
        // Prehistoric T-Rex & Stegosaurus silhouettes + Glowing Lava River inside the Tunnel!
        mLamp.add(sph(0.85, 6), M(tx - 2.4, Y + 1.2, tz));
        mLeaf.add(cyl(0.6, 1.1, 3.8, 6), M(tx - 2.6, Y + 2.2, tz + 1.5));
        mLeaf.add(sph(0.9, 6), M(tx - 2.6, Y + 4.2, tz + 2.0));
      }
    }
    addSign(446, Y + 6.8, 346, 9.5, '史前恐龙大峡谷隧道 · PRIMEVAL WORLD', 'DISNEYLAND RAILROAD GRAND CANYON & DINOSAURS', '#1c1917', '#ef4444', -Math.PI / 2);

    const trainCars = [];
    for (let c = 0; c < 4; c++) {
      const cg = new T.Group();
      const isEngine = c === 0;
      const body = new T.Mesh(new T.BoxGeometry(2.6, isEngine ? 2.2 : 1.15, 5.4), isEngine ? crimsonMat : (c % 2 === 1 ? blueSlateMat : goldMat));
      body.position.y = isEngine ? 1.35 : 0.85; cg.add(body);
      if (isEngine) {
        const stack = new T.Mesh(cyl(0.36, 0.25, 1.6, 8), darkIronMat); stack.position.set(0, 2.8, 1.8); cg.add(stack);
        const lamp = new T.Mesh(sph(0.28, 8), warmLampMat); lamp.position.set(0, 1.6, 2.8); cg.add(lamp);
      } else {
        // Authentic Disneyland Open-Air Excursion Coach Canopy on slender brass posts!
        const roof = new T.Mesh(new T.BoxGeometry(2.85, 0.22, 5.65), castleUpperMat); roof.position.y = 3.25; cg.add(roof);
        for (const sx of [-1.25, 1.25]) for (const sz of [-2.45, 0, 2.45]) {
          const post = new T.Mesh(cyl(0.05, 0.05, 1.85, 6), goldMat); post.position.set(sx, 2.32, sz); cg.add(post);
        }
      }
      group.add(cg); trainCars.push(cg);
    }
    const rrState = { running: true, ang: Math.PI / 2, eventIdx: -1 };
    const railroadRide = {
      id: 'railroad_tour', name: '迪士尼蒸汽火车 4 站环园游（Disneyland Railroad）', land: 'Main Street, U.S.A.',
      boardPos: { x: AX, y: Y, z: 468 },
      exitPos:  { x: AX, y: Y, z: 452, yaw: 0 },
      start: () => { rrState.running = true; },
      stop:  () => { rrState.running = false; },
      isRunning: () => rrState.running,
      getCameraPose: (thirdPerson) => {
        const car = trainCars[1], p = car.position, yaw = car.rotation.y;
        const fx = Math.sin(yaw), fz = Math.cos(yaw);
        if (thirdPerson) return { px: p.x - fx * 11 + fz * 5, py: p.y + 5.2, pz: p.z - fz * 11 - fx * 5, tx: trainCars[0].position.x, ty: p.y + 2.0, tz: trainCars[0].position.z };
        return { px: p.x, py: p.y + 2.25, pz: p.z, tx: p.x + fx * 18 - fz * 6, ty: p.y + 2.1, tz: p.z + fz * 18 + fx * 6 };
      }
    };

    /* ---------------- Build Modular Disneyland 1:1 Lands, Landmarks, Star Wars & Orlando ---------------- */
    const landmarks = root.TPLandmarks ? root.TPLandmarks.build(scene, world, group) : null;
    const dl1to1 = root.TPDisneyland1to1 ? root.TPDisneyland1to1.build(scene, world, group) : null;
    const starWars = root.TPStarWars ? root.TPStarWars.build(scene, world, group) : null;
    const smallWorld = root.TPSmallWorld ? root.TPSmallWorld.build(scene, world, group) : null;
    const orlando = root.TPOrlando ? root.TPOrlando.build(scene, world, group) : null;
    const california = root.TPCalifornia ? root.TPCalifornia.build(scene, world, group) : null;
    const paris = root.TPParis ? root.TPParis.build(scene, world, group) : null;

    /* ---------------- Flush All Static Merged Architectural Meshes ---------------- */
    mBase.mesh(castleBaseMat); mUpper.mesh(castleUpperMat); mBlush.mesh(castleBlushMat, false); mBlueRoof.mesh(blueSlateMat);
    mGold.mesh(goldMat, false); mWhite.mesh(whiteTrimMat, false); mBrick.mesh(brickMat); mSlate.mesh(slateDarkMat, false);
    mWood.mesh(woodMat, false); mIron.mesh(darkIronMat, false); mMayan.mesh(mayanStoneMat, false); mChrome.mesh(chromeMat, false);
    mCyan.mesh(cyanNeonMat, false); mLamp.mesh(warmLampMat, false); mRed.mesh(crimsonMat, false); mLeaf.mesh(leafMat, false);

    /* ================= 9. NIGHTTIME CASTLE FIREWORKS ENGINE ================= */
    const fwBursts = [];
    const fwColors = [0xfef08a, 0xf472b6, 0x38bdf8, 0x34d399, 0xc084fc, 0xfb923c];
    let fwShowTimer = 0, fwLaunchCooldown = 0;

    function spawnFireworkBurst() {
      const fx = cx + (Math.random() - 0.5) * 54;
      const fy = Y + 44 + Math.random() * 24;
      const fz = cz - 14 + (Math.random() - 0.5) * 18;
      const col = fwColors[(Math.random() * fwColors.length) | 0];
      const count = 64, pos = new Float32Array(count * 3), vels = [];
      for (let i = 0; i < count; i++) {
        const th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1), sp = 9 + Math.random() * 11;
        vels.push([Math.sin(ph) * Math.cos(th) * sp, Math.cos(ph) * sp, Math.sin(ph) * Math.sin(th) * sp]);
      }
      const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.BufferAttribute(pos, 3));
      const mat = new T.PointsMaterial({ color: col, map: sparkTex, size: 3.4, transparent: true, opacity: 1, blending: T.AdditiveBlending, depthWrite: false });
      const pts = new T.Points(geo, mat); pts.position.set(fx, fy, fz); group.add(pts);
      fwBursts.push({ pts, geo, mat, vels, age: 0, life: 2.6 });
    }
    function triggerFireworks() { fwShowTimer = 28; fwLaunchCooldown = 0; spawnFireworkBurst(); }

    /* ================= 10. ALL 12 RIDEABLE ATTRACTIONS REGISTRY ================= */
    const rideState = {
      carousel:   { running: true, angle: 0, speed: 0.52 },
      river_boat: { running: false, t: 0, speed: 0.038, eventIdx: -1 },
      starjet:    { running: false, angle: 0, speed: 0, targetSpeed: 0.92, lift: 0 }
    };

    const rides = {
      railroad_tour: railroadRide,
      carousel: {
        id: 'carousel', name: '亚瑟王皇家旋转木马（King Arthur Carrousel）', land: 'Fantasyland',
        boardPos: { x: carX, y: Y, z: carZ + 10.2 },
        exitPos:  { x: carX, y: Y, z: carZ + 11.8, yaw: 0 },
        start: () => { rideState.carousel.running = true; },
        stop:  () => { rideState.carousel.running = false; },
        isRunning: () => rideState.carousel.running,
        getCameraPose: (thirdPerson) => {
          const h = carouselHorses[0], worldAng = rideState.carousel.angle + h.angle;
          const hx = carX + Math.cos(worldAng) * h.radius, hz = carZ + Math.sin(worldAng) * h.radius;
          const hy = Y + 0.78 + h.grp.position.y + 1.15;
          if (thirdPerson) return { px: carX + Math.cos(worldAng - 0.55) * 15.2, py: Y + 5.6, pz: carZ + Math.sin(worldAng - 0.55) * 15.2, tx: carX + (hx - carX) * 0.45, ty: hy + 0.65, tz: carZ + (hz - carZ) * 0.45 };
          return { px: hx, py: hy, pz: hz, tx: carX + Math.cos(worldAng + 0.45) * h.radius, ty: hy - 0.12, tz: carZ + Math.sin(worldAng + 0.45) * h.radius };
        }
      },
      river_boat: {
        id: 'river_boat', name: '丛林河流探险船（Jungle Cruise）', land: 'Adventureland',
        boardPos: { x: 193.0, y: Y, z: 322.0 },
        exitPos:  { x: 198.0, y: Y, z: 322.0, yaw: Math.PI / 2 },
        start: () => { rideState.river_boat.running = true; },
        stop:  () => { rideState.river_boat.running = false; },
        isRunning: () => rideState.river_boat.running,
        getCameraPose: (thirdPerson) => {
          const bp = boatGrp.position, yaw = boatGrp.rotation.y, fwdX = Math.sin(yaw), fwdZ = Math.cos(yaw);
          if (thirdPerson) return { px: bp.x - fwdX * 7.8, py: bp.y + 4.3, pz: bp.z - fwdZ * 7.8, tx: bp.x + fwdX * 6, ty: bp.y + 1.6, tz: bp.z + fwdZ * 6 };
          return { px: bp.x + fwdX * 0.8, py: bp.y + 2.05, pz: bp.z + fwdZ * 0.8, tx: bp.x + fwdX * 14, ty: bp.y + 2.1, tz: bp.z + fwdZ * 14 };
        }
      },
      starjet: {
        id: 'starjet', name: '星际轨道飞行器（Astro Orbiter）', land: 'Tomorrowland',
        boardPos: { x: sjX - 8.5, y: Y, z: sjZ + 8.5 },
        exitPos:  { x: sjX - 11.5, y: Y, z: sjZ + 11.0, yaw: -0.7 },
        start: () => { rideState.starjet.running = true; },
        stop:  () => { rideState.starjet.running = false; },
        isRunning: () => rideState.starjet.running,
        getCameraPose: (thirdPerson) => {
          const s = starjetShips[0], wp = new T.Vector3(); s.ship.getWorldPosition(wp);
          const worldAng = rideState.starjet.angle + s.baseAngle, fwdX = -Math.sin(worldAng), fwdZ = Math.cos(worldAng);
          if (thirdPerson) return { px: wp.x - fwdX * 10.5 + Math.cos(worldAng) * 5.2, py: wp.y + 3.8, pz: wp.z - fwdZ * 10.5 + Math.sin(worldAng) * 5.2, tx: sjX, ty: Y + 9.2, tz: sjZ };
          return { px: wp.x, py: wp.y + 1.15, pz: wp.z, tx: wp.x + fwdX * 16, ty: wp.y - 0.6, tz: wp.z + fwdZ * 16 };
        }
      }
    };
    if (dl1to1) {
      if (dl1to1.piratesRide) rides.pirates_ride = dl1to1.piratesRide;
      if (dl1to1.spaceMountainRide) rides.space_mountain = dl1to1.spaceMountainRide;
    }
    if (starWars && starWars.falconRide) rides.falcon_flight = starWars.falconRide;
    if (smallWorld) rides.small_world_boat = smallWorld.ride;
    if (orlando) Object.assign(rides, orlando.rides);

    const interactables = [
      { id: 'wishing_well', name: '白雪公主许愿井飞瀑', x: 302, y: Y, z: 214, msg: '✨ 城堡东岸的白雪公主许愿井泛起回声与星光，你的愿望已飞向城堡尖塔！' },
      { id: 'temple_idol', name: '丛林古神殿圣像', x: 166, y: Y + 8, z: 332, msg: '🔥 热带雨林神庙机关触发！黄金圣像绽放神秘金光！' },
      { id: 'holo_console', name: '明日世界全息控制台', x: 396, y: Y, z: 258, msg: '🤖 未来城市全息投影切换至「1967 新明日世界」模式！机器人向你挥手致意！' },
      { id: 'savi_lightsaber', name: '萨维光剑工坊', x: 141.5, y: Y, z: 84, msg: '⚔️ 凯伯水晶共鸣！你已亲手组装并点亮专属绝地光剑——愿原力与你同在！' }
    ];
    if (dl1to1 && dl1to1.extraInteractables) interactables.push(...dl1to1.extraInteractables);
    if (california) { Object.assign(rides, california.rides); interactables.push(...california.interactables); }
    if (orlando) interactables.push(...orlando.interactables);
    if (paris) { Object.assign(rides, paris.rides); interactables.push(...paris.interactables); }

    let elapsed = 0;
    function update(dt, time, cam, nightF, onEvent) {
      elapsed += dt;
      if (landmarks) landmarks.update(dt, elapsed, onEvent);
      if (dl1to1) dl1to1.update(dt, elapsed, onEvent);
      if (starWars) starWars.update(dt, elapsed, onEvent);
      if (smallWorld) smallWorld.update(dt, elapsed, onEvent, cam);
      if (orlando) orlando.update(dt, elapsed, nightF, onEvent);
      if (california) california.update(dt, elapsed, onEvent);
      if (paris) paris.update(dt, elapsed, onEvent);

      // Main Street Streetcar & Double-Decker Omnibus cruising the full 120m Boulevard!
      trolleyGrp.position.z = 352 + Math.sin(elapsed * 0.16) * 52;
      floatGrp.position.z = 352 - Math.sin(elapsed * 0.16) * 48;
      fCrown.rotation.y = elapsed * 1.8;

      swanBoats.forEach((sb) => {
        const a = elapsed * 0.18 + sb.phase;
        const sx = cx + Math.cos(a) * 24.5, sz = cz + Math.sin(a) * 23.0;
        const nx = cx + Math.cos(a + 0.04) * 24.5, nz = cz + Math.sin(a + 0.04) * 23.0;
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

      // 4-Station Disneyland Steam Railroad Grand Circle Tour!
      if (rrState.running) rrState.ang = (rrState.ang + dt * 0.075) % (Math.PI * 2);
      trainCars.forEach((cg, idx) => {
        const a = rrState.ang - idx * 0.032;
        const tx = 266 + Math.cos(a) * 202, tz = 268 + Math.sin(a) * 202;
        const nx = 266 + Math.cos(a + 0.02) * 202, nz = 268 + Math.sin(a + 0.02) * 202;
        cg.position.set(tx, Y + 0.05, tz); cg.rotation.y = Math.atan2(nx - tx, nz - tz);
      });

      if (rideState.carousel.running) rideState.carousel.angle += dt * rideState.carousel.speed;
      carouselSpinGrp.rotation.y = rideState.carousel.angle;
      carouselHorses.forEach((h) => { h.grp.position.y = 1.65 + Math.sin(rideState.carousel.angle * 3.0 + h.phase) * 0.42; });

      if (rideState.river_boat.running) {
        rideState.river_boat.t += dt * rideState.river_boat.speed;
        const a = rideState.river_boat.t * Math.PI * 2;
        const bx = 166 + Math.cos(a) * 25.5, bz = 332 + Math.sin(a) * 20.5;
        const nx = 166 + Math.cos(a + 0.03) * 25.5, nz = 332 + Math.sin(a + 0.03) * 20.5;
        boatGrp.position.set(bx, world.WATER_Y + 0.08 + Math.sin(elapsed * 3) * 0.05, bz);
        boatGrp.rotation.y = Math.atan2(nx - bx, nz - bz);
        const ev = Math.floor((rideState.river_boat.t % 1) * 4);
        if (ev !== rideState.river_boat.eventIdx) {
          rideState.river_boat.eventIdx = ev;
          if (onEvent) onEvent([
            '⛵ 探险船启航！前方进入河马池与受困探险队营地…',
            '🐘 驶入【印度大象戏水池】与雨林古神庙遗迹！',
            '🌊 见证世界第八大奇迹——【水之背面（The Backside of Water）】施韦泽大瀑布！',
            '🏝️ 丛林探险即将圆满结束，游船平稳返航探险码头！'
          ][ev]);
        }
        if (rideState.river_boat.t >= 1.0) {
          rideState.river_boat.t = 0; rideState.river_boat.running = false; rideState.river_boat.eventIdx = -1;
          boatGrp.position.set(190, world.WATER_Y + 0.05, 328);
          if (onEvent) onEvent('⚓ 丛林探险船已安全靠岸！');
        }
      }

      const sj = rideState.starjet;
      sj.speed += ((sj.running ? sj.targetSpeed : 0.14) - sj.speed) * Math.min(1, dt * 1.8);
      sj.angle += dt * sj.speed;
      sj.lift += ((sj.running ? 1.0 : 0.0) - sj.lift) * Math.min(1, dt * 1.4);
      starjetHubGrp.rotation.y = sj.angle;
      starjetShips.forEach((s, idx) => {
        s.armGrp.rotation.z = sj.lift * (0.36 + Math.sin(elapsed * 1.6 + idx * 1.05) * 0.18) - 0.18;
        s.ship.rotation.z = -sj.lift * 0.35;
      });

      magicCrystal.rotation.y = elapsed * 1.6;
      magicCrystal.position.y = Y + 2.4 + Math.sin(elapsed * 2.5) * 0.25;
      skyLanterns.forEach((l) => { l.mesh.position.y = l.baseY + Math.sin(elapsed * 1.4 + l.phase) * 0.65; });
      const pmA = elapsed * 0.36;
      pmCars.forEach((cg, idx) => {
        const a = pmA - idx * 0.19;
        const px = 396 + Math.cos(a) * 22.0, pz = 258 + Math.sin(a) * 22.0;
        const nx = 396 + Math.cos(a + 0.04) * 22.0, nz = 258 + Math.sin(a + 0.04) * 22.0;
        cg.position.set(px, Y + 5.85, pz); cg.rotation.y = Math.atan2(nx - px, nz - pz);
      });
      templeIdol.rotation.y = elapsed * 0.9;
      holoCity.rotation.y = elapsed * 0.7;
      rArm.rotation.z = Math.sin(elapsed * 3.5) * 0.45 + 0.4;

      fountainSprays.forEach((fs) => {
        const arr = fs.geo.attributes.position.array;
        for (let k = 0; k < fs.phase.length; k++) {
          const ph = fs.phase[k], t = (elapsed * 0.85 + ph.off) % 1.0;
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
