/* Card 01 · Thought Compass — direction.
   A mechanical compass of three rings around the question: outer = knowledge domains, middle = thinking angles,
   inner = the object's concepts. Drag a ring (inertia, then it settles on a tick) or tap a segment; whatever sits
   under the pointer at the top is selected and the panel shows what you can do with it. Placement: the engine's
   suggestion is shown as a suggestion; the user confirms or changes it (several places allowed). */
(function () {
  'use strict';
  var TK = window.MinestToolkit, esc = TK.esc;
  var COLS = ['philosophy', 'knowledge', 'nature', 'psychology', 'society', 'systems', 'life'];
  var HUE = { philosophy: '#9b5de5', knowledge: '#5e9cff', nature: '#30b45a', psychology: '#f08c3a', society: '#00a6a6', systems: '#e8566c', life: '#c9a227' };
  var R = { outer: [148, 192], middle: [102, 144], inner: [60, 98] };
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  function arc(r0, r1, a0, a1) {
    var p = function (a, r) { return [Math.sin(a) * r, -Math.cos(a) * r]; }, A = p(a0, r1), B = p(a1, r1), Cc = p(a1, r0), D = p(a0, r0), lg = a1 - a0 > Math.PI ? 1 : 0;
    return 'M' + A + ' A' + r1 + ' ' + r1 + ' 0 ' + lg + ' 1 ' + B + ' L' + Cc + ' A' + r0 + ' ' + r0 + ' 0 ' + lg + ' 0 ' + D + ' Z';
  }
  function short(s, n) { s = String(s); return s.length > n ? s.slice(0, n - 1) + '…' : s; }

  TK.card({
    id: 'compass', en: 'Thought Compass', zh: '思想罗盘', color: '#9b5de5', line: 'Find where a thought sits and which way to think next.',
    icon: TK.icon('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2"/><path d="M13.6 10.4 9.5 14.5l1-3.4 3.1-0.7z" fill="currentColor"/>'),
    preview: function (ko) {
      var pl = TK.placement(ko);
      if (!pl.primary) return '<span class="dim">Not placed yet — place it yourself</span>';
      var top = TK.C.path(pl.primary)[0];
      return '<span class="pv-compass"><i style="--h:' + HUE[top] + '"></i>' + esc(TK.C.pathNames(pl.primary).join(' › ')) + '</span>' +
        (pl.related.length ? '<span class="dim">also ' + esc(pl.related.map(function (r) { return TK.C.pathNames(r).slice(-1)[0]; }).join(', ')) + '</span>' : '') +
        '<span class="pill ' + (pl.confirmed ? 'ok' : 'sug') + '">' + (pl.confirmed ? 'Confirmed' : 'Suggested') + '</span>';
    },
    mount: function (el, ko) {
      var C = TK.C, ks = TK.ks, ang = TK.data.angles;
      var st = { rings: { outer: 0, middle: 0, inner: 0 }, sel: { outer: 0, middle: 0, inner: 0 }, focus: 'outer' };
      function inner() {
        // the ring holds up to 8: the topic, then what you added, then concepts, theories, thinkers (questions and cases stay in the list below)
        var rank = { concept: 1, theory: 2, philosopher: 3 }, k = ks.object(ko.id);
        var cs = ks.conceptsOf(ko.id).filter(function (c) { return c.id === k.root_concept || rank[c.kind]; })
          .sort(function (a, b) { return (a.id === k.root_concept ? -9 : 0) - (b.id === k.root_concept ? -9 : 0) || ((a.provenance === 'user' ? 0 : 1) - (b.provenance === 'user' ? 0 : 1)) || ((rank[a.kind] || 5) - (rank[b.kind] || 5)) || b.created_at - a.created_at; }).slice(0, 8);
        return cs.length ? cs.map(function (c) { return { id: c.id, label: ks.label(c), kind: c.kind }; }) : [{ id: null, label: 'No concepts yet', kind: 'empty' }];
      }
      var items = { outer: COLS.map(function (c) { return { id: c, label: C.node(c).en }; }), middle: ang.map(function (a) { return { id: a.id, label: a.label }; }), inner: inner() };
      var pl = TK.placement(ko);
      if (pl.primary) st.sel.outer = Math.max(0, COLS.indexOf(C.path(pl.primary)[0]));
      if (ko.root_concept) st.sel.inner = Math.max(0, items.inner.map(function (x) { return x.id; }).indexOf(ko.root_concept));
      ['outer', 'middle', 'inner'].forEach(function (r) { st.rings[r] = target(r, st.sel[r]); });

      el.innerHTML = '<div class="cp-wrap"><div class="cp-instrument"><div class="cp-bezel"></div><svg class="cp-svg" viewBox="-200 -200 400 400" role="application" aria-label="Thought Compass. Drag a ring or use the arrow keys."></svg>' +
        '<div class="cp-pointer" aria-hidden="true"></div><div class="cp-help">Drag a ring · tap a segment · ← → turns the active ring</div></div><aside class="cp-panel"></aside></div>';
      var svg = el.querySelector('.cp-svg'), panel = el.querySelector('.cp-panel'), inst = el.querySelector('.cp-instrument');

      function seg(r) { return 360 / items[r].length; }
      function target(r, i) { return -(i + 0.5) * (360 / items[r].length); }
      function draw() {
        var s = '<defs><radialGradient id="cpGlass" cx="40%" cy="30%" r="80%"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".6" stop-color="#fff" stop-opacity=".06"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>';
        s += '<circle r="198" class="cp-rim"/>';
        for (var t = 0; t < 120; t++) { var a = t * 3 * Math.PI / 180, l = t % 10 === 0 ? 8 : 4; s += '<line class="cp-tick" x1="' + Math.sin(a) * 196 + '" y1="' + -Math.cos(a) * 196 + '" x2="' + Math.sin(a) * (196 - l) + '" y2="' + -Math.cos(a) * (196 - l) + '"/>'; }
        ['outer', 'middle', 'inner'].forEach(function (r) {
          var n = items[r].length, sg = 2 * Math.PI / n, rr = R[r], mid = (rr[0] + rr[1]) / 2;
          s += '<g class="cp-ring cp-' + r + (st.focus === r ? ' focus' : '') + '" data-ring="' + r + '" style="transform:rotate(' + st.rings[r] + 'deg)">';
          items[r].forEach(function (it, i) {
            var a0 = i * sg, a1 = a0 + sg, on = i === st.sel[r], hue = r === 'outer' ? HUE[it.id] : r === 'middle' ? '#6b4ce6' : '#2f8f83';
            var isPlace = r === 'outer' && pl.primary && C.path(pl.primary)[0] === it.id, isRel = r === 'outer' && pl.related.some(function (x) { return C.path(x)[0] === it.id; });
            s += '<path class="cp-seg' + (on ? ' on' : '') + (isPlace ? ' place' : '') + (isRel ? ' rel' : '') + '" data-ring="' + r + '" data-i="' + i + '" style="--h:' + hue + '" d="' + arc(rr[0], rr[1], a0 + 0.012, a1 - 0.012) + '"/>';
            var am = a0 + sg / 2, x = Math.sin(am) * mid, y = -Math.cos(am) * mid, deg = am * 180 / Math.PI;   // upright when the segment sits under the pointer
            var maxc = Math.max(6, Math.floor(sg * mid / (r === 'inner' ? 5.6 : 6.2)));
            s += '<text class="cp-lab' + (on ? ' on' : '') + '" transform="translate(' + x + ' ' + y + ') rotate(' + deg + ')">' + esc(short(it.label, maxc)) + '</text>';
          });
          s += '</g>';
        });
        s += '<circle r="56" class="cp-core"/><circle r="56" fill="url(#cpGlass)"/>';
        s += '<foreignObject x="-48" y="-40" width="96" height="80"><div xmlns="http://www.w3.org/1999/xhtml" class="cp-q">' + esc(short(ko.title, 70)) + '</div></foreignObject>';
        svg.innerHTML = s;
      }

      // ---------------------------------------------------------------- physics: drag, inertia, settle on a tick
      var drag = null, raf = 0;   // raf = animation token: a new animation cancels the old one
      function frame(cb) { var my = raf, done = false, go = function () { if (done || my !== raf) return; done = true; cb(performance.now()); }; requestAnimationFrame(go); setTimeout(go, 34); }
      function angleAt(e) { var b = svg.getBoundingClientRect(); return Math.atan2(e.clientX - (b.left + b.width / 2), -(e.clientY - (b.top + b.height / 2))) * 180 / Math.PI; }
      function setRot(r, v) { st.rings[r] = v; var g = svg.querySelector('.cp-ring[data-ring=' + r + ']'); if (g) g.style.transform = 'rotate(' + v + 'deg)'; }
      function nearest(r) { var sg = seg(r), v = st.rings[r]; var i = Math.round((-v / sg) - 0.5); var n = items[r].length; return { i: ((i % n) + n) % n, v: -(i + 0.5) * sg }; }
      function animateTo(r, to, done) {
        raf++; var from = st.rings[r], t0 = performance.now(), D = reduce ? 1 : 420;
        (function step(t) { var k = Math.min(1, (t - t0) / D), e = 1 - Math.pow(1 - k, 3); setRot(r, from + (to - from) * e); if (k < 1) frame(step); else if (done) done(); })(t0);
      }
      function settle(r, vel) {
        var t0 = performance.now(), last = t0;
        raf++;
        (function coast(t) {
          var dt = Math.min(40, t - last); last = t; vel *= Math.pow(0.0025, dt / 1000);
          if (!reduce && Math.abs(vel) > 0.02) { setRot(r, st.rings[r] + vel * dt); frame(coast); return; }
          var n = nearest(r); animateTo(r, n.v, function () { select(r, n.i); });
        })(t0);
      }
      svg.addEventListener('pointerdown', function (e) {
        var g = e.target.closest('[data-ring]'); if (!g) return;
        var r = g.getAttribute('data-ring'); st.focus = r;
        drag = { r: r, a: angleAt(e), start: st.rings[r], moved: 0, t: performance.now(), v: 0, seg: e.target.getAttribute('data-i') };
        try { svg.setPointerCapture(e.pointerId); } catch (x) {} raf++;
        $$('.cp-ring', svg).forEach(function (x) { x.classList.toggle('focus', x.getAttribute('data-ring') === r); });
      });
      svg.addEventListener('pointermove', function (e) {
        if (!drag) return; var a = angleAt(e), d = a - drag.a; if (d > 180) d -= 360; if (d < -180) d += 360;
        var now = performance.now(), v = st.rings[drag.r]; setRot(drag.r, v + d); drag.moved += Math.abs(d);
        drag.v = d / Math.max(1, now - drag.t); drag.t = now; drag.a = a;
      });
      function up() {
        if (!drag) return; var d = drag; drag = null;
        if (d.moved < 4 && d.seg != null) { var i = +d.seg; animateTo(d.r, closestTurn(d.r, target(d.r, i)), function () { select(d.r, i); }); return; }
        settle(d.r, d.v);
      }
      function closestTurn(r, v) { var cur = st.rings[r]; while (v - cur > 180) v -= 360; while (v - cur < -180) v += 360; return v; }
      svg.addEventListener('pointerup', up); svg.addEventListener('pointercancel', up);
      svg.tabIndex = 0;
      svg.addEventListener('keydown', function (e) {
        var r = st.focus, n = items[r].length;
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); var i = (st.sel[r] + (e.key === 'ArrowRight' ? 1 : -1) + n) % n; animateTo(r, closestTurn(r, target(r, i)), function () { select(r, i); }); }
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { e.preventDefault(); var o = ['outer', 'middle', 'inner'], k = (o.indexOf(r) + (e.key === 'ArrowDown' ? 1 : 2)) % 3; st.focus = o[k]; draw(); side(); }
      });
      // a gentle parallax: the bezel and glass shift with the pointer, the rings stay flat so dragging stays exact
      inst.addEventListener('pointermove', function (e) { if (drag || reduce) return; var b = inst.getBoundingClientRect(), x = (e.clientX - b.left) / b.width - 0.5, y = (e.clientY - b.top) / b.height - 0.5; inst.style.setProperty('--px', x.toFixed(3)); inst.style.setProperty('--py', y.toFixed(3)); });
      inst.addEventListener('pointerleave', function () { inst.style.setProperty('--px', 0); inst.style.setProperty('--py', 0); });

      function select(r, i) { st.sel[r] = i; st.focus = r; draw(); side(); }

      // ---------------------------------------------------------------- the side panel
      function side() {
        var ko2 = TK.ko; pl = TK.placement(ko2);
        var sug = ko2.placement && ko2.placement.suggested, h = '';
        h += '<section class="cp-sec"><h3>Where this sits</h3>' + placeHTML(pl) +
          (sug && sug.reasons ? '<details class="cp-why"' + (pl.confirmed ? '' : ' open') + '><summary>Why the suggestion</summary><ul>' + sug.reasons.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul><p class="dim">' + esc(sug.engine || '') + ' · knowledge can sit in more than one place</p></details>' : '') +
          '<div class="cp-fix"><label>Primary place<select data-fix="primary"><option value="">— not placed —</option>' + C.nodes().map(function (n) { return '<option value="' + n.id + '"' + (n.id === pl.primary ? ' selected' : '') + '>' + esc(C.pathNames(n.id).join(' › ')) + '</option>'; }).join('') + '</select></label>' +
          '<div class="cp-rel">' + pl.related.map(function (r) { return '<span class="tag">' + esc(C.pathNames(r).join(' › ')) + ' <button type="button" data-unrel="' + r + '" aria-label="Remove">×</button></span>'; }).join('') + '</div>' +
          '<div class="row"><button type="button" class="primary" data-confirm>' + (pl.confirmed ? 'Save placement' : 'Confirm placement') + '</button></div></div></section>';
        var r = st.focus, it = items[r][st.sel[r]];
        if (r === 'outer') {
          var kids = C.nodes().filter(function (n) { return C.path(n.id)[0] === it.id && n.id !== it.id; });
          h += '<section class="cp-sec"><h3><i class="dot" style="--h:' + HUE[it.id] + '"></i>' + esc(it.label) + '</h3><p class="dim">Places in this domain — set one as primary or add it as another place.</p><ul class="cp-tree">' +
            [C.node(it.id)].concat(kids).map(function (n) { var d = C.path(n.id).length; return '<li style="--d:' + d + '"><span>' + esc(n.en) + '</span><button type="button" class="small" data-setp="' + n.id + '">Primary</button><button type="button" class="small ghost" data-addr="' + n.id + '">+ Also</button></li>'; }).join('') + '</ul></section>';
        } else if (r === 'middle') {
          var a = ang[st.sel.middle], mods = modelsFor(a.id), labs = a.id === 'experience' ? TK.data.labs : [];
          h += '<section class="cp-sec"><h3>' + esc(a.label) + ' <small class="dim">' + esc(a.hint) + '</small></h3>' +
            (mods.length ? '<p class="dim">Thinking models for this angle</p>' + mods.map(function (m) { return '<button type="button" class="cp-link" data-model="' + m.id + '">' + esc(m.title) + ' →</button>'; }).join('') : '') +
            (labs.length ? '<p class="dim">Experiments</p>' + labs.map(function (l) { return '<button type="button" class="cp-link" data-lab="' + l.interaction_id + '">' + esc(l.title) + ' →</button>'; }).join('') : '') + '</section>';
        } else if (it.id) {
          var allC = TK.ks.conceptsOf(TK.ko.id);
          var c = TK.ks.getConcept(it.id), up = TK.ks.relations({ node: 'cc:' + it.id }).filter(function (x) { return x.type === 'belongs-to' && x.from === 'cc:' + it.id; });
          var down = TK.ks.relations({ node: 'cc:' + it.id }).filter(function (x) { return x.type === 'belongs-to' && x.to === 'cc:' + it.id; });
          h += '<section class="cp-sec"><h3>' + esc(it.label) + ' <small class="dim">' + esc(TK.ks.KINDS[c.kind] || '') + '</small></h3>' +
            (up.length ? '<p><span class="dim">Belongs to</span> ' + up.map(function (x) { return '<span class="tag">' + esc(nodeLabel(x.to)) + '</span>'; }).join('') + '</p>' : '') +
            (down.length ? '<p><span class="dim">Contains</span> ' + down.map(function (x) { return '<span class="tag">' + esc(nodeLabel(x.from)) + '</span>'; }).join('') + '</p>' : '') +
            '<div class="row"><button type="button" data-open="framework" data-concept="' + it.id + '">Open in Framework</button><button type="button" data-open="graph" data-concept="' + it.id + '">Show in Graph</button></div>' +
            '<details class="cp-why"><summary>All ' + allC.length + ' concepts in this object</summary><div class="cp-all">' + allC.map(function (x) { return '<button type="button" class="chip" data-open="graph" data-concept="' + x.id + '">' + esc(TK.ks.label(x)) + '</button>'; }).join('') + '</div></details></section>';
        } else {
          h += '<section class="cp-sec"><h3>No concepts yet</h3><p class="dim">Concepts appear here when you add them in the Framework Card or the Graph.</p><button type="button" data-open="framework">Open Framework Card</button></section>';
        }
        h += '<section class="cp-sec cp-jump"><h3>Go on with this thought</h3><div class="row">' + ['framework', 'models', 'lab', 'graph'].map(function (id) { var cd = TK.cards[id]; return '<button type="button" data-go="' + id + '" style="--cc:' + cd.color + '">' + cd.icon + esc(cd.en) + '</button>'; }).join('') + '</div></section>';
        panel.innerHTML = h;
      }
      function nodeLabel(ref) { return ref.indexOf('cc:') === 0 ? TK.ks.label(ref.slice(3)) : ref; }
      function placeHTML(pl) {
        if (!pl.primary) return '<p class="dim">Not placed. Choose a place below — or leave it unplaced.</p>';
        return '<p class="cp-path">' + esc(C.pathNames(pl.primary).join(' › ')) + ' <span class="pill ' + (pl.confirmed ? 'ok' : 'sug') + '">' + (pl.confirmed ? 'Confirmed by you' : (pl.uncertain ? 'Suggested · uncertain' : 'Suggested')) + '</span></p>';
      }
      function modelsFor(angle) {
        var extra = { value: ['perspectives', 'incentives'] }[angle] || [];
        return TK.data.models.filter(function (m) { return m.angle === angle || extra.indexOf(m.id) >= 0; });
      }
      var draft = null;   // the placement being edited (primary + related) before it is saved
      function cur() { if (!draft) { var p = TK.placement(TK.ko); draft = { primary: p.primary, related: p.related.slice() }; } return draft; }
      panel.addEventListener('change', function (e) { if (e.target.matches('[data-fix=primary]')) { cur().primary = e.target.value || null; } });
      panel.addEventListener('click', function (e) {
        var b = e.target.closest('button'); if (!b) return;
        if (b.hasAttribute('data-setp')) { cur().primary = b.getAttribute('data-setp'); commit('Primary place set'); }
        else if (b.hasAttribute('data-addr')) { var id = b.getAttribute('data-addr'), d = cur(); if (d.related.indexOf(id) < 0 && id !== d.primary) d.related.push(id); commit('Added as another place'); }
        else if (b.hasAttribute('data-unrel')) { var u = b.getAttribute('data-unrel'), d2 = cur(); d2.related = d2.related.filter(function (x) { return x !== u; }); commit('Removed'); }
        else if (b.hasAttribute('data-confirm')) { var sel = panel.querySelector('[data-fix=primary]'); cur().primary = sel.value || null; commit('Placement saved'); }
        else if (b.hasAttribute('data-model')) TK.open('models', { objectId: TK.ko.id, model: b.getAttribute('data-model') });
        else if (b.hasAttribute('data-lab')) TK.open('lab', { objectId: TK.ko.id, lab: b.getAttribute('data-lab') });
        else if (b.hasAttribute('data-open')) TK.open(b.getAttribute('data-open'), { objectId: TK.ko.id, concept: b.getAttribute('data-concept') });
      });
      function commit(msg) {
        var d = cur(); TK.silently(function () { TK.confirmPlacement(d.primary, d.related.filter(function (x) { return x !== d.primary; })); });
        draft = null; pl = TK.placement(TK.ko);
        if (pl.primary) st.sel.outer = Math.max(0, COLS.indexOf(C.path(pl.primary)[0]));
        animateTo('outer', closestTurn('outer', target('outer', st.sel.outer)), function () { draw(); side(); });
        TK.toast(msg);
      }

      draw(); side();
      return {
        refresh: function () { ko = TK.ko; items.inner = inner(); if (st.sel.inner >= items.inner.length) st.sel.inner = 0; st.rings.inner = target('inner', st.sel.inner); draw(); side(); },
        destroy: function () { raf++; }
      };
      function $$(s, r) { return [].slice.call(r.querySelectorAll(s)); }
    }
  });
})();
