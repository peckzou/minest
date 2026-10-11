/* Minest Knowledge · Phase 5 — Learning Map (an arcade stage-select map of knowledge)
   Works on any board (and on boards made from JSON by tools/knowledge/kjson.js):
     list → Knowledge State (a region) · section-heading card → Stage (a little building) · card → Knowledge Block
     (a small cube). Cards before a list's first heading form the list's first stage.
   Template "regions": a stylised U.S. outline cut into one region per state (fixed slots, so places never move; the
     regions are knowledge areas, labelled as such — not real states), a road from stage to stage in route order,
     light 2.5D (raised regions, cubes, hills and trees).
   Template "route": places joined by journeys (numbered stops, arrows); tap a place for its stops.
   Progress comes from the Learning Path (MinestLearn.cardStatus: studied / mastered — opening a card is not
   mastering it): mastered blocks light up gold, blocks in progress glow, the next ones are available, the rest dim.
   ◎ You Are Here = the first block not yet mastered along the route (Guided: stages unlock in order; Free: all open).
   Edit: drag regions (their size follows), stages and blocks; region colour / icon / name; background; route order;
   Reset to Template. Edits and the camera are view settings (MinestKnowledge, synced / this device) — the knowledge
   itself is never copied. */
(function () {
  if (window.MinestLearnMap) return;
  var KN = function () { return window.MinestKnowledge; };
  var A = function () { return window.MinestAI || {}; };
  var ST_KEY = 'minest.lmap.v1';
  var S = (function () { try { var v = JSON.parse(localStorage.getItem(ST_KEY) || 'null'); if (v && v.cam) return v; } catch (e) {} return { cam: {} }; })();
  function stSave() { try { localStorage.setItem(ST_KEY, JSON.stringify(S)); } catch (e) {} }
  function boards() { try { return (A().boards && A().boards()) || []; } catch (e) { return []; } }
  function boardById(id) { return boards().filter(function (b) { return b.id === id; })[0] || null; }
  function cfgOf(bid) { return (KN() && KN().get('lm:cfg:' + bid)) || {}; }
  function setCfg(bid, patch) { KN().set('lm:cfg:' + bid, Object.assign({}, cfgOf(bid), patch)); }
  function ov(key) { return KN() ? KN().get('lm:' + key) : null; }
  function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rnd(seed) { var x = seed || 1; return function () { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; return ((x >>> 0) % 10000) / 10000; }; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function toast(m) { try { if (window.GlassUI && GlassUI.toast) GlassUI.toast(m); } catch (e) {} }
  function shade(hex, k) { var n = parseInt(String(hex || '#888').replace('#', '').slice(0, 6), 16); if (isNaN(n)) n = 0x888888; var r = n >> 16, g = n >> 8 & 255, b = n & 255; var f = function (v) { return Math.max(0, Math.min(255, Math.round(k > 0 ? v + (255 - v) * k : v * (1 + k)))); }; return 'rgb(' + f(r) + ',' + f(g) + ',' + f(b) + ')'; }

  // ================================================================== geometry
  var TILT = .6, TOP = 40, DEPTH = 12;
  function P(x, y) { return [x, y * TILT + TOP]; }
  // a stylised outline of the contiguous U.S. (1000 × 620 map units) — a backdrop, not a political map
  var US = [[40,40],[330,40],[560,40],[600,70],[640,95],[700,110],[760,120],[800,130],[850,105],[890,80],[920,40],[960,70],[940,110],[900,140],[880,160],[860,185],[845,215],[840,240],[830,280],[790,330],[770,370],[780,420],[800,480],[790,540],[760,520],[740,440],[700,420],[640,430],[600,445],[560,450],[520,470],[480,540],[440,500],[400,440],[360,430],[330,420],[250,420],[200,400],[140,380],[110,330],[70,250],[50,170],[40,110]];
  // region slots, in the order lists fill them (spread west → east, north → south)
  var SLOTS = [[140,230],[320,140],[440,370],[590,200],[700,380],[870,190],[250,350],[470,90],[760,260],[560,320]];   // a west → east snake: the road runs region to region
  function clip(poly, a, b, c) {   // keep the side where a·x + b·y <= c
    var out = [];
    for (var i = 0; i < poly.length; i++) {
      var p = poly[i], q = poly[(i + 1) % poly.length], ip = a * p[0] + b * p[1] <= c, iq = a * q[0] + b * q[1] <= c;
      if (ip) out.push(p);
      if (ip !== iq) { var t = (c - a * p[0] - b * p[1]) / (a * (q[0] - p[0]) + b * (q[1] - p[1])); out.push([p[0] + t * (q[0] - p[0]), p[1] + t * (q[1] - p[1])]); }
    }
    return out;
  }
  function cells(seeds) {
    return seeds.map(function (s, i) {
      var poly = US.slice();
      seeds.forEach(function (t, j) { if (i === j || poly.length < 3) return; poly = clip(poly, t[0] - s[0], t[1] - s[1], (t[0] * t[0] + t[1] * t[1] - s[0] * s[0] - s[1] * s[1]) / 2); });
      return poly;
    });
  }
  function inside(pt, poly) { var c = false; for (var i = 0, j = poly.length - 1; i < poly.length; j = i++) { var a = poly[i], b = poly[j]; if ((a[1] > pt[1]) !== (b[1] > pt[1]) && pt[0] < (b[0] - a[0]) * (pt[1] - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; }
  function edgeDist(pt, poly) { var d = Infinity; for (var i = 0; i < poly.length; i++) { var a = poly[i], b = poly[(i + 1) % poly.length], dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy || 1, t = Math.max(0, Math.min(1, ((pt[0] - a[0]) * dx + (pt[1] - a[1]) * dy) / L)); d = Math.min(d, Math.hypot(pt[0] - a[0] - t * dx, pt[1] - a[1] - t * dy)); } return d; }
  // 2-opt: reverse a stretch of the path whenever that makes it shorter, so the road does not cross itself
  function untangle(p) {
    var D = function (a, b) { return Math.hypot(a[0] - b[0], a[1] - b[1]); }, better = true, guard = 0;
    while (better && guard++ < 40) {
      better = false;
      for (var i = 0; i < p.length - 2; i++) for (var k = i + 2; k < p.length - 1; k++) {
        if (D(p[i], p[k]) + D(p[i + 1], p[k + 1]) < D(p[i], p[i + 1]) + D(p[k], p[k + 1]) - .01) { var seg = p.slice(i + 1, k + 1).reverse(); for (var q = 0; q < seg.length; q++) p[i + 1 + q] = seg[q]; better = true; }
      }
    }
    return p;
  }
  function centroid(poly) { var x = 0, y = 0; poly.forEach(function (p) { x += p[0]; y += p[1]; }); return [x / poly.length, y / poly.length]; }

  // ================================================================== the learning graph of a board
  function status(card, col) {
    var L = window.MinestLearn, st = null;
    try { if (L && L.cardStatus) st = L.cardStatus(card, col); } catch (e) {}
    if (st) return st.mastered ? 'mastered' : st.studied ? 'progress' : 'new';
    var m = +card.mastery || 0;
    return m >= 4 ? 'mastered' : m >= 2 ? 'progress' : 'new';
  }
  function graph(b) {
    var cfg = cfgOf(b.id), states = [], stages = [], byKey = {};
    (b.columns || []).forEach(function (col, i) {
      var st = { k: 'S:' + col.id, kind: 'state', id: col.id, title: col.title || 'List', color: (ov('color:' + col.id) || col.color || '#5097f4'), icon: ov('icon:' + col.id) || ((cfg.states || {})[col.id] || {}).icon || '', i: i, stages: [], col: col };
      states.push(st); byKey[st.k] = st;
      var cur = null, stageOf = cfg.stageOf || {};
      // a block belongs to the stage recorded for it (JSON boards — the Kanban may reorder cards), else to the heading above it
      (col.cards || []).forEach(function (c) { if (c && c.id && KN().isHeading(c.id)) { var g = { k: 'G:' + c.id, kind: 'stage', id: c.id, title: c.title || 'Stage', state: st, blocks: [], card: c }; byKey[g.k] = g; } });
      (col.cards || []).forEach(function (c) {
        if (!c || !c.id) return;
        if (KN().isHeading(c.id)) { cur = byKey['G:' + c.id]; st.stages.push(cur); stages.push(cur); return; }
        var home = stageOf[c.id] && byKey['G:' + stageOf[c.id]];
        var into = home && home.state === st ? home : cur;
        if (!into) { if (!byKey['G:start-' + col.id]) { var v = { k: 'G:start-' + col.id, kind: 'stage', id: 'start-' + col.id, title: col.title || 'Start', state: st, blocks: [], virtual: true }; byKey[v.k] = v; st.stages.unshift(v); stages.push(v); } into = byKey['G:start-' + col.id]; }
        var bl = { k: 'B:' + c.id, kind: 'block', id: c.id, title: c.title || '', stage: into, card: c, col: col, st: status(c, col) };
        into.blocks.push(bl); byKey[bl.k] = bl;
      });
    });
    // route order
    var order = Array.isArray(cfg.order) ? cfg.order.slice() : [];
    var route = order.map(function (id) { return byKey['G:' + id]; }).filter(Boolean);
    stages.forEach(function (s) { if (route.indexOf(s) < 0) route.push(s); });
    route.forEach(function (s, i) { s.n = i + 1; s.done = s.blocks.length > 0 && s.blocks.every(function (x) { return x.st === 'mastered'; }); s.started = s.blocks.some(function (x) { return x.st !== 'new'; }); });
    var mode = cfg.mode === 'free' ? 'free' : 'guided', req = cfg.requires || {};
    var firstOpen = route.filter(function (s) { return !s.done; })[0] || null;
    route.forEach(function (s) {
      var r = req[s.id];
      s.open = mode === 'free' ? true : r && r.length ? r.every(function (id) { var x = byKey['G:' + id]; return !x || x.done; }) : (s.done || s === firstOpen || route.indexOf(s) <= route.indexOf(firstOpen));
    });
    // You Are Here: the first block not mastered along the route (a block already in progress first)
    var here = null, next = null;
    for (var i = 0; i < route.length && !here; i++) { var s = route[i]; if (!s.open) continue; here = s.blocks.filter(function (x) { return x.st === 'progress'; })[0] || s.blocks.filter(function (x) { return x.st !== 'mastered'; })[0] || null; }
    if (here) { var flat = []; route.forEach(function (s) { s.blocks.forEach(function (x) { flat.push(x); }); }); next = flat.slice(flat.indexOf(here) + 1).filter(function (x) { return x.st !== 'mastered'; })[0] || null; }
    stages.forEach(function (s) { s.blocks.forEach(function (x) { x.vis = x.st === 'mastered' ? 'mastered' : x.st === 'progress' ? 'progress' : !s.open ? 'locked' : (mode === 'guided' || s === (here && here.stage) || s.started) ? 'available' : 'unexplored'; }); });
    return { b: b, cfg: cfg, mode: mode, states: states, stages: stages, route: route, byKey: byKey, here: here, next: next };
  }

  // ---------------------------------------------------------------- layout (regions template)
  function layoutRegions(G) {
    var seeds = G.states.map(function (st, i) { var o = ov('seed:' + st.id); return o ? [o.x, o.y] : (SLOTS[i] || [100 + (i * 137) % 800, 120 + (i * 89) % 380]).slice(); });
    var polys = cells(seeds);
    var prev = null;
    G.states.forEach(function (st, i) {
      st.seed = seeds[i]; st.poly = polys[i]; st.c = st.poly.length > 2 ? centroid(st.poly) : seeds[i];
      // candidate spots inside the region, away from its border
      var xs = st.poly.map(function (p) { return p[0]; }), ys = st.poly.map(function (p) { return p[1]; });
      var x0 = Math.min.apply(0, xs), x1 = Math.max.apply(0, xs), y0 = Math.min.apply(0, ys), y1 = Math.max.apply(0, ys), cand = [];
      for (var x = x0 + 6; x < x1; x += 12) for (var y = y0 + 6; y < y1; y += 12) { var pt = [x, y]; if (inside(pt, st.poly) && edgeDist(pt, st.poly) > 22) cand.push(pt); }
      if (!cand.length) cand.push(st.c);
      var n = st.stages.length, pick = [];
      if (n) {
        pick.push(cand.reduce(function (a, p) { return Math.hypot(p[0] - st.c[0], p[1] - st.c[1]) < Math.hypot(a[0] - st.c[0], a[1] - st.c[1]) ? p : a; }, cand[0]));
        while (pick.length < n) { var best = null, bd = -1; cand.forEach(function (p) { var d = Math.min.apply(0, pick.map(function (q) { return Math.hypot(p[0] - q[0], p[1] - q[1]); })); if (d > bd) { bd = d; best = p; } }); pick.push(best); }
        // walk them as a path: from the spot nearest the previous region's last stage
        var start = prev ? pick.reduce(function (a, p) { return Math.hypot(p[0] - prev[0], p[1] - prev[1]) < Math.hypot(a[0] - prev[0], a[1] - prev[1]) ? p : a; }, pick[0]) : pick.reduce(function (a, p) { return p[0] < a[0] ? p : a; }, pick[0]);
        var path = [start], rest = pick.filter(function (p) { return p !== start; });
        while (rest.length) { var last = path[path.length - 1], j = 0, d0 = Infinity; rest.forEach(function (p, k) { var d = Math.hypot(p[0] - last[0], p[1] - last[1]); if (d < d0) { d0 = d; j = k; } }); path.push(rest.splice(j, 1)[0]); }
        untangle(path);
        var byRoute = st.stages.slice().sort(function (a, b) { return a.n - b.n; });
        byRoute.forEach(function (sg, k) { var o = ov('stage:' + sg.id); sg.x = o ? o.x : path[k][0]; sg.y = o ? o.y : path[k][1]; });
        prev = path[path.length - 1];
      }
      st.cand = cand;
      st.stages.forEach(function (sg) {
        sg.blocks.forEach(function (bl, k) {
          var o = ov('block:' + bl.id), cols = Math.min(4, Math.max(2, Math.ceil(Math.sqrt(sg.blocks.length))));
          bl.x = o ? o.x : sg.x + ((k % cols) - (cols - 1) / 2) * 13; bl.y = o ? o.y : sg.y + 26 + Math.floor(k / cols) * 12;
        });
      });
    });
  }

  // ---------------------------------------------------------------- drawing
  var BG = {
    sea: ['#0e3a5c', '#0a2a45', 'rgba(255,255,255,.05)'],
    parchment: ['#e9dcbf', '#d8c69e', 'rgba(120,90,40,.08)'],
    night: ['#0b1020', '#05070f', 'rgba(255,255,255,.04)']
  };
  function cube(x, y, s, h, top, left, right, extra) {
    var p = P(x, y), cx = p[0], cy = p[1];
    return '<g' + (extra || '') + '><path d="M' + (cx - s) + ' ' + cy + 'L' + cx + ' ' + (cy + s * .5) + 'L' + cx + ' ' + (cy + s * .5 + h) + 'L' + (cx - s) + ' ' + (cy + h) + 'Z" fill="' + left + '"/>' +
      '<path d="M' + cx + ' ' + (cy + s * .5) + 'L' + (cx + s) + ' ' + cy + 'L' + (cx + s) + ' ' + (cy + h) + 'L' + cx + ' ' + (cy + s * .5 + h) + 'Z" fill="' + right + '"/>' +
      '<path d="M' + cx + ' ' + (cy - s * .5) + 'L' + (cx + s) + ' ' + cy + 'L' + cx + ' ' + (cy + s * .5) + 'L' + (cx - s) + ' ' + cy + 'Z" fill="' + top + '"/></g>';
  }
  var BLOCK = {
    mastered: ['#ffe066', '#e6b800', '#c99a00'], progress: null, available: ['#e8edf5', '#aeb7c6', '#8d96a6'], unexplored: ['#566070', '#3d4553', '#323947'], locked: ['#3a414e', '#2b313c', '#242a33']
  };
  function drawRegions(G, style) {
    var bg = BG[style] || BG.sea, out = '';
    out += '<rect x="-3000" y="-3000" width="7000" height="7000" fill="' + bg[1] + '"/><ellipse cx="500" cy="230" rx="760" ry="520" fill="url(#lm-sea)"/>';
    for (var gx = -1000; gx < 2000; gx += 40) out += '<path d="M' + gx + ' -1000V1500" stroke="' + bg[2] + '"/>';
    // the land: one raised slab per region (sides first, then tops)
    var tops = '', sides = '', deco = '';
    G.states.forEach(function (st) {
      if (st.poly.length < 3) return;
      var pts = st.poly.map(function (p) { return P(p[0], p[1]); });
      sides += '<path d="' + pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0] + ' ' + (p[1] + DEPTH); }).join('') + 'Z" fill="' + shade(st.color, -.55) + '"/>';
      tops += '<path class="lm-reg" data-k="' + esc(st.k) + '" d="' + pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0] + ' ' + p[1]; }).join('') + 'Z" fill="' + shade(st.color, -.08) + '" stroke="' + shade(st.color, .55) + '" stroke-width="1.6" stroke-linejoin="round"/>';
      // hills and trees on free ground
      var R = rnd(hash(st.id)), free = st.cand.filter(function (p) {
        return st.stages.every(function (sg) { return Math.hypot(p[0] - sg.x, p[1] - sg.y) > 34 && sg.blocks.every(function (b) { return Math.hypot(p[0] - b.x, p[1] - b.y) > 16; }); });
      });
      for (var i = 0; i < Math.min(5, free.length); i++) {
        var f = free[Math.floor(R() * free.length)], q = P(f[0], f[1]);
        if (R() < .5) deco += '<path d="M' + (q[0] - 9) + ' ' + q[1] + 'Q' + q[0] + ' ' + (q[1] - 11) + ' ' + (q[0] + 9) + ' ' + q[1] + 'Z" fill="' + shade(st.color, -.3) + '" opacity=".75"/>';
        else deco += '<path d="M' + q[0] + ' ' + (q[1] - 10) + 'L' + (q[0] + 4) + ' ' + q[1] + 'L' + (q[0] - 4) + ' ' + q[1] + 'Z" fill="' + shade(st.color, -.45) + '" opacity=".8"/><rect x="' + (q[0] - .8) + '" y="' + q[1] + '" width="1.6" height="2.4" fill="#5a4030"/>';
      }
    });
    out += sides + tops + deco;
    // the road: stage to stage in route order
    var road = G.route.filter(function (s) { return s.x != null; }).map(function (s) { return P(s.x, s.y); });
    if (road.length > 1) {
      var d = road.map(function (p, i) { return (i ? 'L' : 'M') + p[0] + ' ' + p[1]; }).join('');
      out += '<path d="' + d + '" fill="none" stroke="rgba(0,0,0,.35)" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" transform="translate(0 2)"/>';
      out += '<path d="' + d + '" fill="none" stroke="#f3e6c4" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round"/>';
      out += '<path d="' + d + '" fill="none" stroke="#b69b62" stroke-width="1" stroke-dasharray="3 4" stroke-linecap="round"/>';
    }
    // things on the map, back to front
    var items = [];
    G.stages.forEach(function (sg) {
      if (sg.x == null) return;
      sg.blocks.forEach(function (b) { items.push({ y: b.y, h: blockSvg(b, G) }); });
      items.push({ y: sg.y + .5, h: stageSvg(sg, G) });
    });
    items.sort(function (a, b) { return a.y - b.y; });
    out += items.map(function (x) { return x.h; }).join('');
    // labels
    G.states.forEach(function (st) {
      if (st.poly.length < 3) return;
      var p = P(st.c[0], st.c[1] - 28);
      out += '<g class="lm-sl" data-k="' + esc(st.k) + '"><text x="' + p[0] + '" y="' + p[1] + '" class="lm-t0">' + (st.icon ? esc(st.icon) + ' ' : '') + esc(st.title) + '</text></g>';
    });
    G.stages.forEach(function (sg) { if (sg.x == null) return; var p = P(sg.x, sg.y); out += '<text x="' + p[0] + '" y="' + (p[1] - 20) + '" class="lm-t1">' + sg.n + '. ' + esc(sg.title) + '</text>'; });
    G.stages.forEach(function (sg) { sg.blocks.forEach(function (b) { var p = P(b.x, b.y); out += '<text x="' + p[0] + '" y="' + (p[1] + 9.5) + '" class="lm-t2">' + esc(trunc(b.title, 14)) + '</text>'; }); });
    out += hereSvg(G);
    return out;
  }
  function trunc(s, n) { s = String(s || ''); return s.length > n ? s.slice(0, n - 1) + '…' : s; }
  function blockSvg(b, G) {
    var c = b.vis === 'progress' ? [shade(b.stage.state.color, .55), shade(b.stage.state.color, .1), shade(b.stage.state.color, -.15)] : BLOCK[b.vis];
    var glow = b.vis === 'mastered' ? (function () { var p = P(b.x, b.y); return '<ellipse cx="' + p[0] + '" cy="' + (p[1] + 2) + '" rx="9" ry="5" fill="#ffd60a" opacity=".35"/>'; })() : '';
    return '<g class="lm-b v-' + b.vis + '" data-k="' + esc(b.k) + '">' + glow + cube(b.x, b.y, 4.6, 4, c[0], c[1], c[2]) + '</g>';
  }
  function stageSvg(sg, G) {
    var col = sg.state.color, p = P(sg.x, sg.y), lock = !sg.open, cx = p[0], cy = p[1];
    var top = lock ? shade(col, -.38) : shade(col, .42), side = lock ? shade(col, -.62) : shade(col, -.35), rim = sg.done ? '#ffd60a' : lock ? shade(col, -.1) : shade(col, .8);
    var icon = (G.cfg.icons || {})[sg.id] || sg.state.icon || '🏁', R = 15, r = 6.5, T = 5;
    return '<g class="lm-s' + (lock ? ' lock' : '') + '" data-k="' + esc(sg.k) + '">' +
      '<ellipse cx="' + cx + '" cy="' + (cy + T + 3) + '" rx="' + (R + 1) + '" ry="' + (r + 1) + '" fill="rgba(0,0,0,.3)"/>' +
      '<path d="M' + (cx - R) + ' ' + cy + 'A' + R + ' ' + r + ' 0 0 0 ' + (cx + R) + ' ' + cy + 'V' + (cy + T) + 'A' + R + ' ' + r + ' 0 0 1 ' + (cx - R) + ' ' + (cy + T) + 'Z" fill="' + side + '"/>' +
      '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + R + '" ry="' + r + '" fill="' + top + '" stroke="' + rim + '" stroke-width="1.6"/>' +
      '<ellipse cx="' + (cx - 4) + '" cy="' + (cy - 2) + '" rx="6" ry="2" fill="rgba(255,255,255,.35)"/>' +
      '<text x="' + cx + '" y="' + (cy - 1.5) + '" class="lm-ic"' + (lock ? ' opacity=".45"' : '') + '>' + esc(icon) + '</text>' +
      '<g transform="translate(' + (cx + 12) + ' ' + (cy - 11) + ')"><circle r="4.6" fill="' + (sg.done ? '#ffd60a' : lock ? '#4a505b' : '#1d2433') + '" stroke="#fff" stroke-width=".8"/><text y="1.7" class="lm-n" fill="' + (sg.done ? '#3b2a00' : '#fff') + '">' + (lock ? '🔒' : sg.done ? '★' : sg.n) + '</text></g></g>';
  }
  function hereSvg(G) {
    if (!G.here) return '';
    var b = G.here, p = P(b.x, b.y), out = '<g class="lm-here" pointer-events="none"><circle cx="' + p[0] + '" cy="' + (p[1] + 1) + '" r="9" fill="none" stroke="#ff375f" stroke-width="1.4"><animate attributeName="r" values="6;12;6" dur="1.8s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;.2;1" dur="1.8s" repeatCount="indefinite"/></circle>' +
      '<path d="M' + p[0] + ' ' + (p[1] - 4) + 'c-5-7-8-10-8-14a8 8 0 0 1 16 0c0 4-3 7-8 14z" fill="#ff375f" stroke="#fff" stroke-width="1"/><circle cx="' + p[0] + '" cy="' + (p[1] - 18) + '" r="3" fill="#fff"/></g>';
    if (G.next) { var q = P(G.next.x, G.next.y); out += '<g pointer-events="none"><circle cx="' + q[0] + '" cy="' + (q[1] + 1) + '" r="7" fill="none" stroke="#64d2ff" stroke-width="1.2" stroke-dasharray="2 2"/></g>'; }
    return out;
  }

  // ---------------------------------------------------------------- route template
  function graphRoute(b) {
    var G = graph(b), cfg = G.cfg, places = cfg.places || {}, js = cfg.journeys || [];
    G.places = Object.keys(places).map(function (id) { var p = places[id], o = ov('place:' + b.id + ':' + id); return { k: 'P:' + id, kind: 'place', id: id, title: p.title, x: o ? o.x : p.x, y: o ? o.y : p.y, noPos: p.noPos, stops: [] }; });
    var byP = {}; G.places.forEach(function (p) { byP[p.id] = p; G.byKey[p.k] = p; });
    G.journeys = js.map(function (j) {
      var col = (b.columns || []).filter(function (c) { return c.id === j.listId; })[0];
      var cards = {}; (col ? col.cards : []).forEach(function (c) { cards[c.id] = c; });
      var stops = j.stops.map(function (s, i) { var c = cards[s.cardId], p = byP[s.place]; if (!c || !p) return null; var st = { n: i + 1, card: c, col: col, place: p, j: j, st: status(c, col) }; p.stops.push(st); return st; }).filter(Boolean);
      return { id: j.listId, title: j.title, color: (col && col.color) || j.color, stops: stops, on: S.jfilter && S.jfilter[b.id] ? S.jfilter[b.id] === j.listId : true };
    });
    // you are here: the first stop not mastered, journey by journey
    G.here = null;
    G.journeys.some(function (j) { return j.stops.some(function (s) { if (s.st !== 'mastered') { G.here = s; return true; } return false; }); });
    return G;
  }
  function drawRoute(G, style) {
    var bg = BG[style] || BG.parchment, out = '<rect x="-3000" y="-3000" width="7000" height="7000" fill="' + bg[1] + '"/><ellipse cx="500" cy="230" rx="760" ry="520" fill="url(#lm-sea)"/>';
    for (var gx = 0; gx <= 1000; gx += 50) out += '<path d="M' + gx + ' ' + TOP + 'V' + (620 * TILT + TOP) + '" stroke="' + bg[2] + '"/>';
    for (var gy = 0; gy <= 620; gy += 50) { var yy = gy * TILT + TOP; out += '<path d="M0 ' + yy + 'H1000" stroke="' + bg[2] + '"/>'; }
    // the legs: one colour per journey, an arrow in the middle of each leg
    G.journeys.forEach(function (j, ji) {
      if (!j.on) return;
      var off = (ji - (G.journeys.length - 1) / 2) * 3;
      for (var i = 1; i < j.stops.length; i++) {
        var a = P(j.stops[i - 1].place.x, j.stops[i - 1].place.y), b = P(j.stops[i].place.x, j.stops[i].place.y);
        if (a[0] === b[0] && a[1] === b[1]) continue;
        var dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L * off, ny = dx / L * off;
        var mx = (a[0] + b[0]) / 2 + nx - dy / L * 10, my = (a[1] + b[1]) / 2 + ny + dx / L * 10;
        out += '<path d="M' + (a[0] + nx) + ' ' + (a[1] + ny) + 'Q' + mx + ' ' + my + ' ' + (b[0] + nx) + ' ' + (b[1] + ny) + '" fill="none" stroke="' + j.color + '" stroke-width="2.2" stroke-linecap="round" opacity=".9"/>';
        var hx = (a[0] + nx + 2 * mx + b[0] + nx) / 4, hy = (a[1] + ny + 2 * my + b[1] + ny) / 4, ang = Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI;
        out += '<path d="M-3.5 -2.6L3 0L-3.5 2.6Z" fill="' + j.color + '" transform="translate(' + hx + ' ' + hy + ') rotate(' + ang + ')"/>';
      }
    });
    // the places
    G.places.forEach(function (p) {
      var q = P(p.x, p.y), vis = p.stops.filter(function (s) { return s.j && G.journeys.some(function (j) { return j.on && j.id === s.j.listId; }); });
      var done = vis.length && vis.every(function (s) { return s.st === 'mastered'; }), prog = vis.some(function (s) { return s.st !== 'new'; });
      out += '<g class="lm-p" data-k="' + esc(p.k) + '"><circle cx="' + q[0] + '" cy="' + q[1] + '" r="5.2" fill="' + (done ? '#ffd60a' : prog ? '#fff' : '#d9cfb8') + '" stroke="#3a2c14" stroke-width="1.3"/>' +
        (p.noPos ? '<text x="' + q[0] + '" y="' + (q[1] - 9) + '" class="lm-t1" fill="#ff6b6b">?</text>' : '') +
        '<text x="' + (q[0] + 7) + '" y="' + (q[1] + 3) + '" class="lm-pl">' + esc(p.title) + '</text>' +
        (vis.length ? '<text x="' + (q[0] + 7) + '" y="' + (q[1] + 3) + '" dy="1.2em" class="lm-pn">' + vis.map(function (s) { return s.n; }).join(', ') + '</text>' : '') + '</g>';
    });
    if (G.here) { var h = G.here.place, hp = P(h.x, h.y); out += '<g pointer-events="none"><path d="M' + hp[0] + ' ' + (hp[1] - 6) + 'c-5-7-8-10-8-14a8 8 0 0 1 16 0c0 4-3 7-8 14z" fill="#ff375f" stroke="#fff" stroke-width="1"/><circle cx="' + hp[0] + '" cy="' + (hp[1] - 20) + '" r="3" fill="#fff"/></g>'; }
    return out;
  }

  // ================================================================== UI
  var ui = { open: false }, G = null, cam = { x: 500, y: 230, s: 1 }, focus = null, edit = false, sel = null;
  var I = function (d) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + d + '</svg>'; };
  var ICON = {
    lm: I('<path d="M3 7l6-3 6 3 6-3v13l-6 3-6-3-6 3z"/><path d="M9 4v13M15 7v13"/>'), home: I('<path d="m3 11 9-7 9 7"/><path d="M5 10v10h14V10"/>'), back: I('<path d="m15 6-6 6 6 6"/>'),
    here: I('<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/><circle cx="12" cy="12" r="8"/>'), fit: I('<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>'), edit: I('<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13 7 4 4"/>')
  };
  var CSS = [
    '.lm{position:fixed;inset:0;z-index:2147482000;overflow:hidden;color:#fff;font:15px/1.25 -apple-system,BlinkMacSystemFont,"SF Pro Text",system-ui,sans-serif;-webkit-font-smoothing:antialiased;background:#0a2a45;touch-action:none;-webkit-user-select:none;user-select:none}',
    '.lm.away{visibility:hidden}',
    '.lm-stage{position:absolute;inset:0;overflow:hidden}',
    '.lm-world{position:absolute;left:0;top:0;transform-origin:0 0;will-change:transform}',
    '.lm-world svg{overflow:visible;display:block}',
    '.lm text{font-family:-apple-system,system-ui,sans-serif;text-anchor:middle;paint-order:stroke;stroke-linejoin:round;pointer-events:none}',
    '.lm-t0{font-size:24px;font-weight:800;fill:#fff;stroke:rgba(0,0,0,.55);stroke-width:3px;letter-spacing:.2px}',
    '.lm-t1{font-size:6.2px;font-weight:700;fill:#fff;stroke:rgba(0,0,0,.6);stroke-width:1.6px;opacity:0;transition:opacity .25s}',
    '.lm-t2{font-size:3.2px;font-weight:600;fill:#fff;stroke:rgba(0,0,0,.65);stroke-width:.9px;opacity:0;transition:opacity .25s}',
    '.lm-n{font-size:5px;font-weight:800;stroke:none}',
    '.lm-ic{font-size:13px;stroke:none;dominant-baseline:auto}',
    // STAGE 3 · IN COLONIAL AMERICA — the arcade stage banner
    '.lm-banner{position:absolute;left:0;right:0;top:calc(env(safe-area-inset-top,0px) + 62px);text-align:center;pointer-events:none;font-family:"Press Start 2P",ui-monospace,monospace;line-height:1.5;z-index:2}',
    '.lm-banner b,.lm-banner span{display:block;font-weight:400;letter-spacing:1px;-webkit-text-stroke:1px #10233a;paint-order:stroke;text-shadow:3px 3px 0 #10233a}',
    '.lm-banner b{font-size:22px;color:#b8f37a;background:linear-gradient(180deg,#eaffc8,#7ed957 55%,#3fa34d);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;filter:drop-shadow(3px 3px 0 #10233a)}',
    '.lm-banner span{font-size:12px;color:#fff;margin-top:6px;padding:0 16px;-webkit-text-fill-color:#fff}',
    '.lm-banner.go{animation:lmBan .55s steps(6) both}',
    '@keyframes lmBan{from{opacity:0;transform:translateX(60px)}to{opacity:1;transform:none}}',
    // route labels keep one size on screen at any zoom (the map is wide and short on a phone)
    '.lm-pl{font-size:calc(11.5px / var(--z,1));font-weight:700;fill:#3a2c14;stroke:#f4ead2;stroke-width:calc(3px / var(--z,1));text-anchor:start}',
    '.lm-pn{font-size:calc(9px / var(--z,1));font-weight:700;fill:#6b4f1d;stroke:#f4ead2;stroke-width:calc(2.4px / var(--z,1));text-anchor:start}',
    '.lod1 .lm-t1,.lod2 .lm-t1,.lod2 .lm-t2{opacity:1}',
    '.lod1 .lm-t0{opacity:.28}',
    '.lod2 .lm-t0{opacity:.12}',
    '.lm-t0{transition:opacity .3s}',
    '.lm-reg,.lm-s,.lm-b,.lm-p,.lm-sl{cursor:pointer}',
    '.lm.edit .lm-s,.lm.edit .lm-b,.lm.edit .lm-sl,.lm.edit .lm-p{cursor:move}',
    '.lm.edit .lm-sl text{fill:#ffd60a}',
    '.lm-b.v-unexplored,.lm-b.v-locked{opacity:.75}',
    '.lm-sel{outline:none}',
    // bars and sheets
    '.lm-top{position:absolute;left:0;right:0;top:0;display:flex;align-items:center;gap:8px;padding:calc(env(safe-area-inset-top,0px) + 12px) 12px 10px;pointer-events:none}',
    '.lm-top > *{pointer-events:auto}',
    '.lm-b2{flex:none;height:38px;min-width:38px;padding:0 11px;border-radius:999px;display:inline-flex;align-items:center;justify-content:center;gap:6px;border:1px solid rgba(255,255,255,.16);color:#fff;cursor:pointer;font:600 13px -apple-system,system-ui,sans-serif;' +
      'background:linear-gradient(180deg,rgba(66,76,92,.82),rgba(30,36,48,.9));box-shadow:inset 0 1px 0 rgba(255,255,255,.2),0 8px 20px rgba(0,0,0,.3)}',
    '.lm-b2 svg{width:18px;height:18px}',
    '.lm-b2.on{background:linear-gradient(180deg,rgba(10,132,255,.85),rgba(10,100,220,.85))}',
    '.lm-path{flex:1;min-width:0;display:flex;gap:4px;align-items:center;overflow-x:auto;scrollbar-width:none;white-space:nowrap;padding:0 6px;height:38px;border-radius:999px;background:rgba(14,20,32,.72)}',
    '.lm-path::-webkit-scrollbar{display:none}',
    '.lm-path button{border:0;background:none;color:rgba(255,255,255,.65);font:600 13px -apple-system,system-ui,sans-serif;padding:6px 5px;cursor:pointer;max-width:150px;overflow:hidden;text-overflow:ellipsis}',
    '.lm-path button:last-child{color:#fff}',
    '.lm-path i{opacity:.35;font-style:normal}',
    '.lm-side{position:absolute;right:12px;bottom:calc(env(safe-area-inset-bottom,0px) + 14px);display:flex;flex-direction:column;gap:8px}',
    '.lm-legend{position:absolute;left:12px;right:64px;width:max-content;max-width:calc(100% - 76px);flex-wrap:wrap;row-gap:4px;border-radius:16px!important;bottom:calc(env(safe-area-inset-bottom,0px) + 14px);display:flex;gap:10px;align-items:center;padding:7px 12px;border-radius:999px;background:rgba(14,20,32,.72);font-size:11.5px;font-weight:600}',
    '.lm-legend i{display:inline-block;width:9px;height:9px;border-radius:2px;margin-right:4px;vertical-align:-1px}',
    '.lm-sheet{position:absolute;left:10px;right:10px;bottom:calc(env(safe-area-inset-bottom,0px) + 10px);max-height:46%;overflow:auto;padding:14px 14px 10px;border-radius:24px;z-index:3;' +
      'background:linear-gradient(180deg,rgba(60,70,88,.96),rgba(26,32,44,.98));border:1px solid rgba(255,255,255,.14);box-shadow:inset 0 1px 0 rgba(255,255,255,.2),0 20px 50px rgba(0,0,0,.5)}',
    '.lm-sheet h4{margin:0;font-size:18px;font-weight:750;display:flex;align-items:center;gap:8px}',
    '.lm-sheet .sub{font-size:12.5px;opacity:.6;margin:3px 0 10px}',
    '.lm-row{display:flex;align-items:center;gap:10px;min-height:44px;border-top:1px solid rgba(255,255,255,.07);cursor:pointer}',
    '.lm-row .d{width:11px;height:11px;border-radius:3px;flex:none}',
    '.lm-row span{flex:1;min-width:0;font-size:15px}',
    '.lm-row em{font-style:normal;font-size:12px;opacity:.55}',
    '.lm-acts{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}',
    '.lm-acts button{height:34px;padding:0 12px;border-radius:999px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.08);color:#fff;font:600 13px -apple-system,system-ui,sans-serif;cursor:pointer}',
    '.lm-acts button.on{background:#0a84ff;border-color:#0a84ff}',
    '.lm-sw{width:26px;height:26px;border-radius:50%;border:2px solid rgba(255,255,255,.4);cursor:pointer;padding:0}',
    '.lm-x{position:absolute;top:10px;right:10px;width:30px;height:30px;border-radius:50%;border:0;background:rgba(255,255,255,.1);color:#fff;cursor:pointer}',
    '.lm-note{position:absolute;left:50%;top:calc(env(safe-area-inset-top,0px) + 60px);transform:translateX(-50%);padding:6px 12px;border-radius:999px;background:rgba(14,20,32,.72);font-size:12px;opacity:.85;white-space:nowrap;max-width:calc(100vw - 30px);overflow:hidden;text-overflow:ellipsis}',
    'html.kn-open #minest-mini-pet-p0,html.kn-open .mpet-menu,html.kn-open .mpet-say,html.kn-open .mpet-tip{display:none!important}'
  ].join('\n');
  function ensureCss() { if (document.getElementById('lm-css')) return; var s = document.createElement('style'); s.id = 'lm-css'; s.textContent = CSS; document.head.appendChild(s); }

  function render() {
    var b = boardById(ui.bid); if (!b) return;
    var cfg = cfgOf(b.id), tpl = cfg.template === 'route' ? 'route' : 'regions';
    var style = (KN().get('lm:style:' + b.id)) || (tpl === 'route' ? 'parchment' : 'sea');
    G = tpl === 'route' ? graphRoute(b) : graph(b); G.tpl = tpl; G.style = style;
    if (tpl === 'regions') layoutRegions(G);
    var bg = BG[style] || BG.sea;
    var inner = tpl === 'route' ? drawRoute(G, style) : drawRegions(G, style);
    ui.world.innerHTML = '<svg width="1000" height="460" viewBox="0 0 1000 460"><defs><radialGradient id="lm-sea" cx="50%" cy="40%" r="75%"><stop offset="0" stop-color="' + bg[0] + '"/><stop offset="1" stop-color="' + bg[1] + '" stop-opacity="0"/></radialGradient></defs>' + inner + '</svg>';
    ui.el.style.background = bg[1];
    ui.note.textContent = cfg.note || ''; ui.note.style.display = cfg.note ? '' : 'none';
    ui.mode.textContent = G.mode === 'guided' ? 'Guided' : 'Free'; ui.mode.style.display = tpl === 'route' ? 'none' : '';
    ui.legend.innerHTML = tpl === 'route' ? G.journeys.map(function (j) { return '<span data-j="' + esc(j.id) + '" style="cursor:pointer;opacity:' + (j.on ? 1 : .4) + '"><i style="background:' + j.color + '"></i>' + esc(j.title) + '</span>'; }).join('') :
      '<span><i style="background:#ffe066"></i>Mastered</span><span><i style="background:#7fb3ff"></i>Learning</span><span><i style="background:#e8edf5"></i>Next</span><span><i style="background:#566070"></i>Unexplored</span>';
    crumbs(); lod();
  }
  function applyCam() { ui.world.style.transform = 'translate(' + (innerWidth / 2 - cam.x * cam.s) + 'px,' + (innerHeight / 2 - cam.y * cam.s) + 'px) scale(' + cam.s + ')'; ui.world.style.setProperty('--z', cam.s.toFixed(3)); lod(); }
  var homeS = 1;
  function lod() { if (!ui.world) return; var r = cam.s / (homeS || 1), svg = ui.world.firstChild; if (!svg) return; svg.classList.toggle('lod1', r > 1.7 && r <= 9); svg.classList.toggle('lod2', r > 9); }
  function saveCam() { S.cam[ui.bid] = { x: Math.round(cam.x), y: Math.round(cam.y), s: +cam.s.toFixed(3), f: focus }; stSave(); }
  function boxOf(pts) { var x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity; pts.forEach(function (p) { x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); }); return [x0, y0, x1, y1]; }
  function camFor(box, pad) {
    pad = pad || 30; var top = 64, bot = ui.sheet && ui.sheet.style.display !== 'none' ? Math.min(innerHeight * .46, 330) : 60;
    var w = Math.max(30, box[2] - box[0] + pad * 2), h = Math.max(30, box[3] - box[1] + pad * 2);
    var s = Math.max(.2, Math.min(6, Math.min((innerWidth - 16) / w, (innerHeight - top - bot) / h)));
    return { x: (box[0] + box[2]) / 2, y: (box[1] + box[3]) / 2 - (top - bot) / 2 / s, s: s };
  }
  var anim = 0;
  function fly(to, ms) {
    cancelAnimationFrame(anim); var from = { x: cam.x, y: cam.y, s: cam.s }, t0 = performance.now(); ms = ms == null ? 600 : ms;
    if (!ms) { cam = to; applyCam(); saveCam(); return; }
    (function step(now) { var p = Math.min(1, (now - t0) / ms), e = p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; cam.x = from.x + (to.x - from.x) * e; cam.y = from.y + (to.y - from.y) * e; cam.s = Math.exp(Math.log(from.s) + (Math.log(to.s) - Math.log(from.s)) * e); applyCam(); if (p < 1) anim = requestAnimationFrame(step); else saveCam(); })(t0);
  }
  function allBox() {
    if (G.tpl === 'route') { var bx = boxOf(G.places.map(function (p) { return P(p.x, p.y); })); return [bx[0] - 10, bx[1] - 26, bx[2] + 70, bx[3] + 16]; }
    return boxOf(US.map(function (p) { return P(p[0], p[1]); }));
  }
  function banner(a, b) { if (!ui.banner) return; ui.banner.innerHTML = a ? '<b>' + esc(a) + '</b><span>' + esc(b) + '</span>' : ''; ui.banner.classList.remove('go'); void ui.banner.offsetWidth; if (a) ui.banner.classList.add('go'); }
  function home(ms) { focus = null; closeSheet(); banner(''); var c = camFor(allBox(), 10); homeS = c.s; fly(c, ms); crumbs(); }
  function focusOn(k, ms) {
    var n = G.byKey[k]; if (!n) return;
    focus = k;
    if (n.kind === 'state') { closeSheet(); banner(''); fly(camFor(boxOf(n.poly.map(function (p) { return P(p[0], p[1]); })), 14), ms); }
    else if (n.kind === 'stage') {
      banner('STAGE ' + n.n, 'IN ' + n.title.toUpperCase()); stageSheet(n);
      // the stage with some of its surroundings (and room for the banner above it)
      var pts = [P(n.x - 70, n.y - 40), P(n.x + 70, n.y + 50)].concat(n.blocks.map(function (b) { return P(b.x, b.y + 8); }));
      fly(camFor(boxOf(pts), 10), ms);
    }
    else if (n.kind === 'place') { placeSheet(n); var q = P(n.x, n.y); fly(camFor([q[0] - 40, q[1] - 30, q[0] + 70, q[1] + 30], 10), ms); }
    crumbs();
  }
  function crumbs() {
    var chain = [{ k: '', t: (boardById(ui.bid) || {}).title || 'Map' }], n = focus && G && G.byKey[focus];
    if (n && n.kind === 'stage') chain.push({ k: n.state.k, t: (n.state.icon ? n.state.icon + ' ' : '') + n.state.title }, { k: n.k, t: n.title });
    else if (n && n.kind === 'state') chain.push({ k: n.k, t: (n.icon ? n.icon + ' ' : '') + n.title });
    else if (n && n.kind === 'place') chain.push({ k: n.k, t: n.title });
    ui.path.innerHTML = chain.map(function (c, i) { return (i ? '<i>›</i>' : '') + '<button type="button" data-crumb="' + esc(c.k) + '">' + esc(c.t) + '</button>'; }).join('');
    ui.path.scrollLeft = ui.path.scrollWidth;
  }

  // ---------------------------------------------------------------- sheets
  function closeSheet() { if (ui.sheet) ui.sheet.style.display = 'none'; sel = null; }
  var COLOR = { mastered: '#ffe066', progress: '#7fb3ff', available: '#e8edf5', unexplored: '#566070', locked: '#3a414e' };
  var WORD = { mastered: 'Mastered', progress: 'Learning', available: 'Next up', unexplored: 'Not started', locked: 'Locked' };
  function stageSheet(sg) {
    sel = sg.k;
    var m = sg.blocks.filter(function (b) { return b.st === 'mastered'; }).length;
    var h = '<button type="button" class="lm-x" data-close>✕</button><h4>' + (sg.done ? '⭐' : sg.open ? '🏁' : '🔒') + ' ' + esc(sg.title) + '</h4><div class="sub">Stage ' + sg.n + ' · ' + esc(sg.state.title) + ' · ' + m + ' / ' + sg.blocks.length + ' mastered' + (!sg.open ? ' · finish the stages before it to unlock' : '') + '</div>' +
      sg.blocks.map(function (b) { return '<div class="lm-row" data-open="' + esc(b.k) + '"><i class="d" style="background:' + COLOR[b.vis] + '"></i><span>' + esc(b.title) + '</span><em>' + WORD[b.vis] + (G.here === b ? ' · ◎ here' : '') + '</em></div>'; }).join('') +
      (!sg.blocks.length ? '<div class="sub">No cards in this stage yet.</div>' : '');
    if (edit && !sg.virtual) h += '<div class="lm-acts"><button type="button" data-route="-1">◀ Earlier in route</button><button type="button" data-route="1">Later in route ▶</button></div>';
    showSheet(h);
  }
  function placeSheet(p) {
    sel = p.k;
    var h = '<button type="button" class="lm-x" data-close>✕</button><h4>📍 ' + esc(p.title) + '</h4><div class="sub">' + (p.noPos ? 'No coordinates in the JSON — shown at the bottom. ' : '') + p.stops.length + ' stop' + (p.stops.length === 1 ? '' : 's') + '</div>' +
      p.stops.map(function (s) { return '<div class="lm-row" data-stop="' + esc(s.card.id) + '" data-col="' + esc(s.col.id) + '"><i class="d" style="background:' + s.j.color + '"></i><span>' + esc(s.card.title) + '<br><em>' + esc(s.j.title) + (s.card.desc ? ' — ' + esc(trunc(s.card.desc, 90)) : '') + '</em></span><em>' + WORD[s.st === 'mastered' ? 'mastered' : s.st === 'progress' ? 'progress' : 'available'] + '</em></div>'; }).join('');
    showSheet(h);
  }
  function stateSheet(st) {
    sel = st.k;
    var cols = ['#f18c4f', '#5097f4', '#49b07a', '#eabf3b', '#a381f2', '#eb5e55', '#2bb3a6', '#e879b9', '#8d99ae'], icons = ['🏛', '⚖️', '🗺', '💰', '🗳', '🎭', '🔬', '📚', '🌎', '⭐', '🧭', '🏔'];
    var h = '<button type="button" class="lm-x" data-close>✕</button><h4>' + esc(st.icon) + ' ' + esc(st.title) + '</h4><div class="sub">Region · ' + st.stages.length + ' stages — drag its name on the map to move it</div>' +
      '<div class="lm-acts">' + cols.map(function (c) { return '<button type="button" class="lm-sw" data-color="' + c + '" style="background:' + c + '"></button>'; }).join('') + '</div>' +
      '<div class="lm-acts">' + icons.map(function (c) { return '<button type="button" data-icon="' + c + '">' + c + '</button>'; }).join('') + '<button type="button" data-icon="">No icon</button></div>' +
      '<div class="lm-acts"><button type="button" data-rename>Rename…</button></div>';
    showSheet(h);
  }
  function editSheet() {
    var b = boardById(ui.bid), tpl = G.tpl;
    var h = '<button type="button" class="lm-x" data-close>✕</button><h4>✎ Arrange the map</h4><div class="sub">' + (tpl === 'route' ? 'Drag places. ' : 'Drag region names, stages and blocks. Tap a region for its colour and icon. ') + 'Your changes are kept apart from the knowledge.</div>' +
      '<div class="lm-acts">' + ['sea', 'parchment', 'night'].map(function (s) { return '<button type="button" data-style="' + s + '"' + (G.style === s ? ' class="on"' : '') + '>' + s[0].toUpperCase() + s.slice(1) + '</button>'; }).join('') + '</div>' +
      '<div class="lm-acts"><button type="button" data-reset>↺ Reset to Template</button><button type="button" data-done>Done</button></div>';
    showSheet(h); sel = null;
  }
  function showSheet(h) { ui.sheet.innerHTML = h; ui.sheet.style.display = ''; }

  // ---------------------------------------------------------------- gestures
  function wire() {
    var st = ui.stage, pts = {}, g = null;
    function s2w(x, y) { return { x: (x - innerWidth / 2) / cam.s + cam.x, y: (y - innerHeight / 2) / cam.s + cam.y }; }
    st.addEventListener('pointerdown', function (e) {
      e.stopPropagation(); cancelAnimationFrame(anim);
      try { st.setPointerCapture(e.pointerId); } catch (x) {}
      pts[e.pointerId] = { x: e.clientX, y: e.clientY };
      var ids = Object.keys(pts);
      if (ids.length === 2) { var a = pts[ids[0]], b = pts[ids[1]]; g = { kind: 'pinch', d0: Math.hypot(a.x - b.x, a.y - b.y), s0: cam.s, c0: s2w((a.x + b.x) / 2, (a.y + b.y) / 2) }; return; }
      var t = e.target.closest && e.target.closest('[data-k]'), k = t ? t.getAttribute('data-k') : null;
      g = { kind: 'pan', x0: e.clientX, y0: e.clientY, cx: cam.x, cy: cam.y, moved: false, k: k };
      if (edit && k) { var n = G.byKey[k]; if (n && (n.kind === 'stage' || n.kind === 'block' || n.kind === 'place' || (n.kind === 'state' && t.classList.contains('lm-sl')))) g.kind = 'drag'; }
    });
    st.addEventListener('pointermove', function (e) {
      if (!pts[e.pointerId] || !g) return;
      pts[e.pointerId] = { x: e.clientX, y: e.clientY };
      if (g.kind === 'pinch') { var ids = Object.keys(pts); if (ids.length < 2) return; var a = pts[ids[0]], b = pts[ids[1]], d = Math.hypot(a.x - b.x, a.y - b.y), mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }; cam.s = Math.max(.2, Math.min(20, g.s0 * d / Math.max(1, g.d0))); cam.x = g.c0.x - (mid.x - innerWidth / 2) / cam.s; cam.y = g.c0.y - (mid.y - innerHeight / 2) / cam.s; applyCam(); return; }
      var dx = e.clientX - g.x0, dy = e.clientY - g.y0;
      if (!g.moved && Math.hypot(dx, dy) < 6) return;
      g.moved = true;
      if (g.kind === 'drag') { g.dx = dx / cam.s; g.dy = dy / cam.s / TILT; var el = st.querySelector('[data-k="' + cssEsc(g.k) + '"]'); if (el) el.setAttribute('transform', 'translate(' + (dx / cam.s) + ' ' + (dy / cam.s) + ')'); return; }
      cam.x = g.cx - dx / cam.s; cam.y = g.cy - dy / cam.s; applyCam();
    });
    function up(e) {
      if (!pts[e.pointerId]) return;
      delete pts[e.pointerId];
      if (!g) return;
      var was = g; if (!Object.keys(pts).length || was.kind === 'pinch') g = null;
      if (was.kind === 'pinch') { saveCam(); return; }
      if (was.kind === 'drag' && was.moved) { drop(was); return; }
      if (was.moved) { saveCam(); return; }
      if (e.type !== 'pointercancel') tap(was.k);
    }
    st.addEventListener('pointerup', up); st.addEventListener('pointercancel', up);
    st.addEventListener('wheel', function (e) { e.preventDefault(); e.stopPropagation(); cancelAnimationFrame(anim); var w0 = s2w(e.clientX, e.clientY); cam.s = Math.max(.2, Math.min(20, cam.s * Math.exp(-e.deltaY * (e.ctrlKey ? .01 : .0018)))); cam.x = w0.x - (e.clientX - innerWidth / 2) / cam.s; cam.y = w0.y - (e.clientY - innerHeight / 2) / cam.s; applyCam(); clearTimeout(ui.wt); ui.wt = setTimeout(saveCam, 300); }, { passive: false });
    ['touchstart', 'touchmove'].forEach(function (ev) { ui.el.addEventListener(ev, function (e) { e.stopPropagation(); }, { passive: true }); });
    [ui.el.querySelector('.lm-top'), ui.el.querySelector('.lm-side'), ui.sheet, ui.legend].forEach(function (x) { x.addEventListener('pointerdown', function (e) { e.stopPropagation(); }); });
    ui.el.addEventListener('click', onClick);
  }
  function cssEsc(s) { return window.CSS && CSS.escape ? CSS.escape(s) : String(s).replace(/"/g, '\\"'); }
  function drop(d) {
    var n = G.byKey[d.k]; if (!n) return render();
    if (n.kind === 'state') KN().set('lm:seed:' + n.id, { x: Math.round(n.seed[0] + d.dx), y: Math.round(n.seed[1] + d.dy) });
    else if (n.kind === 'stage') { var m = {}; m['lm:stage:' + n.id] = { x: Math.round(n.x + d.dx), y: Math.round(n.y + d.dy) }; n.blocks.forEach(function (b) { m['lm:block:' + b.id] = { x: Math.round(b.x + d.dx), y: Math.round(b.y + d.dy) }; }); KN().setMany(m); }
    else if (n.kind === 'block') KN().set('lm:block:' + n.id, { x: Math.round(n.x + d.dx), y: Math.round(n.y + d.dy) });
    else if (n.kind === 'place') KN().set('lm:place:' + ui.bid + ':' + n.id, { x: Math.round(n.x + d.dx), y: Math.round(n.y + d.dy) });
    render();
  }
  function tap(k) {
    if (!k) { if (!edit) closeSheet(); return; }
    var n = G.byKey[k]; if (!n) return;
    if (n.kind === 'block') { if (edit) return; return details(n.card, n.col); }
    if (n.kind === 'state') { if (edit) { stateSheet(n); return; } return focusOn(k); }
    focusOn(k);
  }
  function onClick(e) {
    var t = e.target;
    var c = t.closest('[data-crumb]'); if (c) { var ck = c.getAttribute('data-crumb'); return ck ? focusOn(ck) : home(); }
    var a = t.closest('[data-act]');
    if (a) {
      var act = a.getAttribute('data-act');
      if (act === 'x') return close();
      if (act === 'home') return home();
      if (act === 'back') { var n = focus && G.byKey[focus]; if (!n) return; return n.kind === 'stage' ? focusOn(n.state.k) : home(); }
      if (act === 'here') { var h = G.here; if (!h) return toast('Everything here is mastered ⭐'); if (G.tpl === 'route') return focusOn(h.place.k); return focusOn(h.stage.k); }
      if (act === 'fit') return focus ? focusOn(focus) : home();
      if (act === 'mode') { setCfg(ui.bid, { mode: G.mode === 'guided' ? 'free' : 'guided' }); render(); toast(G.mode === 'guided' ? 'Guided Path: stages open one after another' : 'Free Exploration: every stage is open'); return; }
      if (act === 'edit') { edit = !edit; a.classList.toggle('on', edit); ui.el.classList.toggle('edit', edit); if (edit) editSheet(); else closeSheet(); return; }
    }
    if (t.closest('[data-close]')) return closeSheet();
    if (t.closest('[data-done]')) { edit = false; ui.el.classList.remove('edit'); ui.el.querySelector('[data-act="edit"]').classList.remove('on'); return closeSheet(); }
    var j = t.closest('[data-j]'); if (j) { S.jfilter = S.jfilter || {}; var id = j.getAttribute('data-j'); S.jfilter[ui.bid] = S.jfilter[ui.bid] === id ? null : id; stSave(); render(); return; }
    var o = t.closest('[data-open]'); if (o) { var bn = G.byKey[o.getAttribute('data-open')]; if (bn) details(bn.card, bn.col); return; }
    var sp = t.closest('[data-stop]'); if (sp) { var col = (boardById(ui.bid).columns || []).filter(function (x) { return x.id === sp.getAttribute('data-col'); })[0]; var card = col && col.cards.filter(function (x) { return x.id === sp.getAttribute('data-stop'); })[0]; if (card) details(card, col); return; }
    var rt = t.closest('[data-route]'); if (rt && sel) { var sg = G.byKey[sel], ord = G.route.map(function (s) { return s.id; }), i = ord.indexOf(sg.id), jx = i + (+rt.getAttribute('data-route')); if (jx < 0 || jx >= ord.length) return; ord.splice(jx, 0, ord.splice(i, 1)[0]); setCfg(ui.bid, { order: ord }); render(); stageSheet(G.byKey[sel]); return; }
    var st = t.closest('[data-style]'); if (st) { KN().set('lm:style:' + ui.bid, st.getAttribute('data-style')); render(); editSheet(); return; }
    var col2 = t.closest('[data-color]'); if (col2 && sel) { var n2 = G.byKey[sel]; KN().set('lm:color:' + n2.id, col2.getAttribute('data-color')); render(); stateSheet(G.byKey[sel]); return; }
    var ic = t.closest('[data-icon]'); if (ic && sel) { var n3 = G.byKey[sel]; KN().set('lm:icon:' + n3.id, ic.getAttribute('data-icon') || ''); render(); stateSheet(G.byKey[sel]); return; }
    if (t.closest('[data-rename]') && sel) { var n4 = G.byKey[sel], nm = prompt('Region name (this renames the list)', n4.title); if (nm && nm.trim() && A().updateBoard) { A().updateBoard(ui.bid, function (b) { return Object.assign({}, b, { columns: b.columns.map(function (c) { return c.id === n4.id ? Object.assign({}, c, { title: nm.trim() }) : c; }) }); }); setTimeout(function () { render(); stateSheet(G.byKey[sel]); }, 120); } return; }
    if (t.closest('[data-reset]')) { if (!confirm('Reset this map to its template? Your moved regions, stages, blocks, colours and icons go back to the template (the knowledge stays).')) return; resetLayout(); return; }
  }
  function resetLayout() {
    var m = {}, bid = ui.bid;
    (KN().keys('lm:') || []).forEach(function (k) {
      if (k === 'lm:cfg:' + bid) return;
      var id = k.replace(/^lm:(seed|stage|block|color|icon):/, '');
      if (k.indexOf('lm:style:' + bid) === 0 || k.indexOf('lm:place:' + bid + ':') === 0 || G.byKey['S:' + id] || G.byKey['G:' + id] || G.byKey['B:' + id]) m[k] = null;
    });
    if (G.tpl === 'regions') { var c = cfgOf(bid); delete c.order; KN().set('lm:cfg:' + bid, c, true); }
    KN().setMany(m); render(); home();
  }

  // ---------------------------------------------------------------- details (the Kanban's sheet sits under this view)
  function details(card, col) {
    if (!A().openCardIn) return;
    saveCam(); ui.el.classList.add('away');
    A().openCardIn(ui.bid, col.id, card.id);
    var t0 = Date.now(), seen = false, gone = 0;
    var modal = function () { return document.querySelector('.mn-dm, .mn-cardsheet, .fixed.inset-0.z-50 .rounded-3xl'); };
    var iv = setInterval(function () {
      if (modal()) { seen = true; gone = 0; return; }
      if (seen) gone++;
      if ((seen && gone >= 2) || (!seen && Date.now() - t0 > 2500)) { clearInterval(iv); if (!ui.el) return; ui.el.classList.remove('away'); var f = focus; render(); if (f && G.byKey[f]) { focus = f; var n = G.byKey[f]; if (n.kind === 'stage') stageSheet(n); else if (n.kind === 'place') placeSheet(n); } applyCam(); }
    }, 250);
  }

  // ---------------------------------------------------------------- open / close
  // a board added a moment ago reaches MinestAI.boards() on the next render: wait for it (up to 2 s)
  function open(boardId, tries) {
    if (ui.open) return;
    if (boardId && !boardById(boardId) && (tries || 0) < 40) return setTimeout(function () { open(boardId, (tries || 0) + 1); }, 50);
    ensureCss();
    var a = A().board && A().board();
    ui.bid = boardId || (a && a.id) || (boards()[0] || {}).id;
    if (!ui.bid) return toast('No board yet.');
    var el = document.createElement('div'); el.className = 'lm'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Learning Map');
    el.innerHTML = '<div class="lm-stage"><div class="lm-world"></div></div>' +
      '<div class="lm-top"><button type="button" class="lm-b2" data-act="back" aria-label="Back">' + ICON.back + '</button><div class="lm-path"></div>' +
      '<button type="button" class="lm-b2" data-act="mode" title="Guided Path / Free Exploration">Guided</button>' +
      '<button type="button" class="lm-b2" data-act="edit" aria-label="Arrange">' + ICON.edit + '</button>' +
      '<button type="button" class="lm-b2" data-act="x" aria-label="Close"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div>' +
      '<div class="lm-note" style="display:none"></div>' +
      '<div class="lm-side"><button type="button" class="lm-b2" data-act="here" aria-label="You are here">' + ICON.here + '</button><button type="button" class="lm-b2" data-act="fit" aria-label="Fit">' + ICON.fit + '</button><button type="button" class="lm-b2" data-act="home" aria-label="Whole map">' + ICON.home + '</button></div>' +
      '<div class="lm-legend"></div><div class="lm-banner"></div><div class="lm-sheet" style="display:none"></div>';
    if (!document.getElementById('lm-font')) { var lf = document.createElement('link'); lf.id = 'lm-font'; lf.rel = 'stylesheet'; lf.href = 'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap'; document.head.appendChild(lf); }
    ui.el = el; ui.banner = el.querySelector('.lm-banner'); ui.stage = el.querySelector('.lm-stage'); ui.world = el.querySelector('.lm-world'); ui.path = el.querySelector('.lm-path'); ui.mode = el.querySelector('[data-act="mode"]'); ui.sheet = el.querySelector('.lm-sheet'); ui.legend = el.querySelector('.lm-legend'); ui.note = el.querySelector('.lm-note');
    ui.open = true; edit = false; focus = null;
    document.body.appendChild(el); document.documentElement.classList.add('kn-open');
    render(); wire();
    var hc = camFor(allBox(), 10); homeS = hc.s;
    var c = S.cam[ui.bid];
    if (c) { cam = { x: c.x, y: c.y, s: c.s }; applyCam(); if (c.f && G.byKey[c.f]) { focus = c.f; var n = G.byKey[c.f]; if (n.kind === 'stage') stageSheet(n); else if (n.kind === 'place') placeSheet(n); crumbs(); } }
    else { cam = { x: hc.x, y: hc.y, s: hc.s * .8 }; applyCam(); home(650); }
    if (el.animate) el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 260 });
    window.addEventListener('resize', applyCam);
  }
  function close() {
    if (!ui.open) return;
    saveCam(); cancelAnimationFrame(anim);
    var el = ui.el; ui.open = false; ui.el = null; document.documentElement.classList.remove('kn-open'); window.removeEventListener('resize', applyCam);
    if (el.animate) { var an = el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 180, fill: 'forwards' }); an.onfinish = function () { el.remove(); }; } else el.remove();
  }
  if (KN() && KN().onChange) KN().onChange(function () { if (ui.open && !ui.el.classList.contains('away')) { var s = sel; render(); if (s && G.byKey[s] && ui.sheet.style.display !== 'none') { var n = G.byKey[s]; if (n.kind === 'stage') stageSheet(n); else if (n.kind === 'state' && edit) stateSheet(n); else if (n.kind === 'place') placeSheet(n); } } });

  window.MinestLearnMap = { open: open, close: close, toggle: function () { if (ui.open) close(); else open(); }, isOpen: function () { return ui.open; }, icon: ICON.lm,
    _graph: function () { return G; }, _focus: function (k) { focusOn(k, 0); }, _tap: tap, _cam: function () { return cam; }, _home: function () { home(0); } };
})();
