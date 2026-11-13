/* Minest · Scenic World (2026-11-13; reworked the same day after the first look) — an immersive view, not a game map.
   Like an Apple Vision Pro environment, you stand where the view is best and look: turn, lean, step a little, zoom.
   The scene comes from scenic-core.js: one real photograph (Krzysztof Golik, CC BY-SA 4.0, graded) as a two-layer 2.5D
   depth scene — the near branch on its own layer, the lake and mountains behind it filled — so moving does not ghost.
   Honest limits: looking stays inside the photograph's frame (the frame narrows before an edge could show), and moving is
   a few metres, not a drone flight; one photo has nothing behind the island to show.
   Talks to Spatial Home (parent) by postMessage {scenic:1, op}: ready · close · save · del · list ← shots. */
(function () {
  'use strict';
  var THREE = window.THREE, $ = function (id) { return document.getElementById(id); };
  var Q = new URLSearchParams(location.search), EMBED = window.parent !== window;
  var ALL = window.ScenicCore.scenes, SCENES = [ALL.alps, ALL.bled], LOW = (navigator.deviceMemory && navigator.deviceMemory < 4) || Math.min(screen.width, screen.height) < 500;
  /* what each kind of scene can honestly do: a panorama is looked at from where it was taken (turn anywhere, a step or two);
     a spatial scene (one photo) only inside its own frame, leaning a few metres */
  ALL.bled.limits = { orbit: 0.008, tilt: 0.006, dolly: [-10, 9], height: [-4, 8], pan: [-6, 6], fov: [7, 40] };
  ALL.alps.limits = { orbit: 0, tilt: 0, dolly: [-1.2, 1.2], height: [-0.5, 0.7], pan: [-1.2, 1.2], fov: [22, 92] };
  var PREF = 'minest.scenic.scene';
  var SC = ALL[Q.get('scene')] || ALL[(function () { try { return localStorage.getItem(PREF); } catch (e) { return null; } })()] || ALL.bled;
  /* ---------- the photograph shows at once, before anything else is ready ---------- */
  $('plate').style.backgroundImage = 'url(' + SC.thumb + ')';
  $('credit').innerHTML = SC.credit;

  var renderer = null;
  try { renderer = new THREE.WebGLRenderer({ canvas: $('gl'), antialias: true, preserveDrawingBuffer: false }); } catch (e) { renderer = null; }
  if (!renderer) { staticMode(); return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, LOW ? 1.5 : 2));
  renderer.outputEncoding = THREE.LinearEncoding;
  var scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(SC.vfov, 1, 1, 12000);
  var tanV = 1, tanH = 1, PANO = false;
  var UPW = new THREE.Vector3(0, 1, 0), RIGHT = new THREE.Vector3(1, 0, 0), P = new THREE.Vector3(), U = { uT: { value: 0 }, uLive: { value: 1 } }, core = null, looping = false;
  /* switch scenes: the new one loads behind the current picture, then a soft cross-fade (no black, no flash) */
  function setScene(sc, first) {
    var plate = $('plate'); plate.style.transition = 'opacity .6s ease'; plate.style.backgroundImage = 'url(' + sc.thumb + ')'; plate.style.backgroundSize = 'cover';
    if (!first) document.body.classList.remove('live');
    return window.ScenicCore.load(sc.id, { base: '', low: LOW, renderer: renderer }).then(function (c) {
      if (core) { scene.remove(core.group); try { core.dispose(); } catch (e) {} }
      core = c; SC = sc; PANO = c.kind === 'pano'; U = c.U; P.copy(c.P); tanV = c.tanV; tanH = c.tanH; L = SC.limits; scene.add(c.group);
      camera.near = PANO ? 0.05 : 1; camera.far = PANO ? 6000 : 12000;
      DEF = { orbit: 0, tilt: 0, dolly: 0, height: 0, pan: 0, fov: PANO ? 70 : SC.vfov * 0.86, lx: 0, ly: 0 };
      for (var k in DEF) { S[k] = DEF[k]; T[k] = DEF[k]; } lastOK = null;
      $('credit').innerHTML = SC.credit; $('camKind').textContent = SC.kindZh;
      try { localStorage.setItem(PREF, SC.id); } catch (e) {} post({ op: 'scene', id: SC.id });
      resize(); if (!looping) { looping = true; loop(); }
      setTimeout(function () { document.body.classList.add('live'); }, 60);
      return c;
    });
  }
  setScene(SC, true).then(function () { restoreStart(); setTimeout(function () { post({ op: 'ready' }); }, 700); }).catch(function () { staticMode(); });

  /* ---------- the Scenic Camera: orbit · tilt · dolly · height · pan · zoom (+ look), within what the scene supports ---------- */
  var L = SC.limits, DEF = { orbit: 0, tilt: 0, dolly: 0, height: 0, pan: 0, fov: 40, lx: 0, ly: 0 };
  var S = JSON.parse(JSON.stringify(DEF)), T = JSON.parse(JSON.stringify(DEF)), V = { orbit: 0, tilt: 0, pan: 0, height: 0, lx: 0, ly: 0 };
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
    if (PANO) return true;
    probe.aspect = camera.aspect; pose(st, probe); probe.updateProjectionMatrixWorld && probe.updateProjectionMatrixWorld();
    var c = [[-1, -1], [1, -1], [-1, 1], [1, 1], [0, -1], [-1, 0], [1, 0]], Z = [3400, 260, 110];   // far mountains, the lake, the near lake
    for (var i = 0; i < c.length; i++) { _o.copy(probe.position); _d.set(c[i][0], c[i][1], 0.5).unproject(probe).sub(_o).normalize();
      if (_d.z >= -1e-4) return false;
      for (var j = 0; j < Z.length; j++) { if (c[i][1] > -1 && Z[j] < 3400) continue;   // the near distances matter only along the bottom of the frame
        var t = (-Z[j] - _o.z) / _d.z, x = _o.x + _d.x * t, y = _o.y + _d.y * t;
        if (Math.abs(x) > tanH * Z[j] * 0.995 || Math.abs(y) > tanV * Z[j] * 0.995) return false; } }
    return true;
  }
  function clampT() {
    T.orbit = clamp(T.orbit, -L.orbit, L.orbit); T.tilt = clamp(T.tilt, -L.tilt, L.tilt); T.dolly = clamp(T.dolly, L.dolly[0], L.dolly[1]);
    T.height = clamp(T.height, L.height[0], L.height[1]); T.pan = clamp(T.pan, L.pan[0], L.pan[1]); T.fov = clamp(T.fov, L.fov[0], L.fov[1]);
    if (PANO) T.ly = clamp(T.ly, -1.35, 1.35);                       // a panorama: turn anywhere, up to near the zenith / the ground at your feet
    else { var lim = Math.max(0, (SC.vfov - T.fov) / 2) * Math.PI / 180; T.ly = clamp(T.ly, -lim, lim); T.lx = clamp(T.lx, -lim * SC.aspect, lim * SC.aspect); }
    if (covered(T)) { lastOK = JSON.parse(JSON.stringify(T)); return; }
    /* past what the photograph holds: the drone stops at that edge, like a fence (nothing zooms by itself) */
    if (lastOK) { for (var q in lastOK) T[q] = lastOK[q]; V.orbit = V.tilt = V.pan = V.height = V.lx = V.ly = 0; for (var d in DV) DV[d] = 0; return; }
    for (var k = 0; k < 40 && !covered(T); k++) { T.fov *= 0.965; T.lx *= 0.9; T.ly *= 0.9; }   // only for a new screen shape: fit the frame once
    lastOK = JSON.parse(JSON.stringify(T));
  }
  var lastOK = null;
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  /* ---------- input: drag = orbit, Shift / two fingers = pan, wheel / pinch = zoom, double = the island ---------- */
  var ptrs = {}, last = null, pinch = null, cv = $('gl');
  cv.addEventListener('pointerdown', function (e) { wake(); closePanels(); ptrs[e.pointerId] = { x: e.clientX, y: e.clientY }; try { cv.setPointerCapture(e.pointerId); } catch (er) {} startAudio(); });
  cv.addEventListener('pointermove', function (e) {
    wake(); var p = ptrs[e.pointerId]; if (!p) return; var ids = Object.keys(ptrs), dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY;
    var k = T.fov / SC.vfov;
    if (ids.length === 1) {
      if (e.shiftKey) { V.pan = -dx * 0.0016; V.height = dy * 0.0016; }
      else { var tk = PANO ? 0.00034 : 0.00011; V.lx = dx * tk * k; V.ly = dy * tk * k; }              // turn your head (drag the view)
    } else if (ids.length === 2) {
      var a = ptrs[ids[0]], b = ptrs[ids[1]], dist = Math.hypot(a.x - b.x, a.y - b.y), mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      if (pinch) { T.fov *= Math.pow(pinch.d / Math.max(1, dist), 1); V.pan = -(mx - pinch.x) * 0.0016; V.height = (my - pinch.y) * 0.0016; }
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
  /* ---------- the drone remote: two sticks (Mode 2) and the keyboard (WASD · Q/E · R/F) ---------- */
  var STL = { x: 0, y: 0 }, STR = { x: 0, y: 0 }, KEYS = {}, DV = { f: 0, s: 0, u: 0, y: 0 };
  function stick(id, st) {
    var el = $(id), knob = el.querySelector('i'), pid = null;
    function set(e) { var r = el.getBoundingClientRect(), x = (e.clientX - r.left - r.width / 2) / (r.width / 2 - 18), y = (e.clientY - r.top - r.height / 2) / (r.height / 2 - 18), l = Math.hypot(x, y); if (l > 1) { x /= l; y /= l; }
      st.x = x; st.y = y; knob.style.transform = 'translate(' + (x * (r.width / 2 - 26)) + 'px,' + (y * (r.height / 2 - 26)) + 'px)'; }
    el.addEventListener('pointerdown', function (e) { e.stopPropagation(); e.preventDefault(); pid = e.pointerId; try { el.setPointerCapture(pid); } catch (er) {} wake(); startAudio(); closePanels(); set(e); });
    el.addEventListener('pointermove', function (e) { if (e.pointerId === pid) { set(e); wake(); } });
    function up(e) { if (e.pointerId !== pid) return; pid = null; st.x = st.y = 0; knob.style.transition = 'transform .18s ease'; knob.style.transform = ''; setTimeout(function () { knob.style.transition = ''; }, 200); }   // springs back to centre
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
  }
  window.addEventListener('keyup', function (e) { KEYS[e.code] = false; });
  window.addEventListener('blur', function () { KEYS = {}; });
  function fly(dt) {
    var k = function (c) { return KEYS[c] ? 1 : 0; };
    var want = { f: -STR.y + k('KeyW') - k('KeyS'), s: STR.x + k('KeyD') - k('KeyA'), u: -STL.y + k('KeyR') - k('KeyF'), y: STL.x + k('KeyE') - k('KeyQ') };
    var a = 1 - Math.exp(-dt * 3.2);                                   // the drone eases into and out of every move
    for (var q in DV) DV[q] += (Math.max(-1, Math.min(1, want[q])) - DV[q]) * a;
    if (Math.abs(DV.f) + Math.abs(DV.s) + Math.abs(DV.u) + Math.abs(DV.y) < 1e-3) return;
    wake();
    var sp = 2.6, h = T.lx;
    T.lx -= DV.y * 0.32 * dt;                                         // yaw (it turns only as far as the photograph reaches at this focal length)
    var fx = -Math.sin(h), fz = -Math.cos(h), rx = Math.cos(h), rz = -Math.sin(h);
    var dx = (DV.f * fx + DV.s * rx) * sp * dt, dz = (DV.f * fz + DV.s * rz) * sp * dt;
    T.pan += dx; T.dolly -= dz; T.height += DV.u * 1.8 * dt;
  }
  window.addEventListener('keydown', function (e) {
    wake(); var k = T.fov / SC.vfov;
    if (e.key === 'ArrowLeft') T.lx += 0.01 * k; else if (e.key === 'ArrowRight') T.lx -= 0.01 * k; else if (e.key === 'ArrowUp') T.ly += 0.01 * k; else if (e.key === 'ArrowDown') T.ly -= 0.01 * k;
    else if (e.key === '+' || e.key === '=') T.fov *= 0.92; else if (e.key === '-') T.fov /= 0.92; else if (e.key === '0' || e.key === 'Home') reset(); else if (e.key === 'c' || e.key === 'C') capture(); else if (e.key === 'Escape') exit();
    else return; clampT();
  });

  /* ---------- frame ---------- */
  var clock = new THREE.Clock(), t0 = 0;
  function loop() {
    requestAnimationFrame(loop); if (document.hidden) return;
    var dt = Math.min(0.05, clock.getDelta()); t0 += dt; U.uT.value = t0;
    ['orbit', 'tilt', 'pan', 'height', 'lx', 'ly'].forEach(function (k) { if (Math.abs(V[k]) > 1e-6) { T[k] += V[k]; V[k] *= Math.pow(0.0025, dt); } });   // momentum, eased out
    clampT();
    var f = 1 - Math.exp(-dt * 6);                                    // damping: every move eases in and out
    for (var k in S) S[k] += (T[k] - S[k]) * f;
    pose(S, camera); syncSliders(); renderer.render(scene, camera);
  }
  function resize() { var w = window.innerWidth, h = window.innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); lastOK = null; clampT(); }
  window.addEventListener('resize', resize);

  /* ---------- toolbar: hidden until the pointer moves; never more than one panel ---------- */
  var calmT = 0;
  function wake() { document.body.classList.remove('calm'); clearTimeout(calmT); calmT = setTimeout(function () { if (!openPanel && !STL.x && !STL.y && !STR.x && !STR.y) document.body.classList.add('calm'); else wake(); }, 3200); }
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
    $('sceneList').innerHTML = SCENES.map(function (s) { return '<div class="scene' + (s === SC ? ' on' : '') + '" data-id="' + s.id + '"><i style="background-image:url(' + s.thumb + ')"></i><div><b>' + s.name + '</b><em>' + s.zh + ' · ' + s.place + '</em><span class="tag">' + s.kindZh + '</span></div></div>'; }).join('');
  }
  $('sceneList').addEventListener('click', function (e) { var d = e.target.closest('.scene'); if (!d || d.dataset.id === SC.id) return; closePanels(); setScene(ALL[d.dataset.id]).then(function () { toast(SC.zh + ' · ' + SC.kindZh); }); });
  /* the camera panel: height, dolly, focal length (mm, full-frame equivalent), orbit */
  var SL = { sHeight: ['height', L.height[0], L.height[1]], sDolly: ['dolly', L.dolly[0], L.dolly[1]], sOrbit: ['pan', L.pan[0], L.pan[1]] };
  Object.keys(SL).forEach(function (id) { $(id).addEventListener('input', function (e) { var q = SL[id]; T[q[0]] = q[1] + (q[2] - q[1]) * e.target.value / 1000; clampT(); }); });
  function mmOf(fov) { return 12 / Math.tan(fov / 2 * Math.PI / 180); }
  function fovOf(mm) { return 2 * Math.atan(12 / mm) * 180 / Math.PI; }
  var MM0 = mmOf(L.fov[1]), MM1 = mmOf(L.fov[0]);
  $('sFocal').addEventListener('input', function (e) { var mm = MM0 * Math.pow(MM1 / MM0, e.target.value / 1000); T.fov = fovOf(mm); clampT(); });
  function syncSliders() {
    if (openPanel !== 'pCamera') return;
    Object.keys(SL).forEach(function (id) { var q = SL[id], el = $(id); if (document.activeElement !== el) el.value = Math.round((T[q[0]] - q[1]) / (q[2] - q[1]) * 1000); });
    if (document.activeElement !== $('sFocal')) $('sFocal').value = Math.round(Math.log(mmOf(T.fov) / MM0) / Math.log(MM1 / MM0) * 1000);
    $('vHeight').textContent = (T.height >= 0 ? '+' : '') + T.height.toFixed(1) + ' m'; $('vDolly').textContent = (T.dolly >= 0 ? '+' : '') + T.dolly.toFixed(0) + ' m';
    $('vFocal').textContent = mmOf(T.fov).toFixed(0) + ' mm'; $('vOrbit').textContent = (T.pan >= 0 ? '+' : '') + T.pan.toFixed(1) + ' m';
  }
  function reset() { lastOK = null; var d = JSON.parse(JSON.stringify(DEF)); for (var k in d) T[k] = d[k]; V.orbit = V.tilt = V.pan = V.height = V.lx = V.ly = 0; clampT(); toast('经典机位'); }

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
  function goShot(s) { if (!s || !s.st) return; if (s.scene && s.scene !== SC.id && ALL[s.scene]) { return setScene(ALL[s.scene]).then(function () { goShot(s); }); } lastOK = null; for (var k in s.st) { T[k] = s.st[k]; S[k] = s.st[k]; } V.orbit = V.tilt = V.pan = V.height = V.lx = V.ly = 0; toast('回到这一刻 · ' + new Date(s.t).toLocaleString()); }
  function renderShots() {
    $('shots').innerHTML = SHOTS.length ? SHOTS.map(function (s) { return '<div class="shot" data-id="' + s.id + '" style="background-image:url(' + s.thumb + ')"><button type="button" data-del="' + s.id + '" aria-label="删除">×</button><span>' + new Date(s.t).toLocaleDateString() + ' ' + new Date(s.t).toLocaleTimeString().slice(0, 5) + '</span></div>'; }).join('') : '<div class="empty">还没有收藏的机位。按 Capture 定格当前画面。</div>';
  }
  $('shots').addEventListener('click', function (e) { var d = e.target.closest('[data-del]'); if (d) { e.stopPropagation(); delShot(d.dataset.del); return; } var s = e.target.closest('.shot'); if (s) goShot(SHOTS.filter(function (x) { return x.id === s.dataset.id; })[0]); });
  SHOTS = localShots();
  function restoreStart() {
    var id = Q.get('shot'); if (id) { var s = SHOTS.filter(function (x) { return x.id === id; })[0]; if (s) return goShot(s); }
    if (Q.get('enter')) { S.fov = SC.vfov * 0.74; S.dolly = 6; }   // coming through the window: a little closer, then the view opens out
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
