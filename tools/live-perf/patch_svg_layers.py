"""Smooth island (My World display) with a big city on it: the static island never repaints while things move.
1. People, pets and cars (movers / mobs) are drawn into their own SVG laid over the scene, so their 60 fps walk only
   repaints that thin layer, not the 20 000-node island under it.
2. Pan and pinch slide the already-painted layers with a CSS transform (GPU) and draw the camera into the SVG once
   the finger rests (CAMQ), instead of repainting the whole island on every move.
3. Screen maths reads the stage box (the layers' parent), which a sliding layer never moves.
Patched in place in every copy; safe to re-run."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
FILES = ['iPhone53.8241.html', 'iphone.html', 'index.html', 'ipad.html', 'iPhoneDuo.html', 'ios/Minest/Minest/iphone.html',
         'ios/Minest/Minest/iphone18.0.html', 'ios/Minest/Minest/ipad.html', 'ios/MinestProject/MyApp/iphone.html']

CAMERA = """var CAMQ = null;   // the camera drawn into the SVG; quick moves slide the painted layers, then it settles
  function camLayers() { return el ? [].slice.call(el.querySelectorAll('.mn-dsp-stage > svg.mn-dsp-scene')) : []; }
  function camera() { var ls = camLayers(); if (!ls.length) return; var now = performance.now(), c = V.cam;
    if (CAMQ && CAMQ.el === el && now - CAMQ.t < 220) { var k = c.z / CAMQ.z, tf = 'translate(' + (c.x - k * CAMQ.x).toFixed(1) + 'px,' + (c.y - k * CAMQ.y).toFixed(1) + 'px) scale(' + k.toFixed(4) + ')';
      ls.forEach(function (s) { camSlide(s, tf); }); CAMQ.t = now; clearTimeout(CAMQ.tm); CAMQ.tm = setTimeout(camSettle, 170); return; }
    camSettle(); }
  function camSettle() { if (!el || !V) return; var c = V.cam, tr = 'translate(' + c.x.toFixed(1) + ',' + c.y.toFixed(1) + ') scale(' + c.z.toFixed(3) + ')';
    camLayers().forEach(function (s) { var g = s.querySelector('g.cam'); if (!g) return; g.classList.toggle('far', c.z < 1.05); g.setAttribute('transform', tr); if (s.__camA) { s.__camA.cancel(); s.__camA = null; } });
    if (CAMQ) clearTimeout(CAMQ.tm); CAMQ = { el: el, x: c.x, y: c.y, z: c.z, t: performance.now() }; }
  function liveCam() {   // the layer people, pets and cars walk on, over the island
    var sc = el.querySelector('.mn-dsp-stage > svg.mn-dsp-scene'); if (!sc) return null; var lv = sc.parentNode.querySelector('svg.mn-dsp-live');
    if (!lv) { sc.insertAdjacentHTML('afterend', '<svg class="mn-dsp-scene mn-dsp-live" xmlns="http://www.w3.org/2000/svg"><g class="cam"></g></svg>'); lv = sc.nextElementSibling; }
    var g = lv.querySelector('g.cam'), g0 = sc.querySelector('g.cam'); if (g0 && g0.getAttribute('transform')) g.setAttribute('transform', g0.getAttribute('transform')); g.setAttribute('class', g0 ? g0.getAttribute('class') : 'cam'); if (sc.__camA && sc.__camTf) camSlide(lv, sc.__camTf); return g; }
  function camSlide(s, tf) {   // an animation, not the style attribute: a style change on the island would restyle all its nodes
    s.__camTf = tf; var kf = [{ transform: tf }, { transform: tf }]; if (s.__camA) s.__camA.effect.setKeyframes(kf); else s.__camA = s.animate(kf, { duration: 1e9, fill: 'forwards' }); }"""

SVGSET = """function svgSet(g, list) {   // redraw only what changed: a part with the same markup keeps its node, so a tap or a drag restyles a few nodes, not the whole city
    list = list.filter(function (h) { return h; }); var old = g.__ss, on = g.__sn, NS = 'http://www.w3.org/2000/svg';
    function full() { g.innerHTML = list.join(''); var ch = [].slice.call(g.children); if (ch.length === list.length) { ch.forEach(function (n) { n.__k = 1; }); g.__ss = list; g.__sn = ch; } else g.__ss = g.__sn = null; }
    if (!old || !on || on.length !== old.length || !on.every(function (n) { return n.parentNode === g; })) return full();
    var idx = new Map(), i = 0, j, plan = [], ins = [], dead = []; old.forEach(function (h, k) { var a = idx.get(h); if (a) a.push(k); else idx.set(h, [k]); });
    for (j = 0; j < list.length; j++) { var h = list[j];
      if (i < old.length && old[i] === h) { plan.push(on[i++]); continue; }
      var a = idx.get(h), k = -1; if (a) { while (a.length && a[0] < i) a.shift(); if (a.length && a[0] - i <= 400) k = a.shift(); }
      if (k >= 0) { for (; i < k; i++) dead.push(on[i]); plan.push(on[k]); i = k + 1; continue; }
      plan.push(ins.length); ins.push(h); }
    for (; i < old.length; i++) dead.push(on[i]);
    if (ins.length > list.length / 2) return full();
    var tmp = document.createElementNS(NS, 'g'); tmp.innerHTML = ins.join(''); var made = [].slice.call(tmp.children); if (made.length !== ins.length) return full();
    [].slice.call(g.children).forEach(function (n) { if (!n.__k) g.removeChild(n); }); dead.forEach(function (n) { g.removeChild(n); });
    var nodes = plan.map(function (q) { return typeof q === 'number' ? made[q] : q; }), next = null;
    for (j = nodes.length - 1; j >= 0; j--) { var n = nodes[j]; if (n.parentNode !== g) { n.__k = 1; g.insertBefore(n, next); }
      else { var m = /^<g class="([^"]*)"/.exec(list[j]); if (m && n.getAttribute('class') !== m[1]) n.setAttribute('class', m[1]); } next = n; }
    g.__ss = list; g.__sn = nodes;
  }
  function render() {
    if (!el) return; tileSync();"""

ORDER_OLD = """    function visit(i) { if (st[i]) return; st[i] = 1; for (var k = 0; k < idx.length; k++) { var j = idx[k]; if (j !== i && !st[j] && before(list[j], list[i])) visit(j); } out.push(list[i]); }
    idx.forEach(visit); return out;"""
ORDER_NEW = """    // only parts that share some of the screen can cover each other: bucket them along the screen and test those (same order, not n x n)
    var sig = list.length;   // the same boxes as last time (a tap, a selection): the same order
    list.forEach(function (q) { [q.x0, q.x1, q.y0, q.y1, q.z0, q.z1, q.h || 0, q.t === 'ln' ? 7 : 1, q.o && q.o.glass ? 3 : 1].forEach(function (v) { sig = (Math.imul(sig, 31) + Math.round(v * 1024)) | 0; }); });
    var big = list.length > 200; if (big && sig === order.sig && order.perm.length === list.length) return order.perm.map(function (i) { return list[i]; });   // (people and pets order their few parts too: only a scene is kept)
    var n = list.length, rank = new Int32Array(n), ivs = list.map(iv), lo = Infinity, hi = -Infinity, mark = new Int32Array(n), stamp = 0, B = [];
    idx.forEach(function (i, r) { rank[i] = r; lo = Math.min(lo, ivs[i][0]); hi = Math.max(hi, ivs[i][1]); });
    var W = Math.max(.25, (hi - lo) / 256); function bk(x) { return Math.max(0, Math.floor((x - lo) / W)); }
    idx.forEach(function (i) { for (var b = bk(ivs[i][0]), b1 = bk(ivs[i][1]); b <= b1; b++) (B[b] || (B[b] = [])).push(i); });
    function near(i) { var c = [], b, b1, m, L; stamp++; for (b = bk(ivs[i][0]), b1 = bk(ivs[i][1]); b <= b1; b++) if ((L = B[b])) for (m = 0; m < L.length; m++) if (mark[L[m]] !== stamp) { mark[L[m]] = stamp; c.push(L[m]); }
      return c.sort(function (a, b2) { return rank[a] - rank[b2]; }); }
    function visit(i) { if (st[i]) return; st[i] = 1; var c = near(i); for (var k = 0; k < c.length; k++) { var j = c[k]; if (j !== i && !st[j] && before(list[j], list[i])) visit(j); } out.push(i); }
    idx.forEach(visit); if (big) { order.sig = sig; order.perm = out; } return out.map(function (i) { return list[i]; });"""

EDITS = [
    ("function camera() { var g = el && el.querySelector('g.cam'); if (g) g.classList.toggle('far', V.cam.z < 1.05); if (g) g.setAttribute('transform', 'translate(' + V.cam.x.toFixed(1) + ',' + V.cam.y.toFixed(1) + ') scale(' + V.cam.z.toFixed(3) + ')'); }",
     CAMERA),
    ("+ '<g class=\"movers\">' + moversLayer(0) + '</g><g class=\"mobs\">' + mobsLayer() + '</g><g class=\"movers air\">' + moversLayer(1) + '</g>';",
     "; var lvg = liveCam(), lvh = '<g class=\"movers\">' + moversLayer(0) + '</g><g class=\"mobs\">' + mobsLayer() + '</g><g class=\"movers air\">' + moversLayer(1) + '</g>'; if (lvg) lvg.innerHTML = lvh; else svg.insertAdjacentHTML('beforeend', lvh);"),
    ("el.querySelector('.mn-dsp-scene').getBoundingClientRect()", "el.querySelector('.mn-dsp-scene').parentNode.getBoundingClientRect()"),
    ("var sc = bqScene(), b = sc && sc.getBoundingClientRect();", "var sc = bqScene(), b = sc && sc.parentNode.getBoundingClientRect();"),
    ("var s = el && el.querySelector('.mn-dsp-scene'); var r = s && s.getBoundingClientRect();", "var s = el && el.querySelector('.mn-dsp-scene'); var r = s && s.parentNode.getBoundingClientRect();"),
    ("if (f && scn) { var rs = scn.getBoundingClientRect(),", "if (f && scn) { var rs = scn.parentNode.getBoundingClientRect(),"),
    (ORDER_OLD, ORDER_NEW),
    ("g = el.querySelector('[data-mob=\"' + p.id + '\"]');", "g = liveQ('[data-mob=\"' + p.id + '\"]');"),
    ("g = el.querySelector('[data-mv=\"' + p.id + '\"]');", "g = liveQ('[data-mv=\"' + p.id + '\"]');"),
    ("  function mobTick(now) {", "  function liveQ(q) {   // people, pets and cars live on their own layer: look there, not through the whole island, every frame\n    var lv = el.__lv && el.__lv.isConnected ? el.__lv : (el.__lv = el.querySelector('svg.mn-dsp-live')); return (lv || el).querySelector(q);\n  }\n  function mobTick(now) {"),
    ("  function render() {\n    if (!el) return; tileSync();", SVGSET),
    (": drawBB(q)) + '</g>'; }).join('') + tags.join('');", ": drawBB(q)) + '</g>'; }).concat(tags); scene.parts = sl; return sl.join('');"),
    ("return order(all).map(function (q) { return '<g class=\"pc' + (q.pc === sel", "var sl = order(all).map(function (q) { return '<g class=\"pc' + (q.pc === sel"),
    ("svg.innerHTML = '<g class=\"gw\">' + ground() + landMarks() + '</g>' + hi + scene(V.d.pc.filter(function (p) { return BUILD[p.k] && !(K[p.k] && K[p.k].mob) && !moving(p) && shownHere(p); })) ;",
     "scene.parts = null; var scs = scene(V.d.pc.filter(function (p) { return BUILD[p.k] && !(K[p.k] && K[p.k].mob) && !moving(p) && shownHere(p); })); svgSet(svg, ['<g class=\"gw\">' + ground() + landMarks() + '</g>', hi].concat(scene.parts || [scs]));"),
    ("    exSnapShow(null);\n    if ((d.t === 'it' || d.t === 'new-it') && d.snap", "    if (d.t === 'pan') { el.querySelectorAll('.mn-dsp-scene .pc.hot').forEach(function (x) { x.classList.remove('hot'); }); return; }   // a pan changed nothing but the camera\n    exSnapShow(null);\n    if ((d.t === 'it' || d.t === 'new-it') && d.snap"),
]
CSS = ('html body .mn-dsp-stage > svg.mn-dsp-scene { transform-origin:0 0; will-change:transform; }\n'
       'html body .mn-dsp-stage > svg.mn-dsp-live { pointer-events:none; cursor:default; }\n'
       'html body .mn-dsp-stage > svg.mn-dsp-live .pc { pointer-events:auto; }\n')
CSS_AT = 'html body .mn-dsp-scene { position:absolute;inset:0;width:100%;height:100%;display:block;cursor:grab;touch-action:none; }\n'

import re
for f in FILES:
    p = ROOT / f
    s = p.read_text(encoding='utf-8')
    old = re.search(r"var CAMQ = null;.*?return g; }(\n  function camSlide[^\n]*\n[^\n]*)?", s, re.S)
    if old and old.group(0) != CAMERA: s = s.replace(old.group(0), EDITS[0][0])
    o2 = re.search(r"    // only parts that share some of the screen.*?idx.forEach\(visit\);[^\n]*", s, re.S)
    if o2 and o2.group(0) != ORDER_NEW: s = s.replace(o2.group(0), ORDER_OLD)
    for a, b in EDITS:
        if b in s: continue
        assert a in s, (f, a[:60])
        s = s.replace(a, b)
    if CSS not in s:
        assert s.count(CSS_AT) == 1, (f, 'css')
        s = s.replace(CSS_AT, CSS_AT + CSS)
    p.write_text(s, encoding='utf-8')
    print('patched', f)
