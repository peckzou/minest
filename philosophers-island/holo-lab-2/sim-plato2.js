/* Minest · 全息模型 · 柏拉图 · 理念论 / 灵魂三分说 — minest_plato_forms and minest_plato_soul rebuilt as holograms.
   Same stages, steps and quotations (Phaedo, Republic IV & X, Phaedrus). */
(function () {
  'use strict';
  var HL = window.HL, T = window.THREE; if (!HL || !T || !HL.sims || !HL.simQ) return;
  var FY = -0.62, AM = 0xffa23a, CY = 0x46d2ff, PU = 0xb58cff, RED = 0xff7a7a, GR = 0x7dffb0, GOLD = 0xffd96b, WH = 0xffffff;
  function V(x, y, z) { return new T.Vector3(x, y, z); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function scr(K, v) { return HL.screenOf(K.root.localToWorld(v.clone())); }
  function bed(K, mat, parent) {
    var g = new T.Group(), P = []; (parent || K.root).add(g);
    var add = function (w, h, d, x, y, z) { var m = K.mesh(new T.BoxGeometry(w, h, d), mat, g); m.position.set(x, y, z); P.push(m); };
    [[-0.4, -0.22], [0.4, -0.22], [-0.4, 0.22], [0.4, 0.22]].forEach(function (p) { add(0.06, 0.26, 0.06, p[0], 0.13, p[1]); });
    add(0.9, 0.06, 0.5, 0, 0.28, 0); add(0.06, 0.36, 0.5, -0.43, 0.46, 0);
    g.userData.parts = P; return g;
  }

  /* ═════════════ 理念论 ═════════════ */
  var QF = HL.simQ.plato_forms;
  var F1 = {
    name: '相等的木棍', hint: '把右边的木棍拖到左边那根旁边比一比；拖动空白处换个角度看；再按住画面（或空格）放大、打磨。', quotes: QF[0],
    init: function (K) {
      var s = K.st; K.grid(0, FY, 4.2, 2.2, 0x46d2ff); s.seen = {}; s.al = false; s.pol = 0; s.both = 0;
      var mk = function (c) { var m = K.mesh(new T.CylinderGeometry(0.035, 0.035, 1.3, 12), K.holo(c, { core: 0.6 })); m.rotation.z = Math.PI / 2; return m; };
      s.A = mk(0xffc46a); s.A.position.set(-0.75, FY + 0.06, 0); s.B = mk(0xffb27c); s.B.position.set(1.0, FY + 0.06, 0.75); s.B.rotation.y = 0.5;
      s.eq = K.label('＝', { h: 0.5, color: '#ffd96b' }); s.eq.position.set(0, FY + 1.7, 0); K.label('相等本身', { h: 0.12, color: '#ffd96b' }).position.set(0, FY + 2.05, 0);
      s.look = K.label('', { h: 0.15, color: '#ffffff' }); s.look.position.set(0, FY + 0.75, 0); s.gap = K.label('', { h: 0.14, color: '#ff7a7a' }); s.gap.position.set(0, FY + 0.45, 0.3);
    },
    update: function (K, dt, t) {
      var s = K.st;
      if (s.al) {
        var la = Math.hypot(scr(K, V(-1.4, FY + 0.06, 0)).x - scr(K, V(-0.1, FY + 0.06, 0)).x, scr(K, V(-1.4, FY + 0.06, 0)).y - scr(K, V(-0.1, FY + 0.06, 0)).y), lb = Math.hypot(scr(K, V(0.1, FY + 0.06, 0)).x - scr(K, V(1.4, FY + 0.06, 0)).x, scr(K, V(0.1, FY + 0.06, 0)).y - scr(K, V(1.4, FY + 0.06, 0)).y);
        var eq = Math.abs(la - lb) / la < 0.025; s.seen[eq ? 'e' : 'n'] = 1; K.text(s.look, eq ? '从这里看：两根木棍相等' : '从这里看：' + (la > lb ? '左边' : '右边') + '那根显得更长');
        if (s.seen.e && s.seen.n) { K.hit(1); s.both += dt; if (s.both > 1.5) K.hit(2); }
        if (K.pressed) { s.pol += dt; K.text(s.gap, '打磨、再放大……仍差 ' + (0.8 * Math.pow(0.55, s.pol)).toFixed(4) + ' 毫米'); if (s.pol > 3) K.hit(3); if (!s.zoom) { s.zoom = true; K.focus(V(0, FY + 0.06, 0), 2.6); } } else if (s.zoom) { s.zoom = false; K.home(); }
      }
      s.eq.material.opacity = 0.8 + 0.2 * Math.sin(t * 2);
      K.info(!s.al ? '把右边的木棍拖到左边那根的旁边，并排对齐' : '拖动空白处转动视角：同样两根木棍，时而相等、时而不等 · 按住画面（或空格）放大检查');
    },
    pick: function (K, x, y) { var s = K.st; return !s.al && K.px(s.B.position, x, y) < 70 ? { drag: true } : null; },
    dragMove: function (K, h, x, y) { var p = K.onPlane(x, y, FY + 0.06); if (p) K.st.B.position.set(clamp(p.x, -2, 2), FY + 0.06, clamp(p.z, -1, 1)); },
    dragEnd: function (K) { var s = K.st, p = s.B.position; if (Math.hypot(p.x - 0.75, p.z) < 0.6) { p.set(0.75, FY + 0.06, 0); s.B.rotation.y = 0; s.al = true; K.hit(0); } }
  };
  var F2 = {
    name: '回忆', hint: '把下面的木棍、石块、绳子一件件拖上去，和上方那条“相等本身”的线对齐，看看差多少。', quotes: QF[1],
    init: function (K) {
      var s = K.st; s.n = 0; s.t2 = 0; K.line([V(-0.8, FY + 1.7, 0), V(0.8, FY + 1.7, 0)], K.lineMat(GOLD, 1)); K.line([V(-0.8, FY + 1.62, 0), V(-0.8, FY + 1.78, 0)], K.lineMat(GOLD, 1)); K.line([V(0.8, FY + 1.62, 0), V(0.8, FY + 1.78, 0)], K.lineMat(GOLD, 1));
      K.label('“相等”的标准 —— 你从未用眼睛见过它', { h: 0.12, color: '#ffd96b' }).position.set(0, FY + 1.95, 0);
      s.it = [['木棍', new T.CylinderGeometry(0.03, 0.035, 1.52, 10), 0xffc46a, -1.4, '长了一点'], ['石块', new T.BoxGeometry(1.42, 0.12, 0.12), 0x9aa7b5, 0, '短了一点'], ['绳子', new T.TorusGeometry(0.5, 0.02, 6, 30, Math.PI), 0xffb27c, 1.4, '弯的，拉不直']].map(function (d) {
        var m = K.mesh(d[1], K.holo(d[2], { core: 0.6 })); if (d[0] === '木棍') m.rotation.z = Math.PI / 2; m.userData = { home: V(d[3], FY + 0.35, 0.6), n: d[0], why: d[4], lab: K.label(d[0], { h: 0.11, color: '#ffffff' }) }; m.position.copy(m.userData.home); return m; });
      s.msg = K.label('', { h: 0.14, color: '#ffffff' }); s.msg.position.set(0, FY + 1.35, 0);
    },
    update: function (K, dt) { var s = K.st; s.it.forEach(function (m) { m.userData.lab.position.set(m.position.x, m.position.y - 0.2, m.position.z + 0.1); }); if (s.n >= 3) { K.hit(1); s.t2 += dt; if (s.t2 > 1.5) K.hit(2); if (s.t2 > 3.5) K.hit(3); K.text(s.msg, s.t2 > 1.5 ? '每一件都“想要”相等却够不着 —— 这个标准，你在看见它们之前就已经有了' : ''); }
      K.info(s.n < 3 ? '把一件东西拖到上方金色的线上比一比（' + s.n + ' / 3）' : '感官只给了你“差一点”的东西；“相等本身”是被它们唤起的 —— 回忆'); },
    pick: function (K, x, y) { var m = K.near(K.st.it, x, y, 80); return m ? { drag: true, m: m } : null; },
    dragStart: function (K, h, x, y) { h.d = K.facing(h.m.position, x, y); },
    dragMove: function (K, h, x, y) { var p = h.d && h.d.to(x, y); if (p) h.m.position.copy(p); },
    dragEnd: function (K, h) { var s = K.st, m = h.m; if (m.position.y > FY + 1.3) { m.position.set(0, FY + 1.58 - s.n * 0.0, 0.05 + s.n * 0.12); if (!m.userData.done) { m.userData.done = true; s.n++; } K.text(m.userData.lab, m.userData.n + '：' + m.userData.why); K.hit(0); K.toast(m.userData.n + m.userData.why + ' —— 你怎么知道它“差一点”？'); } else m.position.copy(m.userData.home); }
  };
  var F3 = {
    name: '三张床', hint: '按住画面（或空格）让木匠照着理念造床；点「画家作画」，再转动视角看那幅画；最后拖动上方的“理念之床”想复制一张。', quotes: QF[2],
    init: function (K) {
      var s = K.st; K.grid(0, FY, 4.2, 2.2, 0x46d2ff); s.b = 0; s.painted = false; s.az = 0; s.clone = null; s.ct = 0;
      s.ideal = bed(K, K.glow(GOLD, 0.9, { wire: true })); s.home = V(0, FY + 1.55, -0.3); s.ideal.position.copy(s.home); K.label('床的理念（唯一）', { h: 0.12, color: '#ffd96b', parent: s.ideal }).position.y = 0.85;
      s.made = bed(K, K.holo(0xffb27c, { core: 0.6 })); s.made.position.set(-1.2, FY, 0.2); K.label('木匠的床', { h: 0.12, color: '#ffb27c' }).position.set(-1.2, FY + 0.95, 0.2);
      var tex = K.shape(function (c, q) { c.beginPath(); c.rect(-q * 0.9, -q * 0.1, q * 1.8, q * 0.14); c.rect(-q * 0.9, -q * 0.5, q * 0.12, q * 0.5); c.rect(-q * 0.82, 0, q * 0.1, q * 0.5); c.rect(q * 0.72, 0, q * 0.1, q * 0.5); });
      s.pic = K.flat(0.9, 0.9, K.solid(0xffd9a0, 0, tex)); s.pic.position.set(1.3, FY + 0.6, 0.2); K.line([V(-0.5, -0.5, 0), V(0.5, -0.5, 0), V(0.5, 0.5, 0), V(-0.5, 0.5, 0), V(-0.5, -0.5, 0)], K.lineMat(WH, 0.7), s.pic); K.label('画家的床', { h: 0.12, color: '#ffffff' }).position.set(1.3, FY + 1.3, 0.2);
      s.msg = K.label('', { h: 0.14, color: '#ffffff' }); s.msg.position.set(0, FY + 2.55, 0);
    },
    update: function (K, dt, t) {
      var s = K.st; if (K.pressed) { s.b = Math.min(1, s.b + dt * 0.35); if (s.b >= 1) K.hit(0); }
      s.made.userData.parts.forEach(function (m, i) { m.visible = s.b * 6 > i; }); s.ideal.rotation.y = t * 0.3;
      if (s.painted) { if (Math.abs(HL.cam.az - s.az) > 0.3) K.hit(2); K.text(s.msg, Math.abs(HL.cam.az - s.az) > 0.3 ? '换个角度：画只是薄薄一片 —— 它模仿的是床“看起来的样子”' : ''); }
      if (HL.sims.isLit(0) && HL.sims.isLit(1)) K.hit(3);
      if (s.clone) { s.ct += dt; s.clone.position.lerp(V(0.9, FY + 1.55, -0.3), dt * 3); K.text(s.msg, '若有两张理念之床，它们之上又会出现一张二者共有的 —— 那才是真正的床'); if (s.ct > 2.5) { K.root.remove(s.clone); s.clone = null; K.hit(4); } }
      K.info('神造的理念之床 → 木匠照着它造的床 → 画家照着木匠的床画的床：离真实隔了三层' + (s.b < 1 ? ' · 按住画面让木匠造床 ' + Math.round(s.b * 100) + '%' : ''));
    },
    pick: function (K, x, y) { return K.px(V(0, FY + 1.85, -0.3), x, y) < 80 ? { drag: true } : null; },
    dragStart: function (K, h, x, y) { h.d = K.facing(K.st.ideal.position, x, y); },
    dragMove: function (K, h, x, y) { var p = h.d && h.d.to(x, y); if (p) K.st.ideal.position.copy(p); },
    dragEnd: function (K) { var s = K.st; s.ideal.position.copy(s.home); if (!s.clone) { s.clone = bed(K, K.glow(GOLD, 0.5, { wire: true })); s.clone.position.copy(s.home); s.ct = 0; } },
    chips: function (K, box) { var s = K.st; HL.ui.chip(box, '🖌 画家作画', false, function () { s.painted = true; s.az = HL.cam.az; s.pic.material.opacity = 0.95; s.pic.rotation.y = s.az; K.hit(1); K.toast('画家只画下从这个角度看到的那一面'); }, '照着木匠的床，从现在的视角画下来'); }
  };
  HL.sims.define('plato_forms', { lift: -0.35, zoom: 1.1, title: '柏拉图 · 理念论', source: '——', flat: true, core: '世上没有两样东西是完全相等的，可我们分明知道什么是“相等”。这个标准是从哪里来的？', stages: [F1, F2, F3] });

  /* ═════════════ 灵魂三分说 ═════════════ */
  var QS = HL.simQ.plato_soul;
  function bar(K, x, z, color, name) { var g = {}; K.line([V(x - 0.1, FY, z), V(x - 0.1, FY + 1.2, z), V(x + 0.1, FY + 1.2, z), V(x + 0.1, FY, z)], K.lineMat(color, 0.5)); g.m = K.mesh(new T.BoxGeometry(0.16, 1, 0.16), K.holo(color, { core: 0.5 })); K.label(name, { h: 0.12, color: '#ffffff' }).position.set(x, FY + 1.35, z); g.set = function (v) { g.m.scale.y = Math.max(0.001, v * 1.2); g.m.position.set(x, FY + v * 0.6, z); }; g.set(0); return g; }
  var S1 = {
    name: '口渴的灵魂', hint: '按住画面（或空格）让“想喝”升起来；再把右边的“理性”向右拖，把他往回拉。也试试只让欲望涨满。', quotes: QS[0],
    init: function (K) {
      var s = K.st; K.grid(0, FY, 4.2, 1.6, 0x46d2ff); s.d = 0; s.r = 0; s.bt = 0; s.drag = false;
      s.cup = K.mesh(new T.CylinderGeometry(0.14, 0.09, 0.26, 16, 1, true), K.holo(CY, { core: 0.6, side: T.DoubleSide })); s.cup.position.set(-1.7, FY + 0.13, 0); K.label('一杯水', { h: 0.11, color: '#6fe3ff' }).position.set(-1.7, FY + 0.45, 0);
      s.who = K.person(0xffb27c, 1.5); s.rope1 = K.line([V(0, 0, 0), V(0, 0, 0)], K.lineMat(AM, 0.9)); s.rope2 = K.line([V(0, 0, 0), V(0, 0, 0)], K.lineMat(CY, 0.9));
      s.h = K.sphere(0.13, K.holo(CY, { core: 0.8 })); K.label('理性：“别喝”（拖我）', { h: 0.11, color: '#6fe3ff', parent: s.h }).position.y = 0.25;
      s.bd = bar(K, -1.9, -0.6, AM, '欲望'); s.br = bar(K, 1.9, -0.6, CY, '理性'); s.msg = K.label('', { h: 0.14, color: '#ffffff' }); s.msg.position.set(0, FY + 1.75, 0);
    },
    update: function (K, dt) {
      var s = K.st; if (K.pressed) s.d = Math.min(1, s.d + dt * 0.5); else s.d = Math.max(0, s.d - dt * 0.07); if (!s.drag) s.r = Math.max(0, s.r - dt * 0.12);
      var x = clamp((s.r - s.d) * 1.25, -1.35, 1.2); s.who.position.set(lerp(s.who.position.x, x, dt * 4), FY, 0); s.h.position.set(1.0 + s.r * 0.9, FY + 0.5, 0);
      K.setLine(s.rope1, [V(s.who.position.x, FY + 0.4, 0), V(-1.7, FY + 0.3, 0)]); s.rope1.material.opacity = s.d; K.setLine(s.rope2, [V(s.who.position.x, FY + 0.4, 0), s.h.position.clone()]); s.rope2.material.opacity = 0.2 + s.r * 0.8;
      s.bd.set(s.d); s.br.set(s.r);
      if (s.d > 0.3 && s.r > 0.3) K.hit(0); if (s.d > 0.5 && s.r > 0.5) { s.bt += dt; if (s.bt > 1.5) K.hit(1); } if (s.d >= 1 && s.r < 0.2 && s.who.position.x < -1.2) K.hit(2);
      K.text(s.msg, s.d > 0.5 && s.r > 0.5 ? '同一个东西不能同时对同一件事既拉又推 —— 所以灵魂里有两个部分' : s.d >= 1 && s.r < 0.2 ? '只有欲望：他径直走向那杯水' : '');
      K.info('欲望 ' + Math.round(s.d * 100) + '% · 理性 ' + Math.round(s.r * 100) + '% —— 按住画面（或空格）= 想喝 · 向右拖“理性” = 别喝');
    },
    pick: function (K, x, y) { return K.px(K.st.h.position, x, y) < 70 ? { drag: true } : null; },
    dragStart: function (K, h, x) { h.x = x; K.st.drag = true; }, dragMove: function (K, h, x) { var s = K.st; s.r = clamp(s.r + (x - h.x) / 220, 0, 1); h.x = x; }, dragEnd: function (K) { K.st.drag = false; }
  };
  var S2 = {
    name: '勒翁提俄斯', hint: '欲望把他拉向刑场的尸体。按住画面（或空格）捂眼抵抗；等他终于冲过去，愤怒会出现 —— 把“激情”拖到他身上。', quotes: QS[1],
    init: function (K) {
      var s = K.st; K.grid(0, FY, 4.2, 1.6, 0x46d2ff); s.x = -1.5; s.t = 0; s.res = 0; s.rush = false; s.at = 0; s.join = false;
      for (var i = 0; i < 3; i++) { var c = K.mesh(new T.BoxGeometry(0.5, 0.08, 0.16), K.glow(0x9aa7b5, 0.5)); c.position.set(1.6, FY + 0.05 + i * 0.09, -0.2 + i * 0.15); c.rotation.y = i * 0.5; }
      K.label('刑场', { h: 0.12, color: '#9aa7b5' }).position.set(1.6, FY + 0.6, 0);
      s.who = K.person(0xffb27c, 1.5); s.eye = K.label('', { h: 0.12, color: '#ffffff', parent: s.who }); s.eye.position.y = 0.85;
      s.ang = K.sphere(0.16, K.holo(RED, { core: 0.9 })); s.ang.position.set(-0.2, FY + 1.5, 0.2); s.ang.visible = false; K.label('激情（愤怒）· 拖我', { h: 0.11, color: '#ff7a7a', parent: s.ang }).position.y = 0.28;
      s.msg = K.label('', { h: 0.14, color: '#ffffff' }); s.msg.position.set(0, FY + 2.0, 0);
    },
    update: function (K, dt) {
      var s = K.st; s.t += dt; if (s.t > 1) K.hit(0);
      if (!s.rush) { var r = K.pressed ? Math.max(0, 1 - s.res / 6) : 0; if (K.pressed) { s.res += dt; if (s.res > 2) K.hit(1); } s.x += dt * 0.3 * (1 - 0.92 * r); K.text(s.eye, K.pressed ? '（捂住眼睛）' : '想看……'); if (s.x > 1.05) { s.rush = true; K.hit(2); K.toast('他睁大眼睛冲过去：“看吧，你们这些坏东西，看个够！”'); } }
      else if (!s.join) { s.at += dt; s.ang.visible = true; K.text(s.eye, '“看个够吧！”'); if (s.at > 1) K.hit(3); }
      else { s.x = lerp(s.x, -0.6, dt * 1.5); K.text(s.eye, ''); }
      s.who.position.set(s.x, FY, 0);
      K.text(s.msg, s.join ? '激情并不站在欲望一边：在灵魂的内战里，它拿起武器帮助理性' : s.rush ? '他对自己发怒 —— 愤怒在和欲望交战，可见它是另一个部分' : '');
      K.info(s.rush ? (s.join ? '激情是第三部分，是理性天然的同盟' : '把红色的“激情”拖到他身上') : '按住画面（或空格）：捂住眼睛抵抗 —— 欲望会越来越难挡');
    },
    pick: function (K, x, y) { var s = K.st; return s.ang.visible && !s.join && K.px(s.ang.position, x, y) < 70 ? { drag: true } : null; },
    dragStart: function (K, h, x, y) { h.d = K.facing(K.st.ang.position, x, y); }, dragMove: function (K, h, x, y) { var p = h.d && h.d.to(x, y); if (p) K.st.ang.position.copy(p); },
    dragEnd: function (K) { var s = K.st; if (s.ang.position.distanceTo(V(s.x, FY + 0.4, 0)) < 0.7) { s.join = true; s.ang.visible = false; s.who.userData.mat.uniforms.uColor.value.setHex(RED); K.hit(4); } }
  };
  var S3 = {
    name: '灵魂马车', hint: '拖动缰绳（白球）左右驾驭两匹马；按住画面（或空格）收紧缰绳，驯服黑马、向上飞升；松手看看会怎样。', quotes: QS[2],
    init: function (K) {
      var s = K.st; s.t = 0; s.tame = 0; s.alt = 0.15; s.peak = 0; s.steer = 0; s.sd = 0; s.lurch = false;
      K.grid(0, FY, 4.4, 1.4, 0x8a6a40); K.label('大地', { h: 0.11, color: '#ffb454' }).position.set(-1.9, FY + 0.1, 0.8);
      s.stars = K.dots(40, 0.07); for (var i = 0; i < 40; i++) { s.stars.set(i, -2 + ((i * 137) % 100) / 25, FY + 1.9 + ((i * 71) % 50) / 100, -0.6 + ((i * 29) % 60) / 100); s.stars.rgb(i, 1, 1, 0.8); } s.stars.flush(); K.label('天穹 · 真理的原野', { h: 0.12, color: '#ffd96b' }).position.set(0, FY + 2.55, 0);
      s.car = new T.Group(); K.add(s.car); K.mesh(new T.BoxGeometry(0.5, 0.16, 0.36), K.holo(GOLD, { core: 0.5 }), s.car); var d = K.person(CY, 1, s.car); d.position.y = 0.08;
      s.w = K.mesh(new T.BoxGeometry(0.5, 0.2, 0.14), K.holo(WH, { core: 0.8 }), s.car); s.w.position.set(0.75, 0.05, -0.2); s.bk = K.mesh(new T.BoxGeometry(0.5, 0.2, 0.14), K.holo(0x6b5bd0, { core: 0.3, rim: 1.8 }), s.car); s.bk.position.set(0.75, 0.05, 0.2);
      K.label('良马', { h: 0.1, color: '#ffffff', parent: s.w }).position.y = 0.22; K.label('劣马', { h: 0.1, color: '#b58cff', parent: s.bk }).position.y = 0.22;
      s.rein = K.sphere(0.1, K.glow(WH, 0.95)); K.label('缰绳', { h: 0.1, color: '#ffffff', parent: s.rein }).position.y = 0.2; s.msg = K.label('', { h: 0.14, color: '#ffffff' }); s.msg.position.set(0, FY + 0.15, 1.0);
    },
    update: function (K, dt, t) {
      var s = K.st; s.t += dt; K.hit(0); if (s.t > 2.5) K.hit(1);
      if (K.pressed) { s.tame = Math.min(1, s.tame + dt * 0.13); s.alt = Math.min(1, s.alt + dt * 0.16 * (0.3 + s.tame)); } else { s.tame = Math.max(0, s.tame - dt * 0.14); if (s.tame < 0.6) s.alt = Math.max(0, s.alt - dt * 0.28); }
      if (s.t > 4 && s.tame < 0.3 && !s.lurch) { s.lurch = true; K.hit(3); K.toast('劣马咬住嚼子猛地往下拽！'); } if (s.tame >= 1) K.hit(4);
      s.peak = Math.max(s.peak, s.alt); if (s.alt <= 0 && s.peak > 0.35) { K.hit(5); s.peak = 0; K.toast('失控坠落：羽翼脱落，灵魂落到地上'); }
      var wob = (1 - s.tame) * Math.sin(t * 5) * 0.25; s.car.position.set(-0.4 + s.steer * 0.9, FY + 0.25 + s.alt * 1.5, 0); s.car.rotation.z = -(1 - s.tame) * 0.35 + wob * 0.3; s.car.rotation.y = -s.steer * 0.4; s.bk.position.y = 0.05 - (1 - s.tame) * 0.18 + wob * 0.3; s.w.position.y = 0.05 + Math.abs(s.steer) * 0.04;
      s.rein.position.set(-0.4 + s.steer * 1.4, FY + 0.25 + s.alt * 1.5 + 0.75, 0.5);
      K.text(s.msg, s.tame >= 1 ? '劣马被驯服了：御者带着两匹马升向天穹' : '');
      K.info('高度 ' + Math.round(s.alt * 100) + '% · 劣马驯服 ' + Math.round(s.tame * 100) + '% —— 按住画面（或空格）收紧缰绳 · 左右拖动白球驾驭');
    },
    pick: function (K, x, y) { return K.px(K.st.rein.position, x, y) < 70 ? { drag: true } : null; },
    dragStart: function (K, h, x) { h.x = x; }, dragMove: function (K, h, x) { var s = K.st, d = (x - h.x) / 260; h.x = x; s.steer = clamp(s.steer + d, -1, 1); s.sd += Math.abs(d); if (s.sd > 0.5) K.hit(2); }
  };
  var S4 = {
    name: '应用练习', hint: '宴会上：上下拖动三股力量，让理性在上、激情居中、欲望在下，并保持住；再点「有人挑衅」，试着用理性把激情叫回来。', quotes: QS[3],
    init: function (K) {
      var s = K.st; s.ht = 0; s.prov = false; s.v = [0.3, 0.8, 0.9];
      s.b = [['理性', CY, -1.1], ['激情', RED, 0], ['欲望', AM, 1.1]].map(function (d, i) { K.line([V(d[2], FY + 0.1, 0), V(d[2], FY + 1.9, 0)], K.lineMat(d[1], 0.4)); var m = K.sphere(0.15, K.holo(d[1], { core: 0.8 })); m.userData = { x: d[2], i: i }; K.label(d[0], { h: 0.13, color: '#ffffff', parent: m }).position.y = 0.3; return m; });
      s.ch = K.line([V(0, 0, 0), V(0, 0, 0), V(0, 0, 0)], K.lineMat(GOLD, 0)); s.msg = K.label('', { h: 0.15, color: '#ffd96b' }); s.msg.position.set(0, FY + 2.3, 0);
    },
    update: function (K, dt, t) {
      var s = K.st, v = s.v; if (s.prov) v[1] = clamp(v[1] + Math.sin(t * 18) * 0.004, 0.85, 1); else if (s.calm) { v[1] = lerp(v[1], 0.5, dt * 2); if (Math.abs(v[1] - 0.5) < 0.02) s.calm = false; }
      s.b.forEach(function (m, i) { m.position.set(m.userData.x + (i === 1 && s.prov ? Math.sin(t * 30) * 0.03 : 0), FY + 0.1 + v[i] * 1.8, 0); });
      var ok = v[0] > 0.65 && v[1] > 0.35 && v[1] < 0.65 && v[2] < 0.35; if (ok) { K.hit(0); s.ht += dt; if (s.ht > 2) K.hit(1); } else s.ht = 0;
      K.setLine(s.ch, s.b.map(function (m) { return m.position.clone(); })); s.ch.material.opacity = ok ? 1 : 0.15;
      K.text(s.msg, s.prov ? '激情被激怒了：它不肯平息 —— 把理性拉到最高，把它叫回来' : ok ? '和谐：像高、中、低三个音，各安其位 —— 这就是灵魂里的正义' : '');
      K.info('上下拖动三个球：理性在上（>65%）、激情居中、欲望在下（<35%）');
    },
    pick: function (K, x, y) { var m = K.near(K.st.b, x, y, 70); return m ? { drag: true, m: m } : null; },
    dragStart: function (K, h, x, y) { h.y = y; },
    dragMove: function (K, h, x, y) { var s = K.st, i = h.m.userData.i; if (i === 1 && s.prov) { h.y = y; return; } s.v[i] = clamp(s.v[i] - (y - h.y) / 260, 0, 1); h.y = y; if (i === 0 && s.prov && s.v[0] >= 0.8) { s.prov = false; s.calm = true; K.hit(2); K.toast('理性一声召回，激情像牧羊犬一样安静下来'); } },
    chips: function (K, box) { var s = K.st; HL.ui.chip(box, '⚡ 有人挑衅', false, function () { s.prov = true; s.v[1] = 0.95; if (s.v[0] >= 0.8) s.v[0] = 0.6; }, '激情被激怒'); }
  };
  HL.sims.define('plato_soul', { lift: -0.35, zoom: 1.1, title: '柏拉图 · 灵魂三分说', source: '——', flat: true, core: '“我想喝”和“我不该喝”可以同时出现在一个人心里。同一个灵魂怎么会跟自己打架？', stages: [S1, S2, S3, S4] });
})();
