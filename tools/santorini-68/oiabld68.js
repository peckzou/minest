/* minest-oia-bld-68 */
/* Minest · 68 · 圣托里尼：以「整栋 Building」为单位编辑（添加 / 删除 / 移动 / 旋转 / 替换），取代逐块建造。
   How it works (an adapter, the Oia engine and My World are not rewritten):
   · The generated Oia world is deterministic. This layer keeps a per-island record  vox.bld = { m:{id:{dx,dz,rot,gone,as}}, a:[{id,src,x,z,rot}], n }
     and, every time the world is applied (first boot, re-open, after an edit), puts the world back to its generated state and then replays the record:
     it cuts a house out of its footprint (everything from its floor level up), and pastes it somewhere else / turned / as another house / as a copy.
   · Building ids stay stable (b12 …; new copies are u1, u2 …), so rooms, displays and things that My World keeps under p.vox follow the building.
     A deleted building keeps its data (♻ brings the building back with everything in it).
   · world.buildings is kept in step, so the 🚪 door button and the Dollhouse link work at the new place.
   · Landmarks (the blue-domed church, the castle, windmills) are not movable: they carry animated parts of their own. */
(function () {
  'use strict';
  if (window.MinestOiaBld) return;
  var H = null, bOrig = {}, lastSig = null, B0 = null, G0 = null, edit = null, sel = null, panel = null, hl = null, undoOne = null, armDel = 0, toastT = 0;
  var MOVABLE = /^(b\d+|u\d+)$/;
  var KIND = { house: '白屋', cave: '洞穴屋', taverna: '小酒馆' };

  /* ---------------------------------------------------------------- the world: cut / paste */
  function top(w, x, z) { for (var y = w.H - 1; y >= 0; y--) { var b = w.blocks[w.idx(x, y, z)]; if (b !== 0 && b !== w.B.FLOWER) return y + 1; } return 0; }
  function setRec(w, x, y, z, id, c, cols) {
    if (!w.inb(x, y, z)) return; var i = w.idx(x, y, z), k = i;
    if (!(k in bOrig)) bOrig[k] = [w.blocks[i], w.cols[i]];
    w.blocks[i] = id; w.cols[i] = c || 0; cols[x + w.W * z] = 1;
  }
  function snapshot(w, b) {
    var cells = [], maxY = 0;
    for (var y = b.y; y < Math.min(w.H, b.y + 22); y++) for (var z = b.z0; z <= b.z1; z++) for (var x = b.x0; x <= b.x1; x++) {
      var i = w.idx(x, y, z), id = w.blocks[i]; if (id === 0) continue; cells.push([x - b.x0, y - b.y, z - b.z0, id, w.cols[i]]); if (y - b.y > maxY) maxY = y - b.y;
    }
    return { w: b.x1 - b.x0 + 1, d: b.z1 - b.z0 + 1, cells: cells, maxY: maxY, kind: b.kind, floors: b.floors, name: b.name };
  }
  function rotXZ(rx, rz, sw, sd, r) { return r === 0 ? [rx, rz] : r === 1 ? [sd - 1 - rz, rx] : r === 2 ? [sw - 1 - rx, sd - 1 - rz] : [rz, sw - 1 - rx]; }
  function dims(sn, r) { return (r & 1) ? [sn.d, sn.w] : [sn.w, sn.d]; }

  function revert(w, dirty) {
    Object.keys(bOrig).forEach(function (k) {
      var i = +k, o = bOrig[k]; w.blocks[i] = o[0]; w.cols[i] = o[1];
      if (dirty) { var x = i % w.W, z = Math.floor(i / w.W) % w.D; dirty(x, z); }
    });
    bOrig = {};
    if (B0) { w.buildings.length = 0; B0.forEach(function (b) { w.buildings.push(Object.assign({}, b)); }); }
  }

  function sigOf(st) { return JSON.stringify(st || {}); }
  function applyBld(w, dirty, force) {
    if (!w || !w.buildings) return;
    if (!B0) {
      B0 = w.buildings.map(function (b) { return Object.assign({}, b); });
      G0 = new Uint8Array(w.W * w.D);   // generated ground height per column; under a movable house: its floor level
      for (var gz = 0; gz < w.D; gz++) for (var gx = 0; gx < w.W; gx++) G0[gx + w.W * gz] = Math.min(255, top(w, gx, gz));
      B0.forEach(function (b) { if (MOVABLE.test(b.id)) for (var z = b.z0; z <= b.z1; z++) for (var x = b.x0; x <= b.x1; x++) G0[x + w.W * z] = b.y; });
    }
    var st = H && H.bld ? H.bld() : null, sig = (H && H.key ? H.key() : '') + '|' + sigOf(st);
    if (sig === lastSig && !force) return;
    revert(w, dirty); lastSig = sig;
    if (!st) return;
    var m = st.m || {}, adds = st.a || [], cols = {}, ids = Object.keys(m).filter(function (id) { return MOVABLE.test(id) && B0.some(function (b) { return b.id === id; }); });
    var byId = {}; B0.forEach(function (b) { byId[b.id] = b; });
    // 1. snapshots from the generated world (nothing is cut yet)
    var snaps = {};
    function snapOf(id) { if (!snaps[id] && byId[id]) snaps[id] = snapshot(w, byId[id]); return snaps[id]; }
    ids.forEach(function (id) { snapOf(id); if (m[id].as) snapOf(m[id].as); });
    adds.forEach(function (a) { snapOf(a.src); });
    // 2. cut the old places
    ids.forEach(function (id) {
      var b = byId[id], sn = snapOf(id); if (!sn) return;
      for (var y = b.y; y <= b.y + sn.maxY; y++) for (var z = b.z0; z <= b.z1; z++) for (var x = b.x0; x <= b.x1; x++) setRec(w, x, y, z, 0, 0, cols);
    });
    // 3. paste
    var ivory = w.pal(0.95, 0.93, 0.88), list = [];
    function paste(sn, tx, tz, r, baseHint) {
      var d = dims(sn, r), nw = d[0], nd = d[1], base = baseHint;
      if (base == null) { base = 0; for (var z = tz; z < tz + nd; z++) for (var x = tx; x < tx + nw; x++) base = Math.max(base, top(w, x, z)); }
      for (var z2 = tz; z2 < tz + nd; z2++) for (var x2 = tx; x2 < tx + nw; x2++) {
        var t = top(w, x2, z2);
        for (var y = t; y < base; y++) setRec(w, x2, y, z2, w.B.PLASTER, ivory, cols);            // plinth under it
        for (var y2 = base; y2 < Math.min(w.H, Math.max(t, base) + 1); y2++) setRec(w, x2, y2, z2, 0, 0, cols);   // carve above it
      }
      sn.cells.forEach(function (c) { var p = rotXZ(c[0], c[2], sn.w, sn.d, r); setRec(w, tx + p[0], base + c[1], tz + p[1], c[3], c[4], cols); });
      return { x0: tx, z0: tz, x1: tx + nw - 1, z1: tz + nd - 1, y: base };
    }
    var out = {};
    ids.forEach(function (id) {
      var s = m[id], b = byId[id]; if (s.gone) { out[id] = null; return; }
      var src = s.as && snaps[s.as] ? snaps[s.as] : snaps[id], r = (s.rot || 0) & 3, moved = (s.dx || s.dz || r || s.as);
      if (!moved) return;
      var tx = b.x0 + (s.dx || 0), tz = b.z0 + (s.dz || 0);
      var keepBase = (!s.dx && !s.dz && !s.as) ? b.y : (!s.dx && !s.dz ? b.y : null);
      var res = paste(src, tx, tz, r, keepBase); res.id = id; res.kind = s.as && byId[s.as] ? byId[s.as].kind : b.kind; res.floors = src.floors; res.name = b.name; out[id] = res;
    });
    adds.forEach(function (a) {
      var sn = snaps[a.src]; if (!sn) return; var res = paste(sn, a.x, a.z, (a.rot || 0) & 3, null);
      res.id = a.id; res.kind = sn.kind; res.floors = sn.floors; res.name = (KIND[sn.kind] || '建筑') + '（新）'; res.added = 1; out[a.id] = res;
    });
    // 4. the building list follows
    w.buildings.length = 0;
    B0.forEach(function (b) { if (out[b.id] === null) return; w.buildings.push(out[b.id] ? Object.assign({}, b, out[b.id]) : Object.assign({}, b)); });
    adds.forEach(function (a) { if (out[a.id]) w.buildings.push(out[a.id]); });
    // terrain height map of the touched columns (people / shadows read it)
    Object.keys(cols).forEach(function (k) { var i = +k, x = i % w.W, z = Math.floor(i / w.W); if (w.hm) w.hm[i] = Math.min(255, top(w, x, z)); if (dirty) dirty(x, z); });
  }

  /* ---------------------------------------------------------------- checks before a change is kept */
  function planFor(w, st) {   // dry run of the footprints a record would give (no world changes): id -> {x0,z0,x1,z1}
    var res = {}, byId = {}; B0.forEach(function (b) { byId[b.id] = b; });
    var sizes = {}; B0.forEach(function (b) { sizes[b.id] = [b.x1 - b.x0 + 1, b.z1 - b.z0 + 1]; });
    Object.keys(st.m || {}).forEach(function (id) {
      var s = st.m[id], b = byId[id]; if (!b || !MOVABLE.test(id)) return; if (s.gone) { res[id] = null; return; }
      var sz = sizes[s.as || id], r = (s.rot || 0) & 3, d = (r & 1) ? [sz[1], sz[0]] : sz;
      res[id] = { x0: b.x0 + (s.dx || 0), z0: b.z0 + (s.dz || 0), x1: b.x0 + (s.dx || 0) + d[0] - 1, z1: b.z0 + (s.dz || 0) + d[1] - 1 };
    });
    (st.a || []).forEach(function (a) { var sz = sizes[a.src], r = (a.rot || 0) & 3, d = (r & 1) ? [sz[1], sz[0]] : sz; res[a.id] = { x0: a.x, z0: a.z, x1: a.x + d[0] - 1, z1: a.z + d[1] - 1 }; });
    return res;
  }
  function validate(w, st, id) {   // true, or a short reason in Chinese
    var plan = planFor(w, st), me = plan[id]; if (!me) return true;
    if (me.x0 < 3 || me.z0 < 3 || me.x1 > w.W - 4 || me.z1 > w.D - 4) return '到边了';
    for (var oid in plan) { if (oid === id || !plan[oid]) continue; var o = plan[oid]; if (me.x0 <= o.x1 + 1 && me.x1 >= o.x0 - 1 && me.z0 <= o.z1 + 1 && me.z1 >= o.z0 - 1) return '和别的建筑太近';
    }
    var fixed = B0.filter(function (b) { return !MOVABLE.test(b.id); });
    for (var i = 0; i < fixed.length; i++) { var f = fixed[i]; if (me.x0 <= f.x1 + 1 && me.x1 >= f.x0 - 1 && me.z0 <= f.z1 + 1 && me.z1 >= f.z0 - 1) return '挡到地标'; }
    return true;
  }
  function groundCheckAt(w, box, id) {   // slope and water at the target, read from the generated ground (the house itself does not count)
    var lo = 999, hi = 0;
    for (var z = box.z0; z <= box.z1; z++) for (var x = box.x0; x <= box.x1; x++) { var t = G0[x + w.W * z]; lo = Math.min(lo, t); hi = Math.max(hi, t); }
    if (lo <= (w.WATER_Y || 0) + 1) return '那里是水';
    if (hi - lo > 9) return '坡太陡';
    return true;
  }

  /* ---------------------------------------------------------------- UI */
  function sa() { return window.__santorini || null; }
  function world() { var s = sa(); return s && s.world; }
  function toast(t) { if (!panel) return; var n = panel.querySelector('.msg'); n.textContent = t; clearTimeout(toastT); toastT = setTimeout(function () { n.textContent = ''; }, 3200); }
  function bStr(b) { return b ? ((b.name || KIND[b.kind] || '建筑') + ' · ' + b.id) : '（没有选中）'; }
  function curBld(id) { var w = world(); return w && w.buildings.filter(function (b) { return b.id === id; })[0] || null; }
  function frontPoint(d) { var s = sa(), p = s.player.pos, yaw = s.player.yaw; return { x: p.x - Math.sin(yaw) * d, z: p.z - Math.cos(yaw) * d }; }
  function nearestFront() {
    var s = sa(), w = world(); if (!s || !w) return null; var best = null, bd = 1e9;
    [4, 8, 12].forEach(function (d) {
      var f = frontPoint(d); w.buildings.forEach(function (b) {
        if (!MOVABLE.test(b.id)) return; var dx = Math.max(b.x0 - f.x, 0, f.x - (b.x1 + 1)), dz = Math.max(b.z0 - f.z, 0, f.z - (b.z1 + 1)), dd = Math.hypot(dx, dz) + d * 0.15;
        if (dd < bd) { bd = dd; best = b; }
      });
    });
    return bd < 6 ? best : null;
  }
  function commit(fn, id) {   // change the record, check it, keep it or take it back
    var w = world(), cur = H && H.bld ? H.bld() : null; var before = JSON.stringify(cur || { m: {}, a: [], n: 0 });
    var next = JSON.parse(before); fn(next);
    var why = id ? validate(w, next, id) : true;
    if (why === true && id) { var pl = planFor(w, next)[id]; if (pl) { why = groundCheckAt(w, pl, id); } }
    if (why !== true) { toast('不行：' + why); return false; }
    H.bldSet(function (rec) { rec.m = next.m; rec.a = next.a; rec.n = next.n; });
    undoOne = before;
    reapply(); return true;
  }
  function reapply() {
    var s = sa(); if (!s) return; applyBld(s.world, s.markDirty, true);
    // never leave the player inside a wall
    var p = s.player.pos, w = s.world, x = Math.floor(p.x), z = Math.floor(p.z), y = Math.floor(p.y);
    if (w.inb(x, y, z) && w.blocks[w.idx(x, y, z)] !== 0) p.y = top(w, x, z) + 0.01;
    updateHl(); fillPanel();
  }
  function updateHl() {
    var s = sa(); if (!s) return; var b = sel && curBld(sel);
    if (!hl) { var T = window.THREE; if (!T) return; hl = new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(1, 1, 1)), new T.LineBasicMaterial({ color: 0xffd23f, depthTest: false })); hl.renderOrder = 999; hl.visible = false; s.scene.add(hl); }
    if (!edit || !b) { hl.visible = false; return; }
    var hgt = 10; hl.visible = true; hl.scale.set(b.x1 - b.x0 + 3, hgt, b.z1 - b.z0 + 3); hl.position.set((b.x0 + b.x1 + 1) / 2, b.y + hgt / 2, (b.z0 + b.z1 + 1) / 2);
  }
  function axisMove(dir) {   // dir: f / b / l / r relative to where you look
    var yaw = sa().player.yaw, fx = -Math.sin(yaw), fz = -Math.cos(yaw), v = { f: [fx, fz], b: [-fx, -fz], l: [fz, -fx], r: [-fz, fx] }[dir];
    return Math.abs(v[0]) >= Math.abs(v[1]) ? [Math.sign(v[0]), 0] : [0, Math.sign(v[1])];
  }
  var TEMPL = null;
  function templates() { if (TEMPL) return TEMPL; var seen = {}, out = []; B0.forEach(function (b) { if (MOVABLE.test(b.id) && !seen[b.kind + (b.tav ? 't' : '')]) { seen[b.kind] = 1; out.push(b.id); } }); var sizeSeen = {}; B0.forEach(function (b) { var k = b.kind + ':' + (b.x1 - b.x0) + 'x' + (b.z1 - b.z0); if (MOVABLE.test(b.id) && !sizeSeen[k] && out.length < 8) { sizeSeen[k] = 1; if (out.indexOf(b.id) < 0) out.push(b.id); } }); TEMPL = out; return out; }

  var ACT = {
    pick: function () { var b = nearestFront(); if (!b) return toast('先面对一栋房子再点选'); sel = b.id; updateHl(); fillPanel(); },
    mv: function (dir) {
      if (!sel) return toast('先选一栋建筑'); var a = axisMove(dir); var id = sel;
      commit(function (st) { var s = st.m[id] = st.m[id] || {}, ad = (st.a || []).filter(function (q) { return q.id === id; })[0]; if (ad) { ad.x += a[0]; ad.z += a[1]; } else { s.dx = (s.dx || 0) + a[0]; s.dz = (s.dz || 0) + a[1]; } }, id);
    },
    rot: function () {
      if (!sel) return toast('先选一栋建筑'); var id = sel;
      commit(function (st) { var ad = (st.a || []).filter(function (q) { return q.id === id; })[0]; if (ad) ad.rot = ((ad.rot || 0) + 1) & 3; else { var s = st.m[id] = st.m[id] || {}; s.rot = ((s.rot || 0) + 1) & 3; } }, id);
    },
    del: function () {
      if (!sel) return toast('先选一栋建筑');
      if (!armDel) { armDel = 1; fillPanel(); setTimeout(function () { armDel = 0; fillPanel(); }, 3000); return toast('再点一次 🗑 才会删除（里面的房间和展品会保留，可 ♻ 找回）'); }
      armDel = 0; var id = sel;
      commit(function (st) { var ad = (st.a || []).filter(function (q) { return q.id === id; })[0]; if (ad) st.a = st.a.filter(function (q) { return q.id !== id; }); else (st.m[id] = st.m[id] || {}).gone = 1; }, null);
      sel = null; updateHl(); fillPanel();
    },
    rep: function () {
      if (!sel) return toast('先选一栋建筑'); var id = sel, T = templates();
      commit(function (st) {
        var a = (st.a || []).filter(function (q) { return q.id === id; })[0], s = a || (st.m[id] = st.m[id] || {}), cur = a ? a.src : (s.as || id);
        var i = T.indexOf(cur); var nx = T[(i + 1) % T.length]; if (a) a.src = nx; else s.as = (nx === id) ? undefined : nx;
      }, id);
    },
    add: function () {
      var w = world(), T = templates(), srcId = sel ? (function () { var b = curBld(sel); return T.filter(function (t) { var tb = B0.filter(function (q) { return q.id === t; })[0]; return tb && b && tb.kind === b.kind; })[0] || T[0]; })() : T[0];
      var f = frontPoint(7), sz = (function () { var b = B0.filter(function (q) { return q.id === srcId; })[0]; return [b.x1 - b.x0 + 1, b.z1 - b.z0 + 1]; })();
      var ox = Math.round(f.x - sz[0] / 2), oz = Math.round(f.z - sz[1] / 2), ok = false, id = null;
      for (var ring = 0; ring < 8 && !ok; ring++) for (var k = 0; k < 24 && !ok; k++) {
        var ang = k / 24 * 6.2832, x = Math.round(ox + Math.cos(ang) * ring * 3), z = Math.round(oz + Math.sin(ang) * ring * 3);
        var cur = JSON.parse(JSON.stringify(H.bld() || { m: {}, a: [], n: 0 })); cur.n = (cur.n || 0) + 1; id = 'u' + cur.n; cur.a = cur.a || []; cur.a.push({ id: id, src: srcId, x: x, z: z, rot: 0 });
        if (validate(w, cur, id) === true && groundCheckAt(w, { x0: x, z0: z, x1: x + sz[0] - 1, z1: z + sz[1] - 1 }, id) === true) { ok = true; H.bldSet(function (rec) { rec.m = cur.m; rec.a = cur.a; rec.n = cur.n; }); undoOne = null; sel = id; reapply(); toast('已添加一栋 ' + (KIND[B0.filter(function (q) { return q.id === srcId; })[0].kind] || '建筑') + '，走到门口可进入'); }
      }
      if (!ok) toast('附近放不下，换个空地再试');
    },
    back: function () {
      var rec = H && H.bld(); if (!rec) return;
      if (sel && ((rec.m && rec.m[sel]) || (rec.a || []).some(function (q) { return q.id === sel; }))) {
        var id = sel; H.bldSet(function (r) { if (r.m) delete r.m[id]; r.a = (r.a || []).filter(function (q) { return q.id !== id; }); }); reapply(); return toast('这栋已恢复原样');
      }
      var gone = Object.keys(rec.m || {}).filter(function (k) { return rec.m[k].gone; });
      if (gone.length) { var g = gone[gone.length - 1]; H.bldSet(function (r) { delete r.m[g]; }); sel = g; reapply(); toast('找回 ' + g); } else toast('没有可恢复的');
    }
  };

  function fillPanel() {
    if (!panel) return; var b = sel && curBld(sel), rec = H && H.bld && H.bld(), n = rec ? Object.keys(rec.m || {}).length + (rec.a || []).length : 0;
    panel.querySelector('.sel').textContent = '🏗 ' + bStr(b) + (n ? '  · 已改 ' + n : '');
    var del = panel.querySelector('[data-b="del"]'); del.textContent = armDel ? '✓ 确认删除' : '🗑 删除'; del.classList.toggle('warn', !!armDel);
    var mv = panel.querySelectorAll('.mv button'); Array.prototype.forEach.call(mv, function (x) { x.disabled = !b; });
  }
  function css() {
    var s = document.createElement('style'); s.id = 'mn-oia-bld-style';
    s.textContent = [
      '#oia-root .obld-t{position:absolute;z-index:60;left:calc(12px + env(safe-area-inset-left));top:calc(54px + env(safe-area-inset-top));padding:8px 12px;font:800 14px/1 ui-monospace,monospace;color:#fff;background:#3b5b2a;border:3px solid;border-color:#7fb35c #1e3314 #1e3314 #7fb35c;cursor:pointer}',
      '#oia-root .obld-t.on{background:#c98a14;border-color:#ffd77a #7a4f08 #7a4f08 #ffd77a}',
      '#oia-root .obld{position:absolute;z-index:60;left:50%;bottom:calc(14px + env(safe-area-inset-bottom));transform:translateX(-50%);width:min(430px,94vw);background:rgba(18,24,36,.94);border:3px solid #111;color:#fff;padding:10px;font:700 13px/1.3 system-ui,sans-serif;pointer-events:auto}',
      '#oia-root .obld[hidden]{display:none}',
      '#oia-root .obld .sel{font:900 14px/1.2 ui-monospace,monospace;margin-bottom:6px}',
      '#oia-root .obld .msg{min-height:16px;color:#ffd77a;margin-bottom:4px}',
      '#oia-root .obld .row{display:flex;gap:6px;flex-wrap:wrap;margin-top:6px}',
      '#oia-root .obld button{flex:1 0 auto;padding:9px 10px;font:800 14px/1 system-ui;color:#fff;background:#2b3a55;border:3px solid;border-color:#5b6f96 #18233a #18233a #5b6f96;cursor:pointer}',
      '#oia-root .obld button:disabled{opacity:.4}',
      '#oia-root .obld button.warn{background:#a32121}',
      '#oia-root .obld .mv{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:6px}',
      '#oia-root .obld small{display:block;opacity:.75;font-weight:600;margin-top:6px}'
    ].join('\n');
    document.head.appendChild(s);
  }
  function mount() {
    var root = document.getElementById('oia-root'); if (!root || root.querySelector('.obld-t')) return !!root;
    css();
    var t = document.createElement('button'); t.type = 'button'; t.className = 'obld-t'; t.textContent = '🏗 建筑'; root.appendChild(t);
    panel = document.createElement('div'); panel.className = 'obld'; panel.hidden = true;
    panel.innerHTML = '<div class="sel"></div><div class="msg"></div>' +
      '<div class="row"><button data-b="pick">📍 选中面前的建筑</button><button data-b="add">＋ 添加一栋</button></div>' +
      '<div class="mv"><button data-b="mv" data-d="l">◀ 左移</button><button data-b="mv" data-d="f">▲ 前移</button><button data-b="mv" data-d="b">▼ 后移</button><button data-b="mv" data-d="r">右移 ▶</button></div>' +
      '<div class="row"><button data-b="rot">⟳ 旋转</button><button data-b="rep">🔁 替换</button><button data-b="del">🗑 删除</button><button data-b="back">♻ 恢复</button></div>' +
      '<small>整栋编辑：先面对一栋房子点「选中」。键盘 V 选中 · I/K/J/L 前后左右 · C 旋转 · G 替换 · X 删除 · N 添加 · Z 恢复 · B 关闭。里面的房间和展品始终跟着这栋建筑。</small>';
    root.appendChild(panel);
    t.addEventListener('click', function (e) { e.stopPropagation(); toggle(); });
    panel.addEventListener('click', function (e) { e.stopPropagation(); var g = e.target.closest('button'); if (!g || g.disabled) return; var a = g.getAttribute('data-b'); ACT[a](g.getAttribute('data-d')); });
    return true;
  }
  function toggle(on) {
    if (!mount()) return; edit = on == null ? !edit : !!on; panel.hidden = !edit; document.querySelector('#oia-root .obld-t').classList.toggle('on', edit);
    if (edit) { var b = nearestFront(); if (b && !sel) sel = b.id; } updateHl(); fillPanel();
  }
  window.addEventListener('keydown', function (e) {
    if (!window.__oiaOn) return; if (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return; if (e.code === 'KeyB') { toggle(); return; } if (!edit) return;
    var k = { KeyV: ['pick'], KeyI: ['mv', 'f'], KeyK: ['mv', 'b'], KeyJ: ['mv', 'l'], KeyL: ['mv', 'r'], KeyC: ['rot'], KeyG: ['rep'], KeyX: ['del'], KeyN: ['add'], KeyZ: ['back'] }[e.code];
    if (k) { ACT[k[0]](k[1]); e.preventDefault(); }
  });
  setInterval(function () { if (window.__oiaOn && window.__santorini && !panel) mount(); if (edit && window.__oiaOn) { updateHl(); if (!sel) fillPanel(); } }, 400);

  /* ---------------------------------------------------------------- hooks: apply with the world, learn My World's handler */
  function wrap() {
    if (!window.MinestOia || !window.__oiaApply || window.MinestOia.__bld) return !!(window.MinestOia && window.MinestOia.__bld);
    var bind0 = window.MinestOia.bind; window.MinestOia.bind = function (h) { H = h; return bind0.call(window.MinestOia, h); };
    var apply0 = window.__oiaApply; window.__oiaApply = function (w, dirty) { apply0(w, dirty); try { applyBld(w, dirty, false); } catch (e) { if (window.console) console.error('oia-bld', e); } };
    window.MinestOia.__bld = 1; return true;
  }
  if (!wrap()) { var tries = 0, tm = setInterval(function () { if (wrap() || ++tries > 80) clearInterval(tm); }, 250); }

  window.MinestOiaBld = {
    version: '68', toggle: toggle, act: function (a, d) { return ACT[a](d); },
    select: function (id) { sel = id; updateHl(); fillPanel(); }, selected: function () { return sel; },
    record: function () { return H && H.bld ? JSON.parse(JSON.stringify(H.bld() || null)) : null; },
    buildings: function () { var w = world(); return w ? w.buildings.map(function (b) { return Object.assign({}, b); }) : []; },
    reapply: function () { reapply(); }, templates: function () { return B0 ? templates() : []; }
  };
})();
