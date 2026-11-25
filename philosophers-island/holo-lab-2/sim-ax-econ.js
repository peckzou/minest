/* Minest · 全息模型 · 附属岛 · 经济学街区 (15 models) — same stages, steps and quotations as the 2D lab models. Uses HL.AX. */
(function () {
  'use strict';
  var HL = window.HL, A = HL && HL.AX; if (!A) return;
  var k = A.k, P = A.P, C = A.C, FY = A.FY, clamp = A.clamp, lerp = A.lerp, TAU = A.TAU, T = window.THREE;
  var G3 = [C.GR, C.CY, C.AM, C.PU];

  /* ── 斯密 · 看不见的手 ── */
  A.model('smith_invisible_hand', '亚当·斯密 · 看不见的手', '为什么每个人只追求自己的利益，却常常比刻意追求公共利益更有效地促进了社会的福利？', [
    { name: '自愿交换', hint: '拖动滑杆让买方的出价和卖方的要价靠拢：一旦出价高过要价，交易就成了，双方都得利。', sl: [['买卖双方协调度', 0.1, C.GOLD]],
      scene: function (K, s) { s.c = A.crowd(K, 24, 0.16); s.g = A.gauges(K, ['社会总剩余'], [C.GR], 1.0, 1.0, -0.3); k.lab(K, '买方', -1.5, 2.3, 0, '#6fe3ff'); k.lab(K, '卖方', 0.3, 2.3, 0, '#ffa23a'); },
      tick: function (K, s, dt, t, v) { s.c.draw(function (i) { var buy = i % 2 === 0, row = Math.floor(i / 2), on = row < v[0] * 12, x = buy ? -1.5 : 0.3; return [on ? lerp(x, -0.6, 0.85) + (buy ? -0.08 : 0.08) : x, 0.7 + row * 0.12, 0, buy ? 0.4 : 1, on ? 1 : 0.7, buy ? 1 : 0.3]; }); s.g[0].set(v[0]); },
      rules: [function (v) { return v[0] > 0.3; }, function (v) { return v[0] > 0.85; }], msg: function (v) { return v[0] > 0.85 ? '没有人下命令，每一笔成交却都让双方更好：总剩余涌现出来' : v[0] > 0.3 ? '屠夫要的是钱，你要的是肉：各为自己，交易达成' : ''; } },
    { name: '市场出清', hint: '拖动价格：太高卖不掉（过剩），太低不够卖（短缺）。把它停在两条线相交的地方。', sl: [['价格', 0.9, C.GOLD]],
      scene: function (K, s) { A.axes(K, null, null, null, null, '数量', '价格'); A.plot(K, function (u) { return 1 - u; }, C.CY); A.plot(K, function (u) { return u; }, C.AM); k.lab(K, '需求', -1.4, 2.3, 0, '#6fe3ff'); k.lab(K, '供给', 0.9, 2.3, 0, '#ffa23a'); s.ln = K.line([P(0, 0, 0), P(0, 0, 0)], K.lineMat(C.WH, 0.9, true)); s.gap = K.line([P(0, 0, 0), P(0, 0, 0)], K.lineMat(C.RED, 1)); },
      tick: function (K, s, dt, t, v) { var p = v[0], y = 0.6 + p * 1.6, xd = lerp(-1.7, 1.0, 1 - p), xs = lerp(-1.7, 1.0, p); K.setLine(s.ln, [P(-1.7, y - FY - 0, 0).setY(FY + y), P(1.0, 0, 0).setY(FY + y)]); K.setLine(s.gap, [P(xd, 0, 0.05).setY(FY + y), P(xs, 0, 0.05).setY(FY + y)]); if (Math.abs(p - 0.5) > 0.25) s.off = 1; },
      rules: [function (v, c, s) { return !!s.off; }, function (v, c, s) { return s.off && Math.abs(v[0] - 0.5) < 0.05; }], msg: function (v) { return Math.abs(v[0] - 0.5) < 0.05 ? '市场出清：想买的都买到了，想卖的都卖掉了' : v[0] > 0.5 ? '红线 = 卖不掉的过剩：卖家会降价' : '红线 = 买不到的短缺：买家会抬价'; } }
  ]);

  /* ── 李嘉图 · 比较优势 ── */
  A.model('ricardo_comparative', '李嘉图 · 比较优势', '葡萄牙酿酒、织呢都比英国效率高。那它和英国贸易，还有好处吗？', [
    { name: '专业化', hint: '两根滑杆：英国、葡萄牙各把多少劳动力用来酿酒（其余织呢）。先看各自一半一半的产量，再让葡萄牙专酿酒、英国专织呢。', sl: [['英国：酿酒的劳动力', 0.5, C.CY], ['葡萄牙：酿酒的劳动力', 0.5, C.AM]],
      scene: function (K, s) { s.g = A.gauges(K, ['世界葡萄酒', '世界毛呢'], [C.PU, C.GR], -0.9, 0.3, -0.3); s.tot = k.lab(K, '', -0.3, 2.45, 0, '#ffffff', 0.15); },
      tick: function (K, s, dt, t, v) { var wine = v[0] * 100 / 120 + v[1] * 100 / 80, cloth = (1 - v[0]) * 100 / 100 + (1 - v[1]) * 100 / 90; s.w = wine; s.cl = cloth; s.g[0].set(wine / 2.2); s.g[1].set(cloth / 2.2); K.text(s.tot, '酒 ' + wine.toFixed(2) + ' + 呢 ' + cloth.toFixed(2) + ' = ' + (wine + cloth).toFixed(2)); },
      rules: [function (v, c, s) { return s.t > 1.5; }, function (v) { return v[0] < 0.1 && v[1] > 0.9; }], msg: function (v) { return v[0] < 0.1 && v[1] > 0.9 ? '葡萄牙放弃的毛呢少、英国放弃的酒少：各做机会成本低的，世界总产出变多' : '英国：1 单位酒要 120 人、呢要 100 人；葡萄牙：酒 80 人、呢 90 人'; } },
    { name: '贸易比价', hint: '拖动“1 单位酒换多少毛呢”的比价。它要落在两国各自的机会成本之间，双方才都愿意换。', sl: [['1 酒 换 x 呢（0.6–1.4）', 0.1, C.GOLD]],
      scene: function (K, s) { s.g = A.gauges(K, ['英国的消费', '葡萄牙的消费'], [C.CY, C.AM], -0.9, 0.3, -0.3); [-0.9, 0.3].forEach(function (x) { K.line([P(x - 0.25, 0.8, -0.3), P(x + 0.25, 0.8, -0.3)], K.lineMat(C.WH, 0.9, true)); }); k.lab(K, '虚线 = 自给自足时的水平', -0.3, 2.45, 0, '#9aa7b5'); },
      tick: function (K, s, dt, t, v) { var r = 0.6 + v[0] * 0.8, ok = r > 0.89 && r < 1.2, a = ok ? 0.53 + (1.2 - r) * 1.2 : 0.42, b = ok ? 0.53 + (r - 0.89) * 1.2 : 0.42; s.r = r; s.ok = ok; s.g[0].set(a); s.g[1].set(b); },
      rules: [function (v, c, s) { return s.ok; }, function (v, c, s) { return s.ok && s.r > 0.98 && s.r < 1.1; }], msg: function (v, c, s) { return s.ok ? '比价 ' + s.r.toFixed(2) + '：在 0.89（葡）和 1.20（英）之间，两国的消费都超过了自给自足' : '比价 ' + s.r.toFixed(2) + '：有一方宁可自己生产，换不成'; } }
  ]);

  /* ── 凯恩斯 · 乘数 ── */
  A.model('keynes_multiplier', '凯恩斯 · 乘数效应', '新增 100 亿投资，为什么最后带动的总收入远不止 100 亿？', [
    { name: '注入与放大', hint: '点「注入一笔投资」，看它在家庭和企业之间一轮轮传下去；再拖动边际消费倾向 MPC，看总收入被放大多少倍。', sl: [['边际消费倾向 MPC', 0.5, C.GOLD]], bt: ['💰 注入一笔投资'],
      scene: function (K, s) { s.R = [0, 1, 2, 3, 4, 5, 6, 7].map(function (i) { var m = k.box(K, 0.26, 1, 0.26, i ? C.CY : C.GOLD, -1.6 + i * 0.36, 0.5, 0); return m; }); s.tot = k.lab(K, '', -0.3, 2.45, 0, '#ffffff', 0.16); s.p = 0; },
      tick: function (K, s, dt, t, v) { if (s.b[0]) s.p = Math.min(8, s.p + dt * 2.5); s.R.forEach(function (m, i) { var h = i < s.p ? Math.pow(v[0], i) * 1.4 : 0.001; m.scale.y = Math.max(0.001, h); m.position.y = FY + 0.55 + h / 2; }); K.text(s.tot, s.b[0] ? '第 1…8 轮支出 · 乘数 k = 1 / (1 − MPC) = ' + (1 / (1 - Math.min(0.95, v[0]))).toFixed(1) : ''); },
      rules: [function (v, c, s) { return s.p >= 4; }, function (v, c, s) { return s.b[0] && v[0] > 0.78; }], msg: function (v, c, s) { return !s.b[0] ? '' : v[0] > 0.78 ? '每一轮花出去的更多，尾巴更长：100 亿带出了 ' + Math.round(100 / (1 - Math.min(0.95, v[0]))) + ' 亿的收入' : '一个人的支出是另一个人的收入：金柱是最初那笔投资，蓝柱是它引出的消费'; } },
    { name: '节俭的悖论', hint: '萧条时把“全社会储蓄倾向”拉高，看收入的循环；再点「政府逆周期支出」。', sl: [['全社会储蓄倾向', 0.2, C.RED]], bt: ['🏛 政府逆周期支出'],
      scene: function (K, s) { s.c = A.crowd(K, 30, 0.13); s.g = A.gauges(K, ['总收入', '就业'], [C.GR, C.CY], 0.7, 1.2, -0.3); k.lab(K, '家庭 ⇄ 企业', -0.8, 2.3, 0); },
      tick: function (K, s, dt, t, v) { var gov = s.b[0] ? 0.5 : 0, flow = clamp(1 - v[0] * 1.1 + gov, 0.05, 1); s.flow = flow; s.c.draw(function (i) { var a = i / 30 * TAU + t * flow * 1.5; return [-0.8 + Math.cos(a) * 0.9, 1.3 + Math.sin(a) * 0.6, 0, 0.5 + 0.5 * flow, 0.9 * flow + 0.1, 0.4]; }); s.g[0].set(flow); s.g[1].set(flow * 0.95); },
      rules: [function (v) { return v[0] > 0.75; }, function (v, c, s) { return v[0] > 0.75 && s.b[0]; }], msg: function (v, c, s) { return s.b[0] && v[0] > 0.75 ? '私人不肯花的时候，公共支出把循环重新推起来' : v[0] > 0.75 ? '人人都想多存：总收入萎缩，结果谁也没多存下钱' : ''; } }
  ]);

  /* ── 弗里德曼 · 货币主义 ── */
  A.model('friedman_monetarism', '弗里德曼 · 货币主义', '多印钱能永久降低失业吗？通货膨胀到底由什么决定？', [
    { name: '货币与物价', hint: '实际产出每年大约增长 3%。拖动货币供给的增速：先拉得很高，再把它锚定在产出增速附近。', sl: [['货币供给增速（0–20%）', 0.15, C.GOLD]],
      scene: function (K, s) { s.g = A.gauges(K, ['货币增速', '实际产出增速', '通货膨胀'], [C.GOLD, C.GR, C.RED], -1.3, 0.5, -0.3); },
      tick: function (K, s, dt, t, v) { var m = v[0] * 20, inf = Math.max(0, m - 3); s.m = m; s.g[0].set(m / 20); s.g[1].set(3 / 20); s.g[2].set(inf / 20); if (m > 12) s.hi = 1; },
      rules: [function (v, c, s) { return s.m > 12; }, function (v, c, s) { return s.hi && Math.abs(s.m - 3) < 1.2; }], msg: function (v, c, s) { return s.m > 12 ? '钱比东西多得多：多出来的部分全变成了物价上涨' : Math.abs(s.m - 3) < 1.2 ? '货币增速 ≈ 产出增速：物价稳定。通胀归根到底是货币现象' : ''; } },
    { name: '短期与长期', hint: '点「意外多印一笔钱」，看失业率的短期变化；再按住画面（或空格）让时间走到长期。', bt: ['🖨 意外多印一笔钱'],
      scene: function (K, s) { s.g = A.gauges(K, ['失业率', '通货膨胀', '公众的通胀预期'], [C.CY, C.RED, C.PU], -1.3, 0.5, -0.3); K.line([P(-1.6, 0.75, -0.3), P(-1.0, 0.75, -0.3)], K.lineMat(C.WH, 0.9, true)); k.lab(K, '自然失业率', -1.3, 0.62, 0.1, '#ffffff', 0.09); s.e = 0; },
      tick: function (K, s, dt, t) { if (s.b[0] && K.pressed) s.e = Math.min(1, s.e + dt * 0.3); var sh = s.b[0] ? 1 : 0; s.g[0].set(0.5 - sh * 0.25 * (1 - s.e)); s.g[1].set(0.15 + sh * 0.6); s.g[2].set(0.15 + sh * 0.6 * s.e); },
      rules: [function (v, c, s) { return s.b[0] > 0; }, function (v, c, s) { return s.e >= 1; }], msg: function (v, c, s) { return s.e >= 1 ? '预期追上来了：失业率回到自然率，只留下更高的通胀' : s.b[0] ? '工人以为工资涨了（其实是物价涨了），暂时多干活：失业率下降。按住画面看长期' : ''; } }
  ]);

  /* ── 索洛 · 增长模型 ── */
  A.model('solow_growth', '索洛 · 经济增长模型', '一个国家拼命储蓄、盖厂房、堆机器，为什么长期总会碰到增长的天花板？', [
    { name: '稳态', hint: '弯曲的线是新增投资 s·f(k)，直线是折旧。拖动储蓄率 s，再按住画面（或空格）让资本一年年积累，看它停在哪里。', sl: [['储蓄率 s', 0.3, C.GOLD]],
      scene: function (K, s) { A.axes(K, null, null, null, null, '人均资本 k', ''); s.inv = A.plot(K, function (u) { return 0; }, C.GOLD); A.plot(K, function (u) { return u * 0.75; }, C.RED); k.lab(K, '折旧 (δ+n)k', 0.6, 2.05, 0, '#ff7a7a'); s.kk = 0.05; s.pt = A.dot(K); },
      tick: function (K, s, dt, t, v) { var f = function (u) { return v[0] * 1.6 * Math.sqrt(u); }; s.inv.userData.replot(f); if (K.pressed) s.kk = clamp(s.kk + (f(s.kk) - s.kk * 0.75) * dt * 0.8, 0.01, 1); s.ks = Math.pow(v[0] * 1.6 / 0.75, 2); s.pt.position.copy(s.inv.userData.at(s.kk, f)); if (v[0] > 0.45) s.up = 1; },
      rules: [function (v, c, s) { return s.up && s.hold > 1; }, function (v, c, s) { return Math.abs(s.kk - Math.min(1, s.ks)) < 0.03 && s.hold > 2; }], msg: function (v, c, s) { return Math.abs(s.kk - Math.min(1, s.ks)) < 0.03 && s.hold > 2 ? '稳态：新增投资刚好只够补折旧，人均资本不再增长' : '资本越多，每多一台机器带来的产出越少（曲线变平）'; } },
    { name: '技术进步', hint: '储蓄率不变。拖动技术水平 A：整条生产曲线往上抬。', sl: [['技术水平 A', 0.1, C.GR]],
      scene: function (K, s) { A.axes(K, null, null, null, null, '人均资本 k', '人均产出'); s.f = A.plot(K, function (u) { return 0; }, C.GR); A.plot(K, function (u) { return 0.45 * Math.sqrt(u); }, C.GREY); k.lab(K, '只堆资本：停在这条线上', 0.2, 1.15, 0, '#9aa7b5', 0.1); },
      tick: function (K, s, dt, t, v) { s.f.userData.replot(function (u) { return (0.45 + v[0] * 0.65) * Math.sqrt(u); }); },
      rules: [function (v) { return v[0] > 0.4; }, function (v) { return v[0] > 0.9; }], msg: function (v) { return v[0] > 0.4 ? '技术进步把天花板本身抬高了：长期增长靠的是它' : ''; } }
  ]);

  /* ── 托宾 · 投资组合 ── */
  A.model('tobin_portfolio', '托宾 · 投资组合选择', '两只单看都剧烈波动的资产放在一起，整体的风险为什么反而能大幅下降？', [
    { name: '分散', hint: '两根滑杆：资产甲占多少（其余是乙）、两者的相关系数 ρ。先全押一只，再均衡配置并把 ρ 调低。', sl: [['资产甲的权重', 1.0, C.AM], ['相关系数 ρ（左 −1，右 +1）', 0.9, C.CY]],
      scene: function (K, s) { A.axes(K, null, null, 0.7, 1.4, '时间', ''); s.a = A.plot(K, function () { return 0; }, C.AM, null, null, 0.7, 1.4); s.b = A.plot(K, function () { return 0; }, C.CY, null, null, 0.7, 1.4); s.p = A.plot(K, function () { return 0; }, C.WH, null, null, 0.7, 1.4); s.rk = k.lab(K, '', -0.3, 2.45, 0, '#ffffff', 0.15); },
      tick: function (K, s, dt, t, v) { var w = v[0], rho = v[1] * 2 - 1, fa = function (u) { return 0.5 + 0.35 * Math.sin(u * 14 + t); }, fb = function (u) { return 0.5 + 0.35 * (rho * Math.sin(u * 14 + t) + Math.sqrt(1 - rho * rho) * Math.sin(u * 23 + 1.7 + t * 1.3)); }; s.a.userData.replot(fa); s.b.userData.replot(fb); s.p.userData.replot(function (u) { return w * fa(u) + (1 - w) * fb(u); }); s.a.material.opacity = s.b.material.opacity = 0.35;
        s.risk = Math.sqrt(w * w + (1 - w) * (1 - w) + 2 * w * (1 - w) * rho); K.text(s.rk, '组合的波动（白线）= 单只的 ' + Math.round(s.risk * 100) + '%'); },
      rules: [function (v) { return v[0] > 0.95 || v[0] < 0.05; }, function (v, c, s) { return s.risk < 0.6; }], msg: function (v, c, s) { return s.risk < 0.6 ? '一个涨时另一个常常跌：波动互相抵消了' : ''; } },
    { name: '分离定理', hint: '风险资产内部的最优比例只有一个。拖第一根滑杆找到它（夏普比率最高），再拖第二根：在现金和这个组合之间按自己的胆量分配。', sl: [['风险资产内部：甲的比例', 0.1, C.AM], ['现金 ←→ 风险组合', 0.5, C.GR]],
      scene: function (K, s) { s.g = A.gauges(K, ['夏普比率', '预期收益', '风险'], [C.GOLD, C.GR, C.RED], -1.3, 0.5, -0.3); },
      tick: function (K, s, dt, t, v) { var sh = 1 - Math.pow((v[0] - 0.6) / 0.6, 2); s.sh = sh; s.g[0].set(clamp(sh, 0, 1)); s.g[1].set(v[1] * 0.9 * clamp(sh, 0.2, 1)); s.g[2].set(v[1] * 0.9); if (sh > 0.97) s.opt = 1; if (s.opt && v[1] < 0.25) s.lo = 1; if (s.opt && v[1] > 0.75) s.hi = 1; },
      rules: [function (v, c, s) { return s.sh > 0.97; }, function (v, c, s) { return s.lo && s.hi; }], msg: function (v, c, s) { return s.lo && s.hi ? '保守的人多拿现金，激进的人多拿组合：但组合内部的比例对所有人都一样' : s.sh > 0.97 ? '找到了：每承担一分风险换来的收益最高' : ''; } }
  ]);

  /* ── 哈耶克 · 价格信号 ── */
  function ringNet(K, s, n) { s.pts = A.ring(n, 1.2, 1.4); s.net = A.net(K, s.pts, C.CY); s.hub = K.sphere(0.12, K.holo(C.GOLD, { core: 1 })); s.hub.position.copy(P(-0.3, 1.4, 0)); }
  A.model('hayek_prices', '哈耶克 · 分散知识与价格信号', '某处锡矿出了事，成千上万不知道原因的厂家，为什么都自动开始省锡、找替代品？', [
    { name: '价格传话', hint: '每个厂家只知道自己眼前的情况。点「远方锡矿短缺」，再拖动滑杆让涨价的信号传开。', sl: [['价格信号的传导', 0, C.GOLD]], bt: ['⛏ 远方锡矿短缺'],
      scene: function (K, s) { ringNet(K, s, 14); k.lab(K, '锡价', -0.3, 1.75, 0, '#ffd96b'); },
      tick: function (K, s, dt, t, v) { s.net.nd.forEach(function (m, i) { var on = s.b[0] && i < v[0] * 14; A.col(m, on ? C.GOLD : C.CY); m.scale.setScalar(on ? 0.7 : 1); }); s.hub.scale.setScalar(s.b[0] ? 1.6 : 1); },
      rules: [function (v, c, s) { return s.t > 1.5; }, function (v, c, s) { return s.b[0] && v[0] > 0.9; }], msg: function (v, c, s) { return s.b[0] && v[0] > 0.9 ? '没人知道矿上出了什么事，每个人却都缩小了用量（球变小）：价格替他们传了话' : s.b[0] ? '锡涨价了。把信号传出去' : '每个节点只掌握“此时此地”的一点知识'; } },
    { name: '上报还是价格', hint: '用按钮比较两种办法：把现场情况层层上报、等中央批复；或者让价格直接传到每个人手里。', ch: ['层层上报 · 中央审批', '价格信号 · 各自响应'],
      scene: function (K, s) { ringNet(K, s, 14); s.g = A.gauges(K, ['响应延迟', '信息损耗'], [C.RED, C.AM], 1.0, 1.35, -0.3); },
      tick: function (K, s, dt, t, v, ch) { var slow = ch === 0, u = (t * (slow ? 0.15 : 1.2)) % 1; s.net.nd.forEach(function (m, i) { var on = slow ? (i / 14 < u * 0.5) : (i / 14 < u * 3); A.col(m, on ? C.GOLD : C.CY); }); s.g[0].set(slow ? 0.9 : 0.1); s.g[1].set(slow ? 0.8 : 0.1); },
      rules: [function (v, c, s) { return s.seen.c0 && s.t > 2; }, function (v, c, s) { return s.seen.c0 && s.seen.c1; }], msg: function (v, ch) { return ch === 0 ? '报告写不下“此时此地”的细节，等批复回来，情况早变了' : '一个数字就够了：价格是一套通信系统'; } }
  ]);

  /* ── 熊彼特 · 创造性破坏 ── */
  A.model('schumpeter_destruction', '熊彼特 · 创造性破坏', '资本主义增长的动力，是老产品之间的降价竞争，还是新东西把旧东西整个淘汰？', [
    { name: '新组合', hint: '一座靠马车和煤气灯运转的城。拖动滑杆把新技术推进来，看旧产业和新产业。', sl: [['新技术的扩散', 0, C.GOLD]],
      scene: function (K, s) { s.old = [0, 1, 2, 3, 4].map(function (i) { return k.box(K, 0.3, 0.9, 0.3, C.GREY, -1.5 + i * 0.3, 0.95, -0.2); }); s.nw = [0, 1, 2, 3, 4].map(function (i) { return k.box(K, 0.3, 1, 0.3, C.GOLD, -0.1 + i * 0.3, 0.5, 0.1); }); k.lab(K, '马车 · 煤气灯', -0.9, 2.2, 0, '#9aa7b5'); k.lab(K, '汽车 · 电灯', 0.5, 2.2, 0, '#ffd96b'); s.g = A.gauges(K, ['生产力'], [C.GR], -2.0, -2.0, 0.3, 1.2); },
      tick: function (K, s, dt, t, v) { s.old.forEach(function (m, i) { var h = clamp(1 - v[0] * 1.6 + i * 0.12, 0.02, 1) * 0.9; m.scale.y = h / 0.9; m.position.y = FY + 0.5 + h / 2; }); s.nw.forEach(function (m, i) { var h = clamp(v[0] * 1.8 - i * 0.15, 0.001, 1) * 1.5; m.scale.y = h; m.position.y = FY + 0.5 + h / 2; }); s.g[0].set(0.3 + v[0] * 0.7); },
      rules: [function (v) { return v[0] > 0.2; }, function (v) { return v[0] > 0.9; }], msg: function (v) { return v[0] > 0.9 ? '旧结构退场，生产力上了一个台阶：从内部不断革新经济结构' : v[0] > 0.2 ? '原来的均衡被打破了' : ''; } },
    { name: '降价还是创新', hint: '用按钮比较两种竞争：同样的产品降价 5%，或者拿出一种全新的产品。再按住画面（或空格）看长期。', ch: ['降价 5%', '全新的产品 / 生产方式'],
      scene: function (K, s) { s.g = A.gauges(K, ['对旧格局的冲击', '经济总效率'], [C.RED, C.GR], -0.9, 0.3, -0.3); s.e = 0; },
      tick: function (K, s, dt, t, v, ch) { if (ch === 1 && K.pressed) s.e = Math.min(1, s.e + dt * 0.3); s.g[0].set(ch === 0 ? 0.08 : 0.95); s.g[1].set(0.3 + (ch === 1 ? 0.1 + s.e * 0.6 : 0.02)); },
      rules: [function (v, c, s) { return s.seen.c0 && s.seen.c1; }, function (v, c, s) { return s.e >= 1; }], msg: function (v, ch, s) { return s.e >= 1 ? '一波又一波的创新：这才是那场“永不停息的风暴”' : ch === 0 ? '价格竞争只是在门上敲了敲' : '新产品的竞争打击的不是利润的边际，而是企业的根基'; } }
  ]);

  /* ── 科斯 · 交易成本 ── */
  function farm(K, s) { s.cow = A.person(K, C.AM, -1.3, 0.6, 0, 1.4, '牧牛人'); s.fm = A.person(K, C.GR, 0.7, 0.6, 0, 1.4, '农夫'); s.fence = k.box(K, 0.06, 0.7, 0.9, C.WH, -0.3, 0.95, 0); k.lab(K, '修栅栏 10 元 · 庄稼损失 30 元', -0.3, 2.3, 0); }
  A.model('coase_transaction', '科斯 · 交易成本与科斯定理', '牛踩了庄稼。把权利判给农夫还是判给牧牛人，会影响最后修不修栅栏吗？', [
    { name: '零交易成本', hint: '谈判不花任何成本。用按钮切换：权利判给农夫，或判给牧牛人。看栅栏修没修、谁出的钱。', ch: ['判给农夫（牛不得踩）', '判给牧牛人（牛可以踩）'],
      scene: farm, tick: function (K, s, dt, t, v, ch) { s.fence.visible = true; A.col(s.fence, ch === 0 ? C.AM : C.GR); },
      rules: [function (v, c, s) { return s.seen.c0 && s.seen.c1; }, function (v, c, s) { return s.seen.c0 && s.seen.c1 && s.t > 4; }], msg: function (v, ch, s) { return s.seen.c0 && s.seen.c1 && s.t > 4 ? '损害是相互的：不让牛踩，是限制牧牛人；让牛踩，是损害农夫' : ch === 0 ? '牧牛人自己掏 10 元修栅栏（比赔 30 元便宜）' : '农夫掏 10 元请牧牛人修栅栏（比损失 30 元便宜）—— 栅栏照样修了'; } },
    { name: '有交易成本', hint: '现在谈判要花钱。把交易成本拉高，再切换权利归属，看栅栏还修不修。', sl: [['谈判与执行的成本', 0, C.RED]], ch: ['判给农夫', '判给牧牛人'],
      scene: farm, tick: function (K, s, dt, t, v, ch) { var blocked = v[0] > 0.6; s.fence.visible = !(blocked && ch === 1); A.col(s.fence, ch === 0 ? C.AM : C.GR); if (blocked && ch === 1) s.fail = 1; if (blocked && ch === 0 && s.fail) s.fix = 1; },
      rules: [function (v, c, s) { return s.fail; }, function (v, c, s) { return s.fix; }], msg: function (v, ch, s) { return v[0] > 0.6 ? (ch === 1 ? '谈判成本超过了 20 元的好处：谈不成，栅栏没修，庄稼白白损失' : '判给农夫：牧牛人自己就会修。交易成本高时，最初把权利给谁就很要紧了') : '成本还低，双方照样谈得成'; } }
  ]);

  /* ── 纳什均衡 ── */
  function matrix(K, s, pay) { s.cell = [0, 1, 2, 3].map(function (i) { var r = Math.floor(i / 2), c = i % 2, m = k.box(K, 0.95, 0.6, 0.06, C.CY, -0.85 + c * 1.05, 1.75 - r * 0.7, 0); m.userData.lab = k.lab(K, '', -0.85 + c * 1.05, 1.75 - r * 0.7, 0.08, '#ffffff', 0.13); return m; }); k.lab(K, '乙：合作', -0.85, 2.25, 0, '#ffa23a'); k.lab(K, '乙：背叛', 0.2, 2.25, 0, '#ffa23a'); k.lab(K, '甲：合作', -1.75, 1.75, 0, '#6fe3ff'); k.lab(K, '甲：背叛', -1.75, 1.05, 0, '#6fe3ff'); s.sel = 0; }
  function isNE(p, i) { var r = Math.floor(i / 2), c = i % 2, o = (1 - r) * 2 + c, q = r * 2 + (1 - c); return p[i][0] >= p[o][0] && p[i][1] >= p[q][1]; }
  function drawM(K, s, p) { s.cell.forEach(function (m, i) { K.text(m.userData.lab, p[i][0].toFixed(0) + ' , ' + p[i][1].toFixed(0)); A.col(m, i === s.sel ? (isNE(p, i) ? C.GR : C.RED) : C.CY); m.scale.setScalar(i === s.sel ? 1.08 : 1); }); }
  var PD = [[3, 3], [0, 5], [5, 0], [1, 1]];
  A.model('nash_equilibrium', '纳什 · 纳什均衡', '没有任何有约束力的协议时，理性的人会停在哪一种局面上，谁也不想单独反悔？', [
    { name: '最优反应', hint: '用按钮选一个格子（每格是“甲的收益 , 乙的收益”）。红色 = 有人想单独改主意；绿色 = 谁都不想动。', ch: ['合作 / 合作', '合作 / 背叛', '背叛 / 合作', '背叛 / 背叛'],
      scene: function (K, s) { matrix(K, s); }, tick: function (K, s, dt, t, v, ch) { s.sel = ch; drawM(K, s, PD); },
      rules: [function (v, c, s) { return s.seen.c1 || s.seen.c2 || (s.seen.c0 && s.t > 2); }, function (v, ch) { return ch === 3; }], msg: function (v, ch) { return ch === 3 ? '双方都背叛：各得 1。谁单独改成合作都只会更糟（0）—— 这就是均衡，尽管它不是最好的结果' : ch === 0 ? '各得 3，看着最好；可任何一方改成背叛就能得 5' : '有一方只得 0：他一定想改'; } },
    { name: '多重均衡', hint: '拖动滑杆加大“双方都合作”的奖励：博弈会从只有一个均衡变成有两个（猎鹿博弈）。再点「混合策略」。', sl: [['合作的协同奖励', 0, C.GOLD]], ch: ['合作 / 合作', '背叛 / 背叛'], bt: ['🎲 混合策略'],
      scene: function (K, s) { matrix(K, s); s.mx = k.lab(K, '', -0.3, 0.72, 0.3, '#ffd96b', 0.13); },
      tick: function (K, s, dt, t, v, ch) { var b = 3 + v[0] * 4, p = [[b, b], [0, 5], [5, 0], [1, 1]]; s.sel = ch === 0 ? 0 : 3; drawM(K, s, p); s.two = isNE(p, 0) && isNE(p, 3); if (s.b[0]) K.text(s.mx, s.two ? '还有第三个：各以 ' + Math.round(1 / (b - 4) * 100) + '% 的概率合作' : '只有一个纯策略均衡'); },
      rules: [function (v, c, s) { return s.two; }, function (v, c, s) { return s.two && s.b[0]; }], msg: function (v, ch, s) { return s.two ? '两个格子都是均衡：停在哪一个，取决于彼此的预期' : '奖励还不够：合作 / 合作仍然留不住人'; } }
  ]);

  /* ── 阿克洛夫 · 柠檬市场 ── */
  function cars(K, s) { s.c = A.crowd(K, 20, 0.2); s.g = A.gauges(K, ['成交量'], [C.GR], 1.0, 1.0, -0.3); k.lab(K, '金色 = 好车（值 100）　灰色 = 次品（值 40）', -0.4, 2.3, 0); }
  A.model('akerlof_lemons', '阿克洛夫 · 柠檬市场', '二手车市场上明明有好车。为什么买家只敢出均价，最后好车纷纷退出，只剩破车？', [
    { name: '逆向选择', hint: '买家分不清好坏，只肯按“平均质量”出价。按住画面（或空格）让市场一轮轮走下去。',
      scene: function (K, s) { cars(K, s); s.r = 0; s.pr = k.lab(K, '', -0.4, 0.55, 0.4, '#ffd96b', 0.14); },
      tick: function (K, s, dt, t) { if (K.pressed) s.r = Math.min(2, s.r + dt * 0.5); var good = s.r < 1 ? 10 : 0, bad = s.r < 2 ? 10 : 10; s.c.draw(function (i) { var g = i < 10, on = g ? s.r < 1 : true; return [-1.5 + (i % 10) * 0.24, 1.6 - Math.floor(i / 10) * 0.5, 0, on ? (g ? 1 : 0.55) : 0.1, on ? (g ? 0.85 : 0.6) : 0.1, on ? (g ? 0.4 : 0.65) : 0.1]; }); s.g[0].set(s.r >= 2 ? 0.05 : s.r >= 1 ? 0.4 : 1); K.text(s.pr, s.r < 1 ? '买家出价：70（好坏各半的均价）' : s.r < 2 ? '好车主不肯 70 卖：退出。买家改出 40' : '只剩次品：市场几乎冻结'); },
      rules: [function (v, c, s) { return s.r >= 1; }, function (v, c, s) { return s.r >= 2; }], msg: function (v, c, s) { return s.r >= 2 ? '劣货驱逐良货：问题不在于车不好，而在于买家不知道哪辆好' : ''; } },
    { name: '信号与担保', hint: '拖动滑杆提高信息透明度（第三方检测、质量保修）：看好车回不回来。', sl: [['信息透明度', 0, C.GOLD]],
      scene: function (K, s) { cars(K, s); },
      tick: function (K, s, dt, t, v) { var back = Math.round(v[0] * 10); s.c.draw(function (i) { var g = i < 10, on = g ? i < back : true; return [-1.5 + (i % 10) * 0.24, 1.6 - Math.floor(i / 10) * 0.5, 0, on ? (g ? 1 : 0.55) : 0.1, on ? (g ? 0.85 : 0.6) : 0.1, on ? (g ? 0.4 : 0.65) : 0.1]; }); s.g[0].set(0.4 + v[0] * 0.6); },
      rules: [function (v) { return v[0] > 0.4; }, function (v) { return v[0] > 0.9; }], msg: function (v) { return v[0] > 0.9 ? '好车卖 100，次品卖 40：各按各的价成交' : v[0] > 0.4 ? '敢给保修的，多半是好车：买家开始分得清了' : ''; } }
  ]);

  /* ── 奥斯特罗姆 · 公共资源 ── */
  function pond(K, s) { s.c = A.crowd(K, 50, 0.13); s.g = A.gauges(K, ['鱼群存量'], [C.CY], 1.0, 1.0, -0.3); K.line([P(0.75, 0.5, -0.3), P(1.25, 0.5, -0.3)], K.lineMat(C.RED, 0.9, true)); s.fish = 0.9; }
  function drawPond(K, s, t) { s.c.draw(function (i, p) { var on = i < s.fish * 50; return [-0.6 + p.x * 1.2 + Math.sin(t + i) * 0.05, on ? 1.4 + p.z * 0.7 : -9, 0, 0.4, 0.8, 1]; }); s.g[0].set(s.fish); }
  A.model('ostrom_commons', '奥斯特罗姆 · 公共资源治理', '共用的渔场，除了“私有化”和“交给政府”，渔民自己能不能定规则，避免把鱼捞光？', [
    { name: '公地悲剧', hint: '没有任何规则。拖动滑杆加大各家的捕捞强度，看鱼群；然后点「两种传统药方」。', sl: [['捕捞强度', 0.2, C.RED]], bt: ['📜 两种传统药方'],
      scene: pond, tick: function (K, s, dt, t, v) { s.fish = clamp(s.fish + (0.25 * s.fish * (1 - s.fish) - v[0] * 0.8 * s.fish) * dt * 5 + 0.002, 0.02, 1); drawPond(K, s, t); },
      rules: [function (v, c, s) { return s.fish < 0.2; }, function (v, c, s) { return s.b[0] > 0; }], msg: function (v, c, s) { return s.b[0] ? '“要么国家来管，要么分给私人”：这个二分法漏掉了第三条路' : s.fish < 0.2 ? '每条船多捞一点都合算，合起来却把鱼捞到了再生线以下' : ''; } },
    { name: '自主治理', hint: '用按钮依次打开三条规则：清晰的边界与共同定配额、渔民互相监督、分级制裁。看鱼群。', bt: ['清晰边界 + 共定配额', '互相监督', '分级制裁'],
      scene: function (K, s) { pond(K, s); s.fish = 0.2; s.ring = K.mesh(new T.TorusGeometry(1.15, 0.02, 6, 60), K.glow(C.GOLD, 0)); s.ring.position.copy(P(-0.6, 1.4, 0)); },
      tick: function (K, s, dt, t) { var n = (s.b[0] ? 1 : 0) + (s.b[1] ? 1 : 0) + (s.b[2] ? 1 : 0), catchR = 0.3 - n * 0.075; s.ring.material.opacity = s.b[0] ? 0.9 : 0; s.fish = clamp(s.fish + (0.25 * s.fish * (1 - s.fish) - catchR * 0.3 * s.fish) * dt * 5 + 0.003, 0.02, 1); drawPond(K, s, t); },
      rules: [function (v, c, s) { return s.b[0] > 0; }, function (v, c, s) { return s.b[1] && s.b[2] && s.fish > 0.6; }], msg: function (v, c, s) { return s.b[1] && s.b[2] && s.fish > 0.6 ? '鱼群稳在了丰盈的水平：规则是用的人自己定、自己守的' : s.b[0] ? '谁能来捕、能捕多少，由渔民自己商定' : ''; } }
  ]);

  /* ── 西蒙 · 有限理性 ── */
  A.model('simon_bounded', '赫伯特·西蒙 · 有限理性', '面对成千上万个评估不完的选项，真实的人是怎样不在“寻找最优”里耗尽一生的？', [
    { name: '满意解', hint: '一排还没看过的选项。把“满意标准”拉到最高（非最好的不要），按住画面（或空格）搜索；再把标准调到合理的位置重来一次。', sl: [['满意标准', 1.0, C.GOLD]], bt: ['↺ 重新搜索'],
      scene: function (K, s) { s.c = A.crowd(K, 40, 0.15); s.g = A.gauges(K, ['净收益'], [C.GR], 1.0, 1.0, -0.3); s.n = 0; s.q = []; for (var i = 0; i < 40; i++) s.q.push(((i * 37 + 11) % 97) / 97); s.pick = -1; },
      onBt: function (K, s) { s.n = 0; s.pick = -1; },
      tick: function (K, s, dt, t, v) { if (K.pressed && s.pick < 0 && s.n < 40) { s.n = Math.min(40, s.n + dt * 18); var i = Math.floor(s.n) - 1; if (i >= 0 && s.q[i] >= v[0] * 1.02) s.pick = i; } s.c.draw(function (i) { var seen = i < s.n, q = s.q[i]; return [-1.6 + (i % 10) * 0.26, 2.0 - Math.floor(i / 10) * 0.32, 0, i === s.pick ? 0.4 : seen ? 0.3 + q * 0.7 : 0.25, i === s.pick ? 1 : seen ? 0.3 + q * 0.5 : 0.25, i === s.pick ? 0.6 : 0.3]; });
        s.net = s.pick >= 0 ? s.q[s.pick] - s.n / 40 * 0.9 : -s.n / 40 * 0.9 + (s.n >= 40 ? 0.9 : 0); s.g[0].set(clamp(0.1 + s.net, 0, 1)); if (s.n >= 40 && s.pick < 0) s.ex = 1; },
      rules: [function (v, c, s) { return s.ex; }, function (v, c, s) { return s.pick >= 0 && s.n < 20 && v[0] < 0.9; }], msg: function (v, c, s) { return s.pick >= 0 && s.n < 20 ? '看到第 ' + Math.ceil(s.n) + ' 个就够好了：停下，去做' : s.ex ? '全看完了：搜索花掉的时间把好处吃光了' : ''; } },
    { name: '愿望水平', hint: '用按钮切换环境：好找的时候、难找的时候。看“满意标准”自己怎么调整；再点「剪刀的两片刀刃」。', ch: ['好选项很多', '好选项很少'], bt: ['✂ 剪刀的两片刀刃'],
      scene: function (K, s) { s.g = A.gauges(K, ['愿望水平', '找到的把握'], [C.GOLD, C.CY], -0.9, 0.3, -0.3); s.a = 0.6; },
      tick: function (K, s, dt, t, v, ch) { s.a = lerp(s.a, ch === 0 ? 0.85 : 0.35, dt * 0.7); s.g[0].set(s.a); s.g[1].set(ch === 0 ? 0.8 : 0.6); },
      rules: [function (v, c, s) { return s.b[0] > 0; }, function (v, c, s) { return s.seen.c0 && s.seen.c1 && s.t > 3; }], msg: function (v, ch, s) { return s.b[0] ? '人的理性像一把剪刀：一片刀刃是头脑的计算能力，另一片是环境的结构' : ch === 0 ? '容易找到：标准自己升高了' : '总找不到：标准自己降下来了'; } }
  ]);

  /* ── 卡尼曼 · 前景理论 ── */
  A.model('kahneman_prospect', '卡尼曼与特沃斯基 · 前景理论', '稳拿 900 和 90% 拿 1000，多数人选稳拿；换成“稳亏 900”和“90% 亏 1000”，多数人却去赌。为什么？', [
    { name: '价值曲线', hint: '左右拖动滑杆：从参照点出发，往右是得、往左是失。比一比“得 500”和“失 500”时小球离横轴多远。', sl: [['损失 ←  参照点  → 收益', 0.5, C.GOLD]],
      scene: function (K, s) { var f = function (u) { var x = u * 2 - 1; return 0.6 + (x >= 0 ? 0.36 * Math.pow(x, 0.7) : -0.36 * 1.5 * Math.pow(-x, 0.7)); }; s.f = f; A.axes(K, null, null, 0.4, 1.7); s.cv = A.plot(K, f, C.GOLD, null, null, 0.4, 1.7); K.line([P(-1.7, 1.42, 0), P(1.0, 1.42, 0)], K.lineMat(C.GREY, 0.6, true)); s.pt = A.dot(K); s.vl = k.lab(K, '', -0.3, 2.45, 0, '#ffffff', 0.15); },
      tick: function (K, s, dt, t, v) { var x = v[0] * 2 - 1; s.pt.position.copy(s.cv.userData.at(v[0])); K.text(s.vl, (x >= 0 ? '得 ' : '失 ') + Math.round(Math.abs(x) * 1000) + ' 元 → 感受 ' + ((s.f(v[0]) - 0.6) / 0.36 * 100).toFixed(0)); if (x > 0.3) s.r = 1; if (x < -0.3) s.l = 1; },
      rules: [function (v, c, s) { return s.r && s.l; }, function (v) { return v[0] < 0.2; }], msg: function (v) { return v[0] < 0.2 ? '损失这一侧陡得多：丢 500 的痛，大约是捡 500 的乐的两倍' : '人感受的不是“我有多少”，而是相对参照点“多了还是少了”'; } },
    { name: '框架效应', hint: '用按钮切换两种问法，看一百个人怎么选。', ch: ['收益框架：稳拿 900 / 90% 拿 1000', '损失框架：稳亏 900 / 90% 亏 1000'],
      scene: function (K, s) { s.c = A.crowd(K, 100, 0.1); k.lab(K, '选“确定的”', -1.2, 2.3, 0, '#6fe3ff'); k.lab(K, '选“赌一把”', 0.5, 2.3, 0, '#ffa23a'); s.k = 0.84; },
      tick: function (K, s, dt, t, v, ch) { s.k = lerp(s.k, ch === 0 ? 0.84 : 0.2, dt * 2); s.c.draw(function (i) { var sure = i < s.k * 100, j = sure ? i : i - Math.round(s.k * 100); return [(sure ? -1.7 : 0.05) + (j % 10) * 0.11, 0.7 + Math.floor(j / 10) * 0.15, 0, sure ? 0.4 : 1, sure ? 0.85 : 0.6, sure ? 1 : 0.2]; }); },
      rules: [function (v, c, s) { return s.seen.c0 && s.t > 1.5; }, function (v, ch) { return ch === 1; }], msg: function (v, ch) { return ch === 0 ? '面对收益：多数人不肯冒险' : '面对损失：多数人宁可赌一把 —— 数字一样，说法一换，选择就翻了'; } }
  ]);

  /* ── 塞勒 · 助推 ── */
  A.model('thaler_nudge', '塞勒 · 助推理论', '不下命令、不改奖惩，只把表格上的“默认选项”换一下，养老储蓄的参与率为什么能从四成跳到九成？', [
    { name: '默认选项', hint: '用按钮切换两种表格：要自己申请才加入，或者默认加入、随时可退。看一百个员工。', ch: ['需主动申请加入（Opt-in）', '默认加入 · 可随时退出（Opt-out）'],
      scene: function (K, s) { s.c = A.crowd(K, 100, 0.1); s.g = A.gauges(K, ['参与率'], [C.GR], 1.0, 1.0, -0.3); s.k = 0.4; },
      tick: function (K, s, dt, t, v, ch) { s.k = lerp(s.k, ch === 0 ? 0.4 : 0.92, dt * 2); s.c.draw(function (i) { var on = i < s.k * 100; return [-1.6 + (i % 10) * 0.2, 0.8 + Math.floor(i / 10) * 0.14, 0, on ? 0.4 : 0.35, on ? 1 : 0.35, on ? 0.6 : 0.4]; }); s.g[0].set(s.k); },
      rules: [function (v, c, s) { return s.seen.c0 && s.t > 1.5; }, function (v, ch, s) { return ch === 1 && s.k > 0.8; }], msg: function (v, ch) { return ch === 0 ? '“回头再填”—— 拖着拖着就没填：参与率 40%' : '谁都可以退出，却很少有人退：选项一个没少，结果大不一样'; } },
    { name: '选择架构', hint: '两个开关：把水果摆到视线平齐的第一排；开通“以后每次加薪，自动多存一点”。', bt: ['🍎 水果摆到第一排', '📈 加薪时自动多存'],
      scene: function (K, s) { s.g = A.gauges(K, ['选水果的人', '储蓄率'], [C.GR, C.GOLD], -0.9, 0.3, -0.3); },
      tick: function (K, s) { s.g[0].set(s.b[0] ? 0.7 : 0.35); s.g[1].set(s.b[1] ? 0.8 : 0.3); },
      rules: [function (v, c, s) { return s.b[0] > 0; }, function (v, c, s) { return s.b[1] > 0; }], msg: function (v, c, s) { return s.b[1] ? '存的是“将来多出来的钱”：现在的工资一分没少，不觉得是损失' : s.b[0] ? '甜点还在，谁都可以拿：只是水果先被看见了' : ''; } }
  ]);
})();
