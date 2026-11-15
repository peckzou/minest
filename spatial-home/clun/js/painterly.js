/* Clun · 外景的统一画风：手绘动画电影感。
   1) 远景照片一次性绘画化（Kuwahara 笔触滤镜 + 调色 + 远山大气雾 + 天空换成画出来的云天），结果存进一张贴图；
   2) 3D 材质换成柔和分层的卡通光照，带一点暖色边缘光；
   3) 草坪上铺随风摆动的草叶（实例化），树叶随风轻晃。 */
(function () {
  'use strict';
  var C = window.Clun = window.Clun || {};
  var S = C.Paint = {};

  var NOISE = [
    'float h2(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }',
    'float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);',
    '  return mix(mix(h2(i), h2(i + vec2(1.0, 0.0)), f.x), mix(h2(i + vec2(0.0, 1.0)), h2(i + vec2(1.0, 1.0)), f.x), f.y); }',
    'float fbm(vec2 p){ float s = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { s += a * vn(p); p *= 2.03; a *= 0.5; } return s; }'
  ].join('\n');

  /* 远景照片 → 绘画化贴图。src 是原始照片（按原值读），返回渲染目标的贴图（存的是 sRGB 值）。 */
  S.paintBackdrop = function (renderer, src, W, H) {
    var rt = new THREE.WebGLRenderTarget(W, H, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, generateMipmaps: false, depthBuffer: false });
    var mat = new THREE.ShaderMaterial({
      uniforms: { tSrc: { value: src }, uTexel: { value: new THREE.Vector2(1 / src.image.width, 1 / src.image.height) } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
      fragmentShader: [
        'uniform sampler2D tSrc; uniform vec2 uTexel; varying vec2 vUv;', NOISE,
        'void main(){',
        '  vec3 m0 = vec3(0.0), m1 = vec3(0.0), m2 = vec3(0.0), m3 = vec3(0.0), s0 = vec3(0.0), s1 = vec3(0.0), s2 = vec3(0.0), s3 = vec3(0.0);',
        '  for (int j = -3; j <= 3; j++) for (int i = -3; i <= 3; i++) {',            /* Kuwahara：四个象限里取方差最小的平均色，得到笔触感 */
        '    vec3 c = texture2D(tSrc, vUv + vec2(float(i), float(j)) * uTexel * 0.9).rgb;',
        '    if (i <= 0 && j <= 0) { m0 += c; s0 += c * c; } if (i >= 0 && j <= 0) { m1 += c; s1 += c * c; }',
        '    if (i <= 0 && j >= 0) { m2 += c; s2 += c * c; } if (i >= 0 && j >= 0) { m3 += c; s3 += c * c; }',
        '  }',
        '  float n = 16.0; m0 /= n; m1 /= n; m2 /= n; m3 /= n;',
        '  float v0 = dot(abs(s0 / n - m0 * m0), vec3(1.0)), v1 = dot(abs(s1 / n - m1 * m1), vec3(1.0)), v2 = dot(abs(s2 / n - m2 * m2), vec3(1.0)), v3 = dot(abs(s3 / n - m3 * m3), vec3(1.0));',
        '  vec3 c = m0; float v = v0; if (v1 < v) { c = m1; v = v1; } if (v2 < v) { c = m2; v = v2; } if (v3 < v) { c = m3; v = v3; }',
        '  vec3 o = texture2D(tSrc, vUv).rgb; float y = vUv.y;',
        '  float lum = dot(c, vec3(0.299, 0.587, 0.114));',
        '  c = mix(vec3(lum), c, 1.12);',                                                 /* 饱和一点 */
        '  c += vec3(-0.03, 0.0, 0.05) * (1.0 - smoothstep(0.15, 0.55, lum));',            /* 暗部偏青蓝 */
        '  c += vec3(0.05, 0.03, -0.03) * smoothstep(0.5, 0.95, lum);',                    /* 亮部偏暖 */
        '  c = mix(c, vec3(0.55, 0.62, 0.6), 0.07);',                                       /* 整体粉一点、反差低一点 */
        '  float g = c.g - max(c.r, c.b);',
        '  c.g += 0.04 * smoothstep(0.02, 0.12, g); c.r += 0.03 * smoothstep(0.02, 0.12, g);',  /* 绿色往黄绿走 */
        '  float haze = smoothstep(0.40, 0.92, y) * 0.32;',                                 /* 远山：越高越远，蒙一层蓝白的空气 */
        '  c = mix(c, vec3(0.70, 0.82, 0.94), haze);',
        '  float skyM = smoothstep(0.22, 0.45, o.b - o.r) * smoothstep(0.12, 0.3, o.b - o.g) * smoothstep(0.5, 0.7, y);',     /* 天空：照片上部很饱和的蓝（山的蓝和雪的阴影都不够饱和） */
        '  float px = vUv.x * 1266.0, py = (1.0 - y) * 860.0;',                              /* 左边大山的轮廓（照片像素）：山上不算天空 */
        '  float edge = py < 88.0 ? -20.0 : py < 120.0 ? mix(40.0, 110.0, (py - 88.0) / 32.0) : py < 190.0 ? mix(110.0, 180.0, (py - 120.0) / 70.0) : py < 262.0 ? mix(180.0, 260.0, (py - 190.0) / 72.0) : 2000.0;',
        '  skyM *= smoothstep(edge, edge + 14.0, px);',
        '  vec3 sky = mix(vec3(0.5, 0.7, 0.94), vec3(0.24, 0.5, 0.88), smoothstep(0.62, 1.0, y));',            /* 贴近照片原来的蓝，接缝看不出 */
        '  vec2 q = vec2(vUv.x * 3.2, vUv.y * 7.0);',
        '  float cl = fbm(q + vec2(0.0, 3.7)) + 0.35 * fbm(q * 2.3);',
        '  float cm = smoothstep(0.66, 0.92, cl) * smoothstep(1.05, 0.72, y);',
        '  vec3 cloud = mix(vec3(0.74, 0.82, 0.94), vec3(1.0, 0.99, 0.96), smoothstep(0.82, 1.1, fbm(q + vec2(0.05, 3.82)) + 0.35 * fbm(q * 2.3)));',
        '  sky = mix(sky, cloud, cm);',
        '  c = mix(c, sky, skyM);',
        '  float e = length(vec2(dot(texture2D(tSrc, vUv + vec2(uTexel.x * 2.0, 0.0)).rgb - texture2D(tSrc, vUv - vec2(uTexel.x * 2.0, 0.0)).rgb, vec3(0.33)),',
        '                       dot(texture2D(tSrc, vUv + vec2(0.0, uTexel.y * 2.0)).rgb - texture2D(tSrc, vUv - vec2(0.0, uTexel.y * 2.0)).rgb, vec3(0.33))));',
        '  c *= 1.0 - 0.18 * smoothstep(0.12, 0.35, e) * (1.0 - skyM);',                  /* 很淡的勾线感 */
        '  gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);',
        '}'].join('\n'),
      depthTest: false, depthWrite: false
    });
    var sc = new THREE.Scene(), cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), q = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
    q.frustumCulled = false; sc.add(q);
    var prevT = renderer.getRenderTarget(), prevC = renderer.clippingPlanes; renderer.clippingPlanes = [];
    renderer.setRenderTarget(rt); renderer.render(sc, cam); renderer.setRenderTarget(prevT); renderer.clippingPlanes = prevC;
    q.geometry.dispose(); mat.dispose();
    rt.texture.encoding = THREE.sRGBEncoding;                                         /* 存的是 sRGB 值：显示时先解码再编码，颜色不变 */
    return rt;
  };

  /* 柔和分层的卡通光照 */
  var GRAD = (function () {
    var v = [0.5, 0.53, 0.6, 0.74, 0.88, 0.96, 1.0, 1.0], d = new Uint8Array(v.length * 3);
    v.forEach(function (x, i) { d[i * 3] = d[i * 3 + 1] = d[i * 3 + 2] = Math.round(x * 255); });
    var t = new THREE.DataTexture(d, v.length, 1, THREE.RGBFormat); t.minFilter = t.magFilter = THREE.LinearFilter; t.generateMipmaps = false; t.needsUpdate = true; return t;
  })();
  S.time = { value: 0 };
  function rim(shader, strength) {
    shader.uniforms.uRim = { value: new THREE.Color(0.32, 0.28, 0.18).multiplyScalar(strength) };
    shader.fragmentShader = 'uniform vec3 uRim;\n' + shader.fragmentShader.replace('#include <output_fragment>',
      'outgoingLight += uRim * pow(1.0 - clamp(dot(normalize(normal), normalize(vViewPosition)), 0.0, 1.0), 3.0);\n#include <output_fragment>');
  }
  S.toon = function (m, opt) {
    if (!m || m.isMeshBasicMaterial || m.isShaderMaterial || m.isMeshToonMaterial) return m;
    opt = opt || {};
    var t = new THREE.MeshToonMaterial({ color: m.color, map: m.map, gradientMap: GRAD, vertexColors: m.vertexColors, alphaTest: m.alphaTest, side: m.side,
      transparent: m.transparent, opacity: m.opacity, depthWrite: m.depthWrite });
    t.onBeforeCompile = function (sh) {
      rim(sh, opt.rim == null ? 1 : opt.rim);
      if (opt.sway) {                                                                   /* 树叶随风轻晃（几何体坐标 Z 向上） */
        sh.uniforms.uTime = S.time;
        sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace('#include <begin_vertex>',
          '#include <begin_vertex>\n float sw = sin(uTime * 1.3 + position.x * 0.35 + position.y * 0.2) * 0.5 + sin(uTime * 2.1 + position.y * 0.5) * 0.25;\n transformed.x += sw * ' + opt.sway.toFixed(3) + '; transformed.y += sw * ' + (opt.sway * 0.5).toFixed(3) + ';');
      }
    };
    return t;
  };
  /* 把一棵树（Object3D）里的材质都换成卡通光照（同一个材质只换一次） */
  S.toonTree = function (obj, optFn) {
    var cache = new Map();
    obj.traverse(function (o) {
      if (!o.isMesh) return;
      var mats = Array.isArray(o.material) ? o.material : [o.material];
      var out = mats.map(function (m) { if (!cache.has(m)) cache.set(m, S.toon(m, optFn ? optFn(o, m) : null)); return cache.get(m); });
      o.material = Array.isArray(o.material) ? out : out[0];
    });
  };

  /* 草叶：每丛 7 片三角形草叶，实例化铺在草坪上，随风摆。pts = [[x, y(三维的高), z, s]]（three 坐标） */
  S.grass = function (pts, rnd) {
    var blades = 7, pos = [], col = [], nrm = [], i;
    for (i = 0; i < blades; i++) {
      var a = rnd() * 6.28, r = rnd() * 0.24, cx = Math.cos(a) * r, cz = Math.sin(a) * r, w = 0.05 + rnd() * 0.03, h = 0.4 + rnd() * 0.35, ba = rnd() * 6.28, lean = (rnd() - 0.5) * 0.25;
      var ux = Math.cos(ba) * w, uz = Math.sin(ba) * w;
      pos.push(cx - ux, 0, cz - uz, cx + ux, 0, cz + uz, cx + lean, h, cz + lean * 0.5);
      col.push(0.045, 0.13, 0.02, 0.045, 0.13, 0.02, 0.3, 0.52, 0.08);                 /* 线性值：根部深绿，尖上黄绿 */
      nrm.push(0, 1, 0, 0, 1, 0, 0, 1, 0);
    }
    var g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
    var m = new THREE.MeshToonMaterial({ gradientMap: GRAD, vertexColors: true, side: THREE.DoubleSide });
    m.onBeforeCompile = function (sh) {
      sh.uniforms.uTime = S.time;
      sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace('#include <begin_vertex>', [
        '#include <begin_vertex>',
        ' vec4 ip = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);',
        ' float wv = sin(uTime * 1.7 + ip.x * 0.18 + ip.z * 0.11) * 0.6 + sin(uTime * 3.1 + ip.x * 0.7 + ip.z * 0.5) * 0.25 + 0.35;',
        ' float k = position.y * position.y;',
        ' transformed.x += wv * k * 0.32; transformed.z -= wv * k * 0.12; transformed.y -= abs(wv) * k * 0.08;'].join('\n'));
    };
    var im = new THREE.InstancedMesh(g, m, pts.length), M4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), cc = new THREE.Color();
    pts.forEach(function (p, k) {
      e.set(0, rnd() * 6.28, 0); q.setFromEuler(e); M4.compose(new THREE.Vector3(p[0], p[1], p[2]), q, new THREE.Vector3(p[3], p[3] * (0.8 + rnd() * 0.5), p[3]));
      im.setMatrixAt(k, M4); var v = 0.85 + rnd() * 0.3; cc.setRGB(v * (0.95 + rnd() * 0.1), v, v * (0.85 + rnd() * 0.2)); im.setColorAt(k, cc);
    });
    im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true;
    im.receiveShadow = true; im.frustumCulled = false;
    return im;
  };
})();
