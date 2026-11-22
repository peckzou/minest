/* 动态呈现 2.0 · 镜头 (the lens). Loaded after three.js and before the eleven 1.0 presentations, which stay as they are:
   each makes its own THREE.WebGLRenderer and draws straight to the screen. Here every renderer made on this page is
   adopted, so that 2.0 can
   · 画风: draw the frame into a buffer first and finish it — bloom, colour grade, vignette, grain, or a comic / ink look
   · 氛围: put weather in the scene itself — dust, rain, snow, fireflies, petals — in a volume that follows the camera
   With 画风 "原片" and 氛围 "无" a renderer draws exactly as it does in 1.0.
   window.Dyn2FX = { looks, airs, set({ look, air, scale }), get(), live() } */
(function () {
  'use strict';
  var T = window.THREE; if (!T || !T.WebGLRenderer || window.Dyn2FX) return;

  // [id, 中文, English, { bloom, thr, sat, con, tint, lift, vig, grain, kind (0 film · 1 comic · 2 ink) }]
  var LOOKS = [
    ['off', '原片', 'Original', null],
    ['film', '电影', 'Cinema', { bloom: .3, thr: .8, sat: 1.1, con: 1.08, tint: [1.03, 1, .96], lift: [0, .008, .02], vig: .42, grain: .035, kind: 0 }],
    ['gold', '黄金时刻', 'Golden Hour', { bloom: .36, thr: .78, sat: 1.14, con: 1.05, tint: [1.12, .99, .82], lift: [.03, .012, 0], vig: .36, grain: .025, kind: 0 }],
    ['neon', '霓虹夜', 'Neon Night', { bloom: .62, thr: .66, sat: 1.3, con: 1.12, tint: [.93, .98, 1.12], lift: [.012, 0, .04], vig: .5, grain: .03, kind: 0 }],
    ['dream', '梦境', 'Dream', { bloom: .6, thr: .6, sat: 1.06, con: .96, tint: [1.03, 1, 1.04], lift: [.03, .025, .04], vig: .26, grain: .015, kind: 0 }],
    ['retro', '复古胶片', 'Retro Film', { bloom: .24, thr: .8, sat: .74, con: .96, tint: [1.08, 1, .86], lift: [.045, .03, .012], vig: .55, grain: .1, kind: 0 }],
    ['comic', '漫画', 'Comic', { bloom: .08, thr: .85, sat: 1.25, con: 1.06, tint: [1, 1, 1], lift: [0, 0, 0], vig: .2, grain: 0, kind: 1 }],
    ['ink', '黑白', 'Noir', { bloom: .26, thr: .8, sat: 0, con: 1.28, tint: [1, 1, 1], lift: [0, 0, 0], vig: .6, grain: .09, kind: 0 }]
  ];
  // [id, 中文, English, { n, r (half the volume's side, in the scene's units), size, vel, sway, col, alpha, add, shape (0 soft dot · 1 streak · 2 petal · 3 glow), indoor }]
  var AIRS = [
    ['none', '无', 'None', null],
    ['dust', '微尘', 'Dust', { n: 1400, r: 6, size: .035, vel: [.05, .04, .03], sway: .5, col: [1, .93, .78], alpha: .55, add: 1, shape: 0, indoor: 1 }],
    ['firefly', '萤火', 'Fireflies', { n: 320, r: 8, size: .11, vel: [.02, .03, .02], sway: 1.6, col: [.82, 1, .45], alpha: .95, add: 1, shape: 3, indoor: 1 }],
    ['petal', '花瓣', 'Petals', { n: 900, r: 9, size: .13, vel: [.9, -.8, .3], sway: 1.1, col: [1, .74, .82], alpha: .9, add: 0, shape: 2 }],
    ['snow', '雪', 'Snow', { n: 4500, r: 9, size: .08, vel: [.5, -1.7, .1], sway: .7, col: [1, 1, 1], alpha: .9, add: 0, shape: 0 }],
    ['rain', '雨', 'Rain', { n: 6000, r: 8, size: .55, vel: [.6, -22, 0], sway: 0, col: [.8, .88, 1], alpha: .5, add: 0, shape: 1 }]
  ];
  function look(id) { for (var i = 0; i < LOOKS.length; i++) if (LOOKS[i][0] === id) return LOOKS[i][3]; return null; }
  function airOf(id) { for (var i = 0; i < AIRS.length; i++) if (AIRS[i][0] === id) return AIRS[i][3]; return null; }
  var cfg = { look: 'off', air: 'none', scale: 1 }, live = [];

  var VERT = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }';
  var BRIGHT = 'uniform sampler2D tex; uniform vec2 px; uniform float thr; varying vec2 vUv;\n' +
    'void main(){ vec3 c = (texture2D(tex, vUv + px * vec2(-1., -1.)).rgb + texture2D(tex, vUv + px * vec2(1., -1.)).rgb + texture2D(tex, vUv + px * vec2(-1., 1.)).rgb + texture2D(tex, vUv + px * vec2(1., 1.)).rgb) * .25;\n' +
    '  float l = max(c.r, max(c.g, c.b)); gl_FragColor = vec4(c * smoothstep(thr, thr + .22, l), 1.); }';
  var BLUR = 'uniform sampler2D tex; uniform vec2 dir; varying vec2 vUv;\n' +
    'void main(){ vec3 c = texture2D(tex, vUv).rgb * .227;\n' +
    '  c += (texture2D(tex, vUv + dir * 1.385).rgb + texture2D(tex, vUv - dir * 1.385).rgb) * .316;\n' +
    '  c += (texture2D(tex, vUv + dir * 3.231).rgb + texture2D(tex, vUv - dir * 3.231).rgb) * .0703;\n' +
    '  gl_FragColor = vec4(c, 1.); }';
  var OUT = 'uniform sampler2D tex, glow; uniform vec2 px; uniform float bloom, sat, con, vig, grain, time, kind; uniform vec3 tint, lift; varying vec2 vUv;\n' +
    'float luma(vec3 c){ return dot(c, vec3(.299, .587, .114)); }\n' +
    'float at(float x, float y){ return luma(texture2D(tex, vUv + px * vec2(x, y)).rgb); }\n' +
    'float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }\n' +
    'void main(){ vec3 c = texture2D(tex, vUv).rgb;\n' +
    '  if (kind > .5) {\n' +   // comic: flat colours, an ink line where the picture changes, dots in the shade
    '    float gx = at(1.5, -1.5) + 2. * at(1.5, 0.) + at(1.5, 1.5) - at(-1.5, -1.5) - 2. * at(-1.5, 0.) - at(-1.5, 1.5);\n' +
    '    float gy = at(-1.5, 1.5) + 2. * at(0., 1.5) + at(1.5, 1.5) - at(-1.5, -1.5) - 2. * at(0., -1.5) - at(1.5, -1.5);\n' +
    '    float l = luma(c); vec3 q = c * (floor(l * 5. + .5) / 5. + .06) / max(l, .04);\n' +
    '    vec2 g = gl_FragCoord.xy * mat2(.7071, -.7071, .7071, .7071) / 5.; float d = length(fract(g) - .5);\n' +
    '    q *= 1. - .22 * step(d, .42 * (1. - smoothstep(.12, .5, l)));\n' +
    '    c = q * (1. - .92 * smoothstep(.16, .42, length(vec2(gx, gy))));\n' +
    '  }\n' +
    '  c = 1. - (1. - c) * (1. - clamp(texture2D(glow, vUv).rgb * bloom, 0., 1.));\n' +
    '  float l2 = luma(c); c = mix(vec3(l2), c, sat); c = (c - .5) * con + .5; c = c * tint + lift * (1. - clamp(l2, 0., 1.));\n' +
    '  vec2 v = (vUv - .5) * vec2(1., .82); c *= 1. - vig * smoothstep(.28, .82, length(v));\n' +
    '  c += (hash(gl_FragCoord.xy + fract(time) * 97.) - .5) * grain;\n' +
    '  gl_FragColor = vec4(clamp(c, 0., 1.), 1.); }';
  var AIR_V = 'uniform vec3 cam, vel; uniform float time, rad, sway, px; attribute vec4 seed; varying float vA; varying float vS;\n' +
    'void main(){ vec3 p = position * 2. * rad + vel * time;\n' +
    '  p.x += sin(time * (.35 + seed.x) + seed.y * 6.283) * sway; p.y += sin(time * (.2 + seed.z * .5) + seed.x * 6.283) * sway * .4; p.z += cos(time * (.3 + seed.z) + seed.x * 6.283) * sway;\n' +
    '  p = mod(p - cam + rad, 2. * rad) - rad;\n' +   // the volume wraps round the camera, so it is always full
    '  vec4 mv = viewMatrix * vec4(p + cam, 1.); gl_Position = projectionMatrix * mv;\n' +
    '  float d = length(p) / rad; vA = (1. - smoothstep(.7, 1., d)) * smoothstep(.03, .14, d); vS = seed.w;\n' +
    '  gl_PointSize = min(64., px * (.55 + seed.w * .9) / max(.05, -mv.z)); }';
  var AIR_F = 'uniform vec3 col; uniform float alpha, shape, time; varying float vA; varying float vS;\n' +
    'void main(){ vec2 c = gl_PointCoord - .5; float a;\n' +
    '  if (shape < .5) a = smoothstep(.5, .12, length(c));\n' +
    '  else if (shape < 1.5) a = smoothstep(.035, 0., abs(c.x + c.y * .04)) * smoothstep(.5, .1, abs(c.y));\n' +
    '  else if (shape < 2.5) { float r = time * (.8 + vS) + vS * 40.; vec2 q = mat2(cos(r), -sin(r), sin(r), cos(r)) * c; a = smoothstep(.5, .4, length(q * vec2(1., 1.9 + sin(r * 1.7)))); }\n' +
    '  else { float f = .45 + .55 * sin(time * (1.2 + vS * 2.) + vS * 50.); a = (smoothstep(.5, 0., length(c)) * .6 + smoothstep(.12, 0., length(c))) * f * f; }\n' +
    '  gl_FragColor = vec4(col * (shape > 1.5 && shape < 2.5 ? .82 + .3 * vS : 1.), a * alpha * vA); }';

  function build(s) {
    // (smooth edges where 1.0 asks for them: below two device pixels per point)
    var r = s.r, sz = r.getDrawingBufferSize(new T.Vector2()), w = Math.max(2, sz.x), h = Math.max(2, sz.y), o = { minFilter: T.LinearFilter, magFilter: T.LinearFilter, format: T.RGBAFormat };
    s.rt = r.capabilities.isWebGL2 && T.WebGLMultisampleRenderTarget && r.getPixelRatio() < 2 ? new T.WebGLMultisampleRenderTarget(w, h, o) : new T.WebGLRenderTarget(w, h, o);
    o.depthBuffer = false; s.a = new T.WebGLRenderTarget(w >> 2 || 1, h >> 2 || 1, o); s.b = new T.WebGLRenderTarget(w >> 2 || 1, h >> 2 || 1, o);
    s.w = w; s.h = h;
    function mat(frag, u) { return new T.ShaderMaterial({ vertexShader: VERT, fragmentShader: frag, uniforms: u, depthTest: false, depthWrite: false }); }
    s.mBright = mat(BRIGHT, { tex: { value: null }, px: { value: new T.Vector2() }, thr: { value: .7 } });
    s.mBlur = mat(BLUR, { tex: { value: null }, dir: { value: new T.Vector2() } });
    s.mOut = mat(OUT, { tex: { value: null }, glow: { value: null }, px: { value: new T.Vector2() }, bloom: { value: 0 }, sat: { value: 1 }, con: { value: 1 }, vig: { value: 0 }, grain: { value: 0 }, time: { value: 0 }, kind: { value: 0 },
      tint: { value: new T.Vector3(1, 1, 1) }, lift: { value: new T.Vector3() } });
    s.quad = new T.Mesh(new T.PlaneBufferGeometry(2, 2), s.mOut); s.quad.frustumCulled = false; s.qs = new T.Scene(); s.qs.add(s.quad); s.qc = new T.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  }
  function drop(s) {
    ['rt', 'a', 'b', 'mBright', 'mBlur', 'mOut'].forEach(function (k) { if (s[k]) { try { s[k].dispose(); } catch (e) {} s[k] = null; } });
    if (s.quad) { s.quad.geometry.dispose(); s.quad = null; }
    noAir(s);
  }
  function pass(s, m, target) { s.quad.material = m; s.setRT.call(s.r, target); s.render.call(s.r, s.qs, s.qc); }
  function present(s) {   // the finished frame, from the buffer to the screen
    var r = s.r, L = look(cfg.look); if (!L || !s.rt) return;
    var ac = r.autoClear; s.busy = true; r.autoClear = true;
    try {
      var u = s.mBright.uniforms; u.tex.value = s.rt.texture; u.px.value.set(1 / s.w, 1 / s.h); u.thr.value = L.thr; pass(s, s.mBright, s.a);
      var bw = 1 / s.a.width, bh = 1 / s.a.height; u = s.mBlur.uniforms;
      for (var i = 0; i < 2; i++) { var k = i ? 2.2 : 1; u.tex.value = s.a.texture; u.dir.value.set(bw * k, 0); pass(s, s.mBlur, s.b); u.tex.value = s.b.texture; u.dir.value.set(0, bh * k); pass(s, s.mBlur, s.a); }
      u = s.mOut.uniforms; u.tex.value = s.rt.texture; u.glow.value = s.a.texture; u.px.value.set(1 / s.w, 1 / s.h); u.bloom.value = L.bloom; u.sat.value = L.sat; u.con.value = L.con; u.vig.value = L.vig; u.grain.value = L.grain; u.kind.value = L.kind;
      u.tint.value.fromArray(L.tint); u.lift.value.fromArray(L.lift); u.time.value = (performance.now() - s.t0) / 1000;
      pass(s, s.mOut, null);
    } catch (e) { s.failed = true; }
    s.setRT.call(r, s.failed ? null : s.rt); if (s.failed) s.on = false;
    r.autoClear = ac; s.busy = false;
  }

  function noAir(s) { var a = s.air; s.air = null; if (!a) return; if (a.obj.parent) a.obj.parent.remove(a.obj); a.obj.geometry.dispose(); a.obj.material.dispose(); }
  function air(s, scene, cam) {   // weather rides in the scene the presentation draws first (what is outside the window, for the train and the car)
    var A = airOf(cfg.air);
    if (!A) { if (s.air) noAir(s); return; }
    if (!s.air || s.air.id !== cfg.air) {
      noAir(s);
      var n = A.n, pos = new Float32Array(n * 3), seed = new Float32Array(n * 4), i;
      for (i = 0; i < n * 3; i++) pos[i] = Math.random();
      for (i = 0; i < n * 4; i++) seed[i] = Math.random();
      var g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(pos, 3)); g.setAttribute('seed', new T.BufferAttribute(seed, 4));
      var m = new T.ShaderMaterial({ vertexShader: AIR_V, fragmentShader: AIR_F, transparent: true, depthWrite: false, fog: false, blending: A.add ? T.AdditiveBlending : T.NormalBlending,
        uniforms: { cam: { value: new T.Vector3() }, vel: { value: new T.Vector3() }, time: { value: 0 }, rad: { value: 1 }, sway: { value: 0 }, px: { value: 1 }, col: { value: new T.Vector3().fromArray(A.col) }, alpha: { value: A.alpha }, shape: { value: A.shape } } });
      var o = new T.Points(g, m); o.frustumCulled = false; o.renderOrder = 9999; o.raycast = function () {}; o.name = 'dyn2-air'; o.matrixAutoUpdate = false;
      s.air = { id: cfg.air, obj: o };
    }
    var ob = s.air.obj, u = ob.material.uniforms, k = cfg.scale || 1;
    if (ob.parent !== scene) scene.add(ob);
    cam.getWorldPosition(u.cam.value); u.time.value = (performance.now() - s.t0) / 1000; u.rad.value = A.r * k; u.sway.value = A.sway * k; u.vel.value.fromArray(A.vel).multiplyScalar(k);
    u.px.value = A.size * k * s.r.getDrawingBufferSize(s.v2).y / (2 * Math.tan((cam.fov || 60) * Math.PI / 360));
  }

  function before(s, scene, cam) {
    var r = s.r, want = !!look(cfg.look) && !s.failed;
    if (want) {
      try {
        if (!s.rt) build(s);
        var sz = r.getDrawingBufferSize(s.v2), w = Math.max(2, sz.x), h = Math.max(2, sz.y), resized = w !== s.w || h !== s.h;
        if (resized) { s.w = w; s.h = h; s.rt.setSize(w, h); s.a.setSize(w >> 2 || 1, h >> 2 || 1); s.b.setSize(w >> 2 || 1, h >> 2 || 1); }
        s.rt.texture.encoding = r.outputEncoding;   // the presentation's own colours, whatever it asked the renderer for
        if (!s.on || resized) { s.on = true; s.setRT.call(r, s.rt); }
      } catch (e) { s.failed = true; s.on = false; try { s.setRT.call(r, null); } catch (x) {} }
    } else if (s.on) { s.on = false; s.setRT.call(r, null); }
    if (!s.first && cam && cam.isPerspectiveCamera) { s.first = true; try { air(s, scene, cam); } catch (e) {} }
    if (!s.queued) { s.queued = true; Promise.resolve().then(function () { s.queued = false; s.first = false; if (!s.dead && s.on) present(s); }); }   // once the presentation has drawn all it draws this frame
  }

  var R0 = T.WebGLRenderer;
  function adopt(r) {
    var s = { r: r, render: r.render, setRT: r.setRenderTarget, dispose: r.dispose, rt: null, on: false, queued: false, first: false, dead: false, busy: false, failed: false, air: null, t0: performance.now(), v2: new T.Vector2() };
    r.render = function (scene, cam) { if (!s.busy && !s.dead) before(s, scene, cam); return s.render.apply(r, arguments); };
    r.setRenderTarget = function (t) { if (!s.busy && s.on && t == null) { var a = Array.prototype.slice.call(arguments); a[0] = s.rt; return s.setRT.apply(r, a); } return s.setRT.apply(r, arguments); };
    r.dispose = function () { s.dead = true; s.on = false; drop(s); var i = live.indexOf(s); if (i >= 0) live.splice(i, 1); return s.dispose.apply(r, arguments); };
    live.push(s);
  }
  function Renderer(p) { var r = new R0(p); try { adopt(r); } catch (e) {} return r; }
  Renderer.prototype = R0.prototype;
  T.WebGLRenderer = Renderer;

  window.Dyn2FX = {
    looks: LOOKS.map(function (l) { return { id: l[0], zh: l[1], en: l[2] }; }),
    airs: AIRS.map(function (a) { return { id: a[0], zh: a[1], en: a[2], indoor: !a[3] || !!a[3].indoor }; }),
    set: function (o) { if (!o) return; if (o.look != null && (o.look === 'off' || look(o.look))) cfg.look = o.look; if (o.air != null && (o.air === 'none' || airOf(o.air))) cfg.air = o.air; if (o.scale > 0) cfg.scale = +o.scale; },
    get: function () { return { look: cfg.look, air: cfg.air, scale: cfg.scale }; },
    live: function () { return live.map(function (s) { return { on: s.on, failed: s.failed, air: s.air ? s.air.id : null, w: s.w, h: s.h }; }); }
  };
})();
