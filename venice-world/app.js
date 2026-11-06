/* Venezia Voxel — main application: renderer, sky/day-night, water, player, boats, crowds, UI. */
(function () {
  'use strict';
  const VW = window.VeniceWorld, B = VW.B;
  const CH = 32;
  const $ = (id) => document.getElementById(id);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const wrapAngle = (a) => { while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; return a; };
  const rr = (a, b) => a + Math.random() * (b - a);
  const pickOf = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const nextFrame = () => new Promise((r) => requestAnimationFrame(() => r()));
  const V3 = THREE.Vector3;
  const qs = new URLSearchParams(location.search);
  const isTouch = ('ontouchstart' in window) || matchMedia('(pointer:coarse)').matches;
  if (isTouch) document.body.classList.add('touch');

  /* ================= renderer / scene ================= */
  const canvas = $('gl');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  const wantShadow = qs.get('q') !== 'low' && !(isTouch && qs.get('shadow') !== '1');
  renderer.shadowMap.enabled = wantShadow;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0xaad4f6, 0.0036);
  const camera = new THREE.PerspectiveCamera(72, 1, 0.1, 3000);
  camera.rotation.order = 'YXZ';
  scene.add(camera);

  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize); resize();

  /* ================= state ================= */
  let world = null;
  const S = { mode: 'tour', time: parseFloat(qs.get('t')) || 17.8, auto: qs.get('auto') === '1', shadows: wantShadow, tourT: 0, hudT: 0, lampT: 0, held: 0, locked: false, elapsed: 0 };
  const keys = Object.create(null);
  let consoleInput = {};   /* My World 71: the console's Walk in (as in Santorini) */
  const consoleControls = {
    input: function (next) { consoleInput = Object.assign({}, next); },
    stop: function () { consoleInput = {}; for (const k in keys) keys[k] = false; joy.x = joy.y = 0; touchBtn.jump = touchBtn.down = false; player.vel.set(0, 0, 0); }
  };
  const player = { pos: new V3(128.5, 5, 102.5), vel: new V3(), yaw: -Math.PI / 2, pitch: 0.02, onGround: false, swim: false, fly: false, stepOff: 0, lastSpace: 0, climbT: 0 };
  const joy = { x: 0, y: 0 };
  const touchBtn = { jump: false, down: false };

  /* ================= lights ================= */
  const hemi = new THREE.HemisphereLight(0xcfe4ff, 0x6a5a48, 0.6);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffffff, 0.8);
  sun.castShadow = wantShadow;
  sun.shadow.mapSize.set(2048, 2048);
  const SH = 72;
  Object.assign(sun.shadow.camera, { left: -SH, right: SH, top: SH, bottom: -SH, near: 1, far: 420 });
  sun.shadow.camera.updateProjectionMatrix();
  sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.03;
  scene.add(sun, sun.target);
  const lampLights = [];
  for (let i = 0; i < 4; i++) { const l = new THREE.PointLight(0xffb464, 0, 16, 1.6); lampLights.push(l); scene.add(l); }

  /* ================= sky ================= */
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { uTop: { value: new THREE.Color() }, uHor: { value: new THREE.Color() }, uSunDir: { value: new V3(0, 1, 0) }, uSunCol: { value: new THREE.Color() } },
    vertexShader: 'varying vec3 vDir; void main(){ vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: [
      'uniform vec3 uTop; uniform vec3 uHor; uniform vec3 uSunDir; uniform vec3 uSunCol; varying vec3 vDir;',
      'void main(){ vec3 d = normalize(vDir); float h = d.y;',
      ' vec3 col = mix(uHor, uTop, pow(clamp(h,0.0,1.0), 0.5));',
      ' col = mix(col, uHor*0.85, smoothstep(0.0,-0.3,h));',
      ' float sd = max(dot(d, uSunDir), 0.0);',
      ' float vis = smoothstep(-0.25, 0.1, uSunDir.y);',
      ' col += uSunCol * (pow(sd, 5.0)*0.22 + pow(sd, 80.0)*0.35) * vis;',
      ' gl_FragColor = vec4(col, 1.0); }'
    ].join('\n')
  });
  const skyMesh = new THREE.Mesh(new THREE.SphereGeometry(1500, 24, 16), skyMat);
  skyMesh.renderOrder = -10; skyMesh.frustumCulled = false;
  scene.add(skyMesh);

  function pixelTex(size, fn) {
    const c = document.createElement('canvas'); c.width = c.height = size;
    const x = c.getContext('2d'); fn(x, size);
    const t = new THREE.CanvasTexture(c); t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.generateMipmaps = false;
    return t;
  }
  const sunTex = pixelTex(16, (x) => {
    x.fillStyle = 'rgba(255,230,150,.35)'; x.fillRect(0, 0, 16, 16);
    x.fillStyle = '#ffe9a0'; x.fillRect(2, 2, 12, 12);
    x.fillStyle = '#fffbe0'; x.fillRect(4, 4, 8, 8);
  });
  const moonTex = pixelTex(16, (x) => {
    x.fillStyle = '#dfe6f5'; x.fillRect(3, 3, 10, 10);
    x.fillStyle = '#c5cde0'; [[5, 5, 2, 2], [9, 7, 3, 2], [6, 10, 2, 2], [10, 10, 2, 2]].forEach((r) => x.fillRect(r[0], r[1], r[2], r[3]));
  });
  const sunSprite = new THREE.Mesh(new THREE.PlaneGeometry(90, 90), new THREE.MeshBasicMaterial({ map: sunTex, transparent: true, depthWrite: false, fog: false }));
  const moonSprite = new THREE.Mesh(new THREE.PlaneGeometry(70, 70), new THREE.MeshBasicMaterial({ map: moonTex, transparent: true, depthWrite: false, fog: false }));
  sunSprite.renderOrder = moonSprite.renderOrder = -9; sunSprite.frustumCulled = moonSprite.frustumCulled = false;
  scene.add(sunSprite, moonSprite);

  const starGeo = new THREE.BufferGeometry();
  {
    const n = 1400, p = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      let x, y, z, l;
      do { x = Math.random() * 2 - 1; y = Math.random(); z = Math.random() * 2 - 1; l = Math.hypot(x, y, z); } while (l > 1 || l < 0.2 || y < 0.04 * l);
      p[i * 3] = x / l * 1200; p[i * 3 + 1] = y / l * 1200; p[i * 3 + 2] = z / l * 1200;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(p, 3));
  }
  const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 2.2, sizeAttenuation: false, transparent: true, opacity: 0, depthWrite: false, fog: false });
  const stars = new THREE.Points(starGeo, starMat);
  stars.renderOrder = -8; stars.frustumCulled = false;
  scene.add(stars);

  // Minecraft-style blocky clouds
  const cloudMat = new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false });
  const cloudMesh = (function () {
    const N = 24, CS = 16, TILE = N * CS;
    const hv = (x, y) => { x = ((x % N) + N) % N; y = ((y % N) + y * 0 + N) % N; let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
    const vn = (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi; const a = hv(xi, yi), b = hv(xi + 1, yi), c = hv(xi, yi + 1), d = hv(xi + 1, yi + 1); return lerp(lerp(a, b, fx), lerp(c, d, fx), fy); };
    const cells = [];
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const v = vn(i / 4, j / 4) * 0.7 + hv(i, j) * 0.3; if (v > 0.6) cells.push([i, j]); }
    const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(CS, 5, CS), cloudMat, cells.length * 9);
    const m = new THREE.Matrix4(); let k = 0;
    for (let tz = -1; tz <= 1; tz++) for (let tx = -1; tx <= 1; tx++) for (const c of cells) {
      m.makeTranslation(tx * TILE + c[0] * CS, 0, tz * TILE + c[1] * CS); mesh.setMatrixAt(k++, m);
    }
    mesh.instanceMatrix.needsUpdate = true; mesh.frustumCulled = false; mesh.userData.TILE = TILE;
    return mesh;
  })();
  cloudMesh.position.y = 125;
  scene.add(cloudMesh);

  // distant sea floor beyond the generated map
  const farFloor = new THREE.Mesh(new THREE.PlaneGeometry(6000, 6000), new THREE.MeshLambertMaterial({ color: 0x8a8060 }));
  farFloor.rotation.x = -Math.PI / 2; farFloor.position.y = 0.9;
  scene.add(farFloor);

  /* ================= water ================= */
  const waterMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: {
      uTime: { value: 0 }, uSunDir: { value: new V3(0, 1, 0) }, uSunCol: { value: new THREE.Color(1, 1, 1) },
      uSky: { value: new THREE.Color() }, uDeep: { value: new THREE.Color() }, uShallow: { value: new THREE.Color() },
      uFog: { value: new THREE.Color() }, uFogD: { value: 0.0036 }, uNight: { value: 0 }
    },
    vertexShader: 'varying vec3 vW; varying float vD; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; vec4 mv = viewMatrix * w; vD = -mv.z; gl_Position = projectionMatrix * mv; }',
    fragmentShader: [
      'uniform float uTime; uniform vec3 uSunDir; uniform vec3 uSunCol; uniform vec3 uSky; uniform vec3 uDeep; uniform vec3 uShallow; uniform vec3 uFog; uniform float uFogD; uniform float uNight;',
      'varying vec3 vW; varying float vD;',
      'float h21(vec2 p){ p = fract(p*vec2(123.34,456.21)); p += dot(p,p+45.32); return fract(p.x*p.y); }',
      'void main(){',
      ' vec2 p = vW.xz*2.0;',
      ' float t1 = floor(uTime*1.6);',
      ' vec2 c1 = floor(p + vec2(uTime*0.55, uTime*0.30));',
      ' vec2 c2 = floor(p*0.5 + vec2(-uTime*0.25, uTime*0.4) + 17.0);',
      ' float n1 = h21(c1 + t1*0.37); float n2 = h21(c2 + 31.7);',
      ' vec3 N = normalize(vec3((n1-0.5)*0.34, 1.0, (n2-0.5)*0.34));',
      ' vec3 V = normalize(cameraPosition - vW);',
      ' float fr = pow(1.0 - max(dot(N,V),0.0), 3.0);',
      ' vec3 base = mix(uDeep, uShallow, n1*0.55 + n2*0.25 + 0.1);',
      ' vec3 col = mix(base, uSky, fr*0.8);',
      ' vec3 R = reflect(-uSunDir, N);',
      ' float spec = pow(max(dot(R,V),0.0), 110.0);',
      ' col += uSunCol * spec * 1.6;',
      ' col += vec3(0.16) * step(0.94, n1) * (1.0 - uNight*0.85);',
      ' float a = mix(0.74, 0.95, fr);',
      ' float fog = 1.0 - exp(-uFogD*uFogD*vD*vD);',
      ' col = mix(col, uFog, fog); a = mix(a, 1.0, fog);',
      ' gl_FragColor = vec4(col, a); }'
    ].join('\n')
  });
  const waterMesh = new THREE.Mesh(new THREE.PlaneGeometry(4000, 4000), waterMat);
  waterMesh.rotation.x = -Math.PI / 2; waterMesh.position.y = VW.WATER_Y; waterMesh.renderOrder = 5; waterMesh.frustumCulled = false;
  scene.add(waterMesh);

  /* ================= time of day ================= */
  const KEYS = [
    [0, 0x050818, 0x0e1535, 0x04101c, 0x0a2438],
    [5, 0x0a1232, 0x28285a, 0x061424, 0x123046],
    [6.3, 0x3a5a9a, 0xf09a70, 0x0e3a4a, 0x2a6a74],
    [8, 0x5aa2e4, 0xc2dff2, 0x0f5260, 0x3a9a9a],
    [12, 0x3a8ce8, 0xaad4f6, 0x0c5a6a, 0x40b0a8],
    [16.5, 0x4a96e0, 0xc6dcf0, 0x0e5666, 0x3aa0a0],
    [18, 0x4a7cc8, 0xf8b878, 0x124858, 0x3a8a86],
    [19.2, 0x2a3270, 0xe2745c, 0x0a2a3e, 0x2a5668],
    [20.6, 0x0e1438, 0x35305a, 0x061a2a, 0x123446],
    [24, 0x050818, 0x0e1535, 0x04101c, 0x0a2438]
  ];
  const cTop = new THREE.Color(), cHor = new THREE.Color(), cDeep = new THREE.Color(), cShal = new THREE.Color(), cTmp = new THREE.Color();
  function sampleKey(t, idx, out) {
    let i = 0; while (i < KEYS.length - 2 && t >= KEYS[i + 1][0]) i++;
    const a = KEYS[i], b = KEYS[i + 1], f = clamp((t - a[0]) / (b[0] - a[0]), 0, 1);
    out.setHex(a[idx]); out.lerp(cTmp.setHex(b[idx]), f);
  }
  const sunDir = new V3(), lightDir = new V3();
  const sunCol = new THREE.Color(), warmCol = new THREE.Color(1.0, 0.55, 0.28), whiteCol = new THREE.Color(1.0, 0.97, 0.9), moonCol = new THREE.Color(0.5, 0.62, 1.0);
  const winDay = new THREE.Color(0.2, 0.3, 0.42), winNight = new THREE.Color(1.0, 0.8, 0.45);
  let nightF = 0, dayF = 1;
  const matWorld = new THREE.MeshLambertMaterial({ vertexColors: true });
  const matGlow = new THREE.MeshBasicMaterial({ vertexColors: true });

  function updateSky(cam) {
    const t = window.MinestOiaEditor && window.MinestOiaEditor.active && window.MinestOiaEditor.daylight ? 12 : ((S.time % 24) + 24) % 24;
    const a = (t - 5.5) / 14 * Math.PI;
    sunDir.set(Math.cos(a), Math.sin(a), 0.3).normalize();
    const e = sunDir.y;
    dayF = smooth(-0.08, 0.35, e);
    nightF = 1 - smooth(-0.12, 0.14, e);
    sampleKey(t, 1, cTop); sampleKey(t, 2, cHor); sampleKey(t, 3, cDeep); sampleKey(t, 4, cShal);
    // sun / moon light
    sunCol.copy(warmCol).lerp(whiteCol, smooth(0.04, 0.5, e));
    if (e > -0.02) {
      lightDir.copy(sunDir); sun.color.copy(sunCol); sun.intensity = 0.06 + 0.82 * smooth(-0.02, 0.32, e);
    } else {
      lightDir.copy(sunDir).negate(); sun.color.copy(moonCol); sun.intensity = 0.42 * smooth(0.0, 0.25, -e);
    }
    hemi.color.setRGB(lerp(0.2, 0.74, dayF), lerp(0.26, 0.85, dayF), lerp(0.46, 1.0, dayF)).lerp(cHor, 0.22);
    hemi.groundColor.setRGB(lerp(0.07, 0.42, dayF), lerp(0.07, 0.38, dayF), lerp(0.12, 0.33, dayF));
    hemi.intensity = lerp(0.5, 0.62, dayF);
    // sky uniforms
    skyMat.uniforms.uTop.value.copy(cTop); skyMat.uniforms.uHor.value.copy(cHor);
    skyMat.uniforms.uSunDir.value.copy(sunDir); skyMat.uniforms.uSunCol.value.copy(sunCol);
    const under = cam.y < VW.WATER_Y - 0.05;
    if (under) { scene.fog.color.setRGB(0.07, 0.28, 0.4).multiplyScalar(0.3 + dayF * 0.7); scene.fog.density = 0.07; }
    else { scene.fog.color.copy(cHor); scene.fog.density = 0.0036; }
    renderer.setClearColor(scene.fog.color);
    waterMesh.visible = !under;
    const wu = waterMat.uniforms;
    wu.uSunDir.value.copy(lightDir); wu.uSunCol.value.copy(sun.color).multiplyScalar(sun.intensity > 0.2 ? 1 : 0.4);
    wu.uSky.value.copy(cHor).lerp(cTop, 0.35); wu.uDeep.value.copy(cDeep); wu.uShallow.value.copy(cShal);
    wu.uFog.value.copy(cHor); wu.uFogD.value = scene.fog.density; wu.uNight.value = nightF;
    // celestial sprites & stars follow the camera
    sunSprite.position.copy(cam).addScaledVector(sunDir, 900); sunSprite.lookAt(cam);
    moonSprite.position.copy(cam).addScaledVector(sunDir, -900); moonSprite.lookAt(cam);
    sunSprite.visible = e > -0.12; moonSprite.visible = e < 0.1;
    skyMesh.position.copy(cam); stars.position.copy(cam);
    starMat.opacity = clamp(nightF * 1.1 - 0.1, 0, 0.95);
    cloudMesh.visible = !(window.MinestOiaEditor && window.MinestOiaEditor.active);   /* 71 clouds */
    // clouds
    const TILE = cloudMesh.userData.TILE, drift = S.elapsed * 2.2;
    cloudMesh.position.x = Math.floor((cam.x - drift) / TILE) * TILE + drift;
    cloudMesh.position.z = Math.floor(cam.z / TILE) * TILE;
    cloudMat.color.setRGB(1, 1, 1).lerp(cHor, 0.3 * (1 - dayF) + 0.1).multiplyScalar(0.2 + dayF * 0.8);
    // windows glow at night
    matGlow.color.copy(winDay).lerp(winNight, nightF);
    // lamp lights
    const ni = nightF;
    lampLights.forEach((l) => { l.intensity = 1.7 * ni; });
  }

  /* ================= world build ================= */
  const chunks = [];
  const worldGroup = new THREE.Group(); scene.add(worldGroup);
  let CX = 0, CZ = 0;
  const dirty = new Set();

  function meshChunk(cx, cz) {
    const i = cx + cz * CX, rec = chunks[i] || (chunks[i] = {});
    const g = VeniceMesher.buildChunk(world, cx, cz, CH);
    if (rec.opaque) { worldGroup.remove(rec.opaque); rec.opaque.geometry.dispose(); rec.opaque = null; }
    if (rec.glow) { worldGroup.remove(rec.glow); rec.glow.geometry.dispose(); rec.glow = null; }
    if (g.opaque) { const m = new THREE.Mesh(g.opaque, matWorld); m.castShadow = m.receiveShadow = true; rec.opaque = m; worldGroup.add(m); }
    if (g.glow) { const m = new THREE.Mesh(g.glow, matGlow); m.castShadow = true; rec.glow = m; worldGroup.add(m); }
  }
  function markDirty(x, z) {
    const cx = Math.floor(x / CH), cz = Math.floor(z / CH);
    dirty.add(cx + cz * CX);
    const lx = x - cx * CH, lz = z - cz * CH;
    if (lx === 0 && cx > 0) dirty.add(cx - 1 + cz * CX);
    if (lx === CH - 1 && cx < CX - 1) dirty.add(cx + 1 + cz * CX);
    if (lz === 0 && cz > 0) dirty.add(cx + (cz - 1) * CX);
    if (lz === CH - 1 && cz < CZ - 1) dirty.add(cx + (cz + 1) * CX);
  }

  const solidAt = (x, y, z) => {
    if (y < 0) return true;
    if (x < 0 || x >= world.W || z < 0 || z >= world.D || y >= world.H) return false;
    return world.blocks[x + world.W * (z + world.D * y)] !== 0;
  };
  function groundY(x, z, fromY) {
    for (let y = Math.min(world.H - 1, fromY); y >= 0; y--) if (solidAt(Math.floor(x), y, Math.floor(z))) return y + 1;
    return 1;
  }

  /* ================= shared mesh helpers ================= */
  const unitBox = new THREE.BoxGeometry(1, 1, 1);
  const matCache = new Map();
  const lam = (hex) => { let m = matCache.get(hex); if (!m) { m = new THREE.MeshLambertMaterial({ color: hex }); matCache.set(hex, m); } return m; };
  function bx(parent, w, h, d, color, x, y, z, shadow) {
    const m = new THREE.Mesh(unitBox, typeof color === 'number' ? lam(color) : color);
    m.scale.set(w, h, d); m.position.set(x, y, z); m.castShadow = shadow !== false; m.receiveShadow = false;
    parent.add(m); return m;
  }
  const stripeMat = new THREE.MeshLambertMaterial({
    map: pixelTex(8, (x) => { for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? '#f4f4f0' : '#1b2a5c'; x.fillRect(0, i, 8, 1); } })
  });

  /* ================= boats ================= */
  const boats = [];
  const gondolas = [];

  function makeGondola(withPassengers) {
    const g = new THREE.Group();
    const hull = 0x101014, trim = 0x3a2414, silver = 0xa9aeb6, red = 0xa01820, gold = 0xd9b240;
    bx(g, 1.3, 0.45, 5.2, hull, 0, 0.22, 0.2);
    bx(g, 0.9, 0.4, 1.5, hull, 0, 0.30, 3.3); bx(g, 0.5, 0.4, 1.1, hull, 0, 0.48, 4.35);
    bx(g, 0.9, 0.4, 1.3, hull, 0, 0.30, -3.2); bx(g, 0.5, 0.4, 0.9, hull, 0, 0.50, -4.2);
    bx(g, 0.12, 0.12, 5.2, trim, 0.66, 0.52, 0.2); bx(g, 0.12, 0.12, 5.2, trim, -0.66, 0.52, 0.2);
    bx(g, 0.14, 1.0, 0.5, silver, 0, 1.0, 4.65);
    for (let i = 0; i < 3; i++) bx(g, 0.12, 0.09, 0.2, silver, 0, 0.8 + i * 0.22, 4.95);
    bx(g, 0.14, 0.2, 0.3, silver, 0, 1.58, 4.72);
    bx(g, 0.14, 0.8, 0.3, hull, 0, 0.95, -4.5);
    bx(g, 1.0, 0.22, 1.5, red, 0, 0.6, 0.5); bx(g, 1.0, 0.55, 0.2, red, 0, 0.95, -0.3);
    bx(g, 0.1, 0.3, 1.5, gold, 0.55, 0.8, 0.5); bx(g, 0.1, 0.3, 1.5, gold, -0.55, 0.8, 0.5);
    bx(g, 0.9, 0.04, 1.4, 0x6b4a2a, 0, 0.47, -2.2);
    // gondolier
    const man = new THREE.Group(); man.position.set(0, 0.45, -3.3); g.add(man);
    bx(man, 0.3, 0.55, 0.22, 0x15151a, 0, 0.275, 0);
    bx(man, 0.46, 0.62, 0.28, stripeMat, 0, 0.86, 0);
    bx(man, 0.3, 0.3, 0.3, 0xe0b48c, 0, 1.32, 0);
    bx(man, 0.62, 0.05, 0.62, 0xe8d49a, 0, 1.5, 0); bx(man, 0.34, 0.14, 0.34, 0xe8d49a, 0, 1.59, 0); bx(man, 0.36, 0.05, 0.36, 0xc02020, 0, 1.54, 0);
    const armL = bx(man, 0.12, 0.5, 0.14, stripeMat, -0.3, 0.88, 0.1), armR = bx(man, 0.12, 0.5, 0.14, stripeMat, 0.3, 0.88, 0.1);
    armL.rotation.x = armR.rotation.x = -0.7;
    // oar
    const oar = new THREE.Group(); oar.position.set(0.8, 1.0, -3.7); g.add(oar);
    bx(oar, 0.07, 0.07, 3.8, 0x6b4a2a, 0, 0, -0.9);
    bx(oar, 0.3, 0.05, 0.9, 0x6b4a2a, 0, 0, -2.75);
    bx(g, 0.1, 0.5, 0.1, trim, 0.8, 0.72, -3.7);
    if (withPassengers) {
      const n = 1 + Math.floor(Math.random() * 2);
      for (let i = 0; i < n; i++) {
        const px = n === 1 ? 0 : (i ? 0.25 : -0.25);
        const shirt = pickOf([0xd04040, 0x3a6ad0, 0xf0e0b0, 0x40a070, 0xe0a030, 0xb060c0]);
        bx(g, 0.34, 0.5, 0.24, shirt, px, 0.96, 0.55);
        bx(g, 0.26, 0.26, 0.26, pickOf([0xe0b48c, 0xc99a74, 0xf0c8a0, 0x8d5a3a]), px, 1.34, 0.55);
        if (Math.random() < 0.5) bx(g, 0.3, 0.1, 0.3, pickOf([0x222222, 0x7a3a1a, 0xe8d070, 0x2a1a10]), px, 1.5, 0.55);
      }
    }
    const root = new THREE.Group(); root.add(g);
    return { root, inner: g, oar, kind: 'gondola' };
  }

  function makeVaporetto() {
    const g = new THREE.Group();
    bx(g, 3.2, 0.9, 11, 0xf2f2ee, 0, 0.45, 0);
    bx(g, 2.5, 0.8, 1.6, 0xf2f2ee, 0, 0.45, 6.2); bx(g, 1.6, 0.7, 1.2, 0xf2f2ee, 0, 0.5, 7.4);
    bx(g, 3.24, 0.22, 11.04, 0x1f4ea8, 0, 0.62, 0);
    bx(g, 3.26, 0.1, 11.06, 0xe0b020, 0, 0.82, 0);
    bx(g, 2.8, 1.3, 7.6, 0xf6f6f2, 0, 1.55, -0.6);
    bx(g, 2.86, 0.55, 7.2, 0x24344c, 0, 1.7, -0.6);
    bx(g, 2.9, 0.1, 8.0, 0xdadad6, 0, 2.25, -0.6);
    bx(g, 2.2, 0.8, 1.6, 0xf6f6f2, 0, 1.45, 4.0); bx(g, 2.0, 0.4, 0.2, 0x24344c, 0, 1.7, 4.85);
    bx(g, 0.9, 0.5, 0.2, 0xf0c020, 0, 2.6, -0.6);
    bx(g, 0.3, 0.9, 0.3, 0x2a2a2e, 0.9, 2.7, -4.2);
    for (let i = -3; i <= 3; i++) { bx(g, 0.1, 0.3, 0.3, 0xdddddd, 1.62, 1.05, i * 1.4); bx(g, 0.1, 0.3, 0.3, 0xdddddd, -1.62, 1.05, i * 1.4); }
    const root = new THREE.Group(); root.add(g);
    return { root, inner: g, kind: 'vaporetto' };
  }

  const sailGeo = (function () {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0, 0, 0, 0, 4.4, 0, 0, 0, -2.4]), 3));
    g.computeVertexNormals(); return g;
  })();
  function makeSailboat(color) {
    const g = new THREE.Group();
    bx(g, 1.6, 0.6, 4.2, 0x7a5230, 0, 0.3, 0); bx(g, 1.0, 0.5, 1.2, 0x7a5230, 0, 0.35, 2.6);
    bx(g, 1.62, 0.12, 4.22, 0xf0f0ea, 0, 0.62, 0);
    bx(g, 0.14, 5.2, 0.14, 0x4a3320, 0, 3.0, 0.4);
    const sail = new THREE.Mesh(sailGeo, new THREE.MeshLambertMaterial({ color, side: THREE.DoubleSide }));
    sail.position.set(0, 1.0, 0.45); sail.castShadow = true; g.add(sail);
    const jib = new THREE.Mesh(sailGeo, new THREE.MeshLambertMaterial({ color: 0xf5f5f0, side: THREE.DoubleSide }));
    jib.scale.set(1, 0.8, -0.6); jib.position.set(0, 1.0, 0.5); jib.rotation.y = Math.PI; jib.castShadow = true; g.add(jib);
    const root = new THREE.Group(); root.add(g);
    return { root, inner: g, kind: 'sail' };
  }

  function addRoute(points, kind, opts) {
    const curve = new THREE.CatmullRomCurve3(points.map((p) => new V3(p[0], 0, p[1])), false, 'centripetal');
    const L = curve.getLength();
    const b = kind === 'gondola' ? makeGondola(opts.pass) : kind === 'vaporetto' ? makeVaporetto() : makeSailboat(opts.color || 0xf5f5f0);
    b.curve = curve; b.L = L; b.a = opts.a == null ? 8 : opts.a; b.b = L - (opts.b == null ? 10 : opts.b);
    b.speed = opts.speed || 3; b.u0 = opts.u0 || 0; b.lat = opts.lat == null ? 2.2 : opts.lat; b.phase = Math.random() * 6.28;
    b.yaw = 0; b.pos = new V3(); b.dir = 1; b.heading = 0;
    scene.add(b.root); boats.push(b);
    if (kind === 'gondola') gondolas.push(b);
    return b;
  }
  function addMoored() {
    for (const m of world.moorings) {
      const b = makeGondola(Math.random() < 0.3);
      b.root.position.set(m.x, VW.WATER_Y - 0.15, m.z);
      b.root.rotation.y = Math.PI / 2 + (Math.random() - 0.5) * 0.06;
      b.phase = Math.random() * 6.28; b.moored = true; b.oar.rotation.x = -0.9;
      scene.add(b.root); boats.push(b);
    }
  }
  const _p = new V3(), _t = new V3();
  function updateBoats(dt, time) {
    for (const b of boats) {
      if (b.moored) {
        b.inner.position.y = Math.sin(time * 1.4 + b.phase) * 0.035;
        b.inner.rotation.z = Math.sin(time * 1.1 + b.phase) * 0.025;
        continue;
      }
      const span = b.b - b.a;
      const u = (b.u0 + time * b.speed) % (2 * span);
      const ph = u / span;            // 0..2
      const p = ph < 1 ? ph : 2 - ph;
      const f = p - 0.5 * Math.sin(2 * Math.PI * p) / (2 * Math.PI);
      const s = b.a + span * f;
      const dir = ph < 1 ? 1 : -1;
      const sw = Math.sin(Math.PI * ph);
      const lat = b.lat * clamp(sw * 6, -1, 1);
      const uu = clamp(s / b.L, 0, 1);
      b.curve.getPointAt(uu, _p); b.curve.getTangentAt(uu, _t);
      const nx = -_t.z, nz = _t.x;
      const px = _p.x + nx * lat, pz = _p.z + nz * lat;
      const target = Math.atan2(_t.x * dir, _t.z * dir);
      if (!b.init) { b.heading = target; b.init = true; }
      b.heading += wrapAngle(target - b.heading) * (1 - Math.exp(-2.2 * dt));
      b.pos.set(px, VW.WATER_Y - (b.kind === 'sail' ? 0.25 : b.kind === 'vaporetto' ? 0.3 : 0.15), pz);
      b.root.position.copy(b.pos); b.root.rotation.y = b.heading;
      b.inner.position.y = Math.sin(time * 1.6 + b.phase) * 0.03;
      b.inner.rotation.z = Math.sin(time * 1.2 + b.phase) * 0.02 + (b.kind === 'sail' ? 0.08 : 0);
      b.inner.rotation.x = Math.sin(time * 1.9 + b.phase) * 0.012;
      if (b.oar) {
        const w = time * 1.6 + b.phase;
        b.oar.rotation.y = 0.32 * Math.sin(w); b.oar.rotation.x = -0.36 + 0.09 * Math.sin(w * 2);
      }
    }
  }

  /* ================= people (instanced voxel villagers) ================= */
  const NPC_N = 100;
  const npcs = [];
  const PART = {
    body: { w: 0.52, h: 0.72, d: 0.3 }, head: { w: 0.36, h: 0.36, d: 0.36 }, hair: { w: 0.4, h: 0.14, d: 0.4 },
    leg: { w: 0.22, h: 0.62, d: 0.24 }, arm: { w: 0.15, h: 0.62, d: 0.2 }
  };
  let npcMeshes = null;
  const dummy = new THREE.Object3D();
  const SHIRTS = [0xc03a2e, 0x2f5fb8, 0xf1e4c0, 0x2f8a5e, 0xe3a72f, 0x6f3fa0, 0x1f1f26, 0xd96aa0, 0x3aa5b8, 0xf5f5f0, 0xb0602c];
  const PANTS = [0x20222c, 0x3a3a46, 0x5a4636, 0x2a3a5c, 0x7a7466];
  const SKINS = [0xf0c8a0, 0xe0b48c, 0xc99a74, 0x8d5a3a, 0xf5d6b8];
  const HAIRS = [0x222018, 0x4a3320, 0x8a5a2a, 0xd8c070, 0x888888, 0x111111];

  function makeNPCMeshes() {
    const mk = (p, name) => { const m = new THREE.InstancedMesh(unitBox, new THREE.MeshLambertMaterial({ color: 0xffffff }), NPC_N); m.castShadow = true; m.frustumCulled = false; m.userData.name = name; scene.add(m); return m; };
    npcMeshes = { body: mk(PART.body), head: mk(PART.head), hair: mk(PART.hair), legL: mk(PART.leg), legR: mk(PART.leg), armL: mk(PART.arm), armR: mk(PART.arm) };
    const c = new THREE.Color();
    npcs.forEach((n, i) => {
      npcMeshes.body.setColorAt(i, c.setHex(n.shirt)); npcMeshes.armL.setColorAt(i, c); npcMeshes.armR.setColorAt(i, c);
      npcMeshes.head.setColorAt(i, c.setHex(n.skin)); npcMeshes.hair.setColorAt(i, c.setHex(n.hair));
      npcMeshes.legL.setColorAt(i, c.setHex(n.pants)); npcMeshes.legR.setColorAt(i, c);
    });
    Object.values(npcMeshes).forEach((m) => { m.instanceColor.needsUpdate = true; });
  }

  function surfaceAt(x, z, refY) {
    for (const c of [refY, refY + 1, refY - 1]) {
      if (c < world.BASE) continue;
      if (solidAt(x, c - 1, z) && !solidAt(x, c, z) && !solidAt(x, c + 1, z)) return c;
    }
    return -1;
  }
  const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  function spawnNPCs() {
    let tries = 0;
    while (npcs.length < NPC_N && tries++ < 20000) {
      const crowd = npcs.length < NPC_N * 0.5;
      const x = crowd ? Math.floor(rr(104, 160)) : Math.floor(rr(4, world.W - 4));
      const z = crowd ? Math.floor(rr(94, 136)) : Math.floor(rr(4, world.D - 4));
      if (!world.land[x + world.W * z]) continue;
      const y = surfaceAt(x, z, world.BASE);
      if (y < 0) continue;
      npcs.push({
        x, z, y, tx: x, tz: z, ty: y, p: 1, dx: 1, dz: 0, speed: rr(1.0, 1.7), phase: Math.random() * 6.28, wait: Math.random() * 3,
        shirt: pickOf(SHIRTS), pants: pickOf(PANTS), skin: pickOf(SKINS), hair: pickOf(HAIRS),
        px: x + 0.5, pz: z + 0.5, py: y, yaw: Math.random() * 6.28, h: rr(0.9, 1.08)
      });
    }
  }
  function npcPickNext(n) {
    const opts = [];
    for (const d of DIRS) {
      const nx = n.x + d[0], nz = n.z + d[1];
      const y = surfaceAt(nx, nz, n.y);
      if (y < 0) continue;
      let w = 1;
      if (d[0] === n.dx && d[1] === n.dz) w = 5; else if (d[0] === -n.dx && d[1] === -n.dz) w = 0.15;
      opts.push([nx, nz, y, w, d]);
    }
    if (!opts.length) { n.wait = 1; return; }
    let tot = 0; opts.forEach((o) => (tot += o[3]));
    let r = Math.random() * tot, o = opts[0];
    for (const c of opts) { r -= c[3]; if (r <= 0) { o = c; break; } }
    n.tx = o[0]; n.tz = o[1]; n.ty = o[2]; n.dx = o[4][0]; n.dz = o[4][1]; n.p = 0;
    if (Math.random() < 0.04) n.wait = rr(1, 4);
  }
  function setPart(mesh, i, w, h, d, x, y, z, rx, ry) {
    dummy.position.set(x, y, z); dummy.rotation.set(rx, ry, 0, 'YXZ'); dummy.scale.set(w, h, d); dummy.updateMatrix(); mesh.setMatrixAt(i, dummy.matrix);
  }
  function updateNPCs(dt, time) {
    if (!npcMeshes) return;
    for (let i = 0; i < npcs.length; i++) {
      const n = npcs[i];
      let walking = false;
      if (n.wait > 0) n.wait -= dt;
      else {
        if (n.p >= 1) { n.x = n.tx; n.z = n.tz; n.y = n.ty; npcPickNext(n); }
        if (n.p < 1) { n.p = Math.min(1, n.p + dt * n.speed); walking = true; }
      }
      const px = lerp(n.x, n.tx, n.p) + 0.5, pz = lerp(n.z, n.tz, n.p) + 0.5, py = lerp(n.y, n.ty, n.p);
      if (walking) n.yaw += wrapAngle(Math.atan2(n.dx, n.dz) - n.yaw) * (1 - Math.exp(-8 * dt));
      const sw = walking ? Math.sin(time * n.speed * 7 + n.phase) * 0.7 : 0;
      const yaw = n.yaw, s = Math.sin(yaw), c = Math.cos(yaw), k = n.h;
      const loc = (lx, ly, lz) => [px + lx * c + lz * s, py + ly * k, pz - lx * s + lz * c];
      let q;
      q = loc(0, 0.62 + 0.36, 0); setPart(npcMeshes.body, i, 0.52, 0.72 * k, 0.3, q[0], q[1], q[2], 0, yaw);
      q = loc(0, 1.34 + 0.18, 0); setPart(npcMeshes.head, i, 0.36, 0.36 * k, 0.36, q[0], q[1], q[2], 0, yaw);
      q = loc(0, 1.34 + 0.34, 0); setPart(npcMeshes.hair, i, 0.4, 0.14 * k, 0.4, q[0], q[1], q[2], 0, yaw);
      const limb = (mesh, lx, ly, len, ang, w, d) => {
        const cy = -len / 2 * Math.cos(ang), cz = -len / 2 * Math.sin(ang);
        const qq = loc(lx, ly + cy, cz);
        setPart(mesh, i, w, len * k, d, qq[0], qq[1], qq[2], ang, yaw);
      };
      limb(npcMeshes.legL, -0.13, 0.62, 0.62, sw, 0.22, 0.24); limb(npcMeshes.legR, 0.13, 0.62, 0.62, -sw, 0.22, 0.24);
      limb(npcMeshes.armL, -0.34, 1.32, 0.62, -sw * 0.9, 0.15, 0.2); limb(npcMeshes.armR, 0.34, 1.32, 0.62, sw * 0.9, 0.15, 0.2);
      n.px = px; n.pz = pz; n.py = py;
    }
    Object.values(npcMeshes).forEach((m) => { m.instanceMatrix.needsUpdate = true; });
  }

  /* ================= birds ================= */
  const gulls = [], pigeons = [];
  function makeGull() {
    const g = new THREE.Group(), w = 0xf4f4f2;
    bx(g, 0.26, 0.2, 0.7, w, 0, 0, 0, false); bx(g, 0.18, 0.18, 0.2, w, 0, 0.06, 0.42, false); bx(g, 0.07, 0.05, 0.16, 0xe8a020, 0, 0.04, 0.56, false);
    bx(g, 0.2, 0.05, 0.3, 0x909498, 0, 0.0, -0.45, false);
    const wl = new THREE.Group(), wr = new THREE.Group(); wl.position.set(-0.12, 0.05, 0.05); wr.position.set(0.12, 0.05, 0.05);
    bx(wl, 0.9, 0.04, 0.34, 0xe8e8e6, -0.45, 0, 0, false); bx(wl, 0.4, 0.04, 0.3, 0x45484d, -1.05, 0, 0, false);
    bx(wr, 0.9, 0.04, 0.34, 0xe8e8e6, 0.45, 0, 0, false); bx(wr, 0.4, 0.04, 0.3, 0x45484d, 1.05, 0, 0, false);
    g.add(wl, wr); g.userData = { wl, wr };
    return g;
  }
  function makePigeon() {
    const g = new THREE.Group(), c = 0x6a6e78;
    bx(g, 0.2, 0.17, 0.34, c, 0, 0.17, 0, false); bx(g, 0.12, 0.12, 0.12, 0x585c68, 0, 0.3, 0.2, false); bx(g, 0.06, 0.05, 0.06, 0xd8a050, 0, 0.29, 0.28, false);
    bx(g, 0.1, 0.05, 0.16, 0x4a4e58, 0, 0.17, -0.22, false); bx(g, 0.14, 0.06, 0.08, 0x3a9a8a, 0, 0.25, 0.14, false);
    bx(g, 0.04, 0.1, 0.04, 0xc05050, -0.05, 0.05, 0, false); bx(g, 0.04, 0.1, 0.04, 0xc05050, 0.05, 0.05, 0, false);
    const wl = new THREE.Group(), wr = new THREE.Group(); wl.position.set(-0.1, 0.2, 0); wr.position.set(0.1, 0.2, 0);
    bx(wl, 0.4, 0.03, 0.22, 0x7a7e88, -0.2, 0, 0, false); bx(wr, 0.4, 0.03, 0.22, 0x7a7e88, 0.2, 0, 0, false);
    g.add(wl, wr); g.userData = { wl, wr };
    return g;
  }
  function spawnBirds() {
    for (let i = 0; i < 14; i++) {
      const g = makeGull(); scene.add(g);
      gulls.push({ g, cx: rr(60, 190), cz: rr(60, 175), R: rr(18, 55), h: rr(24, 60), sp: rr(0.18, 0.4) * (Math.random() < 0.5 ? 1 : -1), ph: rr(0, 6.28), flap: rr(6, 9) });
    }
    for (let i = 0; i < 34; i++) {
      const g = makePigeon(); scene.add(g);
      const x = rr(114, 158), z = rr(96, 110);
      g.position.set(x, world.BASE, z);
      pigeons.push({ g, x, z, y: world.BASE, tx: x, tz: z, state: 'walk', wait: rr(0, 3), t: 0, dur: 1, sx: 0, sz: 0, ex: 0, ez: 0, arc: 6, peck: Math.random() * 6 });
    }
  }
  function updateBirds(dt, time) {
    for (const b of gulls) {
      const a = b.ph + time * b.sp;
      const x = b.cx + Math.cos(a) * b.R, z = b.cz + Math.sin(a) * b.R;
      b.g.position.set(x, b.h + Math.sin(time * 0.7 + b.ph) * 2.2, z);
      b.g.rotation.y = Math.atan2(-Math.sin(a) * Math.sign(b.sp), Math.cos(a) * Math.sign(b.sp));
      b.g.rotation.z = -0.25 * Math.sign(b.sp);
      const f = Math.sin(time * b.flap + b.ph) * 0.45;
      b.g.userData.wl.rotation.z = f; b.g.userData.wr.rotation.z = -f;
    }
    const pp = player.pos;
    for (const b of pigeons) {
      const g = b.g;
      if (b.state === 'fly') {
        b.t += dt / b.dur;
        const t = Math.min(1, b.t);
        g.position.set(lerp(b.sx, b.ex, t), world.BASE + Math.sin(Math.PI * t) * b.arc, lerp(b.sz, b.ez, t));
        g.rotation.y = Math.atan2(b.ex - b.sx, b.ez - b.sz);
        const f = Math.sin(time * 28 + b.peck) * 0.9; g.userData.wl.rotation.z = f; g.userData.wr.rotation.z = -f;
        if (t >= 1) { b.state = 'walk'; b.x = b.ex; b.z = b.ez; b.tx = b.x; b.tz = b.z; b.wait = rr(1, 3); g.userData.wl.rotation.z = g.userData.wr.rotation.z = 0.5; }
        continue;
      }
      const dx = pp.x - b.x, dz = pp.z - b.z;
      if (dx * dx + dz * dz < 20 && Math.random() < 0.08) {
        b.state = 'fly'; b.t = 0; b.dur = rr(2.2, 3.5); b.sx = b.x; b.sz = b.z; b.arc = rr(5, 9);
        const ang = Math.atan2(-dz, -dx) + rr(-0.9, 0.9), d = rr(14, 30);
        b.ex = clamp(b.x + Math.cos(ang) * d, 114, 158); b.ez = clamp(b.z + Math.sin(ang) * d, 96, 110);
        continue;
      }
      if (b.wait > 0) {
        b.wait -= dt;
        g.rotation.x = (Math.sin(time * 9 + b.peck) > 0.6) ? 0.5 : 0;
        if (b.wait <= 0) { g.rotation.x = 0; b.tx = clamp(b.x + rr(-3, 3), 112, 159); b.tz = clamp(b.z + rr(-3, 3), 95, 110); }
      } else {
        const ddx = b.tx - b.x, ddz = b.tz - b.z, d = Math.hypot(ddx, ddz);
        if (d < 0.1) b.wait = rr(0.5, 4);
        else { const s = Math.min(d, 1.4 * dt); b.x += ddx / d * s; b.z += ddz / d * s; g.rotation.y = Math.atan2(ddx, ddz); }
        g.rotation.x = 0;
      }
      g.position.set(b.x, world.BASE + Math.abs(Math.sin(time * 10 + b.peck)) * 0.03, b.z);
      g.userData.wl.rotation.z = g.userData.wr.rotation.z = 0.55;
    }
  }

  /* ================= flags ================= */
  const flagMeshes = [];
  function spawnFlags() {
    const tex = pixelTex(32, (x, s) => {
      x.fillStyle = '#b3141e'; x.fillRect(0, 0, s, s);
      x.fillStyle = '#e8bd3a';
      [[8, 20, 16, 5], [6, 14, 5, 7], [20, 12, 6, 8], [22, 9, 4, 3], [10, 8, 9, 6], [12, 6, 5, 3], [22, 24, 3, 4], [6, 25, 3, 3], [13, 25, 3, 3]].forEach((r) => x.fillRect(r[0], r[1], r[2], r[3]));
      x.fillStyle = '#b3141e'; x.fillRect(15, 11, 2, 2);
    });
    for (const f of world.flags) {
      const geo = new THREE.PlaneGeometry(4.4, 2.8, 11, 6); geo.translate(2.2, -1.4, 0);
      const mesh = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ map: tex, side: THREE.DoubleSide }));
      mesh.position.set(f[0] + 0.5, f[1] + 0.6, f[2]); mesh.castShadow = true; scene.add(mesh);
      flagMeshes.push({ mesh, base: Float32Array.from(geo.attributes.position.array), ph: Math.random() * 6 });
    }
  }
  function updateFlags(time) {
    for (const f of flagMeshes) {
      const p = f.mesh.geometry.attributes.position, a = p.array;
      for (let i = 0; i < p.count; i++) {
        const x = f.base[i * 3], y = f.base[i * 3 + 1], k = x / 4.4;
        a[i * 3 + 2] = Math.sin(x * 1.5 - time * 5 + f.ph) * 0.32 * k + Math.sin(y * 2 - time * 3) * 0.05 * k;
        a[i * 3 + 1] = y - Math.sin(x * 1.1 - time * 4 + f.ph) * 0.06 * k;
      }
      p.needsUpdate = true; f.mesh.geometry.computeVertexNormals();
    }
  }

  /* ================= external glTF ================= */
  const glb = { pivot: null, mixer: null, base: 1 };
  function clearGLB() {
    if (glb.pivot) { scene.remove(glb.pivot); glb.pivot.traverse((o) => { if (o.geometry) o.geometry.dispose(); }); glb.pivot = null; glb.mixer = null; }
  }
  function loadGLB(url) {
    return new Promise((resolve, reject) => {
      if (!THREE.GLTFLoader) return reject(new Error('GLTFLoader 未加载'));
      new THREE.GLTFLoader().load(url, (gltf) => {
        clearGLB();
        const obj = gltf.scene;
        const box = new THREE.Box3().setFromObject(obj);
        const size = box.getSize(new V3()), ctr = box.getCenter(new V3());
        const s = 40 / (Math.max(size.x, size.y, size.z) || 1);
        obj.scale.setScalar(s); obj.position.set(-ctr.x * s, -box.min.y * s, -ctr.z * s);
        const pivot = new THREE.Group(); pivot.add(obj);
        const fwd = new V3(-Math.sin(player.yaw), 0, -Math.cos(player.yaw));
        const cam = camera.position;
        pivot.position.set(cam.x + fwd.x * 50, world.BASE, cam.z + fwd.z * 50);
        obj.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; o.frustumCulled = false; } });
        scene.add(pivot); glb.pivot = pivot; glb.base = 1; pivot.scale.setScalar(parseFloat($('glbScale').value) || 1);
        if (gltf.animations && gltf.animations.length) { glb.mixer = new THREE.AnimationMixer(obj); gltf.animations.forEach((a) => glb.mixer.clipAction(a).play()); }
        resolve();
      }, undefined, (e) => reject(e && e.message ? e : new Error('无法解析模型（需要 .glb，且服务器需允许跨域）')));
    });
  }

  /* ================= landmarks / teleports ================= */
  function look(fx, fy, fz, tx, ty, tz) { const dx = tx - fx, dy = ty - fy, dz = tz - fz; return { yaw: Math.atan2(-dx, -dz), pitch: Math.atan2(dy, Math.hypot(dx, dz)) }; }
  const TELE = [
    { name: '圣马可广场', en: 'Piazza San Marco', mode: 'walk', p: [128.5, 5, 102.5], t: [172, 16, 103] },
    { name: '小广场与双柱', en: 'Piazzetta & Columns', mode: 'walk', p: [154.5, 5, 128.5], t: [154.5, 14, 140] },
    { name: '总督宫', en: 'Palazzo Ducale', mode: 'walk', p: [172.5, 5, 138.5], t: [178, 14, 128] },
    { name: '钟楼之巅', en: 'Campanile', mode: 'fly', p: [157, 62, 118], t: [128, 40, 98] },
    { name: '里亚托桥', en: 'Ponte di Rialto', mode: 'walk', p: [90.5, 12, 91.5], t: [80, 8, 60] },
    { name: '安康圣母教堂', en: 'Santa Maria della Salute', mode: 'walk', p: [109.5, 7, 130.5], t: [98, 22, 134] },
    { name: '叹息桥', en: 'Ponte dei Sospiri', mode: 'fly', p: [201, 19, 141], t: [195.5, 18, 123.5] },
    { name: '圣乔治岛', en: 'San Giorgio Maggiore', mode: 'fly', p: [176, 28, 142], t: [177, 18, 160] },
    { name: '大运河 · 乘贡多拉', en: 'Canal Grande', mode: 'gondola' }
  ];

  const TOUR = {
    cam: [[125, 10, 150], [158, 9, 148], [205, 14, 150], [222, 30, 100], [200, 50, 70], [130, 55, 60], [70, 48, 110], [80, 40, 160]],
    tgt: [[152, 18, 122], [172, 16, 126], [190, 20, 120], [178, 24, 103], [150, 25, 100], [120, 10, 95], [95, 14, 95], [100, 20, 134]],
    dur: 150
  };
  let tourCam = null, tourTgt = null;
  function initTour() {
    tourCam = new THREE.CatmullRomCurve3(TOUR.cam.map((p) => new V3(p[0], p[1], p[2])), true, 'centripetal');
    tourTgt = new THREE.CatmullRomCurve3(TOUR.tgt.map((p) => new V3(p[0], p[1], p[2])), true, 'centripetal');
  }

  /* ================= modes ================= */
  const MODE_LABEL = { tour: '导览模式 · 点击或按任意键开始探索', walk: '步行模式', fly: '飞行模式', gondola: '贡多拉 · 大运河' };
  let rideIdx = 0, ridePrevHeading = 0;
  function setMode(m, keepPos) {
    const prev = S.mode;
    if (!keepPos && (m === 'walk' || m === 'fly') && (prev === 'tour' || prev === 'gondola')) {
      player.pos.set(camera.position.x, camera.position.y - 1.62, camera.position.z);
      player.vel.set(0, 0, 0);
    }
    S.mode = m;
    player.fly = m === 'fly';
    if (m === 'gondola') {
      const b = gondolas[rideIdx % gondolas.length];
      ridePrevHeading = b.heading; player.yaw = b.heading; player.pitch = -0.05;
    }
    $('modeLabel').textContent = MODE_LABEL[m];
    $('crosshair').style.display = (m === 'walk' || m === 'fly') ? 'block' : 'none';
    $('held').style.display = (m === 'walk' || m === 'fly') ? 'flex' : 'none';
    updateHotbar(); updateHint();
    if (m === 'tour') exitLock();
  }
  function teleport(t) {
    if (t.mode === 'gondola') { setMode('gondola'); return; }
    const f = look(t.p[0], t.p[1] + 1.62, t.p[2], t.t[0], t.t[1], t.t[2]);
    player.yaw = f.yaw; player.pitch = f.pitch;
    let y = t.p[1];
    if (t.mode === 'walk') y = groundY(t.p[0], t.p[2], Math.floor(t.p[1] + 6));
    player.pos.set(t.p[0], y + 0.01, t.p[2]); player.vel.set(0, 0, 0);
    setMode(t.mode, true);
    if (!isTouch) requestLock();
  }

  /* ================= input ================= */
  function requestLock() { if (!isTouch && canvas.requestPointerLock && !document.pointerLockElement) { try { canvas.requestPointerLock(); } catch (e) { /* ignore */ } } }
  function exitLock() { if (document.pointerLockElement && document.exitPointerLock) document.exitPointerLock(); }
  document.addEventListener('pointerlockchange', () => {
    S.locked = document.pointerLockElement === canvas;
    $('lockHint').style.display = (!S.locked && !isTouch && (S.mode === 'walk' || S.mode === 'fly' || S.mode === 'gondola')) ? 'block' : 'none';
  });
  const inField = (e) => e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA');
  window.addEventListener('keydown', (e) => {
    if (inField(e)) return;
    keys[e.code] = true;
    if (S.mode === 'tour' && !e.metaKey && !e.ctrlKey && !/^(F\d+|Tab|Escape|Digit\d|KeyT|KeyY|KeyM|KeyH)$/.test(e.code)) { setMode('fly'); requestLock(); }
    if (e.code === 'Space') {
      e.preventDefault();
      const now = performance.now();
      if (now - player.lastSpace < 300 && (S.mode === 'walk' || S.mode === 'fly')) setMode(S.mode === 'fly' ? 'walk' : 'fly');
      player.lastSpace = now;
    }
    if (e.code === 'KeyF' && (S.mode === 'walk' || S.mode === 'fly')) setMode(S.mode === 'fly' ? 'walk' : 'fly');
    if (e.code === 'KeyT') cycleTime();
    if (e.code === 'KeyY') toggleAuto();
    if (e.code === 'KeyH') $('hint').classList.toggle('hide');
    if (e.code === 'KeyM') VeniceModels.toggle();
    if (e.code === 'KeyQ') cycleHeld(-1);
    if (e.code === 'KeyE') cycleHeld(1);
    if (S.mode === 'gondola') {
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') nextRide(-1);
      if (e.code === 'KeyD' || e.code === 'ArrowRight') nextRide(1);
    }
    const m = /^Digit([1-9])$/.exec(e.code);
    if (m) hotbarAction(parseInt(m[1], 10) - 1);
    if (e.code === 'Escape') { $('lmMenu').style.display = 'none'; }
  });
  window.addEventListener('keyup', (e) => { keys[e.code] = false; });
  window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; });

  let dragging = false;
  canvas.addEventListener('mousedown', (e) => {
    $('lmMenu').style.display = 'none';
    if (S.mode === 'tour') { setMode('fly'); requestLock(); return; }
    if (!S.locked) { requestLock(); dragging = true; return; }
    if (S.mode !== 'walk' && S.mode !== 'fly') return;
    if (e.button === 0) breakBlock(); else if (e.button === 2) placeBlock(); else if (e.button === 1) pickBlock();
  });
  window.addEventListener('mouseup', () => { dragging = false; });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  window.addEventListener('mousemove', (e) => {
    if (!(S.locked || dragging)) return;
    if (S.mode === 'tour') return;
    player.yaw -= (e.movementX || 0) * 0.0022;
    player.pitch = clamp(player.pitch - (e.movementY || 0) * 0.0022, -1.55, 1.55);
  });
  window.addEventListener('wheel', (e) => { if (S.locked && (S.mode === 'walk' || S.mode === 'fly')) cycleHeld(e.deltaY > 0 ? 1 : -1); }, { passive: true });

  // touch: left joystick, right-side look
  (function touchInit() {
    const joyEl = $('joy'), knob = joyEl.firstElementChild;
    let jid = null, jc = null, lid = null, lx = 0, ly = 0, ltx = 0, lty = 0, lt0 = 0;
    joyEl.addEventListener('touchstart', (e) => { e.preventDefault(); const t = e.changedTouches[0]; jid = t.identifier; const r = joyEl.getBoundingClientRect(); jc = [r.left + r.width / 2, r.top + r.height / 2]; if (S.mode === 'tour') setMode('walk'); }, { passive: false });
    window.addEventListener('touchmove', (e) => {
      for (const t of e.changedTouches) {
        if (t.identifier === jid) {
          let dx = (t.clientX - jc[0]) / 50, dy = (t.clientY - jc[1]) / 50; const l = Math.hypot(dx, dy); if (l > 1) { dx /= l; dy /= l; }
          joy.x = dx; joy.y = dy; knob.style.transform = 'translate(' + dx * 40 + 'px,' + dy * 40 + 'px)';
        } else if (t.identifier === lid) {
          player.yaw -= (t.clientX - lx) * 0.005; player.pitch = clamp(player.pitch - (t.clientY - ly) * 0.005, -1.5, 1.5); lx = t.clientX; ly = t.clientY;
        }
      }
    }, { passive: true });
    const end = (e) => { for (const t of e.changedTouches) { if (t.identifier === jid) { jid = null; joy.x = joy.y = 0; knob.style.transform = ''; } if (t.identifier === lid) { lid = null; if (performance.now() - lt0 < 220 && Math.hypot(t.clientX - ltx, t.clientY - lty) < 8 && (S.mode === 'walk' || S.mode === 'fly')) breakBlock(); } } };
    window.addEventListener('touchend', end); window.addEventListener('touchcancel', end);
    canvas.addEventListener('touchstart', (e) => {
      $('lmMenu').style.display = 'none';
      if (S.mode === 'tour') { setMode('walk'); return; }
      const t = e.changedTouches[0]; if (lid === null) { lid = t.identifier; lx = ltx = t.clientX; ly = lty = t.clientY; lt0 = performance.now(); }
    }, { passive: true });
    const hold = (el, key) => { el.addEventListener('touchstart', (e) => { e.preventDefault(); touchBtn[key] = true; }, { passive: false }); el.addEventListener('touchend', () => { touchBtn[key] = false; }); el.addEventListener('touchcancel', () => { touchBtn[key] = false; }); };
    hold($('tJump'), 'jump'); hold($('tDown'), 'down');
    $('tFly').addEventListener('touchstart', (e) => { e.preventDefault(); if (S.mode === 'tour') setMode('walk'); else setMode(S.mode === 'fly' ? 'walk' : 'fly'); }, { passive: false });
  })();

  /* ================= player physics ================= */
  const HW = 0.3, PH = 1.8;
  function blocked(px, py, pz) {
    const x0 = Math.floor(px - HW), x1 = Math.floor(px + HW), y0 = Math.floor(py), y1 = Math.floor(py + PH - 0.001), z0 = Math.floor(pz - HW), z1 = Math.floor(pz + HW);
    for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) if (solidAt(x, y, z)) return true;
    return false;
  }
  function movePlayer(dt) {
    const p = player, n = consoleInput;
    p.yaw += ((n.lookLeft ? 1 : 0) - (n.lookRight ? 1 : 0) - (n.lookX || 0)) * dt * 1.6;
    p.pitch = Math.max(-1.5, Math.min(1.5, p.pitch + ((n.lookUp ? 1 : 0) - (n.lookDown ? 1 : 0) + (n.lookY || 0)) * dt * 1.2));
    const fwd = (keys.KeyW || keys.ArrowUp || n.forward ? 1 : 0) - (keys.KeyS || keys.ArrowDown || n.back ? 1 : 0) - joy.y + (n.moveY || 0);
    const side = (keys.KeyD || keys.ArrowRight || n.right ? 1 : 0) - (keys.KeyA || keys.ArrowLeft || n.left ? 1 : 0) + joy.x + (n.moveX || 0);
    let ix = side, iz = -fwd;
    const l = Math.hypot(ix, iz); if (l > 1) { ix /= l; iz /= l; }
    const sin = Math.sin(p.yaw), cos = Math.cos(p.yaw);
    const wx = cos * ix + sin * iz, wz = -sin * ix + cos * iz;
    const sprint = !!(n.fast || keys.ShiftLeft || keys.ShiftRight || keys.ControlLeft && !p.fly);
    const jump = !!(n.up || keys.Space || touchBtn.jump);
    const down = !!(keys.KeyC || (p.fly && (keys.ShiftLeft || keys.ShiftRight)) || touchBtn.down || n.down);
    const feetCellWater = p.pos.y + 1.0 < VW.WATER_Y && !solidAt(Math.floor(p.pos.x), Math.floor(p.pos.y + 0.5), Math.floor(p.pos.z));
    p.swim = !p.fly && feetCellWater;
    if (p.climbT > 0) p.climbT -= dt;
    const climbing = !p.fly && p.climbT > 0;
    let speed;
    if (p.fly) speed = sprint ? 42 : 17; else if (p.swim || climbing) speed = 2.8; else speed = sprint ? 7.4 : 4.5;
    const k = p.fly ? 1 - Math.exp(-9 * dt) : (p.onGround || p.swim || climbing ? 1 - Math.exp(-14 * dt) : 1 - Math.exp(-3 * dt));
    p.vel.x += (wx * speed - p.vel.x) * k; p.vel.z += (wz * speed - p.vel.z) * k;
    if (p.fly) {
      const vy = (jump ? 1 : 0) - (down ? 1 : 0);
      p.vel.y += (vy * (sprint ? 28 : 12) - p.vel.y) * (1 - Math.exp(-9 * dt));
    } else if (p.swim || climbing) {
      let target = clamp((VW.WATER_Y - 1.25 - p.pos.y) * 3, -3, 3);
      if (jump) target = 3.6; if (down) target = -3.6;
      if (climbing) target = 5.6;
      p.vel.y += (target - p.vel.y) * (1 - Math.exp(-8 * dt));
    } else {
      p.vel.y -= 30 * dt; if (p.vel.y < -50) p.vel.y = -50;
      if (jump && p.onGround) { p.vel.y = 8.6; p.onGround = false; }
    }
    // sub-stepped axis-separated collision
    const steps = Math.max(1, Math.ceil(dt / 0.012)), h = dt / steps;
    let hitH = false;
    for (let s = 0; s < steps; s++) {
      const nx = p.pos.x + p.vel.x * h;
      if (blocked(nx, p.pos.y, p.pos.z)) {
        if (p.onGround && !blocked(nx, p.pos.y + 1.02, p.pos.z)) { p.pos.y += 1.02; p.stepOff -= 1.02; p.pos.x = nx; }
        else { p.vel.x = 0; hitH = true; }
      } else p.pos.x = nx;
      const nz = p.pos.z + p.vel.z * h;
      if (blocked(p.pos.x, p.pos.y, nz)) {
        if (p.onGround && !blocked(p.pos.x, p.pos.y + 1.02, nz)) { p.pos.y += 1.02; p.stepOff -= 1.02; p.pos.z = nz; }
        else { p.vel.z = 0; hitH = true; }
      } else p.pos.z = nz;
      const ny = p.pos.y + p.vel.y * h;
      if (blocked(p.pos.x, ny, p.pos.z)) {
        if (p.vel.y < 0) { const sy = Math.floor(ny) + 1; if (!blocked(p.pos.x, sy, p.pos.z)) p.pos.y = sy; }
        p.vel.y = 0;
      } else p.pos.y = ny;
      p.onGround = !p.fly && p.vel.y <= 0 && blocked(p.pos.x, p.pos.y - 0.03, p.pos.z);
    }
    if (p.swim && hitH && jump) p.climbT = 0.55;
    p.stepOff += (0 - p.stepOff) * (1 - Math.exp(-14 * dt));
    if (p.pos.y < -20) { p.pos.set(128.5, 8, 102.5); p.vel.set(0, 0, 0); }
    p.pos.x = clamp(p.pos.x, -600, 800); p.pos.z = clamp(p.pos.z, -600, 800);
  }

  /* ================= block interaction ================= */
  const HELD = [];
  function buildHeld() {
    const P = world.pal;
    HELD.push(
      { n: '白石砖', id: B.STONE, c: P(0.93, 0.91, 0.86) }, { n: '赭石墙', id: B.PLASTER, c: P(0.88, 0.66, 0.36) },
      { n: '玫瑰墙', id: B.PLASTER, c: P(0.92, 0.62, 0.52) }, { n: '红砖', id: B.BRICK, c: P(0.8, 0.42, 0.3) },
      { n: '陶土瓦', id: B.ROOF, c: P(0.78, 0.36, 0.22) }, { n: '木板', id: B.WOOD, c: P(0.7, 0.5, 0.3) },
      { n: '绿百叶窗', id: B.SHUTTER, c: P(0.2, 0.45, 0.3) }, { n: '窗（夜亮灯）', id: B.GLASS, c: 0 },
      { n: '金马赛克', id: B.GOLD, c: 0 }, { n: '铜绿穹顶', id: B.DOME, c: P(0.4, 0.72, 0.6) },
      { n: '粉白菱形', id: B.DIAMOND, c: 0 }, { n: '灯笼', id: B.LAMP, c: 0 }
    );
    updateHeld();
  }
  const SWATCH = ['#ece8dc', '#e0a85c', '#eb9e85', '#cc6b4d', '#c75c38', '#b3804d', '#33734d', '#f2d27a', '#e8bd3a', '#66b89a', '#e58a80', '#ffe9a0'];
  function updateHeld() { const h = HELD[S.held]; if (!h) return; $('heldName').textContent = h.n + '  [' + (S.held + 1) + '/' + HELD.length + ']'; $('heldSw').style.background = SWATCH[S.held]; }
  function cycleHeld(d) { if (!HELD.length) return; S.held = (S.held + d + HELD.length) % HELD.length; updateHeld(); }
  const outline = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1.004, 1.004, 1.004)), new THREE.LineBasicMaterial({ color: 0x000000 }));
  outline.visible = false; scene.add(outline);
  const rayDir = new V3();
  let target = null;
  function raycastVoxel(o, d, maxD) {
    let x = Math.floor(o.x), y = Math.floor(o.y), z = Math.floor(o.z);
    const sx = Math.sign(d.x), sy = Math.sign(d.y), sz = Math.sign(d.z);
    const tdx = d.x ? Math.abs(1 / d.x) : Infinity, tdy = d.y ? Math.abs(1 / d.y) : Infinity, tdz = d.z ? Math.abs(1 / d.z) : Infinity;
    let tx = d.x > 0 ? (x + 1 - o.x) * tdx : d.x < 0 ? (o.x - x) * tdx : Infinity;
    let ty = d.y > 0 ? (y + 1 - o.y) * tdy : d.y < 0 ? (o.y - y) * tdy : Infinity;
    let tz = d.z > 0 ? (z + 1 - o.z) * tdz : d.z < 0 ? (o.z - z) * tdz : Infinity;
    let nx = 0, ny = 0, nz = 0, t = 0;
    for (let i = 0; i < 64; i++) {
      if (solidAt(x, y, z) && x >= 0 && x < world.W && z >= 0 && z < world.D && y >= 0 && y < world.H) return { x, y, z, nx, ny, nz };
      if (tx < ty && tx < tz) { t = tx; x += sx; tx += tdx; nx = -sx; ny = 0; nz = 0; }
      else if (ty < tz) { t = ty; y += sy; ty += tdy; nx = 0; ny = -sy; nz = 0; }
      else { t = tz; z += sz; tz += tdz; nx = 0; ny = 0; nz = -sz; }
      if (t > maxD) break;
    }
    return null;
  }
  function updateTarget() {
    if (S.mode !== 'walk' && S.mode !== 'fly') { outline.visible = false; target = null; return; }
    camera.getWorldDirection(rayDir);
    target = raycastVoxel(camera.position, rayDir, p_reach());
    if (target) { outline.visible = true; outline.position.set(target.x + 0.5, target.y + 0.5, target.z + 0.5); } else outline.visible = false;
  }
  const p_reach = () => (player.fly ? 12 : 6.5);
  function breakBlock() {
    if (!target || target.y < 1) return;
    world.set(target.x, target.y, target.z, 0, 0); markDirty(target.x, target.z);
  }
  function placeBlock() {
    if (!target) return;
    const x = target.x + target.nx, y = target.y + target.ny, z = target.z + target.nz;
    if (y < 0 || y >= world.H || solidAt(x, y, z)) return;
    const pp = player.pos;
    if (x + 1 > pp.x - HW && x < pp.x + HW && z + 1 > pp.z - HW && z < pp.z + HW && y + 1 > pp.y && y < pp.y + PH) return;
    const h = HELD[S.held]; world.set(x, y, z, h.id, h.c); markDirty(x, z);
  }
  function pickBlock() {
    if (!target) return;
    const id = world.blocks[world.idx(target.x, target.y, target.z)];
    const i = HELD.findIndex((h) => h.id === id); if (i >= 0) { S.held = i; updateHeld(); }
  }

  /* ================= gondola ride ================= */
  function nextRide(d) { rideIdx = (rideIdx + d + gondolas.length) % gondolas.length; const b = gondolas[rideIdx]; ridePrevHeading = b.heading; player.yaw = b.heading; toast('贡多拉 ' + (rideIdx + 1) + '/' + gondolas.length); }

  /* ================= HUD ================= */
  let toastT = 0;
  function toast(msg) { const el = $('toast'); el.textContent = msg; el.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('show'), 2600); }

  const SLOTS = [
    { ic: '🎥', tip: '导览', act: () => setMode('tour') },
    { ic: '🚶', tip: '步行', act: () => { setMode('walk'); requestLock(); } },
    { ic: '🕊️', tip: '飞行', act: () => { setMode('fly'); requestLock(); } },
    { ic: '🛶', tip: '贡多拉', act: () => { setMode('gondola'); requestLock(); } },
    { ic: '📍', tip: '地标传送', act: () => toggleLmMenu() },
    { ic: '🌅', tip: '切换时间 (T)', act: () => cycleTime() },
    { ic: '⏱️', tip: '昼夜循环 (Y)', act: () => toggleAuto() },
    { ic: '◐', tip: '阴影', act: () => toggleShadows() },
    { ic: '🌐', tip: '3D 模型库 (M)', act: () => VeniceModels.toggle() }
  ];
  function buildHotbar() {
    const hb = $('hotbar'); hb.innerHTML = '';
    SLOTS.forEach((s, i) => {
      const el = document.createElement('div'); el.className = 'slot'; el.id = 'slot' + i;
      el.innerHTML = '<small>' + (i + 1) + '</small>' + s.ic + '<em>' + s.tip + '</em>';
      el.addEventListener('mousedown', (e) => e.stopPropagation());
      el.addEventListener('click', () => hotbarAction(i));
      hb.appendChild(el);
    });
    updateHotbar();
  }
  function hotbarAction(i) { if (SLOTS[i]) SLOTS[i].act(); }
  function updateHotbar() {
    const modeIdx = { tour: 0, walk: 1, fly: 2, gondola: 3 }[S.mode];
    SLOTS.forEach((s, i) => {
      const el = $('slot' + i); if (!el) return;
      el.classList.toggle('on', i === modeIdx || (i === 6 && S.auto) || (i === 7 && S.shadows));
      el.classList.toggle('off', (i === 6 && !S.auto) || (i === 7 && !S.shadows));
    });
  }
  function updateHint() {
    const h = {
      tour: '点击画面 / 任意键：进入探索<br>1-9：功能栏 · T：时间 · M：模型库',
      walk: 'WASD 移动 · 空格 跳 · Shift 冲刺<br>左键 拆方块 · 右键 放方块 · Q/E 换方块<br>F / 双击空格：飞行 · 水里按空格上岸',
      fly: 'WASD 飞行 · 空格 上升 · C/Shift 下降<br>Ctrl 加速 · 左键拆 · 右键放 · F 落地',
      gondola: 'A / D：换一条贡多拉<br>鼠标：环顾四周 · 1-4：切换模式'
    };
    $('hint').innerHTML = h[S.mode] + '<br><span style="opacity:.7">H 隐藏提示</span>';
    $('lockHint').style.display = (!S.locked && !isTouch && S.mode !== 'tour') ? 'block' : 'none';
  }
  function toggleLmMenu() {
    const m = $('lmMenu');
    if (m.style.display === 'flex') { m.style.display = 'none'; return; }
    m.innerHTML = '';
    TELE.forEach((t) => { const b = document.createElement('button'); b.innerHTML = t.name + '<small>' + t.en + '</small>'; b.onclick = () => { m.style.display = 'none'; teleport(t); }; m.appendChild(b); });
    m.style.display = 'flex';
  }
  function cycleTime() {
    const presets = [6.6, 12.5, 17.8, 21.6];
    let i = presets.findIndex((p) => p > S.time + 0.05); if (i < 0) i = 0;
    S.time = presets[i]; $('timeSlider').value = S.time;
    toast(['清晨', '正午', '黄昏', '夜晚'][i]);
  }
  function toggleAuto() { S.auto = !S.auto; updateHotbar(); toast(S.auto ? '昼夜循环：开' : '昼夜循环：关'); }
  function toggleShadows() {
    if (!renderer.shadowMap.enabled && !S.shadows) { renderer.shadowMap.enabled = true; }
    S.shadows = !S.shadows; sun.castShadow = S.shadows; matWorld.needsUpdate = true;
    updateHotbar(); toast(S.shadows ? '阴影：开' : '阴影：关');
  }
  $('timeSlider').addEventListener('input', (e) => { S.time = parseFloat(e.target.value); });
  ['mousedown', 'touchstart'].forEach((ev) => { $('timeSlider').addEventListener(ev, (e) => e.stopPropagation()); $('mmWrap').addEventListener(ev, (e) => e.stopPropagation()); });

  /* ---- minimap ---- */
  let mmBase = null;
  function buildMinimap() {
    const { W, D } = world;
    const c = document.createElement('canvas'); c.width = W; c.height = D;
    const x = c.getContext('2d'), img = x.createImageData(W, D);
    for (let z = 0; z < D; z++) for (let i = 0; i < W; i++) {
      const k = i + W * z, h = world.topH[k], b = world.topB[k], pc = world.palette[world.topC[k]] || [1, 1, 1];
      let r, g, bl;
      if (b === B.SAND || h <= 1) { r = 26; g = 92; bl = 118; }
      else {
        const sh = 0.62 + Math.min(h, 45) / 45 * 0.5 - (world.topH[Math.min(W - 1, i + 1) + W * Math.min(D - 1, z + 1)] > h ? 0.12 : 0);
        r = pc[0] * 255 * sh; g = pc[1] * 255 * sh; bl = pc[2] * 255 * sh;
        if (b === B.ROOF) { r = 190 * sh; g = 90 * sh; bl = 60 * sh; }
        if (b === B.PAVE) { r = 150; g = 146; bl = 138; }
      }
      const o = k * 4; img.data[o] = r; img.data[o + 1] = g; img.data[o + 2] = bl; img.data[o + 3] = 255;
    }
    x.putImageData(img, 0, 0); mmBase = c;
  }
  const mm = $('mm'), mmx = mm.getContext('2d');
  function drawMinimap() {
    if (!mmBase) return;
    mmx.imageSmoothingEnabled = false;
    mmx.drawImage(mmBase, 0, 0);
    mmx.fillStyle = '#fff';
    world.landmarks.forEach((l) => mmx.fillRect(Math.floor(l.x) - 1, Math.floor(l.z) - 1, 3, 3));
    gondolas.forEach((b) => { mmx.fillStyle = '#ffd34a'; mmx.fillRect(Math.floor(b.pos.x) - 1, Math.floor(b.pos.z) - 1, 2, 2); });
    const cp = camera.position;
    mmx.save(); mmx.translate(cp.x, cp.z); mmx.rotate(-player.yaw + Math.PI);
    mmx.fillStyle = '#ff3b3b'; mmx.strokeStyle = '#000'; mmx.lineWidth = 1;
    mmx.beginPath(); mmx.moveTo(0, -6); mmx.lineTo(4, 5); mmx.lineTo(0, 2.5); mmx.lineTo(-4, 5); mmx.closePath(); mmx.fill(); mmx.stroke();
    mmx.restore();
  }
  mm.addEventListener('click', (e) => {
    const r = mm.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width * world.W, z = (e.clientY - r.top) / r.height * world.D;
    const gy = Math.max(world.topH[Math.floor(x) + world.W * Math.floor(z)] || 5, 5);
    player.pos.set(x, gy + 12, z); player.vel.set(0, 0, 0);
    if (S.mode === 'tour' || S.mode === 'gondola') player.pitch = -0.25;
    setMode('fly', true);
    toast('已飞到 (' + Math.round(x) + ', ' + Math.round(z) + ')');
  });

  /* ---- landmark banner ---- */
  let lastLm = null, bannerTimer = 0;
  function updateBanner() {
    const cp = camera.position;
    let best = null, bd = 1e9;
    for (const l of world.landmarks) { const d = Math.hypot(cp.x - l.x, cp.z - l.z); if (d < l.r && d < bd) { bd = d; best = l; } }
    if (best !== lastLm) {
      lastLm = best;
      if (best) { $('bannerT').textContent = best.name; $('bannerS').textContent = best.en; $('banner').classList.add('show'); clearTimeout(bannerTimer); bannerTimer = setTimeout(() => $('banner').classList.remove('show'), 3800); }
    }
  }

  /* ================= camera per mode ================= */
  const _la = new V3(), _tc = new V3(), _tt = new V3();
  function updateCamera(dt) {
    if (window.MinestOiaEditor && window.MinestOiaEditor.frame()) return;   /* My World 71: the editing camera */
    if (S.mode === 'tour') {
      S.tourT = (S.tourT + dt / TOUR.dur) % 1;
      tourCam.getPointAt(S.tourT, _tc); tourTgt.getPointAt(S.tourT, _tt);
      camera.position.copy(_tc); camera.lookAt(_tt);
      const d = new V3().subVectors(_tt, _tc);
      player.yaw = Math.atan2(-d.x, -d.z); player.pitch = Math.atan2(d.y, Math.hypot(d.x, d.z));
      player.pos.set(_tt.x, _tt.y, _tt.z);
      camera.fov = 66;
    } else if (S.mode === 'gondola') {
      const b = gondolas[rideIdx % gondolas.length];
      player.yaw += wrapAngle(b.heading - ridePrevHeading); ridePrevHeading = b.heading;
      const s = Math.sin(b.heading), c = Math.cos(b.heading);
      const lx = 0.0, ly = 1.45 + Math.sin(S.elapsed * 1.6 + b.phase) * 0.03, lz = 0.7;
      camera.position.set(b.pos.x + lx * c + lz * s, b.pos.y + ly + 0.15, b.pos.z - lx * s + lz * c);
      camera.rotation.set(player.pitch, player.yaw, 0);
      player.pos.set(camera.position.x, camera.position.y - 1.62, camera.position.z);
      camera.fov = 74;
    } else {
      movePlayer(dt);
      camera.position.set(player.pos.x, player.pos.y + 1.62 + player.stepOff, player.pos.z);
      camera.rotation.set(player.pitch, player.yaw, 0);
      const spr = (keys.ShiftLeft || keys.ShiftRight || keys.ControlLeft) && (Math.abs(player.vel.x) + Math.abs(player.vel.z) > 3);
      camera.fov += ((spr ? 80 : 72) - camera.fov) * (1 - Math.exp(-8 * dt));
    }
    camera.updateProjectionMatrix();
  }

  /* shadow camera follows the player/target, snapped to the shadow texel grid */
  const _r = new V3(), _u = new V3(), _c = new V3(), _up = new V3(0, 1, 0);
  function updateShadow() {
    if (!S.shadows) return;
    const ctr = _c.copy(S.mode === 'tour' ? player.pos : camera.position);
    _r.crossVectors(_up, lightDir).normalize(); _u.crossVectors(lightDir, _r).normalize();
    const tex = (SH * 2) / sun.shadow.mapSize.x;
    const a = Math.round(ctr.dot(_r) / tex) * tex, b = Math.round(ctr.dot(_u) / tex) * tex, d = ctr.dot(lightDir);
    ctr.set(0, 0, 0).addScaledVector(_r, a).addScaledVector(_u, b).addScaledVector(lightDir, d);
    sun.target.position.copy(ctr);
    sun.position.copy(ctr).addScaledVector(lightDir, 200);
    sun.target.updateMatrixWorld();
  }
  function updateLamps() {
    if (nightF < 0.05) return;
    const cp = camera.position, arr = world.lamps, best = [];
    for (let i = 0; i < arr.length; i++) {
      const l = arr[i], d = (l[0] - cp.x) ** 2 + (l[1] - cp.y) ** 2 + (l[2] - cp.z) ** 2;
      if (best.length < 4 || d < best[best.length - 1][0]) { best.push([d, l]); best.sort((p, q) => p[0] - q[0]); if (best.length > 4) best.pop(); }
    }
    best.forEach((b, i) => lampLights[i].position.set(b[1][0], b[1][1] + 0.4, b[1][2]));
  }

  /* ================= main loop ================= */
  let last = performance.now(), fpsAcc = 0, fpsN = 0, fps = 60;
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    S.elapsed += dt;
    if (S.auto) S.time = (S.time + dt * 0.12) % 24;
    updateCamera(dt);
    updateSky(camera.position);
    waterMat.uniforms.uTime.value = S.elapsed;
    waterMesh.position.x = Math.round(camera.position.x); waterMesh.position.z = Math.round(camera.position.z);
    farFloor.position.x = waterMesh.position.x; farFloor.position.z = waterMesh.position.z;
    updateBoats(dt, S.elapsed); updateNPCs(dt, S.elapsed); updateBirds(dt, S.elapsed); updateFlags(S.elapsed);
    if (glb.mixer) glb.mixer.update(dt);
    updateTarget();
    updateShadow();
    S.lampT -= dt; if (S.lampT <= 0) { S.lampT = 0.35; updateLamps(); }
    // rebuild edited chunks (max 2 per frame)
    if (dirty.size) { let n = 0; for (const i of dirty) { meshChunk(i % CX, Math.floor(i / CX)); dirty.delete(i); if (++n >= 2) break; } }
    $('uw').style.display = camera.position.y < VW.WATER_Y - 0.05 ? 'block' : 'none';
    S.hudT -= dt;
    if (S.hudT <= 0) {
      S.hudT = 0.2;
      const cp = camera.position, hh = Math.floor(S.time), mmn = Math.floor((S.time - hh) * 60);
      $('clock').textContent = String(hh).padStart(2, '0') + ':' + String(mmn).padStart(2, '0');
      if (S.auto) $('timeSlider').value = S.time;
      $('coords').textContent = 'XYZ ' + cp.x.toFixed(0) + ' ' + cp.y.toFixed(0) + ' ' + cp.z.toFixed(0) + ' · ' + fps.toFixed(0) + ' fps';
      drawMinimap(); updateBanner();
    }
    fpsAcc += dt; fpsN++; if (fpsAcc > 0.5) { fps = fpsN / fpsAcc; fpsAcc = 0; fpsN = 0; }
    renderer.render(scene, camera);
  }

  /* ================= boot ================= */
  const setLoad = (msg, p) => { $('loadMsg').textContent = msg; $('bar').firstElementChild.style.width = Math.round(p * 100) + '%'; };
  async function boot() {
    try {
      setLoad('正在规划运河与街区…', 0.04); await nextFrame();
      world = VW.create(1597);
      window.__venice = window.__voxel = { controls: consoleControls, world, player, scene, camera, S, setMode, teleport };
      setLoad('烘焙像素贴图…', 0.16); await nextFrame();
      const atlas = new THREE.CanvasTexture(VeniceTex.buildCanvas());
      atlas.magFilter = THREE.NearestFilter; atlas.minFilter = THREE.NearestFilter; atlas.generateMipmaps = false;
      matWorld.map = atlas; matGlow.map = atlas; matWorld.needsUpdate = true; matGlow.needsUpdate = true;
      CX = Math.ceil(world.W / CH); CZ = Math.ceil(world.D / CH);
      const total = CX * CZ; let done = 0;
      for (let cz = 0; cz < CZ; cz++) for (let cx = 0; cx < CX; cx++) {
        meshChunk(cx, cz); done++;
        if (done % 3 === 0) { setLoad('搭建方块街区 ' + done + '/' + total, 0.2 + 0.6 * done / total); await nextFrame(); }
      }
      setLoad('放置贡多拉、行人与海鸥…', 0.86); await nextFrame();
      const gcp = world.gcPath;
      const GC_USE = gcp;
      for (let i = 0; i < 6; i++) addRoute(GC_USE, 'gondola', { speed: 2.6 + (i % 3) * 0.35, u0: i * 55, lat: 2.2, pass: i % 2 === 0, a: 10, b: 18 });
      addRoute(GC_USE, 'gondola', { speed: 2.4, u0: 300, lat: -2.2, pass: true, a: 10, b: 18 });
      addRoute(GC_USE, 'vaporetto', { speed: 4.2, u0: 40, lat: 0.4, a: 6, b: 14 });
      addRoute(GC_USE, 'vaporetto', { speed: 3.8, u0: 230, lat: -0.4, a: 6, b: 14 });
      addRoute([[118, 152], [140, 146.5], [172, 146.5], [206, 146.5]], 'vaporetto', { speed: 4.5, u0: 20, lat: 0, a: 2, b: 2 });
      addRoute([[210, 156], [206, 175], [180, 184], [150, 186]], 'sail', { speed: 2.4, u0: 0, lat: 0, a: 2, b: 2, color: 0xf5f5f0 });
      addRoute([[40, 184], [80, 186], [120, 186], [160, 187]], 'sail', { speed: 2.0, u0: 90, lat: 0, a: 2, b: 2, color: 0xd9552b });
      addRoute([[6, 70], [6, 100], [8, 130], [24, 150]], 'sail', { speed: 2.1, u0: 40, lat: 0, a: 2, b: 2, color: 0xe8c040 });

      addMoored();
      spawnNPCs(); makeNPCMeshes(); spawnBirds(); spawnFlags();
      buildHeld(); buildMinimap(); initTour(); buildHotbar();
      VeniceModels.init({
        loadGLB, clearGLB, setGLBScale: (s) => { if (glb.pivot) glb.pivot.scale.setScalar(s); }, toast,
        onOpen: () => { exitLock(); }, onClose: () => { }
      });
      setLoad('完成', 1);
      applyURLCamera();
      setMode(S.mode); updateHint();
      $('loading').classList.add('done');
      requestAnimationFrame(frame);
    } catch (err) {
      console.error(err);
      setLoad('加载失败：' + (err && err.message ? err.message : err), 1);
    }
  }
  function applyURLCamera() {
    const c = qs.get('cam');
    if (c) {
      const v = c.split(',').map(Number);
      if (v.length >= 6) {
        const f = look(v[0], v[1], v[2], v[3], v[4], v[5]);
        player.pos.set(v[0], v[1] - 1.62, v[2]); player.yaw = f.yaw; player.pitch = f.pitch; S.mode = 'fly';
      }
    }
    const m = qs.get('mode'); if (m && ['tour', 'walk', 'fly', 'gondola'].includes(m)) S.mode = m;
    if (qs.get('hud') === '0') $('hud').style.display = 'none';
  }
  boot();
})();
