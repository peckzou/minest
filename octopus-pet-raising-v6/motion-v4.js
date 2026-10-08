/* Pet Raising — Motion v4 (43.9) = Motion v3 + eyelid acting (lids-v1.js clips): smiling eyes when it
   giggles, heavy sleepy lids on drifts, eyes squeezed shut at the top of a yawn, wide eyes on a gasp,
   a wink with the smirk, a dizzy flutter after big spins, a slow "love" blink, shy lowered lids — and,
   like an animator would, a quick blink just before every spin or quick turn.
   Pet Raising — Motion v3 (43.6) = Motion v2 + choreographed mouth acting (mouth-v1.js clips):
   every swim step, gesture and spin can carry a mouth clip — wheee on dashes and spins, yawns on drifts
   and stretches, real bubbles puffed from the mouth on hovers and deep breaths, giggles on rolls and
   bounces, gasps on brakes and double-takes, humming on glides — timed to the movement. Talking
   (lip sync) always wins over a clip. Motion v2 notes follow.
   Pet Raising — Motion v2 (43.6).
   Choreographs the existing action library into a livelier octopus:
   - Swim playlist: instead of cycling swim_loop → swim_fast → swim_short, free swim draws from the whole
     reference-motion library (glide, dash, S-curve, roll, zigzag, drift, hover, pulse, brake …) and mixes in
     gestures (peek, tentacle fan, tip waves, bounces, stretches) WITHOUT stopping the swim path.
     Each step also sets the swim pace (dash / glide / hover) and an eye expression.
   - Spins (自转): pirouette, barrel roll, corkscrew, loop-de-loop and wiggle turns, pivoting around the
     body centre; while swimming the octopus also turns toward where it is going and banks into curves.
   - Eyes: each step sets an expression on the catchlights (v6-eye-control.js: happy, excited, curious,
     sleepy, sad, surprised, shy, dizzy, love), and after a big spin the catchlights swirl (dizzy).
   External actions (UI buttons, the ocean world's reactions) win: choreography pauses while they play. */
(function () {
  'use strict';
  if (window.__motionV2 || window.__motionV3 || window.__motionV4) return;

  var params = new URLSearchParams(location.search);
  if (params.get('motion') === 'static' || params.get('motion-v2') === '0' || params.get('motion-v3') === '0' || params.get('motion-v4') === '0') return;

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function R(a, b) { return a + (b - a) * Math.random(); }
  function pick(list) {
    var total = 0, i;
    for (i = 0; i < list.length; i++) total += list[i].w || 1;
    var r = Math.random() * total;
    for (i = 0; i < list.length; i++) { r -= list[i].w || 1; if (r <= 0) return list[i]; }
    return list[list.length - 1];
  }
  function ease(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function easeOutBack(t) { var c = 1.4; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); }
  function eyes() { return window.__v6EyeHighlight || null; }
  function expression(name, ms, opts) { var e = eyes(); if (e && e.setExpression) e.setExpression(name, ms, opts); }

  // ---------------------------------------------------------------------------------------------------
  // Choreography: swim steps (pace = swim-path speed multiplier) and in-swim gestures
  // ---------------------------------------------------------------------------------------------------
  var SWIM = [
    { id: 'swim_loop', dur: 2.4, pace: 1, w: 4 },
    { id: 'swim_glide', dur: 2.8, pace: .75, w: 3, expr: 'happy', spin: { p: .25, kinds: ['pirouette'] } },
    { id: 'swim_s_curve', dur: 2.8, pace: 1.05, w: 3, spin: { p: .3, kinds: ['wiggle'] } },
    { id: 'swim_fast', dur: 1.6, pace: 1.5, w: 2, expr: 'excited', spin: { p: .35, kinds: ['corkscrew', 'barrel'] } },
    { id: 'swim_dash', dur: 2.8, pace: 1.85, w: 2, expr: 'excited', spin: { p: .55, kinds: ['corkscrew', 'barrel'] } },
    { id: 'swim_roll', dur: 2.8, pace: 1.1, w: 2, expr: 'happy', spin: { p: .9, kinds: ['barrel'] } },
    { id: 'swim_zigzag', dur: 2.8, pace: 1.2, w: 2, expr: 'curious', spin: { p: .6, kinds: ['wiggle'] } },
    { id: 'swim_pulse', dur: 2.8, pace: 1.15, w: 2 },
    { id: 'swim_drift', dur: 2.8, pace: .55, w: 2, expr: 'sleepy', exprMs: 2600 },
    { id: 'swim_hover', dur: 2.8, pace: .25, w: 1.5, expr: 'curious' },
    { id: 'swim_short', dur: 3.2, pace: .9, w: 2 },
    { id: 'swim_backstroke', dur: 2.8, pace: .7, w: 1, expr: 'happy', spin: { p: .4, kinds: ['loop'] } },
    { id: 'swim_brake', dur: 2.8, pace: .35, w: 1, expr: 'surprised', exprMs: 1400 }
  ];
  var GESTURES = [
    { id: 'peek_around', dur: 2.8, pace: .3, w: 2, expr: 'curious', look: true },
    { id: 'double_take', dur: 2.8, pace: .25, w: 1, expr: 'surprised', exprMs: 1800 },
    { id: 'tentacle_fan', dur: 2.8, pace: .4, w: 1.5, expr: 'happy', spin: { p: .5, kinds: ['pirouette'] } },
    { id: 'tip_wave_left', dur: 2.8, pace: .35, w: 1, expr: 'happy' },
    { id: 'tip_wave_right', dur: 2.8, pace: .35, w: 1, expr: 'happy' },
    { id: 'tip_circle', dur: 2.8, pace: .4, w: 1, expr: 'curious' },
    { id: 'big_bounce', dur: 2.8, pace: .45, w: 1.5, expr: 'excited', spin: { p: .7, kinds: ['pirouette', 'loop'] } },
    { id: 'tiny_bounce', dur: 2.8, pace: .5, w: 1.5, expr: 'happy' },
    { id: 'shiver', dur: 2.8, pace: .3, w: .6, expr: 'surprised', exprMs: 1500 },
    { id: 'stretch_release', dur: 2.8, pace: .3, w: 1, expr: 'sleepy', exprMs: 2200 },
    { id: 'breath_deep', dur: 2.8, pace: .3, w: 1, expr: 'sleepy', exprMs: 2400 },
    { id: 'tentacle_fold', dur: 2.8, pace: .3, w: .8, expr: 'shy', exprMs: 2400 },
    { id: 'radial_open', dur: 2.8, pace: .4, w: 1, expr: 'love', spin: { p: .45, kinds: ['pirouette'] } },
    { id: 'settle_proud', dur: 2.8, pace: .35, w: 1, expr: 'happy' },
    { id: 'listen_cock', dur: 2.8, pace: .3, w: .8, expr: 'curious', look: true },
    { id: 'quick_turn', dur: 2.8, pace: .6, w: 1, expr: 'surprised', exprMs: 1000, spin: { p: .6, kinds: ['wiggle'] } }
  ];
  // mouth acting per step: [clip, probability, delay s (relative to the step start)]
  var MOUTH = {
    swim_loop: ['hum', .2, .6], swim_glide: ['hum', .45, .5], swim_s_curve: ['giggle', .25, .9], swim_fast: ['wheee', .55, .2],
    swim_dash: ['wheee', .75, .25], swim_roll: ['giggle', .6, .5], swim_zigzag: ['ooh', .5, .4], swim_pulse: ['munch', .2, .6],
    swim_drift: ['yawn', .45, .4], swim_hover: ['puff', .6, .5], swim_short: ['hum', .25, .5], swim_backstroke: ['hum', .5, .4],
    swim_brake: ['gasp', .8, .15],
    peek_around: ['ooh', .7, .5], double_take: ['gasp', .9, .55], tentacle_fan: ['giggle', .55, .6], tip_wave_left: ['giggle', .5, .7],
    tip_wave_right: ['giggle', .5, .7], tip_circle: ['ooh', .5, .5], big_bounce: ['wheee', .7, .35], tiny_bounce: ['giggle', .7, .3],
    shiver: ['chatter', .9, .2], stretch_release: ['yawn', .85, .3], breath_deep: ['puff', .75, .9], tentacle_fold: ['smirk', .8, .3],
    radial_open: ['wheee', .5, .5], settle_proud: ['smirk', .7, .4], listen_cock: ['ooh', .45, .6], quick_turn: ['gasp', .7, .1]
  };
  function mouth() { return window.__octoMouth || null; }
  function lids() { return window.__octoLids || null; }
  function eyesAct(clipName, delaySec) { var l = lids(); if (l && l.play) l.play(clipName, (delaySec || 0) * 1000); }
  // the eyes that go with each mouth clip ([lid clip, probability])
  var EYES_FOR = { giggle: ['happy', .85], wheee: ['happy', .5], yawn: ['yawn', 1], puff: ['puff', .8], hum: ['sleepy', .35],
    gasp: ['gasp', 1], ooh: ['focus', .5], munch: ['happy', .4], smirk: ['wink', .6], pout: ['pout', .8], chatter: ['blinkDouble', .7] };
  function act(clipName, delaySec) {
    var m = mouth(); if (m && m.play) m.play(clipName, (delaySec || 0) * 1000);
    var e = EYES_FOR[clipName];
    if (e && Math.random() < e[1]) eyesAct(e[0], (delaySec || 0) + (clipName === 'yawn' ? .1 : 0));
  }
  // steps whose eyes act on their own (no mouth clip needed)
  var EYES_STEP = { swim_drift: ['sleepy', .6, .3], radial_open: ['love', .6, .6], tentacle_fold: ['shy', .9, .2], breath_deep: ['squeeze', .5, 1.2],
    stretch_release: ['squeeze', .5, .9], settle_proud: ['happy', .6, .4], listen_cock: ['focus', .7, .3], peek_around: ['focus', .4, .2], swim_glide: ['happy', .3, .8] };
  var lastPuffAt = 0;

  // little phrases: a gesture is usually followed by a swim burst (feels intentional, not random)
  function nextStep(prev) {
    var gesture = !prev || prev.kind === 'swim' ? Math.random() < .3 : Math.random() < .12;
    var s = Object.assign({}, gesture ? pick(GESTURES) : pick(SWIM));
    if (prev && s.id === prev.id && Math.random() < .7) return nextStep(prev);
    s.kind = gesture ? 'gesture' : 'swim';
    if (prev && prev.kind === 'gesture' && !gesture && Math.random() < .5) { s = Object.assign({}, SWIM[4]); s.kind = 'swim'; }   // dash away after a gesture
    return s;
  }

  // ---------------------------------------------------------------------------------------------------
  // Spins (pivot = body centre). Each returns extra Euler angles for normalised time u ∈ [0,1].
  // ---------------------------------------------------------------------------------------------------
  var TAU = Math.PI * 2;
  var SPINS = {
    pirouette: { dur: 1.35, expr: 'happy', f: function (u) { return { y: TAU * easeOutBack(Math.min(1, u * 1.02)), x: 0, z: .12 * Math.sin(u * Math.PI) }; } },
    barrel: { dur: 1.5, expr: 'excited', dizzy: true, f: function (u) { return { y: 0, x: 0, z: -TAU * ease(u) * spinDir }; } },
    corkscrew: { dur: 1.7, expr: 'excited', dizzy: true, f: function (u) { var e = ease(u); return { y: TAU * e * spinDir, x: 0, z: -TAU * e * spinDir }; } },
    loop: { dur: 1.6, expr: 'excited', dizzy: true, f: function (u) { return { y: 0, x: -TAU * ease(u), z: 0 }; } },
    wiggle: { dur: 1.1, expr: 'curious', f: function (u) { return { y: .7 * Math.sin(u * TAU * 1.5) * (1 - u) * spinDir, x: 0, z: .18 * Math.sin(u * TAU * 1.5) * (1 - u) }; } }
  };
  var spin = null, spinDir = 1, lastSpinAt = 0;
  function startSpin(kind) {
    var S = SPINS[kind];
    if (!S || spin) return false;
    spinDir = facing >= 0 ? 1 : -1;
    eyesAct(kind === 'wiggle' ? 'blink' : 'squeeze');
    spin = { kind: kind, t: 0, dur: S.dur, S: S };
    lastSpinAt = now();
    expression(S.expr, S.dur * 1000 + 300);
    var mm = mouth(); if (mm && mm.play) mm.play(kind === 'wiggle' ? 'ooh' : 'wheee', 50);   // mouth only: the eyes do the anticipation blink
    return true;
  }
  function now() { return performance.now() * .001; }

  // ---------------------------------------------------------------------------------------------------
  // Hooking the avatar
  // ---------------------------------------------------------------------------------------------------
  var av = null, cur = null, pace = 1, paceT = 1, ours = false, lastX = null, facing = 1, yawFace = 0, bank = 0, pitchLean = 0;
  var Q = null, V3 = null, E3 = null, qBase, qSpin, eul, pivot, tmpV, savedPos, savedQuat, savedRot, pivotY = .62;

  function install(a) {
    av = a;
    var model = av.importedModel;
    if (!model) return false;
    Q = model.quaternion.constructor; V3 = model.position.constructor; E3 = model.rotation.constructor;
    qBase = new Q(); qSpin = new Q(); eul = new E3(); pivot = new V3(); tmpV = new V3(); savedPos = new V3(); savedQuat = new Q(); savedRot = new E3();
    // body centre height (model space) from the skinned mesh bounds
    model.traverse(function (n) {
      if (n.isSkinnedMesh && n.geometry) { n.geometry.computeBoundingBox && n.geometry.computeBoundingBox(); var bb = n.geometry.boundingBox; if (bb) pivotY = (bb.min.y + bb.max.y) * .55; }
    });

    // 1) choreographed playlist replaces the fixed aquarium clip cycle
    var origClip = av.updateAquariumClip.bind(av);
    av.updateAquariumClip = function (dt) {
      if (!enabled || !av.referenceMotion) return origClip(dt);
      if (!cur) begin(nextStep(null));
      av.freeSwimClipElapsed += dt;
      if (av.freeSwimClipElapsed >= cur.dur) { av.freeSwimClipElapsed = 0; begin(nextStep(cur)); }
    };
    function begin(step) {
      cur = step;
      ours = true; av.referenceMotion.play(step.id); ours = false;
      paceT = step.pace;
      if (step.expr) expression(step.expr, step.exprMs || step.dur * 1000);
      var es = EYES_STEP[step.id];
      if (es && Math.random() < es[1]) eyesAct(es[0], es[2]);
      var mo = MOUTH[step.id];
      if (mo && Math.random() < mo[1]) { act(mo[0], mo[2]); if (mo[0] === 'puff') lastPuffAt = now(); }
      else if (now() - lastPuffAt > R(16, 26) && step.pace < 1.2) { act('puff', .4); lastPuffAt = now(); }   // the odd idle bubble
      if (eyes() && eyes().setLook) eyes().setLook(0);
      if (step.spin && Math.random() < step.spin.p && now() - lastSpinAt > 4) {
        var kinds = step.spin.kinds;
        setTimeout(function () { if (av.freeSwimActive) startSpin(kinds[Math.floor(Math.random() * kinds.length)]); }, R(250, 900));
      }
    }

    // 2) swim pace, facing the travel direction, banking into turns
    var origSwim = av.updateFreeSwim.bind(av);
    av.updateFreeSwim = function (dt) {
      if (!enabled) return origSwim(dt);
      pace += (paceT - pace) * Math.min(1, dt * 1.8);
      origSwim(dt * pace);
      var m = av.importedModel;
      if (!m || !av.freeSwimActive) return;
      var x = m.position.x;
      if (lastX != null && dt > 0) {
        var vx = (x - lastX) / dt;
        if (Math.abs(vx) > .04) facing = vx > 0 ? 1 : -1;
        yawFace += (clamp(vx * .9, -.55, .55) - yawFace) * Math.min(1, dt * 2.2);
        bank += (clamp(-vx * .35, -.22, .22) - bank) * Math.min(1, dt * 2.5);
        var vy = m.position.y - (m.__v2LastY == null ? m.position.y : m.__v2LastY);
        pitchLean += (clamp(-vy / Math.max(dt, .001) * .5, -.25, .25) - pitchLean) * Math.min(1, dt * 2);
      }
      lastX = x; m.__v2LastY = m.position.y;
      m.rotation.y += yawFace; m.rotation.z += bank; m.rotation.x += pitchLean;
      // curious steps: let the catchlights lean toward the travel direction
      if (cur && cur.look && eyes() && eyes().setLook) eyes().setLook(clamp(yawFace * 1.6, -1, 1));
    };

    // 3) external actions pause the choreography
    ['playAnimation', 'playReferenceMotion', 'playAction'].forEach(function (name) {
      var orig = av[name] && av[name].bind(av);
      if (!orig) return;
      av[name] = function (id) {
        if (!ours && !(name === 'playAction' && (id === 'free_swim_aquarium'))) {
          if (spin) spin = null;
          reactTo(String(id || ''));
        }
        if (name === 'playAction' && id === 'free_swim_aquarium') cur = null;
        return orig.apply(av, arguments);
      };
    });

    // 4) spins are applied just for the frame being drawn (then removed), so they work in every state
    var R3 = av.renderer, origRender = R3.render.bind(R3);
    R3.render = function (scene, camera) {
      var m = av.importedModel;
      if (!m || !spin || !enabled) return origRender(scene, camera);
      var dt = Math.min(.05, (performance.now() - (spin.last || performance.now())) / 1000);
      spin.last = performance.now(); spin.t += dt;
      var u = clamp(spin.t / spin.dur, 0, 1), a = spin.S.f(u);
      savedPos.copy(m.position); savedRot.copy(m.rotation);
      // rotate about the body centre: p' = p + q·c − q·s·c  (c = pivot in model space, scaled)
      qBase.copy(m.quaternion);
      eul.set(a.x, a.y, a.z, 'YXZ'); qSpin.setFromEuler(eul);
      pivot.set(0, pivotY, 0).multiply(m.scale).applyQuaternion(qBase);
      tmpV.set(0, pivotY, 0).multiply(m.scale).applyQuaternion(qSpin).applyQuaternion(qBase);
      m.quaternion.multiply(qSpin);
      m.position.add(pivot).sub(tmpV);
      m.updateMatrixWorld(true);
      var out = origRender(scene, camera);
      m.position.copy(savedPos); m.rotation.copy(savedRot); m.updateMatrixWorld(true);
      if (u >= 1) {
        var S = spin.S; spin = null;
        if (S.dizzy && Math.random() < .7) { expression('dizzy', 1400); eyesAct('dizzy', .05); }
        else if (Math.random() < .5) act('giggle', .1);
      }
      return out;
    };
    return true;
  }

  // expressions for actions started by the UI / ocean world
  function reactTo(id) {
    var map = { happy: 'happy', excited: 'excited', bond_high: 'love', care_happy: 'love', petted: 'love', greet: 'happy', wave: 'happy',
      curious: 'curious', look: 'curious', peek_around: 'curious', inspect_tentacle: 'curious', attentive: 'curious', listening: 'curious', thinking: 'curious', confused: 'surprised',
      sad: 'sad', low_energy: 'sad', sleepy: 'sleepy', sleep: 'sleepy', breathing: 'sleepy', wake: 'surprised', poke: 'surprised', bounce: 'happy', nod: 'happy' };
    var key = id.replace(/^p0:/, '');
    if (map[key]) expression(map[key], key === 'sleep' || key === 'sleepy' ? 6000 : 2600);
    var mouthFor = { happy: 'giggle', excited: 'wheee', petted: 'giggle', care_happy: 'smirk', bond_high: 'smirk', greet: 'giggle', wave: 'giggle',
      curious: 'ooh', look: 'ooh', peek_around: 'ooh', confused: 'ooh', poke: 'gasp', wake: 'yawn', sleepy: 'yawn', sad: 'pout', low_energy: 'pout', bounce: 'giggle' };
    if (mouthFor[key]) act(mouthFor[key], .25);
    var eyesFor = { petted: 'love', care_happy: 'love', bond_high: 'love', sleepy: 'sleepy', sleep: 'sleepy', wake: 'blinkDouble', poke: 'squeeze', curious: 'focus', thinking: 'focus' };
    if (eyesFor[key]) eyesAct(eyesFor[key], .2);
    if ((key === 'happy' || key === 'excited' || key === 'bond_high') && !spin && now() - lastSpinAt > 3) setTimeout(function () { startSpin(key === 'excited' ? 'loop' : 'pirouette'); }, 500);
  }

  // tapping the octopus: a surprised twirl now and then
  window.addEventListener('ocean-world-event', function (e) {
    var t = e.detail && e.detail.type;
    if (t === 'USER_TAPPED_PET' && !spin && Math.random() < .5) setTimeout(function () { startSpin(Math.random() < .5 ? 'pirouette' : 'wiggle'); }, 350);
    if (t === 'REWARD_EVENT_RECEIVED') setTimeout(function () { startSpin('pirouette'); }, 400);
  });

  var enabled = true;
  (function wait(n) {
    var a = window.__octopusAvatar;
    if (a && a.importedModel && a.renderer && a.updateAquariumClip && install(a)) {
      window.__motionV4 = window.__motionV3 = window.__motionV2 = {
        version: 4, act: act, eyes: eyesAct,
        spin: function (k) { return startSpin(k); }, spins: Object.keys(SPINS),
        expression: expression, current: function () { return cur && cur.id; },
        setEnabled: function (v) { enabled = !!v; if (!enabled) spin = null; }, get enabled() { return enabled; }
      };
      return;
    }
    if (n < 400) setTimeout(function () { wait(n + 1); }, 100);
  })(0);
})();
