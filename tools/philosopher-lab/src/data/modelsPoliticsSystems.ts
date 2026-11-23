import { PhilosophyModel } from '../types/philosophy';

export const MODELS_124_TO_136: PhilosophyModel[] = [
  // ==================== 四、政治学、传播学与组织管理（124–131） ====================
  {
    id: 124,
    slug: 'minest_montesquieu_separation',
    title: '孟德斯鸠 · 三权分立',
    philosopher: '孟德斯鸠',
    concept: '立法、行政、司法分立与“以权力约束权力”的宪政制衡',
    categoryGroup: '四、政治学、传播学与组织管理（124–131）',
    tags: ['政治学', '宪政体制'],
    playSummary: '操作行政、立法和司法三组机构，观察权力制衡',
    levelsSummary: '权力合一的专断危机 · 立法预算约束、行政否决权与司法违宪审查三角制衡',
    source: 'Montesquieu, The Spirit of the Laws (De l’esprit des lois, 1748)',
    quoteCount: 4,
    thumbType: 'pol_montesquieu',
    coreQuestion: '既然任何握有权力的人都天然倾向于把权力用到极限，制度设计该如何防止公共权力侵害公民自由？',
    boundaryNote: '现代分权并非三权彻底隔绝孤立，而是“分权与制衡（Checks and Balances）”并重，防止权力既不过度集中也不陷入宪政僵局。',
    stages: [
      {
        id: 1,
        tabLabel: '① 权力合并的暴政风险 vs 三权分立',
        instructionTitle: '阶段 ①：在画布上先将立法、行政、司法三块权力磁铁合并观察自由度归零，再将其拉开至三角支点位置',
        mappings: [
          [
            '将立法权与行政权或司法权合并于同一机构，观察公民自由护盾破裂',
            '当立法权和行政权集中在同一个人或同一个机关之手，自由便不复存在了；如果司法权不同立法权和行政权分立，自由也就不存在了。',
            'When the legislative and executive powers are united in the same person, or in the same body of magistrates, there can be no liberty.',
            'Montesquieu, The Spirit of the Laws Book XI, Ch. 6 (1748)'
          ],
          [
            '将三权分离归位至三个独立支点，观察公民自由空间重新撑开',
            '如果同一个人或同一个重要人物、贵族或平民的团体，行使这三种权力——即制定法律权、执行公共决议权和裁判私人犯罪或争讼权，则一切便都完了。',
            'There would be an end of everything, were the same man or the same body, whether of the nobles or of the people, to exercise those three powers.',
            'Montesquieu, The Spirit of the Laws XI.6 (1748)'
          ]
        ]
      },
      {
        id: 2,
        tabLabel: '② 以权力约束权力（Checks and Balances）',
        instructionTitle: '阶段 ②：拖动某一权力的越界扩张企图，实时触发另外两权的制衡反弹（立法的拨款监督、行政的否决、司法的违宪审查）',
        mappings: [
          [
            '模拟单一权力越界膨胀，验证“一切有权力的人都容易滥用权力”',
            '这是一条万古不易的经验：一切有权力的人都容易滥用权力，而且一直要用到有界限的地方才休止。美德本身也需要界限。',
            'Constant experience shows us that every man invested with power is apt to abuse it, and to carry his authority as far as it will go.',
            'Montesquieu, The Spirit of the Laws Book XI, Ch. 4 (1748)'
          ],
          [
            '激活三角反向制衡锁扣，实现“以权力约束权力”的动态均衡',
            '要防止滥用权力，就必须通过事物的制度安排，以权力约束权力（Le pouvoir arrête le pouvoir）。',
            'To prevent this abuse, it is necessary from the very nature of things that power should be a check to power.',
            'Montesquieu, The Spirit of the Laws XI.4 (1748)'
          ]
        ]
      }
    ]
  },
  {
    id: 125,
    slug: 'minest_arrow_impossibility',
    title: '阿罗 · 不可能定理',
    philosopher: '肯尼思·阿罗',
    concept: '孔多塞投票循环悖论、议程操纵与社会福利函数的五大公理冲突',
    categoryGroup: '四、政治学、传播学与组织管理（124–131）',
    tags: ['社会选择理论', 'Top 9 优先'],
    playSummary: '调整选民偏好与投票规则，探索公平条件之间的冲突',
    levelsSummary: 'A>B>C、B>C>A、C>A>B 的孔多塞石头剪刀布循环 · 任何非独裁投票规则都无法同时满足全公理',
    source: 'Arrow, Social Choice and Individual Values (1951)',
    quoteCount: 4,
    thumbType: 'pol_arrow',
    priorityRank: 9,
    coreQuestion: '当三个选民对 A、B、C 三个方案各有理性排序时，是否存在一种“十全十美”的民主投票规则，能永远把个人偏好汇总为自洽的群体偏好？',
    boundaryNote: '阿罗定理针对的是“仅收集序数排名（第1、第2、第3名）”且允许任意偏好域（无单峰限制）的机制；若选民偏好呈单峰分布或引入基数评分则可打破循环。',
    stages: [
      {
        id: 1,
        tabLabel: '① 孔多塞投票悖论与循环多数（A > B > C > A）',
        instructionTitle: '阶段 ①：在画布上点击进行“A vs B”“B vs C”与“C vs A”两两多数决投票，亲手触发群体偏好的石头剪刀布死循环',
        mappings: [
          [
            '依次执行三轮两两对决，观察 2:1 多数决产生 A 胜 B、B 胜 C、但 C 却反胜 A 的非传递性循环',
            '即使每一个选民个人的偏好排序都是完全理性且满足传递性的，通过多数决汇总出来的群体社会偏好却可能陷入违反传递性的死循环。',
            'A natural way of arriving at the collective preference scale would be to say that one alternative beats another if a majority prefers the first to the second... yet this can lead to a cyclical majority.',
            'Arrow, Social Choice and Individual Values Ch. 1 (1951)'
          ],
          [
            '改变淘汰赛的出场顺序（议程设定），观察谁最后出场谁就能获胜',
            '在存在投票循环的情况下，掌握投票议程顺序（Agenda Control）的人几乎可以操纵出他想要的任何最终赢家。',
            'When cyclical majorities occur, the final outcome depends entirely on the order in which alternatives are put to a vote.',
            'Arrow, Social Choice and Individual Values (1951)'
          ]
        ]
      },
      {
        id: 2,
        tabLabel: '② 阿罗不可能定理的公理冲突天平',
        instructionTitle: '阶段 ②：在多数决、波达计数法（Borda）与淘汰制间切换，观察“传递性”“无关备选方案独立性（IIA）”与“非独裁性”不可兼得',
        mappings: [
          [
            '切换至波达积分法（第1名3分、第2名2分），观察撤走无关候选项 C 居然导致 A 与 B 的胜负反转（违反 IIA 公理）',
            '无关备选方案独立性（IIA）要求：社会对 A 和 B 的相对排序，只应取决于选民对 A 和 B 的偏好，而不应因为某个无关的第三方案 C 是否参选而发生颠倒。',
            'The social choice made from any environment depends only on the orderings of individuals with respect to the alternatives in that environment.',
            'Arrow, Social Choice and Individual Values Condition 3 (1951)'
          ],
          [
            '验证阿罗不可能定理：面对三个以上备选方案，满足无限制域、帕累托与 IIA 的传递性规则必是独裁者',
            '如果备选方案至少有三个，那么不存在任何社会福利函数能够同时满足无限制域、帕累托最优、无关方案独立性以及非独裁性。',
            'If we exclude the possibility of interpersonal comparisons of utility, then the only methods of passing from individual tastes to social preferences which will be satisfactory and which will be defined for a wide range of sets of individual orderings are either imposed or dictatorial.',
            'Arrow, Social Choice and Individual Values p. 59 (1951)'
          ]
        ]
      }
    ]
  },
  {
    id: 126,
    slug: 'minest_downs_median_voter',
    title: '唐斯 · 中间选民模型',
    philosopher: '安东尼·唐斯 / 哈罗德·霍特林',
    concept: '单峰偏好光谱、霍特林空间竞争与政党向中间选民（Median Voter）的向心收敛',
    categoryGroup: '四、政治学、传播学与组织管理（124–131）',
    tags: ['公共选择', '选举政治学'],
    playSummary: '拖动候选人在政策光谱中的位置，观察模型中的选民选择',
    levelsSummary: '海滩冰淇淋摊位与左中右政策光谱 · 任何偏离中位选民的候选人都会把选票拱手让人',
    source: 'Downs, An Economic Theory of Democracy (1957) / Hotelling (1929)',
    quoteCount: 4,
    thumbType: 'pol_downs',
    coreQuestion: '为什么在两党多数决大选中，原本立场鲜明的左翼候选人和右翼候选人到了决选阶段，其政策纲领往往会变得越来越像、纷纷向中间靠拢？',
    boundaryNote: '成立前提是单维政策光谱、选民单峰偏好、两党竞争且所有选民均出来投票；若存在党内极端初选牵制或弃权冷漠，则可能出现两极分化而非中间收敛。',
    stages: [
      {
        id: 1,
        tabLabel: '① 政策光谱拖动与得票分割线',
        instructionTitle: '阶段 ①：在 0–100 政策光谱上直接拖动红蓝两位候选人的立场位置，观察选民如何投票给距离自己最近的候选人',
        mappings: [
          [
            '让一方候选人停在极端边缘而另一方移向光谱中心，观察中间派以压倒性得票获胜',
            '在民主政治中，政党制定政策是为了赢得选举，而不是赢得选举去制定政策；每一个选民都会把票投给政策立场距离自己理想点最近的候选人。',
            'Parties formulate policies in order to win elections, rather than win elections in order to formulate policies.',
            'Downs, An Economic Theory of Democracy p. 28 (1957)'
          ],
          [
            '将双方候选人都向 50% 中位数选民（Median Voter）聚拢，达成向心纳什均衡',
            '在两党竞争且选民偏好呈单峰分布的一维政策空间中，两位候选人的政纲都会不可阻挡地向中间选民（中位数选民）的位置收敛。',
            'Both parties will converge toward the position of the median voter.',
            'Downs, An Economic Theory of Democracy Ch. 8 (1957)'
          ]
        ]
      },
      {
        id: 2,
        tabLabel: '② 双峰极化分布与极端选民弃投牵制',
        instructionTitle: '阶段 ②：将选民分布从“钟形单峰”切换为“哑铃型双峰极化（如果向中间靠拢太远，铁杆选民就赌气不投票）”，观察向心收敛失效',
        mappings: [
          [
            '切换为双峰两极化选民分布，观察向中间靠拢导致基本盘铁杆选民弃票流失',
            '如果选民的分布呈现出两极分化的双峰形态，且极端选民在政党过度妥协时会选择弃权不投票，那么两党向中间收敛的动力就会被阻断。',
            'In a bimodal distribution where extremists abstain if their party moves too close to the center, parties will remain polarized.',
            'Downs, An Economic Theory of Democracy Ch. 8 (1957)'
          ],
          [
            '理解选民分布形态对民主政体稳定与共识政治的决定性影响',
            '一个社会的政治稳定与温和程度，在很大程度上取决于其选民在意识形态光谱上的分布是聚集于中心，还是撕裂在两端。',
            'The distribution of voters along the political scale determines the number and nature of parties and the stability of democracy.',
            'Downs, An Economic Theory of Democracy (1957)'
          ]
        ]
      }
    ]
  },
  {
    id: 127,
    slug: 'minest_nye_soft_power',
    title: '约瑟夫·奈 · 软实力',
    philosopher: '约瑟夫·奈',
    concept: '硬实力（大棒强制与胡萝卜收买）vs 软实力（文化、价值观与外交政策的吸引力与同化力）',
    categoryGroup: '四、政治学、传播学与组织管理（124–131）',
    tags: ['国际关系', '外交战略'],
    playSummary: '在外交情境中比较吸引、说服和强制手段',
    levelsSummary: '军事大棒强制（高反弹）与经济胡萝卜收买 vs 软实力文化价值吸引（让对方自愿想要你所想要的） · 巧实力组合',
    source: 'Nye, Bound to Lead (1990) / Soft Power: The Means to Success in World Politics (2004)',
    quoteCount: 4,
    thumbType: 'pol_nye',
    coreQuestion: '在国际政治与领导力中，“用枪炮威胁别人服从”“用金钱收买别人配合”，与“让别人由衷羡慕并自愿认同你的目标”，哪一种力量更持久且成本更低？',
    boundaryNote: '软实力并非可以完全取代硬实力的万能灵药；脱离了基本安全保障与言行一致的公信力，单纯的宣传只会沦为空洞口号。两者有机结合即“巧实力（Smart Power）”。',
    stages: [
      {
        id: 1,
        tabLabel: '① 强制、利诱（硬实力）vs 吸引同化（软实力）',
        instructionTitle: '阶段 ①：在外交棋盘上分别拖动“军事威胁大棒”“经济收买胡萝卜”与“文化制度吸引力”，对比目标国的服从成本与抗拒反弹率',
        mappings: [
          [
            '对比硬实力（强制与收买）的高昂维持成本与软实力的自愿同化效应',
            '什么是软实力？它是通过吸引而非强制或收买来获得你想要的结果的能力——即让别人自愿想要你所想要的东西（Co-optive Power）。',
            'Soft power is the ability to get what you want through attraction rather than coercion or payments.',
            'Nye, Soft Power: The Means to Success in World Politics Preface (2004)'
          ],
          [
            '点亮软实力的三大支柱：文化吸引力、真诚奉行的政治价值观与合法道德的外交政策',
            '一个国家的软实力主要来自三种资源：它的文化（在对他人具有吸引力的地方）、它的政治价值观（当它在国内外都身体力行这些价值时），以及它的外交政策（当这些政策被视为合法且具有道德权威时）。',
            'The soft power of a country rests primarily on three resources: its culture, its political values, and its foreign policies.',
            'Nye, Soft Power Ch. 1 (2004)'
          ]
        ]
      },
      {
        id: 2,
        tabLabel: '② 公信力损耗与“巧实力（Smart Power）”配比',
        instructionTitle: '阶段 ②：观察当霸道单边行为破坏道德公信力时软实力如何崩塌，并通过硬实力底线与软实力感召的协同调出最优“巧实力”',
        mappings: [
          [
            '测试言行不一或傲慢单边行动对软实力吸引光环的迅速侵蚀',
            '在信息时代，最稀缺的资源不是信息，而是注意力和公信力（Credibility）；一旦外交政策被视为虚伪或傲慢，软实力就会迅速蒸发。',
            'Propaganda is not credible, and without credibility, there is no soft power.',
            'Nye, Soft Power Ch. 4 (2004)'
          ],
          [
            '将硬实力威慑护盾与软实力议程塑造有机融合为“巧实力（Smart Power）”',
            '软实力本身并不比硬实力更道德或万能；真正卓越的战略是将硬实力的实力底气与软实力的吸引感召结合起来，这就是“巧实力（Smart Power）”。',
            'Smart power is the ability to combine hard and soft power resources into effective strategies.',
            'Nye, The Future of Power (2011)'
          ]
        ]
      }
    ]
  },
  {
    id: 128,
    slug: 'minest_mcluhan_medium',
    title: '麦克卢汉 · 媒介即讯息',
    philosopher: '马歇尔·麦克卢汉',
    concept: '媒介即人的延伸、媒介即讯息、热媒介（高清晰低参与）与冷媒介（低清晰高卷入）及地球村',
    categoryGroup: '四、政治学、传播学与组织管理（124–131）',
    tags: ['传播学', '媒介环境学'],
    playSummary: '将相同内容放进不同媒介，比较传播结构和互动方式',
    levelsSummary: '口语部落 → 印刷线性理性 → 电子地球村 · 热媒介（广播/印刷）vs 冷媒介（对话/互动网络）',
    source: 'McLuhan, Understanding Media: The Extensions of Man (1964)',
    quoteCount: 4,
    thumbType: 'pol_mcluhan',
    coreQuestion: '真正深刻改变人类社会结构与思维方式的，究竟是媒介里播放的那条具体新闻内容，还是“印刷术、电视、互联网”这些媒介技术本身的形态？',
    boundaryNote: '强调媒介技术形式对感官比例与社会尺度的长远塑造，但并不意味着具体传播内容的真伪与伦理价值可以被完全忽略。',
    stages: [
      {
        id: 1,
        tabLabel: '① 媒介即讯息：相同内容在不同媒介容器中的时空重构',
        instructionTitle: '阶段 ①：将同一条事件内容依次拖入“口耳相传火堆”“古登堡印刷书页”与“实时电子网络”，观察受众感官比率与社会连接结构的剧变',
        mappings: [
          [
            '切换媒介容器，观察无论内容是什么，新媒介本身都在重塑人类交往的尺度与速度',
            '“媒介即讯息”意味着：任何媒介（即我们自身的任何延伸）对个人和社会的真正影响，都是由于这种新媒介引入我们的事务中的新尺度（新速度、新模式）所造成的。',
            'The medium is the message. This is merely to say that the personal and social consequences of any medium—that is, of any extension of ourselves—result from the new scale that is introduced into our affairs by each extension of ourselves, or by any new technology.',
            'McLuhan, Understanding Media Ch. 1 (1964)'
          ],
          [
            '体会传统传播学过度紧盯“内容（看门狗嘴里的肉）”，却忽视了媒介形式本身的改造力量',
            '媒介的“内容”就像小偷用来分散看门狗注意力的那块美味鲜肉；当我们紧盯着屏幕里的内容争论不休时，媒介技术本身已经在不知不觉中重塑了我们的神经感官与社会形态。',
            'For the "content" of a medium is like the juicy piece of meat carried by the burglar to distract the watchdog of the mind.',
            'McLuhan, Understanding Media Ch. 1 (1964)'
          ]
        ]
      },
      {
        id: 2,
        tabLabel: '② 热媒介（Hot Media）vs 冷媒介（Cool Media）',
        instructionTitle: '阶段 ②：拖动“信息清晰填充度”滑杆，对比单向塞满高清晰细节的“热媒介”与留白丰富、迫使受众高度互动补全的“冷媒介”',
        mappings: [
          [
            '拉向热媒介端（高清晰度、单向灌输、受众低参与度）',
            '热媒介是指只延伸一种感官并具有“高清晰度（High Definition）”的媒介——所谓高清晰度就是填满了现成的数据信息，因而留给受众亲自参与和填补的空间极小。',
            'A hot medium is one that extends one single sense in "high definition." High definition is the state of being well filled with data.',
            'McLuhan, Understanding Media Ch. 2 (1964)'
          ],
          [
            '拉向冷媒介端（低清晰度留白、高受众互动补全与深度卷入）',
            '冷媒介提供的数据较少、留白较多，因此它要求听众或观众发挥极高的主动性去参与、填补和共同完成信息的建构。',
            'Hot media are, therefore, low in participation, and cool media are high in participation or completion by the audience.',
            'McLuhan, Understanding Media Ch. 2 (1964)'
          ]
        ]
      }
    ]
  },
  {
    id: 129,
    slug: 'minest_rogers_diffusion',
    title: '罗杰斯 · 创新扩散',
    philosopher: '埃弗雷特·罗杰斯',
    concept: '五类采用者（创新者2.5%、早期采用者13.5%、早期大众34%、晚期大众34%、落后者16%）、S 型扩散曲线与临界大众引爆点',
    categoryGroup: '四、政治学、传播学与组织管理（124–131）',
    tags: ['传播学', 'Top 10 优先'],
    playSummary: '在社会网络中调整创新者、早期采用者和传播条件',
    levelsSummary: '从 2.5% 创新者到 13.5% 早期采用者意见领袖 · 跨越 16% 鸿沟引爆 S 型全网扩散',
    source: 'Rogers, Diffusion of Innovations (1962)',
    quoteCount: 4,
    thumbType: 'pol_rogers',
    priorityRank: 10,
    coreQuestion: '为什么一项优质的新技术或新观念在刚推出时总是缓慢爬行，但一旦突破大约 15%–20% 的采用率门槛，就会像雪崩一样席卷全社会？',
    boundaryNote: '并非所有创新都理应无条件扩散（需警惕“亲创新偏见 Pro-innovation Bias”）；创新的相对优势、兼容性、可试性与可观察性决定了其能否跨越早期大众门槛。',
    stages: [
      {
        id: 1,
        tabLabel: '① 五类采用者钟形分布与 S 型扩散曲线',
        instructionTitle: '阶段 ①：在社会网络画布中依次点亮“创新者（2.5%）”与“早期采用者/意见领袖（13.5%）”，观察累计采用率沿 S 型曲线加速起飞',
        mappings: [
          [
            '点亮前两批先行者（创新者 2.5% + 早期采用者 13.5%），观察意见领袖的示范背书作用',
            '创新扩散是指一项新事物在一段时间内，通过特定的传播渠道，在一个社会系统的成员之间被传播和采纳的过程。',
            'Diffusion is the process by which an innovation is communicated through certain channels over time among the members of a social system.',
            'Rogers, Diffusion of Innovations Ch. 1 (1962)'
          ],
          [
            '突破 16% 临界大众（Critical Mass）拐点，触发早期大众（34%）与晚期大众（34%）的链式跟随',
            '一旦创新的采用人数达到约 10% 至 20% 的“临界大众（Critical Mass）”，社会网络内部的人际口碑推动力就会接管扩散过程，使采用率沿着 S 型曲线陡峭跃升，直至自我维持。',
            'The critical mass occurs at the point at which enough individuals in a system have adopted an innovation so that the innovation’s further rate of adoption becomes self-sustaining.',
            'Rogers, Diffusion of Innovations Ch. 7 / Ch. 9'
          ]
        ]
      },
      {
        id: 2,
        tabLabel: '② 决定扩散速度的五大属性与“跨越鸿沟”',
        instructionTitle: '阶段 ②：拖动创新的“相对优势、兼容性、可试性与可见性”滑杆（并降低复杂度），帮助新事物跨越从早期采用者到实用主义早期大众的鸿沟',
        mappings: [
          [
            '拉高相对优势、可观察性与可试用性，降低使用复杂度',
            '受众对一项创新之五大属性的主观感知——相对优势、兼容性、复杂性、可试性（Trialability）和可观察性（Observability），解释了其采用速度差异的绝大部分原因。',
            'Five attributes of innovations are: (1) relative advantage, (2) compatibility, (3) complexity, (4) trialability, and (5) observability.',
            'Rogers, Diffusion of Innovations Ch. 6 (1962)'
          ],
          [
            '通过大众传媒（获知阶段）与人际同行口碑（说服决策阶段）的协同完成全社会扩散',
            '大众媒介渠道在让人们“初步知道”一项创新时效率最高，而来自身边同辈与意见领袖的“人际传播渠道”则在真正说服人们下决心采纳时最具决定性。',
            'Mass media channels are relatively more important at the knowledge stage, whereas interpersonal channels are relatively more important at the persuasion stage.',
            'Rogers, Diffusion of Innovations Ch. 5 (1962)'
          ]
        ]
      }
    ]
  },
  {
    id: 130,
    slug: 'minest_senge_learning_org',
    title: '彼得·圣吉 · 学习型组织',
    philosopher: '彼得·圣吉',
    concept: '第五项修炼（系统思考）、成长上限基模与“舍本逐末（Shifting the Burden）”系统基模',
    categoryGroup: '四、政治学、传播学与组织管理（124–131）',
    tags: ['组织管理', '系统思考'],
    playSummary: '操作反馈回路、组织目标和系统结构，探索组织学习',
    levelsSummary: '头痛医头的症状解（成瘾依赖）vs 延时见效的根本解 · 增强回路与调节回路的“成长上限”',
    source: 'Senge, The Fifth Discipline: The Art and Practice of the Learning Organization (1990)',
    quoteCount: 4,
    thumbType: 'pol_senge',
    coreQuestion: '为什么组织里每个人都在拼命加班“救火”，短期问题看似很快压下去了，但两三年后同样的危机却以更大的规模反复爆发？',
    boundaryNote: '组织学习不能停留在口号或孤立培训上；唯有识别并改写底层的反馈回路与时间延迟结构（系统基模），才能摆脱“越用力推、系统反弹越猛”的陷阱。',
    stages: [
      {
        id: 1,
        tabLabel: '① 舍本逐末基模：症状解（救火）vs 根本解',
        instructionTitle: '阶段 ①：当组织绩效问题出现时，对比狂点“短期症状解（临时加班/打折促销）”引发的副作用成瘾，与耐心投入“具有时间延迟的根本解（能力建设）”',
        mappings: [
          [
            '频繁依赖立竿见影的“短期救火症状解”，观察其副作用如何萎缩组织解决根本问题的能力',
            '今日的问题往往正是昨日之“解决方案”所带来的非预期后果；过度依赖头痛医头的“症状解”，会产生麻痹与依赖的副作用，反而削弱了实施“根本解”的能力。',
            'Today’s problems come from yesterday’s "solutions." Shifting the burden to the symptomatic solution erodes the capability for the fundamental solution.',
            'Senge, The Fifth Discipline Ch. 4 & Ch. 6 (1990)'
          ],
          [
            '承受短期时间延迟（Delay），将资源坚定投向底层能力建设（根本解）',
            '原因和结果在时间和空间上往往并不紧挨着；要想实现真正的杠杆解，就必须看穿系统中的时间延迟，强化根本的解决机制。',
            'Cause and effect are not closely related in time and space.',
            'Senge, The Fifth Discipline Ch. 4 (1990)'
          ]
        ]
      },
      {
        id: 2,
        tabLabel: '② 成长上限基模（Limits to Growth）：别只踩油门，要解除刹车',
        instructionTitle: '阶段 ②：当增长引擎遇到瓶颈停滞时，观察继续猛踩“增强回路油门”为何徒劳，并亲手移除右侧“调节回路的限制瓶颈”',
        mappings: [
          [
            '在遇到成长天花板时一味加大原有营销/扩招力度，体验“越用力推，系统阻力越大”',
            '当成长遇到上限而停滞时，大多数人本能的反应是更加拼命地去推动以前曾带来成功的做法，却不知道正是早期的快速成长激活了限制成长的调节回路。',
            'The harder you push, the harder the system pushes back.',
            'Senge, The Fifth Discipline Ch. 4 (1990)'
          ],
          [
            '运用第五项修炼（系统思考）找到并解除调节回路中的限制瓶颈因素',
            '破解“成长上限”的杠杆点绝不在增强回路（踩油门）那一侧，而在调节回路（松开限制刹车）那一侧——系统思考作为“第五项修炼”，正是看见整体结构而非局部碎片的艺术。',
            'Leverage lies in the balancing loop, not the reinforcing loop. To change the behavior of the system, you must identify and change the limiting factor.',
            'Senge, The Fifth Discipline Ch. 6 (1990)'
          ]
        ]
      }
    ]
  },
  {
    id: 131,
    slug: 'minest_christensen_disruption',
    title: '克莱顿·克里斯坦森 · 颠覆性创新',
    philosopher: '克莱顿·克里斯坦森',
    concept: '创新者的窘境、延续性创新（Sustaining）vs 颠覆性创新（Disruptive）、性能过剩与低端/新市场切入',
    categoryGroup: '四、政治学、传播学与组织管理（124–131）',
    tags: ['战略管理', '技术创新'],
    playSummary: '操作成熟企业与新进入者的产品性能、成本和市场选择',
    levelsSummary: '巨头听从大客户追求高毛利延续性升级（性能过剩） · 边缘低端/新市场小产品陡峭迭代完成向上颠覆',
    source: 'Christensen, The Innovator’s Dilemma: When New Technologies Cause Great Firms to Fail (1997)',
    quoteCount: 4,
    thumbType: 'pol_christensen',
    coreQuestion: '为什么那些管理最卓越、最认真倾听主流大客户意见、研发投入也最慷慨的行业霸主，却一次又一次被最初看起来粗糙简陋的小公司拉下马？',
    boundaryNote: '“颠覆性创新”在克里斯坦森理论中有严格定义：它不是指“高精尖的技术突破”，而是指从主流巨头瞧不上的低端市场或零消费新市场切入、随后沿陡峭轨迹追上的过程。',
    stages: [
      {
        id: 1,
        tabLabel: '① 延续性创新轨道与“性能过剩”陷阱',
        instructionTitle: '阶段 ①：拖动时间与研发投入滑杆，观察行业巨头在主流大客户驱动下不断向上冲刺高端性能，最终大幅超越大众真实需求（性能过剩）',
        mappings: [
          [
            '观察领先企业因为高度顺应高利润大客户的需求，把全部资源投向“延续性创新”',
            '伟大的企业之所以失败，恰恰是因为它们做对了一切：它们认真倾听核心客户的声音，并积极投资于能满足客户更高性能需求的延续性技术。',
            'Good management was the very reason they failed to stay atop their industries. Precisely because these firms listened to their customers... they lost their positions of leadership.',
            'Christensen, The Innovator’s Dilemma Introduction (1997)'
          ],
          [
            '发现企业技术进步的斜率远比普通用户实际能够消化的需求增长斜率更陡峭',
            '技术的供给进步速度往往快于市场主流客户实际能够吸收和使用的需求增长速度，从而在高端造成“性能过剩”，并在底部留出了巨大的真空。',
            'The pace of technological progress in products frequently exceeds the rate of performance improvement that mainstream customers can demand or absorb.',
            'Christensen, The Innovator’s Dilemma Ch. 1 (1997)'
          ]
        ]
      },
      {
        id: 2,
        tabLabel: '② 从低端/新市场切入的颠覆性逆袭',
        instructionTitle: '阶段 ②：操控新进入者以“初期性能虽低、但更便宜便携易用”的产品在低端扎根，随着技术快速爬升一举接管主流市场',
        mappings: [
          [
            '在主流大客户看不上、巨头嫌毛利低而主动放弃的低端/新市场建立根据地',
            '颠覆性技术最初在主流客户最看重的性能指标上往往表现得比现有产品更差，但它们更便宜、更简单、更小巧且更方便使用，因而开辟了新市场或低端立足点。',
            'Disruptive technologies bring to a market a very different value proposition than had been available previously. Generally, disruptive technologies underperform established products in mainstream markets.',
            'Christensen, The Innovator’s Dilemma p. xv (1997)'
          ],
          [
            '推进迭代曲线穿透主流需求线，完成对在位巨头的颠覆（创新者的窘境）',
            '一旦颠覆性产品在边缘市场站稳脚跟，其性能提升的斜率就会迅速跨过主流市场的需求门槛，在不知不觉中夺走原本属于在位巨头的整个主流客户群。',
            'Once the disruptive product gains a foothold in new or low-end markets, an improvement cycle begins that eventually enables it to satisfy the needs of mainstream customers.',
            'Christensen, The Innovator’s Dilemma (1997)'
          ]
        ]
      }
    ]
  },

  // ==================== 五、复杂系统、科学与跨学科思维（132–136） ====================
  {
    id: 132,
    slug: 'minest_bertalanffy_gst',
    title: '贝塔朗菲 · 一般系统论',
    philosopher: '路德维希·冯·贝塔朗菲',
    concept: '整体大于部分之和、开放系统（Open System）负熵输入、动态稳态（Fliessgleichgewicht）与等终极性',
    categoryGroup: '五、复杂系统、科学与跨学科思维（132–136）',
    tags: ['系统科学', '跨学科方法'],
    playSummary: '将系统拆成输入、过程、输出和反馈，观察子系统联系',
    levelsSummary: '孤立拆分部件（功能归零）vs 相互关联系统 · 封闭系统热寂 vs 开放系统动态稳态与等终极性（Equifinality）',
    source: 'Bertalanffy, General System Theory: Foundations, Development, Applications (1968)',
    quoteCount: 4,
    thumbType: 'sys_gst',
    coreQuestion: '为什么把一只活生命体或一家企业拆成孤立的零件研究得再透彻，也无法理解它的生命力？为什么开放系统能从不同的初始起点到达相同的稳态终点？',
    boundaryNote: '突破了经典物理仅处理“封闭孤立系统”与单向机械因果的局限，为生物学、生态学与组织科学提供了统一的同构数学语言。',
    stages: [
      {
        id: 1,
        tabLabel: '① 整体涌现与“输入—转换—输出—反馈”回路',
        instructionTitle: '阶段 ①：在画布上将散落的“输入、转换过程、输出、环境反馈”模块用管道连接成闭环，观察孤立零件如何涌现出系统整体功能',
        mappings: [
          [
            '对比孤立零件堆砌与连接耦合后的整体系统涌现',
            '系统可以定义为处于相互作用之中的若干要素的复合体；整体的行为绝不能由孤立拆开的部分之性质的简单相加来推导。',
            'A system can be defined as a complex of interacting elements. The whole is more than the sum of its parts.',
            'Bertalanffy, General System Theory Ch. 3 (1968)'
          ],
          [
            '打通环境输入、内部转换、输出与反馈闭环',
            '要理解一个有组织的整体，我们不仅必须知道它的各个组成部分，更必须知道它们之间的相互关系与耦合方式。',
            'In order to understand an organized whole we must know both the parts and the relations between them.',
            'Bertalanffy, Problems of Life (1952)'
          ]
        ]
      },
      {
        id: 2,
        tabLabel: '② 开放系统的动态稳态与“等终极性（Equifinality）”',
        instructionTitle: '阶段 ②：切换“封闭系统（熵增死寂）”与“开放系统（持续交换物质能量）”，并从不同初始状态出发验证开放系统收敛于同一稳态终点',
        mappings: [
          [
            '开启与环境的物质能量输入/输出交换，维持远离热力学平衡的动态稳态（Fliessgleichgewicht）',
            '每一个有生命的有机体在本质上都是一个开放系统：它在组成部分不断新陈代谢、持续输入与输出的流动中维持自身的动态稳态。',
            'Every living organism is essentially an open system. It maintains itself in a continuous inflow and outflow, a building up and breaking down of components.',
            'Bertalanffy, General System Theory p. 39 (1968)'
          ],
          [
            '改变初始起点参数，观察开放系统通过内部调节殊途同归地抵达同一稳态（等终极性）',
            '在封闭系统中，最终状态完全由初始条件唯一决定；而在开放系统中，我们可以从不同的初始条件出发、通过不同的途径达到完全相同的最终稳态——这就是等终极性（Equifinality）。',
            'In open systems, the same final state may be reached from different initial conditions and in different ways. This is what is called equifinality.',
            'Bertalanffy, General System Theory p. 40 (1968)'
          ]
        ]
      }
    ]
  },
  {
    id: 133,
    slug: 'minest_wiener_cybernetics',
    title: '诺伯特·维纳 · 控制论',
    philosopher: '诺伯特·维纳',
    concept: '舵手（Cybernetics）、目标设定值、传感器误差检测、负反馈纠偏与延迟过冲震荡',
    categoryGroup: '五、复杂系统、科学与跨学科思维（132–136）',
    tags: ['控制论', '自动化与信息'],
    playSummary: '操作目标值、传感器与反馈控制，观察系统稳定性',
    levelsSummary: '恒温器/自动驾驶的“目标值 vs 实测值”误差负反馈 · 正反馈失控爆炸与信号延迟引发的猎振（Hunting）',
    source: 'Wiener, Cybernetics: Or Control and Communication in the Animal and the Machine (1948)',
    quoteCount: 4,
    thumbType: 'sys_wiener',
    coreQuestion: '无论是人类伸手去拿水杯、船舶在风浪中保持航向，还是空调维持室温恒定，动物与机器用以抵抗环境随机干扰的共同底层法则是什么？',
    boundaryNote: '负反馈是维持目标稳定的核心，但如果传感器反馈存在过大“时间延迟”且矫正增益过猛，负反馈反而会退化为左右剧烈摇摆的震荡（意向性震颤）。',
    stages: [
      {
        id: 1,
        tabLabel: '① 负反馈闭环与外部扰动自动纠偏',
        instructionTitle: '阶段 ①：在画布上拖动目标温度/航向设定值（Setpoint）并点击施加外部寒流/风浪干扰，观察传感器检测误差 e = 目标 - 实测 并驱动执行器自动归位',
        mappings: [
          [
            '施加外部环境干扰，观察负反馈回路根据“实际输出与目标的误差”自动反向纠偏',
            '控制论（Cybernetics，源自希腊语“舵手”）的核心思想是：系统不仅要发出指令，还必须把实际执行的输出表现作为新的信息回传（Feedback），以此来校准下一步的行动。',
            'When we desire a motion to follow a given pattern the difference between this pattern and the actually performed motion is used as a new input to cause the part regulated to move in such a way as to bring its motion closer to that given by the pattern.',
            'Wiener, Cybernetics introduction / Ch. 4 (1948)'
          ],
          [
            '对比稳定收敛的“负反馈（抵消误差）”与发散爆表的“正反馈（放大误差）”',
            '有效的目的性行为必须依赖负反馈：它用目标与当前位置之间的差距来提供反向驱动力，从而在充满熵增噪声的环境中维持系统的秩序与稳定。',
            'All purposeful behavior may be considered to require negative feed-back.',
            'Rosenblueth, Wiener & Bigelow, Behavior, Purpose and Teleology (1943)'
          ]
        ]
      },
      {
        id: 2,
        tabLabel: '② 反馈延迟与增益过猛引发的“猎振（目的性震颤）”',
        instructionTitle: '阶段 ②：拉高反馈回路的“信号延迟（Delay）”与“矫正增益（Gain）”，观察系统在目标线上下剧烈过冲摇摆（如同小脑受损者的意向性震颤）',
        mappings: [
          [
            '拉大反馈延迟与增益，触发系统在目标值两侧反复矫枉过正的剧烈震荡',
            '如果反馈信息传递存在明显的延迟，或者控制器对误差的反应过度激烈，系统就会不断冲过目标并在反方向再次过冲，陷入剧烈的猎振（Hunting）或目的性震颤。',
            'If the feedback is improperly adjusted or delayed, the system will overshoot the mark and go into a wild oscillation.',
            'Wiener, Cybernetics Ch. 4 (1948)'
          ],
          [
            '调优阻尼与反馈增益参数，使动物神经与机器舵机恢复平滑精准的收敛',
            '小脑受损病人在伸手拿水杯时手部左右摇晃的“目的性震颤”，与设计不良的自动舵机在航道上左右画龙的机械震荡，在数学结构上是完全同构的反馈失调。',
            'The pathology of purposeful tremor in human cerebellar disease is mathematically analogous to the hunting of an over-compensated servomechanism.',
            'Wiener, Cybernetics (1948)'
          ]
        ]
      }
    ]
  },
  {
    id: 134,
    slug: 'minest_forrester_system_dynamics',
    title: '杰伊·福瑞斯特 · 系统动力学',
    philosopher: '杰伊·福瑞斯特',
    concept: '存量（Stock 浴缸水位）与流量（Flow 进排水阀门）、非线性反馈回路与供应链牛鞭效应',
    categoryGroup: '五、复杂系统、科学与跨学科思维（132–136）',
    tags: ['系统动力学', 'Top 3 优先'],
    playSummary: '构建库存、流量和反馈回路，观察系统随时间变化',
    levelsSummary: '浴缸存量（积分记忆）与进出流量（速率） · 进水下降但仍大于出水时水位继续上升的反直觉动态',
    source: 'Forrester, Industrial Dynamics (1961) / Urban Dynamics (1969) / World Dynamics (1971)',
    quoteCount: 4,
    thumbType: 'sys_forrester',
    priorityRank: 3,
    coreQuestion: '为什么当温室气体排放速率（流入量）已经开始下降时，大气中的温室气体总浓度（存量）在很长一段时间内却依然在继续上升？',
    boundaryNote: '人类直觉习惯于线性静态因果，常常把“流量（变化率）”与“存量（累积水平）”混为一谈；系统动力学通过存量—流量微分方程揭示了复杂系统的长期动态演化。',
    stages: [
      {
        id: 1,
        tabLabel: '① 存量（Stock）与流量（Flow）的浴缸积分实验',
        instructionTitle: '阶段 ①：在画布上分别拖动“流入水龙头阀门（Inflow）”与“流出排水口阀门（Outflow）”，观察存量水位 S(t) = ∫(In - Out)dt 的累积滞后行为',
        mappings: [
          [
            '调小流入阀门但保持“流入 > 流出”，观察存量水位依然继续上升（反直觉积分效应）',
            '存量（Stocks/Levels）是系统的累积与记忆；即使流入速率正在下降，只要流入量仍然大于流出量，存量水平就必然继续上升！',
            'Levels (stocks) are the integrations of flow rates over time. They represent the state or memory of the system.',
            'Forrester, Industrial Dynamics Ch. 5 (1961)'
          ],
          [
            '将流入速率精确调至等于流出速率，观察存量水位稳定在动态均衡点',
            '所有的动态行为都产生于存量（累积状态）与流量（改变存量的速率阀门）之间的相互作用。',
            'All dynamic behavior in the world occurs when flows accumulate in stocks.',
            'Forrester, Principles of Systems (1968)'
          ]
        ]
      },
      {
        id: 2,
        tabLabel: '② 时间延迟与供应链“牛鞭效应（Bullwhip Effect）”',
        instructionTitle: '阶段 ②：在存在生产与运输延迟的供应链中触发终端需求 10% 的微小波动，观察订单与库存在批发商、工厂端被逐级放大数倍的震荡',
        mappings: [
          [
            '触发终端微小需求脉冲，观察在感知延迟与交货延迟下库存先枯竭再严重积压',
            '在包含多级库存、信息反馈与交货时间延迟的工业系统中，零售端微小的需求波动会在向上游传导的过程中被逐级剧烈放大。',
            'Small disturbances in retail sales can be amplified into huge swings in factory production due to inventory policies and time delays.',
            'Forrester, Industrial Dynamics Ch. 2 (1961)'
          ],
          [
            '缩短信息反馈延迟并平滑订货策略，克服复杂社会系统的反直觉陷阱',
            '人类心智进化是为了处理简单的局部因果，但面对多重非线性反馈回路与时间延迟交织的复杂系统，直觉推出的政策往往在正确的杠杆点上用力到了完全相反的方向。',
            'The human mind is not adapted to interpreting how social systems behave. Complex systems are counterintuitive.',
            'Forrester, Counterintuitive Behavior of Social Systems (1971)'
          ]
        ]
      }
    ]
  },
  {
    id: 135,
    slug: 'minest_holland_cas',
    title: '约翰·霍兰德 · 复杂适应系统',
    philosopher: '约翰·霍兰德 / 克雷格·雷诺兹',
    concept: '适应性主体（Agents）、局部简单规则（分离、对齐、内聚）与无中央指挥的自组织群体涌现（Emergence）',
    categoryGroup: '五、复杂系统、科学与跨学科思维（132–136）',
    tags: ['复杂性科学', '涌现与自组织'],
    playSummary: '调整个体规则与环境条件，观察群体涌现行为',
    levelsSummary: '无领头鸟的鸟群（Boids）与鱼群风暴 · 仅靠局部“防撞分离、方向对齐、向心内聚”三条简单规则涌现出宏大集体智能',
    source: 'Holland, Hidden Order: How Adaptation Builds Complexity (1995) / Emergence: From Chaos to Order (1998)',
    quoteCount: 4,
    thumbType: 'sys_holland',
    coreQuestion: '成千上万只椋鸟在空中盘旋变阵、蚁群修筑精密巢穴、免疫系统抵御未知病毒，在没有任何“总司令”发号施令的情况下，宏大的整体秩序是如何从底层涌现出来的？',
    boundaryNote: '宏观涌现性质无法通过对单个个体的静态解剖来还原，但可以通过调整局部互动规则与适应性反馈在模拟中重现。',
    stages: [
      {
        id: 1,
        tabLabel: '① 局部三条简单规则 → 宏观鸟群自组织涌现',
        instructionTitle: '阶段 ①：在画布中拖动个体的“分离防撞（Separation）”“方向对齐（Alignment）”与“向心内聚（Cohesion）”权重并在画面中点击放置捕食者扰动，观察无中心鸟群的灵动避障与重聚',
        mappings: [
          [
            '开启三条纯局部邻居规则，观察杂乱粒子自发汇聚成协调流动的生命群落',
            '涌现（Emergence）的本质是“由少生多、由简入繁”：大量遵循简单局部交互规则的适应性主体，在没有中央控制者的情况下自发产生了高层次的宏观秩序。',
            'Much coming from little is the hallmark of emergence.',
            'Holland, Emergence: From Chaos to Order p. 2 (1998)'
          ],
          [
            '在画布上点击投放环境障碍或捕食者，观察群体瞬间分流绕行并重新合拢的适应力',
            '复杂适应系统（CAS）中的主体（Agents）不是被动的粒子，它们会根据与邻居及环境的互动经验不断调整自身行为策略以实现适应。',
            'As the agents adapt to each other and to the environment, the system as a whole reorganizes itself without any central executive.',
            'Holland, Hidden Order: How Adaptation Builds Complexity Ch. 1 (1995)'
          ]
        ]
      },
      {
        id: 2,
        tabLabel: '② 积木块组合（Building Blocks）与探索/利用平衡',
        instructionTitle: '阶段 ②：调节主体对新规则的“变异探索（Exploration）”与对成功经验的“择优利用（Exploitation）”，观察系统在动态环境中的演化升级',
        mappings: [
          [
            '组合经过检验的基础积木块（Building Blocks）以应对前所未见的新情境',
            '复杂适应系统通过将有限的、经过检验的“积木块（Building Blocks）”重新组合，来生成应对无限新颖环境的创新方案。',
            'Building blocks provide a way of dealing with perpetual novelty by recombining tested components.',
            'Holland, Hidden Order Ch. 1 (1995)'
          ],
          [
            '在“利用已知最优规则”与“探索未知潜在可能”之间调出黄金适应点',
            '任何适应性系统都必须在“利用（Exploitation）已证明有效的经验”与“探索（Exploration）充满不确定性的新可能性”之间保持精妙的平衡。',
            'Adaptation requires a continual trade-off between exploitation of tested rules and exploration of new possibilities.',
            'Holland, Adaptation in Natural and Artificial Systems (1975)'
          ]
        ]
      }
    ]
  },
  {
    id: 136,
    slug: 'minest_lorenz_chaos',
    title: '爱德华·洛伦兹 · 混沌理论',
    philosopher: '爱德华·洛伦兹',
    concept: '对初始条件的极端敏感依赖性（蝴蝶效应）、确定性混沌与洛伦兹双翼奇异吸引子（Strange Attractor）',
    categoryGroup: '五、复杂系统、科学与跨学科思维（132–136）',
    tags: ['非线性动力学', '混沌与复杂性'],
    playSummary: '微调初始条件，比较两条系统轨迹如何逐渐分离',
    levelsSummary: '0.506 与 0.506127 的十万分之一微差 · 确定性方程的长期不可预测性与双翼洛伦兹吸引子',
    source: 'Lorenz, Deterministic Nonperiodic Flow (1963) / Predictability: Does the Flap of a Butterfly’s Wings in Brazil Set Off a Tornado in Texas? (1972)',
    quoteCount: 4,
    thumbType: 'sys_lorenz',
    coreQuestion: '如果一个系统的运动方程是百分之百确定、没有任何随机掷骰子项的，为什么我们哪怕把初始测量精度提高到小数点后六位，也依然无法准确预测它两周后的具体状态？',
    boundaryNote: '混沌绝不等于“毫无规律的随机乱飞”：虽然单条轨迹长期不可预测，但所有轨迹都被严格约束在有限相空间的“洛伦兹奇异吸引子”几何结构之内（宏观统计特征稳定）。',
    stages: [
      {
        id: 1,
        tabLabel: '① 蝴蝶效应：初始条件 0.0001 微差的分道扬镳',
        instructionTitle: '阶段 ①：在画布上微调蓝线与橙线两条轨迹的初始差值 Δx₀（如 0.0001），观察它们最初完全重合、随后在临界时刻突然呈指数级分道扬镳',
        mappings: [
          [
            '将初始偏差调至十万分之一（0.506 vs 0.506127），观察前半段重合而下半段截然相反',
            '两个初始状态之间的差异哪怕小到超出了任何测量仪器的察觉极限，在经过有限时间的演化后，它们最终发展的状态也会变得毫无相似之处。',
            'Two states differing by imperceptible amounts may eventually evolve into two considerably different states.',
            'Lorenz, Deterministic Nonperiodic Flow, Journal of the Atmospheric Sciences 20(2), 1963'
          ],
          [
            '理解“巴西一只蝴蝶扇动翅膀，能否在得克萨斯引起一场龙卷风”的敏感依赖性',
            '由于非线性系统对初始条件的极端敏感依赖性，哪怕完全确定的动力系统，其在遥远未来的具体逐日状态也是内生不可精确预测的。',
            'If there is any error whatever in observing the present state—and in any real system such an error seems inevitable—an acceptable prediction of an instantaneous state in the distant future may well be impossible.',
            'Lorenz, JAS 20(2), 1963'
          ]
        ]
      },
      {
        id: 2,
        tabLabel: '② 混沌中的隐藏秩序：洛伦兹双翼奇异吸引子',
        instructionTitle: '阶段 ②：在三维相空间画布中拖动旋转视角与瑞利数 ρ 参数，观察永不自我重复的混沌轨迹如何编织出优雅有界的“蝴蝶双翼奇异吸引子”',
        mappings: [
          [
            '观察非周期轨迹既不发散到无穷远、也不死板重复，而是在左右双翼间无休止跃迁',
            '这些确定性非周期轨迹虽然永远不会精确地重复过去的任何一条路径，但它们全部被吸引并限制在一个精巧的有界三维曲面——洛伦兹奇异吸引子（Strange Attractor）之内。',
            'All solutions are found to be confined within a bounded region of phase space, tracing out a double-spiral surface without ever intersecting themselves.',
            'Lorenz, Deterministic Nonperiodic Flow (1963)'
          ],
          [
            '区分“短期具体天气不可长期预测”与“长期气候吸引子边界可刻画”的辩证关系',
            '混沌揭示了确定性与不可预测性的统一：单个轨迹在局部呈指数发散，但整体相空间又被折叠压缩在吸引子的宏观几何结构之中。',
            'The existence of a strange attractor means that while individual trajectories diverge locally, the global behavior remains bounded and structured.',
            'Lorenz, The Essence of Chaos (1993)'
          ]
        ]
      }
    ]
  }
];
