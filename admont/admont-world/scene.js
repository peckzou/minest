/* Admont Abbey Library - three.js MESH builders (Option D).
 *
 * Assembles the architecture shell (marble floor, long side walls with window openings,
 * flat side ceilings and the central dome drum) plus ONE fully finished two-storey
 * white+gold bookcase section filled with INSTANCED book spines. No per-book meshes;
 * InstancedMesh / merged geometry keep the draw call count low (target < 80).
 *
 * The richer FEAT-002 content (7 frescoes, 16 sculptures, marble shader, windows glass,
 * collect-books hook) is out of scope here but the builders are structured so those slot
 * in cleanly: buildArch() returns named groups, addBookcase() is parameterised per wing.
 *
 * Exposes global AdmontScene = { build(world, THREE, tex) -> { group, colliders } }.
 * colliders = array of axis-aligned boxes {min:{x,y,z}, max:{x,y,z}} the app uses for
 * wall + bookcase collision so the player cannot leave the shell.
 */
(function (root) {
  'use strict';

  // ---- palette (white + gold Baroque scheme) -------------------------
  const C = {
    marble: 0xece6da,
    wallWhite: 0xf6f2e9,
    gold: 0xd9b24a,
    goldBright: 0xf0d27a,
    caseWhite: 0xf3ecdd,
    ceiling: 0xf1ede2,
    dome: 0xf4efe4,
    frescoStub: 0xdcd2bf,   // a neutral stub where FEAT-002 drops the painted frescoes
    shelfBack: 0x8a6a46
  };

  function build(world, THREE, tex) {
    const group = new THREE.Group();
    const colliders = [];

    const X0 = world.X0, X1 = world.X1, Z0 = world.Z0, Z1 = world.Z1;
    const W = world.W, D = world.D, H = world.H, DOME_H = world.DOME_H;
    const WALL_T = 0.6;   // wall thickness

    // ---- materials ---------------------------------------------------
    const mMarble = new THREE.MeshStandardMaterial({ color: C.marble, roughness: 0.25, metalness: 0.05 });
    if (tex && tex.marbleFloor) { const t = tex.marbleFloor(); if (t) mMarble.map = t; }
    const mWall = new THREE.MeshStandardMaterial({ color: C.wallWhite, roughness: 0.85, metalness: 0.0 });
    if (tex && tex.stuccoWall) { const t = tex.stuccoWall(); if (t) mWall.map = t; }
    const mGold = new THREE.MeshStandardMaterial({ color: C.gold, roughness: 0.35, metalness: 0.8, emissive: 0x3a2c08, emissiveIntensity: 0.15 });
    if (tex && tex.goldTrim) { const t = tex.goldTrim(); if (t) mGold.map = t; }
    const mCeil = new THREE.MeshStandardMaterial({ color: C.ceiling, roughness: 0.9, metalness: 0.0 });
    const mDome = new THREE.MeshStandardMaterial({ color: C.dome, roughness: 0.9, metalness: 0.0, side: THREE.BackSide });
    const mFresco = new THREE.MeshStandardMaterial({ color: C.frescoStub, roughness: 0.95, metalness: 0.0, side: THREE.DoubleSide });
    const mCase = new THREE.MeshStandardMaterial({ color: C.caseWhite, roughness: 0.7, metalness: 0.0 });
    if (tex && tex.woodCase) { const t = tex.woodCase(); if (t) mCase.map = t; }
    const mBooks = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8, metalness: 0.0, vertexColors: false });
    if (tex && tex.bookSpines) { const t = tex.bookSpines(); if (t) mBooks.map = t; }
    const mShelfBack = new THREE.MeshStandardMaterial({ color: C.shelfBack, roughness: 0.9, metalness: 0.0 });

    // ---- helper: an axis-aligned box mesh + collider -----------------
    function box(w, h, d, mat, x, y, z, addCollide) {
      const g = new THREE.BoxGeometry(w, h, d);
      const m = new THREE.Mesh(g, mat);
      m.position.set(x, y, z);
      m.castShadow = true; m.receiveShadow = true;
      group.add(m);
      if (addCollide) {
        colliders.push({
          min: { x: x - w / 2, y: y - h / 2, z: z - d / 2 },
          max: { x: x + w / 2, y: y + h / 2, z: z + d / 2 }
        });
      }
      return m;
    }

    // ---- floor (marble) ----------------------------------------------
    {
      const g = new THREE.PlaneGeometry(W, D);
      const m = new THREE.Mesh(g, mMarble);
      m.rotation.x = -Math.PI / 2; m.position.set(0, 0, 0);
      m.receiveShadow = true;
      group.add(m);
    }

    // ---- long side walls (with window openings) ----------------------
    // Rather than boolean-cut openings, we build each wall as a row of solid piers
    // separated by window gaps. This keeps geometry simple and draw calls low while
    // giving the "natural lighting" reading of tall windows down both sides.
    function sideWall(zc, sign) {
      // piers every ~5 m, window gap ~2.6 m between them
      const PITCH = 5.0, PIER_W = 2.4, WIN_H = 5.5, SILL = 2.0;
      const n = Math.round(W / PITCH);
      const step = W / n;
      for (let i = 0; i <= n; i++) {
        const x = X0 + i * step;
        // full-height pier
        box(PIER_W, H, WALL_T, mWall, x, H / 2, zc, true);
        // gilt pilaster strip on the inward face of each pier
        box(0.3, H - 1.2, 0.08, mGold, x, (H - 1.2) / 2 + 0.3, zc - sign * (WALL_T / 2 + 0.05), false);
      }
      // spandrel strips above and below the windows so the wall reads solid between piers
      for (let i = 0; i < n; i++) {
        const x = X0 + i * step + step / 2;
        const gapW = step - PIER_W;
        box(gapW, SILL, WALL_T, mWall, x, SILL / 2, zc, true);                     // below sill
        box(gapW, H - (SILL + WIN_H), WALL_T, mWall, x, (SILL + WIN_H) + (H - SILL - WIN_H) / 2, zc, true); // above window
      }
      // a continuous gilt cornice band along the top of the wall
      box(W, 0.5, WALL_T + 0.2, mGold, 0, H - 0.25, zc, false);
      // a gilt gallery rail band at the mezzanine level (two-storey reading)
      box(W, 0.25, WALL_T + 0.15, mGold, 0, 4.4, zc, false);
    }
    sideWall(Z0, -1);   // north-z wall
    sideWall(Z1, +1);   // south-z wall

    // ---- end walls (north / south ends of the 70 m hall) -------------
    function endWall(xc, sign) {
      // solid end wall with a central doorway opening (the arched threshold)
      const DOOR_W = 2.6, DOOR_H = 4.6;
      const sideW = (D - DOOR_W) / 2;
      box(WALL_T, H, sideW, mWall, xc, H / 2, Z0 + sideW / 2, true);
      box(WALL_T, H, sideW, mWall, xc, H / 2, Z1 - sideW / 2, true);
      box(WALL_T, H - DOOR_H, DOOR_W, mWall, xc, DOOR_H + (H - DOOR_H) / 2, 0, true);  // lintel above the door
      // gilt arch surround around the doorway
      box(WALL_T + 0.1, 0.3, DOOR_W + 0.8, mGold, xc, DOOR_H + 0.15, 0, false);
    }
    endWall(X0, +1);    // north end
    endWall(X1, -1);    // south end

    // ---- flat side-hall ceilings (the two wings) ---------------------
    function wingCeiling(cx0, cx1) {
      const len = cx1 - cx0, cen = (cx0 + cx1) / 2;
      const g = new THREE.PlaneGeometry(len, D);
      const m = new THREE.Mesh(g, mCeil);
      m.rotation.x = Math.PI / 2; m.position.set(cen, H, 0);
      m.receiveShadow = true;
      group.add(m);
      // the painted fresco panels sit just below the ceiling (FEAT-002 fills these).
      // We lay a neutral stub panel per wing so the ceiling is not a blank plane.
      const fg = new THREE.PlaneGeometry(len - 2, D - 3);
      const fm = new THREE.Mesh(fg, mFresco);
      fm.rotation.x = Math.PI / 2; fm.position.set(cen, H - 0.05, 0);
      group.add(fm);
      // a gilt frame around the fresco stub
      box(len - 1.6, 0.12, 0.2, mGold, cen, H - 0.1, (D - 3) / 2 - 0.1, false);
      box(len - 1.6, 0.12, 0.2, mGold, cen, H - 0.1, -((D - 3) / 2 - 0.1), false);
    }
    wingCeiling(X0, world.NORTH_X1);
    wingCeiling(world.SOUTH_X0, X1);

    // ---- central dome drum + dome ------------------------------------
    {
      const r = world.ROT_HALF;       // the rotunda half-length ~ its radius footprint
      const domeR = Math.min(r, D / 2 + 2);
      // the drum: a short cylinder rising from the cornice to the dome spring line
      const drumG = new THREE.CylinderGeometry(domeR, domeR, (DOME_H - H) * 0.35, 48, 1, true);
      const drumM = new THREE.Mesh(drumG, new THREE.MeshStandardMaterial({ color: C.wallWhite, roughness: 0.85, side: THREE.BackSide }));
      drumM.position.set(0, H + (DOME_H - H) * 0.35 / 2, 0);
      group.add(drumM);
      // the dome itself: an upper hemisphere, seen from the inside
      const domeG = new THREE.SphereGeometry(domeR, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2);
      const domeM = new THREE.Mesh(domeG, mDome);
      domeM.position.set(0, H + (DOME_H - H) * 0.35, 0);
      domeM.scale.y = (DOME_H - (H + (DOME_H - H) * 0.35)) / domeR;
      group.add(domeM);
      // a gilt ring at the dome spring line
      const ringG = new THREE.TorusGeometry(domeR - 0.1, 0.12, 8, 48);
      const ringM = new THREE.Mesh(ringG, mGold);
      ringM.rotation.x = Math.PI / 2; ringM.position.set(0, H + (DOME_H - H) * 0.35, 0);
      group.add(ringM);
    }

    // ---- ONE finished two-storey white+gold bookcase section ----------
    // Built along the north-z wall of the SOUTH wing. Two tiers of shelves with a
    // gilt-framed white carcase and INSTANCED book spines (one InstancedMesh total).
    function addBookcase(xStart, xEnd, zWall, faceSign) {
      const bcDepth = 0.55, bcH = 8.2;    // two storeys of shelving
      const len = xEnd - xStart, cen = (xStart + xEnd) / 2;
      const zFace = zWall - faceSign * (WALL_T / 2 + bcDepth / 2 + 0.05);

      // the white carcase back + top/bottom rails (one box each)
      box(len, bcH, 0.12, mCase, cen, bcH / 2, zWall - faceSign * (WALL_T / 2 + 0.06), true);
      box(len, 0.2, bcDepth, mGold, cen, 0.1, zFace, false);              // plinth (gilt)
      box(len, 0.25, bcDepth, mGold, cen, 4.2, zFace, false);             // mid gallery band (gilt)
      box(len, 0.3, bcDepth, mGold, cen, bcH - 0.15, zFace, false);       // cornice (gilt)

      // vertical gilt pilasters dividing the bays
      const BAY = 1.9;
      const bays = Math.max(1, Math.round(len / BAY));
      const bw = len / bays;
      for (let i = 0; i <= bays; i++) {
        const x = xStart + i * bw;
        box(0.14, bcH, bcDepth, mCase, x, bcH / 2, zFace, false);
        box(0.06, bcH - 0.4, 0.04, mGold, x, bcH / 2, zFace + faceSign * (bcDepth / 2 + 0.02), false);
      }

      // horizontal shelves (two tiers, several shelves each)
      const shelfYs = [0.5, 1.3, 2.1, 2.9, 3.7, 4.7, 5.5, 6.3, 7.1, 7.9];
      for (const sy of shelfYs) {
        box(len, 0.06, bcDepth - 0.05, mShelfBack, cen, sy, zFace, false);
      }

      // the collider for the whole case (so the player cannot walk through it)
      colliders.push({
        min: { x: xStart, y: 0, z: Math.min(zWall, zFace) - bcDepth / 2 },
        max: { x: xEnd, y: bcH, z: Math.max(zWall, zFace) + bcDepth / 2 }
      });

      // ---- INSTANCED book spines -------------------------------------
      // One row of books per shelf gap per bay; one InstancedMesh for the whole case.
      const bookG = new THREE.BoxGeometry(0.11, 0.26, bcDepth - 0.12);
      // count: for each shelf gap, fill each bay with ~ (bw / 0.12) spines
      const gaps = [];
      for (let i = 0; i < shelfYs.length - 1; i++) {
        const gapH = shelfYs[i + 1] - shelfYs[i];
        if (gapH > 0.35) gaps.push(shelfYs[i] + 0.16);   // a book row sits just above a shelf
      }
      const perBay = Math.max(2, Math.floor(bw / 0.13));
      const count = gaps.length * bays * perBay;
      const inst = new THREE.InstancedMesh(bookG, mBooks, count);
      inst.castShadow = true;
      const dummy = new THREE.Object3D();
      const col = new THREE.Color();
      const palePick = [0xefe6d2, 0xe9ddc4, 0xf2ead8, 0xe4d9bf, 0x7a4a2a, 0x8a5a2e];
      let k = 0;
      let seed = 1776;
      const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
      for (const gy of gaps) {
        for (let b = 0; b < bays; b++) {
          const bx0 = xStart + b * bw + 0.14;
          for (let p = 0; p < perBay; p++) {
            if (k >= count) break;
            const bx = bx0 + p * ((bw - 0.28) / perBay) + 0.06;
            const hgt = 0.2 + rnd() * 0.08;
            dummy.position.set(bx, gy + hgt / 2, zFace);
            dummy.scale.set(1, hgt / 0.26, 1);
            dummy.rotation.set(0, 0, (rnd() - 0.5) * 0.04);
            dummy.updateMatrix();
            inst.setMatrixAt(k, dummy.matrix);
            inst.setColorAt(k, col.setHex(palePick[(rnd() * palePick.length) | 0]));
            k++;
          }
        }
      }
      inst.count = k;
      inst.instanceMatrix.needsUpdate = true;
      if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
      group.add(inst);
      return inst;
    }

    // the finished bookcase runs most of the south wing's north-z wall
    addBookcase(world.SOUTH_X0 + 1.5, X1 - 2.5, Z0, -1);

    return { group, colliders };
  }

  root.AdmontScene = { build };
  if (typeof module !== 'undefined') module.exports = root.AdmontScene;
})(typeof window !== 'undefined' ? window : globalThis);
