/* Minest · 全息操作台 2.0 · HOLO MODELS — interactive thinking models projected as 3D holograms on the console.
   A model is HL.sims.define(key, { title, source, stages: [{ name, hint, quotes: [[step, zh, en, ref]…],
     init(K), update(K, dt, t), pick(K, x, y), dragStart / dragMove / dragEnd(K, hit, x, y), tap(K, hit) }] }).
   K is the kit below: a root group in the projection volume, hologram materials, text sprites, canvas panels,
   picking helpers, K.pressed (a finger / the mouse / Space held still), K.hit(i) to light a quotation.
   The mode ('sim') is not on the mode bar: it opens when a model is launched ({holo:1, op:'sim', key} from the
   embedding page, HL.sims.open(key), or ?sim=key) and its tool strip carries the stages, reset and exit. */
(function () {
  'use strict';
  var HL = window.HL, T = window.THREE; if (!HL || !T) return;
  var SIMS = {}, M = { id: 'sim', zh: '全息模型', en: 'HOLO MODEL' };
  var cur = null, curKey = null, want = null, stage = 0, st = null, root = null, owned = [], lit = {}, panel = null, lastHit = null;
  var press = { on: false, x: 0, y: 0, key: false, down: false };
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function own(x) { owned.push(x); return x; }
  function loadLit(key) { try { var v = JSON.parse(localStorage.getItem('minest.holoSim.' + key) || 'null'); return v && typeof v === 'object' ? v : {}; } catch (e) { return {}; } }
  function saveLit() { try { localStorage.setItem('minest.holoSim.' + curKey, JSON.stringify(lit)); } catch (e) {} }
  function stageDone(i) { var q = cur.stages[i].quotes; for (var k = 0; k < q.length; k++) if (!lit[i + '_' + k]) return false; return true; }

  /* ───────────────────────── the kit ───────────────────────── */
  var VERT = 'varying vec3 vN; varying vec3 vV; varying float vY; void main(){ vN = normalize(normalMatrix * normal); vec4 mv = modelViewMatrix * vec4(position, 1.0); vV = normalize(-mv.xyz); vY = (modelMatrix * vec4(position, 1.0)).y; gl_Position = projectionMatrix * mv; }';
  var FRAG = 'uniform vec3 uColor; uniform float uOp; uniform float uCore; uniform float uRim; uniform float uTime; varying vec3 vN; varying vec3 vV; varying float vY; void main(){ float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.0); float scan = 0.8 + 0.2 * sin(vY * 85.0 - uTime * 3.0); gl_FragColor = vec4(uColor * (uCore + f * uRim) * scan * uOp, 1.0); }';
  var _v = new T.Vector3(), _p = new T.Plane(), _h = new T.Vector3();
  var K = {
    T: T, HL: HL, pressed: false,
    add: function (o, parent) { (parent || root).add(o); return o; },
    own: own,
    /** a glowing fresnel shell: bright rim, faint core, moving scanlines */
    holo: function (color, o) {
      o = o || {};
      return own(new T.ShaderMaterial({ uniforms: { uColor: { value: new T.Color(color) }, uOp: { value: o.op == null ? 1 : o.op }, uCore: { value: o.core == null ? 0.28 : o.core }, uRim: { value: o.rim == null ? 1.5 : o.rim }, uTime: HL.U.uTime },
        vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false, blending: T.AdditiveBlending, side: o.side || T.FrontSide }));
    },
    glow: function (color, op, o) { o = o || {}; return own(new T.MeshBasicMaterial({ color: color, transparent: true, opacity: op == null ? 0.5 : op, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide, wireframe: !!o.wire })); },
    lineMat: function (color, op, dashed) {
      var p = { color: color, transparent: true, opacity: op == null ? 0.8 : op, blending: T.AdditiveBlending, depthWrite: false };
      if (dashed) { p.dashSize = 0.07; p.gapSize = 0.06; return own(new T.LineDashedMaterial(p)); }
      return own(new T.LineBasicMaterial(p));
    },
    line: function (pts, mat, parent) { var g = own(new T.BufferGeometry().setFromPoints(pts)); var l = new T.Line(g, mat); if (mat.isLineDashedMaterial) l.computeLineDistances(); (parent || root).add(l); return l; },
    setLine: function (l, pts) { l.geometry.setFromPoints(pts); if (l.material.isLineDashedMaterial) l.computeLineDistances(); },
    sphere: function (r, mat, parent) { var m = new T.Mesh(own(new T.SphereGeometry(r, 28, 20)), mat); (parent || root).add(m); return m; },
    /** a text sprite; h = world height of the line. K.text(sprite, str) redraws it */
    label: function (text, o) {
      o = o || {};
      var cv = document.createElement('canvas'); cv.width = 768; cv.height = 96;
      var tex = own(HL.canvasTex(cv)), mat = own(new T.SpriteMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false }));
      var s = new T.Sprite(mat); s.renderOrder = 20; s.userData = { cv: cv, tex: tex, o: o, text: null };
      var h = o.h || 0.2; s.scale.set(h * 8, h, 1);
      K.text(s, text); (o.parent || root).add(s); return s;
    },
    text: function (s, text) {
      var u = s.userData; if (u.text === text) return; u.text = text;
      var x = u.cv.getContext('2d'), o = u.o; x.clearRect(0, 0, 768, 96);
      if (!text) { u.tex.needsUpdate = true; return; }
      var size = 58; x.textAlign = 'center'; x.textBaseline = 'middle';
      for (; size > 20; size -= 2) { x.font = (o.weight || 800) + ' ' + size + 'px ' + HL.FONT; if (x.measureText(text).width <= 740) break; }
      x.shadowColor = o.color || '#6fe3ff'; x.shadowBlur = 14; x.fillStyle = o.ink || '#f2fcff'; x.fillText(text, 384, 50); x.shadowBlur = 5; x.fillText(text, 384, 50);
      u.tex.needsUpdate = true;
    },
    /** a flat hologram panel drawn with a canvas: K.panel(w, h, px, draw) → mesh; mesh.userData.redraw() */
    panel: function (w, h, px, draw, parent) {
      var cv = document.createElement('canvas'); cv.width = px; cv.height = Math.round(px * h / w);
      var tex = own(HL.canvasTex(cv)), m = new T.Mesh(own(new T.PlaneGeometry(w, h)), own(new T.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, side: T.DoubleSide })));
      m.userData.redraw = function () { var x = cv.getContext('2d'); x.clearRect(0, 0, cv.width, cv.height); draw(x, cv.width, cv.height); tex.needsUpdate = true; };
      m.userData.redraw(); (parent || root).add(m); return m;
    },
    /** where the pointer ray meets the horizontal plane y (root-local) → root-local point, or null */
    onPlane: function (px, py, y) {
      _p.set(new T.Vector3(0, 1, 0), -(root.position.y + y));
      if (!HL.rayAt(px, py).ray.intersectPlane(_p, _h)) return null;
      return root.worldToLocal(_h.clone());
    },
    /** drag a root-local point on a plane facing the camera → { to(x, y) → root-local point } */
    facing: function (local, px, py) { var d = HL.dragPlane(root.localToWorld(local.clone()), px, py); return { to: function (x, y) { var w = d.to(x, y); return w ? root.worldToLocal(w) : null; } }; },
    /** distance in css px between the pointer and a root-local point */
    px: function (local, x, y) { var s = HL.screenOf(root.localToWorld(_v.copy(local))); return s.behind ? 1e9 : Math.hypot(s.x - x, s.y - y); },
    mesh: function (geo, mat, parent) { var m = new T.Mesh(own(geo), mat); (parent || root).add(m); return m; },
    /** a glowing floor grid w × d centred on (cx, y, cz) */
    grid: function (cx, y, w, d, color, cz) {
      var g = new T.Group(); g.position.set(cx, y, cz || 0); root.add(g);
      var pts = [], nx = Math.max(3, Math.round(w / 0.38)), nz = Math.max(3, Math.round(d / 0.38)), i, V = function (x, z) { return new T.Vector3(x, 0, z); };
      for (i = 0; i <= nx; i++) pts.push(V(-w / 2 + w * i / nx, -d / 2), V(-w / 2 + w * i / nx, d / 2));
      for (i = 0; i <= nz; i++) pts.push(V(-w / 2, -d / 2 + d * i / nz), V(w / 2, -d / 2 + d * i / nz));
      g.add(new T.LineSegments(own(new T.BufferGeometry().setFromPoints(pts)), K.lineMat(color || 0x46d2ff, 0.2)));
      K.line([V(-w / 2, -d / 2), V(w / 2, -d / 2), V(w / 2, d / 2), V(-w / 2, d / 2), V(-w / 2, -d / 2)], K.lineMat(color || 0x9feaff, 0.8), g);
      var fill = new T.Mesh(own(new T.PlaneGeometry(w, d)), K.glow(color || 0x1f7fb8, 0.07)); fill.rotation.x = -Math.PI / 2; fill.position.y = -0.004; g.add(fill);
      return g;
    },
    /** a small standing figure (feet at the group's origin) */
    person: function (color, s, parent) {
      s = s || 1; var g = new T.Group(); (parent || root).add(g);
      var m = K.holo(color, { core: 0.4, rim: 1.4 });
      var body = new T.Mesh(own(new T.CylinderGeometry(0.035 * s, 0.11 * s, 0.34 * s, 14)), m); body.position.y = 0.17 * s; g.add(body);
      var head = new T.Mesh(own(new T.SphereGeometry(0.075 * s, 16, 12)), m); head.position.y = 0.42 * s; g.add(head);
      g.userData = { mat: m, head: head, body: body };
      return g;
    },
    /** n glowing dots with per-dot position and colour: { pos, col, set(i,x,y,z), rgb(i,r,g,b), flush() } */
    dots: function (n, size, parent) {
      var cv = document.createElement('canvas'); cv.width = cv.height = 64; var x = cv.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
      g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.35, 'rgba(255,255,255,.55)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64);
      var pos = new Float32Array(n * 3), col = new Float32Array(n * 3).fill(1), geo = own(new T.BufferGeometry());
      geo.setAttribute('position', new T.BufferAttribute(pos, 3)); geo.setAttribute('color', new T.BufferAttribute(col, 3));
      var pts = new T.Points(geo, own(new T.PointsMaterial({ size: size || 0.14, map: own(HL.canvasTex(cv)), vertexColors: true, transparent: true, depthWrite: false, blending: T.AdditiveBlending })));
      pts.frustumCulled = false; (parent || root).add(pts);
      return { pts: pts, pos: pos, col: col, n: n,
        set: function (i, a, b, c) { pos[i * 3] = a; pos[i * 3 + 1] = b; pos[i * 3 + 2] = c; },
        rgb: function (i, r, gg, b) { col[i * 3] = r; col[i * 3 + 1] = gg; col[i * 3 + 2] = b; },
        flush: function () { geo.attributes.position.needsUpdate = true; geo.attributes.color.needsUpdate = true; } };
    },
    /** a silhouette texture drawn by fn(ctx, s) centred in a 128 px square (white on clear) */
    shape: function (fn) { var cv = document.createElement('canvas'); cv.width = cv.height = 128; var x = cv.getContext('2d'); x.translate(64, 70); x.fillStyle = '#fff'; fn(x, 50); x.fill(); return own(HL.canvasTex(cv)); },
    flat: function (w, h, mat, parent) { var m = new T.Mesh(own(new T.PlaneGeometry(w, h)), mat); (parent || root).add(m); return m; },
    solid: function (color, op, map) { return own(new T.MeshBasicMaterial({ color: color, transparent: true, opacity: op == null ? 1 : op, depthWrite: false, side: T.DoubleSide, map: map || null })); },
    /** a slider: a ball on a 1.4-long rail; K.st.sl collects them. K.slPick / slStart / slMove handle the dragging */
    slider: function (name, x, y, v, color, z, L) {
      L = L || 1.4; var o = { v: v, name: name }; z = z == null ? 0.6 : z; K.line([new T.Vector3(x, y, z), new T.Vector3(x + L, y, z)], K.lineMat(color || 0x9feaff, 0.8));
      o.ball = K.sphere(0.09, K.glow(0xffffff, 0.95)); o.lab = K.label('', { h: 0.11, color: '#ffffff' }); o.lab.position.set(x + L / 2, y + 0.17, z);
      o.a = new T.Vector3(x, y, z); o.b = new T.Vector3(x + L, y, z);
      o.upd = function () { o.ball.position.set(x + o.v * L, y, z); K.text(o.lab, name + ' ' + Math.round(o.v * 100) + '%'); }; o.upd();
      (st.sl = st.sl || []).push(o); return o;
    },
    slPick: function (x, y) { var best = null, bd = 60; (st.sl || []).forEach(function (o) { var d = K.px(o.ball.position, x, y); if (d < bd) { bd = d; best = o; } }); return best ? { drag: true, sl: best } : null; },
    slStart: function (h, x) { h.x = x; var a = HL.screenOf(root.localToWorld(h.sl.a.clone())), b = HL.screenOf(root.localToWorld(h.sl.b.clone())); h.len = Math.max(60, Math.hypot(a.x - b.x, a.y - b.y)); },
    slMove: function (h, x) { h.sl.v = clamp(h.sl.v + (x - h.x) / h.len, 0, 1); h.x = x; h.sl.upd(); },
    /** true when root-local points a and b are within r css px on screen */
    closePx: function (a, b, r) { var p = HL.screenOf(root.localToWorld(a.clone())), q = HL.screenOf(root.localToWorld(b.clone())); return Math.hypot(p.x - q.x, p.y - q.y) < (r || 90); },
    /** the nearest of objs (root-local Object3Ds) within r css px of the pointer, or null */
    near: function (objs, x, y, r) { var best = null, bd = r || 50; objs.forEach(function (o) { if (!o || !o.visible) return; var d = K.px(o.position, x, y); if (d < bd) { bd = d; best = o; } }); return best; },
    hit: function (i) { hitQuote(i); },
    toast: function (t) { HL.toast(t, 2600); },
    info: function (t) { if (K._info !== t) { K._info = t; HL.info(t); } },
    focus: function (local, dist) { HL.focus(root.localToWorld(local.clone()), dist); },
    home: function () { HL.home(); HL.cam.g.el = 0.42; HL.cam.g.az = 0; HL.cam.g.dist = HL.cam.homeDist * (HL.narrow ? 1.05 : 0.8) * ((cur && cur.zoom) || 1); HL.cam.g.tgt.set(HL.narrow ? 0 : 0.5, HL.CENTER.y - 0.25, 0); },
    lerp: function (a, b, k) { return a + (b - a) * k; }, clamp: clamp
  };

  /* ───────────────────────── quotations panel ───────────────────────── */
  function css() {
    if (document.getElementById('simCss')) return;
    var s = document.createElement('style'); s.id = 'simCss';
    s.textContent = '#simPanel{position:fixed;z-index:5;right:calc(env(safe-area-inset-right) + 10px);top:calc(env(safe-area-inset-top) + 58px);width:min(330px,40vw);max-height:calc(100% - 210px);display:flex;flex-direction:column;border-radius:16px;overflow:hidden;animation:simIn .5s cubic-bezier(.16,1,.3,1) both}' +
      '@keyframes simIn{from{opacity:0;transform:translateX(24px)}}' +
      '#simPanel header{padding:10px 12px 8px;border-bottom:1px solid var(--line);cursor:pointer}#simPanel header b{display:block;font-size:13.5px;color:#ffd9a0;text-shadow:0 0 10px rgba(255,170,60,.5)}#simPanel header span{display:block;margin-top:3px;font-size:11.5px;line-height:1.45;color:var(--dim)}' +
      '#simPanel header i{float:right;font-style:normal;color:var(--cy);font-size:11px}' +
      '#simPanel .rows{overflow-y:auto;padding:6px 8px 8px;-webkit-user-select:text;user-select:text}#simPanel.min .rows{display:none}' +
      '#simPanel .row{margin-top:6px;padding:7px 9px;border-radius:10px;border:1px solid rgba(120,214,255,.16);opacity:.42;transition:opacity .4s,border-color .4s,background .4s}' +
      '#simPanel .row.on{opacity:1;border-color:rgba(255,180,84,.7);background:rgba(255,180,84,.09);animation:simLit .9s ease}' +
      '@keyframes simLit{0%{box-shadow:0 0 0 0 rgba(255,180,84,.9)}100%{box-shadow:0 0 0 14px rgba(255,180,84,0)}}' +
      '#simPanel .op{font-size:12px;font-weight:700;color:#dff7ff}#simPanel .op em{display:inline-block;min-width:17px;height:17px;margin-right:6px;border-radius:50%;background:rgba(120,214,255,.25);font-style:normal;font-size:10.5px;line-height:17px;text-align:center}' +
      '#simPanel .row.on .op em{background:#ffb454;color:#231500}#simPanel .zh{margin-top:4px;font-size:12px;line-height:1.55;color:#eaf8ff}#simPanel .en{margin-top:3px;font-size:10.5px;line-height:1.4;font-style:italic;color:var(--dim)}#simPanel .ref{margin-top:2px;font-size:10px;color:rgba(160,215,255,.6);text-align:right}' +
      '#simPanel .note{margin-top:6px;padding:7px 9px;border-radius:10px;font-size:12px;line-height:1.55;color:#eaf8ff;border:1px solid rgba(120,214,255,.25);background:rgba(70,210,255,.07)}' +
      '#simPanel .note em{display:block;font-style:normal;font-size:10.5px;font-weight:800;letter-spacing:1px;color:#6fe3ff;margin-bottom:2px}' +
      '#simPanel .note.next{border-color:rgba(255,180,84,.75);background:rgba(255,180,84,.12)}#simPanel .note.next em{color:#ffb454}' +
      '#simPanel .note.ok{border-color:rgba(125,255,176,.6);background:rgba(125,255,176,.08)}#simPanel .note.ok em{color:#7dffb0}#simPanel .note.b{opacity:.8}' +
      '@media (max-width:760px){#simPanel{left:8px;right:8px;width:auto;top:auto;bottom:calc(env(safe-area-inset-bottom) + 126px);max-height:30%}}';
    document.head.appendChild(s);
  }
  function drawPanel() {
    if (!panel || !cur) return;
    var S = cur.stages[stage], n = 0; S.quotes.forEach(function (q, k) { if (lit[stage + '_' + k]) n++; });
    var next = -1; for (var j = 0; j < S.quotes.length; j++) if (!lit[stage + '_' + j]) { next = j; break; }
    panel.innerHTML = '<header><i>' + n + ' / ' + S.quotes.length + ' 条原文 ▾</i><b>' + esc(S.name) + '</b><span>' + esc(S.hint) + '</span></header><div class="rows">' +
      (cur.core ? '<div class="note q"><em>核心问题</em>' + esc(cur.core) + '</div>' : '') +
      (next >= 0 ? '<div class="note next"><em>下一步试试</em>' + esc(S.quotes[next][0]) + '</div>' : '<div class="note ok"><em>✓ 这一关完成</em>每一步对应的原文都点亮了，可以换下一关。</div>') +
      S.quotes.map(function (q, k) { return '<div class="row' + (lit[stage + '_' + k] ? ' on' : '') + '" data-k="' + k + '"><div class="op"><em>' + (k + 1) + '</em>' + esc(q[0]) + '</div><div class="zh">「' + esc(q[1]) + '」</div><div class="en">' + esc(q[2]) + '</div><div class="ref">' + esc(cur.source || '') + esc(q[3]) + '</div></div>'; }).join('') +
      (cur.bound ? '<div class="note b"><em>适用边界</em>' + esc(cur.bound) + '</div>' : '') + '</div>';
    panel.querySelector('header').onclick = function () { panel.classList.toggle('min'); };
  }
  function hitQuote(k) {
    var id = stage + '_' + k; if (lit[id] || !cur.stages[stage].quotes[k]) return;
    lit[id] = 1; saveLit(); drawPanel();
    var row = panel && panel.querySelector('.row[data-k="' + k + '"]'); if (row && row.scrollIntoView) row.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    if (stageDone(stage)) { HL.refreshTools(); HL.toast('✓ 这一关的原文全部点亮', 2200); HL.post({ holo: 1, op: 'sim-progress', key: curKey, stage: stage, done: cur.stages.every(function (_, i) { return stageDone(i); }) }); }
  }

  /* ───────────────────────── the mode ───────────────────────── */
  function clear() {
    if (root) { HL.contentRoot.remove(root); root = null; }
    owned.forEach(function (x) { try { x.dispose(); } catch (e) {} }); owned = [];
  }
  function go(i) {
    clear(); stage = clamp(i, 0, cur.stages.length - 1);
    root = new T.Group(); root.position.copy(HL.CENTER); root.position.y += cur.lift || 0; HL.contentRoot.add(root);
    st = {}; K.st = st; K.root = root; K._info = null; K.pressed = false; press.on = false;
    K.home(); K.held = null; K.view = null; cur.stages[stage].init(K);
    drawPanel(); HL.refreshTools();
  }
  function title(on) { var e = document.getElementById('v2Title'); if (!e) return; if (!M.t0) M.t0 = e.textContent; e.textContent = on && cur ? '全息模型 · ' + cur.title : M.t0; }
  M.enter = function () {
    if (want && SIMS[want]) { curKey = want; want = null; }
    if (!curKey || !SIMS[curKey]) { setTimeout(function () { HL.setMode('stars'); }, 0); return; }
    cur = SIMS[curKey]; lit = loadLit(curKey); HL.wantMode = null;
    css(); title(true); HL.empty('');
    panel = document.createElement('div'); panel.id = 'simPanel'; panel.className = 'glass';
    panel.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
    document.body.appendChild(panel);
    var first = 0; for (var i = 0; i < cur.stages.length; i++) { if (!stageDone(i)) { first = i; break; } }
    go(first);
  };
  M.exit = function () { title(false); clear(); if (panel) panel.remove(); panel = null; HL.info(''); cur = null; HL.home(); };
  M.onContent = function () {};
  M.update = function (dt, t) { if (!cur || !root) return; K.pressed = press.on || press.key; K.held = press.down ? lastHit : null; var S = cur.stages[stage]; if (S.update) S.update(K, Math.min(dt, 0.05), t); };
  M.pick = function (x, y) { lastHit = null; if (!cur) return null; var S = cur.stages[stage]; lastHit = S.pick ? S.pick(K, x, y) : null; return lastHit; };
  M.dragStart = function (h, x, y) { var S = cur.stages[stage]; if (S.dragStart) S.dragStart(K, h, x, y); };
  M.dragMove = function (h, x, y) { var S = cur.stages[stage]; if (S.dragMove) S.dragMove(K, h, x, y); };
  M.dragEnd = function (h) { var S = cur && cur.stages[stage]; if (S && S.dragEnd) S.dragEnd(K, h); };
  M.tap = function (h, x, y) { var S = cur && cur.stages[stage]; if (S && S.tap) S.tap(K, h, x, y); };
  M.tools = function (box) {
    if (!cur) return;
    cur.stages.forEach(function (S, i) { HL.ui.chip(box, '①②③④⑤⑥'.charAt(i) + ' ' + S.name + (stageDone(i) ? ' ✓' : ''), i === stage, function () { go(i); }, S.hint); });
    var SC = cur.stages[stage]; if (SC.chips) { HL.ui.sep(box); SC.chips(K, box); }
    HL.ui.sep(box);
    HL.ui.chip(box, '↺ 重置本关', false, function () { go(stage); HL.toast('已重置（点亮的原文保留）'); });
    if (HL.EMBED && cur.flat) HL.ui.chip(box, '▦ 2D 原版', false, function () { HL.post({ holo: 1, op: 'sim-2d', key: curKey }); }, '打开这个模型的二维原版');
    HL.ui.chip(box, '✕ 退出模型', false, function () { HL.setMode('stars'); }, '回到知识星图');
  };
  HL.modes.sim = M;   // reachable by setMode, not listed on the mode bar

  var canvas = HL.renderer.domElement;
  canvas.addEventListener('pointerdown', function (e) { if (HL.active !== M) return; press.down = true; press.on = !lastHit; press.x = e.clientX; press.y = e.clientY; });
  canvas.addEventListener('pointermove', function (e) { if (press.on && Math.hypot(e.clientX - press.x, e.clientY - press.y) > 14) press.on = false; });
  addEventListener('pointerup', function () { press.on = false; press.down = false; }); addEventListener('pointercancel', function () { press.on = false; press.down = false; });
  addEventListener('keydown', function (e) { if (HL.active === M && e.code === 'Space' && !/INPUT|TEXTAREA/.test((e.target && e.target.tagName) || '')) { press.key = true; e.preventDefault(); } });
  addEventListener('keyup', function (e) { if (e.code === 'Space') press.key = false; });

  HL.sims = {
    css: css, K: K, isLit: function (k) { return !!lit[stage + '_' + k]; },
    define: function (key, def) { SIMS[key] = def; },
    has: function (key) { return !!SIMS[key]; },
    open: function (key) {
      if (!SIMS[key]) return false;
      want = key;
      var run = function () { if (HL.boot.state === 'idle') HL.startBoot(); HL.detail.close(); HL.setMode('sim', true); };
      if (HL.contentReady) run(); else { var n = 0, iv = setInterval(function () { if (HL.contentReady || ++n > 60) { clearInterval(iv); if (HL.contentReady) run(); } }, 100); }
      return true;
    }
  };
  addEventListener('message', function (e) {
    var m = e.data; if (!HL.EMBED || e.source !== window.parent || !m || typeof m !== 'object' || m.holo !== 1) return;
    if (m.op === 'sim' && typeof m.key === 'string') HL.sims.open(m.key);
  });
  HL.simFromQuery = function () { var q = location.search.match(/[?&]sim=([a-z_]+)/); if (q) HL.sims.open(q[1]); };
})();
