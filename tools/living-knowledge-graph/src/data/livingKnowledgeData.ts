import {
  KnowledgeNode,
  KnowledgeEdge,
  GraphGroupRule,
  KnowledgeType,
  RelationshipType,
} from '../types/graph';

export const DEFAULT_GROUP_RULES: GraphGroupRule[] = [
  {
    id: 'grp-engine',
    label: 'Living Knowledge 核心引擎',
    query: 'group:core-engine',
    color: '#8B7CF6', // Obsidian Violet
    enabled: true,
  },
  {
    id: 'grp-graph',
    label: 'Graph View 物理与渲染',
    query: 'group:graph-engine',
    color: '#38BDF8', // Sky Blue
    enabled: true,
  },
  {
    id: 'grp-adr',
    label: '项目架构决策 (ADR)',
    query: 'type:decision',
    color: '#F59E0B', // Amber Gold
    enabled: true,
  },
  {
    id: 'grp-ai',
    label: 'AI 概念提取与语义索引',
    query: 'group:ai-semantics',
    color: '#10B981', // Emerald
    enabled: true,
  },
  {
    id: 'grp-product',
    label: '产品规范与知识工作流',
    query: 'group:product-spec',
    color: '#EC4899', // Rose Pink
    enabled: true,
  },
  {
    id: 'grp-unresolved',
    label: '待创建 / 未解析引用',
    query: 'type:unresolved',
    color: '#64748B', // Muted Slate
    enabled: true,
  },
];

export const RELATIONSHIP_META: Record<
  RelationshipType,
  { label: string; badge: string; verifiedDefault: boolean; colorDark: string; colorLight: string; dashed: boolean }
> = {
  'markdown-link': {
    label: 'Markdown 双向链接 [[...]]',
    badge: '真实引用',
    verifiedDefault: true,
    colorDark: '#94A3B8',
    colorLight: '#64748B',
    dashed: false,
  },
  'wiki-relation': {
    label: 'Wiki 页面层级关系',
    badge: '真实结构',
    verifiedDefault: true,
    colorDark: '#38BDF8',
    colorLight: '#0284C7',
    dashed: false,
  },
  'project-decision': {
    label: 'Minest 项目决策关联 (ADR)',
    badge: '真实决策',
    verifiedDefault: true,
    colorDark: '#F59E0B',
    colorLight: '#D97706',
    dashed: false,
  },
  'user-manual': {
    label: '用户手动建立连接',
    badge: '人工确认',
    verifiedDefault: true,
    colorDark: '#A78BFA',
    colorLight: '#7C3AED',
    dashed: false,
  },
  'ai-extracted': {
    label: 'AI 语义推断概念关系',
    badge: 'AI 推断',
    verifiedDefault: false,
    colorDark: '#10B981',
    colorLight: '#059669',
    dashed: true,
  },
};

export const KNOWLEDGE_TYPE_META: Record<
  KnowledgeType,
  { label: string; description: string }
> = {
  page: { label: 'Markdown 笔记', description: '带有 [[双向链接]] 的核心知识页面' },
  wiki: { label: 'Wiki 规范文档', description: '体系化工程与产品结构文档' },
  concept: { label: '领域概念实体', description: '从知识库中提取并归档的核心技术概念' },
  decision: { label: '项目决策 (ADR)', description: '架构与技术选型决策记录' },
  insight: { label: '洞察 (Insight)', description: '综合多个节点得出的推断，草稿画成空心' },
  unresolved: { label: '未解析链接节点', description: '已被 [[引用]] 但尚未创建正文的页面' },
};

const CORE_NODES: KnowledgeNode[] = [
  // === Group 1: Living Knowledge 核心引擎 (core-engine) ===
  {
    id: 'lk-engine-overview',
    title: 'Minest Living Knowledge Engine',
    type: 'wiki',
    tags: ['#architecture', '#core', '#living-knowledge'],
    group: 'core-engine',
    size: 10,
    resolved: true,
    metadata: {
      summary: 'Minest 动态知识引擎总体架构，负责统一管理 Markdown 双向链接、Wiki 页面、ADR 决策与 AI 提取的语义实体。',
      content: `# Minest Living Knowledge Engine\n\nMinest Living Knowledge Engine 是整个知识库的核心底层服务。它将传统的静态文档转化成持续演化的知识网络。\n\n## 核心设计原则\n1. **真实证据优先**：所有边关系必须挂载 \`evidenceReferences\`，严格区分真实 Markdown 引用与 AI 语义推断关系。\n2. **双向链接实时同步**：当文档中的 \`[[Wiki Link]]\` 变更时，AST 解析器在 15ms 内增量更新图谱拓扑。\n3. **多源统一接口**：同时接纳 [[Markdown AST 双向链接解析器]]、[[Wiki 知识层级索引服务]]、[[ADR-001 采用 Canvas + d3-force 渲染知识图谱]] 以及 [[AI 概念关系提取流水线]]。`,
      author: 'Linus Chen',
      updatedAt: '2026-11-22 18:40',
      folder: 'core/engine',
      wordCount: 1840,
      status: 'verified',
    },
    sourceReferences: [
      {
        docId: 'DOC-LK-001',
        path: '/docs/core/living-knowledge-engine.md',
        section: '§1. Architecture Overview',
        snippet: 'Living Knowledge Engine maintains a strictly verified property graph of documents, decisions, and extracted concepts.',
        updatedAt: '2026-11-22',
      },
    ],
  },
  {
    id: 'lk-ast-parser',
    title: 'Markdown AST 双向链接解析器',
    type: 'page',
    tags: ['#markdown', '#parser', '#ast', '#core'],
    group: 'core-engine',
    size: 8,
    resolved: true,
    metadata: {
      summary: '基于 Remark 构建的高速增量 AST 解析器，提取 [[Page]]、[[Page#Heading|Alias]] 与 #tags 标签。',
      content: `# Markdown AST 双向链接解析器\n\n负责从用户编写的 Markdown 笔记中提取精确的引用语法：\n\n- 标准双向链接：\`[[Minest Living Knowledge Engine]]\`\n- 段落锚点引用：\`[[力导向物理引擎参数规范#Repulsion]]\`\n- 未创建页面占位：当目标不存在时，生成 \`type: unresolved\` 节点（例如 [[WebGPU 千万级节点计算管线]]）。\n\n所有解析出的链接均标记为 \`verified: true\`，并记录行号上下文。`,
      author: 'Sarah Wu',
      updatedAt: '2026-11-21 14:20',
      folder: 'core/parser',
      wordCount: 1260,
      status: 'verified',
    },
    sourceReferences: [
      {
        docId: 'DOC-LK-002',
        path: '/docs/core/markdown-ast-parser.md',
        section: '§2. WikiLink Tokenization',
        snippet: 'Extracts [[target|alias]] tokens with line/column spans for instant backlink preview.',
        updatedAt: '2026-11-21',
      },
    ],
  },
  {
    id: 'lk-backlink-index',
    title: '双向链接倒排索引服务',
    type: 'page',
    tags: ['#index', '#backlinks', '#core'],
    group: 'core-engine',
    size: 7,
    resolved: true,
    metadata: {
      summary: '维护 O(1) 复杂度的入边与出边邻接表，支持 Local Graph 一阶、二阶、多阶邻居瞬间展开。',
      content: `# 双向链接倒排索引服务\n\n为 [[Local Graph 局部知识网络推导]] 提供毫秒级的 BFS 广度优先遍历支撑。\n\n当用户在图谱中双击或切换中心节点时，倒排索引直接返回指定深度（Depth 1 / 2 / 3）的子图切片，无需全量扫描。`,
      author: 'Sarah Wu',
      updatedAt: '2026-11-20 11:05',
      folder: 'core/index',
      wordCount: 950,
      status: 'verified',
    },
    sourceReferences: [
      {
        docId: 'DOC-LK-003',
        path: '/docs/core/backlink-inverted-index.md',
        section: '§3. Adjacency Graph Slice',
        snippet: 'Maintains bi-directional adjacency maps for sub-millisecond K-hop ego-network extraction.',
        updatedAt: '2026-11-20',
      },
    ],
  },
  {
    id: 'lk-wiki-hierarchy',
    title: 'Wiki 知识层级索引服务',
    type: 'wiki',
    tags: ['#wiki', '#taxonomy', '#core'],
    group: 'core-engine',
    size: 7,
    resolved: true,
    metadata: {
      summary: '管理结构化 Wiki 页面树与跨目录知识引用，连接部门规范与项目决策文档。',
      content: `# Wiki 知识层级索引服务\n\n不同于自由生长的 Markdown 笔记，Wiki 页面具有明确的父子目录结构与评审状态。该服务将目录树映射为 \`wiki-relation\` 边，与自由双向链接共同构成完整知识图谱。`,
      author: 'Linus Chen',
      updatedAt: '2026-11-19 16:30',
      folder: 'core/wiki',
      wordCount: 1120,
      status: 'verified',
    },
    sourceReferences: [
      {
        docId: 'DOC-LK-004',
        path: '/docs/core/wiki-hierarchy.md',
        section: '§1. Tree to Graph Mapping',
        snippet: 'Maps hierarchical workspace collections into verified structural edges.',
        updatedAt: '2026-11-19',
      },
    ],
  },
  {
    id: 'lk-schema-spec',
    title: '统一知识图谱数据接口规范',
    type: 'wiki',
    tags: ['#schema', '#api', '#living-knowledge'],
    group: 'core-engine',
    size: 8,
    resolved: true,
    metadata: {
      summary: '定义 Node (id, title, type, tags, group, size, metadata, sourceReferences) 与 Edge 统一契约。',
      content: `# 统一知识图谱数据接口规范\n\n规定所有接入 [[Obsidian Graph View 2D 核心渲染器]] 的数据源必须遵循统一 Schema：\n\n- **Node**: 包含 \`sourceReferences\` 溯源列表与类型标签。\n- **Edge**: 包含 \`relationshipType\`、\`weight\` 与 \`evidenceReferences\`，严格区分真实引用与 AI 推断。`,
      author: 'Linus Chen',
      updatedAt: '2026-11-22 09:15',
      folder: 'core/schema',
      wordCount: 1450,
      status: 'verified',
    },
    sourceReferences: [
      {
        docId: 'DOC-LK-005',
        path: '/docs/core/unified-graph-schema.md',
        section: '§2. Node & Edge Contracts',
        snippet: 'Enforces evidenceReferences on every KnowledgeEdge to prevent hallucinated connections.',
        updatedAt: '2026-11-22',
      },
    ],
  },
  {
    id: 'lk-realtime-sync',
    title: '知识图谱增量变更同步协议',
    type: 'page',
    tags: ['#sync', '#realtime', '#core'],
    group: 'core-engine',
    size: 6,
    resolved: true,
    metadata: {
      summary: '在新增节点或修改连接时，通过热更新注入现有 d3-force 物理模拟，避免全量重建导致画面跳变。',
      content: `# 知识图谱增量变更同步协议\n\n当用户在知识库中新建笔记或手动添加连接时，图谱引擎保留所有已有节点的 \`(x, y, vx, vy)\` 坐标，仅将新节点放置在邻居节点质心附近并微调 \`alpha(0.25)\`。`,
      author: 'Kevin Zhao',
      updatedAt: '2026-11-21 19:00',
      folder: 'core/sync',
      wordCount: 890,
      status: 'verified',
    },
    sourceReferences: [
      {
        docId: 'DOC-LK-006',
        path: '/docs/core/incremental-graph-sync.md',
        section: '§4. Hot Simulation Mutation',
        snippet: 'Preserves existing particle coordinates during live graph updates.',
        updatedAt: '2026-11-21',
      },
    ],
  },
  {
    id: 'lk-citation-verifier',
    title: '知识引用真实性校验器',
    type: 'concept',
    tags: ['#verification', '#evidence', '#core'],
    group: 'core-engine',
    size: 6,
    resolved: true,
    metadata: {
      summary: '校验每一条图谱边是否具备原文锚点或人工确认签名，杜绝虚假连线。',
      content: `# 知识引用真实性校验器\n\n确保图谱不凭空捏造未经验证的知识关系。对于 [[AI 概念关系提取流水线]] 产出的边，强制标记为 \`verified: false\` 并在视觉上采用虚线与独立配色区分。`,
      author: 'Sarah Wu',
      updatedAt: '2026-11-18 15:40',
      folder: 'core/verification',
      wordCount: 780,
      status: 'verified',
    },
    sourceReferences: [
      {
        docId: 'DOC-LK-007',
        path: '/docs/core/citation-verifier.md',
        section: '§1. Zero Hallucination Policy',
        snippet: 'Audits edge evidence references against document checksums.',
        updatedAt: '2026-11-18',
      },
    ],
  },

  // === Group 2: Graph View 物理与渲染 (graph-engine) ===
  {
    id: 'gv-canvas-renderer',
    title: 'Obsidian Graph View 2D 核心渲染器',
    type: 'wiki',
    tags: ['#canvas', '#obsidian', '#rendering', '#graph'],
    group: 'graph-engine',
    size: 10,
    resolved: true,
    metadata: {
      summary: '基于 HTML5 Canvas 2D + DPR 自适应的高性能图谱渲染器，复刻 Obsidian 的视觉层次、悬停聚光灯与平滑文字渐显。',
      content: `# Obsidian Graph View 2D 核心渲染器\n\n采用原生 HTML5 Canvas 2D 上下文配合 \`d3-force\` 与 \`d3-quadtree\` 空间索引，完整还原 Obsidian Graph View 的标志性体验：\n\n1. **节点度数自适应半径**：连接数越多的核心节点半径越大。\n2. **悬停/选中聚光灯效果**：高亮当前节点与直接一阶邻居，其余无关节点与连线平滑降低透明度至 12%。\n3. **Text Fade Threshold 文字渐显**：根据当前缩放倍率与节点重要度动态控制标题透明度，远景看群落结构，近景看知识细节。`,
      author: 'Kevin Zhao',
      updatedAt: '2026-11-23 09:30',
      folder: 'graph/renderer',
      wordCount: 2150,
      status: 'verified',
    },
    sourceReferences: [
      {
        docId: 'DOC-GV-001',
        path: '/src/components/GraphCanvas.tsx',
        section: 'Render Loop & DPR Scaling',
        snippet: 'High-DPI Canvas 2D rendering pipeline with spatial quadtree hit-testing and LOD label culling.',
        updatedAt: '2026-11-23',
      },
    ],
  },
  {
    id: 'gv-physics-spec',
    title: '力导向物理引擎参数规范',
    type: 'wiki',
    tags: ['#physics', '#d3-force', '#obsidian', '#graph'],
    group: 'graph-engine',
    size: 9,
    resolved: true,
    metadata: {
      summary: '详解 Center Force、Repulsion、Link Force、Link Distance、Collision 与 Damping 六大物理力场协同机制。',
      content: `# 力导向物理引擎参数规范\n\n为了达到 Obsidian 般自然舒展且无抖动的聚类效果，物理引擎配置了六个正交力场：\n\n- **Center Force (中心吸引力)**：使用 \`forceX(0)\` 与 \`forceY(0)\` 将孤立群落温柔拉向视口中心，防止漂移出界。\n- **Repulsion (节点排斥力)**：使用 Barnes-Hut 四叉树加速的 \`forceManyBody\`，使不同主题自然推开。\n- **Link Force & Link Distance**：控制关联节点之间的弹簧刚度与基准距离。\n- **Collision (碰撞避免)**：基于节点度数半径避免重叠。\n- **Damping (运动阻尼)**：通过 \`velocityDecay\` 消除尾端微小震荡。`,
      author: 'Kevin Zhao',
      updatedAt: '2026-11-22 21:15',
      folder: 'graph/physics',
      wordCount: 1680,
      status: 'verified',
    },
    sourceReferences: [
      {
        docId: 'DOC-GV-002',
        path: '/docs/graph/force-directed-physics.md',
        section: '§2. Six Force Parameters',
        snippet: 'Real-time slider modulation updates force strengths without recreating the simulation instance.',
        updatedAt: '2026-11-22',
      },
    ],
  },
  {
    id: 'gv-local-graph',
    title: 'Local Graph 局部知识网络推导',
    type: 'page',
    tags: ['#local-graph', '#ego-network', '#bfs', '#graph'],
    group: 'graph-engine',
    size: 8,
    resolved: true,
    metadata: {
      summary: '围绕当前焦点知识页面动态计算 1~3 层关系子图，支持点击邻居切换中心与历史回退栈。',
      content: `# Local Graph 局部知识网络推导\n\n在阅读或审阅单个知识页面时，用户往往关心「与当前页面直接相关的一层、两层或多层知识网络」。\n\n## 核心交互\n- **深度滑块 (1~3 跳)**：实时调整 BFS 探索深度。\n- **中心切换与回退**：点击任意邻居节点即可将其设为新中心，并压入导航历史栈，支持一键返回上一中心节点。`,
      author: 'Kevin Zhao',
      updatedAt: '2026-11-22 17:10',
      folder: 'graph/local',
      wordCount: 1190,
      status: 'verified',
    },
    sourceReferences: [
      {
        docId: 'DOC-GV-003',
        path: '/docs/graph/local-graph-ego-network.md',
        section: '§1. N-Hop Subgraph Extraction',
        snippet: 'Computes K-hop neighborhood around focal node with breadcrumb history stack.',
        updatedAt: '2026-11-22',
      },
    ],
  },
  {
    id: 'gv-quadtree-hit',
    title: '四叉树空间索引与拾取优化',
    type: 'concept',
    tags: ['#quadtree', '#performance', '#spatial', '#graph'],
    group: 'graph-engine',
    size: 7,
    resolved: true,
    metadata: {
      summary: '利用 d3-quadtree 实现 O(log N) 鼠标悬停与触屏拾取，以及 Barnes-Hut 多体排斥力近似计算。',
      content: `# 四叉树空间索引与拾取优化\n\n在 1,000 至 5,000 个节点的规模下，逐帧线性遍历检测鼠标悬停会带来不必要的开销。通过空间四叉树与视锥裁剪（Frustum Culling），仅对视口内的可见节点执行碰撞检测与标签绘制。`,
      author: 'Kevin Zhao',
      updatedAt: '2026-11-21 16:00',
      folder: 'graph/performance',
      wordCount: 940,
      status: 'verified',
    },
    sourceReferences: [
      {
        docId: 'DOC-GV-004',
        path: '/docs/graph/quadtree-spatial-index.md',
        section: '§2. Pointer Hit Detection',
        snippet: 'Spatial lookup within screen-space radius scaled by inverse zoom transform.',
        updatedAt: '2026-11-21',
      },
    ],
  },
  {
    id: 'gv-lod-culling',
    title: '大规模节点 LOD 分层渲染策略',
    type: 'page',
    tags: ['#performance', '#lod', '#5000-nodes', '#graph'],
    group: 'graph-engine',
    size: 7,
    resolved: true,
    metadata: {
      summary: '针对 1,000 ~ 5,000 节点场景的视口裁剪、文字分级隐藏、高度数枢纽优先显示与移动端 DPR 降级策略。',
      content: `# 大规模节点 LOD 分层渲染策略\n\n为了保证 500 节点丝滑流畅、1,000 节点正常交互、5,000 节点具备分层性能优化：\n\n1. **视口边界裁剪 (Viewport Culling)**：屏幕外的节点与连线直接跳过 Canvas 绘制调用。\n2. **重要度优先标签 (Degree-prioritized Labels)**：低缩放倍率下仅渲染高连接度 Hub 节点的标题；放大视口或悬停时渐显普通节点标题。\n3. **移动端 DPR 自适应**：在 iPad / iPhone 等高分屏且节点数超 1,500 时，自动将渲染像素密度上限约束在 1.5x 以降低 GPU 填充率开销。`,
      author: 'Kevin Zhao',
      updatedAt: '2026-11-23 08:20',
      folder: 'graph/performance',
      wordCount: 1380,
      status: 'verified',
    },
    sourceReferences: [
      {
        docId: 'DOC-GV-005',
        path: '/docs/graph/lod-rendering-strategy.md',
        section: '§3. 5000-Node Tiered Culling',
        snippet: 'Combines viewport bounding-box culling with degree-thresholded text rendering.',
        updatedAt: '2026-11-23',
      },
    ],
  },
  {
    id: 'gv-touch-gestures',
    title: '桌面与移动端多点触控交互手势',
    type: 'page',
    tags: ['#touch', '#mobile', '#ipad', '#interaction'],
    group: 'graph-engine',
    size: 6,
    resolved: true,
    metadata: {
      summary: '支持鼠标滚轮以指针为中心缩放、双指 Pinch 捏合缩放、单指拖拽节点/画布、长按呼出节点预览。',
      content: `# 桌面与移动端多点触控交互手势\n\n针对 Desktop、iPad 与 iPhone 提供一致的原生手势：\n\n- **滚轮 / 双指捏合 (Pinch-to-Zoom)**：严格以光标或双指中心点为不动点进行仿射变换。\n- **节点拖拽物理响应**：手指或鼠标按住节点拖动时，固定该节点 \`fx, fy\` 并唤醒物理引擎 \`alphaTarget(0.25)\`，周围关联节点像真实弹簧网一样自然跟随。`,
      author: 'Elena Rostova',
      updatedAt: '2026-11-22 12:40',
      folder: 'graph/interaction',
      wordCount: 1020,
      status: 'verified',
    },
    sourceReferences: [
      {
        docId: 'DOC-GV-006',
        path: '/docs/graph/touch-and-pointer-gestures.md',
        section: '§2. Pinch Zoom & Long Press',
        snippet: 'Unified pointer and touch gesture recognizer for desktop, iPadOS, and iOS.',
        updatedAt: '2026-11-22',
      },
    ],
  },

  // === Group 3: 项目架构决策 ADR (type: decision) ===
  {
    id: 'adr-001-canvas-d3',
    title: 'ADR-001 采用 Canvas 2D + d3-force 渲染知识图谱',
    type: 'decision',
    tags: ['#adr', '#decision', '#architecture', '#d3-force'],
    group: 'adr-decisions',
    size: 9,
    resolved: true,
    metadata: {
      summary: '技术选型决议：对比 SVG、react-force-graph-2d、d3-force 与 PixiJS 后，选定单引擎 d3-force + 原生 Canvas 2D。',
      content: `# ADR-001 采用 Canvas 2D + d3-force 渲染知识图谱\n\n## 背景与评估对象\n在 Phase 0 架构评估中，我们对比了 \`react-force-graph-2d\`、\`d3-force\` 与 \`PixiJS\`。\n\n## 决策结论\n决定采用 **d3-force 物理内核 + 定制高保真 HTML5 Canvas 2D 渲染管线**，不引入重复的第三方图形包装库。\n\n## 决策依据\n1. **零黑盒完全可控**：直接掌控 Obsidian 风格的聚光灯半透明遮罩、平滑文字渐隐阈值（Text Fade Threshold）与高度数优先标签显示。\n2. **避免状态重建物理模拟**：React 状态（如颜色、过滤、粗细）更新时仅更新可变 Ref 引用，绝不销毁重建 \`d3.forceSimulation\` 实例。\n3. **轻量与跨端兼容**：无额外 WebGL 上下文丢失风险，在桌面与 iOS Safari 上具备极佳的启动速度与文字清晰度。`,
      author: 'Architecture Board',
      updatedAt: '2026-11-20 10:00',
      folder: 'adr',
      wordCount: 1560,
      status: 'accepted-adr',
    },
    sourceReferences: [
      {
        docId: 'ADR-2026-001',
        path: '/docs/adr/001-canvas-2d-d3-force-selection.md',
        section: 'Decision Outcome',
        snippet: 'Accepted: Single physics engine (d3-force) paired with custom High-DPI Canvas renderer.',
        updatedAt: '2026-11-20',
      },
    ],
  },
  {
    id: 'adr-002-evidence-edge',
    title: 'ADR-002 强制区分真实知识引用与 AI 语义推断关系',
    type: 'decision',
    tags: ['#adr', '#decision', '#evidence', '#ai'],
    group: 'adr-decisions',
    size: 8,
    resolved: true,
    metadata: {
      summary: '架构红线：任何进入 Living Knowledge 图谱的连线必须标记来源，AI 推断关系须有原文证据且可一键过滤开关。',
      content: `# ADR-002 强制区分真实知识引用与 AI 语义推断关系\n\n## 核心决议\n1. **严禁伪造随机连线**：图谱中每一条边必须对应真实的文档引用、目录结构、ADR 关联或带有原文证据片段（\`evidenceReferences\`）的 AI 提取关系。\n2. **视觉可辨识**：真实引用采用实线渲染；AI 推断的概念关系默认采用翠绿色虚线渲染，并在控制面板与节点详情中明确标注「AI 推断 (置信度)」与「真实引用」。`,
      author: 'Architecture Board',
      updatedAt: '2026-11-20 14:30',
      folder: 'adr',
      wordCount: 1210,
      status: 'accepted-adr',
    },
    sourceReferences: [
      {
        docId: 'ADR-2026-002',
        path: '/docs/adr/002-verified-vs-ai-inferred-edges.md',
        section: 'Verification Invariants',
        snippet: 'Every edge must carry verifiable evidenceReferences and explicit relationshipType.',
        updatedAt: '2026-11-20',
      },
    ],
  },
  {
    id: 'adr-003-2d-first',
    title: 'ADR-003 优先交付高保真 2D 图谱暂缓 3D 视图',
    type: 'decision',
    tags: ['#adr', '#decision', '#product', '#ux'],
    group: 'adr-decisions',
    size: 7,
    resolved: true,
    metadata: {
      summary: '交互决策：3D 图谱在高频知识检索中存在轴向遮挡与文字阅读困难，优先打磨 Obsidian 级 2D 空间导航体验。',
      content: `# ADR-003 优先交付高保真 2D 图谱暂缓 3D 视图\n\n## 决策背景\n3D 球体图谱虽然具有视觉噱头，但在日常知识检索、标签阅读和拖拽整理时存在严重的 Z 轴遮挡与眩晕感。\n\n## 决议\n集中全部工程预算，将 2D Graph View 的物理阻尼手感、群落聚类清晰度、搜索定位与 Local Graph 多跳探索做到极致。`,
      author: 'Product & Engineering',
      updatedAt: '2026-11-19 11:20',
      folder: 'adr',
      wordCount: 860,
      status: 'accepted-adr',
    },
    sourceReferences: [
      {
        docId: 'ADR-2026-003',
        path: '/docs/adr/003-prioritize-2d-graph-view.md',
        section: 'UX Rationale',
        snippet: '2D planar force layout provides superior legibility and spatial memory over 3D projection.',
        updatedAt: '2026-11-19',
      },
    ],
  },
  {
    id: 'adr-004-hot-simulation',
    title: 'ADR-004 物理引擎实例常驻与增量参数热更新',
    type: 'decision',
    tags: ['#adr', '#decision', '#performance', '#physics'],
    group: 'adr-decisions',
    size: 7,
    resolved: true,
    metadata: {
      summary: '性能决议：调节 Forces 滑块或切换高亮过滤时，严禁重新创建 d3.forceSimulation，必须原地更新力场强度。',
      content: `# ADR-004 物理引擎实例常驻与增量参数热更新\n\n当用户在控制面板拖动 Center Force 或 Repel Force 滑块时，直接调用 \`simulation.force('charge').strength(-repel)\` 并设置温和的 \`simulation.alpha(0.35).restart()\`，从而实现 Obsidian 标志性的实时丝滑重排。`,
      author: 'Kevin Zhao',
      updatedAt: '2026-11-21 10:15',
      folder: 'adr',
      wordCount: 930,
      status: 'accepted-adr',
    },
    sourceReferences: [
      {
        docId: 'ADR-2026-004',
        path: '/docs/adr/004-persistent-simulation-lifecycle.md',
        section: 'Lifecycle Rules',
        snippet: 'Decouples React render state from d3-force simulation instantiation.',
        updatedAt: '2026-11-21',
      },
    ],
  },

  // === Group 4: AI 概念提取与语义索引 (ai-semantics) ===
  {
    id: 'ai-concept-pipeline',
    title: 'AI 概念关系提取流水线',
    type: 'wiki',
    tags: ['#ai', '#nlp', '#concept-extraction', '#living-knowledge'],
    group: 'ai-semantics',
    size: 8,
    resolved: true,
    metadata: {
      summary: '从非结构化会议纪要与长篇技术文档中识别领域概念实体，并生成附带原文引据的候选语义关系。',
      content: `# AI 概念关系提取流水线\n\n当文档缺乏显式的 \`[[Markdown 双向链接]]\` 时，Living Knowledge 的后台语义分析器会识别跨文档共现的领域概念（如 [[向量嵌入与混合检索架构]] 与 [[双向链接倒排索引服务]]），并生成带有置信度评分和原文引用的 \`ai-extracted\` 关系。`,
      author: 'Dr. Mei Lin',
      updatedAt: '2026-11-22 15:10',
      folder: 'ai/pipeline',
      wordCount: 1620,
      status: 'verified',
    },
    sourceReferences: [
      {
        docId: 'DOC-AI-001',
        path: '/docs/ai/concept-extraction-pipeline.md',
        section: '§2. Evidence-Grounded Extraction',
        snippet: 'Requires exact sentence span quote before emitting an ai-extracted edge.',
        updatedAt: '2026-11-22',
      },
    ],
  },
  {
    id: 'ai-hybrid-search',
    title: '向量嵌入与混合检索架构',
    type: 'concept',
    tags: ['#ai', '#embeddings', '#search', '#retrieval'],
    group: 'ai-semantics',
    size: 7,
    resolved: true,
    metadata: {
      summary: '结合 BM25 关键词精确匹配、图谱拓扑邻近度（PageRank）与稠密向量语义检索的三路召回机制。',
      content: `# 向量嵌入与混合检索架构\n\n在 Minest 中搜索知识时，不仅匹配字面关键词，还利用知识图谱中的连接权重对检索结果进行 Graph-RAG 重排序。`,
      author: 'Dr. Mei Lin',
      updatedAt: '2026-11-21 17:45',
      folder: 'ai/retrieval',
      wordCount: 1340,
      status: 'verified',
    },
    sourceReferences: [
      {
        docId: 'DOC-AI-002',
        path: '/docs/ai/hybrid-graph-retrieval.md',
        section: '§3. Topology-Weighted Reranking',
        snippet: 'Combines lexical match score with 2-hop graph centrality.',
        updatedAt: '2026-11-21',
      },
    ],
  },
  {
    id: 'ai-entity-disambiguation',
    title: '跨文档实体消歧与同义词归并',
    type: 'concept',
    tags: ['#ai', '#entity', '#nlp'],
    group: 'ai-semantics',
    size: 6,
    resolved: true,
    metadata: {
      summary: '将不同笔记中的同义术语（如“力导向图”、“Force-Directed Graph”）归一化到同一知识节点。',
      content: `# 跨文档实体消歧与同义词归并\n\n通过别名表（Aliases）与上下文嵌入相似度，防止同一概念在图谱中分裂成多个孤立节点。`,
      author: 'Dr. Mei Lin',
      updatedAt: '2026-11-19 14:15',
      folder: 'ai/entity',
      wordCount: 920,
      status: 'verified',
    },
    sourceReferences: [
      {
        docId: 'DOC-AI-003',
        path: '/docs/ai/entity-disambiguation.md',
        section: '§1. Canonical Alias Resolution',
        snippet: 'Resolves markdown link aliases and concept synonyms to canonical node IDs.',
        updatedAt: '2026-11-19',
      },
    ],
  },
  {
    id: 'ai-confidence-threshold',
    title: 'AI 推断关系置信度校准规范',
    type: 'page',
    tags: ['#ai', '#verification', '#quality'],
    group: 'ai-semantics',
    size: 6,
    resolved: true,
    metadata: {
      summary: '规定只有置信度 >= 0.75 且包含双向原文锚点的 AI 推断关系才允许进入图谱视图，并支持用户一键转正。',
      content: `# AI 推断关系置信度校准规范\n\n低于 0.75 置信度的弱相关猜测会被直接丢弃，避免产生噪声连线污染图谱聚类结构。用户在检查器中确认某条 AI 推断关系后，可将其升级为 \`user-manual\` 真实连接。`,
      author: 'Dr. Mei Lin',
      updatedAt: '2026-11-20 18:20',
      folder: 'ai/quality',
      wordCount: 840,
      status: 'verified',
    },
    sourceReferences: [
      {
        docId: 'DOC-AI-004',
        path: '/docs/ai/confidence-calibration.md',
        section: '§2. Precision Floor 0.75',
        snippet: 'Filters low-confidence semantic co-occurrences to preserve natural graph clustering.',
        updatedAt: '2026-11-20',
      },
    ],
  },

  // === Group 5: 产品规范与知识工作流 (product-spec) ===
  {
    id: 'prod-obsidian-benchmark',
    title: 'Obsidian Graph View 交互还原基准清单',
    type: 'wiki',
    tags: ['#obsidian', '#ux', '#product', '#benchmark'],
    group: 'product-spec',
    size: 9,
    resolved: true,
    metadata: {
      summary: '逐项对齐 Obsidian 原生图谱的 Filters、Groups、Display、Forces 四大折叠面板与节点单击/双击/悬停行为。',
      content: `# Obsidian Graph View 交互还原基准清单\n\n## 核心交互对齐项\n1. **悬停 (Hover)**：高光当前节点与一阶关联节点及连线，其余背景节点透明度平滑降至 12%。\n2. **单击 (Single Click)**：锁定选中节点并展开右侧知识预览与引用证据面板。\n3. **双击 (Double Click)**：直接打开完整知识页面阅读器，或切换至围绕该节点的 Local Graph。\n4. **四维控制面板**：完整包含 Filters、Groups、Display、Forces 且支持 localStorage 自动持久化。`,
      author: 'Elena Rostova',
      updatedAt: '2026-11-23 10:00',
      folder: 'product/specs',
      wordCount: 1740,
      status: 'verified',
    },
    sourceReferences: [
      {
        docId: 'DOC-PROD-001',
        path: '/docs/product/obsidian-graph-parity-checklist.md',
        section: '§1. Interaction & Visual Parity',
        snippet: 'Benchmarks visual clustering, damping physics, and 4-panel controls against Obsidian.',
        updatedAt: '2026-11-23',
      },
    ],
  },
  {
    id: 'prod-control-panel-spec',
    title: 'Graph Controls 四维控制面板设计规范',
    type: 'page',
    tags: ['#controls', '#filters', '#groups', '#ux'],
    group: 'product-spec',
    size: 7,
    resolved: true,
    metadata: {
      summary: '定义 Filters、Groups 自定义着色规则、Display 视觉滑块与 Forces 物理滑块的实时响应与偏好存储。',
      content: `# Graph Controls 四维控制面板设计规范\n\n控制面板采用悬浮毛玻璃半透明抽屉设计，可随时折叠以释放 100% 画布空间。所有滑块参数支持实时生效并写入浏览器本地偏好或重置为 Obsidian 标准默认值。`,
      author: 'Elena Rostova',
      updatedAt: '2026-11-22 11:30',
      folder: 'product/specs',
      wordCount: 1080,
      status: 'verified',
    },
    sourceReferences: [
      {
        docId: 'DOC-PROD-002',
        path: '/docs/product/graph-controls-panel.md',
        section: '§2. Collapsible Accordion Sections',
        snippet: 'Defines Filters, Color Groups, Display thresholds, and Force sliders.',
        updatedAt: '2026-11-22',
      },
    ],
  },
  {
    id: 'prod-theme-system',
    title: 'Minest 深浅双主题色彩与对比度规范',
    type: 'page',
    tags: ['#theme', '#dark-mode', '#design-system', '#ux'],
    group: 'product-spec',
    size: 6,
    resolved: true,
    metadata: {
      summary: '默认采用 Obsidian 深邃黑曜石画布 (#141519)，同时支持一键无缝切换至高对比度浅色科研画布。',
      content: `# Minest 深浅双主题色彩与对比度规范\n\n采用深色优先设计（Obsidian Carbon \`#141519\`），减少大面积节点浏览时的视觉疲劳，同时兼容 Minest 浅色主题系统（Alabaster \`#F8FAFC\`）。`,
      author: 'Elena Rostova',
      updatedAt: '2026-11-21 09:45',
      folder: 'product/design',
      wordCount: 790,
      status: 'verified',
    },
    sourceReferences: [
      {
        docId: 'DOC-PROD-003',
        path: '/docs/product/theme-system-tokens.md',
        section: '§1. Dark & Light Canvas Tokens',
        snippet: 'Provides calibrated node/link opacity tokens for both dark and light themes.',
        updatedAt: '2026-11-21',
      },
    ],
  },
  {
    id: 'prod-daily-research-note',
    title: '2026-11 知识图谱物理手感调优手记',
    type: 'page',
    tags: ['#notes', '#physics', '#tuning'],
    group: 'product-spec',
    size: 5,
    resolved: true,
    metadata: {
      summary: '记录如何通过径向向心力与阻尼系数调优，消除力导向图常见的“外围节点无限漂移”和“高频微颤”问题。',
      content: `# 2026-11 知识图谱物理手感调优手记\n\n在早期测试中，单纯使用 \`d3.forceCenter(0,0)\` 只会平移整体质心，无法阻止外围孤立节点被排斥力推向无穷远。改用 \`d3.forceX(0).strength(centerForce)\` 与 \`d3.forceY(0).strength(centerForce)\` 后，所有群落自然围绕中心聚拢成圆润的星云形态。`,
      author: 'Kevin Zhao',
      updatedAt: '2026-11-22 23:10',
      folder: 'notes/engineering',
      wordCount: 640,
      status: 'verified',
    },
    sourceReferences: [
      {
        docId: 'DOC-NOTE-011',
        path: '/notes/2026-11-physics-damping-tuning.md',
        section: 'Field Notes',
        snippet: 'Replacing forceCenter translation with radial forceX/forceY produces authentic Obsidian clustering.',
        updatedAt: '2026-11-22',
      },
    ],
  },

  // === Group 6: 未解析引用节点 (type: unresolved) & 孤立节点 (Orphans) ===
  {
    id: 'unres-webgpu-pipeline',
    title: 'WebGPU 千万级节点计算管线',
    type: 'unresolved',
    tags: ['#future', '#webgpu', '#unresolved'],
    group: 'unresolved',
    size: 4,
    resolved: false,
    metadata: {
      summary: '该页面已在多篇架构笔记中被 [[双向链接]] 引用，但尚未创建正式文档正文（Unresolved Link）。',
      content: `# WebGPU 千万级节点计算管线（待创建页面）\n\n此节点由 [[Markdown AST 双向链接解析器]] 和 [[大规模节点 LOD 分层渲染策略]] 引用产生。在 Obsidian 与 Minest 中，未创建的引用页面以半透明虚化圆点展示，方便团队发现知识空白并点击创建。`,
      author: 'System Stub',
      updatedAt: '尚未创建',
      folder: 'unresolved',
      wordCount: 0,
      status: 'unresolved-stub',
    },
    sourceReferences: [
      {
        docId: 'STUB-001',
        path: 'Referenced in /docs/graph/lod-rendering-strategy.md',
        snippet: 'Future work: see [[WebGPU 千万级节点计算管线]] for compute-shader force layout.',
        updatedAt: '2026-11-23',
      },
    ],
  },
  {
    id: 'unres-crdt-collab',
    title: 'Yjs CRDT 多人实时协同图谱批注',
    type: 'unresolved',
    tags: ['#future', '#crdt', '#collab', '#unresolved'],
    group: 'unresolved',
    size: 4,
    resolved: false,
    metadata: {
      summary: '已被 [[知识图谱增量变更同步协议]] 引用但尚未撰写的规划专题页面。',
      content: `# Yjs CRDT 多人实时协同图谱批注（待创建页面）\n\n此节点为未解析的双向链接目标。您可以在 Filters 面板中通过「显示未解析链接 (Unresolved Links)」开关控制其显隐。`,
      author: 'System Stub',
      updatedAt: '尚未创建',
      folder: 'unresolved',
      wordCount: 0,
      status: 'unresolved-stub',
    },
    sourceReferences: [
      {
        docId: 'STUB-002',
        path: 'Referenced in /docs/core/incremental-graph-sync.md',
        snippet: 'Planned extension: [[Yjs CRDT 多人实时协同图谱批注]].',
        updatedAt: '2026-11-21',
      },
    ],
  },

  // === Orphan Nodes (孤立节点，无任何入边或出边，用于测试“隐藏孤立节点”) ===
  {
    id: 'orphan-legacy-import',
    title: 'Confluence 历史归档导入草稿 (孤立节点)',
    type: 'page',
    tags: ['#archive', '#orphan', '#notes'],
    group: 'product-spec',
    size: 4,
    resolved: true,
    metadata: {
      summary: '尚未建立任何双向链接或概念关联的独立归档笔记，用于验证“隐藏孤立节点 (Orphan Nodes)”过滤器。',
      content: `# Confluence 历史归档导入草稿\n\n这是一篇刚导入 Minest 但尚未与其他知识页面建立 \`[[双向链接]]\` 的孤立笔记（Orphan Node）。\n\n在 Graph Controls -> Filters 中关闭「孤立节点 (Orphan Nodes)」即可将其从图谱中隐藏；或者使用顶栏「新增知识关系」将其连接到现有知识网络。`,
      author: 'Migration Bot',
      updatedAt: '2026-11-15 08:00',
      folder: 'archive/imports',
      wordCount: 410,
      status: 'draft',
    },
    sourceReferences: [
      {
        docId: 'DOC-ORP-001',
        path: '/archive/confluence-import-2025.md',
        snippet: 'Standalone imported note with zero incoming or outgoing references.',
        updatedAt: '2026-11-15',
      },
    ],
  },
  {
    id: 'orphan-reading-list',
    title: 'PKM 个人知识管理经典文献摘录 (孤立节点)',
    type: 'page',
    tags: ['#pkm', '#reading', '#orphan'],
    group: 'product-spec',
    size: 4,
    resolved: true,
    metadata: {
      summary: '独立读书笔记（包含 Luhmann 卡片盒笔记法与 Memex 摘录），当前无外部连线。',
      content: `# PKM 个人知识管理经典文献摘录\n\n记录 Vannevar Bush《As We May Think》(1945) 与 Niklas Luhmann 卢曼卡片盒（Zettelkasten）的原始文献摘录。当前作为孤立节点存在，等待与核心知识库建立连接。`,
      author: 'Elena Rostova',
      updatedAt: '2026-11-16 20:15',
      folder: 'notes/reading',
      wordCount: 530,
      status: 'draft',
    },
    sourceReferences: [
      {
        docId: 'DOC-ORP-002',
        path: '/notes/reading/pkm-literature-notes.md',
        snippet: 'Standalone reading note on Memex and Zettelkasten principles.',
        updatedAt: '2026-11-16',
      },
    ],
  },
];

const CORE_EDGES: KnowledgeEdge[] = [
  // 1. Living Knowledge 核心引擎内部与跨模块真实连接
  {
    id: 'e-lk-1',
    source: 'lk-engine-overview',
    target: 'lk-ast-parser',
    relationshipType: 'wiki-relation',
    weight: 1.0,
    verified: true,
    evidenceReferences: [
      {
        sourceDocId: 'DOC-LK-001',
        quote: '多源统一接口：同时接纳 [[Markdown AST 双向链接解析器]] 与 Wiki 索引服务。',
        confidence: 1.0,
        verified: true,
        extractedBy: 'wiki-engine',
      },
    ],
  },
  {
    id: 'e-lk-2',
    source: 'lk-engine-overview',
    target: 'lk-backlink-index',
    relationshipType: 'wiki-relation',
    weight: 1.0,
    verified: true,
    evidenceReferences: [
      {
        sourceDocId: 'DOC-LK-001',
        quote: 'AST 解析结果实时写入 [[双向链接倒排索引服务]] 以维护入边邻接表。',
        confidence: 1.0,
        verified: true,
        extractedBy: 'wiki-engine',
      },
    ],
  },
  {
    id: 'e-lk-3',
    source: 'lk-engine-overview',
    target: 'lk-wiki-hierarchy',
    relationshipType: 'wiki-relation',
    weight: 0.9,
    verified: true,
    evidenceReferences: [
      {
        sourceDocId: 'DOC-LK-001',
        quote: '结构化文档通过 [[Wiki 知识层级索引服务]] 同步目录关系。',
        confidence: 1.0,
        verified: true,
        extractedBy: 'wiki-engine',
      },
    ],
  },
  {
    id: 'e-lk-4',
    source: 'lk-engine-overview',
    target: 'lk-schema-spec',
    relationshipType: 'markdown-link',
    weight: 1.0,
    verified: true,
    evidenceReferences: [
      {
        sourceDocId: 'DOC-LK-001',
        quote: '所有实体遵循 [[统一知识图谱数据接口规范]] 定义的 Node 与 Edge 契约。',
        confidence: 1.0,
        verified: true,
        extractedBy: 'markdown-parser',
      },
    ],
  },
  {
    id: 'e-lk-5',
    source: 'lk-ast-parser',
    target: 'lk-backlink-index',
    relationshipType: 'markdown-link',
    weight: 0.95,
    verified: true,
    evidenceReferences: [
      {
        sourceDocId: 'DOC-LK-002',
        quote: '增量解析出的 WikiLink Token 直接推送至 [[双向链接倒排索引服务]]。',
        confidence: 1.0,
        verified: true,
        extractedBy: 'markdown-parser',
      },
    ],
  },
  {
    id: 'e-lk-6',
    source: 'lk-schema-spec',
    target: 'lk-citation-verifier',
    relationshipType: 'markdown-link',
    weight: 0.9,
    verified: true,
    evidenceReferences: [
      {
        sourceDocId: 'DOC-LK-005',
        quote: '通过 [[知识引用真实性校验器]] 校验每条边的 evidenceReferences。',
        confidence: 1.0,
        verified: true,
        extractedBy: 'markdown-parser',
      },
    ],
  },
  {
    id: 'e-lk-7',
    source: 'lk-engine-overview',
    target: 'lk-realtime-sync',
    relationshipType: 'wiki-relation',
    weight: 0.85,
    verified: true,
    evidenceReferences: [
      {
        sourceDocId: 'DOC-LK-001',
        quote: '图谱前端通过 [[知识图谱增量变更同步协议]] 接收知识变更。',
        confidence: 1.0,
        verified: true,
        extractedBy: 'wiki-engine',
      },
    ],
  },

  // 2. Graph View 渲染与物理集群内部连接
  {
    id: 'e-gv-1',
    source: 'gv-canvas-renderer',
    target: 'gv-physics-spec',
    relationshipType: 'markdown-link',
    weight: 1.0,
    verified: true,
    evidenceReferences: [
      {
        sourceDocId: 'DOC-GV-001',
        quote: '渲染循环每帧读取 [[力导向物理引擎参数规范]] 计算出的节点坐标。',
        confidence: 1.0,
        verified: true,
        extractedBy: 'markdown-parser',
      },
    ],
  },
  {
    id: 'e-gv-2',
    source: 'gv-canvas-renderer',
    target: 'gv-local-graph',
    relationshipType: 'wiki-relation',
    weight: 0.95,
    verified: true,
    evidenceReferences: [
      {
        sourceDocId: 'DOC-GV-001',
        quote: '支持 Global Graph 与 [[Local Graph 局部知识网络推导]] 两种视图模式无缝切换。',
        confidence: 1.0,
        verified: true,
        extractedBy: 'wiki-engine',
      },
    ],
  },
  {
    id: 'e-gv-3',
    source: 'gv-canvas-renderer',
    target: 'gv-quadtree-hit',
    relationshipType: 'markdown-link',
    weight: 0.9,
    verified: true,
    evidenceReferences: [
      {
        sourceDocId: 'DOC-GV-001',
        quote: '指针悬停拾取依托 [[四叉树空间索引与拾取优化]] 在 O(log N) 时间内完成。',
        confidence: 1.0,
        verified: true,
        extractedBy: 'markdown-parser',
      },
    ],
  },
  {
    id: 'e-gv-4',
    source: 'gv-canvas-renderer',
    target: 'gv-lod-culling',
    relationshipType: 'markdown-link',
    weight: 0.95,
    verified: true,
    evidenceReferences: [
      {
        sourceDocId: 'DOC-GV-001',
        quote: '大规模节点下启用 [[大规模节点 LOD 分层渲染策略]] 进行视口裁剪。',
        confidence: 1.0,
        verified: true,
        extractedBy: 'markdown-parser',
      },
    ],
  },
  {
    id: 'e-gv-5',
    source: 'gv-canvas-renderer',
    target: 'gv-touch-gestures',
    relationshipType: 'wiki-relation',
    weight: 0.9,
    verified: true,
    evidenceReferences: [
      {
        sourceDocId: 'DOC-GV-001',
        quote: '绑定 [[桌面与移动端多点触控交互手势]] 处理滚轮、双指捏合与节点拖拽。',
        confidence: 1.0,
        verified: true,
        extractedBy: 'wiki-engine',
      },
    ],
  },
  {
    id: 'e-gv-6',
    source: 'gv-physics-spec',
    target: 'gv-quadtree-hit',
    relationshipType: 'markdown-link',
    weight: 0.85,
    verified: true,
    evidenceReferences: [
      {
        sourceDocId: 'DOC-GV-002',
        quote: 'Repulsion 排斥力使用 [[四叉树空间索引与拾取优化]] 进行 Barnes-Hut 近似。',
        confidence: 1.0,
        verified: true,
        extractedBy: 'markdown-parser',
      },
    ],
  },
  {
    id: 'e-gv-7',
    source: 'gv-local-graph',
    target: 'lk-backlink-index',
    relationshipType: 'markdown-link',
    weight: 0.95,
    verified: true,
    evidenceReferences: [
      {
        sourceDocId: 'DOC-GV-003',
        quote: 'Local Graph 依托 [[双向链接倒排索引服务]] 实现 1~3 跳邻居瞬时查询。',
        confidence: 1.0,
        verified: true,
        extractedBy: 'markdown-parser',
      },
    ],
  },

  // 3. 项目决策 (ADR) 与各核心模块的决策关联
  {
    id: 'e-adr-1',
    source: 'adr-001-canvas-d3',
    target: 'gv-canvas-renderer',
    relationshipType: 'project-decision',
    weight: 1.0,
    verified: true,
    evidenceReferences: [
      {
        sourceDocId: 'ADR-2026-001',
        quote: '该 ADR 确立了 [[Obsidian Graph View 2D 核心渲染器]] 的技术架构。',
        confidence: 1.0,
        verified: true,
        extractedBy: 'adr-registry',
      },
    ],
  },
  {
    id: 'e-adr-2',
    source: 'adr-001-canvas-d3',
    target: 'gv-physics-spec',
    relationshipType: 'project-decision',
    weight: 0.95,
    verified: true,
    evidenceReferences: [
      {
        sourceDocId: 'ADR-2026-001',
        quote: '选定 d3-force 作为 [[力导向物理引擎参数规范]] 的唯一物理内核。',
        confidence: 1.0,
        verified: true,
        extractedBy: 'adr-registry',
      },
    ],
  },
  {
    id: 'e-adr-3',
    source: 'adr-002-evidence-edge',
    target: 'lk-schema-spec',
    relationshipType: 'project-decision',
    weight: 1.0,
    verified: true,
    evidenceReferences: [
      {
        sourceDocId: 'ADR-2026-002',
        quote: '要求 [[统一知识图谱数据接口规范]] 必须包含 evidenceReferences 字段。',
        confidence: 1.0,
        verified: true,
        extractedBy: 'adr-registry',
      },
    ],
  },
  {
    id: 'e-adr-4',
    source: 'adr-002-evidence-edge',
    target: 'lk-citation-verifier',
    relationshipType: 'project-decision',
    weight: 0.95,
    verified: true,
    evidenceReferences: [
      {
        sourceDocId: 'ADR-2026-002',
        quote: '由 [[知识引用真实性校验器]] 强制执行真实引用与 AI 推断关系的区分。',
        confidence: 1.0,
        verified: true,
        extractedBy: 'adr-registry',
      },
    ],
  },
  {
    id: 'e-adr-5',
    source: 'adr-002-evidence-edge',
    target: 'ai-concept-pipeline',
    relationshipType: 'project-decision',
    weight: 0.9,
    verified: true,
    evidenceReferences: [
      {
        sourceDocId: 'ADR-2026-002',
        quote: '规范了 [[AI 概念关系提取流水线]] 输出边的 verified=false 标记义务。',
        confidence: 1.0,
        verified: true,
        extractedBy: 'adr-registry',
      },
    ],
  },
  {
    id: 'e-adr-6',
    source: 'adr-003-2d-first',
    target: 'prod-obsidian-benchmark',
    relationshipType: 'project-decision',
    weight: 0.9,
    verified: true,
    evidenceReferences: [
      {
        sourceDocId: 'ADR-2026-003',
        quote: '集中资源达成 [[Obsidian Graph View 交互还原基准清单]] 的 2D 体验目标。',
        confidence: 1.0,
        verified: true,
        extractedBy: 'adr-registry',
      },
    ],
  },
  {
    id: 'e-adr-7',
    source: 'adr-004-hot-simulation',
    target: 'gv-physics-spec',
    relationshipType: 'project-decision',
    weight: 0.95,
    verified: true,
    evidenceReferences: [
      {
        sourceDocId: 'ADR-2026-004',
        quote: '规定调节 [[力导向物理引擎参数规范]] 时必须原地热更新力场参数。',
        confidence: 1.0,
        verified: true,
        extractedBy: 'adr-registry',
      },
    ],
  },
  {
    id: 'e-adr-8',
    source: 'adr-004-hot-simulation',
    target: 'lk-realtime-sync',
    relationshipType: 'project-decision',
    weight: 0.85,
    verified: true,
    evidenceReferences: [
      {
        sourceDocId: 'ADR-2026-004',
        quote: '支撑 [[知识图谱增量变更同步协议]] 在数据更新时保持已有节点坐标稳定。',
        confidence: 1.0,
        verified: true,
        extractedBy: 'adr-registry',
      },
    ],
  },

  // 4. AI 概念提取与语义集群连接（包含真实连接与 AI 推断连接）
  {
    id: 'e-ai-1',
    source: 'lk-engine-overview',
    target: 'ai-concept-pipeline',
    relationshipType: 'wiki-relation',
    weight: 0.9,
    verified: true,
    evidenceReferences: [
      {
        sourceDocId: 'DOC-LK-001',
        quote: 'Living Knowledge 集成 [[AI 概念关系提取流水线]] 作为辅助语义发现层。',
        confidence: 1.0,
        verified: true,
        extractedBy: 'wiki-engine',
      },
    ],
  },
  {
    id: 'e-ai-2',
    source: 'ai-concept-pipeline',
    target: 'ai-entity-disambiguation',
    relationshipType: 'markdown-link',
    weight: 0.9,
    verified: true,
    evidenceReferences: [
      {
        sourceDocId: 'DOC-AI-001',
        quote: '提取出的候选术语先经过 [[跨文档实体消歧与同义词归并]] 归一化。',
        confidence: 1.0,
        verified: true,
        extractedBy: 'markdown-parser',
      },
    ],
  },
  {
    id: 'e-ai-3',
    source: 'ai-concept-pipeline',
    target: 'ai-confidence-threshold',
    relationshipType: 'markdown-link',
    weight: 0.95,
    verified: true,
    evidenceReferences: [
      {
        sourceDocId: 'DOC-AI-001',
        quote: '输出前执行 [[AI 推断关系置信度校准规范]] 过滤低置信度噪声。',
        confidence: 1.0,
        verified: true,
        extractedBy: 'markdown-parser',
      },
    ],
  },
  {
    id: 'e-ai-4',
    source: 'ai-concept-pipeline',
    target: 'ai-hybrid-search',
    relationshipType: 'wiki-relation',
    weight: 0.85,
    verified: true,
    evidenceReferences: [
      {
        sourceDocId: 'DOC-AI-001',
        quote: '提取的概念图谱为 [[向量嵌入与混合检索架构]] 提供拓扑邻近度信号。',
        confidence: 1.0,
        verified: true,
        extractedBy: 'wiki-engine',
      },
    ],
  },
  // AI-extracted edges (verified: false, dashed, with explicit confidence & quote)
  {
    id: 'e-ai-inferred-1',
    source: 'ai-hybrid-search',
    target: 'lk-backlink-index',
    relationshipType: 'ai-extracted',
    weight: 0.78,
    verified: false,
    evidenceReferences: [
      {
        sourceDocId: 'DOC-AI-002',
        quote: '语义分析发现：向量混合检索的 Graph-RAG 重排序直接复用了双向链接倒排索引的二阶邻接矩阵。',
        confidence: 0.89,
        verified: false,
        extractedBy: 'living-knowledge-ai',
      },
    ],
  },
  {
    id: 'e-ai-inferred-2',
    source: 'ai-entity-disambiguation',
    target: 'lk-ast-parser',
    relationshipType: 'ai-extracted',
    weight: 0.75,
    verified: false,
    evidenceReferences: [
      {
        sourceDocId: 'DOC-AI-003',
        quote: '语义分析发现：实体消歧使用的 Alias 映射表与 Markdown AST 解析器的 [[Target|Alias]] 语法树共享同一符号表。',
        confidence: 0.84,
        verified: false,
        extractedBy: 'living-knowledge-ai',
      },
    ],
  },
  {
    id: 'e-ai-inferred-3',
    source: 'ai-confidence-threshold',
    target: 'lk-citation-verifier',
    relationshipType: 'ai-extracted',
    weight: 0.82,
    verified: false,
    evidenceReferences: [
      {
        sourceDocId: 'DOC-AI-004',
        quote: '语义分析发现：置信度校准规范与知识引用真实性校验器共同构成零幻觉质量门禁。',
        confidence: 0.92,
        verified: false,
        extractedBy: 'living-knowledge-ai',
      },
    ],
  },
  {
    id: 'e-ai-inferred-4',
    source: 'gv-lod-culling',
    target: 'ai-hybrid-search',
    relationshipType: 'ai-extracted',
    weight: 0.72,
    verified: false,
    evidenceReferences: [
      {
        sourceDocId: 'DOC-GV-005',
        quote: '语义分析发现：LOD 渲染中使用的节点重要度评分与混合检索中的图中心度权重高度一致。',
        confidence: 0.79,
        verified: false,
        extractedBy: 'living-knowledge-ai',
      },
    ],
  },

  // 5. 产品规范与工作流集群连接
  {
    id: 'e-prod-1',
    source: 'prod-obsidian-benchmark',
    target: 'gv-canvas-renderer',
    relationshipType: 'markdown-link',
    weight: 1.0,
    verified: true,
    evidenceReferences: [
      {
        sourceDocId: 'DOC-PROD-001',
        quote: '视觉与交互基准由 [[Obsidian Graph View 2D 核心渲染器]] 逐项落实。',
        confidence: 1.0,
        verified: true,
        extractedBy: 'markdown-parser',
      },
    ],
  },
  {
    id: 'e-prod-2',
    source: 'prod-obsidian-benchmark',
    target: 'prod-control-panel-spec',
    relationshipType: 'wiki-relation',
    weight: 0.95,
    verified: true,
    evidenceReferences: [
      {
        sourceDocId: 'DOC-PROD-001',
        quote: '包含 [[Graph Controls 四维控制面板设计规范]] 定义的全部过滤器与力场滑块。',
        confidence: 1.0,
        verified: true,
        extractedBy: 'wiki-engine',
      },
    ],
  },
  {
    id: 'e-prod-3',
    source: 'prod-obsidian-benchmark',
    target: 'prod-theme-system',
    relationshipType: 'wiki-relation',
    weight: 0.85,
    verified: true,
    evidenceReferences: [
      {
        sourceDocId: 'DOC-PROD-001',
        quote: '色彩系统遵循 [[Minest 深浅双主题色彩与对比度规范]]。',
        confidence: 1.0,
        verified: true,
        extractedBy: 'wiki-engine',
      },
    ],
  },
  {
    id: 'e-prod-4',
    source: 'prod-control-panel-spec',
    target: 'gv-physics-spec',
    relationshipType: 'markdown-link',
    weight: 0.9,
    verified: true,
    evidenceReferences: [
      {
        sourceDocId: 'DOC-PROD-002',
        quote: 'Forces 折叠面板直接绑定 [[力导向物理引擎参数规范]] 的实时参数。',
        confidence: 1.0,
        verified: true,
        extractedBy: 'markdown-parser',
      },
    ],
  },
  {
    id: 'e-prod-5',
    source: 'prod-daily-research-note',
    target: 'gv-physics-spec',
    relationshipType: 'user-manual',
    weight: 0.9,
    verified: true,
    evidenceReferences: [
      {
        sourceDocId: 'DOC-NOTE-011',
        quote: '作者手动关联：物理阻尼调优手记直接指导了力导向参数默认值的设定。',
        confidence: 1.0,
        verified: true,
        extractedBy: 'human-author',
      },
    ],
  },
  {
    id: 'e-prod-6',
    source: 'prod-daily-research-note',
    target: 'adr-004-hot-simulation',
    relationshipType: 'user-manual',
    weight: 0.85,
    verified: true,
    evidenceReferences: [
      {
        sourceDocId: 'DOC-NOTE-011',
        quote: '作者手动关联：调优实验促成了 ADR-004 常驻物理模拟实例决议。',
        confidence: 1.0,
        verified: true,
        extractedBy: 'human-author',
      },
    ],
  },

  // 6. 未解析链接 (Unresolved Links) 真实引用关系
  {
    id: 'e-unres-1',
    source: 'lk-ast-parser',
    target: 'unres-webgpu-pipeline',
    relationshipType: 'markdown-link',
    weight: 0.7,
    verified: true,
    evidenceReferences: [
      {
        sourceDocId: 'DOC-LK-002',
        quote: '当目标不存在时，生成未解析节点 [[WebGPU 千万级节点计算管线]]。',
        confidence: 1.0,
        verified: true,
        extractedBy: 'markdown-parser',
      },
    ],
  },
  {
    id: 'e-unres-2',
    source: 'gv-lod-culling',
    target: 'unres-webgpu-pipeline',
    relationshipType: 'markdown-link',
    weight: 0.75,
    verified: true,
    evidenceReferences: [
      {
        sourceDocId: 'DOC-GV-005',
        quote: '未来超大规模扩展参见 [[WebGPU 千万级节点计算管线]]。',
        confidence: 1.0,
        verified: true,
        extractedBy: 'markdown-parser',
      },
    ],
  },
  {
    id: 'e-unres-3',
    source: 'lk-realtime-sync',
    target: 'unres-crdt-collab',
    relationshipType: 'markdown-link',
    weight: 0.7,
    verified: true,
    evidenceReferences: [
      {
        sourceDocId: 'DOC-LK-006',
        quote: '后续多端协同规划参见 [[Yjs CRDT 多人实时协同图谱批注]]。',
        confidence: 1.0,
        verified: true,
        extractedBy: 'markdown-parser',
      },
    ],
  },
];

export function getInitialLivingKnowledgeData(): {
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
} {
  return {
    nodes: CORE_NODES.map((n) => ({ ...n })),
    edges: CORE_EDGES.map((e) => ({ ...e })),
  };
}

/**
 * Generates deterministic, structured hierarchical knowledge clusters
 * for testing 500, 1,000, and 5,000 node scale performance targets
 * without random meaningless spaghetti links.
 */
export function generateScaledKnowledgeDataset(
  targetCount: number,
  baseNodes: KnowledgeNode[],
  baseEdges: KnowledgeEdge[]
): { nodes: KnowledgeNode[]; edges: KnowledgeEdge[] } {
  const nodes: KnowledgeNode[] = baseNodes.map((n) => ({
    ...n,
    x: undefined,
    y: undefined,
    vx: undefined,
    vy: undefined,
  }));
  const edges: KnowledgeEdge[] = baseEdges.map((e) => ({
    ...e,
    source: typeof e.source === 'string' ? e.source : e.source.id,
    target: typeof e.target === 'string' ? e.target : e.target.id,
  }));

  if (targetCount <= nodes.length) {
    return { nodes, edges };
  }

  const domainClusters = [
    {
      group: 'core-engine',
      hubIds: ['lk-engine-overview', 'lk-ast-parser', 'lk-backlink-index', 'lk-wiki-hierarchy', 'lk-schema-spec'],
      prefix: 'Engine',
      topicNames: ['AST 词法单元', '增量索引分片', '双向链接锚点', '文档校验快照', 'Workspace 命名空间', '引用完整性规则'],
      tags: ['#core', '#architecture', '#living-knowledge'],
      folder: 'core/modules',
    },
    {
      group: 'graph-engine',
      hubIds: ['gv-canvas-renderer', 'gv-physics-spec', 'gv-local-graph', 'gv-quadtree-hit', 'gv-lod-culling'],
      prefix: 'Graph',
      topicNames: ['视口矩阵变换', '四叉树空间分区', '阻尼收敛曲线', '节点碰撞半径', 'Canvas 离屏缓存', '触控手势状态机'],
      tags: ['#graph', '#physics', '#rendering'],
      folder: 'graph/subsystems',
    },
    {
      group: 'adr-decisions',
      hubIds: ['adr-001-canvas-d3', 'adr-002-evidence-edge', 'adr-003-2d-first', 'adr-004-hot-simulation'],
      prefix: 'ADR',
      topicNames: ['架构评审记录', '性能基线决议', '数据契约演进', '端侧渲染策略', '内存预算约束'],
      tags: ['#adr', '#decision'],
      folder: 'adr/records',
    },
    {
      group: 'ai-semantics',
      hubIds: ['ai-concept-pipeline', 'ai-hybrid-search', 'ai-entity-disambiguation', 'ai-confidence-threshold'],
      prefix: 'Semantic',
      topicNames: ['概念实体词条', '上下文向量切片', '同义词消歧映射', 'GraphRAG 召回证据', '语义共现矩阵'],
      tags: ['#ai', '#nlp', '#retrieval'],
      folder: 'ai/concepts',
    },
    {
      group: 'product-spec',
      hubIds: ['prod-obsidian-benchmark', 'prod-control-panel-spec', 'prod-theme-system', 'prod-daily-research-note'],
      prefix: 'Spec',
      topicNames: ['交互验收用例', '快捷键映射表', '色彩对比度令牌', '用户研究访谈', '知识卡片模板'],
      tags: ['#product', '#ux', '#obsidian'],
      folder: 'product/specs',
    },
  ];

  const remaining = targetCount - nodes.length;
  // Create sub-hubs first so large graphs form realistic hierarchical sub-clusters like Obsidian vaults
  const subHubsPerCluster = Math.max(3, Math.floor(remaining / 45));
  const clusterSubHubs: Record<string, string[]> = {};

  domainClusters.forEach((c) => {
    clusterSubHubs[c.group] = [];
  });

  let created = 0;

  // Phase A: Structured Topic Sub-Hubs connected to Core Hubs
  for (let s = 0; s < subHubsPerCluster && created < remaining; s++) {
    for (let cIdx = 0; cIdx < domainClusters.length && created < remaining; cIdx++) {
      const cluster = domainClusters[cIdx];
      const topic = cluster.topicNames[s % cluster.topicNames.length];
      const parentHubId = cluster.hubIds[s % cluster.hubIds.length];
      const subHubId = `subhub-${cluster.group}-${s + 1}`;
      const types: KnowledgeType[] = ['wiki', 'page', 'concept', 'decision'];
      const nodeType: KnowledgeType =
        cluster.group === 'adr-decisions'
          ? 'decision'
          : types[(s + cIdx) % 3];

      nodes.push({
        id: subHubId,
        title: `${cluster.prefix} 专题 ${s + 1}: ${topic}`,
        type: nodeType,
        tags: [cluster.tags[0], cluster.tags[(s + 1) % cluster.tags.length]],
        group: cluster.group,
        size: 6.5,
        resolved: true,
        metadata: {
          summary: `${topic}的子领域聚合专题，汇集相关技术笔记与知识引用证据。`,
          content: `# ${cluster.prefix} 专题 ${s + 1}: ${topic}\n\n本专题归属于 **${cluster.group}** 知识群落，向上关联核心节点 [[${parentHubId}]]，向下聚合该细分领域的具体知识卡片与实践记录。`,
          author: 'Minest Living Knowledge',
          updatedAt: '2026-11-22',
          folder: cluster.folder,
          wordCount: 820,
          status: 'verified',
        },
        sourceReferences: [
          {
            docId: `DOC-SUB-${s + 1}-${cIdx}`,
            path: `/${cluster.folder}/${subHubId}.md`,
            snippet: `Hierarchical topic hub linking ${topic} notes to ${parentHubId}.`,
            updatedAt: '2026-11-22',
          },
        ],
      });

      edges.push({
        id: `e-subhub-${subHubId}`,
        source: parentHubId,
        target: subHubId,
        relationshipType: 'wiki-relation',
        weight: 0.9,
        verified: true,
        evidenceReferences: [
          {
            sourceDocId: `DOC-SUB-${s + 1}-${cIdx}`,
            quote: `Wiki 目录层级关联：${parentHubId} -> ${topic}`,
            confidence: 1.0,
            verified: true,
            extractedBy: 'wiki-engine',
          },
        ],
      });

      clusterSubHubs[cluster.group].push(subHubId);
      created++;
    }
  }

  // Phase B: Leaf knowledge notes attached to sub-hubs with realistic local cross-references
  let leafIndex = 1;
  while (created < remaining) {
    const cluster = domainClusters[created % domainClusters.length];
    const subHubList = clusterSubHubs[cluster.group];
    const parentSubHubId =
      subHubList.length > 0
        ? subHubList[leafIndex % subHubList.length]
        : cluster.hubIds[leafIndex % cluster.hubIds.length];

    const topic = cluster.topicNames[leafIndex % cluster.topicNames.length];
    const isUnresolved = leafIndex % 29 === 0;
    const isAIEdge = !isUnresolved && leafIndex % 7 === 0;
    const nodeId = `node-${cluster.group}-${leafIndex}`;

    const nodeType: KnowledgeType = isUnresolved
      ? 'unresolved'
      : cluster.group === 'adr-decisions'
      ? 'decision'
      : cluster.group === 'ai-semantics'
      ? 'concept'
      : 'page';

    nodes.push({
      id: nodeId,
      title: `${topic} · 笔记 #${leafIndex}`,
      type: nodeType,
      tags: [cluster.tags[leafIndex % cluster.tags.length]],
      group: isUnresolved ? 'unresolved' : cluster.group,
      size: 4,
      resolved: !isUnresolved,
      metadata: {
        summary: `关于「${topic}」的第 ${leafIndex} 号知识条目，连接至专题节点 ${parentSubHubId}。`,
        content: `# ${topic} · 笔记 #${leafIndex}\n\n关联上级专题：[[${parentSubHubId}]]。\n\n该条目用于验证大规模 Living Knowledge 知识库在 ${targetCount} 节点下的力导向自然聚类与 LOD 视口裁剪性能。`,
        author: 'Living Knowledge Vault',
        updatedAt: '2026-11-23',
        folder: cluster.folder,
        wordCount: 460,
        status: isUnresolved ? 'unresolved-stub' : 'verified',
      },
      sourceReferences: [
        {
          docId: `DOC-LEAF-${leafIndex}`,
          path: `/${cluster.folder}/note-${leafIndex}.md`,
          snippet: `Knowledge note #${leafIndex} referencing [[${parentSubHubId}]].`,
          updatedAt: '2026-11-23',
        },
      ],
    });

    edges.push({
      id: `e-leaf-${nodeId}`,
      source: parentSubHubId,
      target: nodeId,
      relationshipType: isAIEdge ? 'ai-extracted' : 'markdown-link',
      weight: isAIEdge ? 0.75 : 0.9,
      verified: !isAIEdge,
      evidenceReferences: [
        {
          sourceDocId: `DOC-LEAF-${leafIndex}`,
          quote: isAIEdge
            ? `AI 语义提取：在「${topic} · 笔记 #${leafIndex}」中检测到与 ${parentSubHubId} 的核心概念共现。`
            : `Markdown 双向链接：[[${parentSubHubId}]]`,
          confidence: isAIEdge ? 0.86 : 1.0,
          verified: !isAIEdge,
          extractedBy: isAIEdge ? 'living-knowledge-ai' : 'markdown-parser',
        },
      ],
    });

    // Deterministic intra-cluster sibling link every 6th note to form authentic local triangles
    if (leafIndex > 6 && leafIndex % 6 === 0 && subHubList.length > 1) {
      const secondaryHub = subHubList[(leafIndex + 1) % subHubList.length];
      if (secondaryHub !== parentSubHubId) {
        edges.push({
          id: `e-cross-${nodeId}`,
          source: nodeId,
          target: secondaryHub,
          relationshipType: 'markdown-link',
          weight: 0.7,
          verified: true,
          evidenceReferences: [
            {
              sourceDocId: `DOC-LEAF-${leafIndex}`,
              quote: `跨专题交叉引用：[[${secondaryHub}]]`,
              confidence: 1.0,
              verified: true,
              extractedBy: 'markdown-parser',
            },
          ],
        });
      }
    }

    created++;
    leafIndex++;
  }

  return { nodes, edges };
}
