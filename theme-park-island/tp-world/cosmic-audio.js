/* Minest My World · "Guardians of the Galaxy: Cosmic Rewind" show audio (`cosmic-audio.js`)
 * WebAudio-synthesised: four selectable "Awesome Mix" grooves (drums, bass, chord stabs, brass lead), ambient
 * beds for the Galaxarium and the tense Celestial scenes, wind tied to coaster speed, plus teleport, jump-point,
 * launch, explosion, brake and alarm effects. Character lines use the browser speech synthesiser.
 * Every groove is an original composition: no commercial recording or melody is reproduced. */
(function (root) {
  'use strict';

  const SONGS = [
    { name: '《星云迪斯科》', bpm: 124, root: 45, minor: true, prog: [0, 0, 5, 7], stab: [2, 6, 10, 14],
      bass: [0, -1, 12, 0, -1, 0, 12, -1, 0, -1, 12, 0, 7, -1, 10, 12], lead: [12, -1, 15, 12, -1, 19, 17, -1, 15, -1, 12, -1, 10, 12, -1, -1] },
    { name: '《超新星放克》', bpm: 112, root: 40, minor: true, prog: [0, 3, 5, 0], stab: [3, 4, 11, 12],
      bass: [0, 0, -1, 10, 12, -1, 0, -1, 0, 3, -1, 5, -1, 7, 10, -1], lead: [7, 10, 12, -1, 15, -1, 12, 10, 7, -1, 10, -1, 12, -1, -1, -1] },
    { name: '《彗星公路》', bpm: 132, root: 43, minor: false, prog: [0, 5, 9, 7], stab: [0, 6, 8, 14],
      bass: [0, -1, 0, -1, 0, -1, 0, -1, 0, -1, 0, -1, 0, -1, 7, 7], lead: [4, 7, 12, -1, 11, 12, 14, -1, 16, -1, 14, 12, 9, -1, 7, -1] },
    { name: '《引力摇摆》', bpm: 118, root: 41, minor: false, prog: [0, 9, 5, 7], stab: [4, 7, 12, 15],
      bass: [0, -1, 7, -1, 12, -1, 7, 0, -1, 0, 7, -1, 12, -1, 9, 7], lead: [12, -1, 9, 7, -1, 4, 7, -1, 9, 12, -1, 14, 12, -1, -1, -1] }
  ];

  function create() {
    let ctx = null, master = null, music = null, sfx = null, noiseBuf = null, wind = null;
    let level = 0, duck = 1, mode = 'off', nextT = 0, step = 0, alarm = false, alarmT = 0, speed = 0, speaking = false, spk = 0;
    let song = SONGS[0], STEP = 60 / song.bpm / 4;
    const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

    function init() {
      if (ctx) return true;
      const AC = root.AudioContext || root.webkitAudioContext;
      if (!AC) return false;
      try { ctx = new AC(); } catch (e) { ctx = null; return false; }
      master = ctx.createGain(); master.gain.value = 0;
      const comp = ctx.createDynamicsCompressor();
      master.connect(comp); comp.connect(ctx.destination);
      music = ctx.createGain(); music.gain.value = 0.6; music.connect(master);
      sfx = ctx.createGain(); sfx.gain.value = 0.9; sfx.connect(master);
      const dly = ctx.createDelay(0.5), fb = ctx.createGain(), wet = ctx.createGain();
      dly.delayTime.value = 0.21; fb.gain.value = 0.25; wet.gain.value = 0.16;
      music.connect(dly); dly.connect(fb); fb.connect(dly); dly.connect(wet); wet.connect(master);
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      const s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
      const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 400; f.Q.value = 0.5;
      const g = ctx.createGain(); g.gain.value = 0; s.connect(f); f.connect(g); g.connect(master); s.start();
      wind = { f, g };
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
    const brass = (m, t, d, p) => { tone('sawtooth', mtof(m), t, 0.02, d, p, music, 0, 1700); tone('sawtooth', mtof(m) * 1.007, t, 0.02, d, p * 0.7, music, 0, 1200); };
    const pad = (ms, t, d, p) => ms.forEach((m) => tone('triangle', mtof(m), t, d * 0.4, d * 0.6, p, music, 0, 1800));
    const third = (off) => (song.minor ? ([3, 8, 10].indexOf(off) >= 0 ? 4 : 3) : ([2, 4, 9].indexOf(off) >= 0 ? 3 : 4));

    function schedule(s, t) {
      const st = s % 16, bar = (s / 16) | 0;
      if (mode === 'groove') {
        const off = song.prog[bar % 4], r = song.root + off;
        if (st % 4 === 0) tone('sine', 150, t, 0.003, 0.2, 0.5, music, 42);
        if (st === 4 || st === 12) { noise(t, 0.002, 0.13, 0.2, music, 'bandpass', 1900, 0.8); tone('triangle', 190, t, 0.002, 0.08, 0.12, music, 120); }
        if (st % 2 === 0) noise(t, 0.001, st % 4 === 2 ? 0.09 : 0.03, st % 4 === 2 ? 0.07 : 0.035, music, 'highpass', 6500);
        const b = song.bass[st];
        if (b >= 0) { tone('sawtooth', mtof(r + b), t, 0.005, STEP * 0.95, 0.17, music, 0, 460); tone('sine', mtof(r + b), t, 0.005, STEP * 0.9, 0.12, music); }
        if (song.stab.indexOf(st) >= 0) [0, third(off), 7].forEach((i) => tone('square', mtof(r + 12 + i), t, 0.004, 0.1, 0.028, music, 0, 2300));
        if (st === 0) pad([r + 12, r + 12 + third(off), r + 19], t, STEP * 16, 0.018);
        if (bar % 4 >= 2 && st % 2 === 0) { const n = song.lead[(bar % 2) * 8 + st / 2]; if (n >= 0) brass(song.root + 12 + n, t, STEP * 1.8, 0.05); }
      } else if (mode === 'tense') {
        if (st % 2 === 0) tone('sawtooth', mtof(26), t, 0.005, 0.14, 0.13, music, 0, 320);
        if (st === 0) pad([38, 39, 45, 50], t, STEP * 16, 0.035);
        if (st % 8 === 0) tone('sine', mtof(26) * 1.3, t, 0.005, 0.5, 0.25, music, mtof(26) * 0.9);
        if (s % 32 === 20) brass(50, t, STEP * 6, 0.04);
      } else if (mode === 'galaxy') {
        if (s % 32 === 0) pad([48, 55, 62, 64, 71], t, STEP * 32, 0.04);
        if (st % 4 === 0) tone('sine', mtof(72 + [0, 7, 4, 11, 7, 14, 12, 4][(s / 4) % 8 | 0]), t, 0.005, 0.7, 0.028, music);
      } else if (mode === 'calm') {
        if (s % 32 === 0) pad([song.root + 12, song.root + 16, song.root + 19, song.root + 24], t, STEP * 32, 0.045);
        if (s % 16 === 10) tone('sine', mtof(song.root + 36 + (bar % 3) * 4), t, 0.01, 1.2, 0.03, music);
      }
    }

    return {
      songs: SONGS.map((s) => s.name),
      setSong(i) { song = SONGS[i % SONGS.length]; STEP = 60 / song.bpm / 4; },
      start() {
        if (!init()) return;
        if (ctx.state === 'suspended') ctx.resume().catch(() => {});
        level = 0.6;
      },
      stop() {
        level = 0; alarm = false; speed = 0;
        if (speaking && root.speechSynthesis) root.speechSynthesis.cancel();
        spk++; speaking = false; duck = 1;
      },
      setMode(m) { if (m !== mode) { mode = m; step = 0; if (ctx) nextT = Math.max(nextT, ctx.currentTime + 0.05); } },
      setSpeed(v) { speed = v; },
      setAlarm(on) { alarm = on; },
      fx(name) {
        if (!ctx || level <= 0) return;
        const t = ctx.currentTime;
        if (name === 'teleport') {
          tone('sine', 220, t, 1.1, 0.5, 0.14, sfx, 2600); tone('triangle', 330, t, 1.1, 0.5, 0.08, sfx, 3900);
          noise(t + 1.0, 0.02, 1.2, 0.3, sfx, 'highpass', 3000, 0.6, 9000);
        } else if (name === 'portal') {
          tone('sawtooth', 55, t, 0.9, 1.2, 0.13, sfx, 440, 900); noise(t, 0.8, 1.4, 0.16, sfx, 'bandpass', 300, 1.2, 2400);
        } else if (name === 'launch') {
          noise(t, 0.05, 2.2, 0.5, sfx, 'lowpass', 400, 0.5, 5200); tone('sawtooth', 70, t, 0.1, 1.8, 0.2, sfx, 520, 1400); tone('sine', 110, t, 0.01, 0.9, 0.3, sfx, 30);
        } else if (name === 'boom') {
          noise(t, 0.005, 1.6, 0.6, sfx, 'lowpass', 2400, 0.5, 70); tone('sine', 120, t, 0.005, 1.2, 0.5, sfx, 24); noise(t + 0.1, 0.3, 1.8, 0.12, sfx, 'highpass', 5000);
        } else if (name === 'brake') {
          noise(t, 0.05, 1.6, 0.22, sfx, 'highpass', 3500, 0.6, 1500); tone('triangle', 520, t, 0.02, 0.9, 0.04, sfx, 130);
        } else if (name === 'chime') {
          [72, 76, 79, 84].forEach((m, i) => tone('sine', mtof(m), t + i * 0.09, 0.005, 0.6, 0.09, sfx));
        }
      },
      speak(text, pitch) {
        const ss = root.speechSynthesis;
        if (!ss || !root.SpeechSynthesisUtterance || level <= 0) return;
        try {
          const u = new root.SpeechSynthesisUtterance(text);
          u.lang = 'zh-CN'; u.rate = 1.15; u.pitch = pitch || 1; u.volume = 0.9;
          const id = ++spk;
          ss.cancel(); speaking = true; duck = 0.45;
          u.onend = u.onerror = () => { if (id !== spk) return; speaking = false; duck = 1; };
          ss.speak(u);
        } catch (e) { speaking = false; duck = 1; }
      },
      update(dt) {
        if (!ctx) return;
        const now = ctx.currentTime;
        master.gain.setTargetAtTime(level, now, 0.25);
        music.gain.setTargetAtTime(0.6 * duck, now, 0.2);
        wind.g.gain.setTargetAtTime(speed * speed * 0.2, now, 0.3); wind.f.frequency.setTargetAtTime(300 + speed * 1500, now, 0.3);
        if (level <= 0) { nextT = now + 0.1; return; }
        if (alarm && (alarmT -= dt) <= 0) { alarmT = 0.8; tone('square', 620, now, 0.01, 0.2, 0.04, sfx, 0, 1800); tone('square', 465, now + 0.25, 0.01, 0.2, 0.04, sfx, 0, 1800); }
        if (nextT < now) nextT = now + 0.02;
        while (nextT < now + 0.18) { if (mode !== 'off') schedule(step, nextT); step++; nextT += STEP; }
      }
    };
  }

  root.TPCosmicAudio = { create };
})(window);
