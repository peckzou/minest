/* Minest · 全息模型 · 共享小套件 — helpers the later model files share (HL.simKit). Loaded after sims.js. */
(function () {
  'use strict';
  var HL = window.HL, T = window.THREE; if (!HL || !T || !HL.sims) return;
  var FY = -0.62, K0 = HL.sims.K;
  var C = { AM: 0xffa23a, CY: 0x46d2ff, PU: 0xb58cff, RED: 0xff7a7a, GR: 0x7dffb0, GOLD: 0xffd96b, WH: 0xffffff, GREY: 0x9aa7b5 };
  function V(x, y, z) { return new T.Vector3(x, y, z); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, k) { return a + (b - a) * k; }
  var kit = { FY: FY, C: C, V: V, clamp: clamp, lerp: lerp, TAU: Math.PI * 2,
    /** P(x, h, z): a point h above the floor */
    P: function (x, h, z) { return V(x, FY + h, z || 0); },
    msg: function (K, h, color) { var m = K.label('', { h: 0.14, color: color || '#ffffff' }); m.position.set(0, FY + (h || 2.3), 0); return m; },
    lab: function (K, text, x, h, z, color, size) { var m = K.label(text, { h: size || 0.12, color: color || '#ffffff' }); m.position.set(x, FY + h, z || 0); return m; },
    card: function (K, text, color, w, x, h, z) { var m = K.mesh(new T.BoxGeometry(w || 0.9, 0.2, 0.04), K.holo(color || 0xffc46a, { core: 0.4 })); m.userData.lab = K.label(text, { h: 0.11, color: '#ffffff', parent: m }); m.userData.lab.position.z = 0.04; m.userData.n = text; if (x != null) { m.userData.home = V(x, FY + h, z == null ? 0.5 : z); m.position.copy(m.userData.home); } return m; },
    ball: function (K, text, color, r, x, h, z) { var m = K.sphere(r || 0.12, K.holo(color, { core: 0.9 })); m.userData.lab = K.label(text, { h: 0.11, color: '#ffffff', parent: m }); m.userData.lab.position.y = (r || 0.12) + 0.1; m.userData.n = text; if (x != null) { m.userData.home = V(x, FY + h, z == null ? 0.3 : z); m.position.copy(m.userData.home); } return m; },
    box: function (K, w, h, d, color, x, y, z, o) { var m = K.mesh(new T.BoxGeometry(w, h, d), o && o.wire ? K.glow(color, o.op || 0.5, { wire: true }) : K.holo(color, { core: (o && o.core) || 0.5 })); m.position.set(x, FY + y, z || 0); return m; },
    /** a framed standing panel; returns its centre */
    zone: function (K, x, h, w, hh, color, name, z) { z = z == null ? -0.2 : z; var c = V(x, FY + h, z); K.flat(w, hh, K.glow(color, 0.1)).position.copy(c); K.line([V(x - w / 2, FY + h - hh / 2, z), V(x + w / 2, FY + h - hh / 2, z), V(x + w / 2, FY + h + hh / 2, z), V(x - w / 2, FY + h + hh / 2, z), V(x - w / 2, FY + h - hh / 2, z)], K.lineMat(color, 0.8)); if (name) K.label(name, { h: 0.11, color: '#ffffff' }).position.set(x, FY + h + hh / 2 + 0.1, z); return c; },
    /** a vertical gauge: { set(v 0..1), col(hex) } */
    gauge: function (K, x, z, color, name, H) { H = H || 1.4; var g = {}; K.line([V(x - 0.11, FY, z), V(x - 0.11, FY + H, z), V(x + 0.11, FY + H, z), V(x + 0.11, FY, z), V(x - 0.11, FY, z)], K.lineMat(color, 0.5)); g.m = K.mesh(new T.BoxGeometry(0.18, 1, 0.18), K.holo(color, { core: 0.5 })); g.lab = K.label(name, { h: 0.11, color: '#ffffff' }); g.lab.position.set(x, FY + H + 0.14, z); g.v = 0; g.set = function (v) { g.v = v; g.m.scale.y = Math.max(0.001, v * H); g.m.position.set(x, FY + v * H / 2, z); }; g.col = function (c) { g.m.material.uniforms.uColor.value.setHex(c); }; g.set(0); return g; },
    crowd: function (K, n, size) { var c = { d: K.dots(n, size || 0.15), P: [] }; for (var i = 0; i < n; i++) { var a = i * 2.399963, r = Math.sqrt((i + 0.5) / n); c.P.push({ x: Math.cos(a) * r, z: Math.sin(a) * r, ph: i * 1.7 }); } return c; },
    home: function (m) { m.position.copy(m.userData.home); },
    /** drag helpers: objects carry userData.home; h.m is the dragged object */
    DR: { dragStart: function (K, h, x, y) { h.d = K.facing(h.m.position, x, y); }, dragMove: function (K, h, x, y) { var p = h.d && h.d.to(x, y); if (p) h.m.position.copy(p); } },
    SL: { pick: function (K, x, y) { return K.slPick(x, y); }, dragStart: function (K, h, x) { K.slStart(h, x); }, dragMove: function (K, h, x) { K.slMove(h, x); } },
    /** pick the nearest draggable among list (skipping .userData.done / invisible) */
    grab: function (K, list, x, y, r) { var m = K.near(list.filter(function (q) { return q && !q.userData.done; }), x, y, r || 70); return m ? { drag: true, m: m } : null; },
    /** chips for a one-of-n choice stored at K.st[key] */
    choice: function (K, box, list, key, cb) { var s = K.st; list.forEach(function (n, i) { HL.ui.chip(box, n, s[key] === i, function () { s[key] = i; (s.seen = s.seen || {})[key + i] = 1; if (cb) cb(i); HL.refreshTools(); }); }); },
    /** a stage whose only dragging is sliders */
    sliders: function (o) { o.pick = o.pick || kit.SL.pick; o.dragStart = o.dragStart || kit.SL.dragStart; o.dragMove = o.dragMove || kit.SL.dragMove; return o; },
    /** a stage where things in s.items are dragged onto targets: o.drop(K, m) decides; returns o */
    drags: function (o) { o.pick = o.pick || function (K, x, y) { return kit.grab(K, K.st.items || [], x, y); }; o.dragStart = o.dragStart || kit.DR.dragStart; o.dragMove = o.dragMove || kit.DR.dragMove; o.dragEnd = o.dragEnd || function (K, h) { if (!h.m) return; if (o.drop && o.drop(K, h.m) === true) return; kit.home(h.m); }; return o; }
  };
  HL.simKit = kit;
})();
