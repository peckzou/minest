/* Clun 室内 2.0 · 一家五口（2026-11-23）。
   Rooms 2.0 里设计的五个角色（../rooms/family.js：Peck 爸爸、Cece 妈妈、Joy 哥哥、Luke 弟弟、小白比熊），默认就在 Clun 小屋的客厅里：
   像拍全家福那样站着，朝着从门厅进来的人；有呼吸、晃动，走近时会转头看你，偶尔挥手，Luke 和小狗会蹦一下。点一个：转过来挥手，
   下面出一张小卡片说是谁。和 v2-objects.js 一样挂在场景根上、跟着房子的矩阵，只在进屋走动时显示，1.0 的文件不改。 */
(function () {
  'use strict';
  var C = window.Clun, V2 = C && C.V2, THREE = window.THREE, F = window.SpatialFamily;
  if (!V2 || !THREE || !F || !F.person) return;
  var PI = Math.PI;
  function X() { return C._explore; }
  function exploring() { var x = X(); return !!(x && x.st && x.st.last && performance.now() / 1000 - x.st.last < 2.5); }

  /* 客厅中间偏门厅的一块空地（工程坐标：x、y 是地面，z 朝上；家具的模型都是米） */
  var room = V2.room('drawing'); if (!room) return;
  var sx = 0, sy = 0; room.poly.forEach(function (q) { sx += q[0]; sy += q[1]; });
  var cx = sx / room.poly.length, cy = sy / room.poly.length;
  /* 站位：父母在后，两个孩子和小狗在前，都朝 +X（门厅那边）。模型空间 Y 朝上、正面 +Z：外层转 x 90° 变成工程坐标 */
  var SPOT = { peck: [-0.35, 0.38], cece: [-0.35, -0.32], joy: [0.25, 0.48], luke: [0.3, -0.1], bichon: [0.55, -0.45] };
  var wrap = new THREE.Group(); wrap.rotation.x = PI / 2;
  var root = new THREE.Group(); root.name = 'clun2-family'; root.matrixAutoUpdate = false; root.add(wrap);
  var M = F.people.map(function (S, n) { return { spec: S, rig: F.person(S), walk: n * 1.3, ph0: n * 1.7, waveT: 0, hopT: 0, idle: 0, sit: 0 }; });
  M.push({ spec: F.dog, rig: F.bichon(), walk: 0, ph0: 0, waveT: 0, hopT: 0, idle: 0, sit: 0 });
  M.forEach(function (m) {
    var p = SPOT[m.spec.id] || [0, 0];
    m.x = cx + p[0]; m.z = -(cy + p[1]); m.yaw = PI / 2;                  /* 模型空间：x 同工程 x，z = -工程 y */
    m.rig.root.position.set(m.x, room.z || 0, m.z); m.rig.root.rotation.y = m.yaw; m.rig.root.userData.member = m;
    if (m.rig.label) m.rig.label.visible = false;                         /* 名牌只在点了以后的卡片里出现 */
    wrap.add(m.rig.root);
  });

  var attached = false, last = performance.now(), cam = { x: 0, y: 1.6, z: 0 }, V = new THREE.Vector3();
  function tick(now) {
    requestAnimationFrame(tick);
    var dt = Math.min(0.05, (now - last) / 1000); last = now;
    var x = X(); if (!x || !x.house) return;
    if (!attached && x.house.parent) { var top = x.house; while (top.parent) top = top.parent; top.add(root); attached = true; }
    x.house.updateMatrixWorld(); root.matrix.copy(x.house.matrixWorld); root.matrixWorldNeedsUpdate = true;
    var inside = exploring(); root.visible = inside; if (!inside) return;
    var t = now / 1000, me = x.house.worldToLocal(V.copy(x.st.pos)); cam.x = me.x; cam.y = me.z - (room.z || 0); cam.z = -me.y;   /* 人在模型空间里的位置（高度从地板算）：头会转过来看你 */
    M.forEach(function (m) {
      m.moving = false;
      if (!m.spec.dog && m.waveT <= 0) { var d = Math.hypot(cam.x - m.x, cam.z - m.z); if (d < 2.6 && t - (m.lastWave || -99) > 16) { m.lastWave = t; m.waveT = 1.6; } }
      if (m.spec.dog || m.spec.hop) { if (!m.nextHop) m.nextHop = t + 4 + Math.random() * 6; if (t > m.nextHop) { m.hopT = 0.7; m.nextHop = t + 6 + Math.random() * 8; } }
      if (m.spec.dog) F.poseDog(m, t, dt); else F.posePerson(m, t, dt, cam);
    });
  }
  requestAnimationFrame(tick);

  /* 点一个：转过来挥手（小狗蹦一下），下面出一张卡片 */
  var ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), down = null;
  function view() { return V2.things && V2.things.view; }
  document.addEventListener('pointerdown', function (e) { down = e.target && e.target.tagName === 'CANVAS' ? { x: e.clientX, y: e.clientY, t: Date.now(), id: e.pointerId } : null; }, true);
  document.addEventListener('pointerup', function (e) {
    var d = down; down = null; if (!d || d.id !== e.pointerId || Math.abs(e.clientX - d.x) + Math.abs(e.clientY - d.y) > 7 || Date.now() - d.t > 450) return;
    var vw = view(), camera = vw && vw.camera; if (!camera || !root.visible) return;
    var r = e.target.getBoundingClientRect(); ndc.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, camera);
    root.updateMatrixWorld(true);
    var h = ray.intersectObject(root, true).filter(function (q) { return q.object.isMesh && !q.object.userData.ink; })[0]; if (!h || h.distance > 6) return;
    var m = null; for (var o = h.object; o; o = o.parent) if (o.userData && o.userData.member) { m = o.userData.member; break; }
    if (!m) return;
    e.stopPropagation();
    if (m.spec.dog) m.hopT = 0.7; else m.waveT = 2.2;
    F.show(m);
  }, true);
  V2.family = { members: M, group: root };
})();
