import { GraphVisualPreset, GraphVisualModeId } from '../types/graph';

export const TOP_10_VISUAL_MODES: GraphVisualPreset[] = [
  {
    id: 'obsidian-native',
    rank: 1,
    name: 'Obsidian Native',
    pluginSource: 'Obsidian Core Graph View',
    tagline: '原生黑曜石力导向图谱',
    description:
      '经典 Obsidian 原生视觉体验：度数自适应圆点、聚光灯悬停遮罩、高连接度优先文字渐显与丝滑阻尼收敛。',
    accentColor: '#8B7CF6',
    features: ['度数自适应节点', '一阶邻居聚光灯', 'Text Fade 渐显阈值'],
    recommendedForces: {
      centerForce: 0.35,
      repelForce: 190,
      linkForce: 0.75,
      linkDistance: 85,
    },
  },
  {
    id: 'infranodus',
    rank: 2,
    name: 'InfraNodus Network Insight',
    pluginSource: 'InfraNodus Text Network & Structural Gaps',
    tagline: '拓扑社群云团 + 结构洞盲区洞察',
    description:
      '复刻 InfraNodus 核心视觉：按介数中心性放大战略枢纽节点，渲染半透明社群凸包能量场（Community Hulls），并自动用金色脉冲桥标注跨群落「结构洞（Structural Gaps）」创新盲区。',
    accentColor: '#F59E0B',
    features: ['社群拓扑能量云 (Hulls)', 'Betweenness 枢纽光环', '结构洞盲区脉冲桥'],
    recommendedForces: {
      centerForce: 0.28,
      repelForce: 240,
      linkForce: 0.9,
      linkDistance: 95,
    },
  },
  {
    id: 'juggl',
    rank: 3,
    name: 'Juggl Semantic Workspace',
    pluginSource: 'Juggl (Cytoscape Semantic Graph Plugin)',
    tagline: '多维几何形状 + 贝塞尔弧线关系标签',
    description:
      '灵感源自 Obsidian 知名插件 Juggl：根据知识类型赋予专属几何造型（六边形 Wiki、菱形 ADR 决策、圆角矩形概念、圆形笔记），采用优雅弧线连接并在边中点悬浮语义关系胶囊。',
    accentColor: '#38BDF8',
    features: ['多边形节点语义区分', '二次贝塞尔弧形连线', '连线中点关系徽章'],
    recommendedForces: {
      centerForce: 0.3,
      repelForce: 260,
      linkForce: 0.7,
      linkDistance: 120,
    },
  },
  {
    id: 'extended-graph',
    rank: 4,
    name: 'Extended Graph Rings',
    pluginSource: 'Obsidian Extended Graph Plugin',
    tagline: '多标签同心扇环 + 证据权重光带',
    description:
      '复刻 Extended Graph 插件的高级视觉：每个节点外围绘制多标签彩色分段扇环（Multi-Tag Arcs），节点内部显示文档字数饱满度内环，连线按引用权重呈现渐变厚度。',
    accentColor: '#EC4899',
    features: ['多标签彩色扇形外环', '真实/AI 引用双色编码', '字数饱和度内芯'],
    recommendedForces: {
      centerForce: 0.35,
      repelForce: 220,
      linkForce: 0.8,
      linkDistance: 95,
    },
  },
  {
    id: 'excalibrain',
    rank: 5,
    name: 'ExcaliBrain Compass',
    pluginSource: 'ExcaliBrain /TheBrain Spatial Ontology',
    tagline: '父母/子女/兄弟/跨界 四象限罗盘拓扑',
    description:
      '复刻 ExcaliBrain（受 TheBrain 启发）的结构化思维导图布局：以当前选中节点为罗盘锚点，上方排列「上游架构与父文档」，下方排列「衍生子页面」，左侧排列「ADR 决策依据」，右侧排列「AI 跨界概念」。',
    accentColor: '#10B981',
    features: ['四象限本体罗盘力场', '正交折线/平滑肘形连接', '点击任意节点即时切换罗盘中心'],
    recommendedForces: {
      centerForce: 0.15,
      repelForce: 210,
      linkForce: 0.45,
      linkDistance: 110,
    },
  },
  {
    id: 'cosmos-nebula',
    rank: 6,
    name: '3D Cosmos Deep Nebula',
    pluginSource: 'Obsidian 3D Graph / Cosmograph Shader Style',
    tagline: '深空星云辉光 + 景深视差与恒星耀斑',
    description:
      '融合 Cosmograph 与 3D Graph 的宇宙星云美学：采用 Additive 叠加发光混合模式，为每个知识群落渲染深空星云径向光晕，高中心度节点绽放十字星芒（Starburst Flare）。',
    accentColor: '#A855F7',
    features: ['Additive 星云径向发光', '核心枢纽十字恒星芒', '层次景深光晕渲染'],
    recommendedForces: {
      centerForce: 0.4,
      repelForce: 200,
      linkForce: 0.75,
      linkDistance: 80,
    },
  },
  {
    id: 'graph-analysis',
    rank: 7,
    name: 'Graph Analysis Centrality',
    pluginSource: 'Obsidian Graph Analysis & Link Prediction',
    tagline: 'PageRank 热力图 + Jaccard 潜在连接预测',
    description:
      '复刻 Graph Analysis 插件的算法分析视图：实时计算全图 PageRank / 中心度并映射为蓝→紫→赤金热力光谱，同时通过共同邻居（Common Neighbors）自动预测尚未建立的潜在高价值连接。',
    accentColor: '#F43F5E',
    features: ['中心度热力光谱着色', '节点数值评分角标', '共同邻居潜在连线预测'],
    recommendedForces: {
      centerForce: 0.35,
      repelForce: 210,
      linkForce: 0.75,
      linkDistance: 90,
    },
  },
  {
    id: 'radial-chord',
    rank: 8,
    name: 'Radial Hierarchy Orbit',
    pluginSource: 'Radial Tree & Circular Chord Graph',
    tagline: '同心引力轨道环 + 跨群落弦图弧线',
    description:
      '将知识库按核心度与层级投射到 4 层同心天体轨道环上：核心引擎与 ADR 决策镇守内环，专题文档分布中环，叶节点与待创建链接环绕外环，连线化作优美的向心弦弧。',
    accentColor: '#06B6D4',
    features: ['4 层同心拓扑轨道标尺', '向心控制点贝塞尔弦弧', '环形群落扇区归类'],
    recommendedForces: {
      centerForce: 0.1,
      repelForce: 140,
      linkForce: 0.25,
      linkDistance: 90,
    },
  },
  {
    id: 'knowledge-pulse',
    rank: 9,
    name: 'Neural Knowledge Pulse',
    pluginSource: 'Animated Synapse & Signal Flow Graph',
    tagline: '神经元突触脉冲 + 实时知识信号流',
    description:
      '动态展现 Living Knowledge 的活性：连线上持续流动高频光子能量粒子，信号从源文档沿引用方向流向目标节点；选中节点时触发全网涟漪扩散波。',
    accentColor: '#14B8A6',
    features: ['有向光子脉冲粒子流', '焦点神经元呼吸涟漪', '真实/AI 双频信号速率'],
    recommendedForces: {
      centerForce: 0.35,
      repelForce: 195,
      linkForce: 0.75,
      linkDistance: 88,
    },
  },
  {
    id: 'timeline-river',
    rank: 10,
    name: 'Chronos Knowledge River',
    pluginSource: 'Obsidian Timeline & Architecture Flow Graph',
    tagline: '知识演进时间河床 + 架构层级流向',
    description:
      '将横向 X 轴映射为「底层架构决策 → 核心引擎实现 → AI 语义提取 → 产品规范与未来演进」的四阶段知识河床，直观呈现知识从决策源头向下游应用奔涌的演进脉络。',
    accentColor: '#6366F1',
    features: ['四阶段演进泳道底图', '水平三次贝塞尔流线', '架构溯源流向对齐'],
    recommendedForces: {
      centerForce: 0.15,
      repelForce: 170,
      linkForce: 0.35,
      linkDistance: 85,
    },
  },
];

export const VISUAL_MODE_MAP: Record<GraphVisualModeId, GraphVisualPreset> =
  TOP_10_VISUAL_MODES.reduce((acc, item) => {
    acc[item.id] = item;
    return acc;
  }, {} as Record<GraphVisualModeId, GraphVisualPreset>);
