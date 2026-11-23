/* Minest My World · Full Disneyland Park Iconic Landmarks & Sculpted 3D Parkland
 * Adds: Matterhorn Bobsleds, "it's a small world", Dumbo, Mad Tea Party, Big Thunder Mountain Railroad,
 * Haunted Mansion & New Orleans Square, Mark Twain Riverboat, Banyan Treehouse, Submarine Lagoon,
 * Disneyland Monorail, and 240+ Sculpted 3D Architectural Trees, Palms, Pines & River Boulders. */
(function (root) {
  'use strict';

  function build(scene, world, group) {
    const T = root.THREE;
    const Y = world.PARK_Y;
    const WY = world.WATER_Y;

    function cvs(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
    function finTex(c, rep) {
      const tx = new T.CanvasTexture(c);
      if (T.sRGBEncoding !== undefined) tx.encoding = T.sRGBEncoding;
      if (rep) { tx.wrapS = tx.wrapT = T.RepeatWrapping; }
      return tx;
    }

    function makeRockTex(baseHex, veinHex, streak) {
      const c = cvs(256, 256), x = c.getContext('2d');
      x.fillStyle = baseHex; x.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 48; i++) {
        x.fillStyle = i % 2 === 0 ? veinHex : 'rgba(255,255,255,0.08)';
        if (streak) {
          x.fillRect(0, (i * 11) % 256, 256, 4 + (i % 7));
        } else {
          x.beginPath();
          x.ellipse((i * 53) % 256, (i * 37) % 256, 22 + (i % 24), 10 + (i % 14), (i % 5) * 0.4, 0, Math.PI * 2);
          x.fill();
        }
      }
      return finTex(c, true);
    }

    function makeSmallWorldClockTex() {
      const c = cvs(256, 256), x = c.getContext('2d');
      x.fillStyle = '#fffdf7'; x.fillRect(0, 0, 256, 256);
      // Iconic Mary Blair golden sun rays
      x.strokeStyle = '#eab308'; x.lineWidth = 6;
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2;
        x.beginPath(); x.moveTo(128 + Math.cos(a) * 68, 128 + Math.sin(a) * 68);
        x.lineTo(128 + Math.cos(a) * 118, 128 + Math.sin(a) * 118); x.stroke();
      }
      // Smiling golden clock face
      x.fillStyle = '#facc15'; x.beginPath(); x.arc(128, 128, 70, 0, Math.PI * 2); x.fill();
      x.strokeStyle = '#d97706'; x.lineWidth = 6; x.stroke();
      // Eyes & cheerful smile
      x.fillStyle = '#1e293b';
      x.beginPath(); x.arc(104, 112, 8, 0, Math.PI * 2); x.arc(152, 112, 8, 0, Math.PI * 2); x.fill();
      x.strokeStyle = '#92400e'; x.lineWidth = 6;
      x.beginPath(); x.arc(128, 134, 28, 0.15 * Math.PI, 0.85 * Math.PI); x.stroke();
      return finTex(c, false);
    }

    // Batch Merger Helper
    function Merger() {
      const parts = [];
      this.add = (geo, mat4) => {
        const g = geo.index ? geo.toNonIndexed() : geo.clone();
        if (mat4) g.applyMatrix4(mat4);
        parts.push(g);
      };
      this.mesh = (mat, cast) => {
        if (!parts.length) return null;
        let total = 0;
        for (const g of parts) total += g.attributes.position.count;
        const pos = new Float32Array(total * 3), norm = new Float32Array(total * 3), uv = new Float32Array(total * 2);
        let o = 0;
        for (const g of parts) {
          const p = g.attributes.position.array, n = g.attributes.normal.array, u = g.attributes.uv ? g.attributes.uv.array : null;
          const cnt = g.attributes.position.count;
          pos.set(p, o * 3); norm.set(n, o * 3);
          if (u) uv.set(u, o * 2);
          o += cnt; g.dispose();
        }
        const bg = new T.BufferGeometry();
        bg.setAttribute('position', new T.BufferAttribute(pos, 3));
        bg.setAttribute('normal', new T.BufferAttribute(norm, 3));
        bg.setAttribute('uv', new T.BufferAttribute(uv, 2));
        const m = new T.Mesh(bg, mat);
        m.castShadow = false;
        m.receiveShadow = true;
        group.add(m);
        return m;
      };
    }

    const M = (x, y, z, rx, ry, rz, sx, sy, sz) => {
      const m = new T.Matrix4(), q = new T.Quaternion().setFromEuler(new T.Euler(rx || 0, ry || 0, rz || 0));
      m.compose(new T.Vector3(x, y, z), q, new T.Vector3(sx || 1, sy || 1, sz || 1));
      return m;
    };
    const box = (mr, w, h, d, x, y, z, rx, ry, rz) => mr.add(new T.BoxGeometry(w, h, d), M(x, y, z, rx, ry, rz));
    const cyl = (rt, rb, h, seg) => new T.CylinderGeometry(rt, rb, h, seg || 8);
    const sph = (r, seg) => new T.SphereGeometry(r, seg || 6, Math.max(4, (seg || 6) - 2));

    // Materials
    const alpineRockMat = new T.MeshLambertMaterial({ map: makeRockTex('#7a8086', 'rgba(42,48,54,0.45)', false), emissive: 0x0d1014 });
    const snowMat = new T.MeshLambertMaterial({ color: 0xf4f8fc, emissive: 0x1c2430 });
    const redRockMat = new T.MeshLambertMaterial({ map: makeRockTex('#b85234', 'rgba(122,42,20,0.48)', true), emissive: 0x1a0904 });
    const redRockDarkMat = new T.MeshLambertMaterial({ map: makeRockTex('#8f3b22', 'rgba(72,24,12,0.5)', true), emissive: 0x120602 });
    const whiteMat = new T.MeshLambertMaterial({ color: 0xf8f6f0, emissive: 0x1a1916 });
    const goldMat = new T.MeshPhongMaterial({ color: 0xe6b83c, specular: 0xfef08a, shininess: 72, emissive: 0x241904 });
    const pastelBlueMat = new T.MeshLambertMaterial({ color: 0x7dd3fc, emissive: 0x0b1e2e });
    const pastelPinkMat = new T.MeshLambertMaterial({ color: 0xf9a8d4, emissive: 0x220c18 });
    const crimsonMat = new T.MeshLambertMaterial({ color: 0x9f1239, emissive: 0x180408 });
    const ironMat = new T.MeshPhongMaterial({ color: 0x252b36, specular: 0x94a3b8, shininess: 42 });
    const woodMat = new T.MeshLambertMaterial({ color: 0x7a4f2c, emissive: 0x100804 });
    const slateMat = new T.MeshLambertMaterial({ color: 0x334155, emissive: 0x0a0e14 });
    const barkMat = new T.MeshLambertMaterial({ color: 0x5c3e26, emissive: 0x0b0704 });
    const leafDarkMat = new T.MeshLambertMaterial({ color: 0x245e30, emissive: 0x051207 });
    const leafMidMat = new T.MeshLambertMaterial({ color: 0x347d3d, emissive: 0x071609 });
    const leafPalmMat = new T.MeshLambertMaterial({ color: 0x2f8548, emissive: 0x06160a });
    const blossomMat = new T.MeshLambertMaterial({ color: 0xf4a8c4, emissive: 0x220d16 });
    const pineMat = new T.MeshLambertMaterial({ color: 0x1e4d38, emissive: 0x04100a });
    const waterFallMat = new T.MeshPhongMaterial({ color: 0xbae6fd, specular: 0xffffff, shininess: 95, transparent: true, opacity: 0.72, side: T.DoubleSide });
    const warmGlowMat = new T.MeshBasicMaterial({ color: 0xfff3c4 });
    const yellowSubMat = new T.MeshPhongMaterial({ color: 0xfacc15, specular: 0xfef9c3, shininess: 60 });
    const concreteMat = new T.MeshLambertMaterial({ color: 0xdbe3ec, emissive: 0x161c24 });

    const mRock = new Merger(), mSnow = new Merger(), mRedRock = new Merger(), mRedDark = new Merger();
    const mWhite = new Merger(), mGold = new Merger(), mPBlue = new Merger(), mPPink = new Merger();
    const mRed = new Merger(), mIron = new Merger(), mWood = new Merger(), mSlate = new Merger();
    const mBark = new Merger(), mLeafD = new Merger(), mLeafM = new Merger(), mPalm = new Merger();
    const mBlossom = new Merger(), mPine = new Merger(), mGlow = new Merger(), mConc = new Merger();

    /* ============================================================================
     * 1. MATTERHORN BOBSLEDS (x=250, z=140 — Iconic 46m Snow-Capped Alpine Peak!)
     * ============================================================================ */
    const mhX = 250, mhZ = 140;
    // Craggy multi-ridge Alpine mountain massif
    mRock.add(new T.ConeGeometry(18.5, 34, 9), M(mhX, Y + 17, mhZ, 0, 0.3, 0));
    mRock.add(new T.ConeGeometry(13.5, 42, 7), M(mhX - 1.5, Y + 21, mhZ - 1.0, 0.04, 0.8, -0.05));
    mRock.add(new T.ConeGeometry(12.0, 24, 7), M(mhX + 8.5, Y + 12, mhZ + 4.5, 0, 0.5, 0.08));
    mRock.add(new T.ConeGeometry(11.0, 21, 7), M(mhX - 9.0, Y + 10.5, mhZ + 5.5, 0, 1.2, -0.08));
    mRock.add(new T.ConeGeometry(10.5, 22, 7), M(mhX + 3.0, Y + 11, mhZ - 9.5, -0.06, 0.2, 0));
    // Gleaming snow-capped Alpine summit & glacial shoulders!
    mSnow.add(new T.ConeGeometry(8.6, 21, 7), M(mhX - 1.8, Y + 36.5, mhZ - 1.2, 0.05, 0.8, -0.06));
    mSnow.add(new T.ConeGeometry(6.8, 13, 7), M(mhX + 7.2, Y + 21.5, mhZ + 3.8, 0, 0.5, 0.08));
    mSnow.add(new T.ConeGeometry(6.0, 12, 7), M(mhX - 7.8, Y + 19.5, mhZ + 4.8, 0, 1.2, -0.08));
    // Alpine Swiss Chalet Base Station + Dark Bobsled Tunnel Portal
    box(mWood, 7.2, 3.6, 5.2, mhX - 10.5, Y + 1.8, mhZ + 11.5);
    mRed.add(new T.ConeGeometry(5.6, 2.8, 4), M(mhX - 10.5, Y + 5.0, mhZ + 11.5, 0, Math.PI / 4, 0));
    box(mIron, 3.2, 3.4, 2.5, mhX + 6.5, Y + 11.5, mhZ + 9.2); // Bobsled cavern opening
    // Cascading Matterhorn Alpine Waterfall pouring toward Submarine Lagoon!
    const mhFall = new T.Mesh(new T.PlaneGeometry(4.2, 18.5), waterFallMat);
    mhFall.position.set(mhX + 11.5, Y + 9.0, mhZ + 5.5); mhFall.rotation.y = Math.PI / 2.5;
    group.add(mhFall);

    /* ============================================================================
     * 2. "it's a small world" — FULL INDOOR CANAL BOAT DARK RIDE + MR. LINCOLN SPEECH STAGE!
     * (x=192.5, z=36..74: Mary Blair Facade + Swinging Pendulum -> 6 Richly Crafted World Halls!)
     * ============================================================================ */
    const swX = 192.5, swZ = 74;

    function makeMaryBlairPanelTex() {
      const c = cvs(256, 256), x = c.getContext('2d');
      x.fillStyle = '#fffdf7'; x.fillRect(0, 0, 256, 256);
      // Iconic Mary Blair gilded geometric diamond & sunburst relief pattern!
      x.strokeStyle = '#eab308'; x.lineWidth = 4;
      for (let gy = 0; gy < 256; gy += 64) {
        for (let gx = 0; gx < 256; gx += 64) {
          x.strokeRect(gx + 6, gy + 6, 52, 52);
          x.fillStyle = ((gx + gy) / 64) % 2 === 0 ? 'rgba(250,204,21,0.28)' : 'rgba(125,211,252,0.22)';
          x.beginPath(); x.moveTo(gx + 32, gy + 10); x.lineTo(gx + 54, gy + 32); x.lineTo(gx + 32, gy + 54); x.lineTo(gx + 10, gy + 32); x.closePath(); x.fill();
          x.fillStyle = '#f59e0b'; x.beginPath(); x.arc(gx + 32, gy + 32, 5, 0, Math.PI * 2); x.fill();
        }
      }
      return finTex(c, true);
    }

    function makeCurtainTex() {
      const c = cvs(128, 256), x = c.getContext('2d');
      for (let i = 0; i < 16; i++) {
        const g = x.createLinearGradient(i * 8, 0, i * 8 + 8, 0);
        g.addColorStop(0, '#6b0f1a'); g.addColorStop(0.5, '#b91c1c'); g.addColorStop(1, '#5c0b14');
        x.fillStyle = g; x.fillRect(i * 8, 0, 8, 256);
      }
      // Golden braided curtain fringe & swag along bottom & top!
      x.fillStyle = '#eab308'; x.fillRect(0, 0, 128, 12); x.fillRect(0, 240, 128, 16);
      return finTex(c, true);
    }

    function makeUSFlagTex() {
      const c = cvs(256, 160), x = c.getContext('2d');
      for (let i = 0; i < 13; i++) {
        x.fillStyle = i % 2 === 0 ? '#b91c1c' : '#f8fafc';
        x.fillRect(0, i * (160 / 13), 256, 160 / 13 + 1);
      }
      x.fillStyle = '#1e3a8a'; x.fillRect(0, 0, 108, 86);
      x.fillStyle = '#ffffff';
      for (let r = 0; r < 5; r++) for (let col = 0; col < 6; col++) {
        x.beginPath(); x.arc(12 + col * 17, 10 + r * 16, 2.6, 0, Math.PI * 2); x.fill();
      }
      return finTex(c, false);
    }

    function makePresidentialSealTex() {
      const c = cvs(256, 256), x = c.getContext('2d');
      x.fillStyle = '#172554'; x.fillRect(0, 0, 256, 256);
      x.strokeStyle = '#facc15'; x.lineWidth = 10;
      x.beginPath(); x.arc(128, 128, 112, 0, Math.PI * 2); x.stroke();
      x.fillStyle = '#1e3a8a'; x.beginPath(); x.arc(128, 128, 102, 0, Math.PI * 2); x.fill();
      // Golden stars ring
      x.fillStyle = '#fef08a';
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2;
        x.beginPath(); x.arc(128 + Math.cos(a) * 86, 128 + Math.sin(a) * 86, 4.5, 0, Math.PI * 2); x.fill();
      }
      // Stylized Golden American Eagle & Shield silhouette
      x.fillStyle = '#eab308';
      x.beginPath(); x.moveTo(128, 62); x.lineTo(192, 108); x.lineTo(156, 134); x.lineTo(164, 178); x.lineTo(128, 158);
      x.lineTo(92, 178); x.lineTo(100, 134); x.lineTo(64, 108); x.closePath(); x.fill();
      x.fillStyle = '#b91c1c'; x.fillRect(112, 108, 32, 34);
      x.fillStyle = '#ffffff'; x.fillRect(118, 114, 6, 26); x.fillRect(130, 114, 6, 26);
      return finTex(c, false);
    }

    function makeEiffelLatticeTex() {
      const c = cvs(128, 256), x = c.getContext('2d');
      x.fillStyle = '#d97706'; x.fillRect(0, 0, 128, 256);
      x.strokeStyle = '#fef08a'; x.lineWidth = 4;
      for (let y = 0; y < 256; y += 32) {
        x.beginPath(); x.moveTo(0, y); x.lineTo(128, y + 32); x.moveTo(128, y); x.lineTo(0, y + 32);
        x.moveTo(0, y); x.lineTo(128, y); x.stroke();
      }
      return finTex(c, true);
    }

    const maryBlairMat = new T.MeshLambertMaterial({ map: makeMaryBlairPanelTex(), emissive: 0x1e1a12 });
    const curtainMat = new T.MeshBasicMaterial({ map: makeCurtainTex() });
    const usFlagMat = new T.MeshBasicMaterial({ map: makeUSFlagTex(), side: T.DoubleSide });
    const sealMat = new T.MeshBasicMaterial({ map: makePresidentialSealTex() });
    const eiffelMat = new T.MeshBasicMaterial({ map: makeEiffelLatticeTex() });

    // Sweeping 42m White-and-Gold Geometric Screen Wall — SPLIT AT CENTER FOR WIDE OPEN CANAL PORTAL (x=188..197)!
    const swWallL = new T.Mesh(new T.BoxGeometry(15.6, 11.5, 3.4), maryBlairMat); swWallL.position.set(swX - 12.2, Y + 5.75, swZ); group.add(swWallL);
    const swWallR = new T.Mesh(new T.BoxGeometry(15.6, 11.5, 3.4), maryBlairMat); swWallR.position.set(swX + 12.2, Y + 5.75, swZ); group.add(swWallR);
    box(mWhite, 9.2, 6.2, 3.4, swX, Y + 8.4, swZ); // Upper portal lintel leaving 8.8m x 5.3m open boat tunnel!
    box(mGold, 40.6, 0.45, 3.8, swX, Y + 11.6, swZ);
    box(mWhite, 12.0, 12.8, 4.4, swX, Y + 12.1, swZ + 0.6); // Central Clock Tower above portal
    box(mGold, 12.6, 0.50, 4.8, swX, Y + 18.6, swZ + 0.6);
    mGold.add(new T.ConeGeometry(3.2, 8.5, 8), M(swX, Y + 23.0, swZ + 0.6)); // Central Golden Spire
    // Golden Portal Frame Arch around Boat Entrance
    box(mGold, 0.45, 5.4, 3.8, swX - 4.4, Y + 2.7, swZ);
    box(mGold, 0.45, 5.4, 3.8, swX + 4.4, Y + 2.7, swZ);
    box(mGold, 9.2, 0.45, 3.8, swX, Y + 5.35, swZ);
    // Smiling Golden Sun-Clock Face + Animated Swinging Golden Pendulum beneath it!
    const swClockMat = new T.MeshLambertMaterial({ map: makeSmallWorldClockTex(), emissive: 0x261d06 });
    const swClock = new T.Mesh(new T.CircleGeometry(3.8, 24), swClockMat);
    swClock.position.set(swX, Y + 12.2, swZ + 2.95);
    group.add(swClock);
    const swPendulum = new T.Group(); swPendulum.position.set(swX, Y + 8.8, swZ + 3.05);
    const pendRod = new T.Mesh(new T.BoxGeometry(0.18, 2.8, 0.12), goldMat); pendRod.position.y = -1.4; swPendulum.add(pendRod);
    const pendDisc = new T.Mesh(cyl(0.85, 0.85, 0.16, 14), goldMat); pendDisc.rotation.x = Math.PI / 2; pendDisc.position.y = -2.8; swPendulum.add(pendDisc);
    group.add(swPendulum);
    // Symmetrical Mary Blair World-Landmark Silhouettes (Eiffel, Onion Domes, Pagoda, Starbursts & Topiary Gardens)
    for (const sd of [-1, 1]) {
      box(mPBlue, 4.6, 13.5, 2.8, swX + sd * 10.5, Y + 6.75, swZ + 0.8);
      mGold.add(new T.ConeGeometry(2.6, 7.5, 6), M(swX + sd * 10.5, Y + 17.2, swZ + 0.8));
      box(mPPink, 5.2, 11.0, 2.8, swX + sd * 16.8, Y + 5.5, swZ + 0.8);
      mWhite.add(sph(2.4, 10), M(swX + sd * 16.8, Y + 12.5, swZ + 0.8));
      mGold.add(cyl(0.12, 0.22, 4.2, 6), M(swX + sd * 16.8, Y + 16.2, swZ + 0.8));
      mGold.add(new T.TorusGeometry(1.6, 0.16, 6, 16), M(swX + sd * 10.5, Y + 8.5, swZ + 2.35));
      for (const tx of [6.8, 13.5]) {
        mLeafM.add(new T.ConeGeometry(1.2, 3.8, 8), M(swX + sd * tx, Y + 2.2, swZ + 17.5));
        mWhite.add(cyl(1.1, 1.3, 0.7, 10), M(swX + sd * tx, Y + 0.35, swZ + 17.5));
        mGold.add(sph(0.28, 6), M(swX + sd * tx, Y + 4.3, swZ + 17.5));
      }
    }
    // White Arched Canal Entry Loading Dock Platforms flanking the Canal!
    for (const sd of [-1, 1]) {
      box(mWhite, 2.2, 0.55, 8.8, swX + sd * 5.6, Y + 0.28, swZ + 12.5);
      box(mGold, 0.18, 1.0, 8.8, swX + sd * 4.5, Y + 0.85, swZ + 12.5);
    }

    // ---- ENCLOSED INDOOR DARK-RIDE SHOW-BUILDING (x=169..216, z=37..73, height=13m) ----
    const darkHallMat = new T.MeshBasicMaterial({ color: 0x111530, side: T.DoubleSide });
    const addDarkWall = (w, h, x, y, z, ry) => {
      const m = new T.Mesh(new T.PlaneGeometry(w, h), darkHallMat);
      m.position.set(x, y, z); if (ry) m.rotation.y = ry; group.add(m);
    };
    addDarkWall(47, 14.0, swX, Y + 6.4, 37.2, 0);                 // North back wall
    addDarkWall(36, 14.0, swX - 23.5, Y + 6.4, 55.2, Math.PI / 2); // West wall
    addDarkWall(36, 14.0, swX + 23.5, Y + 6.4, 55.2, -Math.PI / 2);// East wall
    const swRoof = new T.Mesh(new T.PlaneGeometry(47, 36), darkHallMat);
    swRoof.rotation.x = Math.PI / 2; swRoof.position.set(swX, Y + 13.0, 55.2); group.add(swRoof);
    // Twinkling Hanging Golden Stars & Mary Blair Pastel Mobiles across Dark-Ride Ceiling!
    for (let sx = 175; sx <= 210; sx += 6.5) for (let sz = 43; sz <= 68; sz += 6.0) {
      mGlow.add(sph(0.26, 5), M(sx, Y + 10.8 + ((sx + sz) % 3) * 0.45, sz));
    }
    const showWhite = new T.MeshBasicMaterial({ color: 0xfffdf5 });
    const showGold = new T.MeshBasicMaterial({ color: 0xfacc15 });
    const showPink = new T.MeshBasicMaterial({ color: 0xf472b6 });
    const showCyan = new T.MeshBasicMaterial({ color: 0x38bdf8 });
    const showRed = new T.MeshBasicMaterial({ color: 0xdc2626 });
    const showNavy = new T.MeshBasicMaterial({ color: 0x172554 });
    const showSkin = new T.MeshBasicMaterial({ color: 0xf5cfa8 });
    const showSuit = new T.MeshBasicMaterial({ color: 0x18181b });
    const showWalnut = new T.MeshBasicMaterial({ color: 0x5c361a });
    const swDolls = [];

    function addDancingDoll(dx, dy, dz, dressMat, hatMat) {
      const dg = new T.Group(); dg.position.set(dx, dy, dz);
      const skirt = new T.Mesh(new T.ConeGeometry(0.46, 1.05, 8), dressMat); skirt.position.y = 0.55; dg.add(skirt);
      const sash = new T.Mesh(cyl(0.28, 0.34, 0.22, 8), showGold); sash.position.y = 0.85; dg.add(sash);
      const head = new T.Mesh(sph(0.32, 8), showSkin); head.position.y = 1.32; dg.add(head);
      const hat = new T.Mesh(cyl(0.22, 0.34, 0.28, 8), hatMat || showGold); hat.position.y = 1.64; dg.add(hat);
      // Outstretched joyful dancing arms!
      const arms = new T.Mesh(new T.BoxGeometry(1.15, 0.14, 0.14), dressMat); arms.position.y = 0.98; dg.add(arms);
      group.add(dg);
      swDolls.push({ grp: dg, baseY: dy, phase: dx * 0.7 + dz * 0.5 });
    }

    function makeStageBanner(title, sub, bg, border) {
      const c = cvs(512, 112), x = c.getContext('2d');
      x.fillStyle = bg; x.fillRect(0, 0, 512, 112);
      x.strokeStyle = border; x.lineWidth = 6; x.strokeRect(5, 5, 502, 102);
      x.fillStyle = '#fef3c7'; x.font = '800 28px "Songti SC", Georgia, serif';
      x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(title, 256, 42);
      x.fillStyle = '#fde047'; x.font = '700 17px Georgia, serif'; x.fillText(sub, 256, 80);
      return new T.MeshBasicMaterial({ map: finTex(c, false) });
    }

    // ROOM 1 (EAST-SOUTH: x=211, z=63) — EUROPE HALL (Lattice Eiffel Tower, Dutch Windmill, Tulip Bed & Dancing Dolls!)
    const euStage = new T.Mesh(new T.BoxGeometry(6.5, 1.4, 11.2), showWhite); euStage.position.set(211.5, Y - 2.6, 63); group.add(euStage);
    // Multi-tier Lattice Eiffel Tower with observation decks!
    const efBase = new T.Mesh(cyl(1.1, 1.8, 2.4, 4), eiffelMat); efBase.position.set(211.5, Y - 0.7, 66.2); group.add(efBase);
    const efDeck1 = new T.Mesh(new T.BoxGeometry(2.4, 0.22, 2.4), showGold); efDeck1.position.set(211.5, Y + 0.55, 66.2); group.add(efDeck1);
    const efMid = new T.Mesh(cyl(0.45, 1.05, 2.8, 4), eiffelMat); efMid.position.set(211.5, Y + 2.0, 66.2); group.add(efMid);
    const efTop = new T.Mesh(new T.ConeGeometry(0.42, 2.6, 4), showGold); efTop.position.set(211.5, Y + 4.7, 66.2); group.add(efTop);
    // Dutch Windmill with Gabled Roof & Spinning Lattice Sails
    const millBody = new T.Mesh(cyl(0.85, 1.42, 4.2, 8), showCyan); millBody.position.set(211.5, Y + 0.2, 59.8); group.add(millBody);
    const millCap = new T.Mesh(new T.ConeGeometry(1.15, 1.3, 8), showRed); millCap.position.set(211.5, Y + 2.95, 59.8); group.add(millCap);
    const windmillBlades = new T.Group(); windmillBlades.position.set(210.3, Y + 1.8, 59.8);
    for (let i = 0; i < 4; i++) {
      const bl = new T.Mesh(new T.BoxGeometry(0.12, 3.6, 0.52), showWhite); bl.rotation.x = (i * Math.PI) / 2; windmillBlades.add(bl);
    }
    group.add(windmillBlades);
    addDancingDoll(209.4, Y - 1.9, 65.0, showPink, showWhite); addDancingDoll(209.4, Y - 1.9, 62.6, showCyan, showGold); addDancingDoll(209.4, Y - 1.9, 60.4, showGold, showRed);

    // ROOM 2 (EAST-NORTH: x=211, z=48) — ASIA HALL (Curved-Eave Pagoda, 4-Minaret Taj Mahal & Floating Red Lanterns!)
    const asStage = new T.Mesh(new T.BoxGeometry(6.5, 1.4, 10.8), showPink); asStage.position.set(211.5, Y - 2.6, 48); group.add(asStage);
    for (let k = 0; k < 3; k++) {
      const pgWall = new T.Mesh(cyl(1.3 - k * 0.28, 1.3 - k * 0.28, 0.95, 6), showWhite); pgWall.position.set(211.5, Y - 1.35 + k * 1.45, 50.8); group.add(pgWall);
      const pgRoof = new T.Mesh(new T.ConeGeometry(2.1 - k * 0.42, 0.85, 6), showRed); pgRoof.position.set(211.5, Y - 0.55 + k * 1.45, 50.8); group.add(pgRoof);
    }
    const pgFin = new T.Mesh(cyl(0.08, 0.14, 1.4, 6), showGold); pgFin.position.set(211.5, Y + 3.4, 50.8); group.add(pgFin);
    // Taj Mahal with Central Bulbous Dome & 4 Corner Minarets!
    const tajBase = new T.Mesh(new T.BoxGeometry(3.4, 1.8, 3.4), showWhite); tajBase.position.set(211.5, Y - 1.0, 45.0); group.add(tajBase);
    const tajDome = new T.Mesh(sph(1.35, 10), showWhite); tajDome.position.set(211.5, Y + 0.85, 45.0); group.add(tajDome);
    for (const mx of [-1.5, 1.5]) for (const mz of [-1.5, 1.5]) {
      const min = new T.Mesh(cyl(0.16, 0.20, 3.2, 6), showWhite); min.position.set(211.5 + mx, Y - 0.2, 45.0 + mz); group.add(min);
    }
    addDancingDoll(209.4, Y - 1.9, 49.4, showGold, showRed); addDancingDoll(209.4, Y - 1.9, 46.8, showRed, showGold);

    // ROOM 3 (NORTH CENTERPIECE: x=192.5, z=39.8) — AMERICAS & "GREAT MOMENTS WITH MR. LINCOLN" PRESIDENTIAL THEATER!!
    const lnStage = new T.Mesh(new T.BoxGeometry(18.0, 2.2, 5.8), showNavy); lnStage.position.set(swX, Y - 2.2, 40.5); group.add(lnStage);
    const lnTrim = new T.Mesh(new T.BoxGeometry(18.2, 0.28, 6.0), showGold); lnTrim.position.set(swX, Y - 1.08, 40.5); group.add(lnTrim);
    const lnBack = new T.Mesh(new T.BoxGeometry(16.6, 9.2, 0.5), showNavy); lnBack.position.set(swX, Y + 3.4, 38.0); group.add(lnBack);
    // Pleated Crimson Velvet Proscenium Curtains, Fluted Gilded Greek Columns & Authentic Stars-and-Stripes Flags!
    for (const sd of [-1, 1]) {
      const curt = new T.Mesh(new T.BoxGeometry(3.0, 9.2, 1.2), curtainMat); curt.position.set(swX + sd * 7.4, Y + 3.4, 39.0); group.add(curt);
      const col = new T.Mesh(cyl(0.32, 0.36, 8.6, 10), showWhite); col.position.set(swX + sd * 5.6, Y + 3.2, 39.2); group.add(col);
      const cap = new T.Mesh(new T.BoxGeometry(0.95, 0.35, 0.95), showGold); cap.position.set(swX + sd * 5.6, Y + 7.55, 39.2); group.add(cap);
      // Flanking Stars-and-Stripes American Flags on Golden Eagle Poles!
      const fPole = new T.Mesh(cyl(0.08, 0.10, 6.0, 6), showGold); fPole.position.set(swX + sd * 4.1, Y + 1.9, 39.8); group.add(fPole);
      const fOrb = new T.Mesh(sph(0.20, 6), showGold); fOrb.position.set(swX + sd * 4.1, Y + 5.0, 39.8); group.add(fOrb);
      const flag = new T.Mesh(new T.PlaneGeometry(2.1, 1.3), usFlagMat); flag.position.set(swX + sd * 3.05, Y + 4.1, 39.85); group.add(flag);
    }
    const lnBanner = new T.Mesh(new T.PlaneGeometry(11.6, 2.2), makeStageBanner('林肯总统演讲大厅 · MR. LINCOLN', 'GREAT MOMENTS WITH MR. LINCOLN · LIBERTY & PEACE', '#172554', '#facc15'));
    lnBanner.position.set(swX, Y + 6.45, 38.55); group.add(lnBanner);
    // Detailed Presidential Seal Medallion with Golden American Eagle behind Lincoln!
    const sealDisc = new T.Mesh(new T.CircleGeometry(1.75, 24), sealMat); sealDisc.position.set(swX, Y + 3.25, 38.55); group.add(sealDisc);
    // Carved Walnut Presidential Podium with Brass Lectern Lamp, Golden Trim & Glowing Speech Parchment + Velvet Armchair!
    const podium = new T.Mesh(new T.BoxGeometry(1.5, 1.85, 1.0), showWalnut); podium.position.set(swX, Y - 0.18, 42.1); group.add(podium);
    const podTop = new T.Mesh(new T.BoxGeometry(1.72, 0.16, 1.18), showGold); podTop.position.set(swX, Y + 0.78, 42.1); group.add(podTop);
    const paper = new T.Mesh(new T.PlaneGeometry(0.92, 0.58), showWhite); paper.rotation.x = -Math.PI / 3; paper.position.set(swX, Y + 0.90, 42.1); group.add(paper);
    const lecLamp = new T.Mesh(sph(0.14, 6), warmGlowMat); lecLamp.position.set(swX + 0.55, Y + 1.02, 42.1); group.add(lecLamp);
    const chair = new T.Mesh(new T.BoxGeometry(1.5, 1.8, 1.1), curtainMat); chair.position.set(swX, Y - 0.2, 39.8); group.add(chair);
    // HIGH-CRAFT AUDIO-ANIMATRONIC ABRAHAM LINCOLN (Tailcoat, Wing Collar, Bow Tie, Beard, Silk-Banded Stovepipe Hat & Expressive Gestures!)
    const lincolnGrp = new T.Group(); lincolnGrp.position.set(swX, Y - 1.1, 41.0);
    const lLegs = new T.Mesh(new T.BoxGeometry(0.68, 1.25, 0.42), showSuit); lLegs.position.y = 0.62; lincolnGrp.add(lLegs);
    const lTorso = new T.Mesh(new T.BoxGeometry(0.92, 1.42, 0.50), showSuit); lTorso.position.y = 1.88; lincolnGrp.add(lTorso);
    const lShirt = new T.Mesh(new T.BoxGeometry(0.28, 0.78, 0.52), showWhite); lShirt.position.y = 2.08; lincolnGrp.add(lShirt);
    const lTie = new T.Mesh(new T.BoxGeometry(0.26, 0.12, 0.54), showSuit); lTie.position.y = 2.40; lincolnGrp.add(lTie);
    const lHeadGrp = new T.Group(); lHeadGrp.position.set(0, 2.86, 0);
    const lFace = new T.Mesh(sph(0.32, 10), showSkin); lHeadGrp.add(lFace);
    const lBeard = new T.Mesh(new T.BoxGeometry(0.46, 0.30, 0.38), showSuit); lBeard.position.set(0, -0.18, 0.12); lHeadGrp.add(lBeard);
    const lBrim = new T.Mesh(cyl(0.50, 0.50, 0.08, 12), showSuit); lBrim.position.y = 0.28; lHeadGrp.add(lBrim);
    const lBand = new T.Mesh(cyl(0.33, 0.33, 0.14, 12), showGold); lBand.position.y = 0.38; lHeadGrp.add(lBand);
    const lHat = new T.Mesh(cyl(0.32, 0.31, 0.72, 12), showSuit); lHat.position.y = 0.72; lHeadGrp.add(lHat);
    lincolnGrp.add(lHeadGrp);
    const lArmR = new T.Group(); lArmR.position.set(-0.56, 2.38, 0.12);
    const lSleeveR = new T.Mesh(new T.BoxGeometry(0.24, 0.95, 0.24), showSuit); lSleeveR.position.y = -0.45; lArmR.add(lSleeveR);
    const lHandR = new T.Mesh(sph(0.14, 6), showSkin); lHandR.position.y = -0.96; lArmR.add(lHandR);
    lincolnGrp.add(lArmR);
    const lArmL = new T.Group(); lArmL.position.set(0.56, 2.38, 0.12);
    const lSleeveL = new T.Mesh(new T.BoxGeometry(0.24, 0.95, 0.24), showSuit); lSleeveL.position.y = -0.45; lArmL.add(lSleeveL);
    const lHandL = new T.Mesh(sph(0.14, 6), showSkin); lHandL.position.y = -0.96; lArmL.add(lHandL);
    lincolnGrp.add(lArmL);
    group.add(lincolnGrp);

    // ROOM 4 (WEST-NORTH: x=174, z=49) — AFRICA & PACIFIC ISLANDS HALL!
    const afStage = new T.Mesh(new T.BoxGeometry(6.5, 1.4, 11.0), showGold); afStage.position.set(174.0, Y - 2.6, 49); group.add(afStage);
    const sunMask = new T.Mesh(new T.TorusGeometry(1.8, 0.25, 6, 16), showGold); sunMask.rotation.y = Math.PI / 2; sunMask.position.set(172.5, Y + 1.8, 49); group.add(sunMask);
    const giraffeBody = new T.Mesh(new T.BoxGeometry(1.1, 0.9, 1.8), showGold); giraffeBody.position.set(174.5, Y - 0.8, 52); group.add(giraffeBody);
    const giraffeNeck = new T.Mesh(cyl(0.20, 0.30, 3.4, 6), showGold); giraffeNeck.position.set(174.5, Y + 1.2, 51.3); group.add(giraffeNeck);
    addDancingDoll(176.0, Y - 1.9, 47.2, showCyan, showPink); addDancingDoll(176.0, Y - 1.9, 50.2, showPink, showGold);

    // ROOM 5 (WEST-SOUTH: x=174, z=63) — PURE WHITE & GOLD FINALE CAROUSEL HALL!
    const finStage = new T.Mesh(new T.BoxGeometry(6.5, 1.4, 10.5), showWhite); finStage.position.set(174.0, Y - 2.6, 63); group.add(finStage);
    const finCarGrp = new T.Group(); finCarGrp.position.set(174.2, Y - 1.9, 63);
    const finCanopy = new T.Mesh(new T.ConeGeometry(2.6, 1.8, 12), showGold); finCanopy.position.y = 3.8; finCarGrp.add(finCanopy);
    const finPole = new T.Mesh(cyl(0.25, 0.3, 3.4, 8), showWhite); finPole.position.y = 1.7; finCarGrp.add(finPole);
    group.add(finCarGrp);
    const byeBanner = new T.Mesh(new T.PlaneGeometry(6.8, 1.5), makeStageBanner('GOODBYE · 再见！', 'IT\'S A SMALL WORLD AFTER ALL', '#ffffff', '#eab308'));
    byeBanner.rotation.y = Math.PI / 2; byeBanner.position.set(171.8, Y + 3.2, 63); group.add(byeBanner);
    addDancingDoll(176.0, Y - 1.9, 61.5, showWhite, showGold); addDancingDoll(176.0, Y - 1.9, 64.5, showGold, showWhite);

    // ---- RIDE D: PASTEL MARY BLAIR CANAL BOAT ("it's a small world" Dark Ride!) ----
    const swBoatGrp = new T.Group();
    swBoatGrp.position.set(swX, WY + 0.05, 83.5);
    const swHull = new T.Mesh(new T.BoxGeometry(2.6, 0.72, 5.6), pastelBlueMat); swHull.position.y = 0.36; swBoatGrp.add(swHull);
    const swDeck = new T.Mesh(new T.BoxGeometry(2.2, 0.20, 4.9), whiteMat); swDeck.position.y = 0.72; swBoatGrp.add(swDeck);
    const swTrim = new T.Mesh(new T.BoxGeometry(2.72, 0.14, 5.72), goldMat); swTrim.position.y = 0.74; swBoatGrp.add(swTrim);
    for (const bz of [-1.4, 0, 1.4]) {
      const seat = new T.Mesh(new T.BoxGeometry(2.0, 0.32, 0.65), pastelPinkMat); seat.position.set(0, 0.92, bz); swBoatGrp.add(seat);
    }
    const swLantern = new T.Mesh(sph(0.24, 6), warmGlowMat); swLantern.position.set(0, 1.15, 2.75); swBoatGrp.add(swLantern);
    group.add(swBoatGrp);

    // Wide theatrical canal loop passing cleanly 10m in front of Mr. Lincoln's Presidential Stage (z=49.5)!
    const swWaypoints = [
      [192.5, 84.0], [192.5, 72.0], [202.5, 67.5], [205.5, 62.0],
      [205.5, 51.0], [199.5, 49.5], [192.5, 49.5], [185.5, 49.5],
      [180.0, 51.5], [180.0, 62.5], [184.5, 68.5], [192.5, 72.5], [192.5, 84.0]
    ];
    function sampleSW(t) {
      const n = swWaypoints.length - 1;
      const u = Math.max(0, Math.min(0.9999, t)) * n;
      const i = Math.floor(u), f = u - i;
      const a = swWaypoints[i], b = swWaypoints[i + 1];
      return { x: a[0] + (b[0] - a[0]) * f, z: a[1] + (b[1] - a[1]) * f };
    }

    const swState = { running: false, t: 0, speed: 0.032, eventIdx: -1 };
    const smallWorldRide = {
      id: 'small_world_boat', name: '小小世界室内游船（含林肯演讲）', land: 'Fantasyland',
      boardPos: { x: 192.5, y: Y, z: 88.5 },
      exitPos:  { x: 192.5, y: Y, z: 95.5, yaw: 0 },
      start: () => { swState.running = true; },
      stop:  () => { swState.running = false; },
      isRunning: () => swState.running,
      jumpToLincoln: () => { swState.t = 0.50; swState.running = true; },
      getCameraPose: (thirdPerson) => {
        const bp = swBoatGrp.position, yaw = swBoatGrp.rotation.y;
        const fwdX = Math.sin(yaw), fwdZ = Math.cos(yaw);
        // Theatrical dead-level focus onto Abraham Lincoln's Presidential Stage while passing the Americas Hall!
        const nearLincoln = swState.t >= 0.42 && swState.t <= 0.62;
        if (thirdPerson) {
          return {
            px: bp.x - fwdX * 5.8, py: bp.y + 3.2, pz: bp.z - fwdZ * 5.8,
            tx: nearLincoln ? swX : bp.x + fwdX * 6, ty: nearLincoln ? Y + 2.3 : bp.y + 1.4, tz: nearLincoln ? 39.2 : bp.z + fwdZ * 6
          };
        }
        return {
          px: bp.x + fwdX * 0.6, py: bp.y + 2.15, pz: bp.z + fwdZ * 0.6,
          tx: nearLincoln ? swX : bp.x + fwdX * 12, ty: nearLincoln ? Y + 2.5 : bp.y + 1.8, tz: nearLincoln ? 39.2 : bp.z + fwdZ * 12
        };
      }
    };

    /* ============================================================================
     * 3. FANTASYLAND CLASSICS: DUMBO THE FLYING ELEPHANT & MAD TEA PARTY!
     * ============================================================================ */
    // Dumbo the Flying Elephant (x=166, z=114)
    const dmX = 166, dmZ = 114;
    mWhite.add(cyl(6.4, 6.8, 0.65, 20), M(dmX, Y + 0.32, dmZ));
    const dmWater = new T.Mesh(new T.CircleGeometry(6.0, 20), waterFallMat);
    dmWater.rotation.x = -Math.PI / 2; dmWater.position.set(dmX, Y + 0.68, dmZ); group.add(dmWater);
    const dumboGrp = new T.Group(); dumboGrp.position.set(dmX, Y + 0.7, dmZ);
    const dmCol = new T.Mesh(cyl(1.05, 1.45, 5.2, 12), pastelBlueMat); dmCol.position.y = 2.6; dumboGrp.add(dmCol);
    const dmOrb = new T.Mesh(sph(1.15, 10), goldMat); dmOrb.position.y = 5.8; dumboGrp.add(dmOrb);
    const dumbos = [];
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const arm = new T.Group(); arm.position.y = 2.4; arm.rotation.y = a;
      const rod = new T.Mesh(new T.BoxGeometry(5.2, 0.14, 0.14), goldMat); rod.position.x = 2.6; arm.add(rod);
      const ele = new T.Group(); ele.position.set(5.2, 0.2, 0);
      const eb = new T.Mesh(sph(0.68, 8), i % 2 === 0 ? pastelBlueMat : pastelPinkMat); eb.scale.set(0.9, 0.85, 1.25); ele.add(eb);
      const eh = new T.Mesh(sph(0.42, 8), whiteMat); eh.position.set(0, 0.35, 0.7); ele.add(eh);
      const eL = new T.Mesh(new T.BoxGeometry(0.65, 0.45, 0.10), pastelPinkMat); eL.position.set(-0.52, 0.38, 0.55); ele.add(eL);
      const eR = new T.Mesh(new T.BoxGeometry(0.65, 0.45, 0.10), pastelPinkMat); eR.position.set(0.52, 0.38, 0.55); ele.add(eR);
      arm.add(ele); dumboGrp.add(arm); dumbos.push({ arm, phase: a });
    }
    group.add(dumboGrp);

    // Mad Tea Party (x=220, z=116)
    const mtX = 220, mtZ = 116;
    mWhite.add(cyl(6.2, 6.5, 0.45, 20), M(mtX, Y + 0.22, mtZ));
    // Overhead Glowing Lantern Canopy Poles
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      mIron.add(cyl(0.08, 0.10, 4.8, 6), M(mtX + Math.cos(a) * 6.0, Y + 2.4, mtZ + Math.sin(a) * 6.0));
      mGlow.add(sph(0.24, 6), M(mtX + Math.cos(a) * 4.5, Y + 4.5, mtZ + Math.sin(a) * 4.5));
    }
    const teaGrp = new T.Group(); teaGrp.position.set(mtX, Y + 0.5, mtZ);
    const teapot = new T.Mesh(sph(1.35, 12), pastelBlueMat); teapot.position.y = 1.3; teaGrp.add(teapot);
    const teaLid = new T.Mesh(cyl(0.65, 0.95, 0.5, 10), goldMat); teaLid.position.y = 2.65; teaGrp.add(teaLid);
    const teacups = [];
    const cupMats = [pastelPinkMat, pastelBlueMat, goldMat, crimsonMat, whiteMat, pastelPinkMat];
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const cup = new T.Mesh(cyl(0.95, 0.62, 0.85, 12), cupMats[i]);
      cup.position.set(Math.cos(a) * 4.1, 0.55, Math.sin(a) * 4.1);
      teaGrp.add(cup); teacups.push(cup);
    }
    group.add(teaGrp);

    /* ============================================================================
     * 4. FRONTIERLAND: BIG THUNDER MOUNTAIN RAILROAD (x=110, z=122 — 34m Red-Rock Mesas!)
     * ============================================================================ */
    const btX = 110, btZ = 122;
    // Layered Monument Valley Red-Rock Buttes, Spires & Fluted Sandstone Mesas!
    mRedRock.add(cyl(9.5, 14.5, 16, 9), M(btX, Y + 8.0, btZ));
    mRedRock.add(cyl(5.5, 9.2, 14, 8), M(btX - 2.0, Y + 21.0, btZ - 1.5));
    mRedDark.add(new T.ConeGeometry(4.2, 13.5, 7), M(btX - 2.5, Y + 31.0, btZ - 1.8)); // Towering 37m Hoodoo Spire!
    mRedRock.add(cyl(4.5, 7.8, 18, 8), M(btX + 8.5, Y + 9.0, btZ + 4.5));
    mRedDark.add(new T.ConeGeometry(3.8, 11.0, 6), M(btX + 8.5, Y + 22.5, btZ + 4.5));
    mRedRock.add(cyl(5.2, 8.5, 14, 8), M(btX - 9.2, Y + 7.0, btZ + 5.8));
    mRedDark.add(new T.ConeGeometry(3.4, 9.5, 6), M(btX - 9.2, Y + 18.0, btZ + 5.8));
    // Old West Timber Mining Trestle, Glowing Mine Cavern & Water Tower!
    mWood.add(cyl(1.8, 1.9, 2.8, 10), M(btX + 13.5, Y + 6.2, btZ + 12.0));
    mRedDark.add(new T.ConeGeometry(2.1, 1.6, 10), M(btX + 13.5, Y + 8.3, btZ + 12.0));
    for (const dx of [-1.2, 1.2]) for (const dz of [-1.2, 1.2]) {
      box(mWood, 0.25, 4.8, 0.25, btX + 13.5 + dx, Y + 2.4, btZ + 12.0 + dz);
    }
    // Timber Mine Entrance Portal + Desert Saguaro Cacti around Big Thunder!
    box(mWood, 0.45, 4.2, 0.45, btX + 10.2, Y + 2.1, btZ + 11.2);
    box(mWood, 0.45, 4.2, 0.45, btX + 10.2, Y + 2.1, btZ + 14.6);
    box(mWood, 0.65, 0.55, 4.2, btX + 10.2, Y + 4.3, btZ + 12.9);
    mGlow.add(sph(0.26, 5), M(btX + 10.4, Y + 3.6, btZ + 11.2));
    for (const [cxp, czp] of [[btX + 15.5, btZ + 16.5], [btX + 4.5, btZ + 16.8], [btX - 6.0, btZ + 15.5]]) {
      mLeafD.add(cyl(0.28, 0.34, 3.2, 6), M(cxp, Y + 1.6, czp));
      mLeafD.add(cyl(0.20, 0.22, 1.2, 6), M(cxp + 0.45, Y + 2.1, czp, 0, 0, -0.6));
      mLeafD.add(cyl(0.20, 0.22, 1.0, 6), M(cxp - 0.42, Y + 1.7, czp, 0, 0, 0.6));
    }
    // Animated Runaway Big Thunder Mine Train looping around the red-rock canyon!
    const mineCars = [];
    for (let c = 0; c < 3; c++) {
      const mg = new T.Group();
      const mb = new T.Mesh(new T.BoxGeometry(1.4, 1.0, 2.6), c === 0 ? ironMat : woodMat);
      mb.position.y = 0.65; mg.add(mb);
      if (c === 0) {
        const st = new T.Mesh(cyl(0.22, 0.16, 0.9, 6), goldMat); st.position.set(0, 1.4, 0.8); mg.add(st);
      }
      group.add(mg); mineCars.push(mg);
    }

    /* ============================================================================
     * 5. RIVERS OF AMERICA (MARK TWAIN RIVERBOAT) & NEW ORLEANS SQUARE (HAUNTED MANSION!)
     * ============================================================================ */
    function makeRiverboatDeckTex() {
      const c = cvs(256, 128), x = c.getContext('2d');
      x.fillStyle = '#fcfaf2'; x.fillRect(0, 0, 256, 128);
      // Warm illuminated Victorian stateroom windows + ornate gingerbread railing balusters!
      for (let i = 0; i < 8; i++) {
        x.fillStyle = '#fef08a'; x.fillRect(i * 32 + 6, 20, 20, 48);
        x.strokeStyle = '#92400e'; x.lineWidth = 3; x.strokeRect(i * 32 + 6, 20, 20, 48);
      }
      x.fillStyle = '#e6b83c'; x.fillRect(0, 0, 256, 10); x.fillRect(0, 82, 256, 8);
      x.strokeStyle = '#cbd5e1'; x.lineWidth = 2;
      for (let rx = 4; rx < 256; rx += 8) { x.beginPath(); x.moveTo(rx, 90); x.lineTo(rx, 126); x.stroke(); }
      return finTex(c, true);
    }
    function makeMansionFacadeTex() {
      const c = cvs(256, 256), x = c.getContext('2d');
      x.fillStyle = '#f4f2ec'; x.fillRect(0, 0, 256, 256);
      // Tall Antebellum Shuttered French Windows with Warm Eerie Candlelight Glow!
      for (const wy of [28, 146]) {
        for (const wx of [24, 106, 188]) {
          x.fillStyle = '#1e293b'; x.fillRect(wx, wy, 44, 86);
          x.fillStyle = wy < 100 ? 'rgba(134,239,172,0.34)' : 'rgba(253,224,71,0.32)';
          x.fillRect(wx + 5, wy + 5, 34, 76);
          // Dark forest-green wooden shutters flanking each window
          x.fillStyle = '#14532d'; x.fillRect(wx - 12, wy, 10, 86); x.fillRect(wx + 46, wy, 10, 86);
          x.strokeStyle = '#f8fafc'; x.lineWidth = 3; x.strokeRect(wx, wy, 44, 86);
        }
      }
      return finTex(c, false);
    }
    const riverDeckMat = new T.MeshLambertMaterial({ map: makeRiverboatDeckTex(), emissive: 0x201c12 });
    const mansionFacadeMat = new T.MeshLambertMaterial({ map: makeMansionFacadeTex(), emissive: 0x161816 });

    // Mark Twain 3-Deck White-and-Gold Sternwheeler Riverboat (x=135, z=132) + Rising Steam Puffs & Stern Flag!
    const mtBoat = new T.Group();
    mtBoat.position.set(135, WY + 0.12, 132);
    const hull = new T.Mesh(new T.BoxGeometry(5.2, 1.4, 14.5), whiteMat); hull.position.y = 0.7; mtBoat.add(hull);
    const deck2 = new T.Mesh(new T.BoxGeometry(4.6, 1.85, 11.2), riverDeckMat); deck2.position.y = 2.32; mtBoat.add(deck2);
    const deck3 = new T.Mesh(new T.BoxGeometry(3.8, 1.65, 8.0), riverDeckMat); deck3.position.y = 4.05; mtBoat.add(deck3);
    const pilot = new T.Mesh(new T.BoxGeometry(2.2, 1.4, 2.6), riverDeckMat); pilot.position.set(0, 5.45, 2.0); mtBoat.add(pilot);
    const pilotRoof = new T.Mesh(new T.BoxGeometry(2.5, 0.22, 2.9), crimsonMat); pilotRoof.position.set(0, 6.22, 2.0); mtBoat.add(pilotRoof);
    const trimG = new T.Mesh(new T.BoxGeometry(4.8, 0.18, 11.5), goldMat); trimG.position.y = 3.25; mtBoat.add(trimG);
    const steamPuffs = [];
    for (const sx of [-1.0, 1.0]) {
      const st = new T.Mesh(cyl(0.32, 0.36, 4.6, 8), ironMat); st.position.set(sx, 6.2, 4.2); mtBoat.add(st);
      const crown = new T.Mesh(cyl(0.46, 0.34, 0.48, 8), goldMat); crown.position.set(sx, 8.65, 4.2); mtBoat.add(crown);
      const puff = new T.Mesh(sph(0.45, 6), new T.MeshBasicMaterial({ color: 0xf8fafc, transparent: true, opacity: 0.65 }));
      puff.position.set(sx, 9.4, 4.2); mtBoat.add(puff);
      steamPuffs.push({ mesh: puff, baseX: sx, phase: sx > 0 ? 0.5 : 0 });
    }
    // Waving Stars-and-Stripes Flag at Mark Twain Stern!
    const mtPole = new T.Mesh(cyl(0.05, 0.06, 2.4, 6), goldMat); mtPole.position.set(0, 5.4, -4.4); mtBoat.add(mtPole);
    const mtFlag = new T.Mesh(new T.PlaneGeometry(1.4, 0.88), usFlagMat); mtFlag.rotation.y = Math.PI / 2; mtFlag.position.set(0, 6.1, -5.1); mtBoat.add(mtFlag);
    const paddleWheel = new T.Mesh(cyl(1.6, 1.6, 3.8, 10), crimsonMat);
    paddleWheel.rotation.z = Math.PI / 2; paddleWheel.position.set(0, 1.6, -7.6);
    mtBoat.add(paddleWheel);
    group.add(mtBoat);

    // Waterfront Promenade Timber-and-Iron Railing & Pier Gas Lamps along Rivers of America (z=153.5)!
    for (let px = 123; px <= 149; px += 3.2) {
      box(mIron, 0.12, 1.15, 0.12, px, Y + 0.58, 153.6);
      if (px % 6.4 < 3.2) {
        mIron.add(cyl(0.06, 0.10, 3.2, 6), M(px, Y + 1.6, 153.6));
        mGlow.add(sph(0.22, 6), M(px, Y + 3.35, 153.6));
      }
    }
    box(mWood, 26.8, 0.14, 0.18, 136, Y + 1.12, 153.6);
    box(mIron, 26.8, 0.08, 0.08, 136, Y + 0.58, 153.6);

    // THE HAUNTED MANSION (x=96, z=156 — Iconic White New Orleans Greek-Revival Antebellum Mansion!)
    const hmX = 96, hmZ = 156;
    const hmBody = new T.Mesh(new T.BoxGeometry(15.0, 10.5, 12.0), mansionFacadeMat);
    hmBody.position.set(hmX, Y + 5.25, hmZ); group.add(hmBody);
    box(mWhite, 16.4, 0.65, 13.4, hmX, Y + 10.7, hmZ);
    // Classical Marble Entry Portico Steps & 6 Tall Fluted Corinthian Porch Columns facing East!
    box(mWhite, 3.8, 0.45, 12.6, hmX + 8.6, Y + 0.22, hmZ);
    for (let i = 0; i < 6; i++) {
      const czp = hmZ - 5.2 + i * 2.08;
      mWhite.add(cyl(0.32, 0.38, 10.0, 10), M(hmX + 8.4, Y + 5.3, czp));
      mGold.add(cyl(0.46, 0.38, 0.32, 10), M(hmX + 8.4, Y + 10.35, czp));
    }
    box(mWhite, 3.4, 0.55, 12.4, hmX + 7.2, Y + 10.65, hmZ);
    // Ornate Black Wrought-Iron Balcony Lace, Mansard Slate Roof, Triangular Pediment & Rooftop Cupola!
    box(mIron, 0.14, 1.05, 11.8, hmX + 8.3, Y + 5.6, hmZ);
    box(mIron, 0.14, 0.25, 11.8, hmX + 8.3, Y + 6.18, hmZ);
    box(mSlate, 13.8, 3.2, 10.8, hmX, Y + 12.4, hmZ);
    mWhite.add(new T.ConeGeometry(4.4, 2.2, 3), M(hmX + 8.4, Y + 12.0, hmZ, 0, Math.PI / 2, 0));
    box(mWhite, 3.6, 3.4, 3.6, hmX, Y + 15.4, hmZ); // Iconic rooftop glass cupola
    mSlate.add(new T.ConeGeometry(2.6, 2.8, 4), M(hmX, Y + 18.4, hmZ, 0, Math.PI / 4, 0));
    mIron.add(cyl(0.06, 0.08, 2.4, 6), M(hmX, Y + 20.6, hmZ));
    // Wrought-Iron Estate Gate Pillars & Eerie Glowing Crypt Lanterns
    for (const fz of [-6.0, -2.5, 2.5, 6.0]) {
      box(mWhite, 0.85, 2.8, 0.85, hmX + 12.5, Y + 1.4, hmZ + fz);
      mGlow.add(sph(0.24, 6), M(hmX + 12.5, Y + 3.0, hmZ + fz));
    }

    /* ============================================================================
     * 6. ADVENTURELAND: GIANT BANYAN TREEHOUSE (x=132, z=226) & TIKI GATEWAY ARCH (x=156, z=205)
     * ============================================================================ */
    const thX = 132, thZ = 226;
    mBark.add(cyl(2.2, 3.6, 12.5, 10), M(thX, Y + 6.2, thZ));
    for (const [bx, by, bz, r] of [[0, 13.5, 0, 6.5], [-4.2, 11.5, 2.2, 4.6], [4.5, 12.0, -1.8, 4.8], [0.5, 16.5, -1.2, 4.2]]) {
      mLeafD.add(sph(r, 9), M(thX + bx, Y + by, thZ + bz));
    }
    // Thatched Lookout Huts nestled in the Giant Banyan Branches
    for (const [hx, hy, hz] of [[-3.2, 9.5, 2.5], [3.0, 12.8, -1.0]]) {
      box(mWood, 3.2, 2.4, 3.2, thX + hx, Y + hy, thZ + hz);
      mRedDark.add(new T.ConeGeometry(2.8, 2.2, 6), M(thX + hx, Y + hy + 2.2, thZ + hz));
    }
    // Adventureland Tiki Gateway Arch (x=156, z=205)
    for (const sd of [-1, 1]) {
      mWood.add(cyl(0.55, 0.72, 7.5, 8), M(156, Y + 3.75, 205 + sd * 5.8));
      mRedDark.add(new T.ConeGeometry(1.4, 2.2, 6), M(156, Y + 8.4, 205 + sd * 5.8));
      mGlow.add(sph(0.28, 6), M(156.8, Y + 5.8, 205 + sd * 5.8));
    }
    box(mWood, 1.4, 1.2, 12.6, 156, Y + 7.2, 205);

    /* ============================================================================
     * 7. SUBMARINE LAGOON (x=274, z=146) & DISNEYLAND MONORAIL BEAMWAY + TRAIN!
     * ============================================================================ */
    const subs = [];
    for (let i = 0; i < 3; i++) {
      const sg = new T.Group();
      const sb = new T.Mesh(cyl(0.62, 0.62, 4.8, 10), yellowSubMat); sb.rotation.x = Math.PI / 2; sg.add(sb);
      const st = new T.Mesh(cyl(0.35, 0.42, 1.1, 8), yellowSubMat); st.position.set(0, 0.75, 0.4); sg.add(st);
      group.add(sg); subs.push({ grp: sg, phase: (i / 3) * Math.PI * 2 });
    }
    // Disneyland Monorail Sweeping Elevated Concrete Beamway (looping Tomorrowland -> Submarine Lagoon -> Matterhorn!)
    const mrCx = 276, mrCz = 166, mrRx = 34, mrRz = 32;
    for (let i = 0; i < 36; i++) {
      const a0 = (i / 36) * Math.PI * 2, a1 = ((i + 1) / 36) * Math.PI * 2;
      const x0 = mrCx + Math.cos(a0) * mrRx, z0 = mrCz + Math.sin(a0) * mrRz;
      const x1 = mrCx + Math.cos(a1) * mrRx, z1 = mrCz + Math.sin(a1) * mrRz;
      const len = Math.hypot(x1 - x0, z1 - z0);
      const ang = Math.atan2(x1 - x0, z1 - z0);
      box(mConc, 0.85, 0.95, len + 0.15, (x0 + x1) / 2, Y + 9.2, (z0 + z1) / 2, 0, ang, 0);
      if (i % 3 === 0) mConc.add(cyl(0.55, 0.72, 9.2, 8), M(x0, Y + 4.6, z0));
    }
    const monoCars = [];
    for (let c = 0; c < 4; c++) {
      const cg = new T.Group();
      const b = new T.Mesh(new T.BoxGeometry(1.75, 1.35, 4.2), whiteMat); b.position.y = 0.85; cg.add(b);
      const stripe = new T.Mesh(new T.BoxGeometry(1.82, 0.34, 4.26), crimsonMat); stripe.position.y = 0.82; cg.add(stripe);
      group.add(cg); monoCars.push(cg);
    }

    /* ============================================================================
     * 8. 240+ SCULPTED 3D ARCHITECTURAL TREES, PALMS, PINES & SHORELINE BOULDERS!
     * (100% replaces blocky Minecraft cube trees with organic museum-model foliage!)
     * ============================================================================ */
    let seed = 20261122;
    const rng = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };

    function addSculptedTree(tx, tz, kind) {
      if (kind === 'palm') {
        const h = 6.5 + rng() * 3.8;
        mBark.add(cyl(0.22, 0.42, h, 5), M(tx, Y + h / 2, tz, (rng() - 0.5) * 0.16, 0, (rng() - 0.5) * 0.16));
        for (let f = 0; f < 6; f++) {
          const fa = (f / 6) * Math.PI * 2 + rng() * 0.3;
          box(mPalm, 0.62, 0.14, 3.6, tx + Math.cos(fa) * 1.5, Y + h + 0.2, tz + Math.sin(fa) * 1.5, 0.32, Math.PI / 2 - fa, 0);
        }
      } else if (kind === 'pine') {
        const h = 7.0 + rng() * 4.5;
        mBark.add(cyl(0.25, 0.45, 2.4, 5), M(tx, Y + 1.2, tz));
        mPine.add(new T.ConeGeometry(2.6, h * 0.52, 6), M(tx, Y + 2.2 + h * 0.25, tz));
        mPine.add(new T.ConeGeometry(1.9, h * 0.46, 6), M(tx, Y + 2.2 + h * 0.55, tz));
      } else {
        const h = 4.2 + rng() * 2.6, r = 2.1 + rng() * 1.1;
        mBark.add(cyl(0.28, 0.48, h, 5), M(tx, Y + h / 2, tz));
        const fol = kind === 'blossom' ? mBlossom : (rng() < 0.5 ? mLeafD : mLeafM);
        fol.add(new T.IcosahedronGeometry(r, 1), M(tx, Y + h + r * 0.65, tz));
        fol.add(new T.IcosahedronGeometry(r * 0.74, 0), M(tx + r * 0.55, Y + h + r * 0.25, tz + r * 0.32));
      }
    }

    const zi = (x, z) => (x | 0) + (z | 0) * world.W;
    let placed = 0;
    for (let attempt = 0; attempt < 850 && placed < 185; attempt++) {
      const tx = 48 + rng() * 290, tz = 48 + rng() * 290;
      const cell = zi(tx, tz);
      if (world.occ[cell] || world.hm[cell] < Y) continue;
      // Keep axial sightline, plazas & major landmark footprints crisp and open!
      if (Math.abs(tx - 192.5) < 25 && tz > 62 && tz < 355) continue;
      if (Math.hypot(tx - 192.5, tz - 176.5) < 30) continue;
      if (Math.hypot(tx - 250, tz - 140) < 22) continue; // Matterhorn
      if (Math.hypot(tx - 110, tz - 122) < 20) continue; // Big Thunder
      if (Math.hypot(tx - 116, tz - 78) < 38) continue;  // Star Wars: Galaxy's Edge (Batuu)
      if (Math.hypot(tx - 96, tz - 156) < 16) continue;  // Haunted Mansion
      if (Math.hypot(tx - 132, tz - 226) < 12) continue; // Banyan Treehouse
      if (Math.hypot(tx - 266, tz - 194) < 25 || Math.hypot(tx - 298, tz - 174) < 22) continue;

      const isAdv = tx < 152 && tz > 168 && tz < 254;
      const isAlp = Math.hypot(tx - 250, tz - 140) < 42;
      const isFan = tz < 146 && tx > 142 && tx < 240;
      const kind = isAdv ? 'palm' : isAlp ? 'pine' : (isFan && rng() < 0.42) ? 'blossom' : 'oak';
      addSculptedTree(tx, tz, kind);
      placed++;
    }

    // Sculpted 3D Mossy Shoreline Boulders softening the Jungle Cruise & Rivers of America banks!
    for (let i = 0; i < 32; i++) {
      const a = (i / 32) * Math.PI * 2;
      const bx = 100 + Math.cos(a) * 29.2, bz = 200 + Math.sin(a) * 27.0;
      if (Math.abs(bx - 126) < 8 && Math.abs(bz - 204) < 6) continue;
      mRock.add(sph(1.35 + (i % 3) * 0.45, 7), M(bx, Y - 0.6, bz, 0, a, 0, 1.3, 0.72, 1.1));
    }

    /* ---------------- Flush All Merged Static Landmark Meshes ---------------- */
    mRock.mesh(alpineRockMat, true); mSnow.mesh(snowMat, true);
    mRedRock.mesh(redRockMat, true); mRedDark.mesh(redRockDarkMat, true);
    mWhite.mesh(whiteMat, true); mGold.mesh(goldMat, false);
    mPBlue.mesh(pastelBlueMat, false); mPPink.mesh(pastelPinkMat, false);
    mRed.mesh(crimsonMat, true); mIron.mesh(ironMat, false);
    mWood.mesh(woodMat, true); mSlate.mesh(slateMat, true);
    mBark.mesh(barkMat, false); mLeafD.mesh(leafDarkMat, false);
    mLeafM.mesh(leafMidMat, false); mPalm.mesh(leafPalmMat, false);
    mBlossom.mesh(blossomMat, false); mPine.mesh(pineMat, false);
    mGlow.mesh(warmGlowMat, false); mConc.mesh(concreteMat, true);

    /* ---------------- Live Animations for All Full-Disneyland Landmarks ---------------- */
    function update(dt, elapsed, onEvent) {
      // "it's a small world" Exterior Golden Pendulum & Indoor Dark Ride Animatronics!
      swPendulum.rotation.z = Math.sin(elapsed * 2.2) * 0.38;
      windmillBlades.rotation.x = elapsed * 1.4;
      finCarGrp.rotation.y = elapsed * 0.85;
      swDolls.forEach((d) => {
        d.grp.rotation.z = Math.sin(elapsed * 3.2 + d.phase) * 0.16;
        d.grp.position.y = d.baseY + Math.abs(Math.sin(elapsed * 2.8 + d.phase)) * 0.18;
      });
      // Audio-Animatronic Abraham Lincoln rising & gesturing expressively during his speech!
      lincolnGrp.position.y = Y - 1.05 + Math.max(0, Math.sin(elapsed * 0.9)) * 0.28;
      lHeadGrp.rotation.y = Math.sin(elapsed * 1.3) * 0.28;
      lArmR.rotation.x = -0.55 + Math.sin(elapsed * 2.6) * 0.42;
      lArmL.rotation.x = -0.35 + Math.cos(elapsed * 2.1) * 0.32;
      if (swState.running) {
        swState.t += dt * swState.speed;
        const p0 = sampleSW(swState.t), p1 = sampleSW(Math.min(0.9999, swState.t + 0.015));
        swBoatGrp.position.set(p0.x, WY + 0.06 + Math.sin(elapsed * 3.2) * 0.04, p0.z);
        swBoatGrp.rotation.y = Math.atan2(p1.x - p0.x, p1.z - p0.z);
        const msgs = [
          '⛵ 游船启航！穿过微笑金色太阳钟，驶入「小小世界」奇幻运河！',
          '🗼 欢迎来到【欧洲馆】：旋转的荷兰风车、金色埃菲尔铁塔与欢舞人偶！',
          '🏮 欢迎来到【亚洲馆】：朱红宝塔、泰姬陵穹顶与点点彩灯！',
          '🎩【林肯总统演讲大厅】林肯起立挥手演讲："Four score and seven years ago… 自由、平等与和平属于世界每一个角落！"',
          '🌴 欢迎来到【非洲与太平洋馆】：金色太阳图腾与热带岛屿欢歌！',
          '✨ 欢迎来到【纯白鎏金大合唱厅】：世界儿童齐唱《It\'s a Small World》，游船即将返回阳光码头！'
        ];
        const ev = Math.min(msgs.length - 1, Math.floor((swState.t % 1) * msgs.length));
        if (ev !== swState.eventIdx) {
          swState.eventIdx = ev;
          if (onEvent) onEvent(msgs[ev]);
        }
        if (swState.t >= 1.0) {
          swState.t = 0; swState.running = false; swState.eventIdx = -1;
          swBoatGrp.position.set(swX, WY + 0.05, 83.5); swBoatGrp.rotation.y = Math.PI;
          if (onEvent) onEvent('⚓ 「小小世界」游船已安全靠岸！点击「启动」可再次启航，或点击「离开设施」。');
        }
      }

      // Dumbo flying elephants bobbing & orbiting
      dumboGrp.rotation.y = elapsed * 0.62;
      dumbos.forEach((d) => { d.arm.rotation.z = 0.14 + Math.sin(elapsed * 2.2 + d.phase) * 0.18; });
      // Mad Tea Party spinning teacups
      teaGrp.rotation.y = -elapsed * 0.55;
      teacups.forEach((c, idx) => { c.rotation.y = elapsed * (2.2 + (idx % 2) * 0.8); });
      // Big Thunder runaway mine train
      const btA = elapsed * 0.58;
      mineCars.forEach((mg, idx) => {
        const a = btA - idx * 0.22;
        const mx = btX + Math.cos(a) * 14.5, mz = btZ + Math.sin(a) * 14.5;
        const nx = btX + Math.cos(a + 0.05) * 14.5, nz = btZ + Math.sin(a + 0.05) * 14.5;
        mg.position.set(mx, Y + 4.8 + Math.sin(a * 2) * 2.2, mz);
        mg.rotation.y = Math.atan2(nx - mx, nz - mz);
      });
      // Mark Twain Riverboat paddlewheel, rising steam puffs & gentle river glide!
      paddleWheel.rotation.x = -elapsed * 2.4;
      mtBoat.position.z = 132 + Math.sin(elapsed * 0.22) * 6.5;
      steamPuffs.forEach((p) => {
        const cyc = (elapsed * 0.65 + p.phase) % 1.0;
        p.mesh.position.y = 9.0 + cyc * 3.8;
        p.mesh.scale.setScalar(0.65 + cyc * 1.4);
        p.mesh.material.opacity = (1 - cyc) * 0.65;
      });
      // Finding Nemo submarines circling lagoon
      subs.forEach((s) => {
        const a = elapsed * 0.26 + s.phase;
        const sx = 274 + Math.cos(a) * 10.5, sz = 146 + Math.sin(a) * 7.2;
        const nx = 274 + Math.cos(a + 0.05) * 10.5, nz = 146 + Math.sin(a + 0.05) * 7.2;
        s.grp.position.set(sx, WY - 0.08, sz); s.grp.rotation.y = Math.atan2(nx - sx, nz - sz);
      });
      // Disneyland Monorail gliding smoothly overhead!
      const moA = elapsed * 0.28;
      monoCars.forEach((cg, idx) => {
        const a = moA - idx * 0.135;
        const px = mrCx + Math.cos(a) * mrRx, pz = mrCz + Math.sin(a) * mrRz;
        const nx = mrCx + Math.cos(a + 0.04) * mrRx, nz = mrCz + Math.sin(a + 0.04) * mrRz;
        cg.position.set(px, Y + 9.75, pz); cg.rotation.y = Math.atan2(nx - px, nz - pz);
      });
    }

    return { update, smallWorldRide };
  }

  root.TPLandmarks = { build };
})(window);
