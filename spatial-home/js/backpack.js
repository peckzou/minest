/* Minest · Magical Backpack V1.0 — one place for every thing you can set out in a 3D world.
   Craft → Collect → Backpack → Place → Interact → Retrieve → Reuse.
   It does not own any content. It lists what Minest already has and only keeps where things stand:
     · My Creations     Type / Pipe Wall works            MinestKnowledge 'mtw:item:<id>'   (model: MinestNeonWord.build — the workshop's own builder)
     · Display Fixtures display furniture (templates) and the dynamic display machines (MinestMachines / MinestVoxelDisplays,
                        model and operating view are theirs; a machine only REFERENCES a list: {bid, list})
     · Workshop Tools / Magic Items   the Spatial Home function objects (typewriter, quill, planner, projector, ornament …)
     · My Collections   My World things (board → list → thing ids, picture or name)
     · Favorites        your picks (also the hotbar)
   Three kinds, kept apart:
     template  — furniture that may be placed any number of times (pedestal, shelf, vitrine, machines)
     owned     — one real thing (a work, a collection thing): it is in ONE place or in the backpack, never copied
     function  — a Spatial Home object with its feature (one each, per environment)
   Placed instances live with the world they are in (Spatial Home: MinestKnowledge 'bp:home:<env>', synced like the rest of
   My World; a local copy is the fallback). Preferences (favorites, recent, hotbar) in 'bp:pref'.
   The backpack UI is host-agnostic: a host (Spatial Home today) gives it { THREE, functionObjects(), placed(), place(spec),
   move(id), stash(id), toast() }. */
(function (root) {
  'use strict';
  if (root.MinestBackpack) return;
  var VERSION = '1.0';
  function KN() { if (root.MinestKnowledge) return root.MinestKnowledge; try { var w = root.SpatialBridge && root.SpatialBridge.hostWindow(); return (w && w.MinestKnowledge) || null; } catch (e) { return null; } }
  function HW() { try { return (root.SpatialBridge && root.SpatialBridge.hostWindow()) || root; } catch (e) { return root; } }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function lsGet(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  /* ---------------------------------------------------------------- storage (synced through MinestKnowledge when there) */
  var store = {
    get: function (key) { var K = KN(); var v = null; try { v = K ? K.get(key) : null; } catch (e) {} if (v == null) v = lsGet('minest.' + key); return v; },
    set: function (key, v) { lsSet('minest.' + key, v); var K = KN(); try { if (K) K.set(key, v, true); } catch (e) {} },
    synced: function () { return !!KN(); }
  };
  function pref() { var p = store.get('bp:pref'); if (!p || typeof p !== 'object') p = {}; p.fav = p.fav || []; p.recent = p.recent || []; return p; }
  function setPref(p) { store.set('bp:pref', p); }
  function touch(key) { var p = pref(); p.recent = [key].concat(p.recent.filter(function (k) { return k !== key; })).slice(0, 12); setPref(p); }
  function isFav(key) { return pref().fav.indexOf(key) >= 0; }
  function toggleFav(key) { var p = pref(), i = p.fav.indexOf(key); if (i >= 0) p.fav.splice(i, 1); else p.fav.push(key); setPref(p); return i < 0; }

  /* ---------------------------------------------------------------- the content Minest already has */
  function works() {                                                 // Type / Pipe Wall works
    var K = KN(); if (!K || !K.keys) return [];
    try { return K.keys('mtw:item:').map(function (k) { return K.get(k); }).filter(function (it) { return it && it.id && !it.deleted && it.word; }); } catch (e) { return []; }
  }
  function boards() { try { var w = HW(); return (w.MinestAI && w.MinestAI.boards && w.MinestAI.boards()) || []; } catch (e) { return []; } }
  function things() {
    var out = [];
    boards().forEach(function (b) { (b.columns || []).forEach(function (c) { (c.cards || []).forEach(function (k) { (k && k.stack || []).forEach(function (t) { if (t && t.id && t.title && out.length < 120) out.push({ bid: b.id, card: k.id, sid: t.id, title: String(t.title).slice(0, 60), list: String(k.title || c.title || '').slice(0, 30), board: String(b.title || '') }); }); }); }); });
    return out;
  }
  /* lists a machine can load: every list of every board, as the exhibition engine indexes them (its own index) */
  function lists() {
    var VD = HW().MinestVoxelDisplays, out = [];
    if (!VD || !VD._ || !VD._.index) return out;
    boards().forEach(function (b) { try { var ix = VD._.index(b.id); (ix.lists || []).forEach(function (L) { out.push({ bid: b.id, board: String(b.title || ''), id: L.id, title: L.title, n: L.cards.length }); }); } catch (e) {} });
    return out;
  }
  function machines() { var M = HW().MinestMachines; return M && M.catalog ? M.catalog : []; }

  var FIXTURES = [
    { id: 'pedestal', name: '展示台', en: 'Pedestal', icon: '🏛', place: 'floor', size: [0.42, 0.42, 0.91], note: '地面 · 顶面可再放东西' },
    { id: 'wallshelf', name: '墙面置物架', en: 'Wall shelf', icon: '🪵', place: 'wall', size: [0.9, 0.22, 0.2], note: '墙面 · 架上可放小物' },
    { id: 'vitrine', name: '玻璃展柜', en: 'Vitrine', icon: '🔲', place: 'surface', size: [0.46, 0.34, 0.39], note: '桌面 / 柜面 / 展台' }
  ];
  var TOOLS = { typewriter: 1, quill: 1, planner: 1, board: 1, album: 1, bookstand: 1 };

  /* every entry of the backpack: { key, cat, kind, name, icon, place, size, note, ref, spec } */
  function catalog(host) {
    var out = [];
    works().forEach(function (it) {
      out.push({ key: 'work:' + it.id, cat: 'creations', kind: 'owned', name: it.word, icon: '✨', place: 'surface',
        note: (it.mode || 'neon') + ' · ' + (it.gas || '') + ' · Type Workshop 作品', ref: { work: it.id }, spec: { kind: 'neon', ref: { work: it.id }, title: it.word } });
    });
    FIXTURES.forEach(function (f) { out.push({ key: 'fx:' + f.id, cat: 'fixtures', kind: 'template', name: f.name, icon: f.icon, place: f.place, size: f.size, note: f.note, spec: { kind: f.id } }); });
    machines().forEach(function (m) {
      out.push({ key: 'mc:' + m.id, cat: 'fixtures', kind: 'template', name: m.no + ' · ' + m.name, en: m.en, icon: m.icon, place: 'floor', ready: !!m.ready,
        note: m.ready ? m.kind + ' · 装载一个 List，可以真的操作' : '第 ' + m.phase + ' 阶段 · 还没有做', spec: { kind: 'machine', mx: { type: m.id } } });
    });
    (host && host.functionObjects ? host.functionObjects() : []).forEach(function (o) {
      out.push({ key: 'fn:' + o.id, cat: TOOLS[o.id] ? 'tools' : 'magic', kind: 'function', name: o.name, icon: o.icon, place: o.place, note: '功能物件 · ' + (o.feature || ''), ref: { fn: o.id }, fn: o });
    });
    things().forEach(function (t) {
      out.push({ key: 'thing:' + t.sid, cat: 'collections', kind: 'owned', name: t.title, icon: '🖼', place: 'surface', note: (t.board ? t.board + ' · ' : '') + t.list,
        ref: { bid: t.bid, card: t.card, sid: t.sid }, spec: { kind: 'thing', ref: { bid: t.bid, card: t.card, sid: t.sid }, title: t.title, list: t.list } });
    });
    return out;
  }

  /* ---------------------------------------------------------------- 3D models of instances (shared by the room and the previews) */
  function frame(T, e) {
    var g = new T.Group(), VB = root.SpatialVoxel.VB, v = new VB(5100);
    v.box(-0.13, 0, -0.02, 0.13, 0.012, 0.06, 'woodDark'); v.box(-0.135, 0.02, -0.01, 0.135, 0.34, 0.01, 'woodDark'); v.box(-0.01, 0, -0.08, 0.01, 0.3, -0.06, 'woodDark');
    g.add(v.mesh());
    var cv = document.createElement('canvas'); cv.width = 240; cv.height = 300; var cx = cv.getContext('2d');
    cx.fillStyle = '#fbf7ee'; cx.fillRect(0, 0, 240, 300); cx.fillStyle = '#1d2b4f'; cx.font = '600 26px -apple-system, "PingFang SC", sans-serif'; cx.textAlign = 'center';
    (String(e.title || '').slice(0, 40).match(/.{1,9}/g) || ['']).slice(0, 5).forEach(function (line, i) { cx.fillText(line, 120, 70 + i * 40); });
    var tex = new T.CanvasTexture(cv); tex.encoding = T.sRGBEncoding;
    var pic = new T.Mesh(new T.PlaneGeometry(0.24, 0.3), new T.MeshLambertMaterial({ map: tex })); pic.position.set(0, 0.18, 0.012); g.add(pic);
    var url = thingPic(e.ref); if (url) { try { var ld = new T.TextureLoader(); ld.setCrossOrigin('anonymous'); ld.load(url, function (t) { t.encoding = T.sRGBEncoding; pic.material.map = t; pic.material.needsUpdate = true; }); } catch (er) {} }
    return { group: g, hb: [0.27, 0.35, 0.16], place: 'surface' };
  }
  function thingPic(r) {
    if (!r) return ''; var hit = null;
    boards().forEach(function (b) { if (b.id !== r.bid) return; (b.columns || []).forEach(function (c) { (c.cards || []).forEach(function (k) { if (k && k.id === r.card) (k.stack || []).forEach(function (t) { if (t && t.id === r.sid) hit = t; }); }); }); });
    var c2 = hit && hit.cover; return c2 && c2.type !== 'color' && (c2.value || c2.url) || '';
  }
  function fixture(T, kind) {
    var g = new T.Group(), VB = root.SpatialVoxel.VB, v = new VB(5000), hb;
    if (kind === 'pedestal') { v.cb(0, 0, 0, 0.42, 0.06, 0.42, 'stone2'); v.cb(0, 0.06, 0, 0.34, 0.8, 0.34, 'stone', 0.03); v.cb(0, 0.86, 0, 0.42, 0.05, 0.42, 'stone2'); hb = [0.42, 0.91, 0.42]; }
    else if (kind === 'wallshelf') { v.box(-0.45, -0.02, 0, 0.45, 0.02, 0.22, 'woodLight', 0.03); v.box(-0.38, -0.16, 0, -0.35, -0.02, 0.18, 'brass'); v.box(0.35, -0.16, 0, 0.38, -0.02, 0.18, 'brass'); hb = [0.9, 0.2, 0.22]; }
    else {
      v.cb(0, 0, 0, 0.46, 0.05, 0.34, 'woodDark'); v.cb(0, 0.36, 0, 0.46, 0.03, 0.34, 'woodDark');
      [[-0.22, -0.16], [0.21, -0.16], [-0.22, 0.15], [0.21, 0.15]].forEach(function (q) { v.box(q[0], 0.05, q[1], q[0] + 0.012, 0.36, q[1] + 0.012, 'brass'); });
      var gl = new T.Mesh(new T.BoxGeometry(0.44, 0.31, 0.32), new T.MeshPhongMaterial({ color: 0xdff3ff, transparent: true, opacity: 0.16, shininess: 120, depthWrite: false })); gl.position.y = 0.205; g.add(gl); hb = [0.46, 0.39, 0.34];
    }
    g.add(v.mesh());
    return { group: g, hb: hb, place: kind === 'pedestal' ? 'floor' : (kind === 'wallshelf' ? 'wall' : 'surface'), hbY: kind === 'wallshelf' ? -0.07 : null, hbZ: kind === 'wallshelf' ? 0.11 : 0 };
  }
  function neon(T, e) {
    var W = HW(), N = W.MinestNeonWord || root.MinestNeonWord, it = null;
    try { var K = KN(); it = K ? K.get('mtw:item:' + (e.ref && e.ref.work)) : null; } catch (er) {}
    if (!N || !it || it.deleted) { var f = frame(T, { title: (it && it.word) || e.title || '作品' }); f.missing = true; return f; }
    var word = N.build(T, it.word, { gas: it.gas, mode: it.mode || 'neon', height: 0.16, light: true });
    var w = (word.userData && word.userData.w) || 0.5, base = new T.Group(), VB = root.SpatialVoxel.VB, v = new VB(5200);
    v.box(-w / 2 - 0.04, 0, -0.05, w / 2 + 0.04, 0.025, 0.05, 'woodDark'); base.add(v.mesh());
    word.position.y = 0.03; base.add(word);
    return { group: base, hb: [w + 0.08, 0.22, 0.12], place: 'surface', tick: word.userData && word.userData.tick };
  }
  /* a display machine: the exhibition engine builds it (its own model), loaded with the referenced list */
  function machine(T, e) {
    var W = HW(), VD = W.MinestVoxelDisplays, M = W.MinestMachines;
    if (!VD || !VD.ext || !VD.ext.machine || !VD._ || !M) { var f = frame(T, { title: '装置不可用' }); f.missing = true; return f; }
    var U = VD._, mx = e.mx || {}, bid = mx.bid || (boards()[0] || {}).id || '';
    var d = { id: e.uid ? 'bp' + e.uid : 'bp-prev', kind: 'machine', x: 0, z: 0, y: 0, rot: 0, it: [], label: mx.title || '', mx: { type: mx.type, list: mx.list || null, auto: false, order: mx.order, pos: mx.pos, page: mx.page } };
    var inner = new T.Group();
    try { VD.ext.machine.build(d, inner, { ix: U.index(bid), use: function (r) { r.n++; return r; }, shadows: false }); } catch (er) { if (root.console) console.warn('backpack: machine build failed', er); }
    var box = new T.Box3().setFromObject(inner), size = box.getSize(new T.Vector3()), s = size.y > 0 ? Math.min(1.1 / size.y, 1.2 / Math.max(size.x, size.z, 0.01)) : 1;
    inner.scale.setScalar(s); var c = box.getCenter(new T.Vector3()); inner.position.set(-c.x * s, -box.min.y * s, -c.z * s);
    var g = new T.Group(); g.add(inner);
    return { group: g, hb: [size.x * s, size.y * s, size.z * s], place: 'floor', machine: { d: d, bid: bid } };
  }
  function model(T, e) {
    if (e.kind === 'neon') return neon(T, e);
    if (e.kind === 'thing') return frame(T, e);
    if (e.kind === 'machine') return machine(T, e);
    return fixture(T, e.kind);
  }
  /* operate a machine: its own operating view; what you choose there is written back to this instance */
  function operate(e, save, toast) {
    var W = HW(), VD = W.MinestVoxelDisplays, M = W.MinestMachines; if (!VD || !M || !VD.ext.machine) return toast('动态陈列装置没有载入');
    var mx = e.mx || {}; if (!mx.list) return toast('先给它装载一个 List');
    var d = { id: 'bp' + e.uid, kind: 'machine', x: 0, z: 0, y: 0, rot: 0, it: [], mx: { type: mx.type, list: mx.list, auto: false, order: mx.order, pos: mx.pos, page: mx.page } };
    var world = { displays: [d] };
    var ctx = {
      host: { boardId: function () { return mx.bid; }, record: function () { return { displays: world.displays, dv: 2 }; }, world: function () { return world; } },
      toast: toast, refresh: function () {}, setSel: function () {},
      commit: function (fn) { var next = JSON.parse(JSON.stringify(world)); fn(next); var q = next.displays[0]; if (q && q.mx) { ['order', 'pos', 'page', 'auto'].forEach(function (k) { if (q.mx[k] !== undefined) mx[k] = q.mx[k]; }); e.mx = mx; save(); } world = next; }
    };
    VD.ext.machine.open(d, ctx);
  }

  /* ---------------------------------------------------------------- thumbnails and the turning preview (one small renderer) */
  var PR = null;
  function previewer(T) {
    if (PR) return PR;
    var cv = document.createElement('canvas'); cv.width = cv.height = 256;
    var R = new T.WebGLRenderer({ canvas: cv, antialias: true, alpha: true, preserveDrawingBuffer: true }); R.setPixelRatio(1); R.setSize(256, 256, false); R.outputEncoding = T.sRGBEncoding;
    var S = new T.Scene(), C = new T.PerspectiveCamera(32, 1, 0.01, 50);
    S.add(new T.HemisphereLight(0xfff6e8, 0x6b5a4a, 1.0)); var d = new T.DirectionalLight(0xffffff, 0.8); d.position.set(2, 4, 3); S.add(d);
    var holder = new T.Group(); S.add(holder);
    PR = { cv: cv, R: R, S: S, C: C, holder: holder, cache: {} };
    return PR;
  }
  function frameOn(P, T, obj) {
    while (P.holder.children.length) P.holder.remove(P.holder.children[0]);
    P.holder.add(obj); P.holder.rotation.y = -0.55; P.holder.updateMatrixWorld(true);
    var box = new T.Box3().setFromObject(obj), size = box.getSize(new T.Vector3()), c = box.getCenter(new T.Vector3()), r = Math.max(size.x, size.y, size.z, 0.05);
    P.C.position.set(c.x + r * 0.15, c.y + r * 0.55, c.z + r * 2.4); P.C.lookAt(c.x, c.y, c.z); P.C.near = r * 0.05; P.C.far = r * 20; P.C.updateProjectionMatrix();
  }
  function objFor(T, item) {
    if (item.kind === 'function') { var g = item.fn.group.clone(true); g.position.set(0, 0, 0); g.rotation.set(0, 0, 0); g.scale.setScalar(1); g.visible = true; g.traverse(function (m) { m.visible = m.material ? m.material.visible !== false : true; }); return g; }
    return model(T, item.spec).group;
  }
  function thumb(T, item) {
    var P = previewer(T); if (P.cache[item.key]) return P.cache[item.key];
    try { frameOn(P, T, objFor(T, item)); P.R.render(P.S, P.C); P.cache[item.key] = P.cv.toDataURL('image/png'); } catch (e) { P.cache[item.key] = ''; }
    return P.cache[item.key];
  }

  /* ---------------------------------------------------------------- the backpack UI */
  var CATS = [['all', 'All Items', '全部'], ['creations', 'My Creations', '我的作品'], ['fixtures', 'Display Fixtures', '陈列装置'], ['tools', 'Workshop Tools', '工坊工具'], ['magic', 'Magic Items', '魔法道具'], ['collections', 'My Collections', '我的收藏'], ['fav', 'Favorites', '收藏夹']];
  var ui = null;
  function css() {
    if (document.getElementById('mn-bp-css')) return;
    var s = document.createElement('style'); s.id = 'mn-bp-css';
    s.textContent = [
      '#mn-bp{position:fixed;z-index:2147483645;inset:auto 12px calc(12px + env(safe-area-inset-bottom)) auto;width:min(720px,calc(100vw - 24px));height:min(560px,calc(100vh - 90px));display:flex;flex-direction:column;border-radius:22px;overflow:hidden;font:14px/1.35 -apple-system,BlinkMacSystemFont,"PingFang SC",sans-serif;color:#2b1d12;',
      'background:linear-gradient(180deg,#8a5a36,#6e4426);box-shadow:0 24px 60px rgba(40,22,8,.45),inset 0 0 0 2px #4a2c16;transform-origin:50% 0}',
      '#mn-bp[hidden]{display:none}#mn-bp.opening{animation:bpOpen .38s cubic-bezier(.2,.9,.3,1.2)}@keyframes bpOpen{0%{transform:scaleY(.12) translateY(30px);opacity:0}100%{transform:none;opacity:1}}',
      '#mn-bp .flap{position:relative;padding:12px 16px 10px;background:linear-gradient(180deg,#9c6a40,#7f512e);border-bottom:2px dashed rgba(255,228,180,.35);display:flex;align-items:center;gap:10px}',
      '#mn-bp .buckle{width:34px;height:22px;border:3px solid #d8a94a;border-radius:6px;background:linear-gradient(#f2c66a,#b98a2e);box-shadow:inset 0 0 0 3px #7a5420;transition:transform .35s}',
      '#mn-bp.opening .buckle{animation:bpBuckle .38s}@keyframes bpBuckle{0%{transform:translateY(-4px) rotate(-30deg)}100%{transform:none}}',
      '#mn-bp .plate{padding:3px 10px;border-radius:6px;background:linear-gradient(#f4dfa8,#d2b06a);color:#4a2c16;font-weight:800;letter-spacing:.06em;font-size:12px;box-shadow:inset 0 -2px 0 rgba(0,0,0,.18)}',
      '#mn-bp .flap input{flex:1;min-width:0;padding:8px 12px;border-radius:12px;border:2px solid #4a2c16;background:#fbf2e0;font:inherit}',
      '#mn-bp .flap button{border:0;background:#4a2c16;color:#fbe7c0;border-radius:10px;padding:8px 12px;font:inherit;font-weight:700;cursor:pointer}',
      '#mn-bp .tabs{display:flex;gap:4px;padding:8px 10px 0;overflow-x:auto;scrollbar-width:none}#mn-bp .tabs::-webkit-scrollbar{display:none}',
      '#mn-bp .tabs button{flex:none;border:0;padding:7px 11px;border-radius:10px 10px 0 0;background:#5b3a20;color:#f3dcb4;font:inherit;font-size:12.5px;font-weight:700;cursor:pointer}',
      '#mn-bp .tabs button.on{background:#f6ead2;color:#3a2412}',
      '#mn-bp .inside{flex:1;min-height:0;display:flex;gap:10px;padding:10px;background:#f6ead2;box-shadow:inset 0 2px 8px rgba(80,50,20,.25)}',
      '#mn-bp .grid{flex:1;min-width:0;overflow:auto;display:grid;grid-template-columns:repeat(auto-fill,minmax(92px,1fr));gap:8px;align-content:start}',
      '#mn-bp .grid h5{grid-column:1/-1;margin:4px 2px 0;font-size:11px;letter-spacing:.06em;color:#8a6a48}',
      '#mn-bp .it{position:relative;border:2px solid #d9c3a0;border-radius:12px;background:#fffaf0;padding:6px 4px 5px;text-align:center;cursor:pointer;font:inherit}',
      '#mn-bp .it.sel{border-color:#2f6fd6;box-shadow:0 0 0 2px rgba(47,111,214,.25)}#mn-bp .it.off{opacity:.45}',
      '#mn-bp .it img{width:72px;height:72px;object-fit:contain;display:block;margin:0 auto}#mn-bp .it i{font-style:normal;font-size:30px;display:block;height:72px;line-height:72px}',
      '#mn-bp .it span{display:block;font-size:11.5px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '#mn-bp .it b{position:absolute;top:4px;right:4px;font-size:9.5px;font-weight:800;padding:1px 5px;border-radius:6px;background:#2f6fd6;color:#fff}#mn-bp .it b.bag{background:#8a6a48}#mn-bp .it b.tpl{background:#3f7a3c}',
      '#mn-bp .pv{width:240px;flex:none;display:flex;flex-direction:column;gap:6px;overflow:auto}',
      '#mn-bp .pv canvas{width:240px;height:200px;border-radius:14px;background:radial-gradient(#fffdf6,#ead8b6);touch-action:none;cursor:grab}',
      '#mn-bp .pv h4{margin:2px 0 0;font-size:15px}#mn-bp .pv p{margin:0;font-size:12px;color:#5a4128}#mn-bp .pv dl{margin:0;display:grid;grid-template-columns:auto 1fr;gap:2px 8px;font-size:12px}#mn-bp .pv dt{color:#8a6a48}',
      '#mn-bp .pv .acts{display:flex;flex-wrap:wrap;gap:6px;margin-top:4px}#mn-bp .pv .acts button{flex:1 1 45%;border:0;border-radius:10px;padding:9px 6px;font:inherit;font-weight:700;cursor:pointer;background:#e6d3b0;color:#3a2412}',
      '#mn-bp .pv .acts button.pri{background:#2f6fd6;color:#fff}#mn-bp .pv .acts button:disabled{opacity:.4;cursor:default}',
      '#mn-bp .lists{display:flex;flex-direction:column;gap:4px;max-height:180px;overflow:auto}#mn-bp .lists button{text-align:left;border:1px solid #d9c3a0;background:#fffaf0;border-radius:9px;padding:6px 8px;font:inherit;font-size:12px;cursor:pointer}',
      '@media (max-width:640px){#mn-bp{height:calc(100vh - 80px)}#mn-bp .inside{flex-direction:column}#mn-bp .pv{width:auto;flex:0 0 auto;max-height:46%}#mn-bp .pv canvas{width:100%;height:150px}}',
      '#mn-hotbar{position:fixed;z-index:2147483602;left:50%;transform:translateX(-50%);bottom:calc(84px + env(safe-area-inset-bottom));display:flex;gap:5px;padding:5px;border-radius:14px;background:rgba(74,44,22,.82);box-shadow:0 8px 20px rgba(40,22,8,.35)}',
      '#mn-hotbar[hidden]{display:none}#mn-hotbar button{width:44px;height:44px;border-radius:10px;border:2px solid #b98a5a;background:#fbf2e0;padding:2px;cursor:pointer}#mn-hotbar img{width:100%;height:100%;object-fit:contain}#mn-hotbar i{font-style:normal;font-size:22px}'
    ].join('\n');
    document.head.appendChild(s);
  }
  function open(host) {
    css();
    if (!ui) {
      var el = document.createElement('div'); el.id = 'mn-bp'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Magical Backpack');
      el.innerHTML = '<div class="flap"><span class="buckle" aria-hidden="true"></span><span class="plate">MINEST · BACKPACK</span><input type="search" placeholder="搜索物品…" aria-label="搜索"><button type="button" data-bp="close">合上</button></div>' +
        '<div class="tabs" role="tablist"></div><div class="inside"><div class="grid"></div><div class="pv"></div></div>';
      document.body.appendChild(el);
      ui = { el: el, cat: 'all', q: '', sel: null, host: host, raf: 0, spin: 0, drag: null };
      el.querySelector('input').addEventListener('input', function () { ui.q = this.value.trim().toLowerCase(); render(); });
      el.addEventListener('click', onClick);
    }
    ui.host = host; ui.el.hidden = false;
    if (!host.reduced || !host.reduced()) { ui.el.classList.remove('opening'); void ui.el.offsetWidth; ui.el.classList.add('opening'); }
    render();
  }
  function close() { if (!ui) return; ui.el.hidden = true; cancelAnimationFrame(ui.raf); ui.raf = 0; }
  function isOpen() { return !!(ui && !ui.el.hidden); }
  function items() { return catalog(ui.host); }
  function render() {
    var all = items(), host = ui.host, p = pref(), queue = [];
    ui.el.querySelector('.tabs').innerHTML = CATS.map(function (c) { return '<button type="button" data-cat="' + c[0] + '" class="' + (ui.cat === c[0] ? 'on' : '') + '" title="' + c[2] + '">' + c[1] + '</button>'; }).join('');
    var list = all.filter(function (it) { return ui.cat === 'all' || (ui.cat === 'fav' ? p.fav.indexOf(it.key) >= 0 : it.cat === ui.cat); })
      .filter(function (it) { return !ui.q || (it.name + ' ' + (it.note || '') + ' ' + (it.en || '')).toLowerCase().indexOf(ui.q) >= 0; });
    var T = host.THREE, h = '';
    if (ui.cat === 'all' && !ui.q && p.recent.length) {
      var rec = p.recent.map(function (k) { return all.filter(function (x) { return x.key === k; })[0]; }).filter(Boolean).slice(0, 6);
      if (rec.length) h += '<h5>最近使用</h5>' + rec.map(card).join('') + '<h5>全部物品</h5>';
    }
    h += list.map(card).join('') || '<h5>' + (ui.cat === 'creations' ? '还没有 Type Workshop 作品 — 在工坊里做一个，它就会出现在这里' : (ui.cat === 'fav' ? '在物品详情里点 ☆ 收藏，常用的会放进快捷栏' : '没有找到')) + '</h5>';
    ui.el.querySelector('.grid').innerHTML = h;
    function card(it) {
      var st = host.status(it), P = previewer(T), src = it.ready === false ? '' : P.cache[it.key];   // a machine not built yet has no model to show
      if (src === undefined) queue.push(it);
      return '<button type="button" class="it' + (ui.sel === it.key ? ' sel' : '') + (it.ready === false ? ' off' : '') + '" data-key="' + esc(it.key) + '">' +
        (src ? '<img alt="" src="' + src + '">' : '<i data-th="' + esc(it.key) + '">' + it.icon + '</i>') + '<span>' + esc(it.name) + '</span>' +
        (st.badge ? '<b class="' + st.cls + '">' + esc(st.badge) + '</b>' : '') + '</button>';
    }
    /* real model thumbnails, a few per frame, so the backpack opens at once */
    var gen = (ui.gen = (ui.gen || 0) + 1);
    (function fill() {
      if (!ui || ui.gen !== gen || ui.el.hidden) return;
      var t0 = performance.now();
      while (queue.length && performance.now() - t0 < 12) {
        var it = queue.shift(), src = thumb(T, it), slot = ui.el.querySelector('[data-th="' + it.key.replace(/"/g, '') + '"]');
        if (src && slot) { var im = document.createElement('img'); im.alt = ''; im.src = src; slot.replaceWith(im); }
      }
      if (queue.length) requestAnimationFrame(fill);
    })();
    preview();
    hotbar(host);
  }
  function selected() { var k = ui.sel; return k ? items().filter(function (x) { return x.key === k; })[0] : null; }
  function preview() {
    var pv = ui.el.querySelector('.pv'), it = selected(), host = ui.host, T = host.THREE;
    cancelAnimationFrame(ui.raf); ui.raf = 0;
    if (!it) { pv.innerHTML = '<p style="margin-top:20px">选一件物品：看它的 3D 模型、尺寸和放置要求，然后一键放进世界。</p><p>桌面：R 旋转 · ←→↑↓ 微调 · Enter 放好 · Esc 取消</p>'; return; }
    var st = host.status(it), PLACE = { floor: '地面 / 展台 / 室外', wall: '墙面', surface: '桌面 / 柜面 / 货架 / 展台' };
    var kindName = { template: '模板 · 可以放多个', owned: '实体作品 · 只有一件', function: '功能物件 · 放好后可进入功能' }[it.kind];
    var h = '<canvas width="480" height="400" aria-label="3D 预览，拖动旋转"></canvas><h4>' + it.icon + ' ' + esc(it.name) + '</h4><dl><dt>类型</dt><dd>' + kindName + '</dd><dt>放置</dt><dd>' + PLACE[it.place || 'surface'] + '</dd>' +
      (it.size ? '<dt>尺寸</dt><dd>' + it.size.map(function (n) { return n.toFixed(2); }).join(' × ') + ' m</dd>' : '') + '<dt>说明</dt><dd>' + esc(it.note || '') + '</dd><dt>状态</dt><dd>' + esc(st.text) + '</dd></dl>';
    var acts = [];
    if (it.ready === false) acts.push('<button type="button" disabled>还没有做</button>');
    else {
      if (it.kind === 'template') acts.push('<button type="button" class="pri" data-bp="place">放一个</button>');
      else if (st.placed) acts.push('<button type="button" class="pri" data-bp="move">移动</button><button type="button" data-bp="stash">收回背包</button>');
      else acts.push('<button type="button" class="pri" data-bp="place">放出来</button>');
      if (it.spec && it.spec.kind === 'machine') acts.push('<button type="button" data-bp="load">装载 List…</button>');
    }
    acts.push('<button type="button" data-bp="fav">' + (isFav(it.key) ? '★ 已收藏' : '☆ 收藏') + '</button>');
    pv.innerHTML = h + '<div class="acts">' + acts.join('') + '</div><div class="lists" hidden></div>';
    /* the turning model */
    var cv = pv.querySelector('canvas'), g2 = cv.getContext('2d'), P = previewer(T), obj = null;
    try { if (it.ready !== false) { obj = objFor(T, it); frameOn(P, T, obj); } } catch (e) {}
    var spin = 0, last = performance.now();
    cv.onpointerdown = function (e) { ui.drag = { x: e.clientX, s: spin }; try { cv.setPointerCapture(e.pointerId); } catch (er) {} };
    cv.onpointermove = function (e) { if (ui.drag) spin = ui.drag.s + (e.clientX - ui.drag.x) * 0.012; };
    cv.onpointerup = cv.onpointercancel = function () { ui.drag = null; };
    (function loop(now) {
      if (!ui || ui.el.hidden || !cv.isConnected) return;
      if (!ui.drag) spin += (now - last) / 1000 * 0.6; last = now;
      if (obj) { P.holder.rotation.y = spin; P.R.setSize(256, 214, false); P.C.aspect = 256 / 214; P.C.updateProjectionMatrix(); P.R.render(P.S, P.C); g2.clearRect(0, 0, cv.width, cv.height); g2.drawImage(P.cv, 0, 0, cv.width, cv.height); P.R.setSize(256, 256, false); P.C.aspect = 1; P.C.updateProjectionMatrix(); }
      ui.raf = requestAnimationFrame(loop);
    })(last);
  }
  function onClick(e) {
    var b = e.target.closest('button'); if (!b || !ui) return;
    var host = ui.host;
    if (b.dataset.cat) { ui.cat = b.dataset.cat; render(); return; }
    if (b.dataset.key) { ui.sel = b.dataset.key; render(); return; }
    var a = b.dataset.bp, it = selected();
    if (a === 'close') { close(); return; }
    if (!it) return;
    if (a === 'fav') { var on = toggleFav(it.key); host.toast(on ? '★ 加入收藏夹和快捷栏' : '已从收藏夹拿出'); render(); return; }
    if (a === 'place' || a === 'move') { touch(it.key); close(); host.place(it, a === 'move'); return; }
    if (a === 'stash') { host.stash(it); render(); return; }
    if (a === 'load') {
      var box = ui.el.querySelector('.lists'), L = lists();
      box.hidden = !box.hidden; if (box.hidden) return;
      var M = machines().filter(function (m) { return 'mc:' + m.id === it.key; })[0], cap = machineCap(M && M.id);
      box.innerHTML = L.length ? L.map(function (l, i) { return '<button type="button" data-list="' + i + '">' + esc(l.title) + ' <small>· ' + l.n + ' 张 · ' + esc(l.board) + (cap && l.n > cap ? ' · 一页 ' + cap + ' 张，共 ' + Math.ceil(l.n / cap) + ' 页' : '') + '</small></button>'; }).join('') : '<p>看板上还没有可以装载的 List</p>';
      box.onclick = function (ev) { var q = ev.target.closest('[data-list]'); if (!q) return; var l = L[+q.dataset.list]; touch(it.key); close(); host.place(Object.assign({}, it, { spec: { kind: 'machine', mx: { type: M.id, bid: l.bid, list: l.id, title: l.title } }, name: it.name + ' · ' + l.title }), false); };
    }
  }
  function machineCap(id) { try { var P = HW().MinestMachines.pure, k = { carousel: 'CAR', rolodex: 'ROL', flip: 'FLP', paternoster: 'PAT' }[id], o = k && P[k]; return o && (o.cap || o.slots || o.cards) || null; } catch (e) { return null; } }
  /* the hotbar: favorites, one tap = quick place */
  function hotbar(host) {
    var hb = document.getElementById('mn-hotbar');
    if (!hb) { hb = document.createElement('div'); hb.id = 'mn-hotbar'; hb.setAttribute('aria-label', '快捷栏'); document.body.appendChild(hb); hb.addEventListener('click', function (e) { var b = e.target.closest('[data-key]'); if (!b || !hb._host) return; var it = catalog(hb._host).filter(function (x) { return x.key === b.dataset.key; })[0]; if (!it) return; touch(it.key); hb._host.place(it, !!hb._host.status(it).placed); }); }
    hb._host = host; css();
    var p = pref(), all = catalog(host), favs = p.fav.map(function (k) { return all.filter(function (x) { return x.key === k; })[0]; }).filter(Boolean).slice(0, 9);
    hb.innerHTML = favs.map(function (it) { var src = previewer(host.THREE).cache[it.key] || (favs.length <= 9 ? thumb(host.THREE, it) : ''); return '<button type="button" data-key="' + esc(it.key) + '" title="' + esc(it.name) + '">' + (src ? '<img alt="" src="' + src + '">' : '<i>' + it.icon + '</i>') + '</button>'; }).join('');
    hb.hidden = !favs.length || !host.hotbarVisible();
  }
  root.MinestBackpack = { VERSION: VERSION, open: open, close: close, isOpen: isOpen, catalog: catalog, model: model, operate: operate, store: store, pref: pref, lists: lists, works: works, hotbar: hotbar, thumb: thumb };
})(window);
