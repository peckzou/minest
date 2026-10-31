/* Minest My World — Dynamic Presentation Phase 2: the shared half of Rotating Rack, Library Corridor and Museum Walkthrough.
   One stage (renderer, loop that pauses when hidden, resize, taps vs drags, toast, saved view state), one card reader
   (an object slides out of its place, flies to you, tap to flip to the meaning, tap anywhere and it goes back), and the
   reusable carriers: book, index card, memory orb, badge, framed picture, label plate. Card data comes from rail-common.js
   (Knowledge Drive's data layer): refs only, read live, never copied or written. */
(function () {
  'use strict';
  var K = window.KRail, T = window.THREE; if (!K || !T || window.KShow) return;
  var clamp = K.clamp, lerp = K.lerp, ease = K.ease;

  // ---------------- cards for a source, grouped by list (Board / List / Stack → Card refs)
  function collect(P, src, max) {
    var pl = K.plan(P, src), groups = pl.roads.map(function (r) { return { id: r.id, title: String(r.title).replace(/\s*[(（]\s*\d+\s*[)）]\s*$/, ''), color: r.color, items: r.items.map(function (it) { return { ref: it.ref, section: it.section, I: K.info(P, it.ref) }; }).filter(function (x) { return x.I; }) }; });
    if (src.type === 'list') { var i = pl.start; groups = groups.slice(i).concat(groups.slice(0, i)); }
    var all = []; groups.forEach(function (g) { g.items.forEach(function (it) { it.g = g; all.push(it); }); });
    return { key: pl.key, groups: groups, all: max ? all.slice(0, max) : all };
  }

  // ---------------- art: one cache for every mode
  var cache = new Map();
  function art(I, color, lod) {
    var key = I.ref.id + ':' + (lod || 'near') + ':' + I.sig, hit = cache.get(key);
    if (hit) return Promise.resolve(hit);
    return K.loadImg(I.img).then(function (im) { var t = K.drawBoard(I, lod || 'near', im, color); cache.set(key, t); trim(); return t; });
  }
  function trim() { if (cache.size <= 80) return; var k = cache.keys().next().value; var t = cache.get(k); cache.delete(k); setTimeout(function () { t.dispose(); }, 2000); }
  function spineTex(I, color) {   // a book's spine: the title runs up the spine, a band in the list's colour
    var c = document.createElement('canvas'); c.width = 64; c.height = 320; var x = c.getContext('2d'), h = K.hash(I.ref.id);
    var base = new T.Color(color).offsetHSL(((h % 20) - 10) / 200, -.1, ((h >> 5) % 20 - 14) / 100); x.fillStyle = '#' + base.getHexString(); x.fillRect(0, 0, 64, 320);
    x.fillStyle = 'rgba(255,255,255,.18)'; x.fillRect(0, 18, 64, 6); x.fillRect(0, 296, 64, 6); x.fillStyle = '#e8c878'; x.fillRect(0, 34, 64, 3); x.fillRect(0, 283, 64, 3);
    x.save(); x.translate(40, 270); x.rotate(-Math.PI / 2); x.fillStyle = '#fbf4e2'; x.font = '700 26px ' + K.FONT; var t = I.title; while (x.measureText(t).width > 220 && t.length > 3) t = t.slice(0, -2) + '…'; x.fillText(t, 0, 0); x.restore();
    var tx = new T.CanvasTexture(c); tx.anisotropy = 4; return tx;
  }
  function labelTex(lines, bg, fg) { return K.signTex(lines, bg || '#2b2116', fg || '#e8c878', 512, 140); }

  // ---------------- carriers (each returns a Group; userData.face is the mesh the card art goes on)
  var M = function (c, o) { return new T.MeshStandardMaterial(Object.assign({ color: c, flatShading: true, roughness: .75 }, o || {})); };
  var carriers = {
    book: function (it, opt) {
      opt = opt || {}; var g = new T.Group(), h = K.hash(it.ref.id), th = opt.th || (.1 + (h % 7) / 70), ht = opt.h || (.62 + (h % 5) / 25), dp = opt.d || .46, col = it.g ? it.g.color : '#8a5a3a';
      var spine = spineTex(it.I, col), side = M('#f2ead8'), cover = M(new T.Color(col).offsetHSL(0, -.1, -.08).getStyle()), coverArt = new T.MeshBasicMaterial({ color: '#ffffff', toneMapped: false });
      // +z = the spine (what you see on the shelf); ±x = the covers; the front cover carries the card's art
      var b = new T.Mesh(new T.BoxGeometry(th, ht, dp), [coverArt, cover, side, side, new T.MeshBasicMaterial({ map: spine, toneMapped: false }), side]); b.position.y = ht / 2; g.add(b);
      g.userData = { kind: 'book', body: b, w: th, h: ht, d: dp, faceMat: coverArt, art: 'cover', spine: spine }; if (!opt.noArt) art(it.I, col).then(function (t) { coverArt.map = t; coverArt.needsUpdate = true; });   // on a packed shelf the cover is never seen: noArt skips it
      return g;
    },
    index: function (it) {   // an index card in a little tray
      var g = new T.Group(), col = it.g ? it.g.color : '#5a6b8a', face = new T.MeshBasicMaterial({ color: col, toneMapped: false });
      var card = new T.Mesh(new T.PlaneGeometry(.5, .32), face); card.position.y = .2; card.rotation.x = -.2; g.add(card);
      g.userData = { kind: 'index', body: card, w: .5, h: .32, faceMat: face }; art(it.I, col).then(function (t) { face.map = t; face.color.set('#fff'); face.needsUpdate = true; });
      return g;
    },
    orb: function (it) {
      var g = new T.Group(), col = it.g ? it.g.color : '#6fb0ff', face = new T.MeshBasicMaterial({ color: col, toneMapped: false, side: T.DoubleSide });
      var base = new T.Mesh(new T.CylinderGeometry(.22, .28, .16, 8), M('#c9a24a', { metalness: .5, roughness: .35 })); base.position.y = .08; g.add(base);
      var glass = new T.Mesh(new T.SphereGeometry(.36, 18, 12), M('#bfe0ff', { transparent: true, opacity: .25, emissive: col, emissiveIntensity: .35, depthWrite: false, metalness: .3, roughness: .05 })); glass.position.y = .52; g.add(glass);
      var card = new T.Mesh(new T.PlaneGeometry(.42, .27), face); card.position.y = .52; g.add(card);
      g.userData = { kind: 'orb', body: card, spin: card, w: .42, h: .27, faceMat: face }; art(it.I, col).then(function (t) { face.map = t; face.color.set('#fff'); face.needsUpdate = true; });
      return g;
    },
    badge: function (it) {   // a round medal: the picture in a gold rim, on a ribbon
      var g = new T.Group(), col = it.g ? it.g.color : '#d9a51c', face = new T.MeshBasicMaterial({ color: col, toneMapped: false });
      var rib = new T.Mesh(new T.BoxGeometry(.16, .34, .02), M(col)); rib.position.set(0, .62, -.02); rib.rotation.z = .25; g.add(rib); var rib2 = rib.clone(); rib2.rotation.z = -.25; g.add(rib2);
      var rim = new T.Mesh(new T.CylinderGeometry(.27, .27, .05, 24), M('#d4af37', { metalness: .7, roughness: .3 })); rim.rotation.x = Math.PI / 2; rim.position.y = .4; g.add(rim);
      var disc = new T.Mesh(new T.CircleGeometry(.22, 24), face); disc.position.set(0, .4, .027); g.add(disc);
      g.userData = { kind: 'badge', body: disc, w: .44, h: .44, faceMat: face }; art(it.I, col).then(function (t) { face.map = t; face.color.set('#fff'); face.needsUpdate = true; });
      return g;
    },
    frame: function (it, opt) {
      opt = opt || {}; var w = opt.w || 1.6, h = opt.h || 1, g = new T.Group(), col = it.g ? it.g.color : '#555', face = new T.MeshBasicMaterial({ color: col, toneMapped: false });
      var fr = new T.Mesh(new T.BoxGeometry(w + .16, h + .16, .06), M(opt.frame || '#b08a4a', { metalness: .4, roughness: .4 })); fr.position.z = -.03; g.add(fr);
      var pic = new T.Mesh(new T.PlaneGeometry(w, h), face); pic.position.z = .002; g.add(pic);
      g.userData = { kind: 'frame', body: pic, w: w, h: h, faceMat: face }; art(it.I, col).then(function (t) { face.map = t; face.color.set('#fff'); face.needsUpdate = true; });
      return g;
    },
    plate: function (it) {   // a small brass label plate (exhibit label)
      var t = labelTex([it.I.title, it.I.zh || (it.g ? it.g.title : '')], '#2b2116', '#e8c878'), m = new T.Mesh(new T.PlaneGeometry(.5, .14), new T.MeshBasicMaterial({ map: t, toneMapped: false })); return m;
    }
  };

  // ---------------- the stage
  function stage(opts) {
    var root = document.createElement('div'); root.className = 'kx-root ' + (opts.cls || ''); root.innerHTML = '<canvas class="kx-gl"></canvas>' + (opts.html || '') + '<div class="kx-hint">' + (opts.hint || 'Tap to flip · tap outside to put it back') + '</div><div class="kx-toast"></div>';
    (opts.container || document.body).appendChild(root);
    var $ = function (s) { return root.querySelector(s); }, cvs = $('.kx-gl');
    var dpr = Math.min(window.devicePixelRatio || 1, opts.maxDpr || 2), R = new T.WebGLRenderer({ canvas: cvs, antialias: dpr < 2 }); R.setPixelRatio(dpr);
    var scene = new T.Scene(), cam = new T.PerspectiveCamera(opts.fov || 55, 1, .05, opts.far || 400), S = { root: root, $: $, cvs: cvs, R: R, scene: scene, cam: cam, W: 1, H: 1, alive: true, hFov: opts.hFov || 70 };
    var raf = 0, last = 0, ticks = [], toastT = 0;
    S.toast = function (t) { var e = $('.kx-toast'); e.textContent = t; e.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(function () { e.classList.remove('on'); }, 2000); };
    S.hap = function () { try { webkit.messageHandlers.minest.postMessage({ action: 'haptic', data: { style: 'selection' } }); } catch (e) {} };
    S.tick = function (fn) { ticks.push(fn); };
    function step(now) { raf = 0; if (!S.alive) return; schedule(); var dt = Math.min(.05, (now - (last || now)) / 1000); last = now; ticks.forEach(function (f) { f(dt, now); }); R.render(scene, cam); }
    function schedule() { if (!raf && S.alive && !document.hidden) raf = requestAnimationFrame(step); }
    function onVis() { if (document.hidden) { if (raf) cancelAnimationFrame(raf); raf = 0; if (S.onHide) S.onHide(); } else { last = 0; schedule(); } }
    document.addEventListener('visibilitychange', onVis);
    function resize() { var r = root.getBoundingClientRect(); S.W = Math.max(1, r.width); S.H = Math.max(1, r.height); R.setSize(S.W, S.H, false); cam.aspect = S.W / S.H; cam.fov = clamp(2 * T.MathUtils.radToDeg(Math.atan(Math.tan(T.MathUtils.degToRad(S.hFov) / 2) / cam.aspect)), opts.minFov || 45, opts.maxFov || 80); cam.updateProjectionMatrix(); root.classList.toggle('narrow', S.W < 640); if (S.onResize) S.onResize(); }
    var ro = new ResizeObserver(resize); ro.observe(root);
    // taps vs drags (one pointer), plus pinch / wheel
    var down = null, ray = new T.Raycaster(), ndc = new T.Vector2();
    S.pick = function (x, y, list) { var r = cvs.getBoundingClientRect(); ndc.set((x - r.left) / r.width * 2 - 1, -((y - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, cam); return ray.intersectObjects(list, true)[0] || null; };
    cvs.addEventListener('pointerdown', function (e) { down = { x: e.clientX, y: e.clientY, lx: e.clientX, ly: e.clientY, t: performance.now(), id: e.pointerId }; try { cvs.setPointerCapture(e.pointerId); } catch (x) {} if (S.onDown) S.onDown(e); });
    cvs.addEventListener('pointermove', function (e) {
      if (!down) { if (S.onHover && e.pointerType === 'mouse') S.onHover(e); return; }
      var dx = e.clientX - down.lx, dy = e.clientY - down.ly; down.lx = e.clientX; down.ly = e.clientY;
      if (!down.drag && Math.hypot(e.clientX - down.x, e.clientY - down.y) < 8) return; down.drag = true; if (S.onDrag) S.onDrag(dx, dy, e);
    });
    cvs.addEventListener('pointerup', function (e) { var d = down; down = null; if (!d) return; if (d.drag) { if (S.onDragEnd) S.onDragEnd(e); return; } if (performance.now() - d.t < 700 && S.onTap) S.onTap(e); });
    cvs.addEventListener('pointercancel', function () { down = null; });
    cvs.addEventListener('wheel', function (e) { if (S.onWheel) { e.preventDefault(); S.onWheel(e.deltaY, e); } }, { passive: false });
    root.addEventListener('click', function (e) { var b = e.target.closest('[data-kx]'); if (b && S.onAct) { e.preventDefault(); S.onAct(b.dataset.kx, b); S.hap(); } });
    function onKey(e) { if (S.onKey) S.onKey(e); }
    window.addEventListener('keydown', onKey);
    S.start = function () { resize(); schedule(); };
    S.close = function () { if (!S.alive) return; S.alive = false; if (S.onClose) S.onClose(); if (raf) cancelAnimationFrame(raf); window.removeEventListener('keydown', onKey); document.removeEventListener('visibilitychange', onVis); ro.disconnect(); R.dispose(); root.remove(); if (opts.onExit) opts.onExit(); };
    return S;
  }

  // ---------------- the reader: Pull Out → flies to you → Flip → Return (shared by every mode)
  function reader(S) {
    var g = new T.Group(), face = new T.Group(), fM = new T.MeshBasicMaterial({ toneMapped: false }), bM = new T.MeshBasicMaterial({ toneMapped: false });
    var front = new T.Mesh(new T.PlaneGeometry(1.6, 1), fM), back = new T.Mesh(new T.PlaneGeometry(1.6, 1), bM), rim = new T.Mesh(new T.BoxGeometry(1.68, 1.08, .02), M('#c9a24a', { metalness: .5, roughness: .4 }));
    rim.position.z = -.012; back.rotation.y = Math.PI; back.position.z = -.035; face.add(front, rim, back); g.add(face); g.visible = false; S.scene.add(g);
    front.userData.reader = back.userData.reader = true;
    var st = null, RD = { meshes: [front, back], open: false };
    // obj: the carrier group; it: the card; slide: local direction the object slides out first (e.g. a book from its shelf)
    RD.pull = function (obj, it, opt) {
      opt = opt || {}; if (st) RD.back(true);
      var color = it.g ? it.g.color : '#555'; fM.map = null; fM.color.set(color); fM.needsUpdate = true;
      art(it.I, color).then(function (t) { if (st && st.it === it) { fM.map = t; fM.color.set('#fff'); fM.needsUpdate = true; } });
      if (bM.map) bM.map.dispose(); bM.map = K.drawBack(it.I, color); bM.needsUpdate = true;
      st = { obj: obj, it: it, t: 0, phase: 'slide', flip: 0, out: true, home: obj.position.clone(), homeQ: obj.quaternion.clone(), slide: opt.slide ? opt.slide.clone() : null, dist: opt.dist || 1.9, onBack: opt.onBack };
      RD.open = true; face.rotation.y = 0; S.root.classList.add('reading'); S.hap();
    };
    RD.flip = function () { if (st && st.phase === 'held') { st.flip = st.flip ? 0 : 1; S.hap(); } };
    RD.back = function (now) {
      if (!st) return; if (now) { st.obj.position.copy(st.home); st.obj.quaternion.copy(st.homeQ); st.obj.visible = true; g.visible = false; var cb = st.onBack; st = null; RD.open = false; S.root.classList.remove('reading'); if (cb) cb(); return; }
      if (st.phase === 'held' || st.phase === 'fly') { st.phase = 'return'; st.t = 0; }
    };
    RD.item = function () { return st && st.it; };
    RD.hit = function (h) { return !!(h && h.object && h.object.userData.reader); };
    S.tick(function (dt) {
      if (!st) return; st.t += dt; var o = st.obj, fw = new T.Vector3(); S.cam.getWorldDirection(fw);
      var target = S.cam.position.clone().addScaledVector(fw, st.dist), tq = S.cam.quaternion, vh = 2 * st.dist * Math.tan(T.MathUtils.degToRad(S.cam.fov) / 2), sc = Math.min(vh * .62, vh * S.cam.aspect * .88 / 1.6, 1.25);   // as big as the screen comfortably allows
      if (st.phase === 'slide') {   // the object leaves its place first (a book out of the shelf, a frame off the wall)
        var k = clamp(st.t / .35, 0, 1); if (st.slide) o.position.copy(st.home).addScaledVector(st.slide, ease(k) * .45);
        if (k >= 1) { st.phase = 'fly'; st.t = 0; st.from = o.getWorldPosition(new T.Vector3()); st.fromQ = (o.userData.body || o).getWorldQuaternion(new T.Quaternion()); o.visible = false; g.visible = true; }
      } else if (st.phase === 'fly' || st.phase === 'return') {
        var k2 = clamp(st.t / .45, 0, 1), a = st.phase === 'fly' ? ease(k2) : 1 - ease(k2), s0 = (o.userData.w ? Math.max(o.userData.w, o.userData.h * 1.6) : .6) / 1.6;
        g.position.lerpVectors(st.from, target, a); g.quaternion.copy(st.fromQ).slerp(tq, a); g.scale.setScalar(lerp(s0, sc, a));
        if (k2 >= 1) { if (st.phase === 'fly') st.phase = 'held'; else { st.phase = 'home'; st.t = 0; g.visible = false; o.visible = true; } }
      } else if (st.phase === 'held') { g.position.lerp(target, 1 - Math.exp(-dt * 8)); g.quaternion.slerp(tq, 1 - Math.exp(-dt * 8)); g.scale.setScalar(sc); }
      else if (st.phase === 'home') {   // slides back into its place
        var k3 = clamp(st.t / .35, 0, 1); if (st.slide) o.position.copy(st.home).addScaledVector(st.slide, (1 - ease(k3)) * .45);
        if (k3 >= 1) { o.position.copy(st.home); var cb = st.onBack; st = null; RD.open = false; S.root.classList.remove('reading'); if (cb) cb(); return; }
      }
      face.rotation.y = lerp(face.rotation.y, st && st.flip ? Math.PI : 0, 1 - Math.exp(-dt * 8));
    });
    return RD;
  }

  // ---------------- tweens + saved state
  function tweener() { var list = []; return { to: function (obj, key, from, to, dur, then) { list = list.filter(function (t) { return !(t.obj === obj && t.key === key); }); list.push({ obj: obj, key: key, from: from, to: to, t: 0, dur: dur, then: then }); }, step: function (dt) { list = list.filter(function (t) { t.t += dt; var k = ease(clamp(t.t / t.dur, 0, 1)); if (t.from.isVector3) t.obj[t.key].lerpVectors(t.from, t.to, k); else t.obj[t.key] = lerp(t.from, t.to, k); if (k >= 1 && t.then) t.then(); return k < 1; }); }, busy: function () { return list.length > 0; }, skip: function () { list.forEach(function (t) { t.t = t.dur; }); } }; }
  function store(name) { return { get: function (k) { try { return (JSON.parse(localStorage.getItem(name) || '{}') || {})[k] || {}; } catch (e) { return {}; } }, set: function (k, v) { try { var a = JSON.parse(localStorage.getItem(name) || '{}') || {}; a[k] = v; localStorage.setItem(name, JSON.stringify(a)); } catch (e) {} } }; }

  window.KShow = { collect: collect, art: art, spineTex: spineTex, labelTex: labelTex, carriers: carriers, stage: stage, reader: reader, tweener: tweener, store: store, M: M };
})();
