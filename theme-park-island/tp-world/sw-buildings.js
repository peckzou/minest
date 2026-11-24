/* Star Wars: Galaxy's Edge — two buildings to walk into (2026-11-24).
 * Droid Depot (机器人工坊): a long industrial shed with a flat roof, pipes and a radar dish; inside, a conveyor of parts,
 * shelves of finished droids and the build station. (Savi's Workshop is in sw-savi.js.) A real hollow model in the park: the
 * doors slide open as the guest comes near, and the guest walks in. At the bench inside, E opens the builder
 * (sw-workshops.js); the droid then follows its maker and the lightsaber is in the hand. */
(function (root) {
  'use strict';
  var API, T, doors = [], spin = [], clock = 0;
  var DEPOT = { x: 164, z: 112 }, SAVI = { x: 198, z: 104 }   /* Savi's Workshop is its own file now: sw-savi.js */;
  function tex(w, h, rep, draw) { var c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); var t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(rep[0], rep[1]); return t; }
  function build() {
    var L = function (c, o) { return new T.MeshLambertMaterial(Object.assign({ color: c }, o || {})); }, B = function (c) { return new T.MeshBasicMaterial({ color: c }); };
    var W = root.TPStarWarsWorkshops, COLS = ['#2563eb', '#f97316', '#dc2626', '#16a34a', '#7c3aed', '#f8fafc'], KY = ['#3b82f6', '#22c55e', '#a855f7', '#ef4444', '#facc15', '#f8fafc'];
    var plaster = function (base, rep) { return new T.MeshLambertMaterial({ side: T.DoubleSide, map: tex(256, 256, rep, function (c, w, h) { c.fillStyle = base; c.fillRect(0, 0, w, h); for (var i = 0; i < 240; i++) { c.fillStyle = 'rgba(' + (i % 2 ? '40,30,20' : '255,240,210') + ',.09)'; c.fillRect((i * 97) % w, (i * 53) % h, 8 + i % 26, 2 + i % 6); } c.strokeStyle = 'rgba(40,30,20,.5)'; c.lineWidth = 3; c.strokeRect(2, 2, w - 4, h - 4); c.fillStyle = 'rgba(40,30,20,.35)'; c.fillRect(0, h * 0.7, w, 6); }) }); };
    var plate = new T.MeshLambertMaterial({ map: tex(128, 128, [8, 6], function (c, w, h) { c.fillStyle = '#4a4238'; c.fillRect(0, 0, w, h); c.strokeStyle = '#2a241d'; c.lineWidth = 3; c.strokeRect(1, 1, w - 2, h - 2); c.fillStyle = '#6b5f50'; [[10, 10], [w - 16, 10], [10, h - 16], [w - 16, h - 16]].forEach(function (q) { c.fillRect(q[0], q[1], 6, 6); }); }) });
    var sign = function (g, txt, sub, col, w, x, y, z) { var c = document.createElement('canvas'); c.width = 640; c.height = 160; var q = c.getContext('2d'); q.fillStyle = '#0b0f1a'; q.fillRect(0, 0, 640, 160); q.strokeStyle = col; q.lineWidth = 10; q.strokeRect(6, 6, 628, 148); q.shadowColor = col; q.shadowBlur = 16; q.fillStyle = col; q.textAlign = 'center'; q.font = '800 62px sans-serif'; q.fillText(txt, 320, 72); q.shadowBlur = 0; q.fillStyle = '#e0f2fe'; q.font = '700 40px "PingFang SC",sans-serif'; q.fillText(sub, 320, 128); var m = new T.Mesh(new T.PlaneGeometry(w, w / 4), new T.MeshBasicMaterial({ map: new T.CanvasTexture(c) })); m.position.set(x, y, z); g.add(m); };
    var add = function (g, geo, m, x, y, z, ry) { var o = new T.Mesh(geo, m); o.position.set(x, y, z); if (ry) o.rotation.y = ry; g.add(o); return o; };
    var slide = function (g, x, z, w, h, col, at) { [-1, 1].forEach(function (s) { var d = add(g, new T.BoxGeometry(w / 2, h, 0.18), L(col), x + s * w / 4, h / 2 + 0.1, z); add(d, new T.BoxGeometry(w / 2 - 0.3, 0.12, 0.2), B(0xf97316), 0, 0.3, 0); d.position.set(x + s * w / 4, h / 2 + 0.1, z); doors.push({ m: d, x0: x + s * w / 4, s: s, w: w / 2, at: at }); }); };

    /* ---------------- Droid Depot: a long shed, 18 × 12, flat roof ---------------- */
    var gy = API.groundY(DEPOT.x, DEPOT.z, 62), g = new T.Group(); g.position.set(DEPOT.x, gy, DEPOT.z); API.scene.add(g);
    var wm = plaster('#c9b592', [4, 1]), HW = 9, HD = 6, H = 5.2;
    add(g, new T.BoxGeometry(18.4, 0.2, 12.4), plate, 0, 0.1, 0);                                        /* floor */
    add(g, new T.BoxGeometry(18, H, 0.3), wm, 0, H / 2, -HD); [-1, 1].forEach(function (s) { add(g, new T.BoxGeometry(0.3, H, 12), wm, s * HW, H / 2, 0); add(g, new T.BoxGeometry(7.2, H, 0.3), wm, s * 5.4, H / 2, HD); });
    add(g, new T.BoxGeometry(3.6, H - 3.4, 0.3), wm, 0, 3.4 + (H - 3.4) / 2, HD);                       /* over the door */
    add(g, new T.BoxGeometry(19, 0.4, 13), L(0x8c7a60), 0, H + 0.2, 0);                                  /* roof */
    add(g, new T.BoxGeometry(18, 0.06, 12), B(0x2a241d), 0, H - 0.02, 0);                                 /* ceiling */
    slide(g, 0, HD, 3.6, 3.3, 0x6b7280, { x: DEPOT.x, z: DEPOT.z + HD });
    sign(g, 'DROID DEPOT', '机器人工坊', '#f97316', 8, 0, H + 1.6, HD + 0.2); add(g, new T.BoxGeometry(8.4, 2.3, 0.2), L(0x1f2937), 0, H + 1.6, HD);
    var dish = add(g, new T.SphereGeometry(1.5, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2.6), L(0x9aa3ad, { side: T.DoubleSide }), -6, H + 2.4, -2); dish.rotation.x = Math.PI * 0.8; spin.push(dish); add(g, new T.CylinderGeometry(0.1, 0.14, 1.8, 8), L(0x4b5563), -6, H + 1.2, -2);
    [[-8.6, 2], [8.6, -1]].forEach(function (q) { add(g, new T.CylinderGeometry(0.22, 0.22, H + 1.4, 10), L(0x7a4a2a), q[0] * 1.06, (H + 1.4) / 2, q[1]); });
    [-6, 6].forEach(function (x) { add(g, new T.BoxGeometry(2.4, 1.3, 0.1), B(0x9bd8f5), x, 3, HD + 0.18); add(g, new T.BoxGeometry(2.9, 0.25, 0.9), L(0xf97316), x, 4.0, HD + 0.5); });
    [-2.6, 2.6].forEach(function (x, i) { try { var d = W.buildDroid({ body: i ? 'bb' : 'r2', color: i ? '#f97316' : '#2563eb', head: 'dome' }); d.position.set(x, 0.2, HD + 1.8); d.scale.setScalar(1.25); g.add(d); } catch (e) {} });
    /* inside: the conveyor along the back wall, shelves of droids at both ends, the build station in the middle */
    add(g, new T.BoxGeometry(13, 0.25, 1.3), L(0x1f2937), 0, 1.0, -4.6); [-0.7, 0.7].forEach(function (d) { add(g, new T.BoxGeometry(13, 0.3, 0.1), L(0x9aa3ad), 0, 1.1, -4.6 + d); }); [-5.5, 0, 5.5].forEach(function (x) { add(g, new T.BoxGeometry(0.4, 0.9, 1.1), L(0x4b5563), x, 0.55, -4.6); });
    var parts = []; for (var k = 0; k < 11; k++) { var pm = L(COLS[k % 6]), geo = k % 3 === 0 ? new T.CylinderGeometry(0.3, 0.3, 0.6, 14) : k % 3 === 1 ? new T.SphereGeometry(0.34, 14, 10) : new T.SphereGeometry(0.3, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2); parts.push(add(g, geo, pm, -6 + k * 1.18, 1.45, -4.6)); }
    [-1, 1].forEach(function (s) { for (var r = 0; r < 2; r++) { add(g, new T.BoxGeometry(0.9, 0.08, 7), L(0x6b5a44), s * 8.3, 1.0 + r * 1.5, -1); for (var n = 0; n < 4; n++) { try { var sd = W.buildDroid({ body: (n + r) % 2 ? 'bb' : 'r2', color: COLS[(n + r * 3 + (s > 0 ? 2 : 0)) % 6], head: n % 2 ? 'cone' : 'dome' }); sd.position.set(s * 8.3, 1.04 + r * 1.5, -3.6 + n * 1.75); sd.rotation.y = -s * Math.PI / 2; sd.scale.setScalar(0.85); g.add(sd); } catch (e) {} } } });
    add(g, new T.CylinderGeometry(1.4, 1.6, 0.4, 24), L(0x6b7280), 0, 0.4, -0.6); var ring = add(g, new T.TorusGeometry(1.4, 0.06, 8, 36), B(0x38bdf8), 0, 0.62, -0.6); ring.rotation.x = Math.PI / 2;
    /* the two assembly arms: a bolted base, a turret, an upper arm with its hydraulic ram, an elbow, a forearm, a wrist and a two-finger gripper with a welding tip */
    var hazard = new T.MeshLambertMaterial({ map: tex(64, 64, [1, 3], function (c, w, h) { c.fillStyle = '#f59e0b'; c.fillRect(0, 0, w, h); c.fillStyle = '#1f2937'; for (var i = -2; i < 4; i++) { c.beginPath(); c.moveTo(i * 32, 0); c.lineTo(i * 32 + 16, 0); c.lineTo(i * 32 + 48, h); c.lineTo(i * 32 + 32, h); c.fill(); } }) });
    var steel = L(0x9aa3ad), gun = L(0x374151), chrome = new T.MeshPhongMaterial({ color: 0xe5e7eb, shininess: 90 });
    var arms = [-1, 1].map(function (s) {
      var x = s * 1.9, z = -0.6;
      add(g, new T.CylinderGeometry(0.42, 0.48, 0.24, 16), gun, x, 0.32, z); for (var b2 = 0; b2 < 6; b2++) add(g, new T.CylinderGeometry(0.04, 0.04, 0.08, 6), chrome, x + Math.cos(b2 * 1.047) * 0.36, 0.46, z + Math.sin(b2 * 1.047) * 0.36);
      var turret = new T.Group(); turret.position.set(x, 0.44, z); g.add(turret);
      add(turret, new T.CylinderGeometry(0.24, 0.3, 0.5, 14), steel, 0, 0.25, 0); add(turret, new T.BoxGeometry(0.2, 0.14, 0.34), B(0x22c55e), 0, 0.3, 0.2);
      var shoulder = new T.Group(); shoulder.position.y = 0.55; turret.add(shoulder);
      var j1 = add(shoulder, new T.CylinderGeometry(0.2, 0.2, 0.42, 14), gun, 0, 0, 0); j1.rotation.x = Math.PI / 2;
      add(shoulder, new T.BoxGeometry(0.2, 1.4, 0.26), hazard, 0, 0.7, 0); add(shoulder, new T.CylinderGeometry(0.05, 0.05, 0.9, 8), chrome, s * 0.16, 0.6, 0); add(shoulder, new T.CylinderGeometry(0.07, 0.07, 0.4, 8), gun, s * 0.16, 0.25, 0);
      [0.3, 1.1].forEach(function (y) { [-0.14, 0.14].forEach(function (zz) { add(shoulder, new T.SphereGeometry(0.035, 6, 5), chrome, 0, y, zz); }); });
      var elbow = new T.Group(); elbow.position.y = 1.4; shoulder.add(elbow);
      var j2 = add(elbow, new T.CylinderGeometry(0.16, 0.16, 0.36, 14), gun, 0, 0, 0); j2.rotation.x = Math.PI / 2;
      add(elbow, new T.BoxGeometry(0.15, 1.05, 0.18), steel, 0, 0.55, 0); add(elbow, new T.BoxGeometry(0.17, 0.12, 0.2), B(0xf97316), 0, 0.3, 0); add(elbow, new T.CylinderGeometry(0.025, 0.025, 0.9, 6), L(0x111827), -s * 0.1, 0.5, 0.06);
      var wrist = new T.Group(); wrist.position.y = 1.08; elbow.add(wrist); add(wrist, new T.CylinderGeometry(0.09, 0.09, 0.14, 10), gun, 0, 0, 0);
      var fingers = [-1, 1].map(function (f) { var fg = new T.Group(); fg.position.set(0, 0.07, f * 0.07); wrist.add(fg); add(fg, new T.BoxGeometry(0.05, 0.3, 0.04), chrome, 0, 0.15, 0); add(fg, new T.BoxGeometry(0.05, 0.05, 0.08), chrome, 0, 0.3, -f * 0.03); return { g: fg, f: f }; });
      var tip = add(wrist, new T.SphereGeometry(0.07, 8, 6), B(0xfff7ae), 0, 0.42, 0);
      return { s: s, turret: turret, shoulder: shoulder, elbow: elbow, wrist: wrist, fingers: fingers, tip: tip };
    });
    try { var demo = W.buildDroid({ body: 'r2', color: '#dc2626', head: 'dome' }); demo.position.set(0, 0.6, -0.6); demo.scale.setScalar(1.2); g.add(demo); spin.push(demo); } catch (e) {}
    [-5, 0, 5].forEach(function (x) { add(g, new T.BoxGeometry(1.6, 0.1, 0.5), B(0xfff1c2), x, H - 0.1, 0); });
    sign(g, 'BUILD', '在这里组装', '#38bdf8', 3.6, 0, 3.9, -5.8);
    var lamp = new T.PointLight(0xffe2b0, 0.9, 16, 2); lamp.position.set(0, H - 0.8, 0); g.add(lamp);

    var list = API.getProps().interactables, reg = function (x, z, name, kind) { var e = { id: 'swb-' + kind, name: name, x: x, z: z }; Object.defineProperty(e, 'msg', { get: function () { setTimeout(function () { if (root.TPSWExperience) root.TPSWExperience.start(kind); else W.open(kind); }, 0); return name; } }); list.push(e); };
    reg(DEPOT.x, DEPOT.z + 1.6, '机器人工坊 · 造一个自己的机器人', 'droid');
    Object.assign(root.TPStarWarsBuildings, { depotGroup: g, parts: parts, demo: typeof demo === 'undefined' ? null : demo, ring: ring, HD: HD });
    /* a way straight to the two workshops: the button in the park's top bar, or ?goto=savi / ?goto=depot */
    var goTo = function (at, r) { if (at === SAVI) { if (root.TPSWSavi) root.TPSWSavi.go(); return; } var x = document.getElementById('tp-close-guide'); if (x) x.click(); API.teleport({ mode: 'walk', p: [at.x, API.groundY(at.x, at.z + r + 7, 62), at.z + r + 7], t: [at.x, 41.6, at.z] }); API.toast('🤖 机器人工坊就在前面：一直往前走，门会自己打开'); };
    root.TPStarWarsBuildings.goSavi = function () { goTo(SAVI, 0); }; root.TPStarWarsBuildings.goDepot = function () { goTo(DEPOT, HD); };
    var addBtn = function () { var row = document.getElementById('mn-pav-btns'); if (!row || document.getElementById('sw-go-btn')) return; [['sw-go-btn', '⚔️ 光剑工坊', SAVI, 0], ['sw-go-btn2', '🤖 机器人工坊', DEPOT, HD]].forEach(function (q) { var b = document.createElement('button'); b.type = 'button'; b.id = q[0]; b.textContent = q[1]; b.style.cssText = 'padding:5px 12px;border-radius:999px;border:none;background:linear-gradient(135deg,#0f172a,#4c1d95);color:#e0e7ff;font-weight:900;font-size:11.5px;cursor:pointer;box-shadow:0 2px 10px rgba(0,0,0,.35)'; b.onclick = function (e) { e.stopPropagation(); goTo(q[2], q[3]); }; row.appendChild(b); }); };
    addBtn(); new MutationObserver(addBtn).observe(document.body, { childList: true, subtree: true });
    var want = /[?&]goto=(savi|depot)/.exec(location.search); if (want) setTimeout(function () { goTo(want[1] === 'savi' ? SAVI : DEPOT, HD); }, 900);
    var last = performance.now();
    (function tick(now) {
      requestAnimationFrame(tick); var dt = Math.min(0.05, (now - last) / 1000); last = now; clock += dt; var P = API.player.pos;
      doors.forEach(function (d) { var open = Math.max(0, Math.min(1, (14 - Math.hypot(P.x - d.at.x, P.z - d.at.z)) / 4))   /* wide open well before the guest reaches them */, to = d.x0 + d.s * d.w * 0.96 * open; d.m.position.x += (to - d.m.position.x) * Math.min(1, dt * 5); });
      parts.forEach(function (p, i) { p.position.x += dt * 0.8; if (p.position.x > 6.4) p.position.x -= 12.98; p.rotation.y += dt * (i % 2 ? 1 : -0.7); });
      arms.forEach(function (a, i) { var w = Math.sin(clock * 0.9 + i * 2.2), weld = Math.sin(clock * 0.9 + i * 2.2 + 1.2) > 0.45;
        a.turret.rotation.y = w * 0.35; a.shoulder.rotation.z = a.s * (0.52 + w * 0.16); a.elbow.rotation.z = a.s * (0.95 + Math.sin(clock * 1.5 + i) * 0.22); a.wrist.rotation.y += dt * 2.4;
        var gp = 0.5 + 0.5 * Math.sin(clock * 3 + i); a.fingers.forEach(function (f) { f.g.rotation.x = f.f * gp * 0.35; }); a.tip.visible = weld && Math.sin(clock * 47 + i) > -0.2; a.tip.scale.setScalar(0.7 + Math.random() * 1.1); });
      spin.forEach(function (o, i) { o.rotation.y += dt * (i ? 0.8 : 0.5); });
    })(last);
  }
  function attach(api) { if (API || !api) return; API = api; T = api.THREE; var go = function () { if (!root.TPStarWarsWorkshops) return setTimeout(go, 200); try { build(); } catch (e) { if (root.console) console.warn('[sw buildings]', e); } }; go(); }
  if (root.TPParkAPI) attach(root.TPParkAPI); else root.addEventListener('tp:park-ready', function (e) { attach(e.detail || root.TPParkAPI); });
  root.TPStarWarsBuildings = { depot: DEPOT, savi: SAVI };
})(window);
