/* Minest · 全息操作台 2.0 · OBSIDIAN — the sixth mode: the vault, in six switchable views.
     图谱    living-knowledge/graph/ (unchanged), the Obsidian-style 2D graph, projected over the console
     星系    a 3D force-directed galaxy of the same notes and links
     星环    every hub note (a person) is a sun on a ring; its concepts and models orbit it
     螺旋    the hubs climb a time spiral in order; what belongs to each hangs beside it
     地层    four floating floors — people, concepts, thought models, interactive models — joined by vertical links
     知识球  everything on one slowly turning sphere, neighbours side by side
   In the 3D views a tap selects a note (its links light up, pulses run along them) and opens it in the data panel.
   Data: a vault { pages, decisions, sources, relations } from the embedding page ({holo:1, op:'vault', data});
   without one, the console's own content is laid out as a vault (groups → topic notes, items → notes linked to them).
   Registered with HL.register before HL.start(), like the armor bay. */
(function () {
  'use strict';
  var HL = window.HL; if (!HL || !HL.register) return;
  var T = window.THREE;
  var O = { id: 'obsidian', zh: 'Obsidian', en: 'VAULT GRAPH', wrap: null, frame: null, solid: false, full: false, view: 'galaxy', pulse: true, spin: true };
  var VIEWS = [['graph', '图谱 2D'], ['galaxy', '星系'], ['orbit', '星环'], ['helix', '螺旋'], ['strata', '地层'], ['sphere', '知识球']];
  var vault = null, UI_KEY = 'minest.holoLab2.obsidian';
  try { var sv = JSON.parse(localStorage.getItem(UI_KEY) || 'null'); if (sv) { O.solid = !!sv.solid; if (sv.view) O.view = sv.view; if (sv.pulse === false) O.pulse = false; if (sv.spin === false) O.spin = false; } } catch (e) {}
  function saveUi() { try { localStorage.setItem(UI_KEY, JSON.stringify({ solid: O.solid, view: O.view, pulse: O.pulse, spin: O.spin })); } catch (e) {} }
  function slug(s) { s = String(s == null ? '' : s); if (s.normalize) s = s.normalize('NFKC'); return s.toLowerCase().replace(/[^a-z0-9\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60); }
  function pid(title) { return 'pg_' + (slug(title) || 'x'); }
  O.pageId = pid;

  // the console's own content as a vault: every group is a topic note, every item a note that links to its group and parents
  function fromContent() {
    var c = HL.content, pages = [], seen = {}, byItem = {};
    function page(title, type, md, tags) { var id = pid(title); if (seen[id]) return seen[id]; var p = { id: id, title: title, type: type, markdown: md || '', tags: tags || [], claims: [], updatedAt: Date.now() }; seen[id] = p; pages.push(p); return p; }
    c.all.forEach(function (it) {
      if (!it.title) return;
      var g = it.groupTitle || it.subName || '未分组';
      page(g, 'topic', '');
      var p = page(it.title, it.kind === 'chart' ? 'howto' : it.kind === 'knowledge' ? 'concept' : 'note', (it.text || '') + '\n\n所属：[[' + g + ']]', it.tags);
      byItem[it.id] = p;
    });
    c.knowledge.forEach(function (k) { var p = byItem[k.id]; if (!p) return; (k.parents || []).forEach(function (par) { var q = byItem[par]; if (q && q !== p) p.markdown += '\n相关：[[' + q.title + ']]'; }); });
    return { pages: pages, decisions: [], sources: [], relations: [] };
  }
  O.vault = function () { return vault && vault.pages && vault.pages.length ? vault : fromContent(); };
  function counts() { var v = O.vault(), links = 0; v.pages.forEach(function (p) { links += (String(p.markdown || '').match(/\[\[[^\]]+\]\]/g) || []).length; }); return [v.pages.length, links + (v.relations || []).length]; }
  function send() { if (!O.frame || !O.frame.contentWindow) return; try { O.frame.contentWindow.postMessage({ type: 'lk-graph-data', data: O.vault() }, location.origin); } catch (e) {} }

  function title(on) { var e = document.getElementById('v2Title'); if (!e) return; if (!O.t0) O.t0 = e.textContent; e.textContent = on ? '全息操作台 2.0 · Obsidian 知识库' : O.t0; }
  function style() {
    if (document.getElementById('obsCss')) return;
    var st = document.createElement('style'); st.id = 'obsCss';
    st.textContent = '#obsWrap{position:fixed;z-index:3;left:calc(env(safe-area-inset-left) + 12px);right:calc(env(safe-area-inset-right) + 12px);top:calc(env(safe-area-inset-top) + 56px);bottom:calc(env(safe-area-inset-bottom) + 124px);' +
      'border-radius:18px;overflow:hidden;border:1px solid rgba(120,214,255,.42);box-shadow:0 0 0 1px rgba(0,0,0,.3),0 0 34px rgba(70,210,255,.22),inset 0 0 40px rgba(70,210,255,.08);' +
      'transform-origin:50% 100%;animation:obsIn .7s cubic-bezier(.16,1,.3,1) both}' +
      '@keyframes obsIn{from{opacity:0;transform:perspective(900px) rotateX(38deg) scale(.55) translateY(60px)}}' +
      '#obsWrap iframe{position:absolute;inset:0;width:100%;height:100%;border:0;background:transparent;mix-blend-mode:screen;opacity:.97}' +
      '#obsWrap.solid iframe{mix-blend-mode:normal;opacity:1}#obsWrap.solid{background:#141519}' +
      '#obsWrap.full{left:0;right:0;top:0;bottom:calc(env(safe-area-inset-bottom) + 118px);border-radius:0}' +
      '#obsWrap::after{content:"";position:absolute;inset:0;pointer-events:none;background:repeating-linear-gradient(to bottom,rgba(110,220,255,.05) 0 1px,transparent 1px 3px);mix-blend-mode:screen}' +
      '#obsWrap.solid::after{display:none}';
    document.head.appendChild(st);
  }

  /* ───────────────────────── the 3D views ───────────────────────── */
  var TYPE_COL = { person: 0xf472b6, concept: 0x8b7cf6, topic: 0x22d3ee, howto: 0x34d399, note: 0xa3a3f5, event: 0xfb923c, project: 0x38bdf8 };
  var LAYER = { person: 3, concept: 2, topic: 1, howto: 0 };
  var G = null;   // { root, nodes, edges, adj, hubs, pos, pts, lines, pulses, labels, sel }
  function rnd(seed) { var s = seed >>> 0; return function () { s = (s + 0x6D2B79F5) >>> 0; var t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function labelSprite(text, color, h) {
    var cv = document.createElement('canvas'); cv.width = 512; cv.height = 80;
    var tex = HL.canvasTex(cv), sp = new T.Sprite(new T.SpriteMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false }));
    sp.renderOrder = 20; sp.scale.set(h * 6.4, h, 1); sp.userData = { cv: cv, tex: tex, text: null, color: color };
    setLabel(sp, text); return sp;
  }
  function setLabel(sp, text) {
    var u = sp.userData; if (u.text === text) return; u.text = text;
    var x = u.cv.getContext('2d'); x.clearRect(0, 0, 512, 80); if (!text) { u.tex.needsUpdate = true; return; }
    var size = 46; x.textAlign = 'center'; x.textBaseline = 'middle';
    for (; size > 18; size -= 2) { x.font = '800 ' + size + 'px ' + HL.FONT; if (x.measureText(text).width <= 496) break; }
    var t = text; while (t.length > 2 && x.measureText(t).width > 496) t = t.slice(0, -2) + '…';
    x.shadowColor = u.color; x.shadowBlur = 12; x.fillStyle = '#f2fcff'; x.fillText(t, 256, 42); x.shadowBlur = 4; x.fillText(t, 256, 42);
    u.tex.needsUpdate = true;
  }
  function buildGraph() {
    var v = O.vault(), nodes = [], byId = {}, edges = [], seen = {}, i, j;
    v.pages.forEach(function (p, k) { var n = { p: p, i: k, type: p.type || 'note', adj: [], hub: false, owner: -1, slot: 0, kids: 0 }; nodes.push(n); byId[p.id] = n; });
    var link = function (a, b) { if (!a || !b || a === b) return; var key = a.i < b.i ? a.i + '_' + b.i : b.i + '_' + a.i; if (seen[key]) return; seen[key] = 1; edges.push([a.i, b.i]); a.adj.push(b.i); b.adj.push(a.i); };
    v.pages.forEach(function (p) { var re = /\[\[([^\[\]|\n]+?)(?:\|[^\[\]\n]+?)?\]\]/g, m; while ((m = re.exec(String(p.markdown || '')))) link(byId[p.id], byId[pid(m[1].trim())]); });
    (v.relations || []).forEach(function (r) { link(byId[r.from], byId[r.to]); });
    var hubs = nodes.filter(function (n) { return n.type === 'person'; });
    if (!hubs.length) hubs = nodes.filter(function (n) { return n.type === 'topic'; });
    if (!hubs.length) hubs = nodes.slice().sort(function (a, b) { return b.adj.length - a.adj.length; }).slice(0, Math.min(12, nodes.length));
    hubs.sort(function (a, b) { return (a.p.year == null ? a.i : a.p.year) - (b.p.year == null ? b.i : b.p.year); });
    hubs.forEach(function (h, k) { h.hub = true; h.owner = k; });
    nodes.forEach(function (n) {
      if (n.hub) return;
      for (j = 0; j < n.adj.length; j++) if (nodes[n.adj[j]].hub) { n.owner = nodes[n.adj[j]].owner; break; }
      if (n.owner < 0) n.owner = hubs.length ? n.i % hubs.length : 0;
      if (hubs.length) n.slot = hubs[n.owner].kids++;
    });
    return { nodes: nodes, edges: edges, hubs: hubs };
  }
  // a 3D force layout, computed once
  function galaxy(g) {
    var n = g.nodes.length, r = rnd(20261124), P = new Float32Array(n * 3), F = new Float32Array(n * 3), i, j, it;
    for (i = 0; i < n; i++) { P[i * 3] = (r() - 0.5) * 4; P[i * 3 + 1] = (r() - 0.5) * 4; P[i * 3 + 2] = (r() - 0.5) * 4; }
    for (it = 0; it < 180; it++) {
      F.fill(0);
      for (i = 0; i < n; i++) for (j = i + 1; j < n; j++) {
        var dx = P[i * 3] - P[j * 3], dy = P[i * 3 + 1] - P[j * 3 + 1], dz = P[i * 3 + 2] - P[j * 3 + 2], d2 = dx * dx + dy * dy + dz * dz + 0.01, f = 0.09 / d2, d = Math.sqrt(d2);
        dx *= f / d; dy *= f / d; dz *= f / d; F[i * 3] += dx; F[i * 3 + 1] += dy; F[i * 3 + 2] += dz; F[j * 3] -= dx; F[j * 3 + 1] -= dy; F[j * 3 + 2] -= dz;
      }
      g.edges.forEach(function (e) {
        var a = e[0] * 3, b = e[1] * 3, dx = P[b] - P[a], dy = P[b + 1] - P[a + 1], dz = P[b + 2] - P[a + 2], d = Math.sqrt(dx * dx + dy * dy + dz * dz) + 1e-4, f = (d - 0.55) * 0.06 / d;
        F[a] += dx * f; F[a + 1] += dy * f; F[a + 2] += dz * f; F[b] -= dx * f; F[b + 1] -= dy * f; F[b + 2] -= dz * f;
      });
      var k = it < 120 ? 1 : 0.5;
      for (i = 0; i < n * 3; i++) { F[i] -= P[i] * 0.012; P[i] += Math.max(-0.3, Math.min(0.3, F[i] * k)); }
    }
    var max = 0.001; for (i = 0; i < n; i++) max = Math.max(max, Math.hypot(P[i * 3], P[i * 3 + 1], P[i * 3 + 2]));
    for (i = 0; i < n; i++) { P[i * 3] *= 2.5 / max; P[i * 3 + 1] *= 1.25 / max; P[i * 3 + 2] *= 2.5 / max; }
    return P;
  }
  var TAU = Math.PI * 2;
  var LAYOUT = {
    galaxy: function (g, n, t, o) { o.set(g.gal[n.i * 3], g.gal[n.i * 3 + 1], g.gal[n.i * 3 + 2]); },
    orbit: function (g, n, t, o) {
      var H = g.hubs.length || 1, a = n.owner / H * TAU, hx = Math.cos(a) * 2.25, hz = Math.sin(a) * 2.25, hy = Math.sin(a * 2) * 0.25;
      if (n.hub) { o.set(hx, hy, hz); return; }
      var k = g.hubs[n.owner] ? g.hubs[n.owner].kids : 1, ring = n.slot % 2, rr = 0.3 + ring * 0.16, ph = n.slot / Math.max(1, k) * TAU + t * (0.5 - ring * 0.22) * (n.owner % 2 ? 1 : -1), tilt = 0.5 + (n.owner % 3) * 0.3;
      o.set(hx + Math.cos(ph) * rr, hy + Math.sin(ph) * rr * Math.sin(tilt), hz + Math.sin(ph) * rr * Math.cos(tilt));
    },
    helix: function (g, n, t, o) {
      var H = g.hubs.length || 1, u = n.owner / Math.max(1, H - 1), a = u * TAU * 2.2, y = -1.15 + u * 2.4, R = 1.55;
      if (n.hub) { o.set(Math.cos(a) * R, y, Math.sin(a) * R); return; }
      var out = 0.42 + (n.slot % 3) * 0.2, da = ((n.slot % 5) - 2) * 0.075, dy = (Math.floor(n.slot / 5) - 0.5) * 0.16;
      o.set(Math.cos(a + da) * (R + out), y + dy + Math.sin(t * 0.8 + n.i) * 0.015, Math.sin(a + da) * (R + out));
    },
    strata: function (g, n, t, o) {
      var H = g.hubs.length || 1, L = LAYER[n.type] == null ? 1 : LAYER[n.type], a = n.owner / H * TAU + (n.hub ? 0 : ((n.slot % 4) - 1.5) * 0.065), R = n.hub ? 1.05 : 1.45 + (Math.floor(n.slot / 4) % 3) * 0.34 + L * 0.12;
      o.set(Math.cos(a) * R, -1.0 + L * 0.68, Math.sin(a) * R);
    },
    sphere: function (g, n, t, o) {
      var N = g.nodes.length, k = n.rank, y = 1 - (k + 0.5) / N * 2, r = Math.sqrt(1 - y * y), a = k * 2.399963 + t * 0.05;
      o.set(Math.cos(a) * r * 2.05, y * 1.45, Math.sin(a) * r * 2.05);
    }
  };
  var PV = 'attribute vec3 aColor; attribute float aSize; attribute float aLit; uniform float uPx; varying vec3 vC; varying float vL; void main(){ vC = aColor; vL = aLit; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = aSize * uPx / -mv.z; gl_Position = projectionMatrix * mv; }';
  var PF = 'varying vec3 vC; varying float vL; void main(){ float d = length(gl_PointCoord - 0.5); float a = smoothstep(0.5, 0.0, d); float core = smoothstep(0.2, 0.0, d); gl_FragColor = vec4((vC * (a * 0.75) + vec3(core) * 0.9) * vL, 1.0); }';
  function build3D() {
    clear3D();
    var g = G = buildGraph(), n = g.nodes.length, i;
    if (!n) { HL.empty('知识库里还没有笔记'); return; }
    g.gal = galaxy(g);
    g.nodes.slice().sort(function (a, b) { return a.owner - b.owner || (b.hub ? 1 : 0) - (a.hub ? 1 : 0) || a.slot - b.slot; }).forEach(function (nd, k) { nd.rank = k; });
    g.root = new T.Group(); g.root.position.copy(HL.CENTER); HL.contentRoot.add(g.root);
    g.pos = new Float32Array(n * 3); g.own = [];
    var col = new Float32Array(n * 3), size = new Float32Array(n); g.lit = new Float32Array(n).fill(1); var c = new T.Color();
    g.nodes.forEach(function (nd) { c.setHex(TYPE_COL[nd.type] || TYPE_COL.note); col[nd.i * 3] = c.r; col[nd.i * 3 + 1] = c.g; col[nd.i * 3 + 2] = c.b; size[nd.i] = nd.hub ? 0.34 : 0.13 + Math.min(0.12, nd.adj.length * 0.02); });
    g.size0 = size.slice();
    var pg = new T.BufferGeometry();
    pg.setAttribute('position', new T.BufferAttribute(g.pos, 3)); pg.setAttribute('aColor', new T.BufferAttribute(col, 3)); pg.setAttribute('aSize', new T.BufferAttribute(size, 1)); pg.setAttribute('aLit', new T.BufferAttribute(g.lit, 1));
    g.pmat = new T.ShaderMaterial({ uniforms: { uPx: { value: innerHeight * 0.9 } }, vertexShader: PV, fragmentShader: PF, transparent: true, depthWrite: false, blending: T.AdditiveBlending });
    g.pts = new T.Points(pg, g.pmat); g.pts.frustumCulled = false; g.root.add(g.pts); g.own.push(pg, g.pmat);
    var lg = new T.BufferGeometry(); g.lpos = new Float32Array(g.edges.length * 6); g.lcol = new Float32Array(g.edges.length * 6);
    lg.setAttribute('position', new T.BufferAttribute(g.lpos, 3)); lg.setAttribute('color', new T.BufferAttribute(g.lcol, 3));
    var lm = new T.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.9, blending: T.AdditiveBlending, depthWrite: false });
    g.lines = new T.LineSegments(lg, lm); g.lines.frustumCulled = false; g.root.add(g.lines); g.own.push(lg, lm);
    var NP = Math.min(140, g.edges.length); g.pul = []; g.ppos = new Float32Array(NP * 3);
    var r = rnd(7); for (i = 0; i < NP; i++) g.pul.push({ e: Math.floor(r() * g.edges.length), t: r(), v: 0.25 + r() * 0.5, dir: r() < 0.5 ? 1 : -1 });
    var qg = new T.BufferGeometry(); qg.setAttribute('position', new T.BufferAttribute(g.ppos, 3));
    var qm = new T.PointsMaterial({ color: 0xbff0ff, size: 0.05, transparent: true, opacity: 0.95, blending: T.AdditiveBlending, depthWrite: false });
    g.pulses = new T.Points(qg, qm); g.pulses.frustumCulled = false; g.root.add(g.pulses); g.own.push(qg, qm);
    g.deco = new T.Group(); g.root.add(g.deco);
    g.hubLabels = g.hubs.slice(0, 40).map(function (h) { var sp = labelSprite(h.p.title, '#f472b6', 0.17); g.root.add(sp); return { sp: sp, n: h }; });
    g.selLabels = []; for (i = 0; i < 14; i++) { var sp = labelSprite('', '#6fe3ff', 0.13); sp.visible = false; g.root.add(sp); g.selLabels.push(sp); }
    g.sel = -1; g.fresh = true; deco();
  }
  function ringLine(R, y, color, op) {
    var pts = []; for (var i = 0; i <= 96; i++) pts.push(new T.Vector3(Math.cos(i / 96 * TAU) * R, y, Math.sin(i / 96 * TAU) * R));
    var geo = new T.BufferGeometry().setFromPoints(pts), mat = new T.LineBasicMaterial({ color: color, transparent: true, opacity: op, blending: T.AdditiveBlending, depthWrite: false });
    G.own.push(geo, mat); return new T.Line(geo, mat);
  }
  // the scaffolding that belongs to each view: floors, the time spiral, the orbit ring, the sphere's cage
  function deco() {
    var g = G; if (!g) return; while (g.deco.children.length) g.deco.remove(g.deco.children[0]);
    var add = function (o) { g.deco.add(o); return o; }, i;
    if (O.view === 'orbit') add(ringLine(2.25, 0, 0xf472b6, 0.22));
    else if (O.view === 'strata') {
      [['交互模型', 0x34d399], ['思想模型', 0x22d3ee], ['核心概念', 0x8b7cf6], ['人物', 0xf472b6]].forEach(function (L, k) {
        var y = -1.0 + k * 0.68; add(ringLine(2.55, y, L[1], 0.3)); add(ringLine(1.05, y, L[1], 0.14));
        var disc = new T.Mesh(new T.CircleGeometry(2.55, 64), new T.MeshBasicMaterial({ color: L[1], transparent: true, opacity: 0.035, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide })); disc.rotation.x = -Math.PI / 2; disc.position.y = y; g.own.push(disc.geometry, disc.material); add(disc);
        var sp = labelSprite(L[0], '#' + L[1].toString(16).padStart(6, '0'), 0.15); sp.position.set(-2.85, y + 0.08, 0); add(sp); g.own.push(sp.material, sp.userData.tex);
      });
    } else if (O.view === 'helix') {
      var pts = []; for (i = 0; i <= 160; i++) { var u = i / 160, a = u * TAU * 2.2; pts.push(new T.Vector3(Math.cos(a) * 1.55, -1.15 + u * 2.4, Math.sin(a) * 1.55)); }
      var geo = new T.BufferGeometry().setFromPoints(pts), mat = new T.LineBasicMaterial({ color: 0xffb454, transparent: true, opacity: 0.55, blending: T.AdditiveBlending, depthWrite: false }); g.own.push(geo, mat); add(new T.Line(geo, mat));
      var ax = new T.BufferGeometry().setFromPoints([new T.Vector3(0, -1.3, 0), new T.Vector3(0, 1.4, 0)]); g.own.push(ax); add(new T.Line(ax, mat));
      var s0 = labelSprite('更早', '#ffb454', 0.13); s0.position.set(0, -1.42, 0); add(s0); var s1 = labelSprite('更晚', '#ffb454', 0.13); s1.position.set(0, 1.52, 0); add(s1); g.own.push(s0.material, s0.userData.tex, s1.material, s1.userData.tex);
    } else if (O.view === 'sphere') {
      var cage = new T.LineSegments(new T.EdgesGeometry(new T.IcosahedronGeometry(2.05, 2)), new T.LineBasicMaterial({ color: 0x46d2ff, transparent: true, opacity: 0.07, blending: T.AdditiveBlending, depthWrite: false })); cage.scale.y = 1.45 / 2.05; g.own.push(cage.geometry, cage.material); add(cage);
    }
  }
  function clear3D() {
    if (!G) return;
    HL.contentRoot.remove(G.root);
    G.own.forEach(function (x) { try { x.dispose(); } catch (e) {} });
    G.hubLabels.forEach(function (l) { l.sp.material.map.dispose(); l.sp.material.dispose(); }); G.selLabels.forEach(function (sp) { sp.material.map.dispose(); sp.material.dispose(); });
    G = null;
  }
  var _o = new T.Vector3();
  O.update = function (dt, t) {
    var g = G; if (!g || O.view === 'graph') return;
    var fn = LAYOUT[O.view] || LAYOUT.galaxy, k = g.fresh ? 1 : 1 - Math.exp(-dt * 3.2), i, n = g.nodes.length, P = g.pos; g.fresh = false;
    for (i = 0; i < n; i++) { fn(g, g.nodes[i], t, _o); P[i * 3] += (_o.x - P[i * 3]) * k; P[i * 3 + 1] += (_o.y - P[i * 3 + 1]) * k; P[i * 3 + 2] += (_o.z - P[i * 3 + 2]) * k; }
    g.pts.geometry.attributes.position.needsUpdate = true; g.pmat.uniforms.uPx.value = innerHeight * 0.9;
    var sel = g.sel, near = sel >= 0 ? g.nodes[sel].adj : null, L = g.lit, S = g.pts.geometry.attributes.aSize.array;
    for (i = 0; i < n; i++) { var on = sel < 0 ? 1 : (i === sel ? 1.5 : near.indexOf(i) >= 0 ? 1.15 : 0.16); L[i] += (on - L[i]) * Math.min(1, dt * 8); S[i] = g.size0[i] * (i === sel ? 1.7 + 0.2 * Math.sin(t * 5) : 1); }
    g.pts.geometry.attributes.aLit.needsUpdate = true; g.pts.geometry.attributes.aSize.needsUpdate = true;
    var lp = g.lpos, lc = g.lcol;
    g.edges.forEach(function (e, j) {
      var a = e[0] * 3, b = e[1] * 3, o = j * 6, hot = sel >= 0 && (e[0] === sel || e[1] === sel), v = sel < 0 ? 0.17 : hot ? 0.95 : 0.03;
      lp[o] = P[a]; lp[o + 1] = P[a + 1]; lp[o + 2] = P[a + 2]; lp[o + 3] = P[b]; lp[o + 4] = P[b + 1]; lp[o + 5] = P[b + 2];
      var r = hot ? 1.0 : 0.45, gg = hot ? 0.72 : 0.85, bb = hot ? 0.33 : 1.0;
      lc[o] = lc[o + 3] = r * v; lc[o + 1] = lc[o + 4] = gg * v; lc[o + 2] = lc[o + 5] = bb * v;
    });
    g.lines.geometry.attributes.position.needsUpdate = true; g.lines.geometry.attributes.color.needsUpdate = true;
    g.pulses.visible = O.pulse;
    if (O.pulse) {
      var hotE = null; if (sel >= 0) { hotE = []; g.edges.forEach(function (e, j) { if (e[0] === sel || e[1] === sel) hotE.push(j); }); }
      g.pul.forEach(function (p, j) {
        p.t += dt * p.v * (sel >= 0 ? 1.6 : 1);
        if (p.t > 1) { p.t = 0; p.e = hotE && hotE.length ? hotE[(j * 7 + Math.floor(t * 3)) % hotE.length] : (p.e * 31 + 17 + j) % g.edges.length; if (hotE) p.dir = g.edges[p.e][0] === sel ? 1 : -1; }
        var e = g.edges[p.e], a = e[p.dir > 0 ? 0 : 1] * 3, b = e[p.dir > 0 ? 1 : 0] * 3, u = p.t;
        g.ppos[j * 3] = P[a] + (P[b] - P[a]) * u; g.ppos[j * 3 + 1] = P[a + 1] + (P[b + 1] - P[a + 1]) * u; g.ppos[j * 3 + 2] = P[a + 2] + (P[b + 2] - P[a + 2]) * u;
      });
      g.pulses.geometry.attributes.position.needsUpdate = true;
    }
    g.hubLabels.forEach(function (l) { var q = l.n.i * 3; l.sp.position.set(P[q], P[q + 1] + 0.2, P[q + 2]); l.sp.material.opacity = sel < 0 || l.n.i === sel || near.indexOf(l.n.i) >= 0 ? 1 : 0.18; });
    var show = sel >= 0 ? [sel].concat(near).filter(function (q) { return !g.nodes[q].hub; }).slice(0, g.selLabels.length) : [];
    g.selLabels.forEach(function (sp, j) { var q = show[j]; sp.visible = q != null; if (q != null) { setLabel(sp, g.nodes[q].p.title); sp.position.set(P[q * 3], P[q * 3 + 1] + 0.14, P[q * 3 + 2]); } });
    if (O.spin && sel < 0) g.root.rotation.y += dt * 0.06;
  };
  O.pick = function (x, y) {
    var g = G; if (!g || O.view === 'graph') return null;
    var best = -1, bd = 26, v = new T.Vector3();
    for (var i = 0; i < g.nodes.length; i++) { v.set(g.pos[i * 3], g.pos[i * 3 + 1], g.pos[i * 3 + 2]); g.root.localToWorld(v); var s = HL.screenOf(v); if (s.behind) continue; var d = Math.hypot(s.x - x, s.y - y) - (g.nodes[i].hub ? 8 : 0); if (d < bd) { bd = d; best = i; } }
    return best >= 0 ? { node: best } : null;
  };
  O.tap = function (h) {
    var g = G; if (!g || O.view === 'graph') return;
    if (!h) { g.sel = -1; HL.detail.close(); return; }
    g.sel = h.node; openNote(g.nodes[h.node].p.id);
  };
  O.onDetailClosed = function () { if (G) G.sel = -1; };
  O.select = function (id) { if (!G) return; G.nodes.forEach(function (n) { if (n.p.id === id) G.sel = n.i; }); };

  function show() {
    var flat = O.view === 'graph';
    if (flat) {
      clear3D();
      if (!O.wrap) {
        var w = O.wrap = document.createElement('div'); w.id = 'obsWrap'; w.className = (O.solid ? 'solid ' : '') + (O.full ? 'full' : '');
        w.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
        var f = O.frame = document.createElement('iframe'); f.title = 'Obsidian 知识图谱'; f.src = '../living-knowledge/graph/index.html'; f.setAttribute('allow', 'fullscreen');
        w.appendChild(f); document.body.appendChild(w);
      }
      HL.cam.g.dist = HL.cam.homeDist * 1.25;
    } else {
      if (O.wrap) { O.wrap.remove(); O.wrap = O.frame = null; }
      if (!G) build3D(); else deco();
      HL.home(); HL.cam.g.el = O.view === 'strata' ? 0.34 : O.view === 'helix' ? 0.2 : 0.3; HL.cam.g.dist = HL.cam.homeDist * 1.02;
    }
    HL.refreshTools();
  }
  O.setView = function (v) { if (!LAYOUT[v] && v !== 'graph') return; O.view = v; saveUi(); HL.detail.close(); show(); };
  O.enter = function () { style(); title(true); HL.empty(''); show(); };
  O.exit = function () { title(false); if (O.wrap) O.wrap.remove(); O.wrap = O.frame = null; clear3D(); HL.home(); };
  O.onContent = function () { if (O.view === 'graph') send(); else build3D(); HL.refreshTools(); };
  O.tools = function (box) {
    var n = counts();
    VIEWS.forEach(function (v) { HL.ui.chip(box, v[1], O.view === v[0], function () { O.setView(v[0]); }); });
    HL.ui.sep(box);
    if (O.view === 'graph') {
      HL.ui.chip(box, O.solid ? '◼ 实体屏' : '◇ 全息投影', !O.solid, function () { O.solid = !O.solid; saveUi(); if (O.wrap) O.wrap.classList.toggle('solid', O.solid); HL.refreshTools(); }, '全息投影：图谱叠在操作台的光里 · 实体屏：不透明，文字更清楚');
      HL.ui.chip(box, O.full ? '⤡ 还原' : '⤢ 铺满', O.full, function () { O.full = !O.full; if (O.wrap) O.wrap.classList.toggle('full', O.full); HL.refreshTools(); }, '让图谱铺满整个画面');
    } else {
      HL.ui.chip(box, '脉冲', O.pulse, function () { O.pulse = !O.pulse; saveUi(); HL.refreshTools(); }, '沿着链接流动的光点');
      HL.ui.chip(box, '自转', O.spin, function () { O.spin = !O.spin; saveUi(); HL.refreshTools(); }, '缓慢自转');
    }
    HL.ui.sep(box); HL.ui.lab(box, n[0] + ' 篇笔记 · ' + n[1] + ' 条链接');
  };

  function openNote(id) {
    var v = O.vault(), p = null, back = [];
    v.pages.forEach(function (x) { if (x.id === id) p = x; });
    if (!p) { HL.toast('这一页还没有写 · Not written yet'); return; }
    v.pages.forEach(function (x) { if (x !== p && String(x.markdown || '').indexOf('[[' + p.title + ']]') >= 0) back.push(x.title); });
    var body = String(p.markdown || '').replace(/\[\[([^\]|]+)(\|[^\]]+)?\]\]/g, '$1').trim();
    if (back.length) body += '\n\n← 反向链接：' + back.slice(0, 14).join(' · ');
    var TYPE = { concept: '概念', person: '人物', event: '事件', project: '项目', topic: '主题', howto: '交互模型', note: '笔记' };
    var it = { kind: 'knowledge', id: 'vault:' + p.id, uid: 'vault:' + p.id, title: p.title, text: body, groupTitle: TYPE[p.type] || '笔记', tags: p.tags || [], wiki: true };
    var acts = [];
    if (p.goto && HL.EMBED) acts.push(['🚶 前往展馆', function () { HL.post({ holo: 1, op: 'goto', id: p.goto }); }, 'pri']);
    if (p.model && HL.EMBED) acts.push(['▶ 启动交互模型', function () { HL.post({ holo: 1, op: 'open', kind: 'chart', id: 'model:' + p.model }); }, 'pri']);
    O.select(p.id);
    HL.detail.open(it, { body: body, actions: acts });
  }

  addEventListener('message', function (e) {
    var m = e.data; if (!m || typeof m !== 'object') return;
    if (O.frame && e.source === O.frame.contentWindow && e.origin === location.origin) {
      if (m.type === 'lk-graph-ready') send();
      else if (m.type === 'lk-open') openNote(String(m.id || ''));
      else if (m.type === 'lk-new') HL.toast('这里的知识库是只读的投影 · Read-only here');
      return;
    }
    if (HL.EMBED && e.source === window.parent && m.holo === 1 && m.op === 'vault' && m.data && typeof m.data === 'object') { vault = m.data; if (HL.active === O) { if (O.view === 'graph') send(); else build3D(); HL.refreshTools(); } }
  });
  HL.register(O);
})();
