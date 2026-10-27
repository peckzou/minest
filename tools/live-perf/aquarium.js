/* Duo Aquarium V1 — a 3D aquarium for Pet Raising's Octo that spans the iPhone Duo's two screens when the phone stands
   folded (an L / a book). Both screens are windows into one tank: each gets an off-axis camera (Kooima's generalized
   perspective projection) built from the real fold angle (window.__minestHinge) and one shared eye in front of the
   phone, so whatever crosses the hinge stays continuous, as in a book nook or a glass diorama.
   Upright & half-folded: the top screen is the tank's front glass, the bottom one its floor seen from above.
   Sideways & half-folded (a book): the two screens are the two glass walls of a corner tank.
   Anywhere else (flat, the outer screen, another phone): one ordinary camera on the same tank.
   Reuses Pet Raising's Octo (the same GLB + MinestCosmetics outfit as the Mini Pet and Stand Mode) and its Shell House
   look; tap the water to feed the fish, tap Octo to make it wave. Draws at ≤30 fps and stops while hidden.
   Open: MinestAquarium.open() · #aquarium · Pet Raising ▸ 🐠 Duo Aquarium (aquarium-entry-v1.js posts to this page). */
(function () {
  'use strict';
  if (window.MinestAquarium) return;
  var T, root, renderer, scene, tank, cams = [], raf = 0, last = 0, clock, octo = null, mixer = null, clips = {}, fish = [], food = [], bubbles = null, weeds = [], hint;
  var CM_PER_PT = 0.0158;   // iPhone Duo inner screen ≈ 0.158 mm per point
  var EYE = { tall: [0, 24, 30], wide: [0, 0, 34] };   // cm, from the hinge: in front of the phone, a little above

  function zh() { return /^zh/i.test(navigator.language || ''); }
  function hinge() { var h = window.__minestHinge; return h && typeof h.angle === 'number' ? h : null; }
  function layout() {
    var w = innerWidth, h = innerHeight, H = hinge(), R = document.documentElement;
    var inner = R.classList.contains('duo-inner') || (window.__MINEST_DUO__ && Math.min(w, h) >= 600 && Math.max(w, h) / Math.min(w, h) < 1.6);
    var folded = H && H.status === 'partial' && H.angle > 0.9 && H.angle < 2.95;
    if (!inner || !folded) return { kind: 'single' };
    return { kind: h > w ? 'tall' : 'wide', angle: H.angle };
  }

  /* ---------- the tank ---------- */
  function mat(c, o) { return new T.MeshStandardMaterial(Object.assign({ color: c, flatShading: true, roughness: .9, metalness: 0 }, o || {})); }
  function lowpoly(geo, amt) {   // jitter the vertices a little: hand-made, low-poly
    var p = geo.attributes.position; for (var i = 0; i < p.count; i++) p.setXYZ(i, p.getX(i) + (Math.random() - .5) * amt, p.getY(i) + (Math.random() - .5) * amt, p.getZ(i) + (Math.random() - .5) * amt);
    geo.computeVertexNormals(); return geo;
  }
  function buildTank() {
    var g = new T.Group();
    // sand floor with dunes (cm: the tank is 22 wide, 20 deep)
    var sand = new T.PlaneGeometry(26, 24, 18, 16); sand.rotateX(-Math.PI / 2);
    var sp = sand.attributes.position; for (var i = 0; i < sp.count; i++) { var x = sp.getX(i), z = sp.getZ(i); sp.setY(i, Math.sin(x * .5) * .35 + Math.cos(z * .45 + x * .2) * .3 + (Math.random() - .5) * .2); }
    sand.computeVertexNormals(); g.add(new T.Mesh(sand, mat(0xc9a46a)));
    // back and side walls: deep water gradient on a low-poly rock wall
    var back = lowpoly(new T.PlaneGeometry(26, 22, 10, 9), .5); var bw = new T.Mesh(back, mat(0x1d5a78)); bw.position.set(0, 11, -12); g.add(bw);
    // rocks
    [[-7, 0, -8, 2.6, 0x7d828c], [-4.6, 0, -9.5, 1.8, 0x6b7079], [6.5, 0, -7, 2.2, 0x868b94], [8.5, 0, -2, 1.3, 0x6f747d], [-8.8, 0, 3, 1.1, 0x7a7f88]].forEach(function (r) {
      var m = new T.Mesh(lowpoly(new T.IcosahedronGeometry(r[3], 0), r[3] * .25), mat(r[4])); m.position.set(r[0], r[1] + r[3] * .45, r[2]); m.scale.y = .75; g.add(m);
    });
    // corals: branching cones and tubes in reef colours
    [[-6, -6, 0xff7a6b], [5, -9, 0xffb347], [8, -5, 0xc77dff], [-2.5, -10, 0xff5d8f], [3, -3, 0x5ad1c9], [-9, -1, 0xffc857]].forEach(function (c, k) {
      var cg = new T.Group();
      for (var j = 0; j < 4; j++) { var h = 1.6 + Math.random() * 2.4, cyl = new T.Mesh(new T.CylinderGeometry(.18, .32, h, 5), mat(c[2])); cyl.position.set((Math.random() - .5) * 1.4, h / 2, (Math.random() - .5) * 1.2); cyl.rotation.z = (Math.random() - .5) * .7; cyl.rotation.x = (Math.random() - .5) * .5; cg.add(cyl);
        var tip = new T.Mesh(new T.IcosahedronGeometry(.32, 0), mat(c[2], { emissive: c[2], emissiveIntensity: .15 })); tip.position.set(cyl.position.x - Math.sin(cyl.rotation.z) * h / 2, h, cyl.position.z + Math.sin(cyl.rotation.x) * h / 2); cg.add(tip); }
      cg.position.set(c[0], 0, c[1]); g.add(cg);
    });
    // seaweed: tall segmented ribbons that sway
    for (var s = 0; s < 9; s++) {
      var hh = 5 + Math.random() * 6, geo = new T.PlaneGeometry(.7, hh, 1, 8); geo.translate(0, hh / 2, 0);
      var wd = new T.Mesh(geo, mat(s % 2 ? 0x3f8f6a : 0x2f7656, { side: T.DoubleSide })); wd.position.set(-10 + Math.random() * 20, 0, -11 + Math.random() * 6); wd.rotation.y = Math.random() * Math.PI;
      wd.userData.base = geo.attributes.position.array.slice(); wd.userData.ph = Math.random() * 6; weeds.push(wd); g.add(wd);
    }
    // Pet Raising's Shell House, in low-poly: a pearl scallop shell over a round doorway
    var house = new T.Group(), shellM = mat(0xf3e6e8, { roughness: .5, metalness: .1 });
    var dome = new T.Mesh(lowpoly(new T.SphereGeometry(2.2, 8, 5, 0, Math.PI * 2, 0, Math.PI / 2), .12), shellM); house.add(dome);
    for (var r = 0; r < 7; r++) { var rib = new T.Mesh(new T.BoxGeometry(.18, .18, 2.6), mat(0xe8cfd6)); rib.position.y = 1.1; rib.rotation.y = r / 7 * Math.PI; rib.rotation.x = .9; house.add(rib); }
    var door = new T.Mesh(new T.CircleGeometry(.75, 7), mat(0x3a2a22)); door.position.set(0, .75, 2.12); house.add(door);
    var win = new T.Mesh(new T.CircleGeometry(.32, 6), mat(0xffd590, { emissive: 0xffc46d, emissiveIntensity: .8 })); win.position.set(-1.1, 1.3, 1.85); win.rotation.y = -.5; house.add(win);
    house.position.set(-4, 0, -3); house.rotation.y = .35; g.add(house);
    // a treasure chest
    var chest = new T.Group(); var cb = new T.Mesh(new T.BoxGeometry(1.8, 1, 1.1), mat(0x8a5a33)); cb.position.y = .5; chest.add(cb);
    var lid = new T.Mesh(new T.CylinderGeometry(.55, .55, 1.8, 6, 1, false, 0, Math.PI), mat(0x9a6a40)); lid.rotation.z = Math.PI / 2; lid.position.y = 1; chest.add(lid);
    var gold = new T.Mesh(new T.IcosahedronGeometry(.35, 0), mat(0xffd34d, { emissive: 0xffb300, emissiveIntensity: .4, metalness: .6, roughness: .3 })); gold.position.set(.3, 1.15, .1); chest.add(gold);
    chest.position.set(5, 0, 2); chest.rotation.y = -.5; g.add(chest);
    // light shafts from the surface
    var cv = document.createElement('canvas'); cv.width = 4; cv.height = 64; var cx = cv.getContext('2d'), gr = cx.createLinearGradient(0, 0, 0, 64); gr.addColorStop(0, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); cx.fillStyle = gr; cx.fillRect(0, 0, 4, 64);
    var rayM = new T.MeshBasicMaterial({ map: new T.CanvasTexture(cv), transparent: true, opacity: .22, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide });
    for (var k = 0; k < 6; k++) { var ray = new T.Mesh(new T.PlaneGeometry(1.4 + Math.random(), 24), rayM); ray.position.set(-9 + k * 3.6, 10, -6 + Math.random() * 8); ray.rotation.z = .25; ray.rotation.y = Math.random(); g.add(ray); }
    // fish
    var cols = [0xff8c42, 0xffd23f, 0x3bceac, 0xee4266, 0x4cc9f0, 0xf9c74f, 0x90be6d, 0xf3722c];
    for (var f = 0; f < 16; f++) {
      var fg = new T.Group(), c = cols[f % cols.length];
      var body = new T.Mesh(new T.ConeGeometry(.42, 1.4, 5), mat(c)); body.rotation.z = -Math.PI / 2; body.scale.set(1, 1, .55); fg.add(body);
      var tail = new T.Mesh(new T.ConeGeometry(.38, .6, 3), mat(c)); tail.rotation.z = Math.PI / 2; tail.position.x = -.95; tail.scale.set(1, 1, .3); fg.add(tail);
      var eye = new T.Mesh(new T.SphereGeometry(.08, 5, 4), mat(0x111111)); eye.position.set(.4, .1, .2); fg.add(eye);
      var sc = .7 + Math.random() * .6; fg.scale.setScalar(sc);
      fg.userData = { a: Math.random() * 6.28, sp: .25 + Math.random() * .3, rx: 5 + Math.random() * 5, rz: 3 + Math.random() * 4, y: 2.5 + Math.random() * 8, cz: -4 + Math.random() * 4, ph: Math.random() * 6, tail: tail, to: null };
      fish.push(fg); g.add(fg);
    }
    // bubbles
    var bm = new T.InstancedMesh(new T.IcosahedronGeometry(.12, 1), new T.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: .55, roughness: .1 }), 40);
    bm.userData.p = []; for (var b = 0; b < 40; b++) bm.userData.p.push({ x: [-6.5, 7.6, 2.8][b % 3] + (Math.random() - .5) * .6, y: Math.random() * 18, z: [-7.5, -6.5, -2.6][b % 3] + (Math.random() - .5) * .6, v: .9 + Math.random() * .8 });
    bubbles = bm; g.add(bm);
    return g;
  }
  function loadOcto() {
    if (!(T.GLTFLoader)) return;
    var A = window.minestPetAsset || function (p) { return p; };
    var urls = [A('octopus-pet-raising-v6/models/avatar_web_rigged_v23j.glb'), A('octopus-pet-raising-v6/models/avatar_web_rigged_v23.glb'), A('avatar_web_rigged_v23.glb')];
    (function next(i) {
      if (i >= urls.length) return;
      new T.GLTFLoader().load(urls[i], function (g) {
        if (!scene) return;
        octo = g.scene; octo.scale.setScalar(2.1); tank.add(octo);
        try { if (window.MinestCosmetics && MinestCosmetics.watchModel) MinestCosmetics.watchModel(octo, T); } catch (e) {}
        mixer = new T.AnimationMixer(octo); (g.animations || []).forEach(function (c) { clips[c.name] = c; });
        if (clips.idle) mixer.clipAction(clips.idle).play();
        mixer.addEventListener('finished', function () { if (clips.idle) { mixer.stopAllAction(); mixer.clipAction(clips.idle).play(); } });
      }, undefined, function () { next(i + 1); });
    })(0);
  }

  /* ---------- cameras: one window per screen ---------- */
  function V(x, y, z) { return new T.Vector3(x, y, z); }
  function offAxis(cam, pa, pb, pc, pe) {   // Kooima: screen corners lower-left, lower-right, upper-left; eye
    var vr = pb.clone().sub(pa).normalize(), vu = pc.clone().sub(pa).normalize(), vn = vr.clone().cross(vu).normalize();
    var va = pa.clone().sub(pe), vb = pb.clone().sub(pe), vc = pc.clone().sub(pe), d = -va.dot(vn), n = .5, f = 200;
    var l = vr.dot(va) * n / d, r = vr.dot(vb) * n / d, b = vu.dot(va) * n / d, t = vu.dot(vc) * n / d;
    cam.projectionMatrix.makePerspective(l, r, t, b, n, f); cam.projectionMatrixInverse.copy(cam.projectionMatrix).invert();
    cam.position.copy(pe); cam.quaternion.setFromRotationMatrix(new T.Matrix4().makeBasis(vr, vu, vn)); cam.updateMatrixWorld(true);
  }
  function setupCams() {
    var L = layout(), w = innerWidth, h = innerHeight;
    cams = [];
    if (L.kind === 'single') {
      var c = new T.PerspectiveCamera(w > h ? 46 : 62, w / h, .5, 200); c.position.set(0, 8, 24); c.lookAt(0, 4.5, -2);
      cams.push({ cam: c, vp: [0, 0, w, h] });
      tank.position.set(0, 0, 0); tank.rotation.set(0, 0, 0);
    } else if (L.kind === 'tall') {
      // hinge = x axis; bottom screen flat towards the viewer (+z), top screen rising at the fold angle θ
      var W = w * CM_PER_PT, Hh = h / 2 * CM_PER_PT, th = L.angle, up = V(0, Math.sin(th), Math.cos(th)), pe = V(EYE.tall[0], EYE.tall[1], EYE.tall[2]);
      var top = new T.PerspectiveCamera(), bot = new T.PerspectiveCamera();
      offAxis(top, V(-W / 2, 0, 0), V(W / 2, 0, 0), up.clone().multiplyScalar(Hh).add(V(-W / 2, 0, 0)), pe);
      offAxis(bot, V(-W / 2, 0, Hh), V(W / 2, 0, Hh), V(-W / 2, 0, 0), pe);
      cams.push({ cam: top, vp: [0, h / 2, w, h / 2] }, { cam: bot, vp: [0, 0, w, h / 2] });
      // the tank sits under the floor glass and behind the front glass: its sand a few cm down, its back wall behind the hinge
      tank.position.set(0, -6, -1); tank.rotation.set(0, 0, 0); tank.scale.setScalar(.62);
    } else {
      // book: hinge = y axis, both screens upright, each turned towards the viewer by (π − θ) / 2
      var Ww = w / 2 * CM_PER_PT, Hv = h * CM_PER_PT, a = th2(L.angle), dl = V(-Math.cos(a), 0, Math.sin(a)), dr = V(Math.cos(a), 0, Math.sin(a)), pe2 = V(EYE.wide[0], Hv / 2 + EYE.wide[1], EYE.wide[2]);
      var lc = new T.PerspectiveCamera(), rc = new T.PerspectiveCamera(), outL = dl.clone().multiplyScalar(Ww), outR = dr.clone().multiplyScalar(Ww);
      offAxis(lc, outL, V(0, 0, 0), outL.clone().add(V(0, Hv, 0)), pe2);
      offAxis(rc, V(0, 0, 0), outR, V(0, Hv, 0), pe2);
      cams.push({ cam: lc, vp: [0, 0, w / 2, h] }, { cam: rc, vp: [w / 2, 0, w / 2, h] });
      // a corner tank behind both glass walls
      tank.position.set(0, .4, -9); tank.rotation.set(0, 0, 0); tank.scale.setScalar(.55);
    }
    hint.hidden = L.kind !== 'single' || !window.__MINEST_DUO__ && !document.documentElement.classList.contains('duo');
  }
  function th2(angle) { return (Math.PI - angle) / 2; }

  /* ---------- life ---------- */
  var octoT = 0, waveUntil = 0;
  function animate(now) {
    raf = requestAnimationFrame(animate);
    if (document.hidden || now - last < 33) return; last = now;
    var dt = Math.min(.05, clock.getDelta()), t = clock.elapsedTime;
    // fish: lazy loops, or a dash to the food
    fish.forEach(function (f) {
      var u = f.userData, p = f.position, tx, ty, tz;
      if (u.to && u.to.parent) { tx = u.to.position.x; ty = u.to.position.y; tz = u.to.position.z; if (p.distanceTo(u.to.position) < .6) { u.to.parent.remove(u.to); u.to = null; } }
      else { u.a += dt * u.sp * .35; tx = Math.cos(u.a) * u.rx; tz = u.cz + Math.sin(u.a * 1.3) * u.rz; ty = u.y + Math.sin(t * .6 + u.ph) * .8; }
      var dx = tx - p.x, dy = ty - p.y, dz = tz - p.z, k = u.to ? 1.6 : .9;
      p.x += dx * dt * k; p.y += dy * dt * k; p.z += dz * dt * k;
      f.rotation.y = Math.atan2(-dz, dx); f.rotation.z = Math.max(-.4, Math.min(.4, dy * .2));
      u.tail.rotation.y = Math.sin(t * 9 + u.ph) * .5;
    });
    // food sinks
    food.forEach(function (q) { if (q.parent) { q.position.y = Math.max(.3, q.position.y - dt * 1.1); } });
    food = food.filter(function (q) { return q.parent; });
    // seaweed sways
    weeds.forEach(function (wd) { var a = wd.geometry.attributes.position, b = wd.userData.base; for (var i = 0; i < a.count; i++) { var y = b[i * 3 + 1]; a.setX(i, b[i * 3] + Math.sin(t * 1.2 + wd.userData.ph + y * .35) * y * .06); } a.needsUpdate = true; });
    // bubbles rise
    if (bubbles) { var m = new T.Matrix4(); bubbles.userData.p.forEach(function (b, i) { b.y += dt * b.v; if (b.y > 20) b.y = 0; m.makeTranslation(b.x + Math.sin(t * 2 + i) * .15, b.y, b.z); bubbles.setMatrixAt(i, m); }); bubbles.instanceMatrix.needsUpdate = true; }
    // Octo swims a slow figure-eight that crosses the hinge (from the floor glass up to the front glass and back)
    if (octo) {
      octoT += dt * .18;
      var ox = Math.sin(octoT) * 5.5, oz = Math.sin(octoT * 2) * 3.2 - 1, oy = 2.4 + Math.sin(octoT * 1.7) * 1.6 + (now < waveUntil ? .6 : 0);
      var prev = octo.position.clone(); octo.position.set(ox, oy, oz);
      var vx = ox - prev.x, vz = oz - prev.z; if (Math.abs(vx) + Math.abs(vz) > 1e-4) { var yaw = Math.atan2(vx, vz); octo.rotation.y += (yaw * .35 - octo.rotation.y) * .05; }
    }
    if (mixer) mixer.update(dt);
    var w = innerWidth, h = innerHeight;
    renderer.setScissorTest(cams.length > 1);
    cams.forEach(function (c) { var v = c.vp; renderer.setViewport(v[0], v[1], v[2], v[3]); renderer.setScissor(v[0], v[1], v[2], v[3]); renderer.render(scene, c.cam); });
  }
  function onTap(e) {
    if (e.target.closest('.maq-ui')) return;
    var x = e.clientX, y = innerHeight - e.clientY, hit = null;
    cams.some(function (c) {
      var v = c.vp; if (x < v[0] || x > v[0] + v[2] || y < v[1] || y > v[1] + v[3]) return false;
      var ray = new T.Raycaster(); ray.setFromCamera(new T.Vector2((x - v[0]) / v[2] * 2 - 1, (y - v[1]) / v[3] * 2 - 1), c.cam);
      if (octo) { var o = ray.intersectObject(octo, true); if (o.length) { hit = 'octo'; return true; } }
      // feed: a pellet where the ray meets the water a little under the surface
      var inv = new T.Matrix4().copy(tank.matrixWorld).invert(), r2 = ray.ray.clone().applyMatrix4(inv), pl = new T.Plane(new T.Vector3(0, 1, 0), -12), pt = new T.Vector3();
      if (r2.intersectPlane(pl, pt) || r2.at(14, pt)) { hit = pt; }
      return true;
    });
    if (hit === 'octo') { var c = clips.wave || clips.happy; if (c && mixer) { mixer.stopAllAction(); var a = mixer.clipAction(c); a.setLoop(T.LoopOnce, 1); a.clampWhenFinished = false; a.reset().play(); } waveUntil = performance.now() + 2000; buzz(); return; }
    if (hit && hit.isVector3) {
      hit.x = Math.max(-10, Math.min(10, hit.x)); hit.z = Math.max(-10, Math.min(8, hit.z)); hit.y = Math.max(3, Math.min(12, hit.y));
      var pel = new T.Mesh(new T.IcosahedronGeometry(.16, 0), mat(0xc0763a)); pel.position.copy(hit); tank.add(pel); food.push(pel);
      fish.slice().sort(function (a, b) { return a.position.distanceTo(hit) - b.position.distanceTo(hit); }).slice(0, 4).forEach(function (f) { f.userData.to = pel; });
      buzz();
    }
  }
  function buzz() { try { if (window.MinestNative && MinestNative.haptic) MinestNative.haptic('light'); } catch (e) {} }

  /* ---------- open / close ---------- */
  function resize() { if (!renderer) return; renderer.setSize(innerWidth, innerHeight, false); setupCams(); }
  function open() {
    if (root) return;
    T = window.THREE; if (!T) return;
    root = document.createElement('div'); root.className = 'maq';
    root.innerHTML = '<canvas></canvas><div class="maq-ui"><button type="button" data-maq="x" aria-label="Close">✕</button></div>' +
      '<div class="maq-hint" hidden>' + (zh() ? '把 Duo 立起来折成 L 形（或像书一样半开），水族箱会跨过两块屏幕。点水面喂鱼，点 Octo 和它打招呼。' : 'Stand the Duo up folded like an L (or half-open like a book): the tank spans both screens. Tap the water to feed the fish, tap Octo to say hi.') + '</div>';
    document.body.appendChild(root); document.documentElement.classList.add('maq-on'); hint = root.querySelector('.maq-hint');
    renderer = new T.WebGLRenderer({ canvas: root.querySelector('canvas'), antialias: true, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5)); renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = .95;
    scene = new T.Scene(); scene.background = new T.Color(0x0f3b52); scene.fog = new T.Fog(0x0f3b52, 18, 70);
    scene.add(new T.HemisphereLight(0xbfe8ff, 0x2a4a3a, .9));
    var sun = new T.DirectionalLight(0xfff4d6, 1.6); sun.position.set(4, 20, 8); scene.add(sun);
    var fill = new T.DirectionalLight(0x8fd3ff, .5); fill.position.set(-6, 4, 10); scene.add(fill);
    tank = buildTank(); scene.add(tank); loadOcto();
    clock = new T.Clock(); resize();
    root.addEventListener('pointerdown', onTap);
    root.querySelector('[data-maq="x"]').addEventListener('click', close);
    addEventListener('resize', resize); addEventListener('minest:hinge', resize);
    raf = requestAnimationFrame(animate);
    if (!hint.hidden) setTimeout(function () { if (hint) hint.classList.add('fade'); }, 6000);
  }
  function close() {
    if (!root) return; cancelAnimationFrame(raf);
    removeEventListener('resize', resize); removeEventListener('minest:hinge', resize);
    try { renderer.dispose(); } catch (e) {}
    root.remove(); root = renderer = scene = tank = octo = mixer = null; fish = []; food = []; weeds = []; bubbles = null; clips = {};
    document.documentElement.classList.remove('maq-on');
    if (location.hash === '#aquarium') try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
  }

  // Pet Raising (in its frame) asks for the aquarium; it closes itself first
  addEventListener('message', function (e) { var d = e.data; if (d && d.type === 'minest-pet' && d.action === 'aquarium') { try { var o = document.getElementById('minest-pet-raising-overlay'); if (o) o.remove(); document.documentElement.classList.remove('pet-raising-open'); } catch (x) {} open(); } });
  addEventListener('hashchange', function () { if (location.hash === '#aquarium') open(); });
  if (location.hash === '#aquarium') setTimeout(open, 1200);
  window.MinestAquarium = { open: open, close: close, isOpen: function () { return !!root; }, layout: layout };
})();
