/* Pet Raising — Mouth v1 (43.6 prototype).
   The v23 octopus has no mouth bones or morph targets: the mouth is painted into its baked texture
   (material.emissiveMap, 2048²). This module redraws just the mouth's small patch of that texture on
   the GPU (renderer.copyTextureToTexture → only ~180×90 texels uploaded, mipmaps regenerated), so the
   octopus can open, close, widen and round its mouth with the same material and lighting — no seams.
     1. find the painted mouth in the texture (dark interior + lip rim) and its centre / width;
     2. cover it with fur taken from just above and below it (feathered mask);
     3. draw a parametric mouth on top: open 0–1, wide, round (o/u), smile (−1 frown … 1 smile).
   API: window.__octoMouth.set({ open, wide, round, smile }) · .viseme(name, weight) · .mood(name)
   The avatar's own setViseme()/setAudioAmplitude() (used by the talk pipeline) now drive it, so lip
   sync works through the existing calls. */
(function () {
  'use strict';
  if (window.__octoMouth) return;

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }

  // Oculus/Meta-style visemes → mouth shape (the talk pipeline already emits these names)
  var VISEMES = {
    sil: { open: 0, wide: 1, round: 0, smile: .55 },
    PP: { open: 0, wide: .92, round: .1, smile: .2, press: 1 },
    FF: { open: .12, wide: .95, round: 0, smile: .3 },
    TH: { open: .2, wide: .95, round: 0, smile: .3 },
    DD: { open: .3, wide: .95, round: .05, smile: .35 },
    kk: { open: .34, wide: .92, round: .1, smile: .3 },
    CH: { open: .26, wide: .8, round: .35, smile: .2 },
    SS: { open: .16, wide: 1.05, round: 0, smile: .45 },
    nn: { open: .2, wide: .95, round: 0, smile: .35 },
    RR: { open: .26, wide: .82, round: .4, smile: .2 },
    aa: { open: .9, wide: 1.05, round: .05, smile: .4 },
    E: { open: .5, wide: 1.12, round: 0, smile: .5 },
    I: { open: .3, wide: 1.15, round: 0, smile: .6 },
    O: { open: .62, wide: .72, round: .85, smile: .1 },
    U: { open: .3, wide: .62, round: 1, smile: .05 },
    mm: { open: 0, wide: .92, round: .1, smile: .2, press: 1 }
  };
  // resting mouths per mood (the original painting is a small open smile)
  var MOODS = {
    neutral: { open: .24, wide: 1, round: 0, smile: .8 },
    happy: { open: .55, wide: 1.1, round: 0, smile: 1 },
    excited: { open: .8, wide: 1.12, round: .05, smile: 1 },
    love: { open: .25, wide: 1.02, round: 0, smile: 1 },
    curious: { open: .3, wide: .78, round: .6, smile: .2 },
    surprised: { open: .75, wide: .7, round: .95, smile: 0 },
    sleepy: { open: 0, wide: .85, round: 0, smile: .35 },
    sad: { open: .08, wide: .85, round: 0, smile: -.65 },
    shy: { open: 0, wide: .8, round: 0, smile: .6 },
    dizzy: { open: .35, wide: .9, round: .3, smile: -.1, wobble: 1 },
    playful: { open: .42, wide: 1.06, round: .08, smile: .95 }
  };

  // 43.6 motion v3 — short keyframed mouth performances. Keys: t (s), shape fields; `b` = puff bubbles.
  var O = function (open, wide, round, smile, press) { return { open: open, wide: wide == null ? 1 : wide, round: round || 0, smile: smile == null ? .5 : smile, press: press || 0 }; };
  var CLIPS = {
    giggle: [[0, O(.15, 1.05, 0, 1)], [.12, O(.6, 1.1, 0, 1)], [.24, O(.15, 1.05, 0, 1)], [.36, O(.6, 1.1, 0, 1)], [.48, O(.12, 1.05, 0, 1)], [.6, O(.55, 1.1, 0, 1)], [.78, O(.2, 1.05, 0, 1)]],
    wheee: [[0, O(.25, .9, .2, .8)], [.25, O(.85, 1, .3, .9)], [1.1, O(.8, 1, .35, .9)], [1.4, O(.35, 1, .1, .9)]],
    yawn: [[0, O(0, .9, 0, .3)], [.35, O(.35, .92, .3, .1)], [1.1, O(1, 1, .4, -.05)], [1.7, O(.98, 1, .38, -.05)], [2.2, O(0, .9, 0, .35)], [2.6, O(0, .88, 0, .35)]],
    puff: [[0, O(0, .9, .1, .3, 1)], [.45, O(0, .82, .4, .2, 1)], [.6, O(.28, .6, 1, .05), 'b'], [.95, O(.22, .62, 1, .05), 'b'], [1.25, O(.2, .64, 1, .05), 'b'], [1.55, O(.05, .85, .2, .4)]],
    hum: [[0, O(0, .9, .1, .5, 1)], [.25, O(.06, .9, .1, .5)], [.5, O(0, .9, .1, .5, 1)], [.75, O(.07, .9, .1, .55)], [1, O(0, .9, .1, .5, 1)], [1.25, O(.06, .9, .1, .5)], [1.6, O(0, .92, 0, .6, 1)]],
    gasp: [[0, O(.2, .9, .3, .3)], [.1, O(.75, .72, .95, 0)], [.6, O(.7, .72, .95, 0)], [1, O(.35, .8, .5, .2)]],
    ooh: [[0, O(.15, .8, .5, .3)], [.3, O(.32, .66, .9, .1)], [1.1, O(.3, .68, .85, .1)], [1.4, O(.2, .85, .3, .4)]],
    munch: [[0, O(.45, .9, .1, .5)], [.15, O(0, .92, 0, .55, 1)], [.3, O(.45, .9, .1, .5)], [.45, O(0, .92, 0, .55, 1)], [.6, O(.4, .9, .1, .5)], [.75, O(0, .95, 0, .7, 1)]],
    smirk: [[0, O(0, .85, 0, .9)], [1.4, O(0, .85, 0, .95)]],
    pout: [[0, O(0, .8, .2, -.6, 1)], [1.4, O(0, .8, .2, -.55, 1)]],
    chatter: [[0, O(.1, .95, 0, 0)], [.06, O(.02, .95, 0, 0)], [.12, O(.1, .95, 0, 0)], [.18, O(.02, .95, 0, 0)], [.24, O(.1, .95, 0, 0)], [.3, O(.02, .95, 0, 0)], [.36, O(.1, .95, 0, 0)], [.5, O(.05, .95, 0, .1)]]
  };
  var clip = null, liveShape = null, liveUntil = 0;
  function clipShape(now) {
    if (!clip) return null;
    var t = (now - clip.start) / 1000;
    if (t < 0) return null;
    var keys = CLIPS[clip.name];
    if (t > keys[keys.length - 1][0] + .05) { clip = null; return null; }
    for (var i = 0; i < keys.length; i++) {
      if (keys[i][2] === 'b' && !clip.fired[i] && t >= keys[i][0]) { clip.fired[i] = true; puffBubbles(2 + Math.floor(Math.random() * 3)); }
    }
    var a = keys[0], b = keys[keys.length - 1];
    for (var k = 0; k < keys.length - 1; k++) if (t >= keys[k][0] && t <= keys[k + 1][0]) { a = keys[k]; b = keys[k + 1]; break; }
    var u = b[0] > a[0] ? clamp((t - a[0]) / (b[0] - a[0]), 0, 1) : 1;
    u = u * u * (3 - 2 * u);
    var out = {};
    ['open', 'wide', 'round', 'smile', 'press'].forEach(function (p) { out[p] = lerp(a[1][p], b[1][p], u); });
    out.wobble = 0;
    return out;
  }
  // screen point of the mouth (client px), for bubbles
  function mouthClientPoint() {
    if (anchorVertex < 0 || !av || !av.camera) return null;
    var V3 = skinned.position.constructor, p = new V3();
    skinned.getVertexPosition(anchorVertex, p); p.applyMatrix4(skinned.matrixWorld).project(av.camera);
    var r = R.domElement.getBoundingClientRect();
    return { x: r.left + (p.x + 1) / 2 * r.width, y: r.top + (1 - p.y) / 2 * r.height };
  }
  function puffBubbles(n) {
    var layer = document.querySelector('.ocean-v2-bubble-layer'), pt = mouthClientPoint();
    if (!layer || !pt) return;
    var lr = layer.getBoundingClientRect();
    for (var i = 0; i < n; i++) {
      var b = document.createElement('i');
      b.className = 'ocean-v2-reactive-bubble';
      b.style.left = (pt.x - lr.left + (Math.random() - .5) * 8).toFixed(1) + 'px';
      b.style.top = (pt.y - lr.top - 4 - Math.random() * 6).toFixed(1) + 'px';
      b.style.setProperty('--bubble-size', (4 + Math.random() * 7).toFixed(1) + 'px');
      b.style.setProperty('--bubble-life', (1.6 + Math.random() * 1.2).toFixed(2) + 's');
      b.style.setProperty('--bubble-rise', (-70 - Math.random() * 60).toFixed(1) + 'px');
      b.style.setProperty('--bubble-drift', ((Math.random() - .5) * 30).toFixed(1) + 'px');
      b.addEventListener('animationend', function () { this.remove(); }, { once: true });
      layer.appendChild(b);
    }
  }

  var av, skinned, tex, R, Vec2, TexCtor;
  var region = null;      // texel rect of the patch in the 2048 texture
  var clean = null;       // patch with the painted mouth removed
  var patch, pctx, patchTex, mouthInfo;
  var cur = { open: .24, wide: 1, round: 0, smile: .8, press: 0, wobble: 0 };
  var target = Object.assign({}, MOODS.neutral), mood = 'neutral', talkUntil = 0, visemeTarget = null, lastKey = '', lastUpload = 0;

  // ---------------------------------------------------------------------------------------------
  // 1 + 2: find and erase the painted mouth
  // ---------------------------------------------------------------------------------------------
  function analyse() {
    var img = window.__octoTex ? window.__octoTex.base(tex, R) : tex.image, W = img.width, H = img.height;
    var g = skinned.geometry, P = g.attributes.position, UV = g.attributes.uv;
    // dark texels on the front of the face, centred between the eyes and below them
    var maxY = 0; for (var i = 0; i < P.count; i++) maxY = Math.max(maxY, P.getY(i));
    var probe = document.createElement('canvas'), S = 1024; probe.width = probe.height = S;
    var pc = probe.getContext('2d', { willReadFrequently: true }); pc.drawImage(img, 0, 0, S, S);
    var pd = pc.getImageData(0, 0, S, S).data;
    probe.width = probe.height = 0;
    function lumUV(u, v) { var x = clamp(Math.floor(u * S), 0, S - 1), y = clamp(Math.floor(v * S), 0, S - 1), k = (y * S + x) * 4; return .3 * pd[k] + .59 * pd[k + 1] + .11 * pd[k + 2]; }
    var su = 0, sv = 0, n = 0;
    for (var j = 0; j < P.count; j++) {
      var x = P.getX(j), y = P.getY(j), z = P.getZ(j);
      if (Math.abs(x) > .09 || z < 0 || y < maxY * .4 || y > maxY * .62) continue;
      if (lumUV(UV.getX(j), UV.getY(j)) < 90) { su += UV.getX(j); sv += UV.getY(j); n++; }
    }
    if (n < 3) return false;
    var cu = su / n, cv = sv / n;
    // face position of the mouth (dark vertices' centroid), then how face directions map to texels
    var fx = 0, fy = 0, fn = 0;
    for (var j2 = 0; j2 < P.count; j2++) {
      var x2 = P.getX(j2), y2 = P.getY(j2), z2 = P.getZ(j2);
      if (Math.abs(x2) > .09 || z2 < 0 || y2 < maxY * .4 || y2 > maxY * .62) continue;
      if (lumUV(UV.getX(j2), UV.getY(j2)) < 90) { fx += x2; fy += y2; fn++; }
    }
    fx /= fn; fy /= fn;
    var bestD = 1e9;
    for (var j3 = 0; j3 < P.count; j3++) {
      if (P.getZ(j3) < 0) continue;
      var dd = Math.hypot(P.getX(j3) - fx, P.getY(j3) - fy) - P.getZ(j3) * .01;
      if (dd < bestD) { bestD = dd; anchorVertex = j3; }
    }
    var d = .03, p0 = uvAtFace(g, fx, fy), px1 = uvAtFace(g, fx + d, fy), py1 = uvAtFace(g, fx, fy - d);
    if (p0 && px1 && py1) {
      faceAxes = { ex: [(px1[0] - p0[0]) * W / d, (px1[1] - p0[1]) * H / d], ey: [(py1[0] - p0[0]) * W / d, (py1[1] - p0[1]) * H / d] };
    }
    // flood-fill the dark interior at full resolution in a local window
    var win = Math.round(W * .06), wx0 = clamp(Math.round(cu * W) - win, 0, W - 1), wy0 = clamp(Math.round(cv * H) - win, 0, H - 1), ww = win * 2, wh = win * 2;
    var wc = document.createElement('canvas'); wc.width = ww; wc.height = wh;
    var wctx = wc.getContext('2d', { willReadFrequently: true }); wctx.drawImage(img, wx0, wy0, ww, wh, 0, 0, ww, wh);
    var wd = wctx.getImageData(0, 0, ww, wh).data;
    function L(x, y) { var k = (y * ww + x) * 4; return .3 * wd[k] + .59 * wd[k + 1] + .11 * wd[k + 2]; }
    var sx = Math.round(cu * W) - wx0, sy = Math.round(cv * H) - wy0, best = 1e9;
    for (var dy = -12; dy <= 12; dy++) for (var dx = -20; dx <= 20; dx++) { var l = L(clamp(sx + dx, 0, ww - 1), clamp(sy + dy, 0, wh - 1)); if (l < best) { best = l; var bx = sx + dx, by = sy + dy; } }
    var seen = new Uint8Array(ww * wh), st = [bx, by], minx = ww, maxx = 0, miny = wh, maxy = 0, cnt = 0;
    seen[by * ww + bx] = 1;
    while (st.length && cnt < 40000) {
      var yy = st.pop(), xx = st.pop(); cnt++;
      if (xx < minx) minx = xx; if (xx > maxx) maxx = xx; if (yy < miny) miny = yy; if (yy > maxy) maxy = yy;
      var nb = [xx + 1, yy, xx - 1, yy, xx, yy + 1, xx, yy - 1];
      for (var q = 0; q < 8; q += 2) {
        var nx = nb[q], ny = nb[q + 1];
        if (nx < 0 || ny < 0 || nx >= ww || ny >= wh) continue;
        var id = ny * ww + nx;
        if (!seen[id] && L(nx, ny) < 95) { seen[id] = 1; st.push(nx, ny); }
      }
    }
    var mw = maxx - minx + 1, mh = maxy - miny + 1;
    if (mw < 8 || mw > ww * .9) return false;
    // patch = mouth bbox with generous margins (the new mouth can be taller than the old one)
    var padX = Math.round(mw * .45), padY = Math.round(Math.max(mh, mw * .35) * 1.3);
    region = { x: wx0 + minx - padX, y: wy0 + miny - padY, w: mw + padX * 2, h: mh + padY * 2 };
    region.x = clamp(region.x, 0, W - region.w); region.y = clamp(region.y, 0, H - region.h);
    mouthInfo = { cx: wx0 + (minx + maxx) / 2 - region.x, cy: wy0 + (miny + maxy) / 2 - region.y, w: mw, h: mh, fw: mw, fh: mh };
    if (faceAxes) {
      // extent of the painted mouth measured along face-right / face-down (in texels along that axis)
      var sxA = Math.hypot(faceAxes.ex[0], faceAxes.ex[1]), ux = faceAxes.ex[0] / sxA, uy = faceAxes.ex[1] / sxA;
      var syA = Math.hypot(faceAxes.ey[0], faceAxes.ey[1]), vx = faceAxes.ey[0] / syA, vy = faceAxes.ey[1] / syA;
      var a0 = 1e9, a1 = -1e9, b0 = 1e9, b1 = -1e9, mcx = wx0 + (minx + maxx) / 2, mcy = wy0 + (miny + maxy) / 2;
      for (var qy = miny; qy <= maxy; qy++) for (var qx = minx; qx <= maxx; qx++) {
        if (!seen[qy * ww + qx]) continue;
        var ddx = wx0 + qx - mcx, ddy = wy0 + qy - mcy, pa = ddx * ux + ddy * uy, pb = ddx * vx + ddy * vy;
        if (pa < a0) a0 = pa; if (pa > a1) a1 = pa; if (pb < b0) b0 = pb; if (pb > b1) b1 = pb;
      }
      mouthInfo.fw = a1 - a0; mouthInfo.fh = Math.max(4, b1 - b0);
      mouthInfo.cx += (a0 + a1) / 2 * ux + (b0 + b1) / 2 * vx; mouthInfo.cy += (a0 + a1) / 2 * uy + (b0 + b1) / 2 * vy;
    }
    // mask of the old mouth, relative to the patch: dark pixels, holes filled row/column-wise
    // (the painting's light interior and pink lip are inside the dark outline), then dilated
    var RW = region.w, RH = region.h, hard = new Float32Array(RW * RH);
    for (var py = 0; py < RH; py++) for (var px = 0; px < RW; px++) {
      var lx = px + region.x - wx0, ly = py + region.y - wy0;
      if (lx >= 0 && ly >= 0 && lx < ww && ly < wh && seen[ly * ww + lx]) hard[py * RW + px] = 1;
    }
    var filled = new Float32Array(hard);
    for (var ry = 0; ry < RH; ry++) { var f0 = -1, f1 = -1; for (var rx = 0; rx < RW; rx++) if (hard[ry * RW + rx]) { if (f0 < 0) f0 = rx; f1 = rx; } for (var k1 = f0; k1 >= 0 && k1 <= f1; k1++) filled[ry * RW + k1] = 1; }
    for (var cx2 = 0; cx2 < RW; cx2++) { var g0 = -1, g1 = -1; for (var cy2 = 0; cy2 < RH; cy2++) if (hard[cy2 * RW + cx2]) { if (g0 < 0) g0 = cy2; g1 = cy2; } for (var k2 = g0; k2 >= 0 && k2 <= g1; k2++) filled[k2 * RW + cx2] = 1; }
    var dil = Math.max(4, Math.round(mh * .45)), feather = Math.max(3, Math.round(mh * .35));
    // distance to the filled mouth (chamfer) → soft mask: 1 inside + dil, fading over `feather`
    var dist = new Float32Array(RW * RH);
    for (var d0 = 0; d0 < dist.length; d0++) dist[d0] = filled[d0] ? 0 : 1e6;
    for (var pass = 0; pass < 2; pass++) {
      for (var yA = 0; yA < RH; yA++) for (var xA = 0; xA < RW; xA++) {
        var iA = yA * RW + xA, v = dist[iA];
        if (xA > 0) v = Math.min(v, dist[iA - 1] + 1); if (yA > 0) v = Math.min(v, dist[iA - RW] + 1);
        if (xA > 0 && yA > 0) v = Math.min(v, dist[iA - RW - 1] + 1.414); if (xA < RW - 1 && yA > 0) v = Math.min(v, dist[iA - RW + 1] + 1.414);
        dist[iA] = v;
      }
      for (var yB = RH - 1; yB >= 0; yB--) for (var xB = RW - 1; xB >= 0; xB--) {
        var iB = yB * RW + xB, w2 = dist[iB];
        if (xB < RW - 1) w2 = Math.min(w2, dist[iB + 1] + 1); if (yB < RH - 1) w2 = Math.min(w2, dist[iB + RW] + 1);
        if (xB < RW - 1 && yB < RH - 1) w2 = Math.min(w2, dist[iB + RW + 1] + 1.414); if (xB > 0 && yB < RH - 1) w2 = Math.min(w2, dist[iB + RW - 1] + 1.414);
        dist[iB] = w2;
      }
    }
    var mask = new Float32Array(RW * RH);
    for (var m0 = 0; m0 < mask.length; m0++) { var e = (dist[m0] - dil) / feather; mask[m0] = e <= 0 ? 1 : e >= 1 ? 0 : .5 + .5 * Math.cos(e * Math.PI); }
    // original patch pixels
    var orig = document.createElement('canvas'); orig.width = RW; orig.height = RH;
    var octx = orig.getContext('2d', { willReadFrequently: true }); octx.drawImage(img, region.x, region.y, RW, RH, 0, 0, RW, RH);
    var od = octx.getImageData(0, 0, RW, RH), O = od.data;
    // (a) smooth base: diffuse the surrounding colour into the hole (Jacobi, only where mask > 0)
    var base = new Float32Array(RW * RH * 3), known = new Uint8Array(RW * RH), list = [];
    for (var b0 = 0; b0 < RW * RH; b0++) { base[b0 * 3] = O[b0 * 4]; base[b0 * 3 + 1] = O[b0 * 4 + 1]; base[b0 * 3 + 2] = O[b0 * 4 + 2]; if (mask[b0] > .001) list.push(b0); else known[b0] = 1; }
    // start the hole at the average border colour so diffusion converges quickly
    var br = 0, bgc = 0, bb = 0, bn = 0;
    for (var b1 = 0; b1 < RW * RH; b1++) if (known[b1] && mask[b1] === 0 && dist[b1] < dil + feather + 3) { br += base[b1 * 3]; bgc += base[b1 * 3 + 1]; bb += base[b1 * 3 + 2]; bn++; }
    if (bn) for (var b2 = 0; b2 < list.length; b2++) { var q0 = list[b2]; base[q0 * 3] = br / bn; base[q0 * 3 + 1] = bgc / bn; base[q0 * 3 + 2] = bb / bn; }
    for (var it = 0; it < 260; it++) for (var b3 = 0; b3 < list.length; b3++) {
      var q = list[b3], qx = q % RW, qy = (q / RW) | 0, sr = 0, sg = 0, sb = 0, sn = 0;
      if (qx > 0) { sr += base[(q - 1) * 3]; sg += base[(q - 1) * 3 + 1]; sb += base[(q - 1) * 3 + 2]; sn++; }
      if (qx < RW - 1) { sr += base[(q + 1) * 3]; sg += base[(q + 1) * 3 + 1]; sb += base[(q + 1) * 3 + 2]; sn++; }
      if (qy > 0) { sr += base[(q - RW) * 3]; sg += base[(q - RW) * 3 + 1]; sb += base[(q - RW) * 3 + 2]; sn++; }
      if (qy < RH - 1) { sr += base[(q + RW) * 3]; sg += base[(q + RW) * 3 + 1]; sb += base[(q + RW) * 3 + 2]; sn++; }
      base[q * 3] = sr / sn; base[q * 3 + 1] = sg / sn; base[q * 3 + 2] = sb / sn;
    }
    // (b) fur detail (high-pass) borrowed from fur beside the mouth, blended from two sources
    function detailFrom(dx, dy) {
      var c = document.createElement('canvas'); c.width = RW; c.height = RH;
      var cc = c.getContext('2d', { willReadFrequently: true }); cc.drawImage(img, region.x + dx, region.y + dy, RW, RH, 0, 0, RW, RH);
      var sharp = cc.getImageData(0, 0, RW, RH).data;
      cc.filter = 'blur(3px)'; cc.drawImage(c, 0, 0); cc.filter = 'none';
      var blur = cc.getImageData(0, 0, RW, RH).data, out = new Float32Array(RW * RH * 3);
      for (var z = 0; z < RW * RH; z++) { out[z * 3] = sharp[z * 4] - blur[z * 4]; out[z * 3 + 1] = sharp[z * 4 + 1] - blur[z * 4 + 1]; out[z * 3 + 2] = sharp[z * 4 + 2] - blur[z * 4 + 2]; }
      return out;
    }
    var off = Math.round(mh + dil * 2 + feather);
    var dA = detailFrom(0, -off), dB = detailFrom(Math.round(mw * .7), 0);
    for (var b4 = 0; b4 < list.length; b4++) {
      var p4 = list[b4], m4 = mask[p4];
      for (var ch = 0; ch < 3; ch++) {
        var val = base[p4 * 3 + ch] + (dA[p4 * 3 + ch] * .6 + dB[p4 * 3 + ch] * .4) * .9;
        O[p4 * 4 + ch] = Math.round(O[p4 * 4 + ch] * (1 - m4) + clamp(val, 0, 255) * m4);
      }
    }
    clean = document.createElement('canvas'); clean.width = RW; clean.height = RH;
    var cctx = clean.getContext('2d'); cctx.putImageData(od, 0, 0);
    // colour reference for lips / shading: average skin around the mouth
    var sd = cctx.getImageData(0, 0, region.w, Math.max(1, Math.round(region.h * .2))).data, r = 0, gg = 0, b = 0, c = 0;
    for (var s = 0; s < sd.length; s += 16) { r += sd[s]; gg += sd[s + 1]; b += sd[s + 2]; c++; }
    mouthInfo.skin = [r / c, gg / c, b / c];
    return true;
  }

  var faceAxes = null, anchorVertex = -1;    // texels per face unit along face-right (ex) and face-down (ey)
  // UV at a point of the front of the face, by projecting along z onto the mesh (bind pose)
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

  // ---------------------------------------------------------------------------------------------
  // 3: draw the mouth
  // ---------------------------------------------------------------------------------------------
  function rgb(c, k, a) { return 'rgba(' + Math.round(c[0] * k) + ',' + Math.round(c[1] * k) + ',' + Math.round(c[2] * k) + ',' + (a == null ? 1 : a) + ')'; }
  function draw(m) {
    var c = pctx, I = mouthInfo, skin = I.skin;
    c.clearRect(0, 0, region.w, region.h);
    c.drawImage(clean, 0, 0);
    var t = performance.now() * .001;
    c.save();
    // draw level and in proportion ON THE FACE: x = face right, y = face down, unit ≈ 1 texel
    c.translate(I.cx, I.cy);
    if (faceAxes) {
      var sx = Math.hypot(faceAxes.ex[0], faceAxes.ex[1]);
      c.transform(faceAxes.ex[0] / sx, faceAxes.ex[1] / sx, faceAxes.ey[0] / sx, faceAxes.ey[1] / sx, 0, 0);
    }
    var W0 = I.fw * .8 * m.wide * (1 - .38 * m.round);
    var hw = W0 / 2, cx = (m.wobble ? Math.sin(t * 6) * I.fw * .03 : 0), cy = -I.fh * .1;
    I = { w: I.fw, h: I.fh, skin: I.skin };
    var curve = I.w * .13 * m.smile;                    // corners up (smile) / down (frown)
    var openH = I.w * .34 * m.open * (1 + .25 * m.round);
    var lineW = Math.max(2, I.h * .16);
    var lx = cx - hw, rx = cx + hw, ly = cy - curve, ry = cy - curve + (m.wobble ? Math.sin(t * 7) * I.h * .1 : 0);
    if (openH < lineW * .7) {
      // closed: a soft smile line with a lighter lower lip and small corner creases
      c.lineCap = 'round';
      c.strokeStyle = rgb(skin, .55, .35); c.lineWidth = lineW * 2.4;
      c.beginPath(); c.moveTo(lx, ly + lineW * .3); c.quadraticCurveTo(cx, cy + curve * 1.2 + lineW * .3 + (m.press ? 0 : openH * .5), rx, ry + lineW * .3); c.stroke();
      c.strokeStyle = rgb(skin, .22, .92); c.lineWidth = lineW * (m.press ? 1.15 : 1);
      c.beginPath(); c.moveTo(lx, ly); c.quadraticCurveTo(cx, cy + curve * 1.2 + (m.press ? 0 : openH * .5), rx, ry); c.stroke();
      c.strokeStyle = rgb(skin, 1.12, .55); c.lineWidth = lineW * .55;
      c.beginPath(); c.moveTo(lx + hw * .3, ly + lineW * 1.1); c.quadraticCurveTo(cx, cy + curve * 1.2 + lineW * 1.3, rx - hw * .3, ry + lineW * 1.1); c.stroke();
      c.strokeStyle = rgb(skin, .62, .3); c.lineWidth = lineW * .45;
      c.beginPath(); c.moveTo(lx - lineW * .1, ly - lineW * .35); c.lineTo(lx + lineW * .15, ly + lineW * .1); c.moveTo(rx + lineW * .1, ry - lineW * .35); c.lineTo(rx - lineW * .15, ry + lineW * .1); c.stroke();
      c.restore();
      return;
    }
    // open: upper lip curve + lower lip curve, dark mouth, tongue, lip rim
    var upY = cy + curve * .6 - openH * (.18 + .25 * m.round);
    var loY = cy + curve * 1.3 + openH;
    var round = m.round;
    c.beginPath();
    c.moveTo(lx, ly);
    c.bezierCurveTo(lerp(lx, cx, .35), lerp(ly, upY, 1 - round * .3) - openH * round * .3, lerp(rx, cx, .35), lerp(ry, upY, 1 - round * .3) - openH * round * .3, rx, ry);
    c.bezierCurveTo(rx + hw * .05 * round, lerp(ry, loY, .55), lerp(rx, cx, .3), loY, cx, loY);
    c.bezierCurveTo(lerp(lx, cx, .3), loY, lx - hw * .05 * round, lerp(ly, loY, .55), lx, ly);
    c.closePath();
    c.save(); c.strokeStyle = rgb(skin, .55, .14); c.lineWidth = lineW * 1.8; c.lineJoin = 'round'; c.stroke(); c.restore();
    var g = c.createLinearGradient(0, upY, 0, loY);
    g.addColorStop(0, 'rgb(40,10,26)'); g.addColorStop(1, 'rgb(78,22,44)');
    c.fillStyle = g; c.fill();
    c.save(); c.clip();
    // tongue
    var tw = hw * (.8 - .3 * round), th = openH * .55;
    c.fillStyle = 'rgb(214,98,128)';
    c.beginPath(); c.ellipse(cx, loY - th * .2, tw, th, 0, Math.PI, 0); c.fill();
    
    // inner shadow under the upper lip
    c.fillStyle = 'rgba(10,0,6,.55)'; c.fillRect(lx, upY - openH, W0, openH * .55);
    c.restore();
    // lip rim (pink, like the original painting)
    c.lineJoin = 'round'; c.lineCap = 'round';
    c.strokeStyle = rgb(skin, .38, .75); c.lineWidth = Math.max(1, lineW * .45); c.stroke();
    c.strokeStyle = rgb(skin, .62, .3); c.lineWidth = Math.max(1, lineW * .35);
    c.beginPath(); c.moveTo(lx - lineW * .15, ly - lineW * .3); c.lineTo(lx + lineW * .1, ly + lineW * .1); c.moveTo(rx + lineW * .15, ry - lineW * .3); c.lineTo(rx - lineW * .1, ry + lineW * .1); c.stroke();
    c.restore();
  }

  function FACE() { return window.__octoTex && window.__octoTex.face; }
  function upload(force) {
    var m = cur;
    var key = [m.open, m.wide, m.round, m.smile, m.press].map(function (v) { return Math.round(v * 40); }).join(',') + (m.wobble > .05 ? ',' + Math.round(performance.now() / 50) : '');
    var t = performance.now();
    if (!force && (key === lastKey || t - lastUpload < 33)) return;
    lastKey = key; lastUpload = t;
    draw(m);
    if (FACE()) { FACE().invalidate(); return; }      // 44.2: shared face compositor (no overlap fights with the eyelids)
    patchTex.needsUpdate = true;
    try { R.copyTextureToTexture(patchTex, tex, null, new Vec2(region.x, region.y)); } catch (e) { console.warn('[mouth] upload failed', e); }
  }

  function tick() {
    requestAnimationFrame(tick);
    if (!region || !enabled) return;
    var tgt = target, cs = clipShape(performance.now()), liveOn = liveShape && performance.now() < liveUntil;
    if (cs) tgt = cs;
    if (visemeTarget && performance.now() < talkUntil) {
      // blend the resting mood with the viseme (talking keeps a little of the mood's smile)
      var v = visemeTarget.shape, w = visemeTarget.w;
      tgt = { open: lerp(MOODS[mood].open * .3, v.open, w), wide: lerp(1, v.wide, w), round: lerp(0, v.round, w), smile: lerp(MOODS[mood].smile, v.smile, w * .7), press: (v.press || 0) * w, wobble: 0 };
    }
    if (liveOn) tgt = liveShape;                 // 43.8 face capture / echo lip sync wins over everything
    var k = liveOn ? .55 : visemeTarget && performance.now() < talkUntil ? .45 : cs ? .32 : .14;   // fast while live / talking / acting
    ['open', 'wide', 'round', 'smile', 'press', 'wobble'].forEach(function (p) { cur[p] += ((tgt[p] || 0) - cur[p]) * k; });
    upload(false);
  }

  var enabled = true;
  function install(a) {
    av = a;
    a.importedModel.traverse(function (n) { if (!skinned && n.isSkinnedMesh) skinned = n; });
    tex = skinned && skinned.material && skinned.material.emissiveMap;
    R = a.renderer;
    if (!tex || !tex.image || !tex.image.width || !R.copyTextureToTexture) return false;
    Vec2 = tex.offset.constructor; TexCtor = tex.constructor;
    if (!analyse()) return false;
    // 44.1: after a WebGL context restore the texture is re-uploaded clean — paint the mouth again
    window.addEventListener('octo-gl-restored', function () { lastKey = ''; upload(true); });
    patch = document.createElement('canvas'); patch.width = region.w; patch.height = region.h;
    pctx = patch.getContext('2d');
    patchTex = new TexCtor(patch);
    patchTex.flipY = tex.flipY; patchTex.colorSpace = tex.colorSpace; patchTex.generateMipmaps = false;
    patchTex.premultiplyAlpha = tex.premultiplyAlpha;
    if (FACE()) FACE().layer('mouth', tex, R, region, function (c) { if (enabled) c.drawImage(patch, 0, 0); }, 0);
    upload(true);
    // the talk pipeline's calls now drive the mouth
    var origV = a.setViseme && a.setViseme.bind(a);
    a.setViseme = function (name, weight) {
      api.viseme(name, weight == null ? 1 : weight);
      return origV ? origV.apply(a, arguments) : undefined;
    };
    var origAmp = a.setAudioAmplitude && a.setAudioAmplitude.bind(a);
    a.setAudioAmplitude = function (amp) {
      // amplitude-only fallback (no visemes): open with loudness
      if (!visemeTarget || performance.now() > talkUntil - 150) {
        var v = clamp(Number(amp) || 0, 0, 1);
        if (v > .02) { visemeTarget = { shape: { open: Math.min(.95, v * 1.6), wide: 1, round: .1, smile: .4 }, w: 1 }; talkUntil = performance.now() + 220; }
      }
      return origAmp ? origAmp.apply(a, arguments) : undefined;
    };
    // follow the eye expressions so face reads as one emotion
    var eyes = window.__v6EyeHighlight;
    if (eyes && eyes.setExpression && !eyes.__mouthHooked) {
      var origE = eyes.setExpression;
      eyes.setExpression = function (name, ms) { api.mood(name, ms); return origE.apply(eyes, arguments); };
      eyes.__mouthHooked = true;
    }
    return true;
  }

  var moodTimer = 0;
  var api = {
    set: function (shape) { Object.keys(shape || {}).forEach(function (k) { target[k] = Number(shape[k]) || 0; }); },
    viseme: function (name, weight) {
      var shape = VISEMES[name] || VISEMES[String(name || '').toLowerCase()] || null;
      if (!shape || shape === VISEMES.sil || weight <= 0) { visemeTarget = null; talkUntil = 0; return; }
      visemeTarget = { shape: shape, w: clamp(weight, 0, 1) };
      talkUntil = performance.now() + 400;
    },
    mood: function (name, ms) {
      if (!MOODS[name]) name = 'neutral';
      mood = name; target = Object.assign({ press: 0, wobble: 0 }, MOODS[name]);
      clearTimeout(moodTimer);
      if (ms) moodTimer = setTimeout(function () { mood = 'neutral'; target = Object.assign({ press: 0, wobble: 0 }, MOODS.neutral); }, ms);
    },
    // a quick self-test: says "a-o-u-m-e" over ~2 s
    demo: function () {
      var seq = ['aa', 'O', 'U', 'mm', 'E', 'I', 'aa', 'PP', 'O', 'sil'], i = 0;
      (function step() { api.viseme(seq[i], 1); i++; if (i < seq.length) setTimeout(step, 220); })();
    },
    setEnabled: function (v) { enabled = !!v; if (FACE()) { FACE().invalidate(); lastKey = ''; return; } if (!enabled && region) { var c = pctx; c.clearRect(0, 0, region.w, region.h); c.drawImage(tex.image, region.x, region.y, region.w, region.h, 0, 0, region.w, region.h); patchTex.needsUpdate = true; R.copyTextureToTexture(patchTex, tex, null, new Vec2(region.x, region.y)); lastKey = ''; } },
    // play a mouth clip (ignored while talking); delayMs lets choreography line it up with a gesture
    play: function (name, delayMs) { if (!CLIPS[name]) return false; clip = { name: name, start: performance.now() + (delayMs || 0), fired: {} }; return true; },
    stop: function () { clip = null; },
    // 43.8: drive the mouth directly (face capture, voice echo); holds for 300 ms after the last call
    live: function (shape) { liveShape = Object.assign({ open: 0, wide: 1, round: 0, smile: .4, press: 0, wobble: 0 }, shape || {}); liveUntil = performance.now() + 300; },
    get clip() { return clip && clip.name; },
    bubbles: puffBubbles,
    point: function () { return mouthClientPoint(); },   // 44.1: mouth position on screen (Care: feeding)
    clips: Object.keys(CLIPS), visemes: Object.keys(VISEMES), moods: Object.keys(MOODS),
    get state() { return Object.assign({}, cur); }, get region() { return region; }
  };

  (function wait(n) {
    var a = window.__octopusAvatar;
    var ready = a && a.importedModel && a.renderer && (function () { var ok = false; a.importedModel.traverse(function (x) { if (x.isSkinnedMesh && x.material && x.material.emissiveMap && x.material.emissiveMap.image) ok = true; }); return ok; })();
    if (ready && install(a)) { window.__octoMouth = api; requestAnimationFrame(tick); return; }
    if (n < 400) setTimeout(function () { wait(n + 1); }, 100);
  })(0);
})();
