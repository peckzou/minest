/* Trinity College - Wren Library INTERIOR (phase 1, step 3b). three.js r128 meshes built in code.
 *
 * Christopher Wren, completed 1695: a single long room on the FIRST floor over an open colonnade. Documented details
 * built here: 15 bays each side with bookcases (presses) set perpendicular to the walls between the windows; a raised
 * wooden floor in each bay; limewood (pale) carved ends on the presses with plaster busts on top; a black-and-white
 * marble floor laid DIAGONALLY down the central walk; 28 tall round-arched windows (5.03 x 2.44 m); Thorvaldsen's
 * statue of Byron at the south end; a coved plaster ceiling. Reader tables down the centre.
 *
 * The library sits at world y = wren.floorY (~6 m), over the colonnade, reached by a stair from Nevile's Court.
 *
 * Exposes TrinityWren = { build(world, THREE, tex, opts) -> { group, colliders, enterXZ } }.
 * enterXZ = [x, z] at the top of the stair, on the library floor.
 */
(function (root) {
  'use strict';
  function mergeGeoms(list) { return root.TrinityScene.mergeGeoms(list); }

  function marbleFloorTexture(THREE) {
    if (typeof document === 'undefined') return null;
    const S = 256, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d');
    // black & white squares rotated 45deg -> reads as a diagonal checker
    x.fillStyle = '#e9e6dd'; x.fillRect(0, 0, S, S);
    x.save(); x.translate(S / 2, S / 2); x.rotate(Math.PI / 4);
    const t = S / 2;
    for (let i = -3; i < 3; i++) for (let j = -3; j < 3; j++) { if ((i + j) & 1) { x.fillStyle = '#2b2b2b'; x.fillRect(i * t / 1.5, j * t / 1.5, t / 1.5, t / 1.5); } }
    x.restore();
    const tex = new THREE.CanvasTexture(c); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.anisotropy = 8; if (THREE.sRGBEncoding !== undefined) tex.encoding = THREE.sRGBEncoding;
    return tex;
  }
  function bustTexture() { return null; }

  function build(world, THREE, tex, opts) {
    const L = world.wren;
    const group = new THREE.Group();
    const colliders = [];
    const cx = L.x, z0 = L.z0, z1 = L.z1, W = L.W, Hh = L.H, fy = L.floorY;
    const xw = cx - W / 2, xe = cx + W / 2;
    const T = tex || {};
    const std = (o) => new THREE.MeshStandardMaterial(o);
    const tStone = T.stone && T.stone();
    const mWall = std({ color: 0xeee7d4, roughness: 0.9 });
    const mStone = std({ color: 0xffffff, map: tStone, roughness: 0.9 });
    const mPress = std({ color: 0x6a4a2c, roughness: 0.5 });          // oak presses
    const mLime = std({ color: 0xe9ddc2, roughness: 0.6 });           // pale limewood carving + busts
    const mBook = std({ color: 0xffffff, roughness: 0.8 });
    const mGold = std({ color: 0xcaa43a, roughness: 0.35, metalness: 0.9 });
    const mMarble = std({ color: 0xffffff, roughness: 0.2, metalness: 0.0, envMapIntensity: 0.6 });
    const mWood = std({ color: 0x7a5a36, roughness: 0.6 });
    const mTrim = std({ color: 0xf1e9d3, roughness: 0.85 });
    const tMarble = marbleFloorTexture(THREE); if (tMarble) { tMarble.repeat.set((z1 - z0) / 2.2, W / 2.2); mMarble.map = tMarble; }

    const batches = new Map();
    const UNIT = new THREE.BoxGeometry(1, 1, 1);
    const M = (x, y, z, ry, sx, sy, sz) => { const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), ry || 0); return new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), q, new THREE.Vector3(sx || 1, sy || 1, sz || 1)); };
    function add(mat, geo, m) { const g = geo.index ? geo.toNonIndexed() : geo.clone(); if (m) g.applyMatrix4(m); if (!batches.has(mat)) batches.set(mat, []); batches.get(mat).push(g); }
    function box(mat, x, y, z, w, h, d, collide) { add(mat, UNIT, M(x, y, z, 0, w, h, d)); if (collide) colliders.push({ min: { x: x - w / 2, y: y - h / 2, z: z - d / 2 }, max: { x: x + w / 2, y: y + h / 2, z: z + d / 2 } }); }
    function flush() { for (const [mat, list] of batches) { const mesh = new THREE.Mesh(mergeGeoms(list), mat); mesh.castShadow = true; mesh.receiveShadow = true; group.add(mesh); } batches.clear(); }

    /* ---- the open colonnade under the library (Doric columns along both long faces; walk through) ---- */
    {
      const nC = 12, colH = fy - 1.0;
      for (const xf of [xw - 0.3, xe + 0.3]) for (let i = 0; i <= nC; i++) {
        const z = z0 + i * ((z1 - z0) / nC);
        const g = new THREE.CylinderGeometry(0.42, 0.48, colH, 12); g.translate(xf, colH / 2, z); add(mStone, g);
        box(mStone, xf, colH + 0.12, z, 1.1, 0.24, 1.1, false);
        colliders.push({ min: { x: xf - 0.45, y: 0, z: z - 0.45 }, max: { x: xf + 0.45, y: colH, z: z + 0.45 } });
      }
    }

    /* ---- floor (diagonal marble) + walls ---- */
    { const g = new THREE.PlaneGeometry(W, z1 - z0); g.rotateX(-Math.PI / 2); g.translate(cx, fy + 0.02, (z0 + z1) / 2); add(mMarble, g); }
    box(mStone, cx, fy - 0.5, (z0 + z1) / 2, W + 1.2, 1.0, z1 - z0 + 1.2, true);          // the floor slab / colonnade top
    box(mWall, xw - 0.3, fy + Hh / 2, (z0 + z1) / 2, 0.6, Hh, z1 - z0, true);             // west wall
    box(mWall, xe + 0.3, fy + Hh / 2, (z0 + z1) / 2, 0.6, Hh, z1 - z0, true);             // east wall
    {   // north end wall with the stair door (2.4 m wide, 3.0 m high) at x = cx
      const DW = 2.4, DH = 3.0, xl = cx - (W + 1) / 2, xr = cx + (W + 1) / 2;
      box(mWall, (xl + cx - DW / 2) / 2, fy + Hh / 2, z0 - 0.3, (cx - DW / 2) - xl, Hh, 0.6, true);
      box(mWall, (cx + DW / 2 + xr) / 2, fy + Hh / 2, z0 - 0.3, xr - (cx + DW / 2), Hh, 0.6, true);
      box(mWall, cx, fy + DH + (Hh - DH) / 2, z0 - 0.3, DW, Hh - DH, 0.6, true);
    }
    box(mWall, cx, fy + Hh / 2, z1 + 0.3, W + 1, Hh, 0.6, true);                          // south end (Byron end)
    // coved ceiling
    box(mWall, cx, fy + Hh - 0.2, (z0 + z1) / 2, W + 1, 0.4, z1 - z0, false);
    box(mGold, cx, fy + Hh - 1.6, (z0 + z1) / 2, W + 0.6, 0.12, z1 - z0, false);          // cornice line

    /* ---- 28 arched windows (13 each long side + 2 at each end), 5.03 x 2.44 m ---- */
    const paneMap = opts._paneMap;
    const mPane = std({ color: 0xffffff, map: paneMap, roughness: 0.18, metalness: 0.3, emissive: 0xaeb9c4, emissiveMap: paneMap, emissiveIntensity: 0.7 });
    const nWin = 13, winW = 2.44, winH = 5.03, winY = fy + 3.0, paneM = [];
    for (const [xf, nx] of [[xw, 1], [xe, -1]]) {
      for (let i = 0; i < nWin; i++) {
        const z = z0 + 2.0 + (i + 0.5) * ((z1 - z0 - 4) / nWin);
        paneM.push(M(xf + nx * 0.18, winY, z, nx > 0 ? Math.PI / 2 : -Math.PI / 2, winW, winH, 1));
        box(mStone, xf + nx * 0.1, winY, z, 0.12, winH + 0.5, winW + 0.5, false);
        add(mStone, new THREE.TorusGeometry(winW / 2 + 0.2, 0.14, 6, 18, Math.PI), M(xf + nx * 0.1, winY + winH / 2, z, nx > 0 ? Math.PI / 2 : -Math.PI / 2, 1, 1, 1));   // round arch head
      }
    }
    { const im = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), mPane, paneM.length); paneM.forEach((m, i) => im.setMatrixAt(i, m)); im.instanceMatrix.needsUpdate = true; group.add(im); }

    /* ---- the exterior: ashlar skin, the same 28-window rhythm with arched heads, pilasters and a balustrade ---- */
    {
      const skinH = Hh + 0.9, pm = [];
      for (const [xo, nx] of [[xw - 0.64, -1], [xe + 0.64, 1]]) {
        box(mStone, xo, fy + skinH / 2 - 0.5, (z0 + z1) / 2, 0.04, skinH, z1 - z0 + 1.2, false);
        for (let i = 0; i < nWin; i++) {
          const z = z0 + 2.0 + (i + 0.5) * ((z1 - z0 - 4) / nWin);
          pm.push(M(xo + nx * 0.14, winY, z, nx > 0 ? Math.PI / 2 : -Math.PI / 2, winW, winH, 1));
          box(mTrim, xo + nx * 0.05, winY, z, 0.12, winH + 0.6, winW + 0.6, false);
          add(mTrim, new THREE.TorusGeometry(winW / 2 + 0.25, 0.16, 6, 18, Math.PI), M(xo + nx * 0.05, winY + winH / 2, z, nx > 0 ? Math.PI / 2 : -Math.PI / 2, 1, 1, 1));
          if (i > 0) { const zp = z - ((z1 - z0 - 4) / nWin) / 2; box(mTrim, xo + nx * 0.14, fy + (Hh - 1) / 2, zp, 0.3, Hh - 1, 0.55, false); }   // Ionic-style pilasters between the windows
        }
        box(mTrim, xo + nx * 0.12, fy + Hh + 0.05, (z0 + z1) / 2, 0.4, 0.3, z1 - z0 + 1.2, false);        // cornice
        box(mStone, xo + nx * 0.05, fy + Hh + 0.55, (z0 + z1) / 2, 0.25, 0.7, z1 - z0 + 1.2, false);      // balustraded parapet
        box(mTrim, xo + nx * 0.05, fy + 0.3, (z0 + z1) / 2, 0.3, 0.3, z1 - z0 + 1.2, false);             // string course at the floor line
      }
      box(mStone, cx, fy + skinH / 2 - 0.5, z1 + 0.66, W + 1.2, skinH, 0.04, false);                      // south end skin
      const mPaneOut = std({ color: 0x56626f, map: paneMap, roughness: 0.4, metalness: 0.0, envMapIntensity: 0.15 });   // seen from outside: dark glass, not glowing
      const im = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), mPaneOut, pm.length); pm.forEach((m, i) => im.setMatrixAt(i, m)); im.instanceMatrix.needsUpdate = true; group.add(im);
    }

    /* ---- 15 bays each side: presses (bookcases) perpendicular to the walls, raised bay floor ---- */
    const nBay = L.bays, pressD = 2.6, pressH = 3.6, pressW = 0.5;
    const books = { pos: [], scale: [], color: [], ids: [], meta: [], index: Object.create(null) };
    let rs = 1695; const rnd = () => { rs = (rs * 1103515245 + 12345) & 0x7fffffff; return rs / 0x7fffffff; };
    const PALE = [0x8a5a34, 0x6a3a22, 0x9a7a4a, 0x5a4a30, 0x7a4a2a, 0x3c2a1c];
    for (const [xf, nx] of [[xw, 1], [xe, -1]]) {
      for (let i = 0; i < nBay; i++) {
        const z = z0 + 1.6 + (i + 0.5) * ((z1 - z0 - 3.2) / nBay);
        const xEnd = xf + nx * (0.3 + pressD);
        // raised wooden bay floor between presses
        box(mWood, xf + nx * (pressD / 2 + 0.3), fy + 0.12, z, pressD, 0.24, (z1 - z0) / nBay - 0.7, false);
        // the press body (perpendicular to the wall)
        box(mPress, xf + nx * (pressD / 2 + 0.3), fy + 0.12 + pressH / 2, z - ((z1 - z0) / nBay) / 2 + 0.25, pressD, pressH, pressW, true);
        // shelves + books
        const shelves = [0.5, 1.2, 1.9, 2.6, 3.3];
        for (const sy of shelves) {
          box(mPress, xf + nx * (pressD / 2 + 0.3), fy + 0.12 + sy, z - ((z1 - z0) / nBay) / 2 + 0.25, pressD - 0.1, 0.05, pressW - 0.05, false);
          let a = xf + nx * 0.4; const aEnd = xf + nx * (pressD + 0.1);
          while ((nx > 0 && a < aEnd - 0.1) || (nx < 0 && a > aEnd + 0.1)) {
            const t = 0.04 + rnd() * 0.05, h = 0.42 + rnd() * 0.18;
            books.pos.push(a, fy + 0.12 + sy + h / 2 + 0.03, z - ((z1 - z0) / nBay) / 2 + 0.25);
            books.scale.push(t, h, pressW - 0.12); books.color.push(PALE[(rnd() * PALE.length) | 0]);
            books.ids.push((nx > 0 ? 'W' : 'E') + i + '-' + Math.round(sy * 10) + '-' + books.ids.length);
            books.meta.push({ bay: i });
            a += nx * (t + 0.006);
          }
        }
        // the carved limewood end facing the central walk, with a plaster bust on top
        box(mLime, xEnd, fy + 0.12 + pressH / 2, z - ((z1 - z0) / nBay) / 2 + 0.25, 0.12, pressH, pressW + 0.1, false);
        box(mGold, xEnd, fy + 0.12 + pressH - 0.1, z - ((z1 - z0) / nBay) / 2 + 0.25, 0.14, 0.14, pressW + 0.15, false);
        // bust: a little pillar + head
        box(mLime, xEnd, fy + 0.12 + pressH + 0.2, z - ((z1 - z0) / nBay) / 2 + 0.25, 0.3, 0.4, 0.3, false);
        const head = new THREE.SphereGeometry(0.16, 10, 8); head.translate(xEnd, fy + 0.12 + pressH + 0.55, z - ((z1 - z0) / nBay) / 2 + 0.25); add(mLime, head);
        // low press backing against the wall under the window (the "lectern" cases)
        box(mPress, xf + nx * 0.35, fy + 0.6, z, 0.5, 1.2, (z1 - z0) / nBay - 0.8, true);
      }
    }

    /* ---- reader tables + the Byron statue at the south end ---- */
    for (let i = 0; i < 4; i++) {
      const z = z0 + 6 + i * ((z1 - z0 - 12) / 3);
      box(mWood, cx, fy + 0.75, z, 1.4, 0.07, 1.4, true);
      for (const dx of [-0.6, 0.6]) for (const dz of [-0.6, 0.6]) box(mWood, cx + dx, fy + 0.38, z + dz, 0.08, 0.72, 0.08, false);
    }
    {
      const bz = z1 - 2.6;
      box(mStone, cx, fy + 0.6, bz, 1.4, 1.2, 1.4, true);                                 // pedestal
      box(mGold, cx, fy + 1.24, bz, 1.5, 0.1, 1.5, false);
      const body = new THREE.CylinderGeometry(0.3, 0.42, 1.5, 12); body.translate(cx, fy + 1.2 + 0.75, bz); add(mLime, body);   // seated figure (proxy)
      const torso = new THREE.BoxGeometry(0.7, 0.7, 0.5); torso.translate(cx, fy + 2.6, bz); add(mLime, torso);
      const head = new THREE.SphereGeometry(0.22, 12, 9); head.translate(cx, fy + 3.1, bz - 0.05); add(mLime, head);
    }

    flush();

    /* ---- books instanced ---- */
    const nB = books.ids.length;
    const bookMesh = new THREE.InstancedMesh(UNIT, mBook, nB);
    const col = new THREE.Color();
    for (let i = 0; i < nB; i++) { bookMesh.setMatrixAt(i, M(books.pos[i * 3], books.pos[i * 3 + 1], books.pos[i * 3 + 2], 0, books.scale[i * 3], books.scale[i * 3 + 1], books.scale[i * 3 + 2])); bookMesh.setColorAt(i, col.setHex(books.color[i])); }
    bookMesh.instanceMatrix.needsUpdate = true; if (bookMesh.instanceColor) bookMesh.instanceColor.needsUpdate = true;
    bookMesh.castShadow = true; group.add(bookMesh);

    /* ---- the stair up to the library door (a stair tower against the north end; ascends toward +z) ---- */
    const steps = 15, run = 0.45, rise = fy / steps, zTop = z0 - 0.6, zBot = zTop - steps * run;
    for (let i = 0; i < steps; i++) box(mStone, cx, (i + 1) * rise / 2, zBot + (i + 0.5) * run, 2.4, (i + 1) * rise, run, true);   // solid steps
    for (const sx of [-1, 1]) {
      box(mStone, cx + sx * 1.3, (fy + 1.2) / 2, (zBot + zTop) / 2, 0.2, fy + 1.2, zTop - zBot, true);                           // stair-tower side walls
    }
    box(mStone, cx, fy + 1.2, zBot - 0.1, 2.8, 0.2, 0.2, false);
    const stairZ = zBot;

    // soft interior fill
    const f1 = new THREE.PointLight(0xffe9c8, 0.5, 40, 1.6); f1.position.set(cx, fy + 5, z0 + 8); group.add(f1);
    const f2 = new THREE.PointLight(0xffe9c8, 0.5, 40, 1.6); f2.position.set(cx, fy + 5, z1 - 8); group.add(f2);
    const fh = new THREE.HemisphereLight(0xf4ecd8, 0x3a2c1e, 0.4); group.add(fh);

    return { group, colliders, enterXZ: [cx, zBot - 1], books: bookMesh, bookCount: nB, stairZ };
  }

  root.TrinityWren = { build };
  if (typeof module !== 'undefined') module.exports = root.TrinityWren;
})(typeof window !== 'undefined' ? window : globalThis);
