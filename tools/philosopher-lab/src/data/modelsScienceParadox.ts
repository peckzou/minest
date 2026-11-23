import { PhilosophyModel } from '../types/philosophy';

export const MODELS_77_TO_86: PhilosophyModel[] = [
  {
    id: 77,
    slug: 'minest_lakatos',
    title: '拉卡托斯 · 科学研究纲领',
    philosopher: '伊姆雷·拉卡托斯',
    concept: '硬核（Hard Core）、保护带（Protective Belt）、反面与正面启发法、进步与退化纲领',
    categoryGroup: '五、科学哲学、数学哲学与思想实验（77–86）',
    tags: ['科学哲学', '认识论'],
    playSummary: '操作硬核、保护带和辅助假设，观察理论如何回应反例',
    levelsSummary: '① 硬核与辅助假设保护带 · ② 海王星的发现（吸收反常） · ③ 进步纲领 vs 退化纲领',
    source: '《科学研究纲领方法论》（据 SEP《Imre Lakatos》转引）',
    quoteCount: 6,
    thumbType: 'lakatos',
    coreQuestion: '当天王星的观测轨道与牛顿力学预测不符时，为什么科学家没有按素朴证伪主义立刻抛弃牛顿定律，而是猜想“外侧还有一颗未发现的行星（海王星）”？',
    boundaryNote: '拉卡托斯认为科学评估的基本单位不是孤立假说，而是由不可触碰的“硬核”与可调整的“辅助假设保护带”组成的“研究纲领（Research Programme）”。',
    stages: [
      {
        id: 1,
        tabLabel: '① 硬核与保护带',
        instructionTitle: '① 发射经验反例冲击波 · 调节“反面启发法（守护硬核）”与“外围保护带（调整辅助假说）”，观察研究纲领如何替硬核承受证伪冲击',
        sliders: [
          { key: 'beltFlexibility', label: '外围辅助假说保护带（Protective Belt）的调整能力', min: 10, max: 100, step: 5, defaultValue: 75, unit: '%' }
        ],
        buttons: [
          { key: 'fireAnomaly', label: '☄ 发射经验反例冲击波（天王星轨道偏差）', accent: 'amber' }
        ],
        mappings: [
          [
            '点击“发射经验反例冲击波”：观察反面启发法禁止箭头直接射向中央“硬核（牛顿三定律+万有引力）”，而是将其偏转到外围“保护带”上',
            '所有的科学研究纲领都以其“硬核（Hard Core）”为特征；纲领的“反面启发法”禁止我们将否定后件式（Modus Tollens）的证伪箭头直接指向硬核，而是要求我们发挥创造力去调整、替换外围由辅助假说与初始条件构成的“保护带”。',
            'The negative heuristic of the programme forbids us to direct the modus tollens at this "hard core". Instead, we must use our ingenuity to articulate or even invent "auxiliary hypotheses", which form a protective belt around this core.',
            '拉卡托斯《科学研究纲领方法论》（据 SEP《Imre Lakatos》§2.2 转引）'
          ],
          [
            '将“外围保护带的调整能力”推至 80% 以上并再次发射反例：观察保护带通过修正行星分布假说成功吸收反常',
            '正是这层辅助假说的保护带，必须在经验检验的冲击下首当其冲，通过不断调整、再调整甚至彻底替换，来保卫日益稳固的硬核。',
            'It is this protective belt of auxiliary hypotheses which has to bear the brunt of tests and get adjusted and re-adjusted, or even completely replaced, to defend the thus-hardened core.',
            '据 SEP《Imre Lakatos》§2.2'
          ]
        ]
      },
      {
        id: 2,
        tabLabel: '② 正面启发法与海王星的发现',
        instructionTitle: '② 把反例转化为辉煌的证实 · 在天王星轨道反常情境中，切换“素朴证伪（直接放弃牛顿力学）”与“正面启发法（预言未知行星海王星）”',
        choices: [
          {
            key: 'uranusResponse',
            label: '面对天王星轨道偏离牛顿理论计算值时的科学策略',
            defaultValue: 'predict_neptune',
            options: [
              { value: 'naive_falsify', label: '素朴证伪主义：一见轨道不符，立刻宣布“牛顿万有引力定律已被证伪！”' },
              { value: 'predict_neptune', label: '研究纲领保护带调整（亚当斯与勒维耶）：假定存在未知外行星摄动，算出坐标并发现海王星！' }
            ]
          }
        ],
        mappings: [
          [
            '选择“研究纲领保护带调整：算出坐标并发现海王星”',
            '牛顿研究纲领生活在汪洋大海般的“反常”之中，但科学家并没有因此抛弃硬核；正面启发法指引科学家通过修改保护带中的行星模型，不仅化解了天王星轨道反常，反而预言并发现了海王星——把原本的“反例”转化成了纲领最辉煌的胜利。',
            'The positive heuristic consists of a partially articulated set of suggestions or hints on how to change, develop the "refutable variants" of the research-programme, how to modify, sophisticate, the "refutable" protective belt.',
            '据 SEP《Imre Lakatos》§2.2'
          ],
          [
            '对比“素朴证伪主义”与“研究纲领调整”',
            '任何单一的实验或观测反常都不能单独判处一个伟大科学理论的死刑；在新的更好研究纲领出现之前，理论在保护带的调整下具有强大的韧性。',
            'There is no falsification before the emergence of a better theory.',
            '据 SEP《Imre Lakatos》§2.2'
          ]
        ]
      },
      {
        id: 3,
        tabLabel: '③ 进步的研究纲领 vs 退化的研究纲领',
        instructionTitle: '③ 科学划界的新标准 · 比较“不断预言并证实新颖事实（进步纲领）”与“只能事后打补丁自圆其说（退化纲领）”',
        choices: [
          {
            key: 'programmeStatus',
            label: '保护带修改的性质对比',
            defaultValue: 'progressive',
            options: [
              { value: 'progressive', label: '进步的研究纲领（Progressive）：保护带的每一次修改都能预言前所未闻的新颖事实（如海王星、光线弯曲），并部分得到经验确证' },
              { value: 'degenerating', label: '退化的研究纲领（Degenerating）：永远跟在反常后面被动打特设补丁（Ad hoc），无法预言任何新颖事实' }
            ]
          }
        ],
        mappings: [
          [
            '在“进步的研究纲领”与“退化的研究纲领”之间切换：对比超前预言光束与事后补丁堆积',
            '一个研究纲领如果是“进步的”，那么只要它的理论增长超前于经验增长——即它能持续预言新颖的、未曾预料到的事实并得到部分确证；反之，如果它只能给出事后的特设解释（Ad hoc explanations），它就是“退化的”。',
            'A research programme is said to be progressing as long as its theoretical growth anticipates its empirical growth, that is, as long as it keeps predicting novel facts with some success; it is stagnating or degenerating if its theoretical growth lags behind its empirical growth.',
            '拉卡托斯《科学史及其理性重建》（据 SEP《Imre Lakatos》§2.3 转引）'
          ],
          [
            '观察退化纲领最终被更具预言力的进步纲领所取代',
            '科学进步与理性淘汰并不发生在一次孤立实验的瞬间，而是发生在竞争性的研究纲领之间：当一个进步纲领不仅能解释旧纲领的一切成功、还能预言更多新颖事实时，退化纲领才在历史竞争中被取代。',
            'Objective, scientific progress consists in a progressive research programme superseding a degenerating one.',
            '据 SEP《Imre Lakatos》§2.3'
          ]
        ]
      }
    ]
  },
  {
    id: 78,
    slug: 'minest_feyerabend',
    title: '费耶阿本德 · 方法多元主义',
    philosopher: '保罗·费耶阿本德',
    concept: '反对方法（Against Method）、认识论无政府主义与“怎么都行（Anything Goes）”',
    categoryGroup: '五、科学哲学、数学哲学与思想实验（77–86）',
    tags: ['科学哲学', '认识论'],
    playSummary: '在不同科学研究情境中比较方法选择与限制',
    levelsSummary: '① 单一方法论铁笼 vs 科学史突破 · ② 伽利略的“反归纳”与特设假说 · ③ 理论增生与“怎么都行”',
    source: '《反对方法》（Against Method，据 SEP《Paul Feyerabend》转引）',
    quoteCount: 6,
    thumbType: 'feyerabend',
    coreQuestion: '如果历史上所有伟大的科学家（如伽利略、爱因斯坦）都严格遵守科学哲学家规定的“禁止违反既有证据、禁止特设假说”的铁律，科学革命还能发生吗？',
    boundaryNote: '费耶阿本德说“怎么都行（Anything goes）”并不是提倡虚无主义胡来，而是对试图把科学框死在唯一僵化教条中的“理性主义方法论家”的反讽：若一定要找一条放之四海皆准且不扼杀进步的唯一规则，那就只能是“怎么都行”。',
    stages: [
      {
        id: 1,
        tabLabel: '① 任何单一固定规则都会被科学史打破',
        instructionTitle: '① 切换方法论铁律与科学革命案例 · 尝试用严苛的“逻辑经验主义/证伪主义铁律”去审查日心说或原子论的早期诞生，看它们是否会被直接扼杀',
        choices: [
          {
            key: 'strictRule',
            label: '施加给早期科学革命者的“方法论戒律”',
            defaultValue: 'rule_consistency',
            options: [
              { value: 'rule_consistency', label: '戒律一（一致性条件）：新假说必须与已被公认的观察事实及既有成熟理论保持一致（结果：哥白尼日心说当场被判出局 ✗）' },
              { value: 'rule_falsify', label: '戒律二（严禁特设假说）：一旦遇到反例如高塔落石不偏西，必须立即放弃日心说（结果：日心说萌芽期即夭折 ✗）' },
              { value: 'plural_freedom', label: '方法多元主义（突破铁笼）：允许科学家根据具体情境采取反归纳、修辞说服与创造性保护' }
            ]
          }
        ],
        mappings: [
          [
            '查看“戒律一”与“戒律二”如何把萌芽期的哥白尼日心说直接扼杀在摇篮中',
            '无论一条方法论规则对于科学哲学家来说显得多么合理、多么根基牢固，在科学史上总有某个时刻，违反它、甚至采取与它截然相反的行动，不仅是合理的，而且是科学进步所绝对必需的。',
            'There is not a single rule, however plausible, and however firmly grounded in epistemology, that is not violated at some time or other... Such violations are not accidental events; they are necessary for progress.',
            '费耶阿本德《反对方法》第 1 章（据 SEP《Paul Feyerabend》§3 转引）'
          ],
          [
            '切换到“方法多元主义（突破铁笼）”：观察科学探索重获生机',
            '认为科学可以、而且应该按照固定的、普遍的规则来运转的想法，既是不切实际的，也是有害的；那只会造就专业的教条，而扼杀真正的人类创造力。',
            'The idea that science can, and should, be run according to fixed and universal rules, is both unrealistic and pernicious.',
            '费耶阿本德《反对方法》结论章（据 SEP 转引）'
          ]
        ]
      },
      {
        id: 2,
        tabLabel: '② 伽利略的高塔实验与“反归纳（Counterinduction）”',
        instructionTitle: '② 当时的“感官事实”本身已被旧理论污染 · 在高塔落石争论中，看伽利略如何通过“反归纳”引入新惯性系观念，揭露亚里士多德派的“纯粹观察事实”其实暗藏自然解释',
        choices: [
          {
            key: 'towerView',
            label: '高塔落石：石头垂直落回塔底，这证明了地球静止吗？',
            defaultValue: 'aristotle_sense',
            options: [
              { value: 'aristotle_sense', label: '16 世纪常识与感官经验：“看！石头垂直落在塔根，没有被甩在后面——这铁证如山地证明地球没动！”' },
              { value: 'galileo_counter', label: '伽利略的“反归纳”突围：构造船舱与圆形惯性新概念，揭穿“感官事实”早已暗中预设了旧运动学（自然解释）！' }
            ]
          }
        ],
        mappings: [
          [
            '从“16 世纪常识与感官经验”切换到“伽利略的反归纳突围”：观察画布中原本指向“地球静止”的感官证据被重新解释为“石头与塔共享地球自转运动”',
            '经验事实从来不是赤裸裸、纯中立的，它们在被陈述出来的那一刻就已经被旧的意识形态与“自然解释”所污染（如“石头直落=地静”）。为了揭露隐藏在常识观察背后的旧假定，科学家必须使用“反归纳（Counterinduction）”——故意引进与最确凿的既定观察事实相冲突的假说！',
            'Therefore, the first step in our criticism of customary concepts and customary reactions is to step outside the circle and either to invent a new conceptual system, or to import such a system from outside science... Counterinduction is thus both a fact—science could not exist without it—and a legitimate and much needed move in the game of science.',
            '费耶阿本德《反对方法》第 5–6 章（据 SEP《Paul Feyerabend》§3.2 转引）'
          ],
          [
            '观察伽利略在望远镜光学理论尚未完备时，借助宣传、类比与特设假说为新宇宙观争取生长时间',
            '一个新诞生的理论就像一株幼苗，如果立刻用成熟的旧理论所掌控的“观察标准”去严格裁决它，它必死无疑；伽利略正是借助了特设假说、修辞技巧和反归纳，才为新科学赢得了成长呼吸的空间。',
            'Galileo prevails because of his style and his clever persuasion techniques, because he writes in Italian rather than in Latin, and because he appeals to people who are temperamentally opposed to the old ideas.',
            '据 SEP《Paul Feyerabend》§3.2'
          ]
        ]
      },
      {
        id: 3,
        tabLabel: '③ 理论增生原则与“怎么都行”',
        instructionTitle: '③ 增生（Proliferation）对抗单一霸权 · 调节科学共同体中的“竞争性另类理论多样性”，观察多元碰撞如何揭露单一主流范式的盲区',
        sliders: [
          { key: 'proliferation', label: '另类竞争理论与传统知识的增生多元度 (Proliferation)', min: 10, max: 100, step: 5, defaultValue: 30, unit: '%' }
        ],
        mappings: [
          [
            '将“另类竞争理论与传统知识的增生多元度”推至 80% 以上：多束不同视角的理论光束相互照亮彼此看不见的盲区',
            '知识的进步要求“增生原则（Principle of Proliferation）”：发明和精细化那些与已被广泛接受的观点不一致的另类理论；因为有些反驳某个理论的重大经验事实，只有站在另一个与之竞争的替代理论视角下才可能被发现。',
            'Variety of opinion is necessary for objective knowledge. And a method that encourages variety is also the only method that is compatible with a humanitarian outlook.',
            '费耶阿本德《反对方法》第 3 章（据 SEP《Paul Feyerabend》§2.3 转引）'
          ],
          [
            '点亮“怎么都行（Anything goes）”的真正哲学意涵',
            '如果非要坚持找一条在一切历史条件下都不阻碍进步的普遍方法论原则，那么唯一能幸存下来的原则就只能是：“怎么都行（Anything goes）”。',
            'It is clear, then, that the idea of a fixed method, or of a fixed theory of rationality, rests on too naive a view of man and his social surroundings. To those who look at the rich material provided by history, and who are not intent on impoverishing it in order to please their lower instincts, their craving for intellectual security in the form of clarity, precision, "objectivity", "truth", it will become clear that there is only one principle that can be defended under all circumstances and in all stages of human development. It is the principle: anything goes.',
            '费耶阿本德《反对方法》第 1 章结尾'
          ]
        ]
      }
    ]
  },
  {
    id: 79,
    slug: 'minest_bayesian',
    title: '贝叶斯 · 认识论',
    philosopher: '托马斯·贝叶斯 / 拉普拉斯 / 拉姆齐',
    concept: '置信度（Credence）、先验概率、似然比与贝叶斯条件化更新',
    categoryGroup: '五、科学哲学、数学哲学与思想实验（77–86）',
    tags: ['认识论', '逻辑', '科学哲学'],
    playSummary: '拖动先验概率和证据强度，观察信念程度如何更新',
    levelsSummary: '① 信念不是非黑即白（0–100% 置信度） · ② 基础率谬误与医疗检测面积图 · ③ 证据累积与先验分歧的冲洗（Washing out of Priors）',
    source: '贝叶斯《论解决机遇学说中一个问题》1763（据 SEP《Bayesian Epistemology》转引）',
    quoteCount: 6,
    thumbType: 'bayes',
    coreQuestion: '当一项准确率高达 95% 的罕见病检测结果呈“阳性”时，为什么你真正患上该病的后验概率可能只有不到 16%？理性的信念应当如何随新证据平滑更新？',
    boundaryNote: '贝叶斯认识论将传统认识论中“要么全信、要么全不信”的二值信念，拓展为连续的“置信度（Credence / Degree of Belief）”，并以贝叶斯定理 $P(H|E) = \\frac{P(E|H)P(H)}{P(E)}$ 作为理性更新的核心规范。',
    stages: [
      {
        id: 1,
        tabLabel: '① 先验概率、似然度与贝叶斯公式',
        instructionTitle: '① 实时拖动先验概率与证据强度 · 调节假说 H 的先验置信度 P(H)、真阳率 P(E|H) 与假阳率 P(E|¬H)，实时观察后验置信度 P(H|E) 的更新',
        sliders: [
          { key: 'priorP', label: '先验概率 P(H)（拿到证据前的置信度）', min: 1, max: 99, step: 1, defaultValue: 30, unit: '%' },
          { key: 'truePos', label: '似然度 P(E|H)（若 H 为真，出现证据 E 的概率）', min: 5, max: 99, step: 1, defaultValue: 85, unit: '%' },
          { key: 'falsePos', label: '假阳率 P(E|¬H)（若 H 为假，仍出现证据 E 的概率）', min: 1, max: 90, step: 1, defaultValue: 20, unit: '%' }
        ],
        mappings: [
          [
            '拖动“先验概率 P(H)”或“似然度 P(E|H)”：观察画布中的贝叶斯天平与后验概率 P(H|E) 连续平滑地更新',
            '贝叶斯认识论认为，理性主体的信念并非只有“全信/全不信”两个档位，而是具有连续强度的“置信度（Credence）”；当获得新证据 E 时，理性主体应当遵循条件化规则（Conditionalization），将对假说 H 的置信度更新为后验概率 P(H|E)。',
            'According to Bayesian epistemology, cognitive agents have degrees of belief (or credences), which are rationally updated by conditionalization on new evidence E: P_new(H) = P_old(H | E).',
            '据 SEP《Bayesian Epistemology》§1'
          ],
          [
            '将“假阳率 P(E|¬H)”调低至 5% 以下，同时将“似然度 P(E|H)”调高至 90% 以上：观察似然比 P(E|H)/P(E|¬H) 如何强力推高后验信念',
            '证据 E 对假说 H 的支持力度，不仅取决于“若 H 为真 E 有多可能发生 P(E|H)”，同样取决于“若 H 为假 E 有多不可能发生 P(E|¬H)”——两者的比值即“贝叶斯因子（似然比）”。',
            'The impact of evidence E on hypothesis H depends on the likelihood ratio P(E|H) / P(E|~H).',
            '据 SEP《Bayesian Epistemology》§3'
          ]
        ]
      },
      {
        id: 2,
        tabLabel: '② 基础率忽视（Base-Rate Fallacy）与罕见病检测',
        instructionTitle: '② 为什么 95% 准确的检测阳性，患病率却很低？ · 观察 10×10 单位面积方格图：当疾病基础发病率 P(H) 极低（如 1%）时，假阳性人数是如何淹没真阳性人数的',
        sliders: [
          { key: 'baseRate', label: '罕见病在人群中的基础发病率 P(患病)', min: 1, max: 50, step: 1, defaultValue: 2, unit: '%' },
          { key: 'testAccuracy', label: '检测试剂盒准确率（真阳率 = 真阴率）', min: 70, max: 99, step: 1, defaultValue: 95, unit: '%' }
        ],
        mappings: [
          [
            '保持“基础发病率”在 1%–2%、“试剂准确率”在 95%：观察右侧所有亮红灯（检测阳性）的人群中，绝大部分其实是健康人的 5% 假阳性！',
            '人们在直观判断中常常犯下“基础率谬误（Base-Rate Fallacy）”：只盯着“95% 的检测准确率”，却忽略了该病在人群中的先验基础率只有 1%——在 1000 人中，真患病且检出阳性的只有约 10 人，而 990 名健康人中出现 5% 假阳性的却有约 50 人！',
            'Ignoring the prior probability (base rate) of a hypothesis when evaluating new evidence leads to systematic errors in probabilistic reasoning known as the base-rate fallacy.',
            '据 SEP《Bayesian Epistemology》§4'
          ],
          [
            '逐步将“基础发病率”从 2% 拉高到 40%：观察真阳性面积在总阳性面积中的占比如何迅速攀升',
            '“非凡的主张需要非凡的证据”：在贝叶斯框架下，一个先验概率 P(H) 极低的假说，即便遇到了一条看似有利的证据，其后验概率依然受制于低先验，除非证据的似然比极端强大或经过多轮独立重复确证。',
            'A very low prior probability requires strong or repeated evidence with a high likelihood ratio to yield a high posterior credence.',
            '据 SEP《Bayesian Epistemology》§3–4'
          ]
        ]
      },
      {
        id: 3,
        tabLabel: '③ 先验分歧的冲洗（Washing Out of Priors）',
        instructionTitle: '③ 两个死对头科学家能达成共识吗？ · 设定怀疑论者（先验 5%）与乐观论者（先验 90%），点击“注入新一轮独立实验证据”，观察两人的后验置信度曲线如何一步步收敛到一起',
        buttons: [
          { key: 'addEvidence', label: '🧪 注入一轮支持假说 H 的独立实验证据 (+E)', accent: 'green' },
          { key: 'addCounterEvidence', label: '🧪 注入一轮反驳假说 H 的独立实验证据 (-E)', accent: 'red' }
        ],
        mappings: [
          [
            '连续点击“注入一轮支持假说 H 的独立实验证据” 4 次以上：观察最初先验分别为 5% 和 90% 的两条信念曲线最终汇聚到几乎同一点（> 98%）',
            '有人质疑贝叶斯主义会因为每个人最初的主观先验概率 P(H) 不同而陷入相对主义；但贝叶斯收敛定理表明：只要两位主体都没有赋予极端值 0 或 1，随着客观独立证据的不断累积，最初的先验分歧就会被“冲洗掉（Washing out of priors）”，两人的后验信念终将趋于一致。',
            'As more and more objective evidence comes in, differences in initial prior probabilities are "washed out", and the posterior probabilities of different rational agents converge.',
            '据 SEP《Bayesian Epistemology》§5（Convergence / Washing out of priors）'
          ],
          [
            '再连续点击“注入反驳假说 H 的实验证据” 4 次以上：两条曲线又共同向 0% 收敛',
            '科学客观性并不要求科学家在探究开始前像白纸一样毫无先验偏见，而是要求他们遵循严格的贝叶斯条件化规则，在公共证据流面前诚实地更新自己的信念度。',
            'Objectivity in Bayesian confirmation arises from the disciplined updating of credences in light of shared empirical evidence.',
            '据 SEP《Bayesian Epistemology》§5'
          ]
        ]
      }
    ]
  },
  {
    id: 80,
    slug: 'minest_hempel_raven',
    title: '亨普尔 · 乌鸦悖论',
    philosopher: '卡尔·古斯塔夫·亨普尔',
    concept: '确证理论（Confirmation Theory）、尼科德准则与逻辑等价条件（室内观鸟学）',
    categoryGroup: '五、科学哲学、数学哲学与思想实验（77–86）',
    tags: ['科学哲学', '逻辑', '认识论'],
    playSummary: '通过不同观察对象，探索确认理论中的反直觉问题',
    levelsSummary: '① 全称假说与逆否命题的逻辑等价 · ② 绿苹果/白鞋为什么确证了“乌鸦皆黑”？ · ③ 贝叶斯量化解悖（宇宙集合比例）',
    source: '《确证逻辑研究》（Studies in the Logic of Confirmation 1945，据 SEP《Confirmation》转引）',
    quoteCount: 6,
    thumbType: 'raven',
    coreQuestion: '既然“所有乌鸦都是黑的（∀x(Rx→Bx)）”在逻辑上完全等价于它的逆否命题“所有非黑的东西都不是乌鸦（∀x(¬Bx→¬Rx)）”，那么你在屋里看到一颗“绿苹果”或一只“白皮鞋”，是不是也在为“所有乌鸦都是黑的”提供科学证据？',
    boundaryNote: '乌鸦悖论揭示了“直觉上的相关性”与“形式逻辑等价性”之间的张力；现代主流解决方案（贝叶斯解）承认绿苹果确实提供了极其微小的正确证，但由于宇宙中“非黑物体”的数量远比“乌鸦”庞大亿万倍，单颗绿苹果的确证度几乎趋近于零。',
    stages: [
      {
        id: 1,
        tabLabel: '① 尼科德准则与逻辑等价条件',
        instructionTitle: '① 观察样本并检验两条等价命题 · 依次点击观察“黑乌鸦”、“绿苹果（非黑非鸦）”、“白鞋子”与“白化乌鸦”，查看它们对 H₁ 与 H₂ 的影响',
        choices: [
          {
            key: 'observedItem',
            label: '当前观察到的世界中物体',
            defaultValue: 'black_raven',
            options: [
              { value: 'black_raven', label: '🐦‍⬛ 样本 A：一只黑色的乌鸦（Raven ∧ Black）——直接正例确证 H₁' },
              { value: 'green_apple', label: '🍏 样本 B：桌上一颗绿色的苹果（¬Black ∧ ¬Raven）——直接正例确证逆否命题 H₂！' },
              { value: 'white_shoe', label: '👟 样本 C：脚上一只白色的鞋子（¬Black ∧ ¬Raven）——足不出户的“室内观鸟学”？' },
              { value: 'albino_raven', label: '🕊 样本 D：一只白色的乌鸦（Raven ∧ ¬Black）——同时证伪 H₁ 与 H₂！' }
            ]
          }
        ],
        mappings: [
          [
            '从“样本 A：黑色的乌鸦”切换到“样本 B：绿色的苹果”或“样本 C：白色的鞋子”：观察逆否命题 H₂ 被确证，进而通过逻辑等价性传导给 H₁',
            '根据尼科德准则，一个形如“所有 F 都是 G”的普遍假说，受到其正例（既是 F 又是 G 的对象）的确证；但“所有乌鸦都是黑的（∀x(Rx→Bx)）”在逻辑上严格等价于“所有非黑的东西都不是乌鸦（∀x(¬Bx→¬Rx)）”。根据等价条件，确证后者的任何证据（如一颗非黑且非乌鸦的绿苹果），也必然同样确证前者！',
            'Any evidence which confirms a hypothesis H also confirms any hypothesis logically equivalent to H. Since "All ravens are black" is logically equivalent to "All non-black things are non-ravens", observing a green apple (which is non-black and a non-raven) confirms that all ravens are black!',
            '亨普尔《确证逻辑研究》1945（据 SEP《Confirmation》§2.1 转引）'
          ],
          [
            '切换到“样本 D：白色的乌鸦”：理解为何排除一个“非黑物是乌鸦”的可能就是在排查反例',
            '这看起来似乎很荒谬，仿佛生物学家无需走进森林，只需坐在房间里观察绿苹果、白鞋子和红铅笔，就能从事“室内观鸟学（Indoor Ornithology）”研究——这就是著名的亨普尔乌鸦悖论。',
            'This paradoxical result suggests that we could do "indoor ornithology"—confirming generalizations about ravens merely by sitting indoors and observing green apples and white shoes.',
            '据 SEP《Confirmation》§2.1'
          ]
        ]
      },
      {
        id: 2,
        tabLabel: '② 亨普尔的心理错觉诊断（背景知识）',
        instructionTitle: '② 为什么我们误以为“绿苹果跟乌鸦毫无关系”？ · 切换我们在检验那件“非黑物体”之前是否早已知道“它是一颗苹果”，体会背景知识的秘密偷换',
        choices: [
          {
            key: 'bgKnowledge',
            label: '检验样本时的背景知识状态',
            defaultValue: 'already_know_apple',
            options: [
              { value: 'already_know_apple', label: '日常心理偷换：我们已经先知道“手里拿的是颗苹果（绝不可能是乌鸦）”，再去观察它的颜色（当然毫无风险，不增加新信息）' },
              { value: 'unknown_nonblack', label: '纯粹逻辑检验：只知道“前面草丛里有个非黑色的活物（¬B）”，走近拨开草丛一看——还好不是乌鸦（¬R），排除了一个潜在反例！' }
            ]
          }
        ],
        mappings: [
          [
            '在“日常心理偷换”与“纯粹逻辑检验”之间切换：体会为什么排除一个未知的“非黑物”确实在逻辑上消除了一个潜在的“非黑乌鸦”反例',
            '亨普尔指出，我们之所以觉得“看绿苹果与乌鸦无关”，是因为我们在看它颜色之前就已经动用了背景知识“这是一颗苹果（因此绝不可能是乌鸦）”；但假如你只知道“前面有一个非黑色的未知对象”，你走过去检验它究竟是不是乌鸦，这一检验明明冒着发现“白乌鸦”的证伪风险！',
            'Hempel argued that the paradox is a psychological illusion caused by illicitly smuggling in background knowledge (that the object is already known to be an apple, hence not a raven).',
            '据 SEP《Confirmation》§2.2（Hempel’s Solution）'
          ],
          [
            '观察画布中的反例排查网格：每多排查一个未知非黑物不是乌鸦，宇宙中残留反例的可能空间就缩小一分',
            '全称命题“所有乌鸦皆黑”不仅是对乌鸦说的，其实是对全宇宙所有事物施加了一道禁令：“宇宙中绝不存在任何既非黑色、又是乌鸦的东西”。因此每检验一个非黑物体并确认它不是乌鸦，都确实在极其微小的程度上支持了这道宇宙禁令。',
            'Universal generalizations are claims about all objects in the universe: namely, that the class of non-black ravens is empty.',
            '据 SEP《Confirmation》§2.2'
          ]
        ]
      },
      {
        id: 3,
        tabLabel: '③ 贝叶斯量化解悖：为什么看黑乌鸦比看绿苹果强亿万倍？',
        instructionTitle: '③ 调节宇宙中“乌鸦集合 |R|”与“非黑物体集合 |¬B|”的规模比例 · 观察为什么检验一只乌鸦提供的确证增量 ΔP，远大于检验一件非黑物体',
        sliders: [
          { key: 'ravenPoolSize', label: '世界中乌鸦群体的相对规模 |R|', min: 1, max: 50, step: 1, defaultValue: 3, unit: '%' },
          { key: 'nonBlackPoolSize', label: '世界中非黑物体的庞大规模 |¬B|', min: 50, max: 99, step: 1, defaultValue: 96, unit: '%' }
        ],
        mappings: [
          [
            '保持“乌鸦规模 |R|”很小（< 5%）而“非黑物体规模 |¬B|”极大（> 90%）：对比画布上高耸的“黑乌鸦确证柱”与几乎贴地的“绿苹果确证柱”',
            '贝叶斯方案完美调和了逻辑与直觉：既然在我们的宇宙中，“非黑物体”的数量（|¬B|）比“乌鸦”的数量（|R|）要庞大亿万倍，那么随机抽中一只乌鸦去检验它黑不黑，比随机抽中一件非黑物体去检验它是不是乌鸦，面临的证伪风险要大亿万倍，因而通过检验后获得的贝叶斯确证增量也大亿万倍！',
            'Since the class of non-black things is vastly larger than the class of ravens in our universe (|¬B| >> |R|), observing a black raven confirms the hypothesis to a much greater degree than observing a non-black non-raven, even though both provide positive confirmation.',
            '据 SEP《Confirmation》§3.3（Bayesian Resolution of the Ravens Paradox）'
          ],
          [
            '尝试把“乌鸦规模 |R|”调高到 50%、把“非黑物体规模 |¬B|”调低到 50%（想象一个几乎满世界都是乌鸦、且绝大多数东西都是黑色的奇异世界）：观察两根确证柱变得一样高！',
            '假如在一个只有 10 件非黑物体、却有 100 万只乌鸦的奇异可能世界里，要去证实“所有乌鸦都是黑的”，最省事、确证力最强的办法反而是直接把那 10 件非黑物体检查一遍，看里面有没有乌鸦！',
            'In a world where there are very few non-black objects and millions of ravens, examining the non-black objects to see that none is a raven would actually be the most efficient way to confirm that all ravens are black.',
            '据 SEP《Confirmation》§3.3（Good 1967 / Maher 1999）'
          ]
        ]
      }
    ]
  },
  {
    id: 81,
    slug: 'minest_newcomb',
    title: '纽康悖论',
    philosopher: '威廉·纽康 / 罗伯特·诺齐克',
    concept: '因果决策论（CDT）vs 证据决策论（EDT）、超级预测者与支配原则',
    categoryGroup: '五、科学哲学、数学哲学与思想实验（77–86）',
    tags: ['认识论', '逻辑', '伦理学', '科学哲学'],
    playSummary: '在预测者与两个盒子的选择情境中比较决策原则',
    levelsSummary: '① 只拿一个盒子（One-Box）还是拿两个盒子（Two-Box）？ · ② 证据决策论 vs 因果决策论 · ③ 调节预测者准确率与连续模拟',
    source: '诺齐克《纽康问题与两条抉择原则》1969（据 SEP《Causal Decision Theory》转引）',
    quoteCount: 6,
    thumbType: 'newcomb',
    coreQuestion: '透明盒 A 里明摆着 $1,000；不透明盒 B 里要么是超级预测者昨天放进去的 $1,000,000（如果他预测你今天只拿盒 B），要么是 $0（如果他预测你今天贪心两个都拿）。既然预测者昨天就已经放好钱走了，你今天到底是“只拿盒 B”还是“两个盒子都拿”？',
    boundaryNote: '1969 年罗伯特·诺齐克发表该思想实验后，哲学界与决策论界分裂为势均力敌的两大阵营：“一盒派（证据决策论 EDT）”与“两盒派（因果决策论 CDT）”。',
    stages: [
      {
        id: 1,
        tabLabel: '① 做出你的抉择：拿一盒还是拿两盒？',
        instructionTitle: '① 面对透明盒 A（$1,000）与不透明盒 B（$1,000,000 或 $0） · 点击选择“只拿不透明盒 B（一盒派）”或“A 和 B 两个盒子全拿（两盒派）”，揭晓箱内金额',
        choices: [
          {
            key: 'boxChoice',
            label: '你的最终决策（超级预测者准确率 = 99%）',
            defaultValue: 'one_box',
            options: [
              { value: 'one_box', label: '📦 一盒派（One-Boxer）：只拿不透明盒 B，放弃眼前的 $1,000' },
              { value: 'two_box', label: '📦📦 两盒派（Two-Boxer）：A 盒与 B 盒两个全拿（既然钱昨天就放好了，多拿 A 盒总归多得 $1,000！）' }
            ]
          }
        ],
        buttons: [
          { key: 'openBoxes', label: '🔓 打开盒子揭晓奖金并运行 100 局统计', accent: 'amber' }
        ],
        mappings: [
          [
            '选择“一盒派（只拿盒 B）”并点击打开盒子：获得 $1,000,000（期望效用最大化）',
            '一盒派依据“期望效用最大化（证据决策论 EDT）”争辩说：预测者几乎从不失手（99% 准确）。如果我只拿盒 B，我有 99% 的把握拿到 100 万美元（期望值 $990,000）；如果我拿两盒，我有 99% 的概率只能拿到 1000 美元（期望值 $11,000）。傻子才为了 1000 块放弃 100 万！',
            'By the principle of maximizing expected utility (conditional on one’s act as evidence), taking only Box B yields an expected payoff of nearly $1,000,000, whereas taking both boxes yields only slightly more than $1,000.',
            '诺齐克 1969（据 SEP《Causal Decision Theory》§1 转引）'
          ],
          [
            '切换到“两盒派（A 和 B 全拿）”并点击打开盒子：发现 B 盒果然是空的（只拿到 $1,000），但仔细审视“因果支配原则”为何依然坚持拿两盒',
            '两盒派依据“状态支配原则（因果决策论 CDT）”争辩说：预测者昨天就已经做好预测、放好钱并离开了！今天你拿一盒还是拿两盒，在因果上绝对无法倒流回昨天去改变 B 盒里已有的钱。无论 B 盒里现在是 100 万还是 0，两个都拿总比只拿 B 盒多拿 1000 美元！',
            'The prediction is already made and the money is already in Box B (or not). Whether Box B contains $1M or $0, taking both boxes always gives you $1,000 more than taking only Box B. This is the Dominance Principle.',
            '诺齐克 1969（据 SEP《Causal Decision Theory》§1 转引）'
          ]
        ]
      },
      {
        id: 2,
        tabLabel: '② 证据决策论（EDT）vs 因果决策论（CDT）',
        instructionTitle: '② 透视盒 B 背面的玻璃窗 · 设想你的一位朋友坐在盒子背面，他已经亲眼看见了盒 B 里到底有没有 100 万，请问他会劝你拿一盒还是拿两盒？',
        choices: [
          {
            key: 'backWindowView',
            label: '切换观察视角：好消息价值（Evidential News Value）vs 因果效力（Causal Efficacy）',
            defaultValue: 'front_evidential',
            options: [
              { value: 'front_evidential', label: '正面证据视角（EDT）：我的选择是“预测者昨天怎么看我”的极强统计证据（选一盒 = 带来 B 盒有 100 万的好消息）' },
              { value: 'back_causal', label: '背面透明窗视角（CDT）：坐在盒子背面的朋友不管看到 B 里有 100 万还是 0，都会冲你大喊：“快两个都拿！”' }
            ]
          }
        ],
        mappings: [
          [
            '从“正面证据视角（EDT）”切换到“背面透明窗视角（CDT）”：理解为什么当 B 盒状态已知时，拿两盒严格占优',
            '因果决策论者指出：之所以选一盒在统计上伴随着高奖金，只是因为你的理性性格既是“预测者昨天放 100 万”的原因，也是“你今天选一盒”的共同原因；今天选一盒只是带来了“盒里已有 100 万”的好消息（Evidential news value），却没有任何改变盒内金额的因果力量。',
            'Evidential Decision Theory recommends the action with the highest news value (P(State | Act)), whereas Causal Decision Theory recommends the action with the highest causal efficacy in bringing about good outcomes.',
            '据 SEP《Causal Decision Theory》§1–2'
          ],
          [
            '对比一盒派的反击：“既然两盒派那么聪明理性，为什么走出房门时百万富翁全是一盒派，而两盒派口袋里永远只有 1000 块？”',
            '面对因果决策论的无懈可击逻辑，一盒派提出了著名的反讽诘问：“如果两盒派真那么理性，为什么你们还这么穷？（If you’re so smart, why ain’t you rich?）”——纽康悖论迫使哲学家在两条同样看似不言自明的理性公理之间做出痛苦抉择。',
            'One-boxers famously ask two-boxers: "If you’re so smart, why ain’t you rich?"—since in repeated trials with an accurate predictor, one-boxers walk away millionaires while two-boxers walk away with only $1,000.',
            '据 SEP《Causal Decision Theory》§1'
          ]
        ]
      },
      {
        id: 3,
        tabLabel: '③ 临界阈值计算：预测者要多准，一盒派才划算？',
        instructionTitle: '③ 调节预测者的预测准确率 p 与透明盒 A 的诱惑金额 · 寻找证据决策论（EDT）与因果决策论（CDT）分道扬镳的精确数学阈值',
        sliders: [
          { key: 'predictorAcc', label: '超级预测者的预测准确率 p', min: 50, max: 100, step: 1, defaultValue: 90, unit: '%' },
          { key: 'boxAThousands', label: '透明盒 A 中的确定金额（千美元）', min: 1, max: 500, step: 10, defaultValue: 1, unit: 'K' }
        ],
        mappings: [
          [
            '将“预测者准确率 p”调至 50%（如同抛硬币瞎猜）：观察此时无论 EDT 还是 CDT 都一致推荐“拿两个盒子”！',
            '在证据决策论（EDT）的计算中，一盒派的期望收益是 p × $1,000,000，两盒派的期望收益是 (1 - p) × $1,000,000 + 盒A金额；当预测者准确率退化为随机猜测（p = 50%）时，你的选择不再提供任何关于盒 B 的统计证据，EDT 与 CDT 的建议便完全重合（都拿两盒）。',
            'When the predictor is no better than chance (p = 0.5), one’s choice carries no evidential weight about the contents of Box B, and both EDT and CDT agree on taking both boxes.',
            '据 SEP《Causal Decision Theory》§1'
          ],
          [
            '调节“透明盒 A 金额”与“预测者准确率 p”，使 EDT 期望差跨越平衡零点',
            '纽康悖论并非孤立的科幻谜题，它在现实中与“医学基因决定的吸烟悖论（所罗门病）”以及与自己镜像博弈的“双生子囚徒困境”具有完全同构的数学结构。',
            'Newcomb’s problem is structurally isomorphic to the Twin Prisoner’s Dilemma and medical common-cause decision problems (such as Fisher’s smoking-gene hypothesis).',
            '据 SEP《Causal Decision Theory》§2'
          ]
        ]
      }
    ]
  },
  {
    id: 82,
    slug: 'minest_prisoner_dilemma',
    title: '囚徒困境',
    philosopher: '梅里尔·弗勒德 / 德雷舍 / 塔克 / 阿克塞尔罗德',
    concept: '严格占优策略、纳什均衡 vs 帕累托最优、重复博弈中的“一报还一报（Tit-for-Tat）”',
    categoryGroup: '五、科学哲学、数学哲学与思想实验（77–86）',
    tags: ['伦理学', '政治哲学', '逻辑', '社会'],
    playSummary: '操作双方合作或背叛策略，观察收益结构',
    levelsSummary: '① 单次博弈收益矩阵（为什么理性算计导向双输？） · ② 调整背叛诱惑与惩罚参数 · ③ 重复囚徒困境锦标赛（一报还一报）',
    source: '塔克 1950 / 阿克塞尔罗德《合作的进化》（据 SEP《Prisoner’s Dilemma》转引）',
    quoteCount: 6,
    thumbType: 'prisoner',
    coreQuestion: '明明两个人都保持沉默（合作）各判 1 年是对双方总体最好的结果，为什么两个绝顶精明的理性人各自按自身利益最大化算计后，却必然双双选择招供（背叛）而各坐 5 年牢？',
    boundaryNote: '囚徒困境揭示了“个体理性（严格占优策略导向的纳什均衡）”与“集体理性（帕累托最优）”之间的深刻裂痕，也是霍布斯自然状态、公地悲剧、军备竞赛与气候谈判的核心博弈模型。',
    stages: [
      {
        id: 1,
        tabLabel: '① 单次囚徒困境：个体理性 vs 集体理性',
        instructionTitle: '① 切换囚徒 A 与囚徒 B 的策略 · 比较（合作, 合作）、（背叛, 合作）、（合作, 背叛）与（背叛, 背叛）四个象限的刑期与收益，看为什么“背叛”是严格占优策略',
        choices: [
          {
            key: 'playerAMove',
            label: '你的选择（囚徒 A）',
            defaultValue: 'cooperate',
            options: [
              { value: 'cooperate', label: '🤝 保持沉默 / 合作 (Cooperate)' },
              { value: 'defect', label: '🗡 招供检举 / 背叛 (Defect)' }
            ]
          },
          {
            key: 'playerBMove',
            label: '同伙的选择（囚徒 B）',
            defaultValue: 'cooperate',
            options: [
              { value: 'cooperate', label: '🤝 保持沉默 / 合作 (Cooperate)' },
              { value: 'defect', label: '🗡 招供检举 / 背叛 (Defect)' }
            ]
          }
        ],
        mappings: [
          [
            '固定囚徒 B 为“合作”时对比 A 的两个选择（背叛得 0 年 > 合作得 1 年）；再固定 B 为“背叛”时对比 A 的两个选择（背叛得 5 年 > 合作得 10 年）：证明“背叛”在任何情况下都对个人更有利',
            '在单次囚徒困境中，无论对方选择合作还是背叛，你自己选择“背叛（招供）”所得的结果都严格优于选择“合作（沉默）”——因此“背叛”是严格占优策略（Strictly Dominant Strategy）。',
            'In the Prisoner’s Dilemma, Defect strictly dominates Cooperate for both players: regardless of what the other player does, each player gets a higher payoff by defecting than by cooperating.',
            '据 SEP《Prisoner’s Dilemma》§1'
          ],
          [
            '将双方都设为“背叛（Defect, Defect）”：观察唯一的纳什均衡（各判 5 年）恰恰比双方都合作（各判 1 年）更糟糕！',
            '当两个理性人都采取各自的严格占优策略（背叛，背叛）时，他们便落入了唯一的“纳什均衡”；然而这一均衡结果对双方而言，却都比双方共同采取被占优策略（合作，合作）要更糟——唯一的纳什均衡是帕累托次优的（Pareto-inefficient）。',
            'When both players play their dominant strategy (Defect, Defect), the outcome is the unique Nash equilibrium, yet it is Pareto-inferior to mutual cooperation (Cooperate, Cooperate).',
            '据 SEP《Prisoner’s Dilemma》§1'
          ]
        ]
      },
      {
        id: 2,
        tabLabel: '② 收益结构不等式（T > R > P > S）',
        instructionTitle: '② 调节背叛诱惑 T、合作奖励 R、双叛惩罚 P 与受骗苦果 S（或引入霍布斯契约罚金） · 观察何时困境成立、何时合作变为占优均衡',
        sliders: [
          { key: 'temptationT', label: '单方背叛诱惑收益 T (Temptation)', min: 2, max: 10, step: 1, defaultValue: 5, unit: ' 分' },
          { key: 'rewardR', label: '双方合作奖励收益 R (Reward)', min: 2, max: 8, step: 1, defaultValue: 3, unit: ' 分' },
          { key: 'contractPenalty', label: '外部契约/声誉对背叛者的惩罚扣分', min: 0, max: 6, step: 1, defaultValue: 0, unit: ' 分' }
        ],
        mappings: [
          [
            '保持契约惩罚为 0 且 T > R > P > S（如 T=5, R=3, P=1, S=0）：验证囚徒困境成立的严格条件',
            '一个对称双人博弈构成囚徒困境的充要条件是收益满足不等式：T（单方背叛诱惑）> R（双方合作奖励）> P（双方背叛惩罚）> S（单方合作受骗者收益）；在重复博弈中通常还要求 2R > T + S。',
            'A game is a Prisoner’s Dilemma when the payoffs satisfy the ordering T > R > P > S (Temptation > Reward > Punishment > Sucker’s payoff).',
            '据 SEP《Prisoner’s Dilemma》§1'
          ],
          [
            '将“外部契约/声誉对背叛者的惩罚扣分”拉高至 3 分以上：使净诱惑 (T - 惩罚) < R，观察纳什均衡从（背叛, 背叛）跃迁至（合作, 合作）！',
            '这也从博弈论上解释了霍布斯社会契约与制度规范的作用：通过引入对违约背叛行为的制度惩罚或声誉损失，改变了收益矩阵中的激励不等式（使 T - 罚金 < R），从而将“相互合作”转化为新的理性纳什均衡。',
            'Social institutions, norms, and enforceable contracts resolve the dilemma by altering the effective payoff matrix so that defection is no longer the dominant strategy.',
            '据 SEP《Prisoner’s Dilemma》§11'
          ]
        ]
      },
      {
        id: 3,
        tabLabel: '③ 重复博弈与“一报还一报（Tit-for-Tat）”',
        instructionTitle: '③ 阿克塞尔罗德计算机锦标赛 · 选择你的长期博弈策略（一报还一报、永远合作、永远背叛、记仇者），运行 20 轮重复博弈对局',
        choices: [
          {
            key: 'myStrategy',
            label: '你的重复博弈策略',
            defaultValue: 'tit_for_tat',
            options: [
              { value: 'tit_for_tat', label: '🏆 一报还一报（Tit-for-Tat）：第 1 轮先善意合作；之后每一轮都复刻对手上一轮的动作' },
              { value: 'always_defect', label: '🗡 永远背叛（Always Defect）：每一轮都无条件背叛' },
              { value: 'always_coop', label: '🕊 无条件老好人（Always Cooperate）：哪怕一直被背叛也永远合作' },
              { value: 'grim_trigger', label: '⚡ 冷酷触发（Grim Trigger）：先合作，但只要对手背叛过一次就永世报复' }
            ]
          },
          {
            key: 'oppStrategy',
            label: '对手的重复博弈策略',
            defaultValue: 'tit_for_tat',
            options: [
              { value: 'tit_for_tat', label: '对手：一报还一报（Tit-for-Tat）' },
              { value: 'prober_opportunist', label: '对手：试探投机者（第 3、8 轮尝试背叛占便宜，若遭到报复则乖乖恢复合作）' },
              { value: 'always_defect', label: '对手：永远背叛（Always Defect）' }
            ]
          }
        ],
        mappings: [
          [
            '选择“一报还一报（Tit-for-Tat）”迎战“试探投机者”或“一报还一报”：观察总得分远超“永远背叛”',
            '当博弈在“未来的阴影（Shadow of the Future）”下无限期重复进行时，阿纳托尔·拉波波特提交的最简程序“一报还一报（Tit-for-Tat：第一轮合作，此后照搬对手上一轮的选择）”在阿克塞尔罗德的锦标赛中击败了所有复杂狡诈的程序，夺得总冠军。',
            'In Axelrod’s iterated Prisoner’s Dilemma tournaments, the simplest program—Anatol Rapoport’s "Tit-for-Tat", which cooperates on the first move and then does whatever the other player did on the previous move—won the highest cumulative score.',
            '据 SEP《Prisoner’s Dilemma》§8（Axelrod 1984）'
          ],
          [
            '在四种策略间切换对比：总结“一报还一报”成功的四大品质（善意、可激怒、宽容、清晰）',
            '阿克塞尔罗德总结出在进化与重复博弈中促成合作涌现的四个秘诀：第一是“善意（Nice，绝不率先背叛）”，第二是“可激怒/报复性（Retaliatory，遇背叛立即回击，不让投机者得逞）”，第三是“宽容（Forgiving，一旦对方改过合作就立刻恢复合作，不陷入无休止互害）”，第四是“清晰（Clear，让对手一眼看懂规律）”。',
            'Axelrod attributed Tit-for-Tat’s success to four properties: being nice (never the first to defect), retaliatory (immediately punishing defection), forgiving (returning to cooperation once the opponent does), and clear.',
            '据 SEP《Prisoner’s Dilemma》§8'
          ]
        ]
      }
    ]
  },
  {
    id: 83,
    slug: 'minest_zeno',
    title: '芝诺 · 运动悖论',
    philosopher: '埃利亚的芝诺',
    concept: '二分法悖论（Dichotomy）、阿基里斯与乌龟、飞矢不动与无穷级数收敛',
    categoryGroup: '五、科学哲学、数学哲学与思想实验（77–86）',
    tags: ['形而上学', '数学哲学', '逻辑', '古希腊哲学'],
    playSummary: '将运动路径无限分割，比较数学极限与哲学论证',
    levelsSummary: '① 二分法（1/2 + 1/4 + 1/8 + ...） · ② 阿基里斯追乌龟 · ③ 飞矢不动（每一瞬间占据自身等大空间）',
    source: '亚里士多德《物理学》第六卷第 9 章（据 SEP《Zeno’s Paradoxes》转引）',
    quoteCount: 6,
    thumbType: 'zeno',
    coreQuestion: '要走完 1 米的路程，必须先走完 1/2 米，再走完剩下的 1/4 米、1/8 米、1/16 米……既然在有限时间内需要跨越无穷多个分段（完成无穷多次任务 Super-task），运动究竟是怎么抵达终点的？',
    boundaryNote: '芝诺提出运动悖论是为了捍卫他的老师巴门尼德“存在是一、运动与多只是感官幻象”的学说；直到微积分与极限理论建立无穷几何级数求和 $\\sum_{n=1}^{\\infty} (1/2)^n = 1$ 后，数学层面才给出严格收敛证明，而关于“物理时空是否无限可分”与“超任务（Supertask）”的哲学争论延续至今。',
    stages: [
      {
        id: 1,
        tabLabel: '① 二分法悖论（无限折半分割）',
        instructionTitle: '① 点击“将剩余路程再折半分割” · 观察路径被切分为 1/2、1/4、1/8、1/16……比较“分割段数 n → ∞”与“累计总路程和总耗时收敛于有限值 1”',
        buttons: [
          { key: 'bisectStep', label: '✂ 将剩余路程再折半推进一段 (1/2ⁿ)', accent: 'amber' },
          { key: 'bisectMany', label: '⚡ 连续分割推进 10 步（观察极限收敛）', accent: 'blue' }
        ],
        mappings: [
          [
            '点击“将剩余路程再折半推进一段”至少 3 次：观察每前进一步，离终点都还剩下一半的路要走（1/2 → 3/4 → 7/8 → 15/16...）',
            '芝诺关于运动的第一个论证（二分法）认为运动是不可能的，因为运动着的事物在到达目的地之前，必须先到达路程的一半，而在到达那一半之前又必须先到达一半的一半，如此以至无穷。',
            'The first asserts the non-existence of motion on the ground that that which is in locomotion must arrive at the half-way stage before it arrives at the goal.',
            '亚里士多德《物理学》VI.9, 239b11（据 SEP《Zeno’s Paradoxes》§3.1 转引）'
          ],
          [
            '点击“连续分割推进 10 步”：观察画布下方的无穷级数面积图与时间轴——虽然段数是无穷的，但每一段所需的时间也在同步折半（1/2 + 1/4 + 1/8 + ... = 1），总耗时严格收敛于有限常数！',
            '芝诺假设“跨越无穷多个空间分段必然需要无穷长的时间”；然而在数学上，无穷多个正数之和完全可以收敛于一个有限的极限：$\\frac{1}{2} + \\frac{1}{4} + \\frac{1}{8} + \\dots + \\frac{1}{2^n} + \\dots = 1$。',
            'While there are infinitely many spatial sub-intervals to traverse, the time required to traverse each successive interval decreases geometrically, so the infinite series of times converges to a finite sum.',
            '据 SEP《Zeno’s Paradoxes》§3.1'
          ]
        ]
      },
      {
        id: 2,
        tabLabel: '② 阿基里斯与乌龟',
        instructionTitle: '② 最善跑的英雄追不上慢乌龟？ · 点击“推进到乌龟上一刻的位置”，观察芝诺如何通过只截取追赶发生前的离散时间点制造“永远差一点”的视角障眼法',
        sliders: [
          { key: 'speedRatio', label: '阿基里斯与乌龟的速度比 (V_阿 : V_龟)', min: 2, max: 10, step: 1, defaultValue: 5, unit: ' : 1' }
        ],
        buttons: [
          { key: 'achillesStep', label: '🏃 让阿基里斯跑到乌龟刚才所在的位置 (tₙ → tₙ₊₁)', accent: 'green' },
          { key: 'continuousPass', label: '⏱ 切换连续时间轴：直接越过收敛时刻 T_catch', accent: 'purple' }
        ],
        mappings: [
          [
            '点击“让阿基里斯跑到乌龟刚才所在的位置” 3 次以上：每次阿基里斯跑到乌龟的旧位置 xₙ，乌龟又往前爬了一小段到 xₙ₊₁',
            '第二个论证就是所谓“阿基里斯”：跑得最慢的物体永远不会被跑得最快的物体追上；因为追赶者首先必须到达被追者出发的那个点，而在追赶者跑完这段距离的时间里，跑得慢的那一方必然又向前移动了一小段，因而永远领先在前面。',
            'The second is the so-called "Achilles", and it amounts to this, that in a race the quickest runner can never overtake the slowest, since the pursuer must first reach the point whence the pursued started, so that the slower must always hold a lead.',
            '亚里士多德《物理学》VI.9, 239b14（据 SEP《Zeno’s Paradoxes》§3.2 转引）'
          ],
          [
            '点击“切换连续时间轴：直接越过收敛时刻 T_catch”：揭穿芝诺的无穷步骤全部被压缩在短短的有限追平时刻 $T_{catch} = \\frac{d_0}{v_A - v_T}$ 之内！',
            '芝诺的巧妙叙述像一台慢动作摄像机，把镜头严丝合缝地限制在追上乌龟那个临界时刻 $T_{catch}$ 之前的无穷个收敛瞬间（$t_1, t_2, t_3 \\dots < T_{catch}$）；一旦让时间走过有限的 $T_{catch}$，阿基里斯便毫不费力地超越了乌龟。',
            'Zeno’s description partitions only the finite time interval prior to the exact moment of overtaking into infinitely many diminishing sub-intervals.',
            '据 SEP《Zeno’s Paradoxes》§3.2'
          ]
        ]
      },
      {
        id: 3,
        tabLabel: '③ 飞矢不动（Flying Arrow）',
        instructionTitle: '③ 在没有持续时间的“纯粹瞬间（Instant t）”里，箭在动吗？ · 切换“瞬间定格快照（Δt = 0）”与“时间邻域函数 dx/dt”，辨析“在某一瞬运动”的真实含义',
        choices: [
          {
            key: 'arrowFrame',
            label: '考察飞行中箭矢的时间切片方式',
            defaultValue: 'instant_freeze',
            options: [
              { value: 'instant_freeze', label: '芝诺的纯粹无长瞬间（Δt = 0）：在每一个单独的“现在”，箭只占据与自身完全等大的空间（与静止的箭毫无区别！）' },
              { value: 'calculus_limit', label: '微积分与邻域变化率（v = lim Δx/Δt）：运动不是单个零长瞬间内的孤立静态属性，而是不同瞬间具有不同位置的函数关系' }
            ]
          }
        ],
        mappings: [
          [
            '查看“芝诺的纯粹无长瞬间（Δt = 0）”：观察如果时间只是由一个个静止的“现在”拼成的，为什么每一帧都静止却能合成运动？',
            '第三个论证就是所谓“飞矢是静止的”：如果任何事物在占据一个与自身相等的空间时都是静止的，而运动着的事物在每一个“现在（瞬间）”都总是占据着一个与自身相等的空间，那么飞行的箭就是不动的。',
            'The third is that already given above, to the effect that the flying arrow is at rest, which result follows from the assumption that time is composed of moments.',
            '亚里士多德《物理学》VI.9, 239b30（据 SEP《Zeno’s Paradoxes》§3.3 转引）'
          ],
          [
            '切换到“微积分与邻域变化率（v = lim Δx/Δt）”：点亮罗素与现代数学的回应',
            '在现代数学（魏尔斯特拉斯与罗素的“在-在”运动理论）中，“在时刻 t 处于运动状态”并不意味着在零长度的孤立瞬间 t 内部发生了位移，而是意味着在包含 t 的任意微小时间邻域内，不同时刻对应着不同的空间位置（即导数 $\\lim_{\\Delta t \\to 0} \\frac{x(t+\\Delta t)-x(t)}{\\Delta t} \\neq 0$）。',
            'Motion consists merely in the fact that bodies are sometimes in one place and sometimes in another, and that they are at intermediate places at intermediate times.',
            '罗素《数学原理》/ 据 SEP《Zeno’s Paradoxes》§3.3 转引'
          ]
        ]
      }
    ]
  },
  {
    id: 84,
    slug: 'minest_hilbert_hotel',
    title: '希尔伯特 · 无限旅馆悖论',
    philosopher: '大卫·希尔伯特 / 格奥尔格·康托尔',
    concept: '可数无穷（$\\aleph_0$）、双射（一一对应）与超穷基数算术',
    categoryGroup: '五、科学哲学、数学哲学与思想实验（77–86）',
    tags: ['数学哲学', '逻辑', '形而上学'],
    playSummary: '移动无限编号的住客，探索可数无限的性质',
    levelsSummary: '① 客满后再来 1 位新客人（n → n+1） · ② 来了一辆坐着无穷多位乘客的大巴（n → 2n） · ③ 无穷多辆无限大巴与不可数实数',
    source: '希尔伯特 1924《论无限》讲演 / 伽莫夫《从一到无穷大》（据 SEP《Infinity》转引）',
    quoteCount: 6,
    thumbType: 'hotel',
    coreQuestion: '一家只有 100 间房的有限旅馆一旦“客满”就再也住不下新客人了；为什么一家拥有无穷多间房（1号、2号、3号……直至无穷）的“无限旅馆”，在已经全部住满的情况下，居然还能轻松腾出房间接待 1 位、100 位甚至无穷多位新客人？',
    boundaryNote: '希尔伯特在 1924 年哥廷根讲演中构造这一思想实验，直观展示了康托尔超穷集合论的核心性质：一个无穷集合可以与它自己的真子集建立严格的一一对应（双射），即 $\\aleph_0 + 1 = \\aleph_0$ 且 $\\aleph_0 + \\aleph_0 = \\aleph_0$。',
    stages: [
      {
        id: 1,
        tabLabel: '① 客满后再来 1 位（或 k 位）新客人：n → n + 1',
        instructionTitle: '① 广播全体老住客向右平移 · 当所有无穷多间房（#1, #2, #3, ...）全部住满时，点击“广播全体住客搬往 n+1 号房”，看 1 号房如何空出来',
        sliders: [
          { key: 'newGuestsK', label: '新抵达的散客人数 k', min: 1, max: 5, step: 1, defaultValue: 1, unit: ' 人' }
        ],
        buttons: [
          { key: 'shiftPlusK', label: '📢 广播指令：请第 n 号房住客全部搬往第 (n + k) 号房！', accent: 'amber' }
        ],
        mappings: [
          [
            '点击“广播指令：请第 n 号房住客全部搬往第 (n + k) 号房”：观察 1 号房住客搬入 1+k 号、2 号搬入 2+k 号……前 k 间房瞬间腾空给新客人，且没有任何老住客流落街头！',
            '在有限旅馆里，“客满”和“无法再接纳新客人”是同一回事；但在希尔伯特的无限旅馆（拥有可数无穷 $\\aleph_0$ 间客房且已全部住满）里，经理只需通过广播让第 n 号房的住客全部搬到第 n+1 号房（1→2，2→3，3→4……），1 号房就立刻空出来留给新来的客人了！',
            'In Hilbert’s Grand Hotel with countably infinitely many rooms (all occupied), a new guest can be accommodated by simultaneously moving the guest in room n to room n + 1 for all n, leaving room 1 free. Thus ℵ₀ + 1 = ℵ₀.',
            '希尔伯特 1924 讲演（据 SEP《Infinity》§3 转引）'
          ],
          [
            '将“新抵达的散客人数 k”调至 3 或 5 并再次点击广播：体会 $\\aleph_0 + k = \\aleph_0$',
            '为什么没有“最后那间房的客人”被挤出去？因为自然数序列 $1, 2, 3, \\dots, n, \\dots$ 根本没有“最后一个数”——对任意自然数 $n$，它的后继 $n+k$ 都依然是一个合法存在的房间号。',
            'Because there is no "last room" in a countably infinite sequence of natural numbers, every existing guest n has a well-defined destination room n + k.',
            '据 SEP《Infinity》§3'
          ]
        ]
      },
      {
        id: 2,
        tabLabel: '② 来了坐满无穷多位乘客的无限大巴：n → 2n',
        instructionTitle: '② 把无穷腾出一半无穷 · 当一辆载有可数无穷（$\\aleph_0$）名新乘客的旅游大巴开到客满的旅馆门前时，点击“请第 n 号房住客搬往第 2n 号偶数房”',
        buttons: [
          { key: 'shiftEven2N', label: '📢 广播指令：请第 n 号房老住客全部搬往第 2n 号（偶数）房！', accent: 'blue' }
        ],
        mappings: [
          [
            '点击“请第 n 号房老住客全部搬往第 2n 号（偶数）房”：观察 1→2、2→4、3→6、4→8……所有奇数号房（1, 3, 5, 7, ... 共无穷多间！）瞬间全部腾空，刚好安排无穷多位大巴新乘客入住！',
            '哪怕门外开来一辆坐着可数无穷（$\\aleph_0$）位新乘客的无限大巴，经理也毫不惊慌：他只需请第 $n$ 号房的老住客搬到第 $2n$ 号房（即全部住进偶数号房间），于是所有的奇数号房间（1号、3号、5号、7号……共有无穷多间）就全部空出来了！',
            'To accommodate a countably infinite busload of new guests, the manager moves each current guest from room n to room 2n (the even-numbered rooms), leaving all infinitely many odd-numbered rooms (2k - 1) vacant for the new guests. Thus ℵ₀ + ℵ₀ = ℵ₀.',
            '据 SEP《Infinity》§3（Hilbert’s Hotel）'
          ],
          [
            '观察画布中的一一对应双射连线：偶数集（或奇数集）虽然只是全体自然数的“真子集”，却与全体自然数一样多！',
            '这打破了欧几里得针对有限量提出的古老公理“整体大于部分”：戴德金与康托尔指出，“能够与自己的一个真子集建立一一对应（双射）”，恰恰是“无穷集合”区别于一切有限集合的本质定义！',
            'A set is infinite (in the Dedekind-Cantor sense) if and only if it can be put into a one-to-one correspondence (bijection) with a proper subset of itself.',
            '据 SEP《Infinity》§3'
          ]
        ]
      },
      {
        id: 3,
        tabLabel: '③ 无穷多辆无限大巴 vs 康托尔不可数对角线',
        instructionTitle: '③ 可数无穷的极限边界 · 切换“无穷多辆无限大巴（$\\aleph_0 \\times \\aleph_0 = \\aleph_0$，仍可住下）”与“全体实数客人（$2^{\\aleph_0}$，康托尔对角线法证明绝对住不下！）”',
        choices: [
          {
            key: 'infinityLevel',
            label: '抵达旅馆门前的终极客流挑战',
            defaultValue: 'countable_buses',
            options: [
              { value: 'countable_buses', label: '挑战 A：开来无穷多辆（$\\aleph_0$ 辆）各自坐满无穷多位乘客的大巴 → 用质数幂次法 $2^i 3^j$ 或对角蛇形编号，依然全部住得下！' },
              { value: 'uncountable_reals', label: '挑战 B：0 到 1 之间的全体无限不循环小数（实数连续统 $c = 2^{\\aleph_0}$）要求入住 → 康托尔对角线法证明：必然有无穷多实数永远分不到房间！' }
            ]
          }
        ],
        mappings: [
          [
            '查看“挑战 A：无穷多辆无限大巴”：观察二维网格对角蛇形路径（或质数幂次编码 $2^{\\text{车号}} \\times 3^{\\text{座号}}$）如何把二维无穷压平为一维自然数房间号',
            '甚至当可数无穷多辆（$\\aleph_0$ 辆）各自载有可数无穷位乘客的大巴同时抵达时，经理仍可让原住客住进 $2^n$ 号房，第 $i$ 辆车第 $j$ 号座位的乘客住进 $p_i^j$（第 $i$ 个质数的 $j$ 次幂）号房——因为 $\\aleph_0 \\times \\aleph_0 = \\aleph_0$（有理数与自然数一样多）。',
            'Even a countably infinite fleet of infinitely full buses can be accommodated using prime factorization (2^i · 3^j) or Cantor’s pairing function, showing that ℵ₀ × ℵ₀ = ℵ₀.',
            '据 SEP《Infinity》§3'
          ],
          [
            '切换到“挑战 B：0 到 1 之间的全体实数客人”：观察康托尔对角线（Cantor’s Diagonal Argument）构造出一个在第 n 位上与第 n 号房客人小数不同的新实数，证明“无穷也有大小等级之分”！',
            '但无限旅馆并非无所不能：如果来的是 [0, 1] 区间内的全体实数（不可数无穷 $2^{\\aleph_0}$），康托尔对角线论证表明，无论经理如何安排房间列表，只要把第 1 号房客人的第 1 位小数改掉、第 2 号房的第 2 位小数改掉……就能构造出一个绝不在任何房间里的实数客人——无穷本身也有严格的高低无穷基数等级！',
            'Cantor’s diagonal argument proves that the set of real numbers is uncountably infinite (2^ℵ₀ > ℵ₀): even Hilbert’s Grand Hotel cannot assign a natural-number room to every real number.',
            '据 SEP《Infinity》§3.2（Cantor’s Theorem）'
          ]
        ]
      }
    ]
  },
  {
    id: 85,
    slug: 'minest_monty_hall',
    title: '蒙提霍尔问题',
    philosopher: '史蒂夫·塞尔文 / 玛丽莲·沃斯·莎凡特',
    concept: '三门问题、条件概率、知情主持人的信息过滤与大数定律模拟',
    categoryGroup: '五、科学哲学、数学哲学与思想实验（77–86）',
    tags: ['认识论', '逻辑', '数学哲学'],
    playSummary: '选择三扇门，主持人打开一扇后决定是否换门，运行重复实验',
    levelsSummary: '① 亲手玩三扇门（换门 vs 不换门） · ② 批量运行 200 次蒙特卡洛实验 · ③ 扩展到 100 扇门的直觉顿悟',
    source: 'Selvin 1975 / Marilyn vos Savant《Parade》专栏 1990',
    quoteCount: 6,
    thumbType: 'monty',
    coreQuestion: '三扇门后面有一辆跑车和两只山羊。你先选了 1 号门；知道门后情况的主持人特意打开了剩下的门中藏有山羊的一扇（比如 3 号门），然后问你：“你要改选 2 号门吗？”为什么绝大多数学者和大众直觉认为“剩下两扇门各 50%，换不换都一样”，而真实数学概率却是“换门胜率 2/3（66.7%），不换只有 1/3（33.3%）”？',
    boundaryNote: '关键前提在于：**主持人知道车在哪里**，且他**必定会打开一扇你没选过的山羊门**。正是主持人的“知情排除”把原本属于另外两扇门的总概率（2/3）全部浓缩到了剩下的那一扇未开门上！',
    stages: [
      {
        id: 1,
        tabLabel: '① 亲手开启三扇门与蒙特卡洛实验',
        instructionTitle: '① 选择你的第一扇门并决定“换门”还是“坚守不换” · 点击“运行一局游戏”或“高速模拟 200 局”，对比换门与不换门的实际累计中奖率',
        choices: [
          {
            key: 'initialDoor',
            label: '你的第一步：选择哪一扇门？',
            defaultValue: 'door1',
            options: [
              { value: 'door1', label: '🚪 先选 1 号门（中车先验概率 1/3）' },
              { value: 'door2', label: '🚪 先选 2 号门（中车先验概率 1/3）' },
              { value: 'door3', label: '🚪 先选 3 号门（中车先验概率 1/3）' }
            ]
          },
          {
            key: 'switchStrategy',
            label: '主持人打开一扇山羊门后，你的决策策略',
            defaultValue: 'always_switch',
            options: [
              { value: 'always_switch', label: '🔄 坚决换门（Switch to the other closed door）' },
              { value: 'always_stay', label: '🔒 坚守原门不换（Stay with initial choice）' }
            ]
          }
        ],
        buttons: [
          { key: 'playOneRound', label: '🎲 现场开奖玩 1 局', accent: 'amber' },
          { key: 'simulate200', label: '🚀 蒙特卡洛高速模拟 200 局（检验大数定律）', accent: 'green' }
        ],
        mappings: [
          [
            '点击“现场开奖玩 1 局”至少 2 次（分别体验“坚决换门”与“坚守不换”）',
            '当你最初从三扇门中任选一扇时，你选中的那扇门后有跑车的概率是 1/3，而跑车在“另外两扇门之中”的总概率是 2/3。当知情的主持人刻意替你排除了另外两扇门中的一扇山羊门后，这 2/3 的概率并没有消失，而是全部集中到了剩下的那一扇门上！',
            'Yes; you should switch. The first door has a 1/3 chance of winning, but the second door has a 2/3 chance.',
            '玛丽莲·沃斯·莎凡特《Parade》杂志专栏（1990 年 9 月 9 日）'
          ],
          [
            '点击“蒙特卡洛高速模拟 200 局”：观察大数定律下“换门胜率”稳定收敛在 66.7%（2/3）附近，而“不换胜率”稳定在 33.3%（1/3）附近',
            '当时成千上万名读者（包括许多数学博士）写信抗议说“只剩两扇门，概率当然是 1/2 对 1/2”；但通过计算机或课堂进行几百次重复实验后，经验频率铁证如山地收敛于：换门赢 2/3，不换赢 1/3。',
            'In repeated trials, switching doors wins the car approximately 2/3 (66.7%) of the time, whereas staying with the initial door wins only 1/3 (33.3%) of the time.',
            '塞尔文《美国统计学家》1975 / 沃斯·莎凡特 1990'
          ]
        ]
      },
      {
        id: 2,
        tabLabel: '② 穷举三种等可能分支树（为什么换门只会在你一开始就猜中车时才输？）',
        instructionTitle: '② 展开完整概率树 · 依次查看跑车藏在 1 号、2 号、3 号门的三种等可能情况（各 1/3），看“换门策略”在其中几种情况下稳赢',
        choices: [
          {
            key: 'treeBranch',
            label: '假定你一开始选了 1 号门，穷举全部 3 种等可能真相（各占 1/3）',
            defaultValue: 'show_all_three',
            options: [
              { value: 'show_all_three', label: '全景对比 3 条等权重分支：换门 2 胜 1 负（2/3），不换 1 胜 2 负（1/3）' },
              { value: 'car_in_1', label: '分支 ①（概率 1/3）：车真在你选的 1 号门 → 换门会输，不换会赢' },
              { value: 'car_in_2', label: '分支 ②（概率 1/3）：车在 2 号门（你起初选了羊）→ 主持人必开 3 号羊门，换门必赢跑车！' },
              { value: 'car_in_3', label: '分支 ③（概率 1/3）：车在 3 号门（你起初选了羊）→ 主持人必开 2 号羊门，换门必赢跑车！' }
            ]
          }
        ],
        mappings: [
          [
            '切换查看“分支 ②”与“分支 ③”：恍然大悟——只要你第一步选中的是山羊（高达 2/3 的概率！），知情主持人就等于被迫帮你把另一只山羊排除了，此时换门 100% 拿到跑车！',
            '换门策略的奥秘可以用一句话看穿：如果你采取“坚决换门”策略，那么**只要你第一步选中的是山羊（这有 2/3 的概率），你换门就必定赢得跑车**；只有当你第一步就幸运猜中跑车（只有 1/3 的概率）时，换门才会输！',
            'If you switch, you win whenever your initial choice was a goat (which happens with probability 2/3), and you lose only when your initial choice was the car (probability 1/3).',
            '沃斯·莎凡特 1990 穷举表解释'
          ],
          [
            '对比“知情主持人（Monty Knows）”与“盲开主持人（Monty Ignorant，随机乱开一扇碰巧是羊）”的条件概率差异',
            '注意：这 2/3 的胜率完全来自“主持人知道车在哪里且绝不会打开车门”这一意向性信息过滤规则；假如主持人自己也不知道车在哪，只是不小心绊倒随机撞开了 3 号门且碰巧里面是只羊，那么剩下两扇门的条件概率才会真的变成 1/2 对 1/2！',
            'The 2/3 probability depends critically on the host’s knowledge and intentional rule never to reveal the car.',
            'Rosenthal 2008《Monty Hall, Monty Fall, Monty Crawl》'
          ]
        ]
      },
      {
        id: 3,
        tabLabel: '③ 100 扇门放大镜：一秒击碎“50% 对 50%”的直觉错觉',
        instructionTitle: '③ 将总门数从 3 扇逐步拉大到 100 扇 · 当有 100 扇门，你选了 1 号门（中奖率 1%），知情主持人一口气打开了其余 98 扇全都是山羊的门，只留下 73 号门没开——你还觉得 1 号门和 73 号门是“各占 50%”吗？',
        sliders: [
          { key: 'totalDoorsN', label: '游戏总门数 N（主持人会为你排除 N-2 扇山羊门）', min: 3, max: 100, step: 1, defaultValue: 3, unit: ' 扇门' }
        ],
        mappings: [
          [
            '将“游戏总门数 N”从 3 扇一直拖到 100 扇：观察不换门的胜率跌至 1/100（1%），而换向主持人刻意留下的那唯一一扇门的胜率飙升至 99/100（99%）！',
            '为了彻底打破“只剩两扇门所以必然五五开”的顽固直觉，请设想有 100 扇门：你选了 1 号门（只有 1/100 的可能猜中），然后全知的主持人走过去，乒乒乓乓打开了其余 99 扇门中的 98 扇山羊门，唯独绕开了 73 号门没开。此时，你是坚守只有 1% 胜率的 1 号门，还是换到浓缩了 99% 概率的 73 号门？',
            'Suppose there are a million doors, and you pick door #1. Then the host, who knows what’s behind the doors and will always avoid the one with the prize, opens all of them except door #777,777. You’d switch to that door pretty fast, wouldn’t you?',
            '玛丽莲·沃斯·莎凡特《Parade》专栏（百门/百万门类比）'
          ],
          [
            '观察画布上的概率浓缩漏斗：一般公式为“不换胜率 = $1/N$，换门胜率 = $(N-1)/N$”',
            '对于任意 $N$ 扇门的蒙提霍尔问题，当知情主持人排除掉其余 $N-2$ 扇空门后，坚守原门的获胜概率恒为 $\\frac{1}{N}$，而改换到剩余那扇门的获胜概率恒为 $\\frac{N-1}{N}$。',
            'For N doors where the informed host opens N - 2 losing doors, switching wins with probability (N - 1)/N.',
            'Selvin 1975 / vos Savant 1990'
          ]
        ]
      }
    ]
  },
  {
    id: 86,
    slug: 'minest_simpson_paradox',
    title: '辛普森悖论',
    philosopher: '爱德华·辛普森 / 尤尔 / 朱迪亚·珀尔',
    concept: '分组趋势与总体汇总趋势的反转、混杂变量（Confounder）与因果图模型',
    categoryGroup: '五、科学哲学、数学哲学与思想实验（77–86）',
    tags: ['科学哲学', '认识论', '逻辑', '数学哲学'],
    playSummary: '调整分组数据，观察总体趋势与分组趋势发生反转',
    levelsSummary: '① 新药在轻症组和重症组都更好，为何汇总后反而更差？ · ② 拖动分组样本权重触发趋势反转 · ③ 伯克利招生案与朱迪亚·珀尔因果图',
    source: 'Simpson 1951 / Pearl《因果论》（据 SEP《Simpson’s Paradox》转引）',
    quoteCount: 6,
    thumbType: 'simpson',
    coreQuestion: '有没有可能：新疗法 A 在“轻症患者组”里的治愈率高于旧疗法 B，在“重症患者组”里的治愈率也高于旧疗法 B；可是把两组患者数据加在一起算总治愈率时，新疗法 A 反而低于旧疗法 B？遇到这种情况，医生到底该不该用新疗法 A？',
    boundaryNote: '辛普森悖论不仅是一个算术加权平均现象（不等比例的分组样本与不同基线风险叠加），更是一个深刻的因果推理问题：朱迪亚·珀尔（Judea Pearl）证明，究竟该看“分组数据”还是看“汇总数据”，不能只看统计表格，而必须取决于背后的因果图结构（混杂变量 vs 中介变量）。',
    stages: [
      {
        id: 1,
        tabLabel: '① 医疗试验中的辛普森反转',
        instructionTitle: '① 调节新疗法 A 分到的“重症患者比例” · 观察：明明在轻症组（A: 93% > B: 87%）和重症组（A: 73% > B: 69%）中 A 都胜出，为什么当 A 组接收了太多重症病人时，A 的总体汇总治愈率反而输给了 B？',
        sliders: [
          { key: 'severeShareA', label: '新疗法 A 中被分配给“重症难治患者”的占比（混杂权重）', min: 10, max: 90, step: 5, defaultValue: 80, unit: '%' },
          { key: 'severeShareB', label: '旧疗法 B 中被分配给“重症难治患者”的占比', min: 10, max: 90, step: 5, defaultValue: 20, unit: '%' }
        ],
        mappings: [
          [
            '保持 A 组重症占比高（≥ 75%）、B 组重症占比低（≤ 25%）：观察画布中“轻症组 A > B”、“重症组 A > B”，但底部“总体汇总治愈率却是 A < B”的辛普森反转！',
            '辛普森悖论指的是这样一种反直觉的统计现象：在每一个单独的子群体（如轻症组与重症组）中都一致成立的关联或优势（新药 A > 旧药 B），当把各个子群体的数据合并汇总到总体时，该优势不仅可能消失，甚至会彻底反转为相反的方向（总体 A < B）！',
            'Simpson’s Paradox occurs when an association or inequality that holds within every single subpopulation (e.g., Treatment A outperforms B in both mild and severe cases) reverses direction when the subpopulations are aggregated into the total population.',
            '辛普森 1951（据 SEP《Simpson’s Paradox》§1 转引）'
          ],
          [
            '将 A 组与 B 组的“重症患者占比”调成相等（如均为 50% 就像随机双盲对照试验 RCT 那样）：观察辛普森悖论瞬间消失，总体治愈率恢复为 A > B！',
            '为什么会发生反转？因为“病情严重程度”是一个混杂变量（Confounder）：医生倾向于把最难治的重症病人都分给新疗法 A（重症本身基础死亡率高），而把容易治的轻症病人分给旧疗法 B；一旦通过随机分配使两组重症比例持平，悖论便立刻消解。',
            'The reversal is driven by an imbalance in the distribution of a confounding variable (severity of illness) across the treatment groups. In a randomized controlled trial where the proportions are equalized, the paradox disappears.',
            '据 SEP《Simpson’s Paradox》§2–3'
          ]
        ]
      },
      {
        id: 2,
        tabLabel: '② 连续向量与回归斜率反转（Yule-Simpson 几何直观）',
        instructionTitle: '② 拖动两个子群体散点云的中心位置 · 在二维散点图中观察：当每个子群体内部都是正斜率（↗）时，连接两个子群体中心的总体回归线如何翻转成负斜率（↘）',
        sliders: [
          { key: 'groupOffset', label: '子群体之间的基线位移差（群间混杂偏移）', min: -80, max: 80, step: 5, defaultValue: 60 }
        ],
        mappings: [
          [
            '将“子群体之间的基线位移差”推至 +45 以上：观察两条蓝绿分组趋势线均向上倾斜（正相关 ↗），而红色的总体汇总回归线却向下倾斜（负相关 ↘）！',
            '在连续数据与回归分析中，辛普森悖论表现为：在每一个分组内，自变量 X（如运动剂量）对因变量 Y（如健康指标）的回归斜率都是正的；但由于不同年龄组的基线位置存在巨大偏移，如果不按年龄分组而直接对全部散点拟合一条总回归线，斜率就会翻转为负！',
            'In continuous datasets, every subgroup may exhibit a positive regression slope between X and Y, while the aggregated dataset exhibits a negative regression slope due to between-group confounding.',
            '据 SEP《Simpson’s Paradox》§1.2'
          ],
          [
            '将“子群体之间的基线位移差”拉回到 0 附近：观察总体红线与分组蓝绿线重新同向对齐',
            '从向量几何上看，部分斜率（A₁/B₁ < C₁/D₁ 且 A₂/B₂ < C₂/D₂）之所以能加出反向的总体斜率（(A₁+A₂)/(B₁+B₂) > (C₁+C₂)/(D₁+D₂)），是因为向量加法的权重偏向了长度更长的那个分向量。',
            'Geometrically, vector addition in the plane allows two vectors each having a steeper slope than their counterparts to sum to a vector with a shallower slope if their magnitudes (sample weights) differ.',
            '据 SEP《Simpson’s Paradox》§1.1'
          ]
        ]
      },
      {
        id: 3,
        tabLabel: '③ 伯克利招生案与因果决策：到底该信“分组”还是信“总体”？',
        instructionTitle: '③ 朱迪亚·珀尔的因果裁决 · 对比“混杂变量（病情严重度 → 必须看分组）”与“中介变量（药物先降低血压再救命 → 必须看总体！）”，理解为何仅凭统计表无法做决定',
        choices: [
          {
            key: 'causalStory',
            label: '同一张辛普森数据表背后的三种不同因果结构（DAG）',
            defaultValue: 'confounder_case',
            options: [
              { value: 'confounder_case', label: '结构一（混杂变量 Z → X 且 Z → Y）：如“重症度”既影响选药又影响生死 → 应当采用【分组数据】（选新药 A）' },
              { value: 'mediator_case', label: '结构二（中介变量 X → Z → Y）：新药正是通过“改变血压 Z”来救命的 → 绝不能按血压分组控制，应当采用【总体数据】！' },
              { value: 'berkeley_case', label: '结构三（1973 加州大学伯克利分校招生案）：全校总体男录取率 44% > 女 35%，但拆开各系却多是女录取率更高（因女性更多申请了低录取率的文科热门系）' }
            ]
          }
        ],
        mappings: [
          [
            '在“结构一（混杂变量 → 看分组）”与“结构二（中介变量 → 看总体）”之间切换：完全相同的一张数字表格，只因因果箭头方向不同，正确决策就截然相反！',
            '萨维奇与朱迪亚·珀尔提出了著名的“确定性原则（Sure-Thing Principle）”与因果裁决准则：面对同一张辛普森悖论统计表，我们究竟应该听从“分组结论”还是“总体结论”，绝对无法仅靠概率统计数字本身来回答，而完全取决于第三变量 Z 在因果图（DAG）中是“混杂原因（Confounder，应看分组）”还是“受药物影响的中介结果（Mediator，应看总体）”！',
            'Whether one should consult the partitioned (subgroup) data or the aggregated data cannot be decided by statistics alone; it depends entirely on the causal graph—specifically, whether the third variable Z is a pre-treatment confounder or a post-treatment mediator.',
            '朱迪亚·珀尔《因果论》（Causality，据 SEP《Simpson’s Paradox》§3 转引）'
          ],
          [
            '切换到“结构三（1973 伯克利研究生院招生案）”：观察现实社会科学中最著名的辛普森悖论实例',
            '1973 年加州大学伯克利分校研究生院曾因“全校总体男性录取率（44%）显著高于女性（35%）”被怀疑存在性别歧视；然而当统计学家比克尔等人按各院系分别统计时，却震惊地发现绝大多数院系的女性录取率反而高于或等于男性——原因在于女性申请者大量集中报考了全校录取名额最紧俏的文科系，而男性更多报考了录取率较高的理工科系。',
            'In the famous UC Berkeley graduate admissions study (Bickel et al. 1975), aggregate data showed a higher admission rate for men (44% vs 35%), yet department-by-department data showed a slight bias in favor of women, because women tended to apply to more competitive departments with lower admission rates.',
            'Bickel et al. 1975《Science》（据 SEP《Simpson’s Paradox》§1 转引）'
          ]
        ]
      }
    ]
  }
];
