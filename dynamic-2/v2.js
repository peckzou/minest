/* 动态呈现 2.0 — the upgrade, laid over the eleven unchanged 1.0 presentations (tools/knowledge-drive, knowledge-rail,
   knowledge-balloon; each is window.Minest<Name>.open({ source, provider, onExit })):
   · 大厅: all eleven on one page, with the board or list they will travel through, each one's own 1.0 styles, and a passport of the ones you have tried
   · 换乘: from inside one presentation straight into another, on the same cards, behind a title card (1.0: leave, reopen the gallery, pick again)
   · 画风 and 氛围: the lens in v2-fx.js — every presentation gets a finished picture and weather, remembered per presentation
   · 巡演: a tour of all eleven · 沉浸: the picture alone
   window.Dyn2 = { modes, go(mode), lobby(), tour(on), look(id), air(id), state() } */
(function () {
  'use strict';
  var Dt = window.Dyn2Data, FX = window.Dyn2FX, DR = window.MinestDrive;
  if (!Dt || !DR || !FX) return;
  // [id, icon, 中文, English (the 1.0 name), tagline, what you do, colour, [a list is…, a card is…], { look, air, out (open air: all weather), scale (the scene's size, for the weather) }]
  var MODES = [
    ['drive', '🚗', '知识公路', 'Knowledge Drive', '清单成路 · 卡片成路牌', '清单变成公路，卡片是路边的广告牌。车自己开；点一块牌子看它，再点一下翻到背面。', '#f4a26b', ['条路', '站'], { look: 'gold', air: 'petal', out: 1, scale: 1.5 }],
    ['train', '🚆', '知识列车', 'Knowledge Train', '靠窗而坐 · 一条清单一条线', '靠窗坐下，每个清单是一条铁路线。点窗外经过的卡片，列车会停下来让你读。', '#7fc8a9', ['条线', '站'], { look: 'film', air: 'petal', out: 1, scale: 1.6 }],
    ['metro', '🚇', '知识地铁', 'Knowledge Metro', '一张卡一站 · 换乘看全图', '每个清单一条地铁线，每张卡片一站。上车、换乘，在线路图上跳到任意一站。', '#3d8bfd', ['条线', '站'], { look: 'film', air: 'none', out: 0, scale: 1 }],
    ['tower', '🏙', '知识摩天楼', 'Knowledge Skyscraper', '向上探索 · 一层一个清单', '看板变成一座玻璃大厦：坐电梯、看剖面，走进任意一层，把展品从架上取下来。', '#8b9dff', ['层', '件'], { look: 'neon', air: 'dust', out: 1, scale: 2.4 }],
    ['roadtrip', '🛣', '公路旅行', 'Road Trip', '六条名路 · 自驾', '把卡片开上六条名路：加州一号、百万美元公路、纪念碑谷、66 号公路、海上公路、蓝岭公路。', '#e07a4a', ['条路', '站'], { look: 'retro', air: 'dust', out: 1, scale: 1.5 }],
    ['rack', '🎠', '旋转展架', 'Rotating Rack', '转动 · 挑选 · 取出', '最多 12 张卡片变成书、记忆球和奖章，在转台上转。点一件，它会转过来滑到你面前。', '#c88a4a', ['个清单', '件'], { look: 'film', air: 'dust', out: 0, scale: .8 }],
    ['library', '📚', '图书馆长廊', 'Library Corridor', '漫步 · 浏览 · 抽书', '走进胡桃木图书馆：每个清单一排高书架，每张卡片一本书。点书架走近，点书抽出来读。', '#b0703c', ['个书区', '本书'], { look: 'gold', air: 'dust', out: 0, scale: .8 }],
    ['museum', '🏛', '博物馆漫步', 'Museum Walkthrough', '漫步 · 发现 · 阅读', '画作、雕塑和玻璃展柜的展厅。跟着导览走，或者自己逛；点展品走近，再点一下阅读。', '#c9a24a', ['个展厅', '件展品'], { look: 'film', air: 'dust', out: 0, scale: .8 }],
    ['city', '🌆', '知识都市', 'Knowledge City', '逛街 · 看橱窗 · 阅读', '白天或夜晚，沿着市中心的大街走。每个清单是一家店，卡片摆在橱窗里。', '#ffb454', ['家店', '张卡'], { look: 'film', air: 'none', out: 1, scale: 1.4 }],
    ['galaxy', '🌌', '知识星系', 'Knowledge Galaxy', '飞行 · 降落 · 探索', '驾驶飞船飞过一串行星，每个看板一颗。点行星降落，沿着卡片纪念碑走，或者跃迁到下一颗。', '#6fd3ff', ['颗行星', '张卡'], { look: 'neon', air: 'none', out: 0, scale: 1.5 }],
    ['balloon', '🎈', '知识热气球', 'Knowledge Balloon', '飞行 · 漂流 · 阅读', '乘热气球飘过卡片：每个清单一条航线，每张卡片一座浮岛。点一座岛飞过去，再点一下阅读。', '#ff8fb1', ['条航线', '座岛'], { look: 'film', air: 'petal', out: 1, scale: 3 }]
  ];
  var KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-'];
  function named(a) { return (a || []).map(function (s) { var id = s.id || s[0], n = String(s.name || s[1] || id); return { id: id, name: s.icon ? n.replace(/^\S+\s/, function (m) { return /^[\x20-\x7e]+$/.test(m) ? m : ''; }) : n.replace(/^[^\x20-\x7e]\S*\s/, ''), icon: s.icon || (/^[^\x20-\x7e]/.test(n) ? n.split(' ')[0] : '') }; }); }
  // how each 1.0 presentation is opened, and the styles it offers itself
  var API = {
    drive: { api: function () { return DR; }, styles: function () { return named(DR.styles); }, label: '风景', opt: 'style' },
    train: { api: function () { return window.MinestTrain; }, styles: function () { return named(DR.styles); }, label: '窗外', opt: 'style' },
    metro: { api: function () { return window.MinestMetro; }, styles: function () { return named(window.MinestMetro && MinestMetro.themes); }, label: '车站', max: 8 },
    tower: { api: function () { return window.MinestTower; }, styles: function () { return named(window.MinestTower && MinestTower.exteriors); }, label: '外观', opt: 'ext', oneBoard: 1 },
    roadtrip: { api: function () { return DR.trips && DR.trips.length ? DR : null; }, styles: function () { return named(DR.trips); }, label: '路线', opt: 'style', first: 1 },
    rack: { api: function () { return window.MinestRack; }, styles: function () { return named(window.MinestRack && MinestRack.shapes); }, label: '展架', opt: 'shape' },
    library: { api: function () { return window.MinestLibrary; }, styles: function () { return named(window.MinestLibrary && MinestLibrary.atmospheres); }, label: '灯光', opt: 'atm' },
    museum: { api: function () { return window.MinestMuseum; }, styles: function () { return []; } },
    city: { api: function () { return window.MinestCity; }, styles: function () { return named(window.MinestCity && MinestCity.styles); }, label: '街区', opt: 'style' },
    galaxy: { api: function () { return window.MinestGalaxy; }, styles: function () { return []; }, planets: 1 },
    balloon: { api: function () { return window.MinestBalloon; }, styles: function () { return named(window.MinestBalloon && MinestBalloon.themes); }, label: '天空', opt: 'style' }
  };
  var TOUR_S = 18, STATE = 'minest.dyn2.state', SEEN = 'minest.dyn2.seen';
  var $ = function (id) { return document.getElementById(id); };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function info(id) { for (var i = 0; i < MODES.length; i++) if (MODES[i][0] === id) return MODES[i]; return null; }
  function index(id) { for (var i = 0; i < MODES.length; i++) if (MODES[i][0] === id) return i; return 0; }
  function read(k, d) { try { var v = JSON.parse(localStorage.getItem(k) || 'null'); return v && typeof v === 'object' ? v : d; } catch (e) { return d; } }
  function write(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  var calm = false; try { calm = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  var st = read(STATE, {}); st.src = st.src || {}; st.style = st.style || {}; st.fx = st.fx || {};
  var seen = read(SEEN, {});
  var sel = info(st.mode) ? st.mode : 'drive', running = null, inst = null, token = 0, switching = false, touring = false, tourT = 0, tourAt = 0;
  function keep() { st.mode = sel; write(STATE, st); }

  /* ───────────── the cards: a board, one of its lists, or every board ───────────── */
  function boards() { return Dt.boards(); }
  function board() { var B = boards(); return B.filter(function (b) { return b.id === st.src.b; })[0] || B[0] || null; }
  function list() { var b = board(); return b && st.src.b === b.id && st.src.l ? (b.columns || []).filter(function (c) { return c.id === st.src.l; })[0] || null : null; }
  function all() { return st.src.b === '*' && boards().length > 1; }
  function source(id) {
    var b = board(), l = list(); if (!b) return null;
    if (all() && !API[id].oneBoard) return { type: 'workspace' };
    return l && !all() ? { type: 'list', bid: b.id, col: l.id } : { type: 'board', bid: b.id };
  }
  function provider(id) {   // the Galaxy takes no source: every board is a planet, as in 1.0; here the chosen board is the first one on the route
    var b = board(), B = boards();
    if (!API[id].planets || !b || B[0] === b) return Dt.provider;
    return { boards: function () { var L = boards(), c = board(); return c ? [c].concat(L.filter(function (x) { return x !== c; })) : L; }, openCard: null };
  }
  function tally(id) {   // [lists, cards] in that presentation's own words
    var A = API[id], src = source(id); if (!src) return [0, 0];
    if (A.planets) { var B = provider(id).boards(); return [B.length, B.reduce(function (n, b) { return n + Dt.count(b); }, 0)]; }
    try { var roads = DR.plan(src, Dt.provider).roads.slice(0, A.max || 1e9); return [roads.length, roads.reduce(function (n, r) { return n + r.items.length; }, 0)]; } catch (e) { return [0, 0]; }
  }
  function ready(id) { return !!API[id].api() && tally(id)[1] > 0; }
  function srcText() {
    var b = board(), l = list(); if (!b) return ['没有卡片', ''];
    if (all()) return ['全部看板', boards().length + ' 个看板 · ' + boards().reduce(function (n, x) { return n + Dt.count(x); }, 0) + ' 张卡片'];
    return [b.title || '看板', (l ? '从「' + (l.title || '清单') + '」出发 · ' : '') + Dt.count(b) + ' 张卡片'];
  }

  /* ───────────── 画风 and 氛围, remembered for each presentation ───────────── */
  function fxOf(id) { var M = info(id)[8], f = st.fx[id] || {}; return { look: f.look || M.look, air: f.air || M.air }; }
  function airs(id) { var M = info(id)[8]; return FX.airs.filter(function (a) { return M.out || a.indoor; }); }
  function setFx(id, k, v) { st.fx[id] = st.fx[id] || {}; st.fx[id][k] = v; keep(); if (running === id) lens(id); draw(); }
  function lens(id) { var f = fxOf(id); FX.set({ look: f.look, air: f.air, scale: info(id)[8].scale }); }
  function chips(kind, id, items, cur) {
    return items.map(function (x) { return '<button type="button" data-d2="' + kind + '" data-v="' + esc(x.id) + '"' + (x.id === cur ? ' class="on" aria-pressed="true"' : ' aria-pressed="false"') + ' title="' + esc(x.en || x.name || '') + '">' + (x.icon ? x.icon + ' ' : '') + esc(x.zh || x.name) + '</button>'; }).join('');
  }
  function fxRows(id) {
    var f = fxOf(id);
    return '<div class="d2-row"><label>画风</label><div class="d2-chips">' + chips('look', id, FX.looks, f.look) + '</div></div>' +
      '<div class="d2-row"><label>氛围</label><div class="d2-chips">' + chips('air', id, airs(id), f.air) + '</div></div>';
  }

  /* ───────────── 大厅 ───────────── */
  var lobby = $('d2-lobby'), grid = $('d2-grid'), detail = $('d2-detail'), side = $('d2-side'), fab = $('d2-fab'), curtain = $('d2-curtain'), panel = $('d2-panel');
  function draw() {
    var t = srcText(), n = MODES.filter(function (m) { return seen[m[0]]; }).length;
    $('d2-src').innerHTML = '<i>◈</i><span><b>' + esc(t[0]) + '</b><small>' + esc(t[1]) + (Dt.sample() ? ' · 示例' : '') + '</small></span><em>▾</em>';
    $('d2-pass').innerHTML = '<i>✦</i><span><b>' + n + '</b> / ' + MODES.length + '</span><small>已体验</small>';
    grid.innerHTML = MODES.map(function (m, i) {
      var c = tally(m[0]), ok = ready(m[0]);
      return '<button type="button" role="option" aria-selected="' + (m[0] === sel) + '" data-d2="pick" data-m="' + m[0] + '" class="d2-card kdg-m-' + m[0] + (m[0] === sel ? ' on' : '') + (ok ? '' : ' off') + (seen[m[0]] ? ' seen' : '') + '" style="--acc:' + m[6] + '">' +
        '<span class="kdg-art" aria-hidden="true"><i></i><i></i><i></i><span></span></span><kbd>' + KEYS[i] + '</kbd><u>✓</u>' +
        '<b>' + m[1] + ' ' + m[2] + '</b><small>' + m[3] + '</small><em>' + m[4] + '</em><s>' + (ok ? c[0] + ' ' + m[7][0] + ' · ' + c[1] + ' ' + m[7][1] : '这里没有可用的卡片') + '</s></button>';
    }).join('');
    var M = info(sel), A = API[sel], styles = A.styles(), cur = st.style[sel] || '';
    var html = '<div class="d2-what"><b>' + M[1] + ' ' + M[2] + '<small>' + M[3] + '</small></b><p>' + M[5] + '</p></div><div class="d2-opts">' +
      (styles.length ? '<div class="d2-row"><label>' + A.label + '</label><div class="d2-chips">' + chips('style', sel, styles, cur) + '</div></div>' : '') + fxRows(sel) + '</div>' +
      '<div class="d2-acts"><button type="button" id="d2-go" data-d2="go"' + (ready(sel) ? '' : ' disabled') + '><i>▶</i>出发</button><button type="button" data-d2="tour" title="巡演：把十一种呈现挨个走一遍"><i>◎</i>巡演</button></div>';
    detail.innerHTML = html; detail.style.setProperty('--acc', M[6]); lobby.style.setProperty('--acc', M[6]);
    if (running) drawSide();
  }
  function drawSide() {
    var f = fxOf(running), M = info(running);
    side.style.setProperty('--acc', M[6]); fab.style.setProperty('--acc', M[6]);
    side.innerHTML = '<header><b>' + M[1] + ' ' + M[2] + '</b><small>动态呈现 2.0</small><button type="button" data-d2="side" aria-label="收起">✕</button></header>' +
      '<h4>换乘 <small>同一批卡片，换一种呈现 · [ ]</small></h4><div class="d2-hop">' + MODES.map(function (m) { return '<button type="button" data-d2="hop" data-m="' + m[0] + '"' + (m[0] === running ? ' class="on"' : '') + (ready(m[0]) ? '' : ' disabled') + ' style="--acc:' + m[6] + '" title="' + m[3] + '"><i>' + m[1] + '</i>' + m[2] + '</button>'; }).join('') + '</div>' +
      '<h4>画风 <small>, .</small></h4><div class="d2-chips">' + chips('look', running, FX.looks, f.look) + '</div>' +
      '<h4>氛围 <small>/</small></h4><div class="d2-chips">' + chips('air', running, airs(running), f.air) + '</div>' +
      '<div class="d2-acts"><button type="button" data-d2="tour"' + (touring ? ' class="on"' : '') + '><i>◎</i>巡演 <small>\\</small></button><button type="button" data-d2="clean"><i>◐</i>沉浸 <small>`</small></button><button type="button" data-d2="home"><i>⌂</i>大厅</button></div>';
  }
  function pick(id, start) { if (!info(id)) return; sel = id; keep(); draw(); var c = grid.querySelector('.d2-card.on'); if (c && c.scrollIntoView) c.scrollIntoView({ block: 'nearest', inline: 'nearest' }); if (start) go(id); }

  /* the board and list picker */
  function drawPanel() {
    var B = boards(), b = board(), l = list();
    panel.innerHTML = '<header><b>卡片从哪里来</b><small>' + (Dt.sample() ? '这台设备上还没有 Minest 的看板，先用示例' : '只读：这里不会改动你的看板') + ' · 点一个清单，就从它出发</small></header><div class="d2-boards">' +
      (B.length > 1 ? '<button type="button" data-d2="src" data-b="*"' + (all() ? ' class="on"' : '') + '><b>🌐 全部看板</b><small>' + B.length + ' 个看板</small></button>' : '') +
      B.map(function (x) {
        var open = !all() && b && x.id === b.id;
        return '<button type="button" data-d2="src" data-b="' + esc(x.id) + '"' + (open && !l ? ' class="on"' : '') + '><b>' + esc(x.title || '看板') + '</b><small>' + (x.columns || []).length + ' 个清单 · ' + Dt.count(x) + ' 张卡片</small></button>' +
          (open ? '<div class="d2-lists">' + (x.columns || []).filter(function (c) { return (c.cards || []).length; }).map(function (c) { return '<button type="button" data-d2="src" data-b="' + esc(x.id) + '" data-l="' + esc(c.id) + '"' + (l && l.id === c.id ? ' class="on"' : '') + '><i style="background:' + esc(c.color || '#8b9dff') + '"></i>' + esc(c.title || '清单') + '<small>' + (c.cards || []).length + '</small></button>'; }).join('') + '</div>' : '');
      }).join('') + '</div>';
  }
  function togglePanel(on) { on = on == null ? panel.hidden : on; panel.hidden = !on; $('d2-src').setAttribute('aria-expanded', on); if (on) drawPanel(); }

  /* ───────────── the title card between two presentations ───────────── */
  var curT = 0;
  function titleCard(M, mid, note) {
    clearTimeout(curT);
    curtain.style.setProperty('--acc', M ? M[6] : '#8b9dff');
    curtain.innerHTML = M ? '<div><i>' + M[1] + '</i><b>' + M[2] + '</b><small>' + M[3] + '</small><em>' + (note || M[4]) + '</em></div>' : '<div><i>✦</i><b>动态呈现 2.0</b><small>Presentation Gallery · MK II</small></div>';
    curtain.className = 'in';
    curT = setTimeout(function () {
      try { mid(); } catch (e) { toast(e && e.message || String(e)); }
      curT = setTimeout(function () { curtain.className = 'out'; curT = setTimeout(function () { curtain.className = ''; }, calm ? 0 : 520); }, calm ? 0 : 620);
    }, calm ? 0 : 400);
  }
  var toastT = 0;
  function toast(s) { var t = $('d2-toast'); t.textContent = s; t.className = 'on'; clearTimeout(toastT); toastT = setTimeout(function () { t.className = ''; }, 2600); }

  /* ───────────── running one ───────────── */
  function scene(c) { var L = document.body.classList; ['d2-lobby', 'd2-run', 'd2-clean', 'd2-open'].forEach(function (x) { L.toggle(x, x === c); }); }
  function shut() { var i = inst; inst = null; if (!i) return; switching = true; try { if (i.close) i.close(); } catch (e) {} switching = false; }
  function open(id) {
    var A = API[id], api = A.api(), my = ++token, style = st.style[id] || '';
    var o = { source: source(id), provider: provider(id), fresh: /[?&]fresh\b/.test(location.search), onExit: function () { if (my === token && !switching) home(true); } };
    if (id === 'metro') { o.maxLines = A.max; if (style) try { var a = read('minest.metro.v1', {}), k = DR.plan(o.source, o.provider).key; a[k] = a[k] || {}; a[k].theme = style; write('minest.metro.v1', a); } catch (e) {} }   // (the Metro reads its station style from its own saved place, as in 1.0)
    else if (A.opt) o[A.opt] = style || (A.first ? A.styles()[0].id : undefined);
    if (touring && (id === 'drive' || id === 'roadtrip')) o.intro = false;   // on tour the car is already rolling
    lens(id);
    inst = api.open(o); running = id; sel = id; seen[id] = (seen[id] || 0) + 1; write(SEEN, seen); keep();
    scene('d2-run');
    document.body.setAttribute('data-d2-mode', id); draw();
  }
  function go(id, note) {
    if (!info(id)) return; if (!ready(id)) { toast(info(id)[2] + '：这里没有可用的卡片'); return; }
    togglePanel(false);
    titleCard(info(id), function () {
      shut();
      try { open(id); } catch (e) { running = null; home(false); throw e; }
    }, note);
  }
  function home(soft) {
    tour(false); token++;
    function back() { shut(); running = null; scene('d2-lobby'); document.body.removeAttribute('data-d2-mode'); FX.set({ look: 'off', air: 'none' }); draw(); }
    if (soft) { back(); curtain.className = 'out'; setTimeout(function () { curtain.className = ''; }, 420); } else titleCard(null, back);
  }
  function hop(d) { if (!running) return; var i = index(running), n = MODES.length, k; for (k = 1; k <= n; k++) { var m = MODES[(i + d * k + n * k) % n][0]; if (ready(m)) return go(m); } }
  function cycle(kind, d) {
    if (!running) return; var L = kind === 'look' ? FX.looks : airs(running), cur = fxOf(running)[kind], i = 0;
    L.forEach(function (x, k) { if (x.id === cur) i = k; });
    var nx = L[(i + d + L.length) % L.length]; setFx(running, kind, nx.id); toast((kind === 'look' ? '画风 · ' : '氛围 · ') + nx.zh);
  }
  function tour(on) {
    on = on == null ? !touring : !!on; if (on === touring) return;
    touring = on; clearInterval(tourT); document.body.classList.toggle('d2-tour', on);
    if (on) {
      tourAt = Date.now();
      tourT = setInterval(function () {
        var left = TOUR_S - (Date.now() - tourAt) / 1000; fab.style.setProperty('--tour', Math.max(0, Math.min(1, 1 - left / TOUR_S)));
        if (left <= 0 && !curtain.className) { tourAt = Date.now(); hop(1); }
      }, 250);
      if (!running) go(ready(sel) ? sel : 'drive', '巡演 · 每 ' + TOUR_S + ' 秒换一种');
    } else fab.style.removeProperty('--tour');
    if (running) drawSide();
  }
  function clean(on) { document.body.classList.toggle('d2-clean', on == null ? !document.body.classList.contains('d2-clean') : on); document.body.classList.remove('d2-open'); }

  /* ───────────── input ───────────── */
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-d2]');
    if (!b) { if (!panel.hidden && !e.target.closest('#d2-panel, #d2-src')) togglePanel(false); return; }
    var k = b.dataset.d2, v = b.dataset.v, id = running || sel;
    if (k === 'pick') { if (b.dataset.m === sel && e.detail > 1) go(sel); else pick(b.dataset.m); }
    else if (k === 'go') go(sel);
    else if (k === 'hop') { if (b.dataset.m !== running) { tourAt = Date.now(); go(b.dataset.m); } }
    else if (k === 'style') { st.style[sel] = st.style[sel] === v ? '' : v; keep(); draw(); }
    else if (k === 'look' || k === 'air') setFx(id, k, v);
    else if (k === 'tour') tour();
    else if (k === 'clean') clean();
    else if (k === 'home') home(false);
    else if (k === 'side') { if (document.body.classList.contains('d2-clean')) clean(false); else document.body.classList.toggle('d2-open'); }
    else if (k === 'srcbtn') togglePanel();
    else if (k === 'src') { st.src = { b: b.dataset.b, l: b.dataset.l || '' }; keep(); draw(); drawPanel(); if (b.dataset.l || b.dataset.b === '*') togglePanel(false); }
  });
  grid.addEventListener('dblclick', function (e) { var b = e.target.closest('.d2-card'); if (b) go(b.dataset.m); });
  ['pointerdown', 'touchstart', 'wheel'].forEach(function (ev) { [side, fab].forEach(function (el) { el.addEventListener(ev, function (e) { e.stopPropagation(); }, { passive: true }); }); });
  window.addEventListener('keydown', function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey || /^(INPUT|TEXTAREA|SELECT)$/.test((e.target && e.target.tagName) || '')) return;
    var k = e.key, hit = true;
    if (running) {   // (the 1.0 presentations use letters, digits, arrows and Space themselves: 2.0 keeps to these)
      if (k === '[') hop(-1); else if (k === ']') hop(1); else if (k === ',') cycle('look', -1); else if (k === '.') cycle('look', 1); else if (k === '/') cycle('air', 1);
      else if (k === '\\') tour(); else if (k === '`') clean(); else hit = false;
    } else {
      var i = KEYS.indexOf(k);
      if (i >= 0) pick(MODES[i][0]); else if (k === 'Enter') go(sel); else if (k === 'ArrowRight' || k === 'ArrowDown') pick(MODES[(index(sel) + 1) % MODES.length][0]);
      else if (k === 'ArrowLeft' || k === 'ArrowUp') pick(MODES[(index(sel) + MODES.length - 1) % MODES.length][0]); else if (k === '\\') tour(); else if (k === 'Escape') togglePanel(false); else hit = false;
    }
    if (hit) { e.preventDefault(); e.stopPropagation(); }
  }, true);
  window.addEventListener('dyn2:data', function () { if (!running) draw(); });

  window.Dyn2 = { modes: MODES.map(function (m) { return { id: m[0], zh: m[2], en: m[3] }; }), go: go, lobby: function () { home(false); }, tour: tour, look: function (id) { if (running) setFx(running, 'look', id); }, air: function (id) { if (running) setFx(running, 'air', id); },
    state: function () { return { running: running, selected: sel, touring: touring, source: source(sel), fx: fxOf(running || sel), seen: seen }; } };

  scene('d2-lobby'); draw();
  Dt.ready(function () {
    draw();
    var q = location.search, m = (q.match(/[?&]mode=([a-z]+)/) || [])[1], lk = (q.match(/[?&]look=([a-z]+)/) || [])[1], ar = (q.match(/[?&]air=([a-z]+)/) || [])[1];
    if (m && info(m)) { if (lk) { st.fx[m] = st.fx[m] || {}; st.fx[m].look = lk; } if (ar) { st.fx[m] = st.fx[m] || {}; st.fx[m].air = ar; } }
    if (/[?&]tour\b/.test(q)) { if (m && info(m)) sel = m; tour(true); } else if (m && info(m)) go(m);
  });
})();
