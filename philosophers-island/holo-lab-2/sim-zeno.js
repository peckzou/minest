/* Minest · 全息模型 · 芝诺 · 运动悖论 — the lab model #83 rebuilt as a hologram: a real track you can walk round.
   ① the dichotomy (each step halves what is left; the time slabs fill exactly one unit) · ② Achilles and the tortoise ·
   ③ the arrow (a frozen instant against a rate of change over a neighbourhood). Same steps and quotations. */
(function () {
  'use strict';
  var HL = window.HL, T = window.THREE; if (!HL || !T || !HL.sims || !HL.simQ) return;
  var Q = HL.simQ.zeno.map(function (st) { return st.map(function (r) { return r.map(function (t) { return String(t).replace(/\$[^$]*\$/g, function (m) { return /catch/.test(m) ? 'T = d₀ / (v_A − v_T)' : '1/2 + 1/4 + 1/8 + … = 1'; }); }); }); }), FY = -0.62, X0 = -2.0, X1 = 2.0, AM = 0xffa23a, CY = 0x46d2ff, GR = 0x7dffb0, PU = 0xb58cff, GOLD = 0xffd96b;
  function V(x, y, z) { return new T.Vector3(x, y, z); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function track(K, z) { K.grid(0, FY, 4.4, 0.7, 0x46d2ff, z); K.line([V(X0, FY + 0.01, z), V(X1, FY + 0.01, z)], K.lineMat(0xffffff, 0.9)); }
  function gate(K, x, z, h, color) { return K.line([V(x, FY, z - 0.3), V(x, FY + h, z - 0.3), V(x, FY + h, z + 0.3), V(x, FY, z + 0.3)], K.lineMat(color, 0.8)); }

  var Z1 = {
    name: '二分法', hint: '点「折半推进一段」：每走一步，离终点都还剩一半。再点「连续推进 10 步」，看后面那块“时间”是怎么被填满的。', quotes: Q[0],
    init: function (K) {
      var s = K.st; track(K, 0.5); s.n = 0; s.x = 0; s.tx = 0; s.auto = 0; s.autoT = 0;
      s.who = K.person(AM, 1.2); gate(K, X1, 0.5, 0.9, GR); K.label('终点 · 1', { h: 0.13, color: '#7dffb0' }).position.set(X1, FY + 1.05, 0.5); K.label('0', { h: 0.13, color: '#ffffff' }).position.set(X0, FY + 0.12, 1.0);
      // the unit of time: a 1.4 × 1.4 frame that the slabs 1/2, 1/4, 1/8 … fill
      s.fx = -0.6; s.fy = FY + 0.72; s.S = 1.2;
      K.line([V(s.fx, s.fy, -0.7), V(s.fx + s.S, s.fy, -0.7), V(s.fx + s.S, s.fy + s.S, -0.7), V(s.fx, s.fy + s.S, -0.7), V(s.fx, s.fy, -0.7)], K.lineMat(GOLD, 0.9));
      K.label('总耗时 = 1/2 + 1/4 + 1/8 + … ', { h: 0.13, color: '#ffd96b' }).position.set(0, s.fy + s.S + 0.14, -0.7);
      s.sum = K.label('', { h: 0.16, color: '#ffffff' }); s.sum.position.set(0, FY + 0.5, -0.7); s.left = K.label('', { h: 0.13, color: '#ffa23a' });
    },
    step: function (K) {
      var s = K.st; if (s.n >= 24) return; s.n++; var done = 1 - Math.pow(0.5, s.n), seg = Math.pow(0.5, s.n); s.tx = done;
      if (s.n <= 12) {
        gate(K, lerp(X0, X1, done), 0.5, Math.max(0.12, 0.9 * Math.pow(0.82, s.n)), s.n % 2 ? AM : CY);
        // slab n: alternately split the remaining rectangle left/right then bottom/top
        var r = s.rect || (s.rect = [0, 0, 1, 1]), v = s.n % 2 === 1, w = v ? r[2] / 2 : r[2], h = v ? r[3] : r[3] / 2;
        var m = K.flat(w * s.S - 0.012, h * s.S - 0.012, K.glow(s.n % 2 ? AM : CY, 0.5)); m.position.set(s.fx + (r[0] + w / 2) * s.S, s.fy + (r[1] + h / 2) * s.S, -0.7);
        if (s.n <= 5) K.label('1/' + Math.pow(2, s.n), { h: Math.max(0.07, 0.2 * Math.pow(0.72, s.n - 1)), color: '#ffffff' }).position.copy(m.position);
        s.rect = v ? [r[0] + w, r[1], r[2] - w, r[3]] : [r[0], r[1] + h, r[2], r[3] - h];
      }
      if (s.n >= 3) K.hit(0);
    },
    update: function (K, dt) {
      var s = K.st; s.x = lerp(s.x, s.tx, Math.min(1, dt * 5));
      if (s.auto > 0) { s.autoT -= dt; if (s.autoT <= 0) { s.autoT = 0.28; Z1.step(K); if (--s.auto === 0) K.hit(1); } }
      var px = lerp(X0, X1, s.x); s.who.position.set(px, FY, 0.5); s.left.position.set((px + X1) / 2, FY + 0.5, 0.5);
      var rem = Math.pow(0.5, s.n); K.text(s.left, s.n ? '还剩 ' + (rem >= 0.001 ? '1/' + Math.pow(2, s.n) : rem.toExponential(1)) : ''); K.text(s.sum, s.n ? '已走 ' + s.n + ' 段 · 路程与耗时都是 ' + (1 - rem).toFixed(Math.min(7, s.n)) : '');
      K.info(s.n === 0 ? '要走完 1，先得走完 1/2；再走完剩下的一半……点下方「折半推进一段」' : s.n < 12 ? '段数可以无穷多，但每一段的耗时也在同步折半 —— 看后面的方框' : '无穷多段，加起来严格等于 1：方框被填满，却永远不会溢出');
    },
    chips: function (K, box) { var s = K.st; HL.ui.chip(box, '½ 折半推进一段', false, function () { Z1.step(K); }, '走完剩余路程的一半'); HL.ui.chip(box, '⏩ 连续推进 10 步', false, function () { s.auto = 10; s.autoT = 0; }, '连续折半十次'); }
  };

  var Z2 = {
    name: '阿基里斯与乌龟', hint: '点「跑到乌龟刚才的位置」几次：每次赶到，乌龟又往前爬了一点。再点「连续时间」，看他到底追不追得上。', quotes: Q[1],
    init: function (K) {
      var s = K.st; track(K, 0.3); s.vA = 1; s.vT = 0.4; s.a = 0; s.b = 0.42; s.ta = 0; s.tb = 0.42; s.n = 0; s.run = false; s.t = 0;
      s.A = K.person(AM, 1.3); s.Tt = K.mesh(new T.SphereGeometry(0.13, 16, 10), K.holo(GR, { core: 0.6 })); s.Tt.scale.y = 0.6;
      K.label('阿基里斯', { h: 0.11, color: '#ffa23a', parent: s.A }).position.y = 0.72; K.label('乌龟', { h: 0.11, color: '#7dffb0', parent: s.Tt }).position.y = 0.3;
      s.catchX = 0.42 / (1 - 0.4); gate(K, lerp(X0, X1, s.catchX), 0.3, 1.1, GOLD); K.label('追平点 T = d₀ / (v_A − v_T)', { h: 0.12, color: '#ffd96b' }).position.set(lerp(X0, X1, s.catchX), FY + 1.25, 0.3);
      s.gap = K.label('', { h: 0.14, color: '#ffffff' }); s.gap.position.set(0, FY + 1.7, 0.3);
    },
    update: function (K, dt) {
      var s = K.st;
      if (s.run) { s.t += dt * 0.35; s.a = s.t * s.vA; s.b = 0.42 + s.t * s.vT; s.ta = s.a; s.tb = s.b; if (s.a > s.catchX + 0.12) { s.run = false; K.hit(1); } }
      else { s.a = lerp(s.a, s.ta, Math.min(1, dt * 5)); s.b = lerp(s.b, s.tb, Math.min(1, dt * 5)); }
      s.A.position.set(lerp(X0, X1, s.a), FY, 0.3); s.Tt.position.set(lerp(X0, X1, s.b), FY + 0.09, 0.3);
      var g = s.b - s.a; K.text(s.gap, g > 0 ? '差距 ' + g.toFixed(Math.min(6, 2 + s.n)) + (s.n ? '（第 ' + s.n + ' 次赶到）' : '') : '阿基里斯已经超过乌龟 ' + (-g).toFixed(2));
      K.info(s.run || g <= 0 ? '芝诺的无穷多步，全都挤在追平时刻之前那一小段有限的时间里' : s.n < 3 ? '点「跑到乌龟刚才的位置」：芝诺只截取“追上之前”的时刻' : '差距越来越小，却“永远差一点” —— 现在点「连续时间」，让时间照常流过');
    },
    chips: function (K, box) {
      var s = K.st;
      HL.ui.chip(box, '→ 跑到乌龟刚才的位置', false, function () { if (s.run || s.b - s.a <= 0) return; var d = s.tb - s.ta; gate(K, lerp(X0, X1, s.tb), 0.3, Math.max(0.1, 0.7 * Math.pow(0.75, s.n)), CY); s.ta = s.tb; s.tb += d * s.vT / s.vA; s.n++; if (s.n >= 3) K.hit(0); }, '阿基里斯跑到乌龟上一刻所在的位置');
      HL.ui.chip(box, '⏱ 连续时间：直接越过追平时刻', false, function () { s.t = s.ta / s.vA; s.run = true; }, '不再只截取追上之前的时刻');
    }
  };

  var Z3 = {
    name: '飞矢不动', hint: '箭在飞。点「瞬间定格」：每一个没有长度的瞬间里，箭都占据一个与自身等长的位置 —— 它在动吗？再点「邻域变化率」。', quotes: Q[2],
    init: function (K) {
      var s = K.st; track(K, 0.3); s.mode = 'fly'; s.x = 0; s.ft = 0;
      var mk = function (op) { var g = new T.Group(); K.add(g); var sh = K.mesh(new T.CylinderGeometry(0.018, 0.018, 0.6, 8), K.holo(0xffffff, { core: 0.8, op: op }), g); sh.rotation.z = Math.PI / 2; var hd = K.mesh(new T.ConeGeometry(0.06, 0.16, 10), K.holo(AM, { core: 0.9, op: op }), g); hd.rotation.z = -Math.PI / 2; hd.position.x = 0.36; return g; };
      s.arrow = mk(1); s.ghosts = []; for (var i = 0; i < 7; i++) { var g = mk(0.3); g.visible = false; s.ghosts.push(g); }
      s.box = K.line([V(0, 0, 0), V(0, 0, 0)], K.lineMat(GOLD, 0.9)); s.box.visible = false; s.dx = K.line([V(0, 0, 0), V(0, 0, 0)], K.lineMat(GR, 1)); s.dx.visible = false;
      s.lab = K.label('', { h: 0.15, color: '#ffffff' }); s.lab.position.set(0, FY + 1.75, 0.3); s.lab2 = K.label('', { h: 0.13, color: '#7dffb0' }); s.lab2.position.set(0, FY + 1.5, 0.3);
    },
    update: function (K, dt, t) {
      var s = K.st, y = FY + 0.9; if (s.mode !== 'freeze') s.x = (s.x + dt * 0.22) % 1;
      var px = lerp(X0 + 0.4, X1 - 0.4, s.x); s.arrow.position.set(px, y, 0.3);
      s.ghosts.forEach(function (g, i) { g.visible = s.mode === 'freeze'; g.position.set(lerp(X0 + 0.4, X1 - 0.4, (i + 0.5) / 7), y, 0.3); });
      s.box.visible = s.mode === 'freeze'; if (s.box.visible) K.setLine(s.box, [V(px - 0.32, y - 0.12, 0.3), V(px + 0.46, y - 0.12, 0.3), V(px + 0.46, y + 0.12, 0.3), V(px - 0.32, y + 0.12, 0.3), V(px - 0.32, y - 0.12, 0.3)]);
      s.dx.visible = s.mode === 'rate';
      if (s.mode === 'rate') { s.ft += dt; var h = Math.max(0.02, 0.6 * Math.pow(0.5, Math.floor(s.ft / 1.1))), v = 0.22 * (X1 - X0 - 0.8); K.setLine(s.dx, [V(px, y - 0.22, 0.3), V(px - h, y - 0.22, 0.3), V(px - h, y - 0.16, 0.3), V(px - h, y - 0.28, 0.3)]); K.text(s.lab2, 'Δx = ' + h.toFixed(3) + ' ，Δt = ' + (h / v).toFixed(3) + ' ，Δx/Δt = ' + v.toFixed(2)); if (s.ft > 3) K.hit(1); } else K.text(s.lab2, '');
      K.text(s.lab, s.mode === 'freeze' ? '瞬间 Δt = 0：每一帧里，箭都恰好占据与自身等长的位置' : s.mode === 'rate' ? '运动不在某一个瞬间里，而在邻域的变化率里：v = lim Δx/Δt' : '');
      K.info(s.mode === 'fly' ? '箭在飞行。点下方「瞬间定格」' : s.mode === 'freeze' ? '如果时间只是一个个静止的“现在”拼成的，静止的帧怎么合成运动？—— 点「邻域变化率」' : '区间不断缩小，比值却稳定在同一个数：这就是“在这一瞬的速度”');
    },
    chips: function (K, box) { var s = K.st; HL.ui.chip(box, '◼ 瞬间定格 Δt = 0', s.mode === 'freeze', function () { s.mode = 'freeze'; K.hit(0); HL.refreshTools(); }); HL.ui.chip(box, '∂ 邻域变化率 dx/dt', s.mode === 'rate', function () { s.mode = 'rate'; s.ft = 0; HL.refreshTools(); }); HL.ui.chip(box, '▶ 继续飞', s.mode === 'fly', function () { s.mode = 'fly'; HL.refreshTools(); }); }
  };

  HL.sims.define('zeno', { lift: -0.35, zoom: 1.1, title: '芝诺 · 运动悖论', source: '——', flat: true,
    core: '要走完一段路，得先走完一半，再走完剩下的一半……有限的时间里要完成无穷多步，运动究竟是怎么抵达终点的？',
    bound: '芝诺提出这些悖论，是为了捍卫巴门尼德“存在是一、运动只是感官幻象”的学说。极限与无穷级数给出了数学上的回答（1/2 + 1/4 + … = 1）；但时空是否无限可分、“超任务”能否完成，哲学上的争论延续至今。', stages: [Z1, Z2, Z3] });
})();
