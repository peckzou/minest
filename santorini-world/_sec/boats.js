  /* ================= boats ================= */
  const boats = [];
  const rideBoats = [];
  const HULLS = [0xf4f4f0, 0x1f55b5, 0xc83a2c, 0xe8b028];
  const awnMat = new THREE.MeshLambertMaterial({
    map: pixelTex(8, (x) => { for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? '#f6f6f2' : '#1f55b5'; x.fillRect(0, i, 8, 1); } })
  });

  function addPerson(parent, x, y, z, shirt, hat) {
    const skin = pickOf([0xf0c8a0, 0xe0b48c, 0xc99a74, 0x8d5a3a]);
    bx(parent, 0.3, 0.5, 0.2, 0x2a3a5c, x, y + 0.25, z);
    bx(parent, 0.38, 0.5, 0.24, shirt, x, y + 0.75, z);
    bx(parent, 0.28, 0.28, 0.28, skin, x, y + 1.14, z);
    if (hat) { bx(parent, 0.5, 0.05, 0.5, hat, x, y + 1.31, z); bx(parent, 0.3, 0.12, 0.3, hat, x, y + 1.38, z); }
  }

  // traditional Greek caïque: small wooden fishing boat with a little wheelhouse
  function makeCaique(hull) {
    const g = new THREE.Group();
    const wood = 0x8a5a32, white = 0xf6f6f2, blue = 0x1f55b5;
    bx(g, 1.7, 0.55, 5.4, hull, 0, 0.27, 0);
    bx(g, 1.2, 0.5, 1.5, hull, 0, 0.42, 3.1); bx(g, 0.7, 0.5, 1.0, hull, 0, 0.7, 4.0);
    bx(g, 1.3, 0.5, 1.3, hull, 0, 0.42, -3.0);
    bx(g, 1.5, 0.06, 4.9, wood, 0, 0.58, 0);
    bx(g, 0.1, 0.22, 5.6, white, 0.85, 0.66, 0.2); bx(g, 0.1, 0.22, 5.6, white, -0.85, 0.66, 0.2);
    bx(g, 1.1, 0.9, 1.5, white, 0, 1.06, -1.3);
    bx(g, 1.12, 0.28, 1.0, 0x24344c, 0, 1.2, -1.3);
    bx(g, 1.3, 0.1, 1.7, blue, 0, 1.55, -1.3);
    bx(g, 0.12, 2.4, 0.12, wood, 0, 1.8, 1.7);
    bx(g, 0.03, 0.45, 0.7, blue, 0, 2.8, 2.05);
    bx(g, 0.14, 0.2, 0.14, 0xffd070, 0, 1.0, 4.35);
    bx(g, 0.35, 0.3, 0.35, 0xe8602a, 0.45, 0.75, 0.7); bx(g, 0.35, 0.3, 0.35, 0xe8602a, -0.4, 0.75, 0.25);
    bx(g, 0.5, 0.25, 0.5, 0xb98a58, 0.35, 0.72, -3.0);
    if (Math.random() < 0.75) addPerson(g, -0.35, 0.6, 0.9, pickOf([0xf0f0ea, 0xc03a2e, 0x2f5fb8]), 0x1f55b5);
    const root = new THREE.Group(); root.add(g);
    return { root, inner: g, kind: 'caique', eye: [0.45, 2.3, 2.4] };
  }

  const sailGeo = (function () {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0, 0, 0, 0, 4.4, 0, 0, 0, -2.4]), 3));
    g.computeVertexNormals(); return g;
  })();
  // two-masted wooden gulet used for caldera sunset cruises
  function makeGulet() {
    const g = new THREE.Group();
    const wood = 0x7a4a28, deck = 0xb98a58, white = 0xf6f6f2, blue = 0x1f55b5, cream = 0xf7f2e4;
    bx(g, 3.0, 1.1, 10.5, wood, 0, 0.55, 0);
    bx(g, 2.4, 1.0, 2.6, wood, 0, 0.7, 6.2); bx(g, 1.4, 0.9, 1.8, wood, 0, 1.0, 8.0); bx(g, 0.5, 0.7, 1.4, wood, 0, 1.55, 9.4);
    bx(g, 2.6, 0.08, 9.6, deck, 0, 1.12, 0);
    bx(g, 0.12, 0.4, 10.4, white, 1.45, 1.32, 0); bx(g, 0.12, 0.4, 10.4, white, -1.45, 1.32, 0);
    bx(g, 2.4, 1.3, 3.0, white, 0, 1.8, -3.4); bx(g, 2.42, 0.35, 2.4, 0x24344c, 0, 1.95, -3.4); bx(g, 2.6, 0.12, 3.2, deck, 0, 2.5, -3.4);
    for (const [px, pz] of [[0.95, -0.9], [-0.95, -0.9], [0.95, 1.9], [-0.95, 1.9]]) bx(g, 0.1, 1.45, 0.1, wood, px, 1.85, pz);
    bx(g, 2.2, 0.08, 3.0, awnMat, 0, 2.62, 0.5);
    bx(g, 0.2, 9, 0.2, wood, 0, 5.6, 1.4); bx(g, 0.16, 7, 0.16, wood, 0, 4.6, 5.0);
    const mk = (sx, sy, sz, px, py, pz, flip) => {
      const m = new THREE.Mesh(sailGeo, new THREE.MeshLambertMaterial({ color: cream, side: THREE.DoubleSide }));
      m.scale.set(1, sy, sz); m.position.set(px, py, pz); if (flip) m.rotation.y = Math.PI; m.castShadow = true; g.add(m); return m;
    };
    mk(1, 1.8, 2.6, 0, 1.9, 1.4); mk(1, 1.3, 1.6, 0, 1.7, 5.0); mk(1, 1.4, 1.7, 0, 1.9, 5.2, true);
    bx(g, 0.1, 1.6, 0.1, wood, 0, 2.0, -4.9); bx(g, 0.03, 0.5, 0.8, blue, 0, 3.0, -5.3);
    addPerson(g, 0.7, 1.15, 0.2, 0xd04040, 0xe8d49a); addPerson(g, -0.6, 1.15, 0.9, 0x3a6ad0, null);
    addPerson(g, 0.3, 1.15, 1.6, 0xf0e0b0, 0xf6f6f2); addPerson(g, -0.8, 1.15, -0.3, 0xe0a030, null);
    addPerson(g, 0.0, 1.15, -5.0, 0xf6f6f2, 0x1f55b5);
    const root = new THREE.Group(); root.add(g);
    return { root, inner: g, kind: 'gulet', eye: [1.0, 2.85, 6.6] };
  }

  function makeFerry() {
    const g = new THREE.Group();
    bx(g, 3.2, 0.9, 11, 0xf2f2ee, 0, 0.45, 0);
    bx(g, 2.5, 0.8, 1.6, 0xf2f2ee, 0, 0.45, 6.2); bx(g, 1.6, 0.7, 1.2, 0xf2f2ee, 0, 0.5, 7.4);
    bx(g, 3.24, 0.22, 11.04, 0x1f3f8a, 0, 0.62, 0);
    bx(g, 3.26, 0.1, 11.06, 0xe0b020, 0, 0.82, 0);
    bx(g, 2.8, 1.3, 7.6, 0xf6f6f2, 0, 1.55, -0.6);
    bx(g, 2.86, 0.55, 7.2, 0x24344c, 0, 1.7, -0.6);
    bx(g, 2.9, 0.1, 8.0, 0xdadad6, 0, 2.25, -0.6);
    bx(g, 2.2, 0.8, 1.6, 0xf6f6f2, 0, 1.45, 4.0); bx(g, 2.0, 0.4, 0.2, 0x24344c, 0, 1.7, 4.85);
    bx(g, 0.3, 0.9, 0.3, 0x1f3f8a, 0.9, 2.7, -4.2);
    for (let i = -3; i <= 3; i++) { bx(g, 0.1, 0.3, 0.3, 0xdddddd, 1.62, 1.05, i * 1.4); bx(g, 0.1, 0.3, 0.3, 0xdddddd, -1.62, 1.05, i * 1.4); }
    const root = new THREE.Group(); root.add(g);
    return { root, inner: g, kind: 'ferry' };
  }

  function addRoute(points, kind, opts) {
    const curve = new THREE.CatmullRomCurve3(points.map((p) => new V3(p[0], 0, p[1])), false, 'centripetal');
    const L = curve.getLength();
    const b = kind === 'caique' ? makeCaique(opts.hull) : kind === 'gulet' ? makeGulet() : makeFerry();
    b.curve = curve; b.L = L; b.a = opts.a == null ? 4 : opts.a; b.b = L - (opts.b == null ? 4 : opts.b);
    b.speed = opts.speed || 3; b.u0 = opts.u0 || 0; b.lat = opts.lat == null ? 0 : opts.lat; b.phase = Math.random() * 6.28;
    b.yaw = 0; b.pos = new V3(); b.dir = 1; b.heading = 0;
    scene.add(b.root); boats.push(b);
    if (b.eye) rideBoats.push(b);
    return b;
  }
  function addMoored() {
    for (const m of world.moorings) {
      const b = makeCaique(HULLS[m.color % HULLS.length]);
      b.root.position.set(m.x, VW.WATER_Y - 0.25, m.z);
      b.root.rotation.y = m.yaw + (Math.random() - 0.5) * 0.06;
      b.phase = Math.random() * 6.28; b.moored = true;
      scene.add(b.root); boats.push(b);
    }
  }
  const _p = new V3(), _t = new V3();
  function updateBoats(dt, time) {
    for (const b of boats) {
      if (b.moored) {
        b.inner.position.y = Math.sin(time * 1.4 + b.phase) * 0.035;
        b.inner.rotation.z = Math.sin(time * 1.1 + b.phase) * 0.025;
        continue;
      }
      const span = b.b - b.a;
      const u = (b.u0 + time * b.speed) % (2 * span);
      const ph = u / span;
      const p = ph < 1 ? ph : 2 - ph;
      const f = p - 0.5 * Math.sin(2 * Math.PI * p) / (2 * Math.PI);
      const s = b.a + span * f;
      const dir = ph < 1 ? 1 : -1;
      const uu = clamp(s / b.L, 0, 1);
      b.curve.getPointAt(uu, _p); b.curve.getTangentAt(uu, _t);
      const nx = -_t.z, nz = _t.x;
      const lat = b.lat * clamp(Math.sin(Math.PI * ph) * 6, -1, 1);
      const px = _p.x + nx * lat, pz = _p.z + nz * lat;
      const target = Math.atan2(_t.x * dir, _t.z * dir);
      if (!b.init) { b.heading = target; b.init = true; }
      b.heading += wrapAngle(target - b.heading) * (1 - Math.exp(-2.2 * dt));
      b.pos.set(px, VW.WATER_Y - (b.kind === 'gulet' ? 0.45 : b.kind === 'ferry' ? 0.3 : 0.25), pz);
      b.root.position.copy(b.pos); b.root.rotation.y = b.heading;
      b.inner.position.y = Math.sin(time * 1.6 + b.phase) * 0.03;
      b.inner.rotation.z = Math.sin(time * 1.2 + b.phase) * 0.02 + (b.kind === 'gulet' ? 0.05 : 0);
      b.inner.rotation.x = Math.sin(time * 1.9 + b.phase) * 0.012;
    }
  }

