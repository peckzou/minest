/* Minest · 全息模型 · 附属岛 · 社会学街区 (12 models) — same stages, steps and quotations as the 2D lab models. Uses HL.AX. */
(function () {
  'use strict';
  var HL = window.HL, A = HL && HL.AX; if (!A) return;
  var k = A.k, P = A.P, C = A.C, FY = A.FY, clamp = A.clamp, lerp = A.lerp, TAU = A.TAU, T = window.THREE;
  var PAL = [[1, .64, .23], [.27, .82, 1], [.71, .55, 1], [.49, 1, .69], [1, .85, .42], [1, .48, .48]];

  /* ── 涂尔干 · 社会团结 ── */
  A.model('durkheim_solidarity', '涂尔干 · 社会团结', '现代人越来越不一样，也不再共享同一套信仰。社会为什么没有散掉，反而连得更紧？', [
    { name: '机械团结与有机团结', hint: '拖动“劳动分工”的滑杆：左端人人相似，右端各有各的职业。看他们靠什么连在一起。', sl: [['劳动分工的程度', 0.05, C.GOLD]],
      scene: function (K, s) { s.c = A.crowd(K, 36, 0.16); s.ln = K.line([P(0, 0, 0), P(0, 0, 0)], K.lineMat(C.GOLD, 0)); },
      tick: function (K, s, dt, t, v) { var pts = []; s.c.draw(function (i, p) { var a = i / 36 * TAU, x = lerp(-0.4 + p.x * 0.5, -0.4 + Math.cos(a) * 1.25, v[0]), h = lerp(1.4 + p.z * 0.4, 1.4 + Math.sin(a) * 0.9, v[0]), c = PAL[i % 6]; if (i % 3 === 0) pts.push(P(x, h, 0), P(-0.4, 1.4, 0)); return [x, h, 0, lerp(0.8, c[0], v[0]), lerp(0.8, c[1], v[0]), lerp(0.8, c[2], v[0])]; }); K.setLine(s.ln, pts); s.ln.material.opacity = v[0] * 0.5; if (v[0] < 0.15) s.lo = 1; },
      rules: [function (v, c, s) { return s.lo && s.t > 1.5; }, function (v) { return v[0] > 0.9; }], msg: function (v) { return v[0] > 0.9 ? '有机团结：像身体的各个器官，正因为不同才彼此需要' : v[0] < 0.15 ? '机械团结：大家一个样，共同的信仰盖过了每个人自己的意识' : ''; } },
    { name: '两种法律', hint: '用按钮切换两种社会，再点「有人越轨」，看社会怎么回应；最后点「分工变得太快」。', ch: ['机械团结的社会', '有机团结的社会'], bt: ['⚡ 有人越轨', '🌀 分工变得太快'],
      scene: function (K, s) { s.c = A.crowd(K, 24, 0.16); s.law = k.lab(K, '', -0.3, 2.4, 0, '#ffffff', 0.15); s.fl = 0; },
      onBt: function (K, s, j) { if (j === 0) { s.fl = 1.5; s.used = s.used || {}; s.used[s.ch] = 1; } },
      tick: function (K, s, dt, t, v, ch) { s.fl = Math.max(0, s.fl - dt); s.c.draw(function (i, p) { var dev = i === 5 && s.fl > 0; return [-0.4 + p.x * 1.2, 1.4 + p.z * 0.8 - (dev && ch === 0 ? 0.3 : 0), 0, dev ? 1 : 0.7, dev ? 0.3 : 0.8, dev ? 0.3 : 0.9]; }); K.text(s.law, s.fl > 0 ? (ch === 0 ? '压制性的法律：严惩，为的是平息被冒犯的集体感情' : '恢复性的法律：赔偿、履约，把关系放回原位') : ''); },
      rules: [function (v, c, s) { return s.used && s.used[0]; }, function (v, c, s) { return s.used && s.used[1] && s.b[1]; }], msg: function (v, ch, s) { return s.b[1] ? '规范跟不上分工的变化：人们不知道彼此该怎样配合 —— 失范' : ''; } }
  ]);

  /* ── 韦伯 · 理想类型 ── */
  function tri(K, s) { s.V = [P(-0.3, 2.2, 0), P(-1.5, 0.7, 0), P(0.9, 0.7, 0)]; K.line([s.V[0], s.V[1], s.V[2], s.V[0]], K.lineMat(C.GOLD, 0.8)); k.lab(K, '法理型', -0.3, 2.38, 0, '#ffd96b'); k.lab(K, '传统型', -1.6, 0.52, 0, '#ffd96b'); k.lab(K, '卡里斯玛型', 0.95, 0.52, 0, '#ffd96b'); }
  A.model('weber_ideal_type', '韦伯 · 理想类型', '现实里的组织从来不是纯粹的科层制或个人崇拜。社会学家为什么要造一个现实中并不存在的“理想类型”？', [
    { name: '提纯', hint: '一团混杂的经验特征。拖动滑杆把其中一类特征单方面强化，直到提纯成一把“纯粹的尺子”。', sl: [['提纯的程度', 0, C.GOLD]],
      scene: function (K, s) { s.c = A.crowd(K, 45, 0.14); tri(K, s); },
      tick: function (K, s, dt, t, v) { s.c.draw(function (i, p) { var g = i % 3, tg = s.V[g]; return [lerp(-0.3 + p.x * 0.7, tg.x, v[0] * 0.9) + p.x * 0.1, lerp(1.3 + p.z * 0.5, tg.y - FY, v[0] * 0.9) + p.z * 0.1, 0.05, PAL[g][0], PAL[g][1], PAL[g][2]]; }); },
      rules: [function (v) { return v[0] > 0.4; }, function (v) { return v[0] > 0.95; }], msg: function (v) { return v[0] > 0.95 ? '三种纯粹的类型：现实里找不到完全一样的，但没有它们就没法测量现实' : ''; } },
    { name: '测量现实', hint: '用按钮把三个真实的组织放进三角形，看它离每个顶点多远；再按住画面（或空格）让时间过去，看卡里斯玛怎么变。', ch: ['一家现代银行', '一个世袭的村社', '一位先知和他的追随者'],
      scene: function (K, s) { tri(K, s); s.pt = A.dot(K, C.WH, 0.1); s.pos = P(-0.3, 1.2, 0.1); s.e = 0; },
      tick: function (K, s, dt, t, v, ch) { if (ch === 2 && K.pressed) s.e = Math.min(1, s.e + dt * 0.3); var w = ch === 0 ? [0.75, 0.15, 0.1] : ch === 1 ? [0.1, 0.8, 0.1] : [0.05 + s.e * 0.45, 0.05 + s.e * 0.3, 0.9 - s.e * 0.75], tg = s.V[0].clone().multiplyScalar(w[0]).add(s.V[1].clone().multiplyScalar(w[1])).add(s.V[2].clone().multiplyScalar(w[2])); tg.z = 0.1; s.pos.lerp(tg, dt * 3); s.pt.position.copy(s.pos); },
      rules: [function (v, c, s) { return s.seen.c0 && s.seen.c1 && s.seen.c2; }, function (v, c, s) { return s.e >= 1; }], msg: function (v, ch, s) { return s.e >= 1 ? '卡里斯玛的日常化：先知去世后，追随者要么立规章，要么立传统' : ch === 2 ? '几乎是纯粹的卡里斯玛。按住画面看它能维持多久' : '每个真实的组织都是三种类型按不同比例的混合'; } }
  ]);

  /* ── 帕森斯 · AGIL ── */
  var AG = ['A 适应（经济）', 'G 目标达成（政治）', 'I 整合（法律规范）', 'L 模式维持（文化教育）'];
  function quad(K, s) { s.q = AG.map(function (n, i) { var m = k.box(K, 1.05, 0.7, 0.08, [C.AM, C.RED, C.CY, C.PU][i], -0.95 + (i % 2) * 1.2, 1.85 - Math.floor(i / 2) * 0.85, 0); k.lab(K, n, -0.95 + (i % 2) * 1.2, 1.85 - Math.floor(i / 2) * 0.85, 0.1, '#ffffff', 0.1); return m; }); s.g = A.gauges(K, ['系统稳定'], [C.GR], -2.0, -2.0, 0.2, 1.3); }
  A.model('parsons_agil', '帕森斯 · AGIL 功能系统', '从一个小社团到一个国家，任何社会系统要在动荡的环境里活下去，都得同时解决哪四个问题？', [
    { name: '四个功能', hint: '用四个按钮依次点亮四个象限：对外的适应和目标达成，对内的整合和模式维持。', bt: ['A 适应', 'G 目标达成', 'I 整合', 'L 模式维持'],
      scene: quad, tick: function (K, s) { var n = 0; s.q.forEach(function (m, i) { var on = !!s.b[i]; if (on) n++; A.op(m, on ? 1.3 : 0.2); }); s.g[0].set(n / 4); },
      rules: [function (v, c, s) { return s.b[0] && s.b[1]; }, function (v, c, s) { return s.b[0] && s.b[1] && s.b[2] && s.b[3]; }], msg: function (v, c, s) { return s.b[0] && s.b[1] && s.b[2] && s.b[3] ? '四个象限都亮了：系统达到均衡' : s.b[0] && s.b[1] ? '对外的两个解决了；内部靠什么不散？' : ''; } },
    { name: '控制的层级', hint: '用按钮让文化价值（L）或法律规范（I）受损，然后拖动滑杆往经济（A）里猛加资源，看稳定度；再点「修复」。', sl: [['向经济（A）注入的资源', 0.3, C.AM]], bt: ['💥 价值与规范受损', '🩹 修复价值共识与法律'],
      scene: quad, onBt: function (K, s, j) { s.broken = j === 0; if (j === 1) s.fixed = 1; },
      tick: function (K, s, dt, t, v) { A.op(s.q[0], 0.4 + v[0]); A.op(s.q[1], 1); A.op(s.q[2], s.broken ? 0.12 : 1.2); A.op(s.q[3], s.broken ? 0.12 : 1.2); s.g[0].set(s.broken ? 0.25 + v[0] * 0.08 : 0.6 + v[0] * 0.4); if (s.broken && v[0] > 0.85) s.tried = 1; },
      rules: [function (v, c, s) { return s.tried; }, function (v, c, s) { return s.tried && s.fixed && !s.broken; }], msg: function (v, c, s) { return s.broken ? (v[0] > 0.85 ? '钱加得再多也稳不住：能量高的一侧受信息高的一侧控制' : '文化和规范坏了。试试只靠加大经济投入') : s.fixed ? '共识和规范修好了，循环重新转了起来' : ''; } }
  ]);

  /* ── 默顿 · 显功能与潜功能 ── */
  A.model('merton_manifest_latent', '默顿 · 显功能与潜功能', '祈雨舞求不来雨，为什么还一代代跳下去？', [
    { name: '透视', hint: '部落围成一圈跳祈雨舞。拖动“社会学透视”滑杆，从他们自己说的目的，看到他们没有察觉的后果。', sl: [['社会学透视', 0, C.PU]],
      scene: function (K, s) { s.pts = A.ring(12, 1.1, 1.4, -0.4); s.c = A.crowd(K, 12, 0.18); s.ln = K.line([P(0, 0, 0), P(0, 0, 0)], K.lineMat(C.PU, 0)); s.rain = k.lab(K, '☁ 雨没有来', -0.4, 2.45, 0, '#9aa7b5', 0.14); },
      tick: function (K, s, dt, t, v) { var pts = []; s.c.draw(function (i) { var a = i / 12 * TAU + t * 0.4, x = -0.4 + Math.cos(a) * 1.1, h = 1.4 + Math.sin(a) * 0.8; pts.push(P(x, h, 0)); return [x, h, 0, 1, 0.7, 0.3]; }); pts.push(pts[0]); for (var i = 0; i < 6; i++) pts.push(pts[i], pts[i + 6]); K.setLine(s.ln, pts); s.ln.material.opacity = v[0]; },
      rules: [function (v, c, s) { return s.t > 1.5; }, function (v) { return v[0] > 0.85; }], msg: function (v) { return v[0] > 0.85 ? '潜功能：分散的人定期聚到一起，重申了他们是一个群体（紫线）' : '显功能：参与者意图中的、自己说得出的目的 —— 求雨'; } },
    { name: '反功能', hint: '一项考核制度。拖动滑杆让它越来越严，看“合规”和“把程序当目的”两根柱子；再点「算一算净余额」。', sl: [['考核的严苛度', 0.2, C.RED]], bt: ['⚖ 算一算净余额'],
      scene: function (K, s) { s.g = A.gauges(K, ['合规（显功能）', '目标置换（反功能）', '净效果'], [C.GR, C.RED, C.GOLD], -1.3, 0.5, -0.3); },
      tick: function (K, s, dt, t, v) { var good = Math.sqrt(v[0]), bad = v[0] * v[0]; s.g[0].set(good); s.g[1].set(bad); s.g[2].set(clamp(0.2 + good - bad, 0, 1)); },
      rules: [function (v) { return v[0] > 0.85; }, function (v, c, s) { return s.b[0] && v[0] > 0.85 || (s.b[0] && s.t > 3); }], msg: function (v, c, s) { return s.b[0] ? '把正功能和反功能都摆出来算，才知道一项制度该不该改、往哪改' : v[0] > 0.85 ? '规则太严：官员把“不出错地走完程序”当成了目的本身' : ''; } }
  ]);

  /* ── 齐美尔 · 二人与三人 ── */
  function trio(K, s) { s.p = [A.person(K, C.AM, -1.2, 0.8, 0, 1.5, '甲'), A.person(K, C.CY, 0.5, 0.8, 0, 1.5, '乙'), A.person(K, C.GOLD, -0.35, 1.9, 0, 1.3, '丙')]; s.l = [K.line([P(-1.2, 1.2, 0), P(0.5, 1.2, 0)], K.lineMat(C.WH, 0.9)), K.line([P(-1.2, 1.2, 0), P(-0.35, 2.2, 0)], K.lineMat(C.GOLD, 0.9)), K.line([P(0.5, 1.2, 0), P(-0.35, 2.2, 0)], K.lineMat(C.GOLD, 0.9))]; }
  A.model('simmel_dyad_triad', '齐美尔 · 社会关系形式', '从两个人变成三个人，为什么比从三个人变成一千个人带来的变化还要深？', [
    { name: '二人与三人', hint: '先点「让乙离开」，看两个人的关系；再点「加入第三个人」。', bt: ['🚪 让乙离开', '➕ 加入第三个人'],
      scene: trio, onBt: function (K, s, j) { if (j === 0) s.left = !s.three; if (j === 1) { s.three = true; s.left = false; } },
      tick: function (K, s) { s.p[1].visible = !s.left; s.p[2].visible = !!s.three; s.l[0].visible = !s.left; s.l[1].visible = s.l[2].visible = !!s.three; },
      rules: [function (v, c, s) { return s.b[0] > 0; }, function (v, c, s) { return s.three; }], msg: function (v, c, s) { return s.three ? '三个人：出现了间接的连线、二对一的多数，和一个超出个人的“群体”' : s.left ? '一个人走了，“我们”就不存在了：二人关系完全系于双方' : ''; } },
    { name: '第三者的角色', hint: '甲和乙正在对立。用按钮让丙扮演三种角色。', ch: ['调解人', '渔翁得利者', '分而治之者'],
      scene: function (K, s) { trio(K, s); s.three = true; }, tick: function (K, s, dt, t, v, ch) { s.l[0].material.color.setHex(ch === 0 ? C.GR : C.RED); s.l[0].material.opacity = ch === 2 ? 0.25 + 0.2 * Math.sin(t * 8) : 0.9; s.p[2].scale.setScalar(ch === 0 ? 1.3 : 1.7); A.col(s.p[2], ch === 0 ? C.GOLD : C.RED); },
      rules: [function (v, c, s) { return s.seen.c0 && s.t > 1.5; }, function (v, c, s) { return s.seen.c1 && s.seen.c2; }], msg: function (v, ch) { return ['不偏不倚：把双方的话去掉火气再转达，对立缓和了', '甲乙相争，丙坐着就得了好处', '丙有意挑起并维持甲乙的不和，好统治两边'][ch]; } }
  ]);

  /* ── 米德 · 自我 ── */
  A.model('mead_self', '米德 · 自我形成理论', '婴儿并不是生来就有“自我”。人是怎样靠扮演别人，把整个社会装进脑子里的？', [
    { name: '玩耍与游戏', hint: '拖动滑杆：左边是“玩耍”，孩子一次只扮演一个人；往右是“游戏”，她得同时想着场上所有人会怎么做。', sl: [['角色采择的复杂度', 0.05, C.GOLD]],
      scene: function (K, s) { s.kid = A.person(K, C.AM, -0.4, 1.0, 0, 1.3, '孩子'); s.pts = A.ring(8, 1.25, 1.4, -0.4); s.o = s.pts.map(function (p, i) { var m = K.person([C.CY, C.PU, C.GR][i % 3], 0.9); m.position.copy(p); m.position.y -= 0.25; return m; }); s.ln = s.pts.map(function (p) { return K.line([P(-0.4, 1.5, 0), p], K.lineMat(C.GOLD, 0)); }); },
      tick: function (K, s, dt, t, v) { var n = v[0] < 0.3 ? 1 : Math.round(1 + (v[0] - 0.3) / 0.7 * 7), cur = Math.floor(t * 0.7) % 8; s.ln.forEach(function (l, i) { l.material.opacity = v[0] < 0.3 ? (i === cur ? 0.9 : 0) : (i < n ? 0.8 : 0); }); if (v[0] < 0.2) s.pl = 1; },
      rules: [function (v, c, s) { return s.pl && s.t > 2; }, function (v) { return v[0] > 0.92; }], msg: function (v) { return v[0] > 0.92 ? '概化他人：她心里同时装着所有位置的期待 —— 这时才有了完整的自我' : v[0] < 0.3 ? '玩耍：一会儿是妈妈，一会儿是医生，一次一个' : ''; } },
    { name: '主我与客我', hint: '拖动滑杆在“客我”（内化了的别人的期待）和“主我”（此刻自发的回应）之间移动。', sl: [['客我 Me ←→ 主我 I', 0.1, C.PU]],
      scene: function (K, s) { s.g = A.gauges(K, ['遵循惯例', '创造与改变'], [C.CY, C.AM], -0.9, 0.3, -0.3); s.me = A.person(K, C.CY, -2.0, 0.6, 0.3, 1.4); },
      tick: function (K, s, dt, t, v) { s.g[0].set(1 - v[0]); s.g[1].set(v[0]); A.col(s.me, v[0] > 0.5 ? C.AM : C.CY); if (v[0] < 0.2) s.lo = 1; },
      rules: [function (v, c, s) { return s.lo && s.t > 1.5; }, function (v) { return v[0] > 0.85; }], msg: function (v) { return v[0] > 0.85 ? '主我：对情境给出没人预料到的回应，共同体也因此被改变' : v[0] < 0.2 ? '客我：我所采取的别人的态度的总和' : ''; } }
  ]);

  /* ── 库利 · 镜中我 ── */
  A.model('cooley_looking_glass', '库利 · 镜中我', '“我是个什么样的人”这个认识，来自独处时的内省，还是来自别人的眼神折射回来的那面“镜子”？', [
    { name: '三道折射', hint: '依次点亮三步；再拖动“我猜别人怎么评价我”的滑杆，看自我感觉。', sl: [['我想象中别人的评价', 0.5, C.GOLD]], bt: ['一：我想象我在别人眼里的样子', '二：我想象别人怎么评价', '三：由此生出自豪或羞愧'],
      scene: function (K, s) { s.me = A.person(K, C.AM, -1.4, 0.8, 0, 1.5, '我'); s.o = A.person(K, C.CY, 0.6, 0.8, 0, 1.5, '他人'); s.mir = k.box(K, 0.06, 1.3, 0.8, C.WH, -0.4, 1.3, 0); s.L = [K.line([P(-1.4, 1.6, 0), P(-0.4, 1.6, 0)], K.lineMat(C.GOLD, 0)), K.line([P(-0.4, 1.6, 0), P(0.6, 1.6, 0)], K.lineMat(C.GOLD, 0)), K.line([P(0.6, 1.3, 0), P(-1.4, 1.3, 0)], K.lineMat(C.PU, 0))]; s.g = A.gauges(K, ['自我感觉'], [C.GR], -2.1, -2.1, 0.3, 1.3); },
      tick: function (K, s, dt, t, v) { s.L.forEach(function (l, i) { l.material.opacity = s.b[i] ? 0.9 : 0; }); s.g[0].set(s.b[2] ? v[0] : 0.5); s.g[0].col(v[0] > 0.5 ? C.GR : C.RED); if (s.b[2] && v[0] > 0.85) s.hi = 1; if (s.b[2] && v[0] < 0.15) s.lo = 1; },
      rules: [function (v, c, s) { return s.b[0] && s.b[1] && s.b[2]; }, function (v, c, s) { return s.hi && s.lo; }], msg: function (v, c, s) { return s.b[2] ? (v[0] > 0.6 ? '自豪' : v[0] < 0.4 ? '羞愧' : '') + '：这份感觉来自“我想象中”的评价，不一定是别人真的那样想' : ''; } },
    { name: '校准镜子', hint: '拖动两根滑杆：亲近的人给的支持，和你自己那层“过度敏感的滤镜”。', sl: [['初级群体的支持', 0.2, C.GR], ['过度敏感的滤镜', 0.9, C.RED]],
      scene: function (K, s) { s.g = A.gauges(K, ['镜子的失真', '不必要的羞耻'], [C.PU, C.RED], -0.9, 0.3, -0.3); },
      tick: function (K, s, dt, t, v) { var d = clamp(v[1] - v[0] * 0.6, 0, 1); s.g[0].set(d); s.g[1].set(d * 0.9); },
      rules: [function (v) { return v[1] < 0.5 || v[1] > 0.5; }, function (v) { return v[0] > 0.8 && v[1] < 0.3; }], msg: function (v) { return v[0] > 0.8 && v[1] < 0.3 ? '家人和挚友这面镜子比较平：它让你看别的镜子时不那么走样' : '被人看见是一回事；在想象里给别人的眼光加了多大分量，是另一回事'; } }
  ]);

  /* ── 格兰诺维特 · 弱关系 ── */
  function clusters(K, s) { s.pts = []; s.gr = []; var i, g; for (g = 0; g < 4; g++) for (i = 0; i < 5; i++) { var a = i / 5 * TAU; s.pts.push(P(-1.2 + (g % 2) * 1.7 + Math.cos(a) * 0.38, 1.9 - Math.floor(g / 2) * 1.0 + Math.sin(a) * 0.3, 0)); s.gr.push(g); } s.net = A.net(K, s.pts, C.CY, 0.07); for (g = 0; g < 4; g++) for (i = 0; i < 5; i++) s.net.link(g * 5 + i, g * 5 + (i + 1) % 5, C.WH, 0.6); s.br = [[1, 7], [8, 17], [12, 3]].map(function (q) { return K.line([s.pts[q[0]], s.pts[q[1]]], K.lineMat(C.GOLD, 0, true)); }); }
  A.model('granovetter_weak_ties', '格兰诺维特 · 弱关系力量', '找工作、找新点子的时候，为什么不常联系的“点头之交”往往比天天见面的死党更有用？', [
    { name: '强关系的圈子', hint: '四个紧密的小圈子。点「放出一条求职消息」，看它传到哪里；再点「两个强关系能当桥吗」。', bt: ['📣 放出一条求职消息', '🔗 两个强关系能当桥吗'],
      scene: function (K, s) { clusters(K, s); s.sp = 0; },
      tick: function (K, s, dt) { if (s.b[0]) s.sp = Math.min(1, s.sp + dt * 0.5); s.net.nd.forEach(function (m, i) { A.col(m, s.b[0] && s.gr[i] === 0 && (i % 5) / 5 < s.sp ? C.GOLD : C.CY); }); },
      rules: [function (v, c, s) { return s.sp >= 1; }, function (v, c, s) { return s.b[1] > 0; }], msg: function (v, c, s) { return s.b[1] ? '如果甲和乙、甲和丙都是强关系，乙和丙多半也认识：所以强关系很难是通往别的圈子的唯一的桥' : s.sp >= 1 ? '消息只在一个圈子里打转（覆盖 25%）：死党知道的，你也都知道' : ''; } },
    { name: '弱关系的桥', hint: '拖动滑杆，在圈子之间搭起几条虚线的“弱关系”，再看消息能传多远。', sl: [['跨圈子的弱关系', 0, C.GOLD]],
      scene: clusters, tick: function (K, s, dt, t, v) { var n = Math.round(v[0] * 3); s.br.forEach(function (l, i) { l.material.opacity = i < n ? 0.95 : 0; }); s.net.nd.forEach(function (m, i) { A.col(m, s.gr[i] <= n ? C.GOLD : C.CY); }); s.cov = (n + 1) / 4; },
      rules: [function (v, c, s) { return s.cov >= 1; }, function (v, c, s) { return s.cov >= 1 && s.t > 3; }], msg: function (v, c, s) { return s.cov >= 1 ? '三条不起眼的虚线，覆盖率从 25% 到了 100%：把社会连成一片的，正是弱关系' : '覆盖 ' + Math.round(s.cov * 100) + '%'; } }
  ]);

  /* ── 米尔格拉姆 · 小世界 ── */
  function ringW(K, s) { s.pts = A.ring(24, 1.25, 1.4, -0.4); s.net = A.net(K, s.pts, C.CY, 0.06); for (var i = 0; i < 24; i++) s.net.link(i, (i + 1) % 24, C.WH, 0.5); s.sc = [[2, 14], [6, 19], [10, 22], [0, 12]].map(function (q) { return K.line([s.pts[q[0]], s.pts[q[1]]], K.lineMat(C.GOLD, 0)); }); s.hop = k.lab(K, '', -0.4, 1.4, 0.1, '#ffffff', 0.16); }
  A.model('milgram_small_world', '米尔格拉姆 · 小世界网络', '世界上几十亿人。为什么任意两个陌生人之间，大约隔着六个熟人就能把一封信传到？', [
    { name: '只认识邻居', hint: '一圈人，每人只认识左右邻居。点「传一封信到对面」，数一数要几步；再点「米尔格拉姆的实验结果」。', bt: ['✉ 传一封信到对面', '📊 米尔格拉姆的实验结果'],
      scene: function (K, s) { ringW(K, s); s.p = 0; }, tick: function (K, s, dt) { if (s.b[0]) s.p = Math.min(12, s.p + dt * 4); s.net.nd.forEach(function (m, i) { A.col(m, s.b[0] && i <= s.p ? C.GOLD : C.CY); }); K.text(s.hop, s.b[1] ? '实测：平均约 5–6 步' : s.b[0] ? '第 ' + Math.floor(s.p) + ' 步' : ''); },
      rules: [function (v, c, s) { return s.p >= 12; }, function (v, c, s) { return s.b[1] > 0; }], msg: function (v, c, s) { return s.b[1] ? '从内布拉斯加寄到波士顿的信，中间人平均只有五六个' : s.p >= 12 ? '12 步：邻里很紧密，可要到远处就得一个个挨着传' : ''; } },
    { name: '几条捷径', hint: '拖动滑杆，随机加上几条跨越圆圈的“捷径”，看平均步数；再点「谁在转信」。', sl: [['随机长程连接的比例 p', 0, C.GOLD]], bt: ['🧭 谁在转信'],
      scene: ringW, tick: function (K, s, dt, t, v) { var n = Math.round(v[0] * 4); s.sc.forEach(function (l, i) { l.material.opacity = i < n ? 0.95 : 0; }); s.L = [6.2, 4.1, 3.2, 2.7, 2.4][n]; K.text(s.hop, '平均 ' + s.L.toFixed(1) + ' 步'); s.net.nd.forEach(function (m, i) { var hub = s.b[0] && (i === 2 || i === 14); A.col(m, hub ? C.GOLD : C.CY); m.scale.setScalar(hub ? 2 : 1); }); },
      rules: [function (v, c, s) { return s.L < 3.5; }, function (v, c, s) { return s.b[0] > 0 && s.L < 3.5; }], msg: function (v, c, s) { return s.b[0] ? '大部分信在最后一步都经过少数几个人：他们是漏斗口' : s.L < 3.5 ? '只加了几条捷径，全网的距离就塌缩了；邻里的紧密却没变' : ''; } }
  ]);

  /* ── 谢林 · 隔离模型 ── */
  function board(K, s) { s.N = 10; s.g = []; var i; var r = 12345; for (i = 0; i < 100; i++) { r = (r * 1103515245 + 12345) & 0x7fffffff; var u = r / 0x7fffffff; s.g.push(u < 0.14 ? 0 : u < 0.57 ? 1 : 2); } s.c = A.crowd(K, 100, 0.13); s.th = 0.33; }
  function unhappy(s, i) { var g = s.g[i]; if (!g) return false; var x = i % 10, y = Math.floor(i / 10), same = 0, tot = 0, dx, dy; for (dx = -1; dx <= 1; dx++) for (dy = -1; dy <= 1; dy++) { if (!dx && !dy) continue; var nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx > 9 || ny > 9) continue; var o = s.g[ny * 10 + nx]; if (o) { tot++; if (o === g) same++; } } return tot > 0 && same / tot < s.th; }
  function stepB(s) { var u = [], e = [], i; for (i = 0; i < 100; i++) { if (!s.g[i]) e.push(i); else if (unhappy(s, i)) u.push(i); } if (!u.length || !e.length) return 0; var a = u[Math.floor(Math.random() * u.length)], b = e[Math.floor(Math.random() * e.length)]; s.g[b] = s.g[a]; s.g[a] = 0; return 1; }
  function seg(s) { var same = 0, tot = 0, i; for (i = 0; i < 100; i++) { if (!s.g[i]) continue; var x = i % 10; if (x < 9 && s.g[i + 1]) { tot++; if (s.g[i + 1] === s.g[i]) same++; } if (i < 90 && s.g[i + 10]) { tot++; if (s.g[i + 10] === s.g[i]) same++; } } return tot ? same / tot : 0; }
  function drawB(K, s) { s.c.draw(function (i) { var g = s.g[i], u = g && unhappy(s, i); return [-1.5 + (i % 10) * 0.25, 0.7 + Math.floor(i / 10) * 0.17, 0, g === 1 ? 1 : g === 2 ? 0.3 : 0.08, g === 1 ? (u ? 0.3 : 0.65) : g === 2 ? (u ? 0.5 : 0.8) : 0.08, g === 2 ? 1 : g === 1 ? 0.2 : 0.08]; }); }
  A.model('schelling_segregation', '谢林 · 社会隔离模型', '每个居民都很宽容，谁也不想住进清一色的街区，只是“不愿做周围唯一的少数”。为什么最后整座城还是分成了一块一块？', [
    { name: '一个人搬家', hint: '每个人只要求周围有三分之一和自己一样。点「搬走一位不满意的人」，再按住画面（或空格）让大家接着搬。', bt: ['🚚 搬走一位不满意的人'],
      scene: function (K, s) { board(K, s); s.acc = 0; s.sl2 = k.lab(K, '', -0.4, 2.55, 0, '#ffffff', 0.14); }, onBt: function (K, s) { s.mv = (s.mv || 0) + stepB(s); },
      tick: function (K, s, dt) { if (K.pressed) { s.acc += dt; while (s.acc > 0.05) { s.acc -= 0.05; s.mv = (s.mv || 0) + stepB(s); } } drawB(K, s); s.sg = seg(s); K.text(s.sl2, '同色相邻的比例：' + Math.round(s.sg * 100) + '%'); },
      rules: [function (v, c, s) { return s.mv >= 1; }, function (v, c, s) { return s.sg > 0.72 && s.mv > 15; }], msg: function (v, c, s) { return s.sg > 0.72 && s.mv > 15 ? '没有人想要隔离，棋盘却自己聚成了一块块纯色' : s.mv ? '他一走，原来满意的旧邻居也成了少数，跟着要搬' : ''; } },
    { name: '临界点', hint: '拖动“至少要有多少同类邻居”的滑杆，按住画面（或空格）让大家搬家：先停在很低的位置，再推过三四成。', sl: [['对同类邻居的最低要求', 0.1, C.GOLD]], bt: ['↺ 重新洗牌'],
      scene: function (K, s) { board(K, s); s.acc = 0; s.sl2 = k.lab(K, '', -0.4, 2.55, 0, '#ffffff', 0.14); s.lo = 0; }, onBt: function (K, s) { board(K, s); },
      tick: function (K, s, dt, t, v) { s.th = v[0] * 0.8; if (K.pressed) { s.acc += dt; while (s.acc > 0.04) { s.acc -= 0.04; stepB(s); } } drawB(K, s); s.sg = seg(s); K.text(s.sl2, '要求 ' + Math.round(s.th * 100) + '% · 同色相邻 ' + Math.round(s.sg * 100) + '%'); if (s.th < 0.2 && K.pressed) s.lo += dt; },
      rules: [function (v, c, s) { return s.lo > 1.5 && s.sg < 0.65; }, function (v, c, s) { return s.th > 0.33 && s.sg > 0.78; }], msg: function (v, c, s) { return s.th > 0.33 && s.sg > 0.78 ? '只是从“两成”提到“四成”，整座城的隔离度就跳了上去' : s.th < 0.2 ? '要求很低：混居稳得住' : ''; } }
  ]);

  /* ── 奥尔森 · 集体行动 ── */
  A.model('olson_collective_action', '奥尔森 · 集体行动的逻辑', '一件事对群体里每个人都有好处。为什么人一多，反而谁也不肯出钱出力？', [
    { name: '群体的大小', hint: '拖动滑杆把群体从 5 个人扩大到 5000 人，看每个人分到的好处，和愿意出力的人。', sl: [['群体人数（5 → 5000）', 0, C.GOLD]],
      scene: function (K, s) { s.c = A.crowd(K, 80, 0.12); s.g = A.gauges(K, ['每人分到的好处', '出力的人'], [C.GOLD, C.GR], 0.7, 1.25, -0.3); s.nl = k.lab(K, '', -0.6, 2.5, 0, '#ffffff', 0.15); },
      tick: function (K, s, dt, t, v) { var N = Math.round(5 * Math.pow(1000, v[0])), show = Math.min(80, Math.max(5, Math.round(5 + v[0] * 75))), act = clamp(1 - v[0] * 1.3, 0.02, 1); s.c.draw(function (i, p) { var on = i < show; return [-0.6 + p.x * 1.2, on ? 1.4 + p.z * 0.8 : -9, 0, i < show * act ? 0.4 : 0.45, i < show * act ? 1 : 0.45, i < show * act ? 0.6 : 0.5]; }); s.g[0].set(1 / Math.sqrt(N / 5)); s.g[1].set(act); K.text(s.nl, N + ' 人'); if (v[0] < 0.1) s.sm = 1; },
      rules: [function (v, c, s) { return s.sm && s.t > 1.5; }, function (v) { return v[0] > 0.9; }], msg: function (v) { return v[0] > 0.9 ? '我出不出力，结果几乎没差别，好处却照样有份：人人都在等别人' : v[0] < 0.1 ? '五个人：每人拿到的好处够大，谁偷懒也一眼看得见' : ''; } },
    { name: '选择性激励', hint: '一个五千人的大集团。用两个开关：只给出力者的专属好处、对不出力者的约束。', bt: ['🎁 会员专属福利', '📏 对不参与者的约束'],
      scene: function (K, s) { s.c = A.crowd(K, 80, 0.12); s.g = A.gauges(K, ['公共物品的供给'], [C.GR], 1.0, 1.0, -0.3); s.k = 0.03; },
      tick: function (K, s, dt) { var tg = 0.03 + (s.b[0] ? 0.5 : 0) + (s.b[1] ? 0.42 : 0); s.k = lerp(s.k, tg, dt * 2); s.c.draw(function (i, p) { var on = i < 80 * s.k; return [-0.6 + p.x * 1.2, 1.4 + p.z * 0.8, 0, on ? 0.4 : 0.45, on ? 1 : 0.45, on ? 0.6 : 0.5]; }); s.g[0].set(s.k); },
      rules: [function (v, c, s) { return s.b[0] > 0; }, function (v, c, s) { return s.b[0] && s.b[1] && s.k > 0.85; }], msg: function (v, c, s) { return s.b[0] && s.b[1] ? '奖和罚都只落在个人头上：大集团动起来了' : s.b[0] ? '工会的保险、协会的期刊、行业的执照：只有加入的人才有' : ''; } }
  ]);

  /* ── 帕特南 · 社会资本 ── */
  A.model('putnam_social_capital', '帕特南 · 社会资本', '制度一样、拨款一样的两个地区，为什么一个办事清廉高效，另一个陷在猜忌和低效里？', [
    { name: '独自打保龄', hint: '一群各过各的居民。拖动滑杆让他们参加社团、彼此连起来，看信任和办事的成本。', sl: [['社团参与和横向联系', 0, C.GOLD]],
      scene: function (K, s) { s.pts = A.ring(16, 1.2, 1.4, -0.6); s.net = A.net(K, s.pts, C.CY, 0.07); s.L = []; for (var i = 0; i < 16; i++) for (var j = 1; j <= 3; j++) s.L.push(s.net.link(i, (i + j * 3) % 16, C.GOLD, 0)); s.g = A.gauges(K, ['信任', '监督与扯皮的成本'], [C.GR, C.RED], 0.75, 1.3, -0.3); },
      tick: function (K, s, dt, t, v) { s.L.forEach(function (l, i) { l.material.opacity = i < v[0] * s.L.length ? 0.6 : 0; }); s.g[0].set(0.1 + v[0] * 0.9); s.g[1].set(0.95 - v[0] * 0.85); if (v[0] < 0.1) s.lo = 1; },
      rules: [function (v, c, s) { return s.lo && s.t > 1.5; }, function (v) { return v[0] > 0.9; }], msg: function (v) { return v[0] > 0.9 ? '广义的互惠：我现在帮你，不指望你还，相信将来会有人帮我' : v[0] < 0.1 ? '谁也不认识谁：每件事都得白纸黑字、找人盯着' : ''; } },
    { name: '粘合与桥接', hint: '两根滑杆：圈子内部的“粘合”，和圈子之间的“桥接”。先只拉高粘合，再把桥接也拉上来。', sl: [['粘合型（圈内）', 0.2, C.AM], ['桥接型（跨圈）', 0.05, C.CY]],
      scene: function (K, s) { s.g = A.gauges(K, ['圈内互助', '对外的排斥', '整体治理效能'], [C.AM, C.RED, C.GR], -1.3, 0.5, -0.3); },
      tick: function (K, s, dt, t, v) { s.g[0].set(v[0]); s.g[1].set(clamp(v[0] - v[1], 0, 1)); s.g[2].set(clamp(v[0] * 0.3 + v[1] * 0.7, 0, 1)); if (v[0] > 0.8 && v[1] < 0.3) s.bond = 1; },
      rules: [function (v, c, s) { return s.bond; }, function (v, c, s) { return s.bond && v[0] > 0.7 && v[1] > 0.8; }], msg: function (v) { return v[0] > 0.7 && v[1] > 0.8 ? '既有“强力胶”又有“润滑剂”：圈内互相扶持，整个社会也能合作' : v[0] > 0.8 && v[1] < 0.3 ? '只有粘合：自己人很亲，对外人很防' : ''; } }
  ]);
})();
