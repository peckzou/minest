/* Minest · 全息操作台 2.0 · HOLO PROJECTOR — any 2D interactive model (philosophy/models/*.html), live, as a hologram.
   The model keeps running in a hidden same-origin frame; its canvas is the texture of a curved light screen floating in the
   projection volume (light backgrounds are turned inside out so only the drawing glows). Pointer rays that hit the screen
   are handed to the model as pointer events at the matching pixel, so every drag / press / hold works as in the original;
   dragging beside the screen turns the camera. The model's own stage tabs and buttons become the tool strip, and its
   steps and quotations are mirrored into the side panel (with the next step to try on top).
   Opened by {holo:1, op:'proj', file, title, note} from the embedding page, HL.proj.open(file, title) or ?proj=file. */
(function () {
  'use strict';
  var HL = window.HL, T = window.THREE; if (!HL || !T) return;
  var M = { id: 'proj', zh: '全息投影', en: 'HOLO PROJECTION' };
  var want = null, cur = null, frame = null, doc = null, cv = null, tex = null, root = null, screen = null, ghost = null, mirror = null, own = [], panel = null;
  var sig = '', pollT = 0, lumT = 0, lastToast = '', fwd = null, probe = document.createElement('canvas'), kind = '';
  probe.width = probe.height = 16;
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function keep(x) { own.push(x); return x; }
  var W = 5.3, RC = 7.5;

  var VS = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';
  var FS = 'uniform sampler2D map; uniform float uInv; uniform float uGain; uniform float uTime; uniform float uOn; varying vec2 vUv;' +
    'void main(){ vec3 c = texture2D(map, vUv).rgb; float mx = max(c.r, max(c.g, c.b)); float mn = min(c.r, min(c.g, c.b)); vec3 inv = clamp(c + (1.0 - mx - mn), 0.0, 1.0); c = mix(c, inv, uInv);' +
    ' float scan = 0.9 + 0.1 * sin(vUv.y * 620.0 - uTime * 2.4); float edge = smoothstep(0.0, 0.012, vUv.x) * smoothstep(1.0, 0.988, vUv.x) * smoothstep(0.0, 0.016, vUv.y) * smoothstep(1.0, 0.984, vUv.y);' +
    ' float open = smoothstep(0.0, 1.0, uOn * 1.25 - abs(vUv.y - 0.5) * 0.5); gl_FragColor = vec4((c + vec3(0.006, 0.02, 0.034)) * scan * edge * uGain * open, 1.0); }';
  function bent(w, h) {
    var g = new T.PlaneGeometry(w, h, 40, 1), p = g.attributes.position;
    for (var i = 0; i < p.count; i++) { var a = p.getX(i) / RC; p.setX(i, Math.sin(a) * RC); p.setZ(i, RC - Math.cos(a) * RC); }
    p.needsUpdate = true; return keep(g);
  }
  function mat(gain) { return keep(new T.ShaderMaterial({ uniforms: { map: { value: tex }, uInv: { value: 0 }, uGain: { value: gain }, uTime: HL.U.uTime, uOn: { value: 0 } }, vertexShader: VS, fragmentShader: FS, transparent: true, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide })); }

  function buildScreen() {
    clearScreen();
    var h = W * cv.height / cv.width; h = Math.min(h, 3.0); var w = h * cv.width / cv.height;
    tex = keep(new T.CanvasTexture(cv)); tex.minFilter = T.LinearFilter; tex.magFilter = T.LinearFilter; tex.generateMipmaps = false;
    root = new T.Group(); root.position.set(0, HL.CENTER.y + 0.12, 0); HL.contentRoot.add(root);
    var g = bent(w, h);
    screen = new T.Mesh(g, mat(1.45)); root.add(screen);
    ghost = new T.Mesh(g, mat(0.22)); ghost.position.z = -0.16; ghost.scale.setScalar(1.035); root.add(ghost);
    mirror = new T.Mesh(g, mat(0.1)); mirror.scale.y = -0.5; mirror.position.y = -h * 0.76; root.add(mirror);
    var lm = keep(new T.LineBasicMaterial({ color: 0x8fe9ff, transparent: true, opacity: 0.85, blending: T.AdditiveBlending, depthWrite: false })), pts = [], c = 0.22;
    [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(function (k) {
      var x = k[0] * w / 2, y = k[1] * h / 2, P = function (px, py) { var a = px / RC; return new T.Vector3(Math.sin(a) * RC, py, RC - Math.cos(a) * RC + 0.01); };
      pts.push(P(x, y), P(x - k[0] * c, y), P(x, y), P(x, y - k[1] * c));
      pts.push(P(x, k[1] < 0 ? y : y), new T.Vector3(0, -(HL.CENTER.y + 0.12) + 1.0, 0));
    });
    var beams = new T.LineSegments(keep(new T.BufferGeometry().setFromPoints(pts.filter(function (_, i) { return i % 6 < 4; }))), lm); root.add(beams);
    var bm = keep(new T.LineBasicMaterial({ color: 0x46d2ff, transparent: true, opacity: 0.16, blending: T.AdditiveBlending, depthWrite: false }));
    root.add(new T.LineSegments(keep(new T.BufferGeometry().setFromPoints(pts.filter(function (_, i) { return i % 6 >= 4 && Math.floor(i / 6) < 2; }))), bm));
    screen.userData = { w: w, h: h };
  }
  function clearScreen() { if (root) HL.contentRoot.remove(root); root = screen = ghost = mirror = null; own.forEach(function (x) { try { x.dispose(); } catch (e) {} }); own = []; tex = null; }

  /* ───────────── the hidden model frame ───────────── */
  function topBar() { return kind === 'lab' ? doc.getElementById('root').firstElementChild.children[0] : doc.getElementById('tabs'); }
  function sideEl() { return kind === 'lab' ? doc.getElementById('root').firstElementChild.children[2] : doc.getElementById('side'); }
  function prepare() {
    doc = frame.contentDocument; cv = doc && doc.querySelector('canvas');
    if (!cv) return false;
    kind = doc.getElementById('tabs') && doc.getElementById('side') ? 'page' : 'lab';
    if (kind === 'lab') { var wrap = doc.getElementById('root') && doc.getElementById('root').firstElementChild; if (!wrap || wrap.children.length < 3 || !wrap.children[1].contains(cv)) return false; }
    var st = doc.createElement('style');
    st.textContent = kind === 'page' ? '#tabs,#side,#toast,a[href="index.html"]{display:none!important}#cv{top:0!important;height:100%!important}'
      : '#root>div>div:nth-child(1),#root>div>div:nth-child(3){display:none!important}#root>div>div:nth-child(2)>div{opacity:0!important}';
    doc.head.appendChild(st);
    cv.setPointerCapture = function () {}; cv.releasePointerCapture = function () {};
    try { frame.contentWindow.dispatchEvent(new Event('resize')); } catch (e) {}
    return true;
  }
  function buttons() {
    var bar = topBar(); if (!bar) return [];
    return Array.prototype.filter.call(bar.querySelectorAll('button'), function (b) { return !/总目录|收起原文|展开原文/.test(b.textContent); });
  }
  function readSide() {
    var s = sideEl(), o = { title: '', core: '', bound: '', rows: [] }; if (!s) return o;
    if (kind === 'page') {
      o.title = (doc.getElementById('sTitle') || {}).textContent || '';
      Array.prototype.forEach.call(s.querySelectorAll('.mr'), function (r) {
        var op = r.querySelector('.op'), tx = r.querySelector('.tx'), en = r.querySelector('.en'), ref = r.querySelector('.ref');
        var zh = tx ? (tx.firstChild && tx.firstChild.nodeType === 3 ? tx.firstChild.textContent : tx.textContent) : '';
        o.rows.push({ on: r.classList.contains('on'), op: op ? op.textContent.replace(/^\d+/, '') : '', zh: zh.replace(/^「|」$/g, ''), en: en ? en.textContent : '', ref: ref ? ref.textContent : '' });
      });
    } else {
      o.title = s.children[0] ? s.children[0].textContent : '';
      Array.prototype.forEach.call(s.children, function (c) { var t = c.textContent; if (/^核心问题/.test(t)) o.core = t.replace(/^核心问题[：:]\s*/, ''); if (/^适用边界/.test(t)) o.bound = t.replace(/^适用边界[：:]\s*/, ''); });
      Array.prototype.forEach.call(s.querySelectorAll('[id^="mr_"]'), function (r) {
        var a = r.children[0], b = r.children[1] || { children: [] };
        o.rows.push({ on: /opacity-100/.test(r.className), op: a ? a.textContent.replace(/^\d+/, '') : '', zh: (b.children[0] ? b.children[0].textContent : '').replace(/^「|」$/g, ''), en: b.children[1] ? b.children[1].textContent : '', ref: b.children[2] ? b.children[2].textContent : '' });
      });
    }
    return o;
  }
  function drawPanel(o) {
    if (!panel) return;
    var n = o.rows.filter(function (r) { return r.on; }).length, next = -1;
    for (var i = 0; i < o.rows.length; i++) if (!o.rows[i].on) { next = i; break; }
    var parts = o.title.split(/\s*·\s*/), head = parts.shift();
    panel.innerHTML = '<header><i>' + n + ' / ' + o.rows.length + ' 条原文 ▾</i><b>' + esc(head) + '</b><span>' + esc(parts.join(' · ')) + '</span></header><div class="rows">' +
      (o.core ? '<div class="note q"><em>核心问题</em>' + esc(o.core) + '</div>' : '') +
      (next >= 0 ? '<div class="note next"><em>下一步试试</em>' + esc(o.rows[next].op) + '</div>' : (o.rows.length ? '<div class="note ok"><em>✓ 这一关完成</em>每一步对应的原文都点亮了，可以换下一关。</div>' : '')) +
      o.rows.map(function (q, k) { return '<div class="row' + (q.on ? ' on' : '') + '"><div class="op"><em>' + (k + 1) + '</em>' + esc(q.op) + '</div><div class="zh">「' + esc(q.zh) + '」</div><div class="en">' + esc(q.en) + '</div><div class="ref">' + esc(q.ref) + '</div></div>'; }).join('') +
      (o.bound ? '<div class="note b"><em>适用边界</em>' + esc(o.bound) + '</div>' : '') + (cur.note ? '<div class="note b"><em>说明</em>' + esc(cur.note) + '</div>' : '') + '</div>';
    panel.querySelector('header').onclick = function () { panel.classList.toggle('min'); };
  }
  function poll() {
    if (!doc || !cv) return;
    var o = readSide(), bs = buttons(), s = o.title + '|' + o.rows.map(function (r) { return r.on ? 1 : 0; }).join('') + '|' + bs.map(function (b) { return b.textContent + (active(b) ? '*' : ''); }).join(',');
    if (s !== sig) { var first = !sig; sig = s; drawPanel(o); HL.refreshTools(); if (!first && o.rows.length && o.rows.every(function (r) { return r.on; })) HL.toast('✓ 这一关的原文全部点亮', 2200); }
    var t = kind === 'page' ? doc.getElementById('toast') : cv.parentElement.querySelector('div');
    var tx = t ? t.textContent.trim() : ''; if (tx && tx !== lastToast && (kind !== 'page' || t.style.opacity !== '0')) HL.toast(tx, 2600); lastToast = tx;
    if (kind === 'lab') { var cap = cv.parentElement.nextElementSibling; }
  }
  function active(b) { return b.classList.contains('on') || /f3a52b/i.test(b.className); }

  /* ───────────── the mode ───────────── */
  function css() {
    if (HL.sims && HL.sims.css) HL.sims.css();
    if (document.getElementById('projCss')) return;
    var s = document.createElement('style'); s.id = 'projCss';
    s.textContent = '#projFrame{position:fixed;left:0;top:0;width:1180px;height:720px;border:0;z-index:-1;pointer-events:none}' +
      '#simPanel .note{margin-top:6px;padding:7px 9px;border-radius:10px;font-size:12px;line-height:1.55;color:#eaf8ff;border:1px solid rgba(120,214,255,.25);background:rgba(70,210,255,.07)}' +
      '#simPanel .note em{display:block;font-style:normal;font-size:10.5px;font-weight:800;letter-spacing:1px;color:#6fe3ff;margin-bottom:2px}' +
      '#simPanel .note.next{border-color:rgba(255,180,84,.75);background:rgba(255,180,84,.12)}#simPanel .note.next em{color:#ffb454}' +
      '#simPanel .note.ok{border-color:rgba(125,255,176,.6);background:rgba(125,255,176,.08)}#simPanel .note.ok em{color:#7dffb0}#simPanel .note.b{opacity:.8}';
    document.head.appendChild(s);
  }
  function title(on) { var e = document.getElementById('v2Title'); if (!e) return; if (!M.t0) M.t0 = e.textContent; e.textContent = on && cur ? '全息投影 · ' + cur.title : M.t0; }
  M.enter = function () {
    if (want) { cur = want; want = null; }
    if (!cur) { setTimeout(function () { HL.setMode('stars'); }, 0); return; }
    HL.wantMode = null; css(); title(true); HL.empty(''); sig = ''; lastToast = ''; cv = doc = null; fwd = null;
    panel = document.createElement('div'); panel.id = 'simPanel'; panel.className = 'glass';
    panel.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
    panel.innerHTML = '<header><b>' + esc(cur.title) + '</b><span>正在把模型投影出来…</span></header>'; document.body.appendChild(panel);
    frame = document.createElement('iframe'); frame.id = 'projFrame'; frame.setAttribute('tabindex', '-1'); frame.src = '../philosophy/models/' + cur.file; document.body.appendChild(frame);
    HL.home(); HL.cam.g.el = 0.1; HL.cam.g.az = 0; HL.cam.g.dist = HL.cam.homeDist * (HL.narrow ? 1.0 : 0.8); HL.cam.g.tgt.set(HL.narrow ? 0 : 0.75, HL.CENTER.y + 0.05, 0);
    HL.info('模型在光幕上实时运行：直接在光幕上拖动、按住、点击 · 拖动光幕外的空白处可以转动视角');
  };
  M.exit = function () { title(false); clearScreen(); if (frame) frame.remove(); if (panel) panel.remove(); frame = panel = doc = cv = null; cur = null; HL.info(''); HL.home(); };
  M.onContent = function () {};
  M.update = function (dt, t) {
    if (!frame) return;
    if (!cv) { if (prepare()) { setTimeout(function () { if (cv) buildScreen(); }, 350); } return; }
    if (!screen) return;
    if (tex.image.width !== cv.width || tex.image.height !== cv.height) { buildScreen(); }
    tex.needsUpdate = true;
    var on = Math.min(1, screen.material.uniforms.uOn.value + dt * 1.6);
    lumT -= dt;
    if (lumT <= 0) { lumT = 0.7; try { var x = probe.getContext('2d'); x.drawImage(cv, 0, 0, 16, 16); var d = x.getImageData(0, 0, 16, 16).data, sum = 0; for (var i = 0; i < d.length; i += 4) sum += d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11; M.inv = sum / 256 / 255 > 0.42 ? 1 : 0; } catch (e) {} }
    [screen, ghost, mirror].forEach(function (m) { var u = m.material.uniforms; u.uOn.value = on; u.uInv.value += ((M.inv || 0) - u.uInv.value) * Math.min(1, dt * 5); });
    root.position.y = HL.CENTER.y + 0.12 + Math.sin(t * 0.7) * 0.012;
    pollT -= dt; if (pollT <= 0) { pollT = 0.3; poll(); }
  };
  function at(x, y) {
    if (!screen) return null;
    var hit = HL.rayAt(x, y).intersectObject(screen, false)[0]; if (!hit || !hit.uv) return null;
    var r = cv.getBoundingClientRect(); return { x: r.left + hit.uv.x * r.width, y: r.top + (1 - hit.uv.y) * r.height };
  }
  function fire(type, p, e) {
    var init = { bubbles: true, cancelable: true, composed: true, clientX: p.x, clientY: p.y, screenX: p.x, screenY: p.y, pointerId: 1, pointerType: e && e.pointerType === 'touch' ? 'touch' : 'mouse', isPrimary: true, button: type === 'pointermove' ? -1 : 0, buttons: type === 'pointerup' || type === 'pointercancel' ? 0 : 1, pressure: type === 'pointerup' ? 0 : 0.5, view: frame.contentWindow };
    try { cv.dispatchEvent(new frame.contentWindow.PointerEvent(type, init)); } catch (er) {}
    var mt = { pointerdown: 'mousedown', pointermove: 'mousemove', pointerup: 'mouseup' }[type];
    if (mt) { try { cv.dispatchEvent(new frame.contentWindow.MouseEvent(mt, init)); } catch (er) {} }
  }
  M.pick = function (x, y) { return at(x, y) ? { screen: true } : null; };
  M.emptyDrag = function () { return !!fwd; };
  M.tap = function () {};
  var canvas = HL.renderer.domElement;
  canvas.addEventListener('pointerdown', function (e) { if (HL.active !== M || !cv) return; var p = at(e.clientX, e.clientY); if (!p) { fwd = null; return; } fwd = { p: p }; fire('pointerdown', p, e); });
  canvas.addEventListener('pointermove', function (e) { if (HL.active !== M || !cv) return; var p = at(e.clientX, e.clientY); if (fwd) { if (p) fwd.p = p; fire('pointermove', fwd.p, e); } else if (p && !e.buttons) fire('pointermove', p, e); });
  function end(e) { if (!fwd) return; var p = fwd.p; fwd = null; if (HL.active === M && cv) { fire('pointerup', p, e); try { cv.dispatchEvent(new frame.contentWindow.MouseEvent('click', { bubbles: true, clientX: p.x, clientY: p.y, view: frame.contentWindow })); } catch (er) {} } }
  addEventListener('pointerup', end); addEventListener('pointercancel', end);
  M.tools = function (box) {
    if (!cur) return;
    if (doc && cv) buttons().forEach(function (b) { var t = b.textContent.trim(); HL.ui.chip(box, t.length > 14 ? t.slice(0, 13) + '…' : t, active(b), function () { b.click(); sig = ''; pollT = 0; }, t); });
    HL.ui.sep(box);
    if (HL.EMBED && !cur.only) HL.ui.chip(box, '▦ 2D 原版', false, function () { HL.post({ holo: 1, op: 'sim-2d', file: cur.file }); }, '打开这个模型的二维原版');
    HL.ui.chip(box, '✕ 退出模型', false, function () { HL.setMode('stars'); }, '回到知识星图');
  };
  HL.modes.proj = M;

  HL.proj = {
    open: function (file, ttl, note) {
      if (!/^[\w.-]+\.html$/.test(file || '')) return false;
      want = { file: file, title: ttl || file.replace(/^minest_|\.html$/g, ''), note: note || '' };
      var run = function () { if (HL.boot.state === 'idle') HL.startBoot(); HL.detail.close(); HL.setMode('proj', true); };
      if (HL.contentReady) run(); else { var n = 0, iv = setInterval(function () { if (HL.contentReady || ++n > 60) { clearInterval(iv); if (HL.contentReady) run(); } }, 100); }
      return true;
    }
  };
  addEventListener('message', function (e) {
    var m = e.data; if (!HL.EMBED || e.source !== window.parent || !m || typeof m !== 'object' || m.holo !== 1) return;
    if (m.op === 'proj' && typeof m.file === 'string') HL.proj.open(m.file, String(m.title || ''), String(m.note || ''));
  });
  HL.projFromQuery = function () { var q = location.search.match(/[?&]proj=([\w.-]+\.html)/); if (q) HL.proj.open(q[1]); };
})();
