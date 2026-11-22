/* 动态呈现 2.0 · the cards the eleven 1.0 presentations travel through. They read boards through a provider
   ({ boards() }), which Minest itself gives them from MinestAI; here it is this file. The boards are read, never written:
   the ones Minest keeps on this device (same web address, so the same storage), else three sample boards.
   window.Dyn2Data = { boards(), provider, sample(), count(board), ready(fn) } */
(function () {
  'use strict';
  var LS_BOARDS = 'focusboard_boards_v7_2', IDB = 'focusboard_idb_v1';
  var boards = [], isSample = false, waiting = [], done = false;

  function count(b) { return (b.columns || []).reduce(function (n, c) { return n + (c.cards || []).reduce(function (k, x) { return k + 1 + (x.stack || []).filter(function (c) { return c && c.id; }).length; }, 0); }, 0); }
  function clean(v) {
    if (typeof v === 'string') { try { v = JSON.parse(v); } catch (e) { v = null; } }
    return Array.isArray(v) ? v.filter(function (b) { return b && b.id && Array.isArray(b.columns) && count(b) > 0; }) : [];
  }
  function use(list, sample) { boards = list; isSample = !!sample; window.dispatchEvent(new CustomEvent('dyn2:data')); }

  /* a picture chosen from this device lives in Minest's own image store (minest-visual-assets); the card keeps its id, and a
     blob: address that ended with Minest's last visit. Here the stored picture gets an address of this page's own. */
  var assets = null;
  function loadAssets(cb) {
    if (assets || !window.indexedDB || !window.URL || !URL.createObjectURL) return cb();
    assets = {};
    try {
      var req = indexedDB.open('minest-visual-assets'), fresh = false;
      req.onupgradeneeded = function () { fresh = true; try { req.transaction.abort(); } catch (e) {} };   // Minest has not made it yet: leave it that way
      req.onerror = function () { cb(); };
      req.onsuccess = function () {
        var db = req.result;
        if (fresh || !db.objectStoreNames.contains('images')) { db.close(); cb(); return; }
        try {
          var g = db.transaction('images', 'readonly').objectStore('images').getAll();
          g.onsuccess = function () { (g.result || []).forEach(function (a) { if (a && a.id && a.blob) try { assets[a.id] = URL.createObjectURL(a.blob); } catch (e) {} }); db.close(); cb(); };
          g.onerror = function () { db.close(); cb(); };
        } catch (e) { db.close(); cb(); }
      };
    } catch (e) { cb(); }
  }
  function mend(list) {   // (on this page's own copy of the boards)
    list.forEach(function (b) { (b.columns || []).forEach(function (col) { (col.cards || []).forEach(function (c) { [c].concat(c.stack || []).forEach(function (k) {
      var id = k && k.userImage && k.userImage.localAssetId; if (!id) return;
      var u = assets && assets[id] || '', cv = {}; for (var f in k.cover || {}) cv[f] = k.cover[f];
      cv.type = 'image'; cv.value = u; cv.url = u; k.cover = cv;
    }); }); }); });
  }

  /* the sample boards: every picture is drawn here, nothing is fetched */
  function art(h, kind, i) {
    var a = 'hsl(' + h + ',72%,56%)', b = 'hsl(' + ((h + 48) % 360) + ',70%,30%)', c = 'hsl(' + ((h + 320) % 360) + ',88%,74%)', body = '', k, pts;
    if (kind === 0) body = '<circle cx="150" cy="112" r="' + (44 + (i % 4) * 7) + '" fill="url(#p)"/><ellipse cx="150" cy="112" rx="' + (86 + (i % 3) * 8) + '" ry="15" fill="none" stroke="' + c + '" stroke-width="3" opacity="' + (i % 2 ? .75 : 0) + '"/>';
    else if (kind === 1) { pts = []; for (k = 0; k < 6; k++) pts.push([40 + ((i * 53 + k * 97) % 220), 30 + ((i * 31 + k * 71) % 160)]);
      body = '<polyline points="' + pts.map(function (p) { return p.join(','); }).join(' ') + '" fill="none" stroke="' + c + '" stroke-width="1.6" opacity=".7"/>' + pts.map(function (p, k) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + (k % 3 ? 3.2 : 5.5) + '" fill="#fff"/>'; }).join(''); }
    else if (kind === 2) body = '<g transform="rotate(' + (-28 + (i % 5) * 9) + ' 150 110)"><rect x="118" y="86" width="64" height="48" rx="8" fill="url(#p)"/><rect x="42" y="98" width="68" height="24" rx="3" fill="' + c + '" opacity=".85"/><rect x="190" y="98" width="68" height="24" rx="3" fill="' + c + '" opacity=".85"/><circle cx="150" cy="78" r="10" fill="#fff"/></g>';
    else if (kind === 3) body = '<circle cx="150" cy="86" r="38" fill="url(#p)"/><path d="M70 220c6-58 40-84 80-84s74 26 80 84z" fill="url(#p)"/><circle cx="150" cy="86" r="38" fill="none" stroke="' + c + '" stroke-width="2" opacity=".6"/>';
    else if (kind === 4) body = '<rect x="92" y="26" width="116" height="168" rx="6" fill="url(#p)"/><rect x="92" y="26" width="14" height="168" fill="#000" opacity=".28"/><rect x="118" y="52" width="74" height="8" rx="4" fill="#fff" opacity=".9"/><rect x="118" y="68" width="52" height="6" rx="3" fill="#fff" opacity=".6"/><circle cx="155" cy="132" r="' + (20 + (i % 3) * 5) + '" fill="' + c + '" opacity=".85"/>';
    else if (kind === 5) body = '<rect x="24" y="24" width="252" height="172" rx="4" fill="none" stroke="#fff" stroke-width="3" opacity=".5"/><path d="M0 220L' + (70 + (i % 4) * 20) + ' 90 150 160 ' + (210 + (i % 3) * 14) + ' 70 300 220z" fill="url(#p)"/><circle cx="' + (70 + (i * 41) % 170) + '" cy="62" r="20" fill="' + c + '"/>';
    else if (kind === 6) body = '<circle cx="' + (60 + (i * 47) % 180) + '" cy="70" r="26" fill="' + c + '"/><path d="M0 160C60 ' + (110 + (i % 3) * 14) + ' 110 190 170 150S260 120 300 150V220H0z" fill="' + a + '"/><path d="M0 186C70 160 130 206 200 180s70-16 100-6V220H0z" fill="' + b + '"/>';
    else if (kind === 7) body = [0, 1, 2, 3].map(function (k) { return '<path d="M0 ' + (90 + k * 30) + 'q37.5 -' + (18 + (i % 3) * 6) + ' 75 0t75 0t75 0t75 0V220H0z" fill="' + (k % 2 ? a : c) + '" opacity="' + (.35 + k * .18) + '"/>'; }).join('') + '<circle cx="' + (220 - (i * 23) % 150) + '" cy="52" r="18" fill="#fff" opacity=".85"/>';
    else body = '<path d="M' + (60 + (i % 3) * 10) + ' 200V' + (70 + (i % 4) * 14) + 'l40-40 40 40V200z" fill="url(#p)"/><path d="M170 200V' + (110 - (i % 3) * 16) + 'h' + (50 + (i % 2) * 20) + 'V200z" fill="' + c + '" opacity=".85"/><rect x="0" y="198" width="300" height="22" fill="#000" opacity=".35"/>' + [0, 1, 2, 3, 4, 5].map(function (k) { return '<rect x="' + (182 + (k % 2) * 22) + '" y="' + (122 + (k >> 1) * 22) + '" width="10" height="12" fill="#fff" opacity=".8"/>'; }).join('');
    return 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="600" height="440" viewBox="0 0 300 220"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + b + '"/><stop offset="1" stop-color="#0b1026"/></linearGradient>' +
      '<radialGradient id="p" cx=".35" cy=".3"><stop offset="0" stop-color="' + c + '"/><stop offset=".55" stop-color="' + a + '"/><stop offset="1" stop-color="' + b + '"/></radialGradient></defs><rect width="300" height="220" fill="url(#g)"/>' +
      [0, 1, 2, 3, 4, 5, 6].map(function (k) { return '<circle cx="' + ((i * 37 + k * 83) % 300) + '" cy="' + ((i * 59 + k * 47) % 220) + '" r="1.2" fill="#fff" opacity=".6"/>'; }).join('') + body + '</svg>');
  }
  function sampleBoards() {
    // [board, [list title, colour, picture kind, ['English|中文|what it is', …]]]
    var B = [
      ['星空图鉴 · Cosmos', [
        ['Planets 行星', '#38bdf8', 0, ['Mercury|水星|离太阳最近，一年只有 88 天。', 'Venus|金星|最热的行星，自转方向与众不同。', 'Earth|地球|目前唯一已知有生命的星球。', 'Mars|火星|红色的铁锈星球，有太阳系最高的山。', 'Jupiter|木星|最大的行星，大红斑是一场刮了几百年的风暴。', 'Saturn|土星|光环由无数冰块和岩石组成。', 'Uranus|天王星|躺着自转的冰巨星。', 'Neptune|海王星|风速最快的行星，一年是 165 个地球年。']],
        ['Constellations 星座', '#a78bfa', 1, ['Orion|猎户座|冬季夜空最醒目的星座。', 'Ursa Major|大熊座|北斗七星就在这里。', 'Scorpius|天蝎座|心宿二是它火红的心脏。', 'Cassiopeia|仙后座|一个明亮的 W。', 'Cygnus|天鹅座|沿着银河飞翔的北十字。', 'Lyra|天琴座|织女星是夏夜最亮的星之一。', 'Leo|狮子座|春天夜空里的一把镰刀。']],
        ['Probes 探测器', '#f472b6', 2, ['Voyager 1|旅行者 1 号|飞得最远的人造物体。', 'Hubble|哈勃|在轨三十多年的太空望远镜。', 'Webb|韦伯|用红外线看宇宙最早的光。', 'Curiosity|好奇号|在火星上行驶的核动力车。', 'Chang’e 4|嫦娥四号|第一次在月球背面着陆。', 'Cassini|卡西尼号|绕土星飞行了十三年。', 'New Horizons|新视野号|第一次近距离拍下冥王星。']],
        ['Astronomers 天文学家', '#fbbf24', 3, ['Galileo|伽利略|第一个用望远镜看见木星的卫星。', 'Kepler|开普勒|发现行星沿椭圆轨道运行。', 'Zhang Heng|张衡|造出浑天仪和地动仪。', 'Hubble, Edwin|埃德温·哈勃|发现宇宙正在膨胀。', 'Vera Rubin|薇拉·鲁宾|用星系的转速找到暗物质的证据。', 'Carl Sagan|卡尔·萨根|把宇宙讲给所有人听。']],
        ['Books 太空之书', '#34d399', 4, ['Cosmos|宇宙|萨根写给所有人的宇宙之旅。', 'A Brief History of Time|时间简史|霍金讲黑洞与时间的起点。', 'The Three-Body Problem|三体|刘慈欣笔下的文明相遇。', 'The Martian|火星救援|一个人在火星上种土豆。', 'Pale Blue Dot|暗淡蓝点|从 60 亿公里外回望地球。', 'The Little Prince|小王子|住在 B612 小行星上的孩子。']],
        ['Movies 太空电影', '#fb7185', 5, ['Interstellar|星际穿越|穿过虫洞寻找新的家园。', 'Gravity|地心引力|在轨道上独自求生。', 'Apollo 13|阿波罗 13 号|“休斯敦，我们有麻烦了。”', 'The Wandering Earth|流浪地球|带着地球离开太阳系。', '2001: A Space Odyssey|2001 太空漫游|黑石碑与 HAL 9000。', 'WALL·E|机器人总动员|留在地球上的小机器人。']]
      ]],
      ['自然笔记 · Nature', [
        ['Ecology 生态', '#4ade80', 6, ['Ecosystem|生态系统|生物和它们的环境组成的整体。', 'Food Web|食物网|谁吃谁，连成一张网。', 'Producer|生产者|用阳光制造养分的植物和藻类。', 'Consumer|消费者|靠吃其他生物获得能量。', 'Decomposer|分解者|把枯枝落叶变回土壤的养分。', 'Habitat|栖息地|一种生物生活的地方。', 'Biodiversity|生物多样性|物种越多，生态越稳。', 'Pollination|授粉|花粉搭上蜜蜂和风的便车。']],
        ['Weather 天气', '#60a5fa', 7, ['Cloud|云|悬在空中的小水滴和冰晶。', 'Rain|雨|云里的水滴大到托不住了。', 'Thunderstorm|雷暴|积雨云里的闪电与雷声。', 'Rainbow|彩虹|阳光被雨滴分成七种颜色。', 'Typhoon|台风|在温暖海面上生成的巨大气旋。', 'Fog|雾|贴着地面的云。', 'Snow|雪|每一片都是六角形的冰晶。']],
        ['Ocean 海洋', '#22d3ee', 7, ['Coral Reef|珊瑚礁|海里的热带雨林。', 'Tide|潮汐|月亮拉着海水一涨一落。', 'Current|洋流|海洋里的大河。', 'Kelp Forest|海藻林|一天能长半米的海底森林。', 'Deep Sea|深海|没有阳光，却有会发光的生物。', 'Blue Whale|蓝鲸|地球上出现过的最大动物。', 'Plankton|浮游生物|海洋食物网的第一环。']],
        ['Forest 森林', '#a3e635', 6, ['Canopy|树冠层|森林的屋顶，阳光最多的一层。', 'Understory|林下层|树荫里的灌木和小树。', 'Fungus|真菌|在地下把树根连成网络。', 'Rainforest|雨林|住着一半以上的陆地物种。', 'Taiga|针叶林|地球上最大的森林带。', 'Tree Ring|年轮|一圈就是一年。']]
      ]],
      ['世界建筑 · Architecture', [
        ['Ancient Wonders 古代奇迹', '#f59e0b', 8, ['Great Wall|长城|翻山越岭两万多公里。', 'Pyramids of Giza|吉萨金字塔|四千五百年前的陵墓。', 'Parthenon|帕特农神庙|雅典卫城上的大理石神殿。', 'Colosseum|罗马斗兽场|能坐五万人的圆形剧场。', 'Angkor Wat|吴哥窟|世界上最大的宗教建筑群。', 'Machu Picchu|马丘比丘|安第斯山顶的印加古城。', 'Forbidden City|故宫|世界上最大的木结构宫殿群。']],
        ['Modern Landmarks 现代地标', '#818cf8', 8, ['Eiffel Tower|埃菲尔铁塔|为 1889 年世博会而建。', 'Sydney Opera House|悉尼歌剧院|海港边的一组白色风帆。', 'Burj Khalifa|哈利法塔|828 米，世界最高的楼。', 'Fallingwater|流水别墅|架在瀑布上的房子。', 'Sagrada Família|圣家堂|从 1882 年一直盖到今天。', 'Bird’s Nest|鸟巢|钢铁编织的体育场。', 'Guggenheim Bilbao|毕尔巴鄂古根海姆|钛金属包起来的美术馆。']],
        ['Bridges 桥', '#f87171', 8, ['Golden Gate Bridge|金门大桥|雾中的国际橘色。', 'Zhaozhou Bridge|赵州桥|一千四百年的石拱桥。', 'Tower Bridge|伦敦塔桥|会为大船打开的桥。', 'Brooklyn Bridge|布鲁克林大桥|第一座钢索悬索桥。', 'Millau Viaduct|米约高架桥|桥塔比埃菲尔铁塔还高。', 'Hong Kong–Zhuhai–Macao Bridge|港珠澳大桥|55 公里的桥、岛、隧。']]
      ]]
    ];
    return B.map(function (b, bi) {
      return { id: 'dyn2-b' + bi, title: b[0], columns: b[1].map(function (l, li) {
        return { id: 'dyn2-b' + bi + 'l' + li, title: l[0], color: l[1], cards: l[3].map(function (s, i) { var p = s.split('|');
          return { id: 'dyn2-' + bi + '-' + li + '-' + i, title: p[0], titleZh: p[1], back: p[2], desc: p[2], description: p[2], cover: { type: 'image', value: art((bi * 67 + li * 118 + i * 29 + 190) % 360, l[2], i) } }; }) };
      }) };
    });
  }

  window.Dyn2Data = {
    boards: function () { return boards; }, sample: function () { return isSample; }, count: count,
    provider: { boards: function () { return boards; }, openCard: null },
    ready: function (fn) { if (done) fn(); else waiting.push(fn); }
  };

  /* inside Minest's frame (../v2-bridge/bridge.js): Minest's own boards; else this site's copy */
  var forceSample = /[?&]sample\b/.test(location.search), BR = window.MinestV2Bridge;
  if (BR && BR.embedded && !forceSample) {
    BR.hello().then(function (r) {
      var v = r && clean(r.boards);
      if (v && v.length) { use(v, false); finish(); } else load();
    });
  } else load();
  function load() {
  /* load: localStorage first (what Minest paints from), then its IndexedDB copy (the full one) */
  var own = [];
  if (!forceSample) try { own = clean(localStorage.getItem(LS_BOARDS)); } catch (e) {}
  if (own.length) use(own, false); else use(sampleBoards(), true);
  if (forceSample || !window.indexedDB) { finish(); return; }
  try {
    var req = indexedDB.open(IDB), fresh = false;
    req.onupgradeneeded = function () { fresh = true; try { req.transaction.abort(); } catch (e) {} };   // Minest has not made it yet: leave it that way
    req.onerror = function () { finish(); };
    req.onsuccess = function () {
      var db = req.result;
      if (fresh || !db.objectStoreNames.contains('kv')) { db.close(); finish(); return; }
      try {
        var g = db.transaction('kv', 'readonly').objectStore('kv').get('boards');
        g.onsuccess = function () { var v = clean(g.result); db.close(); if (v.length) use(v, false); else if (g.result != null && !isSample) use(sampleBoards(), true);   // (a full copy with no cards left: the older localStorage one is out of date)
          finish(); };
        g.onerror = function () { db.close(); finish(); };
      } catch (e) { db.close(); finish(); }
    };
  } catch (e) { finish(); }
  }
  function ready() { done = true; waiting.splice(0).forEach(function (fn) { try { fn(); } catch (e) {} }); }
  function finish() { if (isSample) return ready(); loadAssets(function () { mend(boards); window.dispatchEvent(new CustomEvent('dyn2:data')); ready(); }); }
})();
