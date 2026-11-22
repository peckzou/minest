/* Minest · Cognitive Navigation Engine — lab prototype (window.MinestCompass)
   Input (a word, a question, a thought, an event, a goal) → what kind of input it is → where it sits in the taxonomy
   (one primary place + related places + an "uncertain" flag) → which frameworks fit (with scope / limits / kind) →
   which micro-interactions they offer. Every step gives its reasons.
   Local rules only (v0.1): matching cues from tools/compass/taxonomy.json + the frameworks' own names, concepts and
   the sidecar tools/compass/frameworks-ext.json + what the user corrected before. No network, no AI call.
   The engine outputs ids only (taxonomy node ids, framework ids, interaction ids): the Micro-Interaction Engine never
   needs to know how a thought was classified.
   Store: anything with get / set / keys (MinestKnowledge's interface). Keys:
     'cn:q:<id>'   { id, text, at, result, confirmed: { node, framework } | null }
     'cn:fix:<id>' { id, cues:[…], node, framework, at }   — a correction, reused for similar inputs */
(function (root) {
  'use strict';
  var TAX = { nodes: [], by: {} }, FW = [], FWBY = {}, store = null;

  function rid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function norm(s) { return String(s || '').toLowerCase().replace(/[\s　]+/g, ' ').trim(); }
  var CJK = /[㐀-鿿]/;

  // a cue matches when it appears in the text — CJK as a substring, Latin as a whole word / phrase
  function hit(text, cue) {
    cue = norm(cue); if (!cue) return false;
    if (CJK.test(cue)) return text.indexOf(cue) >= 0;
    var re = new RegExp('(^|[^a-z0-9])' + cue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '([^a-z0-9]|$)');
    return re.test(text);
  }
  function weight(cue, weak) { var n = CJK.test(cue) ? cue.length : cue.split(' ').length * 2; return (weak ? 0.35 : 1) * (0.8 + Math.min(n, 6) * 0.2); }

  function path(id) { var out = []; var n = TAX.by[id]; while (n) { out.unshift(n.id); n = TAX.by[n.parent]; } return out; }
  function pathNames(id) { return path(id).map(function (x) { return TAX.by[x].en || TAX.by[x].name; }); }
  function depth(id) { return path(id).length; }

  // ------------------------------------------------------------------ data
  function load(o) {
    TAX.nodes = (o.taxonomy && o.taxonomy.nodes) || []; TAX.by = {};
    TAX.nodes.forEach(function (n) { TAX.by[n.id] = n; });
    var ext = (o.ext && o.ext.frameworks) || {};
    FW = []; FWBY = {};
    (o.frameworks || []).forEach(function (f) { add(f, ext[f.id]); });
    Object.keys(ext).forEach(function (id) { if (ext[id].labOnly && !FWBY[id]) add({ id: id, name: ext[id].name, collection: ext[id].collection, structureType: ext[id].structureType, summary: ext[id].summary, limits: ext[id].limits, concepts: [] }, ext[id]); });
    store = o.store || store;
    return api;
  }
  function add(f, x) {
    x = x || {};
    var c = {
      framework_id: f.id, title: f.name, zh: x.zh || f.name, discipline: f.collection, kind: x.kind || 'model',
      taxonomy_path: (x.taxonomy_path || []).filter(function (p) { return TAX.by[p]; }),
      related_concepts: (f.concepts || []).map(function (k) { return { id: k.id, name: k.name }; }),
      theoretical_sources: x.theoretical_sources || (f.source ? [f.source] : []),
      core_principles: x.core_principles || (f.summary ? [f.summary] : []),
      applicable_scenarios: x.applicable_scenarios || (f.scope ? [f.scope] : []),
      limitations: x.limits || f.limits || '',
      interaction_ids: x.interaction_ids || [], concept_for_interaction: x.concept_for_interaction || {},
      summary: f.summary || '', labOnly: !!x.labOnly, version: f.version || '0.1.0',
      cues: (x.terms || []).concat([f.name, f.author || ''].filter(Boolean)),
      ccues: (f.concepts || []).map(function (k) { return k.name; }).filter(function (n) { return n && n.length > 3; })   // concept names: weaker, and they don't move the place
    };
    FW.push(c); FWBY[f.id] = c;
  }

  // ------------------------------------------------------------------ input type
  var TYPES = [   // a hypothesis is often phrased as a question (“如果…会怎样？”), so it is checked first
    { id: 'hypothesis', label: 'Hypothesis', re: [/^(如果|假如|假设|要是|也许|可能)/, /(会不会|说不定)/, /^(if|suppose|maybe|perhaps)\b/i] },
    { id: 'question', label: 'Question', re: [/[?？]\s*$/, /^(为什么|为何|怎么|如何|是不是|是否|能不能|有没有|什么是)/, /(吗|呢)[?？]?\s*$/, /(是什么|为什么|怎么办|怎么样|会怎样|对吗)[?？]?\s*$/, /^(why|how|what|is|are|can|does|do|should)\b/i] },
    { id: 'goal', label: 'Goal', re: [/^(我)?(想要?|希望|打算|计划|准备|要学|目标是)/, /^(我|要|想)?.{0,3}(学会|掌握|做到)/, /^(i want|i'd like|i plan|my goal|i hope)\b/i] },
    { id: 'opinion', label: 'Opinion', re: [/(我觉得|我认为|我相信|在我看来|应该|最好|不应该)/, /\b(i think|i believe|i feel|should)\b/i] }
  ];
  function inputType(raw) {
    var s = String(raw || '').trim();
    for (var i = 0; i < TYPES.length; i++) for (var j = 0; j < TYPES[i].re.length; j++) {
      var m = s.match(TYPES[i].re[j]); if (m) return { id: TYPES[i].id, label: TYPES[i].label, why: 'contains “' + (m[0].trim() || s.slice(-1)) + '”' };
    }
    if ((CJK.test(s) ? s.length <= 8 : s.split(/\s+/).length <= 3) && !/[，。,.!！]/.test(s)) return { id: 'concept', label: 'Concept / term', why: 'a short term' };
    return { id: 'statement', label: 'Statement / event', why: 'no question, goal or hypothesis markers' };
  }

  // ------------------------------------------------------------------ classify
  function fixes() { return store ? store.keys('cn:fix:').map(function (k) { return store.get(k); }).filter(Boolean) : []; }

  function classify(raw) {
    var text = norm(raw), reasons = [], raws = {}, cuesBy = {}, allCues = [], structural = null;
    TAX.nodes.forEach(function (n) {
      var s = 0, got = [];
      (n.terms || []).forEach(function (t) { if (hit(text, t)) { s += weight(t); got.push(t); } });
      (n.weak || []).forEach(function (t) { if (hit(text, t)) { s += weight(t, true); got.push(t); } });
      (n.patterns || []).forEach(function (re) { var m = text.match(new RegExp(re, 'i')); if (m) { s += 3.2; got.push(m[0].trim()); structural = structural || n.id; } });   // phrasing cues such as “X 后 Y 提高”
      if (s) { raws[n.id] = s; cuesBy[n.id] = got; allCues = allCues.concat(got); }
    });
    // frameworks' own cues also point at their primary place
    var fwRaw = {};
    FW.forEach(function (f) {
      var s = 0, got = [];
      f.cues.forEach(function (t) { if (t && hit(text, t)) { s += weight(t) * 1.2; got.push(t); } });
      var placeS = s;
      (f.ccues || []).forEach(function (t) { if (hit(text, t)) { s += weight(t) * 0.5; got.push(t); } });
      if (s) { fwRaw[f.framework_id] = { s: s, cues: got }; allCues = allCues.concat(got); var p = f.taxonomy_path[0]; if (p && placeS) raws[p] = (raws[p] || 0) + placeS * 0.5; }
    });
    // what the user corrected before
    var fixHits = [];
    fixes().forEach(function (fx) {
      if (!fx.cues || !fx.cues.length) return;
      var shared = fx.cues.filter(function (c) { return allCues.indexOf(c) >= 0; });
      var ov = shared.length / fx.cues.length;
      if (ov >= 0.6) { fixHits.push({ fix: fx, ov: ov }); if (fx.node && TAX.by[fx.node]) raws[fx.node] = (raws[fx.node] || 0) + 3 * ov; }
    });
    // primary = highest raw score; a deeper node wins a near tie (more specific)
    var ids = Object.keys(raws).sort(function (a, b) { return (raws[b] - raws[a]) || (depth(b) - depth(a)); });
    var primary = ids[0] || null;
    if (primary) ids.forEach(function (id) { if (id !== primary && raws[id] >= raws[primary] * 0.9 && depth(id) > depth(primary) && path(id).indexOf(primary) >= 0) primary = id; });
    // what the user corrected before wins; otherwise the way the sentence is built (a cause-and-effect claim) wins over topic words
    var bestFix = fixHits.filter(function (h) { return h.fix.node && TAX.by[h.fix.node]; }).sort(function (x, y) { return y.ov - x.ov; })[0];
    if (bestFix) primary = bestFix.fix.node;
    else if (structural) { primary = structural; reasons.push('Phrased as a cause-and-effect claim (“' + uniq(cuesBy[structural] || []).filter(function (c) { return c.length > 3; })[0] + '”) — the topic words become a related place'); }
    var top = primary ? raws[primary] : 0, onPath = primary ? path(primary) : [], seeAlso = [];
    // "see also" links in the taxonomy (e.g. causation ↔ causal inference) always come along as related places
    if (primary) onPath.forEach(function (p) { (TAX.by[p].see_also || []).forEach(function (sa) { if (TAX.by[sa] && onPath.indexOf(sa) < 0) { seeAlso.push(sa); raws[sa] = Math.max(raws[sa] || 0, top * 0.5); if (ids.indexOf(sa) < 0) ids.push(sa); } }); });
    ids.sort(function (a, b) { return (raws[b] - raws[a]) || (depth(b) - depth(a)); });
    var related = ids.filter(function (id) { return id !== primary && onPath.indexOf(id) < 0 && path(id).indexOf(primary) < 0 && raws[id] >= top * 0.35; }).slice(0, 3);
    var rival = ids.filter(function (id) { return id !== primary && seeAlso.indexOf(id) < 0 && onPath.indexOf(id) < 0 && path(id)[0] !== onPath[0]; })[0];
    var uncertain = !primary || top < 1.1 || (rival && raws[rival] >= top * 0.85);

    if (primary) reasons.push((cuesBy[primary] ? '“' + uniq(cuesBy[primary]).slice(0, 4).join('”, “') + '”' : fixHits.some(function (h) { return h.fix.node === primary; }) ? 'Your earlier correction' : 'A framework you named') + ' → ' + pathNames(primary).join(' › '));
    seeAlso.forEach(function (id) { reasons.push(pathNames(primary).slice(-1)[0] + ' is usually discussed with ' + pathNames(id).join(' › ') + ' (a “see also” link in the taxonomy)'); });
    related.forEach(function (id) { if (cuesBy[id]) reasons.push('Also mentions “' + uniq(cuesBy[id]).slice(0, 3).join('”, “') + '” → ' + pathNames(id).join(' › ')); });
    fixHits.forEach(function (h) { reasons.push('You placed a similar thought under ' + (TAX.by[h.fix.node] ? pathNames(h.fix.node).join(' › ') : '—') + (h.fix.framework && FWBY[h.fix.framework] ? ' with ' + FWBY[h.fix.framework].title : '') + ' before'); });
    if (uncertain) reasons.push(primary ? (rival ? pathNames(rival).join(' › ') + ' is almost as likely — the placement is uncertain' : 'Few cues — the placement is uncertain') : 'No clear cues — please choose a place yourself');

    // frameworks: fit their places to the result
    var scored = FW.map(function (f) {
      var s = 0, why = [];
      f.taxonomy_path.forEach(function (p, i) {
        var w = i === 0 ? 1 : 0.6, v = 0;
        if (p === primary) v = top * 1.1; else if (onPath.indexOf(p) >= 0) v = top * 0.35; else if (raws[p]) v = raws[p] * 0.8; else if (primary && path(p).indexOf(primary) >= 0) v = top * 0.3;
        if (v) { s += v * w; why.push(pathNames(p).slice(-1)[0]); }
      });
      if (fwRaw[f.framework_id]) { s += fwRaw[f.framework_id].s; why.push('mentions “' + uniq(fwRaw[f.framework_id].cues).slice(0, 2).join('”, “') + '”'); }
      fixHits.forEach(function (h) { if (h.fix.framework === f.framework_id) { s += 3 * h.ov; why.push('you chose it before'); } });
      return { f: f, s: s, why: uniq(why) };
    }).filter(function (x) { return x.s > 0.4; }).sort(function (a, b) { return b.s - a.s; }).slice(0, 4);

    var frameworks = scored.map(function (x) {
      var f = x.f;
      return { framework_id: f.framework_id, title: f.title, zh: f.zh, kind: f.kind, score: round(x.s), why: x.why,
        core_principles: f.core_principles, applicable_scenarios: f.applicable_scenarios, limitations: f.limitations,
        interaction_ids: f.interaction_ids, taxonomy_path: f.taxonomy_path, related_concepts: f.related_concepts.slice(0, 8), labOnly: f.labOnly };
    });
    var interactions = [];
    frameworks.forEach(function (f) { f.interaction_ids.forEach(function (i) { if (!interactions.some(function (x) { return x.interaction_id === i; })) interactions.push({ interaction_id: i, framework_id: f.framework_id }); }); });

    return {
      text: String(raw || ''), type: inputType(raw), primary: primary ? { id: primary, path: path(primary), names: pathNames(primary), score: round(top) } : null,
      related: related.map(function (id) { return { id: id, names: pathNames(id), score: round(raws[id]) }; }),
      uncertain: !!uncertain, cues: uniq(allCues), frameworks: frameworks, interactions: interactions, reasons: reasons, engine: 'local-rules/0.1'
    };
  }
  function uniq(a) { return a.filter(function (x, i) { return a.indexOf(x) === i; }); }
  function round(n) { return Math.round(n * 100) / 100; }

  // ------------------------------------------------------------------ records
  function saveQuery(result, confirmed) {
    var prev = queries()[0];   // asking the same thing again right away updates that record instead of adding another
    var id = prev && prev.text === result.text && !prev.confirmed ? prev.id : rid(), rec = { id: id, text: result.text, at: Date.now(), result: result, confirmed: confirmed || null };
    if (store) store.set('cn:q:' + id, rec); return rec;
  }
  function confirm(qid, choice) {   // choice = { node, framework } — what the user says is right
    var q = store && store.get('cn:q:' + qid); if (!q) return null;
    q.confirmed = { node: choice.node || (q.result.primary && q.result.primary.id), framework: choice.framework || (q.result.frameworks[0] && q.result.frameworks[0].framework_id), at: Date.now() };
    var changed = (q.result.primary ? q.result.primary.id : null) !== q.confirmed.node || (q.result.frameworks[0] ? q.result.frameworks[0].framework_id : null) !== q.confirmed.framework;
    store.set('cn:q:' + qid, q);
    if (changed && q.result.cues.length) { var fid = rid(); store.set('cn:fix:' + fid, { id: fid, cues: q.result.cues.slice(0, 8), node: q.confirmed.node, framework: q.confirmed.framework, at: Date.now(), from: qid }); }
    return q;
  }
  function queries() { return store ? store.keys('cn:q:').map(function (k) { return store.get(k); }).filter(Boolean).sort(function (a, b) { return b.at - a.at; }) : []; }

  // ------------------------------------------------------------------ AI second opinion (optional, never required)
  // Uses the app's existing AI service (/api/minest/ai-chat, same token / endpoint keys as the app). The model may only
  // pick from ids we send (closed set); anything else is dropped. The local result stays the answer until the user
  // adopts the suggestion.
  function aiConfig() {
    var ls = function (k) { try { return root.localStorage.getItem(k); } catch (e) { return null; } };
    return { endpoint: ls('minest_ai_chat_endpoint') || 'https://minest-app.vercel.app/api/minest/ai-chat', token: ls('minest_ai_token') };
  }
  function assist(result, fetchFn) {
    var cfg = aiConfig(); fetchFn = fetchFn || (root.fetch && root.fetch.bind(root));
    if (!cfg.token) return Promise.resolve({ ok: false, error: 'No Minest AI token on this device — the local result is all there is.' });
    var nodes = TAX.nodes.map(function (n) { return n.id; }), fws = FW.map(function (f) { return f.framework_id + ' (' + f.title + ')'; });
    var prompt = 'You are a classifier for a personal knowledge app. Do not chat. Reply with ONE JSON object only, no prose.\n' +
      'Input: ' + JSON.stringify(result.text) + '\n' +
      'Local engine said: type=' + result.type.id + ', place=' + (result.primary ? result.primary.id : 'none') + ', frameworks=' + result.frameworks.map(function (f) { return f.framework_id; }).join(',') + '\n' +
      'Choose ONLY from these taxonomy ids: ' + nodes.join(', ') + '\n' +
      'and ONLY from these framework ids: ' + fws.join('; ') + '\n' +
      'JSON shape: {"type":"fact|opinion|question|hypothesis|goal|concept","place":"<taxonomy id>","related":["<taxonomy id>"],"frameworks":["<framework id>"],"reason":"<one or two sentences>","confidence":0-1}. ' +
      'If a framework is a philosophical position, do not present it as scientific fact.';
    return fetchFn(cfg.endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Minest-Token': cfg.token }, body: JSON.stringify({ prompt: prompt }) })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (d.error) return { ok: false, error: d.error };
        var m = String(d.reply || '').match(/\{[\s\S]*\}/); if (!m) return { ok: false, error: 'The AI reply had no JSON.' };
        var j; try { j = JSON.parse(m[0]); } catch (e) { return { ok: false, error: 'The AI reply was not valid JSON.' }; }
        var s = { type: j.type, place: TAX.by[j.place] ? j.place : null, related: (j.related || []).filter(function (x) { return TAX.by[x]; }).slice(0, 3),
          frameworks: (j.frameworks || []).filter(function (x) { return FWBY[x]; }).slice(0, 4), reason: String(j.reason || '').slice(0, 400), confidence: +j.confidence || null };
        if (!s.place && !s.frameworks.length) return { ok: false, error: 'The AI picked nothing from the allowed lists.' };
        return { ok: true, suggestion: s };
      }).catch(function (e) { return { ok: false, error: 'AI unavailable: ' + (e && e.message || e) }; });
  }

  var api = {
    assist: assist, aiReady: function () { return !!aiConfig().token; },
    load: load, classify: classify, inputType: inputType, saveQuery: saveQuery, confirm: confirm, queries: queries, fixes: fixes,
    node: function (id) { return TAX.by[id] || null; }, nodes: function () { return TAX.nodes.slice(); }, path: path, pathNames: pathNames,
    framework: function (id) { return FWBY[id] || null; }, frameworks: function () { return FW.slice(); },
    setStore: function (s) { store = s; }
  };
  root.MinestCompass = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
