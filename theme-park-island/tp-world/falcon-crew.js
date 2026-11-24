/* Millennium Falcon — the crew (2026-11-24): BB-8 at the co-pilot's console, who fires at whatever TIE is locked,
 * and Luke Skywalker in the seat beside the pilot. Both are in the cockpit (falcon.js exposes it as ride.crew). */
(function (root) {
  'use strict';
  function go(API) {
    var ride = API.getProps().rides.falcon_flight; if (!ride || !ride.crew) return; var T = API.THREE, C = ride.crew, g = C.ship.grp, clock = 0, cool = 0, said = {}, shots = 0;
    var M = function (c, e) { var m = new T.MeshLambertMaterial({ color: c, fog: false }); m.emissive = new T.Color(c).multiplyScalar(e == null ? 0.35 : e); return m; }, B = function (c) { return new T.MeshBasicMaterial({ color: c, fog: false }); };
    var add = function (p, geo, m, x, y, z) { var o = new T.Mesh(geo, m); o.position.set(x || 0, y || 0, z || 0); p.add(o); return o; };
    /* BB-8, on the console to the right */
    var bb = new T.Group(); bb.position.set(0.6, -0.5, -1.05); bb.scale.setScalar(0.4); g.add(bb); var white = M(0xf1f5f9), org = M(0xf97316), dark = M(0x1f2937);
    var ball = new T.Group(); ball.position.y = 0.42; bb.add(ball); add(ball, new T.SphereGeometry(0.42, 18, 14), white); [[0, 0, 0.42, 0, 0], [0.42, 0, 0, 0, 1.571], [-0.42, 0, 0, 0, 1.571], [0, 0.42, 0, 1.571, 0]].forEach(function (q) { var r = add(ball, new T.TorusGeometry(0.17, 0.04, 8, 18), org, q[0], q[1], q[2]); r.rotation.set(q[3], q[4], 0); });
    var hd = new T.Group(); hd.position.y = 0.86; bb.add(hd); add(hd, new T.SphereGeometry(0.26, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), white); add(hd, new T.CylinderGeometry(0.265, 0.265, 0.05, 16), org, 0, 0.03, 0); add(hd, new T.SphereGeometry(0.07, 10, 8), dark, 0, 0.12, 0.22); var eye = add(hd, new T.SphereGeometry(0.03, 8, 6), B(0x38bdf8), 0.11, 0.07, 0.23); add(hd, new T.CylinderGeometry(0.006, 0.006, 0.22, 4), dark, -0.08, 0.34, -0.05);
    var arm = add(bb, new T.CylinderGeometry(0.02, 0.02, 0.5, 6), dark, 0.2, 0.5, 0.45); arm.rotation.x = Math.PI / 2; var torch = add(bb, new T.SphereGeometry(0.05, 8, 6), B(0x7dd3fc), 0.2, 0.5, 0.72); torch.visible = false;
    /* Luke, in the seat to the left: tunic, belt, his hand on the console, sandy hair */
    var lk = new T.Group(); lk.position.set(-0.86, -1.12, -1.0); lk.rotation.y = 0.2; g.add(lk); var tunic = M(0xe8dcc0), tan = M(0xc9b08a), skin = M(0xe2b48c, 0.45), hair = M(0xc9a05a), belt = M(0x4a3220);
    add(lk, new T.BoxGeometry(0.4, 0.5, 0.24), tunic, 0, 0.92, 0); add(lk, new T.BoxGeometry(0.42, 0.06, 0.26), belt, 0, 0.7, 0); add(lk, new T.BoxGeometry(0.36, 0.16, 0.5), tan, 0, 0.56, -0.2); [-0.13, 0.13].forEach(function (x) { add(lk, new T.BoxGeometry(0.13, 0.45, 0.14), tan, x, 0.3, -0.42); add(lk, new T.BoxGeometry(0.14, 0.12, 0.26), belt, x, 0.06, -0.46); });
    add(lk, new T.BoxGeometry(0.1, 0.6, 0.02), tunic, 0.08, 0.92, -0.125).rotation.z = -0.5; var aL = new T.Group(); aL.position.set(-0.25, 1.1, 0); lk.add(aL); add(aL, new T.BoxGeometry(0.1, 0.36, 0.12), tunic, 0, -0.18, 0); add(aL, new T.BoxGeometry(0.09, 0.3, 0.1), tunic, 0, -0.34, -0.14).rotation.x = 1.2; add(aL, new T.SphereGeometry(0.055, 8, 6), skin, 0, -0.36, -0.3);
    var aR = new T.Group(); aR.position.set(0.25, 1.1, 0); lk.add(aR); add(aR, new T.BoxGeometry(0.1, 0.36, 0.12), tunic, 0, -0.18, 0); add(aR, new T.BoxGeometry(0.09, 0.3, 0.1), tunic, 0, -0.34, -0.14).rotation.x = 1.2; add(aR, new T.SphereGeometry(0.055, 8, 6), M(0x1f2937), 0, -0.36, -0.3);
    var lh = new T.Group(); lh.position.y = 1.3; lk.add(lh); add(lh, new T.CylinderGeometry(0.05, 0.06, 0.08, 8), skin, 0, -0.08, 0); add(lh, new T.SphereGeometry(0.13, 14, 10), skin, 0, 0.04, 0); var hr = add(lh, new T.SphereGeometry(0.142, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.6), hair, 0, 0.055, 0.005); hr.rotation.x = 0.35; add(lh, new T.BoxGeometry(0.27, 0.16, 0.08), hair, 0, 0.0, 0.1);
    [-0.045, 0.045].forEach(function (x) { add(lh, new T.SphereGeometry(0.016, 6, 5), B(0x1e3a5f), x, 0.05, -0.122); }); add(lh, new T.BoxGeometry(0.05, 0.01, 0.02), M(0x9a4a3a), 0, -0.02, -0.125);
    var sb = new T.Group(); sb.position.set(0.16, 0.66, 0.06); sb.rotation.z = 1.2; lk.add(sb); add(sb, new T.CylinderGeometry(0.018, 0.018, 0.2, 8), M(0x9aa3ad), 0, 0, 0);
    function line(k, icon, who, t) { if (said[k]) return; said[k] = 1; try { API.toast(icon + ' ' + who + '：' + t); var ss = root.speechSynthesis; if (ss && root.SpeechSynthesisUtterance) { var u = new root.SpeechSynthesisUtterance(t); u.lang = 'zh-CN'; u.rate = 1.05; ss.speak(u); } } catch (e) {} }
    function beep() { try { var W = root.TPStarWarsWorkshops; if (W && W.beep) W.beep(true); } catch (e) {} }
    var last = performance.now();
    (function tick(now) { requestAnimationFrame(tick); var dt = Math.min(0.05, (now - last) / 1000); last = now; clock += dt; var on = API.state.activeRide === 'falcon_flight', st = C.st; bb.visible = lk.visible = on; if (!on) { said = {}; shots = 0; return; }
      ball.rotation.x = Math.sin(clock * 3) * 0.2; hd.rotation.y = st.target ? Math.atan2((st.target.x - st.sx) - 0.7, -st.target.z) * -1 : Math.sin(clock * 1.4) * 0.8; eye.visible = Math.sin(clock * 9) > -0.6; lh.rotation.y = Math.sin(clock * 0.6) * 0.35 + (st.target ? 0.2 : 0); aL.rotation.x = Math.sin(clock * 1.1) * 0.06;
      cool -= dt; torch.visible = cool > 0.42; if (cool <= 0 && C.flying() && st.target) { if (C.assist()) { cool = 0.55; shots++; if (shots === 1) { beep(); line('bb', '🟠', 'BB-8', '哔哔——锁定目标！（BB-8 在副驾驶位帮你开火）'); } } else cool = 0.2; }
      if (C.flying()) { if (st.ph === 'launch') line('l1', '🧑', '卢克', '我来了。放松，别只盯着仪表——用心去感受它。'); if (st.ph === 'corellia') line('l2', '🧑', '卢克', 'TIE 战机！稳住，BB-8 会帮你盯着准星。'); if (st.ph === 'train') line('l3', '🧑', '卢克', '对准燃料罐，保持住——就像在家乡打沙鼠一样。'); if (st.ph === 'escape') line('l4', '🧑', '卢克', '歼星舰！贴着它的腹部飞，相信原力。'); }
      if (st.ph === 'landed') line('l5', '🧑', '卢克', '飞得漂亮，孩子。愿原力与你同在。'); if (st.hull <= 40) line('l6', '🧑', '卢克', '船体撑不了多久了，躲开那些炮火！'); })(last);
  }
  if (root.TPParkAPI) go(root.TPParkAPI); else root.addEventListener('tp:park-ready', function (e) { go(e.detail || root.TPParkAPI); });
})(window);
