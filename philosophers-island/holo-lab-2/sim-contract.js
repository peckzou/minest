/* Minest · 全息模型 · 洛克自然权利 / 霍布斯社会契约 / 卢梭公意 — lab models #51 #50 #52 rebuilt as holograms:
   a crowd of people in the volume that reacts to the same parameters and choices as the 2D models. */
(function () {
  'use strict';
  var HL = window.HL, T = window.THREE; if (!HL || !T || !HL.sims || !HL.simQ) return;
  var FY = -0.62, AM = 0xffa23a, CY = 0x46d2ff, RED = 0xff7a7a, GR = 0x7dffb0, GOLD = 0xffd96b, TAU = Math.PI * 2;
  function V(x, y, z) { return new T.Vector3(x, y, z); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function msg(K, y) { var m = K.label('', { h: 0.14, color: '#ffffff' }); m.position.set(0, FY + (y || 2.2), 0); return m; }
  function crowd(K, n) { var c = { d: K.dots(n, 0.15), P: [] }; for (var i = 0; i < n; i++) { var a = i * 2.399963, r = Math.sqrt((i + 0.5) / n); c.P.push({ x: Math.cos(a) * r, z: Math.sin(a) * r, ph: i * 1.7, a: a }); } return c; }
  var SL = { pick: function (K, x, y) { return K.slPick(x, y); }, dragStart: function (K, h, x) { K.slStart(h, x); }, dragMove: function (K, h, x) { K.slMove(h, x); } };
  function stage(o) { o.pick = o.pick || SL.pick; o.dragStart = o.dragStart || SL.dragStart; o.dragMove = o.dragMove || SL.dragMove; return o; }
  function choice(K, box, list, key) { var s = K.st; list.forEach(function (n, i) { HL.ui.chip(box, n, s[key] === i, function () { s[key] = i; s.seen = s.seen || {}; s.seen[key + i] = 1; HL.refreshTools(); }); }); }

  /* ═════════════ 霍布斯 ═════════════ */
  var QH = HL.simQ.hobbes;
  var H1 = stage({ name: '冲突三根源', hint: '拖动三个滑块：资源稀缺（竞争）、彼此猜忌（猜疑）、对名声的渴求（荣誉）。看人群什么时候开始先下手为强。', quotes: QH[0],
    init: function (K) { var s = K.st; K.grid(0, FY, 3.4, 2.4, 0x46d2ff, -0.3); s.c = crowd(K, 50); s.a = K.slider('竞争', -2.1, FY + 0.5, 0.2, AM, 1.1); s.b = K.slider('猜疑', -0.7, FY + 0.5, 0.2, RED, 1.1); s.g = K.slider('荣誉', 0.7, FY + 0.5, 0.2, GOLD, 1.1); s.msg = msg(K, 1.9); },
    update: function (K, dt, t) { var s = K.st, k = (s.a.v + s.b.v + s.g.v) / 3; if (k > 0.6) K.hit(0); if (s.b.v >= 0.85) K.hit(1);
      s.c.P.forEach(function (p, i) { var j = k * 0.12, hot = k > 0.35 && Math.sin(t * 6 * k + p.ph) > 0.4; s.c.d.set(i, p.x * 1.5 + Math.sin(t * 9 + p.ph) * j, FY + 0.2, p.z * 1.0 - 0.3 + Math.cos(t * 8 + p.ph) * j); s.c.d.rgb(i, hot ? 1 : 0.5, hot ? 0.3 : 0.8, hot ? 0.3 : 1); }); s.c.d.flush();
      K.text(s.msg, s.b.v >= 0.85 ? '就算不贪婪，也会因为恐惧而先发制人' : k > 0.6 ? '能力大体相等的人，为了自保各自抢先动手' : ''); K.info('冲突度 ' + Math.round(k * 100) + '% —— 人与人能力大体相等，所以谁都不安全'); } });
  var CIV = ['耕作', '航海', '建筑', '科学'];
  var H2 = stage({ name: '一切人对一切人的战争', hint: '没有公共权力时，看看耕作、航海、建筑、科学四根柱子；再把「公共震慑权威」的滑块拉起来对比。', quotes: QH[1],
    init: function (K) { var s = K.st; s.t = 0; s.c = crowd(K, 50); s.au = K.slider('公共震慑权威', -0.7, FY + 0.45, 0, GOLD, 1.1); s.bars = CIV.map(function (n, i) { var x = -1.5 + i, m = K.mesh(new T.BoxGeometry(0.3, 1, 0.3), K.holo(GR, { core: 0.5 })); K.label(n, { h: 0.12, color: '#ffffff' }).position.set(x, FY + 1.5, -1.1); m.userData.x = x; return m; }); s.msg = msg(K, 2.0); },
    update: function (K, dt, t) { var s = K.st, a = s.au.v; if (a < 0.02) { s.t += dt; if (s.t > 2) K.hit(0); if (s.t > 4.5) K.hit(1); }
      s.bars.forEach(function (m) { var h = 0.04 + a * 1.2; m.scale.y = lerp(m.scale.y, h, dt * 2); m.position.set(m.userData.x, FY + m.scale.y / 2, -1.1); m.material.uniforms.uColor.value.setHex(a < 0.3 ? RED : GR); });
      s.c.P.forEach(function (p, i) { var j = (1 - a) * 0.14; s.c.d.set(i, p.x * 1.5 + Math.sin(t * 9 + p.ph) * j, FY + 0.2, p.z * 0.8 + Math.cos(t * 8 + p.ph) * j); var hot = a < 0.5 && Math.sin(t * 5 + p.ph) > 0.2; s.c.d.rgb(i, hot ? 1 : 0.5, hot ? 0.3 : 0.9, hot ? 0.3 : 0.8); }); s.c.d.flush();
      K.text(s.msg, a < 0.3 ? '没有产业，没有耕种，没有航海……人的生活孤独、贫困、卑污、残忍而短寿' : ''); K.info('公共权威 ' + Math.round(a * 100) + '% —— 战争状态不必天天打仗：只要人人知道随时可能开打'); } });
  var H3 = stage({ name: '缔结契约', hint: '用下方按钮选一种契约，再拖动「主权者佩剑威慑力」：先看只有口头契约会怎样，再看共同把权利交给执剑的利维坦。', quotes: QH[2],
    init: function (K) { var s = K.st; s.ch = 0; s.c = crowd(K, 90); s.sw = K.slider('佩剑威慑力', -0.7, FY + 0.3, 0.5, GOLD, 1.2); s.msg = msg(K, 2.5);
      s.T = s.c.P.map(function (p, i) { var u = i / 90; if (u < 0.18) { var a = u / 0.18 * TAU; return V(Math.cos(a) * 0.2, 1.85 + Math.sin(a) * 0.2, 0); } if (u < 0.6) return V(((i * 7) % 11 - 5) * 0.045, 0.8 + ((i * 13) % 17) / 17 * 0.8, 0); if (u < 0.8) return V((u < 0.7 ? -1 : 1) * (0.3 + ((i * 5) % 9) * 0.05), 1.35 + ((i * 3) % 7) * 0.03, 0); return V((u < 0.9 ? -0.13 : 0.13), 0.1 + ((i * 11) % 13) / 13 * 0.7, 0); }); },
    update: function (K, dt, t) { var s = K.st, lev = s.ch === 2 && s.sw.v >= 0.7; if (s.ch === 0 || s.sw.v < 0.1) K.hit(0); if (lev) K.hit(1); s.k = lerp(s.k || 0, lev ? 1 : 0, dt * 2);
      s.c.P.forEach(function (p, i) { var j = (1 - s.k) * 0.1, tg = s.T[i]; s.c.d.set(i, lerp(p.x * 1.7 + Math.sin(t * 9 + p.ph) * j, tg.x, s.k), lerp(FY + 0.2, FY + tg.y, s.k), lerp(p.z * 0.9 + Math.cos(t * 8 + p.ph) * j, 0, s.k)); var hot = !lev && Math.sin(t * 5 + p.ph) > 0.3; s.c.d.rgb(i, lerp(hot ? 1 : 0.5, 1, s.k), lerp(hot ? 0.3 : 0.8, 0.85, s.k), lerp(hot ? 0.3 : 1, 0.42, s.k)); }); s.c.d.flush();
      K.text(s.msg, lev ? '利维坦：众人把权利交给一个人格，汇成一个共同体 —— 和平与产业恢复' : s.ch === 1 ? '只有你放下武器：等于把自己送给别人当猎物' : '没有剑的契约只是一纸空文，随时被违背'); K.info('契约要有人执行：信守诺言靠的是对违约后果的畏惧'); },
    chips: function (K, box) { choice(K, box, ['口头诺言与一纸契约', '单方面放下武器', '共同让渡 · 建立利维坦'], 'ch'); } });
  HL.sims.define('hobbes', { lift: -0.35, zoom: 1.1, title: '霍布斯 · 社会契约', source: '——', flat: true, core: '人与人的能力和希望大体平等。为什么一旦没有让所有人畏惧的公共权力，理性的人反而会陷入一切人对一切人的战争？', stages: [H1, H2, H3] });

  /* ═════════════ 卢梭 ═════════════ */
  var QR = HL.simQ.rousseau;
  var R1 = stage({ name: '社会契约的根本课题', hint: '拖动滑块：每个公民把自己同等地交给共同体的程度。看枷锁什么时候变成一个由所有人组成的圆。', quotes: QR[0],
    init: function (K) { var s = K.st; s.t = 0; s.c = crowd(K, 60); s.u = K.slider('同等让渡与结合', -0.7, FY + 0.35, 0.2, GR, 1.2); s.msg = msg(K, 2.0); },
    update: function (K, dt, t) { var s = K.st, u = s.u.v; s.t += dt; if (u < 0.5 && s.t > 1.5) K.hit(0); if (u >= 0.95) K.hit(1);
      s.c.P.forEach(function (p, i) { var a = i / 60 * TAU + t * 0.1, strong = i % 12 === 0, x = lerp(p.x * 1.7, Math.cos(a) * 1.2, u), z = lerp(p.z * 0.9, Math.sin(a) * 0.8, u), y = FY + 0.2 + (strong ? (1 - u) * 0.45 : 0); s.c.d.set(i, x, y, z); s.c.d.rgb(i, strong ? lerp(1, 0.5, u) : 0.5, strong ? lerp(0.4, 1, u) : lerp(0.6, 1, u), strong ? lerp(0.3, 0.7, u) : lerp(0.7, 0.7, u)); }); s.c.d.flush();
      K.text(s.msg, u >= 0.95 ? '每个人把自己交给全体，就没有交给任何一个人：服从的只是自己' : u < 0.5 ? '人生而自由，却无往不在枷锁之中：强者高高在上' : ''); K.info('结合度 ' + Math.round(u * 100) + '% —— 条件对所有人相同，就没有人想让它成为别人的负担'); } });
  var R2 = stage({ name: '公意与众意', hint: '用下方按钮切换公民投票时看什么：各自的私利（众意）、让私利相互抵消、还是公共利益（公意）。', quotes: QR[1],
    init: function (K) { var s = K.st; s.ch = 0; s.seen = { ch0: 1 }; s.ar = []; for (var i = 0; i < 24; i++) { var a = i / 24 * TAU; s.ar.push({ l: K.line([V(0, 0, 0), V(0, 0, 0)], K.lineMat(AM, 0.9)), x: Math.cos(a) * 1.4, z: Math.sin(a) * 0.9, d: (i * 2.3) % TAU }); } s.sum = K.line([V(0, 0, 0), V(0, 0, 0)], K.lineMat(GOLD, 1)); s.cen = K.sphere(0.1, K.glow(GOLD, 0.9)); s.cen.position.set(0, FY + 0.3, 0); K.label('共同利益', { h: 0.12, color: '#ffd96b' }).position.set(0, FY + 0.55, 0); s.msg = msg(K, 1.9); },
    update: function (K, dt) { var s = K.st; if (s.seen.ch0 && s.seen.ch2) K.hit(0); if (s.seen.ch1) K.hit(1); s.k = lerp(s.k == null ? 0 : s.k, s.ch, dt * 3);
      s.ar.forEach(function (o) { var p = V(o.x, FY + 0.3, o.z), priv = V(Math.cos(o.d) * 0.45, 0, Math.sin(o.d) * 0.3), pub = V(-o.x, 0, -o.z).multiplyScalar(0.4), w = clamp(s.k - 1, 0, 1), d = priv.clone().multiplyScalar(1 - w * 0.9).add(pub.multiplyScalar(s.k >= 1 ? 0.3 + 0.7 * w : s.k * 0.3)); K.setLine(o.l, [p, p.clone().add(d)]); o.l.material.opacity = s.ch === 1 ? 0.45 : 0.9; });
      s.cen.scale.setScalar(1 + s.k * 0.8); K.text(s.msg, s.ch === 0 ? '众意：只是各人私利的总和，箭头四处乱拉' : s.ch === 1 ? '把这些意志里正负相抵的部分去掉，剩下的差数就是公意' : '公意：只着眼于共同的利益，它永远是正确的'); K.info('公意和众意往往差别很大：前者看公共利益，后者看私人利益'); },
    chips: function (K, box) { choice(K, box, ['众意 · 各看私利', '向量抵消', '公意 · 看公共利益'], 'ch'); } });
  var R3 = stage({ name: '派系与小团体', hint: '拖动「派系抱团」滑块，或用按钮换一种制度：看一个大派系怎样把自己的意志冒充成公意。', quotes: QR[2],
    init: function (K) { var s = K.st; s.ch = 0; s.c = crowd(K, 60); s.f = K.slider('派系抱团与操控', -0.7, FY + 0.35, 0.1, RED, 1.2); s.msg = msg(K, 2.0); },
    update: function (K, dt, t) { var s = K.st, mono = s.ch === 1 || s.f.v >= 0.75, f = s.ch === 1 ? Math.max(s.f.v, 0.9) : s.ch === 2 ? Math.min(s.f.v, 0.4) : s.f.v; if (mono) { K.hit(0); s.was = true; } else if (s.was) K.hit(1);
      s.c.P.forEach(function (p, i) { var inF = i < 60 * (0.25 + f * 0.5), g = s.ch === 2 ? i % 5 : 0, cx = s.ch === 2 ? Math.cos(g / 5 * TAU) * 1.1 : inF ? -0.7 : 0.9, cz = s.ch === 2 ? Math.sin(g / 5 * TAU) * 0.6 : 0, k = s.ch === 2 ? 0.6 : inF ? f : 0; s.c.d.set(i, lerp(p.x * 1.7, cx + p.x * 0.35, k), FY + 0.2, lerp(p.z * 0.9, cz + p.z * 0.25, k)); var c = s.ch === 2 ? [[1, .5, .4], [.5, .8, 1], [.5, 1, .7], [1, .85, .4], [.8, .6, 1]][g] : inF && f > 0.4 ? [1, 0.35, 0.35] : [0.5, 0.85, 1]; s.c.d.rgb(i, c[0], c[1], c[2]); }); s.c.d.flush();
      K.text(s.msg, mono ? '一个集团大到压倒其余时，得到的不再是公意，只是一个特殊的意见' : s.ch === 2 ? '若不能消除派系，就让它们尽量多、彼此不等，互相制衡' : '每个公民只表达自己的意见：公意清晰显现'); K.info('派系操控 ' + Math.round(f * 100) + '%'); },
    chips: function (K, box) { choice(K, box, ['无派系独立审议', '巨型利益集团垄断', '分散制衡'], 'ch'); } });
  HL.sims.define('rousseau', { lift: -0.35, zoom: 1.1, title: '卢梭 · 公意理论', source: '——', flat: true, core: '“公意”和“所有人的私意加起来”到底有什么本质区别？', stages: [R1, R2, R3] });

  /* ═════════════ 洛克 · 自然权利 ═════════════ */
  var QL = HL.simQ.locke_rights;
  var L1 = stage({ name: '自然法与自然权利', hint: '用下方按钮切换自然状态里的三种行为：平等互敬、企图奴役他人、强夺别人的劳动果实。看边界环。', quotes: QL[0],
    init: function (K) { var s = K.st; s.ch = 0; s.t = 0; s.a = K.person(CY, 1.6); s.a.position.set(-0.8, FY, 0); s.b = K.person(AM, 1.6); s.b.position.set(0.8, FY, 0); s.rings = ['生命', '自由', '健康', '财产'].map(function (n, i) { var m = K.mesh(new T.TorusGeometry(0.4 + i * 0.12, 0.012, 6, 60), K.glow(GR, 0.9)); m.position.set(-0.8, FY + 0.4, 0); m.rotation.x = Math.PI / 2 - 0.3; K.label(n, { h: 0.1, color: '#7dffb0' }).position.set(-0.8 - 0.45 - i * 0.13, FY + 0.5 + i * 0.12, 0.3); return m; }); s.msg = msg(K, 1.9); },
    update: function (K, dt, t) { var s = K.st; s.t += dt; if (s.ch === 0 && s.t > 1.5) K.hit(0); if (s.ch > 0) K.hit(1); s.b.position.x = lerp(s.b.position.x, s.ch ? 0.1 : 0.8, dt * 3); s.rings.forEach(function (m, i) { m.material.color.setHex(s.ch ? RED : GR); m.scale.setScalar(1 + (s.ch ? 0.08 * Math.sin(t * 12 + i) : 0)); });
      K.text(s.msg, s.ch === 0 ? '自然状态有自然法：任何人不得侵害他人的生命、健康、自由或财产' : '他越界了：在自然状态中，人人都有权自卫并惩罚违反自然法的人'); K.info('自然状态是自由的状态，却不是放任的状态'); },
    chips: function (K, box) { choice(K, box, ['平等互敬', '企图奴役他人', '强夺他人劳动果实'], 'ch'); } });
  var L2 = stage({ name: '劳动掺入', hint: '大地和橡果原本是共有的。拖动两个滑块：掺入多少劳动、占有多少。看什么时候它成了你的，什么时候又越了界。', quotes: QL[1],
    init: function (K) { var s = K.st; K.grid(0, FY, 3.6, 2.0, 0x7dffb0, -0.2); s.d = K.dots(60, 0.16); s.who = K.person(CY, 1.5); s.who.position.set(-1.5, FY, -0.2); s.lab = K.slider('掺入的劳动', -1.9, FY + 0.4, 0, CY, 1.2); s.amt = K.slider('占有数量', 0.3, FY + 0.4, 0.3, AM, 1.2); s.msg = msg(K, 1.9); },
    update: function (K) { var s = K.st, L = s.lab.v, A = Math.max(0.1, s.amt.v); if (L >= 0.6) K.hit(0); if (L >= 0.6 && A <= 0.5) K.hit(1); if (A >= 0.85) K.hit(2);
      for (var i = 0; i < 60; i++) { var mine = i < 60 * A, rot = mine && A >= 0.85 && i > 60 * 0.5, x = -1.6 + (i % 10) * 0.35, z = -1.0 + Math.floor(i / 10) * 0.3; s.d.set(i, x, FY + 0.12, z); var c = rot ? [0.45, 0.3, 0.2] : mine && L >= 0.6 ? [0.4, 0.85, 1] : mine ? [0.7, 0.75, 0.6] : [0.5, 1, 0.6]; s.d.rgb(i, c[0], c[1], c[2]); } s.d.flush();
      K.text(s.msg, A >= 0.85 ? '占得太多：果实在你手里烂掉，也挤占了别人的份 —— 越出了自然法的界限' : L >= 0.6 ? (A <= 0.5 ? '掺进了你的劳动，又给别人留下足够多、同样好的：它是你的' : '是你的劳动成果，但留给别人的不够了') : '还只是共有物'); K.info('蓝色 = 掺入了你劳动的 · 绿色 = 留给他人的 · 褐色 = 腐烂浪费的'); } });
  var L3 = stage({ name: '政府信托与抵抗权', hint: '用下方按钮切换政府的两种做法：依公布的法律保护权利，或专断地没收人民的财产。看信托的那条线。', quotes: QL[2],
    init: function (K) { var s = K.st; s.ch = 0; s.c = crowd(K, 40); s.gov = K.mesh(new T.BoxGeometry(0.8, 0.5, 0.4), K.holo(GOLD, { core: 0.5 })); s.gov.position.set(0, FY + 1.6, -0.2); K.label('受托的政府', { h: 0.12, color: '#ffd96b' }).position.set(0, FY + 2.0, -0.2); s.ln = K.line([V(0, FY + 0.3, 0), V(0, FY + 1.35, -0.2)], K.lineMat(GOLD, 1)); s.msg = msg(K, 2.4); },
    update: function (K, dt, t) { var s = K.st; K.hit(s.ch); s.k = lerp(s.k || 0, s.ch, dt * 3); s.ln.material.opacity = 1 - s.k; s.gov.material.uniforms.uColor.value.setHex(s.ch ? RED : GOLD);
      s.c.P.forEach(function (p, i) { s.c.d.set(i, p.x * 1.4, FY + 0.2 + s.k * 0.25 * Math.abs(Math.sin(t * 3 + p.ph)), p.z * 0.8); s.c.d.rgb(i, 0.5 + s.k * 0.5, 0.85, 1 - s.k * 0.5); }); s.c.d.flush();
      K.text(s.msg, s.ch ? '政府违背了信托：权力回到当初授予它的人民手里' : '人们结成政府的最大目的，是保全他们的财产 —— 生命、自由和产业'); K.info('政府的权力是一种委托：只为某种目的而行使'); },
    chips: function (K, box) { choice(K, box, ['依法裁决 · 保护权利', '违背信托 · 专断没收'], 'ch'); } });
  HL.sims.define('locke_rights', { lift: -0.35, zoom: 1.1, title: '洛克 · 自然权利与财产权', source: '——', flat: true, core: '大地和万物最初是共有的。一个人凭什么不经全人类同意，就把某样东西变成自己的？', stages: [L1, L2, L3] });
})();
