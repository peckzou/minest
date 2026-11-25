/* Minest · 全息模型 · 第七街区 D — 罗尔斯无知之幕 / 诺齐克权利理论 / 福柯权力与规训 / 哈贝马斯交往理性, plus
   黑格尔 · 主奴辩证法 (its own model, listed with Hegel). Same stages, steps and quotations as the 2D models. */
(function () {
  'use strict';
  var HL = window.HL, T = window.THREE, k = HL && HL.simKit; if (!HL || !T || !k || !HL.simQ) return;
  var V = k.V, P = k.P, C = k.C, FY = k.FY, clamp = k.clamp, lerp = k.lerp, TAU = k.TAU, Q = HL.simQ;
  function def(key, title, core, stages, extra) { stages.forEach(function (s, i) { s.quotes = Q[extra && extra.q || key][i]; }); HL.sims.define(key, Object.assign({ lift: -0.35, zoom: 1.1, title: title, source: '——', flat: true, core: core, stages: stages }, extra || {})); }

  /* ═════════════ 罗尔斯 · 无知之幕 ═════════════ */
  // five income classes under a rule r (0 = equal, 1 = winner-takes-all); incentives grow the pie up to a point
  function incomes(r, peak) { peak = peak == null ? 0.45 : peak; var pie = 1 + 1.2 * r - 1.3 * r * r * (0.45 / peak), out = [], i; for (i = 0; i < 5; i++) { var sh = 0.2 + (i - 2) * 0.18 * r; out.push(Math.max(0.02, sh * pie * 5 * 0.2)); } return out; }
  function bars(K) { var s = K.st; s.B = [0, 1, 2, 3, 4].map(function (i) { var m = K.mesh(new T.BoxGeometry(0.3, 1, 0.3), K.holo([C.RED, C.AM, C.GOLD, C.GR, C.CY][i], { core: 0.5 })); m.userData.x = -1.4 + i * 0.6; return m; }); k.lab(K, '最底层', -1.4, 0.0, 0.4, '#ff7a7a', 0.1); k.lab(K, '最上层', 1.0, 0.0, 0.4, '#6fe3ff', 0.1); }
  function setBars(K, inc) { K.st.B.forEach(function (m, i) { var h = inc[i] * 3.2; m.scale.y = Math.max(0.02, h); m.position.set(m.userData.x, FY + 0.12 + h / 2, 0); }); }
  var W1 = k.sliders({ name: '幕后立规', hint: '幕布遮住了“你会是谁”。拖动滑杆定下分配规则，然后按住画面（或空格）揭开幕布。',
    init: function (K) { var s = K.st; bars(K); s.r = K.slider('规则：越往右越不平等', -1.0, FY + 2.4, 0.5, C.GOLD, 0.6); s.veil = K.flat(3.4, 1.9, K.solid(0x1a2740, 0.85)); s.veil.position.copy(P(-0.2, 1.15, 0.45)); s.o = 0; s.me = k.lab(K, '', 0, 0, 0.5, '#ffffff', 0.14); s.msg = k.msg(K, 2.85); K.hit(0); },
    update: function (K, dt) { var s = K.st, inc = incomes(s.r.v); setBars(K, inc); if (K.pressed) { if (s.o === 0) s.slot = Math.floor(Math.random() * 5); s.o = Math.min(1, s.o + dt * 0.6); } s.veil.material.opacity = 0.85 * (1 - s.o); s.veil.position.y = FY + 1.15 + s.o * 1.6; if (s.o >= 1) { K.hit(2); K.text(s.me, '▲ 你在这里'); s.me.position.copy(P(-1.4 + s.slot * 0.6, 0.0, 0.7)); K.text(s.msg, '幕布揭开：你落在第 ' + (s.slot + 1) + ' 层，收入 ' + (inc[s.slot] * 100).toFixed(0)); } K.info('在幕后，没有人能为自己量身定做规则'); },
    dragMove: function (K, h, x) { K.slMove(h, x); K.hit(1); } });
  var W2 = { name: '抽签过一生', hint: '规则已经定下。按住画面（或空格）连续抽签，一生接一生，看你一次次落到哪一层 —— 尤其是最坏的那一次。',
    init: function (K) { var s = K.st; bars(K); setBars(K, incomes(0.8)); s.n = 0; s.t = 0; s.worst = 9; s.me = k.lab(K, '▼', 0, 2.3, 0, '#ffffff', 0.2); s.cnt = [0, 0, 0, 0, 0]; s.msg = k.msg(K, 2.8); },
    update: function (K, dt) { var s = K.st; if (K.pressed) { s.t += dt; if (s.t > 0.25) { s.t = 0; var i = Math.floor(Math.random() * 5); s.cnt[i]++; s.n++; s.worst = Math.min(s.worst, i); s.me.position.copy(P(-1.4 + i * 0.6, 2.3, 0)); K.hit(0); } } if (s.n >= 12 && s.worst === 0) K.hit(1); K.text(s.msg, s.n ? '已过 ' + s.n + ' 生 · 落到最底层 ' + s.cnt[0] + ' 次' + (s.worst === 0 ? '：那一生几乎一无所有。你只有一生可过' : '') : ''); K.info('这是一条很不平等的规则'); } };
  var W3 = k.sliders({ name: '最大最小与平均', hint: '拖动规则点：一条曲线是平均收入，一条是最底层的收入。分别找到两条线的最高点。',
    init: function (K) { var s = K.st, a = [], b = [], r; for (r = 0; r <= 1.001; r += 0.05) { var inc = incomes(r); a.push(P(-1.6 + r * 2.6, 0.5 + inc.reduce(function (x, y) { return x + y; }, 0) / 5 * 4, 0)); b.push(P(-1.6 + r * 2.6, 0.5 + inc[0] * 4, 0)); } K.line(a, K.lineMat(C.CY, 0.9)); K.line(b, K.lineMat(C.RED, 0.9)); k.lab(K, '平均收入', 1.3, 1.6, 0, '#6fe3ff'); k.lab(K, '最底层的收入', 1.3, 0.6, 0, '#ff7a7a'); s.r = K.slider('规则', -1.6, FY + 0.25, 0.9, C.GOLD, 0.3); s.pt = K.sphere(0.07, K.glow(C.WH, 1)); s.msg = k.msg(K, 2.6); },
    update: function (K) { var s = K.st, r = s.r.v, inc = incomes(r); s.pt.position.copy(P(-1.6 + r * 2.6, 0.5 + inc[0] * 4, 0.05)); if (Math.abs(r - 0.42) < 0.07 && s.sawAvg) K.hit(0); if (Math.abs(r - 0.42) < 0.07) s.sawAvg = true; if (r < 0.3 && r > 0.12) { K.hit(1); K.text(s.msg, '最大最小：让最坏的处境尽可能好 —— 幕后的人会选这里'); } else K.text(s.msg, Math.abs(r - 0.42) < 0.07 ? '平均收入的峰值：功利主义者会选这里' : ''); if (r > 0.9 || r < 0.05) K.hit(2); K.info('最大最小规则只在这种“只有一次、输不起”的选择里才合理'); } });
  var W4 = k.sliders({ name: '差别原则', hint: '拖动“激励强度”：一开始，不平等让蛋糕变大，最底层也跟着上升。继续推，盯住最左边那根红柱子；再把滑杆推回它最高的地方。',
    init: function (K) { var s = K.st; bars(K); s.r = K.slider('激励强度（不平等）', -1.0, FY + 2.4, 0.02, C.GOLD, 0.6); s.max = 0; s.msg = k.msg(K, 2.85); },
    update: function (K) { var s = K.st, r = s.r.v, inc = incomes(r), best = 0.2; setBars(K, inc); if (r > 0.1 && r < 0.3) K.hit(0); s.max = Math.max(s.max, r); if (r > 0.5) { K.hit(1); s.B[0].material.uniforms.uColor.value.setHex(0xff2020); } else s.B[0].material.uniforms.uColor.value.setHex(C.RED); if (s.max > 0.5 && Math.abs(r - best) < 0.08) K.hit(2);
      K.text(s.msg, r > 0.5 ? '越过了峰值：上层还在多得，最底层却在下降 —— 这种不平等不被允许' : s.max > 0.5 && Math.abs(r - best) < 0.08 ? '停在这里：放弃那些不能让最不利者受益的收益' : ''); K.info('最底层收入 ' + (inc[0] * 100).toFixed(0)); } });
  var W5 = k.sliders({ name: '应用练习', hint: '一个新社会，产出曲线不同。假设由你的“仇人”来决定你落在哪一层。拖动滑杆找到正义点，并守住它一会儿。',
    init: function (K) { var s = K.st; bars(K); s.r = K.slider('规则', -1.0, FY + 2.4, 0.9, C.GOLD, 0.6); s.me = k.lab(K, '▲ 仇人把你放在这里', -1.4, 0.0, 0.7, '#ffffff', 0.11); s.h = 0; s.msg = k.msg(K, 2.85); K.hit(0); },
    update: function (K, dt) { var s = K.st, r = s.r.v, inc = incomes(r, 0.7), bi = 0, bv = -1, q; for (q = 0; q <= 1; q += 0.02) { var v = incomes(q, 0.7)[0]; if (v > bv) { bv = v; bi = q; } } setBars(K, inc); if (Math.abs(r - bi) < 0.1) { s.h += dt; if (s.h > 1.5) { K.hit(1); K.text(s.msg, '守住了：这里是最底层所能达到的最高点'); } } else s.h = 0; K.info('最底层收入 ' + (inc[0] * 100).toFixed(0) + '（最高可达 ' + (bv * 100).toFixed(0) + '）'); } });
  def('rawls', '罗尔斯 · 无知之幕', '如果你不知道自己会出生在哪个家庭、有什么天赋，你会希望社会按什么规则分配？', [W1, W2, W3, W4, W5]);

  /* ═════════════ 诺齐克 · 权利与分配 ═════════════ */
  var N1 = { name: '持有正义三原则', hint: '一件财产是怎么到他手里的？用按钮切换三条历史：清白的链条、中间有掠夺、启动矫正。',
    init: function (K) { var s = K.st; s.ch = 0; s.seen = { ch0: 1 }; s.nd = ['最初获取', '自愿交换', '自愿赠与', '现在的持有'].map(function (n, i) { return k.ball(K, n, C.GR, 0.13, -1.7 + i * 1.0, 1.4, 0); }); s.ln = [0, 1, 2].map(function (i) { return K.line([P(-1.7 + i * 1.0, 1.4, 0), P(-0.7 + i * 1.0, 1.4, 0)], K.lineMat(C.GR, 0.9)); }); s.msg = k.msg(K, 2.4); },
    update: function (K) { var s = K.st, bad = s.ch === 1; s.ln[1].material.color.setHex(bad ? C.RED : s.ch === 2 ? C.GOLD : C.GR); s.nd[2].material.uniforms.uColor.value.setHex(bad ? C.RED : C.GR); s.nd[3].material.uniforms.uColor.value.setHex(bad ? C.RED : C.GR); K.text(s.nd[1].userData.lab, bad ? '暴力掠夺 / 欺诈' : '自愿交换'); if (s.ch === 0) K.hit(0); if (s.seen.ch1 && s.ch === 2) K.hit(1);
      K.text(s.msg, bad ? '链条里有一环不正当：后面的持有全都不正义 —— 不管现在的分布看起来多“合理”' : s.ch === 2 ? '矫正原则：追溯并纠正过去的不正义' : '每一步都正当：那么结果就是正义的，无论它多不平等'); K.info('分配是否正义，要看它是怎么来的（历史原则），而不看它现在长什么样'); },
    chips: function (K, box) { k.choice(K, box, ['正当获取 → 自愿交换 → 自愿赠与', '中间有暴力掠夺或欺诈', '启动矫正原则'], 'ch'); } };
  var N2 = k.sliders({ name: '张伯伦论证', hint: '从你心目中最平等的分配 D₁ 出发。拖动滑杆：让越来越多的球迷自愿多付 25 美分看张伯伦打球。再点「强行恢复 D₁」。',
    init: function (K) { var s = K.st; s.f = K.slider('自愿买票的球迷', -0.9, FY + 0.3, 0, C.GOLD, 0.8); s.c = k.crowd(K, 60, 0.13); s.w = K.mesh(new T.BoxGeometry(0.3, 1, 0.3), K.holo(C.GOLD, { core: 0.6 })); k.lab(K, '张伯伦', 1.2, 0.5, 0.3, '#ffd96b'); s.msg = k.msg(K, 2.7); },
    update: function (K, dt) { var s = K.st, f = s.f.v; s.c.P.forEach(function (p, i) { var paid = i < f * 60; s.c.d.set(i, -0.9 + p.x * 1.0, FY + 1.3 + p.z * 0.7, 0); s.c.d.rgb(i, paid ? 1 : 0.5, paid ? 0.85 : 0.8, paid ? 0.4 : 1); }); s.c.d.flush(); s.w.scale.y = 0.05 + f * 1.6; s.w.position.copy(P(1.2, 0.7 + (0.05 + f * 1.6) / 2, 0)); if (f >= 0.97) K.hit(0);
      K.text(s.msg, s.rs ? '要维持 D₁ 这个“模式”，就得不断禁止或撤销成年人之间自愿的交易' : f >= 0.97 ? '100 万人各付 25 美分：张伯伦多了 25 万。D₂ 很不平等 —— 可每一步都是自愿的，它哪里不正义？' : ''); K.info('张伯伦的额外收入：' + Math.round(f * 25) + ' 万美元'); },
    chips: function (K, box) { var s = K.st; HL.ui.chip(box, '↩ 强行恢复 D₁ 平等模式', false, function () { s.rs = true; s.f.v = 0; s.f.upd(); K.hit(1); }); } });
  var N3 = { name: '自我所有权与国家', hint: '用按钮切换国家的两种范围：只当“守夜人”，或者对劳动所得征税用于再分配。',
    init: function (K) { var s = K.st; s.ch = 0; s.seen = { ch0: 1 }; s.me = K.person(C.AM, 1.6); s.me.position.copy(P(-0.9, 0.6, 0)); s.cl = K.mesh(new T.TorusGeometry(0.5, 0.02, 8, 60), K.glow(C.WH, 0.9)); s.cl.position.copy(P(-0.9, 1.6, 0)); s.sl = K.mesh(new T.CircleGeometry(0.5, 40, -Math.PI / 2, 0.001), K.glow(C.RED, 0.6)); s.sl.position.copy(P(-0.9, 1.6, 0.01)); k.lab(K, '他一周的劳动时间', -0.9, 2.3, 0); s.st = k.box(K, 0.7, 0.7, 0.4, C.CY, 1.0, 1.2, 0); s.stl = k.lab(K, '', 1.0, 1.8, 0); s.msg = k.msg(K, 2.75); },
    update: function (K) { var s = K.st, tax = s.ch === 1; s.sl.geometry.dispose(); s.sl.geometry = new T.CircleGeometry(0.5, 40, Math.PI / 2, tax ? -TAU * 0.3 : -0.001); K.text(s.stl, tax ? '再分配的国家' : '最小国家：只防暴力、偷窃、欺诈'); s.st.scale.setScalar(tax ? 1.5 : 1); if (s.ch === 0) K.hit(0); if (tax) K.hit(1);
      K.text(s.msg, tax ? '诺齐克的类比：拿走 n 小时劳动的收入，就像强迫他为别人工作 n 小时' : '守夜人国家保护权利，而不侵犯“人拥有自己”'); K.info('红色扇形 = 为缴税而工作的时间'); },
    chips: function (K, box) { k.choice(K, box, ['最小国家（守夜人）', '扩张国家：对劳动所得征税'], 'ch'); } };
  def('nozick_entitlement', '诺齐克 · 权利与分配', '如果大家从一个你认为最公平的分配出发，经过无数次完全自愿的交换变得不平等了，这个结果不正义吗？', [N1, N2, N3], { bound: '批评者指出：最初的获取很难说都是正当的；张伯伦的例子也忽略了财富积累对后来者机会的影响。本模型陈列在罗尔斯馆，作为对照。' });

  /* ═════════════ 福柯 · 权力与规训 ═════════════ */
  function panop(K, n) { var s = K.st, i; s.c = P(-0.2, 1.3, 0); s.tw = K.mesh(new T.CylinderGeometry(0.16, 0.2, 0.9, 16), K.holo(C.GOLD, { core: 0.6 })); s.tw.position.copy(s.c); s.tw.rotation.x = Math.PI / 2; s.cells = []; for (i = 0; i < n; i++) { var a = i / n * TAU, m = K.sphere(0.08, K.holo(C.CY, { core: 0.9 })); m.position.set(s.c.x + Math.cos(a) * 1.15, s.c.y + Math.sin(a) * 0.9, 0); m.userData.a = a; m.userData.o = 1; s.cells.push(m); }
    K.mesh(new T.TorusGeometry(1.0, 0.012, 6, 80), K.glow(C.GREY, 0.6)).position.copy(s.c); s.gz = K.line([V(0, 0, 0), V(0, 0, 0)], K.lineMat(C.GOLD, 0.9)); s.ga = 0; }
  function gaze(K) { var s = K.st; K.setLine(s.gz, [s.c, V(s.c.x + Math.cos(s.ga) * 1.15, s.c.y + Math.sin(s.ga) * 0.9, 0)]); }
  function gazeDrag(K, h, x, y) { var s = K.st, p = h.d && h.d.to(x, y); if (p) s.ga = Math.atan2((p.y - s.c.y) / 0.9, (p.x - s.c.x) / 1.15); }
  var U1 = { name: '圆形监狱', hint: '拖动金色的目光扫过一间间囚室；点「放下百叶窗」；再把一个囚犯拖向他的邻居。',
    init: function (K) { var s = K.st; panop(K, 14); s.sw = 0; s.bl = false; s.msg = k.msg(K, 2.6); },
    update: function (K) { var s = K.st; gaze(K); s.gz.material.opacity = s.bl ? 0.15 : 0.9; s.tw.material.uniforms.uColor.value.setHex(s.bl ? 0x333333 : C.GOLD); if (s.sw > 3) K.hit(0); K.info('每个人都被看见，却看不见看他的人；他是信息的对象，从不是交流的主体'); },
    pick: function (K, x, y) { var s = K.st, m = K.near(s.cells, x, y, 34); if (m) return { drag: true, m: m }; return { drag: true, gz: true }; },
    dragStart: function (K, h, x, y) { h.d = K.facing(h.m ? h.m.position : K.st.c, x, y); h.a = K.st.ga; },
    dragMove: function (K, h, x, y) { var s = K.st; if (h.gz) { gazeDrag(K, h, x, y); s.sw += Math.abs(s.ga - h.a); h.a = s.ga; } },
    dragEnd: function (K, h) { var s = K.st; if (h.m) { K.hit(3); K.text(s.msg, '隔墙挡住了：他看得见塔，看不见左右的同伴'); } },
    chips: function (K, box) { var s = K.st; HL.ui.chip(box, s.bl ? '拉起百叶窗' : '放下百叶窗', s.bl, function () { s.bl = !s.bl; K.hit(1); if (s.bl) { K.hit(2); K.text(s.msg, '现在囚犯看不出塔里有没有人在看：看见，而不被看见'); } HL.refreshTools(); }); } };
  var U2 = { name: '空塔', hint: '点「看守离开」让塔空着，看囚犯怎么做；等一会儿。有囚犯试探着犯小错时，把目光拖过去抓住他。',
    init: function (K) { var s = K.st; panop(K, 14); s.empty = false; s.t = 0; s.tr = -1; s.caught = 0; s.msg = k.msg(K, 2.6); },
    update: function (K, dt, t) { var s = K.st; gaze(K); s.tw.material.uniforms.uOp.value = s.empty ? 0.15 : 1; if (s.empty) { s.t += dt; if (s.t > 2) { K.hit(1); K.hit(2); } if (s.t > 9) K.hit(4); if (s.tr < 0 && s.t > 3 && Math.floor(s.t) % 3 === 0) s.tr = Math.floor(Math.random() * 14); }
      s.cells.forEach(function (m, i) { var on = i === s.tr; m.material.uniforms.uColor.value.setHex(on ? C.RED : C.CY); m.scale.setScalar(on ? 1.4 + 0.2 * Math.sin(t * 10) : 1); if (on && Math.abs(((s.ga - m.userData.a + Math.PI * 3) % TAU) - Math.PI) < 0.3) { s.tr = -1; s.caught++; K.hit(3); } });
      K.text(s.msg, s.t > 9 ? '塔空了这么久，秩序还在：权力看起来无所不在' : s.empty && s.t > 2 ? '塔里没人，他们照样守规矩：靠的是“可能被看”，不是锁链' : ''); K.info(s.empty ? '塔已空 ' + Math.floor(s.t) + ' 秒 · 抓住试探者 ' + s.caught + ' 次' : '看守在塔里'); },
    pick: function () { return { drag: true, gz: true }; }, dragStart: function (K, h, x, y) { h.d = K.facing(K.st.c, x, y); }, dragMove: gazeDrag,
    chips: function (K, box) { var s = K.st; HL.ui.chip(box, s.empty ? '看守回来' : '看守离开', s.empty, function () { s.empty = !s.empty; s.t = 0; K.hit(0); HL.refreshTools(); }); } };
  var U3 = { name: '规范化判断', hint: '一排人，高低不齐。上下拖动“常态线”；点「上刑台」公开惩罚一个人，再按住画面（或空格）矫正所有人；点「考试」给每人建一份档案。',
    init: function (K) { var s = K.st, i; s.y = 1.2; s.fix = 0; s.used = {}; s.files = 0; s.ppl = []; for (i = 0; i < 9; i++) { var m = K.sphere(0.09, K.holo(C.CY, { core: 0.9 })); m.userData = { x: -1.6 + i * 0.36, y: 0.7 + ((i * 37) % 10) / 10 * 1.1 }; s.ppl.push(m); } s.ln = K.line([P(-1.9, 1.2, 0), P(1.5, 1.2, 0)], K.lineMat(C.GOLD, 0.9, true)); s.h = K.sphere(0.07, K.glow(C.WH, 1)); s.cab = k.lab(K, '', 0, 2.5, 0, '#ffd96b'); s.msg = k.msg(K, 2.8); },
    update: function (K, dt) { var s = K.st; if (K.pressed) { s.fix = Math.min(1, s.fix + dt * 0.4); if (s.fix > 0.6) { s.used.fix = 1; if (s.used.scaf) K.hit(1); } } else s.fix = Math.max(0, s.fix - dt * 0.1); s.ppl.forEach(function (m) { var u = m.userData, y = lerp(u.y, s.y, s.fix); m.position.copy(P(u.x, y, 0)); m.material.uniforms.uColor.value.setHex(Math.abs(y - s.y) > 0.25 ? C.RED : C.GR); }); K.setLine(s.ln, [P(-1.9, s.y, 0), P(1.5, s.y, 0)]); s.h.position.copy(P(-1.9, s.y, 0.1));
      K.text(s.cab, s.files ? '档案柜：' + s.files + ' 份个人档案' : ''); if (s.files >= 18) K.hit(3); if (s.used.line && s.used.fix && s.used.exam) K.hit(4); K.info('层级监视、规范化裁决、检查：规训的三种技术'); },
    pick: function (K, x, y) { return K.px(K.st.h.position, x, y) < 70 ? { drag: true } : null; }, dragStart: function (K, h, x, y) { h.y = y; }, dragMove: function (K, h, x, y) { var s = K.st; s.y = clamp(s.y - (y - h.y) / 160, 0.6, 1.9); h.y = y; s.used.line = 1; K.hit(0); },
    chips: function (K, box) { var s = K.st; HL.ui.chip(box, '把一个人拖上刑台', false, function () { s.used.scaf = 1; K.text(s.msg, '旧的惩罚：公开、短暂、落在一个人的身体上'); }); HL.ui.chip(box, '📋 考试', false, function () { s.files += 9; s.used.exam = 1; K.hit(2); K.text(s.msg, '考试把每个人变成一个“个案”：可描述、可比较、可矫正'); }); } };
  var U4 = k.drags({ name: '应用练习', hint: '一所新学校的教室。把“监视点”拖到能看见最多座位的地方（教室后方正中），点「放下百叶窗」；再把门外的“访客”拖进监视点。',
    init: function (K) { var s = K.st, i; s.seats = []; for (i = 0; i < 20; i++) { var m = K.sphere(0.07, K.holo(C.CY, { core: 0.9 })); m.position.copy(P(-1.4 + (i % 5) * 0.55, 0.8 + Math.floor(i / 5) * 0.4, 0)); s.seats.push(m); } k.box(K, 0.05, 1.3, 0.2, C.GREY, -0.3, 1.4, 0.05); s.items = [k.ball(K, '监视点', C.GOLD, 0.12, -1.8, 0.3, 0.5), k.ball(K, '访客', C.PU, 0.11, 1.2, 0.3, 0.5)]; s.cov = 0; s.t = 0; s.msg = k.msg(K, 2.8); K.hit(0); },
    update: function (K, dt) { var s = K.st, p = s.items[0].position, n = 0; s.seats.forEach(function (m) { var blocked = (p.x + 0.3) * (m.position.x + 0.3) < 0 && p.y < FY + 2.0, seen = !blocked && p.y > FY + 0.4; if (seen) n++; m.material.uniforms.uColor.value.setHex(seen ? C.GR : C.GREY); m.position.z = seen && s.t > 2 ? 0.08 : 0; }); s.cov = n / 20; if (s.cov >= 0.9) { K.hit(1); s.t += dt; if (s.t > 2.5) K.hit(3); } else s.t = 0; K.info('覆盖 ' + Math.round(s.cov * 100) + '% 的座位'); },
    drop: function (K, m) { var s = K.st; if (m.userData.n === '访客') { if (K.closePx(m.position, s.items[0].position, 90)) { K.hit(2); K.text(s.msg, '任何人都可以进来看看守怎么看：监视者自己也在被监视'); } return; } m.userData.home.copy(m.position); return true; } });
  def('foucault', '福柯 · 权力与规训', '现代社会不再当众行刑了。权力是变温和了，还是换了一种更省力的办法？', [U1, U2, U3, U4]);

  /* ═════════════ 哈贝马斯 · 交往理性 ═════════════ */
  var CL = ['真实', '正当', '真诚'];
  var H1 = k.drags({ name: '三种有效性要求', hint: '把那句话拖给听者：三个刻度同时亮起。用按钮对其中一项提出质疑，再把对应的理由卡拖过去回应，直到三项都被接受。',
    init: function (K) { var s = K.st; s.said = false; s.q = -1; s.ok = [0, 0, 0]; s.a = K.person(C.AM, 1.5); s.a.position.copy(P(-1.5, 0.6, 0)); s.b = K.person(C.CY, 1.5); s.b.position.copy(P(0.9, 0.6, 0)); s.g = CL.map(function (n, i) { return k.gauge(K, 0.4 + i * 0.4, -0.5, [C.GOLD, C.GR, C.PU][i], n, 0.9); });
      s.items = [k.card(K, '“请把窗户关上，外面在施工”', 0xffc46a, 1.6, -1.2, 1.7, 0.4)].concat(['理由：你听，电钻声', '理由：这是我们共用的办公室', '理由：我确实被吵得没法工作'].map(function (n, i) { var m = k.card(K, n, [C.GOLD, C.GR, C.PU][i], 1.4, -1.0, 0.1 + i * 0.26, 0.7); m.userData.i = i; return m; })); s.msg = k.msg(K, 2.95); },
    update: function (K) { var s = K.st; s.g.forEach(function (g, i) { g.set(!s.said ? 0 : s.ok[i] ? 1 : s.q === i ? 0.25 : 0.7); }); if (s.said && s.ok[0] && s.ok[1] && s.ok[2]) K.hit(3); K.info('认真说一句话，就同时主张了：它是真的、它是正当的、我是真诚的'); },
    drop: function (K, m) { var s = K.st; if (!K.closePx(m.position, P(0.9, 1.0, 0), 150)) return; if (m.userData.i == null) { s.said = true; K.hit(0); K.hit(1); return; } if (s.q === m.userData.i) { s.ok[s.q] = 1; s.q = -1; K.text(s.msg, '理由被接受了'); m.userData.done = true; m.visible = false; return true; } K.text(s.msg, '这条理由回应的不是他质疑的那一项'); },
    chips: function (K, box) { var s = K.st; CL.forEach(function (n, i) { HL.ui.chip(box, '质疑：' + n, s.q === i, function () { if (!s.said) return; s.q = i; s.ok[i] = 0; K.hit(2); K.text(s.msg, ['“外面真的在施工吗？”', '“你凭什么要求我？”', '“你是真嫌吵，还是找借口？”'][i]); HL.refreshTools(); }); }); } });
  var H2 = { name: '力量与理由', hint: '按住画面（或空格）用“推力”压对方让步，再松手看看。然后点「送去一条理由」，一条条送。',
    init: function (K) { var s = K.st; s.f = 0; s.ag = 0; s.r = 0; s.was = false; s.a = K.person(C.AM, 1.5); s.a.position.copy(P(-1.3, 0.6, 0)); s.b = K.person(C.CY, 1.5); s.g = k.gauge(K, 1.2, -0.4, C.GR, '一致', 1.4); s.msg = k.msg(K, 2.6); },
    update: function (K, dt) { var s = K.st; if (K.pressed) { s.f = Math.min(1, s.f + dt * 0.7); s.was = true; if (s.f > 0.7) K.hit(0); } else { if (s.was && s.f > 0.5) K.hit(1); s.f = Math.max(0, s.f - dt * 2); if (s.f <= 0) s.was = false; } s.b.position.copy(P(0.3 + s.f * 0.6, 0.6, 0)); s.b.rotation.z = -s.f * 0.3; s.g.set(Math.max(s.f * 0.9, s.r / 4)); s.g.col(s.f > 0.1 ? C.RED : C.GR);
      K.text(s.msg, s.r >= 4 ? '唯一起作用的，是更好的论证那种不带强制的力量' : s.f > 0.7 ? '他“同意”了 —— 被压着同意的' : s.was ? '' : s.r ? '一致在一点点长出来，而且松手也不会消失' : ''); K.info('策略行动只求达到目的；交往行动求的是相互理解'); },
    chips: function (K, box) { var s = K.st; HL.ui.chip(box, '💬 送去一条理由', false, function () { s.r = Math.min(4, s.r + 1); K.hit(2); if (s.r >= 4) K.hit(3); }); } };
  var H3 = k.drags({ name: '商谈的规则', hint: '把场外的两个人拖进圆桌；把压在发言者身上的“强制”拖开；再用按钮让人提出质疑和新主张。',
    init: function (K) { var s = K.st, i; s.c = P(-0.2, 1.3, 0); K.mesh(new T.TorusGeometry(0.8, 0.03, 8, 60), K.holo(C.GOLD, { core: 0.5 })).position.copy(s.c); s.in = 4; for (i = 0; i < 4; i++) { var a = i / 6 * TAU, m = K.sphere(0.1, K.holo(C.CY, { core: 0.9 })); m.position.set(s.c.x + Math.cos(a) * 0.8, s.c.y + Math.sin(a) * 0.65, 0); }
      s.items = [k.ball(K, '场外的人', C.GREY, 0.1, -1.9, 0.4, 0.5), k.ball(K, '场外的人', C.GREY, 0.1, -1.5, 0.3, 0.5), k.ball(K, '强制', C.RED, 0.16, 0.6, 1.3, 0.2)]; s.free = false; s.q = 0; s.cl = 0; s.msg = k.msg(K, 2.7); },
    update: function (K) { var s = K.st; if (s.in >= 6 && s.free && s.q && s.cl) { K.hit(4); K.text(s.msg, '所有受影响的人都在场、都能说话、没有强制：只有这样达成的同意，才使规范有效'); } K.info('圆桌旁 ' + s.in + ' / 6 人' + (s.free ? ' · 无强制' : ' · 有人被压着')); },
    drop: function (K, m) { var s = K.st; if (m.userData.n === '强制') { if (m.position.distanceTo(P(0.6, 1.3, 0.2)) > 0.6) { s.free = true; m.userData.done = true; m.visible = false; K.hit(3); return true; } return; } if (K.closePx(m.position, s.c, 150)) { var a = s.in / 6 * TAU; m.position.set(s.c.x + Math.cos(a) * 0.8, s.c.y + Math.sin(a) * 0.65, 0); m.material.uniforms.uColor.value.setHex(C.CY); m.userData.done = true; s.in++; K.hit(0); return true; } },
    chips: function (K, box) { var s = K.st; HL.ui.chip(box, '❓ 有人提出质疑', false, function () { s.q = 1; K.hit(1); }); HL.ui.chip(box, '✋ 有人提出新主张', false, function () { s.cl = 1; K.hit(2); }); } });
  var H4 = { name: '应用练习', hint: '宿舍几点熄灯吵起来了。用按钮试两条路：用“钱或权”快速搞定，或者只用理由商量出一条新规。',
    init: function (K) { var s = K.st; s.t = 0; s.r = 0; s.c = k.crowd(K, 6, 0.2); s.g = k.gauge(K, 1.2, -0.4, C.GR, '大家真的同意', 1.4); s.msg = k.msg(K, 2.5); },
    update: function (K, dt, t) { var s = K.st; s.t += dt; if (s.t > 1) K.hit(0); s.c.P.forEach(function (p, i) { s.c.d.set(i, -0.6 + Math.cos(i / 6 * TAU) * 0.8, FY + 1.3 + Math.sin(i / 6 * TAU) * 0.6, 0); var a = s.pw ? 0.5 : 1; s.c.d.rgb(i, 0.5 * a, 0.8 * a, a); }); s.c.d.flush(); s.g.set(s.pw ? 0.1 : s.r / 4); K.info('日常的默契破裂了，才需要停下来商谈'); },
    chips: function (K, box) { var s = K.st; HL.ui.chip(box, '💰 用钱 / 权快速搞定', false, function () { s.pw = true; K.hit(1); K.text(s.msg, '“舍长说了算”“不服的人交罚款”：很快安静了，但没有人被说服'); }); HL.ui.chip(box, '💬 讲一条理由', false, function () { s.pw = false; s.r = Math.min(4, s.r + 1); K.text(s.msg, ['“有人早上六点要去实习”', '“可考试周要复习到很晚”', '“那平时十一点、考试周十二点？”', '“都能接受。”'][s.r - 1]); if (s.r >= 4) K.hit(2); }); } };
  def('habermas', '哈贝马斯 · 交往理性', '人们意见不合时，除了用钱和权压服对方，还有没有一种“只靠讲理”就能达成的一致？它需要什么条件？', [H1, H2, H3, H4]);

  /* ═════════════ 黑格尔 · 主奴辩证法 ═════════════ */
  function two(K) { var s = K.st; s.A = K.person(C.AM, 1.7); s.B = K.person(C.CY, 1.7); s.A.position.copy(P(-1.0, 0.5, 0)); s.B.position.copy(P(0.7, 0.5, 0)); }
  var M1 = k.drags({ name: '承认的需要', hint: '一个自我意识独自站着，头上的“我是自由的”怎么也亮不实。把另一个意识拖到它对面。',
    init: function (K) { var s = K.st; s.A = K.person(C.AM, 1.7); s.A.position.copy(P(-1.0, 0.5, 0)); s.l = k.lab(K, '“我是自为的”？', -1.0, 1.6, 0, '#ffa23a', 0.15); s.items = [k.ball(K, '另一个意识', C.CY, 0.14, 1.2, 2.2, 0.3)]; s.t = 0; s.msg = k.msg(K, 2.7); },
    update: function (K, dt, t) { var s = K.st; s.t += dt; if (s.t > 1.5) K.hit(0); s.l.material.opacity = s.met ? 1 : 0.4 + 0.3 * Math.sin(t * 5); K.info('自我意识只有通过另一个自我意识，才得到满足'); },
    drop: function (K, m) { var s = K.st; if (m.position.y < FY + 1.4 && m.position.x > -0.6) { m.userData.done = true; m.position.copy(P(0.7, 1.0, 0)); s.met = true; K.hit(1); K.text(s.msg, '它要对方承认自己 —— 对方要的也是同一件事'); return true; } } });
  var M2 = { name: '生死斗争', hint: '双方都要证明自己不依恋生命。按住画面（或空格）坚持斗下去；或者中途点「让蓝方退让」。两种结局都试试。',
    init: function (K) { var s = K.st; two(K); s.f = 0; s.end = null; s.msg = k.msg(K, 2.6); },
    update: function (K, dt, t) { var s = K.st; if (K.pressed && !s.end) { s.f = Math.min(1, s.f + dt * 0.3); K.hit(0); if (s.f > 0.5) K.hit(1); if (s.f >= 1) { s.end = 'dead'; K.hit(2); } } var sh = s.end ? 0 : Math.sin(t * 20) * 0.04 * s.f; s.A.position.x = -1.0 + s.f * 0.5 + sh; s.B.position.x = 0.7 - s.f * 0.5 - sh;
      if (s.end === 'dead') { s.A.userData.mat.uniforms.uOp.value = 0.1; s.B.userData.mat.uniforms.uOp.value = 0.1; } if (s.end === 'yield') { s.B.scale.setScalar(0.75); s.B.position.y = FY + 0.4; }
      K.text(s.msg, s.end === 'dead' ? '双方都死了：没有人留下来承认谁。承认落空（点「重置本关」再试另一种）' : s.end === 'yield' ? '蓝方宁要生命、不要承认：他成了奴隶，对方成了主人' : ''); K.info('斗争 ' + Math.round(s.f * 100) + '%'); },
    chips: function (K, box) { var s = K.st; HL.ui.chip(box, '🏳 让蓝方退让', false, function () { if (s.end === 'dead') return; s.end = 'yield'; K.hit(0); K.hit(1); K.hit(3); }); } };
  var M3 = { name: '主人的困境', hint: '主人坐享其成。按住画面（或空格）让他享用奴隶做好的东西；再点「看看这份承认从哪来」。',
    init: function (K) { var s = K.st; two(K); s.B.scale.setScalar(0.75); s.th = k.box(K, 0.25, 0.25, 0.25, C.GOLD, -0.15, 0.65, 0.3); s.e = 0; s.cr = k.lab(K, '主人', -1.0, 1.75, 0, '#ffa23a', 0.15); k.lab(K, '奴隶', 0.7, 1.4, 0, '#6fe3ff'); s.msg = k.msg(K, 2.6); },
    update: function (K, dt) { var s = K.st; if (K.pressed) { s.e = Math.min(1, s.e + dt * 0.4); if (s.e > 0.6) K.hit(0); } s.th.position.x = lerp(0.3, -0.7, s.e); if (s.seen) { s.A.userData.mat.uniforms.uOp.value = 0.45; K.text(s.cr, '主人（依赖的）'); } K.info('主人只和物的“已被加工好的一面”打交道'); },
    chips: function (K, box) { var s = K.st; HL.ui.chip(box, '🔍 看看这份承认从哪来', false, function () { s.seen = true; K.hit(1); K.hit(2); K.text(s.msg, '承认他的，是一个他自己不承认的人 —— 这份承认不值钱。独立意识的真理，反而在奴隶那里'); }); } };
  var M4 = k.drags({ name: '恐惧、劳动与自我发现', hint: '奴隶经历过对死亡的恐惧。按住画面（或空格）让他劳动：一块粗坯被一点点塑造成器物；做成后把作品拖到他面前。',
    init: function (K) { var s = K.st; s.B = K.person(C.CY, 1.6); s.B.position.copy(P(-1.0, 0.5, 0)); s.w = 0; s.t = 0; s.raw = K.mesh(new T.DodecahedronGeometry(0.25, 0), K.holo(C.GREY, { core: 0.5 })); s.items = [s.raw]; s.raw.userData = { home: P(0.2, 0.9, 0.2), n: '作品', done: true }; s.raw.position.copy(s.raw.userData.home); s.msg = k.msg(K, 2.5); },
    update: function (K, dt, t) { var s = K.st; s.t += dt; if (s.t > 1.5) K.hit(0); if (K.pressed) { s.w = Math.min(1, s.w + dt * 0.3); if (s.w > 0.3) K.hit(1); } s.raw.rotation.y = t * 0.5; s.raw.scale.set(1 - s.w * 0.3, 1 + s.w * 0.8, 1 - s.w * 0.3); s.raw.material.uniforms.uColor.value.setHex(s.w >= 1 ? C.GOLD : C.GREY); if (s.w >= 1) { K.hit(2); s.raw.userData.done = false; }
      K.info(s.w >= 1 ? '做成了。把它拖到他面前' : '劳动 ' + Math.round(s.w * 100) + '% —— 欲望被克制，物被保留下来'); },
    drop: function (K, m) { var s = K.st; if (K.closePx(m.position, P(-1.0, 1.0, 0), 150)) { K.hit(3); K.text(s.msg, '他在自己造出的东西里，第一次看见了自己：一个独立的、有所作为的意识'); } } });
  def('hegel_master', '黑格尔 · 主奴辩证法', '一个人要确信“我是自由的”，为什么非得另一个人承认不可？这种承认靠压服能得到吗？', [M1, M2, M3, M4]);
})();
