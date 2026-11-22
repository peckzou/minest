/* Minest · Cognitive Toolkit — the shell (window.MinestToolkit)
   One input → one KnowledgeObject → five cards that all read and write it through MinestKS:
     Thought Compass (direction) · Framework Card (structure) · Thinking Models (method) · Thinking Lab (experience) ·
     Knowledge Graph (connection).
   Level 1 (manual) works with no engine at all; the local Compass engine only adds suggestions (provenance 'rule'),
   which the user confirms or changes. Entry points for later hosts (e.g. a Philosophers' Island scene):
     MinestToolkit.open(card, { objectId | input | conceptId, model, lab, anchor })   and   #ko=<id>&card=<card>&lab=<id>&model=<id> */
(function () {
  'use strict';
  var C = window.MinestCompass, M = window.MinestMicro, KS = window.MinestKS;
  var PFX = 'minest.lab.kw.';
  // every write is stamped (minest.toolkit.meta: key → time) so cloud sync can merge per record, newest first
  var META = 'minest.toolkit.meta', meta = (function () { try { return JSON.parse(localStorage.getItem(META) || '{}') || {}; } catch (e) { return {}; } })();
  function saveMeta() { try { localStorage.setItem(META, JSON.stringify(meta)); } catch (e) {} }
  function raw(k, v) { try { if (v == null) localStorage.removeItem(PFX + k); else localStorage.setItem(PFX + k, JSON.stringify(v)); } catch (e) { toast('Could not save in this browser: ' + e.message); } }
  var backend = {
    get: function (k) { try { var v = localStorage.getItem(PFX + k); return v ? JSON.parse(v) : null; } catch (e) { return null; } },
    set: function (k, v) { raw(k, v); meta[k] = Math.max(Date.now(), (meta[k] || 0) + 1); saveMeta(); if (window.MinestToolkitCloud) MinestToolkitCloud.touch(k); },
    applyRemote: function (k, v, t) { raw(k, v); meta[k] = t; saveMeta(); },
    metaOf: function (k) { return meta[k] || 0; },
    allMeta: function () { var ks0 = {}; Object.keys(meta).forEach(function (k) { ks0[k] = 1; }); this.keys('').forEach(function (k) { if (!meta[k]) { meta[k] = 1; ks0[k] = 1; } }); return Object.keys(ks0).map(function (k) { return { k: k, t: meta[k] }; }); },
    keys: function (p) { var out = []; try { for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k && k.indexOf(PFX + p) === 0) out.push(k.slice(PFX.length)); } } catch (e) {} return out; }
  };
  var ks = KS.create(backend);
  C.setStore(backend);

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return [].slice.call((r || document).querySelectorAll(s)); }
  var toastT = 0;
  function toast(m) { var t = $('#tk-toast'); if (!t) return; t.textContent = m; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove('on'); }, 2600); }
  // embedded in the Minest app (tools/toolkit/host.js): talk to the host over postMessage
  var EMBED = window.parent !== window && /(^|[#&])embed=1(&|$)/.test(location.hash);
  var hostSeq = 0, hostWait = {};
  window.addEventListener('message', function (e) {
    var m = e.data; if (!m || e.source !== window.parent) return;
    if (m.type === 'minest-toolkit-reply' && hostWait[m.id]) { hostWait[m.id](m.data); delete hostWait[m.id]; }
    if (m.type === 'minest-toolkit-remote' && window.MinestToolkitCloud && MinestToolkitCloud.remote) MinestToolkitCloud.remote(m.x);
  });
  function host(action, payload) {
    if (!EMBED) return Promise.reject(new Error('not embedded'));
    return new Promise(function (ok, no) {
      var id = ++hostSeq, t = setTimeout(function () { delete hostWait[id]; no(new Error('The Minest app did not answer')); }, 10000);
      hostWait[id] = function (d) { clearTimeout(t); ok(d); };
      window.parent.postMessage(Object.assign({ type: 'minest-toolkit', action: action, id: id }, payload || {}), '*');
    });
  }
  function j(u, n) {
    if (window.__TK_DATA && window.__TK_DATA[u]) return Promise.resolve(JSON.parse(JSON.stringify(window.__TK_DATA[u])));   // the one-file build
    n = n == null ? 3 : n;
    return fetch(u, { cache: 'no-store' }).then(function (r) { if (!r.ok) throw new Error(u + ' ' + r.status); return r.json(); })
      .catch(function (e) { if (n <= 0) throw e; return new Promise(function (ok) { setTimeout(ok, 250); }).then(function () { return j(u, n - 1); }); });
  }

  var TK = { ks: ks, C: C, M: M, esc: esc, $: $, $$: $$, toast: toast, data: {}, cards: {}, order: [], ko: null, card: null, opts: {}, embed: EMBED, host: host };
  window.MinestToolkit = TK;

  // ------------------------------------------------------------------ card registry
  TK.register = function (def) { TK.cards[def.id] = def; if (TK.order.indexOf(def.id) < 0) TK.order.push(def.id); };
  TK.icon = function (d) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' + d + '</svg>'; };

  // ------------------------------------------------------------------ topic + seeds
  TK.topicOf = function (text) {
    var s = String(text || '').trim().replace(/[?？。.!！]+$/, '');
    var m = s.match(/^(?:什么是|何为|何谓)(.+)$/) || s.match(/^(.+?)(?:是什么|是什么意思|的含义)$/) || s.match(/^what\s+(?:is|are|does)\s+(?:a |an |the )?(.+?)(?:\s+mean)?$/i) || s.match(/^(?:define|explain)\s+(.+)$/i);
    if (m) return m[1].trim();
    if ((/[㐀-鿿]/.test(s) ? s.length <= 8 : s.split(/\s+/).length <= 4) && !/[，,]/.test(s)) return s;
    return null;
  };
  TK.seedFor = function (text) {
    var n = ks.norm(text), t = TK.topicOf(text); t = t && ks.norm(t);
    return (TK.data.seeds || []).filter(function (sd) { return sd.match.some(function (m) { m = ks.norm(m); return m === n || m === t; }); })[0] || null;
  };
  TK.rootLabel = function (ko) { return ko && ko.root_concept ? ks.label(ko.root_concept) : (ko ? ko.title : ''); };
  TK.relabel = function (s) { return TK.rootLabel(TK.ko).toLowerCase() ? String(s).replace(/\bX\b/g, TK.rootLabel(TK.ko)) : s; };

  // ------------------------------------------------------------------ objects
  TK.createFromInput = function (text) {
    text = String(text || '').trim(); if (!text) return null;
    var r = C.classify(text), seed = TK.seedFor(text), topic = TK.topicOf(text);
    var q = C.saveQuery(r, null);
    var ko = ks.createObject(text, { content_type: r.type.id, topic: seed ? seed.labels : topic, topicProvenance: seed ? 'library' : 'rule' });
    if (seed && ko.root_concept) ks.updateConcept(ko.root_concept, { review: seed.review || null });
    ks.updateObject(ko.id, { query_id: q.id, seed: seed ? seed.id : null,
      placement: { suggested: r.primary ? { primary: r.primary.id, related: r.related.map(function (x) { return x.id; }), uncertain: r.uncertain, reasons: r.reasons, engine: r.engine, type: r.type } : { primary: null, related: [], uncertain: true, reasons: r.reasons, engine: r.engine, type: r.type }, confirmed: null },
      suggested_frameworks: r.frameworks.map(function (f) { return f.framework_id; }), suggested_labs: r.interactions.map(function (i) { return i.interaction_id; }) });
    return ks.object(ko.id);
  };
  TK.placement = function (ko) {   // what to show: the confirmed placement, else the suggestion
    var p = (ko && ko.placement) || {};
    return p.confirmed ? { primary: p.confirmed.primary, related: p.confirmed.related || [], confirmed: true, provenance: 'user' } :
      p.suggested ? { primary: p.suggested.primary, related: p.suggested.related || [], confirmed: false, provenance: 'rule', uncertain: p.suggested.uncertain } : { primary: null, related: [], confirmed: false };
  };
  TK.confirmPlacement = function (primary, related) {
    var ko = TK.ko; if (!ko) return;
    var sug = ko.placement && ko.placement.suggested;
    ks.updateObject(ko.id, { placement: { suggested: sug, confirmed: { primary: primary, related: related || [], at: Date.now() } } });
    if (ko.query_id) C.confirm(ko.query_id, { node: primary, framework: (ko.suggested_frameworks || [])[0] });   // a correction teaches the local engine
    TK.ko = ks.object(ko.id);
  };

  // ------------------------------------------------------------------ navigation
  TK.open = function (card, o) {
    o = o || {};
    if (o.input) { var k = TK.createFromInput(o.input); if (!k) return; o.objectId = k.id; }
    if (o.conceptId && !o.objectId) {   // open the newest object that uses the concept, or a new one for it
      var hit = ks.objects().filter(function (x) { return x.concept_ids.indexOf(o.conceptId) >= 0; })[0];
      o.objectId = hit ? hit.id : ks.createObject(ks.label(o.conceptId), { topic: ks.label(o.conceptId) }).id;
    }
    if (o.objectId) TK.ko = ks.object(o.objectId);
    if (!TK.ko) return home();
    TK.opts = o; TK.card = card && TK.cards[card] ? card : null;
    var h = '#' + (EMBED ? 'embed=1&' : '') + 'ko=' + TK.ko.id + (TK.card ? '&card=' + TK.card : '') + (o.lab ? '&lab=' + o.lab : '') + (o.model ? '&model=' + o.model : '');
    if (location.hash !== h) history.replaceState(null, '', h);
    render();
  };
  function home() { TK.ko = null; TK.card = null; history.replaceState(null, '', location.pathname + location.search + (EMBED ? '#embed=1' : '')); render(); }
  TK.home = home;

  // ------------------------------------------------------------------ rendering
  var mounted = null;
  function render() {
    if (mounted && mounted.destroy) mounted.destroy(); mounted = null;
    var ko = TK.ko && ks.object(TK.ko.id); TK.ko = ko;
    $('#tk-start').hidden = !!ko;
    $('#tk-object').hidden = !ko;
    renderRecent();
    if (!ko) { $('#tk-q').focus(); return; }
    header(ko);
    $('#tk-tabs').innerHTML = '<button type="button" data-go="" class="' + (!TK.card ? 'on' : '') + '">' + TK.icon('<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>') + '<span>Five cards</span></button>' +
      TK.order.map(function (id) { var c = TK.cards[id]; return '<button type="button" data-go="' + id + '" class="' + (TK.card === id ? 'on' : '') + '" style="--cc:' + c.color + '">' + c.icon + '<span>' + esc(c.en) + '</span></button>'; }).join('');
    var stage = $('#tk-stage'); stage.innerHTML = ''; stage.className = 'tk-stage' + (TK.card ? ' card-' + TK.card : ' grid');
    if (!TK.card) {
      stage.innerHTML = TK.order.map(function (id, i) {
        var c = TK.cards[id], pv = ''; try { pv = c.preview(ko) || ''; } catch (e) { pv = ''; }
        return '<button type="button" class="tk-card" data-go="' + id + '" style="--cc:' + c.color + ';--i:' + i + '"><span class="tk-num">0' + (i + 1) + '</span><span class="tk-ic">' + c.icon + '</span>' +
          '<span class="tk-names"><b>' + esc(c.en) + '</b><em>' + esc(c.zh) + '</em></span><span class="tk-line">' + esc(c.line) + '</span><span class="tk-pv">' + pv + '</span><span class="tk-open">Open →</span></button>';
      }).join('');
    } else {
      mounted = TK.cards[TK.card].mount(stage, ko, TK.opts) || null;
    }
  }
  TK.render = render;
  function header(ko) {
    var pl = TK.placement(ko), path = pl.primary ? C.pathNames(pl.primary).join(' › ') : 'Not placed yet';
    $('#tk-title').innerHTML = '<small>' + esc((ko.placement && ko.placement.suggested && ko.placement.suggested.type ? ko.placement.suggested.type.label : 'Input')) + '</small>' + esc(ko.title) +
      '<span class="tk-place">' + esc(path) + ' <em class="' + (pl.confirmed ? 'ok' : 'sug') + '">' + (pl.confirmed ? 'confirmed by you' : 'suggested') + '</em></span>';
  }
  function renderRecent() {
    var list = ks.objects().slice(0, 8);
    $('#tk-recent').innerHTML = list.length ? '<span class="dim">Recent:</span>' + list.map(function (k) { return '<button type="button" class="chip" data-ko="' + k.id + '">' + esc(k.title) + '</button>'; }).join('') : '';
  }

  // re-render on changes made elsewhere (another card, a lab save); cards that edit in place set TK.quiet
  var pending = 0;
  var hdr = 0;
  ks.on(function (e) {
    if (e.kind === 'ko' && TK.ko && e.ko === TK.ko.id) { clearTimeout(hdr); hdr = setTimeout(function () { var k = ks.object(TK.ko.id); if (k) header(k); }, 30); }
    if (TK.quiet) return;
    clearTimeout(pending);
    pending = setTimeout(function () {
      if (!TK.ko) return renderRecent();
      TK.ko = ks.object(TK.ko.id);
      if (!TK.card) return render();
      if (mounted && mounted.refresh) mounted.refresh(e); else render();
    }, 30);
  });
  TK.silently = function (fn) { TK.quiet = true; try { return fn(); } finally { TK.quiet = false; } };

  // ------------------------------------------------------------------ boot
  function wire() {
    $('#tk-go').onclick = function () { var v = $('#tk-q').value.trim(); if (v) TK.open(null, { input: v }); };
    $('#tk-q').addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); $('#tk-go').click(); } });
    $('#tk-examples').onclick = function (e) { var b = e.target.closest('.chip'); if (b) { $('#tk-q').value = b.textContent; $('#tk-go').click(); } };
    document.addEventListener('click', function (e) {
      var g = e.target.closest('[data-go]'); if (g && TK.ko) { e.preventDefault(); TK.open(g.getAttribute('data-go') || null, { objectId: TK.ko.id }); return; }
      var r = e.target.closest('[data-ko]'); if (r) { TK.open(null, { objectId: r.getAttribute('data-ko') }); }
    });
    $('#tk-new').onclick = home;
    $('#tk-nebula').onclick = function () { if (EMBED) host('holo').catch(function () { TK.nebula(); }); else TK.nebula(); };   // in Minest: Holo Lab's 知识星图
    $('#tk-export').onclick = function () {
      if (!TK.ko) return; var data = ks.exportObject(TK.ko.id), blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'minest-knowledge-' + TK.ko.id + '.json'; a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
    };
    $('#tk-import').onchange = function (e) {
      var f = e.target.files[0]; if (!f) return; var rd = new FileReader();
      rd.onload = function () { try { var ko = ks.importObject(JSON.parse(rd.result)); toast('Imported “' + ko.title + '”'); TK.open(null, { objectId: ko.id }); } catch (x) { toast('Import failed: ' + x.message); } e.target.value = ''; };
      rd.readAsText(f);
    };
    $('#tk-delete').onclick = function () { if (TK.ko && confirm('Delete “' + TK.ko.title + '” and everything made inside it (frameworks, analyses, links)? Concepts used elsewhere stay.')) { ks.deleteObject(TK.ko.id); home(); } };
    window.addEventListener('hashchange', route);
    if (EMBED) {
      document.documentElement.classList.add('tk-embed');
      $('#tk-fromworld').hidden = false; $('#tk-tomw').hidden = false;
      $('#tk-fromworld').onclick = pickFromWorld;
      $('#tk-tomw').onclick = toMyWorld;
    }
  }
  // ---------------------------------------------------------------- My World (only when the toolkit runs inside the app)
  function pickFromWorld() {
    host('items').then(function (list) {
      var box = document.createElement('div'); box.className = 'tk-pick';
      box.innerHTML = '<div class="tk-pick-card"><h3>Think about something from My World</h3><input placeholder="Search your worlds…" autocomplete="off"><div class="tk-pick-list"></div><button type="button" data-x>Cancel</button></div>';
      document.body.appendChild(box);
      var inp = box.querySelector('input'), lst = box.querySelector('.tk-pick-list');
      function draw() { var q = inp.value.trim().toLowerCase(); var hits = list.filter(function (x) { return !q || x.title.toLowerCase().indexOf(q) >= 0; }).slice(0, 80);
        lst.innerHTML = hits.length ? hits.map(function (x, i) { return '<button type="button" data-i="' + list.indexOf(x) + '"><b>' + esc(x.title) + '</b><small>' + esc(x.world + ' › ' + x.list) + '</small></button>'; }).join('') : '<p class="dim">' + (list.length ? 'Nothing matches.' : 'Your worlds are empty.') + '</p>'; }
      inp.oninput = draw; draw(); setTimeout(function () { inp.focus(); }, 30);
      box.onclick = function (e) {
        var b = e.target.closest('[data-i]');
        if (b) { var it = list[+b.getAttribute('data-i')]; box.remove(); var k = TK.createFromInput(it.title); ks.updateObject(k.id, { sources: [{ kind: 'my-world-item', id: it.id, title: it.title, world: it.world, list: it.list }] }); TK.open(null, { objectId: k.id }); toast('From My World: “' + it.title + '”'); return; }
        if (e.target.closest('[data-x]') || e.target === box) box.remove();
      };
    }).catch(function (e) { toast(e.message); });
  }
  function toMyWorld() {
    var k = TK.ko && ks.object(TK.ko.id); if (!k) return;
    var lines = [TK.rootLabel(k) && TK.rootLabel(k) !== k.title ? TK.rootLabel(k) + ' — ' + k.title : k.title];
    (k.notes || []).filter(function (n) { return n.content_kind === 'view'; }).slice(-3).forEach(function (n) { lines.push('· ' + n.text); });
    host('capture', { text: lines.join('\n') }).then(function (r) { if (!r || !r.ok) toast('My World’s Quick Capture is not available here'); }).catch(function (e) { toast(e.message); });
  }
  TK.nebula = function (o) {   // o.onlyClose: summoned from the watch — closing the nebula closes the whole workbench (back into the watch)
    o = o || {};
    if (window.MinestNebula) TK.nebulaView = MinestNebula.open(TK, { onClose: function () { TK.nebulaView = null; if (o.onlyClose && EMBED) { host('close').catch(function () {}); return; } renderRecent(); if (TK.ko) render(); } });
  };
  function route() {
    var h = {}; location.hash.slice(1).split('&').forEach(function (p) { var kv = p.split('='); if (kv[0]) h[kv[0]] = decodeURIComponent(kv[1] || ''); });
    if (h.ko && ks.object(h.ko)) TK.open(h.card || null, { objectId: h.ko, lab: h.lab, model: h.model });
    else if (h.input) TK.open(h.card || null, { input: h.input, lab: h.lab, model: h.model });
    else render();
    if (h.nebula) setTimeout(function () { TK.nebula(h.only ? { onlyClose: true } : null); }, 50);
  }

  var COLS = ['philosophy', 'knowledge', 'nature', 'psychology', 'society', 'systems', 'life'];
  var LABS = ['../compass/micro/kant-causality.json', 'labs/locke-room.json', 'labs/plato-cave.json', 'labs/aristotle-causes.json', 'labs/hegel-concept.json'];
  var URLS = ['../compass/taxonomy.json', '../compass/frameworks-ext.json', 'data/templates.json', 'data/seeds.json', 'data/models.json'].concat(LABS).concat(['i18n/zh.json'])
    .concat(COLS.map(function (c) { return '../knowledge/frameworks/' + c + '.json'; }));
  // start once every card script has registered (the one-file build resolves its data at once)
  var ready = new Promise(function (ok) { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ok); else setTimeout(ok, 0); });
  URLS.reduce(function (p, u) { return p.then(function (acc) { return j(u).then(function (d) { acc.push(d); return acc; }); }); }, Promise.resolve([]))
    .then(function (all) {
      var n = 5 + LABS.length, fws = []; all.slice(n + 1).forEach(function (col) { fws = fws.concat(col.frameworks || []); });
      // Chinese: the toolkit's own content, plus the Chinese names the data already carries (places, frameworks)
      var I = window.MinestI18n;
      if (I) {
        I.add(all[n].strings);
        var names = {}; (all[0].nodes || []).forEach(function (x) { if (x.en && x.name) names[x.en] = x.name; });
        var ext = all[1].frameworks || {}; fws.forEach(function (f) { if (ext[f.id] && ext[f.id].zh) names[f.name] = ext[f.id].zh; });
        Object.keys(ext).forEach(function (id) { if (ext[id].name && ext[id].zh) names[ext[id].name] = ext[id].zh; });
        I.add(names);
        I.onChange(function () { if (TK.ko) render(); });
      }
      C.load({ taxonomy: all[0], ext: all[1], frameworks: fws, store: backend });
      TK.data.templates = all[2].templates; TK.data.seeds = all[3].seeds; TK.data.models = all[4].models; TK.data.angles = all[4].angles;
      TK.data.labs = all.slice(5, n); TK.data.labs.forEach(function (d) { M.register(d); });
      return ready.then(function () { wire(); route(); if (window.MinestI18n) MinestI18n.start();
      if (window.MinestToolkitCloud) MinestToolkitCloud.init(backend, function () { if (TK.ko && !ks.object(TK.ko.id)) TK.ko = null; render(); }); });
    }).catch(function (e) { document.body.insertAdjacentHTML('afterbegin', '<p class="err">Could not load the toolkit data: ' + esc(e.message) + '</p>'); });
})();
