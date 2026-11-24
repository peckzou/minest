/* Minest · Cognitive Toolkit — Index 索引: everything the toolkit already has, on one page.
   Philosophy models (philosophy/models/, via phil-models.js) · Thinking Lab experiments · Thinking Models · framework templates ·
   the knowledge objects made in this browser. One search box filters all of them. Opening a model, experiment or template
   uses the thought you have open, else the newest one, else starts a thought named after it. Nothing here is stored. */
(function () {
  'use strict';
  var TK = window.MinestToolkit; if (!TK) return;
  var esc = TK.esc, $ = TK.$;
  var q = '', open = false;

  function target(title) {
    if (TK.ko) return TK.ko.id;
    var last = TK.ks.objects()[0]; if (last) return last.id;
    var k = TK.createFromInput(title); return k && k.id;
  }
  function sections() {
    var phil = TK.philModels || [], labs = TK.data.labs || [], models = TK.data.models || [], tpls = TK.data.templates || [], objs = TK.ks.objects();
    return [
      { id: 'phil', cc: '#8b5cf6', name: 'Philosophy models', zh: '哲学交互模型', items: phil.map(function (m) { return { key: m.id, title: m.zh, sub: m.en + ' · ' + (m.src || ''), words: [m.who, (m.kw || []).join(' ')].join(' ') }; }) },
      { id: 'lab', cc: '#f08c2e', name: 'Thinking Lab', zh: '思维实验', items: labs.map(function (d) { return { key: d.interaction_id, title: d.title, sub: d.subtitle || '' }; }) },
      { id: 'models', cc: '#22a35a', name: 'Thinking Models', zh: '思维模型', items: models.map(function (m) { return { key: m.id, title: m.title, sub: m.principle || '' }; }) },
      { id: 'framework', cc: '#3b82f6', name: 'Framework templates', zh: '框架模板', items: tpls.map(function (t) { return { key: t.id, title: t.title, sub: t.description || t.purpose || '' }; }) },
      { id: 'ko', cc: '#14b8a6', name: 'My knowledge objects', zh: '我的知识对象', items: objs.map(function (k) { return { key: k.id, title: k.title, sub: new Date(k.updated_at || k.created_at || Date.now()).toLocaleDateString() }; }) }
    ];
  }
  function matches(it) { if (!q) return true; var s = (it.title + ' ' + it.sub + ' ' + (it.words || '')).toLowerCase(); return q.toLowerCase().split(/\s+/).every(function (w) { return s.indexOf(w) >= 0; }); }
  function render() {
    var el = $('#tk-index'); if (!el) return;
    var secs = sections(), total = secs.reduce(function (n, s) { return n + s.items.length; }, 0);
    el.innerHTML = '<div class="tk-obj"><h2><small>Index · 索引</small>Everything built so far · 已经做好的全部内容</h2>' +
      '<div class="tk-objact"><button type="button" class="ghost small" data-ix="close">← Back</button></div></div>' +
      '<input id="tk-ix-q" type="search" placeholder="Search ' + total + ' models and contents · 搜索全部模型和内容" value="' + esc(q) + '" autocomplete="off">' +
      '<nav class="tk-ix-jump">' + secs.map(function (s) { return '<a href="#ix-' + s.id + '" style="--cc:' + s.cc + '">' + esc(s.zh) + ' <b>' + s.items.filter(matches).length + '</b></a>'; }).join('') + '</nav>' +
      secs.map(function (s) {
        var list = s.items.filter(matches);
        return '<section class="tk-ix-sec" id="ix-' + s.id + '" style="--cc:' + s.cc + '"><h3>' + esc(s.name) + ' <em>' + esc(s.zh) + '</em> <span class="pill">' + list.length + '</span></h3>' +
          (list.length ? '<div class="tk-ix-grid">' + list.map(function (it) {
            return '<button type="button" class="tk-ix-it" data-ix="' + s.id + '" data-key="' + esc(it.key) + '" data-title="' + esc(it.title) + '"><b>' + esc(it.title) + '</b><small>' + esc(it.sub) + '</small></button>';
          }).join('') + '</div>' : '<p class="dim">' + (q ? 'Nothing matches · 没有符合的' : 'Nothing yet · 还没有') + '</p>') + '</section>';
      }).join('');
  }
  function show(on) {
    open = on;
    $('#tk-index').hidden = !on;
    $('#tk-start').hidden = on || !!TK.ko; $('#tk-object').hidden = on || !TK.ko;
    $('#tk-indexbtn').setAttribute('aria-pressed', String(on));
    if (on) { render(); window.scrollTo(0, 0); var i = $('#tk-ix-q'); if (i) i.focus(); }
  }
  TK.showIndex = function () { show(true); };

  document.addEventListener('click', function (e) {
    if (e.target.closest('#tk-indexbtn')) { show(!open); return; }
    var b = e.target.closest('[data-ix]'); if (!b || !open) return;
    var kind = b.getAttribute('data-ix'), key = b.getAttribute('data-key'), title = b.getAttribute('data-title');
    if (kind === 'close') return show(false);
    show(false);
    if (kind === 'phil') return TK.openPhil(key);
    if (kind === 'ko') return TK.open(null, { objectId: key });
    var id = target(title); if (!id) return;
    if (kind === 'lab') return TK.open('lab', { objectId: id, lab: key });
    if (kind === 'models') return TK.open('models', { objectId: id, model: key });
    if (kind === 'framework') return TK.open('framework', { objectId: id });
  }, true);
  document.addEventListener('input', function (e) {
    if (e.target.id !== 'tk-ix-q') return;
    q = e.target.value; var pos = e.target.selectionStart; render();
    var i = $('#tk-ix-q'); i.focus(); try { i.setSelectionRange(pos, pos); } catch (x) {}
  });
  // any other way back to the cards closes the index
  document.addEventListener('click', function (e) { if (open && e.target.closest('#tk-go, #tk-recent [data-ko], #tk-examples .chip')) show(false); });
})();
