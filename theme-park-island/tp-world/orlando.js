/* Minest My World · Orlando Walt Disney World Resort Campus (East & South Sectors of 768x768 Resort)
 * - PARK 2: EPCOT (x=620, z=220 — 1,280-Facet Silver Geodesic Spaceship Earth + World Showcase Lagoon + Friendship Boat)
 * - PARK 3: Disney's Hollywood Studios (x=628, z=560 — Pueblo-Deco Tower of Terror w/ Plunging Elevator, Chinese Theatre & Toy Story)
 * - PARK 4: Disney's Animal Kingdom (x=272, z=628 — 28-Cluster Organic Tree of Life, Pandora Floating Mountains & Rideable Everest!)
 * - RIDE: RIDEABLE DISNEY SKYLINER AERIAL GONDOLAS (EPCOT <-> Hollywood Studios)! */
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

    function makeTowerTex() {
      const c = cvs(256, 256), x = c.getContext('2d');
      const g = x.createLinearGradient(0, 0, 0, 256);
      g.addColorStop(0, '#cfa08e'); g.addColorStop(0.55, '#b57f6e'); g.addColorStop(1, '#7d554a');
      x.fillStyle = g; x.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 36; i++) {
        x.fillStyle = i % 2 === 0 ? 'rgba(65,40,32,0.12)' : 'rgba(248,232,222,0.12)';
        x.fillRect((i * 41) % 240, (i * 29) % 240, 26, 16);
      }
      for (let r = 0; r < 4; r++) for (let k = 0; k < 4; k++) {
        const wx = 18 + k * 60, wy = 16 + r * 60;
        x.fillStyle = '#191620';
        x.beginPath(); x.moveTo(wx, wy + 40); x.lineTo(wx, wy + 14); x.arc(wx + 14, wy + 14, 14, Math.PI, 0); x.lineTo(wx + 28, wy + 40); x.fill();
        if ((r * 3 + k) % 4 === 0) { x.fillStyle = 'rgba(253,224,71,0.48)'; x.fillRect(wx + 5, wy + 14, 18, 22); }
        x.strokeStyle = '#efe0d6'; x.lineWidth = 3; x.stroke();
      }
      return finTex(c, true);
    }

    function makeArtDecoShopTex(wallHex, accentHex) {
      const c = cvs(256, 256), x = c.getContext('2d');
      x.fillStyle = wallHex; x.fillRect(0, 0, 256, 256);
      x.fillStyle = accentHex; x.fillRect(0, 0, 256, 22); x.fillRect(0, 118, 256, 12);
      x.fillStyle = '#fef3c7'; x.fillRect(0, 24, 256, 5); x.fillRect(0, 132, 256, 4);
      for (const wx of [24, 104, 184]) {
        x.fillStyle = '#1e293b'; x.fillRect(wx, 40, 48, 66);
        x.fillStyle = 'rgba(253,230,138,0.28)'; x.fillRect(wx + 5, 45, 38, 56);
        x.strokeStyle = '#f8fafc'; x.lineWidth = 4; x.strokeRect(wx, 40, 48, 66);
      }
      for (const wx of [18, 138]) {
        const wg = x.createLinearGradient(0, 152, 0, 238);
        wg.addColorStop(0, '#fef9c3'); wg.addColorStop(0.5, '#f59e0b'); wg.addColorStop(1, '#78350f');
        x.fillStyle = wg; x.fillRect(wx, 152, 100, 86);
        x.strokeStyle = accentHex; x.lineWidth = 6; x.strokeRect(wx, 152, 100, 86);
      }
      return finTex(c, false);
    }

    function makeTreeOfLifeBarkTex() {
      const c = cvs(256, 256), x = c.getContext('2d');
      x.fillStyle = '#6e533e'; x.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 84; i++) {
        x.fillStyle = i % 2 === 0 ? 'rgba(42,28,18,0.48)' : 'rgba(182,148,116,0.32)';
        x.beginPath();
        x.ellipse((i * 37) % 256, (i * 23) % 256, 9 + (i % 10), 22 + (i % 18), (i % 3) * 0.2, 0, Math.PI * 2);
        x.fill();
      }
      return finTex(c, true);
    }

    function makeBannerTex(title, sub, bg, border, subCol) {
      const c = cvs(512, 112), x = c.getContext('2d');
      x.fillStyle = bg; x.fillRect(0, 0, 512, 112);
      x.strokeStyle = border; x.lineWidth = 6; x.strokeRect(5, 5, 502, 102);
      x.fillStyle = '#fef3c7'; x.font = '800 28px "Songti SC", Georgia, serif';
      x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(title, 256, 42);
      x.fillStyle = subCol || '#fde047'; x.font = '700 16px Georgia, serif'; x.fillText(sub, 256, 80);
      return finTex(c, false);
    }

    function Merger() {
      const parts = [];
      this.add = (geo, mat4) => {
        const g = geo.index ? geo.toNonIndexed() : geo.clone();
        if (mat4) g.applyMatrix4(mat4);
        parts.push(g);
      };
      this.mesh = (mat) => {
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
        m.castShadow = false; m.receiveShadow = true;
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
    const cyl = (rt, rb, h, seg) => new T.CylinderGeometry(rt, rb, h, seg || 10);
    const sph = (r, seg) => new T.SphereGeometry(r, seg || 8, Math.max(6, (seg || 8) - 2));

    const seSilverMat = new T.MeshPhongMaterial({ color: 0xdbe4ef, specular: 0xffffff, shininess: 85, flatShading: true, emissive: 0x101824 });
    const seWireMat = new T.MeshBasicMaterial({ color: 0x64748b, wireframe: true, transparent: true, opacity: 0.34 });
    const glassPrismMat = new T.MeshPhongMaterial({ color: 0x7dd3fc, specular: 0xffffff, shininess: 120, transparent: true, opacity: 0.78, flatShading: true });
    const towerMat = new T.MeshLambertMaterial({ map: makeTowerTex(), emissive: 0x160e0c });
    const decoTealShopMat = new T.MeshLambertMaterial({ map: makeArtDecoShopTex('#f3e8d8', '#0f766e'), emissive: 0x16120c });
    const decoRoseShopMat = new T.MeshLambertMaterial({ map: makeArtDecoShopTex('#f2ddd6', '#9f1239'), emissive: 0x16100e });
    const barkLifeMat = new T.MeshLambertMaterial({ map: makeTreeOfLifeBarkTex(), emissive: 0x100b06 });
    const whiteMat = new T.MeshLambertMaterial({ color: 0xf0f2f5, emissive: 0x14161a });
    const creamMat = new T.MeshLambertMaterial({ color: 0xe6d4be, emissive: 0x16120d });
    const tealDecoMat = new T.MeshLambertMaterial({ color: 0x0f766e, emissive: 0x051c1a });
    const goldMat = new T.MeshPhongMaterial({ color: 0xe2b13c, specular: 0xfef08a, shininess: 76, emissive: 0x221704 });
    const redMat = new T.MeshLambertMaterial({ color: 0xa81c22, emissive: 0x180506 });
    const blueMat = new T.MeshLambertMaterial({ color: 0x1d4ed8, emissive: 0x081538 });
    const darkMat = new T.MeshLambertMaterial({ color: 0x202530, emissive: 0x080a0e });
    const rockMat = new T.MeshLambertMaterial({ color: 0x666d74, flatShading: true, emissive: 0x0c0f13 });
    const snowMat = new T.MeshLambertMaterial({ color: 0xf2f7fc, flatShading: true, emissive: 0x1a222e });
    const leafMat = new T.MeshLambertMaterial({ color: 0x2c7a3b, flatShading: true, emissive: 0x051408 });
    const leafDarkMat = new T.MeshLambertMaterial({ color: 0x1d562a, flatShading: true, emissive: 0x040e06 });
    const leafSunMat = new T.MeshLambertMaterial({ color: 0x4b9444, flatShading: true, emissive: 0x081608 });
    const pandoraGlowMat = new T.MeshBasicMaterial({ color: 0x22d3ee });
    const pandoraPurpleMat = new T.MeshBasicMaterial({ color: 0xc084fc });
    const waterFallMat = new T.MeshPhongMaterial({ color: 0xbae6fd, specular: 0xffffff, shininess: 95, transparent: true, opacity: 0.72, side: T.DoubleSide });
    const warmGlowMat = new T.MeshBasicMaterial({ color: 0xfef08a });

    const mWhite = new Merger(), mCream = new Merger(), mTeal = new Merger(), mGold = new Merger();
    const mRed = new Merger(), mBlue = new Merger(), mDark = new Merger(), mRock = new Merger();
    const mSnow = new Merger(), mLeaf = new Merger(), mLeafD = new Merger(), mLeafS = new Merger();
    const mBark = new Merger(), mGlow = new Merger(), mCyan = new Merger(), mPurple = new Merger();

    /* ================= PARK 2: EPCOT (x=620, z=220, Lagoon z=169) ================= */
    const epX = 620, epZ = 220, lagZ = 169;
    const seSphere = new T.Mesh(new T.IcosahedronGeometry(19.2, 3), seSilverMat);
    seSphere.position.set(epX, Y + 25.2, epZ); group.add(seSphere);
    const seLattice = new T.Mesh(new T.IcosahedronGeometry(19.30, 3), seWireMat);
    seLattice.position.set(epX, Y + 25.2, epZ); group.add(seLattice);

    const ledGeo = new T.BufferGeometry();
    const ledCount = 160, ledPos = new Float32Array(ledCount * 3), ledCol = new Float32Array(ledCount * 3);
    const ledPal = [[0.22, 0.74, 0.97], [0.96, 0.45, 0.71], [0.99, 0.88, 0.28], [0.75, 0.52, 0.99]];
    for (let i = 0; i < 160; i++) {
      const phi = Math.acos(1 - 2 * (i + 0.5) / ledCount), theta = Math.PI * (1 + Math.sqrt(5)) * i, r = 19.62;
      ledPos[i * 3] = Math.sin(phi) * Math.cos(theta) * r;
      ledPos[i * 3 + 1] = Math.cos(phi) * r;
      ledPos[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * r;
      const c = ledPal[i % ledPal.length];
      ledCol[i * 3] = c[0]; ledCol[i * 3 + 1] = c[1]; ledCol[i * 3 + 2] = c[2];
    }
    ledGeo.setAttribute('position', new T.BufferAttribute(ledPos, 3));
    ledGeo.setAttribute('color', new T.BufferAttribute(ledCol, 3));
    const seLeds = new T.Points(ledGeo, new T.PointsMaterial({ size: 1.1, vertexColors: true, transparent: true, opacity: 0.75, blending: T.AdditiveBlending, depthWrite: false }));
    seLeds.position.set(epX, Y + 25.2, epZ); group.add(seLeds);

    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      mWhite.add(cyl(0.9, 1.45, 11.8, 8), M(epX + Math.cos(a) * 11.5, Y + 5.6, epZ + Math.sin(a) * 11.5, Math.sin(a) * 0.25, 0, -Math.cos(a) * 0.25));
    }
    mWhite.add(cyl(6.8, 7.4, 0.65, 24), M(epX, Y + 0.32, epZ + 30));
    const epWater = new T.Mesh(new T.CircleGeometry(6.3, 24), waterFallMat);
    epWater.rotation.x = -Math.PI / 2; epWater.position.set(epX, Y + 0.68, epZ + 30); group.add(epWater);
    for (const [dx, ph] of [[-2.4, 4.8], [0, 6.4], [2.4, 4.8]]) {
      const pr = new T.Mesh(new T.CylinderGeometry(0.18, 0.85, ph, 4), glassPrismMat);
      pr.position.set(epX + dx, Y + 0.7 + ph / 2, epZ + 30); pr.rotation.y = Math.PI / 4; group.add(pr);
    }
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const lx = epX + Math.cos(a) * 32, lz = lagZ + Math.sin(a) * 24;
      mDark.add(cyl(0.08, 0.14, 4.2, 6), M(lx, Y + 2.1, lz));
      mGlow.add(sph(0.26, 6), M(lx, Y + 4.4, lz));
    }
    mGold.add(new T.ConeGeometry(3.6, 22.0, 4), M(epX - 30, Y + 11.0, lagZ - 19)); box(mGold, 5.2, 0.5, 5.2, epX - 30, Y + 6.5, lagZ - 19);
    for (const sd of [-1, 1]) mRed.add(cyl(0.45, 0.55, 8.5, 8), M(epX + sd * 3.8, Y + 1.5, lagZ - 17));
    box(mRed, 10.6, 0.75, 0.9, epX, Y + 5.8, lagZ - 17); box(mDark, 11.2, 0.35, 1.0, epX, Y + 6.3, lagZ - 17);
    for (let k = 0; k < 5; k++) {
      box(mWhite, 5.2 - k * 0.6, 1.6, 5.2 - k * 0.6, epX, Y + 1.0 + k * 2.4, lagZ - 31);
      mDark.add(new T.ConeGeometry(4.4 - k * 0.5, 1.2, 4), M(epX, Y + 2.2 + k * 2.4, lagZ - 31, 0, Math.PI / 4, 0));
    }
    for (let k = 0; k < 5; k++) box(mRock, 14 - k * 2.2, 2.0, 14 - k * 2.2, epX + 30, Y + 1.0 + k * 2.0, lagZ - 19);
    mRed.add(cyl(4.2, 4.5, 3.8, 12), M(epX + 36, Y + 1.9, lagZ + 5));
    for (let k = 0; k < 3; k++) mBlue.add(new T.ConeGeometry(5.6 - k * 1.3, 2.2, 12), M(epX + 36, Y + 4.4 + k * 2.2, lagZ + 5));
    mGold.add(sph(0.65, 6), M(epX + 36, Y + 10.2, lagZ + 5));
    box(mRed, 3.8, 18.0, 3.8, epX - 36, Y + 9.0, lagZ + 7); box(mWhite, 4.2, 3.2, 4.2, epX - 36, Y + 19.6, lagZ + 7);
    mGold.add(new T.ConeGeometry(3.0, 6.0, 4), M(epX - 36, Y + 24.2, lagZ + 7, 0, Math.PI / 4, 0));
    const friendBoat = new T.Group();
    const fbHull = new T.Mesh(new T.BoxGeometry(2.6, 0.9, 7.2), whiteMat); fbHull.position.y = 0.45; friendBoat.add(fbHull);
    const fbCab = new T.Mesh(new T.BoxGeometry(2.2, 1.2, 5.2), blueMat); fbCab.position.y = 1.45; friendBoat.add(fbCab);
    group.add(friendBoat);
    const epcotLaserGrp = new T.Group(); epcotLaserGrp.position.set(epX, WY + 0.5, lagZ);
    const epLaserMat = new T.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.0, blending: T.AdditiveBlending, depthWrite: false });
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const beam = new T.Mesh(cyl(0.18, 0.42, 42, 6), epLaserMat);
      beam.position.set(Math.cos(a) * 4.5, 19, Math.sin(a) * 4.5);
      beam.rotation.set(Math.sin(a) * 0.35, 0, -Math.cos(a) * 0.35);
      epcotLaserGrp.add(beam);
    }
    group.add(epcotLaserGrp);
    mBlue.add(new T.ConeGeometry(4.2, 16.5, 4), M(epX + 44, Y + 9.2, epZ + 22, 0, Math.PI / 4, 0));
    box(mGold, 11.5, 1.8, 1.6, epX + 44, Y + 7.5, epZ + 22); mCyan.add(sph(1.8, 8), M(epX + 44, Y + 9.5, epZ + 22));

    /* ================= PARK 3: HOLLYWOOD STUDIOS (ttX=638, ttZ=558) ================= */
    const ttX = 638, ttZ = 558;
    const ttLobby = new T.Mesh(new T.BoxGeometry(31.0, 10.5, 17.5), towerMat); ttLobby.position.set(ttX - 4.0, Y + 5.25, ttZ + 2.0); group.add(ttLobby);
    box(mRed, 32.0, 1.4, 18.5, ttX - 4.0, Y + 11.1, ttZ + 2.0);
    box(mCream, 9.5, 0.85, 6.5, ttX - 2.0, Y + 4.8, ttZ + 13.0);
    for (const px of [-6.0, 2.0]) mCream.add(cyl(0.45, 0.55, 4.8, 8), M(ttX + px, Y + 2.4, ttZ + 15.8));
    const ttMain = new T.Mesh(new T.BoxGeometry(16.0, 44.0, 13.0), towerMat); ttMain.position.set(ttX, Y + 22.0, ttZ); group.add(ttMain);
    const ttWing = new T.Mesh(new T.BoxGeometry(10.2, 34.0, 11.2), towerMat); ttWing.position.set(ttX - 11.6, Y + 17.0, ttZ + 1.0); group.add(ttWing);
    const ttEastTur = new T.Mesh(new T.BoxGeometry(6.8, 28.0, 9.5), towerMat); ttEastTur.position.set(ttX + 10.4, Y + 14.0, ttZ + 0.5); group.add(ttEastTur);
    for (const px of [-7.8, -2.5, 7.8]) box(mCream, 1.15, 44.4, 1.25, ttX + px, Y + 22.2, ttZ + 6.5);
    for (const cy of [12.0, 24.0, 36.0, 44.2]) box(mCream, 17.2, 0.85, 14.2, ttX, Y + cy, ttZ);
    box(mCream, 11.4, 0.9, 12.2, ttX - 11.6, Y + 34.2, ttZ + 1.0);
    for (const bx of [-5.2, 0, 5.2]) mCream.add(cyl(0.45, 0.52, 4.6, 8), M(ttX + bx, Y + 46.6, ttZ + 4.8));
    mRed.add(new T.ConeGeometry(7.8, 6.8, 8), M(ttX, Y + 51.4, ttZ));
    mRed.add(new T.ConeGeometry(5.8, 5.4, 8), M(ttX - 11.6, Y + 37.2, ttZ + 1.0));
    mRed.add(new T.ConeGeometry(4.2, 4.2, 8), M(ttX + 10.4, Y + 30.2, ttZ + 0.5));
    mGold.add(cyl(0.18, 0.24, 4.0, 6), M(ttX, Y + 56.2, ttZ));
    box(mDark, 4.6, 32.0, 0.9, ttX + 2.6, Y + 24.0, ttZ + 6.4);
    for (let my = 12; my <= 38; my += 4.2) box(mCream, 4.8, 0.25, 1.1, ttX + 2.6, Y + my, ttZ + 6.7);
    const ttElevator = new T.Group(); ttElevator.position.set(ttX + 2.6, Y + 28.0, ttZ + 6.65);
    const elCab = new T.Mesh(new T.BoxGeometry(3.5, 3.6, 0.95), warmGlowMat); ttElevator.add(elCab);
    group.add(ttElevator);
    const ttSign = new T.Mesh(new T.PlaneGeometry(13.5, 2.8), new T.MeshBasicMaterial({ map: makeBannerTex('恐怖魔塔 · TOWER OF TERROR', 'THE HOLLYWOOD TOWER HOTEL · DROP SHAFT', '#1c1018', '#f43f5e', '#fde047'), side: T.DoubleSide }));
    ttSign.position.set(ttX - 2.0, Y + 40.5, ttZ + 6.95); group.add(ttSign);

    const decoShops = [[610, 580, decoTealShopMat], [610, 596, decoRoseShopMat], [656, 584, decoRoseShopMat], [656, 600, decoTealShopMat]];
    decoShops.forEach(([bx, bz, mat]) => {
      const m = new T.Mesh(new T.BoxGeometry(9.6, 8.2, 11.4), mat); m.position.set(bx, Y + 4.1, bz); group.add(m);
      box(mTeal, 10.2, 0.9, 11.8, bx, Y + 8.5, bz);
      box(mGold, 10.4, 0.22, 12.0, bx, Y + 9.05, bz);
    });
    for (const [px, pz] of [[618, 576], [618, 590], [618, 604], [646, 580], [646, 594], [646, 608]]) {
      mBark.add(cyl(0.22, 0.36, 9.2, 6), M(px, Y + 4.6, pz));
      for (let f = 0; f < 6; f++) {
        const fa = (f / 6) * Math.PI * 2;
        box(mLeaf, 0.55, 0.14, 3.4, px + Math.cos(fa) * 1.4, Y + 9.2, pz + Math.sin(fa) * 1.4, 0.32, Math.PI / 2 - fa, 0);
      }
    }
    box(mRed, 16.0, 11.5, 11.0, 588, Y + 5.75, 580); box(mGold, 16.8, 0.55, 11.8, 588, Y + 11.6, 580);
    mRed.add(new T.ConeGeometry(9.2, 6.2, 4), M(588, Y + 14.8, 580, 0, Math.PI / 4, 0));
    mGold.add(new T.ConeGeometry(5.5, 4.2, 4), M(588, Y + 19.2, 580, 0, Math.PI / 4, 0));
    for (const sd of [-1, 1]) mGold.add(cyl(0.65, 0.78, 10.5, 8), M(588 + sd * 5.2, Y + 5.2, 585.8));
    mLeaf.add(sph(3.8, 8), M(583, WY + 2.2, 610, 0, 0, 0, 1.0, 0.75, 1.45));
    mLeaf.add(cyl(0.65, 1.15, 6.2, 8), M(583, WY + 5.6, 614.2, 0.35, 0, 0)); mLeaf.add(sph(1.15, 8), M(583, WY + 8.6, 615.8));
    box(mRed, 5.2, 5.2, 5.2, 580, Y + 2.6, 530); box(mBlue, 5.2, 5.2, 5.2, 586, Y + 2.6, 528); box(mGold, 5.2, 5.2, 5.2, 583, Y + 7.8, 529);
    mRed.add(new T.TorusGeometry(9.5, 0.55, 6, 18, Math.PI), M(600, Y + 1.0, 530));

    /* ================= PARK 4: ANIMAL KINGDOM (tolX=272, tolZ=628, Pandora x=192, Everest x=344) ================= */
    const tolX = 272, tolZ = 628;
    const tolTrunk = new T.Mesh(cyl(4.4, 8.8, 20.5, 12), barkLifeMat); tolTrunk.position.set(tolX, Y + 10.2, tolZ); group.add(tolTrunk);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      mBark.add(cyl(1.2, 2.7, 10.5, 6), M(tolX + Math.cos(a) * 7.6, Y + 4.0, tolZ + Math.sin(a) * 7.6, Math.sin(a) * 0.45, 0, -Math.cos(a) * 0.45));
    }
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      mBark.add(cyl(0.95, 1.85, 12.0, 6), M(tolX + Math.cos(a) * 7.5, Y + 21.5, tolZ + Math.sin(a) * 7.5, -Math.sin(a) * 0.65, 0, Math.cos(a) * 0.65));
    }
    for (let i = 0; i < 28; i++) {
      const tier = i < 14 ? 0 : i < 23 ? 1 : 2, a = i * 2.39996;
      const rad = tier === 0 ? 13.5 + (i % 3) * 2.4 : tier === 1 ? 8.2 + (i % 2) * 2.0 : 3.2;
      const cy = tier === 0 ? 25.5 + (i % 3) * 1.8 : tier === 1 ? 32.5 + (i % 2) * 2.0 : 38.5;
      const cr = tier === 0 ? 5.6 + (i % 3) * 1.1 : tier === 1 ? 5.2 + (i % 2) * 0.9 : 4.8;
      const lm = i % 3 === 0 ? mLeafD : i % 3 === 1 ? mLeaf : mLeafS;
      lm.add(new T.IcosahedronGeometry(cr, 1), M(tolX + Math.cos(a) * rad, Y + cy, tolZ + Math.sin(a) * rad, 0, a, 0, 1.25, 0.72, 1.25));
    }
    for (const [gx, gz] of [[248, 638], [243, 642], [296, 640]]) {
      box(mGold, 1.1, 1.0, 2.1, gx, Y + 2.2, gz);
      mGold.add(cyl(0.20, 0.30, 3.2, 6), M(gx, Y + 4.0, gz + 0.85, 0.15, 0, 0));
      for (const [lx, lz] of [[-0.4, -0.7], [0.4, -0.7], [-0.4, 0.7], [0.4, 0.7]]) mGold.add(cyl(0.10, 0.12, 2.2, 5), M(gx + lx, Y + 1.1, gz + lz));
    }

    const panMountains = [
      { x: 192, y: 31, z: 630, r: 10.5, h: 17.5 },
      { x: 172, y: 25, z: 640, r: 7.8,  h: 13.5 },
      { x: 210, y: 26, z: 640, r: 7.5,  h: 13.0 }
    ];
    panMountains.forEach((pm, idx) => {
      mRock.add(new T.ConeGeometry(pm.r, pm.h, 7), M(pm.x, Y + pm.y, pm.z, Math.PI, idx * 0.8, 0));
      mRock.add(new T.ConeGeometry(pm.r * 0.62, pm.h * 0.75, 6), M(pm.x + pm.r * 0.5, Y + pm.y - 2.0, pm.z + 1.8, Math.PI, idx, 0.12));
      for (let k = 0; k < 4; k++) {
        const ka = (k / 4) * Math.PI * 2;
        (k % 2 === 0 ? mLeaf : mLeafS).add(new T.IcosahedronGeometry(pm.r * 0.48, 1), M(pm.x + Math.cos(ka) * pm.r * 0.45, Y + pm.y + pm.h * 0.46, pm.z + Math.sin(ka) * pm.r * 0.45, 0, ka, 0, 1.2, 0.7, 1.2));
      }
      mCyan.add(cyl(0.26, 0.20, pm.y + 4, 6), M(pm.x + pm.r * 0.45, Y + pm.y * 0.5, pm.z + 2.5, 0.14, 0, -0.16));
      mPurple.add(cyl(0.22, 0.18, pm.y + 2, 6), M(pm.x - pm.r * 0.4, Y + pm.y * 0.5, pm.z - 2.0, -0.12, 0, 0.14));
      const wf = new T.Mesh(new T.PlaneGeometry(3.8, pm.y + 3), waterFallMat);
      wf.position.set(pm.x, Y + pm.y * 0.5, pm.z + pm.r * 0.35); group.add(wf);
    });
    for (let i = 0; i < 8; i++) {
      const fx = 174 + i * 5.2, fz = 648 + (i % 2) * 3.5;
      mBark.add(cyl(0.18, 0.32, 3.6, 5), M(fx, Y + 1.8, fz));
      (i % 2 === 0 ? mCyan : mPurple).add(new T.ConeGeometry(1.8, 1.2, 7), M(fx, Y + 4.1, fz, Math.PI, 0, 0));
    }
    const banshees = [];
    for (let i = 0; i < 3; i++) {
      const bg = new T.Group();
      const bBody = new T.Mesh(cyl(0.18, 0.28, 2.4, 6), pandoraGlowMat); bBody.rotation.x = Math.PI / 2; bg.add(bBody);
      const wingL = new T.Mesh(new T.BoxGeometry(3.2, 0.08, 1.1), pandoraGlowMat); wingL.position.x = -1.6; bg.add(wingL);
      const wingR = new T.Mesh(new T.BoxGeometry(3.2, 0.08, 1.1), pandoraGlowMat); wingR.position.x = 1.6; bg.add(wingR);
      group.add(bg); banshees.push({ grp: bg, wingL, wingR, phase: (i / 3) * Math.PI * 2 });
    }

    const evX = 344, evZ = 638;
    mRock.add(new T.ConeGeometry(20.5, 36.0, 8), M(evX, Y + 18.0, evZ, 0, 0.4, 0));
    mRock.add(new T.ConeGeometry(14.5, 28.0, 7), M(evX - 12.0, Y + 14.0, evZ + 5.2));
    mRock.add(new T.ConeGeometry(13.0, 25.0, 7), M(evX + 11.5, Y + 12.5, evZ + 4.5));
    mSnow.add(new T.ConeGeometry(10.8, 25.0, 7), M(evX + 1.2, Y + 38.0, evZ - 1.0));
    mSnow.add(new T.ConeGeometry(6.8, 14.5, 6), M(evX - 12.0, Y + 23.0, evZ + 5.2));
    box(mDark, 4.2, 4.5, 3.2, evX + 4.5, Y + 18.5, evZ + 11.2);
    const evCars = [];
    for (let c = 0; c < 3; c++) {
      const cg = new T.Group();
      const body = new T.Mesh(new T.BoxGeometry(1.75, 1.25, 3.6), c === 0 ? redMat : (c === 1 ? goldMat : tealDecoMat));
      body.position.y = 0.72; cg.add(body);
      if (c === 0) {
        const stack = new T.Mesh(cyl(0.24, 0.18, 0.95, 6), darkMat); stack.position.set(0, 1.65, 1.2); cg.add(stack);
      }
      group.add(cg); evCars.push(cg);
    }
    const evState = { running: true, ang: 0 };
    const everestRide = {
      id: 'everest_ride', name: '珠峰探险过山车（动物王国）', land: 'Animal Kingdom',
      boardPos: { x: evX, y: Y, z: evZ + 22.0 }, exitPos: { x: evX - 6, y: Y, z: evZ + 24.0, yaw: 0 },
      start: () => { evState.running = true; }, stop: () => { evState.running = false; },
      isRunning: () => evState.running,
      getCameraPose: (thirdPerson) => {
        const p = evCars[0].position, yaw = evCars[0].rotation.y;
        const fx = Math.sin(yaw), fz = Math.cos(yaw);
        if (thirdPerson) return { px: p.x - fx * 9.5, py: p.y + 4.2, pz: p.z - fz * 9.5, tx: p.x + fx * 6, ty: p.y + 1.0, tz: p.z + fz * 6 };
        return { px: p.x + fx * 0.8, py: p.y + 2.05, pz: p.z + fz * 0.8, tx: p.x + fx * 18, ty: p.y + 1.2, tz: p.z + fz * 18 };
      }
    };

    /* ================= DISNEY SKYLINER (x=620, z=288..522) ================= */
    for (const tz of [288, 346, 404, 462, 520]) {
      mWhite.add(cyl(0.65, 0.95, 15.5, 8), M(epX, Y + 7.75, tz));
      box(mWhite, 6.2, 0.55, 0.75, epX, Y + 15.6, tz);
    }
    box(mDark, 0.14, 0.14, 236, epX - 2.5, Y + 15.4, 404);
    box(mDark, 0.14, 0.14, 236, epX + 2.5, Y + 15.4, 404);
    const skylinerCabs = [];
    const skyMats = [redMat, blueMat, goldMat, leafMat, redMat, blueMat];
    for (let i = 0; i < 6; i++) {
      const cg = new T.Group();
      const cab = new T.Mesh(new T.BoxGeometry(1.9, 1.9, 2.4), skyMats[i]); cab.position.y = -2.2; cg.add(cab);
      const hanger = new T.Mesh(cyl(0.06, 0.06, 1.6, 5), darkMat); hanger.position.y = -0.8; cg.add(hanger);
      group.add(cg); skylinerCabs.push({ grp: cg, off: i / 6 });
    }
    const skyState = { running: true, t: 0 };
    const skylinerRide = {
      id: 'skyliner_ride', name: '迪士尼高空缆车（EPCOT ↔ 好莱坞影城）', land: 'Orlando Resort',
      boardPos: { x: epX, y: Y, z: 288 }, exitPos: { x: epX, y: Y, z: 274, yaw: 0 },
      start: () => { skyState.running = true; }, stop: () => { skyState.running = false; },
      isRunning: () => skyState.running,
      getCameraPose: (thirdPerson) => {
        const c = skylinerCabs[0].grp.position;
        if (thirdPerson) return { px: c.x - 10.5, py: c.y + 2.5, pz: c.z + 10.5, tx: c.x, ty: c.y - 1.5, tz: c.z };
        const goingSouth = (skyState.t % 1) < 0.5;
        return { px: c.x, py: c.y - 1.8, pz: c.z, tx: c.x + (goingSouth ? 4 : 0), ty: c.y - 3.0, tz: c.z + (goingSouth ? 36 : -36) };
      }
    };

    // Resort Campus Parkland Trees
    let oSeed = 19711001;
    const orng = () => { oSeed = (oSeed * 1664525 + 1013904223) >>> 0; return oSeed / 4294967296; };
    const zi = (x, z) => (x | 0) + (z | 0) * world.W;
    let oPlaced = 0;
    for (let att = 0; att < 700 && oPlaced < 120; att++) {
      const tx = 60 + orng() * (world.W - 120), tz = 60 + orng() * (world.D - 120);
      if (tx < 508 && tz < 516) continue;
      const cell = zi(tx, tz);
      if (world.occ[cell] || world.hm[cell] < Y) continue;
      if (Math.hypot(tx - epX, tz - epZ) < 28 || Math.hypot(tx - ttX, tz - ttZ) < 26) continue;
      if (Math.hypot(tx - tolX, tz - tolZ) < 24 || Math.hypot(tx - evX, tz - evZ) < 24 || Math.hypot(tx - 192, tz - 634) < 26) continue;
      const h = 4.6 + orng() * 2.8, r = 2.2 + orng() * 1.1;
      mBark.add(cyl(0.28, 0.48, h, 5), M(tx, Y + h / 2, tz));
      (orng() < 0.34 ? mLeaf : orng() < 0.68 ? mLeafD : mLeafS).add(new T.IcosahedronGeometry(r, 1), M(tx, Y + h + r * 0.65, tz));
      oPlaced++;
    }

    mWhite.mesh(whiteMat); mCream.mesh(creamMat); mTeal.mesh(tealDecoMat); mGold.mesh(goldMat);
    mRed.mesh(redMat); mBlue.mesh(blueMat); mDark.mesh(darkMat); mRock.mesh(rockMat);
    mSnow.mesh(snowMat); mLeaf.mesh(leafMat); mLeafD.mesh(leafDarkMat); mLeafS.mesh(leafSunMat);
    mBark.mesh(barkLifeMat); mGlow.mesh(warmGlowMat); mCyan.mesh(pandoraGlowMat); mPurple.mesh(pandoraPurpleMat);

    function update(dt, elapsed, nightF) {
      seLeds.rotation.y = elapsed * 0.08;
      const nf = nightF || 0;
      epcotLaserGrp.rotation.y = elapsed * 0.35;
      epLaserMat.opacity = nf * (0.36 + Math.sin(elapsed * 2.4) * 0.12);
      const bio = 0.72 + Math.sin(elapsed * 2.2) * 0.28;
      pandoraGlowMat.color.setRGB(0.13 * bio, 0.83 * bio, 0.93 * bio);
      pandoraPurpleMat.color.setRGB(0.75 * bio, 0.52 * bio, 0.99 * bio);

      const fbA = elapsed * 0.24;
      const fbx = epX + Math.cos(fbA) * 18, fbz = lagZ + Math.sin(fbA) * 13;
      const fbnx = epX + Math.cos(fbA + 0.05) * 18, fbnz = lagZ + Math.sin(fbA + 0.05) * 13;
      friendBoat.position.set(fbx, WY + 0.05, fbz); friendBoat.rotation.y = Math.atan2(fbnx - fbx, fbnz - fbz);

      const dropCyc = (elapsed * 0.22) % 1.0;
      const dropping = dropCyc >= 0.80;
      const dropY = dropCyc < 0.65 ? (dropCyc / 0.65) : dropCyc < 0.80 ? 1.0 : Math.max(0, 1.0 - ((dropCyc - 0.80) / 0.20) * ((dropCyc - 0.80) / 0.20));
      ttElevator.position.y = Y + 8.5 + dropY * 26.5;
      elCab.material.color.setHex(dropping && Math.sin(elapsed * 45) > 0 ? 0xe0e7ff : 0xfef08a);

      banshees.forEach((b) => {
        const a = elapsed * 0.42 + b.phase;
        const bx = 192 + Math.cos(a) * 26, bz = 634 + Math.sin(a) * 20;
        const bnx = 192 + Math.cos(a + 0.06) * 26, bnz = 634 + Math.sin(a + 0.06) * 20;
        b.grp.position.set(bx, Y + 32 + Math.sin(a * 2) * 3.5, bz);
        b.grp.rotation.y = Math.atan2(bnx - bx, bnz - bz);
        const flap = Math.sin(elapsed * 4.5 + b.phase) * 0.42;
        b.wingL.rotation.z = flap; b.wingR.rotation.z = -flap;
      });

      if (evState.running) evState.ang += dt * 0.62;
      evCars.forEach((cg, idx) => {
        const a = evState.ang - idx * 0.21;
        const ex = evX + Math.cos(a) * 19.5, ez = evZ + Math.sin(a) * 19.5;
        const enx = evX + Math.cos(a + 0.06) * 19.5, enz = evZ + Math.sin(a + 0.06) * 19.5;
        const ey = Y + 10.5 + Math.sin(a * 2) * 6.8;
        cg.position.set(ex, ey, ez);
        cg.rotation.y = Math.atan2(enx - ex, enz - ez);
        cg.rotation.z = Math.cos(a * 2) * 0.22;
      });

      if (skyState.running) skyState.t += dt * 0.032;
      skylinerCabs.forEach((sc) => {
        const u = (skyState.t + sc.off) % 1.0;
        const goingSouth = u < 0.5;
        const leg = goingSouth ? u * 2 : (1 - u) * 2;
        sc.grp.position.set(goingSouth ? epX - 2.5 : epX + 2.5, Y + 15.4, 288 + leg * 232);
      });
    }

    return { update, skylinerRide, everestRide };
  }

  root.TPOrlando = { build };
})(window);
