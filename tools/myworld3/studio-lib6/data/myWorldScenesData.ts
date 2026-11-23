import { IslandMetadata } from '../types/island';

export interface MyWorldSceneMeta {
  id: string;
  slug: string;
  rankBadge: string;
  groupTag: 'confirmed_real' | 'film_literature' | 'recommended_candidate';
  groupLabel: string;
  statusLabel: string;
  pairedInteriorId: string;
  name: string;
  subtitle: string;
  category: IslandMetadata['category'];
  categoryName: string;
  theme: string;
  description: string;
  subcategories: string[];
  polyCount: number;
  mobileFpsTarget: string;
  primaryHex: string;
  secondaryHex: string;
  accentHex: string;
  collectibles: {
    vehicles: string;
    books: string;
    artworks: string;
    memories: string;
  };
  landmarks: { name: string; tag: string; desc: string }[];
  waterFeatures: string;
  foliage: string;
}

export const MY_WORLD_SCENE_SEEDS: MyWorldSceneMeta[] = [
  // ============================================================================
  // 一、现实世界场景（已明确选择/喜欢，威尼斯排第一，科茨沃尔德真实风格深度优化）
  // ============================================================================
  {
    id: 'MW-MYWORLD-01',
    slug: 'myworld-01-venice-grand-canal-sanctuary',
    rankBadge: 'TOP 1 · 首选现实场景',
    groupTag: 'confirmed_real',
    groupLabel: '一、现实世界场景（已确认首选）',
    statusLabel: '★ 明确要求排在第一位 · 小而精核心区',
    pairedInteriorId: 'diorama_dollhouse_21',
    name: 'Venice — Grand Canal & Rialto Core',
    subtitle: '威尼斯 · 大运河里亚托桥与水岸宫殿核心区 (排位第一)',
    category: 'culture',
    categoryName: 'My World · 现实世界首选',
    theme: 'Stylized-Realistic Venetian Canal Slice: Rialto Marble Arch Bridge, Gothic Palazzo Residence, Gondola Pier & Piazza Cafe',
    description:
      '【明确排在第一位的核心场景】遵循“小而精”原则，提炼威尼斯最具代表性的黄金水岸切片：洁白伊斯特拉石里亚托拱桥横跨翡翠色大运河，岸边矗立用户专属的哥特式玫瑰大理石水上官邸（含私家贡多拉与复古木制快艇船坞），对岸配圣马可风格红砖钟楼与水岸露天咖啡座。支持一键进入独立尺度的威尼斯豪宅内景。',
    subcategories: [
      '里亚托大理石拱桥 (Rialto Bridge)',
      '大运河翡翠水道与贡多拉',
      '专属水岸哥特官邸 (可进入独立室内)',
      '蓝金条纹系船柱与私家游艇船坞',
      '圣马可红砖钟楼与水岸咖啡座',
    ],
    polyCount: 4120,
    mobileFpsTarget: '60 FPS Mobile Ready',
    primaryHex: '#E8B4A2',
    secondaryHex: '#1D7874',
    accentHex: '#D4AF37',
    collectibles: {
      vehicles: '私家黑色鎏金贡多拉 + 意式复古 Riva 桃花心木游艇',
      books: '威尼斯航海古籍、马可波罗手稿与歌剧总谱藏书阁',
      artworks: '穆拉诺吹制玻璃吊灯、威尼斯画派油画与金箔假面',
      memories: '水岸落日船票、贡多拉船歌留声机与旅行纪念相册',
    },
    landmarks: [
      {
        name: '里亚托石拱廊桥 (Rialto Marble Arch)',
        tag: '核心地标',
        desc: '带有双侧拱廊商铺与大理石栏杆的标志性跨河石桥，构成场景视觉中心。',
      },
      {
        name: '玫瑰石哥特水上私宅 (Palazzo Residence)',
        tag: '理想住所',
        desc: '配备四叶草哥特石雕窗廊、水门码头与屋顶木制观景台 (Altana)，内部连接独立大空间画廊与船坞。',
      },
      {
        name: '贡多拉与木制快艇泊位 (Gondola & Yacht Dock)',
        tag: '收藏船坞',
        desc: '蓝金螺旋条纹系船柱环绕的私人水岸泊位，可展示用户收藏的船只。',
      },
    ],
    waterFeatures: '翡翠绿大运河S形主航道、桥下波光反射与私人游艇水门船坞',
    foliage: '威尼斯秘密庭院丝柏、窗台天竺葵花箱与攀援常春藤',
  },
  {
    id: 'MW-MYWORLD-02',
    slug: 'myworld-02-cotswolds-bibury-countryside',
    rankBadge: 'TOP 2 · 科茨沃尔德真实风格深度优化',
    groupTag: 'confirmed_real',
    groupLabel: '一、现实世界场景（已确认 & 深度优化）',
    statusLabel: '★ 已开发 · 按科茨沃尔德拜伯里真实风格优化',
    pairedInteriorId: 'diorama_dollhouse_22',
    name: 'English Countryside — Cotswolds Bibury',
    subtitle: '英国乡村 · 科茨沃尔德拜伯里蜜色石屋与溪流 (真实风格优化版)',
    category: 'life',
    categoryName: 'My World · 现实世界首选',
    theme: 'Authentic Cotswolds Bibury Arlington Row: Honey-Oolitic Limestone Weavers Cottages, Steep Stone-Slate Gables, River Coln & Low Stone Bridge',
    description:
      '【科茨沃尔德真实风格深度优化】严格参考英国科茨沃尔德拜伯里（Bibury Arlington Row）与水上伯顿（Bourton-on-the-Water）真实风貌：温暖的侏罗纪蜜色鲕粒石灰岩（Honey Limestone）干砌石墙、陡峭的石板瓦连续山墙（Steep Stone-Slate Gables）、方格铅条窗、科恩河清澈溪流上的低矮三拱古石桥、天鹅、干石矮墙（Dry-stone walls）与攀援英伦玫瑰。',
    subcategories: [
      '拜伯里阿灵顿蜜色石排屋 (Arlington Row)',
      '水上伯顿低矮三拱古石桥',
      '科茨沃尔德干石矮墙与玫瑰木门',
      '清澈科恩河溪流与白天鹅',
      '英式玻璃花房与复古古董老爷车位',
    ],
    polyCount: 3980,
    mobileFpsTarget: '60 FPS Mobile Ready',
    primaryHex: '#DEC08F',
    secondaryHex: '#6E655C',
    accentHex: '#E06D82',
    collectibles: {
      vehicles: '英伦墨绿复古摩根/阿斯顿马丁敞篷老爷车与复古单车',
      books: '简·奥斯汀与英国自然博物学手绘植物图谱专柜',
      artworks: '英国乡村水彩风景画、韦奇伍德骨瓷茶具与古董挂钟',
      memories: '英式下午茶记忆、花园手写园艺日志与壁炉火光相框',
    },
    landmarks: [
      {
        name: '阿灵顿蜜色石屋群 (Honey-Stone Gables)',
        tag: '真实建筑优化',
        desc: '真实还原科茨沃尔德标志性的蜜色石灰岩砌块、陡峭厚重的石板瓦斜顶、老虎窗与高耸石烟囱。',
      },
      {
        name: '科恩河低矮古石桥 (Bourton Low Stone Bridge)',
        tag: '水景核心',
        desc: '横跨清浅鳟鱼溪流的科茨沃尔德低矮石拱桥，天鹅在桥洞旁悠游。',
      },
      {
        name: '干石矮墙与大卫奥斯汀玫瑰园 (Dry-Stone Rose Court)',
        tag: '居住庭院',
        desc: '传统无砂浆手工干垒石墙围合的私人庭院，停放英伦老爷车并通往独立大空间英式书房内景。',
      },
    ],
    waterFeatures: '清澈见底的科恩河（River Coln）鹅卵石溪流、低矮石拱桥与成对白天鹅',
    foliage: '攀援大卫·奥斯汀粉玫瑰、紫罗兰薰衣草花境、垂柳与修剪黄杨灌木',
  },
  {
    id: 'MW-MYWORLD-03',
    slug: 'myworld-03-swiss-alps-zermatt-matterhorn',
    rankBadge: 'TOP 3 · 已初步开发场景',
    groupTag: 'confirmed_real',
    groupLabel: '一、现实世界场景（已确认）',
    statusLabel: '★ 已有初步开发 · 流畅风格化写实版',
    pairedInteriorId: 'diorama_dollhouse_23',
    name: 'Swiss Alps — Zermatt & Matterhorn Chalet',
    subtitle: '瑞士雪山 · 采尔马特马特洪峰与冰川木屋居所',
    category: 'nature',
    categoryName: 'My World · 现实世界首选',
    theme: 'Iconic Matterhorn Pyramid Peak, Alpine Larch Timber Chalet Residence, Glacier Express Stone Viaduct & Steaming Snow Spa',
    description:
      '【已开发核心场景精炼版】浓缩瑞士阿尔卑斯最令人心动的雪山居住体验：背景是棱角分明的马特洪峰金字塔雪顶，中景是横跨雪谷的冰川快车高架石拱桥与红色观景列车，前景是用户专属的落叶松原木与石英石双层雪山木屋别墅（配户外热气雪景温泉池与滑雪板架）。',
    subcategories: [
      '马特洪峰日照金山雪顶',
      '双层落叶松雪山木屋私宅',
      '冰川快车石拱桥与红色列车',
      '户外冒热气雪景木桶温泉',
      '瑞士冷杉雪林与篝火露台',
    ],
    polyCount: 3920,
    mobileFpsTarget: '60 FPS Mobile Ready',
    primaryHex: '#9C663E',
    secondaryHex: '#EAF2F8',
    accentHex: '#E63946',
    collectibles: {
      vehicles: '瑞士复古登山雪地车、手工定制双板滑雪板与雪橇收藏',
      books: '阿尔卑斯登山探险史、瑞士钟表机械图解与哲学藏书',
      artworks: '瑞士手工布谷鸟钟、雪山油画与矿物水晶原石标本',
      memories: '登顶纪念冰镐、热红酒篝火之夜与极光星空留影',
    },
    landmarks: [
      {
        name: '马特洪峰微缩雪山主峰 (Matterhorn Peak)',
        tag: '自然地标',
        desc: '采用风格化低多边形折面表现岩石与积雪交错的马特洪峰凌厉山形。',
      },
      {
        name: '采尔马特全景玻璃木屋 (Alpine Chalet Home)',
        tag: '理想住所',
        desc: '厚重积雪斜顶、挑高三角形落地暖光玻璃窗与高耸石砌壁炉烟囱，支持进入独立大空间木屋内景。',
      },
      {
        name: '冰川快车石拱高架桥 (Glacier Viaduct)',
        tag: '动态风景',
        desc: '经典瑞士多拱石桥上驶过鲜红色的冰川观景列车，与雪松林相映成趣。',
      },
    ],
    waterFeatures: '户外热气腾腾的雪山松木温泉泡池与冰川融水溪流',
    foliage: '覆雪瑞士冷杉林、高山雪绒花与堆叠桦木柴火垛',
  },

  // ============================================================================
  // 二、电影、文学与游戏世界（霍比屯排得靠前 + 霍格沃茨 + 绿山墙农舍 + 秘密花园 + 彭伯里庄园）
  // ============================================================================
  {
    id: 'MW-MYWORLD-04',
    slug: 'myworld-04-hobbiton-bag-end-shire',
    rankBadge: '影视文学 TOP 1 · 重点靠前',
    groupTag: 'film_literature',
    groupLabel: '二、电影、文学与游戏世界',
    statusLabel: '★ 重点优先排序 · 《霍比特人》《指环王》',
    pairedInteriorId: 'diorama_dollhouse_24',
    name: 'Hobbiton — Bag End Hillside Burrow',
    subtitle: '霍比屯 · 袋底洞山坡洞穴屋与圆形木门花园',
    category: 'culture',
    categoryName: 'My World · 电影文学世界',
    theme: 'Shire Green Turf Hillside Burrow, Iconic Round Emerald-Green & Yellow Doors with Brass Knob, Party Oak Tree & Watermill Bridge',
    description:
      '【重点靠前的电影世界场景】完美还原《霍比特人》《指环王》夏尔袋底洞（Bag End）：温润起伏的翠绿草甸山坡中嵌入舒适的洞穴屋，正中央是标志性的翡翠绿圆形木门（中央镶嵌闪亮黄铜圆门把手），两侧配有精致的圆形十字花格木窗、山坡顶上的古老大橡树、红砖歪烟囱、木栅栏菜园、南瓜花圃以及远处的石拱桥与水车磨坊。',
    subcategories: [
      '标志性翡翠绿圆形木门 (中央黄铜把手)',
      '覆土草坡洞穴屋与山顶老橡树',
      '圆形花格木窗与红砖烟囱',
      '夏尔水车磨坊与双拱石桥',
      '木栅栏向日葵南瓜花园',
    ],
    polyCount: 4060,
    mobileFpsTarget: '60 FPS Mobile Ready',
    primaryHex: '#529447',
    secondaryHex: '#1B7A43',
    accentHex: '#F59E0B',
    collectibles: {
      vehicles: '甘道夫烟花木马车与夏尔乡村田园手推车',
      books: '《红皮书》(There and Back Again) 手稿、中土世界羊皮地图与草药图鉴',
      artworks: '精灵铸造宝剑挂饰、夏尔彩绘陶器与橡木酒桶',
      memories: '比尔博生日宴会请柬、矮人探险契约与袋底洞下午茶记忆',
    },
    landmarks: [
      {
        name: '袋底洞翡翠绿圆门 (Bag End Round Door)',
        tag: '灵魂地标',
        desc: '嵌在石砌挡土拱墙中的正圆形绿木门，中心设黄铜把手，门前铺设鹅卵石台阶与信箱。',
      },
      {
        name: '覆土草坡与山顶大橡树 (Hillside Oak & Turf Roof)',
        tag: '标志轮廓',
        desc: '屋顶与自然山坡草甸无缝融为一体，山丘顶端生长着枝叶繁茂的夏尔古橡树与砖烟囱。',
      },
      {
        name: '夏尔水车与石桥花圃 (Shire Mill & Garden)',
        tag: '田园生活',
        desc: '转动木水车、清澈小溪石桥与种满向日葵、南瓜的木栅栏前院，点击可进入宽敞的袋底洞圆拱内景。',
      },
    ],
    waterFeatures: '夏尔磨坊溪流、转动木水车与石拱小桥流水',
    foliage: '山顶古橡树、向日葵花丛、金黄南瓜地、攀援蔓生蔷薇与草坡野花',
  },
  {
    id: 'MW-MYWORLD-05',
    slug: 'myworld-05-hogwarts-magic-castle',
    rankBadge: '影视文学 · 魔法世界',
    groupTag: 'film_literature',
    groupLabel: '二、电影、文学与游戏世界',
    statusLabel: '★ 《哈利·波特》魔法城堡与大礼堂',
    pairedInteriorId: 'diorama_dollhouse_25',
    name: 'Hogwarts — Magic Castle & Great Hall',
    subtitle: '霍格沃茨 · 悬崖魔法城堡、大礼堂与天文塔',
    category: 'culture',
    categoryName: 'My World · 电影文学世界',
    theme: 'Scottish Highland Cliffside Magic Castle: Great Hall with Tall Lancet Windows, Astronomy Spire, Viaduct Bridge & Black Lake',
    description:
      '【《哈利·波特》魔法世界核心切片】矗立于黑湖悬崖之上的霍格沃茨魔法城堡核心区：包含高耸哥特尖顶与老虎窗的大礼堂（Great Hall）、错落有致的天文塔与猫头鹰圆塔、连接山谷的双层石拱高架长桥（Viaduct）、山脚下的船屋码头。内部独立空间完整还原漂浮蜡烛大礼堂、移动旋转楼梯与魔法图书馆！',
    subcategories: [
      '大礼堂哥特尖顶主厅 (Great Hall)',
      '天文塔与多座圆锥石板尖塔',
      '悬崖高架石拱长廊桥 (Viaduct)',
      '黑湖船屋码头与魔法灯船',
      '独立室内：漂浮蜡烛礼堂 + 移动楼梯 + 图书馆',
    ],
    polyCount: 4480,
    mobileFpsTarget: '60 FPS Mobile Ready',
    primaryHex: '#C8B99E',
    secondaryHex: '#334155',
    accentHex: '#FBBF24',
    collectibles: {
      vehicles: '飞天扫帚收藏架、霍格沃茨特快蒸汽火车模型与黑湖魔法木船',
      books: '魔法史、魔药学古籍、活点地图与禁书区秘典藏书墙',
      artworks: '会动的古典学院肖像画、分院帽、冥想盆与格兰芬多宝剑',
      memories: '猫头鹰录取通知书、学院金杯与魁地奇金色飞贼纪念匣',
    },
    landmarks: [
      {
        name: '大礼堂与迎宾钟楼庭院 (Great Hall & Quad)',
        tag: '核心主建筑',
        desc: '陡峭青石板屋顶、巨型哥特柳叶窗与四角钟塔，夜晚透出温暖的烛光。',
      },
      {
        name: '天文塔与高架石拱桥 (Astronomy Tower & Viaduct)',
        tag: '立体天际线',
        desc: '高耸入云的圆锥尖顶群塔与横跨悬崖的多孔石拱走廊桥。',
      },
      {
        name: '黑湖镜面水域与船屋 (Black Lake Boathouse)',
        tag: '水岸入口',
        desc: '悬崖底部的深邃湖面与哥特式小船屋，点击即可进入独立尺度的漂浮蜡烛大礼堂与移动楼梯内景。',
      },
    ],
    waterFeatures: '深邃神秘的黑湖（Black Lake）悬崖水岸与提灯魔法小船',
    foliage: '苏格兰高地松树、打人柳（Whomping Willow）与悬崖苔藓巨石',
  },
  {
    id: 'MW-MYWORLD-06',
    slug: 'myworld-06-green-gables-farmstead',
    rankBadge: '文学经典 · 田园治愈',
    groupTag: 'film_literature',
    groupLabel: '二、电影、文学与游戏世界',
    statusLabel: '★ 《绿山墙的安妮》加拿大农舍与花田',
    pairedInteriorId: 'diorama_dollhouse_26',
    name: 'Green Gables — Anne’s Orchard Farmhouse',
    subtitle: '绿山墙农舍 · 爱德华王子岛白墙绿顶农舍与苹果花田',
    category: 'life',
    categoryName: 'My World · 电影文学世界',
    theme: 'Prince Edward Island White Clapboard Farmhouse with Emerald-Green Gables, Blooming Apple Orchard, Red Soil Lane & Wildflower Meadow',
    description:
      '【《绿山墙的安妮》文学场景】加拿大爱德华王子岛的治愈田园居所：纯白木护墙板与标志性翠绿色交叉山墙屋顶（Green Gables）及百叶窗，门前是铺满落瓣的“欢喜白路”（盛开的粉白苹果园）、紫丁香与鲁冰花田、标志性的红土小径、白色木栅栏以及停着马车的谷仓庭院。',
    subcategories: [
      '白墙翠绿尖顶绿山墙农舍 (Green Gables)',
      '盛开的粉白苹果园 (欢喜白路)',
      '爱德华王子岛红土小径与白木栅栏',
      '闪光之湖小池塘与木桥',
      '安妮的东山墙阁楼花窗卧室 (独立内景)',
    ],
    polyCount: 3760,
    mobileFpsTarget: '60 FPS Mobile Ready',
    primaryHex: '#FAF9F5',
    secondaryHex: '#1E7E48',
    accentHex: '#F4A2B8',
    collectibles: {
      vehicles: '马修接安妮的复古双轮木马车与田园脚踏车',
      books: '安妮的诗歌笔记本、维多利亚时代浪漫小说与植物标本册',
      artworks: '压花相框、十字绣挂毯、复古碎花瓷茶具与苹果派烘焙台',
      memories: '泡泡袖连衣裙衣架、紫丁香花束、树莓汁瓶与挚友黛安娜信件',
    },
    landmarks: [
      {
        name: '绿山墙白木农舍 (Green Gables Farmhouse)',
        tag: '文学故居',
        desc: 'L形白色木板外墙、鲜亮的翠绿色陡坡山墙屋顶、绿色百叶窗与阳光门廊。',
      },
      {
        name: '“欢喜白路”苹果花果园 (Blooming Apple Orchard)',
        tag: '诗意自然',
        desc: '盛开粉白花朵的苹果树林夹道迎宾，树下散落花瓣与野花草甸。',
      },
      {
        name: '闪光之湖与红土马车道 (Lake of Shining Waters)',
        tag: '田园风光',
        desc: '波光粼粼的林间小湖与爱德华王子岛特有的暖红土小径，可进入安妮阁楼卧室与农舍厨房内景。',
      },
    ],
    waterFeatures: '“闪光之湖”（Lake of Shining Waters）清澈池塘与柳荫木栈桥',
    foliage: '盛开的粉白苹果花果树、紫丁香丛、多彩鲁冰花田与白桦树',
  },
  {
    id: 'MW-MYWORLD-07',
    slug: 'myworld-07-secret-garden-walled-sanctuary',
    rankBadge: '文学经典 · 秘境花园',
    groupTag: 'film_literature',
    groupLabel: '二、电影、文学与游戏世界',
    statusLabel: '★ 英国文学《秘密花园》围墙花园与古庄园',
    pairedInteriorId: 'diorama_dollhouse_27',
    name: 'The Secret Garden — Walled Rose Sanctuary',
    subtitle: '秘密花园 · 常春藤古石墙、隐秘木门与古老庄园',
    category: 'nature',
    categoryName: 'My World · 电影文学世界',
    theme: 'Yorkshire Ancient Ivy-Covered Walled Garden, Hidden Arched Wooden Door, Rose Pergola Walkways, Sundial Fountain & Manor Wing',
    description:
      '【英国文学《秘密花园》】被岁月与常春藤温柔包裹的私密天地：高耸的古老约克郡青石围墙爬满翠绿常春藤与蔓生玫瑰，藤蔓间藏着那扇需要金钥匙开启的拱形旧木门；围墙内是生机勃发的秘密玫瑰迷宫、古典石雕日晷与睡莲喷泉、花架拱廊、神秘鹅卵石小径，后方连接米塞尔斯韦特古老庄园侧翼与玻璃花房。',
    subcategories: [
      '常春藤掩映的拱形隐秘木门',
      '四面合围的古老青石花园高墙',
      '盛放玫瑰拱廊与神秘石板小径',
      '古典石雕日晷与睡莲喷泉池',
      '米塞尔斯韦特庄园侧翼与玻璃温室',
    ],
    polyCount: 4020,
    mobileFpsTarget: '60 FPS Mobile Ready',
    primaryHex: '#8E877C',
    secondaryHex: '#2D6A4F',
    accentHex: '#E63962',
    collectibles: {
      vehicles: '英式古典藤编花园手推车与复古铁艺秋千',
      books: '弗朗西丝·伯内特原版藏书、英国玫瑰栽培图谱与鸟类图鉴',
      artworks: '开启花园的古铜金钥匙展盒、知更鸟石雕、日晷与植物水彩画',
      memories: '第一株破土雪滴花记忆瓶、花园秋千时光与玻璃温室下午茶',
    },
    landmarks: [
      {
        name: '常春藤隐秘拱门 (Hidden Ivy Arch Door)',
        tag: '故事起点',
        desc: '厚重古石墙上被垂挂常春藤半掩的橡木圆拱门，门锁处点缀金色钥匙微光。',
      },
      {
        name: '中心日晷与睡莲玫瑰池 (Sundial & Rose Fountain)',
        tag: '花园核心',
        desc: '十字神秘小径交汇处的古典石雕日晷水池，四周环绕四座攀满红粉玫瑰的铁艺花拱。',
      },
      {
        name: '古老庄园玻璃花房翼楼 (Manor Conservatory Wing)',
        tag: '居住空间',
        desc: '花园北侧衔接古老庄园石砌侧翼与维多利亚玻璃温室，可进入独立尺度的温室书房与肖像长廊内景。',
      },
    ],
    waterFeatures: '中央十字水道、睡莲喷泉池与青苔石槽涌泉',
    foliage: '层叠常春藤古墙、千朵红粉攀援玫瑰、飞燕草、雪滴花与古老紫杉树',
  },
  {
    id: 'MW-MYWORLD-08',
    slug: 'myworld-08-pemberley-estate-pride-prejudice',
    rankBadge: '文学经典 · 贵族庄园',
    groupTag: 'film_literature',
    groupLabel: '二、电影、文学与游戏世界',
    statusLabel: '★ 《傲慢与偏见》彭伯里庄园、湖泊与花园',
    pairedInteriorId: 'diorama_dollhouse_28',
    name: 'Pemberley — Pride & Prejudice Lake Estate',
    subtitle: '彭伯里庄园 · 《傲慢与偏见》新古典贵族庄园与天鹅湖泊',
    category: 'culture',
    categoryName: 'My World · 电影文学世界',
    theme: 'Derbyshire Chatsworth-Inspired Palladian Golden-Limestone Palace, Serpentine Mirror Lake, Three-Arch Stone Bridge & Classical Temple Folly',
    description:
      '【《傲慢与偏见》达西先生的彭伯里庄园】参考英国查茨沃斯庄园（Chatsworth House）打造的高贵自然风景庄园：金黄色砂岩筑成的宏伟帕拉第奥新古典主义主楼（配科林斯柱廊山花与雕刻石栏杆屋顶），前方是澄澈宽阔的镜面湖泊与三拱古典石桥，右侧林间点缀罗马圆顶神庙亭（Temple Folly）与阶梯叠水瀑布。支持进入达西雕塑画廊与音乐室独立内景。',
    subcategories: [
      '查茨沃斯式帕拉第奥金色主楼',
      '宽阔镜面湖泊与三拱古典石桥',
      '林间罗马圆顶神庙亭 (Temple Folly)',
      '皇家阶梯叠水瀑布与天鹅水岸',
      '独立室内：达西雕塑长廊 + 钢琴音乐室 + 藏书馆',
    ],
    polyCount: 4380,
    mobileFpsTarget: '60 FPS Mobile Ready',
    primaryHex: '#E6CFA3',
    secondaryHex: '#2A6F82',
    accentHex: '#C59B27',
    collectibles: {
      vehicles: '摄政时代贵族双马拉车 (Regency Carriage) 与湖畔木制游船',
      books: '彭伯里世代珍本藏书馆、古典哲学与莎士比亚全集专柜',
      artworks: '达西半身大理石雕像长廊、乔治安娜的古典古钢琴与家族油画',
      memories: '彭伯里湖畔偶遇信笺、舞会曲谱与英伦庄园四季账册',
    },
    landmarks: [
      {
        name: '彭伯里帕拉第奥主宫 (Pemberley Palladian House)',
        tag: '贵族主宅',
        desc: '对称端庄的暖金色石材立面、六柱科林斯门廊山花与高大拱窗，尽显摄政时代高贵气度。',
      },
      {
        name: '彭伯里镜面湖与三拱石桥 (Serpentine Lake & Bridge)',
        tag: '标志景观',
        desc: '伊丽莎白初见彭伯里时走过的三拱石桥与倒映庄园全景的宽阔湖面。',
      },
      {
        name: '林间古典圆顶神庙亭 (Classical Dome Folly)',
        tag: '花园景点',
        desc: '湖岸高处林间矗立的白色石柱圆顶凉亭，俯瞰整座庄园与阶梯水景。',
      },
    ],
    waterFeatures: '宽阔镜面彭伯里湖、三拱石桥与皇家花园阶梯叠水瀑布',
    foliage: '德比郡古老橡树林、修剪整齐的皇家草坪与湖畔垂柳',
  },

  // ============================================================================
  // 三、推荐但尚未最终确认的场景（供用户随时预览、对比与挑选）
  // ============================================================================
  {
    id: 'MW-MYWORLD-09',
    slug: 'myworld-09-kyoto-arashiyama-machiya',
    rankBadge: '推荐候选 01 · 待确认',
    groupTag: 'recommended_candidate',
    groupLabel: '三、推荐候选场景（待最终确认）',
    statusLabel: '💡 推荐候选 · 东方禅意居所 (含细致榻榻米茶室与汤池内景)',
    pairedInteriorId: 'diorama_dollhouse_29',
    name: 'Kyoto — Arashiyama Bamboo & Machiya Canal',
    subtitle: '京都岚山 · 竹林小径、高濑川町家水岸与红枫庭院 (推荐候选)',
    category: 'culture',
    categoryName: 'My World · 推荐候选场景',
    theme: 'Kyoto Sukiya Timber Machiya along Shallow Sakura-Lined Stream, Arashiyama Bamboo Grove, Red Bridge & Private Onsen',
    description:
      '【推荐候选场景】东方诗意栖居代表作：浅浅溪流两岸是木格栅京都传统町家与数寄屋造别业，石板小桥连接翠绿高耸的岚山竹林小径与红枫枯山水庭院，私宅内配备露天桧木温泉与榻榻米茶室。',
    subcategories: ['高濑川浅溪与木町家', '岚山翠竹林道', '枯山水与红枫庭院', '私家露天桧木汤池'],
    polyCount: 3820,
    mobileFpsTarget: '60 FPS Mobile Ready',
    primaryHex: '#D8B589',
    secondaryHex: '#3A3D42',
    accentHex: '#D6453A',
    collectibles: {
      vehicles: '京都传统人力车与复古日式单车',
      books: '俳句诗集、茶道古籍与浮世绘版画册',
      artworks: '古琴、乐烧抹茶碗、盆景与金箔屏风',
      memories: '岚山红叶书签、清水寺祈愿绘马与茶会记录',
    },
    landmarks: [
      { name: '临水数寄屋木町家', tag: '理想住所', desc: '悬挑于溪流之上的木造缘侧长廊与暖光障子纸窗。' },
      { name: '岚山青竹与朱漆小桥', tag: '自然切片', desc: '高耸翠竹林与横跨锦鲤池的朱红木桥。' },
    ],
    waterFeatures: '锦鲤溪流、竹筒水琴窟与露天温泉',
    foliage: '岚山毛竹林、深秋红枫与垂枝樱',
  },
  {
    id: 'MW-MYWORLD-10',
    slug: 'myworld-10-provence-lavender-stone-mas',
    rankBadge: '推荐候选 02 · 待确认',
    groupTag: 'recommended_candidate',
    groupLabel: '三、推荐候选场景（待最终确认）',
    statusLabel: '💡 推荐候选 · 南法阳光花田 (含细致石拱酒窖与花房内景)',
    pairedInteriorId: 'diorama_dollhouse_30',
    name: 'Provence — Lavender Valley & Stone Mas',
    subtitle: '南法普罗旺斯 · 薰衣草花海、古罗马水渠与石头庄园 (推荐候选)',
    category: 'nature',
    categoryName: 'My World · 推荐候选场景',
    theme: 'Southern French Limestone Mas Farmhouse with Powder-Blue Shutters, Rolling Purple Lavender Rows, Cypresses & Stone Fountain',
    description:
      '【推荐候选场景】充满阳光与香气的南法慢生活：暖黄色普罗旺斯石头农庄（配粉蓝色木百叶窗与红陶筒瓦），门前是成排盛开的紫色薰衣草田、高挑的意大利丝柏、古罗马石拱水渠遗迹与梧桐树荫下的石喷泉餐桌。',
    subcategories: ['普罗旺斯暖石农庄 (粉蓝百叶窗)', '成排紫色薰衣草花海', '丝柏大道与古石喷泉', '户外藤架长桌与私人酒窖'],
    polyCount: 3680,
    mobileFpsTarget: '60 FPS Mobile Ready',
    primaryHex: '#E8D5B5',
    secondaryHex: '#7C4DFF',
    accentHex: '#5C9EAD',
    collectibles: {
      vehicles: '法式复古雪铁龙 2CV 老爷车与藤篮单车',
      books: '《山居岁月》全集、法国葡萄酒庄图鉴与香草植物志',
      artworks: '梵高与塞尚风格后印象派油画、铜制蒸馏器与南法手工陶罐',
      memories: '干薰衣草香囊、酒庄年份橡木塞与夏日阳光野餐篮',
    },
    landmarks: [
      { name: '戈尔德石头庄园 (Provence Mas)', tag: '理想住所', desc: '石灰岩干砌外墙、粉蓝百叶窗与藤蔓遮阳露台。' },
      { name: '紫色薰衣草梯田 (Lavender Rows)', tag: '标志花田', desc: '整齐起伏的紫罗兰色花垄与丝柏树列。' },
    ],
    waterFeatures: '南法古村八角石喷泉与清凉泳池',
    foliage: '成排紫色薰衣草、油橄榄树、丝柏与向日葵',
  },
  {
    id: 'MW-MYWORLD-11',
    slug: 'myworld-11-amalfi-como-lemon-cliff',
    rankBadge: '推荐候选 03 · 待确认',
    groupTag: 'recommended_candidate',
    groupLabel: '三、推荐候选场景（待最终确认）',
    statusLabel: '💡 推荐候选 · 意式海岸度假 (含细致彩瓷海景拱廊与游艇内景)',
    pairedInteriorId: 'diorama_dollhouse_31',
    name: 'Amalfi & Como — Lemon Cliffside Villa',
    subtitle: '阿马尔菲与科莫 · 柠檬梯田悬崖拱廊与蔚蓝海湾 (推荐候选)',
    category: 'life',
    categoryName: 'My World · 推荐候选场景',
    theme: 'Pastel Italian Cliffside Villa with Majolica Tile Dome, Terraced Lemon Pergolas, Azure Sea Arch & Classic Scooter Road',
    description:
      '【推荐候选场景】地中海最迷人的悬崖海岸切片：错落堆叠的暖彩意式悬崖别墅、手绘马约利卡彩瓷圆顶、挂满金黄果实的柠檬花架梯田、盘山海景石阶，以及湛蓝海湾边的私家游艇与复古踏板车泊位。',
    subcategories: ['悬崖彩瓷圆顶别墅', '金黄柠檬藤架梯田', '拱形观海回廊 (Loggia)', '蔚蓝海湾与复古 Vespa 车道'],
    polyCount: 3890,
    mobileFpsTarget: '60 FPS Mobile Ready',
    primaryHex: '#F5CBA7',
    secondaryHex: '#0284C7',
    accentHex: '#FACC15',
    collectibles: {
      vehicles: '薄荷绿复古 Vespa 踏板摩托、经典菲亚特 500 与地中海帆船',
      books: '意大利建筑史、地中海美食食谱与古典诗集',
      artworks: '阿马尔菲手绘彩陶盘、古典大理石胸像与柠檬酒藏品',
      memories: '海风落日黑胶唱片、海岸公路车牌与夏日明信片',
    },
    landmarks: [
      { name: '悬崖柱廊海景别墅', tag: '理想住所', desc: '三联圆拱观海柱廊与马约利卡花砖露台。' },
      { name: '柠檬园海湾码头', tag: '海岸风情', desc: '层叠柠檬树下直通宝石蓝海面的岩石栈桥。' },
    ],
    waterFeatures: '宝石蓝地中海海湾、海蚀石拱与悬崖无边泳池',
    foliage: '阿马尔菲柠檬树、紫藤花架、三角梅与地中海伞松',
  },
  {
    id: 'MW-MYWORLD-12',
    slug: 'myworld-12-adriatic-clocktower-bakery-town',
    rankBadge: '推荐候选 04 · 待确认',
    groupTag: 'recommended_candidate',
    groupLabel: '三、推荐候选场景（待最终确认）',
    statusLabel: '💡 推荐候选 · 吉卜力式红顶海港 (含细致砖炉面包房与海景阁楼内景)',
    pairedInteriorId: 'diorama_dollhouse_32',
    name: 'Adriatic Haven — Clocktower & Seaside Bakery',
    subtitle: '亚得里亚海港 · 魔女宅急便风红瓦钟楼与海景面包房 (推荐候选)',
    category: 'culture',
    categoryName: 'My World · 推荐候选场景',
    theme: 'Ghibli-Inspired Coastal Hill Town: Terracotta Roofs, Brick Clocktower, Half-Timbered Attic Bakery with Flower Boxes & Seaplane Pier',
    description:
      '【推荐候选场景】灵感源自《魔女宅急便》科里科小镇与杜布罗夫尼克海港：面朝蔚蓝大海的石板坡道旁，矗立着爬满绿藤的欧式红瓦面包房（带阁楼天窗与铸铁招牌）、高耸的古典钟楼、有轨电车石街，以及停靠红色水上飞机的海湾木栈桥。',
    subcategories: ['绿藤欧式海景面包房与阁楼', '复古砖石大钟楼', '坡道有轨电车与鹅卵石街', '红色水上飞机海湾栈桥'],
    polyCount: 4040,
    mobileFpsTarget: '60 FPS Mobile Ready',
    primaryHex: '#F7EFE2',
    secondaryHex: '#C85A32',
    accentHex: '#0EA5E9',
    collectibles: {
      vehicles: '红色复古双翼水上飞机 (Porco Rosso style) 与送信红色单车',
      books: '飞行航海日志、欧式手工烘焙秘方与插画童话集',
      artworks: '面包花环挂饰、古董收音机、铜制望远镜与手绘海图',
      memories: '晴天海港飞行护目镜、阁楼收音机音乐与第一炉牛角包记忆',
    },
    landmarks: [
      { name: '花箱绿藤海景面包房 (Guchokipanya Bakery)', tag: '理想住所', desc: '带有欧式木筋墙、鲜花窗台与阳光阁楼的温馨两层住宅店铺。' },
      { name: '海港报时钟楼与水上飞机码头', tag: '核心地标', desc: '高耸金色表盘钟楼与停靠红色水上飞机的碧蓝海湾。' },
    ],
    waterFeatures: '蔚蓝亚得里亚海湾与水上飞机木浮桥',
    foliage: '面包房爬墙虎、天竺葵花箱、海滨香柏与柠檬树',
  },
];

// Convert to standard IslandMetadata so all 3D viewers, cards, and modals work seamlessly
export const MY_WORLD_SCENES_DATA: IslandMetadata[] = MY_WORLD_SCENE_SEEDS.map((s) => ({
  id: s.id,
  slug: s.slug,
  name: s.name,
  subtitle: s.subtitle,
  category: s.category,
  categoryName: `${s.rankBadge} · ${s.categoryName}`,
  worldLevel: 'level1_major',
  baseType: 'floating_island',
  collection: `myworld_${s.groupTag}`,
  subcategories: s.subcategories,
  theme: `${s.statusLabel} — ${s.theme}`,
  description: s.description,
  isHeroReference: s.groupTag !== 'recommended_candidate',
  polyCount: s.polyCount,
  palette: [
    { hex: s.primaryHex, label: '核心建筑材质 (Primary Architecture)', role: s.collectibles.vehicles },
    { hex: s.secondaryHex, label: '屋顶与水岸环境 (Roof & Environment)', role: s.collectibles.books },
    { hex: s.accentHex, label: '艺术与点睛色 (Accent & Highlights)', role: s.collectibles.artworks },
    { hex: '#FBF9F5', label: '人生记忆与收藏展陈 (Memory Showcase)', role: s.collectibles.memories },
  ],
  landmarks: s.landmarks.map((lm, i) => ({
    id: `${s.id}_lm_${i}`,
    name: lm.name,
    description: lm.desc,
    tag: lm.tag,
  })),
  terrainSpecs: {
    shape: 'terraced',
    underbelly: `【My World 原则：小而精 · 60FPS · 内外空间独立】绑定独立大空间室内 (${s.pairedInteriorId}) | 专属座驾：${s.collectibles.vehicles}`,
    waterFeatures: s.waterFeatures,
    foliage: s.foliage,
    elevationLevels: 3,
  },
  variants: {
    classic: {
      title: `${s.name} (经典写实自然光)`,
      description: `风格化写实光影下的 ${s.subtitle}，兼顾建筑质感与移动端 60 FPS 流畅度。`,
      accentColor: s.primaryHex,
    },
    fantasy: {
      title: `${s.name} (黄金时刻/魔法暖光)`,
      description: '窗户透出温暖室内灯光，水岸与花田笼罩在梦幻黄昏氛围中。',
      accentColor: s.accentHex,
    },
    minimal: {
      title: `${s.name} (白模体块与性能检视)`,
      description: '用于检视“小而精”核心构图比例与低多边形面数分布的纯净建筑白模。',
      accentColor: '#94A3B8',
    },
  },
  minestWorldType: s.slug.replace(/-/g, '_'),
  assetFileRef: `/assets/models/myworld/${s.slug}.glb`,
  dimensionRatio: `${s.mobileFpsTarget} · 小而精核心区 (独立室内 ${s.pairedInteriorId})`,
}));

// ============================================================================
// 8 PAIRED INDEPENDENT-SCALE INTERIORS FOR THE CONFIRMED MY WORLD SCENES
// (diorama_dollhouse_21 to diorama_dollhouse_28)
// Demonstrating "内外空间独立" + "收藏与居住（家具、汽车、书籍、艺术品、人生记忆）"
// ============================================================================
interface MyWorldInteriorSeed {
  id: string;
  slug: string;
  pairedSceneId: string;
  name: string;
  subtitle: string;
  category: IslandMetadata['category'];
  theme: string;
  description: string;
  subcategories: string[];
  polyCount: number;
  floorHex: string;
  wallHex: string;
  furnitureHex: string;
  accentHex: string;
  rooms: { name: string; tag: string; desc: string }[];
}

const MY_WORLD_INTERIOR_SEEDS: MyWorldInteriorSeed[] = [
  {
    id: 'diorama_dollhouse_21',
    slug: 'diorama-dollhouse-21-venice-palazzo-collector-interior',
    pairedSceneId: 'MW-MYWORLD-01',
    name: 'Venice Palazzo — Independent Collector Interior',
    subtitle: '威尼斯水岸官邸独立大内景 · 室内游艇船坞、艺术画廊与藏书阁',
    category: 'culture',
    theme: 'Independent-Scale Venetian Interior: 1F Indoor Riva Speedboat & Gondola Boathouse + Grand Salon; 2F Master Suite, Book Library & Memory Gallery',
    description:
      '【威尼斯 (#1) 专属独立室内空间】突破建筑外部尺寸限制：1F 左侧为直通运河的室内拱门游艇船坞（停放收藏的意式桃花心木快艇与贡多拉）与水磨石迎宾旋梯，右侧为威尼斯穆拉诺水晶灯会客厅、三角钢琴与长桌晚宴厅；2F 为四柱主卧、马可波罗航海古籍藏书墙与人生旅行记忆展柜。',
    subcategories: [
      '1F 室内私家游艇与贡多拉船坞 (汽车/船只收藏)',
      '1F 穆拉诺水晶灯音乐会客厅与晚宴厅',
      '2F 威尼斯哥特花窗四柱主卧',
      '2F 航海古籍藏书墙与人生记忆水晶展柜',
    ],
    polyCount: 4820,
    floorHex: '#D9A796',
    wallHex: '#FAF3E8',
    furnitureHex: '#1D7874',
    accentHex: '#D4AF37',
    rooms: [
      { name: '1F 运河水门船坞 & 旋转楼梯厅', tag: '1F 船坞/门厅', desc: '室内水道直接停靠收藏级桃花心木快艇，配黑白大理石棋盘地面与鎏金旋梯。' },
      { name: '1F 穆拉诺水晶灯沙龙 & 三角钢琴', tag: '1F 会客/艺术', desc: '壁炉、丝绒沙发、88键三角钢琴与威尼斯画派名画收藏墙。' },
      { name: '2F 大运河花窗主卧套房', tag: '2F 理想居住', desc: '哥特四叶草花窗、天鹅绒四柱帷幔大床与梳妆台。' },
      { name: '2F 航海藏书阁 & 人生记忆博物馆', tag: '2F 书籍/记忆', desc: '带滑梯的整墙古籍书柜、地球仪与发光人生记忆珍藏展柜。' },
    ],
  },
  {
    id: 'diorama_dollhouse_22',
    slug: 'diorama-dollhouse-22-cotswolds-collector-interior',
    pairedSceneId: 'MW-MYWORLD-02',
    name: 'Cotswolds Manor — Independent Collector Interior',
    subtitle: '科茨沃尔德石屋独立大内景 · 复古名车展厅、壁炉书房与阳光花房',
    category: 'life',
    theme: 'Authentic Cotswolds Honey-Stone & Oak-Beam Interior: 1F Vintage British Roadster Collector Bay + Inglenook Hearth Salon; 2F Timber Loft & Library',
    description:
      '【英国乡村·科茨沃尔德专属独立室内空间】外部是小巧精致的拜伯里蜜色石屋，进入室内后展开宽敞温馨的英伦理想生活空间：1F 设有透明玻璃分隔的英伦复古墨绿敞篷老爷车收藏展位、大石壁炉（Inglenook）格纹沙发客厅与英式乡村餐厨；2F 为橡木露明横梁主卧、整墙文学藏书馆与黄铜浴缸。',
    subcategories: [
      '1F 英伦墨绿古董敞篷跑车收藏室 (车辆收藏)',
      '1F 科茨沃尔德石壁炉与下午茶客厅',
      '2F 露明橡木横梁温馨主卧',
      '2F 简·奥斯汀文学藏书墙与人生记忆角',
    ],
    polyCount: 4680,
    floorHex: '#B8956A',
    wallHex: '#F5EFE4',
    furnitureHex: '#2D5A36',
    accentHex: '#D97757',
    rooms: [
      { name: '1F 英伦老爷车收藏室 & 石板门厅', tag: '1F 名车收藏', desc: '室内专属展台停放墨绿色英伦复古敞篷老爷车，配胡桃木旋转楼梯。' },
      { name: '1F 石砌壁炉客厅 & 骨瓷下午茶桌', tag: '1F 壁炉客厅', desc: '蜜色石材大壁炉、格纹扶手椅、三角钢琴与6人份英式骨瓷餐桌。' },
      { name: '2F 橡木斜梁乡村主卧套房', tag: '2F 理想居住', desc: '温暖木梁下的亚麻大床、碎花软装与玫瑰窗景梳妆台。' },
      { name: '2F 博物学藏书阁 & 黄铜独立浴池', tag: '2F 书籍/记忆', desc: '满墙英伦文学与植物图谱书架、手写记忆日志台与复古铜浴缸。' },
    ],
  },
  {
    id: 'diorama_dollhouse_23',
    slug: 'diorama-dollhouse-23-swiss-chalet-collector-interior',
    pairedSceneId: 'MW-MYWORLD-03',
    name: 'Swiss Alps Chalet — Independent Collector Interior',
    subtitle: '瑞士雪山木屋独立大内景 · 雪山火炉厅、滑雪装备库与记忆展厅',
    category: 'nature',
    theme: 'Swiss Alpine Timber & Quartzite Interior: 1F Ski & Off-Road Collector Gallery + Great Stone Hearth; 2F Panorama Loft & Sauna',
    description:
      '【瑞士雪山专属独立室内空间】1F 包含高山探险越野车/手工滑雪板收藏展区、双层挑高石英石壁炉暖厅与芝士火锅长桌；2F 为直面雪山落地窗的原木主卧、瑞士机械钟表与登山记忆陈列室、以及全景桑拿温汤池。',
    subcategories: [
      '1F 阿尔卑斯探险座驾与定制滑雪板收藏区',
      '1F 石砌大壁炉皮沙发暖厅与原木长桌',
      '2F 雪山全景落地窗原木主卧',
      '2F 登山人生记忆陈列柜与雪景汤池',
    ],
    polyCount: 4640,
    floorHex: '#9C6B43',
    wallHex: '#E5CEB0',
    furnitureHex: '#4A3728',
    accentHex: '#E63946',
    rooms: [
      { name: '1F 雪山装备/座驾收藏厅 & 木梯', tag: '1F 装备/座驾', desc: '展示阿尔卑斯定制座驾与滑雪板收藏，配厚重松木楼梯。' },
      { name: '1F 巨石壁炉会客厅 & 盛宴长桌', tag: '1F 壁炉暖厅', desc: '熊熊燃烧的石壁炉、干邑色真皮沙发与原木晚宴桌。' },
      { name: '2F 马特洪峰全景原木主卧', tag: '2F 理想居住', desc: '暖绒大床与雪山观景窗。' },
      { name: '2F 探险藏书阁 & 温泉浴池', tag: '2F 书籍/记忆', desc: '登山纪念勋章展柜、整墙书架与室内温汤池。' },
    ],
  },
  {
    id: 'diorama_dollhouse_24',
    slug: 'diorama-dollhouse-24-hobbiton-bag-end-interior',
    pairedSceneId: 'MW-MYWORLD-04',
    name: 'Hobbiton Bag End — Independent Burrow Interior',
    subtitle: '霍比屯袋底洞独立大内景 · 圆形绿门拱厅、比尔博书房与丰收餐室',
    category: 'culture',
    theme: 'Cozy Curved Oak-Ribbed Hobbit Burrow Interior: Round Emerald Door Foyer, Bilbo’s Map & Red Book Study, Hearth Salon & Feast Dining',
    description:
      '【霍比屯·袋底洞独立室内空间】推开翡翠绿圆形木门走入袋底洞内部：温暖的弧形橡木拱梁、抛光木地板与波斯地毯、挂满铜锅与美酒的宴会餐厅、壁炉摇椅客厅、以及摆满中土世界羊皮地图、《红皮书》手稿与冒险纪念品的比尔博书房！',
    subcategories: [
      '1F 翡翠绿圆门门厅与弧形橡木走廊',
      '1F 矮人欢聚大餐桌与圆窗壁炉客厅',
      '2F 袋底洞舒适主卧与圆窗梳妆角',
      '2F 比尔博《红皮书》手稿书房与中土藏宝室',
    ],
    polyCount: 4760,
    floorHex: '#7F5539',
    wallHex: '#F3E5AB',
    furnitureHex: '#2D6A4F',
    accentHex: '#F59E0B',
    rooms: [
      { name: '1F 圆门迎宾厅 & 田园收藏马车位', tag: '1F 圆门门厅', desc: '内部还原圆形门框、橡木衣帽架与田园收藏展台。' },
      { name: '1F 壁炉摇椅茶室 & 丰收长餐桌', tag: '1F 壁炉/晚宴', desc: '温暖圆壁炉、摆满下午茶点与银烛台的橡木长桌。' },
      { name: '2F 阳光圆窗洞穴主卧', tag: '2F 理想居住', desc: '手工拼布床品、雕花木床与圆窗花台。' },
      { name: '2F 比尔博地图书房 & 冒险记忆室', tag: '2F 书籍/记忆', desc: '满墙中土古籍、孤山地图书桌、地球仪与冒险藏品柜。' },
    ],
  },
  {
    id: 'diorama_dollhouse_25',
    slug: 'diorama-dollhouse-25-hogwarts-great-hall-interior',
    pairedSceneId: 'MW-MYWORLD-05',
    name: 'Hogwarts Castle — Great Hall & Library Interior',
    subtitle: '霍格沃茨独立大内景 · 漂浮蜡烛大礼堂、移动楼梯与魔法图书馆',
    category: 'culture',
    theme: 'Grand Gothic Magic Interior: Floating Candles Great Hall, Moving Grand Staircase with Talking Portraits, Dormitory Canopy Bed & Library',
    description:
      '【霍格沃茨专属超大尺度独立内景】充分体现“内外空间独立”优势：1F 左侧为挂满会动肖像画的移动大楼梯与飞天扫帚/魔法座驾收藏展台，右侧为悬浮着璀璨蜡烛的霍格沃茨大礼堂长桌与猫头鹰讲台；2F 为红金丝绒四柱帷幔寝室与珍藏千卷魔法古籍、冥想盆与记忆水晶球的魔法图书馆！',
    subcategories: [
      '1F 漂浮蜡烛大礼堂与学院长桌',
      '1F 移动大楼梯、肖像画墙与魔法座驾/飞天扫帚展区',
      '2F 学院丝绒四柱帷幔寝室',
      '2F 魔法图书馆、冥想盆与人生魔法记忆展柜',
    ],
    polyCount: 4940,
    floorHex: '#64748B',
    wallHex: '#E2D9C8',
    furnitureHex: '#7F1D1D',
    accentHex: '#FBBF24',
    rooms: [
      { name: '1F 移动楼梯大厅 & 魔法座驾收藏', tag: '1F 移动楼梯', desc: '哥特旋转主梯、满墙肖像画框与魔法座驾/飞天扫帚收藏台。' },
      { name: '1F 漂浮蜡烛大礼堂 & 学院盛宴桌', tag: '1F 大礼堂', desc: '空中漂浮烛光吊灯、哥特大壁炉与金盘高脚杯学院长桌。' },
      { name: '2F 格兰芬多风红金四柱帷幔主卧', tag: '2F 理想居住', desc: '深红鎏金四柱帷幔床、魔法台灯与学院挂毯。' },
      { name: '2F 魔法古籍图书馆 & 冥想盆记忆厅', tag: '2F 图书馆/记忆', desc: '高耸入顶的魔法书架、金色梯子、星象地球仪与发光冥想盆。' },
    ],
  },
  {
    id: 'diorama_dollhouse_26',
    slug: 'diorama-dollhouse-26-green-gables-anne-interior',
    pairedSceneId: 'MW-MYWORLD-06',
    name: 'Green Gables — Anne’s Attic & Farmhouse Interior',
    subtitle: '绿山墙农舍独立内景 · 安妮东山墙花窗阁楼、茶室与田园书房',
    category: 'life',
    theme: 'Warm Victorian Prince Edward Island Farmhouse Interior: Floral Wallpaper Parlor, Afternoon Tea Table, Anne’s East Gable Bedroom & Poetry Study',
    description:
      '【绿山墙农舍专属独立内景】1F 为铺设手工编织地毯的维多利亚花墙会客厅、竖琴/钢琴音乐角、苹果派与树莓汁下午茶长桌、以及复古田园马车/单车收藏位；2F 为安妮最爱的东山墙阁楼卧室（窗外即是盛开的雪白苹果花枝）与诗歌写作藏书室。',
    subcategories: [
      '1F 维多利亚碎花客厅与树莓汁下午茶餐桌',
      '1F 田园复古单车/马车收藏角与木楼梯',
      '2F 安妮的东山墙花窗卧室 (配泡泡袖礼服展架)',
      '2F 诗歌写作书房与植物标本记忆柜',
    ],
    polyCount: 4520,
    floorHex: '#C69C6D',
    wallHex: '#FAF6EE',
    furnitureHex: '#2E7D32',
    accentHex: '#F48FB1',
    rooms: [
      { name: '1F 绿山墙木梯门厅 & 田园座驾角', tag: '1F 门厅/收藏', desc: '温馨木旋转梯、迎宾花瓶与复古田园车收藏展位。' },
      { name: '1F 维多利亚壁炉客厅 & 下午茶餐厅', tag: '1F 客厅/茶宴', desc: '翠绿软包沙发、三角钢琴与6人份精致下午茶长桌。' },
      { name: '2F 安妮东山墙苹果花窗主卧', tag: '2F 理想居住', desc: '白色雕花床、碎花被褥与望向苹果花的梳妆台。' },
      { name: '2F 安妮文学书房 & 童年记忆展柜', tag: '2F 书籍/记忆', desc: '满墙文学名著、写作书桌与珍藏人生记忆的水晶展台。' },
    ],
  },
  {
    id: 'diorama_dollhouse_27',
    slug: 'diorama-dollhouse-27-secret-garden-manor-interior',
    pairedSceneId: 'MW-MYWORLD-07',
    name: 'The Secret Garden — Conservatory & Manor Interior',
    subtitle: '秘密花园庄园独立内景 · 玻璃植物温室、古典肖像廊与玫瑰书房',
    category: 'nature',
    theme: 'Yorkshire Manor & Glass Conservatory Cutaway: Indoor Rose & Fern Sunroom, Oil Portrait Gallery, Canopy Bedchamber & Botanical Library',
    description:
      '【秘密花园专属独立内景】将神秘庄园与阳光植物温室融为一体：1F 包含展示金钥匙与古董花园座驾的门厅、壁炉音乐客厅与室内鲜花长桌；2F 为玫瑰丝绒四柱主卧、植物学图谱藏书阁与铺满玫瑰花瓣的大理石浴池。',
    subcategories: [
      '1F 庄园古典楼梯厅与古董收藏车位',
      '1F 阳光鲜花音乐客厅与烛光晚宴桌',
      '2F 约克郡玫瑰四柱帷幔主卧',
      '2F 植物学藏书阁、金钥匙记忆柜与玫瑰浴池',
    ],
    polyCount: 4620,
    floorHex: '#8D6E63',
    wallHex: '#F5F2EB',
    furnitureHex: '#2D6A4F',
    accentHex: '#E63962',
    rooms: [
      { name: '1F 古庄园肖像楼梯厅 & 收藏展位', tag: '1F 肖像门厅', desc: '悬挂古典油画的迎宾大厅、旋转木梯与收藏座驾展位。' },
      { name: '1F 鲜花音乐沙龙 & 庄园晚宴厅', tag: '1F 音乐/晚宴', desc: '大理石壁炉、三角钢琴与玫瑰花饰长宴会桌。' },
      { name: '2F 玫瑰丝绒四柱主卧套房', tag: '2F 理想居住', desc: '浪漫玫瑰色四柱帷幔床与古董圆镜梳妆台。' },
      { name: '2F 植物图谱书房 & 玫瑰花瓣浴池', tag: '2F 书籍/记忆', desc: '整墙植物学古籍、金钥匙记忆珍藏匣与独立浴缸。' },
    ],
  },
  {
    id: 'diorama_dollhouse_28',
    slug: 'diorama-dollhouse-28-pemberley-gallery-interior',
    pairedSceneId: 'MW-MYWORLD-08',
    name: 'Pemberley Estate — Sculpture Gallery & Library Interior',
    subtitle: '彭伯里庄园独立大内景 · 达西雕塑画廊、古钢琴音乐厅与贵族藏书馆',
    category: 'culture',
    theme: 'Regency Aristocratic Palace Interior: Marble Bust Sculpture Gallery, Georgiana’s Grand Piano Salon, State Dining & Darcy’s Great Library',
    description:
      '【《傲慢与偏见》彭伯里庄园专属独立大内景】重现原著中最令伊丽莎白震撼的彭伯里室内盛景：1F 为铺设黑白棋盘大理石的雕塑长廊（陈列古典胸像与贵族老爷车/马车藏品）、乔治安娜的演奏级三角钢琴音乐沙龙与摄政王风格国宴厅；2F 为金色丝绸四柱主卧与达西先生引以为傲的世代藏书馆！',
    subcategories: [
      '1F 彭伯里大理石雕塑长廊与贵族座驾展位',
      '1F 乔治安娜三角钢琴音乐厅与摄政王晚宴桌',
      '2F 摄政时代鎏金丝绸四柱主卧',
      '2F 达西世代珍本藏书馆与人生记忆陈列室',
    ],
    polyCount: 4880,
    floorHex: '#D8C39E',
    wallHex: '#FAF5EB',
    furnitureHex: '#1E5668',
    accentHex: '#D4AF37',
    rooms: [
      { name: '1F 彭伯里雕塑大厅 & 贵族座驾展台', tag: '1F 雕塑长廊', desc: '古典大理石胸像柱列、宏伟主楼梯与收藏级古典座驾。' },
      { name: '1F 乔治安娜钢琴音乐厅 & 晚宴厅', tag: '1F 音乐/国宴', desc: '演奏级三角钢琴、壁炉金镜、丝绒沙发与6人份银器国宴长桌。' },
      { name: '2F 彭伯里湖景鎏金四柱主卧', tag: '2F 理想居住', desc: '皇家金蓝配色的四柱冠顶帷幔床、床尾凳与梳妆台。' },
      { name: '2F 达西大藏书馆 & 家族记忆荣誉室', tag: '2F 世代藏书', desc: '彭伯里几代人积累的满墙精装藏书、黄铜滑梯与记忆展台。' },
    ],
  },
  {
    id: 'diorama_dollhouse_29',
    slug: 'diorama-dollhouse-29-kyoto-machiya-teahouse-interior',
    pairedSceneId: 'MW-MYWORLD-09',
    name: 'Kyoto Machiya — Sukiya Tea Room & Onsen Interior',
    subtitle: '京都岚山町家独立细致内景 · 榻榻米茶室、床之间挂轴、枯山水坪庭与桧木私汤',
    category: 'culture',
    theme: 'Authentic Kyoto Sukiya Machiya Cutaway Interior: 1F Tatami Tea Room, Tokonoma Scroll Alcove, Indoor Koi Stream & Kaiseki Dining; 2F Shoji Suite, Haiku Library & Hinoki Onsen Bath',
    description:
      '【京都岚山町家专属细致内景】1F 左侧为引入高濑川溪水的室内锦鲤坪庭、人力车/复古单车收藏位与木阶梯，右侧为铺设蔺草榻榻米的茶道席（配风炉茶釜、抹茶碗）、床之间（Tokonoma）书法挂轴与迎客松盆景、以及怀石料理长桌；2F 为雪见障子纸窗主卧、俳句浮世绘藏书阁与热气缭绕的桧木温泉汤池。',
    subcategories: [
      '1F 室内锦鲤坪庭水景与京都复古车收藏',
      '1F 榻榻米茶道席、床之间挂轴与怀石料理厅',
      '2F 雪见障子纸窗和室主卧与和服衣桁',
      '2F 浮世绘俳句藏书阁、人生记忆绘马柜与桧木私汤',
    ],
    polyCount: 4860,
    floorHex: '#C2B280',
    wallHex: '#F4EFE6',
    furnitureHex: '#4E342E',
    accentHex: '#D6453A',
    rooms: [
      { name: '1F 锦鲤坪庭玄关 & 町家木梯', tag: '1F 坪庭/收藏', desc: '室内引水锦鲤池、石灯笼、京都复古座驾展台与箱段木梯。' },
      { name: '1F 榻榻米茶道室 & 怀石料理席', tag: '1F 茶室/怀石', desc: '床之间字画挂轴、迎客松盆景、铁壶茶席与精致木质料理桌。' },
      { name: '2F 雪见障子和室主卧 & 和服衣架', tag: '2F 理想居住', desc: '障子格栅窗、和风软榻床铺、金箔屏风与梳妆台。' },
      { name: '2F 俳句古籍书院 & 桧木温泉汤池', tag: '2F 藏书/私汤', desc: '满墙东方典籍、祈愿绘马记忆展柜与天然桧木温泉浴池。' },
    ],
  },
  {
    id: 'diorama_dollhouse_30',
    slug: 'diorama-dollhouse-30-provence-lavender-mas-interior',
    pairedSceneId: 'MW-MYWORLD-10',
    name: 'Provence Stone Mas — Wine Cellar & Sunroom Interior',
    subtitle: '南法普罗旺斯庄园独立细致内景 · 石拱酒窖、薰衣草蒸馏工坊与阳光画室',
    category: 'nature',
    theme: 'Provençal Limestone Farmhouse Interior: 1F Vaulted Wine & Lavender Distillery Cellar + Country Kitchen & Salon; 2F Powder-Blue Shutter Bedroom, Cezanne Art Studio & Library',
    description:
      '【南法普罗旺斯石头庄园专属细致内景】1F 左侧为复古雪铁龙老爷车展位、薰衣草铜制蒸馏器与橡木桶红酒窖，右侧为南法乡村石壁炉客厅、铜锅开放式厨房与向日葵长餐桌；2F 为粉蓝百叶窗阳光主卧、后印象派油画画架书房、以及薰衣草香氛独立浴缸。',
    subcategories: [
      '1F 普罗旺斯橡木桶酒窖、铜蒸馏器与法式老爷车展位',
      '1F 石砌壁炉客厅、挂满铜锅的法式餐厨与向日葵长桌',
      '2F 粉蓝百叶窗南法阳光主卧与藤编衣柜',
      '2F 梵高/塞尚风油画书房、年份酒塞记忆柜与香氛浴池',
    ],
    polyCount: 4780,
    floorHex: '#D2B48C',
    wallHex: '#F9F4E8',
    furnitureHex: '#5C9EAD',
    accentHex: '#7C4DFF',
    rooms: [
      { name: '1F 石拱酒窖、铜蒸馏器 & 老爷车厅', tag: '1F 酒窖/座驾', desc: '陈列橡木葡萄酒桶、薰衣草精油铜蒸馏器与法式复古老爷车。' },
      { name: '1F 南法壁炉客厅 & 铜锅美食长桌', tag: '1F 客厅/法餐', desc: '暖黄石灰岩壁炉、亚麻沙发、三角钢琴与法式田园晚宴桌。' },
      { name: '2F 粉蓝百叶窗薰衣草景主卧', tag: '2F 理想居住', desc: '浪漫南法四柱床、薰衣草束装饰与复古梳妆台。' },
      { name: '2F 阳光油画书房 & 人生记忆展柜', tag: '2F 画室/藏书', desc: '整墙《山居岁月》藏书、画架、酒庄记忆收藏柜与猫脚浴缸。' },
    ],
  },
  {
    id: 'diorama_dollhouse_31',
    slug: 'diorama-dollhouse-31-amalfi-como-cliff-villa-interior',
    pairedSceneId: 'MW-MYWORLD-11',
    name: 'Amalfi & Como Villa — Majolica Loggia & Yacht Interior',
    subtitle: '阿马尔菲与科莫湖别墅独立细致内景 · 手绘花砖海景大厅、意式咖啡吧与游艇展厅',
    category: 'life',
    theme: 'Italian Riviera Cliffside Villa Interior: 1F Mint Vespa & Riva Yacht Gallery + Majolica Tile Sea-View Salon & Espresso Bar; 2F Azure Suite, Architecture Library & Cliff Spa',
    description:
      '【阿马尔菲/科莫湖悬崖别墅专属细致内景】1F 左侧为薄荷绿复古 Vespa 踏板车与快艇收藏展厅，右侧为铺设蓝黄手绘马约利卡花砖的拱廊海景客厅、三角钢琴、意式浓缩咖啡吧台与海鲜长餐桌；2F 为蔚蓝海景四柱主卧、意大利建筑艺术藏书馆与悬崖观海大理石浴池。',
    subcategories: [
      '1F 薄荷绿复古 Vespa 与科莫湖游艇模型收藏厅',
      '1F 马约利卡手绘花砖客厅、三角钢琴与意式咖啡吧',
      '2F 地中海拱窗四柱主卧与步入式衣帽柜',
      '2F 意大利艺术藏书阁、黑胶记忆展柜与观海浴池',
    ],
    polyCount: 4840,
    floorHex: '#E8C39E',
    wallHex: '#FDFBF7',
    furnitureHex: '#0284C7',
    accentHex: '#FACC15',
    rooms: [
      { name: '1F 意式 Vespa/游艇展厅 & 大理石旋梯', tag: '1F 座驾/船坞', desc: '展示薄荷绿复古踏板摩托与游艇模型，配柠檬树盆栽与旋转楼梯。' },
      { name: '1F 马约利卡花砖沙龙 & 意式晚宴厅', tag: '1F 音乐/咖啡', desc: '蓝黄花砖、演奏级三角钢琴、意式咖啡吧台与6人海景晚宴桌。' },
      { name: '2F 蔚蓝海岸拱窗主卧套房', tag: '2F 理想居住', desc: '海风白纱四柱大床、柠檬黄软装与定制衣柜。' },
      { name: '2F 建筑艺术书房 & 悬崖海景浴池', tag: '2F 藏书/记忆', desc: '满墙意式美学典籍、海岸旅行记忆展柜、铜望远镜与大理石浴缸。' },
    ],
  },
  {
    id: 'diorama_dollhouse_32',
    slug: 'diorama-dollhouse-32-adriatic-bakery-clocktower-interior',
    pairedSceneId: 'MW-MYWORLD-12',
    name: 'Adriatic Seaside Bakery — Brick Oven & Attic Loft Interior',
    subtitle: '亚得里亚海景面包房独立细致内景 · 砖砌烤炉店铺、玻璃面包柜与阳光海景阁楼',
    category: 'culture',
    theme: 'Ghibli-Inspired Seaside Bakery & Attic Residence Interior: 1F Glowing Brick Bread Oven, Wooden Pastry Counter, Red Seaplane Model & Parlor; 2F Timber Attic Bedroom, Navigator Study & Clawfoot Bath',
    description:
      '【亚得里亚海港·吉卜力风面包房专属细致内景】1F 左侧还原热气腾腾的红砖拱形烤面包炉、摆满牛角包与法棍的木质玻璃点心柜台、面包花环与红色双翼水上飞机/送信单车收藏位，右侧为温馨的欧式壁炉茶座与家庭餐厅；2F 为琪琪风格阳光木梁阁楼卧室（带复古收音机与海景天窗）、航海飞行图纸书房与独立浴缸！',
    subcategories: [
      '1F 红砖拱形烤炉、全套木质玻璃面包陈列柜与水上飞机展位',
      '1F 欧式海港壁炉茶座、留声机与家庭烘焙长餐桌',
      '2F 阳光斜顶木梁海景阁楼卧室与复古收音机',
      '2F 飞行航海日志书房、黄铜望远镜与人生记忆展柜',
    ],
    polyCount: 4920,
    floorHex: '#B87B4C',
    wallHex: '#F7EFE2',
    furnitureHex: '#C85A32',
    accentHex: '#0EA5E9',
    rooms: [
      { name: '1F 砖砌烤炉面包铺 & 水上飞机收藏角', tag: '1F 面包房/收藏', desc: '发光红砖面包烤炉、双层玻璃牛角包点心柜台与红色水上飞机/单车展台。' },
      { name: '1F 海港壁炉咖啡座 & 烘焙晚宴厅', tag: '1F 咖啡/晚宴', desc: '温暖砖壁炉、复古留声机、三角钢琴与摆满茶点的实木长餐桌。' },
      { name: '2F 魔女宅急便风阳光海景阁楼卧室', tag: '2F 理想居住', desc: '斜木梁阁楼大床、红色复古收音机、衣帽柜与海景花窗。' },
      { name: '2F 航海飞行书房 & 记忆珍藏室', tag: '2F 飞行/记忆', desc: '手绘海图桌、黄铜观海望远镜、满墙童话食谱书架与第一炉面包记忆柜。' },
    ],
  },
];

export const MY_WORLD_INTERIORS_DATA: IslandMetadata[] = MY_WORLD_INTERIOR_SEEDS.map((s) => ({
  id: s.id,
  slug: s.slug,
  name: s.name,
  subtitle: s.subtitle,
  category: s.category,
  categoryName: 'My World · 独立尺度收藏内景 (Dollhouse)',
  worldLevel: 'level2_diorama',
  baseType: 'ground_patch',
  collection: 'category_dollhouse_interiors',
  subcategories: s.subcategories,
  theme: s.theme,
  description: s.description,
  isHeroReference: true,
  polyCount: s.polyCount,
  palette: [
    { hex: s.floorHex, label: '地面镶嵌与地毯 (Flooring)', role: '1F & 2F 地板' },
    { hex: s.wallHex, label: '法式护墙板与石墙 (Boiserie & Walls)', role: '室内墙体' },
    { hex: s.furnitureHex, label: '高定家具与软装 (Furniture & Drapes)', role: '沙发/帷幔/餐椅' },
    { hex: s.accentHex, label: '汽车/书籍/艺术/记忆收藏 (Collections)', role: '收藏与照明' },
  ],
  landmarks: s.rooms.map((rm, i) => ({
    id: `${s.id}_rm_${i}`,
    name: rm.name,
    description: rm.desc,
    tag: rm.tag,
  })),
  terrainSpecs: {
    shape: 'terraced',
    underbelly: `【内外空间独立 + 收藏与居住】对应外部世界 (${s.pairedSceneId}) — 支持在 3D 视窗内开关「汽车/书籍/艺术品/人生记忆」四大收藏模块并进入房间漫游`,
    waterFeatures: '室内船坞水道、玫瑰花瓣浴池或大理石喷泉',
    foliage: '室内鲜花插花、温室植物与盆景',
    elevationLevels: 2,
  },
  variants: {
    classic: {
      title: `${s.name} (自然采光剖面)`,
      description: `${s.subtitle}，完整展示家具、汽车、书籍、艺术品与人生记忆收藏。`,
      accentColor: s.furnitureHex,
    },
    fantasy: {
      title: `${s.name} (烛光壁炉夜色)`,
      description: '温暖的吊灯、壁炉火光与收藏展柜射灯氛围。',
      accentColor: s.accentHex,
    },
    minimal: {
      title: `${s.name} (空间动线白模)`,
      description: '检视独立室内空间布局与低多边形面数的纯净白模。',
      accentColor: '#94A3B8',
    },
  },
  minestWorldType: s.id,
  assetFileRef: `/assets/models/dioramas/dollhouses/${s.slug}.glb`,
  dimensionRatio: '独立大尺度双层室内 · 支持第一人称进屋漫游 & 四大收藏陈设切换',
}));
