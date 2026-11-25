/* Minest · 全息模型 · 笛卡尔 · 方法性怀疑 — minest_descartes.html rebuilt as a hologram.
   Same four stages, steps and quotations (Meditations I–II). */
(function () {
  'use strict';
  var HL = window.HL, T = window.THREE; if (!HL || !T || !HL.sims || !HL.simQ) return;
  var Q = HL.simQ.descartes, FY = -0.62, AM = 0xffa23a, CY = 0x46d2ff, PU = 0xb58cff, RED = 0xff7a7a, GR = 0x7dffb0, GOLD = 0xffd96b, WH = 0xffffff;
  function V(x, y, z) { return new T.Vector3(x, y, z); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function msg(K, y) { var m = K.label('', { h: 0.14, color: '#ffffff' }); m.position.set(0, FY + (y || 2.3), 0); return m; }
  var BEL = ['天是蓝的', '我有两只手', '火是热的', '老师说的', '书上写的', '2+3=5', '我在房间里', '昨天下过雨', '糖是甜的', '塔是圆的', '我醒着', '大地存在'];

  var D1 = {
    name: '信念的大厦', hint: '轻点几块砖，一块块检验；太慢了 —— 把左边的撬棍拖到地基下面，再按住画面（或空格）撬动。', quotes: Q[0],
    init: function (K) {
      var s = K.st; K.grid(0, FY, 4.2, 1.8, 0x46d2ff); s.t = 0; s.chk = 0; s.pry = 0; s.set = false; s.fall = 0;
      s.b = BEL.map(function (n, i) { var r = Math.floor(i / 4), c = i % 4, m = K.mesh(new T.BoxGeometry(0.66, 0.3, 0.4), K.holo(0xffc46a, { core: 0.45 })); m.userData = { home: V(-1.05 + c * 0.7 + (r % 2) * 0.12, FY + 0.5 + r * 0.33, 0), vx: (c - 1.5) * 0.5, sp: 0.5 + ((i * 7) % 5) / 5 }; m.position.copy(m.userData.home); K.label(n, { h: 0.1, color: '#ffffff', parent: m }).position.z = 0.21; return m; });
      s.base = K.mesh(new T.BoxGeometry(3.1, 0.3, 0.5), K.holo(0x9aa7b5, { core: 0.5 })); s.base.position.set(0, FY + 0.17, 0); K.label('地基：感官告诉我的', { h: 0.11, color: '#ffffff', parent: s.base }).position.z = 0.26;
      s.bar = K.mesh(new T.BoxGeometry(1.0, 0.05, 0.05), K.holo(WH, { core: 0.9 })); s.home = V(-1.9, FY + 1.2, 0.6); s.bar.position.copy(s.home); s.bar.rotation.z = 0.5; K.label('撬棍（拖我）', { h: 0.1, color: '#ffffff', parent: s.bar }).position.y = 0.16; s.msg = msg(K, 1.95);
    },
    update: function (K, dt, t) {
      var s = K.st; s.t += dt; if (s.t > 1) K.hit(0);
      if (s.set && K.pressed) { s.pry = Math.min(1, s.pry + dt * 0.4); s.bar.rotation.z = 0.5 + Math.sin(t * 9) * 0.25; }
      if (s.pry >= 1) { s.fall = Math.min(1, s.fall + dt * 0.5); K.hit(2); if (s.fall >= 1) K.hit(3); }
      s.base.rotation.z = s.pry * 0.12; s.b.forEach(function (m) { var u = m.userData, f = clamp(s.fall * 1.6 * u.sp, 0, 1); m.position.set(u.home.x + u.vx * f + Math.sin(t * 20) * 0.01 * s.pry * (1 - f), lerp(u.home.y, FY + 0.16, f * f), u.home.z + f * 0.6 * (u.sp - 0.7)); m.rotation.z = f * u.vx * 1.6; });
      K.text(s.msg, s.fall >= 1 ? '不必一一证明它们是假的：只要有一点可疑，就整个推倒重来' : s.chk >= 3 ? '一块块检验，一辈子也查不完 —— 去撬地基' : '');
      K.info(s.set ? '按住画面（或空格）撬动地基 ' + Math.round(s.pry * 100) + '%' : '轻点砖块检验（已检验 ' + s.chk + ' 块）· 把撬棍拖到地基下面');
    },
    pick: function (K, x, y) { var s = K.st; if (!s.set && K.px(s.bar.position, x, y) < 70) return { drag: true }; var m = K.near(s.b, x, y, 50); return m ? { m: m } : null; },
    dragStart: function (K, h, x, y) { h.d = K.facing(K.st.bar.position, x, y); }, dragMove: function (K, h, x, y) { var p = h.d && h.d.to(x, y); if (p) K.st.bar.position.copy(p); },
    dragEnd: function (K) { var s = K.st, p = s.bar.position; if (p.y < FY + 0.6 && Math.abs(p.x) < 2.2) { p.set(-1.75, FY + 0.12, 0.3); s.set = true; K.toast('撬棍插到地基下面了：按住画面撬动'); } else p.copy(s.home); },
    tap: function (K, h) { var s = K.st; if (h && h.m && !h.m.userData.c) { h.m.userData.c = true; h.m.material.uniforms.uColor.value.setHex(0xff9f6a); s.chk++; K.toast('“' + BEL[s.b.indexOf(h.m)] + '”……它也是从感官来的，有点可疑'); if (s.chk >= 3) K.hit(1); } }
  };
  var D2 = {
    name: '感官', hint: '远处有一座塔。按住画面（或空格）向前走，走近了再看；然后点「看看近处」。', quotes: Q[1],
    init: function (K) {
      var s = K.st; K.grid(0, FY, 4.4, 2.2, 0x46d2ff); s.d = 0; s.t = 0; s.near = false;
      s.round = K.mesh(new T.CylinderGeometry(0.28, 0.28, 1.5, 24), K.holo(0xcfe3f2, { core: 0.5 })); s.sq = K.mesh(new T.BoxGeometry(0.52, 1.5, 0.52), K.holo(0xcfe3f2, { core: 0.5 })); s.round.position.set(1.5, FY + 0.75, -0.4); s.sq.position.copy(s.round.position); s.sq.rotation.y = 0.5;
      s.tl = K.label('', { h: 0.14, color: '#ffffff' }); s.tl.position.set(1.5, FY + 1.75, -0.4); s.me = K.person(CY, 1.3); K.label('我', { h: 0.12, color: '#6fe3ff', parent: s.me }).position.y = 0.7;
      s.fire = K.mesh(new T.ConeGeometry(0.12, 0.3, 10), K.holo(AM, { core: 1 })); s.paper = K.mesh(new T.BoxGeometry(0.3, 0.02, 0.4), K.holo(WH, { core: 0.8 })); s.hand = K.sphere(0.08, K.holo(0xffb27c, { core: 0.8 })); [s.fire, s.paper, s.hand].forEach(function (m) { m.visible = false; }); s.msg = msg(K, 2.2);
    },
    update: function (K, dt, t) {
      var s = K.st; s.t += dt; if (s.t > 1) K.hit(0); if (K.pressed) s.d = Math.min(1, s.d + dt * 0.3); var k = clamp((s.d - 0.55) / 0.3, 0, 1);
      s.me.position.set(lerp(-1.9, 0.7, s.d), FY, 0.4); s.round.material.uniforms.uOp.value = 1 - k; s.sq.material.uniforms.uOp.value = k; s.round.visible = k < 1; s.sq.visible = k > 0; K.text(s.tl, k < 0.5 ? '远处的塔：看起来是圆的' : '走近了：原来是方的'); if (k >= 1) K.hit(1);
      var p = s.me.position; s.fire.position.set(p.x + 0.4, FY + 0.15, 0.7); s.fire.scale.y = 1 + 0.15 * Math.sin(t * 11); s.paper.position.set(p.x + 0.25, FY + 0.5, 0.4); s.hand.position.set(p.x + 0.16, FY + 0.56, 0.45);
      K.text(s.msg, s.near ? '我坐在炉火旁，手里拿着这张纸 —— 这样近、这样清楚的东西，也能怀疑吗？' : k >= 1 ? '感官骗过我一次；对骗过我们的，不该完全信任' : '');
      K.info(s.d < 1 ? '按住画面（或空格）向前走 ' + Math.round(s.d * 100) + '%' : '感官在远的、小的东西上会出错。那近处的呢？点「看看近处」');
    },
    chips: function (K, box) { var s = K.st; HL.ui.chip(box, '🔥 看看近处', s.near, function () { s.near = true; [s.fire, s.paper, s.hand].forEach(function (m) { m.visible = true; }); K.hit(2); HL.refreshTools(); }, '炉火、手、纸'); }
  };
  var D3 = {
    name: '梦', hint: '按住画面（或空格）“掐自己”，找一个能证明你醒着的标志；点「醒 / 梦」来回切换，看看有什么不同；最后点「全能者」。', quotes: Q[2],
    init: function (K) {
      var s = K.st; s.dream = false; s.pin = 0; s.sw = 0;
      s.room = K.line([V(-1.6, FY, -0.6), V(1.6, FY, -0.6), V(1.6, FY + 1.7, -0.6), V(-1.6, FY + 1.7, -0.6), V(-1.6, FY, -0.6)], K.lineMat(CY, 0.8)); K.grid(0, FY, 3.2, 1.6, 0x46d2ff, 0.2);
      s.me = K.person(CY, 1.5); s.me.position.set(-0.6, FY, 0.2); s.fire = K.mesh(new T.ConeGeometry(0.14, 0.34, 10), K.holo(AM, { core: 1 })); s.fire.position.set(0.5, FY + 0.17, 0.2);
      s.st = K.label('', { h: 0.16, color: '#ffffff' }); s.st.position.set(0, FY + 1.95, -0.6); s.ouch = K.label('', { h: 0.13, color: '#ff7a7a' }); s.ouch.position.set(-0.6, FY + 0.95, 0.2);
      s.math = K.label('2 + 3 = 5', { h: 0.26, color: '#ffd96b' }); s.math.position.set(0, FY + 1.2, -0.55); s.sq = K.label('正方形有四条边', { h: 0.13, color: '#ffd96b' }); s.sq.position.set(0, FY + 0.9, -0.55); s.msg = msg(K, 2.35);
    },
    update: function (K, dt, t) {
      var s = K.st; if (K.pressed) { s.pin += dt; K.hit(0); if (s.pin > 3) K.hit(1); }
      K.text(s.st, s.dream ? '梦 里' : '醒 着'); s.room.material.color.setHex(s.dream ? PU : CY); s.me.userData.mat.uniforms.uColor.value.setHex(s.dream ? PU : CY);
      K.text(s.ouch, K.pressed ? '掐！疼 —— 可梦里掐自己也会疼' : ''); s.fire.scale.y = 1 + 0.15 * Math.sin(t * 11);
      var w = s.god ? 0.5 + 0.5 * Math.sin(t * 9) : 1; s.math.material.opacity = w; K.text(s.math, s.god && Math.sin(t * 2) > 0 ? '2 + 3 = 6 ？' : '2 + 3 = 5');
      K.text(s.msg, s.god ? '如果有一位全能者，让我每次数正方形的边、每次做加法时都算错呢？' : s.sw >= 2 ? '醒也好，梦也好：二加三总是五，正方形总是四条边' : s.pin > 3 ? '没有任何确凿的标志能把醒和梦分开' : '');
      K.info('房间、炉火、身体：醒着和梦里一模一样 —— 按住画面（或空格）掐自己 · 用下方按钮切换');
    },
    chips: function (K, box) { var s = K.st; HL.ui.chip(box, s.dream ? '☾ 梦 → 醒' : '☀ 醒 → 梦', s.dream, function () { s.dream = !s.dream; s.sw++; if (s.sw >= 2) K.hit(2); HL.refreshTools(); }); HL.ui.chip(box, '👁 全能者', !!s.god, function () { s.god = true; K.hit(3); HL.refreshTools(); }, '若有一位全能者让我算错？'); }
  };
  var D4 = {
    name: '恶魔与我思', hint: '恶魔吞掉一切信念。按住画面（或空格）“悬置判断”抵御它；等中心出现“我”，把恶魔的攻击（红球）一个个拖向“我”；最后轻点“我”。', quotes: Q[3],
    init: function (K) {
      var s = K.st; s.t = 0; s.sus = 0; s.n = 0; s.eat = 0;
      s.demon = K.mesh(new T.IcosahedronGeometry(0.4, 0), K.holo(RED, { core: 0.5, rim: 2 })); s.demon.position.set(0, FY + 2.2, -0.3); K.label('恶魔：全力欺骗我', { h: 0.12, color: '#ff7a7a' }).position.set(0, FY + 2.75, -0.3);
      s.w = ['天空', '大地', '颜色', '形状', '声音', '我的身体'].map(function (n, i) { var a = i / 6 * Math.PI * 2, l = K.label(n, { h: 0.14, color: '#ffffff' }); l.userData.h = V(Math.cos(a) * 1.7, FY + 0.9 + Math.sin(a) * 0.5, Math.sin(a) * 0.3); l.position.copy(l.userData.h); return l; });
      s.sh = K.mesh(new T.SphereGeometry(0.75, 24, 16), K.glow(CY, 0, { wire: true })); s.sh.position.set(0, FY + 0.9, 0);
      s.I = K.sphere(0.12, K.holo(GOLD, { core: 1.2 })); s.I.position.set(0, FY + 0.9, 0); s.I.visible = false; s.Il = K.label('', { h: 0.16, color: '#ffd96b' }); s.Il.position.set(0, FY + 1.3, 0);
      s.at = [-1.2, 0, 1.2].map(function (x) { var m = K.sphere(0.11, K.holo(RED, { core: 1 })); m.userData.h = V(x, FY + 1.75, 0.3); m.position.copy(m.userData.h); m.visible = false; return m; }); s.msg = msg(K, 0.2);
    },
    update: function (K, dt, t) {
      var s = K.st; s.t += dt; if (s.t > 1) K.hit(0); s.eat = Math.min(1, s.eat + dt * 0.25); if (s.eat >= 1) K.hit(1);
      s.demon.rotation.y = t; s.demon.rotation.x = t * 0.7; s.w.forEach(function (l, i) { var k = clamp(s.eat * 6 - i, 0, 1); l.position.lerpVectors(l.userData.h, s.demon.position, k); l.material.opacity = 1 - k; });
      if (K.pressed) { s.sus += dt; if (s.sus > 2) { K.hit(2); if (!s.I.visible) { s.I.visible = true; s.at.forEach(function (m) { m.visible = true; }); K.hit(3); K.text(s.Il, '我'); } } }
      s.sh.material.opacity = K.pressed ? 0.5 : 0.08; s.I.scale.setScalar(1 + s.n * 0.5 + 0.06 * Math.sin(t * 4));
      K.text(s.msg, s.n >= 3 ? '他尽管骗我好了：只要我在想我是个什么，他就绝不能使我什么都不是' : s.I.visible ? '把恶魔的欺骗拖向“我”：被骗的总得有一个“我”在' : '我至少可以做到一件事：不同意任何可疑的东西');
      K.info(!s.I.visible ? '按住画面（或空格）：悬置判断 ' + Math.min(100, Math.round(s.sus / 2 * 100)) + '%' : s.n < 3 ? '把红色的攻击拖向中心的“我”（' + s.n + ' / 3）' : '轻点“我”：我是什么？');
    },
    pick: function (K, x, y) { var s = K.st; if (!s.I.visible) return null; var m = K.near(s.at, x, y, 55); if (m) return { drag: true, m: m }; return K.px(s.I.position, x, y) < 60 ? { I: true } : null; },
    dragStart: function (K, h, x, y) { h.d = K.facing(h.m.position, x, y); }, dragMove: function (K, h, x, y) { var p = h.d && h.d.to(x, y); if (p) h.m.position.copy(p); },
    dragEnd: function (K, h) { var s = K.st, m = h.m; var a = HL.screenOf(K.root.localToWorld(m.position.clone())), b = HL.screenOf(K.root.localToWorld(s.I.position.clone())); if (Math.hypot(a.x - b.x, a.y - b.y) < 90) { m.visible = false; s.n++; K.hit(4); K.toast('每一次欺骗，都证明有一个被骗的“我”'); if (s.n >= 3) { K.hit(5); K.text(s.Il, '我在，我存在'); } } else m.position.copy(m.userData.h); },
    tap: function (K, h) { var s = K.st; if (h && h.I && s.n >= 3) { K.text(s.Il, '一个在怀疑、理解、肯定、否定、意愿、想象、感觉的东西'); K.hit(6); } }
  };
  HL.sims.define('descartes', { lift: -0.35, zoom: 1.1, title: '笛卡尔 · 方法性怀疑', source: '——', flat: true, core: '把一切可以怀疑的都怀疑掉之后，还剩下什么是绝对不可能错的？', stages: [D1, D2, D3, D4] });
})();
