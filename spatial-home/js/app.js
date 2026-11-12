/* Minest · Spatial Home V1.0 (Phase 1 + 2) — "The Room Is the Interface. Objects Are the Apps."
   Explore (walk, first / third person) and Desk (seated, fixed) modes; a thing is tapped → the camera goes to it →
   it answers (set(k)) → the existing feature opens over the room (bridge.js) → leaving brings back the exact view. */
(function () {
  'use strict';
  var THREE = window.THREE, B = window.SpatialBridge, KEY = 'minest.spatialHome.v1', EMBED = B.EMBED, API = null;
  if (window.MinestSpatialHome) return;
  var MARKUP =
    '<canvas id="sh-gl" tabindex="0" aria-label="Santorini Atelier"></canvas><div id="sh-labels" aria-hidden="true"></div>' +
    '<div id="sh-top"><div class="sh-brand"><strong>Minest</strong><span id="sh-brandName">Santorini Atelier</span></div>' +
    '<div class="sh-seg" id="sh-modeSeg" role="tablist" aria-label="模式"><button type="button" data-mode="explore" role="tab">Explore</button><button type="button" data-mode="desk" role="tab">Desk</button></div>' +
    '<button type="button" class="sh-ic" id="sh-packBtn" title="背包 · 布置">🎒</button><button type="button" class="sh-ic" id="sh-envBtn" title="切换环境">🌐</button><button type="button" class="sh-ic" id="sh-viewBtn" title="第一 / 第三人称">👤</button><button type="button" class="sh-ic" id="sh-setBtn" title="设置">⚙</button>' +
    (EMBED ? '<button type="button" class="sh-ic" id="sh-exitBtn" title="进入完整的 Minest">✕</button>' : '') + '</div>' +
    '<button type="button" id="sh-skip" hidden>跳过动画 ›</button><div id="sh-dock" role="toolbar" aria-label="功能入口"></div><div id="sh-hint"></div><div id="sh-stick" aria-hidden="true"><i></i></div>' +
    '<div id="sh-settings" hidden><h3>Spatial Home</h3>' +
    '<label>默认进入<select id="sh-optDefault"><option value="last">上次离开时的模式</option><option value="explore">Explore · 行走探索</option><option value="desk">Desk · 办公桌前</option></select></label>' +
    (EMBED ? '<label class="row"><input type="checkbox" id="sh-optBoot"> 打开 Minest 时先进入这间房间</label>' : '') +
    '<label class="row"><input type="checkbox" id="sh-optMotion"> 减少动画（转场直接到位）</label>' +
    '<label>光线<select id="sh-optTime"><option value="auto">跟随本地时间</option><option value="day">白天</option><option value="dusk">黄昏</option><option value="night">夜晚</option></select></label>' +
    '<label>Rings 勋章<select id="sh-optMedal"><option value="box">桌边木质勋章盒</option><option value="wall">墙面勋章展示板</option></select></label>' +
    (EMBED ? '' : '<label class="row"><input type="checkbox" id="sh-optPreload"> 进入后在后台预载 Minest 功能</label>') +
    '<div class="sh-build"><span id="sh-hostDot"></span><span id="sh-hostText"></span></div><ul id="sh-featList"></ul>' +
    '<button type="button" class="sh-btn" id="sh-setClose">好</button>' + (EMBED ? '<button type="button" class="sh-btn ghost" id="sh-setExit">进入完整的 Minest</button>' : '') + '</div>' +
    '<div id="sh-pack" hidden><header><h3>🎒 背包 · 布置</h3><button type="button" class="sh-btn ghost" id="sh-packClose">完成</button></header><div id="sh-packBody"></div></div>' +
    '<div id="sh-edit" hidden><b id="sh-editName"></b><span id="sh-editHint"></span><div class="row"><button type="button" data-e="rot">⟲ 旋转</button><button type="button" data-e="stash">🎒 收回</button><button type="button" data-e="cancel">取消</button><button type="button" data-e="ok" class="pri">✓ 放好了</button></div></div>' +
    '<div id="sh-card" hidden></div><div id="sh-toast" hidden></div>';

  function mount() {
  if (API) return API;
  var body = document.createElement('div'); body.id = 'mn-sh'; body.hidden = true; body.innerHTML = MARKUP; document.body.appendChild(body);
  function made(tag, id, html) { var e = document.getElementById(id); if (!e) { e = document.createElement(tag); e.id = id; if (html) e.innerHTML = html; document.body.appendChild(e); } return e; }
  made('div', 'sh-host'); made('div', 'sh-veil');
  var pillEl = made('button', 'sh-pill', '⌂ Home'); pillEl.type = 'button'; pillEl.title = '回到 Spatial Home'; pillEl.hidden = true;
  var $ = function (id) { return document.getElementById('sh-' + id); };
  var canvas = $('gl');

  /* ------------------------------------------------------------ settings (kept) */
  var S = { def: 'last', mode: 'explore', view: '1p', motion: null, preload: true, boot: null, pose: null, desk: null, medal: 'box', env: 'santorini', poses: {}, layouts: {}, tod: 'auto' };
  try { var raw = JSON.parse(localStorage.getItem(KEY) || 'null'); if (raw && typeof raw === 'object') for (var k0 in S) if (raw[k0] !== undefined) S[k0] = raw[k0]; } catch (e) {}
  if (S.motion === null) S.motion = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  var dirty = false;
  function save() {
    S.mode = mode; S.pose = { x: +P.x.toFixed(3), z: +P.z.toFixed(3), yaw: +P.yaw.toFixed(4), pitch: +P.pitch.toFixed(4) };
    S.env = room.envId; if (!S.poses || typeof S.poses !== 'object') S.poses = {}; S.poses[room.envId] = S.pose; S.desk = { yaw: +DK.yaw.toFixed(4), pitch: +DK.pitch.toFixed(4) };
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {}
    dirty = false;
  }

  /* ------------------------------------------------------------ scene */
  var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputEncoding = THREE.sRGBEncoding; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.12;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  var scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(60, 1, 0.05, 900);
  camera.rotation.order = 'YXZ';
  var room = window.SpatialRoom.build(scene, S.env), objects = window.SpatialObjects.build(room, scene, { medal: S.medal });
  var avatar = room.avatar(); avatar.visible = false; scene.add(avatar);
  camera.far = room.far || 900; camera.updateProjectionMatrix(); if (room.setTime) room.setTime(S.tod);
  if (S.poses && S.poses[room.envId]) S.pose = S.poses[room.envId];
  var EYE = 1.5, RAD = 0.24;

  var mode = S.def === 'last' ? (S.mode === 'desk' ? 'desk' : 'explore') : S.def;
  var P = { x: room.start.pos[0], z: room.start.pos[2], yaw: room.start.yaw, pitch: room.start.pitch };
  if (S.pose && isFinite(S.pose.x) && isFinite(S.pose.z) && isFinite(S.pose.yaw)) { P.x = S.pose.x; P.z = S.pose.z; P.yaw = S.pose.yaw; P.pitch = S.pose.pitch || 0; }
  var DK = { yaw: 0, pitch: 0 };
  if (S.desk && isFinite(S.desk.yaw)) { DK.yaw = S.desk.yaw; DK.pitch = S.desk.pitch || 0; }
  var deskBase = (function () { var p = room.desk.pos, l = room.desk.look, dx = l[0] - p[0], dy = l[1] - p[1], dz = l[2] - p[2]; return { yaw: Math.atan2(-dx, -dz), pitch: Math.atan2(dy, Math.sqrt(dx * dx + dz * dz)) }; })();
  var cineScene = null, skipRun = false, boom = 2.3, busy = false, camAuto = true, paused = false, inFeature = null, walkTo = null, hot = null;

  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  var eul = new THREE.Euler(0, 0, 0, 'YXZ'), m4 = new THREE.Matrix4(), v3a = new THREE.Vector3(), v3b = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0);
  /* where the camera belongs right now, for the mode it is in */
  function autoPose(pos, quat) {
    if (mode === 'desk') {
      pos.set(room.desk.pos[0], room.desk.pos[1], room.desk.pos[2]);
      quat.setFromEuler(eul.set(deskBase.pitch + DK.pitch, deskBase.yaw + DK.yaw, 0, 'YXZ'));
    } else if (S.view === '3p') {
      var bx = Math.sin(P.yaw), bz = Math.cos(P.yaw), W = room.size.W - 0.22, D = room.size.D - 0.22;
      /* the boom shortens against a wall, and the camera then looks past the head instead of down on the hat */
      var tx = Math.abs(bx) > 1e-4 ? ((bx > 0 ? W : -W) - P.x) / bx : 9, tz = Math.abs(bz) > 1e-4 ? ((bz > 0 ? D : -D) - P.z) / bz : 9;
      boom = inRoom(P.x, P.z, 0) ? clamp(Math.min(2.3, tx, tz), 0, 2.3) : 2.3;   // out on a terrace: open air
      pos.set(P.x + bx * boom, 1.5 + 0.26 * boom - P.pitch * 0.5, P.z + bz * boom);
      v3a.set(P.x - bx * 1.6, 1.15 + P.pitch * 1.2, P.z - bz * 1.6);
      quat.setFromRotationMatrix(m4.lookAt(pos, v3a, UP));
    } else {
      pos.set(P.x, EYE, P.z); quat.setFromEuler(eul.set(P.pitch, P.yaw, 0, 'YXZ'));
    }
  }

  /* ------------------------------------------------------------ tweens (every one can be skipped) */
  var tweens = [];
  function tw(dur, fn) {
    return new Promise(function (res) {
      if (S.motion || skipRun || dur <= 0) { fn(1); res(); return; }
      tweens.push({ t: 0, d: dur, fn: fn, res: res });
    });
  }
  function stepTweens(dt) {
    for (var i = tweens.length - 1; i >= 0; i--) {
      var a = tweens[i]; a.t += dt; var k = Math.min(1, a.t / a.d); a.fn(k);
      if (k >= 1) { tweens.splice(i, 1); a.res(); }
    }
  }
  function skipAll() { tweens.forEach(function (a) { a.t = a.d; }); }
  function skipRunAll() { skipRun = true; skipAll(); }
  function ease(k) { return k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; }

  function fly(pos, quat, dur) {
    var p0 = camera.position.clone(), q0 = camera.quaternion.clone(), p1 = pos.clone(), q1 = quat.clone();
    camAuto = false;
    return tw(dur, function (k) { var e = ease(k); camera.position.lerpVectors(p0, p1, e); THREE.Quaternion.slerp(q0, q1, camera.quaternion, e); });
  }
  function flyLook(pos, look, dur) {
    var p = new THREE.Vector3(pos[0], pos[1], pos[2]), q = new THREE.Quaternion().setFromRotationMatrix(m4.lookAt(p, v3a.set(look[0], look[1], look[2]), UP));
    return fly(p, q, dur);
  }
  function flyHome(dur) {
    var p = new THREE.Vector3(), q = new THREE.Quaternion(); autoPose(p, q);
    return fly(p, q, dur).then(function () { camAuto = true; });
  }
  function animK(o, to, dur) { var from = o.k; return tw(dur, function (k) { o.k = from + (to - from) * k; o.set(o.k); }); }

  /* ------------------------------------------------------------ veil (the cut between the room and a feature) */
  var veil = $('veil');
  function veilAt(o) {
    var p = v3b.copy(o.centre).project(camera);
    veil.style.setProperty('--vx', clamp((p.x * 0.5 + 0.5) * 100, 5, 95) + '%'); veil.style.setProperty('--vy', clamp((-p.y * 0.5 + 0.5) * 100, 5, 95) + '%');
  }
  function veilR(r) { veil.style.clipPath = veil.style.webkitClipPath = 'circle(' + r + 'vmax at var(--vx) var(--vy))'; }
  function veilIn() { veil.style.opacity = 1; return tw(0.42, function (k) { veilR(ease(k) * 150); }); }
  function veilOut() { return tw(0.45, function (k) { veilR((1 - ease(k)) * 150); }).then(function () { veil.style.opacity = 0; }); }
  function veilFade(to, dur) { var from = +veil.style.opacity || 0; veilR(150); return tw(dur, function (k) { veil.style.opacity = from + (to - from) * k; }); }

  /* ------------------------------------------------------------ cards, toast */
  var card = $('card'), toastEl = $('toast'), toastT = 0;
  function toast(s) { toastEl.textContent = s; toastEl.hidden = false; clearTimeout(toastT); toastT = setTimeout(function () { toastEl.hidden = true; }, 3200); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  /* a small card over the room; resolves with the index of the button pressed */
  function ask(title, text, buttons) {
    return new Promise(function (res) {
      card.innerHTML = '<h4>' + title + '</h4>' + (text ? '<p>' + text + '</p>' : '') + '<div class="acts">' + buttons.map(function (b, i) { return '<button type="button" data-i="' + i + '" class="' + (b.cls || '') + '">' + esc(b.label) + '</button>'; }).join('') + '</div>';
      card.hidden = false;
      card.onclick = function (e) { var b = e.target.closest('button'); if (!b) return; card.hidden = true; card.onclick = null; res(+b.dataset.i); };
    });
  }
  function closeCard() { card.hidden = true; card.onclick = null; }

  /* ------------------------------------------------------------ the flow: tap → close-up → feedback → feature → back */
  /* a thing's own scene (the car key's garage): stand up in the room, cut to it, play, then the usual cut into the feature */
  function cineCtx(o) {
    return {
      camera: camera, tw: tw, env: room.envId,
      standUp: function () { var p = camera.position, d = new THREE.Vector3(); camera.getWorldDirection(d); return flyLook([p.x - d.x * 0.35, 1.62, p.z - d.z * 0.35 + 0.2], [p.x + 1.5, 1.4, p.z + 2.5], 0.7); },
      cut: function (sc) { return veilFade(1, 0.22).then(function () { cineScene = sc; camAuto = false; return veilFade(0, 0.25); }); }
    };
  }
  function activate(o) {
    if (busy || !o) return;
    busy = true; skipRun = false; walkTo = null; setHot(null); body.classList.add('busy'); $('settings').hidden = true; $('skip').hidden = false;
    var feature = o.feature, F = B.FEATURES[feature], needs = B.needsHost(feature), hostP = needs ? B.load() : null;
    flyLook(o.focus.pos, o.focus.look, 0.8)
      .then(function () { return animK(o, 1, o.cine ? 0.9 : 0.65); })
      /* Mochi: today's Routine card first; the planner's full Routine only if asked */
      .then(function () {
        if (!o.card) return true;
        $('skip').hidden = true; var c = o.card();
        return ask(c.title, c.text, [{ label: '打开 Liquid Routine', cls: 'pri' }, { label: '回到房间', cls: 'ghost' }]).then(function (i) { return i === 0; });
      })
      .then(function (go) {
        if (!go) return false;
        if (o.focus2) return flyLook(o.focus2.pos, o.focus2.look, 0.7).then(function () { return true; });
        if (o.cine) return o.cine(cineCtx(o)).then(function () { return true; });
        return true;
      })
      .then(function (go) {
        if (!go) return false;
        if (!needs || B.state() === 'ready') return true;
        var cancelled = false;
        var w = ask('<span class="spin"></span>正在打开 Minest…', '第一次进入要载入整个应用，之后就是即时的。', [{ label: '取消', cls: 'ghost' }]).then(function () { cancelled = true; return false; });
        return Promise.race([w, hostP.then(function () { closeCard(); return !cancelled; })]);
      })
      .then(function (go) {
        if (!go) return null;
        var av = B.available(feature);
        if (!av.length) {
          var why = needs && B.state() !== 'ready' ? 'Minest 应用没有载入成功（' + esc(B.appUrl()) + '）。' : F.missing;
          return ask(o.icon + ' ' + o.name + ' · 还没有接上', why, [{ label: '回到房间', cls: 'pri' }]).then(function () { return null; });
        }
        if (av.length === 1) return av[0];
        av = av.filter(B.isLive).concat(av.filter(function (t) { return !B.isLive(t); }));   // the one you left open comes first
        return ask(o.icon + ' ' + o.name, '', av.map(function (t, i) { return { label: (B.isLive(t) ? '继续 · ' : '') + t.label, cls: i ? '' : 'pri' }; }).concat([{ label: '取消', cls: 'ghost' }])).then(function (i) { return av[i] || null; });
      })
      .then(function (t) {
        if (!t) return comeBack(o);
        veilAt(o);
        return veilIn().then(function () {
          $('skip').hidden = true; skipRun = false;
          if (!B.show(t)) { toast('没能打开 ' + t.label); cineScene = null; return veilOut().then(function () { return comeBack(o); }); }
          inFeature = { o: o, t: t }; paused = true; cineScene = null;
          return veilFade(0, 0.3);
        });
      });
  }
  function comeBack(o) {
    cineScene = null; skipRun = false; $('skip').hidden = true;
    return Promise.all([animK(o, 0, 0.5), flyHome(0.75)]).then(function () { busy = false; body.classList.remove('busy'); showHint(); });
  }
  function onLeave() {
    var f = inFeature; if (!f) { B.hide(); return; }
    inFeature = null;
    veilFade(1, 0.2).then(function () {
      B.hide(); body.hidden = false; paused = false; resize(); try { canvas.focus(); } catch (e) {}
      veilAt(f.o); return veilOut();
    }).then(function () { return comeBack(f.o); });
  }
  B.init({ wrap: $('host'), pill: pillEl, onLeave: onLeave, onShow: function () { body.hidden = true; } });

  /* ------------------------------------------------------------ modes */
  function setMode(m, quick) {
    if (busy || (m !== 'explore' && m !== 'desk')) return;
    mode = m; walkTo = null; body.classList.toggle('m-explore', m === 'explore'); body.classList.toggle('m-desk', m === 'desk');
    [].forEach.call($('modeSeg').children, function (b) { b.classList.toggle('on', b.dataset.mode === m); });
    $('viewBtn').style.display = m === 'explore' ? '' : 'none'; $('viewBtn').classList.toggle('on', S.view === '3p');
    $('dock').classList.toggle('hide', m !== 'desk');
    if (m === 'desk') { DK.yaw = 0; DK.pitch = 0; }                               // Desk always starts facing the desk
    dirty = true; showHint();
    if (quick) { camAuto = true; return; }
    busy = true; flyHome(0.85).then(function () { busy = false; });
  }
  function setView(v) { if (busy) return; S.view = v; $('viewBtn').classList.toggle('on', v === '3p'); dirty = true; busy = true; flyHome(0.5).then(function () { busy = false; }); }

  if ((navigator.maxTouchPoints || 0) > 0 && window.matchMedia && matchMedia('(pointer: coarse)').matches) body.classList.add('touch');
  var hint = $('hint'), hintT = 0;
  function showHint() {
    var touch = body.classList.contains('touch');
    hint.textContent = mode === 'desk' ? '拖动看向两侧 · 点物件或下方入口进入' : (touch ? '摇杆行走 · 拖动环顾 · 点物件进入' : '拖动环顾 · WASD 行走 · 点地面走过去 · 点物件进入');
    hint.classList.toggle('hide', mode === 'desk'); clearTimeout(hintT);
    if (mode !== 'desk') hintT = setTimeout(function () { hint.classList.add('hide'); }, 7000);
  }

  /* ------------------------------------------------------------ labels, dock */
  var labels = $('labels'), dock = $('dock');
  objects.forEach(function (o) {
    var l = document.createElement('div'); l.className = 'sh-lab'; l.innerHTML = '<i>' + o.icon + '</i>' + o.name; l.onclick = function () { activate(o); }; labels.appendChild(l); o.lab = l;
    var b = document.createElement('button'); b.type = 'button'; b.innerHTML = '<b>' + o.icon + '</b><span>' + o.name + '</span>'; b.title = o.en; b.onclick = function () { activate(o); }; dock.appendChild(b); o.chip = b;
  });
  function placeLabels() {
    var w = window.innerWidth, h = window.innerHeight;
    objects.forEach(function (o) {
      var p = v3b.copy(o.labelAt).project(camera), on = p.z < 1 && p.z > -1 && Math.abs(p.x) < 1.05 && Math.abs(p.y) < 1.05;
      if (on && mode === 'explore' && S.view === '1p' && camera.position.distanceTo(o.labelAt) < 0.45) on = false;
      if (o.stashed || (edit && edit.o === o)) on = false;
      o.lab.style.opacity = on ? 1 : 0; o.lab.style.pointerEvents = on ? 'auto' : 'none';
      if (on) o.lab.style.transform = 'translate(-50%,-100%) translate(' + ((p.x * 0.5 + 0.5) * w).toFixed(1) + 'px,' + ((-p.y * 0.5 + 0.5) * h).toFixed(1) + 'px)';
    });
  }
  function setHot(o) {
    if (hot === o) return; if (hot) hot.lab.classList.remove('hot'); hot = o; if (o) o.lab.classList.add('hot');
    canvas.classList.toggle('point', !!o);
  }

  /* ------------------------------------------------------------ input */
  var ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), hits = objects.map(function (o) { return o.hit; }), floor = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  function pick(e) {
    ndc.set(e.clientX / window.innerWidth * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1); ray.setFromCamera(ndc, camera);
    var h = ray.intersectObjects(hits, false); return h.length ? h[0].object.userData.obj : null;
  }
  var ptr = null, keys = {}, joy = { x: 0, y: 0, id: null };
  canvas.addEventListener('pointerdown', function (e) {
    if (e.pointerType === 'touch' && !body.classList.contains('touch')) { body.classList.add('touch'); showHint(); }
    if (busy) { skipAll(); return; }
    if (edit) { ptr = { id: e.pointerId, x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, drag: false, edit: true }; try { canvas.setPointerCapture(e.pointerId); } catch (er) {} editMove(e); return; }
    ptr = { id: e.pointerId, x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, drag: false }; try { canvas.setPointerCapture(e.pointerId); } catch (er) {}
  });
  canvas.addEventListener('pointermove', function (e) {
    if (busy) return;
    if (edit) { if ((ptr && ptr.id === e.pointerId) || e.pointerType === 'mouse') editMove(e); return; }
    if (!ptr || ptr.id !== e.pointerId) { if (e.pointerType === 'mouse') setHot(pick(e)); return; }
    var dx = e.clientX - ptr.x, dy = e.clientY - ptr.y; ptr.x = e.clientX; ptr.y = e.clientY;
    if (!ptr.drag && Math.abs(e.clientX - ptr.sx) + Math.abs(e.clientY - ptr.sy) > 7) { ptr.drag = true; canvas.classList.add('drag'); walkTo = null; }
    if (!ptr.drag) return;
    var s = 0.0042 * (camera.fov / 60);
    if (mode === 'desk') { DK.yaw = clamp(DK.yaw + dx * s, -2.2, 2.2); DK.pitch = clamp(DK.pitch + dy * s, -0.45, 0.75); }
    else { P.yaw += dx * s; P.pitch = clamp(P.pitch + dy * s, -1.1, 1.1); }
    dirty = true;
  });
  function up(e) {
    if (!ptr || ptr.id !== e.pointerId) return;
    var wasDrag = ptr.drag, wasEdit = ptr.edit; ptr = null; canvas.classList.remove('drag');
    if (wasEdit || edit) return;
    if (wasDrag || busy || e.type === 'pointercancel') return;
    var o = pick(e); if (o) { activate(o); return; }
    var x = pickExtra(e); if (x) { extraCard(x); return; }
    if (mode !== 'explore') return;
    var hit = ray.ray.intersectPlane(floor, v3a);                                  // pick() has set the ray
    if (hit && inArea(hit.x, hit.z) && ray.ray.direction.y < -0.05) walkTo = { x: hit.x, z: hit.z, stuck: 0 };
  }
  canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
  canvas.addEventListener('dblclick', function () { if (mode === 'desk' && !busy) { DK.yaw = 0; DK.pitch = 0; dirty = true; } });
  window.addEventListener('keydown', function (e) {
    if (inFeature || body.hidden) return;
    if (busy) { if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') skipRunAll(); return; }
    if (/^(INPUT|SELECT|TEXTAREA)$/.test((e.target && e.target.tagName) || '')) return;
    keys[e.code] = true;
    if (e.key === '1') setMode('explore'); else if (e.key === '2') setMode('desk'); else if (e.key === 'v' || e.key === 'V') { if (mode === 'explore') setView(S.view === '1p' ? '3p' : '1p'); }
    else if (e.key === 'Escape') $('settings').hidden = true;
    if (/^Arrow|^Space$/.test(e.code)) e.preventDefault();
  });
  window.addEventListener('keyup', function (e) { keys[e.code] = false; });
  window.addEventListener('blur', function () { keys = {}; });
  /* thumb stick (touch) */
  var stick = $('stick'), knob = stick.firstElementChild;
  function stickMove(e) { var r = stick.getBoundingClientRect(), x = (e.clientX - r.left - r.width / 2) / (r.width / 2), y = (e.clientY - r.top - r.height / 2) / (r.height / 2), l = Math.hypot(x, y); if (l > 1) { x /= l; y /= l; } joy.x = x; joy.y = y; knob.style.transform = 'translate(' + x * 30 + 'px,' + y * 30 + 'px)'; }
  stick.addEventListener('pointerdown', function (e) { joy.id = e.pointerId; try { stick.setPointerCapture(e.pointerId); } catch (er) {} walkTo = null; stickMove(e); });
  stick.addEventListener('pointermove', function (e) { if (joy.id === e.pointerId) stickMove(e); });
  function stickUp(e) { if (joy.id !== e.pointerId) return; joy.id = null; joy.x = joy.y = 0; knob.style.transform = ''; }
  stick.addEventListener('pointerup', stickUp); stick.addEventListener('pointercancel', stickUp);

  /* inside the room box, or in one of the environment's walkable areas (a doorway, a terrace) */
  function inRoom(x, z, m) { return Math.abs(x) <= room.size.W - m && Math.abs(z) <= room.size.D - m; }
  function inArea(x, z) { if (inRoom(x, z, RAD + 0.03)) return true; return (room.areas || []).some(function (a) { return x >= a[0] && x <= a[2] && z >= a[1] && z <= a[3]; }); }
  function collide(px, pz) {
    if (!inArea(P.x, P.z)) {                                                       // slide along whichever axis still fits
      if (px !== undefined && inArea(P.x, pz)) P.z = pz; else if (px !== undefined && inArea(px, P.z)) P.x = px;
      else if (px !== undefined) { P.x = px; P.z = pz; }
      else { var W = room.size.W - RAD - 0.03, D = room.size.D - RAD - 0.03; P.x = clamp(P.x, -W, W); P.z = clamp(P.z, -D, D); }
    }
    room.solids.forEach(function (b) {
      var x0 = b[0] - RAD, z0 = b[1] - RAD, x1 = b[2] + RAD, z1 = b[3] + RAD;
      if (P.x <= x0 || P.x >= x1 || P.z <= z0 || P.z >= z1) return;
      var a = P.x - x0, c = x1 - P.x, d = P.z - z0, f = z1 - P.z, m = Math.min(a, c, d, f);
      if (m === a) P.x = x0; else if (m === c) P.x = x1; else if (m === d) P.z = z0; else P.z = z1;
    });
  }
  function move(dt) {
    if (mode !== 'explore' || busy) return;
    var f = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0) - joy.y, r = (keys.KeyD ? 1 : 0) - (keys.KeyA ? 1 : 0) + joy.x;
    var turn = (keys.ArrowLeft || keys.KeyQ ? 1 : 0) - (keys.ArrowRight || keys.KeyE ? 1 : 0);
    if (turn) { P.yaw += turn * 1.9 * dt; dirty = true; }
    var px = P.x, pz = P.z, sp = 2.1 * dt;
    if (f || r) {
      walkTo = null; var l = Math.hypot(f, r); if (l > 1) { f /= l; r /= l; }
      P.x += (-Math.sin(P.yaw) * f + Math.cos(P.yaw) * r) * sp; P.z += (-Math.cos(P.yaw) * f - Math.sin(P.yaw) * r) * sp;
    } else if (walkTo) {
      var dx = walkTo.x - P.x, dz = walkTo.z - P.z, d = Math.hypot(dx, dz);
      if (d < 0.06) walkTo = null; else { var st = Math.min(d, sp); P.x += dx / d * st; P.z += dz / d * st; }
    } else return;
    collide(px, pz);
    if (walkTo && Math.hypot(P.x - px, P.z - pz) < sp * 0.2 && ++walkTo.stuck > 6) walkTo = null;
    dirty = true;
  }

  /* ------------------------------------------------------------ top bar, settings */
  $('modeSeg').addEventListener('click', function (e) { var b = e.target.closest('button'); if (b && b.dataset.mode !== mode) setMode(b.dataset.mode); });
  $('viewBtn').addEventListener('click', function () { setView(S.view === '1p' ? '3p' : '1p'); });
  var setEl = $('settings');
  function renderSettings() {
    $('optDefault').value = S.def; $('optTime').value = S.tod || 'auto'; $('optMedal').value = S.medal === 'wall' ? 'wall' : 'box'; $('optMotion').checked = !!S.motion; if ($('optPreload')) $('optPreload').checked = !!S.preload; if ($('optBoot')) $('optBoot').checked = typeof S.boot === 'boolean' ? S.boot : window.__SPATIAL_HOME_BOOT_DEFAULT__ !== false;
    var st = B.state(), dot = $('hostDot');
    dot.className = st === 'ready' ? 'ok' : (st === 'loading' ? 'wait' : '');
    $('hostText').textContent = EMBED ? '就在这个 Minest 里 · ' + (location.pathname.split('/').pop() || 'index.html') : (st === 'ready' ? '已连接 ' : st === 'loading' ? '载入中 ' : '尚未载入 ') + B.appUrl().replace(location.origin, '');
    $('featList').innerHTML = objects.map(function (o) {
      var F = B.FEATURES[o.feature], av = B.available(o.feature), unknown = B.needsHost(o.feature) && st !== 'ready' && !av.length;
      return '<li class="' + (!av.length && !unknown ? 'no' : '') + '"><b>' + o.icon + ' ' + o.name + '</b><span>' + (av.length ? av.map(function (t) { return esc(t.label); }).join(' · ') : (unknown ? '载入后可知' : '未接上：' + esc(F.title))) + '</span></li>';
    }).join('');
  }
  function markAvailability() {
    if (B.state() !== 'ready') return;
    objects.forEach(function (o) { var off = !B.available(o.feature).length; o.lab.classList.toggle('off', off); o.chip.classList.toggle('off', off); });
    if (!setEl.hidden) renderSettings();
  }
  window.addEventListener('spatialhome:host', markAvailability);
  /* ------------------------------------------------------------ environments: the things stay theirs, only the place changes */
  /* ------------------------------------------------------------ Phase 3: the backpack and free placement
     A layout per environment: S.layouts[env] = { <thing id>: { p, ry, stashed }, extras: [ { uid, kind, p, ry, ref, title } ] }.
     Nothing is copied: a My World thing on display keeps only its ids (board / card / thing) and its title for the label.
     Every thing's close-up camera is stored relative to the thing, so it follows wherever the thing goes. */
  var PLACE = { board: 'wall', aquarium: 'floor' }, REF = window.SpatialRoom.parts.anchors(0.95);
  function placeType(o) { return o.style === 'wall' ? 'wall' : (PLACE[o.id] || 'surface'); }
  function m4of(p, ry) { return new THREE.Matrix4().makeRotationY(ry).setPosition(p[0], p[1], p[2]); }
  function localize(o) {
    if (o.focusL !== undefined) return;
    var a = REF[o.anchor]; if (!a) { o.focusL = null; return; }
    var inv = m4of(a.p, a.ry).invert();
    function L(f) { return f ? { pos: new THREE.Vector3().fromArray(f.pos).applyMatrix4(inv).toArray(), look: new THREE.Vector3().fromArray(f.look).applyMatrix4(inv).toArray() } : null; }
    o.focusL = L(o.focus); o.focus2L = L(o.focus2);
  }
  function settle(o) {
    o.group.updateMatrixWorld(true);
    o.labelAt = new THREE.Vector3(o.label[0], o.label[1], o.label[2]).applyMatrix4(o.group.matrixWorld);
    o.centre = new THREE.Box3().setFromObject(o.hit).getCenter(new THREE.Vector3());
    var M = m4of([o.group.position.x, o.group.position.y, o.group.position.z], o.group.rotation.y);
    function Wf(f) { return { pos: new THREE.Vector3().fromArray(f.pos).applyMatrix4(M).toArray(), look: new THREE.Vector3().fromArray(f.look).applyMatrix4(M).toArray() }; }
    if (o.focusL) o.focus = Wf(o.focusL); if (o.focus2L) o.focus2 = Wf(o.focus2L);
  }
  function layout() { if (!S.layouts || typeof S.layouts !== 'object') S.layouts = {}; return S.layouts[room.envId] || (S.layouts[room.envId] = {}); }
  function rebuildHits() { hits.length = 0; objects.forEach(function (o) { if (!o.stashed) hits.push(o.hit); }); }
  function placeAll() {
    var L = layout();
    objects.forEach(function (o) {
      localize(o);
      var l = L[o.id], a = room.anchors[o.anchor] || room.anchors['desk.left'];
      var p = l && l.p ? l.p : a.p, ry = l && isFinite(l.ry) ? l.ry : a.ry;
      o.group.position.set(p[0], p[1], p[2]); o.group.rotation.y = ry; o.stashed = !!(l && l.stashed); o.group.visible = !o.stashed;
      o.chip.classList.toggle('stashed', o.stashed); settle(o);
    });
    rebuildHits(); buildExtras();
  }

  /* ---- display furniture and My World things on display (extras) */
  var EXTRA = {
    pedestal: { name: '展示台', icon: '🏛', place: 'floor' }, wallshelf: { name: '墙面置物架', icon: '🪵', place: 'wall' },
    vitrine: { name: '玻璃展柜', icon: '🔲', place: 'surface' }, thing: { name: '我的物品', icon: '🖼', place: 'surface' }
  };
  var XS = [], VBx = window.SpatialVoxel.VB, MATx = window.SpatialVoxel.MAT;
  function extraMesh(e) {
    var g = new THREE.Group(), v = new VBx(5000 + ((e.uid || 1) % 997)), hb;
    if (e.kind === 'pedestal') { v.cb(0, 0, 0, 0.42, 0.06, 0.42, 'stone2'); v.cb(0, 0.06, 0, 0.34, 0.8, 0.34, 'stone', 0.03); v.cb(0, 0.86, 0, 0.42, 0.05, 0.42, 'stone2'); hb = [0.42, 0.91, 0.42]; }
    else if (e.kind === 'wallshelf') { v.box(-0.45, -0.02, 0, 0.45, 0.02, 0.22, 'woodLight', 0.03); v.box(-0.38, -0.16, 0, -0.35, -0.02, 0.18, 'brass'); v.box(0.35, -0.16, 0, 0.38, -0.02, 0.18, 'brass'); hb = [0.9, 0.2, 0.22]; }
    else if (e.kind === 'vitrine') {
      v.cb(0, 0, 0, 0.46, 0.05, 0.34, 'woodDark'); v.cb(0, 0.36, 0, 0.46, 0.03, 0.34, 'woodDark');
      [[-0.22, -0.16], [0.21, -0.16], [-0.22, 0.15], [0.21, 0.15]].forEach(function (q) { v.box(q[0], 0.05, q[1], q[0] + 0.012, 0.36, q[1] + 0.012, 'brass'); });
      var gl = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.31, 0.32), new THREE.MeshPhongMaterial({ color: 0xdff3ff, transparent: true, opacity: 0.16, shininess: 120, depthWrite: false })); gl.position.y = 0.205; g.add(gl); hb = [0.46, 0.39, 0.34];
    } else {
      /* a My World thing: its picture (or its name) in a frame on a little easel */
      v.box(-0.13, 0, -0.02, 0.13, 0.012, 0.06, 'woodDark'); v.box(-0.135, 0.02, -0.01, 0.135, 0.34, 0.01, 'woodDark'); v.box(-0.01, 0, -0.08, 0.01, 0.3, -0.06, 'woodDark');
      var cv = document.createElement('canvas'); cv.width = 240; cv.height = 300; var cx = cv.getContext('2d');
      cx.fillStyle = '#fbf7ee'; cx.fillRect(0, 0, 240, 300); cx.fillStyle = '#1d2b4f'; cx.font = '600 26px -apple-system, "PingFang SC", sans-serif'; cx.textAlign = 'center';
      String(e.title || '').slice(0, 40).match(/.{1,9}/g).slice(0, 5).forEach(function (line, i) { cx.fillText(line, 120, 70 + i * 40); });
      var tex = new THREE.CanvasTexture(cv); tex.encoding = THREE.sRGBEncoding;
      var pic = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.3), new THREE.MeshLambertMaterial({ map: tex })); pic.position.set(0, 0.18, 0.012); g.add(pic);
      var url = thingPic(e); if (url) { try { var ld = new THREE.TextureLoader(); ld.setCrossOrigin('anonymous'); ld.load(url, function (t) { t.encoding = THREE.sRGBEncoding; pic.material.map = t; pic.material.needsUpdate = true; }); } catch (er) {} }
      hb = [0.27, 0.35, 0.16];
    }
    g.add(v.mesh());
    var hit = new THREE.Mesh(new THREE.BoxGeometry(hb[0], hb[1], hb[2]), new THREE.MeshBasicMaterial({ visible: false }));
    hit.position.set(0, e.kind === 'wallshelf' ? -0.07 : hb[1] / 2, e.kind === 'wallshelf' ? 0.11 : 0); g.add(hit);
    return { e: e, group: g, hit: hit, place: EXTRA[e.kind] ? EXTRA[e.kind].place : 'surface' };
  }
  function buildExtras() {
    XS.forEach(function (x) { scene.remove(x.group); x.group.traverse(function (m) { if (m.geometry) m.geometry.dispose(); }); }); XS = [];
    (layout().extras || []).forEach(function (e) { var x = extraMesh(e); x.group.position.fromArray(e.p); x.group.rotation.y = e.ry || 0; x.hit.userData.extra = x; scene.add(x.group); XS.push(x); });
  }
  function pickExtra(e) {
    if (!XS.length) return null;
    ndc.set(e.clientX / window.innerWidth * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1); ray.setFromCamera(ndc, camera);
    var h = ray.intersectObjects(XS.map(function (x) { return x.hit; }), false); return h.length ? h[0].object.userData.extra : null;
  }
  /* My World things: the host's own boards (MinestAI.boards) → lists → things; only ids are kept */
  function hostBoards() { try { var w = B.hostWindow(); return (w && w.MinestAI && w.MinestAI.boards && w.MinestAI.boards()) || []; } catch (er) { return []; } }
  function thingPic(e) {
    var r = e.ref; if (!r) return '';
    var b = hostBoards().filter(function (x) { return x.id === r.bid; })[0], hit = null;
    (b && b.columns || []).forEach(function (c) { (c.cards || []).forEach(function (k) { if (k && k.id === r.card) (k.stack || []).forEach(function (t) { if (t && t.id === r.sid) hit = t; }); }); });
    var c2 = hit && hit.cover; return c2 && c2.type !== 'color' && (c2.value || c2.url) || '';
  }
  function myThings() {
    var out = [];
    hostBoards().forEach(function (b) { (b.columns || []).forEach(function (c) { (c.cards || []).forEach(function (k) { (k && k.stack || []).forEach(function (t) { if (t && t.id && t.title && out.length < 80) out.push({ bid: b.id, card: k.id, sid: t.id, title: String(t.title).slice(0, 60), list: (k.title || c.title || b.title || '').slice(0, 30) }); }); }); }); });
    return out;
  }

  /* ---- edit mode: the thing follows your finger over the surfaces it may stand on */
  var edit = null, srf = new THREE.Raycaster(), nrm = new THREE.Vector3(), editBar = $('edit');
  function startEdit(t, isNew) {
    if (busy) return;
    closeCard(); $('pack').hidden = true; $('settings').hidden = true;
    var g = t.group; edit = { o: t.lab ? t : null, x: t.lab ? null : t, g: g, p0: g.position.clone(), ry0: g.rotation.y, isNew: !!isNew, wasStashed: !!t.stashed, type: t.lab ? placeType(t) : t.place };
    if (edit.o) { edit.o.stashed = false; g.visible = true; }
    $('editName').textContent = t.lab ? t.icon + ' ' + t.name : (EXTRA[t.e.kind].icon + ' ' + (t.e.title || EXTRA[t.e.kind].name));
    $('editHint').textContent = { wall: '点墙面挂上去', floor: '点地面放下', surface: '点桌面、柜面、展示台放上去' }[edit.type];
    editBar.querySelector('[data-e="rot"]').style.display = edit.type === 'wall' ? 'none' : '';
    editBar.hidden = false; body.classList.add('editing'); walkTo = null;
  }
  function inside(x, z) { return inRoom(x, z, -0.45) || (room.areas || []).some(function (a) { return x >= a[0] - 0.3 && x <= a[2] + 0.3 && z >= a[1] - 0.3 && z <= a[3] + 0.3; }); }
  function editMove(e) {
    if (!edit) return;
    ndc.set(e.clientX / window.innerWidth * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1); srf.setFromCamera(ndc, camera);
    var targets = [room.group].concat(XS.filter(function (x) { return x.group !== edit.g; }).map(function (x) { return x.group; }));
    var hs = srf.intersectObjects(targets, true);
    for (var i = 0; i < hs.length; i++) {
      var h = hs[i], m = h.object.material; if (!h.face || (m && m.transparent && m.opacity < 0.3) || (m && m.visible === false)) continue;
      nrm.copy(h.face.normal).transformDirection(h.object.matrixWorld);
      var P2 = h.point; if (!inside(P2.x, P2.z)) return;
      if (edit.type === 'wall') {
        if (Math.abs(nrm.y) > 0.3) continue;
        edit.g.position.set(P2.x + nrm.x * 0.004, clamp(P2.y, 0.9, 2.3), P2.z + nrm.z * 0.004); edit.g.rotation.y = Math.atan2(nrm.x, nrm.z);
      } else {
        if (nrm.y < 0.7) { if (edit.type === 'floor') continue; return; }   // a wall in front: nowhere to stand
        if (edit.type === 'floor' && P2.y > 0.06) continue;
        edit.g.position.set(Math.round(P2.x * 50) / 50, P2.y, Math.round(P2.z * 50) / 50);
      }
      edit.g.updateMatrixWorld(true); return;
    }
  }
  function endEdit(how) {
    if (!edit) return; var E = edit, L = layout(); edit = null; editBar.hidden = true; body.classList.remove('editing');
    var g = E.g, pos = [+g.position.x.toFixed(3), +g.position.y.toFixed(3), +g.position.z.toFixed(3)], ry = +g.rotation.y.toFixed(4);
    if (how === 'cancel') {
      if (E.x && E.isNew) { L.extras = (L.extras || []).filter(function (e) { return e !== E.x.e; }); buildExtras(); save(); return; }
      g.position.copy(E.p0); g.rotation.y = E.ry0; if (E.o) { E.o.stashed = E.wasStashed; g.visible = !E.wasStashed; settle(E.o); } return;
    }
    if (E.o) {
      if (how === 'stash') { L[E.o.id] = { p: pos, ry: ry, stashed: true }; E.o.stashed = true; g.visible = false; toast(E.o.icon + ' ' + E.o.name + ' 已收回背包 · 功能仍可从下方入口进入'); }
      else { L[E.o.id] = { p: pos, ry: ry }; E.o.stashed = false; }
      E.o.chip.classList.toggle('stashed', E.o.stashed); settle(E.o); rebuildHits();
    } else {
      if (how === 'stash') { L.extras = (L.extras || []).filter(function (e) { return e !== E.x.e; }); toast('已收回背包'); }
      else { E.x.e.p = pos; E.x.e.ry = ry; }
      buildExtras();
    }
    save();
  }
  editBar.addEventListener('click', function (e) {
    var b = e.target.closest('[data-e]'); if (!b || !edit) return; var a = b.getAttribute('data-e');
    if (a === 'rot') { edit.g.rotation.y += Math.PI / 2; edit.g.updateMatrixWorld(true); return; }
    endEdit(a === 'ok' ? 'ok' : a);
  });
  function extraCard(x) {
    var K = EXTRA[x.e.kind];
    ask(K.icon + ' ' + (x.e.title || K.name), x.e.kind === 'thing' ? '来自 My World · ' + esc(x.e.list || '') : '', [{ label: '移动', cls: 'pri' }, { label: '🎒 收回背包' }, { label: '好', cls: 'ghost' }])
      .then(function (i) { if (i === 0) startEdit(x); else if (i === 1) { edit = { x: x, g: x.group, p0: x.group.position.clone(), ry0: x.group.rotation.y, type: x.place }; endEdit('stash'); } });
  }
  /* a new thing appears where you look (or on the desk), then you place it */
  function spawn(e) {
    var L = layout(); L.extras = L.extras || []; e.uid = Date.now() % 1e9; var a = room.anchors['desk.book'];
    e.p = [a.p[0], a.p[1], a.p[2] + 0.35]; e.ry = 0;
    if (EXTRA[e.kind].place === 'floor') e.p = [room.start.pos[0], 0, room.start.pos[2] - 1];
    if (EXTRA[e.kind].place === 'wall') { var w = room.anchors['wall.left']; e.p = [w.p[0], 1.3, w.p[2] + 1.2]; e.ry = w.ry; }
    L.extras.push(e); buildExtras(); var x = XS[XS.length - 1]; if (x) startEdit(x, true);
  }

  /* ---- the backpack panel */
  var pack = $('pack');
  function renderPack() {
    var L = layout(), h = '<p class="sub">在 <b>' + esc(room.name) + '</b> 里的布置（每个环境各自保存）</p><h4>功能物件</h4><ul class="pk">';
    objects.forEach(function (o, i) { h += '<li><span>' + o.icon + ' ' + esc(o.name) + (o.stashed ? ' <em>在背包</em>' : '') + '</span><button type="button" data-po="' + i + '">' + (o.stashed ? '取出摆放' : '移动') + '</button>' + (o.stashed ? '' : '<button type="button" data-ps="' + i + '">收回</button>') + '</li>'; });
    h += '</ul><button type="button" class="sh-btn ghost" data-reset>恢复这个环境的默认摆放</button><h4>陈列架</h4><ul class="pk">';
    ['pedestal', 'wallshelf', 'vitrine'].forEach(function (k) { h += '<li><span>' + EXTRA[k].icon + ' ' + EXTRA[k].name + '</span><button type="button" data-px="' + k + '">放一个</button></li>'; });
    var T = myThings(); h += '</ul><h4>我的物品 · My World Inventory</h4>';
    if (!T.length) h += '<p class="sub">' + (B.state() === 'ready' ? 'My World 里还没有东西。' : 'Minest 载入后显示你在 My World 里的东西。') + '</p>';
    else { h += '<ul class="pk">'; T.forEach(function (t, i) { h += '<li><span>🖼 ' + esc(t.title) + ' <em>' + esc(t.list) + '</em></span><button type="button" data-pt="' + i + '">摆出来</button></li>'; }); h += '</ul>'; }
    $('packBody').innerHTML = h; pack._things = T;
  }
  pack.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    if (b.id === 'sh-packClose') { pack.hidden = true; return; }
    if (b.hasAttribute('data-po')) { var o = objects[+b.getAttribute('data-po')]; if (o.stashed) { var a = room.anchors[o.anchor] || room.anchors['desk.left']; o.group.position.fromArray(a.p); o.group.rotation.y = a.ry; } startEdit(o); return; }
    if (b.hasAttribute('data-ps')) { var o2 = objects[+b.getAttribute('data-ps')]; startEdit(o2); endEdit('stash'); renderPack(); pack.hidden = false; return; }
    if (b.hasAttribute('data-px')) { spawn({ kind: b.getAttribute('data-px') }); return; }
    if (b.hasAttribute('data-pt')) { var t = pack._things[+b.getAttribute('data-pt')]; spawn({ kind: 'thing', ref: { bid: t.bid, card: t.card, sid: t.sid }, title: t.title, list: t.list }); return; }
    if (b.hasAttribute('data-reset')) { delete S.layouts[room.envId]; save(); placeAll(); renderPack(); toast('已恢复默认摆放'); }
  });
  $('packBtn').addEventListener('click', function () { if (busy || edit) return; if (!pack.hidden) { pack.hidden = true; return; } $('settings').hidden = true; if (needsLoad()) B.load().then(function () { if (!pack.hidden) renderPack(); }); renderPack(); pack.hidden = false; });
  function needsLoad() { return !B.EMBED && B.state() !== 'ready'; }

  function setEnv(id) {
    if (busy || id === room.envId) return;
    save(); busy = true; body.classList.add('busy');
    veilFade(1, 0.25).then(function () {
      room.dispose(); room = window.SpatialRoom.build(scene, id);
      camera.far = room.far || 900; camera.updateProjectionMatrix(); if (room.setTime) room.setTime(S.tod);
      placeAll();
      var sp = S.poses && S.poses[room.envId];
      if (sp && isFinite(sp.x) && inArea(sp.x, sp.z)) { P.x = sp.x; P.z = sp.z; P.yaw = sp.yaw; P.pitch = sp.pitch || 0; }
      else { P.x = room.start.pos[0]; P.z = room.start.pos[2]; P.yaw = room.start.yaw; P.pitch = room.start.pitch; }
      deskBase = (function () { var p = room.desk.pos, l = room.desk.look, dx = l[0] - p[0], dy = l[1] - p[1], dz = l[2] - p[2]; return { yaw: Math.atan2(-dx, -dz), pitch: Math.atan2(dy, Math.sqrt(dx * dx + dz * dz)) }; })();
      $('brandName').textContent = room.name; canvas.setAttribute('aria-label', room.name);
      camAuto = true; autoPose(camera.position, camera.quaternion); S.env = room.envId; save();
      return veilFade(0, 0.35);
    }).then(function () { busy = false; body.classList.remove('busy'); });
  }
  function pickEnv() {
    if (busy) return;
    var list = window.SpatialRoom.envs();
    ask('🌐 选择环境', '物件、功能入口和收藏都会跟着你；每个环境的视角分别记住。', list.map(function (e) { return { label: e.icon + '  ' + e.name + ' · ' + e.zh + (e.id === room.envId ? '  ✓' : ''), cls: e.id === room.envId ? 'pri' : '' }; }).concat([{ label: '取消', cls: 'ghost' }]))
      .then(function (i) { if (list[i]) setEnv(list[i].id); });
  }
  $('envBtn').addEventListener('click', pickEnv);
  $('optTime').addEventListener('change', function () { S.tod = this.value; save(); if (room.setTime) room.setTime(S.tod); });
  $('skip').addEventListener('click', function (e) { e.stopPropagation(); skipRunAll(); });
  /* Rings: the medal box on the cabinet or the board on the wall — the same entry, swapped in place */
  function setMedal(style) {
    S.medal = style === 'wall' ? 'wall' : 'box'; save();
    var i = -1; objects.forEach(function (o, j) { if (o.feature === 'rings') i = j; }); if (i < 0 || !window.SpatialEntries) return;
    var old = objects[i], nu = window.SpatialEntries.make({ medal: S.medal }).filter(function (o) { return o.feature === 'rings'; })[0];
    scene.remove(old.group); var a = room.anchors[nu.anchor]; nu.group.position.set(a.p[0], a.p[1], a.p[2]); nu.group.rotation.y = a.ry;
    nu.hit.userData.obj = nu; nu.k = 0; nu.set(0); scene.add(nu.group); nu.group.updateMatrixWorld(true);
    nu.labelAt = new THREE.Vector3(nu.label[0], nu.label[1], nu.label[2]).applyMatrix4(nu.group.matrixWorld); nu.centre = new THREE.Box3().setFromObject(nu.hit).getCenter(new THREE.Vector3());
    nu.lab = old.lab; nu.chip = old.chip; nu.lab.innerHTML = '<i>' + nu.icon + '</i>' + nu.name; nu.lab.onclick = function () { activate(nu); };
    nu.chip.innerHTML = '<b>' + nu.icon + '</b><span>' + nu.name + '</span>'; nu.chip.onclick = function () { activate(nu); };
    objects[i] = nu; placeAll();
  }
  $('optMedal').addEventListener('change', function () { setMedal(this.value); });
  $('setBtn').addEventListener('click', function () { setEl.hidden = !setEl.hidden; if (!setEl.hidden) renderSettings(); });
  $('setClose').addEventListener('click', function () { setEl.hidden = true; });
  $('optDefault').addEventListener('change', function () { S.def = this.value; save(); });
  $('optMotion').addEventListener('change', function () { S.motion = this.checked; save(); });
  if ($('optPreload')) $('optPreload').addEventListener('change', function () { S.preload = this.checked; save(); if (S.preload) B.load().then(renderSettings); renderSettings(); });
  if ($('optBoot')) $('optBoot').addEventListener('change', function () { S.boot = this.checked; save(); });
  function exitHome() { if (busy) return; save(); setEl.hidden = true; closeCard(); B.release(); inFeature = null; body.hidden = true; paused = true; }
  if ($('exitBtn')) $('exitBtn').addEventListener('click', exitHome);
  if ($('setExit')) $('setExit').addEventListener('click', exitHome);

  /* ------------------------------------------------------------ loop */
  function resize() {
    var w = window.innerWidth, h = window.innerHeight, a = w / h;
    renderer.setSize(w, h, false); camera.aspect = a; camera.fov = a < 0.8 ? 76 : (a < 1.25 ? 68 : 60); camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize); resize();
  var clock = new THREE.Clock(), T = 0, lastSave = 0;
  function frame() {
    requestAnimationFrame(frame);
    var dt = Math.min(0.05, clock.getDelta());
    stepTweens(dt);
    if (paused || document.hidden || body.hidden) return;
    T += dt; move(dt);
    if (camAuto) { autoPose(camera.position, camera.quaternion); if (room.shake && !S.motion) { var sh = room.shake(T); camera.position.y += sh.y; camera.rotateZ(sh.roll); } }
    avatar.visible = mode === 'explore' && S.view === '3p' && boom > 0.7;
    if (avatar.visible) { avatar.position.set(P.x, 0, P.z); avatar.rotation.y = P.yaw + Math.PI; }
    room.tick(T); objects.forEach(function (o) { o.idle(T); var s = o === hot ? 1.035 : 1; o.group.scale.setScalar(o.group.scale.x + (s - o.group.scale.x) * Math.min(1, dt * 12)); });
    renderer.render(cineScene || scene, camera); if (!cineScene) placeLabels();
    if (dirty && T - lastSave > 2) { lastSave = T; save(); }
  }
  $('brandName').textContent = room.name;
  setMode(mode, true); autoPose(camera.position, camera.quaternion);
  window.addEventListener('pagehide', save);
  if (!EMBED && S.preload) setTimeout(function () { B.load(); }, 1500);
  placeAll();
  markAvailability();
  frame();

  function open() {
    if (inFeature) { B.leave('home'); return; }                                   // a feature is up: the usual way back
    if (!body.hidden) return;
    body.hidden = false; paused = false; resize(); clock.getDelta(); markAvailability();
    if (mode === 'desk') { DK.yaw = 0; DK.pitch = 0; }
    camAuto = true; try { canvas.focus(); } catch (e) {}
  }
  API = {
    version: '1.0', objects: objects, open: open, close: exitHome, isOpen: function () { return !body.hidden || !!inFeature; },
    setEnv: setEnv, envs: function () { return window.SpatialRoom.envs(); }, env: function () { return room; }, look: function (yaw, pitch) { if (mode === 'desk') { DK.yaw = yaw; DK.pitch = pitch; } else { P.yaw = yaw; P.pitch = pitch; } dirty = true; }, layout: function () { return JSON.parse(JSON.stringify(layout())); },
    edit: { start: function (id) { var o = objects.filter(function (x) { return x.id === id; })[0]; if (o) startEdit(o); }, moveAt: function (x, y) { editMove({ clientX: x, clientY: y }); }, end: function (how) { endEdit(how || 'ok'); }, spawn: function (kind) { spawn({ kind: kind }); }, extras: function () { return XS.length; } },
    walkTo: function (x, z) { if (mode === 'explore' && inArea(x, z)) { walkTo = { x: x, z: z, stuck: 0 }; return true; } return false; },
    activate: function (id) { activate(objects.filter(function (o) { return o.id === id; })[0]); },
    setMode: setMode, setView: setView, leave: function () { B.leave('api'); }, skip: skipAll,
    state: function () { return { shown: !body.hidden, mode: mode, view: S.view, busy: busy, inFeature: inFeature ? inFeature.t.id : null, host: B.state(), env: room.envId, envState: room.state ? room.state() : null, pose: { x: P.x, z: P.z, yaw: P.yaw, pitch: P.pitch }, desk: { yaw: DK.yaw, pitch: DK.pitch }, cam: camera.position.toArray().map(function (n) { return +n.toFixed(3); }), k: objects.map(function (o) { return +o.k.toFixed(2); }) }; }
  };
  return API;
  }

  function settings() { try { return JSON.parse(localStorage.getItem(KEY) || 'null') || {}; } catch (e) { return {}; } }
  /* the user's choice when they made one (true / false); otherwise the build's default (window.__SPATIAL_HOME_BOOT_DEFAULT__, on unless set false) */
  function bootOn() { var b = settings().boot; return typeof b === 'boolean' ? b : window.__SPATIAL_HOME_BOOT_DEFAULT__ !== false; }
  /* will the room be the start screen of this launch? (Routine's own iOS start screen asks this and yields) */
  function bootsFirst() {
    if (!EMBED) return false;
    try { if (window.isStudentMode && window.isStudentMode()) return false; } catch (e) { return false; }
    var q = location.search;
    return /[?&]home=1\b/.test(q) || (bootOn() && !/[?&]home=0\b/.test(q));
  }
  var PUB = {
    version: '1.0',
    open: function () { var a = mount(); a.open(); return a; },
    close: function () { if (API) API.close(); },
    isOpen: function () { return !!(API && API.isOpen()); },
    api: function () { return API; },
    bootsFirst: function () { return bootsFirst(); }
  };
  window.MinestSpatialHome = PUB;
  window.SpatialHome = PUB;                       // the console name used by the standalone page's tests
  if (!EMBED) return;

  /* ---------------------------------------------------------------- inside Minest: an entry in the Dock, and the room first if asked */
  var ICON = '🏛';
  var SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20V11a8 8 0 0 1 16 0v9z"/><path d="M9 20v-5a3 3 0 0 1 6 0v5"/><path d="M3 20h18"/><path d="M12 3V1.8"/></svg>';
  function entries() {
    if (!document.getElementById('mn-spatial-home-trigger')) {     // a hidden button the Dock / native side can press
      var t = document.createElement('button'); t.type = 'button'; t.id = 'mn-spatial-home-trigger'; t.style.display = 'none'; t.setAttribute('aria-label', 'Spatial Home');
      t.addEventListener('click', function () { PUB.open(); }); document.body.appendChild(t);
    }
    var side = document.querySelector('.mn-bdock');                  // the glass Dock the page shows (as CarFlash does)
    if (side && !side.querySelector('[data-spatial-home-dock]')) {
      var t2 = document.createElement('button'); t2.type = 'button'; t2.className = 'mn-bapp mdk-tile mdk-t'; t2.setAttribute('data-spatial-home-dock', ''); t2.title = 'Spatial Home · 我的房间'; t2.setAttribute('aria-label', 'Spatial Home · 我的房间');
      t2.innerHTML = SVG; t2.addEventListener('click', function (e) { e.stopPropagation(); PUB.open(); });
      side.insertBefore(t2, side.firstChild);
    }
    var dock = document.querySelector('nav.ios-bottom-tab-bar');
    if (dock && !dock.querySelector('[data-spatial-home-dock]')) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'ios-tab-item'; b.setAttribute('data-spatial-home-dock', ''); b.title = 'Spatial Home · 我的房间';
      b.innerHTML = '<span class="ios-tab-icon" aria-hidden="true">' + ICON + '</span><span class="ios-tab-label">房间</span>'; b.onclick = function () { PUB.open(); }; dock.appendChild(b);
    }
  }
  var queued = false;
  new MutationObserver(function () { if (queued) return; queued = true; requestAnimationFrame(function () { queued = false; entries(); }); }).observe(document.body, { childList: true, subtree: true });
  entries();
  function boot() {
    if (!bootsFirst()) return;
    PUB.open();
    /* Liquid Routine's own iOS start screen (Day Flow) may open at the same launch: the room is the start screen, so it is put away */
    var t0 = Date.now(), iv = setInterval(function () {
      try { if (window.MinestRoutine && MinestRoutine.isOpen() && PUB.isOpen() && !(API && API.state().inFeature)) MinestRoutine.close(); } catch (e) {}
      if (Date.now() - t0 > 2500) clearInterval(iv);
    }, 150);
  }
  if (document.readyState === 'complete') setTimeout(boot, 300); else window.addEventListener('load', function () { setTimeout(boot, 300); }, { once: true });
})();
