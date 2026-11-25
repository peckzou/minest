/* Minest · 全息模型 · 第七街区 B — 罗素摹状词 / 皮尔士溯因推理 / 皮尔士符号三元 / 杜威探究理论, rebuilt as holograms
   (same stages, steps and quotations as the 2D models). Uses HL.simKit. */
(function () {
  'use strict';
  var HL = window.HL, T = window.THREE, k = HL && HL.simKit; if (!HL || !T || !k || !HL.simQ) return;
  var V = k.V, P = k.P, C = k.C, FY = k.FY, clamp = k.clamp, lerp = k.lerp, TAU = k.TAU, Q = HL.simQ;
  function def(key, title, core, stages, extra) { stages.forEach(function (s, i) { s.quotes = Q[key][i]; }); HL.sims.define(key, Object.assign({ lift: -0.35, zoom: 1.1, title: title, source: '——', flat: true, core: core, stages: stages }, extra || {})); }
  function bench(K) { var s = K.st; s.bench = P(0, 0.75, 0); k.box(K, 1.6, 0.12, 0.6, C.GREY, 0, 0.6, 0); k.lab(K, '拆解台', 0, 0.42, 0.35, '#9aa7b5'); }
  var PARTS = ['存在：至少有一个', '唯一：至多有一个', '性质：它是……'];
  function split(K, s, dt, names) { if (!s.on || !K.pressed) return; s.sp = Math.min(1, s.sp + dt * 0.5); if (!s.pc) { s.pc = (names || PARTS).map(function (n, i) { var m = k.card(K, n, [C.GR, C.CY, C.AM][i], 1.0); return m; }); s.on.visible = false; } s.pc.forEach(function (m, i) { m.position.set((i - 1) * 1.15 * s.sp, FY + 0.95 + s.sp * 0.7, 0); }); }

  /* ═════════════ 罗素 · 摹状词理论 ═════════════ */
  var R1 = k.drags({ name: '拆解台', hint: '把短语“当今法国国王”拖到拆解台上，再按住画面（或空格）把它拆开。',
    init: function (K) { var s = K.st; bench(K); s.sp = 0; s.items = [k.card(K, '当今法国国王', C.GOLD, 1.0, -1.4, 1.9, 0.4)]; k.lab(K, '“当今法国国王 是秃头”', 0, 2.5, 0, '#ffffff', 0.15); s.msg = k.msg(K, 2.8); },
    update: function (K, dt) { var s = K.st; split(K, s, dt); if (s.sp > 0.3) K.hit(1); if (s.sp > 0.6) K.hit(2); if (s.sp >= 1) { K.hit(3); K.text(s.msg, '拆完以后，命题里已经没有“当今法国国王”这个短语：只剩三个断言'); } K.info('摹状词看起来像名字，其实不是'); },
    drop: function (K, m) { var s = K.st; if (K.closePx(m.position, s.bench, 130)) { m.position.copy(s.bench); m.position.y += 0.2; m.userData.done = true; s.on = m; K.hit(0); return true; } } });
  var R2 = { name: '世界里的国王', hint: '用下方按钮往“法国”里放进或拿走国王，给国王戴上或摘下头发，看三块断言各自亮不亮。最后点「召出不存在的对象」。',
    init: function (K) { var s = K.st; s.n = 0; s.bald = true; k.zone(K, 0, 1.0, 2.4, 1.2, C.CY, '法国'); s.kg = [0, 1].map(function (i) { var m = K.person(C.GOLD, 1.4); m.position.copy(P(-0.4 + i * 0.8, 0.5, 0)); m.visible = false; return m; }); s.L = PARTS.map(function (n, i) { return k.lab(K, n, -1.3 + i * 1.3, 2.1, 0, '#9aa7b5'); }); s.tv = k.lab(K, '', 0, 2.5, 0, '#ffffff', 0.17); s.msg = k.msg(K, 2.9); },
    update: function (K) { var s = K.st, ok = [s.n >= 1, s.n <= 1, s.n >= 1 && s.bald]; s.kg.forEach(function (m, i) { m.visible = i < s.n; m.userData.head.material.uniforms.uColor.value.setHex(s.bald ? C.GOLD : 0x5b4636); }); s.L.forEach(function (l, i) { l.material.color.setHex(ok[i] ? C.GR : C.RED); });
      var t = ok[0] && ok[1] && ok[2]; K.text(s.tv, '“当今法国国王是秃头”：' + (t ? '真' : '假')); if (s.n === 0) { K.hit(0); K.hit(1); } if (s.n === 2) K.hit(2); if (t) K.hit(3); K.info('国王 ' + s.n + ' 位 · ' + (s.bald ? '秃头' : '有头发')); },
    chips: function (K, box) { var s = K.st; HL.ui.chip(box, '＋ 放进一位国王', false, function () { s.n = Math.min(2, s.n + 1); }); HL.ui.chip(box, '－ 拿走一位', false, function () { s.n = Math.max(0, s.n - 1); }); HL.ui.chip(box, '戴上 / 摘下头发', false, function () { s.bald = !s.bald; }); HL.ui.chip(box, '👻 召出不存在的对象', false, function () { K.hit(4); K.text(s.msg, '一个“不存在却又是国王”的对象：它既存在又不存在 —— 矛盾。所以不需要它'); }); } };
  var R3 = { name: '秃还是不秃', hint: '按住画面（或空格）清点“秃头的”和“不秃的”两张名单，都找不到国王。然后用按钮把“不”放到里面或外面。',
    init: function (K) { var s = K.st; s.c = 0; s.sc = {}; s.t = 0; k.zone(K, -1.0, 1.4, 1.5, 1.0, C.AM, '秃头的人'); k.zone(K, 1.0, 1.4, 1.5, 1.0, C.CY, '不秃的人'); s.d = K.dots(40, 0.11); s.f = k.lab(K, '', 0, 2.4, 0, '#ffffff', 0.16); s.msg = k.msg(K, 2.8); },
    update: function (K, dt) { var s = K.st, i; s.t += dt; if (s.t > 1) K.hit(0); if (K.pressed) s.c = Math.min(40, s.c + dt * 10); for (i = 0; i < 40; i++) { s.d.set(i, (i % 2 ? 1.0 : -1.0) - 0.55 + (Math.floor(i / 2) % 5) * 0.27, i < s.c ? FY + 1.05 + Math.floor(i / 10) * 0.22 : -9, -0.1); s.d.rgb(i, 0.8, 0.8, 0.8); } s.d.flush(); if (s.c >= 40) K.hit(1); if (s.sc.i && s.sc.o) K.hit(4);
      K.text(s.msg, s.sc.i && s.sc.o ? '排中律没有被打破：喜欢综合的黑格尔派会说“他戴着假发”—— 不必了' : s.c >= 40 ? '两张名单上都没有他' : ''); K.info('“法国国王不是秃头”有两种读法'); },
    chips: function (K, box) { var s = K.st; HL.ui.chip(box, '“不”在里面：有一位国王，他不秃', false, function () { s.sc.i = 1; K.text(s.f, '∃x（国王 x ∧ 唯一 ∧ ¬秃 x）：假'); K.hit(2); }); HL.ui.chip(box, '“不”在外面：并非（有一位秃头国王）', false, function () { s.sc.o = 1; K.text(s.f, '¬∃x（国王 x ∧ 唯一 ∧ 秃 x）：真'); K.hit(3); }); } };
  var R4 = k.drags({ name: '司各特与《威弗利》', hint: '乔治四世想知道“司各特是不是《威弗利》的作者”。把“司各特”拖进思想气泡去替换；再按住画面（或空格）拆开摹状词；最后把“司各特”拖到气泡外面的句子上。',
    init: function (K) { var s = K.st; s.t = 0; s.sp = 0; s.bub = k.zone(K, -0.3, 1.9, 2.6, 0.6, C.PU, '乔治四世想知道'); s.bl = k.lab(K, '司各特 是不是 《威弗利》的作者', -0.3, 1.9, 0, '#ffffff'); s.out = k.zone(K, -0.3, 0.9, 2.6, 0.5, C.GREY, '气泡之外：远远看见一个人'); s.ol = k.lab(K, '《威弗利》的作者 是不是 司各特？', -0.3, 0.9, 0); s.items = [k.card(K, '司各特', C.GOLD, 0.6, -1.8, 0.25, 0.6)]; s.on = { visible: true }; s.msg = k.msg(K, 2.8); },
    update: function (K, dt) { var s = K.st; s.t += dt; if (s.t > 1) K.hit(0); if (K.pressed) { s.sp = Math.min(1, s.sp + dt * 0.5); if (s.sp >= 1) { K.hit(2); K.hit(3); K.text(s.bl, '有且只有一个人写了《威弗利》，司各特是不是他'); K.text(s.msg, '拆开以后，没有一块可以被“司各特”整个换掉。摹状词在气泡里是“次要出现”'); } } K.info('乔治四世并不是想知道“司各特是不是司各特”'); },
    drop: function (K, m) { var s = K.st; if (K.closePx(m.position, s.bub, 150)) { K.hit(1); K.text(s.msg, '直接替换：“乔治四世想知道司各特是不是司各特” —— 荒谬'); } else if (K.closePx(m.position, s.out, 150)) { K.hit(4); K.text(s.msg, '在气泡外面替换是成立的：他远远看见的那个人，确实就是司各特'); } } });
  var R5 = k.drags({ name: '应用练习', hint: '把三个新短语一个个拖上拆解台，按住画面（或空格）拆开，看世界里找不找得到它。',
    init: function (K) { var s = K.st; bench(K); s.sp = 0; s.items = [['圆的方', 0, '没有任何东西既圆又方：“存在”那一块是假的'], ['除 2 以外的偶素数', 1, '同样不指称任何东西'], ['最完满的存在者', 2, '本体论证明缺的正是“存在”这一块：它不能靠定义得到']].map(function (d, i) { var m = k.card(K, d[0], C.GOLD, 1.1, -1.4, 1.5 + i * 0.35, 0.4); m.userData.i = d[1]; m.userData.why = d[2]; return m; }); s.msg = k.msg(K, 2.8); },
    update: function (K, dt) { var s = K.st; if (s.on && K.pressed) { s.sp = Math.min(1, s.sp + dt * 0.6); if (s.sp >= 1) { K.hit(s.on.userData.i); K.text(s.msg, s.on.userData.n + '：' + s.on.userData.why); s.on.visible = false; s.on = null; s.sp = 0; } } K.info(s.on ? '按住画面拆开 ' + Math.round(s.sp * 100) + '%' : '把一个短语拖上拆解台'); },
    drop: function (K, m) { var s = K.st; if (!s.on && K.closePx(m.position, s.bench, 130)) { m.position.copy(s.bench); m.position.y += 0.2; m.userData.done = true; s.on = m; return true; } } });
  def('russell_descriptions', '罗素 · 摹状词理论', '“当今法国国王是秃头”—— 法国没有国王。这句话是真、是假，还是没有意义？', [R1, R2, R3, R4, R5]);

  /* ═════════════ 皮尔士 · 溯因推理 ═════════════ */
  function bag(K, x, name, color) { var m = K.mesh(new T.CylinderGeometry(0.3, 0.22, 0.5, 16, 1, true), K.holo(color, { core: 0.4, side: T.DoubleSide })); m.position.copy(P(x, 0.9, 0)); k.lab(K, name, x, 1.35, 0); return m; }
  var A1 = k.drags({ name: '豆子袋', hint: '点「从全白袋抓一颗」「从未知袋抓一把」；桌上另有一把白豆 —— 把它拖回你猜的那个袋子。',
    init: function (K) { var s = K.st; s.bg = [bag(K, -1.4, '袋甲：全是白豆', C.WH), bag(K, 0, '袋乙：比例未知', C.GREY), bag(K, 1.2, '袋丙：全是黑豆', 0x555555)]; s.d = K.dots(12, 0.12); s.items = [k.ball(K, '桌上一把白豆', C.WH, 0.12, -0.3, 0.3, 0.7)]; s.msg = k.msg(K, 2.2); },
    update: function (K) { var s = K.st, i; for (i = 0; i < 12; i++) { s.d.set(i, -0.5 + i * 0.09, s.hand ? FY + 1.9 : -9, 0.2); var w = s.hand === 1 ? 1 : (i % 3 ? 1 : 0.25); s.d.rgb(i, w, w, w); } s.d.flush(); K.info('演绎、归纳、假设：三种推理'); },
    drop: function (K, m) { var s = K.st; if (K.closePx(m.position, s.bg[0].position, 110)) { K.hit(2); K.hit(3); K.text(s.msg, '假设：这些豆是白的；袋甲的豆全是白的；所以，这些豆（大概）来自袋甲'); } },
    chips: function (K, box) { var s = K.st; HL.ui.chip(box, '从全白袋抓一颗', false, function () { s.hand = 1; K.hit(0); K.text(s.msg, '演绎：袋里全是白豆；这颗来自这袋；所以它是白的 —— 必然'); }); HL.ui.chip(box, '从未知袋抓一把', false, function () { s.hand = 2; K.hit(1); K.text(s.msg, '归纳：这一把里三分之二是白的；所以整袋大约三分之二是白的 —— 可能'); }); } });
  var NM = ['规则', '情形', '结果'];
  var A2 = { name: '三种推理', hint: '三张卡：规则、情形、结果。用下方按钮选哪一张放在最后当“结论”，看三种推理各是什么。',
    init: function (K) { var s = K.st; s.last = 2; s.seen = { 2: 1 }; s.c = NM.map(function (n, i) { return k.card(K, n, [C.GOLD, C.CY, C.AM][i], 2.4); }); s.nm = k.lab(K, '', 0, 2.5, 0, '#ffffff', 0.18); K.hit(0); },
    update: function (K, dt) { var s = K.st, T3 = ['规则：这袋豆全是白的', '情形：这些豆来自这袋', '结果：这些豆是白的'], ord = [0, 1, 2].filter(function (i) { return i !== s.last; }).concat([s.last]); ord.forEach(function (i, r) { var m = s.c[i]; m.position.lerp(P(0, 1.9 - r * 0.45 - (r === 2 ? 0.15 : 0), 0), Math.min(1, dt * 6)); K.text(m.userData.lab, (r === 2 ? '∴ ' : '') + T3[i]); });
      K.text(s.nm, ['归纳：从情形和结果推出规则', '假设（溯因）：从规则和结果推出情形', '演绎：从规则和情形推出结果'][s.last]); if (s.seen[0]) K.hit(1); if (s.seen[1]) K.hit(2); if (s.seen[0] && s.seen[1] && s.seen[2]) K.hit(3); K.info('同样三句话，换一个顺序就是另一种推理'); },
    chips: function (K, box) { var s = K.st; NM.forEach(function (n, i) { HL.ui.chip(box, '把「' + n + '」放最后', s.last === i, function () { s.last = i; s.seen[i] = 1; HL.refreshTools(); }); }); } };
  var A3 = k.drags({ name: '侦探', hint: '案板中央是一件怪事。把线索拖向你选的假设；证据会陆续到来 —— 按住画面（或空格）给假设加注，或点「预测并检验」。',
    init: function (K) { var s = K.st; s.t = 0; s.bet = 0; s.n = 0; k.lab(K, '怪事：保险柜没撬，钱却不见了', 0, 1.4, 0, '#ffd96b', 0.15); s.hy = [k.zone(K, -1.2, 2.2, 1.3, 0.45, C.CY, ''), k.zone(K, 0.9, 2.2, 1.3, 0.45, C.PU, '')]; k.lab(K, '假设甲：内部的人', -1.2, 2.2, 0); k.lab(K, '假设乙：高明的窃贼', 0.9, 2.2, 0); s.items = ['只有三人知道密码', '窗户完好', '昨晚有人加班'].map(function (n, i) { return k.card(K, n, 0xffc46a, 1.0, -1.2 + i * 1.15, 0.4, 0.6); }); s.g = k.gauge(K, -2.0, 0, C.GR, '赌注', 1.2); s.msg = k.msg(K, 2.8); },
    update: function (K, dt) { var s = K.st; s.t += dt; if (s.t > 1) K.hit(0); if (K.pressed && s.n) { s.bet = Math.min(1, s.bet + dt * 0.4); if (s.bet > 0.5) K.hit(2); } s.g.set(s.bet); K.info('惊奇的事实 C；若 A 为真，C 就理所当然；所以有理由猜 A'); },
    drop: function (K, m) { var s = K.st; if (K.closePx(m.position, s.hy[0], 120) || K.closePx(m.position, s.hy[1], 120)) { s.n++; m.userData.done = true; m.position.y = FY + 1.75; K.hit(1); return true; } },
    chips: function (K, box) { var s = K.st; HL.ui.chip(box, '🔮 预测并检验', false, function () { K.hit(3); s.k = (s.k || 0) + 1; K.text(s.msg, s.k % 2 ? '预测“门卡记录里有内部人员”：查到了 ✓（记下）' : '预测“其中一人最近突然还清债务”：没有 ✗（也记下）'); if (s.k >= 2) K.hit(4); }); } });
  var A4 = k.drags({ name: '应用练习', hint: '两件惊奇的事。把最能让它“理所当然”的假设拖到它上面。',
    init: function (K) { var s = K.st; s.n = 0; s.f = [k.zone(K, -1.0, 1.9, 1.7, 0.5, C.GOLD, ''), k.zone(K, 1.0, 1.9, 1.7, 0.5, C.GOLD, '')]; k.lab(K, '内陆深处发现鱼形化石', -1.0, 1.9, 0); k.lab(K, '无数文献都提到拿破仑', 1.0, 1.9, 0);
      s.items = [['这里曾经是海', 0], ['有人恶作剧埋的', -1], ['确有其人', 1], ['所有作者串通好了', -1]].map(function (d, i) { var m = k.card(K, d[0], 0xffc46a, 1.0, -1.7 + i * 1.1, 0.4, 0.6); m.userData.t = d[1]; return m; }); s.msg = k.msg(K, 2.6); },
    update: function (K) { K.info('好的假设把许多零散的事实化成一件'); },
    drop: function (K, m) { var s = K.st, i = K.closePx(m.position, s.f[0], 130) ? 0 : K.closePx(m.position, s.f[1], 130) ? 1 : -1; if (i < 0) return; if (m.userData.t === i) { m.userData.done = true; m.position.set(s.f[i].x, s.f[i].y - 0.4, 0); K.hit(i); s.n++; if (s.n >= 2) K.hit(2); return true; } K.text(s.msg, '这个假设要另外再假定很多东西，才解释得了'); } });
  def('peirce', '皮尔士 · 溯因推理', '面对一件意外的事，我们是怎样“猜”出一个解释的？这种猜测算不算推理？', [A1, A2, A3, A4]);

  /* ═════════════ 皮尔士 · 符号三元 ═════════════ */
  var S1 = k.sliders({ name: '符号三元', hint: '拖动滑杆：让“符号、对象、解释项”三者连起来，再把它拉回去切断解释项。',
    init: function (K) { var s = K.st; s.sl0 = K.slider('三元中介关系', -0.7, FY + 0.3, 0.5, C.GOLD, 0.8); s.v = [k.ball(K, '符号 S：草地上的土丘', C.AM, 0.15, -1.2, 1.0, 0), k.ball(K, '对象 O：地下的鼹鼠', C.CY, 0.15, 1.2, 1.0, 0), k.ball(K, '解释项 I：“这里有鼹鼠”', C.PU, 0.15, 0, 2.2, 0)]; s.ln = [K.line([V(0, 0, 0), V(0, 0, 0)], K.lineMat(C.WH, 0.6)), K.line([V(0, 0, 0), V(0, 0, 0)], K.lineMat(C.GOLD, 1)), K.line([V(0, 0, 0), V(0, 0, 0)], K.lineMat(C.GOLD, 1))]; s.msg = k.msg(K, 2.8); },
    update: function (K) { var s = K.st, v = s.sl0.v, p = s.v.map(function (m) { return m.position; }); K.setLine(s.ln[0], [p[0], p[1]]); K.setLine(s.ln[1], [p[0], p[2]]); K.setLine(s.ln[2], [p[1], p[2]]); s.ln[1].material.opacity = s.ln[2].material.opacity = v; s.v[2].material.uniforms.uOp.value = 0.1 + v; if (v >= 0.8) K.hit(0); if (v <= 0.2) K.hit(1);
      K.text(s.msg, v >= 0.8 ? '三者缺一不可：土丘对某个理解者来说，才是鼹鼠的符号' : v <= 0.2 ? '没有解释项：土丘只是土丘，和鼹鼠之间只剩盲目的物理关系' : ''); K.info('符号 — 对象 — 解释项'); } });
  var S2 = k.drags({ name: '三种符号', hint: '把四个例子拖进它所属的一类：像似符（靠相像）、指示符（靠实际关联）、规约符（靠约定）。',
    init: function (K) { var s = K.st; s.n = 0; s.z = [k.zone(K, -1.4, 1.8, 1.2, 0.9, C.AM, '像似符 Icon'), k.zone(K, 0, 1.8, 1.2, 0.9, C.CY, '指示符 Index'), k.zone(K, 1.3, 1.8, 1.1, 0.9, C.PU, '规约符 Symbol')]; s.items = [['肖像画', 0], ['远处的浓烟', 1], ['风向标', 1], ['“苹果”这个词', 2]].map(function (d, i) { var m = k.card(K, d[0], 0xffc46a, 0.9, -1.6 + i * 1.02, 0.35, 0.6); m.userData.z = d[1]; return m; }); s.c = [0, 0, 0]; s.msg = k.msg(K, 2.7); },
    update: function (K) { K.info('已归位 ' + K.st.n + ' / 4'); },
    drop: function (K, m) { var s = K.st, i = [0, 1, 2].filter(function (j) { return K.closePx(m.position, s.z[j], 100); })[0]; if (i == null) return; if (i !== m.userData.z) { K.text(s.msg, '再想想：它靠什么和对象连起来？'); return; } m.userData.done = true; m.position.set(s.z[i].x, s.z[i].y + 0.2 - s.c[i] * 0.3, 0); s.c[i]++; s.n++; if (s.c[0] && s.c[1]) K.hit(0); if (s.n >= 4) K.hit(1); return true; } });
  var S3 = { name: '无限衍义', hint: '点「推进下一级」：每一个解释项，立刻又成了下一个符号。多点几次。',
    init: function (K) { var s = K.st; s.n = 0; s.ch = ['烟', '“着火了”', '“要报警”', '“电话在哪”', '“我的手机……”', '……']; s.nodes = []; s.msg = k.msg(K, 2.6); S3.add(K); },
    add: function (K) { var s = K.st, i = s.nodes.length; if (i >= s.ch.length) return; var m = k.ball(K, (i ? 'I' + i + ' = S' + (i + 1) + '：' : 'S1：') + s.ch[i], [C.AM, C.PU][i % 2], 0.12, -1.8 + i * 0.68, 0.7 + (i % 2) * 0.9, 0); if (i) K.line([s.nodes[i - 1].position.clone(), m.position.clone()], K.lineMat(C.GOLD, 0.9)); s.nodes.push(m); },
    update: function (K) { var s = K.st; if (s.n >= 2) K.hit(0); if (s.n >= 4) K.hit(1); K.text(s.msg, s.n >= 4 ? '意义不停在某一个符号上：它在一条没有尽头的解释之链里' : ''); K.info('已推进 ' + s.n + ' 级'); },
    chips: function (K, box) { var s = K.st; HL.ui.chip(box, '→ 推进下一级符号衍义', false, function () { s.n++; S3.add(K); }); } };
  def('peirce_semiotics', '皮尔士 · 符号三元关系', '如果没有第三个顶点 —— 在理解者那里唤起的“解释项”—— 一个东西还能成为符号吗？', [S1, S2, S3]);

  /* ═════════════ 杜威 · 探究理论 ═════════════ */
  function cups(K) { var s = K.st; s.cup = [-0.5, 0.3].map(function (x) { var m = K.mesh(new T.CylinderGeometry(0.18, 0.14, 0.32, 16, 1, true), K.holo(C.CY, { core: 0.5, side: T.DoubleSide })); m.position.copy(P(x, 0.75, 0)); m.rotation.x = Math.PI; return m; }); k.box(K, 2.0, 0.08, 0.8, C.GREY, 0, 0.55, 0); s.bub = K.dots(12, 0.08); s.bt = 0; }
  function bubbles(K, t, dir) { var s = K.st, i; for (i = 0; i < 12; i++) { var u = (t * 0.5 + i / 12) % 1, c = s.cup[i % 2].position; s.bub.set(i, c.x + (dir > 0 ? 0.2 + u * 0.15 : 0.35 - u * 0.15) * (i % 4 < 2 ? 1 : -1), c.y - 0.14, c.z + 0.1); s.bub.rgb(i, 0.8, 0.95, 1); } s.bub.flush(); }
  var D1 = { name: '感到困难', hint: '刚从热肥皂水里拿出来、倒扣在板上的杯子。按住画面（或空格）盯着看：杯口外冒出气泡，随后又缩了回去。',
    init: function (K) { var s = K.st; cups(K); s.h = 0; s.msg = k.msg(K, 2.2); },
    update: function (K, dt, t) { var s = K.st; if (K.pressed) { s.h += dt; K.hit(0); if (s.h > 2) K.hit(1); if (s.h > 4) K.hit(2); } bubbles(K, t, Math.sin(t * 0.8)); K.text(s.msg, s.h > 4 ? '感到困难 → 确定问题 → 提出设想 → 推演 → 检验：探究的五步' : s.h > 2 ? '为什么会冒泡？为什么又跑回去？—— 一种说不清的不安' : ''); K.info('思考从一个疑难的情境开始'); } };
  var D2 = k.drags({ name: '确定问题', hint: '别急着抓答案：先把放大镜拖到杯口去看气泡从哪里来。（也可以试试直接去抓右上角的“答案”。）',
    init: function (K) { var s = K.st; cups(K); s.look = 0; s.items = [k.ball(K, '放大镜', C.WH, 0.14, -1.6, 1.6, 0.4), k.card(K, '答案：“杯子漏气”', C.RED, 1.1, 1.0, 2.2, 0.4)]; s.msg = k.msg(K, 2.7); },
    update: function (K, dt, t) { var s = K.st; bubbles(K, t, 1); if (K.closePx(s.items[0].position, P(-0.3, 0.6, 0.1), 110)) { s.look += dt; K.hit(0); if (s.look > 1.5) K.hit(2); if (s.look > 3) { K.hit(3); K.text(s.msg, '问题清楚了：气泡是杯里的空气往外跑。可空气为什么要往外跑？要找中间的环节'); } } K.info('悬置判断，先把问题弄清'); },
    drop: function (K, m) { var s = K.st; if (m.userData.n !== '放大镜') { K.hit(1); K.text(s.msg, '太早了：还没弄清问题就抓住一个答案，被挡了回去'); return; } return true; } });
  var IDEAS = ['杯里的空气被加热膨胀', '肥皂水有黏性', '板子不平', '外面的冷空气被压进去'];
  var D3 = { name: '提出设想', hint: '按住画面（或空格）凝视杯子，让设想一个个冒出来；多留几个，先别急着定。',
    init: function (K) { var s = K.st; cups(K); s.h = 0; s.I = []; s.msg = k.msg(K, 2.7); },
    update: function (K, dt, t) { var s = K.st; bubbles(K, t, 1); if (K.pressed) { s.h += dt; if (s.h > (s.I.length + 1) * 1.0 && s.I.length < 4) { s.I.push(k.ball(K, IDEAS[s.I.length], C.PU, 0.1, -1.5 + s.I.length * 1.0, 1.6 + (s.I.length % 2) * 0.4, 0)); K.hit(0); } } if (s.I.length >= 2) K.hit(1); if (s.I.length >= 3) K.hit(2); if (s.I.length >= 4) K.hit(3);
      K.text(s.msg, s.I.length >= 4 ? '这些都还只是设想 —— 观念，不是结论' : s.I.length ? '设想是一次跳跃：从眼前的东西跳到不在眼前的东西' : ''); K.info('已有 ' + s.I.length + ' 个设想'); } };
  var D4 = k.drags({ name: '推演', hint: '把设想一个个拖到中间的“推演轨道”上，再按住画面（或空格）展开它的后果。',
    init: function (K) { var s = K.st; s.tr = k.zone(K, 0, 1.3, 3.0, 0.4, C.GOLD, '推演轨道'); s.p = 0; s.n = 0; s.items = [['空气被加热膨胀', '→ 那么杯子拿出来前，一定有冷空气进去过', 1], ['肥皂水有黏性', '→ 那么冷杯子也该冒泡 —— 荒谬', 2], ['板子不平', '→ 那么换块板就不冒 —— 可以试', 0]].map(function (d, i) { var m = k.card(K, d[0], C.PU, 1.0, -1.2 + i * 1.2, 0.4, 0.6); m.userData.c = d[1]; m.userData.h = d[2]; return m; }); s.out = k.lab(K, '', 0, 1.9, 0, '#ffffff', 0.14); s.msg = k.msg(K, 2.6); },
    update: function (K, dt) { var s = K.st; if (s.on && K.pressed) { s.p = Math.min(1, s.p + dt * 0.6); if (s.p >= 1) { K.text(s.out, s.on.userData.n + ' ' + s.on.userData.c); K.hit(0); K.hit(s.on.userData.h || 0); s.on.visible = false; s.on = null; s.p = 0; s.n++; if (s.n >= 3) K.hit(3); } } K.info(s.on ? '按住画面推演 ' + Math.round(s.p * 100) + '%' : '已推演 ' + s.n + ' / 3'); },
    drop: function (K, m) { var s = K.st; if (!s.on && K.closePx(m.position, s.tr, 140)) { m.position.copy(s.tr); m.position.z = 0.1; m.userData.done = true; s.on = m; return true; } } });
  var D5 = { name: '实验', hint: '用按钮做实验：一些杯子「摇晃着取出」，另一些「杯口朝下直接取出」；再「把冰块放到杯上」。',
    init: function (K) { var s = K.st; cups(K); s.mode = [0, 0]; s.ice = false; s.did = {}; s.msg = k.msg(K, 2.3); },
    update: function (K, dt, t) { var s = K.st, i; for (i = 0; i < 12; i++) { var j = i % 2, c = s.cup[j].position, on = s.mode[j] === 1, u = (t * 0.5 + i / 12) % 1, d = s.ice ? 1 - u : u; s.bub.set(i, c.x + (0.2 + d * 0.15) * (i % 4 < 2 ? 1 : -1), on ? c.y - 0.14 : -9, c.z + 0.1); s.bub.rgb(i, 0.8, 0.95, 1); } s.bub.flush();
      if (s.did.a && s.did.b) { K.hit(0); K.hit(1); K.hit(3); } if (s.ice) K.hit(2); if (s.did.a && s.did.b && s.ice) K.hit(4); K.text(s.msg, s.ice ? '冰块一放，气泡倒着往里跑：冷了就收缩。设想成立 —— 直到出现相反的事实' : s.did.a && s.did.b ? '只有摇晃过（进了冷空气）的杯子冒泡' : ''); K.info('有意地安排条件，去检验设想'); },
    chips: function (K, box) { var s = K.st; HL.ui.chip(box, '左杯：摇晃着取出', false, function () { s.mode[0] = 1; s.did.a = 1; }); HL.ui.chip(box, '右杯：杯口朝下直接取出', false, function () { s.mode[1] = 2; s.did.b = 1; }); HL.ui.chip(box, '🧊 把冰块放到左杯上', false, function () { s.ice = true; }); } };
  var D6 = k.drags({ name: '应用练习', hint: '渡船上层甲板前有一根几乎水平伸出的白杆，杆头有个金球。拖动空白处绕船看一圈；再把设想标签拖到白杆上。',
    init: function (K) { var s = K.st; s.az = HL.cam.az; s.t = 0; k.box(K, 2.2, 0.3, 0.8, C.GREY, 0, 0.5, 0); k.box(K, 0.7, 0.5, 0.6, C.CY, -0.5, 0.9, 0); k.lab(K, '驾驶室', -0.5, 1.3, 0); s.pole = k.box(K, 1.2, 0.03, 0.03, C.WH, 0.9, 0.85, 0); K.sphere(0.06, K.holo(C.GOLD, { core: 1 })).position.copy(P(1.5, 0.85, 0)); s.items = [k.card(K, '旗杆', 0xffc46a, 0.6, -1.4, 2.1, 0.4), k.card(K, '装饰', 0xffc46a, 0.6, -0.6, 2.1, 0.4), k.card(K, '方向标', 0xffc46a, 0.7, 0.3, 2.1, 0.4)]; s.msg = k.msg(K, 2.6); },
    update: function (K, dt) { var s = K.st; s.t += dt; if (s.t > 1) K.hit(0); if (s.t < 1.5) s.az = HL.cam.az; else if (Math.abs(HL.cam.az - s.az) > 0.2) K.hit(2); K.info('从驾驶室看过去，杆尖指着船头的方向'); },
    drop: function (K, m) { var s = K.st, n = m.userData.n; if (!K.closePx(m.position, s.pole.position, 150)) return; if (n === '旗杆') { K.hit(1); K.text(s.msg, '旗杆该是竖的；它却几乎水平，也没有挂旗的滑轮'); } else if (n === '方向标') { K.hit(3); K.hit(4); K.text(s.msg, '舵手需要它来看船头指向哪里：这个设想和所有事实都对得上'); } else K.text(s.msg, '装饰？那它为什么只有这一根、偏偏在驾驶室前面？'); } });
  def('dewey', '杜威 · 探究理论', '一个完整的“思考”是怎样发生的 —— 从觉得不对劲，到得出一个靠得住的结论？', [D1, D2, D3, D4, D5, D6]);
})();
