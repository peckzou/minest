/* Pet Raising — the octopus and its world (44.2)
   1) Tap-to-swim: tap open water and it swims there (facing and banking into the move), hovers and
      looks around, then keeps free-swimming around that spot — drifting slowly back to the middle.
   2) Interactions: it tells the ocean where it is every frame (fish scatter, the puffer puffs up,
      clownfish dart into their anemone, the anemone flinches, the crab waves, kelp and grass part,
      sand puffs up near the floor), and it reacts to what is near it: watches fish playfully, gets a
      little zap from a jellyfish, waves back at the crab, smiles at the turtle, giggles at the puffer. */
(function () {
  'use strict';
  if (window.__octoWorld) return;
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function R(a, b) { return a + (b - a) * Math.random(); }
  function ease(t) { return t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
  function A() { return window.__octopusAvatar; }
  function X() { return window.__octoExpression; }
  function eyes(n, ms) { var e = window.__v6EyeHighlight; if (e && e.setExpression) e.setExpression(n, ms || 2200); }
  function mouth(c) { var m = window.__octoMouth; if (m && m.play) m.play(c, 60); }
  function lids(c) { var l = window.__octoLids; if (l && l.play) l.play(c, 40); }
  function ref(id) { var av = A(); try { if (av && av.referenceMotion) av.referenceMotion.play(id); } catch (e) {} }
  function blocked() {
    var H = window.__octoHouse, C = window.__octoCopyCat;
    return (H && H.state && H.state !== 'roam') || (C && C.on) || document.documentElement.classList.contains('oc2-active');
  }

  // ---------------------------------------------------------------------------------------------
  // 1) tap to swim
  // ---------------------------------------------------------------------------------------------
  var V3 = null, pivotY = .62, homeBase = null, swim = null, self = false;
  // free swim offsets at phase 0 (aquarium variant) — the model sits at base + these when it resumes
  var O0 = { x: .18 * Math.sin(.25), y: .2 * Math.sin(.55) + .08, z: .48 * Math.sin(1.05) };
  function centerWorld() { var m = A().importedModel; return m.localToWorld(new V3(0, pivotY, 0)); }
  function screenToWorld(cx, cy, depthZ) {
    var av = A(), cam = av.camera, r = av.renderer.domElement.getBoundingClientRect();
    var p = new V3((cx - r.left) / r.width * 2 - 1, -((cy - r.top) / r.height * 2 - 1), .5).unproject(cam), o = new V3().setFromMatrixPosition(cam.matrixWorld);
    var dir = p.sub(o).normalize(), t = (depthZ - o.z) / (dir.z || -1e-6);
    return o.addScaledVector(dir, t);
  }
  function setCenter(world) {
    var m = A().importedModel, local = m.parent.worldToLocal(world.clone());
    m.position.set(local.x, local.y - pivotY * m.scale.y, local.z);
  }
  function goTo(cx, cy) {
    var av = A(); if (!av || !av.importedModel || !av.camera) return false;
    if (!V3) V3 = av.importedModel.position.constructor;
    if (!homeBase) homeBase = av.importedModelBasePosition.clone();
    var c = X() && X().octo ? X().octo() : null, rad = c ? c.r : 60;
    var stage = document.querySelector('.avatar-stage'), sr = stage ? stage.getBoundingClientRect() : { left: 0, top: 0, right: innerWidth, bottom: innerHeight };
    cx = clamp(cx, sr.left + rad * 1.05, sr.right - rad * 1.05); cy = clamp(cy, sr.top + rad * 1.2, sr.bottom - rad * 1.15);
    var from = centerWorld(), to = screenToWorld(cx, cy, from.z);
    var dist = from.distanceTo(to);
    if (dist < .05) return false;
    av.freeSwimActive = false;
    var mo = window.__motionV4 || window.__motionV3; if (mo && mo.setEnabled) mo.setEnabled(false);
    ref(dist > .9 ? 'swim_fast' : 'swim_glide');
    eyes(dist > .9 ? 'excited' : 'curious', 2500);
    if (dist > 1.2 && Math.random() < .5) mouth('wheee');
    swim = { from: from, to: to, t: 0, dur: clamp(dist * 1.25, .9, 3.2), dir: Math.sign(to.x - from.x) || 1, linger: 0 };
    return true;
  }
  function swimStep(dt) {
    var av = A(), m = av.importedModel;
    if (swim.follow && !swim.arrived) { followStep(dt); return; }
    if (!swim.arrived) {
      swim.t += dt;
      var u = clamp(swim.t / swim.dur, 0, 1), e = ease(u);
      var p = swim.from.clone().lerp(swim.to, e); p.y += Math.sin(u * Math.PI * 2) * .03 * (1 - u);
      setCenter(p);
      var turn = Math.sin(u * Math.PI);
      m.rotation.set(av.importedModelBaseRotation.x + (swim.to.y - swim.from.y < 0 ? .12 : -.1) * turn,
        av.importedModelBaseRotation.y + swim.dir * .55 * turn, -swim.dir * .18 * turn);
      if (u >= 1) {
        swim.arrived = true; swim.linger = R(2.2, 3.4);
        ref('swim_hover'); eyes('curious', 3000); lids('focus');
        var c = X() && X().octo ? X().octo() : null;
        if (c) { swim.looks = [[c.x + R(-140, -60), c.y + R(-40, 40)], [c.x + R(60, 140), c.y + R(-40, 40)]]; }
      }
      return;
    }
    // hover and look around, then resume free swim around this spot
    swim.linger -= dt;
    if (swim.looks && X() && X().attend) { var k = swim.linger > 1.4 ? 0 : 1; X().attend(swim.looks[k][0], swim.looks[k][1]); }
    if (swim.linger <= 0) {
      var local = m.position.clone();
      av.importedModelBasePosition.set(local.x - O0.x, local.y - O0.y, local.z - O0.z);
      m.rotation.copy(av.importedModelBaseRotation);
      swim = null;
      self = true; try { av.playAction('free_swim_aquarium'); } finally { self = false; }
      var mo = window.__motionV4 || window.__motionV3; if (mo && mo.setEnabled) mo.setEnabled(true);
    }
  }
  // 44.5: press and drag on open water to LURE the octopus — a glowing lure follows your finger and it
  // swims after it (a tap no longer sends it off; taps poke things instead, see ocean-life-v3)
  var lureEl = null, drag = null;
  function lureDot(x, y, on) {
    if (!lureEl) {
      lureEl = document.createElement('div'); lureEl.className = 'octo-lure';
      var st = document.createElement('style');
      st.textContent = '.octo-lure{position:fixed;z-index:46;width:22px;height:22px;margin:-11px 0 0 -11px;border-radius:50%;pointer-events:none;opacity:0;transform:scale(.4);transition:opacity .25s,transform .25s;' +
        'background:radial-gradient(circle,#f4fffb 0%,#9ff5e0 35%,rgba(110,230,255,.35) 60%,rgba(110,230,255,0) 72%);box-shadow:0 0 22px 8px rgba(140,255,230,.45)}' +
        '.octo-lure.on{opacity:1;transform:scale(1);animation:octoLure 1.1s ease-in-out infinite}@keyframes octoLure{50%{box-shadow:0 0 30px 12px rgba(140,255,230,.6)}}';
      document.head.appendChild(st); document.body.appendChild(lureEl);
    }
    lureEl.style.left = x + 'px'; lureEl.style.top = y + 'px';
    lureEl.classList.toggle('on', !!on);
  }
  function openWater(t) {
    return !(t && t.closest && t.closest('button, input, a, [role="dialog"], .avatar-control-panel, .wd-sheet, .oc2-dock, .oc2-layer, .oc2-tray, .oc2-thought, .oc2-handle, #octo-cc-panel, #voice43-backdrop, .ui-voice, .ui-exit, .octo-chest-label'));
  }
  window.addEventListener('pointerdown', function (e) {
    if (!openWater(e.target) || blocked()) { drag = null; return; }
    var c = X() && X().octo ? X().octo() : null;
    if (c && Math.hypot(e.clientX - c.x, e.clientY - c.y) < c.r * .8) { drag = null; return; }   // that's petting
    drag = { x: e.clientX, y: e.clientY, luring: false, id: e.pointerId };
  }, true);
  window.addEventListener('pointermove', function (e) {
    if (!drag || e.pointerId !== drag.id) return;
    if (!drag.luring && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 14) { drag.luring = startLure(); }
    if (drag.luring) { lureDot(e.clientX, e.clientY, true); aimLure(e.clientX, e.clientY); }
  }, true);
  function endDrag(e) {
    if (!drag || (e && e.pointerId !== drag.id)) return;
    var was = drag.luring; drag = null;
    if (lureEl) lureEl.classList.remove('on');
    if (was && swim && swim.follow) { swim.arrived = true; swim.linger = R(1.6, 2.4); ref('swim_hover'); eyes('happy', 1600); }
  }
  window.addEventListener('pointerup', endDrag, true);
  window.addEventListener('pointercancel', endDrag, true);
  function startLure() {
    var av = A(); if (!av || !av.importedModel || !av.camera || blocked()) return false;
    if (!V3) V3 = av.importedModel.position.constructor;
    if (!homeBase) homeBase = av.importedModelBasePosition.clone();
    av.freeSwimActive = false;
    var mo = window.__motionV4 || window.__motionV3; if (mo && mo.setEnabled) mo.setEnabled(false);
    var from = centerWorld();
    swim = { follow: true, target: from.clone(), vel: new V3(0, 0, 0), z: from.z, dir: 1, linger: 0, gait: '' };
    eyes('excited', 2000); lids('focus');
    return true;
  }
  function aimLure(cx, cy) {
    if (!swim || !swim.follow) return;
    var c = X() && X().octo ? X().octo() : null, rad = c ? c.r : 60;
    var stage = document.querySelector('.avatar-stage'), sr = stage ? stage.getBoundingClientRect() : { left: 0, top: 0, right: innerWidth, bottom: innerHeight };
    // the octopus's centre trails a little below-behind the lure (it "nibbles" at it)
    var tx = clamp(cx, sr.left + rad * 1.05, sr.right - rad * 1.05), ty = clamp(cy + rad * .55, sr.top + rad * 1.2, sr.bottom - rad * 1.15);
    swim.target = screenToWorld(tx, ty, swim.z);
    swim.lureX = cx; swim.lureY = cy;
  }
  function followStep(dt) {
    var av = A(), m = av.importedModel, cur = centerWorld();
    var d = swim.target.clone().sub(cur);
    // a soft spring with drag: it accelerates after the lure and glides to a stop
    swim.vel.addScaledVector(d, 7 * dt).multiplyScalar(Math.max(0, 1 - 3.2 * dt));
    var sp = swim.vel.length(), max = 2.4; if (sp > max) { swim.vel.multiplyScalar(max / sp); sp = max; }
    cur.addScaledVector(swim.vel, dt); setCenter(cur);
    var vx = clamp(swim.vel.x / 1.6, -1, 1), vy = clamp(swim.vel.y / 1.6, -1, 1);
    if (Math.abs(vx) > .15) swim.dir = vx > 0 ? 1 : -1;
    var B = av.importedModelBaseRotation;
    m.rotation.set(B.x + (vy < 0 ? .14 : -.12) * Math.abs(vy) + .05 * Math.abs(vx), B.y + vx * .6, -vx * .22);
    var g = sp > 1.1 ? 'swim_fast' : sp > .35 ? 'swim_glide' : 'swim_hover';
    if (g !== swim.gait) { swim.gait = g; ref(g); }
    if (swim.lureX != null && X() && X().attend) X().attend(swim.lureX, swim.lureY);
    if (sp > 1.6 && Math.random() < dt * .5) mouth('wheee');
  }

  // ---------------------------------------------------------------------------------------------
  // 2) presence + reactions
  // ---------------------------------------------------------------------------------------------
  var cool = {}, lastNear = 0, last = 0;
  function react(now) {
    var c = X() && X().octo ? X().octo() : null, ol = window.__oceanLifeV3;
    if (!c || !ol || !ol.presence) return;
    ol.presence(c.x, c.y, c.r);
    if (blocked() || now - lastNear < 400) return;
    lastNear = now;
    var near = ol.near ? ol.near(c.x, c.y, c.r * 1.8) : [];
    for (var i = 0; i < near.length; i++) {
      var n = near[i], k = n.kind;
      if ((cool[k] || 0) > now) continue;
      if (k === 'jelly' && n.d < c.r * 1.05) { cool.jelly = now + 9000; zap(n); return; }
      if (k === 'crab') { cool.crab = now + 12000; X() && X().attend(n.x, n.y); ref(n.x < c.x ? 'tip_wave_left' : 'tip_wave_right'); eyes('happy', 2000); mouth('giggle'); return; }
      if (k === 'turtle') { cool.turtle = now + 15000; X() && X().attend(n.x, n.y); eyes('happy', 2500); lids('happy'); return; }
      if (k === 'puffer') { cool.puffer = now + 10000; X() && X().attend(n.x, n.y); eyes('surprised', 900); setTimeout(function () { mouth('giggle'); eyes('playful', 2000); }, 700); return; }
      if (k === 'fish' || k === 'school') { cool.fish = now + 7000; cool.school = now + 7000; X() && X().attend(n.x, n.y); eyes(Math.random() < .5 ? 'playful' : 'curious', 1800); if (Math.random() < .4) mouth('ooh'); return; }
      if (k === 'anemone') { cool.anemone = now + 12000; X() && X().attend(n.x, n.y); eyes('curious', 1800); return; }
    }
  }
  function zap(n) {
    eyes('surprised', 1600); lids('gasp'); mouth('gasp'); ref('shiver');
    var x2 = X(); if (x2 && x2.attend) x2.attend(n.x, n.y);
    for (var i = 0; i < 6; i++) fx('⚡', n.x + R(-20, 20), n.y + R(-20, 20));
    setTimeout(function () { eyes('dizzy', 1200); }, 900);
  }
  function fx(t, x, y) {
    var el = document.createElement('div'); el.textContent = t;
    el.style.cssText = 'position:fixed;z-index:48;pointer-events:none;font:18px/1 system-ui;left:' + x + 'px;top:' + y + 'px;transform:translate(-50%,-50%);transition:transform .7s ease-out,opacity .7s';
    document.body.appendChild(el);
    requestAnimationFrame(function () { el.style.transform = 'translate(' + R(-60, 40) + 'px,' + R(-60, -20) + 'px) scale(1.3)'; el.style.opacity = '0'; });
    setTimeout(function () { el.remove(); }, 760);
  }

  // guard: while it swims to your tap, the ocean world's own reactions must not grab it
  function guard() {
    var av = A(); if (!av || av.__swimGuard) return;
    av.__swimGuard = true;
    ['playAnimation', 'playAction'].forEach(function (name) {
      var orig = av[name]; if (typeof orig !== 'function') return;
      av[name] = function () { if (swim && !self) return false; return orig.apply(av, arguments); };
    });
  }

  // 44.5: you tapped something in the ocean — Octo looks at it and reacts to what it was
  var tapCool = 0;
  window.addEventListener('ocean-tap', function (e) {
    var d = e.detail || {}, now = performance.now();
    if (blocked() || now < tapCool) return;
    tapCool = now + 700;
    var x2 = X(); if (x2 && x2.attend) x2.attend(d.x, d.y);
    var k = d.kind;
    if (!k) { eyes('curious', 1200); if (Math.random() < .4) { var mo = window.__octoMouth; if (mo && mo.bubbles) mo.bubbles(3); } return; }
    if (k === 'puffer') { eyes('surprised', 800); setTimeout(function () { mouth('giggle'); eyes('playful', 1800); }, 600); }
    else if (k === 'crab') { ref(d.x < (x2 && x2.octo ? x2.octo().x : 0) ? 'tip_wave_left' : 'tip_wave_right'); eyes('happy', 1800); mouth('giggle'); }
    else if (k === 'hermit') { eyes('curious', 2000); mouth('ooh'); setTimeout(function () { lids('happy'); }, 1600); }
    else if (k === 'angler') { eyes('surprised', 1000); lids('gasp'); mouth('gasp'); setTimeout(function () { eyes('curious', 1800); }, 900); }
    else if (k === 'jelly') { eyes('curious', 1500); mouth('ooh'); }
    else if (k === 'turtle') { eyes('happy', 2200); lids('happy'); }
    else if (k === 'ray') { eyes('excited', 1500); mouth('wheee'); }
    else if (k === 'anemone') { eyes('curious', 1500); lids('blink'); }
    else { eyes(Math.random() < .5 ? 'playful' : 'excited', 1500); if (Math.random() < .5) mouth('giggle'); }
    var mb = window.__octoMouth; if (mb && mb.bubbles && Math.random() < .5) setTimeout(function () { mb.bubbles(2); }, 500);
  });

  function loop(now) {
    requestAnimationFrame(loop);
    var dt = last ? Math.min(.05, (now - last) / 1000) : 1 / 60; last = now;
    var av = A(); if (!av || !av.importedModel) return;
    if (!V3) { V3 = av.importedModel.position.constructor; av.importedModel.traverse(function (n) { if (n.isSkinnedMesh && n.geometry) { n.geometry.computeBoundingBox(); var bb = n.geometry.boundingBox; pivotY = (bb.min.y + bb.max.y) * .5; } }); }
    guard();
    if (swim) { if (blocked()) swim = null; else swimStep(dt); }
    else if (homeBase && av.freeSwimActive) {
      // drift the free-swim centre slowly back home
      var b = av.importedModelBasePosition, k = Math.min(1, dt * .04);
      b.x += (homeBase.x - b.x) * k; b.y += (homeBase.y - b.y) * k; b.z += (homeBase.z - b.z) * k;
    }
    react(now);
  }
  requestAnimationFrame(loop);
  window.__octoWorld = { goTo: goTo, get swimming() { return !!swim; } };
})();
