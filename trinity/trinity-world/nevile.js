/* Trinity College - Nevile's Court (phase 1, step 3a): the transition between Great Court and the Wren Library.
 * three.js r128 meshes built in code. 228 x 143 ft = 69.5 x 43.6 m (documented; shortened to ~52 m here so the
 * Library stays in the view budget). Cloister arcades on the north, south and east sides; the Wren Library closes the
 * west end, raised on an open ground-floor colonnade (Doric columns, round arches, a balustraded parapet).
 *
 * Exposes TrinityNevile = { build(world, THREE, tex, opts) -> { group, colliders, stairX } }. stairX is where a stair
 * from the court-passage reaches the cloister; the Library stair is handled in wren.js.
 */
(function (root) {
  'use strict';
  function mergeGeoms(list) { return root.TrinityScene.mergeGeoms(list); }

  function build(world, THREE, tex, opts) {
    const N = world.nevile, wren = world.wren;
    const group = new THREE.Group();
    const colliders = [];
    const T = tex || {};
    const std = (o) => new THREE.MeshStandardMaterial(o);
    const tStone = T.stone && T.stone(), tSlab = T.slab && T.slab(), tGrass = T.grass && T.grass(), tSlate = T.slate && T.slate();
    const mStone = std({ color: 0xffffff, map: tStone, roughness: 0.9, envMapIntensity: 0.35 });
    const mTrim = std({ color: 0xf1e9d3, roughness: 0.85 });
    const mSlab = std({ color: 0xffffff, map: tSlab, roughness: 0.9 });
    const mGrass = std({ color: 0xffffff, map: tGrass, roughness: 1.0 });
    const mRoof = std({ color: 0xffffff, map: tSlate, roughness: 0.75 });
    const batches = new Map();
    const UNIT = new THREE.BoxGeometry(1, 1, 1);
    const M = (x, y, z, ry, sx, sy, sz) => { const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), ry || 0); return new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), q, new THREE.Vector3(sx || 1, sy || 1, sz || 1)); };
    function add(mat, geo, m) { const g = geo.index ? geo.toNonIndexed() : geo.clone(); if (m) g.applyMatrix4(m); if (!batches.has(mat)) batches.set(mat, []); batches.get(mat).push(g); }
    function box(mat, x, y, z, w, h, d, collide) { add(mat, UNIT, M(x, y, z, 0, w, h, d)); if (collide) colliders.push({ min: { x: x - w / 2, y: y - h / 2, z: z - d / 2 }, max: { x: x + w / 2, y: y + h / 2, z: z + d / 2 } }); }
    function cyl(mat, x, z, y0, y1, r, seg) { const g = new THREE.CylinderGeometry(r, r, y1 - y0, seg || 12); g.translate(x, (y0 + y1) / 2, z); add(mat, g); }
    function plane(mat, x0, x1, z0, z1, y) { const g = new THREE.PlaneGeometry(x1 - x0, z1 - z0); g.rotateX(-Math.PI / 2); g.translate((x0 + x1) / 2, y, (z0 + z1) / 2); add(mat, g); }
    function flush() { for (const [mat, list] of batches) { const mesh = new THREE.Mesh(mergeGeoms(list), mat); mesh.castShadow = true; mesh.receiveShadow = true; group.add(mesh); } batches.clear(); }

    const CH = N.cloisterH, AD = 2.6;                 // cloister height, arcade depth
    const PANES = [];
    const paneMap = opts._paneMap;
    const mPane = std({ color: 0xffffff, map: paneMap, roughness: 0.2, metalness: 0.4, emissive: 0x2a3340, emissiveMap: paneMap, emissiveIntensity: 0.45 });
    // ground: paving walk round a central lawn
    plane(mSlab, N.x0, N.x1, N.z0, N.z1, 0.0);
    plane(mGrass, N.x0 + AD + 2, N.x1 - AD - 2, N.z0 + AD + 2, N.z1 - AD - 2, 0.05);
    box(mTrim, (N.x0 + N.x1) / 2, 0.06, N.z0 + AD + 2, N.x1 - N.x0 - 2 * (AD + 2), 0.12, 0.12, false);
    box(mTrim, (N.x0 + N.x1) / 2, 0.06, N.z1 - AD - 2, N.x1 - N.x0 - 2 * (AD + 2), 0.12, 0.12, false);

    // a cloister range: a wall with a ground arcade, two upper storeys of windows, a slate roof
    function range(side) {
      // side: 'n'|'s' run along x at z=+-W/2;  'e' runs along z at x=N.x1
      const along = side === 'e' ? 'z' : 'x';
      const a0 = side === 'e' ? N.z0 : N.x0, a1 = side === 'e' ? N.z1 : N.x1;
      const at = side === 'n' ? N.z0 : side === 's' ? N.z1 : N.x1;   // the outer line
      const nIn = side === 'n' ? 1 : side === 's' ? -1 : -1;          // inward normal (+ toward court interior)
      const L = a1 - a0, H2 = 12.0;
      function pos(a, off) { // a = along coord, off = distance inward from the outer line
        if (side === 'e') return [at + nIn * off, a];
        return [a, at + nIn * off];
      }
      // back wall (the east range gets a doorway at gapZ linking to the Great Hall)
      const [bx, bz] = pos((a0 + a1) / 2, 0.3);
      if (side === 'e' && opts.hallLinkZ != null) {
        const g = opts.hallLinkZ, GW = 2.6, [wx] = pos(0, 0.3);
        box(mStone, wx, H2 / 2, (a0 + g - GW / 2) / 2, 0.6, H2, (g - GW / 2) - a0, true);
        box(mStone, wx, H2 / 2, (g + GW / 2 + a1) / 2, 0.6, H2, a1 - (g + GW / 2), true);
        box(mStone, wx, (CH + 1.0 + H2) / 2, g, 0.6, H2 - CH - 1.0, GW, true);
      } else {
        box(mStone, bx, H2 / 2, bz, along === 'x' ? L : 0.6, H2, along === 'x' ? 0.6 : L, true);
      }
      // arcade: piers + round arches along the inner edge
      const nA = Math.round(L / 3.4), step = L / nA;
      for (let i = 0; i <= nA; i++) {
        const a = a0 + i * step;
        const [px, pz] = pos(a, AD);
        cyl(mStone, px, pz, 0, CH, 0.42, 10);                 // Doric column
        box(mTrim, px, CH + 0.18, pz, 0.9, 0.36, 0.9, false); // capital/abacus
      }
      box(mTrim, ...(along === 'x' ? [ (a0 + a1) / 2, CH + 0.5, at + nIn * AD ] : [ at + nIn * AD, CH + 0.5, (a0 + a1) / 2 ]), along === 'x' ? L : 0.5, 0.5, along === 'x' ? 0.5 : L, false);   // entablature over the columns
      box(mStone, ...(along === 'x' ? [ (a0 + a1) / 2, CH + 0.9, (at + nIn * AD / 2) ] : [ (at + nIn * AD / 2), CH + 0.9, (a0 + a1) / 2 ]), along === 'x' ? L : AD, 0.3, along === 'x' ? AD : L, false);   // cloister ceiling (first-floor underside)
      // two upper storeys of windows on the back wall
      for (const y of [CH + 2.4, CH + 5.0]) {
        for (let i = 0; i < nA; i++) {
          const a = a0 + (i + 0.5) * step;
          const [wx, wz] = pos(a, 0.1);
          PANES.push(M(wx, y, wz, side === 'e' ? -Math.PI / 2 : (side === 'n' ? 0 : Math.PI), 1.3, 1.9, 1));
          box(mTrim, wx + (side === 'e' ? nIn * 0.04 : 0), y, wz + (side === 'e' ? 0 : nIn * 0.04), side === 'e' ? 0.1 : 1.7, 2.3, side === 'e' ? 1.7 : 0.1, false);
        }
      }
      // parapet + roof
      box(mStone, ...(along === 'x' ? [ (a0 + a1) / 2, H2 + 0.5, at + nIn * 0.3 ] : [ at + nIn * 0.3, H2 + 0.5, (a0 + a1) / 2 ]), along === 'x' ? L : 0.6, 1.0, along === 'x' ? 0.6 : L, false);
    }
    range('n'); range('s'); range('e');
    { const im = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), mPane, PANES.length); PANES.forEach((m, i) => im.setMatrixAt(i, m)); im.instanceMatrix.needsUpdate = true; group.add(im); }

    // the east range has the gateway back to the Great Hall passage (a gap at z=0)
    // (handled by scene.js: the passage wall; here just leave the arcade open there)

    flush();
    return { group, colliders };
  }

  root.TrinityNevile = { build };
  if (typeof module !== 'undefined') module.exports = root.TrinityNevile;
})(typeof window !== 'undefined' ? window : globalThis);
