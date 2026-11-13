/* Minest · walk-in interior from one GLB (2026-11-13). ?scene=<id>.
   Walk at eye height (stick + drag on phones, WASD + drag on a computer), viewpoints, and collision that needs no
   hand-placed boxes: when the model loads, every triangle between knee and chest height is rasterised into a 20 cm
   floor grid — walls, the long table, chairs and cases become cells you cannot walk into; floor heights come from the
   upward-facing triangles near the bottom. Credits stay on screen (the scans' licences require it). */
(function () {
  'use strict';
  var SCENES = {
    'kings-hall': {
      name: '斯科克洛斯特城堡 · 国王大厅', en: "The King's Hall · Skokloster Castle", glb: 'assets/kings_hall.glb', unlit: true,
      credit: 'The King’s Hall, Skokloster Castle (Scan by Erik Lernestål) · <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">CC BY 4.0</a> · 压缩为 4K 贴图与简化网格',
      views: [
        { id: 'hall', name: '大厅全景', at: [0.5, 0.2], yaw: Math.PI, pitch: -0.04 },          // at = fractions of the floor box (x, z)
        { id: 'over', name: '空间俯瞰', at: [0.5, 0.22], up: -1.15, yaw: Math.PI, pitch: -0.55 },          // up < 0: below the ceiling
        { id: 'ceil', name: '雕花天顶', at: [0.5, 0.5], pitch: 1.15 },
        { id: 'wall', name: '皇家肖像', at: [0.2, 0.5], yaw: Math.PI / 2, pitch: 0.12, eye: 1.85 }
      ]
    }
  };
  var q = new URLSearchParams(location.search), SC = SCENES[q.get('scene')] || SCENES['kings-hall'];
  var $ = function (id) { return document.getElementById(id); };
  $('name').textContent = SC.name; $('credit').innerHTML = SC.credit; document.title = SC.en + ' · Minest';
  var embedded = window.parent !== window;
  if (embedded && q.get('embed') === '1') $('back').style.display = 'none';   // the Minest overlay has its own ‹ back
  $('back').onclick = function () { if (embedded) { try { window.parent.postMessage({ type: 'minest-interior-exit' }, '*'); } catch (e) {} } else history.back(); };

  var renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2)); renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.02;
  document.body.prepend(renderer.domElement);
  var scene = new THREE.Scene(); scene.background = new THREE.Color(0x0b0a09);
  var camera = new THREE.PerspectiveCamera(66, 1, 0.05, 200); camera.rotation.order = 'YXZ';
  scene.add(new THREE.HemisphereLight(0xfff6e8, 0x3a2e24, 1.0)); var key = new THREE.DirectionalLight(0xffe9c8, 0.6); key.position.set(2, 6, 3); scene.add(key);
  function resize() {
    var w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.fov = w < h ? 74 : 64; camera.updateProjectionMatrix();
    if (window.MinestFold) window.MinestFold.view(camera, w, h);
  }
  addEventListener('resize', resize); resize();

  /* ---------- the walk grid ---------- */
  var CELL = 0.2, G = null;   // { x0, z0, nx, nz, block: Uint8Array, floor: Float32Array, minY, maxY, box }
  function raw(attr, i, c) {
    var a = attr.isInterleavedBufferAttribute ? attr.data.array : attr.array, v = c === 0 ? attr.getX(i) : c === 1 ? attr.getY(i) : attr.getZ(i);   // interleaved-safe
    if (!attr.normalized) return v;
    if (a instanceof Int16Array) return Math.max(v / 32767, -1); if (a instanceof Uint16Array) return v / 65535;
    if (a instanceof Int8Array) return Math.max(v / 127, -1); if (a instanceof Uint8Array) return v / 255; return v;
  }
  function buildGrid(root) {
    root.updateMatrixWorld(true);
    var box = new THREE.Box3().setFromObject(root), x0 = box.min.x, z0 = box.min.z, nx = Math.ceil((box.max.x - x0) / CELL) + 1, nz = Math.ceil((box.max.z - z0) / CELL) + 1;
    var floor = new Float32Array(nx * nz).fill(NaN), tris = [];
    var A = new THREE.Vector3(), B = new THREE.Vector3(), C = new THREE.Vector3(), e1 = new THREE.Vector3(), e2 = new THREE.Vector3(), n = new THREE.Vector3();
    root.traverse(function (m) {
      if (!m.isMesh) return; var pos = m.geometry.attributes.position, idx = m.geometry.index, cnt = idx ? idx.count : pos.count, M = m.matrixWorld;
      var get = function (k, v) { var i = idx ? idx.getX(k) : k; return v.set(raw(pos, i, 0), raw(pos, i, 1), raw(pos, i, 2)).applyMatrix4(M); };
      for (var k = 0; k + 2 < cnt; k += 3) {
        get(k, A); get(k + 1, B); get(k + 2, C);
        e1.subVectors(B, A); e2.subVectors(C, A); n.crossVectors(e1, e2); var L = n.length(); if (L < 1e-9) continue; n.multiplyScalar(1 / L);
        tris.push(A.x, A.y, A.z, B.x, B.y, B.z, C.x, C.y, C.z, n.y);
      }
    });
    /* floor: horizontal surfaces (either winding — scans are not consistent) in the lower part; the floor is the lowest
       level that has real area (≥ 15 % of the busiest level), and each cell keeps its own lowest horizontal surface */
    var bottom = box.min.y, T = tris.length / 10, t, hist = {}, area = {};
    for (t = 0; t < T; t++) { var o = t * 10; if (Math.abs(tris[o + 9]) < 0.8) continue; var y = (tris[o + 1] + tris[o + 4] + tris[o + 7]) / 3; if (y > bottom + (box.max.y - bottom) * 0.45) continue;
      var ax = tris[o + 3] - tris[o], az = tris[o + 5] - tris[o + 2], bx = tris[o + 6] - tris[o], bz = tris[o + 8] - tris[o + 2], ar = Math.abs(ax * bz - az * bx) / 2;
      var key = Math.round(y * 10); area[key] = (area[key] || 0) + ar; hist[key] = (hist[key] || 0) + 1; }
    var maxA = 0, hk; for (hk in area) maxA = Math.max(maxA, area[hk]);
    var F = null; Object.keys(area).map(Number).sort(function (a, b) { return a - b; }).some(function (k) { if (area[k] >= maxA * 0.15) { F = k / 10; return true; } return false; });
    if (F == null) F = bottom;
    for (t = 0; t < T; t++) { var o2 = t * 10; if (Math.abs(tris[o2 + 9]) < 0.8) continue; var y2 = (tris[o2 + 1] + tris[o2 + 4] + tris[o2 + 7]) / 3; if (Math.abs(y2 - F) > 0.3) continue;
      var cx = Math.floor(((tris[o2] + tris[o2 + 3] + tris[o2 + 6]) / 3 - x0) / CELL), cz = Math.floor(((tris[o2 + 2] + tris[o2 + 5] + tris[o2 + 8]) / 3 - z0) / CELL), c = cz * nx + cx;
      if (c >= 0 && c < floor.length && (isNaN(floor[c]) || y2 < floor[c])) floor[c] = y2; }
    for (var i = 0; i < floor.length; i++) if (isNaN(floor[i]) || floor[i] > F + 0.45) floor[i] = F;   // raised things are obstacles, not floor
    /* obstacles: anything between knee and chest height */
    var block = new Uint8Array(nx * nz), lo = F + 0.32, hi = F + 1.7;
    for (t = 0; t < T; t++) {
      var p = t * 10, ymin = Math.min(tris[p + 1], tris[p + 4], tris[p + 7]), ymax = Math.max(tris[p + 1], tris[p + 4], tris[p + 7]);
      if (ymax < lo || ymin > hi) continue;
      var xa = Math.min(tris[p], tris[p + 3], tris[p + 6]), xb = Math.max(tris[p], tris[p + 3], tris[p + 6]), za = Math.min(tris[p + 2], tris[p + 5], tris[p + 8]), zb = Math.max(tris[p + 2], tris[p + 5], tris[p + 8]);
      if ((xb - xa) * (zb - za) > 2.5) continue;                       // a huge flat triangle (a rug, a big panel seen edge-on) — skip
      for (var gz = Math.floor((za - z0) / CELL); gz <= Math.floor((zb - z0) / CELL); gz++) for (var gx = Math.floor((xa - x0) / CELL); gx <= Math.floor((xb - x0) / CELL); gx++)
        if (gx >= 0 && gz >= 0 && gx < nx && gz < nz) block[gz * nx + gx] = 1;
    }
    for (var e = 0; e < nx; e++) { block[e] = block[(nz - 1) * nx + e] = 1; } for (var f = 0; f < nz; f++) { block[f * nx] = block[f * nx + nx - 1] = 1; }
    return { x0: x0, z0: z0, nx: nx, nz: nz, block: block, floor: floor, F: F, box: box, area: area };
  }
  function cellOf(x, z) { return { x: Math.floor((x - G.x0) / CELL), z: Math.floor((z - G.z0) / CELL) }; }
  function free(x, z, r) {
    var c0 = cellOf(x - r, z - r), c1 = cellOf(x + r, z + r);
    for (var gz = c0.z; gz <= c1.z; gz++) for (var gx = c0.x; gx <= c1.x; gx++) { if (gx < 0 || gz < 0 || gx >= G.nx || gz >= G.nz) return false; if (G.block[gz * G.nx + gx]) return false; }
    return true;
  }
  function floorAt(x, z) { var c = cellOf(x, z); if (c.x < 0 || c.z < 0 || c.x >= G.nx || c.z >= G.nz) return G.F; var v = G.floor[c.z * G.nx + c.x]; return isNaN(v) ? G.F : v; }
  function nearestFree(x, z) {
    if (free(x, z, 0.25)) return [x, z];
    for (var r = 0.2; r < 8; r += 0.2) for (var a = 0; a < 24; a++) { var ang = a / 24 * Math.PI * 2, px = x + Math.cos(ang) * r, pz = z + Math.sin(ang) * r; if (free(px, pz, 0.25)) return [px, pz]; }
    return [x, z];
  }

  /* ---------- the walker ---------- */
  var P = { x: 0, z: 0, y: 1.6, yaw: 0, pitch: 0, eye: 1.6, lift: 0 }, keys = {}, joy = { x: 0, y: 0, id: null }, look = null;
  function goView(v) {
    var b = G.box, x = b.min.x + (b.max.x - b.min.x) * v.at[0], z = b.min.z + (b.max.z - b.min.z) * v.at[1], f = nearestFree(x, z);
    P.x = f[0]; P.z = f[1]; P.yaw = v.yaw != null ? v.yaw : P.yaw; P.pitch = v.pitch || 0; P.eye = v.eye || 1.6;
    P.lift = v.up ? Math.max(0, (b.max.y + v.up) - (floorAt(P.x, P.z) + P.eye)) : 0;
    [].forEach.call(document.querySelectorAll('#views .b'), function (b2) { b2.style.background = b2.dataset.v === v.id ? 'rgba(79,143,58,.85)' : ''; });
  }
  function hint(s) { var h = $('hint'); h.textContent = s; h.style.opacity = 1; clearTimeout(hint.t); hint.t = setTimeout(function () { h.style.opacity = 0; }, 6000); }
  addEventListener('keydown', function (e) { keys[e.code] = true; });
  addEventListener('keyup', function (e) { keys[e.code] = false; });
  var cv = renderer.domElement, stick = $('stick'), knob = stick.firstElementChild;
  cv.addEventListener('pointerdown', function (e) { if (e.pointerType === 'touch') document.body.classList.add('touch'); look = { id: e.pointerId, x: e.clientX, y: e.clientY }; try { cv.setPointerCapture(e.pointerId); } catch (er) {} });
  cv.addEventListener('pointermove', function (e) { if (!look || look.id !== e.pointerId) return; var s = 0.0045 * (camera.fov / 64); P.yaw -= (e.clientX - look.x) * s; P.pitch = Math.max(-1.35, Math.min(1.35, P.pitch - (e.clientY - look.y) * s)); look.x = e.clientX; look.y = e.clientY; });
  var lookEnd = function (e) { if (look && look.id === e.pointerId) look = null; }; cv.addEventListener('pointerup', lookEnd); cv.addEventListener('pointercancel', lookEnd);
  function stickMove(e) { var r = stick.getBoundingClientRect(), x = (e.clientX - r.left - r.width / 2) / (r.width / 2), y = (e.clientY - r.top - r.height / 2) / (r.height / 2), l = Math.hypot(x, y); if (l > 1) { x /= l; y /= l; } joy.x = x; joy.y = y; knob.style.transform = 'translate(' + x * 30 + 'px,' + y * 30 + 'px)'; }
  stick.addEventListener('pointerdown', function (e) { joy.id = e.pointerId; try { stick.setPointerCapture(e.pointerId); } catch (er) {} stickMove(e); });
  stick.addEventListener('pointermove', function (e) { if (joy.id === e.pointerId) stickMove(e); });
  var stickEnd = function (e) { if (joy.id !== e.pointerId) return; joy.id = null; joy.x = joy.y = 0; knob.style.transform = ''; }; stick.addEventListener('pointerup', stickEnd); stick.addEventListener('pointercancel', stickEnd);
  if (matchMedia('(pointer: coarse)').matches) document.body.classList.add('touch');

  var clock = new THREE.Clock(), smooth = new THREE.Vector3(), started = false;
  function step(dt) {
    var f = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0) - joy.y, s = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0) + joy.x;
    if (keys.KeyQ) P.yaw += dt * 1.6; if (keys.KeyE) P.yaw -= dt * 1.6;
    var l = Math.hypot(f, s); if (l > 1) { f /= l; s /= l; }
    if (l > 0.05) {
      P.lift = Math.max(0, P.lift - dt * 3);                           // walking brings you down from an overview
      var sp = (keys.ShiftLeft ? 3.2 : 1.7) * dt, dx = (-Math.sin(P.yaw) * f + Math.cos(P.yaw) * s) * sp, dz = (-Math.cos(P.yaw) * f - Math.sin(P.yaw) * s) * sp;
      if (free(P.x + dx, P.z + dz, 0.25)) { P.x += dx; P.z += dz; } else if (free(P.x + dx, P.z, 0.25)) P.x += dx; else if (free(P.x, P.z + dz, 0.25)) P.z += dz;   // slide along walls
    }
    var target = floorAt(P.x, P.z) + P.eye + P.lift;
    P.y += (target - P.y) * Math.min(1, dt * 8);
    camera.position.set(P.x, P.y, P.z); camera.rotation.set(P.pitch, P.yaw, 0);
  }
  function loop() { requestAnimationFrame(loop); if (document.hidden) return; var dt = Math.min(0.05, clock.getDelta()); if (started) step(dt); renderer.render(scene, camera); }
  loop();

  /* ---------- load ---------- */
  var loader = new THREE.GLTFLoader();
  loader.load(SC.glb, function (gl) {
    var root = gl.scene; scene.add(root);
    root.traverse(function (m) { if (!m.isMesh || !m.material) return; m.material.side = THREE.DoubleSide;   // scans are not wound consistently; seen from inside, a wall must not vanish
      if (m.material.map) m.material.map.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy()); });
    $('loadTxt').textContent = '正在计算可行走区域…';
    setTimeout(function () {
      G = buildGrid(root);
      var vb = $('views'); SC.views.forEach(function (v) { var b = document.createElement('button'); b.type = 'button'; b.className = 'b'; b.textContent = v.name; b.dataset.v = v.id; b.onclick = function () { goView(v); }; vb.appendChild(b); });
      goView(SC.views[0]); started = true; $('load').remove();
      hint(document.body.classList.contains('touch') ? '左下摇杆行走 · 拖动环顾 · 右上切换视角' : 'WASD 行走 · Shift 快走 · 拖动环顾 · 右上切换视角');
    }, 30);
  }, function (e) { if (e.total) $('load').querySelector('i').style.width = Math.round(e.loaded / e.total * 100) + '%'; $('loadTxt').textContent = '正在载入 ' + (e.loaded / 1048576).toFixed(1) + (e.total ? ' / ' + (e.total / 1048576).toFixed(1) : '') + ' MB'; },
  function (err) { $('loadTxt').textContent = '载入失败：' + (err && err.message || err); });
  window.__interior = { scene: scene, get P() { return P; }, get G() { return G; }, goView: function (i) { goView(SC.views[i]); } };
})();
