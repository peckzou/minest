/* Minest My World · 1:1 Disneyland Iconic Mountain Landmarks, Rivers of America & Sculpted 3D Parkland (`landmarks.js`)
 * Includes:
 *  1. RIDEABLE Matterhorn Bobsleds (`matterhornRide`, x=330, z=176 — 46m Alpine Peak, Glowing Ice Cavern & Abominable Snowman Harold!)
 *  2. RIDEABLE "it's a small world" (`smallWorldRide`, x=306, z=84 — 44m Mary Blair Clock Facade + 6-Hall Indoor Boat Ride w/ Mr. Lincoln!)
 *  3. Fantasyland Spin Rides: Dumbo the Flying Elephant (x=236, z=132) & Mad Tea Party (x=296, z=120)
 *  4. RIDEABLE Big Thunder Mountain Railroad (`bigThunderRide`, x=186, z=158 — 37m Red-Rock Mesas, Dinosaur Ribs & Runaway Mine Train!)
 *  5. True-Scale Rivers of America (x=134, z=191): Walkable Tom Sawyer Island (Suspension Bridge, Harper's Cider Mill, Skull Rock & Fort Wilderness),
 *     3-Deck Mark Twain Sternwheeler Riverboat AND 3-Masted Tall Sailing Ship Columbia!
 *  6. The Haunted Mansion (x=82, z=236 — New Orleans Antebellum Mansion, Crypt Gates & Hearse!)
 *  7. Adventureland Giant Banyan Treehouse (x=186, z=294), Submarine Lagoon (x=382, z=202), Disneyland Monorail & 380+ Sculpted 3D Trees! */
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
        if (streak) x.fillRect(0, (i * 11) % 256, 256, 4 + (i % 7));
        else { x.beginPath(); x.ellipse((i * 53) % 256, (i * 37) % 256, 22 + (i % 24), 10 + (i % 14), (i % 5) * 0.4, 0, Math.PI * 2); x.fill(); }
      }
      return finTex(c, true);
    }

    function makeSmallWorldClockTex() {
      const c = cvs(256, 256), x = c.getContext('2d');
      x.fillStyle = '#fffdf7'; x.fillRect(0, 0, 256, 256);
      x.strokeStyle = '#eab308'; x.lineWidth = 6;
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2;
        x.beginPath(); x.moveTo(128 + Math.cos(a) * 68, 128 + Math.sin(a) * 68);
        x.lineTo(128 + Math.cos(a) * 118, 128 + Math.sin(a) * 118); x.stroke();
      }
      x.fillStyle = '#facc15'; x.beginPath(); x.arc(128, 128, 70, 0, Math.PI * 2); x.fill();
      x.strokeStyle = '#d97706'; x.lineWidth = 6; x.stroke();
      x.fillStyle = '#1e293b';
      x.beginPath(); x.arc(104, 112, 8, 0, Math.PI * 2); x.arc(152, 112, 8, 0, Math.PI * 2); x.fill();
      x.strokeStyle = '#92400e'; x.lineWidth = 6;
      x.beginPath(); x.arc(128, 134, 28, 0.15 * Math.PI, 0.85 * Math.PI); x.stroke();
      return finTex(c, false);
    }

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
          const cnt = g.attributes.position.count;
          pos.set(g.attributes.position.array, o * 3); norm.set(g.attributes.normal.array, o * 3);
          if (g.attributes.uv) uv.set(g.attributes.uv.array, o * 2);
          o += cnt; g.dispose();
        }
        const bg = new T.BufferGeometry();
        bg.setAttribute('position', new T.BufferAttribute(pos, 3));
        bg.setAttribute('normal', new T.BufferAttribute(norm, 3));
        bg.setAttribute('uv', new T.BufferAttribute(uv, 2));
        const m = new T.Mesh(bg, mat);
        m.castShadow = !!cast;
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
    const iceGlowMat = new T.MeshBasicMaterial({ color: 0x38bdf8 });
    const yellowSubMat = new T.MeshPhongMaterial({ color: 0xfacc15, specular: 0xfef9c3, shininess: 60 });
    const concreteMat = new T.MeshLambertMaterial({ color: 0xdbe3ec, emissive: 0x161c24 });

    const mRock = new Merger(), mSnow = new Merger(), mRedRock = new Merger(), mRedDark = new Merger();
    const mWhite = new Merger(), mGold = new Merger(), mPBlue = new Merger(), mPPink = new Merger();
    const mRed = new Merger(), mIron = new Merger(), mWood = new Merger(), mSlate = new Merger();
    const mBark = new Merger(), mLeafD = new Merger(), mLeafM = new Merger(), mPalm = new Merger();
    const mBlossom = new Merger(), mPine = new Merger(), mGlow = new Merger(), mConc = new Merger();

    /* ============================================================================
     * 1. RIDEABLE MATTERHORN BOBSLEDS (x=330, z=176 — 46m Snow Peak + Ice Crystal Cavern + Harold!)
     * ============================================================================ */
    const mhX = 330, mhZ = 176;
    mRock.add(new T.ConeGeometry(19.5, 35, 9), M(mhX, Y + 17.5, mhZ, 0, 0.3, 0));
    mRock.add(new T.ConeGeometry(14.0, 44, 7), M(mhX - 1.5, Y + 22, mhZ - 1.0, 0.04, 0.8, -0.05));
    mRock.add(new T.ConeGeometry(12.5, 25, 7), M(mhX + 9.0, Y + 12.5, mhZ + 4.5, 0, 0.5, 0.08));
    mRock.add(new T.ConeGeometry(11.5, 22, 7), M(mhX - 9.5, Y + 11.0, mhZ + 5.5, 0, 1.2, -0.08));
    mRock.add(new T.ConeGeometry(11.0, 23, 7), M(mhX + 3.0, Y + 11.5, mhZ - 9.5, -0.06, 0.2, 0));
    mSnow.add(new T.ConeGeometry(9.0, 22, 7), M(mhX - 1.8, Y + 37.5, mhZ - 1.2, 0.05, 0.8, -0.06));
    mSnow.add(new T.ConeGeometry(7.2, 13.5, 7), M(mhX + 7.5, Y + 22.0, mhZ + 3.8, 0, 0.5, 0.08));
    mSnow.add(new T.ConeGeometry(6.4, 12.5, 7), M(mhX - 8.2, Y + 20.0, mhZ + 4.8, 0, 1.2, -0.08));
    // Swiss Chalet Bobsled Loading Station + Glowing Ice Crystal Cavern & Abominable Snowman Harold!
    box(mWood, 8.2, 3.8, 5.8, mhX - 13.5, Y + 1.9, mhZ + 14.5);
    mRed.add(new T.ConeGeometry(6.2, 3.0, 4), M(mhX - 13.5, Y + 5.3, mhZ + 14.5, 0, Math.PI / 4, 0));
    box(mIron, 3.8, 3.8, 3.2, mhX + 12.5, Y + 13.5, mhZ + 9.5); // Cavern opening!
    // Abominable Snowman (Harold) standing menacingly at the mountain cavern ledge (x=mhX+14, y=Y+13, z=mhZ+8)!
    const yetiGrp = new T.Group(); yetiGrp.position.set(mhX + 14.2, Y + 12.2, mhZ + 8.5);
    const yTorso = new T.Mesh(sph(1.25, 8), snowMat); yTorso.scale.set(1.0, 1.35, 0.85); yTorso.position.y = 1.6; yetiGrp.add(yTorso);
    const yHead = new T.Mesh(sph(0.68, 8), snowMat); yHead.position.y = 3.2; yetiGrp.add(yHead);
    for (const ex of [-0.22, 0.22]) {
      const eye = new T.Mesh(sph(0.11, 5), new T.MeshBasicMaterial({ color: 0xef4444 }));
      eye.position.set(ex, 3.3, 0.58); yetiGrp.add(eye);
    }
    const yIce = new T.Mesh(new T.ConeGeometry(0.65, 2.8, 5), iceGlowMat); yIce.position.set(-1.6, 1.4, 0.4); yetiGrp.add(yIce);
    group.add(yetiGrp);

    const mhFall = new T.Mesh(new T.PlaneGeometry(4.6, 20.0), waterFallMat);
    mhFall.position.set(mhX + 13.5, Y + 9.5, mhZ + 5.5); mhFall.rotation.y = Math.PI / 2.5;
    group.add(mhFall);

    // Rideable 2-Car Matterhorn Alpine Bobsled!
    const bobsleds = [];
    for (let c = 0; c < 2; c++) {
      const bg = new T.Group();
      const body = new T.Mesh(new T.BoxGeometry(1.35, 0.85, 3.1), c === 0 ? crimsonMat : pastelBlueMat);
      body.position.y = 0.52; bg.add(body);
      const stripe = new T.Mesh(new T.BoxGeometry(1.42, 0.16, 3.16), whiteMat); stripe.position.y = 0.62; bg.add(stripe);
      group.add(bg); bobsleds.push(bg);
    }
    const mhState = { running: true, ang: 0, eventIdx: -1 };
    function sampleMH(a) {
      const r = 17.2 + Math.sin(a * 3) * 2.2;
      return { x: mhX + Math.cos(a) * r, y: Y + 8.5 + Math.sin(a) * 6.8 + Math.cos(a * 2) * 2.4, z: mhZ + Math.sin(a) * r };
    }
    const matterhornRide = {
      id: 'matterhorn_bobsleds', name: '马特宏峰雪山雪橇（Matterhorn Bobsleds）', land: 'Fantasyland',
      boardPos: { x: mhX - 13.5, y: Y, z: mhZ + 18.2 },
      exitPos:  { x: mhX - 16.5, y: Y, z: mhZ + 20.0, yaw: -0.5 },
      start: () => { mhState.running = true; mhState.eventIdx = -1; },
      stop:  () => { mhState.running = false; },
      isRunning: () => mhState.running,
      getCameraPose: (thirdPerson) => {
        const p0 = sampleMH(mhState.ang), p1 = sampleMH(mhState.ang + 0.06);
        const dx = p1.x - p0.x, dy = p1.y - p0.y, dz = p1.z - p0.z, L = Math.hypot(dx, dy, dz) || 1;
        const fx = dx / L, fy = dy / L, fz = dz / L;
        if (thirdPerson) return { px: p0.x - fx * 8.2, py: p0.y + 3.8, pz: p0.z - fz * 8.2, tx: p0.x + fx * 6, ty: p0.y + 1.0, tz: p0.z + fz * 6 };
        return { px: p0.x + fx * 0.6, py: p0.y + 1.45, pz: p0.z + fz * 0.6, tx: p0.x + fx * 16, ty: p0.y + fy * 16 + 0.6, tz: p0.z + fz * 16 };
      }
    };

    /* ============================================================================
     * 2. "it's a small world" — FULL INDOOR CANAL BOAT DARK RIDE + MR. LINCOLN (swX=306, swZ=84)!
     * ============================================================================ */
    const swX = 306, swZ = 84;
    const dxSW = swX - 192.5, dzSW = swZ - 74;

    function makeMaryBlairPanelTex() {
      const c = cvs(256, 256), x = c.getContext('2d');
      x.fillStyle = '#fffdf7'; x.fillRect(0, 0, 256, 256);
      x.strokeStyle = '#eab308'; x.lineWidth = 4;
      for (let gy = 0; gy < 256; gy += 64) for (let gx = 0; gx < 256; gx += 64) {
        x.strokeRect(gx + 6, gy + 6, 52, 52);
        x.fillStyle = ((gx + gy) / 64) % 2 === 0 ? 'rgba(250,204,21,0.28)' : 'rgba(125,211,252,0.22)';
        x.beginPath(); x.moveTo(gx + 32, gy + 10); x.lineTo(gx + 54, gy + 32); x.lineTo(gx + 32, gy + 54); x.lineTo(gx + 10, gy + 32); x.closePath(); x.fill();
        x.fillStyle = '#f59e0b'; x.beginPath(); x.arc(gx + 32, gy + 32, 5, 0, Math.PI * 2); x.fill();
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
      x.fillStyle = '#fef08a';
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2;
        x.beginPath(); x.arc(128 + Math.cos(a) * 86, 128 + Math.sin(a) * 86, 4.5, 0, Math.PI * 2); x.fill();
      }
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
        x.beginPath(); x.moveTo(0, y); x.lineTo(128, y + 32); x.moveTo(128, y); x.lineTo(0, y + 32); x.moveTo(0, y); x.lineTo(128, y); x.stroke();
      }
      return finTex(c, true);
    }

    const maryBlairMat = new T.MeshLambertMaterial({ map: makeMaryBlairPanelTex(), emissive: 0x1e1a12 });
    const curtainMat = new T.MeshBasicMaterial({ map: makeCurtainTex() });
    const usFlagMat = new T.MeshBasicMaterial({ map: makeUSFlagTex(), side: T.DoubleSide });
    const sealMat = new T.MeshBasicMaterial({ map: makePresidentialSealTex() });
    const eiffelMat = new T.MeshBasicMaterial({ map: makeEiffelLatticeTex() });

    const swWallL = new T.Mesh(new T.BoxGeometry(15.6, 11.5, 3.4), maryBlairMat); swWallL.position.set(swX - 12.2, Y + 5.75, swZ); group.add(swWallL);
    const swWallR = new T.Mesh(new T.BoxGeometry(15.6, 11.5, 3.4), maryBlairMat); swWallR.position.set(swX + 12.2, Y + 5.75, swZ); group.add(swWallR);
    box(mWhite, 9.2, 6.2, 3.4, swX, Y + 8.4, swZ);
    box(mGold, 40.6, 0.45, 3.8, swX, Y + 11.6, swZ);
    box(mWhite, 12.0, 12.8, 4.4, swX, Y + 12.1, swZ + 0.6);
    box(mGold, 12.6, 0.50, 4.8, swX, Y + 18.6, swZ + 0.6);
    mGold.add(new T.ConeGeometry(3.2, 8.5, 8), M(swX, Y + 23.0, swZ + 0.6));
    box(mGold, 0.45, 5.4, 3.8, swX - 4.4, Y + 2.7, swZ);
    box(mGold, 0.45, 5.4, 3.8, swX + 4.4, Y + 2.7, swZ);
    box(mGold, 9.2, 0.45, 3.8, swX, Y + 5.35, swZ);
    const swClockMat = new T.MeshLambertMaterial({ map: makeSmallWorldClockTex(), emissive: 0x261d06 });
    const swClock = new T.Mesh(new T.CircleGeometry(3.8, 24), swClockMat);
    swClock.position.set(swX, Y + 12.2, swZ + 2.95); group.add(swClock);
    const swPendulum = new T.Group(); swPendulum.position.set(swX, Y + 8.8, swZ + 3.05);
    const pendRod = new T.Mesh(new T.BoxGeometry(0.18, 2.8, 0.12), goldMat); pendRod.position.y = -1.4; swPendulum.add(pendRod);
    const pendDisc = new T.Mesh(cyl(0.85, 0.85, 0.16, 14), goldMat); pendDisc.rotation.x = Math.PI / 2; pendDisc.position.y = -2.8; swPendulum.add(pendDisc);
    group.add(swPendulum);
    for (const sd of [-1, 1]) {
      box(mPBlue, 4.6, 13.5, 2.8, swX + sd * 10.5, Y + 6.75, swZ + 0.8);
      mGold.add(new T.ConeGeometry(2.6, 7.5, 6), M(swX + sd * 10.5, Y + 17.2, swZ + 0.8));
      box(mPPink, 5.2, 11.0, 2.8, swX + sd * 16.8, Y + 5.5, swZ + 0.8);
      mWhite.add(sph(2.4, 10), M(swX + sd * 16.8, Y + 12.5, swZ + 0.8));
      mGold.add(cyl(0.12, 0.22, 4.2, 6), M(swX + sd * 16.8, Y + 16.2, swZ + 0.8));
      for (const tx of [6.8, 13.5]) {
        mLeafM.add(new T.ConeGeometry(1.2, 3.8, 8), M(swX + sd * tx, Y + 2.2, swZ + 17.5));
        mWhite.add(cyl(1.1, 1.3, 0.7, 10), M(swX + sd * tx, Y + 0.35, swZ + 17.5));
        mGold.add(sph(0.28, 6), M(swX + sd * tx, Y + 4.3, swZ + 17.5));
      }
      box(mWhite, 2.2, 0.55, 8.8, swX + sd * 5.6, Y + 0.28, swZ + 12.5);
      box(mGold, 0.18, 1.0, 8.8, swX + sd * 4.5, Y + 0.85, swZ + 12.5);
    }

    // Indoor Dark-Ride Show-Building Group (shifted cleanly to swX=306, swZ=84!)
    const swHallGrp = new T.Group(); swHallGrp.position.set(dxSW, 0, dzSW); group.add(swHallGrp);
    const darkHallMat = new T.MeshBasicMaterial({ color: 0x111530, side: T.DoubleSide });
    const addDarkWall = (w, h, x, y, z, ry) => {
      const m = new T.Mesh(new T.PlaneGeometry(w, h), darkHallMat);
      m.position.set(x, y, z); if (ry) m.rotation.y = ry; swHallGrp.add(m);
    };
    addDarkWall(47, 14.0, 192.5, Y + 6.4, 37.2, 0);
    addDarkWall(36, 14.0, 169.0, Y + 6.4, 55.2, Math.PI / 2);
    addDarkWall(36, 14.0, 216.0, Y + 6.4, 55.2, -Math.PI / 2);
    const swRoof = new T.Mesh(new T.PlaneGeometry(47, 36), darkHallMat);
    swRoof.rotation.x = Math.PI / 2; swRoof.position.set(192.5, Y + 13.0, 55.2); swHallGrp.add(swRoof);
    for (let sx = 175; sx <= 210; sx += 6.5) for (let sz = 43; sz <= 68; sz += 6.0) {
      mGlow.add(sph(0.26, 5), M(sx + dxSW, Y + 10.8 + ((sx + sz) % 3) * 0.45, sz + dzSW));
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
      const arms = new T.Mesh(new T.BoxGeometry(1.15, 0.14, 0.14), dressMat); arms.position.y = 0.98; dg.add(arms);
      swHallGrp.add(dg);
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

    // Europe, Asia, Americas/Mr. Lincoln, Africa & Finale Halls inside swHallGrp
    const euStage = new T.Mesh(new T.BoxGeometry(6.5, 1.4, 11.2), showWhite); euStage.position.set(211.5, Y - 2.6, 63); swHallGrp.add(euStage);
    const efBase = new T.Mesh(cyl(1.1, 1.8, 2.4, 4), eiffelMat); efBase.position.set(211.5, Y - 0.7, 66.2); swHallGrp.add(efBase);
    const efMid = new T.Mesh(cyl(0.45, 1.05, 2.8, 4), eiffelMat); efMid.position.set(211.5, Y + 2.0, 66.2); swHallGrp.add(efMid);
    const efTop = new T.Mesh(new T.ConeGeometry(0.42, 2.6, 4), showGold); efTop.position.set(211.5, Y + 4.7, 66.2); swHallGrp.add(efTop);
    const millBody = new T.Mesh(cyl(0.85, 1.42, 4.2, 8), showCyan); millBody.position.set(211.5, Y + 0.2, 59.8); swHallGrp.add(millBody);
    const windmillBlades = new T.Group(); windmillBlades.position.set(210.3, Y + 1.8, 59.8);
    for (let i = 0; i < 4; i++) { const bl = new T.Mesh(new T.BoxGeometry(0.12, 3.6, 0.52), showWhite); bl.rotation.x = (i * Math.PI) / 2; windmillBlades.add(bl); }
    swHallGrp.add(windmillBlades);
    addDancingDoll(209.4, Y - 1.9, 65.0, showPink, showWhite); addDancingDoll(209.4, Y - 1.9, 60.4, showGold, showRed);

    const asStage = new T.Mesh(new T.BoxGeometry(6.5, 1.4, 10.8), showPink); asStage.position.set(211.5, Y - 2.6, 48); swHallGrp.add(asStage);
    for (let k = 0; k < 3; k++) {
      const pgWall = new T.Mesh(cyl(1.3 - k * 0.28, 1.3 - k * 0.28, 0.95, 6), showWhite); pgWall.position.set(211.5, Y - 1.35 + k * 1.45, 50.8); swHallGrp.add(pgWall);
      const pgRoof = new T.Mesh(new T.ConeGeometry(2.1 - k * 0.42, 0.85, 6), showRed); pgRoof.position.set(211.5, Y - 0.55 + k * 1.45, 50.8); swHallGrp.add(pgRoof);
    }
    const tajBase = new T.Mesh(new T.BoxGeometry(3.4, 1.8, 3.4), showWhite); tajBase.position.set(211.5, Y - 1.0, 45.0); swHallGrp.add(tajBase);
    const tajDome = new T.Mesh(sph(1.35, 10), showWhite); tajDome.position.set(211.5, Y + 0.85, 45.0); swHallGrp.add(tajDome);
    addDancingDoll(209.4, Y - 1.9, 49.4, showGold, showRed); addDancingDoll(209.4, Y - 1.9, 46.8, showRed, showGold);

    const lnStage = new T.Mesh(new T.BoxGeometry(18.0, 2.2, 5.8), showNavy); lnStage.position.set(192.5, Y - 2.2, 40.5); swHallGrp.add(lnStage);
    const lnBack = new T.Mesh(new T.BoxGeometry(16.6, 9.2, 0.5), showNavy); lnBack.position.set(192.5, Y + 3.4, 38.0); swHallGrp.add(lnBack);
    for (const sd of [-1, 1]) {
      const curt = new T.Mesh(new T.BoxGeometry(3.0, 9.2, 1.2), curtainMat); curt.position.set(192.5 + sd * 7.4, Y + 3.4, 39.0); swHallGrp.add(curt);
      const col = new T.Mesh(cyl(0.32, 0.36, 8.6, 10), showWhite); col.position.set(192.5 + sd * 5.6, Y + 3.2, 39.2); swHallGrp.add(col);
      const flag = new T.Mesh(new T.PlaneGeometry(2.1, 1.3), usFlagMat); flag.position.set(192.5 + sd * 3.05, Y + 4.1, 39.85); swHallGrp.add(flag);
    }
    const lnBanner = new T.Mesh(new T.PlaneGeometry(11.6, 2.2), makeStageBanner('林肯总统演讲大厅 · MR. LINCOLN', 'GREAT MOMENTS WITH MR. LINCOLN · LIBERTY & PEACE', '#172554', '#facc15'));
    lnBanner.position.set(192.5, Y + 6.45, 38.55); swHallGrp.add(lnBanner);
    const sealDisc = new T.Mesh(new T.CircleGeometry(1.75, 24), sealMat); sealDisc.position.set(192.5, Y + 3.25, 38.55); swHallGrp.add(sealDisc);
    const podium = new T.Mesh(new T.BoxGeometry(1.5, 1.85, 1.0), showWalnut); podium.position.set(192.5, Y - 0.18, 42.1); swHallGrp.add(podium);
    const lincolnGrp = new T.Group(); lincolnGrp.position.set(192.5, Y - 1.1, 41.0);
    const lLegs = new T.Mesh(new T.BoxGeometry(0.68, 1.25, 0.42), showSuit); lLegs.position.y = 0.62; lincolnGrp.add(lLegs);
    const lTorso = new T.Mesh(new T.BoxGeometry(0.92, 1.42, 0.50), showSuit); lTorso.position.y = 1.88; lincolnGrp.add(lTorso);
    const lHeadGrp = new T.Group(); lHeadGrp.position.set(0, 2.86, 0);
    lHeadGrp.add(new T.Mesh(sph(0.32, 10), showSkin));
    const lHat = new T.Mesh(cyl(0.32, 0.31, 0.72, 12), showSuit); lHat.position.y = 0.72; lHeadGrp.add(lHat);
    lincolnGrp.add(lHeadGrp);
    const lArmR = new T.Group(); lArmR.position.set(-0.56, 2.38, 0.12);
    const lSleeveR = new T.Mesh(new T.BoxGeometry(0.24, 0.95, 0.24), showSuit); lSleeveR.position.y = -0.45; lArmR.add(lSleeveR);
    lincolnGrp.add(lArmR);
    const lArmL = new T.Group(); lArmL.position.set(0.56, 2.38, 0.12);
    const lSleeveL = new T.Mesh(new T.BoxGeometry(0.24, 0.95, 0.24), showSuit); lSleeveL.position.y = -0.45; lArmL.add(lSleeveL);
    lincolnGrp.add(lArmL);
    swHallGrp.add(lincolnGrp);

    const afStage = new T.Mesh(new T.BoxGeometry(6.5, 1.4, 11.0), showGold); afStage.position.set(174.0, Y - 2.6, 49); swHallGrp.add(afStage);
    addDancingDoll(176.0, Y - 1.9, 48.5, showCyan, showPink);
    const finStage = new T.Mesh(new T.BoxGeometry(6.5, 1.4, 10.5), showWhite); finStage.position.set(174.0, Y - 2.6, 63); swHallGrp.add(finStage);
    const finCarGrp = new T.Group(); finCarGrp.position.set(174.2, Y - 1.9, 63);
    const finCanopy = new T.Mesh(new T.ConeGeometry(2.6, 1.8, 12), showGold); finCanopy.position.y = 3.8; finCarGrp.add(finCanopy);
    const finPole = new T.Mesh(cyl(0.25, 0.3, 3.4, 8), showWhite); finPole.position.y = 1.7; finCarGrp.add(finPole);
    swHallGrp.add(finCarGrp);
    addDancingDoll(176.0, Y - 1.9, 61.5, showWhite, showGold); addDancingDoll(176.0, Y - 1.9, 64.5, showGold, showWhite);

    const swBoatGrp = new T.Group();
    swBoatGrp.position.set(swX, WY + 0.05, swZ + 9.5);
    const swHull = new T.Mesh(new T.BoxGeometry(2.6, 0.72, 5.6), pastelBlueMat); swHull.position.y = 0.36; swBoatGrp.add(swHull);
    const swDeck = new T.Mesh(new T.BoxGeometry(2.2, 0.20, 4.9), whiteMat); swDeck.position.y = 0.72; swBoatGrp.add(swDeck);
    for (const bz of [-1.4, 0, 1.4]) { const seat = new T.Mesh(new T.BoxGeometry(2.0, 0.32, 0.65), pastelPinkMat); seat.position.set(0, 0.92, bz); swBoatGrp.add(seat); }
    group.add(swBoatGrp);

    const swWaypoints = [
      [192.5, 84.0], [192.5, 72.0], [202.5, 67.5], [205.5, 62.0],
      [205.5, 51.0], [199.5, 49.5], [192.5, 49.5], [185.5, 49.5],
      [180.0, 51.5], [180.0, 62.5], [184.5, 68.5], [192.5, 72.5], [192.5, 84.0]
    ].map(([x, z]) => [x + dxSW, z + dzSW]);
    function sampleSW(t) {
      const n = swWaypoints.length - 1, u = Math.max(0, Math.min(0.9999, t)) * n;
      const i = Math.floor(u), f = u - i, a = swWaypoints[i], b = swWaypoints[i + 1];
      return { x: a[0] + (b[0] - a[0]) * f, z: a[1] + (b[1] - a[1]) * f };
    }
    const swState = { running: false, t: 0, speed: 0.032, eventIdx: -1 };
    const smallWorldRide = {
      id: 'small_world_boat', name: '小小世界室内游船（含林肯演讲）', land: 'Fantasyland',
      boardPos: { x: swX, y: Y, z: swZ + 14.5 },
      exitPos:  { x: swX, y: Y, z: swZ + 20.5, yaw: 0 },
      start: () => { swState.running = true; },
      stop:  () => { swState.running = false; },
      isRunning: () => swState.running,
      getCameraPose: (thirdPerson) => {
        const bp = swBoatGrp.position, yaw = swBoatGrp.rotation.y;
        const fwdX = Math.sin(yaw), fwdZ = Math.cos(yaw);
        const nearLincoln = swState.t >= 0.42 && swState.t <= 0.62;
        if (thirdPerson) {
          return {
            px: bp.x - fwdX * 5.8, py: bp.y + 3.2, pz: bp.z - fwdZ * 5.8,
            tx: nearLincoln ? swX : bp.x + fwdX * 6, ty: nearLincoln ? Y + 2.3 : bp.y + 1.4, tz: nearLincoln ? 39.2 + dzSW : bp.z + fwdZ * 6
          };
        }
        return {
          px: bp.x + fwdX * 0.6, py: bp.y + 2.15, pz: bp.z + fwdZ * 0.6,
          tx: nearLincoln ? swX : bp.x + fwdX * 12, ty: nearLincoln ? Y + 2.5 : bp.y + 1.8, tz: nearLincoln ? 39.2 + dzSW : bp.z + fwdZ * 12
        };
      }
    };

    /* ============================================================================
     * 3. FANTASYLAND SPINNERS: DUMBO (x=238, z=132) & MAD TEA PARTY (x=296, z=120)
     * ============================================================================ */
    const dmX = 238, dmZ = 132;
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
      arm.add(ele); dumboGrp.add(arm); dumbos.push({ arm, phase: a });
    }
    group.add(dumboGrp);

    const mtX = 296, mtZ = 120;
    mWhite.add(cyl(6.2, 6.5, 0.45, 20), M(mtX, Y + 0.22, mtZ));
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      mIron.add(cyl(0.08, 0.10, 4.8, 6), M(mtX + Math.cos(a) * 6.0, Y + 2.4, mtZ + Math.sin(a) * 6.0));
      mGlow.add(sph(0.24, 6), M(mtX + Math.cos(a) * 4.5, Y + 4.5, mtZ + Math.sin(a) * 4.5));
    }
    const teaGrp = new T.Group(); teaGrp.position.set(mtX, Y + 0.5, mtZ);
    const teapot = new T.Mesh(sph(1.35, 12), pastelBlueMat); teapot.position.y = 1.3; teaGrp.add(teapot);
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
     * 4. RIDEABLE BIG THUNDER MOUNTAIN RAILROAD (btX=188, btZ=154 — 37m Red-Rock Mesas & Dinosaur Ribs!)
     * ============================================================================ */
    const btX = 188, btZ = 154;
    mRedRock.add(cyl(10.5, 15.5, 16, 9), M(btX, Y + 8.0, btZ));
    mRedRock.add(cyl(5.8, 9.5, 14, 8), M(btX - 2.0, Y + 21.0, btZ - 1.5));
    mRedDark.add(new T.ConeGeometry(4.4, 14.0, 7), M(btX - 2.5, Y + 31.5, btZ - 1.8));
    mRedRock.add(cyl(4.8, 8.2, 18, 8), M(btX + 9.0, Y + 9.0, btZ + 4.5));
    mRedDark.add(new T.ConeGeometry(4.0, 11.0, 6), M(btX + 9.0, Y + 22.5, btZ + 4.5));
    mRedRock.add(cyl(5.4, 8.8, 14, 8), M(btX - 9.2, Y + 7.0, btZ + 5.8));
    mRedDark.add(new T.ConeGeometry(3.6, 9.5, 6), M(btX - 9.2, Y + 18.0, btZ + 5.8));
    // Tumbleweed Mining Water Tower + Giant Bleached Dinosaur Ribcage Arch over Track!
    mWood.add(cyl(1.8, 1.9, 2.8, 10), M(btX + 14.5, Y + 6.2, btZ + 13.0));
    mRedDark.add(new T.ConeGeometry(2.1, 1.6, 10), M(btX + 14.5, Y + 8.3, btZ + 13.0));
    for (let r = -2; r <= 2; r++) {
      mWhite.add(new T.TorusGeometry(3.2, 0.18, 5, 12, Math.PI), M(btX, Y + 2.2, btZ + 16.5 + r * 1.1));
    }
    const mineCars = [];
    for (let c = 0; c < 4; c++) {
      const mg = new T.Group();
      const mb = new T.Mesh(new T.BoxGeometry(1.45, 1.05, 2.7), c === 0 ? ironMat : woodMat);
      mb.position.y = 0.65; mg.add(mb);
      if (c === 0) { const st = new T.Mesh(cyl(0.24, 0.16, 0.95, 6), goldMat); st.position.set(0, 1.45, 0.85); mg.add(st); }
      group.add(mg); mineCars.push(mg);
    }
    const btState = { running: true, ang: 0 };
    function sampleBT(a) {
      const r = 16.2 + Math.cos(a * 2) * 1.8;
      return { x: btX + Math.cos(a) * r, y: Y + 4.8 + Math.sin(a * 2) * 3.4 + Math.cos(a * 3) * 1.2, z: btZ + Math.sin(a) * r };
    }
    const bigThunderRide = {
      id: 'big_thunder', name: '巨雷山失控矿车（Big Thunder Mountain）', land: 'Frontierland',
      boardPos: { x: btX + 4, y: Y, z: btZ + 20.5 },
      exitPos:  { x: btX + 6, y: Y, z: btZ + 24.0, yaw: 0 },
      start: () => { btState.running = true; },
      stop:  () => { btState.running = false; },
      isRunning: () => btState.running,
      getCameraPose: (thirdPerson) => {
        const p0 = sampleBT(btState.ang), p1 = sampleBT(btState.ang + 0.06);
        const dx = p1.x - p0.x, dy = p1.y - p0.y, dz = p1.z - p0.z, L = Math.hypot(dx, dy, dz) || 1;
        const fx = dx / L, fy = dy / L, fz = dz / L;
        if (thirdPerson) return { px: p0.x - fx * 8.5, py: p0.y + 3.8, pz: p0.z - fz * 8.5, tx: p0.x + fx * 6, ty: p0.y + 1.0, tz: p0.z + fz * 6 };
        return { px: p0.x + fx * 0.6, py: p0.y + 1.55, pz: p0.z + fz * 0.6, tx: p0.x + fx * 16, ty: p0.y + fy * 16 + 0.4, tz: p0.z + fz * 16 };
      }
    };

    /* ============================================================================
     * 5. TRUE-SCALE RIVERS OF AMERICA: WALKABLE TOM SAWYER ISLAND, MARK TWAIN & SAILING SHIP COLUMBIA!
     * ============================================================================ */
    // Walkable Tom Sawyer Island (center x=134, z=191): Suspension Bridge Towers, Harper's Mill, Pirate Skull Rock & Fort Wilderness!
    for (const bx of [153, 180]) {
      for (const bz of [201.6, 206.4]) box(mWood, 0.55, 4.2, 0.55, bx, Y + 2.1, bz);
      box(mWood, 0.65, 0.5, 5.4, bx, Y + 4.2, 204);
    }
    box(mIron, 28.0, 0.08, 0.08, 166.5, Y + 1.15, 201.7);
    box(mIron, 28.0, 0.08, 0.08, 166.5, Y + 1.15, 206.3);
    // Harper's Cider Mill on Tom Sawyer Island South Tip (x=134, z=211) + Spinning Waterwheel!
    box(mWood, 6.4, 5.2, 5.6, 134, Y + 2.6, 211);
    mRedDark.add(new T.ConeGeometry(5.0, 2.8, 4), M(134, Y + 6.6, 211, 0, Math.PI / 4, 0));
    const millWheel = new T.Mesh(cyl(2.2, 2.2, 0.55, 12), woodMat);
    millWheel.rotation.z = Math.PI / 2; millWheel.position.set(137.5, Y + 1.4, 211); group.add(millWheel);
    // Fort Wilderness Log Stockade at North End of Tom Sawyer Island (x=134, z=172)
    box(mWood, 9.6, 3.8, 8.4, 134, Y + 1.9, 172);
    for (const [tx, tz] of [[-4.6, -4.0], [4.6, -4.0], [-4.6, 4.0], [4.6, 4.0]]) {
      box(mWood, 2.4, 5.8, 2.4, 134 + tx, Y + 2.9, 172 + tz);
      mWood.add(new T.ConeGeometry(1.9, 2.0, 4), M(134 + tx, Y + 6.8, 172 + tz, 0, Math.PI / 4, 0));
    }
    // Pirate's Lair Skull Rock Outcrop (x=122, z=191)
    mRock.add(sph(4.2, 9), M(122, Y + 2.6, 191));
    mGlow.add(sph(0.32, 5), M(118.4, Y + 3.0, 190)); mGlow.add(sph(0.32, 5), M(118.4, Y + 3.0, 192));

    // Mark Twain 3-Deck Sternwheeler Riverboat AND 3-Masted Sailing Ship Columbia circling Tom Sawyer Island!
    function makeRiverboatDeckTex() {
      const c = cvs(256, 128), x = c.getContext('2d');
      x.fillStyle = '#fcfaf2'; x.fillRect(0, 0, 256, 128);
      for (let i = 0; i < 8; i++) {
        x.fillStyle = '#fef08a'; x.fillRect(i * 32 + 6, 20, 20, 48);
        x.strokeStyle = '#92400e'; x.lineWidth = 3; x.strokeRect(i * 32 + 6, 20, 20, 48);
      }
      x.fillStyle = '#e6b83c'; x.fillRect(0, 0, 256, 10); x.fillRect(0, 82, 256, 8);
      return finTex(c, true);
    }
    const riverDeckMat = new T.MeshLambertMaterial({ map: makeRiverboatDeckTex(), emissive: 0x201c12 });
    const mtBoat = new T.Group();
    const hull = new T.Mesh(new T.BoxGeometry(5.0, 1.3, 14.0), whiteMat); hull.position.y = 0.65; mtBoat.add(hull);
    const deck2 = new T.Mesh(new T.BoxGeometry(4.4, 1.8, 10.8), riverDeckMat); deck2.position.y = 2.25; mtBoat.add(deck2);
    const deck3 = new T.Mesh(new T.BoxGeometry(3.6, 1.6, 7.8), riverDeckMat); deck3.position.y = 3.95; mtBoat.add(deck3);
    const pilot = new T.Mesh(new T.BoxGeometry(2.1, 1.3, 2.5), riverDeckMat); pilot.position.set(0, 5.3, 1.8); mtBoat.add(pilot);
    const steamPuffs = [];
    for (const sx of [-0.95, 0.95]) {
      const st = new T.Mesh(cyl(0.28, 0.32, 4.4, 8), ironMat); st.position.set(sx, 6.0, 3.8); mtBoat.add(st);
      const puff = new T.Mesh(sph(0.42, 6), new T.MeshBasicMaterial({ color: 0xf8fafc, transparent: true, opacity: 0.65 }));
      puff.position.set(sx, 9.0, 3.8); mtBoat.add(puff);
      steamPuffs.push({ mesh: puff, phase: sx > 0 ? 0.5 : 0 });
    }
    const paddleWheel = new T.Mesh(cyl(1.5, 1.5, 3.6, 10), crimsonMat);
    paddleWheel.rotation.z = Math.PI / 2; paddleWheel.position.set(0, 1.5, -7.2); mtBoat.add(paddleWheel);
    group.add(mtBoat);

    // 3-Masted Tall Ship "SAILING SHIP COLUMBIA" (opposite side of Rivers of America!)
    const columbia = new T.Group();
    const colHull = new T.Mesh(new T.BoxGeometry(4.4, 2.2, 13.8), ironMat); colHull.position.y = 1.1; columbia.add(colHull);
    const colStripe = new T.Mesh(new T.BoxGeometry(4.5, 0.45, 13.9), goldMat); colStripe.position.y = 1.6; columbia.add(colStripe);
    const sailMat = new T.MeshLambertMaterial({ color: 0xfef9e7, side: T.DoubleSide, emissive: 0x1c1912 });
    for (const [mz, mh] of [[-4.2, 9.5], [0.4, 11.5], [4.6, 9.8]]) {
      const mast = new T.Mesh(cyl(0.14, 0.22, mh, 6), woodMat); mast.position.set(0, 2.0 + mh / 2, mz); columbia.add(mast);
      const s1 = new T.Mesh(new T.PlaneGeometry(4.2, 3.2), sailMat); s1.position.set(0, 4.8, mz + 0.15); columbia.add(s1);
      const s2 = new T.Mesh(new T.PlaneGeometry(3.4, 2.6), sailMat); s2.position.set(0, 8.4, mz + 0.15); columbia.add(s2);
    }
    group.add(columbia);

    /* ============================================================================
     * 6. THE HAUNTED MANSION (hmX=82, hmZ=236 — New Orleans Antebellum Mansion!)
     * ============================================================================ */
    function makeMansionFacadeTex() {
      const c = cvs(256, 256), x = c.getContext('2d');
      x.fillStyle = '#f4f2ec'; x.fillRect(0, 0, 256, 256);
      for (const wy of [28, 146]) for (const wx of [24, 106, 188]) {
        x.fillStyle = '#1e293b'; x.fillRect(wx, wy, 44, 86);
        x.fillStyle = wy < 100 ? 'rgba(134,239,172,0.34)' : 'rgba(253,224,71,0.32)';
        x.fillRect(wx + 5, wy + 5, 34, 76);
        x.fillStyle = '#14532d'; x.fillRect(wx - 12, wy, 10, 86); x.fillRect(wx + 46, wy, 10, 86);
        x.strokeStyle = '#f8fafc'; x.lineWidth = 3; x.strokeRect(wx, wy, 44, 86);
      }
      return finTex(c, false);
    }
    const hmX = 82, hmZ = 236;
    const hmBody = new T.Mesh(new T.BoxGeometry(15.0, 10.5, 12.0), new T.MeshLambertMaterial({ map: makeMansionFacadeTex(), emissive: 0x161816 }));
    hmBody.position.set(hmX, Y + 5.25, hmZ); group.add(hmBody);
    box(mWhite, 16.4, 0.65, 13.4, hmX, Y + 10.7, hmZ);
    box(mWhite, 3.8, 0.45, 12.6, hmX + 8.6, Y + 0.22, hmZ);
    for (let i = 0; i < 6; i++) {
      const czp = hmZ - 5.2 + i * 2.08;
      mWhite.add(cyl(0.32, 0.38, 10.0, 10), M(hmX + 8.4, Y + 5.3, czp));
      mGold.add(cyl(0.46, 0.38, 0.32, 10), M(hmX + 8.4, Y + 10.35, czp));
    }
    box(mWhite, 3.4, 0.55, 12.4, hmX + 7.2, Y + 10.65, hmZ);
    box(mSlate, 13.8, 3.2, 10.8, hmX, Y + 12.4, hmZ);
    box(mWhite, 3.6, 3.4, 3.6, hmX, Y + 15.4, hmZ);
    mSlate.add(new T.ConeGeometry(2.6, 2.8, 4), M(hmX, Y + 18.4, hmZ, 0, Math.PI / 4, 0));
    for (const fz of [-6.0, -2.5, 2.5, 6.0]) {
      box(mWhite, 0.85, 2.8, 0.85, hmX + 12.5, Y + 1.4, hmZ + fz);
      mGlow.add(sph(0.24, 6), M(hmX + 12.5, Y + 3.0, hmZ + fz));
    }

    /* ============================================================================
     * 7. ADVENTURELAND BANYAN TREEHOUSE (x=186, z=294), SUBMARINE LAGOON (x=382, z=202) & MONORAIL!
     * ============================================================================ */
    const thX = 186, thZ = 294;
    mBark.add(cyl(2.2, 3.6, 12.5, 10), M(thX, Y + 6.2, thZ));
    for (const [bx, by, bz, r] of [[0, 13.5, 0, 6.5], [-4.2, 11.5, 2.2, 4.6], [4.5, 12.0, -1.8, 4.8], [0.5, 16.5, -1.2, 4.2]]) {
      mLeafD.add(sph(r, 9), M(thX + bx, Y + by, thZ + bz));
    }
    for (const [hx, hy, hz] of [[-3.2, 9.5, 2.5], [3.0, 12.8, -1.0]]) {
      box(mWood, 3.2, 2.4, 3.2, thX + hx, Y + hy, thZ + hz);
      mRedDark.add(new T.ConeGeometry(2.8, 2.2, 6), M(thX + hx, Y + hy + 2.2, thZ + hz));
    }

    const subs = [];
    for (let i = 0; i < 3; i++) {
      const sg = new T.Group();
      const sb = new T.Mesh(cyl(0.62, 0.62, 4.8, 10), yellowSubMat); sb.rotation.x = Math.PI / 2; sg.add(sb);
      const st = new T.Mesh(cyl(0.35, 0.42, 1.1, 8), yellowSubMat); st.position.set(0, 0.75, 0.4); sg.add(st);
      group.add(sg); subs.push({ grp: sg, phase: (i / 3) * Math.PI * 2 });
    }
    const mrCx = 392, mrCz = 228, mrRx = 46, mrRz = 44;
    for (let i = 0; i < 40; i++) {
      const a0 = (i / 40) * Math.PI * 2, a1 = ((i + 1) / 40) * Math.PI * 2;
      const x0 = mrCx + Math.cos(a0) * mrRx, z0 = mrCz + Math.sin(a0) * mrRz;
      const x1 = mrCx + Math.cos(a1) * mrRx, z1 = mrCz + Math.sin(a1) * mrRz;
      const len = Math.hypot(x1 - x0, z1 - z0), ang = Math.atan2(x1 - x0, z1 - z0);
      box(mConc, 0.85, 0.95, len + 0.15, (x0 + x1) / 2, Y + 9.2, (z0 + z1) / 2, 0, ang, 0);
      if (i % 4 === 0) mConc.add(cyl(0.55, 0.72, 9.2, 8), M(x0, Y + 4.6, z0));
    }
    const monoCars = [];
    for (let c = 0; c < 4; c++) {
      const cg = new T.Group();
      const b = new T.Mesh(new T.BoxGeometry(1.75, 1.35, 4.2), whiteMat); b.position.y = 0.85; cg.add(b);
      const stripe = new T.Mesh(new T.BoxGeometry(1.82, 0.34, 4.26), crimsonMat); stripe.position.y = 0.82; cg.add(stripe);
      group.add(cg); monoCars.push(cg);
    }

    /* ============================================================================
     * 8. 340+ SCULPTED 3D ARCHITECTURAL TREES, PALMS, PINES & RIVER BOULDERS!
     * ============================================================================ */
    let seed = 20261124;
    const rng = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    function addSculptedTree(tx, tz, kind) {
      if (kind === 'palm') {
        const h = 6.8 + rng() * 3.8;
        mBark.add(cyl(0.22, 0.42, h, 5), M(tx, Y + h / 2, tz, (rng() - 0.5) * 0.16, 0, (rng() - 0.5) * 0.16));
        for (let f = 0; f < 6; f++) {
          const fa = (f / 6) * Math.PI * 2 + rng() * 0.3;
          box(mPalm, 0.62, 0.14, 3.6, tx + Math.cos(fa) * 1.5, Y + h + 0.2, tz + Math.sin(fa) * 1.5, 0.32, Math.PI / 2 - fa, 0);
        }
      } else if (kind === 'pine') {
        const h = 7.2 + rng() * 4.5;
        mBark.add(cyl(0.25, 0.45, 2.4, 5), M(tx, Y + 1.2, tz));
        mPine.add(new T.ConeGeometry(2.6, h * 0.52, 6), M(tx, Y + 2.2 + h * 0.25, tz));
        mPine.add(new T.ConeGeometry(1.9, h * 0.46, 6), M(tx, Y + 2.2 + h * 0.55, tz));
      } else {
        const h = 4.4 + rng() * 2.6, r = 2.1 + rng() * 1.1;
        mBark.add(cyl(0.28, 0.48, h, 5), M(tx, Y + h / 2, tz));
        const fol = kind === 'blossom' ? mBlossom : (rng() < 0.5 ? mLeafD : mLeafM);
        fol.add(new T.IcosahedronGeometry(r, 1), M(tx, Y + h + r * 0.65, tz));
        fol.add(new T.IcosahedronGeometry(r * 0.74, 0), M(tx + r * 0.55, Y + h + r * 0.25, tz + r * 0.32));
      }
    }

    const zi = (x, z) => (x | 0) + (z | 0) * world.W;
    let placed = 0;
    for (let attempt = 0; attempt < 1600 && placed < 310; attempt++) {
      const tx = 44 + rng() * 452, tz = 38 + rng() * 472;
      const cell = zi(tx, tz);
      if (world.occ[cell] || world.hm[cell] < Y) continue;
      if (Math.abs(tx - 272.5) < 34 && tz > 130 && tz < 512) continue; // Keep full Main St / Hub / Castle sightline crisp!
      if (Math.hypot(tx - 330, tz - 176) < 25) continue; // Matterhorn
      if (Math.hypot(tx - 188, tz - 154) < 22) continue; // Big Thunder
      if (Math.hypot(tx - 116, tz - 82) < 42) continue;  // Batuu
      if (Math.hypot(tx - 64, tz - 186) < 22) continue;  // Tiana's Bayou
      if (Math.hypot(tx - 82, tz - 236) < 18) continue;  // Haunted Mansion
      if (tx >= 114 && tx <= 176 && tz >= 244 && tz <= 332) continue; // Pirates Cavern & NOS
      if (Math.hypot(tx - 148, tz - 294) < 18) continue; // Indy Temple
      if (tx >= 282 && tx <= 330 && tz >= 44 && tz <= 104) continue;  // Small World
      if (tx >= 224 && tx <= 286 && tz >= 34 && tz <= 84) continue;   // Toontown
      if (tx >= 344 && tx <= 462 && tz >= 220 && tz <= 306) continue; // Tomorrowland
      const isAdv = tx < 224 && tz > 274 && tz < 372;
      const isAlp = Math.hypot(tx - 330, tz - 176) < 48 || Math.hypot(tx - 134, tz - 191) < 32;
      const isFan = tz < 195 && tx > 218 && tx < 330;
      addSculptedTree(tx, tz, isAdv ? 'palm' : isAlp ? 'pine' : (isFan && rng() < 0.42) ? 'blossom' : 'oak');
      placed++;
    }
    // Shade Trees inside Town Square Lawn!
    for (const [tx, tz] of [[265, 424], [280, 424], [265, 440], [280, 440]]) addSculptedTree(tx, tz, 'oak');

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

    function update(dt, elapsed, onEvent) {
      // Matterhorn Bobsleds + Roaring Yeti Harold!
      yetiGrp.rotation.y = -0.6 + Math.sin(elapsed * 2.8) * 0.32;
      if (mhState.running) mhState.ang += dt * 0.68;
      bobsleds.forEach((bg, idx) => {
        const a = mhState.ang - idx * 0.19;
        const p0 = sampleMH(a), p1 = sampleMH(a + 0.05);
        bg.position.set(p0.x, p0.y, p0.z);
        bg.rotation.y = Math.atan2(p1.x - p0.x, p1.z - p0.z);
        bg.rotation.z = Math.cos(a * 2) * 0.24;
      });

      // Small World + Abraham Lincoln
      swPendulum.rotation.z = Math.sin(elapsed * 2.2) * 0.38;
      windmillBlades.rotation.x = elapsed * 1.4;
      finCarGrp.rotation.y = elapsed * 0.85;
      swDolls.forEach((d) => {
        d.grp.rotation.z = Math.sin(elapsed * 3.2 + d.phase) * 0.16;
        d.grp.position.y = d.baseY + Math.abs(Math.sin(elapsed * 2.8 + d.phase)) * 0.18;
      });
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
          '✨ 欢迎来到【纯白鎏金大合唱厅】：世界儿童齐唱《It\'s a Small World》！'
        ];
        const ev = Math.min(msgs.length - 1, Math.floor((swState.t % 1) * msgs.length));
        if (ev !== swState.eventIdx) { swState.eventIdx = ev; if (onEvent) onEvent(msgs[ev]); }
        if (swState.t >= 1.0) {
          swState.t = 0; swState.running = false; swState.eventIdx = -1;
          swBoatGrp.position.set(swX, WY + 0.05, swZ + 9.5); swBoatGrp.rotation.y = Math.PI;
          if (onEvent) onEvent('⚓ 「小小世界」游船已安全靠岸！');
        }
      }

      dumboGrp.rotation.y = elapsed * 0.62;
      dumbos.forEach((d) => { d.arm.rotation.z = 0.14 + Math.sin(elapsed * 2.2 + d.phase) * 0.18; });
      teaGrp.rotation.y = -elapsed * 0.55;
      teacups.forEach((c, idx) => { c.rotation.y = elapsed * (2.2 + (idx % 2) * 0.8); });

      // Big Thunder Runaway Mine Train!
      if (btState.running) btState.ang += dt * 0.66;
      mineCars.forEach((mg, idx) => {
        const a = btState.ang - idx * 0.20;
        const p0 = sampleBT(a), p1 = sampleBT(a + 0.05);
        mg.position.set(p0.x, p0.y, p0.z);
        mg.rotation.y = Math.atan2(p1.x - p0.x, p1.z - p0.z);
        mg.rotation.z = Math.sin(a * 2) * 0.20;
      });

      // Rivers of America: Mark Twain & Sailing Ship Columbia circling opposite arcs on the West Channel + Harper's Mill!
      millWheel.rotation.x = elapsed * 1.4;
      paddleWheel.rotation.x = -elapsed * 2.4;
      // Cruise smoothly along the spacious West River Channel (avoiding the East Suspension Footbridge!)
      const mtU = Math.sin(elapsed * 0.14);
      const mtA = Math.PI + mtU * 1.15;
      const mtx = 134 + Math.cos(mtA) * 33.5, mtz = 191 + Math.sin(mtA) * 39.5;
      const mtnx = 134 + Math.cos(mtA + (Math.cos(elapsed * 0.14) >= 0 ? 0.04 : -0.04)) * 33.5;
      const mtnz = 191 + Math.sin(mtA + (Math.cos(elapsed * 0.14) >= 0 ? 0.04 : -0.04)) * 39.5;
      mtBoat.position.set(mtx, WY + 0.12, mtz);
      mtBoat.rotation.y = Math.atan2(mtnx - mtx, mtnz - mtz);
      steamPuffs.forEach((p) => {
        const cyc = (elapsed * 0.65 + p.phase) % 1.0;
        p.mesh.position.y = 8.6 + cyc * 3.6;
        p.mesh.scale.setScalar(0.65 + cyc * 1.4);
        p.mesh.material.opacity = (1 - cyc) * 0.65;
      });

      const colA = Math.PI - mtU * 1.15;
      const clx = 134 + Math.cos(colA) * 31.0, clz = 191 + Math.sin(colA) * 37.0;
      const clnx = 134 + Math.cos(colA + (Math.cos(elapsed * 0.14) >= 0 ? -0.04 : 0.04)) * 31.0;
      const clnz = 191 + Math.sin(colA + (Math.cos(elapsed * 0.14) >= 0 ? -0.04 : 0.04)) * 37.0;
      columbia.position.set(clx, WY + 0.08, clz);
      columbia.rotation.y = Math.atan2(clnx - clx, clnz - clz);

      subs.forEach((s) => {
        const a = elapsed * 0.26 + s.phase;
        const sx = 382 + Math.cos(a) * 14.5, sz = 202 + Math.sin(a) * 10.2;
        const nx = 382 + Math.cos(a + 0.05) * 14.5, nz = 202 + Math.sin(a + 0.05) * 10.2;
        s.grp.position.set(sx, WY - 0.08, sz); s.grp.rotation.y = Math.atan2(nx - sx, nz - sz);
      });
      const moA = elapsed * 0.24;
      monoCars.forEach((cg, idx) => {
        const a = moA - idx * 0.11;
        const px = mrCx + Math.cos(a) * mrRx, pz = mrCz + Math.sin(a) * mrRz;
        const nx = mrCx + Math.cos(a + 0.04) * mrRx, nz = mrCz + Math.sin(a + 0.04) * mrRz;
        cg.position.set(px, Y + 9.75, pz); cg.rotation.y = Math.atan2(nx - px, nz - pz);
      });
    }

    return { update, smallWorldRide, matterhornRide, bigThunderRide };
  }

  root.TPLandmarks = { build };
})(window);
