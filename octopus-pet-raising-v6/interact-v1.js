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
  // tap = quick press without much movement, on open water (not UI, not the octopus, not the house)
  var down = null;
  window.addEventListener('pointerdown', function (e) {
    var t = e.target;
    if (t && t.closest && t.closest('button, input, a, [role="dialog"], .avatar-control-panel, .wd-sheet, .oc2-dock, .oc2-layer, .oc2-tray, .oc2-thought, .oc2-handle, #octo-cc-panel, #voice43-backdrop')) { down = null; return; }
    down = { x: e.clientX, y: e.clientY, t: performance.now() };
  }, true);
  window.addEventListener('pointerup', function (e) {
    if (!down) return;
    var d = down; down = null;
    if (performance.now() - d.t > 350 || Math.hypot(e.clientX - d.x, e.clientY - d.y) > 12 || blocked()) return;
    var c = X() && X().octo ? X().octo() : null;
    if (c && Math.hypot(e.clientX - c.x, e.clientY - c.y) < c.r) return;                 // that's petting
    var H = window.__octoHouse;
    if (H && H.rect) {
      var st = document.querySelector('.avatar-stage'), sr = st && st.getBoundingClientRect(), hr = H.rect;
      if (sr && Math.abs(e.clientX - sr.left - hr.x) < hr.s * .6 && e.clientY - sr.top > hr.y - hr.s * 1.1 && e.clientY - sr.top < hr.y + hr.s * .1) return;
    }
    goTo(e.clientX, e.clientY);
  }, true);

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
