import { IslandMetadata } from '../types/island';

export interface FamousCastleSeed {
  idx: number; // 1..10 -> BD-141..BD-150 & diorama_dollhouse_33..42
  bdId: string;
  dhId: string;
  slug: string;
  dhSlug: string;
  countryBadge: string;
  name: string;
  subtitle: string;
  dhName: string;
  dhSubtitle: string;
  category: IslandMetadata['category'];
  theme: string;
  description: string;
  dhDescription: string;
  subcategories: string[];
  dhSubcategories: string[];
  polyCount: number;
  primaryHex: string;
  secondaryHex: string;
  accentHex: string;
  interiorFloorHex: string;
  interiorWallHex: string;
  interiorFurnHex: string;
  landmarks: { name: string; tag: string; desc: string }[];
  interiorRooms: { name: string; tag: string; desc: string }[];
  waterFeatures: string;
  foliage: string;
}

export const FAMOUS_CASTLE_SEEDS: FamousCastleSeed[] = [
  {
    idx: 1,
    bdId: 'BD-141',
    dhId: 'diorama_dollhouse_33',
    slug: 'building-castle-01-neuschwanstein-bavaria',
    dhSlug: 'diorama-dollhouse-33-neuschwanstein-throne-interior',
    countryBadge: '🇩🇪 德国巴伐利亚 · 世界第一童话城堡',
    name: 'Neuschwanstein Castle — Bavarian Alpine Crown',
    subtitle: '德国 · 新天鹅堡 (真实还原白石罗马复兴主楼、蓝顶高塔、红砖门楼与天鹅内景)',
    dhName: 'Neuschwanstein — Byzantine Throne & Singers’ Hall Interior',
    dhSubtitle: '新天鹅堡细致内景 · 拜占庭黄金王座厅、96烛皇冠大吊灯、瓦格纳天鹅壁画与哥特雕花卧房',
    category: 'culture',
    theme: 'Authentic Neuschwanstein Castle: White Limestone Palas, Soaring Blue-Slate Cylindrical Watchtower, Red-Brick Torbau Gatehouse & Alpine Gorge',
    description:
      '【真实还原德国新天鹅堡】严格依照路德维希二世在阿尔卑斯山岩上建造的真实格局：东侧红色的双塔砖砌门楼（Torbau），西侧高耸入云的乳白色石灰岩五层帕拉斯主宫（Palas）、标志性的深蓝石板尖顶最高圆塔、阶梯山墙与骑士院。内置双层王座厅与天鹅卧房细致内景，支持一键掀顶或进入第一人称漫游。',
    dhDescription:
      '【新天鹅堡专属双层细致内景】1F 还原金碧辉煌的拜占庭风格双层王座厅（Thronsaal）：大理石白色拾级台阶、青金石与纯金马赛克穹顶壁龛、重达一吨的96烛皇冠形鎏金大吊灯（Radleuchter）以及天鹅音乐沙龙；2F 还原路德维希二世哥特木雕尖塔帷幔御床、瓦格纳歌剧天鹅壁画书房与皇家藏书阁。',
    subcategories: [
      '乳白石灰岩五层主宫 (Palas)',
      '深蓝圆锥尖顶最高瞭望主塔',
      '红砖双塔迎宾门楼 (Torbau)',
      '阿尔卑斯陡峭岩壁与玛丽安桥视角',
      '内置王座厅与天鹅卧房双层细致内景',
    ],
    dhSubcategories: [
      '1F 拜占庭黄金马赛克王座台与大理石阶梯',
      '1F 96烛皇冠形鎏金大吊灯与天鹅三角钢琴厅',
      '2F 路德维希二世哥特尖塔木雕御床套房',
      '2F 瓦格纳歌剧手稿藏书阁与天鹅圣杯记忆展柜',
    ],
    polyCount: 4920,
    primaryHex: '#F4F1EA',
    secondaryHex: '#253D5B',
    accentHex: '#C84B31',
    interiorFloorHex: '#2B4C7E',
    interiorWallHex: '#FBF6EC',
    interiorFurnHex: '#1E3A8A',
    landmarks: [
      {
        name: '高耸蓝顶主圆塔与帕拉斯正宫 (Main Watchtower & Palas)',
        tag: '核心标志',
        desc: '真实还原新天鹅堡不对称的高低双圆塔、陡峭深蓝石板屋顶与乳白石灰岩拱窗立面。',
      },
      {
        name: '红砖迎宾双塔门楼 (Red-Brick Torbau Gatehouse)',
        tag: '真实门楼',
        desc: '与白色主楼形成鲜明色彩对比的红砖前庭门楼，还原真实历史建筑层次。',
      },
      {
        name: '皇冠吊灯王座厅内景 (Embedded Throne Hall)',
        tag: '细致内景',
        desc: '点击“掀顶看内景”或“细致内景”即可检视拜占庭金顶王座厅与哥特木雕御床。',
      },
    ],
    interiorRooms: [
      { name: '1F 拜占庭金顶王座大厅 & 皇冠吊灯', tag: '1F 王座厅', desc: '白色大理石宝座台阶、蓝金马赛克圣殿背景与96烛皇冠大吊灯。' },
      { name: '1F 歌手大厅音乐沙龙 & 皇家国宴桌', tag: '1F 歌手厅', desc: '演奏级三角钢琴、中世纪骑士壁画、壁炉与6人份皇家金器晚宴桌。' },
      { name: '2F 路德维希二世哥特木雕天鹅御床房', tag: '2F 国王寝宫', desc: '耗时四年雕琢的哥特式木雕华盖大床、王室蓝丝绒帷幔与天鹅洗漱台。' },
      { name: '2F 瓦格纳歌剧藏书馆 & 王室记忆展柜', tag: '2F 藏书/记忆', desc: '珍藏瓦格纳歌剧总谱、城堡设计蓝图与天鹅银器收藏柜。' },
    ],
    waterFeatures: '阿尔卑斯山涧波拉特峡谷瀑布与天鹅湖水源',
    foliage: '巴伐利亚冷杉林、高山云杉与秋色枫木',
  },
  {
    idx: 2,
    bdId: 'BD-142',
    dhId: 'diorama_dollhouse_34',
    slug: 'building-castle-02-mont-saint-michel-france',
    dhSlug: 'diorama-dollhouse-34-mont-saint-michel-cloister-interior',
    countryBadge: '🇫🇷 法国诺曼底 · 海上金字塔奇观城堡',
    name: 'Mont-Saint-Michel — Tidal Abbey Fortress',
    subtitle: '法国 · 圣米歇尔山城堡 (真实还原潮汐镜面海湾、层叠花岗岩城墙、哥特修道院与金天使尖塔)',
    dhName: 'Mont-Saint-Michel — Knights’ Scriptorium & Cloister Interior',
    dhSubtitle: '圣米歇尔山细致内景 · 骑士大厅巨柱壁炉、空中双排石柱回廊、泥金手抄本图书馆与圣物展厅',
    category: 'culture',
    theme: 'Authentic Mont-Saint-Michel Tidal Island: Concentric Granite Ramparts, Medieval Village Tier, La Merveille Gothic Buttresses & Golden Archangel Spire',
    description:
      '【真实还原法国圣米歇尔山】矗立于潮汐浅滩镜面水域中央的锥形花岗岩圣山城堡：底层为带防御塔楼的厚重环形海防城墙与中世纪半木结构街巷，中层为“奇迹建筑”（La Merveille）高耸哥特飞扶壁修道院大厅，顶端直指苍穹的哥特钟楼尖塔立有闪耀的圣米迦勒金像，前接弧形跨海栈桥。',
    dhDescription:
      '【圣米歇尔山专属双层细致内景】1F 还原著名的“骑士大厅”（Salle des Chevaliers）与空中哥特回廊内庭：粗壮的诺曼底石圆柱、双联巨型石壁炉、中世纪羊皮卷手抄本抄写台与修道院食堂长桌；2F 还原彩绘玻璃主殿寝宫、中世纪神学与星象泥金古籍馆、以及圣弥额尔金剑圣物收藏柜。',
    subcategories: [
      '锥形层叠花岗岩山体与海防城墙',
      '顶峰哥特钟楼尖塔与金色大天使像',
      '“奇迹建筑”飞扶壁大厅 (La Merveille)',
      '潮汐镜面浅滩海湾与跨海长栈桥',
      '内置骑士大厅与空中回廊双层细致内景',
    ],
    dhSubcategories: [
      '1F 哥特双排石柱回廊花坛与骑士大厅石柱',
      '1F 诺曼底巨型双石壁炉与修道院盛宴长桌',
      '2F 彩绘玫瑰花窗哥特拱顶主卧套房',
      '2F 中世纪泥金手抄本藏书馆与圣物记忆展柜',
    ],
    polyCount: 4980,
    primaryHex: '#C7BFB3',
    secondaryHex: '#3B4252',
    accentHex: '#F59E0B',
    interiorFloorHex: '#8E877E',
    interiorWallHex: '#EAE3D5',
    interiorFurnHex: '#7C2D12',
    landmarks: [
      {
        name: '圣米迦勒金像哥特主尖塔 (Archangel Spire & Abbey)',
        tag: '巅峰圣殿',
        desc: '海拔最高处的哥特式修道院教堂与纤细石板尖塔，顶端闪耀金色大天使雕像。',
      },
      {
        name: '三层同心花岗岩城垣与街巷 (Concentric Bastions)',
        tag: '防御奇观',
        desc: '自潮汐海面层层盘旋而上的中世纪石砌城墙、北塔与山腰街屋。',
      },
      {
        name: '骑士大厅与哥特空中回廊内景 (Knights’ Hall Interior)',
        tag: '细致内景',
        desc: '包含中世纪圆柱拱厅、修道院回廊花园与泥金手抄本藏书室。',
      },
    ],
    interiorRooms: [
      { name: '1F 空中哥特石柱回廊 & 骑士门厅', tag: '1F 哥特回廊', desc: '精致错列石柱围合的回廊中庭花园与中世纪石阶旋转梯。' },
      { name: '1F 骑士大厅壁炉沙龙 & 长桌食堂', tag: '1F 骑士大厅', desc: '粗壮石柱、管风琴/钢琴、巨型石壁炉与中世纪烛光长宴会桌。' },
      { name: '2F 哥特花窗红丝绒四柱主卧', tag: '2F 理想居住', desc: '柳叶彩窗下的深红丝绒四柱大床、雕花衣柜与古董梳妆台。' },
      { name: '2F 泥金手抄本藏书阁 & 圣物展厅', tag: '2F 藏书/记忆', desc: '珍藏中世纪泥金羊皮卷、星盘地球仪与大天使圣物水晶柜。' },
    ],
    waterFeatures: '诺曼底潮汐镜面海湾与环岛海水倒影',
    foliage: '海岛岩壁耐盐翠柏与空中回廊修道院草药园',
  },
  {
    idx: 3,
    bdId: 'BD-143',
    dhId: 'diorama_dollhouse_35',
    slug: 'building-castle-03-chenonceau-loire-water-castle',
    dhSlug: 'diorama-dollhouse-35-chenonceau-gallery-interior',
    countryBadge: '🇫🇷 法国卢瓦尔河谷 · 跨河五拱水上女人堡',
    name: 'Château de Chenonceau — Bridge Gallery Castle',
    subtitle: '法国 · 舍农索水上城堡 (真实还原横跨谢尔河五拱石桥长廊、马尔克圆塔与几何水景花园)',
    dhName: 'Chenonceau — River-Arch Checkered Gallery & Medici Salon',
    dhSubtitle: '舍农索城堡细致内景 · 跨河黑白棋盘格长廊、文艺复兴雕花壁炉、美第奇帷幔主卧与水上铜锅厨房',
    category: 'culture',
    theme: 'Authentic Château de Chenonceau: White Tuffeau Stone 5-Arch River Gallery Bridge, Cylindrical Tour des Marques, Slate Turrets & Diane de Poitiers Parterre',
    description:
      '【真实还原法国卢瓦尔河谷舍农索城堡】直接建在谢尔河（River Cher）桥墩之上的文艺复兴绝美杰作：洁白的图福石（Tuffeau）双层跨河长廊横跨五座优美的半圆石拱桥洞，河水从城堡正下方流淌而过；前庭矗立带圆锥尖顶的马尔克古圆塔（Tour des Marques），两侧环绕黛安娜与美第奇几何刺绣法式水景花园。',
    dhDescription:
      '【舍农索水上城堡专属双层细致内景】1F 完整重现长达60米的跨河黑白棋盘格大理石长廊（La Grande Galerie）、两侧俯瞰河水的拱形落地窗、让·古戎雕刻的文艺复兴壁炉、以及建在桥墩里的传奇全套纯铜锅具美食厨房；2F 还原凯瑟琳·德·美第奇王后丝绒四柱寝宫、佛兰德斯挂毯与王室书房。',
    subcategories: [
      '横跨谢尔河的五孔石拱桥长廊',
      '洁白图福石立面与灰黑板岩老虎窗',
      '马尔克圆塔 (Tour des Marques) 与护城河桥',
      '黛安娜与美第奇对称法式几何花园',
      '内置跨河黑白棋盘长廊与铜锅厨房内景',
    ],
    dhSubcategories: [
      '1F 跨河五拱黑白棋盘石板大长廊与游船水门',
      '1F 文艺复兴雕花壁炉、竖琴/三角钢琴与挂满铜锅的桥墩餐厨',
      '2F 美第奇王后深红天鹅绒四柱帷幔主卧',
      '2F 卢瓦尔王室藏书阁、挂毯画廊与香水记忆柜',
    ],
    polyCount: 4780,
    primaryHex: '#F9F6F0',
    secondaryHex: '#2F3640',
    accentHex: '#0E7490',
    interiorFloorHex: '#E5E0D8',
    interiorWallHex: '#FAF7F2',
    interiorFurnHex: '#881337',
    landmarks: [
      {
        name: '五拱跨河双层长廊 (Five-Arch River Gallery)',
        tag: '世界唯一',
        desc: '五座半圆石拱直接跨越谢尔河水面，长廊双排拱窗倒映于碧波之中。',
      },
      {
        name: '四角圆塔主堡与马尔克塔 (Main Keep & Marques Tower)',
        tag: '文艺复兴',
        desc: '四角挑出圆锥尖顶角楼的方形主堡与前院独立马尔克圆塔。',
      },
      {
        name: '黑白棋盘跨河大厅与桥墩厨房内景 (Checkered Gallery)',
        tag: '细致内景',
        desc: '长廊内部铺设经典黑白斜格地砖，桥墩底层直通水上船坞与法式铜锅厨房。',
      },
    ],
    interiorRooms: [
      { name: '1F 跨河黑白棋盘长廊 & 桥墩水门船坞', tag: '1F 跨河长廊', desc: '黑白图福石与板岩棋盘地面、桥拱水门木船与旋转石梯。' },
      { name: '1F 文艺复兴壁炉沙龙 & 铜锅法式餐厨', tag: '1F 沙龙/铜锅', desc: '科林斯柱雕花壁炉、三角钢琴、6人法式国宴桌与全套纯铜厨具吧台。' },
      { name: '2F 凯瑟琳·德·美第奇王后丝绒寝宫', tag: '2F 王后寝宫', desc: '绯红鎏金四柱冠顶大床、佛兰德斯挂毯、雕花衣柜与梳妆台。' },
      { name: '2F 河景阳光书房 & 玫瑰香氛浴池', tag: '2F 藏书/记忆', desc: '俯瞰谢尔河的法文典籍书墙、王室书信展柜与猫脚浴缸。' },
    ],
    waterFeatures: '谢尔河主河道穿堡而过、五孔桥拱水波与法式水景护城河',
    foliage: '法式几何修剪黄杨迷宫、玫瑰花坛与河畔垂柳',
  },
  {
    idx: 4,
    bdId: 'BD-144',
    dhId: 'diorama_dollhouse_36',
    slug: 'building-castle-04-hohenzollern-cloud-fortress',
    dhSlug: 'diorama-dollhouse-36-hohenzollern-treasury-interior',
    countryBadge: '🇩🇪 德国施瓦本山巅 · 云端普鲁士皇室古堡',
    name: 'Hohenzollern Castle — Cloud-Top Spire Fortress',
    subtitle: '德国 · 霍亨索伦城堡 (真实还原孤峰环形棱堡、12座新哥特铜绿尖塔群与盘山鹰门斜道)',
    dhName: 'Hohenzollern — Counts’ Vaulted Hall & Crown Treasury Interior',
    dhSubtitle: '霍亨索伦城堡细致内景 · 哥特红石柱伯爵大厅、普鲁士镶钻皇冠珍宝柜、中世纪全身板甲阵与皇家书院',
    category: 'culture',
    theme: 'Authentic Hohenzollern Mountaintop Castle: Conical Peak Bastions, Buff Sandstone Curtain Walls, Cluster of 12 Neo-Gothic Conical Spires & Spiral Eagle Gate Ramp',
    description:
      '【真实还原德国霍亨索伦城堡】与新天鹅堡齐名的德国双璧之一，雄踞于圆锥形霍亨索伦山巅之上：外围是多边形星形棱堡防线与盘旋而上的老鹰门（Adlertor）螺旋坡道，核心城堡由暖黄砂岩筑成，簇拥着十余座高低错落的新哥特式深灰与铜绿圆锥尖塔、阶梯山墙与双尖顶礼拜堂，气势雄浑刚毅。',
    dhDescription:
      '【霍亨索伦城堡专属双层细致内景】1F 还原哥特肋架拱顶的“伯爵大厅”（Grafensaal）与皇家珍宝馆：陈列镶满蓝宝石与钻石的**普鲁士国王皇冠**水晶防弹展柜、中世纪霍亨索伦家族骑士全身精钢板甲队列、以及哥特大宴会桌；2F 还原普鲁士王后蓝色闺房（Blauer Salon）、腓特烈大帝藏书馆与山巅望远镜观景台。',
    subcategories: [
      '圆锥孤峰多边形星形棱堡城垣',
      '12座高低簇拥的新哥特圆锥尖塔群',
      '盘山螺旋坡道与老鹰城门 (Eagle Gate)',
      '中央骑士庭院与双尖顶皇家礼拜堂',
      '内置普鲁士皇冠珍宝馆与伯爵大厅内景',
    ],
    dhSubcategories: [
      '1F 普鲁士镶钻皇冠水晶展柜与中世纪全身板甲队列',
      '1F 哥特肋拱伯爵大厅、壁炉与皇家骑士长宴会桌',
      '2F 路易丝王后普鲁士蓝金丝绒四柱寝宫',
      '2F 腓特烈大帝军事哲学藏书馆与家族谱系记忆墙',
    ],
    polyCount: 4960,
    primaryHex: '#DEC9A6',
    secondaryHex: '#2F4858',
    accentHex: '#D4AF37',
    interiorFloorHex: '#8C7A6B',
    interiorWallHex: '#F3ECE1',
    interiorFurnHex: '#1D3557',
    landmarks: [
      {
        name: '皇帝塔与十二哥特尖塔簇 (Emperor Tower & Spires)',
        tag: '云端天际线',
        desc: '密集耸立的圆锥石板尖顶、角楼与哥特小尖塔，构成360度无死角的史诗轮廓。',
      },
      {
        name: '盘山螺旋鹰门与多角棱堡 (Spiral Ramp & Bastions)',
        tag: '真实防御',
        desc: '环绕山体的多边形外墙与盘旋进入内院的标志性石拱车道。',
      },
      {
        name: '普鲁士皇冠珍宝室与伯爵厅内景 (Crown Treasury)',
        tag: '细致内景',
        desc: '一楼镇馆展示璀璨的普鲁士皇冠与骑士铠甲，二楼设普鲁士皇家蓝书房。',
      },
    ],
    interiorRooms: [
      { name: '1F 普鲁士皇冠珍宝馆 & 骑士板甲厅', tag: '1F 皇冠珍宝', desc: '防弹水晶展柜高悬普鲁士金色皇冠，两侧肃立中世纪骑士全身板甲。' },
      { name: '1F 哥特红石柱伯爵大厅 & 国宴长桌', tag: '1F 伯爵大厅', desc: '彩绘玻璃高窗、哥特大壁炉、三角钢琴与普鲁士皇家国宴长桌。' },
      { name: '2F 普鲁士皇家蓝金四柱帷幔主卧', tag: '2F 王后寝宫', desc: '普鲁士蓝天鹅绒配纯金穗带的四柱大床、胡桃木大衣柜与梳妆台。' },
      { name: '2F 腓特烈大帝藏书馆 & 云端观景台', tag: '2F 藏书/记忆', desc: '满墙德意志历史典籍、腓特烈大帝长笛记忆展柜与山巅黄铜望远镜。' },
    ],
    waterFeatures: '护城壕沟雨水蓄水池与庭院狮首石雕喷泉',
    foliage: '施瓦本山麓黑森林冷杉、云杉与悬崖常春藤',
  },
  {
    idx: 5,
    bdId: 'BD-145',
    dhId: 'diorama_dollhouse_37',
    slug: 'building-castle-05-himeji-white-heron-japan',
    dhSlug: 'diorama-dollhouse-37-himeji-samurai-tenshu-interior',
    countryBadge: '🇯🇵 日本兵库 · 第一名城“白鹭城”连立式天守',
    name: 'Himeji Castle — White Heron Tenshu Keep',
    subtitle: '日本 · 姬路城 (真实还原五重六阶大天守、三座小天守连立回廊、扇形高石垣与樱花护城河)',
    dhName: 'Himeji Tenshu — Samurai Armor Hall & Princess Sen Suite',
    dhSubtitle: '姬路城天守阁细致内景 · 大黑柱武士铠甲刀架厅、金箔屏风茶道室、千姬和室寝宫与桧木私汤',
    category: 'culture',
    theme: 'Authentic Himeji Castle (Shirasagi-jo): Curved Fan-Slope Ishigaki Stone Base, Brilliant White Plaster Walls, 5-Tiered Main Tenshu + 3 Subsidiary Keeps, Karahafu Gables, Gold Shachihoko & Sakura Moat',
    description:
      '【真实还原日本国宝第一名城·姬路城】因其纯白灰泥外墙与飞扬的多层歇山顶宛如展翅白鹭而得名“白鹭城”：底部是极具力学美感的弧形“扇之勾配”干垒巨石高石垣与碧绿内濠护城河，主体还原五重六阶大天守与西、西北、东三座小天守通过渡橹回廊围合的“连立式天守”真实格局，屋脊饰黄金鯱（Shachihoko），四周环绕满开染井吉野樱与朱红木桥。',
    dhDescription:
      '【姬路城天守阁专属双层细致内景】1F 还原贯通天守的千年桧木巨柱（东西大黑柱）、黑漆金威大铠（日本武士全身甲胄）与太刀陈列架、绘有松鹤的金箔屏风、以及大名茶道御膳席；2F 还原千姬公主（德川家康孙女）在西之丸百间廊的雪见障子和室闺房、古筝/琵琶雅乐角、兵法典籍书院与桧木香汤。',
    subcategories: [
      '五重六阶大天守与三座连立小天守',
      '纯白白漆灰泥墙与千鸟破风/唐破风重檐',
      '弧形“扇之勾配”高石垣与黄金屋脊鯱',
      '内濠碧水护城河、朱漆桥与盛开垂枝樱',
      '内置武士大铠厅与千姬和室双层细致内景',
    ],
    dhSubcategories: [
      '1F 大名黑漆金威武士大铠、太刀刀架与金箔松鹤屏风',
      '1F 千年桧木大黑柱、大名茶道炉席与御膳怀石料理台',
      '2F 千姬公主雪见障子和室主卧与刺绣打挂衣桁',
      '2F 孙子兵法与和歌古籍书院、家纹记忆展柜与桧木浴池',
    ],
    polyCount: 4940,
    primaryHex: '#FBFBF9',
    secondaryHex: '#4A5568',
    accentHex: '#F4A2B8',
    interiorFloorHex: '#C8B88A',
    interiorWallHex: '#F7F3E9',
    interiorFurnHex: '#7F1D1D',
    landmarks: [
      {
        name: '五重六阶连立式大天守 (5-Tiered Main Tenshu)',
        tag: '日本国宝',
        desc: '层叠飞翘的灰瓦白墙重檐、唐破风曲线山墙与屋顶闪耀的一对黄金鯱。',
      },
      {
        name: '扇形高石垣与樱花内濠 (Ishigaki & Sakura Moat)',
        tag: '真实城防',
        desc: '下缓上陡的弧线石墙倒映在飘落粉白樱花的护城河水中。',
      },
      {
        name: '武士甲胄大厅与千姬和室内景 (Samurai & Tatami Interior)',
        tag: '细致内景',
        desc: '内置武士金漆大铠、太刀架、榻榻米茶席与千姬和室闺房。',
      },
    ],
    interiorRooms: [
      { name: '1F 武士大铠太刀展厅 & 天守木阶', tag: '1F 武士甲胄', desc: '高台陈列黑红金漆大名武士甲胄、双层太刀架与传统箱段木梯。' },
      { name: '1F 金箔屏风茶道室 & 大名御膳席', tag: '1F 茶室/御膳', desc: '松鹤金箔屏风、茶釜铁壶、迎客松盆景与6人份漆器御膳长桌。' },
      { name: '2F 千姬公主雪见障子榻榻米主卧', tag: '2F 公主寝宫', desc: '精致障子格栅窗、丝绸御被榻、西阵织和服衣架与镜台。' },
      { name: '2F 兵法古籍书院 & 桧木温泉私汤', tag: '2F 书院/私汤', desc: '珍藏古兵法卷轴、扬羽蝶家纹记忆展柜与天然桧木温泉浴池。' },
    ],
    waterFeatures: '姬路城内濠碧绿护城河、石桥与锦鲤水岸',
    foliage: '满开染井吉野樱花林、百年黑松与修剪杜鹃灌木',
  },
  {
    idx: 6,
    bdId: 'BD-146',
    dhId: 'diorama_dollhouse_38',
    slug: 'building-castle-06-alcazar-segovia-spain',
    dhSlug: 'diorama-dollhouse-38-segovia-kings-hall-interior',
    countryBadge: '🇪🇸 西班牙卡斯蒂利亚 · 悬崖战舰船首古堡',
    name: 'Alcázar of Segovia — Cliffside Ship-Prow Castle',
    subtitle: '西班牙 · 塞哥维亚城堡 (真实还原悬崖尖削船首堡体、胡安二世十二浮雕圆塔与黑石板尖帽顶)',
    dhName: 'Alcázar of Segovia — Hall of the Kings & Mudéjar Gold Interior',
    dhSubtitle: '塞哥维亚城堡细致内景 · 穆德哈尔金箔钟乳穹顶、52位国王雕像大厅、伊莎贝拉王座与航海星盘书房',
    category: 'culture',
    theme: 'Authentic Alcázar of Segovia: Razor-Sharp Ship-Prow Cliff Fortress, Tower of John II with 12 Semi-Circular Turrets, Conical Witch-Hat Slate Spires & Drawbridge Moat',
    description:
      '【真实还原西班牙塞哥维亚阿尔卡萨尔城堡】迪士尼白雪公主城堡的另一大真实原型，坐落于两条河谷交汇的刀刃状石灰岩悬崖顶端，外形酷似一艘劈波斩浪的巨型石造战舰：前端是锋利无比的三角形船首堡垒与高耸圆锥黑石板尖顶主塔（敬礼塔），后端矗立镶嵌12座半圆浮雕小塔的胡安二世方塔（Torre de Juan II）与深邃护城河吊桥。',
    dhDescription:
      '【塞哥维亚城堡专属双层细致内景】1F 还原举世闻名的“国王大厅”（Sala de los Reyes）与“战船大厅”：头顶是璀璨夺目的西班牙穆德哈尔式纯金几何钟乳木雕天花板，正中设卡斯蒂利亚女王伊莎贝拉与斐迪南双王宝座台、皇家骑士全身铠甲与十字弓收藏；2F 还原摩尔几何花窗寝宫与哥伦布大航海时代星盘海图藏书馆！',
    subcategories: [
      '刀刃状悬崖三角形战舰船首堡垒',
      '胡安二世十二半圆浮雕巨塔 (Torre de Juan II)',
      '深灰石板圆锥“女巫尖帽”塔楼群',
      '穆德哈尔几何灰泥浮雕与护城河吊桥',
      '内置国王大厅与金箔穹顶双层细致内景',
    ],
    dhSubcategories: [
      '1F 卡斯蒂利亚双王鎏金宝座台与骑士全身十字铠甲',
      '1F 穆德哈尔金箔几何钟乳藻井大厅与王室晚宴桌',
      '2F 摩尔马蹄拱花窗丝绒四柱王室主卧',
      '2F 大航海星盘地球仪藏书馆与伊莎贝拉王冠记忆柜',
    ],
    polyCount: 4880,
    primaryHex: '#E6D2B5',
    secondaryHex: '#333A42',
    accentHex: '#D97706',
    interiorFloorHex: '#A66E4E',
    interiorWallHex: '#F8F2E6',
    interiorFurnHex: '#991B1B',
    landmarks: [
      {
        name: '战舰船首敬礼塔 (Ship-Prow Keep & Witch-Hat Spire)',
        tag: '独一无二',
        desc: '凌空突出的尖锐船首状岩壁与四角环绕圆锥小尖塔的主塔楼。',
      },
      {
        name: '胡安二世十二附塔主门楼 (Tower of John II)',
        tag: '真实立面',
        desc: '立面密布十二座半圆柱小塔与穆德哈尔几何雕饰的宏伟迎宾高塔。',
      },
      {
        name: '国王大厅与大航海书房内景 (Hall of the Kings)',
        tag: '细致内景',
        desc: '内置双王宝座台、骑士重甲、穆德哈尔金顶与大航海星盘书房。',
      },
    ],
    interiorRooms: [
      { name: '1F 伊莎贝拉双王宝座厅 & 骑士重甲廊', tag: '1F 国王大厅', desc: '金色华盖双王宝座、托莱多钢铁骑士盔甲与石头旋转梯。' },
      { name: '1F 穆德哈尔金顶音乐厅 & 卡斯蒂利亚国宴桌', tag: '1F 金顶沙龙', desc: '雕刻壁炉、古典吉他/三角钢琴、银烛台国宴长桌与雪莉酒桶吧台。' },
      { name: '2F 阿尔罕布拉风马蹄拱窗四柱主卧', tag: '2F 王室寝宫', desc: '绯红织锦四柱帷幔床、摩尔雕花木柜与鎏金镜台。' },
      { name: '2F 大航海时代海图藏书馆 & 王室记忆柜', tag: '2F 航海/藏书', desc: '珍藏哥伦布航海海图、黄铜浑天仪、望远镜与王冠记忆展柜。' },
    ],
    waterFeatures: '埃雷斯马河与克拉莫雷斯河双谷交汇水流与松果庭院喷泉',
    foliage: '卡斯蒂利亚伞松、地中海丝柏与庭院修剪柑橘树',
  },
  {
    idx: 7,
    bdId: 'BD-147',
    dhId: 'diorama_dollhouse_39',
    slug: 'building-castle-07-eilean-donan-scotland',
    dhSlug: 'diorama-dollhouse-39-eilean-donan-highland-interior',
    countryBadge: '🏴󠁧󠁢󠁳󠁣󠁴󠁿 苏格兰高地 · 三湖交汇三拱石桥古堡',
    name: 'Eilean Donan Castle — Scottish Highland Loch Fortress',
    subtitle: '苏格兰 · 爱莲朵娜城堡 (真实还原三海湖交汇潮汐岛、三拱跨海古石桥、阶梯山墙主堡与威士忌内景)',
    dhName: 'Eilean Donan — Highland Clan Banquet Hall & Whisky Keep',
    dhSubtitle: '爱莲朵娜城堡细致内景 · 道格拉斯冷杉木梁宴会厅、苏格兰格纹氏族壁炉、双手阔剑与威士忌酒窖',
    category: 'culture',
    theme: 'Authentic Eilean Donan Castle: Rugged Grey Granite Keep with Crow-Stepped Gables, Iconic 3-Arch Stone Causeway Bridge over Sea Loch, Battlement Courtyard & Rowboat Jetty',
    description:
      '【真实还原苏格兰高地最美名片·爱莲朵娜城堡】坐落于杜伊赫湖（Loch Duich）等三座海湖交汇处的潮汐岩石小岛上：通过一座极具辨识度的**三孔石拱长桥**与陆地相连，主堡采用沧桑厚重的深灰苏格兰花岗岩砌筑，配有传统苏格兰阶梯形山墙（Crow-stepped gables）、雉堞女墙内院、角楼瞭望塔与高地木船码头。',
    dhDescription:
      '【爱莲朵娜城堡专属双层细致内景】1F 还原充满苏格兰高地传奇色彩的“氏族宴会大厅”（Banqueting Hall）：粗犷的花岗岩族徽大壁炉、悬挂于墙上的麦克雷氏族（Clan MacRae）格纹旗帜与苏格兰双手大剑（Claymore）、风笛与威士忌橡木桶珍藏窖；2F 还原高地红绿格纹四柱木床主卧、苏格兰历史古籍书房与湖景铜浴缸。',
    subcategories: [
      '标志性跨海三孔古石拱桥',
      '苏格兰深灰花岗岩主塔楼 (Keep)',
      '传统阶梯山墙 (Crow-Stepped Gables) 与雉堞城墙',
      '三海湖交汇镜面水域与木船栈桥',
      '内置高地氏族宴会厅与威士忌酒窖内景',
    ],
    dhSubcategories: [
      '1F 苏格兰双手阔剑展台、风笛与年份单一麦芽威士忌酒桶窖',
      '1F 花岗岩族徽大壁炉、格纹软装沙龙与橡木氏族长宴会桌',
      '2F 苏格兰皇家红格纹 (Tartan) 四柱橡木大床主卧',
      '2F 高地氏族历史藏书阁、航海望远镜与温暖铜浴池',
    ],
    polyCount: 4720,
    primaryHex: '#7D8287',
    secondaryHex: '#2D3748',
    accentHex: '#B91C1C',
    interiorFloorHex: '#6D4C3D',
    interiorWallHex: '#E5DEC9',
    interiorFurnHex: '#991B1B',
    landmarks: [
      {
        name: '跨海三拱古石桥 (Three-Arch Loch Stone Bridge)',
        tag: '灵魂构图',
        desc: '连接潮汐小岛与高地岸边的长石桥，构成爱莲朵娜最经典的明信片视角。',
      },
      {
        name: '阶梯山墙花岗岩主堡 (Crow-Stepped Granite Keep)',
        tag: '高地建筑',
        desc: '厚重粗犷的石砌主楼、阶梯状山墙屋顶与环抱内院的防御石墙。',
      },
      {
        name: '高地氏族宴会厅与威士忌窖内景 (Clan Banquet Hall)',
        tag: '细致内景',
        desc: '内置壁炉炉火、苏格兰格纹软装、双手大剑与单一麦芽威士忌橡木桶。',
      },
    ],
    interiorRooms: [
      { name: '1F 高地阔剑族徽厅 & 威士忌橡木桶窖', tag: '1F 威士忌/阔剑', desc: '陈列年份苏格兰威士忌橡木桶、高地双手大剑与厚重橡木楼梯。' },
      { name: '1F 氏族石壁炉大厅 & 橡木盛宴长桌', tag: '1F 氏族宴会厅', desc: '熊熊燃烧的花岗岩壁炉、格纹扶手椅、三角钢琴与6人橡木宴会桌。' },
      { name: '2F 麦克雷氏族红格纹四柱橡木主卧', tag: '2F 理想居住', desc: '温暖苏格兰格纹帷幔大床、实木大衣柜与复古黄铜台灯。' },
      { name: '2F 高地文学藏书阁 & 湖景黄铜浴池', tag: '2F 藏书/记忆', desc: '珍藏司各特与彭斯诗集、氏族勋章记忆展柜、望远镜与独立浴缸。' },
    ],
    waterFeatures: '三座苏格兰海湖（Sea Lochs）交汇深蓝水面与潮汐倒影',
    foliage: '苏格兰高地紫石楠花（Heather）、海岸赤松与苔藓岩岸',
  },
  {
    idx: 8,
    bdId: 'BD-148',
    dhId: 'diorama_dollhouse_40',
    slug: 'building-castle-08-prague-castle-st-vitus',
    dhSlug: 'diorama-dollhouse-40-prague-vladislav-alchemist-interior',
    countryBadge: '🇨🇿 捷克布拉格 · 世界最大古堡群与黄金巷',
    name: 'Prague Castle — St. Vitus & Golden Lane Complex',
    subtitle: '捷克 · 布拉格城堡 (真实还原圣维特哥特双塔、巴洛克绿铜洋葱顶南钟楼、旧皇宫与彩色黄金巷小屋)',
    dhName: 'Prague Castle — Vladislav Hall & Alchemist Study Interior',
    dhSubtitle: '布拉格城堡细致内景 · 弗拉季斯拉夫花瓣肋拱大厅、波西米亚水晶灯、鲁道夫二世天文炼金室与斯特拉霍夫书院',
    category: 'culture',
    theme: 'Authentic Prague Castle Complex: St. Vitus Gothic Flying Buttresses & Twin Spires, Green Copper Onion-Domed Clocktower with Golden Gate, Old Royal Palace & Pastel Golden Lane Cottages',
    description:
      '【真实还原吉尼斯世界最大古堡群·布拉格城堡核心区】俯瞰伏尔塔瓦河与查理大桥的千年皇城浓缩切片：高耸入云的圣维特主教座堂哥特双尖塔与南侧高达96米的**绿铜巴洛克洋葱顶金色大门大钟楼**，衔接红瓦白墙的旧皇宫（弗拉季斯拉夫大厅），城墙内侧嵌入一排色彩斑斓的**黄金巷（Zlatá ulička）微缩炼金术士与卡夫卡故居小屋**！',
    dhDescription:
      '【布拉格城堡专属双层细致内景】1F 还原欧洲文艺复兴与晚期哥特交融的“弗拉季斯拉夫骑手大厅”及黄金巷炼金工坊：旋转花瓣状肋架拱顶、璀璨的波西米亚吹制水晶大吊灯、天文钟机械星盘与炼金术蒸馏器；2F 还原哈布斯堡帝国鲁道夫二世珍奇艺术馆、穆夏风格彩窗主卧、以及哲学神学整墙藏书馆。',
    subcategories: [
      '圣维特哥特飞扶壁与高耸双尖塔',
      '绿铜洋葱顶南钟楼与金色马赛克大门',
      '旧皇宫红瓦大殿 (Vladislav Hall)',
      '黄金巷彩色微缩炼金术士排屋 (Golden Lane)',
      '内置波西米亚水晶大厅与天文炼金室内景',
    ],
    dhSubcategories: [
      '1F 布拉格天文钟机械浑天仪与黄金巷炼金蒸馏台',
      '1F 波西米亚水晶大吊灯、莫扎特三角钢琴与皇室国宴长桌',
      '2F 穆夏新艺术彩窗丝绒四柱皇室主卧',
      '2F 斯特拉霍夫风整墙哲学藏书馆与鲁道夫二世奇珍记忆柜',
    ],
    polyCount: 4990,
    primaryHex: '#EDE6D6',
    secondaryHex: '#2D6A4F',
    accentHex: '#C85A32',
    interiorFloorHex: '#9C7A54',
    interiorWallHex: '#FAF5EB',
    interiorFurnHex: '#7F1D1D',
    landmarks: [
      {
        name: '绿铜洋葱顶南钟楼与圣维特双塔 (St. Vitus & Clocktower)',
        tag: '布拉格天际线',
        desc: '哥特黑石尖塔与巴洛克铜绿洋葱顶钟楼（镶嵌金色表盘）构成的标志性剪影。',
      },
      {
        name: '黄金巷彩色微缩排屋与伏尔塔瓦河岸 (Golden Lane)',
        tag: '传奇街巷',
        desc: '依附于城堡红砖城墙下的天蓝、鹅黄、粉红微型小屋与查理大桥水岸。',
      },
      {
        name: '波西米亚水晶厅与天文炼金书房内景 (Bohemian Interior)',
        tag: '细致内景',
        desc: '内置天文钟星盘、波西米亚水晶吊灯、三角钢琴与哲学书院。',
      },
    ],
    interiorRooms: [
      { name: '1F 天文钟浑天仪展厅 & 炼金奇珍角', tag: '1F 天文/炼金', desc: '展示金色黄道十二宫天文钟星盘、炼金器皿与旋转石阶。' },
      { name: '1F 波西米亚水晶音乐厅 & 帝国晚宴桌', tag: '1F 水晶大厅', desc: '多层波西米亚水晶吊灯、演奏级三角钢琴、壁炉与6人皇室晚宴桌。' },
      { name: '2F 波西米亚彩窗红丝绒四柱主卧', tag: '2F 皇室寝宫', desc: '绚丽彩色玻璃花窗、波西米亚红金四柱大床与雕花衣帽柜。' },
      { name: '2F 斯特拉霍夫哲学藏书馆 & 记忆展厅', tag: '2F 藏书/记忆', desc: '顶天立地的古典胡桃木书架、地球仪、望远镜与卡夫卡手稿记忆柜。' },
    ],
    waterFeatures: '山脚伏尔塔瓦河（Vltava）查理大桥水岸与皇家庭院歌唱喷泉',
    foliage: '皇家花园修剪菩提树、波西米亚红叶与黄金巷窗台花箱',
  },
  {
    idx: 9,
    bdId: 'BD-149',
    dhId: 'diorama_dollhouse_41',
    slug: 'building-castle-09-windsor-royal-round-tower',
    dhSlug: 'diorama-dollhouse-41-windsor-st-george-interior',
    countryBadge: '🇬🇧 英国伯克郡 · 世界最古老在用皇家温莎城堡',
    name: 'Windsor Castle — Royal Round Tower & St. George’s Ward',
    subtitle: '英国 · 温莎城堡 (真实还原白垩山丘皇家圆塔、飘扬王室旗、圣乔治哥特礼拜堂与皇家卫队大道)',
    dhName: 'Windsor Castle — St. George’s Hall & Waterloo State Interior',
    dhSubtitle: '温莎城堡细致内景 · 嘉德骑士纹章圣乔治大厅、君主紫金王座、滑铁卢国宴银器长桌与女王藏书馆',
    category: 'culture',
    theme: 'Authentic Windsor Castle: Monumental Round Tower on Chalk Motte Hill with Royal Standard Flag, Crenelated Bath-Stone Upper Ward, St. George’s Chapel Pinnacles & Long Walk Guard Avenue',
    description:
      '【真实还原英国王室官方居所·温莎城堡】跨越近千年历史的英国王室象征：中心是高耸于翠绿人造白垩土丘（Motte）之上的宏伟圆形主塔（Round Tower，顶端高悬英国皇家旗帜），东侧连接带雉堞垛口与八角塔楼的上区国事厅（Upper Ward State Apartments），西侧为布满哥特小尖塔的圣乔治礼拜堂，正前方延伸出红衣熊皮帽皇家卫队守护的林荫大道（The Long Walk）。',
    dhDescription:
      '【温莎城堡专属双层细致内景】1F 还原英国国宴最高殿堂“圣乔治大厅”（St. George’s Hall）与滑铁卢厅：橡木锤梁天花板与墙面密布嘉德骑士团（Order of the Garter）彩色纹章盾牌，设有英国君主紫红鎏金宝座华盖、皇家马车/劳斯莱斯收藏模型与纯金餐具国宴桌；2F 还原王室绯红国事卧室、温莎皇家图书馆与玛丽王后微缩玩偶屋展柜！',
    subcategories: [
      '翠绿土丘上的宏伟皇家圆塔 (Round Tower)',
      '巴斯石雉堞城垣与上区国事厅八角塔',
      '圣乔治哥特礼拜堂尖塔群',
      '皇家林荫大道、金色铁门与红衣卫兵岗亭',
      '内置圣乔治嘉德骑士大厅与国宴厅内景',
    ],
    dhSubcategories: [
      '1F 英国君主紫金华盖王座、嘉德骑士盾牌与皇家金马车模型',
      '1F 滑铁卢厅巨型波斯地毯、三角钢琴与大英帝国纯金餐具国宴桌',
      '2F 温莎王室绯红鎏金冠顶四柱国事主卧',
      '2F 温莎皇家手稿图书馆、达芬奇素描展柜与玛丽王后微缩屋',
    ],
    polyCount: 4920,
    primaryHex: '#DDD5C7',
    secondaryHex: '#4A5568',
    accentHex: '#DC2626',
    interiorFloorHex: '#8C2D2D',
    interiorWallHex: '#F7EFE2',
    interiorFurnHex: '#7F1D1D',
    landmarks: [
      {
        name: '白垩山丘皇家圆塔 (The Round Tower & Royal Standard)',
        tag: '温莎核心',
        desc: '建在倾斜翠绿圆丘上的巨型石砌圆塔，塔顶飘扬英国王室君主旗。',
      },
      {
        name: '上区国事厅与圣乔治礼拜堂 (State Apartments & Chapel)',
        tag: '王室威仪',
        desc: '连续的雉堞女墙、哥特尖窗与林荫大道入口处的红衣卫兵岗哨。',
      },
      {
        name: '圣乔治大厅与皇家图书馆内景 (St. George’s Hall)',
        tag: '细致内景',
        desc: '内置嘉德骑士纹章宝座厅、大英皇家金器国宴桌与达芬奇手稿藏书馆。',
      },
    ],
    interiorRooms: [
      { name: '1F 嘉德骑士王座厅 & 皇家金马车展台', tag: '1F 圣乔治厅', desc: '紫金君主宝座华盖、骑士铠甲盾牌与黄金加冕马车收藏展位。' },
      { name: '1F 滑铁卢国宴大厅 & 皇家音乐沙龙', tag: '1F 滑铁卢厅', desc: '巨幅皇家肖像画、水晶枝形吊灯、三角钢琴与纯金餐具国宴长桌。' },
      { name: '2F 温莎王室绯红鎏金四柱国事主卧', tag: '2F 国事寝宫', desc: '皇家徽章冠顶四柱大床、胡桃木礼服衣柜与鎏金梳妆台。' },
      { name: '2F 温莎皇家图书馆 & 玛丽王后珍宝柜', tag: '2F 皇家藏书', desc: '珍藏莎士比亚与达芬奇手稿的整墙书柜、地球仪与王室记忆展柜。' },
    ],
    waterFeatures: '泰晤士河温莎河段天鹅水道与东露台喷泉花园',
    foliage: '温莎大公园双排百年橡树林荫道与圆塔护坡绿茵',
  },
  {
    idx: 10,
    bdId: 'BD-150',
    dhId: 'diorama_dollhouse_42',
    slug: 'building-castle-10-pena-palace-sintra-portugal',
    dhSlug: 'diorama-dollhouse-42-pena-palace-azulejo-interior',
    countryBadge: '🇵🇹 葡萄牙辛特拉 · 浪漫主义红黄撞色云端宫殿',
    name: 'Pena Palace — Sintra Romanticist Hilltop Castle',
    subtitle: '葡萄牙 · 佩纳宫城堡 (真实还原明黄与绯红撞色城垣、摩尔马蹄拱门、蓝白瓷砖穹顶塔与海神拱门)',
    dhName: 'Pena Palace — Azulejo Tile Cloister & Moorish Stucco Interior',
    dhSubtitle: '佩纳宫细致内景 · 葡萄牙阿兹勒赫蓝白花砖回廊、摩尔几何灰泥穹顶厅、王室鹿角晚宴厅与观海书房',
    category: 'culture',
    theme: 'Authentic Pena National Palace: Vivid Canary-Yellow Watchtower & Terracotta-Red Convent Wing, Moorish Horseshoe Arches, Tiled Dome Tower, Manueline Stone Carvings & Sintra Forest Crags',
    description:
      '【真实还原欧洲浪漫主义巅峰·葡萄牙辛特拉佩纳宫】耸立在辛特拉山脉巨石峰顶之上的绚丽童话城堡：大胆还原佩纳宫极具辨识度的**明快金丝雀黄（新宫瞭望翼）与浓烈赤陶红（旧修道院翼及钟楼）**双色碰撞立面、摩尔式双联马蹄拱门（拱门长廊）、带球形小圆顶的红黄角楼、葡萄牙曼努埃尔式航海绳索石雕窗框以及蓝白阿兹勒赫（Azulejo）彩瓷露台。',
    dhDescription:
      '【佩纳宫专属双层细致内景】1F 还原铺满葡萄牙国宝级“阿兹勒赫”蓝白手绘瓷砖（Azulejos）的曼努埃尔回廊、摩尔式繁复几何灰泥雕花大沙龙（Salão Nobre）、大航海卡拉维尔帆船模型与皇家鹿角国宴厅；2F 还原斐迪南二世国王天鹅绒四柱寝宫、东方瓷器与航海古籍藏书阁、以及远眺大西洋的黄铜望远镜露台！',
    subcategories: [
      '标志性金丝雀黄与赤陶红双色撞色堡体',
      '摩尔式马蹄形联拱长廊与球形圆顶塔',
      '葡萄牙阿兹勒赫 (Azulejo) 蓝白瓷砖露台',
      '曼努埃尔式珊瑚海绳石雕与海神拱门',
      '内置蓝白瓷砖回廊与摩尔雕花大厅细致内景',
    ],
    dhSubcategories: [
      '1F 葡萄牙阿兹勒赫蓝白花砖中庭与大航海帆船收藏展台',
      '1F 摩尔几何灰泥雕花大厅、三角钢琴与皇家鹿角晚宴厅',
      '2F 斐迪南二世浪漫主义鎏金四柱主卧与彩绘灰泥墙',
      '2F 葡萄牙航海史诗藏书阁、青花瓷记忆展柜与大西洋望远镜',
    ],
    polyCount: 4950,
    primaryHex: '#FACC15',
    secondaryHex: '#C2410C',
    accentHex: '#0284C7',
    interiorFloorHex: '#0284C7',
    interiorWallHex: '#FEF9C3',
    interiorFurnHex: '#9A3412',
    landmarks: [
      {
        name: '明黄摩尔马蹄拱翼楼与球顶塔 (Yellow Moorish Wing)',
        tag: '色彩地标',
        desc: '鲜亮的明黄色雉堞城墙、三联摩尔马蹄拱门与转角球形圆顶瞭望塔。',
      },
      {
        name: '绯红修道院高塔与蓝白瓷砖露台 (Red Tower & Azulejo Terrace)',
        tag: '真实还原',
        desc: '高居山巅的赤陶红方塔、日晷露台与贴满蓝白手绘瓷砖的女王露台。',
      },
      {
        name: '阿兹勒赫瓷砖厅与摩尔沙龙内景 (Azulejo & Moorish Salon)',
        tag: '细致内景',
        desc: '内置蓝白花砖地面、摩尔彩绘穹顶沙龙、大航海帆船与观海书房。',
      },
    ],
    interiorRooms: [
      { name: '1F 阿兹勒赫蓝白瓷砖厅 & 大航海帆船台', tag: '1F 蓝白瓷砖', desc: '葡萄牙蓝白手绘瓷砖拼花地面、卡拉维尔帆船模型与旋转石梯。' },
      { name: '1F 摩尔灰泥大沙龙 & 皇家鹿角晚宴厅', tag: '1F 摩尔沙龙', desc: '东方风格吊灯、演奏级三角钢琴、彩瓷壁炉与王室晚宴长桌。' },
      { name: '2F 斐迪南二世浪漫主义彩绘四柱主卧', tag: '2F 国王寝宫', desc: '融合哥特与摩尔纹样的四柱大床、雕花黑木衣柜与梳妆台。' },
      { name: '2F 大西洋观海藏书阁 & 航海记忆展厅', tag: '2F 航海/记忆', desc: '满墙《卢济塔尼亚人之歌》古籍、远东瓷器记忆柜与观海黄铜望远镜。' },
    ],
    waterFeatures: '佩纳宫山谷天鹅湖、摩尔八角喷泉与贝壳水池',
    foliage: '辛特拉亚热带云雾森林、树蕨、山茶花、雪松与百年木兰',
  },
];

// 1. Export the 10 Real-World Famous Castles (BD-141 to BD-150)
export const WORLD_FAMOUS_CASTLES_DATA: IslandMetadata[] = FAMOUS_CASTLE_SEEDS.map((s) => ({
  id: s.bdId,
  slug: s.slug,
  name: s.name,
  subtitle: s.subtitle,
  category: s.category,
  categoryName: `${s.countryBadge} · 十大最美真实城堡`,
  worldLevel: 'level2_building',
  baseType: 'ground_patch',
  collection: 'buildings_world_castles',
  subcategories: s.subcategories,
  theme: s.theme,
  description: s.description,
  isHeroReference: true,
  polyCount: s.polyCount,
  palette: [
    { hex: s.primaryHex, label: '主堡石材/墙体 (Primary Castle Stone)', role: '核心外墙与塔楼' },
    { hex: s.secondaryHex, label: '尖顶石板/撞色翼楼 (Roof & Wing)', role: '圆锥尖塔与屋顶' },
    { hex: s.accentHex, label: '皇室点睛与纹章 (Royal Highlights)', role: '金顶/砖楼/花饰' },
    { hex: '#FBF9F5', label: '内置双层细致内景 (Embedded Interior)', role: `直通 ${s.dhId}` },
  ],
  landmarks: s.landmarks.map((lm, i) => ({
    id: `${s.bdId}_lm_${i}`,
    name: lm.name,
    description: lm.desc,
    tag: lm.tag,
  })),
  terrainSpecs: {
    shape: 'terraced',
    underbelly: `【真实还原十大最美城堡 + 双层细致内景】内置可掀顶1F/2F城堡内景，并绑定独立全尺寸皇家内景 (${s.dhId} — ${s.dhName})`,
    waterFeatures: s.waterFeatures,
    foliage: s.foliage,
    elevationLevels: 3,
  },
  variants: {
    classic: {
      title: `${s.name} (经典写实自然光)`,
      description: `真实还原 ${s.subtitle} 的建筑比例、材质色彩与周围自然地貌。`,
      accentColor: s.primaryHex,
    },
    fantasy: {
      title: `${s.name} (黄金时刻/皇室夜色)`,
      description: '城堡窗户与内景皇冠吊灯透出温暖烛光，重现史诗黄昏夜景。',
      accentColor: s.accentHex,
    },
    minimal: {
      title: `${s.name} (建筑结构白模)`,
      description: '用于检视真实城堡塔楼群天际线与低多边形面数的纯净白模。',
      accentColor: '#94A3B8',
    },
  },
  minestWorldType: s.slug.replace(/-/g, '_'),
  assetFileRef: `/assets/models/buildings/castles/${s.slug}.glb`,
  dimensionRatio: `真实地标比例 · 含原地掀顶内景 & 独立内景 (${s.dhId})`,
}));

// 2. Export the 10 Paired Detailed Castle Interiors (diorama_dollhouse_33 to diorama_dollhouse_42)
export const WORLD_CASTLE_INTERIORS_DATA: IslandMetadata[] = FAMOUS_CASTLE_SEEDS.map((s) => ({
  id: s.dhId,
  slug: s.dhSlug,
  name: s.dhName,
  subtitle: s.dhSubtitle,
  category: s.category,
  categoryName: `${s.countryBadge} · 城堡双层细致内景`,
  worldLevel: 'level2_diorama',
  baseType: 'ground_patch',
  collection: 'category_dollhouse_interiors',
  subcategories: s.dhSubcategories,
  theme: `${s.theme} — Cutaway Royal Interior`,
  description: s.dhDescription,
  isHeroReference: true,
  polyCount: s.polyCount + 120,
  palette: [
    { hex: s.interiorFloorHex, label: '皇室大厅地面与镶嵌 (Royal Flooring)', role: '1F & 2F 地板' },
    { hex: s.interiorWallHex, label: '拱廊石壁与金箔护墙 (Palace Walls)', role: '室内墙面与壁龛' },
    { hex: s.interiorFurnHex, label: '王座帷幔与高定陈设 (Royal Drapes & Furniture)', role: '王座/御床/国宴椅' },
    { hex: s.accentHex, label: '皇冠珍宝与鎏金吊灯 (Crown Jewels & Chandeliers)', role: '皇室珍宝与照明' },
  ],
  landmarks: s.interiorRooms.map((rm, i) => ({
    id: `${s.dhId}_rm_${i}`,
    name: rm.name,
    description: rm.desc,
    tag: rm.tag,
  })),
  terrainSpecs: {
    shape: 'terraced',
    underbelly: `【世界十大最美城堡专属细致内景】对应外部城堡 (${s.bdId} — ${s.name})，支持 1F/2F 楼层剖面与 5 大皇家房间第一人称漫游`,
    waterFeatures: '皇家室内喷泉、跨河水道或温泉浴池',
    foliage: '宫廷插花、哥特回廊花坛与盆景',
    elevationLevels: 2,
  },
  variants: {
    classic: {
      title: `${s.dhName} (宫廷日间采光)`,
      description: `${s.dhSubtitle}，完整呈现王座厅、国宴厅、国王寝宫与皇家藏书珍宝馆。`,
      accentColor: s.interiorFurnHex,
    },
    fantasy: {
      title: `${s.dhName} (皇室烛光夜宴)`,
      description: '96烛皇冠大吊灯、壁炉火光与皇室珍宝展柜射灯交相辉映。',
      accentColor: s.accentHex,
    },
    minimal: {
      title: `${s.dhName} (室内空间白模)`,
      description: '检视双层皇家内景陈设密度与低多边形面数的纯净白模。',
      accentColor: '#94A3B8',
    },
  },
  minestWorldType: s.dhId,
  assetFileRef: `/assets/models/dioramas/dollhouses/${s.dhSlug}.glb`,
  dimensionRatio: `双层皇家城堡内景 · 对应 ${s.bdId} · 支持第一人称进屋漫游`,
}));
