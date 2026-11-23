import { PhilosophyModel } from '../types/philosophy';

export const MODELS_114_TO_123: PhilosophyModel[] = [
  {
    id: 114,
    slug: 'minest_piaget_cognitive',
    title: '皮亚杰 · 认知发展',
    philosopher: '让·皮亚杰',
    concept: '图式（Schema）、同化与顺应、液体守恒与四阶段认知建构',
    categoryGroup: '三、心理学与认知科学（114–123）',
    tags: ['发展心理学', '发生认识论'],
    playSummary: '操作守恒、分类与观点采择等经典任务，比较不同发展阶段',
    levelsSummary: '矮宽杯倒入细高杯的守恒实验 · 从同化（Assimilation）到重构图式的顺应（Accommodation）',
    source: 'Piaget, The Origins of Intelligence in Children (1936) / The Psychology of Intelligence (1947)',
    quoteCount: 4,
    thumbType: 'psy_piaget',
    coreQuestion: '为什么当着 4 岁孩子的面把矮宽杯里的水全部倒进细高杯，他会无比笃定地说“现在水变多了”，而 8 岁孩子却能立刻看出水一样多？',
    boundaryNote: '发展模型仅用于认知理论教学，不用于对真实个人作心理诊断；文化经验与任务情境熟悉度会使具体年龄阶段表现出现弹性。',
    stages: [
      {
        id: 1,
        tabLabel: '① 液体守恒实验与去中心化',
        instructionTitle: '阶段 ①：在画布上倾倒烧杯并切换“前运算阶段（单维高度中心化）”与“具体运算阶段（高度×宽度双向补偿可逆性）”视角',
        mappings: [
          [
            '倾倒烧杯观察前运算阶段注意力被“水位高度”单一维度捕获',
            '在前运算阶段，儿童的思维受制于知觉中心化（Centration）：他的注意力只聚焦于水柱变高这一显著维度，而忽略了杯身变窄的补偿。',
            'The child centers his attention on one dimension only—the height of the liquid—and ignores the decrease in width.',
            'Piaget, The Child’s Conception of Number (1941)'
          ],
          [
            '切换至具体运算可逆性视角，通过“倒回去还是一样”达成守恒（Conservation）',
            '一旦运算思维具备了可逆性（Reversibility）与去中心化能力，儿童就意识到：既然水可以原封不动倒回原杯，其数量就必然保持守恒。',
            'Conservation is a necessary condition for all rational activity.',
            'Piaget, The Child’s Conception of Number (1941)'
          ]
        ]
      },
      {
        id: 2,
        tabLabel: '② 同化（Assimilation）→ 失衡 → 顺应（Accommodation）',
        instructionTitle: '阶段 ②：将新奇反例（如会飞的蝙蝠/鲸鱼）拖入原有认知图式，促成图式从强行同化升级为顺应重构',
        mappings: [
          [
            '用既有图式接纳符合预期的经验（同化）',
            '智力在其实质上就是同化（Assimilation）：它把外部经验现实整合进主体自己的行动与认知图式（Schemas）之中。',
            'Intelligence is assimilation to the extent that it incorporates all the given data of experience within its framework.',
            'Piaget, The Origins of Intelligence in Children (1936)'
          ],
          [
            '面对旧图式无法解释的冲突失衡，主动改写图式结构以完成顺应与新平衡',
            '当既有图式不足以同化新环境时，主体就会调整并重构自身的认知图式以适应现实——正是同化与顺应之间的动态平衡（Equilibration）推动了认知发展。',
            'Mental life is also accommodation to the environment. Assimilation can never be pure because by incorporating new elements into its earlier schemata the intelligence constantly modifies the latter to adjust them to new elements.',
            'Piaget, The Origins of Intelligence in Children (1936)'
          ]
        ]
      }
    ]
  },
  {
    id: 115,
    slug: 'minest_vygotsky_zpd',
    title: '维果茨基 · 最近发展区',
    philosopher: '列夫·维果茨基',
    concept: '最近发展区（ZPD）、社会文化中介与鹰架支持（Scaffolding）动态撤除',
    categoryGroup: '三、心理学与认知科学（114–123）',
    tags: ['教育心理学', 'Top 8 优先'],
    playSummary: '调整任务难度和辅助程度，观察学习者能否完成任务',
    levelsSummary: '舒适区（无聊）vs 恐慌区（挫败）vs 最近发展区（ZPD） · 鹰架辅助与渐进撤架',
    source: 'Vygotsky, Mind in Society: The Development of Higher Psychological Processes (1978 / 1934)',
    quoteCount: 4,
    thumbType: 'psy_zpd',
    priorityRank: 8,
    coreQuestion: '好的教学应该是等孩子完全成熟了再教，还是瞄准那些“他独自做不出、但在有经验者搭一把手时恰好能突破”的潜力地带？',
    boundaryNote: '仅用于教学设计参考；有效的鹰架支持（Scaffolding）必须随学习者能力内化而逐步撤除，过度包办反而会阻碍独立能力发展。',
    stages: [
      {
        id: 1,
        tabLabel: '① 定位最近发展区（ZPD）与鹰架搭设',
        instructionTitle: '阶段 ①：拖动任务难度与导师鹰架辅助（Scaffolding）两条滑杆，使学习者精准进入金色“最近发展区”',
        mappings: [
          [
            '对比学习者独自解决问题的现有水平与获得提示辅助后的潜在发展水平',
            '最近发展区（Zone of Proximal Development）是指：由独立解决问题所决定的实际发展水平，与在成人指导下或与更有能力的同伴合作解决问题所决定的潜在发展水平之间的距离。',
            'The distance between the actual developmental level as determined by independent problem solving and the level of potential development as determined through problem solving under adult guidance or in collaboration with more capable peers.',
            'Vygotsky, Mind in Society p. 86 (1978)'
          ],
          [
            '搭设恰当的提示鹰架，让走在发展前面的教学唤醒正在成熟的心理机能',
            '唯一好的教学，就是走在发展前面的教学，并引导发展前进；它唤醒并激活那些正处于最近发展区内的成熟过程。',
            'The only "good learning" is that which is in advance of development.',
            'Vygotsky, Mind in Society p. 89 (1978)'
          ]
        ]
      },
      {
        id: 2,
        tabLabel: '② 从人际协同到心理内化与“撤架（Fading）”',
        instructionTitle: '阶段 ②：随着学习者熟练度上升，逐步向左撤除外部鹰架支撑，将今日的合作能力转化为明日的独立能力',
        mappings: [
          [
            '观察高级心理机能如何先在人际互动（社会层面）中出现，再内化为个人内部心智',
            '在儿童的文化发展中，每一种高级心理机能都会在舞台上出现两次：第一次是在社会层面上作为人与人之间的心理间范畴，第二次是在个体内部作为心理内范畴。',
            'Every function in the child’s cultural development appears twice: first, on the social level, and later, on the individual level; first, between people (interpsychological), and then inside the child (intrapsychological).',
            'Vygotsky, Mind in Society p. 57 (1978)'
          ],
          [
            '完成鹰架撤除（Fading），验证“今天在合作中能做到的，明天就能独立做到”',
            '儿童今天在合作与协助下能够做到的事情，他明天就能够独立自主地做到。',
            'What a child can do with assistance today she will be able to do by herself tomorrow.',
            'Vygotsky, Mind in Society p. 87 (1978)'
          ]
        ]
      }
    ]
  },
  {
    id: 116,
    slug: 'minest_skinner_operant',
    title: '斯金纳 · 操作性条件作用',
    philosopher: '伯尔赫斯·弗雷德里克·斯金纳',
    concept: '斯金纳箱、强化物后果塑造行为与可变比率强化程序（Variable-Ratio Schedule）',
    categoryGroup: '三、心理学与认知科学（114–123）',
    tags: ['行为主义', '学习心理学'],
    playSummary: '调整强化时机与奖励规则，观察模拟行为频率',
    levelsSummary: '正强化、负强化与惩罚 · 固定奖励 vs 随机可变比率强化（最高反应率与抗消退）',
    source: 'Skinner, The Behavior of Organisms (1938) / Science and Human Behavior (1953)',
    quoteCount: 4,
    thumbType: 'psy_skinner',
    coreQuestion: '为什么每次按压杠杆都必然掉出食丸的鸽子一旦停粮很快就放弃按压，而只有随机不确定概率掉出食丸的鸽子却会疯狂持续按压？',
    boundaryNote: '长于解释外显习惯塑造与强化规律，但不能忽视人类内源性好奇心与认知期待（外在奖励有时会产生德西“过度辩护效应”削弱内在动机）。',
    stages: [
      {
        id: 1,
        tabLabel: '① 斯金纳箱：行为受其后果支配',
        instructionTitle: '阶段 ①：在斯金纳箱画布中点击给予“正强化（投喂奖励）”或“消退（停止强化）”，观察自发操作行为频率曲线的爬升与衰减',
        mappings: [
          [
            '在压杆行为发生后立即给予强化物，观察压杆频率迅速上升',
            '操作性行为不是由先前的刺激被动引发的，而是由有机体主动发出、并受其随后在环境中产生的后果（强化物）所塑造和维持的。',
            'Behavior is shaped and maintained by its consequences.',
            'Skinner, Beyond Freedom and Dignity (1971) / The Behavior of Organisms (1938)'
          ],
          [
            '区分增强行为频率的“强化（正强化/负强化）”与撤除强化后的“消退（Extinction）”',
            '当某一反应之后伴随着强化物时，该操作性反应在未来再次发生的概率就会显著增加。',
            'If the occurrence of an operant is followed by presentation of a reinforcing stimulus, the strength is increased.',
            'Skinner, The Behavior of Organisms p. 21 (1938)'
          ]
        ]
      },
      {
        id: 2,
        tabLabel: '② 强化时间表：固定比率 vs 可变比率（VR）',
        instructionTitle: '阶段 ②：切换强化规则为“连续固定奖励”与“随机可变比率奖励（VR）”，观察后者极高的行为反应速率与抗消退韧性',
        mappings: [
          [
            '切换至随机可变比率强化程序（Variable-Ratio），观察无停顿的高频持续反应',
            '可变比率强化时间表（强化在平均一定次数的反应后随机出现）能够产生极高且稳定的反应速率，并且一旦停止强化也最难发生消退。',
            'A variable-ratio schedule generates a very high rate of response and renders the behavior extremely resistant to extinction.',
            'Ferster & Skinner, Schedules of Reinforcement (1957)'
          ],
          [
            '理解渐进塑造法（Shaping）：通过连续强化趋近目标的微小步骤习得复杂技能',
            '通过对逐步趋近目标行为的一系列微小变化进行差别强化（Shaping），我们可以塑造出原本极少自发出现的复杂行为模式。',
            'Operant conditioning shapes behavior as a sculptor shapes a lump of clay.',
            'Skinner, Science and Human Behavior p. 91 (1953)'
          ]
        ]
      }
    ]
  },
  {
    id: 117,
    slug: 'minest_pavlov_classical',
    title: '巴甫洛夫 · 经典条件作用',
    philosopher: '伊万·巴甫洛夫',
    concept: '非条件刺激（US）、条件刺激（CS）配对习得、消退与自发恢复',
    categoryGroup: '三、心理学与认知科学（114–123）',
    tags: ['行为心理学', '生理心理学'],
    playSummary: '配对中性刺激和非条件刺激，观察条件反应形成',
    levelsSummary: '铃声(CS)与食物(US)多次联结配对 · 单摇铃引发唾液分泌(CR)与消退过程',
    source: 'Pavlov, Conditioned Reflexes: An Investigation of the Physiological Activity of the Cerebral Cortex (1927)',
    quoteCount: 4,
    thumbType: 'psy_pavlov',
    coreQuestion: '原本完全不会引起流口水的中性铃声，是如何通过与食物的精准时间配对，转化为能够直接触发交感与腺体反应的“信号”的？',
    boundaryNote: '条件联结的建立不仅取决于配对次数，还取决于条件刺激（CS）对非条件刺激（US）是否具有可靠的预测信息价值（Rescorla-Wagner 规则）。',
    stages: [
      {
        id: 1,
        tabLabel: '① 铃声（CS）+ 食物（US）联结习得',
        instructionTitle: '阶段 ①：在画布上先点击“摇响铃声”紧接着投放“肉粉食物”，完成 3 次以上时间配对以建立条件反射神经联结',
        mappings: [
          [
            '单独摇铃观察初始状态下仅引发朝向反射而无唾液分泌',
            '非条件反射是有机体与生俱来的本能反应（如食物入嘴引起唾液分泌）；而条件反射则是个体在后天生活经验中通过信号配对新建立的暂时神经联系。',
            'The permanent connection of the external agent with the response of the organism is called an unconditioned reflex, and the temporary connection is called a conditioned reflex.',
            'Pavlov, Conditioned Reflexes Lecture I (1927)'
          ],
          [
            '完成多次“铃声先于食物”配对后单独摇铃，触发强烈的条件反射分泌（CR）',
            '当任何原本无关的中性刺激多次与非条件刺激在时间上重合出现后，该中性刺激本身便获得了单独唤醒同样生理反应的信号力量。',
            'Any natural phenomenon chosen at will may be converted into a conditioned stimulus.',
            'Pavlov, Conditioned Reflexes Lecture II (1927)'
          ]
        ]
      },
      {
        id: 2,
        tabLabel: '② 刺激泛化、分化与条件消退（Extinction）',
        instructionTitle: '阶段 ②：连续多次只摇铃不给食物观察条件反应“消退”，或休整片刻后观察“自发恢复”',
        mappings: [
          [
            '连续多次单独呈现铃声而不伴随食物，观察条件反应强度逐渐衰减（消退）',
            '如果条件刺激在一段时间内反复单独出现而不再得到非条件刺激的强化，条件反射就会受到内抑制而逐渐减弱直至消退（Extinction）。',
            'If a conditioned stimulus is repeated several times without reinforcement by the unconditioned stimulus, the conditioned reflex gradually weakens and finally disappears.',
            'Pavlov, Conditioned Reflexes Lecture IV (1927)'
          ],
          [
            '验证消退并非彻底抹除记忆痕迹：经历休息后再次摇铃出现“自发恢复”',
            '消退了的条件反射并不是被彻底摧毁了，而只是受到了抑制；在经过一段时间的自然间歇后，它会自发地部分恢复。',
            'Extinction does not destroy the conditioned reflex, it merely inhibits it.',
            'Pavlov, Conditioned Reflexes (1927)'
          ]
        ]
      }
    ]
  },
  {
    id: 118,
    slug: 'minest_bandura_social_learning',
    title: '班杜拉 · 社会学习理论',
    philosopher: '阿尔伯特·班杜拉',
    concept: '观察学习（注意—保持—复现—动机）、替代性强化与自我效能感',
    categoryGroup: '三、心理学与认知科学（114–123）',
    tags: ['社会认知理论', '观察学习'],
    playSummary: '操作榜样行为、观察机会与后果，探索模仿学习',
    levelsSummary: '波波玩偶（Bobo Doll）榜样观察 · 潜伏习得（Acquisition）与替代性奖惩下的外显表现（Performance）',
    source: 'Bandura, Social Learning Theory (1977) / Transmission of Aggression through Imitation (1961)',
    quoteCount: 4,
    thumbType: 'psy_bandura',
    coreQuestion: '人类学习新行为真的必须亲自去试错、亲自挨罚或领奖吗？看到别人做某事受到奖励或惩罚（替代性强化）会如何塑造我们的行动？',
    boundaryNote: '严格区分了“习得（学会了怎么做）”与“外显执行（愿不愿意做出来）”：看到榜样受罚会抑制外显模仿，但观察者依然在脑中学会了该行为。',
    stages: [
      {
        id: 1,
        tabLabel: '① 观察学习的四过程与波波玩偶实验',
        instructionTitle: '阶段 ①：在画布中调节观察者对榜样的“注意力、记忆保持、动作复现与替代性动机”，无需亲身试错即习得复杂行为',
        mappings: [
          [
            '开启榜样示范，观察学习者无需直接强化便在认知中编码了新行为图式',
            '如果人类只能完全依靠自己亲身试错的直接后果来学习，那将是极其缓慢且危险的；幸运的是，绝大多数人类行为都是通过观察榜样而习得的。',
            'Fortunately, most human behavior is learned observationally through modeling: from observing others one forms an idea of how new behaviors are performed.',
            'Bandura, Social Learning Theory p. 22 (1977)'
          ],
          [
            '打通“注意 → 保持 → 运动复现 → 动机激励”四个观察学习子过程',
            '观察学习受到四个相互关联的过程调节：注意过程、保持过程、动作复现过程以及动机激励过程。',
            'Observational learning is governed by four component processes: attentional, retention, motor reproduction, and motivational processes.',
            'Bandura, Social Learning Theory Ch. 2 (1977)'
          ]
        ]
      },
      {
        id: 2,
        tabLabel: '② 替代性强化（Vicarious Reinforcement）：习得 vs 执行',
        instructionTitle: '阶段 ②：切换榜样在行动后“受到表扬”与“受到批评”，对比观察者的“潜在习得记忆”与“实际外显模仿率”',
        mappings: [
          [
            '让榜样受到惩罚，观察学习者虽不主动模仿（抑制执行），但在提供奖励时仍能完整复现（证明已习得）',
            '必须将观察学习的“内在习得（Acquisition）”与“外显表现（Performance）”区分开来，因为人们不会把他们学会的每一件事都付诸行动。',
            'Social learning theory distinguishes between acquisition and performance because people do not enact everything they learn.',
            'Bandura, Social Learning Theory p. 28 (1977)'
          ],
          [
            '让榜样获得奖励（替代性正强化），观察学习者的自我效能感与外显模仿意愿大幅跃升',
            '看到与自己相似的榜样通过努力获得成功，不仅提供了替代性强化，还能显著增强观察者相信自己也能做成此事的“自我效能感（Self-Efficacy）”。',
            'Observed consequences influence behavior in much the same way as directly experienced consequences.',
            'Bandura, Social Foundations of Thought and Action (1986)'
          ]
        ]
      }
    ]
  },
  {
    id: 119,
    slug: 'minest_bowlby_attachment',
    title: '鲍尔比 — 依恋理论',
    philosopher: '约翰·鲍尔比 / 玛丽·安斯沃斯',
    concept: '安全基地（Secure Base）、照护敏感回应与内部工作模型（Internal Working Model）',
    categoryGroup: '三、心理学与认知科学（114–123）',
    tags: ['发展心理学', '人际关系'],
    playSummary: '在照护互动情境中比较回应方式与关系模式',
    levelsSummary: '安全基地与陌生情境探索半径 · 敏感一致回应 vs 忽冷忽热/冷漠回避',
    source: 'Bowlby, Attachment and Loss (1969) / A Secure Base (1988); Ainsworth, Patterns of Attachment (1978)',
    quoteCount: 4,
    thumbType: 'psy_bowlby',
    coreQuestion: '为什么拥有温暖可靠依恋关系的孩子，反而比被过早强迫“独立”的孩子更敢于独自走远去探索陌生的世界？',
    boundaryNote: '仅用于理论教学，不用于对真实个人作心理诊断；早期内部工作模型并非终身宿命，在成年后的安全关系与自我反思中具有可塑性（获得性安全依恋）。',
    stages: [
      {
        id: 1,
        tabLabel: '① 安全基地（Secure Base）与探索圆半径',
        instructionTitle: '阶段 ①：拖动照护者的“敏感及时回应度”滑杆，观察儿童从“安全基地”出发向外探索世界的最大半径变化',
        mappings: [
          [
            '提高安全基地的温暖可靠度，观察儿童在安心确认后勇敢向外扩大探索圈',
            '当一个人确信无论何时需要，支持性的依恋对象都会在身后随时提供避风港时，他反而最能够勇敢、自信地走出去探索陌生的世界。',
            'Human beings of all ages are found to be at their happiest and to be able to deploy their talents to best advantage when they are confident that, standing behind them, there are one or more trusted persons who will come to their aid should difficulties arise.',
            'Bowlby, Personality Development / A Secure Base (1988)'
          ],
          [
            '理解依恋寻求并非软弱依赖，而是进化赋予人类生存与探索的安全基石',
            '照护者最重要的角色是提供一个“安全基地（Secure Base）”，让儿童和青少年能够从这里出发去探索外部世界，并在受惊或疲惫时安心归来。',
            'A central feature of my concept of parenting is the provision by both parents of a secure base from which a child or an adolescent can make sorties into the outside world and to which he can return knowing for sure that he will be welcomed.',
            'Bowlby, A Secure Base Lecture 1 (1988)'
          ]
        ]
      },
      {
        id: 2,
        tabLabel: '② 回应模式与内部工作模型（Internal Working Models）',
        instructionTitle: '阶段 ②：切换照护反馈模式（一致敏感 / 忽冷忽热不一致 / 冷漠拒绝），观察个体关于“自我是否值得爱、他人是否可信赖”的工作模型形成',
        mappings: [
          [
            '比较不同照护回应一致性对依恋策略（安全型、焦虑矛盾型、回避型）的塑造',
            '在生命最初几年的日常互动中，个体构建了关于依恋对象是否会予以回应、以及自我是否值得被帮助的“内部工作模型（Internal Working Models）”。',
            'Each individual builds working models of the world and of himself in it, with the aid of which he perceives events, forecasts the future, and constructs his plans.',
            'Bowlby, Attachment and Loss Vol. 2: Separation (1973)'
          ],
          [
            '确认内部工作模型在新的安全关系体验中仍可更新与修复',
            '虽然早期的内部工作模型具有延续的倾向，但当个体在后来的生活中遇到持续温暖、可靠的伴侣或关系体验时，这些工作模型是可以被修正和更新的。',
            'Working models are not immutable; they can be revised in light of new relationship experiences.',
            'Bowlby, A Secure Base (1988)'
          ]
        ]
      }
    ]
  },
  {
    id: 120,
    slug: 'minest_festinger_dissonance',
    title: '费斯廷格 · 认知失调',
    philosopher: '利昂·费斯廷格',
    concept: '认知不一致张力、1美元 vs 20美元不足理由效应与态度自我合理化',
    categoryGroup: '三、心理学与认知科学（114–123）',
    tags: ['社会心理学', '态度改变'],
    playSummary: '改变行为、信念和自我解释，探索失调及其缓解',
    levelsSummary: '行为与信念冲突的心理紧绷 · 改变行为 vs 修改信念（“葡萄本来就是酸的”）与 1 美元实验',
    source: 'Festinger, A Theory of Cognitive Dissonance (1957) / Festinger & Carlsmith (1959)',
    quoteCount: 4,
    thumbType: 'psy_dissonance',
    coreQuestion: '让受试者做完极度枯燥的拧螺丝任务后去向下一位同学夸任务“很有趣”，为什么只拿了 1 美元报酬的人，事后反而比拿了 20 美元的人更真心相信任务真的很有趣？',
    boundaryNote: '只有当个体感到自己的违心行为是出于“自由选择”且外部理由不足时，才会强烈促发通过改变内在态度来消解认知失调。',
    stages: [
      {
        id: 1,
        tabLabel: '① 认知冲突张力与失调消解三路径',
        instructionTitle: '阶段 ①：当“我知道熬夜/吸烟有害”与“我正在熬夜/吸烟”发生剧烈碰撞时，在画布中操作“改变行为”或“添加合理化借口”以平息失调警报',
        mappings: [
          [
            '触发两个相互矛盾的认知元素同场对撞，观察心理失调张力飙升',
            '当一个人同时持有两个在心理上相互矛盾的认知（观念、态度或对自身行为的知觉）时，就会产生一种不舒服的“认知失调”状态，驱使他去设法减轻这种失调。',
            'The existence of dissonance, being psychologically uncomfortable, will motivate the person to try to reduce the dissonance and achieve consonance.',
            'Festinger, A Theory of Cognitive Dissonance p. 3 (1957)'
          ],
          [
            '测试当人们难以戒除既有行为时，如何通过修改信念或淡化危害来自我合理化',
            '要减少认知失调，个体可以改变自己的行为认知，或者改变关于环境的信念，又或者引入新的协调认知元素来为既定行为辩护。',
            'The presence of dissonance gives rise to pressures to reduce or eliminate the dissonance.',
            'Festinger, A Theory of Cognitive Dissonance p. 18 (1957)'
          ]
        ]
      },
      {
        id: 2,
        tabLabel: '② 1 美元 vs 20 美元实验（不足理由效应）',
        instructionTitle: '阶段 ②：拖动外部金钱报酬滑杆（从 $20 降到 $1），观察当外部报酬不足以替“说违心话”辩护时，内在态度如何发生真实反转',
        mappings: [
          [
            '设置为 20 美元高报酬：外部理由充足（“我是为了 20 美元才夸它的”），内在态度无需改变',
            '如果迫使一个人做出与私下信念相反的外显行为所用的外部奖励或威胁越大，他事后产生的认知失调就越小，其真实态度改变也就越小。',
            'The larger the pressure used to elicit the overt behavior (beyond the minimum needed to produce it), the weaker will be the tendency for the private opinion to change.',
            'Festinger & Carlsmith, Journal of Abnormal and Social Psychology 58(2), 1959'
          ],
          [
            '拉低至 1 美元微薄报酬：为消除“我不是为 1 块钱包庇谎言的人”的失调，真心改信“任务其实挺好玩”',
            '当个体只拿到 1 美元就对别人说任务很有趣时，由于外部理由严重不足，他消除失调的唯一办法就是说服自己：“这任务其实真的很吸引人！”',
            'If a person is induced to do or say something which is contrary to his private opinion, there will be a tendency for him to change his opinion so as to bring it into correspondence with what he has done or said.',
            'Festinger & Carlsmith, Cognitive Consequences of Forced Compliance (1959)'
          ]
        ]
      }
    ]
  },
  {
    id: 121,
    slug: 'minest_maslow_needs',
    title: '马斯洛 · 需要层次',
    philosopher: '亚伯拉罕·马斯洛',
    concept: '匮乏性需要（Deficiency Needs：生理、安全、归属、尊重）与成长性自我实现需要（Being Needs）',
    categoryGroup: '三、心理学与认知科学（114–123）',
    tags: ['人本主义心理学', '动机理论'],
    playSummary: '在生活情境中调整需求满足程度，探索需求间的联系',
    levelsSummary: '从生理温饱、安全、爱与归属、尊重到自我实现 · 匮乏性动机（满足即减退）vs 成长性动机（越满足越充沛）',
    source: 'Maslow, A Theory of Human Motivation (1943) / Motivation and Personality (1954)',
    quoteCount: 4,
    thumbType: 'psy_maslow',
    coreQuestion: '为什么有些需求一旦吃饱穿暖就不再占据我们的注意力，而对创造、求知与潜能实现的渴望却越是满足就越是蓬勃？',
    boundaryNote: '马斯洛本人强调需要层次并非僵化死板的“100% 满足下一层才开启上一层”阶梯，在理想信念或创造高峰体验下常出现跨层级超越。',
    stages: [
      {
        id: 1,
        tabLabel: '① 五层需要的动态涌现与重心转移',
        instructionTitle: '阶段 ①：由低到高依次注满生理、安全、归属与尊重需要滑杆，观察个体的核心意识焦点如何逐层向上迁移',
        mappings: [
          [
            '在底层生理与安全严重匮乏时，观察全部心理注意力被生存焦虑垄断',
            '对于一个处于极端且长期饥饿状态的人来说，除了食物之外没有任何其他兴趣；他梦想的是食物，记忆的是食物，感知到的也只有食物。',
            'For our chronically and extremely hungry man, Utopia can be defined very simply as a place where there is plenty of food.',
            'Maslow, Psychological Review 50(4), 1943'
          ],
          [
            '充实基础需求后，观察更高层次的归属、尊重与自我实现渴望自然浮现',
            '当最紧迫的基础需要得到相对满足时，它们就会退居幕后，而更高一级的需要便立即涌现出来并支配有机体的意识中心。',
            'At once other (and "higher") needs emerge and these, rather than physiological hungers, dominate the organism.',
            'Maslow, A Theory of Human Motivation (1943)'
          ]
        ]
      },
      {
        id: 2,
        tabLabel: '② 匮乏性动机（D-Needs）vs 成长性自我实现（B-Needs）',
        instructionTitle: '阶段 ②：对比前四层“因缺失而焦虑、满足即平息”的匮乏性需要与顶层“充分发挥潜能”的成长性需要',
        mappings: [
          [
            '解锁顶层自我实现（Self-Actualization）：成为自己所能成为的一切',
            '音乐家必须谱曲，画家必须作画，诗人必须写诗，否则他就无法获得内心的安宁。一个人能够成为什么，他就必须成为什么——这就是自我实现。',
            'What a man can be, he must be. This need we may call self-actualization.',
            'Maslow, A Theory of Human Motivation p. 382 (1943)'
          ],
          [
            '观察非僵化弹性：多数正常人在各层级上都是部分满足、并行交织的',
            '我们绝不能把这一层次结构理解得过于死板，好像必须等某一种需要百分之百满足之后，下一种需要才会出现；现实中各层需要是按递减百分比同时并存的。',
            'We have spoken so far as if this hierarchy were a fixed order, but actually it is not nearly so rigid as we may have implied.',
            'Maslow, Psychological Review (1943)'
          ]
        ]
      }
    ]
  },
  {
    id: 122,
    slug: 'minest_ebbinghaus_forgetting',
    title: '艾宾浩斯 · 遗忘曲线',
    philosopher: '赫尔曼·艾宾浩斯',
    concept: '无意义音节实验、先快后慢指数衰减曲线、重学节省率（Savings）与间隔重复效应',
    categoryGroup: '三、心理学与认知科学（114–123）',
    tags: ['认知心理学', '记忆科学'],
    playSummary: '调整复习时间与间隔，观察记忆保持模型',
    levelsSummary: '20分钟/1小时/1天后的陡峭遗忘衰减 · 集中临时抱佛脚 vs 间隔复习（Spaced Repetition）使曲线变平',
    source: 'Ebbinghaus, Memory: A Contribution to Experimental Psychology (Über das Gedächtnis, 1885)',
    quoteCount: 4,
    thumbType: 'psy_ebbinghaus',
    coreQuestion: '为什么刚背熟的知识在最初几小时内遗忘得最快？如何在最恰当的时间点投放复习脉冲，用最少的总耗时把短期记忆固化为长期记忆？',
    boundaryNote: '艾宾浩斯原始实验使用的是剥离了语义关联的“无意义音节”；对于理解透彻、具有丰富逻辑结构与情感意义的知识，遗忘速率会慢得多。',
    stages: [
      {
        id: 1,
        tabLabel: '① 先快后慢的遗忘衰减与“重学节省率”',
        instructionTitle: '阶段 ①：沿时间轴拖动观察无复习状态下记忆保持率 R = e^(-t/S) 的陡峭滑坡，并测量重学时的时间节省率',
        mappings: [
          [
            '观察学习后最初 1 小时至 24 小时内的急速遗忘与随后的平缓尾端',
            '遗忘的进程绝不是匀速线性的：在学习刚刚结束后的最初一段时间里，遗忘的速度极快，随后则变得越来越缓慢。',
            'Left to itself every mental content gradually loses its capacity for being revived... rapidly at first, then more slowly.',
            'Ebbinghaus, Memory: A Contribution to Experimental Psychology Ch. 7 (1885)'
          ],
          [
            '验证即使表面无法回忆，潜藏的记忆痕迹仍表现为重新学习时的“节省（Savings）”',
            '即使一段记忆看似已经完全无法主动背诵出来，它也并没有彻底归零；当我们重新学习它时，所需的时间和遍数会比初次学习显著减少（节省法）。',
            'Hidden in the unconscious, traces remain which manifest themselves by a saving of work when the series is relearned.',
            'Ebbinghaus, Über das Gedächtnis (1885)'
          ]
        ]
      },
      {
        id: 2,
        tabLabel: '② 间隔效应（Spacing Effect）：用复习脉冲垫高记忆稳定性',
        instructionTitle: '阶段 ②：在画布时间轴上点击投放 3 次间隔复习脉冲（1天、3天、7天），观察每次提取复习后遗忘曲线斜率大幅变缓',
        mappings: [
          [
            '对比“一天内连背 30 遍”与“分散在几天内间隔复习”的长期保持率差距',
            '对于任何给定数量的重复次数，把这些复习合理地分散在一段时间内，比把它们集中在同一时间一次性塞完，显然更为有利和持久。',
            'With any considerable number of repetitions a suitable distribution of them over a space of time is decidedly more advantageous than the massing of them at a single time.',
            'Ebbinghaus, Memory Ch. 8 (1885)'
          ],
          [
            '连续点亮三次间隔复习节点，使记忆稳定性 S 倍增、保持率锚定在 85% 以上',
            '每一次在即将遗忘的临界点进行的主动检索与重学，都会使随后的遗忘衰减速度比上一次更加缓慢。',
            'Each subsequent repetition increases the durability of the memory trace and flattens the rate of forgetting.',
            'Ebbinghaus, Memory (1885)'
          ]
        ]
      }
    ]
  },
  {
    id: 123,
    slug: 'minest_baddeley_working_memory',
    title: '巴德利 · 工作记忆模型',
    philosopher: '艾伦·巴德利 / 格雷厄姆·希奇',
    concept: '多成分工作记忆：中央执行系统、语音回路（Phonological Loop）、视空间画板与情景缓冲器',
    categoryGroup: '三、心理学与认知科学（114–123）',
    tags: ['认知心理学', '注意力与记忆'],
    playSummary: '同时操作语言、视觉与执行任务，观察有限认知资源的分配',
    levelsSummary: '同通道双任务冲突（边背数字边读文章）vs 跨通道并行（语音回路 + 视空间画板） · 中央执行注意力瓶颈',
    source: 'Baddeley & Hitch, Working Memory (1974) / Baddeley, The Episodic Buffer (2000)',
    quoteCount: 4,
    thumbType: 'psy_baddeley',
    coreQuestion: '为什么人们往往可以“一边看地图认路、一边听语音播报”，却很难“一边在心里默背电话号码、一边流畅阅读一篇文章”？',
    boundaryNote: '表明人类短期工作记忆不是单一均质的“内存条”，而是具有特定模态子通道与有限中央执行注意力的协同工作台。',
    stages: [
      {
        id: 1,
        tabLabel: '① 语音回路 vs 视空间画板：同通道拥堵与跨通道分流',
        instructionTitle: '阶段 ①：将两项任务同时拖入“语音回路（内部耳朵）”观察严重干扰，再将其中一项改派至“视空间画板（内部眼睛）”实现顺畅并行',
        mappings: [
          [
            '将两项语言任务同时压入语音回路，触发发音抑制与记忆丢包',
            '工作记忆并非一个单一的短期存储库，而是由一个有限容量的中央执行系统和两个专门的从属缓存系统——处理语言声音的“语音回路”与处理图像的“视空间画板”所组成。',
            'We propose to divide working memory into a central executive controller aided by two slave systems: the phonological loop and the visuo-spatial sketchpad.',
            'Baddeley & Hitch, Psychology of Learning and Motivation Vol. 8 (1974)'
          ],
          [
            '将视觉空间任务与语音任务分离到两个不同子通道，观察双任务高效并行',
            '当两项任务分别占用不同的从属子系统（例如一项使用语音回路、另一项使用视空间画板）时，它们之间的相互干扰要远小于两项任务争抢同一通道。',
            'Dual-task performance is much better when the two tasks draw on separate slave systems than when both compete for the phonological loop.',
            'Baddeley, Working Memory (1986)'
          ]
        ]
      },
      {
        id: 2,
        tabLabel: '② 中央执行系统（Central Executive）与情景缓冲器',
        instructionTitle: '阶段 ②：拖动任务复杂度滑杆，观察当高难度推理耗尽顶层“中央执行注意力”时，所有子通道如何同时减速',
        mappings: [
          [
            '提高中央执行系统的注意切换与抑制负荷，体会核心认知瓶颈',
            '中央执行系统是工作记忆中最核心但容量最有限的控制中枢，负责聚焦注意力、抑制干扰以及在多个任务之间调配认知资源。',
            'The central executive is assumed to be an attentional-controlling system, responsible for strategy selection and coordination of the slave systems.',
            'Baddeley, Quarterly Journal of Experimental Psychology (1996)'
          ],
          [
            '激活情景缓冲器（Episodic Buffer），将语音、视觉与长期记忆整合成连贯场景块',
            '情景缓冲器作为一个多模态的临时整合界面，把来自语音回路、视空间画板以及长期记忆的信息绑定成连贯的情景组块（Chunks）。',
            'The episodic buffer is a limited-capacity temporary storage system that is capable of integrating information from a variety of sources.',
            'Baddeley, Trends in Cognitive Sciences 4(11), 2000'
          ]
        ]
      }
    ]
  }
];
