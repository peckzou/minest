/*
 * iPhone 44.4 realtime voice (from the 43.0.5 Realtime handoff: no built-in token, English UI).
 *
 * V6's embedded preview expected a same-origin /client-ws endpoint. The page
 * now prefers an authenticated OpenAI Realtime WebRTC session and keeps the
 * existing Web Speech / Minest iOS recognition -> Minest streaming chat ->
 * system speech synthesis path as a compatibility fallback.
 */
(function () {
  'use strict';

  if (window.MinestRealtimeVoice43) return;

  var state = 'idle';
  var active = false;
  var nativeMode = false;
  var recognition = null;
  var recognitionPaused = false;
  var submitTimer = 0;
  var nativeLatest = '';
  var nativeSubmitted = '';
  var pendingTranscript = '';
  var history = [];
  var transcriptItems = [];
  var requestController = null;
  var speechQueue = [];
  var speechPlaying = false;
  var speechBuffer = '';
  var replySpoken = false;
  var responseComplete = false;
  var assistantText = '';
  var interimText = '';
  var lastSubmitted = '';
  var recognitionStartTimer = 0;
  var panel;
  var launchButton;
  var statusNode;
  var detailNode;
  var transcriptNode;
  var startButton;
  var interruptButton;
  var outputTestButton;
  var nativeEventsBound = false;
  var recognitionRestartTimer = 0;
  var requestGeneration = 0;
  var speechSequence = 0;
  var speechGeneration = 0;
  var speechVoices = [];
  // Keep the turn-taking delay short while leaving enough room for normal
  // pauses in a sentence. Native iOS recognition has its own final event, so
  // it can submit sooner than browser interim results.
  var FINAL_SUBMIT_DELAY = 200;
  var INTERIM_SUBMIT_DELAY = 620;
  var NATIVE_INTERIM_SUBMIT_DELAY = 440;
  var petBridge = {
    state: { kind: 'state', state: 'idle' },
    speech: null,
    frame: null,
    bound: false
  };
  // Realtime WebRTC is the low-latency path. The existing SpeechRecognition →
  // SSE → speechSynthesis path remains available as an automatic fallback.
  var realtime = {
    pc: null,
    dc: null,
    mic: null,
    audio: null,
    audioContext: null,
    analyser: null,
    levelFrame: 0,
    levelData: null,
    outputActive: false,
    outputPendingEnd: false,
    speechSeq: 0,
    inputText: '',
    assistantText: '',
    lastLevel: 0,
    lastLevelPost: 0,
    disconnectTimer: 0,
    mode: false
  };

  var labels = {
    idle: 'Not connected',
    connecting: 'Connecting…',
    listening: 'Listening',
    thinking: 'Thinking',
    speaking: 'Speaking',
    error: 'Needs attention'
  };

  function h(tag, attrs, text) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (key) {
      if (key === 'className') node.className = attrs[key];
      else if (key === 'type') node.type = attrs[key];
      else node.setAttribute(key, attrs[key]);
    });
    if (text) node.textContent = text;
    return node;
  }

  // The raising iframe may load after the voice panel. Keep the latest voice
  // state and replay it when V6 announces readiness, so the first sentence
  // cannot start with a stale mouth or expression.
  function petFrame() {
    var frame = document.querySelector('#minest-pet-raising-overlay iframe');
    if (frame !== petBridge.frame) {
      petBridge.frame = frame || null;
      petBridge.bound = false;
      if (frame && !petBridge.bound) {
        frame.addEventListener('load', replayPetBridge);
        petBridge.bound = true;
      }
    }
    return petBridge.frame;
  }

  function postPet(payload) {
    var frame = petFrame();
    if (!frame || !frame.contentWindow) return;
    try { frame.contentWindow.postMessage(Object.assign({ type: 'minest-voice-state' }, payload), '*'); } catch (error) {}
  }

  function replayPetBridge() {
    if (petBridge.state) postPet(petBridge.state);
    if (petBridge.speech) {
      postPet({ kind: 'speak-start', text: petBridge.speech.text, lang: petBridge.speech.lang, rate: petBridge.speech.rate, seq: petBridge.speech.seq });
      if (petBridge.speech.charIndex > 0) postPet({ kind: 'boundary', charIndex: petBridge.speech.charIndex, charLength: 0, seq: petBridge.speech.seq });
    }
  }

  function toPet(message) {
    var payload = Object.assign({}, message || {});
    if (payload.kind === 'state') petBridge.state = payload;
    else if (payload.kind === 'speak-start') petBridge.speech = {
      text: String(payload.text || ''), lang: payload.lang || 'en-US', rate: Number(payload.rate) || 1, seq: payload.seq || (++speechSequence), charIndex: 0
    };
    else if (payload.kind === 'boundary') {
      if (petBridge.speech && (!payload.seq || payload.seq === petBridge.speech.seq)) petBridge.speech.charIndex = Number(payload.charIndex) || 0;
    } else if (payload.kind === 'speak-end') petBridge.speech = null;
    postPet(payload);
  }

  window.addEventListener('message', function (event) {
    var d = event.data;
    var frame = petFrame();
    if (!d || d.type !== 'minest-voice' || !frame || event.source !== frame.contentWindow) return;
    if (d.action === 'open') openPanel();
    else if (d.action === 'ready') replayPetBridge();
  });

  // 44.4 orb UI: a floating voice orb (no full-screen sheet, so Octo stays visible while it talks).
  // Tap the orb for the options; live captions sit right under it.
  var VOICES = [['marin', 'Marin'], ['cedar', 'Cedar'], ['coral', 'Coral'], ['shimmer', 'Shimmer'], ['sage', 'Sage'], ['ballad', 'Ballad'], ['verse', 'Verse'], ['alloy', 'Alloy'], ['ash', 'Ash'], ['echo', 'Echo']];
  var voiceButton, voiceRow, optsTimer = 0, orbLevelValue = 0, micMeter = null;
  function getVoice() {
    var v = 'marin';
    try { v = localStorage.getItem('minest_realtime_voice') || v; } catch (error) {}
    return VOICES.some(function (x) { return x[0] === v; }) ? v : 'marin';
  }
  function realtimeEnabled() { try { return localStorage.getItem('minest_voice_mode') === 'realtime'; } catch (error) { return false; } }
  function voiceName(id) { var f = VOICES.filter(function (x) { return x[0] === id; })[0]; return f ? f[1] : id; }

  function addStyles() {
    var style = document.createElement('style');
    style.textContent = [
      '#voice43-launch{display:none!important}',
      '#voice43-backdrop{position:fixed;inset:0;z-index:2147483600;display:none;flex-direction:column;align-items:center;justify-content:flex-end;padding:0 16px calc(84px + env(safe-area-inset-bottom));pointer-events:none;font-family:-apple-system,BlinkMacSystemFont,"SF Pro Display",sans-serif;color:#fff}',
      '#voice43-backdrop.is-open{display:flex}',
      '#voice43-backdrop:before{content:"";position:absolute;left:0;right:0;bottom:0;height:46vh;background:linear-gradient(to top,rgba(3,10,22,.62),rgba(3,10,22,0));pointer-events:none}',
      '#voice43-card{position:relative;display:flex;flex-direction:column;align-items:center;gap:10px;width:min(560px,100%);pointer-events:none}',
      '#voice43-card > *{pointer-events:auto}',
      // options (hidden until the orb is tapped)
      '#voice43-actions{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;max-width:100%;opacity:0;transform:translateY(8px) scale(.96);pointer-events:none!important;transition:opacity .22s,transform .22s}',
      '#voice43-backdrop.opts #voice43-actions{opacity:1;transform:none;pointer-events:auto!important}',
      '.voice43-action{height:36px;padding:0 14px;border:1px solid rgba(255,255,255,.22);border-radius:999px;background:rgba(14,22,40,.55);backdrop-filter:blur(18px) saturate(160%);-webkit-backdrop-filter:blur(18px) saturate(160%);color:#fff;font:600 12px/1 -apple-system,system-ui,sans-serif;cursor:pointer;box-shadow:0 6px 18px rgba(0,0,0,.25)}',
      '.voice43-action.primary{background:linear-gradient(135deg,#6f7cff,#b26bff);border-color:rgba(255,255,255,.4)}',
      '.voice43-action:disabled{opacity:.38;cursor:default}',
      '.voice43-action:active{transform:scale(.95)}',
      '#voice43-voices{display:none;flex-wrap:wrap;justify-content:center;gap:6px;max-width:100%}',
      '#voice43-backdrop.opts #voice43-voices.on{display:flex}',
      '.voice43-chip{height:28px;padding:0 11px;border-radius:999px;border:1px solid rgba(255,255,255,.2);background:rgba(14,22,40,.5);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);color:#fff;font:600 11px -apple-system,system-ui,sans-serif;cursor:pointer}',
      '.voice43-chip.on{background:#fff;color:#1b1f3a}',
      // the orb
      '#voice43-orb{--lv:0;position:relative;width:104px;height:104px;border:0;padding:0;border-radius:50%;background:transparent;cursor:pointer;-webkit-tap-highlight-color:transparent;outline:none}',
      '#voice43-orb i{position:absolute;inset:0;border-radius:50%;display:block;pointer-events:none}',
      '#voice43-orb .glow{inset:-26px;background:radial-gradient(circle,var(--c1) 0%,transparent 66%);opacity:calc(.35 + var(--lv) * .6);filter:blur(10px);transform:scale(calc(.92 + var(--lv) * .35));transition:transform .08s linear}',
      '#voice43-orb .b1,#voice43-orb .b2,#voice43-orb .b3{mix-blend-mode:screen;filter:blur(7px)}',
      '#voice43-orb .b1{background:conic-gradient(from 0deg,var(--c1),var(--c2),var(--c3),var(--c1));animation:vo-spin var(--sp1) linear infinite;transform-origin:50% 50%}',
      '#voice43-orb .b2{inset:10%;background:conic-gradient(from 180deg,var(--c3),transparent 40%,var(--c2),transparent 80%,var(--c3));animation:vo-spin var(--sp2) linear infinite reverse;opacity:.9}',
      '#voice43-orb .b3{inset:6%;background:radial-gradient(circle at 35% 30%,rgba(255,255,255,.95),rgba(255,255,255,0) 42%);filter:blur(2px);mix-blend-mode:normal}',
      '#voice43-orb .core{inset:4%;border-radius:50%;box-shadow:inset 0 0 22px rgba(255,255,255,.35),0 10px 34px rgba(0,0,0,.35);transform:scale(calc(1 + var(--lv) * .16));transition:transform .08s linear;border:1px solid rgba(255,255,255,.35)}',
      '#voice43-orb .wrap{inset:0;animation:vo-breathe 3.4s ease-in-out infinite;transform:scale(calc(1 + var(--lv) * .14))}',
      '#voice43-orb:active .wrap{transform:scale(.94)}',
      '@keyframes vo-spin{to{transform:rotate(360deg)}}',
      '@keyframes vo-breathe{0%,100%{scale:1}50%{scale:1.05}}',
      '@keyframes vo-think{0%,100%{scale:.94}50%{scale:1.06}}',
      // state palettes
      '#voice43-backdrop{--c1:#7c8cff;--c2:#58d6ff;--c3:#c88bff;--sp1:9s;--sp2:13s}',
      '#voice43-backdrop[data-state="idle"]{--c1:#8a95b8;--c2:#6fa6c9;--c3:#a596c9;--sp1:16s;--sp2:22s}',
      '#voice43-backdrop[data-state="connecting"]{--c1:#7c8cff;--c2:#7ab8ff;--c3:#b9a2ff;--sp1:3s;--sp2:4s}',
      '#voice43-backdrop[data-state="listening"]{--c1:#2ee6c2;--c2:#3aa8ff;--c3:#7cf0ff;--sp1:7s;--sp2:10s}',
      '#voice43-backdrop[data-state="thinking"]{--c1:#9b6bff;--c2:#ff7ad9;--c3:#6f8cff;--sp1:1.6s;--sp2:2.4s}',
      '#voice43-backdrop[data-state="thinking"] #voice43-orb .wrap{animation:vo-think 1.1s ease-in-out infinite}',
      '#voice43-backdrop[data-state="speaking"]{--c1:#ff8fb8;--c2:#a67bff;--c3:#5ec8ff;--sp1:4s;--sp2:6s}',
      '#voice43-backdrop[data-state="error"]{--c1:#ff7c8a;--c2:#ffb36b;--c3:#c86b8f;--sp1:12s;--sp2:16s}',
      // status + captions
      '#voice43-status-row{display:flex;align-items:center;gap:6px;font:600 11px -apple-system,system-ui,sans-serif;letter-spacing:.02em;opacity:.8;text-shadow:0 1px 6px rgba(0,0,0,.5)}',
      '#voice43-detail{display:none;max-width:100%;text-align:center;font-size:11px;line-height:1.4;opacity:.75;text-shadow:0 1px 6px rgba(0,0,0,.6)}',
      '#voice43-backdrop[data-state="error"] #voice43-detail,#voice43-backdrop[data-state="connecting"] #voice43-detail,#voice43-backdrop[data-state="listening"] #voice43-detail,#voice43-backdrop[data-state="idle"].opts #voice43-detail{display:block}',
      '#voice43-transcript{display:flex;flex-direction:column;align-items:center;gap:4px;max-width:100%;text-align:center;pointer-events:none!important}',
      '#voice43-transcript .user{font-size:12px;line-height:1.35;opacity:.62;text-shadow:0 1px 6px rgba(0,0,0,.65)}',
      '#voice43-transcript .assistant{font:600 14px/1.4 -apple-system,system-ui,sans-serif;text-shadow:0 2px 10px rgba(0,0,0,.7);display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}',
      '#voice43-interim{min-height:0;font-size:13px;font-style:italic;opacity:.6;text-align:center;text-shadow:0 1px 6px rgba(0,0,0,.65);pointer-events:none!important}',
      '#voice43-interim:empty{display:none}',
      '#voice43-backdrop[data-state="thinking"] #voice43-interim,#voice43-backdrop[data-state="speaking"] #voice43-interim{display:none}',
      '#voice43-token{display:none;gap:8px;align-items:center;width:min(340px,100%)}',
      '#voice43-backdrop.need-token #voice43-token{display:flex}',
      '#voice43-token input{flex:1;min-width:0;height:36px;padding:0 14px;border-radius:999px;border:1px solid rgba(255,255,255,.25);background:rgba(14,22,40,.6);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);color:#fff;font:13px -apple-system,system-ui,sans-serif;outline:none}',
      '#voice43-token input::placeholder{color:rgba(255,255,255,.5)}',
      '@media(prefers-reduced-motion:reduce){#voice43-orb .b1,#voice43-orb .b2,#voice43-orb .wrap{animation:none!important}}'
    ].join('');
    document.head.appendChild(style);
  }

  function orbLevel(v) {
    orbLevelValue += (Math.max(0, Math.min(1, v)) - orbLevelValue) * .35;
    if (panel) panel.style.setProperty('--lv', orbLevelValue.toFixed(3));
  }
  // the orb also follows the microphone while you talk (Realtime path)
  function startMicMeter(stream) {
    stopMicMeter();
    var Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor || !stream) return;
    try {
      var ctx = new Ctor(), an = ctx.createAnalyser(), data = new Uint8Array(512);
      an.fftSize = 512; ctx.createMediaStreamSource(stream).connect(an);
      micMeter = { ctx: ctx, an: an, data: data, raf: 0 };
      (function tick() {
        if (!micMeter) return;
        if (!realtime.outputActive) {
          an.getByteTimeDomainData(data);
          var sum = 0; for (var i = 0; i < data.length; i++) { var x = (data[i] - 128) / 128; sum += x * x; }
          orbLevel(Math.min(1, Math.sqrt(sum / data.length) * 5));
        }
        micMeter.raf = requestAnimationFrame(tick);
      })();
    } catch (error) {}
  }
  function stopMicMeter() {
    if (!micMeter) return;
    cancelAnimationFrame(micMeter.raf);
    try { micMeter.ctx.close(); } catch (error) {}
    micMeter = null; orbLevel(0);
  }

  function showOptions(on) {
    if (!panel) return;
    panel.classList.toggle('opts', on);
    clearTimeout(optsTimer);
    if (on && active) optsTimer = setTimeout(function () { panel.classList.remove('opts'); voiceRow.classList.remove('on'); }, 6000);
    if (!on) voiceRow.classList.remove('on');
  }

  function setState(next, detail) {
    var changed = state !== next;
    state = next;
    if (changed || next === 'idle' || next === 'error') toPet({ kind: 'state', state: next });
    if (!panel) return;
    panel.dataset.state = next;
    statusNode.textContent = labels[next] || next;
    detailNode.textContent = detail || '';
    startButton.textContent = active ? 'End' : 'Start';
    startButton.classList.toggle('primary', !active);
    interruptButton.disabled = !active || (state !== 'speaking' && state !== 'thinking');
    launchButton.setAttribute('aria-label', active ? 'Realtime voice is running' : 'Open realtime voice');
    if (!active && next === 'idle' && panel.classList.contains('is-open')) panel.classList.add('opts');
    if (next !== 'speaking' && !micMeter) orbLevel(0);
  }

  function renderTranscript() {
    if (!transcriptNode) return;
    transcriptNode.replaceChildren();
    var lastUser = null, lastAssistant = null;
    for (var i = transcriptItems.length - 1; i >= 0; i--) {
      var it = transcriptItems[i];
      if (!lastAssistant && it.role === 'assistant') lastAssistant = it;
      if (!lastUser && it.role === 'user') lastUser = it;
      if (lastUser && lastAssistant) break;
    }
    // the newest exchange only: what you said (dim), then the reply
    var userFirst = lastUser && (!lastAssistant || transcriptItems.indexOf(lastUser) < transcriptItems.indexOf(lastAssistant));
    if (lastUser && userFirst) transcriptNode.appendChild(h('div', { className: 'user' }, lastUser.text));
    if (lastAssistant && (userFirst || !lastUser)) transcriptNode.appendChild(h('div', { className: 'assistant' }, lastAssistant.text));
    if (lastUser && !userFirst) transcriptNode.appendChild(h('div', { className: 'user' }, lastUser.text));
  }

  function addTranscript(role, text) {
    if (!text || !text.trim()) return null;
    var item = { role: role, text: text.trim() };
    transcriptItems.push(item);
    if (transcriptItems.length > 20) transcriptItems = transcriptItems.slice(-20);
    if (role === 'user' || role === 'assistant') history.push({ role: role, text: item.text, content: item.text });
    if (history.length > 10) history = history.slice(-10);
    renderTranscript();
    return item;
  }

  function updateAssistantTranscript(text) {
    assistantText = text;
    var last = transcriptItems[transcriptItems.length - 1];
    if (last && last.role === 'assistant') last.text = text;
    else transcriptItems.push({ role: 'assistant', text: text });
    renderTranscript();
  }

  // wake the chat function (and the TLS connection) as soon as the orb opens, so the first reply
  // doesn't pay a serverless cold start; repeated while the orb stays open
  var warmTimer = 0;
  function warmUp() {
    try { fetch(getChatEndpoint() + '-stream', { method: 'OPTIONS', mode: 'cors', cache: 'no-store' }).catch(function () {}); } catch (error) {}
    try { if (window.speechSynthesis && !speechVoices.length) speechVoices = window.speechSynthesis.getVoices() || []; } catch (error) {}
  }
  function openPanel() {
    warmUp(); clearInterval(warmTimer); warmTimer = setInterval(warmUp, 120000);
    panel.classList.add('is-open');
    panel.setAttribute('aria-hidden', 'false');
    launchButton.setAttribute('aria-expanded', 'true');
    showOptions(!active);
  }

  function closePanel() {
    clearInterval(warmTimer); warmTimer = 0;
    if (active) stopSession();
    showOptions(false);
    panel.classList.remove('is-open');
    panel.setAttribute('aria-hidden', 'true');
    launchButton.setAttribute('aria-expanded', 'false');
  }

  function setVoice(id) {
    try { localStorage.setItem('minest_realtime_voice', id); } catch (error) {}
    voiceButton.textContent = '🎙 ' + voiceName(id);
    Array.prototype.forEach.call(voiceRow.children, function (c) { c.classList.toggle('on', c.dataset.v === id); });
    // the Realtime voice is fixed per session: reconnect with the new one
    if (active && realtime.mode) { stopSession(); setTimeout(startSession, 250); }
  }

  function buildUI() {
    addStyles();
    launchButton = h('button', { id: 'voice43-launch', type: 'button', 'aria-expanded': 'false', 'aria-label': 'Open realtime voice' }, '🎙 Voice');
    launchButton.addEventListener('click', openPanel);
    document.body.appendChild(launchButton);

    panel = h('div', { id: 'voice43-backdrop', 'data-state': 'idle', 'aria-hidden': 'true' });
    var card = h('section', { id: 'voice43-card', role: 'dialog', 'aria-label': 'Realtime Voice' });

    startButton = h('button', { className: 'voice43-action primary', type: 'button' }, 'Start');
    interruptButton = h('button', { className: 'voice43-action', type: 'button', disabled: 'disabled' }, 'Interrupt');
    voiceButton = h('button', { className: 'voice43-action', type: 'button' }, '🎙 ' + voiceName(getVoice()));
    if (!realtimeEnabled()) voiceButton.style.display = 'none';   // the voice list only applies to Realtime
    outputTestButton = h('button', { className: 'voice43-action', type: 'button' }, 'Test');
    var closeBottom = h('button', { className: 'voice43-action', type: 'button', 'aria-label': 'Close realtime voice' }, '✕');
    startButton.addEventListener('click', function () { if (active) stopSession(); else startSession(); showOptions(false); });
    interruptButton.addEventListener('click', function () { interruptReply(); showOptions(false); });
    outputTestButton.addEventListener('click', testSpeechOutput);
    closeBottom.addEventListener('click', closePanel);
    voiceButton.addEventListener('click', function () { voiceRow.classList.toggle('on'); showOptions(true); });
    var actions = h('div', { id: 'voice43-actions' });
    [startButton, interruptButton, voiceButton, outputTestButton, closeBottom].forEach(function (b) { actions.appendChild(b); });

    voiceRow = h('div', { id: 'voice43-voices' });
    VOICES.forEach(function (v) {
      var c = h('button', { className: 'voice43-chip' + (v[0] === getVoice() ? ' on' : ''), type: 'button', 'data-v': v[0] }, v[1]);
      c.addEventListener('click', function () { setVoice(v[0]); showOptions(true); });
      voiceRow.appendChild(c);
    });

    var orb = h('button', { id: 'voice43-orb', type: 'button', 'aria-label': 'Voice options' });
    orb.innerHTML = '<i class="glow"></i><i class="wrap"><i class="b1"></i><i class="b2"></i><i class="core"></i><i class="b3"></i></i>';
    orb.addEventListener('click', function () {
      if (active && (state === 'speaking' || state === 'thinking')) { interruptReply(); return; }   // tap to cut in
      if (!active && !panel.classList.contains('opts')) { showOptions(true); return; }
      showOptions(!panel.classList.contains('opts'));
    });

    var statusRow = h('div', { id: 'voice43-status-row' });
    statusNode = h('span', {}, labels.idle);
    statusRow.appendChild(statusNode);
    detailNode = h('div', { id: 'voice43-detail' }, '');
    transcriptNode = h('div', { id: 'voice43-transcript', 'aria-live': 'polite' });
    var interimNode = h('div', { id: 'voice43-interim' });

    card.appendChild(voiceRow); card.appendChild(actions); card.appendChild(orb);
    card.appendChild(statusRow); card.appendChild(detailNode);
    // browsers without the app's token: paste it once here (stored only in this browser)
    var tokenBox = h('form', { id: 'voice43-token' });
    var tokenInput = h('input', { type: 'password', placeholder: 'Minest AI token', autocomplete: 'off', spellcheck: 'false', 'aria-label': 'Minest AI token' });
    var tokenSave = h('button', { className: 'voice43-action primary', type: 'submit' }, 'Save');
    tokenBox.appendChild(tokenInput); tokenBox.appendChild(tokenSave);
    tokenBox.addEventListener('submit', function (event) {
      event.preventDefault();
      var v = tokenInput.value.trim();
      if (!v) { tokenInput.focus(); return; }
      try { localStorage.setItem('minest_ai_token', v); } catch (error) {}
      tokenInput.value = '';
      panel.classList.remove('need-token');
      setState('idle', 'Token saved in this browser.');
      startSession();
    });
    ['pointerdown', 'keydown'].forEach(function (ev) { tokenBox.addEventListener(ev, function (e) { e.stopPropagation(); }); });
    card.appendChild(tokenBox);
    card.appendChild(interimNode); card.appendChild(transcriptNode);
    panel.appendChild(card); document.body.appendChild(panel);
    setState('idle', 'Tap Start to talk. Uses the Minest AI token set up on this device.');
  }

  function getChatEndpoint() {
    var base = 'https://minest-app.vercel.app/api/minest/ai-chat';
    // 43.0 is also opened from the static 4177 preview. Keep the deployed relay
    // as the default because 4177 itself does not expose the AI API. A stored
    // endpoint is still supported for a local/dev relay or staging deployment.
    try { base = localStorage.getItem('minest_ai_chat_endpoint') || base; } catch (error) {}
    return base.replace(/\/$/, '');
  }

  function getHeaders() {
    var headers = { 'Content-Type': 'application/json' };
    try {
      // 44.4: the token comes only from this device (the iOS app injects it); none is built in.
      var token = localStorage.getItem('minest_ai_token');
      if (token) headers['X-Minest-Token'] = token;
    } catch (error) {}
    return headers;
  }

  function getRealtimeEndpoint() {
    var base = 'https://minest-app.vercel.app/api/realtime/session';
    try { base = localStorage.getItem('minest_realtime_endpoint') || base; } catch (error) {}
    return base.replace(/\/$/, '') + (base.indexOf('?') >= 0 ? '&' : '?') + 'voice=' + encodeURIComponent(getVoice());
  }

  function realtimePreferred() {
    if (!window.RTCPeerConnection || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return false;
    try {
      var mode = localStorage.getItem('minest_voice_mode');
      // 44.4: streaming voice is the default; the Realtime attempt cost ~1–2 s per start and needs an official OpenAI key
      if (mode !== 'realtime') return false;
      var unavailableUntil = Number(localStorage.getItem('minest_realtime_unavailable_until') || 0);
      if (unavailableUntil > Date.now()) return false;
    } catch (error) {}
    return true;
  }

  function realtimeSend(event) {
    if (!realtime.dc || realtime.dc.readyState !== 'open') return false;
    try { realtime.dc.send(JSON.stringify(event)); return true; } catch (error) { return false; }
  }

  function realtimeSpeakStart() {
    if (realtime.outputActive) return;
    realtime.outputActive = true;
    realtime.outputPendingEnd = false;
    realtime.speechSeq += 1;
    toPet({ kind: 'speak-start', text: realtime.assistantText || '', lang: 'zh-CN', rate: 1, seq: realtime.speechSeq });
    setState('speaking', 'Speaking — interrupt any time.');
  }

  function realtimeFailover(message) {
    if (!active || !realtime.mode) return;
    stopRealtimeSession();
    active = false;
    setState('connecting', message || 'Realtime unavailable — switched to compatible voice mode…');
    startLegacySession();
  }

  function realtimeSpeakEnd() {
    if (!realtime.outputActive) return;
    toPet({ kind: 'speak-end', seq: realtime.speechSeq });
    realtime.outputActive = false;
    realtime.outputPendingEnd = false;
    realtime.quietSince = 0;
    if (active) setState('listening', 'Go ahead and keep talking.');
  }

  function realtimeLevelTick() {
    if (!realtime.analyser || !realtime.levelData) return;
    var now = performance.now();
    realtime.analyser.getByteTimeDomainData(realtime.levelData);
    var sum = 0;
    for (var i = 0; i < realtime.levelData.length; i++) {
      var sample = (realtime.levelData[i] - 128) / 128;
      sum += sample * sample;
    }
    var level = Math.min(1, Math.sqrt(sum / realtime.levelData.length) * 3.8);
    realtime.lastLevel += (level - realtime.lastLevel) * .32;
    if (realtime.outputActive) orbLevel(realtime.lastLevel * 1.6);
    if (realtime.lastLevel > .028) {
      realtime.quietSince = 0;
      realtimeSpeakStart();
    } else if (realtime.outputPendingEnd) {
      if (!realtime.quietSince) realtime.quietSince = now;
      if (now - realtime.quietSince > 220) realtimeSpeakEnd();
    }
    if (realtime.outputActive && (now - realtime.lastLevelPost > 55 || Math.abs(realtime.lastLevel - realtime.lastPostedLevel) > .015)) {
      realtime.lastLevelPost = now;
      realtime.lastPostedLevel = realtime.lastLevel;
      toPet({ kind: 'audio-level', level: realtime.lastLevel, seq: realtime.speechSeq });
    }
    realtime.levelFrame = requestAnimationFrame(realtimeLevelTick);
  }

  function realtimeAttachAudio(stream) {
    if (!stream) return;
    if (!realtime.audio) {
      realtime.audio = document.createElement('audio');
      realtime.audio.autoplay = true;
      realtime.audio.playsInline = true;
      realtime.audio.setAttribute('aria-hidden', 'true');
      realtime.audio.style.cssText = 'position:fixed;width:1px;height:1px;opacity:.01;pointer-events:none;';
      document.body.appendChild(realtime.audio);
    }
    realtime.audio.srcObject = stream;
    var AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    if (AudioContextCtor) {
      try {
        realtime.audioContext = realtime.audioContext || new AudioContextCtor();
        if (realtime.audioContext.state === 'suspended') realtime.audioContext.resume();
        var source = realtime.audioContext.createMediaStreamSource(stream);
        realtime.analyser = realtime.audioContext.createAnalyser();
        realtime.analyser.fftSize = 512;
        realtime.analyser.smoothingTimeConstant = .7;
        realtime.levelData = new Uint8Array(realtime.analyser.fftSize);
        source.connect(realtime.analyser);
        if (!realtime.levelFrame) realtime.levelFrame = requestAnimationFrame(realtimeLevelTick);
      } catch (error) {}
    }
    try { var playing = realtime.audio.play(); if (playing && playing.catch) playing.catch(function () {}); } catch (error) {}
  }

  function realtimeHandleEvent(event) {
    if (!event || !event.type) return;
    if (event.type === 'error') {
      var message = event.error && (event.error.message || event.error.code) || 'The Realtime service returned an error.';
      realtimeFailover('Realtime unavailable — switched to compatible voice mode: ' + message);
      return;
    }
    if (event.type === 'input_audio_buffer.speech_started') {
      if (realtime.outputActive) realtimeSpeakEnd();
      setState('listening', 'Listening…');
      return;
    }
    if (event.type === 'input_audio_buffer.speech_stopped') {
      setState('thinking', 'Understanding and preparing a reply…');
      return;
    }
    if (event.type === 'conversation.item.input_audio_transcription.delta') {
      realtime.inputText += String(event.delta || '');
      var interim = document.getElementById('voice43-interim');
      if (interim) interim.textContent = realtime.inputText ? realtime.inputText : '';
      return;
    }
    if (event.type === 'conversation.item.input_audio_transcription.completed') {
      var userText = String(event.transcript || realtime.inputText || '').trim();
      realtime.inputText = '';
      var inputInterim = document.getElementById('voice43-interim');
      if (inputInterim) inputInterim.textContent = '';
      if (userText) addTranscript('user', userText);
      return;
    }
    if (event.type === 'response.created') {
      realtime.assistantText = '';
      realtime.responseRecorded = false;
      setState('thinking', 'Realtime is replying…');
      return;
    }
    if (event.type === 'response.output_audio_buffer.started' || event.type === 'response.audio.delta') {
      realtimeSpeakStart();
      return;
    }
    if (event.type === 'response.audio_transcript.delta' || event.type === 'response.output_audio_transcript.delta' || event.type === 'response.output_text.delta') {
      var delta = String(event.delta || '');
      if (delta) {
        realtime.assistantText += delta;
        updateAssistantTranscript(realtime.assistantText);
        if (!realtime.outputActive) realtimeSpeakStart();
      }
      return;
    }
    if (event.type === 'response.audio_transcript.done' || event.type === 'response.output_audio_transcript.done' || event.type === 'response.output_text.done') {
      var transcript = String(event.transcript || realtime.assistantText || '').trim();
      if (transcript) { realtime.assistantText = transcript; updateAssistantTranscript(transcript); }
      return;
    }
    if (event.type === 'response.output_audio_buffer.stopped' || event.type === 'response.output_audio.done' || event.type === 'response.done') {
      if (realtime.assistantText && !realtime.responseRecorded) {
        history.push({ role: 'assistant', text: realtime.assistantText, content: realtime.assistantText });
        if (history.length > 10) history = history.slice(-10);
        realtime.responseRecorded = true;
      }
      realtime.outputPendingEnd = true;
      if (!realtime.analyser) realtimeSpeakEnd();
      return;
    }
  }

  function stopRealtimeSession() {
    realtime.mode = false;
    stopMicMeter();
    clearTimeout(realtime.disconnectTimer);
    realtime.disconnectTimer = 0;
    if (realtime.levelFrame) cancelAnimationFrame(realtime.levelFrame);
    realtime.levelFrame = 0;
    if (realtime.outputActive) toPet({ kind: 'speak-end', seq: realtime.speechSeq });
    realtime.outputActive = false;
    if (realtime.mic) realtime.mic.getTracks().forEach(function (track) { try { track.stop(); } catch (error) {} });
    realtime.mic = null;
    if (realtime.dc) { try { realtime.dc.close(); } catch (error) {} }
    if (realtime.pc) { try { realtime.pc.close(); } catch (error) {} }
    realtime.dc = null; realtime.pc = null;
    if (realtime.audio) { try { realtime.audio.pause(); realtime.audio.srcObject = null; realtime.audio.remove(); } catch (error) {} }
    realtime.audio = null; realtime.analyser = null; realtime.levelData = null;
    if (realtime.audioContext) { try { realtime.audioContext.close(); } catch (error) {} }
    realtime.audioContext = null;
  }

  async function startRealtimeSession() {
    active = true;
    nativeMode = false;
    history = []; transcriptItems = []; renderTranscript();
    realtime.mode = true; realtime.inputText = ''; realtime.assistantText = ''; realtime.responseRecorded = false;
    setState('connecting', 'Connecting OpenAI Realtime audio…');
    var stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
    realtime.mic = stream;
    startMicMeter(stream);
    var pc = new RTCPeerConnection();
    realtime.pc = pc;
    pc.ontrack = function (event) { realtimeAttachAudio(event.streams && event.streams[0]); };
    pc.onconnectionstatechange = function () {
      if (!realtime.mode) return;
      if (pc.connectionState === 'failed') realtimeFailover('Realtime audio dropped — switched to compatible voice mode…');
      else if (pc.connectionState === 'disconnected') {
        clearTimeout(realtime.disconnectTimer);
        realtime.disconnectTimer = setTimeout(function () {
          if (realtime.mode && pc.connectionState === 'disconnected') realtimeFailover('Realtime audio dropped — switched to compatible voice mode…');
        }, 1800);
      } else {
        clearTimeout(realtime.disconnectTimer);
        realtime.disconnectTimer = 0;
      }
    };
    stream.getTracks().forEach(function (track) { pc.addTrack(track, stream); });
    var dc = pc.createDataChannel('oai-events');
    realtime.dc = dc;
    dc.addEventListener('open', function () {
      realtimeSend({ type: 'session.update', session: { instructions: 'You are Minest AI Pet, a warm and concise voice companion. Reply naturally in the user language, keep answers short unless detail is requested, and yield immediately when the user interrupts.' } });
      setState('listening', 'Realtime connected — just start talking.');
    });
    dc.addEventListener('message', function (event) {
      try { realtimeHandleEvent(JSON.parse(event.data)); } catch (error) {}
    });
    var offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    if (pc.iceGatheringState !== 'complete') {
      await new Promise(function (resolve) {
        var done = false;
        var timer = setTimeout(finish, 1500);
        function finish() {
          if (done) return;
          done = true; clearTimeout(timer);
          pc.removeEventListener('icegatheringstatechange', onIce);
          resolve();
        }
        function onIce() { if (pc.iceGatheringState === 'complete') finish(); }
        pc.addEventListener('icegatheringstatechange', onIce);
      });
    }
    var headers = getHeaders(); headers['Content-Type'] = 'application/sdp';
    var response = await fetch(getRealtimeEndpoint(), { method: 'POST', headers: headers, body: offer.sdp });
    if (!response.ok) {
      var problem = await response.json().catch(function () { return {}; });
      throw new Error(problem.error || ('Realtime session failed (HTTP ' + response.status + ')'));
    }
    await pc.setRemoteDescription({ type: 'answer', sdp: await response.text() });
  }

  function getModel() {
    var model = 'gpt-6-sol';
    try { model = localStorage.getItem('minest_ai_model') || model; } catch (error) {}
    if (model === 'openrouter') {
      try { return localStorage.getItem('minest_ai_openrouter_model') || 'openai/gpt-4o-mini'; } catch (error) { return 'openai/gpt-4o-mini'; }
    }
    // 44.4: the board builder stores provider labels ('chatgpt', 'gemini') here; they are not model ids and
    // made the voice request fail ("Load failed") — voice uses the default fast model for those
    if (!/[-\/.]/.test(model)) return 'gpt-6-sol';
    return model;
  }

  function normalizeTranscript(text) {
    return String(text || '').replace(/\s+/g, ' ').trim().toLocaleLowerCase();
  }

  function parseEvent(raw, onText) {
    var line = raw.split(/\r?\n/).filter(function (part) { return /^data:\s*/.test(part); }).map(function (part) { return part.replace(/^data:\s*/, ''); }).join('\n').trim();
    if (!line || line === '[DONE]') return;
    try {
      var event = JSON.parse(line);
      if (event.error) throw new Error(event.error);
      if (typeof event.t === 'string') onText(event.t);
      else if (typeof event.delta === 'string') onText(event.delta);
      else if (event.choices && event.choices[0] && event.choices[0].delta && event.choices[0].delta.content) onText(event.choices[0].delta.content);
    } catch (error) {
      if (error instanceof SyntaxError) throw new Error('Minest streaming reply was malformed.');
      throw error;
    }
  }

  function speakSegments(delta, flush) {
    speechBuffer += String(delta || '');
    // 44.4 low latency: start talking at the first comma of a reply instead of waiting for a full sentence
    if (!speechPlaying && !speechQueue.length && !replySpoken) {
      var cjk = /[\u4e00-\u9fff]/.test(speechBuffer);
      var cm = speechBuffer.match(cjk ? /^[\s\S]{4,}?[，,、：:]/ : /^[\s\S]{15,}?[，,:]/);   // first comma after a few words
      if (cm) { speechQueue.push(cm[0].trim()); speechBuffer = speechBuffer.slice(cm[0].length); replySpoken = true; }
    }
    var breaks = /[。！？；\n.!?;]+/g;
    var match;
    while ((match = breaks.exec(speechBuffer)) !== null) {
      var end = match.index + match[0].length;
      var piece = speechBuffer.slice(0, end).trim();
      speechBuffer = speechBuffer.slice(end);
      breaks.lastIndex = 0;
      if (piece) { speechQueue.push(piece); replySpoken = true; }
    }
    // Start speech before a long response reaches its final punctuation. Keep
    // English words intact when possible; CJK can safely split at a character.
    var max = /[\u4e00-\u9fff]/.test(speechBuffer) ? (replySpoken ? 24 : 14) : (replySpoken ? 72 : 40);
    while (speechBuffer.length > max) {
      var cut = speechBuffer.lastIndexOf(' ', max);
      if (cut < 20) cut = max;
      var early = speechBuffer.slice(0, cut).trim();
      speechBuffer = speechBuffer.slice(cut).replace(/^\s+/, '');
      if (early) { speechQueue.push(early); replySpoken = true; }
    }
    if (flush && speechBuffer.trim()) {
      speechQueue.push(speechBuffer.trim());
      speechBuffer = '';
    }
    processSpeechQueue();
  }

  // 44.4: inside the iOS app speak with AVSpeechSynthesizer (the web view's speechSynthesis was silent there)
  var ttsSeq = 0, ttsHandlers = {};
  function useNativeTTS() { return inNativeApp() && window.MinestNative && typeof window.MinestNative.send === 'function'; }
  function nativeSpeak(text, lang, rate, h) {
    var id = 'tts' + (++ttsSeq);
    ttsHandlers[id] = h;
    // if the app never answers (older build without speakText), finish so the conversation goes on
    if (!h.queued) h.guard = setTimeout(function () { if (ttsHandlers[id] && !h.started) { delete ttsHandlers[id]; if (h.onerror) h.onerror({ error: 'native-tts-timeout' }); } }, 3500);
    window.MinestNative.send('speakText', { text: text, lang: lang, rate: rate, id: id });
  }
  window.addEventListener('minestNativeEvent', function (e) {
    var d = e && e.detail || {}, p = d.payload || {}, h = ttsHandlers[p.id];
    if (!h) return;
    if (d.event === 'minestTTSStart') { h.started = true; clearTimeout(h.guard); if (h.onstart) h.onstart(); }
    else if (d.event === 'minestTTSBoundary') { if (h.onboundary) h.onboundary({ charIndex: p.charIndex || 0, charLength: p.charLength || 0 }); }
    else if (d.event === 'minestTTSEnd') { clearTimeout(h.guard); delete ttsHandlers[p.id]; if (h.onend) h.onend(); }
  });

  // In the app, hand every ready sentence to AVSpeechSynthesizer at once: it queues them and reads them
  // back to back (one at a time left ~0.5 s gaps and audio restarts between sentences).
  var nativeOutstanding = 0;
  function processNativeQueue() {
    while (speechQueue.length) {
      (function (text) {
        var gen = speechGeneration, seq = ++speechSequence, lang = /[\u4e00-\u9fff]/.test(text) ? 'zh-CN' : 'en-US';
        nativeOutstanding++; speechPlaying = true;
        pauseRecognition();
        setState('speaking', 'Speaking — tap the orb to interrupt.');
        var done = function () {
          if (gen !== speechGeneration) return;
          toPet({ kind: 'speak-end', seq: seq });
          nativeOutstanding = Math.max(0, nativeOutstanding - 1);
          if (!nativeOutstanding) { speechPlaying = false; processSpeechQueue(); }
        };
        nativeSpeak(text, lang, 1.08, {
          onstart: function () { if (gen === speechGeneration) toPet({ kind: 'speak-start', text: text, lang: lang, rate: 1.08, seq: seq }); },
          onboundary: function (e) { if (gen === speechGeneration) toPet({ kind: 'boundary', charIndex: e.charIndex || 0, charLength: e.charLength || 0, seq: seq }); },
          onend: done, onerror: done, queued: nativeOutstanding > 1   // queued behind another sentence: no start timeout
        });
      })(speechQueue.shift());
    }
  }

  function processSpeechQueue() {
    if (useNativeTTS()) {
      if (speechQueue.length) processNativeQueue();
      if (!nativeOutstanding) { speechPlaying = false; finishPlaybackIfReady(); }
      return;
    }
    if (speechPlaying || !speechQueue.length) { finishPlaybackIfReady(); return; }
    if (!window.speechSynthesis || typeof window.SpeechSynthesisUtterance !== 'function') {
      speechQueue.length = 0;
      responseComplete = true;
      setState('listening', 'Reply ready; this browser has no speech API.');
      resumeRecognition();
      return;
    }
    var text = speechQueue.shift();
    var utterance = new SpeechSynthesisUtterance(text);
    var utteranceGeneration = speechGeneration;
    var speechSeq = ++speechSequence;
    utterance.lang = /[\u4e00-\u9fff]/.test(text) ? 'zh-CN' : 'en-US';
    utterance.rate = 1.08;
    utterance.pitch = 1.04;
    try {
      var voices = speechVoices.length ? speechVoices : window.speechSynthesis.getVoices();
      var same = voices.filter(function (item) { return item.lang && item.lang.toLowerCase().indexOf(utterance.lang.toLowerCase().slice(0, 2)) === 0; });
      // prefer the higher-quality voices (Premium / Enhanced / Siri / Google) when installed
      var voice = same.filter(function (v) { return /premium|enhanced|siri|google|natural/i.test(v.name); })[0] || same.filter(function (v) { return v.localService; })[0] || same[0];
      if (voice) utterance.voice = voice;
    } catch (error) {}
    speechPlaying = true;
    pauseRecognition();
    setState('speaking', 'Speaking the reply sentence by sentence; tap “Interrupt” to stop.');
    utterance.onstart = function () {
      if (utteranceGeneration !== speechGeneration) return;
      toPet({ kind: 'speak-start', text: text, lang: utterance.lang, rate: utterance.rate, seq: speechSeq });
    };
    utterance.onboundary = function (event) {
      if (utteranceGeneration !== speechGeneration) return;
      toPet({ kind: 'boundary', charIndex: event.charIndex || 0, charLength: event.charLength || 0, seq: speechSeq });
    };
    utterance.onend = function () {
      if (utteranceGeneration !== speechGeneration) return;
      toPet({ kind: 'speak-end', seq: speechSeq });
      speechPlaying = false; processSpeechQueue();
    };
    utterance.onerror = function (event) {
      if (utteranceGeneration !== speechGeneration) return;
      toPet({ kind: 'speak-end', seq: speechSeq });
      speechPlaying = false;
      if (event && event.error && event.error !== 'canceled' && event.error !== 'interrupted') {
        setState('error', 'Speech failed: ' + event.error);
      }
      processSpeechQueue();
    };
    if (useNativeTTS()) {
      nativeSpeak(text, utterance.lang, utterance.rate, { onstart: utterance.onstart, onboundary: utterance.onboundary, onend: utterance.onend, onerror: utterance.onerror });
      return;
    }
    try { window.speechSynthesis.speak(utterance); }
    catch (error) { toPet({ kind: 'speak-end', seq: speechSeq }); speechPlaying = false; processSpeechQueue(); }
  }

  function finishPlaybackIfReady() {
    if (!responseComplete || speechPlaying || speechQueue.length) return;
    responseComplete = false;
    resumeRecognition();
    if (active) setState('listening', 'Reply finished; the microphone is back on.');
  }

  function cancelPlayback() {
    speechGeneration += 1;
    if (window.speechSynthesis) { try { window.speechSynthesis.cancel(); } catch (error) {} }
    if (useNativeTTS()) { nativeOutstanding = 0; try { window.MinestNative.send('stopSpeaking', {}); } catch (error) {} }
    speechQueue.length = 0; speechBuffer = ''; speechPlaying = false; responseComplete = false;
    toPet({ kind: 'speak-end' });
  }

  async function requestReply(prompt) {
    if (!active || !prompt) return;
    if (prompt === lastSubmitted) return;
    lastSubmitted = prompt;
    pauseRecognition();
    cancelPlayback();
    replySpoken = false;
    addTranscript('user', prompt);
    assistantText = '';
    setState('thinking', 'Connecting to Minest streaming chat…');
    if (requestController) { try { requestController.abort(); } catch (error) {} }
    var requestId = ++requestGeneration;
    requestController = new AbortController();
    var endpoint = getChatEndpoint();
    var selectedModel = getModel();
    var body = {
      prompt: prompt,
      model: selectedModel,
      modelName: selectedModel,
      history: history.slice(0, -1).slice(-8),
      mode: 'voice'
    };
    var received = '';
    var streamed = false;
    try {
      var response = await fetch(endpoint + '-stream', {
        method: 'POST', headers: getHeaders(), body: JSON.stringify(body), signal: requestController.signal
      });
      if (!response.ok) {
        var problem = await response.json().catch(function () { return {}; });
        throw new Error(problem.error || ('Voice AI request failed (HTTP ' + response.status + ')'));
      }
      if (/event-stream/i.test(response.headers.get('content-type') || '') && response.body) {
        streamed = true;
        var reader = response.body.getReader();
        var decoder = new TextDecoder();
        var buffer = '';
          while (true) {
            var part = await reader.read();
            if (part.done) break;
            buffer += decoder.decode(part.value, { stream: true });
            var boundary;
            while ((boundary = buffer.search(/\r?\n\r?\n/)) >= 0) {
              if (requestId !== requestGeneration) return;
              var separator = buffer.slice(boundary).match(/^\r?\n\r?\n/);
              var separatorLength = separator ? separator[0].length : 2;
              var raw = buffer.slice(0, boundary); buffer = buffer.slice(boundary + separatorLength);
              var before = received;
            parseEvent(raw, function (value) {
              if (value.length >= received.length && value.slice(0, received.length) === received) {
                var delta = value.slice(received.length); received = value;
                if (delta) { assistantText = received; updateAssistantTranscript(received); speakSegments(delta, false); }
              } else {
                received += value; assistantText = received; updateAssistantTranscript(received); speakSegments(value, false);
              }
            });
            if (received !== before) setState(speechPlaying ? 'speaking' : 'thinking', 'Receiving the reply…');
            }
          }
        buffer += decoder.decode();
        if (requestId !== requestGeneration) return;
        if (buffer.trim()) parseEvent(buffer, function (value) {
          if (value.length >= received.length && value.slice(0, received.length) === received) {
            var delta = value.slice(received.length); received = value;
            if (delta) { assistantText = received; updateAssistantTranscript(received); speakSegments(delta, false); }
          } else { received += value; assistantText = received; updateAssistantTranscript(received); speakSegments(value, false); }
        });
      } else {
        var data = await response.json().catch(function () { return {}; });
        if (data.error) throw new Error(data.error);
        received = data.reply || data.message || data.text || '';
      }
      if (!streamed && !received) throw new Error('The voice AI returned an empty reply.');
      if (!streamed) { assistantText = received; updateAssistantTranscript(received); }
      if (assistantText) {
        history.push({ role: 'assistant', text: assistantText, content: assistantText });
        if (history.length > 10) history = history.slice(-10);
        speakSegments(streamed ? '' : received, true);
      }
      responseComplete = true;
      processSpeechQueue();
      if (!speechQueue.length && !speechPlaying) finishPlaybackIfReady();
    } catch (error) {
      if (requestId !== requestGeneration) return;
      if (error && error.name === 'AbortError') return;
      cancelPlayback();
      setState('error', error && error.message ? error.message : 'Realtime voice request failed.');
      resumeRecognition();
    } finally {
      if (requestId === requestGeneration) requestController = null;
    }
  }

  function submitPending(text) {
    clearTimeout(submitTimer); submitTimer = 0;
    var value = String(text || '').replace(/\s+/g, ' ').trim();
    pendingTranscript = ''; interimText = '';
    var interim = document.getElementById('voice43-interim');
    if (interim) interim.textContent = '';
    if (!active || !value) return;
    var key = normalizeTranscript(value);
    if (key === normalizeTranscript(lastSubmitted)) return;
    if (nativeMode) nativeSubmitted = key;
    requestReply(value);
  }

  // 44.4: how long a pause means "done talking". A fixed 0.2–0.6 s cut people off mid-sentence; now it
  // depends on how the words so far end.
  function endOfTurnDelay(text, isFinal) {
    var t = String(text || '').trim();
    var bare = t.replace(/[\s，,。.！!？?、；;：:…]+$/, '');
    var len = bare.replace(/\s+/g, '').length;
    if (/[？?！!。.]$/.test(t)) return isFinal ? 450 : 700;                             // ended with a full stop / question mark
    if (len <= 2) return 1600;                                                        // "嗯", "我想" …
    if (/(然后|因为|所以|但是|还有|而且|如果|就是|那个|这个|我想|我要|还是|或者|和|跟|的|地|得|在|把|被|给|对|是)$/.test(bare) ||
        /\b(and|but|so|because|or|the|a|an|to|of|with|my|i|um|uh|like|then)$/i.test(bare)) return 1600;   // clearly not finished
    if (/(吗|呢|吧|啊|呀|了|嘛|么)$/.test(bare)) return isFinal ? 450 : 700;             // sentence-final particles
    return isFinal ? 800 : 1100;
  }

  function scheduleSubmit(text, delay) {
    clearTimeout(submitTimer);
    submitTimer = window.setTimeout(function () { submitPending(text); }, delay);
  }

  function attachWebRecognition() {
    var Speech = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Speech) return false;
    nativeMode = false;
    recognition = new Speech();
    recognition.lang = 'zh-CN';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onstart = function () {
      clearTimeout(recognitionStartTimer); recognitionStartTimer = 0;
      if (active && !recognitionPaused) setState('listening', 'Browser dictation started — go ahead and speak.');
    };
    recognition.onresult = function (event) {
      if (recognitionPaused || state === 'thinking' || state === 'speaking') return;
      var finalPart = '';
      var interimPart = '';
      for (var i = event.resultIndex; i < event.results.length; i++) {
        var result = event.results[i];
        var text = result && result[0] ? result[0].transcript : '';
        if (result.isFinal) finalPart += text;
        else interimPart += text;
      }
      if (interimPart) {
        interimText = interimPart.trim();
        var interim = document.getElementById('voice43-interim');
        if (interim) interim.textContent = interimText;
      }
      if (finalPart.trim()) {
        pendingTranscript = (pendingTranscript + ' ' + finalPart).trim();
        scheduleSubmit(pendingTranscript, endOfTurnDelay(pendingTranscript, true));
      } else if (interimPart.trim()) {
        scheduleSubmit((pendingTranscript + ' ' + interimPart).trim(), endOfTurnDelay((pendingTranscript + ' ' + interimPart).trim(), false));
      }
    };
    recognition.onerror = function (event) {
      var error = event && event.error;
      if (error === 'no-speech' || error === 'aborted') return;
      if (error === 'not-allowed' || error === 'service-not-allowed') {
        stopRecognition(); active = false;
        setState('error', 'Microphone or dictation permission was denied. Allow Minest to use speech recognition in the browser / system settings.');
      } else setState('error', 'Dictation service error: ' + (error || 'unknown'));
    };
    recognition.onend = function () {
      if (active && !recognitionPaused && !nativeMode) {
        clearTimeout(recognitionRestartTimer);
        recognitionRestartTimer = window.setTimeout(function () {
          recognitionRestartTimer = 0;
          if (!active || recognitionPaused || !recognition) return;
          try { recognition.start(); } catch (error) {}
        }, 180);
      }
    };
    return true;
  }

  function startRecognition() {
    if (!active) return;
    clearTimeout(recognitionRestartTimer); recognitionRestartTimer = 0;
    recognitionPaused = false;
    if (nativeMode) {
      try {
        if (window.MinestNative && window.MinestNative.startSpeechRecognition) window.MinestNative.startSpeechRecognition();
        setState('listening', 'iOS dictation resumed.');
      } catch (error) { setState('error', 'iOS dictation couldn’t resume.'); }
    } else if (recognition) {
      try { recognition.start(); } catch (error) {
        if (!/already started/i.test(error && error.message || '')) setState('error', 'Browser dictation couldn’t start: ' + (error.message || 'please try again'));
      }
    }
  }

  function pauseRecognition() {
    if (!active || recognitionPaused) return;
    clearTimeout(recognitionRestartTimer); recognitionRestartTimer = 0;
    recognitionPaused = true;
    if (nativeMode) {
      try { if (window.MinestNative && window.MinestNative.stopSpeechRecognition) window.MinestNative.stopSpeechRecognition(); } catch (error) {}
    } else if (recognition) {
      try { recognition.stop(); } catch (error) {}
    }
  }

  function resumeRecognition() {
    if (!active) return;
    clearTimeout(recognitionRestartTimer);
    recognitionRestartTimer = window.setTimeout(function () { recognitionRestartTimer = 0; startRecognition(); }, nativeMode ? 300 : 60);   // let the speaker fall silent first
  }

  function onNativeSpeech(event) {
    if (!active || !nativeMode) return;
    // 44.4: iOS still sends a late result or two after we stopped listening (often with different
    // punctuation); showing them laid the question over the reply, and could re-submit it
    if (recognitionPaused || state === 'thinking' || state === 'speaking') return;
    var detail = event && event.detail || {};
    var text = String(detail.text || '').trim();
    var key = normalizeTranscript(text);
    if (!text || key === nativeSubmitted) return;
    nativeLatest = text;
    var interim = document.getElementById('voice43-interim');
    if (interim) interim.textContent = text;
    scheduleSubmit(text, endOfTurnDelay(text, !!detail.isFinal));
  }

  function onNativeSpeechError(event) {
    if (!active || !nativeMode) return;
    var error = event && event.detail && event.detail.error;
    stopRecognition();
    active = false;
    setState('error', error === 'speech_not_authorized' ? 'Speech recognition is off; allow Minest in Settings → Privacy & Security → Speech Recognition.' : 'iOS dictation failed to start: ' + (error || 'unknown error'));
  }

  function onNativePermission(event) {
    if (active && event && event.detail && event.detail.granted === false) {
      stopRecognition();
      active = false;
      setState('error', 'Microphone permission denied; turn it on in Settings → Minest → Microphone.');
    }
  }

  function bindNativeEvents() {
    if (nativeEventsBound) return;
    nativeEventsBound = true;
    window.addEventListener('minestSpeechResult', onNativeSpeech);
    window.addEventListener('minestSpeechError', onNativeSpeechError);
    window.addEventListener('microphonePermissionResponse', onNativePermission);
    // 44.4: the app delivers native events as one 'minestNativeEvent' { event, payload } (the page's own
    // MinestNative replaces the injected one, so the per-name events above never arrive)
    window.addEventListener('minestNativeEvent', function (e) {
      var d = e && e.detail || {}, wrap = { detail: d.payload || {} };
      if (d.event === 'minestSpeechResult') onNativeSpeech(wrap);
      else if (d.event === 'minestSpeechError') onNativeSpeechError(wrap);
      else if (d.event === 'microphonePermissionResponse') onNativePermission(wrap);
    });
  }

  async function startLegacySession() {
    if (active) return;
    active = true; history = []; transcriptItems = []; renderTranscript();
    nativeSubmitted = ''; nativeLatest = ''; pendingTranscript = ''; lastSubmitted = '';
    clearTimeout(recognitionStartTimer); recognitionStartTimer = 0;
    clearTimeout(recognitionRestartTimer); recognitionRestartTimer = 0;
    setState('connecting', 'Requesting dictation permission…');
    if (window.speechSynthesis) { try { window.speechSynthesis.resume(); } catch (error) {} }

    if (inNativeApp() && window.MinestNative && window.MinestNative.startSpeechRecognition && window.MinestNative.requestMicrophonePermission) {
      nativeMode = true;
      bindNativeEvents();
      try {
        window.MinestNative.requestMicrophonePermission();
        window.MinestNative.startSpeechRecognition();
        setState('listening', 'iOS microphone and dictation started.');
      } catch (error) {
        active = false; setState('error', 'Couldn’t start iOS dictation: ' + (error.message || 'please try again'));
      }
      return;
    }

    if (!attachWebRecognition()) {
      active = false;
      setState('error', 'This browser has no Web Speech dictation; use the Minest iOS app or Safari/Chrome with speech recognition.');
      return;
    }
    try {
      recognitionPaused = false;
      recognition.start();
      setState('connecting', 'Waiting for microphone permission…');
      recognitionStartTimer = window.setTimeout(function () {
        if (active && recognition && !recognitionPaused && state === 'connecting') {
          active = false;
          stopRecognition();
          setState('error', 'No microphone permission answer; allow this page to use the microphone and try again.');
        }
      }, 12000);
    } catch (error) {
      active = false;
      setState('error', 'Dictation failed to start: ' + (error.message || 'please try again'));
    }
  }

  // only the iOS app (WKWebView) has native dictation; the web page defines its own MinestNative stand-in
  function inNativeApp() {
    var w = window.webkit && window.webkit.messageHandlers;
    return !!(w && (w.minestBridge || w.focusboardBridge));
  }
  function hasToken() { try { return !!localStorage.getItem('minest_ai_token'); } catch (error) { return false; } }
  var NO_TOKEN = 'This browser has no Minest AI token yet, so voice can’t reach the AI. Open Minest in the iOS app, or add the token to this browser once.';

  async function startSession() {
    if (active) return;
    if (!hasToken()) { setState('error', NO_TOKEN); panel.classList.add('need-token'); showOptions(true); return; }
    if (realtimePreferred()) {
      try {
        await startRealtimeSession();
        return;
      } catch (error) {
        stopRealtimeSession();
        if (!active) return;
        active = false;
        if (/401|not authori[sz]ed|未授权/i.test(error && error.message || '')) { if (!inNativeApp()) { try { localStorage.removeItem('minest_ai_token'); } catch (e) {} } setState('error', NO_TOKEN); panel.classList.add('need-token'); showOptions(true); return; }
        if (/Permission|NotAllowed|denied/i.test(error && (error.name + ' ' + error.message) || '')) { setState('error', 'Microphone permission was denied. Allow the microphone for this site and try again.'); showOptions(true); return; }
        try {
          if (/HTTP 404|NOT_FOUND|not found/i.test(error && error.message || '')) localStorage.setItem('minest_realtime_unavailable_until', String(Date.now() + 15 * 60 * 1000));
        } catch (storageError) {}
        setState('connecting', 'Realtime unavailable — switched to compatible voice mode…');
      }
    }
    await startLegacySession();
  }

  function stopRecognition() {
    clearTimeout(submitTimer); submitTimer = 0;
    clearTimeout(recognitionStartTimer); recognitionStartTimer = 0;
    clearTimeout(recognitionRestartTimer); recognitionRestartTimer = 0;
    recognitionPaused = true;
    if (nativeMode) {
      try { if (window.MinestNative && window.MinestNative.stopSpeechRecognition) window.MinestNative.stopSpeechRecognition(); } catch (error) {}
    }
    if (recognition) {
      recognition.onend = null;
      try { recognition.abort(); } catch (error) {}
      recognition = null;
    }
  }

  function stopSession() {
    active = false;
    if (realtime.mode || realtime.pc) stopRealtimeSession();
    stopRecognition();
    requestGeneration += 1;
    if (requestController) { try { requestController.abort(); } catch (error) {} requestController = null; }
    cancelPlayback();
    interimText = ''; pendingTranscript = '';
    if (document.getElementById('voice43-interim')) document.getElementById('voice43-interim').textContent = '';
    setState('idle', 'Voice ended; the microphone is released.');
  }

  function interruptReply() {
    if (realtime.mode && realtime.dc && realtime.dc.readyState === 'open') {
      realtimeSend({ type: 'response.cancel' });
      realtime.outputPendingEnd = true;
      if (!realtime.analyser) realtimeSpeakEnd();
      setState('listening', 'Reply interrupted — listening again.');
      return;
    }
    requestGeneration += 1;
    if (requestController) { try { requestController.abort(); } catch (error) {} requestController = null; }
    cancelPlayback();
    if (active) { setState('listening', 'Reply interrupted — listening again.'); resumeRecognition(); }
  }

  function testSpeechOutput() {
    if (!window.speechSynthesis || typeof window.SpeechSynthesisUtterance !== 'function') {
      setState(active ? 'listening' : 'error', 'This device doesn’t support speech output.');
      return;
    }
    try {
      var text = 'Voice output is ready.';
      var utterance = new SpeechSynthesisUtterance(text);
      cancelPlayback();
      var testSeq = ++speechSequence;
      var testGeneration = speechGeneration;
      utterance.lang = 'zh-CN'; utterance.rate = 1; utterance.pitch = 1.04;
      utterance.onstart = function () {
        if (testGeneration === speechGeneration) toPet({ kind: 'speak-start', text: text, lang: utterance.lang, rate: utterance.rate, seq: testSeq });
      };
      utterance.onboundary = function (event) {
        if (testGeneration === speechGeneration) toPet({ kind: 'boundary', charIndex: event.charIndex || 0, charLength: event.charLength || 0, seq: testSeq });
      };
      utterance.onend = utterance.onerror = function () {
        if (testGeneration === speechGeneration) toPet({ kind: 'speak-end', seq: testSeq });
      };
      if (useNativeTTS()) nativeSpeak(text, 'en-US', 1, { onstart: utterance.onstart, onboundary: utterance.onboundary, onend: utterance.onend, onerror: utterance.onend });
      else { window.speechSynthesis.cancel(); window.speechSynthesis.resume(); window.speechSynthesis.speak(utterance); }
      setState(active ? 'listening' : 'idle', 'Playing a speaker test; Octo lip-syncs along.');
    } catch (error) { setState('error', 'Speaker test failed: ' + (error.message || 'unknown error')); }
  }

  function bindRaisingVoiceButton() {
    var frame = document.querySelector('#minest-pet-raising-overlay iframe');
    if (!frame) return;
    if (frame.dataset.voice43Bound === 'true') return;
    var intercept = function () {
      try {
        var child = frame.contentDocument;
        if (!child || !child.documentElement || child.documentElement.dataset.voice43Intercepted) return;
        child.documentElement.dataset.voice43Intercepted = 'true';
        child.addEventListener('click', function (event) {
          var target = event.target;
          var button = target && target.closest ? target.closest('button[aria-label="Live voice"]') : null;
          if (!button) return;
          event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation();
          openPanel();
        }, true);
      } catch (error) {}
    };
    frame.addEventListener('load', intercept);
    frame.dataset.voice43Bound = 'true';
    intercept();
    // React can replace the iframe document after the first load while its
    // avatar bundle starts. Retry briefly so the embedded Voice button always
    // opens the 43.0 panel instead of the unavailable /client-ws path.
    var attempts = 0;
    var retry = window.setInterval(function () {
      intercept();
      attempts += 1;
      if (attempts >= 40 || (frame.contentDocument && frame.contentDocument.documentElement && frame.contentDocument.documentElement.dataset.voice43Intercepted)) window.clearInterval(retry);
    }, 250);
  }

  function boot() {
    if (!document.body) { window.setTimeout(boot, 20); return; }
    buildUI();
    var observer = new MutationObserver(bindRaisingVoiceButton);
    observer.observe(document.body, { childList: true, subtree: true });
    bindRaisingVoiceButton();
    document.addEventListener('keydown', function (event) { if (event.key === 'Escape' && panel.classList.contains('is-open')) closePanel(); });
  }

  window.MinestRealtimeVoice43 = { open: openPanel, close: closePanel, start: startSession, stop: stopSession, interrupt: interruptReply };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
}());
