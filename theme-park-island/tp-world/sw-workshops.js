/* Star Wars: Galaxy's Edge — two workshops to make things in (2026-11-24).
 * Droid Depot (机器人工坊): choose a body (an astromech like R2, or a ball droid like BB), a colour and a head, and
 * the droid is built on the bench — then it rolls after you through the park, beeping. Savi's bench (光剑工坊): choose
 * a kyber crystal and a hilt, and the lightsaber is in your hand (L switches the blade on and off).
 * Both stand on the Docking Bay 5 plaza; walk up and press E. What you made is kept on this device ('tp.sw'). */
(function (root) {
  'use strict';
  var sbBtn = null, busy = false;
  var API = null, T = null, st = { droid: null, saber: null }, droid = null, saber = null, clock = 0, ui = null;
  var DEPOT = { x: 134, z: 102 }, SAVI = { x: 118, z: 102 };
  var COLS = [['#2563eb', '蓝'], ['#f97316', '橙'], ['#dc2626', '红'], ['#16a34a', '绿'], ['#7c3aed', '紫'], ['#f8fafc', '白']];
  var KYBER = [['#3b82f6', '蓝'], ['#22c55e', '绿'], ['#a855f7', '紫'], ['#ef4444', '红'], ['#facc15', '黄'], ['#f8fafc', '白']];
  try { st = JSON.parse(localStorage.getItem('tp.sw') || 'null') || st; } catch (e) {}
  function save() { try { localStorage.setItem('tp.sw', JSON.stringify(st)); } catch (e) {} }
  var L = function (c, o) { return new T.MeshLambertMaterial(Object.assign({ color: c }, o || {})); };

  function buildDroid(d) {
    if (root.TPSWParts && d && d.parts) return root.TPSWParts.droid(d);   /* built at the Droid Depot: the very parts the guest picked */
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
    if (root.TPSWParts && s && s.theme) { var h = root.TPSWParts.saber(s); h.userData.on = 1; h.userData.k = 0; h.position.set(0.32, -0.3, -0.62); h.rotation.set(0.35, 0, -0.35); return h; }   /* built at Savi's */
    var g = new T.Group(), hilt = new T.Mesh(new T.CylinderGeometry(0.022, s.hilt === 'curved' ? 0.03 : 0.022, 0.26, 10), L(s.hilt === 'gold' ? 0xd9b25a : 0x9aa3ad)); g.add(hilt);
    [-0.06, 0.02, 0.09].forEach(function (y) { var r = new T.Mesh(new T.CylinderGeometry(0.028, 0.028, 0.02, 10), L(0x1f2937)); r.position.y = y; g.add(r); });
    var blade = new T.Group(); blade.position.y = 0.13; g.add(blade);
    var core = new T.Mesh(new T.CylinderGeometry(0.012, 0.012, 0.9, 8), new T.MeshBasicMaterial({ color: 0xffffff })); core.position.y = 0.45; blade.add(core);
    var glow = new T.Mesh(new T.CylinderGeometry(0.03, 0.03, 0.92, 10), new T.MeshBasicMaterial({ color: s.color, transparent: true, opacity: 0.55, blending: T.AdditiveBlending, depthWrite: false })); glow.position.y = 0.45; blade.add(glow);
    g.userData = { blade: blade, on: 1, k: 0 }; g.position.set(0.32, -0.3, -0.62); g.rotation.set(0.35, 0, -0.35);
    return g;
  }
  function beep(hi) { try { var C = root.AudioContext || root.webkitAudioContext; if (!C) return; var c = beep.c || (beep.c = new C()), o = c.createOscillator(), gn = c.createGain(), t = c.currentTime; o.type = hi ? 'square' : 'sawtooth'; o.frequency.setValueAtTime(hi ? 900 + Math.random() * 900 : 90, t); if (hi) o.frequency.exponentialRampToValueAtTime(500 + Math.random() * 1400, t + 0.12); gn.gain.setValueAtTime(0.05, t); gn.gain.exponentialRampToValueAtTime(0.001, t + (hi ? 0.16 : 0.5)); o.connect(gn); gn.connect(c.destination); o.start(t); o.stop(t + (hi ? 0.18 : 0.55)); } catch (e) {} }
  /* ---------------------------------------------------------------- the lightsaber's voice
   * The hum: two saws a hair apart (they beat against each other), an octave above and a sub below, through a low-pass,
   * with a slow tremble; swinging the blade (turning) bends the pitch up and opens the filter — the Doppler swoosh.
   * Ignition: a crack, then noise swept up through a band-pass while the tone climbs to the hum. Retraction: the reverse. */
  var sab = null, humOn = false, swing = 0, lastYaw = null;
  function actx() { try { var C = root.AudioContext || root.webkitAudioContext; if (!C) return null; var c = beep.c || (beep.c = new C()); if (c.state === 'suspended') c.resume(); return c; } catch (e) { return null; } }
  function saberHum(on) {
    var c = actx(); if (!c) return; var t = c.currentTime;
    if (on && !sab) {
      var out = c.createGain(); out.gain.value = 0; var an = c.createAnalyser(); an.fftSize = 2048; out.connect(an); an.connect(c.destination);
      var lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 850; lp.Q.value = 0.8; lp.connect(out);
      var os = [[92, 'sawtooth', 0.5], [92.8, 'sawtooth', 0.5], [185, 'square', 0.1], [46, 'sine', 0.7]].map(function (q) { var o = c.createOscillator(), g = c.createGain(); o.type = q[1]; o.frequency.value = q[0]; g.gain.value = q[2]; o.connect(g); g.connect(lp); o.start(); return { o: o, f: q[0] }; });
      var lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = 7.3; lg.gain.value = 0.012; lfo.connect(lg); lg.connect(out.gain); lfo.start();
      sab = { out: out, os: os, lp: lp, an: an, level: 0.06 };
    }
    if (!sab) return; sab.out.gain.cancelScheduledValues(t); sab.out.gain.setTargetAtTime(on ? sab.level : 0, t, on ? 0.14 : 0.07);
  }
  function saberFx(on) {
    var c = actx(); if (!c) return; var t = c.currentTime, d = on ? 0.42 : 0.5;
    try {
      var buf = saberFx.buf; if (!buf) { buf = saberFx.buf = c.createBuffer(1, c.sampleRate * 0.6, c.sampleRate); var ch = buf.getChannelData(0); for (var i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1; }
      var src = c.createBufferSource(); src.buffer = buf; var bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1.4; var g = c.createGain();
      bp.frequency.setValueAtTime(on ? 260 : 2800, t); bp.frequency.exponentialRampToValueAtTime(on ? 3400 : 180, t + d);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.28, t + 0.04); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      src.connect(bp); bp.connect(g); g.connect(c.destination); src.start(t); src.stop(t + d + 0.05);
      var o = c.createOscillator(), og = c.createGain(), olp = c.createBiquadFilter(); olp.type = 'lowpass'; olp.frequency.value = 1200; o.type = 'sawtooth';
      o.frequency.setValueAtTime(on ? 38 : 92, t); o.frequency.exponentialRampToValueAtTime(on ? 92 : 30, t + d);
      og.gain.setValueAtTime(0.0001, t); og.gain.exponentialRampToValueAtTime(0.2, t + 0.05); og.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.1);
      o.connect(olp); olp.connect(og); og.connect(c.destination); o.start(t); o.stop(t + d + 0.15);
      if (on) { var k = c.createOscillator(), kg = c.createGain(); k.type = 'square'; k.frequency.setValueAtTime(2400, t); k.frequency.exponentialRampToValueAtTime(300, t + 0.06); kg.gain.setValueAtTime(0.12, t); kg.gain.exponentialRampToValueAtTime(0.0001, t + 0.07); k.connect(kg); kg.connect(c.destination); k.start(t); k.stop(t + 0.08); }
    } catch (e) {}
  }
  function saberToggle() { if (!saber) return; saber.userData.on = saber.userData.on ? 0 : 1; saberFx(!!saber.userData.on); }
  function saberSound(dt) {   /* each frame: the hum is on while the blade is, and it swooshes as the guest turns */
    var want = !!(saber && saber.userData.on && saber.visible);
    if (want !== humOn) { humOn = want; saberHum(want); }
    if (!sab || !humOn) { lastYaw = null; return; }
    var yaw = API.player.yaw, rate = lastYaw == null ? 0 : Math.abs(Math.atan2(Math.sin(yaw - lastYaw), Math.cos(yaw - lastYaw))) / Math.max(dt, 0.001); lastYaw = yaw;
    swing += (Math.min(6, rate) - swing) * Math.min(1, dt * 9);
    var c = beep.c, t = c.currentTime, k = 1 + Math.min(0.42, swing * 0.07);
    sab.os.forEach(function (o) { o.o.frequency.setTargetAtTime(o.f * k, t, 0.04); }); sab.lp.frequency.setTargetAtTime(850 + swing * 420, t, 0.05); sab.out.gain.setTargetAtTime(sab.level * (1 + Math.min(1.3, swing * 0.28)), t, 0.05);
  }
  function level() { if (!sab) return 0; var a = new Float32Array(sab.an.fftSize); sab.an.getFloatTimeDomainData(a); var s2 = 0; for (var i = 0; i < a.length; i++) s2 += a[i] * a[i]; return Math.sqrt(s2 / a.length); }

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
      ui.querySelector('[data-go]').onclick = function () { st[kind] = d; save(); apply(); close(); if (kind === 'droid') beep(true); else saberFx(true); API.toast(kind === 'droid' ? '🤖 你的机器人造好了！它会跟着你走' : '⚔️ 光剑点亮了！按 L 收起或点亮'); };
    }
    render();
  }
  var css = document.createElement('style');
  css.textContent = '#sw-ui{position:fixed;inset:0;z-index:220;display:flex;align-items:center;justify-content:center;background:rgba(2,6,23,.55)}#sw-ui .box{background:rgba(15,23,42,.96);border:1.5px solid #38bdf8;border-radius:18px;padding:16px 18px;display:flex;flex-direction:column;gap:12px;align-items:center;color:#e0f2fe;font:700 15px -apple-system,"PingFang SC",sans-serif}' +
    '#sw-ui button{cursor:pointer;border:2px solid rgba(255,255,255,.25);border-radius:50%;width:48px;height:48px;font-size:22px;margin:0 4px;background:rgba(255,255,255,.08);color:#fff}#sw-ui button.on{border-color:#fde047;transform:scale(1.15)}#sw-ui .go{width:auto;border-radius:999px;padding:0 22px;background:linear-gradient(135deg,#38bdf8,#6366f1);font-weight:800;font-size:15px}';
  css.textContent += '#sw-saber-btn{display:none;position:fixed;right:16px;bottom:calc(env(safe-area-inset-bottom,0px) + 150px);z-index:60;width:54px;height:54px;border-radius:50%;border:2px solid #7dd3fc;background:rgba(15,23,42,.85);font-size:24px;cursor:pointer;box-shadow:0 0 18px rgba(125,211,252,.5)}';
  document.head.appendChild(css);
  ['pointerdown', 'keydown', 'touchstart'].forEach(function (ev) { root.addEventListener(ev, function () { try { if (beep.c && beep.c.state === 'suspended') beep.c.resume(); } catch (e) {} }, true); });

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
  /* ================================================================ the Droid Depot & Savi's Workshop: a building, and a staged experience inside
   * Outside: a Batuuan workshop east of the Docking Bay 5 plaza. Inside (a show volume of its own, high above it): the
   * guest is carried from station to station — the parts conveyor, the build station where the droid is put together
   * and wakes, then Savi's dim chamber, where the kyber crystal is chosen and the blade is raised with the Gatherers.
   * At each choice the icons at the bottom (or the number keys) decide; if nobody chooses, the show goes on. */
  var HALL = { x: 166, z: 112 }, OY = 700, hall = null;
  var STEPS = [
    { t: 5, cam: [0, 2.0, 15, 0, 1.6, 4], say: '欢迎来到黑尖塔前哨站的机器人工坊。传送带上是从银河各处收来的零件——造一个属于你的机器人吧。' },
    { t: 10, cam: [0, 3.0, 11.5, -2.5, 1.2, 3], pick: 'body', say: '先选机身：圆桶一样的宇航技工机器人，还是会滚的球形机器人？' },
    { t: 9, cam: [0, 3.0, 11.5, 2.5, 1.2, 3], pick: 'color', say: '再选一种颜色，给它涂上自己的标记。' },
    { t: 6, cam: [0, 1.9, 3.2, 0, 1.0, -1.5], build: 1, say: '零件送上了组装台……拧紧，接线，装上头部。' },
    { t: 6, cam: [0.9, 1.5, 1.6, 0, 0.8, -1.5], wake: 1, say: '启动！听——它在和你打招呼。从现在起，它会跟着你走遍整个乐园。' },
    { t: 6, cam: [0, 1.9, -6, 0, 1.5, -14], say: '穿过这道门，是萨维的秘密工坊。采集者们守护着原力的传统，声音轻一点。' },
    { t: 10, cam: [0, 1.8, -12.5, 0, 1.0, -17], pick: 'kyber', say: '凯伯水晶是光剑的心。让水晶选择你——哪一种颜色在呼唤你？' },
    { t: 8, cam: [0, 1.8, -12.5, 0, 1.0, -17], pick: 'hilt', say: '再选剑柄：钢，金，还是弯柄？' },
    { t: 8, cam: [0, 1.7, -13.2, 0, 1.6, -17], rise: 1, say: '把水晶放进剑柄……举起来。光剑，点亮！' },
    { t: 5, cam: [0, 2.0, -11, 0, 1.6, -17], say: '愿原力与你同在。带上你的机器人和光剑，回到前哨站去吧。' }
  ];
  function buildHall() {
    var gy = API.groundY(HALL.x, HALL.z, 62), M = function (c) { return new T.MeshBasicMaterial({ color: c }); }, out = new T.Group(); out.position.set(HALL.x, gy, HALL.z); API.scene.add(out);
    var add = function (g, geo, m, x, y, z) { var o = new T.Mesh(geo, m); o.position.set(x, y, z); g.add(o); return o; };
    /* outside: sand-coloured walls, a dome, a round door, antennas and the sign */
    add(out, new T.BoxGeometry(16, 6, 12), L(0xcbb89a), 0, 3, 0); add(out, new T.SphereGeometry(5.2, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), L(0xb9a586), 0, 6, 0);
    add(out, new T.CylinderGeometry(6.2, 6.6, 0.5, 24), L(0x8c7a60), 0, 6.1, 0); add(out, new T.BoxGeometry(17, 0.5, 13), L(0x8c7a60), 0, 0.25, 0);
    add(out, new T.CircleGeometry(1.9, 24), M(0x1a1410), 0, 2.1, 6.02); add(out, new T.TorusGeometry(1.95, 0.22, 8, 28), L(0x6b5a44), 0, 2.1, 6.05);
    [-6, 6].forEach(function (x) { add(out, new T.CylinderGeometry(0.08, 0.1, 5, 6), L(0x4b5563), x, 8.5, -3); add(out, new T.SphereGeometry(0.22, 8, 6), M(0xef4444), x, 11.1, -3); });
    [-5.2, 5.2].forEach(function (x) { add(out, new T.BoxGeometry(2.2, 1.4, 0.2), M(0x7dd3fc), x, 3.4, 6.05); add(out, new T.BoxGeometry(2.6, 0.3, 0.6), L(0xf97316), x, 4.4, 6.3); });
    var c = document.createElement('canvas'); c.width = 768; c.height = 160; var q = c.getContext('2d'); q.fillStyle = '#0f172a'; q.fillRect(0, 0, 768, 160); q.strokeStyle = '#f97316'; q.lineWidth = 10; q.strokeRect(6, 6, 756, 148);
    q.fillStyle = '#fde68a'; q.textAlign = 'center'; q.font = '800 58px sans-serif'; q.fillText('DROID DEPOT · SAVI\'S', 384, 68); q.fillStyle = '#7dd3fc'; q.font = '700 40px "PingFang SC",sans-serif'; q.fillText('机器人工坊 · 光剑工坊', 384, 126);
    add(out, new T.PlaneGeometry(9.6, 2), new T.MeshBasicMaterial({ map: new T.CanvasTexture(c) }), 0, 6.2, 6.1);
    try { var r2 = buildDroid({ body: 'r2', color: '#2563eb', head: 'dome' }); r2.position.set(-3.4, 0.5, 7.6); r2.scale.setScalar(1.3); out.add(r2); var bb = buildDroid({ body: 'bb', color: '#f97316' }); bb.position.set(3.4, 0.5, 7.6); bb.scale.setScalar(1.3); out.add(bb); } catch (e) {}
    /* inside */
    var g = new T.Group(); g.position.set(HALL.x, OY, HALL.z); g.visible = false; API.scene.add(g);
    var tx = function (w, h, rep, draw) { var cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h); var t = new T.CanvasTexture(cv); t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(rep[0], rep[1]); return new T.MeshBasicMaterial({ map: t }); };
    /* weathered Batuuan plaster with panel seams and pipes; a plated floor; a dark vaulted wall for Savi's */
    var wall = tx(256, 256, [6, 1], function (c, w, h) { c.fillStyle = '#5a4c3c'; c.fillRect(0, 0, w, h); for (var i = 0; i < 260; i++) { c.fillStyle = 'rgba(' + (i % 2 ? '30,22,14' : '150,128,100') + ',.10)'; c.fillRect((i * 97) % w, (i * 53) % h, 6 + i % 22, 2 + i % 5); } c.strokeStyle = '#2f261c'; c.lineWidth = 4; c.strokeRect(2, 2, w - 4, h - 4); c.beginPath(); c.moveTo(0, h * 0.62); c.lineTo(w, h * 0.62); c.stroke(); c.fillStyle = '#8a7558'; c.fillRect(0, h * 0.64, w, 10); c.fillStyle = '#f97316'; c.fillRect(20, h * 0.2, 46, 8); c.fillStyle = '#38bdf8'; c.fillRect(w - 70, h * 0.3, 40, 6); c.fillStyle = '#3a3026'; c.fillRect(w * 0.48, 0, 12, h); });
    var floorM = tx(128, 128, [7, 20], function (c, w, h) { c.fillStyle = '#4a4238'; c.fillRect(0, 0, w, h); c.strokeStyle = '#2a241d'; c.lineWidth = 3; c.strokeRect(1, 1, w - 2, h - 2); c.fillStyle = '#6b5f50'; [[12, 12], [w - 18, 12], [12, h - 18], [w - 18, h - 18]].forEach(function (q) { c.fillRect(q[0], q[1], 6, 6); }); });
    var dark = tx(256, 256, [5, 1], function (c, w, h) { c.fillStyle = '#17120d'; c.fillRect(0, 0, w, h); c.strokeStyle = '#3a2c1c'; c.lineWidth = 5; for (var i = 0; i < 4; i++) { c.beginPath(); c.arc(w / 2, h * 1.05, 60 + i * 44, Math.PI, 0); c.stroke(); } c.fillStyle = '#fbbf24'; for (var k = 0; k < 9; k++) c.fillRect(20 + k * 26, h * 0.86, 4, 12); });
    var metal = M(0x6b7280), glow = function (c2) { return new T.MeshBasicMaterial({ color: c2 }); };
    add(g, new T.BoxGeometry(14, 0.2, 40), floorM, 0, -0.1, -2); add(g, new T.BoxGeometry(14, 0.2, 40), dark, 0, 5.2, -2);
    [-7, 7].forEach(function (x) { add(g, new T.BoxGeometry(0.3, 5.4, 40), wall, x, 2.6, -2); }); add(g, new T.BoxGeometry(14, 5.4, 0.3), wall, 0, 2.6, 18); add(g, new T.BoxGeometry(14, 5.4, 0.3), dark, 0, 2.6, -22);
    [-1, 1].forEach(function (s2) { add(g, new T.BoxGeometry(5.6, 5.4, 0.4), wall, s2 * 4.2, 2.6, -8); }); add(g, new T.BoxGeometry(2.8, 2.4, 0.4), wall, 0, 4.1, -8);   /* the wall between the depot and Savi's */
    for (var i = 0; i < 6; i++) { add(g, new T.BoxGeometry(0.5, 0.12, 0.5), glow(0xfff1c2), -4 + (i % 3) * 4, 5.05, 12 - Math.floor(i / 3) * 9); add(g, new T.BoxGeometry(0.2, 3.2, 0.2), metal, i < 3 ? -6.7 : 6.7, 1.6, 12 - (i % 3) * 7); }
    /* neon over each station, a row of droids waiting on the shelf, hanging cables, and Savi's ring of lamps */
    var neon = function (txt, col, x, y, z, w) { var cv = document.createElement('canvas'); cv.width = 512; cv.height = 96; var c = cv.getContext('2d'); c.fillStyle = '#0b0f1a'; c.fillRect(0, 0, 512, 96); c.shadowColor = col; c.shadowBlur = 18; c.fillStyle = col; c.font = '800 54px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(txt, 256, 50); add(g, new T.PlaneGeometry(w, w * 0.1875), new T.MeshBasicMaterial({ map: new T.CanvasTexture(cv) }), x, y, z); };
    neon('PARTS · 零件', '#f97316', -2.5, 3.6, -7.7, 3.6); neon('BUILD · 组装', '#38bdf8', 2.5, 3.6, -7.7, 3.6); neon('DROID DEPOT', '#fde047', 0, 4.4, 17.7, 6);
    for (var d = 0; d < 6; d++) { try { var sh = buildDroid({ body: d % 2 ? 'bb' : 'r2', color: COLS[d][0], head: d % 3 ? 'dome' : 'cone' }); sh.position.set(d < 3 ? -6.2 : 6.2, 0, 12 - (d % 3) * 5.5); sh.rotation.y = d < 3 ? Math.PI / 2 : -Math.PI / 2; g.add(sh); } catch (e) {} }
    for (var cb = 0; cb < 7; cb++) add(g, new T.CylinderGeometry(0.03, 0.03, 0.8 + (cb % 3) * 0.5, 5), M(0x111827), -5 + cb * 1.7, 4.7 - (cb % 3) * 0.25, 2 + (cb % 4) * 2.5);
    for (var lp = 0; lp < 10; lp++) { var la = lp / 10 * Math.PI * 2; add(g, new T.SphereGeometry(0.12, 8, 6), glow(0xffc46b), Math.sin(la) * 5.4, 3.9, -15.5 + Math.cos(la) * 5.4); add(g, new T.CylinderGeometry(0.02, 0.02, 1.2, 4), M(0x111827), Math.sin(la) * 5.4, 4.6, -15.5 + Math.cos(la) * 5.4); }
    /* two conveyors of parts */
    var belts = [], parts = [];
    [-2.5, 2.5].forEach(function (x, bi) {
      add(g, new T.BoxGeometry(1.6, 0.25, 12), M(0x1f2937), x, 0.85, 4); [-0.85, 0.85].forEach(function (d) { add(g, new T.BoxGeometry(0.1, 0.4, 12), metal, x + d, 0.95, 4); }); [9.5, 4, -1.5].forEach(function (z) { add(g, new T.BoxGeometry(1.4, 0.8, 0.3), metal, x, 0.4, z); });
      for (var k = 0; k < 9; k++) { var col = COLS[(k + bi * 3) % 6][0], pm = L(col), geo = bi === 0 ? (k % 2 ? new T.CylinderGeometry(0.3, 0.3, 0.6, 14) : new T.SphereGeometry(0.36, 14, 10)) : (k % 3 === 0 ? new T.SphereGeometry(0.3, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2) : k % 3 === 1 ? new T.BoxGeometry(0.5, 0.14, 0.3) : new T.TorusGeometry(0.2, 0.06, 8, 16)); var pt = add(g, geo, pm, x, 1.3, -2 + k * 1.35); parts.push({ m: pt, x: x }); }
    });
    /* the build station */
    add(g, new T.CylinderGeometry(1.5, 1.7, 0.4, 24), metal, 0, 0.2, -1.5); var ring = add(g, new T.TorusGeometry(1.5, 0.06, 8, 36), glow(0x38bdf8), 0, 0.42, -1.5); ring.rotation.x = Math.PI / 2;
    [-1, 1].forEach(function (s3) { var arm = new T.Group(); arm.position.set(s3 * 1.9, 0, -1.5); g.add(arm); add(arm, new T.CylinderGeometry(0.09, 0.12, 2.6, 8), metal, 0, 1.3, 0); var fore = add(arm, new T.BoxGeometry(1.3, 0.12, 0.12), M(0xf97316), -s3 * 0.6, 2.5, 0); belts.push({ arm: arm, fore: fore, s: s3 }); });
    var stand = new T.Group(); stand.position.set(0, 0.4, -1.5); g.add(stand);
    var sparks = add(g, new T.SphereGeometry(0.12, 6, 5), glow(0xfde047), 0, 1.4, -1.2); sparks.visible = false;
    /* Savi's chamber: a round table, the crystals, the Gatherers */
    add(g, new T.CylinderGeometry(2.2, 2.4, 0.9, 28), M(0x2a2118), 0, 0.45, -17); add(g, new T.CylinderGeometry(2.3, 2.3, 0.08, 28), M(0x6b5a44), 0, 0.94, -17);
    var crystals = KYBER.map(function (k, i2) { var a2 = -0.9 + i2 * 0.36, m2 = add(g, new T.OctahedronGeometry(0.16, 0), glow(k[0]), Math.sin(a2) * 1.5, 1.2, -17 + Math.cos(a2) * 1.5); return m2; });
    var gatherers = []; for (var n = 0; n < 5; n++) { var a3 = Math.PI * 0.62 + n * 0.44, gg = new T.Group(); gg.position.set(Math.sin(a3) * 3.6, 0, -17 + Math.cos(a3) * 3.6); gg.rotation.y = a3 + Math.PI; g.add(gg);
      add(gg, new T.CylinderGeometry(0.22, 0.42, 1.5, 10), M(0x4a3a2a), 0, 0.75, 0); add(gg, new T.SphereGeometry(0.2, 10, 8), M(0xd9b08c), 0, 1.66, 0); add(gg, new T.ConeGeometry(0.3, 0.5, 10), M(0x3a2c20), 0, 1.86, -0.04);
      var sb = buildSaber({ color: KYBER[n][0], hilt: 'steel' }); sb.position.set(0.3, 1.1, 0.25); sb.rotation.set(0, 0, 0); sb.userData.blade.scale.y = 0.001; gg.add(sb); gatherers.push(sb); }
    var mine = new T.Group(); mine.position.set(0, 1.25, -15.4); g.add(mine);
    var pool = add(g, new T.CircleGeometry(2.6, 28), new T.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.0 }), 0, 0.99, -17); pool.rotation.x = -Math.PI / 2;
    hall = { g: g, parts: parts, arms: belts, stand: stand, sparks: sparks, crystals: crystals, gatherers: gatherers, mine: mine, pool: pool, i: -1, t: 0, run: false, pose: [0, 2, 15, 0, 1.6, 4], d: null, sb: null, bar: null };
    var doorZ = HALL.z + 9;
    API.getProps().rides.sw_workshop = {
      id: 'sw_workshop', name: '机器人工坊与光剑工坊（Droid Depot & Savi\'s Workshop）', land: 'star_wars',
      boardPos: { x: HALL.x, y: gy, z: doorZ }, exitPos: { x: HALL.x, y: gy, z: doorZ + 2, yaw: Math.PI },
      start: function () { if (hall.i < 0 || hall.i >= STEPS.length) { hall.i = 0; hall.t = 0; hall.pick = { body: 'r2', color: COLS[0][0], head: 'dome', kyber: KYBER[0][0], hilt: 'steel' }; while (hall.stand.children.length) hall.stand.remove(hall.stand.children[0]); while (hall.mine.children.length) hall.mine.remove(hall.mine.children[0]); hall.d = hall.sb = null; enterStep(); } hall.run = true; hall.g.visible = true; sound(true); },
      stop: function () { hall.run = false; }, isRunning: function () { return hall.run; },
      onExit: function () { hall.run = false; hall.i = -1; hall.g.visible = false; showBar(null); sound(false); try { root.speechSynthesis.cancel(); } catch (e) {} },
      getHudInfo: function () { return (hall.i < 5 ? '机器人工坊' : '光剑工坊') + ' · ' + Math.min(hall.i + 1, STEPS.length) + '/' + STEPS.length; },
      getCameraPose: function () { var p = hall.pose; return { px: HALL.x + p[0], py: OY + p[1], pz: HALL.z + p[2], tx: HALL.x + p[3], ty: OY + p[4], tz: HALL.z + p[5] }; }
    };
  }
  var snd = null;
  function sound(on) {
    try { var C = root.AudioContext || root.webkitAudioContext; if (!C) return; var c = beep.c || (beep.c = new C());
      if (!on) { if (snd) { snd.g.gain.setTargetAtTime(0, c.currentTime, 0.3); clearInterval(snd.iv); var old = snd; setTimeout(function () { old.o.forEach(function (x) { try { x.stop(); } catch (e) {} }); }, 1200); snd = null; } return; }
      if (snd) return; var g = c.createGain(); g.gain.value = 0; g.gain.setTargetAtTime(0.05, c.currentTime, 0.8); g.connect(c.destination);
      var hum = c.createOscillator(); hum.type = 'sawtooth'; hum.frequency.value = 55; var lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 220; hum.connect(lp); lp.connect(g); hum.start();
      var NOTES = [196, 233, 294, 262, 196, 175, 233, 196], n = 0;
      var iv = setInterval(function () { if (!hall || !hall.run) return; var o = c.createOscillator(), e = c.createGain(), t = c.currentTime, f = NOTES[n++ % 8] * (hall.i >= 5 ? 0.5 : 1); o.type = hall.i >= 5 ? 'sine' : 'triangle'; o.frequency.value = f; e.gain.setValueAtTime(0.0001, t); e.gain.exponentialRampToValueAtTime(0.5, t + 0.05); e.gain.exponentialRampToValueAtTime(0.0001, t + (hall.i >= 5 ? 1.6 : 0.5)); o.connect(e); e.connect(g); o.start(t); o.stop(t + 1.7); }, 620);
      snd = { g: g, o: [hum], iv: iv };
    } catch (e) {}
  }
  function speakLine(t) { API.toast(t); try { var ss = root.speechSynthesis; if (!ss) return; ss.cancel(); var u = new root.SpeechSynthesisUtterance(t); u.lang = 'zh-CN'; u.rate = 1.02; u.pitch = 0.95; ss.speak(u); } catch (e) {} }
  function showBar(kind) {
    if (!hall.bar) { hall.bar = document.createElement('div'); hall.bar.id = 'sw-pick'; document.body.appendChild(hall.bar); }
    var b = hall.bar; b.style.display = kind ? 'flex' : 'none'; if (!kind) return;
    var list = kind === 'body' ? [['r2', '🛢'], ['bb', '⚽']] : kind === 'hilt' ? [['steel', '⚙️'], ['gold', '👑'], ['curved', '🪝']] : (kind === 'kyber' ? KYBER : COLS).map(function (c) { return [c[0], '']; });
    b.innerHTML = list.map(function (o, i) { return '<button type="button" data-v="' + o[0] + '" class="' + (hall.pick[kind] === o[0] ? 'on' : '') + '"' + (o[1] ? '' : ' style="background:' + o[0] + '"') + '>' + (o[1] || '') + '<i>' + (i + 1) + '</i></button>'; }).join('');
    [].forEach.call(b.querySelectorAll('button'), function (x) { x.onclick = function (e) { e.stopPropagation(); choose(kind, x.dataset.v); }; });
  }
  function choose(kind, v) { hall.pick[kind] = v; beep(true); showBar(kind); hall.t = Math.max(hall.t, STEPS[hall.i].t - 1.6); if (kind === 'kyber') hall.crystals.forEach(function (c, i) { c.scale.setScalar(KYBER[i][0] === v ? 2 : 1); }); }
  function enterStep() { var s = STEPS[hall.i]; hall.t = 0; speakLine(s.say); showBar(s.pick || null);
    if (s.build) { hall.d = buildDroid(hall.pick); hall.d.scale.setScalar(1.25); hall.d.position.y = 4; hall.stand.add(hall.d); }
    if (s.rise) { hall.sb = buildSaber({ color: hall.pick.kyber, hilt: hall.pick.hilt }); hall.sb.position.set(0, 0, 0); hall.sb.rotation.set(0, 0, 0); hall.sb.scale.setScalar(1.6); hall.sb.userData.blade.scale.y = 0.001; hall.mine.add(hall.sb); } }
  function hallTick(dt) {
    var h = hall; if (!h || !h.g.visible) return;
    h.parts.forEach(function (p, i) { p.m.position.z += dt * 0.9; if (p.m.position.z > 10) p.m.position.z -= 12.15; p.m.rotation.y += dt * (i % 2 ? 1 : -0.7); });
    h.arms.forEach(function (a, i) { a.arm.rotation.y = Math.sin(clock * 1.4 + i * 2) * 0.5; a.fore.rotation.z = Math.sin(clock * 2.2 + i) * 0.35; });
    h.crystals.forEach(function (c, i) { c.rotation.y += dt * 1.2; c.position.y = 1.2 + Math.sin(clock * 2 + i) * 0.05; });
    if (!h.run || h.i < 0) return;
    var s = STEPS[h.i], p = h.pose; for (var k = 0; k < 6; k++) p[k] += (s.cam[k] - p[k]) * Math.min(1, dt * 1.6);
    h.t += dt;
    if (s.build && h.d) { h.d.position.y += (0 - h.d.position.y) * Math.min(1, dt * 2.2); h.d.rotation.y += dt * 2.5; h.sparks.visible = Math.sin(clock * 40) > 0.2; h.sparks.position.set(Math.sin(clock * 9) * 0.6, 1.0 + Math.abs(Math.sin(clock * 13)) * 0.8, -1.5 + Math.cos(clock * 7) * 0.6); if (Math.random() < dt * 5) beep(true); } else h.sparks.visible = false;
    if (s.wake && h.d) { h.d.rotation.y = Math.sin(clock * 2.4) * 0.8; h.d.position.y = Math.abs(Math.sin(clock * 6)) * 0.12; h.d.userData.head.rotation.y = Math.sin(clock * 5) * 0.9; if (Math.random() < dt * 3) beep(true); }
    var dim = h.i >= 5 ? 1 : 0; h.pool.material.opacity += ((s.rise ? 0.35 : 0) - h.pool.material.opacity) * Math.min(1, dt * 2);
    if (s.rise && h.sb) { var k2 = Math.min(1, h.t / 3); h.mine.position.y = 1.25 + k2 * 0.7; h.sb.userData.blade.scale.y = Math.max(0.001, Math.min(1, (h.t - 1.5) / 1.2)); h.sb.userData.blade.visible = h.t > 1.5; h.gatherers.forEach(function (g2, i) { g2.userData.blade.visible = h.t > 2.4 + i * 0.25; g2.userData.blade.scale.y = Math.max(0.001, Math.min(1, (h.t - 2.4 - i * 0.25) / 0.8)); }); if (h.t > 1.5 && h.t - dt <= 1.5) beep(false); }
    void dim;
    if (h.t >= s.t) { h.i++; if (h.i >= STEPS.length) { st.droid = { body: h.pick.body, color: h.pick.color, head: h.pick.head }; st.saber = { color: h.pick.kyber, hilt: h.pick.hilt }; save(); apply(); showBar(null); h.run = false; sound(false); if (API.exitRide) API.exitRide(); API.toast('🤖⚔️ 你的机器人和光剑造好了！按 L 收起或点亮光剑'); } else enterStep(); }
  }
  root.addEventListener('keydown', function (e) { if (hall && hall.run && hall.i >= 0 && STEPS[hall.i] && STEPS[hall.i].pick && /^Digit[1-6]$/.test(e.code)) { var b = hall.bar && hall.bar.querySelectorAll('button')[+e.code.slice(5) - 1]; if (b) b.click(); } });
  css.textContent += '#sw-pick{display:none;position:fixed;left:50%;bottom:calc(env(safe-area-inset-bottom,0px) + 150px);transform:translateX(-50%);z-index:80;gap:12px;padding:12px 16px;border-radius:999px;background:rgba(15,23,42,.9);border:1.5px solid #38bdf8}#sw-pick button{position:relative;width:60px;height:60px;border-radius:50%;border:3px solid rgba(255,255,255,.3);font-size:28px;cursor:pointer;background:rgba(255,255,255,.1)}#sw-pick button.on{border-color:#fde047;transform:scale(1.18)}#sw-pick i{position:absolute;right:-4px;bottom:-4px;font:700 11px sans-serif;background:#0f172a;color:#fde68a;border-radius:50%;width:18px;height:18px;line-height:18px}';

  function attach(api) {
    if (API || !api) return; API = api; T = api.THREE;
    try {
      apply();
    } catch (e) { if (root.console) console.warn('[sw workshops]', e); }
    root.addEventListener('keydown', function (e) { if (e.code === 'KeyL' && saber && !ui) saberToggle(); if (e.key === 'Escape' && ui) close(); });
    var last = performance.now();
    (function tick(now) {
      requestAnimationFrame(tick); var dt = Math.min(0.05, (now - last) / 1000); last = now; clock += dt;
      if (droid) {   /* it rolls after its maker, a little behind and to the side */
        var P = API.player, tx = P.pos.x + Math.sin(P.yaw) * 1.6 + Math.cos(P.yaw) * 1.2, tz = P.pos.z + Math.cos(P.yaw) * 1.6 - Math.sin(P.yaw) * 1.2, dx = tx - droid.position.x, dz = tz - droid.position.z, d = Math.hypot(dx, dz);
        if (d > 40) droid.position.set(tx, P.pos.y, tz); else if (d > 0.25) { var sp = Math.min(d, (d > 4 ? 9 : 4.5) * dt); droid.position.x += dx / d * sp; droid.position.z += dz / d * sp; droid.rotation.y = Math.atan2(dx, dz); if (droid.userData.ball) droid.userData.ball.rotation.x += sp / 0.42; }
        droid.position.y = API.groundY(droid.position.x, droid.position.z, Math.floor(P.pos.y + 6)); droid.visible = !API.state.activeRide && !busy;
        droid.userData.head.rotation.y = Math.sin(clock * 1.7) * 0.7; if (droid.userData.lamp) droid.userData.lamp.visible = Math.sin(clock * 5) > 0;
        if (Math.random() < dt * 0.12 && d < 12) beep(true);
      }
      try { hallTick(dt); } catch (e) {}
      if (saber) { var u = saber.userData; u.k += ((u.on ? 1 : 0) - u.k) * Math.min(1, dt * 9); u.blade.scale.y = Math.max(0.001, u.k); u.blade.visible = u.k > 0.02; saber.visible = !API.state.activeRide && API.state.mode !== 'tour' && !busy; saber.rotation.z = -0.35 + Math.sin(clock * 1.3) * 0.04 - swing * 0.05; }
      try { saberSound(dt); } catch (e) {}
      if (!sbBtn) { sbBtn = document.createElement('button'); sbBtn.type = 'button'; sbBtn.id = 'sw-saber-btn'; sbBtn.textContent = '⚔️'; sbBtn.title = '收起 / 点亮光剑 (L)'; sbBtn.onclick = function (e) { e.stopPropagation(); saberToggle(); }; document.body.appendChild(sbBtn); }
      sbBtn.style.display = saber && saber.visible && !ui ? 'block' : 'none';
    })(last);
  }
  if (root.TPParkAPI) attach(root.TPParkAPI); else root.addEventListener('tp:park-ready', function (e) { attach(e.detail || root.TPParkAPI); });
  root.TPStarWarsWorkshops = { actx: actx, fx: saberFx, hum: saberHum, swing: function (v) { if (!sab) return; var c = beep.c, t = c.currentTime, k = 1 + Math.min(0.42, v * 0.07); sab.os.forEach(function (o) { o.o.frequency.setTargetAtTime(o.f * k, t, 0.04); }); sab.lp.frequency.setTargetAtTime(850 + v * 420, t, 0.05); sab.out.gain.setTargetAtTime(sab.level * (1 + Math.min(1.3, v * 0.28)), t, 0.05); }, beep: beep, busy: function (v) { busy = !!v; }, set: function (kind, spec) { st[kind] = spec; save(); if (API) apply(); }, reapply: function () { if (API) apply(); }, saberToggle: saberToggle, level: level, buildDroid: buildDroid, buildSaber: buildSaber, open: open, state: function () { return st; } };
})(window);
