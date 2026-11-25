/* One voice for the park's rides (`voice.js`): the Falcon, its crew and the staged shows all speak through here.
 * - Spoken only while you are on a ride; anywhere else a line is a caption and nothing more.
 * - Sparse: after a line has been spoken the voice rests a few seconds; lines in that pause, or while one is still
 *   being spoken, stay captions. No line is cut off half way.
 * - The device's best voice for the language at its natural pitch and pace (pitch-shifted speech is what made the
 *   characters sound broken). */
(function (root) {
  'use strict';
  var REST = 5.5, VOICE = {}, busy = false, quietUntil = 0, gen = 0;
  function now() { return performance.now() / 1000; }
  function bestVoice(lang) {
    if (VOICE[lang] !== undefined) return VOICE[lang];
    var vs = []; try { vs = root.speechSynthesis.getVoices() || []; } catch (e) {}
    if (!vs.length) return null;
    var pre = lang === 'en' ? /^en/i : /^zh|cmn/i, list = vs.filter(function (v) { return pre.test(v.lang); });
    var score = function (v) {
      var n = v.name + ' ' + v.lang, s = 0;
      if (/premium|enhanced|natural|neural|siri|高级|优化/i.test(n)) s += 8;
      if (lang === 'en' ? /en[-_](US|GB)/i.test(v.lang) : /zh[-_](CN|Hans)|cmn/i.test(v.lang)) s += 3;
      if (/Tingting|Ting-Ting|婷婷|Lili|莉莉|Yu-shu|Xiaoxiao|晓晓|Yunxi|Samantha|Ava|Evan|Zoe|Daniel|Karen|Google/i.test(n)) s += 2;
      if (/compact|eloquence|Albert|Bad News|Bahh|Bells|Boing|Bubbles|Cellos|Wobble|Zarvox|Trinoids|Whisper|Organ|Jester|Junior|Ralph|Fred|Superstar|Good News|Deranged|Hysterical|Grandma|Grandpa|Rocko|Shelley|Reed|Sandy|Flo|Eddy/i.test(n)) s -= 9;
      if (v.localService) s += 1;
      return s;
    };
    list.sort(function (a, b) { return score(b) - score(a); });
    return (VOICE[lang] = list[0] || null);
  }
  try { if (root.speechSynthesis) root.speechSynthesis.addEventListener('voiceschanged', function () { VOICE = {}; }); } catch (e) {}
  function riding() { var A = root.TPParkAPI; return !!(A && A.state && A.state.activeRide); }
  /* say(text, { lang: 'zh'|'en', onStart, onEnd, any: true to speak off a ride too }) → true when it is spoken */
  function say(text, o) {
    o = o || {};
    var done = function () { if (o.onEnd) try { o.onEnd(); } catch (e) {} };
    var ss = root.speechSynthesis, t = now();
    /* droids beep, they do not read their beeps aloud */
    var droid = /BB-8|R2|D-O|机器人|droid/i.test(o.who || '') || /^[\s哔嘀嘟呜啵咕哩～~—\-！!。，,…]+$/.test(String(text || '').replace(/（[^）]*）|\([^)]*\)/g, ''));
    if (!text || droid || !ss || !root.SpeechSynthesisUtterance || (!riding() && !o.any) || busy || t < quietUntil) {
      if (o.onEnd) setTimeout(done, Math.min(6000, 400 + String(text || '').length * 110));   /* keep a story's pace */
      return false;
    }
    try {
      var lang = o.lang === 'en' ? 'en' : 'zh', u = new root.SpeechSynthesisUtterance(text), v = bestVoice(lang), id = ++gen;
      u.lang = lang === 'en' ? 'en-US' : 'zh-CN'; if (v) { u.voice = v; u.lang = v.lang; }
      u.rate = 1; u.pitch = 1; u.volume = 1;
      busy = true; if (o.onStart) o.onStart();
      var fin = function () { if (id !== gen) return; busy = false; quietUntil = now() + REST; done(); };
      u.onend = u.onerror = fin;
      setTimeout(function () { if (id === gen && busy) { busy = false; quietUntil = now() + REST; } }, 20000);   /* a lost onend never locks the voice */
      ss.speak(u);
      return true;
    } catch (e) { busy = false; done(); return false; }
  }
  function hush() { gen++; busy = false; quietUntil = 0; try { root.speechSynthesis.cancel(); } catch (e) {} }
  /* leaving a ride stops its voice at once */
  var was = false; setInterval(function () { var r = riding(); if (was && !r) hush(); was = r; }, 400);
  root.TPVoice = { say: say, hush: hush, busy: function () { return busy; } };
})(window);
