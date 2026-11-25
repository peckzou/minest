/* Minest · 全息模型 · 附属岛 · 心理学街区 (10 models) — same stages, steps and quotations as the 2D lab models. Uses HL.AX. */
(function () {
  'use strict';
  var HL = window.HL, A = HL && HL.AX; if (!A) return;
  var k = A.k, P = A.P, C = A.C, FY = A.FY, clamp = A.clamp, lerp = A.lerp, TAU = A.TAU, T = window.THREE;

  /* ── 巴甫洛夫 · 经典条件作用 ── */
  function dog(K, s) { s.dog = k.box(K, 0.7, 0.4, 0.3, C.AM, -0.4, 0.9, 0); k.lab(K, '狗', -0.4, 1.3, 0); s.g = A.gauges(K, ['唾液分泌'], [C.CY], 1.0, 1.0, -0.3); s.bell = k.lab(K, '', -1.5, 1.9, 0, '#ffd96b', 0.3); s.food = k.lab(K, '', 0.5, 1.9, 0, '#ffa23a', 0.3); s.cr = 0; s.sal = 0; s.bt = 0; s.ft = 0; }
  function dogTick(K, s, dt) { s.bt = Math.max(0, s.bt - dt); s.ft = Math.max(0, s.ft - dt); s.sal = Math.max(0, s.sal - dt * 0.8); K.text(s.bell, s.bt > 0 ? '🔔' : ''); K.text(s.food, s.ft > 0 ? '🍖' : ''); s.g[0].set(s.sal); }
  A.model('pavlov_classical', '巴甫洛夫 · 经典条件作用', '本来不会让狗流口水的铃声，是怎样变成一个能直接引起分泌的“信号”的？', [
    { name: '配对', hint: '先点「只摇铃」看看；再点几次「摇铃 + 给食物」；然后再点「只摇铃」。', bt: ['🔔 只摇铃', '🔔+🍖 摇铃再给食物'],
      scene: dog, onBt: function (K, s, j) { s.bt = 1.2; if (j === 1) { s.ft = 1.2; s.pair = (s.pair || 0) + 1; s.cr = Math.min(1, s.pair / 3); s.sal = 1; } else { if (!s.pair) s.first = 1; s.sal = Math.max(s.sal, s.cr); if (s.cr >= 1) s.got = 1; } },
      tick: function (K, s, dt) { dogTick(K, s, dt); },
      rules: [function (v, c, s) { return s.first; }, function (v, c, s) { return s.got; }], msg: function (v, c, s) { return s.got ? '只有铃声，口水也来了：条件反射形成' : s.pair ? '铃声在前、食物在后：已配对 ' + s.pair + ' 次' : s.first ? '狗只是竖起耳朵听了听：没有口水' : ''; } },
    { name: '消退与恢复', hint: '条件反射已经建立。连续点「只摇铃」几次，看反应；再点「休息一阵」后摇一次铃。', bt: ['🔔 只摇铃', '😴 休息一阵'],
      scene: function (K, s) { dog(K, s); s.cr = 1; }, onBt: function (K, s, j) { if (j === 0) { s.bt = 1.2; s.sal = s.cr; if (s.rest && s.cr > 0.3) s.rec = 1; s.cr = Math.max(0, s.cr - 0.25); if (s.cr <= 0) s.ext = 1; } else if (s.ext) { s.rest = 1; s.cr = 0.5; } },
      tick: function (K, s, dt) { dogTick(K, s, dt); },
      rules: [function (v, c, s) { return s.ext; }, function (v, c, s) { return s.rec; }], msg: function (v, c, s) { return s.rec ? '歇了一阵，反应自己回来了一部分：消退不是把学到的东西抹掉' : s.ext ? '铃声后面总没有食物：反应消退了' : ''; } }
  ]);

  /* ── 斯金纳 · 操作性条件作用 ── */
  function box(K, s) { s.g = A.gauges(K, ['压杆的频率'], [C.GR], 1.0, 1.0, -0.3); s.pg = k.box(K, 0.35, 0.3, 0.3, C.CY, -0.6, 0.9, 0); k.box(K, 0.4, 0.06, 0.1, C.GOLD, -0.1, 1.0, 0); k.lab(K, '鸽子与杠杆', -0.4, 1.4, 0); s.rate = 0.15; }
  A.model('skinner_operant', '斯金纳 · 操作性条件作用', '每按必给食的鸽子，一停粮很快就不按了；随机才给一次的鸽子，却会疯了似的一直按。为什么？', [
    { name: '强化与消退', hint: '按住画面（或空格）让鸽子每次压杆后都得到食物，看压杆的频率；再点「停止给食」并继续按住。', bt: ['🚫 停止给食'],
      scene: box, tick: function (K, s, dt) { if (K.pressed) { s.rate = clamp(s.rate + (s.b[0] ? -0.35 : 0.3) * dt, 0.05, 1); } s.g[0].set(s.rate); s.pg.position.y = FY + 0.9 + Math.abs(Math.sin(s.t * (2 + s.rate * 14))) * 0.08; if (s.rate > 0.8) s.up = 1; },
      rules: [function (v, c, s) { return s.up; }, function (v, c, s) { return s.up && s.b[0] && s.rate < 0.3; }], msg: function (v, c, s) { return s.b[0] ? (s.rate < 0.3 ? '后果没了，行为也就少了：消退' : '继续按住看看') : s.up ? '行为之后跟着好结果，它就越来越多：强化' : ''; } },
    { name: '强化程式', hint: '用按钮选一种给食规则，按住画面（或空格）训练一会儿，再点「停粮」继续按住，比较两种规则下鸽子还按多久。最后点「塑造」。', ch: ['每次都给（连续强化）', '随机若干次才给（可变比率）'], bt: ['🚫 停粮', '🪜 塑造'],
      scene: function (K, s) { box(K, s); s.tr = 0; s.res = {}; }, onBt: function (K, s, j) { if (j === 0) s.stop = 1; },
      tick: function (K, s, dt, t, v, ch) { if (s.lastCh !== ch) { s.lastCh = ch; s.stop = 0; s.rate = 0.3; s.tr = 0; } if (K.pressed) { if (!s.stop) { s.tr += dt; s.rate = clamp(s.rate + 0.4 * dt, 0, ch === 1 ? 1 : 0.7); } else { s.rate = Math.max(0.03, s.rate - (ch === 1 ? 0.06 : 0.5) * dt); if (s.tr > 1) s.res[ch] = (s.res[ch] || 0) + dt; } } s.g[0].set(s.rate); },
      rules: [function (v, ch, s) { return ch === 1 && s.tr > 1.5; }, function (v, c, s) { return s.b[1] > 0; }], msg: function (v, ch, s) { return s.b[1] ? '塑造：先奖励“朝杠杆转头”，再奖励“靠近”，再奖励“碰到”…… 一小步一小步逼近' : s.stop ? (ch === 1 ? '停粮了它还在按：“说不定下一次就有”' : '停粮后很快就不按了') : ch === 1 ? '不知道哪一次会有：按得又快又不停' : ''; } }
  ]);

  /* ── 班杜拉 · 社会学习 ── */
  A.model('bandura_social_learning', '班杜拉 · 社会学习理论', '学一个新行为，非得自己去试、自己挨罚或领奖吗？只是看见别人做了之后的下场，会怎样影响我们？', [
    { name: '观察学习的四步', hint: '点「榜样示范」。然后把四根滑杆都拉高：注意、保持、动作复现、动机。', sl: [['注意', 0.1, C.CY], ['保持', 0.1, C.PU], ['复现', 0.1, C.GR], ['动机', 0.1, C.AM]], bt: ['🎬 榜样示范'],
      scene: function (K, s) { s.m = A.person(K, C.GOLD, -1.2, 1.0, 0, 1.6, '榜样'); s.o = A.person(K, C.CY, 0.5, 1.0, 0, 1.4, '观察者'); s.th = k.lab(K, '', 0.5, 2.25, 0, '#ffd96b', 0.13); },
      tick: function (K, s, dt, t, v) { if (s.b[0]) s.m.rotation.z = Math.sin(t * 6) * 0.3; K.text(s.th, s.b[0] ? '（脑中已记下这个动作）' : ''); s.all = Math.min(v[0], v[1], v[2], v[3]); if (s.all > 0.7) s.o.rotation.z = Math.sin(t * 6) * 0.3; else s.o.rotation.z = 0; },
      rules: [function (v, c, s) { return s.b[0] > 0; }, function (v, c, s) { return s.b[0] && s.all > 0.7; }], msg: function (v, c, s) { return s.b[0] && s.all > 0.7 ? '四步都通了：他做出了自己从没被奖励过的动作' : s.b[0] ? '没有任何奖惩落在观察者身上，他却已经学会了' : ''; } },
    { name: '习得与表现', hint: '用按钮切换榜样的下场：受到批评，或受到表扬。再点「给观察者一个奖励」，看他会不会做。', ch: ['榜样受到批评', '榜样受到表扬'], bt: ['🍬 给观察者一个奖励'],
      scene: function (K, s) { s.g = A.gauges(K, ['已经学会', '愿意做出来'], [C.PU, C.GR], -0.9, 0.3, -0.3); },
      tick: function (K, s, dt, t, v, ch) { s.g[0].set(0.9); s.g[1].set(ch === 1 ? 0.9 : s.b[0] ? 0.85 : 0.1); if (ch === 0 && s.b[0]) s.p = 1; },
      rules: [function (v, c, s) { return s.p; }, function (v, ch) { return ch === 1; }], msg: function (v, ch, s) { return ch === 1 ? '看见别人因此得了好处：自己也觉得“我能行”，愿意去做' : s.b[0] ? '一有奖励，他完整地做了出来：原来早就学会了，只是没表现' : '榜样挨了批评：他不做 —— 但“学会”的柱子一直是满的'; } }
  ]);

  /* ── 皮亚杰 · 认知发展 ── */
  A.model('piaget_cognitive', '皮亚杰 · 认知发展', '把矮宽杯里的水全倒进细高杯，四岁的孩子很肯定地说“水变多了”，八岁的孩子却一眼看出没变。差别在哪？', [
    { name: '守恒', hint: '点「把水倒进细高杯」。用按钮切换两个孩子的回答。', ch: ['4 岁（前运算）', '8 岁（具体运算）'], bt: ['🫗 把水倒进细高杯'],
      scene: function (K, s) { s.w = k.box(K, 0.8, 0.3, 0.3, C.CY, -0.9, 0.85, 0); s.tall = k.box(K, 0.25, 0.96, 0.3, C.CY, 0.3, 1.18, 0); s.tall.visible = false; s.say = k.lab(K, '', -0.3, 2.35, 0, '#ffffff', 0.15); },
      tick: function (K, s, dt, t, v, ch) { s.w.visible = !s.b[0]; s.tall.visible = !!s.b[0]; K.text(s.say, !s.b[0] ? '' : ch === 0 ? '“水变多了！它那么高。”' : '“一样多。倒回去还是原来那些。”'); if (s.b[0] && ch === 0) s.a = 1; },
      rules: [function (v, c, s) { return s.a; }, function (v, ch, s) { return s.b[0] && ch === 1; }], msg: function (v, ch, s) { return !s.b[0] ? '' : ch === 0 ? '他的注意力被“高度”这一个维度抓住了' : '她同时顾到高和宽，还能在心里把这个动作倒回去：守恒'; } },
    { name: '同化与顺应', hint: '孩子有一个图式：“会飞的 = 鸟”。用按钮依次给她看麻雀、蝙蝠，再点「改写图式」。', bt: ['🐦 麻雀', '🦇 蝙蝠', '✏ 改写图式'],
      scene: function (K, s) { s.sc = k.lab(K, '图式：会飞的 = 鸟', -0.3, 1.6, 0, '#ffd96b', 0.18); s.st = k.lab(K, '', -0.3, 1.1, 0, '#ffffff', 0.14); },
      onBt: function (K, s, j) { if (j === 0) K.text(s.st, '麻雀：会飞 → 是鸟 ✓（放进原来的图式）'); if (j === 1) K.text(s.st, '蝙蝠：会飞 → 是鸟？可它有毛、喂奶……对不上'); if (j === 2 && s.b[1]) { K.text(s.sc, '图式：有羽毛、下蛋的 = 鸟；会飞的不一定'); K.text(s.st, '新的平衡'); s.acc = 1; } },
      rules: [function (v, c, s) { return s.b[0] > 0; }, function (v, c, s) { return s.acc; }], msg: function (v, c, s) { return s.acc ? '顺应：旧图式解释不了，就改造图式本身' : s.b[1] ? '失衡：塞不进去了' : s.b[0] ? '同化：用已有的图式接住新经验' : ''; } }
  ]);

  /* ── 维果茨基 · 最近发展区 ── */
  A.model('vygotsky_zpd', '维果茨基 · 最近发展区', '好的教学，是等孩子成熟了再教，还是瞄准那些“他自己做不出、有人搭把手就恰好能做到”的地方？', [
    { name: '找到那一带', hint: '两根滑杆：任务的难度，和老师搭的“脚手架”。先看他独自能做到哪里，再把难度放进金色那一带并加上帮助。', sl: [['任务难度', 0.2, C.RED], ['脚手架（提示与帮助）', 0, C.GOLD]],
      scene: function (K, s) { k.box(K, 2.6, 0.5, 0.05, C.GR, -0.35, 0.85, -0.1); k.box(K, 2.6, 0.5, 0.05, C.GOLD, -0.35, 1.4, -0.1); k.box(K, 2.6, 0.5, 0.05, C.RED, -0.35, 1.95, -0.1); k.lab(K, '独自能做到', -0.35, 0.85, 0); k.lab(K, '最近发展区：有帮助就能做到', -0.35, 1.4, 0); k.lab(K, '现在还够不着', -0.35, 1.95, 0); s.pt = A.dot(K, C.WH, 0.1); s.ok = k.lab(K, '', -0.35, 2.4, 0, '#ffffff', 0.15); },
      tick: function (K, s, dt, t, v) { s.pt.position.copy(P(0.7, 0.62 + v[0] * 1.6, 0.1)); var zone = v[0] < 0.33 ? 0 : v[0] < 0.67 ? 1 : 2, can = zone === 0 || (zone === 1 && v[1] > 0.6); K.text(s.ok, can ? '做到了 ✓' : '做不到 ✗'); if (zone === 1 && v[1] < 0.2) s.alone = 1; s.zone = zone; s.can = can; },
      rules: [function (v, c, s) { return s.alone; }, function (v, c, s) { return s.zone === 1 && s.can; }], msg: function (v, c, s) { return s.zone === 1 && s.can ? '教学走在发展前面，把正在成熟的能力带了出来' : s.zone === 1 ? '这道题他自己做不出：加一点帮助试试' : s.zone === 0 ? '太容易：他学不到新东西' : '太难：再多帮助也没用'; } },
    { name: '撤掉脚手架', hint: '按住画面（或空格）让他在帮助下反复练；熟练度上来以后，把脚手架的滑杆一点点拉回左边。', sl: [['脚手架', 0.9, C.GOLD]],
      scene: function (K, s) { s.g = A.gauges(K, ['熟练度', '独立完成'], [C.CY, C.GR], -0.9, 0.3, -0.3); s.sk = 0.1; },
      tick: function (K, s, dt, t, v) { if (K.pressed && v[0] > 0.3) s.sk = Math.min(1, s.sk + dt * 0.3); s.g[0].set(s.sk); s.ind = s.sk > 0.9 && v[0] < 0.1; s.g[1].set(s.ind ? 1 : Math.max(0, s.sk - v[0]) * 0.6); },
      rules: [function (v, c, s) { return s.sk > 0.6; }, function (v, c, s) { return s.ind; }], msg: function (v, c, s) { return s.ind ? '今天在合作中能做到的，明天就能独立做到' : s.sk > 0.6 ? '原来在两个人之间做的事，正在变成他一个人心里做的事。可以开始撤了' : ''; } }
  ]);

  /* ── 鲍尔比 · 依恋 ── */
  A.model('bowlby_attachment', '鲍尔比 · 依恋理论', '有可靠依恋的孩子，为什么反而比早早被要求“独立”的孩子更敢一个人走远？', [
    { name: '安全基地', hint: '拖动滑杆：照护者回应得有多及时、多敏感。看孩子敢离开多远去探索。', sl: [['照护者的敏感回应', 0.1, C.GOLD]],
      scene: function (K, s) { s.mom = A.person(K, C.GOLD, -1.3, 0.8, 0, 1.6, '照护者'); s.kid = K.person(C.CY, 0.9); s.ring = K.mesh(new T.TorusGeometry(1, 0.012, 6, 60), K.glow(C.GR, 0.8)); s.ring.position.copy(P(-1.3, 1.1, 0)); },
      tick: function (K, s, dt, t, v) { var R = 0.3 + v[0] * 1.9, a = t * 0.8; s.ring.scale.setScalar(R); s.kid.position.copy(P(-1.3 + Math.abs(Math.cos(a)) * R * 0.95, 0.75 + Math.sin(a * 2) * 0.15, 0.2)); },
      rules: [function (v) { return v[0] > 0.8; }, function (v, c, s) { return v[0] > 0.8 && s.t > 4; }], msg: function (v) { return v[0] > 0.8 ? '他回头确认一眼，然后走得更远：依恋不是软弱，是探索的底气' : '回应不可靠：他不敢离开半步'; } },
    { name: '内部工作模型', hint: '用按钮切换三种照护方式，看孩子形成的策略；再点「后来遇到一段安全的关系」。', ch: ['一致而敏感', '忽冷忽热', '冷漠拒绝'], bt: ['🌱 后来遇到一段安全的关系'],
      scene: function (K, s) { s.g = A.gauges(K, ['“别人靠得住”', '“我值得被爱”'], [C.CY, C.GOLD], -0.9, 0.3, -0.3); s.ty = k.lab(K, '', -0.3, 2.45, 0, '#ffffff', 0.16); s.a = 0.9; s.bb = 0.9; },
      tick: function (K, s, dt, t, v, ch) { var tg = [[0.9, 0.9], [0.45, 0.3], [0.15, 0.5]][ch]; if (s.b[0] && ch > 0) tg = [0.75, 0.75]; s.a = lerp(s.a, tg[0], dt * 2); s.bb = lerp(s.bb, tg[1], dt * 2); s.g[0].set(s.a); s.g[1].set(s.bb); K.text(s.ty, s.b[0] && ch > 0 ? '模型被更新了' : ['安全型', '焦虑矛盾型', '回避型'][ch]); },
      rules: [function (v, c, s) { return s.seen.c1 && s.seen.c2; }, function (v, ch, s) { return s.b[0] && ch > 0; }], msg: function (v, ch, s) { return s.b[0] && ch > 0 ? '早年的模型有惯性，但不是定论：新的安全经验可以修复它' : ['求助有人应：敢靠近，也敢走开', '不知道这次会不会有人应：黏着不放，又生气', '反正没人应：干脆不求'][ch]; } }
  ]);

  /* ── 艾宾浩斯 · 遗忘曲线 ── */
  A.model('ebbinghaus_forgetting', '艾宾浩斯 · 遗忘曲线', '刚背熟的东西为什么头几个小时忘得最快？怎样在最合适的时间复习，用最少的工夫把它记牢？', [
    { name: '遗忘', hint: '拖动时间滑杆，沿着曲线看记住的还剩多少；再点「重新学一遍」。', sl: [['学完之后经过的时间（0–7 天）', 0, C.GOLD]], bt: ['🔁 重新学一遍'],
      scene: function (K, s) { var f = function (u) { return 0.2 + 0.8 * Math.exp(-u * 9); }; s.f = f; A.axes(K, null, null, null, null, '时间', '还记得'); s.cv = A.plot(K, f, C.GOLD); s.pt = A.dot(K); s.r = k.lab(K, '', -0.3, 2.5, 0, '#ffffff', 0.15); },
      tick: function (K, s, dt, t, v) { s.pt.position.copy(s.cv.userData.at(v[0])); K.text(s.r, s.b[0] ? '重学只用了第一次 60% 的时间：省下了 40%' : '还记得 ' + Math.round(s.f(v[0]) * 100) + '%'); },
      rules: [function (v) { return v[0] > 0.15; }, function (v, c, s) { return s.b[0] > 0; }], msg: function (v, c, s) { return s.b[0] ? '想不起来不等于没了：痕迹还在，表现为重学时的“节省”' : v[0] > 0.15 ? '头一天掉得最陡，后面就平了' : ''; } },
    { name: '间隔复习', hint: '用按钮比较：一天之内连背 30 遍；或者在第 1、3、7 天各复习一次（点三次）。', bt: ['📚 一天内连背 30 遍', '⏰ 投放一次间隔复习'],
      scene: function (K, s) { A.axes(K, null, null, null, null, '时间', '还记得'); s.cv = A.plot(K, function (u) { return 0.2 + 0.8 * Math.exp(-u * 9); }, C.GOLD); s.g = A.gauges(K, ['一周后还记得'], [C.GR], 1.25, 1.25, -0.3, 1.3); },
      onBt: function (K, s, j) { if (j === 0) s.mass = 1; },
      tick: function (K, s) { var n = Math.min(3, s.b[1] || 0), rv = [0.14, 0.43, 1.0]; s.cv.userData.replot(function (u) { var last = 0, S = 9, i; for (i = 0; i < n; i++) if (u >= rv[i] * 0.9) { last = rv[i] * 0.9; S = 9 / Math.pow(2.6, i + 1); } return 0.2 + 0.8 * Math.exp(-(u - last) * S); }); s.keep = n >= 3 ? 0.88 : n === 2 ? 0.6 : n === 1 ? 0.4 : s.mass ? 0.28 : 0.2; s.g[0].set(s.keep); },
      rules: [function (v, c, s) { return s.mass && (s.b[1] || 0) >= 1; }, function (v, c, s) { return (s.b[1] || 0) >= 3; }], msg: function (v, c, s) { return (s.b[1] || 0) >= 3 ? '每复习一次，曲线就平一些：三次之后稳在 85% 以上' : s.mass ? '连背 30 遍：当天很熟，一周后只剩 28%' : ''; } }
  ]);

  /* ── 巴德利 · 工作记忆 ── */
  A.model('baddeley_working_memory', '巴德利 · 工作记忆模型', '为什么可以“边看地图边听导航”，却很难“边默背电话号码边读文章”？', [
    { name: '两条通道', hint: '用按钮安排两项任务同时进行：两项都走“语音回路”，或者一项走语音、一项走“视觉空间画板”。', ch: ['默背号码 + 读文章（都是语音）', '听导航 + 看地图（语音 + 视觉）'],
      scene: function (K, s) { s.ph = k.box(K, 1.1, 0.5, 0.08, C.CY, -1.1, 1.2, 0); s.vs = k.box(K, 1.1, 0.5, 0.08, C.PU, 0.3, 1.2, 0); k.lab(K, '语音回路', -1.1, 1.2, 0.1); k.lab(K, '视觉空间画板', 0.3, 1.2, 0.1); k.box(K, 1.4, 0.4, 0.08, C.GOLD, -0.4, 2.0, 0); k.lab(K, '中央执行', -0.4, 2.0, 0.1); s.g = A.gauges(K, ['双任务的成绩'], [C.GR], -2.0, -2.0, 0.3, 1.2); },
      tick: function (K, s, dt, t, v, ch) { A.col(s.ph, ch === 0 ? C.RED : C.CY); s.ph.position.x = -1.1 + (ch === 0 ? Math.sin(t * 30) * 0.03 : 0); A.op(s.vs, ch === 1 ? 1.3 : 0.25); s.g[0].set(ch === 0 ? 0.25 : 0.9); },
      rules: [function (v, c, s) { return s.seen.c0 && s.t > 1.5; }, function (v, ch) { return ch === 1; }], msg: function (v, ch) { return ch === 0 ? '两项任务抢同一条通道：号码丢了，文章也没读进去' : '各走各的通道：互不妨碍'; } },
    { name: '中央执行与缓冲器', hint: '拖动滑杆加大任务的复杂度，看中央执行；再点「启用情景缓冲器」。', sl: [['任务复杂度', 0.2, C.RED]], bt: ['🧩 启用情景缓冲器'],
      scene: function (K, s) { s.g = A.gauges(K, ['中央执行的负荷', '各通道的表现', '整合成连贯的场景'], [C.RED, C.CY, C.GOLD], -1.3, 0.5, -0.3); },
      tick: function (K, s, dt, t, v) { s.g[0].set(v[0]); s.g[1].set(clamp(1.1 - v[0], 0.05, 1)); s.g[2].set(s.b[0] ? 0.9 : 0.1); },
      rules: [function (v) { return v[0] > 0.85; }, function (v, c, s) { return s.b[0] > 0; }], msg: function (v, c, s) { return s.b[0] ? '缓冲器把听到的、看到的和长期记忆里的东西拼成一整块' : v[0] > 0.85 ? '注意力被耗尽：两条通道一起垮' : ''; } }
  ]);

  /* ── 马斯洛 · 需要层次 ── */
  var LV = ['生理', '安全', '归属与爱', '尊重', '自我实现'];
  function pyramid(K, s) { s.L = LV.map(function (n, i) { var m = k.box(K, 2.4 - i * 0.42, 0.34, 0.3, [C.RED, C.AM, C.GOLD, C.GR, C.PU][i], -0.5, 0.75 + i * 0.37, 0); k.lab(K, n, -0.5, 0.75 + i * 0.37, 0.2, '#ffffff', 0.11); return m; }); s.foc = k.lab(K, '◀ 注意力在这里', 1.0, 0.75, 0.2, '#ffffff', 0.11); }
  A.model('maslow_needs', '马斯洛 · 需要层次', '吃饱穿暖以后，这些需要就不再占着我们的心思；对创造和求知的渴望，却越满足越旺。为什么？', [
    { name: '逐层浮现', hint: '四根滑杆从下往上：生理、安全、归属、尊重。先让下面两层很缺，再一层层填满。', sl: [['生理', 0.1, C.RED], ['安全', 0.1, C.AM], ['归属', 0.1, C.GOLD], ['尊重', 0.1, C.GR]],
      scene: pyramid, tick: function (K, s, dt, t, v) { var f = 4, i; for (i = 0; i < 4; i++) if (v[i] < 0.6) { f = i; break; } s.L.forEach(function (m, i) { A.op(m, i < 4 ? 0.25 + v[i] : (f === 4 ? 1.4 : 0.2)); }); s.foc.position.y = FY + 0.75 + f * 0.37; s.f = f; if (f === 0 && s.t > 1.5) s.low = 1; },
      rules: [function (v, c, s) { return s.low; }, function (v, c, s) { return s.f >= 3; }], msg: function (v, c, s) { return s.f === 4 ? '下面四层都大体满足了：最上面那一层自己浮了出来' : s.f >= 2 ? '底下的不再占着心思，更高的需要成了主要的动力' : '饿着、怕着的时候：整个人只想这一件事'; } },
    { name: '匮乏与成长', hint: '点「解锁自我实现」；拖动滑杆让它得到更多满足，看渴望是减少还是增加；再点「真实的人」。', sl: [['自我实现得到的满足', 0.1, C.PU]], bt: ['🔓 解锁自我实现', '👤 真实的人'],
      scene: function (K, s) { s.g = A.gauges(K, ['匮乏性需要的渴望（越满足越小）', '成长性需要的渴望'], [C.AM, C.PU], -0.9, 0.5, -0.3); },
      tick: function (K, s, dt, t, v) { s.g[0].set(0.15); s.g[1].set(s.b[0] ? 0.3 + v[0] * 0.7 : 0.05); },
      rules: [function (v, c, s) { return s.b[0] && v[0] > 0.6; }, function (v, c, s) { return s.b[1] > 0; }], msg: function (v, c, s) { return s.b[1] ? '不是严格的台阶：一个普通人也许生理满足了 85%、安全 70%、归属 50%、尊重 40%、自我实现 10%，同时都在起作用' : s.b[0] && v[0] > 0.6 ? '越做越想做：成为自己所能成为的一切' : ''; } }
  ]);

  /* ── 费斯廷格 · 认知失调 ── */
  A.model('festinger_dissonance', '费斯廷格 · 认知失调', '做完一件极无聊的事，再去告诉别人“它很有趣”。为什么只拿 1 美元的人，事后反而比拿 20 美元的人更真心觉得它有趣？', [
    { name: '两个认知相撞', hint: '点「让两个想法相撞」。然后用按钮选一种消除不舒服的办法。', ch: ['（先不处理）', '改行为：戒掉', '改想法：“没那么有害”'], bt: ['💥 让两个想法相撞'],
      scene: function (K, s) { s.a = k.ball(K, '“熬夜伤身”', C.CY, 0.2, -1.2, 1.4, 0); s.bb = k.ball(K, '“我天天熬夜”', C.AM, 0.2, 0.6, 1.4, 0); s.g = A.gauges(K, ['失调的张力'], [C.RED], -2.0, -2.0, 0.3, 1.3); s.x = 0; },
      tick: function (K, s, dt, t, v, ch) { if (s.b[0]) s.x = Math.min(1, s.x + dt * 2); s.a.position.x = -1.2 + s.x * 0.65; s.bb.position.x = 0.6 - s.x * 0.65; var ten = s.b[0] ? (ch === 0 ? 0.95 : ch === 1 ? 0.6 : 0.15) : 0.1; s.g[0].set(ten); if (ch === 2) K.text(s.a.userData.lab, '“也没那么伤身吧”'); else K.text(s.a.userData.lab, '“熬夜伤身”'); },
      rules: [function (v, c, s) { return s.x >= 1; }, function (v, ch, s) { return s.b[0] && ch === 2; }], msg: function (v, ch, s) { return !s.b[0] ? '' : ch === 2 ? '行为难改，就改了想法：张力一下子降了下来' : ch === 1 ? '戒掉很难：张力还剩不少' : '两个想法顶在一起：很不舒服'; } },
    { name: '一美元与二十美元', hint: '拖动报酬的滑杆：先放在 20 美元，再降到 1 美元。看他事后觉得这件事“有多有趣”。', sl: [['说违心话的报酬（1–20 美元）', 1.0, C.GOLD]],
      scene: function (K, s) { s.g = A.gauges(K, ['外部理由', '失调', '“其实挺有趣”'], [C.GOLD, C.RED, C.GR], -1.3, 0.5, -0.3); },
      tick: function (K, s, dt, t, v) { s.g[0].set(v[0]); s.g[1].set(1 - v[0]); s.g[2].set(0.15 + (1 - v[0]) * 0.75); if (v[0] > 0.9) s.hi = 1; },
      rules: [function (v, c, s) { return s.hi && s.t > 1.5; }, function (v, c, s) { return s.hi && v[0] < 0.1; }], msg: function (v) { return v[0] < 0.1 ? '“我不是为一块钱撒谎的人” —— 所以，“那件事其实挺好玩的”' : v[0] > 0.9 ? '“我是为了二十块才那么说的”：理由充足，态度不用变' : ''; } }
  ]);
})();
