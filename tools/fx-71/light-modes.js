  // ---------------------------------------------------------------- 71: aurora · meteor · disco · gallery
  // Three quieter rooms than lasers / firework / spotlight, made for reading the board under them:
  //   aurora  — curtains of northern light drift across the top of a starry room;
  //   meteor  — a night sky with shooting stars; tap empty space to send one there;
  //   disco   — a mirror ball turns overhead and throws coloured dots round the room, on the beat;
  //   gallery — midnight art gallery with pull-cord switch, pixel-accurate local flashlight
  //             illumination, real SVG RGB-dispersion liquid-glass lens, girl & glowing-eyed Pepper.
  var xfx = { stars: null, sw: 0, sh: 0, meteors: [], glows: [], next: 0.4, strips: {}, dots: null, sprites: {} };
  var XFX_CALM = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  function xfxReset() { xfx.meteors.length = 0; xfx.glows.length = 0; xfx.next = 0.4; galSyncActive(); }
  function xfxStars() {
    if (xfx.stars && xfx.sw === W && xfx.sh === H) return xfx.stars;
    var n = Math.round(clamp(W * H / 5200, 40, 170)), a = [];
    for (var i = 0; i < n; i++) a.push({ x: Math.random() * W, y: Math.random() * H, r: rnd(0.5, 1.5), ph: rnd(0, 6.28), sp: rnd(0.6, 2.2), h: pick([212, 212, 212, 44, 190]) });
    xfx.stars = a; xfx.sw = W; xfx.sh = H;
    return a;
  }
  function xfxDrawStars(c, k, maxY) {
    var st = xfxStars();
    for (var i = 0; i < st.length; i++) {
      var s = st[i];
      if (s.y > maxY) continue;
      var tw = XFX_CALM ? 0.8 : 0.45 + 0.55 * Math.sin(clock * s.sp + s.ph);
      c.globalAlpha = k * tw * (1 - 0.6 * s.y / maxY);
      c.fillStyle = 'hsl(' + s.h + ',70%,88%)';
      c.beginPath(); c.arc(s.x, s.y, s.r, 0, 6.2832); c.fill();
    }
  }
  // a soft round dot of one hue, drawn once and stamped wherever it is needed
  function xfxSprite(h) {
    var s = xfx.sprites[h];
    if (s) return s;
    s = document.createElement('canvas'); s.width = s.height = 64;
    var g = s.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'hsla(' + h + ',100%,86%,1)');
    gr.addColorStop(0.45, 'hsla(' + h + ',100%,62%,.42)');
    gr.addColorStop(1, 'hsla(' + h + ',100%,55%,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    xfx.sprites[h] = s;
    return s;
  }

  // ---- aurora
  var AUR = [{ h: 150, y: 0.09, a: 1, sp: 0.11, k: 1 }, { h: 174, y: 0.15, a: 0.8, sp: -0.08, k: 1.6 }, { h: 286, y: 0.05, a: 0.62, sp: 0.06, k: 2.3 }];
  function auroraStrip(h) {
    var s = xfx.strips[h];
    if (s) return s;
    s = document.createElement('canvas'); s.width = 2; s.height = 128;
    var g = s.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 128);
    gr.addColorStop(0, 'hsla(' + (h + 46) + ',90%,60%,0)');
    gr.addColorStop(0.5, 'hsla(' + (h + 24) + ',92%,60%,.3)');
    gr.addColorStop(0.84, 'hsla(' + h + ',96%,64%,.86)');
    gr.addColorStop(1, 'hsla(' + h + ',96%,70%,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 2, 128);
    xfx.strips[h] = s;
    return s;
  }
  function drawAurora(c, dt) {
    var ga = c.globalAlpha, t = XFX_CALM ? 12 : clock;
    c.fillStyle = 'rgba(2,6,20,' + roomA(0.76).toFixed(3) + ')';
    c.fillRect(0, 0, W, H);
    liftFront(c, 14);
    c.save();
    c.globalCompositeOperation = 'lighter';
    xfxDrawStars(c, ga * 0.85, H * 0.8);
    var step = W > 700 ? 8 : 6, kb = stageKind === 'board' ? 0.5 : 0.9;
    for (var k = 0; k < AUR.length; k++) {
      var L = AUR[k], img = auroraStrip(L.h);
      for (var x = 0; x < W + step; x += step) {
        var u = x / W;
        var n = Math.sin(u * 5.2 * L.k + t * L.sp * 6) * 0.5 + Math.sin(u * 11.7 + t * L.sp * 9 + k) * 0.28 + Math.sin(u * 2.1 - t * 0.07 + k * 2) * 0.6;
        var top = H * (L.y - 0.1 + 0.05 * n), hgt = H * (0.42 + 0.13 * Math.sin(u * 7.3 * L.k + t * 0.23 + k * 1.7) + 0.08 * n);
        var a = 0.5 + 0.5 * Math.sin(u * 9.1 + t * 0.31 * L.k + k * 3);
        c.globalAlpha = ga * L.a * (0.22 + 0.78 * a * a) * kb;
        c.drawImage(img, x, top, step, hgt);
      }
    }
    c.restore();
    c.globalAlpha = ga;
  }

  // ---- meteor
  function meteorSpawn(tx, ty) {
    var dir = Math.random() < 0.5 ? -1 : 1, ang = rnd(0.42, 0.9), sp = rnd(0.85, 1.4) * Math.max(W, H);
    var m = { vx: Math.cos(ang) * sp * dir, vy: Math.sin(ang) * sp, life: 0, max: rnd(0.75, 1.2), h: pick([205, 190, 48, 268]), aimed: tx != null };
    if (m.aimed) { m.max = 0.8; m.x = tx - m.vx * m.max; m.y = ty - m.vy * m.max; }
    else { m.x = dir > 0 ? rnd(-0.1, 0.6) * W : rnd(0.4, 1.1) * W; m.y = rnd(-0.12, 0.28) * H; }
    xfx.meteors.push(m);
  }
  function meteorTo(tx, ty) { meteorSpawn(tx, ty); }
  function drawMeteor(c, dt) {
    var ga = c.globalAlpha;
    if (!XFX_CALM) {
      xfx.next -= dt;
      if (xfx.next <= 0) { meteorSpawn(); if (Math.random() < 0.22) meteorSpawn(); xfx.next = rnd(0.9, 2.3); }
    }
    c.fillStyle = 'rgba(1,3,16,' + roomA(0.8).toFixed(3) + ')';
    c.fillRect(0, 0, W, H);
    liftFront(c, 14);
    c.save();
    c.globalCompositeOperation = 'lighter';
    xfxDrawStars(c, ga, H);
    c.lineCap = 'round';
    for (var i = xfx.meteors.length - 1; i >= 0; i--) {
      var m = xfx.meteors[i];
      m.life += dt; m.x += m.vx * dt; m.y += m.vy * dt;
      if (m.life >= m.max) {
        xfx.glows.push({ x: m.x, y: m.y, life: 0, max: m.aimed ? 0.7 : 0.4, rgb: hsl2rgb(m.h, 90, 72), big: m.aimed });
        xfx.meteors.splice(i, 1);
        continue;
      }
      var p = m.life / m.max, a = Math.pow(Math.sin(Math.PI * Math.min(1, p * 1.15)), 0.6), tl = 0.2 * smooth(m.life / 0.18);
      var x0 = m.x - m.vx * tl, y0 = m.y - m.vy * tl;
      var g = c.createLinearGradient(m.x, m.y, x0, y0);
      g.addColorStop(0, 'hsla(' + m.h + ',100%,94%,1)');
      g.addColorStop(0.25, 'hsla(' + m.h + ',100%,72%,.55)');
      g.addColorStop(1, 'hsla(' + m.h + ',100%,60%,0)');
      c.globalAlpha = ga * a;
      c.strokeStyle = g; c.lineWidth = 3;
      c.beginPath(); c.moveTo(m.x, m.y); c.lineTo(x0, y0); c.stroke();
      c.drawImage(xfxSprite(m.h), m.x - 13, m.y - 13, 26, 26);
    }
    for (var j = xfx.glows.length - 1; j >= 0; j--) {
      var gl = xfx.glows[j];
      gl.life += dt;
      if (gl.life >= gl.max) { xfx.glows.splice(j, 1); continue; }
      var gk = Math.pow(1 - gl.life / gl.max, 2), gr = (gl.big ? 120 : 54) * (0.5 + 0.5 * gl.life / gl.max);
      var rg = c.createRadialGradient(gl.x, gl.y, 0, gl.x, gl.y, gr);
      rg.addColorStop(0, 'rgba(' + gl.rgb.join(',') + ',' + (0.75 * gk).toFixed(3) + ')');
      rg.addColorStop(1, 'rgba(' + gl.rgb.join(',') + ',0)');
      c.globalAlpha = ga;
      c.fillStyle = rg; c.fillRect(gl.x - gr, gl.y - gr, gr * 2, gr * 2);
    }
    c.restore();
    c.globalAlpha = ga;
  }

  // ---- disco
  var DISCO_HUES = [322, 198, 48, 274, 162];
  function discoBall() { return { x: W / 2, y: Math.max(34, H * 0.085), r: clamp(Math.min(W, H) * 0.045, 14, 30) }; }
  function discoBeat() { return XFX_CALM ? 0.8 : 0.62 + 0.38 * Math.exp(-((clock * 2) % 1) * 5); }
  function drawDisco(c, dt) {
    var ga = c.globalAlpha, B = discoBall(), beat = discoBeat(), rot = XFX_CALM ? 1 : clock * 0.42, i;
    if (!xfx.dots) {
      xfx.dots = [];
      for (i = 0; i < 48; i++) xfx.dots.push({ th: rnd(0, 6.2832), el: rnd(0.08, 1), h: pick(DISCO_HUES), s: rnd(0.7, 1.3) });
    }
    c.fillStyle = 'rgba(6,2,18,' + roomA(0.8).toFixed(3) + ')';
    c.fillRect(0, 0, W, H);
    liftFront(c, 14);
    c.save();
    c.globalCompositeOperation = 'lighter';
    for (i = 0; i < xfx.dots.length; i++) {
      var d = xfx.dots[i], a = d.th + rot, ca = Math.cos(a), depth = 0.5 + 0.5 * Math.sin(a);
      var x = B.x + ca * W * 0.62 * (0.4 + 0.6 * d.el), y = B.y + d.el * H * 0.95 + Math.sin(a) * H * 0.07;
      var r = (5 + 9 * d.el) * d.s * (0.7 + 0.5 * depth), rx = r * (1.6 + Math.abs(ca) * 1.4), ry = r * 1.6;
      c.globalAlpha = ga * beat * (0.22 + 0.62 * depth);
      c.drawImage(xfxSprite(d.h), x - rx, y - ry, rx * 2, ry * 2);
      if (i % 6 === 0) {
        c.globalAlpha = ga * beat * 0.07 * depth;
        c.strokeStyle = 'hsl(' + d.h + ',100%,72%)'; c.lineWidth = 1.2;
        c.beginPath(); c.moveTo(B.x, B.y); c.lineTo(x, y); c.stroke();
      }
    }
    c.globalAlpha = ga * (0.35 + 0.4 * beat);
    c.drawImage(xfxSprite(DISCO_HUES[Math.floor(clock * 0.5) % DISCO_HUES.length]), B.x - B.r * 3.4, B.y - B.r * 3.4, B.r * 6.8, B.r * 6.8);
    c.restore();
    c.save();
    c.globalAlpha = ga;
    c.strokeStyle = 'rgba(200,205,220,.55)'; c.lineWidth = 1;
    c.beginPath(); c.moveTo(B.x, 0); c.lineTo(B.x, B.y - B.r); c.stroke();
    var bg = c.createRadialGradient(B.x - B.r * 0.35, B.y - B.r * 0.4, B.r * 0.1, B.x, B.y, B.r);
    bg.addColorStop(0, '#f4f6fb'); bg.addColorStop(0.55, '#8d93a6'); bg.addColorStop(1, '#2a2d3a');
    c.fillStyle = bg;
    c.beginPath(); c.arc(B.x, B.y, B.r, 0, 6.2832); c.fill();
    c.save();
    c.beginPath(); c.arc(B.x, B.y, B.r, 0, 6.2832); c.clip();
    c.strokeStyle = 'rgba(10,12,24,.42)'; c.lineWidth = 0.8;
    for (i = -3; i <= 3; i++) {
      var ly0 = B.y + (i / 4) * B.r;
      c.beginPath(); c.moveTo(B.x - B.r, ly0); c.lineTo(B.x + B.r, ly0); c.stroke();
      var mx = Math.sin(rot * 1.4 + i * 0.9) * B.r;
      c.beginPath(); c.ellipse(B.x, B.y, Math.max(0.5, Math.abs(mx)), B.r, 0, 0, 6.2832); c.stroke();
    }
    for (i = 0; i < 5; i++) {
      var ga2 = rot * 2.2 + i * 1.3, gx = B.x + Math.cos(ga2) * B.r * 0.62, gy = B.y + Math.sin(ga2 * 0.7 + i) * B.r * 0.55;
      c.globalAlpha = ga * (0.35 + 0.65 * Math.abs(Math.sin(ga2 * 1.7))) * beat;
      c.fillStyle = '#fff';
      c.fillRect(gx - 1.5, gy - 1.5, 3, 3);
    }
    c.restore();
    c.restore();
    c.globalAlpha = ga;
  }

  // what the rooms shine on the glass cards
  function xfxLights(Ls) {
    if (mode === 'aurora') {
      var at = XFX_CALM ? 12 : clock;
      Ls.push({ x: W * (0.5 + 0.36 * Math.sin(at * 0.21)), y: -H * 0.08, z: 620, rgb: hsl2rgb(158 + 44 * Math.sin(at * 0.17), 90, 64), p: 0.78, kind: 'burst' });
    } else if (mode === 'meteor') {
      for (var i = 0; i < xfx.meteors.length; i++) {
        var m = xfx.meteors[i], a = Math.sin(Math.PI * Math.min(1, m.life / m.max));
        if (a > 0.05) Ls.push({ x: m.x, y: m.y, z: 420, rgb: hsl2rgb(m.h, 90, 74), p: 0.9 * a, kind: 'burst' });
      }
      for (var j = 0; j < xfx.glows.length; j++) {
        var g = xfx.glows[j], ga = Math.pow(1 - g.life / g.max, 1.6);
        if (ga > 0.04) Ls.push({ x: g.x, y: g.y, z: 300, rgb: g.rgb, p: (g.big ? 1.2 : 0.7) * ga, kind: 'burst' });
      }
    } else if (mode === 'disco') {
      var B = discoBall();
      Ls.push({ x: B.x, y: B.y, z: 300, rgb: hsl2rgb(DISCO_HUES[Math.floor(clock * 0.5) % DISCO_HUES.length], 95, 66), p: 0.95 * discoBeat(), kind: 'burst' });
    } else if (mode === 'gallery') {
      galPushLights(Ls);
    }
  }

  // ---------------------------------------------------------------- 72: gallery (In-App Art Gallery)
  // Pure flashlight-driven local illumination + SVG Liquid-Glass RGB Dispersion Lens:
  //   · NO lamps on cards — everything outside the flashlight beam stays in deep midnight-navy
  //     night-blueprint shadow via a GPU-masked backdrop-filter veil (.fbfx-gal-darkveil);
  //   · ONLY the exact pixel footprint illuminated by the girl's handheld flashlight shines in
  //     100% vivid full color (even across partial card regions!), with real-time directional
  //     cast shadows on nearby cards and a genuine SVG feDisplacementMap RGB-dispersion glass
  //     meniscus rim around the spotlight edge;
  //   · Top-right golden pull-cord switch with spring physics toggles Night Gallery ("Lights off")
  //     and Day Gallery ("Lights on"), accompanied by the flashlight girl & glowing-eyed Pepper.
  var GAL_LOUPE_SZ = 220;
  var gal = {
    dom: null, darkVeil: null, pill: null, cordHit: null, loupe: null, bubble: null, dogBtn: null, svgFilter: null,
    inited: false, active: false,
    night: false, darkMix: 0,
    autoPulled: false, enterT: 0,
    pullY: 0, pullVy: 0, pendAng: 0, pendVel: 0,
    draggingCord: false, cordDragId: null, cordStartY: 0, cordStartX: 0, cordPulled: false,
    fx: 0, fy: 0, fvx: 0, fvy: 0,
    hasPtr: false, ptrX: -1, ptrY: -1, ptrAt: -10,
    sayText: 'Pepper wanted tuna.', sayTimer: 0, lineIdx: 0,
    dogHop: 0, motes: [], styledCards: []
  };
  var GAL_NIGHT_LINES = [
    'Pepper wanted tuna.',
    'Shine the light anywhere to inspect!',
    'Pull the yellow cord to turn lights on.'
  ];
  var GAL_DAY_LINES = [
    "Oh. It's just us.",
    'Pull the cord for night gallery!'
  ];

  function galEnsurePrismSvg() {
    if (gal.svgFilter && gal.svgFilter.isConnected) return;
    var existing = document.getElementById('fbfx-gal-prism-svg');
    if (existing) { gal.svgFilter = existing; return; }

    // Generate spherical meniscus ring displacement map (undistorted sharp reading core,
    // smooth optical glass bevel at 0.56..0.96 radius that bends & splits R/G/B!)
    var S = GAL_LOUPE_SZ, half = S / 2;
    var mapCv = document.createElement('canvas');
    mapCv.width = S; mapCv.height = S;
    var mctx = mapCv.getContext('2d');
    var img = mctx.createImageData(S, S), d = img.data;
    for (var y = 0; y < S; y++) {
      for (var x = 0; x < S; x++) {
        var ux = (x + 0.5 - half) / half;
        var uy = (y + 0.5 - half) / half;
        var r = Math.hypot(ux, uy);
        var mag = 0;
        if (r > 0.001 && r < 0.96) {
          if (r < 0.56) {
            // Subtle magnifying dome in the reading center
            mag = -r * 0.12;
          } else {
            // Smooth C1-continuous cosine bell bevel around the edge of the flashlight pool
            var u = (r - 0.56) / 0.40;
            var bell = 0.5 - 0.5 * Math.cos(u * Math.PI * 2);
            mag = -0.067 * (1 - u) + bell * 0.88;
          }
        }
        var nx = r > 0.001 ? ux / r : 0;
        var ny = r > 0.001 ? uy / r : 0;
        var idx = (y * S + x) * 4;
        d[idx]     = Math.round(clamp(128 + 127 * mag * nx, 0, 255));
        d[idx + 1] = Math.round(clamp(128 + 127 * mag * ny, 0, 255));
        d[idx + 2] = 128;
        d[idx + 3] = 255;
      }
    }
    mctx.putImageData(img, 0, 0);
    var mapUrl = mapCv.toDataURL('image/png');

    var NS = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(NS, 'svg');
    svg.id = 'fbfx-gal-prism-svg';
    svg.setAttribute('width', '0');
    svg.setAttribute('height', '0');
    svg.setAttribute('aria-hidden', 'true');
    svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;pointer-events:none';

    var defs = document.createElementNS(NS, 'defs');
    var flt = document.createElementNS(NS, 'filter');
    flt.setAttribute('id', 'fbfx-gal-prism');
    flt.setAttribute('x', '0'); flt.setAttribute('y', '0');
    flt.setAttribute('width', String(S)); flt.setAttribute('height', String(S));
    flt.setAttribute('filterUnits', 'userSpaceOnUse');
    flt.setAttribute('primitiveUnits', 'userSpaceOnUse');
    flt.setAttribute('color-interpolation-filters', 'sRGB');

    function addNode(tag, attrs) {
      var n = document.createElementNS(NS, tag);
      for (var k in attrs) n.setAttribute(k, attrs[k]);
      flt.appendChild(n);
      return n;
    }

    var feImg = addNode('feImage', { x: '0', y: '0', width: String(S), height: String(S), preserveAspectRatio: 'none', result: 'map' });
    feImg.setAttribute('href', mapUrl);

    // 3-channel RGB chromatic dispersion across the curved glass bevel
    var scales = [24, 14, 4];
    var matrices = [
      '1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0',
      '0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0',
      '0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0'
    ];
    for (var c = 0; c < 3; c++) {
      addNode('feDisplacementMap', {
        in: 'SourceGraphic', in2: 'map',
        scale: String(scales[c]),
        xChannelSelector: 'R', yChannelSelector: 'G',
        result: 'disp' + c
      });
      addNode('feColorMatrix', {
        in: 'disp' + c, type: 'matrix',
        values: matrices[c],
        result: 'ch' + c
      });
    }
    addNode('feBlend', { in: 'ch0', in2: 'ch1', mode: 'screen', result: 'rg' });
    addNode('feBlend', { in: 'rg', in2: 'ch2', mode: 'screen' });

    defs.appendChild(flt);
    svg.appendChild(defs);
    document.body.appendChild(svg);
    gal.svgFilter = svg;
  }

  function galSfxCord(toNight) {
    var c = actx(); if (!c) return;
    var t = c.currentTime + 0.005, out = outAt(c, 0.35);
    tone(c, out, 'triangle', t, toNight ? 620 : 520, toNight ? 280 : 780, 0.045, 0.22, 0.002);
    hiss(c, out, t + 0.018, 'bandpass', 2200, 1400, 2.2, 0.035, 0.16, 0.001);
    tone(c, out, 'sine', t + 0.042, toNight ? 190 : 340, toNight ? 120 : 480, 0.07, 0.20, 0.002);
  }
  function galSfxDog() {
    var c = actx(); if (!c) return;
    var t = c.currentTime + 0.005, out = outAt(c, 0.45);
    tone(c, out, 'triangle', t, 380, 560, 0.075, 0.18, 0.004);
    tone(c, out, 'triangle', t + 0.09, 440, 660, 0.085, 0.16, 0.004);
  }
  function galHaptic(kind) {
    try {
      if (window.MinestNative && window.MinestNative.haptic) window.MinestNative.haptic(kind || 'light');
      else if (navigator.vibrate) navigator.vibrate(10);
    } catch (e) {}
  }

  function galSay(txt, holdSec) {
    gal.sayText = txt;
    gal.sayTimer = holdSec || 0;
    if (gal.bubble) {
      gal.bubble.textContent = txt;
      gal.bubble.classList.remove('pop');
      void gal.bubble.offsetWidth;
      gal.bubble.classList.add('pop');
      clearTimeout(galSay._t);
      galSay._t = setTimeout(function () { if (gal.bubble) gal.bubble.classList.remove('pop'); }, 240);
    }
  }

  function galToggleRoom(forceNight) {
    var nextNight = forceNight != null ? !!forceNight : !gal.night;
    gal.night = nextNight;
    gal.pullVy = -360;
    gal.pendVel += (Math.random() < 0.5 ? 1 : -1) * 1.6;
    galSfxCord(nextNight);
    galHaptic('medium');
    galSay(nextNight ? 'Pepper wanted tuna.' : "Oh. It's just us.", 0);
    galSyncClasses();
    kick();
  }

  function galSyncClasses() {
    var rootEl = document.documentElement;
    var on = stageOn && mode === 'gallery';
    rootEl.classList.toggle('fbfx-gallery-on', on);
    rootEl.classList.toggle('fbfx-gallery-night', on && gal.night);
    rootEl.classList.toggle('fbfx-gallery-day', on && !gal.night);
  }

  function galClearCardShadows() {
    for (var i = 0; i < gal.styledCards.length; i++) {
      var el = gal.styledCards[i];
      if (el && el.style) {
        el.style.removeProperty('--gal-shx');
        el.style.removeProperty('--gal-shy');
        el.style.removeProperty('--gal-sha');
      }
    }
    gal.styledCards.length = 0;
  }

  function galCleanup() {
    if (!gal.active && !document.documentElement.classList.contains('fbfx-gallery-on')) return;
    gal.active = false;
    gal.autoPulled = false;
    gal.enterT = 0;
    gal.hasPtr = false;
    var rootEl = document.documentElement;
    rootEl.classList.remove('fbfx-gallery-on', 'fbfx-gallery-night', 'fbfx-gallery-day');
    if (gal.dom) gal.dom.style.display = 'none';
    if (gal.darkVeil) gal.darkVeil.style.opacity = '0';
    if (gal.loupe) gal.loupe.style.opacity = '0';
    galClearCardShadows();
  }

  function galSyncActive() {
    if (!(stageOn && mode === 'gallery')) galCleanup();
    else galSyncClasses();
  }

  function galEnsureDOM() {
    if (!layer) return;
    galEnsurePrismSvg();
    if (gal.dom && gal.dom.parentNode === layer) return;

    var wrap = document.createElement('div');
    wrap.className = 'fbfx-gal-root fbfx-gal-ui';
    wrap.style.display = 'none';

    var darkVeil = document.createElement('div');
    darkVeil.className = 'fbfx-gal-darkveil';

    var pbTop = document.createElement('div'); pbTop.className = 'fbfx-gal-pblur-top';
    var pbBot = document.createElement('div'); pbBot.className = 'fbfx-gal-pblur-bot';
    var loupe = document.createElement('div'); loupe.className = 'fbfx-gal-loupe';

    var pill = document.createElement('button');
    pill.type = 'button';
    pill.className = 'fbfx-gal-pill fbfx-gal-ui day';
    pill.setAttribute('aria-label', 'Toggle Gallery Lights');
    pill.addEventListener('click', function (e) {
      e.preventDefault(); e.stopPropagation();
      galToggleRoom();
    });

    var cord = document.createElement('div');
    cord.className = 'fbfx-gal-cord fbfx-gal-ui';
    cord.title = 'Pull or tap cord to switch gallery lights';
    cord.addEventListener('pointerdown', function (e) {
      e.preventDefault(); e.stopPropagation();
      gal.draggingCord = true;
      gal.cordDragId = e.pointerId;
      gal.cordStartY = e.clientY - gal.pullY * SC;
      gal.cordStartX = e.clientX;
      gal.cordPulled = false;
      gal.pullVy = 0;
      try { cord.setPointerCapture(e.pointerId); } catch (err) {}
      kick();
    });
    cord.addEventListener('pointermove', function (e) {
      if (!gal.draggingCord || e.pointerId !== gal.cordDragId) return;
      e.preventDefault(); e.stopPropagation();
      var dy = (e.clientY - gal.cordStartY) / (SC || 1);
      var dx = (e.clientX - gal.cordStartX) / (SC || 1);
      gal.pullY = clamp(dy, -10, 62);
      gal.pendAng = clamp(-dx * 0.008, -0.38, 0.38);
      if (gal.pullY > 24 && !gal.cordPulled) {
        gal.cordPulled = true;
        galToggleRoom();
      }
      kick();
    });
    var endCord = function (e) {
      if (!gal.draggingCord || e.pointerId !== gal.cordDragId) return;
      e.preventDefault(); e.stopPropagation();
      var wasTap = !gal.cordPulled && Math.abs(gal.pullY) < 12;
      gal.draggingCord = false;
      gal.cordDragId = null;
      if (wasTap && e.type === 'pointerup') galToggleRoom();
      else { gal.pullVy = -260; kick(); }
    };
    cord.addEventListener('pointerup', endCord);
    cord.addEventListener('pointercancel', endCord);
    cord.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); });

    var bubble = document.createElement('button');
    bubble.type = 'button';
    bubble.className = 'fbfx-gal-bubble fbfx-gal-ui';
    bubble.textContent = gal.sayText;
    bubble.addEventListener('click', function (e) {
      e.preventDefault(); e.stopPropagation();
      var pool = gal.night ? GAL_NIGHT_LINES : GAL_DAY_LINES;
      gal.lineIdx = (gal.lineIdx + 1) % pool.length;
      galSay(pool[gal.lineIdx], 4.5);
      galHaptic('selection');
      kick();
    });

    var dogBtn = document.createElement('button');
    dogBtn.type = 'button';
    dogBtn.className = 'fbfx-gal-dog fbfx-gal-ui';
    dogBtn.title = 'Pepper';
    dogBtn.setAttribute('aria-label', 'Pet Pepper the gallery dog');
    dogBtn.addEventListener('click', function (e) {
      e.preventDefault(); e.stopPropagation();
      gal.dogHop = 1;
      galSfxDog();
      galHaptic('light');
      galSay(gal.night ? 'Pepper wanted tuna. 🐟' : 'Pepper likes the gallery!', 3.6);
      kick();
    });

    // Place darkVeil & loupe UNDER canvas `cv` so `cv` draws the girl, beam haze, cord & Pepper crisp on top!
    wrap.appendChild(darkVeil);
    wrap.appendChild(loupe);
    wrap.appendChild(pbTop);
    wrap.appendChild(pbBot);
    wrap.appendChild(pill);
    wrap.appendChild(cord);
    wrap.appendChild(bubble);
    wrap.appendChild(dogBtn);
    layer.insertBefore(wrap, cv);
    // Keep interactive hit controls clickable above cv while visual backdrops sit below cv
    cv.style.zIndex = '5';
    pill.style.zIndex = '6';
    cord.style.zIndex = '6';
    bubble.style.zIndex = '6';
    dogBtn.style.zIndex = '6';

    gal.dom = wrap; gal.darkVeil = darkVeil; gal.pill = pill; gal.cordHit = cord;
    gal.loupe = loupe; gal.bubble = bubble; gal.dogBtn = dogBtn;

    if (!gal.inited) {
      gal.inited = true;
      var trackPtr = function (e) {
        if (!stageOn || mode !== 'gallery') return;
        if (gal.draggingCord) return;
        syncOrigin();
        var px = lx(e.clientX), py = ly(e.clientY);
        if (!inLayer(px, py)) return;
        gal.hasPtr = true;
        gal.ptrX = px; gal.ptrY = py; gal.ptrAt = clock;
      };
      window.addEventListener('pointermove', trackPtr, { passive: true, capture: true });
      window.addEventListener('pointerdown', trackPtr, { passive: true, capture: true });
    }
  }

  function galTopInset() {
    var bar = document.querySelector('.iphone-topbar, header.iphone-topbar, header');
    var br = bar && bar.getBoundingClientRect().height ? lrect(bar.getBoundingClientRect()) : null;
    return br ? Math.max(10, Math.min(H * 0.2, br.bottom + 8)) : 16;
  }

  function galBottomInset() {
    var dock = document.querySelector('.ios-bottom-tab-bar, .mn-bdock');
    var dr = dock && dock.getBoundingClientRect().height ? lrect(dock.getBoundingClientRect()) : null;
    if (dr && dr.top > H * 0.65 && dr.top < H) return Math.max(12, H - dr.top + 6);
    return 14;
  }

  function galUpdateDarkVeilMask(nozX, nozY, fx, fy, R) {
    if (!gal.darkVeil) return;
    // Build a smooth multi-zone optical mask:
    //  1) Primary focal hotspot around (fx, fy): 100% transparent core -> inverse-square penumbra -> dark room
    //  2) Conical beam path stops between the flashlight nozzle and (fx, fy) combined via mask-composite: intersect
    //     so the beam cone itself softly illuminates whatever it crosses, peaking at (fx, fy)!
    var x1 = fx.toFixed(1) + 'px', y1 = fy.toFixed(1) + 'px';
    var rCore = (R * 1.62).toFixed(1) + 'px';
    var mSpot = 'radial-gradient(circle ' + rCore + ' at ' + x1 + ' ' + y1 + ', ' +
      'rgba(0,0,0,0) 0%, ' +
      'rgba(0,0,0,0) 52%, ' +
      'rgba(0,0,0,0.22) 66%, ' +
      'rgba(0,0,0,0.62) 81%, ' +
      'rgba(0,0,0,0.88) 92%, ' +
      'rgba(0,0,0,1) 100%)';

    // Two soft elliptical beam-cone stations between flashlight nozzle and spot so the cone lifts darkness too
    var bx1 = (nozX + (fx - nozX) * 0.68).toFixed(1) + 'px';
    var by1 = (nozY + (fy - nozY) * 0.68).toFixed(1) + 'px';
    var br1 = (R * 0.88).toFixed(1) + 'px';
    var mBeam1 = 'radial-gradient(circle ' + br1 + ' at ' + bx1 + ' ' + by1 + ', ' +
      'rgba(0,0,0,0.32) 0%, rgba(0,0,0,0.68) 62%, rgba(0,0,0,1) 100%)';

    var bx2 = (nozX + (fx - nozX) * 0.38).toFixed(1) + 'px';
    var by2 = (nozY + (fy - nozY) * 0.38).toFixed(1) + 'px';
    var br2 = (R * 0.56).toFixed(1) + 'px';
    var mBeam2 = 'radial-gradient(circle ' + br2 + ' at ' + bx2 + ' ' + by2 + ', ' +
      'rgba(0,0,0,0.52) 0%, rgba(0,0,0,0.82) 65%, rgba(0,0,0,1) 100%)';

    var masks = mSpot + ', ' + mBeam1 + ', ' + mBeam2;
    gal.darkVeil.style.webkitMaskImage = masks;
    gal.darkVeil.style.maskImage = masks;
    gal.darkVeil.style.webkitMaskComposite = 'source-in';
    gal.darkVeil.style.maskComposite = 'intersect';
  }

  function galUpdateCardShadows(fx, fy, R, nightAmt) {
    if (nightAmt < 0.05) { galClearCardShadows(); return; }
    var st = stageEl();
    if (!st) return;
    var its = st.querySelectorAll(cardSel());
    var nextStyled = [];
    for (var i = 0; i < its.length && i < 20; i++) {
      var el = its[i], r = lrect(el.getBoundingClientRect());
      if (r.width < 24 || r.bottom < 0 || r.top > H) continue;
      var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      var dx = cx - fx, dy = cy - fy, dist = Math.hypot(dx, dy);
      var prox = clamp(1 - dist / (R * 3.8), 0, 1);
      var shx = clamp(dx * 0.12 * (0.4 + prox), -24, 24);
      var shy = clamp(dy * 0.12 * (0.4 + prox) + 8, -16, 28);
      var sha = (0.52 + 0.32 * prox) * nightAmt;
      el.style.setProperty('--gal-shx', shx.toFixed(1) + 'px');
      el.style.setProperty('--gal-shy', shy.toFixed(1) + 'px');
      el.style.setProperty('--gal-sha', sha.toFixed(3));
      nextStyled.push(el);
    }
    gal.styledCards = nextStyled;
  }

  function galDrawPlaidPants(c, gx, gy, sc) {
    c.save();
    c.beginPath();
    c.moveTo(gx - 13 * sc, gy - 44 * sc);
    c.lineTo(gx + 14 * sc, gy - 44 * sc);
    c.quadraticCurveTo(gx + 22 * sc, gy - 22 * sc, gx + 18 * sc, gy - 8 * sc);
    c.lineTo(gx + 2 * sc, gy - 8 * sc);
    c.lineTo(gx + 0 * sc, gy - 28 * sc);
    c.lineTo(gx - 2 * sc, gy - 8 * sc);
    c.lineTo(gx - 18 * sc, gy - 8 * sc);
    c.quadraticCurveTo(gx - 22 * sc, gy - 22 * sc, gx - 13 * sc, gy - 44 * sc);
    c.closePath();
    c.fillStyle = '#2d3340';
    c.fill();
    c.save();
    c.clip();
    c.strokeStyle = 'rgba(226, 232, 240, 0.42)';
    c.lineWidth = 1.1 * sc;
    for (var px = -24; px <= 24; px += 5) {
      c.beginPath(); c.moveTo(gx + px * sc, gy - 46 * sc); c.lineTo(gx + px * sc, gy - 6 * sc); c.stroke();
    }
    for (var py = -44; py <= -8; py += 5) {
      c.beginPath(); c.moveTo(gx - 24 * sc, gy + py * sc); c.lineTo(gx + 24 * sc, gy + py * sc); c.stroke();
    }
    c.restore();
    c.strokeStyle = '#18202c';
    c.lineWidth = 2.1 * sc;
    c.stroke();
    c.restore();
  }

  function galDrawGirl(c, gx, gy, sc, aimX, aimY, nightAmt) {
    c.save();
    c.lineJoin = 'round';
    c.lineCap = 'round';
    var ink = '#18202c';

    // Sneakers
    c.fillStyle = '#cbd5e1';
    c.strokeStyle = ink; c.lineWidth = 2 * sc;
    rrect(c, gx - 17 * sc, gy - 9 * sc, 13 * sc, 7 * sc, 3.5 * sc); c.fill(); c.stroke();
    rrect(c, gx + 4 * sc, gy - 9 * sc, 13 * sc, 7 * sc, 3.5 * sc); c.fill(); c.stroke();

    // Plaid wide-leg pants
    galDrawPlaidPants(c, gx, gy, sc);

    // Left arm
    c.save();
    c.translate(gx - 13 * sc, gy - 68 * sc);
    c.rotate(0.38 + Math.sin(clock * 1.8) * 0.04);
    c.fillStyle = '#9f7db5'; c.strokeStyle = ink; c.lineWidth = 2 * sc;
    rrect(c, -5 * sc, 0, 9 * sc, 24 * sc, 4.5 * sc); c.fill(); c.stroke();
    c.fillStyle = '#f6d5be';
    c.beginPath(); c.arc(0, 26 * sc, 4 * sc, 0, TAU); c.fill(); c.stroke();
    c.restore();

    // Lilac sweater torso
    c.fillStyle = '#9f7db5'; c.strokeStyle = ink; c.lineWidth = 2.1 * sc;
    c.beginPath();
    c.moveTo(gx - 13 * sc, gy - 72 * sc);
    c.lineTo(gx + 13 * sc, gy - 72 * sc);
    c.lineTo(gx + 15 * sc, gy - 43 * sc);
    c.lineTo(gx - 15 * sc, gy - 43 * sc);
    c.closePath();
    c.fill(); c.stroke();

    // Crossbody pink shoulder bag
    c.strokeStyle = ink; c.lineWidth = 2.2 * sc;
    c.beginPath(); c.moveTo(gx + 9 * sc, gy - 72 * sc); c.lineTo(gx - 12 * sc, gy - 46 * sc); c.stroke();
    c.fillStyle = '#dd8ea4';
    rrect(c, gx - 17 * sc, gy - 54 * sc, 12 * sc, 14 * sc, 4 * sc); c.fill(); c.stroke();

    // Articulated right arm + yellow flashlight aimed seamlessly toward (aimX, aimY)
    var shX = gx + 12 * sc, shY = gy - 66 * sc;
    var rawAng = Math.atan2(aimY - shY, aimX - shX);
    var armAng = clamp(rawAng, -1.48, 0.25);
    var handX = shX + Math.cos(armAng) * 22 * sc;
    var handY = shY + Math.sin(armAng) * 22 * sc;

    c.save();
    c.translate(shX, shY);
    c.rotate(armAng);
    c.fillStyle = '#ad8bc2'; c.strokeStyle = ink; c.lineWidth = 2 * sc;
    rrect(c, -2 * sc, -4.5 * sc, 23 * sc, 9 * sc, 4.5 * sc); c.fill(); c.stroke();
    c.fillStyle = '#f6d5be';
    c.beginPath(); c.arc(22 * sc, 0, 4.2 * sc, 0, TAU); c.fill(); c.stroke();
    // Yellow flashlight
    c.fillStyle = '#facc15';
    rrect(c, 16 * sc, -3.5 * sc, 13 * sc, 7 * sc, 2.5 * sc); c.fill(); c.stroke();
    c.fillStyle = '#fde047';
    c.beginPath();
    c.moveTo(28 * sc, -4 * sc); c.lineTo(34 * sc, -6.5 * sc);
    c.lineTo(34 * sc, 6.5 * sc); c.lineTo(28 * sc, 4 * sc);
    c.closePath(); c.fill(); c.stroke();
    if (nightAmt > 0.25) {
      c.strokeStyle = 'rgba(253, 224, 71, ' + (0.8 * nightAmt).toFixed(3) + ')';
      c.lineWidth = 1.8 * sc;
      [-0.36, 0, 0.36].forEach(function (da) {
        c.beginPath();
        c.moveTo(37 * sc, Math.sin(da) * 5 * sc);
        c.lineTo(44 * sc, Math.sin(da) * 10.5 * sc);
        c.stroke();
      });
    }
    c.restore();

    // Head + dark bobbed hair + hairclip
    var hx = gx, hy = gy - 87 * sc;
    c.fillStyle = '#1e2430'; c.strokeStyle = ink; c.lineWidth = 2 * sc;
    c.beginPath(); c.arc(hx - 2 * sc, hy, 15.5 * sc, 0, TAU); c.fill();
    c.fillStyle = '#f6d5be';
    c.beginPath(); c.arc(hx + 1.5 * sc, hy + 1.5 * sc, 12.2 * sc, 0, TAU); c.fill(); c.stroke();
    c.fillStyle = '#1e2430';
    c.beginPath();
    c.arc(hx, hy - 2 * sc, 14 * sc, Math.PI * 0.92, Math.PI * 1.96);
    c.closePath(); c.fill();
    rrect(c, hx - 14.5 * sc, hy - 4 * sc, 8.5 * sc, 17 * sc, 4 * sc); c.fill();
    c.strokeStyle = '#fde047'; c.lineWidth = 2 * sc;
    c.beginPath(); c.moveTo(hx - 6 * sc, hy - 5 * sc); c.lineTo(hx - 2 * sc, hy - 3 * sc); c.stroke();

    // Eyes & expression
    c.fillStyle = ink;
    c.beginPath();
    c.arc(hx + 2 * sc, hy + 0.5 * sc, 1.5 * sc, 0, TAU);
    c.arc(hx + 8.5 * sc, hy + 0.5 * sc, 1.5 * sc, 0, TAU);
    c.fill();
    if (nightAmt > 0.5) {
      c.beginPath(); c.ellipse(hx + 6 * sc, hy + 6 * sc, 2.1 * sc, 2.7 * sc, 0, 0, TAU); c.fill();
    } else {
      c.strokeStyle = ink; c.lineWidth = 1.6 * sc;
      c.beginPath(); c.arc(hx + 5.5 * sc, hy + 4.2 * sc, 3.2 * sc, 0.15, Math.PI - 0.15); c.stroke();
    }

    c.restore();
    return { nozX: handX + Math.cos(armAng) * 13 * sc, nozY: handY + Math.sin(armAng) * 13 * sc };
  }

  function galDrawPepper(c, dx, dy, sc, nightAmt, hopAmt) {
    c.save();
    var hopY = Math.sin(hopAmt * Math.PI) * 11 * sc;
    c.translate(dx, dy - hopY);
    c.lineJoin = 'round'; c.lineCap = 'round';
    var ink = '#18202c';

    var wag = Math.sin(clock * (hopAmt > 0 ? 18 : 4.2)) * 0.28;
    c.save();
    c.translate(12 * sc, -13 * sc);
    c.rotate(wag);
    c.fillStyle = '#94a3b8'; c.strokeStyle = ink; c.lineWidth = 2 * sc;
    c.beginPath(); c.ellipse(5 * sc, -4 * sc, 5.5 * sc, 3 * sc, -0.5, 0, TAU); c.fill(); c.stroke();
    c.restore();

    c.fillStyle = '#e2e8f0'; c.strokeStyle = ink; c.lineWidth = 2 * sc;
    c.beginPath(); c.ellipse(0, -15 * sc, 13 * sc, 15 * sc, 0, 0, TAU); c.fill(); c.stroke();
    c.fillStyle = '#64748b';
    c.beginPath(); c.arc(6 * sc, -17 * sc, 5.5 * sc, 0, TAU); c.fill();
    c.fillStyle = '#f1f5f9';
    rrect(c, -10 * sc, -7 * sc, 7.5 * sc, 7 * sc, 3.2 * sc); c.fill(); c.stroke();
    rrect(c, 2.5 * sc, -7 * sc, 7.5 * sc, 7 * sc, 3.2 * sc); c.fill(); c.stroke();

    c.fillStyle = '#dc2626';
    rrect(c, -9.5 * sc, -28.5 * sc, 19 * sc, 4.5 * sc, 2.2 * sc); c.fill(); c.stroke();
    c.fillStyle = '#facc15';
    c.beginPath(); c.arc(0, -24.5 * sc, 3 * sc, 0, TAU); c.fill(); c.stroke();

    c.fillStyle = '#334155';
    c.beginPath(); c.ellipse(-11.5 * sc, -37 * sc, 4.5 * sc, 8.5 * sc, 0.28, 0, TAU); c.fill(); c.stroke();
    c.beginPath(); c.ellipse(11.5 * sc, -37 * sc, 4.5 * sc, 8.5 * sc, -0.28, 0, TAU); c.fill(); c.stroke();

    c.fillStyle = '#e2e8f0';
    c.beginPath(); c.arc(0, -38 * sc, 12.2 * sc, 0, TAU); c.fill(); c.stroke();
    c.fillStyle = '#475569';
    c.beginPath(); c.arc(5 * sc, -45 * sc, 5.5 * sc, 0, TAU); c.fill();

    c.fillStyle = ink;
    c.beginPath(); c.ellipse(0, -35 * sc, 2.5 * sc, 1.8 * sc, 0, 0, TAU); c.fill();
    c.strokeStyle = ink; c.lineWidth = 1.5 * sc;
    c.beginPath();
    c.moveTo(-3 * sc, -32.2 * sc); c.quadraticCurveTo(0, -30.5 * sc, 3 * sc, -32.2 * sc);
    c.stroke();

    var ex1 = -4.6 * sc, ex2 = 4.6 * sc, ey = -39.2 * sc;
    if (nightAmt > 0.08) {
      var pulse = 0.88 + 0.12 * Math.sin(clock * 4.2);
      c.save();
      c.globalCompositeOperation = 'lighter';
      [ex1, ex2].forEach(function (ex) {
        var eg = c.createRadialGradient(ex, ey, 0, ex, ey, 11 * sc);
        eg.addColorStop(0, 'rgba(255, 255, 240, ' + (0.98 * nightAmt * pulse).toFixed(3) + ')');
        eg.addColorStop(0.32, 'rgba(253, 224, 71, ' + (0.85 * nightAmt * pulse).toFixed(3) + ')');
        eg.addColorStop(1, 'rgba(250, 204, 21, 0)');
        c.fillStyle = eg;
        c.beginPath(); c.arc(ex, ey, 11 * sc, 0, TAU); c.fill();
      });
      c.restore();
      c.fillStyle = '#fef9c3';
      c.beginPath();
      c.arc(ex1, ey, 2.6 * sc, 0, TAU);
      c.arc(ex2, ey, 2.6 * sc, 0, TAU);
      c.fill();
    } else {
      c.fillStyle = ink;
      c.beginPath();
      c.arc(ex1, ey, 1.8 * sc, 0, TAU);
      c.arc(ex2, ey, 1.8 * sc, 0, TAU);
      c.fill();
      c.fillStyle = '#fff';
      c.beginPath();
      c.arc(ex1 - 0.5 * sc, ey - 0.5 * sc, 0.65 * sc, 0, TAU);
      c.arc(ex2 - 0.5 * sc, ey - 0.5 * sc, 0.65 * sc, 0, TAU);
      c.fill();
    }
    c.restore();
  }

  function galDrawPullCord(c, cordX, ceilY, nightAmt) {
    c.save();
    var baseLen = clamp(H * 0.105, 62, 92);
    var len = Math.max(28, baseLen + gal.pullY);
    var kx = cordX + Math.sin(gal.pendAng) * len;
    var ky = ceilY + Math.cos(gal.pendAng) * len;

    c.fillStyle = nightAmt > 0.5 ? '#475569' : '#e2e8f0';
    c.strokeStyle = '#18202c'; c.lineWidth = 1.8;
    c.beginPath(); c.arc(cordX, ceilY + 2, 4, 0, TAU); c.fill(); c.stroke();

    c.strokeStyle = nightAmt > 0.5 ? 'rgba(226, 232, 240, 0.78)' : '#18202c';
    c.lineWidth = 1.9;
    c.beginPath(); c.moveTo(cordX, ceilY + 6); c.lineTo(kx, ky - 11); c.stroke();

    if (nightAmt > 0.05) {
      c.save();
      c.globalCompositeOperation = 'lighter';
      var hg = c.createRadialGradient(kx, ky + 3, 2, kx, ky + 3, 28);
      hg.addColorStop(0, 'rgba(253, 224, 71, ' + (0.45 * nightAmt).toFixed(3) + ')');
      hg.addColorStop(1, 'rgba(253, 224, 71, 0)');
      c.fillStyle = hg; c.beginPath(); c.arc(kx, ky + 3, 28, 0, TAU); c.fill();
      c.restore();
    }

    c.save();
    c.translate(kx, ky);
    c.rotate(-gal.pendAng * 0.85);
    var tg = c.createRadialGradient(-3, 2, 1, 0, 4, 15);
    tg.addColorStop(0, '#fef08a');
    tg.addColorStop(0.45, '#facc15');
    tg.addColorStop(1, '#d97706');
    c.fillStyle = tg;
    c.strokeStyle = '#18202c';
    c.lineWidth = 2.1;
    c.beginPath();
    c.moveTo(0, -11);
    c.bezierCurveTo(6, -4, 10.5, 2, 10.5, 7.5);
    c.arc(0, 7.5, 10.5, 0, Math.PI);
    c.bezierCurveTo(-10.5, 2, -6, -4, 0, -11);
    c.closePath();
    c.fill(); c.stroke();

    c.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    c.lineWidth = 2;
    c.lineCap = 'round';
    c.beginPath();
    c.arc(-1, 7.5, 6.2, Math.PI * 0.72, Math.PI * 1.18);
    c.stroke();
    c.restore();

    c.restore();
    return { x: kx, y: ky, top: ceilY };
  }

  function galDrawVolumetricBeam(c, nozX, nozY, fx, fy, R, nightAmt, dt) {
    if (nightAmt <= 0.02) return;
    var dx = fx - nozX, dy = fy - nozY, d = Math.hypot(dx, dy);

    // 1. Soft Gaussian volumetric beam rendered via offscreen bloom buffer (NO hard polygon edges!)
    if (d > R * 0.65) {
      var th = Math.atan2(dy, dx), nx = -Math.sin(th), ny = Math.cos(th);
      var half = Math.asin(Math.min(0.96, (R * 1.08) / Math.max(d, R * 1.12)));
      var far = d + R * 1.15;

      ensureBloom();
      bctx.globalCompositeOperation = 'source-over';
      if (bctx.createConicGradient) {
        var cg = bctx.createConicGradient(th - Math.PI, nozX, nozY), hw = half / TAU;
        cg.addColorStop(0, 'rgba(255,244,195,0)');
        for (var gi = -8; gi <= 8; gi++) {
          var u = gi / 8;
          var a = 0.24 * Math.exp(-u * u * 3.8) * nightAmt;
          cg.addColorStop(clamp(0.5 + hw * u, 0.001, 0.999), 'rgba(255,244,195,' + a.toFixed(4) + ')');
        }
        cg.addColorStop(1, 'rgba(255,244,195,0)');
        bctx.fillStyle = cg;
        bctx.beginPath();
        bctx.moveTo(nozX, nozY);
        bctx.lineTo(nozX + Math.cos(th - half * 1.1) * far, nozY + Math.sin(th - half * 1.1) * far);
        bctx.lineTo(nozX + Math.cos(th + half * 1.1) * far, nozY + Math.sin(th + half * 1.1) * far);
        bctx.closePath();
        bctx.fill();
      }
      // Smoothly fade the atmospheric haze across the focal pool so the reading center stays crystal clear!
      var ux = Math.cos(th), uy = Math.sin(th);
      var fadeEnd = bctx.createLinearGradient(fx - ux * R * 0.55, fy - uy * R * 0.55, fx + ux * R * 0.85, fy + uy * R * 0.85);
      fadeEnd.addColorStop(0, 'rgba(0,0,0,0)');
      fadeEnd.addColorStop(1, 'rgba(0,0,0,1)');
      bctx.globalCompositeOperation = 'destination-out';
      bctx.fillStyle = fadeEnd;
      bctx.fillRect(-W, -H, W * 3, H * 3);
      blitBloom(c);

      // Warm flashlight nozzle flare + drifting dust motes catching the shaft
      c.save();
      c.globalCompositeOperation = 'lighter';
      var nf = c.createRadialGradient(nozX, nozY, 0, nozX, nozY, 26);
      nf.addColorStop(0, 'rgba(255, 252, 220, ' + (0.72 * nightAmt).toFixed(3) + ')');
      nf.addColorStop(0.4, 'rgba(253, 224, 71, ' + (0.32 * nightAmt).toFixed(3) + ')');
      nf.addColorStop(1, 'rgba(253, 224, 71, 0)');
      c.fillStyle = nf;
      c.beginPath(); c.arc(nozX, nozY, 26, 0, TAU); c.fill();

      while (gal.motes.length < 24) {
        gal.motes.push({ u: Math.random(), v: rnd(-0.82, 0.82), sp: rnd(0.03, 0.09), ph: rnd(0, TAU), r: rnd(0.6, 1.45) });
      }
      for (var mi = 0; mi < gal.motes.length; mi++) {
        var mt = gal.motes[mi];
        mt.u = (mt.u + mt.sp * dt) % 1;
        var halfW = 8 + (R * 0.85 - 8) * mt.u;
        var mx = nozX + dx * mt.u + nx * mt.v * halfW;
        var my = nozY + dy * mt.u + ny * mt.v * halfW;
        var edge = 1 - mt.v * mt.v;
        var tw = (0.4 + 0.6 * Math.abs(Math.sin(clock * 2.4 + mt.ph))) * edge * (1 - mt.u * 0.35) * nightAmt;
        if (tw > 0.05) {
          c.fillStyle = 'rgba(255, 249, 218, ' + (0.58 * tw).toFixed(3) + ')';
          c.beginPath(); c.arc(mx, my, mt.r, 0, TAU); c.fill();
        }
      }
      c.restore();
    }

    // 2. Subtle warm incandescent pool bloom (pure light, zero artificial stroke rings!)
    c.save();
    c.globalCompositeOperation = 'lighter';
    var pool = c.createRadialGradient(fx, fy, 0, fx, fy, R * 1.24);
    pool.addColorStop(0, 'rgba(255, 250, 224, ' + (0.13 * nightAmt).toFixed(3) + ')');
    pool.addColorStop(0.58, 'rgba(255, 244, 196, ' + (0.08 * nightAmt).toFixed(3) + ')');
    pool.addColorStop(0.84, 'rgba(253, 224, 110, ' + (0.06 * nightAmt).toFixed(3) + ')');
    pool.addColorStop(1, 'rgba(253, 224, 110, 0)');
    c.fillStyle = pool;
    c.beginPath(); c.arc(fx, fy, R * 1.24, 0, TAU); c.fill();
    c.restore();
  }

  function galPushLights(Ls) {
    if (gal.darkMix < 0.05) return;
    Ls.push({ x: gal.fx, y: gal.fy, z: 240, rgb: [255, 236, 160], p: 1.05 * gal.darkMix, kind: 'burst' });
  }

  function drawGallery(c, dt) {
    galEnsureDOM();
    if (!gal.active) {
      gal.active = true;
      gal.dom.style.display = 'block';
      gal.enterT = 0;
      gal.night = false;
      gal.darkMix = 0;
      gal.autoPulled = false;
      gal.pullY = -14;
      gal.pullVy = 110;
      gal.fx = W * 0.38;
      gal.fy = H * 0.42;
      galSay("Oh. It's just us.", 0);
      galSyncClasses();
    }

    gal.enterT += dt;
    if (!gal.autoPulled && gal.enterT >= 0.24) {
      gal.autoPulled = true;
      gal.pullY = 26;
      galToggleRoom(true);
    }

    // Spring physics for pull-cord bounce & pendulum sway
    if (!gal.draggingCord) {
      var ay = -460 * gal.pullY - 12.5 * gal.pullVy;
      gal.pullVy += ay * dt;
      gal.pullY += gal.pullVy * dt;
      if (Math.abs(gal.pullY) < 0.1 && Math.abs(gal.pullVy) < 0.5) { gal.pullY = 0; gal.pullVy = 0; }

      var aa = -26 * gal.pendAng - 3.2 * gal.pendVel;
      gal.pendVel += aa * dt;
      gal.pendAng += gal.pendVel * dt;
    }

    if (gal.dogHop > 0) gal.dogHop = Math.max(0, gal.dogHop - dt * 2.4);
    if (gal.sayTimer > 0) {
      gal.sayTimer -= dt;
      if (gal.sayTimer <= 0) galSay(gal.night ? 'Pepper wanted tuna.' : "Oh. It's just us.", 0);
    }

    var targetDark = gal.night ? 1 : 0;
    gal.darkMix += (targetDark - gal.darkMix) * Math.min(1, dt * 8.5);
    var nightAmt = gal.darkMix;

    var topIn = galTopInset();
    var botIn = galBottomInset();

    // Flashlight target: faithfully follow user's cursor/touch with natural hand micro-breathing
    // (never wanders off while reading!); gently sweeps only before first pointer input.
    var tx, ty;
    if (gal.hasPtr && gal.ptrX >= 0) {
      tx = clamp(gal.ptrX + Math.sin(clock * 1.9) * 1.6, 28, W - 28);
      ty = clamp(gal.ptrY + Math.cos(clock * 1.5) * 1.6, topIn + 24, H - botIn - 36);
    } else {
      tx = W * (0.46 + 0.26 * Math.sin(clock * 0.65));
      ty = H * (0.42 + 0.16 * Math.cos(clock * 0.85));
    }
    var fk = 1 - Math.exp(-dt * 15);
    gal.fx += (tx - gal.fx) * fk;
    gal.fy += (ty - gal.fy) * fk;

    var spotRadius = clamp(Math.min(W, H) * 0.145, 76, 118);

    var ga = c.globalAlpha;
    // Day mode warm museum cream glaze
    if (nightAmt < 0.99) {
      c.fillStyle = 'rgba(253, 248, 236, ' + (0.13 * (1 - nightAmt)).toFixed(3) + ')';
      c.fillRect(0, 0, W, H);
    }
    // Subtle gallery floor baseboard behind characters in night mode
    if (nightAmt > 0.01) {
      var floorH = botIn + 50;
      c.fillStyle = 'rgba(6, 12, 24, ' + (0.42 * nightAmt).toFixed(3) + ')';
      c.fillRect(0, H - floorH, W, floorH);
      c.strokeStyle = 'rgba(30, 48, 82, ' + (0.45 * nightAmt).toFixed(3) + ')';
      c.lineWidth = 1;
      c.beginPath(); c.moveTo(0, H - floorH); c.lineTo(W, H - floorH); c.stroke();
    }

    // Draw Lead Characters + Soft Gaussian Volumetric Beam + Update GPU Pixel-Accurate Mask & Shadows
    var charSc = clamp(Math.min(W, H) / 430, 0.78, 1.08);
    var floorY = H - botIn - 6;
    var girlX = clamp(W * 0.13, 42, 78);
    var dogX = W - clamp(W * 0.11, 38, 68);

    var girlHand = galDrawGirl(c, girlX, floorY, charSc, gal.fx, gal.fy, nightAmt);
    galDrawVolumetricBeam(c, girlHand.nozX, girlHand.nozY, gal.fx, gal.fy, spotRadius, nightAmt, dt);
    galDrawPepper(c, dogX, floorY, charSc, nightAmt, gal.dogHop);

    if (gal.darkVeil) {
      if (nightAmt > 0.008) {
        gal.darkVeil.style.opacity = nightAmt.toFixed(3);
        galUpdateDarkVeilMask(girlHand.nozX, girlHand.nozY, gal.fx, gal.fy, spotRadius);
      } else {
        gal.darkVeil.style.opacity = '0';
      }
    }
    galUpdateCardShadows(gal.fx, gal.fy, spotRadius, nightAmt);

    // Draw Top-Right Golden Pull-Cord & Sync Interactive Overlays
    var cordX = W - clamp(W * 0.08, 28, 46);
    var ceilY = topIn + 2;
    var knob = galDrawPullCord(c, cordX, ceilY, nightAmt);

    if (gal.pill) {
      gal.pill.style.top = Math.round(topIn + 4) + 'px';
      gal.pill.className = 'fbfx-gal-pill fbfx-gal-ui ' + (gal.night ? 'night' : 'day');
      var labelTxt = gal.night ? 'Lights off' : 'Lights on';
      if (gal.pill.__txt !== labelTxt) {
        gal.pill.__txt = labelTxt;
        gal.pill.innerHTML = '<span class="gal-dot"></span><span>' + labelTxt + '</span>';
      }
    }
    if (gal.cordHit) {
      gal.cordHit.style.left = Math.round(knob.x - 26) + 'px';
      gal.cordHit.style.top = Math.round(ceilY) + 'px';
      gal.cordHit.style.height = Math.round(Math.max(90, knob.y - ceilY + 28)) + 'px';
    }
    if (gal.loupe) {
      if (nightAmt > 0.04) {
        var scaleLoupe = (spotRadius * 1.92) / GAL_LOUPE_SZ;
        var lx0 = gal.fx - GAL_LOUPE_SZ / 2;
        var ly0 = gal.fy - GAL_LOUPE_SZ / 2;
        gal.loupe.style.transform = 'translate3d(' + lx0.toFixed(1) + 'px,' + ly0.toFixed(1) + 'px,0) scale(' + scaleLoupe.toFixed(4) + ')';
        gal.loupe.style.opacity = nightAmt.toFixed(3);
      } else {
        gal.loupe.style.opacity = '0';
      }
    }
    if (gal.bubble) {
      var bx = Math.round(girlX + 32 * charSc);
      var by = Math.round(floorY - 38 * charSc);
      gal.bubble.style.left = bx + 'px';
      gal.bubble.style.top = by + 'px';
      gal.bubble.style.maxWidth = Math.max(120, Math.round(dogX - bx - 36 * charSc)) + 'px';
    }
    if (gal.dogBtn) {
      gal.dogBtn.style.left = Math.round(dogX - 34) + 'px';
      gal.dogBtn.style.top = Math.round(floorY - 64 * charSc) + 'px';
    }
    c.globalAlpha = ga;
  }
