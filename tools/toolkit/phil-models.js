/* Minest · 哲学交互模型 — the 13 live models (philosophy/models/, delivered by Boost 2026-11-22) as Thinking Lab entries.
   Each model is its own page; the toolkit only lists them, ranks the ones that fit the current thought first (compass
   places + words in the thought and its concepts) and asks the Minest page to open one full screen (host action 'phil').
   Nothing is written: the models keep no state and send nothing back. */
(function () {
  'use strict';
  var M = [
    { id: 'plato_cave', file: 'minest_plato_cave.html', who: 'Plato', zh: '柏拉图 · 洞穴寓言', en: 'Plato · The Cave', src: 'Republic VII (Jowett)', levels: ['影子的世界', '转身', '上升', '返回'],
      fits: ['philosophy.epistemology'], kw: ['洞穴', '真理', '真相', '影子', '现实', '教育', '看见', 'cave', 'truth', 'shadow', 'reality', 'education'] },
    { id: 'plato_forms', file: 'minest_plato_forms.html', who: 'Plato', zh: '柏拉图 · 理念论', en: 'Plato · The Forms', src: 'Phaedo · Republic X (Jowett)', levels: ['相等的木棍', '回忆', '三张床'],
      fits: ['philosophy.metaphysics', 'philosophy.epistemology'], kw: ['理念', '完美', '相等', '本质', '抽象', '概念', 'form', 'ideal', 'perfect', 'equal', 'essence', 'abstract'] },
    { id: 'aristotle', file: 'minest_aristotle.html', who: 'Aristotle', zh: '亚里士多德 · 四因说', en: 'Aristotle · The Four Causes', src: 'Physics II (Hardie & Gaye)', levels: ['质料因', '形式因', '动力因', '目的因'],
      fits: ['philosophy.epistemology.causation', 'nature'], kw: ['原因', '为什么', '目的', '质料', '形式', '四因', 'cause', 'why', 'purpose', 'matter', 'form'] },
    { id: 'theseus', file: 'minest_theseus.html', who: 'Plutarch · Hobbes', zh: '忒修斯之船', en: 'The Ship of Theseus', src: 'Plutarch · Hobbes, De Corpore II.11', levels: ['腐朽与替换', '第二艘船', '河流与人'],
      fits: ['philosophy.metaphysics'], kw: ['同一', '身份', '替换', '还是', '自我', '变化', 'identity', 'same', 'replace', 'self', 'change'] },
    { id: 'descartes', file: 'minest_descartes.html', who: 'Descartes', zh: '笛卡尔 · 方法性怀疑', en: 'Descartes · Methodical Doubt', src: 'Meditations I–II (Veitch)', levels: ['信念的大厦', '感官', '梦', '恶魔与我思'],
      fits: ['philosophy.epistemology'], kw: ['怀疑', '确定', '我思', '梦', '感官', '存在', 'doubt', 'certain', 'cogito', 'dream', 'senses', 'exist'] },
    { id: 'locke', file: 'minest_locke.html', who: 'Locke', zh: '洛克 · 白板说', en: 'Locke · The Blank Slate', src: 'Essay concerning Human Understanding II', levels: ['白纸与感觉', '反省', '组合复杂观念'],
      fits: ['philosophy.epistemology', 'psychology.learning'], kw: ['经验', '观念', '白板', '学习', '天生', '感觉', 'experience', 'idea', 'blank', 'learn', 'innate', 'sensation'] },
    { id: 'leibniz', file: 'minest_leibniz.html', who: 'Leibniz', zh: '莱布尼茨 · 单子论', en: 'Leibniz · Monadology', src: 'Monadology', levels: ['没有部分', '没有窗户', '宇宙之镜', '前定和谐'],
      fits: ['philosophy.metaphysics'], kw: ['单子', '实体', '心灵', '身体', '和谐', '视角', 'monad', 'substance', 'mind', 'body', 'harmony', 'perspective'] },
    { id: 'hume', file: 'minest_hume.html', who: 'Hume', zh: '休谟 · 因果关系', en: 'Hume · Cause and Effect', src: 'Enquiry concerning Human Understanding (1777)', levels: ['亚当初见', '寻找必然联系', '第 1 次与第 N 次', '第 1001 次'],
      fits: ['philosophy.epistemology.causation', 'nature.method.causal-inference'], kw: ['因果', '原因', '导致', '必然', '习惯', '先后', 'cause', 'effect', 'causation', 'habit', 'necessary'] },
    { id: 'kant_categories', file: 'minest_kant_categories.html', who: 'Kant', zh: '康德 · 十二范畴与因果性', en: 'Kant · The Categories and Causality', src: 'Critique of Pure Reason (Meiklejohn) · Prolegomena', levels: ['杂多与综合', '范畴之镜', '房屋与航船', '与休谟对照'],
      fits: ['philosophy.epistemology.causation', 'philosophy.epistemology'], kw: ['因果', '范畴', '先验', '经验', '康德', '先后', 'cause', 'category', 'a priori', 'kant', 'experience'] },
    { id: 'kant_moral', file: 'minest_kant_moral.html', who: 'Kant', zh: '康德 · 道德法则', en: 'Kant · The Moral Law', src: 'Groundwork (Abbott)', levels: ['普遍化准则', '虚假承诺', '人是目的', '善良意志'],
      fits: ['philosophy.ethics'], kw: ['道德', '应该', '义务', '说谎', '承诺', '尊重', '善', '对错', 'moral', 'ought', 'duty', 'lie', 'promise', 'respect', 'right', 'wrong'] },
    { id: 'hegel', file: 'minest_hegel.html', who: 'Hegel', zh: '黑格尔 · 辩证法', en: 'Hegel · Dialectic', src: 'Logic (Wallace) · Phenomenology (Baillie)', levels: ['有—无—变易', '主人与奴隶'],
      fits: ['philosophy.metaphysics', 'philosophy.logic', 'philosophy.political'], kw: ['辩证', '变易', '变化', '矛盾', '承认', '主人', '奴隶', '劳动', 'dialectic', 'becoming', 'contradiction', 'recognition', 'master', 'slave', 'labour'] },
    { id: 'gettier', file: 'minest_gettier.html', who: 'Gettier', zh: '盖梯尔问题', en: 'The Gettier Problem', src: 'Gettier 1963, Analysis 23(6)', levels: ['知识三条件', '十枚硬币', '巴塞罗那'],
      fits: ['philosophy.epistemology'], kw: ['知识', '知道', '相信', '证据', '理由', '运气', 'knowledge', 'know', 'belief', 'justified', 'evidence', 'luck'] },
    { id: 'freewill', file: 'minest_freewill.html', who: 'Laplace · Hume · Spinoza', zh: '自由意志与决定论', en: 'Free Will and Determinism', src: 'Laplace · Hume §8 · Spinoza, Ethics', levels: ['拉普拉斯妖', '锁链与动机', '遮住的原因', '三种解释'],
      fits: ['philosophy.metaphysics.free-will', 'philosophy.political'], kw: ['自由', '选择', '决定', '意志', '命运', '强迫', 'free', 'freedom', 'liberty', 'choice', 'determinism', 'will', 'fate'] }
  ];
  if (typeof module === 'object' && module.exports) module.exports = M;
  var TK = typeof window !== 'undefined' && window.MinestToolkit; if (!TK) return;
  function text(ko) {
    var t = [ko.title || '', ko.original_input || ''];
    try { (TK.ks.conceptsOf(ko.id) || []).forEach(function (c) { t.push(c.labels.en || '', c.labels.zh || ''); }); } catch (e) {}
    return t.join(' ').toLowerCase();
  }
  // score: compass places (primary 2, related 1, by path) + 2 per word of the thought it names (at most 6)
  function recommend(ko) {
    var pl = TK.placement ? TK.placement(ko) : {}, places = [pl.primary].concat(pl.related || []).filter(Boolean), tx = text(ko);
    return M.map(function (m) {
      var s = 0;
      m.fits.forEach(function (p) { places.forEach(function (q, i) { if (TK.C.path(q).indexOf(p) >= 0 || TK.C.path(p).indexOf(q) >= 0) s += i === 0 ? 2 : 1; }); });
      var w = 0; m.kw.forEach(function (k) { if (tx.indexOf(k.toLowerCase()) >= 0) w += 2; }); s += Math.min(6, w);
      return { m: m, s: s };
    }).sort(function (a, b) { return b.s - a.s; });
  }
  function open(id) {
    var m = M.filter(function (x) { return x.id === id; })[0]; if (!m) return;
    if (TK.EMBED) return TK.host('phil', { file: m.file, title: m.zh }).then(function (r) { if (!r || !r.ok) TK.toast('This model can’t open here'); }).catch(function () { TK.toast('The Minest app did not answer'); });
    var base = /\/tools\/toolkit\//.test(location.pathname) ? '../../philosophy/models/' : 'philosophy/models/';   // on its own: a new tab
    window.open(base + m.file, '_blank');
  }
  function island() {   // 哲学家小岛 Philosophers' Island (philosophers-island/, Antigravity's voxel world)
    if (TK.EMBED) return TK.host('island').catch(function () { TK.toast('The Minest app did not answer'); });
    window.open((/\/tools\/toolkit\//.test(location.pathname) ? '../../' : '') + 'philosophers-island/philosophers.html', '_blank');
  }
  TK.openIsland = island;
  TK.philModels = M; TK.recommendPhil = recommend; TK.openPhil = open;
})();
