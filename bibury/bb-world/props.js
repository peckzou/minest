/* Bibury — mesh details the 1 m voxels cannot carry, read from world.props (props engine of the Neuschwanstein and Downton worlds):
 *   the smooth stone-tile roof planes over the stepped voxel roofs (with ridge tiles, fascias and verges), the gable infills
 *   between the steps and the roof line, clay chimney pots, the flagpole on the church tower, ivy / roses / wisteria on the walls,
 *   reeds, grasses, cow parsley and wild flowers as crossed planes, wooden fences, swans and mallards on the Coln, trout in the
 *   ponds, candles and two small chandeliers, framed prints and the inn sign (painted in code, stylised).
 *   far away: the rolling wolds of the Cotswolds as a low-poly ring.
 * Every kind of thing is merged into one mesh per material (the roofs of the whole village are one draw call).
 * Exposes BBProps = { build(world, THREE, scene, opts) -> { update(dt, time, cam, night), stats() } }. */
(function (root) {
  'use strict';
  function rng(seed) { let a = seed | 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  function build(world, T, scene, opts) {
    opts = opts || {};
    const group = new T.Group(); group.name = 'bb-props'; scene.add(group);
    const P = world.props, made = { meshes: 0, textures: 0 };
    const gold = new T.MeshPhongMaterial({ color: 0xd9ad48, specular: 0xfff0b0, shininess: 70, emissive: 0x3a2a08 });
    const goldD = new T.MeshPhongMaterial({ color: 0xa8802c, specular: 0xffe0a0, shininess: 50, emissive: 0x241804 });
    const wax = new T.MeshLambertMaterial({ color: 0xf6efdc, emissive: 0x2a2416 });
    const flameM = new T.MeshBasicMaterial({ color: 0xffd47a });
    const crystal = new T.MeshPhongMaterial({ color: 0xcfe2ff, specular: 0xffffff, shininess: 120, transparent: true, opacity: 0.75, emissive: 0x223044 });

    /* ---------------- merge helper: many small parts -> one geometry per material ---------------- */
    function Merger() { this.list = []; }
    Merger.prototype.add = function (geo, m) { const g = geo.index ? geo.toNonIndexed() : geo.clone(); g.applyMatrix4(m); this.list.push(g); };
    Merger.prototype.mesh = function (mat) {
      if (!this.list.length) return null; let n = 0; this.list.forEach((g) => { n += g.attributes.position.count; });
      const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), uv = new Float32Array(n * 2); let o = 0;
      this.list.forEach((g) => { pos.set(g.attributes.position.array, o * 3); nor.set(g.attributes.normal.array, o * 3); if (g.attributes.uv) uv.set(g.attributes.uv.array, o * 2); o += g.attributes.position.count; g.dispose(); });
      const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.BufferAttribute(pos, 3)); geo.setAttribute('normal', new T.BufferAttribute(nor, 3)); geo.setAttribute('uv', new T.BufferAttribute(uv, 2)); geo.computeBoundingSphere();
      const me = new T.Mesh(geo, mat); group.add(me); made.meshes++; return me;
    };
    const M = (x, y, z, rx, ry, rz, sx, sy, sz) => new T.Matrix4().compose(new T.Vector3(x, y, z), new T.Quaternion().setFromEuler(new T.Euler(rx || 0, ry || 0, rz || 0)), new T.Vector3(sx || 1, sy || 1, sz || 1));
    const mGold = new Merger(), mGoldD = new Merger(), mCrys = new Merger();
    const candleXf = [], flameXf = [];

    /* ---------------- chandeliers ---------------- */
    const torus = (r, t) => new T.TorusGeometry(r, t, 6, Math.max(16, Math.round(r * 18)));
    const cyl = (r0, r1, h, s) => new T.CylinderGeometry(r0, r1, h, s || 8);
    const sph = (r) => new T.SphereGeometry(r, 10, 8);
    P.chandeliers.forEach((c) => {
      const { x, y, z, r } = c, top = c.top != null ? c.top : y + 3;
      mGoldD.add(cyl(0.025, 0.025, top - y, 6), M(x, (top + y) / 2, z));                         // the chain
      if (c.kind === 'crown') {
        // the Throne Hall crown: two gilded rings with arches, gables and spikes, a ball and a cross below
        for (const [ry, rr, th] of [[0, r, 0.12], [0.55, r, 0.08], [-0.35, r * 0.96, 0.06]]) mGold.add(torus(rr, th), M(x, y + ry, z, Math.PI / 2));
        const n = 16; for (let i = 0; i < n; i++) {
          const a = i / n * Math.PI * 2, cx = x + Math.cos(a) * r, cz = z + Math.sin(a) * r;
          mGold.add(cyl(0.04, 0.04, 0.9, 6), M(cx, y + 0.1, cz));                                 // posts
          mGold.add(new T.ConeGeometry(0.16, 0.5, 4), M(cx, y + 0.85, cz, 0, a));                 // gables / spikes
          mCrys.add(sph(0.07), M(cx, y - 0.45, cz));
          if (i % 2 === 0) mGoldD.add(cyl(0.012, 0.012, Math.hypot(r, top - y - 0.5), 4), M((cx + x) / 2, (y + 0.6 + top) / 2, (cz + z) / 2, 0, -a, Math.atan2(r, top - y - 0.6)));   // chains to the top
        }
        mGold.add(sph(0.35), M(x, y - 1.0, z)); mGold.add(cyl(0.05, 0.05, 0.8, 6), M(x, y - 1.6, z)); mGold.add(new T.BoxGeometry(0.5, 0.06, 0.06), M(x, y - 1.75, z));
        // candles on both rings (96 in all)
        const per = Math.round(c.candles / 2);
        for (const [ry, rr] of [[0.2, r], [0.75, r * 0.98]]) for (let i = 0; i < per; i++) { const a = (i + 0.5) / per * Math.PI * 2; candleXf.push([x + Math.cos(a) * rr, y + ry, z + Math.sin(a) * rr, 0.13]); }
      } else {
        const tiers = c.kind === 'ring' ? [[0, r], [0.5, r * 0.6]] : [[0, r]];
        tiers.forEach(([ry, rr]) => mGold.add(torus(rr, 0.05), M(x, y + ry, z, Math.PI / 2)));
        for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; mGoldD.add(cyl(0.012, 0.012, top - y, 4), M(x + Math.cos(a) * r * 0.5, (y + top) / 2, z + Math.sin(a) * r * 0.5, 0, 0, Math.atan2(r * 0.5, top - y) * (i & 1 ? 1 : -1))); }
        mGold.add(sph(0.12), M(x, y - 0.15, z));
        let k = 0; tiers.forEach(([ry, rr], t) => { const per = Math.round(c.candles * (t === 0 ? 0.66 : 0.34)); for (let i = 0; i < per && k < c.candles; i++, k++) { const a = (i + 0.5) / per * Math.PI * 2; candleXf.push([x + Math.cos(a) * rr, y + ry + 0.05, z + Math.sin(a) * rr, 0.1]); } });
      }
    });
    // candelabra (standing) and coloured glow points
    const glows = [];
    P.candles.forEach((c) => {
      if (c.one) { mGoldD.add(cyl(0.07, 0.09, 0.05, 8), M(c.x, c.y + 0.025, c.z)); candleXf.push([c.x, c.y + 0.05, c.z, 0.18]); return; }   // a single candle in a brass stick
      if (!c.h) { glows.push(c); return; }
      mGold.add(cyl(0.05, 0.16, c.h, 8), M(c.x, c.y + c.h / 2, c.z)); mGold.add(cyl(0.22, 0.22, 0.05, 10), M(c.x, c.y + 0.03, c.z));
      for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2, rr = i === 4 ? 0 : 0.28; const xx = c.x + Math.cos(a) * rr, zz = c.z + Math.sin(a) * rr; if (rr) mGold.add(cyl(0.02, 0.02, rr * 2, 4), M((xx + c.x) / 2, c.y + c.h, (zz + c.z) / 2, 0, -a, Math.PI / 2)); candleXf.push([xx, c.y + c.h + 0.02, zz, 0.12]); }
    });
    // the palm-tree capital of the stair column (the column ends in a palm whose fronds carry the vault)
    P.palms.forEach((p) => {
      const h = p.top - p.y; mGold.add(cyl(0.35, 0.45, 0.4, 10), M(p.x, p.y, p.z));
      const leaf = new T.BoxGeometry(2.6, 0.08, 0.5); leaf.translate(1.3, 0, 0);
      for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; mGold.add(leaf, M(p.x, p.y + h * 0.35 + (i & 1) * 0.4, p.z, 0, -a, 0.55 + (i & 1) * 0.25)); }
      const pm = new T.MeshPhongMaterial({ color: 0x6f9a5a, specular: 0xd0e0a0, shininess: 30 }); const leafs = new Merger();
      for (let i = 0; i < 14; i++) { const a = (i + 0.5) / 14 * Math.PI * 2; leafs.add(leaf, M(p.x, p.y + h * 0.5, p.z, 0, -a, 0.35)); }
      leafs.mesh(pm);
    });
    // swans and mallards on the Coln
    const mWhite = new Merger(), mBeak = new Merger(), mBlack = new Merger(), mDuck = new Merger(), mHead = new Merger();
    const placer = (o) => { const ca = Math.cos(o.r), sa = Math.sin(o.r); return (dx, dy, dz, rx, sx, sy, sz) => M(o.x + dx * ca + dz * sa, o.y + dy, o.z - dx * sa + dz * ca, rx || 0, o.r, 0, sx, sy, sz); };
    P.swans.forEach((o) => {
      const at = placer(o); mWhite.add(sph(0.32), at(0, 0.22, 0, 0, 0.8, 0.62, 1.35)); mWhite.add(sph(0.2), at(0, 0.38, -0.32, 0, 0.9, 0.7, 0.9));
      for (let k = 0; k < 8; k++) { const t = k / 7; mWhite.add(sph(0.075), at(0, 0.36 + t * 0.6, 0.34 + Math.sin(t * Math.PI) * -0.1 + t * 0.06)); }
      mWhite.add(sph(0.1), at(0, 0.98, 0.44, 0, 0.9, 0.9, 1.3)); mBeak.add(new T.BoxGeometry(0.07, 0.05, 0.2), at(0, 0.95, 0.6)); mBlack.add(sph(0.04), at(0, 0.98, 0.52));
    });
    (P.ducks || []).forEach((o) => {
      const at = placer(o); mDuck.add(sph(0.2), at(0, 0.12, 0, 0, 0.75, 0.6, 1.3)); mHead.add(sph(0.1), at(0, 0.3, 0.2)); mBeak.add(new T.BoxGeometry(0.06, 0.03, 0.12), at(0, 0.28, 0.32));
    });
    mWhite.mesh(new T.MeshLambertMaterial({ color: 0xf6f6f2 })); mBeak.mesh(new T.MeshLambertMaterial({ color: 0xe8862a })); mBlack.mesh(new T.MeshLambertMaterial({ color: 0x1a1a1a }));
    mDuck.mesh(new T.MeshLambertMaterial({ color: 0x7e6a50 })); mHead.mesh(new T.MeshLambertMaterial({ color: 0x2a6a40 }));
    mGold.mesh(gold); mGoldD.mesh(goldD); mCrys.mesh(crystal);
    // candles + flames: 2 instanced meshes for every candle in the castle
    let flames = null, candlesMesh = null;
    if (candleXf.length) {
      const cg = cyl(0.025, 0.025, 1, 6); cg.translate(0, 0.5, 0); const fg = new T.ConeGeometry(0.035, 0.11, 6); fg.translate(0, 0.055, 0);
      candlesMesh = new T.InstancedMesh(cg, wax, candleXf.length); flames = new T.InstancedMesh(fg, flameM, candleXf.length);
      const m = new T.Matrix4();
      candleXf.forEach((c, i) => { m.makeScale(1, c[3], 1).setPosition(c[0], c[1], c[2]); candlesMesh.setMatrixAt(i, m); m.makeTranslation(c[0], c[1] + c[3], c[2]); flames.setMatrixAt(i, m); });
      group.add(candlesMesh, flames); made.meshes += 2;
    }
    // coloured glow (the grotto)
    glows.forEach((g) => { const sm = new T.SpriteMaterial({ map: glowTex(), color: g.glow || 0xffd080, transparent: true, depthWrite: false, blending: T.AdditiveBlending }); const sp = new T.Sprite(sm); sp.scale.set(2.4, 2.4, 1); sp.position.set(g.x, g.y + 1.6, g.z); group.add(sp); });

    /* ---------------- painted panels ---------------- */
    const muralCache = {};
    function muralTex(theme, k) {
      const key = theme + k; if (muralCache[key]) return muralCache[key];
      const c = document.createElement('canvas'); c.width = 256; c.height = 256; paintMural(c.getContext('2d'), theme, k); const t = new T.CanvasTexture(c);
      if (T.sRGBEncoding !== undefined) t.encoding = T.sRGBEncoding; t.anisotropy = 4; muralCache[key] = t; made.textures++; return t;
    }
    let mi = 0;
    P.murals.forEach((m) => {
      const tex = muralTex(m.theme, mi++ % 3), mat = new T.MeshLambertMaterial({ map: tex }), g = new T.PlaneGeometry(m.w, m.h), me = new T.Mesh(g, mat);
      const o = 0.02;
      if (m.face === '+z') me.position.set(m.x + m.w / 2, m.y + m.h / 2, m.z + o);
      else if (m.face === '-z') { me.position.set(m.x + m.w / 2, m.y + m.h / 2, m.z - o); me.rotation.y = Math.PI; }
      else if (m.face === '+x') { me.position.set(m.x + o, m.y + m.h / 2, m.z + m.w / 2); me.rotation.y = Math.PI / 2; }
      else { me.position.set(m.x - o, m.y + m.h / 2, m.z + m.w / 2); me.rotation.y = -Math.PI / 2; }
      group.add(me); made.meshes++;
    });

    /* ---------------- the apse: gold mosaic and a starry half dome ---------------- */
    if (P.apse) {
      const a = P.apse, R = a.r - 0.62, spring = a.y0 + (a.y1 - a.y0 - R);
      const ct = document.createElement('canvas'); ct.width = 1024; ct.height = 256; paintApse(ct.getContext('2d')); const at = new T.CanvasTexture(ct); if (T.sRGBEncoding !== undefined) at.encoding = T.sRGBEncoding; made.textures++;
      const wall = new T.Mesh(new T.CylinderGeometry(R, R, spring - a.y0, 40, 1, true, Math.PI, Math.PI), new T.MeshPhongMaterial({ map: at, side: T.BackSide, specular: 0x8a6a20, shininess: 30, emissive: 0x1a1204 }));
      wall.position.set(a.cx, (a.y0 + spring) / 2, a.cz); group.add(wall);
      const cd = document.createElement('canvas'); cd.width = 512; cd.height = 256; paintDome(cd.getContext('2d')); const dt = new T.CanvasTexture(cd); if (T.sRGBEncoding !== undefined) dt.encoding = T.sRGBEncoding; made.textures++;
      const dome = new T.Mesh(new T.SphereGeometry(R, 32, 12, -Math.PI / 2, Math.PI, 0, Math.PI / 2), new T.MeshPhongMaterial({ map: dt, side: T.BackSide, shininess: 10, emissive: 0x0a0c18 }));
      dome.position.set(a.cx, spring, a.cz); group.add(dome); made.meshes += 2;
    }
    /* ---------------- the mosaic floor ---------------- */
    P.mosaic.forEach((f) => {
      const c = document.createElement('canvas'); c.width = 1024; c.height = 768; paintFloor(c.getContext('2d')); const t = new T.CanvasTexture(c); if (T.sRGBEncoding !== undefined) t.encoding = T.sRGBEncoding; t.anisotropy = 8; made.textures++;
      const me = new T.Mesh(new T.PlaneGeometry(f.x1 - f.x0, f.z1 - f.z0), new T.MeshLambertMaterial({ map: t })); me.rotation.x = -Math.PI / 2; me.position.set((f.x0 + f.x1) / 2, f.y, (f.z0 + f.z1) / 2); me.receiveShadow = true; group.add(me); made.meshes++;
    });


    /* ---------------- the village: roofs, gables, pots, the flagpole, climbers, tufts, fences, fish ---------------- */
    const BT = root.BBTex, hf2 = (a, b) => { const h = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453; return h - Math.floor(h); };
    function tileTex(name) { const t = new T.CanvasTexture(BT.tile(name)); t.wrapS = t.wrapT = T.RepeatWrapping; t.magFilter = T.NearestFilter; t.minFilter = T.LinearMipmapLinearFilter; made.textures++; return t; }
    function Geo() { this.p = []; this.u = []; this.c = []; this.n = null; }
    Geo.prototype.tri = function (a, b, c, ua, ub, uc, col) { this.p.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]); this.u.push(ua[0], ua[1], ub[0], ub[1], uc[0], uc[1]); for (let k = 0; k < 3; k++) this.c.push(col[0], col[1], col[2]); };
    Geo.prototype.quad = function (a, b, c, d, ua, ub, uc, ud, col) { this.tri(a, b, c, ua, ub, uc, col); this.tri(a, c, d, ua, uc, ud, col); };
    Geo.prototype.mesh = function (mat, up) {
      if (!this.p.length) return null; const g = new T.BufferGeometry();
      g.setAttribute('position', new T.Float32BufferAttribute(this.p, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(this.u, 2)); g.setAttribute('color', new T.Float32BufferAttribute(this.c, 3));
      if (up) { const n = new Float32Array(this.p.length); for (let i = 1; i < n.length; i += 3) n[i] = 1; g.setAttribute('normal', new T.BufferAttribute(n, 3)); } else g.computeVertexNormals();
      g.computeBoundingSphere(); const m = new T.Mesh(g, mat); m.receiveShadow = true; group.add(m); made.meshes++; return m;
    };
    // roofs: two slopes from the eaves to the ridge, ridge tiles, fascias, verges; the gable triangle under each verge
    const roofG = new Geo(), gableG = {}, LIFT = 0.03;
    (P.roofs || []).forEach((R) => {
      const ax = R.axis === 'x', s = R.s, A0 = (ax ? R.x0 : R.z0) - R.og - R.e0, A1 = (ax ? R.x1 : R.z1) + 1 + R.og + R.e1;
      const b0 = ax ? R.z0 : R.x0, b1 = (ax ? R.z1 : R.x1) + 1, bM = (b0 + b1) / 2, yE = R.y0 - s * R.ov + LIFT, yR = R.y0 + s * (bM - b0) + LIFT;
      const P3 = (a, y, b) => (ax ? [a, y, b] : [b, y, a]);
      const k = 0.93 + hf2(R.x0, R.z0) * 0.1, col = [R.c[0] * k, R.c[1] * k, R.c[2] * k], dark = [col[0] * 0.62, col[1] * 0.62, col[2] * 0.62], rc = [col[0] * 0.8, col[1] * 0.8, col[2] * 0.8];
      const SL = Math.hypot(bM - b0 + R.ov, yR - yE), th = 0.14;
      for (const be of [b0 - R.ov, b1 + R.ov]) {
        roofG.quad(P3(A0, yE, be), P3(A1, yE, be), P3(A1, yR, bM), P3(A0, yR, bM), [A0, 0], [A1, 0], [A1, SL], [A0, SL], col);
        roofG.quad(P3(A0, yE - th, be), P3(A1, yE - th, be), P3(A1, yE, be), P3(A0, yE, be), [A0, 0], [A1, 0], [A1, th], [A0, th], dark);
        for (const [a, on] of [[A0, R.g0], [A1, R.g1]]) if (on) roofG.quad(P3(a, yE - th, be), P3(a, yE, be), P3(a, yR, bM), P3(a, yR - th, bM), [0, 0], [th, 0], [th, SL], [0, SL], dark);
      }
      for (const sg of [-1, 1]) roofG.quad(P3(A0, yR - 0.08, bM + sg * 0.2), P3(A1, yR - 0.08, bM + sg * 0.2), P3(A1, yR + 0.12, bM), P3(A0, yR + 0.12, bM), [A0, 0], [A1, 0], [A1, 0.25], [A0, 0.25], rc);
      const gg = gableG[R.gt] || (gableG[R.gt] = new Geo()), gc = R.gc;
      for (const [end, on] of [[0, R.g0], [1, R.g1]]) {
        if (!on) continue;
        const aw = end === 0 ? (ax ? R.x0 : R.z0) : (ax ? R.x1 : R.z1) + 1, sh = ax ? 0.9 : 0.84, c3 = [gc[0] * sh, gc[1] * sh, gc[2] * sh];
        const flip = (ax && end === 1) || (!ax && end === 0), uu = (z) => (flip ? -z : z), Pz = (bb) => R.y0 + s * Math.min(bb - b0, b1 - bb);
        for (let b = b0; b < b1; b++) {
          const d = Math.min(b - b0, b1 - 1 - b), top = R.y0 + Math.floor(s * d + 1e-6), cuts = bM > b && bM < b + 1 ? [b, bM, b + 1] : [b, b + 1];
          for (let q = 0; q < cuts.length - 1; q++) { const za = cuts[q], zb = cuts[q + 1], ya = Pz(za) + LIFT, yb = Pz(zb) + LIFT; if (ya - top < 0.02 && yb - top < 0.02) continue;
            gg.quad(P3(aw, top, za), P3(aw, top, zb), P3(aw, yb, zb), P3(aw, ya, za), [uu(za), top], [uu(zb), top], [uu(zb), yb], [uu(za), ya], c3); }
        }
      }
    });
    { const m = roofG.mesh(new T.MeshLambertMaterial({ map: tileTex('slates'), vertexColors: true, side: T.DoubleSide })); if (m) m.castShadow = true; }
    for (const n in gableG) gableG[n].mesh(new T.MeshLambertMaterial({ map: tileTex(n), vertexColors: true, side: T.DoubleSide }));
    // chimney pots, the flagpole on the tower
    const mPot = new Merger(); (P.pots || []).forEach((p) => { mPot.add(cyl(0.16, 0.2, 0.55, 8), M(p[0], p[1] + 0.27, p[2])); mPot.add(cyl(0.2, 0.2, 0.08, 8), M(p[0], p[1] + 0.56, p[2])); });
    mPot.mesh(new T.MeshLambertMaterial({ color: 0xb2643c }));
    const mPole = new Merger(); (world.flags || []).forEach((f) => { mPole.add(cyl(0.06, 0.08, 6.6, 6), M(f[0] + 0.5, f[1] - 2.7, f[2])); mPole.add(sph(0.12), M(f[0] + 0.5, f[1] + 0.68, f[2])); });
    mPole.mesh(new T.MeshLambertMaterial({ color: 0xe8e4dc }));
    // climbers: ivy, roses, wisteria; patches of 1 m with ragged edges
    function creeperTex(kind) {
      const c = document.createElement('canvas'); c.width = 128; c.height = 128; const x = c.getContext('2d'), r = rng(kind.length * 31 + 7);
      const leaf = kind === 'ivy' ? ['#2c4a22', '#3a5e2a', '#24401c', '#46702f', '#335526'] : ['#3e5e2a', '#4a6e32', '#33522a', '#56803a'];
      x.strokeStyle = '#5a4630'; x.lineWidth = 2; for (let i = 0; i < 7; i++) { let px = r() * 128, py = 128; x.beginPath(); x.moveTo(px, py); for (let k = 0; k < 8; k++) { px += (r() - 0.5) * 30; py -= 18; x.lineTo(px, py); } x.stroke(); }
      for (let i = 0; i < (kind === 'ivy' ? 1100 : 620); i++) { const px = r() * 128, py = r() * 128, sz = 2 + r() * 3.6; x.fillStyle = leaf[(r() * leaf.length) | 0]; x.beginPath(); x.ellipse(px, py, sz, sz * 0.72, r() * 3, 0, 7); x.fill(); }
      if (kind === 'rose') for (let i = 0; i < 110; i++) { const px = r() * 128, py = r() * 128; x.fillStyle = ['#e04a6a', '#f08aa0', '#c8203a', '#fff0f0', '#f6c0c8'][(r() * 5) | 0]; x.beginPath(); x.arc(px, py, 2 + r() * 2.2, 0, 7); x.fill(); }
      if (kind === 'wisteria') for (let i = 0; i < 46; i++) { const px = r() * 128, py = r() * 104; for (let k = 0; k < 8; k++) { x.fillStyle = k < 3 ? '#9c84d0' : '#c4b0ea'; x.beginPath(); x.arc(px + (r() - 0.5) * 3, py + k * 3, 2.8 - k * 0.25, 0, 7); x.fill(); } }
      const t = new T.CanvasTexture(c); made.textures++; return t;
    }
    const crG = {};
    (P.creepers || []).forEach((m, ci) => {
      const g = crG[m.kind] || (crG[m.kind] = new Geo()), o = 0.05, c = [1, 1, 1];
      for (let i = 0; i < m.w; i++) for (let j = 0; j < Math.ceil(m.h); j++) {
        const hh = Math.min(1, m.h - j), edge = i === 0 || i === m.w - 1 || j >= Math.ceil(m.h) - 1, keep = hf2(ci * 7 + i, j * 3 + 1); if (edge && keep < 0.35) continue;
        const ju = hf2(i + ci, j) * 0.5, jv = hf2(j + ci, i) * 0.5, x0 = i - (i === 0 ? 0 : 0.1), x1 = i + 1 + (i === m.w - 1 ? 0 : 0.1), y0 = m.y + j, y1 = m.y + j + hh + (edge ? 0 : 0.12);
        const uv = [[ju, jv], [ju + 0.5, jv], [ju + 0.5, jv + 0.5 * hh], [ju, jv + 0.5 * hh]];
        let A, Bq, Cq, Dq;
        if (m.face === '-z' || m.face === '+z') { const z = m.z + (m.face === '-z' ? -o : o) - (j & 1) * 0.01; A = [m.x + x0, y0, z]; Bq = [m.x + x1, y0, z]; Cq = [m.x + x1, y1, z]; Dq = [m.x + x0, y1, z]; }
        else { const x = m.x + (m.face === '-x' ? -o : o) - (j & 1) * 0.01; A = [x, y0, m.z + x0]; Bq = [x, y0, m.z + x1]; Cq = [x, y1, m.z + x1]; Dq = [x, y1, m.z + x0]; }
        g.quad(A, Bq, Cq, Dq, uv[0], uv[1], uv[2], uv[3], c);
      }
    });
    for (const k in crG) crG[k].mesh(new T.MeshLambertMaterial({ map: creeperTex(k), alphaTest: 0.5, side: T.DoubleSide, vertexColors: true }));
    // reeds, grass, cow parsley, wild flowers: two crossed planes each, all in one mesh
    function tuftTex() {
      const c = document.createElement('canvas'); c.width = 256; c.height = 64; const x = c.getContext('2d'), r = rng(5);
      for (let k = 0; k < 4; k++) {
        const ox = k * 64, n = k === 1 ? 26 : k === 2 ? 12 : 30;
        for (let i = 0; i < n; i++) {
          const bx = ox + 6 + r() * 52, top = k === 1 ? 2 + r() * 14 : k === 2 ? 10 + r() * 18 : 18 + r() * 30, lean = (r() - 0.5) * 14;
          x.strokeStyle = k === 1 ? ['#9aa858', '#a8b062', '#8a9a4c', '#b4b070'][(r() * 4) | 0] : ['#5a9038', '#6aa042', '#4e8032', '#7ab04a'][(r() * 4) | 0]; x.lineWidth = k === 1 ? 2 : 1.6;
          x.beginPath(); x.moveTo(bx, 64); x.quadraticCurveTo(bx + lean * 0.3, (64 + top) / 2, bx + lean, top); x.stroke();
          if (k === 1 && r() < 0.3) { x.fillStyle = '#8a6440'; x.fillRect(bx + lean - 1.5, top, 3, 7); }
          if (k === 2) { x.fillStyle = '#f4f2ea'; for (let j = 0; j < 10; j++) { x.beginPath(); x.arc(bx + lean + (r() - 0.5) * 11, top + (r() - 0.5) * 3, 1.4, 0, 7); x.fill(); } }
          if (k === 3 && r() < 0.55) { x.fillStyle = ['#f2d22a', '#e8607a', '#ffffff', '#b07ad8', '#f2d22a'][(r() * 5) | 0]; x.beginPath(); x.arc(bx + lean, top, 2.3, 0, 7); x.fill(); }
        }
      }
      const t = new T.CanvasTexture(c); made.textures++; return t;
    }
    if (P.tufts && P.tufts.length) {
      const tg = new Geo(), HT = [0.55, 1.45, 1.05, 0.6], WD = [0.95, 0.9, 0.95, 0.85], white = [1, 1, 1];
      P.tufts.forEach(([x, y, z, k, sc], i) => {
        const h = HT[k] * sc, w = WD[k] * sc * 0.5, a = hf2(x, z) * 3.14, u0 = k * 0.25 + 0.004, u1 = (k + 1) * 0.25 - 0.004;
        for (const aa of [a, a + Math.PI / 2]) { const dx = Math.cos(aa) * w, dz = Math.sin(aa) * w, A = [x - dx, y, z - dz], Bq = [x + dx, y, z + dz], Cq = [x + dx, y + h, z + dz], Dq = [x - dx, y + h, z - dz];
          tg.quad(A, Bq, Cq, Dq, [u0, 0], [u1, 0], [u1, 1], [u0, 1], white); tg.quad(Bq, A, Dq, Cq, [u1, 0], [u0, 0], [u0, 1], [u1, 1], white); }   // both faces, both lit from above
      });
      tg.mesh(new T.MeshLambertMaterial({ map: tuftTex(), alphaTest: 0.45, vertexColors: true }), true);
    }
    // wooden post-and-rail fences
    const mF = new Merger();
    (P.fences || []).forEach(([x0, z0, x1, z1, y]) => {
      const L = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.round(L / 2)), ang = Math.atan2(z1 - z0, x1 - x0);
      for (let i = 0; i <= n; i++) { const t = i / n; mF.add(new T.BoxGeometry(0.12, 1.1, 0.12), M(x0 + (x1 - x0) * t, y + 0.55, z0 + (z1 - z0) * t)); }
      for (const ry of [0.45, 0.95]) mF.add(new T.BoxGeometry(L, 0.08, 0.06), M((x0 + x1) / 2, y + ry, (z0 + z1) / 2, 0, -ang, 0));
    });
    mF.mesh(new T.MeshLambertMaterial({ color: 0x8a6a48 }));
    // trout circling in the ponds
    const FISH = P.fish || []; let fishM = null;
    if (FISH.length) { const fg = new T.SphereGeometry(0.2, 8, 6); fg.scale(0.5, 0.38, 1.6); fishM = new T.InstancedMesh(fg, new T.MeshLambertMaterial({ color: 0x46524e }), FISH.length); group.add(fishM); made.meshes++; }
    const _m4 = new T.Matrix4(), _q = new T.Quaternion(), _e = new T.Euler(), _v = new T.Vector3(), _s = new T.Vector3(1, 1, 1);

    /* ---------------- far landscape: the wolds ---------------- */
    const far = buildFar(world, T); scene.add(far.group); made.meshes += far.n;

    function update(dt, time, cam, night) {
      if (flames) { const f = 0.85 + Math.sin(time * 13.1) * 0.06 + Math.sin(time * 7.3) * 0.05; flameM.color.setRGB(1, 0.8 * f, 0.45 * f); }
      far.group.position.set(0, 0, 0);
      if (fishM) { FISH.forEach((f, i) => { const a = f.ph + time * f.sp, x = f.x + Math.cos(a) * f.rx, z = f.z + Math.sin(a) * f.rz; _e.set(0, Math.atan2(-Math.sin(a) * f.rx, Math.cos(a) * f.rz), 0); _q.setFromEuler(_e); _m4.compose(_v.set(x, f.y + Math.sin(time * 2 + i) * 0.05, z), _q, _s); fishM.setMatrixAt(i, _m4); }); fishM.instanceMatrix.needsUpdate = true; }
    }
    return { group, update, stats: () => ({ meshes: made.meshes, textures: made.textures, candles: candleXf.length, murals: P.murals.length, chandeliers: P.chandeliers.length, roofs: (P.roofs || []).length, tufts: (P.tufts || []).length, creepers: (P.creepers || []).length }) };
  }

  /* ================= painting ================= */
  let _glow = null;
  function glowTex() { if (_glow) return _glow; const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.4, 'rgba(255,255,255,.35)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); _glow = new THREE.CanvasTexture(c); return _glow; }
  function frame(x, w, h) { x.lineWidth = 12; x.strokeStyle = '#b8862e'; x.strokeRect(6, 6, w - 12, h - 12); x.lineWidth = 3; x.strokeStyle = '#f2d27a'; x.strokeRect(13, 13, w - 26, h - 26); x.strokeStyle = '#6a4a14'; x.strokeRect(3, 3, w - 6, h - 6); }
  function figure(x, cx, base, hgt, robe, halo, r) {   // a standing robed figure, simple and flat like the Nazarene style it stands for
    x.fillStyle = robe; x.beginPath(); x.moveTo(cx - hgt * 0.16, base); x.lineTo(cx + hgt * 0.16, base); x.lineTo(cx + hgt * 0.09, base - hgt * 0.72); x.lineTo(cx - hgt * 0.09, base - hgt * 0.72); x.closePath(); x.fill();
    x.fillStyle = 'rgba(0,0,0,.18)'; x.fillRect(cx - 1, base - hgt * 0.7, 2, hgt * 0.7);
    x.fillStyle = '#e8c8a8'; x.beginPath(); x.arc(cx, base - hgt * 0.8, hgt * 0.075, 0, 7); x.fill();
    if (halo) { x.strokeStyle = '#f6d36a'; x.lineWidth = 3; x.beginPath(); x.arc(cx, base - hgt * 0.8, hgt * 0.12, 0, 7); x.stroke(); }
    x.fillStyle = robe; x.fillRect(cx - hgt * 0.13, base - hgt * 0.68, hgt * 0.26, hgt * 0.07);
  }
  function landscape(x, w, h, r, sky, hills) {
    const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, sky[0]); g.addColorStop(1, sky[1]); x.fillStyle = g; x.fillRect(0, 0, w, h);
    hills.forEach((c, i) => { x.fillStyle = c; x.beginPath(); x.moveTo(0, h); for (let k = 0; k <= 16; k++) x.lineTo(k / 16 * w, h * (0.55 + i * 0.12) - Math.sin(k * 0.9 + i * 2 + r() * 0.5) * h * 0.06); x.lineTo(w, h); x.fill(); });
  }
  function tree(x, cx, base, s, col) { x.fillStyle = '#4a3420'; x.fillRect(cx - s * 0.05, base - s * 0.4, s * 0.1, s * 0.4); x.fillStyle = col; x.beginPath(); x.arc(cx, base - s * 0.55, s * 0.28, 0, 7); x.fill(); }
  function castle(x, cx, base, s) { x.fillStyle = '#f2efe6'; x.fillRect(cx - s * 0.3, base - s * 0.5, s * 0.6, s * 0.5); x.fillRect(cx + s * 0.18, base - s * 0.85, s * 0.12, s * 0.85); x.fillStyle = '#5a6a7e'; x.beginPath(); x.moveTo(cx + s * 0.16, base - s * 0.85); x.lineTo(cx + s * 0.24, base - s * 1.1); x.lineTo(cx + s * 0.32, base - s * 0.85); x.fill(); x.beginPath(); x.moveTo(cx - s * 0.32, base - s * 0.5); x.lineTo(cx, base - s * 0.72); x.lineTo(cx + s * 0.32, base - s * 0.5); x.fill(); }
  function paintMural(x, theme, k) {
    const w = 256, h = 256, r = rng(theme.length * 131 + k * 17 + 5);
    if (theme === 'saints' || theme === 'apostles') {   // gold ground, arcade, standing figures with haloes
      const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#e9c25a'); g.addColorStop(1, '#b8862e'); x.fillStyle = g; x.fillRect(0, 0, w, h);
      for (let i = 0; i < 300; i++) { x.fillStyle = r() < 0.5 ? 'rgba(255,240,180,.35)' : 'rgba(120,80,20,.25)'; x.fillRect(r() * w, r() * h, 2, 2); }
      const n = theme === 'saints' ? 2 : 3, robes = ['#2a4a8a', '#8a2a2a', '#3a6a3a', '#6a3a7a', '#a87a2a'];
      for (let i = 0; i < n; i++) { const cx = (i + 0.5) / n * w; x.fillStyle = 'rgba(40,30,80,.55)'; x.beginPath(); x.arc(cx, 80, w / n * 0.38, Math.PI, 0); x.lineTo(cx + w / n * 0.38, 230); x.lineTo(cx - w / n * 0.38, 230); x.fill(); figure(x, cx, 226, 170, robes[(i + k) % robes.length], true, r); }
      x.fillStyle = '#6a2018'; x.fillRect(0, 232, w, 24);
    } else if (theme === 'parzival' || theme === 'grail' || theme === 'tannhauser') {
      landscape(x, w, h, r, ['#9ec4e8', '#f2e2c0'], ['#7a9a5a', '#5a7a44', '#3e5a30']);
      for (let i = 0; i < 5; i++) tree(x, 20 + r() * 216, 200 + r() * 30, 50 + r() * 30, ['#3e6a34', '#4a7a3a', '#2e5428'][i % 3]);
      if (theme === 'grail') { castle(x, 150, 140, 90); x.fillStyle = '#f6d36a'; x.beginPath(); x.arc(70, 70, 22, 0, 7); x.fill(); x.fillStyle = '#d9ad48'; x.fillRect(62, 70, 16, 30); }
      else castle(x, 190, 150, 70);
      figure(x, 90 + k * 20, 236, 140, theme === 'tannhauser' ? '#7a2a5a' : '#8a2a2a', false, r);
      x.fillStyle = '#9aa0a8'; x.fillRect(84 + k * 20, 150, 4, 70);   // a spear
    } else if (theme === 'tristan') {   // night garden in blue
      landscape(x, w, h, r, ['#1a2448', '#3a4a7a'], ['#2a3a5a', '#1e2c48']);
      x.fillStyle = '#f2ecd0'; x.beginPath(); x.arc(200, 50, 16, 0, 7); x.fill();
      for (let i = 0; i < 40; i++) { x.fillStyle = '#f6eebc'; x.fillRect(r() * w, r() * 120, 1.5, 1.5); }
      figure(x, 100, 236, 130, '#3a4a9a', false, r); figure(x, 150, 236, 120, '#d8d0e8', false, r);
    } else if (theme === 'lohengrin') {   // the swan knight on the lake
      landscape(x, w, h, r, ['#a8cce8', '#e8f0f6'], ['#6a8a9a']);
      x.fillStyle = '#4a7aa8'; x.fillRect(0, 170, w, 86); for (let i = 0; i < 30; i++) { x.fillStyle = 'rgba(255,255,255,.4)'; x.fillRect(r() * w, 175 + r() * 80, 10, 1.5); }
      x.fillStyle = '#fff'; x.beginPath(); x.ellipse(120, 196, 34, 12, 0, 0, 7); x.fill(); x.lineWidth = 7; x.strokeStyle = '#fff'; x.beginPath(); x.moveTo(146, 192); x.quadraticCurveTo(170, 170, 156, 150); x.stroke();
      x.fillStyle = '#7a5a2a'; x.beginPath(); x.moveTo(60, 210); x.lineTo(110, 210); x.lineTo(100, 222); x.lineTo(68, 222); x.fill(); figure(x, 84, 210, 90, '#c8ccd8', false, r);
    } else if (theme === 'minstrels') {
      const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#8a3a2a'); g.addColorStop(1, '#4a1a12'); x.fillStyle = g; x.fillRect(0, 0, w, h);
      for (let i = 0; i < 4; i++) figure(x, 40 + i * 58, 236, 120 + r() * 30, ['#d8b048', '#2a4a8a', '#3a6a3a', '#e8e0d0'][i], false, r);
      x.fillStyle = '#d9ad48'; x.fillRect(0, 0, w, 16); x.fillRect(0, 240, w, 16);
    } else if (theme === 'portrait') {   // a country-house portrait: a figure on a dark ground in a gilt frame
      const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#3a2e24'); g.addColorStop(1, '#1e1812'); x.fillStyle = g; x.fillRect(0, 0, w, h);
      x.fillStyle = 'rgba(120,90,60,.35)'; x.beginPath(); x.ellipse(128, 120, 90, 110, 0, 0, 7); x.fill();
      const robe = ['#2a3a5a', '#5a1a1a', '#1a1a1a', '#4a5a3a', '#e8dcc8'][(k + theme.length) % 5];
      x.fillStyle = robe; x.beginPath(); x.moveTo(60, 256); x.quadraticCurveTo(128, 120, 196, 256); x.fill();
      x.fillStyle = '#e6c8a8'; x.beginPath(); x.ellipse(128, 104, 30, 38, 0, 0, 7); x.fill();
      x.fillStyle = k % 2 ? '#3a2a1a' : '#c8b48a'; x.beginPath(); x.ellipse(128, 80, 34, 22, 0, Math.PI, 0); x.fill();
      x.fillStyle = '#f2ece0'; x.fillRect(112, 140, 32, 10);
    } else if (theme === 'equestrian') {   // after the great equestrian portrait of the Dining Room: a rider on a grey horse under an arch
      landscape(x, w, h, r, ['#8aa0b8', '#d8c8a0'], ['#6a7a4a', '#4a5a34']);
      x.fillStyle = 'rgba(40,30,20,.6)'; x.fillRect(0, 0, 40, h); x.fillRect(w - 40, 0, 40, h);
      x.fillStyle = '#d8d4cc'; x.beginPath(); x.ellipse(128, 170, 62, 30, 0, 0, 7); x.fill();
      x.fillRect(72, 170, 10, 60); x.fillRect(96, 175, 10, 55); x.fillRect(150, 175, 10, 55); x.fillRect(174, 170, 10, 60);
      x.beginPath(); x.moveTo(176, 160); x.lineTo(206, 110); x.lineTo(220, 120); x.lineTo(196, 170); x.fill();
      x.fillStyle = '#5a4a3a'; x.fillRect(200, 104, 18, 8);
      x.fillStyle = '#3a3a44'; x.fillRect(116, 104, 24, 50); x.fillStyle = '#e6c8a8'; x.beginPath(); x.arc(128, 96, 11, 0, 7); x.fill(); x.fillStyle = '#2a1a10'; x.beginPath(); x.arc(128, 90, 12, Math.PI, 0); x.fill();
      x.strokeStyle = '#8a7a6a'; x.lineWidth = 3; x.beginPath(); x.moveTo(140, 120); x.lineTo(176, 100); x.stroke();
    } else if (theme === 'landscape' || theme === 'hunt') {   // an English landscape: downs, a lake, trees; the hunt adds riders and hounds
      landscape(x, w, h, r, ['#9ab8d8', '#efe6cc'], ['#8aa060', '#6a8a48', '#4e6a38']);
      x.fillStyle = '#7a9ab4'; x.fillRect(30, 180, 120, 18);
      for (let i = 0; i < 6; i++) tree(x, 20 + r() * 216, 170 + r() * 40, 46 + r() * 40, ['#3e5a2e', '#4a6a34', '#5a7a3e'][i % 3]);
      if (theme === 'hunt') for (let i = 0; i < 3; i++) { const hx = 60 + i * 60; x.fillStyle = '#6a4a2a'; x.fillRect(hx, 200, 30, 12); x.fillRect(hx + 2, 212, 4, 14); x.fillRect(hx + 24, 212, 4, 14); x.fillStyle = '#b8201c'; x.fillRect(hx + 10, 186, 10, 14); }
    } else if (theme === 'swan') {   // the inn sign: a white swan on navy, gilt letters
      x.fillStyle = '#1e2c4a'; x.fillRect(0, 0, w, h);
      x.strokeStyle = '#6a9ab8'; x.lineWidth = 3; for (let i = 0; i < 4; i++) { x.beginPath(); x.moveTo(40, 188 + i * 7); x.lineTo(216, 188 + i * 7); x.stroke(); }
      x.fillStyle = '#f6f4ee'; x.beginPath(); x.ellipse(120, 166, 64, 26, 0, 0, 7); x.fill(); x.lineWidth = 14; x.strokeStyle = '#f6f4ee'; x.beginPath(); x.moveTo(168, 156); x.quadraticCurveTo(200, 116, 172, 86); x.stroke(); x.beginPath(); x.ellipse(170, 82, 13, 9, 0, 0, 7); x.fill();
      x.fillStyle = '#e88a2a'; x.beginPath(); x.moveTo(158, 80); x.lineTo(138, 86); x.lineTo(158, 89); x.fill();
      x.fillStyle = '#d9b45a'; x.textAlign = 'center'; x.font = 'bold 34px serif'; x.fillText('THE SWAN', 128, 236); x.font = 'bold 18px serif'; x.fillText('BIBURY', 128, 42);
    } else if (theme === 'forest') {   // the stage backdrop: a forest clearing
      landscape(x, w, h, r, ['#bcd8ec', '#eaf2e0'], ['#7a9a5a', '#5a7a44']);
      for (let i = 0; i < 18; i++) tree(x, r() * w, 160 + r() * 90, 50 + r() * 70, ['#3e6a34', '#4a7a3a', '#2e5428', '#5a8a44'][i % 4]);
    }
    frame(x, w, h);
  }
  function paintApse(x) {
    const w = 1024, h = 256, r = rng(77);
    const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#f2cf6a'); g.addColorStop(1, '#c0902e'); x.fillStyle = g; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 9000; i++) { x.fillStyle = r() < 0.5 ? 'rgba(255,245,200,.35)' : 'rgba(120,80,10,.22)'; x.fillRect(Math.floor(r() * w / 3) * 3, Math.floor(r() * h / 3) * 3, 2, 2); }
    // palm trees between the figures, a figure in majesty in the middle, kings at the sides
    for (let i = 0; i < 7; i++) { const cx = (i + 0.5) / 7 * w; if (i === 3) { x.fillStyle = '#2a4a8a'; x.beginPath(); x.ellipse(cx, 120, 70, 110, 0, 0, 7); x.fill(); figure(x, cx, 240, 220, '#f2f0ea', true, r); } else figure(x, cx, 244, 170, ['#8a2a2a', '#2a4a8a', '#3a6a3a', '', '#6a3a7a', '#8a2a2a', '#2a4a8a'][i], true, r); }
    for (let i = 0; i < 6; i++) { const cx = (i + 1) / 7 * w; x.strokeStyle = '#3e6a34'; x.lineWidth = 6; x.beginPath(); x.moveTo(cx, 250); x.lineTo(cx, 120); x.stroke(); for (let k = 0; k < 6; k++) { x.beginPath(); x.moveTo(cx, 120); x.quadraticCurveTo(cx + Math.cos(k) * 30, 100, cx + Math.cos(k) * 46, 120 + Math.sin(k) * 10); x.stroke(); } }
    x.fillStyle = '#6a2018'; x.fillRect(0, 0, w, 10); x.fillRect(0, h - 10, w, 10);
  }
  function paintDome(x) {
    const w = 512, h = 256, r = rng(91);
    const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#1a2a6a'); g.addColorStop(1, '#2a4a9a'); x.fillStyle = g; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 160; i++) { const sx = r() * w, sy = r() * h, s = 2 + r() * 3; x.fillStyle = '#f6d36a'; x.beginPath(); for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2, rr = k & 1 ? s * 0.4 : s; x.lineTo(sx + Math.cos(a) * rr, sy + Math.sin(a) * rr); } x.fill(); }
    x.fillStyle = '#f6d36a'; x.fillRect(0, h - 12, w, 12);
  }
  function paintFloor(x) {   // the mosaic floor: a great circle with the animals and plants of the world (here abstracted), a border
    const w = 1024, h = 768, r = rng(13);
    x.fillStyle = '#e8e2d2'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 26000; i++) { x.fillStyle = ['rgba(200,190,170,.5)', 'rgba(255,255,250,.5)'][i & 1]; x.fillRect(Math.floor(r() * w / 4) * 4, Math.floor(r() * h / 4) * 4, 3, 3); }
    x.lineWidth = 26; x.strokeStyle = '#2a4a7a'; x.strokeRect(20, 20, w - 40, h - 40); x.lineWidth = 8; x.strokeStyle = '#b8862e'; x.strokeRect(46, 46, w - 92, h - 92);
    for (let k = 0; k < 40; k++) { const t = k / 40; x.fillStyle = k & 1 ? '#8a2a2a' : '#3a6a3a'; x.beginPath(); x.arc(70 + t * (w - 140), 70, 10, 0, 7); x.fill(); x.beginPath(); x.arc(70 + t * (w - 140), h - 70, 10, 0, 7); x.fill(); }
    const cx = w / 2, cy = h / 2;
    [[300, '#c8b07a'], [280, '#2a4a7a'], [262, '#e8e2d2'], [190, '#3a6a3a'], [176, '#e8e2d2'], [110, '#b8862e'], [96, '#2a4a7a']].forEach(([rr, c]) => { x.fillStyle = c; x.beginPath(); x.arc(cx, cy, rr, 0, 7); x.fill(); });
    for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2, px = cx + Math.cos(a) * 222, py = cy + Math.sin(a) * 222; x.fillStyle = ['#8a2a2a', '#3a6a3a', '#b8862e', '#2a4a7a'][k % 4]; x.beginPath(); x.ellipse(px, py, 26, 14, a, 0, 7); x.fill(); x.fillStyle = '#e8e2d2'; x.beginPath(); x.arc(px + Math.cos(a) * 14, py + Math.sin(a) * 14, 5, 0, 7); x.fill(); }
    for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; x.strokeStyle = '#3a6a3a'; x.lineWidth = 5; x.beginPath(); x.moveTo(cx + Math.cos(a) * 110, cy + Math.sin(a) * 110); x.lineTo(cx + Math.cos(a) * 170, cy + Math.sin(a) * 170); x.stroke(); }
    x.fillStyle = '#f6d36a'; for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx + Math.cos(a) * 90, cy + Math.sin(a) * 90); x.lineTo(cx + Math.cos(a + 0.3) * 40, cy + Math.sin(a + 0.3) * 40); x.fill(); }
  }

  /* ================= the far landscape ================= */
  function buildFar(world, T) {
    const group = new T.Group(); group.name = 'bb-far'; let n = 0;
    const r = rng(1380), cx = world.W / 2, cz = world.D / 2;
    const pos = [], col = [];
    const cGrass = [0.52, 0.68, 0.34], cWood = [0.30, 0.44, 0.24], cTop = [0.60, 0.72, 0.40];
    function down(px, pz, base, top, rad, sides) {   // a rounded chalk down: a low dome of 4 rings, woods on the lower flanks, pale grass on the crest
      const rings = [[1, 0], [0.78, 0.42], [0.5, 0.78], [0.22, 0.96]].map(([fr, fy]) => { const out = []; for (let i = 0; i < sides; i++) { const a = i / sides * Math.PI * 2, rr = rad * fr * (0.9 + 0.2 * Math.sin(a * 3 + px)); out.push([px + Math.cos(a) * rr, base + (top - base) * fy, pz + Math.sin(a) * rr]); } return out; });
      const apex = [px, top, pz];
      const shade = (y) => { const t = (y - base) / (top - base); return t < 0.3 && r() < 0.7 ? cWood : t > 0.8 ? cTop : cGrass; };
      const tri = (a, b, c) => { const s = shade((a[1] + b[1] + c[1]) / 3), k = 0.9 + r() * 0.1; [a, b, c].forEach((p) => { pos.push(p[0], p[1], p[2]); col.push(s[0] * k, s[1] * k, s[2] * k); }); };
      for (let q = 0; q < rings.length - 1; q++) { const A = rings[q], Bq = rings[q + 1]; for (let i = 0; i < sides; i++) { const j = (i + 1) % sides; tri(A[i], Bq[i], Bq[j]); tri(A[i], Bq[j], A[j]); } }   // counter-clockwise seen from outside
      const L = rings[rings.length - 1]; for (let i = 0; i < sides; i++) tri(L[i], apex, L[(i + 1) % sides]);
    }
    // the downs of north Hampshire all round (Beacon Hill, Siddown, Watership Down side): low rounded hills, no snow
    for (let i = 0; i < 64; i++) { const a = r() * Math.PI * 2, d = 420 + r() * 760; down(cx + Math.cos(a) * d, cz + Math.sin(a) * d, 34, 48 + r() * 30, Math.min(280 + r() * 260, d - 260), 14); }   // the Cotswold wolds: long, low, rounded   // the foot of each down stays outside the park
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new T.Float32BufferAttribute(col, 3)); g.computeVertexNormals();
    const m = new T.Mesh(g, new T.MeshLambertMaterial({ vertexColors: true, flatShading: true })); group.add(m); n++;
    return { group, n };
  }

  root.BBProps = { build };
})(window);
