/* 53.826 · Word-list editor · { } JSON 导入: an agent (or a teacher) writes one JSON file, and it becomes a new word list
   with pictures, pinyin, English, categories, example sentences and, optionally, the structures that light the extended
   activities (order, compare, cause, timeline, matrix, error detective, word families, diagram labels).
   Words are referred to by their text, never by id. Every structure record is checked on its own; a bad record is
   skipped and counted, it never blocks the rest. Format: tools/live-perf/TEACHING-JSON.md (also copied by the
   「复制格式说明」button). window.MinestTeachingJSON.importText(text) → {listIds, report}. */
(function(){
  'use strict';
  var BOARD = 'minest-teaching-independent-v1';
  var FORMAT = [
    '请只输出一个 JSON（不要解释），用于导入 Minest Teaching 词表。格式：',
    '{',
    '  "title": "词表名称",',
    '  "words": [',
    '    { "word": "苹果", "pinyin": "píng guǒ", "en": "apple", "meaning": "背面释义（可省略，默认用 en）",',
    '      "image": "https://… 能直接打开的图片网址（jpg/png/webp/svg），图里不要写出这个词",',
    '      "category": "分类名（同一组词用同一个分类，至少 2 个分类、其中一类 ≥3 个词，才能玩归类/找不同）",',
    '      "hint": "一句提示", "related": ["相关词"],',
    '      "sentence": "包含这个词且只出现一次的中文例句。", "sentenceEn": "English sentence.",',
    '      "parts": ["苹", "果"],',
    '      "annotations": [ { "label": "果皮", "x": 0.3, "y": 0.4 } ] }',
    '  ],',
    '  "orders": [ { "title": "顺序名", "words": ["词1", "词2", "词3"] } ],',
    '  "comparisons": [ { "title": "比较", "concepts": ["词1", "词2"], "attributes": [ { "text": "特点", "members": ["词1"] }, { "text": "共同点", "members": ["词1", "词2"] } ] } ],',
    '  "relations": [ { "from": "词1", "to": "词2", "type": "causes 或 leads-to 或 part-of 等", "explanation": "说明" } ],',
    '  "timelines": [ { "title": "时间线", "events": [ { "word": "词1", "date": 1 }, { "word": "词2", "date": 2 } ] } ],',
    '  "matrices": [ { "title": "表格", "rows": ["行1", "行2"], "columns": ["列1", "列2"], "placements": [ { "word": "词1", "row": 0, "column": 1 } ] } ],',
    '  "questions": [ { "word": "词1", "statement": "含一个错误的句子", "incorrect": "错误部分（句中只出现一次）", "correction": "正确说法", "explanation": "为什么" } ]',
    '}',
    '规则：word 不能重复；所有引用都写词语原文；annotations 的 x、y 是 0–1 之间的相对位置，标签之间至少相隔 0.13；',
    'parts 连起来必须等于 word；orders 每组 2–40 个不同的词；可以用 { "lists": [ {…}, {…} ] } 一次导入多个词表。'
  ].join('\n');

  function str(v, max){ return typeof v === 'string' ? v.trim().slice(0, max || 4000) : typeof v === 'number' ? String(v) : ''; }
  function norm(s){ return String(s || '').normalize('NFKC').toLowerCase().replace(/\s+/g, ' ').trim(); }
  function imageOK(u){ return /^https?:\/\/\S+$/i.test(u) || /^data:image\/(png|jpe?g|gif|webp|avif|svg\+xml)[;,]/i.test(u); }
  var seq = 0;
  function uid(p){ return p + Date.now().toString(36) + (seq++).toString(36) + Math.random().toString(36).slice(2, 6); }

  function parse(text){
    var raw = String(text || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    if (!raw) throw Error('请先粘贴 JSON 或选择 .json 文件。');
    var data;
    try { data = JSON.parse(raw); } catch (e) { throw Error('JSON 格式有误：' + e.message); }
    var lists = Array.isArray(data) ? data : Array.isArray(data.lists) ? data.lists : [data];
    lists = lists.filter(function(l){ return l && typeof l === 'object'; });
    if (!lists.length) throw Error('没有找到词表。');
    if (lists.length > 20) throw Error('一次最多导入 20 个词表。');
    lists.forEach(function(l, i){
      var words = l.words || l.cards || l.items;
      if (!Array.isArray(words) || !words.length) throw Error('第 ' + (i + 1) + ' 个词表没有 words 数组。');
      if (words.length > 200) throw Error('每个词表最多 200 个词。');
    });
    return lists;
  }

  function importOne(l, report){
    var S = window.MinestTeachingSets, A = window.MinestTeachingAssets, TD = window.MinestTeachingData, LD = window.MinestLearningData, T = window.MinestTemplates;
    var words = (l.words || l.cards || l.items).map(function(w){ return typeof w === 'string' ? { word: w } : (w || {}); });
    var seen = new Set(), cards = [], mats = [], byWord = Object.create(null), skipped = 0;
    words.forEach(function(w){
      var front = str(w.word || w.front || w.title || w.zh, 120);
      if (!front || seen.has(norm(front))) { skipped++; return; }
      seen.add(norm(front));
      var id = uid('tj'), py = str(w.pinyin || w.py, 200) || (/[\u3400-\u9fff]/.test(front) && A.pinyin ? str(A.pinyin(front), 200) : ''), en = str(w.en || w.english, 160), back = str(w.meaning || w.back || w.desc || w.definition, 500) || en;
      var image = str(w.image || w.img || w.imageUrl || w.picture, 3000000);
      if (image && !imageOK(image)) { report.badImages++; image = ''; }
      var card = { id: id, title: front, desc: back || py, pinyin: py, teachingBack: back ? 'text' : (py ? 'pinyin' : 'text'), labels: [], complete: false };
      if (en) card.en = en;
      var sent = str(w.sentence || w.example || w.sent, 80), sentEn = str(w.sentenceEn || w.exampleEn || w.sentEn, 160);
      if (sent) card.sent = sent;
      if (sentEn) card.sentEn = sentEn;
      if (image) { card.cover = { type: 'image', value: image }; report.images++; report.imageList.push({ listId: '', cardId: id, url: image }); }
      cards.push(card);
      byWord[norm(front)] = id;
      var m = {};
      if (py) m.pinyin = py;
      if (image) m.image = { url: image, provider: 'JSON 导入', title: en || front, license: str(w.license, 200) || '' };
      var cat = str(w.category || w.group, 60);
      if (cat) m.category = cat;
      var hint = str(w.hint, 300);
      if (hint) m.hint = hint;
      var rel = Array.isArray(w.related || w.relatedWords) ? (w.related || w.relatedWords).map(function(x){ return str(x, 60); }).filter(Boolean).slice(0, 12) : [];
      if (rel.length) m.relatedWords = rel;
      if (image && Array.isArray(w.annotations)) {
        m.annotations = w.annotations.map(function(a){ return a && { label: str(a.label, 60), x: +a.x, y: +a.y }; })
          .filter(function(a){ return a && a.label && a.x >= 0 && a.x <= 1 && a.y >= 0 && a.y <= 1; }).slice(0, 12);
      }
      mats.push({ id: id, value: m, src: w });
    });
    if (!cards.length) throw Error('词表「' + (str(l.title) || '未命名') + '」没有可导入的词。');
    report.words += cards.length;
    report.duplicates += skipped;

    var b = S.read(), listId = uid('ts-json-');
    b.columns.push({ id: listId, title: str(l.title || l.name, 80) || '导入的词表', cards: cards });
    b.selected = listId;
    S.save(b);
    report.current = listId;
    report.imageList.forEach(function(x){ if (!x.listId) x.listId = listId; });
    var keep = mats.filter(function(m){ return Object.keys(m.value).length; });
    if (keep.length) A.saveMany(BOARD, keep.map(function(m){ return { id: m.id, value: m.value }; }));

    var items = T.read(S.read(), listId, true);
    function ref(v){ return byWord[norm(typeof v === 'object' && v ? (v.word || v.front) : v)] || ''; }
    function refs(a){ return Array.isArray(a) ? a.map(ref) : []; }

    // examples (the sentence must contain the word exactly once) and explicit orders
    var tdCards = [];
    mats.forEach(function(m){
      var c = cards.find(function(x){ return x.id === m.id; }), ex = { text: c.sent || '', target: c.title };
      if (!ex.text) return;
      var e = TD.example(ex);
      if (e && !e.error) { tdCards.push({ version: 1, cardId: c.id, examples: [ex] }); report.examples++; }
      else report.skipped++;
    });
    var orders = [];
    (Array.isArray(l.orders) ? l.orders : Array.isArray(l.order) ? [{ title: '顺序', words: l.order }] : []).forEach(function(o, i){
      var ids = refs(Array.isArray(o) ? o : o && (o.words || o.cardIds || o.items));
      if (ids.length >= 2 && ids.length <= 40 && ids.every(Boolean) && new Set(ids).size === ids.length) {
        orders.push({ id: 'ord' + i, title: str(o.title, 80) || '顺序 ' + (i + 1), cardIds: ids }); report.structures++;
      } else report.skipped++;
    });
    if (tdCards.length || orders.length) {
      TD.save(BOARD, listId, { version: 1, boardId: BOARD, listId: listId, cards: tdCards, list: { version: 1, listId: listId, orders: orders.slice(0, 100) } }, items);
    }

    // structures sidecar: each record is validated alone
    var data = LD.empty(), any = false;
    function put(type, rec){
      if (!rec) { report.skipped++; return; }
      var test = LD.empty(); test[type] = [rec];
      if (LD.validate(test, items).length) { report.skipped++; return; }
      data[type].push(rec); report.structures++; any = true;
    }
    (l.comparisons || []).forEach(function(c){
      put('comparisons', c && { title: str(c.title, 200), concepts: refs(c.concepts || c.words), attributes: (c.attributes || []).map(function(a){ return { text: str(a && a.text, 300), memberIds: refs(a && (a.members || a.memberIds || a.words)) }; }) });
    });
    (l.relations || []).forEach(function(r){ put('relations', r && { from: ref(r.from), to: ref(r.to), type: str(r.type, 60) || 'related-to', explanation: str(r.explanation || r.why, 400) }); });
    (l.timelines || []).forEach(function(t){
      put('timelines', t && { title: str(t.title, 200), events: (t.events || []).map(function(e){ return { cardId: ref(e && (e.word || e.cardId)), date: +(e && e.date) }; }) });
    });
    (l.matrices || []).forEach(function(m){
      put('matrices', m && { title: str(m.title, 200), rows: (m.rows || []).map(function(x){ return str(x, 80); }), columns: (m.columns || []).map(function(x){ return str(x, 80); }),
        placements: (m.placements || []).map(function(p){ return { cardId: ref(p && (p.word || p.cardId)), row: +(p && p.row), column: +(p && p.column) }; }) });
    });
    (l.questions || []).forEach(function(q){
      put('questions', q && { cardId: ref(q.word || q.cardId), statement: str(q.statement, 400), incorrect: str(q.incorrect, 120), correction: str(q.correction, 120), explanation: str(q.explanation, 400) });
    });
    mats.forEach(function(m){
      if (Array.isArray(m.src.parts)) put('families', { cardId: m.id, parts: m.src.parts.map(function(x){ return str(x, 40); }) });
    });
    (l.families || []).forEach(function(f){ put('families', f && { cardId: ref(f.word || f.cardId), parts: (f.parts || []).map(function(x){ return str(x, 40); }) }); });
    if (any) LD.save(BOARD, listId, data, items);
    return listId;
  }

  function importText(text){
    var S = window.MinestTeachingSets;
    if (!S || !window.MinestTeachingAssets || !window.MinestTeachingData || !window.MinestLearningData || !window.MinestTemplates) throw Error('Teaching 模块仍在加载，请稍后再试。');
    var lists = parse(text), report = { imageList: [], broken: 0, lists: 0, words: 0, images: 0, badImages: 0, examples: 0, structures: 0, skipped: 0, duplicates: 0 }, ids = [];
    try {
      lists.forEach(function(l){ ids.push(importOne(l, report)); report.lists++; });
    } catch (e) {
      // a list that failed half-way must not stay behind half-built; lists finished before it stay
      if (report.current && ids.indexOf(report.current) < 0) {
        try { var b = S.read(); b.columns = b.columns.filter(function(c){ return c.id !== report.current; }); if (ids.length) b.selected = ids[ids.length - 1]; S.save(b); } catch (x) {}
      }
      throw Error((ids.length ? '已导入前 ' + ids.length + ' 个词表，之后出错：' : '') + e.message);
    }
    return { listIds: ids, report: report };
  }

  // pictures an agent invents often do not exist: try each one, and take the broken ones off the cards so the picture
  // games are not lit with empty frames
  function checkImages(report){
    var list = report.imageList.filter(function(x){ return /^https?:/i.test(x.url); });
    return Promise.all(list.map(function(x){
      return new Promise(function(done){
        var im = new Image(), t = setTimeout(function(){ finish(false); }, 9000);
        function finish(ok){ clearTimeout(t); im.onload = im.onerror = null; x.ok = ok; done(); }
        im.onload = function(){ finish(im.naturalWidth > 0); }; im.onerror = function(){ finish(false); };
        im.src = x.url;
      });
    })).then(function(){
      var bad = list.filter(function(x){ return !x.ok; });
      if (!bad.length) return report;
      var S = window.MinestTeachingSets, A = window.MinestTeachingAssets, b = S.read(), mine = A.forBoard(BOARD) || {}, fix = [];
      bad.forEach(function(x){
        var col = b.columns.find(function(c){ return c.id === x.listId; }), card = col && col.cards.find(function(c){ return c.id === x.cardId; });
        if (card && card.cover && card.cover.value === x.url) delete card.cover;
        var m = mine[x.cardId];
        if (m && m.image && m.image.url === x.url) { m = Object.assign({}, m); delete m.image; delete m.annotations; fix.push({ id: x.cardId, value: m }); }
      });
      S.save(b);
      if (fix.length) A.saveMany(BOARD, fix);
      report.broken = bad.length; report.images -= bad.length;
      return report;
    });
  }

  function summary(r){
    return '已导入 ' + r.lists + ' 个词表、' + r.words + ' 个词：图片 ' + r.images + ' 张，例句 ' + r.examples + ' 条，结构资料 ' + r.structures + ' 条'
      + (r.broken ? '；' + r.broken + ' 张图片打不开，已移除（可用「🎨 一键配图」补上）' : '')
      + (r.duplicates ? '；跳过重复/空词 ' + r.duplicates + ' 个' : '') + (r.badImages ? '；无效图片网址 ' + r.badImages + ' 个' : '') + (r.skipped ? '；不合格的例句/结构 ' + r.skipped + ' 条已跳过' : '') + '。';
  }

  function panelHTML(){
    return '<p class="se819-json-tip">把 agent 生成的 JSON 粘贴到这里，或选择 .json 文件。每个词可带图片网址、拼音、英文、分类、例句；还可附带顺序、比较、因果、时间线、表格、纠错和字族，导入后对应的课堂游戏会直接点亮。</p>'
      + '<textarea data-p-json rows="9" spellcheck="false" placeholder="{ &quot;title&quot;: &quot;水果&quot;, &quot;words&quot;: [ { &quot;word&quot;: &quot;苹果&quot;, &quot;en&quot;: &quot;apple&quot;, &quot;image&quot;: &quot;https://…&quot;, &quot;category&quot;: &quot;水果&quot; } ] }"></textarea>'
      + '<div class="se819-json-row"><label class="se819-file">📄 选择 .json 文件<input type="file" data-p-jsonfile accept=".json,application/json,text/plain"></label><button type="button" data-p-jsonfmt>📋 复制格式说明（发给 agent）</button><button type="button" data-p-jsonsample>填入示例</button></div>'
      + '<button class="se819-primary" data-p-go>{ } 导入为新词表</button>';
  }

  var SAMPLE = { title: '水果 Fruits', words: [
    { word: '苹果', pinyin: 'píng guǒ', en: 'apple', category: '水果', sentence: '我每天吃一个苹果。', sentenceEn: 'I eat an apple every day.', parts: ['苹', '果'] },
    { word: '香蕉', pinyin: 'xiāng jiāo', en: 'banana', category: '水果', sentence: '猴子最喜欢吃香蕉。', sentenceEn: 'Monkeys love bananas.' },
    { word: '西瓜', pinyin: 'xī guā', en: 'watermelon', category: '水果', sentence: '夏天的西瓜又甜又凉。', sentenceEn: 'Summer watermelon is sweet and cool.' },
    { word: '黄瓜', pinyin: 'huáng guā', en: 'cucumber', category: '蔬菜', sentence: '妈妈做了凉拌黄瓜。', sentenceEn: 'Mom made a cucumber salad.' },
    { word: '土豆', pinyin: 'tǔ dòu', en: 'potato', category: '蔬菜', sentence: '土豆可以做薯条。', sentenceEn: 'Potatoes can be made into fries.' }],
    orders: [{ title: '从小到大', words: ['苹果', '香蕉', '西瓜'] }],
    relations: [{ from: '土豆', to: '黄瓜', type: 'same-group', explanation: '它们都是蔬菜。' }]
  };

  function bind(p, done){
    var ta = p.querySelector('[data-p-json]'), file = p.querySelector('[data-p-jsonfile]'), go = p.querySelector('[data-p-go]'), msg = function(t, bad){ var s = p.querySelector('[data-p-jsonmsg]'); if (!s) { s = document.createElement('p'); s.setAttribute('data-p-jsonmsg', ''); s.setAttribute('role', 'status'); p.appendChild(s); } s.textContent = t; s.className = bad ? 'se819-error' : 'se819-status'; };
    file.onchange = function(){ var f = this.files && this.files[0]; if (!f) return; if (f.size > 8e6) { msg('文件太大（最多 8 MB）。', true); return; } f.text().then(function(t){ ta.value = t; msg('已读取 ' + f.name + '，确认后点「导入为新词表」。'); }); };
    p.querySelector('[data-p-jsonfmt]').onclick = function(){
      var done2 = function(){ msg('格式说明已复制。发给 agent，让它按主题生成，再把结果粘贴回来。'); };
      try { navigator.clipboard.writeText(FORMAT).then(done2, function(){ ta.value = FORMAT; msg('无法访问剪贴板，格式说明已放进文本框，可手动复制。', true); }); } catch (e) { ta.value = FORMAT; msg('格式说明已放进文本框，可手动复制。', true); }
    };
    p.querySelector('[data-p-jsonsample]').onclick = function(){ ta.value = JSON.stringify(SAMPLE, null, 2); msg('已填入示例，可以直接导入试试。'); };
    go.onclick = function(){
      var r;
      try { r = importText(ta.value); } catch (e) { msg(e.message, true); return; }
      go.disabled = true;
      msg('已导入，正在检查 ' + r.report.imageList.length + ' 张图片能否打开…');
      checkImages(r.report).catch(function(){ return r.report; }).then(function(){ go.disabled = false; done(r.listIds[r.listIds.length - 1], summary(r.report)); });
    };
  }

  window.MinestTeachingJSON = { importText: importText, checkImages: checkImages, parse: parse, format: FORMAT, sample: SAMPLE, panelHTML: panelHTML, bind: bind, summary: summary, version: '53.826' };
})();
