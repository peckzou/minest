/* Minest · 全息模型 · 黑格尔辩证法 / 马克思历史唯物主义 — rebuilt as holograms (same stages, steps and quotations). */
(function () {
  'use strict';
  var HL = window.HL, T = window.THREE; if (!HL || !T || !HL.sims || !HL.simQ) return;
  var FY = -0.62, AM = 0xffa23a, CY = 0x46d2ff, PU = 0xb58cff, RED = 0xff7a7a, GR = 0x7dffb0, GOLD = 0xffd96b, WH = 0xffffff;
  function V(x, y, z) { return new T.Vector3(x, y, z); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function msg(K, y) { var m = K.label('', { h: 0.14, color: '#ffffff' }); m.position.set(0, FY + (y || 2.2), 0); return m; }
  function ball(K, text, color, r) { var m = K.sphere(r || 0.12, K.holo(color, { core: 0.9 })); K.label(text, { h: 0.11, color: '#ffffff', parent: m }).position.y = (r || 0.12) + 0.1; return m; }
  var DR = { dragStart: function (K, h, x, y) { h.d = K.facing(h.m.position, x, y); }, dragMove: function (K, h, x, y) { var p = h.d && h.d.to(x, y); if (p) h.m.position.copy(p); } };

  /* ═════════════ 黑格尔 · 有—无—变易 ═════════════ */
  var QH = HL.simQ.hegel;
  var H1 = { name: '纯有', hint: '把周围的规定（红色、大小……）拖到中央的“有”上，看它们挂不挂得住；再按住画面（或空格）只思维“纯有”。', quotes: QH[0],
    init: function (K) { var s = K.st; s.t = 0; s.p = 0; s.be = K.sphere(0.4, K.holo(WH, { core: 0.9 })); s.be.position.set(0, FY + 1.1, 0); s.bl = K.label('有', { h: 0.3, color: '#ffffff' }); s.bl.position.set(0, FY + 1.1, 0.45);
      s.tg = ['红色', '大小', '这一个', '物质'].map(function (n, i) { var m = ball(K, n, AM, 0.1); m.userData.home = V(i % 2 ? 1.6 : -1.6, FY + 0.6 + Math.floor(i / 2) * 0.9, 0.3); m.position.copy(m.userData.home); return m; }); s.msg = msg(K, 2.2); },
    update: function (K, dt) { var s = K.st; s.t += dt; if (s.t > 1) K.hit(0); if (K.pressed) { s.p = Math.min(1, s.p + dt * 0.3); K.hit(2); } s.be.material.uniforms.uOp.value = 1 - s.p * 0.95; if (s.p >= 1) { K.hit(3); K.text(s.bl, '无'); } s.tg.forEach(function (m) { if (!m.userData.held) m.position.lerp(m.userData.home, dt * 3); });
      K.text(s.msg, s.p >= 1 ? '纯粹的有，没有任何规定：它就是无' : ''); K.info('纯粹度 ' + Math.round(s.p * 100) + '%'); },
    pick: function (K, x, y) { var m = K.near(K.st.tg, x, y, 60); return m ? { drag: true, m: m } : null; }, dragStart: function (K, h, x, y) { h.m.userData.held = true; DR.dragStart(K, h, x, y); }, dragMove: DR.dragMove,
    dragEnd: function (K, h) { var s = K.st; h.m.userData.held = false; if (K.closePx(h.m.position, s.be.position, 110)) { K.hit(1); K.toast('滑落了：纯有不带任何规定'); } } };
  var H2 = { name: '有与无', hint: '左边是“有”，右边是“无”。把探针在两边来回拖，比较它们；再把“无”拖到“有”上。', quotes: QH[1],
    init: function (K) { var s = K.st; s.sc = 0; s.a = ball(K, '有', WH, 0.35); s.a.position.set(-1.0, FY + 1.1, 0); s.b = ball(K, '无', 0x6b7a8c, 0.35); s.b.position.set(1.0, FY + 1.1, 0); s.pr = K.mesh(new T.TorusGeometry(0.2, 0.02, 6, 30), K.glow(GOLD, 1)); s.pr.position.set(0, FY + 0.3, 0.5); s.df = K.label('差别：0', { h: 0.16, color: '#ffd96b' }); s.df.position.set(0, FY + 1.9, 0); s.msg = msg(K, 2.3); },
    update: function (K, dt, t) { var s = K.st; if (s.sc > 2) K.hit(0); if (s.sc > 6) K.hit(1); if (s.merge) { var k = 0.5 + 0.5 * Math.sin(t * 3); s.a.material.uniforms.uOp.value = k; s.b.material.uniforms.uOp.value = 1 - k; } K.text(s.msg, s.merge ? '它们不是融成一团，而是各自直接消失在对方之中' : ''); K.info('两者同样没有规定：找不出任何差别'); },
    pick: function (K, x, y) { var s = K.st, m = K.near([s.pr, s.b], x, y, 70); return m ? { drag: true, m: m } : null; }, dragStart: function (K, h, x, y) { h.x = x; DR.dragStart(K, h, x, y); },
    dragMove: function (K, h, x, y) { var s = K.st; DR.dragMove(K, h, x, y); if (h.m === s.pr) { s.sc += Math.abs(x - h.x) / 200; h.x = x; } }, dragEnd: function (K, h) { var s = K.st; if (h.m === s.b && K.closePx(s.b.position, s.a.position, 110)) { s.b.position.copy(s.a.position); s.merge = true; K.hit(2); } } };
  var H3 = { name: '变易', hint: '左右来回拖动中间的球：有过渡到无（消逝），无过渡到有（生成）。拖快一点，坚持一会儿；再慢下来松手。', quotes: QH[2],
    init: function (K) { var s = K.st; s.x = 0; s.sp = 0; s.hot = 0; s.o = K.sphere(0.25, K.holo(GOLD, { core: 0.9 })); K.label('有', { h: 0.2, color: '#ffffff' }).position.set(-1.6, FY + 1.1, 0); K.label('无', { h: 0.2, color: '#8a98a8' }).position.set(1.6, FY + 1.1, 0); s.lb = K.label('', { h: 0.16, color: '#ffd96b' }); s.lb.position.set(0, FY + 1.8, 0); s.msg = msg(K, 2.3); },
    update: function (K, dt) { var s = K.st; s.sp = Math.max(0, s.sp - dt * 1.2); s.o.position.set(s.x, FY + 1.1, 0); s.o.scale.setScalar(1 + s.sp * 0.5); if (s.sp > 0.2) K.hit(0); if (s.sp > 0.8) { K.hit(1); s.hot += dt; if (s.hot > 2) K.hit(2); } if (s.hot > 2 && s.sp < 0.05 && !K.held) K.hit(3);
      K.text(s.lb, s.sp > 0.2 ? '变易' : s.hot > 2 ? '定在' : ''); K.text(s.msg, s.hot > 2 && s.sp < 0.05 ? '不安息的变易沉静下来，成为一个确定的东西：定在' : ''); K.info('生成与消逝的强度 ' + Math.round(clamp(s.sp, 0, 1) * 100) + '%'); },
    pick: function (K, x, y) { return K.px(K.st.o.position, x, y) < 80 ? { drag: true } : null; }, dragStart: function (K, h, x) { h.x = x; }, dragMove: function (K, h, x) { var s = K.st, d = (x - h.x) / 260; h.x = x; s.x = clamp(s.x + d, -1.4, 1.4); s.sp = Math.min(1.2, s.sp + Math.abs(d) * 0.9); } };
  var H4 = { name: '扬弃', hint: '把透镜依次拖到左、中、右三个区域各停一下：知性、辩证、思辨。再按住画面（或空格）把“定在”拉开看看里面。', quotes: QH[3],
    init: function (K) { var s = K.st; s.z = {}; s.t = 0; s.op = 0; ['知性：有就是有', '辩证：有转为无', '思辨：变易中的统一'].forEach(function (n, i) { var x = -1.4 + i * 1.4; K.flat(1.2, 0.9, K.glow([CY, RED, GOLD][i], 0.1)).position.set(x, FY + 0.7, -0.3); K.label(n, { h: 0.11, color: '#ffffff' }).position.set(x, FY + 1.3, -0.3); });
      s.ln = K.mesh(new T.TorusGeometry(0.25, 0.02, 6, 36), K.glow(WH, 1)); s.ln.position.set(-0.7, FY + 0.7, 0.2); s.d = ball(K, '定在', GOLD, 0.2); s.d.position.set(0, FY + 2.0, 0); s.a = ball(K, '有', WH, 0.1); s.b = ball(K, '无', 0x8a98a8, 0.1); s.msg = msg(K, 2.6); },
    update: function (K, dt) { var s = K.st, x = s.ln.position.x, i = x < -0.7 ? 0 : x > 0.7 ? 2 : 1; if (Math.abs(x - (-1.4 + i * 1.4)) < 0.45) { s.t += dt; if (s.t > 0.8) { s.z[i] = 1; K.hit(i); } } else s.t = 0; if (s.z[0] && s.z[1] && s.z[2]) K.hit(5);
      if (K.pressed) s.op = Math.min(1, s.op + dt * 0.4); if (s.op > 0.3) K.hit(3); if (s.op >= 1) K.hit(4); s.a.position.set(-s.op * 0.6, FY + 2.0, 0); s.b.position.set(s.op * 0.6, FY + 2.0, 0); s.a.visible = s.b.visible = s.op > 0.05; K.text(s.msg, s.op >= 1 ? '扬弃：既取消，又保存 —— 有与无都还在定在里面' : ''); K.info('三个环节不是三种东西，是同一个思想的三步'); },
    pick: function (K, x, y) { return K.px(K.st.ln.position, x, y) < 70 ? { drag: true, m: K.st.ln } : null; }, dragStart: DR.dragStart, dragMove: function (K, h, x, y) { DR.dragMove(K, h, x, y); h.m.position.y = FY + 0.7; h.m.position.z = 0.2; } };
  HL.sims.define('hegel', { lift: -0.35, zoom: 1.1, title: '黑格尔 · 辩证法', source: '——', flat: true, core: '从最空洞的“有”开始，思想为什么自己会动起来，走到它的反面，又走到更高的东西？', stages: [H1, H2, H3, H4] });

  /* ═════════════ 马克思 · 历史唯物主义 ═════════════ */
  var QX = HL.simQ.marx;
  function house(K) { var s = K.st; s.base = K.mesh(new T.BoxGeometry(2.2, 0.3, 0.9), K.holo(AM, { core: 0.5 })); s.base.position.set(0, FY + 0.5, 0); K.label('经济基础：生产关系的总和', { h: 0.11, color: '#ffffff', parent: s.base }).position.z = 0.46;
    s.fl = ['法律', '政治', '宗教 · 艺术 · 哲学'].map(function (n, i) { var m = K.mesh(new T.BoxGeometry(1.8 - i * 0.3, 0.26, 0.7), K.holo(CY, { core: 0.4 })); m.userData.home = V(0, FY + 0.82 + i * 0.3, 0); m.position.copy(m.userData.home); K.label(n, { h: 0.1, color: '#ffffff', parent: m }).position.z = 0.36; return m; }); s.mach = K.mesh(new T.CylinderGeometry(0.25, 0.25, 0.2, 12), K.holo(GOLD, { core: 0.6 })); s.mach.position.set(0, FY + 0.15, 0); s.mach.rotation.x = Math.PI / 2; }
  var X1 = { name: '基础与上层建筑', hint: '按住画面（或空格）让工人劳动；把上面的一层楼拖离基础；再把“观念”拖去推基础。', quotes: QX[0],
    init: function (K) { var s = K.st; house(K); s.w = 0; s.idea = ball(K, '观念', PU); s.ih = V(1.8, FY + 1.5, 0.3); s.idea.position.copy(s.ih); s.msg = msg(K, 2.3); },
    update: function (K, dt, t) { var s = K.st; if (K.pressed) { s.w += dt; s.mach.rotation.y = t * 3; if (s.w > 1) K.hit(0); if (s.w > 2.5) K.hit(1); } s.fl.forEach(function (m) { if (!m.userData.held) m.position.lerp(m.userData.home, dt * 4); }); if (!s.idea.userData.held) s.idea.position.lerp(s.ih, dt * 4); K.info('不是人们的意识决定人们的存在，相反，是人们的社会存在决定人们的意识'); },
    pick: function (K, x, y) { var s = K.st, m = K.near(s.fl.concat([s.idea]), x, y, 60); return m ? { drag: true, m: m } : null; }, dragStart: function (K, h, x, y) { h.m.userData.held = true; DR.dragStart(K, h, x, y); }, dragMove: DR.dragMove,
    dragEnd: function (K, h) { var s = K.st, m = h.m; m.userData.held = false; if (m === s.idea) { if (K.closePx(m.position, s.base.position, 120)) { K.hit(3); K.text(s.msg, '观念推不动基础；基础一变，观念跟着变'); } } else if (m.position.distanceTo(m.userData.home) > 0.6) { K.hit(2); K.text(s.msg, '离开了基础，上层建筑立不住：掉下来'); } } };
  var X2 = { name: '桎梏', hint: '按住画面（或空格）发展生产力：机器越长越大，撑向外面那圈“财产关系”的框架。', quotes: QX[1],
    init: function (K) { var s = K.st; s.g = 0; s.m = K.mesh(new T.BoxGeometry(1, 1, 1), K.holo(GOLD, { core: 0.5 })); s.fr = K.mesh(new T.BoxGeometry(1.5, 1.5, 1.5), K.glow(CY, 0.6, { wire: true })); s.fr.position.set(0, FY + 1.0, 0); K.label('财产关系', { h: 0.12, color: '#6fe3ff' }).position.set(0, FY + 1.95, 0); s.msg = msg(K, 2.4); },
    update: function (K, dt, t) { var s = K.st; if (K.pressed) { s.g = Math.min(1, s.g + dt * 0.2); K.hit(0); } var z = 0.4 + s.g * 1.15; s.m.scale.setScalar(z); s.m.position.set(0, FY + 1.0, 0); if (s.g > 0.3) K.hit(1); if (s.g > 0.7) { K.hit(2); s.fr.material.color.setHex(RED); } if (s.g >= 1) { K.hit(3); s.fr.rotation.z = Math.sin(t * 30) * 0.03; }
      K.text(s.msg, s.g >= 1 ? '框架开裂：社会革命的时代到来了' : s.g > 0.7 ? '这些关系从生产力的发展形式，变成了它的桎梏' : ''); K.info('生产力 ' + Math.round(s.g * 100) + '%'); } };
  var X3 = { name: '变革', hint: '点「换上新的经济基础」，看楼层一层层跟着变；轻点最上面的“自我评价”标签；再点「过早拆框架」。', quotes: QX[2],
    init: function (K) { var s = K.st; house(K); s.k = -1; s.tag = ball(K, '“我们是永恒的秩序”', PU, 0.1); s.tag.position.set(0, FY + 1.95, 0); s.msg = msg(K, 2.4); },
    update: function (K, dt) { var s = K.st; if (s.k >= 0) { s.k += dt; s.base.material.uniforms.uColor.value.setHex(GR); s.fl.forEach(function (m, i) { if (s.k > 1 + i * 1.3) m.material.uniforms.uColor.value.setHex(GR); }); K.hit(0); if (s.k > 2.5) K.hit(1); } K.info('基础变了，庞大的上层建筑或慢或快地跟着变'); },
    pick: function (K, x, y) { return K.px(K.st.tag.position, x, y) < 60 ? { tag: true } : null; }, tap: function (K, h) { if (h && h.tag) { K.hit(2); K.text(K.st.msg, '判断一个时代，不能看它怎么看自己'); } },
    chips: function (K, box) { var s = K.st; HL.ui.chip(box, '⟳ 换上新的经济基础', false, function () { s.k = 0; }); HL.ui.chip(box, '✖ 过早拆框架', false, function () { K.hit(3); K.text(s.msg, '拆不动：它所能容纳的生产力发挥出来之前，一种社会形态不会灭亡'); }); } };
  var X4 = { name: '应用练习', hint: '一个新社会。先按住画面（或空格）让条件成熟，再点「更换生产关系」；也试试不等条件成熟就换。', quotes: QX[3],
    init: function (K) { var s = K.st; house(K); s.g = 0; s.era = 0; s.msg = msg(K, 2.4); },
    update: function (K, dt) { var s = K.st; if (K.pressed) s.g = Math.min(1, s.g + dt * 0.3); s.mach.scale.setScalar(1 + s.g * 1.5); if (s.g > 0.6) K.hit(1); K.info('物质条件 ' + Math.round(s.g * 100) + '% · 已经历 ' + s.era + ' 个时代'); },
    chips: function (K, box) { var s = K.st; HL.ui.chip(box, '⟳ 更换生产关系', false, function () { if (s.g < 1) { K.text(s.msg, '换不了：解决问题的物质条件还没有形成'); return; } s.g = 0; s.era++; K.hit(0); var c = [GR, PU, GOLD][s.era % 3]; s.base.material.uniforms.uColor.value.setHex(c); s.fl.forEach(function (m) { m.material.uniforms.uColor.value.setHex(c); }); K.text(s.msg, ['', '亚细亚的、古代的……', '封建的……', '现代资产阶级的生产方式'][Math.min(3, s.era)]); if (s.era >= 3) K.hit(2); }); } };
  HL.sims.define('marx', { lift: -0.35, zoom: 1.1, title: '马克思 · 历史唯物主义', source: '——', flat: true, core: '法律、政治、宗教和哲学为什么会变？是观念改变了世界，还是别的什么先变了？', stages: [X1, X2, X3, X4] });
})();
