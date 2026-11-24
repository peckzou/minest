/* Minest Imagineer Building · 造梦大楼 — in the park (2026-11-24).
 * The building stands on the lawn east of the entrance walk, a paved path leading from the walk to its doors. Walk up
 * and the doors open; walk in (or press E / tap the prompt at the doors) and 1401 Flower Street opens over the park
 * (../dream-workshop/wed-studio/index.html?from=park&enter=1 — the guest is already inside, in the lobby). Leaving
 * the building (its building icon, or 🏰 here) puts the guest back on the path outside the doors.
 * The 🏢 button beside the park's other entries walks the guest to the building. */
(function (root) {
  'use strict';
  var AT = { x: 306, z: 545 }, FRONT = 9;            /* the building's middle; its front wall is FRONT metres towards the walk (−x) */
  var DOOR = { x: AT.x - FRONT, z: AT.z }, WALK_X = 276;
  var API = null, T = null, leaves = [], flag = null, greeter = null, ov = null, prompt = null, cool = 0, clock = 0;

  function tex(w, h, draw) { var c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); var t = new T.CanvasTexture(c); t.anisotropy = 4; return t; }
  function build() {
    var g = new T.Group(), y0 = API.groundY(AT.x, AT.z, 60);
    g.position.set(AT.x, y0, AT.z); g.rotation.y = -Math.PI / 2;      /* local +z is the front, facing the entrance walk */
    var M = function (c) { return new T.MeshLambertMaterial({ color: c }); };
    var cream = M(0xf2e6cf), trim = M(0xb23a2e), gold = M(0xfbbf24), dark = M(0x2a1c12);
    function box(w, h, d, m, x, y, z) { var o = new T.Mesh(new T.BoxGeometry(w, h, d), m); o.position.set(x, y, z); g.add(o); return o; }
    var W = 30, D = 18, H = 7.6;
    box(W + 1.2, 0.4, D + 1.2, M(0xa39680), 0, 0.2, 0);                                   /* the plinth */
    /* the body, with the lobby hollowed out behind the doors — so the moment the doors open, the inside is there */
    var LW = 12, LD = 6.3, LZ = D / 2 - 0.6 - LD;                                          /* the lobby: its width, its depth, its back wall */
    box(W, H, LZ + D / 2 - 0.3, cream, 0, 0.4 + H / 2, (LZ - D / 2 + 0.3) / 2);
    [-1, 1].forEach(function (s) { box((W - LW) / 2, H, LD, cream, s * (LW / 2 + (W - LW) / 4), 0.4 + H / 2, LZ + LD / 2); });
    box(LW, H - 3.9, LD, cream, 0, 0.4 + 3.9 + (H - 3.9) / 2, LZ + LD / 2);              /* over the lobby's ceiling */
    var B = function (c) { return new T.MeshBasicMaterial({ color: c }); };
    function inside(w, h, m, x, y, z, rx, ry) { var o = new T.Mesh(new T.PlaneGeometry(w, h), m); o.position.set(x, y, z); o.rotation.set(rx || 0, ry || 0, 0); g.add(o); return o; }
    inside(LW, LD, B(0x8c7358), 0, 0.42, LZ + LD / 2, -Math.PI / 2);                       /* floor */
    inside(5.4, 3.6, B(0x8a1f2d), 0, 0.43, LZ + LD / 2 + 0.4, -Math.PI / 2); inside(4.8, 3.0, B(0xa8343f), 0, 0.44, LZ + LD / 2 + 0.4, -Math.PI / 2);
    inside(LW, LD, B(0xf4efe4), 0, 0.4 + 3.88, LZ + LD / 2, Math.PI / 2);                  /* ceiling */
    inside(LD, 3.5, B(0xded6c6), -LW / 2 + 0.02, 0.4 + 1.75, LZ + LD / 2, 0, Math.PI / 2); inside(LD, 3.5, B(0xded6c6), LW / 2 - 0.02, 0.4 + 1.75, LZ + LD / 2, 0, -Math.PI / 2);
    /* the far wall: the way on into the Monorail Hallway in the middle, the WED plate and a painting either side */
    inside(LW, 3.5, new T.MeshBasicMaterial({ map: tex(1024, 300, function (c, w, h) {
      c.fillStyle = '#e9e2d3'; c.fillRect(0, 0, w, h); c.fillStyle = '#4a3526'; c.fillRect(0, h - 14, w, 14);
      var x0 = w / 2 - 110, x1 = w / 2 + 110, y0 = 60; c.fillStyle = '#5a3d28'; c.fillRect(x0 - 12, y0 - 12, 244, h - y0 + 12);
      var gr = c.createLinearGradient(0, y0, 0, h); gr.addColorStop(0, '#cfc7b6'); gr.addColorStop(1, '#bdb4a2'); c.fillStyle = gr; c.fillRect(x0, y0, 220, h - y0);
      c.fillStyle = '#39506b'; c.beginPath(); c.moveTo(x0, h); c.lineTo(x1, h); c.lineTo(w / 2 + 40, 190); c.lineTo(w / 2 - 40, 190); c.fill();
      c.fillStyle = '#a8343f'; c.beginPath(); c.moveTo(w / 2 - 50, h); c.lineTo(w / 2 + 50, h); c.lineTo(w / 2 + 16, 190); c.lineTo(w / 2 - 16, 190); c.fill();
      c.fillStyle = '#f4f6f8'; c.fillRect(x0, 150, 220, 22); c.fillStyle = '#d0262d'; c.fillRect(x0, 164, 220, 8);
      ['#2a1f6b', '#60a5fa', '#0f5a66'].forEach(function (col, i) { c.fillStyle = '#c9a24a'; c.fillRect(x0 + 14 + i * 68, 84, 56, 44); c.fillStyle = col; c.fillRect(x0 + 19 + i * 68, 89, 46, 34); });
      c.fillStyle = '#fff4c2'; c.beginPath(); c.arc(w / 2, 76, 9, 0, 7); c.fill();
      c.fillStyle = '#1e2a4a'; c.fillRect(70, 70, 300, 120); c.fillStyle = '#fde68a'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = '700 64px Georgia, serif'; c.fillText('WED', 220, 116); c.fillStyle = '#fff'; c.font = '600 17px sans-serif'; c.fillText('1401 FLOWER STREET', 220, 164);
      c.fillStyle = '#c9a24a'; c.fillRect(680, 62, 260, 160); var sk = c.createLinearGradient(0, 70, 0, 214); sk.addColorStop(0, '#0b1238'); sk.addColorStop(0.6, '#7a3f8f'); sk.addColorStop(1, '#f08a6b'); c.fillStyle = sk; c.fillRect(690, 72, 240, 140);
      c.fillStyle = '#f3e9f5'; [[790, 60], [810, 86], [830, 60], [770, 46], [850, 46]].forEach(function (q) { c.fillRect(q[0] - 7, 212 - q[1], 14, q[1]); c.beginPath(); c.moveTo(q[0] - 11, 212 - q[1]); c.lineTo(q[0], 212 - q[1] - 22); c.lineTo(q[0] + 11, 212 - q[1]); c.fillStyle = '#3b5fc4'; c.fill(); c.fillStyle = '#f3e9f5'; }); c.fillRect(760, 180, 100, 32);
    }) }), 0, 0.4 + 1.75, LZ + 0.02);
    box(3.4, 1.05, 0.9, B(0x4a3526), 3.2, 0.4 + 0.52, LZ + 2.0); box(3.6, 0.07, 1.1, B(0xd9b25a), 3.2, 0.4 + 1.08, LZ + 2.0);   /* the reception desk */
    box(2.4, 0.42, 0.9, B(0x2f5a6b), -4.2, 0.4 + 0.3, LZ + 2.6); box(2.4, 0.5, 0.2, B(0x284c5a), -4.2, 0.4 + 0.72, LZ + 2.2);        /* the sofa */
    [-3, 3].forEach(function (x) { var l = new T.Mesh(new T.SphereGeometry(0.2, 12, 10), B(0xfff4c2)); l.position.set(x, 0.4 + 3.6, LZ + LD / 2); g.add(l); });
    try { var host = root.DWModels.figure({ height: 1.66, coat: '#1f4f9a', hair: '#3a2a20', shirt: '#f2efe6' }); host.position.set(3.2, 0.42, LZ + 1.2); host.traverse(function (o) { if (o.isMesh) o.material = B(o.material.color.getHex()); }); if (host.userData.rig) { host.userData.rig.armR.rotation.x = -2.6; host.userData.rig.armR.rotation.z = 0.3; } g.add(host); greeter = host.userData.rig || null; } catch (e) {}
    [-1, 1].forEach(function (s) { box((W - 2.8) / 2, H, 0.6, cream, s * (1.4 + (W - 2.8) / 4), 0.4 + H / 2, D / 2 - 0.3); });
    box(2.8, H - 3.4, 0.6, cream, 0, 0.4 + 3.4 + (H - 3.4) / 2, D / 2 - 0.3);            /* over the doors */
    box(W + 1.6, 0.6, D + 1.6, trim, 0, 0.4 + H + 0.3, 0);                                /* the cornice */
    box(W - 2, 0.5, D - 2, M(0xe9dcc2), 0, 0.4 + H + 0.8, 0);
    [-10.5, -6.2, 6.2, 10.5].forEach(function (x) { box(2.6, 2.0, 0.1, M(0xbfe6ff), x, 0.4 + 3.0, D / 2 + 0.02); box(3.0, 0.2, 0.3, trim, x, 0.4 + 1.9, D / 2 + 0.1); box(3.0, 0.2, 0.3, trim, x, 0.4 + 4.1, D / 2 + 0.1); });
    [-2.2, 2.2].forEach(function (x) { var c = new T.Mesh(new T.CylinderGeometry(0.28, 0.32, 3.9, 12), cream); c.position.set(x, 0.4 + 1.95, D / 2 + 0.9); g.add(c); });
    box(6.2, 0.35, 2.4, trim, 0, 0.4 + 4.05, D / 2 + 0.9);                                /* the porch roof */
    box(6.4, 0.25, 2.6, M(0xa39680), 0, 0.12, D / 2 + 1.0); box(5.6, 0.25, 0.8, M(0xa39680), 0, 0.12, D / 2 + 2.5);
    var sign = new T.Mesh(new T.PlaneGeometry(17, 3.0), new T.MeshBasicMaterial({ map: tex(1024, 180, function (c, w, h) {
      c.fillStyle = '#1e2a4a'; c.fillRect(0, 0, w, h); c.strokeStyle = '#fbbf24'; c.lineWidth = 10; c.strokeRect(8, 8, w - 16, h - 16);
      c.fillStyle = '#fde68a'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = '700 84px Georgia, serif'; c.fillText('MINEST IMAGINEER', w / 2, 72);
      c.fillStyle = '#fff'; c.font = '700 40px "PingFang SC", sans-serif'; c.fillText('✨ 造 梦 大 楼 ✨', w / 2, 140);
    }) })); sign.position.set(0, 0.4 + H + 2.7, D / 2 - 1.5); g.add(sign);
    box(17.4, 3.4, 0.3, M(0x15203a), 0, 0.4 + H + 2.7, D / 2 - 1.7);
    [-7.8, 7.8].forEach(function (x) { var p = new T.Mesh(new T.CylinderGeometry(0.12, 0.12, 1.6, 8), gold); p.position.set(x, 0.4 + H + 1.3, D / 2 - 1.6); g.add(p); });
    var pole = new T.Mesh(new T.CylinderGeometry(0.08, 0.08, 5, 8), gold); pole.position.set(12.5, 0.4 + H + 3.2, 0); g.add(pole);
    flag = new T.Mesh(new T.PlaneGeometry(2.4, 1.4, 8, 2), new T.MeshBasicMaterial({ color: 0xec4899, side: T.DoubleSide })); flag.position.set(13.75, 0.4 + H + 4.9, 0); g.add(flag);
    [-1, 1].forEach(function (s) {
      var hinge = new T.Group(); hinge.position.set(s * 1.4, 0.4, D / 2 - 0.05); hinge.userData.dir = s; g.add(hinge);
      var leaf = new T.Mesh(new T.BoxGeometry(1.4, 3.4, 0.12), M(0x2f6b5a)); leaf.position.set(-s * 0.7, 1.7, 0); hinge.add(leaf);
      var knob = new T.Mesh(new T.SphereGeometry(0.1, 10, 8), gold); knob.position.set(-s * 1.2, 1.55, 0.12); hinge.add(knob);
      leaves.push(hinge);
    });
    API.scene.add(g);
    /* the path from the entrance walk to the porch */
    var len = DOOR.x - 3 - WALK_X, path = new T.Mesh(new T.BoxGeometry(len, 0.12, 5), M(0xd9cbb0)); path.position.set(WALK_X + len / 2, y0 + 0.06, AT.z); API.scene.add(path);
    [0.25, 0.75].forEach(function (k) { [-3.2, 3.2].forEach(function (dz) { var post = new T.Mesh(new T.CylinderGeometry(0.08, 0.1, 2.6, 8), M(0x1f2937)); post.position.set(WALK_X + len * k, y0 + 1.3, AT.z + dz); API.scene.add(post); var bulb = new T.Mesh(new T.SphereGeometry(0.22, 10, 8), new T.MeshBasicMaterial({ color: 0xfff4c2 })); bulb.position.set(WALK_X + len * k, y0 + 2.75, AT.z + dz); API.scene.add(bulb); }); });
  }

  /* ---------------------------------------------------------------- going in and coming out */
  function enter(workId, play) {
    if (ov) return; workId = typeof workId === 'string' ? workId : '';
    try { if (document.pointerLockElement && document.exitPointerLock) document.exitPointerLock(); } catch (e) {}
    try { API.setUI(true); } catch (e) {}
    ov = document.createElement('div'); ov.id = 'mn-bld';
    ov.innerHTML = '<iframe src="../dream-workshop/wed-studio/index.html?from=park&enter=1' + (workId ? '&work=' + encodeURIComponent(workId) + (play ? '&play=1' : '') : '') + '" title="Minest Imagineer 造梦大楼" allow="autoplay; fullscreen; microphone"></iframe>' +
      '<button type="button" id="mn-bld-back">🏰 返回迪士尼乐园</button>';
    document.body.appendChild(ov);
    ov.querySelector('#mn-bld-back').onclick = leave;
    var f = ov.querySelector('iframe'); f.addEventListener('load', function () { try { f.contentWindow.focus(); } catch (e) {} });
    showPrompt(false);
  }
  function leave() {
    if (!ov) return;
    ov.remove(); ov = null; cool = 2.5;
    try { API.teleport({ mode: 'walk', p: [DOOR.x - 7, API.groundY(DOOR.x - 7, DOOR.z, 60), DOOR.z], t: [WALK_X, 41.6, DOOR.z] }); } catch (e) {}   /* on the path, the doors behind */
    try { API.setUI(false); } catch (e) {}
    try { root.focus(); } catch (e) {}
    setTimeout(function () { try { if (root.MinestImagineerPark && root.MinestImagineerPark.refresh) root.MinestImagineerPark.refresh(); } catch (e) {} }, 700);   /* what was rebuilt inside is rebuilt out here */
  }
  function goThere() {
    var x = document.getElementById('tp-close-guide'); if (x) x.click();
    API.teleport({ mode: 'walk', p: [WALK_X + 4, API.groundY(WALK_X + 4, DOOR.z, 60), DOOR.z], t: [DOOR.x, 44, DOOR.z] });
    API.toast('🏢 Minest Imagineer 造梦大楼 · 沿着小路走进大门');
  }
  root.addEventListener('message', function (e) { if (e.data && e.data.type === 'minest-building-exit') leave(); });
  document.addEventListener('keydown', function (e) {
    if (ov && e.key === 'Escape') { e.stopPropagation(); leave(); return; }
    if (!ov && e.code === 'KeyE' && near() < 7 && !API.state.activeRide) { e.stopPropagation(); e.preventDefault(); enter(); }
  }, true);

  function near() { var p = API.player.pos; return Math.hypot(p.x - DOOR.x, p.z - DOOR.z); }
  function showPrompt(on) {
    if (!prompt) {
      prompt = document.createElement('button'); prompt.type = 'button'; prompt.id = 'mn-bld-prompt'; prompt.textContent = '🏢 走进造梦大楼 (E)';
      prompt.onclick = function (e) { e.stopPropagation(); enter(); }; document.body.appendChild(prompt);
    }
    prompt.style.display = on ? 'block' : 'none';
  }
  function tick(now) {
    requestAnimationFrame(tick);
    var dt = Math.min(0.05, (now - (tick.last || now)) / 1000); tick.last = now; clock += dt; cool = Math.max(0, cool - dt);
    if (!API || ov || document.hidden) return;
    var d = near(), p = API.player.pos, open = Math.max(0, Math.min(1, (14 - d) / 7));
    leaves.forEach(function (h) { var to = h.userData.dir * open * 1.75; h.rotation.y += (to - h.rotation.y) * Math.min(1, dt * 5); });
    if (flag) flag.rotation.y = Math.sin(clock * 2.2) * 0.35;
    if (greeter) greeter.armR.rotation.z = 0.3 + Math.sin(clock * 6) * 0.3;
    var walking = !API.state.activeRide && !API.state.ui && API.state.mode !== 'tour';
    showPrompt(walking && d < 7);
    /* through the doors: within the doorway, on the building's side of the porch */
    if (walking && !cool && Math.abs(p.z - DOOR.z) < 5.5 && p.x > DOOR.x + 1.6 && p.x < DOOR.x + 7) enter();   /* a couple of steps into the lobby */
  }

  var css = document.createElement('style');
  css.textContent = '#mn-bld{position:fixed;inset:0;z-index:210;background:#10151f;animation:mnPavIn .28s ease}' +
    '#mn-bld iframe{position:absolute;inset:0;width:100%;height:100%;border:0;display:block}' +
    '#mn-bld-back{position:absolute;left:50%;top:calc(env(safe-area-inset-top,0px) + 12px);transform:translateX(-50%);z-index:2;padding:9px 18px;border-radius:999px;border:1.5px solid rgba(251,191,36,.75);background:rgba(15,23,42,.92);color:#fde68a;font:800 13.5px/1 -apple-system,BlinkMacSystemFont,"PingFang SC",sans-serif;cursor:pointer;white-space:nowrap;box-shadow:0 6px 24px rgba(0,0,0,.45)}' +
    '#mn-bld-prompt{display:none;position:fixed;left:50%;bottom:calc(env(safe-area-inset-bottom,0px) + 132px);transform:translateX(-50%);z-index:60;padding:12px 22px;border-radius:999px;border:1.5px solid rgba(255,255,255,.4);background:linear-gradient(135deg,#1e2a4a,#3b5fc4);color:#fde68a;font:800 15px/1 -apple-system,BlinkMacSystemFont,"PingFang SC",sans-serif;cursor:pointer;box-shadow:0 8px 26px rgba(0,0,0,.45)}' +
    '#mn-bld-btn{box-shadow:0 2px 10px rgba(0,0,0,.35);padding:5px 12px;border-radius:999px;background:linear-gradient(135deg,#1e2a4a,#3b5fc4);color:#fde68a;font-weight:900;font-size:11.5px;border:none;cursor:pointer}';
  document.head.appendChild(css);
  function addEntry() {
    var row = document.getElementById('mn-pav-btns');
    if (row && !document.getElementById('mn-bld-btn')) { var b = document.createElement('button'); b.type = 'button'; b.id = 'mn-bld-btn'; b.textContent = '🏢 造梦大楼'; b.onclick = function (e) { e.stopPropagation(); goThere(); }; row.appendChild(b); }
  }
  function attach(api) {
    if (API || !api) return; API = api; T = api.THREE;
    try { build(); } catch (e) { if (root.console) console.warn('[imagineer building]', e); }
    addEntry(); new MutationObserver(addEntry).observe(document.body, { childList: true, subtree: true });
    requestAnimationFrame(tick);
  }
  if (root.TPParkAPI) attach(root.TPParkAPI); else root.addEventListener('tp:park-ready', function (e) { attach(e.detail || root.TPParkAPI); });
  root.MinestImagineerBuilding = { enter: enter, leave: leave, goThere: goThere, door: DOOR, isOpen: function () { return !!ov; } };
})(window);
