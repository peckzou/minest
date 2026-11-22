/* Card 04 · Thinking Lab — experience.
   Runs micro-interactions (minest.micro/1, tools/compass/micro.js) for the current object. Each finished run is linked
   to the object (lab_run_ids), its understanding / question become the object's notes (visible in the Framework Card),
   and it appears in the Graph as an experiment that illustrates the topic. The user's own case from the "apply" step
   becomes a 'case' concept with the relation the user chose — never a cause Minest decided. */
(function () {
  'use strict';
  var TK = window.MinestToolkit, esc = TK.esc;

  function recommend(ko) {
    var pl = TK.placement(ko), places = [pl.primary].concat(pl.related || []).filter(Boolean);
    var sugg = (ko.suggested_labs || []).concat(ko.seed ? (TK.data.seeds.filter(function (s) { return s.id === ko.seed; })[0] || {}).labs || [] : []);
    return TK.data.labs.map(function (d) {
      var s = sugg.indexOf(d.interaction_id) >= 0 ? 3 : 0;
      (d.fits || []).forEach(function (p) { places.forEach(function (q, i) { if (TK.C.path(q).indexOf(p) >= 0 || TK.C.path(p).indexOf(q) >= 0) s += i === 0 ? 2 : 1; }); });
      if (d.interaction_id === 'kant-causality') places.forEach(function (q) { if (/causation|causal-inference/.test(q)) s += 2; });
      return { d: d, s: s };
    }).sort(function (a, b) { return b.s - a.s; });
  }
  TK.recommendLabs = recommend;
  function rvw(d) { return TK.ks.reviewStatus('lab', d.interaction_id, d.content_review_status || 'pending'); }

  function summary(rec) {
    var L = { yes: 'yes', no: 'no', unsure: 'not sure' };
    return (rec.judge1 ? 'Answer: ' + (L[rec.judge1] || rec.judge1) + ' → ' + (L[rec.judge2] || '—') + (rec.changedMind ? ' (changed)' : '') : '') +
      (rec.apply ? '<br>Case: ' + esc(rec.apply.case || rec.apply.situation || (rec.apply.a + ' → ' + rec.apply.b)) : '');
  }

  // 哲学交互模型: the 13 live models (phil-models.js), the ones that fit this thought first — each opens full screen
  function philSection(ko) {
    if (!TK.recommendPhil) return '';
    var zh = window.MinestI18n && MinestI18n.lang() === 'zh', rec = TK.recommendPhil(ko), top = rec[0] && rec[0].s;
    return '<h2>Interactive philosophy models</h2><p class="dim">Hands-on, real-time models: hold, drag and push the scene; each action lights up the original text it stands for (Chinese, English, source). They show an idea — they don’t prove it.</p><div class="lb-grid lb-phil">' +
      rec.map(function (x) { var m = x.m, fit = top > 0 && x.s === top;
        return '<article class="lb-tile lb-ph' + (fit ? ' rec' : '') + '"><h3 data-noi18n>' + esc(zh ? m.zh : m.en) + (fit ? ' <span class="pill ok">fits this question</span>' : '') + '</h3>' +
          '<p class="lb-sub" data-noi18n>' + esc(zh ? m.en : m.zh) + '</p><p class="dim" data-noi18n>' + esc(m.src) + '</p>' +
          '<p class="lb-lv" data-noi18n>' + m.levels.map(function (l, i) { return '<i>' + (i + 1) + '</i>' + esc(l); }).join('') + '</p>' +
          '<div class="row"><button type="button" class="primary" data-phil="' + m.id + '">▶ Open model</button></div></article>'; }).join('') + '</div>';
  }

  TK.register({
    id: 'lab', en: 'Thinking Lab', zh: '思维实验室', color: '#f08c3a', line: 'Make an idea visible and try it with your own hands.',
    icon: TK.icon('<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4A2 2 0 0 0 19 18l-5-9V3"/><path d="M7.5 15h9"/>'),
    preview: function (ko) {
      var top = recommend(ko)[0], runs = TK.ks.labRunsOf(ko.id), ph = TK.recommendPhil ? TK.recommendPhil(ko)[0] : null;
      if (ph && ph.s > 0 && (!top || ph.s >= top.s)) return '<span class="pv-lab"><b data-noi18n>' + esc(window.MinestI18n && MinestI18n.lang() === 'zh' ? ph.m.zh : ph.m.en) + '</b> <span class="dim">interactive model</span></span>' + (runs.length ? '<span class="dim">' + runs.length + ' done for this object</span>' : '');
      return (top && top.s > 0 ? '<span class="pv-lab"><b>' + esc(top.d.title) + '</b> ' + esc(top.d.subtitle || '') + '</span>' : '<span class="dim">' + TK.data.labs.length + ' experiments ready</span>') +
        (runs.length ? '<span class="dim">' + runs.length + ' done for this object</span>' : '');
    },
    mount: function (el, ko, opts) {
      var ks = TK.ks;
      function paint() {
        var k = ks.object(ko.id), recs = recommend(k), runs = ks.labRunsOf(ko.id);
        el.innerHTML = '<div class="lb-wrap"><h2>Experiments</h2><p class="dim">Each experiment is a model that helps you understand — none of them proves a philosophical theory.</p><div class="lb-grid">' +
          recs.map(function (x, i) { var d = x.d; return '<article class="lb-tile' + (i === 0 && x.s > 0 ? ' rec' : '') + '"><h3>' + esc(d.title) + (i === 0 && x.s > 0 ? ' <span class="pill ok">fits this question</span>' : '') + (rvw(d) === 'pending' ? ' <span class="pill sug">review pending</span>' : ' <span class="pill ok">reviewed</span>') + '</h3><p class="lb-sub">' + esc(d.subtitle || '') + '</p><p>' + esc(d.learning_objective) + '</p><p class="dim">' + esc(d.disclaimer || '') + '</p><p class="dim">' + d.steps.length + ' steps: ' + esc(d.steps.map(function (s) { return s.title; }).join(' · ')) + '</p><div class="row"><button type="button" class="primary" data-run="' + d.interaction_id + '">▶ Start</button><button type="button" class="small ghost" data-review="' + d.interaction_id + '">' + (rvw(d) === 'pending' ? 'Mark reviewed' : 'Mark pending') + '</button></div></article>'; }).join('') +
          '</div>' + philSection(k) + '<h2>Done for this object</h2>' + (runs.length ? '<div class="lb-runs">' + runs.slice().reverse().map(function (r) { var d = TK.M.get(r.interaction_id); return '<div class="lb-run"><b>' + esc(d ? d.title : r.interaction_id) + '</b> <span class="pill ' + (r.completed ? 'ok' : '') + '">' + (r.completed ? 'completed' : 'partial') + '</span><p>' + summary(r) + '</p>' + (r.note ? '<p>“' + esc(r.note) + '”</p>' : '') + '<small class="dim">' + new Date(r.finishedAt).toLocaleString() + '</small></div>'; }).join('') + '</div>' : '<p class="dim">Nothing yet.</p>') + '</div>';
      }
      el.addEventListener('click', function (e) {
        var ph = e.target.closest('[data-phil]'); if (ph) return TK.openPhil(ph.getAttribute('data-phil'));
        var b = e.target.closest('[data-run]'); if (b) return run(b.getAttribute('data-run'));
        var r = e.target.closest('[data-review]'); if (r) { var d = TK.M.get(r.getAttribute('data-review')); TK.silently(function () { ks.setReview('lab', d.interaction_id, rvw(d) === 'pending' ? 'reviewed' : 'pending'); }); TK.toast(rvw(d) === 'pending' ? 'Marked as review pending' : 'Marked as reviewed by you'); paint(); }
      });
      function run(id) {
        var k = ks.object(ko.id);
        TK.M.play(id, { store: ks.backend, context: { query_id: k.query_id || null, text: k.original_input, framework_id: (TK.M.get(id) || {}).framework_id, object_id: k.id },
          onSaved: function (rec) { TK.silently(function () { link(rec); }); paint(); }, onClose: function () { paint(); } });
      }
      function link(rec) {
        var k = ks.object(ko.id), root = k.root_concept, about = root ? 'cc:' + root : null, def = TK.M.get(rec.interaction_id);
        ks.linkLabRun(k.id, rec);
        if (about) ks.relate('mi:' + rec.id, about, 'illustrates', { ko: k.id, provenance: 'user', source_ref: 'mi:' + rec.id, note: (def ? def.title : 'Experiment') + ' run' });
        if (rec.note) ks.addNote(k.id, rec.note, { from: def ? def.title : 'Thinking Lab', ref: 'mi:' + rec.id, about: about, kind: 'view' });
        if (rec.question) ks.addNote(k.id, rec.question, { from: def ? def.title : 'Thinking Lab', ref: 'mi:' + rec.id, about: about, kind: 'question' });
        var a = rec.apply;
        if (a && a.case && !a.situation) { var cc = ks.concept(a.case, { kind: 'case', provenance: 'user' }); ks.addToObject(k.id, cc); if (about) ks.relate('cc:' + cc, about, 'illustrates', { ko: k.id, provenance: 'user', source_ref: 'mi:' + rec.id, note: (def ? def.title : '') + ' — your example' }); }
        if (a && a.situation) { var c = ks.concept(a.situation, { kind: 'case', provenance: 'user' }); ks.addToObject(k.id, c); if (about) ks.relate('cc:' + c, about, 'illustrates', { ko: k.id, provenance: 'user', source_ref: 'mi:' + rec.id, note: a.kind || '' }); }
        if (a && a.a && a.b) {
          var ca = ks.concept(a.a, { kind: 'case', provenance: 'user' }), cb = ks.concept(a.b, { kind: 'case', provenance: 'user' });
          ks.addToObject(k.id, ca); ks.addToObject(k.id, cb);
          ks.relate('cc:' + ca, 'cc:' + cb, a.verdict === 'causal' ? 'leads-to' : 'related', { ko: k.id, provenance: 'user', source_ref: 'mi:' + rec.id, note: 'Your judgment: ' + a.verdict + (a.checks && a.checks.length ? ' · checks: ' + a.checks.join(', ') : '') });
        }
        TK.toast('Saved to “' + k.title + '” — see it in the Framework and the Graph');
      }
      paint();
      if (opts && opts.lab && TK.M.get(opts.lab)) { var l = opts.lab; opts.lab = null; setTimeout(function () { run(l); }, 60); }
      return { refresh: paint };
    }
  });
})();
