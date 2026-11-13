/* Minest · Scenic World (2026-11-13) — an immersive view, not a game map. Like an Apple Vision Pro environment: you stand
   where the view is best and look — turn, lean, step a little, zoom.
   Scenes come from scenic-core.js: a real 360° panorama (Alps Field, CC0) you can turn all the way round in, and a real
   photograph of Lake Bled (Krzysztof Golik, CC BY-SA 4.0) as a two-layer 2.5D scene you look at from its viewpoint.
   Honest limits: a photograph is looked at inside its own frame (it is not passed off as 360°); appearances are only the
   real ones a scene has; nothing here calls an Apple API.
   Vision Pro refinement (same day):
     Immersion  — Window / Ambient / Full and a dial between them. Spatial Home (the parent page) does the room side: it
                  opens the scene out of the wall window, keeps the office round it in Ambient, hides it in Full.
     Appearance — Day / Sunset / Night / Automatic, each only where a real photograph exists.
     Living     — water, wind, vegetation, clouds, haze, light: each its own switch (scenic-core uniforms).
     Sound      — wind, water, birds, a nature bed, a far bell: own volume and mute each, placed left / right by where
                  you look; ducks while you work in the Workspace (any manual change overrides it).
     Workspace  — an existing Minest page (Type Workshop, 3D Type) in a window in front of the scene; the scene keeps
                  rendering, can be dimmed; hide and restore without leaving.
     My Environments — saved environments (scene, name, preview, type, view, appearance, sound, immersion, prefs);
                  one is the default (Spatial Home opens with it and its window shows it).
   Talks to Spatial Home by postMessage {scenic:1, op}:
     → ready · close · list · save · del (moments) · scene · immersion · env-save · env-del · env-def
     ← shots · goto · envs · imm · focus */
(function () {
  'use strict';
  var THREE = window.THREE, $ = function (id) { return document.getElementById(id); };
  var Q = new URLSearchParams(location.search), EMBED = window.parent !== window;
  var CORE = window.ScenicCore, ALL = CORE.scenes, SCENES = [ALL.alps, ALL.bled], LOW = (navigator.deviceMemory && navigator.deviceMemory < 4) || Math.min(screen.width, screen.height) < 500;
  /* what each kind of scene can honestly do: a panorama is looked at from where it was taken (turn anywhere, a step or two);
     a spatial scene (one photo) only inside its own frame, leaning a few metres */
  ALL.bled.limits = { orbit: 0.008, tilt: 0.006, dolly: [-10, 9], height: [-4, 8], pan: [-6, 6], fov: [7, 40] };
  ALL.alps.limits = { orbit: 0, tilt: 0, dolly: [-1.2, 1.2], height: [-0.5, 0.7], pan: [-1.2, 1.2], fov: [22, 92] };
  ALL.bled.sound = { water: 0, bell: 0.02, birds: [-1.1, 1.1] };     // where each sound is (radians, + = left of the view you arrive with)
  ALL.alps.sound = { water: 0, bell: 0, birds: [-3.1, 3.1] };

  /* ---------- preferences (this device) ---------- */
  function lsGet(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  var PREF = 'minest.scenic.scene', PKEY = 'minest.scenic.prefs.v1';
  var LIVE = ['water', 'wind', 'veg', 'cloud', 'haze', 'light'], LIVE_ZH = { water: '水面波动', wind: '风', veg: '植被摆动', cloud: '云的移动', haze: '大气薄雾', light: '细微光线变化' };
  var LIVE_NO = { water: '这个场景里没有水面' };
  var CH = ['wind', 'water', 'birds', 'bed', 'bell'], CH_ZH = { wind: '风声', water: '水声', birds: '鸟鸣', bed: '自然底噪', bell: '远处钟声' };
  var PR = lsGet(PKEY, {}); PR.appearance = PR.appearance || {}; PR.live = PR.live || {}; LIVE.forEach(function (k) { if (PR.live[k] == null) PR.live[k] = 1; });
  PR.audio = PR.audio || {}; if (PR.audio.master == null) PR.audio.master = 0.7; if (PR.audio.duck == null) PR.audio.duck = true; PR.audio.ch = PR.audio.ch || {};
  if (PR.dim == null) PR.dim = 0.35; if (!PR.imm) PR.imm = 'full'; if (PR.immV == null) PR.immV = 1;
  function savePR() { lsSet(PKEY, PR); }
  function chOf(sc) { var c = PR.audio.ch[sc.id] = PR.audio.ch[sc.id] || {}; CH.forEach(function (k) { if (!c[k]) c[k] = { v: sc.audio[k] || 0, m: false }; }); return c; }

  /* appearance: the choice (day / sunset / night / auto) → the real one this scene has */
  function choiceOf(sc) { return PR.appearance[sc.id] || sc.appearDef; }
  function realAp(sc, choice) { choice = choice || choiceOf(sc); var r = choice === 'auto' ? CORE.autoAppear(sc) : choice; return sc.appear[r] ? r : sc.appearDef; }
  function thumbOf(sc, ap) { var a = sc.appear && sc.appear[ap]; return (a && a.thumb) || sc.thumb; }

  var SC = ALL[Q.get('scene')] || ALL[lsGet(PREF, null)] || ALL[(function () { try { return localStorage.getItem(PREF); } catch (e) { return null; } })()] || ALL.bled;
  if (Q.get('ap')) PR.appearance[SC.id] = Q.get('ap');
  var AP = realAp(SC);
  /* ---------- the photograph shows at once, before anything else is ready ---------- */
  $('plate').style.backgroundImage = 'url(' + thumbOf(SC, AP) + ')';
  $('credit').innerHTML = SC.credit;

  var renderer = null;
  try { renderer = new THREE.WebGLRenderer({ canvas: $('gl'), antialias: true, preserveDrawingBuffer: false }); } catch (e) { renderer = null; }
  if (!renderer) { staticMode(); return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, LOW ? 1.5 : 2));
  renderer.outputEncoding = THREE.LinearEncoding;
  var scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(SC.vfov, 1, 1, 12000);
  var tanV = 1, tanH = 1, PANO = false;
  var UPW = new THREE.Vector3(0, 1, 0), RIGHT = new THREE.Vector3(1, 0, 0), P = new THREE.Vector3(), U = { uT: { value: 0 }, uLive: { value: 1 } }, core = null, looping = false, loading = null;
  /* switch scenes or appearances: the new one loads behind the current picture, then a soft cross-fade (no black, no flash) */
  function setScene(sc, first, choice, keepView) {
    if (choice) PR.appearance[sc.id] = choice;
    var ap = realAp(sc), plate = $('plate'); plate.style.transition = 'opacity .6s ease'; plate.style.backgroundImage = 'url(' + thumbOf(sc, ap) + ')'; plate.style.backgroundSize = 'cover';
    if (!first) document.body.classList.remove('live');
    var my = loading = CORE.load(sc.id, { base: '', low: LOW, renderer: renderer, appearance: ap }).then(function (c) {
      if (my !== loading) { try { c.dispose(); } catch (e) {} return core; }
      var same = SC === sc && keepView;
      if (core) { scene.remove(core.group); try { core.dispose(); } catch (e) {} }
      core = c; SC = sc; AP = c.appear || ap; PANO = c.kind === 'pano'; U = c.U; P.copy(c.P); tanV = c.tanV; tanH = c.tanH; L = SC.limits; scene.add(c.group);
      LIVE.forEach(function (k) { var u = U[uName(k)]; if (u) u.value = liveOn(k) ? 1 : 0; });
      camera.near = PANO ? 0.05 : 1; camera.far = PANO ? 6000 : 12000;
      DEF = { orbit: 0, tilt: 0, dolly: 0, height: 0, pan: 0, fov: PANO ? 70 : SC.vfov * 0.86, lx: 0, ly: 0 };
      if (!same) { for (var k in DEF) { S[k] = DEF[k]; T[k] = DEF[k]; } }
      lastOK = null;
      $('credit').innerHTML = SC.credit + (SC.appear[AP] && SC.appear[AP].note ? ' · ' + SC.appear[AP].zh + '：' + SC.appear[AP].note : ''); $('camKind').textContent = SC.kindZh;
      try { localStorage.setItem(PREF, SC.id); } catch (e) {} savePR(); post({ op: 'scene', id: SC.id, appearance: AP });
      resize(); if (!looping) { looping = true; loop(); }
      audioScene();
      setTimeout(function () { document.body.classList.add('live'); }, 60);
      if (openPanel === 'pLook') renderLook(); if (openPanel === 'pSound') renderSound();
      return c;
    });
    return my;
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
    probe.aspect = camera.aspect; pose(st, probe);
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
    /* past what the photograph holds: the view stops at that edge, like a fence (nothing zooms by itself) */
    if (lastOK) { for (var q in lastOK) T[q] = lastOK[q]; V.orbit = V.tilt = V.pan = V.height = V.lx = V.ly = 0; return; }
    for (var k = 0; k < 40 && !covered(T); k++) { T.fov *= 0.965; T.lx *= 0.9; T.ly *= 0.9; }   // only for a new screen shape: fit the frame once
    lastOK = JSON.parse(JSON.stringify(T));
  }
  var lastOK = null;
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  /* ---------- input: drag = look, Shift / two fingers = a step, wheel / pinch = zoom, double = the subject ---------- */
  var ptrs = {}, pinch = null, cv = $('gl');
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
  function focusSubject() {
    if (PANO) { T.ly = 0; T.fov = 50; clampT(); toast('平视远方'); return; }
    _a.copy(P); var dir = _a.clone().normalize(); T.lx = Math.atan2(dir.x, -dir.z) * 0.98; T.ly = Math.atan2(dir.y, Math.hypot(dir.x, dir.z)) * 0.98; T.fov = 17; T.dolly = Math.max(T.dolly, 60); clampT(); toast('对准湖心岛');
  }
  window.addEventListener('keydown', function (e) {
    if (e.target && /INPUT|TEXTAREA/.test(e.target.tagName) && e.target.type !== 'range') return;
    wake(); var k = T.fov / SC.vfov;
    if (e.key === 'ArrowLeft') T.lx += 0.01 * k; else if (e.key === 'ArrowRight') T.lx -= 0.01 * k; else if (e.key === 'ArrowUp') T.ly += 0.01 * k; else if (e.key === 'ArrowDown') T.ly -= 0.01 * k;
    else if (e.key === '+' || e.key === '=') T.fov *= 0.92; else if (e.key === '-') T.fov /= 0.92; else if (e.key === '0' || e.key === 'Home') reset(); else if (e.key === 'c' || e.key === 'C') capture(); else if (e.key === 'Escape') exit();
    else if (e.key === ']') setImmV(IMM.v + 0.1, true); else if (e.key === '[') setImmV(IMM.v - 0.1, true);
    else return; clampT();
  });

  /* ---------- frame ---------- */
  var clock = new THREE.Clock(), t0 = 0, audT = 0;
  function uName(k) { return 'u' + k.charAt(0).toUpperCase() + k.slice(1); }
  function liveOn(k) { return !!PR.live[k] && SC.caps.indexOf(k) >= 0; }
  function loop() {
    requestAnimationFrame(loop); if (document.hidden) return;
    var dt = Math.min(0.05, clock.getDelta()); t0 += dt; U.uT.value = t0;
    ['orbit', 'tilt', 'pan', 'height', 'lx', 'ly'].forEach(function (k) { if (Math.abs(V[k]) > 1e-6) { T[k] += V[k]; V[k] *= Math.pow(0.0025, dt); } });   // momentum, eased out
    clampT();
    var f = 1 - Math.exp(-dt * 6);                                    // damping: every move eases in and out
    for (var k in S) S[k] += (T[k] - S[k]) * f;
    var fl = 1 - Math.exp(-dt * 1.5);                                  // a living motion fades in / out over a second or two, never snaps
    LIVE.forEach(function (q) { var u = U[uName(q)]; if (u) u.value += ((liveOn(q) ? 1 : 0) - u.value) * fl; });
    pose(S, camera); syncSliders(); renderer.render(scene, camera);
    if ((audT += dt) > 0.12) { audT = 0; audioLook(); lookOut(); }
  }
  function resize() { var w = window.innerWidth, h = window.innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); lastOK = null; clampT(); }
  window.addEventListener('resize', resize);
  /* the look goes to Spatial Home, so in Ambient the office round the scene turns with you */
  var lastLook = '';
  function lookOut() { if (!EMBED || IMM.level !== 'ambient') return; var s = S.lx.toFixed(4) + ',' + S.ly.toFixed(4); if (s === lastLook) return; lastLook = s; post({ op: 'look', lx: S.lx, ly: S.ly }); }

  /* ---------- toolbar: hidden until the pointer moves; never more than one panel ---------- */
  var calmT = 0;
  function wake() { document.body.classList.remove('calm'); clearTimeout(calmT); calmT = setTimeout(function () { if (!openPanel) document.body.classList.add('calm'); else wake(); }, 3200); }
  document.addEventListener('mousemove', wake); wake();
  var openPanel = null, PANELS = ['pScenes', 'pImm', 'pLook', 'pSound', 'pWork', 'pCamera'];
  function closePanels() { PANELS.forEach(function (id) { $(id).hidden = true; }); openPanel = null; [].forEach.call(document.querySelectorAll('#bar button'), function (b) { b.classList.remove('on'); }); }
  function toggle(id, btn) { var was = openPanel === id; closePanels(); if (!was) { $(id).hidden = false; openPanel = id; btn.classList.add('on'); } }
  $('bar').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return; wake(); startAudio(); var a = b.dataset.a;
    if (a === 'scenes') { renderScenes(); toggle('pScenes', b); } else if (a === 'imm') { renderImm(); toggle('pImm', b); } else if (a === 'look') { renderLook(); toggle('pLook', b); }
    else if (a === 'sound') { renderSound(); toggle('pSound', b); } else if (a === 'work') { renderWork(); toggle('pWork', b); } else if (a === 'camera') toggle('pCamera', b);
    else if (a === 'capture') { closePanels(); capture(); } else if (a === 'exit') exit();
  });
  PANELS.concat(['bar', 'ws', 'wsChip']).forEach(function (id) { $(id).addEventListener('pointerdown', function (e) { e.stopPropagation(); wake(); }); });

  /* ---------- Environments: Scenes · My Environments · Moments ---------- */
  var envTab = 'scenes';
  $('envTabs').addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; envTab = b.dataset.t; renderScenes(); });
  function renderScenes() {
    [].forEach.call($('envTabs').children, function (b) { b.classList.toggle('on', b.dataset.t === envTab); });
    $('sceneList').hidden = envTab !== 'scenes'; $('mineList').hidden = envTab !== 'mine'; $('shots').hidden = envTab !== 'moments';
    if (envTab === 'mine') return renderMine(); if (envTab === 'moments') return renderShots();
    $('sceneList').innerHTML = SCENES.map(function (s) { return '<div class="scene' + (s === SC ? ' on' : '') + '" data-id="' + s.id + '"><i style="background-image:url(' + thumbOf(s, realAp(s)) + ')"></i><div><b>' + s.name + '</b><em>' + s.zh + ' · ' + s.place + '</em><span class="tag">' + s.kindZh + '</span></div></div>'; }).join('')
      + '<p class="note">普通照片只做「站在观景点」的有限视角，不当作 360° 环境；只有实拍全景才能完整环顾。</p>';
  }
  $('sceneList').addEventListener('click', function (e) { var d = e.target.closest('.scene'); if (!d || d.dataset.id === SC.id) return; closePanels(); setScene(ALL[d.dataset.id]).then(function () { toast(SC.zh + ' · ' + SC.kindZh); }); });

  /* My Environments — kept by Spatial Home (backpack store 'scenic:envs') when embedded, on this device otherwise */
  var EKEY = 'minest.scenic.envs.v1', ENVS = lsGet(EKEY, []), EDEF = lsGet(EKEY + '.def', null);
  function keepEnvs() { lsSet(EKEY, ENVS); lsSet(EKEY + '.def', EDEF); }
  function envNow(name) {
    var id = 'e' + Date.now().toString(36);
    return { id: id, name: name || (SC.zh.split(' · ')[0] + ' · ' + (SC.appear[AP] ? SC.appear[AP].zh : '')), scene: SC.id, type: SC.kind, typeZh: SC.kindZh, preview: thumbShot(220),
      view: JSON.parse(JSON.stringify(S)), appearance: choiceOf(SC), audio: { master: PR.audio.master, mute: !!PR.audio.mute, duck: PR.audio.duck, ch: JSON.parse(JSON.stringify(chOf(SC))) },
      immersion: IMM.level === 'window' ? 'ambient' : IMM.level, immV: IMM.v, prefs: { live: JSON.parse(JSON.stringify(PR.live)), dim: PR.dim, workspace: WS.page || null }, t: Date.now() };
  }
  function renderMine() {
    var h = '<button type="button" class="wide" data-e="add">＋ 把现在的样子存为一个环境</button>';
    h += ENVS.length ? ENVS.map(function (v) {
      var sc = ALL[v.scene] || ALL.bled, ap = realAp(sc, v.appearance);
      return '<div class="env' + (v.id === EDEF ? ' def' : '') + '" data-id="' + v.id + '"><i style="background-image:url(' + (v.preview || thumbOf(sc, ap)) + ')"></i><div><b>' + esc(v.name) + (v.id === EDEF ? ' <span class="star">默认</span>' : '') + '</b><em>' + sc.zh.split(' · ')[0] + ' · ' + (v.appearance === 'auto' ? '自动' : (sc.appear[ap] || {}).zh) + ' · ' + IMM_ZH[v.immersion || 'full'] + '</em>'
        + '<span class="acts"><button type="button" data-e="use">使用</button><button type="button" data-e="def">' + (v.id === EDEF ? '取消默认' : '设为默认') + '</button><button type="button" data-e="ren">重命名</button><button type="button" data-e="upd">更新</button><button type="button" data-e="del">删除</button></span></div></div>';
    }).join('') : '<div class="empty">还没有保存的环境。调好风景、外观、声音和沉浸程度后，点上面的按钮保存。</div>';
    h += '<p class="note">导入自己的全景照片（2:1 等距柱状投影）：下一阶段支持，现在还不能导入。</p>';
    $('mineList').innerHTML = h;
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  $('mineList').addEventListener('click', function (e) {
    var b = e.target.closest('button[data-e]'); if (!b) return; var a = b.dataset.e, card = b.closest('.env'), v = card && ENVS.filter(function (x) { return x.id === card.dataset.id; })[0];
    if (a === 'add') { var n = envNow(); ENVS.unshift(n); if (!EDEF) EDEF = n.id; keepEnvs(); post({ op: 'env-save', env: n }); if (EDEF === n.id) post({ op: 'env-def', id: n.id }); toast('已保存 · ' + n.name); }
    else if (!v) return;
    else if (a === 'use') { closePanels(); applyEnv(v); }
    else if (a === 'def') { EDEF = EDEF === v.id ? null : v.id; keepEnvs(); post({ op: 'env-def', id: EDEF }); toast(EDEF ? '默认环境 · ' + v.name + '（落地窗也会显示它）' : '已取消默认环境'); }
    else if (a === 'ren') { var nm = prompt('环境名称', v.name); if (nm && nm.trim()) { v.name = nm.trim().slice(0, 40); keepEnvs(); post({ op: 'env-save', env: v }); } }
    else if (a === 'upd') { var u = envNow(v.name); u.id = v.id; ENVS[ENVS.indexOf(v)] = u; keepEnvs(); post({ op: 'env-save', env: u }); toast('已更新 · ' + v.name); }
    else if (a === 'del') { ENVS = ENVS.filter(function (x) { return x !== v; }); if (EDEF === v.id) { EDEF = null; post({ op: 'env-def', id: null }); } keepEnvs(); post({ op: 'env-del', id: v.id }); }
    renderMine();
  });
  function applyEnv(v, quiet) {
    var sc = ALL[v.scene] || ALL.bled;
    if (v.prefs && v.prefs.live) for (var k in v.prefs.live) PR.live[k] = v.prefs.live[k];
    if (v.prefs && v.prefs.dim != null) PR.dim = v.prefs.dim;
    if (v.audio) { PR.audio.master = v.audio.master; PR.audio.mute = !!v.audio.mute; PR.audio.duck = v.audio.duck !== false; if (v.audio.ch) PR.audio.ch[sc.id] = JSON.parse(JSON.stringify(v.audio.ch)); }
    savePR();
    var go = function () { if (v.view) { lastOK = null; for (var q in v.view) T[q] = v.view[q]; clampT(); } audioApply(); if (v.immersion) setImm(v.immersion, v.immV); if (v.prefs && v.prefs.workspace) openWork(v.prefs.workspace); if (!quiet) toast('环境 · ' + v.name); };
    if (sc !== SC || realAp(sc, v.appearance) !== AP) return setScene(sc, false, v.appearance).then(go);
    PR.appearance[sc.id] = v.appearance; go(); return Promise.resolve();
  }

  /* ---------- Immersion: Window · Ambient · Full (the room side is Spatial Home's) ---------- */
  var IMM = { level: EMBED ? (Q.get('imm') || PR.imm) : 'full', v: EMBED ? +(Q.get('immv') || PR.immV) : 1 }, IMM_ZH = { window: '窗口', ambient: '环境', full: '全沉浸' };
  function levelOf(v) { return v >= 0.97 ? 'full' : v < 0.2 ? 'window' : 'ambient'; }
  function setImm(level, v, fromDial) {
    if (!EMBED) { if (level !== 'full') toast('沉浸程度只在 Spatial Home 里从落地窗进入时可调'); return; }
    if (level === 'window') { IMM.level = 'window'; renderImm(); exit(); return; }
    IMM.level = level; IMM.v = v != null ? v : (level === 'full' ? 1 : 0.45); PR.imm = level; PR.immV = IMM.v; savePR();
    post({ op: 'immersion', level: level, v: IMM.v }); lastLook = ''; lookOut();
    if (!fromDial) renderImm(); else syncImm();
  }
  function setImmV(v, key) { v = clamp(v, 0, 1); var lv = levelOf(v); if (lv === 'window' && !key) { IMM.v = v; syncImm(); return; } setImm(lv, lv === 'window' ? 0 : v, true); }
  function renderImm() {
    [].forEach.call(document.querySelectorAll('#levels button'), function (b) { b.classList.toggle('on', b.dataset.l === IMM.level); b.disabled = !EMBED && b.dataset.l !== 'full'; });
    $('immNote').textContent = EMBED ? '表冠：向左缩回窗口，向右展开到全沉浸；也可以按 [ 和 ]。' : '这个页面是单独打开的，后面没有 Spatial Home 办公室，所以只有全沉浸。从 Spatial Home 的落地窗进入时，窗口 / 环境 / 全沉浸都可以用。';
    $('sImm').disabled = !EMBED; syncImm();
  }
  function syncImm() { if (document.activeElement !== $('sImm')) $('sImm').value = Math.round(IMM.v * 1000); $('vImm').textContent = IMM_ZH[levelOf(IMM.v)]; [].forEach.call(document.querySelectorAll('#levels button'), function (b) { b.classList.toggle('on', b.dataset.l === levelOf(IMM.v)); }); }
  $('levels').addEventListener('click', function (e) { var b = e.target.closest('button'); if (b && !b.disabled) setImm(b.dataset.l); });
  $('sImm').addEventListener('input', function (e) { setImmV(e.target.value / 1000); });
  $('sImm').addEventListener('change', function (e) { if (levelOf(e.target.value / 1000) === 'window') setImm('window'); });

  /* ---------- Appearance + Living ---------- */
  var AP_ALL = [['day', '白天'], ['sunset', '日落'], ['night', '夜晚'], ['auto', '自动']];
  function renderLook() {
    var ch = choiceOf(SC);
    $('apChips').innerHTML = AP_ALL.map(function (a) {
      var ok = a[0] === 'auto' || !!SC.appear[a[0]];
      return '<button type="button" data-ap="' + a[0] + '"' + (ok ? '' : ' disabled') + ' class="' + (ch === a[0] ? 'on' : '') + '">' + a[1] + '</button>';
    }).join('');
    var miss = AP_ALL.filter(function (a) { return a[0] !== 'auto' && !SC.appear[a[0]]; }).map(function (a) { return a[1]; });
    var cur = SC.appear[AP];
    $('apNote').innerHTML = '现在：<b>' + (cur ? cur.zh : '') + '</b>' + (cur && cur.note ? ' · ' + cur.note : '') + (ch === 'auto' ? ' · 自动按本地时间选择已有的实拍外观' : '')
      + (miss.length ? '<br>' + miss.join('、') + '：这个场景没有对应的实拍素材，不用滤镜假造。' : '');
    $('liveList').innerHTML = LIVE.map(function (k) { var has = SC.caps.indexOf(k) >= 0; return '<label class="sw' + (has ? '' : ' off') + '"><span>' + LIVE_ZH[k] + (has ? '' : '<em>' + (LIVE_NO[k] || '这个场景没有') + '</em>') + '</span><input type="checkbox" data-k="' + k + '"' + (has && PR.live[k] ? ' checked' : '') + (has ? '' : ' disabled') + '><i></i></label>'; }).join('');
  }
  $('apChips').addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b || b.disabled) return; var c = b.dataset.ap, was = AP; PR.appearance[SC.id] = c; savePR();
    var r = realAp(SC, c); if (r !== was) setScene(SC, false, c, true).then(function () { toast('外观 · ' + SC.appear[AP].zh); }); else { renderLook(); post({ op: 'scene', id: SC.id, appearance: AP }); toast(c === 'auto' ? '自动 · 现在是' + SC.appear[r].zh : '外观 · ' + SC.appear[r].zh); } });
  $('liveList').addEventListener('change', function (e) { var k = e.target.dataset.k; if (!k) return; PR.live[k] = e.target.checked ? 1 : 0; savePR(); });

  /* ---------- Spatial ambient audio: five channels, each placed, each with its own volume / mute; ducks while you work ---------- */
  var A = { ac: null, master: null, ch: {}, on: false, timers: [], focus: false, override: false };
  function startAudio() { if (A.started) { if (A.ac && A.ac.state === 'suspended' && A.on) A.ac.resume(); return; } A.started = true; ambient(true); }
  function noiseBuf(ac, brown) { var b = ac.createBuffer(1, ac.sampleRate * 3, ac.sampleRate), d = b.getChannelData(0), last = 0; for (var i = 0; i < d.length; i++) { var w = Math.random() * 2 - 1; last = (last + (brown ? 0.02 : 0.2) * w) / (brown ? 1.02 : 1.2); d[i] = last * (brown ? 3.5 : 1.6); } return b; }
  function panner(ac) { return ac.createStereoPanner ? ac.createStereoPanner() : null; }
  function wire(src, ch, pan) { var p = pan != null ? panner(A.ac) : null; if (p) { p.pan.value = pan; src.connect(p); p.connect(A.ch[ch].g); } else src.connect(A.ch[ch].g); return p; }
  function audioInit() {
    if (A.ac) return true; var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
    var ac = A.ac = new AC(); A.master = ac.createGain(); A.master.gain.value = 0; A.master.connect(ac.destination);
    CH.forEach(function (k) { var g = ac.createGain(), p = panner(ac); g.gain.value = 0; if (p) { g.connect(p); p.connect(A.master); } else g.connect(A.master); A.ch[k] = { g: g, p: p }; });
    var nb = noiseBuf(ac, true), nb2 = noiseBuf(ac, true), nw = noiseBuf(ac, false);
    /* wind: two decorrelated gusts, one each side */
    [[nb, -0.7, 0.07], [nb2, 0.7, 0.053]].forEach(function (q) { var s = ac.createBufferSource(); s.buffer = q[0]; s.loop = true; var lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 420; var g = ac.createGain(); g.gain.value = 0.3;
      var lfo = ac.createOscillator(); lfo.frequency.value = q[2]; var lg = ac.createGain(); lg.gain.value = 0.18; lfo.connect(lg); lg.connect(g.gain); lfo.start(); s.connect(lp); lp.connect(g); wire(g, 'wind', q[1]); s.start(); });
    /* water: lapping on the shore below */
    var w = ac.createBufferSource(); w.buffer = nb; w.loop = true; w.playbackRate.value = 1.6; var bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 700; bp.Q.value = 0.8; var wa = ac.createGain(); wa.gain.value = 0;
    w.connect(bp); bp.connect(wa); wire(wa, 'water'); w.start();
    (function lap() { var t = ac.currentTime; wa.gain.setTargetAtTime(0.5 + Math.random() * 0.35, t, 0.25); wa.gain.setTargetAtTime(0.1, t + 0.5 + Math.random() * 0.5, 0.6); A.timers.push(setTimeout(lap, 1400 + Math.random() * 1800)); })();
    /* the nature bed: a low rumble of air and a faint high hiss of leaves / grass */
    var b1 = ac.createBufferSource(); b1.buffer = nb2; b1.loop = true; var l1 = ac.createBiquadFilter(); l1.type = 'lowpass'; l1.frequency.value = 160; var g1 = ac.createGain(); g1.gain.value = 0.55; b1.connect(l1); l1.connect(g1); wire(g1, 'bed'); b1.start();
    var b2 = ac.createBufferSource(); b2.buffer = nw; b2.loop = true; var h2 = ac.createBiquadFilter(); h2.type = 'highpass'; h2.frequency.value = 5200; var g2 = ac.createGain(); g2.gain.value = 0.05; b2.connect(h2); h2.connect(g2); wire(g2, 'bed'); b2.start();
    /* birds: a short phrase now and then, each from its own direction (fixed in the scene, so turning moves it) */
    (function bird() { if (A.on && A.ch.birds) { var r = SC.sound.birds, az = r[0] + Math.random() * (r[1] - r[0]), t = ac.currentTime + 0.05, n = 2 + (Math.random() * 3 | 0), p = panner(ac), g0 = ac.createGain(); g0.gain.value = 1; g0.connect(p || A.ch.birds.g); if (p) { p.connect(A.ch.birds.g); BIRDS.push({ p: p, az: az, t: t }); p.pan.value = panOf(az); }
        for (var i = 0; i < n; i++) { var o = ac.createOscillator(), g = ac.createGain(), f = 2600 + Math.random() * 1500; o.frequency.setValueAtTime(f, t + i * 0.13); o.frequency.exponentialRampToValueAtTime(f * 1.35, t + i * 0.13 + 0.07); g.gain.setValueAtTime(0, t + i * 0.13); g.gain.linearRampToValueAtTime(0.08, t + i * 0.13 + 0.01); g.gain.exponentialRampToValueAtTime(0.0005, t + i * 0.13 + 0.09); o.connect(g); g.connect(g0); o.start(t + i * 0.13); o.stop(t + i * 0.13 + 0.1); } }
      A.timers.push(setTimeout(bird, 5000 + Math.random() * 8000)); })();
    /* the bell: the island church, far off across the lake (Lake Bled only) */
    (function bell() { if (A.on && A.ch.bell) { var t = ac.currentTime + 0.05; [1, 2, 2.4, 3, 4.2].forEach(function (h, i) { var o = ac.createOscillator(), g = ac.createGain(); o.frequency.value = 232 * h; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.05 / (i + 1), t + 0.02); g.gain.exponentialRampToValueAtTime(0.0003, t + 7 - i); o.connect(g); g.connect(A.ch.bell.g); o.start(t); o.stop(t + 7.2); }); }
      A.timers.push(setTimeout(bell, 40000 + Math.random() * 40000)); })();
    return true;
  }
  var BIRDS = [];
  function yawNow() { return S.lx + S.orbit; }
  function panOf(az) { var r = az - yawNow(); return clamp(-Math.sin(r), -0.95, 0.95); }   // left of where you look → left ear
  function audioLook() {
    if (!A.ac) return; var t = A.ac.currentTime;
    if (A.ch.water.p) A.ch.water.p.pan.setTargetAtTime(panOf(SC.sound.water) * 0.6, t, 0.2);
    if (A.ch.bell.p) A.ch.bell.p.pan.setTargetAtTime(panOf(SC.sound.bell), t, 0.2);
    BIRDS = BIRDS.filter(function (b) { if (t - b.t > 2) return false; b.p.pan.setTargetAtTime(panOf(b.az), t, 0.1); return true; });
  }
  function ducked() { return A.focus && PR.audio.duck && !A.override; }
  function audioApply(slow) {
    if (!A.ac) return; var t = A.ac.currentTime, c = chOf(SC);
    CH.forEach(function (k) { var avail = (SC.audio[k] || 0) > 0; A.ch[k].g.gain.setTargetAtTime(avail && !c[k].m ? c[k].v : 0, t, 0.3); });
    var m = A.on && !PR.audio.mute ? PR.audio.master * (ducked() ? 0.35 : 1) : 0;
    A.master.gain.cancelScheduledValues(t); A.master.gain.setTargetAtTime(m, t, slow ? 0.9 : 0.25);
    if (openPanel === 'pSound') syncDuck();
  }
  function audioScene() { if (A.ac) audioApply(); }
  function ambient(on, quiet) {
    try { if (!audioInit()) return; if (A.ac.state === 'suspended') A.ac.resume(); A.on = on; audioApply(!quiet); } catch (e) {}
  }
  function renderSound() {
    var c = chOf(SC);
    $('mix').innerHTML = '<div class="mrow master"><button type="button" class="mute' + (PR.audio.mute ? ' on' : '') + '" data-m="master" aria-label="静音"></button><span>总音量</span><input type="range" min="0" max="1000" data-v="master" value="' + Math.round(PR.audio.master * 1000) + '"><b>' + Math.round(PR.audio.master * 100) + '</b></div>'
      + CH.map(function (k) { var avail = (SC.audio[k] || 0) > 0;
        return '<div class="mrow' + (avail ? '' : ' off') + '"><button type="button" class="mute' + (c[k].m ? ' on' : '') + '" data-m="' + k + '"' + (avail ? '' : ' disabled') + ' aria-label="静音"></button><span>' + CH_ZH[k] + '</span>'
          + (avail ? '<input type="range" min="0" max="1000" data-v="' + k + '" value="' + Math.round(c[k].v * 1000) + '"><b>' + Math.round(c[k].v * 100) + '</b>' : '<em>这个场景里没有</em><b></b>') + '</div>'; }).join('');
    $('duck').checked = !!PR.audio.duck; syncDuck();
  }
  function syncDuck() { $('duckNote').textContent = !PR.audio.duck ? '已关闭自动降低。' : A.focus ? (A.override ? '正在专注 · 你手动调了音量，保持你的设置。' : '正在专注 · 环境声音已降到 35%。') : '在工作区里打字或操作时，环境声音会自动降低；手动调节任何音量即可覆盖。'; }
  $('mix').addEventListener('input', function (e) { var k = e.target.dataset.v; if (!k) return; var v = e.target.value / 1000; if (k === 'master') PR.audio.master = v; else chOf(SC)[k].v = v; e.target.nextElementSibling.textContent = Math.round(v * 100); if (A.focus) A.override = true; startAudio(); savePR(); audioApply(); });
  $('mix').addEventListener('click', function (e) { var b = e.target.closest('button[data-m]'); if (!b || b.disabled) return; var k = b.dataset.m; if (k === 'master') PR.audio.mute = !PR.audio.mute; else chOf(SC)[k].m = !chOf(SC)[k].m; b.classList.toggle('on'); if (A.focus) A.override = true; startAudio(); savePR(); audioApply(); });
  $('duck').addEventListener('change', function (e) { PR.audio.duck = e.target.checked; A.override = false; savePR(); audioApply(); });
  function setFocus(on) { if (A.focus === on) return; A.focus = on; if (!on) A.override = false; audioApply(true); }

  /* ---------- Scenic Workspace: an existing Minest page in a window in front of the scene ---------- */
  var PAGES = { workshop: { zh: '文字工坊', en: 'Type Workshop', url: '../type3d/workshop.html' }, type3d: { zh: '3D Type 立体打字', en: '3D Type', url: '../type3d/index.html' } };
  var WS = { page: null, hidden: false, lastKey: 0 };
  function renderWork() {
    $('wsPages').innerHTML = Object.keys(PAGES).map(function (k) { return '<button type="button" data-p="' + k + '" class="' + (WS.page === k ? 'on' : '') + '">' + PAGES[k].zh + '</button>'; }).join('');
    $('sDim').value = Math.round(PR.dim * 1000); $('vDim').textContent = Math.round((1 - PR.dim) * 100) + '%';
    $('wsToggle').textContent = !WS.page ? '没有打开的窗口' : WS.hidden ? '恢复窗口' : '隐藏窗口'; $('wsToggle').disabled = !WS.page; $('wsClose').disabled = !WS.page;
  }
  function openWork(k) {
    var pg = PAGES[k]; if (!pg) return; WS.page = k; WS.hidden = false;
    if ($('wsFrame').dataset.p !== k) { $('wsFrame').src = pg.url; $('wsFrame').dataset.p = k; }
    $('wsTitle').textContent = pg.zh; $('ws').hidden = false; $('wsChip').hidden = true; dimTo(PR.dim); renderWork();
  }
  function hideWork(h) { if (!WS.page) return; WS.hidden = h; $('ws').hidden = h; $('wsChip').hidden = !h; $('wsChip').textContent = '▣ ' + PAGES[WS.page].zh; dimTo(h ? 0 : PR.dim); if (h) setFocus(false); renderWork(); }
  function closeWork() { WS.page = null; $('ws').hidden = true; $('wsChip').hidden = true; $('wsFrame').src = 'about:blank'; $('wsFrame').dataset.p = ''; dimTo(0); setFocus(false); renderWork(); }
  function dimTo(k) { $('dim').style.opacity = k; }
  $('wsPages').addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) { openWork(b.dataset.p); closePanels(); } });
  $('wsToggle').addEventListener('click', function () { hideWork(!WS.hidden); });
  $('wsClose').addEventListener('click', closeWork);
  $('sDim').addEventListener('input', function (e) { PR.dim = e.target.value / 1000; $('vDim').textContent = Math.round((1 - PR.dim) * 100) + '%'; if (WS.page && !WS.hidden) dimTo(PR.dim); savePR(); });
  $('ws').addEventListener('click', function (e) { var b = e.target.closest('button[data-w]'); if (!b) return; if (b.dataset.w === 'hide') hideWork(true); else closeWork(); });
  $('wsChip').addEventListener('click', function () { hideWork(false); });
  /* move it by its title bar (it resizes from its corner) */
  (function () { var bar = $('wsBar'), d = null;
    bar.addEventListener('pointerdown', function (e) { if (e.target.closest('button')) return; var r = $('ws').getBoundingClientRect(); d = { x: e.clientX - r.left, y: e.clientY - r.top, id: e.pointerId }; try { bar.setPointerCapture(e.pointerId); } catch (er) {} });
    bar.addEventListener('pointermove', function (e) { if (!d || e.pointerId !== d.id) return; var ws = $('ws'); ws.style.left = clamp(e.clientX - d.x, -ws.offsetWidth + 80, innerWidth - 80) + 'px'; ws.style.top = clamp(e.clientY - d.y, 0, innerHeight - 40) + 'px'; ws.style.transform = 'none'; });
    bar.addEventListener('pointerup', function () { d = null; }); })();
  /* working = typing or clicking in the window recently (or the window has focus) → the scene's sound ducks */
  $('wsFrame').addEventListener('load', function () { try { var d = $('wsFrame').contentDocument; ['keydown', 'pointerdown', 'input'].forEach(function (ev) { d.addEventListener(ev, function () { WS.lastKey = Date.now(); }, true); }); } catch (e) {} });
  var EXT = false;   // Spatial Home can say you are working too ({op:'focus'})
  setInterval(function () { var on = !!WS.page && !WS.hidden && (document.activeElement === $('wsFrame') || Date.now() - WS.lastKey < 45000); setFocus(on || EXT); }, 1000);

  /* ---------- camera panel: height, dolly, focal length (mm, full-frame equivalent), side step; reset ---------- */
  var SL = { sHeight: ['height', 'height'], sDolly: ['dolly', 'dolly'], sOrbit: ['pan', 'pan'] };
  function rng(q) { return L[q]; }
  Object.keys(SL).forEach(function (id) { $(id).addEventListener('input', function (e) { var q = SL[id][0], r = rng(q); T[q] = r[0] + (r[1] - r[0]) * e.target.value / 1000; clampT(); }); });
  function mmOf(fov) { return 12 / Math.tan(fov / 2 * Math.PI / 180); }
  function fovOf(mm) { return 2 * Math.atan(12 / mm) * 180 / Math.PI; }
  $('sFocal').addEventListener('input', function (e) { var MM0 = mmOf(L.fov[1]), MM1 = mmOf(L.fov[0]), mm = MM0 * Math.pow(MM1 / MM0, e.target.value / 1000); T.fov = fovOf(mm); clampT(); });
  $('camReset').addEventListener('click', function () { reset(); });
  function syncSliders() {
    if (openPanel !== 'pCamera') return;
    Object.keys(SL).forEach(function (id) { var q = SL[id][0], r = rng(q), el = $(id); if (document.activeElement !== el) el.value = Math.round((T[q] - r[0]) / (r[1] - r[0]) * 1000); });
    var MM0 = mmOf(L.fov[1]), MM1 = mmOf(L.fov[0]);
    if (document.activeElement !== $('sFocal')) $('sFocal').value = Math.round(Math.log(mmOf(T.fov) / MM0) / Math.log(MM1 / MM0) * 1000);
    $('vHeight').textContent = (T.height >= 0 ? '+' : '') + T.height.toFixed(1) + ' m'; $('vDolly').textContent = (T.dolly >= 0 ? '+' : '') + T.dolly.toFixed(T.dolly > -10 && T.dolly < 10 && PANO ? 1 : 0) + ' m';
    $('vFocal').textContent = mmOf(T.fov).toFixed(0) + ' mm'; $('vOrbit').textContent = (T.pan >= 0 ? '+' : '') + T.pan.toFixed(1) + ' m';
  }
  function reset() { lastOK = null; var d = JSON.parse(JSON.stringify(DEF)); for (var k in d) T[k] = d[k]; V.orbit = V.tilt = V.pan = V.height = V.lx = V.ly = 0; clampT(); toast('经典机位'); }

  /* ---------- Capture → a Moment; Return to This Moment restores the exact camera ---------- */
  function thumbShot(tw) { pose(S, camera); renderer.render(scene, camera); var src = renderer.domElement, th = Math.round(tw * src.height / src.width), c = document.createElement('canvas'); c.width = tw; c.height = th; c.getContext('2d').drawImage(src, 0, 0, tw, th); return c.toDataURL('image/jpeg', 0.74); }
  function capture() {
    var thumb = thumbShot(360), full = renderer.domElement.toDataURL('image/jpeg', 0.92);
    $('flash').style.opacity = 0.7; setTimeout(function () { $('flash').style.opacity = 0; }, 140);
    var shot = { id: 'm' + Date.now().toString(36), scene: SC.id, appearance: AP, name: SC.zh, t: Date.now(), st: JSON.parse(JSON.stringify(S)), cam: { pos: camera.position.toArray(), quat: camera.quaternion.toArray(), fov: camera.fov, aspect: camera.aspect }, env: { live: JSON.parse(JSON.stringify(PR.live)), ambient: A.on }, thumb: thumb };
    saveShot(shot); toast('已定格 · 可在 环境 › 时刻 回到这一刻');
    try { var a = document.createElement('a'); a.href = full; a.download = 'minest-' + SC.id + '-' + new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-') + '.jpg'; if (!EMBED) { document.body.appendChild(a); a.click(); a.remove(); } } catch (e) {}
  }
  var SHOTS = [], KEY = 'minest.scenic.moments.v1';
  function localShots() { try { return JSON.parse(localStorage.getItem(KEY) || '[]') || []; } catch (e) { return []; } }
  function saveShot(s) { SHOTS.unshift(s); if (EMBED) post({ op: 'save', shot: s }); try { localStorage.setItem(KEY, JSON.stringify(SHOTS.slice(0, 40))); } catch (e) {} }
  function delShot(id) { SHOTS = SHOTS.filter(function (s) { return s.id !== id; }); if (EMBED) post({ op: 'del', id: id }); try { localStorage.setItem(KEY, JSON.stringify(SHOTS)); } catch (e) {} renderShots(); }
  function goShot(s) { if (!s || !s.st) return; var sc = ALL[s.scene] || SC; if (sc !== SC || (s.appearance && s.appearance !== AP && sc.appear[s.appearance])) { return setScene(sc, false, s.appearance && sc.appear[s.appearance] ? s.appearance : null).then(function () { goShot(s); }); } lastOK = null; for (var k in s.st) { T[k] = s.st[k]; S[k] = s.st[k]; } V.orbit = V.tilt = V.pan = V.height = V.lx = V.ly = 0; toast('回到这一刻 · ' + new Date(s.t).toLocaleString()); }
  function renderShots() {
    $('shots').innerHTML = SHOTS.length ? SHOTS.map(function (s) { return '<div class="shot" data-id="' + s.id + '" style="background-image:url(' + s.thumb + ')"><button type="button" data-del="' + s.id + '" aria-label="删除">×</button><span>' + new Date(s.t).toLocaleDateString() + ' ' + new Date(s.t).toLocaleTimeString().slice(0, 5) + '</span></div>'; }).join('') : '<div class="empty">还没有收藏的机位。按 定格 保存当前画面。</div>';
  }
  $('shots').addEventListener('click', function (e) { var d = e.target.closest('[data-del]'); if (d) { e.stopPropagation(); delShot(d.dataset.del); return; } var s = e.target.closest('.shot'); if (s) goShot(SHOTS.filter(function (x) { return x.id === s.dataset.id; })[0]); });
  SHOTS = localShots();
  var startEnv = Q.get('env');
  function restoreStart() {
    var id = Q.get('shot'); if (id) { var s = SHOTS.filter(function (x) { return x.id === id; })[0]; if (s) return goShot(s); }
    if (Q.get('enter')) { S.fov = SC.vfov * 0.74; S.dolly = PANO ? 0.6 : 6; }
    if (Q.get('enter') && EMBED) setTimeout(startAudio, 900);   // the sound fades in with the view (the tap on the window allowed it; if not, the first touch does)   // coming through the window: a little closer, then the view opens out
    if (startEnv) { var v = ENVS.filter(function (x) { return x.id === startEnv; })[0]; if (v) { startEnv = null; applyEnv(v, true); } }
  }

  /* ---------- Spatial Home (parent) ---------- */
  function post(m) { if (!EMBED) return; m.scenic = 1; try { window.parent.postMessage(m, '*'); } catch (e) {} }
  window.addEventListener('message', function (e) {
    var m = e.data; if (!m || m.scenic !== 1 || e.source !== window.parent) return;
    if (m.op === 'shots' && Array.isArray(m.shots)) { var have = {}; SHOTS.forEach(function (s) { have[s.id] = 1; }); m.shots.forEach(function (s) { if (!have[s.id]) SHOTS.push(s); }); SHOTS.sort(function (a, b) { return b.t - a.t; }); if (openPanel === 'pScenes' && envTab === 'moments') renderShots(); }
    if (m.op === 'goto' && m.shot) goShot(m.shot);
    if (m.op === 'envs' && Array.isArray(m.list)) { ENVS = m.list; EDEF = m.def || null; keepEnvs(); if (openPanel === 'pScenes' && envTab === 'mine') renderMine();
      if (startEnv && core) { var v = ENVS.filter(function (x) { return x.id === startEnv; })[0]; startEnv = null; if (v) applyEnv(v, true); } }
    if (m.op === 'imm') { IMM.level = m.level; IMM.v = m.v; if (openPanel === 'pImm') syncImm(); }
    if (m.op === 'focus') { EXT = !!m.on; setFocus(EXT); }
    if (m.op === 'mask' && m.q) maskTo(m.q);
  });
  post({ op: 'list' });
  /* Ambient: Spatial Home says which part of the screen is the scene (a soft-edged rectangle anchored to its window);
     the room shows through the rest — this page is transparent there. Only the scene layers are masked. */
  if (EMBED) document.documentElement.classList.add('embed');
  function maskTo(q) {
    var els = [$('plate'), $('gl'), $('dim')], W = innerWidth, H = innerHeight, f = Math.max(1, q.f), v;
    if (q.full) v = 'none';
    else v = 'linear-gradient(to right, transparent ' + q.l + 'px, #000 ' + (q.l + f) + 'px, #000 ' + (q.r - f) + 'px, transparent ' + q.r + 'px),' +
      'linear-gradient(to bottom, transparent ' + q.t + 'px, #000 ' + (q.t + f) + 'px, #000 ' + (q.b - f) + 'px, transparent ' + q.b + 'px)';
    els.forEach(function (e) { var st = e.style; st.webkitMaskImage = st.maskImage = v; if (v !== 'none') { st.webkitMaskComposite = 'source-in'; st.maskComposite = 'intersect'; st.webkitMaskSize = st.maskSize = W + 'px ' + H + 'px'; st.webkitMaskRepeat = st.maskRepeat = 'no-repeat'; } });
  }
  function exit() { closePanels(); ambient(false, true); document.body.classList.remove('live'); if (EMBED) setTimeout(function () { post({ op: 'close' }); }, 380); else history.back(); }
  function toast(s) { var t = $('toast'); t.textContent = s; t.classList.add('on'); clearTimeout(toast.k); toast.k = setTimeout(function () { t.classList.remove('on'); }, 2400); }
  window.addEventListener('pagehide', function () { A.timers.forEach(clearTimeout); try { A.ac && A.ac.close(); } catch (e) {} try { renderer.dispose(); } catch (e) {} });
  document.addEventListener('visibilitychange', function () { if (!A.ac) return; if (document.hidden) A.ac.suspend(); else if (A.on) A.ac.resume(); });   // in the background: no sound, no frames

  /* ---------- no WebGL / not enough memory: the photograph itself, still and whole ---------- */
  function staticMode() {
    document.body.classList.add('static'); $('gl').style.display = 'none'; $('plate').style.backgroundSize = 'contain';
    $('bar').addEventListener('click', function (e) { var b = e.target.closest('button'); if (b && b.dataset.a === 'exit') { if (EMBED) post({ op: 'close' }); else history.back(); } });
    toast('静态模式 · 这台设备只显示照片'); setTimeout(function () { post({ op: 'ready' }); }, 300);
  }

  window.__scenic = { state: function () { return { S: JSON.parse(JSON.stringify(S)), T: JSON.parse(JSON.stringify(T)), shots: SHOTS.length, live: document.body.classList.contains('live'), scene: SC.id, appearance: AP, imm: IMM, envs: ENVS.length, def: EDEF,
      audio: A.ac ? { on: A.on, master: +A.master.gain.value.toFixed(3), focus: A.focus, override: A.override, ch: CH.reduce(function (o, k) { o[k] = +A.ch[k].g.gain.value.toFixed(3); return o; }, {}) } : null,
      uni: LIVE.reduce(function (o, k) { var u = U[uName(k)]; o[k] = u ? +u.value.toFixed(2) : null; return o; }, {}), ws: WS }; },
    set: function (o) { for (var k in o) T[k] = o[k]; clampT(); }, capture: capture, reset: reset, focus: focusSubject, go: function (i) { goShot(SHOTS[i || 0]); }, setFocus: function (on) { EXT = !!on; setFocus(EXT); }, openWork: openWork, imm: setImm };
})();
