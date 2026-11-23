import { PhilosophyModel } from '../types/philosophy';

export const MODELS_67_TO_76: PhilosophyModel[] = [
  {
    id: 67,
    slug: 'minest_austin_speech',
    title: '奥斯汀 · 言语行为理论',
    philosopher: '约翰·朗肖·奥斯汀',
    concept: '以言行事（Illocutionary Act）、施为句与适切条件',
    categoryGroup: '四、语言、解释与社会哲学（67–76）',
    tags: ['语言', '社会', '逻辑'],
    playSummary: '在不同情境中说出同一句话，观察其执行的社会行为',
    levelsSummary: '① 述谓句 vs 施为句（说话即做事） · ② 言语行为三分法 · ③ 适切条件与失灵（Misfires）',
    source: '《如何以言行事》（How to Do Things with Words，据 SEP《Speech Acts》转引）',
    quoteCount: 6,
    thumbType: 'austin',
    coreQuestion: '说话难道只是在“描述世界上的真假事实”吗？为什么当船长砸碎香槟说“我命名此船为伊丽莎白女王号”时，他不是在汇报一件事，而是当场做成了这件事？',
    boundaryNote: '奥斯汀指出，施为句（Performatives）没有简单的“真/假”之分，但有赖于特定的制度规约、说话人资格与情境——若条件不满足，行为便会“失灵（Misfire）”或“滥用（Abuse）”。',
    stages: [
      {
        id: 1,
        tabLabel: '① 说话即做事（施为句）',
        instructionTitle: '① 述谓句 vs 施为句 · 在婚礼、新船命名礼或普通天气陈述中点击“当场说出这句话”，观察语言如何当场改变社会实在',
        choices: [
          {
            key: 'utteranceScene',
            label: '选择话语与社会仪式情境',
            defaultValue: 'ship_naming',
            options: [
              { value: 'ship_naming', label: '新船下水礼：“我命名这艘船为伊丽莎白女王号”（并掷碎香槟瓶）' },
              { value: 'wedding_vow', label: '婚礼现场：“我愿意娶/嫁她（他）为合法伴侣”' },
              { value: 'pure_report', label: '普通描述句（述谓句）：“今天窗外正在下雨”（仅有真假，不创立新契约）' }
            ]
          }
        ],
        buttons: [
          { key: 'speakNow', label: '🗣 当场说出这句话（Perform Utterance）', accent: 'amber' }
        ],
        mappings: [
          [
            '选择“新船下水礼”或“婚礼现场”并点击“当场说出这句话”：观察船只正式获名或婚姻关系当场确立',
            '有许多话语，说出它们并不是在描述我在做什么，说出这句话本身就是在做那件事（施为句 Performative）。',
            'To utter the sentence (in, of course, the appropriate circumstances) is not to describe my doing of what I should be said in so uttering to be doing or to state that I am doing it: it is to do it.',
            '奥斯汀《如何以言行事》第 1 讲（据 SEP《Speech Acts》§1 转引）'
          ],
          [
            '切换到“普通描述句（述谓句）”再对比施为句',
            '当我们说“我道歉”“我承诺”“我打赌五个先令”时，我们并不是在汇报一个事实，而是在借着发声完成道歉、承诺或打赌这一社会行为。',
            'In saying what I do, I actually perform that action.',
            '据 SEP《Speech Acts》§1'
          ]
        ]
      },
      {
        id: 2,
        tabLabel: '② 言内、言中与言后行为',
        instructionTitle: '② 一句话的三个维度 · 针对同一句话“冰面很薄！”，切换观察它的言内意义（Locution）、言中力量（Illocution）与言后效果（Perlocution）',
        choices: [
          {
            key: 'actDimension',
            label: '剖析同一句话“湖面上的冰很薄！”的三个层面',
            defaultValue: 'locution',
            options: [
              { value: 'locution', label: '① 言内行为（Locutionary Act）：发出语音、合乎语法并指涉“湖冰厚度”字面意义' },
              { value: 'illocution', label: '② 言中行为（Illocutionary Act）：说话人以言行事的力量——发出“警告 / 劝阻”' },
              { value: 'perlocution', label: '③ 言后行为（Perlocutionary Act）：在听者身上实际引发的后果——使其退回岸边' }
            ]
          }
        ],
        mappings: [
          [
            '从“① 言内行为”切换到“② 言中行为”：观察同一字面命题在语境下承担“警告”的语力',
            '说出具有确定意义与指称的词句是“言内行为”；在说这句话时所实施的如告知、命令、警告、承诺等具有特定约定力量的行为，是“言中行为（以言行事）”。',
            'We thus performed a locutionary act, and we also performed an illocutionary act, such as informing, ordering, warning, undertaking, etc.',
            '奥斯汀《如何以言行事》第 9 讲（据 SEP《Speech Acts》§2 转引）'
          ],
          [
            '切换到“③ 言后行为”：观察听者受到警示并退回岸边的实际后果',
            '通过说出这句话而在听众的感情、思想或行动上实际产生某种后果（如说服、威慑、惊吓），这被称为“言后行为（以言取效）”。',
            'What we bring about or achieve by saying something, such as convincing, persuading, deterring, we call the perlocutionary act.',
            '奥斯汀《如何以言行事》第 9 讲（据 SEP 转引）'
          ]
        ]
      },
      {
        id: 3,
        tabLabel: '③ 适切条件与失灵（Misfires）',
        instructionTitle: '③ 为什么不是谁说“我命名此船”都能算数？ · 切换说话人资格、仪式程序与内心诚意，观察施为句何时成功（Happy）、何时失灵（Misfire）或滥用（Abuse）',
        choices: [
          {
            key: 'felicityCase',
            label: '言语行为的情境与条件设定',
            defaultValue: 'happy_valid',
            options: [
              { value: 'happy_valid', label: '适切成功（Felicitous）：受权主持人在正式仪式上依规宣布命名' },
              { value: 'misfire_passerby', label: '失灵（Misfire / 无效）：路人甲冲上码头抢酒瓶砸船大喊“我命名此船为斯大林号！”' },
              { value: 'abuse_insincere', label: '滥用（Abuse / 不诚实）：口头说“我承诺明天一定还钱”，心里却根本没打算还' }
            ]
          }
        ],
        mappings: [
          [
            '选择“失灵（Misfire）：路人甲冲上码头抢酒瓶命名”：观察由于说话人不具备约定资格，命名行为自始无效',
            '要使施为句顺利生效，必须存在被普遍接受的约定程序，且特定人员与环境必须恰当；否则行为就没有达成，叫做“失灵（Misfire）”。',
            'There must exist an accepted conventional procedure having a certain conventional effect, and the particular persons and circumstances in a given case must be appropriate.',
            '奥斯汀《如何以言行事》第 2 讲（据 SEP《Speech Acts》§1.2 转引）'
          ],
          [
            '切换到“滥用（Abuse / 不诚实）：口头承诺但毫无还款打算”',
            '如果程序要求参与者具有特定的思想、感情或履行意图（如承诺时的诚意），而说话人心里并无此意，便构成了不恰当的“滥用（Abuse）”。',
            'Where the procedure is designed for use by persons having certain thoughts or feelings, the person must in fact have those thoughts or feelings; otherwise the act is an abuse.',
            '据 SEP《Speech Acts》§1.2'
          ]
        ]
      }
    ]
  },
  {
    id: 68,
    slug: 'minest_searle_taxonomy',
    title: '塞尔 · 言语行为分类',
    philosopher: '约翰·塞尔',
    concept: '五大言语行为分类与“适应方向（Direction of Fit）”',
    categoryGroup: '四、语言、解释与社会哲学（67–76）',
    tags: ['语言', '逻辑', '社会'],
    playSummary: '将语句分类为断言、指令、承诺、表达等言语行为',
    levelsSummary: '① 适应方向（词适应世界 vs 世界适应词） · ② 五大以言行事类别归类 · ③ 构成性规则（X 算作 Y）',
    source: '《言语行为》《表达与意义》（据 SEP《Speech Acts》转引）',
    quoteCount: 6,
    thumbType: 'searle',
    coreQuestion: '人类语言看似有成千上万种用法，为什么塞尔认为“以言行事”在逻辑结构上总共只有五种基本类型？',
    boundaryNote: '塞尔用“适应方向（Direction of Fit）”——究竟是“让话语去符合既定世界（↓）”还是“改变世界去符合话语（↑）”——为言语行为建立了严密的分类学。',
    stages: [
      {
        id: 1,
        tabLabel: '① 适应方向（侦探与购物者）',
        instructionTitle: '① 安斯康姆超市比喻 · 切换“推车按清单买货的顾客”与“跟在后面记下买了什么的侦探”，比较两条清单与世界的“适应方向”',
        choices: [
          {
            key: 'fitRole',
            label: '超市里的两份清单（即使上面写的字一模一样）',
            defaultValue: 'detective_word2world',
            options: [
              { value: 'detective_word2world', label: '侦探的记录单（词 → 世界 ↓）：看顾客拿了什么才写什么；若写错则涂改清单（断言类）' },
              { value: 'shopper_world2word', label: '顾客的购物单（世界 → 词 ↑）：照着清单把货架上的商品放进推车（指令/承诺类）' },
              { value: 'declaration_double', label: '双向同时适应（词 ↔ 世界 ↕）：借由说出这句话本身，当场创造出与话语相符的制度现实（宣告类）' }
            ]
          }
        ],
        mappings: [
          [
            '在“侦探的记录单（词→世界 ↓）”与“顾客的购物单（世界→词 ↑）”之间切换',
            '有些以言行事旨在使话语去匹配独立存在的世界（从词到世界 ↓）；另一些则旨在使世界发生改变以匹配话语（从世界到词 ↑）。',
            'Some illocutions have as part of their illocutionary point to get the words to match the world, others to get the world to match the words.',
            '塞尔《以言行事行为分类》（据 SEP《Speech Acts》§3 转引）'
          ],
          [
            '切换到“双向同时适应（宣告类 ↕）”',
            '唯有“宣告类（Declarations）”拥有双向适应方向（↕）：通过成功实施这一言语行为本身，直接改变世界的状态使之与命题内容相一致。',
            'Declarations bring about some alternation in the status or condition of the referred to object solely in virtue of the fact that the declaration has been successfully performed.',
            '据 SEP《Speech Acts》§3（Searle 1975）'
          ]
        ]
      },
      {
        id: 2,
        tabLabel: '② 五大言语行为分类练习',
        instructionTitle: '② 五大类别归位 · 点击下列具体话语卡片，将其归入塞尔的五种基本以言行事行为类别中',
        draggables: [
          { id: 'assert_earth', label: '“地球围绕太阳公转。”', sub: '承诺命题为真（词→世界 ↓）', targetZone: 'assertives' },
          { id: 'direct_window', label: '“请把那扇窗户关上！”', sub: '试图让听者做某事（世界→词 ↑）', targetZone: 'directives' },
          { id: 'commiss_tomorrow', label: '“我保证明天早上九点准时交稿。”', sub: '约束说话人自己未来行动（世界→词 ↑）', targetZone: 'commissives' },
          { id: 'express_thanks', label: '“非常感谢你的慷慨相助！”', sub: '表达心理状态（无适应方向 ∅）', targetZone: 'expressives' },
          { id: 'declare_adjourn', label: '法官敲槌：“我宣布本庭休庭！”', sub: '言出法随，改变制度现实（双向 ↕）', targetZone: 'declarations' }
        ],
        dropZones: [
          { id: 'assertives', label: '断言类 (Assertives)', sub: '陈述/报告 ↓', color: '#3a6f99' },
          { id: 'directives', label: '指令类 (Directives)', sub: '命令/请求 ↑', color: '#e67e22' },
          { id: 'commissives', label: '承诺类 (Commissives)', sub: '许诺/发誓 ↑', color: '#2fa35a' },
          { id: 'expressives', label: '表达类 (Expressives)', sub: '道谢/祝贺 ∅', color: '#8e44ad' },
          { id: 'declarations', label: '宣告类 (Declarations)', sub: '任命/宣布 ↕', color: '#c0392b' }
        ],
        mappings: [
          [
            '将“地球围绕太阳公转”、“请把窗户关上”与“我保证明天准时交稿”分别归入断言类、指令类与承诺类',
            '断言类使说话人承担命题为真的责任；指令类试图让听话人去做某事；承诺类使说话人自己承担未来行动的义务。',
            'The point of Assertives is to commit the speaker to something’s being the case; Directives are attempts to get the hearer to do something; Commissives commit the speaker to some future course of action.',
            '据 SEP《Speech Acts》§3（Searle 1975）'
          ],
          [
            '完成全部五类言语行为卡片的归位',
            '人类可以用语言实施的基本以言行事行为，有且仅有这五大类：断言类、指令类、承诺类、表达类和宣告类。',
            'There are five and only five basic things we can do with propositions: Assertives, Directives, Commissives, Expressives, and Declarations.',
            '塞尔《表达与意义》（据 SEP《Speech Acts》§3 转引）'
          ]
        ]
      },
      {
        id: 3,
        tabLabel: '③ 构成性规则（X 在情境 C 中算作 Y）',
        instructionTitle: '③ 范导性规则 vs 构成性规则 · 调节社会共同体对“X 在情境 C 中算作 Y”的集体意向性认可',
        sliders: [
          { key: 'collectiveAccept', label: '共同体对构成性规则（X 算作 Y）的集体认可度', min: 0, max: 100, step: 5, defaultValue: 85, unit: '%' }
        ],
        mappings: [
          [
            '保持集体认可度 ≥ 70%：观察物理声音/纸张（X）在制度语境 C 中获得地位功能（制度事实 Y）',
            '构成性规则创造并定义了新形式的活动本身，其典型公式是：“在情境 C 中，X 算作（counts as）Y”。',
            'Constitutive rules do not merely regulate, they create or define new forms of behavior. They have the form: "X counts as Y in context C".',
            '塞尔《言语行为》第 2 章（据 SEP《Speech Acts》§1.3 转引）'
          ],
          [
            '将“集体认可度”拉低至 15% 以下：观察制度事实退化为纯粹的物理声波或纸片',
            '说一种语言，就是遵照构成性规则去实施言语行为。',
            'Speaking a language is engaging in a rule-governed form of behavior... performing speech acts in accordance with constitutive rules.',
            '据 SEP《Speech Acts》§1.3'
          ]
        ]
      }
    ]
  },
  {
    id: 69,
    slug: 'minest_grice',
    title: '格赖斯 · 合作原则与会话含义',
    philosopher: '保罗·格赖斯',
    concept: '合作原则（Cooperative Principle）、四大准则与会话含义（Implicature）',
    categoryGroup: '四、语言、解释与社会哲学（67–76）',
    tags: ['语言', '逻辑'],
    playSummary: '改变对话信息量、真实性、相关性和表达方式，探索会话含义',
    levelsSummary: '① 合作原则与四大准则 · ② 公然违背（Flouting）与推荐信弦外之音 · ③ 会话含义的可取消性',
    source: '《逻辑与会话》（Logic and Conversation，据 SEP《Implicature》转引）',
    quoteCount: 6,
    thumbType: 'grice',
    coreQuestion: '为什么当哲学系求职推荐信里只写了一句“某同学英语发音标准、从不迟到”时，考官一眼就读出了言外之意：“他根本没有哲学才华”？',
    boundaryNote: '格赖斯严格区分了“所言（What is said）”与“所含（What is implicated）”：公然违反某条表层准则，往往正是为了在深层遵守合作原则、传递弦外之音。',
    stages: [
      {
        id: 1,
        tabLabel: '① 四大准则与合作原则',
        instructionTitle: '① 调整对话响应的四个维度 · 当路人问“我的车没油了，怎么办？”时，切换不同的回答策略，观察四大准则如何运作',
        choices: [
          {
            key: 'maximReply',
            label: '面对“我车没油了”的回答方式',
            defaultValue: 'cooperative_gas',
            options: [
              { value: 'cooperative_gas', label: '标准合作回答：“前面街角就有一家加油站。”（隐含：它正营业且有油）' },
              { value: 'violate_quantity', label: '违反【量】准则（信息不足）：“世界上有些地方是有汽油的。”' },
              { value: 'violate_relation', label: '表面违反【关系】准则（答非所问）：在尴尬话题时突然说“今天天气真好啊！”' },
              { value: 'violate_manner', label: '故意违反【方式】准则（晦涩）：当着孩子面拼写“去拿块 C-A-N-D-Y”' }
            ]
          }
        ],
        mappings: [
          [
            '查看“标准合作回答：前面街角就有一家加油站”',
            '使你在交谈中作出的贡献，符合你所参与的谈话在当时所要求的公认目的或方向——这就是“合作原则”，包含量、质、关系和方式四条准则。',
            'Make your conversational contribution such as is required, at the stage at which it occurs, by the accepted purpose or direction of the talk exchange in which you are engaged.',
            '格赖斯《逻辑与会话》（据 SEP《Implicature》§1 转引）'
          ],
          [
            '切换到其他违反准则的选项：观察听者如何在假定对方仍在合作的条件下推算其弦外之音',
            '当乙回答“街角有家加油站”时，甲之所以推导出“那家加油站现在正开着门”，是因为否则乙的回答就违背了“贴切相关（Relation）”的准则。',
            'A implicates that the garage is, or at least may be open, because otherwise his remark would not be relevant.',
            '据 SEP《Implicature》§1（Grice 1975）'
          ]
        ]
      },
      {
        id: 2,
        tabLabel: '② 公然违背准则（Flouting）与推荐信',
        instructionTitle: '② 哲学教职推荐信实验 · 调节教授在推荐信中提供的学术评价信息量，观察为何一句全真的“他字迹工整、按时上课”会传达出负面含义',
        sliders: [
          { key: 'infoAmount', label: '推荐信对“哲学学术能力”的信息供给量（量准则）', min: 5, max: 100, step: 5, defaultValue: 10, unit: '%' }
        ],
        choices: [
          {
            key: 'floutType',
            label: '公然违背（Flouting）准则的典型案例',
            defaultValue: 'letter_quantity',
            options: [
              { value: 'letter_quantity', label: '公然违反【量】准则（推荐信）：只写“该生英语好、出勤率高”，绝口不提哲学水平' },
              { value: 'irony_quality', label: '公然违反【质】准则（反讽）：在暴雨倾盆时说“今天真是野餐的好天气啊！”' }
            ]
          }
        ],
        mappings: [
          [
            '保持在“公然违反【量】准则（推荐信）”且信息供给量 < 25%：触发会话含义推导链',
            '教授不可能不了解自己学生的哲学水平；他之所以在推荐信中只写“他英语好、按时上课”，公然违反“提供足够信息量”的量准则，是因为他不愿说谎（遵守质准则）——由此推导出会话含义：“他认为该生哲学很差”。',
            'He cannot be unable to say more, since the man is his pupil... This supposition is tenable only if he thinks Mr. X is no good at philosophy.',
            '格赖斯《逻辑与会话》（据 SEP《Implicature》§1 转引）'
          ],
          [
            '切换到“公然违反【质】准则（反讽）”',
            '当说话人说出一句字面上显而易见为假的话，听话人既然确信对方仍在合作，就会推断说话人意在传达与其字面命题相反的会话含义。',
            'It is perfectly obvious to A and his audience that what A has said is false... the audience must suppose that A is trying to get across some other proposition.',
            '据 SEP《Implicature》§1'
          ]
        ]
      },
      {
        id: 3,
        tabLabel: '③ 会话含义的“可取消性”检验',
        instructionTitle: '③ 语义蕴涵 vs 会话含义 · 尝试在句子后面追加一句“但其实并非如此”，检验哪些含义可以被显式取消而不产生逻辑矛盾',
        choices: [
          {
            key: 'cancelTest',
            label: '追加取消子句的检验对象',
            defaultValue: 'scalar_some',
            options: [
              { value: 'scalar_some', label: '会话含义（可取消）：“有些学生及格了” + 追加：“事实上，所有学生都及格了！”' },
              { value: 'entailment_fail', label: '逻辑蕴涵（不可取消）：“所有学生都及格了” + 追加：“但班长没及格”（直接逻辑矛盾 ✗）' }
            ]
          }
        ],
        mappings: [
          [
            '选择“会话含义（可取消）：有些学生及格了 + 事实上所有学生都及格了”',
            '当你说较弱的“有些（Some）学生及格了”时，通常会引发“并非所有学生都及格”的会话含义；但一切会话含义都具有“可取消性（Cancellability）”——可以毫无逻辑矛盾地补上一句“事实上，所有人都及格了”。',
            'A generalized conversational implicature can be canceled in a particular case, either explicitly or contextually.',
            '据 SEP《Implicature》§2（Cancellability）'
          ],
          [
            '切换到“逻辑蕴涵（不可取消）”对比语义真值条件与语用推导的划界',
            '这一“可取消性”证明了“有些”在逻辑语义上并不等价于“只是一些而非全部”；后者是语用交际中通过合作原则推导出的会话含义。',
            'Conversational implicatures are calculable and cancellable, unlike logical entailments.',
            '据 SEP《Implicature》§2'
          ]
        ]
      }
    ]
  },
  {
    id: 70,
    slug: 'minest_gadamer',
    title: '伽达默尔 · 视域融合',
    philosopher: '汉斯-格奥尔格·伽达默尔',
    concept: '前见（Prejudice）、效果历史与视域融合（Fusion of Horizons）',
    categoryGroup: '四、语言、解释与社会哲学（67–76）',
    tags: ['语言', '认识论', '解释学'],
    playSummary: '将两个解释视域逐步展开、比较和重新理解',
    levelsSummary: '① 为“前见”正名 · ② 视域融合（Horizon Fusion） · ③ 问答逻辑与对话游戏',
    source: '《真理与方法》（据 SEP《Hans-Georg Gadamer》转引）',
    quoteCount: 6,
    thumbType: 'gadamer',
    coreQuestion: '阅读一部两千年前的经典文本或理解另一种文化时，我们真的能先把自己的历史背景和先入之见“彻底清空归零”，再去进行纯客观的复原吗？',
    boundaryNote: '伽达默尔指出：没有先行理解的视域（前见），我们甚至无法向文本提出问题；真正的理解是在对话中让“当下视域”与“历史文本视域”发生视域融合。',
    stages: [
      {
        id: 1,
        tabLabel: '① 前见（Vorurteil）与解释学循环',
        instructionTitle: '① 合法前见 vs 盲目偏见 · 调节解释者的“先行理解视域（前见）”与“向文本他异性敞开的检验度”',
        sliders: [
          { key: 'preUnderstanding', label: '历史传统赋予的先行视域（前见 Vorurteil）', min: 0, max: 100, step: 5, defaultValue: 65, unit: '%' },
          { key: 'opennessToText', label: '在碰撞中倾听文本并修正盲目成见的敞开度', min: 0, max: 100, step: 5, defaultValue: 70, unit: '%' }
        ],
        mappings: [
          [
            '尝试将“历史传统赋予的先行视域”降为 0%：观察解释光束消失，文本变得无法发问与不可解读',
            '启蒙运动最根本的偏见，就是“反对一切前见（成见）的偏见”。事实上，“前见（Vorurteil）”是我们向世界敞开、得以开启理解的历史条件。',
            'The fundamental prejudice of the Enlightenment is the prejudice against prejudice itself, which denies tradition its power.',
            '伽达默尔《真理与方法》（据 SEP《Hans-Georg Gadamer》§3.1 转引）'
          ],
          [
            '保持先行视域 > 50% 且将“倾听文本并修正成见的敞开度”提升至 75% 以上',
            '解释者带着自己的先行期待进入循环，并在文本的陌生声音冲击下不断检验、甄别并修正自己的前见。',
            'A person trying to understand a text is prepared for it to tell him something. That is why a hermeneutically trained consciousness must be, from the start, sensitive to the text’s alterity.',
            '据 SEP《Hans-Georg Gadamer》§3.1（Truth and Method）'
          ]
        ]
      },
      {
        id: 2,
        tabLabel: '② 视域融合（Fusion of Horizons）',
        instructionTitle: '② 两个视域的靠近与交融 · 拖动“当代解释者的视域圆”与“历史经典文本的视域圆”，观察视域融合',
        sliders: [
          { key: 'horizonOverlap', label: '当代视域与历史文本视域的对话交汇度', min: 0, max: 100, step: 5, defaultValue: 30, unit: '%' }
        ],
        choices: [
          {
            key: 'fusionMode',
            label: '对待两个历史视域的态度',
            defaultValue: 'dialogic_fusion',
            options: [
              { value: 'isolated_past', label: '历史主义幻觉：假装彻底抛弃当下，把自己关进死去的过去封闭圆中' },
              { value: 'modern_impose', label: '现代傲慢独白：用今天的标准强行吞并古人，拒绝倾听文本的异质性' },
              { value: 'dialogic_fusion', label: '视域融合（Horizontverschmelzung）：在保持张力中交汇，生成更宽广的新视域' }
            ]
          }
        ],
        mappings: [
          [
            '选择“视域融合”并将“对话交汇度”拖至 70%–90%：两个视域圆交叠并向外扩展出更大的金色外环',
            '“视域（Horizon）”就是从某一个特定立足点出发所能看到的一切范围；理解的过程，本质上就是解释者的当下视域与文本的历史视域相互交汇、提升为更高普遍性的“视域融合”。',
            'The horizon is the range of vision that includes everything that can be seen from a particular vantage point... Understanding is always the fusion of these horizons supposedly existing by themselves.',
            '伽达默尔《真理与方法》（据 SEP《Hans-Georg Gadamer》§3.2 转引）'
          ],
          [
            '对比“历史主义幻觉”与“视域融合”',
            '理解从来不是对过去某人心理状态的被动复制，而始终是一种生产性的活动；因此，“人只要真正理解了，就总是以不同的方式在理解”。',
            'It is enough to say that we understand in a different way, if we understand at all.',
            '据 SEP《Hans-Georg Gadamer》§3.2（Truth and Method）'
          ]
        ]
      },
      {
        id: 3,
        tabLabel: '③ 问答逻辑与游戏（Spiel）',
        instructionTitle: '③ 文本是在回答什么问题？ · 切换对文本背后“原初问题”的探寻，体验理解如何像一场“对话游戏”',
        choices: [
          {
            key: 'qaStance',
            label: '阅读经典命题的方式',
            defaultValue: 'find_question',
            options: [
              { value: 'dead_statement', label: '只看孤立字面结论：把文本当成一条脱离问题语境的僵死教条' },
              { value: 'find_question', label: '重构问答视域：追问“这段文本当年究竟是在回应哪一个紧迫的问题？”' }
            ]
          }
        ],
        mappings: [
          [
            '切换到“重构问答视域”：点亮文本背后的问题视域',
            '要理解一句话或一段文本，就必须理解它是对哪一个问题的回答。',
            'We understand the sense of the text only by acquiring the horizon of the question—a horizon that, as such, necessarily includes other possible answers.',
            '据 SEP《Hans-Georg Gadamer》§3.3'
          ],
          [
            '观察解释者与文本在往复问答中如同投入一场“游戏（Play/Spiel）”',
            '真正的对话就像一场游戏：不是游戏者在主宰游戏，而是游戏本身把参与者卷入其中。',
            'All playing is a being-played. The attraction of a game consists precisely in the fact that the game masters the players.',
            '据 SEP《Hans-Georg Gadamer》§3.3（Truth and Method）'
          ]
        ]
      }
    ]
  },
  {
    id: 71,
    slug: 'minest_ricoeur',
    title: '利科 · 叙事身份',
    philosopher: '保罗·利科',
    concept: '同一性（Idem）与自身性（Ipse）、情节编织与叙事身份',
    categoryGroup: '四、语言、解释与社会哲学（67–76）',
    tags: ['语言', '伦理学', '形而上学', '解释学'],
    playSummary: '调整个人经历的叙事顺序，探索自我理解的变化',
    levelsSummary: '① 同一性（Idem）vs 自身性（Ipse） · ② 情节编织（不和谐的和谐） · ③ 重排叙事顺序与自我理解',
    source: '《自身作为他者》《时间与叙事》（据 SEP《Paul Ricoeur》转引）',
    quoteCount: 6,
    thumbType: 'ricoeur',
    coreQuestion: '从孩童到白发苍苍的老者，一个人的细胞、外貌、性格和境遇几乎全变了，凭什么我们还能说他是“同一个人”？',
    boundaryNote: '利科区分了两种“同一”：客观特征不变的“等同性（Idem-identity）”与在时间变化中依然信守诺言担当自我的“自身性（Ipse-identity）”，而“叙事身份”正是连接二者的桥梁。',
    stages: [
      {
        id: 1,
        tabLabel: '① 同一性（Idem）与自身性（Ipse）',
        instructionTitle: '① 经历了五十年岁月变迁的自我 · 调节“生理与性格特征的变化幅度”，比较客观特征等同（Idem）与信守承诺的自我（Ipse）',
        sliders: [
          { key: 'timeElapsed', label: '人生岁月流逝与身心特征变化跨度', min: 0, max: 100, step: 5, defaultValue: 75, unit: ' 年' }
        ],
        choices: [
          {
            key: 'identityPole',
            label: '追问“我是谁”的维度',
            defaultValue: 'ipse_promise',
            options: [
              { value: 'idem_sameness', label: '等同性（Idem / 我是什么）：外貌、生理与习惯特征的相同（随岁月流逝面临断裂）' },
              { value: 'ipse_promise', label: '自身性（Ipse / 我是谁）：信守诺言——“纵使我的一切心境与外貌都变了，我仍为当年的承诺负责”' }
            ]
          }
        ],
        mappings: [
          [
            '将岁月流逝拉到 70 年以上，在“等同性（Idem）”与“自身性（Ipse）”之间切换',
            '人格同一性包含两极：拉丁语的 Idem（等同性，回答“是什么”）与 Ipse（自身性，回答“是谁”，即使在特征改变时仍能持存）。',
            'Identity in the sense of idem unfolds a hierarchy of significations, of which permanence in time constitutes the highest order... Identity in the sense of ipse implies no assertion concerning some unchanging core of the personality.',
            '利科《自身作为他者》导论（据 SEP《Paul Ricoeur》§4.2 转引）'
          ],
          [
            '保持在“自身性（Ipse）：信守诺言”模式：观察跨越时间鸿沟的金色承诺弧线',
            '信守诺言是“自身性（Ipse）”摆脱“等同性（Idem）”的典范：哪怕我的喜好与外貌都变了，我依然信守诺言。',
            'Keeping one’s word expresses a self-constancy which cannot be inscribed within the dimension of something in general, but solely within the dimension of "who?".',
            '据 SEP《Paul Ricoeur》§4.2（Oneself as Another）'
          ]
        ]
      },
      {
        id: 2,
        tabLabel: '② 情节编织（Emplotment）',
        instructionTitle: '② 把散乱事件编织成故事 · 调节“叙事情节编织度”，将偶然闯入的意外转化为生命故事的有机转折',
        sliders: [
          { key: 'emplotStrength', label: '叙事情节编织与整合度 (Emplotment)', min: 0, max: 100, step: 5, defaultValue: 25, unit: '%' }
        ],
        mappings: [
          [
            '当情节编织度 < 30% 时：观察人生事件只是互不相干的偶然碎片',
            '在尚未经过叙事编织之前，时间中的生活经历只是一连串异质的、偶然闯入的突发事件和断裂。',
            'Contingency is the mark of the sheer event that interrupts expected regularities.',
            '据 SEP《Paul Ricoeur》§4.1（Time and Narrative）'
          ],
          [
            '将“叙事情节编织度”推至 80% 以上：散乱的偶然事件被连成“不和谐的和谐（Discordant Concordance）”',
            '“情节编织（Emplotment）”把原本纯属偶然的事件整合进故事脉络中，使其化为促成故事走向的“叙事必然性”——即“不和谐的和谐”。',
            'The plot transforms the sheer contingency of events into narrative necessity, creating a synthesis of the heterogeneous—a discordant concordance.',
            '据 SEP《Paul Ricoeur》§4.1–4.2'
          ]
        ]
      },
      {
        id: 3,
        tabLabel: '③ 重排叙事顺序与重塑自我',
        instructionTitle: '③ 调整同一组人生经历的叙事架构 · 对同样四段经历（少年失利、远行求学、遭遇背叛、晚年传薪），切换不同的叙事线索',
        choices: [
          {
            key: 'narrativeFrame',
            label: '对同一组人生经历的叙事编排方式',
            defaultValue: 'victim_tragedy',
            options: [
              { value: 'victim_tragedy', label: '版本 A（受挫叙事）：以“早年失利与中年背叛”为主轴，将自我理解为宿命受害者' },
              { value: 'bildungsroman', label: '版本 B（成长淬炼叙事）：将“失利与背叛”重构为促成“远行突破与晚年传薪”的转折试炼' },
              { value: 'entangled_others', label: '版本 C（与他人交织的伦理叙事）：看见我的故事始终镶嵌在他人故事之中' }
            ]
          }
        ],
        mappings: [
          [
            '在“版本 A”与“版本 B”之间切换：同样的事实经历，因叙事架构不同而呈现出全新的自我理解',
            '正如关于同一段事件可以编织出不同情节一样，我们总是可以通过重新编排个人经历的叙事，去重新理解自己是谁。',
            'Just as it is possible to compose several plots on the subject of the same incidents, so it is always possible to weave different, even opposed, plots about our lives.',
            '利科《时间与叙事》第三卷（据 SEP《Paul Ricoeur》§4.2 转引）'
          ],
          [
            '切换到“版本 C（与他人交织的伦理叙事）”',
            '每一个人的生命历史都与他人的生命历史交织缠绕在一起；“自身作为他者”意味着他者内在地构成了自我叙事本身。',
            'The life history of each of us is caught up in the histories of others.',
            '据 SEP《Paul Ricoeur》§4.2（Oneself as Another）'
          ]
        ]
      }
    ]
  },
  {
    id: 72,
    slug: 'minest_saussure',
    title: '索绪尔 · 语言符号',
    philosopher: '费尔迪南·德·索绪尔',
    concept: '能指（Signifier）与所指（Signified）、任意性与差异价值系统',
    categoryGroup: '四、语言、解释与社会哲学（67–76）',
    tags: ['语言', '结构主义'],
    playSummary: '操作能指、所指和符号关系，比较不同语言系统',
    levelsSummary: '① 能指与所指（一张纸的正反面） · ② 语言价值（Mouton vs Sheep/Mutton） · ③ 国际象棋比喻',
    source: '《普通语言学教程》（Baskin 英译本）',
    quoteCount: 6,
    thumbType: 'saussure',
    coreQuestion: '语言仅仅是一本给现成事物贴标签的“命名分类账”吗？为什么法语的“mouton”和英语的“sheep”，尽管都能指羊，它们的语言价值却完全不同？',
    boundaryNote: '索绪尔指出语言符号连接的是心理上的“音响形象（能指）”与“概念（所指）”；每个词的价值完全取决于它在整个语言系统中与相邻词的差异边界。',
    stages: [
      {
        id: 1,
        tabLabel: '① 能指、所指与任意性',
        instructionTitle: '① 音响形象（能指）与概念（所指） · 切换不同语言对同一概念“树”的发音能指，检验能指与所指的任意性',
        choices: [
          {
            key: 'signLang',
            label: '指向同一所指概念【树 🌳】的不同语言能指',
            defaultValue: 'zh_shu',
            options: [
              { value: 'zh_shu', label: '汉语能指：/shù/（“树”）' },
              { value: 'en_tree', label: '英语能指：/triː/（“tree”）' },
              { value: 'fr_arbre', label: '法语能指：/aʁbʁ/（“arbre”）' },
              { value: 'la_arbor', label: '拉丁语能指：/arbor/（“arbor”）' }
            ]
          }
        ],
        mappings: [
          [
            '在汉语、英语、法语与拉丁语能指之间切换',
            '语言符号连接的不是一个事物和一个名称，而是一个概念（所指）和一个音响形象（能指）。把能指和所指联结起来的纽带是任意的。',
            'The linguistic sign unites, not a thing and a name, but a concept and a sound-image... The bond between the signifier and the signified is arbitrary.',
            '索绪尔《普通语言学教程》第一编第一章 §1–2'
          ],
          [
            '观察画布中央的符号双面圆盘：如同一张纸的正反面不可单面切开',
            '语言可以比作一张纸：思想是正面，声音是反面；我们不能切开正面而不同时切开反面。',
            'Language can also be compared with a sheet of paper: thought is the front and the sound the back; one cannot cut the front without cutting the back at the same time.',
            '索绪尔《普通语言学教程》第二编第四章 §1'
          ]
        ]
      },
      {
        id: 2,
        tabLabel: '② 语言价值：只有差异',
        instructionTitle: '② 比较法语与英语的语义切割网格 · 拖动概念域中的划分边界线，对比法语（Mouton）与英语（活羊 Sheep vs 羊肉 Mutton）',
        choices: [
          {
            key: 'valueGrid',
            label: '不同语言系统对经验连续体的切割方式',
            defaultValue: 'en_sheep_mutton',
            options: [
              { value: 'fr_mouton', label: '法语系统：用一个词“mouton”同时覆盖草地上的活羊与餐盘里的羊肉' },
              { value: 'en_sheep_mutton', label: '英语系统：旁边有“mutton（羊肉）”，把“sheep”的价值边界限定在“活羊”' },
              { value: 'river_fleuve', label: '河流切割：英语“river（按大小 vs stream）” vs 法语“fleuve（按是否入海 vs rivière）”' }
            ]
          }
        ],
        sliders: [
          { key: 'boundaryShift', label: '相邻词项的领地挤压边界', min: 15, max: 85, step: 5, defaultValue: 50, unit: '%' }
        ],
        mappings: [
          [
            '在“法语系统（mouton）”与“英语系统（sheep / mutton）”之间切换',
            '法语的 mouton 可以和英语的 sheep 具有相同的意义，但并不具有相同的“价值（Value）”；因为英语里还有第二个词 mutton（羊肉）限制了 sheep 的范围。',
            'Modern French mouton can have the same signification as English sheep but not the same value, particularly because in speaking of a piece of meat ready to be served on the table, English uses mutton and not sheep.',
            '索绪尔《普通语言学教程》第二编第四章 §2'
          ],
          [
            '拖动“相邻词项的领地挤压边界”或切换至“河流切割”',
            '在语言中，只有差异，而且没有正面的规定项；一个词的价值完全由它周围其他词的边界所限定。',
            'In language there are only differences without positive terms.',
            '索绪尔《普通语言学教程》第二编第四章 §4'
          ]
        ]
      },
      {
        id: 3,
        tabLabel: '③ 国际象棋比喻：形式高于质料',
        instructionTitle: '③ 象棋中的“马” · 当棋盘上的木雕马丢失后，用一颗铜纽扣按同样走法替代它，观察系统价值的不变性',
        choices: [
          {
            key: 'chessPiece',
            label: '棋盘上扮演“马（走日字格）”的物理棋子',
            defaultValue: 'wooden_knight',
            options: [
              { value: 'wooden_knight', label: '原装木雕马头棋子' },
              { value: 'button_sub', label: '用一颗形状完全不同的铜纽扣代替它（只要按“马”的规则走）' }
            ]
          }
        ],
        mappings: [
          [
            '将“原装木雕马”替换为“铜纽扣”：棋局关系网分毫不差地继续运行',
            '在一盘国际象棋中，假如“马”弄丢了，哪怕用一个形状完全不像马的物体来代替它，只要赋予它相同的规则关系，它就具有完全相同的价值。',
            'Even a figure shorn of any resemblance to a knight can be declared identical provided the same value is attributed to it.',
            '索绪尔《普通语言学教程》第二编第三章'
          ],
          [
            '观察棋盘上的结构关系网格',
            '决定一个符号要素价值的不是它的物理质料，而是它在系统中的对立和关系。语言是形式，而不是实体。',
            'Language is a form and not a substance.',
            '索绪尔《普通语言学教程》第二编第四章 §4'
          ]
        ]
      }
    ]
  },
  {
    id: 73,
    slug: 'minest_peirce_semiotics',
    title: '皮尔士 · 符号三元关系',
    philosopher: '查尔斯·桑德斯·皮尔士',
    concept: '符号载体（Representamen）、对象（Object）与解释项（Interpretant），像似符/指示符/规约符',
    categoryGroup: '四、语言、解释与社会哲学（67–76）',
    tags: ['语言', '逻辑', '认识论'],
    playSummary: '连接符号载体、对象与解释项，观察意义生成',
    levelsSummary: '① 不可还原的三元符号关系 · ② 像似符、指示符与规约符 · ③ 无限符号衍义链',
    source: '《皮尔士文集》（Collected Papers，据 SEP《Peirce’s Theory of Signs》转引）',
    quoteCount: 6,
    thumbType: 'peirce_sign',
    coreQuestion: '如果没有第三个顶点——在理解者心中唤起的“解释项（Interpretant）”，一个东西还能成为符号吗？',
    boundaryNote: '皮尔士指出每一次产生的“解释项”本身又会成为一个新的符号，在后续理解中引发新的解释项，形成开放的“无限符号衍义（Unlimited Semiosis）”。',
    stages: [
      {
        id: 1,
        tabLabel: '① 符号三元三角（S - O - I）',
        instructionTitle: '① 连接符号三元顶点 · 调节“符号载体（S）”、“对象（O）”与“解释项（I）”之间的三元连通度',
        sliders: [
          { key: 'triadLink', label: '三元中介关系（S — O — I）激活度', min: 0, max: 100, step: 5, defaultValue: 35, unit: '%' }
        ],
        choices: [
          {
            key: 'triadExample',
            label: '观察的具体三元符号情境',
            defaultValue: 'molehill',
            options: [
              { value: 'molehill', label: '草地土丘（符号 S） → 地下鼹鼠（对象 O） → 园丁产生“有鼹鼠打洞”的判断（解释项 I）' },
              { value: 'fever_spots', label: '皮肤红疹（符号 S） → 麻疹病毒（对象 O） → 医生的诊断认识（解释项 I）' }
            ]
          }
        ],
        mappings: [
          [
            '将“三元中介关系激活度”推至 80% 以上：S、O、I 在中心交汇构成不可还原的三元组',
            '符号是在某一方面对某人代表某物（对象）的东西；它在那人心中创造出一个等价或更发展的符号，即原初符号的“解释项（Interpretant）”。',
            'A sign, or representamen, is something which stands to somebody for something in some respect or capacity... That sign which it creates I call the interpretant of the first sign.',
            '皮尔士《文集》CP 2.228（据 SEP《Peirce’s Theory of Signs》§1 转引）'
          ],
          [
            '将滑块拉回 20% 以下（切断解释项 I）：观察缺少解释项时符号退化为盲目的二元物理作用',
            '符号关系是严格的、不可还原的三元关系：唯有当符号决定第三个项（解释项）去同样指向那个对象时，符号意义才得以生成。',
            'A Sign is a Representamen with a mental Interpretant... A sign is in a conjoint relation to the thing denoted and to the mind.',
            '据 SEP《Peirce’s Theory of Signs》§1'
          ]
        ]
      },
      {
        id: 2,
        tabLabel: '② 像似符、指示符与规约符',
        instructionTitle: '② 符号与对象建立关联的三种方式 · 将画布中的符号实例归入“像似符”、“指示符”或“规约符”',
        draggables: [
          { id: 'portrait_map', label: '人物肖像画 / 地形比例地图', sub: '凭借自身性质与对象的相似性（Resemblance）来指代', targetZone: 'icon_zone' },
          { id: 'smoke_vane', label: '远处的浓烟（指火）/ 屋顶风向标（指风向）', sub: '与对象存在真实的物理因果或时空毗连', targetZone: 'index_zone' },
          { id: 'word_red_light', label: '词语“苹果” / 十字路口的红绿灯', sub: '全凭社会习惯、法则或约定俗成来指代', targetZone: 'symbol_zone' }
        ],
        dropZones: [
          { id: 'icon_zone', label: '像似符 (Icon)', sub: '基于性质与结构的相似性', color: '#3a6f99' },
          { id: 'index_zone', label: '指示符 (Index)', sub: '基于真实物理因果或痕迹', color: '#e67e22' },
          { id: 'symbol_zone', label: '规约符 (Symbol)', sub: '基于习惯、法则或社会规约', color: '#2fa35a' }
        ],
        mappings: [
          [
            '将“肖像画/地图”放入像似符、“浓烟/风向标”放入指示符',
            '“像似符（Icon）”凭借自身性质与对象的相似性来指称对象；“指示符（Index）”通过受到对象的真实物理影响（如风吹动风向标、火冒浓烟）而与对象相连。',
            'An Icon is a sign which refers to the Object merely by virtue of characters of its own... An Index refers to the Object by virtue of being really affected by that Object.',
            '皮尔士《文集》CP 2.247–248（据 SEP《Peirce’s Theory of Signs》§2 转引）'
          ],
          [
            '将“词语/红绿灯”放入规约符（Symbol），完成全部三类符号归位',
            '“规约符/象征符（Symbol）”凭借一种法则、习惯或普遍约定来指称其对象——人类的普通语词、句子与数学符号皆属此类。',
            'A Symbol is a sign which refers to the Object that it denotes by virtue of a law, usually an association of general ideas.',
            '皮尔士《文集》CP 2.249'
          ]
        ]
      },
      {
        id: 3,
        tabLabel: '③ 无限符号衍义（Unlimited Semiosis）',
        instructionTitle: '③ 解释项化为下一个符号 · 点击“推进符号衍义链”，观察每一个新生成的解释项 I₁ 如何立刻变身为下一个三元组的符号 S₂',
        buttons: [
          { key: 'advanceSemiosis', label: '🔗 推进下一级符号衍义 (Iₙ → Sₙ₊₁)', accent: 'blue' }
        ],
        mappings: [
          [
            '点击“推进下一级符号衍义”至少 2 次：观察解释项不断生长为新符号',
            '解释项本身又成为一个新的符号，激发出它自己的下一个解释项，如此层层递进以至无穷——即“无限符号衍义”。',
            'The interpretant becoming in turn a sign, and so on ad infinitum, every sign is interpreted by a subsequent sign in an endless series of representations.',
            '皮尔士《文集》CP 2.303（据 SEP《Peirce’s Theory of Signs》§1 转引）'
          ],
          [
            '继续推进衍义链至第 4 级以上',
            '人的全部思维都是在符号中进行的；一个表象的意义只能是另一个表象。',
            'All thought is in signs... the meaning of a representation can be nothing but a representation.',
            '皮尔士《文集》CP 5.253, 1.339'
          ]
        ]
      }
    ]
  },
  {
    id: 74,
    slug: 'minest_derrida',
    title: '德里达 · 延异（Différance）',
    philosopher: '雅克·德里达',
    concept: '延异（Différance：差异 + 延宕）、踪迹（Trace）与解构',
    categoryGroup: '四、语言、解释与社会哲学（67–76）',
    tags: ['语言', '形而上学', '解构主义'],
    playSummary: '沿概念关系网络追踪意义如何依赖其他符号',
    levelsSummary: '① 翻查词典的无限延宕 · ② 既“区分（Differ）”又“延搁（Defer）”的字母 a · ③ 拆解等级二元对立',
    source: '《哲学的边缘·延异》《论文字学》（据 SEP《Jacques Derrida》转引）',
    quoteCount: 6,
    thumbType: 'derrida',
    coreQuestion: '当你去查词典想找到一个词的“终极在场意义（所指本身）”时，为什么词典里给出的永远只是另外一串词，而再查那些词又指向更多的词？',
    boundaryNote: '德里达造出法语新词“Différance”（把 Différence 中的 e 换成发音相同、唯有书写才看得见的 a），融合了空间上的“相异/区分（to differ）”与时间上的“推迟/延宕（to defer）”。',
    stages: [
      {
        id: 1,
        tabLabel: '① 词典追踪与意义的无限延宕',
        instructionTitle: '① 点击追踪词典概念网 · 试图捕捉一个概念的“纯粹终极所指”，观察每一次点击都跳转到由其他能指留下的“踪迹（Trace）”网络',
        buttons: [
          { key: 'traceNextWord', label: '🔍 在概念网中追踪该词的定义（追寻“终极所指”）', accent: 'purple' }
        ],
        mappings: [
          [
            '连续点击“在概念网中追踪该词的定义” 3 次以上：观察每个“所指”在被追问时都立刻变成指向别的词的“能指”',
            '每一个概念本质上都铭刻在一个符号链或系统之中，通过差异的系统性游戏指向其他概念；所指总是已经在充当能指。',
            'Every concept is inscribed in a chain or in a system within which it refers to the other, to other concepts, by means of the systematic play of differences. The signified always already functions as a signifier.',
            '德里达《论文字学》《延异》（据 SEP《Jacques Derrida》§2 转引）'
          ],
          [
            '观察画布中每个亮起的节点周围都携带着其他缺席节点的虚线“踪迹（Trace）”',
            '没有任何一个要素能仅仅凭借自身来意指，每一个看似“在场”的要素都在自身内部携带着其他不在场要素的“踪迹（Trace）”。',
            'No element can function as a sign without referring to another element which itself is not simply present. Each element is constituted on the basis of the trace within it of the other elements of the chain.',
            '德里达《立场》（Positions，据 SEP《Jacques Derrida》§2 转引）'
          ]
        ]
      },
      {
        id: 2,
        tabLabel: '② Différance：空间差异 + 时间延搁',
        instructionTitle: '② 听不见、只能看见的字母“a” · 调节“空间区分度（Differing）”与“时间延宕度（Deferring）”',
        sliders: [
          { key: 'spaceDiffer', label: '空间上的相异与间隔化 (To Differ / Spacing)', min: 10, max: 100, step: 5, defaultValue: 60, unit: '%' },
          { key: 'timeDefer', label: '时间上的推迟与延宕化 (To Defer / Temporalizing)', min: 10, max: 100, step: 5, defaultValue: 60, unit: '%' }
        ],
        mappings: [
          [
            '同时调节“空间相异”与“时间延宕”至 75% 以上：观察两者交织成“延异（Différance）”的双螺旋运动',
            '法语动词 différer 兼具空间上的“不同、相异（to differ）”与时间上的“推迟、延搁（to defer）”；“延异（Différance）”将空间的间隔化与时间的延宕化结合在了一起。',
            'The verb différer seems to differ from itself. On the one hand, it indicates difference as distinction; on the other, it expresses the interposition of delay, a spacing and temporalizing.',
            '德里达《延异》（据 SEP《Jacques Derrida》§2 转引）'
          ],
          [
            '观察画布中央 différ[e]nce 与 différ[a]nce 的对比：口语发音完全一样，唯有书写显现出这一差异',
            'e 变成 a 的差异在法语口语发音中完全听不出来，唯有在书写中才能被读到——它颠覆了西方哲学“抬高语音、贬低文字”的语音中心主义。',
            'This graphic difference (a instead of e) remains purely graphic: it is read, or it is written, but it cannot be heard.',
            '德里达《延异》（Margins of Philosophy, p. 3）'
          ]
        ]
      },
      {
        id: 3,
        tabLabel: '③ 解构二元等级（言语/文字）',
        instructionTitle: '③ 解构（Deconstruction）的双重姿势 · 面对传统形而上学的等级二元对立（言语 > 文字、在场 > 缺席），体验解构如何翻转并拆解该等级',
        choices: [
          {
            key: 'deconStage',
            label: '解构传统二元对立的步骤',
            defaultValue: 'hierarchy_logocentrism',
            options: [
              { value: 'hierarchy_logocentrism', label: '① 传统逻各斯中心主义等级：言语（活的本原/在场）统治文字（死的替补/派生）' },
              { value: 'double_gesture', label: '② 解构的翻转与位移：发现“活的言语”本身也必须依赖可重复性与延异踪迹才能表意！' }
            ]
          }
        ],
        mappings: [
          [
            '查看“① 传统逻各斯中心主义等级”',
            '在传统的哲学二元对立中，从来不是两个平等项的和平共处，而是一个暴力的等级制度：其中一项统治着另一项。',
            'In a classical philosophical opposition we are not dealing with the peaceful coexistence of a vis-à-vis, but rather with a violent hierarchy. One of the two terms governs the other.',
            '德里达《立场》（Positions, p. 41，据 SEP 转引）'
          ],
          [
            '切换到“② 解构的翻转与位移”',
            '解构揭示出：被视为神圣本原的上位项（如言语、在场），从一开始就依赖于它试图排斥的下位项（可重复的踪迹、替补与延异）。',
            'Deconstruction involves an overturning of the hierarchy and a displacement of the system, showing that the privileged "origin" always already depends on the derivative "supplement" or "trace".',
            '据 SEP《Jacques Derrida》§2–3'
          ]
        ]
      }
    ]
  },
  {
    id: 75,
    slug: 'minest_bourdieu',
    title: '布迪厄 · 惯习与场域',
    philosopher: '皮埃尔·布迪厄',
    concept: '场域（Field）、惯习（Habitus）与资本（经济/文化/社会资本）',
    categoryGroup: '四、语言、解释与社会哲学（67–76）',
    tags: ['社会', '政治哲学'],
    playSummary: '调整资本、场域位置和社会规则，探索实践倾向',
    levelsSummary: '① 资本的总量与结构（经济 vs 文化） · ② 惯习与“比赛感” · ③ 场域斗争与符号暴力',
    source: '《实践感》《区分：判断力的社会批判》（Nice 英译本）',
    quoteCount: 6,
    thumbType: 'bourdieu',
    coreQuestion: '为什么一个人的艺术审美品味、言谈举止甚至餐桌礼仪，看似完全是“个人天生的自由喜好”，在社会空间里却呈现出惊人的阶层分布规律？',
    boundaryNote: '布迪厄以公式 `[(惯习) (资本)] + 场域 = 实践` 揭示：人既不是无视社会结构的绝对自由主体，也不是机械执行死板规则的木偶，而是凭内化惯习在场域中博弈的行动者。',
    stages: [
      {
        id: 1,
        tabLabel: '① 社会空间与资本结构',
        instructionTitle: '① 调整经济资本与文化资本配比 · 在二维社会空间坐标系中改变行动者的“经济资本”与“文化资本”，观察其场域位置与审美品味的变化',
        sliders: [
          { key: 'econCapital', label: '经济资本（金钱、资产、产权）', min: 5, max: 100, step: 5, defaultValue: 30, unit: '%' },
          { key: 'cultCapital', label: '文化资本（学识修养、艺术鉴赏、文凭）', min: 5, max: 100, step: 5, defaultValue: 75, unit: '%' }
        ],
        mappings: [
          [
            '调节两项滑块，对比“高文化低经济”、“高经济低文化”与“双低”在社会空间中的坐标',
            '资本以三种基本形态呈现：经济资本、文化资本（身体化的教养、客观化的文化物品、制度化的文凭）以及社会资本（社会关系网络）。',
            'Capital can present itself in three fundamental guises: as economic capital, cultural capital, and social capital.',
            '布迪厄《资本的形式》（The Forms of Capital, 1986）'
          ],
          [
            '观察画布右侧随坐标变化的“品味与生活风格”',
            '趣味（Taste）是在进行分类，而且在它对消费品和艺术品进行分类的同时，也把分类者本人在社会空间中的位置分类了出来。',
            'Taste classifies, and it classifies the classifier. Social subjects, classified by their classifications, distinguish themselves by the distinctions they make.',
            '布迪厄《区分：判断力的社会批判》导言（Distinction, p. 6）'
          ]
        ]
      },
      {
        id: 2,
        tabLabel: '② 惯习（Habitus）与“比赛感”',
        instructionTitle: '② 惯习与球场上的“比赛感” · 切换行动者进入熟悉场域（如鱼得水）与陌生场域（手足无措的滞后效应）',
        choices: [
          {
            key: 'fieldMatch',
            label: '行动者的惯习（Habitus）与当前场域（Field）的契合度',
            defaultValue: 'fish_in_water',
            options: [
              { value: 'fish_in_water', label: '惯习与场域高度契合（如鱼得水）：凭身体化直觉就能做出“恰当得体”的反应' },
              { value: 'hysteresis_awkward', label: '惯习与场域错位（滞后效应 Hysteresis）：带着旧惯习闯入陌生场域，处处格格不入' }
            ]
          }
        ],
        mappings: [
          [
            '查看“惯习与场域高度契合（如鱼得水）”',
            '惯习是被身体化了的社会历史：它既是社会结构塑造的产物（被结构化的结构），又作为生成原则去组织日常实践和知觉（起结构作用的结构）。',
            'The habitus—embodied history, internalized as a second nature—is a structuring structure, which organizes practices and the perception of practices, and also a structured structure.',
            '布迪厄《实践感》第 3 章、《区分》第 3 章'
          ],
          [
            '切换到“惯习与场域错位（滞后效应）”',
            '当惯习遇见产生它的社会世界时，它就如同“鱼在水中”一样感觉不到水的重量；而一旦跨入陌生场域，旧惯习就会产生滞后与错位。',
            'When habitus encounters a social world of which it is the product, it is like a "fish in water": it does not feel the weight of the water.',
            '布迪厄 & 华康德《反思社会学导引》p. 127'
          ]
        ]
      },
      {
        id: 3,
        tabLabel: '③ 场域斗争与符号暴力',
        instructionTitle: '③ 场域游戏规则的争夺 · 在场域中切换“在位支配者（正统策略）”、“新晋挑战者（异端策略）”与“符号暴力”',
        choices: [
          {
            key: 'fieldStrategy',
            label: '场域内不同位置行动者的博弈策略',
            defaultValue: 'orthodoxy_preserve',
            options: [
              { value: 'orthodoxy_preserve', label: '在位支配者（正统策略）：维护现行评价标准，使既有资本持续生产特权' },
              { value: 'heresy_subvert', label: '新晋挑战者（异端/颠覆策略）：推动场域规则变革，使旧权威资本贬值' },
              { value: 'symbolic_violence', label: '符号暴力（Symbolic Violence）：被支配者把不平等的社会分类误认为“自己天生不够高雅”' }
            ]
          }
        ],
        mappings: [
          [
            '在“在位支配者”与“新晋挑战者”之间切换',
            '场域（Field）是由各种客观位置关系构成的网络，也是争夺场域特定资本垄断权以及合法评价标准制定权的竞技场。',
            'A field is simultaneously a space of conflict and competition, in which participants vie to establish monopoly over the species of capital effective in it.',
            '布迪厄 & 华康德《反思社会学导引》第 2 章'
          ],
          [
            '切换到“符号暴力（Symbolic Violence）”',
            '“符号暴力”是在社会行动者自身合谋（误认）的情况下施加在他们身上的看不见的暴力——把任意的社会等级秩序误认为自然天性。',
            'Symbolic violence is the violence which is exercised upon a social agent with his or her complicity... through misrecognition of the arbitrary social order as natural.',
            '布迪厄 & 华康德《反思社会学导引》p. 167'
          ]
        ]
      }
    ]
  },
  {
    id: 76,
    slug: 'minest_goffman',
    title: '戈夫曼 · 拟剧理论',
    philosopher: '欧文·戈夫曼',
    concept: '日常生活中的自我呈现、前台（Front Stage）与后台（Back Stage）、印象管理',
    categoryGroup: '四、语言、解释与社会哲学（67–76）',
    tags: ['社会', '伦理学'],
    playSummary: '切换前台、后台和不同社会角色，比较自我呈现',
    levelsSummary: '① 前台与后台的隔断门 · ② 剧班配合与印象管理 · ③ 演出穿帮与挽回面子',
    source: '《日常生活中的自我呈现》（The Presentation of Self in Everyday Life，1959）',
    quoteCount: 6,
    thumbType: 'goffman',
    coreQuestion: '为什么餐厅侍者推开厨房门走到大堂的那一瞬间，眼神、仪态和语调会立刻像演员登台一样彻底切换？',
    boundaryNote: '戈夫曼揭示出：一切面对面的社会互动都需要参与者借助“布景、外观、举止”共同维持一套工作共识（情境定义），以使社会生活得以顺畅运转。',
    stages: [
      {
        id: 1,
        tabLabel: '① 前台与后台',
        instructionTitle: '① 推开餐厅厨房与大堂之间的旋转门 · 移动角色跨过“前台/后台”边界门，观察仪态、表情与语言风格的即时切换',
        sliders: [
          { key: 'stagePosition', label: '角色位置（0% 厨房后台 ↔ 50% 旋转门 ↔ 100% 宴会厅前台）', min: 0, max: 100, step: 5, defaultValue: 85, unit: '%' }
        ],
        choices: [
          {
            key: 'socialPersona',
            label: '观察的社会角色剧目',
            defaultValue: 'waiter',
            options: [
              { value: 'waiter', label: '高级餐厅侍者：前台优雅恭敬微笑 vs 后台厨房放松吐槽、整理领结' },
              { value: 'doctor', label: '主治医师：前台诊室白大褂与沉稳权威 vs 后台休息室卸下疲惫、查阅资料' },
              { value: 'streamer', label: '远程面试者：前台镜头内西装笔挺 vs 镜头外桌面杂乱、深呼吸擦汗' }
            ]
          }
        ],
        mappings: [
          [
            '将“角色位置”保持在 70% 以上（前台区域）：观察个体借助布景、外观和举止向观众呈现理想化角色',
            '演出中那部分以一般和固定的方式为观察者规定情境的标准表达装备（包括布景、个人外观与举止），就是“前台（Front）”。',
            'Front, then, is the expressive equipment of a standard kind intentionally or unwittingly employed by the individual during his performance.',
            '戈夫曼《日常生活中的自我呈现》第 1 章（1959, p. 22）'
          ],
          [
            '将“角色位置”拖到 30% 以下（跨过旋转门进入后台区域）：观察前台刻意压抑的疲态在后台自由释放',
            '“后台（Backstage）”是演出所刻意营造的印象被有意识地卸下的地方；在这里表演者可以放松、卸下面具、脱离角色。',
            'A back region or backstage may be defined as a place, relative to a given performance, where the impression fostered by the performance is knowingly contradicted as a matter of course... Here the performer can relax; he can drop his front.',
            '戈夫曼《日常生活中的自我呈现》第 3 章（1959, p. 112）'
          ]
        ]
      },
      {
        id: 2,
        tabLabel: '② 印象管理与剧班（Team）共谋',
        instructionTitle: '② 剧班纪律与保密 · 调节“剧班内部默契配合度”，观察搭档如何在观众面前彼此掩护以维持共同的“情境定义”',
        sliders: [
          { key: 'teamLoyalty', label: '剧班成员（Teammates）前台默契与保密纪律', min: 0, max: 100, step: 5, defaultValue: 80, unit: '%' }
        ],
        mappings: [
          [
            '保持“剧班成员前台默契与保密纪律”在 75% 以上',
            '社会演出往往由一个“剧班（Performance Team）”配合完成：只要站在观众面前，成员就必须遵守剧班纪律，绝不当众拆穿搭档的演出。',
            'A teammate is someone whose dramaturgical co-operation is dependent upon in fostering a given definition of the situation... teammates must not betray the secrets of the team before the audience.',
            '戈夫曼《日常生活中的自我呈现》第 2 章（Teams）'
          ],
          [
            '观察个体在互动中不断调控表情与言辞（印象管理）',
            '当个体出现在他人面前时，他会控制自己的行为举止以便传达特定印象，以影响他人对情境的定义——这就是“印象管理”。',
            'When an individual appears before others his actions will influence the definition of the situation which they come to have.',
            '戈夫曼《日常生活中的自我呈现》导言（1959, p. 4）'
          ]
        ]
      },
      {
        id: 3,
        tabLabel: '③ 穿帮危机与机智救场',
        instructionTitle: '③ 当后台意外泄露到前台时 · 模拟尴尬穿帮时刻，比较“冷漠拆穿”与“演员自救 + 观众礼貌装作没看见（圆场）”',
        choices: [
          {
            key: 'disruptionResponse',
            label: '前台演出发生尴尬失误时的应对',
            defaultValue: 'tactful_save',
            options: [
              { value: 'scene_collapse', label: '彻底穿帮崩盘：演员惊慌失措，观众冷酷拆穿，互动情境定义瓦解' },
              { value: 'tactful_save', label: '防卫与保护性圆场（Tact）：演员机智化解，观众礼貌地“配合装作没看见”以保全面子' }
            ]
          }
        ],
        mappings: [
          [
            '切换到“彻底穿帮崩盘”再切回“防卫与保护性圆场”',
            '演出所营造的现实印象是一件微妙而脆弱的东西，哪怕很微小的失误也足以将它击碎。',
            'The impression of reality fostered by a performance is a delicate, fragile thing that can be shattered by very minor mishaps.',
            '戈夫曼《日常生活中的自我呈现》第 1 章（1959, p. 56）'
          ],
          [
            '观察“防卫与保护性圆场”中观众如何主动配合演员挽回场面',
            '当表演者出现小失误时，观众往往也会施展机智与体贴（Tact），礼貌地假装没有注意到这一失误，以帮助表演者把戏继续演下去。',
            'When performers make a slip, the audience frequently exercises tact, tactfully pretending not to have noticed the disruption in order to help the performers save their show.',
            '戈夫曼《日常生活中的自我呈现》第 6 章'
          ]
        ]
      }
    ]
  }
];
