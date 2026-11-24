/* Minest My World · 1:1 Disneyland & Disney Resort Master Edition (近 1:1 真实迪士尼乐园全境还原)
 * 768 x 768 x 88 True-Scale Voxel + High-Craft 3D Architectural Resort (1 unit ≈ 1 meter).
 * Complete Disneyland Park (~490m x 510m):
 *  - Esplanade, Floral Mickey, Twin Entry Tunnels & Main Street Steam Railroad Station
 *  - Town Square (City Hall, Fire Engine House No. 101 w/ Walt's Lamp, Opera House, Gazebo & Flagpole)
 *  - Full-Length 120m Continuous Main Street, U.S.A. + Center Street Flower Market + Jolly Holiday & Plaza Inn
 *  - Central Plaza Hub (Partners Statue, Hub Moat Ring & 6 Spoke Bridges) + 18-Spire Fairytale Castle & Swan Moat
 *  - Fantasyland Courtyard (Peter Pan, Toad Hall, Snow White, Pinocchio, Alice, Carrousel, Dumbo, Tea Party, Monstro Canal, Matterhorn & Small World)
 *  - Mickey's Toontown (Mickey's House, Minnie's House, El Capitoon Runaway Railway, Donald's Boat, GADGETcoaster & Toon Hills)
 *  - Frontierland, True-Scale Rivers of America wrapping Walkable Tom Sawyer Island, Mark Twain & Sailing Ship Columbia, Big Thunder Mountain
 *  - New Orleans Square (French Quarter Wrought-Iron Streets, Rideable Pirates of the Caribbean, Café Orleans, Haunted Mansion) & Bayou Country (Tiana's Bayou Adventure)
 *  - Adventureland (Enchanted Tiki Room, Bazaar, Banyan Treehouse, Indiana Jones Temple of the Forbidden Eye, Expanded Jungle Cruise)
 *  - Star Wars: Galaxy's Edge (Batuu NW Outpost + Millennium Falcon) & Tomorrowland (Astro Orbiter, Buzz, Star Tours, Rideable Space Mountain, Autopia, Submarine Lagoon)
 *  - Plus East/South Resort Campus: EPCOT, Hollywood Studios & Animal Kingdom / Pandora! */
(function (root) {
  'use strict';

  // The grid extends south (z 736..1152) for the Disneyland Park Paris expansion lobe.
  const W = 768, D = 1152, H = 64, WATER_Y = 36.4, PARK_Y = 40;
  // Disneyland Park Paris anchor points. The park is rotated 180° from its real orientation so its gates face
  // the existing island: entrance north, castle south, Frontierland east (guest's left), Discoveryland west.
  // Walt Disney World resort parks (east & south sectors). Shared by world paving and the resort-*.js builders.
  const RESORT = {
    epcot: { x: 620, zEarth: 228, zGate: 262, lagoon: { x: 620, z: 126, rx: 42, rz: 30 }, ring: { rx: 68, rz: 52 } },
    studios: { x: 616, zGate: 516, zTheatre: 606, zSunset: 566, tower: { x: 704, z: 566 }, lake: { x: 578, z: 606 }, toy: { x: 574, z: 668 } },
    kingdom: { x: 272, z: 640, pandora: { x: 196, z: 638 }, everest: { x: 344, z: 650 }, savanna: { x: 196, z: 702, rx: 48, rz: 20 }, harambe: { x: 262, z: 692 } }
  };
  const PARIS = {
    x: 384, zGate: 790, zStation: 808, zSquare: 830, zHub: 946, zCastle: 1002,
    rail: { x: 384, z: 958, rx: 225, rz: 150 },
    lake: { x: 512, z: 928, rx: 60, rz: 48, ix: 34, iz: 26 },
    manor: { x: 545, z: 868 },
    isle: { x: 500, z: 1042 },
    space: { x: 286, z: 944 },
    lagoon: { x: 318, z: 1004 }
  };
  const CX = 272.5; // 1:1 Disneyland Axial Centerline (Main Gate -> Town Square -> Main Street -> Hub -> Castle -> Carrousel)

  const T = {
    grass: 0, grassS: 1, grassSide: 1, dirt: 2, rock: 3, sand: 4, gravel: 5, ashlar: 6, limeSmooth: 7, limeCarved: 8,
    brick: 9, slate: 10, oak: 11, oakCarved: 12, beams: 13, parquet: 14, plaster: 15, glass: 16, stained: 17,
    door: 18, gold: 19, marble: 20, pine: 21, beech: 22, bark: 23, trunkTop: 24, path: 25, brook: 26,
    carpet: 27, lamp: 28, wool: 29, curtain: 30, moss: 31, iron: 32, coffer: 33, balus: 34, stove: 35,
    books: 36, fire: 37, flower: 38, planks: 39, bath: 40, wheat: 41, lead: 42, hedge: 43, slates: 44,
    rubble: 45, drystone: 46, coping: 47, tarmac: 48, flagstone: 49, dresser: 50, casement: 51, yew: 52,
    willow: 53, millstone: 54, ivy: 55, hood: 56, rug: 57, meadow: 58
  };

  const B = {
    AIR: 0, GRASS: 1, DIRT: 2, ROCK: 3, SAND: 4, SNOW: 5, PATH: 6, GRAVEL: 7, PINE: 8, BEECH: 9,
    BARK: 10, BROOK: 11, LIME: 12, LIMES: 13, LIMEC: 14, BRICK: 15, SLATE: 16, GLASS: 17, DOOR: 18,
    GOLD: 19, MARBLE: 20, OAK: 21, OAKC: 22, PARQ: 23, PLASTER: 24, COFFER: 25, CARPET: 26, LAMP: 27,
    BED: 28, TABLE: 29, CHAIR: 30, BENCH: 31, CURTAIN: 32, MOSS: 33, IRON: 34, BALUS: 35, STOVE: 36,
    BOOKS: 37, FIRE: 38, FLOWER: 39, PLANKS: 40, BATH: 41, WHEAT: 42, LEAD: 43, HEDGE: 44, SOFA: 45,
    ROOF: 46, RUBBLE: 47, DRYW: 48, LANE: 49, FLAGS: 50, BEAM: 51, DRESSER: 52, PORTAL: 53, CASE: 54,
    YEW: 55, WILLOW: 56, MILLST: 57, IVY: 58, HOOD: 59, RUG: 60, MEADOW: 61
  };

  const BI = {};
  function def(id, name, top, side, bot, glow, jitter, lit) {
    BI[id] = { id, name, top, side, bot, bottom: bot, glow: !!glow, jit: jitter || 0, jitter: jitter || 0, lit: !!lit };
  }
  def(B.GRASS, 'grass', T.grass, T.grassS, T.dirt, false, 0.07);
  def(B.MEADOW, 'meadow', T.meadow, T.grassS, T.dirt, false, 0.08);
  def(B.DIRT, 'earth', T.dirt, T.dirt, T.dirt, false, 0.05);
  def(B.ROCK, 'cliff', T.rock, T.rock, T.rock, false, 0.06);
  def(B.SAND, 'sand', T.sand, T.sand, T.sand, false, 0.05);
  def(B.PATH, 'cobbles', T.path, T.rock, T.rock, false, 0.04);
  def(B.GRAVEL, 'gravel', T.gravel, T.gravel, T.gravel, false, 0.06);
  def(B.PINE, 'pine', T.pine, T.pine, T.pine, false, 0.12);
  def(B.BEECH, 'foliage', T.beech, T.beech, T.beech, false, 0.12);
  def(B.BARK, 'trunk', T.trunkTop, T.bark, T.trunkTop, false, 0.06);
  def(B.BROOK, 'water', T.brook, T.brook, T.brook, false, 0.05);
  def(B.LIME, 'ashlar', T.ashlar, T.ashlar, T.ashlar, false, 0.03);
  def(B.LIMES, 'smooth stone', T.limeSmooth, T.limeSmooth, T.limeSmooth, false, 0.02);
  def(B.BRICK, 'red brick', T.brick, T.brick, T.brick, false, 0.04);
  def(B.SLATE, 'slate', T.slate, T.slate, T.beams, false, 0.03);
  def(B.MARBLE, 'marble', T.marble, T.marble, T.marble, false, 0.02);
  def(B.PLANKS, 'planks', T.planks, T.planks, T.planks, false, 0.04);
  def(B.FLAGS, 'plaza tile', T.flagstone, T.ashlar, T.ashlar, false, 0.025);
  def(B.HEDGE, 'hedge', T.hedge, T.hedge, T.hedge, false, 0.09);
  def(B.YEW, 'cypress', T.yew, T.yew, T.yew, false, 0.12);
  def(B.WILLOW, 'jungle palm', T.willow, T.willow, T.willow, false, 0.12);
  def(B.FLOWER, 'flowers', T.flower, T.flower, T.flower, false, 0.10);
  def(B.IRON, 'rail', T.iron, T.iron, T.iron, false, 0.03);
  def(B.LANE, 'asphalt', T.tarmac, T.rock, T.rock, false, 0.03);

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hash3(x, y, z) {
    let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(z | 0, 2147483647);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }
  function vnoise(x, z, s) {
    const xi = Math.floor(x), zi = Math.floor(z), fx = x - xi, fz = z - zi;
    const u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz);
    const a = hash3(xi, s, zi), b = hash3(xi + 1, s, zi), c = hash3(xi, s, zi + 1), d = hash3(xi + 1, s, zi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }

  /* ============================================================================
   * 16 ICONIC 1:1 DISNEYLAND + DISNEY RESORT LANDS & 12 RIDEABLE ATTRACTIONS
   * ============================================================================ */
  const LANDS = [
    {
      id: 'main_gate', num: 1, park: 'disneyland', zone: 'main_street', badge: '1:1 正门车站', color: '#f59e0b',
      name: '迎宾广场、米奇花坛 & 迪士尼铁路总站', en: 'Esplanade, Floral Mickey & Main Street Railroad Station',
      x: 272.5, z: 468, rideId: 'railroad_tour',
      host: '总站列车长查尔斯 · Grand Circle Conductor', robe: 0x1d4ed8, hair: 0x3f2a1d,
      quote: '欢迎光临 1:1 真实比例还原的迪士尼乐园！登上蒸汽火车环游全园四站与史前恐龙大峡谷，或穿过红砖迎宾门洞步入小镇广场！',
      highlights: ['【可乘坐设施 #1】迪士尼蒸汽火车环园游：停靠 4 大车站并穿越史前恐龙隧道', '1:1 真实米奇斜坡花坛与两侧「Here You Leave Today」铭牌门洞', '维多利亚红砖钟楼总站与检票迎宾罗盘广场'],
      tp: { mode: 'walk', p: [272.5, PARK_Y, 496], t: [272.5, PARK_Y + 9, 462] }
    },
    {
      id: 'town_square', num: 2, park: 'disneyland', zone: 'main_street', badge: '小镇广场', color: '#d97706',
      name: '美国小镇广场 · Town Square (市政厅 & 沃尔特公寓)', en: 'City Hall, Fire Engine Co. 101 (Walt\'s Lamp) & Opera House',
      x: 272.5, z: 428,
      host: '荣誉镇长梅森 · Town Square Mayor', robe: 0x991b1b, hair: 0xe5e7eb,
      quote: '这里是踏入迪士尼的第一站！西侧是市政厅与 101 号消防局——抬头看消防局二楼窗边，那盏永远点亮的台灯正是纪念华特·迪士尼先生！',
      highlights: ['1:1 市政厅（City Hall）穹顶钟楼、大歌剧院（Opera House）与音乐凉亭', '101 号消防局二楼窗内永恒点亮的「华特·迪士尼纪念台灯」彩蛋', '小镇广场降旗礼旗杆、双层复古巴士与有轨马车总站'],
      tp: { mode: 'walk', p: [272.5, PARK_Y, 444], t: [242, PARK_Y + 8, 424] }
    },
    {
      id: 'main_street', num: 3, park: 'disneyland', zone: 'main_street', badge: '美国小镇大街', color: '#f59e0b',
      name: '美国小镇大街 · Main Street, U.S.A. (全长 224m 轴线)', en: 'Emporium, Center St Flower Market, Penny Arcade & Jolly Holiday',
      x: 272.5, z: 356,
      host: '甜点师克拉拉 · Jolly Holiday Baker', robe: 0xbe185d, hair: 0x5c3a21,
      quote: '整条 1:1 维多利亚长街全长超过两百米！两侧无缝相连的百年百货 Emporium、中央十字花市、游戏拱廊、康乃馨咖啡馆与广场饭店都在等你探索！',
      highlights: ['1:1 无缝街墙：百年百货 Emporium、复古影院、Penny Arcade、Casey\'s 钢琴角', 'Center Street 中央十字鲜花集市、Jolly Holiday 烘焙坊与 Plaza Inn 维多利亚餐厅', '有轨马车、双层巴士、Dapper Dans 男声四重唱与强透视城堡中轴线'],
      tp: { mode: 'walk', p: [276.5, PARK_Y, 396], t: [272.5, PARK_Y + 14, 208] }
    },
    {
      id: 'castle', num: 4, park: 'disneyland', zone: 'castle', badge: '中央广场 & 城堡', color: '#ec4899',
      name: '伙伴铜像中央枢纽 & 童话城堡 · Central Hub & Castle', en: 'Partners Statue, 6-Spoke Hub, Wishing Well & 18-Spire Castle',
      x: 272.5, z: 222,
      host: '皇家传令官艾琳 · Royal Castle Herald', robe: 0x7c3aed, hair: 0xfde047,
      quote: '站在华特与米奇「伙伴铜像」身旁，六座辐射桥通往六大主题国度！东岸藏着白雪公主许愿井飞瀑，穿过吊桥即可步入城堡皇家马赛克长廊！',
      highlights: ['中央环形花园广场（6 条主题辐射桥）与青铜「Partners 伙伴雕像」', '18 座皇家钴蓝金顶塔楼、天鹅护城河吊桥与白雪公主许愿井瀑布', '可步入的皇家穹顶马赛克壁画长廊 + 按 N 一键开启夜空烟花秀'],
      tp: { mode: 'walk', p: [272.5, PARK_Y, 270], t: [272.5, PARK_Y + 18, 208] },
      tpInside: { mode: 'walk', p: [272.5, PARK_Y, 215], t: [272.5, PARK_Y + 4.5, 202] }
    },
    {
      id: 'fantasyland', num: 5, park: 'disneyland', zone: 'fantasyland', badge: '梦幻世界庭院', color: '#a855f7',
      name: '梦幻世界童话村 · Fantasyland Courtyard', en: 'Peter Pan Big Ben, Toad Hall, Alice, Carrousel & Monstro Whale',
      x: 272.5, z: 158, rideId: 'carousel',
      host: '魔法师梅林 · Fantasyland Keeper', robe: 0x6d28d9, hair: 0xe2e8f0,
      quote: '穿过城堡就到了中世纪童话庭院！伦敦大本钟是小飞侠天空之旅，都铎庄园是蟾蜍先生狂野飞车，木马前还插着石中剑，北边更有鲸鱼蒙斯特洛巨口运河！',
      highlights: ['【可乘坐设施 #2】亚瑟王皇家旋转木马 + 庭院中央可互动「石中剑」铁砧', '1:1 暗黑骑乘立面群：小飞侠大本钟、蟾蜍庄园、白雪公主木屋、匹诺曹村与爱丽丝巨叶藤轨', '小飞象喷泉、疯帽子茶杯与故事书运河「巨鲸蒙斯特洛张口奇观」'],
      tp: { mode: 'walk', p: [272.5, PARK_Y, 182], t: [272.5, PARK_Y + 6, 152] }
    },
    {
      id: 'matterhorn', num: 6, park: 'disneyland', zone: 'fantasyland', badge: '马特宏峰雪山', color: '#38bdf8',
      name: '马特宏峰雪橇过山车 · Matterhorn Bobsleds', en: '46m Swiss Alpine Peak, Ice Crystal Cavern & Abominable Snowman',
      x: 330, z: 176, rideId: 'matterhorn_bobsleds',
      host: '高山向导汉斯 · Alpine Bobsled Climber', robe: 0x0284c7, hair: 0xfef3c7,
      quote: '快系好安全带！登上马特宏峰高山雪橇，冲进幽蓝冰晶洞穴直面咆哮的雪怪哈罗德（Harold），再顺着阿尔卑斯飞瀑疾驰冲入山脚水潭！',
      highlights: ['【可乘坐设施 #3】马特宏峰雪山雪橇过山车：第一视角穿梭冰晶山洞与雪山悬崖', '幽蓝冰晶山洞内红眼咆哮的传奇雪怪「哈罗德（Abominable Snowman）」', '瑞士木屋车站、高山松林与倾泻入潜艇泻湖的冰川瀑布'],
      tp: { mode: 'walk', p: [312, PARK_Y, 196], t: [330, PARK_Y + 18, 176] }
    },
    {
      id: 'small_world', num: 7, park: 'disneyland', zone: 'fantasyland', badge: '小小世界', color: '#0ea5e9',
      name: '小小世界室内游船 · "it\'s a small world"', en: 'Mary Blair Clock Facade, Topiary Mall & 6-Hall Indoor Boat Ride',
      x: 306, z: 96, rideId: 'small_world_boat',
      host: '小小世界船长苏菲 · Small World Skipper', robe: 0x0369a1, hair: 0xfde68a,
      quote: '沿着绿雕动物大道望去，44 米纯白鎏金微笑太阳钟正摇摆报时！登船驶入室内运河，依次巡游欧、亚、美（林肯演讲）、非与纯白大合唱厅！',
      highlights: ['【可乘坐设施 #4】小小世界室内游船：全封闭 6 大世界展厅与欢舞人偶', '玛丽·布莱尔几何鎏金立面、摇摆钟摆与火车高架桥前庭', '美洲馆·林肯总统仿真演讲舞台（Great Moments with Mr. Lincoln）'],
      tp: { mode: 'walk', p: [306, PARK_Y, 114], t: [306, PARK_Y + 11, 84] }
    },
    {
      id: 'toontown', num: 8, park: 'disneyland', zone: 'toontown', badge: '米奇卡通城', color: '#f43f5e',
      name: '米奇卡通城 · Mickey\'s Toontown', en: 'Mickey & Minnie\'s Houses, El Capitoon Runaway Railway & Donald\'s Boat',
      x: 256, z: 62,
      host: '卡通城向导高飞 · Toontown Pal', robe: 0xf97316, hair: 0x18181b,
      quote: '穿过彩色铁路桥洞，欢迎来到软萌圆润的米奇卡通城！左边是El Capitoon大剧院与米奇、米妮的家，右边停着唐老鸭的「黛丝号」汽船与奇奇蒂蒂橡果过山车！',
      highlights: ['圆润翠绿「TOONTOWN」好莱坞式卡通山丘背景与喷泉市政厅', '米奇黄色歪烟囱小屋、米妮粉色爱心屋与唐老鸭「Miss Daisy」汽船池塘', 'El Capitoon 大剧院（米奇米妮飞速铁路）与奇奇蒂蒂橡果过山车'],
      tp: { mode: 'walk', p: [258, PARK_Y, 82], t: [252, PARK_Y + 6, 46] }
    },
    {
      id: 'frontierland', num: 9, park: 'disneyland', zone: 'frontierland', badge: '边域世界 & 美国河', color: '#ea580c',
      name: '边域世界、巨雷山 & 汤姆索亚岛 · Frontierland', en: 'Rideable Big Thunder Mountain, Rivers of America, Tom Sawyer Island & Columbia',
      x: 184, z: 204, rideId: 'big_thunder',
      host: '西部警长怀特 · Frontier Marshal', robe: 0x9a3412, hair: 0xd6d3d1,
      quote: '穿过原木要塞大门就是狂野西部！登上巨雷山失控矿车飞跃恐龙骨架与红岩峡谷，或走上吊桥亲自登临美国河心的「汤姆索亚海盗岛」！',
      highlights: ['【可乘坐设施 #5】巨雷山矿车过山车：高速盘旋红岩峡谷、恐龙化石与炸药矿洞', '1:1 环绕「汤姆索亚岛」的辽阔美国河：可步行穿过木吊桥探索水车磨坊、骷髅岩与木堡', '三层「马克吐温号」明轮船与三桅高帆船「哥伦比亚号」双船同航 + 金马蹄酒馆木栈街'],
      tp: { mode: 'walk', p: [196, PARK_Y, 224], t: [164, PARK_Y + 10, 186] }
    },
    {
      id: 'new_orleans', num: 10, park: 'disneyland', zone: 'new_orleans', badge: '新奥尔良 & 海盗', color: '#8b5cf6',
      name: '新奥尔良广场、加勒比海盗 & 蒂安娜沼泽山', en: 'Rideable Pirates of the Caribbean, French Quarter, Haunted Mansion & Bayou',
      x: 138, z: 256, rideId: 'pirates_ride',
      host: '海盗大副吉布斯 · New Orleans Quartermaster', robe: 0x4c1d95, hair: 0x44403c,
      quote: 'Yo Ho！漫步法式铁艺蕾丝阳台街巷，登上「加勒比海盗」游船潜入蓝湾萤火虫夜空，穿越海盗战舰与西班牙要塞的漫天炮火，直抵杰克船长的黄金宝藏山！',
      highlights: ['【可乘坐设施 #6】加勒比海盗室内游船：蓝湾萤火虫餐厅、骷髅湾、大帆船实景炮战与宝藏厅', '19 世纪新奥尔良法式铁艺阳台街区、奥尔良咖啡馆、新奥尔良火车站与古典「幽灵公馆」', '河湾西岸 32 米「蒂安娜沼泽冒险山（原飞溅山）」皇冠水塔与 50 英尺激流飞瀑'],
      tp: { mode: 'walk', p: [152, PARK_Y, 250], t: [144, PARK_Y + 7, 272] }
    },
    {
      id: 'adventureland', num: 11, park: 'disneyland', zone: 'adventureland', badge: '探险世界', color: '#10b981',
      name: '探险世界：夺宝奇兵、提基神殿 & 丛林探险船', en: 'Indiana Jones Temple, Enchanted Tiki Room, Treehouse & Jungle Cruise',
      x: 176, z: 288, rideId: 'river_boat',
      host: '丛林船长杰克 · Jungle Cruise Skipper', robe: 0x92400e, hair: 0x27272a,
      quote: '提基战鼓已经敲响！入口是波利尼西亚「魅惑提基屋」，眼前矗立着「印第安纳琼斯：魔眼禁庙」巨蛇石殿，南侧码头丛林探险船正准备驶向大象泳池与瀑布背面！',
      highlights: ['【可乘坐设施 #7】丛林河流探险船：穿越施韦泽瀑布背面、河马池、大象戏水池与受困探险队', '宏伟沧桑的「印第安纳琼斯：魔眼禁庙（Temple of the Forbidden Eye）」与探险卡车', '华特迪士尼首创「魅惑提基屋（Enchanted Tiki Room）」茅草神殿、异域巴扎集市与巨榕树屋'],
      tp: { mode: 'walk', p: [176, PARK_Y, 296], t: [150, PARK_Y + 7.5, 294] }
    },
    {
      id: 'star_wars', num: 12, park: 'disneyland', zone: 'star_wars', badge: '星球大战：巴图', color: '#f97316',
      name: '星球大战：银河边缘 · Star Wars: Galaxy\'s Edge', en: 'Batuu Black Spire Outpost (NW Sector), Millennium Falcon & AT-AT',
      x: 116, z: 96, rideId: 'falcon_flight',
      host: '抵抗组织领航员蕾伊 · Batuu Resistance Guide', robe: 0xd6d3d1, hair: 0x451a03,
      quote: '与真实加州迪士尼完全一致，穿过西北岩洞隧道即抵巴图星「黑尖塔前哨站」！登上千年隼号驾驶舱发射激光炮、拉动超空间拉杆跃迁科雷利亚星！',
      highlights: ['【可驾驶设施 #8】千年隼号：走私者逃亡（WASD 驾驶 + 空格四联激光炮 + H 键超空间跃迁！）', '18 米帝国 AT-AT 装甲步行机、第一秩序 TIE 战机、凯洛·伦与抵抗组织 X 翼战机', '奥加酒馆蓝奶吧、萨维光剑工坊、动态 R2-D2 / BB-8 与黑尖塔风化石林'],
      tp: { mode: 'walk', p: [116, PARK_Y, 114], t: [116, PARK_Y + 7, 86] }
    },
    {
      id: 'tomorrowland', num: 13, park: 'disneyland', zone: 'tomorrowland', badge: '明日世界 & 太空山', color: '#0ea5e9',
      name: '明日世界、室内太空山 & 驰车天地 · Tomorrowland', en: 'Rideable Indoor Space Mountain, Astro Orbiter, Buzz, Star Tours & Autopia',
      x: 382, z: 262, rideId: 'space_mountain',
      host: '星际指挥官诺娃 · Tomorrowland Spaceport', robe: 0x0284c7, hair: 0x38bdf8,
      quote: '欢迎踏入明日世界！入口矗立着金色星际轨道飞行器，两侧是巴斯光年与星际旅行，尽头 32 道白肋穹顶内正是全新可乘坐的「太空山全黑深空过山车」！',
      highlights: ['【可乘坐设施 #9 & #10】太空山室内深空星云过山车（红色能量隧道弹射！）+ 星际轨道飞行器', '巴斯光年星际营救、Star Tours 星际旅行、高架 PeopleMover 与迪士尼单轨列车', 'Autopia 未来驰车天地高架公路跑车与海底总动员黄色潜艇珊瑚礁泻湖'],
      tp: { mode: 'walk', p: [340, PARK_Y, 258], t: [418, PARK_Y + 12, 274] }
    },
    {
      id: 'epcot', num: 14, park: 'resort', zone: 'orlando', badge: '奥兰多 · EPCOT 未来世界', color: '#06b6d4',
      name: 'EPCOT · 地球号太空船 & 世界探索区', en: 'Spaceship Earth, World Celebration, Test Track, Mission: SPACE & Cosmic Rewind',
      x: 606, z: 262, rideId: 'test_track',
      host: '未来领航员艾娃 · EPCOT Ambassador', robe: 0x0891b2, hair: 0xe2e8f0,
      quote: '欢迎来到 EPCOT！眼前这颗由 11,324 块三角铝板拼成的银色巨球就是「地球号太空船」，三对斜撑把它托在半空。东侧是测试赛道与火星任务，西侧是海洋馆、陆地馆与想象力玻璃金字塔，往北穿过庆典花园就是世界橱窗泻湖。',
      highlights: ['【可乘坐设施 #11】测试赛道（Test Track）：SIM 概念车冲出展馆，驶上高架外环高速弯道', '【可乘坐设施 #12】迪士尼天际缆车（Skyliner）：EPCOT ↔ 好莱坞影城 空中往返', '地球号太空船、银河护卫队宇宙倒带、火星任务、海洋馆 / 陆地馆 / 想象力馆'],
      tp: { mode: 'walk', p: [620, PARK_Y, 288], t: [620, PARK_Y + 22, 228] }
    },
    {
      id: 'epcot_showcase', num: 15, park: 'resort', zone: 'orlando', badge: '奥兰多 · EPCOT 世界橱窗', color: '#0ea5e9',
      name: 'EPCOT · 世界橱窗环湖十一国', en: 'World Showcase Lagoon — Canada, UK, France, Morocco, Japan, America, Italy, Germany, China, Norway, Mexico',
      x: 612, z: 164, rideId: 'friendship_boat',
      host: '世界橱窗文化大使 · World Showcase Host', robe: 0x1d4ed8, hair: 0x5c3a21,
      quote: '环绕泻湖一圈就是一次环球旅行：加拿大城堡酒店、英国都铎酒馆、巴黎埃菲尔铁塔、摩洛哥宣礼塔、日本五重塔与水中鸟居、美国独立厅、威尼斯钟楼、德国钟楼广场、北京天坛祈年殿、挪威木板教堂，还有墨西哥玛雅金字塔。登上友谊号游船可以一次看全！',
      highlights: ['【可乘坐设施 #13】友谊号游船（Friendship Boat）：环湖一周巡游十一国展馆', '1:1 布局的环湖步道与十一座国家馆地标建筑', '泻湖中央的烟花驳船与夜间灯光'],
      tp: { mode: 'walk', p: [620, PARK_Y, 170], t: [620, PARK_Y + 8, 76] }
    },
    {
      id: 'hollywood', num: 16, park: 'resort', zone: 'orlando', badge: '奥兰多 · 好莱坞影城', color: '#e11d48',
      name: '好莱坞影城 · 好莱坞大道 & 日落大道', en: 'Hollywood Blvd, Chinese Theatre, Sunset Blvd, Tower of Terror & Rock ’n’ Roller Coaster',
      x: 608, z: 532, rideId: 'tower_of_terror',
      host: '好莱坞导演维克多 · Studio Director', robe: 0xbe123c, hair: 0x27272a,
      quote: '穿过薄荷绿的泛太平洋礼堂大门，就回到了 1930 年代的好莱坞！大道尽头是中国大剧院，向东拐进日落大道，尽头那栋被闪电劈中的粉色高塔酒店就是「暮光之城恐怖魔塔」——电梯会把你拉上 13 层再整厢抛下去。',
      highlights: ['【可乘坐设施 #14】暮光之城恐怖魔塔（Tower of Terror）：升至 13 层开门俯瞰影城后多段自由落体', '装饰艺术风好莱坞大道、十字路口塔、中国大剧院（米奇米妮失控火车）', '日落大道、摇滚过山车巨型电吉他与耳朵水塔（Earffel Tower）'],
      tp: { mode: 'walk', p: [616, PARK_Y, 530], t: [616, PARK_Y + 10, 606] }
    },
    {
      id: 'toy_story', num: 17, park: 'resort', zone: 'orlando', badge: '奥兰多 · 玩具总动员', color: '#f59e0b',
      name: '回声湖 & 玩具总动员乐园', en: 'Echo Lake (Gertie), Toy Story Land — Slinky Dog Dash, Alien Swirling Saucers',
      x: 580, z: 634, rideId: 'slinky_dog',
      host: '安迪的玩具警长 · Andy’s Backyard Sheriff', robe: 0xb45309, hair: 0x7c2d12,
      quote: '你已经缩小成玩具那么大啦！这里是安迪家的后院：他用过山车积木搭了一条「弹簧狗冲刺」轨道，旁边是外星人旋转飞碟、叠叠乐积木塔、小孩玩具棒和彩色圣诞灯串。回声湖边还站着冰淇淋恐龙葛蒂呢。',
      highlights: ['【可乘坐设施 #15】弹簧狗冲刺（Slinky Dog Dash）：安迪后院里的家庭过山车', '外星人旋转飞碟、叠叠乐塔、巨型 Tinkertoy 与字母积木', '回声湖恐龙葛蒂（Gertie）、码头小汽船餐厅与印第安纳琼斯特技剧场'],
      tp: { mode: 'walk', p: [578, PARK_Y, 636], t: [574, PARK_Y + 6, 674] }
    },
    {
      id: 'animal_kingdom', num: 18, park: 'resort', zone: 'orlando', badge: '奥兰多 · 动物王国', color: '#22c55e',
      name: '动物王国 · 生命之树 & 非洲哈兰贝', en: 'The Oasis, Discovery Island Tree of Life, Harambe Village & Kilimanjaro Safaris',
      x: 264, z: 606, rideId: 'safari_ride',
      host: '哈兰贝保护区向导 · Safari Ranger', robe: 0x15803d, hair: 0x18181b,
      quote: 'Jambo！穿过绿洲就能看到探索河环绕的发现岛，岛中央是 44 米高、树干刻满动物浮雕的「生命之树」。向南走到非洲哈兰贝村，登上敞篷卡车就能开进稀树草原，看长颈鹿、大象、斑马、犀牛和岩石上的狮子！',
      highlights: ['【可乘坐设施 #16】乞力马扎罗野生动物园（Kilimanjaro Safaris）：敞篷卡车穿越稀树草原', '生命之树：盘根、动物浮雕树干与巨型树冠，四座木桥跨越探索河', '哈兰贝村茅草市集、猴面包树、金合欢与火烈鸟水塘'],
      tp: { mode: 'walk', p: [272, PARK_Y, 602], t: [272, PARK_Y + 22, 640] }
    },
    {
      id: 'pandora_everest', num: 19, park: 'resort', zone: 'orlando', badge: '奥兰多 · 潘多拉 & 亚洲', color: '#14b8a6',
      name: '潘多拉阿凡达世界 & 珠峰探险', en: 'Pandora — Valley of Mo’ara floating mountains · Asia — Expedition Everest',
      x: 307, z: 664, rideId: 'everest_ride',
      host: '潘多拉探险家内蒂莉 · Pandora Naturalist', robe: 0x0f766e, hair: 0x18181b,
      quote: '发现岛西边的木桥通向潘多拉：莫阿拉山谷里的哈利路亚群山真的悬浮在空中，藤蔓和瀑布从岩底垂下，夜里满地都是发光植物。东边则是喜马拉雅山脚的塞尔卡宗村——登上采茶小火车冲上禁忌之山，小心山洞里的雪怪！',
      highlights: ['【可乘坐设施 #17】珠峰探险（Expedition Everest）：栈桥爬升 26 米后绕峰俯冲，途经雪怪洞', '潘多拉悬浮群山、垂藤瀑布、发光植物与盘旋的斑溪兽（Banshee）', '塞尔卡宗藏式村落、经幡、白塔与卡斯帕万河'],
      tp: { mode: 'walk', p: [307, PARK_Y, 692], t: [344, PARK_Y + 26, 650] }
    },
    {
      id: 'paris_main', num: 20, park: 'paris', zone: 'paris', badge: '巴黎 · 美国小镇大街', color: '#f9a8d4',
      name: '巴黎迪士尼乐园酒店 & 美国小镇大街', en: 'Disneyland Hotel, Main Street Station, Liberty & Discovery Arcades',
      x: 384, z: 838, rideId: 'paris_railroad',
      host: '巴黎站长皮埃尔 · Chef de Gare', robe: 0x7c2d12, hair: 0x3f2a1a,
      quote: '欢迎来到巴黎迪士尼乐园！您刚刚穿过粉红色维多利亚式「迪士尼乐园酒店」的拱门——全球唯一横跨在乐园大门之上的酒店。前方小镇广场的音乐凉亭后面，就是 1900 年代的美国小镇大街，两侧还藏着煤气灯长廊「自由拱廊」与「发现拱廊」。',
      highlights: ['【可乘坐设施 #13】巴黎迪士尼铁路（Disneyland Railroad）蒸汽火车环园四站', '粉墙红瓦的迪士尼乐园酒店、梦幻花园与米奇花坛大钟', '小镇广场音乐凉亭、Main Street 维多利亚商铺与两条煤气灯拱廊'],
      tp: { mode: 'walk', p: [384, PARK_Y, 762], t: [384, PARK_Y + 14, 792] }
    },
    {
      id: 'paris_castle', num: 21, park: 'paris', zone: 'paris', badge: '巴黎 · 幻想世界', color: '#f472b6',
      name: '睡美人城堡 & 幻想世界 · Fantasyland', en: 'Le Château de la Belle au Bois Dormant, Carrousel de Lancelot, Alice’s Curious Labyrinth',
      x: 384, z: 968,
      host: '奥罗拉公主的侍女 · Dame de Compagnie', robe: 0xdb2777, hair: 0xfbbf24,
      quote: '这是全世界最梦幻的迪士尼城堡——「睡美人城堡」。它建在岩石山丘之上，粉色高塔配蓝色石板尖顶，山坡上是动画里方方正正的修剪树，右侧有瀑布，地下还沉睡着一条巨龙。穿过城堡就是幻想世界：兰斯洛特旋转木马、小飞象、疯帽子茶杯、爱丽丝迷宫与小小世界。',
      highlights: ['43 米粉色睡美人城堡：16 座蓝顶塔楼、金色尖顶、螺旋楼梯塔与彩绘玻璃长廊', '城堡山丘的方形修剪树、瀑布与地下巨龙洞穴（La Tanière du Dragon）', '兰斯洛特旋转木马、小飞象、疯帽子茶杯、爱丽丝奇幻迷宫与小小世界钟楼立面'],
      tp: { mode: 'walk', p: [384, PARK_Y, 950], t: [384, PARK_Y + 24, 1002] }
    },
    {
      id: 'paris_frontier', num: 22, park: 'paris', zone: 'paris', badge: '巴黎 · 边域世界', color: '#ea580c',
      name: '边域世界 · 巨雷山 & 幽灵庄园', en: 'Frontierland — Big Thunder Mountain island, Phantom Manor, Molly Brown Riverboat',
      x: 446, z: 938, rideId: 'paris_big_thunder',
      host: '雷霆台地警长 · Thunder Mesa Sheriff', robe: 0x92400e, hair: 0x44403c,
      quote: '穿过科姆斯托克木堡就到了淘金小镇「雷霆台地」。巴黎的巨雷山与众不同——整座红岩山矗立在远西河中央的小岛上，矿车要先钻进河底隧道才能上岛！山丘上那栋阴森的维多利亚大宅是幽灵庄园，河面上航行的是莫莉·布朗号明轮船。',
      highlights: ['【可乘坐设施 #14】巨雷山（Big Thunder Mountain）：河心岛红岩矿山失控矿车', '山丘上的幽灵庄园（Phantom Manor）与靴山墓园', '科姆斯托克堡、幸运金块沙龙与莫莉·布朗号明轮船'],
      tp: { mode: 'walk', p: [440, PARK_Y, 944], t: [512, PARK_Y + 16, 928] }
    },
    {
      id: 'paris_adventure', num: 23, park: 'paris', zone: 'paris', badge: '巴黎 · 探险世界', color: '#16a34a',
      name: '探险世界 · 骷髅岩 & 印第安纳琼斯', en: 'Adventureland — Agrabah Bazaar, Skull Rock, Pirate Galleon, Temple du Péril',
      x: 452, z: 1012, rideId: 'paris_indiana',
      host: '探险岛向导萨米拉 · Guide de l’Île', robe: 0x166534, hair: 0x1c1917,
      quote: '探险世界的大门是一座一千零一夜风格的阿格拉巴集市。往里走是探险岛：骷髅岩、虎克船长的海盗船和鲁滨逊树屋；最深处的丛林里藏着「危险神殿」——迪士尼第一座带 360° 回环的过山车！',
      highlights: ['【可乘坐设施 #15】印第安纳琼斯与危险神殿：带 360° 垂直回环的矿车过山车', '探险岛骷髅岩、虎克船长海盗船与鲁滨逊树屋', '阿格拉巴集市洋葱圆顶与加勒比海盗西班牙要塞'],
      tp: { mode: 'walk', p: [456, PARK_Y, 1004], t: [508, PARK_Y + 10, 1042] }
    },
    {
      id: 'paris_discovery', num: 24, park: 'paris', zone: 'paris', badge: '巴黎 · 发现世界', color: '#b45309',
      name: '发现世界 · 太空山 & 鹦鹉螺号', en: 'Discoveryland — Space Mountain, Orbitron, Nautilus, Hyperion Airship',
      x: 340, z: 938, rideId: 'paris_space_mountain',
      host: '凡尔纳学会教授 · Professeur Verne', robe: 0x78350f, hair: 0xd6d3d1,
      quote: '发现世界不是科幻未来，而是儒勒·凡尔纳笔下的黄铜与铆钉之梦。那座青铜色的巨山就是太空山，侧面斜架着「哥伦比亚德」巨炮，会把列车直接射向月球！旁边的泻湖里停泊着尼摩船长的鹦鹉螺号，远处剧院上方悬着亥伯龙号飞艇。',
      highlights: ['【可乘坐设施 #16】太空山：从哥伦比亚德巨炮弹射升空的室内过山车', '达芬奇风格行星仪「轨道飞行器 Orbitron」与鹦鹉螺号潜艇泻湖', 'Videopolis 剧院亥伯龙号飞艇与星际旅行 X 翼战机'],
      tp: { mode: 'walk', p: [346, PARK_Y, 944], t: [286, PARK_Y + 18, 944] }
    }
  ];

  function create() {
    const blocks = new Uint8Array(W * D * H);
    const cols = new Uint8Array(W * D * H);
    const hm = new Uint8Array(W * D);
    const topH = new Uint8Array(W * D);
    const topC = new Uint8Array(W * D);
    const occ = new Uint8Array(W * D);

    const palette = [];
    const C = {};
    function addCol(name, hex) {
      const r = ((hex >> 16) & 255) / 255, g = ((hex >> 8) & 255) / 255, b = (hex & 255) / 255;
      C[name] = palette.length;
      palette.push([r, g, b]);
    }
    addCol('grass', 0x56a342); addCol('grassL', 0x6ec454); addCol('toonGreen', 0x74d64c);
    addCol('jungle', 0x2c7a39); addCol('bayou', 0x3b7a47);
    addCol('dirt', 0x7a5b3e); addCol('rock', 0x7c828a); addCol('sand', 0xe5d3a3);
    addCol('brickMain', 0xb25442); addCol('plazaCream', 0xd8cdb8); addCol('plazaPink', 0xe4c7cf);
    addCol('plazaBlue', 0xb8d4e8); addCol('fantasyCobble', 0xcdc0da); addCol('advDirt', 0x9c7f5a);
    addCol('woodWalk', 0x8b5e38); addCol('nolaStone', 0xc6baa6); addCol('toonRoad', 0xf3d4dc);
    addCol('tomSilver', 0xbccad8); addCol('tomCyan', 0x38bdf8); addCol('railGravel', 0x847f74);
    addCol('asphalt', 0x4b5563); addCol('waterDeep', 0x1a6a8a); addCol('stoneL', 0xe4dccb);
    addCol('redRock', 0xb9583a); addCol('prairie', 0x8fa24e); addCol('pRose', 0xe7b4bd); addCol('pCream', 0xf0e4cf);
    addCol('pBrick', 0xa5503f); addCol('pOchre', 0xc9935f); addCol('pSand', 0xdcbb82); addCol('pBronze', 0xb39160);
    addCol('pTeal', 0x4d9a94); addCol('pSlate', 0x8d97a6); addCol('pLilac', 0xd4c4e2);
    addCol('savanna', 0xb7a45a); addCol('pandora', 0x2f6f5e); addCol('decoMint', 0xbfe3d6); addCol('toyGreen', 0x7cc95a);

    const inb = (x, y, z) => x >= 0 && x < W && z >= 0 && z < D && y >= 0 && y < H;
    const zi = (x, z) => x + z * W;
    const idx = (x, y, z) => x + W * (z + D * y);
    const set = (x, y, z, b, c) => { if (inb(x, y, z)) { const k = idx(x, y, z); blocks[k] = b; cols[k] = c || 0; } };

    /* ================= 1. 768x768 1:1 DISNEYLAND + RESORT ISLAND BASE TERRAIN ================= */
    let minSolidY = 31, maxSolidY = PARK_Y;
    for (let z = 0; z < D; z++) {
      for (let x = 0; x < W; x++) {
        const dx = Math.max(0, Math.abs(x - 384) - 292) / 68;
        const dz = Math.max(0, Math.abs(z - 380) - 294) / 68;
        const pdx = Math.max(0, Math.abs(x - PARIS.x) - 200) / 68;
        const pdz = Math.max(0, Math.abs(z - 925) - 150) / 68;
        const r = Math.min(Math.hypot(dx, dz), Math.hypot(pdx, pdz));
        const inParis = z >= 738;
        const edge = 0.96 + (vnoise(x * 0.022, z * 0.022, 7) - 0.5) * 0.08;
        if (r > edge) {
          const sy = Math.max(32, Math.floor(35 - (r - edge) * 18));
          set(x, sy - 1, z, B.SAND, C.sand);
          set(x, sy, z, B.SAND, C.sand);
          hm[zi(x, z)] = sy;
          continue;
        }
        let gy = PARK_Y;
        if (r > 0.82) {
          const t = (r - 0.82) / Math.max(0.01, edge - 0.82);
          gy = Math.floor(PARK_Y - t * t * 5.5);
        }

        // Adventureland Jungle Waterfall Cliff (x=136..162, z=308..332)
        const wfDist = Math.hypot((x - 146) / 13, (z - 320) / 12);
        if (wfDist < 1.0) {
          gy = Math.max(gy, Math.floor(PARK_Y + (1 - wfDist) * 11));
        }

        // Paris: castle rock hill, Phantom Manor hill and the Big Thunder Mountain island mound.
        let parisRock = false;
        if (inParis && gy >= PARK_Y) {
          const ch = Math.hypot((x - PARIS.x) / 27, (z - PARIS.zCastle) / 23);
          if (ch < 1) gy = PARK_Y + Math.min(4, Math.round((1 - ch) * 9));
          const mh = Math.hypot((x - PARIS.manor.x) / 22, (z - PARIS.manor.z) / 19);
          if (mh < 1) gy = PARK_Y + Math.min(5, Math.round((1 - mh) * 10));
          const bt = Math.hypot((x - PARIS.lake.x) / PARIS.lake.ix, (z - PARIS.lake.z) / PARIS.lake.iz);
          if (bt < 1) { gy = PARK_Y + Math.min(3, Math.round((1 - bt) * 8)); parisRock = true; }
        }

        const isToon = z <= 88 && x >= 214 && x <= 298;
        const isAdv = (x >= 126 && x <= 226 && z >= 274 && z <= 372) || (z > 550 && z < 738 && x < 420) || (inParis && x > 440 && z > 985);
        const isBayou = x < 126 && z >= 156 && z <= 250;
        const isFan = x >= 216 && x <= 346 && z >= 90 && z <= 198;

        const isFrontier = inParis && x > 430 && z <= 985;
        const topBlock = gy <= WATER_Y + 1 ? B.SAND : parisRock ? B.PATH : (wfDist < 0.88 ? B.ROCK : (isToon ? B.MEADOW : B.GRASS));
        const topCol = gy <= WATER_Y + 1 ? C.sand : parisRock ? C.redRock : (wfDist < 0.88 ? C.rock : isToon ? C.toonGreen : isAdv ? C.jungle : isBayou ? C.bayou : isFrontier ? C.prairie : (isFan || inParis) ? C.grassL : C.grass);

        const yStart = Math.max(32, gy - 5);
        for (let y = yStart; y < gy - 1; y++) set(x, y, z, B.DIRT, parisRock ? C.redRock : C.dirt);
        set(x, gy - 1, z, topBlock, topCol);
        hm[zi(x, z)] = gy;
        if (inParis && gy >= PARK_Y) occ[zi(x, z)] = 3;
        if (gy > maxSolidY) maxSolidY = gy;
      }
    }

    /* ================= 2. 1:1 DISNEYLAND WATERWAYS, MOATS, RIVERS OF AMERICA & LAGOONS ================= */
    const carveWater = (x, z) => {
      if (!inb(x, PARK_Y, z)) return;
      for (let y = 34; y <= PARK_Y + 3; y++) set(x, y, z, B.AIR, 0);
      set(x, 33, z, B.SAND, C.waterDeep);
      hm[zi(x, z)] = 34;
      occ[zi(x, z)] = 2;
    };

    // 2A. Sleeping Beauty / Cinderella Castle Swan Moat & Hub Waterway Ring (around x=272.5, z=208)
    for (let z = 176; z <= 246; z++) {
      for (let x = 236; x <= 309; x++) {
        const d = Math.hypot((x - 272.5) / 31, (z - 208) / 29);
        const onMainDrawbridge = Math.abs(x - 272.5) <= 4.5 && (z > 218 || z < 196);
        const onSideSpoke = Math.abs(z - 226) <= 3.5 && (x < 248 || x > 297);
        if (d >= 0.66 && d <= 0.96 && !onMainDrawbridge && !onSideSpoke) carveWater(x, z);
      }
    }

    // 2B. TRUE-SCALE RIVERS OF AMERICA (x=88..180, z=138..244 — 92m x 106m River Loop around Walkable Tom Sawyer Island!)
    for (let z = 136; z <= 246; z++) {
      for (let x = 86; x <= 182; x++) {
        const outer = Math.hypot((x - 134) / 45, (z - 191) / 52);
        const island = Math.hypot((x - 134) / 21, (z - 191) / 28);
        // Walkable Timber Suspension Footbridge from Frontierland Shore (x=154..180, z=202..206) onto Tom Sawyer Island!
        const onIslandBridge = z >= 202 && z <= 206 && x >= 152 && x <= 182;
        if (outer <= 1.0 && island >= 1.0 && !onIslandBridge) carveWater(x, z);
      }
    }

    // 2C. Tiana's Bayou Adventure / Splash Mountain Flume Splashdown Lagoon (x=54..88, z=188..214)
    for (let z = 188; z <= 214; z++) for (let x = 54; x <= 88; x++) {
      if (Math.hypot((x - 71) / 16, (z - 201) / 12) <= 1.0) carveWater(x, z);
    }

    // 2D. Pirates of the Caribbean — Blue Bayou & Indoor Pirate Battle Lagoon (x=118..172, z=266..328)
    for (let z = 266; z <= 328; z++) for (let x = 118; x <= 172; x++) {
      const isEntryCanal = z >= 266 && z <= 286 && Math.abs(x - 145) <= 4.5;
      const isCavernSea = z >= 285 && z <= 327 && x >= 120 && x <= 170;
      if (isEntryCanal || isCavernSea) carveWater(x, z);
    }

    // 2E. Adventureland Expanded Jungle Cruise River Loop (centered at x=166, z=332, rx=30, rz=25)
    for (let z = 302; z <= 362; z++) for (let x = 132; x <= 200; x++) {
      const e = Math.hypot((x - 166) / 30, (z - 332) / 24);
      const onDock = x >= 188 && Math.abs(z - 322) <= 4.5;
      if (e >= 0.68 && e <= 1.05 && !onDock) carveWater(x, z);
    }

    // 2F. Storybook Land Canal (Monstro the Whale Lagoon: x=232..264, z=102..118) & Donald's Pond in Toontown (x=264..280, z=42..56)
    for (let z = 102; z <= 118; z++) for (let x = 232; x <= 264; x++) {
      if (Math.hypot((x - 248) / 15, (z - 110) / 7.2) <= 1.0) carveWater(x, z);
    }
    for (let z = 42; z <= 56; z++) for (let x = 264; x <= 280; x++) {
      if (Math.hypot((x - 272) / 7.5, (z - 49) / 6.2) <= 1.0) carveWater(x, z);
    }

    // 2G. Finding Nemo Submarine Voyage Coral Lagoon (Tomorrowland North: x=360..404, z=186..218)
    for (let z = 186; z <= 218; z++) for (let x = 360; x <= 404; x++) {
      if (Math.hypot((x - 382) / 21, (z - 202) / 15) <= 1.0) carveWater(x, z);
    }

    // 2H. "it's a small world" Outdoor Reflection Canal + Full 6-Room Indoor Dark-Ride Canal (x=285..327, z=46..100)
    for (let z = 46; z <= 100; z++) for (let x = 285; x <= 327; x++) {
      const isFrontEntry = z >= 82 && Math.abs(x - 306) <= 4.5;
      const isOuterCanal = z >= 94 && z <= 100 && Math.abs(x - 306) > 4.5;
      const isIndoorWater = z >= 48 && z <= 83 && x >= 286 && x <= 326;
      if (isFrontEntry || isOuterCanal || isIndoorWater) carveWater(x, z);
    }

    /* ================= 3. 1:1 DISNEYLAND STREETS, TOWN SQUARE, SPOKE BRIDGES & PROMENADES ================= */
    const pave = (x, z, b, c) => {
      if (!inb(x, PARK_Y, z) || occ[zi(x, z)] === 2) return;
      set(x, PARK_Y - 1, z, b, c);
      for (let y = PARK_Y; y <= PARK_Y + 2; y++) set(x, y, z, B.AIR, 0);
      hm[zi(x, z)] = PARK_Y;
      occ[zi(x, z)] = 1;
    };

    // 3A. Esplanade & Main Entrance Turnstile Plaza (x=232..313, z=462..508)
    for (let z = 462; z <= 508; z++) for (let x = 232; x <= 313; x++) {
      const compass = Math.hypot(x - 272.5, z - 494);
      const col = compass < 14 ? (((x + z) % 2 === 0) ? C.brickMain : C.plazaCream) : (((x + z) % 2 === 0) ? C.plazaCream : C.plazaPink);
      pave(x, z, B.FLAGS, col);
    }

    // 3B. Town Square Civic Loop & Central Park Island (x=238..307, z=406..462)
    for (let z = 406; z <= 462; z++) for (let x = 238; x <= 307; x++) {
      const inParkLawn = Math.hypot((x - 272.5) / 11.5, (z - 432) / 14.5) < 1.0 && Math.abs(x - 272.5) > 2.2 && Math.abs(z - 432) > 2.2;
      if (inParkLawn) continue; // Keep authentic green Town Square lawn around the flagpole & gazebo!
      const isLoopRoad = Math.hypot((x - 272.5) / 18.5, (z - 432) / 21.5) <= 1.0 && Math.hypot((x - 272.5) / 12.0, (z - 432) / 15.0) >= 1.0;
      pave(x, z, isLoopRoad ? B.PATH : B.BRICK, isLoopRoad ? C.plazaCream : C.brickMain);
    }

    // 3C. Full-Length 1:1 Main Street, U.S.A. Boulevard (z=284..408, x=256..289) + Center Street Cross-Alley (z=345..355, x=234..311)!
    for (let z = 284; z <= 408; z++) for (let x = 256; x <= 289; x++) {
      const road = Math.abs(x - 272.5) <= 7.5;
      pave(x, z, road ? B.PATH : B.BRICK, road ? C.plazaCream : C.brickMain);
    }
    for (let z = 345; z <= 355; z++) for (let x = 234; x <= 311; x++) {
      pave(x, z, B.BRICK, ((x + z) % 2 === 0) ? C.brickMain : C.plazaCream);
    }

    // 3D. Central Plaza Hub (x=272.5, z=258, r=33) + Castle Island & Drawbridge Causeway
    for (let z = 222; z <= 292; z++) for (let x = 236; x <= 309; x++) {
      const r = Math.hypot(x - 272.5, z - 258);
      if (r <= 33) {
        const inRoseRing = r >= 12.5 && r <= 16.5 && Math.abs(x - 272.5) > 3.5 && Math.abs(z - 258) > 3.5;
        if (!inRoseRing) pave(x, z, B.FLAGS, r < 9 ? C.plazaPink : C.plazaCream);
      }
    }
    for (let z = 182; z <= 232; z++) for (let x = 250; x <= 295; x++) {
      if (Math.hypot(x - 272.5, z - 208) <= 20.5 || Math.abs(x - 272.5) <= 4.5) {
        pave(x, z, B.MARBLE, ((x + z) % 2 === 0) ? C.plazaCream : C.stoneL);
      }
    }

    // 3E. Fantasyland Medieval Courtyard, Matterhorn Trail & "it's a small world" Topiary Mall (x=222..338, z=96..190)
    for (let z = 100; z <= 190; z++) for (let x = 224; x <= 338; x++) {
      const inCourtyard = Math.hypot((x - 272.5) / 46, (z - 148) / 40) <= 1.0;
      const inSWMall = Math.hypot((x - 304) / 24, (z - 118) / 24) <= 1.0;
      const onMatterhornPass = x >= 300 && x <= 338 && z >= 186 && z <= 246 && Math.abs((x - 302) - (244 - z) * 0.45) <= 8;
      if (inCourtyard || inSWMall) pave(x, z, B.FLAGS, ((x + z) % 2 === 0) ? C.fantasyCobble : C.plazaCream);
      else if (onMatterhornPass) pave(x, z, B.PATH, C.plazaCream);
    }
    // Matterhorn South/East Alpine Pass connecting Hub/Tomorrowland to Small World
    for (let z = 140; z <= 248; z++) for (let x = 304; x <= 356; x++) {
      const dM = Math.hypot(x - 330, z - 176);
      if (dM >= 20 && dM <= 28) pave(x, z, B.PATH, C.plazaCream);
    }

    // 3F. Mickey's Toontown Curvy Cartoon Plaza & Underpass Road (x=226..288, z=38..106)
    for (let z = 38; z <= 106; z++) for (let x = 226; x <= 288; x++) {
      const underpass = z >= 82 && z <= 106 && Math.abs(x - 262) <= 6;
      const toonPlaza = Math.hypot((x - 255) / 28, (z - 62) / 22) <= 1.0;
      if (underpass || toonPlaza) {
        pave(x, z, B.FLAGS, ((x + z) % 3 === 0) ? C.toonRoad : C.plazaCream);
      }
    }

    // 3G. Frontierland Wooden Boardwalk, Rivers of America Waterfront, Big Thunder Trail & Walkable Tom Sawyer Island!
    for (let z = 234; z <= 256; z++) for (let x = 180; x <= 242; x++) {
      const boardwalk = z <= 240 || z >= 251;
      pave(x, z, boardwalk ? B.PLANKS : B.PATH, boardwalk ? C.woodWalk : C.advDirt);
    }
    // Riverfront Promenade & Big Thunder Trail (wrapping east & north of Rivers of America up to Batuu!)
    for (let z = 122; z <= 254; z++) for (let x = 166; x <= 216; x++) {
      const nearRiver = x <= 192 && z >= 136 && z <= 246;
      const thunderTrail = Math.abs(x - 188) <= 8 && z >= 116 && z <= 176;
      if (nearRiver || thunderTrail) pave(x, z, B.PATH, C.advDirt);
    }
    // Tom Sawyer Island Suspension Bridge Deck & Island Trails
    for (let x = 150; x <= 182; x++) for (let z = 202; z <= 206; z++) {
      set(x, PARK_Y - 1, z, B.PLANKS, C.woodWalk);
      hm[zi(x, z)] = PARK_Y; occ[zi(x, z)] = 1;
    }
    for (let z = 168; z <= 214; z++) for (let x = 122; x <= 148; x++) {
      if (Math.hypot((x - 134) / 11, (z - 191) / 18) <= 1.0) pave(x, z, B.PATH, C.advDirt);
    }

    // 3H. New Orleans Square French Quarter Streets, Haunted Mansion Courtyard & Bayou Country Trail (x=62..182, z=168..284)
    for (let z = 240; z <= 284; z++) for (let x = 100; x <= 182; x++) {
      pave(x, z, B.FLAGS, ((x + z) % 2 === 0) ? C.nolaStone : C.plazaCream);
    }
    for (let z = 166; z <= 252; z++) for (let x = 62; x <= 104; x++) {
      const onBayouWalk = Math.hypot((x - 84) / 18, (z - 236) / 16) <= 1.0 || (x >= 78 && x <= 94 && z >= 166 && z <= 244);
      if (onBayouWalk) pave(x, z, B.PATH, C.advDirt);
    }

    // 3I. Adventureland Spoke Bridge, Tiki Plaza, Bazaar & Indiana Jones Promenade (x=140..244, z=262..328)
    for (let z = 262; z <= 302; z++) for (let x = 198; x <= 246; x++) {
      if (Math.abs((246 - x) * 0.65 - (z - 264)) <= 8) pave(x, z, B.PLANKS, C.woodWalk);
    }
    for (let z = 278; z <= 328; z++) for (let x = 142; x <= 220; x++) {
      if (z <= 316 || x >= 186) pave(x, z, B.PATH, C.advDirt);
    }

    // 3J. Star Wars: Galaxy's Edge — Batuu NW Outpost (x=76..164, z=50..126) + 3 Authentic Transition Trails!
    for (let z = 50; z <= 126; z++) for (let x = 76; x <= 164; x++) {
      if (Math.hypot((x - 116) / 42, (z - 86) / 34) <= 1.0) {
        pave(x, z, B.FLAGS, ((x + z) % 3 === 0) ? C.advDirt : C.railGravel);
      }
    }
    // West Bayou->Batuu Trail (x=80..92, z=118..170), East Frontier/Fantasyland->Batuu Trail (x=154..228, z=106..126)
    for (let z = 118; z <= 170; z++) for (let x = 80; x <= 92; x++) pave(x, z, B.PATH, C.advDirt);
    for (let z = 108; z <= 122; z++) for (let x = 154; x <= 228; x++) pave(x, z, B.PATH, C.advDirt);

    // 3K. Tomorrowland Avenue of Planets, Space Mountain Concourse & Autopia Scenic Highway (x=304..462, z=206..312)
    for (let z = 224; z <= 304; z++) for (let x = 304; x <= 448; x++) {
      const inSpoke = Math.abs(z - 258) <= 12 && x <= 380;
      const inPlaza = Math.hypot((x - 392) / 52, (z - 262) / 38) <= 1.0;
      if (inSpoke || inPlaza) {
        const neonLine = (Math.abs(z - 258) === 6 || Math.abs(x - 388) === 14);
        pave(x, z, B.LIMES, neonLine ? C.tomCyan : C.tomSilver);
      }
    }
    // Autopia Scenic Asphalt Freeway Loop (x=414..456, z=196..234)
    for (let z = 194; z <= 236; z++) for (let x = 412; x <= 458; x++) {
      const d = Math.hypot((x - 435) / 20, (z - 215) / 18);
      if (d >= 0.72 && d <= 1.02) pave(x, z, B.LANE, C.asphalt);
    }

    // 3L. 1:1 DISNEYLAND GRAND CIRCLE STEAM RAILROAD GRAVEL BED (cx=266, cz=268, rx=204, rz=204 — 4 Stations!)
    for (let z = 54; z <= 480; z++) for (let x = 54; x <= 480; x++) {
      const r = Math.hypot((x - 266) / 202, (z - 268) / 202);
      if (r >= 0.985 && r <= 1.015 && hm[zi(x, z)] >= PARK_Y - 1) {
        pave(x, z, B.GRAVEL, C.railGravel);
      }
    }

    /* ================= 4. DISNEYLAND PARK PARIS — WATERWAYS & PAVING (south lobe, z >= 738) ================= */
    {
      const P = PARIS, L = P.lake;
      const ell = (cx, cz, rx, rz, fn) => {
        for (let z = Math.floor(cz - rz); z <= cz + rz; z++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
          const d = Math.hypot((x - cx) / rx, (z - cz) / rz);
          if (d <= 1) fn(x, z, d);
        }
      };
      const rect = (x0, x1, z0, z1, fn) => { for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) fn(x, z); };
      const pv = (x, z, b, c) => {
        if (!inb(x, PARK_Y, z)) return;
        const k = zi(x, z);
        if (occ[k] === 2 || hm[k] < PARK_Y) return;
        set(x, hm[k] - 1, z, b, c); occ[k] = 1;
      };
      const chk = (x, z, a, b, n) => (((Math.floor(x / n) + Math.floor(z / n)) & 1) ? a : b);

      // Rivers of the Far West (Big Thunder Mountain stands on the island in the middle).
      ell(L.x, L.z, L.rx, L.rz, (x, z) => {
        if (Math.hypot((x - L.x) / L.ix, (z - L.z) / L.iz) >= 1) carveWater(x, z);
      });
      // Castle moat wrapping the front and flanks of the rock hill (causeway left on the axis).
      ell(P.x, P.zCastle, 36, 31, (x, z) => {
        const d = Math.hypot((x - P.x) / 27, (z - P.zCastle) / 23);
        if (d >= 1.04 && z <= P.zCastle + 10 && Math.abs(x - P.x) > 4) carveWater(x, z);
      });
      // Adventure Isle lagoon (Skull Rock islet kept), Nautilus lagoon, Fantasia Gardens ponds.
      ell(P.isle.x, P.isle.z, 32, 19, (x, z) => {
        if (Math.hypot((x - P.isle.x - 7) / 13, (z - P.isle.z) / 8) >= 1) carveWater(x, z);
      });
      ell(P.lagoon.x, P.lagoon.z, 20, 12, carveWater);
      ell(P.x - 32, 764, 9, 5, carveWater);
      ell(P.x + 32, 764, 9, 5, carveWater);

      // Disneyland Railroad roadbed.
      const R = P.rail;
      rect(R.x - R.rx - 4, R.x + R.rx + 4, R.z - R.rz - 4, R.z + R.rz + 4, (x, z) => {
        const d = Math.hypot((x - R.x) / R.rx, (z - R.z) / R.rz);
        if (d >= 0.989 && d <= 1.011) pv(x, z, B.GRAVEL, C.railGravel);
      });

      // Resort promenade from the Hollywood/Animal Kingdom boulevard, Fantasia Gardens and the hotel forecourt.
      rect(374, 394, 618, 752, (x, z) => pv(x, z, B.FLAGS, Math.abs(x - 384) <= 1 ? C.pRose : C.pCream));
      ell(P.x, 766, 64, 20, (x, z, d) => pv(x, z, B.FLAGS, d > 0.9 ? C.pRose : chk(x, z, C.pCream, C.stoneL, 3)));
      rect(326, 442, 782, 800, (x, z) => pv(x, z, B.FLAGS, chk(x, z, C.pRose, C.pCream, 2)));

      // Main Street Station forecourt and Town Square (lawn ring around the bandstand).
      rect(346, 422, 800, 850, (x, z) => {
        const d = Math.hypot(x - P.x, z - P.zSquare);
        if (d > 5 && d < 11) return;
        pv(x, z, B.FLAGS, d <= 5 ? C.pRose : (d < 14 ? C.pBrick : C.pCream));
      });
      // Main Street, U.S.A.: arcades, building floors, kerbs and the brick roadway with trolley rails.
      rect(352, 416, 850, 918, (x, z) => {
        const a = Math.abs(x - P.x);
        if (a <= 5) pv(x, z, B.BRICK, a === 2 ? C.pSlate : C.pBrick);
        else if (a <= 8) pv(x, z, B.FLAGS, C.pCream);
        else if (a <= 26) pv(x, z, B.FLAGS, C.stoneL);
        else pv(x, z, B.FLAGS, chk(x, z, C.pRose, C.pCream, 2));
      });
      // Central Plaza hub with the round flower bed.
      ell(P.x, P.zHub, 30, 30, (x, z, d) => {
        if (d < 0.2) return;
        pv(x, z, B.FLAGS, d > 0.92 ? C.pRose : (d < 0.3 ? C.pBrick : chk(x, z, C.pCream, C.stoneL, 3)));
      });
      // Castle causeway, courtyard and the passage through to Fantasyland.
      rect(380, 388, 968, 1040, (x, z) => pv(x, z, B.PATH, C.pSlate));
      ell(P.x, P.zCastle, 15, 12, (x, z) => pv(x, z, B.FLAGS, chk(x, z, C.pSlate, C.pLilac, 2)));
      ell(P.x, 1062, 92, 36, (x, z, d) => pv(x, z, B.PATH, d > 0.94 ? C.pRose : C.pLilac));
      rect(296, 472, 1052, 1060, (x, z) => pv(x, z, B.PATH, C.pLilac));

      // Frontierland: Fort Comstock spoke, Thunder Mesa lakeside street, Phantom Manor drive.
      rect(412, 456, 941, 951, (x, z) => pv(x, z, B.PLANKS, C.woodWalk));
      ell(L.x, L.z, L.rx + 13, L.rz + 13, (x, z) => {
        if (Math.hypot((x - L.x) / L.ix, (z - L.z) / L.iz) < 1) return;
        pv(x, z, B.PATH, C.pOchre);
      });
      rect(P.manor.x - 4, P.manor.x + 4, P.manor.z + 6, P.manor.z + 24, (x, z) => pv(x, z, B.PATH, C.pSlate));
      rect(518, 527, 984, 1016, (x, z) => pv(x, z, B.PATH, C.pOchre));

      // Adventureland: bazaar spoke, Adventure Isle shore walk, paths to the Temple and the pirate fortress.
      for (let t = 0; t <= 1; t += 0.004) {
        const lx = 404 + (456 - 404) * t, lz = 964 + (1010 - 964) * t;
        rect(Math.round(lx - 5), Math.round(lx + 5), Math.round(lz - 5), Math.round(lz + 5), (x, z) => pv(x, z, B.PATH, C.pSand));
      }
      ell(P.isle.x, P.isle.z, 45, 31, (x, z) => pv(x, z, B.PATH, C.pSand));
      rect(538, 584, 1004, 1012, (x, z) => pv(x, z, B.PATH, C.pSand));
      rect(466, 475, 1066, 1082, (x, z) => pv(x, z, B.PATH, C.pSand));

      // Discoveryland: spoke, Space Mountain concourse, Nautilus lagoon quay and Videopolis plaza.
      rect(314, 356, 941, 951, (x, z) => pv(x, z, B.LIMES, C.pBronze));
      ell(P.space.x + 6, P.space.z + 4, 66, 50, (x, z, d) => pv(x, z, B.LIMES, d > 0.93 ? C.pTeal : chk(x, z, C.pBronze, C.pCream, 4)));
      ell(P.lagoon.x, P.lagoon.z, 28, 19, (x, z) => pv(x, z, B.LIMES, C.pBronze));
      ell(262, 1040, 42, 24, (x, z) => pv(x, z, B.LIMES, chk(x, z, C.pBronze, C.pTeal, 4)));
      rect(296, 306, 1016, 1056, (x, z) => pv(x, z, B.LIMES, C.pBronze));
    }

    /* ================= 5. WALT DISNEY WORLD RESORT PARKS — WATERWAYS & PAVING ================= */
    {
      const E = RESORT.epcot, HS = RESORT.studios, AK = RESORT.kingdom;
      const ell = (cx, cz, rx, rz, fn) => {
        for (let z = Math.floor(cz - rz); z <= cz + rz; z++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
          const d = Math.hypot((x - cx) / rx, (z - cz) / rz);
          if (d <= 1) fn(x, z, d);
        }
      };
      const rect = (x0, x1, z0, z1, fn) => { for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) fn(x, z); };
      const pv = (x, z, b, c) => {
        if (!inb(x, PARK_Y, z)) return;
        const k = zi(x, z);
        if (occ[k] === 2 || hm[k] < PARK_Y) return;
        set(x, hm[k] - 1, z, b, c); occ[k] = 1;
      };
      const chk = (x, z, a, b, n) => (((Math.floor(x / n) + Math.floor(z / n)) & 1) ? a : b);

      /* ---- Water first ---- */
      const L = E.lagoon;
      ell(L.x, L.z, L.rx, L.rz, carveWater);                                   // World Showcase Lagoon
      ell(HS.lake.x, HS.lake.z, 15, 11, carveWater);                           // Echo Lake
      ell(AK.x, AK.z, 31, 27, (x, z) => {                                      // Discovery River ring + 4 bridges
        if (Math.hypot((x - AK.x) / 23, (z - AK.z) / 19) < 1) return;
        if (Math.abs(x - AK.x) <= 3 || Math.abs(z - AK.z) <= 3) return;
        carveWater(x, z);
      });
      ell(194, 662, 26, 7, carveWater);                                        // Pandora · Kaspavan River
      ell(AK.savanna.x - 6, AK.savanna.z + 1, 11, 5, carveWater);              // Savanna watering hole

      /* ---- EPCOT ---- */
      rect(446, 620, 250, 266, (x, z) => pv(x, z, B.LIMES, C.tomSilver));      // Tomorrowland -> EPCOT boulevard
      ell(E.x, 274, 36, 24, (x, z, d) => pv(x, z, B.FLAGS, d > 0.92 ? C.tomCyan : chk(x, z, C.tomSilver, C.plazaBlue, 3)));
      ell(E.x, E.zEarth, 31, 31, (x, z, d) => pv(x, z, B.FLAGS, d < 0.36 ? C.pLilac : chk(x, z, C.tomSilver, C.stoneL, 3)));
      ell(E.x, 186, 46, 24, (x, z, d) => {
        if (d > 0.38 && d < 0.66 && Math.abs(x - E.x) > 3 && Math.abs(z - 186) > 2) return;   // World Celebration garden lawns
        pv(x, z, B.FLAGS, d <= 0.38 ? C.plazaBlue : chk(x, z, C.tomSilver, C.stoneL, 3));
      });
      ell(566, 214, 28, 46, (x, z) => pv(x, z, B.LIMES, chk(x, z, C.tomSilver, C.decoMint, 4)));   // World Nature
      ell(676, 234, 30, 48, (x, z) => pv(x, z, B.LIMES, chk(x, z, C.tomSilver, C.plazaBlue, 4)));  // World Discovery
      ell(L.x, L.z, L.rx + 11, L.rz + 11, (x, z, d) => pv(x, z, B.FLAGS, d > 0.94 ? C.pBrick : chk(x, z, C.pCream, C.plazaPink, 3)));
      for (let k = 0; k < 11; k++) {
        const a = (120 + k * 30) * Math.PI / 180;
        ell(L.x + Math.cos(a) * E.ring.rx, L.z + Math.sin(a) * E.ring.rz, 14, 14, (x, z) => pv(x, z, B.FLAGS, chk(x, z, C.stoneL, C.pCream, 2)));
      }
      rect(606, 634, 284, 512, (x, z) => pv(x, z, Math.abs(x - 620) <= 8 ? B.PATH : B.FLAGS, Math.abs(x - 620) <= 8 ? C.plazaCream : C.plazaBlue));

      /* ---- Disney's Hollywood Studios ---- */
      ell(HS.x, HS.zGate, 32, 15, (x, z) => pv(x, z, B.FLAGS, chk(x, z, C.decoMint, C.plazaCream, 3)));
      rect(594, 638, 526, 594, (x, z) => {
        const a = Math.abs(x - HS.x);
        if (a <= 5) pv(x, z, B.LANE, a === 0 ? C.pCream : C.asphalt);
        else if (a <= 9) pv(x, z, B.FLAGS, chk(x, z, C.plazaPink, C.plazaCream, 2));
        else pv(x, z, B.FLAGS, C.stoneL);
      });
      ell(HS.x, 596, 26, 15, (x, z) => pv(x, z, B.FLAGS, chk(x, z, C.pBrick, C.plazaCream, 2)));
      rect(630, 690, 556, 576, (x, z) => {
        const a = Math.abs(z - HS.zSunset);
        pv(x, z, a <= 4 ? B.LANE : B.FLAGS, a <= 4 ? C.asphalt : chk(x, z, C.plazaPink, C.plazaCream, 2));
      });
      ell(688, HS.zSunset + 6, 22, 30, (x, z) => pv(x, z, B.FLAGS, chk(x, z, C.pRose, C.pCream, 3)));
      ell(HS.lake.x, HS.lake.z, 25, 21, (x, z) => pv(x, z, B.FLAGS, chk(x, z, C.plazaCream, C.decoMint, 3)));
      rect(571, 585, 624, 642, (x, z) => pv(x, z, B.PATH, C.pSand));
      ell(HS.toy.x, HS.toy.z, 46, 36, (x, z, d) => pv(x, z, B.FLAGS, d > 0.93 ? C.toyGreen : chk(x, z, C.pSand, C.pCream, 5)));
      rect(634, 646, 596, 622, (x, z) => pv(x, z, B.FLAGS, C.plazaCream));
      ell(652, 632, 22, 17, (x, z) => pv(x, z, B.FLAGS, chk(x, z, C.plazaBlue, C.plazaCream, 3)));

      /* ---- Disney's Animal Kingdom ---- */
      rect(264, 280, 506, 600, (x, z) => pv(x, z, B.PATH, C.advDirt));                    // Esplanade -> The Oasis
      rect(300, 560, 612, 626, (x, z) => pv(x, z, B.PATH, C.advDirt));                    // Hollywood Studios link
      rect(374, 394, 618, 752, (x, z) => pv(x, z, B.FLAGS, Math.abs(x - 384) <= 1 ? C.pRose : C.pCream));
      ell(AK.x, 598, 24, 13, (x, z) => pv(x, z, B.PATH, C.pSand));
      ell(AK.x, AK.z, 41, 37, (x, z) => pv(x, z, B.PATH, C.advDirt));                     // Discovery Island ring walk
      ell(AK.x, AK.z, 23, 19, (x, z, d) => pv(x, z, d > 0.52 ? B.PATH : B.GRASS, d > 0.52 ? C.pOchre : C.jungle));
      rect(214, 236, 636, 644, (x, z) => pv(x, z, B.PLANKS, C.woodWalk));
      ell(AK.pandora.x, AK.pandora.z, 24, 17, (x, z, d) => pv(x, z, d > 0.9 ? B.GRASS : B.PATH, d > 0.9 ? C.pandora : chk(x, z, C.advDirt, C.pandora, 6)));
      rect(303, 311, 644, 694, (x, z) => pv(x, z, B.PATH, C.pOchre));
      ell(332, 699, 31, 9, (x, z) => pv(x, z, B.PATH, chk(x, z, C.pOchre, C.pSand, 3)));
      rect(268, 276, 662, 686, (x, z) => pv(x, z, B.PATH, C.pOchre));
      ell(AK.harambe.x, AK.harambe.z, 27, 12, (x, z) => pv(x, z, B.PATH, chk(x, z, C.pOchre, C.pSand, 4)));
      const SV = AK.savanna;
      ell(SV.x, SV.z, SV.rx, SV.rz, (x, z, d) => pv(x, z, d > 0.7 && d < 0.86 ? B.PATH : B.GRASS, d > 0.7 && d < 0.86 ? C.advDirt : C.savanna));
    }

    // Compute topH & topC for the minimap.
    for (let z = 0; z < D; z++) {
      for (let x = 0; x < W; x++) {
        let ty = 0, tc = 0;
        for (let y = maxSolidY; y >= minSolidY; y--) {
          const b = blocks[idx(x, y, z)];
          if (b !== 0) { ty = y; tc = cols[idx(x, y, z)]; break; }
        }
        topH[zi(x, z)] = ty;
        topC[zi(x, z)] = tc;
      }
    }

    // Warm Magical Park Illumination Points across 1:1 Disneyland
    const lamps = [
      [272.5, PARK_Y + 6, 468, false, 1.3],
      [272.5, PARK_Y + 6, 428, false, 1.3],
      [272.5, PARK_Y + 6, 382, false, 1.3],
      [272.5, PARK_Y + 6, 332, false, 1.3],
      [272.5, PARK_Y + 8, 258, false, 1.5],
      [272.5, PARK_Y + 8, 208, true,  1.9],
      [272.5, PARK_Y + 7, 162, false, 1.5],
      [256.0, PARK_Y + 6, 60,  false, 1.4],
      [142.0, PARK_Y + 6, 258, false, 1.5],
      [194.0, PARK_Y + 6, 308, false, 1.4],
      [184.0, PARK_Y + 6, 204, false, 1.4],
      [382.0, PARK_Y + 7, 258, false, 1.6]
    ];

    const tour = {
      dur: 84,
      cam: [
        [272.5, 66, 504], [272.5, 56, 378], [272.5, 58, 282], [218, 62, 232],
        [152, 60, 272], [156, 62, 184], [116, 60, 122], [256, 58, 86],
        [318, 62, 128], [362, 62, 224], [412, 60, 294], [316, 62, 396]
      ],
      tgt: [
        [272.5, 48, 420], [272.5, 54, 208], [272.5, 52, 208], [186, 46, 294],
        [145, 44, 268], [134, 44, 191], [116, 46, 86], [254, 44, 48],
        [306, 48, 84], [330, 52, 176], [428, 52, 286], [272.5, 48, 258]
      ]
    };

    const props = {
      parkY: PARK_Y,
      lands: LANDS,
      axisX: CX,
      castleCenter: { x: CX, y: PARK_Y, z: 208.5 },
      hubCenter:    { x: CX, y: PARK_Y, z: 258.0 },
      carouselCenter: { x: CX, y: PARK_Y, z: 162.0 },
      riverDock:    { x: 192.5, y: PARK_Y, z: 322.0 },
      starjetCenter:{ x: 352.0, y: PARK_Y, z: 258.0 }
    };

    return {
      W, D, H, WATER_Y, PARK_Y, CX, B, BI, T, PARIS, RESORT,
      minSolidY, maxSolidY,
      blocks, cols, hm, occ, topH, topC, palette,
      LANDS, lamps, tour, props
    };
  }

  const api = { W, D, H, WATER_Y, PARK_Y, CX, B, BI, T, LANDS, create, hash3, mulberry32 };
  root.TPWorld = api;
  root.PIWorld = api; // Compatibility alias for shared textures.js & mesher.js!
})(window);
