/* Pet Raising — voice bridge v1 (43.7).
   Connects the octopus to Minest's realtime voice (voice-realtime-43.7.js in the parent page):
   - the "Live voice" button asks the parent page to open its voice panel (postMessage: the frame is
     cross-origin inside the iOS app, so the parent cannot reach into this document);
   - voice state → behaviour: listening = attentive, closed mouth; thinking = curious + hum;
     speaking = happy, calm swimming facing the viewer;
   - lip sync: each spoken sentence becomes a viseme timeline (Chinese: one syllable per character,
     vowel varied per character, short closures between; English: letters → visemes), advanced at
     the speech rate and re-synced on every word boundary the speech engine reports. Shapes go to
     window.__octoMouth.viseme(), the same entry point real phoneme data would use later. */
(function () {
  'use strict';
  if (window.__octoVoiceBridge) return;
  var inFrame = window.parent && window.parent !== window;

  // ---- Live voice button → parent voice panel ------------------------------------------------------
  if (inFrame) {
    document.addEventListener('click', function (event) {
      var button = event.target && event.target.closest ? event.target.closest('button[aria-label="Live voice"]') : null;
      if (!button) return;
      event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation();
      try { window.parent.postMessage({ type: 'minest-voice', action: 'open' }, '*'); } catch (e) {}
    }, true);
    // Parent pages can open the panel before this iframe finishes loading.
    // Announce readiness so the parent can replay the current voice state and
    // the active sentence timeline without relying on a fragile load race.
    try { window.parent.postMessage({ type: 'minest-voice', action: 'ready' }, '*'); } catch (e) {}
  }

  function mouth() { return window.__octoMouth || null; }
  function eyes() { return window.__v6EyeHighlight || null; }
  function motion() { return window.__motionV3 || window.__motionV2 || null; }

  // ---- text → viseme timeline -------------------------------------------------------------------------
  var CJK = /[㐀-鿿豈-﫿]/;
  var PAUSE = /[，,、；;：:。.!！?？…\n]/;
  var CJK_VOWELS = ['aa', 'E', 'O', 'I', 'aa', 'U', 'E', 'aa', 'O'];
  function letterViseme(ch) {
    ch = ch.toLowerCase();
    if ('a'.indexOf(ch) >= 0) return 'aa';
    if ('e'.indexOf(ch) >= 0) return 'E';
    if ('iy'.indexOf(ch) >= 0) return 'I';
    if ('o'.indexOf(ch) >= 0) return 'O';
    if ('uw'.indexOf(ch) >= 0) return 'U';
    if ('bmp'.indexOf(ch) >= 0) return 'PP';
    if ('fv'.indexOf(ch) >= 0) return 'FF';
    if ('szcxj'.indexOf(ch) >= 0) return 'SS';
    if ('dtln'.indexOf(ch) >= 0) return 'DD';
    if ('kgqh'.indexOf(ch) >= 0) return 'kk';
    if ('r'.indexOf(ch) >= 0) return 'RR';
    return null;
  }
  // builds [{at: ms, v: viseme, i: charIndex}] for a sentence at the given speech rate
  function timeline(text, rate) {
    var out = [], t = 0, k = 1 / Math.max(.5, rate || 1);
    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      if (CJK.test(ch)) {
        var code = ch.charCodeAt(0);
        // most syllables open on a consonant: a brief closure/narrowing, then the vowel
        if (code % 3 === 0) out.push({ at: t, v: code % 2 ? 'PP' : 'DD', i: i });
        else if (code % 3 === 1) out.push({ at: t, v: 'SS', i: i });
        out.push({ at: t + 45 * k, v: CJK_VOWELS[code % CJK_VOWELS.length], i: i });
        t += 205 * k;
      } else if (PAUSE.test(ch)) {
        out.push({ at: t, v: 'sil', i: i }); t += 230 * k;
      } else if (/\s/.test(ch)) {
        t += 25 * k;
      } else if (/[a-z]/i.test(ch)) {
        var v = letterViseme(ch);
        if (v) out.push({ at: t, v: v, i: i });
        t += 62 * k;
      } else if (/[0-9]/.test(ch)) {
        out.push({ at: t, v: 'E', i: i }); t += 160 * k;
      }
    }
    out.push({ at: t, v: 'sil', i: text.length });
    return out;
  }

  // ---- playback ---------------------------------------------------------------------------------------
  var speaking = null;   // { tl, start, idx }
  var realtimeLevel = 0;
  function startSentence(text, rate, seq) {
    var value = String(text || '').trim();
    if (!value) { speaking = null; return; }
    speaking = { tl: timeline(value, rate), start: performance.now(), idx: 0, seq: seq || 0 };
  }
  function resyncTo(charIndex, seq) {
    if (!speaking || (seq && speaking.seq && seq !== speaking.seq)) return;
    var tl = speaking.tl;
    for (var j = 0; j < tl.length; j++) if (tl[j].i >= charIndex) {
      // shift the clock so this word starts now (the engine knows the real timing)
      speaking.start = performance.now() - tl[j].at; speaking.idx = j; return;
    }
  }
  function tick() {
    requestAnimationFrame(tick);
    var m = mouth();
    if (!m) return;
    // Realtime WebRTC has no browser speech-boundary events. Drive the same
    // mouth compositor from the remote audio RMS while keeping the text
    // timeline for the legacy SpeechSynthesis fallback.
    if (realtimeLevel > .012) {
      var open = Math.min(.92, realtimeLevel * 1.55);
      m.live({ open: open, wide: .88 + realtimeLevel * .22, round: .08 + realtimeLevel * .55, smile: .42, press: 0 });
    }
    if (!speaking) return;
    var t = performance.now() - speaking.start, tl = speaking.tl;
    while (speaking.idx < tl.length - 1 && tl[speaking.idx + 1].at <= t) speaking.idx++;
    var cur = tl[speaking.idx];
    if (!cur) return;
    if (t > tl[tl.length - 1].at + 400) { m.viseme('sil', 0); speaking = null; return; }
    // a little weight variation keeps it from looking mechanical
    m.viseme(cur.v, cur.v === 'sil' ? 0 : .78 + .22 * Math.sin(t * .021 + cur.i));
  }
  requestAnimationFrame(tick);

  // ---- voice state → octopus behaviour ---------------------------------------------------------------
  var calm = false;
  function setCalm(on) {
    var mo = motion();
    if (!mo || calm === on) return;
    calm = on;
    // while talking or listening, no spins or wild steps: the face stays readable
    if (mo.setEnabled) mo.setEnabled(!on);
  }
  function onState(state) {
    var e = eyes(), m = mouth();
    if (state === 'listening') { setCalm(true); if (e) e.setExpression('curious', 0); if (m) { m.stop && m.stop(); m.mood('shy'); } }
    else if (state === 'thinking') { setCalm(true); if (e) e.setExpression('curious', 0); if (m && m.play) m.play('hum', 150); }
    else if (state === 'speaking') { setCalm(true); if (e) e.setExpression('happy', 0); if (m) m.mood('happy'); }
    else if (state === 'connecting') { if (e) e.setExpression('surprised', 1200); }
    else if (state === 'error') { setCalm(false); if (e) e.setExpression('sad', 2500); if (m && m.play) m.play('pout'); }
    else { setCalm(false); speaking = null; if (e) e.setExpression('neutral', 0); if (m) { m.viseme('sil', 0); m.mood('neutral'); } }
  }

  window.addEventListener('message', function (event) {
    var d = event.data;
    if (!d || d.type !== 'minest-voice-state') return;
    if (inFrame && event.source !== window.parent) return;
    if (d.kind === 'state') onState(d.state);
    else if (d.kind === 'speak-start') startSentence(d.text, d.rate, d.seq);
    else if (d.kind === 'boundary') resyncTo(d.charIndex || 0, d.seq);
    else if (d.kind === 'audio-level') {
      realtimeLevel += (Math.max(0, Math.min(1, Number(d.level) || 0)) - realtimeLevel) * .45;
      if (realtimeLevel <= .012 && !speaking) { var closed = mouth(); if (closed) closed.live({ open: 0, wide: 1, round: 0, smile: .45, press: 0 }); }
    }
    else if (d.kind === 'speak-end' && (!speaking || !d.seq || d.seq === speaking.seq)) { speaking = null; var m = mouth(); if (m) m.viseme('sil', 0); }
  });

  window.__octoVoiceBridge = { say: function (text, rate) { startSentence(text, rate); }, state: onState, timeline: timeline };
})();
