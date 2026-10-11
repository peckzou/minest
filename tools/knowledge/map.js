/* Minest Knowledge · Phase 3 — Knowledge Map (a spatial map with zoom navigation, after Prezi)
   One board is one map, read live from the board (no copy):
     the board in the middle · its lists on a ring around it · each list's cards fanned out beyond it ·
     each card's stacked cards around the card · a soft curve from every node to its parent.
   Navigate: tap a node → the camera glides in on it and what belongs to it; tap the focused card again → its details
   (the Kanban's card details sheet). ‹ goes up one level, ⌂ shows the whole map; the path at the top says where
   you are and is tappable. Drag to pan, pinch / wheel to zoom.
   Arrange: drag nodes to new places; a node takes its children along. Places are offsets from the parent node,
   kept in MinestKnowledge (synced, `knowledge.m`); Reset puts the board back to the automatic layout.
   The camera of each board is kept on this device (minest.map.v1). */
(function () {
  if (window.MinestMap) return;
  var KN = function () { return window.MinestKnowledge; };
  var A = function () { return window.MinestAI || {}; };
  var ST_KEY = 'minest.map.v1';
  var S = (function () { try { var v = JSON.parse(localStorage.getItem(ST_KEY) || 'null'); if (v && v.cam) return v; } catch (e) {} return { cam: {}, focus: {} }; })();
  function stSave() { try { localStorage.setItem(ST_KEY, JSON.stringify(S)); } catch (e) {} }
  function boards() { try { return (A().boards && A().boards()) || []; } catch (e) { return []; } }
  function boardById(id) { return boards().filter(function (b) { return b.id === id; })[0] || null; }

  // ================================================================== the graph and its automatic layout
  var SIZE = { board: 168, list: 116, card: 86, item: 70 };
  function graph(b) {
    var nodes = [], byKey = {};
    function add(n, parent) { n.parent = parent || null; n.kids = []; if (parent) parent.kids.push(n); nodes.push(n); byKey[n.k] = n; return n; }
    var root = add({ k: 'B:' + b.id, kind: 'board', title: b.title || 'Board', color: '#7c8cff' });
    (b.columns || []).forEach(function (col) {
      var L = add({ k: 'L:' + col.id, kind: 'list', title: col.title || 'List', color: col.color || '#5097f4', id: col.id }, root);
      (col.cards || []).forEach(function (c) {
        if (!c || !c.id) return;
        var C = add({ k: 'C:' + c.id, kind: 'card', title: c.title || '', color: L.color, id: c.id, col: col.id, done: !!c.complete, heading: KN() && KN().isHeading(c.id) }, L);
        (Array.isArray(c.stack) ? c.stack : []).forEach(function (s) { if (s && s.id) add({ k: 'I:' + s.id, kind: 'item', title: s.title || '', color: L.color, id: s.id, col: col.id, done: !!s.complete }, C); });
      });
    });
    layout(root);
    return { root: root, nodes: nodes, byKey: byKey };
  }
  // each list gets a slice of the circle in proportion to its cards; its cards fill that slice ring by ring,
  // so lists never run into each other; stacked cards sit around their card (shown when the card is in focus)
  function layout(root) {
    root.x = 0; root.y = 0; root.a = 0;
    var L = root.kids, W = 0;
    L.forEach(function (l) { l.w = 1.4 + l.kids.length; W += l.w; });
    var MIN = .42, slices = L.map(function (l) { return Math.max(MIN, Math.PI * 2 * l.w / Math.max(1, W)); });
    var sum = slices.reduce(function (a, b) { return a + b; }, 0); slices = slices.map(function (x) { return x * Math.PI * 2 / sum; });
    var R1 = Math.max(420, L.length * 70);
    var a0 = -Math.PI / 2 - slices[0] / 2;
    L.forEach(function (l, i) {
      var a = a0 + slices[i] / 2; a0 += slices[i];
      place(l, root, Math.cos(a) * R1, Math.sin(a) * R1, a);
      var half = slices[i] / 2 * .82, cards = l.kids.slice(), ring = 0, GAP = 98;
      while (cards.length) {
        var r = R1 + 150 + ring * 96, cap = Math.max(1, Math.floor(2 * half * r / GAP)), row = cards.splice(0, cap), m = row.length;
        row.forEach(function (c, j) {
          var ca = a + (m === 1 ? 0 : (j / (m - 1) - .5) * Math.min(2 * half, (m - 1) * GAP / r));
          place(c, l, Math.cos(ca) * r - l.x, Math.sin(ca) * r - l.y, ca);
          var q = c.kids.length;
          c.kids.forEach(function (it, k) { var ia = ca + (q === 1 ? 0 : (k / q) * Math.PI * 2); place(it, c, Math.cos(ia) * 88, Math.sin(ia) * 88, ia); });
        });
        ring++;
      }
    });
  }
  function place(n, p, dx, dy, a) {
    var saved = KN() && KN().posOf(n.k);
    if (saved) { dx = saved.dx; dy = saved.dy; }
    n.dx = dx; n.dy = dy; n.a = Math.atan2(dy, dx) || a; n.x = p.x + dx; n.y = p.y + dy;
  }
  function moveTree(n, ddx, ddy) { n.x += ddx; n.y += ddy; n.kids.forEach(function (k) { moveTree(k, ddx, ddy); }); }

  // ================================================================== UI
  var ui = { open: false };
  var G = null, cam = { x: 0, y: 0, s: .5 }, focusKey = null, arrange = false;
  var I = function (d) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + d + '</svg>'; };
  var ICON = {
    map: I('<circle cx="12" cy="12" r="3"/><circle cx="4.5" cy="6" r="2"/><circle cx="19.5" cy="6" r="2"/><circle cx="5" cy="18.5" r="2"/><circle cx="19" cy="18.5" r="2"/><path d="m6.3 7 3.3 3M17.7 7l-3.3 3M6.6 17.2l3.2-3M17.4 17.2l-3.2-3"/>'),
    home: I('<path d="m3 11 9-7 9 7"/><path d="M5 10v10h14V10"/>'), back: I('<path d="m15 6-6 6 6 6"/>'),
    fit: I('<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>'), move: I('<path d="M12 3v18M3 12h18"/><path d="m9 6 3-3 3 3M9 18l3 3 3-3M6 9l-3 3 3 3M18 9l3 3-3 3"/>')
  };
  var CSS = [
    '.km{position:fixed;inset:0;z-index:2147482000;overflow:hidden;color:#fff;font:15px/1.25 -apple-system,BlinkMacSystemFont,"SF Pro Text",system-ui,sans-serif;-webkit-font-smoothing:antialiased;' +
      'background:radial-gradient(1200px 900px at 50% 40%,#1d2a44,#0c1220 70%);touch-action:none;-webkit-user-select:none;user-select:none}',
    '.km.away{visibility:hidden}',
    '.km-stage{position:absolute;inset:0;overflow:hidden;cursor:grab}',
    '.km-stage.drag{cursor:grabbing}',
    '.km-world{position:absolute;left:0;top:0;width:0;height:0;transform-origin:0 0;will-change:transform}',
    '.km-lines{position:absolute;left:0;top:0;overflow:visible;pointer-events:none}',
    '.km-lines path{fill:none;stroke:rgba(255,255,255,.2);stroke-width:2}',
    '.km-lines path.on{stroke:rgba(255,255,255,.55);stroke-width:2.5}',
    '.km-n{position:absolute;display:flex;align-items:center;justify-content:center;text-align:center;border-radius:50%;padding:10px;box-sizing:border-box;cursor:pointer;' +
      'background:radial-gradient(120% 90% at 30% 15%,rgba(255,255,255,.34),rgba(255,255,255,0) 55%),radial-gradient(circle at 50% 60%,color-mix(in srgb,var(--c) 70%,#0b1220),color-mix(in srgb,var(--c) 40%,#0b1220));' +
      'border:1.5px solid color-mix(in srgb,var(--c) 60%,#fff 40%);box-shadow:inset 0 1px 0 rgba(255,255,255,.35),0 10px 26px rgba(0,0,0,.35);transition:opacity .3s,box-shadow .3s}',
    '.km-n span{display:-webkit-box;-webkit-box-orient:vertical;overflow:hidden;overflow-wrap:break-word;-webkit-hyphens:auto;hyphens:auto}',
    '.km-n.board{font-size:22px;font-weight:750;letter-spacing:-.3px}',
    '.km-n.board span{-webkit-line-clamp:4}',
    '.km-n.list{font-size:15px;font-weight:700}',
    '.km-n.list span{-webkit-line-clamp:4}',
    '.km-n.card{font-size:11.5px;font-weight:600}',
    '.km-n.card span{-webkit-line-clamp:4}',
    '.km-n.item{font-size:9.5px;font-weight:650;padding:7px}',
    '.km-n.item span{-webkit-line-clamp:3}',
    '.km-n.head{border-color:#ffd60a;border-width:2.5px}',
    '.km-n.done{opacity:.5}',
    '.km-n.dim{opacity:.28}',
    '.km.deep .km-n.dim{opacity:.12}',
    '.km-n.focus{z-index:2}',
    '.km-n.item.show{z-index:3}',
    '.km-n.item{opacity:0;pointer-events:none;scale:.4;transition:opacity .3s,scale .35s cubic-bezier(.2,.85,.25,1.2)}',
    '.km-n.item.show{opacity:1;pointer-events:auto;scale:1}',
    '.km-lines path.it{opacity:0;transition:opacity .3s}',
    '.km-lines path.it.show{opacity:1}',
    '.km-n.focus{box-shadow:0 0 0 4px rgba(255,255,255,.85),0 0 40px 8px color-mix(in srgb,var(--c) 60%,transparent),0 14px 32px rgba(0,0,0,.4)}',
    '.km.arr .km-n{cursor:move;animation:kmWig 1.1s ease-in-out infinite alternate}',
    '@keyframes kmWig{from{rotate:-1.2deg}to{rotate:1.2deg}}',
    // the bar
    '.km-top{position:absolute;left:0;right:0;top:0;display:flex;align-items:center;gap:8px;padding:calc(env(safe-area-inset-top,0px) + 12px) 12px 10px;pointer-events:none}',
    '.km-top > *{pointer-events:auto}',
    '.km-b{flex:none;height:38px;min-width:38px;padding:0 11px;border-radius:999px;display:inline-flex;align-items:center;justify-content:center;gap:6px;border:1px solid rgba(255,255,255,.16);color:#fff;cursor:pointer;font:600 13px -apple-system,system-ui,sans-serif;' +
      'background:linear-gradient(180deg,rgba(66,76,92,.72),rgba(30,36,48,.82));-webkit-backdrop-filter:blur(20px);backdrop-filter:blur(20px);box-shadow:inset 0 1px 0 rgba(255,255,255,.2),0 8px 20px rgba(0,0,0,.3)}',
    '.km-b svg{width:18px;height:18px}',
    '.km-b.on{background:linear-gradient(180deg,rgba(10,132,255,.8),rgba(10,100,220,.8))}',
    '.km-path{flex:1;min-width:0;display:flex;gap:4px;align-items:center;overflow-x:auto;scrollbar-width:none;white-space:nowrap;padding:0 4px;height:38px;border-radius:999px;background:rgba(20,26,38,.5);-webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px)}',
    '.km-path::-webkit-scrollbar{display:none}',
    '.km-path button{border:0;background:none;color:rgba(255,255,255,.65);font:600 13px -apple-system,system-ui,sans-serif;padding:6px 6px;cursor:pointer;max-width:160px;overflow:hidden;text-overflow:ellipsis}',
    '.km-path button:last-child{color:#fff}',
    '.km-path i{opacity:.35;font-style:normal}',
    '.km-bot{position:absolute;right:12px;bottom:calc(env(safe-area-inset-bottom,0px) + 14px);display:flex;flex-direction:column;gap:8px}',
    '.km-hint{position:absolute;left:50%;bottom:calc(env(safe-area-inset-bottom,0px) + 18px);transform:translateX(-50%);padding:8px 14px;border-radius:999px;background:rgba(20,26,38,.7);font-size:13px;opacity:.85;pointer-events:none;white-space:nowrap;transition:opacity .4s}',
    'html.kn-open #minest-mini-pet-p0,html.kn-open .mpet-menu,html.kn-open .mpet-say,html.kn-open .mpet-tip{display:none!important}'
  ].join('\n');
  function ensureCss() { if (document.getElementById('km-css')) return; var s = document.createElement('style'); s.id = 'km-css'; s.textContent = CSS; document.head.appendChild(s); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function toast(m) { try { if (window.GlassUI && GlassUI.toast) GlassUI.toast(m); } catch (e) {} }

  function build() {
    var b = boardById(ui.bid); if (!b) return;
    G = graph(b);
    var html = '';
    G.nodes.forEach(function (n) {
      var d = SIZE[n.kind];
      html += '<div class="km-n ' + n.kind + (n.heading ? ' head' : '') + (n.done ? ' done' : '') + '" data-k="' + esc(n.k) + '" style="--c:' + esc(n.color) + ';width:' + d + 'px;height:' + d + 'px"><span>' + esc(n.title || '·') + '</span></div>';
    });
    ui.world.innerHTML = '<svg class="km-lines" width="1" height="1"></svg>' + html;
    ui.svg = ui.world.querySelector('.km-lines');
    ui.els = {}; ui.world.querySelectorAll('.km-n').forEach(function (e) { ui.els[e.getAttribute('data-k')] = e; });
    positions(); markFocus();
  }
  function positions() {
    var paths = '';
    G.nodes.forEach(function (n) {
      var d = SIZE[n.kind], e = ui.els[n.k];
      e.style.transform = 'translate(' + (n.x - d / 2) + 'px,' + (n.y - d / 2) + 'px)';
      if (n.parent) {
        var p = n.parent, mx = (p.x + n.x) / 2, my = (p.y + n.y) / 2, nx = -(n.y - p.y) * .12, ny = (n.x - p.x) * .12;
        paths += '<path data-k="' + esc(n.k) + '"' + (n.kind === 'item' ? ' class="it"' : '') + ' d="M' + p.x + ' ' + p.y + ' Q' + (mx + nx) + ' ' + (my + ny) + ' ' + n.x + ' ' + n.y + '"/>';
      }
    });
    ui.svg.innerHTML = paths;
  }
  function applyCam() { ui.world.style.transform = 'translate(' + (innerWidth / 2 - cam.x * cam.s) + 'px,' + (innerHeight / 2 - cam.y * cam.s) + 'px) scale(' + cam.s + ')'; }
  function saveCam() { S.cam[ui.bid] = { x: Math.round(cam.x), y: Math.round(cam.y), s: +cam.s.toFixed(3) }; S.focus[ui.bid] = focusKey; stSave(); }

  // ---------------------------------------------------------------- camera
  var anim = 0;
  function bbox(list) {
    var x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    list.forEach(function (n) { var r = SIZE[n.kind] / 2; x0 = Math.min(x0, n.x - r); y0 = Math.min(y0, n.y - r); x1 = Math.max(x1, n.x + r); y1 = Math.max(y1, n.y + r); });
    return { x0: x0, y0: y0, x1: x1, y1: y1 };
  }
  function camFor(list) {
    var bb = bbox(list), top = 70, bot = 40, side = 24;
    var w = Math.max(1, bb.x1 - bb.x0), h = Math.max(1, bb.y1 - bb.y0);
    var s = Math.min((innerWidth - side * 2) / w, (innerHeight - top - bot) / h);
    s = Math.max(.08, Math.min(2.6, s));
    return { x: (bb.x0 + bb.x1) / 2, y: (bb.y0 + bb.y1) / 2 - (top - bot) / 2 / s, s: s };
  }
  function fly(to, ms) {
    cancelAnimationFrame(anim);
    var from = { x: cam.x, y: cam.y, s: cam.s }, t0 = performance.now(); ms = ms || 650;
    // zoom out a little on the way when the move is long (Prezi's arc)
    var dist = Math.hypot(to.x - from.x, to.y - from.y) * Math.min(from.s, to.s), lift = Math.min(.45, dist / 2400);
    (function step(now) {
      var p = Math.min(1, (now - t0) / ms), e = p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
      var ls = Math.exp(Math.log(from.s) + (Math.log(to.s) - Math.log(from.s)) * e) * (1 - lift * Math.sin(Math.PI * e));
      cam.x = from.x + (to.x - from.x) * e; cam.y = from.y + (to.y - from.y) * e; cam.s = ls;
      applyCam();
      if (p < 1) anim = requestAnimationFrame(step); else saveCam();
    })(t0);
  }
  function focusOn(k, ms) {
    var n = G && G.byKey[k]; if (!n) return;
    focusKey = n.kind === 'board' ? null : k;
    var set = [n].concat(n.kids);
    if (n.kind === 'item') set = [n, n.parent];
    fly(camFor(set), ms);
    markFocus(); crumbs();
  }
  function home(ms) { focusKey = null; fly(camFor(G.nodes.filter(function (n) { return n.kind !== 'item'; })), ms); markFocus(); crumbs(); }
  function markFocus() {
    var f = focusKey && G.byKey[focusKey], keep = {};
    if (f) { keep[f.k] = 1; f.kids.forEach(function (k) { keep[k.k] = 1; }); for (var p = f.parent; p; p = p.parent) keep[p.k] = 1; if (f.kind === 'item') f.parent.kids.forEach(function (k) { keep[k.k] = 1; }); }
    var card = f && (f.kind === 'card' ? f : f.kind === 'item' ? f.parent : null);
    ui.el.classList.toggle('deep', !!card);
    G.nodes.forEach(function (n) {
      var e = ui.els[n.k]; e.classList.toggle('focus', !!f && n.k === f.k); e.classList.toggle('dim', !!f && !keep[n.k]);
      if (n.kind === 'item') e.classList.toggle('show', !!card && n.parent === card);
    });
    ui.svg.querySelectorAll('path').forEach(function (p) {
      var n = G.byKey[p.getAttribute('data-k')];
      p.classList.toggle('on', !!f && !!keep[n.k] && !!keep[(n.parent || {}).k]);
      if (n.kind === 'item') p.classList.toggle('show', !!card && n.parent === card);
    });
  }
  function crumbs() {
    var chain = [], n = focusKey && G.byKey[focusKey];
    for (; n; n = n.parent) chain.unshift(n);
    if (!chain.length) chain = [G.root];
    ui.path.innerHTML = chain.map(function (c, i) { return (i ? '<i>›</i>' : '') + '<button type="button" data-crumb="' + esc(c.k) + '">' + esc(c.title || '·') + '</button>'; }).join('');
    ui.path.scrollLeft = ui.path.scrollWidth;
    ui.backBtn.style.opacity = focusKey ? '1' : '.4';
  }

  // ---------------------------------------------------------------- gestures: pan, pinch, wheel, tap, arrange-drag
  function wire() {
    var st = ui.stage, pts = {}, g = null;
    function w2s(x, y) { return { x: (x - cam.x) * cam.s + innerWidth / 2, y: (y - cam.y) * cam.s + innerHeight / 2 }; }
    function s2w(x, y) { return { x: (x - innerWidth / 2) / cam.s + cam.x, y: (y - innerHeight / 2) / cam.s + cam.y }; }
    st.addEventListener('pointerdown', function (e) {
      e.stopPropagation(); cancelAnimationFrame(anim);
      try { st.setPointerCapture(e.pointerId); } catch (x) {}
      pts[e.pointerId] = { x: e.clientX, y: e.clientY };
      var ids = Object.keys(pts);
      if (ids.length === 2) {
        var a = pts[ids[0]], b = pts[ids[1]];
        g = { kind: 'pinch', d0: Math.hypot(a.x - b.x, a.y - b.y), s0: cam.s, c0: s2w((a.x + b.x) / 2, (a.y + b.y) / 2) };
        return;
      }
      var ne = e.target.closest('.km-n');
      g = { kind: 'pan', x0: e.clientX, y0: e.clientY, cx: cam.x, cy: cam.y, moved: false, node: ne ? ne.getAttribute('data-k') : null, t: Date.now() };
      if (arrange && g.node && G.byKey[g.node].kind !== 'board') { g.kind = 'node'; var n = G.byKey[g.node]; g.nx = n.x; g.ny = n.y; }
    });
    st.addEventListener('pointermove', function (e) {
      if (!pts[e.pointerId] || !g) return;
      pts[e.pointerId] = { x: e.clientX, y: e.clientY };
      if (g.kind === 'pinch') {
        var ids = Object.keys(pts); if (ids.length < 2) return;
        var a = pts[ids[0]], b = pts[ids[1]], d = Math.hypot(a.x - b.x, a.y - b.y), mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        cam.s = Math.max(.06, Math.min(3, g.s0 * d / Math.max(1, g.d0)));
        cam.x = g.c0.x - (mid.x - innerWidth / 2) / cam.s; cam.y = g.c0.y - (mid.y - innerHeight / 2) / cam.s;
        applyCam(); return;
      }
      var dx = e.clientX - g.x0, dy = e.clientY - g.y0;
      if (!g.moved && Math.hypot(dx, dy) < 6) return;
      g.moved = true; st.classList.add('drag');
      if (g.kind === 'node') {
        var n = G.byKey[g.node], tx = g.nx + dx / cam.s, ty = g.ny + dy / cam.s;
        moveTree(n, tx - n.x, ty - n.y); positions(); return;
      }
      cam.x = g.cx - dx / cam.s; cam.y = g.cy - dy / cam.s; applyCam();
    });
    function up(e) {
      if (!pts[e.pointerId]) return;
      delete pts[e.pointerId];
      st.classList.remove('drag');
      if (!g) return;
      var was = g; if (Object.keys(pts).length === 0) g = null; else if (was.kind === 'pinch') { g = null; }
      if (was.kind === 'pinch') { saveCam(); return; }
      if (was.kind === 'node' && was.moved) { var n = G.byKey[was.node]; KN().setPos(n.k, n.x - n.parent.x, n.y - n.parent.y); return; }
      if (was.moved) { saveCam(); return; }
      if (e.type === 'pointercancel') return;
      tap(was.node);
    }
    st.addEventListener('pointerup', up); st.addEventListener('pointercancel', up);
    st.addEventListener('wheel', function (e) {
      e.preventDefault(); e.stopPropagation(); cancelAnimationFrame(anim);
      var before = s2w(e.clientX, e.clientY);
      cam.s = Math.max(.06, Math.min(3, cam.s * Math.exp(-e.deltaY * (e.ctrlKey ? .01 : .0018))));
      cam.x = before.x - (e.clientX - innerWidth / 2) / cam.s; cam.y = before.y - (e.clientY - innerHeight / 2) / cam.s;
      applyCam(); clearTimeout(ui.wt); ui.wt = setTimeout(saveCam, 300);
    }, { passive: false });
    ['touchstart', 'touchmove'].forEach(function (ev) { ui.el.addEventListener(ev, function (e) { e.stopPropagation(); }, { passive: true }); });
    ui.el.querySelector('.km-top').addEventListener('pointerdown', function (e) { e.stopPropagation(); });
    ui.el.querySelector('.km-bot').addEventListener('pointerdown', function (e) { e.stopPropagation(); });
    ui.el.addEventListener('click', function (e) {
      var c = e.target.closest('[data-crumb]'); if (c) { var k = c.getAttribute('data-crumb'); return G.byKey[k].kind === 'board' ? home() : focusOn(k); }
      var b = e.target.closest('[data-act]'); if (!b) return;
      var a = b.getAttribute('data-act');
      if (a === 'x') return close();
      if (a === 'home') return home();
      if (a === 'back') { var f = focusKey && G.byKey[focusKey]; if (!f) return; return f.parent && f.parent.kind !== 'board' ? focusOn(f.parent.k) : home(); }
      if (a === 'fit') return focusKey ? focusOn(focusKey) : home();
      if (a === 'arr') { arrange = !arrange; b.classList.toggle('on', arrange); ui.el.classList.toggle('arr', arrange); hint(arrange ? 'Drag the bubbles to arrange your map' : ''); return; }
      if (a === 'reset') { KN().clearPos(G.nodes.map(function (n) { return n.k; })); build(); home(); return; }
      if (a === 'boards') return boardMenu(b);
    });
  }
  function tap(k) {
    if (!k) return;
    var n = G.byKey[k]; if (!n) return;
    if (arrange) return;
    if (n.kind === 'board') return home();
    if (focusKey === k && (n.kind === 'card' || n.kind === 'item')) return details(n);
    if (n.kind === 'item' && focusKey !== k) { focusOn(k); return; }
    focusOn(k);
  }
  var hintT = 0;
  function hint(t) { ui.hint.textContent = t; ui.hint.style.opacity = t ? '.85' : '0'; clearTimeout(hintT); if (t) hintT = setTimeout(function () { ui.hint.style.opacity = '0'; }, 3500); }

  // ---------------------------------------------------------------- details (the Kanban's sheet sits under this view: step aside)
  function details(n) {
    if (!A().openCardIn) return;
    ui.el.classList.add('away');
    A().openCardIn(ui.bid, n.col, n.id);
    var t0 = Date.now(), seen = false, gone = 0;
    var modal = function () { return document.querySelector('.mn-dm, .mn-cardsheet, .fixed.inset-0.z-50 .rounded-3xl'); };
    var iv = setInterval(function () {
      if (modal()) { seen = true; gone = 0; return; }
      if (seen) gone++;
      if ((seen && gone >= 2) || (!seen && Date.now() - t0 > 2500)) { clearInterval(iv); if (!ui.el) return; ui.el.classList.remove('away'); var fk = focusKey; build(); if (fk && G.byKey[fk]) { focusKey = fk; markFocus(); crumbs(); } }
    }, 250);
  }
  function boardMenu(anchor) {
    var old = document.querySelector('.km-menu'); if (old) { old.remove(); return; }
    var m = document.createElement('div'); m.className = 'en-menu km-menu';
    m.innerHTML = boards().filter(function (b) { return !b.archived; }).map(function (b) { return '<button type="button" data-b="' + esc(b.id) + '"' + (b.id === ui.bid ? ' class="on"' : '') + '>' + esc(b.title || 'Board') + '</button>'; }).join('');
    document.body.appendChild(m);
    var r = anchor.getBoundingClientRect(); m.style.left = Math.max(10, Math.min(innerWidth - m.offsetWidth - 10, r.left)) + 'px'; m.style.top = (r.bottom + 8) + 'px';
    m.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
    m.addEventListener('click', function (e) { var b = e.target.closest('[data-b]'); if (!b) return; m.remove(); saveCam(); ui.bid = b.getAttribute('data-b'); focusKey = null; build(); restore(); });
  }
  function restore() {
    var c = S.cam[ui.bid];
    if (c) { cam = { x: c.x, y: c.y, s: c.s }; applyCam(); var f = S.focus[ui.bid]; focusKey = f && G.byKey[f] ? f : null; markFocus(); crumbs(); }
    else { var hc = camFor(G.nodes.filter(function (n) { return n.kind !== 'item'; })); cam = { x: hc.x, y: hc.y, s: hc.s * .7 }; applyCam(); home(700); }
  }

  // ---------------------------------------------------------------- open / close
  function open(boardId) {
    if (ui.open) return;
    ensureCss();
    var a = A().board && A().board();
    ui.bid = boardId || (a && a.id) || (boards()[0] || {}).id;
    if (!ui.bid) return toast('No board yet.');
    var el = document.createElement('div'); el.className = 'km'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Knowledge Map');
    el.innerHTML = '<div class="km-stage"><div class="km-world"></div></div>' +
      '<div class="km-top"><button type="button" class="km-b" data-act="back" aria-label="Up one level">' + ICON.back + '</button>' +
      '<div class="km-path"></div>' +
      '<button type="button" class="km-b" data-act="boards" aria-label="Boards">' + ICON.map + '</button>' +
      '<button type="button" class="km-b" data-act="x" aria-label="Close"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div>' +
      '<div class="km-bot"><button type="button" class="km-b" data-act="home" aria-label="Whole map">' + ICON.home + '</button>' +
      '<button type="button" class="km-b" data-act="fit" aria-label="Fit to screen">' + ICON.fit + '</button>' +
      '<button type="button" class="km-b" data-act="arr" aria-label="Arrange">' + ICON.move + '</button>' +
      '<button type="button" class="km-b" data-act="reset" aria-label="Reset layout" title="Reset layout">↺</button></div>' +
      '<div class="km-hint" style="opacity:0"></div>';
    ui.el = el; ui.stage = el.querySelector('.km-stage'); ui.world = el.querySelector('.km-world'); ui.path = el.querySelector('.km-path'); ui.backBtn = el.querySelector('[data-act="back"]'); ui.hint = el.querySelector('.km-hint');
    ui.open = true; arrange = false;
    document.body.appendChild(el); document.documentElement.classList.add('kn-open');
    build(); wire(); restore();
    if (!S.seen) { S.seen = 1; stSave(); hint('Tap a bubble to zoom in · tap again for details'); }
    if (el.animate) el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 260, easing: 'ease-out' });
    window.addEventListener('resize', onResize);
  }
  function onResize() { if (ui.open) applyCam(); }
  function close() {
    if (!ui.open) return;
    saveCam(); cancelAnimationFrame(anim);
    var el = ui.el; ui.open = false; ui.el = null;
    document.documentElement.classList.remove('kn-open'); window.removeEventListener('resize', onResize);
    var m = document.querySelector('.km-menu'); if (m) m.remove();
    if (el.animate) { var an = el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: 'forwards' }); an.onfinish = function () { el.remove(); }; } else el.remove();
  }
  if (KN() && KN().onChange) KN().onChange(function () { if (ui.open && !ui.el.classList.contains('away')) { var fk = focusKey; build(); focusKey = fk && G.byKey[fk] ? fk : null; markFocus(); crumbs(); } });

  function trigger() {
    if (document.getElementById('mn-map-trigger') || !document.body) return;
    var b = document.createElement('button'); b.type = 'button'; b.id = 'mn-map-trigger'; b.title = 'Knowledge Map'; b.setAttribute('aria-label', 'Knowledge Map');
    b.style.display = 'none'; b.innerHTML = ICON.map;
    b.addEventListener('click', function () { if (ui.open) close(); else open(); });
    document.body.appendChild(b);
  }
  if (document.body) trigger(); else document.addEventListener('DOMContentLoaded', trigger);

  window.MinestMap = { open: open, close: close, toggle: function () { if (ui.open) close(); else open(); }, isOpen: function () { return ui.open; }, icon: ICON.map,
    _focus: function (k) { focusOn(k, 1); }, _tap: tap, _state: function () { return { cam: cam, focus: focusKey, n: G ? G.nodes.length : 0 }; }, _graph: function () { return G; }, _home: function () { home(1); } };
})();
