/* Minest · 全息模型 · 康德 ×3 — minest_kant_moral / kant_categories / kant_transcendental rebuilt as holograms.
   Same stages, steps and quotations as the 2D models; the scenes are spatial: a globe of people for the universal law,
   four standing "mirrors" of the categories, a lattice of space with a river of time. */
(function () {
  'use strict';
  var HL = window.HL, T = window.THREE; if (!HL || !T || !HL.sims || !HL.simQ) return;
  var FY = -0.62, AM = 0xffa23a, CY = 0x46d2ff, PU = 0xb58cff, RED = 0xff7a7a, GR = 0x7dffb0, GOLD = 0xffd96b, TAU = Math.PI * 2;
  function V(x, y, z) { return new T.Vector3(x, y, z); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function rnd(seed) { var s = seed >>> 0; return function () { s = (s + 0x6D2B79F5) >>> 0; var t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function card(K, text, color, w) { var m = K.mesh(new T.BoxGeometry(w || 1.25, 0.2, 0.04), K.holo(color || 0xffc46a, { core: 0.4, rim: 1.2 })); m.userData.lab = K.label(text, { h: 0.12, color: '#ffffff', parent: m }); m.userData.lab.position.z = 0.04; return m; }
  function pillar(K, x, z, color, name) { var g = { v: 0 }; K.line([V(x - 0.12, FY, z), V(x - 0.12, FY + 1.5, z), V(x + 0.12, FY + 1.5, z), V(x + 0.12, FY, z), V(x - 0.12, FY, z)], K.lineMat(color, 0.5)); g.bar = K.mesh(new T.BoxGeometry(0.2, 1, 0.2), K.holo(color, { core: 0.5, rim: 1.2 })); g.x = x; g.z = z; g.lab = K.label(name, { h: 0.12, color: '#ffffff' }); g.lab.position.set(x, FY + 1.66, z); g.set = function (v) { g.v = v; g.bar.scale.y = Math.max(0.001, v * 1.5); g.bar.position.set(x, FY + v * 0.75, z); }; g.set(0); return g; }

  /* ═════════════ 道德法则 ═════════════ */
  var QM = HL.simQ.kant_moral;
  var MAX = [{ k: 'life', n: '痛苦多于快乐时，出于自爱结束生命' }, { k: 'talent', n: '舒适就好，荒废自己的才能' }, { k: 'help', n: '只顾自己，从不帮助他人' }, { k: 'kind', n: '在别人困难时尽力帮助' }];
  var VERD = { life: ['作为自然法则，它在毁灭它本应维持的生命：这个世界无法存在', '#ff7a7a'], talent: ['世界仍能存续……但理性存在者能意愿自己的能力都被荒废吗？', '#ffd96b'], help: ['世界照样运转 —— 可轮到你需要帮助时呢？意志自相矛盾', '#ffd96b'], kind: ['这条准则可以无矛盾地被设想、被意愿为普遍法则', '#7dffb0'] };
  var M1 = {
    name: '普遍化准则', hint: '把左边一条准则拖到中间的世界上，再按住画面（或空格），让它传遍每一个人。四条都试试。', quotes: QM[0],
    init: function (K) {
      var s = K.st, r = rnd(5); s.sel = null; s.spread = 0; s.N = 150; s.d = K.dots(s.N, 0.13); s.P = [];
      for (var i = 0; i < s.N; i++) { var y = 1 - (i + 0.5) / s.N * 2, rr = Math.sqrt(1 - y * y), a = i * 2.399963; s.P.push({ x: Math.cos(a) * rr, y: y, z: Math.sin(a) * rr, st: 1, need: r() < 0.25 }); }
      s.globe = new T.Group(); s.globe.position.set(1.0, FY + 1.05, 0); K.add(s.globe); s.globe.add(s.d.pts);
      K.mesh(new T.SphereGeometry(0.98, 24, 16), K.glow(0x1f7fb8, 0.07, { wire: true }), s.globe);
      s.cards = MAX.map(function (m, i) { var c = card(K, '“' + m.n + '”', 0xffc46a, 1.75); c.userData.home = V(-1.3, FY + 1.55 - i * 0.36, 0.3); c.position.copy(c.userData.home); c.userData.m = m; return c; });
      s.msg = K.label('', { h: 0.14, color: '#ffffff' }); s.msg.position.set(0.6, FY + 2.25, 0);
    },
    update: function (K, dt, t) {
      var s = K.st, m = s.sel; s.globe.rotation.y += dt * 0.15;
      if (K.pressed && m) { s.spread = Math.min(1, s.spread + dt * 0.25); K.hit(1); }
      var n = Math.floor(s.spread * s.N), alive = 0;
      s.P.forEach(function (p, i) {
        var inf = i < n;
        if (m && inf) { if (m.k === 'life') p.st = Math.max(0, p.st - dt * 0.5 * (p.need ? 1 : 0.4)); if (m.k === 'talent') p.st = Math.max(0.35, p.st - dt * 0.15); if (m.k === 'help' && p.need) p.st = Math.max(0.1, p.st - dt * 0.3); }
        if (p.st > 0.05) alive++;
        var k = 0.25 + 0.75 * p.st, c = m && m.k === 'kind' && inf ? [0.5, 1, 0.7] : m && m.k === 'help' && inf && p.need ? [1, 0.45, 0.45] : p.st > 0.7 ? [0.55, 0.8, 1] : p.st > 0.3 ? [0.8, 0.65, 0.4] : [0.3, 0.3, 0.3];
        var pulse = m && m.k === 'help' && inf && p.need ? 1 + 0.06 * Math.sin(t * 5 + i) : 1;
        s.d.set(i, p.x * pulse, p.y * pulse, p.z * pulse); s.d.rgb(i, c[0] * k * p.st + 0.02, c[1] * k * p.st + 0.02, c[2] * k * p.st + 0.02);
      }); s.d.flush();
      if (m && s.spread >= 1) { K.text(s.msg, VERD[m.k][0]); if (m.k === 'life' && alive < s.N * 0.5) { K.hit(2); K.hit(5); } if (m.k === 'talent') { K.hit(3); K.hit(5); } if (m.k === 'help') { K.hit(4); K.hit(5); } }
      else K.text(s.msg, m ? (K.pressed ? '传播中…… ' + Math.round(s.spread * 100) + '%' : '按住画面：让每个人都按这条准则行动') : '');
      s.cards.forEach(function (c) { c.material.uniforms.uOp.value = m === c.userData.m ? 1.6 : 0.8; });
      K.info(m ? '准则：“' + m.n + '” —— 按住画面（或空格）让它成为所有人的法则；之后再换一条' : '把左边的一条准则拖到中间的世界上');
    },
    pick: function (K, x, y) { var c = K.near(K.st.cards, x, y, 90); return c ? { drag: true, c: c } : null; },
    dragStart: function (K, h, x, y) { h.d = K.facing(h.c.position, x, y); },
    dragMove: function (K, h, x, y) { var p = h.d && h.d.to(x, y); if (p) h.c.position.copy(p); },
    dragEnd: function (K, h) { var s = K.st, c = h.c; if (c.position.x > -0.2) { s.sel = c.userData.m; s.spread = 0; s.P.forEach(function (p) { p.st = 1; }); K.hit(0); K.toast('准则：“' + s.sel.n + '”。现在按住画面，让所有人都按它行动'); } c.position.copy(c.userData.home); }
  };
  var M2 = {
    name: '虚假承诺', hint: '按住画面（或空格），让“借钱时许下明知做不到的承诺”成为人人遵守的法则，看信任的柱子；先点一下「问自己」。', quotes: QM[1],
    init: function (K) {
      var s = K.st; s.liars = 0; s.trust = 1; s.t = 0; s.L = []; s.spawn = 0; s.mock = 0;
      K.grid(0, FY, 4.4, 1.6, 0x46d2ff);
      s.lender = K.person(PU, 1.5); s.lender.position.set(1.7, FY, 0); K.label('放贷的人', { h: 0.12, color: '#b58cff' }).position.set(1.7, FY + 0.82, 0);
      var b = K.person(AM, 1.3); b.position.set(-1.9, FY, 0); K.label('急需钱的人：“我保证还”', { h: 0.12, color: '#ffa23a' }).position.set(-1.7, FY + 0.75, 0);
      s.d = K.dots(40, 0.2); s.pil = pillar(K, 2.05, -0.5, GR, '信任'); s.msg = K.label('', { h: 0.14, color: '#ff7a7a' }); s.msg.position.set(0, FY + 1.5, 0); s.say = K.label('', { h: 0.13, color: '#ff7a7a' }); s.say.position.set(1.7, FY + 1.05, 0);
    },
    update: function (K, dt, t) {
      var s = K.st; s.t += dt; if (s.t > 1) K.hit(0);
      if (K.pressed) s.liars = Math.min(1, s.liars + dt * 0.18);
      s.trust = lerp(s.trust, 1 - s.liars, dt * 0.8); s.pil.set(s.trust); s.pil.bar.material.uniforms.uColor.value.setHex(s.trust > 0.5 ? GR : s.trust > 0.2 ? GOLD : RED);
      s.spawn -= dt; if (s.spawn <= 0 && s.L.length < 40) { s.spawn = 0.4; s.L.push({ x: -1.6, z: (Math.random() - 0.5) * 1.2, lie: Math.random() < s.liars, st: 'go' }); }
      s.L.forEach(function (l) { if (l.st === 'go') { l.x += dt * 0.9; if (l.x > 1.4) { l.st = Math.random() < s.trust ? 'lent' : 'denied'; if (l.st === 'denied' && s.trust < 0.3) s.mock = 1.5; } } else l.x -= dt * (l.st === 'lent' ? 0.7 : 1.2); });
      s.L = s.L.filter(function (l) { return l.x > -1.7; });
      for (var i = 0; i < 40; i++) { var l = s.L[i]; if (!l) { s.d.set(i, 0, -9, 0); continue; } s.d.set(i, l.x, FY + 0.16, l.z); var c = l.st === 'denied' ? [1, 0.25, 0.25] : l.st === 'lent' ? [1, 0.85, 0.3] : l.lie ? [1, 0.55, 0.3] : [0.5, 0.8, 1]; s.d.rgb(i, c[0], c[1], c[2]); } s.d.flush();
      s.mock = Math.max(0, s.mock - dt); K.text(s.say, s.mock > 0 ? '“又是空话！”' : '');
      if (s.trust < 0.25) { K.hit(2); K.text(s.msg, '没人再相信承诺：连撒谎者也借不到钱了。承诺本身消失了'); } else K.text(s.msg, '');
      if (s.trust < 0.15 && s.mock > 0) K.hit(3);
      K.info('撒谎者比例 ' + Math.round(s.liars * 100) + '% · 信任 ' + Math.round(s.trust * 100) + '% —— 按住画面（或空格）：让虚假承诺成为人人遵守的法则');
    },
    chips: function (K, box) { HL.ui.chip(box, '？问自己：如果我的准则成为普遍法则会怎样', false, function () { K.hit(1); K.toast('那就按住画面，真的让它普遍化，看看会怎样'); }); }
  };
  var GOALS = ['画画', '读书', '种花', '远行', '学医', '作曲'];
  var M3 = {
    name: '人是目的', hint: '拖动一个人：把他当工具使唤，看他头上的火焰；或者拖动他头上的火焰：帮他实现他自己的目的。', quotes: QM[2],
    init: function (K) {
      var s = K.st; s.t = 0; K.grid(0, FY, 4.2, 2.6, 0x46d2ff);
      s.you = K.person(CY, 1.5); s.you.position.set(0, FY, 0); K.label('你', { h: 0.14, color: '#6fe3ff' }).position.set(0, FY + 0.82, 0);
      s.ppl = GOALS.map(function (g, i) {
        var a = i / 6 * TAU + 0.5, p = { g: K.person(0xffb27c, 1.1), flame: 1, prog: 0.2, assent: 1, tool: false, home: V(Math.cos(a) * 1.65, FY, Math.sin(a) * 0.95) };
        p.g.position.copy(p.home); p.fl = K.mesh(new T.ConeGeometry(0.07, 0.24, 10), K.holo(AM, { core: 0.9, rim: 1.2 })); p.lab = K.label(g, { h: 0.11, color: '#ffa23a' });
        p.ring = K.mesh(new T.TorusGeometry(0.16, 0.012, 6, 40), K.glow(GR, 0.9)); p.ring.rotation.x = Math.PI / 2; p.rope = K.line([V(0, 0, 0), V(0, 0, 0)], K.lineMat(0xaaaaaa, 0)); p.say = K.label('', { h: 0.1, color: '#ff7a7a' });
        return p;
      });
    },
    update: function (K, dt, t) {
      var s = K.st; s.t += dt; if (s.t > 1) K.hit(0);
      s.ppl.forEach(function (p) {
        if (!p.tool) { p.flame = Math.min(1, p.flame + dt * 0.05); p.assent = Math.min(1, p.assent + dt * 0.04); p.g.position.lerp(p.home, dt * 2); }
        var q = p.g.position; p.fl.position.set(q.x, q.y + 0.78, q.z); p.fl.scale.set(0.4 + p.flame * 0.8, (0.3 + p.flame) * (1 + 0.1 * Math.sin(t * 8 + q.x)), 0.4 + p.flame * 0.8); p.fl.material.uniforms.uOp.value = 0.2 + 0.9 * p.flame;
        p.lab.position.set(q.x, q.y + 1.02, q.z); p.ring.position.set(q.x, q.y + 0.62, q.z); p.ring.scale.setScalar(0.5 + p.prog * 1.3);
        p.g.userData.mat.uniforms.uColor.value.setHex(p.tool ? 0x8a8f96 : 0xffb27c);
        K.setLine(p.rope, [V(0, FY + 0.45, 0), V(q.x, q.y + 0.35, q.z)]); p.rope.material.opacity = p.tool ? 0.9 : 0;
        K.text(p.say, p.tool ? '被当作工具' : p.assent < 0.6 ? '同意 ' + Math.round(p.assent * 100) + '%' : ''); p.say.position.set(q.x, q.y - 0.1, q.z + 0.15);
      });
      K.info('拖动一个人 = 把他当工具使唤（他的火焰会熄灭）· 拖动他头上的火焰 = 把你的力量用在他自己的目的上');
    },
    pick: function (K, x, y) { var s = K.st, f = K.near(s.ppl.map(function (p) { return p.fl; }), x, y, 34); if (f) return { drag: true, p: s.ppl.filter(function (p) { return p.fl === f; })[0], mode: 'help' }; var g = K.near(s.ppl.map(function (p) { return p.g; }), x, y, 60); return g ? { drag: true, p: s.ppl.filter(function (p) { return p.g === g; })[0], mode: 'use' } : null; },
    dragStart: function (K, h, x, y) { h.x = x; h.y = y; },
    dragMove: function (K, h, x, y) {
      var p = h.p, d = Math.hypot(x - h.x, y - h.y) / 900; h.x = x; h.y = y;
      if (h.mode === 'use') { p.tool = true; var q = K.onPlane(x, y, FY); if (q) p.g.position.set(clamp(q.x, -2, 2), FY, clamp(q.z, -1.2, 1.2)); p.flame = Math.max(0, p.flame - d / 0.6); p.assent = Math.max(0, p.assent - d / 0.4); K.hit(1); if (p.assent < 0.4) K.hit(2); if (p.flame < 0.15) K.hit(3); }
      else { p.prog = Math.min(1, p.prog + d / 0.8); if (p.prog > 0.5) K.hit(4); }
    },
    dragEnd: function (K, h) { h.p.tool = false; }
  };
  var M4 = {
    name: '善良意志', hint: '按住画面（或空格）尽全力把石头推上山；再用下面的按钮把命运的阻碍放到路上，看看意志的宝石。', quotes: QM[3],
    init: function (K) {
      var s = K.st; s.t = 0; s.pos = 0; s.effort = 0; s.obs = 0; s.failT = 0; s.shine = 0;
      s.a = V(-1.9, FY, 0); s.b = V(1.2, FY + 1.5, 0);
      K.line([s.a, s.b, V(1.9, FY + 1.5, 0)], K.lineMat(0xffc46a, 0.9)); K.line([V(-1.9, FY, 0.5), V(1.2, FY + 1.5, 0.5), V(1.9, FY + 1.5, 0.5)], K.lineMat(0xffc46a, 0.4));
      for (var i = 0; i <= 8; i++) { var p = s.a.clone().lerp(s.b, i / 8); K.line([p, V(p.x, p.y, 0.5)], K.lineMat(0xffc46a, 0.25)); }
      K.label('目标', { h: 0.14, color: '#ffd96b' }).position.set(1.6, FY + 1.75, 0.25);
      s.stone = K.sphere(0.2, K.holo(0xb9a58a, { core: 0.5 })); s.who = K.person(CY, 1.2);
      s.gem = K.mesh(new T.OctahedronGeometry(0.16, 0), K.holo(0xffffff, { core: 0.6, rim: 2 })); s.halo = K.sphere(0.2, K.glow(0xffffff, 0.2));
      s.gl = K.label('善良意志', { h: 0.12, color: '#ffffff' }); s.msg = K.label('', { h: 0.14, color: '#ffffff' }); s.msg.position.set(0, FY + 2.2, 0); s.rocks = [];
    },
    update: function (K, dt, t) {
      var s = K.st; s.t += dt; if (s.t > 1) K.hit(0);
      if (K.pressed) { s.effort = Math.min(1, s.effort + dt * 0.8); K.hit(1); } else s.effort = Math.max(0, s.effort - dt * 0.6);
      var block = s.rocks.filter(function (r) { return r.k > s.pos; }).sort(function (a, b) { return a.k - b.k; })[0], lim = block ? block.k - 0.07 : 1;
      if (K.pressed) s.pos = Math.min(lim, s.pos + dt * 0.14); else s.pos = Math.max(0, s.pos - dt * (s.rocks.length ? 0.1 : 0.03));
      if (block && K.pressed && s.pos >= lim - 0.001) { s.failT += dt; if (s.failT > 1.5) { K.hit(3); if (s.failT > 3.5) K.hit(4); } }
      s.shine = lerp(s.shine, Math.max(s.effort, s.failT > 0 ? 1 : 0), dt * 2);
      var p = s.a.clone().lerp(s.b, s.pos); s.stone.position.set(p.x, p.y + 0.2, 0.25); s.who.position.set(p.x - 0.32, p.y - 0.15 * 0, 0.25); s.who.position.y = lerp(s.a.y, s.b.y, Math.max(0, s.pos - 0.1));
      s.gem.position.set(s.who.position.x, s.who.position.y + 0.85, 0.25); s.gem.rotation.y = t * 1.2; s.gem.material.uniforms.uOp.value = 0.5 + s.shine * 1.6; s.halo.position.copy(s.gem.position); s.halo.scale.setScalar(1 + s.shine * 2.2); s.gl.position.copy(s.gem.position); s.gl.position.y += 0.3;
      K.text(s.msg, s.failT > 1.5 ? '结果失败了 —— 它仍像宝石一样，凭自身放射光芒' : block && K.pressed ? '命运挡在路上：再用力也过不去' : '');
      K.info(s.rocks.length ? '按住画面（或空格）继续尽全力 —— 结果由不得你，意志的价值呢？' : '按住画面（或空格）：调动一切手段把石头推上山；然后放一个「命运的阻碍」');
    },
    chips: function (K, box) { var s = K.st; ['暴雨', '落石', '厄运'].forEach(function (n, i) { HL.ui.chip(box, '＋' + n, false, function () { var k = clamp(s.pos + 0.18 + i * 0.05, 0.2, 0.92), p = s.a.clone().lerp(s.b, k); var r = K.mesh(new T.DodecahedronGeometry(0.2, 0), K.holo(RED, { core: 0.5 })); r.position.set(p.x, p.y + 0.2, 0.25); K.label(n, { h: 0.11, color: '#ff7a7a' }).position.set(p.x, p.y + 0.55, 0.25); s.rocks.push({ k: k }); K.hit(2); K.toast(n + '：命运挡在了路上'); }, '把' + n + '放到他前面的路上'); }); }
  };
  HL.sims.define('kant_moral', { lift: -0.4, zoom: 1.12, title: '康德 · 道德法则', source: '——', flat: true, core: '我怎么知道一个行为是不是道德的？不看后果，只问一件事：我行动所依据的准则，能不能成为所有人的法则？', stages: [M1, M2, M3, M4] });

  /* ═════════════ 十二范畴与因果性 ═════════════ */
  var QC = HL.simQ.kant_categories;
  var C1 = {
    name: '杂多与综合', hint: '感官送来的只是散乱的杂多。按住画面（或空格）施加“我思”，把它们聚拢成一个对象；一直按住，再松手看看。', quotes: QC[0],
    init: function (K) {
      var s = K.st, r = rnd(9); s.N = 90; s.d = K.dots(s.N, 0.12); s.P = []; s.k = 0; s.held = 0; s.t = 0; s.formed = false;
      for (var i = 0; i < s.N; i++) { var e = i % 12, f = (Math.floor(i / 12) + 0.5) / 8, A = [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]], E = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]][e], a = A[E[0]], b = A[E[1]];
        s.P.push({ r: V((r() - 0.5) * 4.2, FY + 0.2 + r() * 1.9, (r() - 0.5) * 2.4), ph: r() * 6, t: V(lerp(a[0], b[0], f) * 0.55, FY + 1.1 + lerp(a[1], b[1], f) * 0.55, lerp(a[2], b[2], f) * 0.55) }); }
      s.i = K.label('', { h: 0.16, color: '#ffd96b' }); s.i.position.set(0, FY + 2.0, 0);
    },
    update: function (K, dt, t) {
      var s = K.st; s.t += dt; if (s.t > 1) K.hit(0);
      if (K.pressed) { s.k = Math.min(1, s.k + dt * 0.7); K.hit(1); if (s.k >= 1) { s.held += dt; if (s.held > 2) { K.hit(2); s.formed = true; } } } else { if (s.formed && s.k > 0.5) K.hit(3); s.k = Math.max(0, s.k - dt * 0.9); s.held = 0; if (s.k < 0.05) s.formed = false; }
      var e = s.k * s.k * (3 - 2 * s.k);
      s.P.forEach(function (p, i) { var x = p.r.x + Math.sin(t * 0.7 + p.ph) * 0.25, y = p.r.y + Math.cos(t * 0.9 + p.ph) * 0.15, z = p.r.z + Math.sin(t * 0.5 + p.ph * 2) * 0.2; s.d.set(i, lerp(x, p.t.x, e), lerp(y, p.t.y, e), lerp(z, p.t.z, e)); s.d.rgb(i, lerp(0.45, 1, e), lerp(0.7, 0.85, e), lerp(1, 0.42, e)); }); s.d.flush();
      K.text(s.i, s.k > 0.05 ? '“我思”' + (s.held > 2 ? ' —— 一个对象' : '') : '');
      K.info(s.k >= 1 ? (s.held > 2 ? '对象稳定成形了。现在松手 ——' : '继续按住：“我思”必须能伴随我的一切表象') : s.k > 0 ? '正在综合……' : '散乱、互不相关的杂多 —— 按住画面（或空格）施加“我思”');
    }
  };
  var FR = [{ k: 'q', n: '量', c: 0x5ee7ff, x: -1.55, y: 1.35 }, { k: 'l', n: '质', c: 0xc79bff, x: 1.25, y: 1.35 }, { k: 'r', n: '关系', c: 0xffc96b, x: -1.55, y: 0.25 }, { k: 'm', n: '模态', c: 0x7dffb0, x: 1.25, y: 0.25 }];
  var C2 = {
    name: '范畴之镜', hint: '把中央的对象拖进四面镜子里的任意一面，然后按住画面（或空格）；在“关系之镜”里还可以拖动右边的小球。', quotes: QC[1],
    init: function (K) {
      var s = K.st; s.in = null; s.hT = 0; s.q = 0; s.deg = 0; s.melt = 0; s.mod = 0; s.dragged = 0;
      s.fr = FR.map(function (f) { var c = V(f.x, FY + f.y, -0.3), w = 0.62, h = 0.48; var ln = K.line([V(c.x - w, c.y - h, c.z), V(c.x + w, c.y - h, c.z), V(c.x + w, c.y + h, c.z), V(c.x - w, c.y + h, c.z), V(c.x - w, c.y - h, c.z)], K.lineMat(f.c, 0.9)); var pl = K.flat(w * 2, h * 2, K.glow(f.c, 0.06)); pl.position.copy(c); K.label(f.n + '之镜', { h: 0.13, color: '#ffffff' }).position.set(c.x, c.y + h + 0.12, c.z); return { f: f, c: c, pl: pl, st: K.label('', { h: 0.12, color: '#ffffff' }) }; });
      s.fr.forEach(function (o) { o.st.position.set(o.c.x, o.c.y - 0.62, o.c.z); });
      s.obj = K.mesh(new T.IcosahedronGeometry(0.2, 0), K.holo(GOLD, { core: 0.5 })); s.home = V(-0.15, FY + 0.8, 0.5); s.obj.position.copy(s.home);
      s.clones = []; for (var i = 0; i < 5; i++) { var m = K.mesh(new T.IcosahedronGeometry(0.11, 0), K.holo(0x5ee7ff, { core: 0.5 })); m.visible = false; s.clones.push(m); }
      s.b = K.sphere(0.1, K.holo(0xffc96b, { core: 0.6 })); s.b.visible = false; s.link = K.line([V(0, 0, 0), V(0, 0, 0)], K.lineMat(0xffc96b, 0.8, true)); s.link.visible = false; s.bo = V(0.3, 0, 0); s.ao = V(0, 0, 0);
    },
    update: function (K, dt, t) {
      var s = K.st, f = s.in, hold = K.pressed && f; s.obj.rotation.y += dt * 0.6; if (hold) s.hT += dt;
      s.fr.forEach(function (o) { o.pl.material.opacity = f === o ? 0.16 : 0.05; });
      s.clones.forEach(function (m) { m.visible = false; }); s.b.visible = s.link.visible = false; s.obj.scale.setScalar(1); s.obj.material.uniforms.uOp.value = 1;
      if (!f) { K.info('把中央的对象拖进一面镜子'); return; }
      var c = f.c, k = f.f.k; s.obj.position.lerp(V(c.x + (k === 'r' ? s.ao.x - 0.2 : 0), c.y + (k === 'r' ? s.ao.y : 0), c.z + 0.1), dt * 6);
      if (k === 'q') { if (hold) s.q = Math.min(6, s.q + dt * 1.2); var n = Math.floor(s.q); s.clones.forEach(function (m, i) { m.visible = i < n - 1; m.position.set(c.x - 0.45 + ((i + 1) % 3) * 0.3 + 0.15, c.y + 0.22 - Math.floor((i + 1) / 3) * 0.36, c.z + 0.1); }); if (n >= 1) s.obj.position.set(c.x - 0.45, c.y + 0.22, c.z + 0.1); K.text(f.st, n < 2 ? '单一性：一' : n < 6 ? '多数性：多（' + n + '）' : '全体性：把“多”看作“一” —— 全'); if (n >= 2) K.hit(1); if (n >= 6) K.hit(3); }
      else if (k === 'l') { if (hold) s.deg = Math.min(1, s.deg + dt * 0.3); s.obj.material.uniforms.uOp.value = 0.05 + s.deg * 1.8; K.text(f.st, s.deg < 0.05 ? '否定性：0' : s.deg < 1 ? '实在性：感觉的程度 ' + Math.round(s.deg * 100) + '%' : '限制性：有程度的实在'); if (s.deg > 0.3) K.hit(2); if (s.deg >= 1) K.hit(3); }
      else if (k === 'r') { if (hold && !K.held) s.melt = Math.min(1, s.melt + dt * 0.4); s.obj.scale.set(1 + s.melt * 0.9, 1 - s.melt * 0.55, 1 + s.melt * 0.9); s.b.visible = s.link.visible = true; s.b.position.set(c.x + s.bo.x, c.y + s.bo.y, c.z + 0.1); K.setLine(s.link, [s.obj.position.clone(), s.b.position.clone()]); K.text(f.st, s.dragged > 0.3 ? '协同性：一个动，另一个也被牵动' : s.melt > 0.5 ? '实体：形状变了，总量不变' : '按住：让它融化变形；拖动小球'); if (s.melt > 0.6) K.hit(4); }
      else { if (hold) s.mod = Math.min(1, s.mod + dt * 0.3); s.obj.material.uniforms.uOp.value = s.mod < 0.34 ? 0.25 : 1; s.obj.scale.setScalar(s.mod > 0.67 ? 1 + 0.05 * Math.sin(t * 6) : 1); K.text(f.st, s.mod < 0.34 ? '可能性：可以被设想' : s.mod < 0.67 ? '现实性：在知觉中被给予' : '必然性：按规则非如此不可'); if (s.mod > 0.67) K.hit(6); if (s.mod >= 1) K.hit(7); }
      K.info(f.f.n + '的范畴 —— 在这面镜子里按住画面（或空格）' + (k === 'r' ? '；拖动右边的小球' : '') + ' · 换一面镜子：点下方「取出对象」');
    },
    pick: function (K, x, y) { var s = K.st; if (s.in && s.in.f.k === 'r' && K.px(s.b.position, x, y) < 40) return { drag: true, b: true }; if (!s.in && K.px(s.obj.position, x, y) < 60) return { drag: true }; return null; },
    dragStart: function (K, h, x, y) { h.d = K.facing(h.b ? K.st.b.position : K.st.obj.position, x, y); if (!h.b) K.hit(0); },
    dragMove: function (K, h, x, y) { var s = K.st, p = h.d && h.d.to(x, y); if (!p) return; if (h.b) { var c = s.in.c, nx = clamp(p.x - c.x, -0.5, 0.5), ny = clamp(p.y - c.y, -0.4, 0.4); s.dragged += Math.abs(nx - s.bo.x) + Math.abs(ny - s.bo.y); s.ao.set(s.ao.x + (nx - s.bo.x) * 0.6, s.ao.y + (ny - s.bo.y) * 0.6, 0); s.bo.set(nx, ny, 0); if (s.dragged > 0.3) K.hit(5); } else s.obj.position.copy(p); },
    dragEnd: function (K, h) { var s = K.st; if (h.b) return; var o = s.fr.filter(function (o) { return Math.abs(s.obj.position.x - o.c.x) < 0.75 && Math.abs(s.obj.position.y - o.c.y) < 0.6; })[0]; if (o) { s.in = o; s.hT = 0; K.toast(o.f.n + '的范畴：在镜子里按住画面'); } else s.obj.position.copy(s.home); },
    chips: function (K, box) { var s = K.st; HL.ui.chip(box, '⏏ 取出对象', false, function () { s.fr.forEach(function (o) { K.text(o.st, ''); }); s.in = null; s.obj.position.copy(s.home); }, '把对象从镜子里拿出来，换一面镜子'); }
  };
  var PARTS = ['地基', '墙', '门', '窗', '屋顶'];
  var C3 = {
    name: '房屋与航船', hint: '左：上下拖动视线，随意扫视一座房屋。右：拖动航船（试着往回拖）。前：先试着拖动 B，再轻点 A 让它撞过去。', quotes: QC[2],
    init: function (K) {
      var s = K.st; s.seq = []; s.dir = {}; s.ship = 0.05; s.back = 0; s.push = 0; s.ball = { t: 0, run: false, tried: 0, done: false };
      s.parts = PARTS.map(function (n, i) { var m = K.mesh(i === 4 ? new T.ConeGeometry(0.52, 0.34, 4) : new T.BoxGeometry(0.7, 0.24, 0.5), K.holo(0xffb27c, { core: 0.25 })); m.position.set(-1.5, FY + 0.14 + i * 0.27 + (i === 4 ? 0.04 : 0), -0.4); if (i === 4) m.rotation.y = Math.PI / 4; K.label(n, { h: 0.1, color: '#ffb27c' }).position.set(-2.1, m.position.y, -0.4); return m; });
      s.eye = K.mesh(new T.TorusGeometry(0.1, 0.012, 6, 28), K.glow(0xffffff, 0.95)); s.eye.position.set(-1.5, FY + 0.7, 0.0);
      K.label('房屋：先看哪儿都行', { h: 0.11, color: '#ffffff' }).position.set(-1.5, FY + 1.78, -0.4);
      s.river = K.flat(2.0, 0.5, K.glow(0x3aa0e0, 0.2)); s.river.rotation.x = -Math.PI / 2; s.river.position.set(1.1, FY + 0.5, -0.4);
      K.label('航船：上游 → 下游', { h: 0.11, color: '#ffffff' }).position.set(1.1, FY + 1.05, -0.4);
      s.boat = K.mesh(new T.ConeGeometry(0.12, 0.4, 4), K.holo(0xffffff, { core: 0.5 })); s.boat.rotation.z = -Math.PI / 2;
      s.flow = K.dots(14, 0.08); s.A = K.sphere(0.13, K.holo(AM)); s.B = K.sphere(0.13, K.holo(CY)); K.label('A', { h: 0.14, parent: s.A }); K.label('B', { h: 0.14, parent: s.B });
      s.msg = K.label('', { h: 0.13, color: '#ffd96b' }); s.msg.position.set(0, FY + 0.75, 1.0);
    },
    update: function (K, dt, t) {
      var s = K.st, b = s.ball; s.push = Math.max(0, s.push - dt * 2);
      s.boat.position.set(0.2 + s.ship * 1.8 - s.push * 0.05 * Math.sin(t * 30), FY + 0.56, -0.4);
      for (var i = 0; i < 14; i++) { s.flow.set(i, 0.1 + ((i / 14 + t * 0.12) % 1) * 2.0, FY + 0.51, -0.6 + (i % 3) * 0.2); s.flow.rgb(i, 0.4, 0.8, 1); } s.flow.flush();
      if (b.run) { b.t += dt; if (b.t > 2.2) { b.run = false; b.done = true; if (b.tried) K.hit(3); } }
      var k = b.run ? b.t : 0; s.A.position.set(lerp(-0.9, -0.26, clamp(k, 0, 1)), FY + 0.13, 1.0); s.B.position.set(k > 1 ? (k - 1) * 0.8 : 0, FY + 0.13, 1.0);
      if (QC[2].slice(0, 4).every(function (_, j) { return HL.sims.isLit(j); })) K.hit(4);
      K.info('房屋的各部分谁先谁后由我的眼睛决定；航船在上游的位置必然先于下游 —— 这个次序不由我定');
    },
    pick: function (K, x, y) { var s = K.st; if (K.px(s.eye.position, x, y) < 46) return { drag: true, k: 'eye' }; if (K.px(s.boat.position, x, y) < 50) return { drag: true, k: 'ship' }; if (K.px(s.B.position, x, y) < 40) return { drag: true, k: 'B' }; if (K.px(s.A.position, x, y) < 40) return { k: 'A' }; return null; },
    dragStart: function (K, h, x, y) { h.x = x; h.y = y; if (h.k === 'B') { K.st.ball.tried++; K.text(K.st.msg, '想让 B 先动？它纹丝不动 —— 结果不能先于原因'); K.hit(3); } },
    dragMove: function (K, h, x, y) {
      var s = K.st, dx = x - h.x, dy = y - h.y; h.x = x; h.y = y;
      if (h.k === 'eye') { s.eye.position.y = clamp(s.eye.position.y - dy / 190, FY + 0.1, FY + 1.4); var part = PARTS[clamp(Math.floor((s.eye.position.y - FY) / 0.27), 0, 4)], last = s.seq[s.seq.length - 1]; if (last !== part) { if (last) s.dir[PARTS.indexOf(part) > PARTS.indexOf(last) ? 'up' : 'down'] = 1; s.seq.push(part); s.parts.forEach(function (m, i) { m.material.uniforms.uOp.value = PARTS[i] === part ? 2 : 1; }); if (s.dir.up && s.dir.down) K.hit(0); } }
      if (h.k === 'ship') { if (dx < 0) { s.push = 1; s.back += -dx; if (s.back > 60) { K.hit(2); K.text(s.msg, '往回拖：被顶回来 —— 知觉的次序是被规定的'); } } else { s.ship = clamp(s.ship + dx / 420, 0.05, 0.95); if (s.ship > 0.3) K.hit(1); } }
    },
    tap: function (K, h) { var s = K.st; if (h && h.k === 'A' && !s.ball.run) { s.ball.run = true; s.ball.t = 0; } }
  };
  var C4 = {
    name: '与休谟对照', hint: '轻点一下看第一次碰撞；然后按住画面（或空格）让它一次次重复，比较两根柱子。', quotes: QC[3],
    init: function (K) { var s = K.st; s.n = 0; s.t = 0; s.go = false; K.grid(0, FY, 3.6, 1.2, 0x46d2ff, 0.5); s.A = K.sphere(0.15, K.holo(AM)); s.B = K.sphere(0.15, K.holo(CY)); K.label('A', { h: 0.15, parent: s.A }); K.label('B', { h: 0.15, parent: s.B }); s.kant = pillar(K, -1.2, -0.7, GOLD, '康德：因果的必然性（知性的规则）'); s.hume = pillar(K, 1.2, -0.7, PU, '休谟：习惯性的期待（主观）'); s.cnt = K.label('', { h: 0.16, color: '#ffffff' }); s.cnt.position.set(0, FY + 1.95, -0.7); },
    update: function (K, dt, t) {
      var s = K.st; if (s.go || K.pressed) s.t += dt * (K.pressed && s.n > 0 ? 2.2 : 0.9);
      if (s.t >= 2) { s.t = 0; s.n++; s.go = false; if (s.n === 1) { K.hit(0); K.toast('第一次：康德的必然性已经在这里'); } if (s.n >= 5) K.hit(1); if (s.n >= 12) K.hit(2); }
      var k = s.t; s.A.position.set(lerp(-1.4, -0.3, clamp(k, 0, 1)), FY + 0.15, 0.5); s.B.position.set(k > 1 ? (k - 1) * 1.3 : 0, FY + 0.15, 0.5);
      s.kant.set(s.n >= 1 || k > 1 ? 1 : 0); var hu = s.n <= 1 ? 0 : 1 - 1 / Math.sqrt(s.n); s.hume.set(hu); K.text(s.cnt, '已观察 ' + s.n + ' 次');
      K.info(s.n === 0 ? '轻点画面：看第一次碰撞' : '康德：从第一次经验起就在，它使“事件”成为可能 · 休谟：' + s.n + ' 次之后才长到 ' + Math.round(hu * 100) + '%，永远到不了 100% —— 按住继续重复');
    },
    tap: function (K) { var s = K.st; if (!s.go && s.t === 0) s.go = true; }
  };
  HL.sims.define('kant_categories', { lift: -0.4, zoom: 1.12, title: '康德 · 十二范畴与因果性', source: '——', flat: true, core: '散乱的感觉怎样成为“一个对象”？“先后发生”凭什么是客观的，而不只是我看的顺序？', stages: [C1, C2, C3, C4] });

  /* ═════════════ 先验认识结构 ═════════════ */
  var QT = HL.simQ.kant_transcendental;
  function lattice(K, n, size, color, op) { var pts = [], h = size / 2, i, j; for (i = 0; i <= n; i++) for (j = 0; j <= n; j++) { var a = -h + size * i / n, b = -h + size * j / n; pts.push(V(a, b, -h), V(a, b, h), V(a, -h, b), V(a, h, b), V(-h, a, b), V(h, a, b)); } var m = K.lineMat(color, op), g = new T.LineSegments(K.own(new T.BufferGeometry().setFromPoints(pts)), m); K.add(g); return g; }
  var T1 = {
    name: '空间', hint: '按住一个物体，剥去它的颜色、软硬、重量；清空所有物体后按住空白处想抹掉空间；再把一个物体拖到网格边缘。', quotes: QT[0],
    init: function (K) {
      var s = K.st; s.lat = lattice(K, 4, 2.4, CY, 0.22); s.lat.position.set(0, FY + 1.25, 0); s.sc = 1; s.erase = 0; s.empty = false;
      s.obs = [[new T.SphereGeometry(0.24, 20, 14), AM, -0.7], [new T.BoxGeometry(0.4, 0.4, 0.4), 0xff8fb1, 0], [new T.ConeGeometry(0.24, 0.5, 16), GR, 0.7]].map(function (o) { var m = K.mesh(o[0], K.holo(o[1], { core: 0.7 })); m.position.set(o[2], FY + 1.0, 0.2); m.userData = { strip: 0, col: new T.Color(o[1]), lab: K.label('', { h: 0.11, color: '#ffffff' }) }; return m; });
      s.msg = K.label('', { h: 0.14, color: '#ffffff' }); s.msg.position.set(0, FY + 2.75, 0);
    },
    update: function (K, dt, t) {
      var s = K.st, held = K.held && K.held.o;
      s.obs.forEach(function (m) { var u = m.userData; if (held === m && !K.held.moved) u.strip = Math.min(1, u.strip + dt * 0.4); var k = u.strip; m.material.uniforms.uColor.value.copy(u.col).lerp(new T.Color(0x9feaff), clamp(k * 3, 0, 1)); m.material.uniforms.uCore.value = 0.7 * (1 - clamp(k * 3 - 1, 0, 1)); m.material.wireframe = k > 0.67; K.text(u.lab, !m.visible ? '' : k <= 0 ? '' : k < 0.34 ? '剥去：颜色' : k < 0.67 ? '剥去：软硬' : k < 1 ? '剥去：重量' : '只剩：广延与形状'); u.lab.position.set(m.position.x, m.position.y - 0.42, m.position.z); if (k >= 1) K.hit(0); });
      if (s.empty && K.pressed) { s.erase = Math.min(1, s.erase + dt * 0.5); if (s.erase > 0.9) K.hit(1); } else s.erase = Math.max(0, s.erase - dt * 1.5);
      s.lat.material.opacity = 0.22 * (1 - 0.6 * s.erase) + (s.erase > 0.5 ? 0.1 * Math.sin(t * 20) : 0); s.lat.scale.setScalar(lerp(s.lat.scale.x, s.sc, dt * 3));
      K.text(s.msg, s.erase > 0.5 ? '空间抹不掉：可以想象其中没有任何东西，却不能想象没有空间' : s.sc > 1 ? '空间随它延伸：它不是由许多小空间拼成的' : '');
      K.info(s.empty ? '物体都拿走了。按住空白处（或空格），试着把空间本身也抹掉' : '按住一个物体不放：性质一层层剥去 · 拖到网格边缘：空间跟着延伸');
    },
    pick: function (K, x, y) { var o = K.near(K.st.obs, x, y, 60); return o ? { drag: true, o: o } : null; },
    dragStart: function (K, h, x, y) { h.d = K.facing(h.o.position, x, y); h.moved = true; },
    dragMove: function (K, h, x, y) { var s = K.st, p = h.d && h.d.to(x, y); if (!p) return; h.o.position.copy(p); var far = Math.max(Math.abs(p.x), Math.abs(p.y - FY - 1.25), Math.abs(p.z)); if (far > 1.15) { s.sc = Math.min(1.5, far / 1.15 * 1.05); K.hit(2); } },
    chips: function (K, box) { var s = K.st; HL.ui.chip(box, s.empty ? '＋ 放回物体' : '⌫ 清空所有物体', s.empty, function () { s.empty = !s.empty; s.obs.forEach(function (m) { m.visible = !s.empty; }); HL.refreshTools(); }); }
  };
  var T2 = {
    name: '时间', hint: '把时间轴上的事件一个个拖下来；按住空白处想让时间停下；再把上方的“念头”拖进空间网格里。', quotes: QT[1],
    init: function (K) {
      var s = K.st; s.flow = 1; s.ph = 0; s.stopT = 0; s.lat = lattice(K, 3, 1.5, CY, 0.16); s.lat.position.set(0, FY + 1.75, -0.3);
      K.line([V(-2.1, FY + 0.5, 0.5), V(2.1, FY + 0.5, 0.5)], K.lineMat(GOLD, 1)); K.label('时间', { h: 0.13, color: '#ffd96b' }).position.set(-2.1, FY + 0.68, 0.5); s.ticks = K.dots(16, 0.09);
      s.ev = ['日出', '钟声', '下雨', '入睡'].map(function (n, i) { var m = K.sphere(0.11, K.holo(AM, { core: 0.7 })); m.position.set(-1.2 + i * 0.8, FY + 0.5, 0.5); m.userData = { on: true, lab: K.label(n, { h: 0.11, color: '#ffa23a', parent: m }) }; m.userData.lab.position.y = 0.22; return m; });
      s.th = K.sphere(0.13, K.holo(PU, { core: 0.7 })); s.thHome = V(1.5, FY + 1.6, 0.6); s.th.position.copy(s.thHome); s.th.userData = { lab: K.label('一个念头', { h: 0.11, color: '#b58cff', parent: s.th }) }; s.th.userData.lab.position.y = 0.24; s.fall = 0;
      s.msg = K.label('', { h: 0.14, color: '#ffffff' }); s.msg.position.set(0, FY + 2.75, 0);
    },
    update: function (K, dt, t) {
      var s = K.st, stop = K.pressed; s.flow = lerp(s.flow, stop ? 0.25 : 1, dt * 3); s.ph += dt * 0.25 * s.flow; if (stop) { s.stopT += dt; if (s.stopT > 2) K.hit(1); }
      for (var i = 0; i < 16; i++) { s.ticks.set(i, -2.1 + ((i / 16 + s.ph) % 1) * 4.2, FY + 0.5, 0.5); s.ticks.rgb(i, 1, 0.85, 0.42); } s.ticks.flush();
      if (s.ev.every(function (m) { return !m.userData.on; })) K.hit(0);
      if (s.fall > 0) { s.fall = Math.max(0, s.fall - dt); s.th.position.lerp(V(0.4, FY + 0.5, 0.5), dt * 4); if (s.fall <= 0) K.hit(2); }
      K.text(s.msg, s.fall > 0 || s.th.position.y < FY + 0.6 ? '念头没有空间位置：它只落在时间上' : stop && s.stopT > 1 ? '停不住：时间不能被取消，只能把现象从时间里拿走' : '');
      K.info('把事件拖下时间轴（时间照常流过）· 按住空白处想让它停下 · 把“念头”拖进上方的空间网格');
    },
    pick: function (K, x, y) { var s = K.st, o = K.near(s.ev.concat([s.th]), x, y, 50); return o ? { drag: true, o: o } : null; },
    dragStart: function (K, h, x, y) { h.d = K.facing(h.o.position, x, y); },
    dragMove: function (K, h, x, y) { var p = h.d && h.d.to(x, y); if (p) h.o.position.copy(p); },
    dragEnd: function (K, h) { var s = K.st, o = h.o; if (o === s.th) { if (Math.abs(o.position.x) < 0.9 && o.position.y > FY + 0.9) { s.fall = 1.2; K.toast('它在网格里找不到位置……'); } else o.position.copy(s.thHome); return; } if (Math.abs(o.position.y - FY - 0.5) > 0.3) { o.userData.on = false; o.material.uniforms.uOp.value = 0.35; } }
  };
  var T3 = {
    name: '感性与知性', hint: '按住画面（或空格）让感觉材料涌入；把右边的“概念”框拖到中央 —— 分别试试：没有材料时放、有材料时放、只有材料不放。', quotes: QT[2],
    init: function (K) {
      var s = K.st, r = rnd(3); s.N = 80; s.d = K.dots(s.N, 0.11); s.P = []; s.flow = 0; s.blind = 0; s.formed = 0; s.has = false;
      for (var i = 0; i < s.N; i++) { var y = 1 - (i + 0.5) / s.N * 2, rr = Math.sqrt(1 - y * y), a = i * 2.4; s.P.push({ u: r(), ph: r() * 6, z: (r() - 0.5) * 1.2, t: V(Math.cos(a) * rr * 0.4, FY + 1.1 + y * 0.4, Math.sin(a) * rr * 0.4) }); }
      s.c = K.mesh(new T.BoxGeometry(0.95, 0.95, 0.95), K.glow(0xffffff, 0.5, { wire: true })); s.home = V(1.8, FY + 1.1, 0.3); s.c.position.copy(s.home); s.cl = K.label('概念（拖我）', { h: 0.12, color: '#ffffff', parent: s.c }); s.cl.position.y = 0.65;
      K.label('感性：被给予', { h: 0.12, color: '#6fe3ff' }).position.set(-1.8, FY + 2.0, 0); K.label('知性：去思维', { h: 0.12, color: '#ffffff' }).position.set(1.8, FY + 2.0, 0);
      s.msg = K.label('', { h: 0.14, color: '#ffd96b' }); s.msg.position.set(0, FY + 2.3, 0);
    },
    update: function (K, dt, t) {
      var s = K.st; if (K.pressed) { s.flow = Math.min(1, s.flow + dt * 1.5); K.hit(0); } else s.flow = Math.max(0, s.flow - dt * 0.35);
      if (s.flow > 0.4 && !s.has) { s.blind += dt; if (s.blind > 3) K.hit(2); }
      if (s.has && s.flow > 0.3) { s.formed = Math.min(1, s.formed + dt * 0.8); if (s.formed > 0.8) K.hit(3); } else if (!s.has) s.formed = Math.max(0, s.formed - dt);
      var e = s.formed;
      s.P.forEach(function (p, i) { var on = p.u < s.flow, x = -2.1 + ((p.u * 3 + t * 0.25) % 1) * 2.1, sw = t * 1.5 + p.ph, wx = lerp(x, Math.cos(sw) * 0.5 * (0.4 + p.u), clamp((x + 0.6) * 2, 0, 1)), wy = FY + 1.1 + Math.sin(sw * 1.3) * 0.45 * p.u, wz = p.z * (1 - clamp((x + 0.6) * 2, 0, 1)) + Math.sin(sw) * 0.4 * p.u * clamp((x + 0.6) * 2, 0, 1);
        s.d.set(i, on ? lerp(wx, p.t.x, e) : 0, on ? lerp(wy, p.t.y, e) : -9, on ? lerp(wz, p.t.z, e) : 0); s.d.rgb(i, lerp(0.45, 1, e), lerp(0.8, 0.85, e), lerp(1, 0.45, e)); }); s.d.flush();
      K.text(s.msg, e > 0.8 ? '对象成形：思维无内容是空的，直观无概念是盲的' : s.has && s.flow < 0.1 ? '只有空框：没有感性，就没有对象被给予' : s.blind > 3 && !s.has ? '材料盲目地乱转：没有概念，它什么也不是' : '');
      K.info('按住画面（或空格）= 感觉材料涌入 · 把“概念”框拖到中央 · 轻点框把它拿回去');
    },
    pick: function (K, x, y) { return K.px(K.st.c.position, x, y) < 80 ? { drag: true, c: true } : null; },
    dragStart: function (K, h, x, y) { h.d = K.facing(K.st.c.position, x, y); },
    dragMove: function (K, h, x, y) { var p = h.d && h.d.to(x, y); if (p) K.st.c.position.copy(p); },
    dragEnd: function (K) { var s = K.st; if (Math.abs(s.c.position.x) < 0.8) { s.c.position.set(0, FY + 1.1, 0); s.has = true; if (s.flow < 0.1) K.hit(1); } else { s.c.position.copy(s.home); s.has = false; } },
    tap: function (K, h) { var s = K.st; if (h && h.c && s.has) { s.has = false; s.c.position.copy(s.home); } }
  };
  var T4 = {
    name: '现象与物自身', hint: '拖动透镜：进入其中的东西才带上网格（空间）与时刻（时间）；按住透镜外的暗处想看物自身；再用力把透镜拖出画面。', quotes: QT[3],
    init: function (K) {
      var s = K.st, r = rnd(11); s.N = 70; s.d = K.dots(s.N, 0.12); s.P = []; for (var i = 0; i < s.N; i++) s.P.push({ x: (r() - 0.5) * 4, y: FY + 0.3 + r() * 1.7, z: (r() - 0.5) * 0.6, ph: r() * 6 });
      s.lens = new T.Group(); s.lens.position.set(-0.6, FY + 1.1, 0.4); K.add(s.lens); K.mesh(new T.TorusGeometry(0.62, 0.02, 8, 64), K.glow(0xffffff, 0.95), s.lens); var gl = K.mesh(new T.CircleGeometry(0.62, 48), K.glow(CY, 0.08), s.lens);
      var pts = []; for (i = -3; i <= 3; i++) { var a = i * 0.18, h = Math.sqrt(0.62 * 0.62 - a * a); pts.push(V(a, -h, 0), V(a, h, 0), V(-h, a, 0), V(h, a, 0)); } s.lens.add(new T.LineSegments(K.own(new T.BufferGeometry().setFromPoints(pts)), K.lineMat(CY, 0.5)));
      s.ll = K.label('我们的认识方式（拖我）', { h: 0.11, color: '#ffffff', parent: s.lens }); s.ll.position.y = 0.78; s.q = K.label('', { h: 0.3, color: '#ffffff' }); s.qT = 0; s.gone = 0; s.pull = 0;
      s.msg = K.label('', { h: 0.14, color: '#ffffff' }); s.msg.position.set(0, FY + 2.4, 0);
    },
    update: function (K, dt, t) {
      var s = K.st, L = s.lens.position, any = false; if (s.gone > 0) s.gone = Math.max(0, s.gone - dt * 0.3);
      s.P.forEach(function (p, i) { var d = Math.hypot(p.x - L.x, p.y - L.y), inn = d < 0.6 && s.gone <= 0; if (inn) any = true; var gx = Math.round((p.x - L.x) / 0.18) * 0.18 + L.x, gy = Math.round((p.y - L.y) / 0.18) * 0.18 + L.y, tw = 0.6 + 0.4 * Math.sin(t * 3 + p.ph);
        s.d.set(i, inn ? gx : p.x + Math.sin(t * 0.4 + p.ph) * 0.05, inn ? gy : p.y, inn ? 0.4 : p.z); var c = inn ? [1 * tw, 0.9 * tw, 0.5 * tw] : [0.1, 0.12, 0.16]; s.d.rgb(i, c[0], c[1], c[2]); }); s.d.flush();
      if (any && s.moved) K.hit(0);
      if (K.pressed) { s.qT += dt; if (s.qT > 1) K.hit(1); } else s.qT = 0; K.text(s.q, s.qT > 0.3 ? '？' : '');
      s.lens.visible = s.gone <= 0; K.text(s.msg, s.gone > 0 ? '透镜一拉开，空间与时间一起消失 —— 它们不属于物自身' : s.qT > 1 ? '物自身是什么样的？我们一无所知' : '');
      K.info('透镜里：有位置、有时刻的“现象” · 透镜外：按住暗处（或空格）试着直接看物自身 · 把透镜一直拖到画面最右边之外');
    },
    pick: function (K, x, y) { var s = K.st; if (s.gone <= 0 && K.px(s.lens.position, x, y) < 110) return { drag: true }; s.q.position.copy(K.onPlane(x, y, FY + 1.1) || V(0, FY + 1.1, 0)); s.q.position.y = FY + 1.1 + (Math.random() - 0.5); return null; },
    dragStart: function (K, h, x, y) { h.d = K.facing(K.st.lens.position, x, y); },
    dragMove: function (K, h, x, y) { var s = K.st, p = h.d && h.d.to(x, y); if (!p) return; s.moved = true; s.lens.position.set(clamp(p.x, -2.2, 2.6), clamp(p.y, FY + 0.4, FY + 1.9), 0.4); },
    dragEnd: function (K) { var s = K.st; if (s.lens.position.x > 2.2) { s.gone = 1; K.hit(2); s.lens.position.set(-0.6, FY + 1.1, 0.4); } }
  };
  var CARDS = [{ n: '石头', z: 'st' }, { n: '钟声', z: 'st' }, { n: '一阵悲伤', z: 't' }, { n: '数到 7', z: 't' }, { n: '远处的山', z: 'st' }, { n: '物自身', z: 'x' }];
  var T5 = {
    name: '应用练习', hint: '把每张卡片拖进它所属的直观形式：左边“空间＋时间（外感官）”，右边“只有时间（内感官）”。', quotes: QT[4],
    init: function (K) {
      var s = K.st; s.x = 0; var a = lattice(K, 3, 1.5, CY, 0.2); a.position.set(-1.15, FY + 1.35, 0); K.label('空间 ＋ 时间（外感官）', { h: 0.12, color: '#6fe3ff' }).position.set(-1.15, FY + 2.25, 0);
      K.line([V(0.4, FY + 1.35, 0), V(1.9, FY + 1.35, 0)], K.lineMat(GOLD, 1)); K.line([V(0.4, FY + 0.6, 0), V(1.9, FY + 0.6, 0), V(1.9, FY + 2.1, 0), V(0.4, FY + 2.1, 0), V(0.4, FY + 0.6, 0)], K.lineMat(GOLD, 0.35, true)); K.label('只有时间（内感官）', { h: 0.12, color: '#ffd96b' }).position.set(1.15, FY + 2.25, 0);
      s.cards = CARDS.map(function (c, i) { var m = card(K, c.n, c.z === 'x' ? 0x9aa7b5 : 0xffc46a, 0.58); m.userData.home = V(-1.95 + i * 0.66, FY + 0.2, 0.9); m.position.copy(m.userData.home); m.userData.c = c; return m; });
    },
    update: function (K) { K.info('拖动卡片到左边的网格或右边的时间线 —— “物自身”也试试'); },
    pick: function (K, x, y) { var c = K.near(K.st.cards.filter(function (m) { return !m.userData.placed; }), x, y, 60); return c ? { drag: true, c: c } : null; },
    dragStart: function (K, h, x, y) { h.d = K.facing(h.c.position, x, y); },
    dragMove: function (K, h, x, y) { var p = h.d && h.d.to(x, y); if (p) h.c.position.copy(p); },
    dragEnd: function (K, h) {
      var s = K.st, m = h.c, c = m.userData.c, p = m.position, where = p.y > FY + 0.55 ? (p.x < -0.35 ? 'st' : p.x > 0.35 ? 't' : null) : null;
      if (!where) { p.copy(m.userData.home); return; }
      if (c.z === 'x') { s.x++; p.copy(m.userData.home); K.toast('“物自身”进不了任何直观形式：它不显现为在空间或时间中'); if (s.x >= 2) K.hit(1); return; }
      if (c.z === where) { m.userData.placed = true; if (s.cards.filter(function (q) { return q.userData.c.z !== 'x'; }).every(function (q) { return q.userData.placed; })) K.hit(0); }
      else { p.copy(m.userData.home); K.toast(c.z === 't' ? '“' + c.n + '”是内心状态：它在时间中，却没有空间位置' : '“' + c.n + '”是外部对象：它在空间中，也在时间中'); }
    }
  };
  HL.sims.define('kant_transcendental', { lift: -0.4, zoom: 1.12, title: '康德 · 先验认识结构', source: '——', flat: true, core: '空间和时间是世界本来就有的，还是我们“看”世界的方式？如果是后者，我们认识到的究竟是什么？', stages: [T1, T2, T3, T4, T5] });
})();
