/* Philosophers' Island — registry of the interactive thinking models (philosophy/models/*.html).
 * ROOMS: which models stand in which philosopher's hall (opened from that hall's holo console).
 * holo: the key of the model's 3D hologram version (holo-lab-2/sim-*.js), projected on the console itself.
 * Everything else is reachable from the hub console in the Thinking Workshop. Generated from the model files' titles. */
(function (root) {
  'use strict';
  const ALL = [
 {
  "key": "akerlof_lemons",
  "holo": "akerlof_lemons",
  "file": "minest_akerlof_lemons.html",
  "title": "阿克洛夫 · 柠檬市场",
  "cat": "经济学与博弈论"
 },
 {
  "key": "aquinas",
  "file": "minest_aquinas.html",
  "title": "阿奎那 · 本质与存在",
  "cat": "哲学 · 逻辑与悖论"
 },
 {
  "key": "aristotle",
  "holo": "aristotle",
  "file": "minest_aristotle.html",
  "title": "亚里士多德四因说",
  "cat": "哲学 · 实时模拟",
  "room": "aristotle"
 },
 {
  "key": "aristotle_mean",
  "holo": "aristotle_mean",
  "file": "minest_aristotle_mean.html",
  "title": "亚里士多德 · 德性中道",
  "cat": "哲学 · 逻辑与悖论",
  "room": "aristotle"
 },
 {
  "key": "arrow_impossibility",
  "file": "minest_arrow_impossibility.html",
  "title": "阿罗 · 不可能定理",
  "cat": "政治 · 传播 · 系统"
 },
 {
  "key": "austin_speech",
  "file": "minest_austin_speech.html",
  "title": "奥斯汀 · 言语行为理论",
  "cat": "哲学 · 逻辑与悖论"
 },
 {
  "key": "bacon_idols",
  "holo": "bacon_idols",
  "file": "minest_bacon_idols.html",
  "title": "培根四假相",
  "cat": "哲学 · 实时模拟"
 },
 {
  "key": "baddeley_working_memory",
  "holo": "baddeley_working_memory",
  "file": "minest_baddeley_working_memory.html",
  "title": "巴德利 · 工作记忆模型",
  "cat": "心理学与认知科学"
 },
 {
  "key": "bandura_social_learning",
  "holo": "bandura_social_learning",
  "file": "minest_bandura_social_learning.html",
  "title": "班杜拉 · 社会学习理论",
  "cat": "心理学与认知科学"
 },
 {
  "key": "bayesian",
  "file": "minest_bayesian.html",
  "title": "贝叶斯 · 认识论",
  "cat": "哲学 · 逻辑与悖论"
 },
 {
  "key": "berkeley",
  "file": "minest_berkeley.html",
  "title": "伯克莱 · 唯心主义",
  "cat": "哲学 · 逻辑与悖论"
 },
 {
  "key": "bertalanffy_gst",
  "file": "minest_bertalanffy_gst.html",
  "title": "贝塔朗菲 · 一般系统论",
  "cat": "政治 · 传播 · 系统"
 },
 {
  "key": "bourdieu",
  "file": "minest_bourdieu.html",
  "title": "布迪厄 · 惯习与场域",
  "cat": "哲学 · 逻辑与悖论"
 },
 {
  "key": "bowlby_attachment",
  "holo": "bowlby_attachment",
  "file": "minest_bowlby_attachment.html",
  "title": "鲍尔比 — 依恋理论",
  "cat": "心理学与认知科学"
 },
 {
  "key": "camus",
  "file": "minest_camus.html",
  "title": "加缪 · 荒诞哲学",
  "cat": "哲学 · 逻辑与悖论"
 },
 {
  "key": "carnap",
  "file": "minest_carnap.html",
  "title": "卡尔纳普语言框架",
  "cat": "哲学 · 实时模拟"
 },
 {
  "key": "christensen_disruption",
  "file": "minest_christensen_disruption.html",
  "title": "克莱顿·克里斯坦森 · 颠覆性创新",
  "cat": "政治 · 传播 · 系统"
 },
 {
  "key": "coase_transaction",
  "holo": "coase_transaction",
  "file": "minest_coase_transaction.html",
  "title": "科斯 · 交易成本与科斯定理",
  "cat": "经济学与博弈论"
 },
 {
  "key": "cooley_looking_glass",
  "holo": "cooley_looking_glass",
  "file": "minest_cooley_looking_glass.html",
  "title": "库利 · 镜中我",
  "cat": "社会学"
 },
 {
  "key": "deleuze",
  "file": "minest_deleuze.html",
  "title": "德勒兹 · 生成与差异",
  "cat": "哲学 · 逻辑与悖论"
 },
 {
  "key": "democritus",
  "file": "minest_democritus.html",
  "title": "德谟克利特 · 原子论",
  "cat": "哲学 · 逻辑与悖论"
 },
 {
  "key": "derrida",
  "file": "minest_derrida.html",
  "title": "德里达 · 延异（Différance）",
  "cat": "哲学 · 逻辑与悖论"
 },
 {
  "key": "descartes",
  "holo": "descartes",
  "file": "minest_descartes.html",
  "title": "笛卡尔方法性怀疑",
  "cat": "哲学 · 实时模拟",
  "room": "descartes"
 },
 {
  "key": "dewey",
  "holo": "dewey",
  "file": "minest_dewey.html",
  "title": "杜威探究理论",
  "cat": "哲学 · 实时模拟"
 },
 {
  "key": "downs_median_voter",
  "file": "minest_downs_median_voter.html",
  "title": "唐斯 · 中间选民模型",
  "cat": "政治 · 传播 · 系统"
 },
 {
  "key": "durkheim_solidarity",
  "holo": "durkheim_solidarity",
  "file": "minest_durkheim_solidarity.html",
  "title": "涂尔干 · 社会团结",
  "cat": "社会学"
 },
 {
  "key": "ebbinghaus_forgetting",
  "holo": "ebbinghaus_forgetting",
  "file": "minest_ebbinghaus_forgetting.html",
  "title": "艾宾浩斯 · 遗忘曲线",
  "cat": "心理学与认知科学"
 },
 {
  "key": "epicurus",
  "file": "minest_epicurus.html",
  "title": "伊壁鸠鲁 · 快乐分类",
  "cat": "哲学 · 逻辑与悖论"
 },
 {
  "key": "festinger_dissonance",
  "holo": "festinger_dissonance",
  "file": "minest_festinger_dissonance.html",
  "title": "费斯廷格 · 认知失调",
  "cat": "心理学与认知科学"
 },
 {
  "key": "feyerabend",
  "holo": "feyerabend",
  "file": "minest_feyerabend.html",
  "title": "费耶阿本德 · 方法多元主义",
  "cat": "哲学 · 逻辑与悖论"
 },
 {
  "key": "forrester_system_dynamics",
  "file": "minest_forrester_system_dynamics.html",
  "title": "杰伊·福瑞斯特 · 系统动力学",
  "cat": "政治 · 传播 · 系统"
 },
 {
  "key": "foucault",
  "holo": "foucault",
  "file": "minest_foucault.html",
  "title": "福柯 · 权力与规训",
  "cat": "哲学 · 实时模拟"
 },
 {
  "key": "freewill",
  "file": "minest_freewill.html",
  "title": "自由意志与决定论",
  "cat": "哲学 · 实时模拟"
 },
 {
  "key": "frege",
  "holo": "frege",
  "file": "minest_frege.html",
  "title": "弗雷格意义与指称",
  "cat": "哲学 · 实时模拟"
 },
 {
  "key": "friedman_monetarism",
  "holo": "friedman_monetarism",
  "file": "minest_friedman_monetarism.html",
  "title": "弗里德曼 · 货币主义",
  "cat": "经济学与博弈论"
 },
 {
  "key": "gadamer",
  "file": "minest_gadamer.html",
  "title": "伽达默尔 · 视域融合",
  "cat": "哲学 · 逻辑与悖论"
 },
 {
  "key": "gettier",
  "file": "minest_gettier.html",
  "title": "盖梯尔问题",
  "cat": "哲学 · 实时模拟"
 },
 {
  "key": "gilligan_care",
  "file": "minest_gilligan_care.html",
  "title": "吉利根 · 关怀伦理",
  "cat": "哲学 · 逻辑与悖论"
 },
 {
  "key": "goffman",
  "file": "minest_goffman.html",
  "title": "戈夫曼 · 拟剧理论",
  "cat": "哲学 · 逻辑与悖论"
 },
 {
  "key": "goodman_grue",
  "file": "minest_goodman_grue.html",
  "title": "古德曼新归纳之谜",
  "cat": "哲学 · 实时模拟"
 },
 {
  "key": "granovetter_weak_ties",
  "holo": "granovetter_weak_ties",
  "file": "minest_granovetter_weak_ties.html",
  "title": "格兰诺维特 · 弱关系力量",
  "cat": "社会学"
 },
 {
  "key": "grice",
  "file": "minest_grice.html",
  "title": "格赖斯 · 合作原则与会话含义",
  "cat": "哲学 · 逻辑与悖论"
 },
 {
  "key": "habermas",
  "holo": "habermas",
  "file": "minest_habermas.html",
  "title": "哈贝马斯交往理性",
  "cat": "哲学 · 实时模拟"
 },
 {
  "key": "hayek_prices",
  "holo": "hayek_prices",
  "file": "minest_hayek_prices.html",
  "title": "哈耶克 · 分散知识与价格信号",
  "cat": "经济学与博弈论"
 },
 {
  "key": "hegel",
  "holo": "hegel",
  "file": "minest_hegel.html",
  "title": "黑格尔辩证法 · 有—无—变易",
  "cat": "哲学 · 实时模拟",
  "room": "hegel"
 },
 {
  "key": "hegel_master",
  "holo": "hegel_master",
  "file": "minest_hegel.html",
  "title": "黑格尔主奴辩证法",
  "cat": "哲学 · 实时模拟",
  "room": "hegel"
 },
 {
  "key": "heidegger",
  "holo": "heidegger",
  "file": "minest_heidegger.html",
  "title": "海德格尔此在分析",
  "cat": "哲学 · 实时模拟",
  "room": "heidegger_sartre"
 },
 {
  "key": "hempel_raven",
  "file": "minest_hempel_raven.html",
  "title": "亨普尔 · 乌鸦悖论",
  "cat": "哲学 · 逻辑与悖论"
 },
 {
  "key": "heraclitus",
  "file": "minest_heraclitus.html",
  "title": "赫拉克利特 · 流变思想",
  "cat": "哲学 · 逻辑与悖论"
 },
 {
  "key": "hilbert_hotel",
  "file": "minest_hilbert_hotel.html",
  "title": "希尔伯特 · 无限旅馆悖论",
  "cat": "哲学 · 逻辑与悖论"
 },
 {
  "key": "hobbes",
  "holo": "hobbes",
  "file": "minest_hobbes.html",
  "title": "霍布斯 · 社会契约",
  "cat": "哲学 · 逻辑与悖论",
  "room": "hobbes_rousseau"
 },
 {
  "key": "holland_cas",
  "file": "minest_holland_cas.html",
  "title": "约翰·霍兰德 · 复杂适应系统",
  "cat": "政治 · 传播 · 系统"
 },
 {
  "key": "hume",
  "holo": "hume",
  "file": "minest_hume.html",
  "title": "休谟因果关系",
  "cat": "哲学 · 实时模拟",
  "room": "hume"
 },
 {
  "key": "husserl",
  "file": "minest_husserl.html",
  "title": "胡塞尔现象学还原",
  "cat": "哲学 · 实时模拟"
 },
 {
  "key": "kahneman_prospect",
  "holo": "kahneman_prospect",
  "file": "minest_kahneman_prospect.html",
  "title": "卡尼曼与特沃斯基 · 前景理论",
  "cat": "经济学与博弈论"
 },
 {
  "key": "kant_categories",
  "holo": "kant_categories",
  "file": "minest_kant_categories.html",
  "title": "康德十二范畴与因果性",
  "cat": "哲学 · 实时模拟",
  "room": "kant"
 },
 {
  "key": "kant_moral",
  "holo": "kant_moral",
  "file": "minest_kant_moral.html",
  "title": "康德道德法则",
  "cat": "哲学 · 实时模拟",
  "room": "kant"
 },
 {
  "key": "kant_transcendental",
  "holo": "kant_transcendental",
  "file": "minest_kant_transcendental.html",
  "title": "康德先验认识结构",
  "cat": "哲学 · 实时模拟",
  "room": "kant"
 },
 {
  "key": "keynes_multiplier",
  "holo": "keynes_multiplier",
  "file": "minest_keynes_multiplier.html",
  "title": "凯恩斯 · 乘数效应",
  "cat": "经济学与博弈论"
 },
 {
  "key": "kripke",
  "file": "minest_kripke.html",
  "title": "克里普克可能世界",
  "cat": "哲学 · 实时模拟"
 },
 {
  "key": "kuhn",
  "holo": "kuhn",
  "file": "minest_kuhn.html",
  "title": "库恩范式转换",
  "cat": "哲学 · 实时模拟"
 },
 {
  "key": "lakatos",
  "holo": "lakatos",
  "file": "minest_lakatos.html",
  "title": "拉卡托斯 · 科学研究纲领",
  "cat": "哲学 · 逻辑与悖论"
 },
 {
  "key": "leibniz",
  "holo": "leibniz",
  "file": "minest_leibniz.html",
  "title": "莱布尼茨单子论",
  "cat": "哲学 · 实时模拟",
  "room": "leibniz"
 },
 {
  "key": "leibniz_reason",
  "holo": "leibniz_reason",
  "file": "minest_leibniz_reason.html",
  "title": "莱布尼茨充足理由律",
  "cat": "哲学 · 实时模拟",
  "room": "leibniz"
 },
 {
  "key": "levinas",
  "file": "minest_levinas.html",
  "title": "列维纳斯 · 他者伦理",
  "cat": "哲学 · 逻辑与悖论"
 },
 {
  "key": "locke",
  "holo": "locke",
  "file": "minest_locke.html",
  "title": "洛克白板说",
  "cat": "哲学 · 实时模拟",
  "room": "locke"
 },
 {
  "key": "locke_rights",
  "holo": "locke_rights",
  "file": "minest_locke_rights.html",
  "title": "洛克 · 自然权利与财产权",
  "cat": "哲学 · 逻辑与悖论",
  "room": "locke"
 },
 {
  "key": "lorenz_chaos",
  "file": "minest_lorenz_chaos.html",
  "title": "爱德华·洛伦兹 · 混沌理论",
  "cat": "政治 · 传播 · 系统"
 },
 {
  "key": "macintyre",
  "file": "minest_macintyre.html",
  "title": "麦金太尔 · 实践与德性",
  "cat": "哲学 · 逻辑与悖论"
 },
 {
  "key": "marx",
  "holo": "marx",
  "file": "minest_marx.html",
  "title": "马克思历史唯物主义",
  "cat": "哲学 · 实时模拟",
  "room": "marx"
 },
 {
  "key": "maslow_needs",
  "holo": "maslow_needs",
  "file": "minest_maslow_needs.html",
  "title": "马斯洛 · 需要层次",
  "cat": "心理学与认知科学"
 },
 {
  "key": "mcluhan_medium",
  "file": "minest_mcluhan_medium.html",
  "title": "麦克卢汉 · 媒介即讯息",
  "cat": "政治 · 传播 · 系统"
 },
 {
  "key": "mead_self",
  "holo": "mead_self",
  "file": "minest_mead_self.html",
  "title": "米德 · 自我形成理论",
  "cat": "社会学"
 },
 {
  "key": "merleau_ponty",
  "file": "minest_merleau_ponty.html",
  "title": "梅洛-庞蒂 · 身体知觉",
  "cat": "哲学 · 逻辑与悖论"
 },
 {
  "key": "merton_manifest_latent",
  "holo": "merton_manifest_latent",
  "file": "minest_merton_manifest_latent.html",
  "title": "默顿 · 显功能与潜功能",
  "cat": "社会学"
 },
 {
  "key": "milgram_small_world",
  "holo": "milgram_small_world",
  "file": "minest_milgram_small_world.html",
  "title": "米尔格拉姆 · 小世界网络",
  "cat": "社会学"
 },
 {
  "key": "mill_liberty",
  "holo": "mill_liberty",
  "file": "minest_mill_liberty.html",
  "title": "密尔自由原则",
  "cat": "哲学 · 实时模拟"
 },
 {
  "key": "montesquieu_separation",
  "file": "minest_montesquieu_separation.html",
  "title": "孟德斯鸠 · 三权分立",
  "cat": "政治 · 传播 · 系统"
 },
 {
  "key": "monty_hall",
  "file": "minest_monty_hall.html",
  "title": "蒙提霍尔问题",
  "cat": "哲学 · 逻辑与悖论"
 },
 {
  "key": "nash_equilibrium",
  "holo": "nash_equilibrium",
  "file": "minest_nash_equilibrium.html",
  "title": "约翰·纳什 · 纳什均衡",
  "cat": "经济学与博弈论"
 },
 {
  "key": "newcomb",
  "file": "minest_newcomb.html",
  "title": "纽康悖论",
  "cat": "哲学 · 逻辑与悖论"
 },
 {
  "key": "nietzsche",
  "holo": "nietzsche",
  "file": "minest_nietzsche.html",
  "title": "尼采价值谱系学",
  "cat": "哲学 · 实时模拟",
  "room": "nietzsche"
 },
 {
  "key": "nozick_entitlement",
  "holo": "nozick_entitlement",
  "file": "minest_nozick_entitlement.html",
  "title": "诺齐克 · 权利与分配",
  "cat": "哲学 · 逻辑与悖论"
 },
 {
  "key": "nozick_machine",
  "file": "minest_nozick_machine.html",
  "title": "诺齐克体验机器",
  "cat": "哲学 · 实时模拟"
 },
 {
  "key": "nye_soft_power",
  "file": "minest_nye_soft_power.html",
  "title": "约瑟夫·奈 · 软实力",
  "cat": "政治 · 传播 · 系统"
 },
 {
  "key": "olson_collective_action",
  "holo": "olson_collective_action",
  "file": "minest_olson_collective_action.html",
  "title": "曼瑟尔·奥尔森 · 集体行动的逻辑",
  "cat": "社会学"
 },
 {
  "key": "ostrom_commons",
  "holo": "ostrom_commons",
  "file": "minest_ostrom_commons.html",
  "title": "奥斯特罗姆 · 公共资源治理",
  "cat": "经济学与博弈论"
 },
 {
  "key": "parfit",
  "file": "minest_parfit.html",
  "title": "帕菲特人格同一性",
  "cat": "哲学 · 实时模拟"
 },
 {
  "key": "parmenides",
  "file": "minest_parmenides.html",
  "title": "巴门尼德 · 存在论",
  "cat": "哲学 · 逻辑与悖论"
 },
 {
  "key": "parsons_agil",
  "holo": "parsons_agil",
  "file": "minest_parsons_agil.html",
  "title": "帕森斯 · AGIL 功能系统",
  "cat": "社会学"
 },
 {
  "key": "pavlov_classical",
  "holo": "pavlov_classical",
  "file": "minest_pavlov_classical.html",
  "title": "巴甫洛夫 · 经典条件作用",
  "cat": "心理学与认知科学"
 },
 {
  "key": "peirce",
  "holo": "peirce",
  "file": "minest_peirce.html",
  "title": "皮尔士溯因推理",
  "cat": "哲学 · 实时模拟"
 },
 {
  "key": "peirce_semiotics",
  "holo": "peirce_semiotics",
  "file": "minest_peirce_semiotics.html",
  "title": "皮尔士 · 符号三元关系",
  "cat": "哲学 · 逻辑与悖论"
 },
 {
  "key": "piaget_cognitive",
  "holo": "piaget_cognitive",
  "file": "minest_piaget_cognitive.html",
  "title": "皮亚杰 · 认知发展",
  "cat": "心理学与认知科学"
 },
 {
  "key": "plato_cave",
  "holo": "plato_cave",
  "file": "minest_plato_cave.html",
  "title": "柏拉图洞穴寓言",
  "cat": "哲学 · 实时模拟",
  "room": "plato"
 },
 {
  "key": "plato_forms",
  "holo": "plato_forms",
  "file": "minest_plato_forms.html",
  "title": "柏拉图理念论",
  "cat": "哲学 · 实时模拟",
  "room": "plato"
 },
 {
  "key": "plato_soul",
  "holo": "plato_soul",
  "file": "minest_plato_soul.html",
  "title": "柏拉图灵魂三分说",
  "cat": "哲学 · 实时模拟",
  "room": "plato"
 },
 {
  "key": "polanyi",
  "file": "minest_polanyi.html",
  "title": "波兰尼默会知识",
  "cat": "哲学 · 实时模拟"
 },
 {
  "key": "popper",
  "holo": "popper",
  "file": "minest_popper.html",
  "title": "波普尔证伪主义",
  "cat": "哲学 · 实时模拟"
 },
 {
  "key": "prisoner_dilemma",
  "file": "minest_prisoner_dilemma.html",
  "title": "囚徒困境",
  "cat": "哲学 · 逻辑与悖论"
 },
 {
  "key": "putnam_social_capital",
  "holo": "putnam_social_capital",
  "file": "minest_putnam_social_capital.html",
  "title": "罗伯特·帕特南 · 社会资本",
  "cat": "社会学"
 },
 {
  "key": "quine_web",
  "file": "minest_quine_web.html",
  "title": "奎因信念之网",
  "cat": "哲学 · 实时模拟"
 },
 {
  "key": "rawls",
  "holo": "rawls",
  "file": "minest_rawls.html",
  "title": "罗尔斯无知之幕",
  "cat": "哲学 · 实时模拟"
 },
 {
  "key": "ricardo_comparative",
  "holo": "ricardo_comparative",
  "file": "minest_ricardo_comparative.html",
  "title": "大卫·李嘉图 · 比较优势",
  "cat": "经济学与博弈论"
 },
 {
  "key": "ricoeur",
  "file": "minest_ricoeur.html",
  "title": "利科 · 叙事身份",
  "cat": "哲学 · 逻辑与悖论"
 },
 {
  "key": "rogers_diffusion",
  "file": "minest_rogers_diffusion.html",
  "title": "罗杰斯 · 创新扩散",
  "cat": "政治 · 传播 · 系统"
 },
 {
  "key": "rousseau",
  "holo": "rousseau",
  "file": "minest_rousseau.html",
  "title": "卢梭 · 公意理论",
  "cat": "哲学 · 逻辑与悖论",
  "room": "hobbes_rousseau"
 },
 {
  "key": "russell_descriptions",
  "holo": "russell_descriptions",
  "file": "minest_russell_descriptions.html",
  "title": "罗素摹状词理论",
  "cat": "哲学 · 实时模拟"
 },
 {
  "key": "sartre",
  "holo": "sartre",
  "file": "minest_sartre.html",
  "title": "萨特存在主义选择",
  "cat": "哲学 · 实时模拟",
  "room": "heidegger_sartre"
 },
 {
  "key": "saussure",
  "file": "minest_saussure.html",
  "title": "索绪尔 · 语言符号",
  "cat": "哲学 · 逻辑与悖论"
 },
 {
  "key": "schelling_segregation",
  "holo": "schelling_segregation",
  "file": "minest_schelling_segregation.html",
  "title": "托马斯·谢林 · 社会隔离模型",
  "cat": "社会学"
 },
 {
  "key": "schumpeter_destruction",
  "holo": "schumpeter_destruction",
  "file": "minest_schumpeter_destruction.html",
  "title": "熊彼特 · 创造性破坏",
  "cat": "经济学与博弈论"
 },
 {
  "key": "searle_taxonomy",
  "file": "minest_searle_taxonomy.html",
  "title": "塞尔 · 言语行为分类",
  "cat": "哲学 · 逻辑与悖论"
 },
 {
  "key": "sen_capability",
  "file": "minest_sen_capability.html",
  "title": "阿玛蒂亚·森 · 能力方法",
  "cat": "哲学 · 逻辑与悖论"
 },
 {
  "key": "senge_learning_org",
  "file": "minest_senge_learning_org.html",
  "title": "彼得·圣吉 · 学习型组织",
  "cat": "政治 · 传播 · 系统"
 },
 {
  "key": "simmel_dyad_triad",
  "holo": "simmel_dyad_triad",
  "file": "minest_simmel_dyad_triad.html",
  "title": "齐美尔 · 社会关系形式",
  "cat": "社会学"
 },
 {
  "key": "simon_bounded",
  "holo": "simon_bounded",
  "file": "minest_simon_bounded.html",
  "title": "赫伯特·西蒙 · 有限理性",
  "cat": "经济学与博弈论"
 },
 {
  "key": "simpson_paradox",
  "file": "minest_simpson_paradox.html",
  "title": "辛普森悖论",
  "cat": "哲学 · 逻辑与悖论"
 },
 {
  "key": "skinner_operant",
  "holo": "skinner_operant",
  "file": "minest_skinner_operant.html",
  "title": "斯金纳 · 操作性条件作用",
  "cat": "心理学与认知科学"
 },
 {
  "key": "smith_invisible_hand",
  "holo": "smith_invisible_hand",
  "file": "minest_smith_invisible_hand.html",
  "title": "亚当·斯密 · 看不见的手",
  "cat": "经济学与博弈论"
 },
 {
  "key": "solow_growth",
  "holo": "solow_growth",
  "file": "minest_solow_growth.html",
  "title": "罗伯特·索洛 · 经济增长模型",
  "cat": "经济学与博弈论"
 },
 {
  "key": "spinoza_substance",
  "holo": "spinoza_substance",
  "file": "minest_spinoza_substance.html",
  "title": "斯宾诺莎实体论",
  "cat": "哲学 · 实时模拟",
  "room": "spinoza"
 },
 {
  "key": "stoic_control",
  "holo": "stoic_control",
  "file": "minest_stoic_control.html",
  "title": "斯多葛 · 控制二分法",
  "cat": "哲学 · 逻辑与悖论",
  "room": "zeno"
 },
 {
  "key": "syllogism",
  "holo": "syllogism",
  "file": "minest_syllogism.html",
  "title": "亚里士多德三段论",
  "cat": "哲学 · 实时模拟",
  "room": "aristotle"
 },
 {
  "key": "tarski",
  "file": "minest_tarski.html",
  "title": "塔尔斯基真理理论",
  "cat": "哲学 · 实时模拟"
 },
 {
  "key": "thaler_nudge",
  "holo": "thaler_nudge",
  "file": "minest_thaler_nudge.html",
  "title": "塞勒 · 助推理论",
  "cat": "经济学与博弈论"
 },
 {
  "key": "theseus",
  "file": "minest_theseus.html",
  "title": "忒修斯之船",
  "cat": "哲学 · 实时模拟"
 },
 {
  "key": "tobin_portfolio",
  "holo": "tobin_portfolio",
  "file": "minest_tobin_portfolio.html",
  "title": "托宾 · 投资组合选择",
  "cat": "经济学与博弈论"
 },
 {
  "key": "utilitarian",
  "holo": "utilitarian",
  "file": "minest_utilitarian.html",
  "title": "功利主义伦理天平",
  "cat": "哲学 · 实时模拟"
 },
 {
  "key": "vygotsky_zpd",
  "holo": "vygotsky_zpd",
  "file": "minest_vygotsky_zpd.html",
  "title": "维果茨基 · 最近发展区",
  "cat": "心理学与认知科学"
 },
 {
  "key": "wangyangming",
  "holo": "wangyangming",
  "file": "minest_wangyangming.html",
  "title": "王阳明知行合一",
  "cat": "哲学 · 实时模拟",
  "room": "confucius",
  "note": "王阳明是明代儒者，心学承接孔孟一脉，故陈列于孔子馆。"
 },
 {
  "key": "weber_ideal_type",
  "holo": "weber_ideal_type",
  "file": "minest_weber_ideal_type.html",
  "title": "马克斯·韦伯 · 理想类型",
  "cat": "社会学"
 },
 {
  "key": "whitehead",
  "file": "minest_whitehead.html",
  "title": "怀特海 · 过程哲学",
  "cat": "哲学 · 逻辑与悖论"
 },
 {
  "key": "wiener_cybernetics",
  "file": "minest_wiener_cybernetics.html",
  "title": "诺伯特·维纳 · 控制论",
  "cat": "政治 · 传播 · 系统"
 },
 {
  "key": "wittgenstein",
  "holo": "wittgenstein",
  "file": "minest_wittgenstein.html",
  "title": "维特根斯坦语言游戏",
  "cat": "哲学 · 实时模拟",
  "room": "wittgenstein"
 },
 {
  "key": "zeno",
  "holo": "zeno",
  "file": "minest_zeno.html",
  "title": "芝诺 · 运动悖论",
  "cat": "哲学 · 逻辑与悖论",
  "room": "zeno",
  "note": "提出运动悖论的是埃利亚的芝诺，与创立斯多葛学派的季蒂昂的芝诺不是同一个人；本馆的阿喀琉斯跑道取材于前者。"
 },
 {
  "key": "zhuangzi",
  "holo": "zhuangzi",
  "file": "minest_zhuangzi.html",
  "title": "庄子齐物论",
  "cat": "哲学 · 实时模拟",
  "room": "zhuangzi"
 }
];
  const ROOMS = {"plato": ["plato_cave", "plato_forms", "plato_soul"], "aristotle": ["aristotle", "syllogism", "aristotle_mean"], "zeno": ["stoic_control", "zeno"], "confucius": ["wangyangming"], "zhuangzi": ["zhuangzi"], "descartes": ["descartes"], "spinoza": ["spinoza_substance"], "leibniz": ["leibniz", "leibniz_reason"], "locke": ["locke", "locke_rights"], "hume": ["hume"], "hobbes_rousseau": ["hobbes", "rousseau"], "kant": ["kant_transcendental", "kant_categories", "kant_moral"], "hegel": ["hegel", "hegel_master"], "marx": ["marx"], "nietzsche": ["nietzsche"], "wittgenstein": ["wittgenstein"], "heidegger_sartre": ["heidegger", "sartre"]};
  if (root.PIExpansion) { Object.assign(ROOMS, root.PIExpansion.rooms); Object.keys(root.PIExpansion.rooms).forEach((id) => root.PIExpansion.rooms[id].forEach((k) => { const m = ALL.find((x) => x.key === k); if (m) m.room = id; })); }
  const byKey = {};
  ALL.forEach((m) => { byKey[m.key] = m; });
  root.PIModels = { DIR: 'philosophy/models/', ALL, ROOMS, byKey, forRoom: (id) => (ROOMS[id] || []).map((k) => byKey[k]).filter(Boolean) };
})(window);
