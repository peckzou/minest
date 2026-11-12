/* Minest Duo Holographic Portal — 原创 GLSL 材质
 * 全息主体、投影底座光环、光束、粒子、投影台网格。全部加色混合、不写深度。 */
(function () {
  'use strict';
  var T = THREE;
  var HASH = [
    'float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }',
    'float hash3(vec3 p){ return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }'
  ].join('\n');

  // 所有材质共享的 uniform 对象
  var shared = {
    uTime: { value: 0 },
    uColor: { value: new T.Color(0x45dcff) },
    uPower: { value: 1 },
    uViewH: { value: 800 }
  };

  function base(opts) {
    return new T.ShaderMaterial(Object.assign({
      transparent: true, depthWrite: false, depthTest: false,
      blending: T.AdditiveBlending, side: T.DoubleSide
    }, opts));
  }

  /* ---------- 全息主体 ---------- */
  function hologramMaterial() {
    return base({
      uniforms: {
        uTime: shared.uTime, uColor: shared.uColor,
        uReveal: { value: 0 }, uDissolve: { value: 0 },
        uOpacity: { value: 1 }, uScan: { value: 1 }, uFlicker: { value: 1 },
        uY0: { value: 0 }, uY1: { value: 2 }
      },
      vertexShader: [
        'uniform float uTime, uDissolve, uFlicker, uY0, uY1;',
        'attribute vec3 aTint;',
        'varying vec3 vWorld; varying vec3 vNormalW; varying vec3 vTint; varying vec3 vLocal; varying float vH;',
        HASH,
        'void main(){',
        '  vec3 p = position;',
        '  vH = clamp((p.y - uY0) / (uY1 - uY0), 0.0, 1.0);',
        // 数字信号干扰：偶发的整行水平错位
        '  float tick = floor(uTime * 10.0);',
        '  float burst = step(0.9, hash(vec2(tick, 3.7))) * uFlicker;',
        '  float row = floor(p.y * 16.0);',
        '  float stripe = step(0.72, hash(vec2(row, tick)));',
        '  p.x += burst * stripe * (hash(vec2(row + 1.3, tick)) - 0.5) * 0.3;',
        // 解体：逐行撕裂 + 碎块上飘
        '  float t2 = floor(uTime * 24.0);',
        '  p.x += uDissolve * (hash(vec2(floor(p.y * 26.0), t2)) - 0.5) * 1.3 * (0.3 + vH);',
        '  p.y += uDissolve * uDissolve * 0.55 * hash(vec2(floor(position.x * 7.0) + floor(position.z * 7.0) * 13.0, 5.0));',
        '  vLocal = position; vTint = aTint;',
        '  vec4 w = modelMatrix * vec4(p, 1.0);',
        '  vWorld = w.xyz;',
        '  vNormalW = normalize(mat3(modelMatrix) * normal);',
        '  gl_Position = projectionMatrix * viewMatrix * w;',
        '}'
      ].join('\n'),
      fragmentShader: [
        'precision highp float;',
        'uniform float uTime, uReveal, uDissolve, uOpacity, uScan, uFlicker;',
        'uniform vec3 uColor;',
        'varying vec3 vWorld; varying vec3 vNormalW; varying vec3 vTint; varying vec3 vLocal; varying float vH;',
        HASH,
        'void main(){',
        // 自下而上逐行生成
        '  float hq = floor(vH * 72.0) / 72.0;',
        '  if (hq > uReveal) discard;',
        '  float edge = uReveal < 1.01 ? smoothstep(0.07, 0.0, uReveal - hq) : 0.0;',
        // 信号解体：方块噪声，从顶部先消失
        '  if (uDissolve > 0.0) {',
        '    float n = hash3(floor(vLocal * 9.0) + floor(uTime * 12.0) * 0.37);',
        '    if (n < uDissolve * 1.45 - (1.0 - vH) * 0.4) discard;',
        '  }',
        '  vec3 N = normalize(vNormalW);',
        '  vec3 V = normalize(cameraPosition - vWorld);',
        '  float fres = pow(1.0 - abs(dot(N, V)), 2.2);',
        // 水平扫描线（世界空间，模型旋转时保持水平）+ 缓慢上行的亮带
        '  float line = smoothstep(0.3, 0.7, fract(vWorld.y * 21.0 - uTime * 0.7));',
        '  float scan = mix(1.0, 0.42 + 0.58 * line, uScan);',
        '  float band = smoothstep(0.07, 0.0, abs(vH - (fract(uTime * 0.21) * 1.5 - 0.25))) * 0.45 * uScan;',
        // 轻微随机闪烁
        '  float fl = 1.0 - uFlicker * (0.07 * hash(vec2(floor(uTime * 30.0), 1.0)) + 0.3 * step(0.955, hash(vec2(floor(uTime * 11.0), 7.0))));',
        '  float grain = 0.9 + 0.2 * hash(gl_FragCoord.xy + floor(uTime * 24.0));',
        '  float a = (0.15 + 0.8 * fres + band) * scan * fl * grain + edge * 0.9;',
        '  a *= (gl_FrontFacing ? 1.0 : 0.4) * mix(0.85, 1.2, vTint.r);',
        '  a *= uOpacity * (1.0 + uDissolve * 0.8);',
        '  vec3 col = mix(uColor, vTint, 0.6);',
        '  col = mix(col, vec3(0.85, 0.98, 1.0), clamp(fres * 0.55 + edge, 0.0, 1.0));',
        '  gl_FragColor = vec4(col, clamp(a, 0.0, 1.0));',
        '}'
      ].join('\n')
    });
  }

  /* ---------- 投影底座能量光环（平面，本地 XZ） ---------- */
  function ringMesh() {
    var g = new T.PlaneGeometry(2.8, 2.8); g.rotateX(-Math.PI / 2);
    var m = base({
      uniforms: { uTime: shared.uTime, uColor: shared.uColor, uPower: shared.uPower },
      vertexShader: 'varying vec2 vP; void main(){ vP = uv * 2.0 - 1.0; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: [
        'precision highp float;',
        'uniform float uTime, uPower; uniform vec3 uColor; varying vec2 vP;',
        'float ring(float r, float r0, float w){ return smoothstep(w, 0.0, abs(r - r0)); }',
        'void main(){',
        '  float r = length(vP); if (r > 1.0) discard;',
        '  float ang = atan(vP.y, vP.x) / 6.2831853 + 0.5;',
        '  float a = 0.0;',
        '  a += ring(r, 0.80, 0.022) * 0.95;',                                         // 主环
        '  a += ring(r, 0.80, 0.12) * 0.16;',                                          // 主环辉光
        '  a += ring(r, 0.68, 0.012) * step(0.35, fract(ang * 18.0 + uTime * 0.07)) * 0.6;', // 旋转虚线环
        '  a += ring(r, 0.92, 0.01) * step(0.82, fract(ang * 6.0 - uTime * 0.11)) * 0.9;',   // 反向弧段
        '  a += ring(r, 0.50, 0.008) * 0.35;',
        '  a += ring(r, 0.30, 0.008) * 0.3;',
        '  a += ring(r, 0.865, 0.02) * step(0.9, fract(ang * 72.0)) * 0.7;',           // 刻度
        '  float pulse = fract(uTime * 0.45);',
        '  a += ring(r, pulse * 0.8, 0.03) * (1.0 - pulse) * 0.6;',                    // 向外扩散的脉冲
        '  a += exp(-r * r * 5.0) * 0.22;',                                            // 中心光斑
        '  a *= smoothstep(1.0, 0.94, r) * uPower;',
        '  vec3 col = mix(uColor, vec3(0.9, 1.0, 1.0), clamp(a - 0.6, 0.0, 1.0));',
        '  gl_FragColor = vec4(col, clamp(a, 0.0, 1.0));',
        '}'
      ].join('\n')
    });
    var mesh = new T.Mesh(g, m); mesh.frustumCulled = false; return mesh;
  }

  /* ---------- 投影光束（开口圆台，营造体积感） ---------- */
  function beamMesh() {
    var g = new T.CylinderGeometry(1.22, 1.06, 2.7, 48, 1, true); g.translate(0, 1.35, 0);
    var m = base({
      uniforms: { uTime: shared.uTime, uColor: shared.uColor, uPower: shared.uPower },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: [
        'precision highp float;',
        'uniform float uTime, uPower; uniform vec3 uColor; varying vec2 vUv;',
        HASH,
        'void main(){',
        '  float f = pow(1.0 - vUv.y, 2.6);',
        '  float streak = 0.55 + 0.45 * hash(vec2(floor(vUv.x * 90.0), floor(uTime * 6.0)));',
        '  gl_FragColor = vec4(uColor, f * streak * 0.11 * uPower);',
        '}'
      ].join('\n')
    });
    var mesh = new T.Mesh(g, m); mesh.frustumCulled = false; return mesh;
  }

  /* ---------- 上升粒子 ---------- */
  function particles(count) {
    var seed = new Float32Array(count * 4), pos = new Float32Array(count * 3);
    for (var i = 0; i < count * 4; i++) seed[i] = Math.random();
    var g = new T.BufferGeometry();
    g.setAttribute('position', new T.BufferAttribute(pos, 3));
    g.setAttribute('aSeed', new T.BufferAttribute(seed, 4));
    var m = base({
      uniforms: { uTime: shared.uTime, uColor: shared.uColor, uPower: shared.uPower, uViewH: shared.uViewH },
      vertexShader: [
        'uniform float uTime, uViewH; attribute vec4 aSeed; varying float vA;',
        'void main(){',
        '  float t = fract(aSeed.x + uTime * (0.045 + aSeed.y * 0.09));',
        '  float ang = aSeed.z * 6.2831853 + uTime * (0.15 + aSeed.w * 0.25);',
        '  float rad = 0.12 + sqrt(aSeed.w) * 1.0 * (1.0 + t * 0.12);',
        '  vec3 p = vec3(cos(ang) * rad, t * 2.9, sin(ang) * rad);',
        '  vec4 mv = modelViewMatrix * vec4(p, 1.0);',
        '  gl_Position = projectionMatrix * mv;',
        '  float world = 0.016 + aSeed.y * 0.03;',
        '  gl_PointSize = max(1.0, world * projectionMatrix[1][1] * uViewH * 0.5 / max(0.1, -mv.z));',
        '  vA = sin(3.14159 * t) * (0.35 + 0.65 * aSeed.x);',
        '}'
      ].join('\n'),
      fragmentShader: [
        'precision highp float;',
        'uniform vec3 uColor; uniform float uPower; varying float vA;',
        'void main(){',
        '  float d = length(gl_PointCoord - 0.5);',
        '  float a = smoothstep(0.5, 0.05, d) * vA * 0.8 * min(uPower, 1.6);',
        '  gl_FragColor = vec4(mix(uColor, vec3(1.0), 0.35), a);',
        '}'
      ].join('\n')
    });
    var pts = new T.Points(g, m); pts.frustumCulled = false; return pts;
  }

  /* ---------- 投影台网格（Duo 下半屏，世界 XZ 平面） ---------- */
  function gridMesh() {
    var g = new T.PlaneGeometry(1, 1); g.rotateX(-Math.PI / 2);
    var m = base({
      uniforms: { uTime: shared.uTime, uColor: shared.uColor, uCenter: { value: new T.Vector2() }, uCell: { value: 0.3 } },
      vertexShader: 'varying vec3 vW; varying vec2 vUv; void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
      fragmentShader: [
        'precision highp float;',
        'uniform float uTime, uCell; uniform vec3 uColor; uniform vec2 uCenter; varying vec3 vW; varying vec2 vUv;',
        'void main(){',
        '  vec2 q = vW.xz / uCell;',
        '  vec2 fw = max(fwidth(q), vec2(1e-4));',
        '  vec2 gl2 = abs(fract(q - 0.5) - 0.5) / fw;',
        '  float line = 1.0 - min(min(gl2.x, gl2.y), 1.0);',
        '  float d = length(vW.xz - uCenter);',
        '  float fade = smoothstep(4.2, 0.6, d);',
        '  float edge = smoothstep(0.0, 0.06, vUv.x) * smoothstep(1.0, 0.94, vUv.x) * smoothstep(0.0, 0.05, vUv.y);',
        '  float sweep = smoothstep(0.25, 0.0, abs(d - fract(uTime * 0.18) * 4.5)) * 0.5;',
        '  gl_FragColor = vec4(uColor, line * fade * edge * (0.2 + sweep * 0.35));',
        '}'
      ].join('\n'),
      extensions: { derivatives: true }
    });
    var mesh = new T.Mesh(g, m); mesh.frustumCulled = false; return mesh;
  }

  window.HOLO = window.HOLO || {};
  window.HOLO.shared = shared;
  window.HOLO.hologramMaterial = hologramMaterial;
  window.HOLO.ringMesh = ringMesh;
  window.HOLO.beamMesh = beamMesh;
  window.HOLO.particles = particles;
  window.HOLO.gridMesh = gridMesh;
})();
