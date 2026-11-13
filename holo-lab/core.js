/* Minest · 全息文字操作台 Holographic Typography Lab — core
   An original holographic workstation: a metal-and-glass console projecting a blue light volume in which the user's
   own words, cards, Anchor Charts and 3D Type works float as manipulable 3D text.
   This file: renderer + console + projection, camera, pointer/touch input, data protocol with the parent page
   ({holo:1, …}), layout persistence, the detail sheet, settings and the frame loop. The four modes live in modes.js.
   three.js r128 UMD (global THREE), no build step. */
(function () {
  'use strict';
  var T = THREE;
  var HL = window.HL = { modes: {}, modeOrder: [] };

  /* ───────────────────────── utilities ───────────────────────── */
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function ease(t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }
  function easeOut(t) { t = clamp(t, 0, 1); return 1 - Math.pow(1 - t, 3); }
  function rng(seed) { var s = seed >>> 0; return function () { s = (s + 0x6D2B79F5) >>> 0; var t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function hash(s) { s = String(s); var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function str(v, n) { v = v == null ? '' : String(v); v = v.replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/[ \t]+/g, ' ').trim(); return n && v.length > n ? v.slice(0, n - 1) + '…' : v; }
  function arr(v) { return Array.isArray(v) ? v : []; }
  function hexOk(h) { return /^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(String(h || '')) ? h : null; }
  function el(id) { return document.getElementById(id); }
  HL.u = { clamp: clamp, lerp: lerp, ease: ease, easeOut: easeOut, rng: rng, hash: hash, str: str };
  var EMBED = (function () { try { return window.parent !== window; } catch (e) { return true; } })();
  var DEBUG = /[?&]debug=1/.test(location.search);
  HL.EMBED = EMBED;
  var FONT = '-apple-system, "PingFang SC", "Hiragino Sans GB", "Noto Sans CJK SC", "Helvetica Neue", Arial, sans-serif';
  HL.FONT = FONT;
  var OS_REDUCE = false; try { OS_REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  /* ───────────────────────── layout (persisted) ───────────────────────── */
  var LS_KEY = 'minest.holoLab.v1';
  function defLayout() {
    return { v: 1, mode: 'panels', settings: { bright: 1, scan: true, reduce: OS_REDUCE },
      panels: { src: 'all', arrange: 'grid', order: [], free: {}, rot: {}, page: 0 },
      dis: { word: null, level: 'letters' }, rings: { assign: {}, page: 0 }, stars: {} };
  }
  function cleanLayout(L) {
    var d = defLayout(); if (!L || typeof L !== 'object') return d;
    if (HL.modes[L.mode] || /^(panels|dis|stars|rings)$/.test(L.mode)) d.mode = L.mode;
    var s = L.settings || {};
    if (typeof s.bright === 'number') d.settings.bright = clamp(s.bright, 0.5, 1.5);
    if (typeof s.scan === 'boolean') d.settings.scan = s.scan;
    if (typeof s.reduce === 'boolean') d.settings.reduce = s.reduce;
    var p = L.panels || {};
    if (/^(all|words|charts|knowledge|works)$/.test(p.src)) d.panels.src = p.src;
    if (/^(grid|arc|stack|free)$/.test(p.arrange)) d.panels.arrange = p.arrange;
    d.panels.order = arr(p.order).filter(function (x) { return typeof x === 'string'; }).slice(0, 2000);
    if (p.free && typeof p.free === 'object') Object.keys(p.free).slice(0, 400).forEach(function (k) { var v = p.free[k]; if (Array.isArray(v) && v.length === 3 && v.every(isFinite)) d.panels.free[k] = v.map(Number); });
    if (p.rot && typeof p.rot === 'object') Object.keys(p.rot).slice(0, 400).forEach(function (k) { if (isFinite(p.rot[k])) d.panels.rot[k] = Number(p.rot[k]); });
    d.panels.page = Math.max(0, p.page | 0);
    var ds = L.dis || {}; if (typeof ds.word === 'string') d.dis.word = ds.word; if (/^(chunks|letters|strokes)$/.test(ds.level)) d.dis.level = ds.level;
    var r = L.rings || {}; if (r.assign && typeof r.assign === 'object') Object.keys(r.assign).slice(0, 2000).forEach(function (k) { if (typeof r.assign[k] === 'string') d.rings.assign[k] = r.assign[k]; });
    d.rings.page = Math.max(0, r.page | 0);
    return d;
  }
  var layout = defLayout();
  try { var ls = localStorage.getItem(LS_KEY); if (ls) layout = cleanLayout(JSON.parse(ls)); } catch (e) {}
  HL.layout = function () { return layout; };
  var saveT = 0, lastSave = 0;
  function saveNow() {
    clearTimeout(saveT); saveT = 0; lastSave = performance.now();
    try { localStorage.setItem(LS_KEY, JSON.stringify(layout)); } catch (e) {}
    post({ holo: 1, op: 'save', layout: JSON.parse(JSON.stringify(layout)) });
  }
  HL.save = function () {                       // debounced: settles 400 ms after the last change, at most once a second
    if (saveT) clearTimeout(saveT);
    var wait = Math.max(400, 1000 - (performance.now() - lastSave));
    saveT = setTimeout(saveNow, wait);
  };
  addEventListener('pagehide', function () { if (saveT) saveNow(); });

  /* ───────────────────────── messaging ───────────────────────── */
  function post(msg) { if (!EMBED) return; try { window.parent.postMessage(msg, '*'); } catch (e) {} }
  HL.post = post;

  /* ───────────────────────── toast / info / empty ───────────────────────── */
  var toastT = 0;
  HL.toast = function (msg, ms) { var t = el('toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove('on'); }, ms || 2400); };
  HL.info = function (msg) { var i = el('info'); if (!msg) { i.classList.remove('on'); return; } i.textContent = msg; i.classList.add('on'); placeInfo(); };
  function placeInfo() { var d = el('dock').getBoundingClientRect(); el('info').style.bottom = (innerHeight - d.top + 8) + 'px'; }
  HL.empty = function (t, s) { var e = el('empty'); if (!t) { e.classList.remove('on'); return; } el('emptyT').textContent = t; el('emptyS').textContent = s || ''; e.classList.add('on'); };

  /* ───────────────────────── renderer / scene / camera ───────────────────────── */
  var canvas = el('c');
  var renderer = new T.WebGLRenderer({ canvas: canvas, antialias: true, powerPreference: 'high-performance' });
  var MAXPR = Math.min(2, window.devicePixelRatio || 1), pr = MAXPR;
  renderer.setPixelRatio(pr);
  renderer.setClearColor(0x02060d, 1);
  var scene = new T.Scene();
  var camera = new T.PerspectiveCamera(50, 1, 0.05, 80);
  HL.renderer = renderer; HL.scene = scene; HL.camera = camera;
  var U = HL.U = { uTime: { value: 0 }, uBright: { value: 1 }, uScan: { value: 1 }, uFlick: { value: 1 }, uRise: { value: 0 }, uBoot: { value: 0 } };
  HL.CENTER = new T.Vector3(0, 2.3, 0);           // middle of the projection volume
  HL.narrow = false;

  /* environment for the metal / glass: a tiny studio baked into a PMREM once */
  (function () {
    try {
      var es = new T.Scene(), bg = new T.Mesh(new T.BoxGeometry(20, 20, 20), new T.MeshBasicMaterial({ color: 0x050b14, side: T.BackSide })); es.add(bg);
      function box(c, w, h, x, y, z, ry) { var m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ color: c, side: T.DoubleSide })); m.position.set(x, y, z); m.lookAt(0, 0, 0); if (ry) m.rotation.z = ry; es.add(m); }
      box(0xcfe8ff, 10, 1.2, 0, 9, 0); box(0x48c8ff, 1.0, 8, -9, 1, 2); box(0x48c8ff, 1.0, 8, 9, 1, -2); box(0x9fb4c8, 8, 2, 0, 2, -9.5); box(0x183048, 14, 3, 0, -2, 9.5);
      var pm = new T.PMREMGenerator(renderer); scene.environment = pm.fromScene(es, 0.03).texture; pm.dispose();
    } catch (e) {}
  })();
  scene.add(new T.HemisphereLight(0x9cc8ff, 0x0a1220, 0.55));
  var key = new T.DirectionalLight(0xdfefff, 0.6); key.position.set(3, 6, 5); scene.add(key);
  var holoLight = new T.PointLight(0x46d2ff, 0, 7, 2); holoLight.position.set(0, 1.4, 0); scene.add(holoLight);

  /* ───────────────────────── camera rig ───────────────────────── */
  var cam = { az: 0, el: 0.14, dist: 7, tgt: new T.Vector3().copy(HL.CENTER), g: { az: 0, el: 0.14, dist: 7, tgt: new T.Vector3().copy(HL.CENTER) }, homeDist: 7 };
  HL.cam = cam;
  function limits() { cam.g.az = clamp(cam.g.az, -0.85, 0.85); cam.g.el = clamp(cam.g.el, -0.08, 0.62); cam.g.dist = clamp(cam.g.dist, 2.4, cam.homeDist * 1.6); cam.g.tgt.x = clamp(cam.g.tgt.x, -2.6, 2.6); cam.g.tgt.y = clamp(cam.g.tgt.y, 1.0, 3.6); cam.g.tgt.z = clamp(cam.g.tgt.z, -2.4, 2.4); }
  HL.focus = function (p, dist) { cam.g.tgt.copy(p); cam.g.dist = dist || cam.homeDist * 0.55; limits(); };
  HL.home = function () { cam.g.tgt.copy(HL.CENTER); cam.g.dist = cam.homeDist; cam.g.az = clamp(cam.g.az, -0.35, 0.35); cam.g.el = 0.14; };
  function camStep(dt) {
    var k = 1 - Math.exp(-dt * (layout.settings.reduce ? 12 : 6));
    cam.az = lerp(cam.az, cam.g.az, k); cam.el = lerp(cam.el, cam.g.el, k); cam.dist = lerp(cam.dist, cam.g.dist, k); cam.tgt.lerp(cam.g.tgt, k);
    var ce = Math.cos(cam.el);
    camera.position.set(cam.tgt.x + cam.dist * Math.sin(cam.az) * ce, cam.tgt.y + cam.dist * Math.sin(cam.el), cam.tgt.z + cam.dist * Math.cos(cam.az) * ce);
    camera.lookAt(cam.tgt);
  }
  function resize() {
    var w = innerWidth, h = innerHeight; renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.fov = w < h ? 56 : 48; camera.updateProjectionMatrix();
    HL.narrow = w / h < 0.85;
    var need = HL.narrow ? 3.7 : 5.8, hf = Math.atan(Math.tan(camera.fov * Math.PI / 360) * camera.aspect);
    var vneed = 3.4 / 2 / Math.tan(camera.fov * Math.PI / 360);
    var old = cam.homeDist; cam.homeDist = Math.max(need / 2 / Math.tan(hf), vneed, 5.2);
    cam.g.dist *= cam.homeDist / old; if (!cam.inited) { cam.dist = cam.g.dist; cam.inited = true; }
    limits(); placeInfo();
    if (HL.active && HL.active.resize) HL.active.resize();
  }
  HL.resize = resize;

  /* screen helpers */
  var _v = new T.Vector3();
  HL.screenOf = function (p) {                  // world → css px, depth and px-per-unit at that depth
    _v.copy(p).project(camera);
    var x = (_v.x + 1) / 2 * innerWidth, y = (1 - _v.y) / 2 * innerHeight;
    var depth = camera.position.distanceTo(p);
    var ppu = innerHeight / (2 * depth * Math.tan(camera.fov * Math.PI / 360));
    return { x: x, y: y, depth: depth, ppu: ppu, behind: _v.z > 1 };
  };
  var ray = new T.Raycaster(), ndc = new T.Vector2();
  HL.rayAt = function (px, py) { ndc.set(px / innerWidth * 2 - 1, -(py / innerHeight) * 2 + 1); ray.setFromCamera(ndc, camera); return ray; };
  /* drag on a plane facing the camera through a point */
  HL.dragPlane = function (point, px, py) {
    var n = new T.Vector3(); camera.getWorldDirection(n);
    var plane = new T.Plane().setFromNormalAndCoplanarPoint(n, point), hit = new T.Vector3(), off = new T.Vector3();
    if (HL.rayAt(px, py).ray.intersectPlane(plane, hit)) off.subVectors(point, hit);
    return { to: function (x, y) { var h = new T.Vector3(); if (!HL.rayAt(x, y).ray.intersectPlane(plane, h)) return null; h.add(off);
      var r = Math.hypot(h.x, h.z), R = 3.3; if (r > R) { h.x *= R / r; h.z *= R / r; } h.y = clamp(h.y, 1.15, 3.9); return h; } };
  };

  /* ───────────────────────── shaders & text textures ───────────────────────── */
  var VS_STD = 'varying vec2 vUv; varying vec3 vN; varying vec3 vV;\nvoid main(){ vUv = uv; vec4 mv = modelViewMatrix * vec4(position,1.0); vV = mv.xyz; vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * mv; }';
  /** textured hologram panel: scanlines, flicker, edge glow, selection outline */
  HL.panelMat = function (tex, tint) {
    return new T.ShaderMaterial({
      uniforms: { map: { value: tex }, uTint: { value: new T.Color(tint || 0xffffff) }, uOpacity: { value: 1 }, uSel: { value: 0 }, uTime: U.uTime, uBright: U.uBright, uScan: U.uScan, uFlick: U.uFlick },
      vertexShader: VS_STD,
      fragmentShader: [
        'uniform sampler2D map; uniform vec3 uTint; uniform float uOpacity, uSel, uTime, uBright, uScan, uFlick;',
        'varying vec2 vUv; varying vec3 vN; varying vec3 vV;',
        'void main(){',
        '  vec4 c = texture2D(map, vUv);',
        '  float scan = mix(1.0, 0.84 + 0.16 * sin(gl_FragCoord.y * 1.25 - uTime * 5.0), uScan);',
        '  float band = mix(1.0, 1.0 + 0.25 * smoothstep(0.97, 1.0, sin(vUv.y * 3.0 - uTime * 1.7)), uScan);',
        '  float edge = 1.0 - abs(dot(normalize(vN), normalize(-vV)));',
        '  vec3 col = c.rgb * uTint * uBright * uFlick * scan * band + vec3(0.2, 0.65, 1.0) * edge * 0.3 * c.a;',
        '  vec2 d = min(vUv, 1.0 - vUv); float b = 1.0 - smoothstep(0.0, 0.025, min(d.x, d.y * 1.6));',
        '  col += vec3(0.55, 0.92, 1.0) * b * uSel * (0.8 + 0.2 * sin(uTime * 6.0));',
        '  gl_FragColor = vec4(col, max(c.a, b * uSel * 0.95) * uOpacity);',
        '}'].join('\n'),
      transparent: true, depthWrite: false, side: T.DoubleSide
    });
  };
  /** solid hologram (extruded letters): fresnel glow, additive */
  HL.solidMat = function (color) {
    return new T.ShaderMaterial({
      uniforms: { uColor: { value: new T.Color(color || 0x6fe3ff) }, uOpacity: { value: 1 }, uSel: { value: 0 }, uTime: U.uTime, uBright: U.uBright, uScan: U.uScan, uFlick: U.uFlick },
      vertexShader: 'varying vec3 vN; varying vec3 vV; varying float vY;\nvoid main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); vV = mv.xyz; vN = normalize(normalMatrix * normal); vY = (modelMatrix * vec4(position,1.0)).y; gl_Position = projectionMatrix * mv; }',
      fragmentShader: [
        'uniform vec3 uColor; uniform float uOpacity, uSel, uTime, uBright, uScan, uFlick;',
        'varying vec3 vN; varying vec3 vV; varying float vY;',
        'void main(){',
        '  float f = pow(1.0 - abs(dot(normalize(vN), normalize(-vV))), 1.6);',
        '  float scan = mix(1.0, 0.78 + 0.22 * sin(vY * 90.0 - uTime * 4.0), uScan);',
        '  vec3 col = uColor * (0.32 + 1.25 * f) * scan * uBright * uFlick + vec3(0.9) * f * 0.25 + uColor * uSel * 0.6;',
        '  gl_FragColor = vec4(col * uOpacity, 1.0);',
        '}'].join('\n'),
      transparent: true, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide
    });
  };
  HL.texPR = function () { return Math.min(2, Math.max(1, window.devicePixelRatio || 1)); };
  HL.canvasTex = function (cv) { var t = new T.CanvasTexture(cv); t.minFilter = T.LinearFilter; t.magFilter = T.LinearFilter; t.generateMipmaps = false; t.anisotropy = 1; return t; };
  /* wrap text that may be Latin or CJK */
  function wrap(ctx, text, maxW, maxLines) {
    var toks = String(text || '').match(/[⺀-鿿豈-﫿＀-￯　-〿]|[^\s⺀-鿿豈-﫿＀-￯　-〿]+|\s+/g) || [];
    var lines = [], cur = '';
    for (var i = 0; i < toks.length; i++) {
      var tk = toks[i]; if (/^\s+$/.test(tk)) { if (/\n/.test(tk)) { lines.push(cur); cur = ''; } else if (cur) cur += ' '; continue; }
      var test = cur + tk;
      if (ctx.measureText(test).width <= maxW || !cur) {
        if (!cur && ctx.measureText(tk).width > maxW) { // a single too-long token: break it by characters
          var part = ''; for (var j = 0; j < tk.length; j++) { if (ctx.measureText(part + tk[j]).width > maxW && part) { lines.push(part); part = ''; } part += tk[j]; } cur = part;
        } else cur = test;
      } else { lines.push(cur.replace(/\s+$/, '')); cur = tk; }
      if (lines.length >= maxLines) break;
    }
    if (cur && lines.length < maxLines) lines.push(cur);
    var over = lines.length > maxLines || (i < toks.length);
    lines = lines.slice(0, maxLines);
    if (over && lines.length) { var L = lines[lines.length - 1]; while (L.length > 1 && ctx.measureText(L + '…').width > maxW) L = L.slice(0, -1); lines[lines.length - 1] = L + '…'; }
    return lines;
  }
  HL.wrap = wrap;
  function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  HL.rr = rr;
  HL.KIND = { word: ['单词', 'WORD'], card: ['卡片', 'CARD'], chart: ['Anchor Chart', 'CHART'], knowledge: ['知识', 'NOTE'], work: ['3D Type', 'WORK'], group: ['分组', 'GROUP'] };
  HL.kindColor = function (it) {
    if (it.kind === 'chart' && it.ink) return it.ink;
    return { word: '#6fe3ff', card: '#9fc4ff', knowledge: '#b58cff', work: it.lookCss || '#ff7a4a', group: '#ffd27a' }[it.kind] || '#6fe3ff';
  };
  /** a glass card canvas for an item (title + text + footer) */
  HL.cardCanvas = function (it, W, H, opt) {
    opt = opt || {}; var s = HL.texPR() * 0.75, cv = document.createElement('canvas'); cv.width = Math.round(W * s); cv.height = Math.round(H * s);
    var x = cv.getContext('2d'); x.scale(s, s);
    var accent = HL.kindColor(it);
    var g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, 'rgba(14,52,92,0.80)'); g.addColorStop(1, 'rgba(4,20,42,0.74)');
    rr(x, 4, 4, W - 8, H - 8, 22); x.fillStyle = g; x.fill();
    x.lineWidth = 3; x.strokeStyle = 'rgba(130,225,255,0.85)'; x.shadowColor = 'rgba(80,200,255,0.9)'; x.shadowBlur = 14; x.stroke(); x.shadowBlur = 0;
    // corner brackets
    x.strokeStyle = accent; x.lineWidth = 5; var c = 30;
    [[14, 14, 1, 1], [W - 14, 14, -1, 1], [14, H - 14, 1, -1], [W - 14, H - 14, -1, -1]].forEach(function (k) { x.beginPath(); x.moveTo(k[0], k[1] + c * k[3]); x.lineTo(k[0], k[1]); x.lineTo(k[0] + c * k[2], k[1]); x.stroke(); });
    if (it.kind === 'chart') { x.fillStyle = accent; rr(x, 22, 64, 8, H - 128, 4); x.fill(); }
    var kz = HL.KIND[it.kind] || ['', ''];
    x.font = '700 22px ' + FONT; x.textBaseline = 'top'; x.fillStyle = accent; x.globalAlpha = 0.95;
    var head = kz[1] + ' · ' + (it.kind === 'chart' ? (it.subName || kz[0]) : kz[0]) + (it.groupTitle ? '  ' + it.groupTitle : '');
    x.fillText(wrap(x, head, W - (it.today ? 270 : 120), 1)[0] || '', 40, 30); x.globalAlpha = 1;
    if (it.today) { x.font = '800 20px ' + FONT; var tw = x.measureText('今日 TODAY').width + 22; x.fillStyle = accent; rr(x, W - 72 - tw, 24, tw, 32, 16); x.fill(); x.fillStyle = '#fff'; x.textBaseline = 'middle'; x.fillText('今日 TODAY', W - 61 - tw, 41); x.textBaseline = 'top'; }
    if (it.learned || it.mastered) { x.font = '800 24px ' + FONT; x.fillStyle = '#7dffb0'; x.textAlign = 'right'; x.fillText('✓', W - 36, 28); x.textAlign = 'left'; }
    // title, auto-fit
    var tSize = opt.big ? 84 : 70, lines;
    for (; tSize >= 34; tSize -= 4) { x.font = '800 ' + tSize + 'px ' + FONT; lines = wrap(x, it.title || '（无标题）', W - 84, 2); if (lines.length < 2 || tSize <= 40) { if (lines.join('').length >= (it.title || '').length - 1 || tSize <= 40) break; } }
    x.fillStyle = '#f0fbff'; x.shadowColor = 'rgba(90,210,255,0.95)'; x.shadowBlur = 16;
    var y = 70; lines.forEach(function (l) { x.fillText(l, 42, y); y += tSize * 1.12; }); x.shadowBlur = 0;
    var body = it.text || '';
    if (body) {
      var bs = opt.big ? 32 : 30; x.font = '500 ' + bs + 'px ' + FONT; x.fillStyle = 'rgba(205,238,255,0.92)';
      var room = Math.max(1, Math.floor((H - 50 - y - 10) / (bs * 1.25)));
      wrap(x, body, W - 84, Math.min(room, opt.lines || 4)).forEach(function (l) { x.fillText(l, 42, y + 8); y += bs * 1.25; });
    }
    var foot = (it.tags || []).slice(0, 3).map(function (t) { return '#' + t; }).join('  ');
    if (foot) { x.font = '600 20px ' + FONT; x.fillStyle = 'rgba(160,215,255,0.7)'; x.fillText(wrap(x, foot, W - 84, 1)[0] || '', 42, H - 44); }
    return cv;
  };

  /* ───────────────────────── atlas + instanced billboards ───────────────────────── */
  /** a canvas atlas of label cells; alloc(draw) → [u0, v0, du, dv] */
  HL.Atlas = function (cw, ch, size) {
    var s = HL.texPR() >= 2 ? 1 : 0.75; size = size || 2048; var S = Math.round(size * s);
    var cv = document.createElement('canvas'); cv.width = cv.height = S;
    var x = cv.getContext('2d'), cols = Math.floor(S / (cw * s)), rows = Math.floor(S / (ch * s)), n = 0;
    var tex = HL.canvasTex(cv);
    return {
      tex: tex, cap: cols * rows,
      alloc: function (draw) {
        if (n >= cols * rows) return [0, 0, 0, 0];
        var cx = (n % cols) * cw * s, cy = Math.floor(n / cols) * ch * s; n++;
        x.save(); x.translate(cx, cy); x.scale(s, s); x.beginPath(); x.rect(0, 0, cw, ch); x.clip(); draw(x, cw, ch); x.restore();
        tex.needsUpdate = true;
        return [cx / S, 1 - (cy + ch * s) / S, cw * s / S, ch * s / S];
      },
      redraw: function (uv, draw) { var cx = uv[0] * S, cy = (1 - uv[1] - uv[3]) * S; x.clearRect(cx, cy, cw * s, ch * s); x.save(); x.translate(cx, cy); x.scale(s, s); x.beginPath(); x.rect(0, 0, cw, ch); x.clip(); draw(x, cw, ch); x.restore(); tex.needsUpdate = true; },
      dispose: function () { tex.dispose(); }
    };
  };
  /** a label cell drawer: glowing text, optional sub line */
  HL.labelDraw = function (text, sub, color, opt) {
    opt = opt || {};
    return function (x, w, h) {
      var size = opt.size || Math.round(h * 0.56), t = String(text || '');
      x.textAlign = 'center'; x.textBaseline = 'middle';
      for (; size > 12; size -= 2) { x.font = (opt.weight || 800) + ' ' + size + 'px ' + FONT; if (x.measureText(t).width <= w - 14) break; }
      if (x.measureText(t).width > w - 14) { while (t.length > 1 && x.measureText(t + '…').width > w - 14) t = t.slice(0, -1); t += '…'; }
      var cy = sub ? h * 0.4 : h * 0.52;
      if (opt.plate) { x.fillStyle = 'rgba(4,22,44,0.55)'; var tw = Math.min(w - 4, x.measureText(t).width + 30); rr(x, (w - tw) / 2, 4, tw, h - 8, (h - 8) / 2); x.fill(); x.strokeStyle = color; x.globalAlpha = 0.6; x.lineWidth = 2; x.stroke(); x.globalAlpha = 1; }
      x.shadowColor = color || '#6fe3ff'; x.shadowBlur = 10; x.fillStyle = '#f2fcff'; x.fillText(t, w / 2, cy); x.shadowBlur = 4; x.fillText(t, w / 2, cy);
      x.shadowBlur = 0;
      if (sub) { var ss = Math.round(h * 0.24); x.font = '600 ' + ss + 'px ' + FONT; while (ss > 10 && x.measureText(sub).width > w - 10) { ss -= 1; x.font = '600 ' + ss + 'px ' + FONT; } x.fillStyle = color || 'rgba(170,225,255,0.85)'; x.fillText(sub, w / 2, h * 0.8); }
    };
  };
  var BB_VS = [
    'attribute vec4 aUv; attribute vec4 aTint;',
    'varying vec2 vUv; varying vec2 vQ; varying vec4 vTint;',
    'void main(){',
    '  vec4 c = modelViewMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);',
    '  vec2 s = vec2(length(instanceMatrix[0].xyz), length(instanceMatrix[1].xyz));',
    '  c.xy += position.xy * s;',
    '  vQ = uv; vUv = aUv.xy + uv * aUv.zw; vTint = aTint;',
    '  gl_Position = projectionMatrix * c;',
    '}'].join('\n');
  /** n camera-facing quads in one draw call. atlas → textured labels; no atlas → soft glow dots (additive) */
  HL.Billboards = function (n, atlas) {
    var geo = new T.PlaneGeometry(1, 1);
    var ib = new T.InstancedBufferGeometry(); ib.index = geo.index; ib.attributes.position = geo.attributes.position; ib.attributes.uv = geo.attributes.uv;
    var aUv = new T.InstancedBufferAttribute(new Float32Array(n * 4), 4), aTint = new T.InstancedBufferAttribute(new Float32Array(n * 4), 4);
    aUv.setUsage(T.DynamicDrawUsage); aTint.setUsage(T.DynamicDrawUsage);
    ib.setAttribute('aUv', aUv); ib.setAttribute('aTint', aTint);
    var mat = new T.ShaderMaterial({
      uniforms: { map: { value: atlas ? atlas.tex : null }, uTime: U.uTime, uBright: U.uBright, uFlick: U.uFlick },
      vertexShader: BB_VS,
      fragmentShader: atlas ?
        'uniform sampler2D map; uniform float uBright, uFlick; varying vec2 vUv; varying vec2 vQ; varying vec4 vTint;\nvoid main(){ vec4 t = texture2D(map, vUv); gl_FragColor = vec4(t.rgb * vTint.rgb * uBright * uFlick, t.a * vTint.a); }' :
        'uniform float uBright, uTime; varying vec2 vQ; varying vec4 vTint; varying vec2 vUv;\nvoid main(){ float d = length(vQ - 0.5) * 2.0; float g = exp(-d * d * 6.0) * 0.75 + smoothstep(0.3, 0.0, d) * 0.9 + smoothstep(0.06, 0.0, abs(d - 0.62 - 0.05 * sin(uTime * 2.0 + vUv.x * 40.0))) * 0.25; gl_FragColor = vec4(vTint.rgb * g * uBright * vTint.a, 1.0); }',
      transparent: true, depthWrite: false, blending: atlas ? T.NormalBlending : T.AdditiveBlending
    });
    var mesh = new T.InstancedMesh(ib, mat, n); mesh.frustumCulled = false; mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
    var m4 = new T.Matrix4(), q = new T.Quaternion(), sc = new T.Vector3();
    var B = {
      mesh: mesh, n: n,
      set: function (i, p, sx, sy) { sc.set(sx || 1e-5, sy || 1e-5, 1); m4.compose(p, q, sc); mesh.setMatrixAt(i, m4); },
      uv: function (i, r) { aUv.setXYZW(i, r[0], r[1], r[2], r[3]); },
      tint: function (i, r, g, b, a) { aTint.setXYZW(i, r, g, b, a); },
      tintC: function (i, c, a) { aTint.setXYZW(i, c.r, c.g, c.b, a); },
      commit: function () { mesh.instanceMatrix.needsUpdate = true; aUv.needsUpdate = true; aTint.needsUpdate = true; },
      dispose: function () { ib.dispose(); geo.dispose(); mat.dispose(); }
    };
    for (var i = 0; i < n; i++) { B.set(i, new T.Vector3(0, -50, 0), 0, 0); B.tint(i, 1, 1, 1, 1); }
    B.commit(); return B;
  };

  /* ───────────────────────── the console ───────────────────────── */
  var DESK_Y = 1.0;
  HL.EMIT = new T.Vector3(0, DESK_Y + 0.08, 0);
  var consoleParts = {};
  (function buildConsole() {
    var metal = new T.MeshStandardMaterial({ color: 0x8c97a6, metalness: 0.92, roughness: 0.26, envMapIntensity: 1.1 });
    var dark = new T.MeshStandardMaterial({ color: 0x1a2330, metalness: 0.8, roughness: 0.38 });
    var glass = new T.MeshStandardMaterial({ color: 0x0b2a44, metalness: 0.2, roughness: 0.04, transparent: true, opacity: 0.55, envMapIntensity: 1.6 });
    // floor: dark disc with a faint polar grid, lit by the boot ring
    var floor = new T.Mesh(new T.CircleGeometry(16, 72), new T.ShaderMaterial({
      uniforms: { uTime: U.uTime, uBoot: U.uBoot, uBright: U.uBright },
      vertexShader: 'varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: [
        'uniform float uTime, uBoot, uBright; varying vec2 vP;',
        'void main(){ float r = length(vP); float a = atan(vP.y, vP.x);',
        '  float rings = smoothstep(0.03, 0.0, abs(fract(r * 1.0) - 0.5) - 0.47);',
        '  float spokes = smoothstep(0.02, 0.0, abs(fract(a / 6.2831 * 48.0) - 0.5) - 0.48) * step(2.4, r);',
        '  float fade = exp(-r * 0.22);',
        '  vec3 col = vec3(0.02, 0.05, 0.09) * fade + vec3(0.15, 0.55, 0.85) * (rings + spokes * 0.6) * fade * 0.18 * (0.3 + 0.7 * uBoot) * uBright;',
        '  col += vec3(0.1, 0.45, 0.8) * exp(-r * 0.9) * 0.25 * uBoot;',
        '  gl_FragColor = vec4(col, 1.0); }'].join('\n')
    }));
    floor.rotation.x = -Math.PI / 2; scene.add(floor);
    // backdrop: a tall cylinder wall with faint vertical light seams
    var wall = new T.Mesh(new T.CylinderGeometry(11, 11, 14, 64, 1, true), new T.ShaderMaterial({
      uniforms: { uTime: U.uTime, uBoot: U.uBoot },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: 'uniform float uTime, uBoot; varying vec2 vUv; void main(){ float s = smoothstep(0.012, 0.0, abs(fract(vUv.x * 36.0) - 0.5) - 0.488); float h = smoothstep(0.0, 0.35, vUv.y) * smoothstep(0.9, 0.4, vUv.y); float run = smoothstep(0.08, 0.0, abs(fract(vUv.y * 0.5 - uTime * 0.05 + vUv.x * 7.0) - 0.5)); gl_FragColor = vec4(vec3(0.05, 0.25, 0.45) * s * h * (0.25 + 0.6 * run) * uBoot + vec3(0.008, 0.02, 0.04) * h, 1.0); }',
      side: T.BackSide, depthWrite: false
    }));
    wall.position.y = 5; scene.add(wall);
    // pedestal (lathe), cap, glass top, chrome rim
    var prof = [[0, 0], [1.2, 0], [1.28, 0.04], [1.18, 0.12], [0.86, 0.36], [0.62, 0.7], [0.66, 0.86], [0.98, 0.94], [1.08, 0.97], [1.08, 1.0], [0, 1.0]].map(function (p) { return new T.Vector2(p[0], p[1] * DESK_Y); });
    var ped = new T.Mesh(new T.LatheGeometry(prof, 72), metal); scene.add(ped);
    var band = new T.Mesh(new T.CylinderGeometry(0.665, 0.64, 0.12, 72, 1, true), new T.MeshBasicMaterial({ color: 0x0d3550 })); band.position.y = DESK_Y * 0.72; scene.add(band);
    consoleParts.band = band;
    var gtop = new T.Mesh(new T.CylinderGeometry(1.0, 1.0, 0.03, 72), glass); gtop.position.y = DESK_Y + 0.025; scene.add(gtop);
    var rim = new T.Mesh(new T.TorusGeometry(1.06, 0.03, 10, 96), metal); rim.rotation.x = Math.PI / 2; rim.position.y = DESK_Y + 0.02; scene.add(rim);
    // emitter lens
    var lensMat = new T.MeshBasicMaterial({ color: 0x0b2a3a }); consoleParts.lens = lensMat;
    var lens = new T.Mesh(new T.CylinderGeometry(0.2, 0.26, 0.06, 40), lensMat); lens.position.y = DESK_Y + 0.05; scene.add(lens);
    var lensRim = new T.Mesh(new T.TorusGeometry(0.27, 0.018, 8, 48), metal); lensRim.rotation.x = Math.PI / 2; lensRim.position.y = DESK_Y + 0.07; scene.add(lensRim);
    // desk wing: annulus sector towards the viewer, beveled metal with a glass control surface
    var a0 = Math.PI / 2 - 0.95, a1 = Math.PI / 2 + 0.95, Ri = 1.3, Ro = 2.3, sh = new T.Shape();
    sh.absarc(0, 0, Ro, a0, a1, false); sh.lineTo(Math.cos(a1) * Ri, Math.sin(a1) * Ri); sh.absarc(0, 0, Ri, a1, a0, true); sh.closePath();
    var wingG = new T.ExtrudeGeometry(sh, { depth: 0.07, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.025, bevelSegments: 2, curveSegments: 40 });
    wingG.rotateX(Math.PI / 2); // shape y → +z (towards the viewer), extrude goes down
    var wing = new T.Mesh(wingG, dark); wing.position.y = DESK_Y - 0.06; scene.add(wing);
    var wingEdge = new T.Mesh(new T.TorusGeometry(Ro + 0.012, 0.02, 6, 60, a1 - a0), metal); wingEdge.position.y = DESK_Y - 0.075;
    wingEdge.rotation.set(Math.PI / 2, 0, a0); scene.add(wingEdge);
    // legs under the wing
    var legG = new T.CylinderGeometry(0.035, 0.05, DESK_Y - 0.1, 10);
    [-0.7, 0, 0.7].forEach(function (a) { var l = new T.Mesh(legG, metal), ang = Math.PI / 2 + a; l.position.set(Math.cos(ang) * (Ro - 0.2), (DESK_Y - 0.1) / 2, Math.sin(ang) * (Ro - 0.2)); scene.add(l); });
    // control surface texture (abstract sliders, dials, readouts — original)
    var S = 1024, cv = document.createElement('canvas'); cv.width = cv.height = S; var x = cv.getContext('2d'), c0 = S / 2, k = S / 2 / Ro;
    x.translate(c0, c0);
    function polar(r, a) { return [Math.cos(a) * r * k, -Math.sin(a) * r * k]; }
    x.strokeStyle = 'rgba(111,227,255,0.85)'; x.fillStyle = 'rgba(111,227,255,0.9)'; x.lineWidth = 2;
    // concentric guides
    [Ri + 0.08, Ro - 0.08].forEach(function (r) { x.beginPath(); x.arc(0, 0, r * k, a0, a1); x.stroke(); });
    // slider tracks
    for (var i = 0; i < 7; i++) { var a = a0 + 0.25 + i * 0.12, p = polar(Ri + 0.2, -a), q = polar(Ri + 0.6, -a); x.globalAlpha = 0.6; x.beginPath(); x.moveTo(p[0], p[1]); x.lineTo(q[0], q[1]); x.stroke(); x.globalAlpha = 1; var t2 = 0.3 + 0.6 * ((i * 37) % 10) / 10, m = polar(Ri + 0.2 + 0.4 * t2, -a); x.beginPath(); x.arc(m[0], m[1], 7, 0, 7); x.fill(); }
    // dials
    for (i = 0; i < 3; i++) { var d = polar(Ri + 0.62, -Math.PI / 2 + (i - 1) * 0.42); x.beginPath(); x.arc(d[0], d[1], 34, 0, 7); x.stroke(); x.beginPath(); x.arc(d[0], d[1], 26, -2.2 + i, 0.6 + i); x.lineWidth = 6; x.stroke(); x.lineWidth = 2; }
    // key grid
    for (i = 0; i < 12; i++) { var a3 = a1 - 0.2 - (i % 4) * 0.11, r3 = Ri + 0.22 + Math.floor(i / 4) * 0.2, pp = polar(r3, -a3); x.globalAlpha = (i * 7) % 3 ? 0.35 : 0.85; x.fillRect(pp[0] - 13, pp[1] - 9, 26, 18); }
    x.globalAlpha = 1; x.font = '600 22px ui-monospace, Menlo, monospace';
    var lab = polar(Ro - 0.2, -Math.PI / 2); x.textAlign = 'center'; x.fillText('HL·07  LUMEN 0.92  ϕ 21.4°', lab[0], lab[1]);
    var surfTex = HL.canvasTex(cv);
    var surf = new T.Mesh(new T.RingGeometry(Ri, Ro, 48, 1, -a1, a1 - a0), new T.MeshBasicMaterial({ map: surfTex, transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false }));
    surf.rotation.x = -Math.PI / 2; surf.position.y = DESK_Y + 0.016; scene.add(surf); consoleParts.surf = surf.material;
    var wglass = new T.Mesh(new T.RingGeometry(Ri + 0.02, Ro - 0.02, 48, 1, -a1, a1 - a0), glass); wglass.rotation.x = -Math.PI / 2; wglass.position.y = DESK_Y + 0.012; scene.add(wglass);
    // LED ticks around the rim (one instanced mesh)
    var ticks = new T.InstancedMesh(new T.BoxGeometry(0.05, 0.012, 0.012), new T.MeshBasicMaterial({ color: 0x0a2a3a }), 64), dm = new T.Object3D();
    for (i = 0; i < 64; i++) { var ta = i / 64 * Math.PI * 2; dm.position.set(Math.cos(ta) * 0.92, DESK_Y + 0.045, Math.sin(ta) * 0.92); dm.rotation.set(0, -ta, 0); dm.updateMatrix(); ticks.setMatrixAt(i, dm.matrix); }
    scene.add(ticks); consoleParts.ticks = ticks.material;
  })();

  /* ───────────────────────── projection ───────────────────────── */
  var PROJ_H = 2.65, PROJ_R = 2.55;
  var cone = new T.Mesh(new T.CylinderGeometry(PROJ_R, 0.24, PROJ_H, 72, 1, true), new T.ShaderMaterial({
    uniforms: { uTime: U.uTime, uRise: U.uRise, uBright: U.uBright, uScan: U.uScan, uFlick: U.uFlick },
    vertexShader: 'varying vec3 vN; varying vec3 vV; varying float vH; varying vec2 vUv;\nvoid main(){ vUv = uv; vH = uv.y; vec4 mv = modelViewMatrix * vec4(position,1.0); vV = mv.xyz; vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * mv; }',
    fragmentShader: [
      'uniform float uTime, uRise, uBright, uScan, uFlick; varying vec3 vN; varying vec3 vV; varying float vH; varying vec2 vUv;',
      'void main(){',
      '  if (vH > uRise) discard;',
      '  float f = pow(1.0 - abs(dot(normalize(vN), normalize(-vV))), 2.2);',
      '  float fade = smoothstep(0.0, 0.08, vH) * (1.0 - smoothstep(0.55, 1.0, vH));',
      '  float scan = mix(1.0, 0.6 + 0.4 * sin(vH * 140.0 - uTime * 6.0), uScan);',
      '  float rays = 0.65 + 0.35 * sin(vUv.x * 6.2831 * 9.0 + uTime * 0.3) * sin(vUv.x * 6.2831 * 4.0 - uTime * 0.2);',
      '  float lip = smoothstep(0.03, 0.0, abs(vH - uRise)) * step(uRise, 0.995);',
      '  float a = (0.025 + f * 0.2) * fade * scan * rays + lip * 0.6;',
      '  gl_FragColor = vec4(vec3(0.25, 0.75, 1.0) * a * uBright * uFlick, 1.0);',
      '}'].join('\n'),
    transparent: true, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide
  }));
  cone.position.y = HL.EMIT.y + PROJ_H / 2; scene.add(cone);
  // glow sprite at the emitter
  function glowTex(c0, c1) { var cv = document.createElement('canvas'); cv.width = cv.height = 128; var x = cv.getContext('2d'), g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, c0); g.addColorStop(0.25, c1); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); return HL.canvasTex(cv); }
  var gTex = glowTex('rgba(230,250,255,1)', 'rgba(70,200,255,0.55)');
  var emGlow = new T.Mesh(new T.PlaneGeometry(1.6, 1.6), new T.MeshBasicMaterial({ map: gTex, transparent: true, blending: T.AdditiveBlending, depthWrite: false, opacity: 0 }));
  emGlow.rotation.x = -Math.PI / 2; emGlow.position.y = HL.EMIT.y + 0.01; scene.add(emGlow);
  var emCore = new T.Sprite(new T.SpriteMaterial({ map: gTex, blending: T.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0 })); emCore.scale.set(0.9, 0.9, 1); emCore.position.copy(HL.EMIT).y += 0.06; scene.add(emCore);
  // glyph rings on the desk (rotating)
  function tickRingTex(seed) {
    var S = 512, cv = document.createElement('canvas'); cv.width = cv.height = S; var x = cv.getContext('2d'); x.translate(S / 2, S / 2); var R0 = rng(seed);
    x.strokeStyle = 'rgba(140,230,255,1)'; x.fillStyle = 'rgba(140,230,255,1)';
    for (var i = 0; i < 120; i++) { var a = i / 120 * Math.PI * 2, l = i % 10 === 0 ? 22 : i % 5 === 0 ? 14 : 7; x.globalAlpha = i % 10 === 0 ? 1 : 0.55; x.lineWidth = i % 10 === 0 ? 3 : 1.5; x.beginPath(); x.moveTo(Math.cos(a) * 250, Math.sin(a) * 250); x.lineTo(Math.cos(a) * (250 - l), Math.sin(a) * (250 - l)); x.stroke(); }
    x.globalAlpha = 0.7; x.lineWidth = 6; for (i = 0; i < 6; i++) { var b = R0() * 6.28; x.beginPath(); x.arc(0, 0, 212, b, b + 0.3 + R0() * 0.6); x.stroke(); }
    x.globalAlpha = 0.9; x.font = '700 15px ui-monospace, Menlo, monospace'; x.textAlign = 'center';
    for (i = 0; i < 12; i++) { x.save(); x.rotate(i / 12 * Math.PI * 2); x.fillText(('0' + (i * 30)).slice(-3), 0, -192); x.restore(); }
    return HL.canvasTex(cv);
  }
  var gr1 = new T.Mesh(new T.PlaneGeometry(2.7, 2.7), new T.MeshBasicMaterial({ map: tickRingTex(7), transparent: true, blending: T.AdditiveBlending, depthWrite: false, opacity: 0 }));
  gr1.rotation.x = -Math.PI / 2; gr1.position.y = DESK_Y + 0.11; scene.add(gr1);
  var gr2 = new T.Mesh(new T.PlaneGeometry(1.2, 1.2), new T.MeshBasicMaterial({ map: tickRingTex(11), transparent: true, blending: T.AdditiveBlending, depthWrite: false, opacity: 0 }));
  gr2.rotation.x = -Math.PI / 2; gr2.position.y = DESK_Y + 0.14; scene.add(gr2);
  var topRing = new T.Mesh(new T.RingGeometry(PROJ_R - 0.03, PROJ_R, 96), new T.MeshBasicMaterial({ color: 0x46c8ff, transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide }));
  topRing.rotation.x = -Math.PI / 2; topRing.position.y = HL.EMIT.y + PROJ_H; scene.add(topRing);
  // boot shockwave rings (desk + floor)
  var bootRing = new T.Mesh(new T.RingGeometry(0.92, 1.0, 96), new T.MeshBasicMaterial({ color: 0x9ff0ff, transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide }));
  bootRing.rotation.x = -Math.PI / 2; bootRing.position.y = DESK_Y + 0.12; scene.add(bootRing);
  var floorRing = bootRing.clone(); floorRing.material = bootRing.material.clone(); floorRing.position.y = 0.02; scene.add(floorRing);
  // dust: drifting motes inside the volume, animated entirely in the vertex shader
  var DUST = (Math.min(innerWidth, innerHeight) < 600) ? 260 : 520, dp = new Float32Array(DUST * 3), ds = new Float32Array(DUST), R1 = rng(42);
  for (var i = 0; i < DUST; i++) { var r = Math.sqrt(R1()) * 2.3, a = R1() * 6.283; dp[i * 3] = Math.cos(a) * r; dp[i * 3 + 1] = R1() * PROJ_H; dp[i * 3 + 2] = Math.sin(a) * r; ds[i] = R1(); }
  var dg = new T.BufferGeometry(); dg.setAttribute('position', new T.BufferAttribute(dp, 3)); dg.setAttribute('aS', new T.BufferAttribute(ds, 1));
  var dust = new T.Points(dg, new T.ShaderMaterial({
    uniforms: { uTime: U.uTime, uRise: U.uRise, uBright: U.uBright, uPR: { value: pr }, uH: { value: PROJ_H }, uMove: { value: 1 } },
    vertexShader: 'attribute float aS; uniform float uTime, uPR, uH, uRise, uMove; varying float vA;\nvoid main(){ vec3 p = position; p.y = mod(p.y + uTime * (0.05 + aS * 0.08) * uMove, uH); p.x += sin(uTime * 0.3 + aS * 30.0) * 0.08 * uMove; vA = smoothstep(0.0, 0.3, p.y) * (1.0 - smoothstep(uH * 0.7, uH, p.y)) * step(p.y / uH, uRise) * (0.4 + 0.6 * sin(uTime * (1.0 + aS * 3.0) + aS * 50.0) * 0.5 + 0.3); vec4 mv = modelViewMatrix * vec4(p, 1.0); gl_PointSize = (2.0 + aS * 3.5) * uPR * (6.0 / -mv.z); gl_Position = projectionMatrix * mv; }',
    fragmentShader: 'uniform float uBright; varying float vA; void main(){ vec2 q = gl_PointCoord - 0.5; float d = length(q); if (d > 0.5) discard; gl_FragColor = vec4(vec3(0.5, 0.88, 1.0) * smoothstep(0.5, 0.0, d) * vA * uBright, 1.0); }',
    transparent: true, depthWrite: false, blending: T.AdditiveBlending
  }));
  dust.position.y = HL.EMIT.y; dust.frustumCulled = false; scene.add(dust);
  HL.contentRoot = new T.Group(); scene.add(HL.contentRoot);

  /* ───────────────────────── boot sequence ───────────────────────── */
  var boot = { state: 'idle', t: 0, dur: 2.2 };
  HL.boot = boot;
  HL.appearAt = Infinity;                       // seconds (clock) when the current mode's content starts unfolding
  HL.now = 0;
  function startBoot() {
    if (boot.state === 'on') return;
    if (boot.state === 'booting') { boot.t = boot.dur; HL.appearAt = Math.min(HL.appearAt, HL.now - 3); return; }   // skip
    boot.state = 'booting'; boot.t = layout.settings.reduce ? boot.dur : 0;
    HL.appearAt = HL.now + (layout.settings.reduce ? 0 : 1.0);
    el('boot').classList.add('off');
    setTimeout(function () { if (boot.state !== 'idle') el('boot').style.display = 'none'; }, 600);
  }
  HL.startBoot = startBoot;
  el('boot').addEventListener('pointerup', function (e) { e.preventDefault(); startBoot(); });
  function bootStep(dt) {
    var b = 0;
    if (boot.state === 'booting') { boot.t += dt; if (boot.t >= boot.dur) { boot.t = boot.dur; boot.state = 'on'; } }
    if (boot.state !== 'idle') b = boot.t / boot.dur;
    var ring = clamp(b / 0.45, 0, 1), rise = easeOut((b - 0.15) / 0.5), lit = ease(b / 0.3);
    U.uBoot.value = boot.state === 'idle' ? 0.12 : ease(b * 1.4);
    U.uRise.value = rise;
    bootRing.scale.setScalar(1 + ring * 5.5); bootRing.material.opacity = ring > 0 && ring < 1 ? (1 - ring) * 0.9 : 0;
    var fr = clamp((b - 0.08) / 0.55, 0, 1); floorRing.scale.setScalar(1 + fr * 9); floorRing.material.opacity = fr > 0 && fr < 1 ? (1 - fr) * 0.6 : 0;
    var on = boot.state === 'idle' ? 0.08 : lit;
    var br = layout.settings.bright;
    emGlow.material.opacity = on * 0.75 * br; emCore.material.opacity = on * (0.85 + 0.15 * Math.sin(HL.now * 9)) * br;
    gr1.material.opacity = rise * 0.42 * br; gr2.material.opacity = rise * 0.55 * br; topRing.material.opacity = rise > 0.98 ? 0.35 * br : 0;
    consoleParts.surf.opacity = lit * 0.55 * br;
    consoleParts.lens.color.setRGB(0.05 + 0.5 * on, 0.16 + 0.7 * on, 0.23 + 0.77 * on);
    consoleParts.ticks.color.setRGB(0.04 + 0.3 * on, 0.16 + 0.7 * on, 0.23 + 0.77 * on);
    consoleParts.band.material.color.setRGB(0.05 + 0.12 * on, 0.2 + 0.45 * on, 0.3 + 0.6 * on);
    holoLight.intensity = on * 2.2 * br;
  }
  /** per-element unfold 0..1 for staggered appearance (i-th element) */
  HL.appear = function (i, stagger) { return easeOut((HL.now - HL.appearAt - (i || 0) * (stagger == null ? 0.05 : stagger)) / (layout.settings.reduce ? 0.01 : 0.55)); };

  /* ───────────────────────── content ───────────────────────── */
  var LOOK = { neon: '#ff5a2a', argon: '#7d6bff', helium: '#ffb38e', xenon: '#c9d6ff' };
  HL.LOOK = LOOK;
  function normalize(d, isSample) {
    d = d && typeof d === 'object' ? d : {};
    var out = { lists: [], charts: [], knowledge: [], works: [], words: [], all: [], isSample: !!isSample || !!d.demo, byUid: {} };
    arr(d.lists).slice(0, 60).forEach(function (l, li) {
      if (!l || typeof l !== 'object') return;
      var key = str(l.key) || ('list' + li), src = l.source === 'gptstudy' ? 'gptstudy' : 'kanban';
      var L = { key: key, title: str(l.title, 60) || '未命名列表', source: src, items: [] };
      arr(l.items).slice(0, 400).forEach(function (it, ii) {
        if (!it || typeof it !== 'object' || !(it.title || it.text)) return;
        var o = { kind: src === 'gptstudy' ? 'word' : 'card', id: String(it.id != null ? it.id : key + ':' + ii), title: str(it.title, 120), text: str(it.text, 1200),
          learned: !!it.learned, tags: arr(it.tags).map(function (t) { return str(t, 24); }).filter(Boolean).slice(0, 8), group: 'l:' + key, groupTitle: L.title };
        L.items.push(o);
      });
      out.lists.push(L);
    });
    arr(d.charts).slice(0, 200).forEach(function (c, i) {
      if (!c || typeof c !== 'object') return;
      out.charts.push({ kind: 'chart', id: String(c.id != null ? c.id : 'chart' + i), title: str(c.title, 120), text: str(c.text, 1200), sub: str(c.sub) || 'other', subName: str(c.subName, 30) || 'Anchor Chart',
        ink: hexOk(c.ink) || '#6fe3ff', today: !!c.today, mastered: !!c.mastered, learned: !!c.mastered, tags: arr(c.tags).map(function (t) { return str(t, 24); }).filter(Boolean), group: 's:' + (str(c.sub) || 'other'), groupTitle: str(c.subName, 30) || 'Anchor Chart' });
    });
    arr(d.knowledge).slice(0, 300).forEach(function (k, i) {
      if (!k || typeof k !== 'object' || !(k.title || k.text)) return;
      var b = str(k.board, 40);
      out.knowledge.push({ kind: 'knowledge', id: String(k.id != null ? k.id : 'k' + i), title: str(k.title, 120), text: str(k.text, 1200), tags: arr(k.tags).map(function (t) { return str(t, 24); }).filter(Boolean).slice(0, 8), parents: arr(k.parents).map(function (x) { return String(x); }).slice(0, 12), group: 'k:' + (b || '知识'), groupTitle: b || '知识 Knowledge' });
    });
    arr(d.works).slice(0, 80).forEach(function (w, i) {
      if (!w || typeof w !== 'object' || !w.word) return;
      var look = LOOK[w.look] ? w.look : 'neon';
      out.works.push({ kind: 'work', id: String(w.id != null ? w.id : 'w' + i), title: str(w.word, 40), text: '', mode: str(w.mode, 20) || 'neon', look: look, lookCss: LOOK[look], group: 'works', groupTitle: '3D Type 作品' });
    });
    out.lists.forEach(function (l) { out.words = out.words.concat(l.items); });
    out.all = out.words.concat(out.charts, out.knowledge, out.works);
    out.all.forEach(function (it) { it.uid = it.kind + ':' + it.id; out.byUid[it.uid] = it; });
    return out;
  }
  function sampleData() {
    return {
      lists: [
        { key: 'sample:words', title: '示例 · Science Words', source: 'gptstudy', items: [
          { id: 's1', title: 'photosynthesis', text: 'How plants use sunlight, water and air to make food.', learned: true, tags: ['plants'] },
          { id: 's2', title: 'evaporation', text: 'When liquid water turns into water vapor.', learned: false, tags: ['water cycle'] },
          { id: 's3', title: 'condensation', text: 'When water vapor cools and turns back into liquid.', learned: false, tags: ['water cycle'] },
          { id: 's4', title: 'habitat', text: 'The natural home of a plant or animal.', learned: true, tags: ['animals'] },
          { id: 's5', title: 'predator', text: 'An animal that hunts other animals for food.', learned: false, tags: ['animals'] },
          { id: 's6', title: 'erosion', text: 'Wind and water slowly wearing away rock and soil.', learned: false, tags: ['earth'] }] },
        { key: 'sample:spell', title: '示例 · Spelling', source: 'kanban', items: [
          { id: 's7', title: 'beautiful', text: 'beau · ti · ful', learned: false, tags: ['3 syllables'] },
          { id: 's8', title: 'remember', text: 're · mem · ber', learned: true, tags: ['3 syllables'] },
          { id: 's9', title: 'thunder', text: 'thun · der', learned: false, tags: ['weather'] },
          { id: 's10', title: 'table', text: 'ta · ble (consonant-le)', learned: false, tags: [] }] }],
      charts: [
        { id: 'sc1', sub: 'math', subName: 'Math', ink: '#d9463e', title: 'Place Value', text: 'Each digit is worth 10 times the digit to its right.', mastered: false },
        { id: 'sc2', sub: 'ela', subName: 'Language Arts', ink: '#2f6fd6', title: 'Main Idea & Details', text: 'The main idea is what the text is mostly about; details support it.', mastered: true },
        { id: 'sc3', sub: 'sci', subName: 'Science', ink: '#2f9a5a', title: 'The Water Cycle', text: 'Evaporation → condensation → precipitation → collection.', mastered: false }],
      knowledge: [
        { id: 'sk1', title: 'Fractions on a number line', text: 'Split 0–1 into equal parts; each mark is one unit fraction.', tags: ['math'], board: '示例 · Notes' },
        { id: 'sk2', title: 'Food chain', text: 'Sun → plant → herbivore → carnivore.', tags: ['animals'], board: '示例 · Notes' }],
      works: [{ id: 'sw1', word: 'Minest', mode: 'neon', look: 'neon' }, { id: 'sw2', word: 'Hello', mode: 'neon', look: 'argon' }, { id: 'sw3', word: 'Learn', mode: 'neon', look: 'xenon' }],
      layout: null, demo: true
    };
  }
  HL.content = normalize({}, true); HL.contentReady = false;
  var gotReal = false, layoutApplied = false;
  function setContent(data, isSample) {
    var c = normalize(data, isSample);
    if (!isSample && data && data.layout && typeof data.layout === 'object' && !layoutApplied) { layout = cleanLayout(data.layout); applySettings(); }
    if (!isSample) layoutApplied = true;
    HL.content = c; HL.contentReady = true;
    el('sample').classList.toggle('on', c.isSample);
    var n = c.all.length;
    el('sub').textContent = (c.isSample ? '示例 · ' : '') + c.lists.length + ' 个单词表 · ' + c.charts.length + ' 张 Anchor Chart · ' + c.knowledge.length + ' 条知识 · ' + c.works.length + ' 件作品';
    if (!n) el('sub').textContent = '还没有内容 · Nothing to project yet';
    if (HL.detail.item && !c.byUid[HL.detail.item.uid]) HL.detail.close();
    var want = HL.modes[layout.mode] ? layout.mode : 'panels';
    if (HL.active && HL.active.id === want) { if (HL.active.onContent) HL.active.onContent(); else setMode(want, true); }
    else setMode(want, true);
  }
  HL.setContent = setContent;
  addEventListener('message', function (e) {
    if (!EMBED || e.source !== window.parent) return;       // content only from the page that embeds us
    var m = e.data; if (!m || typeof m !== 'object' || m.holo !== 1) return;
    if (m.op === 'content') { gotReal = true; setContent(m.data, false); }
    else if (m.op === 'toast' && m.text != null) HL.toast(str(m.text, 140));
  });

  /* ───────────────────────── item actions (edit / open) ───────────────────────── */
  HL.canSync = function () { return EMBED && !HL.content.isSample; };
  HL.editItem = function (it, title, text) {
    title = String(title || '').trim(); text = String(text || '');
    if (!title) { HL.toast('标题不能为空 · Title is required'); return false; }
    it.title = title.slice(0, 200); it.text = text.slice(0, 4000);
    if (HL.canSync()) { post({ holo: 1, op: 'edit', kind: it.kind, id: it.id, title: it.title, text: it.text }); HL.toast('正在写回 Minest… · Saving'); }
    else HL.toast('示例内容：只在本页修改 · Sample only');
    if (HL.active && HL.active.onItemEdited) HL.active.onItemEdited(it);
    return true;
  };
  HL.openItem = function (it) {
    if (!HL.canSync()) { HL.toast(EMBED ? '示例内容没有原卡 · Sample has no original' : '从 Spatial Home 或 My World 进入后可打开原卡'); return; }
    post({ holo: 1, op: 'open', kind: it.kind, id: it.id });
    HL.toast(it.kind === 'work' ? '正在打开 3D Type…' : '正在打开原卡…');
  };

  /* ───────────────────────── detail sheet ───────────────────────── */
  var D = el('detail');
  HL.detail = {
    item: null, extra: null,
    open: function (it, extra) {
      this.item = it; this.extra = extra || {}; this.render(false); D.classList.add('on'); el('settings').classList.remove('on');
    },
    close: function () { if (!this.item && !D.classList.contains('on')) return; var it = this.item; this.item = null; D.classList.remove('on'); D.innerHTML = ''; if (HL.active && HL.active.onDetailClosed) HL.active.onDetailClosed(it); },
    render: function (editing) {
      var it = this.item, ex = this.extra, self = this; if (!it) return;
      D.innerHTML = '';
      var k = document.createElement('div'); k.className = 'k';
      var kz = HL.KIND[it.kind] || ['', ''];
      k.innerHTML = '<i></i><span></span><button type="button" aria-label="关闭 Close">✕</button>';
      k.children[0].textContent = (it.kind === 'chart' ? (it.subName || 'Chart') : kz[0]) + ' ' + kz[1]; k.children[0].style.color = HL.kindColor(it);
      k.children[1].textContent = it.groupTitle || '';
      k.children[2].onclick = function () { self.close(); };
      D.appendChild(k);
      if (editing) {
        var ti = document.createElement('input'); ti.value = it.title; ti.maxLength = 200; ti.setAttribute('aria-label', '标题 Title');
        var tx = document.createElement('textarea'); tx.value = it.text || ''; tx.setAttribute('aria-label', '内容 Text'); tx.placeholder = '释义 / 背面 / 描述 · meaning / back / description';
        D.appendChild(ti); D.appendChild(tx);
        var n = document.createElement('div'); n.className = 'note'; n.textContent = HL.canSync() ? '保存后会写回 Minest 里的原卡 · Saves to the original' : '示例内容：只在本页修改 · Sample: changes stay here'; D.appendChild(n);
        acts([['✓ 保存 Save', function () { if (HL.editItem(it, ti.value, tx.value)) self.render(false); }, 'pri'], ['取消 Cancel', function () { self.render(false); }]]);
        setTimeout(function () { try { ti.focus(); } catch (e) {} }, 30);
        return;
      }
      var h = document.createElement('h3'); h.textContent = it.title || '（无标题）'; D.appendChild(h);
      if (ex.sub) { var sb = document.createElement('div'); sb.className = 'sub'; sb.textContent = ex.sub; D.appendChild(sb); }
      var body = ex.body != null ? ex.body : it.text;
      if (body) { var t = document.createElement('div'); t.className = 'tx'; t.textContent = body; D.appendChild(t); }
      else if (it.kind !== 'work' && it.kind !== 'group') { var t0 = document.createElement('div'); t0.className = 'note'; t0.textContent = '还没有释义 · No meaning yet'; D.appendChild(t0); }
      var tags = (it.tags || []).slice(); if (it.learned || it.mastered) tags.unshift(it.kind === 'chart' ? '✓ 已掌握 mastered' : '✓ 已学会 learned');
      if (tags.length) { var tg = document.createElement('div'); tg.className = 'tags'; tags.forEach(function (s) { var sp = document.createElement('span'); sp.textContent = s; tg.appendChild(sp); }); D.appendChild(tg); }
      var list = [];
      if (it.kind !== 'work' && it.kind !== 'group') list.push(['✎ 编辑 Edit', function () { self.render(true); }]);
      if (it.kind === 'work') list.push(['↗ 在 3D Type 打开', function () { HL.openItem(it); }, 'pri']);
      else if (it.kind !== 'group') list.push(['↗ 打开原卡 Open', function () { HL.openItem(it); }, 'pri']);
      else if (it.listKey) list.push(['↗ 打开列表 Open list', function () { if (!HL.canSync()) { HL.toast(EMBED ? '示例内容没有原列表 · Sample' : '从 Spatial Home 或 My World 进入后可打开列表'); return; } post({ holo: 1, op: 'open', kind: 'list', key: it.listKey }); HL.toast('正在打开列表…'); }, 'pri']);
      (ex.actions || []).forEach(function (a) { list.push(a); });
      acts(list);
      function acts(L) { var a = document.createElement('div'); a.className = 'acts'; L.forEach(function (b) { var bt = document.createElement('button'); bt.type = 'button'; bt.textContent = b[0]; if (b[2]) bt.className = b[2]; bt.onclick = b[1]; a.appendChild(bt); }); D.appendChild(a); }
    }
  };
  D.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
  D.addEventListener('keydown', function (e) { e.stopPropagation(); if (e.key === 'Escape') HL.detail.close(); });

  /* ───────────────────────── settings ───────────────────────── */
  function applySettings() {
    var s = layout.settings;
    U.uBright.value = s.bright; U.uScan.value = s.scan ? 1 : 0;
    el('scan').classList.toggle('off', !s.scan);
    el('sBright').value = s.bright; el('sScan').checked = s.scan; el('sReduce').checked = s.reduce;
    dust.material.uniforms.uMove.value = s.reduce ? 0.15 : 1;
  }
  el('gear').addEventListener('click', function () { el('settings').classList.toggle('on'); });
  el('sBright').addEventListener('input', function () { layout.settings.bright = clamp(parseFloat(this.value) || 1, 0.5, 1.5); applySettings(); HL.save(); });
  el('sScan').addEventListener('change', function () { layout.settings.scan = this.checked; applySettings(); HL.save(); });
  el('sReduce').addEventListener('change', function () { layout.settings.reduce = this.checked; applySettings(); HL.save(); });
  el('sReset').addEventListener('click', function () {
    var keep = layout.settings, mode = layout.mode; layout = defLayout(); layout.settings = keep; layout.mode = mode; HL.save();
    el('settings').classList.remove('on'); HL.toast('布局已重置 · Layout reset'); setMode(mode, true);
  });
  el('settings').addEventListener('pointerdown', function (e) { e.stopPropagation(); });
  el('back').addEventListener('click', function () {
    if (saveT) saveNow();
    if (EMBED) post({ holo: 1, op: 'close' }); else if (history.length > 1) history.back(); else HL.toast('这是独立页面 · Standalone page');
  });

  /* ───────────────────────── modes ───────────────────────── */
  HL.register = function (m) { HL.modes[m.id] = m; HL.modeOrder.push(m.id); };
  HL.active = null;
  var modesEl = el('modes'), toolsEl = el('tools');
  function setMode(id, rebuild) {
    if (!HL.modes[id]) id = 'panels';
    if (HL.active && HL.active.id === id && !rebuild) return;
    HL.detail.close(); HL.info(''); HL.empty('');
    if (HL.active) { try { HL.active.exit(); } catch (e) { console.warn(e); } }
    while (HL.contentRoot.children.length) HL.contentRoot.remove(HL.contentRoot.children[0]);
    HL.active = HL.modes[id];
    if (layout.mode !== id) { layout.mode = id; HL.save(); }
    if (boot.state === 'on') HL.appearAt = HL.now;
    else if (boot.state === 'booting') HL.appearAt = HL.now - boot.t + (layout.settings.reduce ? 0 : 1.0);
    Array.prototype.forEach.call(modesEl.children, function (b) { b.classList.toggle('on', b.dataset.id === id); });
    if (!rebuild) HL.home();
    if (HL.contentReady) HL.active.enter();
    HL.refreshTools();
  }
  HL.setMode = setMode;
  HL.refreshTools = function () {
    toolsEl.innerHTML = '';
    if (HL.active && HL.contentReady && HL.active.tools) HL.active.tools(toolsEl);
    placeInfo();
  };
  /* small DOM helpers for mode toolbars */
  HL.ui = {
    chip: function (parent, label, on, fn, title) { var b = document.createElement('button'); b.type = 'button'; b.className = 'chip' + (on ? ' on' : ''); b.textContent = label; if (title) b.title = title; b.onclick = fn; parent.appendChild(b); return b; },
    sep: function (parent) { var s = document.createElement('span'); s.className = 'sep'; parent.appendChild(s); },
    lab: function (parent, t) { var s = document.createElement('span'); s.className = 'lab'; s.textContent = t; parent.appendChild(s); }
  };
  toolsEl.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
  modesEl.addEventListener('pointerdown', function (e) { e.stopPropagation(); });

  /* ───────────────────────── input: mouse + touch ───────────────────────── */
  var ptrs = {}, gesture = null;
  function pcount() { return Object.keys(ptrs).length; }
  canvas.addEventListener('pointerdown', function (e) {
    canvas.focus({ preventScroll: true }); el('settings').classList.remove('on');
    if (boot.state === 'idle') { startBoot(); return; }
    if (boot.state === 'booting') { startBoot(); return; }
    try { canvas.setPointerCapture(e.pointerId); } catch (er) {}
    ptrs[e.pointerId] = { x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY };
    var n = pcount();
    if (n === 1) {
      var hit = HL.active && HL.contentReady && HL.active.pick ? HL.active.pick(e.clientX, e.clientY) : null;
      gesture = { type: 'one', hit: hit, moved: false, x0: e.clientX, y0: e.clientY, t0: performance.now(), button: e.button, shift: e.shiftKey || e.altKey, dragging: false, vx: 0 };
    } else if (n === 2) {
      if (gesture && gesture.dragging && HL.active.dragEnd) HL.active.dragEnd(gesture.hit);
      var p = twoPts(); gesture = { type: 'two', d0: p.d, a0: p.a, mx: p.mx, my: p.my, dist0: cam.g.dist };
    }
  });
  function twoPts() { var k = Object.keys(ptrs), a = ptrs[k[0]], b = ptrs[k[1]]; return { d: Math.hypot(a.x - b.x, a.y - b.y) || 1, a: Math.atan2(b.y - a.y, b.x - a.x), mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 }; }
  canvas.addEventListener('pointermove', function (e) {
    var p = ptrs[e.pointerId]; if (!p) return;
    var dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY;
    if (!gesture) return;
    if (gesture.type === 'one') {
      if (!gesture.moved && Math.hypot(e.clientX - gesture.x0, e.clientY - gesture.y0) > 6) {
        gesture.moved = true;
        if (gesture.hit && gesture.hit.drag && HL.active.dragStart && !gesture.shift) { gesture.dragging = true; HL.active.dragStart(gesture.hit, gesture.x0, gesture.y0); }
        else if (gesture.hit && gesture.hit.spin && HL.active.spinStart) { gesture.spinning = true; HL.active.spinStart(gesture.hit); }
      }
      if (!gesture.moved) return;
      if (gesture.dragging) HL.active.dragMove(gesture.hit, e.clientX, e.clientY);
      else if (gesture.spinning) { HL.active.spinMove(gesture.hit, dx, dy); }
      else if (gesture.shift && gesture.hit && HL.active.twist) HL.active.twist(dx * 0.012);
      else if (gesture.button === 2 || (e.shiftKey && !gesture.hit)) pan(dx, dy);
      else if (HL.active && HL.active.emptyDrag && HL.active.emptyDrag(dx, dy)) { gesture.vx = dx; }
      else { cam.g.az -= dx * 0.006; cam.g.el += dy * 0.004; limits(); }
    } else if (gesture.type === 'two' && pcount() >= 2) {
      var q = twoPts();
      cam.g.dist = gesture.dist0 * gesture.d0 / q.d;
      pan(q.mx - gesture.mx, q.my - gesture.my); gesture.mx = q.mx; gesture.my = q.my;
      var da = q.a - gesture.a0; if (da > Math.PI) da -= 2 * Math.PI; if (da < -Math.PI) da += 2 * Math.PI;
      if (Math.abs(da) > 0.001 && HL.active && HL.active.twist) HL.active.twist(-da);
      gesture.a0 = q.a; limits();
    }
  });
  function pan(dx, dy) {
    var s = cam.dist / innerHeight * 1.1, r = new T.Vector3(), u = new T.Vector3();
    r.setFromMatrixColumn(camera.matrix, 0); u.setFromMatrixColumn(camera.matrix, 1);
    cam.g.tgt.addScaledVector(r, -dx * s).addScaledVector(u, dy * s); limits();
  }
  function up(e) {
    if (!ptrs[e.pointerId]) return;
    delete ptrs[e.pointerId];
    if (!gesture) return;
    if (gesture.type === 'one') {
      if (gesture.dragging) HL.active.dragEnd(gesture.hit);
      else if (gesture.spinning) { if (HL.active.spinEnd) HL.active.spinEnd(gesture.hit); }
      else if (!gesture.moved && e.type === 'pointerup' && HL.active && HL.contentReady && HL.active.tap) HL.active.tap(gesture.hit, e.clientX, e.clientY);
      else if (gesture.moved && HL.active && HL.active.emptyDragEnd) HL.active.emptyDragEnd(gesture.vx);
      gesture = null;
    } else if (gesture.type === 'two') { if (pcount() < 2) gesture = null; }
  }
  canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
  canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  canvas.addEventListener('wheel', function (e) {
    e.preventDefault(); if (boot.state === 'idle') return;
    if (e.ctrlKey) cam.g.dist *= Math.exp(e.deltaY * 0.01); else cam.g.dist *= Math.exp(e.deltaY * 0.0012); limits();
  }, { passive: false });
  // Safari trackpad pinch
  canvas.addEventListener('gesturestart', function (e) { e.preventDefault(); }); canvas.addEventListener('gesturechange', function (e) { e.preventDefault(); });
  addEventListener('keydown', function (e) {
    if (/INPUT|TEXTAREA|SELECT/.test((e.target && e.target.tagName) || '')) return;
    if (boot.state === 'idle' && (e.key === 'Enter' || e.key === ' ')) { startBoot(); return; }
    if (e.key === 'Escape') { if (HL.detail.item) HL.detail.close(); else if (HL.active && HL.active.tap) HL.active.tap(null); }
    var n = parseInt(e.key, 10); if (n >= 1 && n <= HL.modeOrder.length) setMode(HL.modeOrder[n - 1]);
  });

  /* ───────────────────────── loop ───────────────────────── */
  var statsEl = el('stats'); if (DEBUG) statsEl.style.display = 'block';
  var last = performance.now(), t0 = last, frames = 0, ftAcc = 0, adaptT = 0, fps = 60, running = false, rafId = 0, slowStreak = 0;
  function frame(ms) {
    rafId = requestAnimationFrame(frame);
    var dt = clamp((ms - last) / 1000, 0, 0.05); last = ms;
    HL.now = (ms - t0) / 1000; U.uTime.value = HL.now;
    var reduce = layout.settings.reduce;
    U.uFlick.value = reduce ? 1 : 0.965 + 0.035 * Math.sin(HL.now * 31.0) * Math.sin(HL.now * 7.3) + (Math.sin(HL.now * 0.71) > 0.995 ? -0.12 : 0);
    bootStep(dt); camStep(dt);
    gr1.rotation.z += dt * (reduce ? 0.01 : 0.06); gr2.rotation.z -= dt * (reduce ? 0.02 : 0.15);
    if (HL.active && HL.contentReady && HL.active.update) HL.active.update(dt, HL.now);
    renderer.render(scene, camera);
    frames++; ftAcc += dt; adaptT += dt;
    if (adaptT > 2) {
      fps = frames / Math.max(ftAcc, 1e-3);
      if (fps < 45 && pr > 1) { slowStreak++; if (slowStreak >= 1) { pr = Math.max(1, pr - 0.25); renderer.setPixelRatio(pr); dust.material.uniforms.uPR.value = pr; resize(); slowStreak = 0; } }
      else if (fps > 58 && pr < MAXPR) { pr = Math.min(MAXPR, pr + 0.25); renderer.setPixelRatio(pr); dust.material.uniforms.uPR.value = pr; resize(); }
      frames = 0; ftAcc = 0; adaptT = 0;
    }
    if (DEBUG) { var inf = renderer.info.render; statsEl.textContent = 'fps ' + fps.toFixed(0) + '  pr ' + pr + '\ncalls ' + inf.calls + '  tris ' + inf.triangles + '\nmode ' + (HL.active && HL.active.id); }
  }
  function run() { if (running) return; running = true; last = performance.now(); rafId = requestAnimationFrame(frame); }
  function stop() { running = false; cancelAnimationFrame(rafId); }
  document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else run(); });

  /* ───────────────────────── start ───────────────────────── */
  HL.start = function () {
    HL.modeOrder.forEach(function (id) {
      var m = HL.modes[id], b = document.createElement('button'); b.type = 'button'; b.dataset.id = id;
      b.innerHTML = '<b></b><small></small>'; b.children[0].textContent = m.zh; b.children[1].textContent = m.en;
      b.onclick = function () { setMode(id); }; modesEl.appendChild(b);
    });
    applySettings(); resize();
    addEventListener('resize', resize); addEventListener('orientationchange', function () { setTimeout(resize, 200); });
    HL.active = null;
    var want = HL.modes[layout.mode] ? layout.mode : 'panels';
    Array.prototype.forEach.call(modesEl.children, function (b) { b.classList.toggle('on', b.dataset.id === want); });
    if (EMBED) {
      post({ holo: 1, op: 'ready' });
      setTimeout(function () { if (!gotReal) setContent(sampleData(), true); }, 1500);
    } else setContent(sampleData(), true);
    if (/[?&]boot=1/.test(location.search)) startBoot();
    run();
  };

  HL.stats = function () { var i = renderer.info; return { calls: i.render.calls, triangles: i.render.triangles, textures: i.memory.textures, geometries: i.memory.geometries, pr: pr, fps: Math.round(fps), mode: HL.active && HL.active.id, boot: boot.state }; };
  HL.normalize = normalize; HL.sampleData = sampleData;
})();
