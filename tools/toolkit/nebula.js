/* Minest · Holographic Knowledge Workbench — P0: the knowledge nebula (window.MinestNebula)
   The user's whole knowledge system as a 3D nebula of clusters, built from the toolkit's knowledge objects:
     level 1  domain       (top of the taxonomy)          — where the objects are placed
     level 2  place        (the next taxonomy level)
     level 3  thought      (a knowledge object)
     level 4  concept      (the object's concepts)
   P0 is view-only — nothing here writes knowledge. Gestures (conflicts resolved as agreed):
     drag empty space → rotate 360° (inertia) · pinch / wheel → zoom · tap a cluster → expand / collapse ·
     double-tap a node → focus (it comes to the centre, the rest fades; double-tap empty space or ✕ to leave) ·
     long-press a node → pull its card out of the nebula · drag the card back near its place → it snaps home ·
     double-tap a pulled card → back · tap a pulled card → open it in the five cards · level slider → show levels 1–4.
   Two separate histories: the VIEW history (back / forward) and the EDIT history (undo / redo of links made here).
   P1 (on pulled cards): drag the card's ✦ handle onto another node → choose a relation → confirm (only then it is
   written, provenance 'user', source 'nebula') · Path mode: tap two nodes → the chain that joins them lights up ·
   drop zones while carrying a card: Read (a wiki-style knowledge page) · Compare (two cards side by side with a
   comparison structure) · Project (the thinking models and experiments for it, opened in the toolkit).
   P2: Explode handle (levels move apart in space; only this handle explodes — pinch always zooms) · Slice (show
   any chosen levels, e.g. only thoughts) · Combine (carry a card next to another node: a magnetic preview, then
   choose how — inside it, around it, related, or a new group — and confirm; undoable) · ⧉ on a pulled card: its
   exploded layers · Time (drag back in time: what existed then — records have no history of deletions) ·
   the view (angle, zoom, levels, open clusters) is remembered on this device. */
(function (root) {
  'use strict';
  var COLS = ['philosophy', 'knowledge', 'nature', 'psychology', 'society', 'systems', 'life'];
  var HUE = { philosophy: '#b388ff', knowledge: '#7fb2ff', nature: '#59d98e', psychology: '#ffad66', society: '#3fd8d8', systems: '#ff7a8f', life: '#f2d16b' };

  // ---------------------------------------------------------------- the tree (pure: testable without a DOM)
  function tree(ks, C, opts) {
    opts = opts || {};
    var rootN = { id: 'root', kind: 'root', label: 'My knowledge', depth: 0, children: [], parent: null };
    var by = { root: rootN };
    function add(parent, id, kind, label, extra) {
      if (by[id]) return by[id];
      var n = { id: id, kind: kind, label: label, depth: parent.depth + 1, children: [], parent: parent };
      for (var k in extra || {}) n[k] = extra[k];
      parent.children.push(n); by[id] = n; return n;
    }
    ks.objects().forEach(function (ko) {
      var p = ko.placement || {}, place = (p.confirmed && p.confirmed.primary) || (p.suggested && p.suggested.primary) || null;
      var path = place ? C.path(place) : [], top = path[0] || 'unplaced';
      var d1 = add(rootN, 'd:' + top, 'domain', top === 'unplaced' ? 'Not placed yet' : (C.node(top) || {}).en || top, { domain: top, hue: HUE[top] || '#9aa4c7' });
      var p2 = path[1] || null;
      var d2 = add(d1, 'p:' + (p2 || top + ':general'), 'place', p2 ? (C.node(p2) || {}).en : (top === 'unplaced' ? 'Unplaced thoughts' : 'General'), { domain: top, hue: d1.hue, place: p2 });
      var t3 = add(d2, 'ko:' + ko.id, 'thought', ko.title, { domain: top, hue: d1.hue, ko: ko.id, confirmed: !!p.confirmed, t: ko.created_at || 0 });
      ks.conceptsOf(ko.id).forEach(function (c) {
        add(t3, 'cc:' + c.id + '@' + ko.id, 'concept', ks.label(c), { domain: top, hue: d1.hue, ko: ko.id, concept: c.id, ckind: c.kind, topic: c.id === ko.root_concept, t: Math.max(c.created_at || 0, ko.created_at || 0) });
      });
    });
    rootN.children.sort(function (a, b) { return COLS.indexOf(a.domain) - COLS.indexOf(b.domain); });
    (function stamp(n) { n.children.forEach(stamp); if (n.t == null) n.t = n.children.length ? Math.min.apply(0, n.children.map(function (c) { return c.t; })) : 0; })(rootN);   // a cluster exists from its first thought
    return { root: rootN, by: by };
  }

  // ---------------------------------------------------------------- layout: clusters on spheres around their parent
  function fib(i, n) { var y = 1 - (i + 0.5) / n * 2, r = Math.sqrt(1 - y * y), t = i * Math.PI * (3 - Math.sqrt(5)); return [Math.cos(t) * r, y, Math.sin(t) * r]; }
  var RAD = [0, 320, 175, 115, 70];
  function layout(T) {
    (function place(n, dir) {
      var kids = n.children, k = kids.length;
      kids.forEach(function (c, i) {
        var v;
        if (n.depth === 0) { if (k > 8) v = fib(i, k); else { var an = -Math.PI / 2 + i / k * Math.PI * 2, vz = 0.35 * Math.sin(2 * an), L0 = Math.hypot(1, vz); v = [Math.cos(an) / L0, Math.sin(an) / L0, vz / L0]; } }   // a few domains: a ring facing you
        else {   // a cap of directions pointing away from the centre, so clusters grow outwards
          var f = fib(i, Math.max(k, 3) * 2 + 1); v = [f[0] * 1.1 + dir[0] * 0.9, f[1] * 1.1 + dir[1] * 0.9, f[2] * 1.1 + dir[2] * 0.9];
          var L = Math.hypot(v[0], v[1], v[2]) || 1; v = [v[0] / L, v[1] / L, v[2] / L];
        }
        var r = RAD[c.depth] * (n.depth === 0 ? 1 : 1 + Math.min(k, 12) * 0.04);
        c.home = [n.home[0] + v[0] * r, n.home[1] + v[1] * r, n.home[2] + v[2] * r];
        place(c, v);
      });
    })(Object.assign(T.root, { home: [0, 0, 0] }), [0, 0, 1]);
    return T;
  }

  // ---------------------------------------------------------------- the view
  function open(TK, opts) {
    opts = opts || {};
    var ks = TK.ks, C = TK.C, esc = TK.esc, tr = function (s) { return root.MinestI18n ? MinestI18n.t(s) : s; };
    var reduce = root.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    var T = layout(tree(ks, C)), nodes = Object.keys(T.by).map(function (k) { return T.by[k]; });
    var view = { yaw: -0.4, pitch: 0.25, zoom: 1, level: 2, focus: null, expanded: {} };
    var vy = 0, vp = 0, raf = 0, alive = true, dirty = true, hist = [], fut = [];
    nodes.forEach(function (n) { n.pos = n.home.slice(); n.vis = n.depth <= 1 ? 1 : 0; n.alpha = n.vis; });

    var ov = document.createElement('div'); ov.className = 'nb-ov'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-label', 'Holographic Knowledge Workbench');
    ov.innerHTML = '<div class="nb-stage"><div class="nb-glow"></div><div class="nb-layer"></div><svg class="nb-lines" aria-hidden="true"></svg></div>' +
      '<svg class="nb-tmp" aria-hidden="true"></svg>' +
      '<header class="nb-top"><div><b>Holographic Workbench</b><small>Knowledge nebula</small></div>' +
      '<div class="nb-tools"><button type="button" data-links class="on" title="Show links">Links</button><button type="button" data-path title="Trace a path between two nodes">Path</button><button type="button" data-xp title="Explode the levels apart">Explode</button><button type="button" data-slice title="Show only the levels you choose">Slice</button><button type="button" data-time title="Go back in time">Time</button></div>' +
      '<div class="nb-hist" title="View history"><span>View</span><button type="button" data-hb title="View back" aria-label="View back">↶</button><button type="button" data-hf title="View forward" aria-label="View forward">↷</button></div>' +
      '<div class="nb-hist nb-edits" title="Edit history"><span>Edits</span><button type="button" data-eu title="Undo edit" aria-label="Undo edit">⟲</button><button type="button" data-er title="Redo edit" aria-label="Redo edit">⟳</button></div>' +
      '<button type="button" class="nb-x" aria-label="Close">×</button></header>' +
      '<div class="nb-levels" role="group" aria-label="Levels"><span>Levels</span>' + [1, 2, 3, 4].map(function (l) { return '<button type="button" data-lv="' + l + '">' + ['Domains', 'Places', 'Thoughts', 'Concepts'][l - 1] + '</button>'; }).join('') + '</div>' +
      '<div class="nb-focus" hidden><span></span><button type="button" data-unfocus aria-label="Leave focus">✕</button></div>' +
      '<div class="nb-hand"></div><button type="button" class="nb-backall" hidden>↺ Put all back</button>' +
      '<p class="nb-help">Drag to rotate · pinch to zoom · tap a cluster to open it · double-tap to focus · long-press to pull a card out</p>' +
      '<div class="nb-pathbar" hidden><span></span><button type="button" data-pathclear aria-label="Clear path">✕</button></div>' +
      '<div class="nb-zones" aria-hidden="true"><div class="nb-zone" data-zone="read"><b>📖</b><span>Read</span></div><div class="nb-zone" data-zone="compare"><b>⚖</b><span>Compare</span><em></em></div><div class="nb-zone" data-zone="project"><b>🔮</b><span>Project</span></div></div>' +
      '<aside class="nb-panel" hidden></aside><div class="nb-confirm" hidden></div>' +
      '<div class="nb-xpbar" hidden><span>Explode handle</span><input type="range" min="0" max="100" value="0" aria-label="Explode handle"></div>' +
      '<div class="nb-timebar" hidden><span>Time</span><input type="range" min="0" max="1000" value="1000" aria-label="Time"><b></b></div>' +
      (nodes.length <= 1 ? '<div class="nb-empty"><b>Your nebula is empty</b><p>Explore a thought in the toolkit first — each one becomes a star here.</p></div>' : '');
    document.body.appendChild(ov);
    var stage = ov.querySelector('.nb-stage'), layer = ov.querySelector('.nb-layer'), lines = ov.querySelector('.nb-lines'), hand = ov.querySelector('.nb-hand');
    function makeEls() {
      layer.innerHTML = '';
      nodes.forEach(function (n) {
        var e = document.createElement('div'); e.className = 'nb-n k-' + n.kind + (n.topic ? ' topic' : ''); e.style.setProperty('--h', n.hue || '#c9b8ff');
        e.innerHTML = '<i></i><span>' + esc(tr(n.label)) + (n.children.length && n.depth > 0 ? '<em>' + n.children.length + '</em>' : '') + '</span>';
        e._n = n; n.el = e; layer.appendChild(e);
      });
    }
    makeEls();
    // after a confirmed change the nebula is rebuilt in place (ids are stable, so open clusters stay open)
    function rebuild() {
      var old = {}; nodes.forEach(function (n) { old[n.id] = n; });
      T = layout(tree(ks, C)); nodes = Object.keys(T.by).map(function (k) { return T.by[k]; });
      nodes.forEach(function (n) { var o = old[n.id]; n.pos = o ? o.pos.slice() : (n.parent && old[n.parent.id] ? old[n.parent.id].pos.slice() : n.home.slice()); n.alpha = o ? o.alpha : 0; n.pulled = o ? o.pulled : false; });
      held.forEach(function (it) { var nn = T.by[it.n.id]; if (nn) { nn.pulled = true; it.n = nn; } });
      makeEls(); buildRefs(); dirty = true;
    }

    // ---------------------------------------------------------------- P1 state: links, path, edits
    var showLinks = true, pathMode = false, pathA = null, path = null, edits = [], redone = [], cmp = [];
    var xp = 0, slice = null, timeT = null, magnet = null;
    var tMin = Math.min.apply(0, nodes.filter(function (n) { return n.t; }).map(function (n) { return n.t; }).concat([Date.now()])), tMax = Date.now();
    var tmp = ov.querySelector('.nb-tmp'), panel = ov.querySelector('.nb-panel'), confirmBox = ov.querySelector('.nb-confirm');
    function refOf(n) { if (!n) return null; if (n.kind === 'concept') return 'cc:' + n.concept; if (n.kind === 'thought') { var k = ks.object(n.ko); return k && k.root_concept ? 'cc:' + k.root_concept : null; } return null; }
    var byRef = {};
    function buildRefs() { byRef = {}; nodes.forEach(function (n) { var r = refOf(n); if (r) (byRef[r] = byRef[r] || []).push(n); }); }
    buildRefs();
    function linkRels() { return ks.relations().filter(function (r) { return byRef[r.from] && byRef[r.to]; }); }
    function shown(n) { return n.alpha > 0.05 && !n.pulled; }
    function pick(ref) { var L = byRef[ref] || []; for (var i = 0; i < L.length; i++) if (shown(L[i])) return L[i]; return null; }
    function heldOf(ref) { for (var i = 0; i < held.length; i++) if (refOf(held[i].n) === ref) return held[i]; return null; }
    // the chain between two nodes: tree edges, the same concept under several thoughts, and every typed relation
    function findPath(a, b) {
      var adj = {};
      function link(x, y, label, back) { (adj[x.id] = adj[x.id] || []).push({ to: y, label: label }); (adj[y.id] = adj[y.id] || []).push({ to: x, label: back }); }
      nodes.forEach(function (n) { if (n.parent && n.parent.depth > 0) link(n, n.parent, 'belongs to', 'contains'); });
      Object.keys(byRef).forEach(function (r) { var L = byRef[r]; for (var i = 1; i < L.length; i++) link(L[0], L[i], 'same concept', 'same concept'); });
      linkRels().forEach(function (r) { var R = ks.RELBY[r.type]; byRef[r.from].forEach(function (x) { byRef[r.to].forEach(function (y) { link(x, y, R.label, R.inverse); }); }); });
      var prev = {}, seen = {}, q = [a]; seen[a.id] = 1;
      while (q.length) { var x = q.shift(); if (x === b) break; (adj[x.id] || []).forEach(function (e) { if (!seen[e.to.id]) { seen[e.to.id] = 1; prev[e.to.id] = { from: x, label: e.label }; q.push(e.to); } }); }
      if (!seen[b.id]) return null;
      var steps = [{ n: b }], c = b; while (c !== a) { var pv = prev[c.id]; steps[0].via = pv.label; steps.unshift({ n: pv.from }); c = pv.from; }
      return steps;
    }
    function inPath(n) { return !path || path.some(function (st) { return st.n === n; }); }

    // ---------------------------------------------------------------- visibility, focus, projection
    function visible(n) { if (n.depth === 0) return true; if (n.pulled) return false; if (timeT && n.t > timeT) return false; if (slice && !slice[n.depth]) return false; var p = n.parent; while (p) { if (p.depth > 0 && !view.expanded[p.id]) return false; if (p.depth === 0 && !view.expanded.root) return false; p = p.parent; } return true; }
    function inFocus(n) { if (!view.focus) return true; var f = T.by[view.focus]; if (!f) return true; var p = n; while (p) { if (p === f) return true; p = p.parent; } p = f; while (p) { if (p === n) return true; p = p.parent; } return false; }
    view.expanded.root = true;
    function center() { var f = view.focus && T.by[view.focus]; return f ? f.pos : [0, 0, 0]; }
    var W = 0, H = 0, P = 900;
    function size() { var b = stage.getBoundingClientRect(); W = b.width; H = b.height; }
    function project(p, c) {
      var x = p[0] - c[0], y = p[1] - c[1], z = p[2] - c[2], cy = Math.cos(view.yaw), sy = Math.sin(view.yaw), cp = Math.cos(view.pitch), sp = Math.sin(view.pitch);
      var x1 = x * cy - z * sy, z1 = x * sy + z * cy, y1 = y * cp - z1 * sp, z2 = y * sp + z1 * cp;
      var k = view.zoom * Math.min(W, H) / 900, zz = z2 * k, s = P / (P + zz);
      return { x: W / 2 + x1 * k * s, y: H / 2 + y1 * k * s, s: s, z: zz };
    }
    function frame() {
      if (!alive) return;
      var moving = Math.abs(vy) > 0.0001 || Math.abs(vp) > 0.0001;
      if (moving && !drag) { view.yaw += vy; view.pitch = clampP(view.pitch + vp); vy *= 0.93; vp *= 0.93; dirty = true; }
      nodes.forEach(function (n) {
        var tv = (visible(n) || (path && inPath(n) && !n.pulled)) ? 1 : 0, ta = tv * (inFocus(n) ? 1 : 0.1) * (inPath(n) ? 1 : 0.12);
        var hx = xp ? exploded(n) : n.home, tgt = tv ? hx : (n.parent ? n.parent.pos : n.home), k = reduce ? 1 : 0.18;
        for (var i = 0; i < 3; i++) { var d = tgt[i] - n.pos[i]; if (Math.abs(d) > 0.05) { n.pos[i] += d * k; dirty = true; } else n.pos[i] = tgt[i]; }
        if (Math.abs(ta - n.alpha) > 0.01) { n.alpha += (ta - n.alpha) * (reduce ? 1 : 0.2); dirty = true; } else n.alpha = ta;
        n.vis = tv;
      });
      if (dirty) draw();
      dirty = false;
      raf = requestAnimationFrame(frame); clearTimeout(fb); fb = setTimeout(function () { if (alive) frame(); }, 60);
    }
    var fb = 0;
    // the explode handle: every level moves outward by its own amount, so the clusters separate layer by layer
    function exploded(n) { var f = 1 + xp * 0.7 * n.depth; return [n.home[0] * f, n.home[1] * f, n.home[2] * f]; }
    function visParent(n) { var p = n.parent; while (p && p.depth > 0 && p.alpha < 0.05) p = p.parent; return p; }
    function clampP(p) { return Math.max(-1.35, Math.min(1.35, p)); }
    function draw() {
      if (!W) size();
      var c = center(), L = '';
      nodes.forEach(function (n) { n.pr = project(n.pos, c); });
      nodes.forEach(function (n) {
        var e = n.el, pr = n.pr, a = n.alpha;
        if (a < 0.02) { e.style.display = 'none'; return; }
        e.style.display = '';
        var base = [1.5, 1.15, 0.92, 0.8, 0.68][n.depth];
        e.style.transform = 'translate(' + pr.x.toFixed(1) + 'px,' + pr.y.toFixed(1) + 'px) translate(-50%,-50%) scale(' + (pr.s * base).toFixed(3) + ')';
        e.style.opacity = (a * Math.max(0.25, Math.min(1, pr.s * 1.1))).toFixed(3);
        e.style.zIndex = String(1000 - Math.round(pr.z));
        e.classList.toggle('open', !!view.expanded[n.id]);
        var vpN = visParent(n);
        if (vpN && vpN.depth > 0 && n.depth > 1 && a > 0.05) { var q = vpN.pr; L += '<line x1="' + q.x.toFixed(1) + '" y1="' + q.y.toFixed(1) + '" x2="' + pr.x.toFixed(1) + '" y2="' + pr.y.toFixed(1) + '" style="stroke:' + (n.hue || '#9fb4ff') + ';opacity:' + (a * 0.45).toFixed(2) + '"/>'; }
        else if (n.depth === 1 && a > 0.05) { var r0 = T.root.pr; L += '<line x1="' + r0.x.toFixed(1) + '" y1="' + r0.y.toFixed(1) + '" x2="' + pr.x.toFixed(1) + '" y2="' + pr.y.toFixed(1) + '" class="l1" style="stroke:' + n.hue + ';opacity:' + (a * 0.25).toFixed(2) + '"/>'; }
      });
      // relation beams (typed light between the nodes they join; a pulled card keeps its beams)
      if (showLinks) {
        var rels = linkRels().filter(function (r) { return !timeT || (r.created_at || 0) <= timeT; }), few = rels.length <= 14;
        rels.forEach(function (r) {
          var A = pick(r.from), B = pick(r.to), ha = heldOf(r.from), hb = heldOf(r.to);
          var pa = A ? A.pr : ha ? { x: ha.x, y: ha.y } : null, pb = B ? B.pr : hb ? { x: hb.x, y: hb.y } : null;
          if (!pa || !pb) return;
          var al = Math.min(A ? A.alpha : 1, B ? B.alpha : 1); if (al < 0.05) return;
          var R = ks.RELBY[r.type] || { color: '#9fb4ff', label: r.type }, mx = (pa.x + pb.x) / 2, my = (pa.y + pb.y) / 2 - Math.min(60, Math.hypot(pb.x - pa.x, pb.y - pa.y) * 0.18);
          var onPath = path && path.some(function (st, i) { return i && ((st.n === A && path[i - 1].n === B) || (st.n === B && path[i - 1].n === A)); });
          L += '<path class="nb-beam t-' + r.type + (r.provenance !== 'user' ? ' sug' : '') + (r.__new ? ' new' : '') + (onPath ? ' onpath' : '') + '" d="M' + pa.x.toFixed(1) + ' ' + pa.y.toFixed(1) + ' Q' + mx.toFixed(1) + ' ' + my.toFixed(1) + ' ' + pb.x.toFixed(1) + ' ' + pb.y.toFixed(1) + '" style="stroke:' + R.color + ';opacity:' + (al * (path && !onPath ? 0.15 : 0.9)).toFixed(2) + '"/>';
          if (few || onPath) L += '<text class="nb-bl" x="' + mx.toFixed(1) + '" y="' + (my + 2).toFixed(1) + '" style="fill:' + R.color + ';opacity:' + (al * (path && !onPath ? 0.2 : 1)).toFixed(2) + '">' + esc(tr(R.label)) + '</text>';
        });
      }
      if (path) path.forEach(function (st, i) { if (!i) return; var a = st.n.pr, b = path[i - 1].n.pr; if (a && b) L += '<line class="nb-pathline" x1="' + a.x.toFixed(1) + '" y1="' + a.y.toFixed(1) + '" x2="' + b.x.toFixed(1) + '" y2="' + b.y.toFixed(1) + '"/>'; });
      nodes.forEach(function (n) { n.el.classList.toggle('magnet', magnet === n); });
      nodes.forEach(function (n) { n.el.classList.toggle('pathsel', pathA === n || (path && (path[0].n === n || path[path.length - 1].n === n))); });
      ov.querySelector('[data-eu]').disabled = !edits.length; ov.querySelector('[data-er]').disabled = !redone.length;
      lines.setAttribute('viewBox', '0 0 ' + W + ' ' + H); lines.innerHTML = L;
      ov.querySelectorAll('[data-lv]').forEach(function (b) { var l = +b.getAttribute('data-lv'); b.classList.toggle('on', slice ? !!slice[l] : l === view.level); });
      var f = view.focus && T.by[view.focus], fb2 = ov.querySelector('.nb-focus'); fb2.hidden = !f; if (f) fb2.querySelector('span').textContent = tr('Focus') + ': ' + tr(f.label);
      ov.querySelector('[data-hb]').disabled = !hist.length; ov.querySelector('[data-hf]').disabled = !fut.length;
    }

    // ---------------------------------------------------------------- view history (separate from knowledge edits)
    function snap() { return JSON.stringify({ yaw: view.yaw, pitch: view.pitch, zoom: view.zoom, level: view.level, focus: view.focus, expanded: view.expanded }); }
    function remember() { var s = snap(); if (hist[hist.length - 1] !== s) { hist.push(s); if (hist.length > 60) hist.shift(); fut = []; } }
    function restore(s) { var o = JSON.parse(s); view.yaw = o.yaw; view.pitch = o.pitch; view.zoom = o.zoom; view.level = o.level; view.focus = o.focus; view.expanded = o.expanded; vy = vp = 0; dirty = true; }

    function toggle(n) { if (!n.children.length || n.depth === 0) return; remember(); view.expanded[n.id] = !view.expanded[n.id]; if (!view.expanded[n.id]) collapseBelow(n); dirty = true; }
    function collapseBelow(n) { n.children.forEach(function (c) { delete view.expanded[c.id]; collapseBelow(c); }); }
    function focus(n) {
      remember();
      if (!n || n.depth === 0) { view.focus = null; dirty = true; return; }
      view.focus = n.id; var p = n.parent; while (p) { if (p.depth > 0) view.expanded[p.id] = true; p = p.parent; }
      if (n.children.length) view.expanded[n.id] = true;
      animZoom(Math.max(view.zoom, n.depth >= 3 ? 2.2 : 1.6));
    }
    // fit what is shown into the window (on open and when the levels change)
    function fit() {
      var R = 60; nodes.forEach(function (n) { if (visible(n)) R = Math.max(R, Math.hypot(n.home[0], n.home[1], n.home[2])); });
      animZoom(Math.max(0.35, Math.min(2.4, 330 / R)));
    }
    function animZoom(to) { var from = view.zoom, t0 = performance.now(); (function st() { var k = Math.min(1, (performance.now() - t0) / 420); view.zoom = from + (to - from) * (1 - Math.pow(1 - k, 3)); dirty = true; if (k < 1 && alive) setTimeout(st, 16); })(); }

    // ---------------------------------------------------------------- pointer: rotate / pinch / tap / double-tap / long-press
    var ptrs = {}, drag = null, pinch = null, lastTap = { n: null, t: 0, bg: 0 }, tapTimer = 0, lp = 0;
    stage.addEventListener('pointerdown', function (e) {
      ptrs[e.pointerId] = { x: e.clientX, y: e.clientY }; try { stage.setPointerCapture(e.pointerId); } catch (x) {}
      var ids = Object.keys(ptrs);
      if (ids.length === 2) { clearTimeout(lp); var a = ptrs[ids[0]], b = ptrs[ids[1]]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y) || 1, z: view.zoom }; drag = null; remember(); return; }
      var ne = e.target.closest('.nb-n'), n = ne && ne._n;
      drag = { x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, t: performance.now(), n: n, moved: 0 };
      vy = vp = 0;
      if (n && n.depth > 0) { clearTimeout(lp); lp = setTimeout(function () { if (drag && drag.moved < 8) { var d0 = drag; drag = null; pull(n, d0.x, d0.y, e.pointerId); } }, 480); }
    });
    stage.addEventListener('pointermove', function (e) {
      if (!ptrs[e.pointerId]) return; ptrs[e.pointerId] = { x: e.clientX, y: e.clientY };
      var ids = Object.keys(ptrs);
      if (pinch && ids.length === 2) { var a = ptrs[ids[0]], b = ptrs[ids[1]]; view.zoom = Math.max(0.35, Math.min(4, pinch.z * (Math.hypot(a.x - b.x, a.y - b.y) || 1) / pinch.d)); dirty = true; return; }
      if (!drag) return;
      var dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag.x = e.clientX; drag.y = e.clientY; drag.moved += Math.abs(dx) + Math.abs(dy);
      if (drag.moved > 8) { clearTimeout(lp); if (!drag.rot) { drag.rot = true; remember(); } view.yaw += dx * 0.006; view.pitch = clampP(view.pitch + dy * 0.006); vy = Math.max(-0.05, Math.min(0.05, dx * 0.006)); vp = Math.max(-0.05, Math.min(0.05, dy * 0.006)); dirty = true; }
    });
    function up(e) {
      delete ptrs[e.pointerId]; if (Object.keys(ptrs).length < 2) pinch = null;
      clearTimeout(lp); if (!drag) return; var d = drag; drag = null;
      if (d.moved > 8) return;   // a rotation: keep the fling
      vy = vp = 0;
      var now = performance.now();
      if (!d.n) {   // empty space: double-tap leaves focus
        if (now - lastTap.bg < 330) { lastTap.bg = 0; if (view.focus) focus(null); } else lastTap.bg = now;
        return;
      }
      if (lastTap.n === d.n && now - lastTap.t < 330) { clearTimeout(tapTimer); lastTap = { n: null, t: 0, bg: 0 }; focus(d.n); return; }   // double-tap wins
      lastTap = { n: d.n, t: now, bg: 0 }; var n = d.n;
      clearTimeout(tapTimer); tapTimer = setTimeout(function () { lastTap.n = null; if (pathMode) return pathPick(n); if (n.children.length) toggle(n); else peek(n); }, 300);
    }
    stage.addEventListener('pointerup', up); stage.addEventListener('pointercancel', up);
    stage.addEventListener('wheel', function (e) { e.preventDefault(); view.zoom = Math.max(0.35, Math.min(4, view.zoom * (e.deltaY < 0 ? 1.1 : 0.91))); dirty = true; }, { passive: false });

    // ---------------------------------------------------------------- the hand: pulled-out cards (work copies; nothing is written)
    var held = [];
    function cardHTML(n) {
      var sub = n.kind === 'domain' ? tr('Domain') : n.kind === 'place' ? tr('Place') : n.kind === 'thought' ? tr('Thought') : (ks.KINDS[n.ckind] ? tr(ks.KINDS[n.ckind]) : tr('Concept'));
      var extra = '';
      if (n.kind === 'thought') { var ko = ks.object(n.ko); var pl = ko && TK.placement(ko); extra = '<p>' + esc(pl && pl.primary ? C.pathNames(pl.primary).map(tr).join(' › ') : tr('Not placed yet')) + '</p><p class="dim">' + ks.conceptsOf(n.ko).length + ' ' + tr('concepts') + ' · ' + ks.relations({ ko: n.ko }).length + ' ' + tr('links') + '</p>'; }
      if (n.kind === 'concept') { var rs = ks.relations({ node: 'cc:' + n.concept }); extra = '<p class="dim">' + rs.length + ' ' + tr('links') + '</p>'; }
      if (n.children.length) extra += '<p class="dim">' + n.children.length + ' ' + tr('inside') + '</p>';
      return '<button type="button" class="nb-cx" title="' + esc(tr('Explode into layers')) + '" aria-label="' + esc(tr('Explode into layers')) + '">⧉</button>' + (refOf(n) ? '<i class="nb-handle" title="' + esc(tr('Drag to connect')) + '" aria-label="' + esc(tr('Drag to connect')) + '">✦</i>' : '') + '<small>' + esc(sub) + '</small><b>' + esc(tr(n.label)) + '</b>' + extra + '<span class="nb-cact">' + (n.ko ? '<em>' + tr('Tap: open in the five cards') + '</em>' : '') + '<em>' + tr('Double-tap or drag home: put back') + '</em></span>';
    }
    function pull(n, x, y, pid) {
      if (n.pulled) return;
      n.pulled = true; dirty = true;
      var c = document.createElement('div'); c.className = 'nb-card'; c.style.setProperty('--h', n.hue || '#c9b8ff'); c.innerHTML = cardHTML(n);
      var b = ov.getBoundingClientRect(); var it = { n: n, el: c, x: x - b.left, y: y - b.top };
      hand.appendChild(c); held.push(it); place(it); ov.querySelector('.nb-backall').hidden = false;
      try { if (root.navigator.vibrate) navigator.vibrate(12); } catch (e) {}
      wireCard(it);
      if (pid < 0) return;   // opened by a tap: no finger to follow
      // keep following the finger that pulled it
      var mv = function (e) { if (e.pointerId !== pid) return; it.x = e.clientX - b.left; it.y = e.clientY - b.top; place(it); ov.classList.add('carrying'); zoneHover(e.clientX, e.clientY); magnetHover(it); };
      var en = function (e) { if (e.pointerId !== pid) return; window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', en); window.removeEventListener('pointercancel', en); ov.classList.remove('carrying'); drop(it, e.clientX, e.clientY); };
      window.addEventListener('pointermove', mv); window.addEventListener('pointerup', en); window.addEventListener('pointercancel', en);
    }
    function place(it) { it.el.style.transform = 'translate(' + it.x.toFixed(0) + 'px,' + it.y.toFixed(0) + 'px) translate(-50%,-50%)' + (it.el.classList.contains('docked') ? ' scale(.62)' : ''); }
    function homeXY(n) { var c = center(); var pr = project(n.home, c); return pr; }
    function maybeHome(it) { var h = homeXY(it.n); if (Math.hypot(h.x - it.x, h.y - it.y) < 70) putBack(it); }
    function putBack(it) {
      var h = homeXY(it.n); it.el.classList.add('going'); it.x = h.x; it.y = h.y; place(it);
      setTimeout(function () { it.el.remove(); }, reduce ? 0 : 260);
      held.splice(held.indexOf(it), 1); it.n.pulled = false; dirty = true;
      ov.querySelector('.nb-backall').hidden = !held.length;
    }
    function wireCard(it) {
      var p0 = null, last = 0;
      var cn = null;   // connecting from the ✦ handle
      it.el.addEventListener('click', function (e) { if (e.target.closest('.nb-cx')) { e.stopPropagation(); openLayers(it); } });
      it.el.addEventListener('pointerdown', function (e) {
        e.stopPropagation(); try { it.el.setPointerCapture(e.pointerId); } catch (x) {}
        if (e.target.closest('.nb-cx')) return;
        if (e.target.closest('.nb-handle')) { cn = { id: e.pointerId }; it.el.classList.add('linking'); return; }
        p0 = { x: e.clientX, y: e.clientY, ox: it.x, oy: it.y, t: performance.now(), id: e.pointerId }; held.splice(held.indexOf(it), 1); held.push(it); hand.appendChild(it.el);
      });
      it.el.addEventListener('pointermove', function (e) {
        if (cn && e.pointerId === cn.id) { var b0 = ov.getBoundingClientRect(), x = e.clientX - b0.left, y = e.clientY - b0.top, t = targetAt(e.clientX, e.clientY, it);
          tmp.setAttribute('viewBox', '0 0 ' + b0.width + ' ' + b0.height); tmp.innerHTML = '<line x1="' + it.x + '" y1="' + it.y + '" x2="' + x + '" y2="' + y + '"/>' + (t ? '<circle cx="' + x + '" cy="' + y + '" r="16"/>' : '');
          ov.querySelectorAll('.nb-n.target').forEach(function (z) { z.classList.remove('target'); }); if (t && t.el && !t.pulled) t.el.classList.add('target'); return; }
        if (!p0 || e.pointerId !== p0.id) return; it.x = p0.ox + e.clientX - p0.x; it.y = p0.oy + e.clientY - p0.y; place(it);
        if (Math.hypot(e.clientX - p0.x, e.clientY - p0.y) > 10) { ov.classList.add('carrying'); zoneHover(e.clientX, e.clientY); magnetHover(it); }
      });
      it.el.addEventListener('pointerup', function (e) {
        if (cn) { cn = null; it.el.classList.remove('linking'); tmp.innerHTML = ''; ov.querySelectorAll('.nb-n.target').forEach(function (z) { z.classList.remove('target'); }); var t = targetAt(e.clientX, e.clientY, it); if (t) confirmLink(it.n, t); else toast(tr('Drop the light on another concept or thought')); return; }
        if (!p0) return; var moved = Math.hypot(e.clientX - p0.x, e.clientY - p0.y), q = p0; p0 = null; ov.classList.remove('carrying');
        if (moved > 10) return drop(it, e.clientX, e.clientY);
        var now = performance.now();
        if (now - last < 330) { last = 0; clearTimeout(it.t); return putBack(it); }
        last = now; clearTimeout(it.t); it.t = setTimeout(function () { last = 0; if (it.n.ko) { close(); TK.open(it.n.kind === 'concept' ? 'graph' : null, { objectId: it.n.ko, concept: it.n.concept }); } }, 340);
      });
    }
    function peek(n) { var pr = n.pr || homeXY(n), b = stage.getBoundingClientRect(); pull(n, pr.x + b.left + 80, pr.y + b.top, -1); }

    // ---------------------------------------------------------------- P1: targets, zones, link confirm, panels
    function toast(m) { if (TK.toast) TK.toast(m); }
    function targetAt(x, y, it) {
      var prev = it.el.style.pointerEvents; it.el.style.pointerEvents = 'none';
      var el = document.elementFromPoint(x, y); it.el.style.pointerEvents = prev;
      var ne = el && el.closest('.nb-n'), ce = el && el.closest('.nb-card'), n = ne ? ne._n : null;
      if (!n && ce) { for (var i = 0; i < held.length; i++) if (held[i].el === ce) n = held[i].n; }
      if (!n || n === it.n || !refOf(n) || refOf(n) === refOf(it.n)) return null;
      return n;
    }
    function zoneAt(x, y) { var z = null; ov.querySelectorAll('.nb-zone').forEach(function (el) { var r = el.getBoundingClientRect(); if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) z = el.getAttribute('data-zone'); }); return z; }
    function zoneHover(x, y) { var z = zoneAt(x, y); ov.querySelectorAll('.nb-zone').forEach(function (el) { el.classList.toggle('hot', el.getAttribute('data-zone') === z); }); }
    // combine: a card carried next to another node is pulled in (magnetic preview)
    function magnetAt(it) {
      var h = homeXY(it.n); if (Math.hypot(h.x - it.x, h.y - it.y) < 70) return null;   // near home = put back
      var best = null, bd = 56;
      nodes.forEach(function (n) { if (n === it.n || !n.pr || n.alpha < 0.3 || n.pulled || !refOf(n) || refOf(n) === refOf(it.n)) return; var d = Math.hypot(n.pr.x - it.x, n.pr.y - it.y); if (d < bd) { bd = d; best = n; } });
      held.forEach(function (o) { if (o === it || !refOf(o.n) || refOf(o.n) === refOf(it.n)) return; var d = Math.hypot(o.x - it.x, o.y - it.y); if (d < 70 && d < bd + 14) { bd = d; best = o.n; } });
      return best;
    }
    function magnetHover(it) { var m = refOf(it.n) ? magnetAt(it) : null; if (m !== magnet) { magnet = m; held.forEach(function (o) { o.el.classList.toggle('magnet', o.n === m); }); it.el.classList.toggle('magnetic', !!m); dirty = true; } }
    function chooseCombine(a, b) {
      var name = tr(a.label) + ' & ' + tr(b.label);
      confirmBox.innerHTML = '<h4>' + esc(tr('Combine')) + '</h4><p><b>' + esc(tr(a.label)) + '</b> + <b>' + esc(tr(b.label)) + '</b></p>' +
        '<label class="kl-chk"><input type="radio" name="cb" value="in" checked> ' + esc(tr('Put the first inside the second (belongs to)')) + '</label>' +
        '<label class="kl-chk"><input type="radio" name="cb" value="out"> ' + esc(tr('Put the second inside the first')) + '</label>' +
        '<label class="kl-chk"><input type="radio" name="cb" value="rel"> ' + esc(tr('Keep them side by side (related)')) + '</label>' +
        '<label class="kl-chk"><input type="radio" name="cb" value="group"> ' + esc(tr('Make a new group for both')) + '</label>' +
        '<label class="nb-gname" hidden>' + esc(tr('Group name')) + '<input maxlength="80" value="' + esc(name) + '"></label><p class="dim">' + esc(tr('Nothing is saved until you confirm.')) + '</p>' +
        '<div class="row"><button type="button" class="primary" data-ok>' + esc(tr('Confirm and save')) + '</button><button type="button" data-no>' + esc(tr('Cancel')) + '</button></div>';
      confirmBox.hidden = false;
      confirmBox.onchange = function () { confirmBox.querySelector('.nb-gname').hidden = confirmBox.querySelector('[name=cb]:checked').value !== 'group'; };
      confirmBox.onclick = function (e) {
        var bt = e.target.closest('button'); if (!bt) return;
        if (bt.hasAttribute('data-ok')) {
          var how = confirmBox.querySelector('[name=cb]:checked').value, ra = refOf(a), rb = refOf(b), ko = koOf(a) || koOf(b), koId = ko ? ko.id : null, made = [], newC = null;
          TK.silently(function () {
            function rel(f, t, ty) { if (relExists(f, t, ty)) return; made.push(ks.relate(f, t, ty, { ko: koId, provenance: 'user', source_ref: 'nebula', note: tr('Combined in the nebula') })); }
            if (how === 'in') rel(ra, rb, 'belongs-to');
            else if (how === 'out') rel(rb, ra, 'belongs-to');
            else if (how === 'rel') rel(ra, rb, 'related');
            else {
              var gname = (confirmBox.querySelector('.nb-gname input').value || name).trim(), existed = !!ks.findConcept(gname), cid = ks.concept(gname, { kind: 'concept', provenance: 'user' });
              var before = ko ? ko.concept_ids.indexOf(cid) >= 0 : true; if (koId) ks.addToObject(koId, cid);
              newC = { id: cid, ko: koId, created: !existed, wasIn: before };
              rel(ra, 'cc:' + cid, 'belongs-to'); rel(rb, 'cc:' + cid, 'belongs-to');
            }
          });
          if (!made.length && !newC) { toast(tr('These two are already linked that way')); confirmBox.hidden = true; return; }
          edits.push({ op: 'batch', rels: made, concept: newC }); redone = [];
          made.forEach(function (r) { r.__new = 1; setTimeout(function () { r.__new = 0; dirty = true; }, 1600); });
          rebuild(); toast(tr('Combined and saved'));
        }
        confirmBox.hidden = true;
      };
    }
    function drop(it, x, y) {
      var z = zoneAt(x, y); ov.querySelectorAll('.nb-zone').forEach(function (el) { el.classList.remove('hot'); });
      var mg = !z && refOf(it.n) ? magnetAt(it) : null; magnet = null; held.forEach(function (o) { o.el.classList.remove('magnet'); }); it.el.classList.remove('magnetic'); dirty = true;
      if (mg) return chooseCombine(it.n, mg);
      if (z === 'read') return openRead(it.n);
      if (z === 'project') return openProject(it.n);
      if (z === 'compare') {
        if (cmp.indexOf(it) < 0) cmp.push(it); if (cmp.length > 2) { cmp.shift().el.classList.remove('docked'); }
        var zr = ov.querySelector('[data-zone=compare]').getBoundingClientRect(), ob = ov.getBoundingClientRect();   // dock the card beside the zone
        cmp.forEach(function (c, i) { c.el.classList.add('docked'); c.x = zr.right - ob.left + 95; c.y = zr.top - ob.top + 20 + i * 46; place(c); });
        paintCmp(); if (cmp.length === 2) openCompare(cmp[0].n, cmp[1].n); else toast(tr('Now drop a second card on Compare')); return; }
      maybeHome(it);
    }
    function paintCmp() { var em = ov.querySelector('[data-zone=compare] em'); em.textContent = cmp.length ? cmp.length + '/2' : ''; }
    function koOf(n) { return n.ko ? ks.object(n.ko) : null; }
    function relExists(a, b, type) { return ks.relations().some(function (r) { return r.type === type && ((r.from === a && r.to === b) || (ks.RELBY[type].sym && r.from === b && r.to === a)); }); }
    function confirmLink(a, b) {
      var ra = refOf(a), rb = refOf(b), from = a, to = b;
      function body() {
        confirmBox.innerHTML = '<h4>' + esc(tr('New link')) + '</h4><p><b>' + esc(tr(from.label)) + '</b> → <b>' + esc(tr(to.label)) + '</b></p>' +
          '<label>' + esc(tr('Type')) + '<select>' + ks.REL.map(function (r) { return '<option value="' + r.id + '">' + esc(tr(r.label)) + '</option>'; }).join('') + '</select></label>' +
          '<label>' + esc(tr('Note (optional)')) + '<input maxlength="200"></label><p class="dim">' + esc(tr('Nothing is saved until you confirm.')) + '</p>' +
          '<div class="row"><button type="button" class="primary" data-ok>' + esc(tr('Confirm and save')) + '</button><button type="button" data-rev>' + esc(tr('Reverse')) + '</button><button type="button" data-no>' + esc(tr('Cancel')) + '</button></div>';
      }
      body(); confirmBox.hidden = false;
      confirmBox.onclick = function (e) {
        var bt = e.target.closest('button'); if (!bt) return;
        if (bt.hasAttribute('data-rev')) { var t = from; from = to; to = t; var keep = confirmBox.querySelector('select').value; body(); confirmBox.querySelector('select').value = keep; return; }
        if (bt.hasAttribute('data-ok')) {
          var type = confirmBox.querySelector('select').value, note = confirmBox.querySelector('input').value.trim(), fr = refOf(from), tt = refOf(to);
          if (relExists(fr, tt, type)) { toast(tr('These two are already linked that way')); confirmBox.hidden = true; return; }
          var ko = koOf(from) || koOf(to), r;
          TK.silently(function () { r = ks.relate(fr, tt, type, { ko: ko ? ko.id : null, provenance: 'user', source_ref: 'nebula', note: note }); });
          edits.push({ op: 'relate', r: r }); redone = []; r.__new = 1; setTimeout(function () { r.__new = 0; dirty = true; }, 1600);
          toast(tr('Link saved')); dirty = true;
        }
        confirmBox.hidden = true;
      };
    }
    function undoEdit() {
      var e = edits.pop(); if (!e) return;
      TK.silently(function () {
        if (e.op === 'relate') ks.unrelate(e.r.id);
        else { e.rels.forEach(function (r) { ks.unrelate(r.id); }); var c = e.concept; if (c) { if (c.ko && !c.wasIn) { var k = ks.object(c.ko); if (k) ks.updateObject(c.ko, { concept_ids: k.concept_ids.filter(function (x) { return x !== c.id; }) }); } } }   // a group concept stays in the store (unused), so redo can bring it back
      });
      redone.push(e); if (e.op === 'batch') rebuild(); toast(tr('Edit undone')); dirty = true;
    }
    function redoEdit() {
      var e = redone.pop(); if (!e) return;
      function again(r) { var r2; TK.silently(function () { r2 = ks.relate(r.from, r.to, r.type, { ko: r.ko, provenance: 'user', source_ref: 'nebula', note: r.note }); }); return r2; }
      if (e.op === 'relate') e.r = again(e.r);
      else {
        var c = e.concept;
        if (c && c.ko && !c.wasIn) TK.silently(function () { ks.addToObject(c.ko, c.id); });
        e.rels = e.rels.map(again);
        rebuild();
      }
      edits.push(e); toast(tr('Edit redone')); dirty = true;
    }
    function pathPick(n) {
      if (!pathA) { pathA = n; path = null; setPathBar(tr('Path: now tap a second node')); dirty = true; return; }
      if (n === pathA) return;
      var p2 = findPath(pathA, n); remember();
      if (!p2) { setPathBar(tr('No path between these two yet')); pathA = null; dirty = true; return; }
      path = p2; pathA = null;
      p2.forEach(function (st) { var p = st.n.parent; while (p) { if (p.depth > 0) view.expanded[p.id] = true; p = p.parent; } });
      setPathBar(p2.map(function (st, i) { return (i ? ' —' + tr(st.via) + '→ ' : '') + tr(st.n.label); }).join(''));
      dirty = true;
    }
    function setPathBar(t) { var pb = ov.querySelector('.nb-pathbar'); pb.hidden = !t; pb.querySelector('span').textContent = t || ''; }
    function clearPath() { path = null; pathA = null; setPathBar(''); dirty = true; }

    // panels: Read (knowledge page) · Compare · Project
    function openPanel(html, cls) { panel.className = 'nb-panel ' + (cls || ''); panel.innerHTML = '<button type="button" class="nb-pclose" data-pclose aria-label="Close">×</button>' + html; panel.hidden = false; }
    function relList(ref) {
      var rs = ks.relations({ node: ref }); if (!rs.length) return '<p class="dim">' + esc(tr('No links yet.')) + '</p>';
      var by = {}; rs.forEach(function (r) { var out = r.from === ref, R = ks.RELBY[r.type], k = out ? R.label : R.inverse; (by[k] = by[k] || []).push({ r: r, other: out ? r.to : r.from, color: R.color }); });
      return Object.keys(by).map(function (k) { return '<h5 style="color:' + by[k][0].color + '">' + esc(tr(k)) + '</h5><ul>' + by[k].map(function (x) { var o = x.other.indexOf('cc:') === 0 ? ks.label(x.other.slice(3)) : x.other; return '<li>' + esc(o) + ' <small>' + esc(tr(ks.PROV[x.r.provenance] || '')) + (x.r.note ? ' · ' + esc(x.r.note) : '') + '</small></li>'; }).join('') + '</ul>'; }).join('');
    }
    function openRead(n) {
      var h = '<small class="nb-pk">' + esc(tr('Knowledge page')) + '</small>';
      if (n.kind === 'concept' || (n.kind === 'thought' && refOf(n))) {
        var cid = (refOf(n) || '').slice(3), c = ks.getConcept(cid);
        if (n.kind === 'concept' && c) {
          var ck = ks.contentKind(c);
          h += '<h2>' + esc(ks.label(c)) + '</h2>' + (c.labels.zh && c.labels.en ? '<p class="dim">' + esc(c.labels.zh) + ' · ' + esc(c.labels.en) + '</p>' : '') +
            '<p><span class="ck ck-' + esc(ck) + '">' + esc(tr(ks.CONTENT[ck] || '')) + '</span> ' + esc(tr(ks.KINDS[c.kind] || '')) + (c.review === 'pending' ? ' · <span class="pill sug">' + esc(tr('review pending')) + '</span>' : '') + '</p>' +
            (c.definition ? '<p>' + esc(c.definition) + '</p>' : '') + '<h4>' + esc(tr('Links')) + '</h4>' + relList('cc:' + cid) +
            '<h4>' + esc(tr('Appears in')) + '</h4><ul>' + ks.objects().filter(function (o) { return o.concept_ids.indexOf(cid) >= 0; }).map(function (o) { return '<li>' + esc(o.title) + '</li>'; }).join('') + '</ul>';
          return openPanel(h, 'read');
        }
      }
      if (n.kind === 'thought') {
        var ko = ks.object(n.ko), pl = TK.placement(ko);
        h += '<h2>' + esc(ko.title) + '</h2><p class="dim">' + esc(pl.primary ? C.pathNames(pl.primary).map(tr).join(' › ') : tr('Not placed yet')) + ' · ' + esc(tr(pl.confirmed ? 'confirmed by you' : 'suggested')) + '</p>' +
          '<h4>' + esc(tr('Concepts')) + '</h4><p>' + ks.conceptsOf(ko.id).map(function (c) { return '<span class="tag">' + esc(ks.label(c)) + '</span>'; }).join(' ') + '</p>' +
          (ks.frameworksOf(ko.id).length ? '<h4>' + esc(tr('Frameworks')) + '</h4><ul>' + ks.frameworksOf(ko.id).map(function (f) { return '<li>' + esc(tr(f.title)) + ' <small>' + f.nodes.filter(function (x) { return x.role === 'item'; }).length + '</small></li>'; }).join('') + '</ul>' : '') +
          (ko.notes.length ? '<h4>' + esc(tr('Notes')) + '</h4><ul>' + ko.notes.map(function (x) { return '<li><span class="ck ck-' + esc(x.content_kind || 'view') + '">' + esc(tr(ks.CONTENT[x.content_kind || 'view'])) + '</span> ' + esc(x.text) + (x.source ? ' <small>— ' + esc(x.source) + '</small>' : '') + '</li>'; }).join('') + '</ul>' : '') +
          (ks.modelRunsOf(ko.id).length ? '<h4>' + esc(tr('Thinking Models')) + '</h4><ul>' + ks.modelRunsOf(ko.id).map(function (m) { return '<li>' + esc(tr(m.title || m.model_id)) + '</li>'; }).join('') + '</ul>' : '') +
          (ks.labRunsOf(ko.id).length ? '<h4>' + esc(tr('Experiments')) + '</h4><ul>' + ks.labRunsOf(ko.id).map(function (l) { var d = TK.M.get(l.interaction_id); return '<li>' + esc(tr(d ? d.title : l.interaction_id)) + '</li>'; }).join('') + '</ul>' : '') +
          (refOf(n) ? '<h4>' + esc(tr('Links')) + '</h4>' + relList(refOf(n)) : '') +
          '<div class="row"><button type="button" data-openko="' + ko.id + '">' + esc(tr('Open in the five cards')) + '</button></div>';
        return openPanel(h, 'read');
      }
      h += '<h2>' + esc(tr(n.label)) + '</h2><ul>' + n.children.map(function (c) { return '<li>' + esc(tr(c.label)) + (c.children.length ? ' <small>' + c.children.length + '</small>' : '') + '</li>'; }).join('') + '</ul>';
      openPanel(h, 'read');
    }
    function conceptSet(n) { if (n.kind === 'thought') return ks.object(n.ko).concept_ids.slice(); if (n.kind === 'concept') { var s0 = ['' + n.concept]; ks.relations({ node: 'cc:' + n.concept }).forEach(function (r) { [r.from, r.to].forEach(function (x) { if (x.indexOf('cc:') === 0 && s0.indexOf(x.slice(3)) < 0) s0.push(x.slice(3)); }); }); return s0; } return n.children.map(function (c) { return c.concept; }).filter(Boolean); }
    function openCompare(a, b) {
      var A = conceptSet(a), B = conceptSet(b), both = A.filter(function (x) { return B.indexOf(x) >= 0; }), oa = A.filter(function (x) { return B.indexOf(x) < 0; }), ob = B.filter(function (x) { return A.indexOf(x) < 0; });
      var ra = refOf(a), rb = refOf(b), direct = ks.relations().filter(function (r) { return (r.from === ra && r.to === rb) || (r.from === rb && r.to === ra); });
      var pth = findPath(a, b);
      function col(n, only) { return '<div class="nb-cc"><small>' + esc(tr(n.kind === 'thought' ? 'Thought' : n.kind === 'concept' ? 'Concept' : n.kind === 'place' ? 'Place' : 'Domain')) + '</small><b>' + esc(tr(n.label)) + '</b><h5>' + esc(tr('Only here')) + '</h5><p>' + (only.length ? only.map(function (x) { return '<span class="tag">' + esc(ks.label(x)) + '</span>'; }).join(' ') : '<span class="dim">—</span>') + '</p></div>'; }
      openPanel('<small class="nb-pk">' + esc(tr('Compare')) + '</small><div class="nb-cmp">' + col(a, oa) +
        '<div class="nb-cmid"><h5>' + esc(tr('Shared')) + '</h5><p>' + (both.length ? both.map(function (x) { return '<span class="tag">' + esc(ks.label(x)) + '</span>'; }).join(' ') : '<span class="dim">' + esc(tr('Nothing shared yet')) + '</span>') + '</p>' +
        '<h5>' + esc(tr('Direct links')) + '</h5><p>' + (direct.length ? direct.map(function (r) { return esc(tr(ks.RELBY[r.type].label)); }).join(', ') : '<span class="dim">' + esc(tr('None')) + '</span>') + '</p>' +
        '<h5>' + esc(tr('Path')) + '</h5><p>' + (pth ? esc(pth.map(function (st, i) { return (i ? ' —' + tr(st.via) + '→ ' : '') + tr(st.n.label); }).join('')) : '<span class="dim">' + esc(tr('No path between these two yet')) + '</span>') + '</p></div>' + col(b, ob) + '</div>' +
        '<div class="row">' + (ra && rb ? '<button type="button" class="primary" data-cmplink>' + esc(tr('Link them…')) + '</button>' : '') + ((a.ko || b.ko) ? '<button type="button" data-cmpmodel>' + esc(tr('Analyse in Thinking Models')) + '</button>' : '') + '</div>', 'compare');
      panel._cmp = [a, b];
    }
    function openProject(n) {
      var ko = koOf(n);
      if (!ko) return openPanel('<small class="nb-pk">' + esc(tr('Project')) + '</small><h2>' + esc(tr(n.label)) + '</h2><p class="dim">' + esc(tr('Pull a thought or a concept to project it into a thinking model.')) + '</p>', 'project');
      var ms = (TK.recommendModels ? TK.recommendModels(ko) : []).slice(0, 4); if (!ms.length) ms = TK.data.models.slice(0, 3);
      var ls = (TK.recommendLabs ? TK.recommendLabs(ko) : []).filter(function (x) { return x.s > 0; }).slice(0, 3).map(function (x) { return x.d; });
      openPanel('<small class="nb-pk">' + esc(tr('Project')) + '</small><h2>' + esc(tr(n.label)) + '</h2>' +
        '<h4>' + esc(tr('Thinking Models')) + '</h4><div class="nb-proj">' + ms.map(function (m) { return '<button type="button" class="nb-pj" data-pm="' + m.id + '"><b>' + esc(tr(m.title)) + '</b><span>' + esc(tr(m.principle)) + '</span></button>'; }).join('') + '</div>' +
        (ls.length ? '<h4>' + esc(tr('Experiments')) + '</h4><div class="nb-proj">' + ls.map(function (d) { return '<button type="button" class="nb-pj lab" data-pl="' + d.interaction_id + '"><b>' + esc(tr(d.title)) + '</b><span>' + esc(tr(d.subtitle || '')) + '</span></button>'; }).join('') + '</div>' : ''), 'project');
      panel._ko = ko.id;
    }
    panel.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      if (b.hasAttribute('data-pclose')) { panel.hidden = true; if (panel.classList.contains('compare')) { cmp.forEach(function (c) { c.el.classList.remove('docked'); }); cmp = []; paintCmp(); } return; }
      if (b.hasAttribute('data-openko')) { var id = b.getAttribute('data-openko'); close(); TK.open(null, { objectId: id }); return; }
      if (b.hasAttribute('data-pm')) { var k1 = panel._ko, m = b.getAttribute('data-pm'); close(); TK.open('models', { objectId: k1, model: m }); return; }
      if (b.hasAttribute('data-pl')) { var k2 = panel._ko, l = b.getAttribute('data-pl'); close(); TK.open('lab', { objectId: k2, lab: l }); return; }
      if (b.hasAttribute('data-cmplink')) { confirmLink(panel._cmp[0], panel._cmp[1]); return; }
      if (b.hasAttribute('data-cmpmodel')) { var pr = panel._cmp, k3 = pr[0].ko || pr[1].ko; close(); TK.open('models', { objectId: k3, model: 'perspectives' }); return; }
    });

    // ⧉ the card's exploded view: its knowledge in layers, fanned in depth (tap a layer to bring it forward)
    function layersOf(n) {
      var L = [], tagz = function (arr) { return arr.length ? arr.map(function (x) { return '<span class="tag">' + esc(x) + '</span>'; }).join(' ') : '<span class="dim">—</span>'; };
      var ref = refOf(n);
      if (n.kind === 'concept') {
        var c = ks.getConcept(n.concept) || { labels: {} }, rs = ks.relations({ node: 'cc:' + n.concept });
        L.push([tr('Identity'), '<b>' + esc(ks.label(c)) + '</b>' + (c.labels.zh && c.labels.en ? '<p>' + esc(c.labels.zh) + ' · ' + esc(c.labels.en) + '</p>' : '') + '<p>' + esc(tr(ks.KINDS[c.kind] || '')) + ' · ' + esc(tr(ks.CONTENT[ks.contentKind(c)] || '')) + '</p>']);
        L.push([tr('Structure'), '<h5>' + esc(tr('Belongs to')) + '</h5>' + tagz(rs.filter(function (r) { return r.type === 'belongs-to' && r.from === 'cc:' + n.concept; }).map(function (r) { return ks.label(r.to.slice(3)); })) + '<h5>' + esc(tr('Contains')) + '</h5>' + tagz(rs.filter(function (r) { return r.type === 'belongs-to' && r.to === 'cc:' + n.concept; }).map(function (r) { return ks.label(r.from.slice(3)); }))]);
        L.push([tr('Links'), relList('cc:' + n.concept)]);
        L.push([tr('Appears in'), tagz(ks.objects().filter(function (o) { return o.concept_ids.indexOf(n.concept) >= 0; }).map(function (o) { return o.title; }))]);
      } else if (n.kind === 'thought') {
        var ko = ks.object(n.ko), pl = TK.placement(ko);
        L.push([tr('Question'), '<b>' + esc(ko.title) + '</b><p>' + esc(pl.primary ? C.pathNames(pl.primary).map(tr).join(' › ') : tr('Not placed yet')) + '</p>']);
        L.push([tr('Concepts'), tagz(ks.conceptsOf(ko.id).map(function (c) { return ks.label(c); }))]);
        L.push([tr('Links'), ref ? relList(ref) : '<span class="dim">—</span>']);
        L.push([tr('Notes'), ko.notes.length ? '<ul>' + ko.notes.map(function (x) { return '<li>' + esc(x.text) + '</li>'; }).join('') + '</ul>' : '<span class="dim">—</span>']);
        L.push([tr('Analyses & experiments'), tagz(ks.modelRunsOf(ko.id).map(function (m) { return tr(m.title || m.model_id); }).concat(ks.labRunsOf(ko.id).map(function (l) { var d = TK.M.get(l.interaction_id); return tr(d ? d.title : l.interaction_id); })))]);
      } else {
        L.push([tr(n.label), tagz(n.children.map(function (c) { return tr(c.label); }))]);
      }
      return L;
    }
    function openLayers(it) {
      var old = ov.querySelector('.nb-layers'); if (old) old.remove();
      var L = layersOf(it.n), box = document.createElement('div'); box.className = 'nb-layers';
      box.innerHTML = '<button type="button" class="nb-lyx" aria-label="Close">×</button>' + L.map(function (l, i) { return '<section class="nb-ly" data-i="' + i + '" style="--h:' + (it.n.hue || '#9fb4ff') + '"><small>' + (i + 1) + ' · ' + esc(l[0]) + '</small><div>' + l[1] + '</div></section>'; }).join('');
      ov.appendChild(box);
      var order = L.map(function (_, i) { return i; });
      function lay() { order.forEach(function (idx, k) { var el = box.querySelector('[data-i="' + idx + '"]'); el.style.transform = 'translate3d(' + (k * 26) + 'px,' + (-k * 30) + 'px,' + (-k * 70) + 'px) rotateY(-14deg)'; el.style.zIndex = String(50 - k); el.classList.toggle('front', k === 0); }); }
      requestAnimationFrame(function () { box.classList.add('on'); lay(); });
      box.addEventListener('click', function (e) {
        if (e.target.closest('.nb-lyx')) { box.classList.remove('on'); setTimeout(function () { box.remove(); }, 250); return; }
        var sec = e.target.closest('.nb-ly'); if (!sec) return; var i = +sec.getAttribute('data-i'); order = [i].concat(order.filter(function (x) { return x !== i; })); lay();
      });
    }

    // ---------------------------------------------------------------- controls
    ov.querySelector('.nb-xpbar input').addEventListener('input', function (e) { xp = +e.target.value / 100; dirty = true; });
    ov.querySelector('.nb-timebar input').addEventListener('input', function (e) { var v = +e.target.value; timeT = v >= 1000 ? null : tMin + (tMax - tMin) * v / 1000; paintTime(); dirty = true; });
    function paintTime() { var b = ov.querySelector('.nb-timebar b'); b.textContent = timeT ? new Date(timeT).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : tr('Now'); }
    ov.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      if (b.classList.contains('nb-x')) return close();
      if (b.hasAttribute('data-lv') && slice) { remember(); var Ls = +b.getAttribute('data-lv'); slice[Ls] = !slice[Ls]; if (!Object.keys(slice).some(function (k) { return slice[k]; })) slice[Ls] = true; nodes.forEach(function (n) { if (n.children.length && n.depth >= 1) view.expanded[n.id] = true; }); dirty = true; fit(); return; }
      if (b.hasAttribute('data-lv')) { remember(); var L = +b.getAttribute('data-lv'); view.expanded = { root: true }; nodes.forEach(function (n) { if (n.depth >= 1 && n.depth < L && n.children.length) view.expanded[n.id] = true; }); view.level = L; view.focus = null; dirty = true; fit(); return; }
      if (b.hasAttribute('data-unfocus')) return focus(null);
      if (b.hasAttribute('data-links')) { showLinks = !showLinks; b.classList.toggle('on', showLinks); dirty = true; return; }
      if (b.hasAttribute('data-path')) { pathMode = !pathMode; b.classList.toggle('on', pathMode); if (!pathMode) clearPath(); else setPathBar(tr('Path: tap the first node')); return; }
      if (b.hasAttribute('data-pathclear')) { clearPath(); pathMode = false; ov.querySelector('[data-path]').classList.remove('on'); return; }
      if (b.hasAttribute('data-xp')) { var xb = ov.querySelector('.nb-xpbar'); xb.hidden = !xb.hidden; b.classList.toggle('on', !xb.hidden); if (xb.hidden) { xp = 0; xb.querySelector('input').value = 0; dirty = true; } return; }
      if (b.hasAttribute('data-slice')) { remember(); slice = slice ? null : { 1: true, 2: true, 3: true, 4: true }; b.classList.toggle('on', !!slice); ov.querySelector('.nb-levels').classList.toggle('slicing', !!slice); if (slice) nodes.forEach(function (n) { if (n.children.length && n.depth >= 1) view.expanded[n.id] = true; }); dirty = true; fit(); toast(slice ? tr('Slice: tap levels to show or hide them') : tr('Slice off')); return; }
      if (b.hasAttribute('data-time')) { var tb = ov.querySelector('.nb-timebar'); tb.hidden = !tb.hidden; b.classList.toggle('on', !tb.hidden); if (tb.hidden) { timeT = null; tb.querySelector('input').value = 1000; dirty = true; } else paintTime(); return; }
      if (b.hasAttribute('data-eu')) return undoEdit();
      if (b.hasAttribute('data-er')) return redoEdit();
      if (b.hasAttribute('data-hb')) { if (!hist.length) return; fut.push(snap()); restore(hist.pop()); return; }
      if (b.hasAttribute('data-hf')) { if (!fut.length) return; hist.push(snap()); restore(fut.pop()); return; }
      if (b.classList.contains('nb-backall')) { held.slice().forEach(putBack); return; }
    });
    function key(e) {
      if (e.key === 'Escape') { if (!confirmBox.hidden) { confirmBox.hidden = true; return; } if (!panel.hidden) { panel.hidden = true; return; } if (path || pathMode) { clearPath(); pathMode = false; ov.querySelector('[data-path]').classList.remove('on'); return; } if (view.focus) focus(null); else close(); }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); ov.querySelector(e.shiftKey ? '[data-hf]' : '[data-hb]').click(); }
    }
    document.addEventListener('keydown', key);
    function onResize() { size(); dirty = true; }
    window.addEventListener('resize', onResize);
    function saveView() { try { localStorage.setItem('minest.nebula.view', JSON.stringify({ yaw: view.yaw, pitch: view.pitch, zoom: view.zoom, level: view.level, expanded: view.expanded })); } catch (e) {} }
    function close() { saveView(); alive = false; if (typeof ro !== 'undefined' && ro) ro.disconnect(); cancelAnimationFrame(raf); clearTimeout(fb); document.removeEventListener('keydown', key); window.removeEventListener('resize', onResize); ov.classList.add('out'); setTimeout(function () { ov.remove(); }, reduce ? 0 : 200); if (opts.onClose) opts.onClose(); }
    // the level slider starts at 2 (domains + places)
    view.expanded = { root: true }; nodes.forEach(function (n) { if (n.depth === 1 && n.children.length) view.expanded[n.id] = true; });
    var memo = null; try { memo = JSON.parse(localStorage.getItem('minest.nebula.view') || 'null'); } catch (e) {}   // the layout remembered on this device
    if (memo && !opts.fresh) { view.yaw = memo.yaw; view.pitch = memo.pitch; view.zoom = memo.zoom; view.level = memo.level || 2; view.expanded = { root: true }; Object.keys(memo.expanded || {}).forEach(function (k) { if (T.by[k] && memo.expanded[k]) view.expanded[k] = true; }); }
    size(); requestAnimationFrame(function () { ov.classList.add('on'); size(); if (!memo || opts.fresh) fit(); frame(); });
    if (root.ResizeObserver) { var ro = new ResizeObserver(function () { size(); dirty = true; }); ro.observe(stage); }   // measured again when the frame or tab gets its real size
    return { close: close, view: view, tree: T, toggle: toggle, focus: focus, pull: pull, held: held, findPath: findPath, confirmLink: confirmLink, undoEdit: undoEdit, redoEdit: redoEdit, openRead: openRead, openCompare: openCompare, openProject: openProject, drop: drop, pathPick: pathPick, edits: edits, chooseCombine: chooseCombine, rebuild: rebuild, setExplode: function (v) { xp = v; dirty = true; }, setTime: function (t) { timeT = t; dirty = true; }, setSlice: function (s) { slice = s; dirty = true; }, nodesNow: function () { return nodes; }, magnetAt: magnetAt, openLayers: function (it) { openLayers(it); } };
  }

  var api = { tree: tree, layout: layout, open: open };
  root.MinestNebula = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
