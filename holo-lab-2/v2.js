/* Minest · 全息操作台 2.0 · 知识星图 — Holo Console MK II
   1.0's engine is loaded unchanged (../holo-lab/core.js, modes.js, workbench.js). This file only adds to it while it runs:
     the rig    gimbal rings, a geodesic shell, a scan ring, lettered bands and a floor dial around the projection
     the HUD    telemetry · a reticle that locks onto the star under the finger or in focus ·
                cards hanging off the stars (tap one → its star) · a leader line from the focused star to its data panel
     hands      flick empty space to spin the constellation (it keeps turning) · 卡片 Cards chip · ✋ the gesture guide
   Everything 1.0 does (clusters, levels, pulled cards, relations, paths, slice, time, undo) still works: it is the same code. */
(function () {
  'use strict';
  var HL = window.HL, T = window.THREE, S = HL && HL.modes && HL.modes.stars; if (!HL || !T || !S) return;
  var C = HL.CENTER, U = HL.U, TAU = Math.PI * 2, doc = document;
  var UI_KEY = 'minest.holoLab2.ui', ui = { cards: true };
  try { var saved = JSON.parse(localStorage.getItem(UI_KEY) || 'null'); if (saved && typeof saved.cards === 'boolean') ui.cards = saved.cards; } catch (e) {}
  function saveUi() { try { localStorage.setItem(UI_KEY, JSON.stringify(ui)); } catch (e) {} }
  function reduce() { return !!HL.layout().settings.reduce; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function inStars() { return HL.active === S && !!S.root && S.nodes.length > 0 && HL.contentReady; }
  function vis(i) { return S.wb && S.wb.vis ? S.wb.vis(i) : 1; }

  /* ───────────────────────── the rig (3D, additive light only) ───────────────────────── */
  var rig = new T.Group(); HL.scene.add(rig);
  var mats = [];                                  // [material, opacity when fully on, only in the star map]
  function track(m, op, starsOnly) { mats.push([m, op, !!starsOnly]); return m; }
  function fill(color, op, starsOnly, extra) {
    var o = { color: color, transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide }; for (var k in extra || {}) o[k] = extra[k];
    return track(new T.MeshBasicMaterial(o), op, starsOnly);
  }
  function line(color, op, starsOnly) { return track(new T.LineBasicMaterial({ color: color, transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false }), op, starsOnly); }
  function arcs(r, w, list, m) {                  // flat arc bands in the XY plane: list of [start, length] in turns
    var g = new T.Group(); list.forEach(function (a) { g.add(new T.Mesh(new T.RingGeometry(r - w / 2, r + w / 2, Math.max(8, Math.round(a[1] * 160)), 1, a[0] * TAU, a[1] * TAU), m)); }); return g;
  }
  function ticks(r, n, len, every, m) {           // radial tick marks in the XY plane, a longer one every `every`
    var p = new Float32Array(n * 6);
    for (var i = 0; i < n; i++) { var a = i / n * TAU, l = i % every === 0 ? len * 2.2 : len, c = Math.cos(a), s = Math.sin(a); p.set([c * r, s * r, 0, c * (r + l), s * (r + l), 0], i * 6); }
    var g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(p, 3)); return new T.LineSegments(g, m);
  }
  var CY = 0x46d2ff, AM = 0xffa23a, ICE = 0xbff0ff;

  // three gimbal rings around the projection
  var gimbal = new T.Group(); gimbal.position.copy(C); rig.add(gimbal);
  var rings = [
    { r: 2.64, tilt: 0.10, yaw: 0.0, w: 0.10, col: CY, arcs: [[0.02, 0.2], [0.27, 0.08], [0.4, 0.3], [0.74, 0.05], [0.82, 0.14]], n: 144 },
    { r: 2.8, tilt: 0.52, yaw: 0.6, w: -0.07, col: AM, arcs: [[0.0, 0.12], [0.18, 0.3], [0.55, 0.06], [0.66, 0.26]], n: 96 },
    { r: 2.94, tilt: -0.44, yaw: -0.5, w: 0.045, col: CY, arcs: [[0.05, 0.34], [0.45, 0.1], [0.6, 0.22], [0.88, 0.07]], n: 72 }
  ];
  rings.forEach(function (R, k) {
    var hold = new T.Group(); hold.rotation.set(Math.PI / 2 + R.tilt, 0, R.yaw, 'ZXY'); gimbal.add(hold);
    var spin = new T.Group(); hold.add(spin); R.hold = hold; R.spin = spin;
    spin.add(arcs(R.r, 0.022, R.arcs, fill(R.col, 0.62, true)));
    spin.add(arcs(R.r + 0.07, 0.006, [[0, 1]], fill(R.col, 0.22, true)));
    spin.add(ticks(R.r - 0.075, R.n, 0.022, 6, line(R.col, 0.5, true)));
    // a bright runner on each ring
    var run = new T.Mesh(new T.RingGeometry(R.r - 0.03, R.r + 0.03, 12, 1, 0, 0.05), fill(0xffffff, 0.9, true)); spin.add(run);
  });
  // geodesic shell: the constellation sits inside a faint cage
  var shell = new T.LineSegments(new T.WireframeGeometry(new T.IcosahedronGeometry(2.5, 2)), line(CY, 0.05, true)); shell.position.copy(C); shell.scale.set(1, 0.62, 1); rig.add(shell);
  // scan ring + a faint sheet travelling up and down the projection
  var scan = new T.Group(); rig.add(scan);
  var scanRing = new T.Mesh(new T.RingGeometry(2.46, 2.5, 128), fill(ICE, 0.55, true)); scanRing.rotation.x = -Math.PI / 2; scan.add(scanRing);
  var scanSheet = new T.Mesh(new T.CircleGeometry(2.46, 96), fill(CY, 0.035, true)); scanSheet.rotation.x = -Math.PI / 2; scan.add(scanSheet);
  // lettered bands (text only on the far side, behind the stars: the inside of an open cylinder)
  function bandTex(text, color) {
    var c = doc.createElement('canvas'); c.width = 4096; c.height = 64; var x = c.getContext('2d');
    x.font = '600 30px ' + (HL.FONT || 'sans-serif'); x.textBaseline = 'middle'; x.fillStyle = color;
    var w = x.measureText(text).width, n = Math.max(1, Math.floor(4096 / w)), step = 4096 / n;
    for (var i = 0; i < n; i++) x.fillText(text, i * step, 34);
    x.globalAlpha = 0.6; x.fillRect(0, 2, 4096, 2); x.fillRect(0, 60, 4096, 2);
    var t = new T.CanvasTexture(c); t.wrapS = T.RepeatWrapping; t.repeat.x = -1; t.anisotropy = 4; return t;   // mirrored: it is read from inside the cylinder
  }
  function band(r, y, h, text, color, op, speed) {
    var m = track(new T.MeshBasicMaterial({ map: bandTex(text, color), transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false, side: T.BackSide }), op, false);
    var b = new T.Mesh(new T.CylinderGeometry(r, r, h, 128, 1, true), m); b.position.set(0, y, 0); b.userData.speed = speed; rig.add(b); return b;
  }
  var bands = [
    band(2.66, HL.EMIT.y + 0.16, 0.085, 'MINEST · HOLO CONSOLE MK II · 知识星图 KNOWLEDGE CONSTELLATION ·   ', '#8fe6ff', 0.75, 0.05),
    band(2.66, HL.EMIT.y + 2.62, 0.07, 'SYS NOMINAL · PROJECTION STABLE · 用手指操作空中的文字 · TOUCH THE LIGHT ·   ', '#ffc27a', 0.6, -0.04)
  ];
  // floor dial
  function dialTex() {
    var N = 1024, c = doc.createElement('canvas'); c.width = c.height = N; var x = c.getContext('2d'), h = N / 2;
    x.translate(h, h); x.lineCap = 'butt';
    function ring(r, w, a0, a1, col) { x.beginPath(); x.strokeStyle = col; x.lineWidth = w; x.arc(0, 0, r, a0 * TAU, a1 * TAU); x.stroke(); }
    ring(498, 2, 0, 1, 'rgba(110,220,255,.55)'); ring(470, 10, 0.02, 0.2, 'rgba(110,220,255,.5)'); ring(470, 10, 0.27, 0.48, 'rgba(255,170,70,.55)'); ring(470, 10, 0.55, 0.7, 'rgba(110,220,255,.5)'); ring(470, 10, 0.78, 0.97, 'rgba(110,220,255,.35)');
    ring(430, 1.5, 0, 1, 'rgba(110,220,255,.5)'); ring(372, 22, 0.1, 0.34, 'rgba(110,220,255,.16)'); ring(372, 22, 0.6, 0.9, 'rgba(110,220,255,.16)'); ring(340, 1, 0, 1, 'rgba(110,220,255,.35)');
    for (var i = 0; i < 180; i++) { var a = i / 180 * TAU, l = i % 15 === 0 ? 26 : i % 5 === 0 ? 14 : 7; x.beginPath(); x.strokeStyle = i % 15 === 0 ? 'rgba(255,190,110,.9)' : 'rgba(140,230,255,.6)'; x.lineWidth = i % 15 === 0 ? 2.5 : 1.2; x.moveTo(Math.cos(a) * 430, Math.sin(a) * 430); x.lineTo(Math.cos(a) * (430 - l), Math.sin(a) * (430 - l)); x.stroke(); }
    x.font = '600 15px ui-monospace, Menlo, monospace'; x.fillStyle = 'rgba(190,240,255,.85)'; x.textAlign = 'center'; x.textBaseline = 'middle';
    for (var d = 0; d < 12; d++) { x.save(); x.rotate(d / 12 * TAU); x.translate(0, -388); x.fillText(('00' + d * 30).slice(-3), 0, 0); x.restore(); }
    return new T.CanvasTexture(c);
  }
  var dial = new T.Mesh(new T.PlaneGeometry(9.6, 9.6), track(new T.MeshBasicMaterial({ map: dialTex(), transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false }), 0.8, false));
  dial.rotation.x = -Math.PI / 2; dial.position.y = 0.035; rig.add(dial);
  var dial2 = new T.Mesh(new T.PlaneGeometry(6.4, 6.4), dial.material); dial2.rotation.x = -Math.PI / 2; dial2.position.y = 0.04; rig.add(dial2);

  /* ───────────────────────── hands: flick to spin ───────────────────────── */
  var spinV = 0;
  S.emptyDrag = function (dx, dy) {               // one finger on empty space: turn the constellation itself, all the way round
    if (!S.root || S.focus >= 0) return false;    // (while a star is in focus the camera orbits it, as in 1.0)
    S.root.rotation.y += dx * 0.0065; HL.cam.g.el = clamp(HL.cam.g.el + dy * 0.004, -0.08, 0.62); spinV = 0; return true;
  };
  S.emptyDragEnd = function (vx) { spinV = reduce() ? 0 : clamp((vx || 0) * 0.0065 * 60, -4.5, 4.5); };

  /* ───────────────────────── the HUD (DOM over the canvas) ───────────────────────── */
  function mk(tag, cls, html) { var e = doc.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  var hud = mk('div'); hud.id = 'v2hud';
  hud.innerHTML = '<svg class="v2-lines"><polyline class="lead" fill="none" stroke="#ffb454" stroke-width="1.2" opacity=".85"/><g class="nb" stroke="#6fe3ff" stroke-width="1" opacity=".6"></g></svg>' +
    '<i class="v2-corner tl"></i><i class="v2-corner tr"></i><i class="v2-corner bl"></i><i class="v2-corner br"></i>' +
    '<div class="v2-tele"><h5 data-k="hd">MK II · CONSTELLATION</h5>' +
    '<div class="row"><i>NODES</i><b data-k="n">000</b><i>LINKS</i><b data-k="l">000</b></div>' +
    '<div class="row x"><i>AZ</i><b data-k="az">+000.0</b><i>EL</i><b data-k="el">+00.0</b></div>' +
    '<div class="row x"><i>RANGE</i><b data-k="z">0.00</b><i>FPS</i><b data-k="fps">60</b></div>' +
    '<div class="bars"></div><div class="foc" data-k="foc"></div></div>' +
    '<div class="v2-rule"><i></i></div>' +
    '<div class="v2-ret"><svg viewBox="0 0 84 84" fill="none" stroke="#6fe3ff" stroke-width="1.6"><g class="r1"><path d="M42 6 A36 36 0 0 1 78 42"/><path d="M42 78 A36 36 0 0 1 6 42"/></g><g class="r2" stroke-width="1"><path d="M42 14 A28 28 0 0 0 14 42"/><path d="M42 70 A28 28 0 0 0 70 42"/></g><path stroke-width="1" d="M42 0v10M42 74v10M0 42h10M74 42h10"/></svg></div>';
  doc.body.appendChild(hud);
  var q = function (s) { return hud.querySelector(s); }, K = {};
  Array.prototype.forEach.call(hud.querySelectorAll('[data-k]'), function (e) { K[e.dataset.k] = e; });
  var bars = q('.bars'), barEls = []; for (var bi = 0; bi < 28; bi++) { var sp = mk('span'); bars.appendChild(sp); barEls.push(sp); }
  var ret = q('.v2-ret'), lead = q('.lead'), nbLines = q('.nb'), ruleI = q('.v2-rule i');
  var peek = mk('div', 'v2-tag peek', '<small></small><b></b><p></p>'); hud.appendChild(peek);
  function setText(e, s) { if (e.textContent !== s) e.textContent = s; }
  function fillTag(e, N0) {
    var it = N0.it, kz = HL.KIND[it.kind] || ['', ''];
    e.style.setProperty('--h', N0.color || (N0.col && '#' + N0.col.getHexString()) || '#6fe3ff');
    setText(e.children[0], (kz[1] || 'NODE') + (it.groupTitle ? ' · ' + it.groupTitle : N0.hub && N0.members ? ' · ' + N0.members.length : ''));
    setText(e.children[1], it.title || '（无标题）');
    var tx = it.text || (N0.hub && N0.members ? N0.members.slice(0, 4).map(function (m) { return m.title; }).join(' · ') : '');
    setText(e.children[2], tx); e.children[2].style.display = tx ? '' : 'none';
  }

  // the gesture guide
  var help = mk('button', 'hud glass', '✋'); help.id = 'v2help'; help.type = 'button'; help.setAttribute('aria-label', '手势 Gestures'); doc.body.appendChild(help);
  var guide = mk('div', 'glass'); guide.id = 'v2guide';
  guide.innerHTML = '<h4>HANDS · 用手操作</h4><dl>' + [
    ['单指拖空白', '转动星图；甩一下，它会继续转 · Drag or flick to spin'], ['双指捏合', '放大 / 缩小 · Pinch to zoom'], ['双指拖动', '平移 · Two fingers to pan'],
    ['轻点星团', '展开 / 收起 · Tap a cluster to open or fold it'], ['轻点星或卡片', '打开资料面板 · Tap a star or a card'], ['双击', '聚焦，其余变暗 · Double-tap to focus'],
    ['长按一颗星', '把它的卡片从光里取出来 · Long-press pulls its card out'], ['拖动一颗星', '挪动它 · Drag a star to move it']
  ].map(function (r) { return '<dt>' + r[0] + '</dt><dd>' + r[1] + '</dd>'; }).join('') + '</dl>';
  doc.body.appendChild(guide);
  help.onclick = function () { guide.classList.toggle('on'); doc.getElementById('settings').classList.remove('on'); };
  doc.getElementById('gear').addEventListener('click', function () { guide.classList.remove('on'); });
  HL.renderer.domElement.addEventListener('pointerdown', function () { guide.classList.remove('on'); });

  // boot log: a few typed lines while the projection rises
  var bootLog = mk('div', 'v2-bootlog'); doc.body.appendChild(bootLog);
  var BOOT = ['> POWER · 投影核心上电', '> CALIBRATING GIMBAL · 校准陀螺环', '> LOADING KNOWLEDGE GRAPH · 载入知识星图', '> HANDS ONLINE · 手势就绪'], bootShown = -1;
  function bootStep() {
    var b = HL.boot, k = b.state === 'booting' ? Math.min(BOOT.length - 1, Math.floor(b.t / b.dur * BOOT.length)) : -1;
    if (k === bootShown) return; bootShown = k;
    if (k < 0) { bootLog.classList.remove('on'); return; }
    bootLog.innerHTML = ''; for (var i = 0; i <= k; i++) { var l = mk('div', i === k ? 'now' : ''); l.textContent = BOOT[i]; bootLog.appendChild(l); } bootLog.classList.add('on');
  }
  // a ripple of light where a finger lands
  function ripple(x, y) { if (reduce()) return; var r = mk('i', 'v2-rip'); r.style.left = x + 'px'; r.style.top = y + 'px'; hud.appendChild(r); setTimeout(function () { r.remove(); }, 620); }
  // the data panel's title decodes itself into place
  var GLY = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#/<>+=', decT = 0;
  function decode(h) {
    var full = h.textContent, n = full.length, t0 = performance.now(), dur = Math.min(520, 160 + n * 22); cancelAnimationFrame(decT);
    (function step() {
      if (!h.isConnected) return; var k = (performance.now() - t0) / dur;
      if (k >= 1) { h.textContent = full; return; }
      var out = ''; for (var i = 0; i < n; i++) out += i < k * n || /\s/.test(full[i]) ? full[i] : GLY[(Math.random() * GLY.length) | 0];
      h.textContent = out; decT = requestAnimationFrame(step);
    })();
  }
  var detEl = doc.getElementById('detail'), lastTitle = null;
  new MutationObserver(function () {
    var h = detEl.querySelector('h3'), it = HL.detail.item; if (!h || !it) { lastTitle = null; return; }
    if (it === lastTitle || reduce()) return; lastTitle = it; decode(h);
  }).observe(detEl, { childList: true });

  // an edit saved from the data panel: 1.0 redraws the star's label, the cards showing that item follow
  var edited0 = S.onItemEdited;
  S.onItemEdited = function (it) {
    if (edited0) edited0.call(S, it);
    tags.forEach(function (t) { if (t.i >= 0 && S.nodes[t.i] && S.nodes[t.i].it === it) fillTag(t.el, S.nodes[t.i]); });
    peek._i = -1;
  };

  // 卡片 Cards chip, added to the constellation's own tool strip
  var tools0 = S.tools;
  S.tools = function (box) {
    if (tools0) tools0.call(S, box);
    HL.ui.sep(box);
    HL.ui.chip(box, '卡片', ui.cards, function () { ui.cards = !ui.cards; saveUi(); lastPlan = -1; HL.refreshTools(); }, '在星旁显示卡片 · Cards beside the stars');
  };
  /* 2.0 opens straight on the star map, so its first build happens (in HL.start) before workbench.js has loaded and the
     workbench never sees it: build once more now that it is there, or taps, levels and pulled cards would do nothing. */
  if (HL.active === S) { if (S.nodes.length && S.wb && S.wb.onBuild) S.build(true); HL.refreshTools(); }

  // which star the hand is on: the mouse hovering, or a finger pressing
  var hoverI = -1, pressI = -1, pressT = 0, cv = HL.renderer.domElement;
  cv.addEventListener('pointermove', function (e) { if (e.pointerType !== 'mouse' || e.buttons || !inStars()) { if (e.pointerType === 'mouse') hoverI = -1; return; } var h = S.pick(e.clientX, e.clientY); hoverI = h ? h.i : -1; });
  cv.addEventListener('pointerleave', function () { hoverI = -1; });
  cv.addEventListener('pointerdown', function (e) { if (HL.boot.state === 'on') ripple(e.clientX, e.clientY); if (!inStars()) return; var h = S.pick(e.clientX, e.clientY); pressI = h ? h.i : -1; pressT = performance.now(); hoverI = -1; });
  function release() { pressT = performance.now(); setTimeout(function () { if (performance.now() - pressT > 500) pressI = -1; }, 560); }
  cv.addEventListener('pointerup', release); cv.addEventListener('pointercancel', release);

  // cards hanging off the stars: the focused star's neighbours, or (卡片 on) the stars nearest the viewer
  var POOL = 8, tags = [], lastPlan = -1, planFocus = -2;
  for (var ti = 0; ti < POOL; ti++) {
    (function () {
      var e = mk('button', 'v2-tag', '<small></small><b></b><p></p>'); e.type = 'button'; hud.appendChild(e);
      var ln = doc.createElementNS('http://www.w3.org/2000/svg', 'line'); nbLines.appendChild(ln);
      var tg = { el: e, ln: ln, i: -1, uid: null, x: 0, y: 0, side: 1 };
      e.onclick = function () { var i = tg.i; if (i < 0 || !S.nodes[i] || S.nodes[i].uid !== tg.uid) return; guide.classList.remove('on'); S.setFocus(i); lastPlan = -1; };
      tags.push(tg);
    })();
  }
  function plan(now) {                            // choose which stars carry a card (a few times a second, not every frame)
    lastPlan = now; planFocus = S.focus;
    var want = [], n = S.nodes, max = HL.narrow ? 3 : 6, i;
    if (inStars() && HL.boot.state === 'on') {
      if (S.focus >= 0 && n[S.focus]) {
        var seen = {}; (n[S.focus].adj || []).forEach(function (j) { if (!seen[j] && n[j] && vis(j) > 0.5 && want.length < max) { seen[j] = 1; want.push(j); } });
      } else if (ui.cards) {
        var cand = [];
        for (i = 0; i < n.length; i++) { if (vis(i) < 0.6 || i === pressI) continue; var s = HL.screenOf(S.world(i)); if (s.behind || s.x < 150 || s.x > innerWidth - 150 || s.y < 110 || s.y > innerHeight - 190) continue; cand.push({ i: i, s: s, k: s.depth - (n[i].hub ? 0.5 : 0) - (tags.some(function (t) { return t.i === i; }) ? 0.6 : 0) }); }
        cand.sort(function (a, b) { return a.k - b.k; });
        var took = [];
        cand.forEach(function (c) { if (want.length >= max) return; if (took.some(function (o) { return Math.abs(o.x - c.s.x) < 210 && Math.abs(o.y - c.s.y) < 84; })) return; took.push(c.s); want.push(c.i); });
      }
    }
    tags.forEach(function (t) { if (t.i >= 0 && want.indexOf(t.i) < 0) { t.i = -1; t.el.classList.remove('on'); } });
    want.forEach(function (i) {
      if (tags.some(function (t) { return t.i === i; })) return;
      var t = tags.filter(function (t) { return t.i < 0; })[0]; if (!t) return;
      t.i = i; t.uid = n[i].uid; t.fresh = true; fillTag(t.el, n[i]);
    });
  }

  /* ───────────────────────── every frame ───────────────────────── */
  var last = performance.now(), starsK = 0, fps = 60, fAcc = 0, fN = 0, teleT = 0, hudOn = false;
  function fmt(v, w, d) { var s = Math.abs(v).toFixed(d); while (s.length < w) s = '0' + s; return (v < 0 ? '−' : '+') + s; }
  function tick(ms) {
    requestAnimationFrame(tick);
    var dt = clamp((ms - last) / 1000, 0, 0.05); last = ms; var t = HL.now, rd = reduce();
    var on = HL.boot.state === 'idle' ? 0 : U.uRise.value, br = HL.layout().settings.bright, st = inStars();
    starsK += ((st ? 1 : 0) - starsK) * (rd ? 1 : 0.07);
    var near = clamp((HL.cam.dist / HL.cam.homeDist - 0.5) / 0.4, 0.12, 1);   // moved in on a star: the cage steps back
    for (var i = 0; i < mats.length; i++) mats[i][0].opacity = mats[i][1] * on * br * (mats[i][2] ? starsK * near : 1) * U.uFlick.value;
    var sp = rd ? 0.15 : 1;
    rings.forEach(function (R, k) { R.spin.rotation.z += dt * R.w * 3 * sp; R.hold.rotation.z += dt * 0.02 * (k % 2 ? -1 : 1) * sp; });
    gimbal.scale.setScalar(0.6 + 0.4 * on);
    shell.rotation.y -= dt * 0.03 * sp;
    var ph = (t * 0.16) % 1, tri = ph < 0.5 ? ph * 2 : 2 - ph * 2; scan.position.y = C.y - 1.25 + 2.5 * tri; var sc = Math.sqrt(Math.max(0.05, 1 - Math.pow((tri - 0.5) * 2 * 0.78, 2))); scan.scale.set(sc, 1, sc); scan.visible = !rd;
    bands.forEach(function (b) { b.rotation.y += dt * b.userData.speed * sp; });
    dial.rotation.z += dt * 0.03 * sp; dial2.rotation.z -= dt * 0.05 * sp;
    if (spinV && S.root && st) { S.root.rotation.y += spinV * dt; spinV *= Math.exp(-dt * 1.9); if (Math.abs(spinV) < 0.02) spinV = 0; }

    // HUD
    bootStep();
    var show = HL.boot.state === 'on'; if (show !== hudOn) { hudOn = show; hud.classList.toggle('on', show); }
    fAcc += dt; fN++; if (fAcc > 0.5) { fps = fN / fAcc; fAcc = 0; fN = 0; }
    if (!show) return;
    teleT -= dt;
    if (teleT <= 0) {
      teleT = 0.12;
      var nv = 0, lv = 0; if (st) { for (i = 0; i < S.nodes.length; i++) if (vis(i) > 0.5) nv++; S.edges.forEach(function (e) { if (vis(e[0]) > 0.5 && vis(e[1]) > 0.5) lv++; }); }
      setText(K.n, ('000' + nv).slice(-3)); setText(K.l, ('000' + lv).slice(-3));
      var az = ((HL.cam.az - (S.root && st ? S.root.rotation.y : 0)) * 180 / Math.PI) % 360; if (az > 180) az -= 360; if (az < -180) az += 360;
      setText(K.az, fmt(az, 5, 1) + '°'); setText(K.el, fmt(HL.cam.el * 180 / Math.PI, 4, 1) + '°'); setText(K.z, HL.cam.dist.toFixed(2)); setText(K.fps, String(Math.round(fps)));
      setText(K.hd, 'MK II · ' + ((HL.active && HL.active.en) || 'CONSOLE'));
      var f = st && S.focus >= 0 && S.nodes[S.focus] ? S.nodes[S.focus] : null;
      setText(K.foc, f ? '◉ LOCK · ' + (f.it.title || '') : st ? '○ STANDBY · 点一颗星 tap a star' : '');
      for (i = 0; i < barEls.length; i++) barEls[i].style.height = (3 + 19 * Math.abs(Math.sin(t * 1.7 + i * 0.6) * Math.sin(t * 0.9 + i * 1.3))).toFixed(0) + 'px';
      ruleI.style.top = (clamp((HL.cam.dist - 2.4) / (HL.cam.homeDist * 1.6 - 2.4), 0, 1) * 100).toFixed(1) + '%';
    }
    if (ms - lastPlan > 450 || planFocus !== S.focus) plan(ms);

    // reticle: the pressed star, else the hovered one, else the one in focus
    var ri = st ? (pressI >= 0 ? pressI : hoverI >= 0 ? hoverI : S.focus) : -1, R0 = ri >= 0 && S.nodes[ri] && vis(ri) > 0.3 ? S.nodes[ri] : null, rs = null;
    if (R0) { rs = HL.screenOf(S.world(ri)); if (rs.behind) R0 = null; }
    ret.classList.toggle('on', !!R0);
    if (R0) { var k = clamp((R0.hub ? 0.34 : 0.22) * rs.ppu / 42, 0.5, 1.5); ret.style.transform = 'translate(' + rs.x.toFixed(1) + 'px,' + rs.y.toFixed(1) + 'px) scale(' + k.toFixed(2) + ')'; ret.classList.toggle('lock', ri === S.focus || ri === pressI); }
    // peek card while hovering (mouse)
    var pk = R0 && ri === hoverI && ri !== S.focus && !tags.some(function (tg) { return tg.i === ri; });
    if (pk) { if (peek._i !== ri) { peek._i = ri; fillTag(peek, R0); } var px = rs.x + 46, py = rs.y - 24; if (px + 220 > innerWidth) px = rs.x - 46 - 210; peek.style.transform = 'translate(' + px.toFixed(0) + 'px,' + py.toFixed(0) + 'px)'; }
    peek.classList.toggle('on', !!pk);

    // cards + their leader lines
    var det = doc.getElementById('detail'), detOn = det.classList.contains('on'), dr = detOn ? det.getBoundingClientRect() : null, fs = null;
    if (st && S.focus >= 0 && S.nodes[S.focus]) { fs = HL.screenOf(S.world(S.focus)); if (fs.behind) fs = null; }
    var W = HL.narrow ? 132 : 176, placed = [];
    tags.forEach(function (tg) {
      var N0 = tg.i >= 0 ? S.nodes[tg.i] : null;
      if (!N0 || N0.uid !== tg.uid || !st) { if (tg.i >= 0) { tg.i = -1; tg.el.classList.remove('on'); } tg.ln.setAttribute('opacity', 0); return; }
      var s = HL.screenOf(S.world(tg.i)), ok = !s.behind && vis(tg.i) > 0.4 && s.x > -40 && s.x < innerWidth + 40 && s.y > 40 && s.y < innerHeight - 40;
      var side = fs ? (s.x >= fs.x ? 1 : -1) : 1, x = side > 0 ? s.x + 18 : s.x - 18 - W, y = s.y - 74;
      if (dr && x + W > dr.left - 8 && y < dr.bottom && y + 60 > dr.top) { x = Math.min(x, dr.left - 12 - W); if (x < s.x && x + W > s.x - 16) x = s.x - 22 - W; }
      x = clamp(x, 8, innerWidth - W - 8); y = clamp(y, 54, innerHeight - 190);
      for (var g = 0; g < 6; g++) { var hit = null; placed.forEach(function (p) { if (!hit && Math.abs(p.x - x) < W + 8 && Math.abs(p.y - y) < 62) hit = p; }); if (!hit) break; y = hit.y - 64; }
      y = Math.max(y, 54);
      placed.push({ x: x, y: y });
      if (tg.fresh || rd) { tg.x = x; tg.y = y; tg.fresh = false; } else { tg.x += (x - tg.x) * 0.35; tg.y += (y - tg.y) * 0.35; }
      tg.el.style.transform = 'translate(' + tg.x.toFixed(1) + 'px,' + tg.y.toFixed(1) + 'px)'; tg.el.classList.toggle('on', ok);
      var ex = tg.x + W / 2 < s.x ? tg.x + W : tg.x, ey = clamp(s.y, tg.y + 6, tg.y + tg.el.offsetHeight - 1);
      tg.ln.setAttribute('x1', s.x.toFixed(1)); tg.ln.setAttribute('y1', s.y.toFixed(1)); tg.ln.setAttribute('x2', ex.toFixed(1)); tg.ln.setAttribute('y2', ey.toFixed(1)); tg.ln.setAttribute('opacity', ok ? 1 : 0);
    });
    if (fs && dr && dr.left > fs.x + 30) { var ly = clamp(fs.y, dr.top + 24, dr.bottom - 24), mx = Math.max(fs.x + 24, dr.left - 46); lead.setAttribute('points', (fs.x + 12).toFixed(1) + ',' + fs.y.toFixed(1) + ' ' + mx.toFixed(1) + ',' + ly.toFixed(1) + ' ' + dr.left.toFixed(1) + ',' + ly.toFixed(1)); lead.style.display = ''; }
    else lead.style.display = 'none';
  }
  requestAnimationFrame(tick);
  window.HoloV2 = { rig: rig, ui: ui, tags: tags, spin: function (v) { spinV = v; } };
})();
