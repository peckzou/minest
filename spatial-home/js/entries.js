/* Minest · Spatial Home — the entry update (2026-11-12): Octo aquarium (replaces the fishing rod), magic quill → 3D Type (type3d/),
   Mochi on the desk → today's Liquid Routine card, a glass car key → Knowledge Drive (garage cut-scene), a medal box / medal
   board → Rings, a reading stand → Knowledge, a vintage car model → CarPlay (车载闪卡).
   Same contract as objects.js: { id, name, icon, feature, anchor, group, hit, label, focus, set(k), idle(t) } plus, where needed,
   focus2 (a second close-up before the cut), cine(ctx) (a short scene of its own) and card() (a card instead of a feature).
   Reuses what exists: the real Octo model (octopus-pet-raising-v6/models/*.glb, the one Pet Raising and the Aquarium load),
   Mochi's look from Liquid Routine (.mochi-fill / rim / eyes colours), the Routine's own store (liquid-routine.v1) and the
   Rings day record (minest.rewards.day.v1). Nothing here writes to them. */
(function (root) {
  'use strict';
  var THREE = root.THREE, SV = root.SpatialVoxel, VB = SV.VB, MAT = SV.MAT;
  function ease(k) { return k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; }
  function seg(k, a, b) { return Math.max(0, Math.min(1, (k - a) / (b - a))); }
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function hitBox(g, x0, y0, z0, x1, y1, z1) {
    var m = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), new THREE.MeshBasicMaterial({ visible: false }));
    m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); g.add(m); return m;
  }
  function glass(color, opacity) { return new THREE.MeshPhongMaterial({ color: color, transparent: true, opacity: opacity, shininess: 140, specular: 0xffffff, depthWrite: false }); }
  function lsGet(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } }
  /* a page asset: next to the Minest page (embedded), one folder up (standalone), or the app's own resolver (iOS) */
  function asset(p) { if (root.minestPetAsset) { try { return root.minestPetAsset(p); } catch (e) {} } return (root.__SPATIAL_HOME_EMBEDDED__ ? '' : '../') + p; }

  /* ================================================================ Octo aquarium (Pet Raising) */
  function aquarium() {
    var g = new THREE.Group(), v = new VB(1101), i;
    var X = 0.42, Z = 0.21, Y0 = 0.62, Y1 = 1.14;            // tank half width / half depth, bottom, top
    /* a blue-and-white Santorini stand with brass feet, a cabinet door at the front */
    v.box(-X - 0.03, 0, -Z - 0.03, X + 0.03, 0.06, Z + 0.03, 'woodDark');
    v.box(-X, 0.06, -Z, X, Y0 - 0.04, Z, 'plaster', 0.03);
    v.box(-X - 0.03, Y0 - 0.04, -Z - 0.03, X + 0.03, Y0, Z + 0.03, 'woodLight', 0.03);
    v.box(-X + 0.04, 0.1, Z, -0.01, Y0 - 0.08, Z + 0.012, 'blue', 0.03); v.box(0.01, 0.1, Z, X - 0.04, Y0 - 0.08, Z + 0.012, 'blue', 0.03);
    v.box(-0.05, 0.3, Z + 0.012, -0.03, 0.36, Z + 0.024, 'brass'); v.box(0.03, 0.3, Z + 0.012, 0.05, 0.36, Z + 0.024, 'brass');
    /* frame: dark metal edges, a lid with a light strip */
    [[-X, -Z], [X - 0.02, -Z], [-X, Z - 0.02], [X - 0.02, Z - 0.02]].forEach(function (p) { v.box(p[0], Y0, p[1], p[0] + 0.02, Y1, p[1] + 0.02, 'dark'); });
    v.box(-X, Y0, -Z, X, Y0 + 0.02, Z, 'dark'); v.box(-X - 0.01, Y1, -Z - 0.01, X + 0.01, Y1 + 0.035, Z + 0.01, 'dark');
    /* sand, rocks, a little arch, kelp */
    v.box(-X + 0.02, Y0 + 0.02, -Z + 0.02, X - 0.02, Y0 + 0.06, Z - 0.02, 'straw', 0.12);
    for (i = 0; i < 26; i++) v.cb(-X + 0.05 + v.r() * (2 * X - 0.1), Y0 + 0.06, -Z + 0.04 + v.r() * (2 * Z - 0.08), 0.02, 0.008, 0.02, v.r() < 0.5 ? 'cream' : 'stone');
    v.cb(-0.26, Y0 + 0.06, -0.08, 0.12, 0.07, 0.1, 'stone2', 0.1); v.cb(-0.24, Y0 + 0.13, -0.08, 0.07, 0.05, 0.07, 'grout', 0.1);
    v.box(0.18, Y0 + 0.06, -0.12, 0.21, Y0 + 0.18, -0.09, 'stone'); v.box(0.31, Y0 + 0.06, -0.12, 0.34, Y0 + 0.18, -0.09, 'stone'); v.box(0.18, Y0 + 0.18, -0.12, 0.34, Y0 + 0.21, -0.09, 'stone');
    v.cb(0.05, Y0 + 0.06, 0.1, 0.06, 0.03, 0.05, 'coral', 0.1); v.cb(0.07, Y0 + 0.09, 0.1, 0.03, 0.03, 0.03, 'pink2');
    g.add(v.mesh());
    var kelp = [];
    [[-0.34, 0.08], [-0.12, -0.14], [0.36, 0.1], [0.26, -0.15]].forEach(function (p, j) {
      var kg = new THREE.Group(); kg.position.set(p[0], Y0 + 0.06, p[1]); g.add(kg);
      var kv = new VB(1110 + j), h = 0.22 + (j % 2) * 0.12;
      for (var y = 0; y < h; y += 0.04) kv.box(-0.008 + Math.sin(y * 18 + j) * 0.012, y, -0.008, 0.008 + Math.sin(y * 18 + j) * 0.012, y + 0.04, 0.008, j % 2 ? 'leaf' : 'leaf2');
      kg.add(kv.mesh()); kelp.push(kg);
    });
    /* water and glass */
    var water = new THREE.Mesh(new THREE.BoxGeometry(2 * X - 0.03, Y1 - Y0 - 0.07, 2 * Z - 0.03), glass(0x5fb4ea, 0.2));
    water.position.y = (Y0 + Y1 - 0.05) / 2 + 0.005; g.add(water);
    var surf = new THREE.Mesh(new THREE.PlaneGeometry(2 * X - 0.03, 2 * Z - 0.03), new THREE.MeshBasicMaterial({ color: 0x9fe0ff, transparent: true, opacity: 0.35, depthWrite: false, side: THREE.DoubleSide }));
    surf.rotation.x = -Math.PI / 2; surf.position.y = Y1 - 0.04; g.add(surf);
    var pane = new THREE.Mesh(new THREE.BoxGeometry(2 * X, Y1 - Y0, 2 * Z), glass(0xe6f7ff, 0.1)); pane.position.y = (Y0 + Y1) / 2; g.add(pane);
    var lv = new VB(1102); lv.box(-X + 0.04, Y1 - 0.002, -0.02, X - 0.04, Y1, 0.02, '#e9fbff');
    var lamp = lv.mesh(MAT.glow(0.9), true); g.add(lamp);
    var light = new THREE.PointLight(0x8fdcff, 0.25, 1.6, 2); light.position.set(0, Y1 - 0.06, 0); g.add(light);
    /* bubbles from the rock */
    var bubbles = [], bm = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55, depthWrite: false });
    for (i = 0; i < 9; i++) { var b = new THREE.Mesh(new THREE.SphereGeometry(0.008 + (i % 3) * 0.003, 8, 6), bm); b.userData.ph = i / 9; g.add(b); bubbles.push(b); }
    /* Octo: the real model when it loads, a voxel stand-in until then (or if it cannot) */
    var octo = new THREE.Group(); octo.position.set(0, Y0 + 0.25, 0); g.add(octo);
    var stand = new THREE.Group(), sv = new VB(1103);
    sv.box(-0.05, 0.02, -0.045, 0.05, 0.1, 0.045, 'octo', 0.04); sv.box(-0.04, 0.1, -0.035, 0.04, 0.118, 0.035, 'octo');
    sv.box(-0.032, 0.048, 0.045, -0.014, 0.072, 0.051, 'ink'); sv.box(0.014, 0.048, 0.045, 0.032, 0.072, 0.051, 'ink');
    sv.box(-0.028, 0.062, 0.051, -0.022, 0.068, 0.053, 'paper'); sv.box(0.018, 0.062, 0.051, 0.024, 0.068, 0.053, 'paper');
    stand.add(sv.mesh());
    var arms = [];
    for (i = 0; i < 6; i++) {
      var a = i / 6 * Math.PI * 2, arm = new THREE.Group(); arm.position.set(Math.cos(a) * 0.035, 0.03, Math.sin(a) * 0.03); arm.rotation.y = -a;
      var av = new VB(1120 + i); av.box(0, -0.006, -0.007, 0.03, 0.006, 0.007, 'octo'); av.box(0.028, -0.005, -0.006, 0.055, 0.005, 0.006, 'octo');
      arm.add(av.mesh(null, true)); stand.add(arm); arms.push(arm);
    }
    stand.position.y = -0.06; octo.add(stand);
    var mixer = null, model = null, clips = {};
    function loadModel() {
      if (!THREE.GLTFLoader) return;
      var urls = [asset('octopus-pet-raising-v6/models/avatar_web_rigged_v23j.glb'), asset('octopus-pet-raising-v6/models/avatar_web_rigged_v23.glb')];
      (function next(j) {
        if (j >= urls.length) return;
        new THREE.GLTFLoader().load(urls[j], function (gl) {
          model = gl.scene; var box = new THREE.Box3().setFromObject(model), size = box.getSize(new THREE.Vector3()), c = box.getCenter(new THREE.Vector3());
          var s = 0.17 / Math.max(size.x, size.y, size.z, 1e-3); model.scale.setScalar(s); model.position.set(-c.x * s, -c.y * s, -c.z * s);
          model.traverse(function (m) { if (m.isMesh) { m.castShadow = false; m.frustumCulled = false; } });
          var holder = new THREE.Group(); holder.add(model); octo.add(holder); stand.visible = false;
          try { if (root.MinestCosmetics && root.MinestCosmetics.watchModel) root.MinestCosmetics.watchModel(model, THREE); } catch (e) {}
          mixer = new THREE.AnimationMixer(model); (gl.animations || []).forEach(function (cl) { clips[cl.name] = cl; });
          var pickClip = clips.swim || clips.idle || gl.animations[0]; if (pickClip) mixer.clipAction(pickClip).play();
        }, undefined, function () { next(j + 1); });
      })(0);
    }
    /* swimming: a slow wander inside the glass, turning to where it goes */
    var at = new THREE.Vector3(0, Y0 + 0.25, 0), goal = new THREE.Vector3(), heading = 0, kk = 0, last = 0, wait = 0;
    function newGoal() { goal.set((Math.random() * 2 - 1) * (X - 0.12), Y0 + 0.14 + Math.random() * (Y1 - Y0 - 0.3), (Math.random() * 2 - 1) * (Z - 0.1)); }
    newGoal();
    var o = {
      id: 'aquarium', name: 'Octo 水族缸', en: 'Octo aquarium', icon: '🐙', feature: 'pet', anchor: 'corner.window', group: g,
      hit: hitBox(g, -X - 0.03, 0, -Z - 0.03, X + 0.03, Y1 + 0.04, Z + 0.03), label: [0, Y1 + 0.16, 0],
      focus: { pos: [2.1, 1.12, -1.15], look: [2.36, 0.88, -2.06] },
      set: function (k) {
        kk = k; light.intensity = 0.25 + 0.5 * ease(k); lamp.material.opacity = 0.9;
        if (k > 0) { var e = ease(seg(k, 0, 0.6)); octo.position.lerp(new THREE.Vector3(0, Y0 + 0.24, Z - 0.09), e * 0.35); }
      },
      idle: function (t) {
        var dt = clamp(t - last, 0, 0.1); last = t;
        if (mixer) mixer.update(dt);
        kelp.forEach(function (kg, j) { kg.rotation.z = Math.sin(t * 1.1 + j) * 0.12; kg.rotation.x = Math.sin(t * 0.8 + j * 2) * 0.06; });
        bubbles.forEach(function (b) { var p = (t * 0.22 + b.userData.ph) % 1; b.position.set(-0.24 + Math.sin(p * 9 + b.userData.ph * 6) * 0.015, Y0 + 0.18 + p * (Y1 - Y0 - 0.26), -0.08 + Math.cos(p * 7) * 0.01); b.visible = p < 0.97; });
        surf.position.y = Y1 - 0.04 + Math.sin(t * 1.6) * 0.002;
        if (kk > 0.02) { octo.rotation.y += (0 - octo.rotation.y) * Math.min(1, dt * 4); octo.position.y += Math.sin(t * 6) * 0.0008; }
        else {
          if (wait > 0) wait -= dt;
          else {
            var d = goal.clone().sub(at), l = d.length();
            if (l < 0.03) { newGoal(); wait = 0.6 + Math.random() * 1.6; }
            else { d.multiplyScalar(Math.min(l, dt * 0.07) / l); at.add(d); var want = Math.atan2(d.x, d.z); var dd = ((want - heading + Math.PI * 3) % (Math.PI * 2)) - Math.PI; heading += dd * Math.min(1, dt * 2.2); }
          }
          octo.position.set(at.x, at.y + Math.sin(t * 1.7) * 0.012, at.z); octo.rotation.y = heading; octo.rotation.z = Math.sin(t * 1.3) * 0.08;
        }
        if (!mixer) { var pulse = Math.sin(t * 3.2); arms.forEach(function (arm, j) { arm.rotation.z = -0.35 - 0.3 * pulse + Math.sin(t * 2 + j) * 0.12; }); stand.scale.set(1 + 0.04 * pulse, 1 - 0.05 * pulse, 1 + 0.04 * pulse); }
      },
      afterBuild: function () { setTimeout(loadModel, 1200); }
    };
    return o;
  }

  /* ================================================================ magic quill (3D Type) */
  function quill() {
    var g = new THREE.Group(), v = new VB(1201), i;
    /* a walnut base, a brass holder ring, an inkwell */
    v.cb(0, 0, 0, 0.2, 0.025, 0.12, 'woodDark', 0.03); v.cb(0, 0.025, 0, 0.18, 0.006, 0.1, 'brass');
    v.cb(0.05, 0.031, 0, 0.07, 0.05, 0.07, 'ink'); v.cb(0.05, 0.081, 0, 0.04, 0.012, 0.04, 'brass'); v.cb(0.05, 0.093, 0, 0.026, 0.004, 0.026, '#151a2c');
    v.cb(-0.05, 0.031, 0, 0.03, 0.02, 0.03, 'brass'); v.cb(-0.05, 0.051, 0, 0.012, 0.05, 0.012, 'brass'); v.cb(-0.05, 0.1, 0, 0.034, 0.008, 0.034, 'brass');
    g.add(v.mesh());
    /* the quill itself, pivoting at its nib */
    var q = new THREE.Group(); q.position.set(-0.05, 0.06, 0); g.add(q);
    var qv = new VB(1202);
    qv.box(-0.003, 0, -0.003, 0.003, 0.03, 0.003, 'gold'); qv.box(-0.002, -0.012, -0.002, 0.002, 0.0, 0.002, 'ink');
    for (i = 0; i < 12; i++) {
      var y = 0.03 + i * 0.018, w = 0.006 + Math.sin(i / 11 * Math.PI) * 0.028;
      qv.box(-0.0025, y, -0.0025, 0.0025, y + 0.018, 0.0025, 'paper');
      qv.box(0.0025, y + 0.002, -0.0015, 0.0025 + w, y + 0.016, 0.0015, i > 9 ? 'blueSoft' : (i % 3 ? 'paper' : 'cream'));
      qv.box(-0.0025 - w * 0.7, y + 0.004, -0.0015, -0.0025, y + 0.016, 0.0015, i > 9 ? 'blue' : 'plaster2');
    }
    var qm = qv.mesh(); q.add(qm); q.rotation.set(0.0, 0.4, 0.22);
    /* the glowing words it writes in the air */
    var cv = document.createElement('canvas'); cv.width = 512; cv.height = 128; var cx = cv.getContext('2d');
    var tex = new THREE.CanvasTexture(cv); tex.encoding = THREE.sRGBEncoding;
    var ink = new THREE.Mesh(new THREE.PlaneGeometry(0.44, 0.11), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, depthTest: false, fog: false }));
    ink.renderOrder = 5; ink.position.set(0.1, 0.25, 0.2); ink.visible = false; g.add(ink);
    var spark = new THREE.PointLight(0xffd98a, 0, 0.8, 2); g.add(spark);
    var drawn = -1;
    function draw(p) {
      var key = Math.round(p * 60); if (key === drawn) return; drawn = key;
      cx.clearRect(0, 0, 512, 128); if (p <= 0) { tex.needsUpdate = true; return; }
      cx.save(); cx.beginPath(); cx.rect(0, 0, 18 + p * 480, 128); cx.clip();
      cx.font = 'italic 600 64px "Snell Roundhand", "Apple Chancery", "Brush Script MT", Georgia, serif'; cx.textAlign = 'center'; cx.textBaseline = 'middle';
      cx.shadowColor = 'rgba(214,120,20,.9)'; cx.shadowBlur = 24; cx.lineWidth = 7; cx.strokeStyle = 'rgba(120,60,10,.55)'; cx.strokeText('3D Type', 256, 66);
      cx.fillStyle = '#ffd25e'; cx.fillText('3D Type', 256, 66); cx.shadowBlur = 0; cx.fillStyle = '#fff6d8'; cx.fillText('3D Type', 256, 63);
      cx.restore(); tex.needsUpdate = true;
    }
    return {
      id: 'quill', name: '羽毛笔', en: 'Magic quill', icon: '🪶', feature: 'type3d', anchor: 'desk.quill', group: g,
      hit: hitBox(g, -0.11, 0, -0.07, 0.11, 0.3, 0.07), label: [0, 0.34, 0],
      focus: { pos: [-0.62, 1.16, -1.12], look: [-0.74, 0.98, -1.7] },
      set: function (k) {
        var up = ease(seg(k, 0, 0.3)), w = seg(k, 0.25, 0.95);
        q.position.set(-0.05 + 0.27 * w * up - 0.2 * up * (1 - w) * 0, 0.06 + 0.26 * up + Math.sin(w * Math.PI * 7) * 0.012 * (w > 0 && w < 1 ? 1 : 0), 0.06 * up);
        q.position.x = -0.05 + up * (-0.07 + 0.36 * w); q.position.y = 0.06 + 0.17 * up + Math.sin(w * Math.PI * 7) * 0.012 * (w > 0 && w < 1 ? 1 : 0); q.position.z = 0.2 * up;
        q.rotation.set(-0.35 * up, 0.4 * (1 - up), 0.22 + up * 0.35 + Math.sin(w * Math.PI * 9) * 0.08 * (w > 0 && w < 1 ? 1 : 0));
        ink.visible = k > 0.25; draw(w);
        spark.position.set(q.position.x, q.position.y + 0.01, q.position.z); spark.intensity = (w > 0 && w < 1) ? 0.6 : 0.15 * up;
        ink.material.opacity = 1 - seg(k, 0.97, 1) * 0.3;
      },
      idle: function (t) { if (!ink.visible) { q.rotation.z = 0.22 + Math.sin(t * 0.7) * 0.01; } }
    };
  }

  /* ================================================================ Mochi (today's Liquid Routine card) */
  /* the Routine's own record: liquid-routine.v1 → { tasks: [{ id, title, start (min), duration, repeat, date, days }], runs: { 'date/id': { status } } } */
  function routineData() {
    var d = lsGet('liquid-routine.v1');
    if (!d || !d.tasks) { var env = lsGet('liquid-routine.envelope.v2'); if (env) { var inner = env.data || env.routine || env.payload || env.value; if (typeof inner === 'string') { try { inner = JSON.parse(inner); } catch (e) { inner = null; } } if (inner && inner.tasks) d = inner; } }
    return d && Array.isArray(d.tasks) ? d : null;
  }
  function today() { var n = new Date(); return n.getFullYear() + '-' + String(n.getMonth() + 1).padStart(2, '0') + '-' + String(n.getDate()).padStart(2, '0'); }
  function hm(m) { m = Math.round(m); return String(Math.floor(m / 60) % 24).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); }
  function routineCard() {
    var d = routineData();
    if (!d) return { title: '🫧 Mochi', text: '这台设备上还没有保存过 Liquid Routine 的日程。打开日程本可以开始安排今天。' };
    var day = today(), wd = new Date(day + 'T12:00:00').getDay(), now = new Date(), min = now.getHours() * 60 + now.getMinutes();
    var list = d.tasks.filter(function (t) { if (!t || !isFinite(t.start)) return false; if (t.repeat === false && t.date && t.date !== day) return false; if (t.days && t.days.length && t.days.indexOf(wd) < 0) return false; return true; })
      .sort(function (a, b) { return a.start - b.start; });
    if (!list.length) return { title: '🫧 Mochi', text: '今天没有安排任务。' };
    function st(t) { var r = d.runs && d.runs[day + '/' + t.id]; return r ? r.status : 'planned'; }
    var cur = list.filter(function (t) { return t.start <= min && min < t.start + (t.duration || 0) && st(t) !== 'completed' && st(t) !== 'skipped'; })[0]
      || list.filter(function (t) { return st(t) === 'running'; })[0];
    var next = list.filter(function (t) { return t.start > min && st(t) !== 'completed' && st(t) !== 'skipped'; })[0];
    var done = list.filter(function (t) { return st(t) === 'completed'; }).length;
    var L = { planned: '未开始', running: '进行中', paused: '已暂停', completed: '已完成', skipped: '已跳过' };
    function line(t) { return '<b>' + esc(t.title) + '</b><br><span style="opacity:.7">' + hm(t.start) + '–' + hm(t.start + (t.duration || 0)) + ' · ' + (L[st(t)] || st(t)) + '</span>'; }
    var html = cur ? '现在：' + line(cur) : '现在没有进行中的任务。';
    if (next) html += '<br><br>接下来：' + line(next);
    html += '<br><br><span style="opacity:.7">今天 ' + done + ' / ' + list.length + ' 项已完成</span>';
    return { title: '🫧 Mochi · 今天的日程', text: html };
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function mochi() {
    var g = new THREE.Group(), R = 0.05;
    var body = new THREE.Group(); g.add(body);
    var blob = new THREE.Group(); body.add(blob);
    /* Liquid Routine's Mochi: milky glass (#ffffffd1 over a #cfe9fa → #a8d3f1 fill), a pale blue rim, a highlight, navy eyes with catchlights */
    var fill = new THREE.Mesh(new THREE.SphereGeometry(R, 28, 20), new THREE.MeshPhongMaterial({ color: 0xe4f3fd, emissive: 0x9fcff0, emissiveIntensity: 0.18, shininess: 110, specular: 0xffffff, transparent: true, opacity: 0.92 }));
    var rim = new THREE.Mesh(new THREE.SphereGeometry(R * 1.06, 28, 20), new THREE.MeshBasicMaterial({ color: 0x96d7ff, transparent: true, opacity: 0.35, side: THREE.BackSide, depthWrite: false }));
    var hi = new THREE.Mesh(new THREE.SphereGeometry(R * 0.32, 14, 10), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 }));
    hi.scale.set(1.2, 0.55, 0.4); hi.position.set(-R * 0.42, R * 0.55, R * 0.62);
    blob.add(fill); blob.add(rim); blob.add(hi);
    var eyes = [], eyeM = new THREE.MeshBasicMaterial({ color: 0x12325a }), catchM = new THREE.MeshBasicMaterial({ color: 0xffffff });
    [-1, 1].forEach(function (s) {
      var e = new THREE.Group(); e.position.set(s * R * 0.34, R * 0.12, R * 0.9);
      var ball = new THREE.Mesh(new THREE.SphereGeometry(R * 0.14, 12, 10), eyeM); ball.scale.set(0.85, 1.25, 0.5); e.add(ball);
      var c = new THREE.Mesh(new THREE.SphereGeometry(R * 0.045, 8, 6), catchM); c.position.set(-R * 0.035, R * 0.07, R * 0.06); e.add(c);
      blob.add(e); eyes.push(e);
    });
    var shadow = new THREE.Mesh(new THREE.CircleGeometry(R * 0.9, 20), new THREE.MeshBasicMaterial({ color: 0x1d2b4f, transparent: true, opacity: 0.16, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.002; g.add(shadow);
    var hit = hitBox(body, -R * 1.2, -R, -R * 1.2, R * 1.2, R * 1.3, R * 1.2);
    blob.position.y = R;
    /* a small life on the desk: walk, hop, rest — inside its corner (local box), never over the planner */
    var AREA = { x0: -0.08, x1: 0.13, z0: -0.25, z1: 0.12 }, pos = new THREE.Vector2(0, 0), tgt = new THREE.Vector2(), face = 0;
    var state = 'rest', left = 1.5, ph = 0, last = 0, kk = 0, hopY = 0;
    function pick() {
      var r = Math.random();
      if (r < 0.5) { state = 'walk'; tgt.set(AREA.x0 + Math.random() * (AREA.x1 - AREA.x0), AREA.z0 + Math.random() * (AREA.z1 - AREA.z0)); left = 6; }
      else if (r < 0.75) { state = 'hop'; left = 0.55; ph = 0; }
      else { state = 'rest'; left = 2.5 + Math.random() * 3; }
    }
    return {
      id: 'mochi', name: 'Mochi', en: 'Mochi', icon: '🫧', feature: 'routine', anchor: 'desk.mochi', group: g,
      hit: hit, label: [0, 0.2, 0], follow: body,
      focus: { pos: [0.78, 1.12, -1.22], look: [0.84, 0.82, -1.78] },
      card: routineCard,
      set: function (k) { kk = k; var e = Math.sin(seg(k, 0, 1) * Math.PI); hopY = e * 0.07; },
      idle: function (t) {
        var dt = clamp(t - last, 0, 0.1); last = t; var sx = 1, sy = 1, y = 0;
        if (kk > 0) { state = 'rest'; left = 2; face += (0 - face) * Math.min(1, dt * 6); y = hopY; sy = 1 + hopY * 1.5; sx = 1 - hopY * 0.8; }
        else if (state === 'walk') {
          var d = tgt.clone().sub(pos), l = d.length();
          if (l < 0.01 || (left -= dt) < 0) pick();
          else { d.multiplyScalar(Math.min(l, dt * 0.05) / l); pos.add(d); var want = Math.atan2(d.x, d.y); face += (((want - face + Math.PI * 3) % (Math.PI * 2)) - Math.PI) * Math.min(1, dt * 5); }
          var b = Math.abs(Math.sin(t * 9)); y = b * 0.012; sy = 1 + (b - 0.5) * 0.12; sx = 1 - (b - 0.5) * 0.08;
        } else if (state === 'hop') {
          ph += dt / 0.55; var h = Math.sin(clamp(ph, 0, 1) * Math.PI); y = h * 0.06; sy = ph < 0.15 ? 0.8 : 1 + h * 0.15; sx = ph < 0.15 ? 1.15 : 1 - h * 0.08;
          if (ph >= 1) pick();
        } else {
          var br = Math.sin(t * 1.6); sy = 0.86 + br * 0.03; sx = 1.08 - br * 0.02;
          if ((left -= dt) < 0) pick();
        }
        body.position.set(pos.x, y, pos.y); body.rotation.y = face; blob.scale.set(sx, sy, sx); blob.position.y = R * sy;
        var sleepy = state === 'rest' && kk === 0 && left > 1.2;
        var blink = (t % 3.7) < 0.12 || sleepy;
        eyes.forEach(function (e) { e.scale.y = blink ? 0.15 : 1; });
        shadow.position.set(pos.x, 0.002, pos.y); shadow.scale.setScalar(1 - y * 4);
      }
    };
  }

  /* ================================================================ glass car key (Knowledge Drive) — original design */
  function carKey() {
    var g = new THREE.Group(), lift = new THREE.Group(); g.add(lift);
    /* a slim lozenge of smoked glass on a brushed aluminium spine, a warm light line inside, three touch dots */
    var gv = new VB(1301), i;
    for (i = 0; i < 9; i++) { var x = -0.06 + i * 0.015, w = 0.022 - Math.pow((i - 4) / 4, 2) * 0.008; gv.box(x, 0.006, -w, x + 0.015, 0.02, w, '#2a3442'); }
    var gm = gv.mesh(new THREE.MeshPhongMaterial({ vertexColors: true, transparent: true, opacity: 0.62, shininess: 160, specular: 0xffffff }), true); lift.add(gm);
    var av = new VB(1302); av.box(-0.066, 0, -0.024, 0.07, 0.006, 0.024, 'metal'); av.box(0.07, 0.002, -0.006, 0.09, 0.008, 0.006, 'metal'); av.cb(0.098, 0.0, 0, 0.022, 0.006, 0.022, 'metal');
    lift.add(av.mesh());
    var lv = new VB(1303); lv.box(-0.05, 0.012, -0.0025, 0.05, 0.016, 0.0025, '#ffd36b');
    [-0.03, 0, 0.03].forEach(function (x) { lv.box(x - 0.004, 0.02, 0.008, x + 0.004, 0.0215, 0.016, '#fff4d8'); });
    var glowM = lv.mesh(MAT.glow(0.85), true); lift.add(glowM);
    var flash = new THREE.PointLight(0xffc560, 0, 0.9, 2); flash.position.y = 0.05; lift.add(flash);
    lift.rotation.y = 0.15;
    var o = {
      id: 'carkey', name: '车钥匙', en: 'Car key', icon: '🔑', feature: 'drive', anchor: 'desk.key', group: g,
      hit: hitBox(g, -0.09, 0, -0.04, 0.13, 0.05, 0.04), label: [0, 0.12, 0],
      focus: { pos: [0.12, 1.08, -1.25], look: [0.1, 0.8, -1.7] },
      /* 拿起钥匙: it rises and turns to you · 车辆解锁: two pulses */
      set: function (k) {
        var up = ease(seg(k, 0, 0.45)); lift.position.set(0, up * 0.16, up * 0.08); lift.rotation.set(up * 1.1, 0.15 - up * 0.15, 0);
        var p = seg(k, 0.5, 1), pulse = p > 0 && p < 1 ? Math.max(0, Math.sin(p * Math.PI * 4)) : 0;
        flash.intensity = pulse * 1.2; glowM.material.opacity = 0.6 + 0.4 * pulse;
      },
      idle: function (t) { if (!flash.intensity) glowM.material.opacity = 0.62 + 0.12 * Math.sin(t * 1.4); },
      cine: garageCine
    };
    return o;
  }
  /* ----- the garage cut-scene: 起身 → Garage 门开启 → 走向车辆 → 上车. Built when first needed, its own scene. */
  var GARS = {};
  /* train: the same garage becomes the express's car-carrier wagon — ribbed steel, and the mountains running past the open door */
  function garageScene(train) {
    var key = train ? 'train' : 'home'; if (GARS[key]) return GARS[key];
    var s = new THREE.Scene(); s.background = new THREE.Color(0x0e1218); s.fog = new THREE.Fog(0x0e1218, 8, 30);
    var v = new VB(1401), i, W = 2.6, D = 4.2, H = 2.6;
    v.box(-W, -0.05, -D, W, 0, D, '#3a3f47', 0.04);
    for (i = -W; i < W; i += 0.5) v.box(i, 0, -D, i + 0.02, 0.002, D, '#4a5058');
    var WALL = train ? '#5d636b' : '#d9d4ca', ROOF = train ? '#4e545b' : '#cfcac0';
    v.box(-W - 0.2, 0, -D, -W, H, D, WALL); v.box(W, 0, -D, W + 0.2, H, D, WALL); v.box(-W, 0, D, W, H, D + 0.2, WALL);
    v.box(-W, H, -D, W, H + 0.2, D, ROOF);
    v.box(-W, 0, -D - 0.2, -1.6, H, -D, WALL); v.box(1.6, 0, -D - 0.2, W, H, -D, WALL); v.box(-1.6, 2.2, -D - 0.2, 1.6, H, -D, WALL);
    if (train) for (i = -D; i < D; i += 0.6) { v.box(-W, 0.3, i, -W + 0.06, H - 0.1, i + 0.08, '#71777f'); v.box(W - 0.06, 0.3, i, W, H - 0.1, i + 0.08, '#71777f'); v.box(-W, H - 0.08, i, W, H, i + 0.08, '#71777f'); }
    v.box(-W + 0.05, 0.9, 1.0, -W + 0.12, 1.6, 2.6, 'woodDark'); for (i = 0; i < 5; i++) v.box(-W + 0.12, 0.95 + i * 0.13, 1.05 + (i % 2) * 0.2, -W + 0.2, 1.0 + i * 0.13, 1.4 + (i % 2) * 0.2, i % 2 ? 'metal' : 'brass');
    v.box(W - 0.5, 0, 1.6, W, 0.9, 3.2, '#c8302c', 0.04); v.box(W - 0.52, 0.9, 1.6, W, 0.95, 3.2, 'metal');
    s.add(v.mesh());
    /* outside the door: the caldera in afternoon light */
    var runner = null;
    if (!train) {
      var ov = new VB(1402); ov.box(-30, -0.06, -40, 30, -0.05, -D - 0.2, '#d8d0c0'); ov.box(-30, -2, -60, 30, -1.5, -14, 'sea');
      for (i = 0; i < 14; i++) ov.cb(-12 + i * 1.9, -0.05, -16 - (i % 3) * 2, 1.2, 0.8 + (i % 4) * 0.4, 1.1, i % 5 === 0 ? 'blue' : 'plaster');
      s.add(ov.mesh());
    } else {
      /* the open door looks out sideways from the moving wagon: pines and a peak slide past (the ground is the track bed) */
      var tv = new VB(1403); tv.box(-80, -1.2, -40, 80, -1.1, -D - 0.2, '#5b8a46');
      for (i = 0; i < 40; i++) { var px = -80 + i * 4 + (i * 37 % 3), pz = -8 - (i * 53 % 14), ps = 2 + (i % 4); tv.box(px - 0.2, -1.1, pz - 0.2, px + 0.2, -1.1 + ps * 0.3, pz + 0.2, '#5b3f2a'); for (var q = 0; q < 3; q++) tv.box(px - ps * (0.35 - q * 0.09), -1.1 + ps * (0.25 + q * 0.27), pz - ps * (0.35 - q * 0.09), px + ps * (0.35 - q * 0.09), -1.1 + ps * (0.5 + q * 0.27), pz + ps * (0.35 - q * 0.09), q % 2 ? '#2a5030' : '#24472b'); }
      runner = tv.mesh(null, true); s.add(runner);
      var pk = new VB(1404); pk.box(-40, -2, -60, 40, 6, -50, '#6f8a63'); pk.box(-20, 6, -60, 25, 16, -52, '#8a8d90'); pk.box(-10, 16, -58, 12, 24, -53, '#eef2f6'); s.add(pk.mesh(null, true));
      runner.onBeforeRender = function () { runner.position.x = -((performance.now() / 1000 * 17) % 12); };   // 17 m/s, the same as the express
    }
    var sky = new THREE.Mesh(new THREE.PlaneGeometry(120, 40), new THREE.MeshBasicMaterial({ color: 0xbfe2ff, fog: false })); sky.position.set(0, 10, -58); s.add(sky);
    /* roll-up door: slats that wind up */
    var door = new THREE.Group(); s.add(door); var slats = [];
    for (i = 0; i < 11; i++) { var dv = new VB(1410 + i); dv.box(-1.6, 0, -0.03, 1.6, 0.2, 0.03, i % 2 ? '#e6e2da' : '#dcd7cd'); var m = dv.mesh(); m.position.set(0, i * 0.2, -D - 0.1); door.add(m); slats.push(m); }
    /* the car: a low grand tourer, original lines, yellow light signature */
    var car = new THREE.Group(); car.position.set(0, 0, -0.4); s.add(car);
    var cv = new VB(1420), BODY = '#f2c13d', BODY2 = '#e0ab25', GL = '#24303d', k;
    /* body: low and wide, a long nose that steps down, haunches over the rear wheels */
    cv.box(-0.88, 0.2, -1.9, 0.88, 0.5, 2.05, BODY, 0.02);
    for (k = 0; k < 4; k++) cv.box(-0.86 + k * 0.03, 0.2, -2.25 + k * 0.09, 0.86 - k * 0.03, 0.42 - k * 0.04 + 0.04, -1.9, BODY);
    cv.box(-0.92, 0.42, 0.9, 0.92, 0.58, 1.95, BODY); cv.box(-0.8, 0.58, 1.2, 0.8, 0.62, 2.0, BODY2);
    cv.box(-0.82, 0.5, -1.85, 0.82, 0.55, -0.75, BODY2);
    /* glass canopy: windscreen steps, roof, rear glass */
    for (k = 0; k < 4; k++) cv.box(-0.74 + k * 0.03, 0.5 + k * 0.09, -0.75 + k * 0.12, 0.74 - k * 0.03, 0.59 + k * 0.09, -0.6 + k * 0.12, GL);
    cv.box(-0.64, 0.86, -0.3, 0.64, 0.92, 0.6, GL); cv.box(-0.7, 0.55, -0.4, 0.7, 0.86, 0.95, GL);
    for (k = 0; k < 3; k++) cv.box(-0.66 + k * 0.04, 0.58, 0.95 + k * 0.1, 0.66 - k * 0.04, 0.86 - k * 0.1, 1.05 + k * 0.1, GL);
    cv.box(-0.9, 0.1, -2.2, 0.9, 0.2, 2.08, '#1d2128');                                                   // sill / diffuser
    [[-1.0, -1.35], [0.82, -1.35], [-1.0, 1.4], [0.82, 1.4]].forEach(function (p) {
      cv.box(p[0], 0, p[1] - 0.33, p[0] + 0.18, 0.64, p[1] + 0.33, '#121418');
      cv.box(p[0] + (p[0] < 0 ? -0.006 : 0.006), 0.14, p[1] - 0.2, p[0] + 0.186, 0.5, p[1] + 0.2, 'metal');
      cv.box(p[0] + (p[0] < 0 ? -0.008 : 0.008), 0.29, p[1] - 0.05, p[0] + 0.188, 0.35, p[1] + 0.05, '#e0ab25');
    });
    cv.box(-0.9, 0.34, -0.2, -0.88, 0.36, 0.8, '#121418'); cv.box(0.88, 0.34, -0.2, 0.9, 0.36, 0.8, '#121418');   // door lines
    car.add(cv.mesh());
    var lights = new VB(1421); lights.box(-0.78, 0.36, -2.26, -0.3, 0.39, -2.24, '#fff5d6'); lights.box(0.3, 0.36, -2.26, 0.78, 0.39, -2.24, '#fff5d6'); lights.box(-0.86, 0.52, 2.05, 0.86, 0.55, 2.07, '#ff3b30');
    var lm = lights.mesh(MAT.glow(0.3), true); car.add(lm);
    var head = new THREE.SpotLight(0xfff1cc, 0, 12, 0.6, 0.5, 1.2); head.position.set(0, 0.5, -2.3); head.target.position.set(0, 0, -8); car.add(head); car.add(head.target);
    /* driver door, hinged at the front edge */
    var dpiv = new THREE.Group(); dpiv.position.set(-0.9, 0.2, -0.45); car.add(dpiv);
    var ddv = new VB(1422); ddv.box(-0.04, 0, 0, 0, 0.36, 1.3, BODY); ddv.box(-0.035, 0.36, 0.1, 0.0, 0.66, 1.25, '#24303d'); dpiv.add(ddv.mesh());
    /* inside: seat and a lit cluster */
    var iv = new VB(1423); iv.box(-0.7, 0.22, 0.1, -0.15, 0.42, 0.6, '#3a2a22'); iv.box(-0.7, 0.42, 0.55, -0.15, 0.82, 0.68, '#3a2a22'); iv.box(-0.68, 0.5, -0.62, 0.68, 0.6, -0.42, '#20242b');
    car.add(iv.mesh());
    var dash = new VB(1424); dash.box(-0.6, 0.6, -0.45, -0.25, 0.66, -0.43, '#63e6ff'); dash.box(-0.08, 0.6, -0.45, 0.3, 0.65, -0.43, '#f2c13d'); var dm = dash.mesh(MAT.glow(0.2), true); car.add(dm);
    s.add(new THREE.HemisphereLight(0xdfe8f5, 0x3a3f47, 0.55));
    var lamp = new THREE.PointLight(0xfff0d0, 0.7, 10, 2); lamp.position.set(0, 2.3, 0.5); s.add(lamp);
    var day = new THREE.DirectionalLight(0xfff1d6, 0); day.position.set(-3, 6, -14); s.add(day);
    return (GARS[key] = { scene: s, slats: slats, lm: lm, head: head, dpiv: dpiv, dm: dm, day: day, car: car, D: D });
  }
  function garageCine(c) {
    var G = garageScene(c.env === 'train'), cam = c.camera, V3 = THREE.Vector3;
    function look(p, l) { cam.position.set(p[0], p[1], p[2]); cam.lookAt(l[0], l[1], l[2]); }
    function path(a, b, la, lb, dur, bob) {
      var A = new V3().fromArray(a), Bv = new V3().fromArray(b), LA = new V3().fromArray(la), LB = new V3().fromArray(lb), P = new V3(), L = new V3();
      return c.tw(dur, function (k) { var e = ease(k); P.lerpVectors(A, Bv, e); L.lerpVectors(LA, LB, e); if (bob) P.y += Math.sin(k * Math.PI * 6) * 0.025 * Math.sin(k * Math.PI); cam.position.copy(P); cam.lookAt(L); });
    }
    function reset() { G.slats.forEach(function (m, i) { m.position.set(0, i * 0.2, -G.D - 0.1); m.rotation.x = 0; }); G.lm.material.opacity = 0.3; G.head.intensity = 0; G.dpiv.rotation.y = 0; G.dm.material.opacity = 0.2; G.day.intensity = 0; }
    reset();
    /* 起身: from the desk, stand up and turn to the door (still in the room) */
    return c.standUp()
      .then(function () { return c.cut(G.scene); })
      .then(function () {
        look([-2.0, 1.62, 3.5], [0, 0.7, -0.6]);
        /* the car answers the key (unlocked): lights flash twice */
        return c.tw(0.7, function (k) { var on = Math.sin(k * Math.PI * 4) > 0; G.lm.material.opacity = on ? 1 : 0.3; G.head.intensity = on ? 1.6 : 0; });
      })
      /* Garage 门开启: the door winds up, daylight comes in */
      .then(function () {
        G.lm.material.opacity = 0.75; G.head.intensity = 0.9;
        return c.tw(1.1, function (k) { var e = ease(k); G.slats.forEach(function (m, i) { var y = i * 0.2 + e * 2.3; m.position.y = Math.min(y, 2.25 + i * 0.012); m.rotation.x = y > 2.2 ? -Math.PI / 2 * Math.min(1, (y - 2.2) * 3) : 0; }); G.day.intensity = e * 1.1; });
      })
      /* 走向车辆 (the driver's door opens on the way) */
      .then(function () {
        var walk = path([-2.0, 1.62, 3.5], [-1.7, 1.55, 0.6], [0, 0.7, -0.6], [-0.5, 0.7, -0.2], 1.3, true);
        var open = c.tw(1.3, function (k) { G.dpiv.rotation.y = -1.05 * ease(seg(k, 0.4, 1)); });
        return Promise.all([walk, open]);
      })
      /* 上车: into the seat, the cluster lights up, looking out at the open door */
      .then(function () {
        var sit = path([-1.7, 1.55, 0.6], [-0.42, 0.98, 0.2], [-0.5, 0.7, -0.2], [-0.42, 0.8, -6], 0.9, false);
        var lit = c.tw(0.9, function (k) { G.dm.material.opacity = 0.2 + 0.8 * k; G.dpiv.rotation.y = -1.05 * (1 - ease(seg(k, 0.5, 1))); });
        return Promise.all([sit, lit]);
      });
  }

  /* ================================================================ Rings: a wooden medal box (lid opens) or a wall medal board */
  function ringsDay() {
    var d = lsGet('minest.rewards.day.v1') || {}, day = today();
    var closed = d.day === day ? d : {};
    return { focus: !!closed.focus, check: !!closed.check, goal: !!closed.goal, day: d.day || null };
  }
  var RING_COL = { focus: 0xfa114f, check: 0x92e82a, goal: 0x1eeaef };
  function medals(group, y, z, s, flat) {
    var list = [], R = ringsDay();
    ['focus', 'check', 'goal'].forEach(function (k, i) {
      var on = R[k], col = RING_COL[k];
      var m = new THREE.Mesh(new THREE.TorusGeometry(0.035 * s, 0.009 * s, 10, 32), new THREE.MeshPhongMaterial({ color: col, emissive: col, emissiveIntensity: on ? 0.55 : 0.04, shininess: 90, transparent: !on, opacity: on ? 1 : 0.35 }));
      m.position.set((i - 1) * 0.085 * s, y, z); if (flat) m.rotation.x = -Math.PI / 2;
      var ribbon = new THREE.Mesh(new THREE.BoxGeometry(0.02 * s, 0.003, 0.05 * s), new THREE.MeshLambertMaterial({ color: on ? 0xf2c13d : 0x8a8579 }));
      if (flat) { ribbon.position.set(m.position.x, y - 0.004, z - 0.045 * s); } else { ribbon.rotation.x = Math.PI / 2; ribbon.position.set(m.position.x, y + 0.055 * s, z); }
      group.add(m); group.add(ribbon); m.userData.on = on; list.push(m);
    });
    return list;
  }
  function medalBox() {
    var g = new THREE.Group(), v = new VB(1501);
    v.box(-0.16, 0, -0.1, 0.16, 0.06, 0.1, 'wood', 0.03); v.box(-0.15, 0.06, -0.09, 0.15, 0.061, 0.09, '#1b2a55');
    v.box(-0.16, 0.02, 0.1, 0.16, 0.026, 0.104, 'brass'); v.box(-0.012, 0.04, 0.1, 0.012, 0.058, 0.106, 'brass');
    g.add(v.mesh());
    var inside = new THREE.Group(); g.add(inside); var ms = medals(inside, 0.066, 0.0, 1, true);
    var piv = new THREE.Group(); piv.position.set(0, 0.06, -0.1); g.add(piv);
    var lv = new VB(1502); lv.box(-0.16, 0, 0, 0.16, 0.025, 0.2, 'woodLight', 0.03); lv.box(-0.06, 0.025, 0.07, 0.06, 0.028, 0.13, 'brass'); lv.box(-0.15, -0.002, 0.005, 0.15, 0, 0.195, '#1b2a55');
    piv.add(lv.mesh());
    var shine = new THREE.PointLight(0xfff0c0, 0, 0.7, 2); shine.position.set(0, 0.2, 0.05); g.add(shine);
    return {
      id: 'medals', name: '勋章盒', en: 'Medal box', icon: '🏅', feature: 'rings', anchor: 'cabinet.right', group: g, style: 'box',
      hit: hitBox(g, -0.17, 0, -0.11, 0.17, 0.12, 0.11), label: [0, 0.2, 0],
      focus: { pos: [2.05, 1.32, 1.66], look: [2.74, 0.84, 1.66] },
      set: function (k) { var e = ease(seg(k, 0, 0.6)); piv.rotation.x = -1.9 * e; shine.intensity = 0.8 * ease(seg(k, 0.4, 1)); ms.forEach(function (m, i) { m.position.y = 0.066 + 0.03 * ease(seg(k, 0.45 + i * 0.1, 0.8 + i * 0.07)); m.rotation.z = 0; }); },
      idle: function (t) { ms.forEach(function (m, i) { if (m.userData.on) m.material.emissiveIntensity = 0.45 + 0.15 * Math.sin(t * 2 + i); }); }
    };
  }
  function medalBoard() {
    var g = new THREE.Group(), v = new VB(1511);
    v.box(-0.3, -0.2, 0, 0.3, 0.2, 0.03, 'woodLight', 0.03); v.box(-0.27, -0.17, 0.03, 0.27, 0.17, 0.034, '#1b2a55');
    v.box(-0.12, 0.12, 0.034, 0.12, 0.15, 0.036, 'gold');
    g.add(v.mesh());
    var ms = medals(g, -0.02, 0.05, 1.6, false);
    var shine = new THREE.PointLight(0xfff0c0, 0, 0.9, 2); shine.position.set(0, 0, 0.3); g.add(shine);
    return {
      id: 'medals', name: '勋章板', en: 'Medal board', icon: '🏅', feature: 'rings', anchor: 'wall.right', group: g, style: 'wall',
      hit: hitBox(g, -0.3, -0.2, 0, 0.3, 0.2, 0.08), label: [0, 0.3, 0.05],
      focus: { pos: [2.0, 1.55, 1.66], look: [3.0, 1.52, 1.66] },
      set: function (k) { shine.intensity = 0.9 * ease(k); ms.forEach(function (m, i) { m.rotation.y = ease(seg(k, i * 0.12, 0.6 + i * 0.12)) * Math.PI * 2; }); },
      idle: function (t) { ms.forEach(function (m, i) { if (m.userData.on) m.material.emissiveIntensity = 0.45 + 0.15 * Math.sin(t * 2 + i); }); }
    };
  }

  /* ================================================================ reading stand + open book (Knowledge) */
  function bookstand() {
    var g = new THREE.Group(), v = new VB(1601);
    v.box(-0.13, 0, -0.06, 0.13, 0.015, 0.08, 'woodDark'); v.box(-0.012, 0.015, -0.05, 0.012, 0.12, -0.03, 'wood');
    g.add(v.mesh());
    var tilt = new THREE.Group(); tilt.position.set(0, 0.03, 0.03); tilt.rotation.x = -1.0; g.add(tilt);
    var bv = new VB(1602);
    bv.box(-0.13, 0, -0.008, 0.13, 0.17, 0, 'woodLight'); bv.box(-0.13, -0.012, -0.008, 0.13, 0.0, 0.03, 'wood');
    bv.box(-0.12, 0.005, 0, -0.004, 0.16, 0.012, 'paper'); bv.box(0.004, 0.005, 0, 0.12, 0.16, 0.012, 'paper'); bv.box(-0.004, 0.005, 0, 0.004, 0.16, 0.01, 'cream');
    for (var i = 0; i < 6; i++) { bv.box(-0.105, 0.13 - i * 0.02, 0.012, -0.03 - (i % 3) * 0.012, 0.135 - i * 0.02, 0.013, 'grout'); bv.box(0.02, 0.13 - i * 0.02, 0.012, 0.105 - (i % 2) * 0.02, 0.135 - i * 0.02, 0.013, 'grout'); }
    bv.box(0.03, 0.03, 0.012, 0.07, 0.07, 0.0135, 'blueSoft');
    bv.box(0.05, -0.04, 0.008, 0.058, 0.01, 0.01, 'red');
    tilt.add(bv.mesh());
    var page = new THREE.Group(); page.position.set(0, 0, 0.0125); tilt.add(page);
    var pv = new VB(1603); pv.box(0, 0.006, 0, 0.115, 0.158, 0.002, 'paper'); for (var j = 0; j < 5; j++) pv.box(0.015, 0.13 - j * 0.022, 0.002, 0.095, 0.134 - j * 0.022, 0.003, 'grout');
    var pm = pv.mesh(); page.add(pm);
    var lamp = new THREE.PointLight(0xffe2b0, 0, 0.6, 2); lamp.position.set(0, 0.25, 0.15); g.add(lamp);
    return {
      id: 'bookstand', name: '知识书架', en: 'Knowledge stand', icon: '📖', feature: 'knowledge', anchor: 'desk.book', group: g,
      hit: hitBox(g, -0.14, 0, -0.08, 0.14, 0.2, 0.1), label: [0, 0.26, 0],
      focus: { pos: [0.6, 1.08, -1.72], look: [0.6, 0.86, -2.2] },
      set: function (k) { page.rotation.y = -Math.PI * ease(seg(k, 0.15, 0.85)); lamp.intensity = 0.6 * ease(k); var c = Math.sin(seg(k, 0.15, 0.85) * Math.PI); pm.position.z = c * 0.01; },
      idle: function () {}
    };
  }

  /* ================================================================ vintage car model (CarPlay · 车载闪卡) */
  function carModel() {
    var g = new THREE.Group(), v = new VB(1701), C = 'cream', T = 'blue', s = 1;
    v.box(-0.16, 0.03, -0.06, 0.16, 0.075, 0.06, C, 0.03);                                // body
    v.box(-0.16, 0.075, -0.05, -0.02, 0.1, 0.05, C);                                        // hood
    v.box(-0.01, 0.075, -0.055, 0.12, 0.15, 0.055, C);                                      // cabin
    v.box(-0.005, 0.15, -0.058, 0.125, 0.158, 0.058, T);                                    // roof
    v.box(0.0, 0.095, -0.0565, 0.055, 0.14, -0.055, '#bfe3ff'); v.box(0.065, 0.095, -0.0565, 0.115, 0.14, -0.055, '#bfe3ff');
    v.box(0.0, 0.095, 0.055, 0.055, 0.14, 0.0565, '#bfe3ff'); v.box(0.065, 0.095, 0.055, 0.115, 0.14, 0.0565, '#bfe3ff');
    v.box(-0.0125, 0.085, -0.05, -0.0075, 0.145, 0.05, '#bfe3ff');                          // windscreen
    [[-0.11, -0.065], [-0.11, 0.045], [0.09, -0.065], [0.09, 0.045]].forEach(function (p) { v.box(p[0] - 0.028, 0.02, p[1] - 0.002, p[0] + 0.028, 0.06, p[1] + 0.022, T); v.cb(p[0], 0, p[1] + 0.01, 0.045, 0.045, 0.02, 'dark'); v.cb(p[0], 0.014, p[1] + 0.01, 0.018, 0.018, 0.022, 'metal'); });
    v.box(-0.12, 0.028, -0.068, 0.12, 0.034, -0.06, T); v.box(-0.12, 0.028, 0.06, 0.12, 0.034, 0.068, T);   // running boards
    v.box(-0.175, 0.035, -0.04, -0.16, 0.07, 0.04, 'metal'); for (var i = 0; i < 5; i++) v.box(-0.177, 0.04 + i * 0.006, -0.035, -0.175, 0.043 + i * 0.006, 0.035, 'dark');   // grille
    v.cb(0.17, 0.03, 0, 0.012, 0.06, 0.05, 'dark');                                         // spare wheel
    v.box(0.0, 0.08, -0.04, 0.012, 0.09, 0.04, 'woodDark'); v.cb(0.02, 0.09, -0.02, 0.004, 0.03, 0.004, 'dark');   // dashboard, column
    g.add(v.mesh());
    var wheel = new THREE.Mesh(new THREE.TorusGeometry(0.012, 0.0025, 6, 16), new THREE.MeshLambertMaterial({ color: 0x2b2f36 })); wheel.position.set(0.028, 0.115, -0.02); wheel.rotation.y = Math.PI / 2; g.add(wheel);
    var hv = new VB(1702); hv.cb(-0.168, 0.07, -0.042, 0.016, 0.016, 0.016, '#fff7d8'); hv.cb(-0.168, 0.07, 0.042, 0.016, 0.016, 0.016, '#fff7d8');
    var headM = hv.mesh(MAT.glow(0.25), true); g.add(headM);
    var gv = new VB(1703); gv.box(0.013, 0.083, -0.03, 0.014, 0.093, -0.012, '#ffcf6b'); gv.box(0.013, 0.083, 0.0, 0.014, 0.093, 0.018, '#7fe0ff');
    var gaugeM = gv.mesh(MAT.glow(0.0), true); g.add(gaugeM);
    var beam = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.3, 16, 1, true), new THREE.MeshBasicMaterial({ color: 0xfff1c8, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
    beam.rotation.z = Math.PI / 2; beam.position.set(-0.32, 0.07, 0); g.add(beam);
    return {
      id: 'carmodel', name: '老爷车', en: 'Vintage car', icon: '🚘', feature: 'carplay', anchor: 'cabinet.left', group: g,
      hit: hitBox(g, -0.19, 0, -0.08, 0.19, 0.17, 0.08), label: [0, 0.24, 0],
      focus: { pos: [2.22, 1.1, 0.86], look: [2.74, 0.88, 0.72] },
      /* the camera pushes into the cockpit, behind the little wheel, looking out over the bonnet */
      focus2: { pos: [2.76, 0.918, 0.8], look: [2.76, 0.86, -0.2] },
      set: function (k) {
        var on = ease(seg(k, 0, 0.35)); headM.material.opacity = 0.25 + 0.75 * on; beam.material.opacity = 0.22 * on;
        gaugeM.material.opacity = ease(seg(k, 0.3, 0.8));
      },
      idle: function () {}
    };
  }


  /* ================================================================ the Magical Backpack itself, on the floor by the desk
     Leather in three tones, stitched seams, a front pocket with a brass nameplate, side pockets, shoulder straps, a top
     handle, and a flap held by two straps with brass buckles. Tapped: the buckles let go, the flap swings open, warm light
     and a few sparks come out — and the backpack's inventory opens (app.js, o.local). */
  function backpack() {
    var g = new THREE.Group(), v = new VB(1801), L = '#8a5a36', LD = '#6e4426', LL = '#a8754a', ST = '#f1dfb8', BR = '#d8a94a', i;
    v.box(-0.215, 0, -0.135, 0.215, 0.035, 0.135, '#4f321c');
    v.box(-0.2, 0.035, -0.12, 0.2, 0.46, 0.12, L, 0.04); v.box(-0.185, 0.46, -0.11, 0.185, 0.5, 0.11, L);
    for (i = 0; i < 9; i++) { v.box(-0.2 + i * 0.05, 0.05, 0.12, -0.19 + i * 0.05, 0.052, 0.121, ST); }   // stitching along the base
    [-1, 1].forEach(function (sg) {
      v.box(sg > 0 ? 0.2 : -0.24, 0.07, -0.085, sg > 0 ? 0.24 : -0.2, 0.31, 0.085, LD, 0.05);
      v.box(sg > 0 ? 0.24 : -0.243, 0.29, -0.085, sg > 0 ? 0.243 : -0.24, 0.295, 0.085, ST);
      v.box(sg > 0 ? 0.205 : -0.245, 0.24, -0.02, sg > 0 ? 0.245 : -0.205, 0.26, 0.02, BR);                // side buckles
      v.box(sg * 0.13 - 0.03, 0.08, -0.15, sg * 0.13 + 0.03, 0.45, -0.12, LD);                             // shoulder straps
    });
    v.box(-0.145, 0.065, 0.12, 0.145, 0.28, 0.165, LL, 0.04);                                             // front pocket
    v.box(-0.135, 0.265, 0.165, 0.135, 0.268, 0.167, ST); v.box(-0.135, 0.075, 0.165, -0.132, 0.268, 0.167, ST); v.box(0.132, 0.075, 0.165, 0.135, 0.268, 0.167, ST);
    v.box(-0.055, 0.15, 0.165, 0.055, 0.19, 0.172, BR); v.box(-0.045, 0.158, 0.172, 0.045, 0.182, 0.174, '#7a5420');   // nameplate
    [-0.08, 0.08].forEach(function (x) { v.box(x - 0.02, 0.3, 0.12, x + 0.02, 0.33, 0.13, BR); });          // the catches the buckles close on
    v.box(-0.06, 0.5, -0.012, -0.045, 0.56, 0.012, LD); v.box(0.045, 0.5, -0.012, 0.06, 0.56, 0.012, LD); v.box(-0.06, 0.55, -0.012, 0.06, 0.565, 0.012, LD);   // handle
    g.add(v.mesh());
    /* warm light inside, shown when the flap opens */
    var gv = new VB(1802); gv.box(-0.17, 0.495, -0.1, 0.17, 0.5, 0.1, '#ffd98a');
    var glow = gv.mesh(MAT.glow(0), true); glow.material.transparent = true; g.add(glow);
    var lamp = new THREE.PointLight(0xffc970, 0, 1.2, 2); lamp.position.set(0, 0.62, 0.05); g.add(lamp);
    var sparks = [], sm = new THREE.MeshBasicMaterial({ color: 0xfff1c0, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
    for (i = 0; i < 7; i++) { var sp = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.012, 0.012), sm); sp.userData.ph = i / 7; g.add(sp); sparks.push(sp); }
    /* the flap, hinged on the back of the top */
    var flap = new THREE.Group(); flap.position.set(0, 0.5, -0.115); g.add(flap);
    var fv = new VB(1803);
    fv.box(-0.195, 0, 0, 0.195, 0.028, 0.24, L, 0.03); fv.box(-0.195, -0.2, 0.235, 0.195, 0.028, 0.262, L, 0.03);
    fv.box(-0.185, 0.028, 0.012, 0.185, 0.03, 0.014, ST); fv.box(-0.185, -0.19, 0.262, 0.185, -0.188, 0.264, ST);
    fv.box(-0.04, 0.01, 0.1, 0.04, 0.03, 0.14, BR);                                                         // a small brass plate on top
    [-0.08, 0.08].forEach(function (x) { fv.box(x - 0.018, -0.235, 0.255, x + 0.018, 0.02, 0.268, LD); });   // straps down the front
    flap.add(fv.mesh());
    var bks = [];
    [-0.08, 0.08].forEach(function (x) { var b = new THREE.Group(), bv = new VB(1804); bv.box(-0.026, -0.022, 0, 0.026, 0.022, 0.012, BR); bv.box(-0.016, -0.012, 0.012, 0.016, 0.012, 0.014, '#7a5420'); b.add(bv.mesh()); b.position.set(x, -0.2, 0.268); flap.add(b); bks.push(b); });
    var kk = 0, last = 0;
    return {
      id: 'backpack', name: '魔法背包', en: 'Magical Backpack', icon: '🎒', feature: 'backpack', local: true, anchor: 'floor.pack', group: g,
      hit: hitBox(g, -0.25, 0, -0.16, 0.25, 0.58, 0.28), label: [0, 0.68, 0],
      focus: { pos: [-1.08, 1.02, -1.2], look: [-1.45, 0.3, -1.85] },
      set: function (k) {
        kk = k; var u = seg(k, 0, 0.3), o = ease(seg(k, 0.22, 0.8));
        bks.forEach(function (b, j) { b.rotation.x = -0.9 * ease(u); b.position.y = -0.2 + 0.02 * Math.sin(u * Math.PI); });   // unbuckled
        flap.rotation.x = -1.95 * o;
        var gl = seg(k, 0.45, 1); glow.material.opacity = gl; lamp.intensity = 0.9 * gl; sm.opacity = 0.9 * gl;
      },
      idle: function (t) {
        var dt = Math.min(0.1, Math.max(0, t - last)); last = t;
        sparks.forEach(function (sp, j) { var p = (t * 0.35 + sp.userData.ph) % 1; sp.position.set(Math.sin(j * 2.3 + t) * 0.09, 0.52 + p * 0.32 * kk, Math.cos(j * 1.7 + t) * 0.06); sp.scale.setScalar(1 - p); });
        if (kk > 0.4) lamp.intensity = 0.9 * seg(kk, 0.45, 1) * (0.9 + 0.1 * Math.sin(t * 6));
      }
    };
  }


  /* ================================================================ Gramophone (the room's music: ambience / classical / mute — media.js)
     A walnut cabinet, a turntable with a record that turns, a tonearm whose needle drops, a flared brass horn, a crank. */
  function gramophone() {
    var g = new THREE.Group(), v = new VB(1901), W = '#5e3b26', WD = '#43291a', BR = '#d8a94a', BD = '#a77c2c', i;
    v.box(-0.24, 0, -0.2, 0.24, 0.05, 0.2, WD); v.box(-0.22, 0.05, -0.18, 0.22, 0.42, 0.18, W, 0.03);
    v.box(-0.2, 0.08, 0.18, 0.2, 0.38, 0.185, '#74503a'); v.box(-0.02, 0.2, 0.185, 0.02, 0.26, 0.195, BR);   // front panel, knob
    v.box(-0.24, 0.42, -0.2, 0.24, 0.45, 0.2, WD);
    v.box(0.22, 0.25, -0.02, 0.26, 0.29, 0.02, BR); v.box(0.26, 0.2, -0.015, 0.275, 0.34, 0.015, BR); v.box(0.275, 0.2, -0.03, 0.3, 0.22, 0.03, '#2b2b2b');   // crank
    g.add(v.mesh());
    /* turntable + record */
    var plat = new THREE.Group(); plat.position.set(-0.04, 0.45, 0.02); g.add(plat);
    var disc = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.012, 40), new THREE.MeshPhongMaterial({ color: 0x141414, shininess: 90, specular: 0x666666 }));
    disc.position.y = 0.012; plat.add(disc);
    var lab = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.014, 24), new THREE.MeshLambertMaterial({ color: 0xc8463a })); lab.position.y = 0.013; plat.add(lab);
    var grooves = new THREE.Mesh(new THREE.RingGeometry(0.06, 0.145, 40, 3), new THREE.MeshBasicMaterial({ color: 0x2a2a2a, side: THREE.DoubleSide })); grooves.rotation.x = -Math.PI / 2; grooves.position.y = 0.0185; plat.add(grooves);
    var shine = new THREE.Mesh(new THREE.PlaneGeometry(0.02, 0.24), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.18, depthWrite: false })); shine.rotation.x = -Math.PI / 2; shine.position.y = 0.019; plat.add(shine);
    /* tonearm: pivots at the back right, the needle drops onto the record */
    var arm = new THREE.Group(); arm.position.set(0.15, 0.47, -0.12); g.add(arm);
    var av = new VB(1902); av.cb(0, -0.02, 0, 0.04, 0.03, 0.04, BD); av.box(-0.006, 0.01, -0.006, 0.006, 0.02, 0.17, BR); av.box(-0.012, -0.005, 0.16, 0.012, 0.02, 0.2, BR); av.box(-0.003, -0.02, 0.18, 0.003, -0.005, 0.186, '#dcdcdc');
    arm.add(av.mesh()); arm.rotation.y = 0.55; arm.rotation.x = -0.18;
    /* horn: rings widening along a curve up and forward */
    var horn = new THREE.Group(); horn.position.set(0.1, 0.45, -0.12); g.add(horn);
    var hv = new VB(1903);
    for (i = 0; i < 14; i++) { var t = i / 13, r = 0.015 + Math.pow(t, 2.2) * 0.17, y = 0.03 + t * 0.4, z = -0.02 + t * t * 0.28; hv.cb(-0.05 * t, y, z, r * 2, 0.03, r * 2, i % 2 ? BR : BD, 0.03); }
    horn.add(hv.mesh()); horn.rotation.x = -0.25;
    var kk = 0, last = 0, spin = 0;
    return {
      id: 'gramophone', name: '留声机', en: 'Gramophone', icon: '🎶', feature: 'music', local: true, anchor: 'floor.gramo', group: g,
      hit: hitBox(g, -0.26, 0, -0.22, 0.3, 0.95, 0.24), label: [0, 1.0, 0],
      focus: { pos: [1.55, 1.15, 0.65], look: [2.25, 0.45, 0.15] },
      playing: false,
      set: function (k) { kk = k; arm.rotation.y = 0.55 - 0.5 * Math.min(1, k * 1.6); arm.rotation.x = -0.18 + 0.16 * Math.max(0, Math.min(1, k * 2 - 0.6)); },
      idle: function (t) {
        var dt = Math.min(0.1, Math.max(0, t - last)); last = t;
        var on = this.playing; spin += dt * (on ? 3.5 : 0); plat.rotation.y = spin;
        if (on) { arm.rotation.y += (0.05 - arm.rotation.y) * Math.min(1, dt * 4); arm.rotation.x += (-0.02 - arm.rotation.x) * Math.min(1, dt * 4); horn.scale.setScalar(1 + Math.sin(t * 9) * 0.004); }
        else if (kk === 0) { arm.rotation.y += (0.55 - arm.rotation.y) * Math.min(1, dt * 3); arm.rotation.x += (-0.18 - arm.rotation.x) * Math.min(1, dt * 3); }
      }
    };
  }

  /* ================================================================ Vintage film projector (the collection screening — media.js)
     Two reels on their arms that turn, a lens, a light beam, and a screen on a stand that unrolls. Faces +z: the screen stands 1.3 m in front. */
  function filmProjector() {
    var g = new THREE.Group(), v = new VB(2001), M = '#3a3d42', MD = '#2b2d31', BR = '#c9a24a', i;
    /* a small wooden stand */
    v.box(-0.2, 0, -0.2, 0.2, 0.04, 0.2, '#5e3b26'); v.box(-0.03, 0.04, -0.03, 0.03, 0.62, 0.03, '#5e3b26');
    [[-0.17, -0.17], [0.15, -0.17], [-0.17, 0.15], [0.15, 0.15]].forEach(function (q) { v.box(q[0], 0, q[1], q[0] + 0.02, 0.02, q[1] + 0.02, BR); });
    v.box(-0.16, 0.62, -0.16, 0.16, 0.65, 0.16, '#5e3b26');
    /* the body, lens, lamp housing vents */
    v.box(-0.1, 0.65, -0.14, 0.1, 0.84, 0.12, M, 0.03); v.box(-0.035, 0.7, 0.12, 0.035, 0.77, 0.24, MD); v.box(-0.03, 0.705, 0.24, 0.03, 0.765, 0.25, '#9fd6ff');
    for (i = 0; i < 4; i++) v.box(0.1, 0.68 + i * 0.035, -0.1, 0.105, 0.69 + i * 0.035, 0.05, '#1d1f22');
    v.box(-0.004, 0.84, -0.06, 0.004, 1.02, -0.05, MD); v.box(-0.004, 0.84, 0.03, 0.004, 1.0, 0.04, MD);   // reel arms
    v.box(-0.06, 0.8, 0.16, 0.06, 0.81, 0.17, BR);
    g.add(v.mesh());
    function reel(y, z, r) {
      var rg = new THREE.Group(); rg.position.set(-0.012, y, z); g.add(rg);
      var rv = new VB(2010 + Math.round(y * 100));
      rv.box(-0.006, -r, -r, 0.006, r, r, '#1d1f22'); rv.box(-0.008, -r * 0.82, -r * 0.82, 0.008, r * 0.82, r * 0.82, '#3f2f22');
      for (var k = 0; k < 3; k++) { var a = k / 3 * Math.PI; rv.box(-0.01, -0.006, -r * 0.9, 0.01, 0.006, r * 0.9, M); }
      rv.cb(0, -0.015, 0, 0.022, 0.03, 0.03, BR);
      var m = rv.mesh(); rg.add(m); return rg;
    }
    var r1 = reel(1.05, -0.08, 0.11), r2 = reel(1.0, 0.07, 0.09);
    r1.children[0].rotation.x = 0; r2.children[0].rotation.x = 0.4;
    /* the beam and the screen on its stand */
    var beam = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.03, 1.25, 20, 1, true), new THREE.MeshBasicMaterial({ color: 0xfff1c8, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
    beam.rotation.x = Math.PI / 2; beam.position.set(0, 0.95, 0.88); g.add(beam);
    var sv = new VB(2020);
    sv.box(-0.02, 0, 1.3, 0.02, 1.52, 1.34, '#2b2d31'); sv.box(-0.25, 0, 1.28, 0.25, 0.02, 1.36, '#2b2d31');
    sv.box(-0.48, 1.5, 1.29, 0.48, 1.55, 1.35, '#2b2d31');
    g.add(sv.mesh());
    var cloth = new THREE.Group(); cloth.position.set(0, 1.5, 1.31); g.add(cloth);
    var cv = document.createElement('canvas'); cv.width = 256; cv.height = 192; var cx = cv.getContext('2d');
    var tex = new THREE.CanvasTexture(cv); tex.encoding = THREE.sRGBEncoding;
    var screen = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.66), new THREE.MeshBasicMaterial({ color: 0xffffff, map: tex, fog: false }));
    screen.position.y = -0.33; cloth.add(screen); cloth.scale.y = 0.02;
    function paint(t, on) {
      cx.fillStyle = on ? '#f4ecd6' : '#ece8de'; cx.fillRect(0, 0, 256, 192);
      if (!on) return;
      var f = 0.85 + 0.15 * Math.sin(t * 40) * Math.sin(t * 13);
      cx.fillStyle = 'rgba(30,24,16,' + (0.12 * f) + ')'; for (var k = 0; k < 40; k++) cx.fillRect((k * 53 + t * 900) % 256, (k * 97 + t * 700) % 192, 1, 1 + (k % 3));
      cx.strokeStyle = 'rgba(40,30,20,.25)'; cx.lineWidth = 1; cx.beginPath(); var x0 = (t * 60) % 256; cx.moveTo(x0, 0); cx.lineTo(x0 + 6, 192); cx.stroke();
      cx.fillStyle = 'rgba(40,30,20,' + (0.55 * f) + ')'; cx.font = 'italic 700 34px Georgia, serif'; cx.textAlign = 'center'; cx.fillText('MINEST', 128, 92); cx.font = '600 15px Georgia, serif'; cx.fillText('· COLLECTION ·', 128, 120);
      var gr = cx.createRadialGradient(128, 96, 40, 128, 96, 150); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.35)'); cx.fillStyle = gr; cx.fillRect(0, 0, 256, 192);
      tex.needsUpdate = true;
    }
    paint(0, false); tex.needsUpdate = true;
    var kk = 0, last = 0, spin = 0, paintT = 0;
    return {
      id: 'projector16', name: '老式放映机', en: 'Film projector', icon: '🎞', feature: 'cinema', local: true, anchor: 'floor.film', group: g,
      hit: hitBox(g, -0.2, 0, -0.2, 0.2, 1.18, 0.3), label: [0, 1.25, 0],
      focus: { pos: [-1.2, 1.3, 0.1], look: [-1.8, 1.0, 1.6] },
      showing: false,
      set: function (k) { kk = k; cloth.scale.y = 0.02 + 0.98 * Math.min(1, k * 1.4); beam.material.opacity = 0.16 * Math.max(0, k * 2 - 0.8); },
      idle: function (t) {
        var dt = Math.min(0.1, Math.max(0, t - last)), on = kk > 0.5 || this.showing; last = t;
        spin += dt * (on ? 4 : 0); r1.rotation.x = spin; r2.rotation.x = spin * 1.25;
        if (this.showing) { cloth.scale.y += (1 - cloth.scale.y) * Math.min(1, dt * 4); beam.material.opacity = 0.14 + 0.03 * Math.sin(t * 31); }
        else if (kk === 0) { cloth.scale.y += (0.02 - cloth.scale.y) * Math.min(1, dt * 3); beam.material.opacity *= 0.9; }
        if (t - paintT > 0.08 && cloth.scale.y > 0.3) { paintT = t; paint(t, on); }
      }
    };
  }

  /* the entries this update adds; medal style comes from the settings (box on the cabinet / board on the wall) */
  /* ================================================================ Times Square portal (Portal World — js/portal-tsq.js)
     Everyday Magic: an old brick archway against the wall. Its opening is not wall at all: a dusk street of bright screens
     and a scrolling ticker (today's words and charts from the board) shows through. Tap it to step into Times Square. */
  function tsqPortal() {
    var g = new THREE.Group(), v = new VB(2101), BK = '#8a4b3a', BD = '#6f3a2d', ST = '#b9ad98', BR = '#c9a24a', i;
    var OW = 0.9, OH = 1.75, R = OW / 2;                                 // the opening: OW wide, straight sides OH high, round top
    v.box(-0.72, 0, -0.14, 0.72, 0.06, 0.14, ST);                          // a stone step
    for (i = 0; i < 11; i++) { var y = 0.06 + i * 0.16; v.box(-0.72, y, -0.1, -R, y + 0.155, 0.1, i % 2 ? BK : BD, 0.02); v.box(R, y, -0.1, 0.72, y + 0.155, 0.1, i % 2 ? BD : BK, 0.02); }
    for (i = 0; i <= 12; i++) {                                            // the arch: voussoirs round the top
      var a = Math.PI * i / 12, cx = Math.cos(a) * (R + 0.11), cy = 0.06 + OH + Math.sin(a) * (R + 0.11);
      v.cb(cx, cy - 0.07, 0, 0.15, 0.15, 0.21, i === 6 ? ST : (i % 2 ? BK : BD), 0.02);
    }
    v.box(-0.74, 0.06 + OH + R + 0.18, -0.12, 0.74, 0.06 + OH + R + 0.26, 0.12, ST);
    g.add(v.mesh());
    /* the view through: a canvas painted like a dusk street of screens; redrawn a few times a second while in sight */
    var cv = document.createElement('canvas'); cv.width = 256; cv.height = 512; var c2 = cv.getContext('2d');
    var tex = new THREE.CanvasTexture(cv); if ('colorSpace' in tex) tex.colorSpace = THREE.SRGBColorSpace; else tex.encoding = THREE.sRGBEncoding;
    var sh = new THREE.Shape(); sh.moveTo(-R, 0); sh.lineTo(R, 0); sh.lineTo(R, OH); sh.absarc(0, OH, R, 0, Math.PI, false); sh.lineTo(-R, 0);
    var geo = new THREE.ShapeGeometry(sh, 24), pos = geo.attributes.position, uv = geo.attributes.uv, top = OH + R;
    for (i = 0; i < pos.count; i++) uv.setXY(i, (pos.getX(i) + R) / OW, pos.getY(i) / top);
    var mat = new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }), view = new THREE.Mesh(geo, mat); view.position.set(0, 0.06, -0.02); g.add(view);
    var veil = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0xbfe8ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
    veil.position.set(0, 0.06, 0.005); g.add(veil);
    var glow = new THREE.PointLight(0x9fc8ff, 0.35, 2.6); glow.position.set(0, 1.2, 0.5); g.add(glow);
    /* the screens, from back (high, small) to front; colours shift slowly */
    var B = [], words = 'TIMES SQUARE';
    for (i = 0; i < 9; i++) B.push({ x: (i % 3) * 86 + (i > 5 ? 6 : 0), w: 70 + (i % 2) * 20, h: 160 + ((i * 53) % 140), d: 0.4 + (i % 3) * 0.3 });
    var SCR = [[18, 70, 90, 64, '#ff3d6e'], [150, 40, 92, 120, '#2fd2ff'], [10, 170, 66, 92, '#ffd23f'], [176, 196, 66, 66, '#7cff6b'], [92, 140, 70, 46, '#b36bff'], [40, 290, 176, 60, '#ff8a3d']];
    function words0() {
      var s = root.SpatialTSQ && root.SpatialTSQ.snapshot ? root.SpatialTSQ.snapshot() : null, a = [];
      if (s) { if (s.words && s.words.cur) a.push(s.words.cur); (s.words && s.words.next || []).slice(0, 4).forEach(function (w) { a.push(w); }); s.charts.forEach(function (c) { a.push(c.name + ': ' + c.title); }); }
      words = (a.length ? a.join('  ·  ') : 'TIMES SQUARE  ·  时代广场') + '  ·  ';
    }
    var lastPaint = -1, lastWords = -99, kk = 0;
    function paint(t) {
      var gr = c2.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, '#1b1f4a'); gr.addColorStop(0.55, '#4a2f6a'); gr.addColorStop(1, '#0c0d16');
      c2.fillStyle = gr; c2.fillRect(0, 0, 256, 512);
      B.forEach(function (b, j) { c2.fillStyle = 'rgba(10,12,22,' + (0.55 + b.d * 0.4) + ')'; c2.fillRect(b.x, 512 - 120 - b.h - (2 - (j % 3)) * 30, b.w, b.h + 200); });
      SCR.forEach(function (s, j) {
        var k = 0.65 + 0.35 * Math.sin(t * (0.7 + j * 0.23) + j * 2); c2.globalAlpha = k; c2.fillStyle = s[4]; c2.fillRect(s[0], s[1], s[2], s[3]);
        c2.globalAlpha = 0.9; c2.fillStyle = '#fff'; c2.fillRect(s[0] + 6, s[1] + 8 + ((t * 18 + j * 20) % Math.max(8, s[3] - 16)), s[2] - 12, 3); c2.globalAlpha = 1;
      });
      for (var y = 120; y < 400; y += 9) for (var x = 4; x < 252; x += 11) if (((x * 7 + y * 13) % 29) < 6) { c2.fillStyle = 'rgba(255,214,140,0.55)'; c2.fillRect(x, y, 3, 4); }
      c2.fillStyle = '#05060a'; c2.fillRect(0, 418, 256, 30);                        // the ticker band
      c2.font = 'bold 20px -apple-system, Helvetica, Arial, sans-serif'; c2.fillStyle = '#ffcf4a'; c2.textBaseline = 'middle';
      var tw = c2.measureText(words).width || 200, off = -((t * 46) % tw);
      for (var q = off; q < 256; q += tw) c2.fillText(words, q, 434);
      c2.fillStyle = '#2a2b33'; c2.fillRect(0, 448, 256, 64); c2.fillStyle = '#e8e2c8'; for (var s2 = 0; s2 < 256; s2 += 24) c2.fillRect(s2, 478, 14, 5);   // the street
      tex.needsUpdate = true;
    }
    words0(); paint(0);
    var last = 0;
    return {
      id: 'tsqPortal', name: '传送门', en: 'Portal · Times Square & interiors', icon: '🌆', feature: 'portal', anchor: 'floor.portal', group: g,
      hit: hitBox(g, -0.74, 0, -0.16, 0.74, 2.45, 0.2), label: [0, 2.5, 0],
      focus: { pos: [2.1, 1.45, 0.75], look: [2.26, 1.25, 2.4] },
      panel: function (ctx) { return new Promise(function (res) { if (root.SpatialTSQ) root.SpatialTSQ.choose(res, ctx && ctx.container); else res(null); }); },
      set: function (k) { kk = k; veil.material.opacity = 0.55 * Math.sin(Math.PI * Math.min(1, k)) + 0.25 * k; glow.intensity = 0.35 + 1.2 * k; },
      idle: function (t) {
        var dt = Math.min(0.1, Math.max(0, t - last)); last = t;
        if (t - lastWords > 30) { lastWords = t; words0(); }
        if (t - lastPaint > 0.12) { lastPaint = t; paint(t); }
        if (kk === 0) veil.material.opacity = 0.06 + 0.05 * Math.sin(t * 1.6);
      }
    };
  }

  /* ================================================================ Holographic Typography Lab console (js/holo-lab.js)
     A metal-and-glass console; above the glass a blue projection — turning rings, three small floating screens, dust.
     It starts in the Magical Backpack: take it out to place it (it appears by the backpack), long-press to move it. */
  function holoDesk() {
    var g = new THREE.Group(), v = new VB(2201), i, STEEL = '#2b3038', STEEL2 = '#3c434d', EDGE = '#8fa3b5';
    v.cb(0, 0, 0, 0.62, 0.05, 0.46, STEEL, 0.02);                          // base plate
    v.cb(0, 0.05, 0, 0.18, 0.62, 0.14, STEEL2, 0.02);                       // column
    v.cb(0, 0.05, 0, 0.26, 0.04, 0.2, STEEL);
    v.cb(0, 0.64, 0, 0.78, 0.05, 0.56, STEEL, 0.02);                       // the desk top frame
    v.cb(0, 0.69, 0, 0.8, 0.012, 0.58, EDGE);
    for (i = -1; i <= 1; i += 2) v.cb(i * 0.36, 0.05, 0, 0.04, 0.6, 0.04, STEEL2);
    g.add(v.mesh());
    var glassTop = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.014, 0.5), new THREE.MeshPhongMaterial({ color: 0x9fdcff, transparent: true, opacity: 0.32, shininess: 140, specular: 0xffffff, depthWrite: false }));
    glassTop.position.y = 0.705; g.add(glassTop);
    var add = function (m) { m.blending = THREE.AdditiveBlending; m.transparent = true; m.depthWrite = false; m.fog = false; return m; };
    var emitter = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.012, 32), add(new THREE.MeshBasicMaterial({ color: 0x5fd8ff, opacity: 0.9 })));
    emitter.position.y = 0.718; g.add(emitter);
    var beam = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.09, 0.55, 32, 1, true), add(new THREE.MeshBasicMaterial({ color: 0x3fbfff, opacity: 0.07, side: THREE.DoubleSide })));
    beam.position.y = 0.72 + 0.275; g.add(beam);
    var proj = new THREE.Group(); proj.position.y = 1.0; g.add(proj);
    var rings = [];
    [[0.22, 0.004, 0.0], [0.17, 0.003, 0.9], [0.27, 0.0025, -0.5]].forEach(function (r, k) {
      var m = new THREE.Mesh(new THREE.TorusGeometry(r[0], r[1], 6, 64), add(new THREE.MeshBasicMaterial({ color: k === 1 ? 0x8ff0ff : 0x4fc8ff, opacity: 0.85 })));
      m.rotation.x = Math.PI / 2 + r[2] * 0.4; m.rotation.y = r[2]; proj.add(m); rings.push(m);
    });
    var core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.06, 1), add(new THREE.MeshBasicMaterial({ color: 0x9ff4ff, wireframe: true, opacity: 0.9 }))); proj.add(core);
    /* three small screens with real words from Minest when it can read them */
    function screenTex(lines) {
      var cv = document.createElement('canvas'); cv.width = 256; cv.height = 160; var x = cv.getContext('2d');
      x.fillStyle = 'rgba(30,140,200,0.18)'; x.fillRect(0, 0, 256, 160); x.strokeStyle = 'rgba(120,220,255,0.9)'; x.lineWidth = 3; x.strokeRect(4, 4, 248, 152);
      x.fillStyle = 'rgba(160,235,255,1)'; x.font = '600 26px ui-monospace,Menlo,monospace'; x.textAlign = 'left';
      lines.forEach(function (l, j) { x.fillText(String(l).slice(0, 16), 16, 44 + j * 36); });
      x.fillStyle = 'rgba(120,220,255,.35)'; for (var y = 0; y < 160; y += 5) x.fillRect(0, y, 256, 1);
      var t = new THREE.CanvasTexture(cv); t.encoding = THREE.sRGBEncoding; return t;
    }
    var panes = [];
    [['HOLO LAB', 'TYPOGRAPHY', '◈ ◈ ◈'], ['WORD RINGS', '— — —', 'ORBIT'], ['STAR MAP', '• — •', 'LINKS']].forEach(function (ls, k) {
      var m = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.125), add(new THREE.MeshBasicMaterial({ map: screenTex(ls), opacity: 0.9, side: THREE.DoubleSide })));
      var a = (k - 1) * 0.75; m.position.set(Math.sin(a) * 0.3, 0.05 + (k === 1 ? 0.12 : 0), Math.cos(a) * 0.3 - 0.06); m.rotation.y = a; proj.add(m); panes.push(m);
    });
    var dust = new VB(2202); for (i = 0; i < 24; i++) dust.cb((dust.r() - 0.5) * 0.6, 0.72 + dust.r() * 0.6, (dust.r() - 0.5) * 0.44, 0.006, 0.006, 0.006, 'cyan');
    var dm = dust.mesh(MAT.holo(0.5), true); g.add(dm);
    var light = new THREE.PointLight(0x4fc8ff, 0.5, 2.2); light.position.y = 1.0; g.add(light);
    var kk = 0, wordsT = -99;
    function realWords() {                                                  // the first screen shows today's word when there is one
      try { var E = root.SpatialEC6 && root.SpatialEC6._, w = E && E.wordState(); if (w && w.card) { var m0 = panes[0].material; if (m0.map) m0.map.dispose(); m0.map = screenTex(['TODAY', String(w.card.title).toUpperCase(), w.left + ' LEFT']); } } catch (e) {}
    }
    return {
      id: 'holoDesk', name: '全息操作台', en: 'Holo Typography Lab', icon: '◈', feature: 'holo', anchor: 'floor.holo', group: g, startStashed: true,
      hit: hitBox(g, -0.42, 0, -0.3, 0.42, 1.35, 0.3), label: [0, 1.45, 0],
      focus: { pos: [0.35, 1.55, 1.05], look: [1.6, 1.0, 1.05] },
      panel: function () { return new Promise(function (res) { if (root.SpatialHoloLab) root.SpatialHoloLab.open(res); else res(null); }); },
      set: function (k) { kk = k; var e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; beam.material.opacity = 0.07 + 0.25 * e; proj.scale.setScalar(1 + 0.35 * e); light.intensity = 0.5 + 1.5 * e; },
      idle: function (t) {
        rings[0].rotation.z = t * 0.6; rings[1].rotation.z = -t * 0.9; rings[2].rotation.z = t * 0.35; core.rotation.y = t * 0.8; core.rotation.x = t * 0.3;
        panes.forEach(function (p, k) { p.position.y = 0.05 + (k === 1 ? 0.12 : 0) + Math.sin(t * 1.4 + k * 2) * 0.012; p.material.opacity = 0.75 + 0.15 * Math.sin(t * 9 + k) * Math.sin(t * 2.1); });
        proj.rotation.y = Math.sin(t * 0.25) * 0.4; dm.rotation.y = t * 0.15; emitter.material.opacity = 0.75 + 0.2 * Math.sin(t * 3);
        if (t - wordsT > 20) { wordsT = t; realWords(); }
      }
    };
  }

  function make(opts) {
    var style = opts && opts.medal === 'wall' ? 'wall' : 'box';
    return [backpack(), gramophone(), filmProjector(), tsqPortal(), holoDesk(), aquarium(), quill(), mochi(), carKey(), style === 'wall' ? medalBoard() : medalBox(), bookstand(), carModel()];
  }
  root.SpatialEntries = { make: make, routineCard: routineCard, ringsDay: ringsDay };
})(window);
