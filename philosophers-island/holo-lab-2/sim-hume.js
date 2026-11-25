/* Minest · 全息模型 · 休谟 · 因果关系 — the 2D micro-interaction (philosophy/models/minest_hume.html) rebuilt as a hologram.
   Same four stages, the same steps and the same quotations (Enquiry concerning Human Understanding); what is new is the
   third dimension: you can walk round the table, the conceivable outcomes pile up as branches in the volume, the
   repetitions settle into strata above the table, and the "bridges of reason" fall into a real gap. */
(function () {
  'use strict';
  var HL = window.HL, T = window.THREE; if (!HL || !T || !HL.sims) return;
  var Q = [[["A 滚向 B：按住让时间流逝，对象全新", "若一个对象对他完全是新的，即使以最精确的方式检查其可感性质，他也不能发现它的任何原因或结果。", "if that object be entirely new to him, he will not be able, by the most accurate examination of its sensible qualities, to discover any of its causes or effects.", "§23"], ["在接触瞬间拖动 B 的去向：静止、弹回、飞走、穿过", "难道两个球不能都保持绝对静止吗？难道第一个球不能直线返回，或从第二个球上朝任何方向跳开吗？", "May not both these balls remain at absolute rest? May not the first ball return in a straight line, or leap off from the second in any line or direction?", "§25"], ["每一种拖出的结局都照样上演，毫无矛盾", "所有这些假设都是一致的、可设想的。那么我们为什么要偏爱其中一个呢？", "All these suppositions are consistent and conceivable. Why then should we give the preference to one…?", "§25"], ["试过 4 个不同方向：结果无法从原因推出", "总之，每个结果都是与其原因不同的事件。因此它不可能在原因中被发现。", "every effect is a distinct event from its cause. It could not, therefore, be discovered in the cause", "§25"]], [["拖动放大镜扫过碰撞：收集外部感官的印象", "一个台球的冲击伴随着第二个球的运动。这就是呈现于外部感官的全部。", "The impulse of one billiard-ball is attended with motion in the second. This is the whole that appears to the outward senses.", "§50"], ["把放大镜推进接触点：“必然联系”的槽位始终为空", "我们在任何单一事例中都无法发现任何能力或必然联系，即任何把结果与原因结合在一起的性质。", "we are never able, in a single instance, to discover any power or necessary connexion; any quality, which binds the effect to the cause", "§50"], ["按住探查越久越深：仍只有先后", "一个事件跟随另一个，但我们永远观察不到它们之间的任何纽带。", "One event follows another; but we never can observe any tie between them.", "§58"], ["探查时间累积：会合而非联结", "它们似乎是会合的，但从来不是联结的。", "They seem conjoined, but never connected.", "§58"]], [["按住重复碰撞：左右两边对象逐帧相同", "在若干事例中，并没有任何与每一个单一事例不同的东西，它们被假定为完全相似。", "there is nothing in a number of instances, different from every single instance, which is supposed to be exactly similar", "§59"], ["心灵的期待残影越来越早地跑在 B 前面", "只是在相似事例重复之后，心灵被习惯带着，在一个事件出现时去期待它通常的伴随物。", "except only, that after a repetition of similar instances, the mind is carried by habit, upon the appearance of one event, to expect its usual attendant", "§59"], ["第 1 次一侧：心灵没有任何期待", "一个人第一次看到两个台球相撞而传递运动时，他不能断言一个事件与另一个是联结的，只能说是会合的。", "The first time a man saw … the shock of two billiard balls, he could not pronounce that the one event was connected: but only that it was conjoined", "§59"], ["把残影投射线拖到对象上：力线只是心灵转移过去的", "由于我们感到观念之间有一种习惯性的联系，我们就把这种感觉转移到对象上。", "as we feel a customary connexion between the ideas, we transfer that feeling to the objects", "§60 注"], ["重复多次后：习惯性转移就是必然观念的来源", "想象从一个对象到其通常伴随物的这种习惯性转移，就是我们形成能力或必然联系观念的那个情感或印象。", "this customary transition of the imagination from one object to its usual attendant, is the sentiment or impression from which we form the idea of power or necessary connexion.", "§59"]], [["拖“逻辑”桥跨过缺口：桥断裂", "每一件实际事情的反面仍然是可能的，因为它决不会包含矛盾。", "The contrary of every matter of fact is still possible; because it can never imply a contradiction", "§21"], ["拖“过去如此”桥：缺一段中间桥墩，塌落", "“我发现这样一个对象总伴随着这样一个结果”与“我预见外表相似的其他对象将伴随相似的结果”，这两个命题远不相同。", "These two propositions are far from being the same, I have found that such an object has always been attended with such an effect, and I foresee, that other objects, which are, in appearance, similar, will be attended with similar effects.", "§29"], ["拖“自然齐一”桥：桥绕回自身，成了一个圈", "用或然的论证来证明这个假设，显然是在兜圈子，把正在争论的问题当作已经成立的。", "must be evidently going in a circle, and taking that for granted, which is the very point in question.", "§30"], ["三座桥都失败后，按住：习惯把你送过去", "习惯是人生的伟大指导。唯有这一原则使我们的经验对我们有用。", "Custom, then, is the great guide of human life. It is that principle alone which renders our experience useful to us", "§36"], ["过去后：两个因果定义", "① 一个对象跟随另一个对象，凡与前者相似的对象都被与后者相似的对象跟随。② 一个对象跟随另一个对象，前者的出现总把思想带到后者。", "an object, followed by another, and where all the objects similar to the first are followed by objects similar to the second … an object followed by another, and whose appearance always conveys the thought to that other.", "§60"]]];
  var TY = -0.5, R = 0.17, BY = TY + R, AM = 0xffa23a, CY = 0x46d2ff, PU = 0xb58cff, RED = 0xff7a7a, GR = 0x7dffb0;
  function V(x, y, z) { return new T.Vector3(x, y, z); }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  function table(K, cx, w, d) {
    var g = new T.Group(); g.position.set(cx, TY, 0); K.add(g);
    var pts = [], nx = Math.max(4, Math.round(w / 0.38)), nz = Math.max(3, Math.round(d / 0.38)), i;
    for (i = 0; i <= nx; i++) { var x = -w / 2 + w * i / nx; pts.push(V(x, 0, -d / 2), V(x, 0, d / 2)); }
    for (i = 0; i <= nz; i++) { var z = -d / 2 + d * i / nz; pts.push(V(-w / 2, 0, z), V(w / 2, 0, z)); }
    g.add(new T.LineSegments(K.own(new T.BufferGeometry().setFromPoints(pts)), K.lineMat(CY, 0.2)));
    K.line([V(-w / 2, 0, -d / 2), V(w / 2, 0, -d / 2), V(w / 2, 0, d / 2), V(-w / 2, 0, d / 2), V(-w / 2, 0, -d / 2)], K.lineMat(0x9feaff, 0.85), g);
    var fill = new T.Mesh(K.own(new T.PlaneGeometry(w, d)), K.glow(0x1f7fb8, 0.1)); fill.rotation.x = -Math.PI / 2; fill.position.y = -0.004; g.add(fill);
    var skirt = new T.Mesh(K.own(new T.BoxGeometry(w, 0.1, d)), K.glow(0x1f7fb8, 0.05)); skirt.position.y = -0.055; g.add(skirt);
    return g;
  }
  function ball(K, color, letter) {
    var g = new T.Group(); K.add(g);
    var shell = K.sphere(R, K.holo(color), g), core = K.sphere(R * 0.42, K.glow(color, 0.5), g);
    var ring = new T.Mesh(K.own(new T.RingGeometry(R * 0.62, R * 1.08, 36)), K.glow(color, 0.3)); ring.rotation.x = -Math.PI / 2; ring.position.y = -R + 0.006; g.add(ring);
    var lab = K.label(letter, { h: 0.2, color: '#ffffff', parent: g });
    g.userData = { shell: shell, core: core, ring: ring, lab: lab };
    return g;
  }
  function alpha(b, a) { var u = b.userData; u.shell.material.uniforms.uOp.value = a; u.core.material.opacity = 0.5 * a; u.ring.material.opacity = 0.3 * a; u.lab.material.opacity = Math.min(1, a * 1.4); }

  /* ───────────── ① 在经验之前 ───────────── */
  var OUT = { rest: 'B 静止不动', right: 'B 被推走', back: 'B 冲向 A', near: 'B 朝你弹来', far: 'B 向远处弹开', pass: 'A 穿过 B' };
  var S1 = {
    name: '在经验之前', hint: '按住画面（或空格）让 A 滚向 B；接触瞬间拖动 B，决定它的去向。每种设想都会留在空间里。', quotes: Q[0],
    init: function (K) {
      var s = K.st; table(K, 0, 4.6, 2.2);
      s.A = ball(K, AM, 'A'); s.B = ball(K, CY, 'B'); s.G = ball(K, CY, 'B'); alpha(s.G, 0.35); s.G.visible = false;
      s.pulse = new T.Mesh(K.own(new T.TorusGeometry(R * 1.9, 0.012, 8, 56)), K.glow(AM, 0.9)); s.pulse.rotation.x = Math.PI / 2; K.add(s.pulse); s.pulse.visible = false;
      s.aim = K.line([V(0, 0, 0), V(0, 0, 0)], K.lineMat(0xffd27a, 0.95, true)); s.aim.visible = false;
      s.trails = new T.Group(); K.add(s.trails); s.out = [];
      S1.reset(K);
    },
    reset: function (K) { var s = K.st; s.ax = -1.9; s.bx = 0.45; s.bz = 0; s.phase = 'roll'; s.vx = s.vz = 0; s.pass = false; s.t = 0; s.logged = false; s.drag = null; },
    update: function (K, dt, t) {
      var s = K.st, contact = s.bx - 2 * R;
      if (s.phase === 'roll') {
        if (K.pressed) { s.ax = Math.min(0.45 - 2 * R, s.ax + dt * 0.95); K.hit(0); }
        if (s.ax >= 0.45 - 2 * R - 1e-4) { s.phase = 'contact'; K.toast('接触了。接下来 B 会怎样？拖动 B 告诉我'); }
      } else if (s.phase === 'play') {
        s.t += dt; var k = Math.max(0, 1 - 1.1 * dt);
        s.bx = clamp(s.bx + s.vx * dt, -2.1, 2.1); s.bz = clamp(s.bz + s.vz * dt, -0.9, 0.9); s.vx *= k; s.vz *= k;
        if (s.pass) s.ax = Math.min(2.05, s.ax + dt * 0.95);
        if (s.t > 1.6 && !s.logged) {
          s.logged = true;
          var a = V(0.45, BY, 0), b = s.pass ? V(s.ax, BY, 0) : V(s.bx, BY, s.bz), mid = a.clone().lerp(b, 0.5); mid.y += 0.28 + 0.09 * s.trails.children.length;
          var c = new T.QuadraticBezierCurve3(s.pass ? V(0.45 - 2 * R, BY, 0) : a, mid, b);
          K.line(c.getPoints(24), K.lineMat(s.kind === 'right' ? CY : s.kind === 'pass' ? AM : PU, 0.75), s.trails);
          var dot = K.sphere(R * 0.5, K.glow(s.pass ? AM : CY, 0.28), s.trails); dot.position.copy(b);
          var lb = K.label(OUT[s.kind], { h: 0.13, color: '#b58cff', parent: s.trails }); lb.position.copy(mid); lb.position.y += 0.1;
        }
      }
      s.pulse.visible = s.phase === 'contact' && !s.drag; s.pulse.position.set(s.bx, BY, s.bz); s.pulse.scale.setScalar(1 + 0.14 * Math.sin(t * 4.5));
      s.A.position.set(s.ax, BY, 0); s.B.position.set(s.bx, BY, s.bz);
      alpha(s.A, s.pass && Math.abs(s.ax - s.bx) < 2 * R ? 0.5 : 1);
      K.info(s.phase === 'roll' ? (K.pressed ? 'A 在滚动……' : '按住画面（或空格），让 A 滚向 B —— 你第一次看见这种东西 · 拖动空白处可以绕着看')
        : s.phase === 'contact' ? '按住 B，拖向任意方向（原地松手 = 静止；拖过 A = 穿过去）'
        : s.t > 1.6 ? '✓ 可以设想 · 无矛盾 —— 已试 ' + s.out.length + ' 种。轻点画面再来一次' : '');
    },
    pick: function (K, x, y) { var s = K.st; return s.phase === 'contact' && K.px(s.B.position, x, y) < 52 ? { drag: true } : null; },
    dragStart: function (K) { var s = K.st; s.drag = s.B.position.clone(); s.aim.visible = true; s.G.visible = true; },
    dragMove: function (K, h, x, y) {
      var s = K.st, p = K.onPlane(x, y, BY); if (!p || !s.drag) return;
      var d = p.sub(s.B.position); d.y = 0; if (d.length() > 1.7) d.setLength(1.7);
      s.drag.copy(s.B.position).add(d); s.G.position.copy(s.drag); K.setLine(s.aim, [s.B.position.clone(), s.drag.clone()]);
    },
    dragEnd: function (K) {
      var s = K.st; if (!s.drag) return;
      var dx = s.drag.x - s.bx, dz = s.drag.z - s.bz, len = Math.hypot(dx, dz), kind;
      if (len < 0.22) kind = 'rest';
      else if (Math.abs(dx) >= Math.abs(dz)) kind = dx > 0 ? 'right' : (len > 0.8 ? 'pass' : 'back');
      else kind = dz > 0 ? 'near' : 'far';
      s.pass = kind === 'pass'; s.vx = kind === 'rest' || s.pass ? 0 : dx * 1.5; s.vz = kind === 'rest' || s.pass ? 0 : dz * 1.5;
      s.kind = kind; if (s.out.indexOf(kind) < 0) s.out.push(kind);
      s.phase = 'play'; s.t = 0; s.logged = false; s.drag = null; s.aim.visible = false; s.G.visible = false;
      K.hit(1); setTimeout(function () { if (K.st === s) K.hit(2); }, 1200); if (s.out.length >= 4) K.hit(3);
      K.toast(OUT[kind] + '：照样可以设想');
    },
    tap: function (K) { var s = K.st; if (s.phase === 'play' && s.t > 1.5) S1.reset(K); }
  };

  /* ───────────── ② 寻找必然联系 ───────────── */
  var IMP = [['a', 'A 在运动'], ['t', '两球接触'], ['b', 'B 在运动'], ['o', '先后次序'], ['n', '必然联系']];
  var IMPT = { a: '印象：A 的运动', t: '印象：两球接触', b: '印象：B 的运动', o: '印象：先后次序' };
  var S2 = {
    name: '寻找必然联系', hint: '拖动扫描探针跟着碰撞；把它推进接触点并按住不放 —— 镜头会贴近，看看那里到底有什么。', quotes: Q[1],
    init: function (K) {
      var s = K.st; table(K, 0, 4.6, 2.2); s.A = ball(K, AM, 'A'); s.B = ball(K, CY, 'B');
      s.f = 0; s.lx = -0.3; s.lz = 0.62; s.drag = false; s.probe = 0; s.got = {}; s.key = ''; s.zoom = false;
      var L = s.lens = new T.Group(); K.add(L);
      var ring = new T.Mesh(K.own(new T.TorusGeometry(0.42, 0.016, 8, 64)), K.glow(0xffffff, 0.95)); ring.rotation.x = Math.PI / 2; ring.position.y = 0.03; L.add(ring);
      var top = ring.clone(); top.position.y = 1.2; top.scale.setScalar(0.55); L.add(top);
      var col = new T.Mesh(K.own(new T.CylinderGeometry(0.23, 0.42, 1.17, 40, 1, true)), K.glow(0x9feaff, 0.09)); col.position.y = 0.615; L.add(col);
      var lb = K.label('扫描探针 · 拖我', { h: 0.14, color: '#6fe3ff', parent: L }); lb.position.y = 1.38;
      s.note = K.label('', { h: 0.15, color: '#ff7a7a' }); s.note.position.set(0.45 - R, BY + 0.5, 0);
      s.panel = K.panel(1.55, 1.3, 620, function (x, w, h) {
        HL.rr(x, 4, 4, w - 8, h - 8, 26); x.fillStyle = 'rgba(4,22,44,.62)'; x.fill(); x.lineWidth = 3; x.strokeStyle = 'rgba(130,225,255,.85)'; x.stroke();
        x.textBaseline = 'middle'; x.font = '800 30px ' + HL.FONT; x.fillStyle = '#6fe3ff'; x.fillText('印象清单 · IMPRESSIONS', 34, 50);
        IMP.forEach(function (r, i) {
          var ok = !!s.got[r[0]], y = 124 + i * 74, none = r[0] === 'n';
          x.font = (ok ? '800 ' : '600 ') + '40px ' + HL.FONT; x.fillStyle = none ? '#ff8f8f' : ok ? '#7dffb0' : 'rgba(200,232,255,.45)';
          x.fillText((ok ? '✓ ' : none ? '∅ ' : '· ') + r[1], 40, y);
          if (none && s.probe > 0) { x.fillStyle = 'rgba(255,255,255,.18)'; x.fillRect(330, y - 9, 240, 18); x.fillStyle = '#ff6b6b'; x.fillRect(330, y - 9, 240 * Math.min(1, s.probe / 8), 18); }
        });
      });
      s.panel.position.set(-1.72, 0.2, -1.05); s.panel.rotation.y = 0.42;
    },
    update: function (K, dt, t) {
      var s = K.st, c = 0.45 - 2 * R, cx = c + R;
      var atC = Math.hypot(s.lx - cx, s.lz) < 0.27, nearC = s.drag && Math.abs(s.f - 0.5) < 0.12;
      s.f = (s.f + dt * (nearC ? 0.03 : 0.22)) % 1.1; var f = Math.min(1, s.f);
      var ax = f < 0.5 ? lerp(-1.9, c, f / 0.5) : c, bx = f < 0.5 ? 0.45 : 0.45 + (f - 0.5) / 0.5 * 1.5;
      s.A.position.set(ax, BY, 0); s.B.position.set(bx, BY, 0); s.lens.position.set(s.lx, TY, s.lz);
      var add = function (k) { if (!s.got[k]) { s.got[k] = 1; K.toast(IMPT[k]); } };
      if (s.drag) {
        if (Math.hypot(s.lx - ax, s.lz) < 0.42 && f < 0.5) add('a');
        if (atC && Math.abs(f - 0.5) < 0.06) add('t');
        if (Math.hypot(s.lx - bx, s.lz) < 0.42 && f > 0.55) add('b');
        if (s.got.a && s.got.b) add('o');
        if (Object.keys(s.got).length >= 3) K.hit(0);
        if (atC) { s.probe += dt; K.hit(1); if (s.probe > 3) K.hit(2); if (s.probe > 8) K.hit(3); }
      }
      var zoom = s.drag && atC;
      if (zoom && !s.zoom) K.focus(V(cx, BY, 0), 3.1); else if (!zoom && s.zoom) K.home();
      s.zoom = zoom;
      K.text(s.note, zoom ? (s.probe < 3 ? '只有两个表面相接' : '一个运动跟着另一个 —— 没有纽带') : '');
      var key = Object.keys(s.got).join('') + Math.floor(s.probe * 5); if (key !== s.key) { s.key = key; s.panel.userData.redraw(); }
      K.info(zoom ? (s.probe < 3 ? '推进接触点了……继续按住' : '看了这么久：一个运动跟着另一个，没有“必然联系”的印象') : '按住探针拖动，跟着碰撞扫描；把它推到两球相接的那一点上并按住');
    },
    pick: function (K, x, y) { var s = K.st; return K.px(V(s.lx, TY + 0.25, s.lz), x, y) < 78 || K.px(V(s.lx, TY + 1.3, s.lz), x, y) < 60 ? { drag: true } : null; },
    dragStart: function (K) { K.st.drag = true; },
    dragMove: function (K, h, x, y) { var s = K.st, p = K.onPlane(x, y, TY); if (!p) return; s.lx = clamp(p.x, -2.15, 2.15); s.lz = clamp(p.z, -0.95, 0.95); },
    dragEnd: function (K) { K.st.drag = false; }
  };

  /* ───────────── ③ 第 1 次与第 N 次 ───────────── */
  function strength(n) { return 1 - 1 / Math.sqrt(n); }
  var S3 = {
    name: '第 1 次与第 N 次', hint: '按住画面（或空格）重复碰撞：每一次都沉积成右桌上方的一层；等“心灵”出现，把它拖到对象上。', quotes: Q[2],
    init: function (K) {
      var s = K.st; s.f = 0; s.n = 1; s.proj = null; s.projDone = false; s.side = [];
      [-1.22, 1.22].forEach(function (cx, i) {
        table(K, cx, 2.25, 1.5);
        var o = { cx: cx, A: ball(K, AM, 'A'), B: ball(K, CY, 'B'), n: K.label(i ? '第 1 次' : '第 1 次', { h: 0.2, color: i ? '#b58cff' : '#6fe3ff' }), q: K.label('', { h: 0.15, color: i ? '#b58cff' : '#ffffff' }) };
        o.n.position.set(cx, TY + 0.06, 0.95); o.q.position.set(cx - 0.25, TY + 0.72, 0); s.side.push(o);
      });
      s.G = ball(K, PU, 'B'); s.G.visible = false; s.gl = K.label('心灵的期待', { h: 0.11, color: '#b58cff', parent: s.G }); s.gl.position.y = R + 0.12;
      s.strata = new T.Group(); K.add(s.strata);
      s.home = V(1.22, 0.95, -0.15);
      s.mind = new T.Group(); s.mind.position.copy(s.home); K.add(s.mind); s.mind.visible = false;
      K.sphere(0.2, K.holo(PU, { rim: 1.9, core: 0.4 }), s.mind); K.sphere(0.09, K.glow(0xffffff, 0.6), s.mind);
      var ml = K.label('心灵', { h: 0.16, color: '#b58cff', parent: s.mind }); ml.position.y = 0.34;
      s.mhint = K.label('拖我到对象上', { h: 0.11, color: '#b58cff', parent: s.mind }); s.mhint.position.y = -0.33;
      s.pl = K.line([V(0, 0, 0), V(0, 0, 0)], K.lineMat(PU, 0.95, true)); s.pl.visible = false;
      s.force = K.line([V(0, 0, 0), V(0, 0, 0)], K.lineMat(PU, 1, true)); s.force.visible = false;
      s.fl = K.label('“力”', { h: 0.15, color: '#b58cff' }); s.fl.visible = false;
    },
    update: function (K, dt, t) {
      var s = K.st;
      if (K.pressed) {
        s.f += dt * 0.45;
        if (s.f >= 1) {
          s.f = 0; s.n++;
          if (s.n >= 2) K.hit(0); if (s.n >= 4) K.hit(1); if (s.n >= 12) K.hit(4);
          var k = s.strata.children.length;
          if (k < 15) { var cx = 1.22, y = TY + 0.12 + 0.075 * k, xb = cx + 0.2; K.line([V(cx - 0.9, y, 0), V(xb - 2 * R, y, 0), V(xb, y, 0), V(xb + 0.62, y, 0)], K.lineMat(new T.Color(PU).lerp(new T.Color(CY), k / 15).getHex(), 0.55), s.strata); }
        }
      }
      var sg = strength(s.n), f = s.f;
      s.side.forEach(function (o, i) {
        var xb = o.cx + 0.2, c = xb - 2 * R, ax = f < 0.5 ? lerp(o.cx - 0.9, c, f / 0.5) : c, bx = f < 0.5 ? xb : xb + (f - 0.5) / 0.5 * 0.62;
        o.A.position.set(ax, BY, 0); o.B.position.set(bx, BY, 0);
        if (i === 1) {
          K.text(o.n, '第 ' + s.n + ' 次');
          s.G.visible = sg > 0 && f > 0.05;
          if (s.G.visible) { var lead = f < 0.5 ? f / 0.5 * (0.5 + sg) : 1; s.G.position.set(xb + clamp(lead - 0.5, 0, 1) * 0.72 + (f < 0.5 ? sg * 0.08 : 0), BY, 0); alpha(s.G, 0.15 + 0.45 * sg); s.gl.material.opacity = 0.4 + 0.6 * sg; }
          var seen = f > 0.05 && f < 0.5 && sg > 0; K.text(o.q, seen ? 'B 一定会被推走！' : ''); o.q.material.opacity = 0.3 + 0.7 * sg;
          s.force.visible = s.fl.visible = s.projDone && f < 0.55;
          if (s.force.visible) { K.setLine(s.force, [V(ax + R, BY, 0), V(bx - R, BY, 0)]); s.fl.position.set((ax + bx) / 2, BY + R + 0.14, 0); }
        } else {
          var ask = f > 0.05 && f < 0.5; K.text(o.q, ask ? '……接下来会怎样？' : ''); if (ask) K.hit(2);
        }
      });
      s.mind.visible = s.n >= 3; s.mind.scale.setScalar((0.8 + 0.5 * sg) * (1 + 0.04 * Math.sin(t * 3)));
      s.mhint.visible = !s.projDone && !s.proj;
      K.info('两边对象的差异：0 处 · 习惯强度 ' + Math.round(sg * 100) + '%' + (K.pressed ? '' : ' —— 按住画面（或空格）重复碰撞' + (s.n >= 3 && !s.projDone ? '；把“心灵”拖到右桌的对象上' : '')));
    },
    pick: function (K, x, y) { var s = K.st; return s.n >= 3 && !s.projDone && K.px(s.home, x, y) < 62 ? { drag: true } : null; },
    dragStart: function (K, h, x, y) { var s = K.st; h.d = K.facing(s.home, x, y); s.proj = s.home.clone(); s.pl.visible = true; },
    dragMove: function (K, h, x, y) { var s = K.st, p = h.d && h.d.to(x, y); if (!p) return; s.proj = p; K.setLine(s.pl, [s.home.clone(), p.clone()]); },
    dragEnd: function (K) {
      var s = K.st;
      if (s.proj && s.proj.y < TY + 0.8 && s.proj.x > 0) { s.projDone = true; K.hit(3); K.toast('力线落在对象上了 —— 可它是从心灵那边拖过去的'); }
      s.proj = null; s.pl.visible = false;
    }
  };

  /* ───────────── ④ 第 1001 次 ───────────── */
  var BR = [{ k: 'logic', n: '逻辑必然', why: '反面并不矛盾：B 也可以不动' }, { k: 'past', n: '过去如此', why: '缺一个中间桥墩：“未来将与过去相似”' }, { k: 'unif', n: '自然齐一', why: '用“齐一”证明“齐一”：兜圈子' }];
  var S4 = {
    name: '第 1001 次', hint: '把三块“理由”拖到中间的缺口上，为“B 会被推走”搭桥；都塌了以后，按住画面。', quotes: Q[3],
    init: function (K) {
      var s = K.st; s.fail = {}; s.anim = null; s.hold = 0; s.across = false;
      table(K, -1.5, 1.5, 1.6); table(K, 1.5, 1.5, 1.6);
      var A = ball(K, AM, 'A'), B = ball(K, CY, 'B'); A.position.set(-1.5, BY, 0); B.position.set(-1.08, BY, 0);
      var tg = ball(K, CY, 'B'); tg.position.set(1.45, BY, 0); alpha(tg, 0.22);
      K.label('第 1001 次：接触前一刻', { h: 0.14, color: '#6fe3ff' }).position.set(-1.3, BY + 0.42, 0);
      K.label('B 被推走？', { h: 0.14, color: '#6fe3ff' }).position.set(1.45, BY + 0.42, 0);
      var depth = []; for (var i = 0; i < 9; i++) { var x = -0.75 + 1.5 * i / 8; depth.push(V(x, TY, -0.8), V(x, TY - 0.75, -0.8), V(x, TY, 0.8), V(x, TY - 0.75, 0.8)); }
      K.add(new T.LineSegments(K.own(new T.BufferGeometry().setFromPoints(depth)), K.lineMat(RED, 0.16)));
      s.planks = BR.map(function (b, i) {
        var m = new T.Mesh(K.own(new T.BoxGeometry(0.95, 0.07, 0.3)), K.holo(0xffc46a, { core: 0.45, rim: 1.3 })); K.add(m);
        m.userData.home = V(-1.75, -0.02 + i * 0.36, -1.05); m.position.copy(m.userData.home);
        m.userData.lab = K.label(b.n, { h: 0.15, color: '#ffb454', parent: m }); m.userData.lab.position.y = 0.16;
        return m;
      });
      s.why = K.label('', { h: 0.15, color: '#ff7a7a' }); s.why.position.set(0, TY + 0.95, 0);
      var arc = []; for (i = 0; i <= 48; i++) { var k = i / 48; arc.push(V(lerp(-0.75, 0.75, k), TY + 0.04 + Math.sin(Math.PI * k) * 0.62, 0)); }
      s.arc = K.line(arc, K.lineMat(PU, 1)); s.arc.geometry.setDrawRange(0, 0);
      s.G = ball(K, PU, 'B'); s.G.visible = false;
    },
    startAnim: function (K, i) {
      var s = K.st, b = BR[i], g = new T.Group(); K.add(g);
      var mat = K.holo(0xffc46a, { core: 0.5, rim: 1.3 });
      var a = { k: b.k, i: i, t: 0, g: g };
      if (b.k === 'logic') {
        a.l = new T.Group(); a.l.position.set(-0.75, TY, 0); a.r = new T.Group(); a.r.position.set(0.75, TY, 0); g.add(a.l, a.r);
        var m1 = new T.Mesh(K.own(new T.BoxGeometry(0.75, 0.07, 0.3)), mat); m1.position.x = 0.375; a.l.add(m1);
        var m2 = new T.Mesh(m1.geometry, mat); m2.position.x = -0.375; a.r.add(m2);
      } else if (b.k === 'past') {
        var geo = K.own(new T.BoxGeometry(0.55, 0.07, 0.3));
        a.l = new T.Mesh(geo, mat); a.l.position.set(-0.475, TY, 0); a.r = new T.Mesh(geo, mat); a.r.position.set(0.475, TY, 0); g.add(a.l, a.r);
        K.line([V(-0.2, TY - 0.04, 0.15), V(0.2, TY - 0.04, 0.15), V(0.2, TY + 0.04, 0.15), V(-0.2, TY + 0.04, 0.15), V(-0.2, TY - 0.04, 0.15)], K.lineMat(0xffffff, 0.6, true), g);
      } else {
        var pts = []; for (var j = 0; j <= 72; j++) { var an = -Math.PI / 2 + j / 72 * Math.PI * 2; pts.push(V(-0.42 + Math.cos(an) * 0.34, TY + 0.36 + Math.sin(an) * 0.34, 0)); }
        a.c = K.line(pts, K.lineMat(0xffc46a, 1), g); a.c.geometry.setDrawRange(0, 0);
      }
      s.anim = a; s.planks[i].visible = false;
    },
    update: function (K, dt, t) {
      var s = K.st, a = s.anim, nf = Object.keys(s.fail).length;
      if (a) {
        a.t += dt; var grow = Math.min(1, a.t / 0.6), k;
        if (a.k === 'logic') { k = clamp((a.t - 0.8) * 1.1, 0, 1); a.l.scale.x = a.r.scale.x = Math.max(0.01, grow); a.l.rotation.z = -k * 1.15; a.r.rotation.z = k * 1.15; }
        else if (a.k === 'past') { k = clamp((a.t - 0.8) * 1.1, 0, 1); a.l.scale.x = a.r.scale.x = Math.max(0.01, grow); a.r.position.y = TY - k * k * 1.3; a.r.rotation.z = -k * 0.9; }
        else a.c.geometry.setDrawRange(0, Math.floor(clamp(a.t / 1.7, 0, 1) * 73));
        K.text(s.why, a.t > (a.k === 'unif' ? 1.1 : 0.8) ? BR[a.i].why : '');
        if (a.t > 2.6) {
          s.fail[a.k] = 1; K.hit(a.i); K.root.remove(a.g); s.anim = null; K.text(s.why, '');
          var p = s.planks[a.i]; p.visible = true; p.position.copy(p.userData.home); p.material.uniforms.uOp.value = 0.25; K.text(p.userData.lab, BR[a.i].n + ' ✗'); p.userData.lab.material.opacity = 0.5;
        }
      }
      if (nf >= 3) {
        if (K.pressed) s.hold = Math.min(1, s.hold + dt * 0.35);
        s.arc.geometry.setDrawRange(0, Math.floor(s.hold * 49)); s.arc.material.opacity = 0.35 + 0.65 * s.hold;
        s.G.visible = s.hold > 0; s.G.position.set(lerp(-1.08, 1.45, s.hold), BY + Math.sin(Math.PI * s.hold) * 0.55, 0); alpha(s.G, 0.7);
        if (s.hold >= 1 && !s.across) { s.across = true; K.hit(3); setTimeout(function () { if (K.st === s) K.hit(4); }, 1800); }
        K.info(s.across ? '不是理性，而是习惯，把你带到了对岸' : '理性的桥都塌了。按住画面（或空格）：让习惯带你过去');
      } else K.info('把左后方的“理由”拖到中间的缺口上，为“B 会被推走”搭桥');
    },
    pick: function (K, x, y) {
      var s = K.st; if (s.anim || Object.keys(s.fail).length >= 3) return null;
      for (var i = 0; i < 3; i++) if (!s.fail[BR[i].k] && K.px(s.planks[i].position, x, y) < 58) return { drag: true, i: i };
      return null;
    },
    dragStart: function (K, h, x, y) { h.d = K.facing(K.st.planks[h.i].position, x, y); },
    dragMove: function (K, h, x, y) { var p = h.d && h.d.to(x, y); if (p) K.st.planks[h.i].position.copy(p); },
    dragEnd: function (K, h) {
      var s = K.st, m = s.planks[h.i], p = m.position;
      if (Math.abs(p.x) < 1.15 && p.y < TY + 0.75 && Math.abs(p.z) < 1.3) S4.startAnim(K, h.i); else m.position.copy(m.userData.home);
    }
  };

  HL.sims.define('hume', { title: '休谟 · 因果关系', source: '——休谟《人类理智研究》', flat: true, stages: [S1, S2, S3, S4] });
})();
