/* Clun 室内 2.0 · 可以摆的物件（2026-11-22）。
   和 Spatial Home 同一套物件：功能物件（打字机、布告栏、日程本……，点一下进 Minest 打开它）和家具（书桌、钢琴、管风琴……，
   模型来自 ../js/furniture.js 等，不另做）。每个房间一份默认（'sh:def:clun:<房间>'），挪过的位置是你的摆放
   （'bp:home:clun:<房间>'），都放在 home-store.js 的同步存储里 —— Minest 自己的云同步通道。
   · 1.0 和 2.0 原来的家具不动：这些物件摆在它们旁边。人可以穿过它们（1.0 的碰撞表只在开头收一次，不去改它）。
   · 进屋走动时，右上角「🪑 摆放」：打开默认物件面板（同 Spatial Home 的那一个），点房间里的物件拖动，转向、移除，✓ 放好。
   · 模型脚本只在有东西要摆、或打开面板时才载入，开屏不多等。
   这个文件要放在 1.0 的 app.js 前面：它记下 app.js 建的画布和镜头（点选、拖动要用），不改 app.js。 */
(function () {
  'use strict';
  var C = window.Clun, V2 = C && C.V2; if (!V2 || !window.THREE) return;
  var THREE = window.THREE, PI = Math.PI;
  /* —— 1.0 的 app.js 建的渲染器：记下它画屏幕时用的场景和镜头 —— */
  var VIEW = { renderer: null, scene: null, camera: null };
  var R0 = THREE.WebGLRenderer;
  THREE.WebGLRenderer = function (p) {
    var r = new R0(p), rd = r.render;
    r.render = function (s, c) { if (!r.getRenderTarget || !r.getRenderTarget()) { if (!VIEW.renderer || VIEW.renderer === r) { VIEW.renderer = r; VIEW.scene = s; VIEW.camera = c; } } return rd.apply(r, arguments); };
    return r;
  };
  THREE.WebGLRenderer.prototype = R0.prototype;

  var HS = function () { return window.MinestHomeStore; }, DF = function () { return window.SpatialHomeDefaults; };
  var LK = 'bp:home:clun:', FN = ['typewriter', 'planner', 'board', 'album', 'projector', 'ornament'];
  var FN_NAME = { typewriter: ['打字机', '⌨️'], planner: ['日程本', '📘'], board: ['布告栏', '📌'], album: ['收藏册', '📔'], projector: ['全息投影仪', '🔮'], ornament: ['魔法摆件', '🌀'] };
  function r3(n) { return Math.round((+n || 0) * 1000) / 1000; }

  /* —— 模型脚本（按需） —— */
  var loaded = {}, BASE = ['../js/voxel.js', '../js/furniture.js', '../js/objects.js'], CHURCH = ['../js/room.js', '../rooms/church-verses.js', '../rooms/church-art.js', '../rooms/env-church.js'];
  function script(src) { if (loaded[src]) return loaded[src]; return (loaded[src] = new Promise(function (ok) { var s = document.createElement('script'); s.src = src + '?v=1'; s.async = false; s.onload = ok; s.onerror = function () { ok(); }; document.head.appendChild(s); })); }
  function chain(list) { return list.reduce(function (p, s) { return p.then(function () { return script(s); }); }, Promise.resolve()); }
  function need(kinds) {
    var p = chain(BASE);
    if (kinds.indexOf('church-organ') >= 0) p = p.then(function () { return chain(CHURCH); });
    return p;
  }
  function known(k) { return !!(window.SpatialFurniture && typeof window.SpatialFurniture[k] === 'function') || k === 'church-organ' || /^(pedestal|wallshelf|vitrine)$/.test(k); }

  /* —— 房间：中心、地面标高；人站在哪、朝哪（工程坐标） —— */
  function X() { return C._explore; }
  function exploring() { var x = X(); return !!(x && x.st && x.st.last && performance.now() / 1000 - x.st.last < 2.5); }   /* 载入模型时会卡一下：2.5 秒内都算还在屋里 */
  function centre(id) {
    var r = V2.room(id); if (!r) return [0, 0, 0];
    var sx = 0, sy = 0; r.poly.forEach(function (q) { sx += q[0]; sy += q[1]; });
    return [r3(sx / r.poly.length), r3(sy / r.poly.length), r3(r.z)];
  }
  function me() {                                                              /* 人脚下的位置和面前 1.2 米处 */
    var x = X(); if (!x || !x.house) return null;
    var h = x.house, feet = h.worldToLocal(new THREE.Vector3(x.st.pos.x, x.st.floorY, x.st.pos.z));
    var fw = new THREE.Vector3(-Math.sin(x.st.yaw), 0, -Math.cos(x.st.yaw)), a = h.worldToLocal(x.st.pos.clone()), b = h.worldToLocal(x.st.pos.clone().add(fw));
    var d = new THREE.Vector2(b.x - a.x, b.y - a.y).normalize();
    var room = V2.roomAt(feet.x, feet.y, feet.z);
    return { room: room, feet: feet, front: [r3(feet.x + d.x * 1.2), r3(feet.y + d.y * 1.2), r3(room ? room.z : feet.z)], face: Math.atan2(-d.x, d.y) };   /* 模型正面（+Z）转到工程坐标是 -Y：转 face 之后朝着人 */
  }

  /* —— 摆放：每个房间 { <功能物件>: { p, ry, stashed }, extras: [ { uid, kind, title, p, ry } ], defAt } —— */
  var LC = {}, LJ = {};
  function layoutOf(id) {
    if (LC[id]) return LC[id];
    var s = HS(), v = s ? s.get(LK + id) : null; if (!v || typeof v !== 'object') v = {}; LJ[id] = JSON.stringify(v);
    var D = DF(), n = D ? D.apply('clun:' + id, v, { known: known, spot: function () { return centre(id); }, spotFn: function () { return centre(id); } }) : null;
    if (n) { v = n; save(id, v); }
    return (LC[id] = v);
  }
  function save(id, v) { LC[id] = v; var js = JSON.stringify(v), s = HS(); if (s && LJ[id] !== js) { LJ[id] = js; s.set(LK + id, v); } }
  function stateOf(id) {                                                       /* 现在的样子 → 默认的写法（同 SpatialHomeDefaults.capture） */
    var L = layoutOf(id), fn = {}, ex = [];
    FN.forEach(function (f) { var l = L[f]; fn[f] = l && l.p && !l.stashed ? { on: 1, p: l.p.slice(), ry: l.ry || 0 } : { on: 0 }; });
    (L.extras || []).forEach(function (e) { if (!DF().isContent(e)) ex.push({ uid: e.uid, kind: e.kind, title: e.title, p: e.p, ry: e.ry || 0 }); });
    return { fn: fn, extras: ex };
  }

  /* —— 场景里的物件 —— */
  var root = new THREE.Group(); root.name = 'clun2-things'; root.matrixAutoUpdate = false;
  var items = [], building = false, wantBuild = false;
  function clear() { items.forEach(function (it) { root.remove(it.g); it.g.traverse(function (m) { if (m.geometry) m.geometry.dispose(); }); }); items = []; }
  function model(spec) {
    var T = THREE, g = null, hb = [0.6, 0.8, 0.6];
    if (spec.fn) { var mk = window.SpatialObjects && window.SpatialObjects.make && window.SpatialObjects.make[spec.fn]; if (mk) { var o = mk(); try { o.set(0); } catch (e) {} g = o.group; var b = new T.Box3().setFromObject(g), sz = b.getSize(new T.Vector3()); hb = [sz.x, sz.y, sz.z]; } }
    else if (window.SpatialFurniture && window.SpatialFurniture[spec.kind]) { var m = window.SpatialFurniture[spec.kind](T); g = m.group; hb = m.hb || hb; }
    if (!g) return null;
    var y = new T.Group(); y.add(g); y.rotation.x = PI / 2;                       /* 模型 Y 朝上 → 工程坐标 Z 朝上 */
    var hit = new T.Mesh(new T.BoxGeometry(Math.max(0.08, hb[0]), Math.max(0.08, hb[1]), Math.max(0.08, hb[2])), new T.MeshBasicMaterial({ visible: false, side: T.DoubleSide }));   /* 双面：镜头在它里面时也点得到 */
    hit.position.y = hb[1] / 2; y.add(hit);
    var outer = new T.Group(); outer.add(y); return { g: outer, hit: hit };
  }
  function wanted() {
    var out = [];
    V2.rooms.forEach(function (r) {
      var L = layoutOf(r.id);
      FN.forEach(function (f) { var l = L[f]; if (l && l.p && !l.stashed) out.push({ room: r.id, fn: f, p: l.p, ry: l.ry || 0, title: FN_NAME[f][0] }); });
      (L.extras || []).forEach(function (e) { if (e && e.kind && e.p) out.push({ room: r.id, kind: e.kind, uid: e.uid, p: e.p, ry: e.ry || 0, title: e.title }); });
    });
    return out;
  }
  function build() {
    if (building) { wantBuild = true; return; }
    if (drag) { wantBuild = true; return; }
    var list = wanted(); if (!list.length && !items.length) return;
    building = true;
    need(list.map(function (q) { return q.kind || ''; })).then(function () {
      building = false; clear();
      list.forEach(function (q) {
        var m = model(q); if (!m) return;
        m.g.position.set(q.p[0], q.p[1], q.p[2]); m.g.rotation.z = q.ry;
        var it = { q: q, g: m.g, hit: m.hit }; m.hit.userData.it = it; root.add(m.g); items.push(it);
      });
      if (sel) { var s2 = items.filter(function (it) { return same(it.q, sel.q); })[0]; sel = s2 || null; mark(); }
      if (wantBuild) { wantBuild = false; build(); }
    });
  }
  function same(a, b) { return a.room === b.room && (a.fn ? a.fn === b.fn : a.uid === b.uid); }
  function writeBack(it) {                                                       /* 一件物件挪好了：写回它那个房间的摆放 */
    var q = it.q, L = layoutOf(q.room), p = [r3(it.g.position.x), r3(it.g.position.y), r3(it.g.position.z)], ry = r3(it.g.rotation.z);
    if (q.fn) L[q.fn] = { p: p, ry: ry };
    else (L.extras || []).forEach(function (e) { if (e.uid === q.uid) { e.p = p; e.ry = ry; } });
    q.p = p; q.ry = ry; save(q.room, L);
  }
  /* 跨房间拖：落在另一个房间里，就归那个房间 */
  function rehome(it) {
    var p = it.g.position, r = V2.roomAt(p.x, p.y, p.z + 0.05); if (!r || r.id === it.q.room) return;
    var q = it.q, A = layoutOf(q.room), B = layoutOf(r.id);
    if (q.fn) { A[q.fn] = { stashed: true }; B[q.fn] = { p: [p.x, p.y, r.z], ry: it.g.rotation.z }; }
    else { var e = (A.extras || []).filter(function (x) { return x.uid === q.uid; })[0]; A.extras = (A.extras || []).filter(function (x) { return x.uid !== q.uid; }); if (e) { B.extras = (B.extras || []).concat([e]); } }
    save(q.room, A); save(r.id, B); q.room = r.id;
  }

  /* —— 摆放模式：点选、拖动、转向、移除 —— */
  var editing = false, sel = null, drag = null, ray = new THREE.Raycaster();
  var css = document.createElement('style');
  css.textContent = '#c2o-btn{position:fixed;z-index:40;right:max(14px,env(safe-area-inset-right));bottom:calc(max(12px,env(safe-area-inset-bottom)) + 58px);padding:7px 12px;border-radius:999px;border:1px solid rgba(255,255,255,.35);background:rgba(30,26,20,.6);color:#fff7e6;font:600 13px/1.2 -apple-system,"PingFang SC",sans-serif;-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);cursor:pointer}' +
    '#c2o-btn[hidden],#c2o-bar[hidden]{display:none}#c2o-btn.on{background:#b8553f;border-color:#b8553f}' +
    '#c2o-bar{position:fixed;z-index:41;left:50%;transform:translateX(-50%);bottom:calc(max(14px,env(safe-area-inset-bottom)) + 86px);display:flex;gap:6px;align-items:center;padding:7px 9px;border-radius:14px;background:rgba(253,251,247,.95);color:#2a2622;box-shadow:0 8px 26px rgba(0,0,0,.22);font:13px -apple-system,"PingFang SC",sans-serif;max-width:calc(100vw - 24px)}' +
    '#c2o-bar b{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:34vw}#c2o-bar button{font:inherit;border:1px solid rgba(60,50,40,.18);background:#fff;color:inherit;border-radius:9px;padding:5px 9px;cursor:pointer}#c2o-bar button.pri{background:#b8553f;border-color:#b8553f;color:#fff}#c2o-bar span{color:#8a8178;font-size:12px}';
  document.head.appendChild(css);
  var btn = document.createElement('button'); btn.id = 'c2o-btn'; btn.type = 'button'; btn.textContent = '🪑 摆放'; btn.hidden = true; btn.title = '这个房间的默认物件 · 挪动物件';
  var bar = document.createElement('div'); bar.id = 'c2o-bar'; bar.hidden = true;
  bar.innerHTML = '<b></b><span>拖动挪位置</span><button data-a="rot15">↻15°</button><button data-a="rot">⟲90°</button><button data-a="del">移除</button><button data-a="ok" class="pri">✓</button>';
  document.body.appendChild(btn); document.body.appendChild(bar);
  ['pointerdown', 'pointerup', 'touchstart', 'click'].forEach(function (t) { [btn, bar].forEach(function (el) { el.addEventListener(t, function (e) { e.stopPropagation(); }, { passive: t !== 'click' }); }); });
  var hl = null;
  function mark() {                                                              /* 选中的那件：一圈橙色的框（跟着它动） */
    if (hl) { if (hl.parent) hl.parent.remove(hl); hl = null; }
    bar.hidden = !sel; if (!sel || !VIEW.scene) return;
    bar.querySelector('b').textContent = sel.q.title || DF().kindName(sel.q.kind);
    hl = new THREE.BoxHelper(sel.hit, 0xffa060); VIEW.scene.add(hl);
  }
  function pick(e) {
    var cam = VIEW.camera, r = VIEW.renderer; if (!cam || !r || !items.length) return null;
    var rc = r.domElement.getBoundingClientRect(), v = new THREE.Vector2((e.clientX - rc.left) / rc.width * 2 - 1, -(e.clientY - rc.top) / rc.height * 2 + 1);
    ray.setFromCamera(v, cam); ray.far = 12;
    var h = ray.intersectObjects(items.map(function (it) { return it.hit; }), false)[0];
    return h ? h.object.userData.it : null;
  }
  function floorPoint(e, z) {                                                    /* 屏幕上一点 → 这一层地面上的点（工程坐标） */
    var cam = VIEW.camera, r = VIEW.renderer, x = X(); if (!cam || !r || !x) return null;
    var rc = r.domElement.getBoundingClientRect(), v = new THREE.Vector2((e.clientX - rc.left) / rc.width * 2 - 1, -(e.clientY - rc.top) / rc.height * 2 + 1);
    ray.setFromCamera(v, cam);
    var o = x.house.worldToLocal(ray.ray.origin.clone()), d = x.house.worldToLocal(ray.ray.origin.clone().add(ray.ray.direction)).sub(o);
    if (Math.abs(d.z) < 1e-4) return null; var t = (z - o.z) / d.z; if (t < 0 || t > 30) return null;
    return new THREE.Vector3(o.x + d.x * t, o.y + d.y * t, z);
  }
  window.addEventListener('pointerdown', function (e) {
    if (!exploring() || e.target !== (VIEW.renderer && VIEW.renderer.domElement)) return;
    var it = pick(e);
    if (!editing) { if (it) { tapped = { it: it, x: e.clientX, y: e.clientY }; } return; }
    if (!it) return;                                                             /* 空处：照常转头看 */
    e.stopPropagation(); e.preventDefault();
    sel = it; mark();
    var fp = floorPoint(e, it.g.position.z);
    drag = { id: e.pointerId, it: it, off: fp ? fp.sub(it.g.position) : new THREE.Vector3(), moved: false };
  }, true);
  window.addEventListener('pointermove', function (e) {
    if (!drag || e.pointerId !== drag.id) return;
    e.stopPropagation();
    var fp = floorPoint(e, drag.it.g.position.z); if (!fp) return;
    fp.sub(drag.off); drag.it.g.position.x = Math.round(fp.x * 20) / 20; drag.it.g.position.y = Math.round(fp.y * 20) / 20; drag.moved = true;
  }, true);
  window.addEventListener('pointerup', function (e) {
    if (tapped && !editing) { var t = tapped; tapped = null; if (Math.hypot(e.clientX - t.x, e.clientY - t.y) < 8) use(t.it); return; }
    if (!drag || e.pointerId !== drag.id) return;
    e.stopPropagation(); var d = drag; drag = null;
    if (d.moved) { rehome(d.it); writeBack(d.it); }
    if (wantBuild) { wantBuild = false; build(); }
  }, true);
  var tapped = null;
  function use(it) {                                                             /* 不在摆放模式时点物件：功能物件进 Minest 打开它 */
    if (it.q.fn) {
      if (window.parent && window.parent !== window) { try { window.parent.postMessage({ clun: 'enter', feature: it.q.fn }, '*'); } catch (e) {} }
      else toast('在 Minest 里打开时，点它会进入「' + FN_NAME[it.q.fn][0] + '」');
    } else if (it.q.kind === 'church-organ' && window.SpatialChurchOrgan && window.SpatialChurchOrgan.play) { try { if (window.SpatialChurchOrgan.playing) window.SpatialChurchOrgan.stop(); else window.SpatialChurchOrgan.play(); } catch (e) {} }
  }
  bar.addEventListener('click', function (e) {
    var b = e.target.closest('[data-a]'); if (!b || !sel) return; var a = b.getAttribute('data-a');
    if (a === 'rot' || a === 'rot15') { sel.g.rotation.z += a === 'rot' ? PI / 2 : -PI / 12; writeBack(sel); mark(); return; }
    if (a === 'del') {
      var q = sel.q, sn = snap(q.room), L = layoutOf(q.room);
      if (q.fn) L[q.fn] = { stashed: true }; else L.extras = (L.extras || []).filter(function (x) { return x.uid !== q.uid; });
      save(q.room, L); sel = null; mark(); build(); DF().edited('stash'); toast((q.title || '物件') + ' 已移除', function () { undo(sn); }); return;
    }
    if (a === 'ok') { writeBack(sel); sel = null; mark(); DF().edited('ok'); }
  });
  var toastEl = null, toastT = 0;
  function toast(t, undoFn) {                                                    /* undoFn：提示条上加「撤销」 */
    if (!toastEl) { toastEl = document.createElement('div'); toastEl.style.cssText = 'position:fixed;z-index:42;left:50%;transform:translateX(-50%);top:calc(max(14px,env(safe-area-inset-top)) + 40px);padding:7px 14px;border-radius:999px;background:rgba(30,26,20,.82);color:#fff7e6;font:13px -apple-system,"PingFang SC",sans-serif;pointer-events:none;transition:opacity .4s;white-space:nowrap'; document.body.appendChild(toastEl); }
    toastEl.textContent = t; toastEl.style.pointerEvents = undoFn ? 'auto' : 'none';
    if (undoFn) {
      var u = document.createElement('button'); u.type = 'button'; u.textContent = '撤销';
      u.style.cssText = 'margin-left:10px;padding:3px 10px;border-radius:999px;border:1px solid rgba(255,255,255,.55);background:rgba(255,255,255,.16);color:#fff7e6;font:inherit;font-weight:600;cursor:pointer';
      ['pointerdown', 'pointerup', 'touchstart'].forEach(function (ev) { u.addEventListener(ev, function (e) { e.stopPropagation(); }, { passive: true }); });
      u.addEventListener('click', function (e) { e.stopPropagation(); toastEl.style.opacity = 0; toastEl.style.pointerEvents = 'none'; clearTimeout(toastT); undoFn(); });
      toastEl.appendChild(u);
    }
    toastEl.style.opacity = 1; clearTimeout(toastT); toastT = setTimeout(function () { toastEl.style.opacity = 0; toastEl.style.pointerEvents = 'none'; }, undoFn ? 7000 : 2600);
  }
  /* 撤销移除：那个房间移除之前的摆放和默认 */
  function snap(id) { return { id: id, L: JSON.stringify(layoutOf(id)), d: JSON.stringify(DF() ? DF().get('clun:' + id) : null) }; }
  function undo(sn) {
    var L = JSON.parse(sn.L), D = DF();
    if (D && sn.d !== JSON.stringify(D.get('clun:' + sn.id))) { var d = JSON.parse(sn.d), nd = D.put('clun:' + sn.id, d ? { fn: d.fn, extras: d.extras } : null); L.defAt = nd ? nd.at : (L.defAt || 0); }
    delete LC[sn.id]; save(sn.id, L); build(); if (D) D.edited(); toast('已撤销');
  }

  /* —— 默认物件面板（home-defaults.js，和 Spatial Home 同一个）：这里管 Clun 的房间 —— */
  function curRoom() { var m = me(); return m && m.room ? m.room.id : (V2.currentRoom && V2.currentRoom() ? V2.currentRoom().id : 'study'); }
  var defHost = {
    zUp: true, toast: toast,
    rooms: function () { return V2.rooms.map(function (r) { return { id: 'clun:' + r.id, name: r.zh + ' · ' + r.en, group: 'Clun 住宅' }; }); },
    current: function () { return 'clun:' + curRoom(); },
    known: known,
    fnObjects: function () { return FN.map(function (f) { return { id: f, name: FN_NAME[f][0], icon: FN_NAME[f][1], startStashed: true }; }); },
    catalog: function () { return (window.SpatialFurnitureCatalog || []).filter(function (c) { return known(c.id); }).map(function (c) { return { kind: c.id, name: c.name, icon: c.icon }; }); },
    onClose: function () { setEditing(false); },
    live: {
      state: function () { return stateOf(curRoom()); },
      stamp: function (d) { var id = curRoom(), L = layoutOf(id); L.defAt = d ? d.at : 0; save(id, L); },
      setFn: function (f, on) { var id = curRoom(), sn = on ? null : snap(id), L = layoutOf(id), m = me(); if (sn) setTimeout(function () { toast(FN_NAME[f][0] + ' 已移除', function () { undo(sn); }); }, 0); L[f] = on ? { p: m ? m.front : centre(id), ry: m ? r3(m.face) : 0 } : { stashed: true }; save(id, L); build(); },
      removeExtra: function (uid) { var id = curRoom(), sn = snap(id); setTimeout(function () { toast('已移除', function () { undo(sn); }); }, 0); var L = layoutOf(id); L.extras = (L.extras || []).filter(function (e) { return e.uid !== uid; }); save(id, L); build(); },
      addExtra: function (kind, name) {
        var id = curRoom(), L = layoutOf(id), m = me(), e = { uid: Date.now() % 1e9 + Math.floor(Math.random() * 1000), kind: kind, title: name, p: m ? m.front : centre(id), ry: m ? r3(m.face) : 0 };
        L.extras = (L.extras || []).concat([e]); save(id, L);
        need([kind]).then(function () { build(); setTimeout(function () { sel = items.filter(function (it) { return it.q.uid === e.uid; })[0] || null; mark(); if (!sel) DF().edited('cancel'); }, 60); });
      },
      move: function (q) { sel = items.filter(function (it) { return it.q.room === curRoom() && (q.fn ? it.q.fn === q.fn : it.q.uid === q.uid); })[0] || null; mark(); if (!sel) DF().edited('cancel'); else toast('拖动它，放好点 ✓'); },
      reapply: function () { var id = curRoom(), L = layoutOf(id); L.defAt = 0; save(id, L); delete LC[id]; build(); toast('已按默认重新摆放'); },
      restore: function () { var id = curRoom(); save(id, {}); delete LC[id]; build(); }
    }
  };
  function setEditing(on) { editing = on; btn.classList.toggle('on', on); if (!on) { sel = null; mark(); } }
  btn.addEventListener('click', function () {
    if (editing) { setEditing(false); if (DF()) DF().close(); return; }
    need([]).then(function () { setEditing(true); DF().open(defHost); toast('点房间里的物件可以拖动'); });
  });

  /* —— 每帧：物件跟着房子；只在屋里走动时显示 —— */
  var attached = false, prevIn = false;
  function tick() {
    requestAnimationFrame(tick);
    var x = X(); if (!x || !x.house) return;
    if (!attached && x.house.parent) { var top = x.house; while (top.parent) top = top.parent; top.add(root); attached = true; build(); }   /* 挂在场景根上，矩阵 = 房子的世界矩阵 */
    x.house.updateMatrixWorld(); root.matrix.copy(x.house.matrixWorld); root.matrixWorldNeedsUpdate = true;
    var inside = exploring(); root.visible = inside; btn.hidden = !inside;
    if (hl && sel) { root.updateMatrixWorld(true); hl.update(); }
    if (prevIn && !inside && editing) { setEditing(false); if (DF()) DF().close(); }
    prevIn = inside;
  }
  requestAnimationFrame(tick);
  var tB = 0;
  function onStore() { LC = {}; clearTimeout(tB); tB = setTimeout(function () { if (!drag) build(); }, 120); }
  (function hook() { if (HS()) HS().onChange(onStore); else setTimeout(hook, 300); })();
  V2.things = { items: function () { return items; }, layout: layoutOf, build: build, host: defHost, view: VIEW, editing: function () { return editing; }, select: function (i) { sel = items[i] || null; mark(); } };
})();
