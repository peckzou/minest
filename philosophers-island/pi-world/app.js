/* Philosophers' Island (哲学家体素小岛) — Main 3D Application & Voxel Engine Runtime.
 * Walk, fly or watch the aerial tour across the 6 Epistemological Districts and 20 Philosopher Residences;
 * step down into Plato's Underground Allegory Cave, climb up to Kant's 2F Starry Loft, converse with the 20 Philosopher NPCs,
 * and activate the 20 Spatial InteractionPortals (E / click / tap). */
(function () {
  'use strict';
  const VW = window.PIWorld, B = VW.B;
  const CH = 32;
  const $ = (id) => document.getElementById(id);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const wrapAngle = (a) => { while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; return a; };
  const rr = (a, b) => a + Math.random() * (b - a);
  const nextFrame = () => new Promise((r) => requestAnimationFrame(() => r()));
  const V3 = THREE.Vector3;
  const qs = new URLSearchParams(location.search);
  const isTouch = ('ontouchstart' in window) || matchMedia('(pointer:coarse)').matches;
  if (isTouch) document.body.classList.add('touch');

  /* ================= renderer / scene ================= */
  const canvas = $('gl');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !isTouch, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isTouch ? 1.5 : 2));
  const wantShadow = qs.get('q') !== 'low' && !(isTouch && qs.get('shadow') !== '1');
  renderer.shadowMap.enabled = wantShadow;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0xbcdcf4, 0.0011);
  const camera = new THREE.PerspectiveCamera(72, 1, 0.1, 3000);
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

  /* ================= state ================= */
  let world = null, props = null, portals = null;
  const S = {
    mode: qs.get('mode') || 'walk', // Start directly in Walk mode at Socrates' Agora entrance!
    sit: null,
    ui: false,
    time: parseFloat(qs.get('t')) || 10.5,
    auto: qs.get('auto') === '1',
    shadows: wantShadow,
    tourT: 0,
    hudT: 0,
    lampT: 0,
    locked: false,
    elapsed: 0
  };
  const keys = Object.create(null);
  let consoleInput = {};
  const consoleControls = {
    input: function (next) { consoleInput = Object.assign({}, next); },
    stop: function () { consoleInput = {}; for (const k in keys) keys[k] = false; joy.x = joy.y = 0; touchBtn.jump = touchBtn.down = false; player.vel.set(0, 0, 0); }
  };
  const player = { pos: new V3(128.5, 42, 152.5), vel: new V3(), yaw: 0, pitch: 0.02, onGround: false, swim: false, fly: false, stepOff: 0, lastSpace: 0, climbT: 0 };
  const joy = { x: 0, y: 0 };
  const touchBtn = { jump: false, down: false };

  /* ================= lights ================= */
  const hemi = new THREE.HemisphereLight(0xcfe4ff, 0x6a5a48, 0.62);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffffff, 0.82);
  sun.castShadow = wantShadow;
  sun.shadow.mapSize.set(2048, 2048);
  const SH = 78;
  Object.assign(sun.shadow.camera, { left: -SH, right: SH, top: SH, bottom: -SH, near: 1, far: 420 });
  sun.shadow.camera.updateProjectionMatrix();
  sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.03;
  scene.add(sun, sun.target);

  const lampLights = [];
  for (let i = 0; i < 8; i++) {
    const l = new THREE.PointLight(0xffc27a, 0, 22, 1.5);
    lampLights.push(l);
    scene.add(l);
  }
  let indoor = 0;

  /* ================= sky & stars ================= */
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
    const n = 1600, p = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      let x, y, z, l;
      do { x = Math.random() * 2 - 1; y = Math.random(); z = Math.random() * 2 - 1; l = Math.hypot(x, y, z); } while (l > 1 || l < 0.2 || y < 0.04 * l);
      p[i * 3] = x / l * 1200; p[i * 3 + 1] = y / l * 1200; p[i * 3 + 2] = z / l * 1200;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(p, 3));
  }
  const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 2.4, sizeAttenuation: false, transparent: true, opacity: 0, depthWrite: false, fog: false });
  const stars = new THREE.Points(starGeo, starMat);
  stars.renderOrder = -8; stars.frustumCulled = false;
  scene.add(stars);

  const farFloor = new THREE.Mesh(new THREE.PlaneGeometry(6000, 6000), new THREE.MeshLambertMaterial({ color: 0x1e4a5f }));
  farFloor.rotation.x = -Math.PI / 2; farFloor.position.y = 35.8;
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
      ' float a = mix(0.76, 0.95, fr);',
      ' float fog = 1.0 - exp(-uFogD*uFogD*vD*vD);',
      ' col = mix(col, uFog, fog); a = mix(a, 1.0, fog);',
      ' gl_FragColor = vec4(col, a); }'
    ].join('\n')
  });
  const waterMesh = new THREE.Mesh(new THREE.PlaneGeometry(800, 800), waterMat);
  waterMesh.rotation.x = -Math.PI / 2; waterMesh.position.set(192, VW.WATER_Y, 192); waterMesh.renderOrder = 5; waterMesh.frustumCulled = false;
  scene.add(waterMesh);

  /* ================= time of day ================= */
  const KEYS = [
    [0, 0x050818, 0x0e1535, 0x04101c, 0x0a2838],
    [5, 0x0a1232, 0x28285a, 0x061420, 0x10283c],
    [6.3, 0x3a5a9a, 0xf09a70, 0x0e2a38, 0x2a6a74],
    [8, 0x4a98e4, 0xcde6f6, 0x14405a, 0x3a8a9a],
    [12, 0x2a82e8, 0xbcdcf4, 0x14466a, 0x4298aa],
    [16.5, 0x4a96e0, 0xcfe2f2, 0x14425a, 0x4a8a90],
    [18, 0x4a7cc8, 0xf8b878, 0x123a48, 0x3a7478],
    [19.2, 0x2a3270, 0xe2745c, 0x0a2430, 0x2a4c58],
    [20.6, 0x0e1438, 0x35305a, 0x061824, 0x10303e],
    [24, 0x050818, 0x0e1535, 0x04101c, 0x0a2838]
  ];
  const cTop = new THREE.Color(), cHor = new THREE.Color(), cDeep = new THREE.Color(), cShal = new THREE.Color(), cTmp = new THREE.Color();
  function sampleKey(t, idx, out) {
    let i = 0; while (i < KEYS.length - 2 && t >= KEYS[i + 1][0]) i++;
    const a = KEYS[i], b = KEYS[i + 1], f = clamp((t - a[0]) / (b[0] - a[0]), 0, 1);
    out.setHex(a[idx]); out.lerp(cTmp.setHex(b[idx]), f);
  }
  const sunDir = new V3(), lightDir = new V3();
  const sunCol = new THREE.Color(), warmCol = new THREE.Color(1.0, 0.55, 0.28), whiteCol = new THREE.Color(1.0, 0.97, 0.9), moonCol = new THREE.Color(0.5, 0.62, 1.0);
  const winDay = new THREE.Color(0.25, 0.35, 0.48), winNight = new THREE.Color(1.0, 0.82, 0.46);
  let nightF = 0, dayF = 1;
  const matWorld = new THREE.MeshLambertMaterial({ vertexColors: true });
  const matGlow = new THREE.MeshBasicMaterial({ vertexColors: true });
  const matLit = new THREE.MeshBasicMaterial({ vertexColors: true });

  function setTime(t) {
    S.time = ((t % 24) + 24) % 24;
    const sl = $('timeSlider');
    if (sl) sl.value = S.time;
  }

  function updateSky(cam) {
    const t = ((S.time % 24) + 24) % 24;
    const a = (t - 5.5) / 14 * Math.PI;
    sunDir.set(Math.cos(a), Math.sin(a), 0.3).normalize();
    const e = sunDir.y;
    dayF = smooth(-0.08, 0.35, e);
    nightF = 1 - smooth(-0.12, 0.14, e);
    sampleKey(t, 1, cTop); sampleKey(t, 2, cHor); sampleKey(t, 3, cDeep); sampleKey(t, 4, cShal);
    sunCol.copy(warmCol).lerp(whiteCol, smooth(0.04, 0.5, e));
    if (e > -0.02) {
      lightDir.copy(sunDir); sun.color.copy(sunCol); sun.intensity = 0.06 + 0.84 * smooth(-0.02, 0.32, e);
    } else {
      lightDir.copy(sunDir).negate(); sun.color.copy(moonCol); sun.intensity = 0.45 * smooth(0.0, 0.25, -e);
    }
    hemi.color.setRGB(lerp(0.22, 0.76, dayF), lerp(0.28, 0.86, dayF), lerp(0.48, 1.0, dayF)).lerp(cHor, 0.22);
    hemi.groundColor.setRGB(lerp(0.08, 0.44, dayF), lerp(0.08, 0.4, dayF), lerp(0.14, 0.35, dayF));
    hemi.intensity = lerp(0.52, 0.65, dayF) + indoor * (0.22 + 0.45 * nightF);
    if (indoor > 0.05) {
      const k = indoor * (0.28 + 0.48 * nightF);
      hemi.color.lerp(cTmp.setRGB(1.0, 0.85, 0.62), k);
      hemi.groundColor.lerp(cTmp.setRGB(0.52, 0.4, 0.26), k);
    }
    skyMat.uniforms.uTop.value.copy(cTop); skyMat.uniforms.uHor.value.copy(cHor);
    skyMat.uniforms.uSunDir.value.copy(sunDir); skyMat.uniforms.uSunCol.value.copy(sunCol);
    scene.fog.color.copy(cHor);
    scene.fog.density = indoor > 0.5 ? 0.0004 : 0.001;
    renderer.setClearColor(scene.fog.color);

    const wu = waterMat.uniforms;
    wu.uSunDir.value.copy(lightDir); wu.uSunCol.value.copy(sun.color).multiplyScalar(sun.intensity > 0.2 ? 1 : 0.4);
    wu.uSky.value.copy(cHor).lerp(cTop, 0.35); wu.uDeep.value.copy(cDeep); wu.uShallow.value.copy(cShal);
    wu.uFog.value.copy(cHor); wu.uFogD.value = scene.fog.density; wu.uNight.value = nightF;

    sunSprite.position.copy(cam).addScaledVector(sunDir, 900); sunSprite.lookAt(cam);
    moonSprite.position.copy(cam).addScaledVector(sunDir, -900); moonSprite.lookAt(cam);
    sunSprite.visible = e > -0.12; moonSprite.visible = e < 0.1;
    skyMesh.position.copy(cam); stars.position.copy(cam);
    starMat.opacity = clamp(nightF * 1.15 - 0.08, 0, 0.98);
    matGlow.color.copy(winDay).lerp(winNight, nightF);
  }

  /* ================= world chunk build ================= */
  const chunks = [];
  const worldGroup = new THREE.Group(); scene.add(worldGroup);
  let CX = 0, CZ = 0;

  function meshChunk(cx, cz) {
    const i = cx + cz * CX, rec = chunks[i] || (chunks[i] = {});
    const g = PIMesher.buildChunk(world, cx, cz, CH);
    if (rec.opaque) { worldGroup.remove(rec.opaque); rec.opaque.geometry.dispose(); rec.opaque = null; }
    if (rec.glow) { worldGroup.remove(rec.glow); rec.glow.geometry.dispose(); rec.glow = null; }
    if (rec.lit) { worldGroup.remove(rec.lit); rec.lit.geometry.dispose(); rec.lit = null; }
    if (g.opaque) { const m = new THREE.Mesh(g.opaque, matWorld); m.castShadow = m.receiveShadow = true; rec.opaque = m; worldGroup.add(m); }
    if (g.glow) { const m = new THREE.Mesh(g.glow, matGlow); m.castShadow = true; rec.glow = m; worldGroup.add(m); }
    if (g.lit) { const m = new THREE.Mesh(g.lit, matLit); rec.lit = m; worldGroup.add(m); }
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

  /* ================= 20 NAMED PHILOSOPHER NPCs INSIDE THEIR EXHIBITION HALLS + FLOATING 3D NAME TAGS ================= */
  const unitBox = new THREE.BoxGeometry(1, 1, 1);
  const npcs = [];
  let npcMeshes = null;
  const dummy = new THREE.Object3D();

  function makeNPCNameTagSprite(p) {
    const c = document.createElement('canvas');
    c.width = 440; c.height = 84;
    const x = c.getContext('2d');

    // Sleek translucent museum pill tag (zero clutter, zero occlusion)
    x.fillStyle = 'rgba(11, 17, 30, 0.72)';
    x.beginPath();
    x.roundRect(14, 12, 412, 60, 30);
    x.fill();
    x.strokeStyle = 'rgba(251, 191, 36, 0.72)';
    x.lineWidth = 3;
    x.stroke();

    x.fillStyle = '#fef3c7';
    x.font = '800 28px "PingFang SC", Georgia, serif';
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    const shortEn = (p.en || '').split('(')[0].trim().split(' ').pop() || '';
    x.fillText(`${p.name}  ·  ${shortEn}`, 220, 43);

    const tex = new THREE.CanvasTexture(c);
    if (THREE.sRGBEncoding !== undefined) tex.encoding = THREE.sRGBEncoding;
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: true });
    const sp = new THREE.Sprite(mat);
    sp.scale.set(1.18, 0.23, 1);
    scene.add(sp);
    return sp;
  }

  function spawnPhilosopherNPCs() {
    world.PHILOSOPHERS.forEach((p, idx) => {
      // Place each Philosopher NPC directly INSIDE their Exhibition Hall!
      // For Plato's School of Athens, stand Plato gracefully by the left forecourt colonnade so the central Raphael sightline stays 100% pure!
      const startX = p.id === 'plato' ? p.x - 10.4 : p.x + 1.15;
      const startZ = p.id === 'plato' ? p.z + 15.2 : p.z + 0.55;
      const gy = p.gy;
      const labelSprite = makeNPCNameTagSprite(p);
      labelSprite.position.set(startX, gy + 2.38, startZ);
      npcs.push({
        phil: p,
        homeX: startX,
        homeZ: startZ,
        homeY: gy,
        x: startX,
        z: startZ,
        y: gy,
        tx: startX,
        tz: startZ + 0.6,
        speed: p.id === 'kant' ? 0.85 : 0.65,
        phase: idx * 0.8,
        wait: 0,
        robe: p.robe,
        pants: 0x27272a,
        skin: 0xf0c8a0,
        hair: p.hair,
        yaw: 0,
        h: 1.06,
        labelSprite
      });
    });
  }

  function makeNPCMeshes() {
    const N = npcs.length;
    const mk = () => {
      const m = new THREE.InstancedMesh(unitBox, new THREE.MeshLambertMaterial({ color: 0xffffff }), N);
      m.castShadow = true; m.frustumCulled = false; scene.add(m); return m;
    };
    npcMeshes = { body: mk(), head: mk(), hair: mk(), beard: mk(), legL: mk(), legR: mk(), armL: mk(), armR: mk(), book: mk() };
    const c = new THREE.Color();
    npcs.forEach((n, i) => {
      npcMeshes.body.setColorAt(i, c.setHex(n.robe));
      npcMeshes.armL.setColorAt(i, c); npcMeshes.armR.setColorAt(i, c);
      npcMeshes.head.setColorAt(i, c.setHex(n.skin));
      npcMeshes.hair.setColorAt(i, c.setHex(n.hair));
      npcMeshes.beard.setColorAt(i, c.setHex(n.hair));
      npcMeshes.legL.setColorAt(i, c.setHex(n.pants));
      npcMeshes.legR.setColorAt(i, c);
      npcMeshes.book.setColorAt(i, c.setHex(0xf59e0b)); // Golden Magnum Opus tome held in hand
    });
    Object.values(npcMeshes).forEach((m) => { m.instanceColor.needsUpdate = true; });
  }

  function setPart(mesh, i, w, h, d, x, y, z, rx, ry) {
    dummy.position.set(x, y, z); dummy.rotation.set(rx, ry, 0, 'YXZ'); dummy.scale.set(w, h, d); dummy.updateMatrix(); mesh.setMatrixAt(i, dummy.matrix);
  }

  function updateNPCs(dt, time) {
    if (!npcMeshes) return;
    const pp = player.pos;
    for (let i = 0; i < npcs.length; i++) {
      const n = npcs[i];
      let walking = false;
      const distPlayer = Math.hypot(pp.x - n.x, pp.z - n.z);

      if (distPlayer < 8.5) {
        // When visitor enters the Exhibition Hall, the Philosopher turns to face them & gestures in conversation!
        const targetYaw = Math.atan2(pp.x - n.x, pp.z - n.z);
        n.yaw += wrapAngle(targetYaw - n.yaw) * (1 - Math.exp(-10 * dt));
      } else if (n.wait > 0) {
        n.wait -= dt;
      } else {
        const dx = n.tx - n.x, dz = n.tz - n.z, dist = Math.hypot(dx, dz);
        if (dist < 0.12) {
          n.wait = n.phil.id === 'kant' ? 0.6 : rr(1.8, 3.8);
          const angle = rr(0, Math.PI * 2), rad = rr(0.35, 0.85);
          n.tx = n.homeX + Math.cos(angle) * rad;
          n.tz = n.homeZ + Math.sin(angle) * rad;
        } else {
          const step = Math.min(dist, n.speed * dt);
          n.x += (dx / dist) * step;
          n.z += (dz / dist) * step;
          n.y = n.homeY != null ? n.homeY : n.phil.gy;
          n.yaw += wrapAngle(Math.atan2(dx, dz) - n.yaw) * (1 - Math.exp(-8 * dt));
          walking = true;
        }
      }

      if (n.labelSprite) {
        n.labelSprite.position.set(n.x, n.y + 2.38 + Math.sin(time * 2.4 + n.phase) * 0.04, n.z);
      }

      const sw = walking ? Math.sin(time * n.speed * 7 + n.phase) * 0.55 : 0;
      const talkGesture = distPlayer < 8.5 ? -0.45 + Math.sin(time * 3.8 + n.phase) * 0.22 : sw * 0.9;
      const yaw = n.yaw, s = Math.sin(yaw), c = Math.cos(yaw), k = n.h;
      const loc = (lx, ly, lz) => [n.x + lx * c + lz * s, n.y + ly * k, n.z - lx * s + lz * c];
      let q;
      q = loc(0, 0.98, 0); setPart(npcMeshes.body, i, 0.54, 0.74 * k, 0.32, q[0], q[1], q[2], 0, yaw);
      q = loc(0, 1.52, 0); setPart(npcMeshes.head, i, 0.36, 0.36 * k, 0.36, q[0], q[1], q[2], 0, yaw);
      q = loc(0, 1.68, 0); setPart(npcMeshes.hair, i, 0.4, 0.14 * k, 0.4, q[0], q[1], q[2], 0, yaw);
      q = loc(0, 1.38, 0.17); setPart(npcMeshes.beard, i, 0.24, 0.16 * k, 0.10, q[0], q[1], q[2], 0, yaw);
      const limb = (mesh, lx, ly, len, ang, w, d) => {
        const cy = -len / 2 * Math.cos(ang), cz = -len / 2 * Math.sin(ang);
        const qq = loc(lx, ly + cy, cz);
        setPart(mesh, i, w, len * k, d, qq[0], qq[1], qq[2], ang, yaw);
      };
      limb(npcMeshes.legL, -0.13, 0.62, 0.62, sw, 0.22, 0.24);
      limb(npcMeshes.legR, 0.13, 0.62, 0.62, -sw, 0.22, 0.24);
      limb(npcMeshes.armL, -0.35, 1.32, 0.62, -0.38, 0.16, 0.2);
      limb(npcMeshes.armR, 0.35, 1.32, 0.62, talkGesture, 0.16, 0.2);
      q = loc(-0.36, 0.98, 0.26); setPart(npcMeshes.book, i, 0.24, 0.30, 0.08, q[0], q[1], q[2], 0.35, yaw);
    }
    Object.values(npcMeshes).forEach((m) => { m.instanceMatrix.needsUpdate = true; });
  }

  /* ================= teleports & tour ================= */
  function look(fx, fy, fz, tx, ty, tz) {
    const dx = tx - fx, dy = ty - fy, dz = tz - fz;
    return { yaw: Math.atan2(-dx, -dz), pitch: Math.atan2(dy, Math.hypot(dx, dz)) };
  }
  let TOUR = null, tourCam = null, tourTgt = null;
  function initTour() {
    TOUR = world.tour;
    tourCam = new THREE.CatmullRomCurve3(TOUR.cam.map((p) => new V3(p[0], p[1], p[2])), true, 'centripetal');
    tourTgt = new THREE.CatmullRomCurve3(TOUR.tgt.map((p) => new V3(p[0], p[1], p[2])), true, 'centripetal');
  }

  const MODE_LABEL = {
    tour: '环岛航拍导览 · 点击画面或按任意键开始自由漫游',
    walk: '步行探索模式 · 走入哲学家住宅按 E 启动思想实验',
    fly: '自由飞行模式 · 空格上升 / C下降 / F落地'
  };

  function setMode(m, keepPos) {
    const prev = S.mode;
    if (!keepPos && (m === 'walk' || m === 'fly') && prev === 'tour') {
      player.pos.set(camera.position.x, camera.position.y - 1.62, camera.position.z);
      player.vel.set(0, 0, 0);
    }
    S.mode = m;
    player.fly = m === 'fly';
    if (m !== 'walk') S.sit = null;
    $('modeLabel').textContent = MODE_LABEL[m];
    $('crosshair').style.display = (m === 'walk' || m === 'fly') ? 'block' : 'none';
    updateHotbar();
    updateHint();
    if (m === 'tour') exitLock();
  }

  function teleport(t) {
    S.sit = null;
    const f = look(t.p[0], t.p[1] + 1.62, t.p[2], t.t[0], t.t[1], t.t[2]);
    player.yaw = f.yaw;
    player.pitch = f.pitch;
    let y = t.p[1];
    if (t.mode === 'walk') {
      y = groundY(t.p[0], t.p[2], Math.floor(t.p[1] + 2));
    }
    player.pos.set(t.p[0], y + 0.02, t.p[2]);
    player.vel.set(0, 0, 0);
    setMode(t.mode || 'walk', true);
  }

  /* ================= input & touch ================= */
  function requestLock() {
    if (!isTouch && !S.ui && canvas.requestPointerLock && !document.pointerLockElement) {
      try {
        const p = canvas.requestPointerLock();
        if (p && typeof p.catch === 'function') p.catch(() => {});
      } catch (e) {}
    }
  }
  function exitLock() {
    if (document.pointerLockElement && document.exitPointerLock) document.exitPointerLock();
  }
  document.addEventListener('pointerlockchange', () => {
    S.locked = document.pointerLockElement === canvas;
    $('lockHint').style.display = (!S.locked && !isTouch && !S.ui && (S.mode === 'walk' || S.mode === 'fly')) ? 'block' : 'none';
  });

  window.addEventListener('keydown', (e) => {
    if (e.code === 'Escape') {
      if (portals && portals.isDialogueOpen && portals.isDialogueOpen()) { portals.closeDialogue(); return; }
      if (portals && portals.isModalOpen && portals.isModalOpen()) { portals.closeModal(); return; }
    }
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
    if (S.ui) return;
    keys[e.code] = true;
    if (S.mode === 'tour' && !e.metaKey && !e.ctrlKey && !/^(F\d+|Tab|Escape|Digit\d|KeyT|KeyY|KeyH|KeyE|KeyM)$/.test(e.code)) {
      setMode('walk');
      requestLock();
    }
    if (e.code === 'Space') {
      e.preventDefault();
      const now = performance.now();
      if (now - player.lastSpace < 300 && (S.mode === 'walk' || S.mode === 'fly')) setMode(S.mode === 'fly' ? 'walk' : 'fly');
      player.lastSpace = now;
    }
    if (e.code === 'KeyF' && (S.mode === 'walk' || S.mode === 'fly')) setMode(S.mode === 'fly' ? 'walk' : 'fly');
    if (e.code === 'KeyT') cycleTime();
    if (e.code === 'KeyY') toggleAuto();
    if (e.code === 'KeyH') $('hint').classList.toggle('show');
    if (e.code === 'KeyM' && portals) portals.openCompassModal();
    if (e.code === 'KeyE') {
      if (S.mode === 'tour') setMode('walk');
      interact();
    }
    const m = /^Digit([1-9])$/.exec(e.code);
    if (m) hotbarAction(parseInt(m[1], 10) - 1);
  });
  window.addEventListener('keyup', (e) => { keys[e.code] = false; });
  window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; });

  let dragging = false;
  canvas.addEventListener('mousedown', (e) => {
    if (S.ui) return;
    if (S.mode === 'tour') { setMode('walk'); requestLock(); return; }
    if (!S.locked) { requestLock(); dragging = true; return; }
    if (e.button === 0 || e.button === 2) interact(true);
  });
  window.addEventListener('mouseup', () => { dragging = false; });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  window.addEventListener('mousemove', (e) => {
    if (S.ui || !(S.locked || dragging) || S.mode === 'tour') return;
    player.yaw -= (e.movementX || 0) * 0.0022;
    player.pitch = clamp(player.pitch - (e.movementY || 0) * 0.0022, -1.5, 1.5);
  });

  // Touch Dual-Joystick + Tap Interaction
  (function touchInit() {
    const joyEl = $('joy'), knob = joyEl.firstElementChild;
    let jid = null, jc = null, lid = null, lx = 0, ly = 0, ltx = 0, lty = 0, lt0 = 0;
    joyEl.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const t = e.changedTouches[0]; jid = t.identifier;
      const r = joyEl.getBoundingClientRect(); jc = [r.left + r.width / 2, r.top + r.height / 2];
      if (S.mode === 'tour') setMode('walk');
    }, { passive: false });
    window.addEventListener('touchmove', (e) => {
      if (S.ui) return;
      for (const t of e.changedTouches) {
        if (t.identifier === jid) {
          let dx = (t.clientX - jc[0]) / 50, dy = (t.clientY - jc[1]) / 50;
          const l = Math.hypot(dx, dy); if (l > 1) { dx /= l; dy /= l; }
          joy.x = dx; joy.y = dy; knob.style.transform = 'translate(' + dx * 40 + 'px,' + dy * 40 + 'px)';
        } else if (t.identifier === lid) {
          player.yaw -= (t.clientX - lx) * 0.005;
          player.pitch = clamp(player.pitch - (t.clientY - ly) * 0.005, -1.5, 1.5);
          lx = t.clientX; ly = t.clientY;
        }
      }
    }, { passive: true });
    const end = (e) => {
      for (const t of e.changedTouches) {
        if (t.identifier === jid) { jid = null; joy.x = joy.y = 0; knob.style.transform = ''; }
        if (t.identifier === lid) {
          lid = null;
          if (!S.ui && performance.now() - lt0 < 240 && Math.hypot(t.clientX - ltx, t.clientY - lty) < 10) {
            interact(true);
          }
        }
      }
    };
    window.addEventListener('touchend', end);
    window.addEventListener('touchcancel', end);
    canvas.addEventListener('touchstart', (e) => {
      if (S.ui) return;
      if (S.mode === 'tour') { setMode('walk'); return; }
      const t = e.changedTouches[0];
      if (lid === null) { lid = t.identifier; lx = ltx = t.clientX; ly = lty = t.clientY; lt0 = performance.now(); }
    }, { passive: true });
    const hold = (el, key) => {
      el.addEventListener('touchstart', (e) => { e.preventDefault(); touchBtn[key] = true; }, { passive: false });
      el.addEventListener('touchend', () => { touchBtn[key] = false; });
      el.addEventListener('touchcancel', () => { touchBtn[key] = false; });
    };
    hold($('tJump'), 'jump'); hold($('tDown'), 'down');
    $('tUse').addEventListener('touchstart', (e) => { e.preventDefault(); if (S.mode === 'tour') setMode('walk'); interact(); }, { passive: false });
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
    if (S.ui) return;
    const p = player, n = consoleInput;
    p.yaw += ((n.lookLeft ? 1 : 0) - (n.lookRight ? 1 : 0) - (n.lookX || 0)) * dt * 1.6;
    p.pitch = clamp(p.pitch + ((n.lookUp ? 1 : 0) - (n.lookDown ? 1 : 0) + (n.lookY || 0)) * dt * 1.2, -1.5, 1.5);
    const fwd = (keys.KeyW || keys.ArrowUp || n.forward ? 1 : 0) - (keys.KeyS || keys.ArrowDown || n.back ? 1 : 0) - joy.y + (n.moveY || 0);
    const side = (keys.KeyD || keys.ArrowRight || n.right ? 1 : 0) - (keys.KeyA || keys.ArrowLeft || n.left ? 1 : 0) + joy.x + (n.moveX || 0);
    let ix = side, iz = -fwd;
    const l = Math.hypot(ix, iz); if (l > 1) { ix /= l; iz /= l; }
    const sin = Math.sin(p.yaw), cos = Math.cos(p.yaw);
    const wx = cos * ix + sin * iz, wz = -sin * ix + cos * iz;
    const sprint = !!(n.fast || keys.ShiftLeft || keys.ShiftRight || (keys.ControlLeft && !p.fly));
    const jump = !!(n.up || keys.Space || touchBtn.jump);
    const down = !!(keys.KeyC || (p.fly && (keys.ShiftLeft || keys.ShiftRight)) || touchBtn.down || n.down);

    const speed = p.fly ? (sprint ? 38 : 16) : (sprint ? 7.8 : 4.8);
    const k = p.fly ? 1 - Math.exp(-9 * dt) : (p.onGround ? 1 - Math.exp(-14 * dt) : 1 - Math.exp(-3 * dt));
    p.vel.x += (wx * speed - p.vel.x) * k;
    p.vel.z += (wz * speed - p.vel.z) * k;

    if (p.fly) {
      const vy = (jump ? 1 : 0) - (down ? 1 : 0);
      p.vel.y += (vy * (sprint ? 26 : 11) - p.vel.y) * (1 - Math.exp(-9 * dt));
    } else {
      p.vel.y -= 30 * dt;
      if (p.vel.y < -50) p.vel.y = -50;
      if (jump && p.onGround) { p.vel.y = 8.8; p.onGround = false; }
    }

    const steps = Math.max(1, Math.ceil(dt / 0.012)), h = dt / steps;
    for (let s = 0; s < steps; s++) {
      const nx = p.pos.x + p.vel.x * h;
      if (blocked(nx, p.pos.y, p.pos.z)) {
        if (p.onGround && !blocked(nx, p.pos.y + 1.05, p.pos.z)) { p.pos.y += 1.02; p.stepOff -= 1.02; p.pos.x = nx; }
        else p.vel.x = 0;
      } else p.pos.x = nx;

      const nz = p.pos.z + p.vel.z * h;
      if (blocked(p.pos.x, p.pos.y, nz)) {
        if (p.onGround && !blocked(p.pos.x, p.pos.y + 1.05, nz)) { p.pos.y += 1.02; p.stepOff -= 1.02; p.pos.z = nz; }
        else p.vel.z = 0;
      } else p.pos.z = nz;

      const ny = p.pos.y + p.vel.y * h;
      if (blocked(p.pos.x, ny, p.pos.z)) {
        if (p.vel.y < 0) { const sy = Math.floor(ny) + 1; if (!blocked(p.pos.x, sy, p.pos.z)) p.pos.y = sy; }
        p.vel.y = 0;
      } else p.pos.y = ny;

      p.onGround = !p.fly && p.vel.y <= 0 && blocked(p.pos.x, p.pos.y - 0.03, p.pos.z);
    }
    p.stepOff += (0 - p.stepOff) * (1 - Math.exp(-14 * dt));
    if (p.pos.y < 10) { p.pos.set(world.spawn.x, world.spawn.y + 2, world.spawn.z); p.vel.set(0, 0, 0); }
    p.pos.x = clamp(p.pos.x, 4, world.W - 4);
    p.pos.z = clamp(p.pos.z, 4, world.D - 4);
  }

  /* ================= Interaction: Portals, Philosophers & Seats ================= */
  function nearSeat(r) {
    const p = player.pos;
    let best = null, bd = r;
    for (const s2 of world.seats) {
      const k = Math.hypot(p.x - s2.x, p.z - s2.z);
      if (k < bd && Math.abs(p.y - s2.y) < 1.8) { bd = k; best = s2; }
    }
    return best;
  }
  function sitOn(s2) {
    S.sit = s2;
    player.pos.set(s2.x, s2.y, s2.z);
    player.vel.set(0, 0, 0);
    if (s2.yaw != null) player.yaw = s2.yaw;
    player.pitch = 0.04;
    toast('🪑 已落座沉思 · 移动即可起身');
  }
  function standUp() {
    const s2 = S.sit;
    S.sit = null;
    if (!s2) return;
    player.pos.set(s2.x, s2.y + 0.02, s2.z);
    player.vel.set(0, 0, 0);
  }

  function interact() {
    if (S.sit) { standUp(); return true; }
    // Priority 1: Activate nearest Spatial InteractionPortal!
    if (portals && portals.activateNearest()) return true;
    // Priority 2: Sit on nearby bench
    const s3 = nearSeat(2.2);
    if (s3) { sitOn(s3); return true; }
    // Priority 3: Open Top 20 Philosophers Compass
    if (portals) { portals.openCompassModal(); return true; }
    return false;
  }

  /* ================= HUD & Hotbar ================= */
  let toastT = 0;
  function toast(msg) {
    const el = $('toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastT);
    toastT = setTimeout(() => el.classList.remove('show'), 3200);
  }

  const SLOTS = [
    { ic: '🧭', tip: '哲学家罗盘 (M)', act: () => portals && portals.openCompassModal() },
    { ic: '🚶', tip: '步行探索', act: () => { setMode('walk'); requestLock(); } },
    { ic: '🕊️', tip: '自由飞行 (F)', act: () => { setMode('fly'); requestLock(); } },
    { ic: '🎥', tip: '环岛航拍', act: () => setMode('tour') },
    { ic: '🌅', tip: '切换昼夜 (T)', act: () => cycleTime() },
    { ic: '❓', tip: '操作说明 (H)', act: () => { const el = $('hint'); if (el) el.classList.toggle('show'); } }
  ];

  function buildHotbar() {
    const hb = $('hotbar');
    hb.innerHTML = '';
    SLOTS.forEach((s, i) => {
      const el = document.createElement('div');
      el.className = 'slot';
      el.id = 'slot' + i;
      el.innerHTML = '<small>' + (i + 1) + '</small>' + s.ic + '<em>' + s.tip + '</em>';
      el.addEventListener('mousedown', (e) => e.stopPropagation());
      el.addEventListener('click', () => hotbarAction(i));
      hb.appendChild(el);
    });
    updateHotbar();
  }
  function hotbarAction(i) { if (SLOTS[i]) SLOTS[i].act(); }
  function updateHotbar() {
    SLOTS.forEach((s, i) => {
      const el = $('slot' + i);
      if (!el) return;
      const on = (i === 1 && S.mode === 'walk') || (i === 2 && S.mode === 'fly') || (i === 3 && S.mode === 'tour');
      el.classList.toggle('on', on);
    });
  }
  function updateHint() {
    $('hint').innerHTML = '<b>WASD</b> 移动 · <b>鼠标</b> 转向 · <b>E</b> 对话<br><b>M</b> 罗盘 · <b>F</b> 飞行 · <b>T</b> 昼夜 · <b>Esc</b> 退出';
  }
  function cycleTime() {
    const presets = [6.5, 11.5, 17.8, 22.0];
    let i = presets.findIndex((p) => p > S.time + 0.1);
    if (i < 0) i = 0;
    setTime(presets[i]);
    toast(['🌅 爱琴海晨曦 (06:30)', '☀️ 雅典晴昼 (11:30)', '🌇 密涅瓦猫头鹰的黄昏 (17:50)', '🌌 康德头上的璀璨星空 (22:00)'][i]);
  }
  function toggleAuto() {
    S.auto = !S.auto;
    toast(S.auto ? '⏱️ 昼夜自动流转：开' : '⏱️ 昼夜自动流转：关');
  }
  $('timeSlider').addEventListener('input', (e) => { S.time = parseFloat(e.target.value); });
  ['mousedown', 'touchstart'].forEach((ev) => {
    $('timeSlider').addEventListener(ev, (e) => e.stopPropagation());
    $('mmWrap').addEventListener(ev, (e) => e.stopPropagation());
  });

  /* ================= chimney smoke ================= */
  let smoke = null;
  function spawnSmoke() {
    if (!world.chimneys || !world.chimneys.length) return;
    const per = 10, n = world.chimneys.length * per, pos = new Float32Array(n * 3), seeds = new Float32Array(n);
    for (let i = 0; i < n; i++) seeds[i] = Math.random() * 6;
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({ color: 0xe2e8f0, size: 1.0, transparent: true, opacity: 0.55, depthWrite: false });
    const pts = new THREE.Points(geo, mat); pts.frustumCulled = false; scene.add(pts);
    smoke = { pos, seeds, per, geo };
  }
  function updateSmoke(time) {
    if (!smoke) return; const { pos, seeds, per } = smoke;
    for (let i = 0; i < seeds.length; i++) {
      const c = world.chimneys[(i / per) | 0], a = (time * 0.5 + seeds[i]) % 6;
      pos[i * 3] = c[0] + Math.sin(a * 1.3 + seeds[i] * 4) * 0.22 * a + a * 0.35;
      pos[i * 3 + 1] = c[1] + a * 1.05;
      pos[i * 3 + 2] = c[2] + Math.cos(a * 1.1 + seeds[i] * 3) * 0.22 * a;
    }
    smoke.geo.attributes.position.needsUpdate = true;
  }

  /* ================= minimap & banner ================= */
  let mmBase = null;
  function buildMinimap() {
    const { W, D } = world;
    const c = document.createElement('canvas'); c.width = W; c.height = D;
    const x = c.getContext('2d'), img = x.createImageData(W, D);
    for (let z = 0; z < D; z++) for (let i = 0; i < W; i++) {
      const k = i + W * z, h = world.topH[k], b = world.topB[k], pc = world.palette[world.topC[k]] || [1, 1, 1];
      let r, g, bl;
      if (h <= Math.floor(VW.WATER_Y)) { r = 34; g = 118; bl = 148; }
      else {
        const sh = 0.65 + Math.min(h, 52) / 52 * 0.45;
        r = pc[0] * 255 * sh; g = pc[1] * 255 * sh; bl = pc[2] * 255 * sh;
        if (b === B.ROOF) { r = 205 * sh; g = 98 * sh; bl = 68 * sh; }
        if (b === B.PATH || b === B.FLAGS || b === B.PARQ) { r = 212; g = 202; bl = 182; }
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
    // Draw wayposts in cyan & 20 philosopher markers in gold
    (world.WAYPOSTS || []).forEach((wp) => {
      mmx.fillStyle = '#38bdf8';
      mmx.fillRect(wp.x - 1, wp.z - 1, 3, 3);
    });
    world.PHILOSOPHERS.forEach((p) => {
      mmx.fillStyle = '#fbbf24';
      mmx.fillRect(p.x - 2, p.z - 2, 5, 5);
    });
    const cp = camera.position;
    mmx.save(); mmx.translate(cp.x, cp.z); mmx.rotate(-player.yaw + Math.PI);
    mmx.fillStyle = '#ef4444'; mmx.strokeStyle = '#ffffff'; mmx.lineWidth = 1.2;
    mmx.beginPath(); mmx.moveTo(0, -7); mmx.lineTo(4.5, 5); mmx.lineTo(0, 2.5); mmx.lineTo(-4.5, 5); mmx.closePath(); mmx.fill(); mmx.stroke();
    mmx.restore();
  }
  mm.addEventListener('click', (e) => {
    const r = mm.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width * world.W, z = (e.clientY - r.top) / r.height * world.D;
    // Find nearest philosopher to clicked minimap point
    let bestP = null, bestD = 25;
    for (const p of world.PHILOSOPHERS) {
      const d = Math.hypot(p.x - x, p.z - z);
      if (d < bestD) { bestD = d; bestP = p; }
    }
    if (bestP) {
      const lm = world.landmarks.find((l) => l.id === 'phil_' + bestP.id);
      if (lm && lm.tp) { teleport(lm.tp); toast(`🚶 已传送至 #${bestP.num} ${bestP.name}`); return; }
    }
    const gy = Math.max(world.topH[Math.floor(x) + world.W * Math.floor(z)] || 40, 40);
    player.pos.set(x, gy + 10, z); player.vel.set(0, 0, 0);
    setMode('fly', true);
    toast('🕊️ 已飞至 (' + Math.round(x) + ', ' + Math.round(z) + ')');
  });

  let lastLm = null, bannerTimer = 0;
  function updateBanner() {
    const cp = camera.position;
    let best = null, bd = 1e9;
    for (const l of world.landmarks) {
      const d = Math.hypot(cp.x - l.x, cp.z - l.z);
      if (d >= l.r || cp.y >= l.top + 8 || cp.y <= l.top - 14) continue;
      const k = d + (l.top >= cp.y - 1 && l.top <= cp.y + 7 ? 0 : 8);
      if (k < bd) { bd = k; best = l; }
    }
    if (best !== lastLm) {
      lastLm = best;
      if (best) {
        $('bannerT').textContent = best.name;
        $('bannerS').textContent = best.en;
        $('banner').classList.add('show');
        clearTimeout(bannerTimer);
        bannerTimer = setTimeout(() => $('banner').classList.remove('show'), 4200);
      }
    }
  }

  /* ================= camera & shadow loop ================= */
  const _tc = new V3(), _tt = new V3();
  function updateCamera(dt) {
    if (S.mode === 'tour') {
      S.tourT = (S.tourT + dt / TOUR.dur) % 1;
      tourCam.getPointAt(S.tourT, _tc); tourTgt.getPointAt(S.tourT, _tt);
      camera.position.copy(_tc); camera.lookAt(_tt);
      const d = new V3().subVectors(_tt, _tc);
      player.yaw = Math.atan2(-d.x, -d.z); player.pitch = Math.atan2(d.y, Math.hypot(d.x, d.z));
      player.pos.set(_tt.x, _tt.y, _tt.z);
      camera.fov = 66;
    } else {
      if (S.sit) {
        const mv = keys.KeyW || keys.KeyA || keys.KeyS || keys.KeyD || keys.ArrowUp || keys.ArrowDown || keys.ArrowLeft || keys.ArrowRight || keys.Space || Math.hypot(joy.x, joy.y) > 0.3 || touchBtn.jump;
        if (mv) standUp();
        else {
          player.vel.set(0, 0, 0);
          camera.position.set(S.sit.x, S.sit.y + 0.3, S.sit.z);
          camera.rotation.set(player.pitch, player.yaw, 0);
          camera.updateProjectionMatrix();
          return;
        }
      }
      movePlayer(dt);
      camera.position.set(player.pos.x, player.pos.y + 1.62 + player.stepOff, player.pos.z);
      camera.rotation.set(player.pitch, player.yaw, 0);
      camera.fov = 72;
    }
    camera.updateProjectionMatrix();
  }

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
    const cp = camera.position, arr = world.lamps, best = [];
    for (let i = 0; i < arr.length; i++) {
      const l = arr[i]; if (!l[3] && nightF < 0.05) continue;
      const d = (l[0] - cp.x) ** 2 + (l[1] - cp.y) ** 2 * 2.5 + (l[2] - cp.z) ** 2;
      if (best.length < lampLights.length || d < best[best.length - 1][0]) {
        best.push([d, l]); best.sort((p, q) => p[0] - q[0]);
        if (best.length > lampLights.length) best.pop();
      }
    }
    lampLights.forEach((L, i) => {
      const b = best[i]; if (!b) { L.intensity = 0; return; }
      const l = b[1]; L.position.set(l[0], l[1] + 0.4, l[2]);
      L.intensity = (l[3] ? 1.45 : 1.7 * nightF) * (l[4] || 1);
      L.distance = l[3] ? 20 : 18;
    });
    const x = Math.floor(cp.x), z = Math.floor(cp.z); let roof = 0;
    if (x >= 0 && z >= 0 && x < world.W && z < world.D) {
      for (let y = Math.floor(cp.y) + 1; y < Math.min(world.H, cp.y + 24); y++) {
        if (solidAt(x, y, z)) { roof = 1; break; }
      }
    }
    indoor += (roof - indoor) * 0.5;
  }

  let last = performance.now(), fpsAcc = 0, fpsN = 0, fps = 60;
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    S.elapsed += dt;
    if (S.auto) S.time = (S.time + dt * 0.12) % 24;
    updateCamera(dt);
    updateSky(camera.position);
    waterMat.uniforms.uTime.value = S.elapsed;
    updateNPCs(dt, S.elapsed);
    updateSmoke(S.elapsed);
    if (props) props.update(dt, S.elapsed, camera.position, nightF);
    if (portals) portals.checkProximity();
    updateShadow();
    S.lampT -= dt; if (S.lampT <= 0) { S.lampT = 0.25; updateLamps(); }
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
  const setLoad = (msg, p) => {
    $('loadMsg').textContent = msg;
    $('bar').firstElementChild.style.width = Math.round(p * 100) + '%';
  };

  async function boot() {
    try {
      setLoad('隆起爱琴海高地、东方竹林溪谷与阿尔卑斯哲思雪峰…', 0.06); await nextFrame();
      world = window.__piWorld || VW.create(1781);
      window.__piWorld = world;
      player.pos.set(world.spawn.x, world.spawn.y, world.spawn.z);
      player.yaw = world.spawn.yaw;

      setLoad('烘焙帕罗斯大理石、柯尼斯堡红砖与洞穴篝火贴图…', 0.18); await nextFrame();
      const atlas = new THREE.CanvasTexture(PITex.buildCanvas());
      atlas.magFilter = THREE.NearestFilter; atlas.minFilter = THREE.NearestFilter; atlas.generateMipmaps = false;
      matWorld.map = atlas; matGlow.map = atlas; matLit.map = atlas;
      matWorld.needsUpdate = true; matGlow.needsUpdate = true; matLit.needsUpdate = true;

      CX = Math.ceil(world.W / CH); CZ = Math.ceil(world.D / CH);
      const total = CX * CZ; let done = 0;
      for (let cz = 0; cz < CZ; cz++) for (let cx = 0; cx < CX; cx++) {
        meshChunk(cx, cz); done++;
        if (done % 4 === 0) {
          setLoad('建造 Top 20 哲学家住宅、柏拉图地下洞穴与康德星空阁楼 ' + done + '/' + total, 0.2 + 0.62 * done / total);
          await nextFrame();
        }
      }

      setLoad('安放 20 座 InteractionPortal 思想实验装置与哲学家 NPC…', 0.88); await nextFrame();
      props = PIProps.build(world, THREE, scene, { isTouch });
      spawnPhilosopherNPCs();
      makeNPCMeshes();
      spawnSmoke();
      buildMinimap();
      initTour();

      portals = PIPortals.attach({
        world, player, camera, S, props, toast, teleport, setTime
      });
      buildHotbar();

      window.__philosophersIsland = window.__voxel = {
        controls: consoleControls, world, player, scene, camera, S, props, portals,
        setMode, teleport, interact, setTime, renderer,
        stats: () => {
          const r = renderer.info;
          return { drawCalls: r.render.calls, tris: r.render.triangles, fps: Math.round(fps), props: props ? props.stats() : null };
        }
      };

      setLoad('完成 · 哲学始于惊奇 (Thaumazein)', 1);
      setMode(S.mode, true);
      updateHint();
      $('loading').classList.add('done');
      requestAnimationFrame(frame);
    } catch (err) {
      console.error(err);
      setLoad('加载失败：' + (err && err.message ? err.message : err), 1);
    }
  }

  boot();
})();
