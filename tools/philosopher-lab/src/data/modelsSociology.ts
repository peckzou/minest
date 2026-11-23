import { PhilosophyModel } from '../types/philosophy';

export const MODELS_102_TO_113: PhilosophyModel[] = [
  {
    id: 102,
    slug: 'minest_weber_ideal_type',
    title: '马克斯·韦伯 · 理想类型',
    philosopher: '马克斯·韦伯',
    concept: '价值关联、单方面纯粹化概念坐标与三种权威类型',
    categoryGroup: '二、社会学与社会结构（102–113）',
    tags: ['古典社会学', '方法论'],
    playSummary: '从现实社会案例中提取特征，构造并比较不同理想类型',
    levelsSummary: '传统型、卡里斯玛型与法理科层型 · 以纯粹概念尺子衡量混合现实',
    source: 'Weber, Objectivity in Social Science (1904) / Economy and Society (1922)',
    quoteCount: 4,
    thumbType: 'soc_weber',
    coreQuestion: '现实中的组织从来不是百分之百纯粹的科层制或个人崇拜，社会学家为什么要刻意构造现实中并不存在的“理想类型”？',
    boundaryNote: '理想类型（Idealtypus）是分析比较的“逻辑标尺”而非道德上的“完美典范”，绝不能把概念模型直接当成经验现实本身。',
    stages: [
      {
        id: 1,
        tabLabel: '① 提纯构造理想类型标尺',
        instructionTitle: '阶段 ①：拖动特征提纯滑杆，将杂乱的经验特征单方面强化为“法理型、传统型、卡里斯玛型”三大理想类型坐标',
        mappings: [
          [
            '从经验现象中抽离并单方面强化核心逻辑特征',
            '理想类型是通过片面地强调一个或几个观点，并把大量弥散的、孤立的个别现象综合成一个内在一致的思维图景而构成的。',
            'An ideal type is formed by the one-sided accentuation of one or more points of view and by the synthesis of a great many diffuse, discrete, more or less present and occasionally absent concrete individual phenomena.',
            'Weber, "Objectivity" in Social Science and Social Policy (1904)'
          ],
          [
            '确认纯粹理想类型在经验现实中无完全对应物，但作为测量标尺不可或缺',
            '就其概念上的纯粹性而言，这种思维图景在现实的经验中是无处可寻的；它是一个乌托邦，是供我们比较和测量现实的概念标尺。',
            'In its conceptual purity, this mental construct cannot be found empirically anywhere in reality. It is a utopia.',
            'Weber, Methodology of the Social Sciences (1904)'
          ]
        ]
      },
      {
        id: 2,
        tabLabel: '② 用理想类型坐标测量混合社会现实',
        instructionTitle: '阶段 ②：将现实组织案例放入三大权威三角坐标系中，测量其与各纯粹理想类型的偏离距离',
        mappings: [
          [
            '对比传统习俗、领袖魅力（Charisma）与形式法理规则的混合比例',
            '现实中的统治很少纯粹属于某一种理想类型，但唯有借助纯粹类型的清晰定义，我们才能精确剖析现实中各种要素的混合与转化。',
            'None of these three ideal types is usually to be found in historical cases in "pure" form.',
            'Weber, Economy and Society Part I, Ch. 3 (1922)'
          ],
          [
            '观察卡里斯玛权威如何随时间“日常化”并向科层或传统类型演进',
            '社会学概念建构的任务，正是通过衡量经验现实与理想类型之间的贴近或偏离程度，来达致对社会行动的因果理解。',
            'Sociological analysis both abstracts from reality and at the same time helps us to understand it, in that it shows with what degree of approximation a concrete historical phenomenon can be subsumed under one or more of these concepts.',
            'Weber, Economy and Society Ch. 1 (1922)'
          ]
        ]
      }
    ]
  },
  {
    id: 103,
    slug: 'minest_durkheim_solidarity',
    title: '涂尔干 · 社会团结',
    philosopher: '埃米尔·涂尔干',
    concept: '社会劳动分工、机械团结（同质相似）与有机团结（异质互补）',
    categoryGroup: '二、社会学与社会结构（102–113）',
    tags: ['古典社会学', '社会分工'],
    playSummary: '调整社会分工和群体联系，比较机械团结与有机团结',
    levelsSummary: '高度相似与压制性刑法（机械团结） · 高度专业分工与恢复性契约法（有机团结）',
    source: 'Durkheim, The Division of Labour in Society (1893)',
    quoteCount: 4,
    thumbType: 'soc_durkheim',
    coreQuestion: '当现代人越来越追求个性差异、不再拥有完全相同的传统信仰时，社会为什么没有分崩离析，反而联结得更加紧密？',
    boundaryNote: '若分工速度超过道德规范与制度调节的建立速度，会产生“失范（Anomie）分工”或“强制分工”病理状态。',
    stages: [
      {
        id: 1,
        tabLabel: '① 机械团结 vs 有机团结',
        instructionTitle: '阶段 ①：拖动社会分工分化度滑杆，观察群体从“全员同质相似的机械团结”向“异质器官互补的有机团结”演进',
        mappings: [
          [
            '在低分工端观察成员高度相似、个人意识被集体意识完全覆盖',
            '源于相似性的社会团结之所以被称为“机械的”，是因为个体就像无机物分子一样毫无自身独特的运动，完全受集体意识的支配。',
            'Solidarity which comes from likenesses is at its maximum when the集体 conscience completely envelops our whole conscience and coincides in all points with it.',
            'Durkheim, The Division of Labour in Society Book I, Ch. 2 (1893)'
          ],
          [
            '拉高劳动分工至高点，观察各异的职业角色如人体器官般相互依赖',
            '有机团结则恰恰相反，它预设个体彼此各不相同；就像高等动物的各个器官各有专司又缺一不可一样，分化越深，整体依赖越强。',
            'Each organ, in effect, has its special physiognomy, its autonomy, and Space for individual personality grows with the division of labor.',
            'Durkheim, The Division of Labour in Society Book I, Ch. 3 (1893)'
          ]
        ]
      },
      {
        id: 2,
        tabLabel: '② 法律类型指标：压制性法 vs 恢复性法',
        instructionTitle: '阶段 ②：对比冒犯集体禁忌时的“严刑惩罚（压制法）”与现代分工失调时的“契约赔偿归位（恢复法）”',
        mappings: [
          [
            '在机械团结下测试压制性法律（刑法）对偏离集体意识者的惩罚',
            '社会团结是一种完全道德的现象，无法直接测量；我们必须用它的外在可见符号——法律体系（压制性法与恢复性法的比例）来表征它。',
            'The visible symbol is law. We may therefore be sure to find reflected in law all the essential varieties of social solidarity.',
            'Durkheim, The Division of Labour in Society Book I, Ch. 1'
          ],
          [
            '在有机团结下激活民商契约恢复法，防止分工过快滑向“失范（Anomie）”',
            '劳动分工的真正功能，是在两个或更多的人之间创造出一种团结感，并使各功能部分之间保持经常的、规范的接触以防止失范。',
            'The true function of the division of labor is to create in two or more persons a feeling of solidarity.',
            'Durkheim, The Division of Labour in Society (1893)'
          ]
        ]
      }
    ]
  },
  {
    id: 104,
    slug: 'minest_simmel_dyad_triad',
    title: '齐美尔 · 社会关系形式',
    philosopher: '格奥尔格·齐美尔',
    concept: '形式社会学、二人组（Dyad）与三人组（Triad）结构质变',
    categoryGroup: '二、社会学与社会结构（102–113）',
    tags: ['形式社会学', '群体规模'],
    playSummary: '在二人、三人和更大群体间切换，观察关系结构变化',
    levelsSummary: '二人组（一人退出即毁灭）到三人组 · 调解者、渔翁得利者与分而治之者',
    source: 'Simmel, The Number of Members as Determining the Sociological Form of the Group (1902) / Sociology (1908)',
    quoteCount: 4,
    thumbType: 'soc_simmel',
    coreQuestion: '为什么从“两个人”增加到“三个人”，所带来的社会结构剧变，远比从三个人增加到一千个人还要深刻？',
    boundaryNote: '聚焦互动的纯粹几何“形式（Form）”而非具体利益“内容”；揭示了多数决与超个人机构诞生的最小群体阈值。',
    stages: [
      {
        id: 1,
        tabLabel: '① 二人组（Dyad）到三人组（Triad）的跃迁',
        instructionTitle: '阶段 ①：在画布上将群体人数从 2 人增加为 3 人，观察“超个人群体结构”与“2 对 1 多数压力”的诞生',
        mappings: [
          [
            '测试二人组（Dyad）：任何一人撤出，关系共同体即刻彻底消失',
            '二人组（Dyad）的决定性特征在于：它的存续完全系于每一个人；只要其中一人离开，整体便不复存在，因此它无法形成凌驾于个人之上的超个人权威。',
            'The dyad depends on each of its two elements alone—in its death, though not in its life: for its life, it needs both, but for its death, only one.',
            'Simmel, The Sociology of Georg Simmel (1908)'
          ],
          [
            '引入第三人组成三人组（Triad），观察间接连线与多数决（2:1）结构涌现',
            '第三者的加入彻底改变了关系的性质：除了两人之间的直接联系外，现在产生了一种通过第三者作为媒介的间接联系。',
            'The appearance of the third party indicates transition, conciliation, and abandonment of absolute contrast.',
            'Simmel, Quantitative Aspects of the Group (1908)'
          ]
        ]
      },
      {
        id: 2,
        tabLabel: '② 第三者的三种经典结构角色',
        instructionTitle: '阶段 ②：点击切换第三者角色：不偏不倚的“调解仲裁者”、坐收渔利的“Tertius Gaudens”与“分而治之者”',
        mappings: [
          [
            '将第三者设为公正调解人，化解另外两方的直接情感对立',
            '不偏不倚的第三者（调解人或仲裁人）通过滤除双方冲突中的非理性情绪，把争端还原为可协商的客观问题。',
            'The non-partisan either produces the concord of two colliding parties, or he functions as an arbitrator.',
            'Simmel, Sociology Ch. 2 (1908)'
          ],
          [
            '切换至“渔翁得利者（Tertius Gaudens）”与“分而治之（Divide et Impera）”',
            '在“渔翁得利的第三者”或“分而治之”形式中，第三者利用甚至主动挑起另外两方的不和与竞争，从而为自己攫取支配性的优势地位。',
            'Tertius gaudens (the third who enjoys) turns to his own advantage a disagreement between two others.',
            'Simmel, Sociology Ch. 2 (1908)'
          ]
        ]
      }
    ]
  },
  {
    id: 105,
    slug: 'minest_mead_self',
    title: '米德 · 自我形成理论',
    philosopher: '乔治·赫伯特·米德',
    concept: '符号互动、主我（I）与客我（Me）、从玩耍阶段到概化他者（Generalized Other）',
    categoryGroup: '二、社会学与社会结构（102–113）',
    tags: ['符号互动论', '社会心理学'],
    playSummary: '在角色扮演情境中切换自我与他人的视角',
    levelsSummary: '模仿单一显著他者（Play）到团队规则博弈（Game） · 主我（I）与客我（Me）对话',
    source: 'Mead, Mind, Self, and Society (1934)',
    quoteCount: 4,
    thumbType: 'soc_mead',
    coreQuestion: '婴儿并非生来就有“自我意识”，人类是如何通过扮演他人的角色、把整个社会规则团队装进脑海里而形成完整自我的？',
    boundaryNote: '自我并非被动消融于社会规范（客我 Me）；自发的“主我（I）”始终保留着创造性回应与改造社会规范的能动性。',
    stages: [
      {
        id: 1,
        tabLabel: '① 玩耍（Play）→ 竞赛游戏（Game）→ 概化他者',
        instructionTitle: '阶段 ①：拖动角色采择复杂度滑杆，从扮演单一妈妈/医生（玩耍）升级到同时兼顾棒球场上所有队友位置（概化他者）',
        mappings: [
          [
            '在玩耍阶段（Play）体验逐一切换单一显著他者视角',
            '自我不是与生俱来的，而是在社会经验与活动的过程中发展起来的；只有当个体能够站在他人的立场上把自己当作客体来看待时，自我才得以产生。',
            'The self is something which has a development; it is not initially there, at birth, but arises in the process of social experience and activity.',
            'Mead, Mind, Self, and Society Part III (1934)'
          ],
          [
            '进入团队竞赛阶段（Game），在脑海中整合所有参与者的态度（概化他者）',
            '在有组织的竞赛游戏中，儿童必须准备好承担任何其他参与者的态度；这种整个共同体的有组织态度就被称为“概化他者（the Generalized Other）”。',
            'The organized community or social group which gives to the individual his unity of self may be called "the generalized other."',
            'Mead, Mind, Self, and Society §20 (1934)'
          ]
        ]
      },
      {
        id: 2,
        tabLabel: '② 主我（I）与客我（Me）的内在对话',
        instructionTitle: '阶段 ②：操作社会规范内化的“客我（Me）”与当下自发创新的“主我（I）”互动平衡',
        mappings: [
          [
            '观察“客我（Me）”如何代表个体所采择的他人态度总和',
            '“客我（Me）”是个体自身所采取的一整套有组织的他人态度；而“主我（I）”则是有机体对他人这些态度的当下行动回应。',
            'The "I" is the response of the organism to the attitudes of the others; the "me" is the organized set of attitudes of others which one himself assumes.',
            'Mead, Mind, Self, and Society §22 (1934)'
          ],
          [
            '激发“主我（I）”的创造性行动，打破僵化惯例并重塑共同体',
            '“主我”带来了新颖性与不可预测的自由感，而“客我”则提供了社会协调与责任框架；自我正是这两个阶段永不停息的内在对话过程。',
            'The self is essentially a social process going on with these two distinguishable phases.',
            'Mead, Mind, Self, and Society (1934)'
          ]
        ]
      }
    ]
  },
  {
    id: 106,
    slug: 'minest_cooley_looking_glass',
    title: '库利 · 镜中我',
    philosopher: '查尔斯·霍顿·库利',
    concept: '社会之镜、想象他人对我的评价与自我情感反应',
    categoryGroup: '二、社会学与社会结构（102–113）',
    tags: ['符号互动论', '自我认知'],
    playSummary: '调整他人反馈与自我解释，观察自我认知如何变化',
    levelsSummary: '呈现形象 → 揣测他人的评判 → 自豪或羞愧的自我感觉',
    source: 'Cooley, Human Nature and the Social Order (1902)',
    quoteCount: 4,
    thumbType: 'soc_cooley',
    coreQuestion: '我们对“自己是个什么样的人”的认识，究竟来自独处时的内省，还是来自他人眼神与评价所折射出的“社会镜子”？',
    boundaryNote: '起决定作用的是个体“主观想象中他人对自己的判断”，因此他人真实评价与自我解读之间可能存在投射偏差。',
    stages: [
      {
        id: 1,
        tabLabel: '① 镜中我的三重构成要素',
        instructionTitle: '阶段 ①：在画布上依次点亮并调节“我呈现给别人的外貌言行”“我揣测别人对我的评判”与“由此产生的自豪或羞耻感”',
        mappings: [
          [
            '点亮社会之镜的三道折射光路',
            '每一个人对他人而言都是一面镜子，反映出从他面前经过的那个人的形象——这就是我们可以称之为“镜中我（Looking-glass Self）”的社会自我。',
            'Each to each a looking-glass / Reflects the other that doth pass.',
            'Cooley, Human Nature and the Social Order Ch. 5 (1902)'
          ],
          [
            '调节他人反馈信号与自我揣测，观察自豪感与屈辱感的剧烈波动',
            '这一自我观念包含三个主要元素：想象我们在他人面前的形象；想象他人对这一形象的评判；以及由此产生的某种自我感觉，如自豪或屈辱。',
            'A self-idea of this sort seems to have three principal elements: the imagination of our appearance to the other person; the imagination of his judgment of that appearance, and some sort of self-feeling, such as pride or mortification.',
            'Cooley, Human Nature and the Social Order (1902)'
          ]
        ]
      },
      {
        id: 2,
        tabLabel: '② 初级群体（Primary Group）与主观滤镜校准',
        instructionTitle: '阶段 ②：调节初级群体支持度与自我认知滤镜，避免因过度敏感或扭曲投射而陷入虚假羞耻',
        mappings: [
          [
            '区分“仅仅被他人看见”与“在想象中感受到他人的评判权重”',
            '使我们产生自豪或羞愧的，并不是机械地看到自己的反光，而是我们在想象中觉得这一形象在另一个人的心目中得到了怎样的评价。',
            'The thing that moves us to pride or shame is not the mere mechanical reflection of ourselves, but an imputed sentiment, the imagined effect of this reflection upon another’s mind.',
            'Cooley, Human Nature and the Social Order (1902)'
          ],
          [
            '依托健康的初级群体（家庭、挚友）校准社会之镜的曲率',
            '初级群体以其亲密的、面对面的结合与合作，构成了塑造个体社会本性与理想自我的摇篮。',
            'By primary groups I mean those characterized by intimate face-to-face association and cooperation.',
            'Cooley, Social Organization (1909)'
          ]
        ]
      }
    ]
  },
  {
    id: 107,
    slug: 'minest_parsons_agil',
    title: '帕森斯 · AGIL 功能系统',
    philosopher: '塔尔科特·帕森斯',
    concept: '结构功能主义、适应(A)—目标达成(G)—整合(I)—潜在模式维持(L)',
    categoryGroup: '二、社会学与社会结构（102–113）',
    tags: ['结构功能主义', '社会系统'],
    playSummary: '操作适应、目标达成、整合和模式维持四个功能模块',
    levelsSummary: '经济(A)、政治(G)、法律社群(I)与文化教育家庭(L) · 四大子系统能量与信息交换',
    source: 'Parsons, The Social System (1951) / Economy and Society (1956)',
    quoteCount: 4,
    thumbType: 'soc_agil',
    coreQuestion: '任何一个从小型社团到现代国家的社会系统，要想在动荡环境中存活并持续运转，必须同时解决哪四个基本功能问题？',
    boundaryNote: '强于解释系统的均衡与稳态维系，但常被冲突论批评为低估了权力斗争、阶级矛盾与激进社会变迁。',
    stages: [
      {
        id: 1,
        tabLabel: '① 四大功能象限（A-G-I-L）协同',
        instructionTitle: '阶段 ①：在四象限画布中调节适应(A)、目标达成(G)、整合(I)与模式维持(L)的资源配比，使社会系统恢复动态平衡',
        mappings: [
          [
            '分别激活外部维度的适应(A-经济)与目标达成(G-政治)',
            '任何行动系统要维持存续，都必须满足四项基本功能指令：适应环境（Adaptation）、达成系统目标（Goal Attainment）、内部整合（Integration）以及潜在价值模式维持（Latency）。',
            'Four functional imperatives of any system of action: Adaptation, Goal-attainment, Integration, and Latent pattern-maintenance.',
            'Parsons & Smelser, Economy and Society (1956)'
          ],
          [
            '补齐内部维度的整合(I-法律规范)与潜在模式维持(L-文化教育家庭)，达成四象限均衡',
            '社会系统的均衡依赖于四个功能子系统之间通过货币、权力、影响力与价值承诺等广义媒介进行的持续交换。',
            'Each subsystem specializes in one of the four primary functions and exchanges inputs and outputs with the others.',
            'Parsons, Structure and Process in Modern Societies (1960)'
          ]
        ]
      },
      {
        id: 2,
        tabLabel: '② 控制论信息层级（L → I → G → A）',
        instructionTitle: '阶段 ②：测试当顶层文化价值（L）或法律规范（I）受损时，单纯注入物质经济能量（A）为何无法阻止系统失序',
        mappings: [
          [
            '观察高能量侧（经济适应 A）与高信息控制侧（文化价值 L）的双向制约',
            '在行动系统的控制论层级中，信息含量高的系统（文化与价值模式 L）规范并引导着能量含量高的系统（物质经济与有机体 A）。',
            'Systems high in information control systems high in energy.',
            'Parsons, Societies: Evolutionary and Comparative Perspectives (1966)'
          ],
          [
            '修复价值共识与法律整合，使整个 AGIL 循环重归良性稳态',
            '制度化的共同价值模式通过社会化内化于个体人格之中，构成了维持社会秩序最深层的稳定锚。',
            'The institutionalization of a set of value-orientations is the core of the stabilization of the social system.',
            'Parsons, The Social System (1951)'
          ]
        ]
      }
    ]
  },
  {
    id: 108,
    slug: 'minest_merton_manifest_latent',
    title: '默顿 · 显功能与潜功能',
    philosopher: '罗伯特·金·默顿',
    concept: '显功能（预期且被认知）、潜功能（非预期且未被觉察）与反功能（Dysfunction）',
    categoryGroup: '二、社会学与社会结构（102–113）',
    tags: ['中层理论', '制度分析'],
    playSummary: '对一项社会制度展开预期功能、非预期功能和后果',
    levelsSummary: '霍皮印第安人祈雨舞（求雨 vs 凝聚部落） · 有意行动的非预期社会后果',
    source: 'Merton, Social Theory and Social Structure (1949)',
    quoteCount: 4,
    thumbType: 'soc_merton',
    coreQuestion: '为什么许多在科学上并未实现其宣称目的的仪式（如久旱祈雨舞）或炫耀性消费，却能在人类社会中长期存续？',
    boundaryNote: '区分显功能与潜功能避免了将“主观动机”与“客观社会后果”混为一谈，同时必须识别制度对特定群体的“反功能”。',
    stages: [
      {
        id: 1,
        tabLabel: '① 祈雨舞与炫耀消费：显功能 vs 潜功能透视',
        instructionTitle: '阶段 ①：拖动社会学透视滑杆，从表层的“主观预期显功能（求雨/实用）”切换到深层的“潜功能（群体凝聚/地位展示）”',
        mappings: [
          [
            '观察表层显功能：参与者主观意图且明确意识到的客观后果',
            '显功能（Manifest functions）是指那些有助于系统的调整或适应、并且是系统参与者所预期和认可的客观后果。',
            'Manifest functions are those objective consequences contributing to the adjustment or adaptation of the system which are intended and recognized by participants in the system.',
            'Merton, Social Theory and Social Structure Ch. 3 (1949)'
          ],
          [
            '拉开深层透视镜，发现未被参与者察觉却维系了部落团结的潜功能',
            '潜功能（Latent functions）则是那些既非参与者事先预期、也未被其明确意识到的相关客观后果——例如祈雨仪式在实际上强化了分散部落的群体认同与团结。',
            'Latent functions, correlatively, being those which are neither intended nor recognized.',
            'Merton, Social Theory and Social Structure (1949)'
          ]
        ]
      },
      {
        id: 2,
        tabLabel: '② 反功能（Dysfunctions）与非预期后果',
        instructionTitle: '阶段 ②：调整一项官僚考核制度的严苛度，观察其在提升合规（显功能）的同时如何诱发目标置换与僵化（反功能）',
        mappings: [
          [
            '观察严苛考核规则导致官员把“遵守程序”当作终极目的（反功能）',
            '并非所有社会结构都只产生积极的功能；那些削弱系统适应或调整的已观察后果，必须被识别为“反功能（Dysfunctions）”。',
            'Dysfunctions are those observed consequences which lessen the adaptation or adjustment of the system.',
            'Merton, Social Theory and Social Structure (1949)'
          ],
          [
            '核算一项制度的正功能与反功能净余额，指导理性的社会改良',
            '社会学对潜功能与非预期后果的独特贡献，正是要揭示那些超出人们天真道德直觉与表面公文宣称的社会运作真相。',
            'The distinctive intellectual contributions of the sociologist are found primarily in the study of unintended consequences (among which are latent functions).',
            'Merton, Social Theory and Social Structure (1949)'
          ]
        ]
      }
    ]
  },
  {
    id: 109,
    slug: 'minest_granovetter_weak_ties',
    title: '格兰诺维特 · 弱关系力量',
    philosopher: '马克·格兰诺维特',
    concept: '强关系同质性冗余、跨簇桥接（Bridge）与弱关系的信息跨界传播力',
    categoryGroup: '二、社会学与社会结构（102–113）',
    tags: ['社会网络分析', 'Top 7 优先'],
    playSummary: '在社会网络中连接不同群体，观察信息传播范围',
    levelsSummary: '挚友小圈子的信息同温层 · 一条跨圈层“弱关系桥”点燃全网非冗余信息扩散',
    source: 'Granovetter, The Strength of Weak Ties (1973)',
    quoteCount: 4,
    thumbType: 'soc_weakties',
    priorityRank: 7,
    coreQuestion: '在找新工作或获取突破性创意时，为什么平时很少联系的“点头之交（弱关系）”往往比每天见面的“死党（强关系）”更有用？',
    boundaryNote: '弱关系擅长传递跨圈层的新颖非冗余信息；但在需要高度情感支持、高风险背书或危机救助时，强关系依然不可替代。',
    stages: [
      {
        id: 1,
        tabLabel: '① 强关系闭环与信息同温层',
        instructionTitle: '阶段 ①：在仅有高密度强关系（实线）的孤立社群内点击释放求职信息，观察信息在同一小圈子内反复内循环',
        mappings: [
          [
            '在紧密死党圈内触发消息扩散，发现熟人之间知道的消息高度重叠',
            '与一个人通过强关系联结的那些密友，往往彼此之间也相互认识；因此你在强关系圈子里听到的信息，多半是你早就知道的冗余信息。',
            'Those to whom we are weakly tied are more likely to move in circles different from our own and will thus have access to information different from that which we receive.',
            'Granovetter, American Journal of Sociology 78(6), 1973'
          ],
          [
            '验证“禁止三元闭包缺失”：两个强关系端点很难成为跨社群的唯一桥梁',
            '在社会网络中，没有哪条强关系会成为连接两个群体之间的唯一“桥（Bridge）”；所有的跨簇长距离桥接，几乎全部都是弱关系！',
            'No strong tie is a bridge. All bridges are weak ties.',
            'Granovetter, The Strength of Weak Ties (1973)'
          ]
        ]
      },
      {
        id: 2,
        tabLabel: '② 架设跨群体的弱关系之桥（Weak-Tie Bridge）',
        instructionTitle: '阶段 ②：在画布上拖动并连接跨社群的虚线“弱关系桥”，观察新工作机会与创新思想瞬间穿透全网各簇',
        mappings: [
          [
            '架设跨圈层弱关系连线，观察信息覆盖率从 25% 跃升至 100%',
            '无论什么信息要跨越社会距离进行传播，如果它只能通过强关系传递，它就会被困在少数几个小团体里；唯有跨越弱关系之桥，它才能触达更广阔的社会。',
            'Whatever is to be diffused can reach a larger number of people, and traverse greater social distance, when passed through weak ties rather than strong.',
            'Granovetter, AJS 78(6), 1973'
          ],
          [
            '体会弱关系在宏观社会整合中的反直觉凝聚作用',
            '从个人层面看常被视作疏离的“弱关系”，在宏观层面恰恰是把原本分裂的小圈子缝合成一个具备共同行动力之大社会的粘合剂。',
            'Weak ties, often denounced as generative of alienation, are here seen as indispensable to individuals’ opportunities and to their integration into communities.',
            'Granovetter, The Strength of Weak Ties (1973)'
          ]
        ]
      }
    ]
  },
  {
    id: 110,
    slug: 'minest_milgram_small_world',
    title: '米尔格拉姆 · 小世界网络',
    philosopher: '斯坦利·米尔格拉姆 / 瓦茨与斯托加茨',
    concept: '六度分隔（Six Degrees of Separation）、高局部聚类与长程随机捷径',
    categoryGroup: '二、社会学与社会结构（102–113）',
    tags: ['网络科学', '社会心理学'],
    playSummary: '调整人与人的连接，寻找不同个体之间的最短路径',
    levelsSummary: '环形规则网格的漫长传递 · 仅重连少量长程捷径便使平均最短路径骤降',
    source: 'Milgram, The Small World Problem (1967) / Watts & Strogatz (1998)',
    quoteCount: 4,
    thumbType: 'soc_smallworld',
    coreQuestion: '地球上有几十亿人口，为什么任意两个素昧平生的陌生人之间，平均只需要通过大约 6 个熟人就能把信件传递到对方手中？',
    boundaryNote: '客观存在短路径（结构小世界）不等于个体总能轻松找到该路径（算法可导航性依赖枢纽节点与地理/职业线索）。',
    stages: [
      {
        id: 1,
        tabLabel: '① 规则熟人环与六度分隔投递',
        instructionTitle: '阶段 ①：在纯近邻连接的环形网络上点击传递信件，体验无跨区捷径时的漫长跳数（十余跳）',
        mappings: [
          [
            '在仅与左右邻居相连的网格中传递包裹，观察高聚类但极长的平均路径 L',
            '小世界问题的核心在于：在一个庞大的人口网络中，随机抽取任意两个人，连接他们之间的熟人链条究竟需要多少个中间人？',
            'Given any two people in the world, person X and person Z, how many intermediate acquaintance links are needed before X and Z are connected?',
            'Milgram, Psychology Today 1(1), 1967'
          ],
          [
            '发现内布拉斯加到波士顿信件实验的平均中转人数约为 5.2 至 6 步',
            '实验结果表明，任意两个美国居民之间的中位中间人数量约为五到六人——这就是著名的“六度分隔（Six Degrees of Separation）”。',
            'The median number of intermediate persons required to link the starters with the target person was 5.5.',
            'Travers & Milgram, Sociometry 32(4), 1969'
          ]
        ]
      },
      {
        id: 2,
        tabLabel: '② 瓦茨—斯托加茨长程捷径重连（p 滑杆）',
        instructionTitle: '阶段 ②：拖动随机长程重连概率 p 滑杆，观察仅引入几条跨对角线捷径便使全网平均最短路径断崖式下降',
        mappings: [
          [
            '引入少量跨区域随机捷径（p ≈ 5%），观察平均跳数瞬间缩短至 2–3 跳',
            '只要在高度聚类的规则网络中随机重连极小比例的长程捷径边，整个网络的平均最短路径长度就会发生剧烈的断崖式下降。',
            'The introduction of a few long-range edges drastically reduces the characteristic path length of the network while preserving high local clustering.',
            'Watts & Strogatz, Collective Dynamics of "Small-World" Networks, Nature (1998)'
          ],
          [
            '观察关键连接者（Funneling 漏斗枢纽）在导航传递中的核心作用',
            '近半数的成功信件最终都是通过极少数拥有跨界人脉的“关键枢纽人物（Connectors）”送到目标人手中的。',
            'A very small number of persons served as the final link for a large proportion of the chains.',
            'Milgram, The Small World Problem (1967)'
          ]
        ]
      }
    ]
  },
  {
    id: 111,
    slug: 'minest_schelling_segregation',
    title: '托马斯·谢林 · 社会隔离模型',
    philosopher: '托马斯·谢林',
    concept: '微观动机与宏观行为涌现、温和同温层偏好引发的极端隔离',
    categoryGroup: '二、社会学与社会结构（102–113）',
    tags: ['计算社会科学', 'Top 2 优先'],
    playSummary: '调整个体邻居偏好，观察群体空间分布',
    levelsSummary: '“只要有 1/3 同类邻居我就满意”的温和宽容 · 连锁搬迁如何意外锁定高度隔离社区',
    source: 'Schelling, Dynamic Models of Segregation (1971) / Micromotives and Macrobehavior (1978)',
    quoteCount: 4,
    thumbType: 'soc_schelling',
    priorityRank: 2,
    coreQuestion: '如果一个城市里的所有居民都非常宽容、谁都不渴望居住在单一族群区，为什么仅仅“不愿成为周围唯一的极少数”的温和愿望，最终却导致了整座城市的彻底隔离？',
    boundaryNote: '揭示了“宏观结果不能直接反推微观恶意”，但也警示了无干预放任下空间隔离的自发正反馈惯性。',
    stages: [
      {
        id: 1,
        tabLabel: '① 亲手拖动不满意的居民搬家',
        instructionTitle: '阶段 ①：在混合棋盘上点击或拖动带有难过表情（同类邻居不足 33%）的居民迁入空位，观察一人的搬迁如何打破原邻居的平衡',
        mappings: [
          [
            '移动一位不满意的居民，观察他离开后导致原本满意的旧邻居也变成“少数派”而相继搬走',
            '当一个人搬离时，他不仅改变了自己新家园的构成，也减少了他原居住地同类邻居的比例，从而触发多米诺骨牌式的连锁搬迁。',
            'Each person who moves out reduces the number of his own color remaining, potentially tipping his former neighbors into moving as well.',
            'Schelling, Journal of Mathematical Sociology 1(2), 1971'
          ],
          [
            '观察即使每个人都乐意与异类混居（只要有 1/3 同类即可），棋盘仍自发聚集成纯色板块',
            '个体的微观动机与群体汇聚成的宏观结果之间，往往存在着令人震惊的脱节：哪怕没有任何人想要极端隔离，温和的排斥少数派偏好也会自发锁定高度隔离。',
            'The interplay of individual choices, where each individual is tolerant of diversity but wishes to avoid being an extreme minority, can lead to total segregation.',
            'Schelling, Micromotives and Macrobehavior (1978)'
          ]
        ]
      },
      {
        id: 2,
        tabLabel: '② 同类容忍阈值（Threshold τ）与相变临界点',
        instructionTitle: '阶段 ②：拖动同类邻居最低要求比例滑杆（15% → 40% → 70%），观察混合社区向板块隔离相变的引爆点',
        mappings: [
          [
            '将同类偏好维持在 20% 以下，观察多元混居格局保持稳定',
            '当个体对同类邻居的要求阈值低于某个临界值时，随机混合的社区能够保持长期稳定。',
            'Below a critical threshold of preference, integrated neighborhoods remain stable.',
            'Schelling, Dynamic Models of Segregation (1971)'
          ],
          [
            '将阈值推过 33%–40% 临界点，观察全城隔离度飙升至 80% 以上',
            '无论总体结果多么像是有计划的设计，我们绝不能仅凭宏观的聚合形态，就草率地推断出个体具有同样的主观意图。',
            'How well each does for himself in adapting to his social environment is not the same thing as how satisfactory a social environment they collectively create for themselves.',
            'Schelling, Micromotives and Macrobehavior Ch. 4 (1978)'
          ]
        ]
      }
    ]
  },
  {
    id: 112,
    slug: 'minest_olson_collective_action',
    title: '曼瑟尔·奥尔森 · 集体行动的逻辑',
    philosopher: '曼瑟尔·奥尔森',
    concept: '公共物品非排他性、搭便车困境（Free-Rider）、集团规模与选择性激励',
    categoryGroup: '二、社会学与社会结构（102–113）',
    tags: ['公共选择', '政治社会学'],
    playSummary: '调整成员数量、贡献成本与激励，观察搭便车问题',
    levelsSummary: '小团体（高份额易监督）vs 巨型潜在集团（搭便车瘫痪） · 选择性激励破局',
    source: 'Olson, The Logic of Collective Action (1965)',
    quoteCount: 4,
    thumbType: 'soc_olson',
    coreQuestion: '如果一项公共行动对群体里的每一个人都有巨大的共同利益，为什么有理性的大群体成员却往往谁也不肯出钱出力？',
    boundaryNote: '主要针对自利经济人假设下的物质公共物品；在具有强烈道德利他认同或极低数字参与成本的场景中可部分缓解。',
    stages: [
      {
        id: 1,
        tabLabel: '① 群体规模扩张与“搭便车”稀释',
        instructionTitle: '阶段 ①：拖动群体成员人数 N 滑杆（从 5 人小团队扩至 5000 人大集团），观察个体贡献意愿因收益被摊薄而崩溃',
        mappings: [
          [
            '在 5 人小群体中观察高个体收益份额促成的自发合作',
            '在规模很小（特权集团）的群体中，单个成员从公共物品中获得的收益份额足够大，即使独自承担成本也是划算的。',
            'In very small groups, where each member gets a substantial proportion of the total gain simply because there are few others in the group, a collective good can often be provided by the voluntary, self-interested action of the members.',
            'Olson, The Logic of Collective Action Ch. 1 (1965)'
          ],
          [
            '将群体规模拉大至数千人，观察全员等待他人买单的“搭便车”瘫痪',
            '除非一个集团中的人数相当少，或者存在着强制或某种特别手段，否则有理性的、寻求自我利益的个人绝不会采取行动以实现他们共同的或集团的利益。',
            'Unless the number of individuals in a group is quite small, or unless there is coercion or some other special device to make individuals act in their common interest, rational, self-interested individuals will not act to achieve their common or group interests.',
            'Olson, The Logic of Collective Action p. 2 (1965)'
          ]
        ]
      },
      {
        id: 2,
        tabLabel: '② 选择性激励（Selective Incentives）破除搭便车',
        instructionTitle: '阶段 ②：在画布中开启针对个人的“选择性专属福利/惩罚”，观察大集团集体行动能力瞬间激活',
        mappings: [
          [
            '为贡献者绑定可排他的私人福利（如工会会员专属保险、期刊或职业认证）',
            '大型潜在集团之所以能够动员起来，是因为它们提供了与公共物品不同、只奖励给积极分担成本者的“选择性激励（Selective Incentives）”。',
            'Only a separate and "selective" incentive will stimulate a rational individual in a latent group to act in a group-oriented way.',
            'Olson, The Logic of Collective Action p. 51 (1965)'
          ],
          [
            '结合正向专属奖励与负向违规约束，实现大规模公共物品供给',
            '选择性激励既可以是负面的（通过强制缴税或会费惩罚搭便车者），也可以是正面的（为贡献者搭售专属私人品服务）。',
            'These selective incentives can be either negative or positive, in that they can either coerce by punishing those who fail to bear an allocated share of the costs of the group action, or they can be positive inducements offered to those who act in the group interest.',
            'Olson, The Logic of Collective Action (1965)'
          ]
        ]
      }
    ]
  },
  {
    id: 113,
    slug: 'minest_putnam_social_capital',
    title: '罗伯特·帕特南 · 社会资本',
    philosopher: '罗伯特·帕特南',
    concept: '公民参与网络、互惠规范、粘合型（Bonding）与桥接型（Bridging）社会资本',
    categoryGroup: '二、社会学与社会结构（102–113）',
    tags: ['政治社会学', '公民共同体'],
    playSummary: '调整信任、社团参与和网络联系，观察合作能力',
    levelsSummary: '独自打保龄球（原子化疏离）vs 合唱团/公民社团 · 广义互惠与民主治理绩效',
    source: 'Putnam, Making Democracy Work (1993) / Bowling Alone (2000)',
    quoteCount: 4,
    thumbType: 'soc_putnam',
    coreQuestion: '为什么拥有完全相同制度与财政拨款的两个地区，一个地区公共服务高效清廉，另一个却陷入猜忌与低效泥潭？',
    boundaryNote: '需警惕排他性的“黑暗面社会资本”（如黑帮或极端宗派的高内部粘合但对外敌视）；健康社会需要跨群体的桥接型社会资本。',
    stages: [
      {
        id: 1,
        tabLabel: '① 独自打保龄球 vs 公民社团网络与广义互惠',
        instructionTitle: '阶段 ①：拖动公民社团参与和横向网络密度滑杆，将原子化孤立居民连接为高信任、低监督成本的互惠共同体',
        mappings: [
          [
            '在原子化“独自打保龄球”状态下观察高昂的猜忌与契约摩擦成本',
            '物理资本指工具与机器，人力资本指个人技能，而社会资本（Social Capital）则指社会组织的特征——如信任、规范和公民参与网络，它们能通过促进协调行动来提高社会效率。',
            'Social capital here refers to features of social organization, such as trust, norms, and networks, that can improve the efficiency of society by facilitating coordinated actions.',
            'Putnam, Making Democracy Work Ch. 6 (1993)'
          ],
          [
            '拉高横向社团参与度，激发“我现在帮你，相信未来有人会帮我”的广义互惠',
            '强大的公民参与网络培育了稳健的“广义互惠规范（Generalized Reciprocity）”：我不必求你当场回报，因为我相信在这个信任共同体中善意终会回流。',
            'I’ll do this for you now, without expecting anything immediately in return and perhaps without even knowing you, confident that down the road you or someone else will return the favor.',
            'Putnam, Bowling Alone Ch. 1 (2000)'
          ]
        ]
      },
      {
        id: 2,
        tabLabel: '② 粘合型（Bonding）与桥接型（Bridging）社会资本',
        instructionTitle: '阶段 ②：平衡同质群体内部的“强力胶（粘合型）”与跨群体之间的“润滑剂（桥接型）”，构建包容性公共合作',
        mappings: [
          [
            '对比向内排他的“粘合型社会资本”与向外包容的“桥接型社会资本”',
            '粘合型（Bonding）社会资本向内看，强化同质群体的排他性认同；桥接型（Bridging）社会资本则向外看，把处于不同社会分界线的人们联结在一起。',
            'Bonding social capital constitutes a kind of sociological superglue, whereas bridging social capital provides a sociological WD-40.',
            'Putnam, Bowling Alone Ch. 1 (2000)'
          ],
          [
            '拉高跨群体桥接连接，使整个社会兼具内部扶助与宏观民主治理效能',
            '粘合型网络对于“勉强维持生计（getting by）”很有效，而桥接型网络对于在更广阔社会中“向前发展与开拓（getting ahead）”至关重要。',
            'Bonding social capital is good for undergirding specific reciprocity and mobilizing solidarity... Bridging networks, by contrast, are better for linkage to external assets and for information diffusion.',
            'Putnam, Bowling Alone (2000)'
          ]
        ]
      }
    ]
  }
];
