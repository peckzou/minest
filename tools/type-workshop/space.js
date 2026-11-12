/* Magic Type Workshop · Phase 6 — the neon display space behind the room's portal.
   A tall dark rotunda; every item the workshop made hangs as a neon word on a rising spiral (1 m … 14 m), so flying is
   the way to see it. Flight is on from the start (✈ toggles walking). Back: the return portal behind you, the ↩ button
   or Esc — the room underneath was never left (the walk-in keeps its state; this is an overlay over it).
   Uses the page's own THREE (r128) and MinestNeonWord; its own renderer, released on close. */
(function () {
  if (window.MinestNeonSpace) return;
  var ov = null, R = null, raf = 0, keys = {}, offs = [];
  var CSS = '.mn-nsp{position:fixed;inset:0;z-index:2147483640;background:#05030c;touch-action:none;user-select:none;-webkit-user-select:none}' +
    '.mn-nsp canvas{display:block;width:100%;height:100%}' +
    '.mn-nsp .nb{position:absolute;font:600 14px/1 -apple-system,system-ui,sans-serif;color:#fde7ff;background:rgba(40,10,60,.62);border:1px solid rgba(255,120,240,.45);border-radius:12px;padding:10px 14px;backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px)}' +
    '.mn-nsp .nb.on{background:rgba(255,90,230,.4)}' +
    '.mn-nsp .back{top:max(14px,env(safe-area-inset-top));left:14px}.mn-nsp .fly{top:max(14px,env(safe-area-inset-top));right:14px}' +
    '.mn-nsp .ttl{position:absolute;top:max(18px,env(safe-area-inset-top));left:50%;transform:translateX(-50%);font:600 13px/1.3 -apple-system,system-ui,sans-serif;color:rgba(253,231,255,.8);text-align:center;pointer-events:none;letter-spacing:.06em}' +
    '.mn-nsp .pad{position:absolute;bottom:max(18px,env(safe-area-inset-bottom));display:grid;gap:8px}' +
    '.mn-nsp .pad.l{left:16px;grid-template-columns:repeat(3,52px)}.mn-nsp .pad.r{right:16px;grid-template-columns:52px}' +
    '.mn-nsp .pad .nb{position:static;width:52px;height:52px;padding:0;font-size:20px;display:flex;align-items:center;justify-content:center}' +
    '.mn-nsp .tip{position:absolute;bottom:max(90px,calc(env(safe-area-inset-bottom) + 90px));left:50%;transform:translateX(-50%);font:13px/1.4 -apple-system,system-ui,sans-serif;color:rgba(253,231,255,.7);text-align:center;pointer-events:none;transition:opacity .6s}';
  function css() { if (document.getElementById('mn-nsp-css')) return; var s = document.createElement('style'); s.id = 'mn-nsp-css'; s.textContent = CSS; document.head.appendChild(s); }

  function gridTex(T) {
    var c = document.createElement('canvas'); c.width = c.height = 256; var x = c.getContext('2d');
    x.fillStyle = '#07040f'; x.fillRect(0, 0, 256, 256); x.strokeStyle = 'rgba(255,90,230,.55)'; x.lineWidth = 2; x.strokeRect(1, 1, 254, 254);
    x.strokeStyle = 'rgba(90,120,255,.25)'; x.lineWidth = 1; x.beginPath(); x.moveTo(128, 0); x.lineTo(128, 256); x.moveTo(0, 128); x.lineTo(256, 128); x.stroke();
    var t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(24, 24); return t;
  }
  function ring(T, r, y, col, op) {
    var m = new T.Mesh(new T.TorusGeometry(r, .05, 8, 120), new T.MeshBasicMaterial({ color: col, transparent: true, opacity: op || .9, toneMapped: false }));
    m.rotation.x = Math.PI / 2; m.position.y = y; return m;
  }

  function open(o) {
    var T = window.THREE; if (!T || ov) return false; o = o || {}; css();
    ov = document.createElement('div'); ov.className = 'mn-nsp';
    ov.innerHTML = '<button type="button" class="nb back" data-n="back">↩ 返回房间 · Back</button>' +
      '<button type="button" class="nb fly on" data-n="fly">✈ 飞行 · Fly</button>' +
      '<div class="ttl">NEON HALL · 霓虹展示空间<br><span style="opacity:.6;font-weight:400">' + (o.items && o.items.length ? o.items.length + ' 件作品 · works' : '还没有作品 · no works yet') + '</span></div>' +
      '<div class="pad l"><span></span><button type="button" class="nb" data-k="w">▲</button><span></span><button type="button" class="nb" data-k="a">◀</button><button type="button" class="nb" data-k="s">▼</button><button type="button" class="nb" data-k="d">▶</button></div>' +
      '<div class="pad r"><button type="button" class="nb" data-k=" ">⤒</button><button type="button" class="nb" data-k="shift">⤓</button></div>' +
      '<div class="tip">拖动看四周 · WASD / 方向键移动 · Space 上升 · Shift 下降<br>飞到高处看文字 · 走进身后的门回到房间</div>';
    document.body.appendChild(ov);
    var W = innerWidth, H = innerHeight, rd = new T.WebGLRenderer({ antialias: true });
    rd.setPixelRatio(Math.min(2, devicePixelRatio || 1)); rd.setSize(W, H); ov.insertBefore(rd.domElement, ov.firstChild);
    var S = new T.Scene(); S.background = new T.Color('#05030c'); S.fog = new T.FogExp2('#05030c', .028);
    var cam = new T.PerspectiveCamera(70, W / H, .05, 200);
    S.add(new T.HemisphereLight('#6a4cff', '#200814', .55));
    // the hall: floor grid, rings of light up the wall, a dome glow
    var floor = new T.Mesh(new T.CircleGeometry(30, 64), new T.MeshBasicMaterial({ map: gridTex(T) })); floor.rotation.x = -Math.PI / 2; S.add(floor);
    for (var i = 0; i < 8; i++) S.add(ring(T, 18, 1 + i * 2.2, i % 2 ? '#5a7bff' : '#ff5ae6', .55 - i * .04));
    var wall = new T.Mesh(new T.CylinderGeometry(18.4, 18.4, 20, 64, 1, true), new T.MeshBasicMaterial({ color: '#0d0820', side: T.BackSide })); wall.position.y = 10; S.add(wall);
    var halo = ring(T, 3, 17.5, '#fde7ff', .7); S.add(halo);
    // the works: a rising spiral, each word turned to face the centre
    var its = (o.items || []).slice(0, 60), words = [];
    its.forEach(function (it, k) {
      var g = window.MinestNeonWord ? MinestNeonWord.build(T, it.word, { gas: it.look && it.look.gas, height: .7, light: its.length <= 6 }) : null; if (!g) return;
      var a = k * 0.62, rr = 8 + (k % 3) * 2.2, y = 1 + (k / Math.max(1, its.length - 1)) * 13 * (its.length > 1 ? 1 : 0);
      g.position.set(Math.cos(a) * rr, y, Math.sin(a) * rr); g.lookAt(0, y, 0); S.add(g); words.push(g);
    });
    // the way back: a portal arch behind the spawn point
    var back = new T.Group(), arch = new T.CatmullRomCurve3([[-0.7, 0], [-0.7, 2.2], [0, 2.75], [0.7, 2.2], [0.7, 0]].map(function (q) { return new T.Vector3(q[0], q[1], 0); }), false, 'centripetal', .4);
    back.add(new T.Mesh(new T.TubeGeometry(arch, 60, .05, 8, false), new T.MeshBasicMaterial({ color: '#7cf3ff', toneMapped: false })));
    var veil = new T.Mesh(new T.PlaneGeometry(1.3, 2.5), new T.MeshBasicMaterial({ color: '#7cf3ff', transparent: true, opacity: .16, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide })); veil.position.y = 1.2; back.add(veil);
    back.position.set(0, 0, 4.2); S.add(back);
    var me = { x: 0, y: 1.6, z: 1.5, yaw: 0, pitch: .12, fly: true, vy: 0 }, last = 0, t0 = performance.now();
    function key(e, on) { var k = (e.key || '').toLowerCase(); if (k === 'escape' && on) { close(); } if (/^(w|a|s|d|arrowup|arrowdown|arrowleft|arrowright| |shift|f)$/.test(k)) { keys[k] = on; e.preventDefault(); } e.stopPropagation(); if (k === 'f' && on) toggleFly(); }
    var kd = function (e) { key(e, true); }, ku = function (e) { key(e, false); };
    window.addEventListener('keydown', kd, true); window.addEventListener('keyup', ku, true);   // capture: the room under us must not walk
    offs.push(function () { window.removeEventListener('keydown', kd, true); window.removeEventListener('keyup', ku, true); });
    function toggleFly() { me.fly = !me.fly; me.vy = 0; ov.querySelector('[data-n=fly]').classList.toggle('on', me.fly); }
    var drag = null;
    ov.addEventListener('pointerdown', function (e) {
      var b = e.target.closest('button'); if (b) { if (b.dataset.k) { keys[b.dataset.k] = true; b.setPointerCapture && b.setPointerCapture(e.pointerId); } return; }
      drag = { x: e.clientX, y: e.clientY, yaw: me.yaw, pitch: me.pitch }; ov.querySelector('.tip').style.opacity = 0;
    });
    ov.addEventListener('pointermove', function (e) { if (!drag) return; me.yaw = drag.yaw + (e.clientX - drag.x) * .005; me.pitch = Math.max(-1.3, Math.min(1.3, drag.pitch + (e.clientY - drag.y) * .005)); });
    var up = function (e) { drag = null; var b = e.target.closest && e.target.closest('button'); if (b && b.dataset.k) keys[b.dataset.k] = false; };
    ov.addEventListener('pointerup', up); ov.addEventListener('pointercancel', up);
    ov.addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; if (b.dataset.n === 'back') close(); if (b.dataset.n === 'fly') toggleFly(); });
    var rs = function () { W = innerWidth; H = innerHeight; rd.setSize(W, H); cam.aspect = W / H; cam.updateProjectionMatrix(); };
    window.addEventListener('resize', rs); offs.push(function () { window.removeEventListener('resize', rs); });
    function frame(now) {
      raf = requestAnimationFrame(frame); var dt = Math.min(.05, (now - (last || now)) / 1000); last = now; var t = (now - t0) / 1000;
      var fw = (keys.w || keys.arrowup ? 1 : 0) - (keys.s || keys.arrowdown ? 1 : 0), st = (keys.d || keys.arrowright ? 1 : 0) - (keys.a || keys.arrowleft ? 1 : 0), sp = me.fly ? 6 : 3.4;
      var sx = Math.sin(me.yaw), cz = Math.cos(me.yaw);
      me.x += (-sx * fw + cz * st) * sp * dt; me.z += (-cz * fw - sx * st) * sp * dt;
      var rr = Math.hypot(me.x, me.z); if (rr > 17) { me.x *= 17 / rr; me.z *= 17 / rr; }
      if (me.fly) me.y += ((keys[' '] ? 1 : 0) - (keys.shift ? 1 : 0)) * 4.5 * dt;
      else { me.vy -= 18 * dt; me.y += me.vy * dt; if (keys[' '] && me.y <= 1.61) me.vy = 6; }
      me.y = Math.max(1.6, Math.min(19, me.y));
      cam.position.set(me.x, me.y, me.z); cam.rotation.order = 'YXZ'; cam.rotation.y = me.yaw; cam.rotation.x = -me.pitch;
      words.forEach(function (g, k) { g.userData.tick(t); g.position.y += Math.sin(t * .8 + k) * .002; });
      halo.rotation.z = t * .2; veil.material.opacity = .14 + .05 * Math.sin(t * 3);
      // stepping into the return arch (low, within its width) takes you back
      if (t > 1.2 && me.y < 3.2 && Math.abs(me.x) < .65 && Math.abs(me.z - 4.2) < .3) close();
      rd.render(S, cam);
    }
    raf = requestAnimationFrame(frame);
    R = { rd: rd, S: S };
    return true;
  }
  function close() {
    if (!ov) return; cancelAnimationFrame(raf); offs.forEach(function (f) { try { f(); } catch (e) {} }); offs = []; keys = {};
    try { R.S.traverse(function (o) { if (o.geometry) o.geometry.dispose(); if (o.material) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); } }); R.rd.dispose(); R.rd.forceContextLoss && R.rd.forceContextLoss(); } catch (e) {}
    ov.remove(); ov = null; R = null;
  }
  window.MinestNeonSpace = { open: open, close: close, isOpen: function () { return !!ov; } };
})();
