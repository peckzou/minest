import { PhilosophyModel } from '../types/philosophy';

export const MODELS_45_TO_56: PhilosophyModel[] = [
  {
    id: 45,
    slug: 'minest_kripke',
    title: '克里普克 · 可能世界',
    philosopher: '索尔·克里普克',
    concept: '可能世界与严格指示词',
    categoryGroup: '一、认识论与逻辑哲学（45–46）',
    tags: ['认识论', '逻辑', '形而上学', '语言'],
    playSummary: '切换多个可能世界，比较必然性、可能性和指称关系',
    levelsSummary: '① 名字与摹状词 · ② 不存在的世界 · ③ 水 = H₂O · ④ 应用练习',
    source: '《命名与必然性》（据 SEP《Rigid Designators》转引）',
    quoteCount: 11,
    thumbType: 'kripke',
    htmlAssetPath: '/philosophy/models/minest_kripke.html',
    coreQuestion: '一个名字在“事情本可能不同”的世界里，仍然指向同一个东西吗？',
    boundaryNote: '一排排“可能世界”只是反事实情形的教学展示；克里普克强调可能世界是被规定的（stipulated），而非用望远镜去发现的遥远星球。',
    stages: [
      {
        id: 1,
        tabLabel: '① 名字与摹状词',
        instructionTitle: '① 名字与摹状词 · 切换不同可能世界 W₀–W₅，尝试拉扯“尼克松”专名线与“1968 大选获胜者”摹状词线',
        sliders: [
          { key: 'worldIdx', label: '当前可能世界 W', min: 0, max: 5, step: 1, defaultValue: 0, formatValue: (v) => v === 0 ? 'W₀ (现实世界)' : `W${v} (反事实世界)` },
          { key: 'tugForce', label: '拉扯专名指称线', min: 0, max: 100, step: 1, defaultValue: 0, unit: '%' }
        ],
        choices: [
          {
            key: 'termType',
            label: '当前测试词项',
            defaultValue: 'both',
            options: [
              { value: 'both', label: '同时对比专名与摹状词' },
              { value: 'rigid', label: '专名：“尼克松”（严格指示词）' },
              { value: 'flaccid', label: '摹状词：“1968 年大选获胜者”' }
            ]
          }
        ],
        mappings: [
          [
            '切换不同可能世界 W₀–W₅：名字“尼克松”始终钉在同一个人身上',
            '专名指向被命名的对象，在该对象存在的每一个可能世界中都如此。',
            'A proper name refers to the named object in every possible world in which the object exists.',
            '据维基百科《Naming and Necessity》词条概述'
          ],
          [
            '观察虚线摹状词“1968 年大选获胜者”在不同世界中跳向汉弗莱或华莱士',
            '大多数摹状词在不同的可能世界中指称不同的对象。',
            'Most descriptions designate different objects in different possible worlds.',
            '据维基百科《Naming and Necessity》词条概述'
          ],
          [
            '将“拉扯专名指称线”推至 75% 以上：尝试把“尼克松”拉到别人身上却弹回',
            '严格指示词在该对象存在的所有可能世界中指称同一对象，且从不指称别的东西。',
            'A rigid designator designates the same object in all possible worlds in which that object exists and never designates anything else.',
            '据 SEP《Rigid Designators》开篇'
          ]
        ]
      },
      {
        id: 2,
        tabLabel: '② 偶然属性与反事实',
        instructionTitle: '② 偶然属性与反事实 · 切换到“亚里士多德两岁夭折”或“从未从哲”的世界，或移除该个体',
        choices: [
          {
            key: 'ariState',
            label: '反事实世界设定',
            defaultValue: 'philosopher',
            options: [
              { value: 'philosopher', label: '现实世界：写《形而上学》、教亚历山大' },
              { value: 'age2', label: '反事实 W₁：亚里士多德两岁夭折' },
              { value: 'unborn', label: '反事实 W₂：亚里士多德从未出生' }
            ]
          }
        ],
        mappings: [
          [
            '切换至“反事实 W₁：亚里士多德两岁夭折”的世界',
            '亚里士多德本可以两岁就死去，因而不满足我们与他的名字联系起来的任何描述，却仍然是亚里士多德。',
            'Aristotle could have died at age two and so not satisfied any of the descriptions we associate with his name, and yet still have been Aristotle.',
            '据维基百科《Naming and Necessity》词条概述'
          ],
          [
            '切换至“反事实 W₂：亚里士多德从未出生”的世界，观察专名仍严格指向该空位',
            '即使在所描述的反事实情形中该对象不存在，专名在此仍然严格地指称那个本可能存在的对象。',
            'The name refers here, still rigidly, to something that would not exist in the counterfactual situation described.',
            '据 SEP《Rigid Designators》，Kripke 1980, p. 78'
          ],
          [
            '切回他存在的世界：指称锁链立即重新锁定同一人',
            '在任何该对象确实存在的可能世界里，我们都用这个指示词去指称那个对象。',
            'In any possible world where the object in question does exist, we use the designator in question to designate that object.',
            '据 SEP《Rigid Designators》引克里普克原话'
          ]
        ]
      },
      {
        id: 3,
        tabLabel: '③ 水 = H₂O（后天必然）',
        instructionTitle: '③ 水 = H₂O · 开启电解实验台发现分子结构，再跨可能世界测试“水”与“H₂O”的同一性锁链',
        sliders: [
          { key: 'electrolysis', label: '实验台电解经验检验进度', min: 0, max: 100, step: 2, defaultValue: 10, unit: '%' },
          { key: 'chainTension', label: '跨世界拆解“水 = H₂O”锁链拉力', min: 0, max: 100, step: 2, defaultValue: 0, unit: '%' }
        ],
        choices: [
          {
            key: 'planetTest',
            label: '测试天体 / 世界样本',
            defaultValue: 'earth',
            options: [
              { value: 'earth', label: '地球样本：水 = H₂O' },
              { value: 'twinearth', label: '孪生地球（XYZ 液体）：外观像水但非水' },
              { value: 'venus', label: '金星：晨星 = 暮星' }
            ]
          }
        ],
        mappings: [
          [
            '将“跨世界拆解锁链拉力”拉到 80% 以上：锁链纹丝不断',
            '如果水是 H₂O，那么水必然是 H₂O；没有任何可能世界中“水”挑出的东西不同于“H₂O”。',
            'If water is H2O, then water is necessarily H2O. There is no possible world in which "water" picks out something different from "H2O".',
            '据维基百科《Rigid designator》词条概述'
          ],
          [
            '将“实验台电解经验检验进度”推至 80% 以上：通过经验发现后天必然真理',
            '后天必然：必然为真，但只能通过经验研究才能知道的事实。',
            'A posteriori necessities—facts that are necessarily true, though they can be known only through empirical investigation.',
            '据维基百科《Naming and Necessity》词条概述'
          ],
          [
            '切换到“金星：晨星 = 暮星”，观察两个严格指示词的同一性',
            '两个指示词都是严格的同一性陈述，若为真，就必然为真，即使它不是先天的。',
            'An identity statement in which both designators are rigid must be necessarily true if it is true at all, even if the statement is not a priori.',
            '据 SEP《Rigid Designators》'
          ]
        ]
      },
      {
        id: 4,
        tabLabel: '④ 应用练习',
        instructionTitle: '④ 应用练习 · 点击画布中的词卡，将其归类到“严格指示词”或“非严格指示词”区域',
        draggables: [
          { id: 'socrates', label: '“苏格拉底”', sub: '个体专名', targetZone: 'rigid' },
          { id: 'tallest', label: '“地球上最高的山”', sub: '限定摹状词', targetZone: 'flaccid' },
          { id: 'gold', label: '“金（原子序数 79）”', sub: '自然种类词', targetZone: 'rigid' },
          { id: 'champion', label: '“本届世界杯冠军”', sub: '偶然角色摹状词', targetZone: 'flaccid' }
        ],
        dropZones: [
          { id: 'rigid', label: '严格指示词 (Rigid Designator)', sub: '所有可能世界中锁定同一对象', color: '#3a6f99' },
          { id: 'flaccid', label: '非严格指示词 (Non-rigid)', sub: '随可能世界不同而改变指称', color: '#c0392b' }
        ],
        mappings: [
          [
            '将“苏格拉底”与“金”放入严格指示词区域',
            '专名，以及某些自然种类词（包括生物分类与自然物质如“水”“金”）都是严格指示的。',
            'Proper names and certain natural kind terms—including biological taxa and types of natural substances—designate rigidly.',
            '据维基百科《Rigid designator》词条概述'
          ],
          [
            '完成全部 4 张词卡的正确分类',
            '严格指示词与内涵词、非严格指示词相对，后者可能在不同可能世界中指称不同的东西。',
            'Rigid designators are contrasted with connotative terms, non-rigid or flaccid designators, which may designate different things in different possible worlds.',
            '据维基百科《Rigid designator》词条概述'
          ]
        ]
      }
    ]
  },
  {
    id: 46,
    slug: 'minest_goodman_grue',
    title: '古德曼 · 新归纳之谜',
    philosopher: '纳尔逊·古德曼',
    concept: '绿蓝悖论与可投射谓词',
    categoryGroup: '一、认识论与逻辑哲学（45–46）',
    tags: ['认识论', '逻辑', '科学哲学'],
    playSummary: '调整观察时间与分类规则，比较不同归纳预测',
    levelsSummary: '① 绿与绿蓝 · ② 临界时刻 t · ③ 语言的对称 · ④ 根深蒂固（Entrenchment）',
    source: '《事实、虚构与预测》（据 SEP《Nelson Goodman》转引）',
    quoteCount: 10,
    thumbType: 'goodman',
    htmlAssetPath: '/philosophy/models/minest_goodman_grue.html',
    coreQuestion: '同样的证据支持“所有绿宝石都是绿的”，也同样支持“所有绿宝石都是绿蓝的”。我们凭什么只拿“绿”去预测未来？',
    boundaryNote: '“绿蓝”（grue）定义自古德曼《事实、虚构与预测》第三章；画布中的宝石矿井、时间滑块与根深蒂固天平均为直观教学建模。',
    stages: [
      {
        id: 1,
        tabLabel: '① 绿与绿蓝',
        instructionTitle: '① 绿与绿蓝 · 点击“开采并检验绿宝石”，对比 t 时刻之前“绿”笔记与“绿蓝”笔记的确证度',
        buttons: [
          { key: 'mineEmerald', label: '⛏ 开采并检验一颗绿宝石 (t 之前)', accent: 'green' },
          { key: 'mineBatch', label: '⛏ 连续检验 5 颗绿宝石', accent: 'amber' }
        ],
        mappings: [
          [
            '在时刻 t 之前检验至少 3 颗绿宝石：观察每颗既是“绿的”也是“绿蓝的”',
            '“绿蓝”谓词适用于：在未来某一时刻 t 之前被检验且是绿的东西，或者未经这样检验而是蓝的东西。',
            'This predicate applies to all things examined before some future time t just in case they are green but to other things just in case they are blue.',
            '据 SEP《Nelson Goodman》§5.3'
          ],
          [
            '累计检验达到 10 颗以上：两本笔记厚度与确证条完全持平',
            '这些“绿蓝证据”合在一起确证“所有绿宝石都是绿蓝的”，其程度与“绿证据”确证“所有绿宝石都是绿的”完全相同。',
            'They confirm this hypothesis to the exact same degree as the green-evidence statements confirmed the hypothesis that all emeralds are green.',
            '据 SEP《Nelson Goodman》§5.3'
          ]
        ]
      },
      {
        id: 2,
        tabLabel: '② 临界时刻 t',
        instructionTitle: '② 临界时刻 t · 拖动“当前观察时间”逼近并越过临界时刻 t，或移动 t 制造新谓词',
        sliders: [
          { key: 'nowTime', label: '当前观察时间 (Now)', min: 0, max: 100, step: 1, defaultValue: 25, unit: '%' },
          { key: 'tThreshold', label: '定义临界时刻 t', min: 30, max: 85, step: 5, defaultValue: 60, unit: '%' }
        ],
        mappings: [
          [
            '拖动“当前观察时间”逼近 t（距离 t 小于 10%）：观察“绿”与“绿蓝”对下一颗宝石的预测分岔',
            '我们得到两个互不相容的预测，它们被过去的证据确证到同样的程度。',
            'We have two mutually incompatible predictions, both confirmed to the same degree by the past evidence.',
            '据 SEP《Nelson Goodman》§5.3'
          ],
          [
            '多次调整“定义临界时刻 t”的位置：每一个 t 都生成一个新的“绿蓝_t”谓词',
            '我们显然可以定义无穷多个类似“绿蓝”的谓词，它们都会导出新的、同样互不相容的预测。',
            'We could obviously define infinitely many grue-like predicates that would all lead to new, similarly incompatible predictions.',
            '据 SEP《Nelson Goodman》§5.3'
          ],
          [
            '拖动“当前观察时间”越过临界时刻 t：观察哪条归纳预测与实际绿宝石相符',
            '对于有效的归纳推理，谓词的选择是要紧的。',
            'For valid inductive inferences the choice of predicates matters.',
            '据 SEP《Nelson Goodman》§5.3'
          ]
        ]
      },
      {
        id: 3,
        tabLabel: '③ 语言的对称',
        instructionTitle: '③ 语言的对称 · 旋转“基本谓词坐标系”，比较以{绿,蓝}为基本词和以{绿蓝,蓝绿}为基本词的对称性',
        sliders: [
          { key: 'langAngle', label: '语言坐标系旋转角', min: 0, max: 180, step: 5, defaultValue: 0, unit: '°' }
        ],
        choices: [
          {
            key: 'baseLang',
            label: '设定原始基本谓词',
            defaultValue: 'green_blue',
            options: [
              { value: 'green_blue', label: '英语式：以“绿 / 蓝”为基本谓词' },
              { value: 'grue_bleen', label: '绿蓝语式：以“绿蓝 / 蓝绿”为基本谓词' }
            ]
          }
        ],
        mappings: [
          [
            '切换到“绿蓝语式：以绿蓝/蓝绿为基本谓词”或旋转坐标系至 180°',
            '两种语言在全部语义和句法性质上都是对称的：在绿蓝语中，反而是“绿”需要借助时刻 t 来定义。',
            'Both languages are symmetrical in all their semantic and syntactical properties.',
            '据 SEP《Nelson Goodman》§5.3'
          ],
          [
            '在两套语言间来回切换：观察“含有时刻 t”总是落在对方谓词上',
            '因此，谓词是否“含时间位置”，在语言上等价的变换之下并不是不变的。',
            'So the positionality of predicates is not invariant with respect to linguistically equivalent transformations.',
            '据 SEP《Nelson Goodman》§5.3'
          ]
        ]
      },
      {
        id: 4,
        tabLabel: '④ 根深蒂固与投射',
        instructionTitle: '④ 根深蒂固（Entrenchment） · 比较谓词在人类过往投射历史中的积累权重，选出可投射假说',
        sliders: [
          { key: 'historyWeight', label: '过往实际归纳投射历史积累', min: 10, max: 100, step: 5, defaultValue: 85, unit: '%' }
        ],
        choices: [
          {
            key: 'projectChoice',
            label: '放入“可投射假说”托盘',
            defaultValue: 'none',
            options: [
              { value: 'none', label: '尚未选择投射假说' },
              { value: 'project_green', label: '投射 H₁：“所有绿宝石都是绿的”' },
              { value: 'project_grue', label: '投射 H₂：“所有绿宝石都是绿蓝的”' }
            ]
          }
        ],
        mappings: [
          [
            '调整“过往实际归纳投射历史积累”：观察天平因历史根深蒂固程度向“绿”倾斜',
            '“绿”这类谓词胜过“绿蓝”这类谓词，因为前者在我们的过去投射实践中根深蒂固得多。',
            'Predicates like "green" are favored over predicates like "grue", because the former are much better entrenched.',
            '据 SEP《Nelson Goodman》§5.4'
          ],
          [
            '尝试选择投射 H₂（绿蓝），观察其被更根深蒂固的 H₁ 压倒（Overridden）',
            '如果两条假说的经验记录相同，使用更根深蒂固谓词的那条就压过其他假说。',
            'If two hypotheses are the same with respect to their empirical track-record, then the hypothesis that uses the better entrenched predicates overrides the alternatives.',
            '据 SEP《Nelson Goodman》§5.4'
          ],
          [
            '选择投射 H₁：“所有绿宝石都是绿的”放入可投射托盘',
            '一个假说是可投射的，当且仅当它得到支持、未被违反、未被穷尽，并且所有与它冲突的假说都被压过。',
            'A hypothesis is projectible iff it is supported, unviolated, and unexhausted, and all hypotheses conflicting with it are overridden.',
            '古德曼《事实、虚构与预测》FFF p. 108'
          ]
        ]
      }
    ]
  },
  {
    id: 47,
    slug: 'minest_aristotle_mean',
    title: '亚里士多德 · 德性中道',
    philosopher: '亚里士多德',
    concept: '中道（Mesotes）与实践智慧',
    categoryGroup: '二、伦理学与政治哲学（47–56）',
    tags: ['伦理学', '古希腊哲学'],
    playSummary: '调整行为倾向，比较不足、过度与适当选择',
    levelsSummary: '① 不足、中道与过度 · ② 相对于我们的中道 · ③ 矫正弯曲的木料 · ④ 德性谱系练习',
    source: '《尼各马可伦理学》第二卷（Ross 英译本）',
    quoteCount: 10,
    thumbType: 'mean',
    coreQuestion: '为什么德性不是算术上的“正中间（50%）”，而是要因时、因人、因境制宜的“恰到好处”？',
    boundaryNote: '亚里士多德明确指出并非所有行为和情感都有中道（如嫉妒、偷盗、谋杀本身即恶，不存在“适度的偷盗”）。',
    stages: [
      {
        id: 1,
        tabLabel: '① 过犹不及',
        instructionTitle: '① 过犹不及 · 拖动“面对危险时的情感与行为倾向”滑块，比较怯懦（不足）、勇敢（中道）与鲁莽（过度）',
        sliders: [
          { key: 'disposition', label: '行为与情感倾向度', min: 0, max: 100, step: 1, defaultValue: 20, unit: '%' }
        ],
        choices: [
          {
            key: 'sphere',
            label: '伦理生活领域',
            defaultValue: 'fear',
            options: [
              { value: 'fear', label: '恐惧与信心：怯懦 — 勇敢 — 鲁莽' },
              { value: 'pleasure', label: '肉体快乐：麻木 — 节制 — 放纵' },
              { value: 'wealth', label: '钱财施予：吝啬 — 慷慨 — 挥霍' }
            ]
          }
        ],
        mappings: [
          [
            '将倾向滑块拖到左侧低位（< 28%）或右侧高位（> 72%）：观察恶行如何因过度或不足而破坏德性',
            '过度与不足使德性毁灭，而中道则保存德性。',
            'Excess and defect destroy perfection, while the mean preserves it.',
            '亚里士多德《尼各马可伦理学》II.2, 1104a12'
          ],
          [
            '将倾向滑块精准调节至中间黄金靶区（42%–58%）：命中“中道”',
            '德性是一种关于选择的品质，存在于相对于我们而言的中道之中；这种中道由理性来规定，正如一位明智之人所规定的那样。',
            'Virtue, then, is a state of character concerned with choice, lying in a mean, i.e. the mean relative to us, this being determined by a rational principle.',
            '亚里士多德《尼各马可伦理学》II.6, 1106b36'
          ],
          [
            '切换不同伦理生活领域（恐惧、快乐、钱财）并再次找到中道',
            '它是两种恶行之间的中道，一种恶行在于过度，另一种在于不足。',
            'It is a mean between two vices, that which depends on excess and that which depends on defect.',
            '亚里士多德《尼各马可伦理学》II.6, 1107a2'
          ]
        ]
      },
      {
        id: 2,
        tabLabel: '② 相对于我们的中道',
        instructionTitle: '② 相对于我们的中道 · 切换“摔跤冠军米隆”与“初学者”，调节口粮配给，体会算术中点与相对中道的区别',
        sliders: [
          { key: 'foodAmount', label: '每日食物配给量（明那）', min: 2, max: 10, step: 0.5, defaultValue: 6, unit: ' 明那' }
        ],
        choices: [
          {
            key: 'trainee',
            label: '受训者体质与处境',
            defaultValue: 'milo',
            options: [
              { value: 'milo', label: '摔跤名将米隆（高消耗体格）' },
              { value: 'novice', label: '体操初学者（普通体格）' }
            ]
          }
        ],
        mappings: [
          [
            '将配给量设为算术中点 6 明那：观察对米隆太少、对初学者太多',
            '如果十磅食物太多、两磅太少，体育教练并不会因此规定六磅；因为这对于受训者来说或许仍然太多或太少。',
            'If ten pounds are too much for a particular person to eat and two too little, it does not follow that thetrainer will order six pounds.',
            '亚里士多德《尼各马可伦理学》II.6, 1106a36'
          ],
          [
            '为米隆调至 8.5 明那，再切换为初学者调至 3.5 明那：各自达到最佳状态',
            '对于米隆来说六磅太少，对于体操初学者来说又太多。行家总是避免过度与不足，寻求中道并选择它——不是事物本身的中道，而是相对于我们的中道。',
            'For this also is perhaps too much for the person who is to take it, or too little—too little for Milo, too much for the beginner in athletic exercises.',
            '亚里士多德《尼各马可伦理学》II.6, 1106b3'
          ]
        ]
      },
      {
        id: 3,
        tabLabel: '③ 矫枉过正',
        instructionTitle: '③ 矫正弯曲的木料 · 面对天生容易偏向享乐或退缩的木料，向反方向施加拉力使其恢复笔直',
        sliders: [
          { key: 'naturalDrift', label: '天性固有偏斜方向', min: -50, max: 50, step: 5, defaultValue: -35 },
          { key: 'counterPull', label: '有意识反向矫正力度', min: -60, max: 60, step: 5, defaultValue: 0 }
        ],
        mappings: [
          [
            '观察天性偏斜（如 -35）：木料自然弯向阻力更小的恶行一侧',
            '我们天生更容易倾向于某些事物，因此也更容易滑向那端，例如我们天生更易倾向于享乐，所以更容易流于放纵而非麻木。',
            'We ourselves tend more naturally to pleasures, and hence are more easily carried away towards self-indulgence than towards propriety.',
            '亚里士多德《尼各马可伦理学》II.8, 1109a14'
          ],
          [
            '施加与天性偏斜方向相反的“反向矫正力度”（如 +35 至 +45），使弯曲木料回到中正竖线',
            '我们必须把自己拉向相反的方向；因为通过远远避开错误，我们就能达到中道，就像人们矫正弯曲的木料那样。',
            'We must drag ourselves away to the contrary extreme; for we shall get into the intermediate state by drawing well away from error, as people do in straightening bent wood.',
            '亚里士多德《尼各马可伦理学》II.9, 1109b5'
          ]
        ]
      },
      {
        id: 4,
        tabLabel: '④ 边界与练习',
        instructionTitle: '④ 边界与练习 · 将下列品质或行为归入“不足之恶”“中道之德”“过度之恶”或“本身即恶（无中道）”',
        draggables: [
          { id: 'courage', label: '勇敢 (Courage)', sub: '在正确的时刻面对正确的危险', targetZone: 'mean_zone' },
          { id: 'rashness', label: '鲁莽 (Rashness)', sub: '无所畏惧地冲向一切危险', targetZone: 'excess_zone' },
          { id: 'cowardice', label: '怯懦 (Cowardice)', sub: '畏惧一切微小的风险', targetZone: 'defect_zone' },
          { id: 'murder', label: '恶意嫉妒 / 谋杀', sub: '其名称本身就包含恶', targetZone: 'no_mean_zone' }
        ],
        dropZones: [
          { id: 'defect_zone', label: '不足之恶', sub: 'Defect', color: '#3a6f99' },
          { id: 'mean_zone', label: '中道之德', sub: 'Virtuous Mean', color: '#2fa35a' },
          { id: 'excess_zone', label: '过度之恶', sub: 'Excess', color: '#e67e22' },
          { id: 'no_mean_zone', label: '无中道之恶', sub: '本身即恶', color: '#c0392b' }
        ],
        mappings: [
          [
            '将“恶意嫉妒 / 谋杀”放入“无中道之恶”区域',
            '并非每一个行为或每一种情感都允许有中道；因为有些事物的名称本身就立即蕴含着恶，例如幸灾乐祸、无耻、嫉妒，以及通奸、偷盗、谋杀。',
            'Not every action nor every passion admits of a mean; for some have names that already imply badness, e.g. spite, shamelessness, envy, and in the case of actions adultery, theft, murder.',
            '亚里士多德《尼各马可伦理学》II.6, 1107a9'
          ],
          [
            '完成勇敢、鲁莽、怯懦与本身即恶的四项全部归类',
            '按其本质和定义而言，德性是中道；但按其至善和完美而言，它是顶点。',
            'In respect of its substance and the definition which states its essence virtue is a mean, with regard to what is best and right an extreme.',
            '亚里士多德《尼各马可伦理学》II.6, 1107a6'
          ]
        ]
      }
    ]
  },
  {
    id: 48,
    slug: 'minest_epicurus',
    title: '伊壁鸠鲁 · 快乐分类',
    philosopher: '伊壁鸠鲁',
    concept: '欲望三分法与灵魂无纷扰（Ataraxia）',
    categoryGroup: '二、伦理学与政治哲学（47–56）',
    tags: ['伦理学', '古希腊哲学'],
    playSummary: '将不同欲望放入相应类别，探索欲望与幸福',
    levelsSummary: '① 欲望三分法 · ② 动态快乐与静态快乐 · ③ 快乐的审慎权衡 · ④ 幸福花园练习',
    source: '《致美诺西斯的信》《主要教义》（Hicks 英译本）',
    quoteCount: 9,
    thumbType: 'epicurus',
    coreQuestion: '既然快乐是幸福生活的起点与终点，为什么伊壁鸠鲁反而劝人只吃粗茶淡饭、远离奢华与虚名？',
    boundaryNote: '伊壁鸠鲁所说的“快乐”不是声色犬马的放纵，而是“身体的无痛苦（Aponia）与灵魂的无纷扰（Ataraxia）”。',
    stages: [
      {
        id: 1,
        tabLabel: '① 欲望三分法',
        instructionTitle: '① 欲望三分法 · 点击或拖拽生活中的欲望卡片，将其放入伊壁鸠鲁的三个欲望筛篮中',
        draggables: [
          { id: 'water_bread', label: '口渴时的清水与粗麦面包', sub: '消除饥渴之痛，极易获得', targetZone: 'nat_nec' },
          { id: 'philosophy_friend', label: '哲学友谊与心灵安全', sub: '消除灵魂恐惧之必需', targetZone: 'nat_nec' },
          { id: 'luxury_banquet', label: '昂贵的进口美酒与山珍海味', sub: '使快乐多样化，但并非消除痛苦所必需', targetZone: 'nat_unnec' },
          { id: 'crown_statue', label: '权位桂冠、金色雕像与万人喝彩', sub: '源于空洞意见，无止境且伴随焦虑', targetZone: 'unnat_unnec' }
        ],
        dropZones: [
          { id: 'nat_nec', label: '自然且必要的欲望', sub: 'Natural & Necessary（通向自足）', color: '#2fa35a' },
          { id: 'nat_unnec', label: '自然但不必要的欲望', sub: 'Natural & Unnecessary（可适度舍弃）', color: '#e67e22' },
          { id: 'unnat_unnec', label: '既不自然也不必要的欲望', sub: 'Vain & Empty（引发灵魂纷扰）', color: '#c0392b' }
        ],
        mappings: [
          [
            '将“清水与粗麦面包”和“哲学友谊”放入“自然且必要的欲望”',
            '应当记住，在欲望之中，有些是自然的，有些是空洞的；而在自然的欲望中，有些是必要的，有些仅仅是自然的。',
            'We must also reflect that of desires some are natural, others are groundless; and that of the natural some are necessary as well as natural, and some natural only.',
            '伊壁鸠鲁《致美诺西斯的信》§127'
          ],
          [
            '将“权位桂冠与万人喝彩”放入“既不自然也不必要的欲望”',
            '那些既不自然也不必要的欲望，是由空洞的意见所产生的；它们之所以难以消散，不是因为自身的本性，而是因为人的虚妄意见。',
            'Those desires which are neither natural nor necessary are due to groundless opinion.',
            '伊壁鸠鲁《主要教义》第 29–30 条'
          ],
          [
            '完成全部 4 张欲望卡的分类：观察灵魂纷扰度降至最低',
            '自然的财富是有限的，而且很容易获得；但空洞想象所追求的财富却坠入无底深渊。',
            'Natural wealth is both limited and easily obtained; the wealth defined by groundless fancies extends without limit.',
            '伊壁鸠鲁《主要教义》第 15 条'
          ]
        ]
      },
      {
        id: 2,
        tabLabel: '② 静态快乐 vs 放纵',
        instructionTitle: '② 静态快乐（Katastematic） · 调整“感官奢华刺激”与“免除匮乏与恐惧”，观察灵魂水面的波澜（纷扰度）',
        sliders: [
          { key: 'basicRelief', label: '消除饥寒与死亡焦虑（满足自然必要）', min: 0, max: 100, step: 2, defaultValue: 40, unit: '%' },
          { key: 'luxuryExcess', label: '追逐奢华盛宴与虚名刺激', min: 0, max: 100, step: 2, defaultValue: 50, unit: '%' }
        ],
        mappings: [
          [
            '将“消除饥寒与死亡焦虑”拉至 90% 以上，同时将“追逐奢华盛宴”降至 15% 以下：水面归于澄澈宁静',
            '当我们说快乐是终极目的时，我们并不是指放荡者的快乐或肉体感官的享乐，而是指身体的无痛苦和灵魂的无纷扰。',
            'When we say, then, that pleasure is the end and aim, we do not mean the pleasures of the prodigal or the pleasures of sensuality... By pleasure we mean the absence of pain in the body and of trouble in the soul.',
            '伊壁鸠鲁《致美诺西斯的信》§131'
          ],
          [
            '尝试在“消除饥寒”已达 100% 后继续拉高“追逐奢华”：快乐总量不再增加，反而激起焦虑波浪',
            '一旦由于匮乏而产生的痛苦被消除，肉体中的快乐就不会再增加了，而只是变换花样而已。',
            'The magnitude of pleasure reaches its limit in the removal of all pain.',
            '伊壁鸠鲁《主要教义》第 3、18 条'
          ]
        ]
      },
      {
        id: 3,
        tabLabel: '③ 快乐与痛苦的审慎计算',
        instructionTitle: '③ 审慎权衡 · 在面临短期快乐与长期后果的抉择时，切换审慎选择，观察整体一生的快乐净值',
        choices: [
          {
            key: 'choiceCase',
            label: '生活抉择情境',
            defaultValue: 'binge',
            options: [
              { value: 'binge', label: '通宵豪饮狂欢：当晚极乐 (+30)，次日剧痛与懊悔 (-75)' },
              { value: 'surgery', label: '接受苦药/手术：当下疼痛 (-25)，换来长期健康无痛 (+90)' },
              { value: 'prudence', label: '与朋友在花园清谈哲思：平实持久的灵魂安宁 (+85)' }
            ]
          }
        ],
        mappings: [
          [
            '选择“通宵豪饮狂欢”后切换到“接受苦药/手术”：体验为何有时放弃快乐、有时选择痛苦',
            '正因为快乐是第一位的、天生的善，所以我们并不选择每一种快乐，而是有时放弃许多快乐，如果它们会带来更大的烦恼；有时我们也认为许多痛苦比快乐更好，如果忍受痛苦之后会随之而来更大的快乐。',
            'We do not choose every pleasure whatsoever, but ofttimes pass over many pleasures when a greater annoyance ensues from them.',
            '伊壁鸠鲁《致美诺西斯的信》§129'
          ],
          [
            '切换到“与朋友在花园清谈哲思”：点亮审慎（Phronesis）与德性共生',
            '如果不活得明智、高尚和公正，就不可能活得快乐；而如果不活得快乐，也不可能活得明智、高尚和公正。',
            'It is impossible to live a pleasant life without living wisely and well and justly, and it is impossible to live wisely and well and justly without living pleasantly.',
            '伊壁鸠鲁《主要教义》第 5 条'
          ]
        ]
      }
    ]
  },
  {
    id: 49,
    slug: 'minest_stoic_control',
    title: '斯多葛 · 控制二分法',
    philosopher: '爱比克泰德 / 马可·奥勒留',
    concept: '控制二分法（Dichotomy of Control）',
    categoryGroup: '二、伦理学与政治哲学（47–56）',
    tags: ['伦理学', '古希腊罗马哲学'],
    playSummary: '将生活事件分为可控制与不可控制，选择行动',
    levelsSummary: '① 控制之内外 · ② 扰乱人的是判断 · ③ 射箭手比喻与行动',
    source: '爱比克泰德《手册》（Enchiridion，Long 英译本）',
    quoteCount: 8,
    thumbType: 'stoic',
    coreQuestion: '面对风暴、疾病、流放与他人的毁誉，人怎样才能永远不被击败、不受阻碍？',
    boundaryNote: '斯多葛派并非消极躺平，而是像全力瞄准的弓箭手：尽一切努力做好“拉弓瞄准”（可控），同时坦然接受“风吹偏箭矢”（不可控）。',
    stages: [
      {
        id: 1,
        tabLabel: '① 控制二分法',
        instructionTitle: '① 控制二分法 · 将生活中的事项拖入“完全取决于我们（内圈）”或“不取决于我们（外圈）”',
        draggables: [
          { id: 'judgment', label: '我的信念、判断与回应态度', sub: '内部理性能力（Prohairesis）', targetZone: 'in_control' },
          { id: 'desire_act', label: '我的意欲、规避与道德冲动', sub: '自身心灵的运作', targetZone: 'in_control' },
          { id: 'wealth_fame', label: '财富、名誉、官职与他人的赞誉', sub: '外在际遇，随时可被夺走', targetZone: 'out_control' },
          { id: 'body_weather', label: '先天体质、生老病死与突如其来的风暴', sub: '自然命运之流', targetZone: 'out_control' }
        ],
        dropZones: [
          { id: 'in_control', label: '取决于我们的事 (Up to Us)', sub: '本性自由、不受阻碍、无人能夺走', color: '#2fa35a' },
          { id: 'out_control', label: '不取决于我们的事 (Not Up to Us)', sub: '软弱、受制于人、属于外物', color: '#3a6f99' }
        ],
        mappings: [
          [
            '将“我的信念、判断”与“意欲、道德冲动”放入内圈（取决于我们的事）',
            '在存在的事物中，有些取决于我们，有些不取决于我们。取决于我们的是意见、冲动、欲望、规避——简言之，一切属于我们自己行动的事。',
            'Of things some are in our power, and others are not. In our power are opinion, movement towards a thing, desire, aversion; and in a word, whatever are our own acts.',
            '爱比克泰德《手册》第 1 章 §1'
          ],
          [
            '将“财富、名誉”与“先天体质、风暴”放入外圈（不取决于我们的事）',
            '不取决于我们的是身体、财产、名声、官职——简言之，一切不属于我们自己行动的事。',
            'Not in our power are the body, property, reputation, offices, and in a word, whatever are not our own acts.',
            '爱比克泰德《手册》第 1 章 §1'
          ],
          [
            '完成四项分类：观察内圈亮起不可动摇的自由护盾',
            '如果你只把属于你的东西当作自己的，把属于别人的东西当作别人的，那么就没有任何人能强迫你，也没有任何人能阻碍你。',
            'If you think that only to be your own which is your own, and that which belongs to others such as it really is, no one will ever compel you, no one will restrict you.',
            '爱比克泰德《手册》第 1 章 §3'
          ]
        ]
      },
      {
        id: 2,
        tabLabel: '② 印象与价值判断',
        instructionTitle: '② 事件 vs 判断 · 当外部逆境袭来时，切换你的“内在价值判断滤镜”，观察情绪风暴的变化',
        choices: [
          {
            key: 'externalEvent',
            label: '突发的外部事件（不可控）',
            defaultValue: 'insult',
            options: [
              { value: 'insult', label: '他人在广场上当众羞辱你' },
              { value: 'shipwreck', label: '商船遭遇风暴，货财尽失' },
              { value: 'mortality', label: '面临疾病的威胁与死亡的阴影' }
            ]
          },
          {
            key: 'internalLens',
            label: '你赋予该印象的判断（可控）',
            defaultValue: 'catastrophe',
            options: [
              { value: 'catastrophe', label: '非理性判断：“这是毁灭性的灾难！我完了！”' },
              { value: 'stoic', label: '斯多葛判断：“这只是外物印象，并未损害我的品格与理性。”' }
            ]
          }
        ],
        mappings: [
          [
            '保持在“非理性判断”下切换外部事件：观察心智被愤怒与恐惧剧烈摇撼',
            '扰乱人们的不是事物本身，而是人们对事物的判断和意见。',
            'Men are disturbed not by things, but by the views which they take of things.',
            '爱比克泰德《手册》第 5 章'
          ],
          [
            '将判断滤镜切换为“斯多葛判断”：心智立即从风暴转为澄明',
            '对每一个严酷的印象，你都应当立刻对它说：“你只是一个印象，绝不是你表面所装作的那样。”然后用你所拥有的准则去检验它：它涉及取决于我们的事，还是不取决于我们的事？',
            'Seek at once to say to every harsh appearance, "You are an appearance, and in no manner what you appear to be."',
            '爱比克泰德《手册》第 1 章 §5'
          ]
        ]
      },
      {
        id: 3,
        tabLabel: '③ 斯多葛弓箭手',
        instructionTitle: '③ 斯多葛弓箭手 · 调节“自身瞄准努力（可控）”与“侧风干扰（不可控）”，发射箭矢并选择对结果的态度',
        sliders: [
          { key: 'aimEffort', label: '自身拉弓与瞄准专注度（可控）', min: 10, max: 100, step: 5, defaultValue: 90, unit: '%' },
          { key: 'windGust', label: '突发强横风力干扰（不可控）', min: -50, max: 50, step: 5, defaultValue: 35, unit: ' m/s' }
        ],
        buttons: [
          { key: 'shootArrow', label: '🏹 射出箭矢（尽人事，听天命）', accent: 'amber' }
        ],
        mappings: [
          [
            '将“自身拉弓与瞄准专注度”调至 90% 以上并点击射出箭矢（即使被横风吹偏也保持心灵平静）',
            '不要要求事情按照你的愿望发生，而是要希望事情按照它们实际发生的方式发生，这样你的生活就会顺遂安宁。',
            'Seek not that the things which happen should happen as you wish; but wish the things which happen to be as they are, and you will have a tranquil flow of life.',
            '爱比克泰德《手册》第 8 章'
          ],
          [
            '在横风较大（|风力| ≥ 30）和无风（|风力| ≤ 10）两种条件下各射出一箭：体会“目的在于尽责瞄准而非必中靶心”',
            '弓箭手应当竭尽全力把一切准备工作做好直至射出那一刻；至于箭射出后是否被狂风吹偏，那已不再取决于弓箭手，也不损害他的德性。',
            'The archer must do all in his power to aim straight; whether the arrow hits the target after leaving the bow belongs to external fortune.',
            '西塞罗《论至善与至恶》III.22（斯多葛弓箭手喻）'
          ]
        ]
      }
    ]
  },
  {
    id: 50,
    slug: 'minest_hobbes',
    title: '霍布斯 · 社会契约',
    philosopher: '托马斯·霍布斯',
    concept: '自然状态与利维坦主权者',
    categoryGroup: '二、伦理学与政治哲学（47–56）',
    tags: ['政治哲学', '伦理学', '社会'],
    playSummary: '调整安全、信任与公共权威条件',
    levelsSummary: '① 自然状态三根源 · ② 一切人对一切人的战争 · ③ 缔结契约与利维坦之剑',
    source: '《利维坦》第十三、十七章（1651 原版英文本）',
    quoteCount: 9,
    thumbType: 'hobbes',
    coreQuestion: '如果人类在能力与希望上大体平等，为什么没有公共权力震慑时，理性人之间反而会陷入所有人对所有人的战争？',
    boundaryNote: '霍布斯的“自然状态”不是某段特定的史前考古纪实，而是当共同体失去公共权威与法律威慑时随时可能显露的逻辑处境。',
    stages: [
      {
        id: 1,
        tabLabel: '① 冲突的三大根源',
        instructionTitle: '① 冲突三根源 · 调节资源稀缺（竞争）、彼此猜忌（猜疑）与对优越声名的渴求（荣誉），观察自然状态中的冲突火花',
        sliders: [
          { key: 'scarcity', label: '资源稀缺与竞争强度 (Competition)', min: 0, max: 100, step: 5, defaultValue: 65, unit: '%' },
          { key: 'diffidence', label: '彼此缺乏安全感与猜疑 (Diffidence)', min: 0, max: 100, step: 5, defaultValue: 70, unit: '%' },
          { key: 'glory', label: '对名声与支配的追求 (Glory)', min: 0, max: 100, step: 5, defaultValue: 50, unit: '%' }
        ],
        mappings: [
          [
            '调节三项滑块使总冲突度超过 60%：观察能力大体相等的个体为自保而先发制人',
            '在人类的天性中，我们发现有三种造成争斗的主要原因：第一是竞争，第二是猜疑，第三是荣誉。',
            'In the nature of man, we find three principal causes of quarrel. First, competition; secondly, diffidence; thirdly, glory.',
            '霍布斯《利维坦》第 13 章'
          ],
          [
            '将“彼此缺乏安全感与猜疑”单独拉至 85% 以上：即使不贪婪的人也因恐惧被迫先发制人',
            '从这种能力上的平等出发，就产生了达到目的的希望上的平等；而由于这种彼此猜疑，自保最合理的办法就是先发制人。',
            'From this equality of ability, ariseth equality of hope in the attaining of our ends... And from this diffidence of one another, there is no way for any man to secure himself, so reasonable, as anticipation.',
            '霍布斯《利维坦》第 13 章'
          ]
        ]
      },
      {
        id: 2,
        tabLabel: '② 战争状态与生命处境',
        instructionTitle: '② 一切人对一切人的战争 · 在没有公共权威时观察产业、耕种、航海与寿命指数的坍塌',
        sliders: [
          { key: 'authoritySword', label: '公共震慑权威 (Common Power)', min: 0, max: 100, step: 5, defaultValue: 0, unit: '%' }
        ],
        mappings: [
          [
            '保持“公共震慑权威”为 0%：观察画布中所有个体互相戒备、贸易与农业归零',
            '在没有一个共同权力使大家心存敬畏的时候，人们便处于所谓的战争状态之中；这种战争是一切人对一切人的战争。',
            'Hereby it is manifest, that during the time men live without a common Power to keep them all in awe, they are in that condition which is called Warre; and such a warre, as is of every man, against every man.',
            '霍布斯《利维坦》第 13 章'
          ],
          [
            '观察底部文明指标（耕作、航海、建筑、科学）在战争状态下全部跌入红区',
            '在这种状况下，没有产业的余地，因为其成果是不确定的……人们不断处于暴力死亡的恐惧和危险之中，人的生活孤独、贫困、卑污、残忍和短寿。',
            'And the life of man, solitary, poore, nasty, brutish, and short.',
            '霍布斯《利维坦》第 13 章'
          ]
        ]
      },
      {
        id: 3,
        tabLabel: '③ 利维坦与佩剑契约',
        instructionTitle: '③ 缔结契约 · 比较“仅有口头契约（无剑）”与“让渡权利给执剑主权者（利维坦）”，观察合作与安全的建立',
        choices: [
          {
            key: 'covenantMode',
            label: '契约与执法机制',
            defaultValue: 'words_only',
            options: [
              { value: 'words_only', label: '仅靠口头诺言与一纸契约（无武力后盾）' },
              { value: 'unilateral', label: '单方面放下武器，其他人保留武力' },
              { value: 'leviathan', label: '共同让渡自然权利，建立执剑的利维坦主权者' }
            ]
          }
        ],
        sliders: [
          { key: 'swordPower', label: '主权者公共佩剑威慑力', min: 0, max: 100, step: 5, defaultValue: 80, unit: '%' }
        ],
        mappings: [
          [
            '选择“仅靠口头诺言与一纸契约”或将佩剑威慑力降至 10% 以下：契约立即被违背',
            '没有剑的契约不过是一纸空文，完全没有力量去保障一个人的安全。',
            'And Covenants, without the Sword, are but Words, and of no strength to secure a man at all.',
            '霍布斯《利维坦》第 17 章'
          ],
          [
            '选择“共同让渡自然权利，建立执剑的利维坦主权者”且威慑力 ≥ 70%：分散个体汇聚为共同体并恢复和平与产业',
            '这就不仅是同意或协调，而是所有人真正统一于同一个人格之中……这就是伟大的利维坦的诞生，或者更虔敬地说，是那位“可朽之神”的诞生。',
            'This is more than Consent, or Concord; it is a reall Unitie of them all, in one and the same Person... This is the Generation of that great LEVIATHAN.',
            '霍布斯《利维坦》第 17 章'
          ]
        ]
      }
    ]
  },
  {
    id: 51,
    slug: 'minest_locke_rights',
    title: '洛克 · 自然权利与财产权',
    philosopher: '约翰·洛克',
    concept: '生命、自由、财产与劳动掺入论',
    categoryGroup: '二、伦理学与政治哲学（47–56）',
    tags: ['政治哲学', '伦理学'],
    playSummary: '操作生命、自由、财产权利之间的关系',
    levelsSummary: '① 自然法与三大自然权利 · ② 劳动掺入与私有产权 · ③ 但书限制与政府信托',
    source: '《政府论（下篇）》（1689 原版英文本）',
    quoteCount: 9,
    thumbType: 'locke_rights',
    coreQuestion: '既然大地和万物最初是共有物，一个人凭什么能不经全体人类事先投票同意，就把某样东西变成自己的合法私产？',
    boundaryNote: '洛克的自然状态不同于霍布斯的全面战争状态：洛克认为自然状态受理性（自然法）支配，但因缺乏公正裁判者才需要通过同意建立有限政府。',
    stages: [
      {
        id: 1,
        tabLabel: '① 生命、自由与财产',
        instructionTitle: '① 自然法与自然权利 · 调节理性自然法的约束，测试侵犯他人生命、自由或财产时的自然法边界',
        choices: [
          {
            key: 'actionTest',
            label: '自然状态中的行为测试',
            defaultValue: 'respect',
            options: [
              { value: 'respect', label: '平等互敬：在自然法范围内自由处分自身与财产' },
              { value: 'invade_liberty', label: '企图奴役他人或剥夺他人自由' },
              { value: 'invade_property', label: '强夺他人赖以维生的劳动果实' }
            ]
          }
        ],
        mappings: [
          [
            '保持在“平等互敬”状态：观察生命、自由、健康与财产构成的不可侵犯边界环',
            '自然状态有一种为人人所应遵守的自然法对它起着支配作用；而理性，也就是自然法，教导着有意遵从理性的全人类：既然人们都是平等和独立的，任何人就不得侵害他人的生命、健康、自由或财产。',
            'The state of nature has a law of nature to govern it, which obliges every one: and reason, which is that law, teaches all mankind, who will but consult it, that being all equal and independent, no one ought to harm another in his life, health, liberty, or possessions.',
            '洛克《政府论（下篇）》第 2 章 §6'
          ],
          [
            '切换到“企图奴役他人”或“强夺他人劳动果实”：触发自然状态中的自卫与惩罚权',
            '自由的状态却不是放任的状态；人在那种状态中享有处理他的人身或财产的无限自由，但并没有毁灭自身或他所占有的任何生物的自由。',
            'Yet it is not a state of licence... Every one, as he is bound to preserve himself, so by the like reason, when his own preservation comes not in competition, ought he, as much as he can, to preserve the rest of mankind.',
            '洛克《政府论（下篇）》第 2 章 §6'
          ]
        ]
      },
      {
        id: 2,
        tabLabel: '② 劳动掺入与财产权',
        instructionTitle: '② 劳动掺入（Mixing Labor） · 点击“采集橡果 / 耕种荒地”，观察自身身体劳动如何使共有自然物转化为私有财产',
        sliders: [
          { key: 'laborMixed', label: '掺入个人劳动与耕作程度', min: 0, max: 100, step: 5, defaultValue: 20, unit: '%' },
          { key: 'hoardAmount', label: '占有数量（对比留给他人及腐烂界限）', min: 10, max: 100, step: 5, defaultValue: 35, unit: '%' }
        ],
        mappings: [
          [
            '将“掺入个人劳动与耕作程度”推至 60% 以上：观察共有橡果与土地被注入个人劳动烙印',
            '每人对他自己的人身享有一种所有权，除他以外任何人都没有这种权利。他的身体所从事的劳动和他的双手所进行的工作，我们可以说正当地属于他。',
            'Every man has a property in his own person: this no body has any right to but himself. The labour of his body, and the work of his hands, we may say, are properly his.',
            '洛克《政府论（下篇）》第 5 章 §27'
          ],
          [
            '保持占有数量适度（≤ 50%）且劳动 ≥ 60%：满足“洛克但书”（留有足够多且同样好的给他人）',
            '所以只要他使任何东西脱离自然所提供的和那个东西所处的状态，他就已经掺进去了他的劳动，在这上面掺进了他自己所有的东西，因而使它成为他的财产……至少在还留有足够多而且同样好的东西给其他人共有的情况下是如此。',
            'Whatsoever then he removes out of the state that nature hath provided, and left it in, he hath mixed his labour with, and joined to it something that is his own, and thereby makes it his property... at least where there is enough, and as good, left in common for others.',
            '洛克《政府论（下篇）》第 5 章 §27'
          ],
          [
            '将“占有数量”推至 85% 以上：果实腐烂并挤占他人份额，违反自然法界限',
            '在任何东西败坏之前，一个人能利用多少以供生活所需，他就可通过他的劳动在多少范围内确定他的财产权；超过这个限度的任何部分，就都不属于他，而是归他人所有。',
            'As much as any one can make use of to any advantage of life before it spoils, so much he may by his labour fix a property in: whatever is beyond this, is more than his share, and belongs to others.',
            '洛克《政府论（下篇）》第 5 章 §31'
          ]
        ]
      },
      {
        id: 3,
        tabLabel: '③ 同意与有限政府信托',
        instructionTitle: '③ 政府信托与抵抗权 · 比较政府“依法保护权利”与“肆意剥夺人民财产和自由”两种情形下信托契约的状态',
        choices: [
          {
            key: 'govConduct',
            label: '受托政府（立法与行政权）的行为',
            defaultValue: 'protect',
            options: [
              { value: 'protect', label: '依公布法律裁决争议、保护公民生命自由与财产' },
              { value: 'usurp', label: '违背信托：专断没收人民财产、企图使人民沦为奴隶' }
            ]
          }
        ],
        mappings: [
          [
            '选择“依公布法律裁决争议、保护公民生命自由与财产”：观察社会契约与委托信托稳固运行',
            '人们联合成为国家和置身于政府之下的重大的和主要的目的，是保护他们的财产（即生命、自由和地产）。',
            'The great and chief end, therefore, of men’s uniting into commonwealths, and putting themselves under government, is the preservation of their property.',
            '洛克《政府论（下篇）》第 9 章 §124'
          ],
          [
            '切换到“违背信托：专断没收人民财产”：触发信托解除，最高权力回归人民',
            '每当立法者们图谋夺取和毁灭人民的财产或贬低他们的地位使其处于专断权力下的奴役状态时，立法者们就使自己与人民处于战争状态……权力就回到当初授权的人们手中。',
            'Whenever the legislators endeavour to take away, and destroy the property of the people, or to reduce them to slavery under arbitrary power, they put themselves into a state of war with the people... by this breach of trust they forfeit the power the people had put into their hands.',
            '洛克《政府论（下篇）》第 19 章 §222'
          ]
        ]
      }
    ]
  },
  {
    id: 52,
    slug: 'minest_rousseau',
    title: '卢梭 · 公意理论',
    philosopher: '让-雅克·卢梭',
    concept: '公意（Volonté Générale）与众意（Volonté de Tous）',
    categoryGroup: '二、伦理学与政治哲学（47–56）',
    tags: ['政治哲学', '社会'],
    playSummary: '模拟群体决策，比较私人利益与共同利益',
    levelsSummary: '① 人生而自由与社会契约 · ② 公意 vs 众意（向量抵消） · ③ 派系结党对公意的扭曲',
    source: '《社会契约论》（Cole 英译本）',
    quoteCount: 8,
    thumbType: 'rousseau',
    coreQuestion: '“公意（General Will）”和“所有人的私意加总（Will of All）”到底有什么本质区别？',
    boundaryNote: '卢梭认为公意不是简单的多数票统计，而是当公民以“公共共同利益”为追问对象、且没有小集团秘密结党操纵时显现的主权意志。',
    stages: [
      {
        id: 1,
        tabLabel: '① 自由与共同体契约',
        instructionTitle: '① 社会契约的根本课题 · 调节公民向共同体让渡权利的程度，观察“每个人同全体结合却仍只服从自己”',
        sliders: [
          { key: 'bondDegree', label: '向共同体同等让渡与结合程度', min: 0, max: 100, step: 5, defaultValue: 30, unit: '%' }
        ],
        mappings: [
          [
            '观察初始状态（结合度 < 50%）：个体受制于枷锁与强者支配',
            '人生而自由，却无往不在枷锁之中。自以为是其他一切的主人的人，反而比其他一切更是奴隶。',
            'Man is born free; and everywhere he is in chains. One thinks himself the master of others, and still remains a greater slave than they.',
            '卢梭《社会契约论》第 1 卷第 1 章'
          ],
          [
            '将“向共同体同等让渡与结合程度”推至 95% 以上：所有公民在同等条件下结合为主权共同体',
            '“要寻找出一种结合的形式，使它能以全部共同的力量来卫护和保障每个结合者的人身和财富，并且由于这一结合而使每一个与全体相联合的个人又只不过是在服从自己本人，并且仍然像以往一样地自由。”这就是社会契约所要解决的根本问题。',
            'To find a form of association which will defend and protect with the whole common force the person and goods of each associate, and in which each, while uniting himself with all, may still obey himself alone, and remain as free as before.',
            '卢梭《社会契约论》第 1 卷第 6 章'
          ]
        ]
      },
      {
        id: 2,
        tabLabel: '② 公意 vs 众意',
        instructionTitle: '② 公意 vs 众意 · 切换公民投票时的着眼点（各自私利 vs 公共利益），观察偏私向量如何互相抵消留下公意',
        choices: [
          {
            key: 'voteFocus',
            label: '公民审议与投票的导向',
            defaultValue: 'private_sum',
            options: [
              { value: 'private_sum', label: '众意（Will of All）：每人只盘算自己的私利，简单相加' },
              { value: 'cancel_out', label: '向量抵消：从个别意志中除去互相抵消的正负极端偏私' },
              { value: 'general_will', label: '公意（General Will）：每人追问“何者真正符合共同体的公共利益”' }
            ]
          }
        ],
        mappings: [
          [
            '在“众意”与“公意”之间切换：对比杂乱拉扯的私利箭头与指向圆心的公意合力',
            '众意与公意之间经常有很大的差别；公意只着眼于公共的利益，而众意则着眼于私人的利益，众意不过是个别意志的总和。',
            'There is often a great deal of difference between the will of all and the general will; the latter considers only the common interest, while the former takes private interest into account, and is no more than a sum of particular wills.',
            '卢梭《社会契约论》第 2 卷第 3 章'
          ],
          [
            '切换到“向量抵消”：观察左偏与右偏的私利分量相消，显露出中间的共同利益',
            '但是，除掉这些个别意志间正负相抵消的部分而外，则剩下的总和仍然是公意。',
            'But take away from these same wills the pluses and minuses that cancel one another, and the general will remains as the sum of the differences.',
            '卢梭《社会契约论》第 2 卷第 3 章'
          ]
        ]
      },
      {
        id: 3,
        tabLabel: '③ 派系集团与公意失真',
        instructionTitle: '③ 派系与小团体 · 调节共同体内部的“利益集团结党程度”，观察垄断大派系如何劫持公意',
        sliders: [
          { key: 'factionLevel', label: '利益派系抱团与操控度', min: 0, max: 100, step: 5, defaultValue: 15, unit: '%' }
        ],
        choices: [
          {
            key: 'factionRule',
            label: '共同体制度设计',
            defaultValue: 'no_factions',
            options: [
              { value: 'no_factions', label: '无派系独立审议：每个公民独立表达自己的判断' },
              { value: 'big_faction', label: '巨型利益集团垄断：一个大派系压倒其余所有人' },
              { value: 'many_factions', label: '分散制衡：若无法消除派系，则使其数量增多并保持力量均等' }
            ]
          }
        ],
        mappings: [
          [
            '选择“巨型利益集团垄断”或将派系操控度拉高至 75% 以上：观察公意退化为特殊集团私意',
            '当人民具有充分的信息并进行审议时，如果公民之间没有任何勾结，那么从大量微小的差异中就总会产生公意……但一旦形成了派系和小集团，每一个小集团的意志对它的成员来说就成了公意，而对国家来说则成了个别意志。',
            'When factions arise, and partial associations are formed at the expense of the great association, the will of each of these associations becomes general in relation to its members, while it remains particular in relation to the State.',
            '卢梭《社会契约论》第 2 卷第 3 章'
          ],
          [
            '切换到“无派系独立审议”或“分散制衡”：恢复公意的清晰显现',
            '要使公意能够很好地表达出来，最重要的是国家之内不能有派系存在，并且每个公民只能表示自己的意见；如果有派系存在的话，就应该增多派系的数目并防止它们之间不平等。',
            'It is therefore essential, if the general will is to be able to express itself, that there should be no partial society within the State, and that each citizen should think only his own thoughts.',
            '卢梭《社会契约论》第 2 卷第 3 章'
          ]
        ]
      }
    ]
  },
  {
    id: 53,
    slug: 'minest_nozick_entitlement',
    title: '诺齐克 · 权利与分配',
    philosopher: '罗伯特·诺齐克',
    concept: '持有正义三原则与张伯伦论证',
    categoryGroup: '二、伦理学与政治哲学（47–56）',
    tags: ['政治哲学', '伦理学'],
    playSummary: '通过自愿交换改变资源分配',
    levelsSummary: '① 历史原则 vs 模式化原则 · ② 张伯伦买票看球实验 · ③ 强制重分配与矫正正义',
    source: '《无政府、国家与乌托邦》（据 SEP《Robert Nozick’s Political Philosophy》转引）',
    quoteCount: 8,
    thumbType: 'nozick',
    coreQuestion: '如果大家从一个你认为最理想的平等分配（D₁）出发，通过成千上万次完全自愿的买票和交换变成了不平等的 D₂，那么 D₂ 是不正义的吗？',
    boundaryNote: '诺齐克的权利理论（Entitlement Theory）属于历史性的、非模式化的正义原则：只要获取正当、转让自愿（或经过对历史不义的矫正），结果分配无论呈何种形状皆为正义。',
    stages: [
      {
        id: 1,
        tabLabel: '① 持有正义三原则',
        instructionTitle: '① 持有正义三原则 · 检验资源链条中的“最初获取”与“转让过程”，对比历史原则与终端切片原则',
        choices: [
          {
            key: 'chainHistory',
            label: '财产持有的历史来源链条',
            defaultValue: 'clean_chain',
            options: [
              { value: 'clean_chain', label: '正当获取 → 自愿交换 → 自愿赠与（清白历史链）' },
              { value: 'stolen_link', label: '暴力掠夺 / 欺诈侵占 → 转手交易（受污染历史链）' },
              { value: 'rectified', label: '启动“矫正原则”：追溯历史不义并向受害方补偿复原' }
            ]
          }
        ],
        mappings: [
          [
            '查看“正当获取 → 自愿交换 → 自愿赠与（清白历史链）”',
            '如果世界是完全正义的，下列归纳定义就穷尽了持有正义的领域：（1）按获取正义原则获得持有的人对该持有是有权利的；（2）按转让正义原则从对该持有有权利的人那里获得持有的人，对该持有是有权利的。',
            'A distribution is just if it arises from another just distribution by legitimate means: justice in acquisition and justice in transfer.',
            '据 SEP《Robert Nozick’s Political Philosophy》§2'
          ],
          [
            '切换到“暴力掠夺”再切换到“启动矫正原则”',
            '由于过去的强取、欺诈等不义行为确实发生过，因此需要第三条原则——对持有中的不义进行矫正的原则（Rectification of Injustice）。',
            'The principle of rectification of injustice deals with holdings that were unjustly acquired or transferred.',
            '据 SEP《Robert Nozick’s Political Philosophy》§2'
          ]
        ]
      },
      {
        id: 2,
        tabLabel: '② 张伯伦论证（自由颠覆模式）',
        instructionTitle: '② 张伯伦论证 · 从绝对平等分配 D₁ 出发，拖动“自愿投币买票看球球迷人数”，观察自由交换如何打破平等模式',
        sliders: [
          { key: 'fansCount', label: '自愿向张伯伦投 25 美分看球的球迷数', min: 0, max: 100, step: 5, defaultValue: 0, unit: ' 万人' }
        ],
        buttons: [
          { key: 'enforcePattern', label: '⚖ 强行恢复 D₁ 平等模式（没收门票收入）', accent: 'red' }
        ],
        mappings: [
          [
            '将“自愿投币看球的球迷数”从 0 拖到 100 万人：张伯伦获得 25 万美元，从平等 D₁ 演变为 D₂',
            '从任何一种受偏爱的分配模式 D₁ 出发，只要人们自愿地把自己的正当份额拿出一小部分去交换观看张伯伦打球，就会产生新的分配 D₂。既然 D₁ 是正义的，且每一步转移都是完全自愿的，D₂ 怎么会是不正义的呢？',
            'Whatever arises from a just situation by just steps is itself just.',
            '据 SEP《Robert Nozick’s Political Philosophy》§2.2（Wilt Chamberlain Argument）'
          ],
          [
            '点击“强行恢复 D₁ 平等模式”：观察为了维持固定模式必须不断干预成年人之间的自愿交换',
            '自由会颠覆模式（Liberty upsets patterns）：任何模式化的或终态的分配原则，如果不持续不断地干涉人们的生活、禁止成年人之间的资本主义式自愿行为，就无法维持下去。',
            'No end-state principle or distributional patterned principle of justice can be continuously realized without continuous interference with people’s lives.',
            '据 SEP《Robert Nozick’s Political Philosophy》§2.2'
          ]
        ]
      },
      {
        id: 3,
        tabLabel: '③ 自我所有权与最小国家',
        instructionTitle: '③ 自我所有权与国家职能 · 切换国家权力范围，比较“守夜人最小国家”与“强制再分配国家”',
        choices: [
          {
            key: 'stateRole',
            label: '国家职能边界设定',
            defaultValue: 'minimal',
            options: [
              { value: 'minimal', label: '最小国家（守夜人）：仅保护免受暴力、偷盗、欺诈并执行契约' },
              { value: 'redistribute', label: '扩张国家：对劳动工时征税以维持某种固定的结果分配模式' }
            ]
          }
        ],
        mappings: [
          [
            '选择“最小国家（守夜人）”：保护个人权利而不侵犯自我所有权',
            '个人拥有权利；有些事情是任何个人或团体都不能对他们做的，做了就要侵犯他们的权利。因此，只有仅限于防止暴力、偷盗、欺诈和强制履行契约的“最小国家”才是得到辩护的。',
            'Individuals have rights, and there are things no person or group may do to them without violating their rights... The minimal state is the most extensive state that can be justified.',
            '据 SEP《Robert Nozick’s Political Philosophy》§1'
          ],
          [
            '切换到“扩张国家：对劳动工时征税”：观察诺齐克关于劳动收入税与强制劳动的类比论证',
            '诺齐克从自我所有权出发认为，强制拿走一个人 n 小时劳动的成果，在道德上类似于强迫他为别人的目的工作 n 小时。',
            'Taxation of earnings from labor is on a par with forced labor, because it gives others a partial property right in the person’s time and effort.',
            '据 SEP《Robert Nozick’s Political Philosophy》§2.3'
          ]
        ]
      }
    ]
  },
  {
    id: 54,
    slug: 'minest_sen_capability',
    title: '阿玛蒂亚·森 · 能力方法',
    philosopher: '阿玛蒂亚·森',
    concept: '功能性活动（Functionings）、可行能力（Capabilities）与转换因素',
    categoryGroup: '二、伦理学与政治哲学（47–56）',
    tags: ['伦理学', '政治哲学', '社会'],
    playSummary: '调整教育、健康、资源和社会条件',
    levelsSummary: '① 商品资源 vs 转换因素 · ② 功能性活动 vs 可行能力（斋戒与饥荒） · ③ 实质自由的多维扩展',
    source: '《以自由看待发展》《不平等的再考察》（据 SEP《The Capability Approach》转引）',
    quoteCount: 8,
    thumbType: 'sen',
    coreQuestion: '给两个人完全相同数量的金钱或一辆自行车（资源平等），他们就能享有同样的实质自由吗？',
    boundaryNote: '能力方法超越了单纯以 GDP/收入（商品拜物教）或主观效用（适应性偏好）衡量福祉的局限，聚焦于人“有理由珍视去过那种生活的实质自由”。',
    stages: [
      {
        id: 1,
        tabLabel: '① 资源与转换因素',
        instructionTitle: '① 商品 → 转换因素 → 能力 · 给不同处境的居民配置相同商品（自行车/收入），调节个人、社会与环境转换因素',
        sliders: [
          { key: 'resourceInput', label: '配给商品资源（收入 / 自行车）', min: 20, max: 100, step: 10, defaultValue: 60, unit: ' 单位' },
          { key: 'socialAccess', label: '公共无障碍设施与社会制度支持', min: 0, max: 100, step: 5, defaultValue: 30, unit: '%' }
        ],
        choices: [
          {
            key: 'personProfile',
            label: '个体身体与社会处境',
            defaultValue: 'abled',
            options: [
              { value: 'abled', label: '居民甲：身体健全、道路平坦' },
              { value: 'wheelchair', label: '居民乙：行动障碍者（需要无障碍坡道与辅助设施）' },
              { value: 'restricted', label: '居民丙：受偏见限制外出或受教育的女性' }
            ]
          }
        ],
        mappings: [
          [
            '保持资源相同（60 单位），在“居民甲”与“居民乙（行动障碍者）”之间切换：观察相同的资源转化出的出行能力截然不同',
            '商品或收入只是手段而非目的；一个人把商品或收入转化为美好生活功能的能力，极大地受到个人生理条件、社会规范和环境等“转换因素”的影响。',
            'The relation between a good and the achievement of certain beings and doings is captured with the term "conversion factor".',
            '据 SEP《The Capability Approach》§2.3'
          ],
          [
            '在“居民乙”或“居民丙”下，将“公共无障碍设施与社会制度支持”提升至 85% 以上：可行能力空间显著扩大',
            '评估正义与平等不应仅仅盯着人们占有多少“基本善”或资源，而要看人们实际能够做到什么和成为什么（What they are able to do and to be）。',
            'What matters to people is that they are able to achieve actual functionings, that is, the actual living that people manage to achieve.',
            '据 SEP《The Capability Approach》§2'
          ]
        ]
      },
      {
        id: 2,
        tabLabel: '② 功能 vs 可行能力（斋戒与挨饿）',
        instructionTitle: '② 功能性活动（Functioning） vs 可行能力集（Capability Set） · 比较同样“没有进食”的苦行斋戒者与饥荒灾民',
        choices: [
          {
            key: 'fastingCase',
            label: '两个同样处于“今日未进食”状态的个体',
            defaultValue: 'starving',
            options: [
              { value: 'starving', label: '饥荒灾民：粮仓空虚，被迫挨饿（可行能力集 = {挨饿}）' },
              { value: 'fasting', label: '甘地式斋戒者：有充足食物但自愿选择斋戒（可行能力集 = {进食, 斋戒}）' }
            ]
          }
        ],
        mappings: [
          [
            '对比“饥荒灾民”与“自愿斋戒者”：两人实现的“营养摄入功能”相同，但选择空间（可行能力集）天差地别',
            '一个自愿斋戒的人和一个因为贫穷而不得不挨饿的人，在“营养缺乏”这一最终功能性活动（functioning）上看起来是一样的；但第一个人拥有“本可以选择吃饱”的可行能力（capability），而第二个人没有。',
            'Fasting is not the same thing as being forced to starve. Having the option to eat makes fasting what it is: choosing not to eat when one could have eaten.',
            '据 SEP《The Capability Approach》§2.1（Sen 1992）'
          ],
          [
            '观察画布右侧的“可行能力自由空间”圆环：斋戒者拥有多种生活组合的选择自由',
            '“可行能力”是一个人有可能实现的各种功能性活动组合，因此它实质上是一种自由——能过某种有理由珍视的生活的实质自由。',
            'Capabilities are a person’s real freedoms or opportunities to achieve functionings.',
            '据 SEP《The Capability Approach》§2.1'
          ]
        ]
      },
      {
        id: 3,
        tabLabel: '③ 发展即自由',
        instructionTitle: '③ 多维能力扩展 · 同时调节基础教育、公共医疗与政治参与权利，观察五种工具性自由如何相互强化',
        sliders: [
          { key: 'eduLevel', label: '基础教育与识字率保障', min: 10, max: 100, step: 5, defaultValue: 40, unit: '%' },
          { key: 'healthLevel', label: '公共医疗与营养保障', min: 10, max: 100, step: 5, defaultValue: 40, unit: '%' },
          { key: 'civicVoice', label: '政治参与、新闻监督与社会透明', min: 10, max: 100, step: 5, defaultValue: 40, unit: '%' }
        ],
        mappings: [
          [
            '将基础教育、公共医疗与政治参与三项同时提升至 75% 以上：观察个体可行能力多边形全面撑开',
            '发展可以看作是扩展人们享有的真实自由的一个过程；自由不仅是发展的首要目的，也是发展的主要手段。',
            'Development can be seen as a process of expanding the real freedoms that people enjoy.',
            '据 SEP《The Capability Approach》引 Sen 1999'
          ],
          [
            '保持高收入但将教育和政治参与压低至 20%：观察“高增长低能力”的失衡陷阱',
            '我们需要超越对国民生产总值增长或个人收入提高的狭隘关注，去消除那些束缚人们可行能力的“不自由”根源：贫困、暴政、经济机会缺乏、系统性社会剥夺以及公共设施的忽视。',
            'Development requires the removal of major sources of unfreedom: poverty as well as tyranny, poor economic opportunities as well as systematic social deprivation.',
            '据 SEP《The Capability Approach》引 Sen 1999'
          ]
        ]
      }
    ]
  },
  {
    id: 55,
    slug: 'minest_gilligan_care',
    title: '吉利根 · 关怀伦理',
    philosopher: '卡罗尔·吉利根',
    concept: '不同的声音（In a Different Voice）：正义视角 vs 关怀视角',
    categoryGroup: '二、伦理学与政治哲学（47–56）',
    tags: ['伦理学', '社会'],
    playSummary: '在关系网络中探索责任、依赖与关怀',
    levelsSummary: '① 海因茨偷药困境的两种声音 · ② 关系之网（Web of Relationships） · ③ 关怀伦理三阶段成熟',
    source: '《不同的声音》（据 SEP《Feminist Ethics》转引）',
    quoteCount: 8,
    thumbType: 'gilligan',
    coreQuestion: '道德推理只有“抽象权利排序与规则算术（正义视角）”这一把尺子吗？“维系具体关系、不让任何人孤立无援（关怀视角）”是不是同样成熟的道德声音？',
    boundaryNote: '吉利根强调“关怀之声”与“正义之声”并非绝对按生理性别一刀切，而是人类道德经验中两种互补且同样重要的视角（如同鸭兔双歧图）。',
    stages: [
      {
        id: 1,
        tabLabel: '① 两种道德声音（杰克与艾米）',
        instructionTitle: '① 海因茨困境的两种重构 · 在“正义/权利层级模型（杰克）”与“关系/沟通网络模型（艾米）”之间切换，观察问题如何被不同地框定',
        choices: [
          {
            key: 'moralVoice',
            label: '看待海因茨“没钱买天价药救妻子”困境的视角',
            defaultValue: 'justice_jack',
            options: [
              { value: 'justice_jack', label: '正义视角（杰克）：数学逻辑式的权利排序（生命权 > 财产权）' },
              { value: 'care_amy', label: '关怀视角（艾米）：断裂的关系网络（药剂师若拒绝沟通，关系便破裂）' },
              { value: 'dialogue_bridge', label: '持续对话与关系修复：不仅关注“偷不偷”，更关注妻子与药剂师的连接' }
            ]
          }
        ],
        mappings: [
          [
            '对比“正义视角（杰克）”与“关怀视角（艾米）”：前者把困境看作抽象权利的逻辑冲突，后者看作人际纽带的断裂',
            '科尔伯格传统将道德问题视为由规则和权利层级来裁决的逻辑数学问题；而“不同的声音”则将道德问题视为关系网络中的破裂，需要通过沟通与关怀责任来维系连接。',
            'While an ethic of justice proceeds from the premise of equality—that everyone should be treated the same—an ethic of care rests on the premise of nonviolence—that no one should be hurt.',
            '据 SEP《Feminist Ethics》§2.2（Gilligan 1982）'
          ],
          [
            '切换到“持续对话与关系修复”：观察药剂师、海因茨与妻子之间的网络重新连通',
            '艾米没有把问题看作是“财产权与生命权谁更高”的封闭选择题，而是追问：为什么药剂师不肯倾听？如果海因茨坐牢了，生病的妻子由谁来继续照料？',
            'She sees a world comprised of relationships rather than of people standing alone, a world that coheres through human connection rather than through systems of rules.',
            '据 SEP《Feminist Ethics》§2.2'
          ]
        ]
      },
      {
        id: 2,
        tabLabel: '② 关系之网（Web）与层级之梯（Ladder）',
        instructionTitle: '② 层级之梯 vs 关系之网 · 拉扯网络中的节点，体验当一个节点陷入脆弱时，责任如何沿关系丝线传递',
        sliders: [
          { key: 'nodeDistress', label: '关系网中脆弱他者的求助强度', min: 10, max: 100, step: 5, defaultValue: 50, unit: '%' },
          { key: 'careResponse', label: '倾听与关系回应张力', min: 0, max: 100, step: 5, defaultValue: 40, unit: '%' }
        ],
        mappings: [
          [
            '提高“脆弱他者的求助强度”并将“倾听与关系回应张力”调至 75% 以上：网络丝线发光并共同分担重力',
            '人类并非生来就是孤立自足的原子契约者，而是始终嵌入在相互依赖、脆弱性与照料的关系网络之中。',
            'Care ethics conceptualizes persons as deeply relational and interdependent rather than as self-sufficient, isolated atoms.',
            '据 SEP《Feminist Ethics》§2.2'
          ],
          [
            '将“倾听与关系回应张力”降至 10% 以下：观察关系网出现断裂缺口',
            '对关怀伦理而言，最大的道德失败不是违反了某条抽象的形式公理，而是在他人需要回应时转身离去、任由关系纽带断裂。',
            'Moral failure in the care perspective is the failure to respond, leaving others abandoned or disconnected within the web of relationships.',
            '据 SEP《Feminist Ethics》§2.2'
          ]
        ]
      },
      {
        id: 3,
        tabLabel: '③ 关怀的成熟（超越自我牺牲）',
        instructionTitle: '③ 关怀伦理的三阶段 · 调节“对自我的关怀”与“对他人的关怀”，走出“自私”与“盲目自我抹杀”两个极端',
        sliders: [
          { key: 'selfCare', label: '对自我的照料与诚实 (Self-Care)', min: 0, max: 100, step: 5, defaultValue: 20, unit: '%' },
          { key: 'otherCare', label: '对他人的照料与责任 (Other-Care)', min: 0, max: 100, step: 5, defaultValue: 85, unit: '%' }
        ],
        mappings: [
          [
            '尝试极端一（自我 > 75%，他人 < 25%：仅求自保）或极端二（自我 < 25%，他人 > 75%：把传统自我牺牲当成唯一善）',
            '关怀伦理的发展经历了从最初“为求生存而过度关注自我”，到第二阶段“把善等同于无条件的自我牺牲”，直至意识到不顾自我的牺牲同样也是一种对关系的伤害。',
            'The second stage equates goodness with self-sacrifice, creating a disequilibrium between self and others.',
            '据 SEP《Feminist Ethics》§2.2'
          ],
          [
            '将“对自我的照料”与“对他人的照料”同时调节至均衡高位（均在 65%–90% 之间）：达成成熟的相互关怀',
            '在成熟的第三阶段，“不伤害”的道德律令把自我也同样纳入关怀之网中：你我也都是相互依赖关系中的一员，成熟的关怀消解了自私与自我牺牲之间的虚假对立。',
            'In the mature third stage, the injunction against hurting includes the self as well as others, recognizing the interconnection between other and self.',
            '据 SEP《Feminist Ethics》§2.2'
          ]
        ]
      }
    ]
  },
  {
    id: 56,
    slug: 'minest_macintyre',
    title: '麦金太尔 · 实践与德性',
    philosopher: '阿拉斯代尔·麦金太尔',
    concept: '社会实践（Practice）、内部善（Internal Goods）与外在善（External Goods）',
    categoryGroup: '二、伦理学与政治哲学（47–56）',
    tags: ['伦理学', '政治哲学', '社会'],
    playSummary: '在实践共同体中探索内部善与德性培养',
    levelsSummary: '① 糖果下棋的孩子（内部善 vs 外在善） · ② 实践与制度的张力 · ③ 叙事统一性与传统',
    source: '《追寻美德》（After Virtue，据 SEP《Alasdair MacIntyre》转引）',
    quoteCount: 8,
    thumbType: 'macintyre',
    coreQuestion: '为了赢取 50 美分糖果而下国际象棋（甚至为此作弊），与真正领悟棋艺精妙而下棋，这两种行为追求的“善”有何根本不同？',
    boundaryNote: '麦金太尔区分了“实践”（如棋艺、科学探索、医学、绘画，追求内部卓越标准）与维持实践所需的“制度”（如医院行政、棋协、大学官僚体系，分配金钱、权力与名声等外在善）。',
    stages: [
      {
        id: 1,
        tabLabel: '① 下棋的孩子（内部善 vs 外在善）',
        instructionTitle: '① 国际象棋教局 · 调节孩子对“糖果奖金（外在善）”与“棋艺精妙（内部善）”的动机比重，观察他是否还会想要作弊',
        sliders: [
          { key: 'candyDrive', label: '对糖果/奖金（外在善）的渴望', min: 0, max: 100, step: 5, defaultValue: 85, unit: '%' },
          { key: 'chessLove', label: '对棋艺布局精妙（内部善）的领悟', min: 0, max: 100, step: 5, defaultValue: 15, unit: '%' }
        ],
        mappings: [
          [
            '保持“对糖果/奖金的渴望” > 70% 且“对棋艺精妙的领悟” < 30%：观察孩子有充分动机通过作弊获取糖果',
            '如果孩子下棋仅仅是为了赢得价值 50 美分的糖果，那么只要他能作弊而不被发现，他就没有任何理由不作弊；因为糖果和金钱是“外在善”，可以通过许多别的途径（甚至作弊）获得。',
            'So long as it is the candy alone which provides the child with a good reason for playing chess, the child has no good reason not to cheat, provided he or she can do so successfully.',
            '据 SEP《Political Philosophy of Alasdair MacIntyre》转引《After Virtue》ch. 14'
          ],
          [
            '将“对棋艺布局精妙（内部善）的领悟”提升至 75% 以上：作弊动机归零，因为作弊只会欺骗自己、让自己无法获得棋艺本身的内在卓越',
            '但总有那么一个时刻，孩子开始被国际象棋特有的精妙、分析想象力与竞技智慧所吸引——这些就是棋艺实践的“内部善”；一旦追求内部善，作弊就等于让自己输掉了真正想要的东西。',
            'Internal goods can only be identified and recognized by the experience of participating in the practice in question; if the child cheats, he will be defeating not me, but himself.',
            '据 SEP《Political Philosophy of Alasdair MacIntyre》转引《After Virtue》ch. 14'
          ]
        ]
      },
      {
        id: 2,
        tabLabel: '② 实践、德性与制度腐蚀',
        instructionTitle: '② 实践（Practices） vs 制度（Institutions） · 调节制度的外部竞争压力与共同体的德性护盾（正义、勇敢、诚实）',
        sliders: [
          { key: 'instPressure', label: '制度对金钱、排名与权力的追逐压力', min: 10, max: 100, step: 5, defaultValue: 70, unit: '%' },
          { key: 'virtueShield', label: '实践共同体的德性坚守（诚实 · 正义 · 勇敢）', min: 0, max: 100, step: 5, defaultValue: 35, unit: '%' }
        ],
        mappings: [
          [
            '当“制度追逐压力” > 70% 且“德性坚守” < 40% 时：观察医学/学术/艺术实践的核心被外在利益侵蚀',
            '外在善（金钱、权力、地位）总是某一个人的私产，一个人占有多了别人就少（零和竞争）；而内部善的实现则是整个实践共同体的福祉。制度虽然支撑实践，却时刻具有腐蚀实践的危险。',
            'External goods are characteristically objects of competition in which there must be losers as well as winners. Internal goods are indeed the outcome of competition to excel, but their achievement is a good for the whole community.',
            '据 SEP《Political Philosophy of Alasdair MacIntyre》§2'
          ],
          [
            '将“实践共同体的德性坚守”提升至 80% 以上：成功抵御制度的腐蚀，守护实践的内部卓越标准',
            '德性是一种获得性的人类品质，对它的拥有和践行能够使我们获得那些内在于实践的善，而缺乏它则会有效地阻碍我们获得任何这一类的善，并使实践无法抵御制度的腐蚀力量。',
            'A virtue is an acquired human quality the possession and exercise of which tends to enable us to achieve those goods which are internal to practices and the lack of which effectively prevents us from achieving any such goods.',
            '麦金太尔《追寻美德》第 14 章核心定义'
          ]
        ]
      },
      {
        id: 3,
        tabLabel: '③ 人生的叙事统一性与传统',
        instructionTitle: '③ 叙事性的自我 · 连接人生在不同角色（家庭、职业、城邦）中的实践片段，并在活的传统中开展追寻',
        choices: [
          {
            key: 'selfView',
            label: '理解人类行动与自我的框架',
            defaultValue: 'fragmented',
            options: [
              { value: 'fragmented', label: '现代碎片化自我：工作、家庭、休闲各自割裂，只有任意的情感偏好' },
              { value: 'narrative_quest', label: '叙事统一性与传统：将一生视为在历史传统中对“何为良善生活”的统一追寻（Quest）' }
            ]
          }
        ],
        mappings: [
          [
            '在“现代碎片化自我”与“叙事统一性与传统”之间切换：观察孤立的行动碎片如何连成一条可理解的生命叙事弧线',
            '只有当我弄清楚“我属于哪一个或哪几个故事”之后，我才能回答“我应当做什么”。人的自我同一性就建立在从出生到死亡的叙事统一性之上。',
            'I can only answer the question "What am I to do?" if I can answer the prior question "Of what story or stories do I find myself a part?"',
            '据 SEP《Political Philosophy of Alasdair MacIntyre》转引《After Virtue》ch. 15'
          ],
          [
            '点亮“叙事统一性与传统”中的历史脉络节点',
            '一个活的传统（Living Tradition）绝不是僵死的教条，而是一场延伸在历史中的、有社会体现的争论，争论的恰恰是构成该传统的那些善到底是什么。',
            'A living tradition then is an historically extended, socially embodied argument, and an argument precisely in part about the goods which constitute that tradition.',
            '据 SEP《Political Philosophy of Alasdair MacIntyre》转引《After Virtue》ch. 15'
          ]
        ]
      }
    ]
  }
];
