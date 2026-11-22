/* 卡片风格 2.0 — the studio. The 1.0 script (tools/cover-modes/card-styles.js) still owns the materials, the
   gallery's parts, the light and the saved choice; this file rearranges its gallery into a page and adds:
   a card you can turn and flip (it has a back and an edge), the same material on a deck / a wall / next to
   another material, colourways and stage settings (调校), favourites, a tab for the new materials, a link
   per material (#s=<id>) and a button that hands the choice to the app. */
(function () {
  var CS = window.MinestCardStyles;
  if (!CS || window.MinestCardStyles2) return;
  var STYLES = CS.styles, NEWIDS = window.MinestCardStyles2Materials || [];
  var doc = document, root = doc.documentElement;
  var APPKEY = 'minest.cardStyle';   // the app's own key; this page's localStorage maps it to 2.0's (index.html)
  var K = { tune: 'minest.cardStyle2.tune', fav: 'minest.cardStyle2.fav', studio: 'minest.cardStyle2.studio' };
  function load(k, d) { try { var v = JSON.parse(localStorage.getItem(k) || 'null'); return v == null ? d : v; } catch (e) { return d; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  var saved = null; try { saved = localStorage.getItem(APPKEY); } catch (e) {}   // before 1.0 builds its gallery and writes its own
  var TUNE = load(K.tune, {}), FAV = load(K.fav, []), ST = load(K.studio, {});
  if (!Array.isArray(FAV)) FAV = [];
  if (['card', 'deck', 'wall', 'ab'].indexOf(ST.view) < 0) ST.view = 'card';
  if (typeof ST.depth !== 'number') ST.depth = 6;
  if (typeof ST.bg !== 'string') ST.bg = 'night';
  ST.spin = !!ST.spin;

  /* the twelve colourways of card-styles.js (it keeps them to itself): hue, then --cs-c1 c2 bd lip lt */
  var PALETTES = [
    [0, '#fff1f2', '#fecdd3', '#fb7185', '#e11d48', '#4c0519'], [32, '#fff7ed', '#fed7aa', '#fb923c', '#ea580c', '#431407'],
    [55, '#fefce8', '#fef08a', '#eab308', '#ca8a04', '#3f2e05'], [135, '#ecfdf5', '#a7f3d0', '#34d399', '#059669', '#064e3b'],
    [175, '#f0fdfa', '#99f6e4', '#2dd4bf', '#0d9488', '#134e4a'], [200, '#f0f9ff', '#bae6fd', '#38bdf8', '#0284c7', '#0c4a6e'],
    [235, '#eef2ff', '#c7d2fe', '#818cf8', '#4f46e5', '#1e1b4b'], [275, '#faf5ff', '#e9d5ff', '#c084fc', '#9333ea', '#3b0764'],
    [315, '#fdf2f8', '#fbcfe8', '#f472b6', '#db2777', '#500724'], [15, '#fff5f5', '#fed7d7', '#f87171', '#dc2626', '#450a0a'],
    [100, '#f7fee7', '#d9f99d', '#84cc16', '#4d7c0f', '#1a2e05'], [190, '#ecfeff', '#a5f3fc', '#22d3ee', '#0891b2', '#083344']
  ];
  var PVARS = ['--cs-hue', '--cs-c1', '--cs-c2', '--cs-bd', '--cs-lip', '--cs-lt'];
  var CATZH = { light: '光影', material: '材质', east: '东方', art: '艺术', classic: '经典' };
  var TITLES = ['Learning Loop', 'Active Recall', 'Phonemic Awareness', 'Dual Coding', 'Retrieval Grid', 'Schema Engine', 'Spaced Review', 'Word Families'];
  /* the cut edge of the card, for materials whose body is one fixed colour */
  var EDGE = { 'default': '#cbd5e1', 'hard-paper': '#d9c7a3', porcelain: '#c7dcf7', 'noir-gold': '#8a6f2a', chrome: '#9aa3ad', brutalist: '#0f172a', swiss: '#e5e5e5', mindful: '#e7e3f3',
    'leather-foil': '#3b2414', 'velvet-theatre': '#4a0d1c', 'kintsugi-jade': '#7fb8a4', 'mother-of-pearl': '#e8dfe8', watercolor: '#e8e2d6', 'stained-glass': '#1f2937',
    'ink-wash': '#d6cbb4', walnut: '#3a2010', titanium: '#8d939c', terrazzo: '#d6d0c4', riso: '#e9e2cf' };
  var BGS = [
    ['night', '深夜', 'radial-gradient(90% 70% at 50% 34%,#232838 0%,#11131b 62%,#0a0b10 100%)', 0],
    ['studio', '影棚', 'radial-gradient(90% 80% at 50% 30%,#ffffff 0%,#e9ebf0 60%,#cfd3db 100%)', 1],
    ['desk', '木桌', 'linear-gradient(180deg,rgba(0,0,0,.1),rgba(0,0,0,.45)),repeating-linear-gradient(92deg,#6b4226 0 38px,#5d3920 38px 41px,#74492b 41px 96px,#5a371f 96px 99px)', 0],
    ['felt', '绒布', 'radial-gradient(90% 80% at 50% 30%,#1f6b4f 0%,#0f3f2e 70%,#092a1f 100%)', 0],
    ['aurora', '极光', 'linear-gradient(135deg,#34d399,#38bdf8 50%,#3b1d8f 85%,#120b2e)', 0],
    ['sunset', '日落', 'linear-gradient(170deg,#3b1d5a,#b8456a 55%,#f6b26b)', 0],
    ['paper', '纸白', 'linear-gradient(180deg,#f7f3ea,#e9e2d2)', 1]
  ];
  var byId = {}; STYLES.forEach(function (s) { byId[s.id] = s; });
  var calm = false; try { calm = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  var narrow = { matches: false }; try { narrow = matchMedia('(max-width:899px)'); } catch (e) {}

  function $(s, p) { return (p || doc).querySelector(s); }
  function $$(s, p) { return [].slice.call((p || doc).querySelectorAll(s)); }
  function el(tag, attrs, html) { var e = doc.createElement(tag); for (var k in attrs || {}) e.setAttribute(k, attrs[k]); if (html != null) e.innerHTML = html; return e; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function hash(s) { var h = 0; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }
  function isNew(id) { return NEWIDS.indexOf(id) >= 0; }
  function tuneOf(id) { var t = TUNE[id]; return { p: t && typeof t.p === 'number' && PALETTES[t.p] ? t.p : -1 }; }
  function setPal(e, p) { PVARS.forEach(function (v, i) { if (p < 0) e.style.removeProperty(v); else e.style.setProperty(v, i ? PALETTES[p][i] : PALETTES[p][0] + 'deg'); }); }

  /* does a material take its colour from the colourway? (read off the rules themselves) */
  var colourCache = {}, sheets = null;
  function colourful(id) {
    if (id in colourCache) return colourCache[id];
    if (!sheets) sheets = ['cs-style-sheet', 'cs2-materials'].map(function (i) { var e = doc.getElementById(i); return e ? e.textContent : ''; }).join('}').split('}');
    var q = '"' + id + '"';
    return (colourCache[id] = sheets.some(function (r) { return r.indexOf(q) >= 0 && /var\(--cs-(c1|c2|bd|lip|lt|hue)\b/.test(r); }));
  }

  var cur = '', prevSel = '', pin = '', flt = null;
  var modal, panel, head, top, stage, hero, info, tabs, grid, scene, card, back, edges = [], deck, wall, ab, tune, toastEl, emptyEl, countEl;

  function init() {
    modal = $('#cs-modal'); if (!modal) return;
    panel = $('#cs-panel'); head = $('#cs-head'); top = $('#cs-top'); stage = $('#cs-stage'); hero = $('#cs-hero'); info = $('#cs-info'); tabs = $('#cs-tabs'); grid = $('#cs-grid');
    CS.open();

    /* header */
    var h3 = $('h3', head), small = $('small', h3);
    h3.firstChild.nodeValue = '卡片风格';
    h3.insertBefore(el('em', { 'class': 'v2-ver' }, '2.0'), small);
    small.textContent = STYLES.length + ' 种材质 · ' + NEWIDS.length + ' 种新增 · 拖动旋转，轻点翻面';
    var tb = el('button', { id: 'v2-tune-btn', 'class': 'cs-ic', type: 'button', title: '调校：颜色、厚度、舞台', 'aria-label': '调校' },
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M4 7h9M17 7h3M4 12h3M11 12h9M4 17h11M19 17h1"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="17" r="2"/></svg>');
    head.insertBefore(tb, $('#cs-shuf', head));
    $('#cs-shuf', head).title = '随机换色：给这种材质换一种颜色';

    /* two sides: the stage and what belongs to it, the gallery */
    var body = el('div', { id: 'v2-body' }), left = el('div', { id: 'v2-left' }), right = el('div', { id: 'v2-right' });
    panel.insertBefore(body, top); body.appendChild(left); body.appendChild(right);
    left.appendChild(top); right.appendChild(tabs); right.appendChild(grid);
    emptyEl = el('div', { id: 'v2-empty', hidden: '' }, '还没有收藏的材质。<br>选一种，点名字下面的 ♡ 收藏。'); right.appendChild(emptyEl);

    /* the stage: one card with a back and an edge, a deck, a wall, a pair */
    scene = el('div', { id: 'v2-scene', 'data-view': ST.view });
    card = el('div', { id: 'v2-card' });
    for (var i = 0; i < 7; i++) { var e = el('div', { 'class': 'v2-edge' }); edges.push(e); card.appendChild(e); }
    back = el('div', { id: 'v2-back', 'class': 'cs-prev' });
    card.appendChild(hero); card.appendChild(back);
    deck = el('div', { id: 'v2-deck' }); wall = el('div', { id: 'v2-wall' }); ab = el('div', { id: 'v2-ab' });
    for (i = 0; i < 5; i++) deck.appendChild(mini(TITLES[i], i - 2));
    for (i = 0; i < 8; i++) wall.appendChild(mini(TITLES[i]));
    ab.innerHTML = '<figure data-ab="a"></figure><figure data-ab="b"></figure>';
    $$('figure', ab).forEach(function (f, n) { f.appendChild(mini(TITLES[n ? 0 : 3])); f.appendChild(el('figcaption')); });
    scene.appendChild(card); scene.appendChild(el('div', { id: 'v2-floor' })); scene.appendChild(deck); scene.appendChild(wall); scene.appendChild(ab);
    stage.appendChild(scene);
    countEl = el('div', { id: 'v2-count' }); stage.appendChild(countEl);
    var chev = function (d) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + d + '"/></svg>'; };
    var pv = el('button', { id: 'v2-prev', 'class': 'v2-nav', type: 'button', 'aria-label': '上一种材质' }, chev('M15 5l-7 7 7 7'));
    var nx = el('button', { id: 'v2-next', 'class': 'v2-nav', type: 'button', 'aria-label': '下一种材质' }, chev('M9 5l7 7-7 7'));
    stage.appendChild(pv); stage.appendChild(nx);
    pv.onclick = function () { step(-1); }; nx.onclick = function () { step(1); };

    var views = el('div', { id: 'v2-views', role: 'tablist', 'aria-label': '舞台上怎么摆' });
    [['card', '单卡'], ['deck', '卡组'], ['wall', '卡片墙'], ['ab', '对比']].forEach(function (v) {
      var b = el('button', { type: 'button', 'data-v': v[0] }, v[1]); b.onclick = function () { setView(v[0]); }; views.appendChild(b);
    });
    top.insertBefore(views, info);

    /* the name block: where it sits in the set, and what to do with it */
    info.insertBefore(el('div', { 'class': 'v2-meta' }), info.firstChild);
    var acts = el('div', { id: 'v2-acts' },
      '<button id="v2-fav" type="button" aria-pressed="false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 8a4.3 4.3 0 0 1 7.5 2.5c0 5.4-7.5 10-7.5 10z"/></svg><span>收藏</span></button>' +
      '<button id="v2-use" type="button"></button>');
    info.appendChild(acts);
    $('#v2-fav').onclick = toggleFav; $('#v2-use').onclick = useInApp;

    buildTune(top, tb);
    toastEl = el('div', { id: 'v2-toast', role: 'status', 'aria-live': 'polite' }); doc.body.appendChild(toastEl);

    /* the gallery: a tile picks a material and the page stays (1.0 closed itself after a pick, and showed a tile
       in the large card on hover — here the large card is the chosen one) */
    grid.addEventListener('click', function (e) {
      var o = e.target.closest && e.target.closest('.cs-opt'); if (!o) return;
      e.stopPropagation(); askTilt(); select(o.dataset.id);
    }, true);
    ['pointerenter', 'focus'].forEach(function (t) { grid.addEventListener(t, function (e) { if (e.target !== grid) e.stopPropagation(); }, true); });
    $$('.cs-opt', grid).forEach(function (o) { if (isNew(o.dataset.id)) o.appendChild(el('span', { 'class': 'v2-new' }, 'NEW')); });
    head.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('#cs-shuf')) { e.stopPropagation(); shuffle(); } }, true);
    modal.addEventListener('click', function (e) { if (e.target === modal) e.stopPropagation(); }, true);

    /* two more tabs: the new materials, the favourites */
    var tNew = el('button', { type: 'button', 'class': 'v2-tab-new' }, '新材质 ' + NEWIDS.length), tFav = el('button', { type: 'button' }, '收藏');
    tabs.insertBefore(tNew, tabs.children[1] || null); tabs.appendChild(tFav);
    tNew.onclick = function () { filter(tNew, isNew); };
    tFav.onclick = function () { filter(tFav, function (id) { return FAV.indexOf(id) >= 0; }); };
    tabs.addEventListener('click', function (e) { if (e.target !== tNew && e.target !== tFav && e.target.tagName === 'BUTTON') { flt = null; emptyEl.hidden = true; } });

    /* on a phone the stage steps back while the gallery scrolls, and comes forward at its top or on a tap */
    grid.addEventListener('scroll', function () {
      if (!narrow.matches) { panel.classList.remove('v2-compact'); return; }
      var c = panel.classList.contains('v2-compact');
      if (!c && grid.scrollTop > 56) panel.classList.add('v2-compact'); else if (c && grid.scrollTop < 6) panel.classList.remove('v2-compact');
    }, { passive: true });
    left.addEventListener('click', function (e) {
      if (!panel.classList.contains('v2-compact') || (e.target.closest && e.target.closest('#v2-acts'))) return;
      e.stopPropagation(); panel.classList.remove('v2-compact'); try { grid.scrollTo({ top: 0, behavior: calm ? 'auto' : 'smooth' }); } catch (x) { grid.scrollTop = 0; }
    }, true);

    wireStage();
    paintFavs();
    setBg(ST.bg, true); setDepth(ST.depth, true);
    var want = fromHash() || (saved && byId[saved] ? saved : '') || NEWIDS[1] || NEWIDS[0] || STYLES[0].id;
    select(want, { quiet: true });
    setView(ST.view, true);
    var on = $('.cs-opt.on', grid); if (on && on.scrollIntoView && !narrow.matches) on.scrollIntoView({ block: 'nearest' });
    window.addEventListener('hashchange', function () { var h = fromHash(); if (h && h !== cur) select(h); });
    window.addEventListener('keydown', onKey, true);
    requestAnimationFrame(frame);
  }

  function mini(title, i) {
    var m = el('div', { 'class': 'cs-prev v2-mini' }, '<span class="cs-pt">' + esc(title) + '</span><span class="cs-pl"></span>');
    if (i != null) m.style.setProperty('--i', i);
    return m;
  }
  function fromHash() { var m = /[#&]s=([\w-]+)/.exec(location.hash) || /^#([\w-]+)$/.exec(location.hash); return m && byId[m[1]] ? m[1] : ''; }

  /* ---- choosing ---- */
  function select(id, o) {
    if (!byId[id]) return;
    if (cur && id !== cur) prevSel = cur;
    cur = id;
    CS.set(id);   // 1.0: marks the tile, sets the page's material, keeps the choice (under 2.0's own key), shows Mindful's strip
    paint();
    if (!(o && o.quiet)) { try { history.replaceState(null, '', '#s=' + id); } catch (e) {} }
  }
  function visible() { return $$('.cs-opt', grid).filter(function (x) { return x.style.display !== 'none'; }); }
  function step(d) {
    var v = visible(); if (!v.length) return;
    var i = v.findIndex(function (x) { return x.dataset.id === cur; });
    var n = v[i < 0 ? 0 : (i + d + v.length) % v.length];
    select(n.dataset.id);
    if (!panel.classList.contains('v2-compact') && n.scrollIntoView) n.scrollIntoView({ block: 'nearest', behavior: calm ? 'auto' : 'smooth' });
  }
  function filter(tab, fn) {
    flt = fn;
    [].forEach.call(tabs.children, function (x) { x.classList.toggle('on', x === tab); });
    var any = false;
    $$('.cs-opt', grid).forEach(function (o) { var ok = fn(o.dataset.id); o.style.display = ok ? '' : 'none'; any = any || ok; });
    emptyEl.hidden = any; grid.scrollTop = 0;
  }

  /* ---- painting the stage for the chosen material ---- */
  function paint() {
    var s = byId[cur], t = tuneOf(cur), n = STYLES.indexOf(s) + 1, cf = colourful(cur);
    var no = 'No. ' + (n < 10 ? '0' : '') + n + ' / ' + STYLES.length;
    hero.setAttribute('data-s', cur); setPal(hero, t.p);
    back.setAttribute('data-s', cur); setPal(back, t.p);
    back.innerHTML = '<span class="v2-b-no">' + no + '</span><span class="v2-b-zh">' + esc(s.zh) + '</span><span class="v2-b-en">' + esc(s.name) + '</span><span class="cs-pl">' + (CATZH[s.cat] || '') + '</span>';
    card.style.setProperty('--v2-edge', EDGE[cur] || 'color-mix(in srgb,' + (t.p >= 0 ? PALETTES[t.p][4] : s.accent) + ' 62%,#14161d)');
    requestAnimationFrame(function () {   // the edge follows the material's own corner
      var c = getComputedStyle(hero); edges.forEach(function (e) { e.style.borderRadius = c.borderRadius; e.style.clipPath = c.clipPath === 'none' ? '' : c.clipPath; });
    });
    var base = t.p >= 0 ? t.p : hash(cur) % PALETTES.length;
    [].forEach.call(deck.children, function (m, i) { dress(m, cur, i === 2 ? t.p : (base + (i - 2) * 2 + 24) % 12); m.classList.toggle('up', i === 2); });
    [].forEach.call(wall.children, function (m, i) { dress(m, cur, i ? (base + i) % 12 : t.p); });
    paintAB();

    $('b', info).textContent = s.zh; $('i', info).textContent = s.name; $('p', info).textContent = s.desc;
    $('.v2-meta', info).innerHTML = '<span>' + no + '</span><span>' + (CATZH[s.cat] || '') + '</span>' + (isNew(cur) ? '<span class="v2-isnew">2.0 新材质</span>' : '') + (cf ? '' : '<span>固定配色</span>');
    countEl.textContent = (n < 10 ? '0' : '') + n + ' / ' + STYLES.length;
    var fav = FAV.indexOf(cur) >= 0, fb = $('#v2-fav'); fb.classList.toggle('on', fav); fb.setAttribute('aria-pressed', String(fav)); $('span', fb).textContent = fav ? '已收藏' : '收藏';
    var ub = $('#v2-use'); ub.classList.toggle('off', isNew(cur)); ub.innerHTML = isNew(cur) ? '<span>仅 2.0</span>' : '<span>用到 Minest</span>';
    paintTune();
  }
  function dress(m, id, p) { m.setAttribute('data-s', id); setPal(m, colourful(id) ? p : -1); $('.cs-pl', m).textContent = byId[id].zh; }
  function paintAB() {
    if (!pin || !byId[pin] || pin === cur) pin = prevSel && prevSel !== cur && byId[prevSel] ? prevSel : STYLES[(STYLES.indexOf(byId[cur]) + 1) % STYLES.length].id;
    var f = $$('figure', ab);
    dress($('.v2-mini', f[0]), pin, tuneOf(pin).p); $('figcaption', f[0]).innerHTML = '<i>A</i>' + esc(byId[pin].zh);
    dress($('.v2-mini', f[1]), cur, tuneOf(cur).p); $('figcaption', f[1]).innerHTML = '<i>B</i>' + esc(byId[cur].zh);
  }
  function setView(v, quiet) {
    ST.view = v; scene.setAttribute('data-view', v);
    $$('#v2-views button').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-v') === v); });
    if (v === 'ab') paintAB();
    if (!quiet) { save(K.studio, ST); if (v === 'ab') toast('A 是上一种材质，B 跟着你选；点 A 把两边对调'); }
  }

  /* ---- favourites, colour, the app ---- */
  function paintFavs() { $$('.cs-opt', grid).forEach(function (o) { o.classList.toggle('v2-faved', FAV.indexOf(o.dataset.id) >= 0); }); }
  function toggleFav() {
    var i = FAV.indexOf(cur); if (i >= 0) FAV.splice(i, 1); else FAV.push(cur);
    save(K.fav, FAV); paintFavs(); paint();
    if (flt && $('#cs-tabs button.on') && $('#cs-tabs button.on').textContent === '收藏') filter($('#cs-tabs button.on'), flt);
    toast(i >= 0 ? '已取消收藏' : '已收藏「' + byId[cur].zh + '」· 在「收藏」标签里');
  }
  function setPalFor(p) {
    if (p < 0) delete TUNE[cur]; else TUNE[cur] = { p: p };
    save(K.tune, TUNE); paint();
  }
  function shuffle() {
    var b = $('#cs-shuf'); b.classList.remove('v2-roll'); void b.offsetWidth; b.classList.add('v2-roll');
    if (!colourful(cur)) { toast('「' + byId[cur].zh + '」是固定配色，不随颜色变化'); return; }
    var p; do { p = Math.floor(Math.random() * PALETTES.length); } while (p === tuneOf(cur).p);
    setPalFor(p); toast('已给「' + byId[cur].zh + '」换了一种颜色 · 再点换下一种');
  }
  function useInApp() {
    var s = byId[cur];
    if (isNew(cur)) { toast('「' + s.zh + '」是 2.0 的新材质，Minest 里还没有；原有的 25 种可以直接用过去'); return; }
    if (window.CS2Store && CS2Store.set(APPKEY, cur)) toast('Minest 的卡片风格已设为「' + s.zh + '」', '../iphone.html', '打开 Minest');
    else toast('这台设备没能保存，请在 Minest 里手动选择');
  }
  function toast(t, href, linkText) {
    toastEl.textContent = t;
    if (href) { var a = el('a', { href: href }); a.textContent = linkText; toastEl.appendChild(a); }
    toastEl.classList.add('show'); clearTimeout(toastEl._t); toastEl._t = setTimeout(function () { toastEl.classList.remove('show'); }, href ? 6000 : 2600);
  }

  /* ---- 调校: colourway (per material), the card's thickness and the stage (for the page) ---- */
  function buildTune(host, btn) {
    tune = el('div', { id: 'v2-tune', hidden: '' },
      '<div class="v2-th"><b>调校</b><span>只改这一页，不动 Minest</span><button type="button" id="v2-tune-x">完成</button></div>' +
      '<h4>颜色</h4><div class="v2-sw" id="v2-pals"><button type="button" class="v2-auto" data-p="-1">原色</button>' +
        PALETTES.map(function (p, i) { return '<button type="button" data-p="' + i + '" aria-label="颜色 ' + (i + 1) + '" style="background:linear-gradient(135deg,' + p[2] + ',' + p[3] + ' 55%,' + p[4] + ')"></button>'; }).join('') + '</div>' +
      '<p class="v2-hint" id="v2-pal-hint"></p>' +
      '<h4>卡片厚度<em id="v2-depth-v"></em></h4><input type="range" id="v2-depth" min="0" max="14" step="1" aria-label="卡片厚度">' +
      '<h4>舞台</h4><div class="v2-sw" id="v2-bgs">' + BGS.map(function (b) { return '<button type="button" data-bg="' + b[0] + '"' + (b[3] ? ' class="v2-lt"' : '') + ' style="background:' + b[2] + '">' + b[1] + '</button>'; }).join('') + '</div>' +
      '<label class="v2-check"><input type="checkbox" id="v2-spin">转台：卡片自己慢慢转</label>' +
      '<div id="v2-mf-slot"></div>' +
      '<button type="button" id="v2-reset">恢复默认</button>');
    host.appendChild(tune);   // under the name, in the stage's column: the stage stays in view while you tune
    var mf = $('#cs-mf'); if (mf) $('#v2-mf-slot', tune).appendChild(mf);   // Mindful's own colour strip (1.0) lives here
    function toggle(on) { tune.hidden = on == null ? !tune.hidden : !on; btn.classList.toggle('on', !tune.hidden); if (!tune.hidden && !narrow.matches && tune.scrollIntoView) tune.scrollIntoView({ block: 'nearest', behavior: calm ? 'auto' : 'smooth' }); }
    btn.onclick = function () { toggle(); };
    $('#v2-tune-x', tune).onclick = function () { toggle(false); };
    tune._toggle = toggle;
    $('#v2-pals', tune).onclick = function (e) { var b = e.target.closest('button'); if (b) setPalFor(+b.getAttribute('data-p')); };
    $('#v2-bgs', tune).onclick = function (e) { var b = e.target.closest('button'); if (b) setBg(b.getAttribute('data-bg')); };
    $('#v2-depth', tune).oninput = function () { setDepth(+this.value); };
    $('#v2-spin', tune).onchange = function () { ST.spin = this.checked; save(K.studio, ST); };
    $('#v2-reset', tune).onclick = function () { delete TUNE[cur]; save(K.tune, TUNE); setDepth(6); setBg('night'); ST.spin = false; save(K.studio, ST); paint(); toast('已恢复默认'); };
  }
  function paintTune() {
    var t = tuneOf(cur), cf = colourful(cur);
    $$('#v2-pals button').forEach(function (b) { b.classList.toggle('on', +b.getAttribute('data-p') === t.p); });
    $('#v2-pals').classList.toggle('off', !cf);
    $('#v2-pal-hint').textContent = cf ? '' : (cur === 'mindful' ? '正念用自己的颜色条，在下面。' : '这种材质是固定配色，不随颜色变化。');
    $('#v2-spin').checked = ST.spin;
  }
  function setBg(id, quiet) {
    var b = BGS.filter(function (x) { return x[0] === id; })[0] || BGS[0];
    ST.bg = b[0]; stage.style.setProperty('--v2-stage', b[2]); stage.classList.toggle('v2-light', !!b[3]);
    $$('#v2-bgs button').forEach(function (x) { x.classList.toggle('on', x.getAttribute('data-bg') === b[0]); });
    if (!quiet) save(K.studio, ST);
  }
  function setDepth(d, quiet) {
    d = clamp(Math.round(d) || 0, 0, 14); ST.depth = d;
    root.style.setProperty('--v2-d', d + 'px');
    edges.forEach(function (e, i) { e.style.display = d ? '' : 'none'; e.style.transform = 'translateZ(' + (-d / 2 + d * (i + 0.5) / edges.length).toFixed(2) + 'px)'; });
    $('#v2-depth').value = d; $('#v2-depth-v').textContent = d ? d + ' px' : '一张纸';
    if (!quiet) save(K.studio, ST);
  }

  /* ---- the stage: drag to turn, let go and it keeps turning a little, tap to flip; it leans to the pointer or the
     phone's tilt, and the light on the card (--cs-px / --cs-py / --cs-ang, the 1.0 variables) comes from its angle ---- */
  var R = { y: 0, x: 0, vy: 0, goal: 0, lx: 0, ly: 0, tlx: 0, tly: 0, drag: null, last: 0, sig: '' }, tiltAsked = false;
  function askTilt() {   // iOS asks once, on a tap
    if (tiltAsked) return; tiltAsked = true;
    try { if (window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === 'function') DeviceOrientationEvent.requestPermission().catch(function () {}); } catch (e) {}
  }
  function flip() { R.vy = 0; R.goal = Math.round(R.y / 180) * 180 + 180; }
  function wireStage() {
    stage.addEventListener('pointerdown', function (e) {
      if (e.target.closest('.v2-nav') || panel.classList.contains('v2-compact')) return;
      R.drag = { id: e.pointerId, x: e.clientX, y: e.clientY, y0: R.y, x0: R.x, moved: 0, lx: e.clientX, lt: performance.now(), target: e.target };
      try { stage.setPointerCapture(e.pointerId); } catch (x) {}
      stage.classList.add('v2-drag'); R.vy = 0; R.goal = null;
    });
    stage.addEventListener('pointermove', function (e) {
      var d = R.drag, r = stage.getBoundingClientRect();
      if (e.pointerType === 'mouse' && !d) { R.tly = clamp((e.clientX - (r.left + r.width / 2)) / r.width * 30, -16, 16); R.tlx = clamp(-(e.clientY - (r.top + r.height / 2)) / r.height * 22, -12, 12); }
      if (!d || d.id !== e.pointerId) return;
      var dx = e.clientX - d.x, dy = e.clientY - d.y, now = performance.now();
      d.moved = Math.max(d.moved, Math.abs(dx) + Math.abs(dy));
      if (ST.view === 'card') {
        R.y = d.y0 + dx * 0.62; R.x = clamp(d.x0 - dy * 0.3, -32, 32);
        if (now > d.lt) R.vy = R.vy * 0.5 + ((e.clientX - d.lx) * 0.62 / (now - d.lt)) * 0.5;
        d.lx = e.clientX; d.lt = now;
      } else { R.tly = clamp(dx / r.width * 60, -24, 24); R.tlx = clamp(-dy / r.height * 40, -16, 16); }
    });
    function up(e) {
      var d = R.drag; if (!d || d.id !== e.pointerId) return;
      R.drag = null; stage.classList.remove('v2-drag'); askTilt();
      if (e.pointerType !== 'mouse') { R.tlx = 0; R.tly = 0; }
      if (d.moved < 7 && e.type === 'pointerup') tap(d.target);
      else if (performance.now() - d.lt > 90) R.vy = 0;
    }
    stage.addEventListener('pointerup', up); stage.addEventListener('pointercancel', up);
    stage.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse' && !R.drag) { R.tlx = 0; R.tly = 0; } });
    window.addEventListener('deviceorientation', function (e) {
      if (e.gamma == null || R.drag) return;
      R.tly = clamp(e.gamma * 0.55, -20, 20); R.tlx = clamp(-((e.beta || 45) - 45) * 0.35, -14, 14);
    }, { passive: true });
  }
  function tap(t) {
    if (ST.view === 'card') { flip(); return; }
    var m = t.closest && t.closest('.v2-mini');
    if (ST.view === 'deck' && m) { [].forEach.call(deck.children, function (x) { x.classList.toggle('up', x === m); }); return; }
    if (ST.view === 'ab') { var f = t.closest && t.closest('figure'); if (f && f.getAttribute('data-ab') === 'a') { var a = pin; pin = cur; select(a); } }
  }
  function frame(now) {
    requestAnimationFrame(frame);
    var dt = Math.min(50, now - (R.last || now)); R.last = now;
    if (doc.hidden || !dt) return;
    R.lx += (R.tlx - R.lx) * Math.min(1, dt * 0.008); R.ly += (R.tly - R.ly) * Math.min(1, dt * 0.008);
    if (ST.view !== 'card') {
      var sg = R.lx.toFixed(1) + ',' + R.ly.toFixed(1);
      if (sg !== R.sig) { R.sig = sg; scene.style.setProperty('--v2-lx', R.lx.toFixed(2)); scene.style.setProperty('--v2-ly', R.ly.toFixed(2)); }
      return;
    }
    var sway = 0, swx = 0;
    if (!R.drag) {
      if (R.goal != null) { R.y += (R.goal - R.y) * Math.min(1, dt * 0.011); if (Math.abs(R.goal - R.y) < 0.05) { R.y = R.goal; R.goal = null; } }
      else if (ST.spin && !calm) R.y += dt * 0.035;
      else if (Math.abs(R.vy) > 0.012) { R.y += R.vy * dt; R.vy *= Math.pow(0.95, dt / 16); }
      else { R.vy = 0; var g = Math.round(R.y / 180) * 180; R.y += (g - R.y) * Math.min(1, dt * 0.007); }
      R.x += (0 - R.x) * Math.min(1, dt * 0.006);
      if (!calm && !ST.spin) { sway = Math.sin(now / 1500) * 6; swx = Math.sin(now / 2100 + 1) * 2.5; }
    }
    var ay = R.y + sway + R.ly, ax = R.x + swx + R.lx;
    var sig = ay.toFixed(1) + ',' + ax.toFixed(1); if (sig === R.sig) return; R.sig = sig;
    card.style.transform = 'rotateX(' + ax.toFixed(2) + 'deg) rotateY(' + ay.toFixed(2) + 'deg)';
    var rel = ((ay % 180) + 180) % 180; if (rel > 90) rel -= 180;   // how far the facing side is turned away, -90..90
    card.style.setProperty('--cs-px', clamp(50 + rel * 1.7, -30, 130).toFixed(1) + '%');
    card.style.setProperty('--cs-py', clamp(42 - ax * 1.8, 0, 100).toFixed(1) + '%');
    card.style.setProperty('--cs-ang', Math.round(100 + rel * 1.6 - ax * 0.8) + 'deg');
    scene.style.setProperty('--v2-fs', Math.max(0.12, Math.abs(Math.cos(ay * Math.PI / 180))).toFixed(3));
  }

  function onKey(e) {
    if (e.key === 'Escape') { e.stopPropagation(); if (tune && !tune.hidden) tune._toggle(false); return; }   // nothing to close: 2.0 is the page
    if (/^(INPUT|TEXTAREA|SELECT)$/.test((e.target && e.target.tagName) || '') || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); step(1); } else if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
    else if (e.key === ' ' && ST.view === 'card' && (!e.target || e.target.tagName !== 'BUTTON')) { e.preventDefault(); flip(); }
  }

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', init); else init();
  window.MinestCardStyles2 = { select: select, get: function () { return cur; }, view: setView, flip: flip, step: step, isNew: isNew, favourites: function () { return FAV.slice(); } };
})();
