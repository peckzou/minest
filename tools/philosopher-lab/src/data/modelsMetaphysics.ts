import { PhilosophyModel } from '../types/philosophy';

export const MODELS_57_TO_66: PhilosophyModel[] = [
  {
    id: 57,
    slug: 'minest_parmenides',
    title: '巴门尼德 · 存在论',
    philosopher: '巴门尼德',
    concept: '存在者存在（Estin）与真理之路',
    categoryGroup: '三、形而上学与存在哲学（57–66）',
    tags: ['形而上学', '古希腊哲学', '逻辑'],
    playSummary: '在存在与变化的概念结构中切换，探索相关论证',
    levelsSummary: '① 真理之路与虚无绝路 · ② 不生不灭与不可分割 · ③ 浑圆球体 vs 意见之路',
    source: '《论自然》残篇（Burnet 英译本）',
    quoteCount: 8,
    thumbType: 'parmenides',
    coreQuestion: '为什么从“存在者存在，非存在者不存在”这一看似平淡的逻辑起点出发，竟会推出一切生成、消灭、运动和虚空都是不可能的？',
    boundaryNote: '巴门尼德用纯粹逻辑推理挑战感官经验（“意见之路”），迫使后世哲学家（如恩培多克勒、德谟克利特、柏拉图）必须正面回答“变化与多如何可能”。',
    stages: [
      {
        id: 1,
        tabLabel: '① 两条探究之路',
        instructionTitle: '① 两条探究之路 · 切换“存在之路（It is）”与“非存在之路（It is not）”，测试思想与言说能否指向“非存在”',
        choices: [
          {
            key: 'wayPath',
            label: '选择思想与探究的道路',
            defaultValue: 'way_of_truth',
            options: [
              { value: 'way_of_truth', label: '第一条路（真理之路）：存在者存在，它不可能不存在' },
              { value: 'way_of_nothing', label: '第二条路（不可思议之绝路）：非存在者存在，它必然不存在' },
              { value: 'way_of_mortals', label: '凡人双头混淆之路：把“存在”与“非存在”混为一谈' }
            ]
          }
        ],
        mappings: [
          [
            '选择“第一条路（真理之路）”并观察思想光束与存在球体严丝合缝地重合',
            '来吧，我将告诉你——你听了之后要把我的话带走——唯有哪两条探究之路是可以设想的：一条是“存在者存在，且不可能不存在”，这是确信的路径，因为真理伴随着它。',
            'Come now, I will tell thee—and do thou hearken to my saying and carry it away—the only two ways of search that can be thought of. The first, namely, that It is, and that it is impossible for anything not to be, is the way of conviction, for truth is its companion.',
            '巴门尼德《论自然》残篇 B2（Burnet 译）'
          ],
          [
            '切换到“第二条路（不可思议之绝路）”：观察思想光束指向空无时立即崩塌',
            '另一条是“非存在者存在，且必然不存在”，——我告诉你，这是一条完全不可认识的绝路；因为你既不能认识非存在者（那是做不到的），也不能把它言说出来；因为能被思维者与能存在者是同一的。',
            'The other, namely, that It is not, and that something must needs not be, — that, I tell thee, is a wholly untrustworthy path. For thou couldst not know that which is not—that is impossible—nor utter it; for it is the same thing that can be thought and that can be.',
            '巴门尼德《论自然》残篇 B2–B3'
          ]
        ]
      },
      {
        id: 2,
        tabLabel: '② 不生不灭与无变化',
        instructionTitle: '② 检验生成、消灭与虚空 · 尝试在“存在”之前添加起源、在内部切出虚空裂隙或驱动运动，观察逻辑矛盾如何阻断它们',
        choices: [
          {
            key: 'changeAttempt',
            label: '尝试对“存在者”施加的操作',
            defaultValue: 'uncreated',
            options: [
              { value: 'uncreated', label: '保持整一完满：无始无终、连续充实的存在' },
              { value: 'try_birth', label: '尝试“从无中生成”：质问它为何在此刻而非彼刻从虚无中冒出？' },
              { value: 'try_void', label: '尝试“切开虚空与运动”：若无“非存在（虚空）”，往哪里移动？' }
            ]
          }
        ],
        mappings: [
          [
            '选择“尝试从无中生成”：被充足理由与“无中不能生有”驳回',
            '它是不生不灭的；因为它是完整的、不动摇的、无终结的。它既不曾存在过，也不会将要存在，因为它现在就全体同在，是一，是连续的。你将为它寻找怎样的起源呢？它怎能、又从何处生长起来呢？我绝不允许你说或想它来自非存在者。',
            'It is uncreated and indestructible; for it is complete, immovable, and without end. Nor was it ever, nor will it be; for now it is, all at once, a continuous one.',
            '巴门尼德《论自然》残篇 B8.3–8'
          ],
          [
            '选择“尝试切开虚空与运动”：没有“非存在”的缝隙，存在处处同等充实，不可分割',
            '它也是不可分割的，因为它全体都是一样的，并没有某处更多一些存在从而阻碍它的结合，也没有某处更少一些，而是全体都充满着存在者。',
            'Nor is it divisible, since it is all alike, and there is no more of it in one place than in another, to hinder it from holding together, nor less of it, but everything is full of what is.',
            '巴门尼德《论自然》残篇 B8.22–24'
          ]
        ]
      },
      {
        id: 3,
        tabLabel: '③ 完满球体与感官幻象',
        instructionTitle: '③ 逻辑之眼 vs 感官之眼 · 调节理性逻辑锁链强度，观察多变杂乱的感官表象如何收敛为均质浑圆的存在球体',
        sliders: [
          { key: 'logicLens', label: '纯粹理性论证聚焦度（对比感官意见）', min: 0, max: 100, step: 5, defaultValue: 30, unit: '%' }
        ],
        mappings: [
          [
            '将“纯粹理性论证聚焦度”推至 80% 以上：杂乱生灭的感官幻影凝聚为从中心到各处完全均衡的球体',
            '既然有一条最外层的界限，它从每一面看来都是完满的，就像一个浑圆球体的质量，从中心向每一个方向都同样地均衡。',
            'Since, then, it has a furthest limit, it is complete on every side, like the mass of a rounded sphere, equally poised from the centre in every direction.',
            '巴门尼德《论自然》残篇 B8.42–44'
          ],
          [
            '将滑块拉回 20% 以下（感官意见之路）再拉回高位：对比习惯之眼与逻各斯裁决',
            '不要让积习迫使你沿着这条经验之路走去，在那里只凭茫然的眼睛、轰鸣的耳朵和舌头行事，而要用你的理性（Logos）去裁决由我所陈述的充满争辩的论证。',
            'Let not habit force thee to cast a wandering eye upon this devious track, or to turn thither thy, sounding ear or thy tongue; but judge by argument the much-disputed proof uttered by me.',
            '巴门尼德《论自然》残篇 B7'
          ]
        ]
      }
    ]
  },
  {
    id: 58,
    slug: 'minest_heraclitus',
    title: '赫拉克利特 · 流变思想',
    philosopher: '赫拉克利特',
    concept: '万物皆流（Panta Rhei）、对立统一与逻各斯（Logos）',
    categoryGroup: '三、形而上学与存在哲学（57–66）',
    tags: ['形而上学', '古希腊哲学'],
    playSummary: '操作不断变化的河流场景，探索变化与同一性',
    levelsSummary: '① 人不能两次踏入同一条河流 · ② 弓与竖琴的对立张力 · ③ 活火与逻各斯尺度',
    source: '《论自然》残篇（Burnet 英译本）',
    quoteCount: 8,
    thumbType: 'heraclitus',
    coreQuestion: '如果河水每一瞬都在流逝更新，为什么它仍然被称为“这条河”？没有流变与对立冲突，世界还能保持稳定吗？',
    boundaryNote: '赫拉克利特不仅主张“万物皆流”，更强调一切流变都遵循内在尺度与理性秩序——“逻各斯（Logos）”，如同按尺度燃烧、按尺度熄灭的永恒活火。',
    stages: [
      {
        id: 1,
        tabLabel: '① 踏入流变之河',
        instructionTitle: '① 两次踏入河流 · 点击“踏入河中”并调节水流更新速率，观察河水粒子在第二次踏入时已全部更替',
        sliders: [
          { key: 'flowRate', label: '河水奔流与新水涌入速率', min: 10, max: 100, step: 5, defaultValue: 65, unit: '%' }
        ],
        buttons: [
          { key: 'stepRiver', label: '👣 再次踏入这条河流', accent: 'blue' }
        ],
        mappings: [
          [
            '点击“再次踏入这条河流”至少 2 次：观察脚下水分子批次号与颜色已完全不同',
            '踏进同一条河里的人，流过他们身边的是新的水。你不能两次踏进同一条河流；因为新的水不断地流向你。',
            'apon those who step into the same rivers different and ever different waters flow down. You cannot step twice into the same rivers; for fresh waters are ever flowing in upon you.',
            '赫拉克利特残篇 B12、B91（Burnet 译）'
          ],
          [
            '调节水流速率：观察正是因为水不停流散又汇聚，“河流”才得以存在（若停止流动则干涸或变成死水塘）',
            '冷变热，热变冷，湿变干，干变湿。它散开而又聚集，它涌来而又退去。',
            'Cold things become warm, and what is warm cools; what is wet dries, and the parched is moistened. It scatters and it gathers; it advances and retires.',
            '赫拉克利特残篇 B126、B91'
          ]
        ]
      },
      {
        id: 2,
        tabLabel: '② 弓与竖琴（对立统一）',
        instructionTitle: '② 对立面的反向张力 · 调节弓身与弓弦的反向拉力，观察太松（无冲突）或太紧时的失衡，找到对立和谐点',
        sliders: [
          { key: 'bowTension', label: '弓木外撑力 vs 弓弦内拉力（反向冲突张力）', min: 0, max: 100, step: 2, defaultValue: 20, unit: '%' }
        ],
        choices: [
          {
            key: 'polarityPair',
            label: '观察的对立统一体',
            defaultValue: 'bow_lyre',
            options: [
              { value: 'bow_lyre', label: '弓与竖琴：木向内拉、弦向外绷的反向和谐' },
              { value: 'up_down', label: '山坡之路：上升的路与下降的路是同一条路' },
              { value: 'day_night', label: '昼与夜 / 饥与饱：相互转化与相互界定' }
            ]
          }
        ],
        mappings: [
          [
            '将“反向冲突张力”调节至 65%–85% 区间：弓弦绷紧，竖琴奏出和谐乐音',
            '人们不明白，那相互冲突的东西如何与自身协调一致：它是一种反向张力的和谐，就像弓和竖琴那样。',
            'Men do not know how what is at variance agrees with itself. It is an attunement of opposite tensions, like that of the bow and the lyre.',
            '赫拉克利特残篇 B51'
          ],
          [
            '切换对立统一体至“山坡之路”与“昼与夜”：体验同一事物在不同方向上的统一',
            '上升的路和下降的路是同一条路。正是疾病使健康成为甜美，正是饥饿使饱足、劳碌使安息成为美好。',
            'The way up and the way down is one and the same. It is sickness that makes health pleasant; evil, good; hunger, plenty; weariness, rest.',
            '赫拉克利特残篇 B60、B111'
          ]
        ]
      },
      {
        id: 3,
        tabLabel: '③ 永恒活火与逻各斯（Logos）',
        instructionTitle: '③ 按尺度燃烧的活火 · 调节“火—海（水）—土”的转化循环尺度（Metra），观察流变背后的恒常逻各斯定律',
        sliders: [
          { key: 'measureBalance', label: '逻各斯尺度守恒度 (Logos Measure)', min: 0, max: 100, step: 5, defaultValue: 50, unit: '%' }
        ],
        mappings: [
          [
            '将“逻各斯尺度守恒度”调至 80% 以上：火化为海、海化为土又按严格比例返还为火，宇宙动态守恒',
            '这个万物共同的世界，既不是任何神也不是任何人所创造的；它过去、现在、未来永远是一团永恒的活火，按照一定的尺度燃烧，按照一定的尺度熄灭。',
            'This world, which is the same for all, no one of gods or men has made; but it was ever, is now, and ever shall be an ever-living Fire, with measures of it kindling, and measures going out.',
            '赫拉克利特残篇 B30'
          ],
          [
            '观察火焰与万物如同黄金与商品般按固定比率双向兑换',
            '万物都换成火，火也换成万物，正像货物换成黄金，黄金换成货物一样。',
            'All things are an exchange for Fire, and Fire for all things, even as wares for gold and gold for wares.',
            '赫拉克利特残篇 B90'
          ]
        ]
      }
    ]
  },
  {
    id: 59,
    slug: 'minest_democritus',
    title: '德谟克利特 · 原子论',
    philosopher: '留基伯 / 德谟克利特',
    concept: '原子（Atoma）与虚空（Kenon）',
    categoryGroup: '三、形而上学与存在哲学（57–66）',
    tags: ['形而上学', '古希腊哲学', '科学哲学'],
    playSummary: '组合、拆分基本粒子，观察不同排列形成的物体',
    levelsSummary: '① 分割的终点（不可分之原子） · ② 形状、次序与姿态（A/N/Z） · ③ 约定俗成的感官性质',
    source: '古希腊原子论残篇（亚里士多德《形而上学》A.4、塞克斯都引德谟克利特残篇 B9）',
    quoteCount: 8,
    thumbType: 'democritus',
    coreQuestion: '如果基本粒子本身没有颜色、没有甜苦、也不生不灭，那么万紫千红、有生有死的宏观世界是怎么拼出来的？',
    boundaryNote: '古希腊原子论是为回应巴门尼德“存在不生不灭”而提出的哲学假说：每个原子都具备巴门尼德“存在”的充实不灭，而承认“虚空（非存在）”则解释了运动与组合。',
    stages: [
      {
        id: 1,
        tabLabel: '① 原子与虚空',
        instructionTitle: '① 拆分宏观物体直至不可再分的“原子（Atomon）” · 调节分割层级与虚空间距，观察组合与拆散',
        sliders: [
          { key: 'cutLevel', label: '物质拆分与聚合深度', min: 0, max: 100, step: 5, defaultValue: 30, unit: '%' },
          { key: 'voidSpace', label: '虚空（Kenon）容许度', min: 0, max: 100, step: 5, defaultValue: 60, unit: '%' }
        ],
        mappings: [
          [
            '将“物质拆分深度”推至 90% 以上：宏观物体拆解为不可再切分的坚实基本微粒（原子），但微粒本身不湮灭',
            '万物之本原是原子与虚空……原子在大小和数量上是无限的，它们在全宇宙中旋转运动，由此生成一切复合体——火、水、气、土；因为这些其实都是某些原子的集合体，而原子本身由于坚固充实，是不受作用的、不可改变的。',
            'The first principles of the universe are atoms and empty space... The atoms are unlimited in size and number, and they are borne along in the whole universe in a vortex, and thereby generate all composite things.',
            '第欧根尼·拉尔修《名哲言行录》IX.44（德谟克利特学说概述）'
          ],
          [
            '将“虚空容许度”先降到 0%（原子卡死无法运动）再调回 60% 以上（原子在虚空中自由碰撞结合）',
            '留基伯和他的同伴德谟克利特说，充实与空虚是元素，他们把前者称为“存在”，把后者称为“非存在”……而且他们说“存在”并不比“非存在”更实在，因为虚空不亚于物体。',
            'Leucippus and his associate Democritus say that the full and the empty are the elements, calling the one being and the other non-being.',
            '亚里士多德《形而上学》第 1 卷第 4 章 985b4'
          ]
        ]
      },
      {
        id: 2,
        tabLabel: '② 形状、次序与方向（A、N、Z）',
        instructionTitle: '② 亚里士多德字母比喻 · 切换原子的“形状（A vs N）”“排列次序（AN vs NA）”与“转向姿态（Z vs N）”，观察生成的宏观物质变化',
        choices: [
          {
            key: 'atomConfig',
            label: '原子的几何差异与组合方式',
            defaultValue: 'shape_AN',
            options: [
              { value: 'shape_AN', label: '① 形状（Rhythmos）不同：如字母 A 与 N，钩状原子结成固体，圆滑原子流成水火' },
              { value: 'order_ANNA', label: '② 排列次序（Diathesis）不同：同样两个原子，排成 AN 与排成 NA 构成不同复合物' },
              { value: 'pose_ZN', label: '③ 转向姿态（Trope）不同：同一个字母 Z 旋转 90° 即变为 N' }
            ]
          }
        ],
        mappings: [
          [
            '依次切换“① 形状不同”“② 排列次序不同”与“③ 转向姿态不同”三种模式',
            '他们说，原子之间的差异只有三种：形状、次序和位置（姿态）。因为A与N在形状上不同，AN与NA在次序上不同，Z与N在位置姿态上不同。',
            'For they say the things that exist differ only in "rhythm", "inter-contact", and "turning"... for A differs from N in shape, AN from NA in arrangement, and Z from N in position.',
            '亚里士多德《形而上学》第 1 卷第 4 章 985b13'
          ],
          [
            '观察画布中同一种基本字母粒子通过不同排列组合拼出悲剧与喜剧般的千变万化',
            '悲剧和喜剧都是由同样的字母写成的，只是字母的组合排列方式不同；同样，世间万物的生成、毁灭与质变，也不过是原子在虚空中的结合、分离与重排。',
            'Tragedy and comedy are both composed of the same letters.',
            '亚里士多德《论生灭》I.2, 315b14'
          ]
        ]
      },
      {
        id: 3,
        tabLabel: '③ 约定俗成的感官性质',
        instructionTitle: '③ 约定与真实 · 切换“人类感官视角（甜苦/冷热/颜色）”与“实在底层视角（圆滑/带刺原子与虚空）”',
        choices: [
          {
            key: 'realityView',
            label: '观察甜蜂蜜与苦艾草的视角',
            defaultValue: 'sensory_nomos',
            options: [
              { value: 'sensory_nomos', label: '日常感官视角（Nomos 约定）：蜂蜜是甜的、金黄的；艾草是苦的、墨绿的' },
              { value: 'atomic_etei', label: '本体实在视角（Etei 真实）：唯有圆润原子、带棱角原子与虚空' }
            ]
          }
        ],
        mappings: [
          [
            '从“日常感官视角”切换到“本体实在视角”：一切颜色与味道褪去，显露原子几何构型与感官的碰撞',
            '按照约定俗成有甜，按照约定俗成有苦，按照约定俗成有热，按照约定俗成有冷，按照约定俗成有颜色；但实际上，只有原子和虚空。',
            'By convention sweet is sweet, by convention bitter is bitter, by convention hot is hot, by convention cold is cold, by convention color is color; but in reality there are only atoms and the void.',
            '德谟克利特残篇 B9（塞克斯都·恩披里柯《反数学家》VII.135 引）'
          ],
          [
            '对比圆润原子（产生甜觉）与尖锐多棱原子（撕扯舌头产生苦辣感）的微观碰撞',
            '甜味是由圆润且大小适中的原子产生的，它们轻柔地滑过感官；而酸苦涩味则是由粗糙、多角、带钩的原子撕扯感官所造成的。',
            'Sweet consists of round and not too small atoms; bitter and astringent of sharp, angular and hooked atoms.',
            '泰奥弗拉斯托斯《论感官》§65–66 转述德谟克利特'
          ]
        ]
      }
    ]
  },
  {
    id: 60,
    slug: 'minest_aquinas',
    title: '阿奎那 · 本质与存在',
    philosopher: '托马斯·阿奎那',
    concept: '本质（Essentia / Quidditas）与存在（Esse）的实在区分',
    categoryGroup: '三、形而上学与存在哲学（57–66）',
    tags: ['形而上学', '中世纪哲学'],
    playSummary: '将对象的本质描述与实际存在分开展示',
    levelsSummary: '① 凤凰与人（懂其本质却不知其是否存在） · ② 潜能本质接受现实存在 · ③ 本质即存在的必然存在者',
    source: '《论存在者与本质》（De Ente et Essentia，据 SEP《Thomas Aquinas》转引）',
    quoteCount: 8,
    thumbType: 'aquinas',
    coreQuestion: '为什么你可以完整理解“人是什么”或“不死火凤凰是什么”（它们的本质定义），却依然不知道世界上此刻究竟有没有一只火凤凰实际存在？',
    boundaryNote: '阿奎那将亚里士多德的“潜能与现实”推进到“本质（Essentia）与存在行动（Esse）”层面：在一切受造有限物中，本质与存在都是截然不同的两个构成原则。',
    stages: [
      {
        id: 1,
        tabLabel: '① 凤凰思想实验（本质 ≠ 存在）',
        instructionTitle: '① 凤凰论证 · 查看“人”与“火凤凰（Phoenix）”的完整本质蓝图，再单独切换它们在现实世界中的“存在开关（Esse）”',
        choices: [
          {
            key: 'entitySelect',
            label: '考察对象的本质定义（Quidditas）',
            defaultValue: 'phoenix',
            options: [
              { value: 'phoenix', label: '火凤凰（Phoenix）：本质 = “五百年浴火重生的神秘飞鸟”' },
              { value: 'human', label: '人（Homo）：本质 = “有理性的动物（质料躯体 + 理性灵魂）”' },
              { value: 'triangle', label: '三角形：本质 = “三边围成的平面封闭图形”（必含内角和 180°）' }
            ]
          },
          {
            key: 'esseSwitch',
            label: '现实世界中的存在行动（Esse）',
            defaultValue: 'absent',
            options: [
              { value: 'absent', label: '仅在理智中被理解（不具有现实存在 Esse）' },
              { value: 'present', label: '在现实自然界中实际存在（被赋予 Esse）' }
            ]
          }
        ],
        mappings: [
          [
            '选择“火凤凰”并保持“不具有现实存在”：观察理智可以完整把握凤凰的本质定义，而无需包含它的实际存在',
            '凡是不属于“本质（是什么）”概念之内的东西，都是从外部附加上来并与本质构成复合的……而我可以理解“人是什么”或“凤凰是什么”，却全然不知它在自然界中究竟是否存在。',
            'Every essence or quiddity can be understood without anything being known about its existing; for I can understand what a man or a phoenix is, and yet not know whether it has existence in the nature of things.',
            '阿奎那《论存在者与本质》第 4 章（De Ente et Essentia c.4）'
          ],
          [
            '对比“三角形（本质必然包含三内角）”与“火凤凰（本质不包含存在）”：证明存在不是本质的一部分',
            '如果没有某个属性就不能理解某物的本质，那么该属性就属于其本质；但既然离开“是否存在”我们仍能理解“是什么”，可见在有限事物中，存在（Esse）与本质（Essentia）是截然有别的。',
            'Therefore, it is clear that existence (esse) is other than essence or quiddity.',
            '阿奎那《论存在者与本质》第 4 章'
          ]
        ]
      },
      {
        id: 2,
        tabLabel: '② 本质作为潜能，存在作为现实',
        instructionTitle: '② 潜能（Potentia）与现实（Actus） · 调节“存在之光（Actus Essendi）”注入“本质容器”的程度，观察本质如何限制并接收存在',
        sliders: [
          { key: 'esseInfusion', label: '存在行动（Actus Essendi）的注入度', min: 0, max: 100, step: 5, defaultValue: 20, unit: '%' }
        ],
        choices: [
          {
            key: 'vesselSize',
            label: '本质容器的等级（决定能接收多少存在完满性）',
            defaultValue: 'stone',
            options: [
              { value: 'stone', label: '矿石的本质：仅能以无生命物质的方式接收存在' },
              { value: 'tree', label: '橡树的本质：能以生长与生命的方式接收存在' },
              { value: 'rational', label: '理性存在者的本质：能以理智与自由意志的方式接收存在' }
            ]
          }
        ],
        mappings: [
          [
            '将“存在行动（Actus Essendi）的注入度”从 20% 推至 90% 以上：使处在可能状态中的本质化为现实存在者',
            '“存在（Esse）”本身是一切事物现实性中的最根本现实（Actus），甚至是一切形式之所以为现实的原因；而本质相对于存在而言，正如潜能之于现实。',
            'Existence (esse) is the actuality of all acts, and even of forms themselves; essence is related to existence as potency to act.',
            '阿奎那《神学大全》I, q. 3–4（据 SEP《Thomas Aquinas》§5.2 转引）'
          ],
          [
            '切换不同“本质容器的等级”（矿石、橡树、理性存在者）：观察存在受其所进入的本质容器限制',
            '未被接收的存在是无限的，但当它被接收进某一种特定的本质之中时，它就按照该接收者本质的容量而受到限定（如同阳光受不同颜色玻璃窗的限定）。',
            'An act is limited only by the potency which receives it.',
            '据 SEP《Thomas Aquinas》§5.2'
          ]
        ]
      },
      {
        id: 3,
        tabLabel: '③ 偶然受造物 vs 自存之存在本身',
        instructionTitle: '③ 从他物获得存在 vs 本质即存在 · 追踪有限物“借来的存在链条”，直至源头“自存的存在本身（Ipsum Esse Subsistens）”',
        sliders: [
          { key: 'sourceLink', label: '第一因（自存之存在）对存在链条的持续维系', min: 0, max: 100, step: 5, defaultValue: 85, unit: '%' }
        ],
        mappings: [
          [
            '观察链条中的有限事物：由于它们的本质不等于存在，它们的存在只能从外部原因获得',
            '凡是一物的存在不同于其本质的，它的存在必定来自他物；因为没有任何东西能仅仅凭借自身本质就成为自身存在的原因（否则它就必须在存在之前先存在，这是荒谬的）。',
            'Everything whose existence is distinct from its nature must have its existence from another.',
            '阿奎那《论存在者与本质》第 4 章'
          ],
          [
            '将“第一因的持续维系”调至 0% 再恢复至 90%：体会一切借来的存在都必须回溯到“本质即存在”的唯一源头',
            '既然一切凭借他物而存在的东西都必须回溯到那凭借自身而存在的第一因，那么必定存在某个事物，其本质就是它的存在本身（Ipsum Esse Subsistens），它是万物的第一因。',
            'There must be some thing which is the cause of existing for all other things, because it is pure existence itself (ipsum esse tantum).',
            '阿奎那《论存在者与本质》第 4 章'
          ]
        ]
      }
    ]
  },
  {
    id: 61,
    slug: 'minest_berkeley',
    title: '伯克莱 · 唯心主义',
    philosopher: '乔治·伯克莱',
    concept: '存在就是被感知（Esse est Percipi）与非物质主义',
    categoryGroup: '三、形而上学与存在哲学（57–66）',
    tags: ['形而上学', '认识论'],
    playSummary: '切换感知主体与对象的呈现状态',
    levelsSummary: '① 第一性质与第二性质不可分 · ② 存在即被感知（切掉“物质基质”） · ③ 无人注视之树与永恒心灵',
    source: '《人类知识原理》《希勒斯与菲洛诺斯三对话》（1710/1713 原版英文本）',
    quoteCount: 8,
    thumbType: 'berkeley',
    coreQuestion: '既然我们直接接触到的永远只有颜色、冷热、软硬、形状等感官观念，那么躲在一切感知背后、既不可见也不可触的“物质实体”到底是什么？',
    boundaryNote: '伯克莱并非认为“我一闭眼桌子就凭空消失了”：他认为可感事物是观念的集合，当有限人类心灵未注视它时，它仍在无限心灵（上帝）的永恒感知与法则中持存。',
    stages: [
      {
        id: 1,
        tabLabel: '① 苹果是一束可感观念',
        instructionTitle: '① 拆解“苹果” · 依次剥离红润颜色、香甜气味、冷热触感与大小形状，看看剥除一切可感观念后是否还剩下一个“不可感知的物质外壳”',
        sliders: [
          { key: 'stripQualities', label: '剥离可感性质（颜色→味道→冷热→形状广延）', min: 0, max: 100, step: 25, defaultValue: 0, unit: '%' }
        ],
        mappings: [
          [
            '将“剥离可感性质”逐步推到 50% 再到 100%：发现第一性质（形状大小）同样随感知距离与视角变化，无法脱离感知独立存在',
            '比如我们看见某种颜色、尝到某种味道、闻到某种气味、摸到某种形状和硬度，发现它们总是相伴出现，于是就用“苹果”这个名称来标记这束观念的集合。',
            'A certain colour, taste, smell, figure and consistence having been observed to go together, are accounted one distinct thing, signified by the name apple.',
            '伯克莱《人类知识原理》第 1 节'
          ],
          [
            '当剥离度达到 100% 时：画布中央所谓的“脱去一切性质的物质基质”变成纯粹的空无与自相矛盾',
            '广延、形状和运动既然只是存在于心灵中的观念，而一个观念只能与另一个观念相似，因此它们根本不可能存在于任何“无感知的物质实体”之中。',
            'Extension, figure, and motion, abstracted from all other qualities, are inconceivable. Where therefore the other sensible qualities are, there must these be also, to wit, in the mind and nowhere else.',
            '伯克莱《人类知识原理》第 10 节'
          ]
        ]
      },
      {
        id: 2,
        tabLabel: '② 存在就是被感知（Esse est Percipi）',
        instructionTitle: '② 存在即被感知 · 切换感知主体（Percipere）与可感对象（Percipi），尝试构造“一个既不被任何人感知、也不被任何心灵思考的可感对象”',
        choices: [
          {
            key: 'perceiveMode',
            label: '心灵与对象的关系状态',
            defaultValue: 'active_mind',
            options: [
              { value: 'active_mind', label: '心灵正在感知：书斋中的桌子通过视觉与触觉呈现（存在）' },
              { value: 'try_unperceived', label: '主脑悖论测试：尝试“在自己心里想象一棵没有任何人想象或感知的树”' }
            ]
          }
        ],
        mappings: [
          [
            '观察“心灵正在感知”状态：可感物（Esse est Percipi）与感知主体（Esse est Percipere）相依显现',
            '关于一切不思维的物体，它们的“存在”就是“被感知”（Their esse is percipi），因此它们绝不可能脱离感知它们的心灵或能思维的东西而存在。',
            'Their esse is percipi, nor is it possible they should have any existence, out of the minds or thinking things which perceive them.',
            '伯克莱《人类知识原理》第 3 节'
          ],
          [
            '切换到“主脑悖论测试：尝试在心里想象一棵无人想象的树”：发现在你想象它的瞬间，它恰恰正在被你自己的心灵所感知！',
            '你说没有什么比想象比如一些树木在公园里、却没有任何人在旁边感知它们更容易的事了……但你忘了，当你在心里想象或构思它们的时候，不正是你自己正在感知或思考它们吗？',
            'But what is all this, I beseech you, more than framing in your mind certain ideas which you call books and trees, and at the same time omitting to frame the idea of any one that may perceive them? But do not you yourself perceive or think of them all the while?',
            '伯克莱《人类知识原理》第 23 节（Master Argument）'
          ]
        ]
      },
      {
        id: 3,
        tabLabel: '③ 庭院之树与普遍心灵',
        instructionTitle: '③ 当所有人类都闭上眼睛 · 切换“学者甲注视”“友人乙注视”与“所有人类离开庭院”，观察无限心灵如何维持自然秩序的连续性',
        choices: [
          {
            key: 'observerState',
            label: '庭院中橡树的感知者状态',
            defaultValue: 'human_eyes',
            options: [
              { value: 'human_eyes', label: '学者与友人在庭院中：有限心灵正在直接感知橡树' },
              { value: 'humans_close', label: '所有人类闭眼离开（无神唯我论假设）：树木瞬间闪灭消失' },
              { value: 'infinite_mind', label: '伯克莱体系：人类离开时，永恒无限的心灵（God）仍在持续感知万物' }
            ]
          }
        ],
        mappings: [
          [
            '在“所有人类闭眼离开”与“伯克莱体系：永恒无限的心灵持续感知”之间切换',
            '当我在书房里时，我所写的书桌存在着，因为我看见并摸到它；如果我走出书房，我说它仍然存在，意思是如果我在书房里我就能感知它，或者有别的某一个精神（直至无所不在的永恒精神）正在感知它。',
            'The table I write on, I say, exists, that is, I see and feel it; and if I were out of my study I should say it existed, meaning thereby that if I was in my study I might perceive it, or that some other spirit actually does perceive it.',
            '伯克莱《人类知识原理》第 3 节'
          ],
          [
            '观察无限心灵按照恒常稳固的“自然法则”向人类心灵印刻鲜明有序的感觉观念（区别于胡思乱想的白日梦）',
            '感官所感知的观念并不依赖于我自己的意志（当我白昼睁开眼时，看与不看什么并不由我随心所欲决定），它们是由一个比我们更强大的精神按照既定规则（自然法则）印刻在我们心灵上的，这就是真实物与梦境幻觉的根本区别。',
            'The ideas imprinted on the senses by the Author of nature are called real things: and those excited in the imagination being less regular, vivid and constant, are more properly termed ideas, or images of things.',
            '伯克莱《人类知识原理》第 33 节'
          ]
        ]
      }
    ]
  },
  {
    id: 62,
    slug: 'minest_merleau_ponty',
    title: '梅洛-庞蒂 · 身体知觉',
    philosopher: '莫里斯·梅洛-庞蒂',
    concept: '身体主体（Corps-Sujet）、身体图式与触摸的双重感觉',
    categoryGroup: '三、形而上学与存在哲学（57–66）',
    tags: ['形而上学', '认识论', '现象学'],
    playSummary: '改变身体位置、动作和观察角度，体验具身知觉',
    levelsSummary: '① 环绕走动与最佳观察距离 · ② 盲人手杖与身体图式延伸 · ③ 左手摸右手（能触与所触的交织）',
    source: '《知觉现象学》（据 SEP《Maurice Merleau-Ponty》转引）',
    quoteCount: 8,
    thumbType: 'merleau',
    coreQuestion: '我们的身体仅仅是一台被大脑心灵操纵的“外在物理机器”，还是我们得以拥有一个世界的“知觉主体本身”？',
    boundaryNote: '梅洛-庞蒂打破了笛卡尔“纯粹意识主体（我思）”与“机械广延物体”的二元对立，指出原始意识不是“我思故我在（I think）”，而是具身的“我能（I can）”。',
    stages: [
      {
        id: 1,
        tabLabel: '① 具身视角与最佳握持（Optimal Grip）',
        instructionTitle: '① 身体运动与知觉场的生成 · 移动你的身体与画布中画作/雕塑的距离和角度，寻找具身知觉的“最佳距离（Maximum Grip）”',
        sliders: [
          { key: 'bodyDist', label: '身体与观赏画作的距离', min: 5, max: 100, step: 5, defaultValue: 15, unit: ' 步' },
          { key: 'bodyAngle', label: '身体环绕观察角度', min: -60, max: 60, step: 5, defaultValue: 40, unit: '°' }
        ],
        mappings: [
          [
            '体验距离太近（< 20 步，只见粗糙笔触）或太远（> 80 步，模糊不清），再调节到最佳距离（40–60 步）与正视角（-15° 至 +15°）',
            '对于每一件观赏物，都有一个最佳的距离和方向；若靠得太近或离得太远，我们都会感到一种具身的不适（失衡），身体会自动调整姿势去寻求对世界最清晰的“最佳把握”。',
            'For each object, as for each picture in an art gallery, there is an optimum distance from which it requires to be seen, a direction viewed from which it vouchsafes most of itself.',
            '据 SEP《Maurice Merleau-Ponty》§3（《知觉现象学》）'
          ],
          [
            '环绕改变“身体环绕观察角度”：观察事物的正面与背面只有在身体能够绕行运动的视野中才共同构成一个立体物',
            '身体是我们拥有一个世界的一般媒介；原始的意向性首先不是“我思（I think that）”，而是具身运动性的“我能（I can）”。',
            'Consciousness is in the first place not a matter of "I think that" but of "I can".',
            '据 SEP《Maurice Merleau-Ponty》§3（Phénoménologie de la perception）'
          ]
        ]
      },
      {
        id: 2,
        tabLabel: '② 盲人手杖与身体图式延伸',
        instructionTitle: '② 习惯与身体图式（Body Schema） · 增加盲人对手杖（或司机对汽车、打字员对键盘）的熟练融合度，观察知觉边界从手心延伸至杖尖',
        sliders: [
          { key: 'habitSkill', label: '手杖融入身体习惯（Habit）的程度', min: 0, max: 100, step: 5, defaultValue: 10, unit: '%' }
        ],
        mappings: [
          [
            '当熟练度较低（< 30%）时：手掌只感觉到木棍顶端的机械压力，还需用脑推算地面有多远',
            '在尚未养成习惯之前，手杖只是一个需要被外部测算的客体；手掌感受到的只是木柄对皮肤的冲击，然后再借此去推理前方障碍物的位置。',
            'At first the stick is an external instrument whose pressures on the hand must be interpreted.',
            '据 SEP《Maurice Merleau-Ponty》§3'
          ],
          [
            '将“手杖融入身体习惯的程度”推至 80% 以上：手杖变为透明的身体延伸，知觉焦点直接跃迁到杖尖触碰的地面纹理',
            '一旦手杖成为熟悉的习惯工具，对它的压力推算就消失了；手杖不再是被盲人感知的客体，而变成了他用来感知的工具——他的身体图式扩张了，他的触觉直接延伸到了手杖的尖端。',
            'The blind man’s stick has ceased to be an object for him, and is no longer perceived for itself; its point has become an area of sensitivity, extending the scope and active radius of touch.',
            '据 SEP《Maurice Merleau-Ponty》§3（《知觉现象学》）'
          ]
        ]
      },
      {
        id: 3,
        tabLabel: '③ 左手触摸右手（可逆性与交织）',
        instructionTitle: '③ 双手互触与“肉身（Flesh）” · 让你的右手去触摸正在摸东西的左手，并在“能触主体”与“被触客体”之间切换注意力',
        choices: [
          {
            key: 'touchFocus',
            label: '右手触摸左手时的知觉焦点切换',
            defaultValue: 'right_touching',
            options: [
              { value: 'right_touching', label: '焦点在右手：右手是主动探索的“能触主体”，左手是被摸到的有形“客体”' },
              { value: 'left_reversing', label: '焦点翻转到左手：左手瞬间变为“能触主体”，反过来把右手感知为“被触客体”' },
              { value: 'chiasm_gap', label: '可逆性裂隙（Écart）：能触与被触永远即将重合，却又在重合瞬间发生角色翻转' }
            ]
          }
        ],
        mappings: [
          [
            '在“焦点在右手”与“焦点翻转到左手”之间切换：体验身体既在世界中、又是感知世界的主体',
            '当我的右手触摸我的左手时，我体验到一种奇妙的双重感觉：被摸的左手绝不只是像一块木头那样的纯粹客体，它随时能翻转过来，变成主动触摸右手的主体。',
            'When my right hand touches my left hand while it is palpating the things, the "touching subject" passes over to the rank of the touched, descends into the things.',
            '据 SEP《Maurice Merleau-Ponty》§4（《可见的与不可见的》）'
          ],
          [
            '切换到“可逆性裂隙（Écart）”：观察能触与被触如同电流切换般永不完全坍缩为同一状态',
            '只有因为我自己本身就是可被触摸的、属于这个可见可触的世界之“肉身（Flesh）”，我才能去触摸和看见世界；但能触与被触之间始终保留着一丝可逆的裂隙（hiatus），永不彻底完全重合。',
            'He who sees cannot possess the visible unless he is possessed by it, unless he is of it.',
            '据 SEP《Maurice Merleau-Ponty》§4（Le Visible et l’invisible）'
          ]
        ]
      }
    ]
  },
  {
    id: 63,
    slug: 'minest_levinas',
    title: '列维纳斯 · 他者伦理',
    philosopher: '伊曼纽尔·列维纳斯',
    concept: '他者的面容（The Face of the Other）、总体与无限、不对称责任',
    categoryGroup: '三、形而上学与存在哲学（57–66）',
    tags: ['伦理学', '形而上学', '现象学'],
    playSummary: '在面对他人的情境中探索责任与伦理回应',
    levelsSummary: '① 同一（The Same）的总体化吞噬 · ② 他者面容（Visage）的伦理呼唤 · ③ 不对称的无限责任',
    source: '《总体与无限》《伦理与无限》（据 SEP《Emmanuel Levinas》转引）',
    quoteCount: 8,
    thumbType: 'levinas',
    coreQuestion: '为什么西方哲学总想把一切陌生的“他者”都装进“我”的概念框架里去理解？当我们面对另一个人脆弱赤裸的“面容”时，究竟发生了什么？',
    boundaryNote: '列维纳斯提出“伦理学是第一哲学”（先于存在论）：他者的“面容（Face）”不是五官长相的视觉照片，而是突破一切概念标签、直接向我发出“不可杀人”与“为我负责”的伦理召唤。',
    stages: [
      {
        id: 1,
        tabLabel: '① 总体（Totality）与概念吞噬',
        instructionTitle: '① 同一对异己的吸纳 · 尝试用自我的概念网格去框住自然物与“他者（The Other）”，观察他者如何溢出一切概念范畴',
        sliders: [
          { key: 'totalizingNet', label: '自我（The Same）的概念分类与占有网扩张度', min: 10, max: 100, step: 5, defaultValue: 60, unit: '%' }
        ],
        choices: [
          {
            key: 'encounterTarget',
            label: '自我面对的对象',
            defaultValue: 'objects',
            options: [
              { value: 'objects', label: '世内事物（食物、工具、景观）：可被我消化、使用与概念化收编' },
              { value: 'the_other', label: '绝对他者（Autrui）：带着不可还原之无限性的另一个人' }
            ]
          }
        ],
        mappings: [
          [
            '在“世内事物”下扩张概念占有网，再切换到“绝对他者”：观察概念网格在触及他者时破裂，他者始终溢出“同一”的总体',
            '西方存在论传统往往是一种“自我学”，它试图把一切异己的“他者”都还原、消化进“同一（The Same）”的概念总体之中；然而真正的他者绝不能被我的概念范畴所穷尽或占有。',
            'Western philosophy has most often been an ontology: a reduction of the other to the same, by interposition of a middle and neutral term that ensures the comprehension of being.',
            '据 SEP《Emmanuel Levinas》§2（Totality and Infinity）'
          ],
          [
            '观察他者突破网格发出的“无限（Infinity）”光芒',
            '当某种东西溢出了试图包含它的观念——即当“无限”在有限的自我面前显现，抗拒一切总体化收编时，那便是与他者的真正相遇。',
            'The idea of infinity is produced in the opposition of conversation, in sociality. The Other remains infinitely transcendent, infinitely foreign.',
            '据 SEP《Emmanuel Levinas》§2'
          ]
        ]
      },
      {
        id: 2,
        tabLabel: '② 他者的面容（The Face / Visage）',
        instructionTitle: '② 面容的显现 · 在“把对方当成社会角色/外貌标签来审视”与“直面赤裸脆弱的面容呼唤”之间切换',
        choices: [
          {
            key: 'gazeMode',
            label: '面对他人的方式',
            defaultValue: 'photo_label',
            options: [
              { value: 'photo_label', label: '对象化审视：打量对方眼睛颜色、鼻梁轮廓、社会身份与利用价值' },
              { value: 'ethical_face', label: '直面“面容（Visage）”：卸下一道道标签，听见脆弱而崇高的律令“你不可杀”' },
              { value: 'say_me_voici', label: '伦理回应：“我在这里（Me voici / Here I am）”——向他者敞开并承担责任' }
            ]
          }
        ],
        mappings: [
          [
            '从“对象化审视”切换到“直面面容（Visage）”：外貌属性标签退去，显露无防备的脆弱性与神圣禁令',
            '当你专门注意到某人眼睛是什么颜色时，你其实并没有在关联他的“面容”；面容不是一张被观看的图像，它是毫无防备的赤裸与脆弱，同时却以崇高的权威向我发出第一道伦理言说：“你不可杀人。”',
            'The best way of encountering the Other is not even to notice the color of his eyes! When one observes the color of the eyes one is not in social relationship with the Other... The face is exposed, menaced, as if inviting us to an act of violence. At the same time, the face is what forbids us to kill.',
            '据 SEP《Emmanuel Levinas》§2.2（Ethics and Infinity）'
          ],
          [
            '切换到“伦理回应：我在这里（Me voici）”：建立先于存在论的伦理主体性',
            '面容在言说；在质问我、召唤我之前，我甚至还不是一个真正的道德主体。我对他者的回应不是一句抽象的知识判断，而是“我在这里（Me voici）”的担当。',
            'The face speaks. The manifestation of the face is already discourse.',
            '据 SEP《Emmanuel Levinas》§2.2'
          ]
        ]
      },
      {
        id: 3,
        tabLabel: '③ 不对称的伦理责任',
        instructionTitle: '③ 不对称责任 vs 互惠算计 · 调节“计较对方是否回报我（对称契约）”与“无条件先行承担（不对称伦理）”，并引入“第三方（正义）”',
        choices: [
          {
            key: 'asymMode',
            label: '责任关系的结构',
            defaultValue: 'reciprocal_calc',
            options: [
              { value: 'reciprocal_calc', label: '商业互惠算计：“只有你先对我负多少责，我才对等还你多少”' },
              { value: 'asymmetric_resp', label: '列维纳斯不对称性：“我对他者负有无限责任，且绝不要求他对我对等偿还”' },
              { value: 'third_party', label: '第三方的出现（Le Tiers）：当有多个他者同时在场，无限关怀必须借助公正比较与法律制度' }
            ]
          }
        ],
        mappings: [
          [
            '从“商业互惠算计”切换到“列维纳斯不对称性”：观察指向他者的责任矢量始终大于一切自我索取',
            '我与他者之间的伦理关系在本质上是不对称的：我对他者负有责任，甚至对他的责任本身也负有责任，而至于他是否同样对我负责，那是他的事，不是我可以用来讨价还价的条件。',
            'I am responsible for the Other without waiting for reciprocity, were I to die for it. Reciprocity is his affair.',
            '据 SEP《Emmanuel Levinas》§2.3（Ethics and Infinity）'
          ],
          [
            '切换到“第三方的出现（Le Tiers）”：理解为什么纯粹不对称的二人伦理需要发展出社会正义与政治制度',
            '如果世界上只有我和你两个人，我的责任是毫无保留的；但一旦“第三个人（另一位他者）”也看着我，我就不得不比较、权衡谁更需要帮助——正是“第三方”的在场，从无限的伦理责任中催生了正义、法庭与制度。',
            'The third party interrupts the face-to-face of a welcome of the other man, interrupts the proximity or approach of the neighbor, it is the birth of the question: What do I have to do with justice?',
            '据 SEP《Emmanuel Levinas》§3.2（Otherwise than Being）'
          ]
        ]
      }
    ]
  },
  {
    id: 64,
    slug: 'minest_camus',
    title: '加缪 · 荒诞哲学',
    philosopher: '阿尔贝·加缪',
    concept: '荒诞（The Absurd）、反抗与西西弗神话',
    categoryGroup: '三、形而上学与存在哲学（57–66）',
    tags: ['形而上学', '伦理学', '存在主义'],
    playSummary: '在循环任务与意义选择中探索荒诞处境',
    levelsSummary: '① 人对意义的渴求 vs 世界的沉默 · ② 三种回应（自杀、信仰跃迁、清醒反抗） · ③ 推石上山的西西弗',
    source: '《西西弗神话》（据 SEP《Albert Camus》转引）',
    quoteCount: 8,
    thumbType: 'camus',
    coreQuestion: '当人迫切渴望世界给出一个终极意义，而宇宙却报以非理性的冰冷沉默时，人为什么要拒绝自杀、也拒绝虚幻安慰，像西西弗一样清醒地推石上山？',
    boundaryNote: '加缪指出“荒诞”既不在人身上，也不在世界本身，而在于两者相遇时的“裂隙与对峙”；任何抹去其中一端的做法（肉体自杀或哲学自杀）都是对荒诞的逃避而非解决。',
    stages: [
      {
        id: 1,
        tabLabel: '① 荒诞的诞生（呼喊与沉默）',
        instructionTitle: '① 荒诞关系三角形 · 提高“人心对清晰意义的渴望”与“宇宙非理性的沉默”，观察荒诞张力如何产生在二者的对峙之中',
        sliders: [
          { key: 'humanCry', label: '人心对终极意义与明晰性的呼喊', min: 0, max: 100, step: 5, defaultValue: 50, unit: '%' },
          { key: 'worldSilence', label: '世界非理性的沉默与习惯链条的崩解', min: 0, max: 100, step: 5, defaultValue: 50, unit: '%' }
        ],
        mappings: [
          [
            '观察日常机械循环（起床、电车、工作四小时、吃饭、睡觉）在滑块超过 60% 时突然断裂并升起“为什么？”的觉醒',
            '起床，乘电车，在办公室或工厂工作四小时，吃饭，乘电车，再工作四小时，吃饭，睡觉，星期一、星期二、星期三、星期四、星期五、星期六，全是一个节奏……直到有一天，“为什么”的问题突然升起，一切便在这带有一丝惊奇的厌倦中开始了。',
            'Rising, streetcar, four hours in the office or the factory, meal, streetcar, four hours of work, meal, sleep, and Monday Tuesday Wednesday Thursday Friday and Saturday according to the same rhythm... One day the "why" arises and everything begins in that weariness tinged with amazement.',
            '据 SEP《Albert Camus》§3.1（《西西弗神话》）'
          ],
          [
            '将两项滑块同时推至 80% 以上：点亮“人的呼喊”与“世界的沉默”之间的荒诞电弧',
            '荒诞并不在人心中，也不在世界里，而在于这两者的共同在场；荒诞诞生于人类的呼唤与世界不合理的沉默之间的对峙。',
            'The absurd is born of this confrontation between the human need and the unreasonable silence of the world.',
            '据 SEP《Albert Camus》§3.1（Le Mythe de Sisyphe）'
          ]
        ]
      },
      {
        id: 2,
        tabLabel: '② 面对荒诞的三条路',
        instructionTitle: '② 逃避还是直面？ · 切换三种回应方式，观察为什么“肉体自杀”和“哲学自杀（非理性信仰跃迁）”都取消了荒诞对峙，唯独“反抗”守护了清醒',
        choices: [
          {
            key: 'absurdChoice',
            label: '面对荒诞处境的回应选择',
            defaultValue: 'revolt',
            options: [
              { value: 'suicide_body', label: '① 肉体自杀：消灭对峙中的“人”这一极（向荒诞投降而非解决）' },
              { value: 'suicide_phil', label: '② 哲学自杀（信仰的跃迁）：用彼岸幻象强行抹去“世界的无意义”这一极' },
              { value: 'revolt', label: '③ 清醒的反抗（Revolt）、自由与激情：不逃避、不粉饰，在无终极希望中炽热地活着' }
            ]
          }
        ],
        mappings: [
          [
            '依次查看“① 肉体自杀”与“② 哲学自杀”：观察荒诞等式的其中一端被强行抹除',
            '真正严肃的哲学问题只有一个，那就是自杀——判断生活是否值得经历。但无论肉体自杀还是放弃理性的“哲学自杀（信仰跃迁）”，都是通过消灭对峙的一方来逃避荒诞。',
            'There is but one truly serious philosophical problem, and that is suicide. Judging whether life is or is not worth living amounts to answering the fundamental question of philosophy.',
            '据 SEP《Albert Camus》§3.1（《西西弗神话》开篇）'
          ],
          [
            '切换到“③ 清醒的反抗、自由与激情”：在对峙中保持最高度的意识、行动自由与生命体验的丰盈',
            '我从荒诞中引出三种后果，那就是我的反抗、我的自由和我的激情。仅凭意识的游戏，我就把原本是对死亡的邀请转化成了生命的准则——我拒绝自杀。',
            'Thus I draw from the absurd three consequences, which are my revolt, my freedom, and my passion. By the mere activity of consciousness I transform into a rule of life what was an invitation to death—and I refuse suicide.',
            '据 SEP《Albert Camus》§3.1'
          ]
        ]
      },
      {
        id: 3,
        tabLabel: '③ 西西弗下山的时刻',
        instructionTitle: '③ 西西弗推石 · 推动巨石滚上山顶，当巨石再度滚落山脚时，观察西西弗迈步走下山坡那段“清醒凝视自身命运”的时刻',
        sliders: [
          { key: 'boulderPush', label: '西西弗推石上山进度', min: 0, max: 100, step: 2, defaultValue: 30, unit: '%' }
        ],
        choices: [
          {
            key: 'sisyphusMind',
            label: '西西弗走下山坡时的意识状态',
            defaultValue: 'lucid_scorn',
            options: [
              { value: 'crushed_hope', label: '怀抱虚幻希望：幻想“也许下一次石头不会滚下来”（随之而来的是绝望）' },
              { value: 'lucid_scorn', label: '彻底的清醒与蔑视：承认命运属于自己，石头是自己的事物，在攀登本身中充盈心灵' }
            ]
          }
        ],
        mappings: [
          [
            '将“西西弗推石上山进度”推至 100%（巨石滚落山底，西西弗转身下山）',
            '最令我感兴趣的，是西西弗走下山坡时的那段停顿。那个与石头同样沉重却迈着均匀步伐走回山脚去重新承受痛苦的时刻，正是意识的时刻。在他离开山顶、逐步深入众神巢穴的每一个瞬间，他都超越了自己的命运；他比他的巨石更坚强。',
            'It is during that return, that pause, that Sisyphus interests me... At each of those moments when he leaves the heights and gradually sinks toward the lairs of the gods, he is superior to his fate. He is stronger than his rock.',
            '据 SEP《Albert Camus》§3.1（《西西弗神话》末章）'
          ],
          [
            '保持在“彻底的清醒与蔑视”下推石：点亮加缪的终极结语',
            '没有哪种命运是无法通过蔑视去克服的。迈向高处的搏斗本身就足以充实一颗人心；我们应当想象西西弗是幸福的。',
            'There is no fate that cannot be surmounted by scorn... The struggle itself toward the heights is enough to fill a man’s heart. One must imagine Sisyphus happy.',
            '据 SEP《Albert Camus》§3.1（《西西弗神话》结语）'
          ]
        ]
      }
    ]
  },
  {
    id: 65,
    slug: 'minest_whitehead',
    title: '怀特海 · 过程哲学',
    philosopher: '阿尔弗雷德·诺思·怀特海',
    concept: '实际契机（Actual Occasions）、摄入（Prehension）与合生（Concrescence）',
    categoryGroup: '三、形而上学与存在哲学（57–66）',
    tags: ['形而上学', '科学哲学'],
    playSummary: '将固定对象展开为相互关联的事件与过程',
    levelsSummary: '① 批判具体性误置谬误 · ② 摄入与合生（多凝为一） · ③ 事件之流中的持续客体',
    source: '《过程与实在》《科学与近代世界》（据 SEP《Alfred North Whitehead》转引）',
    quoteCount: 8,
    thumbType: 'whitehead',
    coreQuestion: '世界的最基本砖块真的是一个个孤立静止、占据空间某一点的“坚硬实体颗粒”吗？还是不断生成、彼此“摄入（Prehend）”的事件与过程？',
    boundaryNote: '怀特海的有机哲学（Philosophy of Organism）受现代量子物理与场论启发，用动态的“实际事件/实际契机（Actual Occasion）”取代了传统近代哲学的“孤立静止实体”。',
    stages: [
      {
        id: 1,
        tabLabel: '① 具体性误置的谬误',
        instructionTitle: '① 从静态实体到过程事件 · 将看似固定不变的“巨石 / 城堡”放大展开在时间与关系的维度上，拆穿“简单定位”的抽象幻觉',
        sliders: [
          { key: 'processZoom', label: '过程与关系时间轴展开度', min: 0, max: 100, step: 5, defaultValue: 15, unit: '%' }
        ],
        mappings: [
          [
            '观察低展开度（< 30%）：把一块石头看作与周围环境和历史完全无关、孤立停留在某时空点上的“静态实体”',
            '经典唯物主义假定终极实在是一个个孤立地占据空间某一点、时间某一瞬的静止物质块，它们不需要涉及任何其他事物就能被完整描述——但这其实是把高度抽象的数学切面当成了具体实在，即“具体性误置的谬误（Fallacy of Misplaced Concreteness）”。',
            'This is an instance of the error which I have called the "Fallacy of Misplaced Concreteness"—mistaking the abstract for the concrete.',
            '怀特海《科学与近代世界》第 3 章（据 SEP《Alfred North Whitehead》§3 转引）'
          ],
          [
            '将“过程与关系时间轴展开度”推至 80% 以上：静态巨石展开为无数分子振动、引力场交互与连续生成的事件脉冲之流',
            '世界不是由静止的“事物”组成的，而是由“事件”和“过程”构成的；一个存在者是如何生成的，这本身就构成了这个存在者是什么。',
            'How an actual entity becomes constitutes what that actual entity is... Its "being" is constituted by its "becoming". This is the "principle of process".',
            '怀特海《过程与实在》（据 SEP《Alfred North Whitehead》§4 转引）'
          ]
        ]
      },
      {
        id: 2,
        tabLabel: '② 摄入（Prehension）与合生（Concrescence）',
        instructionTitle: '② 多如何合生为一 · 调节当前生成中的“实际契机（Actual Occasion）”对过去事件与永恒潜能（永恒客体）的摄入强度，完成一次创造性合生',
        sliders: [
          { key: 'pastPrehend', label: '对过往已成事件的物理摄入 (Physical Prehension)', min: 10, max: 100, step: 5, defaultValue: 50, unit: '%' },
          { key: 'noveltyAim', label: '对新颖潜能（永恒客体）的概念摄入 (Conceptual Prehension)', min: 10, max: 100, step: 5, defaultValue: 40, unit: '%' }
        ],
        buttons: [
          { key: 'triggerConcrescence', label: '✨ 触发合生（The Many Become One）', accent: 'purple' }
        ],
        mappings: [
          [
            '调节两项摄入强度并点击“触发合生”：观察当前契机将来自四面八方的过往关系脉络吸纳并凝聚为一个全新的经验统一体',
            '每一个“实际契机”都不是像莱布尼茨无窗单子那样封闭的，相反，它全是窗户：它通过“摄入（Prehension）”把整个过往宇宙的数据与新颖的可能性吸纳进自身，在“合生（Concrescence）”中凝聚为一个新的个体。',
            'Each actual entity is a throb of experience including the actual world within its scope through its prehensions.',
            '据 SEP《Alfred North Whitehead》§4'
          ],
          [
            '连续触发 2 次以上合生：观察刚生成的“一”立即化为客观不朽的数据，供下一代实际契机去摄入（“多成为一，并使多增加了一”）',
            '创造性（Creativity）是终极范畴：“多成为一，并使多增加了一（The many become one, and are increased by one）。”一旦当前契机完成了自身的主观生成而消逝，它便获得了“客观不朽性”，成为未来一切新事件必须摄入的过往事实。',
            'The ultimate metaphysical principle is the advance from disjunction to conjunction, creating a novel entity other than the entities given in disjunction. The many become one, and are increased by one.',
            '怀特海《过程与实在》Part I, Ch. II（据 SEP 转引）'
          ]
        ]
      },
      {
        id: 3,
        tabLabel: '③ 持续客体与关系之网',
        instructionTitle: '③ 为什么我们看到稳定的“山、树与自我”？ · 调节事件序列之间的“形式传递连续性（Society of Occasions）”，观察波峰接力如何呈现出宏观持存物',
        sliders: [
          { key: 'serialOrder', label: '事件谱系（Society）的特征继承连续度', min: 10, max: 100, step: 5, defaultValue: 75, unit: '%' }
        ],
        mappings: [
          [
            '将“特征继承连续度”保持在 70% 以上：观察一连串生生灭灭的短促事件脉冲像电影帧或波浪接力一样，呈现出宏观上稳定的“持续客体”',
            '我们在日常经验中所说的“持久物体”（如一块石头、一棵树或一个人的心灵），并不是一个跨越时间躺在那里的僵硬底层基质，而是一个具有历史脉络的“实际契机社会（Society of Actual Occasions）”——后一契机不断继承并微调前一契机共同的形式特征。',
            'An enduring object is a society of actual occasions arranged in a serial order through time, inheriting a common defining characteristic.',
            '据 SEP《Alfred North Whitehead》§4'
          ],
          [
            '观察画布中所有事件谱系之间彼此交织、互为环境的有机网络',
            '没有任何一个实际契机可以脱离它所处的宇宙关系网而孤立存在；万物皆在彼此之中。',
            'There is no possibility of a detached, self-contained local existence. The environment enters into the nature of each thing.',
            '怀特海《思维的方式》（据 SEP 转引）'
          ]
        ]
      }
    ]
  },
  {
    id: 66,
    slug: 'minest_deleuze',
    title: '德勒兹 · 生成与差异',
    philosopher: '吉尔·德勒兹',
    concept: '块茎（Rhizome）vs 树状图、自身差异、潜能（Virtual）向现实的分化',
    categoryGroup: '三、形而上学与存在哲学（57–66）',
    tags: ['形而上学', '语言', '法国当代哲学'],
    playSummary: '操作不断分化的概念网络，探索生成与差异',
    levelsSummary: '① 树状层级 vs 块茎网络（Rhizome） · ② 潜能（Virtual）的分化与差异性的重复 · ③ 生成（Becoming）：黄蜂与兰花',
    source: '《差异与重复》《千高原》（据 SEP《Gilles Deleuze》转引）',
    quoteCount: 8,
    thumbType: 'deleuze',
    coreQuestion: '“差异”只能是两个固定同一物之间的从属比较吗？思想与世界的结构必须像一棵有唯一树根和主干的“谱系树”，还是像可以从任意节点横向连通、断裂又重生的“块茎（草根网）”？',
    boundaryNote: '德勒兹区分了“潜能（Virtual，真实但尚未分化定型的问题场）”与“可能（Possible，只是现实事物的倒影复刻）”：潜能向现实的展开不是照着模子复印，而是充满创造性的分化（Differentiation）。',
    stages: [
      {
        id: 1,
        tabLabel: '① 树状体系（Arborescent）vs 块茎（Rhizome）',
        instructionTitle: '① 树与块茎 · 在垂直等级的“知识谱系树”与无中心、多入口的“块茎网络”之间切换，尝试切断其中一个节点观察块茎如何从别处再生连接',
        choices: [
          {
            key: 'netStructure',
            label: '概念与世界的组织拓扑结构',
            defaultValue: 'tree_model',
            options: [
              { value: 'tree_model', label: '树状模式（Arborescent）：唯一主根 → 主干 → 从属分枝（一统多的等级树）' },
              { value: 'rhizome_model', label: '块茎模式（Rhizome）：无中心草根网，任意一点均可与任何异质点横向连接' },
              { value: 'rhizome_rupture', label: '非表意断裂与再生：切断块茎某处，它立即沿旧线或新逃逸线重新生长' }
            ]
          }
        ],
        mappings: [
          [
            '从“树状模式”切换到“块茎模式（Rhizome）”：中心主干消解，异质节点横向自由连通',
            '我们已经厌倦了树；我们不应当再相信树、树根和幼根，它们让我们吃了太多苦头。与树不同，块茎不是还原为一的等级系统，块茎上的任意一点都可以、也必须与任何其他点相连接。',
            'Unlike trees or their roots, the rhizome connects any point to any other point, and its traits are not necessarily linked to traits of the same nature.',
            '据 SEP《Gilles Deleuze》§4.2（《千高原》导言：块茎）'
          ],
          [
            '切换到“非表意断裂与再生”：观察被截断的节点沿新的逃逸线（Line of Flight）萌发出新连线',
            '块茎可以在任何地方被打断、被震碎，但它总会沿着自己原有的某条线，或者沿着其他新的逃逸线再次重新生长出来。',
            'A rhizome may be broken, shattered at a given spot, but it will start up again on one of its old lines, or on new lines.',
            '据 SEP《Gilles Deleuze》§4.2（A Thousand Plateaus）'
          ]
        ]
      },
      {
        id: 2,
        tabLabel: '② 潜能（Virtual）的分化与差异',
        instructionTitle: '② 潜能分化 vs 模具复印 · 比较柏拉图式“原版—摹本复印（同一性统治差异）”与德勒兹“潜能场通过发散分化生成崭新现实”',
        choices: [
          {
            key: 'diffMode',
            label: '生成的本体论机制',
            defaultValue: 'copy_same',
            options: [
              { value: 'copy_same', label: '传统表象模型（可能→实在）：按固定原版模具批量印出相似的复制品（差异沦为偏差）' },
              { value: 'virtual_actual', label: '潜能现实化（Virtual → Actual）：真实的潜能问题场沿发散路径创造性地分化出全然不同的形态' }
            ]
          }
        ],
        sliders: [
          { key: 'divergence', label: '潜能分化与发散强度 (Divergence)', min: 10, max: 100, step: 5, defaultValue: 65, unit: '%' }
        ],
        mappings: [
          [
            '从“传统表象模型”切换到“潜能现实化（Virtual → Actual）”并将发散强度推至 70% 以上',
            '传统形而上学总是让“差异”屈从于“同一”（把差异仅仅看作两个既定同一物之间的不同）；德勒兹则要翻转这一等级，思考“自身差异”——真正的重复不是机械地复制同一个东西，而是产生新差异的力量。',
            'Difference is behind everything, but behind difference there is nothing. Repetition is not the return of the Same, but the production of the new and the different.',
            '据 SEP《Gilles Deleuze》§3.1（《差异与重复》）'
          ],
          [
            '观察画布中“潜能云（Virtual）”与生成的“现实（Actual）”毫不相似，每条分化线都是独特的创造',
            '“潜能（Virtual）”不是不真实的，它是完全真实的；但它向“现实（Actual）”的转化不遵循“相似性”原则，而是遵循“分歧与分化”——现实化就是真正的创造。',
            'The virtual is fully real in so far as it is virtual... Actualization breaks with resemblance as a process no less than it does with identity as a principle. To be actualized is to create divergent lines.',
            '据 SEP《Gilles Deleuze》§3.2'
          ]
        ]
      },
      {
        id: 3,
        tabLabel: '③ 生成（Becoming）：黄蜂与兰花',
        instructionTitle: '③ 异质共生与“生成” · 调节黄蜂与兰花之间的跨界耦合（解辖域化与再辖域化），观察生成不是“模仿”，而是发生在两者之间的共生生成块',
        sliders: [
          { key: 'couplingZone', label: '黄蜂与兰花的解辖域化耦合度', min: 0, max: 100, step: 5, defaultValue: 30, unit: '%' }
        ],
        mappings: [
          [
            '将“黄蜂与兰花的解辖域化耦合度”推至 80% 以上：兰花与黄蜂在画布中央交织出跨物种的动态能量回路',
            '兰花并不是在“模仿”黄蜂，而是在形成黄蜂的图像时“生成-黄蜂”；同时黄蜂在帮兰花传粉时成为了兰花生殖器官的一部分，它在“生成-兰花”。这两者并不合并为同一个东西，而是在植物界与动物界之间构成了一条共同的逃逸线与“生成块”。',
            'The orchid deterritorializes by forming an image, a tracing of a wasp; but the wasp reterritorializes on that image. The wasp is nevertheless deterritorialized, becoming a piece in the orchid’s reproductive apparatus. It is a capturing of code, a becoming-wasp of the orchid and a becoming-orchid of the wasp.',
            '据 SEP《Gilles Deleuze》§4.2（《千高原》）'
          ],
          [
            '观察连接线：生成（Becoming）始终发生在“之间（In-between）”，没有固定起点与终点',
            '生成既不是模仿，也不是变成同一个固定的终点；生成是一种动词，它始终生长在两个异质项的“中间（Milieu）”。',
            'A becoming is not a correspondence between relations. But neither is it a resemblance, an imitation, or, at the limit, an identification... To become is never to imitate, it always happens "between".',
            '据 SEP《Gilles Deleuze》§4.2'
          ]
        ]
      }
    ]
  }
];
