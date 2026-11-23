import { IslandMetadata, IslandCategory } from '../types/island';

export interface FamousCathedralSeed {
  idx: number;
  bdId: string;
  interiorId: string;
  countryZh: string;
  nameZh: string;
  nameEn: string;
  subtitle: string;
  category: IslandCategory;
  styleTag: string;
  palette: [string, string, string];
  interiorPalette: [string, string, string];
  exteriorLandmarks: string[];
  interiorRooms: string[];
  collectibles: string[];
}

export const FAMOUS_CATHEDRAL_SEEDS: FamousCathedralSeed[] = [
  {
    idx: 1,
    bdId: 'BD-151',
    interiorId: 'diorama_dollhouse_43',
    countryZh: '梵蒂冈',
    nameZh: '梵蒂冈 · 圣彼得大教堂',
    nameEn: "Vatican City · St. Peter's Basilica & Bernini Colonnade",
    subtitle: '世界第一大教堂 · 米开朗基罗双层肋拱大穹顶、马代尔诺巴洛克立面、贝尔尼尼284柱椭圆广场与方尖碑',
    category: 'culture',
    styleTag: 'Renaissance & Baroque Papal Basilica',
    palette: ['#F3ECE0', '#64748B', '#D4AF37'],
    interiorPalette: ['#E8DEC8', '#FBF8F1', '#D4AF37'],
    exteriorLandmarks: [
      "Michelangelo's 136m Ribbed Dome & Colonnaded Drum (米开朗基罗肋拱大穹顶)",
      "Maderno's Travertine Corinthian Facade & Apostles Attic (巴洛克巨柱立面与十二使徒雕像)",
      "Bernini's Elliptical Doric Colonnade Arms & Vatican Obelisk (贝尔尼尼双环柱廊与埃及方尖碑)",
    ],
    interiorRooms: [
      "1F Left: Bernini's 29m Twisted Bronze Baldacchino & Papal High Altar (圣彼得青铜华盖与教宗祭坛)",
      "1F Right: Michelangelo's Marble Pietà Chapel & Coffered Golden Nave (米开朗基罗《哀悼基督》礼拜堂)",
      "2F Upper: Sunburst Cathedra Petri Gallery & Whispering Dome Loggia (圣彼得宝座圣光厅与穹顶回音廊)",
    ],
    collectibles: [
      "Bernini's 4-Column Twisted Bronze Baldacchino",
      "Michelangelo's White Carrara Marble Pietà",
      'Gilded Sunburst Cathedra Petri & Papal Tiara Reliquary',
    ],
  },
  {
    idx: 2,
    bdId: 'BD-152',
    interiorId: 'diorama_dollhouse_44',
    countryZh: '法国',
    nameZh: '法国 · 巴黎圣母院',
    nameEn: 'France · Notre-Dame de Paris (Île de la Cité)',
    subtitle: '法兰西哥特建筑巅峰 · 西立面双子钟楼、三座深雕尖拱门、玫瑰花窗、14组飞扶壁与96米哥特铅顶尖塔',
    category: 'culture',
    styleTag: 'French High Gothic Cathedral',
    palette: ['#EAE2D3', '#475569', '#38BDF8'],
    interiorPalette: ['#C8BFB0', '#F4EFE6', '#1D4ED8'],
    exteriorLandmarks: [
      'Twin 69m Gothic Bell Towers & Galerie des Chimères (西立面双子钟楼与怪兽走廊)',
      'West & Transept Stained-Glass Rose Windows & 3 Sculpted Portals (三座哥特玫瑰花窗与最后审判门)',
      '14 Gothic Flying Buttresses & Viollet-le-Duc 96m Crossing Spire (14组飞扶壁与96米十字交汇尖塔)',
    ],
    interiorRooms: [
      '1F Left: Rib-Vaulted Gothic Nave, Radiant Rose Windows & Coustou Pietà Altar (哥特肋拱中殿与玫瑰花窗)',
      '1F Right: Treasury of the Holy Crown of Thorns & Choir Screen Reliefs (荆棘王冠水晶圣物箱与唱诗班)',
      '2F Upper: 8,000-Pipe Cavaillé-Coll Grand Organ Loft & Bourdon Bell Belfry (8000音管巨型管风琴台)',
    ],
    collectibles: [
      'Crystal-and-Gold Reliquary of the Crown of Thorns',
      '8,000-Pipe Cavaillé-Coll Grand Cathedral Organ',
      '13th-Century North & South Rose Window Miniatures',
    ],
  },
  {
    idx: 3,
    bdId: 'BD-153',
    interiorId: 'diorama_dollhouse_45',
    countryZh: '西班牙',
    nameZh: '西班牙 · 巴塞罗那圣家堂',
    nameEn: 'Spain · Basílica de la Sagrada Família (Barcelona)',
    subtitle: '高迪旷世未竟杰作 · 18座镂空抛物面高塔群、172.5米耶稣基督主塔、圣母十二角晨星塔与诞生/受难双立面',
    category: 'culture',
    styleTag: 'Catalan Modernisme Organic Basilica',
    palette: ['#DFCCA8', '#C29B61', '#10B981'],
    interiorPalette: ['#EFE7D6', '#FBF8F3', '#F59E0B'],
    exteriorLandmarks: [
      '8 Perforated Paraboloid Bell Spires of Nativity & Passion Facades (8座镂空玉米穗抛物面钟塔)',
      '172.5m Central Tower of Jesus Christ & 12-Pointed Star Virgin Mary Tower (耶稣主塔与十二角伯利恒星塔)',
      'Nativity Stalactite Portals & Green Cypress Tree of Life (诞生立面钟乳石雕塑群与绿色生命柏树)',
    ],
    interiorRooms: [
      '1F Left: Arborescent Hyperboloid Tree-Column Forest & Suspended Christ Canopy (高迪森林树状分叉石柱殿)',
      '1F Right: Rainbow Stained-Glass Nave (Sunrise Blue-Green to Sunset Red-Gold) (晨曦蓝绿至落日红金彩窗廊)',
      '2F Upper: Fibonacci Spiral Stone Staircase & Gaudí Hanging Chain Model Studio (斐波那契螺旋石阶与高迪模型室)',
    ],
    collectibles: [
      'Gaudí Inverted Hanging-Chain Catenary Arch Model',
      'Illuminated 12-Pointed Glass Morning Star Finial',
      'Venetian Mosaic Polychrome Pinnacle & Golden Pelican',
    ],
  },
  {
    idx: 4,
    bdId: 'BD-154',
    interiorId: 'diorama_dollhouse_46',
    countryZh: '意大利',
    nameZh: '意大利 · 米兰大教堂',
    nameEn: 'Italy · Duomo di Milano (Piazza del Duomo)',
    subtitle: '纯白坎多利亚大理石哥特奇迹 · 135座镂空大理石尖塔森林、阶梯形五开间立面与108.5米金色圣母主尖塔',
    category: 'culture',
    styleTag: 'Flamboyant Italian Gothic Marble Cathedral',
    palette: ['#FAF7F2', '#E2DCD3', '#D4AF37'],
    interiorPalette: ['#E5DDD0', '#FAF7F2', '#991B1B'],
    exteriorLandmarks: [
      'Forest of 135 Carved Candoglia Marble Pinnacles & Flying Buttresses (135座大理石哥特尖塔森林)',
      '108.5m Octagonal Lantern Spire & Golden Madonnina Statue (八角灯笼主塔与黄金圣母像)',
      'Stepped 5-Bay White-Pink Marble Facade & Geometric Piazza del Duomo (五开间大理石立面与几何广场)',
    ],
    interiorRooms: [
      '1F Left: 52 Colossal Marble Columns with Sculpted Saint Tabernacle Capitals (52根圣徒神龛柱头巨柱殿)',
      '1F Right: Golden Pellegrini Ciborio High Altar & Brass Zodiac Sundial Line (黄金华盖祭坛与黄道日晷线)',
      '2F Upper: Walkable Marble Rooftop Pinnacle Forest & Stained-Glass Apse Loft (可漫步大理石尖塔屋顶露台)',
    ],
    collectibles: [
      'Gilded Copper Statue of La Madonnina',
      'Carved Marble Tabernacle Capital & Trivulzio Candelabrum',
      'Inlaid Black-Red-White Lombardy Marble Floor Rosette',
    ],
  },
  {
    idx: 5,
    bdId: 'BD-155',
    interiorId: 'diorama_dollhouse_47',
    countryZh: '意大利',
    nameZh: '意大利 · 佛罗伦萨圣母百花大教堂',
    nameEn: 'Italy · Cattedrale di Santa Maria del Fiore (Florence)',
    subtitle: '文艺复兴开端 · 布鲁内莱斯基八角红砖巨型穹顶、白绿粉三色大理石几何立面与84.7米乔托钟楼',
    category: 'culture',
    styleTag: 'Italian Renaissance & Polychrome Gothic Duomo',
    palette: ['#F7F4EB', '#C84B31', '#2D5A3F'],
    interiorPalette: ['#EDE6D6', '#FAF7F0', '#B45309'],
    exteriorLandmarks: [
      "Brunelleschi's 114m Octagonal Red-Brick Dome & White Marble Ribs (布鲁内莱斯基八角红砖大穹顶)",
      'Carrara White, Prato Green & Maremma Pink Marble Geometric Facade (白绿粉三色大理石镶嵌立面)',
      "Giotto's 84.7m Polychrome Marble Campanile Bell Tower (乔托三色大理石独立钟楼)",
    ],
    interiorRooms: [
      '1F Left: Octagonal Marble Choir Enclosure under Vasari Last Judgment Dome (八角大理石唱诗台与末日审判穹顶)',
      "1F Right: Paolo Uccello's 24-Hour Liturgical Clock & Polychrome Floor Rosettes (乌切洛24小时礼仪钟与花砖厅)",
      '2F Upper: Brunelleschi Double-Shell Herringbone Brick Dome Gallery (双层鱼骨砖穹顶夹层回廊)',
    ],
    collectibles: [
      "Verrocchio's Gilded Copper Orb & Lantern Model",
      "Brunelleschi's Hoist Gear & Herringbone Brick Study",
      "Paolo Uccello's 1443 Four-Evangelist Clock Dial",
    ],
  },
  {
    idx: 6,
    bdId: 'BD-156',
    interiorId: 'diorama_dollhouse_48',
    countryZh: '德国',
    nameZh: '德国 · 科隆大教堂',
    nameEn: 'Germany · Kölner Dom (Cologne Cathedral on the Rhine)',
    subtitle: '莱茵河畔哥特双塔巨擘 · 157米镂空石雕双子尖塔、双层飞扶壁阵列与西方世界最大金器《东方三博士圣物箱》',
    category: 'culture',
    styleTag: 'German Rayonnant High Gothic Cathedral',
    palette: ['#57534E', '#78716C', '#D4AF37'],
    interiorPalette: ['#A8A29E', '#E7E5E4', '#D4AF37'],
    exteriorLandmarks: [
      'Twin 157m Openwork Stone Filigree Gothic Spires & Finials (157米镂空石雕双子哥特尖塔)',
      'Double-Tiered Choir Flying Buttresses & Steep Copper-Slate Roofs (唱诗厅双层飞扶壁森林与陡坡屋顶)',
      'Triple Deeply Sculpted Gothic West Portals & Great West Lancet Window (三联尖拱深雕大门与西立面巨窗)',
    ],
    interiorRooms: [
      '1F Left: Golden Shrine of the Three Kings (Dreikönigenschrein) Sanctuary (东方三博士黄金圣物箱圣所)',
      "1F Right: Gerhard Richter's 11,500-Pixel Rainbow Window & Gero Cross Chapel (里希特像素彩虹花窗与杰罗十字架)",
      '2F Upper: 14th-Century Carved Oak Choir Stalls & Cathedral Treasury Vault (中世纪橡木唱诗席与大教堂珍宝库)',
    ],
    collectibles: [
      '12th-Century Golden Reliquary Shrine of the Three Magi',
      'Gerhard Richter 72-Color Stained-Glass Lancet Panel',
      'St. Petersglocke ("Dicker Pitter") 24-Ton Bronze Bell',
    ],
  },
  {
    idx: 7,
    bdId: 'BD-157',
    interiorId: 'diorama_dollhouse_49',
    countryZh: '俄罗斯',
    nameZh: '俄罗斯 · 莫斯科圣瓦西里升天大教堂',
    nameEn: "Russia · Saint Basil's Cathedral (Red Square, Moscow)",
    subtitle: '红场童话建筑瑰宝 · 中央65米八角金棱帐篷顶主塔、8座螺旋彩绘洋葱头穹顶与白石阶梯拱廊基座',
    category: 'culture',
    styleTag: 'Russian Flame-Style Tent & Onion-Dome Cathedral',
    palette: ['#DC2626', '#16A34A', '#FACC15'],
    interiorPalette: ['#B91C1C', '#FEF3C7', '#D4AF37'],
    exteriorLandmarks: [
      'Central 65m Octagonal Tent-Roof Church (Shayor) with Golden Ribs (中央65米八角帐篷顶主圣堂)',
      '8 Polychrome Swirled & Faceted Pineapple Onion Domes (8座螺旋条纹与菠萝格彩绘洋葱头穹顶)',
      'White-Stone Podklet Arched Podium, Kokoshnik Gables & Tent Bell Tower (白石拱廊基座、火焰山花与钟楼)',
    ],
    interiorRooms: [
      '1F Left: 5-Tiered Golden Baroque Iconostasis & Royal Sanctuary Gates (五层纯金巴洛克圣像壁与皇家圣门)',
      '1F Right: 16th-Century Botanical Scrollwork Brick Vaulted Galleries (16世纪繁花藤蔓壁画红砖拱顶长廊)',
      '2F Upper: Under-Cupola Lantern Acoustic Choir & Illuminated Slavonic Gospels (穹顶圣咏廊与泥金斯拉夫福音书)',
    ],
    collectibles: [
      'Golden Royal Gate Iconostasis & Tempera Saints Icons',
      'Multi-Tiered Brass Panikadilo Chandelier',
      'Polychrome Majolica Ceramic Tile & Onion Cupola Finial',
    ],
  },
  {
    idx: 8,
    bdId: 'BD-158',
    interiorId: 'diorama_dollhouse_50',
    countryZh: '土耳其',
    nameZh: '土耳其 · 伊斯坦布尔圣索菲亚大教堂',
    nameEn: 'Turkey · Hagia Sophia (Ayasofya, Sultanahmet, Istanbul)',
    subtitle: '千年拜占庭与奥斯曼建筑奇迹 · 40窗悬浮感中央大穹顶、双层半穹顶、红白条纹扶壁与四座高耸宣礼塔',
    category: 'culture',
    styleTag: 'Byzantine Imperial Basilica & Ottoman Mosque',
    palette: ['#E08E79', '#F2E6D8', '#475569'],
    interiorPalette: ['#E8D8C0', '#FBF6EE', '#D4AF37'],
    exteriorLandmarks: [
      '55.6m Central Pendentive Dome Ringed by 40 Arched Windows (底部环绕40扇拱窗的悬浮感大穹顶)',
      'Cascading East & West Semi-Domes, Exedrae & Terracotta Buttresses (层叠半穹顶与拜占庭巨型扶壁)',
      '4 Soaring Cylindrical Ottoman Minarets & Sultanahmet Ablution Fountain (四座高耸奥斯曼宣礼塔与净身亭)',
    ],
    interiorRooms: [
      '1F Left: Golden Mosaic Dome Hall, 7.5m Black-Gold Calligraphy Medallions & Mihrab (金箔穹顶与7.5米黑金圆牌大殿)',
      '1F Right: Porphyry Imperial Columns, Marble Minbar Pulpit & Ring Chandeliers (紫斑岩帝国石柱、大理石敏拜尔与环形吊灯)',
      '2F Upper: Imperial Gallery (Empress Lodge) & 13th-Century Deesis Gold Mosaic (二楼皇后走廊与《三圣像》金箔马赛克)',
    ],
    collectibles: [
      '7.5m Black-and-Gold Ottoman Calligraphy Medallions',
      'Byzantine Gold-Leaf Tesserae Deesis Mosaic Panel',
      'Carved Proconnesian Marble Basket Capital & Brass Chandelier',
    ],
  },
  {
    idx: 9,
    bdId: 'BD-159',
    interiorId: 'diorama_dollhouse_51',
    countryZh: '英国',
    nameZh: '英国 · 伦敦威斯敏斯特大教堂',
    nameEn: 'UK · Westminster Abbey (Collegiate Church of St. Peter, London)',
    subtitle: '英国王室加冕与国葬圣殿 · 霍克斯莫尔纯白波特兰石双子西塔、三层飞扶壁、北耳堂所罗门玫瑰窗与亨利七世礼拜堂',
    category: 'culture',
    styleTag: 'English Royal Coronation Gothic Abbey',
    palette: ['#E5DEC9', '#64748B', '#D4AF37'],
    interiorPalette: ['#D6CFC2', '#F5F0E6', '#991B1B'],
    exteriorLandmarks: [
      "Hawksmoor's Twin 68m White Portland-Stone Neo-Gothic West Towers (霍克斯莫尔纯白波特兰石双子西塔)",
      '3-Tier Gothic Flying Buttresses, Steep Lead Roof & North Rose Window (三层飞扶壁阵列与北耳堂玫瑰窗)',
      'Henry VII Perpendicular Gothic Lady Chapel & Octagonal Chapter House (亨利七世扇形拱顶礼拜堂与八角议事厅)',
    ],
    interiorRooms: [
      "1F Left: King Edward's 1300 Coronation Chair, Stone of Scone & Cosmati Pavement (圣爱德华王室加冕宝座与科斯马蒂马赛克地坪)",
      '1F Right: Henry VII Fan-Vaulted Lady Chapel & Knights of the Bath Banners (扇形石雕垂花拱顶与巴斯骑士团纹章旗阵)',
      "2F Upper: Royal Monarchs' Gilded Tomb Effigies & Poets' Corner Manuscript Gallery (历代君主鎏金陵寝雕像与诗人角藏书廊)",
    ],
    collectibles: [
      "King Edward's Oak Coronation Chair & Stone of Scone",
      '1268 Cosmati Porphyry & Gold-Glass Mosaic Pavement',
      'Knights of the Bath Silk Heraldic Banner & Abbey Organ',
    ],
  },
  {
    idx: 10,
    bdId: 'BD-160',
    interiorId: 'diorama_dollhouse_52',
    countryZh: '冰岛',
    nameZh: '冰岛 · 雷克雅未克哈尔格林姆斯大教堂',
    nameEn: 'Iceland · Hallgrímskirkja (Reykjavik Basalt Column Church)',
    subtitle: '北欧表现主义地标 · 灵感源自冰岛六角火山玄武岩柱群的阶梯式对称两翼、74.5米钟塔与莱夫·埃里克松探险家雕像',
    category: 'culture',
    styleTag: 'Nordic Basalt-Column Expressionist Church',
    palette: ['#E2E8F0', '#94A3B8', '#38BDF8'],
    interiorPalette: ['#F1F5F9', '#FFFFFF', '#0284C7'],
    exteriorLandmarks: [
      'Symmetrical Stepped Hexagonal Volcanic Basalt-Column Concrete Wings (18级渐升六角火山玄武岩柱双翼)',
      '74.5m Central Bell Tower with 4 Circular Clock Faces & Parabolic Crown (74.5米中央钟塔与四面圆钟)',
      'Bronze Statue of Leif Eriksson on Ship-Prow Granite Plaza Pedestal (广场莱夫·埃里克松维京探险家铜像)',
    ],
    interiorRooms: [
      '1F Left: Pure White Nordic Pointed-Arch Nave & Icelandic Crystal Baptismal Font (纯白极光哥特尖拱大殿与冰晶洗礼池)',
      '1F Right: Sculptural Oak Sanctuary Altar & Arctic Clear-Glass Lancet Alcoves (北欧橡木圣坛与极地通透采光长窗)',
      '2F Upper: Monumental 15m 5,275-Pipe Klais Concert Pipe Organ Loft & Belfry Deck (15米高5275音管克莱斯巨型管风琴台)',
    ],
    collectibles: [
      '15-Meter 5,275-Pipe Bonn Klais Concert Organ Facade',
      'Sculpted Icelandic Crystal & Basalt Baptismal Font',
      'Bronze Replica of Leif Eriksson & Viking Ship Prow',
    ],
  },
];

// ============================================================================
// PART 1: 10 WORLD-FAMOUS CATHEDRALS & CHURCHES (BD-151 to BD-160)
// ============================================================================
export const WORLD_FAMOUS_CATHEDRALS_DATA: IslandMetadata[] = FAMOUS_CATHEDRAL_SEEDS.map((seed) => {
  const slug = `building-cathedral-${String(seed.idx).padStart(2, '0')}`;
  return {
    id: seed.bdId,
    slug,
    name: `${seed.nameZh} (${seed.nameEn})`,
    subtitle: `${seed.subtitle} | 配套双层细致教堂内景 (${seed.interiorId})`,
    category: seed.category,
    categoryName: `${seed.countryZh} · 世界十大最美大教堂`,
    worldLevel: 'level2_building',
    baseType: 'ground_patch',
    collection: 'buildings_world_cathedrals',
    subcategories: [...seed.exteriorLandmarks, `内置双层圣殿细致内景 (${seed.interiorId})`],
    theme: seed.styleTag,
    description: `【真实还原 ${seed.nameZh} (${seed.nameEn})】${seed.subtitle}。严格按照真实世界教堂建筑形制建模（真实肋拱穹顶、哥特飞扶壁、玫瑰花窗、双坡铅顶、三色大理石、彩绘洋葱顶与火山玄武岩柱群）。在默认外观下轮廓100%纯净真实；点击「只看1F/2F」可直接掀顶透视内嵌圣殿，或点击「🚪 细致内景」进入专属双层教堂内景 (${seed.interiorId}) 漫游。`,
    isHeroReference: true,
    polyCount: 5400 + seed.idx * 120,
    palette: [
      { hex: seed.palette[0], label: '主立面石材/大理石 (Primary Stone & Marble)', role: '核心立面与柱廊' },
      { hex: seed.palette[1], label: '穹顶/尖塔/屋面 (Dome, Roof & Spires)', role: '肋拱穹顶与尖塔' },
      { hex: seed.palette[2], label: '圣殿鎏金与彩窗 (Sacred Gold & Stained Glass)', role: '十字金顶与玫瑰花窗' },
      { hex: seed.interiorPalette[0], label: '内置双层圣殿内景 (Embedded Sanctuary)', role: `直通 ${seed.interiorId}` },
    ],
    landmarks: seed.exteriorLandmarks.map((lm, i) => ({
      id: `${seed.bdId}_lm_${i}`,
      name: lm.split('(')[0].trim(),
      description: lm,
      tag: i === 0 ? '核心标志' : i === 1 ? '天际轮廓' : '建筑绝技',
    })),
    terrainSpecs: {
      shape: 'terraced',
      underbelly: `【真实还原世界十大最美教堂 + 双层圣殿内景】内置可掀顶1F/2F教堂内景，并绑定独立双层圣殿 (${seed.interiorId})`,
      waterFeatures: '教堂前庭圣泉、塞纳河岸或倒影池',
      foliage: '柏树、广场花坛与石板柱廊',
      elevationLevels: 3,
    },
    variants: {
      classic: {
        title: `${seed.nameZh} (经典圣殿自然光)`,
        description: `真实还原 ${seed.nameZh} 的建筑比例、穹顶尖塔天际线与彩绘玻璃花窗。`,
        accentColor: seed.palette[0],
      },
      fantasy: {
        title: `${seed.nameZh} (黄昏烛光弥撒)`,
        description: '玫瑰花窗与高窗透出神圣暖金光芒，重现史诗黄昏圣殿。',
        accentColor: seed.palette[2],
      },
      minimal: {
        title: `${seed.nameZh} (建筑结构白模)`,
        description: '用于检视真实教堂飞扶壁、穹顶肋架与尖塔几何结构的纯净白模。',
        accentColor: '#94A3B8',
      },
    },
    minestWorldType: slug.replace(/-/g, '_'),
    assetFileRef: `/assets/models/buildings/cathedrals/${slug}.glb`,
    dimensionRatio: `真实圣殿地标比例 · 含原地掀顶内景 & 独立圣殿内景 (${seed.interiorId})`,
  };
});

// ============================================================================
// PART 2: 10 PAIRED SACRED CATHEDRAL INTERIORS (diorama_dollhouse_43 to 52)
// ============================================================================
export const WORLD_CATHEDRAL_INTERIORS_DATA: IslandMetadata[] = FAMOUS_CATHEDRAL_SEEDS.map((seed) => {
  const dhSlug = `diorama-dollhouse-${String(42 + seed.idx).padStart(2, '0')}`;
  return {
    id: seed.interiorId,
    slug: dhSlug,
    name: `${seed.nameZh} · 圣殿双层细致内景 (${seed.nameEn} Sanctuary)`,
    subtitle: `对应世界十大最美教堂 ${seed.bdId} · ${seed.interiorRooms.join(' / ')}`,
    category: seed.category,
    categoryName: `${seed.countryZh} · 教堂圣殿双层细致内景`,
    worldLevel: 'level2_diorama',
    baseType: 'ground_patch',
    collection: 'category_dollhouse_interiors',
    subcategories: [...seed.interiorRooms, ...seed.collectibles],
    theme: `${seed.styleTag} — 2-Story Enterable Cathedral Sanctuary Dollhouse`,
    description: `【与世界十大名教堂 ${seed.bdId} ${seed.nameZh} 1:1 配套的双层高细节圣殿内景】一层左翼为 ${seed.interiorRooms[0]}，一层右翼为 ${seed.interiorRooms[1]}（含对称橡木礼拜长椅阵列、黄金烛台与圣水池），二层为 ${seed.interiorRooms[2]}（含巨型管风琴音管矩阵、彩绘玫瑰花窗与圣物珍宝柜）。支持点击房间按钮第一人称漫游或只看 1F/2F 剖面！`,
    isHeroReference: true,
    polyCount: 5600 + seed.idx * 120,
    palette: [
      { hex: seed.interiorPalette[0], label: '圣殿棋盘大理石地坪 (Marble Pavement)', role: '1F & 2F 圣殿地面' },
      { hex: seed.interiorPalette[1], label: '束柱拱顶与石壁 (Clustered Pillars & Vaults)', role: '室内束柱与拱廊' },
      { hex: seed.interiorPalette[2], label: '祭坛鎏金与彩窗 (Altar Gold & Rose Window)', role: '高祭坛/管风琴/圣物柜' },
      { hex: '#991B1B', label: '中轴礼仪红毯与长椅 (Ceremonial Carpet & Pews)', role: '主殿中庭礼拜道' },
    ],
    landmarks: seed.interiorRooms.map((rm, i) => ({
      id: `${seed.interiorId}_rm_${i}`,
      name: rm.split('(')[0].trim(),
      description: rm,
      tag: i === 0 ? '1F 祭坛圣所' : i === 1 ? '1F 礼拜长廊' : '2F 管风琴/珍宝',
    })),
    terrainSpecs: {
      shape: 'terraced',
      underbelly: `【世界十大最美教堂专属圣殿内景】对应外部大教堂 (${seed.bdId} — ${seed.nameZh})，支持 1F/2F 楼层剖面与圣殿区域第一人称漫游`,
      waterFeatures: '大理石圣水池与洗礼池',
      foliage: '祭坛鲜花与礼仪绿植',
      elevationLevels: 2,
    },
    variants: {
      classic: {
        title: `${seed.nameZh} 圣殿内景 (玫瑰花窗日间光束)`,
        description: '呈现高祭坛华盖、彩绘玫瑰花窗、礼拜长椅与二楼大型管风琴唱诗台。',
        accentColor: seed.interiorPalette[2],
      },
      fantasy: {
        title: `${seed.nameZh} 圣殿内景 (烛光晚祷与管风琴盛典)`,
        description: '祭坛百支金烛台、环形吊灯与彩窗流光交相辉映。',
        accentColor: '#FACC15',
      },
      minimal: {
        title: `${seed.nameZh} 圣殿内景 (空间结构白模)`,
        description: '检视双层教堂圣殿束柱、管风琴与祭坛陈设密度的纯净白模。',
        accentColor: '#94A3B8',
      },
    },
    minestWorldType: seed.interiorId,
    assetFileRef: `/assets/models/dioramas/dollhouses/${dhSlug}.glb`,
    dimensionRatio: `双层神圣教堂内景 · 对应 ${seed.bdId} · 支持第一人称圣殿漫游`,
  };
});
