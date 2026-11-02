/* Trinity College - the Backs and the River Cam (phase 2, step 1). three.js r128 meshes built in code.
 *
 * West of the Wren Library: the Backs lawn, the river, Trinity College Bridge, weeping willows, a lime avenue
 * leading west from the bridge, and a few punts. The river flows north-south (along z); the bridge crosses it east-west.
 *
 * Documented: Trinity College Bridge is a triple-arch road bridge of Portland and Ketton stone, built 1764-5 to designs by
 * James Essex; the riverside walk was laid out in 1760 and weeping willows were planted in 1761; punting is run from inside
 * the college grounds. ESTIMATES: the river width (14 m), the lawn depth between library and river, the bridge's exact
 * position (here on the library's axis) and size, the avenue's length and tree spacing, willow count and placement.
 *
 * Exposes TrinityBacks = { build(world, THREE, tex, opts) -> { group, colliders, bridge } }.
 */
(function (root) {
  'use strict';
  function mergeGeoms(list) { return root.TrinityScene.mergeGeoms(list); }

  function build(world, THREE, tex, opts) {
    const B = world.backs;
    const group = new THREE.Group();
    const colliders = [];
    const T = tex || {};
    const std = (o) => new THREE.MeshStandardMaterial(o);
    const tStone = T.stone && T.stone(), tGrass = T.grass && T.grass(), tSlab = T.slab && T.slab();
    const mStone = std({ color: 0xffffff, map: tStone, roughness: 0.9, envMapIntensity: 0.3 });
    const mGrass = std({ color: 0xffffff, map: tGrass, roughness: 1.0, envMapIntensity: 0.15 });
    const mSlab = std({ color: 0xffffff, map: tSlab, roughness: 0.9 });
    const mWater = std({ color: 0x2c4f48, roughness: 0.05, metalness: 0.1, envMapIntensity: 0.7 });
    const mBark = std({ color: 0x3e2f20, roughness: 1.0, envMapIntensity: 0.1 });
    const mLeaf = std({ color: 0x3f6a28, roughness: 0.95, envMapIntensity: 0.2 });
    const mWillow = std({ color: 0x4a7a2c, roughness: 0.95, side: THREE.DoubleSide, envMapIntensity: 0.2 });
    const mLime = std({ color: 0x3a6526, roughness: 0.95, envMapIntensity: 0.2 });
    const mPunt = std({ color: 0x4a3a2a, roughness: 0.7 });
    const mTrim = std({ color: 0xf1e9d3, roughness: 0.85 });

    const batches = new Map();
    const UNIT = new THREE.BoxGeometry(1, 1, 1);
    const M = (x, y, z, ry, sx, sy, sz) => { const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), ry || 0); return new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), q, new THREE.Vector3(sx || 1, sy || 1, sz || 1)); };
    function add(mat, geo, m, uvScale) {
      const g = geo.index ? geo.toNonIndexed() : geo.clone(); if (m) g.applyMatrix4(m);
      if (uvScale) { const p = g.attributes.position, uv = g.attributes.uv, nn = g.attributes.normal; for (let i = 0; i < p.count; i++) { const ay = Math.abs(nn.getY(i)); if (ay > 0.7) uv.setXY(i, p.getX(i) / uvScale, p.getZ(i) / uvScale); else if (Math.abs(nn.getX(i)) > Math.abs(nn.getZ(i))) uv.setXY(i, p.getZ(i) / uvScale, p.getY(i) / uvScale); else uv.setXY(i, p.getX(i) / uvScale, p.getY(i) / uvScale); } }
      if (!batches.has(mat)) batches.set(mat, []); batches.get(mat).push(g);
    }
    function box(mat, x0, x1, y0, y1, z0, z1, collide, ry) { add(mat, UNIT, M((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, ry || 0, x1 - x0, y1 - y0, z1 - z0), mat === mStone || mat === mTrim ? 2.4 : 0); if (collide) colliders.push({ min: { x: x0, y: y0, z: z0 }, max: { x: x1, y: y1, z: z1 } }); }
    function plane(mat, x0, x1, z0, z1, y, tile) { const g = new THREE.PlaneGeometry(x1 - x0, z1 - z0); g.rotateX(-Math.PI / 2); g.translate((x0 + x1) / 2, y, (z0 + z1) / 2); add(mat, g, null, tile); }
    function flush() { for (const [mat, list] of batches) { const mesh = new THREE.Mesh(mergeGeoms(list), mat); mesh.castShadow = mat !== mWater && mat !== mGrass && mat !== mSlab; mesh.receiveShadow = true; group.add(mesh); } batches.clear(); }

    const zL = B.zLawn, rE = B.riverE, rW = B.riverW, wl = B.x1;      // wl = the library's west edge (the lawn starts here)
    let rs = 1761; const rnd = () => { rs = (rs * 1103515245 + 12345) & 0x7fffffff; return rs / 0x7fffffff; };

    /* ---- ground: lawns, paths, river ---- */
    plane(mGrass, rE, wl, -zL, zL, 0.04, 4);                    // the Backs lawn (east bank)
    plane(mGrass, B.x0, rW, -zL, zL, 0.04, 4);                  // the far bank
    plane(mSlab, wl, rE, -1.6, 1.6, 0.06, 3.6);                 // the path from the library to the bridge
    plane(mSlab, rE - 2.2, rE, -zL, zL, 0.06, 3.6);             // the riverside walk (1760)
    plane(mSlab, B.x0, rW, -2.0, 2.0, 0.06, 3.6);               // the avenue path west of the bridge
    const water = new THREE.Mesh(new THREE.PlaneGeometry(rE - rW, 2 * zL + 40), mWater); water.rotation.x = -Math.PI / 2; water.position.set((rE + rW) / 2, 0.0, 0); group.add(water);
    for (const xb of [rE, rW]) box(mStone, xb - 0.3, xb + 0.3, -0.2, 0.18, -zL, zL, false);   // stone river edging
    // you cannot walk into the river (the bridge deck is above this)
    colliders.push({ min: { x: rW, y: -2, z: -zL - 20 }, max: { x: rE, y: 1.2, z: zL + 20 } });

    /* ---- Trinity College Bridge: three elliptical arches, Portland and Ketton stone, 1764-5 ---- */
    const bz = B.bridgeZ, bw = B.bridgeW, x0b = rW - 1.0, x1b = rE + 1.0, Lb = x1b - x0b, DECK = 1.6;
    {
      const sh = new THREE.Shape(); sh.moveTo(0, -1.4); sh.lineTo(Lb, -1.4); sh.lineTo(Lb, DECK); sh.lineTo(0, DECK); sh.closePath();
      const aw = 4.2;
      for (let k = 0; k < 3; k++) {
        const c = Lb * (k * 2 + 1) / 6, h = new THREE.Path();
        h.moveTo(c - aw / 2, -1.2); h.lineTo(c - aw / 2, 0.1); h.absellipse(c, 0.1, aw / 2, 1.0, Math.PI, 0, true); h.lineTo(c + aw / 2, -1.2); h.closePath();
        sh.holes.push(h);
      }
      const g = new THREE.ExtrudeGeometry(sh, { depth: bw, bevelEnabled: false, curveSegments: 18 });
      g.translate(x0b, 0, bz - bw / 2);
      const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 2.4, uv.getY(i) / 2.4);
      add(mStone, g);
      colliders.push({ min: { x: x0b, y: 1.0, z: bz - bw / 2 }, max: { x: x1b, y: DECK, z: bz + bw / 2 } });      // the walkable deck
      for (const sz of [-1, 1]) {                                                                                      // parapets
        box(mStone, x0b, x1b, DECK, DECK + 0.95, bz + sz * (bw / 2 - 0.18), bz + sz * (bw / 2), true);
        box(mTrim, x0b - 0.05, x1b + 0.05, DECK + 0.95, DECK + 1.1, bz + sz * (bw / 2 - 0.3), bz + sz * (bw / 2 + 0.05), false);
      }
      // approach steps on both banks (0.4 m risers)
      for (const [xs, dir] of [[x1b, 1], [x0b, -1]]) for (let k = 0; k < 3; k++) {
        const a = xs + dir * k * 0.7, b = xs + dir * (k + 1) * 0.7, top = (3 - k) * 0.4;
        box(mStone, Math.min(a, b), Math.max(a, b), 0, top, bz - bw / 2, bz + bw / 2, true);
      }
    }

    /* ---- trees ---- */
    function trunk(x, z, h, r) { const g = new THREE.CylinderGeometry(r * 0.8, r, h, 8); g.translate(x, h / 2, z); add(mBark, g); colliders.push({ min: { x: x - r, y: 0, z: z - r }, max: { x: x + r, y: h, z: z + r } }); }
    function willow(x, z, s) {                                                                       // weeping willow (planted 1761)
      trunk(x, z, 3.2 * s, 0.38 * s);
      const crown = new THREE.IcosahedronGeometry(2.6 * s, 1); crown.scale(1, 0.65, 1); crown.translate(x, 4.6 * s, z); add(mLeaf, crown);
      const skirt = new THREE.ConeGeometry(3.6 * s, 4.4 * s, 12, 1, true); skirt.translate(x, 2.9 * s, z); add(mWillow, skirt);
    }
    function lime(x, z, s) {                                                                          // lime (avenue)
      trunk(x, z, 4.2 * s, 0.34 * s);
      const crown = new THREE.IcosahedronGeometry(2.7 * s, 1); crown.scale(1, 1.15, 1); crown.translate(x, 6.4 * s, z); add(mLime, crown);
    }
    for (let z = -64; z <= 64; z += 16) { if (Math.abs(z - bz) < 7) continue; willow(rE - 3.4, z + (rnd() - 0.5) * 3, 0.95 + rnd() * 0.3); }          // east bank
    for (let z = -56; z <= 56; z += 14) { if (Math.abs(z - bz) < 7) continue; willow(rW + 3.2, z + (rnd() - 0.5) * 3, 0.9 + rnd() * 0.3); }          // west bank
    for (let x = rW - 8; x > B.x0 + 8; x -= 9) for (const sz of [-1, 1]) lime(x, bz + sz * 6.2, 0.95 + rnd() * 0.2);                                   // the avenue

    /* ---- a few punts on the river ---- */
    for (const [px, pz, ry] of [[(rE + rW) / 2 + 2.4, -24, 0.06], [(rE + rW) / 2 - 2.6, 17, -0.05], [(rE + rW) / 2 + 1.2, 46, 0.1]]) {
      add(mPunt, UNIT, M(px, 0.1, pz, ry, 0.95, 0.28, 5.2));
      add(mPunt, UNIT, M(px, 0.28, pz - 1.6, ry, 0.8, 0.05, 1.0));
      add(mTrim, UNIT, M(px + 0.25, 0.45, pz + 1.0, ry, 0.05, 0.5, 0.05));
    }

    flush();
    return { group, colliders, bridge: { x0: x0b, x1: x1b, z: bz, deck: DECK } };
  }

  root.TrinityBacks = { build };
  if (typeof module !== 'undefined') module.exports = root.TrinityBacks;
})(typeof window !== 'undefined' ? window : globalThis);
