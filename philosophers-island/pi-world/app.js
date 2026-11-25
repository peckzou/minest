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
  const waterMesh = new THREE.Mesh(new THREE.PlaneGeometry(1200, 800), waterMat);
  waterMesh.rotation.x = -Math.PI / 2; waterMesh.position.set(304, VW.WATER_Y, 192); waterMesh.renderOrder = 5; waterMesh.frustumCulled = false;
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
  const winDay = new THREE.Color(0.66, 0.80, 0.93), winNight = new THREE.Color(1.0, 0.82, 0.46);
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
    if (S.inLib) return libSolid(x, y, z);
    if (y < 0) return true;
    if (ec6Solid(x, y, z)) return true;
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

  // robed: full-length robe · coat: knee-length frock coat · stock: breeches with pale stockings
  // beard 1 short / 2 full / 3 long · wig 1 / 2 (full-bottomed) · stache 1 / 2 (walrus)
  const NPC_STYLE = {
    socrates: { robed: 1, bald: 1, beard: 2 }, plato: { robed: 1, beard: 3 }, aristotle: { robed: 1, beard: 1 }, zeno: { robed: 1, beard: 2 },
    confucius: { robed: 1, sleeve: 1, knot: 1, beard: 3 }, laozi: { robed: 1, sleeve: 1, bald: 1, knot: 1, beard: 3 }, zhuangzi: { robed: 1, sleeve: 1, knot: 1, beard: 1 },
    descartes: { coat: 1, stock: 1, wig: 1, stache: 1 }, spinoza: { coat: 1, stock: 1, wig: 1 }, leibniz: { coat: 1, stock: 1, wig: 2 },
    locke: { coat: 1, stock: 1, wig: 1 }, hume: { coat: 1, stock: 1, wig: 1 }, hobbes_rousseau: { coat: 1, stock: 1, wig: 1 }, kant: { coat: 1, stock: 1, wig: 1 },
    hegel: { coat: 1, wig: 1 }, marx: { coat: 1, wig: 1, beard: 3 }, schopenhauer_kierkegaard: { coat: 1, wig: 1 },
    nietzsche: { coat: 1, stache: 2 }, wittgenstein: {}, heidegger_sartre: { stache: 1 }
  };

  if (window.PIExpansion) Object.assign(NPC_STYLE, window.PIExpansion.npc);

  // The explorer's own little figure (seen in third person during round-table and walking talks)
  let YOU = null;
  function spawnExplorer() {
    YOU = { phil: { id: '__you', gy: 40 }, you: true, homeX: 0, homeZ: 0, homeY: 40, x: 0, z: 0, y: -50, tx: 0, tz: 0, speed: 0.9, phase: 1.7, wait: 0,
      robe: 0x2f6fb3, pants: 0x3b4252, skin: 0xf0c8a0, hair: 0x4a3524, yaw: 0, h: 0.98, labelSprite: null };
    npcs.push(YOU);
  }
  // Talk modes. S.talk = { mode: 'table' | 'walk', n (the philosopher's npc), t, … }
  const TABLE_OFF = { x: -3.2, z: 3.1 };          // where the round table stands, relative to the hall's centre
  function tableOf(p) { return p.id === 'plato' ? { x: p.x - 8.4, z: p.z + 17.2 } : { x: p.x + 0.5 + TABLE_OFF.x, z: p.z + 0.5 + TABLE_OFF.z }; }
  function startTableTalk(id) {
    const n = npcs.find((q) => q.phil.id === id); if (!n || !YOU) return false;
    const tb = tableOf(n.phil), gy = n.phil.gy;
    S.talk = { mode: 'table', n, t: 0, tb, gy, az: 0.9 };
    n.x = tb.x - 0.78; n.z = tb.z; n.y = gy; n.yaw = Math.PI / 2;
    YOU.x = tb.x + 0.78; YOU.z = tb.z; YOU.y = gy; YOU.yaw = -Math.PI / 2;
    player.vel.set(0, 0, 0); S.sit = null;
    return true;
  }
  // a walk: both stroll along a list of [x, z] points; onStop(i) fires at each "pause for thought"
  function startWalkTalk(id, path, stops, onStop) {
    const n = npcs.find((q) => q.phil.id === id); if (!n || !YOU) return false;
    const p = n.phil;
    if (!path && id === 'kant') {
      path = [[242, 138], [258, 143], [274, 143], [288, 141], [290, 130], [280, 125], [264, 124], [256, 134], [242, 138]]; stops = [1, 2, 3, 4, 6];
      const TH = ['（椴树小径）“每天下午三点半，我走这同一条路，八个来回。邻居们照着我出门的时刻对表。规律，是为了让思想自由。”', '（走在椴树下）“有两样东西，越是经常而持久地思考，越使心灵充满常新而日增的惊叹和敬畏：我头上的星空，和我心中的道德律。”', '（普列戈利亚河边）“我能知道什么？我应当做什么？我可以希望什么？—— 归根到底：人是什么？”', '（大教堂前）“启蒙就是人走出他自己招致的不成熟状态。要有勇气运用你自己的理智！”', '（回家的路上）相传只有一次他忘了散步：那几天他在读卢梭的《爱弥儿》，放不下。'];
      onStop = (i) => toast('🚶 康德停下脚步：' + TH[i]);
    }
    if (!path) { const fx = p.x + 0.5, fz = p.z + Math.floor(p.d / 2) + 3.5; path = [[fx, fz], [fx, fz + 7], [fx + 12, fz + 7], [fx + 12, fz + 13], [fx - 10, fz + 13], [fx - 10, fz + 7], [fx, fz + 7], [fx, fz]]; }
    S.talk = { mode: 'walk', n, t: 0, path, seg: 0, u: 0, stops: stops || [], onStop, pause: 0, back: 5.2 };
    n.x = path[0][0]; n.z = path[0][1]; n.y = groundY(n.x, n.z, 60);
    S.sit = null; player.vel.set(0, 0, 0);
    return true;
  }
  function endTalk() {
    const tk = S.talk; if (!tk) return;
    S.talk = null;
    const n = tk.n, p = n.phil;
    if (tk.mode === 'walk') player.pos.set(n.x + 1.4, groundY(n.x + 1.4, n.z + 1.2, 60) + 0.02, n.z + 1.2);
    else if (tk.mode === 'council') player.pos.set(COUNCIL.x + 3.6, groundY(COUNCIL.x + 3.6, COUNCIL.z + 3.6, 60) + 0.02, COUNCIL.z + 3.6);
    else player.pos.set(tk.tb.x + 2.2, tk.gy + 0.02, tk.tb.z + 1.4);
    (tk.list || [n]).forEach((q) => { q.x = q.homeX; q.z = q.homeZ; q.y = q.homeY; q.tx = q.homeX; q.tz = q.homeZ + 0.6; q.wait = 1; });
    if (tk.mode === 'council') { const f2 = look(player.pos.x, player.pos.y + 1.62, player.pos.z, COUNCIL.x, player.pos.y + 1, COUNCIL.z); YOU.y = -50; player.yaw = f2.yaw; player.pitch = f2.pitch; layoutCouncil(6); return; }
    YOU.y = -50;
    const f = look(player.pos.x, player.pos.y + 1.62, player.pos.z, n.x, n.y + 1.4, n.z); player.yaw = f.yaw; player.pitch = f.pitch;
  }
  function updateTalk(dt) {
    const tk = S.talk; if (!tk) return;
    tk.t += dt;
    if (tk.mode !== 'walk') return;
    const n = tk.n, P = tk.path;
    if (tk.pause > 0) { tk.pause -= dt; return; }
    if (tk.seg >= P.length - 1) { if (!tk.done) { tk.done = true; toast('散步结束了。可以回到圆桌，或结束对谈'); } return; }
    const a = P[tk.seg], b = P[tk.seg + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    tk.u += dt * 1.15 / L;
    if (tk.u >= 1) { tk.u = 0; tk.seg++; const si = tk.stops.indexOf(tk.seg); if (si >= 0) { tk.pause = 5.5; if (tk.onStop) tk.onStop(si); } if (tk.seg >= P.length - 1) { tk.done = true; return; } }
    const A = P[tk.seg], B = P[tk.seg + 1], dx = B[0] - A[0], dz = B[1] - A[1], d = Math.hypot(dx, dz) || 1, yaw = Math.atan2(dx, dz);
    n.x = A[0] + dx * tk.u; n.z = A[1] + dz * tk.u; n.y = groundY(n.x, n.z, 60);
    n.yaw += wrapAngle(yaw - n.yaw) * (1 - Math.exp(-6 * dt));
    // the explorer walks at his side
    const sx = n.x + (dz / d) * 0.85, sz = n.z - (dx / d) * 0.85;
    YOU.x += (sx - YOU.x) * (1 - Math.exp(-8 * dt)); YOU.z += (sz - YOU.z) * (1 - Math.exp(-8 * dt)); YOU.y = groundY(YOU.x, YOU.z, 60); YOU.yaw = n.yaw;
  }

  /* ───────── round-table council: several philosophers and the explorer round one big table ───────── */
  const COUNCIL = { x: 206.5, z: 219.5 };
  let councilSet = null;
  function buildCouncilSet() {
    const gy = groundY(COUNCIL.x, COUNCIL.z, 60), g = new THREE.Group(), L = (c) => new THREE.MeshLambertMaterial({ color: c });
    const add = (geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; g.add(m); return m; };
    add(new THREE.CylinderGeometry(2.9, 3.0, 0.12, 40), L(0xd9d2bf), 0, 0.06, 0);                 // a stone dais
    add(new THREE.CylinderGeometry(1.2, 1.2, 0.09, 36), L(0x6b4a2b), 0, 0.76, 0);                  // the table top
    add(new THREE.TorusGeometry(1.2, 0.035, 8, 48), L(0xd9a441), 0, 0.8, 0).rotation.x = Math.PI / 2;
    add(new THREE.CylinderGeometry(0.16, 0.3, 0.7, 12), L(0x4a321c), 0, 0.4, 0);
    const orb = add(new THREE.SphereGeometry(0.16, 16, 12), new THREE.MeshBasicMaterial({ color: 0xffe9a8 }), 0, 1.02, 0);
    g.userData = { stools: [], orb, gy };
    for (let i = 0; i < 6; i++) g.userData.stools.push(add(new THREE.CylinderGeometry(0.24, 0.2, 0.44, 12), L(0x7a5533), 0, 0.34, 0));
    g.position.set(COUNCIL.x, gy, COUNCIL.z); scene.add(g); councilSet = g;
    layoutCouncil(6);
  }
  function seatOf(i, n) { const a = Math.PI / 2 * 0 + i / n * Math.PI * 2, R = 1.82; return { a, x: COUNCIL.x + Math.sin(a) * R, z: COUNCIL.z + Math.cos(a) * R }; }
  function layoutCouncil(n) { if (!councilSet) return; councilSet.userData.stools.forEach((m, i) => { m.visible = i < n; const q = seatOf(i, n); m.position.set(q.x - COUNCIL.x, 0.34, q.z - COUNCIL.z); }); }
  function startCouncil(ids) {
    const list = ids.map((id) => npcs.find((q) => q.phil.id === id)).filter(Boolean).slice(0, 5); if (!list.length || !YOU) return false;
    if (S.talk) endTalk();
    const gy = councilSet.userData.gy + 0.12, n = list.length + 1;
    layoutCouncil(n);
    [YOU].concat(list).forEach((m, i) => { const q = seatOf(i, n); m.x = q.x; m.z = q.z; m.y = gy; m.yaw = q.a + Math.PI; m.seatA = q.a; });
    S.talk = { mode: 'council', n: list[0], list, all: new Set(list), t: 0, gy, speaker: null, az: 0.6, lx: COUNCIL.x, lz: COUNCIL.z };
    S.sit = null; player.vel.set(0, 0, 0);
    return true;
  }
  function setCouncilSpeaker(id) { const tk = S.talk; if (!tk || tk.mode !== 'council') return; tk.speaker = id === '__you' ? YOU : (tk.list.find((q) => q.phil.id === id) || null); }

  /* ───────── 时光岛: the light-cone monument (press E beside it to open the cone in the holo console) ───────── */
  const TIME_ISLE = { x: 471.5, z: 56.5 };
  let coneSet = null;
  function buildConeMonument() {
    const gy = groundY(TIME_ISLE.x, TIME_ISLE.z, 60), g = new THREE.Group(), L = (c) => new THREE.MeshLambertMaterial({ color: c });
    const glow = (c, o) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    const add = (geo, mat, y) => { const m = new THREE.Mesh(geo, mat); m.position.y = y; g.add(m); return m; };
    add(new THREE.CylinderGeometry(5.2, 5.6, 0.5, 48), L(0xd9d2bf), 0.25).castShadow = true; add(new THREE.CylinderGeometry(3.4, 3.6, 0.4, 48), L(0xb9b2a0), 0.7);
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2, m = add(new THREE.BoxGeometry(0.3, 0.9 + (i % 3 === 0 ? 0.5 : 0), 0.3), L(0x6b7280), 0.95); m.position.x = Math.cos(a) * 4.5; m.position.z = Math.sin(a) * 4.5; }
    const spin = new THREE.Group(); spin.position.y = 5.4; g.add(spin);
    const past = new THREE.Mesh(new THREE.ConeGeometry(3.0, 4.2, 40, 6, true), glow(0x46d2ff, 0.16)); past.position.y = -2.1; spin.add(past);
    const pastW = new THREE.Mesh(new THREE.ConeGeometry(3.0, 4.2, 20, 6, true), new THREE.MeshBasicMaterial({ color: 0x8fe3ff, wireframe: true, transparent: true, opacity: 0.55 })); pastW.position.y = -2.1; spin.add(pastW);
    const fut = new THREE.Mesh(new THREE.ConeGeometry(2.0, 2.8, 20, 4, true), new THREE.MeshBasicMaterial({ color: 0xffd27a, wireframe: true, transparent: true, opacity: 0.4 })); fut.position.y = 1.4; fut.rotation.x = Math.PI; spin.add(fut);
    const now = new THREE.Mesh(new THREE.SphereGeometry(0.28, 20, 14), new THREE.MeshBasicMaterial({ color: 0xffffff })); spin.add(now);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1, 0.05, 8, 64), glow(0xffffff, 0.9)); ring.rotation.x = Math.PI / 2; spin.add(ring);
    const c = document.createElement('canvas'); c.width = 560; c.height = 96; const x = c.getContext('2d'); x.fillStyle = 'rgba(8,20,34,.82)'; x.fillRect(0, 0, 560, 96); x.strokeStyle = '#6fe3ff'; x.lineWidth = 3; x.strokeRect(2, 2, 556, 92);
    x.fillStyle = '#fff'; x.textAlign = 'center'; x.font = '700 34px sans-serif'; x.fillText('⏳ 光锥 · 330 万年人类科技史', 280, 42); x.fillStyle = '#9fdcff'; x.font = '500 22px sans-serif'; x.fillText('靠近按 E 进入 · 时空倒流', 280, 76);
    const lab = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false })); lab.scale.set(7, 1.2, 1); lab.position.y = 9.4; g.add(lab);
    g.userData = { spin, ring, gy }; g.position.set(TIME_ISLE.x, gy, TIME_ISLE.z); scene.add(g); coneSet = g;
  }
  function updateConeMonument(t) {
    if (!coneSet || S.inLib) return; const u = coneSet.userData, d = (t * 0.12) % 1; u.spin.rotation.y = t * 0.25; u.ring.position.y = -d * 4.2; u.ring.scale.set(d * 3.0 + 0.05, d * 3.0 + 0.05, 1);
    const near = Math.hypot(player.pos.x - TIME_ISLE.x, player.pos.z - TIME_ISLE.z) < 9;
    if (near && !u.near && !S.ui) toast('⏳ 光锥：按 E 进入，看 330 万年的人类科技史倒流');
    u.near = near;
    const nl = nearLibrary(); if (nl && !u.nearLib && !S.ui) toast('🏛 时光图书馆：按 E 进去'); u.nearLib = nl;
    const nr = nearRootHall(); if (nr && !u.nearRoot && !S.ui) toast('🎞 词根馆：按 E 进去看 191 个词汇动图'); u.nearRoot = nr;
  }
  /* ───────── 词根馆: a little hall on the Island of Time, west of the light cone (press E at the door) ───────── */
  const ROOT_HALL = { x: 455.5, z: 58.5 };
  let rootHall = null;
  function buildRootHall() {
    const gy = groundY(ROOT_HALL.x, ROOT_HALL.z, 60), g = new THREE.Group(), L = (c) => new THREE.MeshLambertMaterial({ color: c });
    const box = (w, h, d, x, y, z, c) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), L(c)); m.position.set(x, y, z); m.castShadow = true; g.add(m); return m; };
    box(9.6, 0.4, 8.6, 0, 0.2, 0, 0xd9d2bf);                                   // plinth
    box(0.3, 3.6, 7.6, -4.2, 2.2, 0, 0x2b2540); box(8.4, 3.6, 0.3, 0, 2.2, -3.8, 0x2b2540); box(8.4, 3.6, 0.3, 0, 2.2, 3.8, 0x2b2540);   // back and side walls
    box(0.3, 3.6, 2.6, 4.2, 2.2, -2.5, 0x2b2540); box(0.3, 3.6, 2.6, 4.2, 2.2, 2.5, 0x2b2540); box(0.3, 0.9, 2.4, 4.2, 3.55, 0, 0x2b2540);   // the front, with a door facing the cone
    const roofS = new THREE.Shape(); roofS.moveTo(-4.9, 0); roofS.lineTo(4.9, 0); roofS.lineTo(0, 2.4); roofS.closePath();
    const roof = new THREE.Mesh(new THREE.ExtrudeGeometry(roofS, { depth: 9.4, bevelEnabled: false }), L(0x8c5ad6)); roof.rotation.y = Math.PI / 2; roof.position.set(-4.7, 4.0, 0); roof.castShadow = true; g.add(roof);
    for (let i = 0; i < 5; i++) { const fr = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.72), new THREE.MeshBasicMaterial({ color: [0xff8fd0, 0x6fe3ff, 0xffd27a, 0x7dffb0, 0xb58cff][i] })); fr.position.set(-3.2 + i * 1.6, 2.4, -3.62); g.add(fr); const f2 = fr.clone(); f2.position.z = 3.62; f2.rotation.y = Math.PI; g.add(f2); }
    const c = document.createElement('canvas'); c.width = 640; c.height = 360; const x = c.getContext('2d'); x.fillStyle = '#14121f'; x.fillRect(0, 0, 640, 360); x.fillStyle = '#ffd96b'; x.font = '700 64px Georgia, serif'; x.textAlign = 'center'; x.fillText('ROOT MAP', 320, 110); x.fillStyle = '#ece6ff'; x.font = '700 44px sans-serif'; x.fillText('词根地图 · 191 个词', 320, 190); x.fillStyle = '#b58cff'; x.font = '30px sans-serif'; x.fillText('jact · port · fer · mit · duct · spect …', 320, 250); x.fillStyle = '#9f95c4'; x.font = '26px sans-serif'; x.fillText('+ 思维模型动图', 320, 310);
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 2.9), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c) })); screen.rotation.y = Math.PI / 2; screen.position.set(-4.02, 2.3, 0); g.add(screen);
    const lamp = new THREE.PointLight(0xb58cff, 0.9, 12, 2); lamp.position.set(0, 3.2, 0); g.add(lamp);
    const s = document.createElement('canvas'); s.width = 512; s.height = 96; const y = s.getContext('2d'); y.fillStyle = 'rgba(20,18,31,.88)'; y.fillRect(0, 0, 512, 96); y.strokeStyle = '#b58cff'; y.lineWidth = 3; y.strokeRect(2, 2, 508, 92); y.fillStyle = '#fff'; y.textAlign = 'center'; y.font = '700 36px sans-serif'; y.fillText('🎞 词根馆 · 词汇动图', 256, 44); y.fillStyle = '#c9bfee'; y.font = '22px sans-serif'; y.fillText('走到门口按 E 进入', 256, 78);
    const lab = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(s), transparent: true, depthWrite: false })); lab.scale.set(6.4, 1.2, 1); lab.position.set(0, 7.4, 0); g.add(lab);
    g.position.set(ROOT_HALL.x, gy, ROOT_HALL.z); scene.add(g); rootHall = g;
  }
  /* ───────── EC-6 学习馆: a red-brick schoolhouse in the south-west of the Island of Time (press E at the door) ─────────
     TExES Core Subjects EC-6 (391) by its official framework, in every way the island can show a body of knowledge: the
     holo console (star map, Obsidian, a light cone of the subjects' history), ten ways of reading, the papercraft island,
     the pop-up book and the Sphere. The hall's own page is ec6/index.html. */
  /* The hall is a hollow box on the voxel grid, so you walk in through the door like into a philosopher's house: its
     walls are cells x 453–464, z 67–76 (the door two cells wide in the east wall, facing the path), and solidAt() asks
     ec6Solid() about them. Inside: a wooden floor, the EC-6 board on the back wall with a desk, and five study stations,
     one per subject exam; E at a station opens that subject's mode, E at the desk or the door opens the hall's page. */
  const EC6_HALL = { x: 459, z: 72, X0: 453, X1: 464, Z0: 67, Z1: 76, door: [71, 72] };
  let ec6Hall = null;
  var ec6Box = null;   // set once the hall is built; read by solidAt(), which may run before this point is reached
  function ec6Solid(x, y, z) {
    const H = ec6Box; if (!H || x < H.X0 || x > H.X1 || z < H.Z0 || z > H.Z1 || y < H.y || y > H.y + 4) return false;
    if (!(x === H.X0 || x === H.X1 || z === H.Z0 || z === H.Z1)) return false;
    return !(x === H.X1 && H.door.indexOf(z) >= 0 && y < H.y + 3);
  }
  const EC6_ST = [];
  function buildEc6Hall() {
    const H = EC6_HALL, gy = groundY(H.x, H.z, 60), g = new THREE.Group(), L = (c) => new THREE.MeshLambertMaterial({ color: c });
    const box = (w, h, d, x, y, z, c) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), typeof c === 'number' ? L(c) : c); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; g.add(m); return m; };
    const brick = 0xa9483a, trim = 0xf3efe4, lining = 0xf1e8d4, WH = 4.3;
    // walls: one cell thick, local x −6…6, z −5…5 (cell centres ±5.5 / ±4.5)
    box(1, WH, 10, -5.5, WH / 2, 0, brick); box(12, WH, 1, 0, WH / 2, -4.5, brick); box(12, WH, 1, 0, WH / 2, 4.5, brick);
    box(1, WH, 4, 5.5, WH / 2, -3, brick); box(1, WH, 3, 5.5, WH / 2, 3.5, brick); box(1, WH - 3, 2, 5.5, 3 + (WH - 3) / 2, 0, brick);   // the door: z −1…1, 3 high
    box(0.08, 3.1, 2.2, 6.04, 1.55, 0, trim).visible = false;
    [[-1.06, 0], [1.06, 0]].forEach((q) => box(0.18, 3.1, 0.14, 6.05, 1.55, q[0], trim)); box(0.2, 0.2, 2.3, 6.05, 3.1, 0, trim);       // door frame
    box(12.4, 0.3, 10.4, 0, WH + 0.15, 0, trim);                                                                                    // cornice
    // inside: floor, lining, ceiling
    box(10, 0.06, 8, 0, 0.03, 0, 0xb98b5a); for (let i = -4; i <= 4; i += 1) box(0.02, 0.07, 8, i + 0.5, 0.035, 0, 0x9c7346);
    box(0.06, 3.2, 8, -4.97, 1.6, 0, lining); box(10, 3.2, 0.06, 0, 1.6, -3.97, lining); box(10, 3.2, 0.06, 0, 1.6, 3.97, lining);
    box(10, 0.5, 0.08, 0, 0.25, -3.93, 0x7a5a3c); box(10, 0.5, 0.08, 0, 0.25, 3.93, 0x7a5a3c); box(0.08, 0.5, 8, -4.93, 0.25, 0, 0x7a5a3c);
    box(10, 0.1, 8, 0, WH - 0.05, 0, 0xf6f0e2);
    for (let i = 0; i < 3; i++) [-4.5, 4.5].forEach((z) => { box(1.4, 1.6, 1.04, -3 + i * 2.8, 2.4, z, 0xbfe3f2); box(1.6, 0.14, 1.1, -3 + i * 2.8, 1.55, z, trim); });
    // roof, bell tower, flag
    const roofS = new THREE.Shape(); roofS.moveTo(-6.6, 0); roofS.lineTo(6.6, 0); roofS.lineTo(0, 3.0); roofS.closePath();
    const roof = new THREE.Mesh(new THREE.ExtrudeGeometry(roofS, { depth: 12.8, bevelEnabled: false }), L(0x3c4a5a)); roof.rotation.y = Math.PI / 2; roof.position.set(-6.4, WH + 0.3, 0); roof.castShadow = true; g.add(roof);
    box(1.8, 2.0, 1.8, 2.0, WH + 3.6, 0, trim); const bell = new THREE.Mesh(new THREE.SphereGeometry(0.46, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), L(0xd4a640)); bell.rotation.x = Math.PI; bell.position.set(2.0, WH + 4.1, 0); g.add(bell);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(1.5, 1.8, 4), L(0x3c4a5a)); cap.position.set(2.0, WH + 5.5, 0); cap.rotation.y = Math.PI / 4; g.add(cap);
    box(0.1, 6.4, 0.1, 8.2, 3.2, -4.2, 0xd9d9d9);
    const fc = document.createElement('canvas'); fc.width = 192; fc.height = 128; const fx = fc.getContext('2d'); fx.fillStyle = '#ffffff'; fx.fillRect(0, 0, 192, 64); fx.fillStyle = '#bf0a30'; fx.fillRect(0, 64, 192, 64); fx.fillStyle = '#002868'; fx.fillRect(0, 0, 64, 128);
    fx.fillStyle = '#fff'; fx.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 9 : 22; fx.lineTo(32 + Math.cos(a) * r, 64 + Math.sin(a) * r); } fx.closePath(); fx.fill();
    const flag = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.2), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(fc), side: THREE.DoubleSide })); flag.position.set(8.2, 5.8, -3.3); flag.rotation.y = Math.PI / 2; g.add(flag);
    // the board on the back wall, and the desk under it
    const c = document.createElement('canvas'); c.width = 768; c.height = 384; const x = c.getContext('2d'); x.fillStyle = '#1f3a2c'; x.fillRect(0, 0, 768, 384); x.strokeStyle = '#a3825a'; x.lineWidth = 18; x.strokeRect(9, 9, 750, 366);
    x.fillStyle = '#f3ecd6'; x.textAlign = 'center'; x.font = '700 76px Georgia, serif'; x.fillText('EC-6 · TExES 391', 384, 108); x.font = '600 30px sans-serif'; x.fillStyle = '#e9e2c8'; x.fillText('5 subject exams · 44 competencies', 384, 160);
    const cols = ['#6fb7ff', '#ffb454', '#ff7a6b', '#7ee08a', '#d08cff'], nm = ['901 ELAR', '902 Math', '903 Social St.', '904 Science', '905 Arts·Health·PE'];
    nm.forEach((n, i) => { x.fillStyle = cols[i]; x.fillRect(40 + i * 140, 214, 128, 12); x.font = '600 21px sans-serif'; x.fillText(n, 104 + i * 140, 262); }); x.fillStyle = '#d9c9a0'; x.font = '26px sans-serif'; x.fillText('在讲台按 E 打开学习馆 · 在学习台按 E 进入那一科', 384, 336);
    const board = new THREE.Mesh(new THREE.PlaneGeometry(6, 3), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c) })); board.rotation.y = Math.PI / 2; board.position.set(-4.92, 2.25, 0); g.add(board);
    box(1.0, 0.9, 2.2, -3.9, 0.45, 0, 0x7a5a3c); box(1.2, 0.08, 2.4, -3.9, 0.94, 0, 0x5b4128); box(0.4, 0.05, 0.3, -3.8, 1.0, 0.6, 0xc0392b);   // desk with an apple
    const apple = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 10), L(0xd2382b)); apple.position.set(-3.8, 1.11, -0.55); g.add(apple);
    // five study stations, one per subject exam, along the two sides of the aisle
    const E6 = window.PIEC6, SP = [[-2.6, -2.4], [0.2, -2.4], [3.0, -2.4], [-1.2, 2.4], [1.8, 2.4]], MODE = { read: 'read:1', paper: 'paper', cone: 'cone', sphere: 'sphere', fold: 'fold', holo: 'holo:stars' }, ICON = { read: '📖', paper: '🗺', cone: '⏳', sphere: '🌐', fold: '📕', holo: '🔷' };
    SP.forEach((q, i) => {
      const ex = E6 ? E6.exams[i] : { code: '90' + (i + 1), zh: '', en: '', mode: 'read', modeZh: '', color: cols[i] }, col = new THREE.Color(ex.color), face = q[1] < 0 ? 1 : -1;
      const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.52, 0.95, 18), L(0xe9e2d0)); ped.position.set(q[0], 0.48, q[1]); g.add(ped);
      const top = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.06, 24), new THREE.MeshBasicMaterial({ color: col })); top.position.set(q[0], 0.98, q[1]); g.add(top);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.03, 8, 40), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.8 })); ring.rotation.x = Math.PI / 2; ring.position.set(q[0], 1.05, q[1]); g.add(ring);
      const sc = document.createElement('canvas'); sc.width = 420; sc.height = 240; const y = sc.getContext('2d'); y.fillStyle = 'rgba(10,14,16,.92)'; y.fillRect(0, 0, 420, 240); y.fillStyle = ex.color; y.fillRect(0, 0, 420, 10); y.fillRect(0, 230, 420, 10);
      y.textAlign = 'center'; y.fillStyle = ex.color; y.font = '700 30px sans-serif'; y.fillText('SUBJECT EXAM ' + (ex.roman || '') + ' · ' + ex.code, 210, 56); y.fillStyle = '#fff'; y.font = '700 44px sans-serif'; y.fillText(ex.zh, 210, 118);
      y.fillStyle = '#e9e2c8'; y.font = '600 30px sans-serif'; y.fillText(ICON[ex.mode] + ' ' + ex.modeZh, 210, 172); y.fillStyle = '#b9b2a0'; y.font = '22px sans-serif'; y.fillText('按 E 进入', 210, 212);
      const scr = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.92), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sc), transparent: true, side: THREE.DoubleSide })); scr.position.set(q[0], 1.95, q[1]); if (face < 0) scr.rotation.y = Math.PI; g.add(scr);
      const glow = new THREE.PointLight(col, 0.6, 4, 2); glow.position.set(q[0], 1.4, q[1]); g.add(glow);
      EC6_ST.push({ i, x: H.x + q[0], z: H.z + q[1], spec: MODE[ex.mode] || 'read:1', label: ex.code + ' ' + ex.zh + ' · ' + ICON[ex.mode] + ' ' + ex.modeZh, ring, scr, by: 1.95 });
    });
    const lamp = new THREE.PointLight(0xffe2b0, 1.0, 14, 2); lamp.position.set(0, 3.6, 0); g.add(lamp);
    const s = document.createElement('canvas'); s.width = 560; s.height = 96; const yy = s.getContext('2d'); yy.fillStyle = 'rgba(20,16,12,.88)'; yy.fillRect(0, 0, 560, 96); yy.strokeStyle = '#e9c46a'; yy.lineWidth = 3; yy.strokeRect(2, 2, 556, 92);
    yy.fillStyle = '#fff'; yy.textAlign = 'center'; yy.font = '700 36px sans-serif'; yy.fillText('🍎 EC-6 学习馆', 280, 44); yy.fillStyle = '#e9d9a6'; yy.font = '22px sans-serif'; yy.fillText('TExES Core Subjects EC-6 · 走进去', 280, 78);
    const lab = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(s), transparent: true, depthWrite: false })); lab.scale.set(7, 1.2, 1); lab.position.set(0, WH + 7.6, 0); g.add(lab);
    g.position.set(H.x, gy, H.z); scene.add(g); ec6Hall = g; ec6Box = Object.assign({ y: Math.round(gy) }, H);
    const pathM = L(0xd9cfb8); for (let px = 466; px <= 470.5; px += 1.5) { const q = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.12, 2.4), pathM); q.position.set(px, groundY(px, H.z, 60) + 0.07, H.z); q.receiveShadow = true; scene.add(q); }
  }
  const insideEc6 = () => ec6Hall && !S.inLib && player.pos.x > EC6_HALL.X0 + 1 && player.pos.x < EC6_HALL.X1 && player.pos.z > EC6_HALL.Z0 + 1 && player.pos.z < EC6_HALL.Z1;
  const nearEc6 = () => ec6Hall && !S.inLib && Math.hypot(player.pos.x - (EC6_HALL.X1 + 1.5), player.pos.z - EC6_HALL.z) < 3.2;   // at the door, outside
  const nearEc6Desk = () => insideEc6() && player.pos.x < EC6_HALL.X0 + 4.2;
  function ec6Station() { if (!insideEc6()) return null; let best = null, bd = 1.9; EC6_ST.forEach((st) => { const d = Math.hypot(player.pos.x - st.x, player.pos.z - st.z); if (d < bd) { bd = d; best = st; } }); return best; }
  function updateEc6(t) {
    if (!ec6Hall || S.inLib) return; EC6_ST.forEach((st, k) => { st.ring.rotation.z = t * 0.8 + k; st.scr.position.y = st.by + Math.sin(t * 1.6 + k) * 0.05; });
    const u = ec6Hall.userData, st = ec6Station(), key = st ? 'st' + st.i : nearEc6Desk() ? 'desk' : nearEc6() ? 'door' : insideEc6() ? 'in' : '';
    if (key !== u.key && !S.ui) { if (st) toast('按 E · ' + st.label); else if (key === 'desk') toast('🍎 讲台：按 E 打开学习馆，五门学科、全部模式'); else if (key === 'door') toast('🍎 EC-6 学习馆：走进去，或按 E 直接打开'); else if (key === 'in' && u.key !== 'desk' && !/^st/.test(u.key || '')) toast('🍎 欢迎来到 EC-6 学习馆 · 五个学习台各是一门学科'); }
    u.key = key;
  }
  let ec6El = null;
  function openEc6(spec, sub) {
    if (!ec6El) { ec6El = document.createElement('div'); ec6El.id = 'pi-ec6'; ec6El.style.cssText = 'position:fixed;inset:0;z-index:72;display:none;background:#0b0e10';
      ec6El.innerHTML = '<iframe title="EC-6 学习馆" style="position:absolute;inset:0;width:100%;height:100%;border:0" allow="fullscreen"></iframe>'; document.body.appendChild(ec6El);
      ['mousedown', 'touchstart', 'pointerdown', 'wheel'].forEach((ev) => ec6El.addEventListener(ev, (e) => e.stopPropagation(), { passive: true }));
      window.addEventListener('message', (e) => { const m = e.data; if (!m || m.ec6 !== 1 || !ec6El || e.source !== ec6El.firstChild.contentWindow) return; if (m.op === 'close') closeEc6(); }); }
    ec6El.firstChild.src = 'ec6/index.html' + (spec ? '?open=' + encodeURIComponent(spec) + '&sub=' + (sub >= 0 ? sub : -1) + '&back=1' : ''); ec6El.style.display = 'block'; S.ui = true; if (document.pointerLockElement && document.exitPointerLock) document.exitPointerLock();
  }
  function closeEc6() { if (!ec6El) return; ec6El.style.display = 'none'; ec6El.firstChild.src = 'about:blank'; S.ui = false; }
  window.__openEc6 = openEc6;
  /* the Sphere, after the one in Las Vegas: a dome three-quarters of a ball on a dark podium, its whole skin an LED
     "exosphere" that cycles through pictures (mosaic, the yellow face, the Earth, an eye). About one tenth of the real
     157 m width — the island could not hold more. Press E beside it for the wall of GIFs. */
  const SPHERE = { x: 487.5, z: 62.5, R: 8 }; let sphereBall = null;
  function drawExo(q, mode, t) { const W = 512, H = 256, px = (x, y, c) => { q.fillStyle = c; q.fillRect(x * 4, y * 4, 4, 4); }; q.fillStyle = '#05040a'; q.fillRect(0, 0, W, H);
    for (let i = 0; i < 128; i++) for (let j = 0; j < 64; j++) { let c; const u = i / 128, v = j / 64;
      if (mode === 0) c = 'hsl(' + ((i * 11 + j * 23 + t * 40) % 360) + ',85%,' + (38 + 22 * Math.sin(i * 0.7 + j * 0.5 + t * 2)) + '%)';
      else if (mode === 1) { const fx = ((u * 2) % 1) - 0.5, fy = v - 0.5, eye = Math.hypot((Math.abs(fx) - 0.11) * 1.6, fy + 0.08) < 0.05, mouth = Math.abs(Math.hypot(fx * 1.5, fy - 0.02) - 0.2) < 0.03 && fy > 0.06; c = eye || mouth ? '#3a2a10' : 'hsl(48,95%,' + (52 + 6 * Math.sin(t * 3 + i)) + '%)'; }
      else if (mode === 2) { const land = Math.sin(u * 19 + 1.3) * Math.cos(v * 11 + u * 7) + Math.sin(u * 7 - v * 5) > 0.55, ice = v < 0.08 || v > 0.92; c = ice ? '#eef6ff' : land ? 'hsl(' + (95 + 30 * Math.sin(i + j)) + ',50%,38%)' : 'hsl(212,75%,' + (36 + 8 * Math.sin(i * 0.5 + t)) + '%)'; }
      else { const fx = ((u * 2) % 1) - 0.5, fy = (v - 0.5) * 0.9, r = Math.hypot(fx * 1.8, fy), lid = Math.abs(fy) > 0.26 * Math.cos(fx * Math.PI) * (0.6 + 0.4 * Math.abs(Math.sin(t * 0.7))); c = lid ? '#c9a07a' : r < 0.07 ? '#0a0a0a' : r < 0.18 ? 'hsl(' + (200 + 40 * Math.sin(Math.atan2(fy, fx) * 6)) + ',70%,45%)' : '#f4f2ec'; }
      px(i, j, c); } }
  function buildSphere() { const R = SPHERE.R, gy = groundY(SPHERE.x, SPHERE.z, 60), g = new THREE.Group(), c = document.createElement('canvas'); c.width = 512; c.height = 256; const q = c.getContext('2d'); drawExo(q, 0, 0); const tex = new THREE.CanvasTexture(c);
    const ball = new THREE.Mesh(new THREE.SphereGeometry(R, 48, 32, 0, Math.PI * 2, 0, Math.PI * 0.76), new THREE.MeshBasicMaterial({ map: tex })); ball.position.y = R * 0.74 + 1.2; g.add(ball);
    const L = (col) => new THREE.MeshLambertMaterial({ color: col }), add = (geo, m, y) => { const o = new THREE.Mesh(geo, m); o.position.y = y; g.add(o); return o; };
    add(new THREE.CylinderGeometry(R * 0.74, R * 0.8, 1.2, 40), L(0x16141c), 0.6); add(new THREE.CylinderGeometry(R * 0.98, R * 1.02, 0.35, 48), L(0x24212c), 0.18); add(new THREE.TorusGeometry(R * 0.76, 0.12, 8, 48), new THREE.MeshBasicMaterial({ color: 0x8fd0ff }), 1.25).rotation.x = Math.PI / 2;
    const ent = new THREE.Mesh(new THREE.BoxGeometry(3.4, 2.2, 2.4), L(0x1c1a24)); ent.position.set(-R * 0.86, 1.1, 0); g.add(ent); const door = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.6), new THREE.MeshBasicMaterial({ color: 0xfff0c0 })); door.rotation.y = -Math.PI / 2; door.position.set(-R * 0.86 - 1.71, 0.9, 0); g.add(door);
    const glow = new THREE.PointLight(0xb58cff, 0.9, 40, 2); glow.position.y = R; g.add(glow);
    const s = document.createElement('canvas'); s.width = 512; s.height = 96; const y = s.getContext('2d'); y.fillStyle = 'rgba(20,18,31,.88)'; y.fillRect(0, 0, 512, 96); y.strokeStyle = '#b58cff'; y.lineWidth = 3; y.strokeRect(2, 2, 508, 92); y.fillStyle = '#fff'; y.textAlign = 'center'; y.font = '700 36px sans-serif'; y.fillText('🌐 Sphere · 环球巨幕', 256, 44); y.fillStyle = '#c9bfee'; y.font = '22px sans-serif'; y.fillText('走近按 E · 进去看两百块屏幕', 256, 78);
    const lab = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(s), transparent: true, depthWrite: false })); lab.scale.set(9, 1.7, 1); lab.position.y = R * 1.74 + 3; g.add(lab);
    g.position.set(SPHERE.x, gy, SPHERE.z); g.userData = { ball, q, tex, last: -1 }; scene.add(g); sphereBall = g; }
  function updateSphere(t) { if (!sphereBall || S.inLib) return; const u = sphereBall.userData, tick = Math.floor(t * 5); if (!u.custom && tick !== u.last && Math.hypot(player.pos.x - SPHERE.x, player.pos.z - SPHERE.z) < 160) { u.last = tick; drawExo(u.q, Math.floor(t / 9) % 4, t); u.tex.needsUpdate = true; } u.ball.rotation.y = t * 0.08; const ns = nearSphere(); if (ns && !u.nearS && !S.ui) toast('🌐 Sphere：按 E 进去看巨幕 · 按 X 把你自己的图片、GIF 或视频放到外壳上（Shift+X 恢复）'); u.nearS = ns; }
  // your own picture, GIF or video on the Sphere's skin (X beside it; Shift+X puts the default show back)
  function sphereSet(tex, extra) { const u = sphereBall.userData; if (u.custom && u.custom.video) { u.custom.video.pause(); u.custom.video.src = ''; } u.customId = (u.customId || 0) + 1; u.custom = tex ? Object.assign({ tex }, extra || {}) : null; u.ball.material.map = tex || u.tex; u.ball.material.needsUpdate = true; return u.customId; }
  function sphereFile(file) { if (!file || !sphereBall) return; const url = URL.createObjectURL(file), name = file.name || '';
    if (/^video\//.test(file.type)) { const v = document.createElement('video'); v.src = url; v.muted = true; v.loop = true; v.playsInline = true; v.play().then(() => { const t = new THREE.VideoTexture(v); sphereSet(t, { video: v }); toast('🌐 Sphere 正在播放你的视频：' + name); }).catch(() => toast('这个视频浏览器放不了，换一个 mp4 或 webm 试试')); return; }
    if (file.type === 'image/gif' && window.ImageDecoder) { file.arrayBuffer().then(async (buf) => { const dec = new ImageDecoder({ data: buf, type: 'image/gif' }); await dec.tracks.ready; const n = dec.tracks.selectedTrack.frameCount, c = document.createElement('canvas'); c.width = 1024; c.height = 512; const q = c.getContext('2d'), t = new THREE.CanvasTexture(c), id = sphereSet(t, {}); let i = 0;
        const next = async () => { if (!sphereBall || sphereBall.userData.customId !== id) return; try { const r = await dec.decode({ frameIndex: i }); q.drawImage(r.image, 0, 0, c.width, c.height); const d = (r.image.duration || 100000) / 1000; r.image.close(); t.needsUpdate = true; i = (i + 1) % n; setTimeout(next, Math.max(20, d)); } catch (e) {} }; next(); toast('🌐 Sphere 正在播放你的 GIF：' + name + '（' + n + ' 帧）'); }).catch(() => toast('这张 GIF 读不出来')); return; }
    new THREE.TextureLoader().load(url, (t) => { sphereSet(t, {}); toast('🌐 Sphere 换上了你的图片：' + name + (file.type === 'image/gif' ? '（这个浏览器不支持逐帧解码，只显示第一帧）' : '')); }, undefined, () => toast('这张图片读不出来')); }
  function sphereMedia(reset) { if (!sphereBall) return; if (reset) { sphereSet(null); sphereBall.userData.last = -1; toast('🌐 Sphere 恢复了默认画面'); return; } let inp = document.getElementById('pi-sphere-file'); if (!inp) { inp = document.createElement('input'); inp.type = 'file'; inp.id = 'pi-sphere-file'; inp.accept = 'image/*,video/*'; inp.style.display = 'none'; document.body.appendChild(inp); inp.onchange = () => { sphereFile(inp.files && inp.files[0]); inp.value = ''; }; } if (document.pointerLockElement && document.exitPointerLock) document.exitPointerLock(); inp.click(); }
  window.__sphereFile = sphereFile;
  const nearSphere = () => sphereBall && !S.inLib && Math.hypot(player.pos.x - SPHERE.x, player.pos.z - SPHERE.z) < SPHERE.R + 5;
  /* the grounds of the Island of Time, each in the manner of its building: a stone forecourt with hedges and lamps for
     the library, a dark plaza with rings of light for the Sphere, a violet court for the root hall, paths between */
  function buildTimeIsleGrounds() { const g = new THREE.Group(), B = (c, o) => new THREE.MeshBasicMaterial(Object.assign({ color: c }, o || {})), L = (c) => new THREE.MeshLambertMaterial({ color: c }), gy = (x, z) => groundY(x, z, 60);
    const slab = (w, d, x, z, m, lift) => { const q = new THREE.Mesh(new THREE.BoxGeometry(w, 0.12, d), m); q.position.set(x, gy(x, z) + (lift || 0.06), z); q.receiveShadow = true; g.add(q); return q; };
    const disc = (r, x, z, m, lift) => { const q = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.12, 48), m); q.position.set(x, gy(x, z) + (lift || 0.06), z); g.add(q); return q; };
    const ring = (r0, r1, x, z, m, lift) => { const q = new THREE.Mesh(new THREE.RingGeometry(r0, r1, 64), m); q.rotation.x = -Math.PI / 2; q.position.set(x, gy(x, z) + (lift || 0.14), z); g.add(q); return q; };
    const lamp = (x, z, col) => { const y = gy(x, z); const p = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 3, 8), L(0x2a2a2a)); p.position.set(x, y + 1.5, z); g.add(p); const b = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 10), B(col || 0xffe7b0)); b.position.set(x, y + 3.15, z); g.add(b); };
    const hedge = (w, d, x, z) => { const q = new THREE.Mesh(new THREE.BoxGeometry(w, 0.9, d), L(0x3f7a4a)); q.position.set(x, gy(x, z) + 0.45, z); q.castShadow = true; g.add(q); };
    // library: pale stone forecourt, hedges, lamps, two urns
    const stone = L(0xe6dfd0), stoneD = L(0xcfc6b2); slab(26, 9, 471.5, 49.5, stone); slab(4.6, 9, 471.5, 49.5, stoneD, 0.08); [-9, -4.5, 4.5, 9].forEach((o) => lamp(471.5 + o, 52.6)); [[-9.5, 47.5], [9.5, 47.5]].forEach((q) => hedge(5, 1.2, 471.5 + q[0], q[1])); [-3.4, 3.4].forEach((o) => { const u = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.3, 0.9, 12), L(0xf4ecd8)); u.position.set(471.5 + o, gy(471.5 + o, 46.6) + 0.5, 46.6); g.add(u); const f = new THREE.Mesh(new THREE.IcosahedronGeometry(0.55, 1), L(0xc9573c)); f.position.set(471.5 + o, gy(471.5 + o, 46.6) + 1.2, 46.6); g.add(f); });
    // the Sphere: a dark plaza with rings of light and bollards
    disc(11.5, SPHERE.x, SPHERE.z, L(0x1a1822)); [9.2, 10.4, 11.4].forEach((r, i) => ring(r - 0.12, r, SPHERE.x, SPHERE.z, B([0x8fd0ff, 0xb58cff, 0xff8fd0][i]))); for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2, x = SPHERE.x + Math.cos(a) * 10.9, z = SPHERE.z + Math.sin(a) * 10.9, b = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.8, 8), B(0xb58cff)); b.position.set(x, gy(x, z) + 0.5, z); g.add(b); }
    // the root hall: a violet court with a border of light
    slab(13, 12, ROOT_HALL.x, ROOT_HALL.z, L(0x3a3158)); ring(0, 0, 0, 0, B(0)); [[6.6, 0, 0.14, 12], [-6.6, 0, 0.14, 12], [0, 6.1, 13, 0.14], [0, -6.1, 13, 0.14]].forEach((q) => slab(q[2], q[3], ROOT_HALL.x + q[0], ROOT_HALL.z + q[1], B(0xb58cff), 0.1)); lamp(462.6, 55, 0xb58cff); lamp(462.6, 62, 0xb58cff);
    // the light cone's round court and the paths that join everything
    ring(5.8, 7.6, TIME_ISLE.x, TIME_ISLE.z, L(0xd9d2bf), 0.1); const path = L(0xd9cfb8); slab(3, 5, 471.5, 46.5 + 0, path, 0.07); slab(8, 2.4, 465.5, 58, path, 0.07); slab(6, 2.4, 481.5, 60, path, 0.07); slab(3, 10, 471.5, 68.5, path, 0.07);
    scene.add(g); }
  const nearRootHall = () => rootHall && Math.hypot(player.pos.x - ROOT_HALL.x, player.pos.z - ROOT_HALL.z) < 6.5;
  /* ───────── Königsberg, about 1790: the setting of Kant's afternoon walk, east of his house ─────────
     a lime-tree walk (the "Philosophengang"), the cathedral with its clock at half past three, the Pregel and a wooden
     bridge, two neighbours setting a watch, and Lampe, the old servant, who follows with an umbrella when Kant walks */
  let konig = null;
  function buildKonigsberg() {
    const g = new THREE.Group(), L = (c) => new THREE.MeshLambertMaterial({ color: c }), gy = (x, z) => groundY(x, z, 60);
    const box = (w, h, d, x, y, z, c, ry) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), typeof c === 'number' ? L(c) : c); m.position.set(x, y, z); if (ry) m.rotation.y = ry; m.castShadow = true; g.add(m); return m; };
    const label = (text, sub, x, y, z, w) => { const c = document.createElement('canvas'); c.width = 640; c.height = sub ? 120 : 76; const q = c.getContext('2d'); q.fillStyle = 'rgba(40,30,22,.86)'; q.fillRect(0, 0, 640, c.height); q.strokeStyle = '#d9b46a'; q.lineWidth = 3; q.strokeRect(2, 2, 636, c.height - 4); q.textAlign = 'center'; q.fillStyle = '#fff3d6'; q.font = '700 34px "Songti SC", serif'; q.fillText(text, 320, 48); if (sub) { q.fillStyle = '#e2cfa4'; q.font = '22px "Songti SC", serif'; q.fillText(sub, 320, 92); }
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false })); sp.scale.set(w || 7, (w || 7) * c.height / 640, 1); sp.position.set(x, y, z); g.add(sp); return sp; };
    // the lime walk: two rows of pollarded limes along the first leg of the route, lanterns between them
    const limeT = L(0x6b4a32), limeC = [L(0x9cc45e), L(0x86b24e), L(0xb2d06a)], crown = new THREE.IcosahedronGeometry(1.2, 1), trunk = new THREE.CylinderGeometry(0.16, 0.22, 2.6, 6);
    for (let i = 0; i <= 8; i++) [-3.3, 3.3].forEach((o, k) => { const x = 256 + i * 4, z = 143 - (i > 4 ? (i - 4) * 0.5 : 0) + o, y = gy(x, z); const t = new THREE.Mesh(trunk, limeT); t.position.set(x, y + 1.5, z); t.scale.y = 1.15; g.add(t); const cr = new THREE.Mesh(crown, limeC[(i + k) % 3]); cr.position.set(x, y + 3.9, z); cr.scale.set(1, 0.9, 1); cr.castShadow = true; g.add(cr); });
    [262, 274, 286].forEach((x) => { const y = gy(x, 140.2); box(0.14, 2.6, 0.14, x, y + 1.3, 140.2, 0x2a2a2a); const lm = box(0.42, 0.5, 0.42, x, y + 2.8, 140.2, new THREE.MeshBasicMaterial({ color: 0xffe2a0 })); lm.castShadow = false; });
    label('椴树小径 · Philosophengang', '康德每天下午在这里来回散步', 266, gy(266, 143) + 6.6, 143, 8);
    // the cathedral: brick Gothic, a west tower with a clock stopped at half past three
    const cx = 298, cz = 133, cy = gy(cx, cz), BR = 0x9a4a36, BR2 = 0x86402f;
    box(8, 7, 15, cx, cy + 3.5, cz, BR); for (let i = 0; i < 5; i++) { box(0.5, 7, 0.9, cx - 4.2, cy + 3.5, cz - 6 + i * 3, BR2); box(0.5, 7, 0.9, cx + 4.2, cy + 3.5, cz - 6 + i * 3, BR2); const w = box(0.1, 3.2, 1.1, cx - 4.06, cy + 4, cz - 4.5 + i * 3 - (i === 4 ? 9 : 0), new THREE.MeshBasicMaterial({ color: 0xf3d98a })); w.castShadow = false; }
    const rs = new THREE.Shape(); rs.moveTo(-4.4, 0); rs.lineTo(4.4, 0); rs.lineTo(0, 5.2); rs.closePath(); const roof = new THREE.Mesh(new THREE.ExtrudeGeometry(rs, { depth: 15.4, bevelEnabled: false }), L(0x5a3a30)); roof.position.set(cx, cy + 7, cz - 7.7); roof.castShadow = true; g.add(roof);
    const tz = cz + 9.5; box(5.4, 14, 5, cx - 1.4, cy + 7, tz, BR); const sp1 = new THREE.Mesh(new THREE.ConeGeometry(3.6, 7, 4), L(0x4f7a6a)); sp1.position.set(cx - 1.4, cy + 17.5, tz); sp1.rotation.y = Math.PI / 4; g.add(sp1); box(4.6, 9, 4.6, cx + 2.9, cy + 4.5, tz, BR2);
    const cc = document.createElement('canvas'); cc.width = cc.height = 256; const q = cc.getContext('2d'); q.fillStyle = '#f6efd8'; q.beginPath(); q.arc(128, 128, 120, 0, 7); q.fill(); q.lineWidth = 10; q.strokeStyle = '#3a2a20'; q.stroke(); for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283; q.fillStyle = '#3a2a20'; q.fillRect(128 + Math.sin(a) * 98 - 4, 128 - Math.cos(a) * 98 - 4, 8, 8); }
    const hand = (a, len, w) => { q.lineWidth = w; q.lineCap = 'round'; q.beginPath(); q.moveTo(128, 128); q.lineTo(128 + Math.sin(a) * len, 128 - Math.cos(a) * len); q.stroke(); }; hand(3.5 / 12 * 6.283, 58, 12); hand(Math.PI, 92, 8);
    const face = new THREE.Mesh(new THREE.CircleGeometry(1.7, 32), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cc) })); face.rotation.y = -Math.PI / 2; face.position.set(cx - 4.12, cy + 11, tz); g.add(face);
    box(2.2, 3.4, 0.3, cx - 4.1, cy + 1.7, tz, 0x4a3226, Math.PI / 2);
    label('柯尼斯堡大教堂', '钟停在三点半 · 康德后来就葬在它的墙边', cx - 5, cy + 22, tz, 9);
    // the Pregel and a wooden bridge with railings
    const by = gy(292, 146) + 0.15; box(3.4, 0.25, 13, 292, by + 0.5, 151.5, 0x8a6a48); for (let i = 0; i < 6; i++) { [-1.6, 1.6].forEach((o) => box(0.2, 1.3, 0.2, 292 + o, by + 1.1, 146 + i * 2.2, 0x6b4f36)); if (i < 5) box(0.3, 2.6, 0.3, 292, by - 0.8, 147 + i * 2.2, 0x5a4230); } [-1.6, 1.6].forEach((o) => box(0.14, 0.14, 12, 292 + o, by + 1.7, 151.5, 0x6b4f36));
    label('普列戈利亚河', '七桥问题说的就是这条河上的桥', 292, by + 5, 150, 7);
    // people: paper-doll figures in the island's blocky manner
    const figure = (x, z, coat, hat, ry) => { const f = new THREE.Group(), y = gy(x, z); const add = (w, h, d, px, py, pz, c) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), L(c)); m.position.set(px, py, pz); m.castShadow = true; f.add(m); return m; };
      add(0.22, 0.8, 0.24, -0.14, 0.4, 0, 0x2f2a2a); add(0.22, 0.8, 0.24, 0.14, 0.4, 0, 0x2f2a2a); add(0.62, 0.78, 0.34, 0, 1.18, 0, coat); add(0.4, 0.4, 0.4, 0, 1.78, 0, 0xe8c4a0); if (hat) { add(0.62, 0.08, 0.62, 0, 2.0, 0, 0x1f1c1c); add(0.4, 0.2, 0.4, 0, 2.12, 0, 0x1f1c1c); } else add(0.44, 0.14, 0.44, 0, 2.02, 0, 0xd8d4cc);
      f.userData.armR = add(0.16, 0.66, 0.2, 0.4, 1.2, 0, coat); add(0.16, 0.66, 0.2, -0.4, 1.2, 0, coat); f.position.set(x, y, z); f.rotation.y = ry || 0; g.add(f); return f; };
    const n1 = figure(284.5, 136.5, 0x6a4a7a, true, 0.6), n2 = figure(286, 137.4, 0x3f6a5a, true, -2.2); n1.userData.armR.rotation.x = -1.1; n1.userData.armR.position.set(0.4, 1.4, 0.24); const watch = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.04, 14), new THREE.MeshBasicMaterial({ color: 0xffd76a })); watch.rotation.x = Math.PI / 2; watch.position.set(0.4, 1.62, 0.5); n1.add(watch);
    label('“康德教授出门了——三点半，对表。”', null, 285.2, gy(285, 137) + 3.5, 137, 6.4);
    const lampe = figure(246, 139.5, 0x5a4a3a, false, 1.2); const um = new THREE.Group(), stick = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.5, 6), L(0x3a2a20)); stick.position.y = 0.75; um.add(stick); const canopy = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.9, 8), L(0x2f3a4a)); canopy.position.y = 1.2; um.add(canopy); um.position.set(0.48, 0.9, 0.1); um.rotation.z = -0.25; lampe.add(um);
    const lampeTag = label('仆人兰佩 · 夹着伞跟在后面', null, 246, gy(246, 139.5) + 3.2, 139.5, 5); 
    scene.add(g); konig = { g, lampe, lampeTag, home: [246, 139.5], n1, n2, t: 0 };
  }
  function updateKonigsberg(t, dt) {
    if (!konig) return; const k = konig, tk = S.talk, walking = tk && tk.mode === 'walk' && tk.n && tk.n.phil.id === 'kant';
    let tx = k.home[0], tz = k.home[1]; if (walking) { const n = tk.n, a = tk.path[tk.seg] || tk.path[0], b = tk.path[Math.min(tk.path.length - 1, tk.seg + 1)], dl = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, ux = (b[0] - a[0]) / dl, uz = (b[1] - a[1]) / dl; tx = n.x - ux * 3.4 - uz * 1.5; tz = n.z - uz * 3.4 + ux * 1.5; }
    const L = k.lampe, dx = tx - L.position.x, dz = tz - L.position.z, d = Math.hypot(dx, dz);
    if (d > 0.25) { const sp = Math.min(d, (walking ? 1.9 : 1.2) * (dt || 0.016)); L.position.x += dx / d * sp; L.position.z += dz / d * sp; L.rotation.y = Math.atan2(dx, dz); L.position.y = groundY(L.position.x, L.position.z, 60) + Math.abs(Math.sin(t * 8)) * 0.05; }
    k.lampeTag.position.set(L.position.x, L.position.y + 3.2, L.position.z); k.lampeTag.visible = !walking;
    k.n1.userData.armR.rotation.x = -1.1 + Math.sin(t * 1.5) * 0.08; k.n2.rotation.y = -2.2 + Math.sin(t * 0.7) * 0.15;
  }
  /* ───────── bookcases: every hall has one beside its round table, the books face out with their real covers ─────────
     look at a cover and click (or press E) to open that book; E beside the case opens the whole shelf */
  const cases = []; let bookHit = null; const bookRay = new THREE.Raycaster(), texLoader = new THREE.TextureLoader();
  function buildBookcases() {
    const LIB = window.PILIB || {}, wood = new THREE.MeshLambertMaterial({ color: 0x6b4a30 }), woodD = new THREE.MeshLambertMaterial({ color: 0x4a3020 });
    world.PHILOSOPHERS.forEach((p) => { const books = (LIB[p.id] || []).slice(0, 8); if (!books.length) return;
      const t = tableOf(p), x = t.x - 2.5, z = t.z + 0.2, y = groundY(x, z, p.gy + 3), g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = Math.PI / 2;      // the open side faces +x, towards the table
      const add = (w, h, d, px, py, pz, m) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(px, py, pz); g.add(b); return b; };
      add(2.9, 2.5, 0.08, 0, 1.25, -0.22, woodD); add(0.1, 2.5, 0.5, -1.45, 1.25, 0, wood); add(0.1, 2.5, 0.5, 1.45, 1.25, 0, wood); [0.08, 1.2, 2.46].forEach((h) => add(2.9, 0.08, 0.5, 0, h, 0, wood));
      const c = document.createElement('canvas'); c.width = 512; c.height = 80; const q = c.getContext('2d'); q.fillStyle = 'rgba(40,28,18,.88)'; q.fillRect(0, 0, 512, 80); q.strokeStyle = '#d9b46a'; q.lineWidth = 3; q.strokeRect(2, 2, 508, 76); q.fillStyle = '#fff3d6'; q.textAlign = 'center'; q.font = '700 30px "Songti SC", serif'; q.fillText('📚 ' + p.name.slice(0, 8) + '的书 · 看着封面点一下', 256, 50);
      const lab = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false })); lab.scale.set(3.2, 0.5, 1); lab.position.set(0, 2.95, 0); g.add(lab);
      const meshes = books.map((b, i) => { const row = i < 4 ? 1 : 0, col = i % 4, n = row ? Math.min(4, books.length) : books.length - 4, m = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.84, 0.07), new THREE.MeshLambertMaterial({ color: [0x8c3b2e, 0x2f5a6b, 0x6b5a2a, 0x4a3a6b][i % 4] }));
        m.position.set((col - (n - 1) / 2) * 0.68, (row ? 1.7 : 0.58), 0.06); m.rotation.x = -0.1; m.userData = { hall: p.id, i, book: b, baseZ: 0.06 }; g.add(m); return m; });
      scene.add(g); cases.push({ p, g, x, z, y, meshes, loaded: false }); });
  }
  function coverTex(b, mesh) { const done = (tex) => { mesh.material = [mesh.material, mesh.material, mesh.material, mesh.material, new THREE.MeshBasicMaterial({ map: tex }), mesh.material]; };
    const drawn = () => { const c = document.createElement('canvas'); c.width = 240; c.height = 360; const q = c.getContext('2d'), gr = q.createLinearGradient(0, 0, 240, 360); gr.addColorStop(0, '#8c3b2e'); gr.addColorStop(1, '#4a2420'); q.fillStyle = gr; q.fillRect(0, 0, 240, 360); q.strokeStyle = '#e2c88a'; q.lineWidth = 4; q.strokeRect(12, 12, 216, 336); q.fillStyle = '#fff3d6'; q.textAlign = 'center'; q.font = '700 30px "Songti SC", serif'; const t = (b.zh || b.title).slice(0, 18); for (let k = 0; k < t.length; k += 6) q.fillText(t.slice(k, k + 6), 120, 130 + k / 6 * 42); q.font = '20px "Songti SC", serif'; q.fillStyle = '#e2c88a'; q.fillText((b.authorZh || b.author).slice(0, 10), 120, 310); done(new THREE.CanvasTexture(c)); };
    if (b.cover) texLoader.load(b.cover, done, undefined, drawn); else drawn(); }
  function updateBookcases(t) { if (!cases.length) return; let near = null, nd = 1e9;
    for (const c of cases) { const d = Math.hypot(player.pos.x - c.x, player.pos.z - c.z); if (d < nd && Math.abs(player.pos.y - c.y) < 5) { nd = d; near = c; } }
    if (near && nd < 26 && !near.loaded) { near.loaded = true; near.meshes.forEach((m) => coverTex(m.userData.book, m)); }
    let hit = null; if (near && nd < 6.5 && !S.ui) { bookRay.setFromCamera(new THREE.Vector2(0, 0), camera); bookRay.far = 7; const h = bookRay.intersectObjects(near.meshes)[0]; if (h) hit = h.object; }
    if (hit !== bookHit) { if (bookHit) { bookHit.position.z = bookHit.userData.baseZ; bookHit.scale.setScalar(1); } bookHit = hit; if (hit) { hit.position.z = hit.userData.baseZ + 0.16; hit.scale.setScalar(1.12); const b = hit.userData.book; toast('📖 《' + (b.zh || b.title).slice(0, 26) + '》 ' + (b.authorZh || b.author) + (b.file ? ' · 点一下翻开' : ' · 仍在版权期，只有书目')); } }
    S.nearCase = near && nd < 3.2 ? near : null; }
  /* ───────── the great library on the Island of Time: a domed hall with a colonnade, north of the light cone ───────── */
  const LIBRARY = { x: 471.5, z: 40.5 }; let libHall = null;
  function buildLibrary() {
    const gy = groundY(LIBRARY.x, LIBRARY.z + 5, 60), g = new THREE.Group(), L = (c) => new THREE.MeshLambertMaterial({ color: c });
    const box = (w, h, d, x, y, z, c) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), typeof c === 'number' ? L(c) : c); m.position.set(x, y, z); m.castShadow = true; g.add(m); return m; };
    for (let i = 0; i < 3; i++) box(21 - i * 1.2, 0.35, 12 - i * 0.8, 0, 0.18 + i * 0.35, 0.4 - i * 0.4, 0xe3dccb);
    box(17, 6.2, 8, 0, 4.2, -1, 0xefe7d6); box(4.2, 4.2, 0.4, 0, 3.2, 3.02, 0x4a3020);
    for (let i = 0; i < 8; i++) { const cx = -7.7 + i * 2.2; if (Math.abs(cx) < 1.2) continue; const c = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.42, 6, 12), L(0xfbf6ea)); c.position.set(cx, 4.1, 4.2); c.castShadow = true; g.add(c); box(1.0, 0.3, 1.0, cx, 7.2, 4.2, 0xfbf6ea); }
    box(18.4, 0.7, 2.4, 0, 7.7, 4.0, 0xe3dccb); const ps = new THREE.Shape(); ps.moveTo(-9.4, 0); ps.lineTo(9.4, 0); ps.lineTo(0, 3); ps.closePath(); const ped = new THREE.Mesh(new THREE.ExtrudeGeometry(ps, { depth: 2.4, bevelEnabled: false }), L(0xf4ecd8)); ped.position.set(0, 8.05, 2.8); ped.castShadow = true; g.add(ped);
    box(17.6, 0.6, 8.6, 0, 7.6, -1, 0xd9d0bb); const drum = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.4, 2.2, 24), L(0xefe7d6)); drum.position.set(0, 9, -1); g.add(drum); const dome = new THREE.Mesh(new THREE.SphereGeometry(4.2, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2), L(0x4f8a84)); dome.position.set(0, 10.1, -1); dome.castShadow = true; g.add(dome); box(0.5, 1.4, 0.5, 0, 14.9, -1, 0xe9b949);
    [-5.5, 5.5].forEach((x) => { for (let k = 0; k < 2; k++) { const w = box(2.4, 1.9, 0.1, x, 2.6 + k * 2.6, 3.02, new THREE.MeshBasicMaterial({ color: 0xffe2a0 })); w.castShadow = false; } });
    const c = document.createElement('canvas'); c.width = 768; c.height = 128; const q = c.getContext('2d'); q.fillStyle = 'rgba(42,28,18,.9)'; q.fillRect(0, 0, 768, 128); q.strokeStyle = '#e9b949'; q.lineWidth = 4; q.strokeRect(3, 3, 762, 122); q.textAlign = 'center'; q.fillStyle = '#fff3d6'; q.font = '700 46px "Songti SC", serif'; q.fillText('🏛 时光图书馆', 384, 58); q.fillStyle = '#e2cfa4'; q.font = '26px "Songti SC", serif'; q.fillText('走上台阶按 E 走进去 · 十面书架，本本可翻', 384, 102);
    const lab = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false })); lab.scale.set(11, 1.83, 1); lab.position.set(0, 17.2, 2); g.add(lab);
    const lamp = new THREE.PointLight(0xffe2a0, 0.8, 16, 2); lamp.position.set(0, 4, 6); g.add(lamp);
    g.position.set(LIBRARY.x, gy, LIBRARY.z); scene.add(g); libHall = g;
  }
  /* ───────── inside the library: a real hall you walk through in third person — rows of shelves by subject, every book
     face-out with its own cover; look at a book and click to open it. The hall is a pocket above the island (floor y = 60);
     while S.inLib is set, collisions are answered by libSolid() instead of the voxel world. ───────── */
  const LIB = { y: 60, top: 79, floor: new Map(), sol: new Map(), books: [], group: null, hit: null, ray: new THREE.Raycaster(), loader: new THREE.TextureLoader() };
  function libBlock(x0, x1, z0, z1, y0, y1) { for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) { const k = x + ',' + z; let a = LIB.sol.get(k); if (!a) LIB.sol.set(k, a = []); a.push(y0, y1); } }
  function libSolid(x, y, z) { const k = x + ',' + z, f = LIB.floor.get(k); if (f === undefined || y < f || y >= LIB.top) return true; const a = LIB.sol.get(k); if (!a) return false; for (let i = 0; i < a.length; i += 2) if (y >= a[i] && y < a[i + 1]) return true; return false; }
  /* The British Library at St Pancras, laid out from its published ground-floor plan (Wikimedia Commons, public domain) at
     about 4 plan pixels to the metre — an estimate from the 7.8 m column grid, not a survey. South to north: the entrance
     foyer, a rise to the main hall, the first-floor terrace over the Folio gallery, and the King's Library — a glass and
     bronze tower 28 m long, 11 m deep and six storeys high. West: the Treasures gallery and the PACCAR gallery; east: two
     reading rooms and a gallery off the foyer. Walls are red brick, floors travertine, balconies white with brass rails. */
  function buildLibraryInterior() {
    const CAT = window.PICATALOG || [], HALLS = window.PILIB || {}; if (!CAT.length) return;
    const g = new THREE.Group(), B = (c, o) => new THREE.MeshBasicMaterial(Object.assign({ color: c }, o || {})), Y0 = 60, Y1 = 61;
    const box = (w, h, d, x, y, z, m) => { const q = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), typeof m === 'number' ? B(m) : m); q.position.set(x, y, z); g.add(q); return q; };
    const tex = (w, h, fn) => { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; };
    const rep = (t, rx, ry) => { const c = t.clone(); c.needsUpdate = true; c.repeat.set(rx, ry); return c; };
    const plane = (w, h, x, y, z, m, rx, ry) => { const q = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); q.position.set(x, y, z); if (rx) q.rotation.x = rx; if (ry) q.rotation.y = ry; g.add(q); return q; };
    const BRICK = tex(128, 64, (q) => { q.fillStyle = '#a4523a'; q.fillRect(0, 0, 128, 64); for (let r = 0; r < 4; r++) for (let k = 0; k < 4; k++) { q.fillStyle = ['#a8563e', '#9c4c36', '#b05c42', '#a04f38'][(r * 3 + k) % 4]; q.fillRect(k * 32 + (r % 2) * 16 - 32 * (k === 3 && r % 2 ? 0 : 0), r * 16, 30, 14); } q.fillStyle = '#a4523a'; }), TRAV = tex(256, 256, (q) => { q.fillStyle = '#e6dccb'; q.fillRect(0, 0, 256, 256); for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { q.fillStyle = ['#ece3d3', '#e2d7c3', '#e9dfcd', '#ddd2bd'][(i + j * 2) % 4]; q.fillRect(i * 64 + 1, j * 64 + 1, 62, 62); } }), WOODF = tex(128, 128, (q) => { for (let i = 0; i < 8; i++) { q.fillStyle = ['#9a7044', '#8c623a', '#a67a4c', '#93683e'][i % 4]; q.fillRect(0, i * 16, 128, 15); } }), CARPET = tex(64, 64, (q) => { q.fillStyle = '#5a2030'; q.fillRect(0, 0, 64, 64); q.fillStyle = '#64263a'; for (let i = 0; i < 8; i++) q.fillRect((i % 2) * 32, i * 8, 32, 8); });
    const SPINE = tex(256, 256, (q) => { q.fillStyle = '#2a1a10'; q.fillRect(0, 0, 256, 256); for (let r = 0; r < 4; r++) { let x = 2; q.fillStyle = '#4a3020'; q.fillRect(0, r * 64 + 58, 256, 6); while (x < 252) { const w = 6 + ((x * 7 + r * 13) % 9), h = 44 + ((x * 3 + r * 5) % 12); q.fillStyle = ['#6b3a22', '#8a5a2e', '#4f2a1c', '#7a2330', '#3f4a2a', '#9a7a3a', '#5a3a4a'][(x + r * 3) % 7]; q.fillRect(x, r * 64 + 58 - h, w, h); q.fillStyle = '#d9b46a'; q.fillRect(x + 1, r * 64 + 58 - h + 8, w - 2, 2); x += w + 1; } } });
    const WHITE = 0xf4f1ea, BRASS = 0xc9a24a, BRONZE = 0x4a3a2a, OAK = 0x8a6238, OAKD = 0x5e4126;
    // a room: marks its cells walkable, lays floor and ceiling, and builds each wall facing inward, leaving the door gaps
    function room(x0, x1, z0, z1, fy, h, o) { for (let x = x0; x < x1; x++) for (let z = z0; z < z1; z++) LIB.floor.set(x + ',' + z, fy);
      const w = x1 - x0, d = z1 - z0, mx = (x0 + x1) / 2, mz = (z0 + z1) / 2, wt = o.wall, wm = (len, hh) => wt.isTexture ? new THREE.MeshBasicMaterial({ map: rep(wt, len / 2, hh) }) : B(wt);
      plane(w, d, mx, fy + 0.01, mz, new THREE.MeshBasicMaterial({ map: rep(o.floor, w / 4, d / 4) }), -Math.PI / 2); if (!o.noCeil) plane(w, d, mx, fy + h - 0.01, mz, B(o.ceil || WHITE), Math.PI / 2);
      const side = (name, a0, a1, fixed, ry, alongX) => { const doors = (o.doors || []).filter((q) => q[0] === name).sort((p, q) => p[1] - q[1]); let c = a0; const seg = (a, b, yb, yt) => { if (b - a < 0.01 || yt - yb < 0.01) return; plane(b - a, yt - yb, alongX ? (a + b) / 2 : fixed, (yb + yt) / 2, alongX ? fixed : (a + b) / 2, wm(b - a, (yt - yb) / 1), 0, ry); };
        doors.forEach((q) => { seg(c, q[1], fy, fy + h); seg(q[1], q[2], fy + (q[3] || 3.4), fy + h); c = q[2]; }); seg(c, a1, fy, fy + h); };
      side('N', x0, x1, z0, 0, true); side('S', x0, x1, z1, Math.PI, true); side('W', z0, z1, x0, Math.PI / 2, false); side('E', z0, z1, x1, -Math.PI / 2, false); }
    const sign = (text, sub, x, y, z, w) => { const t = tex(512, 150, (q) => { q.fillStyle = 'rgba(30,24,20,.9)'; q.fillRect(0, 0, 512, 150); q.strokeStyle = '#c9a24a'; q.lineWidth = 4; q.strokeRect(3, 3, 506, 144); q.textAlign = 'center'; q.fillStyle = '#fff3d6'; q.font = '700 54px "Songti SC", serif'; q.fillText(text, 256, 74); q.fillStyle = '#e2cfa4'; q.font = '26px "Songti SC", serif'; q.fillText(sub, 256, 120); }); const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true })); sp.scale.set(w || 4.2, (w || 4.2) * 150 / 512, 1); sp.position.set(x, y, z); g.add(sp); };
    // ── the plan ──
    room(438, 475, 62, 81, Y0, 8, { wall: BRICK, floor: TRAV, doors: [['N', 440, 444], ['N', 449, 475, 8], ['E', 68, 71], ['S', 451, 456, 3.6]] });                          // entrance foyer
    room(449, 475, 58, 62, Y1, 7, { wall: BRICK, floor: TRAV, doors: [['N', 449, 475, 7], ['S', 449, 475, 7]] });                                                                // the rise to the hall
    room(449, 486, 2, 58, Y1, 18, { wall: BRICK, floor: TRAV, noCeil: 1, doors: [['S', 449, 475, 7], ['W', 36, 40], ['E', 28, 31], ['E', 46, 49]] });                          // the main hall
    room(421, 449, 26, 52, Y1, 6, { wall: 0x2a2622, ceil: 0x1c1a18, floor: CARPET, doors: [['E', 36, 40]] });                                                                  // Treasures (Ritblat) gallery
    room(420, 446, 54, 62, Y0, 6, { wall: WHITE, floor: WOODF, doors: [['S', 440, 444]] });                                                                                     // PACCAR gallery
    room(486, 503, 22, 36, Y1, 6, { wall: WHITE, floor: WOODF, doors: [['W', 28, 31]] });                                                                                       // Humanities reading room
    room(486, 516, 38, 58, Y1, 6, { wall: WHITE, floor: WOODF, doors: [['W', 46, 49]] });                                                                                       // Social sciences reading room
    room(475, 491, 62, 78, Y0, 6, { wall: WHITE, floor: WOODF, doors: [['W', 68, 71]] });                                                                                       // gallery off the foyer
    box(26, 1, 0.7, 462, Y0 + 0.5, 62.35, 0xe9e0cf); box(26, 0.5, 0.6, 462, Y0 + 0.25, 62.9, 0xe2d8c6); box(5.4, 3.7, 0.2, 453.5, Y0 + 1.85, 81.1, 0x2a3a3a);
    // hall roof: white coffers and skylights, hanging globe lamps
    plane(37, 56, 467.5, LIB.top - 0.02, 30, B(WHITE), Math.PI / 2); for (let i = 0; i < 4; i++) for (let j = 0; j < 7; j++) plane(6.2, 5.6, 453.6 + i * 9.25, LIB.top - 0.04, 6 + j * 7.8, B(0xdff0ff), Math.PI / 2);
    for (let j = 0; j < 8; j++) box(37, 0.6, 0.4, 467.5, LIB.top - 0.3, 2.2 + j * 7.8, WHITE);
    [[453, 34], [482, 34], [453, 50], [482, 50], [460, 8], [476, 8]].forEach((q) => { box(0.05, 7, 0.05, q[0], LIB.top - 3.5, q[1], BRASS); const b = new THREE.Mesh(new THREE.SphereGeometry(0.7, 16, 12), B(0xfff2c8)); b.position.set(q[0], LIB.top - 7.2, q[1]); g.add(b); });
    // the "great wave": white balconies stepping back up the west and east walls of the hall
    [[6, 3.2], [10, 2.2], [14, 1.2]].forEach((q, i) => { [[449, 1], [486, -1]].forEach((sd) => { const zc = i === 0 && sd[1] === 1 ? 0 : 0; box(q[1], 0.5, 30, sd[0] + sd[1] * q[1] / 2, Y1 + q[0] - 0.25, 43, WHITE); box(0.08, 0.08, 30, sd[0] + sd[1] * q[1], Y1 + q[0] + 1.1, 43, BRASS); const gl = plane(30, 1, sd[0] + sd[1] * q[1], Y1 + q[0] + 0.55, 43, B(0xcfe6f2, { transparent: true, opacity: 0.25, side: THREE.DoubleSide }), 0, Math.PI / 2); }); });
    for (let z = 10; z <= 58; z += 8) [[449.4], [485.6]].forEach((q) => { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 18, 14), B(WHITE)); c.position.set(q[0], Y1 + 9, z - 0.2); g.add(c); });
    // the King's Library
    const TX0 = 455, TX1 = 483, TZ0 = 14, TZ1 = 25, TH = 17, tcx = (TX0 + TX1) / 2, tcz = (TZ0 + TZ1) / 2;
    for (let x = TX0; x < TX1; x++) for (let z = TZ0; z < TZ1; z++) LIB.floor.delete(x + ',' + z);
    const mats = [0, 1, 2, 3, 4, 5].map((i) => new THREE.MeshBasicMaterial({ map: rep(SPINE, i < 2 ? 3.4 : 8.8, 5.6) })); const core = new THREE.Mesh(new THREE.BoxGeometry(TX1 - TX0 - 1.2, TH, TZ1 - TZ0 - 1.2), mats); core.position.set(tcx, Y1 + TH / 2, tcz); g.add(core);
    const gl = new THREE.Mesh(new THREE.BoxGeometry(TX1 - TX0, TH, TZ1 - TZ0), B(0xbfe0ee, { transparent: true, opacity: 0.14, side: THREE.DoubleSide, depthWrite: false })); gl.position.copy(core.position); g.add(gl);
    for (let k = 0; k <= 6; k++) { const y = Y1 + k * TH / 6; box(TX1 - TX0 + 0.1, 0.14, 0.14, tcx, y, TZ0, BRONZE); box(TX1 - TX0 + 0.1, 0.14, 0.14, tcx, y, TZ1, BRONZE); box(0.14, 0.14, TZ1 - TZ0 + 0.1, TX0, y, tcz, BRONZE); box(0.14, 0.14, TZ1 - TZ0 + 0.1, TX1, y, tcz, BRONZE); }
    for (let x = TX0; x <= TX1; x += 4) { box(0.14, TH, 0.14, x, Y1 + TH / 2, TZ0, BRONZE); box(0.14, TH, 0.14, x, Y1 + TH / 2, TZ1, BRONZE); } [TZ0 + 3.7, TZ0 + 7.3].forEach((z) => { box(0.14, TH, 0.14, TX0, Y1 + TH / 2, z, BRONZE); box(0.14, TH, 0.14, TX1, Y1 + TH / 2, z, BRONZE); });
    sign('The King\'s Library', '乔治三世藏书 · 六层青铜与玻璃书塔', tcx, Y1 + 3.4, TZ1 + 0.4, 7);
    // the first-floor terrace south of the tower, over the Folio gallery, and its stair
    const GY = Y1 + 6; box(23, 0.5, 17, 466.5, GY - 0.25, 33.5, WHITE); libBlock(455, 477, 25, 41, GY - 1, GY); plane(23, 17, 466.5, GY + 0.01, 33.5, new THREE.MeshBasicMaterial({ map: rep(TRAV, 6, 4) }), -Math.PI / 2);
    for (let i = 0; i < 6; i++) { const z = 47 - i; libBlock(455, 456, z, z, Y1, Y1 + i + 1); box(2, i + 1, 1, 456, Y1 + (i + 1) / 2, z + 0.5, i % 2 ? 0xede6d6 : 0xe2d8c6); }
    libBlock(454, 454, 25, 47, GY, GY + 2); libBlock(478, 478, 25, 41, GY, GY + 2); libBlock(457, 477, 42, 42, GY, GY + 2); libBlock(457, 457, 43, 47, Y1, GY + 2);
    const rail = (xa, za, xb, zb) => { const ax = Math.abs(xb - xa) > Math.abs(zb - za), len = ax ? xb - xa : zb - za, mx = (xa + xb) / 2, mz = (za + zb) / 2; box(ax ? len : 0.08, 0.08, ax ? 0.08 : len, mx, GY + 1.1, mz, BRASS); plane(len, 1, mx, GY + 0.55, mz, B(0xcfe6f2, { transparent: true, opacity: 0.25, side: THREE.DoubleSide }), 0, ax ? 0 : Math.PI / 2); };
    rail(455, 25, 455, 42); rail(478, 25, 478, 42); rail(457, 42, 478, 42); box(0.08, 0.08, 8.6, 457.05, Y1 + 4.1, 44.8, BRASS).rotation.x = -Math.PI / 4;
    for (let x = 458; x <= 476; x += 6) [29, 38].forEach((z) => { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 5.5, 12), B(WHITE)); c.position.set(x, Y1 + 2.75, z); g.add(c); libBlock(x, x, z, z, Y1, Y1 + 5); });
    sign('Folio Society Gallery', '楼梯在西侧 · 上面的平台正对书塔', 466.5, Y1 + 4.4, 42.6, 5.4);
    // reading tables with green lamps
    const table = (x0, z0, len, fy) => { box(len, 0.12, 1.8, x0 + len / 2, fy + 0.95, z0 + 1, OAK); [x0 + 0.3, x0 + len - 0.3].forEach((x) => box(0.2, 0.9, 1.5, x, fy + 0.45, z0 + 1, OAKD)); libBlock(x0, x0 + len - 1, z0, z0 + 1, fy, fy + 1); for (let k = 1; k < len; k += 2) { box(0.06, 0.4, 0.06, x0 + k, fy + 1.2, z0 + 1, BRASS); box(0.7, 0.14, 0.26, x0 + k, fy + 1.45, z0 + 1, 0x2f7a5a); box(0.5, 0.05, 0.5, x0 + k, fy + 0.5, z0 - 0.5, 0x7a2330); box(0.5, 0.05, 0.5, x0 + k, fy + 0.5, z0 + 2.5, 0x7a2330); } };
    table(460, 50, 8, Y1); table(472, 50, 8, Y1); table(460, 6, 8, Y1); table(472, 6, 8, Y1); table(490, 55, 8, Y1); table(502, 55, 8, Y1); table(459, 31, 6, GY); table(469, 31, 6, GY);
    // the books
    const wood = B(OAK), woodD = B(OAKD), bookG = new THREE.BoxGeometry(0.66, 0.95, 0.07), PALB = [0x8c3b2e, 0x2f5a6b, 0x6b5a2a, 0x4a3a6b, 0x3f6a4a, 0x7a4a2a];
    const put = (b, x, y, z, ry, i) => { const m = new THREE.Mesh(bookG, B(PALB[i % 6])); m.position.set(x, y, z); m.rotation.y = ry; m.userData = { book: b, bx: x, bz: z, nx: Math.sin(ry), nz: Math.cos(ry) }; g.add(m); LIB.books.push(m); };
    const face = (books, xa, xb, z, ry, y0, rows) => { const per = Math.floor((xb - xa) / 0.8); books.forEach((b, i) => { const col = i % per, row = Math.floor(i / per); if (row >= rows) return; put(b, ry ? xb - 0.4 - col * 0.8 : xa + 0.4 + col * 0.8, y0 + 0.25 + (rows - 1 - row) * 1.12 + 0.48, z, ry, i); }); };
    const bay = (name, books, xa, xb, zc, fy) => { libBlock(xa, xb - 1, zc, zc, fy, fy + 5); box(xb - xa, 4.6, 0.86, (xa + xb) / 2, fy + 2.3, zc + 0.5, woodD); for (let k = 0; k < 5; k++) box(xb - xa + 0.1, 0.08, 1.16, (xa + xb) / 2, fy + 0.2 + k * 1.12, zc + 0.5, wood); [xa, xb].forEach((x) => box(0.14, 4.6, 1.16, x, fy + 2.3, zc + 0.5, wood));
      const cap = Math.floor((xb - xa) / 0.8) * 4, a = books.slice(0, Math.min(cap, Math.ceil(books.length / 2))), b2 = books.slice(a.length); face(a, xa, xb, zc + 1.0, 0, fy, 4); face(b2, xa, xb, zc, Math.PI, fy, 4); sign(name, books.length + ' 本 · ' + books.filter((q) => q.file).length + ' 本可读', (xa + xb) / 2, fy + 5.2, zc + 0.5, 3.4); };
    const by = (c) => CAT.filter((b) => c === '影响世界' ? b.world : b.cat === c);
    face(by('影响世界'), 423, 447, 26.5, 0, Y1 + 0.7, 2); sign('Treasures of the British Library', '珍宝馆 · 影响世界的书', 435, Y1 + 4.6, 27, 7); sign('珍宝馆', 'Sir John Ritblat Gallery', 449.6, Y1 + 4.3, 38, 3.4);
    for (let x = 424; x <= 446; x += 5.5) [34, 44].forEach((z) => { box(2.2, 1.0, 1.2, x, Y1 + 0.5, z + 0.5, 0x15130f); libBlock(Math.floor(x - 1), Math.floor(x + 1), z, z, Y1, Y1 + 1); box(2.0, 0.5, 1.0, x, Y1 + 1.25, z + 0.5, B(0xfff0c0, { transparent: true, opacity: 0.35 })); });
    bay('文学名著', by('文学名著'), 422, 437, 57, Y0); sign('PACCAR Gallery', '文学名著', 442, Y0 + 4.4, 62.6, 3.4);
    bay('哲学', by('哲学'), 489, 501, 24, Y1); bay('政治学', by('政治学'), 490, 501, 29, Y1); bay('美学', by('美学'), 489, 501, 33, Y1); sign('Humanities', '人文阅览室 · 哲学 政治学 美学', 485.4, Y1 + 4.3, 29.5, 4.2);
    bay('经济学', by('经济学'), 490, 512, 40, Y1); bay('社会学', by('社会学'), 491, 512, 44, Y1); bay('心理学', by('心理学'), 491, 512, 48, Y1); bay('科学与历史', by('科学与历史'), 490, 512, 52, Y1); sign('Social Sciences', '社科阅览室 · 经济 社会 心理 科学与历史', 485.4, Y1 + 4.3, 47.5, 4.6);
    const hb = []; world.PHILOSOPHERS.forEach((p) => (HALLS[p.id] || []).forEach((b) => hb.push(Object.assign({ hall: p.id }, b, { author: b.authorZh || b.author }))));
    bay('思想家书架 · 上', hb.slice(0, 96), 478, 490, 65, Y0); bay('思想家书架 · 下', hb.slice(96), 479, 490, 74, Y0); sign('思想家书架', '43 位思想者自己的书', 475.6, Y0 + 4.4, 69.5, 3.6);
    const cpr = CAT.find((b) => /Critique of Pure Reason/i.test(b.title) && b.file); if (cpr) { box(1.2, 1.2, 0.8, 467, Y1 + 0.6, 45.4, wood); libBlock(466, 467, 45, 45, Y1, Y1 + 2); const m = new THREE.Mesh(new THREE.BoxGeometry(1.5, 2.1, 0.1), B(0x8c3b2e)); m.position.set(467, Y1 + 2.4, 45.6); m.userData = { book: cpr, bx: 467, bz: 45.6, nx: 0, nz: 1, creative: 1 }; g.add(m); LIB.books.push(m); sign('十种读法', '《纯粹理性批判》· 看着它点一下', 467, Y1 + 4.1, 45.6, 3.4); }
    sign('出口 Way out', '在门前按 E 回到时光岛', 453.5, Y0 + 4.6, 80.6, 4.4); sign('The British Library', '入口大厅 · 往北上台阶进主厅', 462, Y0 + 5.6, 62.6, 6);
    // ── details ──
    const DARKB = 0x3a2a1c, pot = (x, z, fy) => { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.35, 0.8, 12), B(0x8a6a4a)); c.position.set(x, fy + 0.4, z); g.add(c); const t = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.6, 6), B(0x5a4030)); t.position.set(x, fy + 1.6, z); g.add(t); [[0, 2.9, 0, 0.9], [0.4, 2.4, 0.2, 0.6], [-0.4, 2.5, -0.2, 0.6]].forEach((q) => { const l = new THREE.Mesh(new THREE.IcosahedronGeometry(q[3], 1), B(0x3f7a4a)); l.position.set(x + q[0], fy + q[1], z + q[2]); g.add(l); }); libBlock(Math.floor(x), Math.floor(x), Math.floor(z), Math.floor(z), fy, fy + 2); };
    [[440, 64, Y0], [473, 80, Y0], [440, 79.5, Y0], [451, 56, Y1], [484, 56, Y1], [451, 4, Y1], [484, 4, Y1]].forEach((q) => pot(q[0] + 0.5, q[1] + 0.5, q[2]));
    // skirting and a stone band along the brick walls of the hall and the foyer; brass wall lights
    [[467.5, 2.06, 37, 0.1], [467.5, 57.94, 0, 0]].forEach(() => 0); box(0.12, 0.5, 56, 449.06, Y1 + 0.25, 30, DARKB); box(0.12, 0.5, 56, 485.94, Y1 + 0.25, 30, DARKB); box(37, 0.5, 0.12, 467.5, Y1 + 0.25, 2.06, DARKB); box(37, 0.3, 0.14, 467.5, Y1 + 5.6, 2.07, 0xe9e0cf);
    for (let z = 6; z <= 54; z += 6) [[449.12, 1], [485.88, -1]].forEach((q) => { box(0.14, 0.5, 0.3, q[0], Y1 + 3.2, z, BRASS); box(0.2, 0.36, 0.5, q[0] + q[1] * 0.14, Y1 + 3.6, z, B(0xfff0c0)); plane(2.6, 3.2, q[0] + q[1] * 0.03, Y1 + 3.4, z, B(0xffe2a0, { transparent: true, opacity: 0.16 }), 0, q[1] > 0 ? Math.PI / 2 : -Math.PI / 2); });
    [[453, 34], [482, 34], [453, 50], [482, 50], [460, 8], [476, 8]].forEach((q) => { const c = new THREE.Mesh(new THREE.CircleGeometry(4.2, 28), B(0xfff0c0, { transparent: true, opacity: 0.2, depthWrite: false })); c.rotation.x = -Math.PI / 2; c.position.set(q[0], Y1 + 0.03, q[1]); g.add(c); });
    // oak door frames with lintel signs at every doorway off the hall
    const frame = (x, z0, z1, fy, label) => { [z0, z1].forEach((z) => box(0.5, 3.6, 0.3, x, fy + 1.8, z, OAKD)); box(0.5, 0.5, z1 - z0 + 0.3, x, fy + 3.65, (z0 + z1) / 2, OAKD); };
    frame(449, 36, 40, Y1); frame(486, 28, 31, Y1); frame(486, 46, 49, Y1); frame(475, 68, 71, Y0);
    // the information desk and the turnstiles at the foot of the rise
    box(7, 1.1, 1.3, 462, Y0 + 0.55, 71.5, OAK); box(7.3, 0.1, 1.6, 462, Y0 + 1.15, 71.5, 0xe9e0cf); libBlock(459, 465, 71, 71, Y0, Y0 + 2); sign('Information', '问讯台', 462, Y0 + 2.6, 71.5, 2.6);
    [444.5, 446.5].forEach((x) => { box(0.3, 1.0, 1.2, x, Y0 + 0.5, 64, 0x9aa0a6); });
    // R. B. Kitaj's tapestry "If Not, Not" on the west wall of the foyer (an abstract stand-in, not a reproduction)
    const tap = tex(256, 256, (q) => { const gr = q.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, '#e9a13b'); gr.addColorStop(0.45, '#d9573c'); gr.addColorStop(1, '#2f6a6b'); q.fillStyle = gr; q.fillRect(0, 0, 256, 256); [['#f6d27a', 60, 70, 46], ['#3f4a8c', 180, 120, 38], ['#7a2330', 110, 190, 30], ['#8fbf6a', 210, 210, 26], ['#f3e6cc', 40, 190, 20]].forEach((c) => { q.fillStyle = c[0]; q.beginPath(); q.ellipse(c[1], c[2], c[3] * 1.3, c[3], 0.4, 0, 7); q.fill(); }); q.strokeStyle = '#3a2a1c'; q.lineWidth = 10; q.strokeRect(5, 5, 246, 246); });
    plane(8, 6.4, 438.06, Y0 + 4.2, 71, new THREE.MeshBasicMaterial({ map: tap }), 0, Math.PI / 2); sign('挂毯《If Not, Not》', 'R. B. Kitaj · 这里是示意图', 438.4, Y0 + 0.9, 71, 3);
    // Bill Woodrow's "Sitting on History": a bronze bench in the shape of an open book, chained to a ball
    const bz = B(0x6b5a3a); { const l = box(1.6, 0.25, 2.2, 468.2, Y0 + 0.75, 75, bz); l.rotation.z = 0.28; const r = box(1.6, 0.25, 2.2, 469.8, Y0 + 0.75, 75, bz); r.rotation.z = -0.28; box(0.3, 0.6, 2.2, 469, Y0 + 0.3, 75, bz); const ball = new THREE.Mesh(new THREE.SphereGeometry(0.4, 14, 10), bz); ball.position.set(471.4, Y0 + 0.4, 75.6); g.add(ball); box(1.3, 0.06, 0.06, 470.6, Y0 + 0.3, 75.4, bz); libBlock(468, 469, 74, 75, Y0, Y0 + 1); sign('Sitting on History', 'Bill Woodrow · 书形青铜长凳', 469, Y0 + 2.2, 75, 3); }
    // busts of the four founding collectors along the hall
    [['Sir Robert Cotton', 451, 11], ['Sir Hans Sloane', 451, 19], ['Thomas Grenville', 484, 11], ['Sir Joseph Banks', 484, 19]].forEach((q) => { box(0.8, 1.3, 0.8, q[1] + 0.5, Y1 + 0.65, q[2] + 0.5, 0xe9e0cf); box(0.6, 0.5, 0.4, q[1] + 0.5, Y1 + 1.55, q[2] + 0.5, 0xf6f2ea); const h = new THREE.Mesh(new THREE.SphereGeometry(0.3, 14, 10), B(0xf6f2ea)); h.position.set(q[1] + 0.5, Y1 + 2.05, q[2] + 0.5); g.add(h); libBlock(q[1], q[1], q[2], q[2], Y1, Y1 + 2); sign(q[0], '创始藏书人', q[1] + 0.5, Y1 + 2.9, q[2] + 0.5, 2.2); });
    // long red banners in the foyer, and a clock over the rise
    [445, 479].forEach((x) => { plane(1.6, 5, x, Y0 + 5.2, 62.2, new THREE.MeshBasicMaterial({ map: tex(64, 200, (q) => { q.fillStyle = '#b3202a'; q.fillRect(0, 0, 64, 200); q.fillStyle = '#fff'; q.font = '700 22px Georgia, serif'; q.save(); q.translate(40, 190); q.rotate(-Math.PI / 2); q.fillText('BRITISH LIBRARY', 0, 0); q.restore(); }) }), 0, Math.PI); });
    // the café behind the tower: round tables and stools
    [[457, 9], [463, 11], [471, 11], [477, 9], [467, 4]].forEach((q) => { const t = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.08, 18), B(0xf6f2ea)); t.position.set(q[0], Y1 + 0.85, q[1]); g.add(t); box(0.12, 0.85, 0.12, q[0], Y1 + 0.42, q[1], 0x9aa0a6); [[0.9, 0], [-0.9, 0], [0, 0.9]].forEach((o) => { const st = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.5, 12), B(0x7a2330)); st.position.set(q[0] + o[0], Y1 + 0.25, q[1] + o[1]); g.add(st); }); libBlock(Math.floor(q[0]), Math.floor(q[0]), Math.floor(q[1]), Math.floor(q[1]), Y1, Y1 + 1); }); sign('Café', '书塔背后的咖啡座', 467.5, Y1 + 3.6, 3, 2.6);
    // carpets under the reading rooms' tables and green baize on the terrace desks
    plane(22, 5, 501, Y1 + 0.02, 56, new THREE.MeshBasicMaterial({ map: rep(CARPET, 6, 1.5) }), -Math.PI / 2);
    // ── more details: people, trolleys, terminals, lockers, posters, a brass inlay, a clock ──
    const person = (x, z, fy, ry, coat, sit) => { const f = new THREE.Group(), a = (w, h, d, px, py, pz, c) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), B(c)); m.position.set(px, py, pz); f.add(m); }; if (sit) { a(0.5, 0.2, 0.6, 0, 0.62, 0.2, 0x2f2a2a); a(0.2, 0.55, 0.2, -0.14, 0.28, 0.45, 0x2f2a2a); a(0.2, 0.55, 0.2, 0.14, 0.28, 0.45, 0x2f2a2a); a(0.56, 0.62, 0.3, 0, 1.02, 0, coat); a(0.34, 0.34, 0.34, 0, 1.52, 0.03, 0xe8c4a0); a(0.36, 0.1, 0.36, 0, 1.72, 0.03, [0x4a3524, 0x1f1c1c, 0xb8a078, 0x7a4a2a][Math.floor(x + z) % 4]); a(0.16, 0.16, 0.5, -0.3, 1.02, 0.3, coat); a(0.16, 0.16, 0.5, 0.3, 1.02, 0.3, coat); a(0.5, 0.04, 0.36, 0, 1.03, 0.72, 0xfdfaf0); } else { a(0.2, 0.8, 0.22, -0.13, 0.4, 0, 0x2f2a2a); a(0.2, 0.8, 0.22, 0.13, 0.4, 0, 0x2f2a2a); a(0.56, 0.7, 0.3, 0, 1.15, 0, coat); a(0.34, 0.34, 0.34, 0, 1.7, 0, 0xe8c4a0); a(0.36, 0.1, 0.36, 0, 1.9, 0, 0x4a3524); a(0.16, 0.6, 0.2, -0.36, 1.15, 0, coat); a(0.16, 0.6, 0.2, 0.36, 1.15, 0, coat); } f.position.set(x, fy, z); f.rotation.y = ry; g.add(f); };
    const COATS = [0x3f6fa8, 0x8c3b2e, 0x3f6a4a, 0x6b4a7a, 0x8a6a2a, 0x4a4a4a];
    [[461, 49.5, Y1, 0], [465, 49.5, Y1, 0], [463, 52.5, Y1, Math.PI], [473, 49.5, Y1, 0], [477, 52.5, Y1, Math.PI], [491, 54.5, Y1, 0], [495, 57.5, Y1, Math.PI], [503, 54.5, Y1, 0], [460, 30.5, GY, 0], [472, 33.5, GY, Math.PI], [461, 5.5, Y1, 0], [475, 8.5, Y1, Math.PI]].forEach((q, i) => person(q[0], q[1], q[2], q[3], COATS[i % 6], true));
    [[462, 73, Y0, Math.PI, 0x1f3a5a], [450, 70, Y0, 1.2, 0x8c3b2e], [468, 46.8, Y1, 0.4, 0x3f6a4a], [440, 40, Y1, -1.2, 0x6b4a7a], [470, 27, GY, Math.PI, 0x4a4a4a]].forEach((q) => person(q[0], q[1], q[2], q[3], q[4], false));
    const trolley = (x, z, fy, ry) => { const t = new THREE.Group(); [[0.25], [0.7], [1.1]].forEach((q, i) => { const s2 = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.06, 0.5), B(0x9aa0a6)); s2.position.y = q[0]; t.add(s2); if (i < 2) for (let k = 0; k < 6; k++) { const bk = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.34, 0.4), B(PALB[(k + i) % 6])); bk.position.set(-0.4 + k * 0.16, q[0] + 0.2, 0); t.add(bk); } }); [-0.5, 0.5].forEach((px) => { const p2 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.15, 0.5), B(0x7a8086)); p2.position.set(px, 0.6, 0); t.add(p2); }); t.position.set(x, fy, z); t.rotation.y = ry; g.add(t); };
    trolley(488.5, 37, Y1, 0.3); trolley(446, 30, Y1, 1.2); trolley(505, 41.5, Y1, 0); trolley(483, 44, Y1, 1.5); trolley(441, 60, Y0, 0.5);
    for (let k = 0; k < 3; k++) { const z = 37.5 + k * 2.2; box(0.7, 1.0, 1.2, 484.6, Y1 + 0.5, z, OAKD); const scr = plane(0.9, 0.6, 484.2, Y1 + 1.45, z, B(0x8fd0ff), 0, -Math.PI / 2); box(0.08, 0.7, 1.0, 484.3, Y1 + 1.45, z, 0x1f1c1c); } sign('Explore the Catalogue', '检索终端', 484.4, Y1 + 2.7, 39.7, 3);
    for (let i = 0; i < 12; i++) for (let j = 0; j < 4; j++) box(0.92, 0.72, 0.5, 459.5 + i, Y0 + 0.4 + j * 0.76, 80.7, (i + j) % 2 ? 0xb3202a : 0xc9343c); sign('Lockers', '储物柜', 465, Y0 + 3.7, 80.5, 2.4);
    for (let x = 424; x <= 446; x += 5.5) [34, 44].forEach((z) => { const l = plane(0.7, 0.9, x - 0.36, Y1 + 1.1, z + 0.5, B(0xfdf6e3, { side: THREE.DoubleSide }), -Math.PI / 2 + 0.25); l.rotation.z = 0.0; const r2 = plane(0.7, 0.9, x + 0.36, Y1 + 1.1, z + 0.5, B(0xf6ecd0, { side: THREE.DoubleSide }), -Math.PI / 2 + 0.25); const cone = new THREE.Mesh(new THREE.ConeGeometry(1.3, 4.6, 16, 1, true), B(0xfff0c0, { transparent: true, opacity: 0.1, side: THREE.DoubleSide, depthWrite: false })); cone.position.set(x, Y1 + 3.6, z + 0.5); g.add(cone); });
    [['Magna Carta', '1215'], ['Gutenberg Bible', '1455'], ['Lindisfarne Gospels', 'c. 700'], ['Diamond Sutra', '868'], ['Shakespeare First Folio', '1623']].forEach((q, i) => sign(q[0], q[1] + ' · 展柜示意', 424 + i * 5.5, Y1 + 2.4, 34.5, 2.2));
    [0x2f6a8c, 0xd9a13b, 0x8c3b6a, 0x3f7a5a].forEach((c, i) => { plane(2.6, 3.6, 425 + i * 5.5, Y0 + 3, 54.06, B(c)); plane(2.0, 0.5, 425 + i * 5.5, Y0 + 4.2, 54.08, B(0xfdf6e3)); });
    { const ring = new THREE.Mesh(new THREE.RingGeometry(2.0, 2.2, 48), B(BRASS)); ring.rotation.x = -Math.PI / 2; ring.position.set(467.5, Y1 + 0.03, 55.2); g.add(ring); for (let i = 0; i < 8; i++) { const r2 = plane(0.12, 1.9, 467.5, Y1 + 0.035, 55.2, B(BRASS), -Math.PI / 2); r2.rotation.z = i * Math.PI / 8; } }
    { const cl = tex(128, 128, (q) => { q.fillStyle = '#fdfaf0'; q.beginPath(); q.arc(64, 64, 60, 0, 7); q.fill(); q.lineWidth = 6; q.strokeStyle = '#3a2a1c'; q.stroke(); for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283; q.fillStyle = '#3a2a1c'; q.fillRect(64 + Math.sin(a) * 50 - 2, 64 - Math.cos(a) * 50 - 2, 4, 4); } q.lineWidth = 5; q.beginPath(); q.moveTo(64, 64); q.lineTo(86, 46); q.moveTo(64, 64); q.lineTo(64, 18); q.stroke(); }); plane(1.6, 1.6, 446.5, Y0 + 6.2, 62.06, new THREE.MeshBasicMaterial({ map: cl, transparent: true }), 0, 0); }
    for (let x = 441; x <= 472; x += 7.8) box(0.5, 0.5, 19, x, Y0 + 7.7, 71.5, WHITE);
    box(0.08, 0.08, 8.6, 454.95, Y1 + 4.1, 44.8, BRASS).rotation.x = -Math.PI / 4;
    { const gl2 = new THREE.Mesh(new THREE.SphereGeometry(0.55, 18, 14), B(0x3f7aa8)); gl2.position.set(502, Y1 + 1.5, 23.5); g.add(gl2); box(0.5, 1.0, 0.5, 502, Y1 + 0.5, 23.5, OAKD); [[0.25, 0.2, 0.3], [-0.2, -0.1, 0.42], [0, 0.35, -0.3]].forEach((o) => { const land = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6), B(0x6fa85a)); land.position.set(502 + o[0], Y1 + 1.5 + o[1], 23.5 + o[2]); g.add(land); }); }
    [[487, 60, 0x2f6a8c], [487, 64.5, 0xd9a13b]].forEach(() => 0); for (let i = 0; i < 6; i++) { const px = 476.5 + i * 2.4; plane(1.5, 1.9, px, Y0 + 3.4, 62.06, B([0xe9dcc0, 0xd9c9a4][i % 2])); plane(1.1, 1.4, px, Y0 + 3.4, 62.08, B([0x8c5a4a, 0x4a5a6b, 0x6b5a3a, 0x5a4a6b, 0x3f5a4a, 0x7a4a3a][i])); } sign('Portraits', '思想家肖像墙 · 示意', 483, Y0 + 5.1, 62.4, 2.6);
    g.visible = false; scene.add(g); LIB.group = g;
  }
  function libCover(m) { const b = m.userData.book; m.userData.loaded = 1; const done = (tex) => { const side = m.material; m.material = [side, side, side, side, new THREE.MeshBasicMaterial({ map: tex }), side]; };
    const drawn = () => { const c = document.createElement('canvas'); c.width = 200; c.height = 288; const q = c.getContext('2d'), gr = q.createLinearGradient(0, 0, 200, 288); gr.addColorStop(0, '#8c3b2e'); gr.addColorStop(1, '#4a2420'); q.fillStyle = gr; q.fillRect(0, 0, 200, 288); q.strokeStyle = '#e2c88a'; q.lineWidth = 4; q.strokeRect(10, 10, 180, 268); q.fillStyle = '#fff3d6'; q.textAlign = 'center'; q.font = '700 28px "Songti SC", serif'; const t = (b.zh || b.title).slice(0, 15); for (let k = 0; k < t.length; k += 5) q.fillText(t.slice(k, k + 5), 100, 100 + k / 5 * 38); done(new THREE.CanvasTexture(c)); };
    if (b.cover) LIB.loader.load(b.cover, done, undefined, drawn); else drawn(); }
  function updateLibraryInterior() { if (!S.inLib || !LIB.group) return; const px = player.pos.x, pz = player.pos.z; let n = 0;
    for (const m of LIB.books) { if (m.userData.loaded) continue; if (Math.abs(m.userData.bx - px) + Math.abs(m.userData.bz - pz) < 26) { libCover(m); if (++n >= 10) break; } }
    let hit = null; if (!S.ui) { LIB.ray.setFromCamera(new THREE.Vector2(0, 0), camera); LIB.ray.far = 11; const near = LIB.books.filter((m) => Math.abs(m.userData.bx - px) < 9 && Math.abs(m.userData.bz - pz) < 9), h = LIB.ray.intersectObjects(near)[0]; if (h && Math.hypot(h.point.x - px, h.point.z - pz) < 6.5) hit = h.object; }
    if (hit !== LIB.hit) { if (LIB.hit) { const u = LIB.hit.userData; LIB.hit.position.x = u.bx; LIB.hit.position.z = u.bz; LIB.hit.scale.setScalar(1); } LIB.hit = hit; if (hit) { const u = hit.userData, b = u.book; hit.position.x = u.bx + u.nx * 0.22; hit.position.z = u.bz + u.nz * 0.22; hit.scale.setScalar(1.18); toast('📖 《' + (b.zh || b.title).slice(0, 26) + '》 ' + (b.author || '').slice(0, 16) + (u.creative ? ' · 点一下，选一种读法' : b.file && b.world ? ' · 点一下，沉浸读' : b.file ? ' · 点一下翻开' : ' · 仍在版权期，只有书目')); } } }
  function enterLibrary() { if (!LIB.group) { if (portals && portals.openLibrary) portals.openLibrary(); return; } transition('时光图书馆', '走进去，书都在架上', () => { S.inLib = true; LIB.group.visible = true; worldGroup.visible = false; if (libHall) libHall.visible = false; teleport({ mode: 'walk', p: [453.5, 60, 79.2], t: [460, 64, 60] }); setTP(true); toast('🏛 大英图书馆入口大厅。往北上台阶是主厅，尽头是国王书塔；西边是珍宝馆，东边是两间阅览室。看着一本书点一下就翻开'); }); }
  function leaveLibrary() { transition('时光岛', '', () => { S.inLib = false; LIB.group.visible = false; worldGroup.visible = true; if (libHall) libHall.visible = true; if (LIB.hit) { LIB.hit.scale.setScalar(1); LIB.hit = null; } teleport({ mode: 'walk', p: [471.5, 42, 50.5], t: [471.5, 44, 60] }); }); }
  const nearLibrary = () => !S.inLib && libHall && player.pos.z < 51.5 && Math.abs(player.pos.x - LIBRARY.x) < 10 && player.pos.z > 33;
  const nearCone = () => coneSet && Math.hypot(player.pos.x - TIME_ISLE.x, player.pos.z - TIME_ISLE.z) < 9;

  /* ───────── fades and chapter cards between scenes ───────── */
  const fadeEl = document.createElement('div'), chapEl = document.createElement('div');
  fadeEl.id = 'pi-fade'; chapEl.id = 'pi-chapter'; document.body.appendChild(fadeEl); document.body.appendChild(chapEl);
  { const st = document.createElement('style'); st.textContent = `
    #pi-fade { position:fixed; inset:0; z-index:44; background:#05070d; opacity:0; pointer-events:none; transition:opacity .32s ease; }
    #pi-chapter { position:fixed; left:0; right:0; top:34%; z-index:70; text-align:center; pointer-events:none; opacity:0; transform:translateY(8px); transition:opacity .45s ease, transform .6s ease; color:#fff7e0; text-shadow:0 2px 18px rgba(0,0,0,.85); font-family:"Songti SC","Noto Serif SC",serif; }
    #pi-chapter.show { opacity:1; transform:none; }
    #pi-chapter b { display:block; font-size:34px; letter-spacing:.32em; font-weight:700; }
    #pi-chapter i { display:block; margin-top:10px; font-size:15px; font-style:normal; letter-spacing:.2em; color:#fcd34d; }
    #pi-chapter b::after { content:""; display:block; width:120px; height:1px; margin:12px auto 0; background:linear-gradient(90deg,transparent,#f59e0b,transparent); }
    body.pi-cine #hud, body.pi-cine #pi-quest { opacity:0; pointer-events:none; }
    #pi-cine-bars::before, #pi-cine-bars::after { content:""; position:fixed; left:0; right:0; height:0; background:#05070d; z-index:43; transition:height .7s ease; }
    #pi-cine-bars::before { top:0; } #pi-cine-bars::after { bottom:0; }
    body.pi-cine #pi-cine-bars::before, body.pi-cine #pi-cine-bars::after { height:11vh; }
    #pi-cine-skip { position:fixed; right:22px; bottom:calc(11vh + 14px); z-index:71; display:none; padding:7px 14px; border-radius:999px; border:1px solid rgba(255,255,255,.35); background:rgba(10,14,24,.6); color:#e2e8f0; font-size:12.5px; cursor:pointer; }
    body.pi-cine #pi-cine-skip { display:block; }
    #pi-quest { position:fixed; left:calc(12px + env(safe-area-inset-left)); top:calc(62px + env(safe-area-inset-top)); z-index:20; width:250px; padding:10px 12px 9px; border-radius:12px; background:rgba(12,18,32,.78); border:1px solid rgba(245,158,11,.4); color:#f1f5f9; font-size:12.5px; line-height:1.5; backdrop-filter:blur(6px); transition:opacity .4s ease; }
    #pi-quest .q-step { color:#fcd34d; font-size:11px; letter-spacing:.12em; }
    #pi-quest .q-title { font-size:15px; font-weight:700; margin:2px 0 3px; }
    #pi-quest .q-desc { color:#cbd5e1; }
    #pi-quest .q-nav { margin-top:6px; color:#fde68a; font-variant-numeric:tabular-nums; }
    #pi-quest .q-row { display:flex; gap:6px; margin-top:8px; }
    #pi-quest button { flex:1; padding:4px 6px; border-radius:8px; border:1px solid rgba(255,255,255,.2); background:rgba(255,255,255,.07); color:#e2e8f0; font-size:11.5px; cursor:pointer; }
    #pi-quest button:hover { background:rgba(245,158,11,.25); }
    #pi-quest .q-bar { display:flex; align-items:center; justify-content:space-between; }
    #pi-quest .q-fold { flex:none; width:22px; padding:0 0 1px; border:0; background:transparent; color:#fcd34d; font-size:13px; }
    #pi-quest.fold { width:auto; min-width:176px; padding-bottom:8px; }
    #pi-quest .q-tools button { border-color:rgba(245,158,11,.5); color:#fde68a; font-weight:600; }
    #pi-quest-study:not(:empty) { margin-top:9px; padding-top:8px; border-top:1px dashed rgba(255,255,255,.2); }
    #pi-quest .qs-h { color:#7dd3fc; font-size:11px; letter-spacing:.12em; } #pi-quest .qs-q { font-weight:700; margin:2px 0 4px; }
    #pi-quest .qs-i { color:#cbd5e1; cursor:pointer; padding:1px 0; } #pi-quest .qs-i:hover { color:#fff; } #pi-quest .qs-i.on { color:#86efac; }
    #pi-quest .q-dots { display:flex; gap:4px; margin-top:7px; } #pi-quest .q-dots span { flex:1; height:3px; border-radius:2px; background:rgba(255,255,255,.16); } #pi-quest .q-dots span.on { background:#f59e0b; }
    body.pi-encounter #pi-quest { opacity:0; pointer-events:none; }
    @media (max-width:640px) { #pi-quest { width:190px; font-size:11.5px; } }`; document.head.appendChild(st);
    const bars = document.createElement('div'); bars.id = 'pi-cine-bars'; document.body.appendChild(bars);
    const sk = document.createElement('button'); sk.id = 'pi-cine-skip'; sk.textContent = '跳过 ▸ (Esc)'; sk.onclick = () => endArrival(true); document.body.appendChild(sk); }
  let chapT = 0;
  function showChapter(title, sub, hold) { chapEl.innerHTML = '<b></b><i></i>'; chapEl.firstChild.textContent = title; chapEl.lastChild.textContent = sub || ''; chapEl.classList.add('show'); clearTimeout(chapT); chapT = setTimeout(() => chapEl.classList.remove('show'), hold || 1900); }
  /** fade to black, run fn while the screen is dark, show a chapter card, fade back in */
  function transition(title, sub, fn) {
    fadeEl.style.opacity = 1;
    setTimeout(() => { try { if (fn) fn(); } finally { if (title) showChapter(title, sub); setTimeout(() => { fadeEl.style.opacity = 0; }, title ? 420 : 140); } }, 340);
  }
  const philName = (id) => { const p = world.PHILOSOPHERS.find((q) => q.id === id); return p ? p.name : ''; };
  // what the dialogue layer calls: the same moves, wrapped in a scene change
  const sceneTalk = {
    table: (id) => { transition('圆桌对谈', philName(id), () => startTableTalk(id)); return true; },
    walk: (id, path, stops, onStop) => { transition(id === 'kant' ? '康德的下午散步' : '边走边谈', philName(id), () => startWalkTalk(id, path, stops, onStop)); return true; },
    council: (ids) => { transition('圆桌会议', ids.map(philName).join(' · '), () => startCouncil(ids)); return true; },
    end: () => { if (S.talk) transition(null, null, endTalk); }
  };

  /* ───────── arriving on the island: a short cutscene, then control in third person ───────── */
  const LAND = { x: 192.5, boatX: 196.4, dockZ: 361.5, endZ: 344.5 };
  let boat = null;
  function makeBoat() {
    const g = new THREE.Group(), L = (c, o) => new THREE.MeshLambertMaterial(Object.assign({ color: c }, o || {}));
    const add = (geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; g.add(m); return m; };
    add(new THREE.BoxGeometry(1.7, 0.55, 4.0), L(0x7a4a22), 0, 0.2, 0); add(new THREE.BoxGeometry(1.9, 0.12, 4.2), L(0x5a3516), 0, 0.5, 0);
    const bow = add(new THREE.ConeGeometry(0.95, 1.5, 4), L(0x7a4a22), 0, 0.22, -2.7); bow.rotation.x = -Math.PI / 2; bow.rotation.z = Math.PI / 4; bow.scale.set(1, 1, 0.42);
    add(new THREE.CylinderGeometry(0.06, 0.08, 3.6, 8), L(0x4a321c), 0, 2.3, -0.5);
    g.userData.sail = add(new THREE.PlaneGeometry(1.9, 2.5), L(0xf4ecd8, { side: THREE.DoubleSide }), 0, 2.6, -0.42);
    add(new THREE.BoxGeometry(0.5, 0.34, 0.03), L(0xb91c1c, { side: THREE.DoubleSide }), 0.27, 4.0, -0.5);
    scene.add(g); return g;
  }
  const sstep = (a, b, x) => { const u = clamp((x - a) / (b - a), 0, 1); return u * u * (3 - 2 * u); };
  function placeBoat(z, t) { boat.position.set(LAND.boatX, VW.WATER_Y - 0.12 + Math.sin(t * 1.7) * 0.05, z); boat.rotation.z = Math.sin(t * 1.3) * 0.03; boat.userData.sail.scale.x = 1 + Math.sin(t * 2.2) * 0.04; }
  function startArrival() {
    if (!boat) boat = makeBoat();
    S.cine = { t: 0, look: new V3(192, 46, 230), first: true }; S.ui = true; S.sit = null; exitLock();
    document.body.classList.add('pi-cine'); $('lockHint').style.display = 'none';
    setTimeout(() => showChapter('哲学家小岛', '序幕 · 登岛', 3200), 500);
  }
  function endArrival(skipped) {
    if (!S.cine) return;
    const fin = () => {
      S.cine = null; S.ui = false; document.body.classList.remove('pi-cine');
      placeBoat(LAND.dockZ + 2.6, 0);
      player.pos.set(LAND.x, groundY(LAND.x, LAND.endZ, 60) + 0.02, LAND.endZ); player.vel.set(0, 0, 0); player.yaw = 0; player.pitch = -0.06;
      setTP(true); setMode('walk', true);
      if (J.step < 1) setStep(1, true);
      showChapter('第一幕 · 登岛', '沿着石板路向北 · WASD 行走 · V 切换视角', 3000);
      setTimeout(() => toast('📋 左上角有任务板：写下今天想了解什么，岛上会告诉你该去找谁（B）'), 3600);
    };
    if (skipped) transition(null, null, fin); else fin();
  }
  function updateCine(dt) {
    const c = S.cine, t = (c.t += dt), gyP = 40;
    // the boat glides in and ties up beside the pier
    const bz = 430 - (430 - (LAND.dockZ + 2.6)) * (1 - Math.pow(1 - sstep(0, 9.5, t), 1.6));
    placeBoat(bz, t);
    // the explorer: aboard, then a step onto the planks, then up the pier
    let walking = false;
    if (t < 10) { YOU.x = LAND.boatX; YOU.z = bz + 0.5; YOU.y = boat.position.y + 0.56; YOU.yaw = Math.PI; }
    else if (t < 11) { const u = sstep(10, 11, t); YOU.x = lerp(LAND.boatX, LAND.x + 0.6, u); YOU.z = lerp(bz + 0.5, LAND.dockZ, u); YOU.y = lerp(boat.position.y + 0.56, gyP, u) + Math.sin(u * Math.PI) * 0.45; YOU.yaw = Math.PI + 0.9 * (1 - u); walking = true; }
    else { const u = clamp((t - 11) / 5.2, 0, 1); YOU.x = lerp(LAND.x + 0.6, LAND.x, u); YOU.z = lerp(LAND.dockZ, LAND.endZ, u); YOU.y = groundY(YOU.x, YOU.z, 60); YOU.yaw = Math.PI; walking = u < 1; }
    c.walking = walking;
    // camera: the island from the air → behind the boat → behind the explorer
    if (t < 4.2) { const u = sstep(0, 4.2, t); _tc.set(lerp(262, 214, u), lerp(118, 62, u), lerp(470, 440, u)); _tt.set(192, lerp(50, 42, u), lerp(215, 300, u)); }
    else if (t < 10.2) { const u = sstep(4.2, 10.2, t); _tc.set(lerp(206, 201, u), lerp(46, 42.6, u), bz + lerp(12, 7.5, u)); _tt.set(lerp(194, 193, u), 40.5, bz - 9); }
    else { _tc.set(YOU.x + 2.4, YOU.y + 2.7, YOU.z + 5.4); _tt.set(YOU.x - 0.3, YOU.y + 1.3, YOU.z - 4); }
    const k = c.first ? 1 : 1 - Math.exp(-2.4 * dt); c.first = false;
    camera.position.lerp(_tc, k); c.look.lerp(_tt, k); camera.lookAt(c.look);
    player.pos.set(camera.position.x, camera.position.y - 1.62, camera.position.z); player.vel.set(0, 0, 0);
    camera.fov += (60 - camera.fov) * (1 - Math.exp(-4 * dt)); camera.updateProjectionMatrix();
    if (t > 16.4) endArrival(false);
  }

  /* ───────── third-person exploring ───────── */
  function setTP(on) { S.tp = !!on; S.tpD = 0; try { localStorage.setItem('minest.philosophers.tp', on ? '1' : '0'); } catch (e) {} }

  /* ───────── the journey: one line of guidance from the landing to the council ───────── */
  const JKEY = 'minest.philosophers.journey.v1';
  const J = { step: 0, el: null, t: 0 };
  try { J.step = Math.max(0, Math.min(6, parseInt(localStorage.getItem(JKEY), 10) || 0)); J.fold = localStorage.getItem(JKEY + '.fold') === '1'; } catch (e) {}
  const nearestPhil = () => { let b = null, bd = 1e9; npcs.forEach((n) => { if (n.you) return; const d = Math.hypot(n.homeX - player.pos.x, n.homeZ - player.pos.z); if (d < bd) { bd = d; b = n; } }); return b; };
  const STEPS = [
    { t: '登岛', d: '乘船抵达南岸的木栈桥' },
    { t: '走向中央广场', d: '沿石板大路一直向北。WASD 行走，V 切换第一 / 第三人称', tgt: () => [192.5, 216.5, '中央广场'], done: () => Math.hypot(player.pos.x - 192.5, player.pos.z - 216.5) < 10 && !S.cine },
    { t: '拜访一位哲学家', d: '走进任意一座展馆，靠近哲学家按 E', tgt: () => { const n = nearestPhil(); return n ? [n.phil.x + 0.5, n.phil.z + Math.floor(n.phil.d / 2) + 3.5, n.phil.name + '的展馆'] : null; }, done: () => S.talk && S.talk.mode === 'table' },
    { t: '圆桌对谈', d: '点亮一颗思想之星，听他讲完一段', done: () => S.talk && S.talk.mode === 'table' && S.talk.t > 9 },
    { t: '边走边谈', d: '在对谈右上角「⋯」里选「🚶 边走边谈」', done: () => S.talk && S.talk.mode === 'walk' && S.talk.t > 2 },
    { t: '召开圆桌会议', d: '按 C：请几位哲学家围坐，一起头脑风暴', tgt: () => [COUNCIL.x + 3.5, COUNCIL.z + 3.5, '广场旁的会议圆桌'], done: () => S.talk && S.talk.mode === 'council' },
    { t: '自由探索', d: '引导完成。43 座展馆、82 个全息模型等你拜访' }
  ];
  function setStep(n, quiet) {
    const prev = STEPS[J.step]; J.step = n; try { localStorage.setItem(JKEY, String(n)); } catch (e) {}
    if (!quiet && prev) toast('✓ ' + prev.t + '　→　下一步：' + STEPS[n].t);
    renderQuest();
  }
  function renderQuest() {
    if (!J.el) { J.el = document.createElement('div'); J.el.id = 'pi-quest'; document.body.appendChild(J.el);
      J.el.addEventListener('click', (e) => { const a = e.target && e.target.getAttribute && e.target.getAttribute('data-q'); if (!a) return;
        if (a === 'go') { const st = STEPS[J.step], g = st.tgt && st.tgt(); if (g) transition(null, null, () => teleport({ p: [g[0], 42, g[1] + 2.5], t: [g[0], 41.5, g[1] - 6], mode: 'walk' })); }
        if (a === 'skip') setStep(6, true);
        if (a === 'fold') { J.fold = !J.fold; try { localStorage.setItem(JKEY + '.fold', J.fold ? '1' : '0'); } catch (e2) {} renderQuest(); }
        if (a === 'board' && portals) portals.openTaskBoard();
        if (a === 'book' && portals) portals.openNotebook();
        if (a === 'hb' && portals) portals.openHandbook();
        if (a === 'again') { setStep(0, true); transition(null, null, startArrival); } }); }
    const st = STEPS[J.step], fin = J.step >= 6;
    const tools = '<div class="q-row q-tools"><button data-q="board" title="B">📋 任务板</button><button data-q="book" title="N">📓 笔记本</button><button data-q="hb" title="J">🧰 手册</button></div>';
    const head = '<div class="q-bar"><span class="q-step">' + (fin ? '探索者面板' : '旅程 ' + J.step + ' / 6') + '</span><button class="q-fold" data-q="fold" title="收起 / 展开">' + (J.fold ? '▸' : '▾') + '</button></div>';
    J.el.classList.toggle('fold', !!J.fold);
    J.el.innerHTML = head + (J.fold ? '' : (fin ? '<div class="q-title">自由探索</div><div class="q-desc">今天想了解什么？打开任务板写下来，岛上会告诉你该去找谁。</div>'
        : '<div class="q-title">' + st.t + '</div><div class="q-desc">' + st.d + '</div><div class="q-nav"></div>'
        + '<div class="q-dots">' + [1, 2, 3, 4, 5, 6].map((i) => '<span class="' + (i <= J.step ? 'on' : '') + '"></span>').join('') + '</div>'
        + '<div class="q-row">' + (st.tgt ? '<button data-q="go">⏩ 带我去</button>' : '') + '<button data-q="skip">跳过引导</button></div>'))
      + tools + (J.fold ? '' : '<div id="pi-quest-study"></div>' + (fin ? '<div class="q-row"><button data-q="again">↺ 重走旅程</button></div>' : ''));
    if (portals && portals.renderStudy) portals.renderStudy();
  }
  function updateJourney(dt) {
    J.t -= dt; if (J.t > 0 || !J.el) return; J.t = 0.2;
    const st = STEPS[J.step]; if (!st) return;
    if (st.done && st.done()) { setStep(J.step + 1); return; }
    const nav = J.el.querySelector('.q-nav'), g = st.tgt && !S.talk && !S.cine ? st.tgt() : null;
    if (!nav) return; if (!g) { if (nav.textContent) nav.textContent = ''; return; }
    const dx = g[0] - player.pos.x, dz = g[1] - player.pos.z, d = Math.hypot(dx, dz), rel = wrapAngle(Math.atan2(dx, dz) - Math.atan2(-Math.sin(player.yaw), -Math.cos(player.yaw)));
    nav.textContent = '↑↗→↘↓↙←↖'.charAt(((Math.round(-rel / (Math.PI / 4)) % 8) + 8) % 8) + ' ' + g[2] + ' · ' + Math.round(d) + ' 米';
  }

  function makeNPCMeshes() {
    const N = npcs.length;
    const G = {
      box: unitBox,
      cyl: new THREE.CylinderGeometry(0.5, 0.5, 1, 12),
      torso: new THREE.CylinderGeometry(0.5, 0.41, 1, 16),
      skirt: new THREE.CylinderGeometry(0.37, 0.5, 1, 18),
      sph: new THREE.SphereGeometry(0.5, 16, 12),
      cap: new THREE.SphereGeometry(0.5, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.56)
    };
    const mk = (geo) => {
      const m = new THREE.InstancedMesh(geo, new THREE.MeshLambertMaterial({ color: 0xffffff }), N);
      m.castShadow = true; m.frustumCulled = false; scene.add(m); return m;
    };
    npcMeshes = {
      body: mk(G.torso), skirt: mk(G.skirt), shoulders: mk(G.sph), belt: mk(G.cyl), neck: mk(G.cyl),
      head: mk(G.sph), nose: mk(G.sph), eyeL: mk(G.sph), eyeR: mk(G.sph),
      hair: mk(G.cap), hairBack: mk(G.sph), beard: mk(G.sph), stache: mk(G.sph), knot: mk(G.cyl),
      armL: mk(G.cyl), armR: mk(G.cyl), handL: mk(G.sph), handR: mk(G.sph),
      legL: mk(G.cyl), legR: mk(G.cyl), shoeL: mk(G.box), shoeR: mk(G.box), book: mk(G.box)
    };
    const c = new THREE.Color();
    const paint = (names, i, hex) => { c.setHex(hex); names.forEach((k) => npcMeshes[k].setColorAt(i, c)); };
    npcs.forEach((n, i) => {
      const st = n.style = NPC_STYLE[n.phil.id] || {};
      paint(['body', 'skirt', 'shoulders', 'armL', 'armR'], i, n.robe);
      c.setHex(n.robe).multiplyScalar(0.55); npcMeshes.belt.setColorAt(i, st.sleeve ? c.setHex(0xc9a353) : c);
      paint(['neck', 'head', 'nose', 'handL', 'handR'], i, n.skin);
      paint(['eyeL', 'eyeR'], i, 0x1f2937);
      paint(['hair', 'hairBack', 'beard', 'stache', 'knot'], i, n.hair);
      paint(['legL', 'legR'], i, st.stock ? 0xe8e2d0 : n.pants);
      paint(['shoeL', 'shoeR'], i, 0x1c1917);
      paint(['book'], i, 0xf59e0b); // Golden Magnum Opus tome held in hand
    });
    Object.values(npcMeshes).forEach((m) => { m.instanceColor.needsUpdate = true; });
  }

  function setPart(mesh, i, w, h, d, x, y, z, rx, ry) {
    dummy.position.set(x, y, z); dummy.rotation.set(rx, ry, 0, 'YXZ'); dummy.scale.set(w, h, d); dummy.updateMatrix(); mesh.setMatrixAt(i, dummy.matrix);
  }

  // a seated leg: a horizontal thigh (drawn as a box-like cylinder lying forward)
  function setPartSeat(mesh, i, n, loc, lx, yaw, k) { const q = loc(lx, 0.94, 0.25); setPart(mesh, i, 0.17, 0.50 * k, 0.18, q[0], q[1], q[2], Math.PI / 2, yaw); }

  function updateNPCs(dt, time) {
    if (!npcMeshes) return;
    const pp = player.pos;
    for (let i = 0; i < npcs.length; i++) {
      const n = npcs[i];
      let walking = false;
      let distPlayer = Math.hypot(pp.x - n.x, pp.z - n.z);
      const tk = S.talk, inTalk = tk && (n === tk.n || n.you || (tk.all && tk.all.has(n))), sitting = inTalk && tk.mode !== 'walk';
      if (inTalk) {
        walking = tk.mode === 'walk' && tk.pause <= 0 && !tk.done;
        distPlayer = tk.mode === 'council' ? (n === tk.speaker ? 1 : 99) : (n.you ? 99 : 1);   // whoever is speaking gestures
      } else if (n.you) {
        if (S.cine) { walking = !!S.cine.walking; distPlayer = 99; }
        else if (S.tp && S.mode === 'walk' && !S.sit && S.tpD > 1.1) {      // third person: the figure is where the player is
          n.x = pp.x; n.z = pp.z; n.y = pp.y; n.yaw = player.yaw + Math.PI; distPlayer = 99;
          walking = Math.hypot(player.vel.x, player.vel.z) > 0.6;
        } else n.y = -50;
      } else if (distPlayer < 8.5) {
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

      const sw = walking ? Math.sin(time * (inTalk || n.you ? 1.5 : n.speed) * 7 + n.phase) * 0.55 : 0;
      const seat = sitting ? 0.30 : 0;       // how far the hips drop onto the chair
      const talkGesture = distPlayer < 8.5 ? -0.45 + Math.sin(time * 3.8 + n.phase) * 0.22 : sw * 0.9;
      const yaw = n.yaw, s = Math.sin(yaw), c = Math.cos(yaw), k = n.h;
      const loc = (lx, ly, lz) => [n.x + lx * c + lz * s, n.y + (ly - seat) * k, n.z - lx * s + lz * c];
      const st = n.style || {}, P = npcMeshes;
      const put = (mesh, w, h, d, lx, ly, lz, rx) => { const q = loc(lx, ly, lz); setPart(mesh, i, w, h * k, d, q[0], q[1], q[2], rx || 0, yaw); };
      put(P.body, 0.50, 0.70, 0.30, 0, 1.00, 0);
      put(P.shoulders, 0.57, 0.17, 0.33, 0, 1.33, 0);
      if (st.robed) put(P.skirt, 0.64, 0.62, 0.46, 0, 0.375, 0);
      else if (st.coat) put(P.skirt, 0.57, 0.36, 0.39, 0, 0.51, 0);
      else put(P.skirt, 0, 0, 0, 0, 0.5, 0);
      put(P.belt, 0.50, 0.06, 0.33, 0, 0.69, 0);
      put(P.neck, 0.13, 0.10, 0.13, 0, 1.40, 0);
      put(P.head, 0.34, 0.38, 0.35, 0, 1.57, 0);
      put(P.nose, 0.06, 0.085, 0.07, 0, 1.555, 0.175);
      put(P.eyeL, 0.048, 0.055, 0.03, -0.078, 1.60, 0.156);
      put(P.eyeR, 0.048, 0.055, 0.03, 0.078, 1.60, 0.156);
      if (st.bald) put(P.hair, 0.375, 0.40, 0.385, 0, 1.575, -0.02, -1.15);
      else put(P.hair, 0.38, 0.40, 0.39, 0, 1.585, -0.02, -0.42);
      if (st.wig) put(P.hairBack, st.wig === 2 ? 0.50 : 0.41, 0.36, 0.27, 0, 1.47, -0.085);
      else put(P.hairBack, 0, 0, 0, 0, 1.47, 0);
      if (st.beard === 3) put(P.beard, 0.30, 0.50, 0.20, 0, 1.32, 0.105);
      else if (st.beard === 2) put(P.beard, 0.30, 0.30, 0.20, 0, 1.41, 0.10);
      else if (st.beard) put(P.beard, 0.26, 0.20, 0.18, 0, 1.44, 0.10);
      else put(P.beard, 0, 0, 0, 0, 1.4, 0);
      if (st.stache || st.beard) put(P.stache, st.stache === 2 ? 0.27 : 0.19, st.stache === 2 ? 0.085 : 0.05, 0.07, 0, 1.50, 0.165);
      else put(P.stache, 0, 0, 0, 0, 1.5, 0);
      if (st.knot) put(P.knot, 0.11, 0.11, 0.11, 0, 1.80, -0.02);
      else put(P.knot, 0, 0, 0, 0, 1.8, 0);
      const limb = (mesh, lx, ly, len, ang, w, d) => {
        const cy = -len / 2 * Math.cos(ang), cz = -len / 2 * Math.sin(ang);
        const qq = loc(lx, ly + cy, cz);
        setPart(mesh, i, w, len * k, d, qq[0], qq[1], qq[2], ang, yaw);
        return [lx, ly - len * Math.cos(ang), -len * Math.sin(ang)];
      };
      let e;
      if (sitting) {   // thighs forward on the seat, shins down
        setPartSeat(P.legL, i, n, loc, -0.12, yaw, k); setPartSeat(P.legR, i, n, loc, 0.12, yaw, k);
        put(P.shoeL, 0.18, 0.09, 0.28, -0.12, 0.345, 0.50); put(P.shoeR, 0.18, 0.09, 0.28, 0.12, 0.345, 0.50);
      } else {
      e = limb(P.legL, -0.12, 0.62, 0.58, sw, 0.17, 0.18); put(P.shoeL, 0.18, 0.09, 0.28, e[0], e[1] + 0.005, e[2] + 0.05);
      e = limb(P.legR, 0.12, 0.62, 0.58, -sw, 0.17, 0.18); put(P.shoeR, 0.18, 0.09, 0.28, e[0], e[1] + 0.005, e[2] + 0.05);
      }
      const aw = st.sleeve ? 0.21 : 0.15;
      e = limb(P.armL, -0.33, 1.30, 0.56, -0.38, aw, aw); put(P.handL, 0.10, 0.10, 0.10, e[0], e[1], e[2]);
      e = limb(P.armR, 0.33, 1.30, 0.56, talkGesture, aw, aw); put(P.handR, 0.10, 0.10, 0.10, e[0], e[1], e[2]);
      if (n.you) put(P.book, 0, 0, 0, 0, 0.8, 0); else put(P.book, 0.24, 0.30, 0.08, -0.34, 0.86, 0.27, 0.35);
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
    if (S.cine && (e.code === 'Escape' || e.code === 'Space' || e.code === 'Enter')) { e.preventDefault(); endArrival(true); return; }
    if (e.code === 'Escape') {
      if (portals && portals.isLibraryOpen && portals.isLibraryOpen()) { return; }
      if (portals && portals.isLightConeOpen && portals.isLightConeOpen()) { portals.closeLightCone(); return; }
      if (portals && portals.isRootmapOpen && portals.isRootmapOpen()) { portals.closeRootmap(); return; }
      if (portals && portals.isPaperOpen && portals.isPaperOpen()) { portals.closePaper(); return; }
      if (portals && portals.isFoldOpen && portals.isFoldOpen()) { portals.closeFold(); return; }
      if (portals && portals.isStoryOpen && portals.isStoryOpen()) { portals.closeStory(); return; }
      if (portals && portals.isStickOpen && portals.isStickOpen()) { portals.closeStick(); return; }
      if (portals && portals.isReaderOpen && portals.isReaderOpen()) { portals.closeReader(); return; }
      if (portals && portals.isCouncilOpen && portals.isCouncilOpen()) { portals.closeCouncil(); return; }
      if (portals && portals.isHoloOpen && portals.isHoloOpen()) { portals.closeHolo(); return; }
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
    if (e.code === 'KeyV' && S.mode === 'walk') { setTP(!S.tp); toast(S.tp ? '👤 第三人称视角' : '👁 第一人称视角'); }
    if (e.code === 'KeyC' && portals && portals.openCouncilSetup) portals.openCouncilSetup();
    if (e.code === 'KeyB' && portals && portals.openTaskBoard) portals.openTaskBoard();
    if (e.code === 'KeyR' && portals && portals.openShelfHere) portals.openShelfHere();
    if (e.code === 'KeyL' && portals && portals.openLightCone) portals.openLightCone();
    if (e.code === 'KeyK' && portals && portals.openStick) portals.openStick();
    if (e.code === 'KeyJ' && portals && portals.openHandbook) portals.openHandbook();
    if (e.code === 'KeyP' && portals && portals.openStory) portals.openStory();
    if (e.code === 'KeyO' && portals && portals.openFold) portals.openFold();
    if (e.code === 'KeyI' && portals && portals.openFold) portals.openFold('ideas');
    if (e.code === 'KeyU' && portals && portals.openPaper) portals.openPaper();
    if (e.code === 'KeyG' && !S.inLib) enterLibrary();
    if (e.code === 'KeyX' && !S.inLib && !S.ui) sphereMedia(e.shiftKey);
    if (e.code === 'KeyN' && portals && portals.openNotebook) portals.openNotebook();
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
    if (bookHit && portals && portals.openBook) { const u = bookHit.userData; portals.openBook(u.hall, u.i); return true; }
    if (S.nearCase && portals && portals.openShelf) { portals.openShelf(S.nearCase.p.id); return true; }
    if (S.inLib) { if (LIB.hit && portals) { const u = LIB.hit.userData; if (u.creative && portals.openCreative) portals.openCreative(u.book, 1); else if (u.book.file && portals.openCreative) portals.openCreative(u.book, u.book.world ? 1 : 0); else if (portals.openCatalogBook) portals.openCatalogBook(u.book); return true; } if (player.pos.z > 78.6 && Math.abs(player.pos.x - 453.5) < 4) { leaveLibrary(); return true; } return true; }
    if (nearLibrary()) { enterLibrary(); return true; }
    if (nearSphere() && portals && portals.openRootmap) { transition('环球巨幕', '两百块屏幕', () => portals.openRootmap('sphere')); return true; }
    { const st = ec6Station(); if (st) { openEc6(st.spec, st.i); return true; } if (nearEc6Desk() || nearEc6()) { openEc6(); return true; } }
    if (nearRootHall() && portals && portals.openRootmap) { transition('词根馆', '191 个词汇动图', () => portals.openRootmap()); return true; }
    if (nearCone() && portals && portals.openLightCone) { transition('光锥', '330 万年人类科技史', () => portals.openLightCone()); return true; }
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
    { ic: '⚖️', tip: '观点对比 · 同一问题问诸家', act: () => portals && portals.openCompareModal() },
    { ic: '📑', tip: '我的收藏', act: () => portals && portals.openSavedModal() },
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
    } else if (S.cine) {
      updateCine(dt);
      return;
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
      if (S.talk) {
        // third person: a slow arc round the table, or a follow shot behind and above the two walkers
        const tk = S.talk, n = tk.n;
        if (tk.mode === 'council') {
          // sit the camera across the table from whoever is speaking, and lean the gaze toward them
          const sp = tk.speaker, want = sp ? sp.seatA + Math.PI + 0.55 : 0.6 + tk.t * 0.05;
          tk.az += wrapAngle(want - tk.az) * (1 - Math.exp(-1.6 * dt));
          tk.lx += ((sp ? COUNCIL.x + (sp.x - COUNCIL.x) * 0.55 : COUNCIL.x) - tk.lx) * (1 - Math.exp(-2 * dt)); tk.lz += ((sp ? COUNCIL.z + (sp.z - COUNCIL.z) * 0.55 : COUNCIL.z) - tk.lz) * (1 - Math.exp(-2 * dt));
          const R = sp ? 5.0 : 6.2;
          _tc.set(COUNCIL.x + Math.sin(tk.az) * R, tk.gy + (sp ? 2.5 : 3.3), COUNCIL.z + Math.cos(tk.az) * R); _tt.set(tk.lx, tk.gy + 1.15, tk.lz);
        } else if (tk.mode === 'table') {
          const a = tk.az + Math.sin(tk.t * 0.12) * 0.35, R = 3.9;
          _tc.set(tk.tb.x + Math.sin(a) * R, tk.gy + 2.25, tk.tb.z + Math.cos(a) * R); _tt.set(tk.tb.x, tk.gy + 1.15, tk.tb.z);
        } else {
          const bx = Math.sin(n.yaw), bz = Math.cos(n.yaw);
          _tc.set(n.x - bx * tk.back + bz * 1.6, n.y + 2.9, n.z - bz * tk.back - bx * 1.6); _tt.set(n.x + bx * 1.2, n.y + 1.35, n.z + bz * 1.2);
        }
        const kk = tk.t < 0.1 ? 1 : 1 - Math.exp(-3.2 * dt);
        camera.position.lerp(_tc, kk); camera.lookAt(_tt);
        player.pos.set(camera.position.x, camera.position.y - 1.62, camera.position.z); player.vel.set(0, 0, 0);
        camera.fov += (58 - camera.fov) * (1 - Math.exp(-4.5 * dt));
        camera.updateProjectionMatrix();
        return;
      }
      movePlayer(dt);
      if (S.tp && S.mode === 'walk') {
        // over-the-shoulder: back along the view ray until something solid is in the way
        const cp = Math.cos(player.pitch), fx = -Math.sin(player.yaw) * cp, fy = Math.sin(player.pitch), fz = -Math.cos(player.yaw) * cp;
        const ex = player.pos.x, ey = player.pos.y + 1.78 + player.stepOff, ez = player.pos.z; let D = 0;
        const dMax = S.inLib ? 3.4 : 4.6, pad = S.inLib ? 0.7 : 0; for (let d = 0.3; d <= dMax; d += 0.2) { if (solidAt(Math.floor(ex - fx * (d + pad)), Math.floor(ey - fy * (d + pad) + d * 0.16), Math.floor(ez - fz * (d + pad)))) break; D = d; }
        S.tpD = D < S.tpD ? D : S.tpD + (D - S.tpD) * (1 - Math.exp(-6 * dt));
        camera.position.set(ex - fx * S.tpD, ey - fy * S.tpD + S.tpD * 0.16, ez - fz * S.tpD);
      } else camera.position.set(player.pos.x, player.pos.y + 1.62 + player.stepOff, player.pos.z);
      camera.rotation.set(player.pitch, player.yaw, 0);
      camera.fov += ((S.encounter ? (S.encounterFov || 50) : 72) - camera.fov) * (1 - Math.exp(-4.5 * dt));
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
    updateTalk(dt);
    updateJourney(dt);
    updateConeMonument(S.elapsed); updateEc6(S.elapsed); updateKonigsberg(S.elapsed, dt); updateSphere(S.elapsed); updateBookcases(S.elapsed); updateLibraryInterior();
    if (councilSet) councilSet.userData.orb.position.y = 1.02 + Math.sin(S.elapsed * 1.6) * 0.05;
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
      spawnExplorer();
      makeNPCMeshes();
      spawnSmoke();
      buildMinimap();
      initTour();
      buildCouncilSet();
      buildConeMonument();
      buildRootHall();
      buildEc6Hall();
      buildSphere();
      buildTimeIsleGrounds();
      buildKonigsberg();
      buildBookcases();
      buildLibrary();
      buildLibraryInterior();

      portals = PIPortals.attach({
        world, player, camera, S, props, toast, teleport, setTime,
        getNpc: (id) => npcs.find((n) => n.phil.id === id),
        startTableTalk: sceneTalk.table, startWalkTalk: sceneTalk.walk, endTalk: sceneTalk.end, tableOf,
        startCouncil: sceneTalk.council, setCouncilSpeaker
      });
      buildHotbar();

      window.__philosophersIsland = window.__voxel = {
        controls: consoleControls, world, player, scene, camera, S, props, portals,
        setMode, teleport, interact, setTime, renderer, startArrival, endArrival, setStep, journey: J,
        stats: () => {
          const r = renderer.info;
          return { drawCalls: r.render.calls, tris: r.render.triangles, fps: Math.round(fps), props: props ? props.stats() : null };
        }
      };

      setLoad('完成 · 哲学始于惊奇 (Thaumazein)', 1);
      setMode(S.mode, true);
      updateHint();
      $('loading').classList.add('done');
      renderQuest();
      try { S.tp = localStorage.getItem('minest.philosophers.tp') === '1'; } catch (e) {}
      S.tpD = 0;
      if (J.step === 0) { if (!qs.get('mode') && qs.get('nointro') !== '1') startArrival(); else setStep(1, true); }
      requestAnimationFrame(frame);
    } catch (err) {
      console.error(err);
      setLoad('加载失败：' + (err && err.message ? err.message : err), 1);
    }
  }

  boot();
})();
