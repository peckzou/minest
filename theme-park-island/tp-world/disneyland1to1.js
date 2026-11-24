/* Minest My World · 1:1 Disneyland Authentic Lands, Streetscapes & Rideable Dark Rides (`disneyland1to1.js`)
 * Adds missing real-life Anaheim Disneyland icons at 1:1 scale with static `Merger` batching (~14 draw calls total):
 *  1. Town Square Civic Buildings: City Hall, Fire Engine House No. 101 (with Walt Disney's eternal 2nd-floor apartment lamp!),
 *     Main Street Opera House, Town Square Bank Conservatory, Victorian Bandstand Gazebo & Flagpole.
 *  2. Center Street Flower Market, Jolly Holiday Bakery Cafe & Plaza Inn Victorian Dining Pavilion.
 *  3. Fantasyland Dark-Ride Village & Storybook Land: Peter Pan's Flight (Big Ben & Flying Galleon), Mr. Toad's Toad Hall,
 *     Snow White's Cottage, Pinocchio's Village Haus, Sword in the Stone, Alice in Wonderland Vine Track & Monstro the Whale!
 *  4. Mickey's Toontown: Toontown Underpass, Hillside "TOONTOWN" Letters, El Capitoon Theater (Runaway Railway),
 *     City Hall Fountain, Mickey's House, Minnie's House, Donald's Boat "Miss Daisy" & Chip 'n' Dale's GADGETcoaster!
 *  5. Frontierland Boardwalk (Log Fort Gate, Golden Horseshoe Saloon, Pioneer Mercantile) & Bayou Country (Tiana's Bayou Adventure
 *     Chickapin Hill, Tiara Water Tower & 50-ft Splashdown Logs!).
 *  6. New Orleans Square French Quarter + RIDEABLE "Pirates of the Caribbean" Indoor Boat Ride (Blue Bayou Fireflies,
 *     Dead Man's Cove, Wicked Wench Galleon vs. Spanish Fortress Live Cannon Battle & Jack Sparrow's Treasure Mountain!).
 *  7. Adventureland Icons: Enchanted Tiki Room, Bazaar & Indiana Jones Adventure: Temple of the Forbidden Eye!
 *  8. Tomorrowland: Buzz Lightyear, Star Tours, Autopia Scenic Highway + RIDEABLE Indoor "Space Mountain" Star-Coaster Dome! */
(function (root) {
  'use strict';

  function build(scene, world, group) {
    const T = root.THREE;
    const Y = world.PARK_Y;
    const WY = world.WATER_Y;
    const CX = world.CX || 272.5;

    function cvs(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
    function finTex(c, rep) {
      const tx = new T.CanvasTexture(c);
      if (T.sRGBEncoding !== undefined) tx.encoding = T.sRGBEncoding;
      if (rep) tx.wrapS = tx.wrapT = T.RepeatWrapping;
      return tx;
    }

    function Merger() {
      const parts = [];
      this.add = (geo, mat4) => {
        const g = geo.index ? geo.toNonIndexed() : geo.clone();
        if (mat4) g.applyMatrix4(mat4);
        parts.push(g);
      };
      this.mesh = (mat, shadow) => {
        if (!parts.length) return null;
        let total = 0;
        for (const g of parts) total += g.attributes.position.count;
        const pos = new Float32Array(total * 3), norm = new Float32Array(total * 3), uv = new Float32Array(total * 2);
        let o = 0;
        for (const g of parts) {
          const cnt = g.attributes.position.count;
          pos.set(g.attributes.position.array, o * 3);
          norm.set(g.attributes.normal.array, o * 3);
          if (g.attributes.uv) uv.set(g.attributes.uv.array, o * 2);
          o += cnt; g.dispose();
        }
        const bg = new T.BufferGeometry();
        bg.setAttribute('position', new T.BufferAttribute(pos, 3));
        bg.setAttribute('normal', new T.BufferAttribute(norm, 3));
        bg.setAttribute('uv', new T.BufferAttribute(uv, 2));
        bg.computeBoundingSphere();
        const m = new T.Mesh(bg, mat);
        m.castShadow = !!shadow;
        m.receiveShadow = true;
        group.add(m);
        return m;
      };
    }

    const _q = new T.Quaternion(), _e = new T.Euler(), _p = new T.Vector3(), _s = new T.Vector3();
    const M = (x, y, z, rx, ry, rz, sx, sy, sz) => {
      _p.set(x || 0, y || 0, z || 0);
      _e.set(rx || 0, ry || 0, rz || 0);
      _q.setFromEuler(_e);
      _s.set(sx == null ? 1 : sx, sy == null ? 1 : sy, sz == null ? 1 : sz);
      return new T.Matrix4().compose(_p, _q, _s);
    };
    const unitBox = new T.BoxGeometry(1, 1, 1);
    const box = (mr, w, h, d, x, y, z, rx, ry, rz) => mr.add(unitBox, M(x, y, z, rx, ry, rz, w, h, d));
    const cyl = (rt, rb, h, seg) => new T.CylinderGeometry(rt, rb, h, seg || 10);
    const sph = (r, seg) => new T.SphereGeometry(r, seg || 8, Math.max(6, (seg || 8) - 2));

    function makeSignTex(title, sub, bg, border, accent) {
      const c = cvs(512, 112), x = c.getContext('2d');
      x.fillStyle = bg || '#172038'; x.fillRect(0, 0, 512, 112);
      x.strokeStyle = border || '#e2b13c'; x.lineWidth = 6; x.strokeRect(5, 5, 502, 102);
      x.fillStyle = '#fef3c7'; x.font = '800 27px "PingFang SC","Songti SC",Georgia,serif';
      x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(title, 256, 42);
      x.fillStyle = accent || '#fde047'; x.font = '700 15px Georgia,serif'; x.fillText(sub, 256, 80);
      return finTex(c, false);
    }
    function addSign(cx, cy, cz, w, title, sub, bg, border, rotY, accent) {
      const tex = makeSignTex(title, sub, bg, border, accent);
      const m = new T.Mesh(new T.PlaneGeometry(w, w * 0.22), new T.MeshLambertMaterial({ map: tex, emissiveMap: tex, emissive: 0xffe8b0, emissiveIntensity: 0.45, side: T.DoubleSide }));
      m.position.set(cx, cy, cz); if (rotY) m.rotation.y = rotY;
      group.add(m);
    }

    function makeBrickTex(hex) {
      const c = cvs(128, 128), x = c.getContext('2d');
      x.fillStyle = hex; x.fillRect(0, 0, 128, 128);
      x.strokeStyle = 'rgba(235,225,212,0.32)'; x.lineWidth = 1.4;
      for (let r = 0; r < 16; r++) {
        const y = r * 8, off = (r % 2) * 8;
        x.beginPath(); x.moveTo(0, y); x.lineTo(128, y); x.stroke();
        for (let k = 0; k < 8; k++) { x.beginPath(); x.moveTo(k * 16 + off, y); x.lineTo(k * 16 + off, y + 8); x.stroke(); }
      }
      return finTex(c, true);
    }

    function makeLaceIronTex() {
      const c = cvs(128, 64), x = c.getContext('2d');
      x.fillStyle = '#181c24'; x.fillRect(0, 0, 128, 64);
      x.strokeStyle = '#475569'; x.lineWidth = 2.5;
      x.strokeRect(2, 2, 124, 60);
      for (let i = 0; i < 8; i++) {
        x.beginPath(); x.arc(i * 16 + 8, 32, 11, 0, Math.PI * 2); x.stroke();
      }
      return finTex(c, true);
    }

    // Shared Batched Materials
    const brickMat = new T.MeshLambertMaterial({ map: makeBrickTex('#9e3e34'), emissive: 0x140706 });
    const whiteMat = new T.MeshLambertMaterial({ color: 0xf6f3ec, emissive: 0x161512 });
    const creamMat = new T.MeshLambertMaterial({ color: 0xeadcc7, emissive: 0x16120c });
    const butterMat = new T.MeshLambertMaterial({ color: 0xf8e3a3, emissive: 0x1a1506 });
    const nolaMintMat = new T.MeshLambertMaterial({ color: 0xbfd8c8, emissive: 0x0c1610 });
    const nolaOchreMat = new T.MeshLambertMaterial({ color: 0xe2b980, emissive: 0x181106 });
    const roseMat = new T.MeshLambertMaterial({ color: 0xebbac5, emissive: 0x1a0d12 });
    const toonYellowMat = new T.MeshLambertMaterial({ color: 0xfde047, emissive: 0x1f1904 });
    const toonBlueMat = new T.MeshLambertMaterial({ color: 0x38bdf8, emissive: 0x061926 });
    const crimsonMat = new T.MeshLambertMaterial({ color: 0xa81828, emissive: 0x180406 });
    const slateMat = new T.MeshLambertMaterial({ color: 0x2f3b4c, emissive: 0x080c12 });
    const woodMat = new T.MeshLambertMaterial({ color: 0x764c29, emissive: 0x0f0804 });
    const thatchMat = new T.MeshLambertMaterial({ color: 0xb08448, emissive: 0x160f06 });
    const templeStoneMat = new T.MeshLambertMaterial({ color: 0x6f735c, flatShading: true, emissive: 0x0b0d08 });
    const bayouGreenMat = new T.MeshLambertMaterial({ color: 0x2b7238, flatShading: true, emissive: 0x051307 });
    const toonHillMat = new T.MeshLambertMaterial({ color: 0x4ade80, emissive: 0x082210 });
    const goldMat = new T.MeshPhongMaterial({ color: 0xe5b53a, specular: 0xfef08a, shininess: 72, emissive: 0x241904 });
    const ironMat = new T.MeshPhongMaterial({ map: makeLaceIronTex(), color: 0x222730, specular: 0x94a3b8, shininess: 44 });
    const whaleMat = new T.MeshPhongMaterial({ color: 0x334e6e, specular: 0x93c5fd, shininess: 50, emissive: 0x08101c });
    const warmGlowMat = new T.MeshBasicMaterial({ color: 0xfff0b8 });
    const cyanGlowMat = new T.MeshBasicMaterial({ color: 0x38bdf8 });
    const waterSprayMat = new T.MeshPhongMaterial({ color: 0xbae6fd, specular: 0xffffff, shininess: 95, transparent: true, opacity: 0.72, side: T.DoubleSide });

    const mBrick = new Merger(), mWhite = new Merger(), mCream = new Merger(), mButter = new Merger();
    const mMint = new Merger(), mOchre = new Merger(), mRose = new Merger(), mToonY = new Merger();
    const mToonB = new Merger(), mRed = new Merger(), mSlate = new Merger(), mWood = new Merger();
    const mThatch = new Merger(), mStone = new Merger(), mLeaf = new Merger(), mToonHill = new Merger(), mGold = new Merger();
    const mIron = new Merger(), mWhale = new Merger(), mGlow = new Merger(), mCyan = new Merger();

    /* ============================================================================
     * 1. TOWN SQUARE CIVIC BUILDINGS (z = 408..452 around CX = 272.5)
     * ============================================================================ */
    // 1A. CITY HALL (West Town Square: x=230, z=436 — Red-Brick & Limestone Civic Hall + Tall Bell Cupola!)
    box(mBrick, 11.5, 9.8, 16.5, 230, Y + 4.9, 436);
    box(mWhite, 12.2, 0.55, 17.2, 230, Y + 9.95, 436);
    box(mSlate, 10.6, 2.8, 15.6, 230, Y + 11.5, 436);
    // Colonnaded Civic Portico facing Town Square (+X)
    box(mWhite, 3.6, 0.45, 9.6, 237.2, Y + 0.22, 436);
    for (const pz of [-3.8, -1.3, 1.3, 3.8]) mWhite.add(cyl(0.30, 0.36, 7.6, 10), M(238.2, Y + 4.2, 436 + pz));
    box(mWhite, 3.8, 0.65, 9.8, 237.2, Y + 8.2, 436);
    mWhite.add(new T.ConeGeometry(4.8, 2.4, 3), M(238.2, Y + 9.7, 436, 0, Math.PI / 2, 0));
    // Soaring Octagonal Bell Tower & Golden Dome!
    mWhite.add(cyl(2.2, 2.4, 5.2, 8), M(231.5, Y + 15.2, 436));
    mWhite.add(cyl(1.6, 1.8, 3.6, 8), M(231.5, Y + 19.4, 436));
    mGold.add(sph(1.75, 12), M(231.5, Y + 21.6, 436));
    mGold.add(cyl(0.08, 0.14, 2.8, 6), M(231.5, Y + 24.0, 436));
    addSign(239.2, Y + 8.2, 436, 7.2, '市政厅 · CITY HALL', 'DISNEYLAND GUEST RELATIONS · EST. 1955', '#172038', '#e5b53a', Math.PI / 2);

    // 1B. DISNEYLAND FIRE ENGINE HOUSE NO. 101 + WALT DISNEY'S ETERNAL APARTMENT LAMP! (x=231, z=415)
    box(mBrick, 10.2, 9.4, 11.6, 231, Y + 4.7, 415);
    box(mWhite, 10.8, 0.50, 12.2, 231, Y + 9.55, 415);
    box(mSlate, 9.6, 2.2, 11.0, 231, Y + 10.8, 415);
    // Twin Crimson Firehouse Carriage Doors + Gleaming Brass Hose Tower
    for (const dz of [-2.6, 2.6]) {
      box(mRed, 0.4, 4.2, 3.4, 236.2, Y + 2.1, 415 + dz);
      box(mWhite, 0.45, 0.35, 3.8, 236.2, Y + 4.35, 415 + dz);
    }
    // WALT'S FAMOUS SECOND-FLOOR WINDOW & ETERNALLY LIT TIFFANY LAMP (Glowing Warm Tribute to Walt!)
    box(mWhite, 0.85, 2.6, 2.2, 236.3, Y + 6.9, 415);
    mGlow.add(cyl(0.28, 0.42, 0.42, 8), M(236.65, Y + 6.75, 415)); // The Eternal Lamp shade!
    mGold.add(cyl(0.06, 0.14, 0.45, 6), M(236.65, Y + 6.35, 415));
    const waltLampLight = new T.PointLight(0xffd580, 1.35, 14, 1.5);
    waltLampLight.position.set(237.4, Y + 6.8, 415); group.add(waltLampLight);
    addSign(236.4, Y + 5.1, 415, 6.2, '101 消防局 · FIRE DEPT.', "WALT DISNEY'S APARTMENT LAMP ABOVE", '#7f1d1d', '#fde047', Math.PI / 2);

    // 1C. MAIN STREET OPERA HOUSE (East Town Square: x=314, z=436) & TOWN SQUARE CONSERVATORY BANK (x=313, z=415)
    box(mCream, 12.0, 10.4, 17.5, 314, Y + 5.2, 436);
    box(mBrick, 12.3, 4.2, 17.8, 314, Y + 2.1, 436);
    box(mWhite, 12.8, 0.6, 18.2, 314, Y + 10.6, 436);
    box(mSlate, 11.2, 3.0, 16.6, 314, Y + 12.3, 436);
    for (const pz of [-5.2, -1.8, 1.8, 5.2]) mWhite.add(cyl(0.34, 0.40, 8.2, 10), M(306.8, Y + 4.1, 436 + pz));
    box(mGold, 2.6, 0.85, 11.2, 306.4, Y + 4.8, 436);
    addSign(305.0, Y + 5.6, 436, 8.2, '大歌剧院 · OPERA HOUSE', 'GREAT MOMENTS WITH MR. LINCOLN', '#172554', '#eab308', -Math.PI / 2);

    box(mButter, 10.6, 9.6, 12.0, 313, Y + 4.8, 415);
    box(mWhite, 11.2, 0.5, 12.6, 313, Y + 9.75, 415);
    mSlate.add(cyl(2.8, 3.0, 3.6, 10), M(307.5, Y + 11.2, 410));
    mGold.add(new T.ConeGeometry(3.1, 3.4, 10), M(307.5, Y + 14.6, 410));

    // 1D. Town Square Victorian Bandstand Gazebo (x=272.5, z=443) & Ceremonial Flagpole (x=272.5, z=424)
    mWhite.add(cyl(3.8, 4.2, 0.65, 8), M(CX, Y + 0.32, 443));
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      mWhite.add(cyl(0.12, 0.14, 3.6, 6), M(CX + Math.cos(a) * 3.3, Y + 2.4, 443 + Math.sin(a) * 3.3));
    }
    mRed.add(new T.ConeGeometry(4.3, 2.6, 8), M(CX, Y + 5.5, 443));
    mGold.add(sph(0.28, 6), M(CX, Y + 6.95, 443));

    mWhite.add(cyl(1.6, 2.0, 0.85, 14), M(CX, Y + 0.42, 424));
    mGold.add(cyl(0.11, 0.16, 14.5, 8), M(CX, Y + 7.9, 424));
    mGold.add(sph(0.30, 8), M(CX, Y + 15.3, 424));
    box(mRed, 2.6, 1.5, 0.08, CX + 1.35, Y + 14.0, 424);

    /* ============================================================================
     * 2. CENTER STREET FLOWER MARKET, JOLLY HOLIDAY BAKERY & PLAZA INN!
     * ============================================================================ */
    // East Center Street Victorian Flower Market (x=296..312, z=350)
    mIron.add(cyl(3.6, 3.8, 4.6, 10), M(308, Y + 2.3, 350));
    mCyan.add(sph(3.6, 10), M(308, Y + 4.6, 350));
    for (const [fx, fz] of [[297, 347.5], [297, 352.5], [302, 347.5], [302, 352.5]]) {
      box(mWood, 1.8, 0.9, 1.2, fx, Y + 0.65, fz);
      mLeaf.add(sph(0.68, 6), M(fx, Y + 1.35, fz));
      mRose.add(sph(0.38, 5), M(fx - 0.35, Y + 1.65, fz + 0.2));
      mToonY.add(sph(0.36, 5), M(fx + 0.35, Y + 1.68, fz - 0.2));
      mRed.add(new T.ConeGeometry(1.45, 0.75, 8), M(fx, Y + 2.85, fz));
      mWhite.add(cyl(0.05, 0.05, 2.2, 5), M(fx, Y + 1.6, fz));
    }
    // West Center Street Brick Courtyard Fountain (x=240, z=350)
    mBrick.add(cyl(2.4, 2.7, 0.7, 12), M(240, Y + 0.35, 350));
    mWhite.add(cyl(0.45, 0.6, 1.8, 8), M(240, Y + 1.4, 350));
    mGlow.add(sph(0.32, 6), M(240, Y + 2.5, 350));

    // Jolly Holiday Bakery Cafe (SW Hub Corner: x=241, z=280 — Buttercup-Yellow Gingerbread Pavilion!)
    box(mButter, 11.2, 7.6, 11.2, 241, Y + 3.8, 280);
    box(mWhite, 12.0, 0.5, 12.0, 241, Y + 7.75, 280);
    mRed.add(new T.ConeGeometry(8.4, 4.6, 4), M(241, Y + 10.3, 280, 0, Math.PI / 4, 0));
    mGold.add(cyl(0.10, 0.14, 2.6, 6), M(241, Y + 13.5, 280));
    for (const [ux, uz] of [[248.5, 275], [248.5, 280], [248.5, 285]]) {
      mToonY.add(new T.ConeGeometry(1.5, 0.8, 8), M(ux, Y + 2.5, uz));
      mWhite.add(cyl(0.06, 0.06, 2.4, 5), M(ux, Y + 1.2, uz));
    }
    addSign(247.0, Y + 5.6, 280, 6.8, '假日烘焙坊 · JOLLY HOLIDAY', 'MARY POPPINS BAKERY & CAFE', '#78350f', '#fde047', Math.PI / 4);

    // Plaza Inn Victorian Mansion (SE Hub Corner: x=304, z=280 — Rose-and-Cream Veranda & Crystal Dome!)
    box(mRose, 12.4, 8.2, 12.4, 304, Y + 4.1, 280);
    box(mWhite, 13.2, 0.55, 13.2, 304, Y + 8.35, 280);
    mSlate.add(cyl(5.2, 5.6, 2.8, 12), M(304, Y + 9.9, 280));
    mWhite.add(sph(3.4, 12), M(304, Y + 11.8, 280));
    addSign(297.6, Y + 5.8, 280, 6.8, '广场维多利亚餐厅 · PLAZA INN', 'CLASSIC VICTORIAN DINING PAVILION', '#831843', '#fde047', -Math.PI / 4);

    /* ============================================================================
     * 3. FANTASYLAND DARK-RIDE COURTYARD, ALICE VINE TRACK & MONSTRO THE WHALE!
     * ============================================================================ */
    // 3A. Peter Pan's Flight — London Big Ben Clock Tower & Flying Pirate Galleon (x=296, z=172)
    box(mCream, 10.5, 7.8, 12.0, 297, Y + 3.9, 172);
    mSlate.add(new T.ConeGeometry(8.2, 4.8, 4), M(297, Y + 10.2, 172, 0, Math.PI / 4, 0));
    // Iconic London Big Ben Clock Tower rising at the courtyard corner!
    box(mCream, 3.6, 15.6, 3.6, 291.5, Y + 7.8, 177.2);
    box(mGold, 4.0, 0.45, 4.0, 291.5, Y + 13.2, 177.2);
    mGlow.add(cyl(1.15, 1.15, 0.2, 16), M(289.6, Y + 13.2, 177.2, 0, 0, Math.PI / 2)); // Illuminated Big Ben dial!
    mSlate.add(new T.ConeGeometry(2.7, 5.8, 4), M(291.5, Y + 18.5, 177.2, 0, Math.PI / 4, 0));
    mGold.add(cyl(0.08, 0.12, 2.2, 6), M(291.5, Y + 22.2, 177.2));
    // Miniature Golden Flying Pirate Ship hovering beneath Peter Pan's arch!
    const panShipGrp = new T.Group(); panShipGrp.position.set(289.5, Y + 5.8, 171.5);
    panShipGrp.add(new T.Mesh(new T.BoxGeometry(1.1, 0.65, 2.8), goldMat));
    const panSail = new T.Mesh(new T.PlaneGeometry(1.3, 1.5), new T.MeshBasicMaterial({ color: 0xfef3c7, side: T.DoubleSide }));
    panSail.position.set(0, 1.15, 0); panShipGrp.add(panSail);
    group.add(panShipGrp);
    addSign(291.4, Y + 4.8, 171.5, 6.4, '小飞侠天空之旅 · PETER PAN', "NEVER LAND FLIGHT OVER LONDON", '#1e1b4b', '#fde047', -Math.PI / 2);

    // 3B. Mr. Toad's Wild Ride — English Tudor Brick "Toad Hall" Manor (x=297, z=154)
    box(mBrick, 10.5, 8.2, 12.2, 297, Y + 4.1, 154);
    for (let cz = -5.5; cz <= 5.5; cz += 2.2) box(mWhite, 1.0, 1.1, 1.1, 291.6, Y + 8.6, 154 + cz); // Tudor crenellations!
    for (const tz of [-4.2, 4.2]) {
      mBrick.add(cyl(1.2, 1.3, 10.4, 8), M(291.6, Y + 5.2, 154 + tz));
      mGold.add(sph(0.55, 6), M(291.6, Y + 10.8, 154 + tz));
    }
    addSign(291.4, Y + 5.2, 154, 6.4, '蟾蜍庄园 · MR. TOAD\'S WILD RIDE', 'TOAD HALL MOTORCAR MANIA', '#7f1d1d', '#eab308', -Math.PI / 2);

    // 3C. Snow White's Enchanted Wish (x=248, z=172) & Pinocchio's Village Haus (x=248, z=154)
    box(mCream, 10.6, 8.0, 12.0, 248, Y + 4.0, 172);
    for (const bz of [-4.5, 0, 4.5]) box(mWood, 0.3, 8.0, 0.35, 253.4, Y + 4.0, 172 + bz);
    mSlate.add(new T.ConeGeometry(8.2, 5.4, 4), M(248, Y + 10.7, 172, 0, Math.PI / 4, 0));
    mBrick.add(cyl(1.6, 1.8, 11.2, 10), M(253.2, Y + 5.6, 177.2));
    mSlate.add(new T.ConeGeometry(2.1, 4.2, 10), M(253.2, Y + 13.2, 177.2));
    addSign(253.6, Y + 4.8, 171.5, 6.4, '白雪公主奇幻愿望 · SNOW WHITE', "ENCHANTED WISH & QUEEN'S TOWER", '#311042', '#f472b6', Math.PI / 2);

    box(mButter, 10.6, 7.6, 12.0, 248, Y + 3.8, 154);
    for (const bz of [-4.5, 0, 4.5]) box(mWood, 0.3, 7.6, 0.35, 253.4, Y + 3.8, 154 + bz);
    mRed.add(new T.ConeGeometry(8.2, 5.0, 4), M(248, Y + 10.1, 154, 0, Math.PI / 4, 0));
    addSign(253.6, Y + 4.8, 154, 6.4, '匹诺曹奇遇记 · PINOCCHIO', 'DARING JOURNEY & VILLAGE HAUS', '#78350f', '#fde047', Math.PI / 2);

    // 3D. Sword in the Stone (Excalibur Anvil in front of King Arthur Carrousel: x=272.5, z=176.5)
    mStone.add(cyl(1.4, 1.8, 0.9, 10), M(CX, Y + 0.45, 176.5));
    box(mIron, 0.95, 0.65, 0.65, CX, Y + 1.2, 176.5);
    box(mWhite, 0.14, 1.35, 0.06, CX, Y + 2.0, 176.5, 0, 0, 0.08); // Gleaming Excalibur blade!
    box(mGold, 0.62, 0.12, 0.14, CX - 0.05, Y + 2.55, 176.5, 0, 0, 0.08);
    mGold.add(sph(0.12, 6), M(CX - 0.08, Y + 2.85, 176.5));

    // 3E. Alice in Wonderland Oversized Leaves, Giant Mushrooms & Winding Caterpillar Vine Ramp (x=306, z=138)
    for (const [mx, mz, mr, mh] of [[304, 141, 2.2, 4.4], [309, 136, 2.8, 5.6], [302, 134, 1.8, 3.5]]) {
      mCream.add(cyl(mr * 0.28, mr * 0.38, mh, 8), M(mx, Y + mh / 2, mz));
      mRose.add(sph(mr, 10), M(mx, Y + mh, mz, 0, 0, 0, 1.2, 0.55, 1.2));
    }
    for (let i = 0; i < 12; i++) {
      const a = (i / 11) * Math.PI * 1.35;
      const vx = 305 + Math.cos(a) * 5.8, vz = 138 + Math.sin(a) * 5.2, vy = Y + 1.2 + Math.sin((i / 11) * Math.PI) * 2.6;
      box(mLeaf, 1.4, 0.35, 1.8, vx, vy, vz, 0, -a, 0);
      mLeaf.add(cyl(0.14, 0.18, vy - Y, 5), M(vx, Y + (vy - Y) / 2, vz));
    }
    const aliceBug = new T.Group();
    for (let s = 0; s < 4; s++) {
      const seg = new T.Mesh(sph(0.48, 8), s % 2 === 0 ? toonYellowMat : roseMat);
      seg.position.set(0, 0.5, -s * 0.72); aliceBug.add(seg);
    }
    group.add(aliceBug);

    // 3F. Storybook Land Canal & Giant Sculpted MONSTRO THE WHALE (x=248, z=110 — Wide-Open Toothed Jaws!)
    // Monstro's colossal arched whale head emerging from the canal!
    mWhale.add(sph(5.2, 14), M(246, WY + 2.4, 109, 0, 0, 0, 1.15, 0.95, 1.45));
    box(mRed, 4.8, 2.8, 4.2, 246, WY + 1.8, 114.2); // Pink cavernous open mouth!
    mWhale.add(cyl(3.8, 4.6, 3.2, 12), M(246, WY + 3.8, 113.5, 0.48, 0, 0)); // Arched upper snout
    for (let tx = -1.8; tx <= 1.8; tx += 0.6) {
      mWhite.add(new T.ConeGeometry(0.18, 0.55, 5), M(246 + tx, WY + 3.0, 115.6, Math.PI, 0, 0));
      mWhite.add(new T.ConeGeometry(0.18, 0.50, 5), M(246 + tx, WY + 0.9, 115.6));
    }
    for (const sd of [-1, 1]) mWhite.add(sph(0.45, 8), M(246 + sd * 3.8, WY + 3.6, 111.8)); // Whale eyes!
    const whaleSpout = new T.Mesh(cyl(0.65, 0.12, 3.6, 8), waterSprayMat);
    whaleSpout.position.set(246, WY + 7.2, 108.5); group.add(whaleSpout);
    // Miniature Storybook Hillside Castle & Lighthouse behind Monstro (z=100)
    mLeaf.add(new T.ConeGeometry(7.5, 6.5, 10), M(248, Y + 3.2, 99));
    mGold.add(cyl(0.55, 0.65, 2.6, 8), M(248, Y + 7.2, 99));
    mGold.add(sph(0.85, 8), M(248, Y + 8.8, 99));
    mWhite.add(cyl(0.35, 0.55, 3.8, 8), M(236, Y + 1.9, 108)); // Storybook Lighthouse!
    mGlow.add(sph(0.38, 6), M(236, Y + 4.0, 108));

    /* ============================================================================
     * 4. MICKEY'S TOONTOWN (North Sector: x=224..288, z=28..96!)
     * ============================================================================ */
    // Colorful Toontown Railroad Underpass Arch (x=262, z=92) & Hillside "TOONTOWN" Hollywood-Style Sign!
    for (const sd of [-1, 1]) box(mRed, 2.8, 6.4, 4.8, 262 + sd * 6.8, Y + 3.2, 92);
    box(mToonB, 16.5, 2.2, 5.2, 262, Y + 6.8, 92);
    addSign(262, Y + 6.9, 94.8, 11.2, '米奇卡通城 · MICKEY\'S TOONTOWN', 'POPULATION: LAUGHS & CARTOONS!', '#be123c', '#fde047', 0);

    // Smooth Rounded Bright-Green 3D Cartoon Toon Hills + High-Contrast "TOONTOWN" Sign!
    for (const [hx, hz, rx, ry, rz] of [
      [234, 30, 17, 13.5, 9.5],
      [256, 28, 20, 16.5, 10.5],
      [278, 31, 16, 12.5, 9.0]
    ]) {
      mToonHill.add(new T.SphereGeometry(1, 18, 12), M(hx, Y + 1.0, hz, 0, 0, 0, rx, ry, rz));
    }
    addSign(256, Y + 15.6, 36.2, 18.5, 'T O O N T O W N', 'MICKEY · MINNIE · DONALD · GOOFY', '#1e1b4b', '#fbbf24', 0, '#fde047');

    // El Capitoon Theater — Mickey & Minnie's Runaway Railway (x=236, z=68)
    box(mCream, 12.0, 8.6, 11.5, 236, Y + 4.3, 68);
    box(mRed, 2.8, 15.2, 2.8, 241.5, Y + 7.6, 68); // Retro theater fin tower!
    mGlow.add(sph(0.75, 8), M(241.5, Y + 15.8, 68));
    box(mToonY, 3.4, 1.4, 8.6, 243.2, Y + 4.6, 68);
    addSign(245.0, Y + 4.6, 68, 7.6, 'EL CAPITOON · 米奇飞速铁路', "MICKEY & MINNIE'S RUNAWAY RAILWAY", '#7f1d1d', '#fde047', Math.PI / 2);

    // Toontown City Hall & CenTOONial Fountain (x=256, z=58)
    mWhite.add(cyl(3.2, 3.6, 0.55, 16), M(256, Y + 0.28, 58));
    mToonB.add(cyl(0.5, 0.7, 2.2, 10), M(256, Y + 1.4, 58));
    mGold.add(sph(0.65, 8), M(256, Y + 2.8, 58));

    // Mickey's House (x=236, z=46 — Tilted Yellow Cartoon Cottage, Steep Red Roof & Crooked Chimney!)
    box(mToonY, 7.6, 5.4, 7.2, 236, Y + 2.7, 46, 0, 0.08, 0.04);
    mRed.add(new T.ConeGeometry(6.4, 4.8, 6), M(236, Y + 7.6, 46, 0.05, 0.3, -0.05));
    box(mBrick, 1.2, 4.4, 1.2, 239.2, Y + 8.2, 45, 0, 0, -0.22); // Crooked cartoon chimney!
    mRed.add(cyl(1.3, 1.3, 0.4, 12), M(236, Y + 1.5, 49.7, Math.PI / 2, 0, 0)); // Iconic round Toon front door!

    // Minnie's House (x=253, z=44 — Lavender & Pink Sweetheart Cottage with Giant Polka-Dot Bow!)
    box(mRose, 7.4, 5.2, 7.0, 253, Y + 2.6, 44, 0, -0.06, -0.04);
    mToonB.add(new T.ConeGeometry(6.2, 4.8, 6), M(253, Y + 7.4, 44));
    mRed.add(sph(0.85, 8), M(252.1, Y + 5.6, 47.6)); // Minnie's giant roof bow!
    mRed.add(sph(0.85, 8), M(253.9, Y + 5.6, 47.6));

    // Donald's Boat "Miss Daisy" in Toon Pond (x=272, z=49) & Chip 'n' Dale's GADGETcoaster (x=278, z=66)!
    box(mWhite, 4.2, 1.6, 8.2, 272, WY + 0.8, 49, 0, -0.25, 0);
    box(mToonB, 3.0, 2.2, 4.0, 272, WY + 2.6, 49.5, 0, -0.25, 0); // Sailor-hat wheelhouse!
    mRed.add(cyl(0.45, 0.55, 2.2, 8), M(272, WY + 4.4, 48.2, -0.18, 0, 0));
    mRed.add(new T.TorusGeometry(6.2, 0.28, 6, 20), M(278, Y + 2.8, 66, Math.PI / 2 + 0.25, 0, 0)); // GADGETcoaster helix!

    /* ============================================================================
     * 5. FRONTIERLAND BOARDWALK & BAYOU COUNTRY (TIANA'S BAYOU ADVENTURE / SPLASH MTN!)
     * ============================================================================ */
    // Log Stockade Fort Entrance Gate to Frontierland (x=228, z=245)
    for (const sd of [-1, 1]) {
      box(mWood, 2.6, 7.6, 2.6, 228, Y + 3.8, 245 + sd * 5.8);
      mWood.add(new T.ConeGeometry(2.1, 2.2, 4), M(228, Y + 8.7, 245 + sd * 5.8, 0, Math.PI / 4, 0));
    }
    box(mWood, 1.4, 1.4, 13.8, 228, Y + 6.8, 245);
    addSign(228.9, Y + 6.8, 245, 8.8, '边域世界 · FRONTIERLAND', 'BIG THUNDER · RIVERS OF AMERICA · TOM SAWYER', '#451a03', '#f59e0b', Math.PI / 2);

    // Golden Horseshoe Saloon (x=204, z=231) & Pioneer Mercantile (x=204, z=259)
    box(mButter, 14.5, 8.6, 9.2, 204, Y + 4.3, 231);
    box(mLeaf, 15.0, 1.4, 9.6, 204, Y + 9.1, 231); // False-front Western parapet!
    box(mWood, 14.8, 0.3, 2.8, 204, Y + 4.4, 236.8); // Covered wooden boardwalk porch
    for (let px = -6.5; px <= 6.5; px += 3.25) box(mWood, 0.22, 4.4, 0.22, 204 + px, Y + 2.2, 238.0);
    addSign(204, Y + 7.2, 235.8, 8.2, '金马蹄酒馆 · GOLDEN HORSESHOE', 'FRONTIERLAND SALOON & REVUE', '#14532d', '#fde047', 0);

    box(mWood, 14.0, 7.2, 8.8, 204, Y + 3.6, 259);
    box(mRed, 14.4, 1.2, 9.2, 204, Y + 7.8, 259);

    // TIANA'S BAYOU ADVENTURE / CHICKAPIN HILL (Bayou Country: x=64, z=186 — 32m Lush Southern Bayou Flume Mountain!)
    const byX = 64, byZ = 186;
    mWood.add(cyl(11.5, 16.5, 16, 10), M(byX, Y + 8.0, byZ)); // Red-clay & root base of Chickapin Hill
    mLeaf.add(new T.ConeGeometry(13.5, 18.0, 9), M(byX, Y + 22.0, byZ)); // Lush grassy southern crown!
    mLeaf.add(sph(6.8, 8), M(byX - 2.0, Y + 27.5, byZ - 1.5));
    // Iconic Tiana's Foods Water Tower crowned with a Golden Princess Tiara!
    mButter.add(cyl(2.2, 2.3, 3.4, 12), M(byX + 8.5, Y + 16.5, byZ - 6.5));
    mGold.add(new T.ConeGeometry(2.5, 2.2, 12), M(byX + 8.5, Y + 19.3, byZ - 6.5));
    mGold.add(new T.TorusGeometry(1.4, 0.16, 6, 12), M(byX + 8.5, Y + 20.6, byZ - 6.5, Math.PI / 2, 0, 0));
    for (const dx of [-1.4, 1.4]) for (const dz of [-1.4, 1.4]) box(mIron, 0.2, 7.5, 0.2, byX + 8.5 + dx, Y + 11.2, byZ - 6.5 + dz);
    // 50-Foot Cascading Bayou Waterfall Flume Chute plunging into the Briar Patch Splashdown Lagoon!
    const bayouFall = new T.Mesh(new T.PlaneGeometry(4.6, 23.0), waterSprayMat);
    bayouFall.position.set(byX + 5.5, Y + 10.2, byZ + 10.5); bayouFall.rotation.x = -0.52; group.add(bayouFall);
    const bayouLog = new T.Group();
    bayouLog.add(new T.Mesh(cyl(0.65, 0.65, 3.8, 8), woodMat));
    bayouLog.children[0].rotation.x = Math.PI / 2;
    group.add(bayouLog);
    // Glowing Golden Bayou Fireflies hovering around Chickapin Hill!
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      mGlow.add(sph(0.18, 5), M(byX + Math.cos(a) * 15.5, Y + 3.2 + (i % 4) * 1.6, byZ + Math.sin(a) * 15.5));
    }

    /* ============================================================================
     * 6. NEW ORLEANS SQUARE + RIDEABLE "PIRATES OF THE CARIBBEAN" INDOOR BOAT RIDE!
     * ============================================================================ */
    // French Quarter Pastel Townhouses with 2nd-Floor Black Wrought-Iron Lacework Galleries!
    const nolaBlocks = [
      { x: 124, z: 256, w: 12.5, d: 9.5, mat: mMint, title: 'CAFÉ ORLEANS · 奥尔良咖啡馆' },
      { x: 166, z: 256, w: 12.5, d: 9.5, mat: mOchre, title: '21 ROYAL · 皇家街 21 号' },
      { x: 145, z: 274, w: 26.0, d: 7.5, mat: mCream, title: '加勒比海盗 · PIRATES OF THE CARIBBEAN', arch: true }
    ];
    nolaBlocks.forEach((nb) => {
      if (nb.arch) {
        box(nb.mat, 8.2, 9.2, nb.d, nb.x - 8.8, Y + 4.6, nb.z);
        box(nb.mat, 8.2, 9.2, nb.d, nb.x + 8.8, Y + 4.6, nb.z);
        box(nb.mat, 9.6, 4.0, nb.d, nb.x, Y + 7.2, nb.z); // Wide canal portal arch!
      } else {
        box(nb.mat, nb.w, 9.0, nb.d, nb.x, Y + 4.5, nb.z);
      }
      box(mSlate, nb.w - 0.6, 2.4, nb.d - 0.6, nb.x, Y + 10.2, nb.z);
      // Iconic New Orleans Black Wrought-Iron Lacework 2nd-Story Balcony!
      const bz = nb.arch ? nb.z - nb.d / 2 - 0.9 : nb.z - nb.d / 2 - 0.9;
      box(mIron, nb.w + 0.6, 0.16, 1.8, nb.x, Y + 4.6, bz);
      box(mIron, nb.w + 0.6, 1.15, 0.12, nb.x, Y + 5.25, bz - 0.85);
      for (let px = -nb.w / 2 + 0.8; px <= nb.w / 2 - 0.8; px += 3.6) {
        if (nb.arch && Math.abs(px) < 4.5) continue;
        mIron.add(cyl(0.07, 0.09, 4.6, 6), M(nb.x + px, Y + 2.3, bz - 0.8));
      }
      addSign(nb.x, Y + 6.4, bz - 0.95, Math.min(9.5, nb.w * 0.72), nb.title, 'NEW ORLEANS SQUARE · FRENCH QUARTER', '#1e1b4b', '#eab308', Math.PI);
    });

    // New Orleans Square Railroad Depot (x=104, z=268)
    box(mBrick, 7.5, 5.2, 11.5, 104, Y + 2.6, 268);
    box(mSlate, 8.2, 2.2, 12.2, 104, Y + 6.2, 268);
    addSign(108.2, Y + 4.4, 268, 6.4, '新奥尔良站 · N.O.S. DEPOT', 'DISNEYLAND RAILROAD STATION #2', '#1e293b', '#f59e0b', Math.PI / 2);

    // ---- ENCLOSED INDOOR PIRATES OF THE CARIBBEAN DARK-RIDE CAVERN (x=118..172, z=280..330) ----
    const pirWallMat = new T.MeshBasicMaterial({ color: 0x090d1c, side: T.DoubleSide });
    const addPirWall = (w, h, x, y, z, ry) => {
      const m = new T.Mesh(new T.PlaneGeometry(w, h), pirWallMat);
      m.position.set(x, y, z); if (ry) m.rotation.y = ry; group.add(m);
    };
    addPirWall(54, 15, 145, Y + 6.5, 330, 0);
    addPirWall(50, 15, 118, Y + 6.5, 305, Math.PI / 2);
    addPirWall(50, 15, 172, Y + 6.5, 305, -Math.PI / 2);
    const pirCeil = new T.Mesh(new T.PlaneGeometry(54, 50), pirWallMat);
    pirCeil.rotation.x = Math.PI / 2; pirCeil.position.set(145, Y + 14.0, 305); group.add(pirCeil);

    const pirAmber = new T.MeshBasicMaterial({ color: 0xf59e0b });
    const pirGold = new T.MeshBasicMaterial({ color: 0xfacc15 });
    const pirWood = new T.MeshBasicMaterial({ color: 0x6b4226 });
    const pirBone = new T.MeshBasicMaterial({ color: 0xf1f5f9 });
    const pirSail = new T.MeshBasicMaterial({ color: 0xe7dec8, side: T.DoubleSide });
    const pirFort = new T.MeshBasicMaterial({ color: 0x948979 });
    const pirFire = new T.MeshBasicMaterial({ color: 0xef4444 });

    // Scene 1: Blue Bayou Twilight Lanterns & Stilt Cabin (x=154, z=288)
    const bayouShack = new T.Mesh(new T.BoxGeometry(5.5, 3.6, 4.8), pirWood);
    bayouShack.position.set(158, WY + 2.4, 288); group.add(bayouShack);
    for (let i = 0; i < 12; i++) {
      mGlow.add(sph(0.22, 5), M(136 + (i % 4) * 5.5, WY + 4.8, 284 + Math.floor(i / 4) * 3.5));
    }

    // Scene 2: Dead Man's Cove Shipwreck & Skeleton Helmsman (x=162, z=322)
    const coveRock = new T.Mesh(new T.ConeGeometry(4.5, 6.2, 6), pirFort); coveRock.position.set(162, WY + 2.5, 322); group.add(coveRock);
    const skelSkull = new T.Mesh(sph(0.45, 7), pirBone); skelSkull.position.set(158, WY + 2.8, 321); group.add(skelSkull);

    // Scene 3: WICKED WENCH 3-MASTED PIRATE GALLEON (East: x=161, z=308) vs. SPANISH FORTRESS (West: x=127, z=308)!
    const galleon = new T.Group(); galleon.position.set(161, WY + 0.5, 308);
    const gHull = new T.Mesh(new T.BoxGeometry(5.2, 3.8, 16.5), pirWood); gHull.position.y = 1.9; galleon.add(gHull);
    const gStern = new T.Mesh(new T.BoxGeometry(5.0, 3.2, 4.8), pirWood); gStern.position.set(0, 4.8, -5.8); galleon.add(gStern);
    for (const mz of [-4.5, 0.5, 5.5]) {
      const mast = new T.Mesh(cyl(0.18, 0.24, 10.5, 6), pirWood); mast.position.set(0, 6.8, mz); galleon.add(mast);
      const sail = new T.Mesh(new T.PlaneGeometry(4.8, 4.2), pirSail); sail.rotation.y = -Math.PI / 2; sail.position.set(-0.3, 7.5, mz); galleon.add(sail);
    }
    group.add(galleon);

    // Crenellated Spanish Stone Fortress returning cannon fire on the West bank!
    const fort = new T.Mesh(new T.BoxGeometry(7.2, 8.8, 15.0), pirFort); fort.position.set(126, WY + 4.4, 308); group.add(fort);
    const fortTower = new T.Mesh(cyl(2.4, 2.6, 11.5, 8), pirFort); fortTower.position.set(128, WY + 5.75, 315); group.add(fortTower);
    const fortFlame = new T.Mesh(sph(1.1, 6), pirFire); fortFlame.position.set(128, WY + 11.8, 315); group.add(fortFlame);

    // Live Animated Glowing Cannonballs flying back & forth over the guest boat!
    const cannonballs = [];
    for (let i = 0; i < 4; i++) {
      const cb = new T.Mesh(sph(0.32, 6), i % 2 === 0 ? pirAmber : pirFire);
      group.add(cb);
      cannonballs.push({ mesh: cb, dir: i % 2 === 0 ? -1 : 1, z: 303 + i * 3.4, ph: i * 0.27 });
    }

    // Scene 4: Captain Jack Sparrow's Glittering Gold Treasure Mountain (x=127, z=291)!
    for (const [tx, tz, tr, th] of [[127, 291, 4.8, 3.6], [130, 294, 3.2, 2.4], [126, 287, 3.0, 2.2]]) {
      const mound = new T.Mesh(new T.ConeGeometry(tr, th, 10), pirGold);
      mound.position.set(tx, WY + th / 2, tz); group.add(mound);
    }
    const throne = new T.Mesh(new T.BoxGeometry(1.6, 2.4, 1.4), pirAmber); throne.position.set(128.5, WY + 3.2, 291); group.add(throne);

    // RIDE #6: PIRATES OF THE CARIBBEAN BAYOU BATEAU BOAT!
    const pirBoat = new T.Group();
    pirBoat.position.set(145, WY + 0.08, 270);
    const pbHull = new T.Mesh(new T.BoxGeometry(2.5, 0.72, 5.8), woodMat); pbHull.position.y = 0.36; pirBoat.add(pbHull);
    for (const bz of [-1.6, 0, 1.6]) {
      const seat = new T.Mesh(new T.BoxGeometry(2.1, 0.28, 0.65), crimsonMat); seat.position.set(0, 0.75, bz); pirBoat.add(seat);
    }
    const pbLamp = new T.Mesh(sph(0.20, 6), warmGlowMat); pbLamp.position.set(0, 1.05, 2.85); pirBoat.add(pbLamp);
    group.add(pirBoat);

    const pirWaypoints = [
      [145, 268], [145, 286], [151, 294], [151, 318],
      [145, 323], [139, 316], [139, 304], [138, 291],
      [145, 285], [145, 268]
    ];
    function samplePir(t) {
      const n = pirWaypoints.length - 1, u = Math.max(0, Math.min(0.9999, t)) * n;
      const i = Math.floor(u), f = u - i, a = pirWaypoints[i], b = pirWaypoints[i + 1];
      return { x: a[0] + (b[0] - a[0]) * f, z: a[1] + (b[1] - a[1]) * f };
    }
    const pirState = { running: false, t: 0, speed: 0.034, eventIdx: -1 };
    const piratesRide = {
      id: 'pirates_ride', name: '加勒比海盗室内游船（Pirates of the Caribbean）', land: 'New Orleans Square',
      boardPos: { x: 145, y: Y, z: 266 },
      exitPos:  { x: 145, y: Y, z: 261, yaw: Math.PI },
      start: () => { pirState.running = true; },
      stop:  () => { pirState.running = false; },
      isRunning: () => pirState.running,
      getCameraPose: (thirdPerson) => {
        const bp = pirBoat.position, yaw = pirBoat.rotation.y;
        const fx = Math.sin(yaw), fz = Math.cos(yaw);
        if (thirdPerson) return { px: bp.x - fx * 5.8, py: bp.y + 3.2, pz: bp.z - fz * 5.8, tx: bp.x + fx * 6, ty: bp.y + 1.5, tz: bp.z + fz * 6 };
        return { px: bp.x + fx * 0.6, py: bp.y + 2.05, pz: bp.z + fz * 0.6, tx: bp.x + fx * 12, ty: bp.y + 1.9, tz: bp.z + fz * 12 };
      }
    };

    /* ============================================================================
     * 7. ADVENTURELAND: ENCHANTED TIKI ROOM, BAZAAR & INDIANA JONES TEMPLE!
     * ============================================================================ */
    // Walt Disney's Enchanted Tiki Room (x=212, z=282 — Polynesian Saddle-Back Thatched A-Frame Pavilion!)
    box(mWood, 9.6, 4.6, 11.2, 212, Y + 2.3, 282);
    mThatch.add(new T.ConeGeometry(8.2, 7.6, 4), M(212, Y + 8.2, 282, 0, Math.PI / 4, 0));
    box(mWood, 0.8, 2.4, 12.8, 212, Y + 11.5, 282); // Carved Polynesian roof ridge beam!
    for (const tz of [-5.2, 5.2]) {
      mWood.add(cyl(0.42, 0.48, 3.8, 7), M(217.5, Y + 1.9, 282 + tz)); // Carved Tiki Totem Gods!
      mGlow.add(new T.ConeGeometry(0.28, 0.6, 6), M(217.5, Y + 4.1, 282 + tz));
    }
    addSign(217.6, Y + 4.8, 282, 6.8, '魅惑提基屋 · ENCHANTED TIKI ROOM', "WALT DISNEY'S ORIGINAL AUDIO-ANIMATRONICS", '#451a03', '#f59e0b', Math.PI / 2);

    // Adventureland Bazaar Stalls (x=202, z=298)
    box(mOchre, 8.8, 5.6, 10.2, 202, Y + 2.8, 298);
    box(mRed, 2.8, 0.18, 9.8, 196.4, Y + 3.8, 298, 0, 0, 0.24);

    // INDIANA JONES ADVENTURE: TEMPLE OF THE FORBIDDEN EYE (x=148, z=294 — Massive Crumbling Mara Jungle Temple!)
    for (let tier = 0; tier < 5; tier++) {
      const w = 22.0 - tier * 3.4, d = 18.0 - tier * 2.6;
      box(mStone, w, 2.8, d, 148, Y + tier * 2.8 + 1.4, 294);
    }
    box(mStone, 6.2, 5.4, 5.6, 148, Y + 16.5, 294); // Carved Deity Sanctum Spire!
    // Twin Giant Carved Cobra Pillars & Blazing Expedition Fire Braziers at Temple Portal!
    for (const sd of [-1, 1]) {
      mStone.add(cyl(0.85, 1.15, 7.6, 8), M(159.2, Y + 3.8, 294 + sd * 4.2));
      mGlow.add(sph(0.52, 6), M(159.8, Y + 4.6, 294 + sd * 4.2));
    }
    // Parked Weathered Indiana Jones Expedition Troop Transport Truck (x=163, z=287)
    box(mLeaf, 2.4, 1.6, 5.2, 163, Y + 1.1, 287, 0, 0.35, 0);
    box(mThatch, 2.3, 1.4, 3.2, 162.7, Y + 2.4, 286.2, 0, 0.35, 0);
    addSign(159.6, Y + 6.4, 294, 8.2, '夺宝奇兵：魔眼禁庙 · INDIANA JONES', 'TEMPLE OF THE FORBIDDEN EYE', '#292524', '#f59e0b', Math.PI / 2);

    /* ============================================================================
     * 8. TOMORROWLAND (BUZZ, STAR TOURS, AUTOPIA) + RIDEABLE INDOOR SPACE MOUNTAIN!
     * ============================================================================ */
    // Buzz Lightyear Astro Blasters (North Tomorrowland: x=374, z=238) & Star Tours (South Tomorrowland: x=374, z=278)
    box(mWhite, 16.5, 8.2, 10.5, 374, Y + 4.1, 238);
    box(mToonB, 17.0, 0.9, 11.0, 374, Y + 8.5, 238);
    addSign(374, Y + 6.2, 243.5, 8.6, '巴斯光年星际营救 · BUZZ LIGHTYEAR', 'ASTRO BLASTERS SPACE COMMAND', '#0f172a', '#4ade80', 0);

    box(mWhite, 16.5, 8.4, 10.5, 374, Y + 4.2, 278);
    box(mCyan, 17.0, 0.8, 11.0, 374, Y + 8.6, 278);
    // Parked Orange-and-White Starspeeder 1000 Shuttle over Star Tours Marquee!
    box(mRed, 2.6, 1.6, 4.8, 374, Y + 10.2, 273.5, -0.14, 0.4, 0);
    addSign(374, Y + 6.2, 272.5, 8.6, '星际旅行 · STAR TOURS', 'THE ADVENTURES CONTINUE · STARSPEEDER 1000', '#0f172a', '#38bdf8', Math.PI);

    // Tomorrowland Railroad Station (x=468, z=268)
    box(mWhite, 7.6, 4.8, 12.6, 468, Y + 2.4, 268);
    box(mCyan, 8.4, 0.55, 13.4, 468, Y + 5.0, 268);
    addSign(463.8, Y + 4.2, 268, 6.8, '明日世界站 · TOMORROWLAND STN', 'DISNEYLAND RAILROAD STATION #4', '#082f49', '#38bdf8', -Math.PI / 2);

    // Autopia Scenic Freeway Overpass Bridge & Animated Sports Cars (x=435, z=215)!
    box(mWhite, 10.5, 0.65, 3.8, 435, Y + 3.2, 215);
    box(mCyan, 10.6, 0.25, 0.25, 435, Y + 3.7, 213.2);
    box(mCyan, 10.6, 0.25, 0.25, 435, Y + 3.7, 216.8);
    const autopiaCars = [];
    const carMats = [crimsonMat, toonBlueMat, toonYellowMat, goldMat];
    for (let i = 0; i < 4; i++) {
      const cg = new T.Group();
      const body = new T.Mesh(new T.BoxGeometry(1.3, 0.55, 2.6), carMats[i]); body.position.y = 0.42; cg.add(body);
      const wind = new T.Mesh(new T.BoxGeometry(1.1, 0.38, 1.0), cyanGlowMat); wind.position.set(0, 0.78, 0.1); cg.add(wind);
      group.add(cg);
      autopiaCars.push({ grp: cg, phase: (i / 4) * Math.PI * 2 });
    }

    // ---- RIDE #9: RIDEABLE INDOOR "SPACE MOUNTAIN" DEEP-SPACE GALAXY COASTER! ----
    // Dedicated High-Altitude Pitch-Black Starfield Dome at (428, 340, 286) — zero daytime sky bleed!
    const smDomeGrp = new T.Group();
    smDomeGrp.position.set(428, 340, 286);
    smDomeGrp.visible = false;
    group.add(smDomeGrp);

    smDomeGrp.add(new T.Mesh(new T.SphereGeometry(125, 20, 14), new T.MeshBasicMaterial({ color: 0x02040d, side: T.BackSide, fog: false })));
    const smStarGeo = new T.BufferGeometry(), smPos = new Float32Array(520 * 3), smCol = new Float32Array(520 * 3);
    for (let i = 0; i < 520; i++) {
      const th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1), r = 38 + Math.random() * 76;
      smPos[i * 3] = Math.sin(ph) * Math.cos(th) * r;
      smPos[i * 3 + 1] = Math.cos(ph) * r;
      smPos[i * 3 + 2] = Math.sin(ph) * Math.sin(th) * r;
      const c = i % 5 === 0 ? [0.22, 0.74, 0.98] : i % 7 === 0 ? [0.96, 0.45, 0.71] : [0.95, 0.97, 1.0];
      smCol[i * 3] = c[0]; smCol[i * 3 + 1] = c[1]; smCol[i * 3 + 2] = c[2];
    }
    smStarGeo.setAttribute('position', new T.BufferAttribute(smPos, 3));
    smStarGeo.setAttribute('color', new T.BufferAttribute(smCol, 3));
    const smStars = new T.Points(smStarGeo, new T.PointsMaterial({ size: 1.35, vertexColors: true, fog: false }));
    smDomeGrp.add(smStars);

    // Iconic Space Mountain Throbbing Red-and-Cyan Power Launch Tunnel Rings + Ringed Planet & Nebula!
    const launchRings = [];
    for (let i = 0; i < 8; i++) {
      const a = (i / 28) * Math.PI * 2;
      const rg = new T.Mesh(new T.TorusGeometry(3.4, 0.16, 6, 18), new T.MeshBasicMaterial({ color: i % 2 === 0 ? 0xef4444 : 0x38bdf8, fog: false }));
      rg.position.set(Math.cos(a) * 32, Math.sin(a * 2) * 8, Math.sin(a) * 32);
      rg.lookAt(Math.cos(a + 0.08) * 32, Math.sin((a + 0.08) * 2) * 8, Math.sin(a + 0.08) * 32);
      smDomeGrp.add(rg); launchRings.push(rg);
    }
    const smPlanet = new T.Mesh(sph(9.5, 16), new T.MeshBasicMaterial({ color: 0x3b82f6, wireframe: true, transparent: true, opacity: 0.42, fog: false }));
    smDomeGrp.add(smPlanet);
    const smSaturnRing = new T.Mesh(new T.TorusGeometry(16.5, 0.5, 6, 36), new T.MeshBasicMaterial({ color: 0xc084fc, transparent: true, opacity: 0.55, fog: false }));
    smSaturnRing.rotation.x = 1.15; smDomeGrp.add(smSaturnRing);

    const smRocket = new T.Group();
    const rkFus = new T.Mesh(cyl(0.55, 0.78, 4.4, 10), whiteMat); rkFus.rotation.x = Math.PI / 2; smRocket.add(rkFus);
    const rkNose = new T.Mesh(new T.ConeGeometry(0.55, 1.5, 10), crimsonMat); rkNose.rotation.x = Math.PI / 2; rkNose.position.z = 2.95; smRocket.add(rkNose);
    const rkNeon = new T.Mesh(new T.BoxGeometry(2.6, 0.12, 1.2), cyanGlowMat); rkNeon.position.z = -0.8; smRocket.add(rkNeon);
    smDomeGrp.add(smRocket);

    function sampleSM(t) {
      const a = t * Math.PI * 6; // 3 exhilarating high-speed descending & banking helices inside Space Mountain!
      const r = 32 - Math.sin(t * Math.PI) * 6;
      return {
        x: 428 + Math.cos(a) * r,
        y: 340 + Math.sin(a * 2) * 11 + Math.cos(a * 3) * 4.5,
        z: 286 + Math.sin(a) * r
      };
    }
    const smState = { running: false, t: 0, speed: 0.036, eventIdx: -1 };
    const spaceMountainRide = {
      id: 'space_mountain', name: '太空山室内星际过山车（Space Mountain）', land: 'Tomorrowland',
      boardPos: { x: 408, y: Y, z: 276 },
      exitPos:  { x: 404, y: Y, z: 274, yaw: -0.6 },
      start: () => { smState.running = true; smState.t = 0; smState.eventIdx = -1; smDomeGrp.visible = true; },
      stop:  () => { smState.running = false; },
      onExit: () => { smState.running = false; smDomeGrp.visible = false; },
      isRunning: () => smState.running,
      getCameraPose: (thirdPerson) => {
        const p0 = sampleSM(smState.t), p1 = sampleSM(Math.min(0.999, smState.t + 0.008));
        const dx = p1.x - p0.x, dy = p1.y - p0.y, dz = p1.z - p0.z, L = Math.hypot(dx, dy, dz) || 1;
        const fx = dx / L, fy = dy / L, fz = dz / L;
        if (thirdPerson) return { px: p0.x - fx * 7.5, py: p0.y - fy * 7.5 + 2.6, pz: p0.z - fz * 7.5, tx: p0.x + fx * 10, ty: p0.y + fy * 10, tz: p0.z + fz * 10 };
        return { px: p0.x + fx * 0.8, py: p0.y + 1.05, pz: p0.z + fz * 0.8, tx: p0.x + fx * 18, ty: p0.y + fy * 18 + 0.4, tz: p0.z + fz * 18 };
      }
    };

    /* ---------------- Flush All Merged Static 1:1 Disneyland Meshes ---------------- */
    mBrick.mesh(brickMat, true); mWhite.mesh(whiteMat, true); mCream.mesh(creamMat, true); mButter.mesh(butterMat, true);
    mMint.mesh(nolaMintMat, true); mOchre.mesh(nolaOchreMat, true); mRose.mesh(roseMat, true); mToonY.mesh(toonYellowMat, true);
    mToonB.mesh(toonBlueMat, true); mRed.mesh(crimsonMat, true); mSlate.mesh(slateMat, true); mWood.mesh(woodMat, true);
    mThatch.mesh(thatchMat, true); mStone.mesh(templeStoneMat, true); mLeaf.mesh(bayouGreenMat, false); mToonHill.mesh(toonHillMat, false); mGold.mesh(goldMat, false);
    mIron.mesh(ironMat, false); mWhale.mesh(whaleMat, true); mGlow.mesh(warmGlowMat, false); mCyan.mesh(cyanGlowMat, false);

    const extraInteractables = [
      { id: 'walt_lamp', name: '华特·迪士尼二楼永恒纪念台灯', x: 238, y: Y, z: 415, msg: '🕯️ 101 号消防局二楼正是华特·迪士尼当年的私人公寓——窗边那盏台灯永远点亮，象征他的梦想始终陪伴每位游客！' },
      { id: 'sword_stone', name: '亚瑟王传奇石中剑', x: CX, y: Y, z: 176.5, msg: '⚔️ 金光闪耀！石中剑微微震颤，皇家号角为你奏响亚瑟王加冕礼赞！' },
      { id: 'indy_mara', name: '魔眼禁庙玛拉神像', x: 159, y: Y, z: 294, msg: '🐍 别直视玛拉神像的双眼！禁庙火盆烈焰腾空，印第安纳琼斯主题曲轰然响起！' },
      { id: 'toontown_bell', name: '米奇卡通城搞笑喷泉', x: 256, y: Y, z: 58, msg: '🎵 叮咚哐当！卡通城市政厅响起欢快汽笛声，米奇与米妮向你挥手问好！' }
    ];

    function update(dt, elapsed, onEvent) {
      // Peter Pan flying ship gentle sway + Alice caterpillar + Monstro spout!
      panShipGrp.position.y = Y + 5.8 + Math.sin(elapsed * 2.1) * 0.25;
      panShipGrp.rotation.z = Math.sin(elapsed * 1.5) * 0.10;
      const alA = ((elapsed * 0.35) % 1.0) * Math.PI * 1.35;
      aliceBug.position.set(305 + Math.cos(alA) * 5.8, Y + 1.45 + Math.sin((alA / (Math.PI * 1.35)) * Math.PI) * 2.6, 138 + Math.sin(alA) * 5.2);
      aliceBug.rotation.y = Math.atan2(-Math.sin(alA), Math.cos(alA));
      whaleSpout.scale.y = 0.65 + Math.abs(Math.sin(elapsed * 2.4)) * 0.75;

      // Bayou flume splashdown log plunging down Chickapin Hill!
      const byU = (elapsed * 0.32) % 1.0;
      if (byU < 0.55) {
        const k = byU / 0.55;
        bayouLog.position.set(byX + 5.5, Y + 21.0 - k * k * 21.2, byZ + 4.5 + k * 12.0);
        bayouLog.rotation.x = 0.48 * (1 - k * 0.5);
      } else {
        const k = (byU - 0.55) / 0.45;
        bayouLog.position.set(byX + 5.5 + k * 8.0, WY + 0.35, byZ + 16.5 + Math.sin(k * Math.PI) * 3.5);
        bayouLog.rotation.x = 0;
      }

      // Pirates of the Caribbean Live Cannonball Arcs + Ride Boat!
      cannonballs.forEach((cb) => {
        const u = (elapsed * 0.75 + cb.ph) % 1.0;
        const x0 = cb.dir < 0 ? 158.5 : 129.5, x1 = cb.dir < 0 ? 130.5 : 157.5;
        cb.mesh.position.set(x0 + (x1 - x0) * u, WY + 2.8 + Math.sin(u * Math.PI) * 4.5, cb.z);
      });
      if (pirState.running) {
        pirState.t += dt * pirState.speed;
        const p0 = samplePir(pirState.t), p1 = samplePir(Math.min(0.9999, pirState.t + 0.015));
        pirBoat.position.set(p0.x, WY + 0.08 + Math.sin(elapsed * 3.0) * 0.04, p0.z);
        pirBoat.rotation.y = Math.atan2(p1.x - p0.x, p1.z - p0.z);
        const pirMsgs = [
          '🏴‍☠️ 游船缓缓驶入【蓝湾萤火虫夜空】，岸边传来斑鸠琴声…',
          '💀 激流俯冲进入【骷髅死人湾】："Dead Men Tell No Tales!"',
          '💣 小心水花！【黑珍珠海盗大帆船】正与西班牙要塞激烈对轰火炮！',
          '👑 抵达【杰克船长黄金宝藏山】：满地金币皇冠闪耀，Yo Ho, A Pirate\'s Life For Me！'
        ];
        const ev = Math.min(pirMsgs.length - 1, Math.floor((pirState.t % 1) * pirMsgs.length));
        if (ev !== pirState.eventIdx) { pirState.eventIdx = ev; if (onEvent) onEvent(pirMsgs[ev]); }
        if (pirState.t >= 1.0) {
          pirState.t = 0; pirState.running = false; pirState.eventIdx = -1;
          pirBoat.position.set(145, WY + 0.08, 270);
          if (onEvent) onEvent('⚓ 加勒比海盗游船已返航新奥尔良码头！');
        }
      }

      // Autopia Sports Cars cruising Tomorrowland Freeway!
      autopiaCars.forEach((c) => {
        const a = elapsed * 0.55 + c.phase;
        const ax = 435 + Math.cos(a) * 17.2, az = 215 + Math.sin(a) * 15.2;
        const nx = 435 + Math.cos(a + 0.05) * 17.2, nz = 215 + Math.sin(a + 0.05) * 15.2;
        c.grp.position.set(ax, Y + 0.05, az);
        c.grp.rotation.y = Math.atan2(nx - ax, nz - az);
      });

      // Space Mountain Indoor Star-Coaster!
      if (smDomeGrp.visible) {
        smStars.rotation.y = elapsed * 0.08;
        smPlanet.rotation.y = elapsed * 0.25;
        if (smState.running) {
          smState.t += dt * smState.speed;
          const p0 = sampleSM(smState.t), p1 = sampleSM(Math.min(0.999, smState.t + 0.01));
          smRocket.position.set(p0.x - 428, p0.y - 340, p0.z - 286);
          smRocket.lookAt(p1.x - 428 + 428, p1.y - 340 + 340, p1.z - 286 + 286);
          const smMsgs = [
            '🚀 太空山火箭进入【红色超能弹射隧道】，3、2、1 全速发射！',
            '🌌 冲入全黑深空星云！数百颗恒星与彗星从耳畔呼啸掠过！',
            '🪐 高速急转绕过土星光环与超新星旋涡！',
            '⚡ 重返太空港减速通道，星际飞行即将圆满着陆！'
          ];
          const ev = Math.min(smMsgs.length - 1, Math.floor((smState.t % 1) * smMsgs.length));
          if (ev !== smState.eventIdx) { smState.eventIdx = ev; if (onEvent) onEvent(smMsgs[ev]); }
          if (smState.t >= 1.0) {
            smState.t = 0; smState.running = false; smState.eventIdx = -1;
            if (onEvent) onEvent('🛸 太空山火箭已安全返回明日世界星际港！点击「启动」可再次发射，或点击「离开设施」。');
          }
        }
      }
    }

    return { update, piratesRide, spaceMountainRide, extraInteractables };
  }

  root.TPDisneyland1to1 = { build };
})(window);
