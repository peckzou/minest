/* Minest Dream Workshop · 梦工坊 — the Experience Engine (Phase 1).
 * One live 3D sandbox shared by the four studios: it shows the work, plays its show timeline (stage light, figure actions,
 * the figures' voices through the device's speech synthesis, music made with Web Audio), runs trigger zones, and turns into
 * a first-person guest preview ("成为观众") where walking into a zone starts the show and walking out fades it.
 * The work itself (plain JSON) belongs to dw-app.js; the engine only reads it (sync() after every edit). */
(function (root) {
  'use strict';
  var T = root.THREE, M = root.DWModels, E = root.DWEngine = { on: {} };
  var TABLE_R = 16;
  var renderer, scene, cam, canvas, work = null, clock = 0;
  var hemi, sun, grid, rim, helpers, selRing, ground, plaza;
  var host = null, rayCam = null;   /* host mode (the WED studio): the host owns the renderer and the frame, and shows this scene as a miniature */
  var nodes = {};                 // object id -> { g, sig, look }
  var view = { yaw: 0.42, pitch: 0.5, dist: 19, target: new T.Vector3(0, 0.8, -0.8) };
  var play = { t: 0, playing: false, music: {}, voice: null, fadeK: 1, fading: 0 };
  var sel = null, guest = null, helpersOn = true;
  var MOODS = {
    theatre: { bg: '#0d1422', fog: 0.018, hemi: [0.16, 0.24], sun: 0.14, sunC: '#9fb2d9', lamps: 0.8, cone: 0.075 },
    day: { bg: '#a9d1ef', fog: 0.008, hemi: [0.85, 0.1], sun: 0.95, sunC: '#fff4e0', lamps: 0, cone: 0.025 },
    dusk: { bg: '#d98a5f', fog: 0.014, hemi: [0.42, 0.16], sun: 0.55, sunC: '#ffb27a', lamps: 0.6, cone: 0.05 },
    night: { bg: '#070b18', fog: 0.02, hemi: [0.1, 0.16], sun: 0.07, sunC: '#8fa3d6', lamps: 0.9, cone: 0.085 }
  };
  E.MOODS = MOODS;

  /* ---------------------------------------------------------------- set-up */
  E.init = function (cv, hostOpts) {
    canvas = cv; host = hostOpts || null;
    if (!host) {
      renderer = new T.WebGLRenderer({ canvas: cv, antialias: true });
      renderer.setPixelRatio(Math.min(2, root.devicePixelRatio || 1));
      renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
    }
    scene = new T.Scene(); scene.fog = new T.FogExp2('#0d1422', 0.018);
    cam = new T.PerspectiveCamera(50, 1, 0.1, 300);
    hemi = new T.HemisphereLight('#c9d6f0', '#2a2118', 0.4); scene.add(hemi);
    sun = new T.DirectionalLight('#fff4e0', 0.6); sun.position.set(8, 16, 10); sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024); var sc = sun.shadow.camera; sc.left = sc.bottom = -18; sc.right = sc.top = 18; sc.far = 60; scene.add(sun);
    ground = new T.Mesh(new T.CircleGeometry(90, 64), new T.MeshStandardMaterial({ color: '#4b5e43', roughness: 1 }));
    ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
    plaza = new T.Mesh(new T.CircleGeometry(TABLE_R, 64), new T.MeshStandardMaterial({ color: '#5a6b4c', roughness: 1 }));
    plaza.rotation.x = -Math.PI / 2; plaza.position.y = 0.005; plaza.receiveShadow = true; scene.add(plaza);
    rim = new T.Mesh(new T.TorusGeometry(TABLE_R, 0.22, 8, 96), new T.MeshStandardMaterial({ color: '#7a5233', roughness: 0.6 }));
    rim.rotation.x = Math.PI / 2; rim.position.y = 0.05; scene.add(rim);
    grid = new T.PolarGridHelper(TABLE_R, 16, 8, 64, '#8aa07c', '#71866a'); grid.position.y = 0.012;
    grid.material.transparent = true; grid.material.opacity = 0.35; scene.add(grid);
    helpers = new T.Group(); scene.add(helpers);
    selRing = new T.Mesh(new T.RingGeometry(0.92, 1.06, 48), new T.MeshBasicMaterial({ color: '#ffd166', side: T.DoubleSide, transparent: true, opacity: 0.95, depthWrite: false }));
    selRing.rotation.x = -Math.PI / 2; selRing.visible = false; scene.add(selRing);
    bindKeys();
    if (host) { ground.visible = false; scene.fog.density = 0; return; }
    resize(); if (root.ResizeObserver) new ResizeObserver(resize).observe(cv.parentNode); else root.addEventListener('resize', resize);
    var last = performance.now();
    (function loop(now) {
      requestAnimationFrame(loop);
      var dt = Math.min(0.05, (now - last) / 1000); last = now; clock += dt;
      tick(dt); renderer.render(scene, cam);
    })(last);
  };
  /* host mode: the host calls frame(dt) each frame, renders scene() itself (with its own camera over the miniature, or
     camera() while a guest is inside), and gives the camera that picking should use */
  E.frame = function (dt) {
    clock += dt;
    plaza.visible = !!work; if (!guest) grid.visible = rim.visible = !!work;   /* no work on the host's table: no disc either */
    tick(dt);
  };
  E.scene = function () { return scene; };
  E.useCamera = function (c) { rayCam = c; };
  function resize() {
    var p = canvas.parentNode, w = p.clientWidth || 1, h = p.clientHeight || 1;
    renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix();
  }

  /* ---------------------------------------------------------------- the work in the scene */
  E.setWork = function (w) {
    work = w; Object.keys(nodes).forEach(function (id) { scene.remove(nodes[id].g); }); nodes = {};
    sel = null; E.stop(); E.sync();
  };
  E.work = function () { return work; };
  function sigOf(o) { return [o.kind, o.color || '', o.text || '', o.img || '', o.frame || '', o.lift == null ? '' : o.lift, o.tilt == null ? '' : o.tilt, o.plain ? 1 : 0].join('|'); }
  E.sync = function () {
    if (!work) return;
    var seen = {};
    work.objects.forEach(function (o) {
      seen[o.id] = 1; var n = nodes[o.id], sg = sigOf(o);
      if (!n || n.sig !== sg) {
        if (n) scene.remove(n.g);
        var g = M.build(o); g.userData.objId = o.id; scene.add(g);
        n = nodes[o.id] = { g: g, sig: sg, look: 0 };
      }
      n.g.position.set(o.x, o.y || 0, o.z); n.g.rotation.y = o.ry || 0; n.g.scale.setScalar(o.s || 1);
    });
    Object.keys(nodes).forEach(function (id) { if (!seen[id]) { scene.remove(nodes[id].g); delete nodes[id]; } });
    var m = MOODS[(work.env || {}).mood] || MOODS.theatre;
    scene.background = new T.Color(m.bg); scene.fog.color.set(m.bg); scene.fog.density = m.fog; sun.color.set(m.sunC);
    drawCanal(); drawLinks(); drawHelpers(); placeRing();
  };
  /* the boat ride: the guest sits in a boat that follows the route on a canal drawn along it */
  function ride() { return work && work.ride && work.ride.mode === 'boat' ? work.ride : null; }
  E.ride = ride;
  var canal = null;
  function drawCanal() {
    if (canal) { scene.remove(canal); canal.traverse(function (m) { if (m.geometry) m.geometry.dispose(); }); canal = null; }
    var r = (work && work.route) || []; if (!ride() || r.length < 2) return;
    canal = new T.Group(); scene.add(canal);
    var water = new T.MeshStandardMaterial({ color: '#2f7fa8', emissive: '#0c3550', emissiveIntensity: 0.5, roughness: 0.25, metalness: 0.1 });
    var bank = new T.MeshStandardMaterial({ color: '#8d8573', roughness: 0.95 });
    var W = 2.6;
    function strip(a, b, w, m, y) {
      var dx = b.x - a.x, dz = b.z - a.z, L = Math.hypot(dx, dz); if (L < 0.01) return;
      var pl = new T.Mesh(new T.PlaneGeometry(w, L), m); pl.rotation.x = -Math.PI / 2; pl.rotation.z = -Math.atan2(dx, dz) + Math.PI;
      pl.position.set((a.x + b.x) / 2, y, (a.z + b.z) / 2); pl.receiveShadow = true; canal.add(pl);
    }
    function disc(p, rad, m, y) { var d = new T.Mesh(new T.CircleGeometry(rad, 28), m); d.rotation.x = -Math.PI / 2; d.position.set(p.x, y, p.z); canal.add(d); }
    for (var i = 0; i < r.length - 1; i++) { strip(r[i], r[i + 1], W + 0.6, bank, 0.012); strip(r[i], r[i + 1], W, water, 0.02); }
    r.forEach(function (p) { disc(p, (W + 0.6) / 2, bank, 0.011); disc(p, W / 2, water, 0.019); });
  }
  /* a constellation: a line from each star to the star it links to */
  var links = null, linkPairs = [];
  function drawLinks() {
    linkPairs = (work.objects || []).filter(function (o) { return o.kind === 'star' && o.link && objOf(o.link); }).map(function (o) { return [o.id, o.link]; });
    if (links) { scene.remove(links); links.geometry.dispose(); links = null; }
    if (!linkPairs.length) return;
    var g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(new Float32Array(linkPairs.length * 6), 3));
    links = new T.LineSegments(g, new T.LineBasicMaterial({ color: '#ffe9a8', transparent: true, opacity: 0.7 })); links.frustumCulled = false; scene.add(links);
  }
  function starPos(id, v) { var n = nodes[id]; if (!n) return false; var h = (n.g.userData.starAt || 1.5); v.set(0, h, 0); n.g.localToWorld(v); return n.g.visible; }
  function updateLinks() {
    if (!links) return; var a = links.geometry.attributes.position, va = new T.Vector3(), vb = new T.Vector3();
    linkPairs.forEach(function (p, i) { var ok = starPos(p[0], va) & starPos(p[1], vb); if (!ok) { va.set(0, -50, 0); vb.set(0, -50, 0); } a.setXYZ(i * 2, va.x, va.y, va.z); a.setXYZ(i * 2 + 1, vb.x, vb.y, vb.z); });
    a.needsUpdate = true;
  }
  /* weather on the light track: rain, snow, clear — falling particles over the table */
  var rainP = null;
  function weatherParticles() {
    if (rainP) return rainP;
    var N = 1400, pos = new Float32Array(N * 3); for (var i = 0; i < N; i++) { pos[i * 3] = (Math.random() - 0.5) * 32; pos[i * 3 + 1] = Math.random() * 12; pos[i * 3 + 2] = (Math.random() - 0.5) * 32; }
    var g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    rainP = new T.Points(g, new T.PointsMaterial({ color: '#cfe3ff', size: 0.07, transparent: true, opacity: 0, depthWrite: false })); rainP.frustumCulled = false; scene.add(rainP);
    return rainP;
  }
  var SKY = { toDay: 'day', toDusk: 'dusk', toNight: 'night', toTheatre: 'theatre' };
  function skyAt(t) {
    var cur = (work.env || {}).mood || 'theatre', prev = cur, k = 1;
    clips('light').forEach(function (c) { if (!SKY[c.op] || t < c.t0) return; prev = cur; cur = SKY[c.op]; k = Math.min(1, (t - c.t0) / Math.max(0.01, c.t1 - c.t0)); });
    return { a: MOODS[prev] || MOODS.theatre, b: MOODS[cur] || MOODS.theatre, k: k };
  }
  function weatherAt(t) {
    var st = 'clear', k = 1;
    clips('light').forEach(function (c) { if ((c.op === 'rain' || c.op === 'snow' || c.op === 'clear') && t >= c.t0) { st = c.op; k = Math.min(1, (t - c.t0) / Math.max(0.01, c.t1 - c.t0)); } });
    return { st: st, k: k };
  }
  /* the height things stand at: on top of a stage when over one */
  E.surfaceY = function (x, z, except) {
    var y = 0; if (!work) return 0;
    work.objects.forEach(function (o) {
      if (o.id === except || !nodes[o.id]) return; var sf = nodes[o.id].g.userData.surface; if (!sf) return;
      var s = o.s || 1, dx = x - o.x, dz = z - o.z, c = Math.cos(-(o.ry || 0)), sn = Math.sin(-(o.ry || 0));
      var lx = (dx * c + dz * sn) / s, lz = (-dx * sn + dz * c) / s;
      if (Math.abs(lx) <= sf.hw && Math.abs(lz) <= sf.hd) y = Math.max(y, sf.top * s + (o.y || 0));
    });
    return y;
  };

  /* ---------------------------------------------------------------- helpers: zones, route, guest start, selection */
  function label(text, color) {
    var c = document.createElement('canvas'); c.width = 256; c.height = 64; var x = c.getContext('2d');
    x.font = '700 30px -apple-system,"PingFang SC",sans-serif'; var w = Math.min(248, x.measureText(text).width + 28);
    x.fillStyle = 'rgba(12,18,30,.78)'; roundRect(x, (256 - w) / 2, 8, w, 48, 22); x.fill();
    x.fillStyle = color || '#fff'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, 128, 33);
    var sp = new T.Sprite(new T.SpriteMaterial({ map: new T.CanvasTexture(c), depthTest: false, transparent: true }));
    sp.scale.set(2.4, 0.6, 1); sp.renderOrder = 10; return sp;
  }
  function roundRect(x, a, b, w, h, r) { x.beginPath(); x.moveTo(a + r, b); x.arcTo(a + w, b, a + w, b + h, r); x.arcTo(a + w, b + h, a, b + h, r); x.arcTo(a, b + h, a, b, r); x.arcTo(a, b, a + w, b, r); x.closePath(); }
  function drawHelpers() {
    if (!helpers) return;
    while (helpers.children.length) { var c = helpers.children.pop(); if (c.geometry) c.geometry.dispose(); }
    if (!work) return;
    (work.zones || []).forEach(function (z) {
      var on = sel && sel.type === 'zone' && sel.id === z.id;
      var disc = new T.Mesh(new T.CircleGeometry(z.r, 48), new T.MeshBasicMaterial({ color: on ? '#ffd166' : '#3ddc97', transparent: true, opacity: on ? 0.22 : 0.14, depthWrite: false }));
      disc.rotation.x = -Math.PI / 2; disc.position.set(z.x, 0.03, z.z); disc.userData.zoneId = z.id; helpers.add(disc);
      var ring = new T.Mesh(new T.RingGeometry(z.r - 0.07, z.r, 64), new T.MeshBasicMaterial({ color: on ? '#ffd166' : '#3ddc97', transparent: true, opacity: 0.9, depthWrite: false, side: T.DoubleSide }));
      ring.rotation.x = -Math.PI / 2; ring.position.set(z.x, 0.035, z.z); helpers.add(ring);
      var lb = label('⚡ ' + (z.name || '触发区'), on ? '#ffd166' : '#9ff0c9'); lb.position.set(z.x, 0.7, z.z); helpers.add(lb);
    });
    var r = work.route || [];
    if (r.length) {
      var pts = r.map(function (p) { return new T.Vector3(p.x, 0.06, p.z); });
      if (pts.length > 1) { var ln = new T.Line(new T.BufferGeometry().setFromPoints(pts), new T.LineDashedMaterial({ color: '#ffd166', dashSize: 0.35, gapSize: 0.22 })); ln.computeLineDistances(); helpers.add(ln); }
      r.forEach(function (p, i) {
        var d = new T.Mesh(new T.CircleGeometry(i ? 0.16 : 0.32, 20), new T.MeshBasicMaterial({ color: i ? '#ffd166' : '#ff8fab', depthWrite: false }));
        d.rotation.x = -Math.PI / 2; d.position.set(p.x, 0.07, p.z); d.userData.routeIndex = i; helpers.add(d);
      });
      var st = label('🚶 观众入口', '#ffc2d1'); st.position.set(r[0].x, 0.9, r[0].z); helpers.add(st);
    }
    helpers.visible = helpersOn && !guest;
  }
  function placeRing() {
    if (!selRing) return;
    var n = sel && sel.type === 'obj' && nodes[sel.id];
    if (!n || guest) { selRing.visible = false; return; }
    var b = new T.Box3().setFromObject(n.g), s = b.getSize(new T.Vector3()), r = Math.max(0.5, Math.max(s.x, s.z) / 2 + 0.15);
    selRing.scale.setScalar(r); selRing.position.set(n.g.position.x, (n.g.position.y || 0) + 0.04, n.g.position.z); selRing.visible = true;
  }
  E.select = function (s) { sel = s; drawHelpers(); placeRing(); };
  E.showHelpers = function (on) { helpersOn = on; drawHelpers(); };

  /* ---------------------------------------------------------------- picking */
  var ray = new T.Raycaster(), ndc = new T.Vector2();
  function setRay(cx, cy) { var r = canvas.getBoundingClientRect(); ndc.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, !guest && rayCam ? rayCam : cam); }
  E.pick = function (cx, cy) {
    setRay(cx, cy);
    var list = Object.keys(nodes).map(function (k) { return nodes[k].g; });
    var hit = ray.intersectObjects(list, true)[0], zh = helpersOn && !guest ? ray.intersectObjects(helpers.children.filter(function (c) { return c.userData.zoneId || c.userData.routeIndex != null; }), false) : [];
    var zs = zh.filter(function (h) { return h.object.userData.routeIndex != null; })[0] || zh[0];
    if (zs && (!hit || zs.distance < hit.distance + 0.5)) {
      if (zs.object.userData.routeIndex != null) return { type: 'route', index: zs.object.userData.routeIndex, point: zs.point };
      return { type: 'zone', id: zs.object.userData.zoneId, point: zs.point };
    }
    if (hit) { var o = hit.object; while (o && !o.userData.objId) o = o.parent; if (o) return { type: 'obj', id: o.userData.objId, point: hit.point }; }
    var g = E.groundAt(cx, cy); return g ? { type: 'ground', point: g } : null;
  };
  var plane = new T.Plane(new T.Vector3(0, 1, 0), 0);
  E.groundAt = function (cx, cy, y) { setRay(cx, cy); plane.constant = -(y || 0); var p = new T.Vector3(); return ray.ray.intersectPlane(plane, p) ? p : null; };
  E.clampToTable = function (x, z, margin) { var d = Math.hypot(x, z), m = TABLE_R - (margin || 0.4); return d > m ? { x: x / d * m, z: z / d * m } : { x: x, z: z }; };

  /* ---------------------------------------------------------------- editor camera */
  function placeCam() {
    var p = view.pitch, y = view.yaw, t = view.target;
    cam.position.set(t.x + view.dist * Math.cos(p) * Math.sin(y), t.y + view.dist * Math.sin(p), t.z + view.dist * Math.cos(p) * Math.cos(y));
    cam.lookAt(t);
  }
  E.orbit = function (dx, dy) { view.yaw -= dx * 0.006; view.pitch = Math.max(0.12, Math.min(1.45, view.pitch + dy * 0.005)); };
  E.zoom = function (f) { view.dist = Math.max(5, Math.min(48, view.dist * f)); };
  E.pan = function (dx, dy) {
    var k = view.dist * 0.0016, fx = Math.cos(view.yaw), fz = -Math.sin(view.yaw), bx = Math.sin(view.yaw), bz = Math.cos(view.yaw);
    view.target.x -= (dx * fx + dy * bx) * k; view.target.z -= (dx * fz + dy * bz) * k;
    var c = E.clampToTable(view.target.x, view.target.z, 2); view.target.x = c.x; view.target.z = c.z;
  };
  E.focus = function (x, z) { view.target.set(x, 0.6, z); };
  E.resetView = function () { view.yaw = 0.42; view.pitch = 0.5; view.dist = 19; view.target.set(0, 0.8, -0.8); };

  /* ---------------------------------------------------------------- the show: evaluation */
  function clips(track) { return ((work && work.timeline && work.timeline.clips) || []).filter(function (c) { return c.track === track; }).sort(function (a, b) { return a.t0 - b.t0; }); }
  E.level = function (t) {
    var cs = clips('light').filter(function (c) { return c.op === 'up' || c.op === 'down'; }), L = cs.length ? 0 : 1;   /* sky and weather share the track */
    for (var i = 0; i < cs.length; i++) {
      var c = cs[i]; if (t < c.t0) break; var to = c.op === 'down' ? 0 : 1;
      L = t >= c.t1 ? to : L + (to - L) * ((t - c.t0) / Math.max(0.01, c.t1 - c.t0));
    }
    return L;
  };
  function bump(t, a, b, ramp) { if (t <= a || t >= b) return 0; var r = Math.min(ramp, (b - a) / 2); var w = Math.min(1, (t - a) / r, (b - t) / r); return w * w * (3 - 2 * w); }
  E.speaking = function (id) {
    if (tapSpeak[id] && clock < tapSpeak[id]) return true;
    if (!play.playing) return false; var t = play.t;
    return clips('voice').some(function (c) { return c.target === id && t >= c.t0 && t < c.t1; });
  };
  var taps = {}, tapSpeak = {};          // a guest's tap: a short action and a line, outside the timeline
  function blinkAt(seed) { var p = (clock + seed) % 4.3; return p < 0.14 ? Math.sin(p / 0.14 * Math.PI) : 0; }
  /* a state that goes up with one op and down with another (a door: open / close), as the light level does */
  function level2(list, upOp, downOp, init) {
    var L = init;
    list.slice().sort(function (a, b) { return a.a - b.a; }).forEach(function (c) {
      var to = c.op === upOp ? 1 : c.op === downOp ? 0 : null; if (to == null || c.now < c.a) return;
      L = c.now >= c.b ? to : L + (to - L) * ((c.now - c.a) / Math.max(0.01, c.b - c.a));
    });
    return L;
  }
  function actsOf(o, t) {
    var acts = clips('action').filter(function (c) { return c.target === o.id; }).map(function (c) { return { op: c.op, a: c.t0, b: c.t1, now: t }; });
    if (taps[o.id]) { var tp = taps[o.id]; if (clock < tp.c0 + tp.dur) acts.push({ op: tp.op, a: tp.c0, b: tp.c0 + tp.dur, now: clock, tap: true }); else delete taps[o.id]; }
    return acts;
  }
  /* props that come to life: the book, the time-machine clock, the music box, the door */
  function poseProp(o, n, t, dt) {
    var rig = n.g.userData.rig, on = o.life && o.life.on, acts = on ? actsOf(o, t) : [], line = acts.filter(function (c) { return !c.tap; }), tap = acts.filter(function (c) { return c.tap; });
    var tapW = function (op) { var w = 0; tap.forEach(function (c) { if (c.op === op) w = Math.max(w, bump(c.now, c.a, c.b, 0.4)); }); return w; };
    var boost = function (op) { var w = 0; acts.forEach(function (c) { if (c.op === op) w = Math.max(w, bump(c.now, c.a, c.b, 0.5)); }); return w; };
    if (rig.prop === 'clock') {
      var tt = boost('timeTravel'); n.hands = (n.hands || 0) + dt * ((on ? 0.12 : 0) + 7 * tt);
      rig.minute.rotation.z = -n.hands; rig.hour.rotation.z = -n.hands / 12;
      rig.pend.rotation.z = on ? Math.sin(clock * 2.3) * (0.22 + 0.3 * tt) : 0;
      rig.orb.emissiveIntensity = 0.4 + 2.6 * tt + (on ? 0.15 * Math.sin(clock * 3) : 0); rig.lever.rotation.z = -0.9 * tt;
    } else if (rig.prop === 'book') {
      var op = Math.max(level2(line, 'open', 'close', 0), tapW('open'));
      rig.cover.rotation.z = -Math.PI * (1 - op);
      var turns = line.filter(function (c) { return c.op === 'turnPage'; }).sort(function (a, b) { return a.a - b.a; }), k = 0;
      rig.pages.forEach(function (pg) { pg.rotation.z = 0; });
      turns.forEach(function (c) { if (c.now < c.a || k >= rig.pages.length) return; var f = c.now >= c.b ? 1 : (c.now - c.a) / Math.max(0.01, c.b - c.a); rig.pages[k].rotation.z = Math.PI * f * op; if (f >= 1) k++; else k = rig.pages.length; });
      var tw = tapW('turnPage'); if (tw && k < rig.pages.length) rig.pages[k].rotation.z = Math.PI * tw * op;
      rig.pages.forEach(function (pg, i) { pg.visible = op > 0.02 || i === 0; });
      rig.pop.rotation.x = -Math.PI / 2 * (1 - Math.min(1, op * 1.3)); rig.pop.visible = op > 0.02;
    } else if (rig.prop === 'musicbox') {
      var lid = Math.max(level2(line, 'open', 'close', 0), tapW('open'));
      rig.lid.rotation.x = -1.85 * lid;
      var sp = (lid > 0.6 ? 0.7 : 0) + 2.8 * boost('spin');
      rig.plat.rotation.y += dt * sp;
      rig.dancers.forEach(function (d, i) { d.position.y = 0.06 + (sp ? Math.abs(Math.sin(clock * 3 + i)) * 0.04 : 0); d.rotation.y = (i ? Math.PI : 0) + (sp ? clock * 2 : 0); });
    } else if (rig.prop === 'door') {
      rig.leaf.rotation.y = -1.45 * Math.max(level2(line, 'open', 'close', 0), tapW('open'));
    } else if (rig.prop === 'gears') {
      var gs = (on ? 0.35 : 0) + 3.2 * boost('spin');
      rig.gears.forEach(function (q) { q[0].rotation.z += dt * gs * q[1]; }); rig.crank.rotation.x += dt * gs * 1.4;
    } else if (rig.prop === 'top') {
      var ex = Math.max(level2(line, 'open', 'close', 0), tapW('open'));
      rig.spin.rotation.y += dt * ((on ? 0.4 : 0) + 6 * boost('spin'));
      rig.rings.forEach(function (rg, i) { rg.position.y = rg.userData.base + i * 0.55 * ex; rg.rotation.y = (i % 2 ? -1 : 1) * clock * 0.6 * ex; });
    } else if (rig.prop === 'star') {
      var sb = boost('spin'); rig.core.rotation.y += dt * (0.6 + 6 * sb); rig.halo.scale.setScalar(1 + 0.12 * Math.sin(clock * 2 + o.x) + 0.5 * sb);
    } else if (rig.prop === 'sprout') {
      var gl = line.filter(function (c) { return c.op === 'grow' || c.op === 'wilt'; }).sort(function (a, b) { return a.a - b.a; });
      var lv = Math.max(level2(gl, 'grow', 'wilt', gl.length && gl[0].op === 'grow' ? 0 : 1), tapW('grow'));
      if (!guest && !play.playing && t < 0.001) lv = 1;
      rig.plant.scale.set(Math.max(0.05, lv), Math.max(0.02, lv), Math.max(0.05, lv)); rig.plant.rotation.z = (1 - lv) * 0.3 * (o.x > 0 ? 1 : -1) * (gl.some(function (c) { return c.op === 'wilt' && c.now >= c.a; }) ? 1 : 0);
      rig.label.visible = lv > 0.7; rig.plant.rotation.y = Math.sin(clock * 0.8 + o.z) * 0.08;
    } else if (rig.prop === 'carousel') {
      var csp = (on ? 0.65 : 0.15) + 2.2 * boost('spin');
      rig.spin.rotation.y += dt * csp;
      rig.horses.forEach(function (h) { h.position.y = 0.95 + Math.sin(clock * 2.6 + h.userData.phase) * (0.16 * Math.min(1, csp)); });
    } else if (rig.prop === 'ferris') {
      var fsp = (on ? 0.32 : 0.08) + 1.6 * boost('spin');
      rig.wheel.rotation.z += dt * fsp;
      rig.cars.forEach(function (cg) { cg.rotation.z = -rig.wheel.rotation.z; });
    } else if (rig.prop === 'crystal') {
      var crb = boost('spin');
      rig.gem.rotation.y += dt * (0.8 + 4.5 * crb);
      rig.gem.position.y = 1.65 + Math.sin(clock * 2.2 + o.x) * 0.12;
      rig.halo.rotation.z += dt * 0.9;
      rig.mat.emissiveIntensity = 0.85 + 0.3 * Math.sin(clock * 3) + 1.4 * crb;
    } else if (rig.prop === 'rocket') {
      var rb = boost('spin');
      rig.ship.position.y = rb > 0.01 ? rb * 3.8 : (on ? Math.sin(clock * 2.4) * 0.08 : 0);
      rig.ship.rotation.y += dt * (rb * 3.5);
      rig.flame.scale.setScalar(0.75 + 0.35 * Math.sin(clock * 18) + rb * 1.1);
      rig.flame.visible = !!(on || rb > 0.01);
    } else if (rig.prop === 'treasure') {
      var tOpen = Math.max(level2(line, 'open', 'close', 0), tapW('open'));
      rig.lid.rotation.x = -1.35 * tOpen;
      rig.coins.scale.setScalar(0.85 + 0.25 * tOpen);
    } else if (rig.prop === 'motion') {   /* parts that turn (wheels, a propeller, a globe) and things that float (a balloon) */
      var mb = boost('spin'), mk = (on ? (rig.idle == null ? 1 : rig.idle) : 0) + 4 * mb;
      (rig.spins || []).forEach(function (q) { q[0].rotation[q[1]] += dt * q[2] * mk; });
      if (rig.bob) rig.bob.obj.position.y = rig.bob.base + Math.sin(clock * rig.bob.speed + o.x) * rig.bob.amp + mb * (rig.bob.lift || 0);
    }
  }
  /* ---------------------------------------------------------------- celebration fireworks */
  var fwBursts = [], fwTimer = 0, fwCooldown = 0;
  function spawnBurst(bx, bz) {
    var cols = ['#fbbf24', '#f472b6', '#38bdf8', '#a855f7', '#34d399', '#fb7185'];
    var col = cols[(Math.random() * cols.length) | 0], N = 72;
    var pos = new Float32Array(N * 3), vels = [];
    var ox = bx != null ? bx : (Math.random() - 0.5) * 14, oy = 6.5 + Math.random() * 4.5, oz = bz != null ? bz : -3 - Math.random() * 8;
    for (var i = 0; i < N; i++) {
      var th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1), sp = 2.4 + Math.random() * 3.8;
      vels.push([Math.sin(ph) * Math.cos(th) * sp, Math.cos(ph) * sp + 1.2, Math.sin(ph) * Math.sin(th) * sp]);
    }
    var g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(pos, 3));
    var m = new T.PointsMaterial({ color: col, size: 0.24, transparent: true, opacity: 1, depthWrite: false, blending: T.AdditiveBlending });
    var pts = new T.Points(g, m); pts.position.set(ox, oy, oz); pts.frustumCulled = false; scene.add(pts);
    fwBursts.push({ pts: pts, g: g, m: m, vels: vels, age: 0, life: 1.7 + Math.random() * 0.5 });
    var ctx = actx();
    if (ctx) {
      var now = ctx.currentTime, osc = ctx.createOscillator(), gn = ctx.createGain();
      osc.type = 'sine'; osc.frequency.setValueAtTime(160 + Math.random() * 60, now); osc.frequency.exponentialRampToValueAtTime(38, now + 0.45);
      gn.gain.setValueAtTime(0.14, now); gn.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc.connect(gn); gn.connect(A.master); osc.start(now); osc.stop(now + 0.55);
    }
  }
  E.launchFireworks = function (dur, x, z) {
    actx();
    fwTimer = Math.max(fwTimer, dur || 6.5);
    spawnBurst(x, z);
  };
  function updateFireworks(dt) {
    var onTrack = play.playing && clips('light').some(function (c) { return c.op === 'fireworks' && play.t >= c.t0 && play.t <= c.t1; });
    if (fwTimer > 0 || onTrack) {
      if (fwTimer > 0) fwTimer -= dt;
      fwCooldown -= dt;
      if (fwCooldown <= 0) { spawnBurst(); fwCooldown = 0.45 + Math.random() * 0.35; }
    }
    for (var i = fwBursts.length - 1; i >= 0; i--) {
      var b = fwBursts[i]; b.age += dt;
      if (b.age >= b.life) { scene.remove(b.pts); b.g.dispose(); b.m.dispose(); fwBursts.splice(i, 1); continue; }
      var a = b.g.attributes.position.array, p = b.age / b.life;
      for (var k = 0; k < b.vels.length; k++) {
        var v = b.vels[k];
        a[k * 3] = v[0] * b.age * (1 - p * 0.3);
        a[k * 3 + 1] = v[1] * b.age - 3.2 * b.age * b.age;
        a[k * 3 + 2] = v[2] * b.age * (1 - p * 0.3);
      }
      b.g.attributes.position.needsUpdate = true;
      b.m.opacity = Math.max(0, 1 - p * p);
    }
  }
  /* appear / vanish on the timeline: a thing that first appears starts hidden; the director still sees it all at 0 s */
  function visOf(o, t) {
    var cs = clips('action').filter(function (c) { return c.target === o.id && (c.op === 'appear' || c.op === 'vanish'); });
    if (!cs.length) return 1;
    if (!guest && !play.playing && t < 0.001) return 1;
    cs.sort(function (a, b) { return a.t0 - b.t0; });
    return level2(cs.map(function (c) { return { op: c.op, a: c.t0, b: c.t1, now: t }; }), 'appear', 'vanish', cs[0].op === 'appear' ? 0 : 1);
  }
  function pose(o, n, t, dt) {
    var rig = n.g.userData.rig; if (!rig) return;
    if (rig.prop) return poseProp(o, n, t, dt);
    var life = o.life || {}, on = life.on, P = !!rig.portrait, ex = { smile: 0, surprise: 0, wink: 0 };
    if (rig.spine) { rig.spine.rotation.set(0, 0, 0); rig.spine.position.y = 0; }
    if (rig.legL) { rig.legL.rotation.x = 0; rig.legR.rotation.x = 0; }
    rig.head.rotation.set(0, 0, 0);
    if (rig.armR) { rig.armR.rotation.set(0, 0, 0.06); rig.armL.rotation.set(0, 0, -0.06); }
    rig.mouth.scale.set(1, 1, 1);
    if (on && life.idle !== false) {
      if (rig.spine) { rig.spine.rotation.z = Math.sin(clock * 1.3 + o.x) * 0.015; rig.spine.position.y = Math.sin(clock * 1.9) * 0.004; }
      rig.head.rotation.y = Math.sin(clock * 0.45 + o.z) * (P ? 0.04 : 0.06);
    }
    var acts = actsOf(o, t);
    acts.forEach(function (c) {
      var w = bump(c.now, c.a, c.b, 0.45); if (!w) return; var p = (c.now - c.a) / Math.max(0.01, c.b - c.a);
      if (c.op === 'raiseHand' && rig.armR) { rig.armR.rotation.x = -2.55 * w; rig.armR.rotation.z = 0.06 + 0.22 * w; }
      else if (c.op === 'openArms' && rig.armR) { rig.armR.rotation.z = 0.06 + 1.05 * w; rig.armL.rotation.z = -0.06 - 1.05 * w; rig.armR.rotation.x = rig.armL.rotation.x = -0.45 * w; }
      else if (c.op === 'point' && rig.armR) { rig.armR.rotation.x = -1.5 * w; }
      else if (c.op === 'turnHead') rig.head.rotation.y += 0.55 * Math.sin(Math.PI * 2 * p) * w;
      else if (c.op === 'nod') rig.head.rotation.x += 0.16 * Math.sin((c.now - c.a) * 7) * w;
      else if (c.op === 'bow') { if (rig.spine) rig.spine.rotation.x = 0.55 * w; rig.head.rotation.x += (rig.spine ? 0.15 : 0.3) * w; }
      else if (c.op === 'stroll' && rig.legL) {   /* a little walk around its spot, legs and arms swinging */
        var th = (c.now - c.a) * 0.75, r = 1.3 * w, sw = Math.sin(clock * 7) * 0.55 * w;
        n.g.position.x = o.x + Math.sin(th) * r; n.g.position.z = o.z + (Math.cos(th) - 1) * r;
        if (w > 0.2) n.g.rotation.y = Math.atan2(Math.cos(th), -Math.sin(th));
        rig.legL.rotation.x = sw; rig.legR.rotation.x = -sw; rig.armL.rotation.x = -sw * 0.8; rig.armR.rotation.x = sw * 0.8;
      }
      else if (ex[c.op] != null) ex[c.op] = Math.max(ex[c.op], w);
    });
    /* gaze: at the guest, or (a portrait) at the director's camera too */
    var want = 0, wantP = 0;
    if (on && life.lookAtGuest && (guest || P)) {
      var hp = new T.Vector3(); rig.head.getWorldPosition(hp);
      var a = Math.atan2(cam.position.x - hp.x, cam.position.z - hp.z) - (o.ry || 0);
      a = Math.atan2(Math.sin(a), Math.cos(a)); want = Math.max(-0.95, Math.min(0.95, a));
      wantP = Math.max(-0.5, Math.min(0.5, Math.atan2(cam.position.y - hp.y, Math.hypot(cam.position.x - hp.x, cam.position.z - hp.z))));
    }
    n.look += (want - n.look) * Math.min(1, dt * 3); n.lookP = (n.lookP || 0) + (wantP - (n.lookP || 0)) * Math.min(1, dt * 3);
    rig.head.rotation.y += n.look * (P ? 0.55 : 1); rig.head.rotation.x -= n.lookP * (P ? 0.35 : 0.5);
    if (rig.pupils) rig.pupils.forEach(function (pp) { var b0 = pp.userData.base; pp.position.x = b0.x + Math.max(-0.022, Math.min(0.022, n.look * 0.03)); pp.position.y = b0.y + Math.max(-0.01, Math.min(0.012, n.lookP * 0.03)); });
    if (rig.lids) rig.lids.forEach(function (ld, i) { var c = on ? blinkAt(o.x * 7 + i * 0.02) : 0; if (i === 1) c = Math.max(c, ex.wink); ld.scale.y = 0.06 + 0.94 * Math.max(c, ex.surprise ? 0 : 0) ; if (ex.surprise) ld.scale.y = 0.02; });
    if (rig.brows) rig.brows.forEach(function (bw) { var b0 = bw.userData.base; bw.position.y = b0.y + 0.03 * ex.surprise + 0.008 * ex.smile; bw.rotation.z = -b0.s * (0.1 * ex.smile + 0.16 * ex.surprise);   /* inner ends up: friendly, or surprised */ });
    rig.mouth.scale.x = 1 + 0.7 * ex.smile - 0.25 * ex.surprise; rig.mouth.scale.y = 1 + 2.6 * ex.surprise;
    if (on && life.lipSync !== false && E.speaking(o.id)) rig.mouth.scale.y *= 1 + 3.2 * Math.abs(Math.sin(clock * 13)) * (0.55 + 0.45 * Math.sin(clock * 3.1));
  }

  /* ---------------------------------------------------------------- audio: voices and music */
  var A = { ctx: null, master: null };
  function actx() {
    if (!A.ctx) { var C = root.AudioContext || root.webkitAudioContext; if (!C) return null; A.ctx = new C(); A.master = A.ctx.createGain(); A.master.gain.value = 0.9; A.master.connect(A.ctx.destination); }
    if (A.ctx.state === 'suspended') A.ctx.resume(); return A.ctx;
  }
  /* call from a tap: iOS lets audio and speech start only after one */
  E.unlock = function () {
    actx();
    try { if (root.speechSynthesis && !E._unlocked) { var u = new SpeechSynthesisUtterance(' '); u.volume = 0; speechSynthesis.speak(u); E._unlocked = true; } } catch (e) {}
  };
  function env(g, t, a, peak) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); }
  function music(c, offset) {
    var ctx = actx(); if (!ctx) return null;
    var now = ctx.currentTime, dur = Math.max(0.2, c.t1 - c.t0 - offset), out = ctx.createGain(), oscs = [];
    out.gain.value = 1; out.connect(A.master);
    if (c.op === 'pad') {
      var lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; lp.connect(out);
      var g = ctx.createGain(); env(g, now, Math.min(2, dur / 3), 0.07); g.connect(lp);
      [130.81, 164.81, 196, 246.94, 261.63].forEach(function (f, i) { [-4, 4].forEach(function (d) { var o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = d + i; o.connect(g); o.start(now); oscs.push(o); }); });
    } else if (c.op === 'fanfare') {
      var lp2 = ctx.createBiquadFilter(); lp2.type = 'lowpass'; lp2.frequency.value = 2400; lp2.connect(out);
      var seq = [[392, 0, 0.28], [523.25, 0.3, 0.28], [659.25, 0.6, 0.28], [783.99, 0.9, 1.1]];
      for (var rep = 0; rep * 2.6 < dur; rep++) seq.forEach(function (n) {
        var st = now + rep * 2.6 + n[1]; if (st - now > dur) return;
        var o = ctx.createOscillator(), gg = ctx.createGain(); o.type = 'square'; o.frequency.value = n[0];
        gg.gain.setValueAtTime(0.0001, st); gg.gain.exponentialRampToValueAtTime(0.06, st + 0.03); gg.gain.exponentialRampToValueAtTime(0.0001, st + n[2]);
        o.connect(gg); gg.connect(lp2); o.start(st); o.stop(st + n[2] + 0.05); oscs.push(o);
      });
    } else if (c.op === 'drum') {
      for (var b = 0; b * 0.5 < dur; b++) {
        var s0 = now + b * 0.5, o3 = ctx.createOscillator(), g3 = ctx.createGain(); o3.type = 'sine';
        o3.frequency.setValueAtTime(90, s0); o3.frequency.exponentialRampToValueAtTime(40, s0 + 0.35);
        g3.gain.setValueAtTime(0.35, s0); g3.gain.exponentialRampToValueAtTime(0.0001, s0 + 0.4);
        o3.connect(g3); g3.connect(out); o3.start(s0); o3.stop(s0 + 0.45); oscs.push(o3);
      }
    } else if (c.op === 'chime') {
      for (var q = 0; q * 1.2 < dur; q++) {
        var s1 = now + q * 1.2, f1 = [1046.5, 1318.5, 1568, 1318.5][q % 4], o4 = ctx.createOscillator(), g4 = ctx.createGain(); o4.type = 'sine'; o4.frequency.value = f1;
        g4.gain.setValueAtTime(0.0001, s1); g4.gain.exponentialRampToValueAtTime(0.08, s1 + 0.01); g4.gain.exponentialRampToValueAtTime(0.0001, s1 + 1.1);
        o4.connect(g4); g4.connect(out); o4.start(s1); o4.stop(s1 + 1.15); oscs.push(o4);
      }
    }
    return { c: c, out: out, stop: function (rel) {
      var t = ctx.currentTime, r = rel == null ? 0.8 : rel;
      try { out.gain.cancelScheduledValues(t); out.gain.setValueAtTime(out.gain.value, t); out.gain.linearRampToValueAtTime(0, t + r); } catch (e) {}
      oscs.forEach(function (o) { try { o.stop(t + r + 0.05); } catch (e) {} });
      setTimeout(function () { try { out.disconnect(); } catch (e) {} }, (r + 0.3) * 1000);
    } };
  }
  function pickVoice(lang) {
    var vs = (root.speechSynthesis && speechSynthesis.getVoices()) || [], l = (lang || 'zh-CN').toLowerCase();
    var m = vs.filter(function (v) { return v.lang && v.lang.replace('_', '-').toLowerCase() === l; });
    if (!m.length) m = vs.filter(function (v) { return v.lang && v.lang.toLowerCase().indexOf(l.slice(0, 2)) === 0; });
    return m.filter(function (v) { return v.localService; })[0] || m[0] || null;
  }
  E.speak = function (text, v, frac, volume) {
    if (!root.speechSynthesis || !text) return false;
    try { speechSynthesis.cancel(); } catch (e) {}
    var s = String(text);
    if (frac > 0.02) { var i = Math.floor(s.length * Math.min(0.98, frac)), j = s.slice(i).search(/[\s，。,.;；!?！？]/); s = s.slice(i + (j < 0 ? 0 : j + 1)); }
    var u = new SpeechSynthesisUtterance(s); v = v || {};
    u.lang = v.lang || 'zh-CN'; u.rate = v.rate || 1; u.pitch = v.pitch == null ? 1 : v.pitch; u.volume = volume == null ? 1 : volume;
    var vc = pickVoice(u.lang); if (vc) u.voice = vc;
    speechSynthesis.speak(u); return true;
  };
  E.hush = function () { try { if (root.speechSynthesis) speechSynthesis.cancel(); } catch (e) {} };
  /* how long a text takes to say (for the voice clip's length) */
  E.sayTime = function (v) {
    v = v || {}; var s = String(v.text || ''), r = v.rate || 1;
    var words = (s.match(/[A-Za-z0-9'’-]+/g) || []).length, han = (s.match(/[㐀-鿿]/g) || []).length;
    return Math.max(1.5, (words / 2.55 + han / 4.3) / r + (s.match(/[.,;:!?。，；！？]/g) || []).length * 0.12 + 0.8);
  };
  function objOf(id) { return work && work.objects.filter(function (o) { return o.id === id; })[0]; }
  function startAt(t) {
    clips('music').forEach(function (c) { if (t >= c.t0 && t < c.t1 - 0.2 && !play.music[c.id]) play.music[c.id] = music(c, t - c.t0); });
    clips('voice').forEach(function (c) {
      if (t >= c.t0 && t < c.t1 - 0.3) { var o = objOf(c.target); if (o && o.life && o.life.voice) { E.speak(c.text || o.life.voice.text, o.life.voice, (t - c.t0) / (c.t1 - c.t0), voiceVol(o)); play.voice = c.id; } }
    });
  }
  function stopAudio(rel) { Object.keys(play.music).forEach(function (k) { if (play.music[k]) play.music[k].stop(rel); }); play.music = {}; if (play.voice) E.hush(); play.voice = null; }

  /* ---------------------------------------------------------------- the show: the player */
  function len() { return (work && work.timeline && work.timeline.len) || 30; }
  E.state = function () { return { t: play.t, playing: play.playing, len: len(), guest: !!guest } ; };
  E.play = function (until) { if (!work) return; actx(); if (play.t >= len() - 0.05) play.t = 0; play.until = until == null ? null : until; play.playing = true; startAt(play.t); emitTick(); };
  E.pause = function () { play.playing = false; stopAudio(0.3); emitTick(); };
  E.stop = function () { play.playing = false; stopAudio(0.3); play.t = 0; play.fadeK = 1; play.fading = 0; emitTick(); };
  E.seek = function (t) { play.t = Math.max(0, Math.min(len(), t)); if (play.playing) { stopAudio(0.2); startAt(play.t); } emitTick(); };
  function emitTick() { if (E.on.tick) E.on.tick(play.t, play.playing); }
  function advance(dt) {
    if (!play.playing) return;
    var a = play.t, b = Math.min(len(), a + dt); play.t = b;
    clips('music').forEach(function (c) {
      if (a < c.t0 && b >= c.t0) play.music[c.id] = music(c, 0);
      if (a < c.t1 && b >= c.t1 && play.music[c.id]) { play.music[c.id].stop(0.8); delete play.music[c.id]; }
    });
    clips('voice').forEach(function (c) {
      if (a < c.t0 && b >= c.t0) { var o = objOf(c.target); if (o && o.life && o.life.voice) { E.speak(c.text || o.life.voice.text, o.life.voice, 0, voiceVol(o)); play.voice = c.id; } }
    });
    if (play.until != null && b >= play.until) { play.playing = false; play.until = null; stopAudio(1.2); return; }   // a zone's own part of the show ends here
    if (b >= len()) { play.playing = false; stopAudio(1.2); if (E.on.ended) E.on.ended(); }
  }

  /* ---------------------------------------------------------------- lights each frame */
  var COOL = new T.Color('#d6e4ff'), NEUTRAL = new T.Color('#fff1cf'), WARM = new T.Color('#ffae5c'), SKYC = new T.Color('#c9d6f0'), warmCol = new T.Color('#fff1cf');
  function applyLights(dt) {
    var sk = skyAt(play.t), lerp = function (a, b) { return a + (b - a) * sk.k; }, A0 = sk.a, B0 = sk.b, L = E.level(play.t) * play.fadeK;
    var m = { hemi: [lerp(A0.hemi[0], B0.hemi[0]), lerp(A0.hemi[1], B0.hemi[1])], sun: lerp(A0.sun, B0.sun), lamps: lerp(A0.lamps, B0.lamps), cone: lerp(A0.cone, B0.cone) };
    var bg = new T.Color(A0.bg).lerp(new T.Color(B0.bg), sk.k); scene.background = bg; scene.fog.color.copy(bg); scene.fog.density = lerp(A0.fog, B0.fog); sun.color.set(A0.sunC).lerp(new T.Color(B0.sunC), sk.k);
    var wm = (work.env || {}).warmth == null ? 0.5 : +work.env.warmth;   /* 灯光冷暖: 0 cool, 0.5 neutral, 1 warm */
    if (wm < 0.5) warmCol.copy(COOL).lerp(NEUTRAL, wm * 2); else warmCol.copy(NEUTRAL).lerp(WARM, (wm - 0.5) * 2);
    hemi.color.copy(SKYC).lerp(WARM, Math.max(0, wm - 0.5) * 0.5);
    var wt = weatherAt(play.t);
    if (wt.st !== 'clear' || rainP) {
      var P = weatherParticles(), amt = wt.st === 'clear' ? Math.max(0, (P.userData.amt || 0) - dt * 0.8) : wt.k, snow = wt.st === 'snow' || (wt.st === 'clear' && P.userData.snow);
      P.userData.amt = amt; if (wt.st !== 'clear') P.userData.snow = wt.st === 'snow';
      P.material.opacity = 0.9 * amt; P.material.size = snow ? 0.17 : 0.11; P.material.color.set(snow ? '#ffffff' : '#bcd6ff'); P.visible = amt > 0.01;
      if (P.visible) { var pa = P.geometry.attributes.position, vy = snow ? 1.1 : 9; for (var i = 0; i < pa.count; i++) { var y = pa.getY(i) - vy * dt; if (y < 0) y += 12; pa.setY(i, y); if (snow) pa.setX(i, pa.getX(i) + Math.sin(clock + i) * dt * 0.3); } pa.needsUpdate = true; }
      m.hemi[0] *= 1 - 0.3 * amt * (snow ? 0 : 1);
    }
    var work_light = !guest && !play.playing ? 0.32 : 0;   // the director's work light: editing in the dark is no fun; playing and the guest see the real show
    hemi.intensity = m.hemi[0] + m.hemi[1] * L + work_light; sun.intensity = m.sun;
    if (host) { ground.visible = !!guest; if (!guest) { scene.background = null; scene.fog.density = 0; if (host.light) { hemi.intensity = Math.max(hemi.intensity, host.light); sun.intensity = Math.max(sun.intensity, host.light * 0.8); } } }   /* a miniature on the host's table: no sky of its own, and never darker than the room */
    Object.keys(nodes).forEach(function (id) {
      var u = nodes[id].g.userData;
      if (u.spot) {
        u.spot.light.intensity = 2.8 * L; u.spot.lens.emissiveIntensity = 2.2 * L; u.spot.cone.opacity = m.cone * L;
        u.spot.light.color.copy(warmCol); u.spot.cone.color.copy(warmCol);
        var so = objOf(id), sh = !!(so && so.shadow); if (u.spot.light.castShadow !== sh) { u.spot.light.castShadow = sh; u.spot.light.shadow.mapSize.set(1024, 1024); u.spot.light.shadow.camera.near = 0.5; u.spot.light.shadow.camera.far = 20; }
      }
      if (u.lamp) { u.lamp.light.intensity = m.lamps; u.lamp.bulb.emissiveIntensity = m.lamps ? 1.2 : 0.25; }
      if (u.cloth) u.cloth.rotation.y = Math.sin(clock * 1.6 + id.length) * 0.18;
      if (u.spin) u.spin.obj.rotation.z += dt * u.spin.speed;
    });
  }

  /* ---------------------------------------------------------------- guest preview */
  var keys = {}, joy = { x: 0, y: 0 }, look = { dx: 0, dy: 0 };
  function bindKeys() {
    root.addEventListener('keydown', function (e) { if (guest && !/INPUT|TEXTAREA|SELECT/.test((e.target || {}).tagName || '')) { keys[e.code] = true; if (/Arrow|Space/.test(e.code)) e.preventDefault(); } });
    root.addEventListener('keyup', function (e) { keys[e.code] = false; });
  }
  /* nearer is louder: the guest's distance to where a sound comes from */
  /* full volume within near metres, fading to a whisper at far (导演 → 声音距离; default 2.2 → 16) */
  function audioRange() { var a = (work && work.audio) || {}; var n = a.near == null ? 2.2 : +a.near, f = a.far == null ? 16.2 : +a.far; return { near: n, far: Math.max(n + 0.5, f) }; }
  function falloff(d) { var r = audioRange(); return d <= r.near ? 1 : Math.max(0.05, Math.pow(Math.max(0, 1 - (d - r.near) / (r.far - r.near)), 1.6)); }
  function distTo(o) { return Math.hypot(cam.position.x - o.x, cam.position.z - o.z); }
  function voiceVol(o) { return guest ? (o ? falloff(distTo(o)) : guest.gain) : 1; }
  E.enterGuest = function () {
    if (!work) return; E.unlock();
    var r = work.route || [], p0 = r[0] || { x: 0, z: 10 }, p1 = r[1] || { x: 0, z: 0 };
    guest = { x: p0.x, z: p0.z, yaw: Math.atan2(p1.x - p0.x, p1.z - p0.z), pitch: -0.05, zone: null, gain: 1, auto: null, y: E.surfaceY(p0.x, p0.z) };
    E.stop(); grid.visible = rim.visible = false; drawHelpers(); placeRing();
    cam.fov = 62; cam.updateProjectionMatrix();
    if (ride()) { guest.riding = true; guest.heading = guest.yaw; guest.lookOff = 0; guest.y = 0; boatG = M.build({ kind: 'boat', color: '#8a5a35', ride: true }); scene.add(boatG); say('上船了 · 点「⛵ 开船」出发，拖动可以四处看'); }
    else say('你在入口。走近触发区，演出就会开始；点一点活过来的人物或画像，它会回应你');
  };
  var boatG = null;
  E.exitGuest = function () {
    if (!guest) return; guest = null; keys = {}; taps = {}; tapSpeak = {}; E.stop(); if (boatG) { scene.remove(boatG); boatG = null; } grid.visible = rim.visible = true; drawHelpers(); placeRing();
    cam.fov = 50; cam.updateProjectionMatrix();
  };
  E.inGuest = function () { return !!guest; };
  E.guestJoy = function (x, y) { joy.x = x; joy.y = y; };
  E.guestLook = function (dx, dy) {
    if (!guest) return;
    if (guest.riding) guest.lookOff = Math.max(-2.4, Math.min(2.4, guest.lookOff - dx * 0.005)); else guest.yaw -= dx * 0.005;
    guest.pitch = Math.max(-1.1, Math.min(1.1, guest.pitch - dy * 0.004));
  };
  E.guestAuto = function (on) {
    if (!guest) return;
    if (guest.riding && on) {   /* (again) from the landing stage */
      var r = work.route || [], p0 = r[0] || { x: 0, z: 0 }, p1 = r[1] || p0;
      guest.x = p0.x; guest.z = p0.z; guest.heading = Math.atan2(p1.x - p0.x, p1.z - p0.z); guest.zone = null; guest.done = false; E.stop();
      guest.auto = { i: 1 }; say('⛵ 开船了'); return;
    }
    guest.auto = on ? { i: 1 } : null; if (on) say('沿着你画的观众路线走');
  };
  E.riding = function () { return !!(guest && guest.riding); };
  /* the guest taps something that has come to life: it answers (if the guest is near enough) */
  E.guestTap = function (cx, cy) {
    if (!guest) return null; var h = E.pick(cx, cy); if (!h || h.type !== 'obj') return null;
    var o = objOf(h.id); if (o && nodes[o.id] && !nodes[o.id].g.visible) return null;
    if (!o) return null;
    if (o.kind === 'firework') { E.unlock(); E.launchFireworks(6, o.x, o.z); return { ok: true, name: o.name || '烟花礼花台' }; }
    if (!o.life || !o.life.on) {
      if (M.canLive(o.kind)) { E.unlock(); taps[o.id] = { op: M.actions(o.kind)[0] || 'raiseHand', c0: clock, dur: 3 }; return { ok: true, name: o.name }; }
      return { still: true, name: o.name };
    }
    var d = distTo(o); if (d > 11.5) return { far: true, name: o.name };
    var tp = o.life.tap || {};
    var fallbackOp = M.actions(o.kind)[0] || 'raiseHand';
    var tapText = tp.text || '';
    var tapOp = tp.op || fallbackOp;
    E.unlock();
    if (tapText) { var v = Object.assign({}, o.life.voice || {}, { text: tapText }); if (E.speak(tapText, v, 0, falloff(d))) tapSpeak[o.id] = clock + E.sayTime(v); }
    if (tapOp === 'startShow') { if (!play.playing) { play.t = 0; play.fadeK = 1; E.play(); } }
    else if (tapOp === 'fireworks') { E.launchFireworks(6.5, o.x, o.z); taps[o.id] = { op: 'spin', c0: clock, dur: 3.5 }; }
    else if (tapOp) taps[o.id] = { op: tapOp, c0: clock, dur: tapOp === 'turnHead' ? 4 : tapOp === 'spin' || tapOp === 'timeTravel' ? 4 : 3 };
    return { ok: true, name: o.name, text: tapText };
  };
  function say(t) { if (E.on.guest) E.on.guest(t); }
  function zoneAt(x, z) { return (work.zones || []).filter(function (q) { return Math.hypot(x - q.x, z - q.z) <= q.r; })[0] || null; }
  function guestTick(dt) {
    var g = guest, mx = joy.x, my = joy.y;
    if (keys.KeyW || keys.ArrowUp) my = 1; if (keys.KeyS || keys.ArrowDown) my = -1;
    if (keys.KeyA) mx = -1; if (keys.KeyD) mx = 1;
    if (keys.ArrowLeft) g.yaw += dt * 1.8; if (keys.ArrowRight) g.yaw -= dt * 1.8;
    var sp = (keys.ShiftLeft || keys.ShiftRight ? 4 : 2.1) * dt;
    if (g.riding) { mx = my = 0; if (keys.ArrowLeft) g.lookOff += dt * 1.8; if (keys.ArrowRight) g.lookOff -= dt * 1.8; }
    if (mx || my) g.auto = null;
    var fx = Math.sin(g.yaw), fz = Math.cos(g.yaw);
    var nx = g.x + (fx * my - fz * mx) * sp, nz = g.z + (fz * my + fx * mx) * sp;
    if (g.auto) {
      var r = work.route || [], tgt = r[g.auto.i];
      if (!tgt) { g.auto = null; if (g.riding) { g.done = true; say('到站了 · 点「⛵ 再坐一次」'); if (E.on.rideEnd) E.on.rideEnd(); } else { var st = stageCentre(); g.yawTo = Math.atan2(st.x - g.x, st.z - g.z); say('到了。可以四处看看'); } }
      else {
        var dx = tgt.x - g.x, dz = tgt.z - g.z, d = Math.hypot(dx, dz), step = (g.riding ? ((ride() || {}).speed || 1.3) : 1.35) * dt;
        if (g.auto.hold && clock < g.auto.hold) { nx = g.x; nz = g.z; }   /* a route point that says: wait here (a door to open, a scene to watch) */
        else if (d < step) { nx = tgt.x; nz = tgt.z; g.auto.i++; if (tgt.wait) { g.auto.hold = clock + +tgt.wait; say('在这里停 ' + Math.round(tgt.wait) + ' 秒'); } } else { nx = g.x + dx / d * step; nz = g.z + dz / d * step; }
        var want = Math.atan2(dx, dz);
        if (g.riding) g.heading += Math.atan2(Math.sin(want - g.heading), Math.cos(want - g.heading)) * Math.min(1, dt * 1.6);
        else g.yaw += Math.atan2(Math.sin(want - g.yaw), Math.cos(want - g.yaw)) * Math.min(1, dt * 3);
      }
    }
    if (g.yawTo != null) { g.yaw += Math.atan2(Math.sin(g.yawTo - g.yaw), Math.cos(g.yawTo - g.yaw)) * Math.min(1, dt * 2.5); if (Math.abs(Math.atan2(Math.sin(g.yawTo - g.yaw), Math.cos(g.yawTo - g.yaw))) < 0.01) g.yawTo = null; }
    var c = E.clampToTable(nx, nz, 0.6); g.x = c.x; g.z = c.z;
    var eye = 1.62, bob = (mx || my || g.auto) ? Math.sin(clock * 9) * 0.03 : 0;
    if (g.riding) {   /* seated in the boat, rocking on the water */
      g.y = 0; eye = 1.25; bob = Math.sin(clock * 1.7) * 0.035; g.yaw = g.heading + g.lookOff;
      if (boatG) { boatG.position.set(g.x + Math.sin(g.heading) * 0.85, 0.02 + Math.sin(clock * 1.7) * 0.03, g.z + Math.cos(g.heading) * 0.85);   /* the guest on the rear seat */ boatG.rotation.set(Math.sin(clock * 1.3) * 0.02, g.heading, Math.sin(clock * 1.1) * 0.025); }
    } else g.y += (E.surfaceY(g.x, g.z) - g.y) * Math.min(1, dt * 10);
    cam.position.set(g.x, g.y + eye + bob, g.z);
    cam.lookAt(g.x + Math.sin(g.yaw) * Math.cos(g.pitch), cam.position.y + Math.sin(g.pitch), g.z + Math.cos(g.yaw) * Math.cos(g.pitch));
    /* the zones: in starts the show, out fades it */
    var z = zoneAt(g.x, g.z);
    if (z && (!g.zone || g.zone.id !== z.id)) {
      g.zone = z; play.fading = 0; play.fadeK = 1;
      var cue = z.cue && z.cue.t0 != null ? z.cue : null;
      if (z.enter === 'play' && (cue || !play.playing)) {
        if (play.playing) stopAudio(0.4);
        play.t = cue ? cue.t0 : 0; play.fadeK = 1; E.play(cue && cue.t1 != null ? cue.t1 : null);
        say('进入「' + (z.name || '触发区') + '」' + (cue ? '' : ' · 演出开始'));
      }
    } else if (!z && g.zone) {
      var ex = g.zone.exit; g.zone = null;
      if (ex === 'fade' && play.playing) { play.fading = 1.6; E.hush(); play.voice = null; say('离开了触发区 · 声音和灯光渐渐熄灭'); }
      else if (ex === 'stop') { E.stop(); say('离开了触发区 · 演出停止'); }
    }
    if (play.fading > 0) { play.fading -= dt; play.fadeK = Math.max(0, play.fading / 1.6); if (play.fading <= 0) { E.stop(); } }
    /* nearer is louder */
    var zs = work.zones || [], d0 = Infinity, rr = 3;
    zs.forEach(function (q) { var d = Math.hypot(g.x - q.x, g.z - q.z) - q.r; if (d < d0) { d0 = d; rr = q.r; } });
    if (work.audio) { var dc = Infinity; zs.forEach(function (q) { dc = Math.min(dc, Math.hypot(g.x - q.x, g.z - q.z)); }); g.gain = zs.length ? falloff(dc) : 1; }
    else g.gain = zs.length ? Math.max(0.15, Math.min(1, 1 - Math.max(0, d0) / (rr * 2.2))) : 1;
    if (A.master) {
      A.master.gain.setTargetAtTime(0.9 * play.fadeK, A.ctx.currentTime, 0.15);
      Object.keys(play.music).forEach(function (k) { var hd = play.music[k]; if (!hd || !hd.out) return; var so = hd.c.target && objOf(hd.c.target); hd.out.gain.setTargetAtTime(so ? falloff(distTo(so)) : g.gain, A.ctx.currentTime, 0.15); });
    }
  }
  function stageCentre() {
    var f = work.objects.filter(function (o) { return M.isFigure(o.kind) && o.life && o.life.on; })[0] || work.objects.filter(function (o) { return o.kind === 'stage'; })[0];
    return f ? { x: f.x, z: f.z } : { x: 0, z: 0 };
  }

  /* ---------------------------------------------------------------- the frame */
  function tick(dt) {
    if (!work) { placeCam(); return; }
    advance(dt);
    if (guest) guestTick(dt); else { if (A.master && A.ctx) { A.master.gain.setTargetAtTime(0.9, A.ctx.currentTime, 0.2); Object.keys(play.music).forEach(function (k) { var hd = play.music[k]; if (hd && hd.out) hd.out.gain.setTargetAtTime(1, A.ctx.currentTime, 0.2); }); } if (!host) placeCam(); }
    applyLights(dt);
    updateFireworks(dt);
    work.objects.forEach(function (o) {
      var n = nodes[o.id]; if (!n) return;
      var k = visOf(o, play.t), s0 = o.s || 1, e = k >= 1 ? 1 : k <= 0 ? 0 : 1 + 2.7 * Math.pow(k - 1, 3) + 1.7 * Math.pow(k - 1, 2);   /* a little overshoot as it pops in */
      n.g.visible = k > 0.01; n.g.scale.setScalar(s0 * Math.max(0.001, e)); n.g.position.set(o.x, o.y || 0, o.z); n.g.rotation.y = o.ry || 0;
      pose(o, n, play.t, dt);
    });
    if (play.playing) emitTick();
    updateLinks();
    if (sel && sel.type === 'obj') placeRing();
  }
  E.camera = function () { return cam; };
  E.audioRange = function () { return audioRange(); };
  E.isShown = function (id) { var n = nodes[id]; return !!(n && n.g.visible); };   /* is a thing showing now (appear / vanish) */
})(window);
