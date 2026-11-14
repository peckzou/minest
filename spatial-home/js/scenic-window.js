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
  var libP = null, cores = {}, SKEY = 'scenic:scene', AKEY = 'scenic:ap', EKEY = 'scenic:envs', DKEY = 'scenic:envDef', IKEY = 'scenic:imm';
  function store() { return root.MinestBackpack && root.MinestBackpack.store; }
  function sget(k) { var s = store(), v = s ? s.get(k) : null; if (v == null) try { v = JSON.parse(localStorage.getItem('minest.' + k)); } catch (e) { v = null; } return v; }
  function sset(k, v) { var s = store(); if (s) s.set(k, v); try { localStorage.setItem('minest.' + k, JSON.stringify(v)); } catch (e) {} }
  function envs() { var v = sget(EKEY); return Array.isArray(v) ? v : []; }
  function defEnv() { var id = sget(DKEY); return id ? envs().filter(function (e) { return e.id === id; })[0] || null : null; }
  /* what the window shows: the default environment if there is one, else the scene last chosen inside */
  function sceneId() { var d = defEnv(), v = d ? d.scene : sget(SKEY); return v === 'alps' ? 'alps' : 'bled'; }
  function apId() { var d = defEnv(), v = d ? d.appearance : sget(AKEY); return typeof v === 'string' ? v : null; }
  function setSceneId(id, ap) { sset(SKEY, id); if (ap) sset(AKEY, ap); }
  function realAp(C, id, ap) { var sc = C.scenes[id]; if (ap === 'auto') ap = C.autoAppear(sc); return sc.appear[ap] ? ap : sc.appearDef; }
  function loadCore(id, ap) {
    id = id || sceneId();
    if (!libP) libP = new Promise(function (res, rej) {
      if (root.ScenicCore && root.ScenicCore.autoAppear) return res(root.ScenicCore);
      var s = document.createElement('script'); s.src = base() + 'scenic/scenic-core.js?v=20261113vp'; s.onload = function () { res(root.ScenicCore); }; s.onerror = rej; document.head.appendChild(s);
    });
    return libP.then(function (C) { var a = realAp(C, id, ap === undefined ? apId() : ap), key = id + '/' + a;
      return cores[key] || (cores[key] = C.load(id, { base: base() + 'scenic/', low: true, renderer: root.SpatialRoom && root.SpatialRoom.renderer, appearance: a })); });
  }
  /* ---- Scenic World · Collection 001 (scenic-environments/, made by argon): seven fixed-viewpoint photo scenes, each a
     photograph draped over a 32k-triangle depth mesh 39–50 m out, seen from the origin looking down −z (38° of photo
     vertically, a mirrored overscan round it). Through the window they are drawn like the other scenes: an off-axis
     view from your eye. Each room keeps its own choice (store 'scenic:winScene' {room: id}); 'core' is the older view. */
  var ENVS = [['alpine-valley', '瀑布山谷'], ['golden-oaks', '金色橡树'], ['highland-railway', '高地列车'], ['lost-city', '印加古城'],
    ['whitehaven-paradise', '白天堂沙洲'], ['alpine-meadow', '阿尔卑斯草甸'], ['little-venice', '科尔马运河']];
  var WKEY = 'scenic:winScene', ROOM_DEF = { victorian: 'alpine-valley' }, envCache = {};
  function roomId() { try { var a = root.MinestSpatialHome && root.MinestSpatialHome.api(); return (a && a.env() && a.env().id) || ''; } catch (e) { return ''; } }
  function winChoice() { var m = sget(WKEY) || {}, r = roomId(), v = m[r] || ROOM_DEF[r] || null; return v === 'core' ? null : (ENVS.some(function (q) { return q[0] === v; }) ? v : null); }
  function setWinChoice(v) { var m = sget(WKEY) || {}; if (typeof m !== 'object') m = {}; m[roomId()] = v; sset(WKEY, m); }
  function loadEnv(id) {
    if (envCache[id]) return envCache[id];
    var dir = base() + 'scenic-environments/' + id + '/';
    return (envCache[id] = Promise.all([
      fetch(dir + 'manifest.json').then(function (r) { return r.json(); }).catch(function () { return {}; }),
      new Promise(function (res, rej) { new THREE.GLTFLoader().load(dir + 'geometry/spatial_scene.glb', res, undefined, rej); }),
      new Promise(function (res, rej) { new THREE.TextureLoader().load(dir + 'textures/albedo.jpg', res, undefined, rej); })
    ]).then(function (r) {
      var man = r[0] || {}, gl = r[1], tex = r[2];
      tex.flipY = false; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.magFilter = THREE.LinearFilter; tex.generateMipmaps = true;
      var U = { uT: { value: 0 }, uMap: { value: tex }, uPx: { value: new THREE.Vector2(1 / ((tex.image && tex.image.width) || 1280), 1 / ((tex.image && tex.image.height) || 720)) } };
      var mat = new THREE.ShaderMaterial({ uniforms: U,
        vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
        fragmentShader: ['uniform sampler2D uMap; uniform vec2 uPx; varying vec2 vUv;',
          'vec2 mir(vec2 p){ return 1.0 - abs(1.0 - mod(p, 2.0)); }',
          'void main(){ vec2 u = mir(vUv); vec3 c = texture2D(uMap, u).rgb;',
          '  vec3 b = (texture2D(uMap, mir(vUv + vec2(uPx.x, 0.0))).rgb + texture2D(uMap, mir(vUv - vec2(uPx.x, 0.0))).rgb + texture2D(uMap, mir(vUv + vec2(0.0, uPx.y))).rgb + texture2D(uMap, mir(vUv - vec2(0.0, uPx.y))).rgb) * 0.25;',
          '  gl_FragColor = vec4(clamp(c + (c - b) * 0.55, 0.0, 1.0), 1.0); }'].join('\n'),   // the photos are ~1000 px: a light unsharp mask
        side: THREE.DoubleSide });
      gl.scene.traverse(function (o) { if (o.isMesh) { o.material = mat; o.frustumCulled = false; } });
      var grp = new THREE.Group(); grp.add(gl.scene);
      var tv = Math.tan(19 * Math.PI / 180), asp = man.nativeAspect || 1.7778;
      return { group: grp, U: U, kind: 'env', id: id, appear: 'day', tanV: tv, tanH: tv * asp, P: new THREE.Vector3(0, 0, -44), yaw0: 0, pitch0: 0.12,   // tipped a little, as the lake: the photo's middle at eye level
        dispose: function () { tex.dispose(); mat.dispose(); gl.scene.traverse(function (o) { if (o.geometry) o.geometry.dispose(); }); } };
    }).catch(function (e) { delete envCache[id]; throw e; }));
  }
  var showScene = function () {}, applyView = function () {}, WIN = null, shownKey = null;
  /* ---- the view adjuster: turn and move what the window looks at, so the room gets its best view ---- */
  var VKEY = 'scenic:winView', SHIFT = 0.12, RANGE = { yaw: 1, pitch: 1, x: 1, y: 1 };
  function vget() { var v = sget(VKEY) || {}; function n(k, d) { var x = +v[k]; return isFinite(x) ? x : d; }
    return { yaw: n('yaw', 0), pitch: n('pitch', 0), x: n('x', 0), y: n('y', 0), zoom: Math.max(1, Math.min(2.5, n('zoom', 1))) }; }
  var ADJ = vget(), bar = null, barT = 0;
  function host() { var c = document.getElementById('sh-gl'); return c && c.parentNode; }
  function saveAdj() { sset(VKEY, ADJ); applyView(); }
  function clamp1(v) { return Math.max(-1, Math.min(1, v)); }
  /* drag on the glass: the view turns under your finger (left / right: the turn, up / down: the tilt); what a drag cannot
     do — near / far and sliding the view — is on a small bar that comes up while you adjust and hides itself again */
  function grab(ph, dx, dy) {
    if (ph === 'start') { dragging = true; showBar(true); return; }
    if (ph === 'end') { dragging = false; sset(VKEY, ADJ); barLater(); return; }
    var r = winRect(), w = r ? Math.max(120, r.r - r.l) : 400, h = r ? Math.max(120, r.b - r.t) : 300, k = 1.5 / ADJ.zoom;
    ADJ.yaw = clamp1(ADJ.yaw - dx / w * k); ADJ.pitch = clamp1(ADJ.pitch - dy / h * k); applyView(); syncBar(); showBar(true);
  }
  /* any press elsewhere puts the bar away at once (a thing's card or the edit bar may need that place) */
  root.addEventListener('pointerdown', function (e) { if (bar && bar.style.opacity === '1' && !bar.contains(e.target)) setTimeout(function () { if (!dragging) showBar(false); }, 0); }, true);
  var dragging = false;
  function barLater() { clearTimeout(barT); barT = setTimeout(function () { showBar(false); }, 3200); }
  function syncBar() { if (!bar) return; Array.prototype.forEach.call(bar.querySelectorAll('input'), function (i) { i.value = ADJ[i.dataset.k]; });
    var cur = winChoice() || 'core'; Array.prototype.forEach.call(bar.querySelectorAll('[data-scene]'), function (b) { var on = b.dataset.scene === cur; b.style.background = on ? '#d9a95b' : 'transparent'; b.style.color = on ? '#231a10' : 'inherit'; b.style.borderColor = on ? '#d9a95b' : 'rgba(255,255,255,.28)'; }); }
  function showBar(on) {
    var h = host(); if (!h) return;
    if (!bar) {
      bar = document.createElement('div');
      bar.style.cssText = 'position:absolute;z-index:31;left:50%;bottom:calc(16px + env(safe-area-inset-bottom));transform:translate(-50%,12px);width:min(360px,calc(100% - 32px));box-sizing:border-box;padding:9px 12px 8px;border-radius:14px;background:rgba(24,22,20,.72);color:#f3ece2;font:12px/1.3 -apple-system,system-ui,sans-serif;backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);box-shadow:0 8px 24px rgba(0,0,0,.3);opacity:0;pointer-events:none;transition:opacity .35s ease,transform .35s ease';
      var rows = [['zoom', '远近', 1, 2.5], ['x', '左右移', -1, 1], ['y', '上下移', -1, 1]];
      bar.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2px"><span style="opacity:.8">窗外风景 · 在窗上拖动可转动</span><button type="button" data-a="reset" style="padding:3px 9px;border-radius:9px;border:1px solid rgba(255,255,255,.3);background:transparent;color:inherit;font-size:12px">恢复</button></div>' +
        '<div data-pick style="display:flex;gap:5px;overflow-x:auto;margin:4px 0 6px;padding-bottom:2px;-webkit-overflow-scrolling:touch">' +
        ENVS.concat([['core', '布莱德湖']]).map(function (q) { return '<button type="button" data-scene="' + q[0] + '" style="flex:none;padding:4px 9px;border-radius:999px;border:1px solid rgba(255,255,255,.28);background:transparent;color:inherit;font-size:12px;white-space:nowrap">' + q[1] + '</button>'; }).join('') + '</div>' +
        rows.map(function (r) { return '<label style="display:flex;align-items:center;gap:8px;margin:3px 0"><span style="width:40px;flex:none">' + r[1] + '</span><input type="range" data-k="' + r[0] + '" min="' + r[2] + '" max="' + r[3] + '" step="0.01" style="flex:1;accent-color:#d9a95b"></label>'; }).join('');
      ['pointerdown', 'pointermove', 'touchstart', 'touchmove', 'wheel', 'keydown'].forEach(function (t) { bar.addEventListener(t, function (e) { e.stopPropagation(); clearTimeout(barT); }, { passive: true }); });
      ['pointerup', 'touchend', 'change'].forEach(function (t) { bar.addEventListener(t, function () { barLater(); }); });
      bar.addEventListener('input', function (e) { var k = e.target.dataset && e.target.dataset.k; if (!k) return; ADJ[k] = +e.target.value; saveAdj(); });
      bar.addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; e.stopPropagation(); if (b.dataset.scene) { setWinChoice(b.dataset.scene); showScene(); } ADJ = { yaw: 0, pitch: 0, x: 0, y: 0, zoom: 1 }; saveAdj(); syncBar(); barLater(); });
      h.appendChild(bar);
    }
    syncBar(); clearTimeout(barT);
    bar.style.opacity = on ? '1' : '0'; bar.style.transform = on ? 'translate(-50%,0)' : 'translate(-50%,12px)'; bar.style.pointerEvents = on ? 'auto' : 'none';
    if (on) barLater();
  }
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
        '  float fr = pow(1.0 - abs(d.z), 3.0);',
        '  float ex = smoothstep(0.0, 0.045, 0.5 - abs(vP.x)), et = smoothstep(0.0, 0.09, 0.5 - vP.y), eb = smoothstep(0.0, 0.02, vP.y + 0.5);',
        '  c *= mix(0.62, 1.0, ex * et * eb);',                          // the reveal's shade on the view at the edges of the glass
        '  c += vec3(0.05, 0.036, 0.022) * (0.5 - vP.y) * 0.35;',        // a faint warm reflection of the room, lower on the glass                       // glass: a faint cool sheen at grazing angles
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
      /* stand back far enough that the window is about three quarters of the view, the room round it: Scenic World opens
         out of that rectangle (Ambient keeps the room beyond it; Full goes past the screen's edges) */
      var ey = Math.min(1.6, Math.max(1.2, H * 0.5)), d = Math.max(1.6, Math.min(8, Math.max(W * 1.0, H * 1.45)));
      o.focusL = { pos: [0, ey, d], look: [0, Math.min(ey, H * 0.5), -3] };
    }

    /* ---- the view: Kooima's off-axis projection through the glass rectangle ---- */
    var view = null, rt = null, sScene = new THREE.Scene(), pCam = new THREE.PerspectiveCamera(), _e = new THREE.Vector3(), frus = new THREE.Frustum(), _m = new THREE.Matrix4();
    /* the window looks at the right ~70 % of the photograph — the island, the castle, the mountains — and leaves the
       near branch (and what had to be filled behind it) out of a view you stand and look at for a long time */
    var YAW = 0.14, tanHw = 0.3, tanVw = 0.3;
    var PITCH = 0.13;                                                    // the view tipped down a little: the island and the lake at eye level
    /* the window shows whichever scene was chosen last (Scenic World's Scenes): a 360° panorama stands round the glass at
       standing eye height; the Lake Bled spatial scene is tipped to its island, castle and peaks */
    showScene = function (id, ap) {
      var w = winChoice(); shownKey = w || 'core';
      (w ? loadEnv(w).catch(function () { return loadCore(id, ap); }) : loadCore(id, ap)).then(function (c) {
        if (shownKey !== (w || 'core')) return;                          // a newer choice came in while this one loaded
        if (view && view !== c) sScene.remove(view.group);
        view = c; c.group.rotation.order = 'YXZ';
        applyView();
        if (c.group.parent !== sScene) sScene.add(c.group); U.uOk.value = 1;
        light.color.setHex(c.appear === 'sunset' ? 0xffd2a0 : 0xf2f4ff);
      }).catch(function () {});
    };
    /* the view through the glass, as the user turned and moved it (the 🧭 on the window; store 'scenic:winView'):
       yaw / pitch turn the scene behind the glass, x / y slide it (a share of the scene's depth, so it means the same in
       every scene), zoom steps the scene's eye back (1 = as wide as the photograph allows). The photo's edge is still
       never shown: the turn and the slide come off the room the frame may open to. */
    applyView = function () {
      if (!view) return; var c = view, A = ADJ;
      function cl(v) { return Math.max(-1, Math.min(1, +v || 0)); }
      if (c.kind === 'pano') { c.group.rotation.set(cl(A.pitch) * 0.35, cl(A.yaw) * Math.PI, 0); c.group.position.set(0, 1.5 - H / 2, 0); tanHw = 99; tanVw = 99; return; }
      /* the sliders run −1…1; 0 is the composed view, ±1 as far as the photograph reaches with a window's width to spare */
      function span(v, def, max) { v = cl(v); return v >= 0 ? def + v * (max - def) : def + v * (max + def); }
      var aH = Math.atan(c.tanH), aV = Math.atan(c.tanV), yw = span(A.yaw, c.yaw0 != null ? c.yaw0 : YAW, aH - 0.16), pt = span(A.pitch, c.pitch0 != null ? c.pitch0 : PITCH, aV - 0.13);
      var MIN = 0.15, roomH = Math.max(0, Math.tan(aH - Math.abs(yw)) - MIN), roomV = Math.max(0, Math.tan(aV - Math.abs(pt)) - MIN);
      var sx = cl(A.x) * Math.min(SHIFT, roomH), sy = cl(A.y) * Math.min(SHIFT, roomV), D = Math.abs(c.P.z) || 100;
      c.group.rotation.y = yw; c.group.rotation.x = pt; c.group.position.set(-sx * D, -sy * D, 0); c._pt = pt;
      tanHw = Math.max(MIN, Math.tan(aH - Math.abs(yw)) - Math.abs(sx));
      tanVw = Math.max(MIN, Math.tan(aV - Math.abs(pt)) - Math.abs(sy));
    };
    showScene();
    function render(t) {
      if (shownKey !== null && (winChoice() || 'core') !== shownKey) showScene();   // another room, another view
      var R = root.SpatialRoom && root.SpatialRoom.renderer, cam = root.SpatialRoom && root.SpatialRoom.camera; if (!view || !R || !cam || !g.visible) return;
      view.U.uT.value = t;
      var dressed = false; for (var ci = 0; ci < g.children.length; ci++) if (/^dress-/.test(g.children[ci].name || '')) dressed = true;
      frameG.visible = !dressed && metal.opacity > 0.02;   // a room that dresses the window brings its own casing
      if (view.kind === 'pano') view.group.position.y = 1.5 - H / 2;   // standing eye height, whatever size the room made the window
      cam.updateMatrixWorld(); _m.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse); frus.setFromProjectionMatrix(_m);
      if (!frus.intersectsObject(hit)) return;                             // off screen: nothing to draw
      var sz = R.getDrawingBufferSize(new THREE.Vector2()), rk = view.kind === 'env' ? 1 : 0.7, rw = Math.max(2, Math.round(sz.x * rk)), rh = Math.max(2, Math.round(sz.y * rk));
      if (!rt || rt.width !== rw || rt.height !== rh) { if (rt) rt.dispose(); rt = new THREE.WebGLRenderTarget(rw, rh, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter }); U.tex.value = rt.texture; }
      U.uRes.value.set(sz.x, sz.y);
      /* the eye in the window's frame (origin: the glass centre; x right, y up, z towards the room) */
      _e.copy(cam.position); pane.worldToLocal(_e); _e.x *= W - 2 * F; _e.y *= H - 2 * F;   // pane is scaled: back to metres
      U.uCam.value.set(_e.x / (W - 2 * F), _e.y / (H - 2 * F), _e.z);
      var hw = (W - 2 * F) / 2, hh = (H - 2 * F) / 2, ez = Math.max(0.05, _e.z);
      /* never more than the photograph holds: if the glass would open wider than the photo's frame, the scene's eye
         steps back just enough (the room's eye is where it is; the view behind the glass just narrows) */
      var m = Math.max(1, (Math.abs(_e.x) + hw) / (ez * tanHw * 0.97), (Math.abs(_e.y) + hh) / (ez * tanVw * 0.97)), zs = ez * m * ADJ.zoom;
      if (view.kind === 'env') {
        /* a photo scene fills the glass across (the photos are ~1000 px: never a magnified slice of one), and is tipped so
           its middle sits behind the middle of the glass from where your eye is (the mirrored overscan covers the rest) */
        zs = (hw + Math.abs(_e.x) * 0.5) / (Math.tan(Math.atan(view.tanH) - Math.abs(view.group.rotation.y)) * 0.96) * ADJ.zoom;
        view.group.rotation.x = (view._pt || 0) - Math.atan2(_e.y, zs);
      }
      var n = 0.5, l = (-hw - _e.x) * n / zs, r = (hw - _e.x) * n / zs, b = (-hh - _e.y) * n / zs, tp = (hh - _e.y) * n / zs;
      pCam.position.set(_e.x, _e.y, zs); pCam.quaternion.identity(); pCam.updateMatrixWorld(true);
      pCam.projectionMatrix.makePerspective(l, r, tp, b, n, 12000); pCam.projectionMatrixInverse.copy(pCam.projectionMatrix).invert();
      var prev = R.getRenderTarget(); R.setRenderTarget(rt); R.render(sScene, pCam); R.setRenderTarget(prev);
    }
    var o = {
      id: 'scenicWindow', name: '风景之窗', en: 'Scenic Window', icon: '🏞', feature: 'scenic', local: true, anchor: 'floor.window', group: g,
      hit: hit, label: [0, H + 0.12, 0], focusL: null,
      fit: function (a) { fit(a && a.w, a && a.h); },
      panel: function () { return winChoice() ? openEnv() : openScenic(); },
      set: function (k) { light.intensity = 0.4 + 0.4 * k; }, idle: function (t) { render(t); }, grab: grab,
      /* before the camera walks up: stand back along the window's axis as far as the plan wants, but stop 0.7 m short of
         the first thing in the way (furniture, a wall) — the room must stay round the window, never in front of the lens */
      aim: function () {
        if (!o.focus) return; var top = g; while (top.parent) top = top.parent;
        var eye = new THREE.Vector3().fromArray(o.focus.pos), look = new THREE.Vector3().fromArray(o.focus.look), from = new THREE.Vector3(0, eye.y - g.position.y, 0.05);
        g.localToWorld(from); var dir = eye.clone().sub(from); dir.y = 0; var want = dir.length(); dir.normalize();
        var rc = new THREE.Raycaster(from, dir, 0.3, want + 1), mine = {}; g.traverse(function (x) { mine[x.uuid] = 1; });
        var hits = rc.intersectObject(top, true).filter(function (h) { return !mine[h.object.uuid] && h.object.visible !== false && !(h.object.material && h.object.material.visible === false); });
        var d = hits.length ? Math.max(1.4, Math.min(want, hits[0].distance - 0.7)) : want;
        var p = from.clone().addScaledVector(dir, d); p.y = eye.y; o.focus = { pos: p.toArray(), look: look.toArray() };
      }
    };
    fit(3, 2.7);
    WIN = { pane: pane, frame: frameG, metal: metal, light: light, size: function () { return [W, H]; }, scene: function () { return view; }, sScene: sScene };
    return o;
  }

  /* ---- Scenic World over the room, at an immersion level (Vision Pro style) ----
     The overlay is masked to a soft-edged rectangle. Entering: the camera has already walked up to the glass; the frame
     fades, the scene appears exactly in the window's rectangle (opacity only once its first frame is drawn — no black, no
     flash, no placeholder) and opens out to the level chosen — Ambient (the office stays round the edges, turning with
     your look) or Full (the office is gone and stops rendering). The dial in Scenic World moves between them; Window and
     Exit play it all back into the glass. */
  var el = null, frame = null, done = null, M = null, anim = null, base0 = null, LV = { level: 'full', v: 1 };
  function src() {
    var d = defEnv(), im = sget(IKEY) || {}, lv = (d && d.immersion) || im.level || 'full', v = d && d.immV != null ? d.immV : im.v != null ? im.v : 1;
    LV = { level: lv === 'ambient' ? 'ambient' : 'full', v: lv === 'ambient' ? Math.min(0.96, Math.max(0.2, v)) : 1 };
    return base() + 'scenic/index.html?enter=1&scene=' + sceneId() + (apId() ? '&ap=' + apId() : '') + '&imm=' + LV.level + '&immv=' + LV.v + (d ? '&env=' + d.id : '');
  }
  function shots() { var v = sget(KEY); return Array.isArray(v) ? v : []; }
  function keep(list) { sset(KEY, list.slice(0, 24)); }
  function post(m) { m.scenic = 1; try { frame.contentWindow.postMessage(m, '*'); } catch (e) {} }
  function vw() { return root.innerWidth; } function vh() { return root.innerHeight; }
  /* the window's rectangle on screen, from the glass corners seen by the room camera */
  function winRect() {
    var cam = root.SpatialRoom && root.SpatialRoom.camera, R = root.SpatialRoom && root.SpatialRoom.renderer; if (!cam || !WIN || !R) return null;
    var cr = R.domElement.getBoundingClientRect(), xs = [], ys = [], v = new THREE.Vector3(); cam.updateMatrixWorld();
    for (var i = 0; i < 4; i++) { v.set(i & 1 ? 0.5 : -0.5, i & 2 ? 0.5 : -0.5, 0); WIN.pane.localToWorld(v); v.project(cam); if (v.z > 1) return null; xs.push(cr.left + (v.x + 1) / 2 * cr.width); ys.push(cr.top + (1 - v.y) / 2 * cr.height); }
    return { l: Math.min.apply(0, xs), t: Math.min.apply(0, ys), r: Math.max.apply(0, xs), b: Math.max.apply(0, ys), f: 3 };
  }
  /* a level as a rectangle on screen. Ambient is anchored to the window in the room (like a portal: turn away and it
     stays where it is) and reaches past it by the dial; Full goes past the screen's edges. */
  function levelRect(v) {
    var W = vw(), H = vh(), s = Math.min(W, H);
    if (v >= 0.97) return { l: -60, t: -60, r: W + 60, b: H + 60, f: 40, full: true };
    var k = Math.max(0, Math.min(1, (v - 0.2) / 0.77)), r = winRect() || { l: W * 2, t: H * 2, r: W * 2 + 1, b: H * 2 + 1 }, e = 0.32 * k * k * s, f = (0.05 + 0.08 * k) * s;
    return { l: r.l - e - f, t: r.t - e * 0.8 - f, r: r.r + e + f, b: r.b + e * 0.5 + f, f: f };
  }
  /* the mask is applied inside Scenic World, to the scene layer only: its controls and the Workspace window stay whole */
  function applyMask(q) { if (!el) return; M = q; post({ op: 'mask', q: { l: q.l, t: q.t, r: q.r, b: q.b, f: q.f, full: !!q.full } }); }
  function ease(k) { return k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; }
  function tweenMask(to, dur) {
    var from = M && !M.full ? M : (M && M.full ? { l: -60, t: -60, r: vw() + 60, b: vh() + 60, f: 40 } : to);
    if (anim) anim.stop = true; var a = anim = { stop: false }, t0 = performance.now();
    return new Promise(function (res) {
      (function step() { if (a.stop) return res(false); var k = Math.min(1, (performance.now() - t0) / (dur * 1000)), e = ease(k), q = {};
        ['l', 't', 'r', 'b', 'f'].forEach(function (n) { q[n] = from[n] + (to[n] - from[n]) * e; }); applyMask(k >= 1 && to.full ? to : q);
        if (k < 1) requestAnimationFrame(step); else { a.done = true; res(true); } })();
    });
  }
  function frameFade(k) { if (!WIN) return; WIN.metal.transparent = k < 1; WIN.metal.opacity = k; WIN.frame.visible = k > 0.02; }
  function hold(on) { if (root.SpatialRoom) root.SpatialRoom.hold = on; }
  /* ---- into a Scenic World photo scene (the one in the window): full screen, from the scene's own viewpoint ----
     The room stops drawing; the scene is drawn from the origin with a free look (drag), near / far (pinch, wheel),
     within the photograph. The strip at the bottom picks another scene — it is what the window will show after.
     ✕ (or Esc) goes back to the room. */
  var IMM = null;
  function openEnv() {
    return new Promise(function (res) {
      if (IMM) return res(null);
      var R = root.SpatialRoom && root.SpatialRoom.renderer; if (!R || !WIN || !WIN.scene) return res(null);
      var cam = new THREE.PerspectiveCamera(34, 1, 0.5, 400), st = { yaw: 0, pitch: 0, fov: 34, ptrs: {}, d0: 0, f0: 34 }, raf = 0, alive = true;
      var el = document.createElement('div'); el.style.cssText = 'position:fixed;inset:0;z-index:2147483600;opacity:0;transition:opacity .45s ease;touch-action:none;cursor:grab';
      el.innerHTML = '<div style="position:absolute;top:calc(14px + env(safe-area-inset-top));left:16px;right:16px;display:flex;justify-content:space-between;align-items:center;pointer-events:none">' +
        '<div data-t style="pointer-events:auto;padding:8px 14px;border-radius:14px;background:rgba(12,16,22,.55);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);color:#f5f8fc;font:600 14px -apple-system,system-ui,sans-serif"></div>' +
        '<button type="button" data-x style="pointer-events:auto;width:40px;height:40px;border-radius:20px;border:1px solid rgba(255,255,255,.3);background:rgba(12,16,22,.55);color:#fff;font-size:18px;backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px)">✕</button></div>' +
        '<div data-d style="position:absolute;left:50%;bottom:calc(16px + env(safe-area-inset-bottom));transform:translateX(-50%);max-width:calc(100% - 24px);display:flex;gap:6px;overflow-x:auto;padding:6px;border-radius:999px;background:rgba(12,16,22,.6);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px)">' +
        ENVS.map(function (q) { return '<button type="button" data-s="' + q[0] + '" style="flex:none;padding:7px 12px;border-radius:999px;border:1px solid transparent;background:transparent;color:rgba(235,242,250,.8);font:500 12.5px -apple-system,system-ui,sans-serif;white-space:nowrap">' + q[1] + '</button>'; }).join('') + '</div>';
      document.body.appendChild(el); IMM = el;
      function mark() { var c = winChoice(); el.querySelector('[data-t]').textContent = (ENVS.filter(function (q) { return q[0] === c; })[0] || ['', ''])[1] + ' · 拖动环顾，双指缩放';
        Array.prototype.forEach.call(el.querySelectorAll('[data-s]'), function (b) { var on = b.dataset.s === c; b.style.background = on ? 'rgba(255,217,125,.22)' : 'transparent'; b.style.color = on ? '#ffd97d' : 'rgba(235,242,250,.8)'; b.style.borderColor = on ? 'rgba(255,217,125,.45)' : 'transparent'; }); }
      mark();
      function limits() { var v = WIN.scene(); if (!v) return { y: 0, p: 0 }; var a = innerWidth / Math.max(1, innerHeight), tv = Math.tan(st.fov * Math.PI / 360), th = tv * a;
        return { y: Math.max(0, Math.atan(v.tanH * 1.2) - Math.atan(th)), p: Math.max(0, Math.atan(v.tanV * 1.2) - Math.atan(tv)) }; }
      function clampSt() { var L = limits(); st.yaw = Math.max(-L.y, Math.min(L.y, st.yaw)); st.pitch = Math.max(-L.p, Math.min(L.p, st.pitch)); }
      function draw() {
        if (!alive) return; raf = requestAnimationFrame(draw);
        var v = WIN.scene(); if (!v) return;
        var sz = R.getSize(new THREE.Vector2()); cam.aspect = sz.x / Math.max(1, sz.y); cam.fov = st.fov; cam.updateProjectionMatrix();
        cam.position.set(0, 0, 0); cam.rotation.set(st.pitch, st.yaw, 0, 'YXZ');
        var r0 = v.group.rotation.clone(), p0 = v.group.position.clone(); v.group.rotation.set(0, 0, 0); v.group.position.set(0, 0, 0);
        var prev = R.getRenderTarget(); R.setRenderTarget(null); R.render(WIN.sScene, cam); R.setRenderTarget(prev);
        v.group.rotation.copy(r0); v.group.position.copy(p0);
      }
      function close() { if (!alive) return; el.style.opacity = '0'; setTimeout(function () { alive = false; cancelAnimationFrame(raf); el.remove(); IMM = null; hold(false); res(null); }, 420); root.removeEventListener('keydown', key, true); }
      function key(e) { if (e.key === 'Escape') { e.stopPropagation(); close(); } }
      root.addEventListener('keydown', key, true);
      el.addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; e.stopPropagation();
        if (b.dataset.x != null) return close();
        if (b.dataset.s) { setWinChoice(b.dataset.s); showScene(); st.yaw = 0; st.pitch = 0; st.fov = 34; mark(); } });
      el.addEventListener('pointerdown', function (e) { if (e.target.closest('button')) return; st.ptrs[e.pointerId] = [e.clientX, e.clientY]; var k = Object.keys(st.ptrs);
        if (k.length === 2) { var a = st.ptrs[k[0]], b = st.ptrs[k[1]]; st.d0 = Math.hypot(a[0] - b[0], a[1] - b[1]); st.f0 = st.fov; } try { el.setPointerCapture(e.pointerId); } catch (er) {} });
      el.addEventListener('pointermove', function (e) { var p = st.ptrs[e.pointerId]; if (!p) return; var k = Object.keys(st.ptrs);
        if (k.length === 2) { st.ptrs[e.pointerId] = [e.clientX, e.clientY]; var a = st.ptrs[k[0]], b = st.ptrs[k[1]], d = Math.hypot(a[0] - b[0], a[1] - b[1]); if (st.d0 > 0) st.fov = Math.max(22, Math.min(40, st.f0 * st.d0 / d)); clampSt(); return; }
        var s = st.fov / 34 * 0.0035; st.yaw += (e.clientX - p[0]) * s; st.pitch += (e.clientY - p[1]) * s; st.ptrs[e.pointerId] = [e.clientX, e.clientY]; clampSt(); });
      ['pointerup', 'pointercancel'].forEach(function (t) { el.addEventListener(t, function (e) { delete st.ptrs[e.pointerId]; st.d0 = 0; }); });
      el.addEventListener('wheel', function (e) { e.preventDefault(); st.fov = Math.max(22, Math.min(40, st.fov + e.deltaY * 0.02)); clampSt(); }, { passive: false });
      var cv0 = R.domElement, hidden = []; if (cv0.parentNode) Array.prototype.forEach.call(cv0.parentNode.children, function (c) { if (c !== cv0 && c.style.visibility !== 'hidden') { hidden.push(c); c.style.visibility = 'hidden'; } });   // the room's buttons and labels step aside
      var close0 = close; close = function () { hidden.forEach(function (c) { c.style.visibility = ''; }); hidden = []; close0(); };
      hold(true); draw(); requestAnimationFrame(function () { el.style.opacity = '1'; });
    });
  }
  function setLevel(level, v, dur) {
    if (!el) return; hold(false);
    if (level !== 'full') LV.v = v; LV.level = level; if (level === 'full') LV.v = 1;
    sset(IKEY, { level: LV.level, v: LV.v });
    if (level === 'full') { tweenMask(levelRect(1), dur == null ? 1.2 : dur).then(function (ok) { if (ok && el && LV.level === 'full') hold(true); }); turn(0, 0); }
    else tweenMask(levelRect(LV.v), dur == null ? 0.9 : dur);
  }
  /* Ambient: the office round the scene turns with your look (the room camera turns about itself) */
  var _e = null, _q = null;
  function turn(lx, ly) {
    var cam = root.SpatialRoom && root.SpatialRoom.camera; if (!cam || !base0) return;
    _e = _e || new THREE.Euler(0, 0, 0, 'YXZ'); _q = _q || new THREE.Quaternion();
    _q.setFromEuler(_e.set(ly * 0.8, lx, 0, 'YXZ')); cam.quaternion.copy(base0).multiply(_q); cam.updateMatrixWorld();
  }
  function onMsg(e) {
    var m = e.data; if (!el || !frame || !m || m.scenic !== 1 || e.source !== frame.contentWindow) return;
    if (m.op === 'ready') { if (M) applyMask(M); el.style.opacity = '1'; frameFade(0); setTimeout(function () { if (el) setLevel(LV.level, LV.v, 1.5); }, 350); post({ op: 'imm', level: LV.level, v: LV.v }); }
    else if (m.op === 'list') { post({ op: 'shots', shots: shots() }); post({ op: 'envs', list: envs(), def: sget(DKEY) || null }); }
    else if (m.op === 'save' && m.shot) { var l = shots().filter(function (s) { return s.id !== m.shot.id; }); l.unshift(m.shot); keep(l); }
    else if (m.op === 'del' && m.id) keep(shots().filter(function (s) { return s.id !== m.id; }));
    else if (m.op === 'close') finish();
    else if (m.op === 'scene' && (m.id === 'alps' || m.id === 'bled')) { setSceneId(m.id, m.appearance); if (!defEnv()) showScene(m.id, m.appearance); }
    else if (m.op === 'immersion' && (m.level === 'ambient' || m.level === 'full')) setLevel(m.level, +m.v || 0.6);
    else if (m.op === 'look' && LV.level === 'ambient') { turn(+m.lx || 0, +m.ly || 0); if (!anim || anim.done) applyMask(levelRect(LV.v)); }
    else if (m.op === 'env-save' && m.env && m.env.id) { var E = envs().filter(function (x) { return x.id !== m.env.id; }), was = envs().map(function (x) { return x.id; }).indexOf(m.env.id); if (was >= 0) E.splice(was, 0, m.env); else E.unshift(m.env); sset(EKEY, E.slice(0, 30)); if (sget(DKEY) === m.env.id) showScene(m.env.scene, m.env.appearance); }
    else if (m.op === 'env-del' && m.id) sset(EKEY, envs().filter(function (x) { return x.id !== m.id; }));
    else if (m.op === 'env-def') { sset(DKEY, m.id || null); var d = defEnv(); showScene(d ? d.scene : sget(SKEY) || 'bled', d ? d.appearance : sget(AKEY)); }
  }
  function finish() {
    if (!el) return; root.removeEventListener('message', onMsg); var e0 = el, f0 = frame; hold(false); turn(0, 0);
    var r = winRect(), out = function () { el = null; e0.style.transition = 'opacity .55s ease'; e0.style.opacity = '0'; frameFade(1);
      setTimeout(function () { try { f0.src = 'about:blank'; } catch (er) {} e0.remove(); if (frame === f0) frame = null; }, 600); };   // the page and its GPU memory go with it
    if (r) tweenMask(r, 1.1).then(out); else out();
    var f = done; done = null; if (f) setTimeout(function () { f(null); }, r ? 1250 : 120);
  }
  function openScenic() {
    return new Promise(function (res) {
      if (el) return res(null); done = res;
      var cam = root.SpatialRoom && root.SpatialRoom.camera; base0 = cam ? cam.quaternion.clone() : null;
      el = document.createElement('div'); el.style.cssText = 'position:fixed;inset:0;z-index:2147483600;opacity:0;transition:opacity .7s ease;background:transparent';
      frame = document.createElement('iframe'); frame.title = 'Scenic World'; frame.setAttribute('allow', 'fullscreen; autoplay');
      frame.style.cssText = 'border:0;width:100%;height:100%;display:block;background:transparent'; frame.src = src();
      el.appendChild(frame); document.body.appendChild(el); root.addEventListener('message', onMsg);
      M = null; applyMask(winRect() || levelRect(0.5));                   // it starts as the window: the same rectangle, the same place
      setTimeout(function () { if (el && el.style.opacity !== '1') { el.style.opacity = '1'; frameFade(0); setLevel(LV.level, LV.v, 1.5); } }, 9000);   // never stuck behind a slow load
    });
  }
  root.addEventListener('resize', function () { if (el && LV) applyMask(levelRect(LV.v)); });

  root.SpatialScenic = { view: function (v) { if (v) { Object.keys(v).forEach(function (k) { if (k in ADJ) ADJ[k] = +v[k]; }); saveAdj(); } return JSON.parse(JSON.stringify(ADJ)); }, bar: showBar, make: function () { return [make()]; }, open: openScenic, close: finish, moments: shots, envs: envs, isOpen: function () { return !!el; }, level: function () { return el ? { level: LV.level, v: LV.v, mask: M } : null; }, focus: function (on) { if (frame) post({ op: 'focus', on: !!on }); } };
})(window);
