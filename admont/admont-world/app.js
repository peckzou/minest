/* Admont Abbey Library - main application (Option D: plain three.js MESH, r128).
 * Renderer + bright natural-light rig, the architecture shell and one finished bookcase
 * (from scene.js), a first-person free-walk controller (WASD + mouse look on desktop,
 * joystick + drag on touch, pointer-lock) with collision against the hall shell and the
 * bookcases, a slow idle tour mode, and the loading sequence.
 *
 * Exposes window.__admont = { world, player, scene, camera, S, setMode, teleport,
 *   markDirty, interact, toggleDoor, sitOn } with the SAME method names Alpine's
 *   __alpine exposes, so the My World runtime (FEAT-003) can bind to it.
 * Guards DOM/listeners so the file also works when embedded (reads window.__admEmbed),
 * exactly as the Alpine app.js guards on window.__alpEmbed.
 */
(function () {
  'use strict';
  const VW = window.AdmontWorld;
  const $ = (id) => document.getElementById(id);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const nextFrame = () => new Promise((r) => requestAnimationFrame(() => r()));
  const V3 = THREE.Vector3;
  const qs = new URLSearchParams(location.search);
  const EMBED = !!window.__admEmbed;   // inside My World (FEAT-003 patch_admont.py)
  const isTouch = ('ontouchstart' in window) || matchMedia('(pointer:coarse)').matches;
  if (isTouch && document.body) document.body.classList.add('touch');

  /* ================= renderer / scene ================= */
  const canvas = $('gl');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !isTouch, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isTouch ? 1.5 : 2));
  renderer.shadowMap.enabled = !isTouch && qs.get('q') !== 'low';
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  if (renderer.outputEncoding !== undefined && THREE.sRGBEncoding !== undefined) renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.95;
  const Q = isTouch || qs.get('q') === 'low' ? 0.5 : 1;   // texture scale (frescoes)

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf3efe6);
  // very light fog so the 70 m depth reads without hiding the far end
  scene.fog = new THREE.FogExp2(0xf1ece0, 0.006);

  const camera = new THREE.PerspectiveCamera(70, 1, 0.05, 500);
  camera.rotation.order = 'YXZ';
  scene.add(camera);

  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize); resize();

  /* ================= lights (bright natural-light interior) ================= */
  // reflections: a small bright "room" (cream walls, white window strips) baked with PMREM,
  // so the gilding and the polished floor read as metal and stone instead of flat colour
  (function envMap() {
    const es = new THREE.Scene();
    const room = new THREE.Mesh(new THREE.BoxGeometry(20, 8, 6), new THREE.MeshBasicMaterial({ color: 0xcfc4ae, side: THREE.BackSide }));
    room.position.y = 3; es.add(room);
    const strip = new THREE.MeshBasicMaterial({ color: 0xffffff }); strip.color.setScalar(2.2);
    for (let i = -4; i <= 4; i++) for (const z of [-2.95, 2.95]) { const w = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 3), strip); w.position.set(i * 2.2, 4.5, z); w.lookAt(i * 2.2, 4.5, 0); es.add(w); }
    const top = new THREE.Mesh(new THREE.PlaneGeometry(20, 6), new THREE.MeshBasicMaterial({ color: 0xf6eedc })); top.rotation.x = Math.PI / 2; top.position.y = 6.9; es.add(top);
    const pm = new THREE.PMREMGenerator(renderer);
    scene.environment = pm.fromScene(es, 0.02).texture;
    pm.dispose();
  })();
  const hemi = new THREE.HemisphereLight(0xfff6e2, 0xb9ad96, 0.45);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff1d6, 1.5);
  sun.position.set(18, 30, 24);
  sun.castShadow = renderer.shadowMap.enabled;
  if (sun.castShadow) {
    sun.shadow.mapSize.set(2048, 2048);
    const SH = 40;
    Object.assign(sun.shadow.camera, { left: -SH, right: SH, top: SH, bottom: -SH, near: 1, far: 140 });
    sun.shadow.camera.updateProjectionMatrix();
    sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.03;
  }
  scene.add(sun, sun.target);
  // soft fill from the window side so the shadows do not go black
  const fill = new THREE.DirectionalLight(0xeaf0ff, 0.3);
  fill.position.set(-16, 20, -22);
  scene.add(fill);
  // a gentle warm point light under the dome
  const domeLight = new THREE.PointLight(0xffe9c0, 0.4, 40, 1.4);
  domeLight.position.set(0, 9, 0);
  scene.add(domeLight);

  /* ================= state ================= */
  let world = null;
  let colliders = [];
  const S = { mode: 'tour', sit: null, tourT: 0, hudT: 0, locked: false, elapsed: 0 };
  const keys = Object.create(null);
  const player = { pos: new V3(0, 0, 0), vel: new V3(), yaw: 0, pitch: 0, onGround: true, fly: false };
  const joy = { x: 0, y: 0 };
  const touchBtn = { jump: false, down: false };

  /* ================= collision ================= */
  const HW = 0.3, PH = 1.7, EYE = 1.62;
  function boxBlocked(px, py, pz) {
    // player AABB
    const minx = px - HW, maxx = px + HW, miny = py, maxy = py + PH, minz = pz - HW, maxz = pz + HW;
    for (let i = 0; i < colliders.length; i++) {
      const c = colliders[i];
      if (maxx > c.min.x && minx < c.max.x && maxy > c.min.y && miny < c.max.y && maxz > c.min.z && minz < c.max.z) return true;
    }
    return false;
  }
  // the outer shell: keep the player inside the hall footprint regardless of colliders
  function outOfBounds(px, pz) {
    return px < world.X0 + 0.5 || px > world.X1 - 0.5 || pz < world.Z0 + 0.5 || pz > world.Z1 - 0.5;
  }
  function blocked(px, py, pz) {
    if (!world) return false;
    if (outOfBounds(px, pz)) return true;
    return boxBlocked(px, py, pz);
  }

  /* ================= modes ================= */
  const MODE_LABEL = { tour: '导览模式 · 点击或按任意键开始探索', walk: '步行模式', fly: '飞行模式' };
  function setMode(m, keepPos) {
    const prev = S.mode;
    if (!keepPos && (m === 'walk' || m === 'fly') && prev === 'tour') {
      player.pos.set(camera.position.x, Math.max(0, camera.position.y - EYE), camera.position.z);
      player.vel.set(0, 0, 0);
    }
    S.mode = m;
    player.fly = (m === 'fly');
    if (m !== 'walk') S.sit = null;
    const ml = $('modeLabel'); if (ml) ml.textContent = MODE_LABEL[m];
    const ch = $('crosshair'); if (ch) ch.style.display = (m === 'walk' || m === 'fly') ? 'block' : 'none';
    if (m === 'tour') exitLock();
  }
  function look(fx, fy, fz, tx, ty, tz) { const dx = tx - fx, dy = ty - fy, dz = tz - fz; return { yaw: Math.atan2(-dx, -dz), pitch: Math.atan2(dy, Math.hypot(dx, dz)) }; }
  function teleport(t) {
    S.sit = null;
    const f = look(t.p[0], t.p[1] + EYE, t.p[2], t.t[0], t.t[1], t.t[2]);
    player.yaw = f.yaw; player.pitch = f.pitch;
    player.pos.set(t.p[0], t.p[1], t.p[2]); player.vel.set(0, 0, 0);
    setMode(t.mode || 'walk', true);
    if (!isTouch) requestLock();
  }

  /* ================= input ================= */
  function requestLock() { if (!isTouch && canvas.requestPointerLock && !document.pointerLockElement) { try { const pr = canvas.requestPointerLock(); if (pr && pr.catch) pr.catch(() => {}); } catch (e) { /* ignore */ } } }
  function exitLock() { if (document.pointerLockElement && document.exitPointerLock) document.exitPointerLock(); }
  document.addEventListener('pointerlockchange', () => {
    S.locked = document.pointerLockElement === canvas;
    const lh = $('lockHint'); if (lh) lh.style.display = (!S.locked && !isTouch && (S.mode === 'walk' || S.mode === 'fly')) ? 'block' : 'none';
  });
  const inField = (e) => e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA');
  window.addEventListener('keydown', (e) => {
    if (inField(e)) return;
    keys[e.code] = true;
    if (S.mode === 'tour' && !e.metaKey && !e.ctrlKey && !/^(F\d+|Tab|Escape)$/.test(e.code)) { setMode('walk'); requestLock(); }
    if (e.code === 'Space') e.preventDefault();
    if (e.code === 'KeyF' && (S.mode === 'walk' || S.mode === 'fly')) setMode(S.mode === 'fly' ? 'walk' : 'fly');
    if (e.code === 'KeyE' && (S.mode === 'walk' || S.mode === 'fly')) interact();
  });
  window.addEventListener('keyup', (e) => { keys[e.code] = false; });
  window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; });

  let dragging = false;
  canvas.addEventListener('mousedown', () => {
    if (S.mode === 'tour') { setMode('walk'); requestLock(); return; }
    if (!S.locked) { requestLock(); dragging = true; return; }
    const b = aimBook(); if (b >= 0) collectBook(b);     // click a spine to collect it
  });
  window.addEventListener('mouseup', () => { dragging = false; });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  window.addEventListener('mousemove', (e) => {
    if (!(S.locked || dragging)) return;
    if (S.mode === 'tour') return;
    player.yaw -= (e.movementX || 0) * 0.0022;
    player.pitch = clamp(player.pitch - (e.movementY || 0) * 0.0022, -1.5, 1.5);
  });

  // touch: left joystick, right-side look drag
  (function touchInit() {
    const joyEl = $('joy'); if (!joyEl) return;
    const knob = joyEl.firstElementChild;
    let jid = null, jc = null, lid = null, lx = 0, ly = 0, lt0 = 0, ltx = 0, lty = 0;
    joyEl.addEventListener('touchstart', (e) => { e.preventDefault(); const t = e.changedTouches[0]; jid = t.identifier; const r = joyEl.getBoundingClientRect(); jc = [r.left + r.width / 2, r.top + r.height / 2]; if (S.mode === 'tour') setMode('walk'); }, { passive: false });
    window.addEventListener('touchmove', (e) => {
      for (const t of e.changedTouches) {
        if (t.identifier === jid) {
          let dx = (t.clientX - jc[0]) / 50, dy = (t.clientY - jc[1]) / 50; const l = Math.hypot(dx, dy); if (l > 1) { dx /= l; dy /= l; }
          joy.x = dx; joy.y = dy; if (knob) knob.style.transform = 'translate(' + dx * 40 + 'px,' + dy * 40 + 'px)';
        } else if (t.identifier === lid) {
          player.yaw -= (t.clientX - lx) * 0.005; player.pitch = clamp(player.pitch - (t.clientY - ly) * 0.005, -1.5, 1.5); lx = t.clientX; ly = t.clientY;
        }
      }
    }, { passive: true });
    const end = (e) => { for (const t of e.changedTouches) { if (t.identifier === jid) { jid = null; joy.x = joy.y = 0; if (knob) knob.style.transform = ''; } if (t.identifier === lid) { lid = null; if (performance.now() - lt0 < 220 && Math.hypot(t.clientX - ltx, t.clientY - lty) < 8 && (S.mode === 'walk' || S.mode === 'fly')) interact(); } } };
    window.addEventListener('touchend', end); window.addEventListener('touchcancel', end);
    canvas.addEventListener('touchstart', (e) => {
      if (S.mode === 'tour') { setMode('walk'); return; }
      const t = e.changedTouches[0]; if (lid === null) { lid = t.identifier; lx = ltx = t.clientX; ly = lty = t.clientY; lt0 = performance.now(); }
    }, { passive: true });
    const hold = (el, key) => { if (!el) return; el.addEventListener('touchstart', (e) => { e.preventDefault(); touchBtn[key] = true; }, { passive: false }); el.addEventListener('touchend', () => { touchBtn[key] = false; }); el.addEventListener('touchcancel', () => { touchBtn[key] = false; }); };
    hold($('tJump'), 'jump'); hold($('tDown'), 'down');
    const tUse = $('tUse'); if (tUse) tUse.addEventListener('touchstart', (e) => { e.preventDefault(); if (S.mode === 'tour') setMode('walk'); interact(); }, { passive: false });
  })();

  /* ================= player physics ================= */
  function movePlayer(dt) {
    const p = player;
    const fwd = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0) - joy.y;
    const side = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0) + joy.x;
    let ix = side, iz = -fwd;
    const l = Math.hypot(ix, iz); if (l > 1) { ix /= l; iz /= l; }
    const sin = Math.sin(p.yaw), cos = Math.cos(p.yaw);
    const wx = cos * ix + sin * iz, wz = -sin * ix + cos * iz;
    const sprint = !!(keys.ShiftLeft || keys.ShiftRight);
    const jump = !!(keys.Space || touchBtn.jump);
    const down = !!(keys.KeyC || touchBtn.down);
    const speed = p.fly ? (sprint ? 20 : 9) : (sprint ? 6.2 : 3.8);
    const k = 1 - Math.exp(-14 * dt);
    p.vel.x += (wx * speed - p.vel.x) * k; p.vel.z += (wz * speed - p.vel.z) * k;
    if (p.fly) {
      const vy = (jump ? 1 : 0) - (down ? 1 : 0);
      p.vel.y += (vy * 10 - p.vel.y) * (1 - Math.exp(-9 * dt));
    } else {
      p.vel.y -= 26 * dt; if (p.vel.y < -40) p.vel.y = -40;
      if (jump && p.onGround) { p.vel.y = 6.4; p.onGround = false; }
    }
    // sub-stepped axis-separated collision
    const steps = Math.max(1, Math.ceil(dt / 0.012)), h = dt / steps;
    for (let s = 0; s < steps; s++) {
      const nx = p.pos.x + p.vel.x * h;
      if (blocked(nx, p.pos.y, p.pos.z)) p.vel.x = 0; else p.pos.x = nx;
      const nz = p.pos.z + p.vel.z * h;
      if (blocked(p.pos.x, p.pos.y, nz)) p.vel.z = 0; else p.pos.z = nz;
      const ny = p.pos.y + p.vel.y * h;
      if (blocked(p.pos.x, ny, p.pos.z)) {
        if (p.vel.y < 0) { p.pos.y = Math.max(0, Math.floor(ny)); p.onGround = true; }
        p.vel.y = 0;
      } else {
        p.pos.y = ny;
      }
      if (p.pos.y <= 0) { p.pos.y = 0; if (p.vel.y < 0) p.vel.y = 0; p.onGround = true; }
      else if (!p.fly) {
        p.onGround = p.vel.y <= 0 && (p.pos.y <= 0.001 || blocked(p.pos.x, p.pos.y - 0.03, p.pos.z));
      }
    }
    if (p.pos.y < -20) { p.pos.set(world.spawn.x, world.spawn.y + 1, world.spawn.z); p.vel.set(0, 0, 0); }
  }

  /* ================= doors & seats ================= */
  function toggleDoor(d) {
    if (!d) return;
    d.open = !d.open;
    toast(d.open ? '🚪 开门' : '🚪 关门');
    if (window.__admDoor) window.__admDoor(d);
  }
  function nearDoor(r) {
    const p = player.pos; let best = null, bd = r;
    for (const d of world.doors) { const k = Math.hypot(p.x - d.x, p.z - d.z); if (k < bd) { bd = k; best = d; } }
    return best;
  }
  function nearSeat(r) {
    const p = player.pos; let best = null, bd = r;
    for (const s of world.seats) { const k = Math.hypot(p.x - s.x, p.z - s.z); if (k < bd) { bd = k; best = s; } }
    return best;
  }
  function sitOn(s) {
    if (!s) return;
    S.sit = s; player.pos.set(s.x, s.y, s.z); player.vel.set(0, 0, 0);
    toast('🪑 坐下 · 移动即可站起来');
  }
  function standUp() { const s = S.sit; S.sit = null; if (s) { player.pos.set(s.x, s.y + 0.02, s.z); player.vel.set(0, 0, 0); } }
  /* ================= collect books (hook for a future collection feature) =================
   * Aim at a spine (crosshair) and press E / tap: the book is marked collected (gold) or
   * un-marked. Ids are stable ("<case>-<row>-<n>"). Storage: window.__admBooks = { load()
   * -> [ids], save(ids) } when My World provides it, else localStorage 'admont.books.v1'.
   * No inventory UI yet. */
  const BOOK_KEY = 'admont.books.v1';
  const collected = new Set();
  let built = null;
  const ray = new THREE.Raycaster(); ray.far = 4.5;
  function loadBooks() {
    let ids = [];
    try { ids = window.__admBooks ? window.__admBooks.load() || [] : JSON.parse(localStorage.getItem(BOOK_KEY) || '[]'); } catch (e) { ids = []; }
    for (const id of ids) { const i = built.books.index[id]; if (i != null) { collected.add(id); built.books.setCollected(i, true); } }
  }
  function saveBooks() {
    const ids = Array.from(collected);
    try { if (window.__admBooks) window.__admBooks.save(ids); else localStorage.setItem(BOOK_KEY, JSON.stringify(ids)); } catch (e) { /* storage full / blocked */ }
  }
  function aimBook() {
    if (!built) return -1;
    ray.setFromCamera({ x: 0, y: 0 }, camera);
    const hit = ray.intersectObject(built.books.mesh, false)[0];
    return hit && hit.instanceId != null ? hit.instanceId : -1;
  }
  function collectBook(i, on) {
    const id = built.books.ids[i];
    if (on == null) on = !collected.has(id);
    if (on) collected.add(id); else collected.delete(id);
    built.books.setCollected(i, on);
    saveBooks();
    const m = built.books.meta[i];
    toast(on ? '📕 已收藏 · ' + id + ' · 共 ' + collected.size + ' 本' : '📖 取消收藏 · ' + id);
    if (window.__admBook) window.__admBook({ id, on, case: m.case, wing: m.wing });
    return on;
  }
  function interact() {
    if (S.sit) { standUp(); return true; }
    const b = aimBook(); if (b >= 0) { collectBook(b); return true; }
    const d = nearDoor(2.6); if (d) { toggleDoor(d); return true; }
    const s = nearSeat(1.6); if (s) { sitOn(s); return true; }
    toast('对准书脊按 E 收藏 · 附近没有门或座位');
    return false;
  }

  /* ================= HUD ================= */
  let toastT = 0;
  function toast(msg) { const el = $('toast'); if (!el) return; el.textContent = msg; el.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('show'), 2400); }

  /* ================= tour / idle camera ================= */
  let tourCam = null, tourTgt = null, TOUR = null;
  function initTour() {
    TOUR = world.tour;
    tourCam = new THREE.CatmullRomCurve3(TOUR.cam.map((p) => new V3(p[0], p[1], p[2])), true, 'centripetal');
    tourTgt = new THREE.CatmullRomCurve3(TOUR.tgt.map((p) => new V3(p[0], p[1], p[2])), true, 'centripetal');
  }
  const _tc = new V3(), _tt = new V3();
  function updateCamera(dt) {
    if (S.mode === 'tour') {
      S.tourT = (S.tourT + dt / TOUR.dur) % 1;
      tourCam.getPointAt(S.tourT, _tc); tourTgt.getPointAt(S.tourT, _tt);
      camera.position.copy(_tc); camera.lookAt(_tt);
      const d = new V3().subVectors(_tt, _tc);
      player.yaw = Math.atan2(-d.x, -d.z); player.pitch = Math.atan2(d.y, Math.hypot(d.x, d.z));
    } else {
      if (S.sit) {
        const mv = keys.KeyW || keys.KeyA || keys.KeyS || keys.KeyD || keys.ArrowUp || keys.ArrowDown || keys.ArrowLeft || keys.ArrowRight || keys.Space || Math.hypot(joy.x, joy.y) > 0.3 || touchBtn.jump;
        if (mv) standUp();
        else { player.vel.set(0, 0, 0); camera.position.set(S.sit.x, S.sit.y + 0.95, S.sit.z); camera.rotation.set(player.pitch, player.yaw, 0); camera.updateProjectionMatrix(); return; }
      }
      movePlayer(dt);
      camera.position.set(player.pos.x, player.pos.y + EYE, player.pos.z);
      camera.rotation.set(player.pitch, player.yaw, 0);
    }
    camera.updateProjectionMatrix();
  }

  /* ================= main loop ================= */
  let last = performance.now();
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    S.elapsed += dt;
    updateCamera(dt);
    if (built && built.update) built.update(dt);
    sun.target.position.set(camera.position.x, 0, camera.position.z);
    sun.position.set(camera.position.x + 18, 30, camera.position.z + 24);
    sun.target.updateMatrixWorld();
    S.hudT -= dt;
    if (S.hudT <= 0) {
      S.hudT = 0.2;
      const cp = camera.position, co = $('coords');
      if (co) co.textContent = 'XYZ ' + cp.x.toFixed(1) + ' ' + cp.y.toFixed(1) + ' ' + cp.z.toFixed(1);
    }
    renderer.render(scene, camera);
  }

  /* ================= boot ================= */
  const setLoad = (msg, p) => { const lm = $('loadMsg'); if (lm) lm.textContent = msg; const bar = $('bar'); if (bar && bar.firstElementChild) bar.firstElementChild.style.width = Math.round(p * 100) + '%'; };
  async function boot() {
    try {
      setLoad('测量大厅 · 70 米…', 0.08); await nextFrame();
      world = window.__admWorld || VW.create(1776); window.__admWorld = world;
      if (window.__admApply) window.__admApply(world, null);
      player.pos.set(world.spawn.x, world.spawn.y, world.spawn.z);
      player.yaw = world.spawn.yaw || 0;

      setLoad('浇筑大理石地板与白金墙…', 0.3); await nextFrame();
      setLoad('绘制七幅天顶壁画 · 雕塑 · 书架…', 0.45); await nextFrame();
      built = AdmontScene.build(world, THREE, window.AdmontTex, { q: Q, base: window.__admBase || '' });
      scene.add(built.group);
      colliders = built.colliders;
      loadBooks();

      setLoad('整理书架 · 装订 ' + built.books.count + ' 本书…', 0.8); await nextFrame();
      initTour();

      // expose the SAME API shape as Alpine's __alpine (+ books and stats)
      window.__admont = {
        world, player, scene, camera, S, built,
        setMode, teleport, markDirty: function () {}, interact, toggleDoor, sitOn,
        books: {
          count: built.books.count,
          ids: () => built.books.ids.slice(),
          collected: () => Array.from(collected),
          aim: () => { const i = aimBook(); return i >= 0 ? built.books.ids[i] : null; },
          collect: (id, on) => { const i = built.books.index[id]; return i == null ? null : collectBook(i, on); },
          cases: built.cases.map((c) => ({ id: c.id, wing: c.wing, books: c.books.length }))
        },
        stats: function () {
          let tris = 0, geos = 0;
          scene.traverse((o) => {
            if (!o.isMesh || !o.visible) return;
            const g = o.geometry; const n = (g.index ? g.index.count : g.attributes.position.count) / 3;
            tris += n * (o.isInstancedMesh ? o.count : 1); geos++;
          });
          const r = renderer.info.render;
          return { drawCalls: r.calls, renderedTris: r.triangles, sceneTris: Math.round(tris), meshes: geos, books: built.books.count, collected: collected.size, frescoes: built.frescoes, sculptures: built.sculptures.length, windows: built.windows, textures: renderer.info.memory.textures, shadows: renderer.shadowMap.enabled };
        }
      };

      setLoad('完成', 1);
      applyURLCamera();
      setMode(S.mode);
      const loading = $('loading'); if (loading) loading.classList.add('done');
      requestAnimationFrame(frame);
    } catch (err) {
      console.error(err);
      setLoad('加载失败：' + (err && err.message ? err.message : err), 1);
    }
  }
  function applyURLCamera() {
    const m = qs.get('mode'); if (m && ['tour', 'walk', 'fly'].includes(m)) S.mode = m;
    if (m === 'walk' || m === 'fly') { player.pos.set(world.spawn.x, world.spawn.y, world.spawn.z); player.yaw = world.spawn.yaw || 0; }
    if (qs.get('hud') === '0') { const h = $('hud'); if (h) h.style.display = 'none'; }
  }

  // when embedded (FEAT-003), the host decides when to boot; otherwise boot now.
  if (EMBED && window.__admDeferBoot) { window.__admBoot = boot; }
  else boot();
})();
