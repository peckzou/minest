/* Minest · 全息模型 · 柏拉图 · 洞穴寓言 — philosophy/models/minest_plato_cave.html rebuilt as a hologram.
   The cave is a real space: a fire, carriers behind a low wall, chained prisoners and the back wall. The shadows are
   projected from the fire through each carried figure onto the wall, so moving the fire really changes them.
   Same four stages, steps and quotations (Republic VII, Jowett). */
(function () {
  'use strict';
  var HL = window.HL, T = window.THREE; if (!HL || !T || !HL.sims || !HL.simQ) return;
  var Q = HL.simQ.plato_cave, FY = -0.62, WZ = -1.15, OZ = 0.62, AM = 0xffa23a, CY = 0x46d2ff, RED = 0xff7a7a;
  function V(x, y, z) { return new T.Vector3(x, y, z); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, k) { return a + (b - a) * k; }
  var NAMES = { jar: '陶罐', horse: '马', man: '人像', bird: '鸟', tree: '树' }, ORDER = ['jar', 'horse', 'man', 'bird', 'tree'];
  var SH = {
    jar: function (c, s) { c.beginPath(); c.ellipse(0, 0, s * 0.42, s * 0.5, 0, 0, 7); c.rect(-s * 0.16, -s * 0.82, s * 0.32, s * 0.35); c.ellipse(0, -s * 0.85, s * 0.24, s * 0.07, 0, 0, 7); },
    horse: function (c, s) { c.beginPath(); c.ellipse(0, 0, s * 0.6, s * 0.26, 0, 0, 7); c.moveTo(s * 0.35, -s * 0.1); c.lineTo(s * 0.62, -s * 0.62); c.lineTo(s * 0.85, -s * 0.5); c.lineTo(s * 0.5, 0); c.rect(-s * 0.5, 0, s * 0.1, s * 0.55); c.rect(-s * 0.28, 0, s * 0.1, s * 0.55); c.rect(s * 0.2, 0, s * 0.1, s * 0.55); c.rect(s * 0.42, 0, s * 0.1, s * 0.55); },
    man: function (c, s) { c.beginPath(); c.arc(0, -s * 0.62, s * 0.2, 0, 7); c.rect(-s * 0.2, -s * 0.4, s * 0.4, s * 0.6); c.rect(-s * 0.2, s * 0.2, s * 0.15, s * 0.45); c.rect(s * 0.05, s * 0.2, s * 0.15, s * 0.45); c.rect(-s * 0.48, -s * 0.36, s * 0.96, s * 0.1); },
    bird: function (c, s) { c.beginPath(); c.ellipse(0, 0, s * 0.42, s * 0.2, 0, 0, 7); c.moveTo(-s * 0.1, 0); c.lineTo(-s * 0.5, -s * 0.6); c.lineTo(s * 0.2, -s * 0.05); c.moveTo(s * 0.35, -s * 0.05); c.lineTo(s * 0.7, -s * 0.12); c.lineTo(s * 0.36, s * 0.06); },
    tree: function (c, s) { c.beginPath(); c.moveTo(0, -s * 0.9); c.lineTo(s * 0.5, -s * 0.05); c.lineTo(-s * 0.5, -s * 0.05); c.closePath(); c.rect(-s * 0.08, -s * 0.05, s * 0.16, s * 0.6); }
  };

  // the cave: back wall, prisoners, low wall, carriers with their projected shadows, the fire
  function cave(K, o) {
    var s = K.st; o = o || {};
    K.grid(0, FY, 4.6, 2.9, 0x8a6a40, 0.05);
    s.wall = K.flat(4.6, 1.75, K.solid(0xc98a3a, 0.3)); s.wall.position.set(0, FY + 0.875, WZ);
    K.line([V(-2.3, FY, WZ), V(-2.3, FY + 1.75, WZ), V(2.3, FY + 1.75, WZ), V(2.3, FY, WZ)], K.lineMat(0xffc46a, 0.7));
    K.label('洞壁 · 囚徒只看得见这里', { h: 0.12, color: '#ffb454' }).position.set(0, FY + 1.88, WZ);
    s.low = K.mesh(new T.BoxGeometry(2.6, 0.5, 0.08), K.glow(0x8a6a40, 0.35)); s.low.position.set(0, FY + 0.25, OZ - 0.2);
    s.pris = [-0.7, 0, 0.7].map(function (x, i) { var p = K.person(i === 1 && o.free ? CY : 0xb9a58a, 1); p.position.set(x, FY, -0.25); p.rotation.y = Math.PI; return p; });
    K.line([V(-0.95, FY + 0.06, -0.25), V(0.95, FY + 0.06, -0.25)], K.lineMat(0x9aa7b5, 0.6, true));
    s.fire = new T.Group(); s.fire.position.set(0, FY + 0.6, 1.3); K.add(s.fire);
    s.flame = K.mesh(new T.ConeGeometry(0.11, 0.34, 14), K.holo(AM, { core: 0.9, rim: 1.2 }), s.fire); s.flame.position.y = 0.1;
    s.halo = K.sphere(0.3, K.glow(AM, 0.16), s.fire);
    s.tex = {}; ORDER.forEach(function (k) { s.tex[k] = K.shape(SH[k]); });
    s.car = []; s.seq = 0;
    for (var i = 0; i < 3; i++) {
      var k = ORDER[s.seq++ % 5], c = { sh: k, x: 0.85 - i * 0.6 };
      c.obj = K.flat(0.3, 0.3, K.solid(0xffd9a0, 0.95, s.tex[k])); c.obj.material.blending = T.AdditiveBlending;
      c.rod = K.line([V(0, 0, 0), V(0, 0, 0)], K.lineMat(0xb9a58a, 0.5));
      c.shadow = K.flat(1, 1, K.solid(0x070605, 0.9, s.tex[k])); c.shadow.renderOrder = 2;
      s.car.push(c);
    }
    s.dim = 1;
  }
  function caveStep(K, dt, t) {
    var s = K.st, F = s.fire.position, k = (WZ + 0.01 - F.z) / (OZ - F.z);
    s.flame.scale.set(1 + 0.08 * Math.sin(t * 13), 1 + 0.14 * Math.sin(t * 9.1), 1); s.halo.scale.setScalar(1 + 0.08 * Math.sin(t * 7));
    s.car.forEach(function (c) {
      c.x -= dt * 0.13;
      if (c.x < -0.95) { c.x += 1.8; c.sh = (s.forced && s.forced.shift()) || ORDER[s.seq++ % 5]; c.obj.material.map = s.tex[c.sh]; c.shadow.material.map = s.tex[c.sh]; if (s.onSpawn) s.onSpawn(c); }
      var oy = FY + 0.78 + Math.sin(t * 4 + c.x * 9) * 0.012;
      c.obj.position.set(c.x, oy, OZ); K.setLine(c.rod, [V(c.x, FY + 0.05, OZ), V(c.x, oy - 0.12, OZ)]);
      var sx = F.x + k * (c.x - F.x), sy = F.y + k * (oy - F.y);
      c.shadow.position.set(sx, sy, WZ + 0.012); c.shadow.scale.setScalar(0.3 * k);
      var inside = Math.abs(sx) < 2.2 - 0.15 * k && sy > FY + 0.15 * k && sy < FY + 1.75 - 0.1 * k;
      c.shadow.material.opacity = inside ? 0.9 * s.dim : 0; c.obj.material.opacity = 0.95 * s.dim;
    });
    s.wall.material.opacity = (0.26 + 0.05 * Math.sin(t * 9)) * s.dim;
  }

  /* ───────────── ① 影子的世界 ───────────── */
  var S1 = {
    name: '影子的世界', hint: '拖动火焰，墙上的影子随之变形；轻点一个搬运者听回声；再切到「囚徒之眼」猜下一个影子。', quotes: Q[0],
    init: function (K) {
      var s = K.st; cave(K); s.t = 0; s.eye = false; s.game = { score: 0, streak: 0, honor: 0, guess: null };
      s.echo = K.label('', { h: 0.14, color: '#ffffff' }); s.echoT = 0;
      s.onSpawn = function (c) {
        var g = s.game; if (!s.eye) return;
        if (g.guess == null) K.toast('没来得及预测：来的是' + NAMES[c.sh]);
        else if (g.guess === c.sh) { g.score++; g.streak++; if (g.streak % 2 === 0 && g.honor < 5) { g.honor++; K.toast('★ 你赢得了囚徒们的荣誉：你最善于推断影子的次序'); K.hit(4); } else K.toast('猜中了：' + NAMES[c.sh]); }
        else { g.streak = 0; K.toast('猜错了，来的是' + NAMES[c.sh]); }
        if (g.score >= 3) K.hit(5);
        g.guess = null; HL.refreshTools();
      };
      K.hit(0);
    },
    update: function (K, dt, t) {
      var s = K.st; s.t += dt; if (s.t > 1.5) K.hit(1);
      caveStep(K, dt, t);
      if (s.echoT > 0) { s.echoT -= dt; s.echo.material.opacity = clamp(s.echoT, 0, 1); if (s.echoT <= 0) K.text(s.echo, ''); }
      K.info(s.eye ? '你是囚徒，只看得见墙。影子按固定的次序出现 —— 在下方选出「下一个影子」  荣誉 ' + '★'.repeat(s.game.honor) + '☆'.repeat(5 - s.game.honor) + ' · 猜中 ' + s.game.score
        : '拖动火焰：影子是火光穿过矮墙上的器物投到洞壁上的 · 轻点一个搬运者：听听声音像是从哪里来的');
    },
    pick: function (K, x, y) { var s = K.st; if (K.px(s.fire.position, x, y) < 56) return { drag: true, fire: true }; var c = K.near(s.car.map(function (q) { return q.obj; }), x, y, 44); return c ? { car: c } : null; },
    dragStart: function (K, h, x, y) { h.d = K.facing(K.st.fire.position, x, y); },
    dragMove: function (K, h, x, y) { var p = h.d && h.d.to(x, y); if (!p) return; K.st.fire.position.set(clamp(p.x, -1.3, 1.3), clamp(p.y, FY + 0.35, FY + 1.1), 1.3); K.hit(2); },
    tap: function (K, h) {
      var s = K.st; if (!h || !h.car) return;
      var c = s.car.filter(function (q) { return q.obj === h.car; })[0]; if (!c) return;
      K.text(s.echo, '“……”　声音好像是影子在说话'); s.echo.position.copy(c.shadow.position); s.echo.position.y += 0.32; s.echo.position.z += 0.05; s.echoT = 2.6; K.hit(3);
    },
    chips: function (K, box) {
      var s = K.st;
      HL.ui.chip(box, s.eye ? '◉ 囚徒之眼' : '○ 囚徒之眼', s.eye, function () { s.eye = !s.eye; if (s.eye) { K.focus(V(0, FY + 0.85, WZ), 3.0); HL.cam.g.el = 0.02; K.toast('你现在只能看见墙。注意影子出现的先后次序。'); } else K.home(); HL.refreshTools(); }, '坐到囚徒的位置上，参加猜影子比赛');
      if (s.eye) ORDER.forEach(function (k) { HL.ui.chip(box, NAMES[k], s.game.guess === k, function () { s.game.guess = k; HL.refreshTools(); }, '我猜下一个影子是' + NAMES[k]); });
    }
  };

  /* ───────────── ② 转身 ───────────── */
  var S2 = {
    name: '转身', hint: '按住中间那位囚徒的头向右拖，让他转过身去看火；松手看看会怎样；再转到底坚持住。', quotes: Q[1],
    init: function (K) {
      var s = K.st; cave(K, { free: true }); s.n = 0; s.max = 0; s.saw = 0; s.hold = false; s.bounced = false;
      s.ring = K.mesh(new T.TorusGeometry(0.13, 0.008, 6, 32), K.glow(0xffe6a0, 0.9)); s.ring.position.set(0, FY + 0.42, -0.25);
      s.gaze = K.line([V(0, 0, 0), V(0, 0, 0)], K.lineMat(0xffffff, 0.7, true));
      s.glare = K.sphere(0.5, K.glow(0xfff2d0, 0)); s.msg = K.label('', { h: 0.14, color: '#ffffff' }); s.msg.position.set(0, FY + 1.35, 0.5);
      s.bar = K.mesh(new T.BoxGeometry(1, 0.05, 0.02), K.glow(RED, 0.9)); s.bar.position.set(1.55, FY + 1.5, -0.2);
      K.line([V(1.05, FY + 1.5, -0.2), V(2.05, FY + 1.5, -0.2)], K.lineMat(0xffffff, 0.3));
      K.label('眼睛的刺痛', { h: 0.11, color: '#ff7a7a' }).position.set(1.55, FY + 1.62, -0.2);
    },
    update: function (K, dt, t) {
      var s = K.st; caveStep(K, dt, t);
      if (!s.hold) s.n = Math.max(0, s.n - dt * (0.8 + s.n));
      var n = s.n, p = s.pris[1]; s.max = Math.max(s.max, n);
      p.rotation.y = Math.PI * (1 - n);
      var a = Math.PI * (1 - n), eye = V(0, FY + 0.42, -0.25);
      K.setLine(s.gaze, [eye, V(Math.sin(a) * 1.3, FY + 0.42 + n * 0.25, -0.25 + Math.cos(a) * 1.3)]);
      var pain = Math.pow(n, 1.5), clear = clamp(s.saw / 3, 0, 1);
      s.bar.scale.x = Math.max(0.001, pain); s.bar.position.x = 1.05 + pain / 2;
      s.glare.position.copy(s.fire.position); s.glare.scale.setScalar(1 + n * 3.2 * (1 - clear * 0.6)); s.glare.material.opacity = n * n * 0.5 * (1 - clear * 0.5);
      s.car.forEach(function (c) { c.obj.material.opacity = 0.35 + 0.6 * (n < 0.5 ? 1 - n : clear); });
      if (n > 0.2) K.hit(0); if (n > 0.55 && n < 0.85) K.hit(1);
      if (!s.hold && s.max > 0.3 && n < 0.05 && !s.bounced) { s.bounced = true; K.hit(2); K.toast('一松手，他就转回去看墙了：那里“更清楚”'); }
      if (s.hold && n > 0.9) { s.saw += dt; if (s.saw > 2) K.hit(3); }
      K.text(s.msg, clear > 0.6 ? '这些木头和石头做的东西……难道比墙上的影子更真实？' : n > 0.55 ? '强光刺眼 —— 火堆前的东西一片模糊' : '');
      K.info('转头 ' + Math.round(n * 180) + '°' + (s.saw > 0 ? ' · 直视火光 ' + s.saw.toFixed(1) + ' 秒' : '') + ' —— 按住发亮的头向右拖动；松手他会自己转回去');
    },
    pick: function (K, x, y) { return K.px(K.st.ring.position, x, y) < 70 ? { drag: true } : null; },
    dragStart: function (K, h, x) { var s = K.st; s.hold = true; s.bounced = false; h.x = x; },
    dragMove: function (K, h, x) { var s = K.st; s.n = clamp(s.n + (x - h.x) / 300 * (1 - s.n * 0.55), 0, 1); h.x = x; },
    dragEnd: function (K) { K.st.hold = false; }
  };

  /* ───────────── ③ 上升 ───────────── */
  var STG = ['什么也看不见', '影子', '水中的倒影', '事物本身', '月亮与星辰', '太阳'];
  var S3 = {
    name: '上升', hint: '按住画面（或空格）带他沿陡坡走出洞穴；走得太快会被强光逼退 —— 停下来，让眼睛慢慢适应。', quotes: Q[2],
    init: function (K) {
      var s = K.st; s.p = 0; s.adapt = 0; s.blind = 0; s.pushed = false;
      K.root.position.x = -0.55;
      var top = FY + 1.0;
      s.path = [V(-2.1, FY, 0.3), V(-0.3, top, 0.3), V(0.5, top, 0.3)];
      K.grid(-1.6, FY, 1.2, 1.6, 0x8a6a40, 0.3);
      K.line([V(-2.1, FY, -0.2), V(-0.3, top, -0.2), V(-0.3, top, 0.8), V(-2.1, FY, 0.8), V(-2.1, FY, -0.2)], K.lineMat(0xffc46a, 0.6));
      for (var i = 1; i < 9; i++) { var k = i / 9; K.line([V(lerp(-2.1, -0.3, k), lerp(FY, top, k), -0.2), V(lerp(-2.1, -0.3, k), lerp(FY, top, k), 0.8)], K.lineMat(0x8a6a40, 0.35)); }
      K.label('洞内 · 陡峭崎岖的坡道', { h: 0.11, color: '#ffb454' }).position.set(-1.5, FY + 0.05, 1.0);
      K.grid(1.0, top, 2.7, 1.9, 0x7dffb0, 0.3);
      K.label('洞外', { h: 0.13, color: '#7dffb0' }).position.set(1.0, top + 0.04, 1.4);
      s.fig = K.person(CY, 1); s.glare = K.sphere(0.3, K.glow(0xffffff, 0));
      var tex = K.shape(SH.tree), htex = K.shape(SH.horse);
      s.sh = [K.flat(0.5, 0.16, K.solid(0x05080a, 0)), K.flat(0.36, 0.12, K.solid(0x05080a, 0))];
      s.sh[0].rotation.x = s.sh[1].rotation.x = -Math.PI / 2; s.sh[0].position.set(1.55, top + 0.01, -0.05); s.sh[1].position.set(2.0, top + 0.01, 0.15);
      s.pond = K.mesh(new T.CircleGeometry(0.42, 40), K.glow(0x3aa0e0, 0.3)); s.pond.rotation.x = -Math.PI / 2; s.pond.position.set(1.2, top + 0.006, 0.75);
      s.refl = K.flat(0.5, 0.5, K.solid(0x7dffb0, 0, tex)); s.refl.rotation.x = -Math.PI / 2; s.refl.scale.y = -0.6; s.refl.position.set(1.2, top + 0.012, 0.78); s.refl.material.blending = T.AdditiveBlending;
      s.tree = K.flat(0.9, 0.9, K.solid(0x7dffb0, 0, tex)); s.tree.position.set(1.5, top + 0.52, -0.35); s.tree.material.blending = T.AdditiveBlending;
      s.horse = K.flat(0.5, 0.5, K.solid(0xffc46a, 0, htex)); s.horse.position.set(2.0, top + 0.22, -0.1); s.horse.material.blending = T.AdditiveBlending;
      s.moon = K.sphere(0.13, K.glow(0xfff8d6, 0)); s.moon.position.set(1.9, top + 1.25, -0.7);
      s.stars = K.dots(40, 0.07); for (i = 0; i < 40; i++) { s.stars.set(i, 0.2 + ((i * 137) % 100) / 100 * 2.3, top + 0.9 + ((i * 71) % 60) / 100, -0.9 + ((i * 29) % 40) / 100); s.stars.rgb(i, 0, 0, 0); } s.stars.flush();
      s.sun = K.sphere(0.2, K.holo(0xfff0a0, { core: 1.2, rim: 1.4, op: 0 })); s.sun.position.set(1.3, top + 1.35, -0.6); s.sunH = K.sphere(0.5, K.glow(0xfff0a0, 0)); s.sunH.position.copy(s.sun.position);
      s.lab = K.label('', { h: 0.14, color: '#ffffff' }); s.lab.position.set(1.0, top + 1.72, 0);
    },
    update: function (K, dt, t) {
      var s = K.st;
      if (K.pressed) s.p = clamp(s.p + dt * 0.11, 0, 1);
      s.adapt = Math.min(s.p, s.adapt + dt * 0.06 * (s.p > 0.04 ? 1 : 0));
      var over = s.p - s.adapt; s.blind = lerp(s.blind, clamp(over * 4, 0, 1), dt * 3);
      if (over > 0.28) { s.p = Math.max(s.adapt + 0.05, s.p - dt * 0.4); if (!s.pushed) { s.pushed = true; K.toast('光太强了！他什么也看不见，被逼得后退'); K.hit(1); } } else s.pushed = false;
      if (s.p > 0.05) K.hit(0);
      var st = s.adapt < 0.12 ? 0 : s.adapt < 0.3 ? 1 : s.adapt < 0.5 ? 2 : s.adapt < 0.72 ? 3 : s.adapt < 0.9 ? 4 : 5;
      if (st >= 3) K.hit(2); if (st >= 4) K.hit(3); if (st >= 5) K.hit(4);
      var u = s.p < 0.6 ? s.p / 0.6 : 1 + (s.p - 0.6) / 0.4, a = s.path[Math.min(1, Math.floor(u))], b = s.path[Math.min(2, Math.floor(u) + 1)], f = u - Math.floor(u); if (u >= 2) f = 1;
      s.fig.position.lerpVectors(a, b, f); s.fig.position.y += Math.abs(Math.sin(t * 7)) * (K.pressed ? 0.02 : 0);
      s.glare.position.copy(s.fig.position); s.glare.position.y += 0.42; s.glare.scale.setScalar(1 + s.blind * 5); s.glare.material.opacity = s.blind * 0.55;
      var al = function (k) { return clamp((s.adapt - k) * 8, 0, 1) * (1 - s.blind * 0.8); }, night = st === 4 ? 1 : 0;
      s.sh[0].material.opacity = s.sh[1].material.opacity = 0.85 * al(0.12);
      s.refl.material.opacity = 0.6 * al(0.3); s.tree.material.opacity = al(0.5); s.horse.material.opacity = al(0.5);
      s.moon.material.opacity = night * 0.95; for (var i = 0; i < 40; i++) { var tw = night * (0.5 + 0.5 * Math.sin(t * 3 + i)); s.stars.rgb(i, tw, tw, tw * 0.9); } s.stars.flush();
      var sun = st === 5 ? 1 : 0; s.sun.material.uniforms.uOp.value += (sun - s.sun.material.uniforms.uOp.value) * dt * 2; s.sunH.material.opacity = s.sun.material.uniforms.uOp.value * 0.3; s.sunH.scale.setScalar(1 + 0.1 * Math.sin(t * 2));
      K.text(s.lab, s.p > 0.3 ? '他现在能看清：' + STG[st] : '');
      K.info('路程 ' + Math.round(s.p * 100) + '% · 眼睛的适应 ' + Math.round(s.adapt * 100) + '% —— ' + (s.p < 0.05 ? '按住画面（或空格），带他走出洞穴' : over > 0.15 ? '太快了 —— 松手停下，让眼睛适应' : s.p >= 1 && st < 5 ? '已经到了洞外。停留越久，看见的越多' : '慢慢来：停留越久，看见的越多'));
    }
  };

  /* ───────────── ④ 返回 ───────────── */
  var S4 = {
    name: '返回', hint: '他从阳光下回到洞里，眼前一片漆黑。先参加一次辨认影子的比赛，再把他拖向其他囚徒，试着解开他们。', quotes: Q[3],
    init: function (K) {
      var s = K.st; cave(K); s.dark = 1; s.contest = null; s.mocked = false; s.crowd = 0; s.killed = false; s.t = 0;
      s.back = K.person(CY, 1.05); s.back.position.set(1.5, FY, -0.25); s.backL = K.label('归来者（可拖动）', { h: 0.11, color: '#6fe3ff', parent: s.back }); s.backL.position.y = 0.62;
      s.msg = K.label('', { h: 0.15, color: '#ffffff' }); s.msg.position.set(0, FY + 1.45, 0.2); s.msg2 = K.label('', { h: 0.15, color: '#ff7a7a' }); s.msg2.position.set(0, FY + 1.25, 0.2);
      s.arms = s.pris.map(function () { return K.line([V(0, 0, 0), V(0, 0, 0)], K.lineMat(RED, 0)); });
      K.hit(0);
    },
    update: function (K, dt, t) {
      var s = K.st; s.t += dt; s.dark = Math.max(0, s.dark - dt * 0.045); s.dim = 1 - s.dark * 0.93; caveStep(K, dt, t);
      if (s.contest) {
        var c = s.contest; c.t += dt; var ok = s.dark < 0.2;
        K.text(s.msg, '囚徒们：“' + NAMES[c.sh] + '！” ✓　　归来者：' + (ok ? '“' + NAMES[c.sh] + '” ✓' : '“……我看不清” ✗'));
        if (!ok && c.t > 1.2) { K.text(s.msg2, '“他上去一趟，回来眼睛就坏了！”'); if (!s.mocked) { s.mocked = true; K.hit(2); } }
        if (c.t > 4) { s.contest = null; K.text(s.msg, ''); K.text(s.msg2, ''); }
      }
      var near = s.back.position.x < 1.05; s.crowd = lerp(s.crowd, near ? 1 : 0, dt * 2);
      s.pris.forEach(function (p, i) { var a = V(p.position.x, FY + 0.3, -0.25), b = a.clone().lerp(V(s.back.position.x, FY + 0.3, s.back.position.z), s.crowd * 0.85); K.setLine(s.arms[i], [a, b]); s.arms[i].material.opacity = s.crowd; p.rotation.y = Math.PI - s.crowd * 1.2 * (p.position.x < s.back.position.x ? 1 : -1); });
      if (s.crowd > 0.15 && !s.contest) { K.text(s.msg2, '“别碰我们！谁敢带人上去，就杀了他！”'); if (s.crowd > 0.7 && !s.killed) { s.killed = true; K.hit(3); setTimeout(function () { if (K.st === s) K.hit(4); }, 2500); } } else if (!s.contest) K.text(s.msg2, '');
      K.info('眼睛对黑暗的适应 ' + Math.round((1 - s.dark) * 100) + '% —— ' + (s.dark > 0.5 ? '从阳光下回来，眼前一片漆黑……试试「参加辨认影子比赛」' : '把归来者拖向其他囚徒，试着解开他们'));
    },
    pick: function (K, x, y) { var p = K.st.back.position; return K.px(V(p.x, p.y + 0.3, p.z), x, y) < 60 ? { drag: true } : null; },
    dragMove: function (K, h, x, y) { var p = K.onPlane(x, y, FY); if (p) K.st.back.position.set(clamp(p.x, -1.6, 2.0), FY, clamp(p.z, -0.6, 0.3)); },
    chips: function (K, box) { var s = K.st; HL.ui.chip(box, '⚑ 参加辨认影子比赛', false, function () { var c = s.car.slice().sort(function (a, b) { return Math.abs(a.x) - Math.abs(b.x); })[0]; s.contest = { t: 0, sh: c.sh }; K.hit(1); }, '和囚徒们比谁先认出墙上的影子'); }
  };

  HL.sims.define('plato_cave', { lift: -0.2, zoom: 1.05, title: '柏拉图 · 洞穴寓言', source: '——《理想国》VII ', flat: true,
    core: '如果一个人一辈子只见过影子，他凭什么知道那不是全部的真实？走出去的人回来之后，又会遭遇什么？', stages: [S1, S2, S3, S4] });
})();
