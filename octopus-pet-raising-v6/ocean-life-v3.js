/* Pet Raising — Ocean Life V3 (43.5).
   Replaces the flat CSS creatures (gradient blobs sliding on fixed keyframe paths) with one canvas of
   procedurally drawn, physically animated sea life:
   - fish turn in 3D (the body foreshortens through the turn instead of flipping), tail-beat frequency
     follows speed, small fish school (boids), everything darts away from a tap;
   - jellyfish swim by pulsing (fast contraction = thrust, slow relaxation = coast), with tentacles and
     oral arms on rope physics;
   - turtle rows with its front flippers, the eagle ray flaps with a wave running out to the wing tips,
     the puffer hovers on fluttering fins and inflates, the crab walks sideways on alternating legs;
   - kelp, sea grass and anemone tentacles bend with one shared current, the wave running up each blade;
   - depth fog: farther things are smaller, slower and tinted towards the water colour.
   The old creature elements stay in the DOM as invisible anchors that follow their new creature, so the
   octopus's perception (ocean-living-world-v2.js: "a fish passed close by", jellyfish nearby, …) still works. */
(function () {
  'use strict';
  if (window.__oceanLifeV3) return;
  window.__oceanLifeV3 = true;

  var TAU = Math.PI * 2, PI = Math.PI;
  var seed = 20261008;
  function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
  function R(a, b) { return a + (b - a) * rnd(); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function hash(n) { var x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
  function noise(x, s) { var i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return lerp(hash(i + s * 57.3), hash(i + 1 + s * 57.3), u) * 2 - 1; }

  // ---- colour + depth fog -------------------------------------------------------------------------
  var WATER = [14, 74, 94];
  function hex(h) { h = h.replace('#', ''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; }
  function col(h, z, a) {
    var c = typeof h === 'string' ? hex(h) : h, k = clamp(z, 0, 1) * .74;
    var r = Math.round(lerp(c[0], WATER[0], k)), g = Math.round(lerp(c[1], WATER[1], k)), b = Math.round(lerp(c[2], WATER[2], k));
    return a == null ? 'rgb(' + r + ',' + g + ',' + b + ')' : 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
  }
  function depthScale(z) { return lerp(1, .46, z); }

  // ---- scene state --------------------------------------------------------------------------------
  var ocean, canvas, ctx, W = 0, H = 0, DPR = 1, U = 1, sandTop = 0, sandH = 0;
  var layout = null;          // fractional positions measured from the old CSS scenery
  var things = [];            // everything drawn, sorted far → near
  var fishes = [], schools = [], jellies = [], bubbles = [], snow = [], kelps = [], swayCorals = [];
  var anemone = null, crab = null, puffer = null, turtle = null, ray = null, angler = null, hermit = null;
  var coralCache = null, bubbleSprite = null;
  var current = 0, T = 0;
  var tapAt = null;

  function currentAt(x, t) {
    return .55 * Math.sin(t * .55 + x * .0035) + .28 * Math.sin(t * 1.21 + x * .009 + 1.7) + .17 * noise(t * .4 + x * .002, 3);
  }

  // ---- measuring the old scenery, then hiding it -------------------------------------------------
  function localRect(el, oRect, k) {
    var r = el.getBoundingClientRect();
    return { x: (r.left - oRect.left) / k, y: (r.top - oRect.top) / k, w: r.width / k, h: r.height / k };
  }
  function measure() {
    var oRect = ocean.getBoundingClientRect(), k = oRect.width / Math.max(1, ocean.clientWidth);
    var w = ocean.clientWidth, h = ocean.clientHeight, out = {};
    function grab(sel, name) {
      var el = ocean.querySelector(sel);
      if (!el) return;
      var r = localRect(el, oRect, k);
      if (r.w < 1) return;
      out[name] = { cx: (r.x + r.w / 2) / w, by: (r.y + r.h) / h, w: r.w / w, h: r.h / h, x: r.x / w, y: r.y / h };
    }
    grab('.ocean-sand', 'sand');
    grab('.rock-left', 'rockL'); grab('.rock-right', 'rockR'); grab('.rock-center', 'rockC');
    grab('.coral-left', 'coralL'); grab('.coral-right', 'coralR'); grab('.coral-center', 'coralC');
    grab('.coral-garden-left', 'gardenL'); grab('.coral-garden-right', 'gardenR');
    grab('.branch-coral-left', 'branchL'); grab('.branch-coral-right', 'branchR');
    grab('.seaweed-left', 'weedL'); grab('.seaweed-right', 'weedR');
    grab('.sea-star-left', 'starL'); grab('.sea-star-right', 'starR');
    return out;
  }
  function L(name, fx, fby) { return layout[name] || { cx: fx, by: fby, w: .1, h: .2, x: fx - .05, y: fby - .2 }; }

  var HIDE_CSS = [
    // scenery now drawn on the canvas
    '.olv3 .seaweed,.olv3 .coral,.olv3 .coral-garden,.olv3 .branch-coral,.olv3 .light-ray,.olv3 .bubble,.olv3 .ocean-v2-particles,.olv3 .reef{display:none!important}',
    // creatures become invisible anchors moved by this script (so the octopus can still "see" them)
    '.olv3 .fish,.olv3 .clownfish,.olv3 .eagle-fish,.olv3 .lionfish,.olv3 .puffer-fish,.olv3 .jellyfish,.olv3 .sea-turtle,.olv3 .crab{' +
      'animation:none!important;visibility:hidden!important;position:absolute!important;left:0!important;top:0!important;right:auto!important;bottom:auto!important;' +
      'margin:0!important;rotate:none!important;scale:none!important;translate:none!important;filter:none!important;transition:none!important}',
    '.olv3 .school{animation:none!important;left:0!important;top:0!important;right:auto!important;bottom:auto!important;transform:none!important}',
    '.olv3 .sea-star{visibility:hidden!important;animation:none!important}',
    '.olv3-canvas{position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:2}'
  ].join('\n');

  // ---- anchors -------------------------------------------------------------------------------------
  function anchor(sel, i) {
    var list = ocean.querySelectorAll(sel), el = list[i];
    if (!el) return null;
    return { el: el, w: el.offsetWidth || 30, h: el.offsetHeight || 20 };
  }
  function moveAnchor(a, x, y) {
    if (!a) return;
    a.el.style.transform = 'translate3d(' + (x - a.w / 2).toFixed(1) + 'px,' + (y - a.h / 2).toFixed(1) + 'px,0)';
  }
  function interest(a) { return a && a.el.classList.contains('ocean-v2-entity-interest'); }
  function drawGlow(c, x, y, r, g) {
    if (g < .02) return;
    var gr = c.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, 'rgba(255,230,160,' + (.32 * g) + ')'); gr.addColorStop(1, 'rgba(255,230,160,0)');
    c.globalCompositeOperation = 'lighter'; c.fillStyle = gr; c.fillRect(x - r, y - r, r * 2, r * 2); c.globalCompositeOperation = 'source-over';
  }

  // ---- path helper: smooth closed/open curve through points -----------------------------------------
  function smooth(c, pts, move) {
    if (move) c.moveTo(pts[0], pts[1]); else c.lineTo(pts[0], pts[1]);
    for (var i = 2; i < pts.length - 2; i += 2) {
      var mx = (pts[i] + pts[i + 2]) / 2, my = (pts[i + 1] + pts[i + 3]) / 2;
      c.quadraticCurveTo(pts[i], pts[i + 1], mx, my);
    }
    c.lineTo(pts[pts.length - 2], pts[pts.length - 1]);
  }

  // =================================================================================================
  // FISH
  // =================================================================================================
  var SPECIES = {
    anthias: { L: 30, h: .36, tail: .25, ped: .3, fork: .75, tailH: .5, belly: 1.06, dfin: [.26, .86, .2], afin: [.62, .86, .2], eyeU: .13, eyeR: .14, speed: 50, beat: 3.6, turn: 4.2,
      col: { back: '#c93d68', side: '#ff8a5c', belly: '#ffd8b4', fin: '#ff9a6a', edge: '#ffd890', iris: '#ffc04a', mark: '#c48cff' } },
    tang: { L: 64, h: .56, tail: .2, ped: .26, fork: .3, tailH: .52, belly: 1, dfin: [.2, .86, .13], afin: [.45, .86, .11], eyeU: .15, eyeR: .1, speed: 36, beat: 2.3, turn: 3.2,
      col: { back: '#1a3aa0', side: '#2f6fe4', belly: '#62a4f4', fin: '#2148b8', edge: '#0a1632', tailFin: '#ffd23a', iris: '#0b1020', mark: '#0a1230' } },
    clown: { L: 42, h: .45, tail: .2, ped: .38, fork: 0, tailH: .42, belly: 1.05, dfin: [.2, .84, .2], afin: [.56, .84, .17], eyeU: .14, eyeR: .14, speed: 30, beat: 3.2, turn: 4,
      col: { back: '#d84d14', side: '#ff7a24', belly: '#ffa65e', fin: '#ff8634', edge: '#170a04', iris: '#ff9a38', mark: '#fffaf2' } },
    butterfly: { L: 50, h: .76, tail: .17, ped: .3, fork: 0, tailH: .36, belly: 1, dfin: [.2, .88, .2], afin: [.46, .88, .2], eyeU: .2, eyeR: .08, speed: 30, beat: 2.6, turn: 3.4, snout: true,
      col: { back: '#e0a800', side: '#ffd83a', belly: '#fff2b0', fin: '#ffd23a', edge: '#141414', iris: '#111111', mark: '#141414' } },
    lion: { L: 58, h: .4, tail: .2, ped: .36, fork: 0, tailH: .38, belly: 1.08, dfin: [.18, .84, .16], afin: [.6, .84, .16], eyeU: .14, eyeR: .12, speed: 15, beat: 1.6, turn: 1.8,
      col: { back: '#6a2032', side: '#c4574c', belly: '#f2d4bc', fin: '#ebbca6', edge: '#6a2032', iris: '#e86b3a', mark: '#fff0e2' } }
  };

  function Fish(sp, o) {
    var s = SPECIES[sp];
    this.kind = 'fish'; this.sp = s; this.spName = sp;
    this.z = o.z; this.ds = depthScale(o.z) * (o.size || 1);
    this.Lb = s.L * U * this.ds; this.H = this.Lb * s.h;
    this.x = o.x; this.y = o.y;
    this.cruise = s.speed * U * depthScale(o.z) * R(.85, 1.15);
    var dir = rnd() < .5 ? 1 : -1;
    this.vx = dir * this.cruise; this.vy = 0;
    this.yaw = dir > 0 ? 0 : PI; this.pitch = 0;
    this.phase = R(0, TAU); this.pec = R(0, TAU); this.amp = .4;
    this.seed = R(0, 100); this.zone = o.zone || [.12, .6]; this.home = o.home || null;
    this.target = null; this.retarget = 0; this.flee = 0; this.glow = 0;
    this.agility = o.agility || 1.3; this.anchor = o.anchor || null; this.school = null;
    var c = s.col, z = this.z;
    this.c = {}; for (var key in c) this.c[key] = col(c[key], z);
    this.cA = { fin: col(c.fin, z, .78), tailFin: col(c.tailFin || c.fin, z, .85), edge: col(c.edge, z, .6), line: col('#000000', z, .16), shine: 'rgba(255,255,255,' + (.2 * (1 - z * .6)) + ')' };
    this.grad = null;
  }
  Fish.prototype.pickTarget = function () {
    if (this.home) {
      var a = R(0, TAU), r = R(.2, 1) * this.home.r;
      this.target = { x: this.home.x + Math.cos(a) * r, y: this.home.y + Math.sin(a) * r * .55 };
      this.retarget = R(2, 4.5);
      return;
    }
    var off = rnd() < .22;
    var tx = this.x < W / 2 ? R(.58, off ? 1.16 : .95) * W : R(off ? -.16 : .05, .42) * W;
    this.target = { x: tx, y: R(this.zone[0], this.zone[1]) * H };
    this.retarget = R(5, 10);
  };
  Fish.prototype.update = function (dt, t) {
    var f = this;
    f.retarget -= dt;
    if (!f.target || f.retarget <= 0 || Math.hypot(f.target.x - f.x, f.target.y - f.y) < f.Lb * 1.2) f.pickTarget();
    var dx = f.target.x - f.x, dy = f.target.y - f.y, d = Math.hypot(dx, dy) || 1;
    var mood = .8 + .4 * (noise(t * .25, f.seed) * .5 + .5);
    var sp = f.cruise * mood * (f.flee > 0 ? 2.8 : 1) * Math.max(.3, Math.min(1, d / (f.Lb * 3)));
    var desx = dx / d * sp, desy = dy / d * sp * .7 + noise(t * .5, f.seed + 9) * f.cruise * .12;
    var ag = f.flee > 0 ? 4 : f.agility;
    f.vx += (desx - f.vx) * Math.min(1, ag * dt);
    f.vy += (desy - f.vy) * Math.min(1, ag * dt);
    if (f.flee > 0) f.flee -= dt;
    f.integrate(dt);
  };
  Fish.prototype.integrate = function (dt) {
    var f = this, s = f.sp;
    var pvx = f.vx; f.x += f.vx * dt; f.y += f.vy * dt;
    if (f.y < H * .06) f.vy += (H * .06 - f.y) * 2 * dt;
    if (f.y > sandTop + sandH * .2) f.vy -= (f.y - sandTop - sandH * .2) * 2 * dt;
    // facing: rotate the body through the turn
    var thr = f.cruise * .14;
    if (f.vx > thr) f.yawT = 0; else if (f.vx < -thr) f.yawT = PI; else if (f.yawT == null) f.yawT = f.yaw;
    var turn = (f.flee > 0 ? 9 : s.turn) * dt;
    f.yaw += clamp(f.yawT - f.yaw, -turn, turn);
    var pt = clamp(Math.atan2(f.vy, Math.abs(f.vx) + f.cruise * .35), -.5, .5);
    f.pitch += (pt - f.pitch) * Math.min(1, dt * 4);
    // tail beat follows speed (and turning effort)
    var spd = Math.hypot(f.vx, f.vy) / Math.max(1, f.cruise);
    var turning = Math.abs(f.yawT - f.yaw) > .05 ? .5 : 0;
    f.phase += TAU * s.beat * (.45 + .75 * Math.min(2.4, spd) + turning) * dt;
    var ampT = .26 + .3 * Math.min(1.6, spd) + turning * .4 + Math.min(.4, Math.abs(f.vx - pvx) / Math.max(dt, .001) / f.cruise * .05);
    f.amp += (ampT - f.amp) * Math.min(1, dt * 3);
    f.pec += dt * (5 + 4 * (1 - Math.min(1, spd)));
    f.glow += ((interest(f.anchor) ? 1 : 0) - f.glow) * Math.min(1, dt * 4);
    moveAnchor(f.anchor, f.x, f.y);
  };
  Fish.prototype.scare = function (px, py, r) {
    var dx = this.x - px, dy = this.y - py, d = Math.hypot(dx, dy);
    if (d > r) return;
    var k = (1 - d / r) * this.cruise * 4.5 / Math.max(d, 1);
    this.vx += dx * k; this.vy += dy * k * .7; this.flee = 1.1;
    this.target = { x: this.x + dx / Math.max(d, 1) * W * .35, y: clamp(this.y + dy / Math.max(d, 1) * H * .15, H * .08, sandTop) };
    this.retarget = 1.6;
  };

  function fishTop(f, u, uP) { return -f.H / 2 * prof(u / uP, f.sp.ped); }
  function prof(v, ped) {
    v = clamp(v, 0, 1);
    var m = .36;
    if (v < m) { var q = (m - v) / m; return Math.sqrt(Math.max(0, 1 - q * q)); }
    var s = (v - m) / (1 - m); s = s * s * (3 - 2 * s);
    return 1 - (1 - ped) * s;
  }
  var _top = [], _bot = [];
  Fish.prototype.draw = function (c, t) {
    var f = this, s = f.sp, Lb = f.Lb, H = f.H, hl = Lb / 2, uP = 1 - s.tail;
    var sx = Math.cos(f.yaw), side = sx >= 0 ? 1 : -1, ax = Math.max(Math.abs(sx), .2);
    var ph = f.phase, amp = f.amp;
    drawGlow(c, f.x, f.y, Lb * 1.1, f.glow);
    c.save();
    c.translate(f.x, f.y);
    c.rotate(side * f.pitch);
    c.scale(side * ax, 1);
    // body outline (spine flexes a little towards the tail)
    var N = 12;
    _top.length = 0; _bot.length = 0;
    for (var i = 0; i <= N; i++) {
      var u = i / N * uP, v = u / uP;
      var sy = amp * H * .07 * Math.sin(ph - v * 2.6) * v * v;
      var p = prof(v, s.ped);
      var x = hl - u * Lb;
      _top.push(x, sy - H / 2 * p); _bot.push(x, sy + H / 2 * p * s.belly);
    }
    var xp = hl - uP * Lb, pedY = amp * H * .07 * Math.sin(ph - 2.6), pedH = H * s.ped;
    if (s.snout) { _top[0] += Lb * .06; _bot[0] += Lb * .06; _top[1] -= H * .04; _bot[1] -= H * .04; }

    // tail fin: its projected length shrinks as it sweeps sideways — that is what reads as a tail beat
    var a = Math.sin(ph) * amp, tl = Lb * s.tail, fl = .58 + .42 * Math.cos(a * 1.5);
    var tipX = xp - tl * fl * 1.05, wob = Math.sin(ph - .7) * H * .05 * amp;
    var notchX = s.fork > 0 ? xp - tl * fl * (1 - s.fork * .6) : tipX - tl * fl * .14;
    c.fillStyle = f.cA.tailFin;
    c.beginPath();
    c.moveTo(xp + tl * .18, pedY - pedH / 2 * .9);
    c.quadraticCurveTo(xp - tl * .3 * fl, pedY - pedH * .6, tipX, pedY * 1.6 - H * s.tailH + wob);
    c.quadraticCurveTo(lerp(tipX, notchX, .5) + (s.fork > 0 ? tl * .08 : -tl * .1) * fl, pedY * 1.5 - H * s.tailH * .45, notchX, pedY * 1.5);
    c.quadraticCurveTo(lerp(tipX, notchX, .5) + (s.fork > 0 ? tl * .08 : -tl * .1) * fl, pedY * 1.5 + H * s.tailH * .45, tipX, pedY * 1.6 + H * s.tailH - wob);
    c.quadraticCurveTo(xp - tl * .3 * fl, pedY + pedH * .6, xp + tl * .18, pedY + pedH / 2 * .9);
    c.closePath(); c.fill();
    // fin rays
    c.strokeStyle = f.cA.line; c.lineWidth = .6;
    c.beginPath();
    for (var r = -2; r <= 2; r++) { c.moveTo(xp, pedY + r * pedH * .12); c.lineTo(lerp(xp, tipX, .92), pedY * 1.55 + r * H * s.tailH * .38); }
    c.stroke();

    // dorsal + anal fins (soft edge ripples backwards)
    function fin(u0, u1, hgt, top) {
      c.beginPath();
      var steps = 8;
      for (var k = 0; k <= steps; k++) {
        var uu = lerp(u0, u1, k / steps) * uP, vv = uu / uP, x = hl - uu * Lb;
        var base = (top ? -1 : s.belly) * H / 2 * prof(vv, s.ped) + amp * H * .07 * Math.sin(ph - vv * 2.6) * vv * vv;
        var e = Math.sin(PI * k / steps); e = Math.pow(e, .55);
        var rip = 1 + .14 * Math.sin(ph * .7 - k * .9);
        var y = base + (top ? -1 : 1) * H * hgt * e * rip;
        if (k === 0) c.moveTo(x, base); c.lineTo(x - Lb * .03 * e, y);
      }
      var ue = u1 * uP; c.lineTo(hl - ue * Lb, (top ? -1 : s.belly) * H / 2 * prof(ue / uP, s.ped));
      c.closePath(); c.fill();
    }
    c.fillStyle = f.cA.fin;
    if (f.spName === 'lion') this.lionFins(c, hl, uP, Lb, H, ph);
    fin(s.dfin[0], s.dfin[1], s.dfin[2], true);
    fin(s.afin[0], s.afin[1], s.afin[2], false);

    // body
    if (!f.grad) {
      f.grad = c.createLinearGradient(0, -H / 2, 0, H / 2 * s.belly);
      f.grad.addColorStop(0, f.c.back); f.grad.addColorStop(.45, f.c.side); f.grad.addColorStop(1, f.c.belly);
      f.shineG = c.createRadialGradient(Lb * .06, -H * .2, 0, Lb * .06, -H * .2, Lb * .38);
      f.shineG.addColorStop(0, f.cA.shine); f.shineG.addColorStop(1, 'rgba(255,255,255,0)');
    }
    c.beginPath();
    smooth(c, _top, true);
    c.lineTo(xp, pedY - pedH / 2); c.lineTo(xp, pedY + pedH / 2);
    var back = []; for (var b = _bot.length - 2; b >= 0; b -= 2) back.push(_bot[b], _bot[b + 1]);
    smooth(c, back, false);
    c.closePath();
    // 44.5: a soft contact shadow below the near fish (they read as bodies in the water, not cut-outs)
    var near = f.z < .5;
    if (near) { c.shadowColor = 'rgba(0,12,24,' + (.32 * (1 - f.z)).toFixed(3) + ')'; c.shadowBlur = 9 * U; c.shadowOffsetY = 7 * U * (1 - f.z); }
    c.fillStyle = f.grad; c.fill();
    if (near) { c.shadowColor = 'transparent'; c.shadowBlur = 0; c.shadowOffsetY = 0; }
    c.save(); c.clip();
    this.markings(c, hl, Lb, H, uP);
    c.fillStyle = f.shineG; c.fillRect(-hl, -H, Lb, H);
    // 44.5: volume — round shading across the body (lit back, shadowed belly), darker towards the
    // outline, a soft specular spot on the shoulder and a thin rim light along the back
    if (!f.vol) {
      var k3 = 1 - f.z * .65;
      f.vol = c.createLinearGradient(0, -H / 2, 0, H / 2 * s.belly);
      f.vol.addColorStop(0, 'rgba(255,255,255,' + (.2 * k3).toFixed(3) + ')'); f.vol.addColorStop(.28, 'rgba(255,255,255,' + (.06 * k3).toFixed(3) + ')');
      f.vol.addColorStop(.55, 'rgba(0,0,0,0)'); f.vol.addColorStop(1, 'rgba(0,18,36,' + (.42 * k3).toFixed(3) + ')');
      f.edgeG = c.createRadialGradient(Lb * .04, 0, 0, Lb * .04, 0, hl * 1.05);
      f.edgeG.addColorStop(0, 'rgba(0,0,0,0)'); f.edgeG.addColorStop(.62, 'rgba(0,0,0,0)'); f.edgeG.addColorStop(1, 'rgba(0,16,32,' + (.38 * k3).toFixed(3) + ')');
      f.specG = c.createRadialGradient(hl - Lb * .3, -H * .26, 0, hl - Lb * .3, -H * .26, Lb * .14);
      f.specG.addColorStop(0, 'rgba(255,255,255,' + (.55 * k3).toFixed(3) + ')'); f.specG.addColorStop(1, 'rgba(255,255,255,0)');
      f.k3 = k3;
    }
    c.fillStyle = f.vol; c.fillRect(-hl * 1.2, -H, Lb * 1.3, H * 2);
    c.save(); c.scale(1, H / Lb * 1.15); c.fillStyle = f.edgeG; c.fillRect(-hl * 1.3, -Lb, Lb * 1.4, Lb * 2); c.restore();
    c.fillStyle = f.specG; c.fillRect(-hl, -H, Lb, H);
    c.strokeStyle = 'rgba(220,245,255,' + (.38 * f.k3).toFixed(3) + ')'; c.lineWidth = 1.4;
    c.beginPath(); smooth(c, _top, true); c.stroke();
    // lateral line + soft scale shimmer moving with the turn
    c.strokeStyle = f.cA.line; c.lineWidth = .7;
    c.beginPath(); c.moveTo(hl - Lb * .2, -H * .16); c.quadraticCurveTo(0, -H * .26, xp, pedY); c.stroke();
    c.restore();
    c.strokeStyle = f.cA.edge; c.lineWidth = .7; c.stroke();

    // gill + pectoral fin (paddling)
    var gx = hl - Lb * .25;
    c.strokeStyle = f.cA.line; c.lineWidth = .9;
    c.beginPath(); c.moveTo(gx + Lb * .02, -H * .28); c.quadraticCurveTo(gx - Lb * .04, 0, gx + Lb * .02, H * .3); c.stroke();
    c.save();
    c.translate(gx - Lb * .03, H * .1);
    c.rotate(.75 + .35 * Math.sin(f.pec));
    c.fillStyle = f.cA.fin;
    c.beginPath(); c.ellipse(-Lb * .1, 0, Lb * .12, H * .1, 0, 0, TAU); c.fill();
    c.restore();
    // eye
    var ex = hl - Lb * s.eyeU, ey = -H * .1, er = H * s.eyeR + .6;
    if (s.snout) ex += Lb * .02;
    c.fillStyle = f.c.iris; c.beginPath(); c.arc(ex, ey, er, 0, TAU); c.fill();
    c.fillStyle = col('#05070c', f.z); c.beginPath(); c.arc(ex + er * .08, ey, er * .62, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,255,255,.85)'; c.beginPath(); c.arc(ex + er * .3, ey - er * .3, er * .24, 0, TAU); c.fill();
    // mouth
    c.strokeStyle = f.cA.edge; c.lineWidth = .8;
    c.beginPath(); c.moveTo(_top[0] - .5, (_top[1] + _bot[1]) / 2 + H * .05); c.lineTo(_top[0] - Lb * .05, (_top[1] + _bot[1]) / 2 + H * .08); c.stroke();
    c.restore();
  };
  Fish.prototype.markings = function (c, hl, Lb, H, uP) {
    var f = this, n = f.spName;
    if (n === 'clown') {
      [.2, .5, .8].forEach(function (u, i) {
        var x = hl - u * uP * Lb, w = Lb * (i === 1 ? .1 : .085);
        c.fillStyle = f.c.mark; c.strokeStyle = f.c.edge; c.lineWidth = Lb * .018;
        c.beginPath(); c.ellipse(x, 0, w / 2, H * .75, i === 1 ? -.08 : 0, 0, TAU); c.fill(); c.stroke();
      });
    } else if (n === 'tang') {
      c.fillStyle = f.c.mark;
      c.beginPath();
      c.moveTo(hl - Lb * .16, -H * .26);
      c.bezierCurveTo(hl - Lb * .4, -H * .42, -hl * .5, -H * .5, -hl * .78, -H * .06);
      c.bezierCurveTo(-hl * .5, H * .2, hl - Lb * .5, H * .1, hl - Lb * .36, -H * .02);
      c.bezierCurveTo(hl - Lb * .45, -H * .12, -hl * .3, -H * .1, -hl * .45, -H * .2);
      c.bezierCurveTo(-hl * .2, -H * .32, hl - Lb * .3, -H * .22, hl - Lb * .16, -H * .26);
      c.fill();
    } else if (n === 'butterfly') {
      c.fillStyle = f.c.mark;
      var ex = hl - Lb * .22;
      c.beginPath(); c.ellipse(ex, -H * .02, Lb * .045, H * .6, .1, 0, TAU); c.fill();
      c.beginPath(); c.arc(-hl * .55, -H * .12, H * .1, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = H * .025; c.beginPath(); c.arc(-hl * .55, -H * .12, H * .12, 0, TAU); c.stroke();
      c.strokeStyle = col('#a8780a', f.z, .35); c.lineWidth = .8;
      c.beginPath(); for (var i = -4; i <= 6; i++) { c.moveTo(i * Lb * .08, -H * .6); c.lineTo(i * Lb * .08 - Lb * .2, H * .6); } c.stroke();
      c.fillStyle = col('#ffffff', f.z, .5); c.beginPath(); c.ellipse(hl - Lb * .08, H * .05, Lb * .07, H * .2, 0, 0, TAU); c.fill();
    } else if (n === 'anthias') {
      c.strokeStyle = col(f.sp.col.mark, f.z, .85); c.lineWidth = H * .07;
      c.beginPath(); c.moveTo(hl - Lb * .1, -H * .06); c.quadraticCurveTo(hl - Lb * .22, H * .1, hl - Lb * .34, H * .14); c.stroke();
    } else if (n === 'lion') {
      c.strokeStyle = col(f.sp.col.mark, f.z, .85); c.lineWidth = Lb * .028;
      c.beginPath();
      for (var k = 0; k < 9; k++) { var x = hl - Lb * (.08 + k * .085); c.moveTo(x, -H * .7); c.quadraticCurveTo(x - Lb * .03, 0, x, H * .7); }
      c.stroke();
    }
  };
  Fish.prototype.lionFins = function (c, hl, uP, Lb, H, ph) {
    var f = this;
    // feathery pectoral fans
    c.save();
    c.translate(hl - Lb * .3, H * .1);
    for (var k = 0; k < 7; k++) {
      var a = .5 + k * .2 + .06 * Math.sin(ph * .6 + k * .5);
      c.strokeStyle = col(k % 2 ? '#7a2638' : '#f3dccc', f.z, .8); c.lineWidth = Lb * .022;
      c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(-Math.cos(a) * Lb * .28, Math.sin(a) * Lb * .1, -Math.cos(a) * Lb * .5, Math.sin(a) * Lb * .36); c.stroke();
    }
    c.fillStyle = col('#e7b49c', f.z, .32);
    c.beginPath(); c.moveTo(0, 0); for (var j = 0; j < 7; j++) { var b = .5 + j * .2; c.lineTo(-Math.cos(b) * Lb * .48, Math.sin(b) * Lb * .34); } c.closePath(); c.fill();
    c.restore();
    // venomous dorsal spines with membranes
    for (var i = 0; i < 11; i++) {
      var u = .14 + i * .05, x = hl - u * uP * Lb, y0 = -H / 2 * prof(u, f.sp.ped);
      var len = H * (1.05 - i * .05) * (1 + .05 * Math.sin(ph * .5 + i));
      c.strokeStyle = col(i % 2 ? '#6a2032' : '#f5e2d2', f.z, .9); c.lineWidth = Lb * .014;
      c.beginPath(); c.moveTo(x, y0); c.quadraticCurveTo(x - Lb * .03, y0 - len * .5, x - Lb * .07, y0 - len); c.stroke();
    }
  };

  // ---- schools (boids around a wandering leader) ----------------------------------------------------
  function School(sp, n, o) {
    this.lead = new Fish(sp, o); this.lead.agility = .7;
    this.members = [];
    for (var i = 0; i < n; i++) {
      var m = new Fish(sp, { x: o.x + R(-40, 40) * U, y: o.y + R(-25, 25) * U, z: clamp(o.z + R(-.06, .06), 0, 1), size: R(.85, 1.12), anchor: o.anchors ? o.anchors[i] : null });
      m.school = this; m.off = { x: R(-1, 1), y: R(-1, 1), s: R(0, 100) };
      this.members.push(m);
    }
    this.simple = !!o.simple;
    this.spread = o.spread || 46;
  }
  School.prototype.update = function (dt, t) {
    var L = this.lead; L.update(dt, t);
    var ms = this.members, sp = this.spread * U * depthScale(L.z);
    for (var i = 0; i < ms.length; i++) {
      var m = ms[i];
      var ox = (m.off.x + .35 * noise(t * .2, m.off.s)) * sp, oy = (m.off.y + .35 * noise(t * .2, m.off.s + 4)) * sp * .55;
      var tx = L.x + ox - L.vx * .25, ty = L.y + oy;
      var dvx = (tx - m.x) * 1.1 + L.vx, dvy = (ty - m.y) * 1.1 + L.vy;
      // separation
      for (var j = 0; j < ms.length; j++) {
        if (j === i) continue;
        var dx = m.x - ms[j].x, dy = m.y - ms[j].y, d2 = dx * dx + dy * dy, lim = m.Lb * m.Lb * 1.4;
        if (d2 < lim && d2 > .01) { var k = (1 - d2 / lim) * m.cruise * 2.2 / Math.sqrt(d2); dvx += dx * k; dvy += dy * k; }
      }
      var max = m.cruise * (m.flee > 0 ? 3 : 1.7), sp2 = Math.hypot(dvx, dvy);
      if (sp2 > max) { dvx *= max / sp2; dvy *= max / sp2; }
      var ag = m.flee > 0 ? 5 : 2.6;
      m.vx += (dvx - m.vx) * Math.min(1, ag * dt); m.vy += (dvy - m.vy) * Math.min(1, ag * dt);
      if (m.flee > 0) m.flee -= dt;
      m.integrate(dt);
    }
  };
  School.prototype.scare = function (px, py, r) {
    var hit = false;
    this.members.forEach(function (m) { var d = Math.hypot(m.x - px, m.y - py); if (d < r) { m.scare(px, py, r); hit = true; } });
    if (hit || Math.hypot(this.lead.x - px, this.lead.y - py) < r * 1.3) this.lead.scare(px, py, r * 1.5);
  };
  School.prototype.draw = function (c, t) {
    if (this.simple) { for (var i = 0; i < this.members.length; i++) drawBait(c, this.members[i]); return; }
    for (var j = 0; j < this.members.length; j++) this.members[j].draw(c, t);
  };
  // distant silver bait fish: cheap, and they flash as they turn (the classic schooling glint)
  function drawBait(c, f) {
    var sx = Math.cos(f.yaw), side = sx >= 0 ? 1 : -1, ax = Math.max(Math.abs(sx), .22), Lb = f.Lb, H = f.H;
    c.save(); c.translate(f.x, f.y); c.rotate(side * f.pitch); c.scale(side * ax, 1);
    var a = Math.sin(f.phase) * f.amp, fl = .6 + .4 * Math.cos(a * 1.5);
    c.fillStyle = f.c.side;
    c.beginPath(); c.ellipse(Lb * .08, 0, Lb * .42, H / 2, 0, 0, TAU); c.fill();
    c.beginPath(); c.moveTo(-Lb * .3, 0); c.lineTo(-Lb * .3 - Lb * .22 * fl, -H * .45); c.lineTo(-Lb * .3 - Lb * .14 * fl, 0); c.lineTo(-Lb * .3 - Lb * .22 * fl, H * .45); c.closePath(); c.fill();
    var flash = Math.pow(1 - ax, 2) * 1.6 + .08 * (1 + Math.sin(f.phase * .3));
    if (flash > .05) { c.fillStyle = 'rgba(230,250,255,' + Math.min(.8, flash) + ')'; c.beginPath(); c.ellipse(Lb * .1, -H * .08, Lb * .32, H * .26, 0, 0, TAU); c.fill(); }
    c.restore();
  }

  // =================================================================================================
  // JELLYFISH
  // =================================================================================================
  function Rope(n, seg) { this.p = []; this.seg = seg; for (var i = 0; i < n; i++) this.p.push({ x: 0, y: 0, px: 0, py: 0 }); this.init = false; }
  Rope.prototype.update = function (ax, ay, dt, t, wave, s) {
    var p = this.p, g = 420 * U;
    if (!this.init) { for (var i = 0; i < p.length; i++) { p[i].x = p[i].px = ax; p[i].y = p[i].py = ay + i * this.seg; } this.init = true; }
    p[0].x = ax; p[0].y = ay;
    for (var j = 1; j < p.length; j++) {
      var q = p[j], vx = (q.x - q.px) * .9, vy = (q.y - q.py) * .9;
      q.px = q.x; q.py = q.y;
      q.x += vx + (current * 30 * U + Math.sin(t * 1.6 + j * .55 + s) * wave * 4) * dt * dt; q.y += vy + g * dt * dt;
    }
    for (var k = 1; k < p.length; k++) {
      var a = p[k - 1], b = p[k], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1;
      b.x = a.x + dx / d * this.seg; b.y = a.y + dy / d * this.seg;
    }
  };
  Rope.prototype.path = function (c) {
    var p = this.p; c.moveTo(p[0].x, p[0].y);
    for (var i = 1; i < p.length - 1; i++) c.quadraticCurveTo(p[i].x, p[i].y, (p[i].x + p[i + 1].x) / 2, (p[i].y + p[i + 1].y) / 2);
    c.lineTo(p[p.length - 1].x, p[p.length - 1].y);
  };

  function Jelly(o) {
    this.kind = 'jelly'; this.sp = o.sp; this.z = o.z;
    this.r = o.r * U * depthScale(o.z); this.x = o.x; this.y = o.y; this.vx = 0; this.vy = 0;
    this.phase = R(0, 1); this.period = o.sp === 'moon' ? R(1.9, 2.5) : R(2.4, 3.1); this.tilt = R(-.2, .2); this.c = 0;
    this.seed = R(0, 99); this.anchor = o.anchor || null; this.glow = 0;
    var r = this.r;
    this.arms = []; this.tents = [];
    var nArms = 4;
    for (var i = 0; i < nArms; i++) this.arms.push({ rope: new Rope(o.sp === 'moon' ? 8 : 12, r * (o.sp === 'moon' ? .16 : .3)), ox: (i - (nArms - 1) / 2) * r * .16 });
    var nT = o.sp === 'moon' ? 0 : 8;
    for (var k = 0; k < nT; k++) this.tents.push({ rope: new Rope(16, r * .32), ox: lerp(-.85, .85, k / (nT - 1)) * r });
    this.fr = []; for (var f = 0; f < 26; f++) this.fr.push(R(0, TAU));
    var cA = o.sp === 'moon' ? ['#ffffff', '#cfc4ff', '#8fd8ea'] : ['#fff1d6', '#ffb35c', '#d9672a'];
    this.cols = cA.map(function (h) { return hex(h); });
  }
  Jelly.prototype.update = function (dt, t) {
    var j = this;
    j.phase += dt / j.period; if (j.phase >= 1) j.phase -= 1;
    var p = j.phase, c = p < .24 ? Math.sin(p / .24 * PI / 2) : p < .74 ? Math.cos((p - .24) / .5 * PI / 2) : 0;
    var dc = (c - j.c) / Math.max(dt, .001); j.c = c;
    var want = noise(t * .07, j.seed) * .5;
    if (j.y < H * .16) want = j.x < W / 2 ? 1.25 : -1.25;
    else if (j.y > sandTop - H * .1) want = 0;
    if (j.x < W * .08) want = .7; if (j.x > W * .92) want = -.7;
    j.tilt += (want - j.tilt) * (1 - Math.exp(-.5 * dt));
    var room = clamp((j.y - H * .1) / (H * .12), 0, 1);  // stop climbing near the surface
    if (dc > 0) { var th = dc * j.r * 1.9 * dt * (Math.cos(j.tilt) > .3 ? room : 1); j.vx += Math.sin(j.tilt) * th; j.vy -= Math.cos(j.tilt) * th; }
    var drag = Math.exp(-1.5 * dt); j.vx *= drag; j.vy *= drag;
    j.vy += 7 * U * depthScale(j.z) * dt;  // sinks slowly between pulses
    j.vx += current * 5 * U * depthScale(j.z) * dt;
    j.x += j.vx * dt; j.y += j.vy * dt;
    // ropes hang from the underside of the bell
    var ca = Math.cos(j.tilt), sa = Math.sin(j.tilt), r = j.r, bw = r * (1 - .17 * c);
    j.arms.forEach(function (a, i) { var lx = a.ox, ly = r * .06; a.rope.update(j.x + lx * ca - ly * sa, j.y + lx * sa + ly * ca, dt, t, 6 * U, i * 1.7 + j.seed); });
    j.tents.forEach(function (tt, i) { var lx = tt.ox / r * bw * .92, ly = r * .02; tt.rope.update(j.x + lx * ca - ly * sa, j.y + lx * sa + ly * ca, dt, t, 9 * U, i * .9 + j.seed); });
    j.glow += ((interest(j.anchor) ? 1 : 0) - j.glow) * Math.min(1, dt * 4);
    moveAnchor(j.anchor, j.x, j.y - r * .3);
  };
  Jelly.prototype.scare = function (px, py, rr) {
    var dx = this.x - px, dy = this.y - py, d = Math.hypot(dx, dy);
    if (d < rr) { this.vx += dx / Math.max(d, 1) * 30 * U; this.vy += dy / Math.max(d, 1) * 20 * U; }
  };
  Jelly.prototype.draw = function (c, t) {
    var j = this, r = j.r, z = j.z, cl = j.cols, k = j.c;
    drawGlow(c, j.x, j.y - r * .4, r * 2.2, j.glow);
    // soft bioluminescent halo
    var halo = c.createRadialGradient(j.x, j.y - r * .35, 0, j.x, j.y - r * .35, r * 1.7);
    halo.addColorStop(0, col(cl[1], z, .16)); halo.addColorStop(1, col(cl[1], z, 0));
    c.globalCompositeOperation = 'lighter'; c.fillStyle = halo; c.fillRect(j.x - r * 1.7, j.y - r * 2.1, r * 3.4, r * 3.4); c.globalCompositeOperation = 'source-over';
    // long tentacles and oral arms (behind the translucent bell)
    c.lineCap = 'round';
    if (j.tents.length) {
      c.strokeStyle = col(cl[1], z, .42); c.lineWidth = Math.max(.7, r * .028);
      c.beginPath(); j.tents.forEach(function (tt) { tt.rope.path(c); }); c.stroke();
    }
    j.arms.forEach(function (a, i) {
      c.strokeStyle = col(j.sp === 'moon' ? cl[0] : cl[1], z, j.sp === 'moon' ? .28 : .34); c.lineWidth = r * (j.sp === 'moon' ? .16 : .2);
      c.beginPath(); a.rope.path(c); c.stroke();
      c.strokeStyle = col(cl[0], z, .3); c.lineWidth = Math.max(.6, r * .035);
      c.beginPath(); var p = a.rope.p;
      c.moveTo(p[0].x, p[0].y);
      for (var q = 1; q < p.length; q++) c.lineTo(p[q].x + Math.sin(t * 3 + q * 1.3 + i) * r * .06, p[q].y);
      c.stroke();
    });
    // bell
    c.save(); c.translate(j.x, j.y); c.rotate(j.tilt);
    var bw = r * (1 - .17 * k), bh = r * (.66 + .2 * k), curl = r * (.1 + .12 * k);
    if (!j.bellG || j._bw !== Math.round(bw)) {
      j._bw = Math.round(bw);
      j.bellG = c.createRadialGradient(0, -bh * .55, r * .05, 0, -bh * .3, r * 1.15);
      j.bellG.addColorStop(0, col(cl[0], z, .42)); j.bellG.addColorStop(.55, col(cl[1], z, .3)); j.bellG.addColorStop(1, col(cl[2], z, .5));
    }
    c.beginPath();
    c.moveTo(-bw, 0);
    c.bezierCurveTo(-bw, -bh * 1.18, bw, -bh * 1.18, bw, 0);
    // scalloped margin curling inward
    var lap = 12;
    for (var i = 1; i <= lap; i++) {
      var x0 = bw - 2 * bw * (i - .5) / lap, x1 = bw - 2 * bw * i / lap;
      var yy = -curl * (1 - Math.pow(x1 / bw, 2));
      c.quadraticCurveTo(x0, -curl * (1 - Math.pow(x0 / bw, 2)) + r * .07, x1, yy);
    }
    c.closePath();
    c.fillStyle = j.bellG; c.fill();
    c.globalCompositeOperation = 'lighter';
    c.strokeStyle = col(cl[0], z, .35); c.lineWidth = Math.max(.8, r * .04); c.stroke();
    c.globalCompositeOperation = 'source-over';
    if (j.sp === 'moon') {
      // four gonad rings — the moon jelly's signature
      c.strokeStyle = col('#e9a6ff', z, .55); c.lineWidth = r * .07;
      [[-.32, -.32], [-.11, -.5], [.11, -.5], [.32, -.32]].forEach(function (g) {
        c.beginPath(); c.arc(g[0] * bw, g[1] * bh, r * .12, .2 * PI, 1.8 * PI); c.stroke();
      });
      // fine fringe tentacles
      c.strokeStyle = col(cl[0], z, .32); c.lineWidth = .6;
      c.beginPath();
      for (var f = 0; f < j.fr.length; f++) {
        var fx = lerp(-bw * .96, bw * .96, f / (j.fr.length - 1)), fy = -curl * (1 - Math.pow(fx / bw, 2)) + r * .04;
        var sw = Math.sin(t * 2.2 + j.fr[f]) * r * .1 - j.vx * .02;
        c.moveTo(fx, fy); c.quadraticCurveTo(fx + sw * .5, fy + r * .22, fx + sw, fy + r * (.38 + .1 * k));
      }
      c.stroke();
    } else {
      // sea nettle: radial stripes on an amber bell
      c.strokeStyle = col('#b24a1c', z, .3); c.lineWidth = r * .05;
      c.beginPath();
      for (var s = -5; s <= 5; s++) { var e = s / 5.5; c.moveTo(e * bw * .25, -bh * .95); c.quadraticCurveTo(e * bw * .7, -bh * .7, e * bw * .98, -curl * (1 - e * e) - r * .02); }
      c.stroke();
    }
    // specular highlight on the dome
    c.fillStyle = 'rgba(255,255,255,' + (.28 * (1 - z * .6)) + ')';
    c.beginPath(); c.ellipse(-bw * .32, -bh * .72, bw * .28, bh * .14, -.35, 0, TAU); c.fill();
    c.restore();
  };

  // =================================================================================================
  // SEA TURTLE (rows with long front-flipper strokes)
  // =================================================================================================
  function Turtle(o) {
    this.kind = 'turtle'; this.z = o.z; this.Lb = 92 * U * depthScale(o.z);
    this.x = o.x; this.y = o.y; this.vx = 1; this.vy = 0; this.yaw = 0; this.yawT = 0; this.pitch = 0;
    this.phase = 0; this.cruise = 20 * U * depthScale(o.z); this.anchor = o.anchor; this.glow = 0;
    this.target = null; this.retarget = 0; this.flee = 0;
    this.cells = [];
    for (var i = 0; i < 13; i++) this.cells.push({ x: R(-.36, .36), y: R(-.22, .22), r: R(.07, .11) });
  }
  Turtle.prototype.update = function (dt, t) {
    var tu = this;
    tu.retarget -= dt;
    if (!tu.target || tu.retarget <= 0 || Math.abs(tu.target.x - tu.x) < tu.Lb) {
      tu.target = { x: tu.x < W / 2 ? W * R(.95, 1.3) : -W * R(.05, .3), y: H * R(.22, .5) };
      tu.retarget = R(20, 34);
    }
    tu.phase += dt * TAU / 3.2;
    var stroke = Math.max(0, -Math.cos(tu.phase));           // thrust on the down-stroke
    var dx = tu.target.x - tu.x, dy = tu.target.y - tu.y, d = Math.hypot(dx, dy) || 1;
    var sp = tu.cruise * (.55 + .9 * stroke) * (tu.flee > 0 ? 2.2 : 1);
    tu.vx += (dx / d * sp - tu.vx) * Math.min(1, dt * .9);
    tu.vy += (dy / d * sp * .4 - tu.vy) * Math.min(1, dt * .9);
    if (tu.flee > 0) tu.flee -= dt;
    tu.x += tu.vx * dt; tu.y += tu.vy * dt + Math.sin(tu.phase) * .06 * U;
    if (tu.vx > 2) tu.yawT = 0; else if (tu.vx < -2) tu.yawT = PI;
    tu.yaw += clamp(tu.yawT - tu.yaw, -1.3 * dt, 1.3 * dt);
    tu.pitch += (clamp(Math.atan2(tu.vy, Math.abs(tu.vx) + 8), -.3, .3) - tu.pitch) * Math.min(1, dt * 2);
    tu.glow += ((interest(tu.anchor) ? 1 : 0) - tu.glow) * Math.min(1, dt * 4);
    moveAnchor(tu.anchor, tu.x, tu.y);
  };
  Turtle.prototype.scare = function (px, py, r) { if (Math.hypot(this.x - px, this.y - py) < r) this.flee = 2; };
  Turtle.prototype.draw = function (c, t) {
    var tu = this, Lb = tu.Lb, z = tu.z, sx = Math.cos(tu.yaw), side = sx >= 0 ? 1 : -1, ax = Math.max(Math.abs(sx), .25);
    var rx = Lb * .5, ry = Lb * .3, s = Math.sin(tu.phase);
    drawGlow(c, tu.x, tu.y, Lb, tu.glow);
    c.save(); c.translate(tu.x, tu.y); c.rotate(side * tu.pitch); c.scale(side * ax, 1);
    function flipper(bx, by, ang, len, wid, color) {
      c.save(); c.translate(bx, by); c.rotate(ang);
      c.fillStyle = color;
      c.beginPath(); c.moveTo(0, -wid * .5);
      c.bezierCurveTo(len * .35, -wid * .9, len * .8, -wid * .35, len, wid * .15);
      c.bezierCurveTo(len * .7, wid * .25, len * .3, wid * .7, 0, wid * .5);
      c.closePath(); c.fill();
      c.strokeStyle = col('#e8e0c0', z, .35); c.lineWidth = .8;
      c.beginPath(); c.moveTo(len * .12, -wid * .45); c.bezierCurveTo(len * .4, -wid * .75, len * .75, -wid * .3, len * .95, wid * .1); c.stroke();
      c.restore();
    }
    var farCol = col('#4f5a3a', z), nearCol = col('#7b8656', z);
    // far-side flippers (behind the shell)
    flipper(rx * .45, -ry * .45, -2.2 + s * .75, Lb * .5, Lb * .13, farCol);
    flipper(-rx * .78, -ry * .35, -2.7 + s * .2, Lb * .2, Lb * .09, farCol);
    // head + neck
    c.fillStyle = col('#8c8a5a', z);
    c.beginPath(); c.ellipse(rx * .98, ry * .05, Lb * .14, Lb * .085, .1 + s * .04, 0, TAU); c.fill();
    c.fillStyle = col('#9a9664', z);
    c.beginPath(); c.ellipse(rx * 1.2, ry * .02, Lb * .15, Lb * .1, 0, 0, TAU); c.fill();
    c.strokeStyle = col('#4a4a2a', z, .5); c.lineWidth = .8;
    c.beginPath(); c.moveTo(rx * 1.12, -ry * .2); c.lineTo(rx * 1.2, ry * .02); c.lineTo(rx * 1.1, ry * .22); c.moveTo(rx * 1.2, ry * .02); c.lineTo(rx * 1.3, -ry * .15); c.stroke();
    c.fillStyle = col('#1a1a12', z); c.beginPath(); c.arc(rx * 1.28, -ry * .07, Lb * .018 + .5, 0, TAU); c.fill();
    c.strokeStyle = col('#3a3a1e', z, .7); c.beginPath(); c.moveTo(rx * 1.34, ry * .1); c.quadraticCurveTo(rx * 1.27, ry * .16, rx * 1.2, ry * .12); c.stroke();
    // shell: domed, tortoiseshell scutes
    if (!tu.shellG) {
      tu.shellG = c.createRadialGradient(-rx * .15, -ry * .45, 0, 0, 0, rx * 1.05);
      tu.shellG.addColorStop(0, col('#b49a5a', z)); tu.shellG.addColorStop(.55, col('#6e5530', z)); tu.shellG.addColorStop(1, col('#3a2a16', z));
    }
    c.fillStyle = tu.shellG; c.beginPath(); c.ellipse(0, 0, rx, ry, 0, 0, TAU); c.fill();
    c.save(); c.clip();
    for (var i = 0; i < tu.cells.length; i++) {
      var ce = tu.cells[i], cx = ce.x * Lb, cy = ce.y * Lb, cr = ce.r * Lb;
      var g = c.createRadialGradient(cx, cy, 0, cx, cy, cr);
      g.addColorStop(0, col('#e0b860', z, .5)); g.addColorStop(1, col('#e0b860', z, 0));
      c.fillStyle = g; c.fillRect(cx - cr, cy - cr, cr * 2, cr * 2);
    }
    c.strokeStyle = col('#2a1c0c', z, .55); c.lineWidth = Lb * .012;
    c.beginPath();
    c.moveTo(-rx * .9, -ry * .05); c.bezierCurveTo(-rx * .3, -ry * .3, rx * .3, -ry * .3, rx * .9, -ry * .05);
    c.moveTo(-rx * .85, ry * .4); c.bezierCurveTo(-rx * .3, ry * .2, rx * .3, ry * .2, rx * .85, ry * .4);
    for (var k = -2; k <= 2; k++) { var xx = k * rx * .32; c.moveTo(xx, -ry); c.quadraticCurveTo(xx + rx * .06, -ry * .15, xx - rx * .02, ry); }
    c.stroke();
    c.strokeStyle = col('#d8c890', z, .25); c.lineWidth = Lb * .03;
    c.beginPath(); c.ellipse(0, 0, rx * .96, ry * .93, 0, 0, TAU); c.stroke();
    c.fillStyle = 'rgba(255,255,255,' + (.12 * (1 - z)) + ')'; c.beginPath(); c.ellipse(-rx * .1, -ry * .55, rx * .55, ry * .22, 0, 0, TAU); c.fill();
    c.restore();
    // plastron edge
    c.strokeStyle = col('#c9b880', z, .5); c.lineWidth = Lb * .02;
    c.beginPath(); c.ellipse(0, ry * .06, rx * .98, ry * .96, 0, .1 * PI, .9 * PI); c.stroke();
    // near-side flippers
    flipper(-rx * .78, ry * .45, 2.5 - s * .2, Lb * .22, Lb * .1, nearCol);
    flipper(rx * .42, ry * .45, .55 - s * .8, Lb * .55, Lb * .15, nearCol);
    c.restore();
  };

  // =================================================================================================
  // SPOTTED EAGLE RAY (flaps with a wave running out to the wing tips)
  // =================================================================================================
  function Ray(o) {
    this.kind = 'ray'; this.z = o.z; this.span = 120 * U * depthScale(o.z); this.Lb = this.span * .55;
    this.x = o.x; this.y = o.y; this.vx = 1; this.vy = 0; this.yaw = 0; this.yawT = 0;
    this.phase = 0; this.cruise = 26 * U * depthScale(o.z); this.anchor = o.anchor; this.glow = 0; this.target = null; this.retarget = 0; this.flap = 1;
    this.spots = []; for (var i = 0; i < 34; i++) this.spots.push({ x: R(-.32, .32), s: R(.08, .95) * (rnd() < .5 ? -1 : 1) });
  }
  Ray.prototype.update = function (dt, t) {
    var ry = this;
    ry.retarget -= dt;
    if (!ry.target || ry.retarget <= 0 || Math.abs(ry.target.x - ry.x) < ry.span * .5) { ry.target = { x: ry.x < W / 2 ? W * R(1, 1.35) : -W * R(.1, .35), y: H * R(.12, .36) }; ry.retarget = R(18, 30); }
    var glide = noise(t * .12, 41) > .35;                       // occasional long glides
    ry.flap += ((glide ? .15 : 1) - ry.flap) * Math.min(1, dt * .8);
    ry.phase += dt * TAU / 3.6 * (.5 + .5 * ry.flap);
    var dx = ry.target.x - ry.x, dy = ry.target.y - ry.y, d = Math.hypot(dx, dy) || 1;
    var sp = ry.cruise * (.8 + .4 * ry.flap * Math.max(0, Math.sin(ry.phase)));
    ry.vx += (dx / d * sp - ry.vx) * Math.min(1, dt * .6); ry.vy += (dy / d * sp * .35 - ry.vy) * Math.min(1, dt * .6);
    ry.x += ry.vx * dt; ry.y += ry.vy * dt - Math.cos(ry.phase) * ry.flap * .05 * U;
    if (ry.vx > 2) ry.yawT = 0; else if (ry.vx < -2) ry.yawT = PI;
    ry.yaw += clamp(ry.yawT - ry.yaw, -1.1 * dt, 1.1 * dt);
    ry.glow += ((interest(ry.anchor) ? 1 : 0) - ry.glow) * Math.min(1, dt * 4);
    moveAnchor(ry.anchor, ry.x, ry.y);
  };
  Ray.prototype.scare = function () {};
  Ray.prototype.draw = function (c, t) {
    var ry = this, half = ry.span / 2, Lb = ry.Lb, z = ry.z, ph = ry.phase, A = ry.flap;
    var sx = Math.cos(ry.yaw), side = sx >= 0 ? 1 : -1, ax = Math.max(Math.abs(sx), .25);
    // project a point from top-view (x forward, s = span fraction -1..1) to the screen
    function P(x, s) { var a = Math.abs(s); return [x, s * half * .36 - Math.sin(ph - a * 1.3) * Math.pow(a, 1.4) * half * .5 * A]; }
    drawGlow(c, ry.x, ry.y, half, ry.glow);
    c.save(); c.translate(ry.x, ry.y); c.scale(side * ax, 1);
    // whip tail
    c.strokeStyle = col('#1d2a3a', z, .85); c.lineWidth = 1.2; c.beginPath(); c.moveTo(-Lb * .42, 0);
    for (var i = 1; i <= 10; i++) c.lineTo(-Lb * .42 - i * Lb * .14, Math.sin(t * 2.1 - i * .5) * i * .8 * U * depthScale(z));
    c.stroke();
    // body + wings (far wing first so it reads darker)
    var wing = function (sg, fill) {
      var pts = [];
      var lead = [[Lb * .38, .05], [Lb * .3, .3], [Lb * .14, .62], [-Lb * .02, .9], [-Lb * .1, 1]];
      var trail = [[-Lb * .2, .78], [-Lb * .3, .45], [-Lb * .38, .18], [-Lb * .44, 0]];
      lead.forEach(function (p) { pts.push(P(p[0], p[1] * sg)); });
      trail.forEach(function (p) { pts.push(P(p[0], p[1] * sg)); });
      c.fillStyle = fill; c.beginPath(); c.moveTo(Lb * .45, 0);
      var flat = []; pts.forEach(function (p) { flat.push(p[0], p[1]); });
      smooth(c, flat, false); c.closePath(); c.fill();
      return pts;
    };
    wing(-1, col('#18222f', z));
    if (!ry.g) { ry.g = c.createLinearGradient(0, -half * .3, 0, half * .5); ry.g.addColorStop(0, col('#2c3e55', z)); ry.g.addColorStop(1, col('#141c27', z)); }
    wing(1, ry.g);
    // white spots ride on the near wing
    c.fillStyle = col('#eef6ff', z, .85);
    for (var k = 0; k < ry.spots.length; k++) {
      var sp = ry.spots[k]; if (sp.s < 0) continue;
      var p = P(sp.x * Lb, sp.s * .92); c.beginPath(); c.arc(p[0], p[1], Math.max(.7, half * .025), 0, TAU); c.fill();
    }
    // head with the duck-bill snout
    c.fillStyle = col('#24344a', z);
    c.beginPath(); c.ellipse(Lb * .44, 0, Lb * .14, half * .1, 0, 0, TAU); c.fill();
    c.fillStyle = col('#33475f', z); c.beginPath(); c.ellipse(Lb * .58, half * .01, Lb * .08, half * .05, 0, 0, TAU); c.fill();
    c.restore();
  };

  // =================================================================================================
  // PUFFERFISH (hovers on fluttering fins, inflates when startled)
  // =================================================================================================
  function Puffer(o) {
    this.kind = 'puffer'; this.z = o.z; this.r = 17 * U * depthScale(o.z); this.x = o.x; this.y = o.y; this.vx = 0; this.vy = 0;
    this.yaw = 0; this.yawT = 0; this.inf = 0; this.infT = 0; this.infUntil = 0; this.nextPuff = R(14, 26);
    this.home = o.home; this.target = null; this.retarget = 0; this.anchor = o.anchor; this.glow = 0; this.ph = 0;
    this.spots = []; for (var i = 0; i < 22; i++) { var a = R(0, TAU), d = Math.sqrt(R(0, 1)); this.spots.push({ x: Math.cos(a) * d, y: Math.sin(a) * d * .8 - .1, r: R(.05, .09) }); }
  }
  Puffer.prototype.update = function (dt, t) {
    var p = this;
    p.nextPuff -= dt;
    if (p.nextPuff <= 0) { p.puff(); p.nextPuff = R(22, 40); }
    if (p.infT > 0 && t > p.infUntil) p.infT = 0;
    p.inf += (p.infT - p.inf) * Math.min(1, dt * (p.infT > p.inf ? 5 : .9));
    p.retarget -= dt;
    if (!p.target || p.retarget <= 0) { p.target = { x: p.home.x + R(-1, 1) * p.home.r, y: p.home.y + R(-.6, .6) * p.home.r * .6 }; p.retarget = R(3, 7); }
    var dx = p.target.x - p.x, dy = p.target.y - p.y, d = Math.hypot(dx, dy) || 1, sp = 16 * U * depthScale(p.z) * Math.min(1, d / (p.r * 3)) * (1 - p.inf * .8);
    p.vx += (dx / d * sp - p.vx) * Math.min(1, dt * 1.2); p.vy += (dy / d * sp - p.vy) * Math.min(1, dt * 1.2) - p.inf * 2 * U * dt;
    p.x += p.vx * dt; p.y += p.vy * dt;
    if (p.vx > 3) p.yawT = 0; else if (p.vx < -3) p.yawT = PI;
    p.yaw += clamp(p.yawT - p.yaw, -2.4 * dt, 2.4 * dt);
    p.ph += dt;
    p.glow += ((interest(p.anchor) ? 1 : 0) - p.glow) * Math.min(1, dt * 4);
    moveAnchor(p.anchor, p.x, p.y);
  };
  Puffer.prototype.puff = function () { this.infT = 1; this.infUntil = T + 3.2; };
  Puffer.prototype.scare = function (px, py, r) { if (Math.hypot(this.x - px, this.y - py) < r) this.puff(); };
  Puffer.prototype.draw = function (c, t) {
    var p = this, z = p.z, inf = p.inf, r = p.r * (1 + .55 * inf), sx = Math.cos(p.yaw), side = sx >= 0 ? 1 : -1, ax = Math.max(Math.abs(sx), .55 + .4 * inf);
    var bw = r * (1.25 - .25 * inf), bh = r * (.85 + .15 * inf);
    drawGlow(c, p.x, p.y, r * 2.2, p.glow);
    c.save(); c.translate(p.x, p.y); c.scale(side * ax, 1);
    // tail + fins flutter fast (hovering)
    c.fillStyle = col('#d8b878', z, .8);
    var tw = Math.sin(p.ph * 9) * .35;
    c.beginPath(); c.moveTo(-bw * .9, 0); c.lineTo(-bw * 1.35, -bh * .45 + tw * bh * .3); c.quadraticCurveTo(-bw * 1.2, 0, -bw * 1.35, bh * .45 + tw * bh * .3); c.closePath(); c.fill();
    c.beginPath(); c.ellipse(-bw * .55, -bh * .9, bw * .18, bh * .14, -.6 + Math.sin(p.ph * 11) * .3, 0, TAU); c.fill();
    // spines (only when inflated)
    if (inf > .05) {
      c.strokeStyle = col('#7a5c2c', z, .85 * inf); c.lineWidth = Math.max(.8, r * .05);
      c.beginPath();
      for (var k = 0; k < 28; k++) { var a = k / 28 * TAU, cx = Math.cos(a) * bw, cy = Math.sin(a) * bh; c.moveTo(cx * .92, cy * .92); c.lineTo(cx * (1 + .22 * inf), cy * (1 + .22 * inf)); }
      c.stroke();
    }
    if (!p.g || Math.abs(p._r - r) > .5) {
      p._r = r;
      p.g = c.createRadialGradient(-bw * .2, -bh * .4, r * .1, 0, 0, r * 1.25);
      p.g.addColorStop(0, col('#fff4d6', z)); p.g.addColorStop(.6, col('#e2c486', z)); p.g.addColorStop(1, col('#a8834a', z));
    }
    c.fillStyle = p.g; c.beginPath(); c.ellipse(0, 0, bw, bh, 0, 0, TAU); c.fill();
    c.save(); c.clip();
    c.fillStyle = col('#ffffff', z, .55); c.beginPath(); c.ellipse(bw * .1, bh * .75, bw * .9, bh * .45, 0, 0, TAU); c.fill();
    c.fillStyle = col('#4a3416', z, .75);
    p.spots.forEach(function (s) { if (s.y > .45) return; c.beginPath(); c.arc(s.x * bw, s.y * bh, s.r * r, 0, TAU); c.fill(); });
    c.restore();
    // pectoral fin whirring
    c.fillStyle = col('#e9d29e', z, .7);
    c.save(); c.translate(bw * .05, bh * .15); c.rotate(.6 + Math.sin(p.ph * 16) * .5);
    c.beginPath(); c.ellipse(-r * .2, 0, r * .25, r * .1, 0, 0, TAU); c.fill(); c.restore();
    // big eye + little beak
    var ex = bw * .5, ey = -bh * .25, er = r * .22;
    c.fillStyle = col('#9dd46a', z); c.beginPath(); c.arc(ex, ey, er, 0, TAU); c.fill();
    c.fillStyle = col('#050805', z); c.beginPath(); c.arc(ex + er * .1, ey, er * .6, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,255,255,.85)'; c.beginPath(); c.arc(ex + er * .35, ey - er * .32, er * .22, 0, TAU); c.fill();
    c.fillStyle = col('#c79a5a', z); c.beginPath(); c.ellipse(bw * .98, bh * .12, r * .1, r * .08, 0, 0, TAU); c.fill();
    c.restore();
  };

  // =================================================================================================
  // CRAB (walks sideways on alternating legs)
  // =================================================================================================
  function Crab(o) {
    this.kind = 'crab'; this.z = o.z; this.s = 22 * U * depthScale(o.z); this.x = o.x; this.dir = 1;
    this.state = 'walk'; this.timer = R(2, 4); this.gait = 0; this.claw = 0; this.clawT = 0; this.anchor = o.anchor; this.glow = 0; this.speed = 0;
  }
  Crab.prototype.y = function () { return sandTop + sandH * .55; };
  Crab.prototype.update = function (dt, t) {
    var cr = this;
    cr.timer -= dt;
    if (cr.timer <= 0) {
      if (cr.state === 'walk') { cr.state = rnd() < .3 ? 'wave' : 'rest'; cr.timer = R(1.2, 3); }
      else { cr.state = 'walk'; cr.timer = R(2, 5); if (rnd() < .45) cr.dir *= -1; }
    }
    if (cr.x < W * .08) cr.dir = 1; if (cr.x > W * .92) cr.dir = -1;
    var want = cr.state === 'walk' || cr.state === 'flee' ? 30 * U * depthScale(cr.z) * (cr.state === 'flee' ? 2.6 : 1) : 0;
    cr.speed += (want - cr.speed) * Math.min(1, dt * 6);
    cr.x += cr.dir * cr.speed * dt;
    cr.gait += cr.speed * dt / (cr.s * .35);
    cr.clawT = cr.state === 'wave' || cr.state === 'flee' ? 1 : 0;
    cr.claw += (cr.clawT - cr.claw) * Math.min(1, dt * 5);
    cr.glow += ((interest(cr.anchor) ? 1 : 0) - cr.glow) * Math.min(1, dt * 4);
    moveAnchor(cr.anchor, cr.x, cr.y() - cr.s * .3);
  };
  Crab.prototype.scare = function (px, py, r) {
    if (Math.abs(this.x - px) < r && Math.abs(this.y() - py) < r) { this.state = 'flee'; this.timer = 1.4; this.dir = this.x > px ? 1 : -1; }
  };
  Crab.prototype.draw = function (c, t) {
    var cr = this, s = cr.s, z = cr.z, x = cr.x, y = cr.y();
    var bob = Math.abs(Math.sin(cr.gait * PI)) * s * .04;
    drawGlow(c, x, y - s * .3, s * 1.6, cr.glow);
    // shadow on the sand
    c.fillStyle = 'rgba(0,20,30,.22)'; c.beginPath(); c.ellipse(x, y + s * .3, s * 1.1, s * .18, 0, 0, TAU); c.fill();
    var by = y - s * .32 - bob;
    c.strokeStyle = col('#b0381c', z); c.lineCap = 'round'; c.lineWidth = s * .09;
    // four legs per side, alternating
    for (var sd = -1; sd <= 1; sd += 2) {
      for (var i = 0; i < 4; i++) {
        var lift = Math.max(0, Math.sin(cr.gait * PI + i * PI / 2 + (sd > 0 ? PI : 0))) * s * .18;
        var hx = x + sd * s * (.45 + i * .06), hy = by + s * (.0 + i * .06);
        var kx = hx + sd * s * (.32 + i * .05), ky = hy - s * (.22 - i * .03) - lift;
        var fx = hx + sd * s * (.5 + i * .12) - cr.dir * Math.sin(cr.gait * PI + i) * s * .06, fy = y + s * .25 - lift * .6;
        c.beginPath(); c.moveTo(hx, hy); c.lineTo(kx, ky); c.lineTo(fx, fy); c.stroke();
      }
    }
    // claws (raised when waving)
    for (var cs = -1; cs <= 1; cs += 2) {
      var raise = cr.claw * (1 + .3 * Math.sin(t * 7 + cs));
      var ax0 = x + cs * s * .42, ay0 = by - s * .05;
      var ex = x + cs * s * (.7 + .1 * raise), ey = by - s * (.3 + .55 * raise);
      c.lineWidth = s * .11; c.beginPath(); c.moveTo(ax0, ay0); c.lineTo(ex, ey); c.stroke();
      c.fillStyle = col('#d84a24', z);
      c.save(); c.translate(ex, ey); c.rotate(cs * (.4 - raise * .6));
      c.beginPath(); c.ellipse(0, -s * .12, s * .16, s * .22, 0, 0, TAU); c.fill();
      c.fillStyle = col('#f4d2b8', z); c.beginPath(); c.ellipse(cs * s * .03, -s * .3, s * .05, s * .1, cs * .3, 0, TAU); c.fill();
      c.restore();
    }
    // carapace
    if (!cr.g) { cr.g = c.createRadialGradient(x, by - s * .2, 0, x, by, s * .7); }
    var g = c.createRadialGradient(x - s * .1, by - s * .2, s * .05, x, by, s * .75);
    g.addColorStop(0, col('#ff8a5a', z)); g.addColorStop(1, col('#a8301a', z));
    c.fillStyle = g; c.beginPath(); c.ellipse(x, by, s * .6, s * .38, 0, 0, TAU); c.fill();
    c.fillStyle = col('#ffd0b0', z, .35);
    for (var d = 0; d < 6; d++) { c.beginPath(); c.arc(x + (d - 2.5) * s * .16, by - s * .1 + (d % 2) * s * .1, s * .04, 0, TAU); c.fill(); }
    // eye stalks
    c.strokeStyle = col('#b0381c', z); c.lineWidth = s * .06;
    for (var e = -1; e <= 1; e += 2) {
      var sway = Math.sin(t * 1.7 + e) * s * .03;
      c.beginPath(); c.moveTo(x + e * s * .14, by - s * .3); c.lineTo(x + e * s * .18 + sway, by - s * .55); c.stroke();
      c.fillStyle = '#0b0b0b'; c.beginPath(); c.arc(x + e * s * .18 + sway, by - s * .58, s * .07, 0, TAU); c.fill();
      c.fillStyle = 'rgba(255,255,255,.8)'; c.beginPath(); c.arc(x + e * s * .18 + sway - s * .02, by - s * .6, s * .022, 0, TAU); c.fill();
    }
  };


  // =================================================================================================
  // 44.5 ANGLERFISH: cruises slowly in the deep with its glowing lure bobbing ahead of its big toothy
  // mouth; the lure flickers, and now and then flares bright and the jaw snaps.
  // =================================================================================================
  function Angler(o) {
    this.kind = 'angler'; this.z = o.z; this.s = 44 * U * depthScale(o.z); this.x = o.x; this.y = o.y; this.y0 = o.y;
    this.dir = 1; this.vx = 0; this.mouth = 0; this.mouthT = 0; this.flash = 0; this.nextSnap = R(5, 9); this.ph = R(0, TAU); this.tail = 0;
  }
  Angler.prototype.update = function (dt, t) {
    var a = this, want = 16 * U * depthScale(a.z) * (a.flee > 0 ? 3 : 1);
    if (a.x < W * .12) a.dir = 1; if (a.x > W * .88) a.dir = -1;
    a.vx += (a.dir * want - a.vx) * Math.min(1, dt * 1.5);
    a.x += a.vx * dt; a.y = a.y0 + Math.sin(t * .4 + a.ph) * 14 * U;
    a.tail += dt * (2 + Math.abs(a.vx) * .08);
    if (a.flee > 0) a.flee -= dt;
    a.nextSnap -= dt;
    if (a.nextSnap <= 0) { a.mouthT = 1; a.flash = 1; a.nextSnap = R(6, 11); setTimeout(function () { a.mouthT = 0; }, 450); }
    a.mouth += (a.mouthT - a.mouth) * Math.min(1, dt * 10);
    a.flash = Math.max(0, a.flash - dt * 1.3);
  };
  Angler.prototype.scare = function (px, py, r) { if (Math.hypot(this.x - px, this.y - py) < r) this.poke(); };
  Angler.prototype.poke = function () {
    var a = this; a.flash = 1; a.mouthT = 1; a.flee = .8; setTimeout(function () { a.mouthT = 0; }, 500);
    for (var b = 0; b < 5; b++) spawnBubble(a.x + a.dir * a.s * .8, a.y + R(-6, 6), R(1.5, 3.5) * U);
  };
  Angler.prototype.lure = function (t) {   // the glowing bulb, dangling in front of the mouth
    var a = this, s = a.s, bob = Math.sin(t * 2.1 + a.ph) * s * .07, sw = Math.sin(t * 1.3 + a.ph) * s * .05;
    return { x: a.x + a.dir * (s * 1.12 + sw), y: a.y - s * .42 + bob };
  };
  Angler.prototype.draw = function (c, t) {
    // a deep-sea anglerfish: an enormous head on a short tapering body, a huge up-turned mouth with an
    // under-bite and long needle fangs, tiny eyes high up, rough dark skin, and the rod over the head
    // with its glowing lure hanging right in front of the mouth
    var a = this, s = a.s, z = a.z, L = a.lure(t);
    var flick = .65 + .25 * Math.sin(t * 7.3 + a.ph) + .1 * Math.sin(t * 17 + a.ph * 2), I = Math.min(1.4, flick + a.flash * 1.2);
    var gR = s * (1.25 + a.flash * .9), g = c.createRadialGradient(L.x, L.y, 0, L.x, L.y, gR);
    g.addColorStop(0, 'rgba(200,255,240,' + (.75 * I).toFixed(3) + ')'); g.addColorStop(.3, 'rgba(140,240,230,' + (.25 * I).toFixed(3) + ')'); g.addColorStop(1, 'rgba(120,220,255,0)');
    c.fillStyle = g; c.beginPath(); c.arc(L.x, L.y, gR, 0, TAU); c.fill();
    c.save(); c.translate(a.x, a.y); c.scale(a.dir, 1);
    var gape = a.mouth;                         // 0 = resting open a little, 1 = wide snap
    var jaw = s * (.1 + gape * .22);            // how far the lower jaw drops
    // tail fin + little dorsal spines
    var tw = Math.sin(a.tail * 3) * .3;
    c.fillStyle = col('#2a2219', z);
    c.beginPath(); c.moveTo(-s * .78, -s * .05); c.quadraticCurveTo(-s * 1.12, -s * (.38 + tw * .2), -s * 1.22, -s * (.14 + tw * .1)); c.quadraticCurveTo(-s * 1.1, 0, -s * 1.22, s * (.16 - tw * .1)); c.quadraticCurveTo(-s * 1.12, s * (.36 - tw * .2), -s * .78, s * .07); c.closePath(); c.fill();
    c.strokeStyle = col('#2a2219', z); c.lineWidth = s * .03; c.lineCap = 'round';
    for (var d = 0; d < 3; d++) { var dx = -s * (.25 + d * .16), dy = -s * (.5 - d * .1); c.beginPath(); c.moveTo(dx, dy); c.lineTo(dx - s * .08, dy - s * .16 + d * s * .03); c.stroke(); }
    // body outline: huge round head tapering fast to the tail; the lower jaw juts out past the upper
    c.beginPath();
    c.moveTo(s * .78, -s * .16);                                                  // upper lip corner (front)
    c.bezierCurveTo(s * .7, -s * .62, s * .05, -s * .8, -s * .35, -s * .5);       // over the big head
    c.quadraticCurveTo(-s * .7, -s * .28, -s * .8, -s * .06);                     // taper to the tail
    c.lineTo(-s * .8, s * .08);
    c.quadraticCurveTo(-s * .55, s * .42, -s * .05, s * .58);                     // round belly
    c.bezierCurveTo(s * .45, s * .66, s * .9, s * .48 + jaw * .4, s * 1.02, s * .2 + jaw);   // lower jaw, out front
    c.lineTo(s * .62, s * .02 + jaw * .4);                                        // inside of the gape
    c.closePath();
    var bg = c.createRadialGradient(s * .05, -s * .32, s * .08, 0, 0, s * 1.05);
    bg.addColorStop(0, col('#5a4a3a', z)); bg.addColorStop(.6, col('#2e251c', z)); bg.addColorStop(1, col('#171210', z));
    c.fillStyle = bg; c.fill();
    c.save(); c.clip();
    // paler belly + rough bumpy skin
    var bl = c.createLinearGradient(0, s * .1, 0, s * .6); bl.addColorStop(0, 'rgba(120,100,80,0)'); bl.addColorStop(1, col('#7a6650', z, .55));
    c.fillStyle = bl; c.fillRect(-s, 0, s * 2.2, s);
    c.fillStyle = col('#7a6a54', z, .45);
    for (var p = 0; p < 16; p++) { var px = -s * .6 + hash(p * 3.1) * s * 1.3, py = -s * .55 + hash(p * 7.7) * s * .95; c.beginPath(); c.arc(px, py, s * (.02 + hash(p) * .025), 0, TAU); c.fill(); }
    c.restore();
    // the dark gape and the fangs
    c.fillStyle = col('#0a0706', z);
    c.beginPath(); c.moveTo(s * .78, -s * .16); c.quadraticCurveTo(s * .55, -s * .02, s * .6, s * .03 + jaw * .4); c.quadraticCurveTo(s * .82, s * .14 + jaw * .7, s * 1.02, s * .2 + jaw); c.quadraticCurveTo(s * .95, -s * .02, s * .78, -s * .16); c.fill();
    c.fillStyle = col('#f4ecd8', z);
    var fangs = [[.62, .1], [.7, .16], [.78, .12], [.85, .2], [.92, .1]];   // upper jaw, pointing down
    fangs.forEach(function (f, i) { var fx = s * f[0], fy = -s * .12 + (fx - s * .6) * -.15; c.beginPath(); c.moveTo(fx - s * .018, fy); c.lineTo(fx + s * .01, fy + s * f[1]); c.lineTo(fx + s * .028, fy); c.fill(); });
    var low = [[.64, .12], [.72, .2], [.8, .14], [.88, .24], [.96, .16]];  // lower jaw, pointing up and out
    low.forEach(function (f, i) { var fx = s * f[0], fy = s * .06 + (fx - s * .6) / (s * .42) * (s * .14 + jaw * .6) + jaw * .4; c.beginPath(); c.moveTo(fx - s * .02, fy); c.lineTo(fx + s * .03, fy - s * f[1]); c.lineTo(fx + s * .025, fy); c.fill(); });
    // tiny eye high on the head
    c.fillStyle = col('#d8d0a0', z); c.beginPath(); c.arc(s * .36, -s * .42, s * .07, 0, TAU); c.fill();
    c.fillStyle = '#060606'; c.beginPath(); c.arc(s * .38, -s * .42, s * .042, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,255,255,.85)'; c.beginPath(); c.arc(s * .355, -s * .445, s * .016, 0, TAU); c.fill();
    // small pectoral fin
    c.fillStyle = col('#3a3024', z); c.beginPath(); c.ellipse(-s * .12, s * .22, s * .2, s * .09, .7 + Math.sin(t * 3 + a.ph) * .25, 0, TAU); c.fill();
    // the rod (illicium) from the top of the head, arching forward over the mouth to the lure
    var lx = (L.x - a.x) * a.dir, ly = L.y - a.y;
    c.strokeStyle = col('#4a3c2c', z); c.lineWidth = s * .035;
    c.beginPath(); c.moveTo(s * .3, -s * .7); c.bezierCurveTo(s * .55, -s * 1.3, s * 1.2, -s * 1.15, lx, ly - s * .06); c.stroke();
    c.restore();
    // the bulb, with a fine filament
    c.fillStyle = 'rgba(230,255,250,' + Math.min(1, .7 + I * .3).toFixed(3) + ')'; c.beginPath(); c.arc(L.x, L.y, s * .08, 0, TAU); c.fill();
    c.fillStyle = 'rgba(140,255,230,' + (.6 * I).toFixed(3) + ')'; c.beginPath(); c.arc(L.x, L.y, s * .14, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(200,255,245,' + (.5 * I).toFixed(3) + ')'; c.lineWidth = 1;
    c.beginPath(); c.moveTo(L.x, L.y + s * .08); c.quadraticCurveTo(L.x + a.dir * s * .05, L.y + s * .18, L.x, L.y + s * .26); c.stroke();
  };

  // =================================================================================================
  // 44.5 HERMIT CRAB: a little crab dragging a spiral shell along the sand; poke it (or swim close) and
  // it pulls into the shell, which wobbles; then the eyes peek out and it walks on.
  // =================================================================================================
  function Hermit(o) {
    this.kind = 'hermit'; this.z = o.z; this.s = 32 * U * depthScale(o.z); this.x = o.x; this.dir = -1;
    this.state = 'walk'; this.timer = R(2, 4); this.gait = 0; this.speed = 0; this.out = 1; this.wob = 0;
    this.y = sandTop + sandH * .58;
  }
  Hermit.prototype.update = function (dt, t) {
    var h = this; h.y = sandTop + sandH * .58;
    h.timer -= dt;
    if (h.timer <= 0) {
      if (h.state === 'hide') { h.state = 'peek'; h.timer = 1.2; }
      else if (h.state === 'peek') { h.state = 'walk'; h.timer = R(2, 4); }
      else if (h.state === 'walk') { h.state = 'rest'; h.timer = R(1.5, 3); }
      else { h.state = 'walk'; h.timer = R(2.5, 5); if (rnd() < .4) h.dir *= -1; }
    }
    if (h.x < W * .06) h.dir = 1; if (h.x > W * .94) h.dir = -1;
    var want = h.state === 'walk' ? 12 * U * depthScale(h.z) : 0;
    h.speed += (want - h.speed) * Math.min(1, dt * 4);
    h.x += h.dir * h.speed * dt;
    h.gait += h.speed * dt / (h.s * .3);
    var outT = h.state === 'hide' ? 0 : h.state === 'peek' ? .45 : 1;
    h.out += (outT - h.out) * Math.min(1, dt * (outT < h.out ? 14 : 3));
    h.wob = Math.max(0, h.wob - dt * 1.6);
  };
  Hermit.prototype.scare = function (px, py, r) { if (Math.hypot(this.x - px, this.y - py) < r * .8) this.poke(); };
  Hermit.prototype.poke = function () {
    if (this.state === 'hide') { this.wob = 1; this.timer = Math.max(this.timer, 1.5); return; }
    this.state = 'hide'; this.timer = 2.4; this.wob = 1;
    for (var b = 0; b < 3; b++) spawnBubble(this.x + R(-4, 4), this.y - this.s * .6, R(1.2, 2.6) * U);
  };
  Hermit.prototype.draw = function (c, t) {
    var h = this, s = h.s, z = h.z, x = h.x, y = h.y, o = h.out;
    c.fillStyle = 'rgba(0,20,30,.22)'; c.beginPath(); c.ellipse(x, y + s * .28, s * 1.05, s * .16, 0, 0, TAU); c.fill();
    c.save(); c.translate(x, y); c.scale(h.dir, 1);
    var wob = Math.sin(t * 30) * h.wob * .12, bob = Math.abs(Math.sin(h.gait * PI)) * s * .04;
    // legs + claw (slide out of the shell opening, in front)
    if (o > .05) {
      c.strokeStyle = col('#c8502a', z); c.lineCap = 'round'; c.lineWidth = s * .08;
      for (var i = 0; i < 3; i++) {
        var lift = Math.max(0, Math.sin(h.gait * PI + i * 2.1)) * s * .12;
        var hx = s * (.35 + i * .08) * o, hy = s * .05;
        c.beginPath(); c.moveTo(hx, hy); c.lineTo(hx + s * .22 * o, hy - s * .1 - lift); c.lineTo(hx + s * .32 * o, s * .27 - lift * .5); c.stroke();
      }
      c.fillStyle = col('#e0663a', z); c.beginPath(); c.ellipse(s * .62 * o, -s * .05, s * .14 * o, s * .1, -.3, 0, TAU); c.fill();
      // eye stalks
      c.strokeStyle = col('#c8502a', z); c.lineWidth = s * .05;
      for (var e = 0; e < 2; e++) {
        var ex = s * (.42 + e * .1) * o, ey = -s * (.28 + .1 * o) + Math.sin(t * 2 + e) * s * .02;
        c.beginPath(); c.moveTo(s * .38 * o, -s * .08); c.lineTo(ex, ey); c.stroke();
        c.fillStyle = '#0b0b0b'; c.beginPath(); c.arc(ex, ey, s * .055, 0, TAU); c.fill();
        c.fillStyle = 'rgba(255,255,255,.85)'; c.beginPath(); c.arc(ex - s * .015, ey - s * .02, s * .018, 0, TAU); c.fill();
      }
    }
    // the shell: a spiral whelk, opening to the front
    c.save(); c.translate(-s * .1, -s * .1 - bob); c.rotate(-.25 + wob);
    var sg = c.createRadialGradient(-s * .15, -s * .25, s * .05, 0, 0, s * .75);
    sg.addColorStop(0, col('#ffffff', z)); sg.addColorStop(.6, col('#f1ece6', z)); sg.addColorStop(1, col('#bdb3aa', z));
    c.fillStyle = sg; c.beginPath(); c.ellipse(0, 0, s * .62, s * .5, 0, 0, TAU); c.fill();
    c.fillStyle = col('#ece4dc', z); c.beginPath(); c.moveTo(-s * .45, -s * .3); c.lineTo(-s * .95, -s * .62); c.lineTo(-s * .5, -s * .05); c.closePath(); c.fill();
    c.fillStyle = col('#c98a5a', z, .55); for (var sp2 = 0; sp2 < 12; sp2++) { c.beginPath(); c.arc(-s * .5 + hash(sp2 * 2.7) * s * .95, -s * .4 + hash(sp2 * 5.3) * s * .75, s * .028, 0, TAU); c.fill(); }
    c.strokeStyle = col('#a89a90', z, .8); c.lineWidth = s * .04;
    c.beginPath(); for (var a2 = 0; a2 < 11; a2++) { var ang = a2 * .55, rr2 = s * (.42 - a2 * .035); c[a2 ? 'lineTo' : 'moveTo'](Math.cos(ang) * rr2 - s * .05, Math.sin(ang) * rr2 * .8 - s * .02); } c.stroke();
    c.fillStyle = col('#5a2e1a', z, .85); c.beginPath(); c.ellipse(s * .45, s * .05, s * .14, s * .22, .2, 0, TAU); c.fill();
    c.restore();
    c.restore();
  };

  // =================================================================================================
  // PLANTS: kelp + sea grass (the current's wave runs up each blade), anemone
  // =================================================================================================
  function Blade(o) {
    this.x = o.x; this.y = o.y; this.len = o.len; this.w = o.w; this.a0 = o.a0; this.z = o.z; this.n = o.kelp ? 14 : 9;
    this.kelp = !!o.kelp; this.lag = R(.1, .18); this.stiff = o.stiff || 1; this.seed = R(0, 50);
    this.color = o.color; this.pts = new Float32Array((this.n + 1) * 2);
    this.leaves = [];
    if (this.kelp) for (var i = 2; i < this.n; i += 1) this.leaves.push({ i: i, side: i % 2 ? 1 : -1, len: R(.12, .2) * this.len, w: R(.012, .02) * this.len });
  }
  Blade.prototype.update = function (t) {
    if (this.push) this.push *= .965;
    var b = this, seg = b.len / b.n, x = b.x, y = b.y, ang = b.a0, p = b.pts;
    p[0] = x; p[1] = y;
    for (var i = 1; i <= b.n; i++) {
      var u = i / b.n;
      var cur = currentAt(b.x, t - i * b.lag) + .25 * Math.sin(t * 1.9 + b.seed + i * .5);
      ang += cur * .055 * b.stiff * (.4 + u) + (b.a0 * -.08);
      if (presence) {                       // 44.2: kelp and grass bend away from the octopus
        var pdx = x - presence.x, pdy = y - presence.y, pd = Math.hypot(pdx, pdy), pr = presence.r * 1.4;
        if (pd < pr) { var push = (1 - pd / pr); b.push = Math.min(1, (b.push || 0) + push * .08); }
        ang += (b.push || 0) * (pdx >= 0 ? 1 : -1) * .07 * u;
      }
      x += Math.sin(ang) * seg; y -= Math.cos(ang) * seg;
      p[i * 2] = x; p[i * 2 + 1] = y;
    }
  };
  Blade.prototype.draw = function (c, t) {
    var b = this, p = b.pts, n = b.n, left = [], right = [];
    for (var i = 0; i <= n; i++) {
      var ix = i * 2, nx, ny;
      var j0 = Math.max(0, i - 1) * 2, j1 = Math.min(n, i + 1) * 2;
      var dx = p[j1] - p[j0], dy = p[j1 + 1] - p[j0 + 1], d = Math.hypot(dx, dy) || 1;
      nx = -dy / d; ny = dx / d;
      var u = i / n, w = b.w * (b.kelp ? (.55 + .45 * Math.sin(PI * Math.min(1, u * 1.1))) * (1 - u * .5) : Math.pow(1 - u, .7)) * (1 + .12 * Math.sin(u * 14 + b.seed));
      left.push(p[ix] + nx * w / 2, p[ix + 1] + ny * w / 2); right.push(p[ix] - nx * w / 2, p[ix + 1] - ny * w / 2);
    }
    if (!b.g) {
      var top = b.y - b.len;
      b.g = c.createLinearGradient(0, b.y, 0, top);
      b.g.addColorStop(0, col(b.color[0], b.z)); b.g.addColorStop(1, col(b.color[1], b.z));
    }
    c.fillStyle = b.g;
    if (b.kelp) {
      // leaves with gas bladders
      for (var l = 0; l < b.leaves.length; l++) {
        var lf = b.leaves[l], px = p[lf.i * 2], py = p[lf.i * 2 + 1];
        var sw = currentAt(b.x, t - lf.i * b.lag) * .5 + Math.sin(t * 1.4 + lf.i) * .15;
        var ang = lf.side * (.5 + .15 * Math.sin(t * .9 + lf.i)) + sw;
        c.save(); c.translate(px, py); c.rotate(ang + PI);
        var rip = Math.sin(t * 2.2 + lf.i * 1.3) * lf.w * .8;
        c.beginPath(); c.moveTo(0, 0);
        c.bezierCurveTo(lf.w * 1.2, lf.len * .3, lf.w * .6 + rip, lf.len * .75, rip, lf.len);
        c.bezierCurveTo(-lf.w * .6 + rip, lf.len * .75, -lf.w * 1.2, lf.len * .3, 0, 0); c.fill();
        c.fillStyle = col('#b8a040', b.z); c.beginPath(); c.arc(0, lf.len * .06, lf.w * .35, 0, TAU); c.fill();
        c.fillStyle = b.g;
        c.restore();
      }
    }
    c.beginPath(); smooth(c, left, true);
    var back = []; for (var k = right.length - 2; k >= 0; k -= 2) back.push(right[k], right[k + 1]);
    smooth(c, back, false); c.closePath(); c.fill();
    c.strokeStyle = col(b.color[1], b.z, .35); c.lineWidth = Math.max(.6, b.w * .08);
    c.beginPath(); c.moveTo(p[0], p[1]); for (var q = 2; q <= n * 2; q += 2) c.lineTo(p[q], p[q + 1]); c.stroke();
  };
  function Clump(blades, z) { this.kind = 'plants'; this.z = z; this.blades = blades; }
  Clump.prototype.update = function (dt, t) { for (var i = 0; i < this.blades.length; i++) this.blades[i].update(t); };
  Clump.prototype.draw = function (c, t) { for (var i = 0; i < this.blades.length; i++) this.blades[i].draw(c, t); };

  function Anemone(o) {
    this.kind = 'anemone'; this.z = o.z; this.x = o.x; this.y = o.y; this.s = 34 * U * depthScale(o.z); this.flinch = 0;
    this.tent = [];
    for (var i = 0; i < 38; i++) { var u = R(-1, 1); this.tent.push({ u: u, back: i % 2 === 0, len: R(.75, 1.05), ph: R(0, TAU) }); }
    this.tent.sort(function (a, b) { return (b.back ? 1 : 0) - (a.back ? 1 : 0); });
  }
  Anemone.prototype.update = function (dt, t) { this.flinch = Math.max(0, this.flinch - dt * .5); };
  Anemone.prototype.scare = function (px, py, r) { if (Math.hypot(this.x - px, this.y - this.s * .6 - py) < r) this.flinch = 1; };
  Anemone.prototype.draw = function (c, t) {
    var a = this, s = a.s, z = a.z, x = a.x, y = a.y, top = y - s * .45;
    // column
    var g = c.createLinearGradient(0, y, 0, top);
    g.addColorStop(0, col('#5c2a6a', z)); g.addColorStop(1, col('#a45aa6', z));
    c.fillStyle = g;
    c.beginPath(); c.moveTo(x - s * .45, y); c.quadraticCurveTo(x - s * .5, top + s * .1, x - s * .62, top); c.lineTo(x + s * .62, top); c.quadraticCurveTo(x + s * .5, top + s * .1, x + s * .45, y); c.closePath(); c.fill();
    var shrink = 1 - .55 * a.flinch * a.flinch;
    c.lineCap = 'round';
    for (var i = 0; i < a.tent.length; i++) {
      var tn = a.tent[i], bx = x + tn.u * s * .6, by = top + (tn.back ? -s * .02 : s * .04);
      var len = s * .9 * tn.len * shrink, ang = tn.u * .9;
      var cur = currentAt(bx, t - .3) * .35 + Math.sin(t * 1.3 + tn.ph) * .12;
      c.strokeStyle = col(tn.back ? '#6fae84' : '#9ee0b0', z); c.lineWidth = s * .09;
      c.beginPath(); c.moveTo(bx, by);
      var px = bx, py = by, an = ang;
      for (var k = 1; k <= 4; k++) { an += cur * .35 * k / 2; px += Math.sin(an) * len / 4; py -= Math.cos(an) * len / 4; c.lineTo(px, py); }
      c.stroke();
      c.fillStyle = col(tn.back ? '#c46a8a' : '#ff9cbc', z);
      c.beginPath(); c.arc(px, py, s * .07, 0, TAU); c.fill();
      c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.arc(px - s * .02, py - s * .02, s * .025, 0, TAU); c.fill();
    }
  };

  // =================================================================================================
  // CORALS (drawn once into a cache) + swaying sea fans
  // =================================================================================================
  function branchCoral(c, x, y, size, hexes, z, spread, depth) {
    function br(x0, y0, ang, len, w, d) {
      var x1 = x0 + Math.sin(ang) * len, y1 = y0 - Math.cos(ang) * len;
      var mx = (x0 + x1) / 2 + R(-.12, .12) * len, my = (y0 + y1) / 2;
      c.strokeStyle = col(hexes[2], z); c.lineWidth = w; c.beginPath(); c.moveTo(x0 + w * .15, y0 + w * .1); c.quadraticCurveTo(mx + w * .15, my, x1 + w * .15, y1); c.stroke();
      c.strokeStyle = col(hexes[0], z); c.lineWidth = w * .8; c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo(mx, my, x1, y1); c.stroke();
      c.strokeStyle = col(hexes[1], z, .55); c.lineWidth = w * .25; c.beginPath(); c.moveTo(x0 - w * .2, y0); c.quadraticCurveTo(mx - w * .2, my, x1 - w * .15, y1); c.stroke();
      if (d <= 0 || w < 1.4) {
        c.fillStyle = col(hexes[1], z); c.beginPath(); c.arc(x1, y1, w * .55, 0, TAU); c.fill();
        c.fillStyle = 'rgba(255,255,255,' + (.5 * (1 - z)) + ')'; c.beginPath(); c.arc(x1 - w * .15, y1 - w * .2, w * .2, 0, TAU); c.fill();
        return;
      }
      var kids = rnd() < .35 ? 3 : 2;
      for (var k = 0; k < kids; k++) { if (d < 3 && rnd() < .18) continue; br(x1, y1, ang + (k - (kids - 1) / 2) * R(.3, .7) * spread + R(-.22, .22), len * R(.6, .86), w * R(.68, .8), d - 1); }
    }
    c.lineCap = 'round';
    var stems = 3 + Math.floor(rnd() * 3);
    for (var i = 0; i < stems; i++) br(x + (i - (stems - 1) / 2) * size * .16 + R(-4, 4), y, (i - (stems - 1) / 2) * .3 + R(-.25, .25), size * R(.22, .34), size * .07, depth || 4);
  }
  function brainCoral(c, x, y, w, h, z) {
    var g = c.createRadialGradient(x - w * .2, y - h * .7, w * .05, x, y - h * .3, w * .8);
    g.addColorStop(0, col('#f0d29a', z)); g.addColorStop(.6, col('#c99a5a', z)); g.addColorStop(1, col('#7a5530', z));
    c.fillStyle = g; c.beginPath(); c.ellipse(x, y, w / 2, h, 0, PI, 0); c.closePath(); c.fill();
    c.save(); c.clip();
    c.strokeStyle = col('#6a4422', z, .5); c.lineWidth = Math.max(1, w * .022);
    for (var m = 0; m < 16; m++) {
      var px = x + R(-.45, .45) * w, py = y - R(.05, .9) * h, a = R(0, TAU);
      c.beginPath(); c.moveTo(px, py);
      for (var k = 0; k < 14; k++) { a += R(-.9, .9); px += Math.cos(a) * w * .045; py += Math.sin(a) * w * .03; c.lineTo(px, py); }
      c.stroke();
    }
    c.restore();
  }
  function seaStar(c, x, y, r, z, rot) {
    c.save(); c.translate(x, y); c.rotate(rot); c.scale(1, .55);
    var g = c.createRadialGradient(-r * .2, -r * .2, 0, 0, 0, r);
    g.addColorStop(0, col('#ffb070', z)); g.addColorStop(1, col('#d2442a', z));
    c.fillStyle = g; c.beginPath();
    for (var i = 0; i < 5; i++) {
      var a = i / 5 * TAU - PI / 2, b = a + PI / 5;
      c[i ? 'quadraticCurveTo' : 'moveTo'](i ? Math.cos(a - PI / 5) * r * .32 : Math.cos(a) * r, i ? Math.sin(a - PI / 5) * r * .32 : Math.sin(a) * r, Math.cos(a) * r, Math.sin(a) * r);
      c.quadraticCurveTo(Math.cos(b) * r * .32, Math.sin(b) * r * .32, Math.cos(a + 2 * PI / 5) * r, Math.sin(a + 2 * PI / 5) * r);
    }
    c.closePath(); c.fill();
    c.fillStyle = col('#ffe2c0', z, .7);
    for (var k = 0; k < 5; k++) { var aa = k / 5 * TAU - PI / 2; for (var d = .2; d < .9; d += .18) { c.beginPath(); c.arc(Math.cos(aa) * r * d, Math.sin(aa) * r * d, r * .045, 0, TAU); c.fill(); } }
    c.restore();
  }
  function SeaFan(o) {
    this.kind = 'fan'; this.z = o.z; this.x = o.x; this.y = o.y; this.h = o.h; this.w = o.w; this.seed = R(0, 30);
    var pad = 6, cw = Math.ceil(this.w + pad * 2), ch = Math.ceil(this.h + pad);
    this.cv = document.createElement('canvas'); this.cv.width = cw * DPR; this.cv.height = ch * DPR; this.cw = cw; this.ch = ch;
    var c = this.cv.getContext('2d'); c.scale(DPR, DPR);
    var z = this.z, hexes = o.hexes, bx = cw / 2, by = ch;
    c.lineCap = 'round';
    function br(x0, y0, ang, len, w, d) {
      var x1 = x0 + Math.sin(ang) * len, y1 = y0 - Math.cos(ang) * len;
      c.strokeStyle = col(hexes[0], z); c.lineWidth = w; c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo((x0 + x1) / 2 + R(-2, 2), (y0 + y1) / 2, x1, y1); c.stroke();
      if (d <= 0) return;
      br(x1, y1, ang - R(.15, .38), len * R(.72, .86), w * .78, d - 1);
      br(x1, y1, ang + R(.15, .38), len * R(.72, .86), w * .78, d - 1);
    }
    br(bx, by, -.05, this.h * .26, Math.max(2, this.w * .045), 6);
    // the fine net between branches
    c.globalAlpha = .35; c.strokeStyle = col(hexes[1], z); c.lineWidth = .7;
    for (var i = 0; i < 70; i++) {
      var a = R(-1.1, 1.1), r0 = R(.25, .95) * this.h;
      c.beginPath(); c.arc(bx, by, r0, -PI / 2 + a, -PI / 2 + a + R(.08, .2)); c.stroke();
    }
    c.globalAlpha = 1;
  }
  SeaFan.prototype.update = function () {};
  SeaFan.prototype.draw = function (c, t) {
    var sw = (currentAt(this.x, t - .6) * .045 + Math.sin(t * .7 + this.seed) * .015);
    c.save(); c.translate(this.x, this.y); c.rotate(sw); c.drawImage(this.cv, -this.cw / 2, -this.ch, this.cw, this.ch); c.restore();
  };
  function CoralCache() { this.kind = 'corals'; this.z = .42; }
  CoralCache.prototype.update = function () {};
  CoralCache.prototype.draw = function (c) { if (coralCache) c.drawImage(coralCache, 0, 0, W, H); };

  function buildCorals() {
    coralCache = document.createElement('canvas');
    coralCache.width = Math.round(W * DPR); coralCache.height = Math.round(H * DPR);
    var c = coralCache.getContext('2d'); c.scale(DPR, DPR);
    seed = 4242;
    var gl = L('gardenL', .07, .86), gr = L('gardenR', .93, .87), bl = L('branchL', .29, .84), brr = L('branchR', .73, .86), cc = L('coralC', .52, .82);
    branchCoral(c, gl.cx * W, gl.by * H - 4, Math.min(gl.h * H * .7, 100 * U), ['#e48aa8', '#ffd0dc', '#8a3a58'], .5, 1.1, 4);
    branchCoral(c, gr.cx * W, gr.by * H - 4, Math.min(gr.h * H * .7, 90 * U), ['#9a86d8', '#e0d6ff', '#4c3a80'], .6, 1.1, 4);
    branchCoral(c, bl.cx * W, bl.by * H - 2, Math.min(bl.h * H * .7, 84 * U), ['#f2a07c', '#ffe0c8', '#9a4a30'], .52, .8, 4);
    branchCoral(c, brr.cx * W, brr.by * H - 2, Math.min(brr.h * H * .7, 78 * U), ['#7cc8b0', '#d8fff0', '#2e6a5a'], .64, .8, 4);
    brainCoral(c, cc.cx * W, cc.by * H, Math.min(110 * U, W * .14), Math.min(42 * U, H * .06), .45);
    var sl = L('starL', .2, .9), sr = L('starR', .8, .88);
    seaStar(c, sl.cx * W, (sl.y + sl.h / 2) * H, 18 * U, .15, .3);
    seaStar(c, sr.cx * W, (sr.y + sr.h / 2) * H, 14 * U, .4, -.5);
  }

  // =================================================================================================
  // BUBBLES, MARINE SNOW, LIGHT SHAFTS
  // =================================================================================================
  function makeBubbleSprite() {
    var s = 64, cv = document.createElement('canvas'); cv.width = cv.height = s;
    var c = cv.getContext('2d'), r = s / 2 - 2;
    var g = c.createRadialGradient(s / 2, s / 2, r * .55, s / 2, s / 2, r);
    g.addColorStop(0, 'rgba(200,245,255,.03)'); g.addColorStop(.85, 'rgba(200,245,255,.22)'); g.addColorStop(1, 'rgba(235,252,255,.75)');
    c.fillStyle = g; c.beginPath(); c.arc(s / 2, s / 2, r, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,255,255,.9)'; c.beginPath(); c.ellipse(s * .36, s * .32, r * .22, r * .13, -.6, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(255,255,255,.45)'; c.lineWidth = 2; c.beginPath(); c.arc(s / 2, s / 2, r * .78, .15 * PI, .55 * PI); c.stroke();
    return cv;
  }
  function spawnBubble(x, y, r) { if (bubbles.length < 60) bubbles.push({ x: x, y: y, r: r, ph: R(0, TAU), w: R(6, 11), x0: x }); }
  var vents = [], ventT = 0;
  function updateBubbles(dt, t) {
    ventT -= dt;
    if (ventT <= 0 && vents.length) {
      var v = vents[Math.floor(rnd() * vents.length)], n = 3 + Math.floor(rnd() * 6);
      for (var i = 0; i < n; i++) (function (k) { setTimeout(function () { spawnBubble(v.x + R(-3, 3), v.y, R(1.4, 4.2) * U); }, k * R(90, 220)); })(i);
      ventT = R(2.5, 6);
    }
    for (var j = bubbles.length - 1; j >= 0; j--) {
      var b = bubbles[j];
      b.ph += dt * b.w;
      b.y -= (26 + b.r * 9) * dt;                         // larger bubbles rise faster
      b.x0 += current * 8 * dt;
      b.x = b.x0 + Math.sin(b.ph) * b.r * .9;             // zig-zag wobble
      if (b.y < -10) bubbles.splice(j, 1);
    }
  }
  function drawBubbles(c) {
    for (var i = 0; i < bubbles.length; i++) {
      var b = bubbles[i], sq = b.r > 2.6 ? .14 * Math.sin(b.ph * 1.3) : 0;
      var rx = b.r * (1 + sq), ry = b.r * (1 - sq);
      c.drawImage(bubbleSprite, b.x - rx, b.y - ry, rx * 2, ry * 2);
    }
  }
  function initSnow() {
    snow = [];
    var n = Math.round(clamp(W * H / 9000, 30, 90));
    for (var i = 0; i < n; i++) snow.push({ x: R(0, W), y: R(0, H), z: R(0, 1), s: R(0, 100) });
  }
  function updateSnow(dt, t) {
    for (var i = 0; i < snow.length; i++) {
      var p = snow[i], k = depthScale(p.z);
      p.y += (5 + 6 * k) * U * dt; p.x += (current * 6 + noise(t * .3, p.s) * 4) * k * U * dt;
      if (p.y > H + 4) { p.y = -4; p.x = R(0, W); } if (p.x < -4) p.x = W + 4; if (p.x > W + 4) p.x = -4;
    }
  }
  function drawSnow(c, near) {
    c.fillStyle = near ? 'rgba(220,245,240,.55)' : 'rgba(200,235,235,.3)';
    for (var i = 0; i < snow.length; i++) {
      var p = snow[i]; if ((p.z < .5) !== near) continue;
      var r = (near ? 1.5 : .9) * depthScale(p.z) * U + .3;
      c.fillRect(p.x - r / 2, p.y - r / 2, r, r);
    }
  }
  var shafts = [];
  function initShafts() { shafts = []; for (var i = 0; i < 5; i++) shafts.push({ x: R(.12, .88), w: R(.05, .12), sk: R(-.12, .12), s: R(0, 60) }); }
  function drawShafts(c, t) {
    c.globalCompositeOperation = 'lighter';
    for (var i = 0; i < shafts.length; i++) {
      var sh = shafts[i], a = .07 * (.55 + .45 * noise(t * .25, sh.s)), x = (sh.x + .03 * Math.sin(t * .11 + sh.s)) * W, w = sh.w * W, len = H * .82;
      var g = c.createLinearGradient(0, 0, 0, len);
      g.addColorStop(0, 'rgba(210,255,250,' + a + ')'); g.addColorStop(1, 'rgba(210,255,250,0)');
      c.fillStyle = g;
      c.beginPath(); c.moveTo(x - w * .35, -4); c.lineTo(x + w * .35, -4); c.lineTo(x + sh.sk * W + w, len); c.lineTo(x + sh.sk * W - w, len); c.closePath(); c.fill();
    }
    c.globalCompositeOperation = 'source-over';
  }

  // =================================================================================================
  // WORLD SETUP
  // =================================================================================================
  function build() {
    seed = 20261008;
    things = []; fishes = []; schools = []; jellies = []; kelps = []; swayCorals = [];
    var s = layout.sand || { y: .7, h: .3 };
    sandTop = s.y * H; sandH = Math.max(20, Math.min(s.h * H, H - sandTop));
    // giant kelp at the back edges, sea grass at the old seaweed spots
    var kelpBlades = [];
    [.04, .12, .87, .95].forEach(function (fx, i) {
      kelpBlades.push(new Blade({ x: fx * W + R(-8, 8), y: sandTop + sandH * .1, len: H * R(.5, .72), w: 5 * U, a0: R(-.1, .1), z: .82, kelp: true, color: ['#3d5a26', '#8aa84a'], stiff: .8 }));
    });
    var kelp = new Clump(kelpBlades, .78);
    var grass = [];
    ['weedL', 'weedR'].forEach(function (name, gi) {
      var w = L(name, gi ? .78 : .22, .84);
      for (var i = 0; i < 11; i++) grass.push(new Blade({ x: w.cx * W + R(-18, 18) * U, y: Math.min(w.by * H, sandTop + sandH * .3) + 2, len: Math.min(w.h * H * R(.55, 1), 170 * U), w: R(4, 6.5) * U, a0: R(-.28, .28), z: .2, color: ['#2f7a52', '#7fd09a'] }));
    });
    var grassClump = new Clump(grass, .18);
    // anemone on the left rock, clownfish live in it
    var rl = L('rockL', .1, .9);
    anemone = new Anemone({ x: clamp(W * .35, 50 * U, W * .45), y: sandTop + sandH * .3, z: .14 });
    var home = { x: anemone.x, y: anemone.y - anemone.s * 1.15, r: 46 * U };
    var anchors = function (sel) { var out = []; for (var i = 0; i < 6; i++) { var a = anchor(sel, i); if (a) out.push(a); } return out; };
    var clownA = anchors('.clownfish');
    fishes.push(new Fish('clown', { x: home.x - 20, y: home.y, z: .28, home: home, anchor: clownA[0], agility: 2 }));
    fishes.push(new Fish('clown', { x: home.x + 20, y: home.y - 10, z: .3, size: .8, home: home, anchor: clownA[1], agility: 2 }));
    fishes.push(new Fish('tang', { x: W * .7, y: H * .3, z: .32, zone: [.15, .55], anchor: null }));
    fishes.push(new Fish('tang', { x: W * .2, y: H * .42, z: .5, size: .9, zone: [.2, .55] }));
    // 44.5: the two yellow butterflyfish gave way to an anglerfish in the deep and a hermit crab
    angler = new Angler({ x: W * .25, y: H * .64, z: .32 });
    hermit = new Hermit({ x: W * .42, z: .08 });
    var lc = L('branchR', .73, .86);
    var lion = anchor('.lionfish', 0);
    fishes.push(new Fish('lion', { x: lc.cx * W, y: lc.y * H - 10, z: .4, home: { x: lc.cx * W, y: (lc.y - .03) * H, r: 70 * U }, anchor: lion, agility: .6 }));
    schools.push(new School('anthias', 9, { x: W * .3, y: H * .28, z: .36, zone: [.14, .45], anchors: anchors('.fish'), spread: 50 }));
    var bait = new School('anthias', 34, { x: W * .7, y: H * .18, z: .86, zone: [.08, .3], simple: true, spread: 70 });
    bait.members.forEach(function (m) { var cA = hex('#c8dce8'); m.c.side = col(cA, m.z); });
    schools.push(bait);
    var jA = anchors('.jellyfish');
    jellies.push(new Jelly({ sp: 'moon', x: W * .26, y: H * .32, z: .3, r: 40, anchor: jA[0] }));
    jellies.push(new Jelly({ sp: 'nettle', x: W * .74, y: H * .4, z: .42, r: 36, anchor: jA[1] }));
    jellies.push(new Jelly({ sp: 'moon', x: W * .55, y: H * .2, z: .8, r: 22 }));
    turtle = new Turtle({ x: -W * .2, y: H * .3, z: .55, anchor: anchor('.sea-turtle', 0) });
    ray = new Ray({ x: W * 1.2, y: H * .2, z: .68, anchor: anchor('.eagle-fish', 0) });
    var pz = L('coralC', .52, .82);
    puffer = new Puffer({ x: pz.cx * W, y: (pz.by - .12) * H, z: .25, home: { x: pz.cx * W, y: (pz.by - .12) * H, r: 60 * U }, anchor: anchor('.puffer-fish', 0) });
    crab = new Crab({ x: W * .62, z: .12, anchor: anchor('.crab', 0) });
    // fans sway with the current
    var cl = L('coralL', .14, .86), cr = L('coralR', .82, .86);
    swayCorals.push(new SeaFan({ x: cl.cx * W, y: cl.by * H, h: Math.min(cl.h * H * .9, 170 * U), w: Math.min(cl.h * H * .75, 140 * U), z: .5, hexes: ['#b2365a', '#e070a0'] }));
    swayCorals.push(new SeaFan({ x: cr.cx * W, y: cr.by * H, h: Math.min(cr.h * H * .8, 150 * U), w: Math.min(cr.h * H * .65, 120 * U), z: .6, hexes: ['#d27a2a', '#ffb060'] }));
    vents = [{ x: anemone.x + 30 * U, y: sandTop + sandH * .2 }, { x: W * .58, y: sandTop + sandH * .3 }, { x: W * .86, y: sandTop + sandH * .15 }];

    things = [].concat([kelp], swayCorals, [new CoralCache()], fishes, schools, jellies, [turtle, ray, puffer, crab, anemone, grassClump, angler, hermit]);
    things.sort(function (a, b) { return zOf(b) - zOf(a); });
    buildCorals();
    initSnow(); initShafts();
    bubbleSprite = bubbleSprite || makeBubbleSprite();
  }
  function zOf(o) { return o.lead ? o.lead.z : o.z; }

  function resize() {
    var w = ocean.clientWidth, h = ocean.clientHeight;
    if (!w || !h) return false;
    if (w === W && h === H) return true;
    var first = !W;
    W = w; H = h; U = clamp(Math.min(W, H) / 560, .62, 1.35);
    DPR = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
    build();
    if (first) {
      // warm the ropes and plants so nothing starts frozen
      for (var i = 0; i < 40; i++) step(1 / 30);
    }
    return true;
  }

  // 44.2: where the octopus is (ocean coordinates), fed by interact-v1.js
  var presence = null, presenceCool = {};
  function setPresence(cx, cy, r) {
    if (!ocean || !W) return;
    var oRect = ocean.getBoundingClientRect(), k = oRect.width / Math.max(1, ocean.clientWidth);
    presence = { x: (cx - oRect.left) / k, y: (cy - oRect.top) / k, r: r / k, t: T };
  }
  function presenceReact() {
    if (!presence || T - presence.t > .5) { presence = null; return; }
    var P = presence;
    for (var i = 0; i < things.length; i++) {
      var o = things[i], kind = o.kind || (o.lead ? 'school' : '');
      if (kind === 'fish' && !o.home && Math.hypot(o.x - P.x, o.y - P.y) < P.r * 1.1 && !(o.flee > 0)) o.scare(P.x, P.y, P.r * 1.1);
      else if (kind === 'fish' && o.home && Math.hypot(o.x - P.x, o.y - P.y) < P.r * 1.3 && !(o.flee > 0)) { o.scare(P.x, P.y, P.r * .8); }
      else if (o.members && Math.hypot(o.lead.x - P.x, o.lead.y - P.y) < P.r * 1.6) o.scare(P.x, P.y, P.r * 1.2);
      else if (kind === 'puffer' && Math.hypot(o.x - P.x, o.y - P.y) < P.r * 1.2 && !o.infT) o.puff();
      else if (kind === 'anemone' && Math.hypot(o.x - P.x, o.y - o.s * .6 - P.y) < P.r * 1.3) o.flinch = Math.max(o.flinch, .8);
      else if (kind === 'jelly' && Math.hypot(o.x - P.x, o.y - P.y) < P.r) o.scare(P.x, P.y, P.r);
      else if (kind === 'hermit' && Math.hypot(o.x - P.x, o.y - P.y) < P.r * 1.3 && o.state !== 'hide' && o.state !== 'peek') o.poke();
      else if (kind === 'angler' && Math.hypot(o.x - P.x, o.y - P.y) < P.r * 1.5 && T > (presenceCool.angler || 0)) { o.flash = 1; presenceCool.angler = T + 4; }
      else if (kind === 'crab' && Math.abs(o.x - P.x) < P.r * 1.4 && P.y > sandTop - P.r * 1.6 && o.state !== 'wave' && T > (presenceCool.crab || 0)) { o.state = 'wave'; o.timer = 2; presenceCool.crab = T + 6; }
    }
    // sand puffs when it swims close to the floor
    if (P.y + P.r * .8 > sandTop && Math.random() < .25) for (var b = 0; b < 2; b++) sandPuff(P.x + R(-P.r * .6, P.r * .6), sandTop + sandH * R(.05, .3));
  }
  var puffs = [];
  function sandPuff(x, y) { if (puffs.length < 40) puffs.push({ x: x, y: y, r: R(4, 9) * U, a: .35, vx: R(-8, 8), vy: R(-14, -4) }); }
  function drawPuffs(c, dt) {
    for (var i = puffs.length - 1; i >= 0; i--) {
      var p = puffs[i]; p.x += p.vx * dt; p.y += p.vy * dt; p.r += 10 * U * dt; p.a -= dt * .3;
      if (p.a <= 0) { puffs.splice(i, 1); continue; }
      c.fillStyle = 'rgba(215,200,170,' + p.a.toFixed(3) + ')'; c.beginPath(); c.arc(p.x, p.y, p.r, 0, TAU); c.fill();
    }
  }
  function step(dt) {
    T += dt;
    current = currentAt(W * .5, T);
    presenceReact();
    for (var i = 0; i < things.length; i++) things[i].update(dt, T);
    updateBubbles(dt, T); updateSnow(dt, T);
  }
  function render() {
    var c = ctx;
    c.setTransform(DPR, 0, 0, DPR, 0, 0);
    c.clearRect(0, 0, W, H);
    drawShafts(c, T);
    drawSnow(c, false);
    for (var i = 0; i < things.length; i++) things[i].draw(c, T);
    drawPuffs(c, 1 / 60);
    drawBubbles(c);
    drawSnow(c, true);
  }

  // ---- loop: adaptive (drops to 30 fps if the device is struggling) --------------------------------
  var last = 0, slow = 0, skip = false, odd = false;
  function loop(now) {
    requestAnimationFrame(loop);
    if (document.hidden || !W) { last = now; return; }
    var dt = last ? Math.min((now - last) / 1000, .05) : 1 / 60; last = now;
    slow = slow * .97 + (dt > .024 ? 1 : 0) * .03;
    if (slow > .5) skip = true; else if (slow < .15) skip = false;
    step(dt);
    odd = !odd;
    if (skip && odd) return;
    render();
  }

  // 44.5: a tap pokes the one thing under your finger (it does its own little act, bubbles rise) and
  // tells the octopus what you tapped; dragging (luring the octopus) is not a tap
  var tapDown = null;
  function onDown(e) { tapDown = { x: e.clientX, y: e.clientY, t: performance.now() }; }
  function hitTest(px, py) {
    var best = null, bd = 1e9;
    for (var i = 0; i < things.length; i++) {
      var o = things[i], list = o.members ? o.members : [o];
      for (var j = 0; j < list.length; j++) {
        var m = list[j]; if (m.x == null || !m.kind) continue;
        var my = typeof m.y === 'function' ? m.y() - (m.s || 0) * .3 : m.kind === 'anemone' ? m.y - m.s * .6 : m.y;
        var rad = m.kind === 'fish' ? Math.max(m.Lb * .6 || 0, 26 * U) : m.kind === 'jelly' ? (m.r || 30) * U * 1.3 : (m.s || 30 * U) * 1.2;
        if (m.kind === 'turtle' || m.kind === 'ray') rad = 60 * U;
        var d = Math.hypot(m.x - px, my - py);
        if (d < rad && d < bd) { bd = d; best = { o: o, m: m, y: my }; }
      }
    }
    return best;
  }
  function onTap(e) {
    if (!W || !tapDown) return;
    var moved = Math.hypot(e.clientX - tapDown.x, e.clientY - tapDown.y), long = performance.now() - tapDown.t;
    tapDown = null;
    if (moved > 12 || long > 450) return;
    var t = e.target; if (t && t.closest && t.closest('button, input, a, [role="dialog"], .avatar-control-panel, .wd-sheet, .oc2-dock, .oc2-layer, .oc2-tray, #octo-cc-panel, #voice43-backdrop, .ui-voice, .ui-exit')) return;
    var oRect = ocean.getBoundingClientRect(), k = oRect.width / Math.max(1, ocean.clientWidth);
    var px = (e.clientX - oRect.left) / k, py = (e.clientY - oRect.top) / k;
    for (var b = 0; b < 5; b++) spawnBubble(px + R(-8, 8), py + R(-6, 6), R(1.2, 3.2) * U);
    var hit = hitTest(px, py), kind = '';
    if (hit) {
      var o = hit.o, m = hit.m; kind = m.kind === 'fish' && o.members ? 'school' : m.kind;
      if (m.poke) m.poke();
      else if (kind === 'puffer' && o.puff) o.puff();
      else if (kind === 'crab') { o.state = 'wave'; o.timer = 2; }
      else if (kind === 'anemone') o.flinch = 1;
      else if (kind === 'jelly' && o.scare) o.scare(px, py + 10, 200);
      else if (o.scare) o.scare(px, py, 90 * U);
      for (var b2 = 0; b2 < 6; b2++) spawnBubble(m.x + R(-12, 12), hit.y + R(-10, 4), R(1.5, 3.8) * U);
    }
    try { window.dispatchEvent(new CustomEvent('ocean-tap', { detail: { kind: kind, sp: hit && (hit.m.spName || hit.m.sp && hit.m.sp.name) || '', x: e.clientX, y: e.clientY } })); } catch (err) {}
  }

  function boot(n) {
    ocean = document.querySelector('.ocean-backdrop');
    if (!ocean || !ocean.clientWidth || !ocean.querySelector('.ocean-sand')) { if (n < 300) setTimeout(function () { boot(n + 1); }, 100); return; }
    layout = measure();
    var st = document.createElement('style'); st.id = 'ocean-life-v3'; st.textContent = HIDE_CSS; document.head.appendChild(st);
    ocean.classList.add('olv3');
    canvas = document.createElement('canvas'); canvas.className = 'olv3-canvas';
    var haze = ocean.querySelector('.water-haze');
    if (haze) ocean.insertBefore(canvas, haze); else ocean.appendChild(canvas);
    ctx = canvas.getContext('2d');
    resize();
    if (window.ResizeObserver) new ResizeObserver(function () { resize(); }).observe(ocean);
    else window.addEventListener('resize', resize);
    window.addEventListener('pointerdown', onDown, { passive: true, capture: true });
    window.addEventListener('pointerup', onTap, { passive: true, capture: true });
    window.__oceanLifeV3 = { things: things, get fps30() { return skip; }, presence: setPresence,
      // where things are, in screen (client) coordinates — for the octopus's reactions
      near: function (cx, cy, radius) {
        var oRect = ocean.getBoundingClientRect(), k = oRect.width / Math.max(1, ocean.clientWidth), out = [];
        things.forEach(function (o) {
          var list = o.members ? o.members : [o];
          list.forEach(function (m) {
            if (m.x == null || !m.kind) return;
            var y = m.kind === 'crab' ? m.y() - m.s * .3 : m.y;
            var sx = oRect.left + m.x * k, sy = oRect.top + y * k, d = Math.hypot(sx - cx, sy - cy);
            if (d < radius) out.push({ kind: m.kind === 'fish' && o.members ? 'school' : m.kind, sp: m.spName || m.sp || '', x: sx, y: sy, d: d });
          });
        });
        return out.sort(function (a, b) { return a.d - b.d; });
      } };
    requestAnimationFrame(loop);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { boot(0); }); else boot(0);
})();
