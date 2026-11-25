/* Minest My World · "Millennium Falcon: Smugglers Run" show audio (`falcon-audio.js`)
 * WebAudio-synthesised: sublight engine drone, hyperdrive charge and tunnel roar, quad lasers, explosions,
 * hull impacts, TIE fly-by howl, harpoon, alarm klaxon, plus an adaptive score that follows the mission
 * (briefing, launch fanfare, combat ostinato, hyperspace shimmer, victory). Hondo's lines use the browser
 * speech synthesiser. The score is an original composition: no film music is reproduced. */
(function (root) {
  'use strict';

  function create() {
    let ctx = null, master = null, music = null, sfx = null, noiseBuf = null, eng = null;
    let level = 0, duck = 1, mode = 'off', nextT = 0, step = 0, alarm = false, alarmT = 0, engV = 0, roarV = 0, speaking = false, spk = 0;
    const STEP = 60 / 138 / 2;
    const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

    const HERO = [60, 0, 60, 64, 67, 0, 0, 72, 71, 0, 67, 0, 69, 0, 0, 0, 65, 0, 65, 69, 72, 0, 0, 77, 76, 0, 74, 0, 72, 0, 0, -1];
    const HERO_BASS = [36, 33, 41, 43];
    const OST = [38, 38, 41, 38, 45, 38, 41, 40, 38, 38, 41, 38, 46, 45, 43, 41];
    const STAB = [62, -1, -1, 65, -1, -1, 69, 0, 68, 0, 0, 0, -1, -1, -1, -1, 62, -1, -1, 65, -1, -1, 70, 0, 69, 0, 0, 0, -1, -1, 74, 0];
    const MYST = [50, -1, 57, -1, 62, 65, -1, -1, 50, -1, 58, -1, 62, 67, -1, -1];

    function init() {
      if (ctx) return true;
      const AC = root.AudioContext || root.webkitAudioContext;
      if (!AC) return false;
      try { ctx = new AC(); } catch (e) { ctx = null; return false; }
      master = ctx.createGain(); master.gain.value = 0;
      const comp = ctx.createDynamicsCompressor();
      master.connect(comp); comp.connect(ctx.destination);
      music = ctx.createGain(); music.gain.value = 0.55; music.connect(master);
      sfx = ctx.createGain(); sfx.gain.value = 0.9; sfx.connect(master);
      const dly = ctx.createDelay(0.5), fb = ctx.createGain(), wet = ctx.createGain();
      dly.delayTime.value = 0.23; fb.gain.value = 0.28; wet.gain.value = 0.2;
      music.connect(dly); dly.connect(fb); fb.connect(dly); dly.connect(wet); wet.connect(master);
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      // Engine: low saw drone + rumble, and a band of noise for the hyperspace tunnel
      const o = ctx.createOscillator(), o2 = ctx.createOscillator(), lp = ctx.createBiquadFilter(), og = ctx.createGain();
      o.type = 'sawtooth'; o2.type = 'sawtooth'; o.frequency.value = 40; o2.frequency.value = 60.5; lp.type = 'lowpass'; lp.frequency.value = 240; og.gain.value = 0;
      o.connect(lp); o2.connect(lp); lp.connect(og); og.connect(master);
      const mk = (freq, q) => {
        const s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
        const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q;
        const g = ctx.createGain(); g.gain.value = 0; s.connect(f); f.connect(g); g.connect(master); s.start();
        return g;
      };
      eng = { o, o2, og, ng: mk(170, 0.6), rg: mk(900, 0.4) };
      o.start(); o2.start();
      nextT = ctx.currentTime + 0.1;
      return true;
    }
    function env(g, t, a, peak, d) {
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
    }
    function tone(type, f, t, a, d, peak, dest, f2, lp) {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type; o.frequency.setValueAtTime(f, t);
      if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + a + d);
      env(g, t, a, peak, d);
      let n = o;
      if (lp) { const fl = ctx.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = lp; o.connect(fl); n = fl; }
      n.connect(g); g.connect(dest); o.start(t); o.stop(t + a + d + 0.05);
    }
    function noise(t, a, d, peak, dest, type, freq, q, f2) {
      const s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
      const fl = ctx.createBiquadFilter(); fl.type = type; fl.frequency.setValueAtTime(freq, t); fl.Q.value = q || 0.7;
      if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t + a + d);
      const g = ctx.createGain(); env(g, t, a, peak, d);
      s.connect(fl); fl.connect(g); g.connect(dest); s.start(t, Math.random() * 1.5); s.stop(t + a + d + 0.05);
    }
    const brass = (m, t, d, p) => { tone('sawtooth', mtof(m), t, 0.03, d, p, music, 0, 1500); tone('sawtooth', mtof(m) * 1.006, t, 0.03, d, p * 0.7, music, 0, 1100); };
    const strings = (m, t, p) => tone('sawtooth', mtof(m), t, 0.01, 0.16, p, music, 0, 800);
    const timp = (m, t, p) => tone('sine', mtof(m) * 1.3, t, 0.005, 0.4, p, music, mtof(m) * 0.9);
    const pad = (ms, t, d, p) => ms.forEach((m) => tone('triangle', mtof(m), t, d * 0.4, d * 0.6, p, music, 0, 1800));

    function schedule(s, t) {
      if (mode === 'hero') {
        const n = HERO[s % 32];
        if (n > 0) { let len = 1; while (HERO[(s + len) % 32] === 0 && len < 8) len++; brass(n, t, STEP * len * 0.95, 0.075); brass(n - 12, t, STEP * len * 0.95, 0.04); }
        if (s % 8 === 0) { const r = HERO_BASS[(s / 8) % 4 | 0]; timp(r, t, 0.2); pad([r + 12, r + 16, r + 19], t, STEP * 8, 0.035); }
        if (s % 8 === 6) noise(t, 0.002, 0.09, 0.05, music, 'highpass', 2500);
      } else if (mode === 'combat') {
        strings(OST[s % 16], t, 0.085); strings(OST[s % 16] + 12, t, 0.03);
        if (s % 4 === 2) noise(t, 0.002, 0.07, 0.06, music, 'highpass', 3000);
        if (s % 8 === 0) timp(26, t, 0.22);
        const n = STAB[s % 32];
        if (n > 0) { let len = 1; while (STAB[(s + len) % 32] === 0 && len < 6) len++; brass(n, t, STEP * len * 0.9, 0.06); }
      } else if (mode === 'mystery') {
        const n = MYST[s % 16];
        if (n > 0) tone('triangle', mtof(n), t, 0.01, 0.5, 0.05, music);
        if (s % 32 === 0) pad([38, 45, 53], t, STEP * 32, 0.035);
      } else if (mode === 'calm') {
        if (s % 32 === 0) pad([50, 57, 60, 64], t, STEP * 32, 0.04);
        if (s % 16 === 10) tone('sine', mtof(76 + (s % 3) * 3), t, 0.01, 1.2, 0.03, music);
      } else if (mode === 'shimmer') {
        if (s % 16 === 0) pad([57, 61, 64, 68, 73], t, STEP * 16, 0.05);
        if (s % 2 === 0) tone('sine', mtof(81 + [0, 4, 7, 11, 12, 7][(s / 2) % 6 | 0]), t, 0.005, 0.25, 0.02, music);
      }
    }

    const api = {
      start() {
        if (!init()) return;
        if (ctx.state === 'suspended') ctx.resume().catch(() => {});
        level = 0.6;
      },
      stop() {
        level = 0; alarm = false; engV = 0; roarV = 0;
        if (speaking && root.speechSynthesis) root.speechSynthesis.cancel();
        spk++; speaking = false; duck = 1;
      },
      setMode(m) { if (m !== mode) { mode = m; step = 0; if (ctx) nextT = Math.max(nextT, ctx.currentTime + 0.05); } },
      setEngine(v, roar) { engV = v; roarV = roar || 0; },
      setAlarm(on) { alarm = on; },
      laser() { if (!ctx) return; const t = ctx.currentTime; tone('sawtooth', 1250, t, 0.004, 0.17, 0.09, sfx, 190, 3200); tone('square', 900, t, 0.004, 0.1, 0.03, sfx, 240); },
      boom() { if (!ctx) return; const t = ctx.currentTime; noise(t, 0.005, 0.7, 0.4, sfx, 'lowpass', 1800, 0.5, 90); tone('sine', 110, t, 0.005, 0.5, 0.3, sfx, 32); },
      hit() { if (!ctx) return; const t = ctx.currentTime; noise(t, 0.003, 0.35, 0.45, sfx, 'bandpass', 420, 0.8, 120); tone('triangle', 150, t, 0.003, 0.3, 0.3, sfx, 40); noise(t + 0.05, 0.01, 0.4, 0.08, sfx, 'highpass', 4500); },
      tie() {
        if (!ctx) return; const t = ctx.currentTime;
        tone('sawtooth', 560, t, 0.35, 0.75, 0.07, sfx, 300, 2200); tone('sawtooth', 583, t, 0.35, 0.75, 0.06, sfx, 316, 2200);
        noise(t, 0.35, 0.7, 0.07, sfx, 'bandpass', 1500, 2.5, 600);
      },
      lever() { if (!ctx) return; const t = ctx.currentTime; noise(t, 0.002, 0.08, 0.2, sfx, 'bandpass', 900, 3); tone('square', 180, t + 0.03, 0.004, 0.1, 0.07, sfx, 90); },
      hyperIn() {
        if (!ctx) return; const t = ctx.currentTime;
        tone('sawtooth', 90, t, 1.15, 0.25, 0.14, sfx, 1500, 2400); tone('sine', 180, t, 1.15, 0.3, 0.1, sfx, 2600);
        noise(t + 1.15, 0.01, 1.1, 0.5, sfx, 'lowpass', 3000, 0.5, 150); tone('sine', 70, t + 1.15, 0.01, 0.9, 0.35, sfx, 28);
      },
      hyperOut() { if (!ctx) return; const t = ctx.currentTime; noise(t, 0.01, 0.9, 0.4, sfx, 'lowpass', 2600, 0.5, 120); tone('sawtooth', 900, t, 0.01, 0.8, 0.08, sfx, 70, 2000); },
      harpoon() { if (!ctx) return; const t = ctx.currentTime; noise(t, 0.002, 0.14, 0.3, sfx, 'bandpass', 700, 2); tone('sawtooth', 220, t + 0.1, 0.05, 1.4, 0.05, sfx, 660, 1400); },
      pickup() { if (!ctx) return; const t = ctx.currentTime; [72, 76, 79, 84].forEach((m, i) => tone('sine', mtof(m), t + i * 0.08, 0.005, 0.5, 0.09, sfx)); },
      powerUp() { if (!ctx) return; const t = ctx.currentTime; tone('sawtooth', 45, t, 1.8, 0.6, 0.1, sfx, 190, 600); [0, 0.25, 0.5, 0.9, 1.3].forEach((d, i) => tone('square', 700 + i * 130, t + d, 0.004, 0.07, 0.03, sfx)); },
      speak(text, onEnd) {
        const id = ++spk, V = root.TPVoice;
        if (!V) { if (onEnd) onEnd(); return; }
        V.say(text, { onStart: () => { speaking = true; duck = 0.4; }, onEnd: () => { if (id === spk) { speaking = false; duck = 1; } if (onEnd) onEnd(); } });
      },
      isSpeaking: () => speaking,
      update(dt) {
        if (!ctx) return;
        const now = ctx.currentTime;
        master.gain.setTargetAtTime(level, now, 0.25);
        music.gain.setTargetAtTime(0.55 * duck, now, 0.2);
        eng.o.frequency.setTargetAtTime(36 + engV * 46, now, 0.4); eng.o2.frequency.setTargetAtTime(54.5 + engV * 69, now, 0.4);
        eng.og.gain.setTargetAtTime(engV > 0.01 ? 0.05 + engV * 0.1 : 0, now, 0.3);
        eng.ng.gain.setTargetAtTime(engV * 0.09, now, 0.3); eng.rg.gain.setTargetAtTime(roarV * 0.16, now, 0.3);
        if (level <= 0) { nextT = now + 0.1; return; }
        if (alarm && (alarmT -= dt) <= 0) { alarmT = 0.7; tone('square', 620, now, 0.01, 0.18, 0.045, sfx, 0, 1800); tone('square', 465, now + 0.22, 0.01, 0.18, 0.045, sfx, 0, 1800); }
        if (nextT < now) nextT = now + 0.02;
        while (nextT < now + 0.18) { if (mode !== 'off') schedule(step, nextT); step++; nextT += STEP; }
      }
    };
    return api;
  }

  root.TPFalconAudio = { create };
})(window);
