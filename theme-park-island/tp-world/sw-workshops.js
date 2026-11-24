/* Star Wars: Galaxy's Edge — two workshops to make things in (2026-11-24).
 * Droid Depot (机器人工坊): choose a body (an astromech like R2, or a ball droid like BB), a colour and a head, and
 * the droid is built on the bench — then it rolls after you through the park, beeping. Savi's bench (光剑工坊): choose
 * a kyber crystal and a hilt, and the lightsaber is in your hand (L switches the blade on and off).
 * Both stand on the Docking Bay 5 plaza; walk up and press E. What you made is kept on this device ('tp.sw'). */
(function (root) {
  'use strict';
  var API = null, T = null, st = { droid: null, saber: null }, droid = null, saber = null, clock = 0, ui = null;
  var DEPOT = { x: 134, z: 102 }, SAVI = { x: 118, z: 102 };
  var COLS = [['#2563eb', '蓝'], ['#f97316', '橙'], ['#dc2626', '红'], ['#16a34a', '绿'], ['#7c3aed', '紫'], ['#f8fafc', '白']];
  var KYBER = [['#3b82f6', '蓝'], ['#22c55e', '绿'], ['#a855f7', '紫'], ['#ef4444', '红'], ['#facc15', '黄'], ['#f8fafc', '白']];
  try { st = JSON.parse(localStorage.getItem('tp.sw') || 'null') || st; } catch (e) {}
  function save() { try { localStorage.setItem('tp.sw', JSON.stringify(st)); } catch (e) {} }
  var L = function (c, o) { return new T.MeshLambertMaterial(Object.assign({ color: c }, o || {})); };

  function buildDroid(d) {
    var g = new T.Group(), white = L(0xf1f5f9), col = L(d.color), dark = L(0x1f2937);
    if (d.body === 'bb') {
      var ball = new T.Mesh(new T.SphereGeometry(0.42, 18, 14), white); ball.position.y = 0.42; g.add(ball);
      [[0, 0.42, 0.42, 0], [0.42, 0.42, 0, Math.PI / 2], [-0.42, 0.42, 0, Math.PI / 2], [0, 0.84, 0, 0]].forEach(function (q, i) { var r = new T.Mesh(new T.TorusGeometry(0.17, 0.045, 8, 18), col); r.position.set(q[0], q[1], q[2]); if (i === 3) r.rotation.x = Math.PI / 2; else r.rotation.y = q[3]; ball.add(r); r.position.y -= 0.42; });
      var head = new T.Group(); head.position.y = 0.86; g.add(head);
      var dome = new T.Mesh(new T.SphereGeometry(0.26, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), white); head.add(dome);
      var band = new T.Mesh(new T.CylinderGeometry(0.265, 0.265, 0.05, 16), col); band.position.y = 0.03; head.add(band);
      var eye = new T.Mesh(new T.SphereGeometry(0.07, 10, 8), dark); eye.position.set(0, 0.12, 0.22); head.add(eye);
      g.userData = { ball: ball, head: head };
    } else {
      var body = new T.Mesh(new T.CylinderGeometry(0.34, 0.34, 0.7, 18), white); body.position.y = 0.62; g.add(body);
      [0.42, 0.62, 0.82].forEach(function (y) { var p = new T.Mesh(new T.BoxGeometry(0.3, 0.1, 0.04), col); p.position.set(0, y, 0.33); g.add(p); });
      [-1, 1].forEach(function (s) { var leg = new T.Mesh(new T.BoxGeometry(0.12, 0.7, 0.2), white); leg.position.set(s * 0.42, 0.5, 0); g.add(leg); var foot = new T.Mesh(new T.BoxGeometry(0.2, 0.16, 0.36), col); foot.position.set(s * 0.42, 0.08, 0.04); g.add(foot); });
      var head2 = new T.Group(); head2.position.y = 0.97; g.add(head2);
      var dome2 = new T.Mesh(new T.SphereGeometry(0.34, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), d.head === 'cone' ? white : col); if (d.head === 'cone') dome2.scale.y = 1.5; head2.add(dome2);
      var eye2 = new T.Mesh(new T.SphereGeometry(0.08, 10, 8), dark); eye2.position.set(0, 0.16, 0.28); head2.add(eye2);
      var lamp = new T.Mesh(new T.SphereGeometry(0.04, 8, 6), new T.MeshBasicMaterial({ color: 0xef4444 })); lamp.position.set(0.14, 0.1, 0.29); head2.add(lamp);
      g.userData = { head: head2, lamp: lamp };
    }
    return g;
  }
  function buildSaber(s) {
    var g = new T.Group(), hilt = new T.Mesh(new T.CylinderGeometry(0.022, s.hilt === 'curved' ? 0.03 : 0.022, 0.26, 10), L(s.hilt === 'gold' ? 0xd9b25a : 0x9aa3ad)); g.add(hilt);
    [-0.06, 0.02, 0.09].forEach(function (y) { var r = new T.Mesh(new T.CylinderGeometry(0.028, 0.028, 0.02, 10), L(0x1f2937)); r.position.y = y; g.add(r); });
    var blade = new T.Group(); blade.position.y = 0.13; g.add(blade);
    var core = new T.Mesh(new T.CylinderGeometry(0.012, 0.012, 0.9, 8), new T.MeshBasicMaterial({ color: 0xffffff })); core.position.y = 0.45; blade.add(core);
    var glow = new T.Mesh(new T.CylinderGeometry(0.03, 0.03, 0.92, 10), new T.MeshBasicMaterial({ color: s.color, transparent: true, opacity: 0.55, blending: T.AdditiveBlending, depthWrite: false })); glow.position.y = 0.45; blade.add(glow);
    g.userData = { blade: blade, on: 1, k: 0 }; g.position.set(0.32, -0.3, -0.62); g.rotation.set(0.35, 0, -0.35);
    return g;
  }
  function beep(hi) { try { var C = root.AudioContext || root.webkitAudioContext; if (!C) return; var c = beep.c || (beep.c = new C()), o = c.createOscillator(), gn = c.createGain(), t = c.currentTime; o.type = hi ? 'square' : 'sawtooth'; o.frequency.setValueAtTime(hi ? 900 + Math.random() * 900 : 90, t); if (hi) o.frequency.exponentialRampToValueAtTime(500 + Math.random() * 1400, t + 0.12); gn.gain.setValueAtTime(0.05, t); gn.gain.exponentialRampToValueAtTime(0.001, t + (hi ? 0.16 : 0.5)); o.connect(gn); gn.connect(c.destination); o.start(t); o.stop(t + (hi ? 0.18 : 0.55)); } catch (e) {} }
  function apply() {
    if (droid) { API.scene.remove(droid); droid = null; } if (saber) { API.camera.remove(saber); saber = null; }
    if (st.droid) { droid = buildDroid(st.droid); droid.position.set(DEPOT.x, API.groundY(DEPOT.x, DEPOT.z, 62), DEPOT.z + 2); API.scene.add(droid); }
    if (st.saber) { saber = buildSaber(st.saber); if (!API.camera.parent) API.scene.add(API.camera); API.camera.add(saber); }
  }

  /* ---------------------------------------------------------------- the benches' picture menus */
  function close() { if (ui) { ui.remove(); ui = null; try { API.setUI(false); } catch (e) {} } }
  function open(kind) {
    close(); try { if (document.pointerLockElement) document.exitPointerLock(); API.setUI(true); } catch (e) {}
    var d = kind === 'droid' ? (st.droid || { body: 'r2', color: '#2563eb', head: 'dome' }) : (st.saber || { color: '#3b82f6', hilt: 'steel' });
    ui = document.createElement('div'); ui.id = 'sw-ui'; document.body.appendChild(ui);
    function render() {
      var sw = function (list, key) { return list.map(function (c) { return '<button type="button" data-k="' + key + '" data-v="' + c[0] + '" class="sw' + (d[key] === c[0] ? ' on' : '') + '" style="background:' + c[0] + '" title="' + c[1] + '"></button>'; }).join(''); };
      var opt = function (list, key) { return list.map(function (c) { return '<button type="button" data-k="' + key + '" data-v="' + c[0] + '" class="op' + (d[key] === c[0] ? ' on' : '') + '" title="' + c[2] + '">' + c[1] + '</button>'; }).join(''); };
      ui.innerHTML = '<div class="box"><b>' + (kind === 'droid' ? '🤖 机器人工坊 · Droid Depot' : '⚔️ 光剑工坊 · Savi\'s Workshop') + '</b>' +
        (kind === 'droid' ? '<div>' + opt([['r2', '🛢', '宇航技工机器人（R 系列）'], ['bb', '⚽', '球形机器人（BB 系列）']], 'body') + (d.body === 'r2' ? opt([['dome', '🔵', '圆顶'], ['cone', '🔺', '尖顶']], 'head') : '') + '</div><div>' + sw(COLS, 'color') + '</div>'
          : '<div>' + sw(KYBER, 'color') + '</div><div>' + opt([['steel', '⚙️', '钢柄'], ['gold', '👑', '金柄'], ['curved', '🪝', '弯柄']], 'hilt') + '</div>') +
        '<div><button type="button" class="go" data-go>' + (kind === 'droid' ? '🔧 组装' : '✨ 点亮') + '</button><button type="button" class="x" data-x>✕</button></div></div>';
      [].forEach.call(ui.querySelectorAll('[data-k]'), function (b) { b.onclick = function () { d[b.dataset.k] = b.dataset.v; render(); }; });
      ui.querySelector('[data-x]').onclick = close;
      ui.querySelector('[data-go]').onclick = function () { st[kind] = d; save(); apply(); close(); beep(kind === 'droid'); API.toast(kind === 'droid' ? '🤖 你的机器人造好了！它会跟着你走' : '⚔️ 光剑点亮了！按 L 收起或点亮'); };
    }
    render();
  }
  var css = document.createElement('style');
  css.textContent = '#sw-ui{position:fixed;inset:0;z-index:220;display:flex;align-items:center;justify-content:center;background:rgba(2,6,23,.55)}#sw-ui .box{background:rgba(15,23,42,.96);border:1.5px solid #38bdf8;border-radius:18px;padding:16px 18px;display:flex;flex-direction:column;gap:12px;align-items:center;color:#e0f2fe;font:700 15px -apple-system,"PingFang SC",sans-serif}' +
    '#sw-ui button{cursor:pointer;border:2px solid rgba(255,255,255,.25);border-radius:50%;width:48px;height:48px;font-size:22px;margin:0 4px;background:rgba(255,255,255,.08);color:#fff}#sw-ui button.on{border-color:#fde047;transform:scale(1.15)}#sw-ui .go{width:auto;border-radius:999px;padding:0 22px;background:linear-gradient(135deg,#38bdf8,#6366f1);font-weight:800;font-size:15px}';
  document.head.appendChild(css);

  function bench(at, col, icon, name) {
    var y = API.groundY(at.x, at.z, 62), g = new T.Group(); g.position.set(at.x, y, at.z);
    var top = new T.Mesh(new T.BoxGeometry(3.2, 0.14, 1.3), L(0x475569)); top.position.y = 0.95; g.add(top);
    [[-1.4, -0.5], [1.4, -0.5], [-1.4, 0.5], [1.4, 0.5]].forEach(function (q) { var l = new T.Mesh(new T.BoxGeometry(0.14, 0.95, 0.14), L(0x1f2937)); l.position.set(q[0], 0.47, q[1]); g.add(l); });
    var back = new T.Mesh(new T.BoxGeometry(3.2, 1.5, 0.12), L(0x334155)); back.position.set(0, 1.75, -0.6); g.add(back);
    var c = document.createElement('canvas'); c.width = 384; c.height = 128; var x = c.getContext('2d'); x.fillStyle = '#0f172a'; x.fillRect(0, 0, 384, 128); x.strokeStyle = col; x.lineWidth = 8; x.strokeRect(4, 4, 376, 120); x.font = '64px sans-serif'; x.textBaseline = 'middle'; x.fillText(icon, 20, 66); x.fillStyle = '#e0f2fe'; x.font = '700 34px "PingFang SC",sans-serif'; x.fillText(name, 104, 66);
    var sign = new T.Mesh(new T.PlaneGeometry(2.8, 0.93), new T.MeshBasicMaterial({ map: new T.CanvasTexture(c) })); sign.position.set(0, 1.9, -0.53); g.add(sign);
    for (var i = 0; i < 5; i++) { var part = new T.Mesh(i % 2 ? new T.SphereGeometry(0.16, 10, 8) : new T.CylinderGeometry(0.1, 0.1, 0.3, 10), L([0x2563eb, 0xf97316, 0xf1f5f9, 0xdc2626, 0x16a34a][i])); part.position.set(-1.2 + i * 0.6, 1.14, 0.1); g.add(part); }
    API.scene.add(g);
  }
  function attach(api) {
    if (API || !api) return; API = api; T = api.THREE;
    try {
      bench(DEPOT, '#f97316', '🤖', '机器人工坊'); bench(SAVI, '#38bdf8', '⚔️', '光剑工坊');
      var list = API.getProps().interactables, reg = function (at, name, kind) { var e = { id: 'sw-' + kind, name: name, x: at.x, z: at.z + 1.6 }; Object.defineProperty(e, 'msg', { get: function () { setTimeout(function () { open(kind); }, 0); return name; } }); list.push(e); };
      reg(DEPOT, '机器人工坊 · 造一个自己的机器人', 'droid'); reg(SAVI, '光剑工坊 · 造一把自己的光剑', 'saber'); apply();
    } catch (e) { if (root.console) console.warn('[sw workshops]', e); }
    root.addEventListener('keydown', function (e) { if (e.code === 'KeyL' && saber && !ui) { saber.userData.on = saber.userData.on ? 0 : 1; beep(false); } if (e.key === 'Escape' && ui) close(); });
    var last = performance.now();
    (function tick(now) {
      requestAnimationFrame(tick); var dt = Math.min(0.05, (now - last) / 1000); last = now; clock += dt;
      if (droid) {   /* it rolls after its maker, a little behind and to the side */
        var P = API.player, tx = P.pos.x + Math.sin(P.yaw) * 1.6 + Math.cos(P.yaw) * 1.2, tz = P.pos.z + Math.cos(P.yaw) * 1.6 - Math.sin(P.yaw) * 1.2, dx = tx - droid.position.x, dz = tz - droid.position.z, d = Math.hypot(dx, dz);
        if (d > 40) droid.position.set(tx, P.pos.y, tz); else if (d > 0.25) { var sp = Math.min(d, (d > 4 ? 9 : 4.5) * dt); droid.position.x += dx / d * sp; droid.position.z += dz / d * sp; droid.rotation.y = Math.atan2(dx, dz); if (droid.userData.ball) droid.userData.ball.rotation.x += sp / 0.42; }
        droid.position.y = API.groundY(droid.position.x, droid.position.z, Math.floor(P.pos.y + 6)); droid.visible = !API.state.activeRide;
        droid.userData.head.rotation.y = Math.sin(clock * 1.7) * 0.7; if (droid.userData.lamp) droid.userData.lamp.visible = Math.sin(clock * 5) > 0;
        if (Math.random() < dt * 0.12 && d < 12) beep(true);
      }
      if (saber) { var u = saber.userData; u.k += ((u.on ? 1 : 0) - u.k) * Math.min(1, dt * 9); u.blade.scale.y = Math.max(0.001, u.k); u.blade.visible = u.k > 0.02; saber.visible = !API.state.activeRide && API.state.mode !== 'tour'; saber.rotation.z = -0.35 + Math.sin(clock * 1.3) * 0.04; }
    })(last);
  }
  if (root.TPParkAPI) attach(root.TPParkAPI); else root.addEventListener('tp:park-ready', function (e) { attach(e.detail || root.TPParkAPI); });
  root.TPStarWarsWorkshops = { open: open, state: function () { return st; } };
})(window);
