/* Cathedrals' Island (世界圣殿教堂小岛) — Main 3D Runtime & Voxel Engine. */
(function () {
  'use strict';
  const VW = window.CIWorld, CH = 32;
  const $ = (id) => document.getElementById(id);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const wrapAngle = (a) => { while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; return a; };
  const nextFrame = () => new Promise((r) => requestAnimationFrame(() => r()));
  const V3 = THREE.Vector3;
  const qs = new URLSearchParams(location.search);
  const isTouch = ('ontouchstart' in window) || matchMedia('(pointer:coarse)').matches;
  if (isTouch) document.body.classList.add('touch');

  const canvas = $('gl');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !isTouch, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  const wantShadow = qs.get('q') !== 'low' && !(isTouch && qs.get('shadow') !== '1');
  renderer.shadowMap.enabled = wantShadow;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0xbcdcf4, 0.001);
  const camera = new THREE.PerspectiveCamera(70, 1, 0.1, 3000);
  camera.rotation.order = 'YXZ';
  scene.add(camera);

  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  resize();

  let world = null, props = null, portals = null;
  const S = {
    mode: qs.get('mode') || 'walk', ui: false, time: parseFloat(qs.get('t')) || 10.6,
    auto: false, tourT: 0, hudT: 0, locked: false, elapsed: 0
  };
  const keys = Object.create(null);
  const player = { pos: new V3(192.5, 42, 240), vel: new V3(), yaw: 0, pitch: 0.08, onGround: false, fly: false, stepOff: 0, lastSpace: 0 };

  const hemi = new THREE.HemisphereLight(0xcfe4ff, 0x6a5a48, 0.65);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffffff, 0.85);
  sun.castShadow = wantShadow;
  sun.shadow.mapSize.set(1024, 1024);
  const SH = 92;
  Object.assign(sun.shadow.camera, { left: -SH, right: SH, top: SH, bottom: -SH, near: 1, far: 420 });
  sun.shadow.camera.updateProjectionMatrix();
  sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.03;
  scene.add(sun, sun.target);

  const lampLights = [];
  for (let i = 0; i < 8; i++) {
    const l = new THREE.PointLight(0xffcf88, 0, 24, 1.5);
    lampLights.push(l); scene.add(l);
  }

  /* ================= Sky & Ocean ================= */
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
  skyMesh.renderOrder = -10; skyMesh.frustumCulled = false; scene.add(skyMesh);

  // Starry night sky (1,600 stars on the celestial dome)
  const starGeo = new THREE.BufferGeometry();
  const starPos = new Float32Array(1600 * 3), starCol = new Float32Array(1600 * 3);
  for (let i = 0; i < 1600; i++) {
    const th = Math.random() * Math.PI * 2;
    const ph = Math.acos(Math.pow(Math.random(), 0.72)); // denser toward zenith
    const r = 1380;
    starPos[i * 3] = Math.sin(ph) * Math.cos(th) * r;
    starPos[i * 3 + 1] = Math.cos(ph) * r;
    starPos[i * 3 + 2] = Math.sin(ph) * Math.sin(th) * r;
    const tint = Math.random();
    const br = 0.65 + Math.random() * 0.35;
    starCol[i * 3] = br * (tint < 0.2 ? 1.0 : tint < 0.4 ? 0.82 : 0.96);
    starCol[i * 3 + 1] = br * (tint < 0.2 ? 0.88 : tint < 0.4 ? 0.90 : 0.97);
    starCol[i * 3 + 2] = br * (tint < 0.2 ? 0.72 : 1.0);
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  starGeo.setAttribute('color', new THREE.BufferAttribute(starCol, 3));
  const starMat = new THREE.PointsMaterial({ size: 5.5, vertexColors: true, transparent: true, opacity: 0, depthWrite: false, fog: false, sizeAttenuation: true });
  const starMesh = new THREE.Points(starGeo, starMat);
  starMesh.renderOrder = -9; starMesh.frustumCulled = false; scene.add(starMesh);

  // Glowing Sun & Moon celestial sprites
  function makeOrbTex(inner, mid, outer) {
    const cv = document.createElement('canvas'); cv.width = 128; cv.height = 128;
    const g = cv.getContext('2d');
    const gr = g.createRadialGradient(64, 64, 4, 64, 64, 62);
    gr.addColorStop(0, inner); gr.addColorStop(0.26, mid); gr.addColorStop(0.65, outer); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(cv);
  }
  const sunSprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: makeOrbTex('rgba(255,252,235,1)', 'rgba(255,214,130,0.85)', 'rgba(255,160,80,0.16)'),
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false
  }));
  sunSprite.scale.set(170, 170, 1); sunSprite.renderOrder = -8; scene.add(sunSprite);

  const moonSprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: makeOrbTex('rgba(245,250,255,1)', 'rgba(200,224,255,0.82)', 'rgba(130,170,245,0.14)'),
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false
  }));
  moonSprite.scale.set(115, 115, 1); moonSprite.renderOrder = -8; scene.add(moonSprite);

  const farFloor = new THREE.Mesh(new THREE.PlaneGeometry(6000, 6000), new THREE.MeshLambertMaterial({ color: 0x1e4a5f }));
  farFloor.rotation.x = -Math.PI / 2; farFloor.position.y = 35.8; scene.add(farFloor);

  const waterMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: { uTime: { value: 0 }, uSunDir: { value: new V3(0, 1, 0) }, uSunCol: { value: new THREE.Color(1, 1, 1) }, uSky: { value: new THREE.Color() }, uDeep: { value: new THREE.Color() }, uShallow: { value: new THREE.Color() }, uFog: { value: new THREE.Color() }, uFogD: { value: 0.0034 } },
    vertexShader: 'varying vec3 vW; varying float vD; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; vec4 mv = viewMatrix * w; vD = -mv.z; gl_Position = projectionMatrix * mv; }',
    fragmentShader: [
      'uniform float uTime; uniform vec3 uSunDir; uniform vec3 uSunCol; uniform vec3 uSky; uniform vec3 uDeep; uniform vec3 uShallow; uniform vec3 uFog; uniform float uFogD;',
      'varying vec3 vW; varying float vD;',
      'float h21(vec2 p){ p = fract(p*vec2(123.34,456.21)); p += dot(p,p+45.32); return fract(p.x*p.y); }',
      'void main(){ vec2 p = vW.xz*2.0; float t1 = floor(uTime*1.6);',
      ' vec2 c1 = floor(p + vec2(uTime*0.5, uTime*0.28)); vec2 c2 = floor(p*0.5 + vec2(-uTime*0.22, uTime*0.36) + 17.0);',
      ' float n1 = h21(c1 + t1*0.37); float n2 = h21(c2 + 31.7);',
      ' vec3 N = normalize(vec3((n1-0.5)*0.32, 1.0, (n2-0.5)*0.32)); vec3 V = normalize(cameraPosition - vW);',
      ' float fr = pow(1.0 - max(dot(N,V),0.0), 3.0);',
      ' vec3 col = mix(mix(uDeep, uShallow, n1*0.55 + n2*0.25 + 0.1), uSky, fr*0.78);',
      ' vec3 R = reflect(-uSunDir, N); col += uSunCol * pow(max(dot(R,V),0.0), 110.0) * 1.4;',
      ' float fog = 1.0 - exp(-uFogD*uFogD*vD*vD); gl_FragColor = vec4(mix(col, uFog, fog), mix(0.78, 0.96, fr)); }'
    ].join('\n')
  });
  const waterMesh = new THREE.Mesh(new THREE.PlaneGeometry(800, 800), waterMat);
  waterMesh.rotation.x = -Math.PI / 2; waterMesh.position.set(192, VW.WATER_Y, 192); waterMesh.renderOrder = 5; scene.add(waterMesh);

  const KEYS = [
    [0, 0x050818, 0x0e1535, 0x04101c, 0x0a2838], [6.3, 0x3a5a9a, 0xf09a70, 0x0e2a38, 0x2a6a74],
    [10.5, 0x2a82e8, 0xbcdcf4, 0x14466a, 0x4298aa], [17.7, 0x4a7cc8, 0xf8b878, 0x123a48, 0x3a7478],
    [20.6, 0x0e1438, 0x35305a, 0x061824, 0x10303e], [24, 0x050818, 0x0e1535, 0x04101c, 0x0a2838]
  ];
  const cTop = new THREE.Color(), cHor = new THREE.Color(), cDeep = new THREE.Color(), cShal = new THREE.Color(), cTmp = new THREE.Color();
  function sampleKey(t, idx, out) {
    let i = 0; while (i < KEYS.length - 2 && t >= KEYS[i + 1][0]) i++;
    const a = KEYS[i], b = KEYS[i + 1], f = clamp((t - a[0]) / (b[0] - a[0]), 0, 1);
    out.setHex(a[idx]); out.lerp(cTmp.setHex(b[idx]), f);
  }
  const sunDir = new V3(), lightDir = new V3(), sunCol = new THREE.Color();
  const warmCol = new THREE.Color(1.0, 0.58, 0.30), whiteCol = new THREE.Color(1.0, 0.97, 0.92), moonCol = new THREE.Color(0.55, 0.68, 1.0);
  const matWorld = new THREE.MeshLambertMaterial({ vertexColors: true });
  const matGlow = new THREE.MeshBasicMaterial({ vertexColors: true });
  const matLit = new THREE.MeshBasicMaterial({ vertexColors: true });
  let dayF = 1, nightF = 0;

  function setTime(t) {
    S.time = ((t % 24) + 24) % 24;
    const sl = $('timeSlider'); if (sl) sl.value = S.time;
  }

  function updateSky(cam) {
    const t = ((S.time % 24) + 24) % 24;
    const a = (t - 5.5) / 14 * Math.PI;
    sunDir.set(Math.cos(a), Math.sin(a), 0.35).normalize();
    const e = sunDir.y;
    dayF = smooth(-0.08, 0.35, e); nightF = 1 - smooth(-0.12, 0.14, e);
    sampleKey(t, 1, cTop); sampleKey(t, 2, cHor); sampleKey(t, 3, cDeep); sampleKey(t, 4, cShal);
    sunCol.copy(warmCol).lerp(whiteCol, smooth(0.04, 0.5, e));
    if (e > -0.02) { lightDir.copy(sunDir); sun.color.copy(sunCol); sun.intensity = 0.08 + 0.84 * smooth(-0.02, 0.32, e); }
    else { lightDir.copy(sunDir).negate(); sun.color.copy(moonCol); sun.intensity = 0.42 * smooth(0, 0.25, -e); }
    hemi.color.setRGB(lerp(0.24, 0.78, dayF), lerp(0.30, 0.87, dayF), lerp(0.50, 1.0, dayF)).lerp(cHor, 0.22);
    hemi.groundColor.setRGB(lerp(0.10, 0.46, dayF), lerp(0.10, 0.42, dayF), lerp(0.16, 0.36, dayF));
    hemi.intensity = lerp(0.56, 0.68, dayF);
    skyMat.uniforms.uTop.value.copy(cTop); skyMat.uniforms.uHor.value.copy(cHor);
    skyMat.uniforms.uSunDir.value.copy(sunDir); skyMat.uniforms.uSunCol.value.copy(sunCol);
    scene.fog.color.copy(cHor); renderer.setClearColor(cHor);
    const wu = waterMat.uniforms;
    wu.uSunDir.value.copy(lightDir); wu.uSunCol.value.copy(sun.color);
    wu.uSky.value.copy(cHor).lerp(cTop, 0.35); wu.uDeep.value.copy(cDeep); wu.uShallow.value.copy(cShal); wu.uFog.value.copy(cHor);
    skyMesh.position.copy(cam);
    starMesh.position.copy(cam);
    starMesh.rotation.y = S.elapsed * 0.0025;
    starMat.opacity = clamp((nightF - 0.12) * 1.15, 0, 0.95);
    starMesh.visible = starMat.opacity > 0.01;
    sunSprite.position.copy(cam).addScaledVector(sunDir, 1280);
    sunSprite.material.opacity = smooth(-0.08, 0.14, e);
    sunSprite.visible = sunSprite.material.opacity > 0.01;
    moonSprite.position.copy(cam).addScaledVector(sunDir, -1280);
    moonSprite.material.opacity = clamp(nightF * 0.95, 0, 0.95);
    moonSprite.visible = moonSprite.material.opacity > 0.01;
  }

  /* ================= World Chunks & Architect NPCs ================= */
  const worldGroup = new THREE.Group(); scene.add(worldGroup);
  const solidAt = (x, y, z) => (y < 0) ? true : (x < 0 || x >= world.W || z < 0 || z >= world.D || y >= world.H) ? false : world.blocks[x + world.W * (z + world.D * y)] !== 0;
  function groundY(x, z, fromY) { for (let y = Math.min(world.H - 1, fromY); y >= 0; y--) if (solidAt(Math.floor(x), y, Math.floor(z))) return y + 1; return 1; }

  const npcs = [];
  function spawnArchitectNPCs() {
    const unitBox = new THREE.BoxGeometry(1, 1, 1);
    world.CATHEDRALS.forEach((c, idx) => {
      const sx = c.x + 2.6, sz = c.z + Math.floor(c.d / 2) + 2.2, gy = c.gy;
      const g = new THREE.Group(); g.position.set(sx, gy, sz);
      const body = new THREE.Mesh(unitBox, new THREE.MeshLambertMaterial({ color: c.robe })); body.scale.set(0.52, 0.82, 0.30); body.position.y = 0.98;
      const legs = new THREE.Mesh(unitBox, new THREE.MeshLambertMaterial({ color: 0x27272a })); legs.scale.set(0.46, 0.56, 0.26); legs.position.y = 0.28;
      const head = new THREE.Mesh(unitBox, new THREE.MeshLambertMaterial({ color: 0xf0c8a0 })); head.scale.set(0.34, 0.34, 0.34); head.position.y = 1.56;
      const hair = new THREE.Mesh(unitBox, new THREE.MeshLambertMaterial({ color: c.hair })); hair.scale.set(0.38, 0.14, 0.38); hair.position.y = 1.74;
      g.add(body, legs, head, hair); scene.add(g);

      // Sleek minimalist floating Architect nameplate
      const cv = document.createElement('canvas'); cv.width = 440; cv.height = 80;
      const x = cv.getContext('2d');
      x.fillStyle = 'rgba(11,17,30,0.74)'; x.beginPath(); x.roundRect(12, 10, 416, 60, 30); x.fill();
      x.strokeStyle = c.category === 'modern' ? 'rgba(56,189,248,0.78)' : 'rgba(251,191,36,0.78)'; x.lineWidth = 3; x.stroke();
      x.fillStyle = '#fef3c7'; x.font = '800 26px "PingFang SC", Georgia, serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
      x.fillText(`${c.architect.split('·')[0].trim()} · ${c.name}`, 220, 41);
      const tex = new THREE.CanvasTexture(cv);
      if (THREE.sRGBEncoding !== undefined) tex.encoding = THREE.sRGBEncoding;
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: true }));
      sp.scale.set(1.35, 0.25, 1); sp.position.set(sx, gy + 2.38, sz); scene.add(sp);
      npcs.push({ cat: c, grp: g, sp, x: sx, y: gy, z: sz, phase: idx * 0.7 });
    });
  }

  /* ================= Controls & Teleports ================= */
  function look(px, py, pz, tx, ty, tz) {
    const dx = tx - px, dy = ty - py, dz = tz - pz;
    return { yaw: Math.atan2(-dx, -dz), pitch: clamp(Math.atan2(dy, Math.hypot(dx, dz)), -1.45, 1.45) };
  }
  function setMode(m) {
    S.mode = m; player.fly = m === 'fly';
    if (m === 'tour') exitLock();
    $('crosshair').style.display = (m === 'walk' || m === 'fly') && !isTouch ? 'block' : 'none';
    updateHotbar();
  }
  function teleport(t) {
    const f = look(t.p[0], t.p[1] + 1.62, t.p[2], t.t[0], t.t[1], t.t[2]);
    player.yaw = f.yaw; player.pitch = f.pitch;
    const y = t.mode === 'walk' ? groundY(t.p[0], t.p[2], Math.floor(t.p[1] + 2)) : t.p[1];
    player.pos.set(t.p[0], y + 0.02, t.p[2]); player.vel.set(0, 0, 0);
    setMode(t.mode || 'walk');
  }
  function requestLock() {
    if (!isTouch && !S.ui && canvas.requestPointerLock && !document.pointerLockElement) {
      try { const p = canvas.requestPointerLock(); if (p && typeof p.catch === 'function') p.catch(() => {}); } catch (e) {}
    }
  }
  function exitLock() { if (document.pointerLockElement && document.exitPointerLock) document.exitPointerLock(); }
  document.addEventListener('pointerlockchange', () => { S.locked = document.pointerLockElement === canvas; });

  window.addEventListener('keydown', (e) => {
    if (e.code === 'Escape') {
      if (portals && portals.isDialogueOpen()) { portals.closeDialogue(); return; }
      if (portals && portals.isModalOpen()) { portals.closeModal(); return; }
    }
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
    if (S.ui) return;
    keys[e.code] = true;
    if (S.mode === 'tour' && !/^(F\d+|Tab|Escape|KeyT|KeyH|KeyE|KeyM)$/.test(e.code)) setMode('walk');
    if (e.code === 'KeyF') setMode(S.mode === 'fly' ? 'walk' : 'fly');
    if (e.code === 'KeyT') cycleTime();
    if (e.code === 'KeyH') $('hint').classList.toggle('show');
    if (e.code === 'KeyM' && portals) portals.openCompassModal();
    if (e.code === 'KeyE' && portals) { if (!portals.activateNearest()) portals.openCompassModal(); }
  });
  window.addEventListener('keyup', (e) => { keys[e.code] = false; });
  window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; });

  let dragging = false;
  canvas.addEventListener('mousedown', () => {
    if (S.ui) return;
    if (S.mode === 'tour') { setMode('walk'); requestLock(); return; }
    if (!S.locked) { requestLock(); dragging = true; return; }
    if (portals && portals.activateNearest()) return;
  });
  window.addEventListener('mouseup', () => { dragging = false; });
  window.addEventListener('mousemove', (e) => {
    if (S.ui || !(S.locked || dragging) || S.mode === 'tour') return;
    player.yaw -= (e.movementX || 0) * 0.0022;
    player.pitch = clamp(player.pitch - (e.movementY || 0) * 0.0022, -1.5, 1.5);
  });

  const HW = 0.3, PH = 1.8;
  function blocked(px, py, pz) {
    const x0 = Math.floor(px - HW), x1 = Math.floor(px + HW), y0 = Math.floor(py), y1 = Math.floor(py + PH - 0.01), z0 = Math.floor(pz - HW), z1 = Math.floor(pz + HW);
    for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) if (solidAt(x, y, z)) return true;
    return false;
  }
  function movePlayer(dt) {
    if (S.ui) return;
    const p = player;
    const fwd = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0);
    const side = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0);
    let ix = side, iz = -fwd; const l = Math.hypot(ix, iz); if (l > 1) { ix /= l; iz /= l; }
    const sin = Math.sin(p.yaw), cos = Math.cos(p.yaw);
    const wx = cos * ix + sin * iz, wz = -sin * ix + cos * iz;
    const sprint = !!(keys.ShiftLeft || keys.ShiftRight);
    const speed = p.fly ? (sprint ? 36 : 16) : (sprint ? 8.5 : 5.2);
    const k = p.fly ? 1 - Math.exp(-9 * dt) : 1 - Math.exp(-14 * dt);
    p.vel.x += (wx * speed - p.vel.x) * k; p.vel.z += (wz * speed - p.vel.z) * k;
    if (p.fly) {
      const vy = (keys.Space ? 1 : 0) - (keys.KeyC || sprint ? 1 : 0);
      p.vel.y += (vy * 12 - p.vel.y) * (1 - Math.exp(-9 * dt));
    } else {
      p.vel.y -= 30 * dt;
      if (keys.Space && p.onGround) { p.vel.y = 8.8; p.onGround = false; }
    }
    const steps = Math.max(1, Math.ceil(dt / 0.012)), h = dt / steps;
    for (let s = 0; s < steps; s++) {
      const nx = p.pos.x + p.vel.x * h;
      if (blocked(nx, p.pos.y, p.pos.z)) { if (p.onGround && !blocked(nx, p.pos.y + 1.05, p.pos.z)) { p.pos.y += 1.02; p.pos.x = nx; } else p.vel.x = 0; } else p.pos.x = nx;
      const nz = p.pos.z + p.vel.z * h;
      if (blocked(p.pos.x, p.pos.y, nz)) { if (p.onGround && !blocked(p.pos.x, p.pos.y + 1.05, nz)) { p.pos.y += 1.02; p.pos.z = nz; } else p.vel.z = 0; } else p.pos.z = nz;
      const ny = p.pos.y + p.vel.y * h;
      if (blocked(p.pos.x, ny, p.pos.z)) { if (p.vel.y < 0) { const sy = Math.floor(ny) + 1; if (!blocked(p.pos.x, sy, p.pos.z)) p.pos.y = sy; } p.vel.y = 0; } else p.pos.y = ny;
      p.onGround = !p.fly && p.vel.y <= 0 && blocked(p.pos.x, p.pos.y - 0.03, p.pos.z);
    }
    p.pos.x = clamp(p.pos.x, 4, world.W - 4); p.pos.z = clamp(p.pos.z, 4, world.D - 4);
  }

  let toastT = 0;
  function toast(msg) {
    const el = $('toast'); if (!el) return;
    el.textContent = msg; el.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('show'), 3200);
  }
  function cycleTime() {
    const presets = [6.5, 11.0, 17.7, 21.8];
    let i = presets.findIndex((p) => p > S.time + 0.1); if (i < 0) i = 0;
    setTime(presets[i]);
    toast(['🌅 圣殿晨曦 (06:30)', '☀️ 晴昼圣光 (11:00)', '🌇 彩玻黄昏 (17:42)', '🌌 圣夜灯火 (21:48)'][i]);
  }

  const SLOTS = [
    { ic: '🧭', tip: '教堂罗盘 (M)', act: () => portals && portals.openCompassModal() },
    { ic: '🚶', tip: '步行巡礼', act: () => { setMode('walk'); requestLock(); } },
    { ic: '🕊️', tip: '自由飞行 (F)', act: () => { setMode('fly'); requestLock(); } },
    { ic: '🎥', tip: '环岛航拍', act: () => setMode('tour') },
    { ic: '🌅', tip: '切换光影 (T)', act: () => cycleTime() },
    { ic: '❓', tip: '操作说明 (H)', act: () => $('hint').classList.toggle('show') }
  ];
  function buildHotbar() {
    const hb = $('hotbar'); hb.innerHTML = '';
    SLOTS.forEach((s, i) => {
      const el = document.createElement('div'); el.className = 'slot'; el.id = 'slot' + i;
      el.innerHTML = `${s.ic}<em>${s.tip}</em>`;
      el.addEventListener('mousedown', (e) => e.stopPropagation());
      el.addEventListener('click', () => s.act());
      hb.appendChild(el);
    });
    updateHotbar();
  }
  function updateHotbar() {
    SLOTS.forEach((s, i) => {
      const el = $('slot' + i); if (!el) return;
      el.classList.toggle('on', (i === 1 && S.mode === 'walk') || (i === 2 && S.mode === 'fly') || (i === 3 && S.mode === 'tour'));
    });
  }
  $('timeSlider').addEventListener('input', (e) => { S.time = parseFloat(e.target.value); });
  ['mousedown', 'touchstart'].forEach((ev) => {
    $('timeSlider').addEventListener(ev, (e) => e.stopPropagation());
    $('mmWrap').addEventListener(ev, (e) => e.stopPropagation());
  });

  /* ================= Minimap ================= */
  let mmBase = null;
  function buildMinimap() {
    const c = document.createElement('canvas'); c.width = world.W; c.height = world.D;
    const x = c.getContext('2d'), im = x.createImageData(world.W, world.D), d = im.data;
    for (let z = 0; z < world.D; z++) for (let xx = 0; xx < world.W; xx++) {
      const i = xx + z * world.W, y = world.topH[i], col = world.palette[world.topC[i]] || [90, 140, 70];
      const o = i * 4;
      if (y <= world.WATER_Y) { d[o] = 44; d[o + 1] = 128; d[o + 2] = 158; d[o + 3] = 255; }
      else { d[o] = Math.round(col[0] * 255); d[o + 1] = Math.round(col[1] * 255); d[o + 2] = Math.round(col[2] * 255); d[o + 3] = 255; }
    }
    x.putImageData(im, 0, 0);
    world.CATHEDRALS.forEach((cat) => {
      x.fillStyle = cat.category === 'modern' ? '#38bdf8' : '#f59e0b';
      x.fillRect(cat.x - 4, cat.z - 4, 9, 9);
    });
    mmBase = c;
  }
  function drawMinimap() {
    if (!mmBase) return;
    const cv = $('mm'), x = cv.getContext('2d');
    x.drawImage(mmBase, 0, 0, cv.width, cv.height);
    const px = camera.position.x / world.W * cv.width, pz = camera.position.z / world.D * cv.height;
    x.fillStyle = '#fff'; x.beginPath(); x.arc(px, pz, 3.5, 0, Math.PI * 2); x.fill();
  }

  /* ================= Boot & Main Loop ================= */
  async function boot() {
    const bar = $('bar').firstElementChild, msg = $('loadMsg');
    msg.textContent = '正在雕琢世界 Top 20 教堂岛屿地形…'; bar.style.width = '18%'; await nextFrame();
    world = VW.create();

    msg.textContent = '正在烘焙石材、琉璃瓦与大理石纹理…'; bar.style.width = '36%'; await nextFrame();
    const atlas = new THREE.CanvasTexture(PITex.buildCanvas());
    atlas.magFilter = THREE.NearestFilter; atlas.minFilter = THREE.LinearMipmapLinearFilter;
    matWorld.map = matGlow.map = matLit.map = atlas;

    msg.textContent = '正在构建岛屿区块…'; bar.style.width = '56%'; await nextFrame();
    const CX = Math.ceil(world.W / CH), CZ = Math.ceil(world.D / CH);
    for (let cz = 0; cz < CZ; cz++) for (let cx = 0; cx < CX; cx++) {
      const g = PIMesher.buildChunk(world, cx, cz, CH);
      if (g.opaque) { const m = new THREE.Mesh(g.opaque, matWorld); m.castShadow = m.receiveShadow = true; worldGroup.add(m); }
      if (g.glow) { const m = new THREE.Mesh(g.glow, matGlow); worldGroup.add(m); }
      if (g.lit) { const m = new THREE.Mesh(g.lit, matLit); worldGroup.add(m); }
    }

    msg.textContent = '正在营造 15 座天主教大教堂与 5 座现当代新式圣殿…'; bar.style.width = '82%'; await nextFrame();
    props = CIProps.build(world, THREE, scene);
    spawnArchitectNPCs();
    buildMinimap();
    buildHotbar();

    portals = CIPortals.attach({
      world, player, teleport, toast, setTime, exitLock,
      setUI: (flag) => { S.ui = !!flag; if (flag) exitLock(); }
    });
    $('compass-top-btn').onclick = () => portals.openCompassModal();

    // Start facing St. Peter's Basilica!
    const stLm = world.landmarks[0];
    if (stLm) teleport(stLm.tp);

    bar.style.width = '100%';
    $('loading').classList.add('done');

    let last = performance.now();
    function loop(now) {
      requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - last) / 1000); last = now; S.elapsed += dt;
      if (S.mode === 'tour') {
        S.tourT = (S.tourT + dt) % world.tour.dur;
        const pts = world.tour.cam, tgts = world.tour.tgt, n = pts.length;
        const u = (S.tourT / world.tour.dur) * n, i0 = Math.floor(u) % n, i1 = (i0 + 1) % n, f = u - Math.floor(u);
        const s = f * f * (3 - 2 * f);
        camera.position.set(lerp(pts[i0][0], pts[i1][0], s), lerp(pts[i0][1], pts[i1][1], s), lerp(pts[i0][2], pts[i1][2], s));
        camera.lookAt(lerp(tgts[i0][0], tgts[i1][0], s), lerp(tgts[i0][1], tgts[i1][1], s), lerp(tgts[i0][2], tgts[i1][2], s));
      } else {
        movePlayer(dt);
        camera.position.set(player.pos.x, player.pos.y + 1.62, player.pos.z);
        camera.rotation.set(player.pitch, player.yaw, 0, 'YXZ');
      }
      updateSky(camera.position);
      sun.position.copy(camera.position).addScaledVector(lightDir, 150);
      sun.target.position.copy(camera.position); sun.target.updateMatrixWorld();

      // Update nearest interior warm lights
      const nearL = world.lamps.map((L) => ({ L, d: Math.hypot(L[0] - camera.position.x, L[2] - camera.position.z) })).sort((a, b) => a.d - b.d);
      for (let i = 0; i < lampLights.length; i++) {
        const rec = nearL[i];
        if (rec && rec.d < 36) {
          lampLights[i].position.set(rec.L[0], rec.L[1], rec.L[2]);
          lampLights[i].intensity = (rec.L[3] ? 0.85 : 0.45 + nightF * 0.8) * (rec.L[4] || 1);
        } else lampLights[i].intensity = 0;
      }

      // Face Architect NPCs toward visitor
      for (const n of npcs) {
        const d = Math.hypot(player.pos.x - n.x, player.pos.z - n.z);
        if (d < 12) n.grp.rotation.y = Math.atan2(player.pos.x - n.x, player.pos.z - n.z);
        n.sp.position.y = n.y + 2.38 + Math.sin(S.elapsed * 2.2 + n.phase) * 0.04;
      }

      if (props) props.update(dt, S.elapsed, camera.position, nightF);
      waterMat.uniforms.uTime.value = S.elapsed;
      S.hudT += dt;
      if (S.hudT > 0.12) {
        S.hudT = 0;
        drawMinimap();
        if (portals) portals.checkProximity();
      }
      renderer.render(scene, camera);
    }
    requestAnimationFrame(loop);
  }
  boot();
})();
