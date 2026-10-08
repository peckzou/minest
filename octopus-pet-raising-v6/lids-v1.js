/* Pet Raising — Eyelids v1 (43.8).
   The octopus's eyes are painted into its baked texture, so it could never blink. Like mouth-v1.js,
   this repaints just each eye's small patch of that texture on the GPU (copyTextureToTexture): a furry
   lid (fur borrowed from above the eye) slides down over the eye with a soft shadow and a lash line.
   Drawing follows the face's own axes at each eye (the texture is rotated/stretched there).
   - Auto-blink every 2.5–6 s (sometimes a double blink) when nothing else drives the lids.
   - window.__octoLids.set(left, right) — 0 open … 1 closed, screen sides (face capture uses this);
     the eye catchlights shrink/hide with the lid (v6-eye-control setLive).
   - window.__octoLids.blink(), .setAuto(bool). */
(function () {
  'use strict';
  if (window.__octoLids) return;
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  // 43.9 motion v4 — keyframed eyelid acting. Keys: [t s, left, right] (0 open … 1 closed, screen sides);
  // 'W' = a wink on a random side (left/right swapped at play time).
  var CLIPS = {
    blink: [[0, 0, 0], [.07, 1, 1], [.17, 0, 0]],
    blinkDouble: [[0, 0, 0], [.07, 1, 1], [.16, 0, 0], [.24, 1, 1], [.34, 0, 0]],
    wink: [[0, 0, 0], [.12, 1, 0], [.45, 1, .12], [.62, 0, 0]],
    happy: [[0, 0, 0], [.18, .5, .5], [1.1, .48, .48], [1.4, 0, 0]],            // smiling eyes
    sleepy: [[0, 0, 0], [.5, .55, .55], [1.1, .6, .6], [1.25, 1, 1], [1.5, .62, .62], [2.3, .58, .58], [2.7, 0, 0]],
    yawn: [[0, 0, 0], [.35, .3, .3], [1.05, .92, .92], [1.75, .9, .9], [2.25, .2, .2], [2.6, 0, 0]],
    gasp: [[0, 0, 0], [.05, 0, 0], [.75, 0, 0], [.82, 1, 1], [.92, 0, 0], [.99, 1, 1], [1.1, 0, 0]],
    dizzy: [[0, 0, 0], [.12, .7, .1], [.24, .1, .7], [.36, .75, .15], [.48, .15, .75], [.6, .6, .2], [.8, 0, 0]],
    love: [[0, 0, 0], [.45, 1, 1], [.85, 1, 1], [1.35, 0, 0]],                 // slow trusting blink
    shy: [[0, 0, 0], [.3, .35, .35], [1.2, .4, .4], [1.35, 1, 1], [1.5, .38, .38], [2.2, .35, .35], [2.5, 0, 0]],
    focus: [[0, 0, 0], [.25, .25, .25], [1.2, .28, .28], [1.45, 0, 0]],
    puff: [[0, 0, 0], [.4, .55, .55], [1.4, .5, .5], [1.6, 0, 0]],
    pout: [[0, 0, 0], [.3, .3, .3], [1.3, .32, .32], [1.6, 0, 0]],
    squeeze: [[0, 0, 0], [.1, 1, 1], [.55, 1, 1], [.7, 0, 0]]
  };
  var clip = null;
  function clipLids(now) {
    if (!clip) return null;
    var t = (now - clip.start) / 1000;
    if (t < 0) return null;
    var k = CLIPS[clip.name];
    if (t > k[k.length - 1][0]) { clip = null; nextBlink = now + 1800 + Math.random() * 3000; return null; }
    var a = k[0], b = k[k.length - 1];
    for (var i = 0; i < k.length - 1; i++) if (t >= k[i][0] && t <= k[i + 1][0]) { a = k[i]; b = k[i + 1]; break; }
    var u = b[0] > a[0] ? clamp((t - a[0]) / (b[0] - a[0]), 0, 1) : 1; u = u * u * (3 - 2 * u);
    var l = a[1] + (b[1] - a[1]) * u, r = a[2] + (b[2] - a[2]) * u;
    return clip.flip ? [r, l] : [l, r];
  }

  var av, skinned, tex, R, Vec2, TexCtor, eyes = [];
  var cur = { '-1': 0, '1': 0 }, target = { '-1': 0, '1': 0 }, liveUntil = 0, auto = true, nextBlink = 0, blinkT = -1, doubleBlink = false;

  function uvAtFace(g, x, y) {
    var P = g.attributes.position, UV = g.attributes.uv, idx = g.index, tc = idx ? idx.count / 3 : P.count / 3, best = null, bz = -Infinity;
    for (var t = 0; t < tc; t++) {
      var a = idx ? idx.getX(t * 3) : t * 3, b = idx ? idx.getX(t * 3 + 1) : t * 3 + 1, c = idx ? idx.getX(t * 3 + 2) : t * 3 + 2;
      var ax = P.getX(a), ay = P.getY(a), bx = P.getX(b), by = P.getY(b), cx = P.getX(c), cy = P.getY(c);
      if (Math.max(ax, bx, cx) < x || Math.min(ax, bx, cx) > x || Math.max(ay, by, cy) < y || Math.min(ay, by, cy) > y) continue;
      var den = (by - cy) * (ax - cx) + (cx - bx) * (ay - cy);
      if (Math.abs(den) < 1e-12) continue;
      var w1 = ((by - cy) * (x - cx) + (cx - bx) * (y - cy)) / den, w2 = ((cy - ay) * (x - cx) + (ax - cx) * (y - cy)) / den, w3 = 1 - w1 - w2;
      if (w1 < -1e-6 || w2 < -1e-6 || w3 < -1e-6) continue;
      var z = P.getZ(a) * w1 + P.getZ(b) * w2 + P.getZ(c) * w3;
      if (z > bz) { bz = z; best = [UV.getX(a) * w1 + UV.getX(b) * w2 + UV.getX(c) * w3, UV.getY(a) * w1 + UV.getY(b) * w2 + UV.getY(c) * w3]; }
    }
    return best;
  }

  function prepare(E) {
    var img = tex.image, W = img.width, H = img.height, g = skinned.geometry;
    var cx = E.u * W, cy = E.v * H, rx = E.ru * W, ry = E.rv * H, rr = Math.max(rx, ry);
    // face axes at the eye: texels per face unit along face-right / face-down
    var d = .025, p0 = uvAtFace(g, E.C.x, E.C.y), px = uvAtFace(g, E.C.x + d, E.C.y), py = uvAtFace(g, E.C.x, E.C.y - d);
    var ax = [1, 0], ay = [0, 1];
    if (p0 && px && py) { ax = [(px[0] - p0[0]) * W / d, (px[1] - p0[1]) * H / d]; ay = [(py[0] - p0[0]) * W / d, (py[1] - p0[1]) * H / d]; }
    var sx = Math.hypot(ax[0], ax[1]) || 1;
    var pad = Math.round(rr * 1.9);
    var reg = { x: Math.round(cx - pad), y: Math.round(cy - pad * 1.35), w: pad * 2, h: Math.round(pad * 2.35) };
    reg.x = clamp(reg.x, 0, W - reg.w); reg.y = clamp(reg.y, 0, H - reg.h);
    var orig = document.createElement('canvas'); orig.width = reg.w; orig.height = reg.h;
    orig.getContext('2d').drawImage(img, reg.x, reg.y, reg.w, reg.h, 0, 0, reg.w, reg.h);
    // fur for the lid: the patch just above the eye, slid down
    var fur = document.createElement('canvas'); fur.width = reg.w; fur.height = reg.h;
    var shift = Math.round(rr * 2.3);
    fur.getContext('2d').drawImage(img, reg.x, reg.y - shift, reg.w, reg.h, 0, 0, reg.w, reg.h);
    var fctx = fur.getContext('2d', { willReadFrequently: true }), fd = fctx.getImageData(0, 0, reg.w, Math.max(1, Math.round(reg.h * .3))).data, r = 0, gg = 0, b = 0, n = 0;
    for (var i = 0; i < fd.length; i += 16) { r += fd[i]; gg += fd[i + 1]; b += fd[i + 2]; n++; }
    var od = orig.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, reg.w, reg.h).data, rr2 = 0, rg2 = 0, rb2 = 0, rn = 0;
    var ecx = cx - reg.x, ecy = cy - reg.y;
    for (var yy = 0; yy < reg.h; yy += 2) for (var xx = 0; xx < reg.w; xx += 2) {
      var q = Math.hypot((xx - ecx) / rx, (yy - ecy) / ry);
      if (q < 1.08 || q > 1.35) continue;
      var k = (yy * reg.w + xx) * 4; rr2 += od[k]; rg2 += od[k + 1]; rb2 += od[k + 2]; rn++;
    }
    var ring = rn ? [rr2 / rn, rg2 / rn, rb2 / rn] : [r / n, gg / n, b / n];
    var c = document.createElement('canvas'); c.width = reg.w; c.height = reg.h;
    var t = new TexCtor(c); t.flipY = tex.flipY; t.colorSpace = tex.colorSpace; t.generateMipmaps = false;
    return { E: E, reg: reg, orig: orig, fur: fur, canvas: c, ctx: c.getContext('2d'), tex: t, cx: cx - reg.x, cy: cy - reg.y,
      // eye radii measured along the face axes (texels)
      rx: rx * .98, ry: ry * .9, axes: [ax[0] / sx, ax[1] / sx, ay[0] / sx, ay[1] / sx], skin: [r / n, gg / n, b / n], ring: ring, last: -1 };
  }

  function draw(L, amt) {
    var c = L.ctx, rx = L.rx, ry = L.ry;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, L.reg.w, L.reg.h);
    c.drawImage(L.orig, 0, 0);
    if (amt > .01) {
      c.save();
      c.translate(L.cx, L.cy); c.transform(L.axes[0], L.axes[1], L.axes[2], L.axes[3], 0, 0);
      // upper lid comes down, lower lid comes up; they meet on a gentle ∪ curve a little below centre
      var meet = ry * .28, top = -ry * 1.3, bot = ry * 1.3;
      var upY = top + (meet - top) * amt, loY = bot - (bot - meet) * amt;
      var sagU = ry * .25 * (.35 + .65 * amt), sagL = ry * .18 * amt;
      var ring = L.ring, ringCss = 'rgb(' + Math.round(ring[0]) + ',' + Math.round(ring[1]) + ',' + Math.round(ring[2]) + ')';
      function lid(path) {
        c.save(); path(); c.clip();
        c.fillStyle = ringCss; c.fillRect(-rx * 2, -ry * 2, rx * 4, ry * 4);
        c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = .5; c.drawImage(L.fur, 0, 0); c.globalAlpha = 1;
        c.restore();
      }
      c.save();
      c.beginPath(); c.ellipse(0, 0, rx * 1.14, ry * 1.18, 0, 0, Math.PI * 2); c.clip();
      lid(function () { c.beginPath(); c.moveTo(-rx * 1.4, top - ry); c.lineTo(rx * 1.4, top - ry); c.lineTo(rx * 1.4, upY - sagU * .15); c.quadraticCurveTo(0, upY + sagU, -rx * 1.4, upY - sagU * .15); c.closePath(); });
      if (amt > .3) lid(function () { c.beginPath(); c.moveTo(-rx * 1.4, bot + ry); c.lineTo(rx * 1.4, bot + ry); c.lineTo(rx * 1.4, loY - sagL * .15); c.quadraticCurveTo(0, loY + sagL, -rx * 1.4, loY - sagL * .15); c.closePath(); });
      // soft shadow cast by the upper lid onto the eye
      if (amt < .97) {
        var sh = c.createLinearGradient(0, upY, 0, upY + ry * .35);
        sh.addColorStop(0, 'rgba(0,0,0,.35)'); sh.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = sh; c.beginPath(); c.moveTo(-rx * 1.4, upY - sagU * .15); c.quadraticCurveTo(0, upY + sagU, rx * 1.4, upY - sagU * .15); c.lineTo(rx * 1.4, upY + ry * .5); c.lineTo(-rx * 1.4, upY + ry * .5); c.closePath(); c.fill();
      }
      c.restore();
      // lash line along the upper lid edge (darker and fuller as the eye closes)
      var s2 = L.skin;
      c.lineCap = 'round';
      c.strokeStyle = 'rgba(' + Math.round(s2[0] * .22) + ',' + Math.round(s2[1] * .16) + ',' + Math.round(s2[2] * .26) + ',' + (.55 + .4 * amt) + ')';
      c.lineWidth = Math.max(1.5, ry * (.08 + .1 * amt));
      var span = rx * (1 - .1 * (1 - amt));
      c.beginPath(); c.moveTo(-span, upY - sagU * .15 + ry * .02); c.quadraticCurveTo(0, upY + sagU, span, upY - sagU * .15 + ry * .02); c.stroke();
      c.restore();
    }
    L.tex.needsUpdate = true;
    try { R.copyTextureToTexture(L.tex, tex, null, new Vec2(L.reg.x, L.reg.y)); } catch (e) {}
  }

  function tick(now) {
    requestAnimationFrame(tick);
    if (!eyes.length) return;
    var cl = now > liveUntil ? clipLids(now) : null;
    if (cl) { target['-1'] = cl[0]; target['1'] = cl[1]; blinkT = -1; }
    else if (now > liveUntil && auto) {
      if (!nextBlink) nextBlink = now + 2500 + Math.random() * 3500;
      if (blinkT < 0 && now > nextBlink) { blinkT = now; doubleBlink = Math.random() < .2; }
      var a = 0;
      if (blinkT >= 0) {
        var dur = 170, el = now - blinkT;                                 // quick close, slightly slower open
        a = el < 70 ? el / 70 : el < dur ? 1 - (el - 70) / (dur - 70) : 0;
        if (el >= dur) {
          if (doubleBlink) { doubleBlink = false; blinkT = now + 80; } else { blinkT = -1; nextBlink = now + 2500 + Math.random() * 3500; }
          a = 0;
        }
      }
      target['-1'] = target['1'] = clamp(a, 0, 1);
    }
    var e = window.__v6EyeHighlight;
    eyes.forEach(function (L) {
      var side = L.E.side, k = now < liveUntil ? .6 : 1;
      cur[side] += (target[side] - cur[side]) * k;
      var q = Math.round(cur[side] * 24) / 24;
      if (q !== L.last) { L.last = q; draw(L, q); }
    });
    if (e && e.setLive) e.setLive({ lidL: cur['-1'], lidR: cur['1'] });
  }

  function install(a) {
    av = a;
    a.importedModel.traverse(function (n) { if (!skinned && n.isSkinnedMesh) skinned = n; });
    tex = skinned && skinned.material && skinned.material.emissiveMap;
    R = a.renderer;
    var e = window.__v6EyeHighlight;
    if (!tex || !tex.image || !R.copyTextureToTexture || !e || !e.eyes) return false;
    var list = e.eyes();
    if (list.length < 2 || !list[0].C) return false;
    Vec2 = tex.offset.constructor; TexCtor = tex.constructor;
    eyes = list.map(prepare);
    return true;
  }

  var api = {
    set: function (left, right) { target['-1'] = clamp(+left || 0, 0, 1); target['1'] = clamp(right == null ? +left || 0 : +right || 0, 0, 1); liveUntil = performance.now() + 300; },
    blink: function () { blinkT = performance.now(); },
    // play an eyelid clip (ignored while face capture drives the lids); delayMs to line it up
    play: function (name, delayMs) { if (!CLIPS[name]) return false; clip = { name: name, start: performance.now() + (delayMs || 0), flip: Math.random() < .5 }; return true; },
    stop: function () { clip = null; },
    get clip() { return clip && clip.name; },
    clips: Object.keys(CLIPS),
    setAuto: function (v) { auto = !!v; },
    get state() { return { left: cur['-1'], right: cur['1'] }; }
  };
  (function wait(n) {
    var a = window.__octopusAvatar;
    if (a && a.importedModel && a.renderer && window.__octoMouth && install(a)) { window.__octoLids = api; requestAnimationFrame(tick); return; }
    if (n < 400) setTimeout(function () { wait(n + 1); }, 150);
  })(0);
})();
