/* Card 03 · Thinking Models — method.
   A model (data/models.json, format minest.models/1) is a procedure: principle, what it fits, steps with real inputs
   (text · list · multi · choice · links · matrix · cases), a result assembled from the user's own inputs (plus computed
   parts: feedback loops, mismatched test cases) and rules that comment on the analysis. No AI text is generated.
   A run is saved as mr:<id> on the object and linked to the topic concept ('applies-to', provenance user).
   Several runs on the same object can be compared side by side. */
(function () {
  'use strict';
  var TK = window.MinestToolkit, esc = TK.esc;

  function model(id) { return TK.data.models.filter(function (m) { return m.id === id; })[0]; }
  function arr(v) { return Array.isArray(v) ? v : []; }
  function filled(v) { return Array.isArray(v) ? v.length > 0 : v && typeof v === 'object' ? Object.keys(v).length > 0 : !!String(v || '').trim(); }
  function cond(c, inp) {
    if (!c) return true;
    if (c.all) return c.all.every(function (x) { return cond(x, inp); });
    if (c.any) return c.any.some(function (x) { return cond(x, inp); });
    if (c.has) return arr(inp[c.has[0]]).indexOf(c.has[1]) >= 0;
    if (c.eq) return Object.keys(c.eq).every(function (k) { return inp[k] === c.eq[k]; });
    if (c.minItems) return Object.keys(c.minItems).every(function (k) { return arr(inp[k]).length >= c.minItems[k]; });
    if (c.empty) return c.empty.every(function (k) { return !filled(inp[k]); });
    if (c.filled) return c.filled.every(function (k) { return filled(inp[k]); });
    if (c.mismatch) return arr(inp[c.mismatch]).some(function (r) { return !!r.a !== !!r.b; });
    return false;
  }
  // feedback loops in a signed directed graph (small graphs: plain DFS over simple cycles)
  function loops(links) {
    var adj = {}, out = [], seen = {};
    links.forEach(function (l) { if (l.from && l.to) (adj[l.from] = adj[l.from] || []).push(l); });
    var nodes = Object.keys(adj).sort();
    nodes.forEach(function (start) {
      (function dfs(at, path, edges) {
        (adj[at] || []).forEach(function (l) {
          if (l.to === start && path.length) { var key = path.slice().sort().join('|'); if (!seen[key]) { seen[key] = 1; var neg = edges.concat([l]).filter(function (x) { return x.sign === '-'; }).length; out.push({ path: path.concat([start]), kind: neg % 2 ? 'balancing' : 'reinforcing' }); } }
          else if (path.indexOf(l.to) < 0 && l.to > start && path.length < 8) dfs(l.to, path.concat([l.to]), edges.concat([l]));
        });
      })(start, [start], []);
    });
    out.forEach(function (o) { o.path = o.path.slice(0, -1).concat([o.path[0]]); });
    return out;
  }
  TK.modelLoops = loops;

  function resultOf(m, inp) {
    var parts = m.result.map(function (r) {
      var v = inp[r.from], step = m.steps.filter(function (s) { return s.id === r.from; })[0] || {}, txt;
      if (r.compute === 'loops') { var L = loops(arr(v)); txt = L.length ? L.map(function (l) { return l.path.join(' → ') + ' (' + l.kind + ')'; }) : ['No closed loop yet']; }
      else if (r.compute === 'mismatch') { var rows = arr(v); txt = rows.map(function (x) { return x.label + ': ' + (!!x.a === !!x.b ? 'consistent' : 'MISMATCH') ; }); }
      else if (step.input === 'multi') txt = arr(v).map(function (id) { var o = (step.options || []).filter(function (x) { return x[0] === id; })[0]; return o ? o[1] : id; });
      else if (step.input === 'choice') { var o = (step.options || []).filter(function (x) { return x[0] === v; })[0]; txt = o ? o[1] : ''; }
      else if (step.input === 'links') txt = arr(v).map(function (l) { return l.from + ' ' + (l.sign === '-' ? '−→' : '+→') + ' ' + l.to; });
      else if (step.input === 'matrix') txt = Object.keys(v || {}).map(function (row) { return row + ': ' + (step.cols || []).map(function (c, i) { return c + ' — ' + ((v[row] || [])[i] || '…'); }).join(' · '); });
      else txt = v;
      return { label: r.label, value: txt };
    });
    var notes = (m.rules || []).filter(function (r) { return cond(r.when, inp); }).map(function (r) { return { say: r.say, tone: r.tone }; });
    var done = m.steps.filter(function (s) { return filled(inp[s.id]); }).length;
    return { parts: parts, notes: notes, steps_done: done, steps_total: m.steps.length };
  }

  TK.register({
    id: 'models', en: 'Thinking Models', zh: '思维模型卡', color: '#1f9d55', line: 'Analyse the question step by step with a method.',
    icon: TK.icon('<path d="M4 6h10M4 12h16M4 18h7"/><circle cx="17" cy="6" r="2"/><circle cx="14" cy="18" r="2"/>'),
    preview: function (ko) {
      var runs = TK.ks.modelRunsOf(ko.id), rec = recommend(ko).slice(0, 3);
      return (runs.length ? '<span class="dim">' + runs.length + ' analysis' + (runs.length > 1 ? 'es' : '') + ' saved</span>' : '') +
        '<span class="pv-list">' + rec.map(function (m) { return '<i>' + esc(m.title) + '</i>'; }).join('') + '</span>';
    },
    mount: function (el, ko, opts) {
      var ks = TK.ks, cur = null, inp = {}, runId = null, compare = [];
      el.innerHTML = '<div class="md-wrap"><aside class="md-side"><h3>Suggested for this question</h3><div class="md-rec"></div><h3>All models</h3><div class="md-all"></div><h3>Saved analyses</h3><div class="md-runs"></div></aside><section class="md-main"></section></div>';
      var main = el.querySelector('.md-main');

      function side() {
        var rec = recommend(ks.object(ko.id)), runs = ks.modelRunsOf(ko.id);
        el.querySelector('.md-rec').innerHTML = rec.slice(0, 3).map(function (m) { return btn(m, true); }).join('') || '<p class="dim">No suggestion — pick any model.</p>';
        el.querySelector('.md-all').innerHTML = TK.data.models.map(function (m) { return btn(m); }).join('');
        el.querySelector('.md-runs').innerHTML = runs.length ? runs.map(function (r) { var m = model(r.model_id); return '<div class="md-run' + (r.id === runId ? ' on' : '') + '"><label><input type="checkbox" data-cmp="' + r.id + '"' + (compare.indexOf(r.id) >= 0 ? ' checked' : '') + '> </label><button type="button" data-run="' + r.id + '"><b>' + esc(m ? m.title : r.model_id) + '</b><small>' + new Date(r.updated_at || r.at).toLocaleString() + '</small></button></div>'; }).join('') +
          '<button type="button" class="small" data-compare' + (compare.length < 2 ? ' disabled' : '') + '>Compare selected (' + compare.length + ')</button>' : '<p class="dim">None yet.</p>';
      }
      function btn(m, rec) { return '<button type="button" class="md-m' + (cur && cur.id === m.id && !runId ? ' on' : '') + '" data-model="' + m.id + '"><b>' + esc(m.title) + '</b>' + (rec ? '<small class="md-pr">' + esc(m.principle) + '</small>' : '') + '</button>'; }

      function open(m, run) {
        cur = m; runId = run ? run.id : null; inp = run ? JSON.parse(JSON.stringify(run.inputs)) : seedInputs(m);
        side(); form();
      }
      function seedInputs(m) {
        var i = {}, t = TK.rootLabel(ks.object(ko.id));
        m.steps.forEach(function (s) { if (s.input === 'text' && (s.id === 'issue' || s.id === 'claim' || s.id === 'goal' || s.id === 'statement')) i[s.id] = ks.object(ko.id).title; });
        if (m.id === 'socratic') i.def = t ? t + ' is ' : '';
        return i;
      }
      function form() {
        var m = cur, t = TK.rootLabel(ks.object(ko.id));
        main.innerHTML = '<header class="md-hd"><h2>' + esc(m.title) + '</h2><p>' + esc(m.principle) + '</p><p class="dim">Fits: ' + esc(fitText(m)) + ' · <b>Limits:</b> ' + esc(m.limits) + '</p></header>' +
          '<ol class="md-steps">' + m.steps.map(function (s, k) { return '<li class="md-step" data-step="' + s.id + '"><h4><span>' + (k + 1) + '</span>' + esc(s.title) + '</h4><p class="dim">' + esc(s.prompt.replace(/\bX\b/g, t || 'X')) + '</p><div class="md-in">' + input(s) + '</div></li>'; }).join('') + '</ol>' +
          '<section class="md-result"></section><div class="row md-save"><button type="button" class="primary" data-save>' + (runId ? 'Save changes' : 'Save analysis') + '</button>' + (runId ? '<button type="button" class="ghost" data-delrun>Delete</button><button type="button" class="ghost" data-again>Start a fresh one</button>' : '') + '<span class="msg"></span></div>';
        result();
      }
      function input(s) {
        var v = inp[s.id];
        if (s.input === 'text') return '<textarea data-k="' + s.id + '" rows="2">' + esc(v || '') + '</textarea>';
        if (s.input === 'multi') return s.options.map(function (o) { return '<label class="kl-chk"><input type="checkbox" data-multi="' + s.id + '" value="' + o[0] + '"' + (arr(v).indexOf(o[0]) >= 0 ? ' checked' : '') + '> ' + esc(o[1]) + '</label>'; }).join('');
        if (s.input === 'choice') return s.options.map(function (o) { return '<label class="kl-chk"><input type="radio" name="c-' + s.id + '" data-choice="' + s.id + '" value="' + o[0] + '"' + (v === o[0] ? ' checked' : '') + '> ' + esc(o[1]) + '</label>'; }).join('');
        if (s.input === 'list') return '<div class="md-list">' + arr(v).map(function (x, i) { return '<span class="tag">' + esc(x) + ' <button type="button" data-rmi="' + s.id + ':' + i + '" aria-label="Remove">×</button></span>'; }).join('') + '</div><div class="row md-add"><input data-addto="' + s.id + '" placeholder="Add and press Enter"><button type="button" data-addbtn="' + s.id + '">Add</button></div>' +
          (s.suggest ? '<div class="md-sug">' + s.suggest.filter(function (x) { return arr(v).indexOf(x) < 0; }).map(function (x) { return '<button type="button" class="chip" data-sug="' + s.id + '">' + esc(x) + '</button>'; }).join('') + '</div>' : '');
        if (s.input === 'links') {
          var parts = arr(inp[s.from]);
          if (parts.length < 2) return '<p class="dim">Add at least two parts in the step above first.</p>';
          var opt = parts.map(function (p) { return '<option>' + esc(p) + '</option>'; }).join('');
          return '<div class="md-links">' + arr(v).map(function (l, i) { return '<span class="tag">' + esc(l.from) + ' <b class="' + (l.sign === '-' ? 'neg' : 'pos') + '">' + (l.sign === '-' ? '−' : '+') + '→</b> ' + esc(l.to) + ' <button type="button" data-rml="' + s.id + ':' + i + '">×</button></span>'; }).join('') + '</div>' +
            '<div class="row md-add"><select data-lf>' + opt + '</select><select data-ls><option value="+">+ (same direction)</option><option value="-">− (opposite)</option></select><select data-lt>' + opt + '</select><button type="button" data-addlink="' + s.id + '">Connect</button></div>' + loopSvg(parts, arr(v));
        }
        if (s.input === 'matrix') {
          var rows = arr(inp[s.rows]); if (!rows.length) return '<p class="dim">Add rows in the step above first.</p>';
          return '<div class="md-matrix" style="--n:' + s.cols.length + '"><span></span>' + s.cols.map(function (c) { return '<b>' + esc(c) + '</b>'; }).join('') +
            rows.map(function (r) { return '<b class="md-rh">' + esc(r) + '</b>' + s.cols.map(function (c, i) { return '<textarea rows="2" data-mx="' + s.id + '" data-row="' + esc(r) + '" data-col="' + i + '">' + esc(((v || {})[r] || [])[i] || '') + '</textarea>'; }).join(''); }).join('') + '</div>';
        }
        if (s.input === 'cases') return '<div class="md-cases"><div class="md-ch"><span>Case</span>' + s.cols.map(function (c) { return '<span>' + esc(c) + '</span>'; }).join('') + '<span></span></div>' +
          arr(v).map(function (r, i) { return '<div class="md-cr' + (!!r.a !== !!r.b ? ' bad' : '') + '"><span>' + esc(r.label) + '</span><input type="checkbox" data-case="' + s.id + ':' + i + ':a"' + (r.a ? ' checked' : '') + '><input type="checkbox" data-case="' + s.id + ':' + i + ':b"' + (r.b ? ' checked' : '') + '><button type="button" data-rmc="' + s.id + ':' + i + '">×</button></div>'; }).join('') +
          '</div><div class="row md-add"><input data-caseadd="' + s.id + '" placeholder="A case, e.g. a prisoner who likes his cell"><button type="button" data-casebtn="' + s.id + '">Add case</button></div>';
        return '';
      }
      function loopSvg(parts, links) {
        var n = parts.length, R = 90, pos = {}; parts.forEach(function (p, i) { var a = i / n * Math.PI * 2 - Math.PI / 2; pos[p] = [Math.cos(a) * R, Math.sin(a) * R]; });
        var s = links.map(function (l) { var a = pos[l.from], b = pos[l.to]; if (!a || !b) return ''; var mx = (a[0] + b[0]) / 2 * 0.6, my = (a[1] + b[1]) / 2 * 0.6; return '<path class="lp ' + (l.sign === '-' ? 'neg' : 'pos') + '" d="M' + a + ' Q' + mx + ' ' + my + ' ' + b + '" marker-end="url(#lpa)"/><text class="lps" x="' + (mx * 1.05) + '" y="' + (my * 1.05) + '">' + (l.sign === '-' ? '−' : '+') + '</text>'; }).join('');
        s += parts.map(function (p) { var q = pos[p]; return '<g transform="translate(' + q + ')"><rect x="-46" y="-12" width="92" height="24" rx="12" class="lpn"/><text class="lpt" y="4">' + esc(p.length > 13 ? p.slice(0, 12) + '…' : p) + '</text></g>'; }).join('');
        return '<svg class="md-loop" viewBox="-150 -125 300 250"><defs><marker id="lpa" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10z" fill="currentColor"/></marker></defs>' + s + '</svg>';
      }
      function result() {
        var r = resultOf(cur, inp), box = main.querySelector('.md-result'); if (!box) return;
        box.innerHTML = '<h3>Result <small class="dim">' + r.steps_done + ' of ' + r.steps_total + ' steps · built only from what you entered</small></h3>' +
          r.notes.map(function (n) { return '<p class="md-note ' + (n.tone || 'info') + '">' + esc(n.say) + '</p>'; }).join('') +
          '<dl>' + r.parts.map(function (p) { var v = p.value; return '<dt>' + esc(p.label) + '</dt><dd>' + (Array.isArray(v) ? (v.length ? '<ul>' + v.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' : '<span class="dim">—</span>') : (v ? esc(v) : '<span class="dim">—</span>')) + '</dd>'; }).join('') + '</dl>';
      }
      function changed(repaint) { if (repaint) { var y = window.scrollY; form(); window.scrollTo(0, y); } else result(); }

      el.addEventListener('input', function (e) {
        var t = e.target;
        if (t.matches('[data-k]')) { inp[t.getAttribute('data-k')] = t.value; changed(); }
        else if (t.matches('[data-mx]')) { var k = t.getAttribute('data-mx'), row = t.getAttribute('data-row'), c = +t.getAttribute('data-col'); inp[k] = inp[k] || {}; inp[k][row] = inp[k][row] || []; inp[k][row][c] = t.value; changed(); }
      });
      el.addEventListener('change', function (e) {
        var t = e.target;
        if (t.matches('[data-multi]')) { var k = t.getAttribute('data-multi'); inp[k] = [].slice.call(main.querySelectorAll('[data-multi="' + k + '"]:checked')).map(function (x) { return x.value; }); changed(); }
        else if (t.matches('[data-choice]')) { inp[t.getAttribute('data-choice')] = t.value; changed(); }
        else if (t.matches('[data-case]')) { var p = t.getAttribute('data-case').split(':'); inp[p[0]][+p[1]][p[2]] = t.checked; changed(true); }
        else if (t.matches('[data-cmp]')) { var id = t.getAttribute('data-cmp'); compare = t.checked ? compare.concat([id]) : compare.filter(function (x) { return x !== id; }); side(); }
      });
      el.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter') return;
        var t = e.target;
        if (t.matches('[data-addto]')) { e.preventDefault(); addItem(t.getAttribute('data-addto'), t.value); }
        else if (t.matches('[data-caseadd]')) { e.preventDefault(); addCase(t.getAttribute('data-caseadd'), t.value); }
      });
      function addItem(k, v) { v = String(v || '').trim(); if (!v) return; inp[k] = arr(inp[k]); if (inp[k].indexOf(v) < 0) inp[k].push(v); changed(true); var f = main.querySelector('[data-addto="' + k + '"]'); if (f) f.focus(); }
      function addCase(k, v) { v = String(v || '').trim(); if (!v) return; inp[k] = arr(inp[k]); inp[k].push({ label: v, a: false, b: false }); changed(true); var f = main.querySelector('[data-caseadd="' + k + '"]'); if (f) f.focus(); }
      el.addEventListener('click', function (e) {
        var b = e.target.closest('button'); if (!b) return;
        if (b.hasAttribute('data-model')) return open(model(b.getAttribute('data-model')));
        if (b.hasAttribute('data-run')) { var r = ks.modelRun(b.getAttribute('data-run')); return open(model(r.model_id), r); }
        if (b.hasAttribute('data-compare')) return showCompare();
        if (b.hasAttribute('data-addbtn')) { var k = b.getAttribute('data-addbtn'); return addItem(k, main.querySelector('[data-addto="' + k + '"]').value); }
        if (b.hasAttribute('data-sug')) return addItem(b.getAttribute('data-sug'), b.textContent);
        if (b.hasAttribute('data-rmi')) { var p = b.getAttribute('data-rmi').split(':'); inp[p[0]].splice(+p[1], 1); return changed(true); }
        if (b.hasAttribute('data-addlink')) { var k2 = b.getAttribute('data-addlink'), row = b.parentNode, l = { from: row.querySelector('[data-lf]').value, sign: row.querySelector('[data-ls]').value, to: row.querySelector('[data-lt]').value }; if (l.from === l.to) return TK.toast('Pick two different parts'); inp[k2] = arr(inp[k2]).filter(function (x) { return !(x.from === l.from && x.to === l.to); }).concat([l]); return changed(true); }
        if (b.hasAttribute('data-rml')) { var q = b.getAttribute('data-rml').split(':'); inp[q[0]].splice(+q[1], 1); return changed(true); }
        if (b.hasAttribute('data-casebtn')) { var k3 = b.getAttribute('data-casebtn'); return addCase(k3, main.querySelector('[data-caseadd="' + k3 + '"]').value); }
        if (b.hasAttribute('data-rmc')) { var c = b.getAttribute('data-rmc').split(':'); inp[c[0]].splice(+c[1], 1); return changed(true); }
        if (b.hasAttribute('data-save')) return saveRun();
        if (b.hasAttribute('data-delrun')) { if (confirm('Delete this analysis?')) { TK.silently(function () { ks.removeModelRun(runId); }); compare = compare.filter(function (x) { return x !== runId; }); open(cur); } return; }
        if (b.hasAttribute('data-again')) return open(cur);
        if (b.hasAttribute('data-back')) return form();
      });
      function saveRun() {
        var res = resultOf(cur, inp), k = ks.object(ko.id), rec;
        TK.silently(function () {
          rec = ks.saveModelRun({ id: runId, ko: ko.id, model_id: cur.id, title: cur.title, inputs: JSON.parse(JSON.stringify(inp)), result: res, at: runId ? (ks.modelRun(runId) || {}).at : null });
          if (k.root_concept) ks.relate('mr:' + rec.id, 'cc:' + k.root_concept, 'applies-to', { ko: ko.id, provenance: 'user', source_ref: 'mr:' + rec.id, note: cur.title + ' applied to this topic' });
        });
        runId = rec.id; side(); form(); main.querySelector('.md-save .msg').textContent = 'Saved — it now appears in the Graph.';
      }
      function showCompare() {
        var runs = compare.map(function (id) { return ks.modelRun(id); }).filter(Boolean);
        main.innerHTML = '<header class="md-hd"><h2>Compare analyses</h2><p class="dim">The same question through different models. What does each one make you notice?</p><button type="button" data-back' + (cur ? '' : ' hidden') + '>← Back</button></header><div class="md-cmp" style="--n:' + runs.length + '">' +
          runs.map(function (r) { var m = model(r.model_id), res = resultOf(m, r.inputs); return '<article><h3>' + esc(m.title) + '</h3>' + res.notes.map(function (n) { return '<p class="md-note ' + n.tone + '">' + esc(n.say) + '</p>'; }).join('') + '<dl>' + res.parts.map(function (p) { var v = p.value; return '<dt>' + esc(p.label) + '</dt><dd>' + (Array.isArray(v) ? v.map(esc).join('<br>') || '—' : esc(v || '—')) + '</dd>'; }).join('') + '</dl><p class="dim">Limits: ' + esc(m.limits) + '</p></article>'; }).join('') + '</div>';
      }

      side();
      var first = (opts && opts.model && model(opts.model)) || recommend(ks.object(ko.id))[0] || TK.data.models[0];
      open(first);
      return { refresh: function () { side(); } };
    }
  });

  function fitText(m) { return (m.fits.places || []).filter(function (p) { return p !== '*'; }).map(function (p) { return TK.C.node(p) ? TK.C.node(p).en : p; }).join(', ') || 'most questions'; }
  function recommend(ko) {
    var pl = TK.placement(ko), places = [pl.primary].concat(pl.related || []).filter(Boolean), text = TK.ks.norm(ko.original_input);
    return TK.data.models.map(function (m) {
      var s = 0;
      (m.fits.places || []).forEach(function (p) { if (p === '*') s += 0.2; places.forEach(function (q, i) { var path = TK.C.path(q); if (path.indexOf(p) >= 0) s += (i === 0 ? 2 : 1) * (p.split('.').length); }); });
      (m.fits.words || []).forEach(function (w) { if (text.indexOf(TK.ks.norm(w)) >= 0) s += 1.5; });
      if (ko.content_type === 'concept' && m.angle === 'define') s += 1.5;
      return { m: m, s: s };
    }).filter(function (x) { return x.s > 0; }).sort(function (a, b) { return b.s - a.s; }).map(function (x) { return x.m; });
  }
  TK.recommendModels = recommend;
})();
