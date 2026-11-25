/* Minest · 全息模型 · 第七街区 C — 波普尔证伪主义 / 拉卡托斯研究纲领 / 库恩范式转换 / 费耶阿本德方法多元, rebuilt as
   holograms (same stages, steps and quotations as the 2D models). Uses HL.simKit. */
(function () {
  'use strict';
  var HL = window.HL, T = window.THREE, k = HL && HL.simKit; if (!HL || !T || !k || !HL.simQ) return;
  var V = k.V, P = k.P, C = k.C, FY = k.FY, clamp = k.clamp, lerp = k.lerp, TAU = k.TAU, Q = HL.simQ;
  function def(key, title, core, stages, extra) { stages.forEach(function (s, i) { s.quotes = Q[key][i]; }); HL.sims.define(key, Object.assign({ lift: -0.35, zoom: 1.1, title: title, source: '——', flat: true, core: core, stages: stages }, extra || {})); }

  /* ═════════════ 波普尔 · 证伪主义 ═════════════ */
  var P1 = k.drags({ name: '天鹅', hint: '按住画面（或空格）一只只观察白天鹅，看“已证明”的读数；再把那只黑天鹅拖进湖里。',
    init: function (K) { var s = K.st; s.n = 0; s.lake = k.zone(K, -0.3, 1.2, 2.6, 1.2, C.CY, '湖'); s.d = K.dots(60, 0.13); s.law = k.lab(K, '定律：所有天鹅都是白的', -0.3, 2.2, 0, '#ffffff', 0.16); s.cnt = k.lab(K, '', -0.3, 2.5, 0, '#ffd96b'); s.items = [k.ball(K, '黑天鹅', 0x333333, 0.13, -1.8, 0.3, 0.6)]; s.msg = k.msg(K, 2.85); },
    update: function (K, dt) { var s = K.st, i; if (K.pressed && !s.dead) { s.n = Math.min(1000, s.n + dt * 260); K.hit(0); } for (i = 0; i < 60; i++) { s.d.set(i, -1.5 + (i % 12) * 0.2, i < s.n / 1000 * 60 ? FY + 0.75 + Math.floor(i / 12) * 0.2 : -9, -0.1); s.d.rgb(i, 1, 1, 1); } s.d.flush(); if (s.n >= 1000) K.hit(1);
      K.text(s.cnt, '已观察 ' + Math.round(s.n) + ' 只白天鹅 · 已证明：0%'); K.info('再多的证实，也不等于证明'); },
    drop: function (K, m) { var s = K.st; if (K.closePx(m.position, s.lake, 170)) { s.dead = true; m.userData.done = true; m.position.set(0.6, FY + 1.3, 0); K.text(s.law, '定律：所有天鹅都是白的 ✗'); s.law.material.color.setHex(C.RED); K.hit(2); K.hit(3); K.text(s.msg, '一只就够了。所以科学家该做的，是主动去找那只黑天鹅'); return true; } } });
  var P2 = k.sliders({ name: '大胆的假说', hint: '拖动滑杆决定假说“禁止”多少种情况：禁止得越多，说得越多。再按住画面（或空格）做实验。先试试大胆的，再试试什么都不禁止的。',
    init: function (K) { var s = K.st; s.f = K.slider('假说禁止的范围', -0.9, FY + 0.3, 0.3, C.RED, 0.8); s.bar = k.box(K, 3.0, 0.3, 0.1, C.GR, -0.2, 1.4, 0); s.ban = k.box(K, 1, 0.32, 0.12, C.RED, 0, 1.4, 0.02); s.dot = K.sphere(0.07, K.glow(C.WH, 1)); s.dot.visible = false; s.t = -1; s.msg = k.msg(K, 2.4); k.lab(K, '← 一切可能的观察结果 →', -0.2, 1.85, 0); },
    update: function (K, dt) { var s = K.st, f = s.f.v; s.ban.scale.x = Math.max(0.01, f * 3.0); s.ban.position.x = -0.2 + 1.5 - f * 1.5; if (f > 0.6) K.hit(0); if (K.pressed && s.t < 0) { s.t = 0; s.x = -1.6; } if (s.t >= 0) { s.t += dt; s.dot.visible = true; s.dot.position.copy(P(-1.5, 1.4 + Math.max(0, 1 - s.t) * 0.8, 0.12)); if (s.t > 1) { s.t = -1; if (f > 0.6) { K.hit(1); K.hit(2); K.text(s.msg, '结果落在允许的窄缝里：一个本来很可能失败的预言，经受住了检验'); } else if (f < 0.08) { K.hit(3); K.text(s.msg, '什么都不禁止：永远不会错，也什么都没说'); } else K.text(s.msg, '通过了 —— 但它本来就不太可能失败'); } }
      K.info('红色 = 假说禁止出现的结果（占 ' + Math.round(f * 100) + '%）'); } });
  var P3 = k.drags({ name: '解释一切的理论', hint: '把左右两边相反的观察，一个个拖向中间那团“理论”，看它怎样变形把它们都吞下去。',
    init: function (K) { var s = K.st; s.n = 0; s.th = K.sphere(0.4, K.holo(C.PU, { core: 0.6 })); s.th.position.copy(P(-0.2, 1.4, 0)); k.lab(K, '理论：“一切行为都出于自卑感”', -0.2, 2.15, 0); s.items = [['他救了落水的孩子', 0], ['他把孩子推下了水', 1], ['他什么也没做', 0], ['他先推再救', 1]].map(function (d, i) { var m = k.card(K, d[0], 0xffc46a, 1.0, i % 2 ? 1.0 : -1.6, 0.3 + Math.floor(i / 2) * 0.35, 0.6); m.userData.k = d[1]; return m; }); s.sd = {}; s.cnt = k.lab(K, '', -0.2, 2.5, 0, '#ffd96b'); s.msg = k.msg(K, 2.85); },
    update: function (K, dt, t) { var s = K.st; s.th.scale.set(1 + s.n * 0.18 + 0.05 * Math.sin(t * 3), 1 + 0.08 * Math.sin(t * 4 + 1), 1); K.text(s.cnt, '“已证实”：' + s.n + ' 次'); K.info('它的力量看起来在于什么都能解释 —— 这其实是它的弱点'); },
    drop: function (K, m) { var s = K.st; if (K.closePx(m.position, s.th.position, 140)) { m.userData.done = true; m.visible = false; s.n++; s.sd[m.userData.k] = 1; K.hit(0); if (s.n >= 2) K.hit(1); if (s.sd[0] && s.sd[1]) { K.hit(2); K.text(s.msg, '救人是“克服自卑”，推人是“发泄自卑”：相反的事都成了证据'); } return true; } } });
  var P4 = { name: '特设的拯救', hint: '点「发射检验」：一个反例击中了预言。再按住画面（或空格）给理论“打补丁”，看它的可检验性。',
    init: function (K) { var s = K.st; s.hitT = false; s.p = 0; s.th = k.box(K, 1.6, 0.5, 0.3, C.CY, -0.2, 1.4, 0); k.lab(K, '理论：“周五世界会终结”', -0.2, 1.4, 0.2); s.g = k.gauge(K, -1.9, 0, C.GR, '可检验性', 1.4); s.g.set(1); s.pt = k.lab(K, '', -0.2, 0.9, 0.2, '#ff7a7a'); s.msg = k.msg(K, 2.4); },
    update: function (K, dt) { var s = K.st; if (s.hitT && K.pressed) { s.p = Math.min(1, s.p + dt * 0.4); K.text(s.pt, ['+ “是我们的祈祷推迟了它”', '+ “日期算的是另一种历法”', '+ “终结是精神意义上的”'].slice(0, 1 + Math.floor(s.p * 2.9)).join('　')); s.g.set(1 - s.p * 0.95); s.th.material.uniforms.uColor.value.setHex(C.CY); if (s.p > 0.6) { K.hit(1); K.text(s.msg, '理论活下来了 —— 代价是它再也不会被任何事情驳倒，也就不再是科学'); } } K.info('用特设的假说救理论，是以毁掉它的科学地位为代价'); },
    chips: function (K, box) { var s = K.st; HL.ui.chip(box, '🎯 发射检验', false, function () { s.hitT = true; s.th.material.uniforms.uColor.value.setHex(C.RED); K.hit(0); K.text(s.msg, '周五过去了，世界还在：预言被驳倒了。按住画面打补丁试试'); }); } };
  var P5 = k.drags({ name: '应用练习', hint: '把三条主张一条条拖上检验台，再按住画面（或空格）寻找“什么样的观察能驳倒它”。',
    init: function (K) { var s = K.st; s.p = 0; s.n = 0; s.b = k.zone(K, -0.2, 1.5, 2.6, 0.5, C.GOLD, '检验台'); s.items = [['所有金属受热都膨胀', '找到了：一块受热收缩的金属 → 可证伪', 1], ['水瓶座的人今天会遇到一些事', '怎样都找不到 → 它不是科学主张', 2], ['这种药两周内让血压降 10 以上', '找到了：两周后血压没降 → 可证伪', 1]].map(function (d, i) { var m = k.card(K, d[0], 0xffc46a, 1.6, -0.2, 0.2 + i * 0.3, 0.7); m.userData.r = d[1]; m.userData.h = d[2]; return m; }); s.out = k.lab(K, '', -0.2, 2.1, 0, '#ffffff', 0.14); },
    update: function (K, dt) { var s = K.st; if (s.on && K.pressed) { s.p = Math.min(1, s.p + dt * 0.6); if (s.p >= 1) { K.text(s.out, s.on.userData.r); K.hit(s.on.userData.h); s.on.visible = false; s.on = null; s.p = 0; s.n++; if (s.n >= 3) K.hit(0); } } K.info(s.on ? '寻找反驳 ' + Math.round(s.p * 100) + '%' : '已检验 ' + s.n + ' / 3'); },
    drop: function (K, m) { var s = K.st; if (!s.on && K.closePx(m.position, s.b, 150)) { m.position.copy(s.b); m.position.z = 0.1; m.userData.done = true; s.on = m; return true; } } });
  def('popper', '波普尔 · 证伪主义', '科学和伪科学的界线在哪里？是“被证实得多”，还是别的什么？', [P1, P2, P3, P4, P5]);

  /* ═════════════ 拉卡托斯 · 研究纲领 ═════════════ */
  function programme(K) { var s = K.st; s.core = K.sphere(0.3, K.holo(C.GOLD, { core: 1 })); s.core.position.copy(P(-0.2, 1.4, 0)); k.lab(K, '硬核：牛顿三定律 + 万有引力', -0.2, 0.75, 0, '#ffd96b'); s.belt = K.mesh(new T.TorusGeometry(0.85, 0.05, 10, 60), K.holo(C.CY, { core: 0.5 })); s.belt.position.copy(s.core.position); k.lab(K, '保护带：辅助假说', -0.2, 2.45, 0, '#6fe3ff'); s.sh = K.sphere(0.08, K.holo(C.RED, { core: 1.2 })); s.sh.visible = false; s.ft = -1; }
  function fire(K, dt, onHit) { var s = K.st; if (s.ft < 0) return; s.ft += dt * 1.2; s.sh.visible = true; var u = Math.min(1, s.ft); s.sh.position.copy(P(lerp(-2.0, -1.05, u), 1.4, 0)); if (s.ft >= 1) { s.ft = -1; s.sh.visible = false; onHit(); } }
  var K1 = k.sliders({ name: '反例的冲击', hint: '点「发射反例」：看它打不到中间的硬核。把滑杆推高（让保护带更会调整），再发射一次。',
    init: function (K) { var s = K.st; programme(K); s.ad = K.slider('保护带的调整能力', -0.9, FY + 0.3, 0.3, C.CY, 0.8); s.msg = k.msg(K, 2.8); },
    update: function (K, dt, t) { var s = K.st; s.belt.rotation.z = t * 0.2; fire(K, dt, function () { K.hit(0); if (s.ad.v >= 0.8) { K.hit(1); K.text(s.msg, '保护带修改了一条辅助假说（行星的分布），把冲击吸收掉了'); } else K.text(s.msg, '反面启发法：不许把箭头指向硬核。冲击落在保护带上'); }); K.info('研究纲领 = 硬核 + 保护带 + 启发法'); },
    chips: function (K, box) { var s = K.st; HL.ui.chip(box, '💥 发射经验反例', false, function () { s.ft = 0; }); } });
  var K2 = { name: '把反例变成证实', hint: '天王星的轨道和牛顿力学算的不一样。用按钮选两种应对：直接放弃牛顿力学，或者调整保护带、预言一颗未知行星。',
    init: function (K) { var s = K.st; programme(K); s.ch = -1; s.seen = {}; s.u = K.sphere(0.07, K.holo(C.CY, { core: 1 })); s.n = K.sphere(0.07, K.holo(C.PU, { core: 1 })); s.n.visible = false; k.lab(K, '天王星', 1.0, 2.3, 0, '#6fe3ff', 0.1); s.msg = k.msg(K, 2.8); },
    update: function (K, dt, t) { var s = K.st; s.u.position.copy(P(-0.2 + Math.cos(t * 0.5) * 1.3, 1.4 + Math.sin(t * 0.5) * 0.9 + Math.sin(t * 2) * 0.04, -0.2)); s.n.position.copy(P(-0.2 + Math.cos(t * 0.3 + 1) * 1.7, 1.4 + Math.sin(t * 0.3 + 1) * 1.15, -0.3)); s.core.material.uniforms.uOp.value = s.ch === 0 ? 0.15 : 1; s.n.visible = s.ch === 1;
      if (s.ch === 1) K.hit(0); if (s.seen.ch0 && s.seen.ch1) K.hit(1); K.text(s.msg, s.ch === 0 ? '素朴证伪：一个反例就抛弃整个牛顿力学 —— 历史上没有人这么做' : s.ch === 1 ? '勒维耶算出一颗未知行星的位置；1846 年，海王星就在那里：反例变成了最辉煌的证实' : ''); K.info('正面启发法告诉科学家怎样改进保护带'); },
    chips: function (K, box) { k.choice(K, box, ['素朴证伪：放弃牛顿力学', '调整保护带：预言海王星'], 'ch'); } };
  var K3 = { name: '进步与退化', hint: '用按钮在两种纲领之间切换：一种不断预言出新事实，一种只能事后打补丁。再点「让时间流逝」。',
    init: function (K) { var s = K.st; s.ch = 0; s.seen = { ch0: 1 }; s.t = 0; s.go = false; s.a = k.gauge(K, -1.2, 0, C.GR, '进步的纲领', 1.5); s.b = k.gauge(K, 0.6, 0, C.RED, '退化的纲领', 1.5); s.a.set(0.5); s.b.set(0.5); s.d = K.dots(20, 0.1); s.msg = k.msg(K, 2.5); },
    update: function (K, dt, t) { var s = K.st, i; if (s.go) { s.t = Math.min(1, s.t + dt * 0.25); s.a.set(0.5 + s.t * 0.5); s.b.set(0.5 - s.t * 0.45); if (s.t >= 1) K.hit(1); } for (i = 0; i < 20; i++) { var u = (t * 0.4 + i / 20) % 1; if (s.ch === 0) { s.d.set(i, -1.2 + u * 0.8, FY + 1.6 + u * 0.6, 0.1); s.d.rgb(i, 0.5, 1, 0.7); } else { s.d.set(i, 0.6 + (i % 5) * 0.1 - 0.2, FY + 0.1 + Math.floor(i / 5) * 0.1, 0.25); s.d.rgb(i, 1, 0.5, 0.4); } } s.d.flush(); if (s.seen.ch0 && s.seen.ch1) K.hit(0);
      K.text(s.msg, s.t >= 1 ? '退化的纲领最终被更有预言力的纲领取代 —— 但没有“即时的理性”，这需要时间' : s.ch === 0 ? '进步：理论走在事实前面，预言出新颖的事实并被证实' : '退化：事实走在前面，理论只能在后面追着打补丁'); K.info('划界的新标准：看纲领是进步还是退化'); },
    chips: function (K, box) { var s = K.st; k.choice(K, box, ['进步的研究纲领', '退化的研究纲领'], 'ch'); HL.ui.chip(box, '⏳ 让时间流逝', false, function () { s.go = true; }); } };
  def('lakatos', '拉卡托斯 · 科学研究纲领', '天王星的轨道与牛顿力学不符时，科学家为什么没有立刻抛弃牛顿定律，而是猜“外面还有一颗行星”？', [K1, K2, K3], { bound: '拉卡托斯承认：判断一个纲领是否退化只能事后回顾；在当下，坚持一个暂时落后的纲领并不一定不理性。' });

  /* ═════════════ 库恩 · 范式转换 ═════════════ */
  function curve(x) { return 1.2 + Math.sin(x * 1.6) * 0.45; }
  function drawCurve(K, color) { var pts = [], x; for (x = -1.8; x <= 1.2; x += 0.1) pts.push(P(x, curve(x), 0)); return K.line(pts, K.lineMat(color || C.GOLD, 0.9)); }
  var U1 = k.drags({ name: '常规科学', hint: '范式给出了一条范例曲线。把上面落下来的谜题一块块拖到曲线上它该在的位置。',
    init: function (K) { var s = K.st; drawCurve(K); s.n = 0; s.items = [-1.5, -1.0, -0.5, 0, 0.5, 1.0].map(function (x, i) { var m = k.ball(K, '', C.CY, 0.08, -1.6 + i * 0.55, 2.4, 0.2); m.userData.x = x; return m; }); s.msg = k.msg(K, 2.8); K.hit(0); },
    update: function (K) { var s = K.st; K.text(s.msg, s.n >= 6 ? '解出了 6 个谜题：常规科学就是这样一点点累积的 —— 没有人质疑曲线本身' : ''); K.info('已解 ' + s.n + ' / 6 个谜题'); },
    drop: function (K, m) { var s = K.st, x = clamp(m.position.x, -1.8, 1.2), tg = P(x, curve(x), 0); if (K.closePx(m.position, tg, 70)) { m.position.copy(tg); m.userData.done = true; m.material.uniforms.uColor.value.setHex(C.GR); s.n++; K.hit(1); if (s.n >= 6) K.hit(2); return true; } } });
  var U2 = k.drags({ name: '反常与危机', hint: '红色的反常怎么也贴不上曲线。把它们一个个拖进左下角的“搁置”抽屉，看共同体的信心。',
    init: function (K) { var s = K.st; s.cv = drawCurve(K); s.n = 0; s.dr = k.zone(K, -1.5, 0.3, 1.0, 0.4, C.GREY, '搁置'); s.g = k.gauge(K, 1.2, 0, C.GR, '信心', 1.4); s.g.set(1); s.items = [0, 1, 2, 3, 4].map(function (i) { return k.ball(K, '反常', C.RED, 0.09, -1.2 + i * 0.5, 2.0 + (i % 2) * 0.25, 0.1); }); s.msg = k.msg(K, 2.8); },
    update: function (K, dt, t) { var s = K.st; s.g.set(1 - s.n / 5); s.g.col(s.n >= 3 ? C.RED : C.GR); s.cv.material.opacity = 0.9 - s.n * 0.14 + (s.n >= 3 ? 0.1 * Math.sin(t * 20) : 0); K.text(s.msg, s.n >= 5 ? '危机：搁置不下去了。范式本身开始受到怀疑' : s.n >= 3 ? '抽屉满了，范例曲线出现了裂纹' : ''); K.info('已搁置 ' + s.n + ' 个反常'); },
    drop: function (K, m) { var s = K.st; if (K.closePx(m.position, s.dr, 110)) { m.userData.done = true; m.position.set(s.dr.x - 0.3 + s.n * 0.15, s.dr.y, 0.1); s.n++; K.hit(0); if (s.n >= 3) K.hit(1); if (s.n >= 5) K.hit(2); return true; } } });
  var U3 = k.drags({ name: '格式塔转换', hint: '按住画面（或空格）盯着这张图，直到它从鸭子翻成兔子；松手再来一次。然后把旧范式的解答拖进新范式。',
    init: function (K) { var s = K.st; s.h = 0; s.fl = 0; s.need = 1.5; s.times = []; s.fig = k.lab(K, '🦆', -0.2, 1.6, 0, '#ffffff', 0.9); s.nm = k.lab(K, '鸭', -0.2, 0.95, 0, '#ffd96b', 0.18); s.box = k.zone(K, 1.0, 2.3, 0.9, 0.4, C.PU, '新范式'); s.items = [k.card(K, '旧解答：行星轨道表', 0xffc46a, 1.1, -1.4, 0.3, 0.6), k.card(K, '旧解答：燃素的重量', C.GREY, 1.1, 0, 0.3, 0.6)]; s.msg = k.msg(K, 2.85); },
    update: function (K, dt) { var s = K.st; if (K.pressed) { s.h += dt; if (s.h > s.need) { s.times.push(s.need); s.fl++; s.h = 0; s.need = 0.8 + ((s.fl * 37) % 20) / 10; K.text(s.fig, s.fl % 2 ? '🐇' : '🦆'); K.text(s.nm, s.fl % 2 ? '兔' : '鸭'); K.hit(0); if (s.fl >= 2) K.hit(1); } } else s.h = 0; K.info('同样的线条，换了一种看法（已翻转 ' + s.fl + ' 次）'); },
    drop: function (K, m) { var s = K.st; if (K.closePx(m.position, s.box, 110)) { K.hit(2); if (m.userData.n.indexOf('燃素') >= 0) K.text(s.msg, '被弹回：在新范式里，“燃素”连问题都不成立'); else { m.userData.done = true; m.position.copy(s.box); m.position.y -= 0.4; K.text(s.msg, '这一个搬得过来 —— 但意思已经变了'); return true; } } } });
  var U4 = { name: '不同的世界', hint: '拖动竖直的分界线：线左边的人看见“受约束的下落”，线右边的人看见“摆”。再把下面的尺子拖过分界线。',
    init: function (K) { var s = K.st; s.x = 0.6; s.ln = k.box(K, 0.03, 2.2, 0.3, C.WH, 0.6, 1.2, 0.1); s.piv = P(-0.2, 2.3, 0); s.bob = K.sphere(0.1, K.holo(C.GOLD, { core: 1 })); s.st = K.line([V(0, 0, 0), V(0, 0, 0)], K.lineMat(C.WH, 0.8)); s.l = k.lab(K, '', -0.2, 2.6, 0, '#ffffff', 0.15); s.r = k.card(K, '尺子：0 1 2 3 4', C.CY, 1.0, -1.3, 0.3, 0.6); s.mv = 0; s.msg = k.msg(K, 2.9); },
    update: function (K, dt, t) { var s = K.st, a = Math.sin(t * 1.6) * 0.7, b = V(s.piv.x + Math.sin(a) * 1.3, s.piv.y - Math.cos(a) * 1.3, 0); s.bob.position.copy(b); K.setLine(s.st, [s.piv, b]); s.ln.position.x = s.x; var left = b.x < s.x; if (left !== s.wasL && s.wasL != null) K.hit(1); s.wasL = left;
      K.text(s.l, left ? '亚里士多德派：一块石头被绳子拽着，艰难地落向静止' : '伽利略：一个摆，几乎可以无限地重复同一个运动'); s.bob.material.uniforms.uColor.value.setHex(left ? C.AM : C.GOLD); if (s.mv > 0.5) K.hit(0); K.text(s.r.userData.lab, s.r.position.x > s.x ? '尺子：α β γ δ ε' : '尺子：0 1 2 3 4'); K.info('革命之后，科学家在一个不同的世界里工作'); },
    pick: function (K, x, y) { var s = K.st; if (K.px(s.r.position, x, y) < 70) return { drag: true, m: s.r }; return K.px(P(s.x, 1.2, 0.1), x, y) < 90 ? { drag: true, line: true } : null; }, dragStart: function (K, h, x, y) { if (h.m) k.DR.dragStart(K, h, x, y); h.x = x; },
    dragMove: function (K, h, x, y) { var s = K.st; if (h.line) { var d = (x - h.x) / 220; h.x = x; s.x = clamp(s.x + d, -1.5, 1.2); s.mv += Math.abs(d); } else k.DR.dragMove(K, h, x, y); },
    dragEnd: function (K, h) { var s = K.st; if (h.m && s.r.position.x > s.x) { K.hit(2); K.text(s.msg, '尺子跨过了线，刻度对不上了：两边没有共同的量度 —— 不可通约'); } } };
  var U5 = k.sliders({ name: '应用练习', hint: '拖动速度把手：先停在低速区，看牛顿的“质量”和爱因斯坦的“质量”；再推到高速。',
    init: function (K) { var s = K.st; s.v = K.slider('速度（占光速的比例）', -0.9, FY + 0.3, 0.05, C.CY, 0.8); s.a = k.gauge(K, -1.0, 0, C.AM, '牛顿：质量', 1.6); s.b = k.gauge(K, 0.5, 0, C.PU, '爱因斯坦：质量', 1.6); s.lo = 0; s.msg = k.msg(K, 2.6); },
    update: function (K, dt) { var s = K.st, v = Math.min(0.97, s.v.v), g = 1 / Math.sqrt(1 - v * v); s.a.set(0.3); s.b.set(Math.min(1, 0.3 * g)); if (v < 0.15) { s.lo += dt; if (s.lo > 1.5) K.hit(0); } if (v > 0.85) K.hit(1); K.text(s.msg, v > 0.85 ? '读数分开了。两个“质量”不是同一个概念 —— 但仍然可以放在一起比较' : v < 0.15 ? '低速时两个读数一样：看起来牛顿力学只是特例。可是两个“质量”的意思并不相同' : ''); K.info('γ = ' + g.toFixed(2)); } });
  def('kuhn', '库恩 · 范式转换', '科学是一砖一瓦累积起来的吗？还是隔一段时间，整幢楼会被换掉？', [U1, U2, U3, U4, U5]);

  /* ═════════════ 费耶阿本德 · 方法多元 ═════════════ */
  var E1 = { name: '方法论的铁律', hint: '年轻的日心说刚刚萌芽。用按钮依次给它套上两条“科学方法的戒律”，再换成“方法多元”。',
    init: function (K) { var s = K.st; s.ch = -1; s.seen = {}; s.sun = K.sphere(0.18, K.holo(C.GOLD, { core: 1.2 })); s.sun.position.copy(P(-0.2, 1.4, 0)); s.e = K.sphere(0.07, K.holo(C.CY, { core: 1 })); s.cage = K.mesh(new T.BoxGeometry(1.8, 1.4, 0.6), K.glow(C.RED, 0, { wire: true })); s.cage.position.copy(s.sun.position); k.lab(K, '萌芽期的哥白尼日心说', -0.2, 2.4, 0); s.msg = k.msg(K, 2.75); },
    update: function (K, dt, t) { var s = K.st, dead = s.ch === 0 || s.ch === 1; s.e.position.copy(P(-0.2 + Math.cos(t) * 0.6, 1.4 + Math.sin(t) * 0.45, 0.1)); s.cage.material.opacity = dead ? 0.9 : 0; s.sun.material.uniforms.uOp.value = dead ? 0.15 : 1; s.e.visible = !dead; if (s.seen.ch0 && s.seen.ch1) K.hit(0); if (s.ch === 2 && s.seen.ch0) K.hit(1);
      K.text(s.msg, s.ch === 0 ? '戒律一（一致性）：它与当时公认的物理学和观测不一致 → 出局' : s.ch === 1 ? '戒律二（禁止特设假说）：它要靠“恒星极其遥远”这类补丁才站得住 → 出局' : s.ch === 2 ? '放开铁律：新理论获得了生长的时间' : ''); K.info('没有哪一条规则不曾在某个时候被违反 —— 而且违反得有道理'); },
    chips: function (K, box) { k.choice(K, box, ['戒律一：与既有事实一致', '戒律二：严禁特设假说', '方法多元主义'], 'ch'); } };
  var E2 = { name: '被污染的事实', hint: '高塔落石：石头垂直落在塔脚。用按钮切换两种解读：16 世纪的常识，和伽利略的“反归纳”。',
    init: function (K) { var s = K.st; s.ch = 0; s.seen = { ch0: 1 }; s.t = 0; k.box(K, 0.3, 1.8, 0.3, C.GREY, -0.2, 0.9, 0); s.st = K.sphere(0.07, K.holo(C.AM, { core: 1 })); s.gr = k.box(K, 3.0, 0.05, 0.6, C.GR, -0.2, 0.0, 0); s.arr = k.lab(K, '', -0.2, 0.25, 0.4, '#ffffff', 0.14); s.msg = k.msg(K, 2.6); },
    update: function (K, dt, t) { var s = K.st, u = (t * 0.5) % 1, drift = s.ch ? Math.sin(t * 0.5) * 0.6 : 0; s.gr.position.x = -0.2 + drift; s.st.position.copy(P(0.05 + drift, 1.8 - u * u * 1.7, 0.1)); K.text(s.arr, s.ch ? '地球在转：塔、人和石头一起向东 →→' : '地球静止'); if (s.ch === 1) { K.hit(0); s.t += dt; if (s.t > 3) K.hit(1); }
      K.text(s.msg, s.ch ? (s.t > 3 ? '当时望远镜的光学还说不清；伽利略靠类比、宣传和特设的假说，为新宇宙观争取了时间' : '“石头垂直落下”这个“纯粹事实”里，早已藏着“地球不动”的理论') : '常识：石头垂直落在塔脚，可见地球没有动'); K.info('观察渗透着理论'); },
    chips: function (K, box) { k.choice(K, box, ['16 世纪的常识与感官经验', '伽利略的反归纳'], 'ch'); } };
  var E3 = k.sliders({ name: '增生', hint: '拖动滑杆：让共同体里并存的另类理论多起来。看几束不同角度的光，怎样照出单一主流看不见的地方。',
    init: function (K) { var s = K.st; s.v = K.slider('另类理论的多样性', -0.9, FY + 0.3, 0.1, C.PU, 0.8); s.obj = K.mesh(new T.IcosahedronGeometry(0.35, 0), K.holo(C.GREY, { core: 0.3 })); s.obj.position.copy(P(-0.2, 1.4, 0)); s.b = [0, 1, 2, 3, 4].map(function (i) { return K.line([V(0, 0, 0), V(0, 0, 0)], K.lineMat([C.GOLD, C.CY, C.PU, C.GR, C.AM][i], 0)); }); s.t = 0; s.msg = k.msg(K, 2.6); },
    update: function (K, dt, t) { var s = K.st, n = 1 + Math.round(s.v.v * 4); s.obj.rotation.y = t * 0.3; s.b.forEach(function (l, i) { var a = i / 5 * TAU + 0.5; K.setLine(l, [P(-0.2 + Math.cos(a) * 1.6, 1.4 + Math.sin(a) * 1.0, 0.3), s.obj.position.clone()]); l.material.opacity = i < n ? 0.9 : 0; }); s.obj.material.uniforms.uOp.value = 0.3 + n * 0.25; if (s.v.v >= 0.8) { K.hit(0); s.t += dt; if (s.t > 2) K.hit(1); }
      K.text(s.msg, s.t > 2 ? '“怎么都行”不是说随便什么都对：是说没有哪一条方法规则，能事先排除掉所有后来被证明有用的做法' : n === 1 ? '只有一束光：对象的大半在阴影里' : n + ' 种理论互相碰撞，照出了彼此的盲区'); K.info('理论的增生有益于科学，齐一则损害它的批判力'); } });
  def('feyerabend', '费耶阿本德 · 方法多元主义', '如果伽利略、爱因斯坦都严格遵守哲学家规定的“科学方法”，科学革命还会发生吗？', [E1, E2, E3], { bound: '费耶阿本德的结论常被误读为“科学和巫术没有区别”。他要反对的是把某一套方法规则当作唯一、永恒的标准。' });
})();
