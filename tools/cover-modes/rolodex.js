/* =========================================================================
   Minest 3D Cover · Vintage Rolodex Rotary Card File Mode (rolodex.js)
   Adapted faithfully from Rolodex Testimonials by @madebysourasith (MIT)
   ========================================================================= */
(function () {
  'use strict';
  if (window.MinestRolodexMode) return;

  var css = document.createElement('style');
  css.id = 'mn-rolodex-css';
  css.textContent =
    '#cm-ov.rolodex{touch-action:pan-y;overflow-y:auto;overflow-x:hidden}' +
    '#cm-ov.rolodex.rdx-paper-mode{background:#f1ede5!important;color:#1f1c18!important;transition:background .32s ease,color .32s ease}' +
    '#cm-ov.rolodex .rdx-grain-overlay{position:fixed;inset:0;width:100%;height:100%;opacity:.055;mix-blend-mode:overlay;pointer-events:none;z-index:2}' +
    '#cm-ov.rolodex .rdx-top-actions{position:absolute;top:calc(env(safe-area-inset-top,0px) + 14px);right:calc(env(safe-area-inset-right,0px) + 18px);z-index:2050;display:inline-flex;align-items:center;gap:8px}' +
    'body.v2 #cm-ov.rolodex .rdx-top-actions{top:calc(env(safe-area-inset-top,0px) + 54px);right:calc(env(safe-area-inset-right,0px) + 14px)}' +
    'body.v2 #cm-ov.rolodex .rdx-shell{padding-top:calc(env(safe-area-inset-top,0px) + 64px);padding-bottom:calc(env(safe-area-inset-bottom,0px) + 92px)}' +
    'html.mn-sys-reading #cm-ov.rolodex .rdx-top-actions{display:none!important}' +
    '#cm-ov.rolodex .rdx-pill-btn{display:inline-flex;align-items:center;gap:6px;height:32px;padding:0 13px;border-radius:999px;font:600 12px/1 -apple-system,BlinkMacSystemFont,"PingFang SC",system-ui,sans-serif;cursor:pointer;user-select:none;color:rgba(255,255,255,.88);background:rgba(15,23,42,.65);border:1px solid rgba(255,255,255,.16);border-top-color:rgba(255,255,255,.3);-webkit-backdrop-filter:blur(14px) saturate(180%);backdrop-filter:blur(14px) saturate(180%);box-shadow:0 4px 16px rgba(0,0,0,.24);transition:all .2s cubic-bezier(.16,1,.3,1);-webkit-tap-highlight-color:transparent}' +
    '#cm-ov.rolodex .rdx-pill-btn:hover{transform:translateY(-1px);background:rgba(255,255,255,.18);color:#fff}' +
    '#cm-ov.rolodex .rdx-pill-btn.on{color:#fff;background:rgba(217,164,65,.28);border-color:rgba(234,179,8,.54);box-shadow:0 0 18px rgba(217,164,65,.25),inset 0 1px 0 rgba(255,255,255,.32)}' +
    '#cm-ov.rolodex.rdx-paper-mode .rdx-pill-btn{color:#1f1c18;background:rgba(255,255,255,.78);border-color:rgba(31,28,24,.12);box-shadow:0 4px 14px rgba(31,28,24,.07)}' +
    '#cm-ov.rolodex.rdx-paper-mode .rdx-pill-btn:hover{background:rgba(255,255,255,.95)}' +
    '#cm-ov.rolodex.rdx-paper-mode .rdx-pill-btn.on{background:#1f1c18;color:#f4efe6;border-color:#1f1c18;box-shadow:0 4px 14px rgba(31,28,24,.18)}' +
    '#cm-ov.rolodex .rdx-shell{--rdx-sans:"Switzer","DM Sans",-apple-system,BlinkMacSystemFont,"PingFang SC","Noto Sans SC",sans-serif;--rdx-mono:"JetBrains Mono",ui-monospace,SFMono-Regular,Menlo,monospace;--rdx-ink:#1f1c18;--rdx-mute:#6f675c;--rdx-hair:rgba(31,28,24,.1);position:relative;z-index:3;width:100%;min-height:100%;box-sizing:border-box;max-width:1380px;margin:0 auto;padding:calc(env(safe-area-inset-top,0px) + 56px) clamp(16px,4vw,68px) calc(env(safe-area-inset-bottom,0px) + 88px);display:grid;grid-template-columns:minmax(0,4.4fr) minmax(0,7.6fr);column-gap:clamp(20px,3vw,52px);align-items:center;font-family:var(--rdx-sans);-webkit-font-smoothing:antialiased}' +
    'html.mn-dock-v #cm-ov.rolodex .rdx-shell{padding-bottom:calc(env(safe-area-inset-bottom,0px) + 24px)}' +
    '#cm-ov.rolodex .rdx-shell.is-stage-dark{--rdx-ink:#f5f2eb;--rdx-mute:rgba(245,242,235,.64);--rdx-hair:rgba(255,255,255,.12)}' +
    '#cm-ov.rolodex .rdx-shell.is-stage-light{--rdx-ink:#0f172a;--rdx-mute:rgba(15,23,42,.62);--rdx-hair:rgba(15,23,42,.1)}' +
    '#cm-ov.rolodex .rdx-intro{position:relative;z-index:4;padding-left:clamp(0px,1.2vw,20px);color:var(--rdx-ink)}' +
    '#cm-ov.rolodex .rdx-eyebrow{margin:0 0 18px;font:500 11.5px/1.2 var(--rdx-mono);letter-spacing:.18em;text-transform:uppercase;color:var(--rdx-ink);opacity:.88}' +
    '#cm-ov.rolodex .rdx-heading{margin:0;font-family:var(--rdx-sans);font-weight:500;font-size:clamp(32px,3.5vw,56px);line-height:1.04;letter-spacing:-.036em;color:var(--rdx-ink);text-wrap:balance}' +
    '#cm-ov.rolodex .rdx-rating{display:flex;align-items:center;flex-wrap:wrap;gap:9px;margin:20px 0 0;font-size:15.5px;color:var(--rdx-mute);font-variant-numeric:tabular-nums}' +
    '#cm-ov.rolodex .rdx-rating .rdx-score{color:var(--rdx-ink);font-weight:600}' +
    '#cm-ov.rolodex .rdx-stars{position:relative;display:inline-block;height:15px;line-height:0}' +
    '#cm-ov.rolodex .rdx-stars span{display:flex;gap:2.5px;height:15px}' +
    '#cm-ov.rolodex .rdx-stars svg{width:15px;height:15px;flex:none;display:block}' +
    '#cm-ov.rolodex .rdx-stars .bg{color:rgba(140,130,114,.35)}' +
    '#cm-ov.rolodex .rdx-stars .fg{position:absolute;inset:0 auto 0 0;overflow:hidden;color:var(--rdx-ink)}' +
    '#cm-ov.rolodex .rdx-lede{margin:20px 0 0;max-width:36ch;font-size:15px;line-height:1.56;color:var(--rdx-mute);display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden}' +
    '#cm-ov.rolodex .rdx-who{margin:24px 0 0;padding-top:15px;border-top:1px solid var(--rdx-hair);display:flex;gap:12px;align-items:baseline;font:500 11px/1.4 var(--rdx-mono);letter-spacing:.15em;text-transform:uppercase;color:var(--rdx-mute)}' +
    '#cm-ov.rolodex .rdx-who b{font-weight:600;color:var(--rdx-ink);font-variant-numeric:tabular-nums;white-space:nowrap}' +
    '#cm-ov.rolodex .rdx-card-actions{margin-top:16px;display:flex;flex-wrap:wrap;gap:8px}' +
    '#cm-ov.rolodex .rdx-act-btn{display:inline-flex;align-items:center;gap:6px;height:32px;padding:0 13px;border-radius:999px;border:1px solid var(--rdx-hair);background:rgba(128,120,108,.09);color:var(--rdx-ink);font:500 12px/1 var(--rdx-sans);cursor:pointer;transition:transform .15s ease,background .18s ease}' +
    '#cm-ov.rolodex .rdx-act-btn:hover{background:rgba(128,120,108,.18);transform:translateY(-1px)}' +
    '#cm-ov.rolodex .rdx-act-btn:active{transform:scale(.96)}' +
    '#cm-ov.rolodex .rdx-file{position:relative;display:flex;flex-direction:column;align-items:stretch;min-width:0}' +
    '#cm-ov.rolodex .rdx-stage{position:relative;width:100%;height:min(70vh,680px);min-height:430px;outline:none;border-radius:20px}' +
    '#cm-ov.rolodex .rdx-stage canvas{position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:pan-y;-webkit-tap-highlight-color:transparent}' +
    '#cm-ov.rolodex .rdx-stage canvas.grab{cursor:grab}#cm-ov.rolodex .rdx-stage canvas.turn{cursor:ns-resize}#cm-ov.rolodex .rdx-stage canvas.drag{cursor:grabbing}' +
    '#cm-ov.rolodex .rdx-grip{position:absolute;touch-action:none;pointer-events:none;-webkit-tap-highlight-color:transparent}' +
    '@media (pointer:coarse){#cm-ov.rolodex .rdx-grip{pointer-events:auto}}' +
    '#cm-ov.rolodex .rdx-controls{display:flex;align-items:center;justify-content:center;gap:10px;margin:-8px auto 0;width:min(100%,520px);z-index:5}' +
    '#cm-ov.rolodex .rdx-arr{width:38px;height:38px;border-radius:50%;border:0;background:transparent;color:var(--rdx-ink);cursor:pointer;display:grid;place-items:center;transition:background .2s,transform .15s}' +
    '#cm-ov.rolodex .rdx-arr:hover{background:rgba(128,120,108,.12)}#cm-ov.rolodex .rdx-arr:active{transform:scale(.92)}' +
    '#cm-ov.rolodex .rdx-arr svg{width:17px;height:17px;display:block}' +
    '#cm-ov.rolodex .rdx-dots{display:flex;align-items:center;justify-content:center;gap:2px;flex-wrap:nowrap}' +
    '#cm-ov.rolodex .rdx-dot{width:20px;height:34px;border:0;background:transparent;padding:0;cursor:pointer;display:grid;place-items:center}' +
    '#cm-ov.rolodex .rdx-dot::before{content:"";width:6.5px;height:6.5px;border-radius:50%;background:rgba(145,136,122,.42);transition:background .22s,transform .22s}' +
    '#cm-ov.rolodex .rdx-dot:hover::before{background:rgba(145,136,122,.75)}' +
    '#cm-ov.rolodex .rdx-dot[aria-current="true"]::before{background:var(--rdx-ink);transform:scale(1.22)}' +
    '#cm-ov.rolodex .rdx-mini-counter{font:500 11px/1 var(--rdx-mono);letter-spacing:.14em;color:var(--rdx-mute);padding:0 8px;font-variant-numeric:tabular-nums}' +
    '#cm-holo #cm-ov.rolodex.rdx-paper-mode,#cm-ov.rolodex.hl.rdx-paper-mode{background:transparent!important}' +
    '@media (max-width:900px){' +
      '#cm-ov.rolodex .rdx-shell{grid-template-columns:minmax(0,1fr);padding:calc(env(safe-area-inset-top,0px) + 52px) 12px calc(env(safe-area-inset-bottom,0px) + 84px);row-gap:4px}' +
      '#cm-ov.rolodex .rdx-intro{text-align:center;padding:0 8px}' +
      '#cm-ov.rolodex .rdx-eyebrow{margin-bottom:6px;font-size:10.5px}' +
      '#cm-ov.rolodex .rdx-heading{font-size:clamp(22px,6.6vw,34px)}' +
      '#cm-ov.rolodex .rdx-rating{justify-content:center;margin-top:8px;font-size:13px}' +
      '#cm-ov.rolodex .rdx-lede{display:none}' +
      '#cm-ov.rolodex .rdx-who{justify-content:center;margin-top:8px;padding-top:8px}' +
      '#cm-ov.rolodex .rdx-card-actions{justify-content:center;margin-top:8px}' +
      '#cm-ov.rolodex .rdx-stage{height:min(96vw,430px);min-height:310px}' +
      '#cm-ov.rolodex .rdx-top-actions{top:calc(env(safe-area-inset-top,0px) + 10px);right:10px;gap:6px}' +
      '#cm-ov.rolodex .rdx-pill-btn{height:28px;padding:0 10px;font-size:11px}' +
    '}';
  document.head.appendChild(css);

  var threePromise = null;
  function ensureThree() {
    if (window.THREE) return Promise.resolve(window.THREE);
    if (threePromise) return threePromise;
    threePromise = new Promise(function (resolve, reject) {
      var inSub = /\/(cards-2|spatial-home|holo-lab|dynamic-2)\//.test(location.pathname || '');
      var urls = (inSub ? ['../vendor/three.min.js', './vendor/three.min.js'] : ['./vendor/three.min.js', '../vendor/three.min.js']).concat([
        'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
        'https://unpkg.com/three@0.128.0/build/three.min.js',
        'https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.min.js'
      ]);
      function loadAt(idx) {
        if (window.THREE) { resolve(window.THREE); return; }
        if (idx >= urls.length) {
          threePromise = null;
          reject(new Error('Failed to load Three.js r128'));
          return;
        }
        var s = document.createElement('script');
        s.src = urls[idx];
        s.async = true;
        s.onload = function () {
          if (window.THREE) resolve(window.THREE);
          else loadAt(idx + 1);
        };
        s.onerror = function () { loadAt(idx + 1); };
        document.head.appendChild(s);
      }
      loadAt(0);
    });
    return threePromise;
  }

  var TAB_COLORS = ['#c9573f', '#d9a441', '#8ea489', '#5f80a8', '#c98f8a', '#7d8b6a'];
  var MARKS = ['triangle', 'ring', 'bars', 'arc', 'diamond', 'squares'];

  function mod(a, n) { return ((a % n) + n) % n; }
  function pad(n) { return String(n).padStart(2, '0'); }
  function rng(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function rr(ctx, x, y, w, h, r) {
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  function tabRect(i, w, s, mirror) {
    var tw = 250 * s, m = 70 * s, slots = 5;
    var x = m + (mod(i * 2, slots)) * (w - 2 * m - tw) / (slots - 1);
    if (mirror) x = w - x - tw;
    return [x, tw];
  }
  function wrapMultilingual(ctx, text, maxW) {
    var clean = String(text || '').replace(/\r\n/g, '\n').replace(/\s+/g, ' ').trim();
    if (!clean) return [''];
    var tokens = clean.match(/[\u2E80-\u9FFF\uF900-\uFAFF\uFE30-\uFE4F\uFF00-\uFFEF]|[^\s\u2E80-\u9FFF\uF900-\uFAFF\uFE30-\uFE4F\uFF00-\uFFEF]+|\s+/g) || [clean];
    var lines = [], line = '';
    for (var i = 0; i < tokens.length; i++) {
      var tok = tokens[i];
      if (!line && /^\s+$/.test(tok)) continue;
      var cand = line + tok;
      if (ctx.measureText(cand).width > maxW && line.trim()) {
        lines.push(line.trim());
        line = /^\s+$/.test(tok) ? '' : tok;
      } else {
        line = cand;
      }
    }
    if (line.trim()) lines.push(line.trim());
    return lines.length ? lines : [''];
  }
  function drawMark(ctx, kind, cx, cy, s, col) {
    ctx.save();
    ctx.fillStyle = col;
    ctx.strokeStyle = col;
    ctx.lineWidth = s * 0.12;
    ctx.beginPath();
    switch (kind) {
      case 'ring':
        ctx.arc(cx, cy, s * 0.42, 0, 7); ctx.stroke();
        ctx.beginPath(); ctx.arc(cx, cy, s * 0.14, 0, 7); ctx.fill();
        break;
      case 'bars':
        for (var k = 0; k < 3; k++) {
          var h = s * (0.5 + k * 0.22);
          ctx.rect(cx - s * 0.4 + k * s * 0.3, cy + s * 0.42 - h, s * 0.18, h);
        }
        ctx.fill();
        break;
      case 'arc':
        ctx.arc(cx, cy + s * 0.2, s * 0.46, Math.PI, 0); ctx.closePath(); ctx.fill();
        ctx.fillRect(cx - s * 0.46, cy + s * 0.3, s * 0.92, s * 0.12);
        break;
      case 'diamond':
        ctx.moveTo(cx, cy - s * 0.48); ctx.lineTo(cx + s * 0.48, cy);
        ctx.lineTo(cx, cy + s * 0.48); ctx.lineTo(cx - s * 0.48, cy);
        ctx.closePath(); ctx.stroke();
        ctx.beginPath(); ctx.arc(cx, cy, s * 0.12, 0, 7); ctx.fill();
        break;
      case 'squares':
        ctx.rect(cx - s * 0.44, cy - s * 0.44, s * 0.56, s * 0.56); ctx.fill();
        ctx.beginPath(); ctx.rect(cx - s * 0.1, cy - s * 0.1, s * 0.54, s * 0.54); ctx.stroke();
        break;
      default:
        ctx.moveTo(cx, cy - s * 0.46); ctx.lineTo(cx + s * 0.5, cy + s * 0.4);
        ctx.lineTo(cx - s * 0.5, cy + s * 0.4); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }

  var actx = null, noiseBuf = null, lastSnd = 0, audioUnlockedBound = false;
  function unlockAudio() {
    try {
      actx = (typeof SoundEngine !== 'undefined' && SoundEngine && SoundEngine.ctx) ? SoundEngine.ctx : (actx || new (window.AudioContext || window.webkitAudioContext)());
      if (actx.state === 'suspended') actx.resume();
      if (!noiseBuf || noiseBuf.sampleRate !== actx.sampleRate) {
        var n = actx.sampleRate;
        noiseBuf = actx.createBuffer(1, n, n);
        var d = noiseBuf.getChannelData(0);
        for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
      }
    } catch (e) {}
  }
  function bindAudioUnlockOnce() {
    if (audioUnlockedBound) return;
    audioUnlockedBound = true;
    ['pointerdown', 'pointerup', 'keydown', 'touchstart', 'touchend', 'click'].forEach(function (ev) {
      window.addEventListener(ev, unlockAudio, { capture: true, passive: true });
    });
  }
  function burst(t, dur, type, f0, f1, q, gain, attack) {
    var src = actx.createBufferSource(); src.buffer = noiseBuf;
    var f = actx.createBiquadFilter(); f.type = type; f.Q.value = q;
    f.frequency.setValueAtTime(f0, t);
    f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    var g = actx.createGain(); g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(actx.destination);
    src.start(t, Math.random() * 0.5);
    src.stop(t + dur + 0.02);
  }
  function playPaperFlipSound() {
    if (typeof SoundEngine !== 'undefined' && SoundEngine && SoundEngine.muted) return;
    unlockAudio();
    if (!actx || actx.state !== 'running' || !noiseBuf) return;
    var now = performance.now();
    if (now - lastSnd < 45) return;
    lastSnd = now;
    try {
      var t = actx.currentTime + 0.005, v = 0.55 * (0.85 + Math.random() * 0.3);
      burst(t, 0.17, 'bandpass', 2400, 5200, 0.9, 0.16 * v, 0.018);
      burst(t + 0.02, 0.12, 'highpass', 6000, 7500, 0.7, 0.05 * v, 0.01);
      burst(t + 0.2, 0.07, 'lowpass', 1400, 500, 0.8, 0.30 * v, 0.004);
    } catch (e) {}
  }

  function cleanPlain(s) {
    return String(s || '').replace(/<[^>]*>/g, ' ').replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/[#*_>`\[\]]/g, '').replace(/\s+/g, ' ').trim();
  }

  function formatCardForRolodex(item, idx, total, boardTitle) {
    var card = item && item.raw ? item.raw : item;
    if (!card) {
      return {
        quote: 'Create your first card on this board to start flipping your rotary file.',
        name: 'EMPTY DECK',
        role: 'MINEST',
        company: boardTitle || 'ROLODEX',
        mark: 'ring',
        tab: TAB_COLORS[0]
      };
    }
    var title = cleanPlain(card.title || (item && item.title) || 'Untitled Card');
    var desc = cleanPlain(card.meaning || card.titleZh || card.desc || card.description || (item && item.desc) || '');
    var quote = title;
    if (desc && desc !== title) {
      var combined = title + ' — ' + desc;
      quote = combined.length > 195 ? combined.slice(0, 192) + '…' : combined;
    } else if (Array.isArray(card.checklistItems) && card.checklistItems.length > 0) {
      var steps = card.checklistItems.slice(0, 3).map(function (it) {
        return (it.done ? '✓ ' : '• ') + cleanPlain(it.text || it.title || '');
      }).join('  ');
      var wSteps = title + ' — ' + steps;
      quote = wSteps.length > 195 ? wSteps.slice(0, 192) + '…' : wSteps;
    } else if (Array.isArray(card.stack) && card.stack.length > 0) {
      var subs = card.stack.slice(0, 3).map(function (sc) { return cleanPlain(sc.title || ''); }).filter(Boolean).join(' · ');
      if (subs) {
        var wSubs = title + ' — ' + subs;
        quote = wSubs.length > 195 ? wSubs.slice(0, 192) + '…' : wSubs;
      }
    }

    var colName = cleanPlain(card.columnTitle || (item && item.sub) || 'CARD');
    if (card.complete) colName = '✓ ' + colName;

    var metaParts = [];
    metaParts.push('LV.' + (card.mastery || 1));
    if (Array.isArray(card.checklistItems) && card.checklistItems.length > 0) {
      var done = card.checklistItems.filter(function (i) { return i.done; }).length;
      metaParts.push(done + '/' + card.checklistItems.length + ' STEPS');
    } else if (card.priority) {
      metaParts.push(String(card.priority).toUpperCase());
    } else if (card.date) {
      metaParts.push(String(card.date));
    } else if (boardTitle) {
      metaParts.push(String(boardTitle));
    }

    var explicitTab = null;
    if (card.color && card.color !== '#fbfaf7' && /^#[0-9a-f]{6}$/i.test(card.color)) explicitTab = card.color;
    else if (item && item.color && /^#[0-9a-f]{6}$/i.test(item.color) && item.color !== '#fbfaf7') explicitTab = item.color;

    return {
      quote: quote,
      name: colName,
      role: metaParts[0] || 'CARD',
      company: metaParts.slice(1).join(' · ') || (boardTitle || 'MINEST'),
      mark: MARKS[idx % MARKS.length],
      tab: explicitTab || TAB_COLORS[idx % TAB_COLORS.length]
    };
  }

  function mountEngine(opts) {
    var stage = opts.stageEl;
    var canvas = opts.canvasEl;
    var gripCard = opts.gripCardEl;
    var gripK0 = opts.gripK0El;
    var gripK1 = opts.gripK1El;
    if (!stage || !canvas) return { destroy: function () {}, fit: function () {} };

    bindAudioUnlockOnce();

    var destroyed = false;
    var instance = {
      next: function () {},
      prev: function () {},
      go: function () {},
      fit: function () {},
      setAutoplay: function () {},
      setBackdropMode: function () {},
      destroy: function () { destroyed = true; }
    };

    ensureThree().then(function (THREE) {
      if (destroyed || !stage.isConnected) return;

      var reduced = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };

      var CW = 1.6, BODY = 1.04, TAB = 0.085, TOT = BODY + TAB, R0 = 0.135, THICK = 0.006;
      var RAIL_R = 0.175, RAIL_X = 0.24, LEG_X = 0.9, FOOT_Z = 0.64;
      var FLOOR_C = -(R0 + TOT) - 0.075, TUBE_R = 0.03, FLOOR = FLOOR_C - TUBE_R;
      var GAP = 0.3, FWD = 2.8;
      var KNOB_R = 0.205, KNOB_L = 0.13;

      var rawCards = Array.isArray(opts.cards) && opts.cards.length ? opts.cards : [null];
      var boardTitle = opts.boardTitle || 'Minest';
      var T = rawCards.map(function (c, i) { return formatCardForRolodex(c, i, rawCards.length, boardTitle); });
      var N = T.length;
      var C = N <= 12 ? N * Math.max(2, Math.ceil(24 / N)) : Math.min(28, N);
      if (C % 2 === 1) C += 1;
      var HALF = C / 2;

      var disposables = [];
      var trackGeo = function (g) { disposables.push(g); return g; };
      var trackMat = function (m) { disposables.push(m); return m; };
      var trackTex = function (t) { disposables.push(t); return t; };

      var renderer;
      try {
        renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
      } catch (err) {
        return;
      }
      renderer.setClearColor(0x000000, 0);
      renderer.outputEncoding = THREE.sRGBEncoding;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.0;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.physicallyCorrectLights = false;

      var scene = new THREE.Scene();
      var camera = new THREE.PerspectiveCamera(24, 1, 0.5, 60);
      var V = function (x, y, z) { return new THREE.Vector3(x, y, z); };

      (function buildEnv() {
        var env = new THREE.Scene();
        var eGeos = [], eMats = [];
        var roomG = new THREE.BoxGeometry(24, 12, 24), roomM = new THREE.MeshBasicMaterial({ color: 0x0b0a09, side: THREE.BackSide });
        eGeos.push(roomG); eMats.push(roomM);
        var room = new THREE.Mesh(roomG, roomM); room.position.y = 4; env.add(room);
        var flG = new THREE.PlaneGeometry(24, 24), flM = new THREE.MeshBasicMaterial({ color: 0x050505 });
        eGeos.push(flG); eMats.push(flM);
        var floor = new THREE.Mesh(flG, flM); floor.rotation.x = -Math.PI / 2; floor.position.y = -1.9; env.add(floor);
        var box = function (w, h, c, k, posArr, rotArr) {
          var m = new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(k), side: THREE.DoubleSide });
          var g = new THREE.PlaneGeometry(w, h);
          eGeos.push(g); eMats.push(m);
          var p = new THREE.Mesh(g, m);
          p.position.set(posArr[0], posArr[1], posArr[2]);
          p.rotation.set(rotArr[0], rotArr[1], rotArr[2]);
          env.add(p);
        };
        box(14, 1.0, 0xfff6ea, 7.0, [0, 9.8, 1.6], [Math.PI / 2, 0, 0]);
        box(14, 0.5, 0xfff6ea, 4.5, [0, 9.8, -2.4], [Math.PI / 2, 0, 0]);
        box(1.3, 9, 0xfff3e6, 8.0, [-9.5, 3.5, 3], [0, Math.PI / 2, 0]);
        box(0.7, 9, 0xe8eeff, 4.0, [9.5, 3.5, -1.5], [0, -Math.PI / 2, 0]);
        box(9, 0.6, 0xffffff, 3.2, [0, 1.2, 11.5], [0, Math.PI, 0]);
        box(8, 0.5, 0xfff2e2, 3.0, [0, 2.4, -11.8], [0, 0, 0]);
        box(5, 0.35, 0xf3eadc, 1.6, [2, -1.85, 5], [-Math.PI / 2, 0, 0]);
        var pm = new THREE.PMREMGenerator(renderer);
        var rt = pm.fromScene(env, 0.035);
        scene.environment = rt.texture;
        disposables.push(rt);
        pm.dispose();
        eGeos.forEach(function (g) { g.dispose(); });
        eMats.forEach(function (m) { m.dispose(); });
      })();

      var hemi = new THREE.HemisphereLight(0xfffaf2, 0x8b8273, 0.62);
      scene.add(hemi);
      var key = new THREE.DirectionalLight(0xfff4e6, 2.1);
      key.position.set(-2.4, 4.6, 3.1);
      key.castShadow = true;
      key.shadow.mapSize.set(2048, 2048);
      Object.assign(key.shadow.camera, { left: -2.6, right: 2.6, top: 2.6, bottom: -2.6, near: 1, far: 12 });
      key.shadow.radius = 3.2;
      key.shadow.bias = -0.0005;
      key.shadow.normalBias = 0.012;
      scene.add(key);
      var fill = new THREE.DirectionalLight(0xe6ecfa, 0.35);
      fill.position.set(3, 1.2, 2.5);
      scene.add(fill);

      var chrome = trackMat(new THREE.MeshStandardMaterial({ color: 0xf2f0ec, metalness: 1, roughness: 0.07, envMapIntensity: 1.35 }));
      var knobMat = trackMat(new THREE.MeshStandardMaterial({ color: 0x050505, metalness: 0, roughness: 0.3, envMapIntensity: 1.0 }));
      var knobFace = trackMat(new THREE.MeshStandardMaterial({ color: 0x040404, metalness: 0, roughness: 0.2, envMapIntensity: 1.0 }));
      var hubMat = trackMat(new THREE.MeshStandardMaterial({ color: 0x060505, metalness: 0, roughness: 0.26, envMapIntensity: 1.0 }));

      var rig = new THREE.Group();
      scene.add(rig);

      function roundedPath(pts, r) {
        var path = new THREE.CurvePath(), prev = pts[0].clone();
        for (var i = 1; i < pts.length - 1; i++) {
          var a = pts[i - 1], b = pts[i], c = pts[i + 1];
          var ab = b.clone().sub(a), bc = c.clone().sub(b);
          var rrLen = Math.min(r, ab.length() * 0.45, bc.length() * 0.45);
          var p1 = b.clone().sub(ab.normalize().multiplyScalar(rrLen));
          var p2 = b.clone().add(bc.normalize().multiplyScalar(rrLen));
          path.add(new THREE.LineCurve3(prev, p1));
          path.add(new THREE.QuadraticBezierCurve3(p1, b.clone(), p2));
          prev = p2;
        }
        path.add(new THREE.LineCurve3(prev, pts[pts.length - 1].clone()));
        return path;
      }

      [FOOT_Z, -FOOT_Z].forEach(function (zf) {
        var path = roundedPath([V(-LEG_X, 0, 0), V(-LEG_X, FLOOR_C, zf), V(LEG_X, FLOOR_C, zf), V(LEG_X, 0, 0)], 0.2);
        var tube = new THREE.Mesh(trackGeo(new THREE.TubeGeometry(path, 360, TUBE_R, 24, false)), chrome);
        tube.castShadow = true; tube.receiveShadow = true;
        rig.add(tube);
      });

      var xCyl = function (r, len, x, mat, seg) {
        var g = trackGeo(new THREE.CylinderGeometry(r, r, len, seg || 48));
        g.rotateZ(Math.PI / 2);
        var m = new THREE.Mesh(g, mat);
        m.position.x = x; m.castShadow = true; m.receiveShadow = true;
        rig.add(m);
        return m;
      };
      xCyl(0.022, 2 * LEG_X + 0.06, 0, chrome);
      var hubMesh = xCyl(0.112, 2 * 0.79, 0, hubMat, 64);
      [-1, 1].forEach(function (s) {
        xCyl(0.125, 0.02, s * 0.8, chrome, 64);
        var ball = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.046, 32, 16)), chrome);
        ball.position.x = s * LEG_X; ball.castShadow = true;
        rig.add(ball);
        xCyl(0.05, 0.07, s * (LEG_X + 0.045), chrome);
      });
      [-1, 1].forEach(function (s) {
        var g = trackGeo(new THREE.TorusGeometry(RAIL_R, 0.0085, 10, 128));
        g.rotateY(Math.PI / 2);
        var m = new THREE.Mesh(g, chrome);
        m.position.x = s * RAIL_X; m.castShadow = true;
        rig.add(m);
      });

      function knobGeometry() {
        var g = trackGeo(new THREE.CylinderGeometry(KNOB_R, KNOB_R, KNOB_L, 360, 6, false));
        var p = g.attributes.position;
        for (var i = 0; i < p.count; i++) {
          var x = p.getX(i), z = p.getZ(i), y = p.getY(i), r = Math.hypot(x, z);
          if (r < KNOB_R * 0.6) continue;
          var a = Math.atan2(z, x);
          var groove = Math.pow(Math.max(0, Math.cos(a * 54)), 4) * 0.009;
          var edge = Math.abs(y) / (KNOB_L / 2);
          var ch = Math.max(0, edge - 0.72) / 0.28;
          var k = (r - groove - ch * ch * 0.016) / r;
          p.setX(i, x * k); p.setZ(i, z * k);
        }
        g.computeVertexNormals();
        g.rotateZ(Math.PI / 2);
        return g;
      }
      var kg = knobGeometry();
      var knobs = [];
      [-1, 1].forEach(function (s) {
        var grp = new THREE.Group();
        grp.position.x = s * (LEG_X + 0.08 + KNOB_L / 2);
        var k = new THREE.Mesh(kg, knobMat);
        k.castShadow = true; k.receiveShadow = true; k.userData.knob = true; grp.add(k);
        var fg = trackGeo(new THREE.CylinderGeometry(KNOB_R * 0.78, KNOB_R * 0.8, 0.012, 96));
        fg.rotateZ(Math.PI / 2);
        var f = new THREE.Mesh(fg, knobFace);
        f.position.x = s * (KNOB_L / 2 + 0.002); f.userData.knob = true; grp.add(f);
        var capg = trackGeo(new THREE.CylinderGeometry(0.03, 0.03, 0.012, 32));
        capg.rotateZ(Math.PI / 2);
        var cap = new THREE.Mesh(capg, chrome);
        cap.position.x = s * (KNOB_L / 2 + 0.009); grp.add(cap);
        rig.add(grp);
        knobs.push(grp);
      });

      var shadowMat = trackMat(new THREE.ShadowMaterial({ color: 0x3a2e20, opacity: 0.24 }));
      var floorMesh = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(14, 14)), shadowMat);
      floorMesh.rotation.x = -Math.PI / 2; floorMesh.position.y = FLOOR; floorMesh.receiveShadow = true;
      scene.add(floorMesh);

      var blobCanvas = document.createElement('canvas');
      blobCanvas.width = blobCanvas.height = 128;
      var bctx = blobCanvas.getContext('2d');
      var bg = bctx.createRadialGradient(64, 64, 0, 64, 64, 64);
      bg.addColorStop(0, 'rgba(0,0,0,1)');
      bg.addColorStop(0.45, 'rgba(0,0,0,.45)');
      bg.addColorStop(1, 'rgba(0,0,0,0)');
      bctx.fillStyle = bg; bctx.fillRect(0, 0, 128, 128);
      var blob = trackTex(new THREE.CanvasTexture(blobCanvas));

      var contactMats = [];
      var contact = function (w, d, x, z, op) {
        var cm = trackMat(new THREE.MeshBasicMaterial({ color: 0x2a2116, alphaMap: blob, transparent: true, opacity: op, depthWrite: false }));
        cm.userData.baseOp = op;
        contactMats.push(cm);
        var m = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(w, d)), cm);
        m.rotation.x = -Math.PI / 2; m.position.set(x, FLOOR + 0.002, z); m.renderOrder = -1;
        scene.add(m);
      };
      contact(3.0, 2.1, 0.12, -0.05, 0.26);
      contact(1.9, 0.7, 0, 0.02, 0.3);
      [FOOT_Z, -FOOT_Z].forEach(function (zf) { contact(2.1, 0.1, 0, zf, 0.55); });
      [-1, 1].forEach(function (s) {
        [FOOT_Z, -FOOT_Z].forEach(function (zf) { contact(0.18, 0.18, s * (LEG_X - 0.12), zf, 0.35); });
      });

      function applyBackdropTuning(modeStr) {
        var isDarkStage = (modeStr === 'stage-dark');
        shadowMat.color.setHex(isDarkStage ? 0x020408 : 0x3a2e20);
        shadowMat.opacity = isDarkStage ? 0.42 : 0.24;
        contactMats.forEach(function (cm) {
          cm.color.setHex(isDarkStage ? 0x000000 : 0x2a2116);
          cm.opacity = cm.userData.baseOp * (isDarkStage ? 1.35 : 1.0);
        });
        hemi.intensity = isDarkStage ? 0.72 : 0.62;
        fill.intensity = isDarkStage ? 0.48 : 0.35;
      }
      applyBackdropTuning(opts.backdropMode || 'paper');

      var frontGeo = trackGeo(new THREE.PlaneGeometry(CW, TOT, 1, 28));
      frontGeo.translate(0, R0 + TOT / 2, THICK / 2);
      var backGeo = trackGeo(new THREE.PlaneGeometry(CW, TOT, 1, 28));
      backGeo.rotateY(Math.PI);
      backGeo.translate(0, R0 + TOT / 2, -THICK / 2);
      var U_R0 = { value: R0 }, U_H = { value: TOT };

      function makeCardMaterial() {
        var m = new THREE.MeshStandardMaterial({ roughness: 0.88, metalness: 0, alphaTest: 0.5, envMapIntensity: 0.55 });
        m.userData.uBend = { value: 0 };
        m.userData.uAO = { value: 0 };
        m.onBeforeCompile = function (sh) {
          sh.uniforms.uBend = m.userData.uBend;
          sh.uniforms.uAO = m.userData.uAO;
          sh.uniforms.uR0 = U_R0;
          sh.uniforms.uH = U_H;
          sh.fragmentShader = 'uniform float uAO;\nvarying float vBt;\n' + sh.fragmentShader.replace('#include <map_fragment>',
            '#include <map_fragment>\n' +
            'float occ = uAO * (0.42 + 0.58 * pow(1.0 - vBt, 1.6));\n' +
            'diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(0.40, 0.33, 0.25), occ);'
          );
          sh.vertexShader = 'uniform float uBend;\nuniform float uR0;\nuniform float uH;\nvarying float vBt;\n' + sh.vertexShader
            .replace('#include <beginnormal_vertex>',
              '#include <beginnormal_vertex>\n' +
              'float bt = clamp((position.y - uR0) / uH, 0.0, 1.0); vBt = bt;\n' +
              'objectNormal.y -= objectNormal.z * 2.0 * uBend * bt;\n' +
              'objectNormal = normalize(objectNormal);'
            )
            .replace('#include <begin_vertex>',
              '#include <begin_vertex>\n' +
              'transformed.z += uBend * bt * bt * uH;\n' +
              'transformed.y -= 0.66 * uBend * uBend * bt * bt * bt * uH;'
            );
        };
        return m;
      }

      var mobile = false, cardCssW = 400, TEXK = 3, curTexW = 1024, curQuotePx = 60;

      function drawCard(i, texW, quoteTexPx, back) {
        var t = T[i] || T[0];
        var s = texW / 1400, texH = Math.round(texW * TOT / CW), tabH = Math.round(texH * TAB / TOT);
        var c = document.createElement('canvas'); c.width = texW; c.height = texH;
        var ctx = c.getContext('2d'), R = rng(1013 + i * 97 + (back ? 7 : 0));
        var tr = tabRect(i, texW, s, back), tx = tr[0], tw = tr[1];
        var shape = function () {
          ctx.beginPath();
          rr(ctx, 0, tabH, texW, texH - tabH, 12 * s);
          rr(ctx, tx, 0, tw, tabH + 30 * s, 14 * s);
        };
        ctx.save(); shape(); ctx.clip();

        ctx.fillStyle = back ? '#ece1ca' : '#f1e6d0';
        ctx.fillRect(0, 0, texW, texH);
        for (var k = 0; k < 7; k++) {
          var gx = R() * texW, gy = R() * texH, gr = (160 + R() * 360) * s;
          var g = ctx.createRadialGradient(gx, gy, 0, gx, gy, gr);
          var ga = 0.025 + R() * 0.035;
          g.addColorStop(0, 'rgba(196,168,120,' + ga + ')');
          g.addColorStop(1, 'rgba(196,168,120,0)');
          ctx.fillStyle = g; ctx.fillRect(0, 0, texW, texH);
        }
        ctx.lineCap = 'round';
        for (var fIdx = 0; fIdx < 2000; fIdx++) {
          var fx = R() * texW, fy = R() * texH, fl = (3 + R() * 12) * s, fa = R() * Math.PI;
          ctx.strokeStyle = R() < 0.5 ? ('rgba(120,98,66,' + (0.03 + R() * 0.05) + ')') : ('rgba(255,252,244,' + (0.05 + R() * 0.08) + ')');
          ctx.lineWidth = (0.6 + R() * 1.1) * s;
          ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(fx + Math.cos(fa) * fl, fy + Math.sin(fa) * fl); ctx.stroke();
        }
        for (var sp = 0; sp < 120; sp++) {
          ctx.fillStyle = 'rgba(90,70,45,' + (0.05 + R() * 0.12) + ')';
          ctx.beginPath(); ctx.arc(R() * texW, R() * texH, (0.5 + R() * 1.6) * s, 0, 7); ctx.fill();
        }
        var edge = 34 * s;
        [[0, 0, edge, 0], [texW, 0, texW - edge, 0], [0, texH, 0, texH - edge], [0, tabH, 0, tabH + edge]].forEach(function (ed) {
          var eg = ctx.createLinearGradient(ed[0], ed[1], ed[2], ed[3]);
          eg.addColorStop(0, 'rgba(150,118,72,.16)');
          eg.addColorStop(1, 'rgba(150,118,72,0)');
          ctx.fillStyle = eg; ctx.fillRect(0, 0, texW, texH);
        });
        ctx.strokeStyle = 'rgba(122,96,60,.32)';
        ctx.lineWidth = 5 * s;
        shape(); ctx.stroke();

        var col = t.tab || TAB_COLORS[i % TAB_COLORS.length];
        ctx.fillStyle = col;
        ctx.beginPath(); rr(ctx, tx, 0, tw, tabH + 30 * s, 14 * s); ctx.fill();
        var tg = ctx.createLinearGradient(0, 0, 0, tabH + 30 * s);
        tg.addColorStop(0, 'rgba(255,255,255,.28)');
        tg.addColorStop(0.35, 'rgba(255,255,255,0)');
        tg.addColorStop(1, 'rgba(0,0,0,.10)');
        ctx.fillStyle = tg; ctx.fill();
        ctx.font = '500 ' + Math.round(Math.min(tabH * 0.56, 10.5 * TEXK)) + 'px "JetBrains Mono", ui-monospace, monospace';
        ctx.fillStyle = 'rgba(24,20,16,.84)';
        ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
        ctx.fillText(pad(i + 1), tx + tw / 2, tabH * 0.55);
        ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';

        var M = (mobile ? 78 : 104) * s, redY = tabH + (mobile ? 60 : 74) * s;
        var np = (mobile ? 10 : 11.5) * TEXK, rp = (mobile ? 9 : 10.5) * TEXK;
        var roleY = texH - (mobile ? 84 : 96) * s, nameY = roleY - rp * 1.75, footTop = nameY - np - 34 * s;

        var fpx = quoteTexPx, lines = [''], lh = fpx * 1.4;
        var sansStack = '"Switzer", "DM Sans", -apple-system, "PingFang SC", "Noto Sans SC", sans-serif';
        var monoStack = '"JetBrains Mono", ui-monospace, "PingFang SC", "Noto Sans SC", monospace';
        for (var guard = 0; guard < 40; guard++) {
          ctx.font = '400 ' + Math.round(fpx) + 'px ' + sansStack;
          lh = fpx * (mobile ? 1.38 : 1.44);
          lines = wrapMultilingual(ctx, t.quote, texW - 2 * M);
          if (Math.floor((footTop - redY - lh * 0.15) / lh) >= lines.length) break;
          fpx *= 0.94;
        }
        ctx.strokeStyle = back ? 'rgba(196,84,72,.32)' : 'rgba(196,84,72,.58)';
        ctx.lineWidth = 2.6 * s;
        ctx.beginPath(); ctx.moveTo(0, redY); ctx.lineTo(texW, redY); ctx.stroke();
        ctx.strokeStyle = back ? 'rgba(92,128,170,.18)' : 'rgba(84,120,166,.40)';
        ctx.lineWidth = 1.8 * s;
        for (var ry = redY + lh; ry < footTop - lh * 0.1; ry += lh) {
          ctx.beginPath(); ctx.moveTo(0, ry); ctx.lineTo(texW, ry); ctx.stroke();
        }

        if (!back) {
          ctx.fillStyle = '#211d18';
          ctx.font = '400 ' + Math.round(fpx) + 'px ' + sansStack;
          var open = '“', ow = ctx.measureText(open).width;
          lines.forEach(function (ln, kIdx) {
            var ly = redY + lh * (kIdx + 1) - lh * 0.2;
            if (kIdx === 0) ctx.fillText(open, M - ow, ly);
            ctx.fillText(kIdx === lines.length - 1 ? ln + '”' : ln, M, ly);
          });
          var ms = Math.max(60 * s, np * 1.9), maxW = texW - 2 * M - ms - 24 * s;
          var fitText = function (txt, px, wt) {
            var f = px;
            for (var gIdx = 0; gIdx < 14; gIdx++) {
              ctx.font = wt + ' ' + Math.round(f) + 'px ' + monoStack;
              if (ctx.measureText(txt).width <= maxW) break;
              f *= 0.93;
            }
          };
          var nmTxt = String(t.name || '').toUpperCase();
          var rlTxt = (String(t.role || '') + (t.company ? ' · ' + String(t.company) : '')).toUpperCase();
          ctx.fillStyle = '#211d18';
          fitText(nmTxt, np, 500);
          ctx.fillText(nmTxt, M, nameY);
          ctx.fillStyle = 'rgba(46,40,33,.72)';
          fitText(rlTxt, rp, 500);
          ctx.fillText(rlTxt, M, roleY);
          ctx.strokeStyle = 'rgba(33,29,24,.18)';
          ctx.lineWidth = 1.6 * s;
          ctx.beginPath(); ctx.moveTo(M, footTop + 8 * s); ctx.lineTo(texW - M, footTop + 8 * s); ctx.stroke();
          drawMark(ctx, t.mark || MARKS[i % 6], texW - M - ms / 2, (nameY + roleY) / 2 - np * 0.35, ms, '#211d18');
        }
        ctx.restore();

        var holeY = texH - (RAIL_R - R0) / TOT * texH;
        ctx.globalCompositeOperation = 'destination-out';
        [-1, 1].forEach(function (sx) {
          var hx = texW / 2 + sx * RAIL_X / CW * texW;
          ctx.beginPath(); ctx.arc(hx, holeY, 22 * s, 0, 7); ctx.fill();
          ctx.fillRect(hx - 9 * s, holeY, 18 * s, texH - holeY + 2);
        });
        ctx.globalCompositeOperation = 'source-over';
        [-1, 1].forEach(function (sx) {
          var hx = texW / 2 + sx * RAIL_X / CW * texW;
          ctx.strokeStyle = 'rgba(110,86,52,.28)';
          ctx.lineWidth = 2.5 * s;
          ctx.beginPath(); ctx.arc(hx, holeY, 23.5 * s, Math.PI * 0.62, Math.PI * 2.38); ctx.stroke();
        });

        var tex = new THREE.CanvasTexture(c);
        tex.encoding = THREE.sRGBEncoding;
        tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
        tex.minFilter = THREE.LinearMipmapLinearFilter;
        return tex;
      }

      var texCache = new Map();
      var texSig = '';
      function clearTexCache() {
        texCache.forEach(function (s) {
          s.front.dispose(); s.back.dispose(); s.df.dispose(); s.db.dispose();
        });
        texCache.clear();
      }
      function getTexSet(cardIdx) {
        var idx = mod(cardIdx, N);
        if (texCache.has(idx)) {
          var hit = texCache.get(idx);
          texCache.delete(idx);
          texCache.set(idx, hit);
          return hit;
        }
        if (texCache.size >= 36) {
          var oldestKey = texCache.keys().next().value;
          var oldest = texCache.get(oldestKey);
          texCache.delete(oldestKey);
          if (oldest) { oldest.front.dispose(); oldest.back.dispose(); oldest.df.dispose(); oldest.db.dispose(); }
        }
        var front = drawCard(idx, curTexW, curQuotePx, false);
        var back = drawCard(idx, Math.round(curTexW * 0.45), curQuotePx * 0.45, true);
        var df = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: front, alphaTest: 0.5 });
        var db = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: back, alphaTest: 0.5 });
        var entry = { front: front, back: back, df: df, db: db };
        texCache.set(idx, entry);
        return entry;
      }

      var cardSlots = [];
      var pickables = [];
      knobs.forEach(function (grp) {
        grp.traverse(function (o) { if (o.isMesh && o.userData.knob) pickables.push(o); });
      });
      pickables.push(hubMesh);

      function rebuildDrumSlots(newC) {
        cardSlots.forEach(function (cs) {
          rig.remove(cs.g);
          var fi = pickables.indexOf(cs.f); if (fi >= 0) pickables.splice(fi, 1);
          var bi = pickables.indexOf(cs.b); if (bi >= 0) pickables.splice(bi, 1);
          cs.fm.dispose(); cs.bm.dispose();
        });
        cardSlots = [];
        C = newC;
        HALF = C / 2;
        for (var j = 0; j < C; j++) {
          var g = new THREE.Group(); g.userData.j = j;
          var fm = makeCardMaterial(), bm = makeCardMaterial();
          var tint = 0.92 + 0.08 * ((j * 0.6180339) % 1);
          fm.color.setScalar(tint); bm.color.setScalar(tint * 0.9);
          var f = new THREE.Mesh(frontGeo, fm), b = new THREE.Mesh(backGeo, bm);
          f.castShadow = true; f.receiveShadow = true; f.userData.card = j;
          b.castShadow = true; b.receiveShadow = true; b.userData.card = j;
          g.add(f); g.add(b);
          rig.add(g);
          pickables.push(f, b);
          var jr = rng(4099 + j * 31);
          cardSlots.push({
            g: g, f: f, b: b, fm: fm, bm: bm,
            assignedIdx: -1, prev: null, bend: 0,
            jz: (jr() - 0.5) * 0.045, jx: (jr() - 0.5) * 0.024
          });
        }
      }
      rebuildDrumSlots(C);

      function assignSlotTexture(cs, cardIdx) {
        var idx = mod(cardIdx, N);
        if (cs.assignedIdx === idx && cs.fm.map) return;
        cs.assignedIdx = idx;
        var s = getTexSet(idx);
        cs.fm.map = s.front; cs.bm.map = s.back;
        cs.fm.needsUpdate = cs.bm.needsUpdate = true;
        cs.f.customDepthMaterial = s.df;
        cs.b.customDepthMaterial = s.db;
      }

      function fan(d) {
        if (d >= 0) {
          if (d <= 1) return -GAP * (d * (2 - d) * 0.35 + d * 0.65);
          return -(GAP + (Math.PI - 0.12 - GAP) * Math.pow((d - 1) / (HALF - 1), 1.55));
        }
        var u = -d;
        if (u <= 1) return FWD * Math.pow(u, 1.55);
        return FWD + (Math.PI + 0.12 - FWD) * Math.pow((u - 1) / (HALF - 1), 0.8);
      }

      var startIdx = mod(opts.initialIndex || 0, N);
      var pos = startIdx, vel = 0, target = startIdx;

      function layout(dt) {
        var busy = false;
        for (var i = 0; i < cardSlots.length; i++) {
          var c = cardSlots[i];
          var d = mod(c.g.userData.j - pos, C);
          if (d >= HALF) d -= C;
          var logicalStep = Math.round(pos + d);
          assignSlotTexture(c, logicalStep);

          var a = fan(d);
          if (c.prev !== null && dt > 0) {
            var da = a - c.prev;
            if (da > Math.PI) da -= 2 * Math.PI;
            if (da < -Math.PI) da += 2 * Math.PI;
            var w = da / dt;
            var want = Math.max(-0.16, Math.min(0.16, -w * 0.016));
            c.bend += (want - c.bend) * Math.min(1, dt * 16);
          } else if (dt > 0) {
            c.bend *= Math.max(0, 1 - dt * 16);
          }
          if (Math.abs(c.bend) < 1e-4) c.bend = 0; else busy = true;
          c.prev = a;
          c.g.rotation.x = a;
          var loose = Math.min(1, Math.max(0, Math.abs(d) - 0.6) / 1.4);
          c.g.rotation.z = c.jz * loose;
          c.g.position.x = c.jx * loose;
          var aa = Math.abs(a), ao = Math.pow(Math.min(1, Math.max(0, (aa - 1.0) / 1.7)), 0.7);
          c.fm.userData.uAO.value = c.bm.userData.uAO.value = ao;
          c.fm.userData.uBend.value = c.bm.userData.uBend.value = c.bend + 0.012;
        }
        for (var ki = 0; ki < knobs.length; ki++) {
          knobs[ki].rotation.x = pos * (Math.PI * 2 / C) * 1.6;
        }
        return busy;
      }

      var envFull = [], envPhone = [];
      [[envFull, LEG_X + 0.08 + KNOB_L], [envPhone, LEG_X + 0.11]].forEach(function (pair) {
        var arr = pair[0], xe = pair[1];
        [-xe, xe].forEach(function (x) {
          [FLOOR, R0 + TOT + 0.02].forEach(function (y) {
            [-(R0 + TOT) * 0.98, FOOT_Z + 0.08].forEach(function (z) { arr.push(V(x, y, z)); });
          });
        });
      });

      function placeGrips(w, h) {
        if (!gripCard || !gripK0 || !gripK1) return;
        var p = new THREE.Vector3();
        var rect = function (el, pts) {
          var x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
          pts.forEach(function (q) {
            p.copy(q).project(camera);
            var x = (p.x + 1) / 2 * w, y = (1 - p.y) / 2 * h;
            x0 = Math.min(x0, x); x1 = Math.max(x1, x);
            y0 = Math.min(y0, y); y1 = Math.max(y1, y);
          });
          var MIN = 44;
          if (x1 - x0 < MIN) { var cx = (x0 + x1) / 2; x0 = cx - MIN / 2; x1 = cx + MIN / 2; }
          if (y1 - y0 < MIN) { var cy = (y0 + y1) / 2; y0 = cy - MIN / 2; y1 = cy + MIN / 2; }
          x0 = Math.max(0, x0); x1 = Math.min(w, x1);
          y0 = Math.max(0, y0); y1 = Math.min(h, y1);
          Object.assign(el.style, { left: x0 + 'px', top: y0 + 'px', width: (x1 - x0) + 'px', height: (y1 - y0) + 'px' });
        };
        rect(gripCard, [V(-CW / 2, R0 + 0.12, 0), V(CW / 2, R0 + 0.12, 0), V(-CW / 2, R0 + TOT, 0), V(CW / 2, R0 + TOT, 0)]);
        knobs.forEach(function (k, i) {
          var kx = k.position.x, pts = [];
          [-KNOB_L, KNOB_L].forEach(function (dx) {
            [-1, 1].forEach(function (dy) {
              [-1, 1].forEach(function (dz) { pts.push(V(kx + dx / 2, dy * KNOB_R * 1.15, dz * KNOB_R)); });
            });
          });
          rect(i === 0 ? gripK0 : gripK1, pts);
        });
      }

      function fit(forceRebuild) {
        var w = Math.max(240, stage.clientWidth || 640);
        var h = Math.max(240, stage.clientHeight || 480);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        mobile = w < 620;
        var env = mobile ? envPhone : envFull;
        var yaw = (mobile ? 9 : 19) * Math.PI / 180, pitch = (mobile ? 10 : 12.5) * Math.PI / 180;
        var dir = V(-Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch));
        var tgt = V(0, -0.02, -0.1), mx = mobile ? 1.0 : 0.95, my = mobile ? 0.93 : 0.95;
        var p = new THREE.Vector3();
        var place = function (dist) {
          camera.position.copy(tgt).addScaledVector(dir, dist);
          camera.lookAt(tgt);
          camera.updateMatrixWorld();
          camera.updateProjectionMatrix();
        };
        var box = function () {
          var x0 = 9, x1 = -9, y0 = 9, y1 = -9;
          env.forEach(function (e) {
            p.copy(e).project(camera);
            x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x);
            y0 = Math.min(y0, p.y); y1 = Math.max(y1, p.y);
          });
          return [x0, x1, y0, y1];
        };
        for (var it = 0; it < 3; it++) {
          var lo = 2, hi = 60;
          for (var k = 0; k < 30; k++) {
            var m = (lo + hi) / 2; place(m);
            var b0 = box();
            if (Math.max(-b0[0], b0[1]) <= mx && Math.max(-b0[2], b0[3]) <= my) hi = m; else lo = m;
          }
          place(hi);
          var b1 = box(), dist = hi, hh = dist * Math.tan(camera.fov * Math.PI / 360), hw = hh * camera.aspect;
          var right = V(1, 0, 0).applyQuaternion(camera.quaternion);
          var up = V(0, 1, 0).applyQuaternion(camera.quaternion);
          tgt.addScaledVector(right, (b1[0] + b1[1]) / 2 * hw).addScaledVector(up, (b1[2] + b1[3]) / 2 * hh);
        }
        var pa = V(-CW / 2, R0 + TOT * 0.5, 0).project(camera), pb = V(CW / 2, R0 + TOT * 0.5, 0).project(camera);
        cardCssW = Math.max(160, Math.abs(pb.x - pa.x) / 2 * w);
        var dpr = renderer.getPixelRatio();
        var texW = Math.max(768, Math.min(2048, Math.round(cardCssW * dpr * 1.2 / 128) * 128));
        var cssQuote = mobile ? Math.max(15, Math.min(17, cardCssW * 0.055)) : Math.max(19.5, Math.min(22, cardCssW * 0.056));
        TEXK = texW / cardCssW;
        curTexW = texW;
        curQuotePx = cssQuote * TEXK;
        var sig = texW + '|' + Math.round(curQuotePx) + '|' + mobile;
        if (forceRebuild || sig !== texSig) {
          texSig = sig;
          clearTexCache();
          cardSlots.forEach(function (cs) { cs.assignedIdx = -1; });
        }
        placeGrips(w, h);
      }

      var K = 62, DAMP = 2 * Math.sqrt(K) * 0.48;
      var running = false, rafId = 0, last = 0, dragging = null, lastRound = Math.round(pos);
      var shown = -1;

      function notifyIndex(idx) {
        var cleanIdx = mod(idx, N);
        if (cleanIdx === shown) return;
        shown = cleanIdx;
        if (typeof opts.onIndexChange === 'function') opts.onIndexChange(cleanIdx);
      }

      function triggerHapticTick(touch) {
        if (window.MinestNative && typeof window.MinestNative.haptic === 'function') {
          try { window.MinestNative.haptic('light', false); } catch (e) {}
        } else if (touch && navigator.vibrate) {
          try { navigator.vibrate(6); } catch (e) {}
        }
      }

      function kick() {
        if (!running && !destroyed) {
          running = true;
          last = performance.now();
          rafId = requestAnimationFrame(tick);
        }
      }
      function tick(now) {
        if (destroyed) { running = false; return; }
        var dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
        last = now;
        var moving = !!dragging;
        if (!dragging) {
          if (reduced.matches) {
            pos = target; vel = 0;
          } else {
            vel += (K * (target - pos) - DAMP * vel) * dt;
            pos += vel * dt;
            if (Math.abs(target - pos) < 2e-4 && Math.abs(vel) < 2e-3) {
              pos = target; vel = 0;
            } else {
              moving = true;
            }
          }
        }
        var r = Math.round(pos);
        if (r !== lastRound) {
          lastRound = r;
          playPaperFlipSound();
          if (dragging) {
            notifyIndex(mod(r, N));
            triggerHapticTick(dragging.touch);
          }
        }
        var busy = layout(reduced.matches ? 0 : dt);
        renderer.render(scene, camera);
        if (moving || busy) rafId = requestAnimationFrame(tick);
        else running = false;
      }

      function commit(newTarget) {
        target = newTarget;
        kick();
        notifyIndex(mod(Math.round(target), N));
      }

      var ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
      function pick(e) {
        var r = canvas.getBoundingClientRect();
        if (!r.width || !r.height) return null;
        ndc.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
        ray.setFromCamera(ndc, camera);
        var h = ray.intersectObjects(pickables, false)[0];
        return h ? (h.object.userData.knob ? 'knob' : 'card') : null;
      }
      function pxPerCard() { return Math.max(60, cardCssW * 0.3); }
      var _kc = new THREE.Vector3(), _ke = new THREE.Vector3();
      function knobPxPerCard() {
        var r = canvas.getBoundingClientRect();
        knobs[0].getWorldPosition(_kc);
        _ke.copy(_kc); _ke.y += KNOB_R;
        _kc.project(camera); _ke.project(camera);
        var pxPerUnit = Math.hypot((_ke.x - _kc.x) / 2 * r.width, (_ke.y - _kc.y) / 2 * r.height) / KNOB_R;
        return Math.max(22, KNOB_R * (Math.PI * 2 / C) * 1.6 * pxPerUnit);
      }

      var autoplayMs = opts.autoplay ? 2800 : 0;
      var autoT = 0, inView = true, hovered = false;
      function autoPaused() {
        return !autoplayMs || reduced.matches || dragging || hovered || document.hidden || !inView;
      }
      function schedule() {
        clearTimeout(autoT);
        if (destroyed || autoPaused()) return;
        autoT = setTimeout(function () {
          if (!destroyed && !autoPaused()) commit(target + 1);
          schedule();
        }, autoplayMs);
      }

      var lastCardTap = 0;
      function startDrag(e, what, el) {
        e.stopPropagation();
        clearTimeout(autoT);
        try { stage.focus({ preventScroll: true }); } catch (_) {}
        dragging = {
          what: what, el: el, y0: e.clientY, p0: pos,
          t: performance.now(), y: e.clientY, v: 0, moved: 0,
          touch: e.pointerType === 'touch',
          ppc: what === 'knob' ? knobPxPerCard() : pxPerCard()
        };
        vel = 0;
        try { el.setPointerCapture(e.pointerId); } catch (_) {}
        canvas.className = 'drag';
        kick();
      }
      function moveDrag(e) {
        if (!dragging) return;
        e.stopPropagation();
        var now = performance.now(), dy = e.clientY - dragging.y, dtt = Math.max(1, now - dragging.t) / 1000;
        dragging.v = dragging.v * 0.6 + (dy / dragging.ppc / dtt) * 0.4;
        dragging.y = e.clientY; dragging.t = now;
        dragging.moved = Math.max(dragging.moved, Math.abs(e.clientY - dragging.y0));
        pos = dragging.p0 + (e.clientY - dragging.y0) / dragging.ppc;
        kick();
      }
      function endDrag() {
        if (!dragging) return;
        var d = dragging; dragging = null; canvas.className = 'grab';
        if (performance.now() - d.t > 90) d.v = 0;
        if (d.moved < 6) {
          pos = d.p0;
          var now = performance.now();
          if (d.what === 'card' && now - lastCardTap < 330 && typeof opts.onOpenActive === 'function') {
            lastCardTap = 0;
            opts.onOpenActive(mod(Math.round(target), N));
            return;
          }
          lastCardTap = now;
          commit(target + 1);
          schedule();
          return;
        }
        var knob = d.what === 'knob', base = Math.round(d.p0);
        var tg = Math.round(pos + d.v * (knob ? 0.3 : 0.16));
        var span = knob ? Math.min(18, 3 * N) : 4;
        tg = Math.max(base - span, Math.min(base + span, tg));
        if (tg === base && Math.abs(pos - d.p0) > 0.22) tg = base + Math.sign(pos - d.p0);
        vel = d.v * 0.4;
        commit(tg);
        schedule();
      }

      var onCanvasDown = function (e) {
        if (e.button !== 0 || e.pointerType === 'touch') return;
        var what = pick(e);
        if (what) startDrag(e, what, canvas);
      };
      var onCanvasMove = function (e) {
        if (dragging) { if (dragging.el === canvas) moveDrag(e); return; }
        if (e.pointerType === 'touch') return;
        var w = pick(e);
        canvas.className = w === 'knob' ? 'turn' : (w ? 'grab' : '');
      };
      var onCanvasEnter = function () { hovered = true; schedule(); };
      var onCanvasLeave = function () { hovered = false; schedule(); };

      canvas.addEventListener('pointerdown', onCanvasDown);
      canvas.addEventListener('pointermove', onCanvasMove);
      canvas.addEventListener('pointerup', endDrag);
      canvas.addEventListener('pointercancel', endDrag);
      canvas.addEventListener('pointerenter', onCanvasEnter);
      canvas.addEventListener('pointerleave', onCanvasLeave);

      var gripEntries = [['card', gripCard], ['k0', gripK0], ['k1', gripK1]];
      var gripCleanups = [];
      gripEntries.forEach(function (pair) {
        var keyName = pair[0], el = pair[1];
        if (!el) return;
        var gd = function (e) { startDrag(e, keyName === 'card' ? 'card' : 'knob', el); };
        var gm = function (e) { if (dragging && dragging.el === el) moveDrag(e); };
        el.addEventListener('pointerdown', gd);
        el.addEventListener('pointermove', gm);
        el.addEventListener('pointerup', endDrag);
        el.addEventListener('pointercancel', endDrag);
        gripCleanups.push(function () {
          el.removeEventListener('pointerdown', gd);
          el.removeEventListener('pointermove', gm);
          el.removeEventListener('pointerup', endDrag);
          el.removeEventListener('pointercancel', endDrag);
        });
      });

      var wheelAcc = 0, wheelT = 0;
      var onWheel = function (e) {
        e.preventDefault();
        e.stopPropagation();
        var horiz = Math.abs(e.deltaX) > Math.abs(e.deltaY);
        wheelAcc += (horiz ? e.deltaX : (e.deltaY || e.deltaX)) * (e.deltaMode === 1 ? 16 : 1);
        var now = performance.now();
        if (Math.abs(wheelAcc) > 36 && now - wheelT > 150) {
          commit(target + Math.sign(wheelAcc));
          wheelAcc = 0;
          wheelT = now;
          schedule();
        }
      };
      stage.addEventListener('wheel', onWheel, { passive: false });

      var onKeyDown = function (e) {
        var tag = e.target && e.target.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
        var k = e.key;
        if (k === 'ArrowDown' || k === 'ArrowRight' || k === 'PageDown' || k === ' ') {
          e.preventDefault();
          commit(target + 1);
          schedule();
        } else if (k === 'ArrowUp' || k === 'ArrowLeft' || k === 'PageUp') {
          e.preventDefault();
          commit(target - 1);
          schedule();
        } else if (k === 'Home') {
          e.preventDefault();
          instance.go(0);
          schedule();
        } else if (k === 'End') {
          e.preventDefault();
          instance.go(N - 1);
          schedule();
        }
      };
      window.addEventListener('keydown', onKeyDown);

      var io = null;
      if (typeof IntersectionObserver !== 'undefined') {
        io = new IntersectionObserver(function (es) {
          inView = es[0] ? es[0].isIntersecting : true;
          schedule();
        }, { threshold: 0.15 });
        io.observe(stage);
      }
      var onVis = function () { schedule(); };
      document.addEventListener('visibilitychange', onVis);

      var ro = null, rt = 0;
      if (typeof ResizeObserver !== 'undefined') {
        ro = new ResizeObserver(function () {
          cancelAnimationFrame(rt);
          rt = requestAnimationFrame(function () {
            if (destroyed) return;
            fit(false); layout(0); renderer.render(scene, camera);
          });
        });
        ro.observe(stage);
      }

      fit(true);
      if (!reduced.matches) {
        pos = target - Math.min(5, Math.max(2, N));
        lastRound = Math.round(pos);
      }
      shown = startIdx;
      layout(0);
      renderer.render(scene, camera);
      kick();
      schedule();

      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(function () {
          if (destroyed) return;
          fit(true); layout(0); renderer.render(scene, camera);
        });
      }

      instance.next = function () { commit(target + 1); schedule(); };
      instance.prev = function () { commit(target - 1); schedule(); };
      instance.go = function (i) {
        if (!N) return;
        i = mod(Math.round(i), N);
        var dlt = mod(i - mod(Math.round(target), N), N);
        if (dlt > N / 2) dlt -= N;
        if (dlt !== 0) commit(Math.round(target) + dlt);
        schedule();
      };
      instance.fit = function () {
        if (destroyed) return;
        fit(false); layout(0); renderer.render(scene, camera);
      };
      instance.setAutoplay = function (ms) {
        var nextMs = typeof ms === 'number' ? ms : (ms ? 2800 : 0);
        if (nextMs === autoplayMs) return;
        autoplayMs = nextMs;
        schedule();
      };
      instance.setBackdropMode = function (modeStr) {
        applyBackdropTuning(modeStr);
        if (!running) renderer.render(scene, camera);
      };
      instance.destroy = function () {
        if (destroyed) return;
        destroyed = true;
        clearTimeout(autoT);
        cancelAnimationFrame(rafId);
        cancelAnimationFrame(rt);
        if (ro) ro.disconnect();
        if (io) io.disconnect();
        document.removeEventListener('visibilitychange', onVis);
        window.removeEventListener('keydown', onKeyDown);
        stage.removeEventListener('wheel', onWheel);
        canvas.removeEventListener('pointerdown', onCanvasDown);
        canvas.removeEventListener('pointermove', onCanvasMove);
        canvas.removeEventListener('pointerup', endDrag);
        canvas.removeEventListener('pointercancel', endDrag);
        canvas.removeEventListener('pointerenter', onCanvasEnter);
        canvas.removeEventListener('pointerleave', onCanvasLeave);
        gripCleanups.forEach(function (fn) { fn(); });
        clearTexCache();
        cardSlots.forEach(function (cs) { cs.fm.dispose(); cs.bm.dispose(); });
        disposables.forEach(function (d) { if (d && typeof d.dispose === 'function') d.dispose(); });
        renderer.dispose();
      };
    }).catch(function () {});

    return {
      next: function () { instance.next(); },
      prev: function () { instance.prev(); },
      go: function (i) { instance.go(i); },
      fit: function () { instance.fit(); },
      setAutoplay: function (ms) { instance.setAutoplay(ms); },
      setBackdropMode: function (m) { instance.setBackdropMode(m); },
      destroy: function () { instance.destroy(); }
    };
  }

  window.RolodexEngine = { mount: mountEngine };

  var STAR_PATH = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.4l2.9 6.1 6.7.9-4.9 4.7 1.2 6.7L12 17.6 6.1 20.8l1.2-6.7-4.9-4.7 6.7-.9z"/></svg>';
  var FIVE_STARS = STAR_PATH + STAR_PATH + STAR_PATH + STAR_PATH + STAR_PATH;

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function mountMode(box, list, onPick, hooks) {
    hooks = hooks || {};
    var items = Array.isArray(list) ? list : [];
    var boardTitle = 'Minest';
    try {
      var b = window.MinestAI && MinestAI.board && MinestAI.board();
      if (b && b.title) boardTitle = b.title;
    } catch (e) {}

    var paperPref = true;
    try {
      var saved = localStorage.getItem('minest.rolodexPaper');
      if (saved !== null) paperPref = saved !== '0';
    } catch (e) {}

    var localAuto = false;
    var activeIdx = 0;

    box.innerHTML =
      '<svg class="rdx-grain-overlay" aria-hidden="true"><filter id="mn-rdx-grain"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(#mn-rdx-grain)"/></svg>' +
      '<div class="rdx-top-actions">' +
        '<button type="button" class="rdx-pill-btn" data-rdx="auto"><span>⟳</span><span>自动翻页</span></button>' +
        '<button type="button" class="rdx-pill-btn" data-rdx="paper"><span>◐</span><span data-rdx-paper-txt>纸感原色</span></button>' +
      '</div>' +
      '<div class="rdx-shell">' +
        '<div class="rdx-intro">' +
          '<p class="rdx-eyebrow">ROTARY CARD FILE · 旋转名片夹</p>' +
          '<h2 class="rdx-heading">' + esc(boardTitle) + '</h2>' +
          '<div class="rdx-rating">' +
            '<span class="rdx-score" data-rdx-score>5.0</span>' +
            '<span class="rdx-stars" aria-hidden="true"><span class="bg">' + FIVE_STARS + '</span><span class="fg" data-rdx-stars style="width:100%">' + FIVE_STARS + '</span></span>' +
            '<span>·</span><span data-rdx-count>' + items.length + ' 张卡片</span>' +
          '</div>' +
          '<p class="rdx-lede" data-rdx-lede></p>' +
          '<div class="rdx-who" aria-live="polite"><b data-rdx-idx>01 / ' + pad(Math.max(1, items.length)) + '</b><span data-rdx-col></span></div>' +
          '<div class="rdx-card-actions">' +
            '<button type="button" class="rdx-act-btn" data-rdx="open">✦ 打开卡片详情</button>' +
            '<button type="button" class="rdx-act-btn" data-rdx="next">↻ 翻到下一张</button>' +
          '</div>' +
        '</div>' +
        '<div class="rdx-file">' +
          '<div class="rdx-stage" tabindex="0" role="region" aria-label="3D Rolodex Rotary File">' +
            '<canvas></canvas>' +
            '<div class="rdx-grip" data-grip="card"></div>' +
            '<div class="rdx-grip" data-grip="k0"></div>' +
            '<div class="rdx-grip" data-grip="k1"></div>' +
          '</div>' +
          '<div class="rdx-controls">' +
            '<button type="button" class="rdx-arr" data-rdx="prev" aria-label="上一张"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg></button>' +
            '<div class="rdx-dots" data-rdx-dots></div>' +
            '<button type="button" class="rdx-arr" data-rdx="next" aria-label="下一张"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg></button>' +
          '</div>' +
        '</div>' +
      '</div>';

    var shell = box.querySelector('.rdx-shell');
    var stageEl = box.querySelector('.rdx-stage');
    var canvasEl = stageEl.querySelector('canvas');
    var ledeEl = box.querySelector('[data-rdx-lede]');
    var idxEl = box.querySelector('[data-rdx-idx]');
    var colEl = box.querySelector('[data-rdx-col]');
    var scoreEl = box.querySelector('[data-rdx-score]');
    var starsEl = box.querySelector('[data-rdx-stars]');
    var dotsEl = box.querySelector('[data-rdx-dots]');
    var autoBtn = box.querySelector('[data-rdx="auto"]');
    var paperBtn = box.querySelector('[data-rdx="paper"]');
    var paperTxt = box.querySelector('[data-rdx-paper-txt]');

    function computeRating() {
      if (!items.length) return 5.0;
      var sum = 0;
      for (var i = 0; i < items.length; i++) {
        var r = items[i].raw || {};
        var m = Number(r.mastery);
        sum += (m >= 1 && m <= 5) ? Math.min(5, 3.8 + m * 0.24) : 4.9;
      }
      return Math.min(5, Math.max(4.2, sum / items.length));
    }
    var avgScore = computeRating();
    scoreEl.textContent = avgScore.toFixed(1);
    starsEl.style.width = Math.round(avgScore / 5 * 100) + '%';

    function renderDots() {
      var n = items.length;
      if (n <= 1) { dotsEl.innerHTML = ''; return; }
      if (n <= 14) {
        var html = '';
        for (var i = 0; i < n; i++) {
          html += '<button type="button" class="rdx-dot" data-dot="' + i + '" aria-label="第 ' + (i + 1) + ' 张"' + (i === activeIdx ? ' aria-current="true"' : '') + '></button>';
        }
        dotsEl.innerHTML = html;
      } else {
        dotsEl.innerHTML = '<span class="rdx-mini-counter">' + pad(activeIdx + 1) + ' / ' + pad(n) + '</span>';
      }
    }

    function updateMeta(idx) {
      activeIdx = items.length ? mod(idx, items.length) : 0;
      var it = items[activeIdx];
      var total = Math.max(1, items.length);
      idxEl.textContent = pad(activeIdx + 1) + ' / ' + pad(total);
      if (it) {
        var sub = cleanPlain(it.sub || (it.raw && it.raw.columnTitle) || boardTitle);
        colEl.textContent = (it.title || 'Untitled') + (sub ? ' · ' + sub : '');
        ledeEl.textContent = it.desc || '拖动名片或旋转两侧齿轮旋钮翻阅卡片，双击当前卡片查看完整内容。';
      } else {
        colEl.textContent = boardTitle;
        ledeEl.textContent = '当前看板暂无卡片，新建卡片后即可在 3D 旋转名片夹中翻阅。';
      }
      if (items.length > 1 && items.length <= 14) {
        var ds = dotsEl.querySelectorAll('.rdx-dot');
        for (var i = 0; i < ds.length; i++) {
          if (i === activeIdx) ds[i].setAttribute('aria-current', 'true');
          else ds[i].removeAttribute('aria-current');
        }
      } else if (items.length > 14) {
        var mc = dotsEl.querySelector('.rdx-mini-counter');
        if (mc) mc.textContent = pad(activeIdx + 1) + ' / ' + pad(items.length);
      }
    }

    var eng = null;
    function syncBackdrop() {
      var holo = !!(hooks.isHolo && hooks.isHolo());
      var usePaper = paperPref && !holo;
      box.classList.toggle('rdx-paper-mode', usePaper);
      var darkBody = /theme-dark/.test(document.body.className) || holo;
      shell.classList.toggle('is-stage-dark', !usePaper && darkBody);
      shell.classList.toggle('is-stage-light', !usePaper && !darkBody);
      paperBtn.classList.toggle('on', usePaper);
      paperTxt.textContent = usePaper ? '纸感原色' : '舞台背景';
      if (eng) eng.setBackdropMode(usePaper ? 'paper' : (darkBody ? 'stage-dark' : 'stage-light'));
    }

    function currentAutoMs() {
      var hostPlay = !!(hooks.isPlaying && hooks.isPlaying());
      var spd = (hooks.getSpeed && hooks.getSpeed()) || 1;
      if (localAuto || hostPlay) return Math.max(700, Math.round(2800 / spd));
      return 0;
    }

    function syncAutoUI() {
      var ms = currentAutoMs();
      autoBtn.classList.toggle('on', ms > 0);
      if (eng) eng.setAutoplay(ms);
    }

    renderDots();
    updateMeta(0);

    eng = mountEngine({
      stageEl: stageEl,
      canvasEl: canvasEl,
      gripCardEl: box.querySelector('[data-grip="card"]'),
      gripK0El: box.querySelector('[data-grip="k0"]'),
      gripK1El: box.querySelector('[data-grip="k1"]'),
      cards: items,
      boardTitle: boardTitle,
      initialIndex: 0,
      autoplay: false,
      backdropMode: paperPref ? 'paper' : 'stage-dark',
      onIndexChange: function (idx) { updateMeta(idx); },
      onOpenActive: function (idx) {
        var it = items[idx];
        if (it && typeof onPick === 'function') onPick(it);
      }
    });
    syncBackdrop();
    syncAutoUI();

    var syncTimer = setInterval(function () {
      syncAutoUI();
      syncBackdrop();
    }, 450);

    box.addEventListener('click', function (e) {
      var dot = e.target.closest('[data-dot]');
      if (dot) {
        e.stopPropagation();
        eng.go(Number(dot.getAttribute('data-dot')) || 0);
        return;
      }
      var btn = e.target.closest('[data-rdx]');
      if (!btn) return;
      e.stopPropagation();
      var act = btn.getAttribute('data-rdx');
      if (act === 'prev') eng.prev();
      else if (act === 'next') eng.next();
      else if (act === 'open') {
        var cur = items[activeIdx];
        if (cur && typeof onPick === 'function') onPick(cur);
      } else if (act === 'auto') {
        localAuto = !localAuto;
        syncAutoUI();
      } else if (act === 'paper') {
        paperPref = !paperPref;
        try { localStorage.setItem('minest.rolodexPaper', paperPref ? '1' : '0'); } catch (er) {}
        syncBackdrop();
      }
    });

    ['pointerdown', 'touchstart'].forEach(function (ev) {
      box.querySelector('.rdx-top-actions').addEventListener(ev, function (e) { e.stopPropagation(); }, { passive: true });
      box.querySelector('.rdx-controls').addEventListener(ev, function (e) { e.stopPropagation(); }, { passive: true });
      box.querySelector('.rdx-card-actions').addEventListener(ev, function (e) { e.stopPropagation(); }, { passive: true });
    });

    return {
      fit: function () { if (eng) eng.fit(); },
      destroy: function () {
        clearInterval(syncTimer);
        if (eng) eng.destroy();
        box.classList.remove('rdx-paper-mode');
        box.innerHTML = '';
      }
    };
  }

  window.MinestRolodexMode = { mount: mountMode };
})();
