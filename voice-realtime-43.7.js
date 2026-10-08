/*
 * iPhone 43.7: 43.0's realtime voice + the Pet Raising octopus.
 * - The octopus reacts to the voice state (listening / thinking / speaking) and lip-syncs to the
 *   spoken reply: each sentence and the speech engine's word boundaries are posted to the Pet Raising
 *   frame (postMessage — works on the web and in the app, where the frame is cross-origin), where
 *   octopus-pet-raising-v6/voice-bridge-v1.js turns them into mouth shapes.
 * - The frame's own "Live voice" button asks this page (postMessage) to open the voice panel; 43.0's
 *   same-origin click interception is kept as a fallback.
 *
 * iPhone 43.0 realtime voice path.
 *
 * V6's embedded preview expected a same-origin /client-ws endpoint. That
 * endpoint is not part of the static preview server. This version keeps voice
 * inside the page: Web Speech / Minest iOS speech recognition -> the existing
 * authenticated Minest streaming chat endpoint -> system speech synthesis.
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

  var labels = {
    idle: '未连接',
    connecting: '正在启动麦克风…',
    listening: '正在聆听',
    thinking: '正在生成回复',
    speaking: '正在播报',
    error: '需要检查'
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

  function addStyles() {
    var style = document.createElement('style');
    style.textContent = [
      '#voice43-launch{position:fixed;top:calc(12px + env(safe-area-inset-top));left:14px;z-index:2147483500;border:1px solid rgba(197,232,255,.32);border-radius:999px;padding:9px 13px;background:rgba(7,24,39,.82);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);box-shadow:0 8px 24px rgba(0,0,0,.24);color:#effaff;font:650 11px/1 -apple-system,BlinkMacSystemFont,"SF Pro Display",sans-serif;cursor:pointer;transition:transform .18s ease,background .18s ease}',
      '#voice43-launch:active{transform:scale(.96)}',
      '#voice43-backdrop{position:fixed;inset:0;z-index:2147483600;display:none;align-items:flex-end;justify-content:flex-end;padding:14px;padding-bottom:calc(16px + env(safe-area-inset-bottom));background:rgba(2,10,18,.28);font-family:-apple-system,BlinkMacSystemFont,"SF Pro Display",sans-serif}',
      '#voice43-backdrop.is-open{display:flex}',
      '#voice43-card{width:min(390px,100%);max-height:min(78dvh,690px);display:flex;flex-direction:column;overflow:hidden;border:1px solid rgba(189,229,248,.27);border-radius:22px;background:rgba(5,22,37,.94);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);box-shadow:0 24px 70px rgba(0,0,0,.4);color:#eaf7ff}',
      '#voice43-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:15px 16px 11px;border-bottom:1px solid rgba(196,232,248,.12)}',
      '#voice43-title{display:flex;flex-direction:column;gap:4px}#voice43-title strong{font-size:13px;letter-spacing:.02em}#voice43-title small{font-size:10px;color:rgba(215,237,249,.62)}',
      '#voice43-close{width:30px;height:30px;border:1px solid rgba(210,237,250,.18);border-radius:50%;background:rgba(255,255,255,.07);color:#effaff;font-size:18px;line-height:1;cursor:pointer}',
      '#voice43-status-row{display:flex;align-items:center;gap:8px;padding:12px 16px 4px;font-size:11px}',
      '#voice43-dot{width:8px;height:8px;flex:0 0 8px;border-radius:50%;background:#91a7b7;box-shadow:0 0 0 3px rgba(145,167,183,.12)}',
      '#voice43-backdrop[data-state="listening"] #voice43-dot{background:#56e2b5;box-shadow:0 0 0 4px rgba(86,226,181,.14)}',
      '#voice43-backdrop[data-state="thinking"] #voice43-dot{background:#ffd27b;box-shadow:0 0 0 4px rgba(255,210,123,.14)}',
      '#voice43-backdrop[data-state="speaking"] #voice43-dot{background:#a89aff;box-shadow:0 0 0 4px rgba(168,154,255,.16)}',
      '#voice43-backdrop[data-state="error"] #voice43-dot{background:#ff7c8a;box-shadow:0 0 0 4px rgba(255,124,138,.14)}',
      '#voice43-detail{min-height:30px;padding:5px 16px 11px;color:rgba(215,237,249,.68);font-size:10px;line-height:1.45}',
      '#voice43-transcript{min-height:80px;max-height:34dvh;overflow:auto;padding:8px 14px 12px;display:flex;flex-direction:column;gap:8px;border-top:1px solid rgba(196,232,248,.1);border-bottom:1px solid rgba(196,232,248,.1)}',
      '.voice43-message{max-width:92%;padding:8px 10px;border-radius:12px;font-size:11px;line-height:1.45;white-space:pre-wrap;overflow-wrap:anywhere}',
      '.voice43-message.user{align-self:flex-end;background:rgba(66,161,205,.22);border:1px solid rgba(126,213,248,.15)}',
      '.voice43-message.assistant{align-self:flex-start;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.07)}',
      '.voice43-message.system{align-self:center;color:rgba(215,237,249,.6);font-size:10px;background:transparent}',
      '#voice43-interim{min-height:14px;padding:8px 16px 0;color:rgba(191,224,240,.6);font-size:10px;font-style:italic}',
      '#voice43-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:12px 14px 14px}',
      '.voice43-action{min-height:38px;border:1px solid rgba(184,224,244,.2);border-radius:12px;background:rgba(255,255,255,.07);color:#eaf7ff;font:650 11px/1 -apple-system,BlinkMacSystemFont,"SF Pro Display",sans-serif;cursor:pointer}',
      '.voice43-action.primary{background:linear-gradient(135deg,#8066eb,#a46be6);border-color:rgba(203,182,255,.48);color:#fff}',
      '.voice43-action:disabled{opacity:.42;cursor:default}',
      '#voice43-note{padding:0 15px 13px;color:rgba(215,237,249,.48);font-size:9px;line-height:1.4}',
      '@media(max-width:520px){#voice43-backdrop{padding:9px;padding-bottom:calc(9px + env(safe-area-inset-bottom))}#voice43-card{width:100%;max-height:76dvh;border-radius:19px}}',
      '@media(prefers-reduced-motion:reduce){#voice43-launch{transition:none}}'
    ].join('');
    document.head.appendChild(style);
  }

  // 43.7: tell the octopus in the Pet Raising frame what the voice is doing
  function toPet(msg) {
    var frame = document.querySelector('#minest-pet-raising-overlay iframe');
    if (!frame || !frame.contentWindow) return;
    msg.type = 'minest-voice-state';
    try { frame.contentWindow.postMessage(msg, '*'); } catch (error) {}
  }
  window.addEventListener('message', function (event) {
    var d = event.data;
    var frame = document.querySelector('#minest-pet-raising-overlay iframe');
    if (!d || d.type !== 'minest-voice' || !frame || event.source !== frame.contentWindow) return;
    if (d.action === 'open') openPanel();
  });

  function setState(next, detail) {
    state = next;
    toPet({ kind: 'state', state: next });
    if (!panel) return;
    panel.dataset.state = next;
    statusNode.textContent = labels[next] || next;
    detailNode.textContent = detail || '';
    startButton.textContent = active ? '结束语音' : '开始语音';
    startButton.classList.toggle('primary', !active);
    interruptButton.disabled = !active || (state !== 'speaking' && state !== 'thinking');
    launchButton.setAttribute('aria-label', active ? '实时语音 43 正在运行' : '打开实时语音 43');
  }

  function renderTranscript() {
    if (!transcriptNode) return;
    transcriptNode.replaceChildren();
    transcriptItems.slice(-8).forEach(function (item) {
      var row = h('div', { className: 'voice43-message ' + item.role });
      row.textContent = item.text;
      transcriptNode.appendChild(row);
    });
    transcriptNode.scrollTop = transcriptNode.scrollHeight;
  }

  function addTranscript(role, text) {
    if (!text || !text.trim()) return null;
    var item = { role: role, text: text.trim() };
    transcriptItems.push(item);
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

  function openPanel() {
    panel.classList.add('is-open');
    panel.setAttribute('aria-hidden', 'false');
    launchButton.setAttribute('aria-expanded', 'true');
  }

  function closePanel() {
    if (active) stopSession();
    panel.classList.remove('is-open');
    panel.setAttribute('aria-hidden', 'true');
    launchButton.setAttribute('aria-expanded', 'false');
  }

  function buildUI() {
    addStyles();
    launchButton = h('button', { id: 'voice43-launch', type: 'button', 'aria-expanded': 'false', 'aria-label': '打开实时语音 43' }, '🎙 Voice 43');
    launchButton.addEventListener('click', openPanel);
    document.body.appendChild(launchButton);

    panel = h('div', { id: 'voice43-backdrop', 'data-state': 'idle', 'aria-hidden': 'true' });
    panel.addEventListener('click', function (event) { if (event.target === panel) closePanel(); });
    var card = h('section', { id: 'voice43-card', role: 'dialog', 'aria-label': 'Realtime Voice 43' });
    var head = h('header', { id: 'voice43-head' });
    var title = h('div', { id: 'voice43-title' });
    title.appendChild(h('strong', {}, 'Realtime Voice · 43.7'));
    title.appendChild(h('small', {}, '听写 → Minest 流式 AI → 语音播报'));
    var close = h('button', { id: 'voice43-close', type: 'button', 'aria-label': '关闭实时语音' }, '×');
    close.addEventListener('click', closePanel);
    head.appendChild(title); head.appendChild(close);
    var statusRow = h('div', { id: 'voice43-status-row' });
    statusRow.appendChild(h('i', { id: 'voice43-dot', 'aria-hidden': 'true' }));
    statusNode = h('strong', {}, labels.idle);
    statusRow.appendChild(statusNode);
    detailNode = h('div', { id: 'voice43-detail' }, '点击开始后请求麦克风，并使用当前设备已配置的 Minest AI token。');
    transcriptNode = h('div', { id: 'voice43-transcript', 'aria-live': 'polite' });
    var interimNode = h('div', { id: 'voice43-interim' });
    interimNode.id = 'voice43-interim';
    startButton = h('button', { className: 'voice43-action primary', type: 'button' }, '开始语音');
    interruptButton = h('button', { className: 'voice43-action', type: 'button', disabled: 'disabled' }, '打断回复');
    outputTestButton = h('button', { className: 'voice43-action', type: 'button' }, '测试语音输出');
    var closeBottom = h('button', { className: 'voice43-action', type: 'button' }, '关闭面板');
    startButton.addEventListener('click', function () { if (active) stopSession(); else startSession(); });
    interruptButton.addEventListener('click', interruptReply);
    outputTestButton.addEventListener('click', testSpeechOutput);
    closeBottom.addEventListener('click', closePanel);
    var actions = h('div', { id: 'voice43-actions' });
    actions.appendChild(startButton); actions.appendChild(interruptButton);
    actions.appendChild(outputTestButton); actions.appendChild(closeBottom);
    var note = h('div', { id: 'voice43-note' }, '43.7：Minest 流式语音 + 小章鱼口型与表情同步；Pet Raising 里的 Voice 按钮也会打开这里。若提示未授权，请先配置 minest_ai_token。');
    card.appendChild(head); card.appendChild(statusRow); card.appendChild(detailNode);
    card.appendChild(transcriptNode); card.appendChild(interimNode); card.appendChild(actions); card.appendChild(note);
    panel.appendChild(card); document.body.appendChild(panel);
    setState('idle', '点击开始后请求麦克风，并使用当前设备已配置的 Minest AI token。');
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
      var token = localStorage.getItem('minest_ai_token');
      if (token) headers['X-Minest-Token'] = token;
    } catch (error) {}
    return headers;
  }

  function getModel() {
    var model = 'gpt-6-sol';
    try { model = localStorage.getItem('minest_ai_model') || model; } catch (error) {}
    if (model === 'openrouter') {
      try { return localStorage.getItem('minest_ai_openrouter_model') || 'openai/gpt-4o-mini'; } catch (error) { return 'openai/gpt-4o-mini'; }
    }
    return model;
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
      if (error instanceof SyntaxError) return;
      throw error;
    }
  }

  function speakSegments(delta, flush) {
    speechBuffer += String(delta || '');
    var breaks = /[。！？；\n.!?;]+/g;
    var match;
    while ((match = breaks.exec(speechBuffer)) !== null) {
      var end = match.index + match[0].length;
      var piece = speechBuffer.slice(0, end).trim();
      speechBuffer = speechBuffer.slice(end);
      breaks.lastIndex = 0;
      if (piece) speechQueue.push(piece);
    }
    if (flush && speechBuffer.trim()) {
      speechQueue.push(speechBuffer.trim());
      speechBuffer = '';
    }
    processSpeechQueue();
  }

  function processSpeechQueue() {
    if (speechPlaying || !speechQueue.length) { finishPlaybackIfReady(); return; }
    if (!window.speechSynthesis || typeof window.SpeechSynthesisUtterance !== 'function') {
      speechQueue.length = 0;
      responseComplete = true;
      setState('listening', '回复文字已生成；当前浏览器没有语音播报 API。');
      resumeRecognition();
      return;
    }
    var text = speechQueue.shift();
    var utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = /[\u4e00-\u9fff]/.test(text) ? 'zh-CN' : 'en-US';
    utterance.rate = 1.02;
    utterance.pitch = 1.04;
    try {
      var voices = window.speechSynthesis.getVoices();
      var voice = voices.find(function (item) { return item.lang && item.lang.toLowerCase().indexOf(utterance.lang.toLowerCase().slice(0, 2)) === 0; });
      if (voice) utterance.voice = voice;
    } catch (error) {}
    speechPlaying = true;
    pauseRecognition();
    setState('speaking', 'AI 回复正在分句播报；可点击“打断回复”。');
    utterance.onstart = function () { toPet({ kind: 'speak-start', text: text, lang: utterance.lang, rate: utterance.rate }); };
    utterance.onboundary = function (event) { toPet({ kind: 'boundary', charIndex: event.charIndex, charLength: event.charLength || 0, name: event.name }); };
    utterance.onend = function () { toPet({ kind: 'speak-end' }); speechPlaying = false; processSpeechQueue(); };
    utterance.onerror = function () { toPet({ kind: 'speak-end' }); speechPlaying = false; processSpeechQueue(); };
    try { window.speechSynthesis.speak(utterance); }
    catch (error) { speechPlaying = false; processSpeechQueue(); }
  }

  function finishPlaybackIfReady() {
    if (!responseComplete || speechPlaying || speechQueue.length) return;
    responseComplete = false;
    resumeRecognition();
    if (active) setState('listening', '回复完成，麦克风已恢复。');
  }

  async function requestReply(prompt) {
    if (!active || !prompt) return;
    if (prompt === lastSubmitted) return;
    lastSubmitted = prompt;
    pauseRecognition();
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    speechQueue.length = 0; speechBuffer = ''; speechPlaying = false; responseComplete = false;
    addTranscript('user', prompt);
    assistantText = '';
    setState('thinking', '正在连接 Minest 流式聊天服务…');
    requestController = new AbortController();
    var endpoint = getChatEndpoint();
    var body = {
      prompt: prompt,
      model: getModel(),
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
        throw new Error(problem.error || ('语音 AI 请求失败（HTTP ' + response.status + '）'));
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
          while ((boundary = buffer.indexOf('\n\n')) >= 0) {
            var raw = buffer.slice(0, boundary); buffer = buffer.slice(boundary + 2);
            var before = received;
            parseEvent(raw, function (value) {
              if (value.length >= received.length && value.slice(0, received.length) === received) {
                var delta = value.slice(received.length); received = value;
                if (delta) { assistantText = received; updateAssistantTranscript(received); speakSegments(delta, false); }
              } else {
                received += value; assistantText = received; updateAssistantTranscript(received); speakSegments(value, false);
              }
            });
            if (received !== before) setState(speechPlaying ? 'speaking' : 'thinking', '收到流式回复…');
          }
        }
        if (buffer.trim()) parseEvent(buffer, function (value) {
          if (value.length >= received.length && value.slice(0, received.length) === received) {
            var delta = value.slice(received.length); received = value;
            if (delta) { assistantText = received; updateAssistantTranscript(received); speakSegments(delta, false); }
          } else { received += value; assistantText = received; updateAssistantTranscript(received); speakSegments(value, false); }
        });
      } else {
        var data = await response.json().catch(function () { return {}; });
        received = data.reply || data.message || data.text || '';
      }
      if (!streamed && !received) throw new Error('语音 AI 返回了空回复。');
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
      if (error && error.name === 'AbortError') return;
      responseComplete = false;
      setState('error', error && error.message ? error.message : '实时语音请求失败。');
      resumeRecognition();
    } finally {
      requestController = null;
    }
  }

  function submitPending(text) {
    clearTimeout(submitTimer); submitTimer = 0;
    var value = String(text || '').replace(/\s+/g, ' ').trim();
    pendingTranscript = ''; interimText = '';
    var interim = document.getElementById('voice43-interim');
    if (interim) interim.textContent = '';
    if (!active || !value) return;
    requestReply(value);
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
      if (active && !recognitionPaused) setState('listening', '浏览器听写已启动，等待你说话。');
    };
    recognition.onresult = function (event) {
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
        if (interim) interim.textContent = '识别中：' + interimText;
      }
      if (finalPart.trim()) {
        pendingTranscript = (pendingTranscript + ' ' + finalPart).trim();
        scheduleSubmit(pendingTranscript, 620);
      } else if (interimPart.trim()) {
        scheduleSubmit((pendingTranscript + ' ' + interimPart).trim(), 1050);
      }
    };
    recognition.onerror = function (event) {
      var error = event && event.error;
      if (error === 'no-speech' || error === 'aborted') return;
      if (error === 'not-allowed' || error === 'service-not-allowed') {
        stopRecognition(); active = false;
        setState('error', '麦克风或听写权限被拒绝，请在浏览器/系统设置中允许 Minest 使用语音识别。');
      } else setState('error', '听写服务错误：' + (error || 'unknown'));
    };
    recognition.onend = function () {
      if (active && !recognitionPaused && !nativeMode) {
        window.setTimeout(function () {
          if (!active || recognitionPaused || !recognition) return;
          try { recognition.start(); } catch (error) {}
        }, 180);
      }
    };
    return true;
  }

  function startRecognition() {
    if (!active) return;
    recognitionPaused = false;
    if (nativeMode) {
      try {
        if (window.MinestNative && window.MinestNative.startSpeechRecognition) window.MinestNative.startSpeechRecognition();
        setState('listening', 'iOS 原生听写已恢复。');
      } catch (error) { setState('error', 'iOS 听写无法恢复。'); }
    } else if (recognition) {
      try { recognition.start(); } catch (error) {
        if (!/already started/i.test(error && error.message || '')) setState('error', '浏览器听写无法启动：' + (error.message || '请重试'));
      }
    }
  }

  function pauseRecognition() {
    if (!active || recognitionPaused) return;
    recognitionPaused = true;
    if (nativeMode) {
      try { if (window.MinestNative && window.MinestNative.stopSpeechRecognition) window.MinestNative.stopSpeechRecognition(); } catch (error) {}
    } else if (recognition) {
      try { recognition.stop(); } catch (error) {}
    }
  }

  function resumeRecognition() {
    if (!active) return;
    window.setTimeout(startRecognition, 140);
  }

  function onNativeSpeech(event) {
    if (!active || !nativeMode) return;
    var detail = event && event.detail || {};
    var text = String(detail.text || '').trim();
    if (!text || text === nativeSubmitted) return;
    nativeLatest = text;
    var interim = document.getElementById('voice43-interim');
    if (interim) interim.textContent = '识别中：' + text;
    scheduleSubmit(text, detail.isFinal ? 120 : 760);
  }

  function onNativeSpeechError(event) {
    if (!active || !nativeMode) return;
    var error = event && event.detail && event.detail.error;
    active = false;
    setState('error', error === 'speech_not_authorized' ? 'iOS 语音识别权限未开启；请在“设置 → 隐私与安全性 → 语音识别”允许 Minest。' : 'iOS 听写启动失败：' + (error || '未知错误'));
  }

  async function startSession() {
    if (active) return;
    active = true; history = []; transcriptItems = []; renderTranscript();
    nativeSubmitted = ''; nativeLatest = ''; pendingTranscript = ''; lastSubmitted = '';
    clearTimeout(recognitionStartTimer); recognitionStartTimer = 0;
    setState('connecting', '正在申请设备听写权限…');
    if (window.speechSynthesis) { try { window.speechSynthesis.resume(); } catch (error) {} }

    if (window.MinestNative && window.MinestNative.startSpeechRecognition && window.MinestNative.requestMicrophonePermission) {
      nativeMode = true;
      window.addEventListener('minestSpeechResult', onNativeSpeech);
      window.addEventListener('minestSpeechError', onNativeSpeechError);
      window.addEventListener('microphonePermissionResponse', function (event) {
        if (active && event && event.detail && event.detail.granted === false) {
          active = false; setState('error', 'iOS 麦克风权限被拒绝，请在“设置 → Minest → 麦克风”开启。');
        }
      });
      try {
        window.MinestNative.requestMicrophonePermission();
        window.MinestNative.startSpeechRecognition();
        setState('listening', 'iOS 原生麦克风与听写已启动。');
      } catch (error) {
        active = false; setState('error', '无法启动 iOS 原生听写：' + (error.message || '请重试'));
      }
      return;
    }

    if (!attachWebRecognition()) {
      active = false;
      setState('error', '当前浏览器没有 Web Speech 听写能力；请用 Minest iOS App 或支持语音识别的 Safari/Chrome。');
      return;
    }
    try {
      recognitionPaused = false;
      recognition.start();
      setState('connecting', '等待浏览器麦克风授权…');
      recognitionStartTimer = window.setTimeout(function () {
        if (active && recognition && !recognitionPaused && state === 'connecting') {
          active = false;
          stopRecognition();
          setState('error', '麦克风授权没有返回；请允许此页面使用麦克风后重试。');
        }
      }, 12000);
    } catch (error) {
      active = false;
      setState('error', '听写启动失败：' + (error.message || '请重试'));
    }
  }

  function stopRecognition() {
    clearTimeout(submitTimer); submitTimer = 0;
    clearTimeout(recognitionStartTimer); recognitionStartTimer = 0;
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
    stopRecognition();
    if (requestController) { try { requestController.abort(); } catch (error) {} requestController = null; }
    if (window.speechSynthesis) { try { window.speechSynthesis.cancel(); } catch (error) {} }
    speechQueue.length = 0; speechBuffer = ''; speechPlaying = false; responseComplete = false;
    interimText = ''; pendingTranscript = '';
    if (document.getElementById('voice43-interim')) document.getElementById('voice43-interim').textContent = '';
    setState('idle', '语音已结束，麦克风已释放。');
  }

  function interruptReply() {
    if (requestController) { try { requestController.abort(); } catch (error) {} requestController = null; }
    if (window.speechSynthesis) { try { window.speechSynthesis.cancel(); } catch (error) {} }
    speechQueue.length = 0; speechBuffer = ''; speechPlaying = false; responseComplete = false;
    if (active) { setState('listening', '回复已打断，继续聆听。'); resumeRecognition(); }
  }

  function testSpeechOutput() {
    if (!window.speechSynthesis || typeof window.SpeechSynthesisUtterance !== 'function') {
      setState(active ? 'listening' : 'error', '当前设备不支持系统语音播报。');
      return;
    }
    try {
      var utterance = new SpeechSynthesisUtterance('语音输出正常。Voice output is ready.');
      utterance.lang = 'zh-CN'; utterance.rate = 1; utterance.pitch = 1.04;
      window.speechSynthesis.cancel(); window.speechSynthesis.resume(); window.speechSynthesis.speak(utterance);
      setState(active ? 'listening' : 'idle', '已启动一条本机语音输出自检。');
    } catch (error) { setState('error', '语音输出自检失败：' + (error.message || '未知错误')); }
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
