/* Minest · 3D Cover Mode: Glass Widgets (玻璃组件)
 * 1:1 optical recreation of the 3D Liquid Crystal Glass Widget:
 * - Sculpted isometric 3D extruded smoked-crystal squircle block with multi-slice depth parallax
 * - Raised convex cabochon glass dome with real SVG feDisplacementMap edge meniscus refraction
 * - Progressive focus-pull bokeh blur dissolve ( artwork + staggered frosted SF typography )
 * - Live artwork-derived atmospheric color-bleed backdrop + pointer-reactive 3D specular caustics
 * - Seamless Minest Kanban deck binding + canonical Museum Masterpieces showcase toggle
 */
(function () {
  'use strict';
  if (window.MinestGlassWidgetsMode) return;

  var STYLE_ID = 'mn-glass-widgets-css';
  var SVG_FILTER_ID = 'gw-cabochon-disp';

  function artAssetUrl(file) {
    var p = '';
    try { p = location.pathname || ''; } catch (e) {}
    return (/\/cards-2(\/|$)/.test(p) ? 'art/' : 'cards-2/art/') + file;
  }

  /* Canonical Museum Masterpieces (CC0 Public Domain from The Metropolitan Museum of Art Open Access + procedural fallback) */
  var MUSEUM_DECK = [
    {
      id: 'gw-museum-cezanne',
      eyebrow: 'Artwork of the Day',
      title: 'Mont Sainte-Victoire',
      subtitle: 'Paul Cézanne',
      artFile: 'cezanne.jpg',
      desc: 'Post-Impressionist limestone peak rising above faceted Provençal ochre and pine valleys.',
      painter: 0,
      atmo: ['#1d3949', '#3d5b68', '#524b2a', '#242d26']
    },
    {
      id: 'gw-museum-vangogh',
      eyebrow: 'Artwork of the Day',
      title: 'Wheat Field with Cypresses',
      subtitle: 'Vincent van Gogh',
      artFile: 'vangogh.jpg',
      desc: 'Swirling celadon-cobalt Saint-Rémy sky above golden wheat and towering dark cypresses.',
      painter: 1,
      atmo: ['#435558', '#5d6e6f', '#4e451d', '#1c241e']
    },
    {
      id: 'gw-museum-hokusai',
      eyebrow: 'Artwork of the Day',
      title: 'The Great Wave',
      subtitle: 'Katsushika Hokusai',
      artFile: 'hokusai.jpg',
      desc: 'Prussian-blue clawing ocean crest framing snow-capped Mount Fuji against warm Edo parchment.',
      painter: 2,
      atmo: ['#948977', '#7b7f82', '#5c594f', '#223542']
    },
    {
      id: 'gw-museum-irises',
      eyebrow: 'Artwork of the Day',
      title: 'Irises',
      subtitle: 'Vincent van Gogh',
      artFile: 'irises.jpg',
      desc: 'Vibrant violet-cobalt irises and emerald leaves painted at Saint-Paul-de-Mausole.',
      painter: 3,
      atmo: ['#284458', '#3c6158', '#4f3d56', '#182830']
    },
    {
      id: 'gw-museum-turner',
      eyebrow: 'Artwork of the Day',
      title: 'Venice, Madonna della Salute',
      subtitle: 'J. M. W. Turner',
      artFile: 'turner.jpg',
      desc: 'Golden atmospheric mist dissolving sunlit domes into a luminous Venetian lagoon.',
      painter: 5,
      atmo: ['#7d6a52', '#8f7958', '#3a5c66', '#283842']
    }
  ];

  var PALETTES = [
    ['#1d3949', '#3d5b68', '#524b2a', '#242d26'],
    ['#435558', '#5d6e6f', '#4e451d', '#1c241e'],
    ['#948977', '#7b7f82', '#5c594f', '#223542'],
    ['#284458', '#3c6158', '#4f3d56', '#182830'],
    ['#182d52', '#2c4a73', '#4c4724', '#101a2e'],
    ['#7d6a52', '#8f7958', '#3a5c66', '#283842']
  ];

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function mod(n, m) { return ((n % m) + m) % m; }
  function pad2(n) { return String(n).padStart(2, '0'); }

  function hexToRgb(hex) {
    var s = String(hex || '#2c3e50').replace('#', '').trim();
    if (s.length === 3) s = s[0] + s[0] + s[1] + s[1] + s[2] + s[2];
    var n = parseInt(s, 16);
    if (isNaN(n)) return [44, 62, 80];
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  function seededRng(seed) {
    var s = (seed >>> 0) || 123456789;
    return function () {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }

  function hashStr(str) {
    var h = 2166136261 >>> 0;
    var s = String(str || '');
    for (var i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    return h >>> 0;
  }

  function cleanPlain(s) {
    return String(s || '')
      .replace(/https?:\/\/\S+/g, '')
      .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, '$2$1')
      .replace(/[#*_>`~\[\]]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function extractShortSubtitle(it, boardTitle) {
    if (it.subtitle) return it.subtitle;
    var raw = it.raw || {};
    if (raw.author || raw.artist) return cleanPlain(raw.author || raw.artist);
    var d = cleanPlain(it.desc || raw.meaning || raw.description || '');
    if (d) {
      d = d.replace(/^(你要理解|范围|官方备考入口说明|考纲)[：:\s]*/i, '');
      d = d.replace(/^\d+\.\s*/, '');
      var firstSent = d.split(/[。！？；\n|]/)[0].trim();
      if (firstSent && firstSent !== it.title) {
        return firstSent.length > 30 ? firstSent.slice(0, 29) + '…' : firstSent;
      }
    }
    return cleanPlain(it.sub || raw.columnTitle || boardTitle || 'Minest Collection');
  }

  /* Detect plain white study flowchart SVGs so we give study cards gorgeous museum glass paintings by default */
  function isDiagramPlaceholderSvg(src) {
    if (!src || src.indexOf('data:image/svg+xml') !== 0) return false;
    try {
      if (src.indexOf('base64,') >= 0) {
        var b64 = src.split('base64,')[1].slice(0, 320);
        var dec = atob(b64);
        if (dec.indexOf('#f8fafc') >= 0 || dec.indexOf('STUDY SUMMARY') >= 0) return true;
      } else if (src.indexOf('%23f8fafc') >= 0 || src.indexOf('STUDY%20SUMMARY') >= 0) {
        return true;
      }
    } catch (e) {}
    return false;
  }

  /* Generate procedural convex cabochon displacement map data URL for SVG feDisplacementMap */
  var cachedDispUrl = '';
  function getCabochonMapUrl() {
    if (cachedDispUrl) return cachedDispUrl;
    try {
      var W = 256, H = 168;
      var cv = document.createElement('canvas');
      cv.width = W; cv.height = H;
      var ctx = cv.getContext('2d');
      var img = ctx.createImageData(W, H);
      var d = img.data;
      for (var y = 0; y < H; y++) {
        var ny = (y / (H - 1)) * 2 - 1;
        for (var x = 0; x < W; x++) {
          var nx = (x / (W - 1)) * 2 - 1;
          /* Squircle superellipse distance (n=4.2) matching the convex dome shape */
          var ax = Math.abs(nx), ay = Math.abs(ny);
          var r = Math.pow(Math.pow(ax, 4.2) + Math.pow(ay, 4.2), 1 / 4.2);
          /* Meniscus curvature concentrated in the outer 24% glass bevel */
          var edge = clamp((r - 0.72) / 0.28, 0, 1);
          var curve = edge * edge * (3 - 2 * edge);
          /* Pull inward near the convex bevel so background/painting bends around the curved glass lip */
          var dx = -nx * curve * 0.88;
          var dy = -ny * curve * 0.88;
          var idx = (y * W + x) * 4;
          d[idx] = clamp(Math.round(128 + dx * 127), 0, 255);
          d[idx + 1] = clamp(Math.round(128 + dy * 127), 0, 255);
          d[idx + 2] = 128;
          d[idx + 3] = 255;
        }
      }
      ctx.putImageData(img, 0, 0);
      cachedDispUrl = cv.toDataURL('image/png');
    } catch (e) {
      cachedDispUrl = '';
    }
    return cachedDispUrl;
  }

  function ensureStylesAndFilters() {
    if (!document.getElementById(STYLE_ID)) {
      var st = document.createElement('style');
      st.id = STYLE_ID;
      st.textContent = [
        '#cm-ov.glass{background:#0b0f14!important;overflow:hidden}',
        '#cm-ov.glass #v2-stage{opacity:0.12;z-index:2}',
        '.gw-stage{position:absolute;inset:0;z-index:6;overflow:hidden;user-select:none;-webkit-user-select:none;touch-action:none;font-family:-apple-system,"SF Pro Display","SF Pro Text","PingFang SC","Hiragino Sans GB",system-ui,sans-serif}',
        /* Apple Music + reference video dual-buffer fluid blurred artwork backdrop (pre-baked Gaussian bokeh -> 120fps zero-cost GPU compositing) */
        '.gw-atmo-wrap{position:absolute;inset:0;z-index:1;overflow:hidden;pointer-events:none;background:#0b0f14}',
        '.gw-stage.is-holo .gw-atmo-wrap{opacity:0.26}',
        '.gw-bg-slot{position:absolute;inset:-12%;pointer-events:none;will-change:opacity,transform}',
        '.gw-bg-base,.gw-bg-flow{position:absolute;inset:0;width:100%;height:100%;display:block}',
        '.gw-bg-flow{opacity:0.52;will-change:transform}',
        '.gw-vignette{position:absolute;inset:0;z-index:2;pointer-events:none;background:radial-gradient(86% 82% at 50% 47%,transparent 46%,rgba(4,6,11,0.26) 82%,rgba(2,4,8,0.54) 100%)}',
        '.gw-rig{position:absolute;left:50%;top:47.5%;width:440px;height:430px;margin:-215px 0 0 -220px;z-index:8;perspective:1380px;transform-origin:50% 50%;cursor:grab}',
        '.gw-rig:active{cursor:grabbing}',
        '.gw-pose{position:absolute;inset:0;transform-style:preserve-3d;will-change:transform}',
        /* Deep ambient drop shadow floating beneath the crystal slab */
        '.gw-shadow{position:absolute;inset:12px 14px -4px -4px;border-radius:102px;background:radial-gradient(66% 66% at 48% 54%,rgba(0,0,0,0.54),rgba(0,0,0,0.22) 68%,transparent 100%);filter:blur(26px);transform:translate3d(-14px,24px,-40px);pointer-events:none}',
        /* Multi-slice 3D extruded crystal sidewall ( sleek thin ~8px left crystal wall & ~12px bottom lip ) */
        '.gw-slice{position:absolute;inset:0;border-radius:98px;pointer-events:none;box-sizing:border-box}',
        '.gw-slice-body{background:linear-gradient(138deg,rgba(255,255,255,0.04) 0%,rgba(28,34,40,0.075) 30%,rgba(10,14,18,0.12) 72%,rgba(255,255,255,0.05) 100%);border:0}',
        '.gw-slice-back{background:linear-gradient(145deg,rgba(14,18,22,0.48),rgba(6,9,13,0.62));border:1.3px solid rgba(255,255,255,0.4);box-shadow:inset 1.5px -1.5px 8px rgba(255,255,255,0.2),0 14px 30px rgba(0,0,0,0.42)}',
        '.gw-slice-mid{border:0}',
        /* Sidewall vector specular highlights (left extruded wall white slash + bottom curve glint) */
        '.gw-wall-spec{position:absolute;inset:-8px;width:calc(100% + 16px);height:calc(100% + 16px);pointer-events:none;overflow:visible}',
        /* Main top crystal glass face — genuine clear smoked optical crystal transmitting the backdrop */
        '.gw-face{position:absolute;inset:0;border-radius:98px;overflow:hidden;box-sizing:border-box;transform:translateZ(0px);background:linear-gradient(172deg,rgba(255,255,255,0.14) 0%,rgba(160,168,174,0.08) 46%,rgba(30,35,40,0.18) 78%,rgba(16,20,24,0.28) 100%);-webkit-backdrop-filter:blur(34px) saturate(132%);backdrop-filter:blur(34px) saturate(132%);box-shadow:inset 0 1.6px 1px rgba(255,255,255,0.72),inset 0 -1.5px 2px rgba(255,255,255,0.36),inset 2px 0 3px rgba(255,255,255,0.26),inset -1.5px 0 2px rgba(255,255,255,0.34),inset 0 -18px 34px rgba(0,0,0,0.16)}',
        '.gw-stage.is-light-atmo .gw-face{background:linear-gradient(172deg,rgba(255,255,255,0.22) 0%,rgba(190,190,186,0.12) 48%,rgba(72,76,80,0.16) 80%,rgba(44,48,52,0.24) 100%)}',
        '.gw-stage.is-holo .gw-face{border:1px solid rgba(130,235,255,0.55);box-shadow:inset 0 0 28px rgba(90,215,255,0.24),0 0 32px rgba(80,205,255,0.26)}',
        /* Internal horizontal shelf refraction caustics right under the raised dome step */
        '.gw-shelf-caustics{position:absolute;left:24px;right:24px;top:253px;height:34px;pointer-events:none;background:linear-gradient(180deg,rgba(0,0,0,0.22) 0%,rgba(255,255,255,0.10) 24%,rgba(0,0,0,0.11) 50%,rgba(255,255,255,0.06) 76%,transparent 100%);border-radius:12px;opacity:0.86}',
        /* Raised upper convex cabochon dome window (slimmer side glass bezel) */
        '.gw-dome{position:absolute;left:12px;right:12px;top:12px;height:242px;border-radius:86px 86px 26px 26px;overflow:hidden;transform:translateZ(3px);box-sizing:border-box;background:rgba(18,24,30,0.22);box-shadow:0 8px 16px -5px rgba(0,0,0,0.38),0 1.5px 0 rgba(255,255,255,0.44),inset 0 1.5px 2px rgba(255,255,255,0.78),inset 0 -1.5px 2px rgba(255,255,255,0.42)}',
        '.gw-dome-lens{position:absolute;inset:0;transform:translateZ(0)}',
        /* iOS WebKit: overflow:hidden + border-radius does not clip 3D-composited children — clip-path and a mask keep the painting inside the glass */
        '.gw-dome{clip-path:inset(0 round 86px 86px 26px 26px);-webkit-clip-path:inset(0 round 86px 86px 26px 26px);-webkit-mask-image:-webkit-radial-gradient(white,black);isolation:isolate}',
        '.gw-face{clip-path:inset(0 round 98px);-webkit-clip-path:inset(0 round 98px);isolation:isolate}',
        '.gw-art-layer{position:absolute;inset:0;width:100%;height:100%;display:block;object-fit:cover;will-change:filter,opacity,transform;transform-origin:50% 50%}',
        /* Subtle optical glass bevel rim & curved meniscus vignette (keeps central 80% 100% tack-sharp!) */
        '.gw-dome-meniscus{display:none}',
        '.gw-dome-inner-rim{position:absolute;inset:0;border-radius:inherit;pointer-events:none;box-shadow:inset 0 12px 20px rgba(255,255,255,0.22),inset 0 -14px 22px rgba(12,16,20,0.26),inset 14px 0 22px rgba(255,255,255,0.12),inset -14px 0 22px rgba(12,16,20,0.22),inset 0 0 0 1.3px rgba(255,255,255,0.52)}',
        /* Curved sky window reflection across the upper convex dome */
        '.gw-dome-sky{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;mix-blend-mode:screen;opacity:0.86;will-change:transform}',
        /* Outer face bevel vector specular overlay */
        '.gw-face-spec{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:9}',
        /* Lower frosted glass caption shelf */
        '.gw-shelf{position:absolute;left:28px;right:28px;top:264px;bottom:20px;z-index:6;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;pointer-events:none}',
        '.gw-eyebrow{font-size:13px;line-height:1.25;font-weight:600;letter-spacing:-0.01em;color:rgba(255,255,255,0.76);text-shadow:0 1px 6px rgba(0,0,0,0.26);margin-bottom:7px;max-width:90%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;transition:opacity .35s ease}',
        '.gw-cap-wrap{position:relative;width:100%;min-height:66px;display:grid;place-items:center}',
        '.gw-cap-slot{grid-area:1/1;width:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;will-change:filter,opacity,transform}',
        '.gw-title{margin:0;font-size:23.5px;line-height:1.16;font-weight:700;letter-spacing:-0.026em;color:#ffffff;text-shadow:0 1.5px 10px rgba(0,0,0,0.3);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;max-width:94%}',
        '.gw-sub{margin:5px 0 0;font-size:15px;line-height:1.28;font-weight:600;letter-spacing:-0.015em;color:rgba(255,255,255,0.86);text-shadow:0 1px 8px rgba(0,0,0,0.26);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:90%}',
        /* Discreet floating glass controls above the bottom mode deck */
        '.gw-hud{position:absolute;left:50%;bottom:calc(env(safe-area-inset-bottom,0px) + 82px);transform:translateX(-50%);z-index:20;display:flex;align-items:center;gap:6px;padding:5px 8px;border-radius:999px;background:rgba(14,18,26,0.52);border:1px solid rgba(255,255,255,0.15);box-shadow:inset 0 1px 0 rgba(255,255,255,0.12),0 12px 30px -8px rgba(0,0,0,0.5);-webkit-backdrop-filter:blur(18px) saturate(150%);backdrop-filter:blur(18px) saturate(150%);color:rgba(240,245,255,0.9)}',
        'html.mn-dock-v .gw-hud{bottom:calc(env(safe-area-inset-bottom,0px) + 20px)}',
        'body:not(.v2) .gw-hud{bottom:calc(env(safe-area-inset-bottom,0px) + 96px)}',
        'html.mn-sys-reading .gw-hud{display:none!important}',
        '.gw-hud button{border:0;background:none;color:inherit;height:28px;min-width:28px;padding:0 9px;border-radius:999px;display:inline-flex;align-items:center;justify-content:center;gap:5px;font:600 11.5px/1 -apple-system,"PingFang SC",system-ui,sans-serif;cursor:pointer;transition:background .18s ease,color .18s ease}',
        '.gw-hud button:hover{background:rgba(255,255,255,0.12);color:#fff}',
        '.gw-hud button.on{background:rgba(255,255,255,0.2);color:#fff;box-shadow:inset 0 1px 0 rgba(255,255,255,0.28)}',
        '.gw-hud .gw-ic{padding:0;width:28px}',
        '.gw-hud{max-width:calc(100vw - 24px);box-sizing:border-box}.gw-hud button,.gw-hud span{white-space:nowrap;flex:none}',
        '.gw-hud .gw-sep{width:1px;height:14px;background:rgba(255,255,255,0.15);flex:none}',
        '.gw-hud .gw-cnt{font:600 11px/1 ui-monospace,"SF Mono",Menlo,monospace;color:rgba(226,236,250,0.72);padding:0 4px;letter-spacing:0.05em}',
        '.gw-hud button svg{width:13.5px;height:13.5px;flex:none;display:block}',
        '.gw-hud button.gw-gyro-wait::after{content:"";width:5px;height:5px;border-radius:50%;background:#7ee8fa;box-shadow:0 0 6px #7ee8fa}',
        /* Whisper-thin liquid glass gyroscope tilt gauge above HUD */
        '.gw-tilt-gauge{position:absolute;left:50%;bottom:calc(env(safe-area-inset-bottom,0px) + 126px);transform:translateX(-50%);z-index:20;width:104px;height:5px;border-radius:999px;background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.16);pointer-events:none;opacity:0;transition:opacity .25s ease;overflow:visible;-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}',
        'html.mn-dock-v .gw-tilt-gauge{bottom:calc(env(safe-area-inset-bottom,0px) + 62px)}',
        'body:not(.v2) .gw-tilt-gauge{bottom:calc(env(safe-area-inset-bottom,0px) + 138px)}',
        '.gw-tilt-gauge.vis{opacity:1}',
        '.gw-tilt-gauge::before,.gw-tilt-gauge::after{content:"";position:absolute;top:-2px;bottom:-2px;width:1.5px;border-radius:2px;background:rgba(255,255,255,0.38)}',
        '.gw-tilt-gauge::before{left:14px}.gw-tilt-gauge::after{right:14px}',
        '.gw-tilt-dot{position:absolute;left:50%;top:50%;width:9px;height:9px;margin:-4.5px 0 0 -4.5px;border-radius:50%;background:#ffffff;box-shadow:0 0 10px rgba(126,232,250,0.9);will-change:transform;transition:background .15s ease,box-shadow .15s ease}',
        '.gw-tilt-gauge.trig .gw-tilt-dot{background:#7ee8fa;box-shadow:0 0 16px #7ee8fa,0 0 28px #ffffff}',
        /* Subtle status toast when toggling / granting iPhone gyroscope */
        '.gw-toast{position:absolute;left:50%;top:calc(env(safe-area-inset-top,0px) + 64px);transform:translateX(-50%) translateY(-6px);z-index:25;padding:6px 14px;border-radius:999px;background:rgba(14,18,26,0.76);border:1px solid rgba(255,255,255,0.18);color:#f1f5f9;font:600 12px/1.3 -apple-system,"PingFang SC",system-ui,sans-serif;white-space:nowrap;pointer-events:none;opacity:0;transition:opacity .24s ease,transform .24s ease;-webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px)}',
        '.gw-toast.on{opacity:1;transform:translateX(-50%) translateY(0)}',
        '@media (max-width:540px){.gw-rig{top:45.5%}.gw-hud{bottom:calc(env(safe-area-inset-bottom,0px) + 74px);padding:4px 6px;gap:2px;max-width:calc(100vw - 16px)}.gw-hud button{height:26px;padding:0 6px;font-size:10.5px}.gw-tilt-gauge{bottom:calc(env(safe-area-inset-bottom,0px) + 112px)}}'
      ].join('\n');
      document.head.appendChild(st);
    }

    if (!document.getElementById(SVG_FILTER_ID + '-svg')) {
      var mapUrl = getCabochonMapUrl();
      var ns = 'http://www.w3.org/2000/svg';
      var svg = document.createElementNS(ns, 'svg');
      svg.id = SVG_FILTER_ID + '-svg';
      svg.setAttribute('width', '0');
      svg.setAttribute('height', '0');
      svg.style.cssText = 'position:fixed;left:-9999px;top:-9999px;pointer-events:none';
      if (mapUrl) {
        svg.innerHTML =
          '<defs><filter id="' + SVG_FILTER_ID + '" x="-6%" y="-6%" width="112%" height="112%" color-interpolation-filters="sRGB">' +
          '<feImage href="' + mapUrl + '" x="0" y="0" width="100%" height="100%" preserveAspectRatio="none" result="cabMap"/>' +
          '<feDisplacementMap in="SourceGraphic" in2="cabMap" scale="22" xChannelSelector="R" yChannelSelector="G"/>' +
          '</filter></defs>';
      }
      document.body.appendChild(svg);
    }
  }

  /* ───────────── Procedural Fine-Art Museum Painters (760×450 crisp impasto canvas) ───────────── */
  function paintStroke(ctx, x, y, w, h, ang, fill, alpha) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(ang);
    ctx.globalAlpha = alpha == null ? 1 : alpha;
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(-w / 2, -h / 2, w, h, Math.min(w, h) * 0.38) : ctx.rect(-w / 2, -h / 2, w, h);
    ctx.fill();
    ctx.restore();
  }

  function paintMasterpiece(cv, kind, seedSalt) {
    var W = 760, H = 450;
    if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
    var g = cv.getContext('2d');
    var rng = seededRng(1009 + kind * 7919 + (seedSalt || 0) * 131);
    g.save();
    g.clearRect(0, 0, W, H);

    if (kind === 0) {
      /* 0: Paul Cézanne — Mont Sainte-Victoire */
      var sky = g.createLinearGradient(0, 0, W, H * 0.52);
      sky.addColorStop(0, '#5a8ab0');
      sky.addColorStop(0.55, '#86b2d0');
      sky.addColorStop(1, '#6c98bc');
      g.fillStyle = sky;
      g.fillRect(0, 0, W, H);
      for (var i = 0; i < 140; i++) {
        var sx = rng() * W, sy = rng() * H * 0.44;
        var sc = ['#79a8c9', '#9bc2dc', '#5f8fb5', '#b8d3e3', '#4e7ea6'][(rng() * 5) | 0];
        paintStroke(g, sx, sy, 34 + rng() * 36, 12 + rng() * 10, -0.25 + rng() * 0.35, sc, 0.55);
      }
      /* Distant ridge & limestone Mont Sainte-Victoire peak */
      g.beginPath();
      g.moveTo(-20, H * 0.48);
      g.lineTo(W * 0.12, H * 0.36);
      g.lineTo(W * 0.27, H * 0.19);
      g.lineTo(W * 0.34, H * 0.11);
      g.lineTo(W * 0.43, H * 0.21);
      g.lineTo(W * 0.58, H * 0.28);
      g.lineTo(W * 0.82, H * 0.25);
      g.lineTo(W + 20, H * 0.34);
      g.lineTo(W + 20, H * 0.56);
      g.lineTo(-20, H * 0.56);
      g.closePath();
      var mtn = g.createLinearGradient(W * 0.2, H * 0.1, W * 0.65, H * 0.5);
      mtn.addColorStop(0, '#e5ecf2');
      mtn.addColorStop(0.45, '#aec4d9');
      mtn.addColorStop(1, '#4f7399');
      g.fillStyle = mtn;
      g.fill();
      /* Faceted Cézanne mountain planes */
      var mPlanes = [
        [0.33, 0.16, 46, 22, -0.55, '#f0f3f6'], [0.30, 0.23, 54, 20, -0.45, '#d7e2ec'],
        [0.38, 0.22, 56, 22, 0.38, '#7798ba'], [0.45, 0.28, 64, 22, 0.25, '#5b7fa4'],
        [0.23, 0.31, 62, 24, -0.35, '#9ab4cc'], [0.64, 0.30, 88, 24, -0.1, '#496d92'],
        [0.76, 0.29, 78, 22, 0.12, '#3d6186'], [0.35, 0.32, 70, 22, 0.08, '#c8d4df']
      ];
      for (var mp = 0; mp < mPlanes.length; mp++) {
        var p = mPlanes[mp];
        paintStroke(g, W * p[0], H * p[1], p[2], p[3], p[4], p[5], 0.82);
      }
      /* Provençal valley: ochre fields, pine greens, cobalt shadows */
      var val = g.createLinearGradient(0, H * 0.44, 0, H);
      val.addColorStop(0, '#8ba27c');
      val.addColorStop(0.45, '#c7a463');
      val.addColorStop(1, '#b88c4b');
      g.fillStyle = val;
      g.fillRect(0, H * 0.45, W, H * 0.56);
      var vCols = ['#d8b572', '#c89b52', '#dfc388', '#3c6b54', '#2d5544', '#588262', '#7a9458', '#486d88', '#cfa45e', '#e5cca0'];
      for (var v = 0; v < 340; v++) {
        var vy = H * (0.43 + Math.pow(rng(), 0.92) * 0.57);
        var vx = rng() * W;
        var scaleK = 0.65 + ((vy - H * 0.43) / (H * 0.57)) * 0.85;
        var col = vCols[(rng() * vCols.length) | 0];
        paintStroke(g, vx, vy, (26 + rng() * 34) * scaleK, (10 + rng() * 11) * scaleK, -0.22 + rng() * 0.44, col, 0.82);
      }
      /* Foreground golden clearing & dark emerald pine clusters */
      for (var fg = 0; fg < 45; fg++) {
        paintStroke(g, W * (0.18 + rng() * 0.55), H * (0.76 + rng() * 0.2), 44 + rng() * 36, 14 + rng() * 8, -0.1 + rng() * 0.2, rng() > 0.35 ? '#dfc080' : '#315c45', 0.85);
      }
    } else if (kind === 1) {
      /* 1: Vincent van Gogh — Wheat Field with Cypresses */
      var vgSky = g.createLinearGradient(0, 0, 0, H * 0.6);
      vgSky.addColorStop(0, '#9ab9cb');
      vgSky.addColorStop(0.5, '#bfd9cf');
      vgSky.addColorStop(1, '#dfeadc');
      g.fillStyle = vgSky;
      g.fillRect(0, 0, W, H);
      /* Swirling Saint-Rémy impasto clouds */
      for (var c = 0; c < 260; c++) {
        var cx = rng() * W * 0.92, cy = rng() * H * 0.52;
        var waveAng = Math.sin(cx * 0.012 + cy * 0.018) * 0.52;
        var cCol = ['#eef2ea', '#d6e5dc', '#a9cad4', '#7ba4c7', '#c5dfd2', '#8db3cf'][(rng() * 6) | 0];
        paintStroke(g, cx, cy, 28 + rng() * 32, 7 + rng() * 6, waveAng, cCol, 0.78);
      }
      /* Swirling cloud spirals */
      g.lineCap = 'round';
      for (var sp = 0; sp < 48; sp++) {
        var ox = W * (0.08 + rng() * 0.65), oy = H * (0.08 + rng() * 0.34), rad = 18 + rng() * 34;
        g.strokeStyle = sp % 2 ? 'rgba(244,247,240,0.72)' : 'rgba(128,168,201,0.58)';
        g.lineWidth = 4 + rng() * 4;
        g.beginPath();
        g.arc(ox, oy, rad, rng() * 3, rng() * 3 + 2.4);
        g.stroke();
      }
      /* Blue Alpilles mountains along the horizon */
      g.beginPath();
      g.moveTo(0, H * 0.58);
      g.bezierCurveTo(W * 0.18, H * 0.48, W * 0.32, H * 0.54, W * 0.48, H * 0.43);
      g.bezierCurveTo(W * 0.58, H * 0.36, W * 0.68, H * 0.44, W, H * 0.48);
      g.lineTo(W, H * 0.66);
      g.lineTo(0, H * 0.66);
      g.closePath();
      g.fillStyle = '#5c85b8';
      g.fill();
      for (var bm = 0; bm < 70; bm++) {
        paintStroke(g, rng() * W * 0.78, H * (0.45 + rng() * 0.14), 24 + rng() * 20, 6 + rng() * 4, -0.2 + rng() * 0.4, bm % 2 ? '#446ea3' : '#7ea5cf', 0.75);
      }
      /* Golden wheat field foreground */
      var wheat = g.createLinearGradient(0, H * 0.58, 0, H);
      wheat.addColorStop(0, '#8ca460');
      wheat.addColorStop(0.32, '#d8af56');
      wheat.addColorStop(1, '#c99338');
      g.fillStyle = wheat;
      g.fillRect(0, H * 0.58, W, H * 0.42);
      for (var wf = 0; wf < 320; wf++) {
        var wx = rng() * W, wy = H * (0.62 + rng() * 0.38);
        var wCol = ['#e8c46e', '#d6a446', '#f0d68a', '#be882f', '#cfa048'][(rng() * 5) | 0];
        paintStroke(g, wx, wy, 20 + rng() * 22, 5 + rng() * 4, -0.32 + Math.sin(wx * 0.02) * 0.22, wCol, 0.86);
      }
      /* Lush olive-green bushes on left & midground */
      for (var bu = 0; bu < 160; bu++) {
        var bx = W * (0.04 + rng() * 0.64), by = H * (0.54 + rng() * 0.28);
        if (bx > W * 0.42 && by > H * 0.7) continue;
        var bCol = ['#466e40', '#628c54', '#86ad6e', '#2f5230', '#b8cfb0'][(rng() * 5) | 0];
        paintStroke(g, bx, by, 16 + rng() * 18, 7 + rng() * 6, -0.6 + rng() * 1.2, bCol, 0.85);
      }
      /* Iconic flame-like dark Cypresses on the right */
      for (var cyi = 0; cyi < 220; cyi++) {
        var tProg = rng();
        var halfW = (1 - tProg * 0.82) * 58;
        var cxp = W * 0.73 + (rng() - 0.5) * 2 * halfW + Math.sin(tProg * 5) * 8;
        var cyp = H * (0.68 - tProg * 0.64);
        var cDark = ['#0f2922', '#193f31', '#255640', '#0a1c17', '#336b4c'][(rng() * 5) | 0];
        paintStroke(g, cxp, cyp, 22 + rng() * 16, 6 + rng() * 4, -1.35 + (rng() - 0.5) * 0.45, cDark, 0.92);
      }
    } else if (kind === 2) {
      /* 2: Katsushika Hokusai — The Great Wave off Kanagawa */
      var washi = g.createRadialGradient(W * 0.56, H * 0.34, 20, W * 0.52, H * 0.45, W * 0.72);
      washi.addColorStop(0, '#f4efe6');
      washi.addColorStop(0.58, '#dfd6c7');
      washi.addColorStop(1, '#c2b8a7');
      g.fillStyle = washi;
      g.fillRect(0, 0, W, H);
      /* Edo vertical cartouche stamp top-left */
      g.fillStyle = 'rgba(210,198,178,0.85)';
      g.strokeStyle = 'rgba(42,60,78,0.55)';
      g.lineWidth = 1.5;
      g.fillRect(36, 38, 22, 86);
      g.strokeRect(36, 38, 22, 86);
      /* Distant snow-capped Mount Fuji */
      g.beginPath();
      g.moveTo(W * 0.46, H * 0.72);
      g.quadraticCurveTo(W * 0.55, H * 0.66, W * 0.585, H * 0.55);
      g.lineTo(W * 0.615, H * 0.55);
      g.quadraticCurveTo(W * 0.65, H * 0.66, W * 0.75, H * 0.72);
      g.closePath();
      g.fillStyle = '#254261';
      g.fill();
      g.beginPath();
      g.moveTo(W * 0.56, H * 0.615);
      g.lineTo(W * 0.585, H * 0.55);
      g.lineTo(W * 0.615, H * 0.55);
      g.lineTo(W * 0.64, H * 0.615);
      g.lineTo(W * 0.62, H * 0.60);
      g.lineTo(W * 0.60, H * 0.625);
      g.lineTo(W * 0.58, H * 0.60);
      g.closePath();
      g.fillStyle = '#f8f6f0';
      g.fill();
      /* Deep Prussian-blue Great Wave body & trough */
      g.beginPath();
      g.moveTo(-20, H);
      g.lineTo(-20, H * 0.54);
      g.bezierCurveTo(W * 0.08, H * 0.34, W * 0.16, H * 0.12, W * 0.34, H * 0.13);
      g.bezierCurveTo(W * 0.49, H * 0.14, W * 0.52, H * 0.30, W * 0.42, H * 0.34);
      g.bezierCurveTo(W * 0.33, H * 0.38, W * 0.34, H * 0.54, W * 0.52, H * 0.66);
      g.bezierCurveTo(W * 0.68, H * 0.75, W * 0.84, H * 0.64, W + 20, H * 0.52);
      g.lineTo(W + 20, H);
      g.closePath();
      var prus = g.createLinearGradient(0, H * 0.15, W * 0.75, H);
      prus.addColorStop(0, '#174070');
      prus.addColorStop(0.48, '#24588c');
      prus.addColorStop(1, '#133257');
      g.fillStyle = prus;
      g.fill();
      /* Lighter cobalt wave striations */
      g.strokeStyle = '#5a8eb9';
      g.lineWidth = 3;
      for (var st = 0; st < 18; st++) {
        var sy0 = H * (0.64 + st * 0.022);
        g.beginPath();
        g.moveTo(W * 0.05, sy0);
        g.bezierCurveTo(W * 0.28, sy0 - 42, W * 0.56, sy0 + 34, W * 0.96, sy0 - 24);
        g.stroke();
      }
      /* Wooden Edo boat tucked in the wave trough */
      g.save();
      g.translate(W * 0.66, H * 0.64);
      g.rotate(-0.28);
      g.fillStyle = '#c8af86';
      g.beginPath();
      g.moveTo(-68, 0);
      g.quadraticCurveTo(0, 18, 74, -8);
      g.quadraticCurveTo(10, 6, -68, 0);
      g.fill();
      g.restore();
      /* White cresting foam claws & sea spray */
      var claws = [
        [0.18, 0.26, 46], [0.24, 0.18, 52], [0.32, 0.14, 56], [0.40, 0.18, 48],
        [0.45, 0.25, 40], [0.38, 0.31, 36], [0.24, 0.64, 48], [0.32, 0.58, 44], [0.82, 0.60, 46]
      ];
      for (var cl = 0; cl < claws.length; cl++) {
        var cw = claws[cl];
        for (var sub = 0; sub < 9; sub++) {
          var fx = W * cw[0] + (rng() - 0.5) * cw[2] * 1.3;
          var fy = H * cw[1] + (rng() - 0.5) * cw[2] * 0.7;
          var fr = 10 + rng() * 18;
          g.fillStyle = '#f8f6f0';
          g.strokeStyle = '#204975';
          g.lineWidth = 1.6;
          g.beginPath();
          g.arc(fx, fy, fr, 0, Math.PI * 1.65);
          g.fill();
          g.stroke();
        }
      }
      /* Spray droplets in the air */
      g.fillStyle = '#faf8f2';
      for (var dr = 0; dr < 85; dr++) {
        var dx = W * (0.34 + rng() * 0.26), dy = H * (0.12 + rng() * 0.34);
        g.beginPath();
        g.arc(dx, dy, 1.8 + rng() * 3.2, 0, Math.PI * 2);
        g.fill();
      }
    } else if (kind === 3) {
      /* 3: Claude Monet — Water Lilies at Giverny */
      var pond = g.createLinearGradient(0, 0, W, H);
      pond.addColorStop(0, '#274d68');
      pond.addColorStop(0.5, '#3b6f6a');
      pond.addColorStop(1, '#4c3e68');
      g.fillStyle = pond;
      g.fillRect(0, 0, W, H);
      for (var m = 0; m < 260; m++) {
        var mCol = ['#3c6c82', '#528b7c', '#6a5b8e', '#2f5855', '#7ea89a', '#8e7bb0'][(rng() * 6) | 0];
        paintStroke(g, rng() * W, rng() * H, 38 + rng() * 42, 10 + rng() * 8, (rng() - 0.5) * 0.24, mCol, 0.65);
      }
      /* Lily pads & blossoms */
      for (var lp = 0; lp < 26; lp++) {
        var lx = W * (0.08 + rng() * 0.84), ly = H * (0.22 + rng() * 0.68), lr = 22 + rng() * 32;
        g.fillStyle = lp % 2 ? '#34684c' : '#4a7f58';
        g.beginPath();
        g.ellipse(lx, ly, lr, lr * 0.42, (rng() - 0.5) * 0.3, 0.2, Math.PI * 1.92);
        g.fill();
        if (lp % 3 === 0) {
          g.fillStyle = lp % 6 === 0 ? '#f6d5df' : '#faf6ee';
          for (var pt = 0; pt < 5; pt++) {
            paintStroke(g, lx + (pt - 2) * 5, ly - 5, 10, 16, (pt - 2) * 0.32, g.fillStyle, 0.92);
          }
        }
      }
    } else if (kind === 4) {
      /* 4: Vincent van Gogh — The Starry Night */
      var nSky = g.createLinearGradient(0, 0, 0, H);
      nSky.addColorStop(0, '#10244a');
      nSky.addColorStop(0.65, '#254a7c');
      nSky.addColorStop(1, '#16283c');
      g.fillStyle = nSky;
      g.fillRect(0, 0, W, H);
      for (var ns = 0; ns < 280; ns++) {
        var nx = rng() * W, ny = rng() * H * 0.76;
        var nang = Math.sin(nx * 0.011) * 0.55;
        var nCol = ['#1d3b6e', '#2f5c94', '#4d7cb0', '#162d57', '#7aa4cf'][(rng() * 5) | 0];
        paintStroke(g, nx, ny, 26 + rng() * 24, 6 + rng() * 5, nang, nCol, 0.8);
      }
      /* Radiant stars & crescent moon */
      var stars = [[0.82, 0.22, 42, '#f8d254'], [0.26, 0.20, 24, '#fae37c'], [0.52, 0.30, 28, '#fce98e'], [0.66, 0.16, 20, '#f7dc6f'], [0.40, 0.44, 22, '#fae588']];
      for (var si = 0; si < stars.length; si++) {
        var st0 = stars[si], rg = g.createRadialGradient(W * st0[0], H * st0[1], 2, W * st0[0], H * st0[1], st0[2] * 1.7);
        rg.addColorStop(0, '#fffbe0');
        rg.addColorStop(0.4, st0[3]);
        rg.addColorStop(1, 'rgba(248,210,84,0)');
        g.fillStyle = rg;
        g.beginPath();
        g.arc(W * st0[0], H * st0[1], st0[2] * 1.7, 0, Math.PI * 2);
        g.fill();
      }
      /* Dark cypress silhouette on left */
      for (var scy = 0; scy < 140; scy++) {
        var sp0 = rng();
        paintStroke(g, W * 0.18 + (rng() - 0.5) * (1 - sp0 * 0.8) * 76, H * (0.95 - sp0 * 0.86), 24, 7, -1.4, scy % 3 ? '#10211d' : '#1e382e', 0.94);
      }
    } else {
      /* 5: J. M. W. Turner — Golden Venetian Lagoon */
      var tSky = g.createRadialGradient(W * 0.52, H * 0.42, 18, W * 0.5, H * 0.46, W * 0.68);
      tSky.addColorStop(0, '#fff6dc');
      tSky.addColorStop(0.38, '#f0c47d');
      tSky.addColorStop(0.72, '#c88c64');
      tSky.addColorStop(1, '#4b6c7c');
      g.fillStyle = tSky;
      g.fillRect(0, 0, W, H);
      var lag = g.createLinearGradient(0, H * 0.58, 0, H);
      lag.addColorStop(0, 'rgba(244,205,138,0.65)');
      lag.addColorStop(0.5, 'rgba(72,126,138,0.78)');
      lag.addColorStop(1, 'rgba(38,74,92,0.92)');
      g.fillStyle = lag;
      g.fillRect(0, H * 0.58, W, H * 0.42);
      for (var tr = 0; tr < 180; tr++) {
        var tx = rng() * W, ty = rng() * H;
        var tCol = ty < H * 0.58 ? (tr % 2 ? '#fae2b4' : '#df9f6c') : (tr % 2 ? '#5d98a4' : '#f2ca85');
        paintStroke(g, tx, ty, 44 + rng() * 48, 8 + rng() * 8, (rng() - 0.5) * 0.12, tCol, 0.42);
      }
    }

    g.restore();
    applyCabochonEdgeMeniscus(cv);
  }

  /* Optical convex-dome perimeter meniscus: keeps central 80% 100% tack-sharp while refracting & softening the outer curved glass bevel! */
  function applyCabochonEdgeMeniscus(cv) {
    try {
      var W = cv.width, H = cv.height;
      var rim = document.createElement('canvas');
      rim.width = W; rim.height = H;
      var rg = rim.getContext('2d');
      /* Draw magnified + softly blurred outer lens refraction into rim buffer */
      rg.filter = 'blur(9px) saturate(112%)';
      var padX = W * 0.045, padY = H * 0.055;
      rg.drawImage(cv, -padX, -padY, W + padX * 2, H + padY * 2);
      rg.filter = 'none';
      /* Erase the inner 78% smoothly so the center of the artwork remains 100% razor-sharp! */
      rg.globalCompositeOperation = 'destination-out';
      var mask = rg.createRadialGradient(W * 0.5, H * 0.5, Math.min(W, H) * 0.34, W * 0.5, H * 0.5, Math.max(W, H) * 0.54);
      mask.addColorStop(0, 'rgba(0,0,0,1)');
      mask.addColorStop(0.68, 'rgba(0,0,0,0.96)');
      mask.addColorStop(0.88, 'rgba(0,0,0,0.32)');
      mask.addColorStop(1, 'rgba(0,0,0,0)');
      rg.fillStyle = mask;
      rg.fillRect(0, 0, W, H);
      rg.globalCompositeOperation = 'source-over';
      var mainCtx = cv.getContext('2d');
      mainCtx.drawImage(rim, 0, 0);
    } catch (e) {}
  }

  /* Draw an external image onto the 760×450 canvas and sample its 4-quadrant atmospheric palette */
  function drawCoverImageToCanvas(cv, imgEl) {
    var W = 760, H = 450;
    if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
    var g = cv.getContext('2d');
    var iw = imgEl.naturalWidth || imgEl.width || W;
    var ih = imgEl.naturalHeight || imgEl.height || H;
    var sc = Math.max(W / iw, H / ih);
    var dw = iw * sc, dh = ih * sc;
    g.clearRect(0, 0, W, H);
    g.drawImage(imgEl, (W - dw) / 2, (H - dh) / 2, dw, dh);
    applyCabochonEdgeMeniscus(cv);
  }

  function sampleCanvasPalette(cv, fallbackIdx) {
    try {
      var sm = document.createElement('canvas');
      sm.width = 8; sm.height = 8;
      var sg = sm.getContext('2d');
      sg.drawImage(cv, 0, 0, 8, 8);
      var d = sg.getImageData(0, 0, 8, 8).data;
      function avg(x0, y0, x1, y1) {
        var r = 0, g = 0, b = 0, n = 0;
        for (var y = y0; y < y1; y++) {
          for (var x = x0; x < x1; x++) {
            var k = (y * 8 + x) * 4;
            /* Slightly mute saturation & clamp luminance so glass stays legible like the video */
            r += d[k]; g += d[k + 1]; b += d[k + 2]; n++;
          }
        }
        r /= n; g /= n; b /= n;
        var gray = r * 0.299 + g * 0.587 + b * 0.114;
        r = lerp(r, gray, 0.24) * 0.72;
        g = lerp(g, gray, 0.24) * 0.72;
        b = lerp(b, gray, 0.24) * 0.72;
        return [clamp(Math.round(r), 14, 175), clamp(Math.round(g), 14, 175), clamp(Math.round(b), 16, 175)];
      }
      return [avg(0, 0, 4, 4), avg(4, 0, 8, 4), avg(0, 4, 4, 8), avg(4, 4, 8, 8)];
    } catch (e) {
      return PALETTES[fallbackIdx % PALETTES.length].map(hexToRgb);
    }
  }

  /* ───────────── Main Mode Mount ───────────── */
  function mountMode(box, list, onPick, hooks) {
    ensureStylesAndFilters();
    hooks = hooks || {};

    var boardTitle = 'Minest';
    try {
      var b = window.MinestAI && MinestAI.board && MinestAI.board();
      if (b && b.title) boardTitle = b.title;
    } catch (e) {}

    var showcasePref = false;
    try { showcasePref = localStorage.getItem('minest.glassShowcase') === '1'; } catch (e) {}
    var autoPref = true;
    try {
      var ap = localStorage.getItem('minest.glassAuto');
      if (ap === '0') autoPref = false;
    } catch (e) {}
    var gyroPref = true;
    try {
      var gp = localStorage.getItem('minest.glassGyro');
      if (gp === '0') gyroPref = false;
    } catch (e) {}

    function buildDeck() {
      if (showcasePref || !list || !list.length) {
        return MUSEUM_DECK.map(function (m, idx) {
          return {
            id: m.id,
            rawItem: list && list.length ? list[idx % list.length] : null,
            eyebrow: m.eyebrow,
            title: m.title,
            subtitle: m.subtitle,
            src: m.artFile ? artAssetUrl(m.artFile) : '',
            painter: m.painter,
            seed: idx,
            atmoRgb: m.atmo.map(hexToRgb)
          };
        });
      }
      return list.map(function (it, idx) {
        var usePhoto = !!(it.src && !isDiagramPlaceholderSvg(it.src));
        var mRef = MUSEUM_DECK[idx % MUSEUM_DECK.length];
        return {
          id: it.id || ('gw-' + idx),
          rawItem: it,
          eyebrow: cleanPlain(it.sub || (it.raw && it.raw.columnTitle) || boardTitle || 'Artwork of the Day'),
          title: cleanPlain(it.title || 'Untitled'),
          subtitle: extractShortSubtitle(it, boardTitle),
          src: usePhoto ? it.src : (mRef.artFile ? artAssetUrl(mRef.artFile) : ''),
          painter: mRef.painter,
          seed: hashStr(it.id || it.title || idx),
          atmoRgb: mRef.atmo.map(hexToRgb)
        };
      });
    }

    var deck = buildDeck();
    var activeIdx = 0;

    /* Build stage DOM */
    var stage = document.createElement('div');
    stage.className = 'gw-stage';

    var atmoWrap = document.createElement('div');
    atmoWrap.className = 'gw-atmo-wrap';
    var bgSlots = [], bgBaseCvs = [], bgFlowCvs = [];
    for (var bi = 0; bi < 2; bi++) {
      var bSlot = document.createElement('div');
      bSlot.className = 'gw-bg-slot';
      if (bi === 1) bSlot.style.opacity = '0';
      var bBase = document.createElement('canvas');
      bBase.className = 'gw-bg-base';
      bBase.width = 192; bBase.height = 192;
      var bFlow = document.createElement('canvas');
      bFlow.className = 'gw-bg-flow';
      bFlow.width = 160; bFlow.height = 160;
      bSlot.appendChild(bBase);
      bSlot.appendChild(bFlow);
      atmoWrap.appendChild(bSlot);
      bgSlots.push(bSlot);
      bgBaseCvs.push(bBase);
      bgFlowCvs.push(bFlow);
    }
    stage.appendChild(atmoWrap);

    var vig = document.createElement('div');
    vig.className = 'gw-vignette';
    stage.appendChild(vig);

    var rig = document.createElement('div');
    rig.className = 'gw-rig';
    stage.appendChild(rig);

    var pose = document.createElement('div');
    pose.className = 'gw-pose';
    rig.appendChild(pose);

    var shadowEl = document.createElement('div');
    shadowEl.className = 'gw-shadow';
    pose.appendChild(shadowEl);

    /* 8 sleek extruded crystal slices (~8px slim left wall & ~12px bottom crystal lip) */
    var SLICE_COUNT = 8;
    for (var s = 0; s < SLICE_COUNT; s++) {
      var u = 1 - s / SLICE_COUNT; /* 1 at back, -> 0 near front */
      var z = -u * 22;
      var ox = -u * 2.2;
      var oy = u * 4.5;
      var sl = document.createElement('div');
      sl.className = 'gw-slice ' + (s === 0 ? 'gw-slice-back' : 'gw-slice-body');
      sl.style.transform = 'translate3d(' + ox.toFixed(1) + 'px,' + oy.toFixed(1) + 'px,' + z.toFixed(1) + 'px)';
      pose.appendChild(sl);
    }

    /* Precision sidewall specular arc along the sleek 3D crystal wall */
    var wallSpec = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    wallSpec.setAttribute('viewBox', '-8 -8 456 446');
    wallSpec.setAttribute('class', 'gw-wall-spec');
    wallSpec.style.transform = 'translate3d(-1.2px,2.4px,-11px)';
    wallSpec.innerHTML =
      '<defs>' +
        '<linearGradient id="gw-left-slash" x1="0" y1="0.18" x2="0.12" y2="0.88">' +
          '<stop offset="0%" stop-color="#ffffff" stop-opacity="0"/>' +
          '<stop offset="18%" stop-color="#ffffff" stop-opacity="0.95"/>' +
          '<stop offset="72%" stop-color="#ffffff" stop-opacity="0.9"/>' +
          '<stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>' +
        '</linearGradient>' +
        '<linearGradient id="gw-bot-slash" x1="0.12" y1="1" x2="0.88" y2="0.96">' +
          '<stop offset="0%" stop-color="#ffffff" stop-opacity="0"/>' +
          '<stop offset="22%" stop-color="#ffffff" stop-opacity="0.92"/>' +
          '<stop offset="64%" stop-color="#ffffff" stop-opacity="0.65"/>' +
          '<stop offset="92%" stop-color="#ffffff" stop-opacity="0.88"/>' +
          '<stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>' +
        '</linearGradient>' +
      '</defs>' +
      /* Left extruded glass wall bright specular ribbon */
      '<path d="M 1.2 114 L 1.2 306" fill="none" stroke="url(#gw-left-slash)" stroke-width="2.5" stroke-linecap="round"/>' +
      /* Bottom-left curved meniscus crescent */
      '<path d="M 23 387 Q 41 415 78 426" fill="none" stroke="#ffffff" stroke-opacity="0.9" stroke-width="2.8" stroke-linecap="round"/>' +
      /* Bottom extruded rim specular streak */
      '<path d="M 94 428.8 L 350 428.8 Q 398 428.8 425 392" fill="none" stroke="url(#gw-bot-slash)" stroke-width="2.2" stroke-linecap="round"/>';
    pose.appendChild(wallSpec);

    /* Main front crystal face at Z = 0px */
    var face = document.createElement('div');
    face.className = 'gw-face';
    pose.appendChild(face);

    var caustics = document.createElement('div');
    caustics.className = 'gw-shelf-caustics';
    face.appendChild(caustics);

    var shelf = document.createElement('div');
    shelf.className = 'gw-shelf';
    shelf.innerHTML =
      '<div class="gw-eyebrow"></div>' +
      '<div class="gw-cap-wrap">' +
        '<div class="gw-cap-slot gw-cap-a"><h3 class="gw-title"></h3><p class="gw-sub"></p></div>' +
        '<div class="gw-cap-slot gw-cap-b" style="opacity:0"><h3 class="gw-title"></h3><p class="gw-sub"></p></div>' +
      '</div>';
    face.appendChild(shelf);

    var faceSpec = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    faceSpec.setAttribute('viewBox', '0 0 440 430');
    faceSpec.setAttribute('class', 'gw-face-spec');
    faceSpec.innerHTML =
      '<defs>' +
        '<linearGradient id="gw-rim-top" x1="0.1" y1="0" x2="0.92" y2="0.6">' +
          '<stop offset="0%" stop-color="#ffffff" stop-opacity="0.55"/>' +
          '<stop offset="38%" stop-color="#ffffff" stop-opacity="0.92"/>' +
          '<stop offset="72%" stop-color="#ffffff" stop-opacity="0.28"/>' +
          '<stop offset="100%" stop-color="#ffffff" stop-opacity="0.65"/>' +
        '</linearGradient>' +
      '</defs>' +
      '<rect x="1.2" y="1.2" width="437.6" height="427.6" rx="96.8" fill="none" stroke="url(#gw-rim-top)" stroke-width="1.8"/>' +
      '<rect x="5" y="5" width="430" height="420" rx="93" fill="none" stroke="rgba(255,255,255,0.16)" stroke-width="1"/>' +
      /* Right-edge crisp specular glint */
      '<path d="M 438.4 268 L 438.4 334" fill="none" stroke="#ffffff" stroke-opacity="0.76" stroke-width="2.4" stroke-linecap="round"/>';
    face.appendChild(faceSpec);

    /* Raised convex cabochon glass dome at Z = +3.5px */
    var dome = document.createElement('div');
    dome.className = 'gw-dome';
    pose.appendChild(dome);

    var domeLens = document.createElement('div');
    domeLens.className = 'gw-dome-lens';
    dome.appendChild(domeLens);

    var artCvA = document.createElement('canvas');
    artCvA.className = 'gw-art-layer';
    var artCvB = document.createElement('canvas');
    artCvB.className = 'gw-art-layer';
    artCvB.style.opacity = '0';
    domeLens.appendChild(artCvA);
    domeLens.appendChild(artCvB);

    var meniscus = document.createElement('div');
    meniscus.className = 'gw-dome-meniscus';
    dome.appendChild(meniscus);

    var domeRim = document.createElement('div');
    domeRim.className = 'gw-dome-inner-rim';
    dome.appendChild(domeRim);

    /* Curved overhead sky reflection wedge across upper dome */
    var skySvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    skySvg.setAttribute('viewBox', '0 0 400 236');
    skySvg.setAttribute('class', 'gw-dome-sky');
    skySvg.innerHTML =
      '<defs>' +
        '<linearGradient id="gw-sky-wedge" x1="0.22" y1="0" x2="0.62" y2="0.82">' +
          '<stop offset="0%" stop-color="#ffffff" stop-opacity="0.34"/>' +
          '<stop offset="45%" stop-color="#ffffff" stop-opacity="0.12"/>' +
          '<stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>' +
        '</linearGradient>' +
      '</defs>' +
      '<path d="M 52 6 Q 200 -2 332 10 Q 238 48 118 118 Q 74 72 52 6 Z" fill="url(#gw-sky-wedge)"/>' +
      /* Bottom cabochon lip glint */
      '<path d="M 28 234.5 L 372 234.5" stroke="rgba(255,255,255,0.42)" stroke-width="1.2" fill="none"/>';
    dome.appendChild(skySvg);

    /* Whisper-thin gyroscope tilt gauge + toast */
    var tiltGauge = document.createElement('div');
    tiltGauge.className = 'gw-tilt-gauge';
    tiltGauge.innerHTML = '<i class="gw-tilt-dot"></i>';
    stage.appendChild(tiltGauge);
    var tiltDot = tiltGauge.firstChild;

    var toastEl = document.createElement('div');
    toastEl.className = 'gw-toast';
    stage.appendChild(toastEl);

    /* Discreet floating HUD controls */
    var hud = document.createElement('div');
    hud.className = 'gw-hud';
    hud.innerHTML =
      '<button type="button" class="gw-ic" data-gw="prev" title="上一张 (←)" aria-label="上一张">‹</button>' +
      '<span class="gw-cnt">01 / 01</span>' +
      '<button type="button" class="gw-ic" data-gw="next" title="下一张 (→)" aria-label="下一张">›</button>' +
      '<i class="gw-sep"></i>' +
      '<button type="button" data-gw="gyro" title="iPhone 陀螺仪倾斜/轻甩切卡"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><ellipse cx="12" cy="12" rx="8.5" ry="3.4" transform="rotate(-24 12 12)"/><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/></svg><span>陀螺仪</span></button>' +
      '<button type="button" data-gw="auto" title="自动凝焦轮播"><span>凝焦轮播</span></button>' +
      '<button type="button" data-gw="showcase" title="在当前看板卡片与典藏名画之间切换"><span>典藏名画</span></button>' +
      '<button type="button" data-gw="open" title="展开当前卡片详情"><span>详情</span></button>';
    stage.appendChild(hud);

    box.appendChild(stage);

    /* Refs & state */
    var eyebrowEl = shelf.querySelector('.gw-eyebrow');
    var capSlots = [shelf.querySelector('.gw-cap-a'), shelf.querySelector('.gw-cap-b')];
    var artCvs = [artCvA, artCvB];
    var cntEl = hud.querySelector('.gw-cnt');
    var gyroBtn = hud.querySelector('[data-gw="gyro"]');
    var autoBtn = hud.querySelector('[data-gw="auto"]');
    var showBtn = hud.querySelector('[data-gw="showcase"]');
    var openBtn = hud.querySelector('[data-gw="open"]');

    var frontBuf = 0; /* 0 or 1 */
    var imgCache = {};
    var curAtmo = deck[0].atmoRgb.map(function (c) { return c.slice(); });
    var tgtAtmo = deck[0].atmoRgb.map(function (c) { return c.slice(); });

    /* Transition state (progressive focus-pull bokeh dissolve) */
    var trans = { active: false, t: 0, dur: 1.22 };
    var holdTimer = 0;

    /* 3D physics & canonical isometric pose matching reference video */
    var BASE_RX = 20.5, BASE_RY = 13.5, BASE_RZ = -13.5;
    var tilt = { rx: 0, ry: 0, trx: 0, try_: 0, vx: 0, vy: 0, impulse: 0, rollKick: 0 };
    var fitScale = 1;
    var dragging = false, ptrId = null, downX = 0, downY = 0, lastX = 0, lastY = 0, movedDist = 0, downAt = 0, lastTapAt = 0;
    var dead = false, rafId = 0, lastFrame = performance.now(), timeSec = 0;
    var toastTimer = 0;

    /* ───────────── iPhone Gyroscope (DeviceOrientation + DeviceMotion gimbal-safe fusion) ───────────── */
    var needsIosPerm = !!(
      (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') ||
      (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function')
    );
    var isAndroid = typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent || '');
    var GYRO_SWITCH_DEG = 19.5;
    var GYRO_REARM_DEG = 8.5;
    var GYRO_FLICK_RATE = 125; /* deg/s wrist flick */
    var gyro = {
      permState: needsIosPerm ? 'prompt' : 'granted',
      asking: false,
      hasSignal: false,
      rawLr: 0,
      rawFb: 0,
      baseLr: null,
      baseFb: null,
      deltaLr: 0,
      deltaFb: 0,
      smoothLr: 0,
      smoothFb: 0,
      omegaLr: 0,
      armed: true,
      cooldownUntil: 0,
      extremeSince: 0,
      lastOrientAt: 0
    };

    function showToast(msg) {
      toastEl.textContent = msg;
      toastEl.classList.add('on');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(function () { toastEl.classList.remove('on'); }, 1850);
    }

    function hapticTick(style) {
      try { if (window.MinestNative && MinestNative.haptic) MinestNative.haptic(style || 'medium'); } catch (e) {}
      try { if (navigator.vibrate) navigator.vibrate(12); } catch (e) {}
    }

    function screenAngle() {
      try {
        if (screen.orientation && typeof screen.orientation.angle === 'number') return screen.orientation.angle;
        if (typeof window.orientation === 'number') return window.orientation;
      } catch (e) {}
      return 0;
    }

    function feedGyroAttitude(lr, fb, now, src) {
      if (!isFinite(lr) || !isFinite(fb)) return;
      gyro.hasSignal = true;
      gyro.permState = 'granted';
      /* a new source or a new screen orientation starts from a new zero (their angles are not comparable) */
      var angNow = screenAngle();
      if (src !== gyro.src || angNow !== gyro.ang) { gyro.src = src; gyro.ang = angNow; gyro.baseLr = null; gyro.baseFb = null; gyro.armed = true; }
      var dtFeed = gyro.lastFeedAt ? Math.min(0.2, (now - gyro.lastFeedAt) / 1000) : 0; gyro.lastFeedAt = now;
      gyro.rawLr = lr;
      gyro.rawFb = fb;
      /* a hand held steady (well short of a switch) slowly becomes the new zero, so a slight lean never sticks */
      if (gyro.baseLr !== null && gyro.armed && Math.abs(lr - gyro.baseLr) < GYRO_SWITCH_DEG * 0.45) {
        var kz = Math.min(1, dtFeed / 3.5); gyro.baseLr += (lr - gyro.baseLr) * kz; gyro.baseFb += (fb - gyro.baseFb) * kz;
      }
      if (gyro.baseLr === null) {
        gyro.baseLr = lr;
        gyro.baseFb = fb;
        syncHud();
      }
      if (!gyroPref || dragging || document.getElementById('xl')) return;

      var dLr = lr - gyro.baseLr;
      var dFb = fb - gyro.baseFb;
      /* Normalize wrap-around across +-180 */
      if (dLr > 180) dLr -= 360;
      if (dLr < -180) dLr += 360;
      gyro.deltaLr = dLr;
      gyro.deltaFb = clamp(dFb, -45, 45);

      /* Re-arm once the iPhone returns near comfortable neutral zone */
      if (!gyro.armed && Math.abs(dLr) <= GYRO_REARM_DEG) {
        gyro.armed = true;
      }

      /* Trigger card switch on deliberate tilt (>= 19.5 deg) OR brisk wrist flick (>= 125 deg/s + >= 10.5 deg) */
      var flickRight = gyro.omegaLr >= GYRO_FLICK_RATE && dLr >= 10.5;
      var flickLeft = gyro.omegaLr <= -GYRO_FLICK_RATE && dLr <= -10.5;
      if (gyro.armed && now >= gyro.cooldownUntil && deck.length > 1) {
        if (dLr >= GYRO_SWITCH_DEG || flickRight) {
          gyro.armed = false;
          gyro.cooldownUntil = now + 720;
          tilt.rollKick = 6.5;
          holdTimer = 0;
          hapticTick('medium');
          tiltGauge.classList.add('trig');
          setTimeout(function () { tiltGauge.classList.remove('trig'); }, 320);
          goTo(activeIdx + 1);
        } else if (dLr <= -GYRO_SWITCH_DEG || flickLeft) {
          gyro.armed = false;
          gyro.cooldownUntil = now + 720;
          tilt.rollKick = -6.5;
          holdTimer = 0;
          hapticTick('medium');
          tiltGauge.classList.add('trig');
          setTimeout(function () { tiltGauge.classList.remove('trig'); }, 320);
          goTo(activeIdx - 1);
        }
      }
    }

    function onDeviceOrientation(e) {
      if (e.beta == null || e.gamma == null) return;
      var now = performance.now();
      var ang = screenAngle(), b = e.beta, g = e.gamma, lr, fb;
      /* Avoid Euler gamma gimbal flip when iPhone is held nearly vertical (|beta| > 80 deg) if devicemotion gravity is active */
      if (now - (gyro.lastMotionAt || 0) < 500) return;   /* gravity (devicemotion) is the source whenever it is there */
      if (ang === 90) { lr = b; fb = -g; }
      else if (ang === -90 || ang === 270) { lr = -b; fb = g; }
      else if (ang === 180) { lr = -g; fb = -b; }
      else { lr = g; fb = b; }
      gyro.lastOrientAt = now;
      feedGyroAttitude(lr, fb, now, 'orient');
    }

    function onDeviceMotion(e) {
      var now = performance.now();
      var rr = e.rotationRate;
      if (rr) {
        var ang0 = screenAngle();
        var rate = (ang0 === 90) ? (rr.beta || 0) : (ang0 === -90 || ang0 === 270) ? -(rr.beta || 0) : (rr.gamma || 0);
        gyro.omegaLr = rate;
      }
      var ag = e.accelerationIncludingGravity;
      if (!ag || ag.x == null || ag.y == null) return;
      var sgn = isAndroid ? -1 : 1;
      var gx = ag.x * sgn, gy = ag.y * sgn, gz = (ag.z || 0) * sgn;
      var ang = screenAngle(), rxG, ryG;
      if (ang === 90) { rxG = -gy; ryG = gx; }
      else if (ang === -90 || ang === 270) { rxG = gy; ryG = -gx; }
      else if (ang === 180) { rxG = -gx; ryG = -gy; }
      else { rxG = gx; ryG = gy; }
      /* Gimbal-lock-free roll & pitch in degrees across any upright iPhone holding angle */
      var rollDeg = Math.atan2(rxG, Math.max(1.5, Math.hypot(ryG, gz))) * 57.29578;
      var pitchDeg = Math.atan2(-ryG, Math.max(1.5, Math.hypot(rxG, gz))) * 57.29578;
      gyro.lastMotionAt = now;
      /* gravity attitude is free of the Euler gimbal flip in any holding angle: it is the only source while it comes */
      feedGyroAttitude(rollDeg, pitchDeg, now, 'motion');
    }

    function requestIosGyroPermission(explicitFromBtn) {
      if (!needsIosPerm || gyro.permState === 'granted' || gyro.asking) {
        return Promise.resolve(gyro.permState === 'granted');
      }
      gyro.asking = true;
      var tasks = [];
      try {
        if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
          tasks.push(DeviceOrientationEvent.requestPermission().catch(function () { return 'denied'; }));
        }
        if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
          tasks.push(DeviceMotionEvent.requestPermission().catch(function () { return 'denied'; }));
        }
      } catch (e) {}
      return Promise.all(tasks).then(function (res) {
        gyro.asking = false;
        var ok = res.some(function (r) { return r === 'granted'; });
        gyro.permState = ok ? 'granted' : 'denied';
        if (ok) {
          gyro.baseLr = null;
          gyro.baseFb = null;
          if (explicitFromBtn) showToast('已开启陀螺仪：左右倾斜 iPhone 即可切卡');
        } else if (explicitFromBtn) {
          showToast('未获动作与方向权限，请在 Safari 设置中允许');
        }
        syncHud();
        return ok;
      });
    }

    function recalibrateGyro() {
      if (gyro.hasSignal) {
        gyro.baseLr = gyro.rawLr;
        gyro.baseFb = gyro.rawFb;
        gyro.deltaLr = 0;
        gyro.deltaFb = 0;
        gyro.armed = true;
      }
    }

    function syncHud() {
      var total = Math.max(1, deck.length);
      cntEl.textContent = pad2(activeIdx + 1) + ' / ' + pad2(total);
      var hostPlay = !!(hooks.isPlaying && hooks.isPlaying());
      autoBtn.classList.toggle('on', autoPref || hostPlay);
      var gyroActive = gyroPref && (gyro.permState === 'granted' || gyro.hasSignal);
      gyroBtn.classList.toggle('on', gyroActive && (!needsIosPerm || gyro.hasSignal || gyro.permState === 'granted'));
      gyroBtn.classList.toggle('gw-gyro-wait', gyroPref && needsIosPerm && gyro.permState === 'prompt' && !gyro.hasSignal);
      var usingMuseum = showcasePref || !list || !list.length;
      showBtn.classList.toggle('on', usingMuseum);
      showBtn.querySelector('span').textContent = (!list || !list.length) ? '典藏名画' : (usingMuseum ? '名画典藏' : '看板卡片');
      openBtn.style.display = (deck[activeIdx] && deck[activeIdx].rawItem) ? '' : 'none';
      stage.classList.toggle('is-holo', !!(hooks.isHolo && hooks.isHolo()));
    }

    var blurWorkCv = document.createElement('canvas');
    blurWorkCv.width = 48; blurWorkCv.height = 48;

    /* Pre-bake silky Apple Music Gaussian bokeh + vibrance boost ONCE per card (<0.4ms on 48x48, works on all iOS Safari versions, 0 per-frame GPU filter cost!) */
    function syncBackdropFromArt(bufIdx) {
      try {
        var srcCv = artCvs[bufIdx];
        var W = 48, H = 48;
        var wg = blurWorkCv.getContext('2d');
        wg.clearRect(0, 0, W, H);
        wg.drawImage(srcCv, 0, 0, W, H);

        try {
          var imgD = wg.getImageData(0, 0, W, H);
          var px = imgD.data;
          var tmp = new Float32Array(W * H * 3);
          var out = new Float32Array(W * H * 3);
          /* Step 1: Apple Music vibrance & exposure shaping */
          for (var i = 0; i < W * H; i++) {
            var r = px[i * 4], g = px[i * 4 + 1], b = px[i * 4 + 2];
            var luma = r * 0.299 + g * 0.587 + b * 0.114;
            var sat = luma > 185 ? 1.38 : 1.72;
            var gain = luma > 185 ? 0.78 : 0.84;
            tmp[i * 3] = clamp((luma + (r - luma) * sat) * gain, 8, 232);
            tmp[i * 3 + 1] = clamp((luma + (g - luma) * sat) * gain, 8, 232);
            tmp[i * 3 + 2] = clamp((luma + (b - luma) * sat) * gain, 10, 232);
          }
          /* Step 2: 3-pass separable wide-radius box/Gaussian blur with edge clamping (zero dark border bleed!) */
          var rad = 6;
          for (var pass = 0; pass < 3; pass++) {
            /* Horizontal pass: tmp -> out */
            for (var y = 0; y < H; y++) {
              for (var x = 0; x < W; x++) {
                var sr = 0, sg = 0, sb = 0, cnt = 0;
                for (var k = -rad; k <= rad; k++) {
                  var xx = clamp(x + k, 0, W - 1);
                  var idx = (y * W + xx) * 3;
                  sr += tmp[idx]; sg += tmp[idx + 1]; sb += tmp[idx + 2]; cnt++;
                }
                var oIdx = (y * W + x) * 3;
                out[oIdx] = sr / cnt; out[oIdx + 1] = sg / cnt; out[oIdx + 2] = sb / cnt;
              }
            }
            /* Vertical pass: out -> tmp */
            for (var y2 = 0; y2 < H; y2++) {
              for (var x2 = 0; x2 < W; x2++) {
                var sr2 = 0, sg2 = 0, sb2 = 0, cnt2 = 0;
                for (var k2 = -rad; k2 <= rad; k2++) {
                  var yy = clamp(y2 + k2, 0, H - 1);
                  var idx2 = (yy * W + x2) * 3;
                  sr2 += out[idx2]; sg2 += out[idx2 + 1]; sb2 += out[idx2 + 2]; cnt2++;
                }
                var tIdx = (y2 * W + x2) * 3;
                tmp[tIdx] = sr2 / cnt2; tmp[tIdx + 1] = sg2 / cnt2; tmp[tIdx + 2] = sb2 / cnt2;
              }
            }
          }
          for (var p = 0; p < W * H; p++) {
            px[p * 4] = tmp[p * 3];
            px[p * 4 + 1] = tmp[p * 3 + 1];
            px[p * 4 + 2] = tmp[p * 3 + 2];
            px[p * 4 + 3] = 255;
          }
          wg.putImageData(imgD, 0, 0);
        } catch (taintErr) {}

        var baseCv = bgBaseCvs[bufIdx];
        var bg = baseCv.getContext('2d');
        bg.imageSmoothingEnabled = true;
        try { bg.imageSmoothingQuality = 'high'; } catch (e) {}
        bg.clearRect(0, 0, baseCv.width, baseCv.height);
        bg.drawImage(blurWorkCv, -baseCv.width * 0.04, -baseCv.height * 0.04, baseCv.width * 1.08, baseCv.height * 1.08);

        var flowCv = bgFlowCvs[bufIdx];
        var fg = flowCv.getContext('2d');
        fg.imageSmoothingEnabled = true;
        try { fg.imageSmoothingQuality = 'high'; } catch (e) {}
        fg.clearRect(0, 0, flowCv.width, flowCv.height);
        fg.drawImage(blurWorkCv, -flowCv.width * 0.14, -flowCv.height * 0.14, flowCv.width * 1.28, flowCv.height * 1.28);
      } catch (e) {}
    }

    function renderItemToBuffer(item, bufIdx, updateTargetPalette) {
      var cv = artCvs[bufIdx];
      if (item.src) {
        var cached = imgCache[item.src];
        if (cached && cached.complete && cached.naturalWidth > 0) {
          drawCoverImageToCanvas(cv, cached);
          syncBackdropFromArt(bufIdx);
          item.atmoRgb = sampleCanvasPalette(cv, item.painter);
          if (updateTargetPalette) tgtAtmo = item.atmoRgb.map(function (c) { return c.slice(); });
          updateLightClass();
          return;
        }
        /* Paint rich museum fallback immediately while image loads */
        paintMasterpiece(cv, item.painter, item.seed);
        syncBackdropFromArt(bufIdx);
        if (!cached) {
          var im = new Image();
          im.crossOrigin = 'anonymous';
          imgCache[item.src] = im;
          im.onload = function () {
            if (dead) return;
            if (deck[activeIdx] === item) {
              drawCoverImageToCanvas(artCvs[frontBuf], im);
              syncBackdropFromArt(frontBuf);
              item.atmoRgb = sampleCanvasPalette(artCvs[frontBuf], item.painter);
              tgtAtmo = item.atmoRgb.map(function (c) { return c.slice(); });
              updateLightClass();
            }
          };
          im.src = item.src;
        }
      } else {
        paintMasterpiece(cv, item.painter, item.seed);
        syncBackdropFromArt(bufIdx);
        if (updateTargetPalette) tgtAtmo = item.atmoRgb.map(function (c) { return c.slice(); });
        updateLightClass();
      }
    }

    function updateLightClass() {
      var c0 = tgtAtmo[0], c1 = tgtAtmo[1];
      var lum = ((c0[0] + c1[0]) * 0.15 + (c0[1] + c1[1]) * 0.29 + (c0[2] + c1[2]) * 0.06);
      stage.classList.toggle('is-light-atmo', lum > 68);
    }

    function setSlotText(slotEl, item) {
      slotEl.querySelector('.gw-title').textContent = item.title || 'Untitled';
      slotEl.querySelector('.gw-sub').textContent = item.subtitle || '';
    }

    function showImmediate(idx) {
      activeIdx = mod(idx, deck.length);
      var item = deck[activeIdx];
      frontBuf = 0;
      renderItemToBuffer(item, 0, true);
      curAtmo = tgtAtmo.map(function (c) { return c.slice(); });
      eyebrowEl.textContent = item.eyebrow || 'Artwork of the Day';
      setSlotText(capSlots[0], item);
      artCvs[0].style.opacity = '1';
      artCvs[0].style.filter = 'blur(0px)';
      artCvs[0].style.transform = 'scale(1.015)';
      artCvs[1].style.opacity = '0';
      bgSlots[0].style.opacity = '1';
      bgSlots[0].style.transform = 'scale(1.04)';
      bgSlots[1].style.opacity = '0';
      capSlots[0].style.opacity = '1';
      capSlots[0].style.filter = 'blur(0px)';
      capSlots[0].style.transform = 'none';
      capSlots[1].style.opacity = '0';
      trans.active = false;
      holdTimer = 0;
      syncHud();
    }

    function goTo(nextIdx) {
      if (deck.length <= 1) return;
      var targetIdx = mod(nextIdx, deck.length);
      if (targetIdx === activeIdx && !trans.active) return;

      /* If mid-transition, snap current incoming buffer to become outgoing cleanly */
      if (trans.active) {
        artCvs[1 - frontBuf].style.opacity = '0';
        bgSlots[1 - frontBuf].style.opacity = '0';
        capSlots[1 - frontBuf].style.opacity = '0';
      }

      var prevBuf = frontBuf;
      var nextBuf = 1 - frontBuf;
      frontBuf = nextBuf;
      activeIdx = targetIdx;
      var item = deck[activeIdx];

      renderItemToBuffer(item, nextBuf, true);
      eyebrowEl.textContent = item.eyebrow || 'Artwork of the Day';
      setSlotText(capSlots[nextBuf], item);

      artCvs[nextBuf].style.opacity = '0';
      artCvs[nextBuf].style.filter = 'blur(24px)';
      artCvs[nextBuf].style.transform = 'scale(1.065)';
      bgSlots[nextBuf].style.opacity = '0';
      bgSlots[nextBuf].style.transform = 'scale(1.14)';
      capSlots[nextBuf].style.opacity = '0';
      capSlots[nextBuf].style.filter = 'blur(11px)';

      /* Subtle buoyant crystal rock as the focus pulls */
      tilt.impulse = 1;
      trans.active = true;
      trans.t = 0;
      var spd = (hooks.getSpeed && hooks.getSpeed()) || 1;
      trans.dur = clamp(1.24 / Math.sqrt(spd), 0.72, 1.65);
      holdTimer = 0;
      syncHud();
    }

    function animateFluidBackdrop() {
      /* Apple Music style slow organic living drift & counter-parallax on the blurred artwork layers */
      var dx = Math.sin(timeSec * 0.28) * 5.5;
      var dy = Math.cos(timeSec * 0.22) * 4.5;
      var rot = Math.sin(timeSec * 0.16) * 14;
      var parX = -(tilt.ry + gyro.smoothLr) * 0.65;
      var parY = -(tilt.rx + gyro.smoothFb) * 0.55;
      for (var i = 0; i < 2; i++) {
        bgFlowCvs[i].style.transform = 'translate3d(' + (dx + parX).toFixed(1) + '%,' + (dy + parY).toFixed(1) + '%,0) rotate(' + rot.toFixed(2) + 'deg) scale(1.28)';
        bgBaseCvs[i].style.transform = 'translate3d(' + (parX * 0.45).toFixed(1) + '%,' + (parY * 0.45).toFixed(1) + '%,0)';
      }
    }

    function fit() {
      var W = box.clientWidth || window.innerWidth || 800;
      var H = box.clientHeight || window.innerHeight || 600;
      /* Reserve room for top bar (#v2-top / #cm-bar) and bottom deck (#v2-deck + .gw-hud); on a short (landscape)
         screen both shrink the space, so the widget is sized to what is left and centred in it, never behind the keys */
      var short = H < 520, topR = short ? 60 : 92, botR = short ? 175 : 200;
      var availW = W * (short ? 0.62 : 0.80);
      var availH = Math.max(110, H - topR - botR);
      /* Account for rotated bounding box (~510px effective diagonal span) */
      fitScale = clamp(Math.min(availW / 515, availH / 495), 0.22, 1.18);
      rig.style.top = Math.round(topR + availH / 2) + 'px';
      rig.style.transform = 'scale(' + fitScale.toFixed(3) + ')';
    }

    function stepTransition(dt) {
      if (!trans.active) return;
      trans.t = Math.min(1, trans.t + dt / trans.dur);
      var p = trans.t;
      var outBuf = 1 - frontBuf;
      var inBuf = frontBuf;

      /* Outgoing painting blurs into creamy bokeh & dissolves (0.0 -> 0.56) */
      var outK = clamp(p / 0.56, 0, 1);
      var outEase = outK * outK * (3 - 2 * outK);
      artCvs[outBuf].style.opacity = (1 - outEase).toFixed(3);
      artCvs[outBuf].style.filter = 'blur(' + (outEase * 22).toFixed(1) + 'px)';
      artCvs[outBuf].style.transform = 'scale(' + (1.015 + outEase * 0.045).toFixed(3) + ')';

      /* Incoming painting emerges blurred (0.18 -> 0.65) and pulls sharply into optical focus (0.28 -> 1.0) */
      var inAlphaK = clamp((p - 0.16) / 0.52, 0, 1);
      var inAlpha = inAlphaK * inAlphaK * (3 - 2 * inAlphaK);
      var inFocusK = clamp((p - 0.24) / 0.76, 0, 1);
      var inFocus = 1 - Math.pow(1 - inFocusK, 2.7);
      artCvs[inBuf].style.opacity = inAlpha.toFixed(3);
      artCvs[inBuf].style.filter = 'blur(' + ((1 - inFocus) * 24).toFixed(2) + 'px)';
      artCvs[inBuf].style.transform = 'scale(' + (1.065 - inFocus * 0.05).toFixed(3) + ')';

      /* Cross-dissolve full-bleed Apple Music blurred artwork backdrop smoothly across entire transition */
      var bgEase = p * p * (3 - 2 * p);
      bgSlots[outBuf].style.opacity = (1 - bgEase).toFixed(3);
      bgSlots[outBuf].style.transform = 'scale(' + (1.04 + bgEase * 0.08).toFixed(3) + ')';
      bgSlots[inBuf].style.opacity = bgEase.toFixed(3);
      bgSlots[inBuf].style.transform = 'scale(' + (1.14 - bgEase * 0.10).toFixed(3) + ')';

      /* Outgoing caption blurs away quickly (0.0 -> 0.42) */
      var cOutK = clamp(p / 0.42, 0, 1);
      capSlots[outBuf].style.opacity = (1 - cOutK).toFixed(3);
      capSlots[outBuf].style.filter = 'blur(' + (cOutK * 10).toFixed(1) + 'px)';
      capSlots[outBuf].style.transform = 'translateY(' + (cOutK * 4).toFixed(1) + 'px) scale(' + (1 - cOutK * 0.02).toFixed(3) + ')';

      /* Incoming caption condenses from frosted blur with subtle title -> subtitle stagger (matching frame_06_5.10s!) */
      var cInK = clamp((p - 0.34) / 0.64, 0, 1);
      var cInEase = 1 - Math.pow(1 - cInK, 2.6);
      var subDelayK = clamp((p - 0.43) / 0.57, 0, 1);
      var subEase = 1 - Math.pow(1 - subDelayK, 2.5);
      capSlots[inBuf].style.opacity = cInEase.toFixed(3);
      capSlots[inBuf].style.filter = 'blur(' + ((1 - cInEase) * 10.5).toFixed(2) + 'px)';
      capSlots[inBuf].style.transform = 'translateY(' + ((1 - cInEase) * -3.5).toFixed(1) + 'px)';
      var subNode = capSlots[inBuf].querySelector('.gw-sub');
      if (subNode) subNode.style.opacity = (0.2 + 0.8 * subEase).toFixed(3);

      if (p >= 1) {
        trans.active = false;
        artCvs[outBuf].style.opacity = '0';
        artCvs[inBuf].style.opacity = '1';
        artCvs[inBuf].style.filter = 'blur(0px)';
        artCvs[inBuf].style.transform = 'scale(1.015)';
        bgSlots[outBuf].style.opacity = '0';
        bgSlots[inBuf].style.opacity = '1';
        bgSlots[inBuf].style.transform = 'scale(1.04)';
        capSlots[outBuf].style.opacity = '0';
        capSlots[inBuf].style.opacity = '1';
        capSlots[inBuf].style.filter = 'blur(0px)';
        capSlots[inBuf].style.transform = 'none';
        if (subNode) subNode.style.opacity = '1';
      }
    }

    function tick(now) {
      if (dead) return;
      rafId = requestAnimationFrame(tick);
      var dt = Math.min(0.05, Math.max(0.001, (now - lastFrame) / 1000));
      lastFrame = now;
      if (document.hidden) return;
      timeSec += dt;

      /* Auto focus-pull loop (matches the 13s 3-card loop ~4.25s per artwork in the reference video) */
      var hostPlay = !!(hooks.isPlaying && hooks.isPlaying());
      var spd = (hooks.getSpeed && hooks.getSpeed()) || 1;
      if ((autoPref || hostPlay) && !dragging && !trans.active && deck.length > 1) {
        holdTimer += dt * spd;
        if (holdTimer >= 3.35) {
          holdTimer = 0;
          goTo(activeIdx + 1);
        }
      }

      stepTransition(dt);
      animateFluidBackdrop();

      /* Adaptive resting baseline & smooth 3D gyroscope parallax */
      if (gyroPref && gyro.hasSignal && gyro.baseLr !== null && !dragging) {
        var absLr = Math.abs(gyro.deltaLr);
        if (absLr < 8.5) {
          /* Gently follow natural hand posture drift while inside neutral zone */
          var driftK = Math.min(1, dt * 0.48);
          gyro.baseLr += (gyro.rawLr - gyro.baseLr) * driftK;
          gyro.baseFb += (gyro.rawFb - gyro.baseFb) * driftK;
          gyro.extremeSince = 0;
        } else if (absLr > 34) {
          /* If user shifts posture (e.g. lies sideways) for >2.2s, smoothly re-center */
          gyro.extremeSince = (gyro.extremeSince || now) ;
          if (now - gyro.extremeSince > 2200) {
            gyro.baseLr += (gyro.rawLr - gyro.baseLr) * Math.min(1, dt * 1.8);
            gyro.baseFb += (gyro.rawFb - gyro.baseFb) * Math.min(1, dt * 1.8);
          }
        } else {
          gyro.extremeSince = 0;
        }
        var gEase = Math.min(1, dt * 11);
        gyro.smoothLr += (clamp(gyro.deltaLr * 0.68, -17, 17) - gyro.smoothLr) * gEase;
        gyro.smoothFb += (clamp(-gyro.deltaFb * 0.52, -14, 14) - gyro.smoothFb) * gEase;

        /* Update subtle tilt gauge when phone is tilted */
        var showGauge = absLr > 3.2;
        tiltGauge.classList.toggle('vis', showGauge);
        if (showGauge) {
          var normTilt = clamp(gyro.deltaLr / GYRO_SWITCH_DEG, -1.18, 1.18);
          tiltDot.style.transform = 'translateX(' + (normTilt * 37).toFixed(1) + 'px)';
        }
      } else {
        gyro.smoothLr *= Math.exp(-6 * dt);
        gyro.smoothFb *= Math.exp(-6 * dt);
        tiltGauge.classList.remove('vis');
      }

      /* Spring 3D pose + subtle floating buoyancy + gyroscope attitude */
      tilt.impulse *= Math.exp(-3.4 * dt);
      tilt.rollKick *= Math.exp(-5.5 * dt);
      var breathX = Math.sin(timeSec * 1.05) * 1.15 + Math.sin(tilt.impulse * Math.PI) * 1.6;
      var breathY = Math.cos(timeSec * 0.82) * 1.35 - Math.sin(tilt.impulse * Math.PI) * 1.2;
      var breathZ = Math.sin(timeSec * 0.68) * 0.45;

      var kSpring = Math.min(1, dt * 9.5);
      tilt.rx += (tilt.trx - tilt.rx) * kSpring;
      tilt.ry += (tilt.try_ - tilt.ry) * kSpring;
      if (!dragging) {
        tilt.trx *= Math.exp(-4.2 * dt);
        tilt.try_ *= Math.exp(-4.2 * dt);
      }

      var rx = BASE_RX + breathX + tilt.rx + gyro.smoothFb;
      var ry = BASE_RY + breathY + tilt.ry + gyro.smoothLr + tilt.rollKick;
      var rz = BASE_RZ + breathZ + gyro.smoothLr * 0.12;
      pose.style.transform =
        'rotateZ(' + rz.toFixed(2) + 'deg) rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg)';

      /* Glide overhead dome sky reflection & shadow subtly with 3D tilt + gyro */
      var totalRy = tilt.ry + gyro.smoothLr + breathY;
      var totalRx = tilt.rx + gyro.smoothFb + breathX;
      var skyShiftX = totalRy * 1.8;
      var skyShiftY = -totalRx * 1.2;
      skySvg.style.transform = 'translate3d(' + skyShiftX.toFixed(1) + 'px,' + skyShiftY.toFixed(1) + 'px,0)';
      shadowEl.style.transform = 'translate3d(' + (-18 - totalRy * 0.7).toFixed(1) + 'px,' + (26 + totalRx * 0.7).toFixed(1) + 'px,-46px)';
    }

    /* Pointer & keyboard interactions */
    function onPointerDown(e) {
      if (e.target.closest('.gw-hud') || e.target.closest('#cm-bar') || e.target.closest('#xl')) return;
      dragging = true;
      ptrId = e.pointerId;
      downX = lastX = e.clientX;
      downY = lastY = e.clientY;
      movedDist = 0;
      downAt = performance.now();
      try { stage.setPointerCapture(e.pointerId); } catch (er) {}
    }

    function onPointerMove(e) {
      var rect = stage.getBoundingClientRect();
      if (!dragging) {
        var nx = ((e.clientX - rect.left) / Math.max(1, rect.width) - 0.5) * 2;
        var ny = ((e.clientY - rect.top) / Math.max(1, rect.height) - 0.5) * 2;
        tilt.trx = clamp(-ny * 6.5, -14, 14);
        tilt.try_ = clamp(nx * 8.5, -16, 16);
        return;
      }
      if (e.pointerId !== ptrId) return;
      var dx = e.clientX - lastX, dy = e.clientY - lastY;
      lastX = e.clientX; lastY = e.clientY;
      movedDist += Math.abs(dx) + Math.abs(dy);
      tilt.try_ = clamp(tilt.try_ + dx * 0.14, -24, 24);
      tilt.trx = clamp(tilt.trx - dy * 0.12, -20, 20);
    }

    function onPointerUp(e) {
      if (!dragging || e.pointerId !== ptrId) return;
      dragging = false;
      ptrId = null;
      var totalDx = e.clientX - downX;
      var totalDy = e.clientY - downY;
      var elapsed = performance.now() - downAt;

      if (movedDist >= 38 && Math.hypot(totalDx, totalDy) >= 32) {
        /* Swipe left/up -> next card; swipe right/down -> previous card */
        var dir = (Math.abs(totalDx) > Math.abs(totalDy) ? -totalDx : -totalDy) > 0 ? 1 : -1;
        goTo(activeIdx + dir);
        return;
      }

      if (movedDist < 10 && elapsed < 340) {
        var now = performance.now();
        if (now - lastTapAt < 320) {
          lastTapAt = 0;
          var cur = deck[activeIdx];
          if (cur && cur.rawItem && typeof onPick === 'function') onPick(cur.rawItem);
        } else {
          lastTapAt = now;
          /* Single tap on the glass widget triggers a smooth focus-pull to the next card */
          if (e.target.closest('.gw-rig')) goTo(activeIdx + 1);
        }
      }
    }

    var wheelLockUntil = 0;
    function onWheel(e) {
      if (e.target.closest('#xl')) return;
      e.preventDefault();
      var now = performance.now();
      if (now < wheelLockUntil) return;
      var delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (Math.abs(delta) < 8) return;
      wheelLockUntil = now + 420;
      goTo(activeIdx + (delta > 0 ? 1 : -1));
    }

    function onKeyDown(e) {
      if (/input|textarea|select/i.test((e.target && e.target.tagName) || '') || document.getElementById('xl')) return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        goTo(activeIdx + 1);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        goTo(activeIdx - 1);
      }
    }

    /* Auto-unlock iOS Safari motion permission on first user click/touchend gesture */
    function onUserGestureUnlock() {
      if (gyroPref && needsIosPerm && gyro.permState === 'prompt') {
        requestIosGyroPermission(false);
      }
    }

    hud.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-gw]');
      if (!btn) return;
      e.stopPropagation();
      var act = btn.getAttribute('data-gw');
      if (act === 'prev') goTo(activeIdx - 1);
      else if (act === 'next') goTo(activeIdx + 1);
      else if (act === 'gyro') {
        if (needsIosPerm && gyro.permState !== 'granted') {
          gyroPref = true;
          try { localStorage.setItem('minest.glassGyro', '1'); } catch (er) {}
          requestIosGyroPermission(true);
          return;
        }
        gyroPref = !gyroPref;
        try { localStorage.setItem('minest.glassGyro', gyroPref ? '1' : '0'); } catch (er) {}
        if (gyroPref) {
          recalibrateGyro();
          showToast('已开启陀螺仪切卡 · 左右倾斜即可翻阅');
        } else {
          showToast('已关闭陀螺仪切卡');
        }
        syncHud();
      } else if (act === 'auto') {
        autoPref = !autoPref;
        try { localStorage.setItem('minest.glassAuto', autoPref ? '1' : '0'); } catch (er) {}
        holdTimer = 0;
        syncHud();
      } else if (act === 'showcase') {
        if (!list || !list.length) return;
        showcasePref = !showcasePref;
        try { localStorage.setItem('minest.glassShowcase', showcasePref ? '1' : '0'); } catch (er) {}
        deck = buildDeck();
        showImmediate(0);
      } else if (act === 'open') {
        var cur = deck[activeIdx];
        if (cur && cur.rawItem && typeof onPick === 'function') onPick(cur.rawItem);
      }
    });

    ['pointerdown', 'touchstart'].forEach(function (ev) {
      hud.addEventListener(ev, function (e) { e.stopPropagation(); }, { passive: true });
    });

    stage.addEventListener('pointerdown', onPointerDown);
    stage.addEventListener('pointermove', onPointerMove);
    stage.addEventListener('pointerup', onPointerUp);
    stage.addEventListener('pointercancel', onPointerUp);
    stage.addEventListener('click', onUserGestureUnlock, true);
    stage.addEventListener('touchend', onUserGestureUnlock, { capture: true, passive: true });
    stage.addEventListener('wheel', onWheel, { passive: false });
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('deviceorientation', onDeviceOrientation, { passive: true });
    window.addEventListener('devicemotion', onDeviceMotion, { passive: true });

    var ro = null;
    if (window.ResizeObserver) {
      ro = new ResizeObserver(fit);
      ro.observe(box);
    }
    /* Turning the phone (or coming back to the app): iOS may drop the canvases' pixels, which leaves the stage black —
       once the size has settled, fit again and paint the card in front afresh; the tilt starts from a new zero */
    var reTimer = 0;
    function repaintSoon() {
      clearTimeout(reTimer);
      reTimer = setTimeout(function () {
        if (dead) return;
        try { fit(); if (!trans.active) showImmediate(activeIdx); } catch (e) {}
        gyro.baseLr = null; gyro.baseFb = null; gyro.armed = true;
      }, 380);
    }
    function onVis() { if (!document.hidden) repaintSoon(); }
    window.addEventListener('orientationchange', repaintSoon);
    window.addEventListener('resize', repaintSoon);
    document.addEventListener('visibilitychange', onVis);

    var syncTimer = setInterval(syncHud, 500);

    fit();
    showImmediate(0);
    rafId = requestAnimationFrame(tick);

    return {
      fit: fit,
      destroy: function () {
        dead = true;
        cancelAnimationFrame(rafId);
        clearInterval(syncTimer);
        clearTimeout(toastTimer);
        if (ro) ro.disconnect();
        stage.removeEventListener('pointerdown', onPointerDown);
        stage.removeEventListener('pointermove', onPointerMove);
        stage.removeEventListener('pointerup', onPointerUp);
        stage.removeEventListener('pointercancel', onPointerUp);
        stage.removeEventListener('click', onUserGestureUnlock, true);
        stage.removeEventListener('touchend', onUserGestureUnlock, true);
        stage.removeEventListener('wheel', onWheel);
        document.removeEventListener('keydown', onKeyDown);
        window.removeEventListener('deviceorientation', onDeviceOrientation);
        window.removeEventListener('devicemotion', onDeviceMotion);
        window.removeEventListener('orientationchange', repaintSoon);
        window.removeEventListener('resize', repaintSoon);
        document.removeEventListener('visibilitychange', onVis);
        clearTimeout(reTimer);
        if (stage.parentNode) stage.parentNode.removeChild(stage);
      }
    };
  }

  window.MinestGlassWidgetsMode = { mount: mountMode };
})();
