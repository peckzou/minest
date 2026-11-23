import { PhilosophyModel } from '../types/philosophy';

export const MODELS_87_TO_101: PhilosophyModel[] = [
  {
    id: 87,
    slug: 'minest_smith_invisible_hand',
    title: '亚当·斯密 · 看不见的手',
    philosopher: '亚当·斯密',
    concept: '自利心、价格机制与自发市场协调',
    categoryGroup: '一、经济学与博弈论（87–101）',
    tags: ['古典经济学', '市场协调'],
    playSummary: '操作微缩市场，调整买卖双方的价格与需求，观察交易协调',
    levelsSummary: '屠夫与面包师的自利 · 供求价格均衡与总剩余最大化',
    source: 'Smith, The Wealth of Nations (1776)',
    quoteCount: 4,
    thumbType: 'econ_hand',
    coreQuestion: '为什么每个市场参与者只追求自己的私人利益，却往往能比刻意追求公共利益更有效地促进社会总福利？',
    boundaryNote: '完全竞争与无外部性假设下有效；存在垄断、公共物品或信息不对称时可能出现市场失灵。',
    stages: [
      {
        id: 1,
        tabLabel: '① 屠夫与面包师的交易契合',
        instructionTitle: '阶段 ①：在微缩集市拖动买方出价与卖方要价，促成自愿互利交换',
        mappings: [
          [
            '拖动交易滑杆使买卖双方因各自利益达成成交',
            '我们每天所需的食料和饮料，不是出自屠户、酿酒家或烙面师的恩惠，而是出于他们自利的打算。',
            'It is not from the benevolence of the butcher, the brewer, or the baker, that we expect our dinner, but from their regard to their own interest.',
            'Smith, Wealth of Nations I.ii.2'
          ],
          [
            '将交易协调度推至高点，观察社会总剩余涌现',
            '他受一只看不见的手的指导，去尽力达到一个并非他本意想要达到的目的。通过追逐自己的利益，他经常促进了社会的利益。',
            'He is led by an invisible hand to promote an end which was no part of his intention. By pursuing his own interest he frequently promotes that of the society.',
            'Smith, Wealth of Nations IV.ii.9'
          ]
        ]
      },
      {
        id: 2,
        tabLabel: '② 市场价格向自然价格收敛',
        instructionTitle: '阶段 ②：拖动市场价格标尺，消除超额供求缺口并实现市场出清',
        mappings: [
          [
            '将价格拉高或压低，观察供过于求或供不应求失衡',
            '当进入市场的商品数量少于有效需求时，买者之间的竞争会使市场价格上升到自然价格之上。',
            'When the quantity of any commodity which is brought to market falls short of the effectual demand... the market price will rise more or less above the natural price.',
            'Smith, Wealth of Nations I.vii.9'
          ],
          [
            '将价格稳定在自然均衡点，实现买者与卖者剩余最大化',
            '自然价格可以说是中心价格，一切商品的价格都不断受其吸引而趋向于它。',
            'The natural price, therefore, is, as it were, the central price, to which the prices of all commodities are continually gravitating.',
            'Smith, Wealth of Nations I.vii.15'
          ]
        ]
      }
    ]
  },
  {
    id: 88,
    slug: 'minest_ricardo_comparative',
    title: '大卫·李嘉图 · 比较优势',
    philosopher: '大卫·李嘉图',
    concept: '机会成本、专业化分工与互利国际贸易',
    categoryGroup: '一、经济学与博弈论（87–101）',
    tags: ['国际贸易', '比较优势'],
    playSummary: '两个国家分配劳动力生产不同商品，调整贸易比例',
    levelsSummary: '英葡毛呢与葡萄酒分工 · 突破自给自足生产可能性边界',
    source: 'Ricardo, On the Principles of Political Economy and Taxation (1817)',
    quoteCount: 4,
    thumbType: 'econ_trade',
    coreQuestion: '如果葡萄牙在生产葡萄酒和毛呢上的绝对效率都高于英国，两国之间进行贸易对葡萄牙还有好处吗？',
    boundaryNote: '基于要素国内自由流动、跨国不流动及零运输成本假设；未计入产业转型摩擦与战略安全考量。',
    stages: [
      {
        id: 1,
        tabLabel: '① 机会成本与专业化分工',
        instructionTitle: '阶段 ①：拖动英国与葡萄牙的劳动力分配滑杆，按比较优势集中生产',
        mappings: [
          [
            '观察自给自足（孤立生产）下的两国总产量上限',
            '在一个完全自由的商业体系下，每个国家自然会把资本和劳动投入到最有利于本国的用途上。',
            'Under a system of perfectly free commerce, each country naturally devotes its capital and labour to such employments as are most beneficial to each.',
            'Ricardo, Principles Ch. 7'
          ],
          [
            '让葡萄牙专攻葡萄酒、英国专攻毛呢，使世界总产出跃升',
            '即使葡萄牙进口的毛呢在本国可以用比英国更少的劳动生产出来，把资本集中用于葡萄酒生产并以此交换毛呢对它仍然更有利。',
            'Though she could make the cloth with the labour of 90 men, she would import it from a country where it required the labour of 100 men to produce it.',
            'Ricardo, Principles Ch. 7'
          ]
        ]
      },
      {
        id: 2,
        tabLabel: '② 互利贸易比价与消费边界扩张',
        instructionTitle: '阶段 ②：调节毛呢与葡萄酒的贸易交换比价，使两国消费同时突破生产边界',
        mappings: [
          [
            '调整国际贸易比价进入两国机会成本区间内',
            '这种对个体利益的追求，令人钦佩地与整体的普遍利益紧密结合在一起。',
            'This pursuit of individual advantage is admirably connected with the universal good of the whole.',
            'Ricardo, Principles Ch. 7'
          ],
          [
            '达成互利交换，观察两国消费点均超越自给自足边界',
            '通过增加产品的总体数量，它在世界各地散布普遍的利益，并以共同的利益和纽带把文明世界各民族联结起来。',
            'By increasing the general mass of productions, it diffuses general benefit, and binds together by one common tie of interest and intercourse, the universal society of nations.',
            'Ricardo, Principles Ch. 7'
          ]
        ]
      }
    ]
  },
  {
    id: 89,
    slug: 'minest_nash_equilibrium',
    title: '约翰·纳什 · 纳什均衡',
    philosopher: '约翰·纳什',
    concept: '非合作博弈、最优反应对应与均衡存在性',
    categoryGroup: '一、经济学与博弈论（87–101）',
    tags: ['博弈论', 'Top 1 优先'],
    playSummary: '调整双方收益矩阵，寻找无人愿意单方面改变策略的状态',
    levelsSummary: '最优反应箭头与纯策略均衡 · 协调博弈与多重均衡切换',
    source: 'Nash, Non-Cooperative Games (1950 / 1951)',
    quoteCount: 4,
    thumbType: 'econ_nash',
    priorityRank: 1,
    coreQuestion: '在没有具有约束力的协议时，理性博弈者何时会停留在某种策略组合上，不再有单方面反悔的动力？',
    boundaryNote: '假设参与者理性且共同知识完备；多重纳什均衡下的均衡选择往往依赖历史惯例或谢林聚点。',
    stages: [
      {
        id: 1,
        tabLabel: '① 收益矩阵与单方偏离测试',
        instructionTitle: '阶段 ①：点击 2×2 收益矩阵单元格并尝试单方面改变行/列策略，寻找双向最优反应锁死点',
        mappings: [
          [
            '点击非均衡格子，观察至少一方存在单方面改选以增加收益的箭头',
            '在非合作博弈中，每个参与者都独立地选择自己的策略，而无法与其他人达成具有强制执行力的协议。',
            'Each participant acts independently, without collaboration or communication with any of the others.',
            'Nash, Non-Cooperative Games (1951)'
          ],
          [
            '锁定双向最优反应重合的单元格，验证无人愿单方面偏离',
            '当每个参与者的策略都是针对所有其他参与者策略的最优反应时，该策略组合就构成了一个均衡点。',
            'An equilibrium point is an n-tuple such that each player’s mixed strategy maximizes his pay-off if the strategies of the others are held fixed.',
            'Nash, Equilibrium Points in n-Person Games (1950)'
          ]
        ]
      },
      {
        id: 2,
        tabLabel: '② 调整收益参数与多重均衡跃迁',
        instructionTitle: '阶段 ②：拖动收益激励滑杆，将博弈结构从唯一占优均衡切换为鹿猎协调双均衡',
        mappings: [
          [
            '调节合作协同奖励，使矩阵出现两个对称的纯策略纳什均衡',
            '因此，每一个参与者的策略对于其他人的策略而言都是最优的；没有任何人有动力单方面改变自己的策略。',
            'Thus each player’s strategy is optimal against those of the others.',
            'Nash, PNAS 36(1), 1950'
          ],
          [
            '测试混合策略平衡点，验证任何有限博弈必存在至少一个纳什均衡',
            '每一个有限博弈都至少存在一个均衡点（纯策略或混合策略均衡）。',
            'Every finite game has an equilibrium point.',
            'Nash, Non-Cooperative Games, Annals of Mathematics (1951)'
          ]
        ]
      }
    ]
  },
  {
    id: 90,
    slug: 'minest_keynes_multiplier',
    title: '凯恩斯 · 乘数效应',
    philosopher: '约翰·梅纳德·凯恩斯',
    concept: '有效需求、边际消费倾向与投资乘数循环',
    categoryGroup: '一、经济学与博弈论（87–101）',
    tags: ['宏观经济学', '乘数循环'],
    playSummary: '向经济系统注入支出，观察资金在家庭、企业间循环',
    levelsSummary: '一个人的支出即另一人的收入 · 边际消费倾向 MPC 与节俭悖论',
    source: 'Keynes, The General Theory of Employment, Interest and Money (1936)',
    quoteCount: 4,
    thumbType: 'econ_cycle',
    coreQuestion: '为什么政府或企业新增 100 亿元投资，最终在宏观经济中带动的总收入增长会远超 100 亿元？',
    boundaryNote: '适用于存在闲置产能与非充分就业的经济体；若已处于充分就业产能上限，乘数扩张将主要转化为通胀。',
    stages: [
      {
        id: 1,
        tabLabel: '① 收入—支出循环与乘数放大',
        instructionTitle: '阶段 ①：点击向家庭与企业循环网注入初始支出，并拖动边际消费倾向（MPC）观察多轮放大',
        mappings: [
          [
            '注入第一笔自主投资，观察收入在家庭与企业间引发连锁消费波',
            '当总投资增加时，总收入的增加额将是投资增加额的 k 倍（k 即投资乘数）。',
            'When there is an increment of aggregate investment, income will increase by an amount which is k times the increment of investment.',
            'Keynes, General Theory Ch. 10'
          ],
          [
            '调高边际消费倾向 MPC，观察乘数 k = 1/(1 - MPC) 急剧放大总产出',
            '社会的边际消费倾向越大，乘数也就越大，从而给定投资变动所引起的就业与收入变动也就越大。',
            'The greater the marginal propensity to consume, the greater the multiplier.',
            'Keynes, General Theory Ch. 10'
          ]
        ]
      },
      {
        id: 2,
        tabLabel: '② 节俭悖论与有效需求不足',
        instructionTitle: '阶段 ②：拖动全社会储蓄倾向滑杆，观察在经济萧条期全员紧缩消费如何导致总收入萎缩',
        mappings: [
          [
            '在需求不足时大幅拉高储蓄倾向，观察循环流量枯竭',
            '每一次削减消费以增加储蓄的企图，都会减少他人的收入，从而使全社会实际的储蓄能力下降。',
            'Every such attempt to save more by reducing consumption will so affect incomes that the attempt necessarily defeats itself.',
            'Keynes, General Theory Ch. 7'
          ],
          [
            '通过逆周期公共支出托底有效需求，恢复就业与收入良性循环',
            '有效需求之不足，会阻碍生产繁荣的进程，甚至在达到充分就业之前就迫使它停顿下来。',
            'The insufficiency of effective demand will inhibit the process of production.',
            'Keynes, General Theory Ch. 3'
          ]
        ]
      }
    ]
  },
  {
    id: 91,
    slug: 'minest_schumpeter_destruction',
    title: '熊彼特 · 创造性破坏',
    philosopher: '约瑟夫·熊彼特',
    concept: '企业家创新、新组合与资本主义内生演进',
    categoryGroup: '一、经济学与博弈论（87–101）',
    tags: ['创新经济学', '产业演化'],
    playSummary: '在微缩城市引入新技术，观察旧产业与新产业变化',
    levelsSummary: '马车驿站到汽车与铁路网 · 从内部不断摧毁旧结构并创造新结构',
    source: 'Schumpeter, Capitalism, Socialism and Democracy (1942)',
    quoteCount: 4,
    thumbType: 'econ_schumpeter',
    coreQuestion: '资本主义经济增长的核心动力，究竟是静态价格竞争，还是不断颠覆旧产业的“创造性破坏”风暴？',
    boundaryNote: '宏观长期生产力跃升显著，但短期会造成结构性失业与旧技能淘汰，需配合社会转型安全网。',
    stages: [
      {
        id: 1,
        tabLabel: '① 引入新组合与产业新陈代谢',
        instructionTitle: '阶段 ①：将新技术浪潮拖入微缩城市，观察旧马车/煤气灯产业被重构为新产业集群',
        mappings: [
          [
            '将创新技术模块拖入传统均衡城市，打破静态循环流转',
            '资本主义在本质上是经济变动的一种形式或方法，它不仅从来不是、而且也永远不可能是静止的。',
            'Capitalism, then, is by nature a form or method of economic change and not only never is but never can be stationary.',
            'Schumpeter, Capitalism, Socialism and Democracy Ch. 7'
          ],
          [
            '完成产业迭代，观察旧结构退场与生产力跃迁',
            '这一过程不断地从内部使经济结构革命化，不断地破坏旧结构，不断地创造新结构。这种创造性破坏的过程就是资本主义的本质事实。',
            'This process of Creative Destruction is the essential fact about capitalism.',
            'Schumpeter, Capitalism, Socialism and Democracy Ch. 7'
          ]
        ]
      },
      {
        id: 2,
        tabLabel: '② 价格竞争 vs 降维打击的创新竞争',
        instructionTitle: '阶段 ②：对比常规“降价 5%”与“颠覆性新产品/新生产方式”对经济格局的冲击力',
        mappings: [
          [
            '对比传统同质化价格战与跨代技术创新的冲击量级',
            '真正重要的不是教科书式的价格竞争，而是来自新商品、新技术、新供应来源、新组织形式的竞争。',
            'In capitalist reality as distinguished from its textbook picture, it is not that kind of competition which counts, but the competition from the new commodity, the new technology.',
            'Schumpeter, Capitalism, Socialism and Democracy Ch. 7'
          ],
          [
            '推动长期创新波浪，观察经济总效率跨越式上升',
            '这种竞争不仅冲击现有企业的利润率或产出边际，而是直接冲击它们的根基和它们的生死存亡。',
            'Competition which strikes not at the margins of the profits and the outputs of the existing firms but at their foundations and their very lives.',
            'Schumpeter, Capitalism, Socialism and Democracy Ch. 7'
          ]
        ]
      }
    ]
  },
  {
    id: 92,
    slug: 'minest_hayek_prices',
    title: '哈耶克 · 分散知识与价格信号',
    philosopher: '弗里德里希·哈耶克',
    concept: '局部默会知识、价格电报系统与自发秩序',
    categoryGroup: '一、经济学与博弈论（87–101）',
    tags: ['奥地利学派', '信息与价格'],
    playSummary: '多个市场主体掌握不同信息，通过价格变化协调行动',
    levelsSummary: '锡矿坍塌与全球节约协调 · 无需全知中央计划者的价格电报',
    source: 'Hayek, The Use of Knowledge in Society (1945)',
    quoteCount: 4,
    thumbType: 'econ_hayek',
    coreQuestion: '当全球某处锡矿发生局部短缺时，为什么成千上万不知道原因的制造商都能自发节约用锡并寻找替代品？',
    boundaryNote: '要求价格信号真实灵活且产权清晰；在价格管制、恶性通胀或投机泡沫中，价格信号可能发生失真。',
    stages: [
      {
        id: 1,
        tabLabel: '① 局部分散知识与价格电报',
        instructionTitle: '阶段 ①：触发远方锡矿短缺，拖动价格信号传导波协调互不相识的分布式生产商',
        mappings: [
          [
            '观察每个市场节点只掌握局部特殊环境的零散知识',
            '关于特定时间和地点之特殊情况的知识，从不以集中的或整合的形式存在，而仅仅作为分散在所有独立个人手中的不完全知识碎片而存在。',
            'The knowledge of the circumstances of which we must make use never exists in concentrated or integrated form, but solely as the dispersed bits of incomplete knowledge.',
            'Hayek, The Use of Knowledge in Society (1945)'
          ],
          [
            '接通价格上升信号，使全球用户在不知晓短缺原因下自动节约用锡',
            '我们必须把价格体系看作一种交流信息的机制，它使单个生产者只需观察几个指针的运动，就能调整自己的活动以适应他从未听闻的变化。',
            'We must look at the price system as such a mechanism for communicating information if we want to understand its real function.',
            'Hayek, American Economic Review 35(4), 1945'
          ]
        ]
      },
      {
        id: 2,
        tabLabel: '② 中央集中汇总 vs 分布式自发协调',
        instructionTitle: '阶段 ②：对比“将所有现场信息层层上报中央审批”与“实时价格信号自治响应”的延迟与效率',
        mappings: [
          [
            '测试集中汇总模式下的信息损耗与决策滞后',
            '指望中央计划机构能够掌握所有特定时间与地点的细节知识，在逻辑上和实践上都是荒谬的。',
            'The central planner cannot possibly know all the particular circumstances of time and place.',
            'Hayek, The Use of Knowledge in Society (1945)'
          ],
          [
            '切换至价格信号网络，以最简数字编码完成跨行业协同',
            '关于这套体系最奇妙的事实在于：它所赖以运转的知识是如此之节省，个人只需知道极少的信息便能采取正确的行动。',
            'The most significant fact about this system is the economy of knowledge with which it operates, or how little the individual participants need to know in order to be able to take the right action.',
            'Hayek, The Use of Knowledge in Society (1945)'
          ]
        ]
      }
    ]
  },
  {
    id: 93,
    slug: 'minest_friedman_monetarism',
    title: '弗里德曼 · 货币主义',
    philosopher: '米尔顿·弗里德曼',
    concept: '货币数量论 MV=PQ、自然失业率与单一规则',
    categoryGroup: '一、经济学与博弈论（87–101）',
    tags: ['货币经济学', '通货膨胀'],
    playSummary: '调整货币供给与经济条件，观察模型中的价格和产出变化',
    levelsSummary: '货币供应增速与物价水平 · 短期产出幻觉与长期通胀中性',
    source: 'Friedman, The Role of Monetary Policy (1968) / A Monetary History (1963)',
    quoteCount: 4,
    thumbType: 'econ_money',
    coreQuestion: '超发货币能否永久降低失业率、刺激实际产出？通货膨胀归根结底是由什么决定的？',
    boundaryNote: '基于货币流通速度 V 长期相对稳定的经验前提；在流动性陷阱或金融创新剧烈变动期 V 可能大幅波动。',
    stages: [
      {
        id: 1,
        tabLabel: '① 货币数量论 MV = PQ',
        instructionTitle: '阶段 ①：拖动印钞机货币供给增速滑杆，对比实际产出增速与物价通胀率的变化',
        mappings: [
          [
            '将货币供给增速拉高至远超实际产出增速，触发物价飙升',
            '通货膨胀无论在何时何地都是一种货币现象——它只能由货币数量比产出增长得更快所引起。',
            'Inflation is always and everywhere a monetary phenomenon in the sense that it is and can be produced only by a more rapid increase in the quantity of money than in output.',
            'Friedman, The Counter-Revolution in Monetary Theory (1970)'
          ],
          [
            '将货币增速锚定于长期实际产出增速附近，稳定物价水平',
            '货币政策最好遵循一条公开宣布的规则：让货币存量以一个稳定的速率按月或按年增长。',
            'A publicly stated policy of a steady rate of monetary growth.',
            'Friedman, A Program for Monetary Stability (1960)'
          ]
        ]
      },
      {
        id: 2,
        tabLabel: '② 短期货币幻觉与长期自然失业率',
        instructionTitle: '阶段 ②：观察意外扩表在短期刺激产出后，如何随着公众通胀预期调整而回归自然率',
        mappings: [
          [
            '触发短期超预期通胀，观察名义工资幻觉下的暂时产出上升',
            '货币当局可以在短期内把失业率压低到自然率以下，但这仅仅是因为公众尚未预料到随之而来的通货膨胀。',
            'The monetary authority can make the market rate less than the natural rate only by inflation that is unanticipated.',
            'Friedman, The Role of Monetary Policy (1968)'
          ],
          [
            '推进时间至长期预期修正后，观察失业率回到自然率而只留下高通胀',
            '在长期中，名义货币量与真实经济变量之间存在着一道不可逾越的鸿沟，货币政策无法永久钉住真实失业率。',
            'The monetary authority controls nominal quantities; it cannot use its control over nominal quantities to peg a real quantity.',
            'Friedman, American Economic Review 58(1), 1968'
          ]
        ]
      }
    ]
  },
  {
    id: 94,
    slug: 'minest_akerlof_lemons',
    title: '阿克洛夫 · 柠檬市场',
    philosopher: '乔治·阿克洛夫',
    concept: '信息不对称、逆向选择与市场萎缩',
    categoryGroup: '一、经济学与博弈论（87–101）',
    tags: ['信息经济学', 'Top 4 优先'],
    playSummary: '买卖不同质量的二手车，调整信息透明度，观察逆向选择',
    levelsSummary: '好车(水蜜桃)被次品(柠檬)逐出市场 · 第三方质检与保修承诺修复',
    source: 'Akerlof, The Market for "Lemons": Quality Uncertainty and the Market Mechanism (1970)',
    quoteCount: 4,
    thumbType: 'econ_lemons',
    priorityRank: 4,
    coreQuestion: '为什么二手车市场上明明有很多保养极佳的好车，买方却只敢出均价，最终导致好车车主纷纷撤出、只剩破车？',
    boundaryNote: '展示了无信号机制下的极端逆向选择；现实市场可通过品牌声誉、法定保修与独立认证部分消解信息不对称。',
    stages: [
      {
        id: 1,
        tabLabel: '① 信息不对称与逆向选择螺旋',
        instructionTitle: '阶段 ①：在买方无法分辨车况时调整出价，观察高质好车（水蜜桃）被迫退出市场',
        mappings: [
          [
            '买方按市场平均质量出价，导致好车卖家因亏本撤回好车',
            '由于买主无法区分好车和坏车（“柠檬”），好车和坏车只能按同样的平均价格出售，结果好车被坏车逐出了市场。',
            'For it is quite possible to have the bad driving out the not-so-bad driving out the medium driving out the good in such a sequence of events that no market exists at all.',
            'Akerlof, The Market for "Lemons", QJE (1970)'
          ],
          [
            '观察平均质量进一步下跌引发第二轮降价，直至市场完全冻结',
            '不诚实与低质量的成本不仅在于买主受骗本身，更在于它把原本正当互利的商业交易彻底摧毁并缩减了市场规模。',
            'The cost of dishonesty, therefore, lies not only in the amount by which the purchaser is cheated; the cost also must include the loss incurred from driving legitimate business out of existence.',
            'Akerlof, QJE 84(3), 1970'
          ]
        ]
      },
      {
        id: 2,
        tabLabel: '② 质量透视镜、保修承诺与信号恢复',
        instructionTitle: '阶段 ②：拖动信息透明度滑杆（引入第三方检测与质量担保），重新激活好车交易',
        mappings: [
          [
            '开启质量保修与独立检测认证，让好车与次品实现分离定价',
            '存在着许多抵消质量不确定性影响的制度，例如质量担保（Guarantees）、品牌声誉（Brand-names）和执业许可。',
            'Numerous institutions arise to counteract the effects of quality uncertainty. One obvious institution is the guarantee.',
            'Akerlof, The Market for "Lemons" (1970)'
          ],
          [
            '恢复高透明度，观察好车与普通车各自以公允价格成交',
            '担保书把质量风险从买方转移到了更了解真实质量的卖方身上，从而重建了信任与交易。',
            'Most consumer durables carry guarantees to ensure the buyer of some normal expected quality.',
            'Akerlof, The Market for "Lemons" (1970)'
          ]
        ]
      }
    ]
  },
  {
    id: 95,
    slug: 'minest_coase_transaction',
    title: '科斯 · 交易成本与科斯定理',
    philosopher: '罗纳德·科斯',
    concept: '外部性相互性、产权界定与交易成本门槛',
    categoryGroup: '一、经济学与博弈论（87–101）',
    tags: ['新制度经济学', '法经济学'],
    playSummary: '调整谈判成本、产权与协商条件，比较资源配置',
    levelsSummary: '牧牛人越界与农夫麦田 · 零交易成本下的帕累托最优与高交易成本下的产权设计',
    source: 'Coase, The Problem of Social Cost (1960)',
    quoteCount: 4,
    thumbType: 'econ_coase',
    coreQuestion: '当牧牛人的牛踩坏了隔壁农夫的庄稼时，把产权判给农夫还是判给牧牛人，会影响最终修不修栅栏的效率结果吗？',
    boundaryNote: '科斯第一定理仅在交易成本为零且无财富效应时成立；现实世界正因为交易成本为正，法律产权初始配置才至关重要。',
    stages: [
      {
        id: 1,
        tabLabel: '① 零交易成本下的产权与自愿协商',
        instructionTitle: '阶段 ①：在零交易成本下切换初始产权归属（判给农夫 vs 判给牧牛人），观察协商结果的一致性',
        mappings: [
          [
            '切换产权归属，观察双方均会通过协商采取成本最低的减损方案（修栅栏）',
            '如果定价制度的运行毫无成本（交易成本为零），那么无论法律对损害责任作何规定，最终的生产结构与资源配置效率都是相同的。',
            'If pricing system is assumed to work without cost, the ultimate result (which maximizes the value of production) is independent of the legal position.',
            'Coase, The Problem of Social Cost (1960)'
          ],
          [
            '体会外部性的相互性：避免对甲的损害必然对乙造成限制',
            '人们通常把问题看作甲损害了乙，因而探讨如何制止甲；但这是错误的。我们面对的是一个具有相互性的问题。',
            'We are dealing with a problem of a reciprocal nature. To avoid the harm to B would inflict harm on A.',
            'Coase, Journal of Law and Economics 3, 1960'
          ]
        ]
      },
      {
        id: 2,
        tabLabel: '② 正交易成本壁垒与制度选择',
        instructionTitle: '阶段 ②：拖动谈判交易成本滑杆，观察高昂交易摩擦如何阻断私下协商并凸显初始产权的重要性',
        mappings: [
          [
            '拉高谈判与契约执行成本，观察自发协商因成本高于收益而失败',
            '为了进行市场交易，必须发现谁希望交易、告知人们交易条件并进行谈判、起草契约——这些操作往往成本极高，足以阻止许多本来可以达成的交易。',
            'These operations are often extremely costly, sufficiently costly at any rate to prevent many transactions that would be carried out in a world in which the pricing system worked without cost.',
            'Coase, The Problem of Social Cost (1960)'
          ],
          [
            '在正交易成本下将权利直接配置给能以最低成本避免损害或估值更高的一方',
            '一旦考虑到市场交易的成本，很明显，法律权利的初始界定就会直接影响经济体系运行的效率。',
            'Once the costs of carrying out market transactions are taken into account it is clear that such a rearrangement of rights will only be undertaken when the increase in the value of production consequent upon the rearrangement is greater than the costs which would be involved in bringing it about.',
            'Coase, The Problem of Social Cost (1960)'
          ]
        ]
      }
    ]
  },
  {
    id: 96,
    slug: 'minest_ostrom_commons',
    title: '奥斯特罗姆 · 公共资源治理',
    philosopher: '埃莉诺·奥斯特罗姆',
    concept: '公共池塘资源（CPR）、自主治理八原则与多中心制度',
    categoryGroup: '一、经济学与博弈论（87–101）',
    tags: ['制度经济学', 'Top 5 优先'],
    playSummary: '多人共享渔场，制定规则，观察资源能否长期维持',
    levelsSummary: '无规则过度捕捞的公地悲剧 · 清晰边界、共同监督与分级制裁的可持续渔场',
    source: 'Ostrom, Governing the Commons (1990)',
    quoteCount: 4,
    thumbType: 'econ_ostrom',
    priorityRank: 5,
    coreQuestion: '面对共享渔场或牧场，除了“完全私有化”和“外部利维坦政府强权接管”，社区成员能否通过自主规则避免公地悲剧？',
    boundaryNote: '自主治理在边界清晰、成员沟通充分且具有共同长远利益的社群中最有效；面对全球尺度匿名污染则需多中心协同。',
    stages: [
      {
        id: 1,
        tabLabel: '① 开放准入下的过度捕捞',
        instructionTitle: '阶段 ①：在无规则状态下拖动捕捞强度滑杆，观察鱼群再生速率崩溃与公地枯竭',
        mappings: [
          [
            '提高各自抢捕速率，观察鱼群存量跌破再生临界线',
            '当许多人共同使用一种稀缺资源而没有任何有效规则限制提取量时，个体的短期理性往往导致资源的退化甚至毁灭。',
            'Whenever one person cannot be excluded from the benefits that others provide, each person is motivated not to contribute to the joint effort, but to free-ride on the efforts of others.',
            'Ostrom, Governing the Commons Ch. 1 (1990)'
          ],
          [
            '观察传统理论将出路简单二分为“国家强权”或“彻底私有”的局限',
            '政策分析家们往往预设：资源使用者自己就像被困在陷阱中的无助囚徒，除非外部权威强加规则，否则绝无可能改变自己的处境。',
            'The users are pictured as trapped in a situation they cannot change.',
            'Ostrom, Governing the Commons (1990)'
          ]
        ]
      },
      {
        id: 2,
        tabLabel: '② 激活自主治理原则与永续渔场',
        instructionTitle: '阶段 ②：在画布上依次开启“清晰边界”“本地互监”与“分级制裁”，使捕捞与生态再生达成长期动态平衡',
        mappings: [
          [
            '点亮清晰边界与成员共同参与制定配额规则',
            '在长久存续的公共资源治理制度中，受作业规则影响的绝大多数个体都能够亲自参与对这些规则的修改与审议。',
            'Most individuals affected by the operational rules can participate in modifying the operational rules.',
            'Ostrom, Governing the Commons Ch. 3 (Design Principle 3)'
          ],
          [
            '激活社区互相监督与分级制裁，使鱼群存量稳定在丰盈水平',
            '监督者本身就是资源使用者或对使用者负责，且对违反规则者的制裁根据违规严重程度实行温和而有效的分级递进（Graduated Sanctions）。',
            'Appropriators who violate operational rules are likely to be assessed graduated sanctions by other appropriators.',
            'Ostrom, Governing the Commons Ch. 3 (Design Principle 5)'
          ]
        ]
      }
    ]
  },
  {
    id: 97,
    slug: 'minest_kahneman_prospect',
    title: '卡尼曼与特沃斯基 · 前景理论',
    philosopher: '丹尼尔·卡尼曼 / 阿莫斯·特沃斯基',
    concept: '参照点依赖、损失厌恶与 S 型不对称价值函数',
    categoryGroup: '一、经济学与博弈论（87–101）',
    tags: ['行为经济学', 'Top 6 优先'],
    playSummary: '调整收益、损失与概率，观察选择和价值函数',
    levelsSummary: '面对收益风险规避 vs 面对损失风险寻求 · 损失的痛苦约为等额收益快乐的 2.25 倍',
    source: 'Kahneman & Tversky, Prospect Theory: An Analysis of Decision under Risk (1979)',
    quoteCount: 4,
    thumbType: 'econ_prospect',
    priorityRank: 6,
    coreQuestion: '为什么人们在稳拿 900 元与 90% 概率拿 1000 元之间倾向稳拿，但在稳亏 900 元与 90% 概率亏 1000 元之间却宁愿赌一把？',
    boundaryNote: '描述了人类直觉系统（系统 1）的经验决策规律；在高频重复交易或有专业期望值核算辅助时偏差会减弱。',
    stages: [
      {
        id: 1,
        tabLabel: '① S 型价值函数与损失厌恶',
        instructionTitle: '阶段 ①：沿着不对称 S 型价值曲线左右拖动损益滑块，对比“捡到 500 元”与“丢失 500 元”的心理斜率',
        mappings: [
          [
            '在参照点两侧切换等额收益与损失，观察中心参照点的决定性作用',
            '感知系统更容易对变化和差异做出反应，而不是对绝对量级做出反应；价值的载体是相对于参照点的收益与损失，而非最终财富总量。',
            'The carriers of value are changes in wealth or welfare, rather than final states.',
            'Kahneman & Tversky, Econometrica 47(2), 1979'
          ],
          [
            '将滑块拉入左下方损失象限，观察陡峭 2.25 倍的损失厌恶斜率',
            '价值函数在收益区是凹的，在损失区是凸的，而且损失区的曲线明显比收益区陡峭得多——失去一定金额的痛苦大于获得同等金额的快乐。',
            'The value function is normally concave for gains, commonly convex for losses, and is generally steeper for losses than for gains. Losses loom larger than gains.',
            'Kahneman & Tversky, Prospect Theory (1979)'
          ]
        ]
      },
      {
        id: 2,
        tabLabel: '② 框架效应与反射效应（风险偏好反转）',
        instructionTitle: '阶段 ②：在“确定性收益框架”与“确定性损失框架”之间切换，观察群体风险态度从规避反转为冒险',
        mappings: [
          [
            '在收益域测试：公众高度偏爱确定性收益（风险规避）',
            '在涉及收益的选择中，人们表现出强烈的确定性效应（Certainty Effect），倾向于规避风险以确保稳拿收益。',
            'People overweight outcomes that are considered certain, relative to outcomes which are merely probable.',
            'Kahneman & Tversky, Prospect Theory (1979)'
          ],
          [
            '切换至等值的损失域：公众为避免确定损失而转向放手一搏（风险寻求）',
            '将正前景（收益）的符号反转为负前景（损失），会使原本的风险规避完全镜像反转为风险寻求——我们称之为反射效应（Reflection Effect）。',
            'The reflection of prospects around 0 reverses the preference order. Risk aversion in the positive domain is accompanied by risk seeking in the negative domain.',
            'Kahneman & Tversky, Econometrica (1979)'
          ]
        ]
      }
    ]
  },
  {
    id: 98,
    slug: 'minest_thaler_nudge',
    title: '塞勒 · 助推理论',
    philosopher: '理查德·塞勒 / 卡斯·桑斯坦',
    concept: '自由主义温和专制、选择架构与默认选项效应',
    categoryGroup: '一、经济学与博弈论（87–101）',
    tags: ['行为经济学', '公共政策'],
    playSummary: '改变默认选项和选择架构，观察模拟群体的行为变化',
    levelsSummary: '养老金与器官捐献的“默认加入 vs 默认退出” · 不禁止任何选项的温和引导',
    source: 'Thaler & Sunstein, Nudge: Improving Decisions About Health, Wealth, and Happiness (2008)',
    quoteCount: 4,
    thumbType: 'econ_nudge',
    coreQuestion: '在不发布强制命令、也不改变经济奖惩的前提下，仅仅把表格上的“默认勾选”改一下，为何能让养老储蓄率从 40% 飙升到 90%？',
    boundaryNote: '助推必须保持透明且保留低成本退出自由（一键退出）；若利用默认选项制造退订障碍则滑向“暗黑模式（Sludge）”。',
    stages: [
      {
        id: 1,
        tabLabel: '① 默认选项（Opt-in vs Opt-out）的力量',
        instructionTitle: '阶段 ①：切换选择架构的默认规则（主动申请加入 vs 自动加入可随时退出），观察群体参与率跃迁',
        mappings: [
          [
            '在“需填表主动申请（Opt-in）”模式下观察由于拖延惯性导致的低参与率',
            '由于现状偏见与拖延惯性，许多人会直接接受任何被设定为默认值的选项，无论该默认选项对他们是否有益。',
            'For reasons of laziness, fear, and distraction, many people will take whatever option requires the least effort, or the path of least resistance.',
            'Thaler & Sunstein, Nudge Ch. 5 (2008)'
          ],
          [
            '切换至“默认自动加入、一键自由退出（Opt-out）”，观察参与率跃升至 90%+',
            '助推是选择架构的任何一个方面，它以可预测的方式改变人们的行为，但绝不禁止任何选项，也不显著改变他们的经济激励。',
            'A nudge is any aspect of the choice architecture that alters people’s behavior in a predictable way without forbidding any options or significantly changing their economic incentives.',
            'Thaler & Sunstein, Nudge Ch. 1 (2008)'
          ]
        ]
      },
      {
        id: 2,
        tabLabel: '② 明日多存钱（Save More Tomorrow）与自助食堂摆放',
        instructionTitle: '阶段 ②：拖动视觉显著性与未来加薪自动储蓄比例，帮助有限自控力个体克服当下偏见',
        mappings: [
          [
            '将健康水果置于视线平齐第一排，观察不剥夺甜点选择权下的健康饮食提升',
            '要算作纯粹的助推，干预措施必须容易且低成本地被避开。把水果放在视线水平位置是助推，而禁止垃圾食品则是强制命令。',
            'Putting the fruit at eye level counts as a nudge. Banning junk food does not.',
            'Thaler & Sunstein, Nudge (2008)'
          ],
          [
            '开启“未来每次加薪自动拨付储蓄”机制，化解当下损失厌恶',
            '通过将储蓄增长绑定在未来的加薪上，人们不会感到当下的可支配收入减少，从而巧妙地绕过了损失厌恶与拖延。',
            'Save More Tomorrow invites participants to commit themselves, in advance, to allocating a portion of their future salary increases toward retirement savings.',
            'Thaler & Benartzi, Journal of Political Economy (2004)'
          ]
        ]
      }
    ]
  },
  {
    id: 99,
    slug: 'minest_simon_bounded',
    title: '赫伯特·西蒙 · 有限理性',
    philosopher: '赫伯特·西蒙',
    concept: '计算与信息约束、满意化（Satisficing）与探索启发式',
    categoryGroup: '一、经济学与博弈论（87–101）',
    tags: ['决策科学', '认知心理学'],
    playSummary: '限制信息与计算能力，比较满意化决策和最优化决策',
    levelsSummary: '草堆里找最锋利的针 vs 能缝衣服的针 · 搜寻成本与满意阈值动态调节',
    source: 'Simon, A Behavioral Model of Rational Choice (1955) / Models of Man (1957)',
    quoteCount: 4,
    thumbType: 'econ_simon',
    coreQuestion: '面对成千上万个无法穷尽评估的备选方案，真实人类是如何避免在无休止的“寻找全局最优”中耗尽时间和生命的？',
    boundaryNote: '并非为粗心辩护；在计算成本极低且空间极小的结构化问题中，精确最优化依然优于粗糙满意化。',
    stages: [
      {
        id: 1,
        tabLabel: '① 满意化（Satisficing）vs 穷举最优化',
        instructionTitle: '阶段 ①：拖动满意标准阈值（Aspiration Level）与搜寻时间预算，对比“找到足够好即停”与“穷尽全局”的净收益',
        mappings: [
          [
            '测试在有限时间与高搜寻成本下强行穷举所有选项导致的净收益归零',
            '人类心智的容量与需要解决的问题规模相比是极其微小的，因此在客观现实中追求绝对的全局最优化往往既不现实也不经济。',
            'The capacity of the human mind for formulating and solving complex problems is very small compared with the size of the problems.',
            'Simon, Models of Man (1957)'
          ],
          [
            '设定合理的满意阈值，一旦遇到达标方案立即锁定执行',
            '理性的行动者并不是在草堆里寻找那根“最锋利的针”，而是寻找一根“锋利到足以缝好衣服的针”——这就是满意化（Satisficing）。',
            'Most human decision-making, whether individual or organizational, is concerned with the discovery and selection of satisfactory alternatives; only in exceptional cases is it concerned with the discovery and selection of optimal alternatives.',
            'March & Simon, Organizations (1958)'
          ]
        ]
      },
      {
        id: 2,
        tabLabel: '② 环境与认知的“双刃剪刀”及愿望水平调节',
        instructionTitle: '阶段 ②：观察当搜寻顺利或困难时，决策者如何动态上调或下调自己的“满意愿望水平”',
        mappings: [
          [
            '体会认知限制与外部环境结构共同塑造决策行为的“剪刀比喻”',
            '人类的理性行为是由一把剪刀塑造的，它的一片刀刃是任务环境的结构，另一片刀刃是行动者的计算能力。',
            'Human rational behavior is shaped by a scissors whose two blades are the structure of task environments and the computational capabilities of the actor.',
            'Simon, Invariants of Human Behavior (1990)'
          ],
          [
            '根据搜寻反馈动态调整愿望水平，在复杂世界中保持适应性效率',
            '如果很容易找到满意的备选方案，愿望水平就会上升；如果很难找到，愿望水平就会下降。',
            'As the individual finds it easy or difficult to discover satisfactory alternatives, his aspiration level rises or falls.',
            'Simon, Quarterly Journal of Economics 69(1), 1955'
          ]
        ]
      }
    ]
  },
  {
    id: 100,
    slug: 'minest_tobin_portfolio',
    title: '托宾 · 投资组合选择',
    philosopher: '詹姆斯·托宾',
    concept: '分散化风险对冲、“不要把鸡蛋放在一个篮子里”与托宾分离定理',
    categoryGroup: '一、经济学与博弈论（87–101）',
    tags: ['金融经济学', '风险管理'],
    playSummary: '调整资产风险、收益和相关性，观察组合风险变化',
    levelsSummary: '资产相关性 ρ 与波动率抵消 · 无风险资产与最优风险组合的分离定理',
    source: 'Tobin, Liquidity Preference as Behavior Towards Risk (1958)',
    quoteCount: 4,
    thumbType: 'econ_tobin',
    coreQuestion: '为什么把两只单独看都剧烈波动的风险资产组合在一起，整体投资组合的风险反而可以大幅下降？',
    boundaryNote: '依赖资产间历史相关性的稳定；在系统性金融危机中，各类风险资产的相关系数往往同时趋向于 +1。',
    stages: [
      {
        id: 1,
        tabLabel: '① 相关性与分散化降险（鸡蛋与篮子）',
        instructionTitle: '阶段 ①：拖动两类风险资产的配置权重与相关系数 ρ，观察负相关或低相关如何抹平组合总波动',
        mappings: [
          [
            '将资金 100% 押注单一高波动资产，观察剧烈的风险暴露',
            '不要把所有的鸡蛋都放在同一个篮子里——分散化投资正是为了在给定预期收益下降低总体收益的方差（风险）。',
            'Don’t put all your eggs in one basket.',
            'Tobin, Nobel Lecture / Liquidity Preference (1958)'
          ],
          [
            '调低两项资产的相关系数并均衡配置，观察组合风险显著低于任一单项资产',
            '只要不同资产的收益不是完全正相关的，将它们组合持有所带来的总体风险就会小于各项资产风险的加权平均。',
            'Diversification among imperfectly correlated assets reduces the variance of the portfolio return.',
            'Tobin, Review of Economic Studies 25(2), 1958'
          ]
        ]
      },
      {
        id: 2,
        tabLabel: '② 托宾分离定理（无风险现金 + 切线风险组合）',
        instructionTitle: '阶段 ②：在安全现金与最优风险资产包之间拖动杠杆滑杆，验证风险资产内部最佳比例与个人风险偏好无关',
        mappings: [
          [
            '确定风险资产内部的唯一最优切线比例（最高夏普比率点）',
            '风险资产之间的最优配置比例是完全独立于投资者个人的风险厌恶程度的——这就是分离定理（Separation Theorem）。',
            'The proportionate composition of the non-cash assets is independent of their aggregate share of the investment balance.',
            'Tobin, Review of Economic Studies 25(2), 1958'
          ],
          [
            '通过调整无风险现金与该风险组合的配比，满足保守或激进投资者的需求',
            '投资者只需做两步独立决策：第一，找出最优的风险资产组合；第二，决定在无风险现金与该风险组合之间如何分配资金。',
            'This fact makes it possible to describe the investor’s decisions as if there were a single non-cash asset.',
            'Tobin, Liquidity Preference as Behavior Towards Risk (1958)'
          ]
        ]
      }
    ]
  },
  {
    id: 101,
    slug: 'minest_solow_growth',
    title: '罗伯特·索洛 · 经济增长模型',
    philosopher: '罗伯特·索洛',
    concept: '资本边际报酬递减、稳态均衡（Steady State）与全要素生产率（技术进步）',
    categoryGroup: '一、经济学与博弈论（87–101）',
    tags: ['宏观增长', '技术进步'],
    playSummary: '调整储蓄率、人口增长和技术进步，观察长期资本与产出',
    levelsSummary: '储蓄投资 sf(k) 与折旧稀释 (δ+n)k 交点 · 唯有技术进步能突破稳态天花板',
    source: 'Solow, A Contribution to the Theory of Economic Growth (1956)',
    quoteCount: 4,
    thumbType: 'econ_solow',
    coreQuestion: '一个国家仅仅靠拼命提高储蓄率、不断盖厂房和堆砌机器，为什么在长期中总会遇到增长停滞的“稳态天花板”？',
    boundaryNote: '外生增长模型将技术进步视为外生变量；后续罗默内生增长理论进一步探讨了研发与人力资本如何内生驱动技术进步。',
    stages: [
      {
        id: 1,
        tabLabel: '① 资本报酬递减与稳态收敛（k*）',
        instructionTitle: '阶段 ①：拖动储蓄率 s 滑杆，观察新增投资 sf(k) 如何被资本折旧曲线 (δ+n)k 追平并锁死在稳态点 k*',
        mappings: [
          [
            '提高储蓄率 s，观察短期资本积累加速但边际产出斜率逐渐变平',
            '由于资本的边际报酬递减，随着人均资本存量不断增加，每新增一单位资本所带来的产出增量会越来越小。',
            'Because of diminishing returns to capital, increases in the saving rate generate only temporary growth along the transition to a new steady state.',
            'Solow, Quarterly Journal of Economics 70(1), 1956'
          ],
          [
            '到达 sf(k*) = (δ+n)k* 稳态交点，观察人均资本与人均产出停止继续增长',
            '当新增投资恰好只够弥补现有资本的折旧和新出生人口的资本稀释时，经济就达到了稳态均衡（Steady-State Equilibrium）。',
            'At the steady state, capital and output per worker are constant.',
            'Solow, A Contribution to the Theory of Economic Growth (1956)'
          ]
        ]
      },
      {
        id: 2,
        tabLabel: '② 索洛余值：唯有技术进步驱动长期持续增长',
        instructionTitle: '阶段 ②：拖动技术进步（全要素生产率 A）滑杆，观察生产函数整体上移并持续推高人均生活水平',
        mappings: [
          [
            '对比单纯堆砌资本（水平停滞）与注入技术进步（生产曲线持续向上跃迁）',
            '单纯提高储蓄率只有“水平效应”而没有长期的“增长效应”；一旦进入新稳态，人均增长率仍会回到零。',
            'An increase in the saving rate permanently increases the level of output per worker, but does not permanently increase the growth rate.',
            'Solow, QJE (1956)'
          ],
          [
            '拉高技术进步率 g，实现稳态人均产出的永续增长',
            '长期人均产出的持续增长，超过八成不能由资本和劳动投入的数量增加来解释，而必须归功于技术进步（索洛余值）。',
            'Gross output per man hour doubled over the interval, with 87.5 per cent of the increase attributable to technical change and the remaining 12.5 per cent to increased use of capital.',
            'Solow, Technical Change and the Aggregate Production Function (1957)'
          ]
        ]
      }
    ]
  }
];
