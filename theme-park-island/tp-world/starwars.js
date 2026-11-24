/* Minest My World · Star Wars: Galaxy's Edge — Museum-Grade Batuu Black Spire Outpost
 * Land #9 & Rideable Attraction E (Millennium Falcon: Smugglers Run):
 * - Craggy Tiered Petrified Black Spire Cliffs & Rocky Canyon Arches (zero smooth cones!)
 * - Textured Oga's Cantina, Savi's Lightsaber Workshop, Droid Depot & Blue-Milk Stand with Aurebesh Neon & Awnings
 * - High-Craft Rideable Millennium Falcon (radial sci-fi hull plating, quad laser barrels, boarding ramp, rectenna lattice, blue hyperdrive)
 * - Armored Imperial AT-AT Walker (weathered plate texture, 4-toe footpads, articulated legs & animated sweeping head!)
 * - First Order TIE Echelon, Stormtrooper Squad & Kylo Ren with Crackling Red Crossguard Lightsaber
 * - Resistance X-Wing Starfighter (open S-foils, wingtip cannons, glowing thrusters)
 * - Textured Animated R2-D2 (angled legs + blue-silver dome) & BB-8 (orange-white panel pattern + twin antennas)
 * - Overhead Patrolling First Order TIE Fighters banking across the Batuu skyline! */
(function (root) {
  'use strict';

  function build(scene, world, group) {
    const T = root.THREE;
    const Y = world.PARK_Y;
    const BX = 116, BZ = 78; // Batuu Black Spire Spaceport Center

    function cvs(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
    function finTex(c, rep) {
      const tx = new T.CanvasTexture(c);
      if (T.sRGBEncoding !== undefined) tx.encoding = T.sRGBEncoding;
      if (rep) { tx.wrapS = tx.wrapT = T.RepeatWrapping; }
      return tx;
    }

    // 1. Authentic Corellian YT-1300 Sci-Fi Armor Plating (clean large beveled hull plates, zero brick pattern!)
    function makeFalconHullTex() {
      const c = cvs(256, 256), x = c.getContext('2d');
      x.fillStyle = '#c8c6be'; x.fillRect(0, 0, 256, 256);
      const rects = [
        [0, 0, 85, 64, '#bab8b0'], [85, 0, 85, 64, '#d0cec6'], [170, 0, 86, 64, '#bfbdb5'],
        [0, 64, 64, 64, '#d2d0c8'], [64, 64, 96, 64, '#c2c0b8'], [160, 64, 96, 64, '#b6b4ac'],
        [0, 128, 105, 64, '#c6c4bc'], [105, 128, 75, 64, '#a64d3e'], [180, 128, 76, 64, '#cccbc3'],
        [0, 192, 80, 64, '#b4b2aa'], [80, 192, 90, 64, '#c9c7bf'], [170, 192, 86, 64, '#9e4738']
      ];
      for (const [rx, ry, rw, rh, col] of rects) {
        x.fillStyle = col; x.fillRect(rx, ry, rw, rh);
        x.strokeStyle = 'rgba(42,46,52,0.55)'; x.lineWidth = 2; x.strokeRect(rx + 1, ry + 1, rw - 2, rh - 2);
      }
      for (let i = 0; i < 6; i++) {
        const vx = 24 + i * 41, vy = 223;
        x.fillStyle = '#2d3138'; x.beginPath(); x.arc(vx, vy, 10, 0, Math.PI * 2); x.fill();
        x.strokeStyle = '#9ca3af'; x.lineWidth = 2; x.stroke();
      }
      return finTex(c, true);
    }

    // 2. Imperial Weathered Durasteel Armor Plating (for AT-AT Walker!)
    function makeImperialArmorTex() {
      const c = cvs(256, 256), x = c.getContext('2d');
      x.fillStyle = '#aeb6c0'; x.fillRect(0, 0, 256, 256);
      x.strokeStyle = 'rgba(45,52,62,0.52)'; x.lineWidth = 3;
      for (let y = 0; y < 256; y += 64) {
        x.beginPath(); x.moveTo(0, y); x.lineTo(256, y); x.stroke();
        for (let px = 0; px < 256; px += 85) {
          x.strokeRect(px, y, 85, 64);
          x.fillStyle = (px + y) % 128 === 0 ? 'rgba(255,255,255,0.08)' : 'rgba(30,38,48,0.08)';
          x.fillRect(px + 2, y + 2, 81, 60);
        }
      }
      // Armored hatch & rivet strip
      x.fillStyle = '#64748b'; x.fillRect(92, 92, 72, 72);
      x.strokeStyle = '#334155'; x.lineWidth = 4; x.strokeRect(92, 92, 72, 72);
      return finTex(c, true);
    }

    // 3. Batuu Weathered Desert Stucco & Cantina Wall Texture (recessed arches, grime, glowing portholes!)
    function makeBatuuWallTex() {
      const c = cvs(256, 256), x = c.getContext('2d');
      const g = x.createLinearGradient(0, 0, 0, 256);
      g.addColorStop(0, '#cfc0a8'); g.addColorStop(0.65, '#b6a184'); g.addColorStop(1, '#857058');
      x.fillStyle = g; x.fillRect(0, 0, 256, 256);
      // Weathered plaster patches & pipes
      for (let i = 0; i < 24; i++) {
        x.fillStyle = i % 2 === 0 ? 'rgba(82,66,48,0.16)' : 'rgba(245,235,218,0.14)';
        x.fillRect((i * 43) % 240, (i * 29) % 240, 28 + (i % 24), 14 + (i % 18));
      }
      // Illuminated recessed Tatooine/Batuu viewport windows!
      for (const wx of [34, 154]) {
        x.fillStyle = '#292524'; x.fillRect(wx, 58, 66, 54);
        x.fillStyle = '#fbbf24'; x.fillRect(wx + 8, 66, 50, 38);
        x.strokeStyle = '#57534e'; x.lineWidth = 6; x.strokeRect(wx, 58, 66, 54);
      }
      // Recessed desert archway doorway
      x.fillStyle = '#1c1917';
      x.beginPath(); x.moveTo(94, 256); x.lineTo(94, 168); x.arc(128, 168, 34, Math.PI, 0); x.lineTo(162, 256); x.fill();
      x.strokeStyle = '#78716c'; x.lineWidth = 5; x.stroke();
      return finTex(c, false);
    }

    // 4. First Order TIE Solar-Panel Wing Texture
    function makeTieWingTex() {
      const c = cvs(256, 256), x = c.getContext('2d');
      x.fillStyle = '#11141c'; x.fillRect(0, 0, 256, 256);
      x.strokeStyle = '#7c8899'; x.lineWidth = 10; x.strokeRect(6, 6, 244, 244);
      x.lineWidth = 6;
      x.beginPath(); x.moveTo(0, 0); x.lineTo(256, 256); x.moveTo(256, 0); x.lineTo(0, 256);
      x.moveTo(128, 0); x.lineTo(128, 256); x.moveTo(0, 128); x.lineTo(256, 128); x.stroke();
      return finTex(c, false);
    }

    // 5. Craggy Obsidian-Sandstone Batuu Petrified Rock Texture
    function makeBatuuRockTex() {
      const c = cvs(256, 256), x = c.getContext('2d');
      const g = x.createLinearGradient(0, 0, 0, 256);
      g.addColorStop(0, '#36312d'); g.addColorStop(0.55, '#594e43'); g.addColorStop(1, '#85705a');
      x.fillStyle = g; x.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 56; i++) {
        x.fillStyle = i % 2 === 0 ? 'rgba(20,18,16,0.42)' : 'rgba(186,158,128,0.22)';
        x.fillRect((i * 19) % 256, (i * 13) % 256, 10 + (i % 14), 52 + (i % 64));
      }
      return finTex(c, true);
    }

    // 6. R2-D2 Blue-and-Silver Dome & BB-8 Orange-and-White Circular Panel Textures!
    function makeR2DomeTex() {
      const c = cvs(128, 64), x = c.getContext('2d');
      x.fillStyle = '#cbd5e1'; x.fillRect(0, 0, 128, 64);
      x.fillStyle = '#1d4ed8'; x.fillRect(0, 16, 128, 12);
      for (let i = 0; i < 6; i++) x.fillRect(i * 22 + 4, 34, 14, 18);
      x.fillStyle = '#0f172a'; x.beginPath(); x.arc(64, 24, 6, 0, Math.PI * 2); x.fill();
      x.fillStyle = '#ef4444'; x.beginPath(); x.arc(82, 42, 4, 0, Math.PI * 2); x.fill();
      return finTex(c, true);
    }
    function makeBB8Tex() {
      const c = cvs(128, 128), x = c.getContext('2d');
      x.fillStyle = '#f8fafc'; x.fillRect(0, 0, 128, 128);
      for (const [cx, cy] of [[32, 32], [96, 32], [64, 96], [16, 96], [112, 96]]) {
        x.strokeStyle = '#f97316'; x.lineWidth = 8;
        x.beginPath(); x.arc(cx, cy, 20, 0, Math.PI * 2); x.stroke();
        x.fillStyle = '#94a3b8'; x.beginPath(); x.arc(cx, cy, 8, 0, Math.PI * 2); x.fill();
      }
      return finTex(c, true);
    }

    function makeBannerTex(title, sub, bg, border, subCol) {
      const c = cvs(512, 112), x = c.getContext('2d');
      x.fillStyle = bg; x.fillRect(0, 0, 512, 112);
      x.strokeStyle = border; x.lineWidth = 6; x.strokeRect(5, 5, 502, 102);
      x.fillStyle = '#fef3c7'; x.font = '800 28px "Songti SC", Georgia, serif';
      x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(title, 256, 42);
      x.fillStyle = subCol || '#fdba74'; x.font = '700 16px Georgia, serif'; x.fillText(sub, 256, 80);
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

    // Materials
    const falconMat = new T.MeshLambertMaterial({ map: makeFalconHullTex(), emissive: 0x161614 });
    const armorMat = new T.MeshLambertMaterial({ map: makeImperialArmorTex(), emissive: 0x12151a });
    const darkMetalMat = new T.MeshPhongMaterial({ color: 0x1e222b, specular: 0x94a3b8, shininess: 52 });
    const tieWingMat = new T.MeshLambertMaterial({ map: makeTieWingTex(), emissive: 0x0b0e14 });
    const spireMat = new T.MeshLambertMaterial({ map: makeBatuuRockTex(), emissive: 0x0e0c0a });
    const batuuWallMat = new T.MeshLambertMaterial({ map: makeBatuuWallTex(), emissive: 0x18130d });
    const cantinaMat = new T.MeshLambertMaterial({ color: 0xc8b498, emissive: 0x16120c });
    const awningMat = new T.MeshLambertMaterial({ color: 0x9a3412, emissive: 0x1a0904, side: T.DoubleSide });
    const whiteMat = new T.MeshLambertMaterial({ color: 0xf1f5f9, emissive: 0x181a1e });
    const redAccentMat = new T.MeshLambertMaterial({ color: 0xb91c1c, emissive: 0x1c0505 });
    const orangeMat = new T.MeshLambertMaterial({ color: 0xf97316, emissive: 0x241004 });
    const engineBlueMat = new T.MeshBasicMaterial({ color: 0x38bdf8 });
    const saberBlueMat = new T.MeshBasicMaterial({ color: 0x60a5fa });
    const saberRedMat = new T.MeshBasicMaterial({ color: 0xef4444 });
    const warmGlowMat = new T.MeshBasicMaterial({ color: 0xfde68a });
    const r2DomeMat = new T.MeshLambertMaterial({ map: makeR2DomeTex(), emissive: 0x101828 });
    const bb8BallMat = new T.MeshLambertMaterial({ map: makeBB8Tex(), emissive: 0x1a140e });

    const mSpire = new Merger(), mCantina = new Merger(), mArmor = new Merger(), mDark = new Merger();
    const mWhite = new Merger(), mRed = new Merger(), mOrange = new Merger(), mGlow = new Merger(), mAwn = new Merger();

    /* ============================================================================
     * 1. CRAGGY TIERED BATUU BLACK SPIRE PETRIFIED CLIFFS (Zero smooth Hershey cones!)
     * ============================================================================ */
    const spireSpecs = [
      { x: 82, z: 62, r: 6.5, h: 26 },
      { x: 98, z: 55, r: 7.8, h: 35 },
      { x: 116, z: 53, r: 7.0, h: 31 },
      { x: 134, z: 56, r: 7.4, h: 33 },
      { x: 149, z: 64, r: 6.2, h: 25 }
    ];
    spireSpecs.forEach((sp, idx) => {
      // Sculpted 3-tier stepped craggy rock massif + asymmetric splintered petrified spire tips!
      mSpire.add(cyl(sp.r * 0.72, sp.r * 1.15, sp.h * 0.36, 7), M(sp.x, Y + sp.h * 0.18, sp.z, 0, idx * 0.5, 0));
      mSpire.add(cyl(sp.r * 0.38, sp.r * 0.68, sp.h * 0.36, 6), M(sp.x + (idx % 2 === 0 ? 0.9 : -0.9), Y + sp.h * 0.50, sp.z - 0.5, 0.04, idx * 0.9, -0.05));
      mSpire.add(new T.ConeGeometry(sp.r * 0.36, sp.h * 0.38, 6), M(sp.x + (idx % 2 === 0 ? 1.4 : -1.4), Y + sp.h * 0.84, sp.z - 0.8, 0.06, idx, 0.06));
      // Secondary jagged rocky crag shoulder beside each main spire
      mSpire.add(cyl(sp.r * 0.22, sp.r * 0.56, sp.h * 0.45, 6), M(sp.x + sp.r * 0.68, Y + sp.h * 0.22, sp.z + 2.4, -0.05, idx + 1, 0.09));
      // Warm Batuu outpost beacon lantern perched on cliff ledge
      mGlow.add(sph(0.28, 5), M(sp.x, Y + sp.h * 0.36, sp.z + sp.r * 0.78));
    });

    // ---- OGA'S CANTINA & BATUU MARKETPLACE (West: x=86, z=68 — Textured Desert Stucco, Awnings & Aurebesh Neon!) ----
    const ogaBox = new T.Mesh(new T.BoxGeometry(12.2, 6.2, 10.2), batuuWallMat); ogaBox.position.set(85.5, Y + 3.1, 68); group.add(ogaBox);
    mCantina.add(sph(4.6, 10), M(85.5, Y + 6.2, 68));
    mDark.add(cyl(0.25, 0.32, 3.8, 6), M(89.5, Y + 8.0, 65)); // Rooftop moisture vaporator antenna
    // Sloped Desert Canvas Market Awning + Glowing Neon Signboard ("OGA'S CANTINA · 奥加酒馆")
    box(mAwn, 2.8, 0.14, 9.6, 92.8, Y + 3.9, 68, 0, 0, -0.25);
    const ogaSign = new T.Mesh(new T.PlaneGeometry(7.2, 1.55), new T.MeshBasicMaterial({ map: makeBannerTex("OGA'S CANTINA · 奥加酒馆", 'BLACK SPIRE OUTPOST · BLUE MILK & DRINKS', '#1c1917', '#f97316', '#38bdf8'), side: T.DoubleSide }));
    ogaSign.rotation.y = Math.PI / 2; ogaSign.position.set(91.85, Y + 5.3, 68); group.add(ogaSign);
    // Blue-Milk Stand & Cargo Crates outside Oga's Cantina!
    box(mCantina, 2.4, 1.4, 3.8, 94.5, Y + 0.7, 75.5);
    box(mAwn, 2.8, 0.14, 4.2, 94.5, Y + 2.85, 75.5, 0, 0, -0.12);
    const milkTank = new T.Mesh(cyl(0.32, 0.32, 0.85, 8), engineBlueMat); milkTank.position.set(94.5, Y + 1.82, 74.8); group.add(milkTank);

    // ---- SAVI'S LIGHTSABER WORKSHOP & DROID DEPOT (East: x=149, z=84) ----
    const saviBox = new T.Mesh(new T.BoxGeometry(9.8, 5.6, 10.8), batuuWallMat); saviBox.position.set(149, Y + 2.8, 84); group.add(saviBox);
    mCantina.add(sph(3.8, 10), M(149, Y + 5.6, 84));
    box(mAwn, 2.6, 0.14, 9.8, 142.8, Y + 3.6, 84, 0, 0, 0.24);
    const saviSign = new T.Mesh(new T.PlaneGeometry(7.2, 1.55), new T.MeshBasicMaterial({ map: makeBannerTex("SAVI'S WORKSHOP · 光剑工坊", 'CUSTOM LIGHTSABERS & DROID DEPOT', '#0f172a', '#60a5fa', '#93c5fd'), side: T.DoubleSide }));
    saviSign.rotation.y = -Math.PI / 2; saviSign.position.set(143.8, Y + 4.9, 84); group.add(saviSign);

    // Batuu Marketplace Overhead String Lanterns, Cargo Crates, Moisture Vaporators & First Order Banners (Merged = 0 Extra Draw Calls!)
    for (let i = 0; i < 7; i++) {
      const lx = 95 + i * 7.2, lz = 98.5 - Math.sin((i / 6) * Math.PI) * 2.5;
      mGlow.add(sph(0.24, 5), M(lx, Y + 5.8 - Math.sin((i / 6) * Math.PI) * 0.8, lz));
    }
    // Imperial Cargo Crates & Fuel Conduits flanking Pad 5
    for (const [cx, cz] of [[104, 74], [103, 76.5], [128, 75], [129, 77.5], [96, 73]]) {
      box(mArmor, 1.5, 1.2, 1.5, cx, Y + 0.6, cz);
      box(mOrange, 1.56, 0.22, 1.56, cx, Y + 0.85, cz);
    }
    // First Order Tall Crimson Insignia Banners flanking the TIE Echelon Bay!
    for (const bz of [80.5, 89.5]) {
      mDark.add(cyl(0.08, 0.10, 6.2, 6), M(88.5, Y + 3.1, bz));
      box(mRed, 0.10, 3.2, 1.25, 88.8, Y + 4.4, bz);
    }
    // Moisture Vaporator Towers on Batuu Courtyard Perimeter
    for (const [vx, vz] of [[104, 64], [127, 62], [143, 94]]) {
      mArmor.add(cyl(0.24, 0.42, 4.8, 6), M(vx, Y + 2.4, vz));
      box(mDark, 1.2, 0.16, 0.16, vx, Y + 4.1, vz);
      mGlow.add(sph(0.18, 5), M(vx, Y + 4.95, vz));
    }

    // Glowing Jedi Blue & Sith Red Crossguard Lightsaber Display Pedestal + Rotating Cyan Death Star Hologram Table!
    box(mDark, 3.2, 1.2, 1.6, 141.5, Y + 0.6, 84);
    const saberBlue = new T.Mesh(cyl(0.08, 0.08, 2.9, 8), saberBlueMat); saberBlue.position.set(140.7, Y + 2.55, 84); saberBlue.rotation.z = -0.25; group.add(saberBlue);
    const saberRed = new T.Mesh(cyl(0.08, 0.08, 2.9, 8), saberRedMat); saberRed.position.set(142.3, Y + 2.55, 84); saberRed.rotation.z = 0.25; group.add(saberRed);
    const crossGuard = new T.Mesh(cyl(0.06, 0.06, 0.9, 6), saberRedMat); crossGuard.position.set(142.0, Y + 1.55, 84); crossGuard.rotation.z = Math.PI / 2 + 0.25; group.add(crossGuard);
    // Resistance Tactical Command Table with Rotating Glowing Cyan Death Star Hologram (x=139, z=90)!
    mDark.add(cyl(1.4, 1.6, 1.15, 12), M(139.5, Y + 0.58, 88.5));
    const holoDeathStar = new T.Mesh(new T.SphereGeometry(1.05, 12, 10), new T.MeshBasicMaterial({ color: 0x38bdf8, wireframe: true, transparent: true, opacity: 0.78 }));
    holoDeathStar.position.set(139.5, Y + 2.45, 88.5); group.add(holoDeathStar);

    // Batuu Spaceport Welcome Archway & Signboard (x=116, z=104)
    for (const sd of [-1, 1]) {
      mSpire.add(cyl(0.85, 1.25, 7.2, 7), M(BX + sd * 7.5, Y + 3.6, 104));
      mGlow.add(sph(0.28, 6), M(BX + sd * 7.5, Y + 7.5, 104));
    }
    box(mDark, 15.8, 0.8, 0.9, BX, Y + 7.2, 104);
    const swBanner = new T.Mesh(new T.PlaneGeometry(11.6, 2.5), new T.MeshBasicMaterial({ map: makeBannerTex('星球大战：银河边缘 · BATUU', "STAR WARS: GALAXY'S EDGE · BLACK SPIRE OUTPOST", '#1c1917', '#f97316'), side: T.DoubleSide }));
    swBanner.position.set(BX, Y + 6.8, 104.55); group.add(swBanner);

    // Spaceport Docking Pad 5 Markings, Illuminated Orange Landing Beacons & Cliff Blast Doors!
    mDark.add(cyl(11.2, 11.8, 0.25, 24), M(BX, Y + 0.12, BZ));
    mOrange.add(new T.TorusGeometry(10.8, 0.16, 6, 28), M(BX, Y + 0.28, BZ, Math.PI / 2, 0, 0));
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      mDark.add(cyl(0.22, 0.30, 0.65, 6), M(BX + Math.cos(a) * 11.6, Y + 0.32, BZ + Math.sin(a) * 11.6));
      mGlow.add(sph(0.18, 5), M(BX + Math.cos(a) * 11.6, Y + 0.72, BZ + Math.sin(a) * 11.6));
    }
    // Weathered Steel Docking Bay Blast Doors set into Batuu Cliff behind Pad 5 + Parked Landspeeder outside Oga's Cantina!
    box(mDark, 10.5, 7.2, 1.4, BX, Y + 3.6, 59.5);
    box(mArmor, 4.4, 6.4, 1.6, BX - 2.4, Y + 3.4, 59.6);
    box(mArmor, 4.4, 6.4, 1.6, BX + 2.4, Y + 3.4, 59.6);
    box(mOrange, 3.2, 0.65, 1.5, 96.2, Y + 0.72, 79.5, 0, 0.3, 0); // Parked Tatooine Landspeeder!
    box(mDark, 1.2, 0.45, 1.2, 95.8, Y + 1.15, 79.4, 0, 0.3, 0);

    /* ============================================================================
     * 2. RIDE E: HIGH-CRAFT SCULPTED MILLENNIUM FALCON (x=116, z=78 — FLYABLE!)
     * ============================================================================ */
    const falconGrp = new T.Group();
    falconGrp.position.set(BX, Y + 1.85, BZ);
    falconGrp.rotation.y = 0.25;
    // Main Weathered Corellian YT-1300 Asymmetric Saucer Hull!
    const fHullMain = new T.Mesh(cyl(6.6, 7.2, 1.65, 22), falconMat); falconGrp.add(fHullMain);
    const fHullTop = new T.Mesh(cyl(3.8, 6.5, 0.72, 22), falconMat); fHullTop.position.y = 1.12; falconGrp.add(fHullTop);
    const fHullBot = new T.Mesh(cyl(6.5, 3.8, 0.55, 22), falconMat); fHullBot.position.y = -1.05; falconGrp.add(fHullBot);
    // Twin Tapered Forward Mandibles + Red Panel Accents + Headlights!
    for (const sd of [-1, 1]) {
      const mand = new T.Mesh(new T.BoxGeometry(2.35, 1.15, 6.2), falconMat);
      mand.position.set(sd * 2.15, -0.05, 7.6); mand.rotation.y = -sd * 0.14; falconGrp.add(mand);
      const redStripe = new T.Mesh(new T.BoxGeometry(0.95, 1.20, 2.4), redAccentMat);
      redStripe.position.set(sd * 2.15, -0.05, 8.2); redStripe.rotation.y = -sd * 0.14; falconGrp.add(redStripe);
      const hl = new T.Mesh(sph(0.24, 6), warmGlowMat); hl.position.set(sd * 1.65, 0, 10.6); falconGrp.add(hl);
    }
    // Iconic Offset Starboard Tubular Cockpit Corridor + Conical Bridge & Mullioned Glowing Canopy!
    const cockTube = new T.Mesh(cyl(0.85, 0.95, 5.4, 10), falconMat);
    cockTube.rotation.set(Math.PI / 2, 0, -0.35); cockTube.position.set(5.4, 0.25, 4.4); falconGrp.add(cockTube);
    const cockNose = new T.Mesh(new T.ConeGeometry(0.92, 2.1, 10), darkMetalMat);
    cockNose.rotation.x = Math.PI / 2; cockNose.position.set(6.35, 0.25, 7.45); falconGrp.add(cockNose);
    const cockWin = new T.Mesh(cyl(0.68, 0.82, 0.65, 10), engineBlueMat);
    cockWin.rotation.x = Math.PI / 2; cockWin.position.set(6.35, 0.28, 7.05); falconGrp.add(cockWin);
    // Dorsal Quad Laser Turret with 4 Parallel Blaster Barrels + Lattice Rectenna Dish!
    const turret = new T.Mesh(cyl(0.95, 1.15, 0.65, 10), darkMetalMat); turret.position.y = 1.68; falconGrp.add(turret);
    for (const bx of [-0.26, -0.09, 0.09, 0.26]) {
      const barrel = new T.Mesh(cyl(0.05, 0.06, 2.1, 6), darkMetalMat);
      barrel.rotation.x = Math.PI / 2 - 0.18; barrel.position.set(bx, 1.92, 1.05); falconGrp.add(barrel);
    }
    const dishPost = new T.Mesh(cyl(0.16, 0.18, 1.4, 6), darkMetalMat); dishPost.position.set(-2.6, 1.85, 3.6); falconGrp.add(dishPost);
    const dish = new T.Mesh(new T.BoxGeometry(2.1, 1.3, 0.16), armorMat); dish.position.set(-2.6, 2.65, 3.85); dish.rotation.x = -0.25; falconGrp.add(dish);
    const dishRim = new T.Mesh(new T.BoxGeometry(2.2, 0.14, 0.24), darkMetalMat); dishRim.position.set(-2.6, 2.65, 3.88); falconGrp.add(dishRim);
    // Side Docking Rings, Landing Struts & Illuminated Lowered Starboard Boarding Ramp!
    for (const sd of [-1, 1]) {
      const dock = new T.Mesh(cyl(0.95, 0.95, 1.6, 10), armorMat);
      dock.rotation.z = Math.PI / 2; dock.position.set(sd * 7.2, 0, 0); falconGrp.add(dock);
    }
    const landingGear = new T.Group();
    for (const [gx, gz] of [[-4.2, -3.5], [4.2, -3.5], [-3.2, 4.2], [3.2, 4.2]]) {
      const leg = new T.Mesh(cyl(0.24, 0.30, 1.6, 6), darkMetalMat); leg.position.set(gx, -1.0, gz); landingGear.add(leg);
    }
    // Lowered Glowing Boarding Ramp inviting guests aboard!
    const ramp = new T.Mesh(new T.BoxGeometry(1.5, 0.14, 3.4), darkMetalMat);
    ramp.position.set(3.8, -1.15, 5.2); ramp.rotation.set(0.38, 0.45, 0); landingGear.add(ramp);
    const rampGlow = new T.Mesh(new T.BoxGeometry(1.1, 0.16, 2.8), warmGlowMat);
    rampGlow.position.set(3.8, -1.12, 5.2); rampGlow.rotation.set(0.38, 0.45, 0); landingGear.add(rampGlow);
    falconGrp.add(landingGear);
    // Blazing Electric-Blue Hyperdrive Sublight Engine Strip across Rear Arc!
    const engineArc = new T.Mesh(new T.TorusGeometry(6.95, 0.36, 6, 22, Math.PI * 0.72), engineBlueMat);
    engineArc.rotation.set(Math.PI / 2, 0, Math.PI * 1.14); engineArc.position.y = 0.05;
    falconGrp.add(engineArc);
    group.add(falconGrp);

    /* ============================================================================
     * 3. 18m ARMORED IMPERIAL AT-AT WALKER (x=138, z=70 — ANIMATED SWEEPING HEAD!)
     * ============================================================================ */
    const atX = 138, atZ = 70;
    // 4 Articulated Armored Legs + 4-Toe Heavy Footpads + Ankle Pistons!
    for (const [lx, lz] of [[-2.4, -3.6], [2.4, -3.6], [-2.4, 3.6], [2.4, 3.6]]) {
      mArmor.add(cyl(1.15, 1.48, 1.05, 10), M(atX + lx, Y + 0.52, atZ + lz));
      for (const ta of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
        box(mDark, 0.48, 0.48, 0.65, atX + lx + Math.cos(ta) * 1.25, Y + 0.25, atZ + lz + Math.sin(ta) * 1.25, 0, -ta, 0);
      }
      box(mArmor, 1.18, 5.2, 1.38, atX + lx, Y + 3.4, atZ + lz + 0.3, -0.12, 0, 0);
      mDark.add(cyl(0.78, 0.78, 1.32, 8), M(atX + lx, Y + 6.0, atZ + lz + 0.6, 0, 0, Math.PI / 2)); // Knee joint
      box(mArmor, 1.28, 5.4, 1.58, atX + lx, Y + 8.6, atZ + lz, 0.10, 0, 0);
    }
    // Massive Sloped Armored Troop-Transport Body with Upper Bevel & Side Hatches!
    box(mArmor, 5.8, 5.2, 10.6, atX, Y + 13.6, atZ);
    box(mArmor, 4.4, 1.2, 9.4, atX, Y + 16.5, atZ);
    box(mDark, 5.2, 1.6, 9.6, atX, Y + 10.4, atZ);
    // Animated Articulated AT-AT Command Head sweeping smoothly over the plaza!
    const atHeadGrp = new T.Group(); atHeadGrp.position.set(atX, Y + 13.4, atZ + 5.8);
    const atNeck = new T.Mesh(new T.BoxGeometry(1.8, 2.0, 2.8), darkMetalMat); atNeck.position.z = 1.0; atHeadGrp.add(atNeck);
    const atHead = new T.Mesh(new T.BoxGeometry(3.5, 3.0, 4.5), armorMat); atHead.position.z = 3.8; atHeadGrp.add(atHead);
    const atVisor = new T.Mesh(new T.BoxGeometry(2.7, 0.48, 0.25), saberRedMat); atVisor.position.set(0, 0.4, 6.08); atHeadGrp.add(atVisor);
    for (const sd of [-1, 1]) {
      const chinCan = new T.Mesh(cyl(0.14, 0.18, 2.8, 6), darkMetalMat); chinCan.rotation.x = Math.PI / 2; chinCan.position.set(sd * 1.1, -1.25, 6.6); atHeadGrp.add(chinCan);
      const cheekCan = new T.Mesh(cyl(0.11, 0.13, 1.8, 6), darkMetalMat); cheekCan.rotation.x = Math.PI / 2; cheekCan.position.set(sd * 1.88, -0.25, 5.2); atHeadGrp.add(cheekCan);
    }
    group.add(atHeadGrp);

    /* ============================================================================
     * 4. FIRST ORDER TIE ECHELON + STORMTROOPERS + KYLO REN + RESISTANCE X-WING!
     * ============================================================================ */
    const tieX = 94, tieZ = 85;
    box(mDark, 2.9, 2.6, 6.0, tieX, Y + 2.9, tieZ, 0, 0.45, 0);
    const tieVisor = new T.Mesh(new T.BoxGeometry(1.5, 0.78, 0.25), saberRedMat);
    tieVisor.position.set(tieX + 1.3, Y + 3.05, tieZ + 2.65); tieVisor.rotation.y = 0.45; group.add(tieVisor);
    for (const sd of [-1, 1]) {
      const wing = new T.Mesh(new T.BoxGeometry(0.28, 7.8, 7.4), tieWingMat);
      wing.position.set(tieX + Math.cos(0.45) * sd * 3.8, Y + 4.2, tieZ - Math.sin(0.45) * sd * 3.8);
      wing.rotation.y = 0.45; group.add(wing);
    }
    // 4 White-Armored First Order Stormtroopers + Kylo Ren with Crackling Red Crossguard Lightsaber!
    for (let i = 0; i < 4; i++) {
      const stx = 99.0 + i * 1.4, stz = 90.2 - i * 0.42;
      box(mWhite, 0.46, 0.85, 0.30, stx, Y + 0.42, stz);
      box(mWhite, 0.58, 0.72, 0.34, stx, Y + 1.20, stz);
      mWhite.add(sph(0.24, 7), M(stx, Y + 1.78, stz));
      box(mDark, 0.38, 0.09, 0.26, stx, Y + 1.80, stz + 0.14);
      box(mDark, 0.12, 0.14, 0.65, stx + 0.34, Y + 1.15, stz + 0.25); // E-11 Blaster
    }
    // Kylo Ren (dark hooded robe + silver helmet visor + glowing crimson crossguard saber!)
    const kx = 104.8, kz = 88.8;
    mDark.add(new T.ConeGeometry(0.48, 1.55, 8), M(kx, Y + 0.78, kz));
    mDark.add(sph(0.24, 8), M(kx, Y + 1.78, kz));
    const kSaber = new T.Mesh(cyl(0.045, 0.045, 1.45, 6), saberRedMat); kSaber.position.set(kx + 0.45, Y + 1.55, kz + 0.35); kSaber.rotation.set(0.3, 0, -0.35); group.add(kSaber);
    const kCross = new T.Mesh(cyl(0.035, 0.035, 0.45, 6), saberRedMat); kCross.position.set(kx + 0.28, Y + 1.08, kz + 0.25); kCross.rotation.set(0.3, 0, Math.PI / 2 - 0.35); group.add(kCross);

    // Resistance X-Wing Starfighter positioned visibly in Right Foreground Courtyard (x=131.5, z=90.5 — Merged into Batches for 0 Extra Draw Calls!)
    {
      const xwX = 131.5, xwY = Y + 1.75, xwZ = 90.5, xwAng = -0.82;
      const xwM = (lx, ly, lz, rx, ry, rz) => {
        const lm = M(lx, ly, lz, rx, ry, rz);
        const wm = M(xwX, xwY, xwZ, 0, xwAng, 0);
        return wm.multiply(lm);
      };
      mWhite.add(new T.ConeGeometry(0.68, 7.8, 6), xwM(0, 0, 2.6, Math.PI / 2, 0, 0));
      mWhite.add(new T.BoxGeometry(1.35, 1.15, 4.2), xwM(0, 0, -1.6));
      mDark.add(new T.BoxGeometry(0.95, 0.68, 2.2), xwM(0, 0.78, -0.4));
      for (const [sy, sx] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
        mWhite.add(new T.BoxGeometry(4.8, 0.16, 1.65), xwM(sx * 2.7, sy * 0.65, -2.2, 0, 0, sx * sy * 0.26));
        mRed.add(new T.BoxGeometry(1.6, 0.19, 0.55), xwM(sx * 2.8, sy * 0.68, -2.2, 0, 0, sx * sy * 0.26));
        mDark.add(cyl(0.06, 0.08, 2.4, 6), xwM(sx * 5.05, sy * 1.25, -1.2, Math.PI / 2, 0, 0));
        mOrange.add(cyl(0.28, 0.28, 1.4, 8), xwM(sx * 0.95, sy * 0.45, -3.5, Math.PI / 2, 0, 0));
      }
      // Landing Struts under X-Wing
      mDark.add(cyl(0.10, 0.14, 1.6, 6), xwM(0, -0.95, 1.8));
      mDark.add(cyl(0.10, 0.14, 1.6, 6), xwM(-1.2, -0.95, -2.2));
      mDark.add(cyl(0.10, 0.14, 1.6, 6), xwM(1.2, -0.95, -2.2));
    }

    /* ============================================================================
     * 5. DETAILED TEXTURED R2-D2 & BB-8 DROIDS + OVERHEAD PATROLLING TIE FIGHTERS!
     * ============================================================================ */
    const r2Grp = new T.Group(); r2Grp.position.set(110.5, Y, 92.5);
    const r2Body = new T.Mesh(cyl(0.42, 0.42, 0.92, 12), whiteMat); r2Body.position.y = 0.68; r2Grp.add(r2Body);
    for (const sd of [-1, 1]) {
      const r2Leg = new T.Mesh(new T.BoxGeometry(0.18, 0.95, 0.26), whiteMat); r2Leg.position.set(sd * 0.48, 0.52, 0); r2Grp.add(r2Leg);
      const r2Foot = new T.Mesh(new T.BoxGeometry(0.26, 0.18, 0.42), whiteMat); r2Foot.position.set(sd * 0.48, 0.09, 0.04); r2Grp.add(r2Foot);
    }
    const r2Dome = new T.Mesh(sph(0.42, 12), r2DomeMat); r2Dome.position.y = 1.15; r2Grp.add(r2Dome);
    group.add(r2Grp);

    const bb8Grp = new T.Group(); bb8Grp.position.set(121.5, Y, 92.5);
    const bb8Ball = new T.Mesh(sph(0.46, 12), bb8BallMat); bb8Ball.position.y = 0.46; bb8Grp.add(bb8Ball);
    const bb8Head = new T.Group(); bb8Head.position.y = 1.02;
    const bb8Dome = new T.Mesh(sph(0.28, 10), whiteMat); bb8Head.add(bb8Dome);
    const bb8Eye = new T.Mesh(sph(0.09, 6), darkMetalMat); bb8Eye.position.set(0, 0.05, 0.24); bb8Head.add(bb8Eye);
    const bb8Ant = new T.Mesh(cyl(0.02, 0.02, 0.32, 5), darkMetalMat); bb8Ant.position.set(0.08, 0.36, -0.05); bb8Head.add(bb8Ant);
    bb8Grp.add(bb8Head);
    group.add(bb8Grp);

    // 2 Overhead Patrolling First Order TIE Fighters banking high above Black Spire Outpost!
    const tiePatrol = [];
    for (let i = 0; i < 2; i++) {
      const tg = new T.Group();
      const tPod = new T.Mesh(sph(0.85, 10), darkMetalMat); tg.add(tPod);
      const tStrut = new T.Mesh(cyl(0.18, 0.18, 3.6, 6), darkMetalMat); tStrut.rotation.z = Math.PI / 2; tg.add(tStrut);
      for (const sd of [-1, 1]) {
        const tw = new T.Mesh(new T.BoxGeometry(0.16, 3.4, 3.2), tieWingMat); tw.position.x = sd * 1.85; tg.add(tw);
      }
      group.add(tg);
      tiePatrol.push({ grp: tg, phase: i * Math.PI });
    }

    /* ---------------- Flush All Merged Static Batuu Meshes ---------------- */
    mSpire.mesh(spireMat); mCantina.mesh(cantinaMat); mArmor.mesh(armorMat); mDark.mesh(darkMetalMat);
    mWhite.mesh(whiteMat); mRed.mesh(redAccentMat); mOrange.mesh(orangeMat); mGlow.mesh(warmGlowMat); mAwn.mesh(awningMat);

    /* 6. "Millennium Falcon: Smugglers Run" — the full attraction (briefing, walk-through, cockpit mission) lives in falcon.js (TPFalcon). */
    const falcon = root.TPFalcon ? root.TPFalcon.build(T, group, {
      x: BX, y: Y, z: BZ, falcon: falconGrp, gear: landingGear,
      park: () => { falconGrp.visible = true; falconGrp.position.set(BX, Y + 1.85, BZ); falconGrp.rotation.set(0, 0.25, 0); landingGear.visible = true; }
    }) : null;
    const falconRide = falcon ? falcon.ride : null;

    function update(dt, elapsed, onEvent) {
      // Animate Batuu Courtyard R2-D2, BB-8, AT-AT sweeping head, Death Star hologram & Kylo Ren saber pulse!
      holoDeathStar.rotation.y = elapsed * 0.75;
      holoDeathStar.position.y = Y + 2.45 + Math.sin(elapsed * 2.2) * 0.14;
      kSaber.scale.x = 0.9 + Math.sin(elapsed * 28) * 0.15;
      r2Dome.rotation.y = Math.sin(elapsed * 1.8) * 1.2;
      r2Grp.position.x = 110.5 + Math.sin(elapsed * 0.45) * 3.2;
      bb8Grp.position.x = 121.5 + Math.cos(elapsed * 0.65) * 3.8;
      bb8Ball.rotation.z = -elapsed * 2.6;
      bb8Head.rotation.y = Math.sin(elapsed * 2.2) * 0.8;
      atHeadGrp.rotation.y = Math.sin(elapsed * 0.45) * 0.36;
      tiePatrol.forEach((tp) => {
        const a = elapsed * 0.42 + tp.phase;
        const px = BX + Math.cos(a) * 36, pz = BZ + Math.sin(a) * 28;
        const nx = BX + Math.cos(a + 0.06) * 36, nz = BZ + Math.sin(a + 0.06) * 28;
        tp.grp.position.set(px, Y + 26 + Math.sin(a * 2) * 2.5, pz);
        tp.grp.rotation.y = Math.atan2(nx - px, nz - pz);
        tp.grp.rotation.z = -0.32;
      });

      if (falcon) falcon.update(dt, elapsed, onEvent);
    }

    return { update, falconRide };
  }

  root.TPStarWars = { build };
})(window);
