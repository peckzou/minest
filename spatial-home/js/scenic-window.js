/* Minest · Spatial Home — the Scenic Window (2026-11-13). A floor-to-ceiling window that stands in any room as one of its
   things (move it like the others). Ultra-thin dark metal frame; behind the glass, Lake Bled — the real photograph
   (Krzysztof Golik, CC BY-SA 4.0, graded) seen the way a window shows a far landscape: every point of the glass looks
   along its own line of sight, so the view shifts as you move, the frame crops it, and it never reads as a picture on
   the wall. Clouds drift and the lake ripples a little (masks made with the photo). Tap it: the camera goes up to the
   glass, the frame leaves the picture, and Scenic World (scenic/index.html) opens over it from the same view; Exit plays
   it back. Moments captured there are kept in the backpack store ('scenic:moments'). */
(function (root) {
  'use strict';
  var THREE = root.THREE, KEY = 'scenic:moments', W = 1.72, H = 2.62, F = 0.034;
  function base() {
    if (/^https?:$/.test(location.protocol)) return /\/spatial-home\//.test(location.pathname) ? '../' : '';
    return 'https://minest-app.vercel.app/';
  }
  function L(h) { return new THREE.Color(h).convertSRGBToLinear(); }

  function make() {
    var g = new THREE.Group(), metal = new THREE.MeshStandardMaterial({ color: L(0x1b1d21), roughness: 0.32, metalness: 0.7 });
    function bar(x, y, w, h, d, z) { var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), metal); m.position.set(x, y, z || 0); m.castShadow = true; g.add(m); return m; }
    bar(0, H - F / 2, W, F, 0.07); bar(0, F / 2 + 0.01, W, F, 0.07); bar(-W / 2 + F / 2, H / 2, F, H, 0.07); bar(W / 2 - F / 2, H / 2, F, H, 0.07);
    bar(0, 0.005, W + 0.06, 0.01, 0.16);                                    // a slim floor track
    var pane = new THREE.Mesh(new THREE.PlaneGeometry(W - 2 * F, H - 2 * F - 0.01), null); pane.position.set(0, H / 2 + 0.005, 0); g.add(pane);
    var back = new THREE.Mesh(new THREE.PlaneGeometry(W - 2 * F, H - 2 * F), new THREE.MeshStandardMaterial({ color: L(0x2a2d33), roughness: 0.2, metalness: 0.3 })); back.rotation.y = Math.PI; back.position.set(0, H / 2, -0.004); g.add(back);

    /* the view: a far landscape through glass — the photo is looked up along each line of sight */
    var U = { map: { value: null }, fx: { value: null }, uT: { value: 0 }, uCam: { value: new THREE.Vector3(0, 1.5, 3) }, uTan: { value: new THREE.Vector2(0.74, 0.58) }, uOff: { value: new THREE.Vector2(0.0, -0.06) }, uOk: { value: 0 } };
    pane.material = new THREE.ShaderMaterial({
      uniforms: U,
      vertexShader: 'varying vec3 vP; void main(){ vP = (modelMatrix * vec4(position,1.0)).xyz; vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: [
        'uniform sampler2D map; uniform sampler2D fx; uniform float uT; uniform vec3 uCam; uniform vec2 uTan; uniform vec2 uOff; uniform float uOk; varying vec3 vP;',
        'void main(){',
        '  vec3 d = normalize(vP - uCam);',
        '  if (d.z > -0.02 || uOk < 0.5) { gl_FragColor = vec4(vec3(0.16,0.15,0.14), 1.0); return; }',
        '  vec2 q = vec2(d.x, d.y) / -d.z;',
        '  vec2 uv = vec2(0.5 + q.x / (2.0 * uTan.x), 0.5 + q.y / (2.0 * uTan.y)) + uOff;',
        '  vec2 cuv = clamp(uv, 0.002, 0.998); float out_ = length(uv - cuv) * 8.0;',
        '  vec4 m = texture2D(fx, cuv);',
        '  cuv += m.r * vec2(sin(uT*0.031 + cuv.y*5.0)*0.0035 + uT*0.00025, cos(uT*0.027 + cuv.x*4.0)*0.0016);',
        '  cuv += m.g * vec2(sin(cuv.y*620.0 + uT*1.4)*0.0004, sin(cuv.x*340.0 + uT*1.1)*0.00025);',
        '  vec3 c = texture2D(map, cuv).rgb * (1.0 - clamp(out_, 0.0, 0.35));',
        '  float fr = pow(1.0 - abs(d.z), 3.0);',                     // the glass: a faint cool reflection at grazing angles
        '  c = mix(c, vec3(0.86, 0.9, 0.96), 0.03 + 0.18 * fr);',
        '  gl_FragColor = vec4(c, 1.0);',
        '}'].join('\n')
    });
    var _v = new THREE.Vector3();
    pane.onBeforeRender = function (r, s, cam) { _v.copy(cam.position); pane.worldToLocal(_v); U.uCam.value.copy(_v); };
    var tl = new THREE.TextureLoader(); tl.setCrossOrigin('anonymous');
    var loaded = 0, done = function () { if (++loaded === 2) U.uOk.value = 1; };
    tl.load(base() + 'scenic/assets/bled/bled_2k.webp', function (t) { t.minFilter = THREE.LinearMipmapLinearFilter; t.anisotropy = 4; U.map.value = t; done(); });
    tl.load(base() + 'scenic/assets/bled/fx_1024.png', function (t) { U.fx.value = t; done(); });
    var light = new THREE.PointLight(0xffd2a0, 0.35, 4, 2); light.position.set(0, 1.6, 0.6); g.add(light);   // the sunset spills a little into the room

    var hit = new THREE.Mesh(new THREE.BoxGeometry(W, H, 0.12), new THREE.MeshBasicMaterial({ visible: false })); hit.position.set(0, H / 2, 0.02); g.add(hit);
    return {
      id: 'scenicWindow', name: '风景之窗', en: 'Scenic Window · Lake Bled', icon: '🏞', feature: 'scenic', anchor: 'floor.window', group: g,
      hit: hit, label: [0, H + 0.12, 0],
      focus: { pos: [-1.2, 1.38, 1.62], look: [-1.2, 1.36, 3.6] },     // in front of the glass (default anchor floor.window [-1.2, 0, 2.45], facing the room)
      panel: function () { return openScenic(); },
      set: function (k) { light.intensity = 0.35 + 0.4 * k; }, idle: function (t) { U.uT.value = t; }
    };
  }

  /* ---- Scenic World over the room: it fades in only once its first frame is drawn (no black, no flash) ---- */
  var el = null, frame = null, done = null;
  function src() { return base() + 'scenic/index.html?enter=1'; }
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
