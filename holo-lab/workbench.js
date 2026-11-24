/* Minest · 全息知识工作台 Holographic Knowledge Workbench — inside 知识星图 (Knowledge Constellation)
   The constellation keeps everything it had (drag empty space to turn it, pinch to zoom, drag a star to move it).
   On top of it, with the user's own Kanban content as the data:
     P0  tap a cluster → open / fold its stars · double-tap → focus (the rest fades) · levels 1–4 ·
         long-press a star → pull its card out of the light; drag it home (it snaps) or double-tap → back
     P1  ✦ on a pulled card: drag onto another star → choose a relation → confirm (only then it is written) ·
         路径 Path: two taps light the chain between them · drop zones while carrying a card:
         资料 Read · 比较 Compare · 投射 Project (opens the Cognitive Toolkit on it)
     P2  拆解 Explode handle (levels move apart; only the handle explodes, pinch always zooms) · 切片 Slice ·
         组合 Combine (carry a card next to a star: magnetic preview → inside / around / related / new group → confirm) ·
         ⧉ on a card: its layers · 时间 Time (what existed then; deletions are not kept) · the view is remembered
   Levels: 1 group (list / subject / board) · 2 item · 3–4 items under a parent (the Knowledge tree's own parents).
   Writes: relations and new groups go to the Cognitive Toolkit's store (records 'kr:' / 'cc:', provenance 'user',
   source 'holo'); inside Minest the page writes them (op 'wb-write'), so the boards themselves are never changed.
   Two histories: the VIEW (↶ ↷) and the EDITS (⟲ ⟳). */
(function () {
  'use strict';
  var HL = window.HL, S = HL && HL.modes && HL.modes.stars, T = window.THREE; if (!S || !T) return;
  var reduce = function () { return HL.layout().settings.reduce; };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  // ---------------------------------------------------------------- the store (Cognitive Toolkit records)
  var PFX = 'minest.lab.kw.', META = 'minest.toolkit.meta', mem = {}, ready = false;
  var back = HL.EMBED ? {
    get: function (k) { return mem[k] ? JSON.parse(JSON.stringify(mem[k])) : null; },
    set: function (k, v) { if (v == null) delete mem[k]; else mem[k] = JSON.parse(JSON.stringify(v)); HL.post({ holo: 1, op: 'wb-write', key: k, value: v == null ? null : v }); },
    keys: function (p) { return Object.keys(mem).filter(function (k) { return k.indexOf(p) === 0; }); }
  } : {   // opened on its own: the toolkit's own local store (same origin on the web)
    get: function (k) { try { var v = localStorage.getItem(PFX + k); return v ? JSON.parse(v) : null; } catch (e) { return null; } },
    set: function (k, v) { try { if (v == null) localStorage.removeItem(PFX + k); else localStorage.setItem(PFX + k, JSON.stringify(v)); var m = JSON.parse(localStorage.getItem(META) || '{}'); m[k] = Date.now(); localStorage.setItem(META, JSON.stringify(m)); } catch (e) {} },
    keys: function (p) { var o = []; try { for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k && k.indexOf(PFX + p) === 0) o.push(k.slice(PFX.length)); } } catch (e) {} return o; }
  };
  var ks = window.MinestKS ? window.MinestKS.create(back) : null;
  if (!HL.EMBED) ready = true;
  HL.onWB = function (m) { if (m.data && typeof m.data === 'object') { mem = m.data; ready = true; if (HL.active === S && S.nodes.length) S.build(true); } };
  function askStore() { if (HL.EMBED) HL.post({ holo: 1, op: 'wb-get' }); }
  askStore();
  var REL = ks ? ks.REL : [], RELBY = ks ? ks.RELBY : {};

  // ---------------------------------------------------------------- state
  var W = S.wb = {}, nodes = [], meta = [];   // meta[i]: { depth, parent, kids[], disp: Vector3, va, pulled, t }
  var level = 2, expanded = {}, slice = null, xp = 0, timeT = null, showLinks = true;
  var pathMode = false, pathA = -1, path = null, edits = [], redone = [], viewHist = [], viewFut = [];
  var held = [], cmp = [], magnet = -1, tMin = 0, tMax = Date.now();
  var _v = new T.Vector3();

  function refOf(i) { var n = nodes[i]; if (!n) return null; return n.wbConcept ? 'cc:' + n.wbConcept : 'hl:' + n.uid; }
  function idxOfRef(ref) { for (var i = 0; i < nodes.length; i++) if (refOf(i) === ref) return i; return -1; }
  function titleOf(ref) { if (!ref) return ''; if (ref.indexOf('cc:') === 0) return ks ? ks.label(ref.slice(3)) : ref; var i = idxOfRef(ref); return i >= 0 ? nodes[i].it.title : ref.replace(/^hl:[a-z]+:/, ''); }
  function rels() { return ks ? ks.relations().filter(function (r) { return idxOfRef(r.from) >= 0 && idxOfRef(r.to) >= 0 && (!timeT || (r.created_at || 0) <= timeT); }) : []; }

  // ---------------------------------------------------------------- build: hierarchy + my groups as extra stars
  W.onBuild = function (ns, es) {
    nodes = ns;
    // my groups (toolkit concepts made here) become stars of their own, joined to their members
    if (ks && ready) {
      var groups = {};
      ks.relations().forEach(function (r) { if (r.source_ref === 'holo' && r.type === 'belongs-to' && r.to.indexOf('cc:') === 0 && r.from.indexOf('hl:') === 0) groups[r.to.slice(3)] = 1; });
      Object.keys(groups).forEach(function (cid) {
        var c = ks.getConcept(cid); if (!c) return;
        var it = { kind: 'group', id: 'cc:' + cid, uid: 'cc:' + cid, title: ks.label(c), text: '', tags: [], groupTitle: '我的组合 My groups' };
        ns.push({ uid: 'cc:' + cid, it: it, hub: true, members: [], color: '#7fffc8', wbConcept: cid, v: new T.Vector3(), adj: [], p: new T.Vector3((Math.random() - 0.5) * 1.2, (Math.random() - 0.5) * 0.6, (Math.random() - 0.5) * 0.8) });
        var gi = ns.length - 1;
        ks.relations({ node: 'cc:' + cid }).forEach(function (r) { var mi = -1; for (var k = 0; k < gi; k++) if ('hl:' + ns[k].uid === r.from) mi = k; if (mi >= 0) { es.push([mi, gi, 2]); ns[mi].adj.push(gi); ns[gi].adj.push(mi); ns[gi].members.push(ns[mi].it); } });
      });
    }
    var byId = {}; ns.forEach(function (n, i) { if (!n.hub) byId[n.it.id] = i; });
    var hubOf = {}; ns.forEach(function (n, i) { if (n.hub && !n.wbConcept) hubOf[n.it.id] = i; });
    meta = ns.map(function (n, i) { return { depth: n.hub ? 1 : 2, parent: -1, kids: [], disp: n.p.clone(), va: 0, t: +n.it.t || 0 }; });
    ns.forEach(function (n, i) {
      if (n.hub) return;
      var par = -1; (n.it.parents || []).some(function (pid) { var j = byId[pid]; if (j != null && j !== i) { par = j; return true; } return false; });
      if (par < 0) par = hubOf[n.it.group] != null ? hubOf[n.it.group] : -1;
      meta[i].parent = par;
    });
    function depth(i, guard) { var m = meta[i]; if (m.parent < 0 || guard > 6) return m.depth; if (nodes[m.parent].hub) return 2; return Math.min(4, depth(m.parent, guard + 1) + 1); }
    ns.forEach(function (n, i) { if (!n.hub) meta[i].depth = depth(i, 0); if (meta[i].parent >= 0) meta[meta[i].parent].kids.push(i); });
    ns.forEach(function (n, i) { if (n.hub) { var ts = meta[i].kids.map(function (k) { return meta[k].t; }).filter(Boolean); meta[i].t = n.wbConcept ? ((ks.getConcept(n.wbConcept) || {}).created_at || 0) : (ts.length ? Math.min.apply(0, ts) : 0); } });
    var ts = meta.map(function (m) { return m.t; }).filter(Boolean); tMin = ts.length ? Math.min.apply(0, ts) : Date.now() - 864e5; tMax = Date.now();
    held.forEach(function (h) { var j = -1; ns.forEach(function (n, k) { if (n.uid === h.uid) j = k; }); h.i = j; if (j >= 0) meta[j].pulled = true; });
    path = null; pathA = -1;
    if (!ns.some(function (n) { return expanded[n.uid]; })) setLevel(level, true);   // a different constellation (e.g. a Wikipedia map): open it to the current level
    buildBeams();
  };

  // ---------------------------------------------------------------- visibility, display position
  function shownTarget(i) {
    var m = meta[i]; if (!m) return 1;
    if (m.pulled) return 0;
    if (timeT && m.t && m.t > timeT) return 0;
    if (slice && !slice[m.depth]) return 0;
    var p = m.parent, hops = 0; while (p >= 0 && hops++ < 12) { if (!expanded[nodes[p].uid] && !(slice && !slice[meta[p].depth])) return 0; p = meta[p].parent; }   // hops: a cycle of parents must not hang the page
    if (m.depth > level && !slice) return 0;
    return 1;
  }
  function base(i) { var p = nodes[i].p; if (!xp) return p; var f = 1 + xp * 0.75 * (meta[i].depth - 1); return _v.set(p.x * f, p.y * (1 + xp * 0.35 * (meta[i].depth - 1)), p.z * f); }
  W.beforeUpdate = function (dt) {
    var k = reduce() ? 1 : 1 - Math.exp(-dt * 7);
    for (var i = 0; i < nodes.length; i++) {
      var m = meta[i]; if (!m) continue;
      var tv = shownTarget(i); m.va += (tv - m.va) * k;
      var tgt; if (tv) tgt = base(i); else { var p = m.parent; while (p >= 0 && shownTarget(p) < 1) p = meta[p].parent; tgt = p >= 0 ? meta[p].disp : (m.pulled ? base(i) : nodes[i].p); }
      m.disp.x += (tgt.x - m.disp.x) * k; m.disp.y += (tgt.y - m.disp.y) * k; m.disp.z += (tgt.z - m.disp.z) * k;
    }
  };
  W.pos = function (i) { return meta[i] ? meta[i].disp : nodes[i] ? nodes[i].p : S.nodes[i].p; };   // between a rebuild and its onBuild
  W.vis = function (i) { return meta[i] ? meta[i].va : 1; };
  W.hi = function (i) { if (!path) return pathA === i ? 1.6 : 1; return path.some(function (st) { return st.i === i; }) ? 1.5 : 0.18; };

  // ---------------------------------------------------------------- typed relation beams (their own line set)
  var beams = null, beamBag = [];
  function buildBeams() {
    if (beams && S.root) S.root.remove(beams); beamBag.forEach(function (x) { try { x.dispose(); } catch (e) {} }); beamBag = []; beams = null;
    if (!S.root) return;
    var MAX = 400, g = new T.BufferGeometry(), pos = new Float32Array(MAX * 6), col = new Float32Array(MAX * 6);
    g.setAttribute('position', new T.BufferAttribute(pos, 3).setUsage(T.DynamicDrawUsage)); g.setAttribute('color', new T.BufferAttribute(col, 3).setUsage(T.DynamicDrawUsage)); g.setDrawRange(0, 0);
    var mt = new T.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.95, blending: T.AdditiveBlending, depthWrite: false });
    beamBag.push(g, mt); beams = new T.LineSegments(g, mt); beams.frustumCulled = false; S.root.add(beams);
  }
  var _c = new T.Color();
  W.afterUpdate = function (dt, t) {
    if (!beams) buildBeams(); if (!beams) return;
    var g = beams.geometry, pos = g.attributes.position.array, col = g.attributes.color.array, n = 0, MAX = pos.length / 6;
    function seg(a, b, color, k) { if (n >= MAX) return; var A = W.pos(a), B = W.pos(b); pos.set([A.x, A.y, A.z, B.x, B.y, B.z], n * 6); _c.set(color).multiplyScalar(k); col.set([_c.r, _c.g, _c.b, _c.r, _c.g, _c.b], n * 6); n++; }
    if (showLinks) rels().forEach(function (r) {
      var a = idxOfRef(r.from), b = idxOfRef(r.to); if (a < 0 || b < 0) return; var va = Math.min(W.vis(a), W.vis(b)); if (va < 0.05) return;
      var onP = path && path.some(function (st, k) { return k && ((st.i === a && path[k - 1].i === b) || (st.i === b && path[k - 1].i === a)); });
      var pulse = r.__new ? 1.6 : 1; seg(a, b, (RELBY[r.type] || {}).color || '#9fb4ff', va * pulse * (path && !onP ? 0.15 : 1) * (0.75 + 0.25 * Math.sin(t * 3 + a)));
    });
    if (path) path.forEach(function (st, k) { if (k) seg(st.i, path[k - 1].i, '#ffe28a', 1.3); });
    g.setDrawRange(0, n * 2); g.attributes.position.needsUpdate = true; g.attributes.color.needsUpdate = true;
    placeHandCards();
  };

  // ---------------------------------------------------------------- levels, expand, focus, view history
  function setLevel(L, quiet) {
    if (!quiet) remember();
    level = L; expanded = {};
    nodes.forEach(function (n, i) { if (meta[i] && meta[i].depth < L && meta[i].kids.length) expanded[n.uid] = true; });
    if (!quiet) { HL.refreshTools(); saveView(); }
  }
  function toggle(i) { remember(); var u = nodes[i].uid; expanded[u] = !expanded[u]; if (!expanded[u]) foldBelow(i); if (expanded[u] && meta[i].depth >= level) level = Math.min(4, meta[i].depth + 1); HL.refreshTools(); saveView(); }
  function foldBelow(i) { meta[i].kids.forEach(function (k) { delete expanded[nodes[k].uid]; foldBelow(k); }); }
  function snap() { var c = HL.cam.g; return JSON.stringify({ az: c.az, el: c.el, dist: c.dist, tgt: [c.tgt.x, c.tgt.y, c.tgt.z], level: level, expanded: expanded, focus: S.focus >= 0 && nodes[S.focus] ? nodes[S.focus].uid : null }); }
  function remember() { var s = snap(); if (viewHist[viewHist.length - 1] !== s) { viewHist.push(s); if (viewHist.length > 50) viewHist.shift(); viewFut = []; } }
  function restore(s) { var o = JSON.parse(s), c = HL.cam.g; c.az = o.az; c.el = o.el; c.dist = o.dist; c.tgt.set(o.tgt[0], o.tgt[1], o.tgt[2]); level = o.level; expanded = o.expanded; S.focus = -1; if (o.focus) nodes.forEach(function (n, i) { if (n.uid === o.focus) S.setFocus(i, true); }); HL.refreshTools(); }
  function saveView() { try { localStorage.setItem('minest.holo.wb', JSON.stringify({ level: level, expanded: expanded })); } catch (e) {} }
  (function loadView() { try { var v = JSON.parse(localStorage.getItem('minest.holo.wb') || 'null'); if (v) { level = v.level || 2; expanded = v.expanded || {}; } } catch (e) {} })();

  // taps: single on a cluster folds / opens it, single on a leaf shows its detail, double = focus (wins over single)
  var lastTap = { i: -1, t: 0 }, tapT = 0;
  W.tap = function (h) {
    if (!h) return false;
    var i = h.i, now = performance.now();
    if (pathMode) { pathPick(i); return true; }
    if (lastTap.i === i && now - lastTap.t < 330) { clearTimeout(tapT); lastTap = { i: -1, t: 0 }; remember(); S.setFocus(i); return true; }
    lastTap = { i: i, t: now }; clearTimeout(tapT);
    tapT = setTimeout(function () {
      lastTap.i = -1; if (!nodes[i]) return;
      if (meta[i] && meta[i].kids.length) toggle(i);
      else HL.detail.open(nodes[i].it, { sub: (nodes[i].it.groupTitle || '') + ' · 双击聚焦 double-tap to focus' });
    }, 300);
    return true;
  };

  // ---------------------------------------------------------------- path between two stars
  function graph() {
    var adj = {}; function link(a, b, l, back) { (adj[a] = adj[a] || []).push({ to: b, l: l }); (adj[b] = adj[b] || []).push({ to: a, l: back }); }
    S.edges.forEach(function (e) { var L = e[2] === 2 ? ['属于 belongs to', '包含 contains'] : e[2] ? ['相同标签/词 shared tag', '相同标签/词 shared tag'] : ['在 in', '包含 contains']; link(e[0], e[1], L[0], L[1]); });
    rels().forEach(function (r) { var R = RELBY[r.type] || { label: r.type, inverse: r.type }; link(idxOfRef(r.from), idxOfRef(r.to), R.label, R.inverse); });
    return adj;
  }
  function findPath(a, b) {
    var adj = graph(), prev = {}, seen = {}, q = [a]; seen[a] = 1;
    while (q.length) { var x = q.shift(); if (x === b) break; (adj[x] || []).forEach(function (e) { if (!seen[e.to]) { seen[e.to] = 1; prev[e.to] = { from: x, l: e.l }; q.push(e.to); } }); }
    if (!seen[b]) return null;
    var out = [{ i: b }], c = b; while (c !== a) { var p = prev[c]; out[0].via = p.l; out.unshift({ i: p.from }); c = p.from; }
    return out;
  }
  function pathText(p) { return p.map(function (st, k) { return (k ? ' —' + st.via + '→ ' : '') + nodes[st.i].it.title; }).join(''); }
  function pathPick(i) {
    if (pathA < 0) { pathA = i; path = null; bar('路径：再点第二颗星 · Path: tap a second star'); return; }
    if (i === pathA) return;
    var p = findPath(pathA, i); pathA = -1; remember();
    if (!p) { bar('这两颗星之间还没有路径 · No path yet'); return; }
    path = p; p.forEach(function (st) { var q = meta[st.i].parent; while (q >= 0) { expanded[nodes[q].uid] = true; q = meta[q].parent; } });
    bar(pathText(p));
  }

  // ---------------------------------------------------------------- the overlay: hand, zones, panel, confirm, bars
  var ov = document.createElement('div'); ov.id = 'wb'; ov.setAttribute('aria-live', 'polite');
  ov.innerHTML = '<div class="wb-zones" aria-hidden="true"><div class="wb-zone" data-zone="read"><b>📖</b><span>资料 Read</span></div><div class="wb-zone" data-zone="compare"><b>⚖</b><span>比较 Compare</span><em></em></div><div class="wb-zone" data-zone="project"><b>🔮</b><span>投射 Project</span></div></div>' +
    '<div class="wb-hand"></div><button type="button" class="wb-backall" hidden>↺ 全部放回 Put all back</button>' +
    '<div class="wb-bar" hidden><span></span><button type="button" data-x aria-label="Clear">✕</button></div>' +
    '<div class="wb-slider wb-xp" hidden><span>拆解控制柄 Explode</span><input type="range" min="0" max="100" value="0"></div>' +
    '<div class="wb-slider wb-time" hidden><span>时间 Time</span><input type="range" min="0" max="1000" value="1000"><b>现在 Now</b></div>' +
    '<svg class="wb-tmp" aria-hidden="true"></svg><aside class="wb-panel glass" hidden></aside><div class="wb-confirm glass" hidden></div>';
  document.body.appendChild(ov);
  var hand = ov.querySelector('.wb-hand'), tmp = ov.querySelector('.wb-tmp'), panel = ov.querySelector('.wb-panel'), confirmBox = ov.querySelector('.wb-confirm');
  function bar(t) { var b = ov.querySelector('.wb-bar'); b.hidden = !t; b.querySelector('span').textContent = t || ''; }
  ov.querySelector('.wb-bar [data-x]').onclick = function () { path = null; pathA = -1; pathMode = false; bar(''); HL.refreshTools(); };
  function active() { return HL.active === S; }
  function syncOverlay() { ov.style.display = active() && (!HL.boot || HL.boot.state !== 'idle') ? '' : 'none'; }   // nothing over the console until it boots
  setInterval(syncOverlay, 400);

  // screen positions
  function screenOf(i) { return HL.screenOf(S.root.localToWorld(W.pos(i).clone())); }
  function homeOf(i) { return HL.screenOf(S.root.localToWorld(base(i).clone())); }

  // long-press on a star → pull its card out (the constellation's own drag still moves stars when you drag at once)
  var canvas = HL.renderer.domElement, lp = 0, lpAt = null;
  canvas.addEventListener('pointerdown', function (e) {
    if (!active() || !HL.contentReady) return; var h = S.pick(e.clientX, e.clientY); if (!h) return;
    lpAt = { x: e.clientX, y: e.clientY, id: e.pointerId, i: h.i }; clearTimeout(lp);
    lp = setTimeout(function () {
      if (!lpAt) return; var a = lpAt; lpAt = null;
      try { canvas.dispatchEvent(new PointerEvent('pointercancel', { pointerId: a.id, bubbles: true })); } catch (x) {}   // end the constellation's own gesture
      S.dragging = false; nodes[a.i].pinned = false;
      pull(a.i, a.x, a.y, a.id);
    }, 480);
  });
  canvas.addEventListener('pointermove', function (e) { if (lpAt && e.pointerId === lpAt.id && Math.hypot(e.clientX - lpAt.x, e.clientY - lpAt.y) > 7) { clearTimeout(lp); lpAt = null; } });
  ['pointerup', 'pointercancel'].forEach(function (t) { canvas.addEventListener(t, function (e) { if (lpAt && e.pointerId === lpAt.id) { clearTimeout(lp); lpAt = null; } }); });

  function cardHTML(i) {
    var n = nodes[i], it = n.it, m = meta[i], K = HL.KIND[it.kind] || [it.kind, ''];
    var rs = ks ? ks.relations({ node: refOf(i) }).length : 0;
    return '<button type="button" class="wb-cx" title="拆成多层 Explode into layers">⧉</button><i class="wb-handle" title="拖动以建立连接 Drag to connect">✦</i>' +
      '<small>' + esc(K[0]) + ' · L' + m.depth + '</small><b>' + esc(it.title) + '</b>' + (it.text ? '<p>' + esc(String(it.text).slice(0, 120)) + '</p>' : '') +
      '<p class="dim">' + (n.hub ? (n.members || []).length + ' 项 · ' : '') + n.adj.length + ' 条连线 · ' + rs + ' 个关系</p><span class="wb-cact"><em>单击：查看详情 · 双击或拖回原处：放回</em></span>';
  }
  function pull(i, x, y, pid) {
    var m = meta[i]; if (!m || m.pulled) return;
    m.pulled = true;
    var c = document.createElement('div'); c.className = 'wb-card glass'; c.style.setProperty('--h', nodes[i].color || '#9fd8ff'); c.innerHTML = cardHTML(i);
    var it = { i: i, uid: nodes[i].uid, el: c, x: x, y: y }; hand.appendChild(c); held.push(it); place(it); ov.querySelector('.wb-backall').hidden = false;
    try { if (navigator.vibrate) navigator.vibrate(12); } catch (e) {}
    wireCard(it);
    if (pid == null || pid < 0) return;
    var mv = function (e) { if (e.pointerId !== pid) return; it.x = e.clientX; it.y = e.clientY; place(it); ov.classList.add('carrying'); zoneHover(e.clientX, e.clientY); magnetHover(it); };
    var en = function (e) { if (e.pointerId !== pid) return; window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', en); window.removeEventListener('pointercancel', en); ov.classList.remove('carrying'); drop(it, e.clientX, e.clientY); };
    window.addEventListener('pointermove', mv); window.addEventListener('pointerup', en); window.addEventListener('pointercancel', en);
  }
  function place(it) { it.el.style.transform = 'translate(' + Math.round(it.x) + 'px,' + Math.round(it.y) + 'px) translate(-50%,-50%)' + (it.el.classList.contains('docked') ? ' scale(.62)' : ''); }
  function placeHandCards() {}
  function maybeHome(it) { var h = homeOf(it.i); if (!h.behind && Math.hypot(h.x - it.x, h.y - it.y) < 80) putBack(it); }
  function putBack(it) {
    var h = homeOf(it.i); it.el.classList.add('going'); it.x = h.x; it.y = h.y; place(it);
    setTimeout(function () { it.el.remove(); }, reduce() ? 0 : 260);
    held.splice(held.indexOf(it), 1); cmp = cmp.filter(function (c) { return c !== it; }); paintCmp(); if (meta[it.i]) meta[it.i].pulled = false;
    ov.querySelector('.wb-backall').hidden = !held.length;
  }
  ov.querySelector('.wb-backall').onclick = function () { held.slice().forEach(putBack); };
  function wireCard(it) {
    var p0 = null, last = 0, cn = null;
    it.el.addEventListener('click', function (e) { if (e.target.closest('.wb-cx')) { e.stopPropagation(); openLayers(it.i); } });
    it.el.addEventListener('pointerdown', function (e) {
      e.stopPropagation(); if (e.target.closest('.wb-cx')) return; try { it.el.setPointerCapture(e.pointerId); } catch (x) {}
      if (e.target.closest('.wb-handle')) { cn = { id: e.pointerId }; it.el.classList.add('linking'); return; }
      p0 = { x: e.clientX, y: e.clientY, ox: it.x, oy: it.y, id: e.pointerId }; hand.appendChild(it.el);
    });
    it.el.addEventListener('pointermove', function (e) {
      if (cn && e.pointerId === cn.id) { var tgt = starAt(e.clientX, e.clientY, it); tmp.setAttribute('viewBox', '0 0 ' + innerWidth + ' ' + innerHeight); tmp.innerHTML = '<line x1="' + it.x + '" y1="' + it.y + '" x2="' + e.clientX + '" y2="' + e.clientY + '"/>' + (tgt >= 0 ? '<circle cx="' + e.clientX + '" cy="' + e.clientY + '" r="18"/>' : ''); return; }
      if (!p0 || e.pointerId !== p0.id) return; it.x = p0.ox + e.clientX - p0.x; it.y = p0.oy + e.clientY - p0.y; place(it);
      if (Math.hypot(e.clientX - p0.x, e.clientY - p0.y) > 10) { ov.classList.add('carrying'); zoneHover(e.clientX, e.clientY); magnetHover(it); }
    });
    it.el.addEventListener('pointerup', function (e) {
      if (cn) { cn = null; it.el.classList.remove('linking'); tmp.innerHTML = ''; var tgt = starAt(e.clientX, e.clientY, it); if (tgt >= 0) confirmLink(it.i, tgt); else HL.toast('把光线拖到另一颗星上 · Drop it on another star'); return; }
      if (!p0) return; var moved = Math.hypot(e.clientX - p0.x, e.clientY - p0.y); p0 = null; ov.classList.remove('carrying');
      if (moved > 10) return drop(it, e.clientX, e.clientY);
      var now = performance.now();
      if (now - last < 330) { last = 0; clearTimeout(it.t); return putBack(it); }
      last = now; clearTimeout(it.t); it.t = setTimeout(function () { last = 0; HL.detail.open(nodes[it.i].it, { sub: '已抽出 · pulled out' }); }, 340);
    });
  }
  function starAt(x, y, it) {
    var h = S.pick(x, y); if (h && h.i !== it.i && refOf(h.i)) return h.i;
    var prev = it.el.style.pointerEvents; it.el.style.pointerEvents = 'none'; var el = document.elementFromPoint(x, y); it.el.style.pointerEvents = prev;
    var ce = el && el.closest('.wb-card'); if (ce) for (var k = 0; k < held.length; k++) if (held[k].el === ce && held[k] !== it) return held[k].i;
    return -1;
  }

  // zones
  function zoneAt(x, y) { var z = null; ov.querySelectorAll('.wb-zone').forEach(function (el) { var r = el.getBoundingClientRect(); if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) z = el.getAttribute('data-zone'); }); return z; }
  function zoneHover(x, y) { var z = zoneAt(x, y); ov.querySelectorAll('.wb-zone').forEach(function (el) { el.classList.toggle('hot', el.getAttribute('data-zone') === z); }); }
  function paintCmp() { ov.querySelector('[data-zone=compare] em').textContent = cmp.length ? cmp.length + '/2' : ''; }
  // combine: a card carried next to another star is pulled in (magnetic preview)
  function magnetAt(it) {
    var h = homeOf(it.i); if (!h.behind && Math.hypot(h.x - it.x, h.y - it.y) < 80) return -1;
    var best = -1, bd = 54;
    nodes.forEach(function (n, i) { if (i === it.i || W.vis(i) < 0.5) return; var s = screenOf(i); if (s.behind) return; var d = Math.hypot(s.x - it.x, s.y - it.y); if (d < bd) { bd = d; best = i; } });
    held.forEach(function (o) { if (o === it) return; var d = Math.hypot(o.x - it.x, o.y - it.y); if (d < 70 && d < bd + 14) { bd = d; best = o.i; } });
    return best;
  }
  function magnetHover(it) { var m = magnetAt(it); if (m !== magnet) { magnet = m; held.forEach(function (o) { o.el.classList.toggle('magnet', o.i === m); }); it.el.classList.toggle('magnetic', m >= 0); if (m >= 0) { var s = screenOf(m); ring(s.x, s.y); } else ring(); } }
  var ringEl = document.createElement('i'); ringEl.className = 'wb-ring'; ov.appendChild(ringEl);
  function ring(x, y) { ringEl.style.display = x == null ? 'none' : ''; if (x != null) ringEl.style.transform = 'translate(' + x + 'px,' + y + 'px) translate(-50%,-50%)'; }
  function drop(it, x, y) {
    var z = zoneAt(x, y); ov.querySelectorAll('.wb-zone').forEach(function (el) { el.classList.remove('hot'); });
    var mg = z ? -1 : magnetAt(it); magnet = -1; ring(); it.el.classList.remove('magnetic'); held.forEach(function (o) { o.el.classList.remove('magnet'); });
    if (z === 'read') return openRead(it.i);
    if (z === 'project') return openProject(it.i);
    if (z === 'compare') {
      if (cmp.indexOf(it) < 0) cmp.push(it); if (cmp.length > 2) cmp.shift().el.classList.remove('docked');
      var zr = ov.querySelector('[data-zone=compare]').getBoundingClientRect(); cmp.forEach(function (c, k) { c.el.classList.add('docked'); c.x = zr.right + 95; c.y = zr.top + 20 + k * 46; place(c); });
      paintCmp(); if (cmp.length === 2) openCompare(cmp[0].i, cmp[1].i); else HL.toast('再拖一张卡到“比较” · Now a second card'); return;
    }
    if (mg >= 0) return chooseCombine(it.i, mg);
    maybeHome(it);
  }

  // ---------------------------------------------------------------- confirmed edits (relations, groups) + their history
  function relExists(a, b, type) { return ks.relations().some(function (r) { return r.type === type && ((r.from === a && r.to === b) || (RELBY[type].sym && r.from === b && r.to === a)); }); }
  function needStore() { if (!ks) { HL.toast('知识存储还没准备好 · The store is not ready'); return false; } if (!ready) { askStore(); HL.toast('正在连接 Minest… 请再试一次 · Connecting, try again'); return false; } return true; }
  function confirmLink(a, b) {
    if (!needStore()) return;
    var from = a, to = b;
    function body() {
      confirmBox.innerHTML = '<h4>新连接 New link</h4><p><b>' + esc(nodes[from].it.title) + '</b> → <b>' + esc(nodes[to].it.title) + '</b></p><label>类型 Type<select>' + REL.map(function (r) { return '<option value="' + r.id + '">' + esc(r.label) + '</option>'; }).join('') + '</select></label>' +
        '<label>备注（选填）Note<input maxlength="200"></label><p class="dim">确认之前不会保存 · Nothing is saved until you confirm.</p><div class="row"><button type="button" class="primary" data-ok>确认并保存</button><button type="button" data-rev>反转 Reverse</button><button type="button" data-no>取消</button></div>';
    }
    body(); confirmBox.hidden = false;
    confirmBox.onclick = function (e) {
      var bt = e.target.closest('button'); if (!bt) return;
      if (bt.hasAttribute('data-rev')) { var t = from; from = to; to = t; var keep = confirmBox.querySelector('select').value; body(); confirmBox.querySelector('select').value = keep; return; }
      if (bt.hasAttribute('data-ok')) {
        var type = confirmBox.querySelector('select').value, note = confirmBox.querySelector('input').value.trim(), fr = refOf(from), tt = refOf(to);
        if (relExists(fr, tt, type)) HL.toast('已经有这种连接了 · Already linked that way');
        else { var r = ks.relate(fr, tt, type, { provenance: 'user', source_ref: 'holo', note: note }); r.__new = 1; setTimeout(function () { r.__new = 0; }, 1600); edits.push({ op: 'relate', r: r }); redone = []; HL.toast('连接已保存 · Link saved'); HL.refreshTools(); }
      }
      confirmBox.hidden = true;
    };
  }
  function chooseCombine(a, b) {
    if (!needStore()) return;
    var name = nodes[a].it.title + ' & ' + nodes[b].it.title;
    confirmBox.innerHTML = '<h4>组合 Combine</h4><p><b>' + esc(nodes[a].it.title) + '</b> + <b>' + esc(nodes[b].it.title) + '</b></p>' +
      '<label class="chk"><input type="radio" name="cb" value="in" checked> 把第一个放进第二个（属于）</label><label class="chk"><input type="radio" name="cb" value="out"> 把第二个放进第一个</label>' +
      '<label class="chk"><input type="radio" name="cb" value="rel"> 并列（相关）</label><label class="chk"><input type="radio" name="cb" value="group"> 为两者建一个新组</label>' +
      '<label class="wb-gname" hidden>组名 Group name<input maxlength="80" value="' + esc(name) + '"></label><p class="dim">确认之前不会保存 · Nothing is saved until you confirm.</p>' +
      '<div class="row"><button type="button" class="primary" data-ok>确认并保存</button><button type="button" data-no>取消</button></div>';
    confirmBox.hidden = false;
    confirmBox.onchange = function () { confirmBox.querySelector('.wb-gname').hidden = confirmBox.querySelector('[name=cb]:checked').value !== 'group'; };
    confirmBox.onclick = function (e) {
      var bt = e.target.closest('button'); if (!bt) return;
      if (bt.hasAttribute('data-ok')) {
        var how = confirmBox.querySelector('[name=cb]:checked').value, ra = refOf(a), rb = refOf(b), made = [], newC = null;
        function rel(f, t, ty) { if (!relExists(f, t, ty)) made.push(ks.relate(f, t, ty, { provenance: 'user', source_ref: 'holo', note: '在知识星图中组合' })); }
        if (how === 'in') rel(ra, rb, 'belongs-to'); else if (how === 'out') rel(rb, ra, 'belongs-to'); else if (how === 'rel') rel(ra, rb, 'related');
        else { var gname = (confirmBox.querySelector('.wb-gname input').value || name).trim(), cid = ks.concept(gname, { kind: 'concept', provenance: 'user' }); newC = cid; rel(ra, 'cc:' + cid, 'belongs-to'); rel(rb, 'cc:' + cid, 'belongs-to'); }
        if (!made.length) HL.toast('已经有这种连接了 · Already linked that way');
        else { edits.push({ op: 'batch', rels: made, concept: newC }); redone = []; if (newC) S.build(true); HL.toast('已组合并保存 · Combined and saved'); HL.refreshTools(); }
      }
      confirmBox.hidden = true;
    };
  }
  function undoEdit() { var e = edits.pop(); if (!e) return; (e.op === 'relate' ? [e.r] : e.rels).forEach(function (r) { ks.unrelate(r.id); }); redone.push(e); if (e.concept) S.build(true); HL.toast('已撤销编辑 · Edit undone'); HL.refreshTools(); }
  function redoEdit() { var e = redone.pop(); if (!e) return; function again(r) { return ks.relate(r.from, r.to, r.type, { provenance: 'user', source_ref: 'holo', note: r.note }); } if (e.op === 'relate') e.r = again(e.r); else e.rels = e.rels.map(again); edits.push(e); if (e.concept) S.build(true); HL.toast('已重做编辑 · Edit redone'); HL.refreshTools(); }

  // ---------------------------------------------------------------- panels: Read · Compare · Project · ⧉ layers
  function openPanel(html, cls) { panel.className = 'wb-panel glass ' + (cls || ''); panel.innerHTML = '<button type="button" class="wb-pclose" aria-label="Close">×</button>' + html; panel.hidden = false; }
  panel.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    if (b.classList.contains('wb-pclose')) { panel.hidden = true; if (panel.classList.contains('compare')) { cmp.forEach(function (c) { c.el.classList.remove('docked'); }); cmp = []; paintCmp(); } return; }
    if (b.hasAttribute('data-open')) { var it = nodes[+b.getAttribute('data-open')].it; if (HL.openItem) HL.openItem(it); return; }
    if (b.hasAttribute('data-tk')) { var i = +b.getAttribute('data-i'); HL.post({ holo: 1, op: 'toolkit', input: nodes[i].it.title, card: b.getAttribute('data-tk') || null }); return; }
    if (b.hasAttribute('data-cmplink')) { confirmLink(panel._cmp[0], panel._cmp[1]); return; }
  });
  function relListHTML(ref) {
    if (!ks) return ''; var rs = ks.relations({ node: ref }); if (!rs.length) return '<p class="dim">还没有关系 · No links yet.</p>';
    var by = {}; rs.forEach(function (r) { var out = r.from === ref, R = RELBY[r.type] || { label: r.type, inverse: r.type, color: '#9fb4ff' }, k = out ? R.label : R.inverse; (by[k] = by[k] || { c: R.color, l: [] }).l.push({ o: out ? r.to : r.from, r: r }); });
    return Object.keys(by).map(function (k) { return '<h5 style="color:' + by[k].c + '">' + esc(k) + '</h5><ul>' + by[k].l.map(function (x) { return '<li>' + esc(titleOf(x.o)) + (x.r.note ? ' <small>· ' + esc(x.r.note) + '</small>' : '') + '</li>'; }).join('') + '</ul>'; }).join('');
  }
  function tagz(a) { return a.length ? a.map(function (x) { return '<span class="tag">' + esc(x) + '</span>'; }).join(' ') : '<span class="dim">—</span>'; }
  function openRead(i) {
    var n = nodes[i], it = n.it, m = meta[i], K = HL.KIND[it.kind] || [it.kind];
    var par = m.parent >= 0 ? nodes[m.parent].it.title : null;
    openPanel('<small class="wb-pk">知识页面 Knowledge page</small><h2>' + esc(it.title) + '</h2><p class="dim">' + esc(K[0]) + ' · L' + m.depth + (it.groupTitle ? ' · ' + esc(it.groupTitle) : '') + '</p>' +
      (it.text ? '<p>' + esc(it.text) + '</p>' : '') +
      (par ? '<h4>属于 Belongs to</h4>' + tagz([par]) : '') + (m.kids.length ? '<h4>包含 Contains</h4>' + tagz(m.kids.slice(0, 30).map(function (k) { return nodes[k].it.title; })) : '') +
      ((it.tags || []).length ? '<h4>标签 Tags</h4>' + tagz(it.tags) : '') +
      '<h4>相连 Linked</h4>' + tagz(n.adj.filter(function (j, k, a) { return a.indexOf(j) === k; }).slice(0, 24).map(function (j) { return nodes[j].it.title; })) +
      '<h4>关系 Relations</h4>' + relListHTML(refOf(i)) +
      '<div class="row">' + (!n.hub && HL.openItem ? '<button type="button" data-open="' + i + '">打开原卡 Open the card</button>' : '') + '<button type="button" data-tk="" data-i="' + i + '">在认知工具箱中思考 Think it through</button></div>', 'read');
  }
  function neighbours(i) { var s = {}; nodes[i].adj.forEach(function (j) { s[j] = 1; }); return s; }
  function openCompare(a, b) {
    var na = neighbours(a), nb = neighbours(b), both = Object.keys(na).filter(function (k) { return nb[k]; }).map(Number);
    var ta = (nodes[a].it.tags || []).map(function (x) { return x.toLowerCase(); }), tb = (nodes[b].it.tags || []).map(function (x) { return x.toLowerCase(); });
    var tagsBoth = ta.filter(function (x) { return tb.indexOf(x) >= 0; }), direct = ks ? ks.relations().filter(function (r) { return (r.from === refOf(a) && r.to === refOf(b)) || (r.from === refOf(b) && r.to === refOf(a)); }) : [];
    var p = findPath(a, b);
    function col(i, only) { var it = nodes[i].it; return '<div class="wb-cc"><small>' + esc((HL.KIND[it.kind] || [it.kind])[0]) + '</small><b>' + esc(it.title) + '</b>' + (it.text ? '<p>' + esc(String(it.text).slice(0, 140)) + '</p>' : '') + '<h5>只在这里 Only here</h5>' + tagz(only.slice(0, 12)) + '</div>'; }
    var oa = Object.keys(na).filter(function (k) { return !nb[k] && +k !== b; }).map(function (k) { return nodes[+k].it.title; }), ob = Object.keys(nb).filter(function (k) { return !na[k] && +k !== a; }).map(function (k) { return nodes[+k].it.title; });
    openPanel('<small class="wb-pk">比较 Compare</small><div class="wb-cmp">' + col(a, oa) + '<div class="wb-cmid"><h5>共同相连 Shared</h5>' + tagz(both.map(function (k) { return nodes[k].it.title; })) +
      '<h5>共同标签 Shared tags</h5>' + tagz(tagsBoth) + '<h5>直接关系 Direct links</h5>' + (direct.length ? tagz(direct.map(function (r) { return (RELBY[r.type] || {}).label || r.type; })) : '<span class="dim">无 None</span>') +
      '<h5>路径 Path</h5><p>' + (p ? esc(pathText(p)) : '<span class="dim">还没有路径 · No path yet</span>') + '</p></div>' + col(b, ob) + '</div><div class="row"><button type="button" class="primary" data-cmplink>连接它们… Link them</button></div>', 'compare');
    panel._cmp = [a, b];
  }
  function openProject(i) {
    var it = nodes[i].it;
    openPanel('<small class="wb-pk">投射 Project</small><h2>' + esc(it.title) + '</h2><p class="dim">投射到认知工具箱，在那里用思维模型或实验来思考它。 · Project it into the Cognitive Toolkit.</p><div class="wb-proj">' +
      '<button type="button" class="wb-pj" data-tk="models" data-i="' + i + '"><b>思维模型 Thinking Models</b><span>因果、系统、多元视角、苏格拉底式定义…</span></button>' +
      '<button type="button" class="wb-pj" data-tk="lab" data-i="' + i + '"><b>思维实验室 Thinking Lab</b><span>康德、洛克、柏拉图、亚里士多德、黑格尔</span></button>' +
      '<button type="button" class="wb-pj" data-tk="compass" data-i="' + i + '"><b>思想罗盘 Thought Compass</b><span>它属于哪里？</span></button></div>', 'project');
  }
  function openLayers(i) {
    var old = ov.querySelector('.wb-layers'); if (old) old.remove();
    var n = nodes[i], it = n.it, m = meta[i], L = [
      ['身份 Identity', '<b>' + esc(it.title) + '</b><p>' + esc((HL.KIND[it.kind] || [it.kind])[0]) + ' · L' + m.depth + (it.groupTitle ? ' · ' + esc(it.groupTitle) : '') + '</p>'],
      ['内容 Content', it.text ? '<p>' + esc(it.text) + '</p>' : '<span class="dim">—</span>'],
      ['结构 Structure', '<h5>属于</h5>' + tagz(m.parent >= 0 ? [nodes[m.parent].it.title] : []) + '<h5>包含</h5>' + tagz(m.kids.slice(0, 20).map(function (k) { return nodes[k].it.title; }))],
      ['关系 Relations', relListHTML(refOf(i))],
      ['标签与相连 Tags & links', tagz((it.tags || []).concat(n.adj.slice(0, 12).map(function (j) { return nodes[j].it.title; })))]];
    var box = document.createElement('div'); box.className = 'wb-layers';
    box.innerHTML = '<button type="button" class="wb-lyx" aria-label="Close">×</button>' + L.map(function (l, k) { return '<section class="wb-ly glass" data-k="' + k + '" style="--h:' + (n.color || '#9fd8ff') + '"><small>' + (k + 1) + ' · ' + l[0] + '</small><div>' + l[1] + '</div></section>'; }).join('');
    ov.appendChild(box); var order = L.map(function (_, k) { return k; });
    function lay() { order.forEach(function (idx, k) { var el = box.querySelector('[data-k="' + idx + '"]'); el.style.transform = 'translate3d(' + (k * 26) + 'px,' + (-k * 30) + 'px,' + (-k * 70) + 'px) rotateY(-14deg)'; el.style.zIndex = String(50 - k); el.classList.toggle('front', k === 0); }); }
    requestAnimationFrame(function () { box.classList.add('on'); lay(); });
    box.addEventListener('click', function (e) { if (e.target.closest('.wb-lyx')) { box.remove(); return; } var s = e.target.closest('.wb-ly'); if (!s) return; var k = +s.getAttribute('data-k'); order = [k].concat(order.filter(function (x) { return x !== k; })); lay(); });
  }

  // ---------------------------------------------------------------- sliders
  ov.querySelector('.wb-xp input').addEventListener('input', function (e) { xp = +e.target.value / 100; });
  ov.querySelector('.wb-time input').addEventListener('input', function (e) { var v = +e.target.value; timeT = v >= 1000 ? null : tMin + (tMax - tMin) * v / 1000; ov.querySelector('.wb-time b').textContent = timeT ? new Date(timeT).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '现在 Now'; });

  // ---------------------------------------------------------------- the toolbar (in the constellation's own tool strip)
  W.tools = function (box) {
    var ui = HL.ui; ui.sep(box);
    [1, 2, 3, 4].forEach(function (L) {
      var lab = ['L1 分组', 'L2 条目', 'L3 下级', 'L4 更下级'][L - 1];
      ui.chip(box, lab, slice ? !!slice[L] : L === level, function () {
        if (slice) { remember(); slice[L] = !slice[L]; if (!Object.keys(slice).some(function (k) { return slice[k]; })) slice[L] = true; nodes.forEach(function (n, i) { if (meta[i] && meta[i].kids.length) expanded[n.uid] = true; }); HL.refreshTools(); }
        else setLevel(L);
      }, slice ? '切片：显示/隐藏这一层 · Slice: show or hide this level' : '显示到第 ' + L + ' 层 · Show levels up to ' + L);
    });
    ui.sep(box);
    ui.chip(box, '连接', showLinks, function () { showLinks = !showLinks; HL.refreshTools(); }, '显示关系光线 · Show links');
    ui.chip(box, '路径', pathMode, function () { pathMode = !pathMode; if (!pathMode) { path = null; pathA = -1; bar(''); } else bar('路径：点第一颗星 · Path: tap the first star'); HL.refreshTools(); }, '追踪两颗星之间的路径 · Trace a path');
    ui.chip(box, '拆解', !ov.querySelector('.wb-xp').hidden, function () { var x = ov.querySelector('.wb-xp'); x.hidden = !x.hidden; if (x.hidden) { xp = 0; x.querySelector('input').value = 0; } HL.refreshTools(); }, '拆解控制柄 · Explode handle');
    ui.chip(box, '切片', !!slice, function () { remember(); slice = slice ? null : { 1: true, 2: true, 3: true, 4: true }; if (slice) nodes.forEach(function (n, i) { if (meta[i] && meta[i].kids.length) expanded[n.uid] = true; }); HL.toast(slice ? '切片：点 L1–L4 显示或隐藏 · Slice on' : '切片关闭 · Slice off'); HL.refreshTools(); }, '只显示选中的层级 · Slice');
    ui.chip(box, '时间', !ov.querySelector('.wb-time').hidden, function () { var x = ov.querySelector('.wb-time'); x.hidden = !x.hidden; if (x.hidden) { timeT = null; x.querySelector('input').value = 1000; x.querySelector('b').textContent = '现在 Now'; } HL.refreshTools(); }, '回到过去 · Time');
    ui.sep(box);
    ui.chip(box, '↶', false, function () { if (!viewHist.length) return; viewFut.push(snap()); restore(viewHist.pop()); }, '视图后退 · View back');
    ui.chip(box, '↷', false, function () { if (!viewFut.length) return; viewHist.push(snap()); restore(viewFut.pop()); }, '视图前进 · View forward');
    ui.chip(box, '⟲ 编辑', false, undoEdit, '撤销编辑 · Undo edit');
    ui.chip(box, '⟳', false, redoEdit, '重做编辑 · Redo edit');
  };
  W.exit = function () { held.slice().forEach(function (it) { it.el.remove(); }); held = []; cmp = []; panel.hidden = true; confirmBox.hidden = true; bar(''); ov.querySelector('.wb-backall').hidden = true; };
  addEventListener('keydown', function (e) {
    if (!active()) return;
    if (e.key === 'Escape') { if (!confirmBox.hidden) { confirmBox.hidden = true; e.stopImmediatePropagation(); } else if (!panel.hidden) { panel.hidden = true; e.stopImmediatePropagation(); } else if (path || pathMode) { path = null; pathA = -1; pathMode = false; bar(''); HL.refreshTools(); e.stopImmediatePropagation(); } }
  }, true);
  window.HoloWorkbench = { pull: function (i) { var s = screenOf(i); pull(i, s.x + 90, s.y, -1); }, held: held, findPath: findPath, pathPick: pathPick, toggle: toggle, setLevel: setLevel, confirmLink: confirmLink, chooseCombine: chooseCombine,
    openRead: openRead, openCompare: openCompare, openProject: openProject, openLayers: openLayers, drop: drop, undo: undoEdit, redo: redoEdit, setExplode: function (v) { xp = v; }, setTime: function (t) { timeT = t; },
    setSlice: function (s) { slice = s; }, meta: function () { return meta; }, nodes: function () { return nodes; }, ks: function () { return ks; }, magnetAt: magnetAt, ready: function () { return ready; } };
})();
