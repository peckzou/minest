/* Minest Duo Holographic Portal — 主逻辑
 * 模式 1 Hologram / 2 Passthrough / 3 Duo Portal 共用同一场景、模型和材质。 */
(function () {
  'use strict';
  var T = THREE, H = window.HOLO;
  function $(id) { return document.getElementById(id); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function rad(d) { return d * Math.PI / 180; }

  var canvas = $('gl'), video = $('bg-video'), body = document.body, root = document.documentElement;

  /* ---------- 设置（校准值持久化；模式不持久化，避免一打开就弹权限） ---------- */
  var LS = 'minest.hologram.v1';
  var DEF = { scan: true, flicker: true, particles: true, hover: 0.25, size: 1, opacity: 1, crease: 0.5, angle: 100, elev: 38,
    track: true, flipX: false, flipY: false, gain: 1, camZoom: 1 };
  var S = Object.assign({}, DEF);
  try { Object.assign(S, JSON.parse(localStorage.getItem(LS) || '{}')); } catch (e) {}
  function save() { try { localStorage.setItem(LS, JSON.stringify(S)); } catch (e) {} }
  var mode = 1;

  /* ---------- 渲染器与场景 ---------- */
  var renderer;
  try {
    renderer = new T.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
  } catch (e) {
    $('hint').textContent = '此浏览器无法创建 WebGL 上下文'; $('hint').classList.remove('gone');
    return;
  }
  renderer.setClearColor(0x000000, 0);
  renderer.autoClear = false;

  var scene = new T.Scene();
  var stage = new T.Group(); scene.add(stage);       // 底座 + 模型整体
  var pivot = new T.Group(); stage.add(pivot);       // 模型旋转/缩放中心
  var holoMat = H.hologramMaterial();
  var models = H.models();
  var mesh = new T.Mesh(models[0].geo, holoMat); mesh.frustumCulled = false; pivot.add(mesh);
  var ring = H.ringMesh(); ring.position.y = 0.002; stage.add(ring);
  var beam = H.beamMesh(); stage.add(beam);
  var parts = H.particles(260); stage.add(parts);
  var grid = H.gridMesh(); grid.visible = false; scene.add(grid);

  var camMain = new T.PerspectiveCamera(32, 1, 0.1, 200);
  var camUp = new T.PerspectiveCamera(), camLo = new T.PerspectiveCamera();

  /* ---------- 展品状态 ---------- */
  var cur = 0, phase = 'in', reveal = 0, dissolve = 0, pending = -1;
  var yaw = 0.55, pitch = 0, lastTouch = -10, time = 0;

  function applyModel(i) {
    cur = i;
    var m = models[i], bb = m.geo.boundingBox;
    mesh.geometry = m.geo;
    holoMat.uniforms.uY0.value = bb.min.y; holoMat.uniforms.uY1.value = bb.max.y;
    mesh.position.y = -(bb.min.y + bb.max.y) / 2;
    $('exhibit-name').textContent = m.name;
    var d = $('dots'); d.innerHTML = '';
    models.forEach(function (_, k) { var b = document.createElement('b'); if (k === i) b.className = 'on'; d.appendChild(b); });
  }
  function nextModel(i) {
    pending = (i == null ? (cur + 1) % models.length : i);
    if (phase !== 'out') { phase = 'out'; dissolve = 0; }
  }
  function replay() { phase = 'in'; reveal = 0; dissolve = 0; }

  /* ---------- 布局：模式、折痕、离轴投影 ---------- */
  var W = 0, Hh = 0, L = { upB: 0, loT: 0, src: 'manual' };

  function readSegments() {
    // Chromium 双屏/折叠屏才有；WebKit 没有 → 返回 null，用手动校准
    try {
      var segs = (window.visualViewport && window.visualViewport.segments) ||
                 (window.getWindowSegments && window.getWindowSegments());
      if (segs && segs.length === 2 && segs[0].top !== segs[1].top) {
        var a = segs[0].top < segs[1].top ? segs[0] : segs[1], b = a === segs[0] ? segs[1] : segs[0];
        return { upB: a.top + a.height, loT: b.top };
      }
      if (segs && segs.length === 2) return { sideBySide: true };
    } catch (e) {}
    return null;
  }
  function posture() {
    try { return navigator.devicePosture ? navigator.devicePosture.type : null; } catch (e) { return null; }
  }

  // 广义离轴透视（Kooima）：把一块屏幕当成固定视点下的"窗口"
  var _va = new T.Vector3(), _vb = new T.Vector3(), _vc = new T.Vector3();
  var _vr = new T.Vector3(), _vu = new T.Vector3(), _vn = new T.Vector3(), _m = new T.Matrix4();
  function offAxis(cam, pa, pb, pc, pe) {
    _vr.subVectors(pb, pa).normalize(); _vu.subVectors(pc, pa).normalize();
    _vn.crossVectors(_vr, _vu).normalize();
    _va.subVectors(pa, pe); _vb.subVectors(pb, pe); _vc.subVectors(pc, pe);
    var d = -_va.dot(_vn); if (d < 0.01) d = 0.01;
    var n = 0.5, f = 400, k = n / d;
    cam.projectionMatrix.makePerspective(_vr.dot(_va) * k, _vr.dot(_vb) * k, _vu.dot(_vc) * k, _vu.dot(_va) * k, n, f);
    cam.projectionMatrixInverse.copy(cam.projectionMatrix).invert();
    cam.position.copy(pe);
    cam.quaternion.setFromRotationMatrix(_m.makeBasis(_vr, _vu, _vn));
    cam.updateMatrixWorld(true);
  }

  /* ---------- 视点：默认是固定假设视点；App 里有头部追踪时跟着头走 ---------- */
  var PX_PER_M = 6450;                         // iPhone 的 CSS px ≈ 0.155 mm
  var P = { upp: 0.01, Ww: 4, Hu: 3, Hl: 3, dist: 9 };
  var head = { ref: null, tAz: 0, tEl: 0, tD: 0.37, az: 0, el: 0, d: 0.37, last: -10, seen: false, avail: false };
  var _pe = new T.Vector3(), _a = new T.Vector3(), _b = new T.Vector3(), _c = new T.Vector3();

  function onHead(ev) {
    if (ev.lost) { head.seen = false; return; }
    var a = ev.a || 0.75, fov = rad(ev.fov || 70), t = Math.tan(fov / 2);
    var fx = a < 1 ? 2 * Math.atan(t * a) : fov, fy = a < 1 ? fov : 2 * Math.atan(t / a);
    var ax = (ev.x - 0.5) * fx, ay = (ev.y - 0.5) * fy;                 // 相对前置摄像头光轴的角度
    if (S.flipX) ax = -ax;
    if (S.flipY) ay = -ay;
    if (!head.ref) head.ref = { ax: ax, ay: ay };                        // 第一帧 / 校准后：当前位置算"正中"
    head.tAz = clamp((ax - head.ref.ax) * S.gain, -1.1, 1.1);
    head.tEl = clamp((ay - head.ref.ay) * S.gain, -0.6, 0.9);
    head.tD = clamp(0.075 / Math.tan(Math.max(0.02, ev.w * fx / 2)), 0.18, 1.0);   // 人脸宽约 15 cm → 距离（米）
    head.last = time; head.seen = true;
  }
  function headActive() { return S.track && head.seen && time - head.last < 0.8; }
  function stepHead(dt) {
    var on = headActive(), k = 1 - Math.exp(-dt / (on ? 0.07 : 0.35));
    head.az += ((on ? head.tAz : 0) - head.az) * k;
    head.el += ((on ? head.tEl : 0) - head.el) * k;
    head.d += ((on ? head.tD : 0.37) - head.d) * k;
  }
  // Duo：两块屏各自的离轴相机
  function portalCams() {
    var D = head.d * PX_PER_M * P.upp, e = clamp(rad(S.elev) + head.el, 0.08, 1.45), phi = Math.PI - rad(S.angle);
    _pe.set(D * Math.sin(head.az) * Math.cos(e), D * Math.sin(e), D * Math.cos(head.az) * Math.cos(e));
    var hw = P.Ww / 2;
    offAxis(camLo, _a.set(-hw, 0, P.Hl), _b.set(hw, 0, P.Hl), _c.set(-hw, 0, 0), _pe);
    offAxis(camUp, _a.set(-hw, 0, 0), _b.set(hw, 0, 0), _c.set(-hw, P.Hu * Math.sin(phi), -P.Hu * Math.cos(phi)), _pe);
  }
  // 模式 1 / 2：相机绕展品做小幅视差
  function mainCam() {
    var e = Math.atan(0.22) + head.el * 0.6, az = head.az * 0.6, d = P.dist * Math.sqrt(1 + 0.22 * 0.22);
    camMain.position.set(d * Math.sin(az) * Math.cos(e), 1.0 + d * Math.sin(e), d * Math.cos(az) * Math.cos(e));
    camMain.lookAt(0, 1.0, 0);
  }

  var needLayout = true;
  function layout() {
    needLayout = false;
    var w = window.innerWidth, h = window.innerHeight;
    if (!w || !h) return;
    if (w !== W || h !== Hh) { W = w; Hh = h; renderer.setSize(W, Hh, false); }

    var seg = readSegments();
    if (seg && seg.upB != null) { L.upB = seg.upB; L.loT = seg.loT; L.src = 'segments'; }
    else { L.upB = L.loT = Math.round(Hh * S.crease); L.src = seg && seg.sideBySide ? 'side' : 'manual'; }
    root.style.setProperty('--crease-y', L.upB + 'px');
    root.style.setProperty('--lower-top', L.loT + 'px');

    if (mode === 3) {
      var loH = Hh - L.loT;
      var upp = 4.4 / Math.min(W, 1.5 * L.upB, 1.5 * loH);        // 世界单位 / CSS px
      var Ww = W * upp, Hu = L.upB * upp, Hl = loH * upp;
      var sab = parseFloat(getComputedStyle(root).getPropertyValue('--sab')) || 0;   // App 注入的底部安全区
      var fit = Math.min(1, (Hl - (66 + sab) * upp) / 2.5, Ww / 2.8);   // 给底部控制条留位置
      var zc = 1.2 * fit + 0.05;                                 // 光环贴近折痕
      stage.position.set(0, 0, zc); stage.scale.setScalar(fit);
      // 固定假设视点：约 40cm（≈2400 CSS px）外、仰角 elev。不做头/眼追踪。
      P.upp = upp; P.Ww = Ww; P.Hu = Hu; P.Hl = Hl;
      portalCams();
      grid.visible = true; grid.scale.set(Ww, 1, Hl); grid.position.set(0, 0, Hl / 2);
      grid.material.uniforms.uCenter.value.set(0, zc);
      grid.material.uniforms.uCell.value = 0.3 * fit;
    } else {
      stage.position.set(0, 0, 0); stage.scale.setScalar(1);
      grid.visible = false;
      var asp = W / Hh, t = Math.tan(rad(camMain.fov / 2));
      var dist = Math.max(1.85 / t, 1.5 / (t * asp)) * 1.04;
      camMain.aspect = asp;
      P.dist = dist;
      camMain.updateProjectionMatrix();
      mainCam();
    }
    sendRect();
    updateInfo();
  }
  function askLayout() { needLayout = true; }

  /* ---------- 摄像头（Passthrough） ---------- */
  var cam = { state: 'idle', stream: null, facing: '' };
  var CAM_TEXT = {
    requesting: '正在请求摄像头权限…',
    denied: '摄像头权限被拒绝 · DEMO 背景（点此重试）',
    nocamera: '未找到摄像头 · DEMO 背景（点此重试）',
    insecure: '需要 HTTPS 或 localhost 才能用摄像头 · DEMO 背景',
    unsupported: '此浏览器不支持摄像头 · DEMO 背景',
    busy: '摄像头被占用 · DEMO 背景（点此重试）',
    error: '摄像头启动失败 · DEMO 背景（点此重试）'
  };
  function wantsCamera() { return mode === 2 || mode === 3; }

  // App 内：后置画面和前置头部追踪都由原生层做（WebKit 不能同时开前后摄像头）
  var bridge = window.__isMinestNative && window.webkit && window.webkit.messageHandlers &&
               window.webkit.messageHandlers.minestBridge;
  var nat = { ok: !!bridge, on: false, timer: 0, rect: '' };
  function nsend(action, payload) {
    try { bridge.postMessage(Object.assign({ action: action }, payload || {})); } catch (e) { nat.ok = false; }
  }
  function camRect() { return { x: 0, y: 0, w: W, h: mode === 3 ? L.upB : Hh, zoom: S.camZoom }; }
  function sendRect() {
    video.style.transform = S.camZoom > 1 ? 'scale(' + S.camZoom + ')' : '';
    if (!nat.on) return;
    var r = camRect(), key = [r.w, r.h, r.zoom].join(',');
    if (key !== nat.rect) { nat.rect = key; nsend('holoRect', r); }
  }
  function nativeCamEvent(ev) {
    clearTimeout(nat.timer);
    if (!nat.on) return;
    if (ev.state === 'requesting') return;
    if (ev.state === 'live') {
      if (!wantsCamera()) { stopCamera(); return; }
      cam.stream = { native: true }; cam.facing = 'environment'; head.avail = !!ev.tracking;
      root.classList.add('native-cam'); nat.rect = ''; setCam('live'); sendRect();
    } else {
      nat.on = false; cam.stream = null; head.avail = false; root.classList.remove('native-cam');
      setCam(ev.state || 'error');
    }
  }
  window.HOLO.nativeEvent = function (ev) {
    if (!ev) return;
    if (ev.type === 'head') onHead(ev); else if (ev.type === 'cam') nativeCamEvent(ev);
  };
  function setCam(state) {
    cam.state = state;
    var chip = $('cam-chip');
    if (!wantsCamera()) { chip.hidden = true; body.dataset.bg = 'none'; return; }
    chip.hidden = false; chip.dataset.state = state;
    if (state === 'live') {
      chip.textContent = '● 实时摄像头' + (cam.facing === 'environment' ? '（后置）' : cam.facing === 'user' ? '（前置）' : '') +
        (head.avail && S.track ? ' · 头部追踪' : '');
      body.dataset.bg = 'video';
    } else if (state === 'requesting' || state === 'idle') {
      chip.textContent = CAM_TEXT.requesting; body.dataset.bg = 'none';
    } else {
      chip.textContent = CAM_TEXT[state] || CAM_TEXT.error; body.dataset.bg = 'demo';
    }
    updateInfo();
  }
  function stopCamera() {
    if (nat.on) {
      clearTimeout(nat.timer); nat.on = false; nsend('holoStop');
      cam.stream = null; head.avail = false; head.seen = false; root.classList.remove('native-cam');
    }
    if (cam.stream) { cam.stream.getTracks().forEach(function (t) { t.onended = null; t.stop(); }); cam.stream = null; }
    try { video.pause(); } catch (e) {}
    video.srcObject = null;
    cam.state = 'idle';
  }
  function startCamera() {
    if (cam.stream || cam.state === 'requesting') return;
    if (nat.ok) {
      nat.on = true; nat.rect = ''; setCam('requesting');
      nsend('holoStart', Object.assign(camRect(), { tracking: true }));
      // 原生层没有任何回应（旧版 App）→ 退回网页摄像头
      nat.timer = setTimeout(function () {
        if (nat.on && cam.state === 'requesting') { nat.on = false; nat.ok = false; cam.state = 'idle'; startCamera(); }
      }, 2500);
      return;
    }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCam(window.isSecureContext ? 'unsupported' : 'insecure'); return;
    }
    setCam('requesting');
    navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } }
    }).then(function (stream) {
      if (!wantsCamera() || document.hidden) {           // 权限弹窗期间已切走
        stream.getTracks().forEach(function (t) { t.stop(); }); cam.state = 'idle'; return;
      }
      cam.stream = stream;
      var tr = stream.getVideoTracks()[0];
      try { cam.facing = (tr.getSettings && tr.getSettings().facingMode) || ''; } catch (e) { cam.facing = ''; }
      tr.onended = function () { stopCamera(); setCam('error'); };
      video.srcObject = stream;
      var p = video.play(); if (p && p.catch) p.catch(function () {});
      setCam('live');
    }).catch(function (err) {
      var n = (err && err.name) || '';
      cam.stream = null;
      setCam(n === 'NotAllowedError' || n === 'SecurityError' || n === 'PermissionDeniedError' ? 'denied'
        : n === 'NotFoundError' || n === 'DevicesNotFoundError' || n === 'OverconstrainedError' ? 'nocamera'
        : n === 'NotReadableError' || n === 'TrackStartError' || n === 'AbortError' ? 'busy' : 'error');
    });
  }

  function setMode(m) {
    mode = m; body.dataset.mode = String(m);
    Array.prototype.forEach.call(document.querySelectorAll('.seg button'), function (b) {
      b.classList.toggle('on', +b.dataset.mode === m);
    });
    if (wantsCamera()) { if (cam.stream) setCam('live'); else startCamera(); }
    else { stopCamera(); setCam('idle'); }
    askLayout();
  }

  /* ---------- 交互：拖动旋转 / 双指缩放 / 轻点切换 / 长按面板 ---------- */
  var pts = new Map(), g = null, lpTimer = 0, pinch0 = 0, size0 = 1;
  function pinchDist() { var a = Array.from(pts.values()); return Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y) || 1; }
  function touched() { lastTouch = time; $('hint').classList.add('gone'); }

  canvas.addEventListener('pointerdown', function (e) {
    try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pts.size === 1) {
      g = { x0: e.clientX, y0: e.clientY, t0: performance.now(), moved: false, multi: false, long: false };
      clearTimeout(lpTimer);
      lpTimer = setTimeout(function () {
        if (g && !g.moved && !g.multi && pts.size === 1) { g.long = true; openPanel(true); }
      }, 550);
    } else if (pts.size === 2 && g) {
      g.multi = true; clearTimeout(lpTimer); pinch0 = pinchDist(); size0 = S.size;
    }
    touched();
  });
  canvas.addEventListener('pointermove', function (e) {
    var p = pts.get(e.pointerId); if (!p || !g) return;
    var dx = e.clientX - p.x, dy = e.clientY - p.y;
    p.x = e.clientX; p.y = e.clientY;
    if (pts.size >= 2) {
      S.size = clamp(size0 * pinchDist() / pinch0, 0.5, 2); syncUI(); touched(); return;
    }
    if (g.multi) return;
    if (!g.moved && Math.hypot(e.clientX - g.x0, e.clientY - g.y0) > 8) { g.moved = true; clearTimeout(lpTimer); }
    if (g.moved && !g.long) {
      yaw += dx * 0.011; pitch = clamp(pitch + dy * 0.007, -0.7, 0.7); touched();
    }
  });
  function pointerEnd(e) {
    if (!pts.has(e.pointerId)) return;
    pts.delete(e.pointerId);
    if (pts.size === 0 && g) {
      clearTimeout(lpTimer);
      var tap = e.type === 'pointerup' && !g.moved && !g.multi && !g.long && performance.now() - g.t0 < 400;
      g = null;
      if (tap) { if (!$('panel').hidden) openPanel(false); else nextModel(); }
      save();
    }
  }
  canvas.addEventListener('pointerup', pointerEnd);
  canvas.addEventListener('pointercancel', pointerEnd);
  canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  canvas.addEventListener('wheel', function (e) {
    e.preventDefault(); S.size = clamp(S.size * Math.exp(-e.deltaY * 0.0012), 0.5, 2); syncUI(); touched(); save();
  }, { passive: false });
  // iOS Safari 的页面级捏合缩放
  document.addEventListener('gesturestart', function (e) { e.preventDefault(); });

  function resetView() { yaw = 0.55; pitch = 0; S.size = 1; S.hover = DEF.hover; syncUI(); save(); }

  /* ---------- 面板 ---------- */
  function openPanel(on) { $('panel').hidden = !on; if (on) $('hint').classList.add('gone'); }
  function bindToggle(id, key) {
    $(id).addEventListener('change', function () { S[key] = this.checked; save(); });
  }
  function bindSlider(id, key, relayout) {
    $(id).addEventListener('input', function () { S[key] = parseFloat(this.value); syncUI(true); save(); if (relayout) askLayout(); });
  }
  function syncUI(skipInputs) {
    if (!skipInputs) {
      $('t-scan').checked = S.scan; $('t-flicker').checked = S.flicker; $('t-particles').checked = S.particles;
      $('t-track').checked = S.track; $('t-flipX').checked = S.flipX; $('t-flipY').checked = S.flipY;
      ['hover', 'size', 'opacity', 'crease', 'angle', 'elev', 'camZoom', 'gain'].forEach(function (k) { $('s-' + k).value = S[k]; });
    }
    $('v-hover').textContent = S.hover.toFixed(2);
    $('v-size').textContent = S.size.toFixed(2) + '×';
    $('v-opacity').textContent = Math.round(S.opacity * 100) + '%';
    $('v-crease').textContent = Math.round(S.crease * 100) + '%';
    $('v-angle').textContent = Math.round(S.angle) + '°';
    $('v-elev').textContent = Math.round(S.elev) + '°';
    $('v-camZoom').textContent = S.camZoom.toFixed(2) + '×';
    $('v-gain').textContent = S.gain.toFixed(2) + '×';
  }
  function updateInfo() {
    var p = posture();
    $('duo-info').textContent =
      (L.src === 'segments' ? '折痕：系统分区' : L.src === 'side' ? '检测到左右分屏，请转成上下姿态' : '折痕：手动') +
      ' · 姿态：' + (p || '无 API');
    $('s-crease').disabled = L.src === 'segments';
    $('track-info').textContent = !nat.ok ? '仅 App 内可用' : !head.avail ? (cam.state === 'live' ? '此设备不支持双摄同开' : '未启动')
      : !S.track ? '已关闭' : headActive() ? '追踪中 · ' + Math.round(head.d * 100) + ' cm' : '未检测到人脸';
  }
  bindToggle('t-scan', 'scan'); bindToggle('t-flicker', 'flicker'); bindToggle('t-particles', 'particles');
  bindSlider('s-hover', 'hover'); bindSlider('s-size', 'size'); bindSlider('s-opacity', 'opacity');
  bindToggle('t-track', 'track'); bindToggle('t-flipX', 'flipX'); bindToggle('t-flipY', 'flipY');
  ['t-flipX', 't-flipY'].forEach(function (id) { $(id).addEventListener('change', function () { head.ref = null; }); });
  $('t-track').addEventListener('change', function () { if (cam.stream) setCam('live'); });
  bindSlider('s-camZoom', 'camZoom', true); bindSlider('s-gain', 'gain');
  $('b-recenter').addEventListener('click', function () { head.ref = null; });
  bindSlider('s-crease', 'crease', true); bindSlider('s-angle', 'angle', true); bindSlider('s-elev', 'elev', true);
  $('b-reset').addEventListener('click', resetView);
  $('b-replay').addEventListener('click', replay);
  $('b-cam').addEventListener('click', function () { if (wantsCamera() && !cam.stream) { cam.state = 'idle'; startCamera(); } });
  $('cam-chip').addEventListener('click', function () { if (wantsCamera() && !cam.stream) { cam.state = 'idle'; startCamera(); } });
  $('p-close').addEventListener('click', function () { openPanel(false); });
  $('gear').addEventListener('click', function () { openPanel($('panel').hidden); });
  $('exhibit').addEventListener('click', function () { nextModel(); touched(); });
  Array.prototype.forEach.call(document.querySelectorAll('.seg button'), function (b) {
    b.addEventListener('click', function () { setMode(+b.dataset.mode); });
  });
  window.addEventListener('keydown', function (e) {
    if (e.key === '1' || e.key === '2' || e.key === '3') setMode(+e.key);
    else if (e.key === ' ' || e.key === 'ArrowRight') nextModel();
    else if (e.key === 'r') resetView();
    else if (e.key === 'p') openPanel($('panel').hidden);
    else if (e.key === 'Escape') openPanel(false);
  });

  /* ---------- 旋转 / 折叠 / 可见性 ---------- */
  window.addEventListener('resize', askLayout);
  window.addEventListener('orientationchange', askLayout);
  if (window.visualViewport) window.visualViewport.addEventListener('resize', askLayout);
  try { if (navigator.devicePosture) navigator.devicePosture.addEventListener('change', askLayout); } catch (e) {}
  var resumeCam = false;
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { resumeCam = !!cam.stream; stopCamera(); }
    else { last = 0; if (resumeCam && wantsCamera()) startCamera(); resumeCam = false; askLayout(); }
  });
  window.addEventListener('pagehide', stopCamera);
  canvas.addEventListener('webglcontextlost', function (e) { e.preventDefault(); });
  canvas.addEventListener('webglcontextrestored', askLayout);

  /* ---------- 动态分辨率：按帧时间调渲染像素比 ---------- */
  var res = 1, acc = 0, cnt = 0, good = 0, hold = 0, fps = 0;
  function basePR() { return Math.min(window.devicePixelRatio || 1, 2); }
  function applyRes() { renderer.setPixelRatio(basePR() * res); }
  function perf(ms, now) {
    if (ms > 250 || ms <= 0) return;                 // 切后台 / 首帧
    acc += ms; cnt++;
    if (cnt < 45) return;
    var avg = acc / cnt; acc = 0; cnt = 0; fps = 1000 / avg;
    if (avg > 21 && res > 0.5) { res = Math.max(0.5, res * 0.85); applyRes(); good = 0; hold = now + 4000; }
    else if (avg < 17.6 && res < 1 && now > hold) { if (++good >= 3) { res = Math.min(1, res * 1.12); applyRes(); good = 0; } }
    else good = 0;
    if (!$('panel').hidden) {
      $('stats').textContent = Math.round(fps) + ' FPS · 渲染 ' + Math.round(W * basePR() * res) + '×' +
        Math.round(Hh * basePR() * res) + '（' + Math.round(res * 100) + '%）';
    }
  }

  /* ---------- 主循环 ---------- */
  var last = 0, U = holoMat.uniforms, SH = H.shared, frameNo = 0;
  function ease(t) { return t * t * (3 - 2 * t); }
  function frame(now) {
    requestAnimationFrame(frame);
    var ms = last ? now - last : 16.7; last = now;
    var dt = Math.min(0.1, ms / 1000); time += dt;
    perf(ms, now);
    if (needLayout || window.innerWidth !== W || window.innerHeight !== Hh) layout();
    if (!W) return;

    // 生成 / 解体状态机
    if (phase === 'in') {
      reveal += dt / 1.8;
      if (reveal >= 1) { phase = 'idle'; U.uReveal.value = 2; } else U.uReveal.value = ease(reveal) * 1.01;
      U.uDissolve.value = 0;
    } else if (phase === 'out') {
      dissolve += dt / 0.85; U.uDissolve.value = Math.min(1, dissolve);
      if (dissolve >= 1) { applyModel(pending < 0 ? cur : pending); pending = -1; replay(); U.uReveal.value = 0; U.uDissolve.value = 0; }
    }
    SH.uPower.value += ((phase === 'idle' ? 1 : 1.9) - SH.uPower.value) * Math.min(1, dt * 5);
    SH.uTime.value = time;
    U.uScan.value = S.scan ? 1 : 0; U.uFlicker.value = S.flicker ? 1 : 0; U.uOpacity.value = S.opacity;
    parts.visible = S.particles;

    // 模型姿态
    var m = models[cur], bb = m.geo.boundingBox, hh = (bb.max.y - bb.min.y) / 2;
    if (!g && time - lastTouch > 3) yaw += dt * 0.25;      // 闲置时缓慢自转
    pivot.rotation.set(pitch, yaw, 0);
    pivot.scale.setScalar(S.size);
    pivot.position.y = S.hover + m.lift + hh * S.size + (m.bob ? Math.sin(time * 1.3) * 0.04 : 0);

    // 视点
    stepHead(dt);
    if (mode === 3) portalCams(); else mainCam();
    if (!$('panel').hidden && (frameNo++ % 20) === 0) updateInfo();

    // 渲染
    var pr = renderer.getPixelRatio();
    renderer.setScissorTest(false); renderer.setViewport(0, 0, W, Hh); renderer.clear();
    if (mode !== 3) {
      SH.uViewH.value = Hh * pr;
      renderer.render(scene, camMain);
    } else {
      renderer.setScissorTest(true);
      var loH = Hh - L.loT;
      renderer.setViewport(0, Hh - L.upB, W, L.upB); renderer.setScissor(0, Hh - L.upB, W, L.upB);
      SH.uViewH.value = L.upB * pr; grid.visible = false;
      renderer.render(scene, camUp);
      renderer.setViewport(0, 0, W, loH); renderer.setScissor(0, 0, W, loH);
      SH.uViewH.value = loH * pr; grid.visible = true;
      renderer.render(scene, camLo);
    }
  }

  /* ---------- 在 Minest App 里：返回按钮 ---------- */
  if (window.__isMinestNative) {
    $('back').hidden = false;
    $('back').addEventListener('click', function () {
      stopCamera();
      if (history.length > 1) history.back(); else location.href = 'iphone18.0.html';
    });
  }

  /* ---------- 启动 ---------- */
  var qx = /[?&]ex=(\d+)/.exec(location.search);
  applyRes(); applyModel(qx && +qx[1] < models.length ? +qx[1] : 0); syncUI();
  var q = /[?&]mode=([123])/.exec(location.search);
  setMode(q ? +q[1] : 1);
  setTimeout(function () { $('hint').classList.add('gone'); }, 7000);
  requestAnimationFrame(frame);

  // 调试钩子（仅供本原型在控制台里检查）
  window.HOLO.debug = function () {
    return { mode: mode, model: models[cur].name, phase: phase, cam: cam.state, facing: cam.facing, res: res, fps: Math.round(fps),
      layout: { W: W, H: Hh, upB: L.upB, loT: L.loT, src: L.src },
      head: { az: head.az, el: head.el, d: head.d, active: headActive(), avail: head.avail }, native: nat.on, settings: Object.assign({}, S), yaw: yaw, pitch: pitch };
  };
})();
