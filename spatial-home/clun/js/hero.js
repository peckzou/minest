/* Clun · 外景里的小旅人：原创的卡通小人（大头比例、短发、蓝绿短上衣、红围巾、小背包），赛璐璐光照。
   在两点之间的小路上来回走：走到头停下来左右张望，偶尔挥手；围巾和头发随风轻摆。尺寸是真实比例（身高约 1.6 m）。 */
(function () {
  'use strict';
  var C = window.Clun = window.Clun || {};

  function mat(hex, rough) {
    var m = new THREE.MeshStandardMaterial({ color: new THREE.Color(hex).convertSRGBToLinear(), roughness: rough == null ? 0.8 : rough, metalness: 0 });
    return C.Paint.toon(m, { rim: 1.4 });
  }
  function mesh(g, m, x, y, z) { var o = new THREE.Mesh(g, m); o.position.set(x || 0, y || 0, z || 0); o.castShadow = true; return o; }
  function joint(parent, x, y, z) { var g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); return g; }
  /* 一节肢体：从关节往下长 len，上粗 r0 下细 r1 */
  function limb(parent, m, len, r0, r1) { var o = mesh(new THREE.CylinderGeometry(r0, r1, len, 10), m, 0, -len / 2, 0); parent.add(o); return o; }

  C.Hero = {
    build: function () {
      var M = {
        skin: mat(0xf1c39b), hair: mat(0x5a321b, 0.9), tunic: mat(0x1f6f8c), tunicD: mat(0x245a6c), blush: mat(0xf09a8a), shirt: mat(0xf4efe3), pants: mat(0xcfae7a),
        boot: mat(0x6b4429), belt: mat(0x5a3a22), scarf: mat(0xdc5a3c), bag: mat(0x9a6a3c), eye: mat(0x2a2320, 0.4), white: mat(0xffffff, 0.3), mouth: mat(0xb5654f)
      };
      var root = new THREE.Group(), body = joint(root, 0, 0, 0), hips = joint(body, 0, 0.8, 0);
      /* 腿：大腿、小腿、靴子 */
      var legs = [-1, 1].map(function (s) {
        var hip = joint(hips, s * 0.085, -0.02, 0); limb(hip, M.pants, 0.38, 0.075, 0.062);
        var knee = joint(hip, 0, -0.38, 0); limb(knee, M.pants, 0.34, 0.06, 0.05);
        var boot = mesh(new THREE.BoxGeometry(0.12, 0.11, 0.22), M.boot, 0, -0.38, 0.04); knee.add(boot);
        knee.add(mesh(new THREE.CylinderGeometry(0.065, 0.06, 0.12, 10), M.boot, 0, -0.3, 0));
        return { hip: hip, knee: knee };
      });
      /* 上身：上衣（下摆外张）、腰带、领口 */
      var torso = joint(hips, 0, 0, 0);
      torso.add(mesh(new THREE.CylinderGeometry(0.17, 0.215, 0.3, 14), M.tunic, 0, 0.0, 0));
      torso.add(mesh(new THREE.CylinderGeometry(0.155, 0.17, 0.28, 14), M.tunic, 0, 0.28, 0));
      torso.add(mesh(new THREE.CylinderGeometry(0.175, 0.175, 0.05, 14), M.belt, 0, 0.13, 0));
      torso.add(mesh(new THREE.BoxGeometry(0.05, 0.04, 0.02), M.white, 0, 0.13, 0.172));
      torso.add(mesh(new THREE.CylinderGeometry(0.075, 0.09, 0.06, 12), M.shirt, 0, 0.44, 0));
      /* 背包 */
      torso.add(mesh(new THREE.BoxGeometry(0.22, 0.24, 0.1), M.bag, 0, 0.27, -0.2));
      torso.add(mesh(new THREE.BoxGeometry(0.2, 0.06, 0.11), M.belt, 0, 0.37, -0.2));
      /* 围巾：一圈加两条飘带（分节，好让它飘） */
      var ring = mesh(new THREE.TorusGeometry(0.1, 0.04, 8, 16), M.scarf, 0, 0.46, 0); ring.rotation.x = Math.PI / 2; torso.add(ring);
      var tail = [], prev = joint(torso, 0.05, 0.45, -0.1);
      for (var i = 0; i < 4; i++) { var seg = joint(prev, 0, i ? -0.1 : 0, 0); seg.add(mesh(new THREE.BoxGeometry(0.075, 0.11, 0.02), M.scarf, 0, -0.05, 0)); tail.push(seg); prev = seg; }
      /* 手臂：肩、肘、手 */
      var arms = [-1, 1].map(function (s) {
        var sh = joint(torso, s * 0.2, 0.4, 0); sh.add(mesh(new THREE.SphereGeometry(0.065, 10, 8), M.tunic, 0, 0, 0));
        limb(sh, M.tunic, 0.26, 0.058, 0.05);
        var el = joint(sh, 0, -0.26, 0); limb(el, M.shirt, 0.24, 0.046, 0.04);
        el.add(mesh(new THREE.SphereGeometry(0.052, 10, 8), M.skin, 0, -0.27, 0));
        sh.rotation.z = s * 0.2; el.rotation.x = -0.25;
        return { sh: sh, el: el };
      });
      /* 头：脸、大眼睛、头发 */
      var neck = joint(torso, 0, 0.47, 0), head = joint(neck, 0, 0.17, 0);
      neck.add(mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.08, 8), M.skin, 0, 0.03, 0));
      var face = mesh(new THREE.SphereGeometry(0.15, 20, 16), M.skin); face.scale.set(1, 1.05, 0.98); head.add(face);
      [-1, 1].forEach(function (s) {
        var e = mesh(new THREE.SphereGeometry(0.036, 12, 10), M.eye, s * 0.056, -0.005, 0.133); e.scale.set(0.8, 1.35, 0.45); head.add(e);
        var bl = mesh(new THREE.SphereGeometry(0.022, 8, 6), M.blush, s * 0.085, -0.05, 0.125); bl.scale.set(1.3, 0.6, 0.3); head.add(bl);
        var h = mesh(new THREE.SphereGeometry(0.009, 8, 6), M.white, s * 0.055 + 0.01, 0.015, 0.148); head.add(h);
        head.add(mesh(new THREE.SphereGeometry(0.03, 8, 6), M.skin, s * 0.148, -0.01, 0));           /* 耳朵 */
      });
      var mo = mesh(new THREE.SphereGeometry(0.012, 8, 6), M.mouth, 0, -0.07, 0.14); mo.scale.set(1.6, 0.6, 0.5); head.add(mo);
      var hairCap = mesh(new THREE.SphereGeometry(0.162, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.58), M.hair, 0, 0.02, -0.01); head.add(hairCap);
      var tufts = [[-0.08, 0.06, 0.12, -0.5, 0.3], [-0.02, 0.07, 0.14, -0.2, 0.0], [0.05, 0.07, 0.13, 0.25, -0.2], [0.1, 0.04, 0.1, 0.6, -0.4], [-0.12, 0.0, 0.08, -0.9, 0.5], [0.13, 0.0, 0.07, 0.9, -0.5]];
      tufts.forEach(function (t) { var c = mesh(new THREE.ConeGeometry(0.05, 0.13, 8), M.hair, t[0], t[1], t[2]); c.rotation.set(Math.PI - 0.5, 0, t[3] * 0.6); head.add(c); });
      for (i = 0; i < 7; i++) { var a = (i / 7) * Math.PI * 1.2 - Math.PI * 0.1 + Math.PI / 2, c2 = mesh(new THREE.ConeGeometry(0.055, 0.16, 8), M.hair, Math.cos(a) * 0.12, 0.04, -Math.sin(a) * 0.12 - 0.02); c2.rotation.set(-Math.sin(a) * 1.6, 0, Math.cos(a) * 1.6); c2.rotation.x += Math.PI; head.add(c2); }
      [[0, 0.15, -0.02, 0.2], [-0.06, 0.15, 0.03, -0.5], [0.07, 0.14, 0.0, 0.5]].forEach(function (t) { var c3 = mesh(new THREE.ConeGeometry(0.05, 0.14, 8), M.hair, t[0], t[1], t[2]); c3.rotation.z = t[3]; head.add(c3); });
      /* 脚下的软影子 */
      var shadow = new THREE.Mesh(new THREE.CircleGeometry(0.3, 24), new THREE.MeshBasicMaterial({ color: 0x1a2a10, transparent: true, opacity: 0.28, depthWrite: false }));
      shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.01; shadow.scale.set(1, 0.7, 1); root.add(shadow);

      var R = { root: root, body: body, hips: hips, torso: torso, legs: legs, arms: arms, head: head, neck: neck, tail: tail, hair: hairCap };

      /* —— 动画 —— */
      var st = { mode: 'idle', t0: 0, s: 0, dir: 1, walkPhase: 0, idleFor: 2.5, wave: false };
      R.setPath = function (A, B, faceCam) { st.A = A.clone(); st.B = B.clone(); st.cam = faceCam; st.s = 0; root.position.copy(A); };
      function yawTo(v) { return Math.atan2(v.x, v.z); }
      function turnTo(yaw, dt) { var d = yaw - root.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d)); root.rotation.y += d * Math.min(1, dt * 5); }
      R.greet = function () { st.greet = true; };
      /* 进屋探索：由玩家操控。pos = 脚下位置，yaw = 面朝方向（three 的 Y 轴转角），moving = 这一帧在走 */
      R.drive = function (pos, yaw, moving, dt) {
        st.manual = true; root.visible = true; dt = Math.min(dt, 0.05);
        root.position.copy(pos); turnTo(yaw, dt * 3);
        if (moving) {
          st.walkPhase += 1.5 * dt / 0.55 * Math.PI; var ph = st.walkPhase, sw = Math.sin(ph);
          R.legs[0].hip.rotation.x = sw * 0.6; R.legs[1].hip.rotation.x = -sw * 0.6;
          R.legs[0].knee.rotation.x = Math.max(0, -Math.cos(ph)) * 0.75; R.legs[1].knee.rotation.x = Math.max(0, Math.cos(ph)) * 0.75;
          R.arms[0].sh.rotation.x = -sw * 0.5; R.arms[1].sh.rotation.x = sw * 0.5; R.arms[0].el.rotation.x = -0.35; R.arms[1].el.rotation.x = -0.35;
          R.arms[1].sh.rotation.z = 0.2; R.arms[1].el.rotation.z = 0;
          R.hips.position.y = 0.8 + Math.abs(Math.cos(ph)) * 0.035; R.torso.rotation.y = sw * 0.08; R.head.rotation.y = 0;
        } else {
          [0, 1].forEach(function (k) { R.legs[k].hip.rotation.x *= 0.8; R.legs[k].knee.rotation.x *= 0.8; R.arms[k].sh.rotation.x *= 0.8; });
          R.hips.position.y = 0.8; R.torso.rotation.y *= 0.85;
        }
      };
      R.release = function () { st.manual = false; root.visible = true; };
      R.hide = function () { st.manual = true; root.visible = false; };                              /* 展开内屏时：停下来朝镜头挥手 */
      R.update = function (t, dt) {
        if (!st.A || st.manual) return;
        if (st.greet) { st.greet = false; st.mode = 'idle'; st.t0 = t; st.wave = true; st.idleFor = 4.5; }
        dt = Math.min(dt, 0.05);
        var L = st.A.distanceTo(st.B), speed = 0.75;
        var wind = Math.sin(t * 1.7) * 0.5 + Math.sin(t * 3.1) * 0.25;
        R.tail.forEach(function (seg, k) { seg.rotation.x = -0.35 - 0.12 * k + 0.12 * wind * (k + 1) * 0.6; seg.rotation.z = 0.15 * Math.sin(t * 2.3 + k * 0.7); });
        R.hair.rotation.z = 0.02 * Math.sin(t * 2.0);
        if (st.mode === 'walk') {
          st.s = Math.min(1, st.s + speed * dt / L * st.dir * st.dir);
          var p = st.dir > 0 ? st.s : 1 - st.s; root.position.lerpVectors(st.A, st.B, p);
          turnTo(yawTo(st.dir > 0 ? st.B.clone().sub(st.A) : st.A.clone().sub(st.B)), dt);
          st.walkPhase += speed * dt / 0.55 * Math.PI;
          var ph = st.walkPhase, sw = Math.sin(ph);
          R.legs[0].hip.rotation.x = sw * 0.55; R.legs[1].hip.rotation.x = -sw * 0.55;
          R.legs[0].knee.rotation.x = Math.max(0, -Math.cos(ph)) * 0.7; R.legs[1].knee.rotation.x = Math.max(0, Math.cos(ph)) * 0.7;
          R.arms[0].sh.rotation.x = -sw * 0.5; R.arms[1].sh.rotation.x = sw * 0.5; R.arms[0].el.rotation.x = -0.35; R.arms[1].el.rotation.x = -0.35;
          R.hips.position.y = 0.8 + Math.abs(Math.cos(ph)) * 0.035; R.torso.rotation.y = sw * 0.08; R.head.rotation.y = -sw * 0.05; R.head.rotation.x = 0;
          if (st.s >= 1) { st.mode = 'idle'; st.t0 = t; st.idleFor = 3 + Math.random() * 2; st.wave = !st.wave; st.s = 0; st.dir = -st.dir; }
        } else {
          var it = t - st.t0;
          [0, 1].forEach(function (k) { R.legs[k].hip.rotation.x *= 0.85; R.legs[k].knee.rotation.x *= 0.85; });
          R.hips.position.y = 0.8 + Math.sin(t * 2.2) * 0.006; R.torso.rotation.y *= 0.9;
          if (st.cam) turnTo(yawTo(st.cam.clone().sub(root.position)), dt * 0.6);   /* 停下来时转身朝镜头 */
          R.head.rotation.y = Math.sin(it * 1.3) * 0.5 * Math.min(1, it); R.head.rotation.x = -0.05 + Math.sin(it * 0.9) * 0.06;
          R.arms[0].sh.rotation.x *= 0.85; R.arms[0].el.rotation.x = -0.25;
          if (st.wave && it > 0.6 && it < 2.6) {                                     /* 挥手 */
            var w = Math.min(1, (it - 0.6) * 3) * Math.min(1, (2.6 - it) * 3);
            R.arms[1].sh.rotation.z = 0.2 + w * 2.4; R.arms[1].sh.rotation.x = -w * 0.2; R.arms[1].el.rotation.z = w * (0.4 + 0.35 * Math.sin(it * 10));
          } else { R.arms[1].sh.rotation.z += (0.2 - R.arms[1].sh.rotation.z) * 0.15; R.arms[1].sh.rotation.x *= 0.85; R.arms[1].el.rotation.z *= 0.85; R.arms[1].el.rotation.x = -0.25; }
          if (it > st.idleFor) { st.mode = 'walk'; R.arms[1].sh.rotation.z = 0.2; R.arms[1].el.rotation.z = 0; }
        }
      };
      return R;
    }
  };
})();
