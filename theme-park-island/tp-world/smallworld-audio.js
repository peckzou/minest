/* Minest My World · "it's a small world" show audio (`smallworld-audio.js`)
 * WebAudio-synthesised ride soundtrack: one original marching tune that is re-orchestrated room by room
 * (music box, accordion, koto, marimba, mariachi, steel guitar, banjo, bells + choir), water ambience,
 * facade clock chimes and Mr. Lincoln's speech (Gettysburg Address, via the browser speech synthesiser).
 * The tune is an original composition: the real attraction's song is under copyright and is not reproduced. */
(function (root) {
  'use strict';

  function create() {
    let ctx = null, master = null, musicBus = null, ambGain = null, noiseBuf = null;
    let room = 'outdoor', level = 0, duck = 1, nextT = 0, step = 0, t0 = 0, speaking = false;
    const BPM = 116, SPB = 60 / BPM, STEP = SPB / 2;

    // 8 bars of eighth notes. 0 = hold previous note, -1 = rest.
    const MEL = [
      64, 0, 67, 0, 72, 0, 67, 64, 69, 0, 72, 0, 76, 0, 72, 69,
      65, 0, 69, 0, 72, 69, 65, 69, 67, 0, 71, 0, 74, 0, 0, 0,
      76, 0, 74, 72, 67, 0, 64, 0, 69, 0, 67, 69, 72, 0, 69, 0,
      62, 65, 69, 74, 71, 67, 71, 74, 72, 0, 0, 0, 72, 0, 0, -1
    ];
    // One chord per half bar: [root midi, isMinor]
    const CH = [[48, 0], [48, 0], [45, 1], [45, 1], [41, 0], [41, 0], [43, 0], [43, 0],
                [48, 0], [48, 0], [45, 1], [45, 1], [38, 1], [43, 0], [48, 0], [48, 0]];
    const CTR = [67, 64, 64, 60, 65, 69, 67, 62, 67, 72, 72, 69, 65, 67, 64, 64];
    const SCALE = [0, 2, 4, 5, 7, 9, 11];
    const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
    const penta = (m) => { const pc = m % 12; return pc === 5 ? m - 1 : pc === 11 ? m - 2 : m; };
    const thirdAbove = (m) => {
      const pc = m % 12, i = SCALE.indexOf(pc);
      if (i < 0) return m + 4;
      const j = i + 2;
      return m - pc + SCALE[j % 7] + (j >= 7 ? 12 : 0);
    };

    function init() {
      if (ctx) return true;
      const AC = root.AudioContext || root.webkitAudioContext;
      if (!AC) return false;
      try { ctx = new AC(); } catch (e) { ctx = null; return false; }
      master = ctx.createGain(); master.gain.value = 0;
      const comp = ctx.createDynamicsCompressor();
      master.connect(comp); comp.connect(ctx.destination);
      musicBus = ctx.createGain(); musicBus.gain.value = 0.9; musicBus.connect(master);
      // Show-building echo
      const dly = ctx.createDelay(0.5), fb = ctx.createGain(), lp = ctx.createBiquadFilter(), wet = ctx.createGain();
      dly.delayTime.value = 0.19; fb.gain.value = 0.3; lp.type = 'lowpass'; lp.frequency.value = 2400; wet.gain.value = 0.24;
      musicBus.connect(dly); dly.connect(lp); lp.connect(fb); fb.connect(dly); lp.connect(wet); wet.connect(master);
      // Shared noise buffer (water + percussion)
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      // Flume water ambience
      const src = ctx.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 650; bp.Q.value = 0.5;
      ambGain = ctx.createGain(); ambGain.gain.value = 0.05;
      const lfo = ctx.createOscillator(), lfoG = ctx.createGain(); lfo.frequency.value = 0.23; lfoG.gain.value = 0.02;
      lfo.connect(lfoG); lfoG.connect(ambGain.gain);
      src.connect(bp); bp.connect(ambGain); ambGain.connect(master);
      src.start(); lfo.start();
      t0 = ctx.currentTime; nextT = t0 + 0.08;
      return true;
    }

    function voice(type, f, t, dur, vol, o) {
      o = o || {};
      const osc = ctx.createOscillator(), g = ctx.createGain();
      osc.type = type;
      if (o.bend) { osc.frequency.setValueAtTime(f * o.bend, t); osc.frequency.exponentialRampToValueAtTime(f, t + (o.bendT || 0.06)); }
      else osc.frequency.setValueAtTime(f, t);
      if (o.det) osc.detune.value = o.det;
      const a = o.a || 0.006, tail = o.r || 0.06;
      const len = o.pluck || dur;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(vol, t + a);
      if (o.pluck) g.gain.exponentialRampToValueAtTime(0.0001, t + o.pluck);
      else { g.gain.setValueAtTime(vol, Math.max(t + a + 0.001, t + dur - 0.02)); g.gain.linearRampToValueAtTime(0.0001, t + dur + tail); }
      if (o.vib) {
        const l = ctx.createOscillator(), lg = ctx.createGain();
        l.frequency.value = o.vibF || 5.5; lg.gain.value = f * o.vib;
        l.connect(lg); lg.connect(osc.frequency); l.start(t); l.stop(t + len + tail + 0.1);
      }
      let out = g;
      if (o.lp) { const fl = ctx.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = o.lp; g.connect(fl); out = fl; }
      osc.connect(g); out.connect(o.dest || musicBus);
      osc.start(t); osc.stop(t + len + tail + 0.1);
    }
    function noise(t, dur, vol, hp) {
      const s = ctx.createBufferSource(), g = ctx.createGain(), f = ctx.createBiquadFilter();
      s.buffer = noiseBuf; f.type = 'highpass'; f.frequency.value = hp || 5000;
      g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      s.connect(f); f.connect(g); g.connect(musicBus);
      s.start(t, Math.random() * 1.5); s.stop(t + dur + 0.05);
    }
    const drum = (t, f, vol, len) => voice('sine', f, t, 0, vol, { pluck: len || 0.2, bend: 1.9, bendT: 0.05 });
    const block = (t, f, vol) => voice('square', f, t, 0, vol, { pluck: 0.045, lp: 3200 });

    function oompah(t, pos, r, th, fi, type, vol, lp) {
      if (pos === 0) voice('triangle', mtof(r - 12), t, STEP * 1.6, vol * 1.5);
      else if (pos === 4) voice('triangle', mtof(fi - 24), t, STEP * 1.6, vol * 1.4);
      else if (pos === 2 || pos === 6) for (const n of [th + 12, fi + 12, r + 24]) voice(type, mtof(n), t, 0, vol * 0.55, { pluck: 0.16, lp: lp || 2600 });
    }

    function schedule(i, t) {
      const pos = i % 8, half = Math.floor(i / 4);
      const r = CH[half][0], th = r + (CH[half][1] ? 3 : 4), fi = r + 7;
      let m = MEL[i], n = 1;
      if (m > 0) { let k = i + 1; while (k < MEL.length && MEL[k] === 0) { n++; k++; } }
      const d = n * STEP, f = m > 0 ? mtof(m) : 0;
      switch (room) {
        case 'hello': // music box
          if (f) { voice('sine', f * 2, t, 0, 0.12, { pluck: 1.0 }); voice('sine', f * 4, t, 0, 0.03, { pluck: 0.35 }); }
          voice('sine', mtof([r, th, fi, th][pos % 4] + 24), t, 0, 0.035, { pluck: 0.5 });
          if (pos === 0) voice('sine', mtof(r), t, 0, 0.09, { pluck: 1.4 });
          break;
        case 'europe': // accordion + oom-pah
          if (f) for (const dt of [-8, 8]) voice('sawtooth', f, t, d * 0.94, 0.05, { lp: 1900, det: dt, a: 0.025 });
          oompah(t, pos, r, th, fi, 'sawtooth', 0.085, 1700);
          break;
        case 'asia': // koto, gong, woodblock
          if (f) { const pf = mtof(penta(m)); voice('triangle', pf, t, 0, 0.15, { pluck: 0.75, bend: 1.045, bendT: 0.05 }); voice('sine', pf * 2, t, 0, 0.04, { pluck: 0.3 }); }
          if (i % 32 === 0) voice('sine', mtof(36), t, 0, 0.2, { pluck: 3.2 });
          if (pos === 0 || pos === 4) voice('triangle', mtof(penta(r) - 12), t, 0, 0.11, { pluck: 0.6 });
          if (pos === 2 || pos === 6 || pos === 7) block(t, 1250, 0.035);
          break;
        case 'africa': // marimba + hand drums
          if (f) { voice('sine', f, t, 0, 0.18, { pluck: 0.3 }); voice('sine', f * 4, t, 0, 0.045, { pluck: 0.07 }); }
          if (pos === 0 || pos === 3 || pos === 6) drum(t, 92, 0.26, 0.24);
          if (pos === 2 || pos === 5 || pos === 7) drum(t, 230, 0.11, 0.12);
          noise(t, 0.045, pos % 2 ? 0.035 : 0.018, 6500);
          if (pos === 4) voice('sine', mtof(fi + 12), t, 0, 0.07, { pluck: 0.25 });
          break;
        case 'latin': // trumpets in thirds, maracas, tumbao bass
          if (f) {
            voice('sawtooth', f, t, d * 0.9, 0.055, { lp: 2700, a: 0.03, vib: 0.006 });
            voice('sawtooth', mtof(thirdAbove(m)), t, d * 0.9, 0.04, { lp: 2700, a: 0.03, vib: 0.006 });
          }
          noise(t, 0.05, pos % 2 ? 0.05 : 0.02, 5200);
          if (pos === 0) voice('triangle', mtof(r - 12), t, STEP * 1.3, 0.13);
          else if (pos === 3) voice('triangle', mtof(fi - 12), t, STEP * 1.3, 0.12);
          else if (pos === 6) voice('triangle', mtof(r), t, STEP * 1.3, 0.11);
          if (pos === 2 || pos === 5) for (const c of [th + 12, fi + 12, r + 24]) voice('triangle', mtof(c), t, 0, 0.045, { pluck: 0.14 });
          break;
        case 'seas': // steel guitar + ukulele
          if (f) voice('sine', f, t, d, 0.15, { bend: 0.944, bendT: 0.15, vib: 0.009, a: 0.02, r: 0.3 });
          if (pos === 2 || pos === 3 || pos === 6) [th + 12, fi + 12, r + 24, th + 24].forEach((c, k) => voice('triangle', mtof(c), t + k * 0.012, 0, 0.04, { pluck: 0.22 }));
          if (pos === 0 || pos === 4) voice('sine', mtof(pos ? fi - 12 : r - 12), t, STEP * 2, 0.14, { a: 0.02 });
          if (pos === 4) noise(t, 0.5, 0.012, 1800);
          break;
        case 'america': // banjo roll + clip-clop
          if (f) voice('sawtooth', f * 2, t, 0, 0.075, { pluck: 0.24, lp: 3600 });
          else voice('sawtooth', mtof((pos % 2 ? fi : th) + 24), t, 0, 0.04, { pluck: 0.16, lp: 3600 });
          oompah(t, pos, r, th, fi, 'triangle', 0.09);
          if (pos % 2 === 0) block(t, pos % 4 ? 760 : 980, 0.04);
          break;
        case 'finale': // bells, organ, choir counter-melody, glockenspiel sparkle
          if (f) {
            voice('sine', f * 2, t, 0, 0.1, { pluck: 1.1 }); voice('sine', f * 5.52, t, 0, 0.018, { pluck: 0.45 });
            voice('triangle', f, t, d * 0.95, 0.075, { a: 0.015 });
          }
          if (pos % 4 === 0) {
            voice('sine', mtof(CTR[half]), t, STEP * 4 * 0.96, 0.085, { a: 0.06, vib: 0.005, r: 0.12 });
            voice('sine', mtof(CTR[half] + 12), t, STEP * 4 * 0.96, 0.03, { a: 0.08, vib: 0.005, r: 0.12 });
            for (const c of [r + 12, th + 12, fi + 12]) voice('triangle', mtof(c), t, STEP * 4 * 0.96, 0.022, { a: 0.1, r: 0.15 });
          }
          oompah(t, pos, r, th, fi, 'triangle', 0.08);
          voice('sine', mtof([r, th, fi, r + 12][(i * 3) % 4] + 36), t, 0, 0.022, { pluck: 0.3 });
          if (pos === 0) noise(t, 0.3, 0.02, 7000);
          break;
        default: // outdoor band organ
          if (f) { voice('square', f, t, d * 0.9, 0.04, { lp: 2100 }); voice('square', f * 2, t, d * 0.9, 0.016, { lp: 3000 }); }
          oompah(t, pos, r, th, fi, 'triangle', 0.06);
      }
    }

    function pickVoice() {
      const ss = root.speechSynthesis; if (!ss) return null;
      const vs = ss.getVoices().filter((v) => /^en/i.test(v.lang));
      return vs.find((v) => /Daniel|Alex|Fred|David|Mark|Male|Guy|Arthur/i.test(v.name)) || vs[0] || null;
    }

    return {
      start() { if (init() && ctx.state === 'suspended') ctx.resume(); },
      active() { return !!ctx && ctx.state === 'running'; },
      setRoom(id) { room = id; },
      setLevel(v) { level = v; },
      speak(text, onEnd) {
        const ss = root.speechSynthesis;
        if (!ss || !root.SpeechSynthesisUtterance) { if (onEnd) onEnd(); return; }
        try {
          ss.cancel();
          const u = new root.SpeechSynthesisUtterance(text);
          const v = pickVoice(); if (v) u.voice = v;
          u.lang = 'en-US'; u.rate = 0.84; u.pitch = 0.62; u.volume = 1;
          speaking = true; duck = 0.28;
          u.onend = u.onerror = () => { speaking = false; duck = 1; if (onEnd) onEnd(); };
          ss.speak(u);
        } catch (e) { speaking = false; duck = 1; if (onEnd) onEnd(); }
      },
      hush() {
        if (speaking && root.speechSynthesis) root.speechSynthesis.cancel();
        speaking = false; duck = 1;
      },
      isSpeaking() { return speaking; },
      chime() {
        if (!ctx || ctx.state !== 'running') return;
        const t = ctx.currentTime + 0.05;
        [72, 76, 79, 84, 79, 76, 79, 84, 88].forEach((m, i) => {
          voice('sine', mtof(m), t + i * 0.27, 0, 0.16, { pluck: 1.6, dest: master });
          voice('sine', mtof(m) * 2.76, t + i * 0.27, 0, 0.03, { pluck: 0.6, dest: master });
        });
      },
      tick(hi) { if (ctx && ctx.state === 'running' && level > 0.02) voice('square', hi ? 1500 : 1100, ctx.currentTime + 0.01, 0, 0.05, { pluck: 0.03, lp: 4000, dest: master }); },
      // Returns the musical position in beats (drives doll choreography and light pulses).
      update(fallbackBeats) {
        if (!ctx || ctx.state !== 'running') return fallbackBeats;
        const now = ctx.currentTime;
        master.gain.setTargetAtTime(level, now, 0.3);
        musicBus.gain.setTargetAtTime(0.9 * duck, now, 0.25);
        if (level < 0.004) { nextT = now + 0.1; return (now - t0) / SPB; }
        if (nextT < now - 0.05) nextT = now + 0.05;
        while (nextT < now + 0.28) { schedule(step, nextT); nextT += STEP; step = (step + 1) % MEL.length; }
        return (now - t0) / SPB;
      }
    };
  }

  root.TPSmallWorldAudio = { create };
})(window);
