/* Minest · 哲学交互模型 — the live models (philosophy/models/, delivered by Boost 2026-11-22: 13, then 33 more) as Thinking Lab entries.
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
      fits: ['philosophy.metaphysics.free-will', 'philosophy.political'], kw: ['自由', '选择', '决定', '意志', '命运', '强迫', 'free', 'freedom', 'liberty', 'choice', 'determinism', 'will', 'fate'] },
    // ── 2026-11-22 second delivery: 33 more models ──
    { id: 'plato_soul', file: 'minest_plato_soul.html', who: 'Plato', zh: '柏拉图 · 灵魂三分说', en: 'Plato · The Tripartite Soul', src: 'Republic IV · Phaedrus', levels: ['口渴的灵魂', '勒翁提俄斯', '灵魂马车', '应用练习'],
      fits: ['philosophy.ethics', 'psychology.emotion'], kw: ['灵魂', '欲望', '理性', '激情', '冲动', '自控', '内心', 'soul', 'desire', 'reason', 'spirit', 'impulse', 'self-control'] },
    { id: 'syllogism', file: 'minest_syllogism.html', who: 'Aristotle', zh: '亚里士多德 · 三段论', en: 'Aristotle · The Syllogism', src: 'Prior Analytics', levels: ['必然随之而来', '反例世界', '格与化归', '应用练习'],
      fits: ['philosophy.logic'], kw: ['逻辑', '推理', '三段论', '前提', '结论', '有效', '所有', 'logic', 'syllogism', 'premise', 'conclusion', 'valid', 'deduction'] },
    { id: 'zhuangzi', file: 'minest_zhuangzi.html', who: 'Zhuangzi', zh: '庄子 · 齐物论', en: 'Zhuangzi · On the Equality of Things', src: '《庄子·齐物论》· Giles (1889)', levels: ['彼与是', '朝三暮四', '庄周梦蝶', '应用练习：正处'],
      fits: ['philosophy.epistemology', 'philosophy.life'], kw: ['庄子', '梦', '蝴蝶', '视角', '相对', '是非', '齐物', 'zhuangzi', 'butterfly', 'dream', 'perspective', 'relative'] },
    { id: 'wangyangming', file: 'minest_wangyangming.html', who: 'Wang Yangming', zh: '王阳明 · 知行合一', en: 'Wang Yangming · Unity of Knowing and Acting', src: '《传习录》卷上 · 徐爱录', levels: ['好好色，恶恶臭', '知而不行', '知孝与行孝', '良知', '应用练习'],
      fits: ['philosophy.ethics', 'philosophy.life'], kw: ['知行', '知道', '做到', '做不到', '该做', '明知', '行动', '良知', '拖延', '王阳明', 'knowing', 'acting', 'action', 'conscience', 'wang yangming'] },
    { id: 'bacon_idols', file: 'minest_bacon_idols.html', who: 'Bacon', zh: '培根 · 四假相', en: 'Bacon · The Four Idols', src: 'Novum Organum I', levels: ['种族假相', '洞穴假相', '市场假相', '剧场假相', '应用练习'],
      fits: ['philosophy.epistemology', 'nature.method'], kw: ['偏见', '偏差', '成见', '假相', '误解', '错觉', 'bias', 'prejudice', 'idol', 'illusion', 'error'] },
    { id: 'spinoza_substance', file: 'minest_spinoza_substance.html', who: 'Spinoza', zh: '斯宾诺莎 · 实体论', en: 'Spinoza · Substance', src: 'Ethics, Part I', levels: ['唯一的实体', '属性', '样态', '切不出第二个', '应用练习'],
      fits: ['philosophy.metaphysics'], kw: ['实体', '自然', '上帝', '属性', '样态', '一元', 'substance', 'nature', 'god', 'attribute', 'mode', 'monism'] },
    { id: 'leibniz_reason', file: 'minest_leibniz_reason.html', who: 'Leibniz', zh: '莱布尼茨 · 充足理由律', en: 'Leibniz · The Principle of Sufficient Reason', src: 'Monadology', levels: ['矛盾律', '追问为什么', '跳出序列', '无理由则无事', '应用练习'],
      fits: ['philosophy.metaphysics', 'philosophy.logic', 'philosophy.epistemology.causation'], kw: ['理由', '为什么', '原因', '矛盾', '存在', 'reason', 'why', 'sufficient', 'contradiction', 'exist'] },
    { id: 'kant_transcendental', file: 'minest_kant_transcendental.html', who: 'Kant', zh: '康德 · 先验认识结构', en: 'Kant · The Transcendental Structure of Knowing', src: 'Critique of Pure Reason · Transcendental Aesthetic', levels: ['空间', '时间', '感性与知性', '现象与物自身', '应用练习'],
      fits: ['philosophy.epistemology'], kw: ['空间', '时间', '现象', '物自身', '先验', '认识', 'space', 'time', 'phenomenon', 'thing in itself', 'a priori', 'kant'] },
    { id: 'utilitarian', file: 'minest_utilitarian.html', who: 'Bentham · Mill', zh: '功利主义 · 伦理天平', en: 'Utilitarianism · The Ethical Scale', src: 'Bentham, Principles of Morals and Legislation · Mill, Utilitarianism', levels: ['两位主人', '快乐的计算', '共同体之和', '质与量', '应用练习'],
      fits: ['philosophy.ethics', 'systems.decision'], kw: ['功利', '快乐', '痛苦', '幸福', '最大', '后果', '代价', 'utility', 'pleasure', 'pain', 'happiness', 'consequence', 'greatest'] },
    { id: 'mill_liberty', file: 'minest_mill_liberty.html', who: 'Mill', zh: '密尔 · 自由原则', en: 'Mill · The Harm Principle', src: 'On Liberty (1859)', levels: ['自主领域', '伤害与冒犯', '醉酒与职责', '一个人的异见', '应用练习'],
      fits: ['philosophy.political', 'philosophy.ethics'], kw: ['自由', '伤害', '冒犯', '言论', '干涉', '异见', '权利', 'liberty', 'freedom', 'harm', 'offence', 'speech', 'dissent'] },
    { id: 'marx', file: 'minest_marx.html', who: 'Marx', zh: '马克思 · 历史唯物主义', en: 'Marx · Historical Materialism', src: 'Preface to A Contribution to the Critique of Political Economy (1859)', levels: ['基础与上层建筑', '桎梏', '变革', '应用练习'],
      fits: ['philosophy.political', 'society.economy'], kw: ['经济', '阶级', '生产', '社会', '变革', '劳动', '历史', 'economy', 'class', 'production', 'society', 'revolution', 'history'] },
    { id: 'nietzsche', file: 'minest_nietzsche.html', who: 'Nietzsche', zh: '尼采 · 价值谱系学', en: 'Nietzsche · Genealogy of Values', src: 'On the Genealogy of Morality (1887)', levels: ['词语的谱系', '羔羊与猛禽', '闪电与闪光', '理想的作坊', '应用练习'],
      fits: ['philosophy.ethics'], kw: ['价值', '善恶', '好坏', '道德', '起源', '怨恨', 'value', 'good', 'evil', 'morality', 'origin', 'genealogy'] },
    { id: 'peirce', file: 'minest_peirce.html', who: 'Peirce', zh: '皮尔士 · 溯因推理', en: 'Peirce · Abduction', src: 'Deduction, Induction, and Hypothesis (1878)', levels: ['豆子袋', '三种推理', '侦探：惊奇之事', '应用练习：海边化石'],
      fits: ['philosophy.logic', 'nature.method'], kw: ['推理', '假设', '归纳', '演绎', '侦探', '解释', '猜', 'abduction', 'hypothesis', 'induction', 'deduction', 'explain', 'inference'] },
    { id: 'dewey', file: 'minest_dewey.html', who: 'Dewey', zh: '杜威 · 探究理论', en: 'Dewey · How We Think', src: 'How We Think (1910), ch. 6', levels: ['感到困难', '确定问题', '提出设想', '推演', '实验', '应用练习'],
      fits: ['psychology.learning', 'systems.design', 'nature.method'], kw: ['问题', '解决', '探究', '实验', '思考', '学习', '为什么没', 'problem', 'solve', 'inquiry', 'experiment', 'think', 'learn'] },
    { id: 'husserl', file: 'minest_husserl.html', who: 'Husserl', zh: '胡塞尔 · 现象学还原', en: 'Husserl · Phenomenological Reduction', src: 'Ideas I (via SEP “Edmund Husserl”)', levels: ['自然态度与悬置', '侧显', '意向活动与意向对象', '应用练习'],
      fits: ['philosophy.epistemology'], kw: ['现象', '意识', '经验', '体验', '感知', '意向', 'phenomenology', 'consciousness', 'experience', 'perception', 'intention'] },
    { id: 'heidegger', file: 'minest_heidegger.html', who: 'Heidegger', zh: '海德格尔 · 此在分析', en: 'Heidegger · Dasein', src: 'Being and Time (via SEP “Martin Heidegger”)', levels: ['上手', '坏掉的锤子', '常人', '向死而在', '应用练习'],
      fits: ['philosophy.metaphysics', 'philosophy.life'], kw: ['存在', '此在', '工具', '死亡', '本真', '常人', '日常', 'being', 'dasein', 'tool', 'death', 'authentic', 'everyday'] },
    { id: 'sartre', file: 'minest_sartre.html', who: 'Sartre', zh: '萨特 · 存在主义选择', en: 'Sartre · Existentialist Choice', src: 'Existentialism Is a Humanism (Mairet)', levels: ['裁纸刀与人', '学生的两难', '为所有人选择', '懦夫与自欺', '应用练习'],
      fits: ['philosophy.ethics', 'philosophy.life', 'philosophy.metaphysics.free-will'], kw: ['选择', '自由', '责任', '存在', '本质', '自欺', '两难', 'choice', 'freedom', 'responsibility', 'existence', 'essence', 'bad faith', 'dilemma'] },
    { id: 'frege', file: 'minest_frege.html', who: 'Frege', zh: '弗雷格 · 意义与指称', en: 'Frege · Sense and Reference', src: 'On Sense and Reference (1892, Black)', levels: ['晨星与暮星', '三条中线', '望远镜', '有意义无指称', '应用练习'],
      fits: ['philosophy.logic'], kw: ['意义', '指称', '名字', '同一', '语言', '含义', 'sense', 'reference', 'meaning', 'name', 'language'] },
    { id: 'russell_descriptions', file: 'minest_russell_descriptions.html', who: 'Russell', zh: '罗素 · 摹状词理论', en: 'Russell · Theory of Descriptions', src: 'On Denoting (1905)', levels: ['拆解台', '世界里的国王', '秃还是不秃', '司各特与《威弗利》', '应用练习'],
      fits: ['philosophy.logic'], kw: ['摹状词', '指称', '存在', '真假', '语言', '国王', 'description', 'denoting', 'exist', 'true', 'false', 'language'] },
    { id: 'wittgenstein', file: 'minest_wittgenstein.html', who: 'Wittgenstein', zh: '维特根斯坦 · 语言游戏', en: 'Wittgenstein · Language Games', src: 'Philosophical Investigations', levels: ['建筑者的游戏', '同一个词', '家族相似', '应用练习'],
      fits: ['philosophy.logic', 'knowledge.classification'], kw: ['语言', '意义', '用法', '游戏', '定义', '家族相似', '词', 'language', 'meaning', 'use', 'game', 'definition', 'family resemblance', 'word'] },
    { id: 'carnap', file: 'minest_carnap.html', who: 'Carnap', zh: '卡尔纳普 · 语言框架', en: 'Carnap · Linguistic Frameworks', src: 'Empiricism, Semantics, and Ontology (1950)', levels: ['事物框架', '搭建数的框架', '外部问题', '实用的选择', '应用练习'],
      fits: ['philosophy.logic', 'philosophy.metaphysics', 'knowledge.classification'], kw: ['框架', '存在', '数', '本体', '说法', '选择', 'framework', 'exist', 'number', 'ontology', 'language'] },
    { id: 'tarski', file: 'minest_tarski.html', who: 'Tarski', zh: '塔尔斯基 · 真理理论', en: 'Tarski · The Semantic Theory of Truth', src: 'The Semantic Conception of Truth (1944)', levels: ['T 模式', '两层语言', '说谎者', '层级阶梯', '应用练习'],
      fits: ['philosophy.logic'], kw: ['真', '真理', '说谎者', '悖论', '语言', '元语言', 'truth', 'true', 'liar', 'paradox', 'metalanguage'] },
    { id: 'quine_web', file: 'minest_quine_web.html', who: 'Quine', zh: '奎因 · 信念之网', en: 'Quine · The Web of Belief', src: 'Two Dogmas of Empiricism (1951)', levels: ['整体接受检验', '顽抗的经验', '修改核心', '应用练习'],
      fits: ['philosophy.epistemology', 'nature.method'], kw: ['信念', '理论', '检验', '证据', '修改', '整体', 'belief', 'theory', 'test', 'evidence', 'revise', 'holism'] },
    { id: 'kripke', file: 'minest_kripke.html', who: 'Kripke', zh: '克里普克 · 可能世界', en: 'Kripke · Possible Worlds', src: 'Naming and Necessity (1980)', levels: ['名字与摹状词', '不存在的世界', '水 = H₂O', '应用练习'],
      fits: ['philosophy.metaphysics', 'philosophy.logic'], kw: ['可能', '必然', '名字', '可能世界', '如果', '本质', 'possible', 'necessary', 'name', 'possible world', 'essence', 'counterfactual'] },
    { id: 'goodman_grue', file: 'minest_goodman_grue.html', who: 'Goodman', zh: '古德曼 · 新归纳之谜', en: 'Goodman · The New Riddle of Induction', src: 'Fact, Fiction, and Forecast (1955)', levels: ['绿与绿蓝', '时刻 t', '语言的对称', '根深蒂固', '应用练习'],
      fits: ['philosophy.epistemology', 'nature.method'], kw: ['归纳', '预测', '规律', '推广', '绿蓝', '未来', 'induction', 'predict', 'grue', 'generalize', 'future', 'pattern'] },
    { id: 'popper', file: 'minest_popper.html', who: 'Popper', zh: '波普尔 · 证伪主义', en: 'Popper · Falsifiability', src: 'Conjectures and Refutations (1963)', levels: ['天鹅', '大胆的假说', '解释一切的理论', '特设的拯救', '应用练习'],
      fits: ['nature.method', 'philosophy.epistemology'], kw: ['科学', '证伪', '假说', '检验', '天鹅', '理论', '伪科学', 'science', 'falsify', 'hypothesis', 'test', 'swan', 'theory', 'pseudoscience'] },
    { id: 'kuhn', file: 'minest_kuhn.html', who: 'Kuhn', zh: '库恩 · 范式转换', en: 'Kuhn · Paradigm Shifts', src: 'The Structure of Scientific Revolutions (1962)', levels: ['常规科学', '反常与危机', '格式塔转换', '不同的世界', '应用练习'],
      fits: ['nature.method', 'philosophy.epistemology'], kw: ['范式', '科学', '革命', '反常', '危机', '转换', 'paradigm', 'science', 'revolution', 'anomaly', 'crisis', 'shift'] },
    { id: 'polanyi', file: 'minest_polanyi.html', who: 'Polanyi', zh: '波兰尼 · 默会知识', en: 'Polanyi · Tacit Knowledge', src: 'The Tacit Dimension (1966)', levels: ['骑车', '认脸', '探针', '应用练习：学徒'],
      fits: ['philosophy.epistemology', 'psychology.learning'], kw: ['默会', '技能', '经验', '说不出', '学徒', '直觉', '手感', 'tacit', 'skill', 'know-how', 'apprentice', 'intuition'] },
    { id: 'foucault', file: 'minest_foucault.html', who: 'Foucault', zh: '福柯 · 权力与规训', en: 'Foucault · Power and Discipline', src: 'Discipline and Punish (1975)', levels: ['圆形监狱', '空塔', '规范化判断', '应用练习'],
      fits: ['philosophy.political', 'society.culture'], kw: ['权力', '规训', '监视', '规范', '监狱', '控制', 'power', 'discipline', 'surveillance', 'norm', 'prison', 'control'] },
    { id: 'habermas', file: 'minest_habermas.html', who: 'Habermas', zh: '哈贝马斯 · 交往理性', en: 'Habermas · Communicative Reason', src: 'The Theory of Communicative Action', levels: ['三种有效性要求', '力量与理由', '商谈的规则', '应用练习'],
      fits: ['philosophy.political', 'society.participation'], kw: ['沟通', '讨论', '理由', '共识', '说服', '对话', '民主', 'communication', 'discourse', 'reason', 'consensus', 'dialogue', 'democracy'] },
    { id: 'rawls', file: 'minest_rawls.html', who: 'Rawls', zh: '罗尔斯 · 无知之幕', en: 'Rawls · The Veil of Ignorance', src: 'A Theory of Justice (1971) · Freeman, SEP “Original Position”', levels: ['幕后立规', '抽签过一生', '最大最小 vs 平均', '差别原则', '应用练习'],
      fits: ['philosophy.political', 'philosophy.ethics'], kw: ['公平', '正义', '平等', '分配', '规则', '无知之幕', 'fair', 'justice', 'equality', 'distribution', 'veil of ignorance'] },
    { id: 'nozick_machine', file: 'minest_nozick_machine.html', who: 'Nozick', zh: '诺齐克 · 体验机器', en: 'Nozick · The Experience Machine', src: 'Anarchy, State, and Utopia (1974)', levels: ['插上机器', '做与体验', '成为某种人', '接触现实', '应用练习：醒来'],
      fits: ['philosophy.ethics', 'philosophy.life', 'society.wellbeing'], kw: ['快乐', '幸福', '体验', '真实', '虚拟', '意义', 'happiness', 'pleasure', 'experience', 'real', 'virtual', 'meaning'] },
    { id: 'parfit', file: 'minest_parfit.html', who: 'Parfit', zh: '帕菲特 · 人格同一性', en: 'Parfit · Personal Identity', src: 'Reasons and Persons (1984)', levels: ['记忆之链', '替换光谱', '传送机', '分裂', '应用练习：什么才重要'],
      fits: ['philosophy.metaphysics'], kw: ['同一', '自我', '记忆', '身份', '传送', '还是我', 'identity', 'self', 'memory', 'person', 'teleport'] }
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
