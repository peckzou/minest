/* Card 05 · Knowledge Graph — connection.
   Every concept, note, analysis and experiment of the object, and every typed relation between them, on a canvas:
   pan (drag the background), zoom (wheel / pinch / buttons), drag nodes (positions kept per object), tap a node for
   its links — each link says its type, who made it (you / Minest library / a suggestion) and where it came from
   (which framework node, analysis or experiment). Connect two nodes, retype, annotate or delete a link, add a concept,
   filter by relation type and by who made it, and pull in links from your other objects. */
(function () {
  'use strict';
  var TK = window.MinestToolkit, esc = TK.esc;
  var KC = { concept: '#6b4ce6', philosopher: '#f08c3a', theory: '#00a6a6', question: '#e8566c', case: '#c9a227', note: '#8c87a8', 'model-run': '#1f9d55', 'lab-run': '#ff8a3d', topic: '#9b5de5' };

  function nodeInfo(ref, ko) {
    var ks = TK.ks;
    if (ref.indexOf('cc:') === 0) { var c = ks.getConcept(ref.slice(3)); if (!c) return null; return { ref: ref, label: ks.label(c), kind: ko.root_concept === c.id ? 'topic' : c.kind, c: c }; }
    if (ref.indexOf('note:') === 0) { var p = ref.split(':'), k = ks.object(p[1]), n = k && k.notes.filter(function (x) { return x.id === p[2]; })[0]; return n ? { ref: ref, label: n.text, kind: 'note', n: n } : null; }
    if (ref.indexOf('mr:') === 0) { var m = ks.modelRun(ref.slice(3)); return m ? { ref: ref, label: m.title || m.model_id, kind: 'model-run', m: m } : null; }
    if (ref.indexOf('mi:') === 0) { var r = ks.labRun(ref.slice(3)), d = r && TK.M.get(r.interaction_id); return r ? { ref: ref, label: d ? d.title : r.interaction_id, kind: 'lab-run', r: r } : null; }
    return null;
  }
  function sourceText(r) {
    var s = r.source_ref || '', ks = TK.ks;
    if (s.indexOf('fwi:') === 0) { var p = s.split(':'), f = ks.framework(p[1]); if (!f) return 'A framework (since deleted)'; if (p[2] === 'seed') return 'Minest starter content in ‘' + f.title + '’'; var n = f.nodes.filter(function (x) { return x.id === p[2]; })[0]; return 'Framework ‘' + f.title + '’' + (n ? ' › node “' + n.label + '”' : '') + (p[3] === 'ref' ? ' (cross-reference)' : ''); }
    if (s.indexOf('mr:') === 0) { var m = ks.modelRun(s.slice(3)); return 'Thinking model: ' + (m ? m.title : 'analysis'); }
    if (s.indexOf('mi:') === 0) { var l = ks.labRun(s.slice(3)), d = l && TK.M.get(l.interaction_id); return 'Experiment: ' + (d ? d.title : 'run'); }
    if (s.indexOf('note:') === 0) return 'A note';
    if (s === 'graph') return 'Made in the Graph';
    if (s.indexOf('wiki:') === 0) return 'Wikipedia ‘' + s.split(':').slice(2).join(':') + '’';
    return s || 'Made in the Graph';
  }

  TK.register({
    id: 'graph', en: 'Knowledge Graph', zh: '知识图谱卡', color: '#00a6a6', line: 'See and edit how everything connects.',
    icon: TK.icon('<circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="7" r="2.5"/><circle cx="12" cy="18" r="2.5"/><path d="M8.3 7 15.6 7M7.2 8.2l3.6 7.6M16.9 9.3l-3.7 6.6"/>'),
    preview: function (ko) {
      var rels = TK.ks.relations({ ko: ko.id }), n = {}; rels.forEach(function (r) { n[r.from] = 1; n[r.to] = 1; }); ko.concept_ids.forEach(function (c) { n['cc:' + c] = 1; });
      var by = {}; rels.forEach(function (r) { by[r.type] = (by[r.type] || 0) + 1; });
      return '<span class="pv-graph"><b>' + Object.keys(n).length + '</b> nodes · <b>' + rels.length + '</b> links</span><span class="pv-list">' + Object.keys(by).slice(0, 4).map(function (t) { return '<i style="color:' + TK.ks.RELBY[t].color + '">' + esc(TK.ks.RELBY[t].label.replace(' (my judgment)', '')) + ' ' + by[t] + '</i>'; }).join('') + '</span>';
    },
    mount: function (el, ko, opts) {
      var ks = TK.ks, view = { x: 0, y: 0, k: 1 }, nodes = [], edges = [], byRef = {}, selN = null, selE = null, connectFrom = null, sim = 0;
      var filt = { types: {}, prov: 'all', others: false };
      ks.REL.forEach(function (r) { filt.types[r.id] = true; });
      el.innerHTML = '<div class="gr-wrap"><div class="gr-canvas"><svg class="gr-svg" role="img" aria-label="Knowledge graph"><defs>' +
        ks.REL.map(function (r) { return '<marker id="ga-' + r.id + '" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="' + r.color + '"/></marker>'; }).join('') +
        '</defs><g class="gr-world"><g class="gr-edges"></g><g class="gr-nodes"></g></g></svg>' +
        '<div class="gr-tools"><button type="button" data-z="1.25" aria-label="Zoom in">＋</button><button type="button" data-z="0.8" aria-label="Zoom out">－</button><button type="button" data-fit>Fit</button><button type="button" data-addc>+ Concept</button><button type="button" data-relayout>Re-arrange</button></div>' +
        '<button type="button" class="gr-holo" data-holo title="See this concept’s Wikipedia article as a bubble map in Holo Lab’s Knowledge Constellation"><i aria-hidden="true"></i><span>Holo map</span></button>' +
        '<div class="gr-hint"></div></div><aside class="gr-side"></aside></div>';
      var svg = el.querySelector('.gr-svg'), world = el.querySelector('.gr-world'), side = el.querySelector('.gr-side'), hint = el.querySelector('.gr-hint');

      // ---------------------------------------------------------------- data → nodes / edges
      function build() {
        var k = ks.object(ko.id), pos = k.graph_pos || {}, rels = ks.relations({ ko: ko.id }), refs = {};
        k.concept_ids.forEach(function (c) { refs['cc:' + c] = 1; });
        rels.forEach(function (r) { refs[r.from] = 1; refs[r.to] = 1; });
        if (filt.others) { Object.keys(refs).filter(function (x) { return x.indexOf('cc:') === 0; }).forEach(function (x) { ks.relations({ node: x }).forEach(function (r) { if (r.ko !== ko.id && (r.from.indexOf('cc:') === 0 && r.to.indexOf('cc:') === 0)) { rels.push(r); refs[r.from] = 1; refs[r.to] = 1; } }); }); }
        var old = byRef; byRef = {}; nodes = [];
        Object.keys(refs).forEach(function (ref, i) {
          var inf = nodeInfo(ref, k); if (!inf) return;
          var o = old[ref], p = pos[ref];
          inf.x = o ? o.x : p ? p[0] : Math.cos(i * 2.4) * (80 + i * 9); inf.y = o ? o.y : p ? p[1] : Math.sin(i * 2.4) * (80 + i * 9);
          inf.vx = 0; inf.vy = 0; inf.pinned = !!(o ? o.pinned : p); inf.external = !k.concept_ids.some(function (c) { return 'cc:' + c === ref; }) && ref.indexOf('cc:') === 0 && !ks.relations({ ko: ko.id }).some(function (r) { return r.from === ref || r.to === ref; });
          if (inf.kind === 'topic' && !p && !o) { inf.x = 0; inf.y = 0; }
          nodes.push(inf); byRef[ref] = inf;
        });
        edges = rels.filter(function (r) { return byRef[r.from] && byRef[r.to] && filt.types[r.type] && (filt.prov === 'all' || (filt.prov === 'user' ? r.provenance === 'user' : r.provenance !== 'user')); });
      }
      // ---------------------------------------------------------------- a small force layout (no library)
      function tick(alpha) {
        var i, j, a, b, dx, dy, d2, f;
        for (i = 0; i < nodes.length; i++) for (j = i + 1; j < nodes.length; j++) {
          a = nodes[i]; b = nodes[j]; dx = b.x - a.x; dy = b.y - a.y; d2 = dx * dx + dy * dy + 0.01; f = 9000 / d2 * alpha;
          var d = Math.sqrt(d2); dx /= d; dy /= d; a.vx -= dx * f; a.vy -= dy * f; b.vx += dx * f; b.vy += dy * f;
        }
        edges.forEach(function (e) { a = byRef[e.from]; b = byRef[e.to]; dx = b.x - a.x; dy = b.y - a.y; var d = Math.sqrt(dx * dx + dy * dy) || 1, k = (d - 150) * 0.035 * alpha; dx /= d; dy /= d; a.vx += dx * k; a.vy += dy * k; b.vx -= dx * k; b.vy -= dy * k; });
        nodes.forEach(function (n) { n.vx -= n.x * 0.006 * alpha; n.vy -= n.y * 0.006 * alpha; if (n.kind === 'topic' || n.pinned || n === dragN) { n.vx = n.vy = 0; return; } n.x += Math.max(-20, Math.min(20, n.vx)); n.y += Math.max(-20, Math.min(20, n.vy)); n.vx *= 0.55; n.vy *= 0.55; });
      }
      function frame(cb) { var my = sim, done = false, go = function () { if (done || my !== sim) return; done = true; cb(); }; requestAnimationFrame(go); setTimeout(go, 34); }
      function run(steps) { sim++; var n = 0; (function go() { tick(Math.max(0.15, 1 - n / steps)); draw(); if (++n < steps) frame(go); else savePos(); })(); }
      function savePos() { var p = {}; nodes.forEach(function (n) { p[n.ref] = [Math.round(n.x), Math.round(n.y)]; }); TK.silently(function () { ks.updateObject(ko.id, { graph_pos: p }); }); }

      // ---------------------------------------------------------------- drawing
      function draw() {
        world.setAttribute('transform', 'translate(' + view.x + ' ' + view.y + ') scale(' + view.k + ')');
        var pairs = {};
        el.querySelector('.gr-edges').innerHTML = edges.map(function (e) {
          var a = byRef[e.from], b = byRef[e.to], R = ks.RELBY[e.type], key = [e.from, e.to].sort().join('|'), nth = pairs[key] = (pairs[key] || 0) + 1;
          var dx = b.x - a.x, dy = b.y - a.y, d = Math.sqrt(dx * dx + dy * dy) || 1, ux = dx / d, uy = dy / d, ra = rad(a), rb = rad(b) + 4;
          var x1 = a.x + ux * ra, y1 = a.y + uy * ra, x2 = b.x - ux * rb, y2 = b.y - uy * rb, bend = (nth - 1) * 26, mx = (x1 + x2) / 2 - uy * bend, my = (y1 + y2) / 2 + ux * bend;
          return '<g class="gr-e' + (selE === e.id ? ' sel' : '') + (selN && (e.from === selN || e.to === selN) ? ' hi' : '') + '" data-e="' + e.id + '"><path class="gr-hit" d="M' + x1 + ' ' + y1 + ' Q' + mx + ' ' + my + ' ' + x2 + ' ' + y2 + '"/><path class="gr-line t-' + e.type + (e.provenance !== 'user' ? ' sug' : '') + '" stroke="' + R.color + '" d="M' + x1 + ' ' + y1 + ' Q' + mx + ' ' + my + ' ' + x2 + ' ' + y2 + '"' + (R.sym ? '' : ' marker-end="url(#ga-' + e.type + ')"') + '/>' +
            (selE === e.id || (selN && (e.from === selN || e.to === selN)) ? '<text class="gr-el" x="' + mx + '" y="' + (my - 4) + '" fill="' + R.color + '">' + esc(R.label) + '</text>' : '') + '</g>';
        }).join('');
        el.querySelector('.gr-nodes').innerHTML = nodes.map(function (n) {
          var r = rad(n), lab = n.label.length > 28 ? n.label.slice(0, 27) + '…' : n.label;
          return '<g class="gr-n k-' + n.kind + (selN === n.ref ? ' sel' : '') + (connectFrom === n.ref ? ' from' : '') + (n.external ? ' ext' : '') + '" data-n="' + esc(n.ref) + '" transform="translate(' + n.x + ' ' + n.y + ')"><circle r="' + r + '" fill="' + (KC[n.kind] || KC.concept) + '"/>' + (n.kind === 'note' ? '<text class="gr-ic" y="4">✎</text>' : n.kind === 'model-run' ? '<text class="gr-ic" y="4">≡</text>' : n.kind === 'lab-run' ? '<text class="gr-ic" y="4">⚗</text>' : '') + '<text class="gr-nl" y="' + (r + 14) + '">' + esc(lab) + '</text></g>';
        }).join('');
      }
      function rad(n) { return n.kind === 'topic' ? 22 : n.kind === 'concept' || n.kind === 'philosopher' || n.kind === 'theory' ? 13 : 10; }

      // ---------------------------------------------------------------- side panel
      function panel() {
        var h = '', show = '<section class="gr-sec"><h3>Show</h3><div class="gr-filt">' + ks.REL.map(function (r) { return '<label style="--c:' + r.color + '"><input type="checkbox" data-ft="' + r.id + '"' + (filt.types[r.id] ? ' checked' : '') + '><i></i>' + esc(r.label) + '</label>'; }).join('') + '</div>' +
          '<label class="gr-sel">Made by<select data-fp><option value="all">Everyone</option><option value="user"' + (filt.prov === 'user' ? ' selected' : '') + '>Only me</option><option value="other"' + (filt.prov === 'other' ? ' selected' : '') + '>Minest library & suggestions</option></select></label>' +
          '<label class="kl-chk"><input type="checkbox" data-fo' + (filt.others ? ' checked' : '') + '> Include links from my other objects</label>' +
          '<div class="gr-legend">' + Object.keys(KC).map(function (k) { return '<span><i style="background:' + KC[k] + '"></i>' + esc(k === 'topic' ? 'Topic' : ks.KINDS[k] || k) + '</span>'; }).join('') + '<span><i class="dash"></i>Suggested / library (dashed)</span></div></section>';   // filters go below the selection
        if (selE) {
          var e = ks.relations().filter(function (x) { return x.id === selE; })[0];
          if (e) h += '<section class="gr-sec"><h3>Link</h3><p><b>' + esc(lab(e.from)) + '</b> <span style="color:' + ks.RELBY[e.type].color + '">' + esc(ks.RELBY[e.type].label) + '</span> <b>' + esc(lab(e.to)) + '</b></p>' +
            '<p class="dim">Kind: ' + esc(ks.CONTENT[ks.contentKind(e)] || '—') + ' · made by: ' + esc(ks.PROV[e.provenance] || e.provenance) + (e.review === 'pending' ? ' · review pending' : '') + '<br>Source: ' + esc(sourceText(e)) + '</p>' +
            '<label>Type<select data-etype>' + ks.REL.map(function (r) { return '<option value="' + r.id + '"' + (r.id === e.type ? ' selected' : '') + '>' + esc(r.label) + '</option>'; }).join('') + '</select></label>' +
            '<label>Note<textarea data-enote rows="2">' + esc(e.note || '') + '</textarea></label><div class="row"><button type="button" data-esave class="primary">Save link</button><button type="button" data-eflip>Reverse</button><button type="button" data-edel class="ghost">Delete</button></div></section>';
        } else if (selN && byRef[selN]) {
          var n = byRef[selN], rels = edges.filter(function (x) { return x.from === selN || x.to === selN; });
          h += '<section class="gr-sec"><h3>' + esc(n.label) + '</h3><p class="dim">' + esc(n.kind === 'topic' ? 'Topic of this object' : ks.KINDS[n.kind] || n.kind) + (n.c ? ' · added by ' + esc(ks.PROV[n.c.provenance] || n.c.provenance) + (n.c.review === 'pending' ? ' · review pending' : '') : '') + '</p>' +
            (n.c ? '<label>Name<input data-rename value="' + esc(n.c.labels.en || n.c.labels.zh) + '"></label>' + (n.c.labels.zh && n.c.labels.en ? '<p class="dim">中文：' + esc(n.c.labels.zh) + '</p>' : '') : '') +
            (n.n ? '<p><span class="ck ck-' + esc(n.n.content_kind || 'view') + '">' + esc(ks.CONTENT[n.n.content_kind || 'view']) + '</span></p><p>' + esc(n.n.text) + '</p>' + (n.n.source ? '<p class="dim">Source: ' + esc(n.n.source) + '</p>' : '') : '') + (n.c ? '<p><span class="ck ck-' + esc(ks.contentKind(n.c)) + '">' + esc(ks.CONTENT[ks.contentKind(n.c)] || '') + '</span></p>' : '') + (n.m ? '<p>' + esc((n.m.result && n.m.result.steps_done) + ' of ' + (n.m.result && n.m.result.steps_total) + ' steps') + '</p>' : '') +
            '<h4>Links (' + rels.length + ')</h4><ul class="gr-rels">' + rels.map(function (r) { var out = r.from === selN, R = ks.RELBY[r.type]; return '<li><button type="button" data-pick="' + r.id + '"><span style="color:' + R.color + '">' + esc(out ? R.label : R.inverse) + '</span> ' + esc(lab(out ? r.to : r.from)) + '<small>' + esc(ks.PROV[r.provenance] || '') + ' · ' + esc(sourceText(r)) + '</small></button></li>'; }).join('') + '</ul>' +
            '<div class="row"><button type="button" class="primary" data-connect>Connect to…</button><button type="button" data-focus>Center</button>' + (n.c ? '<button type="button" data-expand>Expand</button><button type="button" data-tofw>In Framework</button>' : '') + '</div>' +
            (n.c && n.kind !== 'topic' ? '<button type="button" class="ghost small" data-removec>Remove from this object</button>' : '') + '</section>';
        } else {
          h += '<section class="gr-sec"><h3>How to use</h3><p class="dim">Tap a node to see and edit its links. Drag nodes to arrange; drag the background to pan; pinch or wheel to zoom. “Connect to…” makes a new link of the type you choose.</p></section>';
        }
        h += show + '<section class="gr-sec"><button type="button" data-export>Export this object (JSON)</button></section>';
        side.innerHTML = h;
      }
      function lab(ref) { var n = byRef[ref] || nodeInfo(ref, ks.object(ko.id)); return n ? n.label : ref; }

      // ---------------------------------------------------------------- pointer: pan, zoom, drag nodes, pinch
      var pts = {}, dragN = null, pan = null, pinch = null, moved = 0;
      function svgPt(e) { var b = svg.getBoundingClientRect(); return { x: (e.clientX - b.left - view.x) / view.k, y: (e.clientY - b.top - view.y) / view.k }; }
      svg.addEventListener('pointerdown', function (e) {
        pts[e.pointerId] = { x: e.clientX, y: e.clientY }; try { svg.setPointerCapture(e.pointerId); } catch (x) {} moved = 0;
        var ids = Object.keys(pts);
        if (ids.length === 2) { var a = pts[ids[0]], b = pts[ids[1]]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), k: view.k, x: view.x, y: view.y, cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2 }; dragN = null; pan = null; return; }
        var g = e.target.closest('[data-n]');
        if (g) { dragN = byRef[g.getAttribute('data-n')]; var p = svgPt(e); dragN.ox = p.x - dragN.x; dragN.oy = p.y - dragN.y; }
        else pan = { x: e.clientX, y: e.clientY, vx: view.x, vy: view.y, target: e.target };   // pointer capture retargets pointerup, so remember what was pressed
      });
      svg.addEventListener('pointermove', function (e) {
        if (!pts[e.pointerId]) return; pts[e.pointerId] = { x: e.clientX, y: e.clientY };
        var ids = Object.keys(pts);
        if (pinch && ids.length === 2) { var a = pts[ids[0]], b = pts[ids[1]], d = Math.hypot(a.x - b.x, a.y - b.y), k = Math.max(0.3, Math.min(3, pinch.k * d / pinch.d)), bb = svg.getBoundingClientRect(), cx = pinch.cx - bb.left, cy = pinch.cy - bb.top; view.k = k; view.x = cx - (cx - pinch.x) * k / pinch.k; view.y = cy - (cy - pinch.y) * k / pinch.k; draw(); return; }
        moved += Math.abs(e.movementX || 0) + Math.abs(e.movementY || 0);
        if (dragN) { var p = svgPt(e); dragN.x = p.x - dragN.ox; dragN.y = p.y - dragN.oy; if (moved > 3) dragN.pinned = true; draw(); }
        else if (pan) { view.x = pan.vx + e.clientX - pan.x; view.y = pan.vy + e.clientY - pan.y; draw(); }
      });
      function up(e) {
        delete pts[e.pointerId]; if (Object.keys(pts).length < 2) pinch = null;
        if (dragN) { var n = dragN; dragN = null; if (moved <= 3) clickNode(n.ref); else savePos(); return; }
        if (pan) { var pan0 = pan; pan = null; if (moved <= 3) { var eg = pan0.target && pan0.target.closest && pan0.target.closest('[data-e]'); if (eg) { selE = eg.getAttribute('data-e'); selN = null; } else { selN = null; selE = null; connectFrom = null; hint.textContent = ''; } draw(); panel(); } }
      }
      svg.addEventListener('pointerup', up); svg.addEventListener('pointercancel', up);
      svg.addEventListener('wheel', function (e) { e.preventDefault(); zoom(e.deltaY < 0 ? 1.12 : 0.89, e.clientX, e.clientY); }, { passive: false });
      function zoom(f, cx, cy) { var b = svg.getBoundingClientRect(); cx = cx == null ? b.left + b.width / 2 : cx; cy = cy == null ? b.top + b.height / 2 : cy; var k = Math.max(0.3, Math.min(3, view.k * f)), x = cx - b.left, y = cy - b.top; view.x = x - (x - view.x) * k / view.k; view.y = y - (y - view.y) * k / view.k; view.k = k; draw(); }
      function fit() {
        if (!nodes.length) return; var b = svg.getBoundingClientRect(), xs = nodes.map(function (n) { return n.x; }), ys = nodes.map(function (n) { return n.y; });
        var x0 = Math.min.apply(0, xs) - 60, x1 = Math.max.apply(0, xs) + 60, y0 = Math.min.apply(0, ys) - 40, y1 = Math.max.apply(0, ys) + 50;
        view.k = Math.max(0.3, Math.min(1.6, Math.min(b.width / (x1 - x0), b.height / (y1 - y0)))); view.x = b.width / 2 - (x0 + x1) / 2 * view.k; view.y = b.height / 2 - (y0 + y1) / 2 * view.k; draw();
      }
      function center(ref) { var n = byRef[ref], b = svg.getBoundingClientRect(); if (!n) return; view.x = b.width / 2 - n.x * view.k; view.y = b.height / 2 - n.y * view.k; draw(); }

      function clickNode(ref) {
        if (connectFrom && connectFrom !== ref) return connectPick(connectFrom, ref);
        selN = ref; selE = null; draw(); panel();
      }
      function connectPick(a, b) {
        var pop = document.createElement('div'); pop.className = 'gr-pop';
        pop.innerHTML = '<h4>New link</h4><p><b>' + esc(lab(a)) + '</b> → <b>' + esc(lab(b)) + '</b></p><label>Type<select>' + ks.REL.map(function (r) { return '<option value="' + r.id + '">' + esc(r.label) + '</option>'; }).join('') + '</select></label><label>Note (optional)<input maxlength="200"></label><div class="row"><button type="button" class="primary" data-ok>Create link</button><button type="button" data-x>Cancel</button></div>';
        el.querySelector('.gr-canvas').appendChild(pop);
        pop.onclick = function (e) {
          var t = e.target.closest('button'); if (!t) return;
          if (t.hasAttribute('data-ok')) { var r; TK.silently(function () { r = ks.relate(a, b, pop.querySelector('select').value, { ko: ko.id, provenance: 'user', source_ref: 'graph', note: pop.querySelector('input').value.trim() }); }); selE = r && r.id; selN = null; TK.toast('Link created'); }
          connectFrom = null; hint.textContent = ''; pop.remove(); refresh();
        };
      }

      side.addEventListener('change', function (e) {
        var t = e.target;
        if (t.matches('[data-ft]')) { filt.types[t.getAttribute('data-ft')] = t.checked; refresh(); }
        else if (t.matches('[data-fp]')) { filt.prov = t.value; refresh(); }
        else if (t.matches('[data-fo]')) { filt.others = t.checked; refresh(true); }
        else if (t.matches('[data-rename]')) { var n = byRef[selN], v = t.value.trim(); if (n && n.c && v) { var lb = n.c.labels; if (/[㐀-鿿]/.test(v) && !lb.en) lb.zh = v; else lb.en = v; TK.silently(function () { ks.updateConcept(n.c.id, { labels: lb }); }); renameInFrameworks(n.c.id, v); refresh(); TK.toast('Renamed everywhere'); } }
      });
      function renameInFrameworks(cid, v) { TK.silently(function () { ks.frameworksOf(ko.id).forEach(function (f) { var ch = false; f.nodes.forEach(function (x) { if (x.concept_id === cid) { x.label = v; ch = true; } }); if (ch) ks.saveFramework(f); }); }); }
      el.addEventListener('click', function (e) {
        var b = e.target.closest('button'); if (!b) return;
        if (b.hasAttribute('data-z')) return zoom(+b.getAttribute('data-z'));
        if (b.hasAttribute('data-fit')) return fit();
        if (b.hasAttribute('data-relayout')) { nodes.forEach(function (n) { n.pinned = false; }); return run(220); }
        if (b.hasAttribute('data-addc')) return addConcept();
        if (b.hasAttribute('data-holo')) return holoMap();
        if (b.hasAttribute('data-export')) return document.getElementById('tk-export').click();
        if (b.hasAttribute('data-pick')) { selE = b.getAttribute('data-pick'); selN = null; draw(); return panel(); }
        if (b.hasAttribute('data-connect')) { connectFrom = selN; hint.textContent = 'Tap the node to connect “' + lab(selN) + '” to — or tap the background to cancel'; return draw(); }
        if (b.hasAttribute('data-focus')) return center(selN);
        if (b.hasAttribute('data-expand')) { filt.others = true; refresh(true); return center(selN); }
        if (b.hasAttribute('data-tofw')) return TK.open('framework', { objectId: ko.id, concept: selN.slice(3) });
        if (b.hasAttribute('data-removec')) { var cid = selN.slice(3); if (!confirm('Remove “' + lab(selN) + '” and its links from this object? (It stays in other objects and frameworks that use it.)')) return; TK.silently(function () { ks.relations({ ko: ko.id, node: selN }).forEach(function (r) { ks.unrelate(r.id); }); var k = ks.object(ko.id); ks.updateObject(ko.id, { concept_ids: k.concept_ids.filter(function (x) { return x !== cid; }) }); }); selN = null; return refresh(); }
        var ed = selE && ks.relations().filter(function (x) { return x.id === selE; })[0]; if (!ed) return;
        if (b.hasAttribute('data-esave')) { TK.silently(function () { ks.updateRelation(ed.id, { type: side.querySelector('[data-etype]').value, note: side.querySelector('[data-enote]').value.trim(), provenance: 'user' }); }); TK.toast('Link saved'); return refresh(); }
        if (b.hasAttribute('data-eflip')) { TK.silently(function () { ks.updateRelation(ed.id, { from: ed.to, to: ed.from, provenance: 'user' }); }); return refresh(); }
        if (b.hasAttribute('data-edel')) { if (ed.source_ref && ed.source_ref.indexOf('fwi:') === 0 && !confirm('This link comes from a framework. Delete it here anyway? (The framework node stays.)')) return; TK.silently(function () { ks.unrelate(ed.id); }); selE = null; return refresh(); }
      });
      // ◉ the concept in the user's own words' language (a Chinese thought → Chinese Wikipedia)
      function holoMap() {
        var k = ks.object(ko.id), c = k.root_concept && ks.getConcept(k.root_concept), zh = /[㐀-鿿]/.test(k.title || '');
        var topic = c ? (zh ? c.labels.zh || c.labels.en : c.labels.en || c.labels.zh) : k.title;
        TK.holoWiki(topic || k.title, /[㐀-鿿]/.test(topic || '') ? 'zh' : 'en');
      }
      function addConcept() {
        var v = prompt('New concept name'); if (!v || !v.trim()) return;
        var c; TK.silently(function () { c = ks.concept(v.trim(), { kind: 'concept', provenance: 'user' }); ks.addToObject(ko.id, c); });
        refresh(); selN = 'cc:' + c; var n = byRef[selN]; if (n) { n.x = (svg.getBoundingClientRect().width / 2 - view.x) / view.k + 60; n.y = (svg.getBoundingClientRect().height / 2 - view.y) / view.k; }
        draw(); panel(); TK.toast('Added — now “Connect to…” to link it');
      }
      function refresh(relayout) { ko = TK.ko || ko; var had = nodes.length; build(); if (relayout || nodes.length !== had) run(160); else draw(); panel(); }

      build(); panel();
      requestAnimationFrame(function () {
        var b = svg.getBoundingClientRect(); view.x = b.width / 2; view.y = b.height / 2;
        var k = ks.object(ko.id); if (k.graph_pos && Object.keys(k.graph_pos).length) { draw(); fit(); } else { run(260); setTimeout(fit, 260 * 17); }
        if (opts && opts.concept) { selN = 'cc:' + opts.concept; opts.concept = null; draw(); panel(); setTimeout(function () { center(selN); }, 300); }
      });
      return { refresh: function () { refresh(); }, destroy: function () { sim++; } };
    }
  });
})();
