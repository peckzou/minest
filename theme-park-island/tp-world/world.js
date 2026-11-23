/* Minest My World · Imagineering Theme Park (梦幻奇想主题乐园)
 * Classic Disneyland-Inspired Hub-and-Spoke 384 x 384 x 84 Voxel + High-Craft 3D Island.
 * 5 Themed Lands: Main Street, Central Castle, Fantasyland, Adventureland, Tomorrowland + Perimeter Steam Railroad.
 * Exposes TPWorld (and aliases PIWorld for textures.js / mesher.js). */
(function (root) {
  'use strict';

  const W = 544, D = 544, H = 84, WATER_Y = 36.4, PARK_Y = 40;

  const T = {
    grass: 0, grassS: 1, dirt: 2, rock: 3, sand: 4, gravel: 5, ashlar: 6, limeSmooth: 7, limeCarved: 8,
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

  // Park Zones & Landmarks (Classic Disneyland Hub-and-Spoke!)
  const LANDS = [
    {
      id: 'main_gate', num: 1, zone: 'main_street', badge: '正门入口', color: '#f59e0b',
      name: '正门迎宾广场 & 火车总站', en: 'Main Gate & Steam Railroad Station',
      x: 192, z: 320, host: '站长查尔斯 · Main Street Conductor', robe: 0x1d4ed8, hair: 0x3f2a1d,
      quote: '欢迎光临奇想主题乐园！穿过维多利亚火车站拱门，沿着梦幻主街一路直抵童话城堡！',
      highlights: ['维多利亚红砖拱门火车站与钟楼', '入口星花主题迎宾花坛与售票亭', '环岛蒸汽小火车实时鸣笛环游全园'],
      tp: { mode: 'walk', p: [192.5, PARK_Y, 351], t: [192.5, PARK_Y + 8.5, 320] }
    },
    {
      id: 'main_street', num: 2, zone: 'main_street', badge: '梦幻主街', color: '#f59e0b',
      name: '梦幻主街 · Main Street, U.S.A.', en: 'Victorian Boulevard & Trolley',
      x: 192, z: 266, host: '烘焙师克拉拉 · Main Street Baker', robe: 0xbe185d, hair: 0x5c3a21,
      quote: '这里的每座维多利亚彩色店铺都藏着复古橱窗与咖啡香气——抬头看，城堡就在大道正前方！',
      highlights: ['8 座维多利亚彩色商业建筑与可进入烘焙咖啡馆', '复古有轨电车、铁艺花篮街灯与林荫长椅', '经典强透视中轴线直望中央童话城堡'],
      tp: { mode: 'walk', p: [196.8, PARK_Y, 294], t: [192.5, PARK_Y + 12.5, 176] }
    },
    {
      id: 'castle', num: 3, zone: 'castle', badge: '中央城堡', color: '#ec4899',
      name: '星光童话城堡 · Central Castle', en: 'Starlight Fairytale Castle & Hub',
      x: 192, z: 176, host: '城堡守护者艾琳 · Castle Herald', robe: 0x7c3aed, hair: 0xfde047,
      quote: '星光城堡是整座乐园的心脏！你可以穿过护城河石桥步入穹顶大厅，或一键开启夜空烟花灯光秀！',
      highlights: ['10 座钴蓝金顶童话尖塔、粉白石墙与玫瑰彩窗', '可步入的皇家大厅与护城河石拱吊桥', '按 N 或点击烟花按钮即可欣赏全园夜间灯光烟花秀'],
      tp: { mode: 'walk', p: [192.5, PARK_Y, 228], t: [192.5, PARK_Y + 16.5, 176] },
      tpInside: { mode: 'walk', p: [192.5, PARK_Y, 182.5], t: [192.5, PARK_Y + 4.5, 170] }
    },
    {
      id: 'fantasyland', num: 4, zone: 'fantasyland', badge: '梦幻世界', color: '#a855f7',
      name: '梦幻世界 · Fantasyland', en: 'Regal Carrousel, Dumbo & Mad Tea Party',
      x: 192, z: 122, rideId: 'carousel', host: '童话镇长梅林 · Fantasyland Keeper', robe: 0x6d28d9, hair: 0xe2e8f0,
      quote: '欢迎来到城堡后方的梦幻世界！除了皇家旋转木马，还有小飞象、疯帽子茶杯与长发公主高塔！',
      highlights: ['【可乘坐设施 A】皇家童话旋转木马：10 匹瓷漆骏马起伏旋转', '动态小飞象旋转塔、疯帽子茶杯与巴伐利亚童话村', '长发公主石塔与漂浮金色天灯'],
      tp: { mode: 'walk', p: [192.5, PARK_Y, 144], t: [192.5, PARK_Y + 5.2, 122] }
    },
    {
      id: 'small_world', num: 5, zone: 'fantasyland', badge: '小小世界 & 雪山', color: '#38bdf8',
      name: '小小世界游船 & 马特宏峰雪山', en: "it's a small world Boat Ride (incl. Mr. Lincoln) & Matterhorn",
      x: 204, z: 98, rideId: 'small_world_boat', host: '小小世界船长汉斯 · Small World Skipper', robe: 0x0284c7, hair: 0xfef3c7,
      quote: '欢迎登上「小小世界」室内奇幻游船！我们将穿过微笑太阳钟，依次巡游欧洲、亚洲、美洲「林肯演讲大厅」、非洲与纯白鎏金大合唱厅！',
      highlights: ['【可乘坐设施 D】小小世界室内游船：穿越 6 大主题展厅与动态人偶', '【经典名场面】美洲馆·林肯总统起立挥手演讲舞台（Great Moments with Mr. Lincoln）', '42 米白金微笑太阳钟立面、46 米马特宏峰雪山与潜水艇泻湖'],
      tp: { mode: 'walk', p: [192.5, PARK_Y, 104], t: [192.5, PARK_Y + 10.5, 74] }
    },
    {
      id: 'frontierland', num: 6, zone: 'adventureland', badge: '边域 & 新奥尔良', color: '#ea580c',
      name: '巨雷山 & 幽灵公馆 · Frontierland', en: 'Big Thunder Mountain, Haunted Mansion & Mark Twain',
      x: 128, z: 152, host: '淘金镇长怀特 · Frontier Marshal', robe: 0x9a3412, hair: 0xd6d3d1,
      quote: '欢迎来到西部边域与新奥尔良广场！前方是红岩巨雷山矿车、三层马克吐温号明轮船与古典幽灵公馆！',
      highlights: ['34 米红岩峡谷「巨雷山过山车」与飞驰矿车', '美国河上三层白金「马克吐温号」蒸汽明轮船', '新奥尔良古典六柱廊「幽灵公馆」与法式铁艺阳台'],
      tp: { mode: 'walk', p: [152, PARK_Y, 156], t: [112, PARK_Y + 10.5, 134] }
    },
    {
      id: 'adventureland', num: 7, zone: 'adventureland', badge: '探险世界', color: '#10b981',
      name: '丛林河流探险船 · Adventureland', en: 'Jungle Cruise, Banyan Treehouse & Temple',
      x: 124, z: 204, rideId: 'river_boat', host: '船长杰克 · Jungle Cruise Skipper', robe: 0x92400e, hair: 0x27272a,
      quote: '抓紧扶手！登上丛林探险船，穿越古石拱门、热带大瀑布、玛雅神庙与高耸的泰山树屋！',
      highlights: ['【可乘坐设施 B】丛林河流探险船：穿越古石拱门、瀑布与玛雅神庙', '高耸的巨型榕树树屋与提基门楼', '乘坐期间支持自由环顾四周，旅程结束安全返回码头'],
      tp: { mode: 'walk', p: [142, PARK_Y, 204], t: [110, PARK_Y + 4.5, 196] }
    },
    {
      id: 'tomorrowland', num: 8, zone: 'tomorrowland', badge: '未来世界', color: '#0ea5e9',
      name: '星际飞行器 & 太空山 · Tomorrowland', en: 'Astro Orbiter, Space Mountain & Monorail',
      x: 266, z: 194, rideId: 'starjet', host: '领航员诺娃 · Tomorrowland Commander', robe: 0x0284c7, hair: 0x38bdf8,
      quote: '欢迎进入未来世界！登上星际轨道飞行器俯瞰 24 肋太空山、高架 PeopleMover 与迪士尼单轨列车！',
      highlights: ['【可乘坐设施 C】金色行星仪星际轨道飞行器 + 第一/第三视角', '24 道白肋太空山穹顶、高架 PeopleMover 与单轨列车', '未来城市全息投影控制台与可互动智能机器人'],
      tp: { mode: 'walk', p: [246, PARK_Y, 208], t: [274, PARK_Y + 9.0, 190] }
    },
    {
      id: 'star_wars', num: 9, zone: 'star_wars', badge: '星球大战', color: '#f97316',
      name: '星球大战：银河边缘 · Star Wars: Galaxy\'s Edge', en: 'Batuu Black Spire Outpost, Millennium Falcon & AT-AT',
      x: 116, z: 96, rideId: 'falcon_flight', host: '抵抗组织领航员蕾伊 · Batuu Resistance Guide', robe: 0xd6d3d1, hair: 0x451a03,
      quote: '欢迎来到巴图星「黑尖塔前哨站」！停机坪上正是传奇飞船「千年隼号」——登上驾驶舱起飞俯瞰全岛，或探索帝国 AT-AT 步行机、X 翼战机与光剑工坊！',
      highlights: ['【可驾驶设施 E】千年隼号：走私者逃亡（Millennium Falcon 升空环飞全园！）', '18 米巨型帝国 AT-AT 步行机、第一秩序 TIE 战机与暴风兵阵列', '巴图星黑尖塔群峰、抵抗组织 X 翼战机、动态 R2-D2/BB-8 与光剑工坊'],
      tp: { mode: 'walk', p: [116, PARK_Y, 103.5], t: [116, PARK_Y + 6.5, 76] }
    },
    {
      id: 'epcot', num: 10, zone: 'orlando', badge: '奥兰多 · EPCOT', color: '#06b6d4',
      name: '艾波卡特 · EPCOT（未来地球 & 世界橱窗）', en: 'Orlando EPCOT · Spaceship Earth & World Showcase',
      x: 438, z: 222, rideId: 'skyliner_ride', host: '未来领航员艾娃 · EPCOT Ambassador', robe: 0x0891b2, hair: 0xe2e8f0,
      quote: '欢迎来到奥兰多「艾波卡特（EPCOT）」！眼前正是 44 米银色晶面巨球「未来地球（Spaceship Earth）」，后方是世界橱窗泻湖与银河护卫队星际基地！',
      highlights: ['44 米奥兰多标志性银色三角晶面巨球「未来地球 Spaceship Earth」', '世界橱窗泻湖：法国巴黎铁塔、日本朱红鸟居五重塔与墨西哥玛雅金字塔', '银河护卫队（Guardians of the Galaxy）新星军团星际战舰与迪士尼空中缆车'],
      tp: { mode: 'walk', p: [438, PARK_Y, 240], t: [438, PARK_Y + 20, 192] }
    },
    {
      id: 'hollywood', num: 11, zone: 'orlando', badge: '奥兰多 · 好莱坞影城', color: '#e11d48',
      name: '好莱坞影城 · Hollywood Studios', en: 'Orlando Tower of Terror, Chinese Theatre & Toy Story',
      x: 418, z: 422, host: '好莱坞导演维克多 · Studio Director', robe: 0xbe123c, hair: 0x27272a,
      quote: '欢迎踏上奥兰多好莱坞大道！右侧是 52 米高、电梯实时急速坠落的「恐怖魔塔（Tower of Terror）」，左侧是中国大剧院与玩具总动员园区！',
      highlights: ['52 米奥兰多传奇「恐怖魔塔 Tower of Terror」与实时坠落电梯', '金碧辉煌好莱坞中国大剧院（Chinese Theatre）与复古棕榈大道', '玩具总动员园区（Toy Story Land）弹簧狗过山车与巨型积木'],
      tp: { mode: 'walk', p: [418, PARK_Y, 444], t: [434, PARK_Y + 22, 392] }
    },
    {
      id: 'animal_kingdom', num: 12, zone: 'orlando', badge: '奥兰多 · 动物王国', color: '#22c55e',
      name: '动物王国 & 阿凡达潘多拉 · Animal Kingdom', en: 'Orlando Tree of Life, Pandora Avatar & Everest',
      x: 192, z: 468, rideId: 'everest_ride', host: '潘多拉探险家内蒂莉 · Pandora Naturalist', robe: 0x15803d, hair: 0x18181b,
      quote: '欢迎来到奥兰多动物王国！正前方是 46 米生命之树，西侧是悬浮空中的「阿凡达·潘多拉哈利路亚悬浮山」瀑布，东侧是 48 米珠穆朗玛雪山！',
      highlights: ['46 米巨型雕琢「生命之树（Tree of Life）」与发现岛雨林', '【阿凡达：潘多拉世界】高空悬浮哈利路亚山、飞瀑与荧光青紫藤蔓', '48 米喜马拉雅雪峰「珠峰探险过山车（Expedition Everest）」'],
      tp: { mode: 'walk', p: [178, PARK_Y, 486], t: [148, PARK_Y + 18, 440] }
    }
  ];

  function create() {
    const rand = mulberry32(20261122);
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
    addCol('grass', 0x58a444); addCol('grassL', 0x6cc052); addCol('jungle', 0x2e7d3b);
    addCol('dirt', 0x7a5b3e); addCol('rock', 0x7c828a); addCol('sand', 0xe5d3a3);
    addCol('brickMain', 0xb05442); addCol('plazaCream', 0xd6cbb6); addCol('plazaPink', 0xe2c7ce);
    addCol('plazaBlue', 0xb8d4e8); addCol('fantasyCobble', 0xccbfd9); addCol('advDirt', 0x9c7f5a);
    addCol('tomSilver', 0xbac9d8); addCol('tomCyan', 0x38bdf8); addCol('railGravel', 0x847f74);
    addCol('waterDeep', 0x1a6a8a); addCol('bark', 0x5b3f28); addCol('leaf', 0x3a8c3c);
    addCol('palm', 0x2d8a4e); addCol('flowerPink', 0xf472b6); addCol('flowerGold', 0xfbbf24);
    addCol('stoneL', 0xe2dac8);

    const inb = (x, y, z) => x >= 0 && x < W && z >= 0 && z < D && y >= 0 && y < H;
    const zi = (x, z) => x + z * W;
    const idx = (x, y, z) => x + W * (z + D * y);
    const set = (x, y, z, b, c) => { if (inb(x, y, z)) { const k = idx(x, y, z); blocks[k] = b; cols[k] = c || 0; } };
    const get = (x, y, z) => inb(x, y, z) ? blocks[idx(x, y, z)] : 0;

    /* ================= 1. 2x EXPANDED ORLANDO WALT DISNEY WORLD RESORT ISLAND (544x544!) ================= */
    for (let z = 0; z < D; z++) {
      for (let x = 0; x < W; x++) {
        const rMK = Math.hypot((x - 192) / 172, (z - 192) / 174);
        const rORL = Math.hypot((x - 272) / 252, (z - 272) / 252);
        const r = Math.min(rMK, rORL);
        const edge = 0.96 + (vnoise(x * 0.025, z * 0.025, 7) - 0.5) * 0.07;
        if (r > edge) {
          const sy = Math.max(26, Math.floor(33 - (r - edge) * 28));
          for (let y = 24; y <= sy; y++) set(x, y, z, B.SAND, C.sand);
          hm[zi(x, z)] = sy;
          continue;
        }
        let gy = PARK_Y;
        if (r > 0.88) {
          const t = (r - 0.88) / Math.max(0.01, edge - 0.88);
          gy = Math.floor(PARK_Y - t * t * 6.5);
        }
        // Adventureland Waterfall Cliff (x = 70..96, z = 148..172)
        const wfDist = Math.hypot((x - 80) / 16, (z - 158) / 14);
        if (wfDist < 1.0) {
          gy = Math.max(gy, Math.floor(PARK_Y + (1 - wfDist) * 14));
        }

        const isAdv = (x < 148 && z > 144 && z < 252) || (x < 305 && z > 370);
        const isFan = x >= 136 && x <= 248 && z < 154 && z > 66;
        const topBlock = gy <= WATER_Y + 1 ? B.SAND : (wfDist < 0.92 ? B.ROCK : B.GRASS);
        const topCol = gy <= WATER_Y + 1 ? C.sand : (wfDist < 0.92 ? C.rock : isAdv ? C.jungle : isFan ? C.grassL : C.grass);

        for (let y = 26; y < gy - 1; y++) set(x, y, z, B.DIRT, C.dirt);
        set(x, gy - 1, z, topBlock, topCol);
        hm[zi(x, z)] = gy;
      }
    }

    /* ================= 2. CARVE CASTLE MOAT & JUNGLE CRUISE RIVER LOOP ================= */
    const carveWater = (x, z) => {
      if (!inb(x, PARK_Y, z)) return;
      for (let y = 34; y <= PARK_Y + 2; y++) set(x, y, z, B.AIR, 0);
      set(x, 33, z, B.SAND, C.waterDeep);
      hm[zi(x, z)] = 34;
      occ[zi(x, z)] = 2;
    };

    // Castle Moat ring around Central Castle (x=192, z=176, r=19..25, leaving front & rear bridges dry!)
    for (let z = 148; z <= 204; z++) {
      for (let x = 164; x <= 220; x++) {
        const d = Math.hypot(x - 192, z - 176);
        const onBridge = Math.abs(x - 192) <= 4 && (z > 186 || z < 164);
        if (d >= 18.5 && d <= 25.0 && !onBridge) carveWater(x, z);
      }
    }

    // Adventureland Jungle Cruise River Loop (oval river channel centered at x=100, z=200, rx=28, rz=26, width 9m!)
    for (let z = 162; z <= 238; z++) {
      for (let x = 62; x <= 138; x++) {
        const e = Math.hypot((x - 100) / 26, (z - 200) / 24);
        const onDockBridge = x >= 121 && x <= 134 && Math.abs(z - 204) <= 3;
        if (e >= 0.72 && e <= 1.12 && !onDockBridge) carveWater(x, z);
      }
    }

    // Rivers of America Basin (Frontierland / New Orleans Square: x=126..148, z=114..152)
    for (let z = 110; z <= 154; z++) {
      for (let x = 122; x <= 150; x++) {
        const d = Math.hypot((x - 135) / 13, (z - 132) / 21);
        if (d <= 1.0) carveWater(x, z);
      }
    }

    // Finding Nemo Submarine Lagoon at the Eastern Foot of the Matterhorn (x=274, z=146, rx=16, rz=12)
    for (let z = 132; z <= 160; z++) {
      for (let x = 256; x <= 292; x++) {
        const d = Math.hypot((x - 274) / 16, (z - 146) / 12);
        if (d <= 1.0) carveWater(x, z);
      }
    }

    // "it's a small world" Outdoor Reflection Canal + Full Indoor Dark-Ride Canal Loop (x=172..213, z=40..90)
    for (let z = 40; z <= 90; z++) {
      for (let x = 172; x <= 213; x++) {
        const isFrontEntry = z >= 72 && Math.abs(x - 192.5) <= 4.5;
        const isOuterCanal = z >= 84 && z <= 90 && Math.abs(x - 192.5) > 4.5;
        const isIndoorWater = z >= 40 && z <= 73 && x >= 172 && x <= 213;
        if (isFrontEntry || isOuterCanal || isIndoorWater) carveWater(x, z);
      }
    }

    // ORLANDO PARK 2: EPCOT World Showcase Lagoon (x=408..468, z=118..164)
    for (let z = 118; z <= 164; z++) for (let x = 408; x <= 468; x++) {
      if (Math.hypot((x - 438) / 28, (z - 141) / 21) <= 1.0) carveWater(x, z);
    }
    // ORLANDO PARK 3: Hollywood Studios Echo Lake (x=376..406, z=430..454)
    for (let z = 430; z <= 454; z++) for (let x = 376; x <= 406; x++) {
      if (Math.hypot((x - 391) / 14, (z - 442) / 11) <= 1.0) carveWater(x, z);
    }
    // ORLANDO PARK 4: Animal Kingdom Pandora Bioluminescent River (x=86..136, z=458..474)
    for (let z = 456; z <= 474; z++) for (let x = 86; x <= 142; x++) {
      if (Math.hypot((x - 114) / 26, (z - 465) / 8) <= 1.0) carveWater(x, z);
    }

    /* ================= 3. HUB-AND-SPOKE BOULEVARDS, PLAZAS & PERIMETER RAILROAD ================= */
    const pave = (x, z, b, c) => {
      if (!inb(x, PARK_Y, z) || occ[zi(x, z)] === 2) return;
      set(x, PARK_Y - 1, z, b, c);
      hm[zi(x, z)] = PARK_Y;
      occ[zi(x, z)] = 1;
    };

    // Main Gate & Entrance Plaza (x=166..218, z=304..352)
    for (let z = 302; z <= 352; z++) for (let x = 168; x <= 216; x++) {
      const ch = ((x + z) % 2 === 0);
      pave(x, z, B.FLAGS, ch ? C.plazaCream : C.plazaPink);
    }
    // Main Street, U.S.A. Boulevard (x=180..204, z=226..302) — red-brick sidewalks + cream cobblestone roadway!
    for (let z = 224; z <= 302; z++) for (let x = 168; x <= 216; x++) {
      const road = Math.abs(x - 192) <= 7;
      pave(x, z, road ? B.PATH : B.BRICK, road ? C.plazaCream : C.brickMain);
    }
    // Central Hub Circular Plaza (x=192, z=216, r=24)
    for (let z = 190; z <= 242; z++) for (let x = 166; x <= 218; x++) {
      const r = Math.hypot(x - 192, z - 216);
      if (r <= 23.5) pave(x, z, B.FLAGS, r < 8 ? C.plazaPink : C.plazaCream);
    }
    // Castle Island Courtyard & Drawbridge Causeways
    for (let z = 152; z <= 202; z++) for (let x = 172; x <= 212; x++) {
      if (Math.hypot(x - 192, z - 176) <= 18.5 || Math.abs(x - 192) <= 4) {
        pave(x, z, B.MARBLE, ((x + z) % 2 === 0) ? C.plazaCream : C.stoneL);
      }
    }
    // Fantasyland Storybook Courtyard & "it's a small world" Esplanade (x=144..242, z=70..152)
    for (let z = 70; z <= 152; z++) for (let x = 144; x <= 242; x++) {
      const d = Math.hypot((x - 192) / 48, (z - 114) / 42);
      if (d <= 1.0) pave(x, z, B.FLAGS, ((x + z) % 2 === 0) ? C.fantasyCobble : C.plazaCream);
    }
    // Star Wars: Galaxy's Edge — Batuu Black Spire Spaceport Courtyard (x=80..152, z=58..104) + Access Walkway!
    for (let z = 58; z <= 106; z++) for (let x = 80; x <= 154; x++) {
      const d = Math.hypot((x - 116) / 36, (z - 80) / 24);
      if (d <= 1.0) pave(x, z, B.FLAGS, ((x + z) % 3 === 0) ? C.advDirt : C.railGravel);
    }
    // Frontierland & New Orleans Square Promenade (x=96..168, z=142..172)
    for (let z = 142; z <= 172; z++) for (let x = 96; x <= 168; x++) {
      pave(x, z, B.PATH, ((x + z) % 3 === 0) ? C.advDirt : C.plazaCream);
    }
    // West Spoke to Adventureland & Adventureland Plaza (x=122..172, z=196..214)
    for (let z = 194; z <= 216; z++) for (let x = 122; x <= 174; x++) {
      pave(x, z, B.PATH, C.advDirt);
    }
    // East Spoke to Tomorrowland & Tomorrowland Neon Plaza (x=214..312, z=160..238)
    for (let z = 160; z <= 238; z++) for (let x = 214; x <= 312; x++) {
      const inHub = Math.abs(z - 202) <= 10 || Math.hypot((x - 274) / 38, (z - 200) / 36) <= 1.0;
      if (inHub) {
        const neonLine = (Math.abs(z - 202) === 5 || Math.abs(x - 266) === 12);
        pave(x, z, B.LIMES, neonLine ? C.tomCyan : C.tomSilver);
      }
    }

    // Perimeter Imagineering Steam Railroad Gravel Bed around Magic Kingdom (r = 144..150 around 192,192!)
    for (let z = 32; z < 354; z++) for (let x = 32; x < 354; x++) {
      const r = Math.hypot((x - 192) / 148, (z - 192) / 146);
      if (r >= 0.97 && r <= 1.02 && hm[zi(x, z)] >= PARK_Y - 1) {
        pave(x, z, B.GRAVEL, C.railGravel);
      }
    }

    // ---- ORLANDO RESORT EXPANSION BOULEVARDS & 3 NEW THEME PARK PLAZAS! ----
    // Connector Boulevard: Tomorrowland -> EPCOT (x=310..438, z=196..210)
    for (let z = 196; z <= 210; z++) for (let x = 310; x <= 438; x++) pave(x, z, B.LIMES, C.tomSilver);
    // EPCOT Future World Plaza & World Showcase Promenade (x=384..496, z=104..264)
    for (let z = 104; z <= 264; z++) for (let x = 384; x <= 496; x++) {
      const inPlaza = Math.hypot((x - 438) / 54, (z - 208) / 48) <= 1.0 || Math.hypot((x - 438) / 40, (z - 141) / 32) <= 1.0;
      if (inPlaza) pave(x, z, B.FLAGS, ((x + z) % 2 === 0) ? C.tomSilver : C.plazaBlue);
    }
    // Connector Boulevard: EPCOT -> Hollywood Studios (x=420..436, z=256..380)
    for (let z = 256; z <= 380; z++) for (let x = 420; x <= 436; x++) pave(x, z, B.PATH, C.plazaCream);
    // Hollywood Studios Sunset Blvd & Courtyard Plaza (x=358..486, z=348..466)
    for (let z = 348; z <= 466; z++) for (let x = 358; x <= 486; x++) {
      if (Math.hypot((x - 424) / 62, (z - 408) / 56) <= 1.0) pave(x, z, B.FLAGS, ((x + z) % 3 === 0) ? C.plazaPink : C.plazaCream);
    }
    // Connector Boulevard: Main Gate -> Animal Kingdom (x=184..200, z=352..424) & Hollywood -> Animal Kingdom (x=240..380, z=432..446)
    for (let z = 352; z <= 424; z++) for (let x = 184; x <= 200; x++) pave(x, z, B.PATH, C.advDirt);
    for (let z = 432; z <= 446; z++) for (let x = 240; x <= 380; x++) pave(x, z, B.PATH, C.advDirt);
    // Animal Kingdom Discovery Island, Pandora & Everest Promenade (x=76..296, z=400..492)
    for (let z = 400; z <= 492; z++) for (let x = 76; x <= 296; x++) {
      if (Math.hypot((x - 186) / 106, (z - 446) / 42) <= 1.0) pave(x, z, B.PATH, C.advDirt);
    }

    /* ================= 4. PARK VEGETATION — ALL BLOCKY VOXEL TREES REMOVED! =================
     * Replaced 100% by sculpted 3D multi-layered architectural trees, curved tropical palms,
     * cherry blossoms, alpine Matterhorn pines & river boulders in landmarks.js! */

    // Compute topH & topC for crisp Minimap!
    for (let z = 0; z < D; z++) {
      for (let x = 0; x < W; x++) {
        let ty = 0, tc = 0;
        for (let y = H - 1; y >= 0; y--) {
          const b = blocks[idx(x, y, z)];
          if (b !== 0) { ty = y; tc = cols[idx(x, y, z)]; break; }
        }
        topH[zi(x, z)] = ty;
        topC[zi(x, z)] = tc;
      }
    }

    // Warm Magical Park Illumination Points
    const lamps = [
      [192.5, PARK_Y + 6, 320, false, 1.3],
      [192.5, PARK_Y + 6, 268, false, 1.3],
      [192.5, PARK_Y + 8, 216, false, 1.5],
      [192.5, PARK_Y + 7, 176, true, 1.8],
      [192.5, PARK_Y + 7, 122, false, 1.5],
      [126.0, PARK_Y + 6, 204, false, 1.4],
      [266.0, PARK_Y + 7, 194, false, 1.6],
      [282.0, PARK_Y + 6, 226, false, 1.4]
    ];

    const tour = {
      dur: 68,
      cam: [
        [192, 62, 344], [192, 56, 265], [148, 58, 212], [100, 56, 178],
        [152, 60, 118], [192, 62, 92], [248, 60, 138], [286, 58, 212], [238, 60, 272]
      ],
      tgt: [
        [192, 46, 210], [192, 52, 176], [192, 48, 176], [100, 42, 202],
        [192, 46, 122], [192, 50, 176], [266, 48, 194], [266, 46, 194], [192, 48, 216]
      ]
    };

    const props = {
      parkY: PARK_Y,
      lands: LANDS,
      castleCenter: { x: 192.5, y: PARK_Y, z: 176.5 },
      carouselCenter: { x: 192.5, y: PARK_Y, z: 122.5 },
      riverDock: { x: 126.5, y: PARK_Y, z: 204.5 },
      starjetCenter: { x: 266.5, y: PARK_Y, z: 194.5 }
    };

    return {
      W, D, H, WATER_Y, PARK_Y, B, BI, T,
      blocks, cols, hm, occ, topH, topC, palette,
      LANDS, lamps, tour, props
    };
  }

  const api = { W, D, H, WATER_Y, PARK_Y, B, BI, T, LANDS, create, hash3, mulberry32 };
  root.TPWorld = api;
  root.PIWorld = api; // Compatibility alias for shared textures.js & mesher.js!
})(window);
