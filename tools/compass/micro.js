/* Minest · Knowledge Micro-Interaction Engine — lab prototype (window.MinestMicro)
   One runner for every micro-interaction. A definition (format "minest.micro/1", schema in schema/) declares
   steps, initial_state, user_actions, state_transitions, completion_criteria, feedback_rules and result_schema;
   the runner owns the state machine, the feedback, the step gate and the record. Scenes (what is drawn in a step)
   are registered separately by name (MinestMicro.scene) — they only render and call act(action, value).
   The runner knows nothing about classification: it is called with an interaction_id (from the Compass) and an
   optional context { query_id, text }.
   Records (store with get / set / keys):
     'mi:run:<id>'   the result (shape = the definition's result_schema)
     'rel:lab-<id>'  a relationship the user stated in an "apply" step — same shape as philo.js 'rel:' records,
                     marked userJudgment: true (Minest never infers causes). */
(function (root) {
  'use strict';
  var DEFS = {}, SCENES = {};
  function rid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  // ------------------------------------------------------------------ conditions
  function get(st, k) { return k.split('.').reduce(function (o, p) { return o == null ? undefined : o[p]; }, st); }
  function test(c, st) {
    if (!c) return true;
    if (c.all) return c.all.every(function (x) { return test(x, st); });
    if (c.any) return c.any.some(function (x) { return test(x, st); });
    if (c.truthy) return c.truthy.every(function (k) { return !!get(st, k); });
    if (c.gte) return Object.keys(c.gte).every(function (k) { return (get(st, k) || 0) >= c.gte[k]; });
    if (c.eq) return Object.keys(c.eq).every(function (k) { return get(st, k) === c.eq[k]; });
    return false;
  }

  // ------------------------------------------------------------------ the state machine (no DOM — testable)
  function session(def, ctx) {
    var st = clone(def.initial_state), log = [], startedAt = Date.now(), ids = def.steps.map(function (s) { return s.id; });
    st.step = st.step || ids[0];
    function val(v, payload) { return v === '$value' ? payload : v; }
    function dispatch(action, payload) {
      var t = def.state_transitions.filter(function (x) { return x.on === action && (x.from === st.step || x.from === '*'); })[0];
      if (!t) return false;
      if (t.advance) {
        var i = ids.indexOf(st.step) + t.advance;
        if (t.advance > 0 && !canNext()) return false;
        if (i < 0 || i >= ids.length) return false;
        st.step = ids[i]; st.last = null;
      }
      if (t.set) Object.keys(t.set).forEach(function (k) { st[k] = clone(val(t.set[k], payload) == null ? null : val(t.set[k], payload)); });
      if (t.inc) Object.keys(t.inc).forEach(function (k) { st[k] = (st[k] || 0) + t.inc[k]; });
      if (t.merge) { var m = val(t.merge, payload) || {}; Object.keys(m).forEach(function (k) { st[k] = m[k]; }); }
      log.push({ at: Date.now(), action: action, step: st.step });
      return true;
    }
    function canNext() { return test(def.completion_criteria[st.step], st); }
    function feedback() {
      return def.feedback_rules.filter(function (r) { return r.step === st.step && test(r.when, st); });
    }
    function result() {
      return {
        interaction_id: def.interaction_id, framework_id: def.framework_id, concept_id: def.concept_id || null, version: def.version,
        query_id: (ctx && ctx.query_id) || null, startedAt: startedAt, finishedAt: Date.now(),
        completed: test(def.completion_criteria.interaction, st),
        judge1: st.judge1, judge2: st.judge2, changedMind: !!(st.judge1 && st.judge2 && st.judge1 !== st.judge2),
        probes: { pressA: st.pressA, curtain: st.curtain, stopped: st.stopped, houseOrders: st.houseOrders, shipTries: st.shipTries, shipWrong: st.shipWrong },
        apply: st.apply, note: st.note || '', question: st.question || '', log: log.slice()
      };
    }
    return { def: def, state: st, dispatch: dispatch, canNext: canNext, feedback: feedback, result: result, stepIndex: function () { return ids.indexOf(st.step); }, step: function () { return def.steps[ids.indexOf(st.step)]; } };
  }

  // ------------------------------------------------------------------ records
  function save(store, s) {
    var r = s.result(), id = rid();
    r.id = id;
    if (r.apply && r.apply.a && r.apply.b) {
      var rel = 'lab-' + id;
      store.set('rel:' + rel, { id: rel, a: { id: 'text:' + r.apply.a, title: r.apply.a }, b: { id: 'text:' + r.apply.b, title: r.apply.b },
        type: r.apply.verdict === 'causal' ? 'leads-to' : 'related', note: r.apply.note || '', tool: r.interaction_id, userJudgment: true,
        checks: r.apply.checks || [], verdict: r.apply.verdict, createdAt: Date.now(), updatedAt: Date.now() });
      r.apply.relation_id = rel;
    }
    store.set('mi:run:' + id, r);
    s.state.saved = true;
    return r;
  }
  function runs(store) { return store.keys('mi:run:').map(function (k) { return store.get(k); }).filter(Boolean).sort(function (a, b) { return b.finishedAt - a.finishedAt; }); }

  // ------------------------------------------------------------------ the player (DOM)
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function play(id, opt) {
    opt = opt || {};
    var def = DEFS[id]; if (!def) throw new Error('No micro-interaction ' + id);
    var s = session(def, opt.context), doc = root.document, savedRec = null;
    var ov = doc.createElement('div'); ov.className = 'mi-ov'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-label', def.title);
    ov.innerHTML = '<div class="mi-card"><header class="mi-hd"><div><b>' + esc(def.title) + '</b><small>' + esc(def.subtitle || '') + '</small></div>' +
      '<ol class="mi-dots">' + def.steps.map(function (x, i) { return '<li data-i="' + i + '"><span>' + (i + 1) + '</span>' + esc(x.title) + '</li>'; }).join('') + '</ol>' +
      '<button class="mi-x" type="button" aria-label="关闭">×</button></header>' +
      '<p class="mi-prompt"></p><div class="mi-stage"></div><div class="mi-fb" aria-live="polite"></div>' +
      '<footer class="mi-ft"><span class="mi-disc">' + esc(def.disclaimer || '') + '</span><button type="button" class="mi-back">上一步</button><button type="button" class="mi-next">下一步</button></footer></div>';
    (opt.host || doc.body).appendChild(ov);
    var stage = ov.querySelector('.mi-stage'), fb = ov.querySelector('.mi-fb'), prompt = ov.querySelector('.mi-prompt'), cur = null, curStep = null;

    function act(action, value) { if (s.dispatch(action, value)) paint(); }
    function mount() {
      if (cur && cur.destroy) cur.destroy(); stage.innerHTML = '';
      var step = s.step(), fn = SCENES[step.scene];
      prompt.textContent = step.prompt || '';
      cur = fn ? fn({ el: stage, st: s.state, def: def, step: step, act: act, content: def.content || {}, context: opt.context || {},
        save: function () { savedRec = save(opt.store, s); if (opt.onSaved) opt.onSaved(savedRec); paint(); return savedRec; }, saved: function () { return savedRec; } }) : null;
      curStep = step.id;
    }
    function paint() {
      if (s.state.step !== curStep) mount();
      else if (cur && cur.update) cur.update(s.state);
      var i = s.stepIndex();
      [].forEach.call(ov.querySelectorAll('.mi-dots li'), function (li, k) { li.className = k < i ? 'done' : k === i ? 'on' : ''; });
      var f = s.feedback(), lastRule = f[f.length - 1];
      fb.className = 'mi-fb' + (lastRule ? ' show ' + (lastRule.tone || 'info') : '');
      fb.textContent = lastRule ? lastRule.say : '';
      var last = i === def.steps.length - 1;
      ov.querySelector('.mi-back').disabled = i === 0;
      var nx = ov.querySelector('.mi-next'); nx.textContent = last ? (savedRec ? '完成' : '先保存') : '下一步';
      nx.disabled = last ? !savedRec : !s.canNext();
    }
    function close() { if (cur && cur.destroy) cur.destroy(); ov.remove(); doc.removeEventListener('keydown', key); if (opt.onClose) opt.onClose(savedRec); }
    function key(e) { if (e.key === 'Escape') close(); }
    ov.querySelector('.mi-x').onclick = close;
    ov.querySelector('.mi-back').onclick = function () { act('back'); };
    ov.querySelector('.mi-next').onclick = function () { if (s.stepIndex() === def.steps.length - 1) { if (savedRec) close(); } else act('next'); };
    doc.addEventListener('keydown', key);
    paint();
    return { session: s, close: close };
  }

  var api = {
    register: function (def) { DEFS[def.interaction_id] = def; return def; }, get: function (id) { return DEFS[id] || null; },
    scene: function (name, fn) { SCENES[name] = fn; }, session: session, test: test, save: save, runs: runs, play: play
  };
  root.MinestMicro = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
