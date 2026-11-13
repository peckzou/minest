/* Minest · Spatial Home — the Scenic Window (2026-11-13; reworked the same day: a whole wall of glass, a real view).
   A window the size of a wall (each room says how big, anchor 'floor.window' {p, ry, w, h}); an ultra-thin dark frame,
   glass, and behind it Lake Bled — not a picture: the two-layer 2.5D scene of scenic-core.js is rendered through the
   glass every frame with an off-axis projection from where your eyes are, the way a real window works. Walk along it
   and the near branch slides over the lake while the mountains hold still; step back and the frame crops more.
   The view is kept inside the photograph: when the glass would show more than the photo holds, the scene is seen from a
   little further back (only as much as needed), never stretched. Tap the glass: the camera goes to the window and
   Scenic World opens over it from the same view; Exit plays it back. Moments: backpack store 'scenic:moments'. */
(function (root) {
  'use strict';
  var THREE = root.THREE, KEY = 'scenic:moments', F = 0.03;
  function base() {
    if (/^https?:$/.test(location.protocol)) return /\/spatial-home\//.test(location.pathname) ? '../' : '';
    return 'https://minest-app.vercel.app/';
  }
  function L(h) { return new THREE.Color(h).convertSRGBToLinear(); }
  var libP = null, cores = {}, SKEY = 'scenic:scene';
  function sceneId() { var s = root.MinestBackpack && root.MinestBackpack.store, v = s ? s.get(SKEY) : null; if (!v) try { v = localStorage.getItem('minest.' + SKEY); } catch (e) {} return v === 'alps' ? 'alps' : 'bled'; }
  function setSceneId(id) { var s = root.MinestBackpack && root.MinestBackpack.store; if (s) s.set(SKEY, id); try { localStorage.setItem('minest.' + SKEY, id); } catch (e) {} }
  function loadCore(id) {
    id = id || sceneId(); if (cores[id]) return cores[id];
    if (!libP) libP = new Promise(function (res, rej) {
      if (root.ScenicCore && root.ScenicCore.scenes.alps) return res(root.ScenicCore);
      var s = document.createElement('script'); s.src = base() + 'scenic/scenic-core.js?v=20261113c'; s.onload = function () { res(root.ScenicCore); }; s.onerror = rej; document.head.appendChild(s);
    });
    cores[id] = libP.then(function (C) { return C.load(id, { base: base() + 'scenic/', low: true, renderer: root.SpatialRoom && root.SpatialRoom.renderer }); });
    return cores[id];
  }
  var showScene = function () {};

  function make() {
    var g = new THREE.Group(), frameG = new THREE.Group(); g.add(frameG);
    var metal = new THREE.MeshStandardMaterial({ color: L(0x1b1d21), roughness: 0.32, metalness: 0.7 });
    var W = 3, H = 2.7;
    /* the glass shows a render target: the scene through the window, drawn from the eye's position each frame */
    var U = { tex: { value: null }, uRes: { value: new THREE.Vector2(1, 1) }, uOk: { value: 0 }, uCam: { value: new THREE.Vector3() } };
    var paneMat = new THREE.ShaderMaterial({
      uniforms: U,
      vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: [
        'uniform sampler2D tex; uniform vec2 uRes; uniform float uOk; uniform vec3 uCam; varying vec3 vP;',
        'void main(){',
        '  vec3 d = normalize(vP - uCam);',
        '  if (uOk < 0.5 || d.z > -0.01) { gl_FragColor = vec4(0.15, 0.14, 0.13, 1.0); return; }',
        '  vec3 c = texture2D(tex, gl_FragCoord.xy / uRes).rgb;',
        '  float fr = pow(1.0 - abs(d.z), 3.0);',                       // glass: a faint cool sheen at grazing angles
        '  c = mix(c, vec3(0.86, 0.9, 0.96), 0.025 + 0.16 * fr);',
        '  gl_FragColor = vec4(c, 1.0);',
        '}'].join('\n')
    });
    var pane = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), paneMat); g.add(pane);
    var backM = new THREE.MeshStandardMaterial({ color: L(0x2a2d33), roughness: 0.2, metalness: 0.3 }), back = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), backM); back.rotation.y = Math.PI; g.add(back);
    var hit = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ visible: false })); g.add(hit);
    var light = new THREE.PointLight(0xffd2a0, 0.4, 7, 2); g.add(light);   // the sunset spills a little into the room
    function fit(w, h) {
      W = w || W; H = h || H;
      while (frameG.children.length) { var c = frameG.children.pop(); c.geometry.dispose(); }
      function bar(x, y, bw, bh, d) { var m = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, d), metal); m.position.set(x, y, 0); m.castShadow = true; frameG.add(m); }
      bar(0, H - F / 2, W, F, 0.06); bar(0, F / 2, W, F, 0.06); bar(-W / 2 + F / 2, H / 2, F, H, 0.06); bar(W / 2 - F / 2, H / 2, F, H, 0.06);
      pane.scale.set(W - 2 * F, H - 2 * F, 1); pane.position.set(0, H / 2, 0);
      back.scale.set(W, H, 1); back.position.set(0, H / 2, -0.01);
      hit.scale.set(W, H, 0.12); hit.position.set(0, H / 2, 0.02);
      light.position.set(0, H * 0.6, Math.max(0.6, W * 0.25)); light.distance = Math.max(6, W * 1.6);
      o.label = [0, H + 0.12, 0];
      o.focusL = { pos: [0, Math.min(1.45, H * 0.55), Math.max(0.9, Math.min(2.4, Math.max(W, H) * 0.42))], look: [0, Math.min(1.42, H * 0.53), -3] };   // stand before the glass, filling the view
    }

    /* ---- the view: Kooima's off-axis projection through the glass rectangle ---- */
    var view = null, rt = null, sScene = new THREE.Scene(), pCam = new THREE.PerspectiveCamera(), _e = new THREE.Vector3(), frus = new THREE.Frustum(), _m = new THREE.Matrix4();
    /* the window looks at the right ~70 % of the photograph — the island, the castle, the mountains — and leaves the
       near branch (and what had to be filled behind it) out of a view you stand and look at for a long time */
    var YAW = 0.14, tanHw = 0.3, tanVw = 0.3;
    var PITCH = 0.13;                                                    // the view tipped down a little: the island and the lake at eye level
    /* the window shows whichever scene was chosen last (Scenic World's Scenes): a 360° panorama stands round the glass at
       standing eye height; the Lake Bled spatial scene is tipped to its island, castle and peaks */
    showScene = function (id) {
      loadCore(id).then(function (c) {
        if (view && view !== c) sScene.remove(view.group);
        view = c; c.group.rotation.order = 'YXZ';
        if (c.kind === 'pano') { c.group.rotation.set(0, 0, 0); c.group.position.set(0, 1.5 - H / 2, 0); tanHw = 99; tanVw = 99; }
        else { c.group.position.set(0, 0, 0); c.group.rotation.y = YAW; c.group.rotation.x = PITCH; tanHw = Math.tan(Math.atan(c.tanH) - YAW); tanVw = Math.tan(Math.atan(c.tanV) - PITCH); }
        if (c.group.parent !== sScene) sScene.add(c.group); U.uOk.value = 1;
      }).catch(function () {});
    };
    showScene();
    function render(t) {
      var R = root.SpatialRoom && root.SpatialRoom.renderer, cam = root.SpatialRoom && root.SpatialRoom.camera; if (!view || !R || !cam || !g.visible) return;
      view.U.uT.value = t;
      if (view.kind === 'pano') view.group.position.y = 1.5 - H / 2;   // standing eye height, whatever size the room made the window
      cam.updateMatrixWorld(); _m.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse); frus.setFromProjectionMatrix(_m);
      if (!frus.intersectsObject(hit)) return;                             // off screen: nothing to draw
      var sz = R.getDrawingBufferSize(new THREE.Vector2()), rw = Math.max(2, Math.round(sz.x * 0.7)), rh = Math.max(2, Math.round(sz.y * 0.7));
      if (!rt || rt.width !== rw || rt.height !== rh) { if (rt) rt.dispose(); rt = new THREE.WebGLRenderTarget(rw, rh, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter }); U.tex.value = rt.texture; }
      U.uRes.value.set(sz.x, sz.y);
      /* the eye in the window's frame (origin: the glass centre; x right, y up, z towards the room) */
      _e.copy(cam.position); pane.worldToLocal(_e); _e.x *= W - 2 * F; _e.y *= H - 2 * F;   // pane is scaled: back to metres
      U.uCam.value.set(_e.x / (W - 2 * F), _e.y / (H - 2 * F), _e.z);
      var hw = (W - 2 * F) / 2, hh = (H - 2 * F) / 2, ez = Math.max(0.05, _e.z);
      /* never more than the photograph holds: if the glass would open wider than the photo's frame, the scene's eye
         steps back just enough (the room's eye is where it is; the view behind the glass just narrows) */
      var m = Math.max(1, (Math.abs(_e.x) + hw) / (ez * tanHw * 0.97), (Math.abs(_e.y) + hh) / (ez * tanVw * 0.97)), zs = ez * m;
      var n = 0.5, l = (-hw - _e.x) * n / zs, r = (hw - _e.x) * n / zs, b = (-hh - _e.y) * n / zs, tp = (hh - _e.y) * n / zs;
      pCam.position.set(_e.x, _e.y, zs); pCam.quaternion.identity(); pCam.updateMatrixWorld(true);
      pCam.projectionMatrix.makePerspective(l, r, tp, b, n, 12000); pCam.projectionMatrixInverse.copy(pCam.projectionMatrix).invert();
      var prev = R.getRenderTarget(); R.setRenderTarget(rt); R.render(sScene, pCam); R.setRenderTarget(prev);
    }
    var o = {
      id: 'scenicWindow', name: '风景之窗', en: 'Scenic Window', icon: '🏞', feature: 'scenic', local: true, anchor: 'floor.window', group: g,
      hit: hit, label: [0, H + 0.12, 0], focusL: null,
      fit: function (a) { fit(a && a.w, a && a.h); },
      panel: function () { return openScenic(); },
      set: function (k) { light.intensity = 0.4 + 0.4 * k; }, idle: function (t) { render(t); }
    };
    fit(3, 2.7);
    return o;
  }

  /* ---- Scenic World over the room: it fades in only once its first frame is drawn (no black, no flash) ---- */
  var el = null, frame = null, done = null;
  function src() { return base() + 'scenic/index.html?enter=1&scene=' + sceneId(); }
  function store() { return root.MinestBackpack && root.MinestBackpack.store; }
  function shots() { var s = store(), v = s ? s.get(KEY) : null; if (!Array.isArray(v)) { try { v = JSON.parse(localStorage.getItem('minest.' + KEY) || '[]'); } catch (e) { v = []; } } return Array.isArray(v) ? v : []; }
  function keep(list) { list = list.slice(0, 24); var s = store(); if (s) s.set(KEY, list); try { localStorage.setItem('minest.' + KEY, JSON.stringify(list)); } catch (e) {} }
  function post(m) { m.scenic = 1; try { frame.contentWindow.postMessage(m, '*'); } catch (e) {} }
  function onMsg(e) {
    var m = e.data; if (!el || !frame || !m || m.scenic !== 1 || e.source !== frame.contentWindow) return;
    if (m.op === 'ready') { el.style.opacity = '1'; }
    else if (m.op === 'list') post({ op: 'shots', shots: shots() });
    else if (m.op === 'save' && m.shot) { var l = shots().filter(function (s) { return s.id !== m.shot.id; }); l.unshift(m.shot); keep(l); }
    else if (m.op === 'del' && m.id) keep(shots().filter(function (s) { return s.id !== m.id; }));
    else if (m.op === 'close') finish();
    else if (m.op === 'scene' && (m.id === 'alps' || m.id === 'bled')) { setSceneId(m.id); showScene(m.id); }
  }
  function finish() {
    if (!el) return; root.removeEventListener('message', onMsg); var e0 = el; el = null;
    e0.style.opacity = '0'; setTimeout(function () { try { frame.src = 'about:blank'; } catch (er) {} e0.remove(); frame = null; }, 650);   // the page and its GPU memory go with it
    var f = done; done = null; if (f) setTimeout(function () { f(null); }, 120);
  }
  function openScenic() {
    return new Promise(function (res) {
      if (el) return res(null); done = res;
      el = document.createElement('div'); el.style.cssText = 'position:fixed;inset:0;z-index:2147483600;opacity:0;transition:opacity .9s ease;background:transparent';
      frame = document.createElement('iframe'); frame.title = 'Scenic World · Lake Bled'; frame.setAttribute('allow', 'fullscreen; autoplay');
      frame.style.cssText = 'border:0;width:100%;height:100%;display:block;background:transparent'; frame.src = src();
      el.appendChild(frame); document.body.appendChild(el); root.addEventListener('message', onMsg);
      setTimeout(function () { if (el && el.style.opacity !== '1') el.style.opacity = '1'; }, 9000);   // never stuck behind a slow load
    });
  }

  root.SpatialScenic = { make: function () { return [make()]; }, open: openScenic, close: finish, moments: shots, isOpen: function () { return !!el; } };
})(window);
