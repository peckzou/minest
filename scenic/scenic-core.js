/* Minest · Scenic core (2026-11-13) — one place builds a scene, for Scenic World (scenic.js) and for the Scenic Window
   in Spatial Home (spatial-home/js/scenic-window.js).
   A 2.5D depth scene in two layers, so nothing ghosts:
     bg — the photograph with the near branch taken out (filled from around it), on its cleaned depth (median + blur)
     fg — the branch alone, with its soft alpha, on its own depth
   Seen from the spot the photo was taken, the two layers make exactly the photo. Moving away a little (a head's or a
   step's worth, the way an Apple Vision Pro environment lets you lean and look), the branch slides over the lake and
   the hills while the mountains stay — real parallax. Larger moves are not offered: one photograph has nothing to show
   behind the island or round the mountains, and stretching it would be a fake. */
(function (root) {
  'use strict';
  var SCENES = {
    bled: {
      id: 'bled', name: 'Lake Bled · Autumn Sunset', zh: '布莱德湖 · 秋日夕照', place: 'Bled, Slovenia · 斯洛文尼亚', kindZh: '2.5D 深度场景 · 站在观景点',
      bg: 'assets/bled/bg_4k.webp', bgLow: 'assets/bled/bg_2k.webp', fg: 'assets/bled/fg_2k.png', fgW: 0.4,
      depthBg: 'assets/bled/depth_bg_1024.png', depthFg: 'assets/bled/depth_fg_1024.png', fx: 'assets/bled/fx_1024.png', thumb: 'assets/bled/bled_2k.webp',
      aspect: 4096 / 3208, vfov: 40,
      zmap: { B: 1 / 3500, C: 0.073, p: 2.2 },                       // relative inverse depth → metres (island ≈ 350 m, near lake ≈ 100 m, mountains ≈ 3.5 km)
      pivot: [0.49, 0.72],
      credit: 'Photo: <a href="https://commons.wikimedia.org/wiki/File:Bled_Island_06.jpg" target="_blank" rel="noopener">Krzysztof Golik · Bled Island 06</a> · <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener">CC BY-SA 4.0</a> · colour-graded to an autumn sunset by Minest · depth: Depth Anything V2'
    }
  };
  var VS = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }';
  function FS(layer) { return [
    'uniform sampler2D map; uniform sampler2D fx; uniform float uT; uniform float uLive; uniform float uFgW; varying vec2 vUv;',
    'void main(){',
    '  vec2 uv = vUv;',
    layer === 'fg' ? '  vec2 fuv = vec2(vUv.x * uFgW, vUv.y); vec4 m = texture2D(fx, fuv);' : '  vec4 m = texture2D(fx, vUv);',
    '  float sky = m.r * uLive, lake = m.g * uLive;',
    '  uv += sky * vec2(sin(uT*0.031 + vUv.y*5.0)*0.0035 + uT*0.00025, cos(uT*0.027 + vUv.x*4.0)*0.0016);',
    '  float near = smoothstep(0.35, 0.0, vUv.y);',
    '  uv += lake * vec2(sin(vUv.y*620.0 + uT*1.4 + sin(vUv.x*30.0))*0.00045, sin(vUv.x*340.0 + uT*1.1)*0.00028) * (0.4 + near);',
    '  vec4 c = texture2D(map, uv);',
    layer === 'fg' ? '  if (c.a < 0.04) discard;' : '',
    '  float sparkle = lake * pow(max(0.0, sin(vUv.x*900.0 + uT*2.3) * sin(vUv.y*1400.0 - uT*1.7)), 24.0) * smoothstep(0.45, 1.0, vUv.x);',
    '  c.rgb += vec3(1.0, 0.82, 0.6) * sparkle * 0.35;',
    '  c.rgb *= 1.0 + 0.025 * sin(uT * 0.09) * uLive;',
    '  gl_FragColor = vec4(c.rgb, ' + (layer === 'fg' ? 'c.a' : '1.0') + ');',
    '}'].join('\n'); }

  function img(src) { return new Promise(function (res, rej) { var i = new Image(); i.crossOrigin = 'anonymous'; i.onload = function () { res(i); }; i.onerror = rej; i.src = src; }); }
  function pixels(i) { var c = document.createElement('canvas'); c.width = i.naturalWidth; c.height = i.naturalHeight; var x = c.getContext('2d'); x.drawImage(i, 0, 0); return { w: c.width, h: c.height, d: x.getImageData(0, 0, c.width, c.height).data }; }
  function sampler(D, ch) { return function (u, v) { var x = u * (D.w - 1), y = v * (D.h - 1), x0 = Math.floor(x), y0 = Math.floor(y), x1 = Math.min(D.w - 1, x0 + 1), y1 = Math.min(D.h - 1, y0 + 1), fx = x - x0, fy = y - y0;
    function g(a, b) { return D.d[(b * D.w + a) * 4 + (ch || 0)] / 255; } return (g(x0, y0) * (1 - fx) + g(x1, y0) * fx) * (1 - fy) + (g(x0, y1) * (1 - fx) + g(x1, y1) * fx) * fy; }; }

  /** load(id, {base, low, renderer}) → Promise<{group, U, SC, P, tanH, tanV, dispose}> */
  function load(id, o) {
    var THREE = root.THREE, SC = SCENES[id || 'bled'], base = (o && o.base) || '', low = !!(o && o.low);
    var tanV = Math.tan(SC.vfov / 2 * Math.PI / 180), tanH = tanV * SC.aspect;
    function zOf(d) { var m = SC.zmap; return 1 / (m.B + m.C * Math.pow(Math.max(0, d), m.p)); }
    return Promise.all([img(base + (low ? SC.bgLow : SC.bg)), img(base + SC.fg), img(base + SC.depthBg), img(base + SC.depthFg), img(base + SC.fx)]).then(function (r) {
      var maxA = o && o.renderer ? o.renderer.capabilities.getMaxAnisotropy() : 4;
      function tex(i) { var t = new THREE.Texture(i); t.needsUpdate = true; t.minFilter = THREE.LinearMipmapLinearFilter; t.anisotropy = maxA; return t; }
      var tBg = tex(r[0]), tFg = tex(r[1]), tFx = new THREE.Texture(r[4]); tFx.needsUpdate = true;
      var U = { uT: { value: 0 }, uLive: { value: 1 }, uFgW: { value: SC.fgW } };
      function mat(layer, map) { var u = { map: { value: map }, fx: { value: tFx }, uT: U.uT, uLive: U.uLive, uFgW: U.uFgW };
        return new THREE.ShaderMaterial({ uniforms: u, vertexShader: VS, fragmentShader: FS(layer), side: THREE.DoubleSide, transparent: layer === 'fg', depthWrite: true }); }
      var dBg = sampler(pixels(r[2])), FG = pixels(r[1]), aFg = sampler(FG, 3), dFg = sampler(pixels(r[3]));
      function grid(NX, NY, u0, u1, dAt, keep) {
        var pos = new Float32Array(NX * NY * 3), uv = new Float32Array(NX * NY * 2), idx = [], k, i, j;
        for (j = 0; j < NY; j++) for (i = 0; i < NX; i++) {
          var u = u0 + (u1 - u0) * i / (NX - 1), v = j / (NY - 1), z = zOf(dAt(u, v)); k = j * NX + i;
          pos[k * 3] = (2 * u - 1) * tanH * z; pos[k * 3 + 1] = (1 - 2 * v) * tanV * z; pos[k * 3 + 2] = -z;
          uv[k * 2] = (u - u0) / (u1 - u0); uv[k * 2 + 1] = 1 - v;
        }
        for (j = 0; j < NY - 1; j++) for (i = 0; i < NX - 1; i++) { var a = j * NX + i, b = a + 1, c = a + NX, d = c + 1; if (!keep || keep(a, b, c)) idx.push(a, c, b); if (!keep || keep(b, c, d)) idx.push(b, c, d); }
        var g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setIndex(idx); return g;
      }
      var NX = low ? 200 : 320, NY = Math.round(NX / SC.aspect);
      var bg = new THREE.Mesh(grid(NX, NY, 0, 1, dBg), mat('bg', tBg));
      /* the branch: only where it is (alpha), on its own depth */
      var FX = Math.round(NX * SC.fgW * 1.6), alphaAt = function (k2) { return 0; };
      var fgGeo = (function () {
        var nx = FX, ny = NY, al = new Float32Array(nx * ny), nd = new Uint8Array(nx * ny);
        for (var j2 = 0; j2 < ny; j2++) for (var i2 = 0; i2 < nx; i2++) { var u2 = i2 / (nx - 1) * SC.fgW, v2 = j2 / (ny - 1); al[j2 * nx + i2] = aFg(i2 / (nx - 1), v2); nd[j2 * nx + i2] = dFg(u2, v2) > 0.25 ? 1 : 0; }
        /* only triangles wholly on the branch (all three corners at the branch's own depth) — a triangle reaching from the
           branch to the far lake would be a streak the moment the view moves */
        return grid(nx, ny, 0, SC.fgW, function (u, v) { var d = dFg(u, v); return d > 0.25 ? d : 0.25; },
          function (a, b, c) { return nd[a] && nd[b] && nd[c] && (al[a] > 0.02 || al[b] > 0.02 || al[c] > 0.02); });
      })();
      var fg = new THREE.Mesh(fgGeo, mat('fg', tFg)); fg.renderOrder = 2;
      var group = new THREE.Group(); group.add(bg); group.add(fg);
      var P = new THREE.Vector3((2 * SC.pivot[0] - 1) * tanH, (1 - 2 * SC.pivot[1]) * tanV, -1).multiplyScalar(zOf(dBg(SC.pivot[0], SC.pivot[1])));
      return { group: group, U: U, SC: SC, P: P, tanH: tanH, tanV: tanV, zOf: zOf,
        dispose: function () { [bg, fg].forEach(function (m) { m.geometry.dispose(); m.material.dispose(); }); [tBg, tFg, tFx].forEach(function (t) { t.dispose(); }); } };
    });
  }
  root.ScenicCore = { scenes: SCENES, load: load };
})(window);
