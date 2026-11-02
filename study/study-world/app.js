/* The Study - application (three.js r128).
 * First-person walk (WASD + mouse look / joystick + drag), collision with the shelves and furniture, and the room's living parts:
 *   - the rolling ladder: walk into its side to push it along the rail, G grabs it and drags it along as you walk,
 *     E at its foot climbs it (W/S up and down, A/D slide the ladder along the rail while you stand on it);
 *   - chairs: E sits (desk chair, armchair); at the desk R reads the book you took from the shelf;
 *   - books: aim at a spine, E (or click / tap) slides it out; its card opens (title, author, text); 放回 puts it back.
 * The user's books come from window.__stBooks.load() (My World gives the real Items) or localStorage 'study.books.v1'.
 * Exposes window.__study = { world, player, scene, camera, S, built, setMode, teleport, interact, sitOn, stats, ... }.
 * Embedded in My World (window.__stEmbed) the host decides when to boot.
 */
(function () {
  'use strict';
  const VW = window.StudyWorld;
  const $ = (id) => document.getElementById(id);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const nextFrame = () => new Promise((r) => requestAnimationFrame(() => r()));
  const V3 = THREE.Vector3;
  const qs = new URLSearchParams(location.search);
  const EMBED = !!window.__stEmbed;
  const isTouch = ('ontouchstart' in window) || matchMedia('(pointer:coarse)').matches;
  if (isTouch && document.body) document.body.classList.add('touch');

  /* ================= renderer / scene / lights ================= */
  const canvas = $('gl');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !isTouch, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isTouch ? 1.5 : 2));
  renderer.shadowMap.enabled = !isTouch && qs.get('q') !== 'low';
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  if (renderer.outputEncoding !== undefined && THREE.sRGBEncoding !== undefined) renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.25;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x15100c);
  const camera = new THREE.PerspectiveCamera(68, 1, 0.04, 60); camera.rotation.order = 'YXZ'; scene.add(camera);
  function resize() { const w = window.innerWidth, h = window.innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
  window.addEventListener('resize', resize); resize();
  scene.add(new THREE.HemisphereLight(0xffe9cc, 0x3b2a1c, 0.7));
  const sun = new THREE.DirectionalLight(0xdbe6ff, 1.0);   // daylight through the north window
  sun.position.set(-1.5, 5.2, -8); sun.target.position.set(0, 0.5, -0.5);
  sun.castShadow = renderer.shadowMap.enabled;
  if (sun.castShadow) { sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -6, right: 6, top: 5, bottom: -5, near: 1, far: 20 }); sun.shadow.camera.updateProjectionMatrix(); sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.02; }
  scene.add(sun, sun.target);

  /* ================= state ================= */
  let world = null, built = null, colliders = [];
  const S = { mode: 'tour', sit: null, climb: null, grab: false, reading: false, held: null, tourT: 0, hudT: 0, locked: false, elapsed: 0 };
  const keys = Object.create(null);
  const player = { pos: new V3(), vel: new V3(), yaw: 0, pitch: 0, onGround: true, fly: false };
  const joy = { x: 0, y: 0 }, touchBtn = { jump: false, down: false };
  const HW = 0.28, PH = 1.7, EYE = 1.62;

  /* ================= books: where they come from ================= */
  const KEY = 'study.books.v1';
  const DEMO = [
    ['Pride and Prejudice', 'Jane Austen', 'It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.'],
    ['Great Expectations', 'Charles Dickens', 'My father\'s family name being Pirrip, and my Christian name Philip, my infant tongue could make of both names nothing longer or more explicit than Pip.'],
    ['Moby-Dick', 'Herman Melville', 'Call me Ishmael. Some years ago, never mind how long precisely, having little or no money in my purse, I thought I would sail about a little and see the watery part of the world.'],
    ['Jane Eyre', 'Charlotte Brontë', 'There was no possibility of taking a walk that day.'],
    ['The Origin of Species', 'Charles Darwin', 'When on board H.M.S. Beagle, as naturalist, I was much struck with certain facts in the distribution of the inhabitants of South America.'],
    ['Middlemarch', 'George Eliot', 'Miss Brooke had that kind of beauty which seems to be thrown into relief by poor dress.'],
    ['Walden', 'Henry David Thoreau', 'When I wrote the following pages, or rather the bulk of them, I lived alone, in the woods, a mile from any neighbor.'],
    ['Wuthering Heights', 'Emily Brontë', '1801. I have just returned from a visit to my landlord, the solitary neighbour that I shall be troubled with.'],
    ['Sherlock Holmes', 'Arthur Conan Doyle', 'To Sherlock Holmes she is always the woman.'],
    ['Alice in Wonderland', 'Lewis Carroll', 'Alice was beginning to get very tired of sitting by her sister on the bank.'],
    ['Frankenstein', 'Mary Shelley', 'You will rejoice to hear that no disaster has accompanied the commencement of an enterprise which you have regarded with such evil forebodings.'],
    ['Treasure Island', 'R. L. Stevenson', 'Squire Trelawney, Dr. Livesey, and the rest of these gentlemen having asked me to write down the whole particulars about Treasure Island.'],
    ['Emma', 'Jane Austen', 'Emma Woodhouse, handsome, clever, and rich, with a comfortable home and happy disposition.'],
    ['Leaves of Grass', 'Walt Whitman', 'I celebrate myself, and sing myself.'],
    ['The Odyssey', 'Homer', 'Tell me, O muse, of that ingenious hero who travelled far and wide.'],
    ['Meditations', 'Marcus Aurelius', 'Begin the morning by saying to thyself, I shall meet with the busy-body, the ungrateful, arrogant, deceitful, envious, unsocial.'],
    ['A Tale of Two Cities', 'Charles Dickens', 'It was the best of times, it was the worst of times.'],
    ['Persuasion', 'Jane Austen', 'Sir Walter Elliot, of Kellynch Hall, in Somersetshire, was a man who, for his own amusement, never took up any book but the Baronetage.'],
    ['The Time Machine', 'H. G. Wells', 'The Time Traveller (for so it will be convenient to speak of him) was expounding a recondite matter to us.'],
    ['Dracula', 'Bram Stoker', '3 May. Bistritz. Left Munich at 8:35 P.M., on 1st May, arriving at Vienna early next morning.'],
    ['The Art of War', 'Sun Tzu', 'The art of war is of vital importance to the State.']
  ];
  function demoBooks() { const out = []; for (let k = 0; k < 3; k++) DEMO.forEach((d, i) => { if (k && i % 3) return; out.push({ id: 'demo-' + k + '-' + i, title: d[0], author: d[1], text: d[2] }); }); return out; }
  function loadBooks() {
    try { if (window.__stBooks && window.__stBooks.load) return window.__stBooks.load() || []; } catch (e) { /* host failed */ }
    try { const s = localStorage.getItem(KEY); if (s) return JSON.parse(s); } catch (e) { /* none */ }
    return demoBooks();
  }
  function saveBooks(list) { try { if (window.__stBooks && window.__stBooks.save) window.__stBooks.save(list); else localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) { /* blocked */ } }
  function addBook(title, author) {
    const list = loadBooks().slice(); list.unshift({ id: 'own-' + Date.now().toString(36), title: String(title).slice(0, 60), author: String(author || '').slice(0, 40), text: '' });
    saveBooks(list); built.books.set(list); toast('📚 已放上书架：' + title);
  }

  /* ================= collision ================= */
  function ladderBox(z) { const L = world.ladder; return { min: { x: L.baseX - 0.08, y: 0, z: z - L.half - 0.05 }, max: { x: L.topX, y: 2.7, z: z + L.half + 0.05 } }; }
  function hit(c, px, py, pz) { return px + HW > c.min.x && px - HW < c.max.x && py + PH > c.min.y && py < c.max.y && pz + HW > c.min.z && pz - HW < c.max.z; }
  function staticBlocked(px, py, pz) {
    if (px < world.X0 + 0.35 || px > world.X1 - 0.35 || pz < world.Z0 + 0.35 || pz > world.Z1 - 0.35) return true;
    for (let i = 0; i < colliders.length; i++) if (hit(colliders[i], px, py, pz)) return true;
    return false;
  }
  function setMode(m, keepPos) {
    const prev = S.mode;
    if (!keepPos && (m === 'walk' || m === 'fly') && prev === 'tour') { player.pos.set(world.spawn.x, 0, world.spawn.z); player.yaw = world.spawn.yaw; player.pitch = 0; player.vel.set(0, 0, 0); }
    S.mode = m; player.fly = (m === 'fly');
    if (m !== 'walk') { S.sit = null; S.climb = null; S.grab = false; S.reading = false; }
    const ml = $('modeLabel'); if (ml) ml.textContent = { tour: '导览模式 · 点击或按任意键开始', walk: '步行模式', fly: '飞行模式' }[m];
    const ch = $('crosshair'); if (ch) ch.style.display = (m === 'walk' || m === 'fly') ? 'block' : 'none';
    if (m === 'tour') exitLock();
  }
  function look(fx, fy, fz, tx, ty, tz) { const dx = tx - fx, dy = ty - fy, dz = tz - fz; return { yaw: Math.atan2(-dx, -dz), pitch: Math.atan2(dy, Math.hypot(dx, dz)) }; }
  function teleport(t) {
    S.sit = null; S.climb = null; S.grab = false; S.reading = false;
    const f = look(t.p[0], t.p[1] + EYE, t.p[2], t.t[0], t.t[1], t.t[2]);
    player.yaw = f.yaw; player.pitch = f.pitch; player.pos.set(t.p[0], t.p[1], t.p[2]); player.vel.set(0, 0, 0);
    setMode(t.mode || 'walk', true); if (!isTouch) requestLock();
  }

  /* ================= input ================= */
  function requestLock() { if (!isTouch && canvas.requestPointerLock && !document.pointerLockElement) { try { const pr = canvas.requestPointerLock(); if (pr && pr.catch) pr.catch(() => {}); } catch (e) { /* ignore */ } } }
  function exitLock() { if (document.pointerLockElement && document.exitPointerLock) document.exitPointerLock(); }
  document.addEventListener('pointerlockchange', () => { S.locked = document.pointerLockElement === canvas; const lh = $('lockHint'); if (lh) lh.style.display = (!S.locked && !isTouch && (S.mode === 'walk' || S.mode === 'fly')) ? 'block' : 'none'; });
  const inField = (e) => e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA');
  window.addEventListener('keydown', (e) => {
    if (inField(e)) return;
    keys[e.code] = true;
    if (S.mode === 'tour' && !e.metaKey && !e.ctrlKey && !/^(F\d+|Tab|Escape)$/.test(e.code)) { setMode('walk'); requestLock(); }
    if (e.code === 'Space') e.preventDefault();
    const act = S.mode === 'walk' || S.mode === 'fly';
    if (e.code === 'KeyF' && act && !S.climb && !S.sit) setMode(S.mode === 'fly' ? 'walk' : 'fly');
    if (e.code === 'KeyE' && act) interact();
    if (e.code === 'KeyG' && act) toggleGrab();
    if (e.code === 'KeyR' && act) toggleRead();
    if (e.code === 'KeyB' && act) toggleAdd();
  });
  window.addEventListener('keyup', (e) => { keys[e.code] = false; });
  window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
  let dragging = false;
  canvas.addEventListener('mousedown', () => {
    if (S.mode === 'tour') { setMode('walk'); requestLock(); return; }
    if (!S.locked) { requestLock(); dragging = true; return; }
    interact();
  });
  window.addEventListener('mouseup', () => { dragging = false; });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  window.addEventListener('mousemove', (e) => {
    if (!(S.locked || dragging) || S.mode === 'tour') return;
    player.yaw -= (e.movementX || 0) * 0.0022; player.pitch = clamp(player.pitch - (e.movementY || 0) * 0.0022, -1.5, 1.5);
  });
  (function touchInit() {
    const joyEl = $('joy'); if (!joyEl) return; const knob = joyEl.firstElementChild;
    let jid = null, jc = null, lid = null, lx = 0, ly = 0, lt0 = 0, ltx = 0, lty = 0;
    joyEl.addEventListener('touchstart', (e) => { e.preventDefault(); const t = e.changedTouches[0]; jid = t.identifier; const r = joyEl.getBoundingClientRect(); jc = [r.left + r.width / 2, r.top + r.height / 2]; if (S.mode === 'tour') setMode('walk'); }, { passive: false });
    window.addEventListener('touchmove', (e) => {
      for (const t of e.changedTouches) {
        if (t.identifier === jid) { let dx = (t.clientX - jc[0]) / 50, dy = (t.clientY - jc[1]) / 50; const l = Math.hypot(dx, dy); if (l > 1) { dx /= l; dy /= l; } joy.x = dx; joy.y = dy; if (knob) knob.style.transform = 'translate(' + dx * 40 + 'px,' + dy * 40 + 'px)'; }
        else if (t.identifier === lid) { player.yaw -= (t.clientX - lx) * 0.005; player.pitch = clamp(player.pitch - (t.clientY - ly) * 0.005, -1.5, 1.5); lx = t.clientX; ly = t.clientY; }
      }
    }, { passive: true });
    const end = (e) => { for (const t of e.changedTouches) { if (t.identifier === jid) { jid = null; joy.x = joy.y = 0; if (knob) knob.style.transform = ''; } if (t.identifier === lid) { lid = null; if (performance.now() - lt0 < 220 && Math.hypot(t.clientX - ltx, t.clientY - lty) < 8 && (S.mode === 'walk' || S.mode === 'fly')) interact(); } } };
    window.addEventListener('touchend', end); window.addEventListener('touchcancel', end);
    canvas.addEventListener('touchstart', (e) => { if (S.mode === 'tour') { setMode('walk'); return; } const t = e.changedTouches[0]; if (lid === null) { lid = t.identifier; lx = ltx = t.clientX; ly = lty = t.clientY; lt0 = performance.now(); } }, { passive: true });
    const hold = (el, key) => { if (!el) return; el.addEventListener('touchstart', (e) => { e.preventDefault(); touchBtn[key] = true; }, { passive: false }); el.addEventListener('touchend', () => { touchBtn[key] = false; }); el.addEventListener('touchcancel', () => { touchBtn[key] = false; }); };
    hold($('tJump'), 'jump'); hold($('tDown'), 'down');
    const tap = (id, fn) => { const b = $(id); if (b) b.addEventListener('touchstart', (e) => { e.preventDefault(); if (S.mode === 'tour') setMode('walk'); fn(); }, { passive: false }); };
    tap('tUse', interact); tap('tGrab', toggleGrab); tap('tRead', toggleRead);
  })();

  /* ================= player physics, ladder push ================= */
  function ladderXAt(h) { const L = world.ladder; return L.baseX + (L.topX - L.baseX) * (h / L.railY); }
  function movePlayer(dt) {
    const p = player, L = world.ladder;
    const fwd = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0) - joy.y;
    const side = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0) + joy.x;
    let ix = side, iz = -fwd; const l = Math.hypot(ix, iz); if (l > 1) { ix /= l; iz /= l; }
    const sin = Math.sin(p.yaw), cos = Math.cos(p.yaw), wx = cos * ix + sin * iz, wz = -sin * ix + cos * iz;
    const sprint = !!(keys.ShiftLeft || keys.ShiftRight), jump = !!(keys.Space || touchBtn.jump), down = !!(keys.KeyC || touchBtn.down);
    const speed = p.fly ? (sprint ? 12 : 5) : (S.grab ? 1.5 : sprint ? 4.6 : 2.6);
    const k = 1 - Math.exp(-14 * dt);
    p.vel.x += (wx * speed - p.vel.x) * k; p.vel.z += (wz * speed - p.vel.z) * k;
    if (p.fly) p.vel.y += (((jump ? 1 : 0) - (down ? 1 : 0)) * 5 - p.vel.y) * (1 - Math.exp(-9 * dt));
    else { p.vel.y -= 26 * dt; if (jump && p.onGround) { p.vel.y = 5.2; p.onGround = false; } }
    const steps = Math.max(1, Math.ceil(dt / 0.012)), h = dt / steps;
    for (let s = 0; s < steps; s++) {
      const nx = p.pos.x + p.vel.x * h, lb = ladderBox(L.z);
      if (staticBlocked(nx, p.pos.y, p.pos.z) || (p.pos.y < 2.7 && hit(lb, nx, p.pos.y, p.pos.z) && !hit(lb, p.pos.x, p.pos.y, p.pos.z))) p.vel.x = 0; else p.pos.x = nx;
      const nz = p.pos.z + p.vel.z * h;
      if (staticBlocked(p.pos.x, p.pos.y, nz)) p.vel.z = 0;
      else if (p.pos.y < 2.7 && hit(ladderBox(L.z), p.pos.x, p.pos.y, nz) && !hit(ladderBox(L.z), p.pos.x, p.pos.y, p.pos.z)) {
        // walking into the side of the ladder pushes it along the rail
        const target = L.z + (nz - p.pos.z); const z2 = clamp(target, L.zMin, L.zMax);
        if (Math.abs(z2 - target) > 1e-6) p.vel.z = 0; else { built.setLadderZ(z2); p.pos.z = nz; }
      } else p.pos.z = nz;
      const ny = p.pos.y + p.vel.y * h;
      if (!p.fly && ny <= 0) { p.pos.y = 0; if (p.vel.y < 0) p.vel.y = 0; p.onGround = true; } else { p.pos.y = Math.max(0, ny); p.onGround = false; }
    }
    if (S.grab) {   // the ladder follows you along the wall
      const near = Math.abs(p.pos.x - (L.baseX - 0.5)) < 1.2;
      if (near) { built.setLadderZ(p.pos.z); } else { S.grab = false; toast('松开了梯子'); }
    }
  }
  function toggleGrab() {
    if (S.climb || S.sit) return;
    if (S.grab) { S.grab = false; toast('🪜 松开梯子'); return; }
    const L = world.ladder, p = player.pos;
    if (Math.abs(p.z - L.z) < L.half + 1.2 && p.x > L.baseX - 1.9 && p.x < L.topX) { S.grab = true; toast('🪜 推着梯子走 · 沿着书架左右移动 · 再按 G 松开'); }
    else toast('先走到梯子旁边');
  }
  /* ---------------------------------------------------------------- climbing */
  function nearLadderFoot() { const L = world.ladder, p = player.pos; return Math.abs(p.z - L.z) < L.half + 0.5 && p.x > L.baseX - 1.5 && p.x < L.baseX + 0.4 && p.y < 0.5; }
  function startClimb() {
    const L = world.ladder; S.climb = { h: 0.05 }; S.grab = false; player.vel.set(0, 0, 0);
    player.pos.z = L.z; player.yaw = -Math.PI / 2; player.pitch = 0.1; toast('🪜 W/S 上下 · A/D 带着梯子左右滑 · 对准书脊按 E 取书 · 空格或 E 下来');
  }
  function stopClimb() { const L = world.ladder; S.climb = null; player.pos.set(L.baseX - 0.6, 0, clamp(L.z, L.zMin, L.zMax)); player.vel.set(0, 0, 0); player.yaw = -Math.PI / 2; player.onGround = true; }
  function updateClimb(dt) {
    const L = world.ladder, c = S.climb;
    const up = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0) - joy.y, sl = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0) + joy.x;
    c.h = clamp(c.h + up * 0.95 * dt, 0, 1.78);
    if (c.h <= 0.001 && up < -0.3) { stopClimb(); return; }
    built.setLadderZ(L.z + sl * 1.1 * dt);   // facing the shelves, D slides the ladder toward +z
    player.pos.set(ladderXAt(c.h) - 0.3, c.h, L.z); player.vel.set(0, 0, 0);
    player.yaw = clamp(player.yaw, -Math.PI / 2 - 1.1, -Math.PI / 2 + 1.1);
  }

  /* ================= seats, reading ================= */
  function nearSeat(r) { const p = player.pos; let best = null, bd = r; for (const s of world.seats) { const k = Math.hypot(p.x - s.x, p.z - s.z); if (k < bd) { bd = k; best = s; } } return best; }
  const STAND = { desk: [0.85, -2.62], arm: [-1.65, 1.35] };
  function sitOn(s) {
    if (!s) return; S.sit = s; S.grab = false; player.pos.set(s.x, s.y, s.z); player.vel.set(0, 0, 0); player.yaw = s.yaw; player.pitch = -0.12;
    toast('🪑 ' + s.label + ' · ' + (s.read ? 'R 阅读桌上的书 · ' : '') + '移动即可站起来');
  }
  function standUp() { const s = S.sit; S.sit = null; S.reading = false; const c = $('card'); if (c) c.classList.remove('reading'); if (s) { const o = STAND[s.id] || [s.x, s.z + 0.7]; player.pos.set(o[0], 0.02, o[1]); player.vel.set(0, 0, 0); } }
  function toggleRead() {
    if (!S.held) { toast('先从书架上取一本书 · 对准书脊按 E'); return; }
    if (!S.sit || !S.sit.read) { const d = world.seats[0]; sitOn(d); }
    S.reading = !S.reading; const c = $('card'); if (c) c.classList.toggle('reading', S.reading);
    if (S.reading) { player.yaw = Math.PI; player.pitch = -0.85; toast('📖 阅读中 · R 合上书'); } else { player.pitch = -0.12; }
  }

  /* ================= books ================= */
  const ray = new THREE.Raycaster(); ray.far = 4.2;
  function aimBook() {
    if (!built || !built.books.mesh || !built.books.mesh.visible) return null;
    ray.setFromCamera({ x: 0, y: 0 }, camera);
    const h = ray.intersectObject(built.books.mesh, false)[0];
    return h && h.faceIndex != null ? built.books.userIdAt(h.faceIndex) : null;
  }
  function takeBook(id) {
    if (S.held && S.held !== id) putBack();
    built.books.take(id, true); S.held = id; showCard(id);
    if (window.__stBook) window.__stBook({ id, action: 'take', meta: built.books.meta(id) });
  }
  function putBack() {
    const id = S.held; if (!id) return; built.books.take(id, false); S.held = null; S.reading = false; hideCard();
    toast('📚 放回书架'); if (window.__stBook) window.__stBook({ id, action: 'put', meta: built.books.meta(id) });
  }
  function showCard(id) {
    const m = built.books.meta(id), c = $('card'); if (!c || !m) return;
    c.querySelector('.t').textContent = m.title; c.querySelector('.a').textContent = m.author || ''; c.querySelector('.x').textContent = m.text || (m.ref ? '' : '（这本书还没有摘录）');
    c.querySelector('[data-c="open"]').style.display = (m.ref && window.__stBook) ? '' : 'none';
    c.querySelector('[data-c="open"]').textContent = '打开原卡片 ›'; c.classList.add('show');
  }
  function hideCard() { const c = $('card'); if (c) c.classList.remove('show', 'reading'); }
  const cardEl = $('card');
  if (cardEl) cardEl.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return; e.stopPropagation(); const a = b.getAttribute('data-c');
    if (a === 'back') putBack(); else if (a === 'read') toggleRead(); else if (a === 'open' && S.held && window.__stBook) window.__stBook({ id: S.held, action: 'open', meta: built.books.meta(S.held) });
  });
  /* ---------------------------------------------------------------- add a book (stand-alone page) */
  // stand-alone: type a title. In My World (window.__stBooks.choices) the panel lists the board's real items to shelve instead.
  const ADD_FORM = '<div class="mc">放一本书上书架</div><input id="addT" placeholder="书名"><input id="addA" placeholder="作者（可不填）"><div style="display:flex;gap:8px"><button class="b" data-c="add" type="button">放上去</button><button class="b" data-c="x" type="button">取消</button></div>';
  function escH(x) { return String(x).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
  function drawChoices(p, q) {
    const all = window.__stBooks.choices() || [], f = String(q || '').toLowerCase(), list = all.filter((c) => !f || (c.title + ' ' + (c.list || '')).toLowerCase().indexOf(f) >= 0).slice(0, 60);
    const box = p.querySelector('.cl');
    box.innerHTML = list.length ? list.map((c) => '<button class="b" type="button" data-ref="' + escH(c.ref) + '" style="display:block;width:100%;text-align:left;margin:4px 0">📕 ' + escH(c.title) + (c.list ? '<small style="display:block;opacity:.7;font-weight:500">' + escH(c.list) + '</small>' : '') + '</button>').join('') : '<div class="mc" style="opacity:.7">没有可放的了 · 看板上的卡片都已在书架上</div>';
  }
  function toggleAdd() {
    const p = $('addp'); if (!p) return;
    if (p.classList.contains('show')) { p.classList.remove('show'); return; }
    if (window.__stBooks && window.__stBooks.choices) {
      p.innerHTML = '<div class="mc">从你的看板选一本放上书架</div><input data-q placeholder="搜索标题或清单"><div class="cl" style="max-height:46vh;overflow:auto"></div><div style="display:flex;gap:8px;margin-top:6px"><button class="b" data-c="x" type="button">完成</button></div>';
      drawChoices(p, '');
    } else if (!p.querySelector('#addT') && !p.querySelector('[id$="addT"]')) p.innerHTML = ADD_FORM;
    p.classList.add('show'); exitLock();
    setTimeout(() => { const i = p.querySelector('input'); if (i) i.focus(); }, 50);
  }
  (function () {
    const p = $('addp'); if (!p) return;
    const go = () => { const t = p.querySelector('input:not([data-q])'), a = p.querySelectorAll('input:not([data-q])')[1]; if (!t || !t.value.trim()) return; addBook(t.value.trim(), a ? a.value.trim() : ''); t.value = ''; if (a) a.value = ''; p.classList.remove('show'); };
    p.addEventListener('click', (e) => {
      e.stopPropagation(); const r = e.target.closest('[data-ref]');
      if (r && window.__stBooks && window.__stBooks.add) { const ref = r.getAttribute('data-ref'); window.__stBooks.add(ref); built.books.set(loadBooks()); toast('📚 已放上书架：' + r.textContent.replace(/^📕 /, '').split('\n')[0]); r.remove(); return; }
      const c = e.target.closest('[data-c]'); if (!c) return;
      if (c.getAttribute('data-c') === 'add') go(); else p.classList.remove('show');
    });
    p.addEventListener('input', (e) => { if (e.target.hasAttribute('data-q')) drawChoices(p, e.target.value); });
    p.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.target.hasAttribute('data-q')) go(); e.stopPropagation(); });
  })();
  const bAdd = $('bAdd'); if (bAdd) bAdd.addEventListener('click', toggleAdd);

  function interact() {
    if (S.climb) { const id = aimBook(); if (id) { takeOrBack(id); return true; } stopClimb(); return true; }
    if (S.sit) { const id = aimBook(); if (id && !S.reading) { takeOrBack(id); return true; } if (S.reading) { toggleRead(); return true; } standUp(); return true; }
    const id = aimBook(); if (id) { takeOrBack(id); return true; }
    if (nearLadderFoot()) { startClimb(); return true; }
    const s = nearSeat(1.5); if (s) { sitOn(s); return true; }
    toast('对准书脊按 E 取书 · 梯子脚下按 E 爬上去 · G 推梯子 · 靠近椅子按 E 坐下'); return false;
  }
  function takeOrBack(id) { if (S.held === id) putBack(); else takeBook(id); }

  /* ================= HUD, camera, loop ================= */
  let toastT = 0;
  function toast(msg) { const el = $('toast'); if (!el) return; el.textContent = msg; el.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('show'), 3000); }
  let tourCam = null, tourTgt = null, TOUR = null;
  function initTour() { TOUR = world.tour; tourCam = new THREE.CatmullRomCurve3(TOUR.cam.map((p) => new V3(p[0], p[1], p[2])), true, 'centripetal'); tourTgt = new THREE.CatmullRomCurve3(TOUR.tgt.map((p) => new V3(p[0], p[1], p[2])), true, 'centripetal'); }
  const _tc = new V3(), _tt = new V3();
  function updateCamera(dt) {
    if (S.mode === 'tour') {
      S.tourT = (S.tourT + dt / TOUR.dur) % 1; tourCam.getPointAt(S.tourT, _tc); tourTgt.getPointAt(S.tourT, _tt);
      camera.position.copy(_tc); camera.lookAt(_tt); const d = new V3().subVectors(_tt, _tc); player.yaw = Math.atan2(-d.x, -d.z); player.pitch = Math.atan2(d.y, Math.hypot(d.x, d.z));
    } else if (S.climb) {
      updateClimb(dt); if (S.climb) { camera.position.set(player.pos.x, player.pos.y + 1.5, player.pos.z); camera.rotation.set(player.pitch, player.yaw, 0); }
    } else if (S.sit) {
      const mv = keys.KeyW || keys.KeyA || keys.KeyS || keys.KeyD || keys.ArrowUp || keys.ArrowDown || keys.ArrowLeft || keys.ArrowRight || keys.Space || Math.hypot(joy.x, joy.y) > 0.3 || touchBtn.jump;
      if (mv) standUp(); else {
        const s = S.sit, rd = S.reading ? 1 : 0;
        camera.position.set(s.x, s.y + s.eye + rd * 0.06, s.z + rd * 0.28 * (s.yaw === Math.PI ? 1 : 0));
        camera.rotation.set(player.pitch, player.yaw, 0); return camera.updateProjectionMatrix();
      }
      movePlayer(dt); camera.position.set(player.pos.x, player.pos.y + EYE, player.pos.z); camera.rotation.set(player.pitch, player.yaw, 0);
    } else {
      movePlayer(dt); camera.position.set(player.pos.x, player.pos.y + EYE, player.pos.z); camera.rotation.set(player.pitch, player.yaw, 0);
    }
    camera.updateProjectionMatrix();
  }
  let last = performance.now();
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000); last = now; S.elapsed += dt;
    updateCamera(dt); if (built && built.update) built.update(dt);
    S.hudT -= dt;
    if (S.hudT <= 0) { S.hudT = 0.2; const cp = camera.position, co = $('coords'); if (co) co.textContent = 'XYZ ' + cp.x.toFixed(1) + ' ' + cp.y.toFixed(1) + ' ' + cp.z.toFixed(1); const id = (S.mode !== 'tour') ? aimBook() : null; const am = $('aim'); if (am) { const m = id && built.books.meta(id); am.textContent = m ? '📕 ' + m.title + (m.author ? ' · ' + m.author : '') : ''; } }
    renderer.render(scene, camera);
  }

  /* ================= boot ================= */
  const setLoad = (msg, p) => { const lm = $('loadMsg'); if (lm) lm.textContent = msg; const bar = $('bar'); if (bar && bar.firstElementChild) bar.firstElementChild.style.width = Math.round(p * 100) + '%'; };
  async function boot() {
    try {
      setLoad('量好房间 · 8 × 6.4 米…', 0.1); await nextFrame();
      world = window.__stWorld || VW.create(); window.__stWorld = world;
      player.pos.set(world.spawn.x, 0, world.spawn.z); player.yaw = world.spawn.yaw;
      setLoad('刨光深色橡木书架 · 铺地毯…', 0.35); await nextFrame();
      setLoad('把你的书摆上书架…', 0.6); await nextFrame();
      built = StudyScene.build(world, THREE, window.StudyTex, { books: loadBooks() });
      scene.add(built.group); colliders = built.colliders; initTour();
      window.__study = {
        world, player, scene, camera, S, built, setMode, teleport, interact, sitOn, toggleGrab, toggleRead, addBook,
        take: (id) => { takeBook(id); return id; }, putBack, aim: aimBook,
        reload: () => { if (S.held) { built.books.take(S.held, false); S.held = null; hideCard(); } built.books.set(loadBooks()); },
        stats: function () {
          let tris = 0, geos = 0;
          scene.traverse((o) => { if (!o.isMesh || !o.visible) return; const g = o.geometry; tris += (g.index ? g.index.count : g.attributes.position.count) / 3 * (o.isInstancedMesh ? o.count : 1); geos++; });
          const r = renderer.info.render;
          return { drawCalls: r.calls, renderedTris: r.triangles, sceneTris: Math.round(tris), meshes: geos, books: built.books.count, userBooks: built.books.userCount, textures: renderer.info.memory.textures, geometries: renderer.info.memory.geometries, shadows: renderer.shadowMap.enabled };
        }
      };
      setLoad('完成', 1); applyURL(); setMode(S.mode);
      const loading = $('loading'); if (loading) loading.classList.add('done');
      requestAnimationFrame(frame);
    } catch (err) { console.error(err); setLoad('加载失败：' + (err && err.message ? err.message : err), 1); }
  }
  function applyURL() {
    const m = qs.get('mode'); if (m && ['tour', 'walk', 'fly'].includes(m)) S.mode = m;
    if (m === 'walk' || m === 'fly') { player.pos.set(world.spawn.x, 0, world.spawn.z); player.yaw = world.spawn.yaw; }
    if (qs.get('hud') === '0') { const h = $('hud'); if (h) h.style.display = 'none'; }
  }
  if (EMBED && window.__stDeferBoot) window.__stBoot = boot; else boot();
})();
