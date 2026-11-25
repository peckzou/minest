/* Sound that comes from the place (`ride-ambience.js`), the way "it's a small world" is heard from its facade: walking
 * the park you hear the Millennium Falcon idling on its pad, the volcano of Journey to the Center of the Earth, the
 * sea and ship's bell at the Pirates, the deep at 20,000 Leagues, the Resistance hangar, the Pandora forest — each from
 * where it stands, louder as you come near, to the left or right as you turn. No voices. Silent while you ride.
 * All synthesised with WebAudio. */
(function (root) {
  'use strict';
  var HEAR = 50;   /* metres at which a place starts to be heard (spec.hear for ones that stand close together) */
  var PLACES = {
    falcon_flight: { gain: 0.9, bed: function (A, out) { A.drone(out, [55, 82.5], 'sawtooth', 0.05, 260); A.hiss(out, 'bandpass', 1800, 0.6, 0.035); },
      every: [4, 9], ev: function (A, out) { A.chirps(out, 3 + (Math.random() * 4 | 0), 1400, 3200, 'square', 0.035); } },   /* engines idling, a droid at work */
    center_earth: { gain: 1, hear: 30, bed: function (A, out) { A.hiss(out, 'lowpass', 110, 0.7, 0.5, 0.09); },
      every: [5, 11], ev: function (A, out) { A.burst(out, 'highpass', 2600, 1.2, 0.09); A.thump(out, 48, 0.9, 0.18); } },   /* the mountain rumbles, steam vents */
    pirates_treasure: { gain: 1, hear: 30, bed: function (A, out) { A.hiss(out, 'lowpass', 650, 0.8, 0.12, 0.11); },
      every: [7, 13], ev: function (A, out) { if (Math.random() < 0.55) A.bell(out, 740, 0.12); else A.creak(out, 0.05); } },   /* waves on the hull, the bell, timbers */
    leagues: { gain: 1, hear: 28, bed: function (A, out) { A.hiss(out, 'lowpass', 260, 0.9, 0.16, 0.06); },
      every: [3, 7], ev: function (A, out) { if (Math.random() < 0.35) A.ping(out, 1180, 0.08); else A.bubbles(out, 5 + (Math.random() * 6 | 0), 0.05); } },   /* the deep, bubbles, sonar */
    rise_resistance: { gain: 0.9, bed: function (A, out) { A.drone(out, [60, 120], 'sine', 0.06, 400); A.hiss(out, 'bandpass', 520, 0.5, 0.04); },
      every: [6, 12], ev: function (A, out) { A.blasts(out, 1 + (Math.random() * 3 | 0), 0.05); } },   /* the hangar hum, blaster fire far off */
    flight_of_passage: { gain: 1, hear: 28, bed: function (A, out) { A.drone(out, [220, 277.2, 329.6], 'sine', 0.018, 1600, 0.13); A.hiss(out, 'highpass', 5200, 0.3, 0.012, 0.4); },
      every: [4, 10], ev: function (A, out) { if (Math.random() < 0.3) A.call(out, 0.05); else A.chirps(out, 6 + (Math.random() * 8 | 0), 3800, 5600, 'sine', 0.02); } }   /* the forest at dusk, a banshee */
  };

  var ctx = null, nb = null, places = {}, API = null;
  function ac() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume().catch(function () {}); return ctx; }
    var C = root.AudioContext || root.webkitAudioContext; if (!C) return null;
    try { ctx = new C(); } catch (e) { return null; }
    nb = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate); var d = nb.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return ctx;
  }
  /* the voices a place can be made of; `out` is that place's own gain → panner chain */
  var A = {
    drone: function (out, fs, type, vol, cut, wob) {
      var f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = cut; f.connect(out);
      fs.forEach(function (fr, i) { var o = ctx.createOscillator(), g = ctx.createGain(); o.type = type; o.frequency.value = fr; o.detune.value = (i - 1) * 6; g.gain.value = vol;
        if (wob) { var l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = wob * (1 + i * 0.3); lg.gain.value = vol * 0.8; l.connect(lg); lg.connect(g.gain); l.start(); }
        o.connect(g); g.connect(f); o.start(); });
    },
    hiss: function (out, type, fr, q, vol, swell) {
      var n = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(); n.buffer = nb; n.loop = true; f.type = type; f.frequency.value = fr; f.Q.value = q; g.gain.value = vol;
      if (swell) { var l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = swell; lg.gain.value = vol * 0.7; l.connect(lg); lg.connect(g.gain); l.start(); }
      n.connect(f); f.connect(g); g.connect(out); n.start(0, Math.random() * 2);
    },
    env: function (out, at, dur, vol) { var g = ctx.createGain(); g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(vol, at + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, at + dur); g.connect(out); return g; },
    tone: function (out, type, f0, f1, at, dur, vol) { var o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f0, at); if (f1) o.frequency.exponentialRampToValueAtTime(f1, at + dur); o.connect(A.env(out, at, dur, vol)); o.start(at); o.stop(at + dur + 0.05); },
    burst: function (out, type, fr, dur, vol) { var t = ctx.currentTime, n = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(); n.buffer = nb; f.type = type; f.frequency.value = fr;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.15); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); n.connect(f); f.connect(g); g.connect(out); n.start(t, Math.random()); n.stop(t + dur + 0.1); },
    thump: function (out, f, dur, vol) { A.tone(out, 'sine', f, f * 0.6, ctx.currentTime, dur, vol); },
    chirps: function (out, n, lo, hi, type, vol) { var t = ctx.currentTime; for (var i = 0; i < n; i++) { var f = lo + Math.random() * (hi - lo); A.tone(out, type, f, f * (0.8 + Math.random() * 0.5), t + i * (0.07 + Math.random() * 0.06), 0.06, vol); } },
    bell: function (out, f, vol) { var t = ctx.currentTime; [1, 2.76, 5.4].forEach(function (m, i) { A.tone(out, 'sine', f * m, 0, t, 2.6 - i * 0.7, vol / (1 + i * 1.5)); }); A.tone(out, 'sine', f, 0, t + 0.7, 2.2, vol * 0.7); },
    creak: function (out, vol) { var t = ctx.currentTime, o = ctx.createOscillator(), f = ctx.createBiquadFilter(); o.type = 'sawtooth'; o.frequency.setValueAtTime(70, t); o.frequency.linearRampToValueAtTime(130, t + 0.9);
      f.type = 'bandpass'; f.frequency.value = 900; f.Q.value = 6; o.connect(f); f.connect(A.env(out, t, 1, vol)); o.start(t); o.stop(t + 1.05); },
    ping: function (out, f, vol) { var t = ctx.currentTime; A.tone(out, 'sine', f, 0, t, 1.6, vol); A.tone(out, 'sine', f, 0, t + 0.45, 1.4, vol * 0.35); A.tone(out, 'sine', f, 0, t + 0.9, 1.2, vol * 0.12); },
    bubbles: function (out, n, vol) { var t = ctx.currentTime; for (var i = 0; i < n; i++) { var f = 280 + Math.random() * 500; A.tone(out, 'sine', f, f * 2.4, t + i * (0.05 + Math.random() * 0.12), 0.08, vol); } },
    blasts: function (out, n, vol) { var t = ctx.currentTime; for (var i = 0; i < n; i++) { A.tone(out, 'sawtooth', 1500, 220, t + i * 0.22, 0.2, vol); } },
    call: function (out, vol) { var t = ctx.currentTime, o = ctx.createOscillator(), f = ctx.createBiquadFilter(); o.type = 'sawtooth'; o.frequency.setValueAtTime(900, t); o.frequency.exponentialRampToValueAtTime(1700, t + 0.35); o.frequency.exponentialRampToValueAtTime(600, t + 1.1);
      f.type = 'bandpass'; f.frequency.value = 1300; f.Q.value = 3; o.connect(f); f.connect(A.env(out, t, 1.2, vol)); o.start(t); o.stop(t + 1.25); }
  };

  function build(id, r) {
    var spec = PLACES[id], p = r.boardPos; if (!spec || !p) return null;
    var g = ctx.createGain(), pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null; g.gain.value = 0;
    if (pan) { g.connect(pan); pan.connect(ctx.destination); } else g.connect(ctx.destination);
    var out = ctx.createGain(); out.gain.value = spec.gain; out.connect(g);
    spec.bed(A, out);
    return { spec: spec, g: g, pan: pan, out: out, x: p.x, z: p.z, next: ctx.currentTime + 1 + Math.random() * 3, lvl: 0 };
  }
  function tick() {
    if (!ctx || ctx.state !== 'running') return;
    var R = (API.getProps() || {}).rides || {}, pp = API.player && API.player.pos, cam = API.camera, t = ctx.currentTime;
    Object.keys(PLACES).forEach(function (id) { if (!(id in places) && R[id]) places[id] = build(id, R[id]); });
    var riding = !!(API.state && API.state.activeRide), yaw = 0;
    if (cam) { var d = cam.getWorldDirection(new API.THREE.Vector3()); yaw = Math.atan2(d.x, d.z); }
    Object.keys(places).forEach(function (id) {
      var k = places[id]; if (!k) return;
      var dist = pp ? Math.hypot(pp.x - k.x, pp.z - k.z) : 999;
      var H = k.spec.hear || HEAR, lvl = riding ? 0 : Math.max(0, Math.min(1, (H - dist) / (H - 6)));
      lvl = lvl * lvl * 0.55;
      k.g.gain.setTargetAtTime(lvl, t, 0.35); k.lvl = lvl;
      if (k.pan && pp) { var a = Math.atan2(k.x - pp.x, k.z - pp.z) - yaw; k.pan.pan.setTargetAtTime(Math.max(-0.85, Math.min(0.85, -Math.sin(a))), t, 0.15); }
      if (lvl > 0.005 && t > k.next) { try { k.spec.ev(A, k.out); } catch (e) {} k.next = t + k.spec.every[0] + Math.random() * (k.spec.every[1] - k.spec.every[0]); }
    });
  }
  /* for checking by hand: which places are built and how loud each is now */
  root.TPAmbience = { levels: function () { var o = {}; Object.keys(places).forEach(function (id) { if (places[id]) o[id] = +places[id].lvl.toFixed(3); }); return { state: ctx ? ctx.state : 'none', places: o }; } };
  function start(api) {
    API = api;
    var wake = function () { if (ac()) { removeEventListener('pointerdown', wake, true); removeEventListener('keydown', wake, true); } };
    addEventListener('pointerdown', wake, true); addEventListener('keydown', wake, true);
    setInterval(tick, 150);
    document.addEventListener('visibilitychange', function () { if (!ctx) return; if (document.hidden) ctx.suspend().catch(function () {}); else ctx.resume().catch(function () {}); });
  }
  if (root.TPParkAPI && root.TPParkAPI.scene) start(root.TPParkAPI);
  else root.addEventListener('tp:park-ready', function (e) { start(e.detail || root.TPParkAPI); }, { once: true });
})(window);
