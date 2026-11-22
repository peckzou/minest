/* Thought Compass Lab — wires the two engines into one loop:
   input → MinestCompass.classify → Thought Compass → confirm / correct (cn:fix) → framework → MinestMicro.play →
   result (mi:run, rel:lab-) → knowledge log. Store: localStorage under 'minest.lab.kw.' with MinestKnowledge's
   get / set / keys interface, so the engines can later run on the real (synced) store unchanged. */
(function () {
  'use strict';
  var C = window.MinestCompass, M = window.MinestMicro, $ = function (s) { return document.querySelector(s); };
  var PFX = 'minest.lab.kw.';
  var store = {
    get: function (k) { try { var v = localStorage.getItem(PFX + k); return v ? JSON.parse(v) : null; } catch (e) { return null; } },
    set: function (k, v) { try { if (v == null) localStorage.removeItem(PFX + k); else localStorage.setItem(PFX + k, JSON.stringify(v)); } catch (e) {} },
    keys: function (p) { var out = []; try { for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k.indexOf(PFX + p) === 0) out.push(k.slice(PFX.length)); } } catch (e) {} return out; }
  };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function j(u) { return fetch(u, { cache: 'no-store' }).then(function (r) { if (!r.ok) throw new Error(u + ' ' + r.status); return r.json(); }); }

  var EXAMPLES = ['Why does one event happening after another not mean it was caused by it?', '为什么两个事件先后发生，并不一定意味着存在因果关系？', '喝咖啡之后我的成绩变好了', 'Ice cream sales and drownings rise together', 'I want to learn to control my emotions', 'What is the essence of the universe?'];
  var KIND = { philosophical: ['Philosophical position', 'Not a scientific fact — a way of thinking about the question.'], method: ['Method', 'A way of testing or working.'], model: ['Descriptive model', 'Useful, with limits.'], classification: ['Classification', 'A way of sorting things.'] };
  var current = null;   // { rec, result }

  var COLS = ['philosophy', 'knowledge', 'nature', 'psychology', 'society', 'systems', 'life'];
  var HUE = { philosophy: '#9b5de5', knowledge: '#5e9cff', nature: '#30b45a', psychology: '#f08c3a', society: '#00a6a6', systems: '#e8566c', life: '#c9a227' };

  Promise.all([j('taxonomy.json'), j('frameworks-ext.json'), j('micro/kant-causality.json')].concat(COLS.map(function (c) { return j('../knowledge/frameworks/' + c + '.json'); })))
    .then(function (all) {
      var fws = []; all.slice(3).forEach(function (col) { fws = fws.concat(col.frameworks || []); });
      C.load({ taxonomy: all[0], ext: all[1], frameworks: fws, store: store });
      M.register(all[2]);
      boot();
    }).catch(function (e) { document.body.insertAdjacentHTML('afterbegin', '<p class="err">Could not load the lab data: ' + esc(e.message) + '</p>'); });

  function boot() {
    $('#examples').innerHTML = EXAMPLES.map(function (t) { return '<button type="button" class="chip">' + esc(t) + '</button>'; }).join('');
    $('#examples').onclick = function (e) { var b = e.target.closest('.chip'); if (b) { $('#q').value = b.textContent; locate(); } };
    $('#go').onclick = locate;
    $('#q').addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); locate(); } });
    $('#confirm').onclick = confirm;
    $('#ask-ai').onclick = askAI;
    $('#clear').onclick = function () { if (!confirmClear()) return; store.keys('').forEach(function (k) { store.set(k, null); }); renderLog(); $('#result').hidden = true; };
    $('#fix-node').innerHTML = C.nodes().map(function (n) { return '<option value="' + n.id + '">' + esc(C.pathNames(n.id).join(' › ')) + '</option>'; }).join('');
    $('#fix-fw').innerHTML = C.frameworks().map(function (f) { return '<option value="' + f.framework_id + '">' + esc(f.title) + '</option>'; }).join('');
    renderLog();
  }
  function confirmClear() { return window.confirm('Delete every query, correction and result saved by this lab page in this browser?'); }

  // ------------------------------------------------------------------ locate
  function locate() {
    var text = $('#q').value.trim(); if (!text) return $('#q').focus();
    var result = C.classify(text), rec = C.saveQuery(result, null);
    current = { rec: rec, result: result };
    $('#ai-out').textContent = ''; $('#fix-msg').textContent = '';
    show(result); renderLog();
  }

  function show(r) {
    $('#result').hidden = false;
    $('#r-type').textContent = r.type.label; $('#r-typewhy').textContent = r.type.why;
    $('#r-place').textContent = r.primary ? r.primary.names.join(' › ') : 'Not placed';
    $('#r-unc').textContent = r.uncertain ? 'Uncertain — please check' : 'Confident';
    $('#r-unc').className = r.uncertain ? 'warn' : 'ok';
    $('#r-related').innerHTML = r.related.length ? r.related.map(function (x) { return '<span class="tag">' + esc(x.names.join(' › ')) + '</span>'; }).join('') : '<em>none</em>';
    $('#r-reasons').innerHTML = r.reasons.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '<li class="dim">Engine: ' + esc(r.engine) + ' (local rules; no network)</li>';
    if (r.primary) $('#fix-node').value = r.primary.id;
    if (r.frameworks[0]) $('#fix-fw').value = r.frameworks[0].framework_id;
    drawCompass(r);
    $('#r-fws').innerHTML = r.frameworks.length ? r.frameworks.map(fwCard).join('') : '<div class="card"><p>No framework fits yet. Choose a place and a framework above and confirm — the lab will remember it for similar thoughts.</p></div>';
    $('#r-fws').onclick = function (e) { var b = e.target.closest('[data-play]'); if (b) play(b.getAttribute('data-play'), b.getAttribute('data-fw')); };
    $('#ask-ai').disabled = false;
  }

  function fwCard(f, i) {
    var k = KIND[f.kind] || KIND.model, fwFull = C.framework(f.framework_id);
    return '<article class="card fw' + (i === 0 ? ' best' : '') + '"><header><h3>' + esc(f.title) + '</h3><span class="kind k-' + esc(f.kind) + '" title="' + esc(k[1]) + '">' + esc(k[0]) + '</span></header>' +
      '<p class="kindnote">' + esc(k[1]) + '</p>' +
      '<p class="fit">Fits because: ' + esc(f.why.join(' · ')) + '</p>' +
      (f.core_principles.length ? '<h4>Core ideas</h4><ul>' + f.core_principles.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' : '') +
      (f.applicable_scenarios.length ? '<h4>Use it for</h4><p>' + esc(f.applicable_scenarios.join(' · ')) + '</p>' : '') +
      (f.limitations ? '<h4>Limits</h4><p>' + esc(f.limitations) + '</p>' : '') +
      (f.related_concepts.length ? '<div class="concepts">' + f.related_concepts.map(function (c) { return '<span class="tag">' + esc(c.name) + '</span>'; }).join('') + '</div>' : '') +
      (fwFull && fwFull.theoretical_sources.length ? '<p class="src">Source: ' + esc(fwFull.theoretical_sources.map(function (s) { return [s.work, s.part, s.year].filter(Boolean).join(', '); }).join(' · ')) + '</p>' : '') +
      (f.interaction_ids.map(function (id) { var d = M.get(id); return d ? '<button type="button" class="primary play" data-play="' + id + '" data-fw="' + f.framework_id + '">▶ Try: ' + esc(d.title) + ' <small>' + esc(d.subtitle || '') + '</small></button>' : ''; }).join('')) +
      (f.labOnly ? '<p class="dim">Lab-only framework (not yet in the Golden Framework Library).</p>' : '') + '</article>';
  }

  // ------------------------------------------------------------------ the compass
  function polar(a, r) { return [Math.sin(a) * r, -Math.cos(a) * r]; }
  function place(id) {
    var p = C.path(id), seg = Math.PI * 2 / COLS.length, a0 = COLS.indexOf(p[0]) * seg, span = seg;
    for (var d = 1; d < p.length; d++) {
      var sibs = C.nodes().filter(function (n) { return n.parent === p[d - 1]; }), i = sibs.map(function (n) { return n.id; }).indexOf(p[d]);
      span = span / Math.max(sibs.length, 1); a0 = a0 + span * i;
    }
    return { a: a0 + span / 2, r: [0, 52, 96, 134][p.length] || 134 };
  }
  function drawCompass(r) {
    var seg = Math.PI * 2 / COLS.length, s = '';
    s += [52, 96, 134].map(function (rr) { return '<circle class="ring" r="' + rr + '"/>'; }).join('');
    COLS.forEach(function (c, i) {
      var a1 = i * seg, a2 = a1 + seg, p1 = polar(a1, 150), p2 = polar(a2, 150), on = r.primary && r.primary.path[0] === c;
      s += '<path class="sec' + (on ? ' on' : '') + '" style="--h:' + HUE[c] + '" d="M0 0 L' + p1[0] + ' ' + p1[1] + ' A150 150 0 0 1 ' + p2[0] + ' ' + p2[1] + ' Z"/>';
      var lp = polar(a1 + seg / 2, 116), n = C.node(c);
      s += '<text class="lab' + (on ? ' on' : '') + '" x="' + lp[0] + '" y="' + lp[1] + '">' + esc(n ? n.en.split(' ')[0].replace(/&$/, '') : c) + '</text>';
    });
    r.related.forEach(function (x) { var p = place(x.id), q = polar(p.a, p.r); s += '<circle class="rel" cx="' + q[0] + '" cy="' + q[1] + '" r="6"/>'; });
    if (r.primary) {
      var p = place(r.primary.id), q = polar(p.a, p.r), deg = p.a * 180 / Math.PI;
      s += '<g class="needle" style="transform:rotate(' + deg + 'deg)"><path d="M-6 0 L0 ' + (-p.r) + ' L6 0 Z"/></g><circle class="pin" cx="' + q[0] + '" cy="' + q[1] + '" r="8"/>';
    }
    s += '<circle class="hub" r="10"/>';
    $('#compass').innerHTML = s;
  }

  // ------------------------------------------------------------------ confirm / correct
  function confirm() {
    if (!current) return;
    var q = C.confirm(current.rec.id, { node: $('#fix-node').value, framework: $('#fix-fw').value });
    var changed = (current.result.primary ? current.result.primary.id : null) !== q.confirmed.node || (current.result.frameworks[0] ? current.result.frameworks[0].framework_id : null) !== q.confirmed.framework;
    $('#fix-msg').textContent = changed ? 'Corrected — similar thoughts will lean this way next time.' : 'Confirmed.';
    current.rec = q; renderLog();
  }

  // ------------------------------------------------------------------ AI second opinion
  function askAI() {
    if (!current) return;
    var out = $('#ai-out'); $('#ask-ai').disabled = true; out.textContent = 'Asking…';
    C.assist(current.result).then(function (r) {
      $('#ask-ai').disabled = false;
      if (!r.ok) { out.textContent = r.error; return; }
      var s = r.suggestion;
      out.innerHTML = '<b>AI suggests:</b> ' + esc(s.place ? C.pathNames(s.place).join(' › ') : '—') + (s.frameworks.length ? ' · ' + esc(s.frameworks.map(function (id) { return C.framework(id).title; }).join(', ')) : '') +
        (s.confidence != null ? ' <span class="dim">(' + Math.round(s.confidence * 100) + '%)</span>' : '') + '<br><span class="dim">' + esc(s.reason) + '</span> <button type="button" class="small" id="ai-use">Use in the form</button>';
      $('#ai-use').onclick = function () { if (s.place) $('#fix-node').value = s.place; if (s.frameworks[0]) $('#fix-fw').value = s.frameworks[0]; $('#fix-msg').textContent = 'Filled in from AI — press Confirm to keep it.'; };
    });
  }

  // ------------------------------------------------------------------ play
  function play(id, fw) {
    M.play(id, { store: store, context: { query_id: current && current.rec.id, text: current && current.result.text, framework_id: fw }, onSaved: renderLog, onClose: renderLog });
  }

  // ------------------------------------------------------------------ log
  function when(t) { try { return new Date(t).toLocaleString(); } catch (e) { return ''; } }
  function renderLog() {
    var qs = C.queries(), runs = M.runs(store), html = '';
    if (!qs.length && !runs.length) { $('#log').innerHTML = '<p class="dim">Nothing yet. Locate a thought, then try its interaction.</p>'; return; }
    html += qs.slice(0, 12).map(function (q) {
      var r = q.result, mine = runs.filter(function (x) { return x.query_id === q.id; });
      var place = q.confirmed ? C.pathNames(q.confirmed.node).join(' › ') : r.primary ? r.primary.names.join(' › ') : '—';
      var fw = q.confirmed ? C.framework(q.confirmed.framework) : r.frameworks[0] && C.framework(r.frameworks[0].framework_id);
      return '<div class="entry"><p class="q">“' + esc(q.text) + '”</p><p class="dim">' + esc(when(q.at)) + ' · ' + esc(r.type.label) + '</p>' +
        '<p>' + esc(place) + (fw ? ' → ' + esc(fw.title) : '') + ' <span class="st ' + (q.confirmed ? 'ok' : '') + '">' + (q.confirmed ? 'confirmed' : 'unconfirmed') + '</span></p>' +
        mine.map(runLine).join('') + '</div>';
    }).join('');
    var loose = runs.filter(function (x) { return !qs.some(function (q) { return q.id === x.query_id; }); });
    html += loose.map(function (x) { return '<div class="entry">' + runLine(x) + '</div>'; }).join('');
    var fx = C.fixes().length; if (fx) html += '<p class="dim">' + fx + ' correction' + (fx > 1 ? 's' : '') + ' remembered.</p>';
    $('#log').innerHTML = html;
  }
  function runLine(x) {
    var d = M.get(x.interaction_id), L = { yes: 'yes', no: 'no', unsure: 'not sure' };
    return '<div class="run"><b>▶ ' + esc(d ? d.title : x.interaction_id) + '</b> ' + (x.completed ? '<span class="st ok">completed</span>' : '<span class="st">partial</span>') +
      '<br>A caused B? ' + esc(L[x.judge1] || '—') + ' → ' + esc(L[x.judge2] || '—') +
      (x.apply ? '<br>Case: ' + esc(x.apply.a) + ' → ' + esc(x.apply.b) + ' (' + esc(x.apply.verdict) + ', your judgment)' : '') +
      (x.note ? '<br>Understood: ' + esc(x.note) : '') + (x.question ? '<br>Question: ' + esc(x.question) : '') + '</div>';
  }
})();
