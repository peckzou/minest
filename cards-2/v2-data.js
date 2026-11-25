/* 动态卡片 2.0 · the cards the 1.0 engine shows (../tools/cover-modes/cover-modes.js reads MinestAI.board() and
   MinestImageViews, which Minest itself provides; here they are stand-ins). The boards are read, never written:
   the ones Minest keeps on this device (same web address, so the same storage), else a sample deck.
   window.Cards2Data = { boards(), board(), pick(boardId, listId), listId(), rev(), sample(), ready(fn) } */
(function () {
  'use strict';
  var LS_BOARDS = 'focusboard_boards_v7_2', LS_ACTIVE = 'focusboard_active_id_v7_2', IDB = 'focusboard_idb_v1', MINE = 'minest.cards2.board';
  var boards = [], cur = null, listId = '', isSample = false, waiting = [], done = false, rev = 0, last = '';

  function count(b) { return (b.columns || []).reduce(function (n, c) { return n + (c.cards || []).reduce(function (k, x) { return k + 1 + (x.stack || []).filter(function (c) { return c && c.id; }).length; }, 0); }, 0); }
  function clean(v) {
    if (typeof v === 'string') { try { v = JSON.parse(v); } catch (e) { v = null; } }
    return Array.isArray(v) ? v.filter(function (b) { return b && b.id && Array.isArray(b.columns) && count(b) > 0; }) : [];
  }
  function mem(v) { try { if (v === undefined) return JSON.parse(localStorage.getItem(MINE) || 'null'); localStorage.setItem(MINE, JSON.stringify(v)); } catch (e) { return null; } }
  /* what the boards say, with long values (embedded pictures) cut short: the two copies Minest keeps are told apart by it */
  function told(list) { try { return JSON.stringify(list, function (k, v) { return typeof v === 'string' && v.length > 240 ? v.length + ':' + v.slice(0, 80) + v.slice(-80) : v; }); } catch (e) { return String(Math.random()); } }
  /* EC-6 391 · 考纲理解与学习工作台 (philosophers-island/ec6/study/board.js, the content package's 8-section board) is the
     first board and the one 2.0 opens on until you pick another (the pick is remembered); the EC-6 glossary deck
     (philosophers-island/ec6/glossary.js) comes second */
  var EC6S = [];
  try { if (window.PIEC6_STUDY_BOARD && window.PIEC6_STUDY_BOARD.columns) EC6S.push(window.PIEC6_STUDY_BOARD); } catch (e) {}
  try { if (window.PIEC6 && window.PIEC6.glossaryBoard) EC6S.push(window.PIEC6.glossaryBoard()); } catch (e) {}
  var EC6 = EC6S[0] || null;
  function use(list, sample) {
    if (EC6S.length) list = EC6S.concat(list.filter(function (b) { return !EC6S.some(function (x) { return x.id === b.id; }); }));
    var t = told(list); if (t !== last) { last = t; rev++; }
    boards = list; isSample = !!sample && !EC6;
    var m = mem() || {}, act = ''; try { act = localStorage.getItem(LS_ACTIVE) || ''; } catch (e) {}
    cur = boards.filter(function (b) { return b.id === m.b; })[0] || (EC6 ? boards[0] : null) || boards.filter(function (b) { return b.id === act; })[0] || boards[0] || null;
    listId = cur && cur.id === m.b && (cur.columns || []).some(function (c) { return c.id === m.l; }) ? m.l : '';
    window.dispatchEvent(new CustomEvent('cards2:data'));
  }

  /* the sample deck: drawn here, nothing fetched */
  function art(h, kind, i) {
    var a = 'hsl(' + h + ',78%,58%)', b = 'hsl(' + ((h + 48) % 360) + ',80%,34%)', c = 'hsl(' + ((h + 320) % 360) + ',90%,72%)', body = '';
    if (kind === 0) body = '<circle cx="150" cy="118" r="' + (44 + (i % 4) * 7) + '" fill="url(#p)"/><ellipse cx="150" cy="118" rx="' + (86 + (i % 3) * 8) + '" ry="15" fill="none" stroke="' + c + '" stroke-width="3" opacity="' + (i % 2 ? .75 : 0) + '"/>';
    else if (kind === 1) { var pts = []; for (var k = 0; k < 6; k++) pts.push([40 + ((i * 53 + k * 97) % 220), 30 + ((i * 31 + k * 71) % 160)]);
      body = '<polyline points="' + pts.map(function (p) { return p.join(','); }).join(' ') + '" fill="none" stroke="' + c + '" stroke-width="1.6" opacity=".7"/>' + pts.map(function (p, k) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + (k % 3 ? 3.2 : 5.5) + '" fill="#fff"/>'; }).join(''); }
    else body = '<g transform="rotate(' + (-28 + (i % 5) * 9) + ' 150 110)"><rect x="118" y="86" width="64" height="48" rx="8" fill="url(#p)"/><rect x="42" y="98" width="68" height="24" rx="3" fill="' + c + '" opacity=".85"/><rect x="190" y="98" width="68" height="24" rx="3" fill="' + c + '" opacity=".85"/><circle cx="150" cy="72" r="13" fill="none" stroke="#fff" stroke-width="3"/></g>';
    return 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 220"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + b + '"/><stop offset="1" stop-color="#070b1c"/></linearGradient>' +
      '<radialGradient id="p" cx=".35" cy=".3"><stop offset="0" stop-color="' + c + '"/><stop offset=".55" stop-color="' + a + '"/><stop offset="1" stop-color="' + b + '"/></radialGradient></defs><rect width="300" height="220" fill="url(#g)"/>' +
      [0, 1, 2, 3, 4, 5, 6].map(function (k) { return '<circle cx="' + ((i * 37 + k * 83) % 300) + '" cy="' + ((i * 59 + k * 47) % 220) + '" r="1.2" fill="#fff" opacity=".6"/>'; }).join('') + body + '</svg>');
  }
  function sampleBoards() {
    var L = [
      ['行星 · Planets', '#38bdf8', 0, ['水星 Mercury|离太阳最近，一年只有 88 天。', '金星 Venus|最热的行星，自转方向与众不同。', '地球 Earth|目前唯一已知有生命的星球。', '火星 Mars|红色的铁锈星球，有太阳系最高的山。', '木星 Jupiter|最大的行星，大红斑是一场持续几百年的风暴。', '土星 Saturn|光环由冰和岩石碎片组成。', '天王星 Uranus|躺着自转的冰巨星。', '海王星 Neptune|风速最快的行星。', '冥王星 Pluto|柯伊伯带里的矮行星。', '月球 Moon|地球唯一的天然卫星。']],
      ['星座 · Constellations', '#a78bfa', 1, ['猎户座 Orion|冬季夜空最醒目的星座。', '大熊座 Ursa Major|北斗七星就在这里。', '天蝎座 Scorpius|心宿二是它火红的心脏。', '仙后座 Cassiopeia|一个明亮的 W。', '天鹅座 Cygnus|沿着银河飞翔的北十字。', '狮子座 Leo|春季夜空的王者。', '天琴座 Lyra|织女星所在的小星座。', '南十字座 Crux|南半球的指路星。', '金牛座 Taurus|昴星团与毕宿五。', '双子座 Gemini|北河二与北河三。', '仙女座 Andromeda|肉眼可见的最远星系在这里。', '天鹰座 Aquila|牛郎星所在的星座。']],
      ['探测器 · Probes', '#f472b6', 2, ['旅行者 1 号 Voyager 1|飞得最远的人造物体。', '哈勃 Hubble|在轨三十多年的太空望远镜。', '韦伯 Webb|用红外线看宇宙最早的光。', '好奇号 Curiosity|在火星上行驶的核动力车。', '嫦娥四号 Chang’e 4|首次在月球背面软着陆。', '卡西尼 Cassini|环绕土星十三年。', '新视野号 New Horizons|第一次近看冥王星。', '帕克 Parker|飞进日冕的探测器。', '天问一号 Tianwen-1|一次完成绕、落、巡。', '朱诺 Juno|在木星极地上空飞行。']]
    ];
    return [{ id: 'cards2-sample', title: '星空图鉴 · 示例', columns: L.map(function (l, li) {
      return { id: 'cards2-l' + li, title: l[0], color: l[1], cards: l[3].map(function (s, i) { var p = s.split('|');
        return { id: 'cards2-' + li + '-' + i, title: p[0], description: p[1], meaning: p[1], cover: { type: 'image', value: art((li * 118 + i * 29 + 190) % 360, l[2], i) } }; }) };
    }) }];
  }

  /* the board the engine sees: the chosen board, or one of its lists */
  function view() {
    if (!cur) return null;
    if (!listId && rev < 2) return cur;
    var o = {}; for (var k in cur) o[k] = cur[k];
    o.id = cur.id + (listId ? '#' + listId : '') + (rev > 1 ? '@' + rev : '');   // (the engine keeps a deck's cards by its id: a list, or a newer copy, is another deck to it)
    if (listId) o.columns = (cur.columns || []).filter(function (c) { return c.id === listId; });
    return o;
  }
  window.MinestAI = { board: view, boards: function () { return boards; } };
  window.MinestImageViews = {
    cards: function (b) {
      var out = [];
      (b.columns || []).forEach(function (col) { (col.cards || []).forEach(function (card) {
        function add(c, parent) { var o = {}; for (var k in c) o[k] = c[k]; o.columnId = col.id; o.columnTitle = col.title; o.columnColor = col.color || '#30d158'; o.parentCardId = parent; out.push(o); }
        add(card, null); (card.stack || []).forEach(function (c) { if (c && c.id) add(c, card.id); });
      }); });
      return out;
    },
    image: function (card) {   // as Minest's own, minus the cloud originals (those need its sign-in)
      var c = card.cover || {}, im = card.image;
      var src = (c.type === 'image' ? c.value : '') || (typeof im === 'string' ? im : im && (im.url || im.src)) || '';
      var full = c.fullUrl || c.originalImageUrl || src, thumb = c.thumbnailUrl || card.thumbnailUrl || (im && im.thumbnailUrl) || src || full;
      return { full: full, thumb: thumb, asset: null, width: c.width || 4, height: c.height || 3 };
    },
    select: function () {}
  };

  window.Cards2Data = {
    boards: function () { return boards; }, board: function () { return cur; }, listId: function () { return listId; }, rev: function () { return rev; }, sample: function () { return isSample; }, count: count,
    pick: function (b, l) { var nb = boards.filter(function (x) { return x.id === b; })[0]; if (!nb) return; cur = nb; listId = l && (nb.columns || []).some(function (c) { return c.id === l; }) ? l : ''; mem({ b: cur.id, l: listId }); window.dispatchEvent(new CustomEvent('cards2:data')); },
    ready: function (fn) { if (done) fn(); else waiting.push(fn); }
  };

  /* inside Minest's frame (../v2-bridge/bridge.js): Minest's own boards, on the board you were on; else this site's copy */
  var BR = window.MinestV2Bridge;
  if (BR && BR.embedded && !/[?&]sample\b/.test(location.search)) {
    BR.hello().then(function (r) {
      var v = r && clean(r.boards);
      if (v && v.length) { if (r.active && !EC6) mem({ b: r.active, l: '' }); use(v, false); finish(); } else load();
    });
    return;
  }
  load();
  function load() {
  /* load: localStorage first (what Minest paints from), then its IndexedDB copy (the full one) */
  var own = []; try { own = clean(localStorage.getItem(LS_BOARDS)); } catch (e) {}
  if (/[?&]sample\b/.test(location.search)) own = [];
  if (own.length) use(own, false); else use(sampleBoards(), true);
  if (/[?&]sample\b/.test(location.search) || !window.indexedDB) { finish(); return; }
  try {
    var req = indexedDB.open(IDB), fresh = false;
    req.onupgradeneeded = function () { fresh = true; try { req.transaction.abort(); } catch (e) {} };   // Minest has not made it yet: leave it that way
    req.onerror = function () { finish(); };
    req.onsuccess = function () {
      var db = req.result;
      if (fresh || !db.objectStoreNames.contains('kv')) { db.close(); finish(); return; }
      try {
        var g = db.transaction('kv', 'readonly').objectStore('kv').get('boards');
        g.onsuccess = function () { var v = clean(g.result); db.close(); if (v.length) use(v, false); finish(); };
        g.onerror = function () { db.close(); finish(); };
      } catch (e) { db.close(); finish(); }
    };
  } catch (e) { finish(); }
  }
  function finish() { done = true; waiting.splice(0).forEach(function (fn) { try { fn(); } catch (e) {} }); }
})();
