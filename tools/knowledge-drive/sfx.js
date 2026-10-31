/* Minest SFX — the Dynamic presentations' sounds, synthesised live with Web Audio (no files to load).
   window.MinestSfx
   - engine(profile) → { set(speed01, gas, braking), stop() }   one running engine: piston (lexus/p911/bentley/revuelto), electric (luce/spectre)
   - ignite(profile)   starter crank → catch → rev flare (piston) · key click → power-up sweep → chime (electric); returns the engine
   - loop(kind)      → { set(speed01), stop() }   rail · steps · ship · hum · outdoor (breeze, birds, rain, crickets, thunder — set(v, MinestWX.state())) · indoor
   - play(name)        door · brake · horn · tick · chime · ding · click · whoosh · jump · trainhorn · thud · hmm(k) · pop · bark · meow · baa · moo · cluck · yip
   - muted() / mute(on)   remembered in localStorage (minest.sfx = 'off')
   The context starts on the first touch anywhere (iOS needs a gesture) and sleeps while the page is hidden. */
(function () {
  if (window.MinestSfx) return;
  var AC = null, OUT = null, NOISE = null, KEY = 'minest.sfx', live = [];
  function muted() { try { return localStorage.getItem(KEY) === 'off'; } catch (e) { return false; } }
  function ctx() {
    if (!AC) { var C = window.AudioContext || window.webkitAudioContext; if (!C) return null; try { AC = new C(); } catch (e) { return null; }
      OUT = AC.createDynamicsCompressor(); OUT.threshold.value = -14; OUT.ratio.value = 4; var g = AC.createGain(); g.gain.value = muted() ? 0 : .8; OUT.connect(g); g.connect(AC.destination); OUT.vol = g; }
    if (AC.state === 'suspended' && !document.hidden) try { AC.resume(); } catch (e) {}
    return AC;
  }
  function noiseBuf() { if (NOISE) return NOISE; var n = AC.sampleRate * 2, b = AC.createBuffer(1, n, AC.sampleRate), d = b.getChannelData(0), last = 0;
    for (var i = 0; i < n; i++) { var w = Math.random() * 2 - 1; last = (last + .04 * w) / 1.04; d[i] = w * .55 + last * 2.4; } return (NOISE = b); }   // white + a little brown
  function noise() { var s = AC.createBufferSource(); s.buffer = noiseBuf(); s.loop = true; s.loopStart = Math.random(); s.start(); return s; }
  function osc(type, f) { var o = AC.createOscillator(); o.type = type; o.frequency.value = f; o.start(); return o; }
  function gain(v) { var g = AC.createGain(); g.gain.value = v; return g; }
  function filt(type, f, q) { var b = AC.createBiquadFilter(); b.type = type; b.frequency.value = f; if (q != null) b.Q.value = q; return b; }
  function shaper(k) { var w = AC.createWaveShaper(), n = 1024, c = new Float32Array(n); for (var i = 0; i < n; i++) { var x = i * 2 / n - 1; c[i] = (1 + k) * x / (1 + k * Math.abs(x)); } w.curve = c; return w; }
  function to(p, v, tc) { p.setTargetAtTime(v, AC.currentTime, tc || .06); }
  function env(g, a, peak, d, t0) { var t = t0 || AC.currentTime; g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(.0001, t + a + d); }
  function chain(nodes) { for (var i = 0; i < nodes.length - 1; i++) nodes[i].connect(nodes[i + 1]); return nodes[nodes.length - 1]; }
  function kill(list, at) { setTimeout(function () { list.forEach(function (n) { try { n.stop && n.stop(); } catch (e) {} try { n.disconnect(); } catch (e) {} }); }, (at || 0) * 1000 + 50); }

  // ---------------------------------------------------------------- engines
  var PROF = {
    lexus: { cyl: 8, idle: 750, red: 7100, tone: 1, bright: .9, burble: .5 },
    p911: { cyl: 6, idle: 900, red: 7400, tone: 1, bright: 1.1, turbo: .05 },
    bentley: { cyl: 12, idle: 700, red: 6000, tone: .8, bright: .6 },
    revuelto: { cyl: 12, idle: 1000, red: 9200, tone: 1.15, bright: 1.5 },
    luce: { ev: 1, whine: 1 },
    spectre: { ev: 1, whine: .45 }
  };
  function prof(p) { return typeof p === 'object' && p ? p : PROF[p] || PROF.lexus; }
  function engine(profile) {
    if (!ctx()) return { set: function () {}, stop: function () {} };
    var P = prof(profile), bus = gain(0), all = [], rpm = P.idle || 0, v = 0; bus.connect(OUT); to(bus.gain, .9, .3);
    // road and wind under every car
    var rn = noise(), rf = filt('bandpass', 380, .7), rg = gain(0); chain([rn, rf, rg, bus]); all.push(rn);
    var wn = noise(), wf = filt('highpass', 1400), wg = gain(0); chain([wn, wf, wg, bus]); all.push(wn);
    // brake squeal (only from speed) + pad hiss
    var sq = osc('sine', 2350), sqv = osc('sine', 7), sqd = gain(40), sqg = gain(0); sqv.connect(sqd); sqd.connect(sq.frequency); chain([sq, sqg, bus]); all.push(sq, sqv);
    var hn = noise(), hf = filt('bandpass', 3200, 1.4), hg = gain(0); chain([hn, hf, hg, bus]); all.push(hn);
    var E = {};
    if (P.ev) {   // electric: two whining tones that rise with speed, a soft synth bed
      var w1 = osc('sine', 180), w2 = osc('triangle', 270), wg1 = gain(0), wg2 = gain(0), bed = osc('sawtooth', 55), bf = filt('lowpass', 220), bg = gain(.05 * P.whine);
      chain([w1, wg1, bus]); chain([w2, wg2, bus]); chain([bed, bf, bg, bus]); all.push(w1, w2, bed);
      E.tick = function (r, gas) { to(w1.frequency, 160 + 1500 * r); to(w2.frequency, 240 + 2300 * r); to(wg1.gain, (.03 + .09 * r + (gas ? .05 : 0)) * P.whine); to(wg2.gain, (.012 + .04 * r) * P.whine); to(bf.frequency, 160 + 500 * r); };
    } else {   // pistons: the firing note (saw + a lumpy square an octave down), through a throttle-opened low-pass and a soft clip
      var o1 = osc('sawtooth', 50), o2 = osc('square', 25), o3 = osc('sawtooth', 50.6), m = gain(1), g2 = gain(.45), g3 = gain(.5), lp = filt('lowpass', 600, 2.2), sh = shaper(6), eg = gain(.0);
      o1.connect(m); o2.connect(g2); g2.connect(m); o3.connect(g3); g3.connect(m); chain([m, lp, sh, eg, bus]); all.push(o1, o2, o3);
      var lfo = osc('sine', 6), lg = gain(0); lfo.connect(lg); lg.connect(eg.gain); all.push(lfo);   // the V8's uneven beat
      var tb = P.turbo ? osc('sine', 1800) : null, tg = gain(0); if (tb) { chain([tb, tg, bus]); all.push(tb); }
      E.tick = function (r, gas) {
        var tgt; if (r < .02) tgt = P.idle; else { var gp = Math.min(r, 1.25) / 1.25 * 5, fr = gp % 1, gear = Math.floor(gp); tgt = P.idle + (P.red - P.idle) * (.3 + .55 * fr + (gear > 3 ? .1 : 0)); }
        if (gas) tgt = Math.min(P.red, tgt * 1.12); rpm += (tgt - rpm) * .12;
        var f = rpm / 60 * P.cyl / 2 * .5 * (P.tone || 1);
        to(o1.frequency, f, .04); to(o2.frequency, f / 2, .04); to(o3.frequency, f * 1.006, .04);
        to(lp.frequency, (240 + 1500 * (rpm / P.red) + (gas ? 900 : 0)) * (P.bright || 1), .05);
        to(eg.gain, .16 + .22 * (rpm / P.red) + (gas ? .12 : 0), .08); to(lg.gain, P.burble ? .08 * (1 - rpm / P.red) : 0); to(lfo.frequency, f / 8);
        if (tb) { to(tb.frequency, 1500 + 2600 * (rpm / P.red)); to(tg.gain, gas ? P.turbo : P.turbo * .2); }
      };
      E.flare = function () { rpm = P.idle * 3.2; };
    }
    var dead = false, last = 0;
    E.set = function (speed01, gas, braking) {
      if (dead || !AC) return; var now = AC.currentTime; if (now - last < .03) return; last = now;   // ~30 updates a second is plenty
      v = Math.max(0, speed01); E.tick(v, !!gas);
      to(rg.gain, Math.min(.16, v * .14)); to(rf.frequency, 300 + 500 * v); to(wg.gain, Math.max(0, v - .5) * .08);
      var sqk = braking && v > .3 ? Math.min(.05, (v - .3) * .09) : 0; to(sqg.gain, sqk, .03); to(hg.gain, braking && v > .05 ? .025 : 0, .05);
    };
    E.stop = function (fade) { if (dead) return; dead = true; to(bus.gain, 0, fade || .15); kill(all.concat([bus]), (fade || .15) * 4); live = live.filter(function (x) { return x !== E; }); };
    E.profile = P; live.push(E); return E;
  }
  function ignite(profile) {
    if (!ctx()) return engine(profile);
    var P = prof(profile), t = AC.currentTime;
    if (P.ev) {   // key click → a rising power-up sweep → two-note chime, then the electric bed fades in
      play('click');
      var sw = osc('sawtooth', 110), sf = filt('lowpass', 300, 6), sg = gain(0); chain([sw, sf, sg, OUT]);
      sw.frequency.setValueAtTime(110, t + .15); sw.frequency.exponentialRampToValueAtTime(880, t + 1.1); sf.frequency.setValueAtTime(300, t + .15); sf.frequency.exponentialRampToValueAtTime(4200, t + 1.1);
      sg.gain.setValueAtTime(0, t + .15); sg.gain.linearRampToValueAtTime(.09, t + .8); sg.gain.exponentialRampToValueAtTime(.0001, t + 1.5); kill([sw], 1.6);
      bell(1318.5, t + 1.05, .12, 1.4); bell(1975.5, t + 1.3, .1, 1.6);
      var E = engine(P); return E;
    }
    // starter motor: a whirr pulsing with the compression strokes, then the engine catches and flares
    var st = osc('sawtooth', 160), sl = filt('lowpass', 900), am = osc('square', 11), amg = gain(.5), sgn = gain(0); am.connect(amg); amg.connect(sgn.gain);
    chain([st, sl, sgn, OUT]); sgn.gain.setValueAtTime(.0, t); sgn.gain.linearRampToValueAtTime(.12, t + .05); sgn.gain.setValueAtTime(.12, t + .85); sgn.gain.linearRampToValueAtTime(0, t + .95);
    amg.gain.setValueAtTime(.5, t); amg.gain.setValueAtTime(0, t + .95); kill([st, am], 1.1);
    var E2 = null; setTimeout(function () { E2 = engine(P); if (E2.flare) E2.flare(); E2.set(0, false, false); play('thud'); }, 900);
    var proxy = { set: function (a, b, c) { if (E2) E2.set(a, b, c); }, stop: function (f) { if (E2) E2.stop(f); else setTimeout(function () { if (E2) E2.stop(f); }, 950); }, profile: P };
    return proxy;
  }
  // ---------------------------------------------------------------- loops for the other rides
  function loop(kind) {
    if (!ctx()) return { set: function () {}, stop: function () {} };
    var bus = gain(0), all = [], L = { v: 0 }, nextClack = 0; bus.connect(OUT); to(bus.gain, 1, .4);
    if (kind === 'rail') {   // a low rumble, and the wheels clacking over rail joints faster with speed
      var rn = noise(), rf = filt('lowpass', 160), rg = gain(.0); chain([rn, rf, rg, bus]); all.push(rn);
      L.set = function (v) { L.v = v; to(rg.gain, .05 + .25 * v); to(rf.frequency, 120 + 260 * v); var now = AC.currentTime;
        if (v > .05 && now >= nextClack) { clack(now); clack(now + .11); nextClack = now + Math.max(.35, 1.6 - v * 1.3); } };
    } else if (kind === 'steps') {   // running: footsteps at a cadence that follows the pace
      var nx = 0, side = 0;
      L.set = function (v) { L.v = v; var now = AC.currentTime; if (v > .05 && now >= nx) { step(now, side++ % 2); nx = now + Math.max(.26, .62 - v * .32); } };
    } else if (kind === 'ship') {   // the freighter: detuned saws under a low-pass, a sub, and a whistle rising with thrust
      var a = osc('sawtooth', 55), b = osc('sawtooth', 55.8), sub = osc('sine', 41), lp = filt('lowpass', 260, 3), g = gain(.07), sg = gain(.14), wh = osc('sine', 900), wg = gain(0);
      a.connect(lp); b.connect(lp); chain([lp, g, bus]); chain([sub, sg, bus]); chain([wh, wg, bus]); all.push(a, b, sub, wh);
      L.set = function (v) { L.v = v; to(lp.frequency, 200 + 900 * v); to(a.frequency, 52 + 30 * v); to(b.frequency, 52.9 + 30 * v); to(wh.frequency, 700 + 1400 * v); to(wg.gain, .012 * v); };
    } else if (kind === 'outdoor') {   // outside: a breeze that rises and falls, and birds now and then
      var wn = noise(), wf = filt('lowpass', 420), wg = gain(.03), wl = osc('sine', .13), wd = gain(.022); wl.connect(wd); wd.connect(wg.gain); chain([wn, wf, wg, bus]); all.push(wn, wl);
      var rn3 = noise(), rh = filt('highpass', 900), rl = filt('lowpass', 7000), rg3 = gain(0); chain([rn3, rh, rl, rg3, bus]); all.push(rn3);   // rain on leaves and roofs
      var nb = 0, nc = 0, nt = 0;
      L.set = function (v, W) {   // W: MinestWX.state() — wind, rain, night, a storm's thunder; without it, a plain fair day
        L.v = v; W = W || {}; var now = AC.currentTime, night = W.phase === 'night', rain = W.rain || 0, wind = W.wind == null ? .25 : W.wind;
        if (W.muffled) { to(wg.gain, 0, .5); to(rg3.gain, rain * .05 * v, .8); to(rl.frequency, 900, .5); return; }   // heard from indoors: only the rain, through the walls
        to(wg.gain, (.02 + .07 * wind) * v * (W.snow ? .7 : 1), .8); to(wf.frequency, 300 + 700 * wind, .8); to(rg3.gain, rain * .09 * v, .8);
        if (v > 0 && !night && rain < .2 && !W.snow && now >= nb) { birds(now, v); nb = now + 1.6 + Math.random() * 4.5; }
        if (v > 0 && night && rain < .3 && now >= nc) { crickets(now, v); nc = now + .8 + Math.random() * 1.6; }
        if (v > 0 && W.cond === 'storm' && now >= nt) { if (nt) thunder(v); nt = now + 7 + Math.random() * 14; }
      };
    } else if (kind === 'indoor') {   // a room: a low, quiet air
      var rn2 = noise(), rf2 = filt('lowpass', 240), rg2 = gain(.018), mh = osc('sine', 60), mg = gain(.006); chain([rn2, rf2, rg2, bus]); chain([mh, mg, bus]); all.push(rn2, mh);
      L.set = function (v) { L.v = v; };
    } else {   // hum: an elevator / a museum's air
      var h = osc('sine', 96), hg = gain(.05), hn2 = noise(), hf = filt('lowpass', 500), hng = gain(.02); chain([h, hg, bus]); chain([hn2, hf, hng, bus]); all.push(h, hn2);
      L.set = function (v) { L.v = v; to(hg.gain, .03 + .06 * v); to(h.frequency, 90 + 40 * v); };
    }
    L.stop = function () { to(bus.gain, 0, .2); kill(all.concat([bus]), .9); live = live.filter(function (x) { return x !== L; }); };
    live.push(L); L.set(0); return L;
  }
  function birds(t, v) {   // a bird's few chirps, each a quick upward sweep
    var n = 2 + (Math.random() * 3 | 0), f0 = 2300 + Math.random() * 1400;
    for (var i = 0; i < n; i++) { var o = osc('sine', f0), g = gain(0), at = t + i * (.09 + Math.random() * .05); chain([o, g, OUT]); o.frequency.setValueAtTime(f0, at); o.frequency.exponentialRampToValueAtTime(f0 * (1.25 + Math.random() * .3), at + .06); env(g, .005, .035 * v, .07, at); kill([o], at - AC.currentTime + .2); }
  }
  function crickets(t, v) { for (var i = 0; i < 3; i++) { var o = osc('sine', 4300 + Math.random() * 300), am = osc('square', 38), ag = gain(.5), g = gain(0); am.connect(ag); ag.connect(g.gain); chain([o, g, OUT]); var at = t + i * .22; env(g, .01, .012 * v, .16, at); kill([o, am], at - AC.currentTime + .3); } }
  function thunder(v) {   // the flash's sound: a crack, then a long low roll
    var t = AC.currentTime, n = noise(), f = filt('lowpass', 900), g = gain(0); chain([n, f, g, OUT]); f.frequency.setValueAtTime(900, t); f.frequency.exponentialRampToValueAtTime(90, t + 2.5); env(g, .02, .28 * v, 3.2); kill([n], 3.5);
    if (window.MinestWXFlash) try { window.MinestWXFlash(); } catch (e) {}
  }
  function voice(f0, f1, dur, form, vol, wobble, type) {   // a voiced sound: a buzz sliding f0 → f1 through a vowel formant (animals, people)
    var t = AC.currentTime, o = osc(type || 'sawtooth', f0), bp = filt('bandpass', form, 2.5), g = gain(0); chain([o, bp, g, OUT]);
    o.frequency.setValueAtTime(f0, t); o.frequency.linearRampToValueAtTime(f1, t + dur);
    if (wobble) { var lf = osc('sine', wobble), lg = gain(f0 * .08); lf.connect(lg); lg.connect(o.frequency); kill([lf], dur + .2); }
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .04); g.gain.setValueAtTime(vol, t + dur * .7); g.gain.exponentialRampToValueAtTime(.0001, t + dur); kill([o], dur + .1);
  }
  function clack(t) { var n = noise(), f = filt('bandpass', 900, 2), g = gain(0); chain([n, f, g, OUT]); env(g, .004, .18, .09, t); kill([n], t - AC.currentTime + .2); }
  function step(t, side) { var n = noise(), f = filt('lowpass', side ? 520 : 440), g = gain(0); chain([n, f, g, OUT]); env(g, .006, .22, .11, t); kill([n], t - AC.currentTime + .2); }
  function bell(f, t, v, d) { [1, 2.76, 5.4].forEach(function (h, i) { var o = osc('sine', f * h), g = gain(0); chain([o, g, OUT]); env(g, .005, v / (i * 2.2 + 1), d / (i + 1), t); kill([o], t - AC.currentTime + d + .1); }); }

  // ---------------------------------------------------------------- one-shots
  function play(name, k) {   // k: a pitch factor for voices (a kid speaks higher)
    if (!ctx() || muted()) return; var t = AC.currentTime, n, f, g, o;
    switch (name) {
      case 'click': n = noise(); f = filt('highpass', 2500); g = gain(0); chain([n, f, g, OUT]); env(g, .002, .25, .03); kill([n], .1);
        o = osc('sine', 1900); var og = gain(0); chain([o, og, OUT]); env(og, .002, .05, .05); kill([o], .1); break;
      case 'thud': case 'door': o = osc('sine', name === 'door' ? 70 : 52); g = gain(0); chain([o, g, OUT]); env(g, .005, .35, .3); o.frequency.exponentialRampToValueAtTime(38, t + .3); kill([o], .4);
        n = noise(); f = filt('lowpass', 420); var ng = gain(0); chain([n, f, ng, OUT]); env(ng, .003, .22, .14); kill([n], .25); break;
      case 'brake': n = noise(); f = filt('bandpass', 3400, 1.2); g = gain(0); chain([n, f, g, OUT]); env(g, .01, .05, .22); kill([n], .3); break;
      case 'horn': [349, 440].forEach(function (fr) { var h = osc('square', fr), hf = filt('lowpass', 1600), hg = gain(0); chain([h, hf, hg, OUT]); hg.gain.setValueAtTime(0, t); hg.gain.linearRampToValueAtTime(.07, t + .02); hg.gain.setValueAtTime(.07, t + .45); hg.gain.linearRampToValueAtTime(0, t + .5); kill([h], .6); }); break;
      case 'trainhorn': [311, 370, 466].forEach(function (fr) { var h = osc('sawtooth', fr), hf = filt('lowpass', 1300), hg = gain(0); chain([h, hf, hg, OUT]); hg.gain.setValueAtTime(0, t); hg.gain.linearRampToValueAtTime(.05, t + .08); hg.gain.setValueAtTime(.05, t + 1.1); hg.gain.linearRampToValueAtTime(0, t + 1.3); kill([h], 1.4); }); break;
      case 'tick': n = noise(); f = filt('bandpass', 1700, 4); g = gain(0); chain([n, f, g, OUT]); env(g, .001, .3, .03); kill([n], .1);
        var n2 = noise(), f2 = filt('bandpass', 1200, 4), g2 = gain(0); chain([n2, f2, g2, OUT]); env(g2, .001, .22, .03, t + .36); kill([n2], .5); break;
      case 'chime': bell(659.3, t, .12, 1.2); bell(523.3, t + .42, .12, 1.4); break;
      case 'ding': bell(1046.5, t, .1, 1.1); break;
      case 'whoosh': n = noise(); f = filt('bandpass', 400, 1.5); g = gain(0); chain([n, f, g, OUT]); f.frequency.exponentialRampToValueAtTime(3200, t + .45); env(g, .12, .14, .4); kill([n], .7); break;
      case 'bark': voice(420, 260, .13, 900, .16); setTimeout(function () { voice(440, 270, .12, 950, .14); }, 190); break;
      case 'meow': voice(520, 760, .22, 1300, .1); setTimeout(function () { voice(760, 430, .3, 1100, .1); }, 200); break;
      case 'baa': voice(330, 300, .7, 1000, .1, 28); break;
      case 'moo': voice(115, 92, 1.1, 480, .2); break;
      case 'cluck': [0, 140, 260].forEach(function (d, i) { setTimeout(function () { voice(620 + i * 40, 480, .07, 1500, .1, 0, 'square'); }, d); }); break;
      case 'yip': voice(700, 1100, .12, 1600, .1); setTimeout(function () { voice(800, 500, .15, 1400, .09); }, 160); break;
      case 'hmm':   // a villager's "hrm": a voiced buzz through a vowel formant, sliding down
        k = k || 1; o = osc('sawtooth', 190 * k); f = filt('bandpass', 700 * Math.sqrt(k), 3); g = gain(0); chain([o, f, g, OUT]); o.frequency.setValueAtTime(190 * k, t); o.frequency.exponentialRampToValueAtTime(130 * k, t + .32); if (Math.random() < .5) o.frequency.exponentialRampToValueAtTime(170 * k, t + .42); env(g, .03, .12, .3); kill([o], .45); break;
      case 'pop': o = osc('sine', 500); g = gain(0); chain([o, g, OUT]); o.frequency.exponentialRampToValueAtTime(1200, t + .08); env(g, .005, .14, .12); kill([o], .2); break;
      case 'thunder': thunder(1); break;
      case 'jump':   // hyperspace: a long rising sweep, then the boom of the jump
        o = osc('sawtooth', 60); f = filt('lowpass', 200, 8); g = gain(0); chain([o, f, g, OUT]); o.frequency.exponentialRampToValueAtTime(900, t + 1.4); f.frequency.exponentialRampToValueAtTime(5000, t + 1.4);
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.1, t + 1.2); g.gain.exponentialRampToValueAtTime(.0001, t + 1.8); kill([o], 1.9);
        setTimeout(function () { play('thud'); play('whoosh'); }, 1350); break;
    }
  }
  function indicator(times) { for (var i = 0; i < (times || 3); i++) setTimeout(function () { play('tick'); }, i * 720); }

  function unlock() { ctx(); }
  ['pointerdown', 'touchend', 'keydown'].forEach(function (ev) { document.addEventListener(ev, unlock, { capture: true, passive: true }); });
  document.addEventListener('visibilitychange', function () { if (!AC) return; try { if (document.hidden) AC.suspend(); else AC.resume(); } catch (e) {} });

  window.MinestSfx = {
    engine: engine, ignite: ignite, loop: loop, play: play, indicator: indicator,
    muted: muted,
    mute: function (on) { try { localStorage.setItem(KEY, on ? 'off' : 'on'); } catch (e) {} if (OUT) OUT.vol.gain.value = on ? 0 : .8; },
    stopAll: function () { live.slice().forEach(function (x) { x.stop(); }); }
  };
})();
