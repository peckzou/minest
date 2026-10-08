/* Pet Raising — Copy Cat v1 (43.8): a "Talking Tom" mode for the octopus.
   FACE (mocap): the octopus mirrors your face live —
     - source A: Apple ARKit (iOS app; the parent page forwards window.__onARKitFaceData frames here),
     - source B: MediaPipe Face Landmarker in the browser (camera; same 52 ARKit blendshape names).
     jaw / pucker / smile / frown / press → mouth (mouth-v1 live), blinks & squints → eyelids (lids-v1),
     gaze / wide eyes / brows → catchlights + expressions (v6-eye-control), head yaw/pitch/roll → the whole
     octopus turns like a mirror image.
   VOICE (echo): it listens for you to speak (voice activity detection), records you, and when you stop
     it says it back in a higher, faster octopus voice — lip-synced from the audio, and replaying the face
     you made while you said it (sped up to match).
   UI: a "Copy Cat" button; while on, a small mirrored camera preview and a status line. */
(function () {
  'use strict';
  if (window.__octoCopyCat) return;
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  var inFrame = window.parent && window.parent !== window;
  var MP_VER = '0.10.14';
  var MP_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@' + MP_VER;
  var MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';
  var PITCH = 1.45;          // echo voice: higher + faster (Talking-Tom style)

  // ---------------------------------------------------------------------------------------------------
  // UI
  // ---------------------------------------------------------------------------------------------------
  var css = [
    '#octo-cc-btn{position:fixed;right:12px;bottom:calc(env(safe-area-inset-bottom,0px) + 92px);z-index:60;display:flex;align-items:center;gap:6px;padding:9px 13px;border-radius:999px;border:1px solid rgba(255,255,255,.28);background:rgba(20,40,60,.55);color:#fff;font:600 13px -apple-system,system-ui,sans-serif;backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);box-shadow:0 6px 18px rgba(0,0,0,.25);cursor:pointer}',
    '#octo-cc-btn[data-on="true"]{background:rgba(160,90,255,.72);border-color:rgba(255,255,255,.5)}',
    '#octo-cc-panel{position:fixed;right:12px;bottom:calc(env(safe-area-inset-bottom,0px) + 140px);z-index:60;display:none;flex-direction:column;align-items:flex-end;gap:6px;pointer-events:none}',
    '#octo-cc-panel.on{display:flex}',
    '#octo-cc-video{width:104px;height:78px;object-fit:cover;border-radius:14px;transform:scaleX(-1);border:1px solid rgba(255,255,255,.35);box-shadow:0 6px 16px rgba(0,0,0,.3);background:#000}',
    '#octo-cc-video.hidden{display:none}',
    '#octo-cc-status{padding:5px 10px;border-radius:999px;background:rgba(0,0,0,.45);color:#fff;font:600 12px -apple-system,system-ui,sans-serif;max-width:220px;text-align:right}',
    '#octo-cc-meter{width:104px;height:4px;border-radius:2px;background:rgba(255,255,255,.18);overflow:hidden}',
    '#octo-cc-meter i{display:block;height:100%;width:0;background:#7cf3c8;transition:width .06s linear}'
  ].join('\n');
  var btn, panel, video, statusEl, meterEl;
  function buildUI() {
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    btn = document.createElement('button'); btn.id = 'octo-cc-btn'; btn.type = 'button'; btn.dataset.on = 'false';
    btn.innerHTML = '<span aria-hidden="true">🎭</span><span>Copy Cat</span>';
    btn.setAttribute('aria-label', 'Copy Cat: octopus copies your face and voice');
    btn.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); if (on) stop(); else start(); });
    panel = document.createElement('div'); panel.id = 'octo-cc-panel';
    video = document.createElement('video'); video.id = 'octo-cc-video'; video.muted = true; video.playsInline = true; video.setAttribute('playsinline', ''); video.autoplay = true;
    statusEl = document.createElement('div'); statusEl.id = 'octo-cc-status';
    meterEl = document.createElement('div'); meterEl.id = 'octo-cc-meter'; meterEl.innerHTML = '<i></i>';
    panel.appendChild(video); panel.appendChild(meterEl); panel.appendChild(statusEl);
    document.body.appendChild(btn); document.body.appendChild(panel);
  }
  function status(t) { if (statusEl) statusEl.textContent = t; }

  // ---------------------------------------------------------------------------------------------------
  // octopus hooks
  // ---------------------------------------------------------------------------------------------------
  function A() { return window.__octopusAvatar; }
  var pose = { yaw: 0, pitch: 0, roll: 0 }, poseT = { yaw: 0, pitch: 0, roll: 0 }, renderHooked = false, pivotY = .62;
  function hookRender() {
    var av = A();
    if (renderHooked || !av || !av.renderer || !av.importedModel) return;
    renderHooked = true;
    var m0 = av.importedModel, Q = m0.quaternion.constructor, V3 = m0.position.constructor, E3 = m0.rotation.constructor;
    var q = new Q(), e = new E3(), pv = new V3(), tv = new V3(), sp = new V3(), sr = new E3();
    m0.traverse(function (n) { if (n.isSkinnedMesh && n.geometry) { n.geometry.computeBoundingBox(); var bb = n.geometry.boundingBox; pivotY = (bb.min.y + bb.max.y) * .55; } });
    var R = av.renderer, orig = R.render.bind(R);
    R.render = function (scene, camera) {
      var m = av.importedModel;
      var mag = Math.abs(pose.yaw) + Math.abs(pose.pitch) + Math.abs(pose.roll);
      if (!m || mag < .002) return orig(scene, camera);
      sp.copy(m.position); sr.copy(m.rotation);
      e.set(pose.pitch, pose.yaw, pose.roll, 'YXZ'); q.setFromEuler(e);
      pv.set(0, pivotY, 0).multiply(m.scale).applyQuaternion(m.quaternion);
      tv.set(0, pivotY, 0).multiply(m.scale).applyQuaternion(q).applyQuaternion(m.quaternion);
      m.quaternion.multiply(q); m.position.add(pv).sub(tv); m.updateMatrixWorld(true);
      var out = orig(scene, camera);
      m.position.copy(sp); m.rotation.copy(sr); m.updateMatrixWorld(true);
      return out;
    };
  }

  // while Copy Cat is on, the ocean world's own reactions (fish nearby → look / swim off …) would pull the
  // octopus away from the mirror: only Copy Cat's own calls get through.
  var guarded = false, self = false;
  function guardActions() {
    var av = A();
    if (guarded || !av) return;
    guarded = true;
    ['playAnimation', 'playAction', 'playReferenceMotion'].forEach(function (name) {
      var orig = av[name];
      if (typeof orig !== 'function') return;
      av[name] = function () { if (on && !self) return false; return orig.apply(av, arguments); };
    });
  }
  function own(fn) { self = true; try { return fn(); } finally { self = false; } }

  // face frame → octopus. f = { shapes: {name: 0..1}, yaw, pitch, roll } (radians, already mirrored)
  var lastExpr = '', lastExprAt = 0, lastPuffAt = 0;
  function applyFace(f, audioOpen) {
    var s = f.shapes || {}, g = function (k) { return +s[k] || 0; };
    var jaw = g('jawOpen'), pucker = g('mouthPucker'), funnel = g('mouthFunnel');
    var smile = (g('mouthSmileLeft') + g('mouthSmileRight')) / 2, frown = (g('mouthFrownLeft') + g('mouthFrownRight')) / 2;
    var press = (g('mouthPressLeft') + g('mouthPressRight')) / 2 + g('mouthClose') * .5;
    var stretch = (g('mouthStretchLeft') + g('mouthStretchRight')) / 2;
    var open = clamp(jaw * 1.7 - g('mouthClose') * .6, 0, 1);
    if (audioOpen != null) open = Math.max(open * .6, audioOpen);
    var round = clamp(pucker * 1.25 + funnel * 1.3, 0, 1);
    var M = window.__octoMouth;
    if (M && M.live) M.live({ open: open, round: round, smile: clamp(.25 + smile * 1.5 - frown * 1.6, -1, 1), wide: clamp(1 + stretch * .35 + smile * .12 - round * .3, .55, 1.3), press: clamp(open < .08 ? press : 0, 0, 1) });
    // eyelids (screen sides: the octopus is your mirror image)
    var Ld = window.__octoLids;
    var lidOf = function (side) { return clamp((g('eyeBlink' + side) - .12) / .55 + g('eyeSquint' + side) * .3, 0, 1); };
    if (Ld) Ld.set(lidOf('Left'), lidOf('Right'));
    // gaze + eye size
    var Ey = window.__v6EyeHighlight;
    if (Ey && Ey.setLive) {
      var lookR = (g('eyeLookOutRight') + g('eyeLookInLeft')) / 2, lookL = (g('eyeLookOutLeft') + g('eyeLookInRight')) / 2;
      var lookD = (g('eyeLookDownLeft') + g('eyeLookDownRight')) / 2, lookU = (g('eyeLookUpLeft') + g('eyeLookUpRight')) / 2;
      Ey.setLive({ dx: (lookR - lookL) * .45, dy: (lookD - lookU) * .4, size: 1 + (g('eyeWideLeft') + g('eyeWideRight')) / 2 * .4 });
      // brows + mouth → a readable expression for the catchlights
      var brUp = g('browInnerUp'), brDown = (g('browDownLeft') + g('browDownRight')) / 2, ex = 'neutral';
      if (brUp > .45 && jaw > .3) ex = 'surprised';
      else if (smile > .45) ex = jaw > .35 ? 'excited' : 'happy';
      else if (brUp > .4 && frown > .2) ex = 'sad';
      else if (brDown > .45) ex = 'curious';
      var now = performance.now();
      if (ex !== lastExpr && now - lastExprAt > 350) { lastExpr = ex; lastExprAt = now; Ey.setExpression(ex, 0); }
    }
    // puffed cheeks → bubbles
    if (g('cheekPuff') > .5 && performance.now() - lastPuffAt > 900 && M && M.bubbles) { lastPuffAt = performance.now(); M.bubbles(3); }
    poseT.yaw = clamp(f.yaw || 0, -.8, .8); poseT.pitch = clamp(f.pitch || 0, -.5, .5); poseT.roll = clamp(f.roll || 0, -.6, .6);
  }
  function smoothPose() {
    pose.yaw += (poseT.yaw - pose.yaw) * .35; pose.pitch += (poseT.pitch - pose.pitch) * .35; pose.roll += (poseT.roll - pose.roll) * .35;
  }

  // ---------------------------------------------------------------------------------------------------
  // face sources
  // ---------------------------------------------------------------------------------------------------
  var on = false, source = 'none', landmarker = null, stream = null, lastVideoTime = -1, liveFace = null, arkitAt = 0;
  // ARKit (iOS app): the parent page forwards native frames
  window.addEventListener('message', function (event) {
    var d = event.data;
    if (!d || d.type !== 'minest-arkit' || (inFrame && event.source !== window.parent)) return;
    var p = d.data || {};
    arkitAt = performance.now();
    if (!on) return;
    if (source !== 'arkit') { source = 'arkit'; status('ARKit 面部追踪中 · 说点什么吧'); }
    // ARKit names are already the person's own left/right; head angles mirrored for a mirror image
    liveFace = { shapes: p, yaw: -(+p.headYaw || 0), pitch: +p.headPitch || 0, roll: -(+p.headRoll || 0), t: performance.now() };
  });
  function headFromMatrix(m) {
    // column-major 4x4: col2 = face forward
    return { yaw: -Math.atan2(m[8], m[10]), pitch: Math.asin(clamp(-m[9], -1, 1)), roll: -Math.atan2(m[1], m[5]) };
  }
  async function startMediaPipe() {
    if (!stream || !stream.getVideoTracks().length) return false;
    status('正在加载面部追踪…');
    var vision = await import(MP_URL + '/vision_bundle.mjs');
    var fileset = await vision.FilesetResolver.forVisionTasks(MP_URL + '/wasm');
    var opts = { baseOptions: { modelAssetPath: MODEL_URL, delegate: 'GPU' }, runningMode: 'VIDEO', numFaces: 1, outputFaceBlendshapes: true, outputFacialTransformationMatrixes: true };
    try { landmarker = await vision.FaceLandmarker.createFromOptions(fileset, opts); }
    catch (e) { opts.baseOptions.delegate = 'CPU'; landmarker = await vision.FaceLandmarker.createFromOptions(fileset, opts); }
    source = 'mediapipe';
    return true;
  }
  function mediaPipeFrame(now) {
    if (!landmarker || video.readyState < 2 || video.currentTime === lastVideoTime) return;
    lastVideoTime = video.currentTime;
    var res = landmarker.detectForVideo(video, now);
    if (!res || !res.faceBlendshapes || !res.faceBlendshapes.length) { liveFace = null; return; }
    var shapes = {};
    res.faceBlendshapes[0].categories.forEach(function (c) { shapes[c.categoryName] = c.score; });
    var head = res.facialTransformationMatrixes && res.facialTransformationMatrixes[0] ? headFromMatrix(res.facialTransformationMatrixes[0].data) : { yaw: 0, pitch: 0, roll: 0 };
    liveFace = { shapes: shapes, yaw: head.yaw, pitch: head.pitch, roll: head.roll, t: now };
  }

  // ---------------------------------------------------------------------------------------------------
  // voice echo (Talking Tom)
  // ---------------------------------------------------------------------------------------------------
  var ac = null, micNode = null, proc = null, analyser = null, freq = null, timeBuf = null;
  var vad = { floor: .01, speaking: false, lastVoice: 0, startAt: 0 }, pre = [], chunks = [], faceRec = [], playing = null, muteUntil = 0;
  function startAudio() {
    if (!stream || !stream.getAudioTracks().length) return false;
    ac = ac || new (window.AudioContext || window.webkitAudioContext)();
    if (ac.state === 'suspended') ac.resume();
    micNode = ac.createMediaStreamSource(stream);
    proc = ac.createScriptProcessor(2048, 1, 1);
    var sink = ac.createGain(); sink.gain.value = 0;
    micNode.connect(proc); proc.connect(sink); sink.connect(ac.destination);
    proc.onaudioprocess = onMic;
    analyser = ac.createAnalyser(); analyser.fftSize = 1024; freq = new Uint8Array(analyser.frequencyBinCount); timeBuf = new Float32Array(analyser.fftSize);
    return true;
  }
  function onMic(ev) {
    var x = ev.inputBuffer.getChannelData(0), sum = 0;
    for (var i = 0; i < x.length; i++) sum += x[i] * x[i];
    var rms = Math.sqrt(sum / x.length), now = performance.now();
    if (meterEl) meterEl.firstChild.style.width = Math.min(100, rms * 900) + '%';
    if (playing || now < muteUntil) return;                       // don't hear ourselves
    var copy = new Float32Array(x);
    var thr = Math.max(.018, vad.floor * 3.2);
    if (!vad.speaking) {
      vad.floor = vad.floor * .97 + Math.min(rms, .05) * .03;      // adaptive noise floor
      pre.push(copy); if (pre.length > 6) pre.shift();             // ~0.25 s pre-roll
      if (rms > thr) { vad.speaking = true; vad.startAt = now; vad.lastVoice = now; chunks = pre.slice(); pre = []; faceRec = []; status('🎙 在听你说…'); var E = window.__v6EyeHighlight; if (E && !liveFace) E.setExpression('curious', 0); }
      return;
    }
    chunks.push(copy);
    if (rms > thr * .7) vad.lastVoice = now;
    var long = now - vad.startAt > 8000;
    if (now - vad.lastVoice > 650 || long) { vad.speaking = false; finishRecording(); }
  }
  function finishRecording() {
    var total = 0; chunks.forEach(function (c) { total += c.length; });
    var dur = total / ac.sampleRate;
    if (dur < .45) { chunks = []; status(statusIdle()); return; }
    // trim the trailing silence the detector waited through
    var keep = Math.max(1, total - Math.floor(ac.sampleRate * .5));
    var buf = ac.createBuffer(1, keep, ac.sampleRate), data = buf.getChannelData(0), o = 0;
    for (var i = 0; i < chunks.length && o < keep; i++) { var c = chunks[i], n = Math.min(c.length, keep - o); data.set(n === c.length ? c : c.subarray(0, n), o); o += n; }
    chunks = [];
    // gentle fade in/out, normalise loudness
    var peak = 0; for (var k = 0; k < data.length; k++) peak = Math.max(peak, Math.abs(data[k]));
    var gain = peak > 0 ? Math.min(4, .85 / peak) : 1, fade = Math.min(800, data.length >> 3);
    for (var j = 0; j < data.length; j++) { var f = Math.min(1, j / fade, (data.length - 1 - j) / fade); data[j] *= gain * f; }
    playEcho(buf, faceRec.slice());
  }
  function playEcho(buf, faces) {
    var src = ac.createBufferSource();
    src.buffer = buf; src.playbackRate.value = PITCH;
    var out = ac.createGain(); out.gain.value = 1;
    src.connect(analyser); analyser.connect(out); out.connect(ac.destination);
    playing = { src: src, start: ac.currentTime, faces: faces, dur: buf.duration / PITCH };
    status('🔁 小章鱼学你说话…');
    var E = window.__v6EyeHighlight; if (E) E.setExpression('happy', 0);
    src.onended = function () {
      try { analyser.disconnect(out); } catch (e) {}
      playing = null; muteUntil = performance.now() + 450;
      var M = window.__octoMouth; if (M) M.live({ open: 0, smile: .7 });
      status(statusIdle());
      if (Math.random() < .5 && M && M.play) M.play('giggle', 250);
    };
    src.start();
  }
  // lip sync from the echo audio: loudness → open, spectral centroid → round (dark "o/u") vs wide ("e/i/s")
  function echoMouth() {
    analyser.getFloatTimeDomainData(timeBuf);
    var s = 0; for (var i = 0; i < timeBuf.length; i++) s += timeBuf[i] * timeBuf[i];
    var rms = Math.sqrt(s / timeBuf.length);
    analyser.getByteFrequencyData(freq);
    var num = 0, den = 0; for (var k = 2; k < freq.length; k++) { num += k * freq[k]; den += freq[k]; }
    var centroid = den ? num / den / freq.length : .2;              // 0..1
    var open = clamp((rms - .015) * 6, 0, 1);
    return { open: open, round: clamp((.16 - centroid) * 5, 0, 1), wide: clamp(.9 + (centroid - .12) * 2.5, .7, 1.25) };
  }
  function statusIdle() { return source === 'arkit' ? 'ARKit 面部追踪中 · 说点什么吧' : source === 'mediapipe' ? (liveFace ? '模仿你的表情中 · 说点什么吧' : '把脸放进镜头里 · 说点什么吧') : '说点什么吧，小章鱼会学你'; }

  // ---------------------------------------------------------------------------------------------------
  // main loop
  // ---------------------------------------------------------------------------------------------------
  var faceLostAt = 0;
  function loop(now) {
    if (!on) return;
    requestAnimationFrame(loop);
    if (source === 'mediapipe') { try { mediaPipeFrame(now); } catch (e) {} }
    if (playing) {
      // replay: the face you made while speaking (sped up like the voice) + mouth from the audio
      var t = (ac.currentTime - playing.start) * PITCH * 1000, fr = null;
      for (var i = 0; i < playing.faces.length; i++) { if (playing.faces[i].rt <= t) fr = playing.faces[i]; else break; }
      var am = echoMouth();
      applyFace(fr || { shapes: {}, yaw: 0, pitch: 0, roll: 0 }, am.open);
      var M = window.__octoMouth;
      if (M && M.live && am.open > .05) M.live({ open: Math.max(am.open, fr ? clamp((+fr.shapes.jawOpen || 0) * 1.7, 0, 1) * .6 : 0), round: am.round, wide: am.wide, smile: .35 });
    } else if (liveFace && now - liveFace.t < 400) {
      applyFace(liveFace);
      if (vad.speaking) faceRec.push({ rt: now - vad.startAt, shapes: liveFace.shapes, yaw: liveFace.yaw, pitch: liveFace.pitch, roll: liveFace.roll });
      faceLostAt = 0;
    } else {
      // no face: ease back to neutral
      poseT.yaw = poseT.pitch = poseT.roll = 0;
      if (!faceLostAt) {
        faceLostAt = now; if (!vad.speaking) status(statusIdle());
        lastExpr = 'neutral'; var Ey = window.__v6EyeHighlight; if (Ey) { Ey.setExpression('neutral', 0); Ey.setLive({ dx: 0, dy: 0, size: 1 }); }
        var M = window.__octoMouth; if (M && M.live) M.live({ open: .1, smile: .6 });
        var Ld = window.__octoLids; if (Ld) Ld.set(0, 0);
      }
    }
    smoothPose();
  }

  // ---------------------------------------------------------------------------------------------------
  // start / stop
  // ---------------------------------------------------------------------------------------------------
  async function start() {
    if (on) return;
    on = true; btn.dataset.on = 'true'; panel.classList.add('on'); status('请求摄像头和麦克风…');
    hookRender(); guardActions();
    // calm the octopus: no choreography, hold still facing you
    var mo = window.__motionV3 || window.__motionV2; if (mo && mo.setEnabled) mo.setEnabled(false);
    var av = A(); if (av && av.playAnimation) own(function () { av.playAnimation('idle'); });
    var Ld = window.__octoLids; if (Ld) Ld.setAuto(false);
    // the iOS app can provide ARKit; ask, and give it a moment before using the camera ourselves
    if (inFrame) { try { window.parent.postMessage({ type: 'minest-copycat', action: 'start' }, '*'); } catch (e) {} }
    await new Promise(function (r) { setTimeout(r, 700); });
    var wantVideo = !(performance.now() - arkitAt < 1500);
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: wantVideo ? { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } } : false, audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
    } catch (e) {
      try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch (e2) { stream = null; }
    }
    if (!on) { stopTracks(); return; }
    if (stream && stream.getVideoTracks().length) { video.srcObject = stream; video.classList.remove('hidden'); try { await video.play(); } catch (e) {} }
    else video.classList.add('hidden');
    var hasAudio = false;
    try { hasAudio = startAudio(); } catch (e) {}
    if (source !== 'arkit' && stream && stream.getVideoTracks().length) {
      try { await startMediaPipe(); } catch (e) { console.warn('[copycat] face tracking unavailable', e); source = 'none'; }
    }
    if (source === 'arkit') status(hasAudio ? statusIdle() : 'ARKit 面部追踪中（没有麦克风，不能学说话）');
    else if (!stream) status('没有拿到摄像头/麦克风权限');
    else status(hasAudio ? statusIdle() : '只有面部模仿（没有麦克风）');
    requestAnimationFrame(loop);
  }
  function stopTracks() { if (stream) stream.getTracks().forEach(function (t) { t.stop(); }); stream = null; }
  function stop() {
    on = false; btn.dataset.on = 'false'; panel.classList.remove('on');
    if (inFrame) { try { window.parent.postMessage({ type: 'minest-copycat', action: 'stop' }, '*'); } catch (e) {} }
    try { if (playing) playing.src.stop(); } catch (e) {}
    playing = null; vad.speaking = false; chunks = []; liveFace = null;
    try { if (proc) { proc.disconnect(); proc.onaudioprocess = null; } if (micNode) micNode.disconnect(); } catch (e) {}
    stopTracks(); video.srcObject = null;
    if (landmarker) { try { landmarker.close(); } catch (e) {} landmarker = null; }
    source = 'none';
    pose.yaw = pose.pitch = pose.roll = poseT.yaw = poseT.pitch = poseT.roll = 0;
    var Ey = window.__v6EyeHighlight; if (Ey) { Ey.setLive({ dx: 0, dy: 0, size: 1 }); Ey.setExpression('happy', 1500); }
    var Ld = window.__octoLids; if (Ld) Ld.setAuto(true);
    var mo = window.__motionV3 || window.__motionV2; if (mo && mo.setEnabled) mo.setEnabled(true);
    var av = A(); if (av && av.playAction) own(function () { av.playAction('free_swim_aquarium'); });
  }

  function boot() { if (!document.body) return setTimeout(boot, 50); buildUI(); }
  boot();
  window.__octoCopyCat = {
    start: start, stop: stop, get on() { return on; }, get source() { return source; },
    // test hooks: drive with a synthetic face frame / echo an AudioBuffer
    face: function (f) { liveFace = Object.assign({ shapes: {}, yaw: 0, pitch: 0, roll: 0 }, f, { t: performance.now() }); },
    echo: function (buf, faces) { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); analyser = analyser || (function () { var a = ac.createAnalyser(); a.fftSize = 1024; freq = new Uint8Array(a.frequencyBinCount); timeBuf = new Float32Array(a.fftSize); return a; })(); playEcho(buf, faces || []); },
    get audioContext() { return ac; }
  };
})();
