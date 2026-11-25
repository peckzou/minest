/* Minest · 全息操作台 2.0 · 光锥 LIGHT CONE — the seventh mode: 3.3 million years of technology laid out on a light cone.
   The apex is now. The cone opens downward into the past on a logarithmic time axis, so the last century and the first
   million years get comparable room. Eight domains spiral down the surface; every milestone is a point of light.
   A glowing "moment" ring slides along the axis: everything deeper than the ring is that moment's past (lit), everything
   above it has not happened yet (dim). Run it backwards and history un-happens.
   Data: HL.TECH / HL.TECH_DOMAINS (tech-history.js), plus the island's thinkers when the embedding page sends
   { holo: 1, op: 'cone', people: [{ id, name, year }], focus: id }. */
(function () {
  'use strict';
  var HL = window.HL, T = window.THREE; if (!HL || !HL.register || !T || !HL.TECH) return;
  var C = { id: 'cone', zh: '光锥', en: 'LIGHT CONE', root: null, d: 0, play: 0, sel: -1, dom: -1, people: [], focus: null, showPeople: true, ev: [] };
  var NOW = 2030, U0 = Math.log10(NOW - 2026), U1 = Math.log10(NOW + 3300000), APEX = 3.25, HGT = 2.05, R0 = 0.1, R1 = 1.85, PCOL = '#ffffff';
  function depth(year) { return (Math.log10(NOW - Math.min(year, 2026)) - U0) / (U1 - U0); }
  function yearAt(d) { return NOW - Math.pow(10, U0 + d * (U1 - U0)); }
  function yOf(d) { return APEX - d * HGT; }
  function rOf(d) { return R0 + d * (R1 - R0); }
  function fmtYear(y) { y = Math.round(y); if (y < -12000) { var ago = 2026 - y; return '距今约 ' + (ago >= 1e6 ? (ago / 1e6).toFixed(ago >= 2e6 ? 1 : 2).replace(/\.?0+$/, '') + ' 百万年' : Math.round(ago / 1e4) + ' 万年'); } return y < 0 ? '公元前 ' + (-y) + ' 年' : y + ' 年'; }
  function pos(d, a) { var r = rOf(d); return new T.Vector3(Math.cos(a) * r, yOf(d), Math.sin(a) * r); }
  function angle(dom, d, k) { return dom / 9 * Math.PI * 2 + d * Math.PI * 1.5 + (k || 0); }

  function sprite(text, color, h, bold) {
    var cv = document.createElement('canvas'), x = cv.getContext('2d'), fs = 44; x.font = (bold ? '700 ' : '500 ') + fs + 'px ' + (HL.FONT || 'sans-serif');
    var w = Math.ceil(x.measureText(text).width) + 28; cv.width = w; cv.height = 64; x.font = (bold ? '700 ' : '500 ') + fs + 'px ' + (HL.FONT || 'sans-serif'); x.textBaseline = 'middle'; x.shadowColor = 'rgba(0,0,0,.9)'; x.shadowBlur = 8; x.fillStyle = color || '#dff6ff'; x.fillText(text, 14, 34);
    var tex = new T.CanvasTexture(cv); tex.minFilter = T.LinearFilter; var s = new T.Sprite(new T.SpriteMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false })); s.scale.set(h * w / 64, h, 1); s.renderOrder = 9; s.userData.tex = tex; return s;
  }
  function freeSprite(s) { if (!s) return; if (s.parent) s.parent.remove(s); s.userData.tex.dispose(); s.material.dispose(); }

  C.events = function () {
    var ev = HL.TECH.map(function (e) { return { year: e[0], title: e[1], dom: e[2], note: e[3] }; });
    if (C.showPeople) C.people.forEach(function (p) { ev.push({ year: p.year, title: p.name, dom: 8, note: p.note || '', pid: p.id }); });
    var cnt = {}; ev.sort(function (a, b) { return a.year - b.year; });
    ev.forEach(function (e) { e.d = depth(e.year); var k = e.dom + ':' + Math.round(e.d * 60); cnt[k] = (cnt[k] || 0) + 1; e.a = angle(e.dom, e.d, (cnt[k] - 1) * 0.11); e.p = pos(e.d, e.a); e.col = new T.Color(e.dom === 8 ? PCOL : HL.TECH_DOMAINS[e.dom][1]); });
    return ev;
  };
  C.clear = function () {
    if (C.root) { C.root.traverse(function (o) { if (o.geometry) o.geometry.dispose(); if (o.material) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); } }); HL.contentRoot.remove(C.root); }
    C.root = null; C.selLab = null; card(null);
  };
  C.exit = function () { C.clear(); C.play = 0; window.removeEventListener('keydown', onKey); };
  C.enter = function () { C.build(); window.addEventListener('keydown', onKey); if (C.focus) { var i = C.ev.findIndex(function (e) { return e.pid === C.focus; }); if (i >= 0) C.select(i); } else { C.d = 0; C.play = 1; } };
  C.build = function () {
    C.clear(); var g = C.root = new T.Group(); HL.contentRoot.add(g); C.ev = C.events();
    var add = function (o) { g.add(o); return o; }, lm = function (c, op) { return new T.LineBasicMaterial({ color: c, transparent: true, opacity: op, blending: T.AdditiveBlending, depthWrite: false }); };
    // the shell: generators, the future cone above the apex, and the time axis
    var seg = [], i, a; for (i = 0; i < 36; i++) { a = i / 36 * Math.PI * 2; seg.push(0, APEX, 0, Math.cos(a) * R1, yOf(1), Math.sin(a) * R1); seg.push(0, APEX, 0, Math.cos(a) * 0.55, APEX + 0.5, Math.sin(a) * 0.55); }
    var sg = new T.BufferGeometry(); sg.setAttribute('position', new T.Float32BufferAttribute(seg, 3)); add(new T.LineSegments(sg, lm(0x4fc3ff, 0.1)));
    add(new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(0, yOf(1) - 0.05, 0), new T.Vector3(0, APEX + 0.55, 0)]), lm(0xffffff, 0.35)));
    // rings at round distances into the past
    [[10, '10 年前'], [100, '100 年前'], [1000, '1 千年前'], [10000, '1 万年前'], [100000, '10 万年前'], [1000000, '100 万年前'], [3300000, '330 万年前']].forEach(function (q) {
      var d = depth(2026 - q[0]), pts = [], k; for (k = 0; k <= 72; k++) { a = k / 72 * Math.PI * 2; pts.push(new T.Vector3(Math.cos(a) * rOf(d), yOf(d), Math.sin(a) * rOf(d))); }
      add(new T.Line(new T.BufferGeometry().setFromPoints(pts), lm(0x7fd8ff, 0.28))); var s = add(sprite(q[1], '#9fdcff', 0.085)); s.position.set(rOf(d) + 0.22, yOf(d), 0); s.userData.fixed = true; });
    var now = add(sprite('此刻 · 2026', '#ffffff', 0.12, true)); now.position.set(0.5, APEX + 0.08, 0); var fut = add(sprite('未来', '#7f9bb5', 0.085)); fut.position.set(0.75, APEX + 0.5, 0);
    // the eight domain spirals and their names round the mouth of the cone
    HL.TECH_DOMAINS.concat(C.people.length && C.showPeople ? [['思想者', PCOL]] : []).forEach(function (dm, k) {
      var pts = [], j; for (j = 0; j <= 60; j++) pts.push(pos(j / 60, angle(k, j / 60))); var l = add(new T.Line(new T.BufferGeometry().setFromPoints(pts), lm(new T.Color(dm[1]).getHex(), 0.45))); l.userData.dom = k;
      var s = add(sprite(dm[0], dm[1], 0.1, true)), q = pos(1, angle(k, 1)); s.position.set(q.x * 1.14, q.y - 0.1, q.z * 1.14); s.userData.dom = k; });
    // the milestones
    var n = C.ev.length, P = new Float32Array(n * 3), K = new Float32Array(n * 3); C.ev.forEach(function (e, j) { P[j * 3] = e.p.x; P[j * 3 + 1] = e.p.y; P[j * 3 + 2] = e.p.z; });
    var pg = new T.BufferGeometry(); pg.setAttribute('position', new T.BufferAttribute(P, 3)); pg.setAttribute('color', new T.BufferAttribute(K, 3));
    C.pts = add(new T.Points(pg, new T.PointsMaterial({ size: 0.075, vertexColors: true, transparent: true, opacity: 1, blending: T.AdditiveBlending, depthWrite: false, sizeAttenuation: true, map: dotTex() })));
    // the moment ring, its disc, and the marker of the chosen milestone
    C.ring = add(new T.Mesh(new T.TorusGeometry(1, 0.012, 8, 96), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.95, blending: T.AdditiveBlending, depthWrite: false }))); C.ring.rotation.x = Math.PI / 2;
    C.disc = add(new T.Mesh(new T.CircleGeometry(1, 64), new T.MeshBasicMaterial({ color: 0x6fe3ff, transparent: true, opacity: 0.07, side: T.DoubleSide, blending: T.AdditiveBlending, depthWrite: false }))); C.disc.rotation.x = -Math.PI / 2;
    C.mark = add(new T.Mesh(new T.SphereGeometry(0.045, 16, 12), new T.MeshBasicMaterial({ color: 0xffffff }))); C.mark.visible = false;
    C.yearLab = null; C.lastYear = '';
  };
  var _dot; function dotTex() { if (_dot) return _dot; var cv = document.createElement('canvas'); cv.width = cv.height = 64; var x = cv.getContext('2d'), gr = x.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.35, 'rgba(255,255,255,.75)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, 64, 64); _dot = new T.CanvasTexture(cv); return _dot; }

  C.vis = function (e) { return C.dom < 0 || e.dom === C.dom; };
  C.update = function (dt) {
    if (!C.root) return; var k = HL.appear ? HL.appear(0) : 1;
    if (C.play) { C.d += C.play * dt * 0.06; if (C.d >= 1) { C.d = 1; C.play = 0; HL.refreshTools(); } if (C.d <= 0) { C.d = 0; C.play = 0; HL.refreshTools(); } }
    if (C.sel < 0) C.root.rotation.y += dt * 0.06;
    C.root.scale.setScalar(0.4 + 0.6 * k);
    var y = yOf(C.d), r = rOf(C.d); C.ring.position.y = y; C.ring.scale.set(r, r, 1); C.disc.position.y = y; C.disc.scale.set(r, r, 1);
    var col = C.pts.geometry.attributes.color, arr = col.array, lit = 0, near = -1, nd = 1e9;
    C.ev.forEach(function (e, j) { var on = e.d >= C.d - 0.004, v = !C.vis(e) ? 0.04 : on ? 1 : 0.16, dd = Math.abs(e.d - C.d); if (on && C.vis(e)) lit++; if (C.vis(e) && dd < nd) { nd = dd; near = j; } if (dd < 0.02 && C.vis(e)) v = 1.6; arr[j * 3] = e.col.r * v; arr[j * 3 + 1] = e.col.g * v; arr[j * 3 + 2] = e.col.b * v; });
    col.needsUpdate = true;
    C.root.children.forEach(function (o) { if (o.userData.dom != null && o.material) o.material.opacity = (C.dom < 0 || o.userData.dom === C.dom ? 1 : 0.12) * (o.isSprite ? 1 : 0.45); });
    // the year at the ring
    var ys = fmtYear(yearAt(C.d)); if (ys !== C.lastYear) { C.lastYear = ys; freeSprite(C.yearLab); C.yearLab = sprite(ys, '#ffffff', 0.13, true); C.root.add(C.yearLab); }
    C.yearLab.position.set(-r - 0.5, y + 0.02, 0); C.yearLab.position.applyAxisAngle(new T.Vector3(0, 1, 0), -C.root.rotation.y);
    C.root.children.forEach(function (o) { if (o.userData.fixed) { var rr = Math.hypot(o.position.x, o.position.z); o.position.x = Math.cos(C.root.rotation.y) * rr; o.position.z = Math.sin(C.root.rotation.y) * rr; } });
    if (C.sel >= 0) { var e = C.ev[C.sel]; C.mark.visible = true; C.mark.position.copy(e.p); C.mark.scale.setScalar(1 + 0.25 * Math.sin(HL.now * 5)); } else C.mark.visible = false;
    // follow the ring
    var g = HL.cam.g; g.tgt.set(0, y + (C.root.position.y || 0), 0); g.dist = 3.4 + C.d * 2.6; g.el = 0.3;
    HL.info(C.play ? (C.play > 0 ? '⏪ 时空倒流 · ' : '⏩ 回到此刻 · ') + ys + ' · 这一刻的过去光锥里有 ' + lit + ' 件' : near >= 0 && nd < 0.03 && C.sel < 0 ? fmtYear(C.ev[near].year) + ' · ' + C.ev[near].title + '（点它看说明）' : ys + ' · 这一刻的过去光锥里有 ' + lit + ' / ' + C.ev.filter(C.vis).length + ' 件 · ↑↓ 或滚动条移动时间');
  };
  C.pick = function (x, y) {
    if (!C.root) return null; var best = -1, bd = 26, v = new T.Vector3();
    C.ev.forEach(function (e, j) { if (!C.vis(e)) return; v.copy(e.p); C.root.localToWorld(v); var s = HL.screenOf(v); if (s.behind) return; var d = Math.hypot(s.x - x, s.y - y); if (d < bd) { bd = d; best = j; } });
    return best >= 0 ? { i: best } : null;
  };
  C.tap = function (h) { if (h && h.i != null) C.select(h.i); else if (C.sel >= 0) C.select(-1); };
  C.select = function (i) {
    C.sel = i; C.play = 0;
    if (i < 0) { card(null); HL.refreshTools(); return; }
    var e = C.ev[i]; C.d = e.d; card(e);
    C.root.rotation.y = e.a - Math.PI / 2;             // turn the milestone to face the viewer
    if (HL.EMBED && HL.post) HL.post({ holo: 1, op: 'coneSeen', title: e.title, year: fmtYear(e.year), domain: e.dom === 8 ? '思想者' : HL.TECH_DOMAINS[e.dom][0], note: e.note });
    HL.refreshTools();
  };
  C.step = function (dir, same) { var i = C.sel, n = C.ev.length, j; if (i < 0) { i = 0; var bd = 9; C.ev.forEach(function (e, k) { if (C.vis(e) && Math.abs(e.d - C.d) < bd) { bd = Math.abs(e.d - C.d); i = k; } }); C.select(i); return; }
    for (j = i + dir; j >= 0 && j < n; j += dir) if (C.vis(C.ev[j]) && (!same || C.ev[j].dom === C.ev[i].dom)) { C.select(j); return; } };
  function onKey(e) { if (HL.active !== C || (e.target && /INPUT|TEXTAREA/.test(e.target.tagName))) return;
    if (e.key === 'ArrowDown' || e.key === 's') { C.play = 0; C.sel = -1; card(null); C.d = Math.min(1, C.d + 0.02); e.preventDefault(); }
    if (e.key === 'ArrowUp' || e.key === 'w') { C.play = 0; C.sel = -1; card(null); C.d = Math.max(0, C.d - 0.02); e.preventDefault(); }
    if (e.key === 'ArrowLeft') { C.step(1); e.preventDefault(); } if (e.key === 'ArrowRight') { C.step(-1); e.preventDefault(); }
    if (e.key === ' ') { C.sel = -1; card(null); C.play = C.play ? 0 : (C.d >= 0.99 ? -1 : 1); HL.refreshTools(); e.preventDefault(); } }

  // the card of the chosen milestone
  function card(e) {
    var el = document.getElementById('coneCard');
    if (!e) { if (el) el.style.display = 'none'; return; }
    if (!el) { var st = document.createElement('style'); st.textContent = '#coneCard{position:fixed;z-index:6;right:calc(env(safe-area-inset-right) + 16px);top:calc(env(safe-area-inset-top) + 70px);width:min(330px,calc(100vw - 32px));padding:14px 16px;border-radius:14px;color:#eaf7ff;font-size:13.5px;line-height:1.65;background:rgba(8,20,34,.82);border:1px solid rgba(120,214,255,.45);box-shadow:0 0 30px rgba(70,210,255,.2);backdrop-filter:blur(8px)}' +
        '#coneCard .y{font-size:12px;letter-spacing:.1em}#coneCard h3{margin:2px 0 8px;font-size:19px;color:#fff}#coneCard .r{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}#coneCard button{padding:5px 10px;border-radius:999px;border:1px solid rgba(120,214,255,.45);background:rgba(70,210,255,.1);color:#dff6ff;font-size:12px;cursor:pointer}#coneCard button:hover{background:rgba(70,210,255,.3)}#coneCard .x{position:absolute;right:8px;top:6px;border:0;background:transparent;font-size:14px}';
      document.head.appendChild(st); el = document.createElement('div'); el.id = 'coneCard'; document.body.appendChild(el); el.addEventListener('pointerdown', function (ev) { ev.stopPropagation(); }); }
    var dn = e.dom === 8 ? '思想者' : HL.TECH_DOMAINS[e.dom][0], dc = e.dom === 8 ? PCOL : HL.TECH_DOMAINS[e.dom][1];
    el.innerHTML = '<button class="x" data-a="x">✕</button><div class="y"></div><h3></h3><div class="n"></div><div class="r"><button data-a="older">◀ 更早一件</button><button data-a="newer">更晚一件 ▶</button><button data-a="line-">沿「' + dn + '」往前</button><button data-a="line+">沿「' + dn + '」往后</button>' + (e.pid && HL.EMBED ? '<button data-a="go">🚶 前往他的展馆</button>' : '') + '</div>';
    el.querySelector('.y').textContent = fmtYear(e.year) + ' · ' + dn; el.querySelector('.y').style.color = dc; el.querySelector('h3').textContent = e.title; el.querySelector('.n').textContent = e.note || '';
    el.onclick = function (ev) { var a = ev.target.getAttribute('data-a'); if (!a) return; if (a === 'x') C.select(-1); if (a === 'older') C.step(-1); if (a === 'newer') C.step(1); if (a === 'line-') C.step(-1, true); if (a === 'line+') C.step(1, true); if (a === 'go') HL.post({ holo: 1, op: 'goto', id: e.pid }); };
    el.style.display = 'block';
  }
  C.tools = function (box) {
    var ui = HL.ui;
    ui.chip(box, C.play > 0 ? '⏸ 暂停' : '⏪ 时空倒流', C.play > 0, function () { C.sel = -1; card(null); if (C.d >= 0.99) C.d = 0; C.play = C.play > 0 ? 0 : 1; HL.refreshTools(); }, '从此刻一路退回 330 万年前');
    ui.chip(box, C.play < 0 ? '⏸ 暂停' : '⏩ 回到此刻', C.play < 0, function () { C.sel = -1; card(null); if (C.d <= 0.01) C.d = 1; C.play = C.play < 0 ? 0 : -1; HL.refreshTools(); }, '从最早的石器一路演到今天');
    ui.sep(box); ui.lab(box, '跳到');
    (C.jumps || [['石器', -2600000], ['用火', -400000], ['农业', -9500], ['文字', -3300], ['印刷', 1450], ['蒸汽', 1769], ['电', 1882], ['计算机', 1946], ['此刻', 2026]]).forEach(function (q) { ui.chip(box, q[0], false, function () { C.play = 0; C.sel = -1; card(null); C.d = depth(q[1]); HL.refreshTools(); }); });
    ui.sep(box); ui.lab(box, '只看');
    ui.chip(box, '全部', C.dom < 0, function () { C.dom = -1; HL.refreshTools(); });
    HL.TECH_DOMAINS.forEach(function (dm, k) { ui.chip(box, dm[0], C.dom === k, function () { C.dom = C.dom === k ? -1 : k; if (C.sel >= 0 && !C.vis(C.ev[C.sel])) C.select(-1); HL.refreshTools(); }); });
    if (C.people.length) ui.chip(box, '思想者', C.dom === 8, function () { C.dom = C.dom === 8 ? -1 : 8; if (C.sel >= 0 && !C.vis(C.ev[C.sel])) C.select(-1); HL.refreshTools(); }, '岛上 43 座展馆的主人，按出生年代排在光锥上');
  };
  C.resize = function () {};
  C.onContent = function () {};
  window.addEventListener('message', function (e) {
    var m = e.data; if (!HL.EMBED || e.source !== window.parent || !m || m.holo !== 1 || m.op !== 'cone') return;
    C.people = (m.people || []).filter(function (p) { return p && typeof p.year === 'number' && p.name; }); C.focus = m.focus || null;
    if (HL.active === C) { C.build(); if (C.focus) { var i = C.ev.findIndex(function (q) { return q.pid === C.focus; }); if (i >= 0) C.select(i); } HL.refreshTools(); }
  });
  // another history on the cone (the EC-6 hall sends its subjects' timeline): { holo: 1, op: 'conedata', domains: [[name, colour]…], events: [[year, title, domain, note]…] }
  window.addEventListener('message', function (e) {
    var m = e.data; if (!HL.EMBED || e.source !== window.parent || !m || m.holo !== 1 || m.op !== 'conedata' || !Array.isArray(m.domains) || !Array.isArray(m.events)) return;
    HL.TECH_DOMAINS = m.domains.slice(0, 8).map(function (d) { return [String(d[0]), String(d[1])]; });
    HL.TECH = m.events.filter(function (q) { return q && typeof q[0] === 'number' && q[2] >= 0 && q[2] < HL.TECH_DOMAINS.length; }).map(function (q) { return [q[0], String(q[1]), q[2], String(q[3] || '')]; });
    C.people = []; C.dom = -1; C.sel = -1; if (m.title) C.zh = String(m.title); if (Array.isArray(m.jumps)) C.jumps = m.jumps.filter(function (q) { return q && typeof q[1] === 'number'; }).map(function (q) { return [String(q[0]), q[1]]; });
    if (HL.active === C) { C.build(); HL.refreshTools(); }
  });
  HL.cone = C;
  HL.register(C);
})();
