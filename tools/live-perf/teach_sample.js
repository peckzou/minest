/* 53.826 · Teaching sample list: one tap builds 「🌧 水循环 · 全功能示例」, a 9-card list whose data lights every
   classic activity (picture games, diagram, sorting / odd one out, sequence, cloze / sentence, spelling, crossword,
   compare, cause, concept map, timeline, matrix, error detective, word families). Pictures are drawn here as small
   SVG illustrations (no text in them, so picture games do not give the answer away) and work offline.
   window.MinestTeachingSample.create() → {board, listId}. Running it again rebuilds the same list. */
(function(){
  'use strict';
  var LIST = 'ts-sample-water826', BOARD = 'minest-teaching-independent-v1';
  var SKY = '<rect width="240" height="180" fill="#cfeeff"/>';
  var SEA = '<path d="M0 132 Q30 124 60 132 T120 132 T180 132 T240 132 V180 H0Z" fill="#3b82f6"/><path d="M0 146 Q30 138 60 146 T120 146 T180 146 T240 146" stroke="#93c5fd" stroke-width="4" fill="none"/>';
  function sun(x, y, r){ var rays = ''; for (var i = 0; i < 8; i++){ var a = i * Math.PI / 4; rays += '<line x1="' + (x + Math.cos(a) * (r + 6)).toFixed(1) + '" y1="' + (y + Math.sin(a) * (r + 6)).toFixed(1) + '" x2="' + (x + Math.cos(a) * (r + 16)).toFixed(1) + '" y2="' + (y + Math.sin(a) * (r + 16)).toFixed(1) + '" stroke="#f59e0b" stroke-width="5" stroke-linecap="round"/>'; } return rays + '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="#fbbf24"/>'; }
  function cloud(x, y, s, c){ return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')" fill="' + (c || '#fff') + '"><circle cx="-26" cy="6" r="18"/><circle cx="0" cy="-8" r="24"/><circle cx="26" cy="4" r="18"/><rect x="-44" y="4" width="88" height="20" rx="10"/></g>'; }
  function rain(x, y, n, len){ var r = ''; for (var i = 0; i < n; i++) r += '<line x1="' + (x + i * 14) + '" y1="' + (y + (i % 2) * 8) + '" x2="' + (x + i * 14 - 6) + '" y2="' + (y + (i % 2) * 8 + len) + '" stroke="#2563eb" stroke-width="4" stroke-linecap="round"/>'; return r; }
  function up(x){ return '<path d="M' + x + ' 120 q-8 -12 0 -24 t0 -24 t0 -24" stroke="#f8fafc" stroke-width="5" fill="none" stroke-linecap="round" stroke-dasharray="2 9"/><path d="M' + (x - 8) + ' 52 l8 -12 l8 12" stroke="#f8fafc" stroke-width="5" fill="none" stroke-linecap="round"/>'; }
  var ART = {
    sun: SKY + sun(120, 90, 38) + '<path d="M0 150 Q60 130 120 150 T240 150 V180 H0Z" fill="#86efac"/>',
    cloud: SKY + cloud(120, 80, 1.6) + cloud(48, 40, .6) + cloud(196, 130, .7),
    river: '<rect width="240" height="180" fill="#cfeeff"/><path d="M0 80 Q60 40 120 76 T240 64 V180 H0Z" fill="#86efac"/><path d="M150 72 C120 100 190 118 130 140 S60 168 80 180 H140 C120 168 210 150 180 130 S150 96 170 72Z" fill="#3b82f6"/><circle cx="40" cy="120" r="14" fill="#16a34a"/><circle cx="210" cy="104" r="12" fill="#16a34a"/>',
    ocean: SKY + '<rect y="96" width="240" height="84" fill="#2563eb"/><path d="M20 120 q10 -8 20 0 t20 0 M120 140 q10 -8 20 0 t20 0 M60 160 q10 -8 20 0 t20 0 M170 116 q10 -8 20 0 t20 0" stroke="#93c5fd" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M100 96 h44 l-8 12 h-28z" fill="#b45309"/><path d="M122 96 V60 L144 92Z" fill="#fff"/>',
    evaporation: SKY + sun(46, 42, 22) + SEA + up(110) + up(150) + up(190),
    condensation: '<rect width="240" height="180" fill="#dbeafe"/>' + cloud(120, 92, 1.3, '#e2e8f0') + [[40, 40], [70, 150], [190, 40], [205, 150], [30, 100], [215, 92], [120, 28], [120, 160]].map(function(p){ return '<path d="M' + p[0] + ' ' + (p[1] - 9) + ' q7 10 0 16 q-7 -6 0 -16z" fill="#3b82f6"/><path d="M' + (p[0] + (120 - p[0]) * .25) + ' ' + (p[1] + (92 - p[1]) * .25) + ' L' + (p[0] + (120 - p[0]) * .45) + ' ' + (p[1] + (92 - p[1]) * .45) + '" stroke="#64748b" stroke-width="3" stroke-linecap="round"/>'; }).join(''),
    precipitation: '<rect width="240" height="180" fill="#cbd5e1"/>' + cloud(120, 56, 1.5, '#64748b') + rain(70, 100, 8, 26) + rain(76, 140, 7, 20) + '<path d="M0 172 H240 V180 H0Z" fill="#86efac"/>',
    collection: SKY + cloud(70, 34, .8, '#94a3b8') + rain(46, 60, 4, 18) + '<path d="M0 100 L60 60 L110 110 L150 80 L240 130 V180 H0Z" fill="#86efac"/><path d="M60 150 Q120 120 200 150 Q120 178 60 150Z" fill="#3b82f6"/><path d="M84 96 C100 114 96 128 108 140 M190 118 C178 130 176 138 168 144" stroke="#3b82f6" stroke-width="6" fill="none" stroke-linecap="round"/>',
    cycle: '<rect width="240" height="180" fill="#cfeeff"/>' + sun(30, 30, 16) + cloud(124, 30, .9) + cloud(190, 52, .8, '#64748b') + rain(176, 76, 4, 16) + '<path d="M150 110 L190 70 L240 112 V180 H120Z" fill="#86efac"/><path d="M0 128 Q50 118 120 132 L150 180 H0Z" fill="#3b82f6"/><path d="M60 118 C52 90 70 70 90 46" stroke="#f8fafc" stroke-width="4" fill="none" stroke-dasharray="3 7" stroke-linecap="round"/><path d="M152 34 C168 30 176 36 182 42" stroke="#334155" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M200 128 C176 140 150 146 128 150" stroke="#2563eb" stroke-width="5" fill="none" stroke-linecap="round"/>'
  };
  function img(k){ return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 180">' + ART[k] + '</svg>'); }

  // [id, 中文, 拼音, English, 类别, 图, 例句, 英文例句]
  var WORDS = [
    ['sw-evap', '蒸发', 'zhēng fā', 'evaporation', '过程', 'evaporation', '太阳晒热了海水，水开始蒸发。', 'The sun warms the sea and the water starts to evaporate.'],
    ['sw-cond', '凝结', 'níng jié', 'condensation', '过程', 'condensation', '水蒸气在高空遇冷凝结成小水滴。', 'Water vapor cools high in the sky and condenses into droplets.'],
    ['sw-prec', '降水', 'jiàng shuǐ', 'precipitation', '过程', 'precipitation', '云里的水滴变重，就形成了降水。', 'When the drops in a cloud get heavy, they fall as precipitation.'],
    ['sw-coll', '汇集', 'huì jí', 'collection', '过程', 'collection', '雨水流到低处，在湖里汇集起来。', 'Rainwater flows down and collects in the lake.'],
    ['sw-sun', '太阳', 'tài yáng', 'sun', '事物', 'sun', '早上，太阳从东方升起。', 'In the morning, the sun rises in the east.'],
    ['sw-cloud', '云朵', 'yún duǒ', 'cloud', '事物', 'cloud', '蓝天上飘着白白的云朵。', 'White clouds float in the blue sky.'],
    ['sw-river', '河流', 'hé liú', 'river', '事物', 'river', '小船在河流上慢慢前进。', 'A little boat moves slowly on the river.'],
    ['sw-ocean', '大海', 'dà hǎi', 'ocean', '事物', 'ocean', '我们一起去大海边捡贝壳。', 'We go to the ocean to pick up shells.'],
    ['sw-cycle', '水循环', 'shuǐ xún huán', 'water cycle', '', 'cycle', '水循环让地球上的水不停流动。', 'The water cycle keeps water moving around the Earth.']
  ];

  function create(){
    var S = window.MinestTeachingSets, A = window.MinestTeachingAssets, TD = window.MinestTeachingData, LD = window.MinestLearningData, T = window.MinestTemplates;
    if (!S || !A || !TD || !LD || !T) throw Error('Teaching 模块仍在加载，请稍后再试。');
    var b = S.read(), cards = WORDS.map(function(w){
      return { id: w[0], title: w[1], desc: w[3], pinyin: w[2], en: w[3], teachingBack: 'text', labels: [], complete: false, sent: w[6], sentEn: w[7], cover: { type: 'image', value: img(w[5]) } };
    });
    b.columns = (b.columns || []).filter(function(c){ return c.id !== LIST; });
    b.columns.push({ id: LIST, title: '🌧 水循环 · 全功能示例', cards: cards });
    b.selected = LIST;
    S.save(b);

    // pictures, categories, hints, related words; the whole water cycle picture carries the diagram labels
    var mine = A.forBoard(BOARD) || {};
    A.saveMany(BOARD, WORDS.map(function(w){
      var v = Object.assign({}, mine[w[0]] || {}, {
        pinyin: w[2], image: { url: img(w[5]), provider: 'Minest 课堂插图', title: w[3], license: 'CC0' },
        hint: w[4] === '过程' ? '水的一种变化，和温度有关。' : w[4] === '事物' ? '自然界里看得见的东西。' : '水在天空和地面之间不停地循环。',
        relatedWords: w[0] === 'sw-cycle' ? ['蒸发', '凝结', '降水', '汇集'] : [], annotations: []
      });
      delete v.definitions; delete v.definitionLanguage;
      if (w[4]) v.category = w[4]; else delete v.category;
      if (w[0] === 'sw-cycle') v.annotations = [{ label: '蒸发', x: .27, y: .5 }, { label: '凝结', x: .55, y: .17 }, { label: '降水', x: .8, y: .5 }, { label: '汇集', x: .55, y: .86 }];
      return { id: w[0], value: v };
    }));

    var items = T.read(S.read(), LIST, true);
    TD.save(BOARD, LIST, {
      version: 1, boardId: BOARD, listId: LIST,
      cards: WORDS.map(function(w){ return { version: 1, cardId: w[0], examples: [{ text: w[6], target: w[1] }] }; }),
      list: { version: 1, listId: LIST, orders: [{ id: 'sw-order', title: '水循环四步', cardIds: ['sw-evap', 'sw-cond', 'sw-prec', 'sw-coll'] }] }
    }, items);

    LD.save(BOARD, LIST, {
      version: 1,
      comparisons: [{ title: '云朵、河流和大海', concepts: ['sw-cloud', 'sw-river', 'sw-ocean'], attributes: [
        { text: '飘在天上，由小水滴组成', memberIds: ['sw-cloud'] },
        { text: '在地面上流动', memberIds: ['sw-river'] },
        { text: '又大又深，水是咸的', memberIds: ['sw-ocean'] },
        { text: '都是水循环的一部分', memberIds: ['sw-cloud', 'sw-river', 'sw-ocean'] }] }],
      relations: [
        { from: 'sw-sun', to: 'sw-evap', type: 'causes', explanation: '太阳把水晒热，水就蒸发了。' },
        { from: 'sw-evap', to: 'sw-cond', type: 'leads-to', explanation: '水蒸气升到高空，遇冷凝结。' },
        { from: 'sw-cond', to: 'sw-prec', type: 'leads-to', explanation: '小水滴越聚越重，落下来变成降水。' },
        { from: 'sw-prec', to: 'sw-coll', type: 'leads-to', explanation: '雨水流到低处，在河流、湖泊和大海里汇集。' },
        { from: 'sw-cloud', to: 'sw-prec', type: 'produces', explanation: '云朵里的水滴落下来，就是雨和雪。' },
        { from: 'sw-river', to: 'sw-ocean', type: 'flows-into', explanation: '河流最后流进大海。' }],
      timelines: [{ title: '水循环的顺序（第几步）', events: [{ cardId: 'sw-evap', date: 1 }, { cardId: 'sw-cond', date: 2 }, { cardId: 'sw-prec', date: 3 }, { cardId: 'sw-coll', date: 4 }] }],
      matrices: [{ title: '是什么 × 在哪里', rows: ['过程', '事物'], columns: ['在天上', '在地面'], placements: [
        { cardId: 'sw-cond', row: 0, column: 0 }, { cardId: 'sw-prec', row: 0, column: 0 }, { cardId: 'sw-evap', row: 0, column: 1 }, { cardId: 'sw-coll', row: 0, column: 1 },
        { cardId: 'sw-sun', row: 1, column: 0 }, { cardId: 'sw-cloud', row: 1, column: 0 }, { cardId: 'sw-river', row: 1, column: 1 }, { cardId: 'sw-ocean', row: 1, column: 1 }] }],
      questions: [
        { cardId: 'sw-evap', statement: '水遇冷就会蒸发。', incorrect: '遇冷', correction: '受热', explanation: '水受热才会变成水蒸气。' },
        { cardId: 'sw-cond', statement: '水蒸气在高空遇热凝结成小水滴。', incorrect: '遇热', correction: '遇冷', explanation: '水蒸气遇冷才会凝结。' },
        { cardId: 'sw-river', statement: '河流最后流进了沙漠。', incorrect: '沙漠', correction: '大海', explanation: '河流最后流进大海。' }],
      families: [
        { cardId: 'sw-cycle', parts: ['水', '循环'] }, { cardId: 'sw-evap', parts: ['蒸', '发'] }, { cardId: 'sw-cond', parts: ['凝', '结'] },
        { cardId: 'sw-prec', parts: ['降', '水'] }, { cardId: 'sw-ocean', parts: ['大', '海'] }],
      scenes: []
    }, items);
    return { board: S.read(), listId: LIST };
  }

  window.MinestTeachingSample = { create: create, listId: LIST, version: '53.826' };
})();
