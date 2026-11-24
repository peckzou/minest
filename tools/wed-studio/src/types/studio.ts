export type ParkEdition = 'orlando-1971' | 'anaheim-1955';

export type CameraPresetId =
  | 'overview'
  | 'drafting'
  | 'model-table'
  | 'castle-closeup'
  | 'blueprint-wall'
  | 'kem-weber-desk'
  | 'animatronics-lab'
  | 'machine-shop'
  | 'walts-office';

export type BlueprintId =
  | 'cinderella-castle-189'
  | 'florida-project-epcot'
  | 'spaceship-earth-geodesic'
  | 'monorail-contemporary'
  | 'castle-elevation'
  | 'master-plan'
  | 'locomotive-mark1'
  | 'moonliner-tomorrowland';

export type LightingMode =
  | 'studio-day'
  | 'late-night'
  | 'walts-desk-lamp'
  | 'blueprint-xray';

export type VoxelBrushType =
  | 'castle-pink'
  | 'royal-blue'
  | 'gold-spire'
  | 'emerald-tree'
  | 'water-moat'
  | 'red-brick'
  | 'erase';

export interface BlueprintSpec {
  id: BlueprintId;
  parkEdition: ParkEdition;
  code: string;
  title: string;
  subtitle: string;
  architect: string;
  date: string;
  scale: string;
  zoneHighlight: string;
  dimensions: string;
  voxelCount: number;
  notes: string[];
}

export interface ArtifactInfo {
  id: string;
  title: string;
  category: string;
  year: string;
  locationInStudio: string;
  description: string;
  technicalSpecs: { label: string; value: string }[];
  relatedBlueprint?: BlueprintId;
  cameraPreset?: CameraPresetId;
}

export interface CustomVoxelBlock {
  gx: number;
  gy: number;
  gz: number;
  colorHex: number;
  type: Exclude<VoxelBrushType, 'erase'>;
}

export const BLUEPRINT_SPECS: Record<BlueprintId, BlueprintSpec> = {
  'cinderella-castle-189': {
    id: 'cinderella-castle-189',
    parkEdition: 'orlando-1971',
    code: 'WED-ORL-71-001',
    title: '奥兰多灰姑娘城堡 189英尺立面与地下走廊（Utilidor）剖面图',
    subtitle: 'Cinderella Castle · 189 ft Gothic-French Spire & Utilidor Sub-Level',
    architect: 'Herbert Ryman & John Hench',
    date: '1969.11.14',
    scale: '1/8" = 1\'-0" (Orlando Master)',
    zoneHighlight: 'Magic Kingdom Hub & Underground Utilidor Level',
    dimensions: '189.0 ft Spire Height · 27 Towers · Sub-Level Basement Tunnel',
    voxelCount: 2840,
    notes: [
      '高度达 189 英尺（比加州睡美人城堡高出一倍以上），融合枫丹白露宫、子爵城堡与哥特式飞扶壁，顶部设有 27 座深蓝与 24K 鎏金锥形尖塔。',
      '因佛罗里达地下水位极高，首层实际为占地 9 英尺高的「Utilidors 地下综合管廊与员工通道」，整个魔法王国建在二层混凝土甲板之上。',
      '拖动底部「沙盘分层爆炸」滑块，可抬升地表直接检视沙盘底部的奥兰多地下 Utilidor 环形隧道网！',
    ],
  },
  'florida-project-epcot': {
    id: 'florida-project-epcot',
    parkEdition: 'orlando-1971',
    code: 'WED-ORL-66-002',
    title: '奥兰多「佛罗里达计划」与 E.P.C.O.T. 未来实验社区总体蓝图',
    subtitle: 'The Florida Project Master Plan · Magic Kingdom, Seven Seas & EPCOT',
    architect: 'Walt Disney, Marvin Davis & John Hench',
    date: '1966.10.27',
    scale: '1" = 200\'-0" (27,400 Acres Corridor)',
    zoneHighlight: 'North-South Monorail Axis · Magic Kingdom to EPCOT',
    dimensions: '43 Square Miles · High-Speed Alweg Monorail Spine',
    voxelCount: 6420,
    notes: [
      '沃尔特·迪士尼生前最后录制的「Florida Project」总体规划：以高速单轨电车（Monorail）为南北大动脉，串联北端的魔法王国、七海泻湖度假区与南端的 EPCOT 未来实验城市。',
      '采用「环形放射状（Radial Concentric Circles）」城市拓扑：中心为气候受控玻璃穹顶商业核心，外围依次为高密度住宅、绿带公园与工业研发园区。',
      '沙盘模型台完整还原了灰姑娘城堡、地球飞船（Spaceship Earth）、太空山、幽灵公馆以及贯穿当代度假村 A 字大楼的高架单轨电车。',
    ],
  },
  'spaceship-earth-geodesic': {
    id: 'spaceship-earth-geodesic',
    parkEdition: 'orlando-1971',
    code: 'WED-ORL-82-003',
    title: '艾波卡特「地球飞船（Spaceship Earth）」180英尺测地线完整球体结构图',
    subtitle: 'EPCOT Center Spaceship Earth · 11,324 Alucobond Facets Geodesic Sphere',
    architect: 'Wallace Floyd, John Hench & Buckminster Fuller',
    date: '1979.05.20',
    scale: '1/8" = 1\'-0" (Structural Sphere)',
    zoneHighlight: 'EPCOT Entrance Plaza & Reflective Fountain Lagoon',
    dimensions: '180.0 ft Height · 165.0 ft Diameter · 6 Steel Support Legs',
    voxelCount: 1680,
    notes: [
      '人类建筑史上第一座完全悬空的 360° 完整测地线球体（Geodesic Sphere），由三组呈三角形分布的巨型钢柱深入地下 120 英尺支撑，离地悬浮 18 英尺。',
      '外表面由 11,324 块银白复合铝板（Alucobond）拼合为立体四面体棱锥体素，暴雨时雨水经球面导流槽直接汇入下方未来世界人工湖，滴水不落游客头顶。',
      '球体内部盘旋上升着螺旋形「时空飞船（Time Machine）」轨道，直达球顶星空穹顶。',
    ],
  },
  'monorail-contemporary': {
    id: 'monorail-contemporary',
    parkEdition: 'orlando-1971',
    code: 'WED-ORL-71-004',
    title: '华特迪士尼世界 Mark IV 单轨电车与当代度假村 A 字中庭穿行总成',
    subtitle: 'Mark IV Monorail Beamway & Contemporary Resort 14-Story A-Frame Concourse',
    architect: 'Bob Gurr & Welton Becket Associates',
    date: '1970.04.12',
    scale: '1/4" = 1\'-0" (Transit & A-Frame)',
    zoneHighlight: 'East Seven Seas Lagoon & Contemporary Concourse',
    dimensions: '14-Story A-Frame · 26 in Hollow Precast Concrete Beamway',
    voxelCount: 1520,
    notes: [
      '当代度假村（Contemporary Resort）采用 14 层高的巨型 A 字形钢骨斜撑结构，客房如模块化体素盒直接从外部吊装滑入钢架。',
      '中庭大峡谷大厅（Grand Canyon Concourse）内矗立 90 英尺高的玛丽·布莱尔（Mary Blair）五彩陶瓷壁画，Mark IV 单轨电车从大楼正中央凌空穿堂而过。',
      '沙盘模型台右侧还原了这一经典穿楼高架轨道，单轨列车沿混凝土 T 型高架桥持续环线运行。',
    ],
  },
  'castle-elevation': {
    id: 'castle-elevation',
    parkEdition: 'anaheim-1955',
    code: 'WED-DWG-54-001',
    title: '加州睡美人城堡立面与强制透视结构图 (1955)',
    subtitle: 'Sleeping Beauty Castle · Forced Perspective Elevation',
    architect: 'Herb Ryman & Marvin Davis',
    date: '1954.03.18',
    scale: '1/4" = 1\'-0" (Voxel 1:48)',
    zoneHighlight: 'Fantasyland Centerpiece (Anaheim)',
    dimensions: '77.0 ft Total Height · 3 Tier Scale Reduction',
    voxelCount: 1420,
    notes: [
      '采用三段式强制透视（Forced Perspective）：底层石块比例 1:1，中层 5/8，塔尖比例缩至 1/2，使 77 英尺城堡呈现 150 英尺视觉高耸感。',
      '吊桥与护城河采用双层防水混凝土槽体，内嵌循环水泵与水波反射灯槽。',
      '主塔尖顶部覆盖 22K 鎏金叶面体素构件，配巴伐利亚皇家深蓝釉面瓦。',
    ],
  },
  'master-plan': {
    id: 'master-plan',
    parkEdition: 'anaheim-1955',
    code: 'WED-DWG-53-008',
    title: '加州迪士尼乐园总平面「轮辐式」总体规划图 (1955)',
    subtitle: 'Disneyland Master Aerial Layout · Hub & Spoke Topology',
    architect: 'Marvin Davis & Walt Disney',
    date: '1953.09.26',
    scale: '1" = 40\'-0" (Site Master)',
    zoneHighlight: 'Central Plaza & 5 Lands (Anaheim)',
    dimensions: '160 Acres · Single Perimeter Berm & Railroad',
    voxelCount: 4860,
    notes: [
      '首创「中央广场（The Hub）+ 辐射通道（Spokes）」游园动线，游客从美国小镇大街直达中心轴，再辐射至幻想世界、明日世界、探险世界与边疆世界。',
      '外围筑起 15 英尺高环形土堤（Berm），彻底隔绝外部公路视线，圣达菲蒸汽火车沿土堤顶部环形运行。',
      '模型台按 1:48 体素网格精确还原中央花坛、护城河水系与五大主题园区高差。',
    ],
  },
  'locomotive-mark1': {
    id: 'locomotive-mark1',
    parkEdition: 'anaheim-1955',
    code: 'WED-DWG-54-012',
    title: '圣达菲与迪士尼乐园铁路 1号蒸汽机车总成',
    subtitle: '4-4-0 American Standard Steam Locomotive & Main St. Depot',
    architect: 'Roger Broggie & Bob Gurr',
    date: '1954.06.04',
    scale: '5/8 Scale Live Steam (36" Gauge)',
    zoneHighlight: 'Main Street, U.S.A. Perimeter Track',
    dimensions: '36 in Track Gauge · 150 PSI Boiler Pressure',
    voxelCount: 980,
    notes: [
      '基于卡罗尔伍德太平洋铁路（Carolwood Pacific）经验放大设计，采用窄轨 3 英尺轨距，配备黄铜蒸汽汽笛与真实活塞连杆。',
      '美国小镇火车站位于南侧主入口高台，底层设置迎宾米奇花坛（Floral Mickey），二层为全园俯瞰观景廊。',
      '沙盘模型台内嵌闭合椭圆轨道，体素列车按真实时刻表连续环园行驶。',
    ],
  },
  'moonliner-tomorrowland': {
    id: 'moonliner-tomorrowland',
    parkEdition: 'anaheim-1955',
    code: 'WED-DWG-55-004',
    title: '明日世界 TWA 登月火箭与太空时代天际线',
    subtitle: 'TWA Moonliner Rocket · 1986 Lunar Flight Pavilion',
    architect: 'John Hench & Wernher von Braun',
    date: '1955.01.14',
    scale: '1/8" = 1\'-0" (Vertical Tower)',
    zoneHighlight: 'Tomorrowland East Plaza',
    dimensions: '76.0 ft Rocket Spire · Tri-Fin Landing Gear',
    voxelCount: 840,
    notes: [
      '由约翰·亨奇（John Hench）联合火箭科学家构思，流线型白色箭体配 TWA 红白格纹涂装与三翼着陆支撑脚。',
      '箭体高度达 76 英尺，与睡美人城堡形成东西双地标视觉平衡，底部设有伸缩式登机栈桥与环形太空舱体验馆。',
      '旁侧配置旋转星际喷气机（Astro Jets）高架发射塔与 Autopia 未来高速公路导轨。',
    ],
  },
};

export const STUDIO_ARTIFACTS: Record<string, ArtifactInfo> = {
  'drafting-board': {
    id: 'drafting-board',
    title: '1954 橡木可倾式复古工程绘图板',
    category: 'Imagineering 核心工作台',
    year: '1953 · Burbank WED Studio',
    locationInStudio: '工坊西侧采光区 (West Studio Bay)',
    description:
      '幻想工程师（Imagineers）绘制迪士尼乐园第一版建筑立面与机械总成图的重型橡木绘图桌。桌面铺设防眩光复古深绿亚麻油毡垫，配备滑轮平衡平行尺、胡桃木黄铜丁字尺、赛璐珞三角板、比例分规以及双臂平衡万向绘图台灯。',
    technicalSpecs: [
      { label: '桌面倾角', value: '0° – 35° 无级可调（支持爆炸视图拆解）' },
      { label: '绘图工具', value: '黄铜丁字尺 · 45°/60° 三角板 · 精密分规 · 针管笔' },
      { label: '照明系统', value: 'Dazor 双臂弹簧平衡复古绿罩白炽台灯 (2700K)' },
      { label: '当前铺展图纸', value: '可随时在底部控制坞切换 4 套历史蓝图' },
    ],
    relatedBlueprint: 'castle-elevation',
    cameraPreset: 'drafting',
  },
  'model-table': {
    id: 'model-table',
    title: '迪士尼乐园 1:48 体素微缩总规沙盘台',
    category: '空间规划与立体模型台',
    year: '1954 · Master Diorama Table',
    locationInStudio: '工坊中央核心区 (Center Studio Floor)',
    description:
      '沃尔特·迪士尼要求所有园区建筑在施工前必须先制作三维比例模型，以便以游客视线高度（Eye-Level）检验空间尺度与视觉过渡。本微缩沙盘台完整呈现了美国小镇大街、中央广场、睡美人城堡、明日世界登月火箭、探险世界丛林河道与环园蒸汽火车。',
    technicalSpecs: [
      { label: '沙盘尺寸', value: '8.4m × 6.4m 实木与黄铜包角模型台' },
      { label: '园区结构', value: '五大主题园区 · 环形铁路 · 护城河水系' },
      { label: '交互建造', value: '支持直接在沙盘网格上点击搭建或移除自定义体素块' },
      { label: '工程模式', value: '支持一键展开「分层爆炸视图」与「蓝图透视模式」' },
    ],
    relatedBlueprint: 'master-plan',
    cameraPreset: 'model-table',
  },
  'castle-model': {
    id: 'castle-model',
    title: '睡美人城堡（Sleeping Beauty Castle）体素模型',
    category: '幻想世界核心地标',
    year: '1954 · Herb Ryman Prototype',
    locationInStudio: '沙盘台中央北轴线 (North Axis Hub)',
    description:
      '灵感源自德国新天鹅堡与法国圣米歇尔山。模型采用暖白石灰岩体素基座、柔粉上层城墙与巴伐利亚皇室蓝锥形塔顶。通过上小下大的强制透视体素阶梯排布，在沙盘上展现出极具童话感的垂直韵律。',
    technicalSpecs: [
      { label: '建筑原型', value: 'Neuschwanstein 融合法式哥特塔楼' },
      { label: '体素材质', value: '暖白石材 / 柔粉灰泥 / 皇室蓝釉瓦 / 22K 鎏金塔尖' },
      { label: '水景系统', value: '环绕式翡翠护城河与拱形石桥吊门' },
      { label: '可动细节', value: '后方亚瑟王旋转木马与疯帽子茶杯实时运转' },
    ],
    relatedBlueprint: 'castle-elevation',
    cameraPreset: 'castle-closeup',
  },
  'steam-train': {
    id: 'steam-train',
    title: '圣达菲 1号（C.K. Holliday）体素蒸汽火车',
    category: '交通与动力工程模型',
    year: '1954 · WED Machine Shop',
    locationInStudio: '沙盘外环铁道与南侧小镇车站',
    description:
      '4-4-0 美式古典蒸汽机车，配备鲜红排障器、黄铜蒸汽包、煤水车与明黄客车厢。列车沿沙盘外围环形轨道持续运行，并伴有体素蒸汽烟云与车头暖光照明。',
    technicalSpecs: [
      { label: '轮式排列', value: '4-4-0 American Standard + 煤水车 + 2节观光车厢' },
      { label: '运行速度', value: '可在底部控制栏调节沙盘运转倍率或暂停检视' },
      { label: '配套站点', value: 'Main Street 维多利亚红砖钟楼火车站与米奇花坛' },
      { label: '负责工程师', value: 'Roger Broggie (WED 机械工坊主管)' },
    ],
    relatedBlueprint: 'locomotive-mark1',
    cameraPreset: 'model-table',
  },
  'moonliner-model': {
    id: 'moonliner-model',
    title: '明日世界 TWA 登月火箭（Moonliner）与星际喷气机',
    category: '明日世界航空航天模型',
    year: '1955 · Tomorrowland Division',
    locationInStudio: '沙盘台东侧园区 (East Tomorrowland)',
    description:
      '1950年代太空黄金时代的象征。高耸的流线型白红体素火箭伫立于发射平台上，旁侧配有高速旋转的 Astro Jets 星际喷气机与未来感白金展馆。',
    technicalSpecs: [
      { label: '火箭涂装', value: '高光钛白箭体 + 经典航空红格纹尾翼' },
      { label: '附属设施', value: '可动旋转发射塔架 · 环形太空舱回廊' },
      { label: '夜间特效', value: '深夜模式下底部推进器与发射架发出暖橙与冷蓝辉光' },
      { label: '负责设计师', value: 'John Hench & 太空顾问团队' },
    ],
    relatedBlueprint: 'moonliner-tomorrowland',
    cameraPreset: 'model-table',
  },
  'blueprint-wall': {
    id: 'blueprint-wall',
    title: '蓝图悬挂架、玛丽·布莱尔色彩板与分镜故事墙',
    category: '概念艺术与工程档案墙',
    year: '1954 · WED Concept & Storyboard Wall',
    locationInStudio: '工坊北侧主墙 (North Archive Wall)',
    description:
      '沃尔特·迪士尼习惯通过整墙的故事板（Storyboards）推敲游园叙事节奏。墙面悬挂多幅大幅铁氰酸盐晒图蓝图、Mary Blair 色彩设定色卡、带状态图钉的分镜手稿，以及右侧 24 格立式施工图纸卷筒木柜与复古挂钟。',
    technicalSpecs: [
      { label: '蓝图工艺', value: '铁氰酸盐古典晒图（普鲁士蓝底 + 亮白工程线）' },
      { label: '馆藏图纸', value: '4 套完整建筑/机械蓝图 + 12 张概念分镜与色卡' },
      { label: '档案木柜', value: '右侧立式图纸卷筒柜，存放 24 卷分区施工图与索引帽' },
      { label: '叙事体系', value: '采用电影分镜法则规划游客每一步的视觉焦点（Weenie）' },
    ],
    relatedBlueprint: 'master-plan',
    cameraPreset: 'blueprint-wall',
  },
  'kem-weber-multiplane': {
    id: 'kem-weber-multiplane',
    title: 'Kem Weber 传奇透光动画桌与多平面景深摄影机塔架',
    category: '伯班克传统动画与视觉景深工位',
    year: '1937–1954 · Burbank Animation Wing',
    locationInStudio: '工坊西北侧采光区 (Northwest Animation Bay)',
    description:
      '由工业设计大师 Kem Weber 为迪士尼伯班克片场量身定制的流线型胡桃木动画桌，内嵌背光旋转动画圆盘（Animation Disc）与 Acme 定位尺；旁侧矗立着 Ub Iwerks 研发的「多平面摄影机（Multiplane Camera）」微缩实验塔，通过多层玻璃画框实测睡美人城堡的纵深透视。',
    technicalSpecs: [
      { label: '动画转盘', value: '360° 可旋转毛玻璃透光圆盘 + 黄铜 Acme 定位销' },
      { label: '多平面塔架', value: '3 层独立高度玻璃景深画板（远景天空/中景森林/近景城堡）' },
      { label: '侧翼配置', value: '赛璐珞颜料格、律表（X-Sheet）夹板与翻页铅笔稿' },
      { label: '空间转化', value: '将二维多平面景深原理直接转化为乐园三维强制透视建筑' },
    ],
    relatedBlueprint: 'castle-elevation',
    cameraPreset: 'kem-weber-desk',
  },
  'little-man-lab': {
    id: 'little-man-lab',
    title: '「小人计划（Project Little Man）」机械动捕与提基鸟实验台',
    category: 'Audio-Animatronics 机械电子实验室',
    year: '1951–1954 · Wathel Rogers & Roger Broggie Lab',
    locationInStudio: '工坊东侧电子机械区 (East Animatronics Bay)',
    description:
      '迪士尼机械动画（Audio-Animatronics）的诞生地！工作台左侧为著名的 9 英寸高「Project Little Man（巴迪·埃布森踢踏舞小人）」微型舞台与机械连杆，中段为凸轮齿轮驱动的体素提基金刚鹦鹉，右侧配备 Tektronix 阴极射线示波器、Ampex 双盘磁带脉冲记录仪与 Blaine Gibson 的泥塑转台。',
    technicalSpecs: [
      { label: '核心原型', value: '9 英寸踢踏舞机械小人 + 魅惑提基房机械鹦鹉' },
      { label: '控制介质', value: 'Ampex 开盘磁带机记录音频与凸轮电磁阀同步脉冲' },
      { label: '监测仪器', value: '复古绿屏 CRT 阴极射线示波器（实时正弦/方波脉冲）' },
      { label: '雕塑工位', value: 'Blaine Gibson 灰泥塑像旋转台（丛林巡航河马泥稿）' },
    ],
    relatedBlueprint: 'master-plan',
    cameraPreset: 'animatronics-lab',
  },
  'lilly-belle-shop': {
    id: 'lilly-belle-shop',
    title: 'Roger Broggie 精密机械车床与「礼利贝尔号」蒸汽机车装配台',
    category: 'WED 精密机械工坊 (Machine Shop)',
    year: '1950–1954 · Carolwood Pacific & WED Shop',
    locationInStudio: '工坊东南侧重工区 (Southeast Machine Bay)',
    description:
      '迪士尼乐园的想法最初诞生于沃尔特后院的 1:8 比例卡罗尔伍德太平洋铁路。本装配台架设在黄铜测功滚轮轨上，展示正在调试连杆与蒸汽汽缸的「Lilly Belle（礼利贝尔 173 号）」大比例体素蒸汽机车，旁配精密金属车床、红漆五金抽屉柜与挂满扳手卡尺的洞洞板工具墙。',
    technicalSpecs: [
      { label: '展示机车', value: '1:8 大比例 Central Pacific #173 "Lilly Belle" 活蒸汽机车' },
      { label: '测试台架', value: '黄铜滚轮测功试验轨（驱动轮与连杆实时运转）' },
      { label: '机床设备', value: 'South Bend 精密微型金属车床 + 台式砂轮机 + 虎钳' },
      { label: '工具挂墙', value: '全套英制开口扳手、外卡规、游标卡尺与铁路黄铜提灯' },
    ],
    relatedBlueprint: 'locomotive-mark1',
    cameraPreset: 'machine-shop',
  },
  'herb-ryman-easel': {
    id: 'herb-ryman-easel',
    title: '1953 赫伯·莱曼（Herb Ryman）周末传奇鸟瞰概念画架',
    category: '乐园融资与总体概念手稿',
    year: '1953.09.26–27 · The Historic Weekend Sketch',
    locationInStudio: '绘图板与沙盘台之间 (Center-West Floor)',
    description:
      '1953 年 9 月的一个周末，沃尔特·迪士尼陪伴画家好友 Herb Ryman 在伯班克工作室连续奋战 42 小时，绘制出第一幅完整的迪士尼乐园鸟瞰全景画，供罗伊·迪士尼于周一前往纽约向 ABC 电视台筹集建设资金。画架旁摆放着调色盘、水粉颜料管与炭笔盒。',
    technicalSpecs: [
      { label: '创作耗时', value: '1953年9月26日至27日连续 42 小时通宵手绘' },
      { label: '画幅媒介', value: '大幅棕褐炭笔线稿 + 水彩与水粉上色渲染板' },
      { label: '历史意义', value: '直接促成 ABC 电视网投资并确立乐园「轮辐式」布局' },
      { label: '配套画具', value: '三脚榉木画架 · 调色木盘 · 温莎牛顿水粉管' },
    ],
    relatedBlueprint: 'master-plan',
    cameraPreset: 'drafting',
  },
  'matterhorn-model': {
    id: 'matterhorn-model',
    title: '马特洪峰雪山（Matterhorn）与马克·吐温号明轮船体素模型',
    category: '沙盘新增地形与水系模型',
    year: '1954–1959 · Alpine & Frontier Expansion',
    locationInStudio: '沙盘东北侧雪山与西侧美国河域',
    description:
      '沙盘模型台新增阿尔卑斯冰雪孤峰「马特洪峰」体素假山模型（含冰川瀑布与雪橇穿山孔洞），并在西侧河道配置带有红色尾明轮实时旋转的「马克·吐温号（Mark Twain Riverboat）」三层蒸汽游船与小飞象旋转游乐设施。',
    technicalSpecs: [
      { label: '马特洪峰', value: '1:100 瑞士原山缩比 · 内部镂空钢结构体素山体' },
      { label: '水系景观', value: '山顶冰川融水瀑布直泻幻想世界碧蓝泻湖' },
      { label: '马克吐温号', value: '三层白金甲板 + 船尾鲜红明轮桨叶实时旋转' },
      { label: '幻想世界', value: '新增小飞象（Dumbo）空中旋转飞舱与海盗船模型' },
    ],
    relatedBlueprint: 'master-plan',
    cameraPreset: 'model-table',
  },
  'cinderella-castle-model': {
    id: 'cinderella-castle-model',
    title: '奥兰多灰姑娘城堡（Cinderella Castle 189ft）与地下 Utilidor 管廊模型',
    category: '奥兰多魔法王国核心地标',
    year: '1971 · WED Florida Project Centerpiece',
    locationInStudio: '沙盘台中央北轴线及地下首层管廊',
    description:
      '高达 189 英尺的法式哥特宫殿体素模型，采用银灰花岗岩基座、象牙白高塔、飞扶壁与皇家深蓝鎏金尖顶。城堡下方沙盘底座内嵌奥兰多著名的「Utilidors 地下综合走廊系统」，拖动底部「沙盘分层爆炸」滑块即可抬升地表，透视底层环形隧道与 DACS 中控室！',
    technicalSpecs: [
      { label: '建筑高度', value: '189.0 英尺（27 座尖塔 · 三段式强制透视）' },
      { label: '地下工程', value: '首层 Utilidor 环形混凝土管廊 + 气动垃圾传输网 (AVAC)' },
      { label: '主拱廊细节', value: '正面哥特镀金钟楼 + 穿堂马赛克拱形走廊' },
      { label: '负责设计师', value: 'Herbert Ryman & John Hench (WED Florida Division)' },
    ],
    relatedBlueprint: 'cinderella-castle-189',
    cameraPreset: 'castle-closeup',
  },
  'spaceship-earth-model': {
    id: 'spaceship-earth-model',
    title: '艾波卡特「地球飞船（Spaceship Earth）」180英尺测地线完整球体模型',
    category: 'EPCOT Center 未来世界核心地标',
    year: '1982 · WED & Buckminster Fuller Concept',
    locationInStudio: '奥兰多沙盘南轴核心区 (South EPCOT Plaza)',
    description:
      '奥兰多「佛罗里达计划」的灵魂象征！由 3 组 V 形斜撑钢柱托举在镜面水池上空的 360° 完整银白测地线体素球体。外层呈现 Alucobond 银灰三角四面体晶格切面，在工坊灯光下折射出璀璨的未来主义金属光泽。',
    technicalSpecs: [
      { label: '几何构造', value: '五频二十面体测地线球（Geodesic Sphere · 直径 165 ft）' },
      { label: '表皮材质', value: '11,324 块银白复合铝板棱锥 + 内部双层防水球壳' },
      { label: '支撑体系', value: '6 根重型钢箱梁柱架空 18 英尺，与高架单轨电车交汇' },
      { label: '关联图纸', value: '点击「查看关联蓝图」可检视地球飞船结构剖面图' },
    ],
    relatedBlueprint: 'spaceship-earth-geodesic',
    cameraPreset: 'model-table',
  },
  'contemporary-monorail-model': {
    id: 'contemporary-monorail-model',
    title: '当代度假村 14 层 A 字大楼与穿堂 Mark IV 高架单轨电车',
    category: '奥兰多立体交通与现代主义建筑',
    year: '1971 · Bob Gurr & Welton Becket Design',
    locationInStudio: '奥兰多沙盘东侧七海泻湖区 (East Lagoon Bay)',
    description:
      '复刻华特迪士尼世界最具未来感的建筑奇观：14 层高的混凝土与玻璃 A 字形巨构酒店（Disney’s Contemporary Resort），内部中空大峡谷中庭设有玛丽·布莱尔巨幅壁画，流线型白色 Mark IV 单轨电车沿 T 型高架桥直接从大楼腹地穿堂而过！',
    technicalSpecs: [
      { label: '建筑形态', value: '14 层高 A 字钢骨预制体素客房模块结构' },
      { label: '单轨系统', value: 'Bob Gurr 设计 Mark IV 跨座式高架单轨（实时穿楼运行）' },
      { label: '中庭景观', value: '90 英尺高大峡谷中庭壁画柱 + 室内高架站台' },
      { label: '交通网络', value: '串联魔法王国、当代度假村与南端地球飞船广场' },
    ],
    relatedBlueprint: 'monorail-contemporary',
    cameraPreset: 'model-table',
  },
  'space-mountain-model': {
    id: 'space-mountain-model',
    title: '奥兰多太空山（Space Mountain）锥形肋状穹顶与幽灵公馆模型',
    category: '魔法王国东西双翼地标',
    year: '1971–1975 · Tomorrowland & Liberty Square',
    locationInStudio: '奥兰多沙盘东北与西北园区',
    description:
      '东侧明日世界伫立着直径 300 英尺、由 72 根白色预制混凝土肋梁组成的初代「太空山（Space Mountain）」圆锥穹顶；西侧自由广场（Liberty Square）则座落着哈德逊河哥特复兴风格的红砖「幽灵公馆（The Haunted Mansion）」与自由号明轮蒸汽船。',
    technicalSpecs: [
      { label: '太空山结构', value: '183 英尺高白色放射肋梁锥形穹顶（1975 初代全球首发）' },
      { label: '幽灵公馆', value: '奥兰多专属哥特红砖与深绿孟莎屋顶庄园造型' },
      { label: '水系设施', value: '七海泻湖与美国河域双水系 + 自由女神号明轮蒸汽船' },
      { label: '负责团队', value: 'John Hench, Claude Coats & Marc Davis' },
    ],
    relatedBlueprint: 'florida-project-epcot',
    cameraPreset: 'model-table',
  },
  'walts-office-desk': {
    id: 'walts-office-desk',
    title: '沃尔特·迪士尼 3H 总裁办公室：Kem Weber 弧形红木办公桌与私人珍藏',
    category: '伯班克动画大楼 3H 历史行政套房',
    year: '1939–1966 · Suite 3H Executive Office',
    locationInStudio: '工坊西南侧行政套房区 (Southwest Suite 3H Wing)',
    description:
      '复刻伯班克片场动画大楼三楼著名的「Suite 3H」沃尔特·迪士尼私人办公室。核心为工业设计大师 Kem Weber 定制的流线型加州红木树瘤弧形办公桌（Curved Redwood Desk）；桌面陈列着沃尔特最钟爱的卡罗尔伍德太平洋黄铜蒸汽机车微缩模型、Norman Rockwell 绘制的女儿肖像画框、1950年代贝尔旋转拨号电话、跨部门对讲机、双支装墨水笔座与瓷茶杯；后方墙面还悬挂着带丝绒帘幕的「佛罗里达计划（The Florida Project）」绝密购地地图。',
    technicalSpecs: [
      { label: '定制办公桌', value: 'Kem Weber 1939 流线型加州红木与胡桃树瘤弧形总裁桌' },
      { label: '桌面珍藏', value: 'C.P. Huntington 黄铜火车头模型 · 女儿肖像相框 · 旋转电话与对讲机' },
      { label: '绝密挂图', value: '拉帘式佛罗里达 Reedy Creek 27,400 英亩化名购地战略地图' },
      { label: '展示陈列柜', value: '沃尔特私人收藏的 16 件微缩骨瓷动物、发条玩具与旋转八音盒' },
    ],
    relatedBlueprint: 'florida-project-epcot',
    cameraPreset: 'walts-office',
  },
  'walts-piano-oscars': {
    id: 'walts-piano-oscars',
    title: '1939《白雪公主》1+7 奥斯卡特别金像奖座与谢尔曼兄弟三角钢琴',
    category: 'Suite 3H 荣誉奖柜与音乐创作角',
    year: '1939–1964 · Academy Award & Sherman Bros. Piano',
    locationInStudio: '3H 办公室弧形奖杯柜与右侧红毯区',
    description:
      '在沃尔特办公桌后方的胡桃木弧形陈列柜上，摆放着电影史上最传奇的奖杯——1939年第11届奥斯卡由秀兰·邓波儿颁发的《白雪公主和七个小矮人》特别成就奖（1尊标准尺寸奥斯卡金像 + 7尊按阶梯排列的七个小矮人微缩金像），上方悬挂1928年《威利号汽船》原画赛璐珞。办公桌右侧则是那架著名的施坦威三角钢琴：每周五下午，谢尔曼兄弟（Sherman Brothers）都会在此为沃尔特弹奏《Feed the Birds》与《小小世界》。',
    technicalSpecs: [
      { label: '奥斯卡特别奖', value: '1939《白雪公主》1大7小阶梯式 24K 镀金奥斯卡金像奖座' },
      { label: '馆藏原画', value: '1928《威利号汽船（Steamboat Willie）》馆藏级装裱赛璐珞画帧' },
      { label: '三角钢琴', value: '乌木黑亮漆三角钢琴 · 24K 金色铸铁音板 ·《Feed the Birds》曲谱' },
      { label: '微缩收藏架', value: '双层背光胡桃木博古架，陈列沃尔特从欧洲搜集的微缩瓷偶与铜像' },
    ],
    relatedBlueprint: 'florida-project-epcot',
    cameraPreset: 'walts-office',
  },
};

