/* Minest Knowledge · Phase 3 — Knowledge Map (a spatial map with zoom navigation, after Prezi)
   One board is one map, read live from the board (no copy):
     the board in the middle · its lists on a ring around it · each list's cards fanned out beyond it ·
     each card's stacked cards around the card · a soft curve from every node to its parent.
   Navigate: tap a node → the camera glides in on it and what belongs to it; tap the focused card again → its details
   (the Kanban's card details sheet). ‹ goes up one level, ⌂ shows the whole map; the path at the top says where
   you are and is tappable. Drag to pan, pinch / wheel to zoom.
   Arrange: drag nodes to new places; a node takes its children along. Places are offsets from the parent node,
   kept in MinestKnowledge (synced, `knowledge.m`); Reset puts the board back to the automatic layout.
   The camera of each board is kept on this device (minest.map.v1).
   Styles (per board, synced 'km:style:<board>'): Bubbles (the Prezi map above) · MindNode (a calm light canvas, the
   board as a white card, coloured branch curves with the text sitting on its line, ✓ on mastered cards) · XMind
   (a navy central topic, filled topic blocks, tinted subtopics). MindNode / XMind are tidy trees balanced left and
   right — sections (heading cards) nest their cards; dragging in Arrange keeps an offset under 'T:<node>'. */
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
  var PAL = ['#5bb5c8', '#f0965a', '#e0605a', '#f2c84b', '#9b6fd0', '#5a9cf0', '#5cbf7f', '#e57bb0'];
  function styleOf(bid) { var v = KN() && KN().get('km:style:' + bid); return v === 'bubble' || v === 'xmind' ? v : 'mind'; }   // MindNode unless chosen otherwise
  function graph(b, style) {
    var nodes = [], byKey = {}, tree = style !== 'bubble';
    var stageOf = tree && KN() ? ((KN().get('lm:cfg:' + b.id) || {}).stageOf || {}) : {};
    function add(n, parent) { n.parent = parent || null; n.kids = []; if (parent) parent.kids.push(n); nodes.push(n); byKey[n.k] = n; return n; }
    var root = add({ k: 'B:' + b.id, kind: 'board', title: b.title || 'Board', color: '#7c8cff' });
    (b.columns || []).forEach(function (col, li) {
      var L = add({ k: 'L:' + col.id, kind: 'list', title: col.title || 'List', color: col.color || PAL[li % PAL.length], id: col.id }, root);
      var secs = {}, cur = null, later = [];
      function card(c, parent) {
        var ms = false;
        if (tree) { try { var st = window.MinestLearn && MinestLearn.cardStatus ? MinestLearn.cardStatus(c, col) : null; ms = !!(st && st.mastered); } catch (e) {} }
        var C = add({ k: 'C:' + c.id, kind: 'card', title: c.title || '', color: L.color, id: c.id, col: col.id, done: !!c.complete, ms: ms, heading: KN() && KN().isHeading(c.id) }, parent);
        (Array.isArray(c.stack) ? c.stack : []).forEach(function (s) { if (s && s.id) add({ k: 'I:' + s.id, kind: 'item', title: s.title || '', color: L.color, id: s.id, col: col.id, done: !!s.complete }, C); });
        return C;
      }
      (col.cards || []).forEach(function (c) {
        if (!c || !c.id) return;
        if (!tree) return card(c, L);
        if (KN() && KN().isHeading(c.id)) { cur = secs[c.id] = card(c, L); return; }
        var want = stageOf[c.id];
        if (want && !secs[want]) { later.push([want, c]); return; }   // its section comes further down (the Kanban sinks mastered cards)
        card(c, (want && secs[want]) || cur || L);
      });
      later.forEach(function (x) { card(x[1], secs[x[0]] || L); });
    });
    if (tree) treeLayout(root, style); else { nodes.forEach(function (n) { n.w = n.h = SIZE[n.kind]; }); layout(root); }
    return { root: root, nodes: nodes, byKey: byKey, style: style };
  }

  // ---------------------------------------------------------------- MindNode / XMind: a tidy tree, balanced left and right
  var FONT = ' -apple-system,BlinkMacSystemFont,"SF Pro Text",system-ui,sans-serif';
  // [font, pad x, pad y, max text width, line height]
  var TS = {
    mind: { root: ['700 21px', 22, 18, 230, 26], list: ['650 16px', 4, 5, 230, 21], sec: ['600 14.5px', 4, 4, 230, 19], card: ['400 14px', 4, 4, 240, 18], item: ['400 12.5px', 4, 3, 220, 16] },
    xmind: { root: ['700 21px', 28, 15, 260, 26], list: ['650 15.5px', 16, 9, 230, 20], sec: ['600 14px', 13, 7, 230, 18], card: ['500 13.5px', 12, 7, 240, 18], item: ['500 12.5px', 10, 5, 220, 16] }
  };
  var c2d = null;
  function treeLayout(root, style) {
    var T = TS[style];
    c2d = c2d || document.createElement('canvas').getContext('2d');
    (function meas(n, depth) {
      var m = T[n.kind === 'board' ? 'root' : n.heading ? 'sec' : n.kind];
      n.depth = depth; n.font = m[0] + FONT; n.px = m[1]; n.py = m[2]; n.lh = m[4];
      c2d.font = n.font;
      var tw = c2d.measureText(n.title || '·').width + (n.ms ? 21 : 0), lines = Math.min(3, Math.max(1, Math.ceil(tw / m[3])));
      n.w = Math.ceil(Math.min(tw, m[3])) + 2 * m[1] + 4; n.h = lines * m[4] + 2 * m[2];
      if (n.kind === 'board' && style === 'mind') { n.w = Math.max(n.w, 176); n.h = Math.max(n.h, 100); }
      n.kids.forEach(function (k) { meas(k, depth + 1); });
    })(root, 0);
    var GX = style === 'xmind' ? 54 : 60, GY = style === 'xmind' ? 12 : 6, GL = style === 'xmind' ? 26 : 22, G0 = style === 'xmind' ? 86 : 104;
    function sh(n) { var s = 0; n.kids.forEach(function (k) { s += sh(k); }); s += GY * Math.max(0, n.kids.length - 1); return (n.sh = Math.max(n.h, s)); }
    root.kids.forEach(sh);
    var total = root.kids.reduce(function (a, l) { return a + l.sh; }, 0), right = [], left = [], acc = 0;
    // a portrait phone: every branch to the right (tall and narrow fits the screen); wider screens balance both sides
    var oneSide = innerWidth < 600 && innerHeight > innerWidth;
    root.kids.forEach(function (l) { if (oneSide || !right.length || acc + l.sh / 2 <= total / 2) { right.push(l); acc += l.sh; } else left.push(l); });
    root.x = 0; root.y = 0; root.side = 0;
    function put(n, edge, top, dir) {
      n.side = dir; n.x = edge + dir * n.w / 2; n.y = top + n.sh / 2;
      var kt = n.kids.reduce(function (a, k) { return a + k.sh; }, 0) + GY * Math.max(0, n.kids.length - 1), y = top + (n.sh - kt) / 2;
      n.kids.forEach(function (k) { put(k, edge + dir * (n.w + GX), y, dir); y += k.sh + GY; });
    }
    [[right, 1], [left, -1]].forEach(function (sd) {
      var list = sd[0], tot = list.reduce(function (a, l) { return a + l.sh; }, 0) + GL * Math.max(0, list.length - 1), y = -tot / 2;
      list.forEach(function (l) { put(l, sd[1] * (root.w / 2 + G0), y, sd[1]); y += l.sh + GL; });
    });
    // what you moved in Arrange: an offset from the parent, applied top-down (a moved branch takes its children along)
    (function adj(n) { n.kids.forEach(function (k) { var sv = KN() && KN().posOf('T:' + k.k); if (sv) moveTree(k, n.x + sv.dx - k.x, n.y + sv.dy - k.y); k.dx = k.x - n.x; k.dy = k.y - n.y; adj(k); }); })(root);
  }
  function treePath(p, n, style) {
    var dir = n.side || 1, x1, y1, x2, y2;
    if (style === 'mind') {
      if (p.kind === 'board') { x1 = p.x + dir * (p.w / 2 - 6); y1 = p.y; } else { x1 = p.x + dir * p.w / 2; y1 = p.y + p.h / 2 - 1; }
      x2 = n.x - dir * n.w / 2; y2 = n.y + n.h / 2 - 1;
    } else { x1 = p.x + dir * p.w / 2; y1 = p.y; x2 = n.x - dir * n.w / 2; y2 = n.y; }
    var mx = (x2 - x1) * .55;
    return 'M' + x1.toFixed(1) + ' ' + y1.toFixed(1) + ' C' + (x1 + mx).toFixed(1) + ' ' + y1.toFixed(1) + ' ' + (x2 - mx).toFixed(1) + ' ' + y2.toFixed(1) + ' ' + x2.toFixed(1) + ' ' + y2.toFixed(1);
  }
  function lineW(n, style) { return style === 'mind' ? (n.depth === 1 ? 5 : n.depth === 2 ? 3 : 2) : (n.depth === 1 ? 3 : n.depth === 2 ? 2 : 1.5); }
  function onColor(hex) {
    var m = /^#?([0-9a-f]{6})$/i.exec(String(hex || '')); if (!m) return '#fff';
    var v = parseInt(m[1], 16), r = v >> 16 & 255, g = v >> 8 & 255, b = v & 255;
    return (0.299 * r + 0.587 * g + 0.114 * b) > 170 ? '#1d1f23' : '#fff';
  }
  function posKey(n) { return G && G.style !== 'bubble' ? 'T:' + n.k : n.k; }
  // each list gets a slice of the circle in proportion to its cards; its cards fill that slice ring by ring,
  // so lists never run into each other; stacked cards sit around their card (shown when the card is in focus)
  function layout(root) {
    root.x = 0; root.y = 0; root.a = 0;
    var L = root.kids, W = 0;
    L.forEach(function (l) { l.wt = 1.4 + l.kids.length; W += l.wt; });
    var MIN = .42, slices = L.map(function (l) { return Math.max(MIN, Math.PI * 2 * l.wt / Math.max(1, W)); });
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
    fit: I('<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>'), style: I('<rect x="9" y="10" width="6" height="4" rx="1.5"/><path d="M9 12H6.5c-1.5 0-1.5-5-3.5-5M9 12H6.5c-1.5 0-1.5 5-3.5 5M15 12h2.5c1.5 0 1.5-5 3.5-5M15 12h2.5c1.5 0 1.5 5 3.5 5"/>'), move: I('<path d="M12 3v18M3 12h18"/><path d="m9 6 3-3 3 3M9 18l3 3 3-3M6 9l-3 3 3 3M18 9l3 3-3 3"/>')
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
    'html.kn-open #minest-mini-pet-p0,html.kn-open .mpet-menu,html.kn-open .mpet-say,html.kn-open .mpet-tip{display:none!important}',
    // ---- liquid glass (Bubbles): a deep canvas with soft colour glows; every bubble is tinted glass with a specular top,
    // a bright rim and its list's colour pooling at the bottom; the bars are glass capsules
    'html .km.s-bubble{background:radial-gradient(900px 700px at 12% 8%,rgba(94,92,230,.38),transparent 60%),radial-gradient(800px 700px at 88% 92%,rgba(48,176,199,.30),transparent 60%),radial-gradient(700px 600px at 85% 15%,rgba(255,105,180,.16),transparent 60%),radial-gradient(1300px 950px at 50% 45%,#17213a,#090d18 75%)}',
    'html .km.s-bubble .km-n{color:#fff;text-shadow:0 1px 2px rgba(0,0,0,.35);border:1px solid rgba(255,255,255,.42);' +
      'background:radial-gradient(110% 70% at 32% 10%,rgba(255,255,255,.58),rgba(255,255,255,0) 44%),radial-gradient(95% 80% at 50% 108%,color-mix(in srgb,var(--c) 70%,transparent),transparent 72%),linear-gradient(160deg,color-mix(in srgb,var(--c) 42%,rgba(255,255,255,.12)),color-mix(in srgb,var(--c) 24%,rgba(8,12,22,.42))),#141c2e;' +   // a solid base: lines behind never show through the text
      'box-shadow:inset 0 1.5px 0 rgba(255,255,255,.6),0 10px 24px rgba(0,0,0,.32)}',   // light on paint: many bubbles fly at once
    'html .km.s-bubble .km-n.board{border-width:1.5px;box-shadow:inset 0 2px 0 rgba(255,255,255,.65),inset 0 -16px 34px color-mix(in srgb,var(--c) 40%,transparent),0 22px 50px rgba(0,0,0,.42),0 0 46px color-mix(in srgb,var(--c) 45%,transparent)}',
    'html .km.s-bubble .km-n.head{border-color:rgba(255,214,10,.9);box-shadow:inset 0 1.5px 0 rgba(255,255,255,.6),0 0 0 2px rgba(255,214,10,.35),0 16px 36px rgba(0,0,0,.38)}',
    'html .km.s-bubble .km-n.focus{box-shadow:inset 0 1.5px 0 rgba(255,255,255,.7),0 0 0 3px rgba(255,255,255,.85),0 0 44px 10px color-mix(in srgb,var(--c) 55%,transparent),0 18px 40px rgba(0,0,0,.42)}',
    'html .km.s-bubble .km-lines path{stroke:rgba(255,255,255,.26)}html .km.s-bubble .km-lines path.on{stroke:rgba(255,255,255,.7)}',
    'html .km .km-b{background:linear-gradient(180deg,rgba(255,255,255,.18),rgba(255,255,255,.06));border:1px solid rgba(255,255,255,.24);box-shadow:inset 0 1px 0 rgba(255,255,255,.35),0 10px 26px rgba(0,0,0,.3);-webkit-backdrop-filter:blur(24px) saturate(180%);backdrop-filter:blur(24px) saturate(180%)}',
    'html .km .km-b.on{background:linear-gradient(180deg,#3d9bff,#0a7aff);border-color:rgba(255,255,255,.3)}',
    'html .km .km-path{background:linear-gradient(180deg,rgba(255,255,255,.16),rgba(255,255,255,.05));border:1px solid rgba(255,255,255,.2);box-shadow:inset 0 1px 0 rgba(255,255,255,.3),0 10px 26px rgba(0,0,0,.26);-webkit-backdrop-filter:blur(24px) saturate(180%);backdrop-filter:blur(24px) saturate(180%)}',
    'html .km .km-hint{background:linear-gradient(180deg,rgba(255,255,255,.18),rgba(255,255,255,.06));border:1px solid rgba(255,255,255,.2);-webkit-backdrop-filter:blur(20px);backdrop-filter:blur(20px)}',
    // light: white frosted glass
    'html.kn-light .km.s-bubble{background:radial-gradient(900px 700px at 12% 8%,rgba(150,140,255,.28),transparent 60%),radial-gradient(800px 700px at 88% 92%,rgba(90,200,220,.25),transparent 60%),radial-gradient(700px 600px at 85% 15%,rgba(255,150,200,.18),transparent 60%),radial-gradient(1300px 950px at 50% 45%,#f7f9fd,#e6ebf4 75%)}',
    'html.kn-light .km.s-bubble .km-n{color:#1d1f23;text-shadow:none;border-color:rgba(255,255,255,.95);' +
      'background:radial-gradient(110% 70% at 32% 10%,rgba(255,255,255,.95),rgba(255,255,255,0) 50%),radial-gradient(95% 80% at 50% 108%,color-mix(in srgb,var(--c) 38%,transparent),transparent 72%),linear-gradient(160deg,rgba(255,255,255,.82),color-mix(in srgb,var(--c) 20%,rgba(255,255,255,.62))),#f4f6fb;' +
      'box-shadow:inset 0 1.5px 0 #fff,0 8px 20px rgba(30,40,60,.13)}',
    'html.kn-light .km.s-bubble .km-n.focus{box-shadow:inset 0 1.5px 0 #fff,0 0 0 3px rgba(10,132,255,.7),0 0 36px 6px color-mix(in srgb,var(--c) 35%,transparent)}',
    'html.kn-light .km.s-bubble .km-lines path{stroke:rgba(30,40,60,.2)}html.kn-light .km.s-bubble .km-lines path.on{stroke:rgba(30,40,60,.55)}',
    'html.kn-light .km .km-b,html.kn-light .km .km-path,html.kn-light .km .km-hint{background:rgba(255,255,255,.72);border-color:rgba(255,255,255,.95);box-shadow:inset 0 1px 0 #fff,0 8px 22px rgba(30,40,60,.12);color:#1d1f23}',
    'html.kn-light .km .km-b.on{background:linear-gradient(180deg,#3d9bff,#0a7aff);color:#fff}',
    // ---- MindNode / XMind (tree styles)
    'html .km.tree{--ink:#ececef;--card:#2a2b31;--sub:#202126}',
    'html.kn-light .km.tree{--ink:#2b2d31;--card:#ffffff;--sub:#ffffff}',
    'html .km.s-mind{background:#1c1d21}html.kn-light .km.s-mind{background:#f3f3f5}',
    'html .km.s-xmind{background:#15161a}html.kn-light .km.s-xmind{background:#ffffff}',
    'html .km.tree .km-n{border-radius:0;background:none;border:0;box-shadow:none;justify-content:flex-start;text-align:left;color:var(--ink);transition:opacity .3s,box-shadow .25s}',
    'html .km.tree .km-n span{-webkit-line-clamp:3;overflow-wrap:break-word;-webkit-hyphens:auto;hyphens:auto}',
    'html .km.tree .km-n.item,html .km.tree .km-lines path.it{opacity:1;pointer-events:auto;scale:1}',
    'html .km.tree .km-n.dim,html .km.tree .km-n.item.dim{opacity:.22}',
    'html .km.tree.has-f .km-lines path:not(.on){opacity:.18}',
    'html .km.tree .km-lines path{transition:opacity .3s}',
    'html .km.tree .km-n.done{opacity:.55}',
    'html .km.tree .km-n.ms span:before{content:"✓";display:inline-grid;place-items:center;width:16px;height:16px;border-radius:50%;background:var(--c);color:#fff;font:800 10px/16px -apple-system,system-ui,sans-serif;margin-right:5px;vertical-align:1px}',
    'html .km.tree.arr .km-n{animation:none}',
    'html .km.tree.arr .km-n:not(.board){outline:1.5px dashed color-mix(in srgb,var(--c) 70%,transparent);outline-offset:3px}',
    // MindNode: the board is a white card; every other topic sits on its branch line
    'html .km.s-mind .km-n.board{background:var(--card);border-radius:18px;justify-content:center;text-align:center;box-shadow:0 10px 30px rgba(0,0,0,.12),0 1px 3px rgba(0,0,0,.08)}',
    'html .km.s-mind .km-n.list{border-bottom:5px solid var(--c);border-radius:0 0 2px 2px}',
    'html .km.s-mind .km-n.card,html .km.s-mind .km-n.item{border-bottom:3px solid var(--c)}',
    'html .km.s-mind .km-n.item{border-bottom-width:2px;opacity:.92}',
    'html .km.s-mind .km-n.focus{box-shadow:0 0 0 3px rgba(10,132,255,.55);border-radius:6px 6px 2px 2px}',
    'html .km.s-mind .km-n.board.focus{border-radius:18px}',
    // XMind: a navy central topic, filled main topics, tinted subtopics
    'html .km.s-xmind .km-n{justify-content:center;text-align:center}',
    'html .km.s-xmind .km-n.board{background:#0f1136;color:#fff;border-radius:13px;box-shadow:0 8px 22px rgba(15,17,54,.3)}',
    'html:not(.kn-light) .km.s-xmind .km-n.board{background:#2d3170;box-shadow:inset 0 1px 0 rgba(255,255,255,.18),0 8px 22px rgba(0,0,0,.4)}',
    'html .km.s-xmind .km-n.list,html .km.s-xmind .km-n.card.head{background:var(--c);color:var(--tc);border-radius:10px;box-shadow:0 3px 10px color-mix(in srgb,var(--c) 30%,transparent)}',
    'html .km.s-xmind .km-n.card.head{background:color-mix(in srgb,var(--c) 78%,var(--sub))}',
    'html .km.s-xmind .km-n.card:not(.head){background:color-mix(in srgb,var(--c) 14%,var(--sub));border:1.5px solid color-mix(in srgb,var(--c) 55%,var(--sub));border-radius:9px}',
    'html .km.s-xmind .km-n.item{background:color-mix(in srgb,var(--c) 7%,var(--sub));border:1px solid color-mix(in srgb,var(--c) 35%,var(--sub));border-radius:7px}',
    'html .km.s-xmind .km-n.focus{box-shadow:0 0 0 3px rgba(10,132,255,.6),0 8px 20px rgba(0,0,0,.18)}',
    'html .km.s-xmind .km-n.ms span:before{background:#16a34a}',
    '.km-menu .km-sty{display:flex;flex-direction:column;align-items:flex-start;gap:1px}.km-menu .km-sty small{font-size:11.5px;opacity:.55;font-weight:500}'
  ].join('\n');
  function ensureCss() { if (document.getElementById('km-css')) return; var s = document.createElement('style'); s.id = 'km-css'; s.textContent = CSS; document.head.appendChild(s); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function toast(m) { try { if (window.GlassUI && GlassUI.toast) GlassUI.toast(m); } catch (e) {} }

  function build() {
    var b = boardById(ui.bid); if (!b) return;
    var style = styleOf(ui.bid), tree = style !== 'bubble';
    G = graph(b, style);
    ui.el.classList.remove('s-bubble', 's-mind', 's-xmind'); ui.el.classList.add('s-' + style); ui.el.classList.toggle('tree', tree);
    var html = '';
    G.nodes.forEach(function (n) {
      var box = tree ? 'width:' + n.w + 'px;height:' + n.h + 'px;padding:' + n.py + 'px ' + n.px + 'px;font:' + n.font + ';line-height:' + n.lh + 'px;--tc:' + onColor(n.color) : 'width:' + n.w + 'px;height:' + n.h + 'px';
      html += '<div class="km-n ' + n.kind + (n.heading ? ' head' : '') + (n.done ? ' done' : '') + (n.ms ? ' ms' : '') + '" data-k="' + esc(n.k) + '" style="--c:' + esc(n.color) + ';' + box + '"><span>' + esc(n.title || '·') + '</span></div>';
    });
    ui.world.innerHTML = '<svg class="km-lines" width="1" height="1"></svg>' + html;
    ui.svg = ui.world.querySelector('.km-lines');
    ui.els = {}; ui.world.querySelectorAll('.km-n').forEach(function (e) { ui.els[e.getAttribute('data-k')] = e; });
    positions(); markFocus();
  }
  function positions() {
    var paths = '';
    var tree = G.style !== 'bubble';
    G.nodes.forEach(function (n) {
      var e = ui.els[n.k];
      e.style.transform = 'translate(' + (n.x - n.w / 2) + 'px,' + (n.y - n.h / 2) + 'px)';
      if (n.parent && tree) { paths += '<path data-k="' + esc(n.k) + '"' + (n.kind === 'item' ? ' class="it"' : '') + ' style="stroke:' + esc(n.color) + ';stroke-width:' + lineW(n, G.style) + 'px;stroke-linecap:round" d="' + treePath(n.parent, n, G.style) + '"/>'; return; }
      if (n.parent) {
        // edge to edge: the curve leaves the parent's rim and stops at the child's (it never runs under the glass and its text)
        var p = n.parent, mx = (p.x + n.x) / 2, my = (p.y + n.y) / 2, cx = mx - (n.y - p.y) * .12, cy = my + (n.x - p.x) * .12;
        var rim = function (o, r) { var dx = cx - o.x, dy = cy - o.y, L = Math.hypot(dx, dy) || 1; return [o.x + dx / L * r, o.y + dy / L * r]; };
        var a = rim(p, p.w / 2 + 1), z = rim(n, n.w / 2 + 3);
        paths += '<path data-k="' + esc(n.k) + '"' + (n.kind === 'item' ? ' class="it"' : '') + ' d="M' + a[0].toFixed(1) + ' ' + a[1].toFixed(1) + ' Q' + cx.toFixed(1) + ' ' + cy.toFixed(1) + ' ' + z[0].toFixed(1) + ' ' + z[1].toFixed(1) + '"/>';
      }
    });
    ui.svg.innerHTML = paths;
  }
  function applyCam() { ui.world.style.transform = 'translate(' + (innerWidth / 2 - cam.x * cam.s) + 'px,' + (innerHeight / 2 - cam.y * cam.s) + 'px) scale(' + cam.s + ')'; }
  // the camera is kept per board and per look (a tree style lays out differently, one-sided on a portrait phone)
  function camKey() { return ui.bid + (G && G.style !== 'bubble' ? '|' + G.style + (ui.oneSide ? '1' : '2') : ''); }
  function saveCam() { S.cam[camKey()] = { x: Math.round(cam.x), y: Math.round(cam.y), s: +cam.s.toFixed(3) }; S.focus[camKey()] = focusKey; stSave(); }

  // ---------------------------------------------------------------- camera
  var anim = 0;
  function bbox(list) {
    var x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    list.forEach(function (n) { var rw = n.w / 2, rh = n.h / 2; x0 = Math.min(x0, n.x - rw); y0 = Math.min(y0, n.y - rh); x1 = Math.max(x1, n.x + rw); y1 = Math.max(y1, n.y + rh); });
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
    if (G.style !== 'bubble' && n.kind !== 'board') { set = []; (function all(x) { set.push(x); x.kids.forEach(all); })(n); }
    fly(camFor(set), ms);
    markFocus(); crumbs();
  }
  function homeSet() { return G.style !== 'bubble' ? G.nodes : G.nodes.filter(function (n) { return n.kind !== 'item'; }); }
  function home(ms) { focusKey = null; fly(camFor(homeSet()), ms); markFocus(); crumbs(); }
  function markFocus() {
    var f = focusKey && G.byKey[focusKey], keep = {};
    if (f) { keep[f.k] = 1; f.kids.forEach(function (k) { keep[k.k] = 1; }); if (G.style !== 'bubble') (function all(x) { keep[x.k] = 1; x.kids.forEach(all); })(f); for (var p = f.parent; p; p = p.parent) keep[p.k] = 1; if (f.kind === 'item') f.parent.kids.forEach(function (k) { keep[k.k] = 1; }); }
    var card = f && (f.kind === 'card' ? f : f.kind === 'item' ? f.parent : null);
    ui.el.classList.toggle('deep', !!card); ui.el.classList.toggle('has-f', !!f);
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
      var om = document.querySelector('.km-menu'); if (om) om.remove();   // a tap on the map closes an open menu
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
      if (was.kind === 'node' && was.moved) { var n = G.byKey[was.node]; KN().setPos(posKey(n), n.x - n.parent.x, n.y - n.parent.y); return; }
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
      if (a === 'kedit') { setEdit(!editing); return; }
      if (a === 'arr') { if (editing) setEdit(false); arrange = !arrange; b.classList.toggle('on', arrange); ui.el.classList.toggle('arr', arrange); hint(arrange ? 'Drag the bubbles to arrange your map' : ''); return; }
      if (a === 'reset') { KN().clearPos(G.nodes.map(posKey)); build(); home(); return; }
      if (a === 'boards') return boardMenu(b);
      if (a === 'style') return styleMenu(b);
    });
  }
  function tap(k) {
    if (!k) return;
    var n = G.byKey[k]; if (!n) return;
    if (arrange) return;
    if (editing) { if (focusKey !== k && n.kind !== 'board') focusOn(k); return editNode(n); }   // Edit: select, then the edit bar
    if (n.kind === 'board') return home();
    if (focusKey === k && (n.kind === 'card' || n.kind === 'item')) return editHere(n);   // tapped again: its text and picture, right here
    if (focusKey === k && n.kind === 'list') return toList(n);   // a list tapped again: that list on the board
    if (n.kind === 'item' && focusKey !== k) { focusOn(k); return; }
    focusOn(k);
  }
  // ---------------------------------------------------------------- editing (MinestKEdit: the Outline's basics)
  var editing = false;
  function setEdit(on) {
    editing = !!on; if (!ui.el) return;
    var b = ui.el.querySelector('[data-act="kedit"]'); if (b) b.classList.toggle('on', editing);
    if (editing) { if (arrange) { arrange = false; ui.el.classList.remove('arr'); var ab = ui.el.querySelector('[data-act="arr"]'); if (ab) ab.classList.remove('on'); } hint('Tap a bubble to edit it'); }
    else if (window.MinestKEdit) MinestKEdit.closeBar();
  }
  function editHere(n) {
    if (!window.MinestKEdit) return;
    MinestKEdit.editText({ bid: ui.bid, kind: n.kind, id: n.id, title: n.title }, { image: true }).then(function (r) { if (r && ui.el) { var fk = focusKey; build(); focusKey = fk && G.byKey[fk] ? fk : null; markFocus(); crumbs(); } });
  }
  function toList(n) {
    var bid = ui.bid; saveCam(); close();
    if (window.MinestContents && MinestContents.goTo) MinestContents.goTo({ b: bid, l: n.id }, { label: 'Map', open: function () { open(bid); } });
  }
  function editNode(n) {
    if (!window.MinestKEdit) return;
    var t = { bid: ui.bid, kind: n.kind, id: n.kind === 'board' ? ui.bid : n.id, title: n.title };
    MinestKEdit.bar(t, {
      hide: { info: 1 },   // no trip to a card's details from the map
      image: true,
      extra: n.kind === 'list' ? [{ key: 'tolist', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="7" height="16" rx="2"/><rect x="14" y="4" width="7" height="10" rx="2"/></svg>', label: 'Open the list on the board', run: function () { MinestKEdit.closeBar(); toList(n); } }] : [],
      onDone: function (m) {
        var keyOf = function (x) { return x.kind === 'list' ? 'L:' + x.id : x.kind === 'card' ? 'C:' + x.id : x.kind === 'item' ? 'I:' + x.id : 'B:' + ui.bid; };
        build();
        var nk = m && m.id ? keyOf(m) : n.k;
        if (G.byKey[nk]) { if (G.byKey[nk].kind !== 'board') focusOn(nk); else home(); if (m && m.id && nk !== n.k) editNode(G.byKey[nk]); }
        else if (G.byKey[n.k]) { focusKey = n.k; markFocus(); crumbs(); }
        else home();
      }
    });
  }
  window.addEventListener('minest:kedit', function () { if (ui.open && ui.el && !ui.el.classList.contains('away')) { var fk = focusKey; build(); focusKey = fk && G.byKey[fk] ? fk : null; markFocus(); crumbs(); } });
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
  // one menu at a time: the same button closes it, the other button swaps it
  function menuToggle(kind) { var old = document.querySelector('.km-menu'); if (!old) return false; var same = old.getAttribute('data-kind') === kind; old.remove(); return same; }
  function boardMenu(anchor) {
    if (menuToggle('boards')) return;
    var m = document.createElement('div'); m.className = 'en-menu km-menu'; m.setAttribute('data-kind', 'boards');
    m.innerHTML = boards().filter(function (b) { return !b.archived; }).map(function (b) { return '<button type="button" data-b="' + esc(b.id) + '"' + (b.id === ui.bid ? ' class="on"' : '') + '>' + esc(b.title || 'Board') + '</button>'; }).join('');
    document.body.appendChild(m);
    var r = anchor.getBoundingClientRect(); m.style.left = Math.max(10, Math.min(innerWidth - m.offsetWidth - 10, r.left)) + 'px'; m.style.top = (r.bottom + 8) + 'px';
    m.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
    m.addEventListener('click', function (e) { var b = e.target.closest('[data-b]'); if (!b) return; m.remove(); saveCam(); ui.bid = b.getAttribute('data-b'); focusKey = null; build(); restore(); });
  }
  var STYLES = [['bubble', '🫧 Bubbles', 'Prezi — zoom through ideas'], ['mind', '🌿 MindNode', 'Calm branches, text on the line'], ['xmind', '🧩 XMind', 'Topic blocks, balanced left and right']];
  function styleMenu(anchor) {
    if (menuToggle('style')) return;
    var cur = styleOf(ui.bid), m = document.createElement('div'); m.className = 'en-menu km-menu'; m.setAttribute('data-kind', 'style');
    m.innerHTML = STYLES.map(function (x) { return '<button type="button" class="km-sty' + (x[0] === cur ? ' on' : '') + '" data-sty="' + x[0] + '"><b>' + x[1] + '</b><small>' + x[2] + '</small></button>'; }).join('');
    document.body.appendChild(m);
    var r = anchor.getBoundingClientRect(); m.style.left = Math.max(10, Math.min(innerWidth - m.offsetWidth - 10, r.left)) + 'px'; m.style.top = (r.bottom + 8) + 'px';
    m.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
    m.addEventListener('click', function (e) {
      var b = e.target.closest('[data-sty]'); if (!b) return; m.remove();
      var v = b.getAttribute('data-sty'); if (v === cur) return;
      KN().set('km:style:' + ui.bid, v === 'mind' ? null : v, true);
      focusKey = null; build(); delete S.cam[camKey()]; stSave(); restore();
    });
  }
  function restore() {
    var c = S.cam[camKey()];
    if (c) { cam = { x: c.x, y: c.y, s: c.s }; applyCam(); var f = S.focus[camKey()]; focusKey = f && G.byKey[f] ? f : null; markFocus(); crumbs(); }
    else { var hc = camFor(homeSet()); cam = { x: hc.x, y: hc.y, s: hc.s * .7 }; applyCam(); home(700); }
  }

  // ---------------------------------------------------------------- open / close
  function open(boardId) {
    if (ui.open) return;
    ensureCss(); if (window.MinestKnowledge && MinestKnowledge.applyLook) MinestKnowledge.applyLook();
    var a = A().board && A().board();
    ui.bid = boardId || (a && a.id) || (boards()[0] || {}).id;
    if (!ui.bid) return toast('No board yet.');
    var el = document.createElement('div'); el.className = 'km'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Knowledge Map');
    el.innerHTML = '<div class="km-stage"><div class="km-world"></div></div>' +
      '<div class="km-top"><button type="button" class="km-b" data-act="back" aria-label="Up one level">' + ICON.back + '</button>' +
      '<div class="km-path"></div>' +
      '<button type="button" class="km-b" data-act="style" aria-label="Map style">' + ICON.style + '</button>' +
      '<button type="button" class="km-b" data-act="boards" aria-label="Boards">' + ICON.map + '</button>' +
      '<button type="button" class="km-b" data-act="x" aria-label="Close"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div>' +
      '<div class="km-bot">' + (window.MinestKEdit ? MinestKEdit.fullBtnHtml('km-b') : '') + '<button type="button" class="km-b" data-act="home" aria-label="Whole map">' + ICON.home + '</button>' +
      '<button type="button" class="km-b" data-act="fit" aria-label="Fit to screen">' + ICON.fit + '</button>' +
      '<button type="button" class="km-b" data-act="kedit" aria-label="Edit" title="Edit">' + (window.MinestKEdit ? MinestKEdit.icons.edit : '✎') + '</button>' +
      '<button type="button" class="km-b" data-act="arr" aria-label="Arrange">' + ICON.move + '</button>' +
      '<button type="button" class="km-b" data-act="reset" aria-label="Reset layout" title="Reset layout">↺</button></div>' +
      '<div class="km-hint" style="opacity:0"></div>';
    ui.el = el; ui.stage = el.querySelector('.km-stage'); ui.world = el.querySelector('.km-world'); ui.path = el.querySelector('.km-path'); ui.backBtn = el.querySelector('[data-act="back"]'); ui.hint = el.querySelector('.km-hint');
    ui.open = true; arrange = false;
    document.body.appendChild(el); document.documentElement.classList.add('kn-open');
    if (window.MinestKEdit) MinestKEdit.fullscreen('map', el, ['.km-top', '.km-bot', '.km-hint']);
    ui.oneSide = innerWidth < 600 && innerHeight > innerWidth;
    build(); wire(); restore();
    if (!S.seen) { S.seen = 1; stSave(); hint('Tap a bubble to zoom in · tap a card again to edit it · a list again opens it on the board'); }
    if (el.animate) el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 260, easing: 'ease-out' });
    window.addEventListener('resize', onResize);
  }
  function onResize() { if (!ui.open) return; var side = innerWidth < 600 && innerHeight > innerWidth; if (G && G.style !== 'bubble' && side !== ui.oneSide) { ui.oneSide = side; var fk = focusKey; build(); focusKey = fk && G.byKey[fk] ? fk : null; if (focusKey) focusOn(focusKey, 1); else home(1); return; } applyCam(); }
  function close() {
    if (!ui.open) return;
    if (editing) setEdit(false);
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
