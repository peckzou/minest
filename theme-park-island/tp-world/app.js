/* Minest My World · Imagineering Theme Park — Main 3D Runtime, Seated Ride Camera & Night Fireworks Engine. */
(function () {
  'use strict';
  const VW = window.TPWorld, CH = 32;
  const $ = (id) => document.getElementById(id);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const nextFrame = () => new Promise((r) => requestAnimationFrame(() => r()));
  const V3 = THREE.Vector3;
  const qs = new URLSearchParams(location.search);
  const isTouch = ('ontouchstart' in window) || matchMedia('(pointer:coarse)').matches;
  if (isTouch) document.body.classList.add('touch');

  const canvas = $('gl');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !isTouch, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
  if (THREE.ACESFilmicToneMapping !== undefined) {
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.06;
  }
  const wantShadow = qs.get('q') !== 'low' && !(isTouch && qs.get('shadow') !== '1');
  renderer.shadowMap.enabled = wantShadow;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0xbcdcf4, 0.00095);
  const camera = new THREE.PerspectiveCamera(68, 1, 0.1, 3000);
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
    mode: qs.get('mode') || 'walk', ui: false, time: parseFloat(qs.get('t')) || 15.2,
    tourT: 0, locked: false, elapsed: 0,
    activeRide: null, rideThirdPerson: false, rideLookYaw: 0, rideLookPitch: 0
  };
  const keys = Object.create(null);
  const player = { pos: new V3(192.5, 40, 292), vel: new V3(), yaw: 0, pitch: 0.08, onGround: false, fly: false };

  const hemi = new THREE.HemisphereLight(0xd8ecff, 0x6a5a48, 0.68);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffffff, 0.86);
  sun.castShadow = wantShadow;
  sun.shadow.mapSize.set(1024, 1024);
  const SH = 95;
  Object.assign(sun.shadow.camera, { left: -SH, right: SH, top: SH, bottom: -SH, near: 1, far: 420 });
  sun.shadow.camera.updateProjectionMatrix();
  sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.03;
  scene.add(sun, sun.target);

  const lampLights = [];
  for (let i = 0; i < 4; i++) {
    const l = new THREE.PointLight(0xffd28a, 0, 28, 1.5);
    lampLights.push(l); scene.add(l);
  }

  /* ================= Sky, Stars, Sun/Moon & Water ================= */
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

  // 1,600-star night sky
  const starGeo = new THREE.BufferGeometry();
  const starPos = new Float32Array(1600 * 3), starCol = new Float32Array(1600 * 3);
  for (let i = 0; i < 1600; i++) {
    const th = Math.random() * Math.PI * 2, ph = Math.acos(Math.pow(Math.random(), 0.72)), r = 1380;
    starPos[i * 3] = Math.sin(ph) * Math.cos(th) * r;
    starPos[i * 3 + 1] = Math.cos(ph) * r;
    starPos[i * 3 + 2] = Math.sin(ph) * Math.sin(th) * r;
    const br = 0.68 + Math.random() * 0.32;
    starCol[i * 3] = br; starCol[i * 3 + 1] = br * 0.96; starCol[i * 3 + 2] = br;
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
    gr.addColorStop(0, inner); gr.addColorStop(0.28, mid); gr.addColorStop(0.65, outer); gr.addColorStop(1, 'rgba(0,0,0,0)');
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

  // Soft Painterly Florida Cumulus Clouds drifting across the Magic Kingdom sky!
  function makeCloudTex() {
    const cv = document.createElement('canvas'); cv.width = 256; cv.height = 128;
    const g = cv.getContext('2d');
    const puffs = [[72, 74, 48], [118, 56, 56], [166, 66, 48], [198, 82, 34], [48, 84, 32]];
    for (const [px, py, pr] of puffs) {
      const gr = g.createRadialGradient(px, py - pr * 0.2, pr * 0.1, px, py, pr);
      gr.addColorStop(0, 'rgba(255,255,255,0.92)');
      gr.addColorStop(0.55, 'rgba(240,246,255,0.58)');
      gr.addColorStop(1, 'rgba(240,246,255,0)');
      g.fillStyle = gr; g.beginPath(); g.arc(px, py, pr, 0, Math.PI * 2); g.fill();
    }
    return new THREE.CanvasTexture(cv);
  }
  const cloudTex = makeCloudTex();
  const cloudMat = new THREE.SpriteMaterial({ map: cloudTex, transparent: true, opacity: 0.72, depthWrite: false, fog: false });
  const cloudGrp = new THREE.Group();
  cloudGrp.renderOrder = -7;
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 + (i % 3) * 0.18;
    const dist = 290 + (i % 4) * 55;
    const sp = new THREE.Sprite(cloudMat);
    sp.position.set(Math.cos(a) * dist, 72 + (i % 5) * 16, Math.sin(a) * dist);
    const sc = 90 + (i % 4) * 28;
    sp.scale.set(sc * 1.85, sc * 0.85, 1);
    cloudGrp.add(sp);
  }
  scene.add(cloudGrp);

  const farFloor = new THREE.Mesh(new THREE.PlaneGeometry(6000, 6000), new THREE.MeshLambertMaterial({ color: 0x1e5874 }));
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
      ' vec3 N = normalize(vec3((n1-0.5)*0.30, 1.0, (n2-0.5)*0.30)); vec3 V = normalize(cameraPosition - vW);',
      ' float fr = pow(1.0 - max(dot(N,V),0.0), 3.0);',
      ' vec3 col = mix(mix(uDeep, uShallow, n1*0.55 + n2*0.25 + 0.12), uSky, fr*0.75);',
      ' vec3 R = reflect(-uSunDir, N); col += uSunCol * pow(max(dot(R,V),0.0), 110.0) * 1.4;',
      ' float fog = 1.0 - exp(-uFogD*uFogD*vD*vD); gl_FragColor = vec4(mix(col, uFog, fog), mix(0.76, 0.94, fr)); }'
    ].join('\n')
  });
  const waterMesh = new THREE.Mesh(new THREE.PlaneGeometry(1400, 1400), waterMat);
  waterMesh.rotation.x = -Math.PI / 2; waterMesh.position.set(272, VW.WATER_Y, 272); waterMesh.renderOrder = 5; scene.add(waterMesh);

  const KEYS = [
    [0, 0x050818, 0x10183c, 0x04101c, 0x0a2838], [6.3, 0x3a64a8, 0xf6a67e, 0x0e2a38, 0x2a6a74],
    [10.8, 0x2688f0, 0xc2e2fa, 0x14507a, 0x45a4ba], [17.7, 0x5678c8, 0xf9b27a, 0x123a48, 0x3a7478],
    [20.6, 0x0c1234, 0x322b58, 0x061824, 0x10303e], [24, 0x050818, 0x10183c, 0x04101c, 0x0a2838]
  ];
  const cTop = new THREE.Color(), cHor = new THREE.Color(), cDeep = new THREE.Color(), cShal = new THREE.Color(), cTmp = new THREE.Color();
  function sampleKey(t, idx, out) {
    let i = 0; while (i < KEYS.length - 2 && t >= KEYS[i + 1][0]) i++;
    const a = KEYS[i], b = KEYS[i + 1], f = clamp((t - a[0]) / (b[0] - a[0]), 0, 1);
    out.setHex(a[idx]); out.lerp(cTmp.setHex(b[idx]), f);
  }
  const sunDir = new V3(), lightDir = new V3(), sunCol = new THREE.Color();
  const warmCol = new THREE.Color(1.0, 0.62, 0.34), whiteCol = new THREE.Color(1.0, 0.98, 0.94), moonCol = new THREE.Color(0.58, 0.72, 1.0);
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
    if (e > -0.02) { lightDir.copy(sunDir); sun.color.copy(sunCol); sun.intensity = 0.08 + 0.85 * smooth(-0.02, 0.32, e); }
    else { lightDir.copy(sunDir).negate(); sun.color.copy(moonCol); sun.intensity = 0.44 * smooth(0, 0.25, -e); }
    hemi.color.setRGB(lerp(0.26, 0.80, dayF), lerp(0.32, 0.88, dayF), lerp(0.54, 1.0, dayF)).lerp(cHor, 0.22);
    hemi.groundColor.setRGB(lerp(0.12, 0.46, dayF), lerp(0.12, 0.42, dayF), lerp(0.18, 0.36, dayF));
    hemi.intensity = lerp(0.58, 0.70, dayF);
    skyMat.uniforms.uTop.value.copy(cTop); skyMat.uniforms.uHor.value.copy(cHor);
    skyMat.uniforms.uSunDir.value.copy(sunDir); skyMat.uniforms.uSunCol.value.copy(sunCol);
    scene.fog.color.copy(cHor); renderer.setClearColor(cHor);
    const wu = waterMat.uniforms;
    wu.uSunDir.value.copy(lightDir); wu.uSunCol.value.copy(sun.color);
    wu.uSky.value.copy(cHor).lerp(cTop, 0.35); wu.uDeep.value.copy(cDeep); wu.uShallow.value.copy(cShal); wu.uFog.value.copy(cHor);
    if (THREE.ACESFilmicToneMapping !== undefined) {
      renderer.toneMappingExposure = lerp(1.06, 1.22, nightF);
    }
    skyMesh.position.copy(cam);
    starMesh.position.copy(cam);
    starMesh.rotation.y = S.elapsed * 0.0025;
    starMat.opacity = clamp((nightF - 0.10) * 1.15, 0, 0.95);
    starMesh.visible = starMat.opacity > 0.01;
    sunSprite.position.copy(cam).addScaledVector(sunDir, 1280);
    sunSprite.material.opacity = smooth(-0.08, 0.14, e);
    sunSprite.visible = sunSprite.material.opacity > 0.01;
    moonSprite.position.copy(cam).addScaledVector(sunDir, -1280);
    moonSprite.material.opacity = clamp(nightF * 0.95, 0, 0.95);
    moonSprite.visible = moonSprite.material.opacity > 0.01;
    cloudGrp.position.set(cam.x, 42, cam.z);
    cloudGrp.rotation.y = S.elapsed * 0.0045;
    cloudMat.color.copy(whiteCol).lerp(cHor, 0.35);
    cloudMat.opacity = lerp(0.14, 0.74, dayF);
  }

  /* ================= World Chunks & Cast Member NPCs ================= */
  const worldGroup = new THREE.Group(); scene.add(worldGroup);
  const solidAt = (x, y, z) => (y < 0) ? true : (x < 0 || x >= world.W || z < 0 || z >= world.D || y >= world.H) ? false : world.blocks[x + world.W * (z + world.D * y)] !== 0;
  function groundY(x, z, fromY) { for (let y = Math.min(world.H - 1, fromY); y >= 0; y--) if (solidAt(Math.floor(x), y, Math.floor(z))) return y + 1; return 1; }

  const npcs = [];
  function spawnParkHosts() {
    const unitBox = new THREE.BoxGeometry(1, 1, 1);
    world.LANDS.forEach((land) => {
      const sx = land.x + 3.5, sz = land.z + 6.5, gy = world.PARK_Y;
      const g = new THREE.Group(); g.position.set(sx, gy, sz);
      const body = new THREE.Mesh(unitBox, new THREE.MeshLambertMaterial({ color: land.robe })); body.scale.set(0.52, 0.82, 0.30); body.position.y = 0.98;
      const legs = new THREE.Mesh(unitBox, new THREE.MeshLambertMaterial({ color: 0x1e293b })); legs.scale.set(0.46, 0.56, 0.26); legs.position.y = 0.28;
      const head = new THREE.Mesh(unitBox, new THREE.MeshLambertMaterial({ color: 0xf4cfa8 })); head.scale.set(0.34, 0.34, 0.34); head.position.y = 1.56;
      const hair = new THREE.Mesh(unitBox, new THREE.MeshLambertMaterial({ color: land.hair })); hair.scale.set(0.38, 0.16, 0.38); hair.position.y = 1.75;
      g.add(body, legs, head, hair); scene.add(g);

      const cv = document.createElement('canvas'); cv.width = 420; cv.height = 72;
      const x = cv.getContext('2d');
      x.fillStyle = 'rgba(15,23,42,0.78)'; x.beginPath(); x.roundRect(10, 8, 400, 56, 28); x.fill();
      x.strokeStyle = land.color; x.lineWidth = 3; x.stroke();
      x.fillStyle = '#fef3c7'; x.font = '800 24px "PingFang SC", sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
      x.fillText(`${land.badge} · ${land.host.split('·')[0].trim()}`, 210, 36);
      const tex = new THREE.CanvasTexture(cv);
      if (THREE.sRGBEncoding !== undefined) tex.encoding = THREE.sRGBEncoding;
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
      sp.scale.set(1.45, 0.25, 1); sp.position.set(sx, gy + 2.4, sz); scene.add(sp);
      npcs.push({ land, grp: g, x: sx, y: gy, z: sz });
    });
  }

  /* ================= Ride System (Board / Toggle / Camera / Exit) ================= */
  function boardRide(rideId) {
    if (!props || !props.rides[rideId]) return;
    exitLock();
    S.activeRide = rideId;
    S.mode = 'ride';
    S.rideThirdPerson = false;
    S.rideLookYaw = 0; S.rideLookPitch = 0;
    const r = props.rides[rideId];
    r.start();
    updateRideHud();
    toast(`🎢 已登上「${r.name}」！拖动鼠标可自由环顾，按 Esc 或点击离开设施`);
  }

  function exitRide() {
    if (!S.activeRide || !props) return;
    const r = props.rides[S.activeRide];
    if (r) {
      if (r.onExit) r.onExit();
      else if (r.id !== 'carousel') r.stop();
      player.pos.set(r.exitPos.x, r.exitPos.y + 0.05, r.exitPos.z);
      player.yaw = r.exitPos.yaw || 0;
      player.pitch = 0.05;
      player.vel.set(0, 0, 0);
    }
    S.activeRide = null;
    setMode('walk');
    updateRideHud();
    toast('🚶 已安全离开游乐设施，恢复自由探索');
  }

  function updateRideHud() {
    const bar = $('tp-ride-bar');
    if (!bar) return;
    if (!S.activeRide) { bar.style.display = 'none'; return; }
    const r = props.rides[S.activeRide];
    bar.style.display = 'flex';
    $('tp-ride-title').textContent = r.getHudInfo ? `🛸 ${r.getHudInfo()}` : `🎢 正在乘坐：${r.name}`;
    $('tp-ride-toggle').textContent = r.isRunning() ? '⏸️ 暂停' : '▶️ 启动';
    $('tp-ride-cam').textContent = S.rideThirdPerson ? '👁️ 第一人称视角' : '📷 第三人称视角';
    const fb = $('tp-ride-fire'), hb = $('tp-ride-hyper');
    if (fb) fb.style.display = r.fire ? 'inline-block' : 'none';
    if (hb) hb.style.display = r.hyperjump ? 'inline-block' : 'none';
  }

  function launchFireworks() {
    if (S.time > 6.5 && S.time < 20.5) setTime(21.6);
    if (props) props.triggerFireworks();
    if (portals) { portals.playFanfare(); setTimeout(() => portals.playFireworkBoom(), 650); }
    const castleLand = world.LANDS.find((l) => l.id === 'castle');
    if (castleLand && !S.activeRide) teleport(castleLand.tp);
    toast('🎆 星光童话城堡夜间烟花灯光秀盛大开启！');
  }

  /* ================= Controls, Teleports & UI ================= */
  function look(px, py, pz, tx, ty, tz) {
    const dx = tx - px, dy = ty - py, dz = tz - pz;
    return { yaw: Math.atan2(-dx, -dz), pitch: clamp(Math.atan2(dy, Math.hypot(dx, dz)), -1.45, 1.45) };
  }
  function setMode(m) {
    if (S.activeRide && m !== 'ride') exitRide();
    S.mode = m; player.fly = m === 'fly';
    if (m === 'tour') exitLock();
    $('crosshair').style.display = (m === 'walk' || m === 'fly') && !isTouch ? 'block' : 'none';
    updateHotbar();
  }
  function teleport(t) {
    if (S.activeRide) exitRide();
    const f = look(t.p[0], t.p[1] + 1.62, t.p[2], t.t[0], t.t[1], t.t[2]);
    player.yaw = f.yaw; player.pitch = f.pitch;
    const y = t.mode === 'walk' ? groundY(t.p[0], t.p[2], Math.floor(t.p[1] + 2)) : t.p[1];
    player.pos.set(t.p[0], y + 0.02, t.p[2]); player.vel.set(0, 0, 0);
    setMode(t.mode || 'walk');
  }
  function requestLock() {
    if (!isTouch && !S.ui && !S.activeRide && canvas.requestPointerLock && !document.pointerLockElement) {
      try { const p = canvas.requestPointerLock(); if (p && typeof p.catch === 'function') p.catch(() => {}); } catch (e) {}
    }
  }
  function exitLock() { if (document.pointerLockElement && document.exitPointerLock) document.exitPointerLock(); }
  document.addEventListener('pointerlockchange', () => { S.locked = document.pointerLockElement === canvas; });

  window.addEventListener('keydown', (e) => {
    if (e.code === 'Escape') {
      if (S.activeRide) { exitRide(); return; }
      if (portals && portals.isDialogueOpen()) { portals.closeDialogue(); return; }
      if (portals && portals.isModalOpen()) { portals.closeModal(); return; }
    }
    if (S.ui) return;
    keys[e.code] = true;
    if (e.code === 'KeyF' && !S.activeRide) setMode(S.mode === 'fly' ? 'walk' : 'fly');
    if (e.code === 'KeyT') cycleTime();
    if (e.code === 'KeyN') launchFireworks();
    if (e.code === 'KeyH') $('hint').classList.toggle('show');
    if (e.code === 'KeyM' && portals) portals.openGuideModal();
    if (e.code === 'KeyE' && portals && !S.activeRide) { if (!portals.activateNearest()) portals.openGuideModal(); }
  });
  window.addEventListener('keyup', (e) => { keys[e.code] = false; });
  window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; });

  let dragging = false;
  canvas.addEventListener('mousedown', () => {
    if (S.ui) return;
    dragging = true;
    if (S.activeRide) return;
    if (S.mode === 'tour') { setMode('walk'); requestLock(); return; }
    if (!S.locked) { requestLock(); return; }
    if (portals && portals.activateNearest()) return;
  });
  window.addEventListener('mouseup', () => { dragging = false; });
  window.addEventListener('mousemove', (e) => {
    if (S.ui || !(S.locked || dragging)) return;
    if (S.activeRide) {
      S.rideLookYaw = clamp(S.rideLookYaw - (e.movementX || 0) * 0.003, -1.6, 1.6);
      S.rideLookPitch = clamp(S.rideLookPitch - (e.movementY || 0) * 0.003, -0.7, 0.85);
      return;
    }
    if (S.mode === 'tour') return;
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
    if (S.ui || S.activeRide) return;
    const p = player;
    const fwd = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0);
    const side = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0);
    let ix = side, iz = -fwd; const l = Math.hypot(ix, iz); if (l > 1) { ix /= l; iz /= l; }
    const sin = Math.sin(p.yaw), cos = Math.cos(p.yaw);
    const wx = cos * ix + sin * iz, wz = -sin * ix + cos * iz;
    const sprint = !!(keys.ShiftLeft || keys.ShiftRight);
    const speed = p.fly ? (sprint ? 36 : 16) : (sprint ? 9.5 : 5.8);
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
    p.pos.x = clamp(p.pos.x, 8, world.W - 8); p.pos.z = clamp(p.pos.z, 8, world.D - 8);
  }

  let toastT = 0;
  function toast(msg) {
    const el = $('toast'); if (!el) return;
    el.textContent = msg; el.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('show'), 3600);
  }
  function cycleTime() {
    const presets = [6.5, 11.0, 17.7, 21.8];
    let i = presets.findIndex((p) => p > S.time + 0.1); if (i < 0) i = 0;
    setTime(presets[i]);
    toast(['🌅 乐园晨曦 (06:30)', '☀️ 晴昼魔法 (11:00)', '🌇 童话黄昏 (17:42)', '🌌 星夜城堡 (21:48)'][i]);
  }

  const SLOTS = [
    { ic: '🗺️', tip: '乐园导览图 (M)', act: () => portals && portals.openGuideModal() },
    { ic: '🚶', tip: '步行游园', act: () => { setMode('walk'); requestLock(); } },
    { ic: '🕊️', tip: '自由飞行 (F)', act: () => { setMode('fly'); requestLock(); } },
    { ic: '🎥', tip: '全园航拍', act: () => setMode('tour') },
    { ic: '🎆', tip: '烟花灯光秀 (N)', act: () => launchFireworks() },
    { ic: '🌅', tip: '切换昼夜 (T)', act: () => cycleTime() },
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

  $('tp-ride-fire').onclick = () => {
    if (!S.activeRide) return;
    const r = props.rides[S.activeRide];
    if (r && r.fire) r.fire((evMsg) => toast(evMsg));
  };
  $('tp-ride-hyper').onclick = () => {
    if (!S.activeRide) return;
    const r = props.rides[S.activeRide];
    if (r && r.hyperjump) r.hyperjump((evMsg) => toast(evMsg));
  };
  $('tp-ride-toggle').onclick = () => {
    if (!S.activeRide) return;
    const r = props.rides[S.activeRide];
    if (r.isRunning()) r.stop(); else { r.start(); portals.playRideAudio(r.id); }
    updateRideHud();
  };
  $('tp-ride-cam').onclick = () => {
    S.rideThirdPerson = !S.rideThirdPerson;
    S.rideLookYaw = 0; S.rideLookPitch = 0;
    updateRideHud();
  };
  $('tp-ride-exit').onclick = exitRide;

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
      const i = xx + z * world.W, y = world.topH[i], col = world.palette[world.topC[i]] || [0.35, 0.65, 0.3];
      const o = i * 4;
      if (y <= world.WATER_Y) { d[o] = 40; d[o + 1] = 136; d[o + 2] = 172; d[o + 3] = 255; }
      else { d[o] = Math.round(col[0] * 255); d[o + 1] = Math.round(col[1] * 255); d[o + 2] = Math.round(col[2] * 255); d[o + 3] = 255; }
    }
    x.putImageData(im, 0, 0);
    world.LANDS.forEach((l) => {
      x.fillStyle = l.color;
      x.beginPath(); x.arc(l.x, l.z, 7, 0, Math.PI * 2); x.fill();
    });
    mmBase = c;
  }
  function drawMinimap() {
    if (!mmBase) return;
    const cv = $('mm'), x = cv.getContext('2d');
    x.drawImage(mmBase, 0, 0, cv.width, cv.height);
    const px = camera.position.x / world.W * cv.width, pz = camera.position.z / world.D * cv.height;
    x.fillStyle = '#fff'; x.beginPath(); x.arc(px, pz, 3.8, 0, Math.PI * 2); x.fill();
  }

  /* ================= Boot & Main Loop ================= */
  async function boot() {
    const bar = $('bar').firstElementChild, msg = $('loadMsg');
    msg.textContent = '正在铺设奇想主题乐园五大分区地形与护城河…'; bar.style.width = '22%'; await nextFrame();
    world = VW.create();

    msg.textContent = '正在烘焙乐园砖石、彩瓦与霓虹纹理…'; bar.style.width = '44%'; await nextFrame();
    const atlas = new THREE.CanvasTexture(PITex.buildCanvas());
    atlas.magFilter = THREE.NearestFilter; atlas.minFilter = THREE.LinearMipmapLinearFilter;
    matWorld.map = matGlow.map = matLit.map = atlas;

    msg.textContent = '正在构建岛屿区块…'; bar.style.width = '64%'; await nextFrame();
    const CX = Math.ceil(world.W / CH), CZ = Math.ceil(world.D / CH);
    for (let cz = 0; cz < CZ; cz++) for (let cx = 0; cx < CX; cx++) {
      const g = PIMesher.buildChunk(world, cx, cz, CH);
      if (g.opaque) { const m = new THREE.Mesh(g.opaque, matWorld); m.castShadow = m.receiveShadow = true; worldGroup.add(m); }
      if (g.glow) { const m = new THREE.Mesh(g.glow, matGlow); worldGroup.add(m); }
      if (g.lit) { const m = new THREE.Mesh(g.lit, matLit); worldGroup.add(m); }
    }

    msg.textContent = '正在搭建星光城堡、维多利亚主街与三大可乘坐游乐设施…'; bar.style.width = '86%'; await nextFrame();
    props = TPProps.build(world, THREE, scene);
    spawnParkHosts();
    buildMinimap();
    buildHotbar();

    portals = TPPortals.attach({
      world, props, player, teleport, toast, setTime, exitLock, boardRide, launchFireworks,
      setUI: (flag) => { S.ui = !!flag; if (flag) exitLock(); }
    });
    $('guide-top-btn').onclick = () => portals.openGuideModal();

    // Start on Main Street looking straight down the iconic Disneyland axial vista toward Starlight Castle!
    const startLand = world.LANDS.find((l) => l.id === 'main_street');
    if (startLand) teleport(startLand.tp);

    bar.style.width = '100%';
    $('loading').classList.add('done');

    let last = performance.now(), frameN = 0;
    function loop(now) {
      requestAnimationFrame(loop);
      if (document.hidden) { last = now; return; }
      const dt = Math.min(0.05, (now - last) / 1000); last = now; S.elapsed += dt;

      if (props) props.update(dt, S.time, camera.position, nightF, (evMsg) => toast(evMsg));

      if (S.activeRide && props && props.rides[S.activeRide]) {
        const r = props.rides[S.activeRide];
        if (r.steer) {
          const sx = (keys['KeyD'] || keys['ArrowRight'] ? 1 : 0) - (keys['KeyA'] || keys['ArrowLeft'] ? 1 : 0);
          const sy = (keys['KeyW'] || keys['ArrowUp'] ? 1 : 0) - (keys['KeyS'] || keys['ArrowDown'] ? 1 : 0);
          if (sx || sy) r.steer(sx * dt * 11, sy * dt * 8);
        }
        if (r.fire && keys['Space']) r.fire((evMsg) => toast(evMsg));
        if (r.hyperjump && keys['KeyH']) { keys['KeyH'] = false; r.hyperjump((evMsg) => toast(evMsg)); }
        if (r.getHudInfo && (frameN % 10) === 0) $('tp-ride-title').textContent = `🛸 ${r.getHudInfo()}`;
        const pose = r.getCameraPose(S.rideThirdPerson);
        camera.position.set(pose.px, pose.py, pose.pz);
        const f = look(pose.px, pose.py, pose.pz, pose.tx, pose.ty, pose.tz);
        camera.rotation.set(clamp(f.pitch + S.rideLookPitch, -1.2, 1.2), f.yaw + S.rideLookYaw, 0, 'YXZ');
        if (!r.isRunning()) updateRideHud();
      } else if (S.mode === 'tour') {
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

      const nearL = world.lamps.map((L) => ({ L, d: Math.hypot(L[0] - camera.position.x, L[2] - camera.position.z) })).sort((a, b) => a.d - b.d);
      for (let i = 0; i < lampLights.length; i++) {
        const rec = nearL[i];
        if (rec && rec.d < 42) {
          lampLights[i].position.set(rec.L[0], rec.L[1], rec.L[2]);
          lampLights[i].intensity = (rec.L[3] ? 0.9 : 0.45 + nightF * 0.9) * (rec.L[4] || 1);
        } else lampLights[i].intensity = 0;
      }

      for (const n of npcs) {
        const d = Math.hypot(player.pos.x - n.x, player.pos.z - n.z);
        if (d < 14) n.grp.rotation.y = Math.atan2(player.pos.x - n.x, player.pos.z - n.z);
      }

      if (portals) portals.checkProximity(S.activeRide);
      waterMat.uniforms.uTime.value = S.elapsed;
      if ((frameN++ % 3) === 0) drawMinimap();
      renderer.render(scene, camera);
    }
    requestAnimationFrame(loop);
  }
  boot();
})();
