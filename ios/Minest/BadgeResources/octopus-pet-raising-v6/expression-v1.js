/* Minest Pet — Expression System V1 (44.1)
   Six base expressions — Happy, Surprised, Sleepy, Curious, Sad, Playful — composed from what the
   octopus already has (no new avatar): eye catchlights (v6-eye-control), eyelids (lids-v1), mouth
   (mouth-v1) and body posture (applied at draw time on top of idle / free swim / breathing / spins).

   Blending: every expression has a weight that eases towards 0/1 (~0.4 s), so posture, lid level and
   gaze blend continuously; the eye and mouth presets switch on the dominant expression and those
   modules ease into them themselves — nothing jumps.

   Priorities (highest first):
     mouth:  voice lip-sync (pet or user speaking) > mouth clips > expression mouth
     lids:   Copy Cat face capture > eyelid clips > expression resting lid (+ natural blinks on top)
     gaze:   Copy Cat face capture > pointer / tap attention > expression gaze > neutral
     body:   house visits and Copy Cat own the octopus; otherwise expression posture + attention head turn

   Sources: window.__octoExpression.set(name, holdMs) (user / app), and the existing behaviour code
   (motion, voice, world reactions) whose expression calls are mapped onto the six. A user-chosen
   expression is held and not overridden by automatic ones until it ends. */
(function () {
  'use strict';
  if (window.__octoExpression) return;
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function R(a, b) { return a + (b - a) * Math.random(); }

  var NAMES = ['happy', 'surprised', 'sleepy', 'curious', 'sad', 'playful'];
  var LABELS = { happy: 'Happy', surprised: 'Surprised', sleepy: 'Sleepy', curious: 'Curious', sad: 'Sad', playful: 'Playful' };
  // body: pitch (+ = leans forward / droops), roll (tilt), lift (body heights), scale, bob amplitude/Hz,
  // wiggle (roll oscillation) amplitude/Hz, yaw wiggle
  var DEF = {
    happy:     { eyes: 'happy', mouth: 'happy', lid: .26, gaze: [0, -.07], body: { pitch: -.04, roll: 0, lift: .03, scale: 1.02, bob: .045, bobHz: 1.5, wig: .06, wigHz: .8, yaw: 0 }, every: [5, 8], act: function () { mouth('giggle'); lids('happy'); } },
    surprised: { eyes: 'surprised', mouth: 'surprised', lid: 0, gaze: [0, 0], body: { pitch: -.13, roll: 0, lift: .07, scale: 1.06, bob: 0, bobHz: 1, wig: 0, wigHz: 1, yaw: 0 }, enter: function () { mouth('gasp'); lids('gasp'); }, every: [7, 10], act: function () { lids('blinkDouble'); } },
    sleepy:    { eyes: 'sleepy', mouth: 'sleepy', lid: .55, gaze: [0, .17], body: { pitch: .13, roll: 0, lift: -.04, scale: 1, bob: .025, bobHz: .45, wig: .05, wigHz: .3, yaw: 0 }, every: [6, 9], act: function () { mouth('yawn'); lids('yawn'); } },
    curious:   { eyes: 'curious', mouth: 'curious', lid: .06, gaze: 'scan', body: { pitch: -.03, roll: .16, lift: .02, scale: 1.01, bob: .02, bobHz: .9, wig: 0, wigHz: 1, yaw: 0 }, every: [4, 7], act: function () { mouth('ooh'); lids('focus'); } },
    sad:       { eyes: 'sad', mouth: 'sad', lid: .3, gaze: [-.05, .27], body: { pitch: .15, roll: -.05, lift: -.06, scale: .97, bob: .015, bobHz: .4, wig: 0, wigHz: 1, yaw: 0 }, every: [7, 11], act: function () { mouth('pout'); lids('pout'); } },
    playful:   { eyes: 'playful', mouth: 'playful', lid: .1, gaze: 'dart', body: { pitch: -.05, roll: 0, lift: .03, scale: 1.02, bob: .055, bobHz: 2.1, wig: .13, wigHz: 2.3, yaw: .14 }, every: [3.5, 6], act: function () { lids('wink'); mouth(Math.random() < .5 ? 'giggle' : 'smirk'); } }
  };
  // names used by the existing behaviour code → the six (others pass straight through to the eyes)
  var MAP = { happy: 'happy', excited: 'happy', love: 'happy', surprised: 'surprised', sleepy: 'sleepy', curious: 'curious', sad: 'sad', playful: 'playful', dizzy: 'playful' };

  function E() { return window.__v6EyeHighlight; }
  function M() { return window.__octoMouth; }
  function L() { return window.__octoLids; }
  function A() { return window.__octopusAvatar; }
  function mouth(c) { var m = M(); if (m && m.play && !talking) m.play(c, 80); }
  function lids(c) { var l = L(); if (l && l.play && !faceCapture()) l.play(c, 60); }
  function faceCapture() { var cc = window.__octoCopyCat; return !!(cc && cc.on); }
  function houseBusy() { var h = window.__octoHouse; return !!(h && h.state && h.state !== 'roam'); }

  var w = {}; NAMES.forEach(function (n) { w[n] = 0; });
  var current = null, until = 0, userHold = false, dominant = null, nextAct = 0, talking = false;
  var eyesSet = null, rawEyes = null;

  // ---- set / clear --------------------------------------------------------------------------------
  function set(name, holdMs, fromUser) {
    if (name && !DEF[name]) name = null;
    if (!fromUser && userHold && performance.now() < until) return false;     // the user's choice wins
    var changed = name !== current;
    current = name; userHold = !!fromUser && !!name;
    until = name ? performance.now() + (holdMs == null ? (fromUser ? 12000 : 4000) : holdMs || 1e12) : 0;
    if (changed && name && DEF[name].enter) DEF[name].enter();
    if (changed) nextAct = performance.now() + R(1500, 3000);
    syncUI();
    return true;
  }

  // the existing behaviour code calls the eyes' setExpression(); route those through here
  function hookEyes() {
    var eyes = E();
    if (!eyes || eyes.__exprHooked) return !!(eyes && eyes.__exprHooked);
    rawEyes = eyes.setExpression;                     // (mouth-v1 already chains its mood onto this)
    eyes.setExpression = function (name, ms) {
      var base = MAP[name];
      if (base) { if (set(base, ms || 4000, false)) applyPresets(true); return; }
      if (name === 'neutral') { if (!(userHold && performance.now() < until)) set(null); applyPresets(true); return; }
      if (userHold && performance.now() < until) return;       // a one-off look (shy, …) can't override the user's pick
      return rawEyes.apply(eyes, arguments);
    };
    eyes.__exprHooked = true;
    return true;
  }
  function applyPresets(force) {
    var name = dominant;
    if (!force && name === eyesSet) return;
    eyesSet = name;
    if (rawEyes) rawEyes.call(E(), name ? DEF[name].eyes : 'neutral', 0);
    var m = M(); if (m && m.mood) m.mood(name ? DEF[name].mouth : 'neutral');   // resting mouth (voice still wins)
  }

  // ---- attention (pointer / tap) ------------------------------------------------------------------
  var pointer = { x: 0, y: 0, at: -1e9, tapAt: -1e9 }, attn = 0;
  window.addEventListener('pointermove', function (e) { if (e.pointerType === 'mouse') { pointer.x = e.clientX; pointer.y = e.clientY; pointer.at = performance.now(); } }, { passive: true });
  window.addEventListener('pointerdown', function (e) {
    pointer.x = e.clientX; pointer.y = e.clientY; pointer.at = pointer.tapAt = performance.now();
    if (faceCapture() || houseBusy()) return;
    var c = octoScreen();
    if (!c) return;
    var d = Math.hypot(e.clientX - c.x, e.clientY - c.y);
    if (d < c.r) { set('happy', 2600, false); applyPresets(); mouth('giggle'); lids('happy'); }     // petted
    else { lids('blink'); }                                                                          // glance at the tap
  }, { passive: true, capture: true });
  function octoScreen() {
    var av = A(); if (!av || !av.importedModel || !av.camera) return null;
    var m = av.importedModel, V3 = m.position.constructor, r = av.renderer.domElement.getBoundingClientRect();
    var p = new V3(0, pivotY, 0).applyMatrix4(m.matrixWorld).project(av.camera), t = new V3(0, pivotY * 2, 0).applyMatrix4(m.matrixWorld).project(av.camera);
    return { x: r.left + (p.x + 1) / 2 * r.width, y: r.top + (1 - p.y) / 2 * r.height, r: Math.max(40, Math.abs(p.y - t.y) / 2 * r.height * 1.1) };
  }

  // ---- body posture at draw time ----------------------------------------------------------------
  var pivotY = .62, pose = { pitch: 0, roll: 0, yaw: 0, lift: 0, scale: 1 }, hooked = false;
  function hookRender() {
    var av = A(); if (hooked || !av || !av.renderer || !av.importedModel) return;
    hooked = true;
    var m0 = av.importedModel, Q = m0.quaternion.constructor, V3 = m0.position.constructor, E3 = m0.rotation.constructor;
    m0.traverse(function (n) { if (n.isSkinnedMesh && n.geometry) { n.geometry.computeBoundingBox(); var bb = n.geometry.boundingBox; pivotY = (bb.min.y + bb.max.y) * .5; } });
    var q = new Q(), e = new E3(), pv = new V3(), tv = new V3(), sp = new V3(), sr = new E3(), ss = new V3();
    var Rr = av.renderer, orig = Rr.render.bind(Rr);
    Rr.render = function (scene, camera) {
      var m = av.importedModel;
      if (!m || !m.visible || faceCapture() || houseBusy()) return orig(scene, camera);
      if (Math.abs(pose.pitch) + Math.abs(pose.roll) + Math.abs(pose.yaw) + Math.abs(pose.lift) + Math.abs(pose.scale - 1) < 1e-4) return orig(scene, camera);
      sp.copy(m.position); sr.copy(m.rotation); ss.copy(m.scale);
      e.set(pose.pitch, pose.yaw, pose.roll, 'YXZ'); q.setFromEuler(e);
      pv.set(0, pivotY, 0).multiply(m.scale).applyQuaternion(m.quaternion);
      tv.set(0, pivotY, 0).multiply(m.scale).applyQuaternion(q).applyQuaternion(m.quaternion);
      m.quaternion.multiply(q); m.position.add(pv).sub(tv);
      m.position.y += pose.lift * m.scale.y;
      m.scale.multiplyScalar(pose.scale);
      m.updateMatrixWorld(true);
      var out = orig(scene, camera);
      m.position.copy(sp); m.rotation.copy(sr); m.scale.copy(ss); m.updateMatrixWorld(true);
      return out;
    };
  }

  // ---- main loop ---------------------------------------------------------------------------------
  var last = 0, scanPh = 0, dart = { x: 0, y: 0, next: 0 }, gaze = { x: 0, y: 0 };
  function loop(now) {
    requestAnimationFrame(loop);
    var dt = last ? Math.min(.05, (now - last) / 1000) : 1 / 60; last = now;
    hookEyes(); hookRender();
    if (current && now > until) { current = null; userHold = false; syncUI(); }
    // weights
    var k = 1 - Math.exp(-dt * 2.6), best = null, bw = 0;
    NAMES.forEach(function (n) { w[n] += ((n === current ? 1 : 0) - w[n]) * k; if (w[n] > bw) { bw = w[n]; best = n; } });
    var newDom = bw > .5 ? best : null;
    if (newDom !== dominant) { dominant = newDom; applyPresets(); }
    // blended posture + lid + gaze
    var t = now / 1000, P = { pitch: 0, roll: 0, yaw: 0, lift: 0, scale: 1 }, lid = 0, gx = 0, gy = 0;
    scanPh += dt;
    NAMES.forEach(function (n) {
      var a = w[n]; if (a < .002) return;
      var b = DEF[n].body;
      P.pitch += a * b.pitch; P.roll += a * (b.roll + b.wig * Math.sin(t * Math.PI * 2 * b.wigHz)); P.yaw += a * b.yaw * Math.sin(t * Math.PI * 2 * b.wigHz * .5 + 1);
      P.lift += a * (b.lift + b.bob * Math.sin(t * Math.PI * 2 * b.bobHz)); P.scale += a * (b.scale - 1);
      lid += a * DEF[n].lid;
      var g = DEF[n].gaze;
      if (g === 'scan') { gx += a * .32 * Math.sin(scanPh * .9); gy += a * -.05; }
      else if (g === 'dart') { if (now > dart.next) { dart.x = R(-.4, .4); dart.y = R(-.25, .15); dart.next = now + R(500, 1300); } gx += a * dart.x; gy += a * dart.y; }
      else { gx += a * g[0]; gy += a * g[1]; }
    });
    // attention: a moving mouse or a tap draws the eyes (and a little of the head) to it
    var attnTarget = (now - pointer.at < 1500 || now - pointer.tapAt < 2200) ? 1 : 0;
    attn += (attnTarget - attn) * (1 - Math.exp(-dt * (attnTarget ? 6 : 2)));
    var head = { yaw: 0, pitch: 0 };
    if (attn > .01) {
      var c = octoScreen();
      if (c) {
        var vx = pointer.x - c.x, vy = pointer.y - c.y;
        var ax = clamp(vx / 220, -1, 1) * .42, ay = clamp(vy / 220, -1, 1) * .34;
        gx = gx * (1 - attn) + ax * attn; gy = gy * (1 - attn) + ay * attn;
        head.yaw = clamp(vx / 650, -1, 1) * .32 * attn; head.pitch = clamp(vy / 650, -1, 1) * .18 * attn;
      }
    }
    pose.pitch += (P.pitch + head.pitch - pose.pitch) * Math.min(1, dt * 5);
    pose.roll += (P.roll - pose.roll) * Math.min(1, dt * 5);
    pose.yaw += (P.yaw + head.yaw - pose.yaw) * Math.min(1, dt * 5);
    pose.lift += (P.lift - pose.lift) * Math.min(1, dt * 5);
    pose.scale += (P.scale - pose.scale) * Math.min(1, dt * 5);
    // gaze + resting lids (face capture owns both while it runs)
    if (!faceCapture()) {
      gaze.x += (gx - gaze.x) * Math.min(1, dt * 7); gaze.y += (gy - gaze.y) * Math.min(1, dt * 7);
      var eyes = E(); if (eyes && eyes.setLive) eyes.setLive({ dx: gaze.x, dy: gaze.y });
      var l = L(); if (l && l.setBase) l.setBase(lid);
    }
    // a little flourish now and then while an expression is showing (never over speech)
    if (dominant && !talking && now > nextAct && !faceCapture() && !houseBusy()) {
      var ev = DEF[dominant].every; nextAct = now + R(ev[0], ev[1]) * 1000;
      if (DEF[dominant].act) DEF[dominant].act();
    }
  }
  // the pet or the user speaking: voice owns the mouth (mouth-v1 already ranks lip sync first);
  // flourishes wait until it is quiet again
  window.addEventListener('message', function (e) { var d = e.data; if (d && d.type === 'minest-voice-state' && d.kind === 'state') talking = d.state === 'speaking' || d.state === 'listening'; });

  // ---- small picker in the avatar control panel ---------------------------------------------------
  var section = null;
  function syncUI() {
    if (!section) return;
    section.querySelectorAll('button[data-expr]').forEach(function (b) { b.dataset.active = String(b.dataset.expr === (current || 'none')); });
  }
  function addUI() {
    var panel = document.querySelector('.avatar-control-panel');
    if (!panel || panel.querySelector('[data-expr-section]')) return;
    section = document.createElement('div'); section.dataset.exprSection = 'true'; section.setAttribute('data-v6-eye-section', 'true');
    var title = document.createElement('span'); title.textContent = 'Expression'; section.appendChild(title);
    var row = document.createElement('div'); row.setAttribute('data-v6-eye-row', 'expr');
    NAMES.concat(['none']).forEach(function (n) {
      var b = document.createElement('button'); b.type = 'button'; b.dataset.expr = n; b.textContent = n === 'none' ? 'Neutral' : LABELS[n];
      b.addEventListener('click', function (ev) { ev.preventDefault(); ev.stopPropagation(); set(n === 'none' ? null : n, null, n !== 'none'); applyPresets(true); });
      row.appendChild(b);
    });
    section.appendChild(row); panel.appendChild(section); syncUI();
  }
  new MutationObserver(addUI).observe(document.documentElement, { childList: true, subtree: true });

  window.__octoExpression = {
    set: function (name, holdMs) { var ok = set(name, holdMs, true); applyPresets(true); return ok; },
    clear: function () { set(null, 0, true); userHold = false; applyPresets(true); },
    get current() { return current; }, get dominant() { return dominant; }, get weights() { return Object.assign({}, w); },
    get pose() { return Object.assign({}, pose); }, names: NAMES.slice(),
    // 44.1: Care and other features direct the octopus's attention (eyes + head) to a screen point
    attend: function (x, y) { pointer.x = x; pointer.y = y; pointer.at = performance.now(); },
    octo: function () { return octoScreen(); }
  };
  requestAnimationFrame(loop);
})();
