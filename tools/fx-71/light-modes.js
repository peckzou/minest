  // ---------------------------------------------------------------- 71: aurora · meteor · disco
  // Three quieter rooms than lasers / firework / spotlight, made for reading the board under them:
  //   aurora — curtains of northern light drift across the top of a starry room;
  //   meteor — a night sky with shooting stars; tap empty space to send one there;
  //   disco  — a mirror ball turns overhead and throws coloured dots round the room, on the beat.
  // All three light the glass cards through sceneLights (xfxLights), like the older modes.
  var xfx = { stars: null, sw: 0, sh: 0, meteors: [], glows: [], next: 0.4, strips: {}, dots: null, sprites: {} };
  var XFX_CALM = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  function xfxReset() { xfx.meteors.length = 0; xfx.glows.length = 0; xfx.next = 0.4; }
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
  // one curtain's fall-off from its bright lower edge up into the dark (stretched over every strip)
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
    // (the board is read under it: the curtains are thinner there, so card text stays clear)
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
        // where it burns out: a short flash (an aimed one, on the spot that was tapped)
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
        // a few of the rays that carry the dots, seen in the haze
        c.globalAlpha = ga * beat * 0.07 * depth;
        c.strokeStyle = 'hsl(' + d.h + ',100%,72%)'; c.lineWidth = 1.2;
        c.beginPath(); c.moveTo(B.x, B.y); c.lineTo(x, y); c.stroke();
      }
    }
    // the ball's own halo
    c.globalAlpha = ga * (0.35 + 0.4 * beat);
    c.drawImage(xfxSprite(DISCO_HUES[Math.floor(clock * 0.5) % DISCO_HUES.length]), B.x - B.r * 3.4, B.y - B.r * 3.4, B.r * 6.8, B.r * 6.8);
    c.restore();
    // the mirror ball on its cord
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

  // what the three rooms shine on the glass cards
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
    }
  }

