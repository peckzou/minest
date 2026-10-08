/* Pet Raising — Octo's House v1 (44.0).
   A coral-pebble cottage on the sea floor (pebble dome, scallop-shell roof, tube-coral chimney, brass
   porthole, arched wooden door). Playing uses up energy; when it runs out — or when you tap the house —
   the octopus yawns, swims home, shrinks into the doorway and goes inside to rest: the window glows,
   "Zzz" drifts from the chimney. Tap the house to wake it (or it wakes by itself): it peeks out of the
   door, blinks and stretches, then swims back out to play.
   The house is drawn on two canvases around the 3D octopus: the front (with a see-through doorway)
   above it, the dark interior below it — so the octopus really goes in through the door. */
(function () {
  'use strict';
  if (window.__octoHouse) return;
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function ease(t) { return t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
  function R(a, b) { return a + (b - a) * Math.random(); }
  var TAU = Math.PI * 2;

  var stage, back, front, bctx, fctx, W = 0, H = 0, DPR = 1, sprite = null;
  var house = { x: 0, y: 0, s: 150 };   // base centre (stage px) and width
  var state = 'roam', stateT = 0, energy = 1, restFor = 60, self = false;
  var particles = [], zzz = [], lastT = 0, label = null;
  var PLAY_SECONDS = 120;                // ~2 minutes of play empties the energy

  function A() { return window.__octopusAvatar; }
  function motion() { return window.__motionV4 || window.__motionV3 || window.__motionV2 || null; }

  // ---------------------------------------------------------------------------------------------------
  // drawing the cottage (static parts → sprite; door opening left transparent)
  // ---------------------------------------------------------------------------------------------------
  function geo(s) {
    var h1 = s * .22, ry = s * .46;
    return { h1: h1, ry: ry, dw: s * .3, dh: s * .4, win: { x: -s * .2, y: -h1 - ry * .3, r: s * .085 }, chim: { x: s * .22, y: -h1 - ry * .7 } };
  }
  function doorPath(c, s, inset) {
    var g = geo(s), dw = g.dw - (inset || 0) * 2, dh = g.dh - (inset || 0);
    c.beginPath();
    c.moveTo(-dw / 2, 0); c.lineTo(-dw / 2, -dh + dw / 2);
    c.arc(0, -dh + dw / 2, dw / 2, Math.PI, 0);
    c.lineTo(dw / 2, 0); c.closePath();
  }
  function buildSprite() {
    var s = house.s, g = geo(s), pad = s * .35;
    var cw = Math.ceil((s + pad * 2)), ch = Math.ceil(s * 1.25 + pad);
    var cv = document.createElement('canvas'); cv.width = Math.round(cw * DPR); cv.height = Math.round(ch * DPR);
    var c = cv.getContext('2d'); c.scale(DPR, DPR); c.translate(cw / 2, ch - pad * .25);
    sprite = { cv: cv, w: cw, h: ch, ox: cw / 2, oy: ch - pad * .25 };
    // sea grass behind the walls
    function grass(x, n, hgt, col) {
      c.strokeStyle = col; c.lineCap = 'round';
      for (var i = 0; i < n; i++) { var a = (i - (n - 1) / 2) * .22, len = hgt * R(.7, 1.1); c.lineWidth = s * .018; c.beginPath(); c.moveTo(x + i * s * .012, 0); c.quadraticCurveTo(x + Math.sin(a) * len * .5, -len * .6, x + Math.sin(a) * len, -len); c.stroke(); }
    }
    grass(-s * .55, 5, s * .32, '#3f9d72'); grass(s * .5, 4, s * .26, '#4bb083');
    // body: wall + dome
    c.save();
    c.beginPath(); c.moveTo(-s / 2, 0); c.lineTo(-s / 2, -g.h1); c.ellipse(0, -g.h1, s / 2, g.ry, 0, Math.PI, 0); c.lineTo(s / 2, 0); c.closePath();
    var bg = c.createRadialGradient(-s * .18, -g.h1 - g.ry * .6, s * .05, 0, -g.h1, s * .75);
    bg.addColorStop(0, '#ffe2d2'); bg.addColorStop(.55, '#f3ae9e'); bg.addColorStop(1, '#c4767e');
    c.fillStyle = bg; c.fill();
    c.save(); c.clip();
    // pebbles
    var cols = ['#f7c3b2', '#f9d6b4', '#eaaabd', '#f3cfc0', '#e8b19a', '#f6dccb'];
    var rowH = s * .075, rx = s * .058, ryP = s * .036, row = 0;
    for (var y = -rowH * .3; y > -g.h1 - g.ry - rowH; y -= rowH, row++) {
      for (var x = -s / 2 - rx + (row % 2) * rx; x < s / 2 + rx; x += rx * 2.05) {
        var col = cols[(row * 7 + Math.round(x)) % cols.length];
        c.fillStyle = col; c.globalAlpha = .62;
        c.beginPath(); c.ellipse(x + R(-1.5, 1.5), y + R(-1, 1), rx * R(.85, 1), ryP * R(.85, 1.05), R(-.15, .15), 0, TAU); c.fill();
        c.globalAlpha = .28; c.strokeStyle = '#8a4d55'; c.lineWidth = .8; c.stroke();
        c.globalAlpha = .35; c.fillStyle = '#ffffff'; c.beginPath(); c.ellipse(x - rx * .3, y - ryP * .35, rx * .35, ryP * .25, 0, 0, TAU); c.fill();
      }
    }
    c.globalAlpha = 1;
    // shading: light from the upper left
    var sh = c.createLinearGradient(-s / 2, 0, s / 2, 0);
    sh.addColorStop(0, 'rgba(255,255,255,.12)'); sh.addColorStop(.55, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(70,20,50,.3)');
    c.fillStyle = sh; c.fillRect(-s, -s * 1.3, s * 2, s * 1.4);
    var gr = c.createLinearGradient(0, 0, 0, -s * .12);
    gr.addColorStop(0, 'rgba(40,10,30,.3)'); gr.addColorStop(1, 'rgba(40,10,30,0)');
    c.fillStyle = gr; c.fillRect(-s, -s * .12, s * 2, s * .12);
    c.restore();
    c.strokeStyle = 'rgba(120,50,70,.45)'; c.lineWidth = s * .012; c.stroke();
    c.restore();
    // tube-coral chimney
    c.save(); c.translate(g.chim.x, g.chim.y); c.rotate(.18);
    var tg = c.createLinearGradient(-s * .05, 0, s * .05, 0);
    tg.addColorStop(0, '#b48ff0'); tg.addColorStop(1, '#6f4bb8');
    c.fillStyle = tg; c.beginPath(); c.moveTo(-s * .045, s * .06); c.lineTo(-s * .05, -s * .14); c.lineTo(s * .05, -s * .14); c.lineTo(s * .045, s * .06); c.closePath(); c.fill();
    c.fillStyle = '#d2bcff'; c.beginPath(); c.ellipse(0, -s * .14, s * .056, s * .02, 0, 0, TAU); c.fill();
    c.fillStyle = '#3a2366'; c.beginPath(); c.ellipse(0, -s * .14, s * .036, s * .011, 0, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = s * .008; c.beginPath(); c.moveTo(-s * .025, s * .04); c.lineTo(-s * .03, -s * .12); c.stroke();
    c.restore();
    // scallop-shell roof
    c.save(); c.translate(0, -g.h1 - g.ry * .93);
    var sw = s * .27, shh = s * .2;
    var sg = c.createLinearGradient(0, -shh, 0, 0);
    sg.addColorStop(0, '#ffb3c1'); sg.addColorStop(1, '#ff7f96');
    c.fillStyle = sg; c.beginPath(); c.moveTo(0, 0);
    for (var k = 0; k <= 8; k++) { var aa = Math.PI + k / 8 * Math.PI, bx = Math.cos(aa) * sw, by = Math.sin(aa) * shh; var aa2 = Math.PI + (k + .5) / 8 * Math.PI; if (k === 0) c.lineTo(bx, by); else c.quadraticCurveTo(Math.cos(aa2 - Math.PI / 16) * sw * 1.08, Math.sin(aa2 - Math.PI / 16) * shh * 1.08, bx, by); }
    c.closePath(); c.fill();
    c.strokeStyle = 'rgba(255,240,245,.7)'; c.lineWidth = s * .008;
    for (var r2 = 1; r2 < 8; r2++) { var a3 = Math.PI + r2 / 8 * Math.PI; c.beginPath(); c.moveTo(0, -shh * .08); c.lineTo(Math.cos(a3) * sw * .95, Math.sin(a3) * shh * .95); c.stroke(); }
    c.fillStyle = '#e8687f'; c.beginPath(); c.ellipse(0, 0, s * .05, s * .025, 0, 0, TAU); c.fill();
    c.restore();
    // porthole frame (glass drawn live)
    var w = g.win;
    c.strokeStyle = '#c38e3c'; c.lineWidth = s * .026; c.beginPath(); c.arc(w.x, w.y, w.r, 0, TAU); c.stroke();
    c.strokeStyle = '#f2cf7d'; c.lineWidth = s * .008; c.beginPath(); c.arc(w.x, w.y, w.r + s * .006, -2.4, -1); c.stroke();
    c.fillStyle = '#8a5f22'; for (var q = 0; q < 6; q++) { var a4 = q / 6 * TAU; c.beginPath(); c.arc(w.x + Math.cos(a4) * (w.r + s * .001), w.y + Math.sin(a4) * (w.r + s * .001), s * .006, 0, TAU); c.fill(); }
    // starfish on the dome
    c.save(); c.translate(s * .26, -g.h1 - g.ry * .18); c.rotate(.3);
    c.fillStyle = '#ffb347'; c.beginPath();
    for (var p5 = 0; p5 < 10; p5++) { var a5 = p5 / 10 * TAU - Math.PI / 2, rr = p5 % 2 ? s * .022 : s * .055; c.lineTo(Math.cos(a5) * rr, Math.sin(a5) * rr); }
    c.closePath(); c.fill(); c.fillStyle = 'rgba(255,240,200,.8)'; c.beginPath(); c.arc(0, 0, s * .01, 0, TAU); c.fill();
    c.restore();
    // door: wooden arch frame, then the opening is cut out (the interior is drawn behind the octopus)
    doorPath(c, s, -s * .02);
    c.fillStyle = '#7b4c2f'; c.fill();
    c.strokeStyle = '#a06a43'; c.lineWidth = s * .01;
    doorPath(c, s, -s * .012); c.stroke();
    c.globalCompositeOperation = 'destination-out';
    doorPath(c, s, s * .012); c.fill();
    c.globalCompositeOperation = 'source-over';
    // sign
    c.save(); c.translate(0, -g.dh - s * .07);
    c.fillStyle = '#9a6a45'; c.beginPath(); c.roundRect ? c.roundRect(-s * .1, -s * .035, s * .2, s * .07, s * .015) : c.rect(-s * .1, -s * .035, s * .2, s * .07); c.fill();
    c.fillStyle = '#fff3dc'; c.font = '800 ' + Math.round(s * .05) + 'px -apple-system,system-ui,sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('OCTO', 0, s * .003);
    c.restore();
    // front sea grass + doorstep shell
    grass(-s * .42, 3, s * .16, '#5cc596'); grass(s * .38, 3, s * .14, '#5cc596');
    c.fillStyle = '#ffd7c4'; c.beginPath(); c.ellipse(0, s * .012, g.dw * .62, s * .03, 0, 0, TAU); c.fill();
  }

  // ---------------------------------------------------------------------------------------------------
  // layout
  // ---------------------------------------------------------------------------------------------------
  function layout() {
    var w = stage.clientWidth, h = stage.clientHeight;
    if (!w || !h) return;
    DPR = Math.min(window.devicePixelRatio || 1, 1.5);
    W = w; H = h;
    [back, front].forEach(function (cv) { cv.width = Math.round(w * DPR); cv.height = Math.round(h * DPR); });
    var sRect = stage.getBoundingClientRect(), sand = document.querySelector('.ocean-sand'), y = h * .9;
    if (sand) { var r = sand.getBoundingClientRect(); y = clamp(r.top - sRect.top + Math.min(r.height, sRect.bottom - r.top) * .55, h * .7, h - 14); }
    house.s = clamp(Math.min(w, h) * .27, 104, 200);
    house.x = clamp(w * .66, house.s * .62, w - house.s * .62);
    house.y = y;
    buildSprite();
  }

  // ---------------------------------------------------------------------------------------------------
  // per-frame drawing
  // ---------------------------------------------------------------------------------------------------
  var restGlow = 0;
  function drawBack() {
    var c = bctx, s = house.s, g = geo(s);
    c.setTransform(DPR, 0, 0, DPR, 0, 0); c.clearRect(0, 0, W, H);
    c.translate(house.x, house.y);
    // shadow on the sand
    c.fillStyle = 'rgba(0,18,28,.28)'; c.beginPath(); c.ellipse(s * .04, s * .02, s * .6, s * .07, 0, 0, TAU); c.fill();
    // interior seen through the doorway
    doorPath(c, s, s * .012);
    var ig = c.createRadialGradient(0, -g.dh * .35, s * .01, 0, -g.dh * .4, g.dh * .8);
    ig.addColorStop(0, 'rgb(' + Math.round(lerp(24, 120, restGlow)) + ',' + Math.round(lerp(52, 80, restGlow)) + ',' + Math.round(lerp(66, 48, restGlow)) + ')');
    ig.addColorStop(1, '#051018');
    c.fillStyle = ig; c.fill();
    // a little clam-shell bed inside
    c.fillStyle = 'rgba(255,190,200,' + (.35 + .3 * restGlow) + ')';
    c.beginPath(); c.ellipse(0, -s * .03, g.dw * .34, s * .035, 0, Math.PI, 0); c.fill();
  }
  function drawFront(now, dt) {
    var c = fctx, s = house.s, g = geo(s), resting = state === 'resting';
    c.setTransform(DPR, 0, 0, DPR, 0, 0); c.clearRect(0, 0, W, H);
    c.drawImage(sprite.cv, house.x - sprite.ox, house.y - sprite.oy, sprite.w, sprite.h);
    c.translate(house.x, house.y);
    // window glass: dark blue by day, warm lamp light while resting (breathing slowly)
    var w = g.win, breathe = .5 + .5 * Math.sin(now * .0016);
    var glow = restGlow * (.75 + .25 * breathe);
    var wg = c.createRadialGradient(w.x - w.r * .3, w.y - w.r * .3, w.r * .1, w.x, w.y, w.r);
    wg.addColorStop(0, 'rgb(' + Math.round(lerp(90, 255, glow)) + ',' + Math.round(lerp(160, 214, glow)) + ',' + Math.round(lerp(190, 120, glow)) + ')');
    wg.addColorStop(1, 'rgb(' + Math.round(lerp(18, 214, glow)) + ',' + Math.round(lerp(60, 140, glow)) + ',' + Math.round(lerp(88, 60, glow)) + ')');
    c.fillStyle = wg; c.beginPath(); c.arc(w.x, w.y, w.r - s * .01, 0, TAU); c.fill();
    if (glow > .05) {
      c.globalCompositeOperation = 'lighter';
      var halo = c.createRadialGradient(w.x, w.y, 0, w.x, w.y, w.r * 3);
      halo.addColorStop(0, 'rgba(255,200,110,' + (.28 * glow) + ')'); halo.addColorStop(1, 'rgba(255,200,110,0)');
      c.fillStyle = halo; c.fillRect(w.x - w.r * 3, w.y - w.r * 3, w.r * 6, w.r * 6);
      c.globalCompositeOperation = 'source-over';
    }
    c.fillStyle = 'rgba(255,255,255,.5)'; c.beginPath(); c.ellipse(w.x - w.r * .35, w.y - w.r * .4, w.r * .28, w.r * .14, -.6, 0, TAU); c.fill();
    // chimney bubbles (busier while someone is home) and Zzz
    var cx = g.chim.x + Math.sin(.18) * s * .14, cy = g.chim.y - Math.cos(.18) * s * .14;
    if (Math.random() < (resting ? .06 : .025)) particles.push({ x: cx + R(-2, 2), y: cy, r: R(1.5, 3.5) * s / 150, vy: R(14, 24), ph: R(0, TAU), life: 0 });
    if (resting && Math.random() < .012) zzz.push({ x: cx + 4, y: cy - 4, life: 0, size: R(.8, 1.2) });
    c.strokeStyle = 'rgba(225,250,255,.75)'; c.lineWidth = 1;
    for (var i = particles.length - 1; i >= 0; i--) {
      var p = particles[i]; p.life += dt; p.y -= p.vy * dt; p.ph += dt * 5;
      var x = p.x + Math.sin(p.ph) * 2;
      if (p.life > 3.5 || p.y < -H) { particles.splice(i, 1); continue; }
      c.globalAlpha = clamp(1 - p.life / 3.5, 0, 1);
      c.beginPath(); c.arc(x, p.y, p.r, 0, TAU); c.stroke();
    }
    c.globalAlpha = 1;
    c.font = '800 ' + Math.round(s * .1) + 'px -apple-system,system-ui,sans-serif'; c.textAlign = 'center';
    for (var j = zzz.length - 1; j >= 0; j--) {
      var z = zzz[j]; z.life += dt;
      if (z.life > 3.2) { zzz.splice(j, 1); continue; }
      c.save(); c.translate(z.x + z.life * 9 + Math.sin(z.life * 2.5) * 4, z.y - z.life * 20); c.scale(z.size * (.6 + z.life * .25), z.size * (.6 + z.life * .25));
      c.globalAlpha = clamp(Math.min(z.life * 2, (3.2 - z.life) / 1.2), 0, 1) * .9;
      c.fillStyle = '#eaf6ff'; c.fillText('z', 0, 0); c.restore();
    }
    c.globalAlpha = 1;
  }

  // ---------------------------------------------------------------------------------------------------
  // moving the octopus (we own its transform while it goes home / rests / comes out)
  // ---------------------------------------------------------------------------------------------------
  var V3, ctrl = null, pivotY = .62;
  function doorWorldPoint(depthWorldZ, out) {
    var av = A(), cam = av.camera, rect = av.renderer.domElement.getBoundingClientRect(), sRect = stage.getBoundingClientRect();
    var g = geo(house.s);
    var px = sRect.left + house.x, py = sRect.top + house.y - g.dh * .42;
    var nx = (px - rect.left) / rect.width * 2 - 1, ny = -((py - rect.top) / rect.height * 2 - 1);
    var p = new V3(nx, ny, .5).unproject(cam), o = new V3().setFromMatrixPosition(cam.matrixWorld);
    var dir = p.sub(o).normalize(), t = (depthWorldZ - o.z) / (dir.z || -1e-6);
    return out.copy(o).addScaledVector(dir, t);
  }
  // scale at which the octopus fits the doorway (from its projected height at the current scale)
  function doorFitScale() {
    var av = A(), m = av.importedModel, cam = av.camera, rect = av.renderer.domElement.getBoundingClientRect();
    var a = new V3(0, 0, 0).applyMatrix4(m.matrixWorld).project(cam), b = new V3(0, pivotY * 2, 0).applyMatrix4(m.matrixWorld).project(cam);
    var hPx = Math.abs(a.y - b.y) / 2 * rect.height;
    return clamp((geo(house.s).dh * .8) / Math.max(hPx, 1), .08, .9);
  }
  function setModelCenterAtWorld(world, k) {
    var m = A().importedModel, base = A().importedModelBaseScale;
    var local = m.parent.worldToLocal(world.clone());
    m.scale.copy(base).multiplyScalar(k);
    m.position.set(local.x, local.y - pivotY * base.y * k, local.z);
  }
  function startControl() {
    var av = A(), m = av.importedModel;
    av.freeSwimActive = false;                       // keep the swim clips, drop the swim path
    own(function () { av.referenceMotion && av.referenceMotion.play('swim_loop'); });
    var mo = motion(); if (mo && mo.setEnabled) mo.setEnabled(false);
    var wp = new V3(0, pivotY * m.scale.y, 0); m.localToWorld(wp.set(0, pivotY, 0));
    ctrl = { fromW: wp.clone(), fromK: m.scale.x / av.importedModelBaseScale.x, yaw: m.rotation.y, z: wp.z };
  }
  function endControl() {
    var av = A(), m = av.importedModel;
    m.visible = true;
    m.position.copy(av.importedModelBasePosition); m.scale.copy(av.importedModelBaseScale); m.rotation.copy(av.importedModelBaseRotation);
    ctrl = null;
    own(function () { av.playAction('free_swim_aquarium'); });
    var mo = motion(); if (mo && mo.setEnabled) mo.setEnabled(true);
  }
  function homeWorld() {   // where free swim starts: model base position, body centre
    var av = A(), m = av.importedModel, p = av.importedModelBasePosition, s = av.importedModelBaseScale;
    return m.parent.localToWorld(new V3(p.x, p.y + pivotY * s.y, p.z));
  }

  // guard: while busy, the ocean world's own reactions must not grab the octopus
  function own(fn) { self = true; try { return fn(); } finally { self = false; } }
  function guard() {
    var av = A();
    ['playAnimation', 'playAction', 'playReferenceMotion'].forEach(function (name) {
      var orig = av[name]; if (typeof orig !== 'function') return;
      av[name] = function () { if (state !== 'roam' && !self) return false; return orig.apply(av, arguments); };
    });
  }

  // ---------------------------------------------------------------------------------------------------
  // state machine
  // ---------------------------------------------------------------------------------------------------
  function go(next) { state = next; stateT = 0; updateLabel(); }
  function goHome() {
    if (state !== 'roam' || busyElsewhere()) return;
    startControl();
    var E = window.__v6EyeHighlight, L = window.__octoLids, M = window.__octoMouth;
    if (E) E.setExpression('sleepy', 6000); if (L && L.play) L.play('sleepy'); if (M && M.play) M.play('yawn');
    ctrl.tw = new V3(); ctrl.dur = 3.2;
    go('goingHome');
  }
  function wake() {
    if (state !== 'resting') return;
    var av = A(), m = av.importedModel;
    m.visible = true;
    ctrl.fit = doorFitScale.k || ctrl.fit;
    go('peeking');
  }
  function busyElsewhere() { var cc = window.__octoCopyCat; return !!(cc && cc.on); }

  function step(now, dt) {
    stateT += dt;
    var av = A(), m = av && av.importedModel;
    if (!m) return;
    if (state === 'roam') {
      var mo = motion();
      if (!busyElsewhere() && (!mo || mo.enabled !== false)) energy -= dt / PLAY_SECONDS;
      if (energy <= 0) goHome();
      restGlow = Math.max(0, restGlow - dt * .5);
      return;
    }
    var door = doorWorldPoint(ctrl.z, new V3());
    if (state === 'goingHome') {
      var u = clamp(stateT / ctrl.dur, 0, 1), e = ease(u);
      var p = ctrl.fromW.clone().lerp(door, e); p.y += Math.sin(u * Math.PI * 3) * .04 * (1 - u);
      setModelCenterAtWorld(p, lerp(ctrl.fromK, ctrl.fromK * .82, e));
      m.rotation.set(av.importedModelBaseRotation.x, av.importedModelBaseRotation.y + clamp((door.x - ctrl.fromW.x) * .8, -.6, .6) * Math.sin(u * Math.PI), Math.sin(u * TAU) * .08);
      if (u >= 1) { ctrl.fit = doorFitScale() * ctrl.fromK * .82; ctrl.k0 = ctrl.fromK * .82; go('entering'); }
    } else if (state === 'entering') {
      var u2 = clamp(stateT / 1.4, 0, 1), k = u2 < .55 ? lerp(ctrl.k0, ctrl.fit, ease(u2 / .55)) : lerp(ctrl.fit, ctrl.fit * .25, ease((u2 - .55) / .45));
      setModelCenterAtWorld(door.clone().add(new V3(0, -.02 * u2, 0)), k);
      m.rotation.set(av.importedModelBaseRotation.x, av.importedModelBaseRotation.y, 0);
      restGlow = Math.min(1, restGlow + dt * .8);
      if (u2 >= 1) { m.visible = false; restFor = R(45, 75); go('resting'); }
    } else if (state === 'resting') {
      restGlow = Math.min(1, restGlow + dt * .8);
      energy = Math.min(1, energy + dt / restFor);
      if (stateT > restFor) wake();
    } else if (state === 'peeking') {
      // appears in the doorway, blinks and yawns
      var u3 = clamp(stateT / 1.8, 0, 1);
      setModelCenterAtWorld(door, lerp(ctrl.fit * .3, ctrl.fit, ease(Math.min(1, u3 * 2))));
      if (stateT > .5 && !ctrl.blinked) { ctrl.blinked = true; var L = window.__octoLids, M = window.__octoMouth, E = window.__v6EyeHighlight; if (L && L.play) L.play('blinkDouble'); if (M && M.play) M.play('yawn', 250); if (E) E.setExpression('happy', 3000); }
      restGlow = Math.max(0, restGlow - dt * .4);
      if (u3 >= 1) { ctrl.homeW = homeWorld(); go('exiting'); }
    } else if (state === 'exiting') {
      var u4 = clamp(stateT / 2.2, 0, 1), e4 = ease(u4);
      var pe = door.clone().lerp(ctrl.homeW, e4); pe.y += Math.sin(u4 * Math.PI) * .12;
      setModelCenterAtWorld(pe, lerp(ctrl.fit, 1, e4));
      m.rotation.set(av.importedModelBaseRotation.x, av.importedModelBaseRotation.y + Math.sin(u4 * Math.PI) * clamp((ctrl.homeW.x - door.x) * .8, -.6, .6), 0);
      restGlow = Math.max(0, restGlow - dt * .6);
      if (u4 >= 1) { energy = Math.max(energy, .999); endControl(); go('roam'); var M2 = window.__octoMouth; if (M2 && M2.play) M2.play('giggle', 200); }
    }
  }

  function updateLabel() {
    if (!label) return;
    var txt = { roam: '', goingHome: '回家休息…', entering: '', resting: 'Zzz · 点小屋叫醒', peeking: '睡醒啦！', exiting: '' }[state] || '';
    label.textContent = txt; label.style.opacity = txt ? '1' : '0';
    var g = geo(house.s);
    label.style.left = house.x + 'px'; label.style.top = (house.y - g.h1 - g.ry - house.s * .3) + 'px';
  }

  function loop(now) {
    requestAnimationFrame(loop);
    if (!W || document.hidden) { lastT = now; return; }
    var dt = lastT ? Math.min(.05, (now - lastT) / 1000) : 1 / 60; lastT = now;
    step(now, dt);
    drawBack(); drawFront(now, dt);
  }

  function onTap(e) {
    if (!W) return;
    var r = stage.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top, s = house.s, g = geo(s);
    if (Math.abs(x - house.x) > s * .55 || y > house.y + s * .05 || y < house.y - g.h1 - g.ry - s * .2) return;
    if (state === 'roam') goHome(); else if (state === 'resting') wake();
  }

  function install() {
    stage = document.querySelector('.avatar-stage');
    var av = A(), canvasWrap = stage && stage.querySelector('.avatar-canvas');
    if (!stage || !canvasWrap || !av || !av.importedModel || !av.camera) return false;
    V3 = av.importedModel.position.constructor;
    av.importedModel.traverse(function (n) { if (n.isSkinnedMesh && n.geometry) { n.geometry.computeBoundingBox(); var bb = n.geometry.boundingBox; pivotY = (bb.min.y + bb.max.y) * .5; } });
    back = document.createElement('canvas'); back.className = 'octo-house-back';
    front = document.createElement('canvas'); front.className = 'octo-house-front';
    var st = document.createElement('style');
    st.textContent = '.octo-house-back,.octo-house-front{position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none}.octo-house-front{z-index:3}' +
      '.octo-house-label{position:absolute;z-index:9;transform:translate(-50%,-100%);padding:4px 10px;border-radius:999px;background:rgba(10,30,45,.6);color:#eaf6ff;font:700 12px -apple-system,system-ui,sans-serif;pointer-events:none;transition:opacity .4s;opacity:0;white-space:nowrap;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}';
    document.head.appendChild(st);
    stage.insertBefore(back, canvasWrap);
    canvasWrap.parentNode.insertBefore(front, canvasWrap.nextSibling);
    label = document.createElement('div'); label.className = 'octo-house-label'; stage.appendChild(label);
    bctx = back.getContext('2d'); fctx = front.getContext('2d');
    layout();
    if (window.ResizeObserver) new ResizeObserver(function () { layout(); updateLabel(); }).observe(stage); else window.addEventListener('resize', layout);
    guard();
    window.addEventListener('pointerdown', onTap, { capture: true, passive: true });
    // Copy Cat or a voice chat needs the octopus out here
    document.addEventListener('click', function (e) { if (e.target && e.target.closest && e.target.closest('#octo-cc-btn') && state === 'resting') wake(); }, true);
    window.addEventListener('message', function (e) { var d = e.data; if (d && d.type === 'minest-voice-state' && d.kind === 'state' && d.state !== 'idle' && state === 'resting') wake(); });
    requestAnimationFrame(loop);
    return true;
  }

  window.__octoHouse = {
    goHome: function () { goHome(); }, wake: function () { wake(); },
    get state() { return state; }, get energy() { return energy; }, set energy(v) { energy = clamp(+v || 0, 0, 1); },
    get rect() { return { x: house.x, y: house.y, s: house.s }; }
  };
  (function wait(n) {
    if (install()) return;
    if (n < 400) setTimeout(function () { wait(n + 1); }, 150);
  })(0);
})();
