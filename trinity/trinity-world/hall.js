/* Trinity College - Great Hall INTERIOR (phase 1, step 2). three.js r128 meshes built in code.
 *
 * The hall is 100 x 40 x 50 ft = 30.5 x 12.2 x 15.2 m (documented size). Built here: oak linenfold panelling with a
 * carved frieze; the hammerbeam roof (tie beams, hammer beams on carved braces, arch braces, king posts, purlins) with
 * a louvre opening; the raised dais with High Table at the north end; long tables and benches down the body; the oak
 * screen and the minstrels' gallery over the screens passage at the south end; the tall oriel bay on the west wall;
 * clerestory windows; and a row of portraits in gilt frames along both walls, Elizabeth I over High Table.
 *
 * The portraits are procedural PLACEHOLDERS. Real public-domain images (the sitters died centuries ago; use PD-Art
 * files from Wikimedia Commons, NOT CC BY-SA photos) go in trinity/assets/portraits/<id>.jpg and are loaded over http(s).
 *
 * Exposes TrinityHall = { build(hall, THREE, tex, opts) -> { group, colliders, doorZ } } where hall = world.hall.
 * The group is positioned in WORLD space (centred on hall.x, spanning hall.z0..z1), so it drops straight into the scene.
 */
(function (root) {
  'use strict';
  function mergeGeoms(list) { return root.TrinityScene.mergeGeoms(list); }   // scene.js is loaded by the time build() runs

  // the portraits: id, label, and the vertical position (High Table end first)
  const PORTRAITS = [
    { id: 'elizabeth_i', label: '伊丽莎白一世 Elizabeth I', head: true },
    { id: 'henry_viii', label: '亨利八世 Henry VIII (founder)' },
    { id: 'newton', label: '牛顿 Isaac Newton' },
    { id: 'bacon', label: '培根 Francis Bacon' },
    { id: 'byron', label: '拜伦 Lord Byron' },
    { id: 'tennyson', label: '丁尼生 Alfred Tennyson' },
    { id: 'macaulay', label: '麦考莱 Thomas Macaulay' },
    { id: 'whewell', label: '休厄尔 William Whewell' },
    { id: 'thompson', label: 'W. H. Thompson' },
    { id: 'barrow', label: 'Isaac Barrow' }
  ];

  function portraitTexture(THREE, p, i) {
    if (typeof document === 'undefined') return null;
    const c = document.createElement('canvas'); c.width = 256; c.height = 340;
    const x = c.getContext('2d');
    // a dark Tudor portrait: brown ground, a robed figure, a pale face, a gilt collar
    const seed = i * 97 + 13; let a = seed; const r = () => { a = (a * 1103515245 + 12345) & 0x7fffffff; return a / 0x7fffffff; };
    const bg = x.createLinearGradient(0, 0, 0, 340); bg.addColorStop(0, '#3a2c20'); bg.addColorStop(1, '#17100a');
    x.fillStyle = bg; x.fillRect(0, 0, 256, 340);
    // robe
    x.fillStyle = p.head ? '#6a1f2a' : ['#2a2a33', '#40321f', '#3a1f28', '#223028'][i % 4];
    x.beginPath(); x.moveTo(60, 340); x.quadraticCurveTo(50, 190, 100, 150); x.lineTo(156, 150); x.quadraticCurveTo(206, 190, 196, 340); x.closePath(); x.fill();
    // fur / collar
    x.fillStyle = p.head ? '#d8c074' : '#b7aa8c'; x.fillRect(96, 150, 64, 20);
    x.fillStyle = 'rgba(0,0,0,0.25)'; x.fillRect(96, 168, 64, 4);
    // ruff / chain
    if (r() < 0.6) { x.strokeStyle = '#e6dcc2'; x.lineWidth = 7; x.beginPath(); x.arc(128, 150, 26, 0.2, Math.PI - 0.2); x.stroke(); }
    else { x.fillStyle = '#d9b24a'; for (let k = 0; k < 7; k++) x.fillRect(100 + k * 9, 150 + Math.sin(k) * 3 + 6, 6, 6); }
    // head + hair/hat
    x.fillStyle = '#e4c3a2'; x.beginPath(); x.ellipse(128, 110, 26, 32, 0, 0, 7); x.fill();
    x.fillStyle = ['#2a1d12', '#403020', '#1a1410'][i % 3];
    if (p.head) { x.beginPath(); x.ellipse(128, 86, 34, 20, 0, Math.PI, 0); x.fill(); x.fillRect(96, 74, 64, 14); }   // crown band
    else { x.beginPath(); x.ellipse(128, 84, 30, 22, 0, Math.PI, 0); x.fill(); }
    if (p.head) { x.fillStyle = '#d9b24a'; for (let k = 0; k < 5; k++) { x.beginPath(); x.moveTo(104 + k * 12, 74); x.lineTo(110 + k * 12, 60); x.lineTo(116 + k * 12, 74); x.fill(); } }
    // eyes
    x.fillStyle = '#2a2018'; x.fillRect(118, 108, 4, 3); x.fillRect(135, 108, 4, 3);
    // crackle varnish
    x.strokeStyle = 'rgba(0,0,0,0.08)'; x.lineWidth = 1; for (let k = 0; k < 40; k++) { x.beginPath(); x.moveTo(r() * 256, r() * 340); x.lineTo(r() * 256, r() * 340); x.stroke(); }
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4; if (THREE.sRGBEncoding !== undefined) t.encoding = THREE.sRGBEncoding;
    return t;
  }

  function build(hall, THREE, tex, opts) {
    opts = opts || {};
    const group = new THREE.Group();
    const colliders = [];
    const cx = hall.x, z0 = hall.z0, z1 = hall.z1, W = hall.W, Hh = hall.H, EAVE = hall.EAVE;
    const xw = cx - W / 2, xe = cx + W / 2;           // west / east inner faces
    const T = tex || {};
    const std = (o) => new THREE.MeshStandardMaterial(o);
    const tStone = T.stone && T.stone(), tSlab = T.slab && T.slab();
    const mPlaster = std({ color: 0xece3cf, roughness: 0.95 });
    const mFloor = std({ color: 0x6e5134, roughness: 0.6 });                      // oak board floor
    const mDais = std({ color: 0x4e3a24, roughness: 0.6 });
    const mOak = std({ color: 0x5a3e24, roughness: 0.5 });
    const mOakD = std({ color: 0x432d19, roughness: 0.55 });
    const mGold = std({ color: 0xcaa43a, roughness: 0.35, metalness: 0.9 });
    const mStone = std({ color: 0xffffff, map: tStone, roughness: 0.9 });
    const mLinen = std({ color: 0xf1ead6, roughness: 0.9 });

    const batches = new Map();
    const UNIT = new THREE.BoxGeometry(1, 1, 1);
    function add(mat, geo, m) { const g = geo.index ? geo.toNonIndexed() : geo.clone(); if (m) g.applyMatrix4(m); if (!batches.has(mat)) batches.set(mat, []); batches.get(mat).push(g); }
    const M = (x, y, z, ry, sx, sy, sz) => { const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), ry || 0); return new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), q, new THREE.Vector3(sx || 1, sy || 1, sz || 1)); };
    function box(mat, x, y, z, w, h, d, collide, ry) { add(mat, UNIT, M(x, y, z, ry || 0, w, h, d)); if (collide) colliders.push({ min: { x: x - w / 2, y: y - h / 2, z: z - d / 2 }, max: { x: x + w / 2, y: y + h / 2, z: z + d / 2 } }); }
    function flush() { for (const [mat, list] of batches) { const mesh = new THREE.Mesh(mergeGeoms(list), mat); mesh.castShadow = true; mesh.receiveShadow = true; group.add(mesh); } batches.clear(); }

    /* ---- floor, dais ---- */
    { const g = new THREE.PlaneGeometry(W, z1 - z0); g.rotateX(-Math.PI / 2); g.translate(cx, 0.02, (z0 + z1) / 2); add(mFloor, g); }
    const daisZ0 = z0, daisZ1 = z0 + 3.4, daisH = 0.35;
    box(mDais, cx, daisH / 2, (daisZ0 + daisZ1) / 2, W - 0.2, daisH, daisZ1 - daisZ0, true);

    /* ---- walls + linenfold panelling + frieze ---- */
    function wall(xface, nx, doorZ) {
      if (doorZ != null) {                                            // split the wall around the court doorway
        const GW = 2.4, GH = 5.6;
        box(mPlaster, xface - nx * 0.15, EAVE / 2 + 0.3, (z0 + doorZ - GW / 2) / 2, 0.3, EAVE, (doorZ - GW / 2) - z0, true);
        box(mPlaster, xface - nx * 0.15, EAVE / 2 + 0.3, (doorZ + GW / 2 + z1) / 2, 0.3, EAVE, z1 - (doorZ + GW / 2), true);
        box(mPlaster, xface - nx * 0.15, (GH + EAVE) / 2 + 0.3, doorZ, 0.3, EAVE - GH, GW, true);
      } else {
        box(mPlaster, xface - nx * 0.15, EAVE / 2 + 0.3, (z0 + z1) / 2, 0.3, EAVE, z1 - z0, true);
      }
      // dado + panels up to 4.0 m
      box(mOakD, xface + nx * 0.07, 0.3, (z0 + z1) / 2, 0.08, 0.6, z1 - z0, false);
      box(mOak, xface + nx * 0.06, 2.2, (z0 + z1) / 2, 0.1, 3.4, z1 - z0, false);
      const n = Math.round((z1 - z0) / 0.62);
      for (let i = 0; i <= n; i++) box(mOakD, xface + nx * 0.1, 2.2, z0 + i * ((z1 - z0) / n), 0.04, 3.4, 0.05, false);   // stiles
      box(mGold, xface + nx * 0.11, 4.0, (z0 + z1) / 2, 0.06, 0.14, z1 - z0, false);                                     // gilt frieze rail
      box(mOak, xface + nx * 0.09, 4.2, (z0 + z1) / 2, 0.12, 0.3, z1 - z0, false);                                       // cornice
    }
    wall(xw, 1, hall.z1 - 3.2); wall(xe, -1, hall.doorZ);   // west wall has the link doorway to Nevile's Court
    // north (High Table) wall and south (screen) wall
    box(mPlaster, cx, EAVE / 2 + 0.3, z0 - 0.15, W, EAVE, 0.3, true);
    box(mPlaster, cx, EAVE / 2 + 0.3, z1 + 0.15, W, EAVE, 0.3, true);
    box(mOak, cx, 2.2, z0 + 0.1, W, 3.4, 0.12, false);                                                                  // panelling behind High Table

    /* ---- clerestory windows (upper walls, both sides) ---- */
    const paneMap = (function () {
      if (typeof document === 'undefined') return null;
      const c = document.createElement('canvas'); c.width = 64; c.height = 96; const x = c.getContext('2d');
      const g = x.createLinearGradient(0, 0, 0, 96); g.addColorStop(0, '#9fb4c8'); g.addColorStop(1, '#5a6b7c'); x.fillStyle = g; x.fillRect(0, 0, 64, 96);
      x.strokeStyle = '#d9d2bf'; x.lineWidth = 2; x.beginPath(); x.moveTo(32, 0); x.lineTo(32, 96); x.stroke(); for (const y of [32, 64]) { x.beginPath(); x.moveTo(0, y); x.lineTo(64, y); x.stroke(); }
      const t = new THREE.CanvasTexture(c); if (THREE.sRGBEncoding !== undefined) t.encoding = THREE.sRGBEncoding; return t;
    })();
    const mPane = std({ color: 0xffffff, map: paneMap, roughness: 0.2, metalness: 0.3, emissive: 0x222c38, emissiveMap: paneMap, emissiveIntensity: 0.5 });
    const clerW = 1.5, clerH = 2.6, clerY = 5.6;
    const nc = 6;
    for (const [xf, nx] of [[xw, 1], [xe, -1]]) {
      for (let i = 0; i < nc; i++) {
        const z = z0 + 3 + (i + 0.5) * ((z1 - z0 - 5) / nc);
        if (nx < 0 && Math.abs(z - hall.doorZ) < 1.8) continue;        // leave the door gap on the court side
        const pane = new THREE.Mesh(new THREE.PlaneGeometry(clerW, clerH), mPane); pane.position.set(xf + nx * 0.16, clerY, z); pane.rotation.y = nx > 0 ? Math.PI / 2 : -Math.PI / 2; group.add(pane);
        box(mStone, xf + nx * 0.12, clerY, z, 0.1, clerH + 0.4, clerW + 0.4, false);
      }
    }

    /* ---- the great oriel bay on the west wall, near High Table ---- */
    {
      const oz = z0 + 4.2, ow = 3.4, od = 1.6;
      box(mStone, xw - od, 0, oz, ow + 0.8, 0.01, 0.01, false);
      box(mStone, xw - od / 2, 3.2, oz - ow / 2, od, 6.4, 0.3, true);
      box(mStone, xw - od / 2, 3.2, oz + ow / 2, od, 6.4, 0.3, true);
      box(mStone, xw - od, 3.2, oz, 0.3, 6.4, ow, true);
      const big = new THREE.Mesh(new THREE.PlaneGeometry(ow - 0.4, 5.4), mPane); big.position.set(xw - od + 0.18, 3.4, oz); big.rotation.y = Math.PI / 2; group.add(big);
      const sideF = new THREE.Mesh(new THREE.PlaneGeometry(od - 0.3, 5.4), mPane); sideF.position.set(xw - od / 2, 3.4, oz - ow / 2 + 0.16); group.add(sideF);
      const sideB = sideF.clone(); sideB.position.z = oz + ow / 2 - 0.16; group.add(sideB);
      const roof = new THREE.Mesh(new THREE.BoxGeometry(od + 0.3, 0.3, ow + 0.3), mStone); roof.position.set(xw - od / 2, 6.5, oz); group.add(roof);
    }

    /* ---- High Table + the long tables and benches ---- */
    function table(x, z, w, len) {                                    // along z
      box(mOak, x, 0.78 + (z < daisZ1 ? daisH : 0), z, w, 0.07, len, true);
      for (const dz of [-len / 2 + 0.5, len / 2 - 0.5]) { box(mOakD, x, 0.39 + (z < daisZ1 ? daisH : 0), z + dz, w - 0.2, 0.78, 0.1, false); }
    }
    function bench(x, z, len) { box(mOak, x, 0.47, z, 0.32, 0.07, len, false); box(mOakD, x, 0.23, z - len / 2 + 0.3, 0.3, 0.46, 0.08, false); box(mOakD, x, 0.23, z + len / 2 - 0.3, 0.3, 0.46, 0.08, false); }
    table(cx, z0 + 1.7, 1.2, 3.0);                                    // High Table (across the dais)
    { const hb = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.9, 0.12), mOak); hb.position.set(cx, 0.45 + daisH, z0 + 1.0); group.add(hb); }   // the master's chair back
    const bodyZ0 = daisZ1 + 1.2, bodyZ1 = z1 - 5.2, len = bodyZ1 - bodyZ0;
    for (const x of [cx - 3.0, cx + 3.0]) { table(x, (bodyZ0 + bodyZ1) / 2, 1.1, len); bench(x - 0.9, (bodyZ0 + bodyZ1) / 2, len); bench(x + 0.9, (bodyZ0 + bodyZ1) / 2, len); }

    /* ---- the oak screen + minstrels' gallery at the south end ---- */
    {
      const sz = z1 - 4.2;
      box(mOak, cx, 2.1, sz, W - 0.2, 4.2, 0.4, true);                                     // screen body
      // two doorways through the screen
      for (const dx of [-3.0, 3.0]) box(mPlaster, cx + dx, 1.3, sz, 2.0, 2.6, 0.5, false);  // (a dark opening look: a recessed panel)
      for (let i = 0; i < 7; i++) box(mOakD, cx - 5.4 + i * 1.8, 2.1, sz - 0.21, 0.16, 4.0, 0.08, false);   // carved bays
      box(mGold, cx, 4.0, sz, W - 0.2, 0.16, 0.5, false);
      // the gallery floor + front
      box(mDais, cx, 4.3, (sz + z1) / 2, W - 0.4, 0.2, z1 - sz, true);
      box(mOak, cx, 4.9, sz + 0.1, W - 0.4, 1.2, 0.18, false);
      for (let i = 0; i < 9; i++) box(mOak, cx - 5 + i * 1.25, 5.3, sz + 0.1, 0.1, 0.8, 0.1, false);
      box(mGold, cx, 5.75, sz + 0.1, W - 0.4, 0.1, 0.2, false);
    }

    /* ---- the hammerbeam roof (all timbers batched into mOak / mOakD) ---- */
    {
      const apexY = Hh;
      // two ceiling slopes (rotate a box into a tilted plank, batched)
      const slopeLen = Math.hypot(W / 2, apexY - EAVE);
      const ang = Math.atan2(apexY - EAVE, W / 2);
      for (const sgn of [-1, 1]) add(mOakD, UNIT, M(cx + sgn * W / 4, (EAVE + apexY) / 2, (z0 + z1) / 2, 0, slopeLen, 0.2, z1 - z0).multiply(new THREE.Matrix4().makeRotationZ(-sgn * (ang))));
      const nT = 6;
      for (let i = 0; i <= nT; i++) {
        const z = z0 + 0.6 + i * ((z1 - z0 - 1.2) / nT);
        box(mOak, cx, EAVE + 0.2, z, W - 0.4, 0.4, 0.3, false);                                   // tie beam
        for (const sgn of [-1, 1]) {
          box(mOak, cx + sgn * (W / 2 - 1.0), EAVE + 0.5, z, 1.8, 0.35, 0.28, false);             // hammer beam
          add(mOak, UNIT, M(cx + sgn * (W / 2 - 0.4), EAVE - 0.9, z, 0, 0.25, 2.0, 0.26).multiply(new THREE.Matrix4().makeRotationZ(sgn * 0.5)));   // brace
          box(mOak, cx + sgn * (W / 2 - 1.7), EAVE + 1.4, z, 0.26, 2.2, 0.26, false);             // hammer post
          add(mOak, UNIT, M(cx + sgn * (W / 2 - 2.6), EAVE + 2.6, z, 0, 0.22, 3.4, 0.24).multiply(new THREE.Matrix4().makeRotationZ(sgn * 0.62)));  // arch brace
        }
        box(mOak, cx, (EAVE + apexY) / 2 + 0.6, z, 0.3, apexY - EAVE - 0.3, 0.3, false);           // king post
      }
      for (const yz of [[EAVE + 1.6, W / 2 - 1.8], [EAVE + 3.0, W / 2 - 3.2]]) for (const sgn of [-1, 1]) box(mOakD, cx + sgn * yz[1], yz[0], (z0 + z1) / 2, 0.18, 0.2, z1 - z0, false);
      box(mOakD, cx, apexY - 0.3, (z0 + z1) / 2, 0.24, 0.24, z1 - z0, false);                      // ridge
      box(mOak, cx, apexY - 0.1, z0 + (z1 - z0) * 0.42, 1.6, 0.6, 2.0, false);                     // louvre
    }

    /* ---- portraits in gilt frames ---- */
    const frames = [];
    function portrait(p, i, x, y, z, ry, w, h) {
      const t = (opts.portraitTex ? opts.portraitTex(p, i) : portraitTexture(THREE, p, i));
      const canvas = new THREE.Mesh(new THREE.PlaneGeometry(w, h), std({ color: 0xffffff, map: t, roughness: 0.6 }));
      canvas.position.set(x, y, z); canvas.rotation.y = ry; group.add(canvas);
      box(mGold, x, y + h / 2 + 0.12, z, (ry ? 0.1 : w + 0.3), 0.24, (ry ? h + 0.3 : 0.1), false);
      box(mGold, x, y - h / 2 - 0.12, z, (ry ? 0.1 : w + 0.3), 0.24, (ry ? h + 0.3 : 0.1), false);
      box(mGold, x + (ry ? 0 : -w / 2 - 0.12), y, z + (ry ? -h / 2 - 0.12 : 0), 0.12, h + 0.3, 0.12, false);
      box(mGold, x + (ry ? 0 : w / 2 + 0.12), y, z + (ry ? h / 2 + 0.12 : 0), 0.12, h + 0.3, 0.12, false);
      frames.push({ id: p.id, label: p.label });
    }
    // Elizabeth I over High Table (north wall), larger
    portrait(PORTRAITS[0], 0, cx, 5.4, z0 + 0.3, 0, 2.2, 3.0);
    // the rest alternate down the two long walls
    let k = 1;
    for (let i = 0; i < 4; i++) {
      const z = daisZ1 + 1.5 + i * 4.0;
      portrait(PORTRAITS[k++] || PORTRAITS[1], k, xw + 0.2, 4.9, z, Math.PI / 2, 1.3, 1.9); if (k >= PORTRAITS.length) k = 1;
      portrait(PORTRAITS[k++] || PORTRAITS[1], k, xe - 0.2, 4.9, z, -Math.PI / 2, 1.3, 1.9); if (k >= PORTRAITS.length) k = 1;
    }

    flush();
    return { group, colliders, doorZ: hall.doorZ, frames, portraits: PORTRAITS };
  }

  root.TrinityHall = { build, PORTRAITS };
  if (typeof module !== 'undefined') module.exports = root.TrinityHall;
})(typeof window !== 'undefined' ? window : globalThis);
