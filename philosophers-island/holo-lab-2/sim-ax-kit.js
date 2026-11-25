/* Minest · 全息模型 · 附属岛套件 — a small declarative layer for the annex island's models (HL.AX).
   HL.AX.model(key, title, core, stages, extra): each stage is
     { name, hint, sl: [[label, initial, colour]…], ch: [choice labels], bt: [button labels],
       scene(K, s)               build the 3D scene once (s = K.st),
       tick(K, s, dt, t, v, ch)  update it every frame (v = slider values 0..1, ch = chosen index),
       rules: [fn(v, ch, s) → bool …]   one per quotation: when it turns true the quotation lights up,
       msg(v, ch, s) → string }  the line shown above the scene.
   s.seen['c' + i] = a choice that has been picked, s.b[i] = clicks on button i, s.hold = seconds held, s.t = seconds in stage. */
(function () {
  'use strict';
  var HL = window.HL, T = window.THREE, k = HL && HL.simKit; if (!HL || !T || !k || !HL.simQ) return;
  var V = k.V, P = k.P, C = k.C, FY = k.FY, clamp = k.clamp, lerp = k.lerp, TAU = k.TAU;
  var AX = { k: k, V: V, P: P, C: C, FY: FY, clamp: clamp, lerp: lerp, TAU: TAU };
  AX.model = function (key, title, core, stages, extra) {
    var Q = HL.simQ[key]; if (!Q) return;
    var out = stages.map(function (d, i) {
      return k.sliders({ name: d.name, hint: d.hint, quotes: Q[i],
        init: function (K) { var s = K.st; s.t = 0; s.hold = 0; s.b = {}; s.seen = {}; s.ch = d.ch0 == null ? (d.ch ? 0 : -1) : d.ch0; if (d.ch && s.ch >= 0) s.seen['c' + s.ch] = 1;
          s.S = (d.sl || []).map(function (q, j) { var n = d.sl.length, w = n > 2 ? 0.95 : 1.1, x = n === 1 ? -0.75 : n === 2 ? -1.7 + j * 1.5 : -1.95 + j * 1.15; return K.slider(q[0], x, FY + 0.28, q[1], q[2] || C.GOLD, 1.0, w); });
          s.msg = k.msg(K, d.msgY || 2.75); if (d.scene) d.scene(K, s); },
        update: function (K, dt, t) { var s = K.st, v = s.S.map(function (o) { return o.v; }); s.t += dt; if (K.pressed) s.hold += dt; if (s.ch >= 0) s.seen['c' + s.ch] = 1; if (d.tick) d.tick(K, s, dt, t, v, s.ch); (d.rules || []).forEach(function (r, j) { if (r(v, s.ch, s)) K.hit(j); }); if (d.msg) K.text(s.msg, d.msg(v, s.ch, s) || ''); K.info(d.info ? d.info(v, s.ch, s) : d.hint2 || ''); },
        chips: (d.ch || d.bt) ? function (K, box) { var s = K.st; if (d.ch) k.choice(K, box, d.ch, 'ch'); if (d.ch && d.bt) HL.ui.sep(box); (d.bt || []).forEach(function (n, j) { HL.ui.chip(box, n, false, function () { s.b[j] = (s.b[j] || 0) + 1; if (d.onBt) d.onBt(K, s, j); }); }); } : null });
    });
    HL.sims.define(key, Object.assign({ lift: -0.35, zoom: 1.1, title: title, source: '——', flat: true, core: core, stages: out }, extra || {}));
  };
  /* ───── scene pieces ───── */
  /** n gauges spread between x0 and x1 at depth z → s[name] = array */
  AX.gauges = function (K, names, colors, x0, x1, z, H) { x0 = x0 == null ? -1.5 : x0; x1 = x1 == null ? 0.9 : x1; return names.map(function (n, i) { return k.gauge(K, names.length === 1 ? (x0 + x1) / 2 : lerp(x0, x1, i / (names.length - 1)), z == null ? -0.4 : z, colors[i % colors.length], n, H || 1.5); }); };
  /** a crowd of n dots; place(i, p) → [x, h, z, r, g, b] each frame */
  AX.crowd = function (K, n, size) { var c = k.crowd(K, n, size || 0.14); c.draw = function (fn) { for (var i = 0; i < n; i++) { var q = fn(i, c.P[i]); c.d.set(i, q[0], FY + q[1], q[2]); c.d.rgb(i, q[3], q[4], q[5]); } c.d.flush(); }; return c; };
  /** a ring / cluster network: nodes (spheres) + link(i, j) lines whose opacity and colour can be set */
  AX.net = function (K, pts, color, r) { var n = { nd: pts.map(function (p) { var m = K.sphere(r || 0.08, K.holo(color || C.CY, { core: 0.9 })); m.position.copy(p); return m; }), ln: [] };
    n.link = function (i, j, col, op) { var l = K.line([pts[i], pts[j]], K.lineMat(col || C.WH, op == null ? 0.7 : op)); l.userData = { i: i, j: j }; n.ln.push(l); return l; }; return n; };
  AX.ring = function (n, R, h, cx, ry) { var a = [], i; for (i = 0; i < n; i++) { var t = i / n * TAU; a.push(P((cx || -0.3) + Math.cos(t) * R, (h || 1.4) + Math.sin(t) * R * (ry || 0.75), 0)); } return a; };
  /** a curve y = f(u), u ∈ [0, 1], drawn in a box; replot(f) redraws it */
  AX.plot = function (K, f, color, x0, x1, y0, hh) { x0 = x0 == null ? -1.7 : x0; x1 = x1 == null ? 1.0 : x1; y0 = y0 == null ? 0.6 : y0; hh = hh || 1.6; var pts = function (g) { var a = [], i; for (i = 0; i <= 40; i++) a.push(P(lerp(x0, x1, i / 40), y0 + clamp(g(i / 40), -0.2, 1.15) * hh, 0)); return a; }, l = K.line(pts(f), K.lineMat(color || C.GOLD, 0.95));
    l.userData.replot = function (g) { K.setLine(l, pts(g)); }; l.userData.at = function (u, g) { return P(lerp(x0, x1, u), y0 + clamp((g || f)(u), -0.2, 1.15) * hh, 0.05); }; return l; };
  AX.axes = function (K, x0, x1, y0, hh, xl, yl) { x0 = x0 == null ? -1.7 : x0; x1 = x1 == null ? 1.0 : x1; y0 = y0 == null ? 0.6 : y0; hh = hh || 1.6; K.line([P(x0, y0 + hh, 0), P(x0, y0, 0), P(x1, y0, 0)], K.lineMat(C.GREY, 0.7)); if (xl) k.lab(K, xl, x1, y0 - 0.12, 0, '#9aa7b5', 0.1); if (yl) k.lab(K, yl, x0, y0 + hh + 0.1, 0, '#9aa7b5', 0.1); };
  AX.dot = function (K, color, r) { return K.sphere(r || 0.07, K.glow(color || C.WH, 1)); };
  AX.person = function (K, color, x, h, z, sc, name) { var m = K.person(color, sc || 1.5); m.position.copy(P(x, h == null ? 0.5 : h, z || 0)); if (name) k.lab(K, name, x, (h == null ? 0.5 : h) + (sc || 1.5) * 0.62, z || 0, '#ffffff', 0.11); return m; };
  AX.op = function (m, v) { (m.userData.mat || m.material).uniforms.uOp.value = v; };
  AX.col = function (m, c) { (m.userData.mat || m.material).uniforms.uColor.value.setHex(c); };
  HL.AX = AX;
})();
