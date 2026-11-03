  /* ================= flags (Greek) ================= */
  const flagMeshes = [];
  function spawnFlags() {
    const c = document.createElement('canvas'); c.width = 54; c.height = 36;
    const x = c.getContext('2d');
    x.fillStyle = '#ffffff'; x.fillRect(0, 0, 54, 36);
    x.fillStyle = '#0d5eaf';
    for (let i = 0; i < 9; i += 2) x.fillRect(0, i * 4, 54, 4);
    x.fillRect(0, 0, 20, 20);
    x.fillStyle = '#ffffff'; x.fillRect(8, 0, 4, 20); x.fillRect(0, 8, 20, 4);
    const tex = new THREE.CanvasTexture(c); tex.magFilter = THREE.NearestFilter; tex.minFilter = THREE.NearestFilter; tex.generateMipmaps = false;
    for (const f of world.flags) {
      const geo = new THREE.PlaneGeometry(4.2, 2.8, 11, 6); geo.translate(2.1, -1.4, 0);
      const mesh = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ map: tex, side: THREE.DoubleSide }));
      mesh.position.set(f[0] + 0.5, f[1] + 0.6, f[2]); mesh.castShadow = true; scene.add(mesh);
      flagMeshes.push({ mesh, base: Float32Array.from(geo.attributes.position.array), ph: Math.random() * 6 });
    }
  }
  function updateFlags(time) {
    for (const f of flagMeshes) {
      const p = f.mesh.geometry.attributes.position, a = p.array;
      for (let i = 0; i < p.count; i++) {
        const x = f.base[i * 3], y = f.base[i * 3 + 1], k = x / 4.2;
        a[i * 3 + 2] = Math.sin(x * 1.5 - time * 5 + f.ph) * 0.32 * k + Math.sin(y * 2 - time * 3) * 0.05 * k;
        a[i * 3 + 1] = y - Math.sin(x * 1.1 - time * 4 + f.ph) * 0.06 * k;
      }
      p.needsUpdate = true; f.mesh.geometry.computeVertexNormals();
    }
  }

  /* ================= windmills ================= */
  const mills = [];
  function spawnWindmills() {
    for (const m of world.windmills) {
      const hub = new THREE.Group(); hub.position.set(m.hubX, m.hubY, m.hubZ);
      const rot = new THREE.Group(); hub.add(rot);
      for (let k = 0; k < 4; k++) {
        const arm = new THREE.Group(); arm.rotation.x = k * Math.PI / 2; rot.add(arm);
        bx(arm, 0.22, 9.4, 0.22, 0x6b4a2a, 0, 4.7, 0);
        bx(arm, 0.08, 7.0, 1.5, 0xf6f2e6, -0.06, 5.4, 0.85);
        for (let j = 1; j <= 4; j++) bx(arm, 0.1, 0.1, 1.6, 0x6b4a2a, -0.06, 1.2 + j * 1.5, 0.85);
      }
      bx(hub, 0.7, 0.7, 0.7, 0x4a3320, 0, 0, 0);
      scene.add(hub); mills.push({ rot, ph: Math.random() * 6 });
    }
  }
  function updateMills(t) { for (const m of mills) m.rot.rotation.x = t * 0.6 + m.ph; }

  /* ================= donkeys on the Ammoudi stairs ================= */
  const donkeys = [];
  function makeDonkey() {
    const g = new THREE.Group(), body = pickOf([0x8a8478, 0x6e6a60, 0xa49a88]), dk = 0x3a3630, lt = 0xd8d2c4;
    bx(g, 0.5, 0.58, 1.2, body, 0, 1.0, 0);
    bx(g, 0.36, 0.5, 0.4, body, 0, 1.4, 0.65);
    bx(g, 0.32, 0.34, 0.55, body, 0, 1.62, 1.0);
    bx(g, 0.28, 0.2, 0.22, lt, 0, 1.52, 1.34);
    bx(g, 0.08, 0.36, 0.08, dk, 0.1, 1.95, 0.9); bx(g, 0.08, 0.36, 0.08, dk, -0.1, 1.95, 0.9);
    bx(g, 0.07, 0.5, 0.07, dk, 0, 0.92, -0.66);
    bx(g, 0.58, 0.12, 0.6, 0xb03030, 0, 1.35, -0.05);
    bx(g, 0.22, 0.34, 0.5, 0xc89050, 0.38, 1.1, -0.05); bx(g, 0.22, 0.34, 0.5, 0xc89050, -0.38, 1.1, -0.05);
    const legs = [];
    for (const [lx, lz] of [[0.17, 0.45], [-0.17, 0.45], [0.17, -0.45], [-0.17, -0.45]]) {
      const lg = new THREE.Group(); lg.position.set(lx, 0.72, lz); g.add(lg);
      bx(lg, 0.14, 0.72, 0.14, body, 0, -0.36, 0); bx(lg, 0.16, 0.08, 0.16, dk, 0, -0.68, 0);
      legs.push(lg);
    }
    const root = new THREE.Group(); root.add(g);
    return { root, inner: g, legs };
  }
  function spawnDonkeys() {
    const path = world.donkeyPath;
    if (!path || path.length < 4) return;
    const cum = [0];
    for (let i = 1; i < path.length; i++) cum.push(cum[i - 1] + Math.hypot(path[i][0] - path[i - 1][0], path[i][2] - path[i - 1][2]) + 0.0001);
    const L = cum[cum.length - 1];
    for (let n = 0; n < 4; n++) {
      const d = makeDonkey(); scene.add(d.root);
      Object.assign(d, { path, cum, L, s: L * (n + 0.5) / 4, dir: n % 2 ? 1 : -1, speed: rr(1.1, 1.5), heading: 0, init: false, wait: 0, ph: Math.random() * 6 });
      donkeys.push(d);
    }
  }
  function updateDonkeys(dt, time) {
    for (const d of donkeys) {
      if (d.wait > 0) d.wait -= dt;
      else {
        d.s += d.dir * d.speed * dt;
        if (d.s > d.L) { d.s = d.L; d.dir = -1; d.wait = rr(2, 6); }
        if (d.s < 0) { d.s = 0; d.dir = 1; d.wait = rr(2, 6); }
      }
      let i = 1; while (i < d.cum.length - 1 && d.cum[i] < d.s) i++;
      const a = d.path[i - 1], b = d.path[i], t = clamp((d.s - d.cum[i - 1]) / (d.cum[i] - d.cum[i - 1]), 0, 1);
      d.root.position.set(lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t));
      const tx = (b[0] - a[0]) * d.dir, tz = (b[2] - a[2]) * d.dir;
      const target = (Math.abs(tx) + Math.abs(tz) > 1e-4) ? Math.atan2(tx, tz) : d.heading;
      if (!d.init) { d.heading = target; d.init = true; }
      d.heading += wrapAngle(target - d.heading) * (1 - Math.exp(-6 * dt));
      d.root.rotation.y = d.heading;
      const moving = d.wait <= 0, sw = moving ? Math.sin(time * 6 + d.ph) * 0.5 : 0;
      d.legs[0].rotation.x = sw; d.legs[3].rotation.x = sw; d.legs[1].rotation.x = -sw; d.legs[2].rotation.x = -sw;
      d.inner.position.y = moving ? Math.abs(Math.sin(time * 6 + d.ph)) * 0.04 : 0;
    }
  }

  /* ================= cats on the rooftops ================= */
  const cats = [];
  function makeCat(c) {
    const g = new THREE.Group();
    bx(g, 0.22, 0.2, 0.46, c, 0, 0.2, 0, false);
    bx(g, 0.2, 0.19, 0.19, c, 0, 0.34, 0.26, false);
    bx(g, 0.05, 0.08, 0.04, c, 0.07, 0.47, 0.26, false); bx(g, 0.05, 0.08, 0.04, c, -0.07, 0.47, 0.26, false);
    bx(g, 0.04, 0.04, 0.02, 0x66cc55, 0.05, 0.36, 0.36, false); bx(g, 0.04, 0.04, 0.02, 0x66cc55, -0.05, 0.36, 0.36, false);
    const tail = new THREE.Group(); tail.position.set(0, 0.2, -0.24); g.add(tail);
    bx(tail, 0.06, 0.06, 0.4, c, 0, 0, -0.2, false);
    return { g, tail };
  }
  function spawnCats() {
    const cols = [0xe0883a, 0x6a6a70, 0x1c1c20, 0xf0ede6, 0xb8a080, 0xcfa070];
    let n = 0, tries = 0;
    while (n < 22 && tries++ < 8000) {
      const x = Math.floor(rr(100, world.W - 6)), z = Math.floor(rr(30, 190)), i = x + world.W * z;
      if (!world.town[i]) continue;
      const tb = world.topB[i], y = world.topH[i];
      if ((tb !== B.PLASTER && tb !== B.PAVE) || y < 16) continue;
      const c = makeCat(pickOf(cols));
      c.g.position.set(x + 0.5, y, z + 0.5); c.g.rotation.y = Math.random() * 6.28; c.ph = Math.random() * 6;
      scene.add(c.g); cats.push(c); n++;
    }
  }
  function updateCats(time) { for (const c of cats) c.tail.rotation.y = Math.sin(time * 1.6 + c.ph) * 0.55; }

  function spawnProps() { spawnFlags(); spawnWindmills(); spawnDonkeys(); spawnCats(); }
  function updateProps(dt, time) { updateFlags(time); updateMills(time); updateDonkeys(dt, time); updateCats(time); }

