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
        '#cm-ov.glass #v2-stage{opacity:0.18;z-index:2}',
        '.gw-stage{position:absolute;inset:0;z-index:6;overflow:hidden;user-select:none;-webkit-user-select:none;touch-action:none;font-family:-apple-system,"SF Pro Display","SF Pro Text","PingFang SC","Hiragino Sans GB",system-ui,sans-serif}',
        '.gw-atmo{position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none;z-index:1}',
        '.gw-stage.is-holo .gw-atmo{opacity:0.24}',
        '.gw-vignette{position:absolute;inset:0;z-index:2;pointer-events:none;background:radial-gradient(82% 78% at 50% 47%,transparent 48%,rgba(4,6,10,0.44) 84%,rgba(2,4,7,0.74) 100%)}',
        '.gw-rig{position:absolute;left:50%;top:47.5%;width:440px;height:430px;margin:-215px 0 0 -220px;z-index:8;perspective:1380px;transform-origin:50% 50%;cursor:grab}',
        '.gw-rig:active{cursor:grabbing}',
        '.gw-pose{position:absolute;inset:0;transform-style:preserve-3d;will-change:transform}',
        /* Deep ambient drop shadow floating beneath the crystal slab */
        '.gw-shadow{position:absolute;inset:10px 14px -8px -10px;border-radius:104px;background:radial-gradient(66% 66% at 48% 54%,rgba(0,0,0,0.56),rgba(0,0,0,0.24) 68%,transparent 100%);filter:blur(28px);transform:translate3d(-24px,30px,-62px);pointer-events:none}',
        /* Multi-slice 3D extruded crystal sidewall ( seamless solid molded ~22px optical glass wall on left & bottom ) */
        '.gw-slice{position:absolute;inset:0;border-radius:98px;pointer-events:none;box-sizing:border-box}',
        '.gw-slice-body{background:linear-gradient(138deg,rgba(255,255,255,0.045) 0%,rgba(28,34,40,0.085) 30%,rgba(10,14,18,0.14) 72%,rgba(255,255,255,0.05) 100%);border:0}',
        '.gw-slice-back{background:linear-gradient(145deg,rgba(14,18,22,0.52),rgba(6,9,13,0.68));border:1.5px solid rgba(255,255,255,0.42);box-shadow:inset 2px -2px 12px rgba(255,255,255,0.22),0 16px 34px rgba(0,0,0,0.46)}',
        '.gw-slice-mid{border:0}',
        /* Sidewall vector specular highlights (left extruded wall white slash + bottom curve glint) */
        '.gw-wall-spec{position:absolute;inset:-8px;width:calc(100% + 16px);height:calc(100% + 16px);pointer-events:none;overflow:visible}',
        /* Main top crystal glass face — genuine clear smoked optical crystal transmitting the backdrop */
        '.gw-face{position:absolute;inset:0;border-radius:98px;overflow:hidden;box-sizing:border-box;transform:translateZ(0px);background:linear-gradient(172deg,rgba(255,255,255,0.14) 0%,rgba(160,168,174,0.08) 46%,rgba(30,35,40,0.18) 78%,rgba(16,20,24,0.28) 100%);-webkit-backdrop-filter:blur(34px) saturate(132%);backdrop-filter:blur(34px) saturate(132%);box-shadow:inset 0 1.6px 1px rgba(255,255,255,0.72),inset 0 -1.5px 2px rgba(255,255,255,0.36),inset 2px 0 3px rgba(255,255,255,0.26),inset -1.5px 0 2px rgba(255,255,255,0.34),inset 0 -18px 34px rgba(0,0,0,0.16)}',
        '.gw-stage.is-light-atmo .gw-face{background:linear-gradient(172deg,rgba(255,255,255,0.22) 0%,rgba(190,190,186,0.12) 48%,rgba(72,76,80,0.16) 80%,rgba(44,48,52,0.24) 100%)}',
        '.gw-stage.is-holo .gw-face{border:1px solid rgba(130,235,255,0.55);box-shadow:inset 0 0 28px rgba(90,215,255,0.24),0 0 32px rgba(80,205,255,0.26)}',
        /* Internal horizontal shelf refraction caustics right under the raised dome step */
        '.gw-shelf-caustics{position:absolute;left:26px;right:26px;top:251px;height:34px;pointer-events:none;background:linear-gradient(180deg,rgba(0,0,0,0.22) 0%,rgba(255,255,255,0.10) 24%,rgba(0,0,0,0.11) 50%,rgba(255,255,255,0.06) 76%,transparent 100%);border-radius:12px;opacity:0.86}',
        /* Raised upper convex cabochon dome window */
        '.gw-dome{position:absolute;left:18px;right:18px;top:16px;height:238px;border-radius:82px 82px 26px 26px;overflow:hidden;transform:translateZ(4px);box-sizing:border-box;background:rgba(18,24,30,0.22);box-shadow:0 8px 16px -5px rgba(0,0,0,0.38),0 1.5px 0 rgba(255,255,255,0.44),inset 0 1.5px 2px rgba(255,255,255,0.78),inset 0 -1.5px 2px rgba(255,255,255,0.42)}',
        '.gw-dome-lens{position:absolute;inset:0;transform:translateZ(0)}',
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
        '.gw-hud .gw-sep{width:1px;height:14px;background:rgba(255,255,255,0.15);flex:none}',
        '.gw-hud .gw-cnt{font:600 11px/1 ui-monospace,"SF Mono",Menlo,monospace;color:rgba(226,236,250,0.72);padding:0 4px;letter-spacing:0.05em}',
        '@media (max-width:540px){.gw-rig{top:45.5%}.gw-hud{bottom:calc(env(safe-area-inset-bottom,0px) + 74px);padding:4px 6px;gap:3px}.gw-hud button{height:26px;padding:0 7px;font-size:11px}}'
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

    var atmoCv = document.createElement('canvas');
    atmoCv.className = 'gw-atmo';
    atmoCv.width = 96;
    atmoCv.height = 96;
    stage.appendChild(atmoCv);

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

    /* 12 extruded crystal slices from Z = -54px up to Z = -4.5px with sculpted isometric bevel offset */
    var SLICE_COUNT = 12;
    for (var s = 0; s < SLICE_COUNT; s++) {
      var u = 1 - s / SLICE_COUNT; /* 1 at back, -> 0 near front */
      var z = -u * 52;
      var ox = -u * 13.5;
      var oy = u * 11.5;
      var sl = document.createElement('div');
      sl.className = 'gw-slice ' + (s === 0 ? 'gw-slice-back' : (s === 5 ? 'gw-slice-mid gw-slice-body' : 'gw-slice-body'));
      sl.style.transform = 'translate3d(' + ox.toFixed(1) + 'px,' + oy.toFixed(1) + 'px,' + z.toFixed(1) + 'px)';
      pose.appendChild(sl);
    }

    /* Precision sidewall specular arc along the midpoint of the 3D crystal wall (renders the iconic bright white slash along the curved left crystal wall + bottom lip glint!) */
    var wallSpec = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    wallSpec.setAttribute('viewBox', '-8 -8 456 446');
    wallSpec.setAttribute('class', 'gw-wall-spec');
    wallSpec.style.transform = 'translate3d(-7.5px,6.5px,-27px)';
    wallSpec.innerHTML =
      '<defs>' +
        '<linearGradient id="gw-left-slash" x1="0" y1="0.18" x2="0.12" y2="0.88">' +
          '<stop offset="0%" stop-color="#ffffff" stop-opacity="0"/>' +
          '<stop offset="18%" stop-color="#ffffff" stop-opacity="0.96"/>' +
          '<stop offset="72%" stop-color="#ffffff" stop-opacity="0.92"/>' +
          '<stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>' +
        '</linearGradient>' +
        '<linearGradient id="gw-bot-slash" x1="0.12" y1="1" x2="0.88" y2="0.96">' +
          '<stop offset="0%" stop-color="#ffffff" stop-opacity="0"/>' +
          '<stop offset="22%" stop-color="#ffffff" stop-opacity="0.94"/>' +
          '<stop offset="64%" stop-color="#ffffff" stop-opacity="0.68"/>' +
          '<stop offset="92%" stop-color="#ffffff" stop-opacity="0.9"/>' +
          '<stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>' +
        '</linearGradient>' +
      '</defs>' +
      /* Left extruded glass wall bright specular ribbon */
      '<path d="M 1.5 112 L 1.5 308" fill="none" stroke="url(#gw-left-slash)" stroke-width="3.6" stroke-linecap="round"/>' +
      /* Bottom-left curved meniscus crescent */
      '<path d="M 22 386 Q 40 415 78 426" fill="none" stroke="#ffffff" stroke-opacity="0.92" stroke-width="3.8" stroke-linecap="round"/>' +
      /* Bottom extruded rim specular streak */
      '<path d="M 94 428.8 L 350 428.8 Q 398 428.8 425 392" fill="none" stroke="url(#gw-bot-slash)" stroke-width="2.8" stroke-linecap="round"/>';
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

    /* Discreet floating HUD controls */
    var hud = document.createElement('div');
    hud.className = 'gw-hud';
    hud.innerHTML =
      '<button type="button" class="gw-ic" data-gw="prev" title="上一张 (←)" aria-label="上一张">‹</button>' +
      '<span class="gw-cnt">01 / 01</span>' +
      '<button type="button" class="gw-ic" data-gw="next" title="下一张 (→)" aria-label="下一张">›</button>' +
      '<i class="gw-sep"></i>' +
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
    var tilt = { rx: 0, ry: 0, trx: 0, try_: 0, vx: 0, vy: 0, impulse: 0 };
    var fitScale = 1;
    var dragging = false, ptrId = null, downX = 0, downY = 0, lastX = 0, lastY = 0, movedDist = 0, downAt = 0, lastTapAt = 0;
    var dead = false, rafId = 0, lastFrame = performance.now(), timeSec = 0;

    function syncHud() {
      var total = Math.max(1, deck.length);
      cntEl.textContent = pad2(activeIdx + 1) + ' / ' + pad2(total);
      var hostPlay = !!(hooks.isPlaying && hooks.isPlaying());
      autoBtn.classList.toggle('on', autoPref || hostPlay);
      var usingMuseum = showcasePref || !list || !list.length;
      showBtn.classList.toggle('on', usingMuseum);
      showBtn.querySelector('span').textContent = (!list || !list.length) ? '典藏名画' : (usingMuseum ? '名画典藏' : '看板卡片');
      openBtn.style.display = (deck[activeIdx] && deck[activeIdx].rawItem) ? '' : 'none';
      stage.classList.toggle('is-holo', !!(hooks.isHolo && hooks.isHolo()));
    }

    function renderItemToBuffer(item, bufIdx, updateTargetPalette) {
      var cv = artCvs[bufIdx];
      if (item.src) {
        var cached = imgCache[item.src];
        if (cached && cached.complete && cached.naturalWidth > 0) {
          drawCoverImageToCanvas(cv, cached);
          item.atmoRgb = sampleCanvasPalette(cv, item.painter);
          if (updateTargetPalette) tgtAtmo = item.atmoRgb.map(function (c) { return c.slice(); });
          updateLightClass();
          return;
        }
        /* Paint rich museum fallback immediately while image loads */
        paintMasterpiece(cv, item.painter, item.seed);
        if (!cached) {
          var im = new Image();
          im.crossOrigin = 'anonymous';
          imgCache[item.src] = im;
          im.onload = function () {
            if (dead) return;
            if (deck[activeIdx] === item) {
              drawCoverImageToCanvas(artCvs[frontBuf], im);
              item.atmoRgb = sampleCanvasPalette(artCvs[frontBuf], item.painter);
              tgtAtmo = item.atmoRgb.map(function (c) { return c.slice(); });
              updateLightClass();
            }
          };
          im.src = item.src;
        }
      } else {
        paintMasterpiece(cv, item.painter, item.seed);
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
      capSlots[0].style.opacity = '1';
      capSlots[0].style.filter = 'blur(0px)';
      capSlots[0].style.transform = 'none';
      capSlots[1].style.opacity = '0';
      trans.active = false;
      holdTimer = 0;
      syncHud();
      paintAtmosphere();
    }

    function goTo(nextIdx) {
      if (deck.length <= 1) return;
      var targetIdx = mod(nextIdx, deck.length);
      if (targetIdx === activeIdx && !trans.active) return;

      /* If mid-transition, snap current incoming buffer to become outgoing cleanly */
      if (trans.active) {
        artCvs[1 - frontBuf].style.opacity = '0';
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

    function paintAtmosphere() {
      var g = atmoCv.getContext('2d');
      var w = atmoCv.width, h = atmoCv.height;
      g.clearRect(0, 0, w, h);
      /* Base blend */
      var c0 = curAtmo[0], c1 = curAtmo[1], c2 = curAtmo[2], c3 = curAtmo[3];
      var base = g.createLinearGradient(0, 0, w, h);
      base.addColorStop(0, 'rgb(' + Math.round(c0[0]) + ',' + Math.round(c0[1]) + ',' + Math.round(c0[2]) + ')');
      base.addColorStop(0.52, 'rgb(' + Math.round((c1[0] + c2[0]) * 0.5) + ',' + Math.round((c1[1] + c2[1]) * 0.5) + ',' + Math.round((c1[2] + c2[2]) * 0.5) + ')');
      base.addColorStop(1, 'rgb(' + Math.round(c3[0]) + ',' + Math.round(c3[1]) + ',' + Math.round(c3[2]) + ')');
      g.fillStyle = base;
      g.fillRect(0, 0, w, h);

      var driftX = Math.sin(timeSec * 0.42) * 6, driftY = Math.cos(timeSec * 0.35) * 5;
      var spots = [
        [w * 0.24 + driftX, h * 0.24 + driftY, w * 0.78, c0],
        [w * 0.78 - driftX, h * 0.26 + driftY, w * 0.76, c1],
        [w * 0.26 + driftY, h * 0.80 - driftX, w * 0.78, c2],
        [w * 0.78 - driftY, h * 0.80 + driftX, w * 0.75, c3]
      ];
      for (var i = 0; i < spots.length; i++) {
        var s = spots[i], col = s[3];
        var rg = g.createRadialGradient(s[0], s[1], 2, s[0], s[1], s[2]);
        rg.addColorStop(0, 'rgba(' + Math.round(col[0]) + ',' + Math.round(col[1]) + ',' + Math.round(col[2]) + ',0.78)');
        rg.addColorStop(1, 'rgba(' + Math.round(col[0]) + ',' + Math.round(col[1]) + ',' + Math.round(col[2]) + ',0)');
        g.fillStyle = rg;
        g.fillRect(0, 0, w, h);
      }
    }

    function fit() {
      var W = box.clientWidth || window.innerWidth || 800;
      var H = box.clientHeight || window.innerHeight || 600;
      /* Reserve room for top bar (#v2-top / #cm-bar) and bottom deck (#v2-deck + .gw-hud) */
      var availW = W * 0.80;
      var availH = Math.max(220, H - 210);
      /* Account for rotated bounding box (~510px effective diagonal span) */
      fitScale = clamp(Math.min(availW / 515, availH / 495), 0.48, 1.18);
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

      /* Smooth atmospheric palette interpolation */
      var kAtmo = Math.min(1, dt * 2.6);
      var atmoChanged = false;
      for (var ci = 0; ci < 4; ci++) {
        for (var ch = 0; ch < 3; ch++) {
          var diff = tgtAtmo[ci][ch] - curAtmo[ci][ch];
          if (Math.abs(diff) > 0.15) {
            curAtmo[ci][ch] += diff * kAtmo;
            atmoChanged = true;
          }
        }
      }
      if (atmoChanged || ((timeSec * 30) | 0) % 2 === 0) paintAtmosphere();

      /* Spring 3D pose + subtle floating buoyancy */
      tilt.impulse *= Math.exp(-3.4 * dt);
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

      var rx = BASE_RX + breathX + tilt.rx;
      var ry = BASE_RY + breathY + tilt.ry;
      var rz = BASE_RZ + breathZ;
      pose.style.transform =
        'rotateZ(' + rz.toFixed(2) + 'deg) rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg)';

      /* Glide overhead dome sky reflection & shadow subtly with 3D tilt */
      var skyShiftX = (tilt.ry + breathY) * 1.8;
      var skyShiftY = -(tilt.rx + breathX) * 1.2;
      skySvg.style.transform = 'translate3d(' + skyShiftX.toFixed(1) + 'px,' + skyShiftY.toFixed(1) + 'px,0)';
      shadowEl.style.transform = 'translate3d(' + (-18 - tilt.ry * 0.7).toFixed(1) + 'px,' + (26 + tilt.rx * 0.7).toFixed(1) + 'px,-46px)';
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

    hud.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-gw]');
      if (!btn) return;
      e.stopPropagation();
      var act = btn.getAttribute('data-gw');
      if (act === 'prev') goTo(activeIdx - 1);
      else if (act === 'next') goTo(activeIdx + 1);
      else if (act === 'auto') {
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
    stage.addEventListener('wheel', onWheel, { passive: false });
    document.addEventListener('keydown', onKeyDown);

    var ro = null;
    if (window.ResizeObserver) {
      ro = new ResizeObserver(fit);
      ro.observe(box);
    }

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
        if (ro) ro.disconnect();
        stage.removeEventListener('pointerdown', onPointerDown);
        stage.removeEventListener('pointermove', onPointerMove);
        stage.removeEventListener('pointerup', onPointerUp);
        stage.removeEventListener('pointercancel', onPointerUp);
        stage.removeEventListener('wheel', onWheel);
        document.removeEventListener('keydown', onKeyDown);
        if (stage.parentNode) stage.parentNode.removeChild(stage);
      }
    };
  }

  window.MinestGlassWidgetsMode = { mount: mountMode };
})();
