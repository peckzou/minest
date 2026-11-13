/* Minest · Scenic World (2026-11-13) — an immersive view, not a game map: you are a photographer with a free camera.
   Scene adapters share one Scenic Camera and one Moments collection. This build ships one scene, Lake Bled, as a
   2.5D depth scene: one real photograph (Krzysztof Golik, CC BY-SA 4.0, colour-graded here) and a depth map estimated
   offline (Depth Anything V2 Small, Apache 2.0). Honest limits: the photo is unprojected into a relief seen from the
   spot it was taken; the camera may orbit, dolly, rise, pan and zoom only as far as that relief and the photo's own
   frame stay true — the field of view narrows by itself before the edge of the photograph could come into view.
   Not a 360° panorama, not a reconstruction; no image is stretched to fake a drone orbit.
   Talks to Spatial Home (parent) by postMessage {scenic:1, op}: ready · close · save · del · list ← shots. */
(function () {
  'use strict';
  var THREE = window.THREE, $ = function (id) { return document.getElementById(id); };
  var Q = new URLSearchParams(location.search), EMBED = window.parent !== window;
  var SCENES = [{
    id: 'bled', name: 'Lake Bled · Autumn Sunset', zh: '布莱德湖 · 秋日夕照', place: 'Bled, Slovenia · 斯洛文尼亚',
    kind: 'depth25', kindZh: '2.5D 深度场景 · 有限视差',
    img: 'assets/bled/bled_4k.webp', imgLow: 'assets/bled/bled_2k.webp', depth: 'assets/bled/depth_1024.png', fx: 'assets/bled/fx_1024.png',
    aspect: 4096 / 3208, vfov: 40, tilt: 12,                           // the photo: its frame, and the downward look it was taken with
    zmap: { B: 1 / 3500, C: 0.073, p: 2.2 },                           // estimated inverse depth → metres (island ≈ 350 m, near lake ≈ 100 m, mountains ≈ 3.5 km)
    pivot: [0.49, 0.72],                                               // the island
    limits: { orbit: 0.06, tilt: 0.04, dolly: [-30, 170], height: [-15, 30], pan: [-12, 12], fov: [7, 40] },
    credit: 'Photo: <a href="https://commons.wikimedia.org/wiki/File:Bled_Island_06.jpg" target="_blank" rel="noopener">Krzysztof Golik · Bled Island 06</a> · <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener">CC BY-SA 4.0</a> · colour-graded to an autumn sunset by Minest · depth: Depth Anything V2'
  }];
  var SC = SCENES[0], LOW = (navigator.deviceMemory && navigator.deviceMemory < 4) || Math.min(screen.width, screen.height) < 500;

  /* ---------- the photograph shows at once, before anything else is ready ---------- */
  $('plate').style.backgroundImage = 'url(' + SC.imgLow + ')';
  $('credit').innerHTML = SC.credit;

  var renderer = null;
  try { renderer = new THREE.WebGLRenderer({ canvas: $('gl'), antialias: true, preserveDrawingBuffer: false }); } catch (e) { renderer = null; }
  if (!renderer) { staticMode(); return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, LOW ? 1.5 : 2));
  renderer.outputEncoding = THREE.LinearEncoding;
  var scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(SC.vfov, 1, 1, 12000);
  var tanV = Math.tan(SC.vfov / 2 * Math.PI / 180), tanH = tanV * SC.aspect, TH = SC.tilt * Math.PI / 180;
  var UPW = new THREE.Vector3(0, Math.cos(TH), Math.sin(TH)).normalize(), RIGHT = new THREE.Vector3(1, 0, 0);
  function zOf(d) { var m = SC.zmap; return 1 / (m.B + m.C * Math.pow(Math.max(0, d), m.p)); }

  /* ---------- loading: photo, depth, fx masks ---------- */
  function img(src) { return new Promise(function (res, rej) { var i = new Image(); i.crossOrigin = 'anonymous'; i.onload = function () { res(i); }; i.onerror = rej; i.src = src; }); }
  function pixels(i) { var c = document.createElement('canvas'); c.width = i.naturalWidth; c.height = i.naturalHeight; var x = c.getContext('2d'); x.drawImage(i, 0, 0); return { w: c.width, h: c.height, d: x.getImageData(0, 0, c.width, c.height).data }; }
  var U = { map: { value: null }, fx: { value: null }, uT: { value: 0 }, uLive: { value: 1 } };
  var VS = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }';
  var FS = [
    'uniform sampler2D map; uniform sampler2D fx; uniform float uT; uniform float uLive; varying vec2 vUv;',
    'void main(){',
    '  vec2 uv = vUv; vec4 m = texture2D(fx, vUv);',
    '  float sky = m.r * uLive, lake = m.g * uLive;',
    /* clouds: a slow drift and a slower change of shape, only above the ridge line */
    '  uv += sky * vec2(sin(uT*0.031 + vUv.y*5.0)*0.0035 + uT*0.00025, cos(uT*0.027 + vUv.x*4.0)*0.0016);',
    /* the lake: fine ripples that only shift the reflection a hair */
    '  float near = smoothstep(0.35, 0.0, vUv.y);',
    '  uv += lake * vec2(sin(vUv.y*620.0 + uT*1.4 + sin(vUv.x*30.0))*0.00045, sin(vUv.x*340.0 + uT*1.1)*0.00028) * (0.4 + near);',
    '  vec3 c = texture2D(map, uv).rgb;',
    '  float sparkle = lake * pow(max(0.0, sin(vUv.x*900.0 + uT*2.3) * sin(vUv.y*1400.0 - uT*1.7)), 24.0) * smoothstep(0.45, 1.0, vUv.x);',
    '  c += vec3(1.0, 0.82, 0.6) * sparkle * 0.35;',
    '  c *= 1.0 + 0.025 * sin(uT * 0.09) * uLive;',                   // the light breathes, barely
    '  gl_FragColor = vec4(c, 1.0);',
    '}'].join('\n');
  var mat = new THREE.ShaderMaterial({ uniforms: U, vertexShader: VS, fragmentShader: FS, side: THREE.DoubleSide });
  var P = new THREE.Vector3(), mesh = null, back = null;

  Promise.all([img(LOW ? SC.imgLow : SC.img), img(SC.depth), img(SC.fx)]).then(function (r) {
    var tex = new THREE.Texture(r[0]); tex.needsUpdate = true; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    var fxt = new THREE.Texture(r[2]); fxt.needsUpdate = true;
    U.map.value = tex; U.fx.value = fxt;
    build(pixels(r[1]));
    resize(); restoreStart(); loop(); setTimeout(function () { document.body.classList.add('live'); }, 60);
    setTimeout(function () { post({ op: 'ready' }); }, 700);
  }).catch(function () { staticMode(); });

  function build(D) {
    var NX = LOW ? 180 : 300, NY = Math.round(NX / SC.aspect), pos = new Float32Array(NX * NY * 3), uv = new Float32Array(NX * NY * 2), zs = new Float32Array(NX * NY);
    function dAt(u, v) { var x = u * (D.w - 1), y = v * (D.h - 1), x0 = Math.floor(x), y0 = Math.floor(y), x1 = Math.min(D.w - 1, x0 + 1), y1 = Math.min(D.h - 1, y0 + 1), fx = x - x0, fy = y - y0;
      function g(a, b) { return D.d[(b * D.w + a) * 4] / 255; } return (g(x0, y0) * (1 - fx) + g(x1, y0) * fx) * (1 - fy) + (g(x0, y1) * (1 - fx) + g(x1, y1) * fx) * fy; }
    for (var j = 0; j < NY; j++) for (var i = 0; i < NX; i++) {
      var u = i / (NX - 1), v = j / (NY - 1), z = zOf(dAt(u, v)), k = j * NX + i;
      pos[k * 3] = (2 * u - 1) * tanH * z; pos[k * 3 + 1] = (1 - 2 * v) * tanV * z; pos[k * 3 + 2] = -z; uv[k * 2] = u; uv[k * 2 + 1] = 1 - v; zs[k] = z;
    }
    /* a triangle across a depth edge (the branch against the lake) would be a stretched curtain once the camera moves:
       it is left out, and the photograph behind (the back plate) shows through — seen from the photo's own spot the
       two are the same pixels, so nothing changes until the camera moves */
    var idx = [];
    function ok(a, b, c) { var m = Math.max(zs[a], zs[b], zs[c]), n = Math.min(zs[a], zs[b], zs[c]); return m / n < 1.45; }
    for (j = 0; j < NY - 1; j++) for (i = 0; i < NX - 1; i++) { var a = j * NX + i, b = a + 1, c = a + NX, d2 = c + 1; if (ok(a, c, b)) idx.push(a, c, b); if (ok(b, c, d2)) idx.push(b, c, d2); }
    var geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); geo.setIndex(idx);
    mesh = new THREE.Mesh(geo, mat); scene.add(mesh);
    var ZB = 3700; back = new THREE.Mesh(new THREE.PlaneGeometry(2 * tanH * ZB, 2 * tanV * ZB), mat); back.position.z = -ZB; back.renderOrder = -1; scene.add(back);
    P.set((2 * SC.pivot[0] - 1) * tanH, (1 - 2 * SC.pivot[1]) * tanV, -1).multiplyScalar(zOf(dAt(SC.pivot[0], SC.pivot[1])));
  }

  /* ---------- the Scenic Camera: orbit · tilt · dolly · height · pan · zoom (+ look), within what the scene supports ---------- */
  var L = SC.limits, DEF = { orbit: 0, tilt: 0, dolly: 0, height: 0, pan: 0, fov: SC.vfov, lx: 0, ly: 0 };
  var S = JSON.parse(JSON.stringify(DEF)), T = JSON.parse(JSON.stringify(DEF)), V = { orbit: 0, tilt: 0, pan: 0, height: 0 };
  var _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _e = new THREE.Euler(0, 0, 0, 'YXZ'), _a = new THREE.Vector3(), _b = new THREE.Vector3(), _r = new THREE.Vector3();
  function pose(st, cam) {
    _q.setFromAxisAngle(UPW, st.orbit); _q2.setFromAxisAngle(RIGHT, st.tilt); _q.multiply(_q2);
    _a.copy(P).negate().applyQuaternion(_q).add(P);                   // orbit round the subject, from where the photo was taken
    _b.copy(P).sub(_a).normalize(); _a.addScaledVector(_b, st.dolly);
    _r.copy(RIGHT).applyQuaternion(_q); _a.addScaledVector(_r, st.pan).addScaledVector(UPW, st.height);
    cam.position.copy(_a);
    _q2.setFromEuler(_e.set(st.ly, st.lx, 0, 'YXZ')); cam.quaternion.copy(_q).multiply(_q2);
    cam.fov = st.fov; cam.updateProjectionMatrix(); cam.updateMatrixWorld(true);
  }
  /* does the photograph still fill the frame? (the four screen corners must land inside the back plate) */
  var probe = new THREE.PerspectiveCamera(), _o = new THREE.Vector3(), _d = new THREE.Vector3();
  function covered(st) {
    probe.aspect = camera.aspect; pose(st, probe); probe.updateProjectionMatrixWorld && probe.updateProjectionMatrixWorld();
    var ZB = 3700, c = [[-1, -1], [1, -1], [-1, 1], [1, 1]];
    for (var i = 0; i < 4; i++) { _o.copy(probe.position); _d.set(c[i][0], c[i][1], 0.5).unproject(probe).sub(_o).normalize();
      if (_d.z >= -1e-4) return false; var t = (-ZB - _o.z) / _d.z, x = _o.x + _d.x * t, y = _o.y + _d.y * t;
      if (Math.abs(x) > tanH * ZB * 0.995 || Math.abs(y) > tanV * ZB * 0.995) return false; }
    return true;
  }
  function clampT() {
    T.orbit = clamp(T.orbit, -L.orbit, L.orbit); T.tilt = clamp(T.tilt, -L.tilt, L.tilt); T.dolly = clamp(T.dolly, L.dolly[0], L.dolly[1]);
    T.height = clamp(T.height, L.height[0], L.height[1]); T.pan = clamp(T.pan, L.pan[0], L.pan[1]); T.fov = clamp(T.fov, L.fov[0], L.fov[1]);
    var lim = Math.max(0, (SC.vfov - T.fov) / 2) * Math.PI / 180; T.ly = clamp(T.ly, -lim, lim); T.lx = clamp(T.lx, -lim * SC.aspect, lim * SC.aspect);
    for (var k = 0; k < 40 && !covered(T); k++) { T.fov *= 0.965; T.lx *= 0.9; T.ly *= 0.9; }   // the frame narrows before it could leave the photograph
  }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  /* ---------- input: drag = orbit, Shift / two fingers = pan, wheel / pinch = zoom, double = the island ---------- */
  var ptrs = {}, last = null, pinch = null, cv = $('gl');
  cv.addEventListener('pointerdown', function (e) { wake(); closePanels(); ptrs[e.pointerId] = { x: e.clientX, y: e.clientY }; try { cv.setPointerCapture(e.pointerId); } catch (er) {} startAudio(); });
  cv.addEventListener('pointermove', function (e) {
    wake(); var p = ptrs[e.pointerId]; if (!p) return; var ids = Object.keys(ptrs), dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY;
    var k = T.fov / SC.vfov;
    if (ids.length === 1) {
      if (e.shiftKey) { V.pan = -dx * 0.004 * k; V.height = dy * 0.004 * k; }
      else { V.orbit = -dx * 0.000035 * k; V.tilt = -dy * 0.000025 * k; }
    } else if (ids.length === 2) {
      var a = ptrs[ids[0]], b = ptrs[ids[1]], dist = Math.hypot(a.x - b.x, a.y - b.y), mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      if (pinch) { T.fov *= Math.pow(pinch.d / Math.max(1, dist), 1); V.pan = -(mx - pinch.x) * 0.004 * k; V.height = (my - pinch.y) * 0.004 * k; }
      pinch = { d: dist, x: mx, y: my };
    }
    clampT();
  });
  function up(e) { delete ptrs[e.pointerId]; if (Object.keys(ptrs).length < 2) pinch = null; }
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  cv.addEventListener('wheel', function (e) { e.preventDefault(); wake(); T.fov *= Math.exp(e.deltaY * (e.ctrlKey ? 0.01 : 0.0012)); clampT(); }, { passive: false });
  var lastTap = 0;
  cv.addEventListener('pointerup', function () { var n = performance.now(); if (n - lastTap < 300) focusSubject(); lastTap = n; });
  function focusSubject() {                                           // the island in the middle of the frame, a little closer
    _a.copy(P); var dir = _a.clone().normalize(); T.lx = Math.atan2(dir.x, -dir.z) * 0.98; T.ly = Math.atan2(dir.y, Math.hypot(dir.x, dir.z)) * 0.98; T.fov = 17; T.dolly = Math.max(T.dolly, 60); clampT(); toast('对准湖心岛');
  }
  window.addEventListener('keydown', function (e) {
    wake(); var k = T.fov / SC.vfov;
    if (e.key === 'ArrowLeft') T.orbit += 0.004 * k; else if (e.key === 'ArrowRight') T.orbit -= 0.004 * k; else if (e.key === 'ArrowUp') T.height += 1; else if (e.key === 'ArrowDown') T.height -= 1;
    else if (e.key === '+' || e.key === '=') T.fov *= 0.92; else if (e.key === '-') T.fov /= 0.92; else if (e.key === 'r' || e.key === 'R') reset(); else if (e.key === 'c' || e.key === 'C') capture(); else if (e.key === 'Escape') exit();
    else return; clampT();
  });

  /* ---------- frame ---------- */
  var clock = new THREE.Clock(), t0 = 0;
  function loop() {
    requestAnimationFrame(loop); if (document.hidden) return;
    var dt = Math.min(0.05, clock.getDelta()); t0 += dt; U.uT.value = t0;
    ['orbit', 'tilt', 'pan', 'height'].forEach(function (k) { if (Math.abs(V[k]) > 1e-6) { T[k] += V[k]; V[k] *= Math.pow(0.0025, dt); } });   // momentum, eased out
    clampT();
    var f = 1 - Math.exp(-dt * 6);                                    // damping: every move eases in and out
    for (var k in S) S[k] += (T[k] - S[k]) * f;
    pose(S, camera); syncSliders(); renderer.render(scene, camera);
  }
  function resize() { var w = window.innerWidth, h = window.innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); clampT(); }
  window.addEventListener('resize', resize);

  /* ---------- toolbar: hidden until the pointer moves; never more than one panel ---------- */
  var calmT = 0;
  function wake() { document.body.classList.remove('calm'); clearTimeout(calmT); calmT = setTimeout(function () { if (!openPanel) document.body.classList.add('calm'); }, 3200); }
  document.addEventListener('mousemove', wake); wake();
  var openPanel = null;
  function closePanels() { ['pScenes', 'pCamera', 'pMoments'].forEach(function (id) { $(id).hidden = true; }); openPanel = null; [].forEach.call(document.querySelectorAll('#bar button'), function (b) { b.classList.remove('on'); }); }
  function toggle(id, btn) { var was = openPanel === id; closePanels(); if (!was) { $(id).hidden = false; openPanel = id; btn.classList.add('on'); } }
  $('bar').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return; wake(); startAudio(); var a = b.dataset.a;
    if (a === 'scenes') { renderScenes(); toggle('pScenes', b); } else if (a === 'camera') toggle('pCamera', b); else if (a === 'moments') { renderShots(); toggle('pMoments', b); }
    else if (a === 'reset') { closePanels(); reset(); } else if (a === 'capture') { closePanels(); capture(); } else if (a === 'ambient') { ambient(!amb.on); b.classList.toggle('on', amb.on); } else if (a === 'exit') exit();
  });
  ['pScenes', 'pCamera', 'pMoments', 'bar'].forEach(function (id) { $(id).addEventListener('pointerdown', function (e) { e.stopPropagation(); wake(); }); });
  function renderScenes() {
    $('sceneList').innerHTML = SCENES.map(function (s) { return '<div class="scene"><i style="background-image:url(' + s.imgLow + ')"></i><div><b>' + s.name + '</b><em>' + s.zh + ' · ' + s.place + '</em><span class="tag">' + s.kindZh + '</span></div></div>'; }).join('');
  }
  $('camKind').textContent = SC.kindZh;
  /* the camera panel: height, dolly, focal length (mm, full-frame equivalent), orbit */
  var SL = { sHeight: ['height', L.height[0], L.height[1]], sDolly: ['dolly', L.dolly[0], L.dolly[1]], sOrbit: ['orbit', -L.orbit, L.orbit] };
  Object.keys(SL).forEach(function (id) { $(id).addEventListener('input', function (e) { var q = SL[id]; T[q[0]] = q[1] + (q[2] - q[1]) * e.target.value / 1000; clampT(); }); });
  function mmOf(fov) { return 12 / Math.tan(fov / 2 * Math.PI / 180); }
  function fovOf(mm) { return 2 * Math.atan(12 / mm) * 180 / Math.PI; }
  var MM0 = mmOf(L.fov[1]), MM1 = mmOf(L.fov[0]);
  $('sFocal').addEventListener('input', function (e) { var mm = MM0 * Math.pow(MM1 / MM0, e.target.value / 1000); T.fov = fovOf(mm); clampT(); });
  function syncSliders() {
    if (openPanel !== 'pCamera') return;
    Object.keys(SL).forEach(function (id) { var q = SL[id], el = $(id); if (document.activeElement !== el) el.value = Math.round((T[q[0]] - q[1]) / (q[2] - q[1]) * 1000); });
    if (document.activeElement !== $('sFocal')) $('sFocal').value = Math.round(Math.log(mmOf(T.fov) / MM0) / Math.log(MM1 / MM0) * 1000);
    $('vHeight').textContent = (T.height >= 0 ? '+' : '') + T.height.toFixed(0) + ' m'; $('vDolly').textContent = (T.dolly >= 0 ? '+' : '') + T.dolly.toFixed(0) + ' m';
    $('vFocal').textContent = mmOf(T.fov).toFixed(0) + ' mm'; $('vOrbit').textContent = (T.orbit * 180 / Math.PI).toFixed(1) + '°';
  }
  function reset() { var d = JSON.parse(JSON.stringify(DEF)); for (var k in d) T[k] = d[k]; V.orbit = V.tilt = V.pan = V.height = 0; clampT(); toast('经典机位'); }

  /* ---------- Capture → a Moment; Return to This Moment restores the exact camera ---------- */
  function capture() {
    pose(S, camera); renderer.render(scene, camera);
    var src = renderer.domElement, tw = 360, th = Math.round(tw * src.height / src.width), c = document.createElement('canvas'); c.width = tw; c.height = th; c.getContext('2d').drawImage(src, 0, 0, tw, th);
    var thumb = c.toDataURL('image/jpeg', 0.74);
    var full = src.toDataURL('image/jpeg', 0.92);
    $('flash').style.opacity = 0.7; setTimeout(function () { $('flash').style.opacity = 0; }, 140);
    var shot = { id: 'm' + Date.now().toString(36), scene: SC.id, name: SC.zh, t: Date.now(), st: JSON.parse(JSON.stringify(S)), cam: { pos: camera.position.toArray(), quat: camera.quaternion.toArray(), fov: camera.fov, aspect: camera.aspect }, env: { living: U.uLive.value > 0, ambient: amb.on }, thumb: thumb };
    saveShot(shot); toast('已定格 · 可在 Moments 回到这一刻');
    try { var a = document.createElement('a'); a.href = full; a.download = 'minest-lake-bled-' + new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-') + '.jpg'; if (!EMBED) { document.body.appendChild(a); a.click(); a.remove(); } } catch (e) {}
  }
  var SHOTS = [], KEY = 'minest.scenic.moments.v1';
  function localShots() { try { return JSON.parse(localStorage.getItem(KEY) || '[]') || []; } catch (e) { return []; } }
  function saveShot(s) { SHOTS.unshift(s); if (EMBED) post({ op: 'save', shot: s }); try { localStorage.setItem(KEY, JSON.stringify(SHOTS.slice(0, 40))); } catch (e) {} }
  function delShot(id) { SHOTS = SHOTS.filter(function (s) { return s.id !== id; }); if (EMBED) post({ op: 'del', id: id }); try { localStorage.setItem(KEY, JSON.stringify(SHOTS)); } catch (e) {} renderShots(); }
  function goShot(s) { if (!s || !s.st) return; for (var k in s.st) { T[k] = s.st[k]; S[k] = s.st[k]; } V.orbit = V.tilt = V.pan = V.height = 0; toast('回到这一刻 · ' + new Date(s.t).toLocaleString()); }
  function renderShots() {
    $('shots').innerHTML = SHOTS.length ? SHOTS.map(function (s) { return '<div class="shot" data-id="' + s.id + '" style="background-image:url(' + s.thumb + ')"><button type="button" data-del="' + s.id + '" aria-label="删除">×</button><span>' + new Date(s.t).toLocaleDateString() + ' ' + new Date(s.t).toLocaleTimeString().slice(0, 5) + '</span></div>'; }).join('') : '<div class="empty">还没有收藏的机位。按 Capture 定格当前画面。</div>';
  }
  $('shots').addEventListener('click', function (e) { var d = e.target.closest('[data-del]'); if (d) { e.stopPropagation(); delShot(d.dataset.del); return; } var s = e.target.closest('.shot'); if (s) goShot(SHOTS.filter(function (x) { return x.id === s.dataset.id; })[0]); });
  SHOTS = localShots();
  function restoreStart() {
    var id = Q.get('shot'); if (id) { var s = SHOTS.filter(function (x) { return x.id === id; })[0]; if (s) return goShot(s); }
    if (Q.get('enter')) { S.fov = SC.vfov * 0.72; S.dolly = 25; }   // coming through the window: a little closer, then the view opens out
  }

  /* ---------- Spatial Home (parent) ---------- */
  function post(m) { if (!EMBED) return; m.scenic = 1; try { window.parent.postMessage(m, '*'); } catch (e) {} }
  window.addEventListener('message', function (e) {
    var m = e.data; if (!m || m.scenic !== 1 || e.source !== window.parent) return;
    if (m.op === 'shots' && Array.isArray(m.shots)) { var have = {}; SHOTS.forEach(function (s) { have[s.id] = 1; }); m.shots.forEach(function (s) { if (!have[s.id]) SHOTS.push(s); }); SHOTS.sort(function (a, b) { return b.t - a.t; }); if (openPanel === 'pMoments') renderShots(); }
    if (m.op === 'goto' && m.shot) goShot(m.shot);
  });
  post({ op: 'list' });
  function exit() { closePanels(); ambient(false, true); document.body.classList.remove('live'); if (EMBED) setTimeout(function () { post({ op: 'close' }); }, 380); else history.back(); }

  function toast(s) { var t = $('toast'); t.textContent = s; t.classList.add('on'); clearTimeout(toast.k); toast.k = setTimeout(function () { t.classList.remove('on'); }, 2200); }

  /* ---------- Ambient: water, a little wind, a bird now and then, the island's bell far off — all synthesised ---------- */
  var amb = { on: false, ac: null, out: null, timers: [] };
  function startAudio() { if (amb.started) return; amb.started = true; ambient(true); }
  function noiseBuf(ac) { var b = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate), d = b.getChannelData(0), last = 0; for (var i = 0; i < d.length; i++) { var w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } return b; }
  function ambient(on, quiet) {
    try {
      if (!amb.ac) { var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return; amb.ac = new AC(); amb.out = amb.ac.createGain(); amb.out.gain.value = 0; amb.out.connect(amb.ac.destination); build(); }
      var ac = amb.ac; if (ac.state === 'suspended') ac.resume();
      amb.on = on; amb.out.gain.cancelScheduledValues(ac.currentTime); amb.out.gain.setTargetAtTime(on ? 0.55 : 0, ac.currentTime, quiet ? 0.15 : 0.8);
      if (!quiet) toast(on ? '环境声音 · 湖水、风、远处的钟' : '环境声音已关');
    } catch (e) {}
    function build() {
      var ac = amb.ac, nb = noiseBuf(ac);
      var wind = ac.createBufferSource(); wind.buffer = nb; wind.loop = true; var wl = ac.createBiquadFilter(); wl.type = 'lowpass'; wl.frequency.value = 420; var wg = ac.createGain(); wg.gain.value = 0.18;
      var lfo = ac.createOscillator(); lfo.frequency.value = 0.07; var lg = ac.createGain(); lg.gain.value = 0.09; lfo.connect(lg); lg.connect(wg.gain); lfo.start();
      wind.connect(wl); wl.connect(wg); wg.connect(amb.out); wind.start();
      var water = ac.createBufferSource(); water.buffer = nb; water.loop = true; water.playbackRate.value = 1.6; var bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 700; bp.Q.value = 0.8; var wa = ac.createGain(); wa.gain.value = 0.0;
      water.connect(bp); bp.connect(wa); wa.connect(amb.out); water.start();
      (function lap() { var t = ac.currentTime; wa.gain.setTargetAtTime(0.16 + Math.random() * 0.12, t, 0.25); wa.gain.setTargetAtTime(0.03, t + 0.5 + Math.random() * 0.5, 0.6); amb.timers.push(setTimeout(lap, 1400 + Math.random() * 1800)); })();
      (function bird() { if (amb.on) { var t = ac.currentTime + 0.05, n = 2 + (Math.random() * 3 | 0), pan = ac.createStereoPanner ? ac.createStereoPanner() : null; if (pan) { pan.pan.value = Math.random() * 1.6 - 0.8; pan.connect(amb.out); }
          for (var i = 0; i < n; i++) { var o = ac.createOscillator(), g = ac.createGain(), f = 2600 + Math.random() * 1500; o.frequency.setValueAtTime(f, t + i * 0.13); o.frequency.exponentialRampToValueAtTime(f * 1.35, t + i * 0.13 + 0.07); g.gain.setValueAtTime(0, t + i * 0.13); g.gain.linearRampToValueAtTime(0.025, t + i * 0.13 + 0.01); g.gain.exponentialRampToValueAtTime(0.0005, t + i * 0.13 + 0.09); o.connect(g); g.connect(pan || amb.out); o.start(t + i * 0.13); o.stop(t + i * 0.13 + 0.1); } }
        amb.timers.push(setTimeout(bird, 6000 + Math.random() * 9000)); })();
      (function bell() { if (amb.on) { var t = ac.currentTime + 0.05; [1, 2, 2.4, 3, 4.2].forEach(function (h, i) { var o = ac.createOscillator(), g = ac.createGain(); o.frequency.value = 232 * h; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.018 / (i + 1), t + 0.02); g.gain.exponentialRampToValueAtTime(0.0003, t + 7 - i); o.connect(g); g.connect(amb.out); o.start(t); o.stop(t + 7.2); }); }
        amb.timers.push(setTimeout(bell, 45000 + Math.random() * 45000)); })();
    }
  }
  window.addEventListener('pagehide', function () { amb.timers.forEach(clearTimeout); try { amb.ac && amb.ac.close(); } catch (e) {} try { renderer.dispose(); U.map.value && U.map.value.dispose(); } catch (e) {} });

  /* ---------- no WebGL / not enough memory: the photograph itself, still and whole ---------- */
  function staticMode() {
    document.body.classList.add('static'); $('gl').style.display = 'none'; $('plate').style.backgroundSize = 'contain';
    $('bar').addEventListener('click', function (e) { var b = e.target.closest('button'); if (b && b.dataset.a === 'exit') { if (EMBED) post({ op: 'close' }); else history.back(); } });
    toast('静态模式 · 这台设备只显示照片'); setTimeout(function () { post({ op: 'ready' }); }, 300);
  }

  window.__scenic = { state: function () { return { S: JSON.parse(JSON.stringify(S)), T: JSON.parse(JSON.stringify(T)), shots: SHOTS.length, live: document.body.classList.contains('live') }; }, set: function (o) { for (var k in o) T[k] = o[k]; clampT(); }, capture: capture, reset: reset, focus: focusSubject, go: function (i) { goShot(SHOTS[i || 0]); } };
})();
