/* Minest · World Search 2.0 — inside the toolkit frame (after 1.0's scripts, see toolkit.html)
   Answers the 2.0 search box (v2.js) over postMessage, next to 1.0's own commands:
     search2 → what the knowledge engine makes of the text (place, confidence, candidates), everything it knows that
               matches (engine2.js search) and what each of the five cards has for it
     open2   → the card about to open lands on one thinking model / experiment picked in the results
   and hands two things to the page instead of 1.0's host: a philosophy model opens in 模型馆 2.0, the island from here.
   The open tool also shows the engine's confidence under its title. */
(function () {
  'use strict';
  var TK = window.MinestToolkit, E = window.MinestEngine2, C = window.MinestCompass; if (!TK || !E || !C) return;
  var ZH = (window.__TK_DATA && window.__TK_DATA['i18n/zh.json'] && window.__TK_DATA['i18n/zh.json'].strings) || {};
  function zh(x) { return ZH[x] || x; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function post(m) { try { window.parent.postMessage(Object.assign({ type: 'minest-ws2' }, m), location.origin); } catch (e) {} }   // this site's pages only
  var TYPE = { question: '问题', concept: '概念', goal: '目标', hypothesis: '假设', opinion: '观点', statement: '陈述' };
  var ix = null;
  function index() { return ix || (ix = E.buildIndex({ phil: TK.philModels || [], frameworks: C.frameworks(), templates: TK.data.templates, models: TK.data.models, labs: TK.data.labs, nodes: C.nodes(), zh: zh })); }
  function ready(f) { if (TK.booted && TK.data.models) f(); else setTimeout(function () { ready(f); }, 100); }

  function cards(text, a) {   // what each of the five cards has for the text (nothing is created)
    var seed = TK.seedFor(text);
    var fake = { original_input: text, title: text, content_type: a.type.id, seed: seed ? seed.id : null, suggested_labs: (C.classify(text).interactions || []).map(function (i) { return i.interaction_id; }),
      placement: { suggested: { primary: a.primary ? a.primary.id : null, related: a.related.map(function (x) { return x.id; }) } } };
    var models = TK.recommendModels ? TK.recommendModels(fake) : [], labs = TK.recommendLabs ? TK.recommendLabs(fake).filter(function (x) { return x.s > 0; }) : [];
    var phil = TK.recommendPhil ? TK.recommendPhil(fake).filter(function (x) { return x.s > 0; }) : [];
    var mine = TK.ks.objects().filter(function (o) { return o.original_input === text; })[0];
    return {
      frameworks: a.frameworks.slice(0, 3).map(function (f) { return f.zh && f.zh !== f.title ? f.zh : zh(f.title); }),
      models: models.slice(0, 2).map(function (m) { return zh(m.title); }),
      labs: labs.slice(0, 2).map(function (x) { return zh(x.d.title); }),
      phil: phil.slice(0, 2).map(function (x) { return { id: x.m.id, zh: x.m.zh }; }), philCount: phil.length,
      saved: !!mine, concepts: mine ? mine.concept_ids.length : 0, links: mine ? TK.ks.relations({ ko: mine.id }).length : 0
    };
  }
  window.addEventListener('message', function (e) {
    var m = e.data; if (!m || m.type !== 'minest-toolkit-cmd' || e.source !== window.parent || e.origin !== location.origin) return;
    if (m.cmd === 'search2') ready(function () {
      var q = String(m.input || '').trim(), out = { action: 'results', id: m.id, q: q, size: index().length, phil: (TK.philModels || []).length };
      try {
        if (q) {
          var a = E.analyze(C, q);
          out.analysis = { type: TYPE[a.type.id] || zh(a.type.label), typeId: a.type.id, place: a.primary ? a.primary.path.map(function (id) { var n = C.node(id); return n ? n.name : id; }).join(' › ') : null, confidence: a.confidence, uncertain: a.uncertain, cues: a.cues,
            candidates: a.candidates.slice(0, 3).map(function (c) { return { id: c.id, zh: c.zh, share: c.share, isNew: c.isNew }; }) };
          out.hits = E.search(index(), q, { scope: m.scope, analysis: a, limit: m.scope && m.scope !== 'all' ? 24 : 14 });
          out.cards = cards(q, a);
        }
      } catch (x) { out.error = String(x && x.message || x); }
      post(out);
    });
    else if (m.cmd === 'open2') {   // sent just before 1.0's own “open” for the same card and text: that open then lands on the picked model / experiment
      var p = pick = { card: m.card, input: String(m.input || '').trim(), model: m.model || null, lab: m.lab || null };
      setTimeout(function () { if (pick === p) pick = null; }, 4000);
    }
  });
  var pick = null, open1 = TK.open;
  TK.open = function (card, o) {
    o = o || {};
    if (pick && card === pick.card && !o.model && !o.lab) {
      var k = o.objectId && TK.ks.object(o.objectId), text = o.input != null ? String(o.input).trim() : k ? k.original_input : null;
      if (text === pick.input) { if (pick.model) o.model = pick.model; if (pick.lab) o.lab = pick.lab; pick = null; }
    }
    return open1.call(TK, card, o);
  };

  // philosophy models and the island: the 2.0 page opens them (1.0's host would look for them next to this folder)
  TK.openPhil = function (id) { post({ action: 'phil', id: id }); };
  TK.openIsland = function () { post({ action: 'island' }); };

  // the engine's reading under the title of the open thought
  var css = document.createElement('style');
  css.textContent = '.e2-strip{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin-top:6px;font:500 11.5px/1.2 -apple-system,BlinkMacSystemFont,"PingFang SC",sans-serif;letter-spacing:0;text-transform:none;color:inherit}' +
    '.e2-strip b{font-weight:700;padding:2px 7px;border-radius:999px;background:linear-gradient(90deg,#9b5de5,#5e9cff);color:#fff;font-size:10.5px}' +
    '.e2-strip .m{position:relative;width:64px;height:6px;border-radius:3px;background:rgba(128,128,160,.28);overflow:hidden}.e2-strip .m i{position:absolute;inset:0 auto 0 0;border-radius:3px;background:linear-gradient(90deg,#f08c3a,#1fbf75)}' +
    '.e2-strip span{padding:2px 7px;border-radius:999px;background:rgba(128,128,160,.2)}.e2-strip span.new{box-shadow:inset 0 0 0 1px #5e9cff}.e2-strip span.m{padding:0}' +
    /* inside the search bar's dark panel the thought's title and its buttons are light (1.0 leaves them dark on dark) */
    'html.tk-panel .tk-obj h2{color:#f2f4ff}html.tk-panel .tk-obj h2 small,html.tk-panel .tk-place{color:rgba(220,225,255,.66)}html.tk-panel .tk-objact .ghost{color:#e8eaff;border-color:rgba(255,255,255,.3)}';
  document.head.appendChild(css);
  function strip() {
    var h = document.getElementById('tk-title'), k = TK.ko && TK.ks.object(TK.ko.id); if (!h || !k || h.querySelector('.e2-strip')) return;
    var a; try { a = E.analyze(C, k.original_input || k.title); } catch (e) { return; }
    var el = document.createElement('span'); el.className = 'e2-strip';
    el.innerHTML = '<b>知识引擎 2.0</b>' + (a.primary ? '<span class="m" title="置信度 Confidence"><i style="width:' + a.confidence + '%"></i></span>置信度 ' + a.confidence + '%' +
      a.candidates.slice(0, 3).map(function (c) { return '<span class="' + (c.isNew ? 'new' : '') + '">' + esc(c.zh) + ' ' + c.share + '%</span>'; }).join('') : '没有找到明确的位置 · 请自己选一个');
    h.appendChild(el);
  }
  ready(function () {
    var h = document.getElementById('tk-title'); if (!h || !window.MutationObserver) return;
    new MutationObserver(strip).observe(h, { childList: true }); strip();
  });
})();
