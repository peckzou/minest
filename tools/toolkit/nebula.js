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
   Two separate histories: the VIEW history here (back / forward); knowledge edits keep their own (none in P0). */
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
      var t3 = add(d2, 'ko:' + ko.id, 'thought', ko.title, { domain: top, hue: d1.hue, ko: ko.id, confirmed: !!p.confirmed });
      ks.conceptsOf(ko.id).forEach(function (c) {
        add(t3, 'cc:' + c.id + '@' + ko.id, 'concept', ks.label(c), { domain: top, hue: d1.hue, ko: ko.id, concept: c.id, ckind: c.kind, topic: c.id === ko.root_concept });
      });
    });
    rootN.children.sort(function (a, b) { return COLS.indexOf(a.domain) - COLS.indexOf(b.domain); });
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
      '<header class="nb-top"><div><b>Holographic Workbench</b><small>Knowledge nebula · view only</small></div>' +
      '<div class="nb-hist"><button type="button" data-hb title="View back" aria-label="View back">↶</button><button type="button" data-hf title="View forward" aria-label="View forward">↷</button></div>' +
      '<button type="button" class="nb-x" aria-label="Close">×</button></header>' +
      '<div class="nb-levels" role="group" aria-label="Levels"><span>Levels</span>' + [1, 2, 3, 4].map(function (l) { return '<button type="button" data-lv="' + l + '">' + ['Domains', 'Places', 'Thoughts', 'Concepts'][l - 1] + '</button>'; }).join('') + '</div>' +
      '<div class="nb-focus" hidden><span></span><button type="button" data-unfocus aria-label="Leave focus">✕</button></div>' +
      '<div class="nb-hand"></div><button type="button" class="nb-backall" hidden>↺ Put all back</button>' +
      '<p class="nb-help">Drag to rotate · pinch to zoom · tap a cluster to open it · double-tap to focus · long-press to pull a card out</p>' +
      (nodes.length <= 1 ? '<div class="nb-empty"><b>Your nebula is empty</b><p>Explore a thought in the toolkit first — each one becomes a star here.</p></div>' : '');
    document.body.appendChild(ov);
    var stage = ov.querySelector('.nb-stage'), layer = ov.querySelector('.nb-layer'), lines = ov.querySelector('.nb-lines'), hand = ov.querySelector('.nb-hand');
    nodes.forEach(function (n) {
      var e = document.createElement('div'); e.className = 'nb-n k-' + n.kind + (n.topic ? ' topic' : ''); e.style.setProperty('--h', n.hue || '#c9b8ff');
      e.innerHTML = '<i></i><span>' + esc(tr(n.label)) + (n.children.length && n.depth > 0 ? '<em>' + n.children.length + '</em>' : '') + '</span>';
      e._n = n; n.el = e; layer.appendChild(e);
    });

    // ---------------------------------------------------------------- visibility, focus, projection
    function visible(n) { if (n.depth === 0) return true; if (n.pulled) return false; var p = n.parent; while (p) { if (p.depth > 0 && !view.expanded[p.id]) return false; if (p.depth === 0 && !view.expanded.root) return false; p = p.parent; } return true; }
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
        var tv = visible(n) ? 1 : 0, ta = tv * (inFocus(n) ? 1 : 0.1);
        var tgt = tv ? n.home : (n.parent ? n.parent.pos : n.home), k = reduce ? 1 : 0.18;
        for (var i = 0; i < 3; i++) { var d = tgt[i] - n.pos[i]; if (Math.abs(d) > 0.05) { n.pos[i] += d * k; dirty = true; } else n.pos[i] = tgt[i]; }
        if (Math.abs(ta - n.alpha) > 0.01) { n.alpha += (ta - n.alpha) * (reduce ? 1 : 0.2); dirty = true; } else n.alpha = ta;
        n.vis = tv;
      });
      if (dirty) draw();
      dirty = false;
      raf = requestAnimationFrame(frame); clearTimeout(fb); fb = setTimeout(function () { if (alive) frame(); }, 60);
    }
    var fb = 0;
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
        if (n.parent && n.depth > 1 && a > 0.05) { var q = n.parent.pr; L += '<line x1="' + q.x.toFixed(1) + '" y1="' + q.y.toFixed(1) + '" x2="' + pr.x.toFixed(1) + '" y2="' + pr.y.toFixed(1) + '" style="stroke:' + (n.hue || '#9fb4ff') + ';opacity:' + (a * 0.45).toFixed(2) + '"/>'; }
        else if (n.depth === 1 && a > 0.05) { var r0 = T.root.pr; L += '<line x1="' + r0.x.toFixed(1) + '" y1="' + r0.y.toFixed(1) + '" x2="' + pr.x.toFixed(1) + '" y2="' + pr.y.toFixed(1) + '" class="l1" style="stroke:' + n.hue + ';opacity:' + (a * 0.25).toFixed(2) + '"/>'; }
      });
      lines.setAttribute('viewBox', '0 0 ' + W + ' ' + H); lines.innerHTML = L;
      ov.querySelectorAll('[data-lv]').forEach(function (b) { b.classList.toggle('on', +b.getAttribute('data-lv') === view.level); });
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
      clearTimeout(tapTimer); tapTimer = setTimeout(function () { lastTap.n = null; if (n.children.length) toggle(n); else peek(n); }, 300);
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
      return '<small>' + esc(sub) + '</small><b>' + esc(tr(n.label)) + '</b>' + extra + '<span class="nb-cact">' + (n.ko ? '<em>' + tr('Tap: open in the five cards') + '</em>' : '') + '<em>' + tr('Double-tap or drag home: put back') + '</em></span>';
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
      var mv = function (e) { if (e.pointerId !== pid) return; it.x = e.clientX - b.left; it.y = e.clientY - b.top; place(it); };
      var en = function (e) { if (e.pointerId !== pid) return; window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', en); window.removeEventListener('pointercancel', en); maybeHome(it); };
      window.addEventListener('pointermove', mv); window.addEventListener('pointerup', en); window.addEventListener('pointercancel', en);
    }
    function place(it) { it.el.style.transform = 'translate(' + it.x.toFixed(0) + 'px,' + it.y.toFixed(0) + 'px) translate(-50%,-50%)'; }
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
      it.el.addEventListener('pointerdown', function (e) { e.stopPropagation(); p0 = { x: e.clientX, y: e.clientY, ox: it.x, oy: it.y, t: performance.now(), id: e.pointerId }; try { it.el.setPointerCapture(e.pointerId); } catch (x) {} held.splice(held.indexOf(it), 1); held.push(it); hand.appendChild(it.el); });
      it.el.addEventListener('pointermove', function (e) { if (!p0 || e.pointerId !== p0.id) return; it.x = p0.ox + e.clientX - p0.x; it.y = p0.oy + e.clientY - p0.y; place(it); });
      it.el.addEventListener('pointerup', function (e) {
        if (!p0) return; var moved = Math.hypot(e.clientX - p0.x, e.clientY - p0.y), q = p0; p0 = null;
        if (moved > 10) return maybeHome(it);
        var now = performance.now();
        if (now - last < 330) { last = 0; clearTimeout(it.t); return putBack(it); }
        last = now; clearTimeout(it.t); it.t = setTimeout(function () { last = 0; if (it.n.ko) { close(); TK.open(it.n.kind === 'concept' ? 'graph' : null, { objectId: it.n.ko, concept: it.n.concept }); } }, 340);
      });
    }
    function peek(n) { var pr = n.pr || homeXY(n), b = stage.getBoundingClientRect(); pull(n, pr.x + b.left + 80, pr.y + b.top, -1); }

    // ---------------------------------------------------------------- controls
    ov.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      if (b.classList.contains('nb-x')) return close();
      if (b.hasAttribute('data-lv')) { remember(); var L = +b.getAttribute('data-lv'); view.expanded = { root: true }; nodes.forEach(function (n) { if (n.depth >= 1 && n.depth < L && n.children.length) view.expanded[n.id] = true; }); view.level = L; view.focus = null; dirty = true; fit(); return; }
      if (b.hasAttribute('data-unfocus')) return focus(null);
      if (b.hasAttribute('data-hb')) { if (!hist.length) return; fut.push(snap()); restore(hist.pop()); return; }
      if (b.hasAttribute('data-hf')) { if (!fut.length) return; hist.push(snap()); restore(fut.pop()); return; }
      if (b.classList.contains('nb-backall')) { held.slice().forEach(putBack); return; }
    });
    function key(e) {
      if (e.key === 'Escape') { if (view.focus) focus(null); else close(); }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); ov.querySelector(e.shiftKey ? '[data-hf]' : '[data-hb]').click(); }
    }
    document.addEventListener('keydown', key);
    function onResize() { size(); dirty = true; }
    window.addEventListener('resize', onResize);
    function close() { alive = false; if (typeof ro !== 'undefined' && ro) ro.disconnect(); cancelAnimationFrame(raf); clearTimeout(fb); document.removeEventListener('keydown', key); window.removeEventListener('resize', onResize); ov.classList.add('out'); setTimeout(function () { ov.remove(); }, reduce ? 0 : 200); if (opts.onClose) opts.onClose(); }
    // the level slider starts at 2 (domains + places)
    view.expanded = { root: true }; nodes.forEach(function (n) { if (n.depth === 1 && n.children.length) view.expanded[n.id] = true; });
    size(); requestAnimationFrame(function () { ov.classList.add('on'); size(); fit(); frame(); });
    if (root.ResizeObserver) { var ro = new ResizeObserver(function () { size(); dirty = true; }); ro.observe(stage); }   // measured again when the frame or tab gets its real size
    return { close: close, view: view, tree: T, toggle: toggle, focus: focus, pull: pull, held: held };
  }

  var api = { tree: tree, layout: layout, open: open };
  root.MinestNebula = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
