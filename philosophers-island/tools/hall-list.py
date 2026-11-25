# The halls' own shelves, by hand: "中文名|English title|author (as in the catalogue)|Project Gutenberg id, ws:<file key>, or 0|作者中文名"
# A Gutenberg id is only used if the file's own header names that author and title; 0 = cover and bibliography only.
HALLS = {
'socrates': '''申辩篇|Apology|Plato|1656|柏拉图
克力同篇|Crito|Plato|1657|柏拉图
斐多篇|Phaedo|Plato|1658|柏拉图
会饮篇|Symposium|Plato|1600|柏拉图
回忆苏格拉底|The Memorabilia|Xenophon|1177|色诺芬''',
'plato': '''理想国|The Republic|Plato|1497|柏拉图
斐德罗篇|Phaedrus|Plato|1636|柏拉图
美诺篇|Meno|Plato|1643|柏拉图
高尔吉亚篇|Gorgias|Plato|1672|柏拉图
蒂迈欧篇|Timaeus|Plato|1572|柏拉图
泰阿泰德篇|Theaetetus|Plato|1726|柏拉图
法律篇|Laws|Plato|1750|柏拉图''',
'aristotle': '''尼各马可伦理学|The Ethics of Aristotle|Aristotle|8438|亚里士多德
政治学|Politics: A Treatise on Government|Aristotle|6762|亚里士多德
诗学|The Poetics of Aristotle|Aristotle|1974|亚里士多德
范畴篇|The Categories|Aristotle|2412|亚里士多德
雅典政制|The Athenian Constitution|Aristotle|26095|亚里士多德
形而上学|Metaphysics|Aristotle|0|亚里士多德''',
'zeno': '''道德手册|The Enchiridion|Epictetus|45109|爱比克泰德
爱比克泰德论说集（选）|A Selection from the Discourses of Epictetus|Epictetus|10661|爱比克泰德
沉思录|Meditations|Marcus Aurelius|2680|马可·奥勒留
塞涅卡道德书简|Letters from a Stoic|Seneca|0|塞涅卡
论生命之短暂|On the Shortness of Life|Seneca|0|塞涅卡''',
'confucius': '''论语|論語|孔子|ws:论语|孔子及其弟子
传习录|傳習錄|王陽明|ws:传习录|王阳明
论语（英译）|The Analects of Confucius|Confucius|3330|孔子
孟子|Mencius|Mencius|0|孟子''',
'laozi': '''道德经（王弼本）|道德經|老子|ws:道德经王弼本|老子
道德经（英译）|Tao Teh King|Laozi|216|老子''',
'zhuangzi': '''庄子 · 内篇|莊子|莊子|ws:庄子内篇|庄子
庄子（英译）|Chuang Tzu: Mystic, Moralist, and Social Reformer|Zhuangzi|59709|庄子''',
'descartes': '''谈谈方法|Discourse on the Method|Descartes|59|笛卡尔
哲学原理（选）|Selections from the Principles of Philosophy|Descartes|4391|笛卡尔
第一哲学沉思集|Meditations on First Philosophy|René Descartes|0|笛卡尔
论灵魂的激情|The Passions of the Soul|René Descartes|0|笛卡尔''',
'spinoza': '''伦理学|Ethics|Spinoza|3800|斯宾诺莎
知性改进论|On the Improvement of the Understanding|Spinoza|1016|斯宾诺莎
神学政治论（第一部分）|A Theologico-Political Treatise|Spinoza|989|斯宾诺莎''',
'leibniz': '''神义论|Theodicy|Leibniz|17147|莱布尼茨
单子论|The Monadology|Leibniz|39441|莱布尼茨
人类理智新论|New Essays on Human Understanding|Gottfried Wilhelm Leibniz|0|莱布尼茨''',
'locke': '''政府论（下篇）|Second Treatise of Government|Locke|7370|洛克
人类理解论（上）|An Essay Concerning Humane Understanding, Volume 1|Locke|10615|洛克
人类理解论（下）|An Essay Concerning Humane Understanding, Volume 2|Locke|10616|洛克
论宗教宽容|A Letter Concerning Toleration|John Locke|0|洛克''',
'hume': '''人性论|A Treatise of Human Nature|Hume|4705|休谟
人类理智研究|An Enquiry Concerning Human Understanding|Hume|9662|休谟
道德原则研究|An Enquiry Concerning the Principles of Morals|Hume|4320|休谟
自然宗教对话录|Dialogues Concerning Natural Religion|Hume|4583|休谟''',
'hobbes_rousseau': '''利维坦|Leviathan|Hobbes|3207|霍布斯
社会契约论|The Social Contract & Discourses|Rousseau|46333|卢梭
忏悔录|The Confessions of Jean Jacques Rousseau|Rousseau|3913|卢梭
爱弥儿|Emile|Rousseau|5427|卢梭''',
'kant': '''纯粹理性批判|The Critique of Pure Reason|Kant|4280|康德
实践理性批判|The Critique of Practical Reason|Kant|5683|康德
道德形而上学奠基|Fundamental Principles of the Metaphysic of Morals|Kant|5682|康德
判断力批判|Kant's Critique of Judgement|Kant|48433|康德
未来形而上学导论|Kant's Prolegomena to Any Future Metaphysics|Kant|52821|康德
论永久和平|Perpetual Peace: A Philosophical Essay|Kant|50922|康德''',
'hegel': '''小逻辑|The Logic of Hegel|Hegel|55108|黑格尔
精神哲学|Hegel's Philosophy of Mind|Hegel|39064|黑格尔
美学导论|The Introduction to Hegel's Philosophy of Fine Arts|Hegel|46330|黑格尔
精神现象学|The Phenomenology of Mind|Georg Wilhelm Friedrich Hegel|0|黑格尔
历史哲学|The Philosophy of History|Georg Wilhelm Friedrich Hegel|0|黑格尔''',
'marx': '''共产党宣言|The Communist Manifesto|Marx|61|马克思、恩格斯
路易·波拿巴的雾月十八日|The Eighteenth Brumaire of Louis Bonaparte|Marx|1346|马克思
政治经济学批判|A Contribution to the Critique of Political Economy|Marx|46423|马克思
资本论|Capital|Karl Marx|0|马克思
1844年经济学哲学手稿|Economic and Philosophic Manuscripts of 1844|Karl Marx|0|马克思''',
'schopenhauer_kierkegaard': '''作为意志和表象的世界（卷一）|The World as Will and Idea|Schopenhauer|38427|叔本华
人生的智慧|The Wisdom of Life|Schopenhauer|10741|叔本华
悲观论集|Studies in Pessimism|Schopenhauer|10732|叔本华
劝诫与箴言|Counsels and Maxims|Schopenhauer|10715|叔本华
克尔凯郭尔选集|Selections from the Writings of Kierkegaard|Kierkegaard|60333|克尔凯郭尔
恐惧与颤栗|Fear and Trembling|Søren Kierkegaard|0|克尔凯郭尔''',
'nietzsche': '''查拉图斯特拉如是说|Thus Spake Zarathustra|Nietzsche|1998|尼采
善恶的彼岸|Beyond Good and Evil|Nietzsche|4363|尼采
论道德的谱系|The Genealogy of Morals|Nietzsche|52319|尼采
悲剧的诞生|The Birth of Tragedy|Nietzsche|51356|尼采
敌基督者|The Antichrist|Nietzsche|19322|尼采
瞧，这个人|Ecce Homo|Nietzsche|52190|尼采
偶像的黄昏|The Twilight of the Idols|Nietzsche|52263|尼采
快乐的科学|The Joyful Wisdom|Nietzsche|52881|尼采''',
'wittgenstein': '''逻辑哲学论|Tractatus Logico-Philosophicus|Wittgenstein|5740|维特根斯坦
哲学研究|Philosophical Investigations|Ludwig Wittgenstein|0|维特根斯坦
论确定性|On Certainty|Ludwig Wittgenstein|0|维特根斯坦''',
'heidegger_sartre': '''存在与时间|Being and Time|Martin Heidegger|0|海德格尔
形而上学导论|Introduction to Metaphysics|Martin Heidegger|0|海德格尔
存在与虚无|Being and Nothingness|Jean-Paul Sartre|0|萨特
恶心|Nausea|Jean-Paul Sartre|0|萨特
存在主义是一种人道主义|Existentialism Is a Humanism|Jean-Paul Sartre|0|萨特''',
'bacon': '''新工具|Novum Organum|Bacon|45988|培根
随笔集|The Essays or Counsels, Civil and Moral|Bacon|575|培根
新大西岛|The New Atlantis|Bacon|2434|培根
学术的进展|The Advancement of Learning|Bacon|5500|培根''',
'mill': '''论自由|On Liberty|Mill|34901|密尔
功利主义|Utilitarianism|Mill|11224|密尔
妇女的屈从地位|The Subjection of Women|Mill|27083|密尔
自传|Autobiography|Mill|10378|密尔
代议制政府|Considerations on Representative Government|Mill|5669|密尔
逻辑体系|A System of Logic, Ratiocinative and Inductive|Mill|27942|密尔''',
'frege': '''算术基础|The Foundations of Arithmetic|Gottlob Frege|0|弗雷格
概念文字|Begriffsschrift|Gottlob Frege|0|弗雷格
论涵义与指称|Translations from the Philosophical Writings of Gottlob Frege|Gottlob Frege|0|弗雷格''',
'russell': '''哲学问题|The Problems of Philosophy|Russell|5827|罗素
心的分析|The Analysis of Mind|Russell|2529|罗素
神秘主义与逻辑|Mysticism and Logic and Other Essays|Russell|25447|罗素
数理哲学导论|Introduction to Mathematical Philosophy|Russell|41654|罗素
我们关于外部世界的知识|Our Knowledge of the External World|Russell|37090|罗素
自由之路|Proposed Roads to Freedom|Russell|690|罗素
西方哲学史|A History of Western Philosophy|Bertrand Russell|0|罗素''',
'peirce_dewey': '''民主主义与教育|Democracy and Education|Dewey|852|杜威
我们怎样思维|How We Think|Dewey|37423|杜威
哲学的改造|Reconstruction in Philosophy|Dewey|40089|杜威
儿童与课程|The Child and the Curriculum|Dewey|29259|杜威
人性与行为|Human Nature and Conduct|Dewey|41386|杜威
机会、爱与逻辑|Chance, Love, and Logic|Charles S. Peirce|0|皮尔士''',
'popper': '''科学发现的逻辑|The Logic of Scientific Discovery|Karl Popper|0|波普尔
开放社会及其敌人|The Open Society and Its Enemies|Karl Popper|0|波普尔
猜想与反驳|Conjectures and Refutations|Karl Popper|0|波普尔
历史决定论的贫困|The Poverty of Historicism|Karl Popper|0|波普尔''',
'kuhn': '''科学革命的结构|The Structure of Scientific Revolutions|Thomas Kuhn|0|库恩
哥白尼革命|The Copernican Revolution|Thomas Kuhn|0|库恩
必要的张力|The Essential Tension|Thomas Kuhn|0|库恩''',
'rawls': '''正义论|A Theory of Justice|John Rawls|0|罗尔斯
政治自由主义|Political Liberalism|John Rawls|0|罗尔斯
万民法|The Law of Peoples|John Rawls|0|罗尔斯
作为公平的正义|Justice as Fairness: A Restatement|John Rawls|0|罗尔斯''',
'foucault': '''规训与惩罚|Discipline and Punish|Michel Foucault|0|福柯
词与物|The Order of Things|Michel Foucault|0|福柯
疯癫与文明|Madness and Civilization|Michel Foucault|0|福柯
性史|The History of Sexuality|Michel Foucault|0|福柯
知识考古学|The Archaeology of Knowledge|Michel Foucault|0|福柯''',
'habermas': '''交往行为理论|The Theory of Communicative Action|Jürgen Habermas|0|哈贝马斯
公共领域的结构转型|The Structural Transformation of the Public Sphere|Jürgen Habermas|0|哈贝马斯
在事实与规范之间|Between Facts and Norms|Jürgen Habermas|0|哈贝马斯
认识与兴趣|Knowledge and Human Interests|Jürgen Habermas|0|哈贝马斯''',
'smith_ricardo': '''国富论|An Inquiry into the Nature and Causes of the Wealth of Nations|Smith|3300|亚当·斯密
道德情操论|The Theory of Moral Sentiments|Smith|67363|亚当·斯密
政治经济学及赋税原理|On the Principles of Political Economy, and Taxation|Ricardo|33310|李嘉图''',
'keynes_friedman': '''和约的经济后果|The Economic Consequences of the Peace|Keynes|15776|凯恩斯
就业、利息和货币通论|The General Theory of Employment, Interest and Money|John Maynard Keynes|0|凯恩斯
资本主义与自由|Capitalism and Freedom|Milton Friedman|0|弗里德曼
自由选择|Free to Choose|Milton Friedman|0|弗里德曼''',
'hayek_schumpeter': '''通往奴役之路|The Road to Serfdom|Friedrich Hayek|0|哈耶克
自由宪章|The Constitution of Liberty|Friedrich Hayek|0|哈耶克
致命的自负|The Fatal Conceit|Friedrich Hayek|0|哈耶克
资本主义、社会主义与民主|Capitalism, Socialism and Democracy|Joseph Schumpeter|0|熊彼特
经济发展理论|The Theory of Economic Development|Joseph Schumpeter|0|熊彼特''',
'nash': '''纳什精要|The Essential John Nash|John Nash|0|纳什
美丽心灵（传记）|A Beautiful Mind|Sylvia Nasar|0|西尔维娅·娜萨
博弈论与经济行为|Theory of Games and Economic Behavior|John von Neumann|0|冯·诺伊曼、摩根斯坦''',
'simon_kahneman': '''管理行为|Administrative Behavior|Herbert Simon|0|西蒙
人工科学|The Sciences of the Artificial|Herbert Simon|0|西蒙
思考，快与慢|Thinking, Fast and Slow|Daniel Kahneman|0|卡尼曼
噪声|Noise: A Flaw in Human Judgment|Daniel Kahneman|0|卡尼曼''',
'durkheim_weber': '''宗教生活的基本形式|The Elementary Forms of the Religious Life|Durkheim|41360|涂尔干
自杀论|Suicide: A Study in Sociology|Émile Durkheim|0|涂尔干
社会分工论|The Division of Labor in Society|Émile Durkheim|0|涂尔干
新教伦理与资本主义精神|The Protestant Ethic and the Spirit of Capitalism|Max Weber|0|韦伯
经济与社会|Economy and Society|Max Weber|0|韦伯''',
'simmel_mead': '''货币哲学|The Philosophy of Money|Georg Simmel|0|齐美尔
齐美尔社会学文选|The Sociology of Georg Simmel|Georg Simmel|0|齐美尔
心灵、自我与社会|Mind, Self, and Society|George Herbert Mead|0|米德
现在的哲学|The Philosophy of the Present|George Herbert Mead|0|米德''',
'granovetter': '''找工作|Getting a Job: A Study of Contacts and Careers|Mark Granovetter|0|格兰诺维特
社会与经济|Society and Economy|Mark Granovetter|0|格兰诺维特''',
'olson_putnam': '''集体行动的逻辑|The Logic of Collective Action|Mancur Olson|0|奥尔森
国家的兴衰|The Rise and Decline of Nations|Mancur Olson|0|奥尔森
独自打保龄|Bowling Alone|Robert Putnam|0|帕特南
使民主运转起来|Making Democracy Work|Robert Putnam|0|帕特南''',
'pavlov_skinner': '''条件反射|Conditioned Reflexes|Ivan Pavlov|0|巴甫洛夫
瓦尔登湖第二|Walden Two|B. F. Skinner|0|斯金纳
超越自由与尊严|Beyond Freedom and Dignity|B. F. Skinner|0|斯金纳
科学与人类行为|Science and Human Behavior|B. F. Skinner|0|斯金纳''',
'piaget_vygotsky': '''儿童的语言与思维|The Language and Thought of the Child|Jean Piaget|0|皮亚杰
儿童心理学|The Psychology of the Child|Jean Piaget|0|皮亚杰
发生认识论|Genetic Epistemology|Jean Piaget|0|皮亚杰
思维与语言|Thought and Language|Lev Vygotsky|0|维果茨基
社会中的心智|Mind in Society|Lev Vygotsky|0|维果茨基''',
'ebbinghaus': '''记忆|Memory: A Contribution to Experimental Psychology|Hermann Ebbinghaus|0|艾宾浩斯
心理学纲要|Psychology: An Elementary Text-book|Hermann Ebbinghaus|0|艾宾浩斯''',
'maslow_festinger': '''动机与人格|Motivation and Personality|Abraham Maslow|0|马斯洛
存在心理学探索|Toward a Psychology of Being|Abraham Maslow|0|马斯洛
人性能达到的境界|The Farther Reaches of Human Nature|Abraham Maslow|0|马斯洛
认知失调理论|A Theory of Cognitive Dissonance|Leon Festinger|0|费斯廷格
当预言失败时|When Prophecy Fails|Leon Festinger|0|费斯廷格'''
}
