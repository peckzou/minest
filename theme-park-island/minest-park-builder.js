/* Minest · 造乐园 — building the park itself (2026-11-24).
 * Ground brushes: 小路, 广场砖, 水道, 花圃, 沙地 and an eraser, laid in 2 m tiles. Pick a brush and walk: the tiles are
 * laid under your feet as you go (width 1 or 3); or, with the pointer free, drag on the ground to paint. Tiles are kept
 * in the home store ('sh:tp:tiles': "gx,gz" → type) beside the placed things, so the park you laid out comes back.
 * A new land gets its name from a 园区牌 (a sign, placed like any model). The bar's ↶ takes back the last stroke. */
(function (root) {
  'use strict';
  var KEY = 'sh:tp:tiles', CELL = 2, S = root.MinestHomeStore;
  var TYPES = {
    p: { name: '小路', icon: '🟫', color: 0xd9cbb0, h: 0.10 }, s: { name: '广场砖', icon: '🧱', color: 0xc97b5a, h: 0.10 },
    w: { name: '水道', icon: '🟦', color: 0x3aa6d8, h: 0.06 }, f: { name: '花圃', icon: '🌷', color: 0x5fae5a, h: 0.16 }, d: { name: '沙地', icon: '🟨', color: 0xe8d39a, h: 0.08 }
  };
  var API = null, T = null, tiles = {}, meshes = {}, flowers = null, brush = null, width = 1, stroke = null, undo = [], dirty = false, saveT = 0, bar = null, down = false, clock = 0;
  function sget(k) { try { return S ? S.get(k) : JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } }
  function sset(k, v) { try { if (S) S.set(k, v); else localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  function rebuild() {
    dirty = false;
    var by = {}, m4 = new T.Matrix4(), fl = [];
    Object.keys(tiles).forEach(function (k) { (by[tiles[k]] = by[tiles[k]] || []).push(k); });
    Object.keys(TYPES).forEach(function (t) {
      var list = by[t] || [], im = meshes[t];
      if (!im || im.userData.cap < list.length) {
        if (im) { API.scene.remove(im); im.geometry.dispose(); }
        var cap = Math.max(256, Math.ceil(list.length * 1.5));
        im = new T.InstancedMesh(new T.BoxGeometry(CELL, TYPES[t].h, CELL), t === 'w' ? new T.MeshLambertMaterial({ color: TYPES[t].color, transparent: true, opacity: 0.86 }) : new T.MeshLambertMaterial({ color: TYPES[t].color }), cap);
        im.userData.cap = cap; im.frustumCulled = false; API.scene.add(im); meshes[t] = im;
      }
      list.forEach(function (k, i) {
        var q = k.split(','), x = +q[0] * CELL + CELL / 2, z = +q[1] * CELL + CELL / 2, y = API.groundY(x, z, 62);
        m4.makeTranslation(x, y + TYPES[t].h / 2 + (t === 'w' ? -0.01 : 0.01), z); im.setMatrixAt(i, m4);
        if (t === 'f') for (var j = 0; j < 4; j++) fl.push([x - 0.5 + (j % 2), y + 0.34, z - 0.5 + (j > 1 ? 1 : 0), (+q[0] * 7 + +q[1] * 13 + j) % 5]);
      });
      im.count = list.length; im.instanceMatrix.needsUpdate = true;
    });
    if (flowers) { API.scene.remove(flowers); flowers.geometry.dispose(); flowers = null; }
    if (fl.length) {
      flowers = new T.InstancedMesh(new T.SphereGeometry(0.2, 6, 5), new T.MeshLambertMaterial({ color: 0xffffff }), fl.length); flowers.frustumCulled = false;
      var cols = [0xf472b6, 0xfbbf24, 0xf87171, 0xc084fc, 0xffffff], c = new T.Color();
      fl.forEach(function (f, i) { m4.makeTranslation(f[0], f[1], f[2]); flowers.setMatrixAt(i, m4); flowers.setColorAt(i, c.setHex(cols[f[3]])); });
      API.scene.add(flowers);
    }
  }
  function save() { clearTimeout(saveT); saveT = setTimeout(function () { sset(KEY, tiles); }, 500); }
  function paint(x, z) {
    var gx = Math.floor(x / CELL), gz = Math.floor(z / CELL), r = (width - 1) / 2, ch = false;
    for (var dx = -r; dx <= r; dx++) for (var dz = -r; dz <= r; dz++) {
      var k = (gx + dx) + ',' + (gz + dz), was = tiles[k] || null, now = brush === 'x' ? null : brush;
      if (was === now) continue;
      if (stroke && !(k in stroke)) stroke[k] = was;
      if (now) tiles[k] = now; else delete tiles[k]; ch = true;
    }
    if (ch) { dirty = true; save(); }
  }
  function endStroke() { if (stroke && Object.keys(stroke).length) { undo.push(stroke); if (undo.length > 40) undo.shift(); } stroke = null; renderBar(); }
  function undoOnce() {
    var s = undo.pop(); if (!s) return API.toast('没有可以撤销的了');
    Object.keys(s).forEach(function (k) { if (s[k]) tiles[k] = s[k]; else delete tiles[k]; }); dirty = true; save(); renderBar();
  }
  function groundAt(cx, cy) {
    var r = API.canvas.getBoundingClientRect(), ray = new T.Raycaster(); ray.setFromCamera(new T.Vector2(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1), API.camera);
    var y = API.groundY(API.player.pos.x, API.player.pos.z, 62), d = ray.ray.direction, o = ray.ray.origin; if (d.y > -0.02) return null;
    var t = (y - o.y) / d.y; return t > 0 && t < 400 ? { x: o.x + d.x * t, z: o.z + d.z * t } : null;
  }

  /* ---------------------------------------------------------------- the bar */
  function setBrush(b) { brush = b; stroke = null; renderBar(); if (b) API.toast(b === 'x' ? '🧽 走过或拖过的地方会擦掉' : TYPES[b].icon + ' 边走边铺「' + TYPES[b].name + '」· 或松开鼠标后在地上拖着画'); }
  function renderBar() {
    if (!bar) { bar = document.createElement('div'); bar.id = 'mn-pb'; document.body.appendChild(bar); ['mousedown', 'touchstart', 'click'].forEach(function (ev) { bar.addEventListener(ev, function (e) { e.stopPropagation(); }, ev === 'touchstart' ? { passive: true } : false); }); }
    bar.style.display = brush ? 'flex' : 'none'; if (!brush) return;
    bar.innerHTML = Object.keys(TYPES).map(function (t) { return '<button type="button" data-b="' + t + '" class="' + (brush === t ? 'on' : '') + '" title="' + TYPES[t].name + '">' + TYPES[t].icon + '</button>'; }).join('') +
      '<button type="button" data-b="x" class="' + (brush === 'x' ? 'on' : '') + '" title="橡皮">🧽</button><i></i>' +
      '<button type="button" data-w title="笔刷宽度">' + (width === 1 ? '▫️' : '⬜') + '</button>' +
      '<button type="button" data-u title="撤销"' + (undo.length ? '' : ' disabled') + '>↶</button>' +
      '<button type="button" data-sign title="立一块园区牌，给新园区起名">🪧</button><button type="button" data-tour title="把我放下的作品用小路连起来，并沿路游览">🗺</button><button type="button" data-done class="done" title="完成">✅</button>';
    [].forEach.call(bar.querySelectorAll('[data-b]'), function (b) { b.onclick = function () { setBrush(b.dataset.b); }; });
    bar.querySelector('[data-w]').onclick = function () { width = width === 1 ? 3 : 1; renderBar(); };
    bar.querySelector('[data-u]').onclick = undoOnce;
    bar.querySelector('[data-done]').onclick = function () { setBrush(null); };
    bar.querySelector('[data-tour]').onclick = function () { startTour(true); };
    bar.querySelector('[data-sign]').onclick = function () {
      var name = (root.prompt('给这个新园区起个名字：', '我的梦想园区') || '').trim().slice(0, 16); if (!name || !root.MinestImagineerPark) return;
      setBrush(null); root.MinestImagineerPark.startPlacement({ type: 'model', kind: 'sign', title: name, icon: '🪧', color: '#fbbf24', hello: '欢迎来到「' + name + '」！', scale: 1.6 });
    };
  }
  var css = document.createElement('style');
  css.textContent = '#mn-pb{display:none;position:fixed;left:50%;top:calc(env(safe-area-inset-top,0px) + 62px);transform:translateX(-50%);z-index:70;gap:6px;align-items:center;padding:7px 10px;border-radius:999px;background:rgba(15,23,42,.92);border:1.5px solid rgba(251,191,36,.7);box-shadow:0 8px 26px rgba(0,0,0,.45)}' +
    '#mn-pb button{width:42px;height:42px;border-radius:50%;border:1.5px solid rgba(255,255,255,.22);background:rgba(255,255,255,.08);font-size:20px;cursor:pointer;color:#fff}' +
    '#mn-pb button.on{border-color:#fbbf24;background:rgba(251,191,36,.28);transform:scale(1.1)}#mn-pb button.done{background:linear-gradient(135deg,#fbbf24,#f97316)}#mn-pb button:disabled{opacity:.35}#mn-pb i{width:1px;height:26px;background:rgba(255,255,255,.25)}' +
    '#mn-pb-boat{display:none;position:fixed;left:50%;bottom:calc(env(safe-area-inset-bottom,0px) + 186px);transform:translateX(-50%);z-index:60;padding:12px 22px;border-radius:999px;border:1.5px solid rgba(255,255,255,.4);background:linear-gradient(135deg,#0ea5e9,#2563eb);color:#fff;font:800 15px/1 -apple-system,BlinkMacSystemFont,"PingFang SC",sans-serif;cursor:pointer;box-shadow:0 8px 26px rgba(0,0,0,.45)}' +
    '#mn-pb-btn{box-shadow:0 2px 10px rgba(0,0,0,.35);padding:5px 12px;border-radius:999px;background:linear-gradient(135deg,#16a34a,#84cc16);color:#fff;font-weight:900;font-size:11.5px;border:none;cursor:pointer}';
  document.head.appendChild(css);
  function addEntry() {
    var row = document.getElementById('mn-pav-btns');
    if (row && !document.getElementById('mn-pb-btn')) { var b = document.createElement('button'); b.type = 'button'; b.id = 'mn-pb-btn'; b.textContent = '🛠 造乐园'; b.onclick = function (e) { e.stopPropagation(); setBrush(brush ? null : 'p'); }; row.appendChild(b); }
  }

  /* ---------------------------------------------------------------- the boat: a canal you laid is a ride */
  var ride = null, boat = null, boatBtn = null;
  function waterNear(x, z, r) { var gx = Math.floor(x / CELL), gz = Math.floor(z / CELL), best = null, bd = r; for (var dx = -2; dx <= 2; dx++) for (var dz = -2; dz <= 2; dz++) { var k = (gx + dx) + ',' + (gz + dz); if (tiles[k] === 'w') { var d = Math.hypot((gx + dx + 0.5) * CELL - x, (gz + dz + 0.5) * CELL - z); if (d < bd) { bd = d; best = k; } } } return best; }
  function canalFrom(k0) {   /* the cells of the canal in order, from its nearer end, one neighbour after another */
    var nb = function (k) { var q = k.split(','), x = +q[0], z = +q[1]; return [[x + 1, z], [x - 1, z], [x, z + 1], [x, z - 1]].map(function (c) { return c[0] + ',' + c[1]; }).filter(function (n) { return tiles[n] === 'w'; }); };
    var seen = {}, far = k0, queue = [k0]; seen[k0] = 1;
    while (queue.length) { var c = queue.shift(); far = c; nb(c).forEach(function (n) { if (!seen[n]) { seen[n] = 1; queue.push(n); } }); }   /* the far end… */
    var prev = {}, q2 = [far], last = far; seen = {}; seen[far] = 1;
    while (q2.length) { var c2 = q2.shift(); last = c2; nb(c2).forEach(function (n) { if (!seen[n]) { seen[n] = 1; prev[n] = c2; q2.push(n); } }); }   /* …and the longest way from it */
    var path = []; for (var k = last; k; k = prev[k]) path.push(k);
    var a = path[0].split(','), P = API.player.pos; if (Math.hypot((+a[0] + 0.5) * CELL - P.x, (+a[1] + 0.5) * CELL - P.z) > Math.hypot((+path[path.length - 1].split(',')[0] + 0.5) * CELL - P.x, (+path[path.length - 1].split(',')[1] + 0.5) * CELL - P.z)) path.reverse();
    return path.map(function (k) { var q = k.split(','); return [(+q[0] + 0.5) * CELL, (+q[1] + 0.5) * CELL]; });
  }
  function board() {
    var k = waterNear(API.player.pos.x, API.player.pos.z, 4); if (!k || ride) return;
    var path = canalFrom(k); if (path.length < 3) return API.toast('水道再挖长一点，小船才开得起来');
    setBrush(null);
    if (!boat && root.DWModels) { try { boat = root.DWModels.build({ kind: 'boat', color: '#8a5a35' }); boat.scale.setScalar(1.15); API.scene.add(boat); } catch (e) {} }
    ride = { path: path, i: 0, t: 0 }; API.toast('⛵ 开船了！沿着你挖的水道游览');
  }
  function rideTick(dt) {
    var r = ride, P = API.player, a = r.path[r.i], b = r.path[r.i + 1];
    if (!b || API.state.activeRide || API.state.ui) { ride = null; if (boat) boat.visible = false; if (b === undefined) API.toast('⛵ 到站了'); return; }
    r.t += dt * 3.2 / Math.hypot(b[0] - a[0], b[1] - a[1]); if (r.t >= 1) { r.t = 0; r.i++; return; }
    var x = a[0] + (b[0] - a[0]) * r.t, z = a[1] + (b[1] - a[1]) * r.t, y = API.groundY(x, z, 62);
    P.pos.x = x; P.pos.z = z; if (P.vel) { P.vel.x = 0; P.vel.z = 0; }
    if (boat) { boat.visible = true; boat.position.set(x, y + 0.05 + Math.sin(clock * 1.7) * 0.03, z); boat.rotation.y = Math.atan2(b[0] - a[0], b[1] - a[1]); }
  }
  /* ---------------------------------------------------------------- the tour: your own things, one after another */
  var tour = null;
  function startTour(lay) {
    var items = (root.MinestImagineerPark ? root.MinestImagineerPark.placed() : []).filter(function (it) { return it && isFinite(it.x); });
    if (items.length < 2) return API.toast('先在乐园里放下两件以上的作品或模型，再把它们连成路线');
    setBrush(null);
    if (lay) {   /* a path from each to the next, laid as one stroke (↶ takes it back) */
      brush = 'p'; stroke = {}; var w0 = width; width = 1;
      for (var i = 0; i < items.length - 1; i++) { var A = items[i], B = items[i + 1], n = Math.ceil(Math.hypot(B.x - A.x, B.z - A.z)); for (var j = 0; j <= n; j++) paint(A.x + (B.x - A.x) * j / n, A.z + (B.z - A.z) * j / n); }
      width = w0; endStroke(); brush = null; renderBar();
    }
    tour = { items: items, i: 0, wait: 0 }; API.toast('🚶 游览我的乐园 · 共 ' + items.length + ' 站（按任意方向键可以随时停下）');
  }
  function tourTick(dt) {
    var t = tour, P = API.player, it = t.items[t.i], k = API.state; if (!it || k.activeRide || k.ui) { tour = null; return; }
    var stand = it.full ? 19 : 6, dx = it.x - P.pos.x, dz = it.z - P.pos.z, d = Math.hypot(dx, dz);
    P.yaw += Math.atan2(Math.sin(Math.atan2(-dx, -dz) - P.yaw), Math.cos(Math.atan2(-dx, -dz) - P.yaw)) * Math.min(1, dt * 3);
    if (d > stand) { var sp = Math.min(d - stand, 7 * dt); P.pos.x += dx / d * sp; P.pos.z += dz / d * sp; if (P.vel) { P.vel.x = 0; P.vel.z = 0; } t.wait = 0; return; }
    if (!t.wait) API.toast('📍 第 ' + (t.i + 1) + ' 站 · ' + (it.title || ''));
    t.wait += dt; if (t.wait > (it.full ? 14 : 5)) { t.i++; t.wait = 0; if (t.i >= t.items.length) { tour = null; API.toast('🎉 游览完了你的乐园！'); } }
  }
  root.addEventListener('keydown', function (e) { if (tour && /^(Key[WASD]|Arrow)/.test(e.code)) { tour = null; if (API) API.toast('游览停下了'); } });

  function tick(now) {
    requestAnimationFrame(tick);
    var dt = Math.min(0.05, (now - (tick.last || now)) / 1000); tick.last = now; clock += dt;
    if (!API || document.hidden) return;
    if (brush && !API.state.ui && !API.state.activeRide && API.state.mode !== 'tour' && !API.player.fly) {   /* walking lays the tiles */
      if (!stroke) stroke = {};
      paint(API.player.pos.x, API.player.pos.z);
      var v = API.player.vel; if (v && Math.hypot(v.x, v.z) < 0.3 && Object.keys(stroke).length && !down) endStroke();
    }
    if (ride) rideTick(dt); else if (tour) tourTick(dt);
    if (!boatBtn) { boatBtn = document.createElement('button'); boatBtn.type = 'button'; boatBtn.id = 'mn-pb-boat'; boatBtn.textContent = '⛵ 上船'; boatBtn.onclick = function (e) { e.stopPropagation(); board(); }; document.body.appendChild(boatBtn); }
    boatBtn.style.display = !ride && !brush && !API.state.ui && !API.state.activeRide && waterNear(API.player.pos.x, API.player.pos.z, 3.2) ? 'block' : 'none';
    if (dirty) rebuild();
    if (meshes.w) meshes.w.material.opacity = 0.8 + Math.sin(clock * 2) * 0.08;
  }
  function attach(api) {
    if (API || !api) return; API = api; T = api.THREE;
    var t0 = sget(KEY); tiles = t0 && typeof t0 === 'object' && !Array.isArray(t0) ? t0 : {}; rebuild();
    var cv = API.canvas, at = function (e) { var q = e.touches ? e.touches[0] : e; return q ? groundAt(q.clientX, q.clientY) : null; };
    var start = function (e) { if (!brush || document.pointerLockElement) return; var g = at(e); if (!g) return; down = true; stroke = stroke || {}; paint(g.x, g.z); e.stopPropagation(); if (e.cancelable) e.preventDefault(); };
    var move = function (e) { if (!down) return; var g = at(e); if (g) paint(g.x, g.z); e.stopPropagation(); if (e.cancelable) e.preventDefault(); };
    var end = function () { if (down) { down = false; endStroke(); } };
    cv.addEventListener('mousedown', start, true); cv.addEventListener('mousemove', move, true); root.addEventListener('mouseup', end);
    cv.addEventListener('click', function (e) { if (brush && !document.pointerLockElement && e.isTrusted && e.detail && cv.dataset.mnPainted) { e.stopPropagation(); } }, true);
    cv.addEventListener('touchstart', start, { capture: true, passive: false }); cv.addEventListener('touchmove', move, { capture: true, passive: false }); root.addEventListener('touchend', end);
    if (S && S.onChange) S.onChange(function () { var r = sget(KEY); if (r && !saveT && JSON.stringify(r) !== JSON.stringify(tiles)) { tiles = r; dirty = true; } });
    addEntry(); new MutationObserver(addEntry).observe(document.body, { childList: true, subtree: true });
    requestAnimationFrame(tick);
  }
  if (root.TPParkAPI) attach(root.TPParkAPI); else root.addEventListener('tp:park-ready', function (e) { attach(e.detail || root.TPParkAPI); });
  root.MinestParkBuilder = { board: board, tour: startTour, riding: function () { return !!ride; }, touring: function () { return tour ? tour.i : -1; }, setBrush: setBrush, paint: function (x, z) { stroke = stroke || {}; paint(x, z); }, endStroke: endStroke, undo: undoOnce, tiles: function () { return tiles; }, types: TYPES };
})(window);
