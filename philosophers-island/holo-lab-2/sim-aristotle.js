/* Minest · 全息模型 · 亚里士多德 ×3 — 四因说 / 三段论 / 德性中道 rebuilt as holograms.
   Same stages, steps and quotations as the 2D models (Physics II, Prior Analytics I, Nicomachean Ethics II). */
(function () {
  'use strict';
  var HL = window.HL, T = window.THREE; if (!HL || !T || !HL.sims || !HL.simQ) return;
  var FY = -0.62, AM = 0xffa23a, CY = 0x46d2ff, PU = 0xb58cff, RED = 0xff7a7a, GR = 0x7dffb0, GOLD = 0xffd96b, WH = 0xffffff, BRZ = 0xd98a4a;
  function V(x, y, z) { return new T.Vector3(x, y, z); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function msg(K, y) { var m = K.label('', { h: 0.14, color: '#ffffff' }); m.position.set(0, FY + (y || 2.2), 0); return m; }

  /* ═════════════ 四因说 ═════════════ */
  var QA = HL.simQ.aristotle;
  var A1 = {
    name: '质料因', hint: '左：按住画面（或空格）加热铜块，熔化后把坩埚拖到模具上浇铸。右：点「把床埋进土里」，再按住让时间流逝。', quotes: QA[0],
    init: function (K) {
      var s = K.st; K.grid(0, FY, 4.4, 2.0, 0x46d2ff); s.heat = 0; s.cast = 0; s.bury = false; s.time = 0;
      s.cru = new T.Group(); s.home = V(-1.5, FY + 0.5, 0.3); s.cru.position.copy(s.home); K.add(s.cru); K.mesh(new T.CylinderGeometry(0.24, 0.16, 0.3, 18, 1, true), K.holo(0x9aa7b5, { core: 0.4, side: T.DoubleSide }), s.cru);
      s.cu = K.mesh(new T.BoxGeometry(0.22, 0.22, 0.22), K.holo(BRZ, { core: 0.8 }), s.cru); s.fl = K.mesh(new T.ConeGeometry(0.16, 0.3, 12), K.holo(AM, { core: 1 })); s.fl.position.set(-1.5, FY + 0.15, 0.3);
      s.mold = K.mesh(new T.BoxGeometry(0.34, 0.6, 0.3), K.glow(WH, 0.5, { wire: true })); s.mold.position.set(-0.5, FY + 0.3, 0.3); s.st = K.mesh(new T.BoxGeometry(0.3, 0.56, 0.26), K.holo(BRZ, { core: 0.8 })); s.st.position.set(-0.5, FY + 0.02, 0.3); s.st.scale.y = 0.001;
      K.label('模具', { h: 0.11, color: '#ffffff' }).position.set(-0.5, FY + 0.75, 0.3); s.amt = K.label('铜：1.00 份', { h: 0.13, color: '#d98a4a' }); s.amt.position.set(-1.0, FY + 1.2, 0.3);
      s.bed = K.mesh(new T.BoxGeometry(0.7, 0.14, 0.4), K.holo(0xffb27c, { core: 0.6 })); s.bed.position.set(1.3, FY + 0.5, 0.3); s.soil = K.mesh(new T.BoxGeometry(1.1, 0.3, 0.7), K.glow(0x8a6a40, 0.25)); s.soil.position.set(1.3, FY + 0.15, 0.3);
      s.tree = K.mesh(new T.ConeGeometry(0.3, 1.0, 10), K.holo(GR, { core: 0.6 })); s.tree.position.set(1.3, FY + 0.3, 0.3); s.tree.scale.setScalar(0.001); K.label('一张木床', { h: 0.11, color: '#ffb27c' }).position.set(1.3, FY + 0.05, 0.85); s.msg = msg(K, 1.9);
    },
    update: function (K, dt, t) {
      var s = K.st, m = clamp((s.heat - 0.3) / 0.7, 0, 1);
      if (!s.bury && K.pressed && !K.held) { s.heat = Math.min(1, s.heat + dt * 0.4); if (s.heat > 0.3) K.hit(0); }
      s.fl.scale.y = 0.6 + 0.6 * (K.pressed && !s.bury ? 1 : 0.3) + 0.1 * Math.sin(t * 12); s.cu.scale.set(1 + m * 0.9, Math.max(0.05, (1 - m * 0.7) * (1 - s.cast)), 1 + m * 0.9); s.cu.position.y = -0.1 + 0.11 * (1 - m * 0.7) * (1 - s.cast); s.cu.material.uniforms.uColor.value.setHex(m > 0.5 ? 0xffb347 : BRZ);
      var over = s.heat >= 1 && Math.abs(s.cru.position.x + 0.5) < 0.35 && s.cru.position.y > FY + 0.6; if (over) s.cast = Math.min(1, s.cast + dt * 0.5);
      s.cru.rotation.z = over ? -0.9 : 0; s.st.scale.y = Math.max(0.001, s.cast); s.st.position.y = FY + 0.02 + 0.28 * s.cast; if (s.cast >= 1) K.hit(1);
      K.text(s.amt, '铜：坩埚 ' + (1 - s.cast).toFixed(2) + ' + 铜像 ' + s.cast.toFixed(2) + ' = 1.00');
      if (s.bury) { s.bed.position.y = lerp(s.bed.position.y, FY + 0.12, dt * 3); if (K.pressed) { s.time = Math.min(1, s.time + dt * 0.25); K.hit(2); } s.tree.scale.setScalar(Math.max(0.001, s.time)); s.tree.position.y = FY + 0.3 + 0.5 * s.time; s.bed.material.uniforms.uOp.value = 1 - s.time * 0.8; if (s.time >= 1) K.hit(3); }
      K.text(s.msg, s.time >= 1 ? '长出来的是树，不是床：床的本性在木头，不在“床”的形状' : s.cast >= 1 ? '形状换了，铜还是那些铜 —— 这就是质料' : '');
      K.info(s.bury ? '按住画面（或空格）让时间流逝 ' + Math.round(s.time * 100) + '%' : s.heat < 1 ? '按住画面（或空格）加热 ' + Math.round(s.heat * 100) + '%' : s.cast < 1 ? '铜熔化了：把坩埚拖到模具正上方浇铸' : '浇铸完成。再点「把床埋进土里」');
    },
    pick: function (K, x, y) { var s = K.st; return s.heat >= 1 && K.px(s.cru.position, x, y) < 70 ? { drag: true } : null; },
    dragStart: function (K, h, x, y) { h.d = K.facing(K.st.cru.position, x, y); }, dragMove: function (K, h, x, y) { var p = h.d && h.d.to(x, y); if (p) K.st.cru.position.set(clamp(p.x, -2, 0), clamp(p.y, FY + 0.3, FY + 1.4), 0.3); },
    dragEnd: function (K) { var s = K.st; if (s.cast >= 1 || Math.abs(s.cru.position.x + 0.5) > 0.35) s.cru.position.copy(s.home); },
    chips: function (K, box) { var s = K.st; HL.ui.chip(box, '⬇ 把床埋进土里', s.bury, function () { s.bury = true; HL.refreshTools(); }, '安提丰的设想：把一张床种下去'); }
  };
  var A2 = {
    name: '形式因', hint: '左：左右拖动琴马（白球），听两段弦的比例 —— 找到 2:1。右：把木板一块块拖到床架的位置上。', quotes: QA[1],
    init: function (K) {
      var s = K.st; K.grid(0, FY, 4.4, 2.0, 0x46d2ff); s.r = 0.5; s.n = 0;
      K.line([V(-2.0, FY + 0.9, 0.3), V(-0.4, FY + 0.9, 0.3)], K.lineMat(GOLD, 1)); s.br = K.sphere(0.09, K.glow(WH, 0.95)); s.w1 = K.line([V(0, 0, 0), V(0, 0, 0)], K.lineMat(AM, 0.9)); s.w2 = K.line([V(0, 0, 0), V(0, 0, 0)], K.lineMat(CY, 0.9)); s.rt = K.label('', { h: 0.15, color: '#ffffff' }); s.rt.position.set(-1.2, FY + 1.5, 0.3);
      var T2 = [[0, 0.3, 0, 0.9, 0.06, 0.5], [-0.4, 0.13, -0.2, 0.06, 0.26, 0.06], [0.4, 0.13, -0.2, 0.06, 0.26, 0.06], [-0.4, 0.13, 0.2, 0.06, 0.26, 0.06], [0.4, 0.13, 0.2, 0.06, 0.26, 0.06], [-0.43, 0.5, 0, 0.06, 0.36, 0.5]];
      s.pl = T2.map(function (d, i) { var m = K.mesh(new T.BoxGeometry(d[3], d[4], d[5]), K.holo(0xffb27c, { core: 0.6 })); m.userData = { tg: V(1.25 + d[0], FY + d[1], 0.2 + d[2]), home: V(0.25 + i * 0.22, FY + 0.1 + (i % 2) * 0.25, 1.0) }; m.position.copy(m.userData.home); m.rotation.y = i * 0.7; var g = K.mesh(new T.BoxGeometry(d[3], d[4], d[5]), K.glow(WH, 0.25, { wire: true })); g.position.copy(m.userData.tg); return m; });
      s.msg = msg(K, 1.9);
    },
    update: function (K, dt, t) {
      var s = K.st, bx = -2.0 + s.r * 1.6, a = 1 - s.r, b = s.r, ratio = Math.max(a, b) / Math.min(a, b), W = function (x0, x1, f) { var p = []; for (var i = 0; i <= 16; i++) { var u = i / 16; p.push(V(lerp(x0, x1, u), FY + 0.9 + Math.sin(u * Math.PI) * Math.sin(t * f) * 0.05, 0.3)); } return p; };
      s.br.position.set(bx, FY + 0.9, 0.3); K.setLine(s.w1, W(-2.0, bx, 14 / Math.max(0.1, b))); K.setLine(s.w2, W(bx, -0.4, 14 / Math.max(0.1, a)));
      var oct = Math.abs(ratio - 2) < 0.06; K.text(s.rt, '弦长之比 ' + ratio.toFixed(2) + ' : 1' + (oct ? ' —— 八度' : Math.abs(ratio - 1.5) < 0.05 ? ' —— 五度' : '')); if (oct) K.hit(1);
      if (s.n >= 1) K.hit(2); if (s.n >= 6) K.hit(3);
      K.text(s.msg, s.n >= 6 ? '同样这些木板，摆成这个样子才是床：形式就是“它是什么”' : oct ? '八度的原因不是哪根弦，而是 2:1 这个比例' : '');
      K.info('琴马：拖动白球 · 木板：已摆好 ' + s.n + ' / 6（拖到白色线框的位置）');
    },
    pick: function (K, x, y) { var s = K.st; if (K.px(s.br.position, x, y) < 50) return { drag: true, br: true }; var m = K.near(s.pl.filter(function (q) { return !q.userData.done; }), x, y, 60); return m ? { drag: true, m: m } : null; },
    dragStart: function (K, h, x, y) { h.x = x; if (h.m) h.d = K.facing(h.m.position, x, y); },
    dragMove: function (K, h, x, y) { var s = K.st; if (h.br) { s.r = clamp(s.r + (x - h.x) / 420, 0.15, 0.85); h.x = x; K.hit(0); } else { var p = h.d && h.d.to(x, y); if (p) h.m.position.copy(p); } },
    dragEnd: function (K, h) { var s = K.st, m = h.m; if (!m) return; var a = HL.screenOf(K.root.localToWorld(m.position.clone())), b = HL.screenOf(K.root.localToWorld(m.userData.tg.clone())); if (Math.hypot(a.x - b.x, a.y - b.y) < 120) { m.position.copy(m.userData.tg); m.rotation.y = 0; m.userData.done = true; s.n++; } else m.position.copy(m.userData.home); }
  };
  var A3 = {
    name: '动力因', hint: '在石块上来回快速拖动：挥动刻刀雕刻；停手看看；再继续。然后轻点雕刻家的名牌。', quotes: QA[2],
    init: function (K) {
      var s = K.st; K.grid(0, FY, 4.0, 1.8, 0x46d2ff); s.c = 0; s.act = 0; s.stopped = false; s.wasAct = false; s.resumed = false;
      s.blk = K.mesh(new T.BoxGeometry(0.7, 1.1, 0.6), K.holo(0x9aa7b5, { core: 0.5 })); s.blk.position.set(0.3, FY + 0.55, 0); s.fig = K.person(BRZ, 2.4); s.fig.position.set(0.3, FY, 0); s.fig.visible = false;
      s.who = K.person(CY, 1.4); s.who.position.set(-1.0, FY, 0.3); s.tag = K.mesh(new T.BoxGeometry(0.9, 0.2, 0.03), K.holo(GOLD, { core: 0.4 })); s.tag.position.set(-1.0, FY + 0.95, 0.3); s.tl = K.label('雕刻家', { h: 0.12, color: '#ffffff', parent: s.tag }); s.tl.position.z = 0.03;
      s.chips = K.dots(24, 0.07); s.msg = msg(K, 1.95);
    },
    update: function (K, dt, t) {
      var s = K.st; s.act = Math.max(0, s.act - dt * 2.2); var on = s.act > 0.2;
      if (on) { if (s.stopped) { s.resumed = true; K.hit(3); } s.wasAct = true; } else if (s.wasAct && s.c > 0.15) { s.stopped = true; K.hit(2); }
      s.blk.scale.setScalar(1 - s.c * 0.45); s.blk.material.uniforms.uOp.value = 1 - s.c; s.fig.visible = s.c > 0.1; s.fig.userData.mat.uniforms.uOp.value = s.c * 1.2;
      for (var i = 0; i < 24; i++) { var u = (t * 1.5 + i / 24) % 1; s.chips.set(i, on ? 0.3 + Math.cos(i * 2.4) * (0.4 + u * 0.5) : 0, on ? FY + 0.9 - u * 0.9 + Math.sin(i) * 0.2 : -9, Math.sin(i * 2.4) * (0.4 + u * 0.4)); s.chips.rgb(i, 0.8, 0.8, 0.85); } s.chips.flush();
      K.text(s.msg, s.resumed && s.c >= 1 ? '雕像完成：潜在的雕像，因为雕刻的活动而成为现实的雕像' : !on && s.stopped ? '一停手，雕刻立刻停止 —— 变化的来源在雕刻者那里' : '');
      K.info('雕刻进度 ' + Math.round(s.c * 100) + '% —— 在石块上来回拖动；停一下再继续；轻点名牌');
    },
    pick: function (K, x, y) { var s = K.st; if (K.px(s.tag.position, x, y) < 50) return { tag: true }; return K.px(s.blk.position, x, y) < 120 ? { drag: true } : null; },
    dragStart: function (K, h, x, y) { h.x = x; h.y = y; },
    dragMove: function (K, h, x, y) { var s = K.st, d = Math.hypot(x - h.x, y - h.y); h.x = x; h.y = y; s.act = 1; s.c = Math.min(1, s.c + d / 2600); K.hit(0); if (s.c > 0.25) K.hit(1); },
    tap: function (K, h) { var s = K.st; if (h && h.tag) { K.text(s.tl, '波吕克里托斯 · 白皙的 · 通音律'); K.hit(4); K.toast('造雕像的是“雕刻家”；他恰好叫波吕克里托斯、恰好肤色白皙 —— 这些只是偶然的原因'); } }
  };
  var A4 = {
    name: '目的因', hint: '左：拖动种子把它转到任意方向，再按住画面（或空格）让它生长；换个方向再种一次。右：点「木头锯」「铁锯」，再在木头上来回拖动锯。', quotes: QA[3],
    init: function (K) {
      var s = K.st; K.grid(0, FY, 4.4, 2.0, 0x46d2ff); s.ang = 0.4; s.g = 0; s.runs = []; s.mat = null; s.cut = 0; s.tw = 0;
      s.soil = K.mesh(new T.BoxGeometry(1.3, 0.5, 0.8), K.glow(0x8a6a40, 0.2)); s.soil.position.set(-1.2, FY + 0.25, 0.2);
      s.seed = K.mesh(new T.SphereGeometry(0.1, 14, 10), K.holo(0xffc46a, { core: 0.8 })); s.seed.scale.set(1, 1.6, 1); s.seed.position.set(-1.2, FY + 0.5, 0.2);
      s.root = K.line([V(0, 0, 0), V(0, 0, 0)], K.lineMat(0xffb27c, 1)); s.stem = K.line([V(0, 0, 0), V(0, 0, 0)], K.lineMat(GR, 1)); s.leaf = K.sphere(0.13, K.holo(GR, { core: 0.7 })); s.fruit = K.sphere(0.07, K.holo(RED, { core: 0.9 }));
      s.log = K.mesh(new T.CylinderGeometry(0.16, 0.16, 1.1, 14), K.holo(0xffb27c, { core: 0.5 })); s.log.rotation.z = Math.PI / 2; s.log.position.set(1.2, FY + 0.4, 0.2);
      s.saw = K.mesh(new T.BoxGeometry(0.03, 0.42, 0.7), K.holo(WH, { core: 0.5 })); s.saw.visible = false; s.sl = K.label('', { h: 0.12, color: '#ffffff' }); s.sl.position.set(1.2, FY + 1.3, 0.2); s.msg = msg(K, 2.0);
    },
    update: function (K, dt) {
      var s = K.st; s.seed.rotation.z = s.ang;
      if (K.pressed && !K.held) { s.g = Math.min(1, s.g + dt * 0.35); if (s.g > 0.3) K.hit(0); if (s.g >= 1) { K.hit(1); if (!s.logged) { s.logged = true; s.runs.push(s.ang); if (s.runs.length >= 2 && Math.abs(s.runs[s.runs.length - 1] - s.runs[0]) > 0.8) K.hit(2); } } }
      var c = s.seed.position, g = s.g; K.setLine(s.root, [c.clone(), V(c.x + Math.sin(s.ang) * 0.1 * (1 - g), c.y - 0.38 * g, c.z)]); K.setLine(s.stem, [c.clone(), V(c.x - Math.sin(s.ang) * 0.1 * (1 - g), c.y + 0.9 * g, c.z)]);
      s.leaf.position.set(c.x + 0.12, c.y + 0.9 * g, c.z); s.leaf.scale.setScalar(Math.max(0.001, g)); s.fruit.position.set(c.x, c.y + 0.72 * g, c.z); s.fruit.scale.setScalar(Math.max(0.001, clamp(g * 2 - 1, 0, 1)));
      s.saw.position.set(1.2, FY + 0.72 - s.cut * 0.32, 0.2 + Math.sin(s.tw) * 0.12); s.log.material.uniforms.uOp.value = 1 - s.cut * 0.5;
      if (s.mat === 'wood' && s.tw > 6) K.hit(3); if (s.cut >= 1) { K.hit(4); if (HL.sims.isLit(0)) K.hit(5); }
      K.text(s.sl, s.mat === 'wood' ? (s.tw > 6 ? '木头锯：锯齿磨平了，锯不动' : '木头做的锯') : s.mat === 'iron' ? (s.cut >= 1 ? '铁锯：锯断了 —— 为了“锯”，它必须是铁的' : '铁做的锯') : '');
      K.text(s.msg, s.runs.length >= 2 ? '不管种子朝哪边放，根总向下、叶总向上：自然的生成是“为了”某个终点' : '');
      K.info('种子：拖动旋转，按住画面（或空格）生长 ' + Math.round(g * 100) + '% · 锯：选材料后在木头上来回拖');
    },
    pick: function (K, x, y) { var s = K.st; if (K.px(s.seed.position, x, y) < 60) return { drag: true, seed: true }; return s.mat && K.px(s.log.position, x, y) < 110 ? { drag: true } : null; },
    dragStart: function (K, h, x) { h.x = x; },
    dragMove: function (K, h, x) { var s = K.st, d = x - h.x; h.x = x; if (h.seed) { s.ang += d / 60; s.g = 0; s.logged = false; } else { s.tw += Math.abs(d) / 40; if (s.mat === 'iron') s.cut = Math.min(1, s.cut + Math.abs(d) / 1500); } },
    chips: function (K, box) { var s = K.st, set = function (m) { s.mat = m; s.tw = 0; s.cut = 0; s.saw.visible = true; s.saw.material.uniforms.uColor.value.setHex(m === 'wood' ? 0xffb27c : 0xcfe3f2); HL.refreshTools(); }; HL.ui.chip(box, '🪵 木头锯', s.mat === 'wood', function () { set('wood'); }); HL.ui.chip(box, '⛓ 铁锯', s.mat === 'iron', function () { set('iron'); }); }
  };
  HL.sims.define('aristotle', { lift: -0.35, zoom: 1.1, title: '亚里士多德 · 四因说', source: '——《物理学》第二卷 ', flat: true, core: '问一件东西“为什么”，其实是在问四件事：它由什么做成、它是什么、谁让它出现、它为了什么。', stages: [A1, A2, A3, A4] });

  /* ═════════════ 三段论 ═════════════ */
  var QL = HL.simQ.syllogism;
  function disc(K, r, color, name) { var m = K.mesh(new T.CylinderGeometry(r, r, 0.04, 56), K.glow(color, 0.16)); K.mesh(new T.TorusGeometry(r, 0.012, 6, 64), K.glow(color, 0.95), m).rotation.x = Math.PI / 2; var l = K.label(name, { h: 0.2, color: '#ffffff', parent: m }); l.position.set(0, 0.2, -r * 0.6); m.userData = { r: r, home: null }; return m; }
  function inside(a, b) { return Math.hypot(a.position.x - b.position.x, a.position.z - b.position.z) + a.userData.r <= b.userData.r + 0.03; }
  function outside(a, b) { return Math.hypot(a.position.x - b.position.x, a.position.z - b.position.z) >= a.userData.r + b.userData.r - 0.03; }
  function confine(c, b) { var dx = c.position.x - b.position.x, dz = c.position.z - b.position.z, d = Math.hypot(dx, dz), mx = b.userData.r - c.userData.r; if (d > mx) { c.position.x = b.position.x + dx / d * mx; c.position.z = b.position.z + dz / d * mx; return true; } return false; }
  function dragDisc(K, h, x, y, lim) { var p = K.onPlane(x, y, h.m.position.y); if (p) { h.m.position.x = clamp(p.x - h.ox, -(lim || 2.1), lim || 2.1); h.m.position.z = clamp(p.z - h.oz, -1.2, 1.2); } }
  function pickDisc(K, list, x, y) { var p = K.onPlane(x, y, FY + 0.06); if (!p) return null; for (var i = 0; i < list.length; i++) if (Math.hypot(p.x - list[i].position.x, p.z - list[i].position.z) < list[i].userData.r + 0.05) return list[i]; return null; }
  function grab(K, h, x, y) { var p = K.onPlane(x, y, h.m.position.y); h.ox = p ? p.x - h.m.position.x : 0; h.oz = p ? p.z - h.m.position.z : 0; }
  var L1 = {
    name: '必然随之而来', hint: '把 B 拖进 A，再把 C 拖进 B；然后试着把 C 拖出 A。最后把 B 整个拖到 A 外面，看看另一种组合。', quotes: QL[0],
    init: function (K) { var s = K.st; s.A = disc(K, 1.05, CY, 'A 会死的'); s.A.position.set(-0.5, FY + 0.02, 0); s.B = disc(K, 0.6, GOLD, 'B 人'); s.B.position.set(1.4, FY + 0.06, 0.5); s.C = disc(K, 0.24, RED, 'C 苏格拉底'); s.C.position.set(1.5, FY + 0.1, -0.7); s.push = 0; s.msg = msg(K, 1.3); },
    update: function (K) {
      var s = K.st, ba = inside(s.B, s.A), cb = inside(s.C, s.B); if (ba) K.hit(0); if (cb) K.hit(1); s.lock = ba && cb;
      if (s.lock && s.push > 6) { K.hit(2); K.hit(4); } if (outside(s.B, s.A) && cb && s.wasIn) K.hit(3); if (ba) s.wasIn = true;
      K.text(s.msg, s.lock ? '所有 B 是 A，所有 C 是 B → 所有 C 是 A（必然）' : outside(s.B, s.A) && cb ? '没有 B 是 A，所有 C 是 B → 没有 C 是 A' : ba ? '大前提：所有 B 是 A' : '');
      K.info(s.lock ? '前提都成立了。现在试着把 C 拖到 A 外面去' : '拖动圆盘：把 B 放进 A，把 C 放进 B');
    },
    pick: function (K, x, y) { var s = K.st, m = pickDisc(K, [s.C, s.B], x, y); return m ? { drag: true, m: m } : null; },
    dragStart: function (K, h, x, y) { grab(K, h, x, y); },
    dragMove: function (K, h, x, y) { var s = K.st, bx = s.B.position.x, bz = s.B.position.z; dragDisc(K, h, x, y); if (h.m === s.B && inside(s.C, { position: { x: bx, z: bz }, userData: s.B.userData })) { s.C.position.x += s.B.position.x - bx; s.C.position.z += s.B.position.z - bz; } if (h.m === s.C && s.lock) { if (confine(s.C, s.B)) s.push++; } }
  };
  var L2 = {
    name: '反例世界', hint: '前提换成：所有 B 是 A，没有 C 是 B。把 C 拖到 A 里面（但在 B 外面），再拖到 A 外面 —— 两个世界都满足前提。', quotes: QL[1],
    init: function (K) { var s = K.st; s.A = disc(K, 1.1, CY, 'A 动物'); s.A.position.set(-0.4, FY + 0.02, 0); s.B = disc(K, 0.45, GOLD, 'B 人'); s.B.position.set(-0.8, FY + 0.06, 0.2); s.C = disc(K, 0.22, RED, 'C'); s.C.position.set(1.6, FY + 0.1, 0.6); s.w = {}; s.msg = msg(K, 1.3); },
    update: function (K) {
      var s = K.st, ok = outside(s.C, s.B); if (ok) K.hit(0); if (ok && inside(s.C, s.A)) { s.w.i = 1; K.hit(1); } if (ok && outside(s.C, s.A)) { s.w.o = 1; if (s.w.i) K.hit(2); } if (s.w.i && s.w.o) K.hit(3);
      K.text(s.msg, !ok ? 'C 碰到 B 了：前提“没有 C 是 B”不成立' : inside(s.C, s.A) ? '这个世界：C 是 A（比如 C = 马）' : outside(s.C, s.A) ? '这个世界：C 不是 A（比如 C = 石头）' : 'C 一部分在 A 里');
      K.info('两个前提都真，结论却可真可假 —— 所以这里推不出任何必然的东西' + (s.w.i && s.w.o ? '：没有三段论' : ''));
    },
    pick: function (K, x, y) { return pickDisc(K, [K.st.C], x, y) ? { drag: true, m: K.st.C } : null; },
    dragStart: function (K, h, x, y) { grab(K, h, x, y); }, dragMove: function (K, h, x, y) { dragDisc(K, h, x, y); }
  };
  var L3 = {
    name: '格与化归', hint: '第二格：中项 M 不在中间。按住画面（或空格）“换位”：把“没有 N 是 M”翻成“没有 M 是 N”，第一格就回来了。', quotes: QL[2],
    init: function (K) { var s = K.st; s.k = 0; s.t = 0; s.M = disc(K, 0.6, GOLD, 'M 有翅膀'); s.N = disc(K, 0.5, CY, 'N 鱼'); s.O = disc(K, 0.24, RED, 'O 鲨鱼'); s.ar = K.line([V(0, 0, 0), V(0, 0, 0)], K.lineMat(WH, 0.9)); s.al = K.label('', { h: 0.13, color: '#ffffff' }); s.msg = msg(K, 1.5); },
    update: function (K, dt) {
      var s = K.st; s.t += dt; K.hit(0); if (s.t > 2) K.hit(1); if (K.pressed) { s.k = Math.min(1, s.k + dt * 0.4); K.hit(2); } if (s.k >= 1) { K.hit(3); K.hit(4); }
      var e = s.k * s.k * (3 - 2 * s.k); s.M.position.set(lerp(1.2, -1.0, e), FY + 0.04, lerp(-0.3, 0, e)); s.N.position.set(lerp(-1.0, 1.0, e), FY + 0.04, 0.1); s.O.position.set(s.N.position.x + 0.1, FY + 0.1, 0.2);
      var a = e < 0.5 ? s.N : s.M, b = e < 0.5 ? s.M : s.N; K.setLine(s.ar, [V(a.position.x, FY + 0.5, 0), V(b.position.x, FY + 0.5, 0), V(b.position.x - Math.sign(b.position.x - a.position.x) * 0.12, FY + 0.58, 0)]); s.al.position.set(0, FY + 0.72, 0); K.text(s.al, e < 0.5 ? '没有 N 是 M' : '没有 M 是 N（换位）');
      K.text(s.msg, s.k >= 1 ? '第一格：没有 M 是 N，所有 O 是 N → 没有 O 是 M（现在一眼可见）' : '第二格：没有 N 是 M，所有 O 是 M？—— 中项在两端之外，结论不显而易见');
      K.info('按住画面（或空格）换位 ' + Math.round(s.k * 100) + '% —— 第二格要靠这额外的一步才化归为第一格，所以它“不完满”');
    }
  };
  var L4 = {
    name: '应用练习', hint: '两道题：拖动圆盘，让上方的结论变成必然。①“所有希腊人会死”：希腊人、人、会死的。②“没有石头是动物”。', quotes: QL[3],
    init: function (K) { L4.load(K, 0); },
    load: function (K, q) {
      var s = K.st; (s.all || []).forEach(function (m) { K.root.remove(m); }); s.q = q; s.done = s.done || 0;
      var D = q === 0 ? [['A 会死的', 1.05, CY, -0.5, 0], ['B 人', 0.6, GOLD, 1.4, 0.5], ['C 希腊人', 0.24, RED, 1.5, -0.7]] : [['A 动物', 0.8, CY, -1.0, 0], ['B 人', 0.4, GOLD, -1.0, 0.1], ['C 石头', 0.3, RED, 0.6, 0.2]];
      s.all = D.map(function (d, i) { var m = disc(K, d[1], d[2], d[0]); m.position.set(d[3], FY + 0.02 + i * 0.04, d[4]); return m; }); s.A = s.all[0]; s.B = s.all[1]; s.C = s.all[2];
      if (!s.msg) { s.msg = msg(K, 1.4); K.hit(0); } K.text(s.msg, q === 0 ? '目标结论：所有希腊人会死' : '目标结论：没有石头是动物（石头不是任何一种动物）');
    },
    update: function (K, dt) {
      var s = K.st, ok = s.q === 0 ? inside(s.B, s.A) && inside(s.C, s.B) : inside(s.B, s.A) && outside(s.C, s.A);
      if (ok) { s.okT = (s.okT || 0) + dt; if (s.okT > 1.2) { s.okT = 0; if (s.q === 0) { K.toast('✓ 第一题：所有人会死，所有希腊人是人 → 所有希腊人会死'); L4.load(K, 1); } else { K.hit(1); K.text(s.msg, '✓ 两题都推出了必然的结论'); } } } else s.okT = 0;
      K.info('第 ' + (s.q + 1) + ' / 2 题 —— 拖动圆盘，摆出能让结论必然成立的前提');
    },
    pick: function (K, x, y) { var s = K.st, m = pickDisc(K, [s.C, s.B], x, y); return m ? { drag: true, m: m } : null; },
    dragStart: function (K, h, x, y) { grab(K, h, x, y); }, dragMove: function (K, h, x, y) { dragDisc(K, h, x, y); }
  };
  HL.sims.define('syllogism', { lift: -0.2, zoom: 1.05, title: '亚里士多德 · 三段论', source: '——', flat: true, core: '什么时候一个结论不是“大概对”，而是“不可能不对”？只凭前提的形状，就能看出来吗？', stages: [L1, L2, L3, L4] });

  /* ═════════════ 德性中道 ═════════════ */
  var QM = HL.simQ.aristotle_mean, QMi = HL.simInfo && HL.simInfo.aristotle_mean;
  function beam(K, y, len) { var g = new T.Group(); g.position.set(0, FY + y, 0); K.add(g); K.mesh(new T.BoxGeometry(len, 0.05, 0.3), K.holo(0x9aa7b5, { core: 0.4 }), g); return g; }
  var SPH = [['恐惧与信心', '怯懦', '勇敢', '鲁莽'], ['肉体快乐', '麻木', '节制', '放纵'], ['钱财施予', '吝啬', '慷慨', '挥霍']];
  var M1 = {
    name: '过犹不及', hint: '左右拖动白球，调节面对危险时的倾向：太少是怯懦，太多是鲁莽，命中中间金色的区域才是勇敢。再换两个领域各找一次。', quotes: QM[0],
    init: function (K) {
      var s = K.st; s.v = 0.2; s.sp = 0; s.found = {}; s.ex = false; s.b = beam(K, 0.6, 3.6); K.mesh(new T.ConeGeometry(0.2, 0.55, 4), K.holo(0x9aa7b5, { core: 0.4 })).position.set(0, FY + 0.28, 0);
      var z = K.mesh(new T.BoxGeometry(3.6 * 0.16, 0.06, 0.32), K.glow(GOLD, 0.7), s.b); z.position.y = 0.01; s.ball = K.sphere(0.14, K.holo(WH, { core: 0.9 }), s.b);
      s.lab = [K.label('', { h: 0.14, color: '#6fe3ff', parent: s.b }), K.label('', { h: 0.15, color: '#ffd96b', parent: s.b }), K.label('', { h: 0.14, color: '#ff7a7a', parent: s.b })]; s.lab[0].position.set(-1.5, 0.45, 0); s.lab[1].position.set(0, 0.6, 0); s.lab[2].position.set(1.5, 0.45, 0);
      s.who = K.person(AM, 1.6); s.who.position.set(0, FY + 1.3, -0.6); s.msg = msg(K, 2.5);
    },
    update: function (K, dt) {
      var s = K.st, d = SPH[s.sp], mid = s.v >= 0.42 && s.v <= 0.58, off = s.v < 0.28 || s.v > 0.72; s.lab.forEach(function (l, i) { K.text(l, d[i + 1]); });
      s.ball.position.set((s.v - 0.5) * 3.6, 0.16, 0); s.b.rotation.z = lerp(s.b.rotation.z, -(s.v - 0.5) * 0.5, dt * 4); s.who.rotation.z = lerp(s.who.rotation.z, -(s.v - 0.5) * 1.6, dt * 4); s.who.userData.mat.uniforms.uColor.value.setHex(mid ? GOLD : s.v < 0.5 ? CY : RED);
      if (off) { s.ex = true; K.hit(0); } if (mid) { K.hit(1); s.found[s.sp] = 1; if (Object.keys(s.found).length >= 2 && s.sp !== 0) K.hit(2); }
      K.text(s.msg, d[0] + '：' + (mid ? d[2] + ' —— 恰到好处' : s.v < 0.42 ? d[1] + '（不足）' : d[3] + '（过度）'));
      K.info('倾向 ' + Math.round(s.v * 100) + '% —— 德性被过度和不足毁掉，被中道保全');
    },
    pick: function (K, x, y) { var p = K.st.ball.getWorldPosition(new T.Vector3()); return K.px(K.root.worldToLocal(p), x, y) < 70 ? { drag: true } : null; },
    dragStart: function (K, h, x) { h.x = x; }, dragMove: function (K, h, x) { var s = K.st; s.v = clamp(s.v + (x - h.x) / 560, 0, 1); h.x = x; },
    chips: function (K, box) { var s = K.st; SPH.forEach(function (d, i) { HL.ui.chip(box, d[0], s.sp === i, function () { s.sp = i; s.v = 0.2; HL.refreshTools(); }); }); }
  };
  var M2 = {
    name: '相对于我们的中道', hint: '教练给两个人配口粮（2–10 明那）。上下拖动金色的柱子：先放在算术中点 6，再分别为米隆和初学者找到合适的量。', quotes: QM[1],
    init: function (K) {
      var s = K.st; K.grid(0, FY, 4.0, 1.6, 0x46d2ff); s.f = 4; s.who = 0; s.ok = {};
      K.line([V(-0.25, FY, 0), V(-0.25, FY + 1.6, 0), V(0.25, FY + 1.6, 0), V(0.25, FY, 0)], K.lineMat(GOLD, 0.5)); s.col = K.mesh(new T.BoxGeometry(0.44, 1, 0.3), K.holo(GOLD, { core: 0.6 })); s.amt = K.label('', { h: 0.15, color: '#ffd96b' });
      s.mid = K.line([V(-0.4, FY + 0.8, 0), V(0.4, FY + 0.8, 0)], K.lineMat(WH, 0.8, true)); K.label('算术中点 6', { h: 0.1, color: '#ffffff' }).position.set(0.75, FY + 0.8, 0);
      s.p = [K.person(AM, 2.2), K.person(CY, 1.5)]; s.p[0].position.set(-1.4, FY, 0.2); s.p[1].position.set(1.5, FY, 0.2); s.pl = [K.label('摔跤名将米隆', { h: 0.12, color: '#ffa23a' }), K.label('体操初学者', { h: 0.12, color: '#6fe3ff' })]; s.pl[0].position.set(-1.4, FY + 1.25, 0.2); s.pl[1].position.set(1.5, FY + 0.95, 0.2); s.msg = msg(K, 2.2);
    },
    update: function (K) {
      var s = K.st, h = (s.f - 2) / 8; s.col.scale.y = Math.max(0.01, h * 1.6); s.col.position.set(0, FY + h * 0.8, 0); s.amt.position.set(0, FY + h * 1.6 + 0.15, 0); K.text(s.amt, s.f.toFixed(1) + ' 明那');
      var best = s.who === 0 ? 8.5 : 3.5, d = s.f - best, good = Math.abs(d) <= 0.5; s.p.forEach(function (p, i) { p.userData.mat.uniforms.uOp.value = i === s.who ? 1.4 : 0.4; }); s.p[s.who].scale.set(1 + clamp(d, -3, 3) * 0.06, 1, 1 + clamp(d, -3, 3) * 0.06);
      if (Math.abs(s.f - 6) < 0.3) K.hit(0); if (good) { s.ok[s.who] = 1; if (s.ok[0] && s.ok[1]) K.hit(1); }
      K.text(s.msg, (s.who === 0 ? '米隆：' : '初学者：') + (good ? '正合适 —— 这是“相对于他”的中道' : d < 0 ? '太少了，撑不住训练' : '太多了，吃不下也练不动'));
      K.info('对事物本身的中点是 6；对我们的中道因人而异 —— 上下拖动金色柱子，用下方按钮换人');
    },
    pick: function (K, x, y) { var s = K.st; return K.px(s.amt.position, x, y) < 90 || K.px(s.col.position, x, y) < 70 ? { drag: true } : null; },
    dragStart: function (K, h, x, y) { h.y = y; }, dragMove: function (K, h, x, y) { var s = K.st; s.f = clamp(s.f - (y - h.y) / 28, 2, 10); h.y = y; },
    chips: function (K, box) { var s = K.st; HL.ui.chip(box, '米隆', s.who === 0, function () { s.who = 0; HL.refreshTools(); }); HL.ui.chip(box, '初学者', s.who === 1, function () { s.who = 1; HL.refreshTools(); }); }
  };
  var M3 = {
    name: '矫枉过正', hint: '这根木料天生弯向享乐一侧。左右拖动上端的白球，朝相反方向用力拉，直到它回到中间的竖线。', quotes: QM[2],
    init: function (K) { var s = K.st; s.drift = -0.35; s.pull = 0; s.t = 0; K.line([V(0, FY, 0), V(0, FY + 2.0, 0)], K.lineMat(GOLD, 0.6, true)); s.ln = K.line([V(0, 0, 0), V(0, 0, 0)], K.lineMat(0xffb27c, 1)); s.ln2 = K.line([V(0, 0, 0), V(0, 0, 0)], K.lineMat(0xffb27c, 1)); s.h = K.sphere(0.12, K.glow(WH, 0.95)); K.label('享乐 ←', { h: 0.12, color: '#ff7a7a' }).position.set(-1.5, FY + 1.9, 0); K.label('→ 苦行', { h: 0.12, color: '#6fe3ff' }).position.set(1.5, FY + 1.9, 0); s.msg = msg(K, 2.4); },
    update: function (K, dt) {
      var s = K.st, b = s.drift + s.pull * 0.9, pts = [], p2 = []; s.t += dt; if (s.t > 1.5) K.hit(0);
      for (var i = 0; i <= 20; i++) { var u = i / 20, x = b * 1.6 * u * u; pts.push(V(x - 0.04, FY + u * 1.9, 0)); p2.push(V(x + 0.04, FY + u * 1.9, 0)); } K.setLine(s.ln, pts); K.setLine(s.ln2, p2); s.h.position.set(b * 1.6, FY + 1.95, 0);
      var str = Math.abs(b) < 0.05 && s.pull >= 0.35; if (str) K.hit(1);
      K.text(s.msg, str ? '笔直了：要到达中道，得先朝自己偏向的反面多拉一些' : s.pull > 0.6 ? '拉过头了' : '');
      K.info('天性偏斜 ' + Math.round(s.drift * 100) + ' · 反向矫正 ' + (s.pull >= 0 ? '+' : '') + Math.round(s.pull * 100) + ' —— 像矫直弯木头的人那样');
    },
    pick: function (K, x, y) { return K.px(K.st.h.position, x, y) < 70 ? { drag: true } : null; },
    dragStart: function (K, h, x) { h.x = x; }, dragMove: function (K, h, x) { var s = K.st; s.pull = clamp(s.pull + (x - h.x) / 380, -0.6, 0.8); h.x = x; }
  };
  var ZN = [['不足之恶', CY, 'd'], ['中道之德', GR, 'm'], ['过度之恶', AM, 'e'], ['本身即恶 · 无中道', RED, 'n']], CD = [['勇敢', 'm'], ['鲁莽', 'e'], ['怯懦', 'd'], ['恶意嫉妒 / 谋杀', 'n']];
  var M4 = {
    name: '边界与练习', hint: '把四张卡片拖进它们所属的区域：不足、中道、过度，或者“本身即恶、没有中道”。', quotes: QM[3],
    init: function (K) {
      var s = K.st; s.n = 0; s.z = ZN.map(function (d, i) { var c = V(-1.65 + i * 1.1, FY + 1.3, -0.2); K.line([V(c.x - 0.5, c.y - 0.45, c.z), V(c.x + 0.5, c.y - 0.45, c.z), V(c.x + 0.5, c.y + 0.45, c.z), V(c.x - 0.5, c.y + 0.45, c.z), V(c.x - 0.5, c.y - 0.45, c.z)], K.lineMat(d[1], 0.9)); var p = K.flat(1, 0.9, K.glow(d[1], 0.08)); p.position.copy(c); K.label(d[0], { h: 0.11, color: '#ffffff' }).position.set(c.x, c.y + 0.56, c.z); return { c: c, k: d[2] }; });
      s.cards = CD.map(function (d, i) { var m = K.mesh(new T.BoxGeometry(0.9, 0.2, 0.04), K.holo(0xffc46a, { core: 0.4 })); K.label(d[0], { h: 0.12, color: '#ffffff', parent: m }).position.z = 0.04; m.userData = { home: V(-1.65 + i * 1.1, FY + 0.25, 0.7), k: d[1], n: d[0] }; m.position.copy(m.userData.home); return m; });
    },
    update: function (K) { K.info('并非每种行为都有中道：有些名字本身就意味着恶，没有“适度的谋杀”（已归类 ' + K.st.n + ' / 4）'); },
    pick: function (K, x, y) { var m = K.near(K.st.cards.filter(function (q) { return !q.userData.done; }), x, y, 70); return m ? { drag: true, m: m } : null; },
    dragStart: function (K, h, x, y) { h.d = K.facing(h.m.position, x, y); }, dragMove: function (K, h, x, y) { var p = h.d && h.d.to(x, y); if (p) h.m.position.copy(p); },
    dragEnd: function (K, h) { var s = K.st, m = h.m, z = s.z.filter(function (q) { return Math.abs(m.position.x - q.c.x) < 0.55 && Math.abs(m.position.y - q.c.y) < 0.6; })[0]; if (z && z.k === m.userData.k) { m.position.set(z.c.x, z.c.y, z.c.z + 0.1); m.userData.done = true; s.n++; if (m.userData.k === 'n') K.hit(0); if (s.n >= 4) K.hit(1); } else { if (z) K.toast('“' + m.userData.n + '”不属于这里'); m.position.copy(m.userData.home); } }
  };
  HL.sims.define('aristotle_mean', { lift: -0.35, zoom: 1.1, title: '亚里士多德 · 德性中道', source: '——', flat: true, core: '为什么德性不是算术上的“正中间”，而是因时、因人、因境的“恰到好处”？', bound: '亚里士多德明确指出：并非所有行为和情感都有中道。嫉妒、偷盗、谋杀本身即恶，不存在“适度的偷盗”。', stages: [M1, M2, M3, M4] });
})();
