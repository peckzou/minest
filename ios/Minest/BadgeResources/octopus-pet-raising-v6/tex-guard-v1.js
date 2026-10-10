/* Pet Raising — texture guard v1 (44.1).
   On iPhone the octopus turned black (with the eye catchlights and the house front gone) after Pet
   Raising had been open a while — consistent with iOS reclaiming memory: a WebGL/2D context is lost and
   restored, and the baked skin texture is re-uploaded from an <img> whose decoded pixels were already
   discarded (its blob source revoked by the loader), i.e. from nothing.
   - base(tex, renderer): an owned canvas copy of the skin texture (drawn from the image, or read back
     from the GPU when the image no longer draws), installed as texture.image so any later re-upload has
     real pixels. The face modules (eyes, mouth, lids) read from this too.
   - re-announces 'octo-gl-restored' after a WebGL context restore so painted patches are re-applied.
   - diagnostics: the parent page can ask {type:'minest-diag'} and gets a report back. */
(function () {
  'use strict';
  if (window.__octoTex) return;
  var snap = null, snapTex = null, log = [], errors = [], gl = { lost: 0, restored: 0 };
  function note(s) { log.push(Math.round(performance.now()) + ' ' + s); if (log.length > 40) log.shift(); }
  window.addEventListener('error', function (e) { errors.push(String(e.message || e).slice(0, 160)); if (errors.length > 20) errors.shift(); });
  window.addEventListener('unhandledrejection', function (e) { errors.push('promise: ' + String(e.reason && e.reason.message || e.reason).slice(0, 140)); });

  function isBlank(c) {
    var s = document.createElement('canvas'); s.width = s.height = 32;
    var x = s.getContext('2d', { willReadFrequently: true }); x.drawImage(c, 0, 0, 32, 32);
    var d = x.getImageData(0, 0, 32, 32).data, sum = 0;
    for (var i = 0; i < d.length; i += 4) sum += d[i] + d[i + 1] + d[i + 2];
    s.width = s.height = 0;
    return sum < 32 * 32 * 6;
  }
  function readback(renderer, tex, w, h) {
    try {
      var g = renderer.getContext(), props = renderer.properties.get(tex), t = props && props.__webglTexture;
      if (!t) return null;
      var fb = g.createFramebuffer();
      g.bindFramebuffer(g.FRAMEBUFFER, fb);
      g.framebufferTexture2D(g.FRAMEBUFFER, g.COLOR_ATTACHMENT0, g.TEXTURE_2D, t, 0);
      var ok = g.checkFramebufferStatus(g.FRAMEBUFFER) === g.FRAMEBUFFER_COMPLETE, buf = null;
      if (ok) { buf = new Uint8ClampedArray(w * h * 4); g.readPixels(0, 0, w, h, g.RGBA, g.UNSIGNED_BYTE, buf); }
      g.bindFramebuffer(g.FRAMEBUFFER, null); g.deleteFramebuffer(fb);
      if (renderer.resetState) renderer.resetState();
      return buf;
    } catch (e) { note('readback failed ' + e.message); return null; }
  }
  function base(tex, renderer) {
    if (snap && snapTex === tex) return snap;
    var img = tex.image;
    if (!img || !img.width) return img;
    if (img instanceof HTMLCanvasElement && img.__octoOwned) { snap = img; snapTex = tex; return img; }
    var c = document.createElement('canvas'); c.width = img.width; c.height = img.height; c.__octoOwned = true;
    try { c.getContext('2d').drawImage(img, 0, 0); } catch (e) { note('draw failed ' + e.message); }
    if (isBlank(c)) {
      note('image draws blank — reading back from GPU');
      var px = renderer ? readback(renderer, tex, c.width, c.height) : null;
      if (px) { c.getContext('2d').putImageData(new ImageData(px, c.width, c.height), 0, 0); note(isBlank(c) ? 'GPU copy blank too' : 'GPU copy ok'); }
    } else note('snapshot ok ' + c.width);
    snap = c; snapTex = tex;
    try { tex.image = c; } catch (e) {}
    return c;
  }
  function hookContext() {
    var av = window.__octopusAvatar, cv = av && av.renderer && av.renderer.domElement;
    if (!cv || cv.__octoGuard) return !!cv;
    cv.__octoGuard = true;
    cv.addEventListener('webglcontextlost', function () { gl.lost++; note('webgl context lost'); });
    cv.addEventListener('webglcontextrestored', function () {
      gl.restored++; note('webgl context restored');
      if (snapTex) snapTex.needsUpdate = true;              // re-upload from the owned copy
      setTimeout(function () { window.dispatchEvent(new Event('octo-gl-restored')); }, 60);
    });
    return true;
  }
  (function wait(n) { if (!hookContext() && n < 400) setTimeout(function () { wait(n + 1); }, 150); })(0);

  window.addEventListener('message', function (e) {
    var d = e.data;
    if (!d || d.type !== 'minest-diag') return;
    var av = window.__octopusAvatar, H = window.__octoHouse, C = window.__octoCopyCat;
    var report = {
      gl: gl, log: log.slice(-15), errors: errors.slice(-10),
      snapshot: snap ? { w: snap.width, blank: isBlank(snap) } : null,
      modules: { eyes: !!window.__v6EyeHighlight, mouth: !!window.__octoMouth, lids: !!window.__octoLids, motion: !!window.__motionV4, house: H ? H.state : null, copycat: C ? { on: C.on, source: C.source } : null, expr: window.__octoExpression ? window.__octoExpression.current : null },
      model: av && av.importedModel ? { visible: av.importedModel.visible, swim: av.freeSwimActive } : null,
      mem: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1e6) : null
    };
    try { (e.source || window.parent).postMessage({ type: 'minest-diag-result', data: report }, '*'); } catch (err) {}
  });
  // 44.2: one compositor for everything painted on the face (mouth, eyelids). Their patches overlap
  // (the eye regions reach the mouth), and uploading them separately let an eyelid patch — carrying the
  // original texture with the old painted mouth — overwrite the new mouth: the mouth flickered on every
  // blink. Now each layer draws into one image of the face area, rebuilt from the clean base and
  // uploaded once per change.
  var face = { layers: [], dirty: false, tex: null, R: null, cv: null, ctx: null, ptex: null, U: null, last: 0 };
  function faceLayer(name, tex, renderer, rect, draw, order) {
    face.tex = tex; face.R = renderer;
    face.layers = face.layers.filter(function (l) { return l.name !== name; });
    face.layers.push({ name: name, rect: rect, draw: draw, order: order || 0 });
    face.layers.sort(function (a, b) { return a.order - b.order; });
    var x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    face.layers.forEach(function (l) { x0 = Math.min(x0, l.rect.x); y0 = Math.min(y0, l.rect.y); x1 = Math.max(x1, l.rect.x + l.rect.w); y1 = Math.max(y1, l.rect.y + l.rect.h); });
    face.U = { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
    face.cv = document.createElement('canvas'); face.cv.width = face.U.w; face.cv.height = face.U.h;
    face.ctx = face.cv.getContext('2d');
    face.ptex = new tex.constructor(face.cv); face.ptex.flipY = tex.flipY; face.ptex.colorSpace = tex.colorSpace; face.ptex.generateMipmaps = false; face.ptex.premultiplyAlpha = tex.premultiplyAlpha;
    face.dirty = true;
  }
  function faceFlush(now) {
    requestAnimationFrame(faceFlush);
    if (!face.dirty || !face.tex || !face.ctx || now - face.last < 30) return;
    face.dirty = false; face.last = now;
    var U = face.U, c = face.ctx, src = base(face.tex, face.R);
    c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, U.w, U.h);
    c.drawImage(src, U.x, U.y, U.w, U.h, 0, 0, U.w, U.h);
    face.layers.forEach(function (l) { c.save(); c.translate(l.rect.x - U.x, l.rect.y - U.y); try { l.draw(c); } catch (e) {} c.restore(); });
    face.ptex.needsUpdate = true;
    try { face.R.copyTextureToTexture(face.ptex, face.tex, null, new face.tex.offset.constructor(U.x, U.y)); } catch (e) { note('face upload failed ' + e.message); }
  }
  requestAnimationFrame(faceFlush);
  window.addEventListener('octo-gl-restored', function () { face.dirty = true; });
  window.__octoTex = { base: base, note: note, face: { layer: faceLayer, invalidate: function () { face.dirty = true; }, get rect() { return face.U; } }, get log() { return log; }, get errors() { return errors; } };
})();
