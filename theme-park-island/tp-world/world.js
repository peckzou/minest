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

  const W = 768, D = 768, H = 88, WATER_Y = 36.4, PARK_Y = 40;
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
      id: 'epcot', num: 14, park: 'resort', zone: 'orlando', badge: '度假区 · EPCOT', color: '#06b6d4',
      name: '艾波卡特 · EPCOT（未来地球 & 世界橱窗）', en: 'Spaceship Earth Geodesic Sphere, World Showcase & Skyliner',
      x: 620, z: 250, rideId: 'skyliner_ride',
      host: '未来领航员艾娃 · EPCOT Ambassador', robe: 0x0891b2, hair: 0xe2e8f0,
      quote: '从明日世界向东穿过度假区大道即达艾波卡特！1,280 晶面银色巨球「未来地球」闪耀天际，还可搭乘高空缆车俯瞰世界橱窗五大国家馆！',
      highlights: ['【可乘坐设施 #11】迪士尼高空缆车（Disney Skyliner）空中往返艾波卡特与好莱坞影城', '44 米银色晶面巨球「未来地球 Spaceship Earth」与水晶棱柱喷泉', '世界橱窗泻湖（法、日、墨、中、意五国地标）与银河护卫队新星战舰'],
      tp: { mode: 'walk', p: [620, PARK_Y, 270], t: [620, PARK_Y + 20, 220] }
    },
    {
      id: 'hollywood', num: 15, park: 'resort', zone: 'orlando', badge: '度假区 · 好莱坞影城', color: '#e11d48',
      name: '好莱坞影城 · Hollywood Studios', en: 'Tower of Terror Drop Hotel, Chinese Theatre & Toy Story Land',
      x: 612, z: 590,
      host: '好莱坞导演维克多 · Studio Director', robe: 0xbe123c, hair: 0x27272a,
      quote: '欢迎踏上 1930 年代装饰艺术日落大道！右侧 52 米「恐怖魔塔」电梯正伴随闪电急速坠落，左侧是中国大剧院、回声湖恐龙葛蒂与玩具总动员园区！',
      highlights: ['52 米西班牙复兴式「恐怖魔塔 Tower of Terror」与实时闪电坠落电梯', '好莱坞中国大剧院、复古棕榈日落大道与回声湖恐龙葛蒂', '玩具总动员园区巨型彩色积木与弹簧狗过山车拱门'],
      tp: { mode: 'walk', p: [612, PARK_Y, 614], t: [636, PARK_Y + 22, 560] }
    },
    {
      id: 'animal_kingdom', num: 16, park: 'resort', zone: 'orlando', badge: '度假区 · 动物王国', color: '#22c55e',
      name: '动物王国 & 阿凡达潘多拉 · Animal Kingdom', en: 'Tree of Life, Pandora Floating Mountains & Rideable Everest',
      x: 272, z: 660, rideId: 'everest_ride',
      host: '潘多拉探险家内蒂莉 · Pandora Naturalist', robe: 0x15803d, hair: 0x18181b,
      quote: '南区度假园是壮丽的自然奇境！正中是 46 米生命之树与草原长颈鹿，西侧是高空悬浮的阿凡达哈利路亚山飞瀑，东侧即可登上珠穆朗玛雪山过山车！',
      highlights: ['【可乘坐设施 #12】珠峰探险过山车（Expedition Everest）盘旋 48 米喜马拉雅雪峰', '阿凡达·潘多拉世界：悬浮哈利路亚群峰、荧光莲花树与盘旋斑溪兽', '46 米有机树冠「生命之树（Tree of Life）」与乞力马扎罗长颈鹿草原'],
      tp: { mode: 'walk', p: [262, PARK_Y, 680], t: [230, PARK_Y + 18, 628] }
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
        const r = Math.hypot(dx, dz);
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

        const isToon = z <= 88 && x >= 214 && x <= 298;
        const isAdv = (x >= 126 && x <= 226 && z >= 274 && z <= 372) || (z > 550 && x < 420);
        const isBayou = x < 126 && z >= 156 && z <= 250;
        const isFan = x >= 216 && x <= 346 && z >= 90 && z <= 198;

        const topBlock = gy <= WATER_Y + 1 ? B.SAND : (wfDist < 0.88 ? B.ROCK : (isToon ? B.MEADOW : B.GRASS));
        const topCol = gy <= WATER_Y + 1 ? C.sand : (wfDist < 0.88 ? C.rock : isToon ? C.toonGreen : isAdv ? C.jungle : isBayou ? C.bayou : isFan ? C.grassL : C.grass);

        const yStart = Math.max(32, gy - 5);
        for (let y = yStart; y < gy - 1; y++) set(x, y, z, B.DIRT, C.dirt);
        set(x, gy - 1, z, topBlock, topCol);
        hm[zi(x, z)] = gy;
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

    // 2I. ORLANDO RESORT LAGOONS (EPCOT Lagoon, Hollywood Echo Lake, Animal Kingdom Pandora River)
    for (let z = 146; z <= 192; z++) for (let x = 590; x <= 650; x++) {
      if (Math.hypot((x - 620) / 28, (z - 169) / 21) <= 1.0) carveWater(x, z);
    }
    for (let z = 598; z <= 622; z++) for (let x = 568; x <= 598; x++) {
      if (Math.hypot((x - 583) / 14, (z - 610) / 11) <= 1.0) carveWater(x, z);
    }
    for (let z = 648; z <= 666; z++) for (let x = 166; x <= 222; x++) {
      if (Math.hypot((x - 194) / 26, (z - 657) / 8) <= 1.0) carveWater(x, z);
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

    // 3M. ORLANDO RESORT EXPANSION BOULEVARDS & 3 RESORT PARK PLAZAS (East & South Sectors!)
    for (let z = 250; z <= 266; z++) for (let x = 446; x <= 620; x++) pave(x, z, B.LIMES, C.tomSilver); // Tomorrowland -> EPCOT
    for (let z = 132; z <= 292; z++) for (let x = 566; x <= 678; x++) {
      const inPlaza = Math.hypot((x - 620) / 54, (z - 236) / 48) <= 1.0 || Math.hypot((x - 620) / 40, (z - 169) / 32) <= 1.0;
      if (inPlaza) pave(x, z, B.FLAGS, ((x + z) % 2 === 0) ? C.tomSilver : C.plazaBlue);
    }
    for (let z = 284; z <= 550; z++) for (let x = 606; x <= 622; x++) pave(x, z, B.PATH, C.plazaCream); // EPCOT -> Hollywood
    for (let z = 516; z <= 638; z++) for (let x = 550; x <= 680; x++) {
      if (Math.hypot((x - 616) / 62, (z - 576) / 56) <= 1.0) pave(x, z, B.FLAGS, ((x + z) % 3 === 0) ? C.plazaPink : C.plazaCream);
    }
    for (let z = 506; z <= 616; z++) for (let x = 264; x <= 280; x++) pave(x, z, B.PATH, C.advDirt); // Esplanade -> Animal Kingdom
    for (let z = 612; z <= 626; z++) for (let x = 350; x <= 560; x++) pave(x, z, B.PATH, C.advDirt); // Hollywood -> Animal Kingdom
    for (let z = 592; z <= 692; z++) for (let x = 156; x <= 386; x++) {
      if (Math.hypot((x - 270) / 110, (z - 640) / 44) <= 1.0) pave(x, z, B.PATH, C.advDirt);
    }

    // Compute topH & topC for crisp 768x768 Minimap!
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
      W, D, H, WATER_Y, PARK_Y, CX, B, BI, T,
      minSolidY, maxSolidY,
      blocks, cols, hm, occ, topH, topC, palette,
      LANDS, lamps, tour, props
    };
  }

  const api = { W, D, H, WATER_Y, PARK_Y, CX, B, BI, T, LANDS, create, hash3, mulberry32 };
  root.TPWorld = api;
  root.PIWorld = api; // Compatibility alias for shared textures.js & mesher.js!
})(window);
