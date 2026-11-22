/* Minest · 知识引擎 2.0 — Knowledge Engine MK II (window.MinestEngine2)
   1.0's engine (tools/compass/compass.js) is used unchanged. 2.0 gives it more to work with and reads more out of it:
     the lexicon   extra cues for 1.0's places and new places under the same seven collections (physics, mathematics,
                   computing and AI, history, law, education, language, the arts, health, money, relationships …);
                   extend() adds them to a copy of the taxonomy before the compass loads it
     analyze()     the compass result with a confidence (0–100) and the candidate places, each with its share
     search()      one index over everything the toolkit knows — philosophy models, frameworks, templates,
                   thinking models, experiments and places — by title, cue, author, close spelling and by field
   Nothing is fetched and nothing is saved here. */
(function (root) {
  'use strict';
  var CJK = /[㐀-鿿]/;
  // extra cues for places 1.0 already has
  var EXTRA = {
    'philosophy.epistemology': { terms: ['知识', '认识', '真理', '真相', '怀疑', '知道', 'knowledge', 'truth', 'belief', 'doubt'], weak: ['相信', '证据', 'know'] },
    'philosophy.metaphysics': { terms: ['时间', '空间', '存在', '本质', '实在', '同一性', 'time', 'existence', 'being', 'reality', 'identity'], weak: ['灵魂', '变化', 'soul'] },
    'philosophy.ethics': { terms: ['善恶', '对错', '良心', '美德', '说谎', 'ethics', 'moral', 'virtue', 'lying'], weak: ['公平', 'fair'] },
    'philosophy.logic': { terms: ['逻辑', '推理', '论证', '悖论', '矛盾', '谬误', 'logic', 'argument', 'paradox', 'fallacy', 'reasoning'], weak: ['证明', 'proof'] },
    'philosophy.political': { terms: ['权力', '国家', '平等', '权利', 'power', 'equality', 'rights', 'state'], weak: ['政府', 'government'] },
    'philosophy.life': { terms: ['意义', '死亡', '人生', '孤独', 'meaning of life', 'death', 'purpose'], weak: ['活着', '快乐'] },
    'psychology.motivation': { terms: ['习惯', '动力', '自律', 'habit', 'habits', 'motivation', 'willpower'], weak: ['坚持', '想要'] },
    'psychology.learning': { terms: ['记忆', '注意力', '理解', '思考', 'memory', 'attention', 'thinking', 'study'], weak: ['复习', '背'] },
    'psychology.emotion': { terms: ['焦虑', '愤怒', '害怕', '压力', '情绪', 'anxiety', 'anger', 'fear', 'stress', 'emotion'], weak: ['难过', '紧张', 'sad'] },
    'nature.biology': { terms: ['进化', '基因', '细胞', '动物', '植物', '生命', 'evolution', 'gene', 'cell', 'animal', 'plant'], weak: ['恐龙', '身体'] },
    'nature.earth': { terms: ['气候', '天气', '地震', '火山', '海洋', 'climate', 'weather', 'earthquake', 'volcano', 'ocean'], weak: ['下雨', 'rain'] },
    'society.economy': { terms: ['市场', '价格', '贸易', '通货膨胀', 'market', 'price', 'trade', 'inflation'], weak: ['工作', '公司'] },
    'systems.decision': { terms: ['选择', '风险', '概率', '权衡', 'choice', 'risk', 'probability', 'trade-off'], weak: ['要不要', '该不该'] }
  };
  // new places (each under one of 1.0's seven collections)
  var NODES = [
    { id: 'nature.physics', name: '物理', en: 'Physics', parent: 'nature', terms: ['物理', '量子', '相对论', '引力', '重力', '能量', '光', '电', '磁', '力学', '彩虹', '蓝', 'physics', 'quantum', 'relativity', 'gravity', 'energy', 'light', 'electricity', 'magnet'], weak: ['速度', '声音', '颜色', '热', 'sky', 'color', 'speed', 'sound'] },
    { id: 'nature.astronomy', name: '天文与宇宙', en: 'Astronomy & the cosmos', parent: 'nature', terms: ['宇宙', '星星', '恒星', '行星', '黑洞', '银河', '太阳', '月亮', '大爆炸', 'universe', 'star', 'stars', 'planet', 'black hole', 'galaxy', 'sun', 'moon', 'big bang'], weak: ['太空', 'space'] },
    { id: 'nature.math', name: '数学', en: 'Mathematics', parent: 'nature', terms: ['数学', '数字', '几何', '代数', '无穷', '质数', '函数', '方程', 'mathematics', 'math', 'number', 'numbers', 'geometry', 'algebra', 'infinity', 'prime', 'equation'], weak: ['计算', '证明', 'proof'] },
    { id: 'systems.computing', name: '计算与人工智能', en: 'Computing & AI', parent: 'systems', terms: ['人工智能', '机器学习', '算法', '编程', '程序', '计算机', '机器人', '互联网', '数据', '大模型', 'ai', 'artificial intelligence', 'machine learning', 'algorithm', 'programming', 'computer', 'robot', 'internet', 'data', 'software'], weak: ['代码', '手机', 'code', 'app'] },
    { id: 'society.history', name: '历史', en: 'History', parent: 'society', terms: ['历史', '古代', '战争', '革命', '王朝', '帝国', '文明', 'history', 'ancient', 'war', 'revolution', 'dynasty', 'empire'], weak: ['过去', '以前', 'past'] },
    { id: 'society.law', name: '法律与制度', en: 'Law & institutions', parent: 'society', terms: ['法律', '规则', '制度', '宪法', '犯罪', '惩罚', '民主', '选举', 'law', 'rule', 'rules', 'constitution', 'crime', 'punishment', 'election', 'voting'], weak: ['规定', '允许', 'allowed'] },
    { id: 'society.education', name: '教育', en: 'Education', parent: 'society', terms: ['教育', '学校', '老师', '考试', '课程', '作业', 'education', 'school', 'teacher', 'exam', 'curriculum', 'homework'], weak: ['上课', '成绩', 'class', 'grade'] },
    { id: 'society.language', name: '语言与交流', en: 'Language & communication', parent: 'society', terms: ['语言', '词语', '语法', '翻译', '写作', '沟通', '表达', 'language', 'word', 'words', 'grammar', 'translation', 'writing', 'communication'], weak: ['说话', '意思', 'meaning'] },
    { id: 'society.arts', name: '艺术与表达', en: 'Arts & expression', parent: 'society', terms: ['艺术', '音乐', '绘画', '文学', '诗', '电影', '美', '设计感', 'art', 'music', 'painting', 'literature', 'poetry', 'film', 'beauty'], weak: ['故事', '画', 'story'] },
    { id: 'psychology.relationships', name: '人际与关系', en: 'Relationships', parent: 'psychology', terms: ['友谊', '朋友', '爱', '家庭', '信任', '孤独感', '合作', 'friendship', 'friend', 'friends', 'love', 'family', 'trust', 'cooperation'], weak: ['同学', '父母', 'parents'] },
    { id: 'life.health', name: '健康与运动', en: 'Health & movement', parent: 'life', terms: ['健康', '运动', '睡眠', '饮食', '游泳', '跑步', '健身', '营养', 'health', 'exercise', 'sleep', 'diet', 'swimming', 'swim', 'running', 'fitness', 'nutrition'], weak: ['累', '吃', 'tired'] },
    { id: 'life.money', name: '金钱与理财', en: 'Money', parent: 'life', terms: ['金钱', '理财', '储蓄', '投资', '零花钱', '预算', 'money', 'saving', 'savings', 'investing', 'budget', 'allowance'], weak: ['买', '花钱', '贵', 'buy'] }
  ];
  function uniq(a) { return a.filter(function (x, i) { return a.indexOf(x) === i; }); }
  function norm(s) { return String(s == null ? '' : s).toLowerCase().replace(/[“”"'’‘·,，。.!！?？:：;；()（）\[\]【】]/g, ' ').replace(/\s+/g, ' ').trim(); }

  // the taxonomy with 2.0's lexicon in it (idempotent; pass a copy if the original must stay as it is)
  function extend(tax) {
    if (!tax || !tax.nodes || tax.engine2) return tax;
    var by = {}; tax.nodes.forEach(function (n) { by[n.id] = n; });
    Object.keys(EXTRA).forEach(function (id) { var n = by[id]; if (!n) return; n.terms = uniq((n.terms || []).concat(EXTRA[id].terms || [])); n.weak = uniq((n.weak || []).concat(EXTRA[id].weak || []).filter(function (w) { return n.terms.indexOf(w) < 0; })); });
    NODES.forEach(function (n) { if (!by[n.id] && by[n.parent]) { var c = JSON.parse(JSON.stringify(n)); c.engine2 = true; tax.nodes.push(c); by[c.id] = c; } });
    tax.engine2 = true; return tax;
  }

  // ------------------------------------------------------------------ analyze: the compass result + confidence + candidates
  function confidence(r) {
    if (!r || !r.primary) return 0;
    var top = r.primary.score || 0, rival = r.related && r.related[0] ? r.related[0].score / (top || 1) : 0;
    var c = (1 - Math.exp(-top / 1.1)) * (1 - 0.25 * Math.min(1, rival));
    if (r.uncertain) c = Math.min(c, 0.5);
    return Math.max(1, Math.min(99, Math.round(c * 100)));
  }
  function analyze(C, text) {
    var r = C.classify(text), conf = confidence(r), cands = [];
    if (r.primary) {
      var all = [r.primary].concat(r.related), sum = all.reduce(function (s, x) { return s + (x.score || 0); }, 0) || 1;
      cands = all.map(function (x) { var n = C.node(x.id) || {}; return { id: x.id, names: x.names, zh: n.name || x.names[x.names.length - 1], en: n.en || '', share: Math.round((x.score || 0) / sum * 100), isNew: !!n.engine2 }; });
    }
    return { text: r.text, type: r.type, primary: r.primary, related: r.related, uncertain: r.uncertain, confidence: conf, candidates: cands, cues: r.cues.slice(0, 8), frameworks: r.frameworks, reasons: r.reasons, engine: 'local-rules/2.0' };
  }

  // ------------------------------------------------------------------ search: one index over what the toolkit knows
  var KINDS = { phil: '哲学模型', framework: '知识框架', template: '框架模板', model: '思维模型', lab: '思维实验', place: '罗盘位置' };
  // o: { phil: [...phil-models.js], frameworks: C.frameworks(), templates, models, labs, nodes: C.nodes(), zh: fn(en) → zh }
  function buildIndex(o) {
    var zh = o.zh || function (x) { return x; }, ix = [];
    function add(kind, id, title, en, sub, keys, text, fits, extra) {
      var it = { kind: kind, id: id, title: title, en: en || '', sub: sub || '', fits: fits || [], _t: norm(title), _e: norm(en), _k: uniq((keys || []).map(norm).filter(Boolean)), _x: norm(text || '') };
      for (var k in extra || {}) it[k] = extra[k];
      ix.push(it);
    }
    (o.phil || []).forEach(function (m) { add('phil', m.id, m.zh, m.en, m.src, (m.kw || []).concat([m.who]), (m.levels || []).join(' '), m.fits, { file: m.file, who: m.who }); });
    (o.frameworks || []).forEach(function (f) { add('framework', f.framework_id, f.zh && f.zh !== f.title ? f.zh : zh(f.title), f.title, f.discipline || '', (f.cues || []), (f.summary || '') + ' ' + (f.related_concepts || []).map(function (c) { return c.name; }).join(' '), f.taxonomy_path); });
    (o.templates || []).forEach(function (t) { add('template', t.id, zh(t.title), t.title, '', [], t.scope || '', ((t.fits && t.fits.places) || []).filter(function (p) { return p !== '*'; })); });
    (o.models || []).forEach(function (m) { add('model', m.id, zh(m.title), m.title, m.angle || '', [m.angle], m.principle || '', (m.fits && m.fits.places) || []); });
    (o.labs || []).forEach(function (d) { add('lab', d.interaction_id, zh(d.title), d.title, d.subtitle || '', [d.framework_id], d.learning_objective || '', Array.isArray(d.fits) ? d.fits : []); });
    (o.nodes || []).forEach(function (n) { add('place', n.id, n.name, n.en, '', (n.terms || []), '', [n.id], { isNew: !!n.engine2 }); });
    return ix;
  }
  function lev(a, b, max) {   // edit distance, giving up past max
    if (Math.abs(a.length - b.length) > max) return max + 1;
    var p = [], i, j; for (j = 0; j <= b.length; j++) p[j] = j;
    for (i = 1; i <= a.length; i++) { var q = [i], lo = i; for (j = 1; j <= b.length; j++) { q[j] = Math.min(p[j] + 1, q[j - 1] + 1, p[j - 1] + (a.charCodeAt(i - 1) === b.charCodeAt(j - 1) ? 0 : 1)); if (q[j] < lo) lo = q[j]; } if (lo > max) return max + 1; p = q; }
    return p[b.length];
  }
  // “什么是自由？” → 自由 · “what is justice” → justice
  function topic(q) {
    var s = String(q || '').trim().replace(/[?？。.!！]+$/, '');
    var m = s.match(/^(?:什么是|何为|何谓|为什么|为何|怎么|如何)(.+)$/) || s.match(/^(.+?)(?:是什么|是什么意思|的含义|的意义)$/) || s.match(/^(?:what|who)\s+(?:is|are|was|does)\s+(?:a |an |the )?(.+?)(?:\s+mean)?$/i) || s.match(/^(?:why|how)\s+(?:is|are|do|does|can)\s+(.+)$/i) || s.match(/^(?:define|explain)\s+(.+)$/i);
    return m ? m[1].trim() : null;
  }
  function scoreOne(it, q) {   // q: normalised, non-empty
    var s = 0, how = '';
    function up(v, h) { if (v > s) { s = v; how = h; } }
    if (it._t === q || it._e === q) up(10, 'title');
    else if (it._t.indexOf(q) === 0 || it._e.indexOf(q) === 0) up(7, 'title');
    else if (it._t.indexOf(q) >= 0 || (CJK.test(q) || q.length > 2) && (' ' + it._e).indexOf(' ' + q) >= 0) up(5.5, 'title');
    else if (q.length > 3 && it._e.indexOf(q) >= 0) up(4, 'title');
    it._k.forEach(function (k) {
      if (k === q) up(4.5, 'cue');
      else if (CJK.test(k) ? (k.length > 1 && q.indexOf(k) >= 0) || (q.length > 1 && k.indexOf(q) >= 0) : q.length > 2 && k.indexOf(q) === 0) up(3, 'cue');
      else if (!CJK.test(k) && k.length > 3 && (' ' + q + ' ').indexOf(' ' + k + ' ') >= 0) up(2, 'cue');   // a word of a longer sentence
    });
    if (!s && q.length > 1 && it._x.indexOf(q) >= 0) up(1.6, 'text');
    if (!s && !CJK.test(q) && q.length >= 5 && q.indexOf(' ') < 0) {   // a close spelling (one slip; two in a long word)
      var max = q.length >= 9 ? 2 : 1, words = uniq(it._e.split(' ').concat(it._k.filter(function (k) { return !CJK.test(k); })));
      for (var i = 0; i < words.length; i++) if (words[i].length >= 4 && lev(q, words[i], max) <= max) { up(2.6, 'spelling'); break; }
    }
    return { s: s, how: how };
  }
  /* search(index, q, { scope, limit, per, analysis }) → [{ kind, id, title, en, sub, score, how }], best first.
     analysis (from analyze()) adds what belongs to the same field as the text, after what matches it by name. */
  function search(ix, q, o) {
    o = o || {}; var n = norm(q); if (!n) return [];
    var t = topic(q), qs = uniq([n, t ? norm(t) : ''].filter(Boolean)), a = o.analysis, places = [];
    if (a && a.primary && a.confidence >= 30) places = [a.primary.id].concat((a.related || []).map(function (x) { return x.id; }));
    var hits = [];
    ix.forEach(function (it) {
      if (o.scope && o.scope !== 'all' && it.kind !== o.scope) return;
      var best = { s: 0, how: '' };
      qs.forEach(function (x, i) { var r = scoreOne(it, x); if (i > 0) r.s *= 0.95; if (r.s > best.s) best = r; });
      var field = 0;
      if (it.kind !== 'place') places.forEach(function (p, i) { it.fits.forEach(function (f, j) { if (f === p || f.indexOf(p + '.') === 0 || p.indexOf(f + '.') === 0) field = Math.max(field, (i === 0 ? 2.4 : 1.2) * (j === 0 ? 1 : 0.8)); }); });
      var s = best.s + (best.s ? field * 0.5 : field);
      if (s > 0) hits.push({ kind: it.kind, id: it.id, title: it.title, en: it.en, sub: it.sub, file: it.file, who: it.who, isNew: it.isNew, score: Math.round(s * 100) / 100, how: best.s ? best.how : 'field' });
    });
    hits.sort(function (x, y) { return y.score - x.score || x.title.length - y.title.length; });
    if (!o.scope || o.scope === 'all') { var per = o.per || 4, seen = {}; hits = hits.filter(function (h) { seen[h.kind] = (seen[h.kind] || 0) + 1; return seen[h.kind] <= per; }); }
    return hits.slice(0, o.limit || 14);
  }

  var api = { version: '2.0', EXTRA: EXTRA, NODES: NODES, KINDS: KINDS, extend: extend, confidence: confidence, analyze: analyze, buildIndex: buildIndex, search: search, topic: topic, norm: norm, lev: lev };
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.MinestEngine2 = api;
})(typeof window !== 'undefined' ? window : globalThis);
