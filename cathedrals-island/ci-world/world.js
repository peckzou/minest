/* Cathedrals' Island (世界圣殿教堂小岛) — Top 20 Iconic Cathedrals & Modern Churches (15 Catholic + 5 Modern).
 * 384 x 384 x 84 Voxel + High-Craft Architectural Island.
 * Exposes CIWorld = { W, D, H, WATER_Y, B, BI, T, CATHEDRALS, WAYPOSTS, create, hash3, mulberry32 }. */
(function (root) {
  'use strict';

  const W = 384, D = 384, H = 84, WATER_Y = 36.4;

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
  def(B.GRASS, 'grass', T.grass, T.grassS, T.dirt, false, 0.08);
  def(B.MEADOW, 'meadow', T.meadow, T.grassS, T.dirt, false, 0.1);
  def(B.DIRT, 'earth', T.dirt, T.dirt, T.dirt, false, 0.06);
  def(B.ROCK, 'cliff stone', T.rock, T.rock, T.rock, false, 0.06);
  def(B.SAND, 'sand', T.sand, T.sand, T.sand, false, 0.05);
  def(B.SNOW, 'snow', T.limeSmooth, T.limeSmooth, T.rock, false, 0.04);
  def(B.PATH, 'cobbles', T.path, T.rock, T.rock, false, 0.05);
  def(B.GRAVEL, 'gravel', T.gravel, T.gravel, T.gravel, false, 0.09);
  def(B.PINE, 'pine', T.pine, T.pine, T.pine, false, 0.14);
  def(B.BEECH, 'leaves', T.beech, T.beech, T.beech, false, 0.15);
  def(B.BARK, 'trunk', T.trunkTop, T.bark, T.trunkTop, false, 0.08);
  def(B.BROOK, 'water', T.brook, T.brook, T.brook, false, 0.06);
  def(B.LIME, 'ashlar', T.ashlar, T.ashlar, T.ashlar, false, 0.03);
  def(B.LIMES, 'smooth stone', T.limeSmooth, T.limeSmooth, T.limeSmooth, false, 0.025);
  def(B.LIMEC, 'fluted column', T.limeSmooth, T.limeCarved, T.limeSmooth, false, 0.025);
  def(B.BRICK, 'brick', T.brick, T.brick, T.brick, false, 0.04);
  def(B.SLATE, 'slate', T.slate, T.slate, T.beams, false, 0.04);
  def(B.GLASS, 'window', T.glass, T.glass, T.glass, true, 0);
  def(B.DOOR, 'door', T.door, T.door, T.door, false, 0.02);
  def(B.GOLD, 'gold / brass', T.gold, T.gold, T.gold, false, 0.04);
  def(B.MARBLE, 'marble', T.marble, T.marble, T.marble, false, 0.025);
  def(B.OAK, 'oak', T.oak, T.oak, T.oak, false, 0.04);
  def(B.OAKC, 'carved oak', T.oakCarved, T.oakCarved, T.oakCarved, false, 0.04);
  def(B.PARQ, 'checker floor', T.parquet, T.oak, T.oak, false, 0.02);
  def(B.PLASTER, 'plaster', T.plaster, T.plaster, T.plaster, false, 0.02);
  def(B.COFFER, 'coffer ceiling', T.coffer, T.oak, T.coffer, false, 0.02);
  def(B.CARPET, 'carpet', T.carpet, T.oak, T.oak, false, 0.02);
  def(B.LAMP, 'lantern', T.lamp, T.lamp, T.lamp, true, 0);
  def(B.BENCH, 'pew', T.oak, T.oakCarved, T.oak, false, 0.03);
  def(B.IRON, 'iron', T.iron, T.iron, T.iron, false, 0.04);
  def(B.BALUS, 'balustrade', T.oak, T.balus, T.oak, false, 0.02);
  def(B.FIRE, 'candle flame', T.fire, T.fire, T.fire, false, 0, true);
  def(B.FLOWER, 'flowers', T.flower, T.flower, T.flower, false, 0.1);
  def(B.PLANKS, 'planks', T.planks, T.planks, T.planks, false, 0.05);
  def(B.BATH, 'honey stone', T.bath, T.bath, T.bath, false, 0.035);
  def(B.LEAD, 'lead roof', T.lead, T.lead, T.lead, false, 0.04);
  def(B.ROOF, 'tile roof', T.slates, T.slates, T.beams, false, 0.05);
  def(B.DRYW, 'dry wall', T.coping, T.drystone, T.drystone, false, 0.06);
  def(B.FLAGS, 'flagstones', T.flagstone, T.rubble, T.rubble, false, 0.03);
  def(B.PORTAL, 'stained portal', T.stained, T.stained, T.stained, false, 0, true);
  def(B.YEW, 'cypress', T.yew, T.yew, T.yew, false, 0.14);
  def(B.WILLOW, 'olive / willow', T.willow, T.willow, T.willow, false, 0.14);

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
  function fbm(x, z, s, oct) {
    let v = 0, a = 0.5, f = 1, n = 0;
    for (let i = 0; i < (oct || 4); i++) { v += vnoise(x * f, z * f, s + i * 17) * a; n += a; a *= 0.5; f *= 2; }
    return v / n;
  }
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

  // ==========================================================================
  // TOP 20 WORLD CATHEDRALS (15 CATHOLIC BASILICAS + 5 MODERN/CONTEMPORARY)
  // ==========================================================================
  const CATHEDRALS = [
    // --- DISTRICT 1: VATICAN & ITALIAN RENAISSANCE / BAROQUE (4 Catholic) ---
    {
      num: 1, id: 'st_peters', category: 'catholic', name: '圣彼得大教堂', en: "St. Peter's Basilica",
      city: '梵蒂冈 · Vatican City', era: '1506–1626', style: '文艺复兴盛期 / 巴洛克',
      height: '136.6 m', architect: '米开朗基罗 · 贝尔尼尼', archEn: 'Michelangelo & Bernini',
      district: '第一区 · 梵蒂冈与意大利圣殿区', x: 192, z: 196, w: 30, d: 34, targetH: 42,
      robe: 0x7c1d1d, hair: 0xd4d0c8, organFreq: [130.81, 164.81, 196.0, 261.63],
      quote: '我要把万神殿的穹顶高高悬起在苍穹之上，让贝尔尼尼的柱廊如双臂拥抱世界。',
      highlights: ['米开朗基罗双层十六肋巨型穹顶与采光灯笼塔', '贝尔尼尼半圆双翼柱廊与中央圣彼得方尖碑', '室内 29 米螺旋青铜华盖 (Baldacchino) 与穹顶圣光'],
      history: '基督教世界规模最宏伟的宗座圣殿，建于圣彼得墓冢之上。布拉曼特奠定希腊十字蓝图，米开朗基罗设计举世闻名的双壳肋拱大穹顶，贝尔尼尼以椭圆广场柱廊赋予其宇宙般的环抱张力。'
    },
    {
      num: 2, id: 'florence_duomo', category: 'catholic', name: '圣母百花大教堂', en: 'Santa Maria del Fiore (Florence Duomo)',
      city: '意大利佛罗伦萨 · Florence', era: '1296–1436', style: '意大利哥特 / 文艺复兴开端',
      height: '114.5 m', architect: '菲利波·布鲁内莱斯基', archEn: 'Filippo Brunelleschi',
      district: '第一区 · 梵蒂冈与意大利圣殿区', x: 132, z: 146, w: 22, d: 28, targetH: 42,
      robe: 0x8b2635, hair: 0x6b5848, organFreq: [146.83, 185.0, 220.0, 293.66],
      quote: '无需一根脚手架，以人字形砌砖与双层八角穹壳，让人类理性托起整片托斯卡纳天空。',
      highlights: ['世界最大砖砌八角赤陶红瓦大穹顶（8条纯白大理石肋）', '白/墨绿/粉红三色托斯卡纳大理石几何贴面', '毗邻纤细高耸的乔托大理石方塔钟楼'],
      history: '文艺复兴建筑诞生的里程碑。布鲁内莱斯基发明自支撑鱼骨砖砌法与双壳结构，在不使用传统木拱架的奇迹下封顶跨度 45.5 米的八角穹顶，开启了现代工程学纪元。'
    },
    {
      num: 3, id: 'milan_duomo', category: 'catholic', name: '米兰大教堂', en: 'Duomo di Milano',
      city: '意大利米兰 · Milan', era: '1386–1965', style: '火焰哥特式 (Flamboyant Gothic)',
      height: '108.5 m', architect: '西蒙尼·达·奥尔塞尼戈等', archEn: 'Master Masons of Milan',
      district: '第一区 · 梵蒂冈与意大利圣殿区', x: 84, z: 106, w: 24, d: 28, targetH: 45,
      robe: 0x3b3345, hair: 0xc8c8c8, organFreq: [138.59, 174.61, 207.65, 277.18],
      quote: '六百载光阴雕琢坎多利亚纯白大理石，化作一百三十五座直指云霄的尖塔森林。',
      highlights: ['全白坎多利亚大理石火焰哥特三角立面', '屋顶密集林立的 135 座镂空尖塔与圣像', '中央最高尖塔顶端的镀金圣母玛利亚像 (Madonnina)'],
      history: '意大利最大、世界最繁复华丽的哥特式天主教堂，历时近六个世纪竣工。整座建筑宛如凝固的白色大理石火焰，共有 3400 余尊雕像与 135 座哥特尖塔。'
    },
    {
      num: 4, id: 'st_marks', category: 'catholic', name: '圣马可大教堂', en: "St. Mark's Basilica",
      city: '意大利威尼斯 · Venice', era: '1063–1094', style: '威尼斯拜占庭式',
      height: '43 m', architect: '威尼斯拜占庭匠师团', archEn: 'Venetian-Byzantine Guild',
      district: '第一区 · 梵蒂冈与意大利圣殿区', x: 140, z: 248, w: 22, d: 22, targetH: 40,
      robe: 0x9a6b24, hair: 0x4a3a2a, organFreq: [164.81, 196.0, 246.94, 329.63],
      quote: '以八千平方米真金马赛克辉映亚得里亚海的波光，融东方穹顶与西方圣殿于一体。',
      highlights: ['希腊十字布局的五座青铜铅灰洋葱拜占庭穹顶', '五连镀金马赛克半圆拱门廊与火焰山形冠饰', '正门阳台四匹镀金青铜圣马雕塑'],
      history: '威尼斯共和国的“黄金教堂”，将君士坦丁堡拜占庭穹顶美学、伊斯兰尖券轮廓与哥特尖饰融为一体，内部覆盖逾 8000 平方米闪耀金箔的圣经马赛克。'
    },

    // --- DISTRICT 2: FRENCH & NORTHERN EUROPEAN HIGH GOTHIC (5 Catholic) ---
    {
      num: 5, id: 'notre_dame', category: 'catholic', name: '巴黎圣母院', en: 'Notre-Dame de Paris',
      city: '法国巴黎 · Paris', era: '1163–1345', style: '法国早期/盛期哥特式',
      height: '96 m (尖塔)', architect: '莫里斯·德·叙利 / 勒·杜克', archEn: 'Maurice de Sully',
      district: '第二区 · 法国与莱茵哥特圣殿高地', x: 82, z: 184, w: 22, d: 28, targetH: 42,
      robe: 0x1e3a5f, hair: 0x5c4632, organFreq: [130.81, 155.56, 196.0, 261.63],
      quote: '石头的交响诗：双平顶钟楼、巨型玫瑰花窗与如翼舒展的飞扶壁，在塞纳河畔守望八百年。',
      highlights: ['经典对称双平顶哥特钟楼与三连深凹尖券门廊', '直径近 13 米的巨型彩绘玻璃玫瑰花窗', '两侧凌空跨跃的哥特飞扶壁与中殿纤细尖塔 (Flèche)'],
      history: '法国哥特建筑最具代表性的杰作，首次大规模应用外露飞扶壁支撑高耸石拱顶，使厚重石墙得以化为通透的彩色玻璃圣诗。'
    },
    {
      num: 6, id: 'cologne_cathedral', category: 'catholic', name: '科隆大教堂', en: 'Cologne Cathedral (Kölner Dom)',
      city: '德国科隆 · Cologne', era: '1248–1880', style: '德国盛期哥特式',
      height: '157.4 m', architect: '格哈德大师', archEn: 'Master Gerhard',
      district: '第二区 · 法国与莱茵哥特圣殿高地', x: 54, z: 146, w: 22, d: 28, targetH: 43,
      robe: 0x262930, hair: 0xb8b2a8, organFreq: [110.0, 130.81, 164.81, 220.0],
      quote: '两座 157 米深灰镂空石塔如利剑刺破莱茵河雾霭，展现哥特建筑对垂直极限的终极礼赞。',
      highlights: ['世界最高双塔教堂之一（双联 157 米镂空八角尖塔）', '深灰粗面岩高耸尖券立面与多层密集飞扶壁', '供奉东方三博士镀金圣骨匣的高坛'],
      history: '德国哥特式建筑登峰造极之作，为供奉东方三博士圣髑而建，跨度六百余年严格依中世纪羊皮纸蓝图竣工，以极致垂直比例震撼世人。'
    },
    {
      num: 7, id: 'chartres', category: 'catholic', name: '沙特尔大教堂', en: 'Chartres Cathedral',
      city: '法国沙特尔 · Chartres', era: '1194–1220', style: '法国盛期哥特典范',
      height: '113 m (北塔)', architect: '盛期哥特无名大师', archEn: 'Master of Chartres',
      district: '第二区 · 法国与莱茵哥特圣殿高地', x: 126, z: 82, w: 22, d: 26, targetH: 46,
      robe: 0x1d4ed8, hair: 0xd0ccc2, organFreq: [146.83, 174.61, 220.0, 293.66],
      quote: '一南一北两座跨越三个世纪的不对称尖塔，守护着世上最深邃的“沙特尔蓝”彩玻圣光。',
      highlights: ['标志性不对称双尖塔（南罗曼石锥塔 + 北火焰哥特镂空高塔）', '176 扇保存完好的中世纪“沙特尔蓝”钴蓝彩绘玻璃', '中殿地面著名的十二圈朝圣石质迷宫'],
      history: '法国盛期哥特建筑保存最完整的巅峰之作，其钴蓝色彩绘玻璃在日光下流淌出如宝石般幽深的蓝紫色光海。'
    },
    {
      num: 8, id: 'sainte_chapelle', category: 'catholic', name: '巴黎圣礼拜堂', en: 'Sainte-Chapelle',
      city: '法国巴黎 · Paris', era: '1242–1248', style: '辐射式哥特 (Rayonnant Gothic)',
      height: '75 m (尖塔)', architect: '皮埃尔·德·蒙特勒伊', archEn: 'Pierre de Montreuil',
      district: '第二区 · 法国与莱茵哥特圣殿高地', x: 184, z: 120, w: 16, d: 24, targetH: 43,
      robe: 0x312e81, hair: 0xc2b8a3, organFreq: [196.0, 246.94, 293.66, 392.0],
      quote: '石墙几乎完全消失，只余十五米通天宝石花窗与璀璨金百合星空，将圣殿化作发光的珠宝匣。',
      highlights: ['十五米高通天紫红钴蓝彩绘玻璃幕墙（占比逾 70%）', '深蓝金星百合花纹肋拱天顶', '纤细华丽的镀金青铜屋脊尖塔'],
      history: '法王路易九世为珍藏基督荆棘冠而建的皇家礼拜堂，是辐射式哥特建筑将石墙消解为纯粹彩色光幕的极致奇迹。'
    },
    {
      num: 9, id: 'reims', category: 'catholic', name: '兰斯大教堂', en: 'Reims Cathedral (Notre-Dame de Reims)',
      city: '法国兰斯 · Reims', era: '1211–1275', style: '法国古典盛期哥特',
      height: '81.5 m', architect: '让·多尔拜', archEn: "Jean d'Orbais",
      district: '第二区 · 法国与莱茵哥特圣殿高地', x: 74, z: 254, w: 22, d: 26, targetH: 41,
      robe: 0x6b21a8, hair: 0xb8a892, organFreq: [130.81, 164.81, 196.0, 246.94],
      quote: '历代法兰西国王在此加冕，三座镂空玫瑰尖楣与“微笑天使”雕刻令坚硬石灰岩绽放温柔。',
      highlights: ['三座深凹尖顶三角门楣内置透明花窗（取代传统石雕门楣）', '双塔镂空哥特拱廊与宏伟诸王长廊', '2300 余尊雕塑群与著名的“兰斯微笑天使”'],
      history: '法国君主加冕圣殿（圣女贞德曾护送查理七世在此加冕），以通透华丽的三重尖顶门廊与雕塑艺术著称于世。'
    },

    // --- DISTRICT 3: IBERIA, CENTRAL EUROPE & AMERICAS CATHOLIC WONDERS (6 Catholic) ---
    {
      num: 10, id: 'sagrada_familia', category: 'catholic', name: '圣家族大教堂', en: 'Basílica de la Sagrada Família',
      city: '西班牙巴塞罗那 · Barcelona', era: '1882–建造中', style: '加泰罗尼亚现代主义 / 有机哥特',
      height: '172.5 m (规划)', architect: '安东尼·高迪', archEn: 'Antoni Gaudí',
      district: '第三区 · 伊比利亚、中欧与美洲圣殿区', x: 294, z: 176, w: 26, d: 28, targetH: 42,
      robe: 0x92400e, hair: 0xe5e0d8, organFreq: [130.81, 164.81, 196.0, 293.66],
      quote: '直线属于人类，曲线属于上帝；我的教堂没有冰冷的墙，只有向天空伸展分叉的石树森林。',
      highlights: ['标志性玉米穗镂空双曲面高塔群与金色十字主塔', '诞生立面自然主义钟乳石雕饰与彩色马赛克尖顶', '室内分叉树冠巨柱森林与七色彩玻光瀑'],
      history: '建筑天才安东尼·高迪毕生心血，彻底摒弃僵硬直线，以自然界悬链线、双曲面与树干分叉力学重构天主教大教堂，成为人类最具想象力的圣殿。'
    },
    {
      num: 11, id: 'seville', category: 'catholic', name: '塞维利亚大教堂', en: 'Seville Cathedral & La Giralda',
      city: '西班牙塞维利亚 · Seville', era: '1401–1506', style: '西班牙哥特 / 摩尔穆德哈尔',
      height: '104.1 m (希拉尔达塔)', architect: '阿隆索·马丁内斯等', archEn: 'Alonso Martínez',
      district: '第三区 · 伊比利亚、中欧与美洲圣殿区', x: 252, z: 132, w: 22, d: 24, targetH: 42,
      robe: 0xb45309, hair: 0x3b2f26, organFreq: [146.83, 174.61, 220.0, 261.63],
      quote: '让我们建一座宏伟得令后人以为我们疯了的教堂——并在摩尔宣礼塔巅冠以文艺复兴铜钟。',
      highlights: ['世界占地面积最大的哥特式天主教堂', '标志性赤陶红砖摩尔式希拉尔达钟楼 (La Giralda)', '安葬航海家哥伦布的巨型抬棺青铜雕塑与橘树庭院'],
      history: '建于昔日大清真寺遗址之上，巧妙保留了绝美的摩尔式希拉尔达砖塔与橘树庭院，融汇安达卢西亚伊斯兰纹样与宏大哥特五廊殿堂。'
    },
    {
      num: 12, id: 'st_stephens', category: 'catholic', name: '维也纳圣斯蒂芬大教堂', en: "St. Stephen's Cathedral (Stephansdom)",
      city: '奥地利维也纳 · Vienna', era: '1137–1511', style: '奥地利哥特式',
      height: '136.4 m (南塔)', architect: '安东·皮尔格拉姆等', archEn: 'Anton Pilgram',
      district: '第三区 · 伊比利亚、中欧与美洲圣殿区', x: 294, z: 92, w: 22, d: 26, targetH: 44,
      robe: 0x15803d, hair: 0x6b5b4a, organFreq: [164.81, 207.65, 246.94, 329.63],
      quote: '二十三万片彩釉琉璃瓦织就陡峭菱形锦缎屋顶，单侧 136 米南塔是维也纳永恒的坐标。',
      highlights: ['23 万片绿金白红彩釉瓦拼砌的巨型陡坡菱形马赛克屋顶', '单侧直插云霄的 136 米镂空哥特南塔 (Steffl)', '莫扎特婚礼与哈布斯堡帝国的历史见证'],
      history: '维也纳城市之心与奥地利最崇高的哥特大教堂，以令人过目不忘的巨型彩色菱格琉璃瓦陡坡屋顶和独树一帜的高耸南塔闻名天下。'
    },
    {
      num: 13, id: 'santiago', category: 'catholic', name: '圣地亚哥大教堂', en: 'Cathedral of Santiago de Compostela',
      city: '西班牙加利西亚 · Santiago', era: '1075–1750', style: '罗曼式内核 / 丘里格拉巴洛克立面',
      height: '76 m', architect: '费尔南多·德·卡萨斯', archEn: 'Fernando de Casas Novoa',
      district: '第三区 · 伊比利亚、中欧与美洲圣殿区', x: 326, z: 224, w: 22, d: 24, targetH: 41,
      robe: 0x78350f, hair: 0xcbc4b8, organFreq: [130.81, 164.81, 196.0, 261.63],
      quote: '跋涉千里圣雅各朝圣之路的终点，奥布拉多伊罗金色双塔在暮色中迎接每一位行者。',
      highlights: ['暖金花岗岩华丽繁复的奥布拉多伊罗双塔巴洛克立面', '通向正门的双翼宏伟石阶与圣雅各扇贝徽记', '著名的悬吊巨型银质大香炉 (Botafumeiro)'],
      history: '欧洲最著名的“圣雅各朝圣之路”终点，将庄严的罗曼式主殿包裹在举世无双的西班牙巴洛克雕花双塔立面之中。'
    },
    {
      num: 14, id: 'mexico_cathedral', category: 'catholic', name: '墨西哥城大都会大教堂', en: 'Mexico City Metropolitan Cathedral',
      city: '墨西哥城 · Mexico City', era: '1573–1813', style: '拉美巴洛克 / 新古典主义',
      height: '67 m', architect: '曼努埃尔·托尔萨等', archEn: 'Manuel Tolsá',
      district: '第三区 · 伊比利亚、中欧与美洲圣殿区', x: 250, z: 238, w: 22, d: 24, targetH: 41,
      robe: 0x991b1b, hair: 0x3a2e25, organFreq: [146.83, 185.0, 220.0, 293.66],
      quote: '屹立于古老阿兹特克特诺奇蒂特兰神庙之畔，双联钟形穹顶见证美洲大陆的信仰交融。',
      highlights: ['标志性双联“巨钟形”顶部石砌钟楼', '暖灰火山岩与白石雕饰的新古典中央三角山花', '拉美最宏伟的镀金诸王祭坛 (Altar of the Kings)'],
      history: '美洲最宏伟壮丽的天主教大教堂，历经两百四十载融汇文艺复兴、丘里格拉巴洛克与新古典主义三代风格，矗立于宪法广场北端。'
    },
    {
      num: 15, id: 'las_lajas', category: 'catholic', name: '拉斯拉哈斯大教堂', en: 'Las Lajas Sanctuary',
      city: '哥伦比亚伊皮亚莱斯 · Colombia', era: '1916–1949', style: '安第斯峡谷新哥特式',
      height: '100 m (自谷底)', architect: '卢西亚诺·埃斯皮诺萨', archEn: 'Luciano Espinosa',
      district: '第三区 · 伊比利亚、中欧与美洲圣殿区', x: 328, z: 128, w: 20, d: 24, targetH: 45,
      robe: 0x334155, hair: 0xd4d4d8, organFreq: [174.61, 220.0, 261.63, 349.23],
      quote: '跨跃百米深谷的石拱桥直通云端尖塔，宛如安第斯山涧悬崖上凭空绽放的白色童话圣殿。',
      highlights: ['凌空横跨深邃河谷的多跨高耸石拱引桥', '灰白双色细密尖塔林立的新哥特悬崖立面', '溪流飞瀑穿桥奔涌而过的奇幻地貌'],
      history: '被公认为世界最梦幻的悬崖天主教朝圣圣殿，建在瓜伊塔拉河深谷绝壁之上，以 50 米高石拱桥连接两岸山崖。'
    },

    // --- DISTRICT 4: TOP 5 MODERN & CONTEMPORARY ICONIC CHURCHES (5 Modern) ---
    {
      num: 16, id: 'ronchamp', category: 'modern', name: '朗香教堂', en: 'Notre-Dame du Haut (Ronchamp)',
      city: '法国朗香 · Ronchamp', era: '1955', style: '现代雕塑主义 / 粗野主义',
      height: '27 m', architect: '勒·柯布西耶', archEn: 'Le Corbusier',
      district: '第四区 · 现当代新式圣殿建筑区', x: 192, z: 54, w: 22, d: 20, targetH: 50,
      robe: 0x1e293b, hair: 0x27272a, organFreq: [130.81, 174.61, 220.0, 293.66],
      quote: '我想创造一处寂静、祈祷与内心平和的器皿——让厚重白墙上的彩色光孔如星辰呼吸。',
      highlights: ['震撼建筑史的深灰清水混凝土反曲“蟹壳/船帆”悬挑巨顶', '纯白倾斜厚墙上大小错落、色彩斑斓的深凹方窗矩阵', '三座半圆柱白塔与屋顶细缝透入的一线圣光'],
      history: '现代建筑大师勒·柯布西耶颠覆理性盒子传统的巅峰神作，用如雕塑般自由弯曲的清水混凝土屋顶与深凹彩窗，改写了 20 世纪宗教建筑的形态语言。'
    },
    {
      num: 17, id: 'church_of_light', category: 'modern', name: '光之教堂', en: 'Church of the Light (Ibaraki Kasugaoka)',
      city: '日本大阪茨木 · Osaka', era: '1989', style: '极简清水混凝土现代主义',
      height: '12 m', architect: '安藤忠雄', archEn: 'Tadao Ando',
      district: '第四区 · 现当代新式圣殿建筑区', x: 252, z: 68, w: 18, d: 22, targetH: 46,
      robe: 0x374151, hair: 0x52525b, organFreq: [146.83, 220.0, 293.66, 329.63],
      quote: '不要装饰，不要黄金；在最朴素的清水混凝土墙面上切开一道十字，让自然阳光本身成为神圣。',
      highlights: ['极致纯粹的拉杆孔清水混凝土长方体空间', '斜穿 15° 的独立混凝土入口导墙', '正祭坛墙面通透切开的“光之十字架”直射室内'],
      history: '普利兹克奖得主安藤忠雄最负盛名的代表作。在极低预算下摒弃一切繁饰，仅凭混凝土暗空间与墙体切缝引入的炽烈光之十字，达成直击灵魂的崇高感。'
    },
    {
      num: 18, id: 'brasilia', category: 'modern', name: '巴西利亚大教堂', en: 'Cathedral of Brasília',
      city: '巴西巴西利亚 · Brasília', era: '1970', style: '现代主义双曲面结构',
      height: '40 m', architect: '奥斯卡·尼迈耶', archEn: 'Oscar Niemeyer',
      district: '第四区 · 现当代新式圣殿建筑区', x: 192, z: 288, w: 26, d: 26, targetH: 40,
      robe: 0x0f172a, hair: 0xd4d4d8, organFreq: [164.81, 196.0, 246.94, 392.0],
      quote: '十六根向苍穹合掌又绽放的白色混凝土肋骨，如荆棘王冠，也如人类祈祷的双手指尖。',
      highlights: ['16 根巨型纯白抛物线混凝土肋柱构成双曲面旋转圣殿', '肋间全透明蓝白海浪彩绘玻璃幕墙', '环绕整座教堂的浅水镜面反思池与入口四福音雕像'],
      history: '现代主义大师奥斯卡·尼迈耶为巴西新都打造的旷世杰作。游客穿过幽暗地下通道步入豁然开朗的玻璃花冠圣厅，体验从尘世步入天光的戏剧转折。'
    },
    {
      num: 19, id: 'hallgrimskirkja', category: 'modern', name: '哈尔格林姆教堂', en: 'Hallgrímskirkja',
      city: '冰岛雷克雅未克 · Reykjavík', era: '1945–1986', style: '北欧表现主义现代教堂',
      height: '74.5 m', architect: '古德永·萨穆埃尔松', archEn: 'Guðjón Samúelsson',
      district: '第四区 · 现当代新式圣殿建筑区', x: 122, z: 292, w: 22, d: 24, targetH: 43,
      robe: 0x334155, hair: 0xe2e8f0, organFreq: [110.0, 164.81, 220.0, 329.63],
      quote: '灵感源自冰岛火山熔岩冷却而成的六角玄武岩柱，如一架面向北大西洋轰鸣的巨型管风琴。',
      highlights: ['两侧逐级攀升的浅灰混凝土“火山玄武岩/管风琴音管”阶梯立面', '高耸入云的 74.5 米现代尖顶中央钟楼', '纯白极简北欧拱顶中殿与 5275 音管巨型管风琴'],
      history: '冰岛最高建筑与雷克雅未克地标，建筑师将冰岛自然奇观——六边形柱状玄武岩与冰川瀑布化为极具未来感的纪念碑式立面。'
    },
    {
      num: 20, id: 'thorncrown', category: 'modern', name: '荆棘冠玻璃礼拜堂', en: 'Thorncrown Chapel',
      city: '美国阿肯色森林 · Eureka Springs', era: '1980', style: '有机现代主义木构玻璃教堂',
      height: '14.6 m', architect: 'E. 费伊·琼斯', archEn: 'E. Fay Jones',
      district: '第四区 · 现当代新式圣殿建筑区', x: 262, z: 290, w: 16, d: 22, targetH: 41,
      robe: 0x5c3d22, hair: 0x8a7968, organFreq: [196.0, 246.94, 293.66, 392.0],
      quote: '教堂不必将森林拒之门外；用纤细橡木菱形桁架与四百二十五面玻璃，让四季林光在殿中流淌。',
      highlights: ['通体透明的 425 块玻璃幕墙与林间天窗脊梁', '室内如哥特肋拱般精密交错的深橡木菱形斜撑桁架', '完全采用两人可徒手搬运的轻质木材，零破坏原生森林'],
      history: '赖特门生 E. 费伊·琼斯设计的有机建筑巅峰之作，入选美国建筑师协会“20世纪十大建筑”，将哥特垂直韵律与美国森林自然融为一体。'
    }
  ];

  const WAYPOSTS = [
    {
      x: 183, z: 234, title: '圣彼得中央广场',
      arms: [
        { label: '圣彼得大教堂', dir: 0 },
        { label: '圣家族 · 东区', dir: Math.PI / 2 },
        { label: '巴西利亚 · 现代区', dir: Math.PI },
        { label: '巴黎圣母院 · 西区', dir: -Math.PI / 2 }
      ]
    },
    {
      x: 146, z: 186, title: '西欧哥特路口',
      arms: [
        { label: '圣母百花大教堂', dir: -0.4 },
        { label: '巴黎圣母院', dir: -Math.PI / 2 },
        { label: '科隆大教堂', dir: -2.2 }
      ]
    },
    {
      x: 238, z: 176, title: '伊比利亚圣殿桥头',
      arms: [
        { label: '圣家族大教堂', dir: Math.PI / 2 },
        { label: '塞维利亚大教堂', dir: 0.5 },
        { label: '墨西哥大教堂', dir: 2.3 }
      ]
    },
    {
      x: 192, z: 260, title: '现当代新式教堂区',
      arms: [
        { label: '巴西利亚大教堂', dir: Math.PI },
        { label: '哈尔格林姆教堂', dir: -2.3 },
        { label: '荆棘冠玻璃教堂', dir: 2.3 }
      ]
    }
  ];

  function create() {
    const blocks = new Uint8Array(W * D * H);
    const cols = new Uint8Array(W * D * H);
    const palette = [[0, 0, 0]];
    const palMap = new Map();
    function pal(r, g, b) {
      const k = (r << 16) | (g << 8) | b;
      let id = palMap.get(k);
      if (id === undefined) { id = palette.length; palette.push([r / 255, g / 255, b / 255]); palMap.set(k, id); }
      return id;
    }

    const C = {
      grass: pal(104, 152, 72), meadow: pal(116, 162, 80), dirt: pal(128, 102, 74),
      rock: [pal(126, 124, 118), pal(114, 112, 106), pal(102, 100, 96)],
      sand: pal(226, 212, 174), gravel: pal(174, 166, 152), snow: pal(242, 246, 252),
      path: pal(184, 174, 154), flag: pal(204, 198, 184),
      marble: pal(244, 240, 232), marbleGold: pal(234, 222, 196),
      stoneL: pal(224, 216, 200), stoneD: pal(152, 146, 136), honeyStone: pal(222, 198, 152),
      oak: pal(158, 114, 72), oakD: pal(96, 68, 42),
      cypress: pal(50, 92, 54), leaf: pal(76, 128, 60), olive: pal(96, 134, 82), bark: pal(104, 78, 52),
      gold: pal(228, 184, 78), crimson: pal(146, 36, 38), dry: pal(156, 148, 134),
      white: pal(246, 242, 234), slate: pal(78, 88, 102)
    };

    const idx = (x, y, z) => x + W * (z + D * y);
    const inb = (x, y, z) => x >= 0 && x < W && z >= 0 && z < D && y >= 0 && y < H;
    const set = (x, y, z, b, c) => {
      if (!inb(x, y, z)) return;
      const i = idx(x, y, z);
      blocks[i] = b;
      cols[i] = Array.isArray(c) ? c[(x * 7 + y * 13 + z * 19) % c.length] : (c || 1);
    };
    const get = (x, y, z) => (inb(x, y, z) ? blocks[idx(x, y, z)] : 0);
    const isAir = (x, y, z) => get(x, y, z) === 0;
    const zi = (x, z) => x + z * W;

    const rnd = mulberry32(20261122);
    const RI = (a, b) => a + Math.floor(rnd() * (b - a + 1));

    const hm = new Int16Array(W * D);
    const occ = new Uint8Array(W * D);
    const pathM = new Uint8Array(W * D);
    const lamps = [], seats = [], buildings = [], landmarks = [], chimneys = [], doors = [], flags = [], pasture = [];

    const props = {
      roofs: [], pots: [], chandeliers: [], candles: [], creepers: [], tufts: [], swans: [], ducks: [],
      wolds: true, cathedralSites: [], portalPlinths: [], wayposts: []
    };

    // Scenic rivers: West-North canal & East Las Lajas Gorge!
    const STREAM_MAIN = [[160, 20], [162, 80], [168, 152], [220, 174], [220, 240], [214, 305], [208, 365]];
    const STREAM_GORGE = [[348, 52], [336, 98], [328, 128], [312, 154], [278, 166], [220, 174]];

    function segDist(px, pz, ax, az, bx, bz) {
      const dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz;
      const t = l2 ? clamp(((px - ax) * dx + (pz - az) * dz) / l2, 0, 1) : 0;
      return Math.hypot(px - (ax + t * dx), pz - (az + t * dz));
    }
    function polyDist(px, pz, pts) {
      let d = 1e9;
      for (let i = 0; i < pts.length - 1; i++) d = Math.min(d, segDist(px, pz, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]));
      return d;
    }

    const PADS = CATHEDRALS.map((c) => ({
      x: c.x, z: c.z, r: Math.max(c.w, c.d) * 0.8 + 7, h: c.targetH || 42, c
    }));

    const dStreamArr = new Float32Array(W * D);
    for (let z = 0; z < D; z++) {
      for (let x = 0; x < W; x++) {
        const i = zi(x, z);
        const n1 = fbm(x / 72, z / 72, 23, 4), n2 = fbm(x / 24, z / 24, 41, 2);
        const distCenter = Math.hypot((x - 192) / 176, (z - 192) / 176);
        const coastDrop = smooth(0.84, 1.05, distCenter) * 11;
        const northHill = smooth(145, 32, z) * (8 + n1 * 5);
        const nwRidge = smooth(170, 52, x) * smooth(185, 65, z) * 4.5;
        let h = 40.0 + (n1 - 0.45) * 3.8 + (n2 - 0.5) * 1.0 + northHill + nwRidge - coastDrop;

        for (const pad of PADS) {
          const d = Math.hypot(x - pad.x, z - pad.z);
          if (d < pad.r + 14) {
            const w = smooth(pad.r + 14, pad.r - 1, d);
            h = h * (1 - w) + pad.h * w;
          }
        }

        const dsMain = polyDist(x, z, STREAM_MAIN);
        const dsGorge = polyDist(x, z, STREAM_GORGE);
        const ds = Math.min(dsMain, dsGorge);
        dStreamArr[i] = ds;
        if (ds < 7.5) {
          const cut = smooth(7.5, 2.5, ds);
          h = h * (1 - cut) + (WATER_Y - 1.5) * cut;
        }

        const hi = clamp(Math.round(h), 32, 74);
        hm[i] = hi;
        for (let y = 0; y < hi - 3; y++) set(x, y, z, B.ROCK, C.rock);
        for (let y = Math.max(0, hi - 3); y < hi - 1; y++) set(x, y, z, B.DIRT, C.dirt);
        if (hi <= Math.floor(WATER_Y)) set(x, hi - 1, z, B.GRAVEL, C.gravel);
        else if (ds < 13) set(x, hi - 1, z, B.MEADOW, C.meadow);
        else set(x, hi - 1, z, B.GRASS, C.grass);
      }
    }

    /* ================= 2. PROCESSIONS, STONE BOULEVARDS & BRIDGES ================= */
    function paveRoad(ax, az, bx, bz, width, blockType, colPalette) {
      const dist = Math.hypot(bx - ax, bz - az);
      const steps = Math.ceil(dist * 1.5);
      for (let s = 0; s <= steps; s++) {
        const t = s / steps;
        const rx = Math.round(ax + (bx - ax) * t), rz = Math.round(az + (bz - az) * t);
        for (let dz = -width; dz <= width; dz++) {
          for (let dx = -width; dx <= width; dx++) {
            if (dx * dx + dz * dz > width * width + 0.6) continue;
            const px = rx + dx, pz = rz + dz;
            if (!inb(px, 40, pz)) continue;
            const i = zi(px, pz), y = hm[i];
            if (y > Math.floor(WATER_Y)) {
              set(px, y - 1, pz, blockType || B.FLAGS, colPalette || C.flag);
              pathM[i] = 1; occ[i] = 1;
            }
          }
        }
      }
    }

    // Grand Sacred Processional Roads
    paveRoad(192, 342, 192, 196, 3, B.FLAGS, C.marble);   // South Harbor -> Brasília -> St. Peter's Piazza
    paveRoad(192, 196, 132, 146, 2, B.FLAGS, C.flag);     // St. Peter's -> Florence Duomo
    paveRoad(132, 146, 84, 106, 2, B.FLAGS, C.marble);    // Florence -> Milan Duomo
    paveRoad(192, 196, 82, 184, 2, B.FLAGS, C.flag);      // St. Peter's -> Notre-Dame
    paveRoad(82, 184, 54, 146, 2, B.PATH, C.path);        // Notre-Dame -> Cologne
    paveRoad(82, 184, 74, 254, 2, B.PATH, C.path);        // Notre-Dame -> Reims
    paveRoad(132, 146, 126, 82, 2, B.PATH, C.path);       // Florence -> Chartres
    paveRoad(192, 196, 184, 120, 2, B.FLAGS, C.flag);     // St. Peter's -> Sainte-Chapelle
    paveRoad(184, 120, 192, 54, 2, B.PATH, C.path);       // Sainte-Chapelle -> Ronchamp
    paveRoad(192, 54, 252, 68, 2, B.PATH, C.path);        // Ronchamp -> Church of the Light
    paveRoad(192, 184, 294, 176, 2, B.FLAGS, C.flag);     // St. Peter's -> Sagrada Família
    paveRoad(252, 132, 294, 176, 2, B.PATH, C.path);      // Seville -> Sagrada Família
    paveRoad(252, 132, 294, 92, 2, B.PATH, C.path);       // Seville -> Vienna St. Stephen's
    paveRoad(294, 176, 326, 224, 2, B.PATH, C.path);      // Sagrada Família -> Santiago
    paveRoad(294, 176, 328, 128, 2, B.PATH, C.path);      // Sagrada Família -> Las Lajas
    paveRoad(220, 210, 250, 238, 2, B.PATH, C.path);      // East Bridge -> Mexico Cathedral
    paveRoad(192, 288, 122, 292, 2, B.PATH, C.path);      // Brasília -> Hallgrímskirkja
    paveRoad(192, 288, 262, 290, 2, B.PATH, C.path);      // Brasília -> Thorncrown Chapel
    paveRoad(192, 238, 140, 248, 2, B.FLAGS, C.flag);     // South Plaza -> St. Mark's Venice

    function buildStoneBridge(bx0, bx1, bz0, bz1, deckY) {
      const midX = (bx0 + bx1) / 2;
      for (let x = bx0; x <= bx1; x++) {
        const archLift = Math.round(Math.cos(((x - midX) / ((bx1 - bx0) / 2)) * 1.25) * 1.5);
        const yTop = deckY + Math.max(0, archLift);
        for (let z = bz0; z <= bz1; z++) {
          const isHole = Math.abs(x - midX) <= 3 || Math.abs(x - (bx0 + 3)) <= 1 || Math.abs(x - (bx1 - 3)) <= 1;
          for (let y = 34; y < yTop; y++) set(x, y, z, (isHole && y < yTop - 1 && y >= 36) ? B.AIR : B.BATH, C.honeyStone);
          set(x, yTop - 1, z, B.FLAGS, C.stoneL);
          for (let y = yTop; y <= yTop + 4; y++) set(x, y, z, B.AIR, 0);
          if (z === bz0 || z === bz1) set(x, yTop, z, B.BALUS, C.stoneL);
          hm[zi(x, z)] = yTop; pathM[zi(x, z)] = 1; occ[zi(x, z)] = 1;
        }
      }
    }
    buildStoneBridge(208, 230, 174, 180, 41);
    buildStoneBridge(204, 224, 285, 291, 40);

    WAYPOSTS.forEach((wp) => {
      props.wayposts.push({ x: wp.x + 0.5, y: hm[zi(wp.x, wp.z)], z: wp.z + 0.5, title: wp.title, arms: wp.arms });
    });

    /* ================= 3. PREPARE MONUMENTAL PIAZZAS & SITES FOR ALL 20 CATHEDRALS ================= */
    const SOFT = new Uint8Array(256);
    for (const b of [B.GRASS, B.DIRT, B.ROCK, B.MEADOW, B.GRAVEL, B.BEECH, B.BARK, B.WILLOW, B.YEW, B.FLOWER, B.DRYW]) SOFT[b] = 1;

    const POSTCARD_CAM = {
      st_peters:         { dx: 0,    dist: 35, aimH: 11.5 },
      florence_duomo:    { dx: 11.5, dist: 27, aimH: 11.5 },
      milan_duomo:       { dx: 0,    dist: 33, aimH: 15.5 },
      st_marks:          { dx: 5.5,  dist: 27, aimH: 12.2 },
      notre_dame:        { dx: -4.5, dist: 26, aimH: 11.0 },
      cologne_cathedral: { dx: -7.5, dist: 34, aimH: 15.0 },
      chartres:          { dx: -4.0, dist: 30, aimH: 13.5 },
      sainte_chapelle:   { dx: -6.0, dist: 25, aimH: 11.5 },
      reims:             { dx: 0,    dist: 27, aimH: 11.5 },
      sagrada_familia:   { dx: 4.5,  dist: 39, aimH: 18.5 },
      seville:           { dx: 6.0,  dist: 27, aimH: 12.2 },
      st_stephens:       { dx: 13.5, dist: 28, aimH: 13.0 },
      santiago:          { dx: 0,    dist: 26, aimH: 11.5 },
      mexico_cathedral:  { dx: 5.5,  dist: 27, aimH: 11.0 },
      las_lajas:         { dx: -9.5, dist: 27, aimH: 11.5 },
      ronchamp:          { dx: 10.5, dist: 23, aimH: 6.4  },
      church_of_light:   { dx: -4.5, dist: 21, aimH: 4.8  },
      brasilia:          { dx: 5.5,  dist: 26, aimH: 8.5  },
      hallgrimskirkja:   { dx: 0,    dist: 32, aimH: 14.2 },
      thorncrown:        { dx: 0,    dist: 19, aimH: 6.2  }
    };

    CATHEDRALS.forEach((c) => {
      const hw = Math.floor(c.w / 2), hd = Math.floor(c.d / 2);
      const x0 = c.x - hw, x1 = c.x + hw, z0 = c.z - hd, z1 = c.z + hd;
      const gy = c.targetH || hm[zi(c.x, c.z)];
      c.gy = gy;
      const pc = POSTCARD_CAM[c.id] || { dx: 0, dist: 24, aimH: 10.0 };

      // Generous level stone piazza & ceremonial approach forecourt reaching all the way to the postcard viewpoint!
      const extraFront = Math.max(18, Math.ceil(pc.dist) + 3);
      const extraSide = Math.max(c.id === 'st_peters' ? 14 : 7, Math.ceil(Math.abs(pc.dx)) + 4);
      for (let z = z0 - 6; z <= z1 + extraFront; z++) {
        for (let x = x0 - extraSide; x <= x1 + extraSide; x++) {
          if (!inb(x, gy, z)) continue;
          const i = zi(x, z);
          // For Las Lajas, leave a dramatic river gorge channel directly underneath the approach bridge (z1+3..z1+11)!
          const isGorgeWater = c.id === 'las_lajas' && z >= z1 + 3 && z <= z1 + 11 && Math.abs(x - c.x) > 3;
          if (isGorgeWater) {
            for (let y = Math.floor(WATER_Y); y <= gy + 24; y++) set(x, y, z, B.AIR, 0);
            hm[i] = Math.floor(WATER_Y);
            continue;
          }
          // Bright carved limestone ashlar retaining plinth beneath raised piazzas (zero dark/black dirt walls!)
          for (let y = 32; y < gy; y++) set(x, y, z, B.LIME, C.stoneL);
          for (let y = gy; y <= gy + 28; y++) if (SOFT[get(x, y, z)]) set(x, y, z, B.AIR, 0);
          const inNave = x >= x0 && x <= x1 && z >= z0 && z <= z1;
          if (c.id === 'brasilia') {
            // Reflecting pool ring around Brasília Cathedral (leaves entrance causeway dry!)
            const r = Math.hypot(x - c.x, z - c.z);
            const isCauseway = Math.abs(x - c.x) <= 2 && z >= c.z;
            if (r > 10.5 && r < 14.2 && !isCauseway) {
              set(x, gy - 1, z, B.BROOK, C.slate);
            } else {
              set(x, gy - 1, z, inNave ? B.MARBLE : B.FLAGS, C.marble);
            }
          } else {
            const checker = ((x + z) % 2 === 0);
            set(x, gy - 1, z, inNave ? B.MARBLE : B.FLAGS, inNave ? (checker ? C.marble : C.stoneL) : C.flag);
          }
          if (inNave) occ[i] = 1; else pathM[i] = 1;
          hm[i] = gy;
        }
      }

      // Warm museum interior bounce illumination (pure light points, zero black voxel cubes!)
      lamps.push([c.x + 0.5, gy + 5.5, c.z + 0.5, true, 1.5]);
      lamps.push([c.x + 0.5, gy + 4.5, z0 + 4.5, true, 1.3]);
      lamps.push([c.x + 0.5, gy + 3.5, z1 + 3.5, false, 1.2]);

      // Register Cathedral 3D Architectural Site & Sleek Low-Profile Interactive Portal Plinth
      props.cathedralSites.push({ x: c.x + 0.5, y: gy, z: c.z + 0.5, x0, z0, x1, z1, cat: c });
      props.portalPlinths.push({ x: c.x + 0.5, y: gy, z: c.z + 2.5, cat: c });

      landmarks.push({
        id: 'cat_' + c.id,
        num: c.num,
        category: c.category,
        name: `${c.num}. ${c.name} · ${c.city.split('·')[0].trim()}`,
        en: `${c.en} (${c.style})`,
        x: c.x, z: c.z, top: gy + 10, r: 16,
        cat: c,
        tp: { mode: 'walk', p: [c.x + 0.5 + pc.dx, gy, z1 + pc.dist], t: [c.x + 0.5, gy + pc.aimH, c.z] },
        tpInside: { mode: 'walk', p: [c.x + 0.5, gy, c.id === 'st_peters' ? c.z + 8.8 : z1 - 2.2], t: [c.x + 0.5, gy + 4.2, z0 + 2.5] }
      });
      buildings.push({ id: c.id, x0, z0, x1, z1, y: gy, cat: c });
    });

    /* ================= 4. CYPRESSES, OLIVE TREES, WILDFLOWERS & SWANS ================= */
    function cypress(x, z) {
      const y = hm[zi(x, z)]; if (y <= WATER_Y + 1) return;
      set(x, y, z, B.BARK, C.bark);
      for (let dy = 1; dy <= 8; dy++) {
        const r = dy === 1 || dy >= 7 ? 0 : 1;
        for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) if (isAir(x + dx, y + dy, z + dz)) set(x + dx, y + dy, z + dz, B.YEW, C.cypress);
      }
      occ[zi(x, z)] = 3;
    }
    function broadleaf(x, z, col) {
      const y = hm[zi(x, z)], hgt = 7, r = 3;
      for (let k = 0; k < hgt - 2; k++) set(x, y + k, z, B.BARK, C.bark);
      for (let dy = -2; dy <= 2; dy++) for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) {
        if (dx * dx + dz * dz + dy * dy * 1.5 > r * r + 1) continue;
        if (isAir(x + dx, y + hgt - 2 + dy, z + dz)) set(x + dx, y + hgt - 2 + dy, z + dz, B.BEECH, col || C.leaf);
      }
      occ[zi(x, z)] = 3;
    }

    for (let t = 0; t < 950; t++) {
      const x = RI(20, W - 20), z = RI(20, D - 20), i = zi(x, z);
      if (occ[i] || pathM[i] || hm[i] <= WATER_Y + 1.5) continue;
      let tooClose = false;
      for (const c of CATHEDRALS) {
        // Keep generous clear viewing corridors in front of every cathedral facade!
        if (Math.hypot(x - c.x, z - c.z) < 24 || (Math.abs(x - c.x) < 15 && z >= c.z - 12 && z <= c.z + 44)) {
          tooClose = true; break;
        }
      }
      if (tooClose) continue;
      if (x < 160 && z < 200) cypress(x, z);
      else if (x > 240 && z > 250) broadleaf(x, z, C.leaf); // Forest around Thorncrown Chapel!
      else if (rnd() < 0.5) cypress(x, z);
      else broadleaf(x, z, C.olive);
    }

    for (let t = 0; t < 18000 && props.tufts.length < 4800; t++) {
      const x = RI(12, W - 12), z = RI(12, D - 12), i = zi(x, z), y = hm[i];
      if (pathM[i] || occ[i]) continue;
      const top = get(x, y - 1, z);
      if ((top !== B.GRASS && top !== B.MEADOW) || !isAir(x, y, z)) continue;
      const kind = dStreamArr[i] < 10 ? 1 : hash3(x, 7, z) < 0.22 ? 2 : 0;
      props.tufts.push([x + 0.2 + rnd() * 0.6, y, z + 0.2 + rnd() * 0.6, kind, 0.75 + rnd() * 0.5]);
    }

    for (const [x, z] of [[166, 118], [218, 198], [218, 248], [295, 160]]) {
      props.swans.push({ x: x + 0.5, y: WATER_Y - 0.22, z: z + 0.5, r: rnd() * 6.28 });
    }

    const topH = new Uint8Array(W * D), topB = new Uint8Array(W * D), topC = new Uint8Array(W * D);
    for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) for (let y = H - 1; y >= 0; y--) {
      const b = blocks[idx(x, y, z)];
      if (b) { topH[zi(x, z)] = y; topB[zi(x, z)] = b; topC[zi(x, z)] = cols[idx(x, y, z)]; break; }
    }

    // Spawn facing the iconic St. Peter's Basilica & Bernini Colonnade Piazza!
    const stP = CATHEDRALS[0];
    const spawn = { x: stP.x + 0.5, y: stP.gy, z: stP.z + Math.floor(stP.d / 2) + 27, yaw: 0 };

    const tour = {
      cam: [
        [192, 62, 260], [132, 60, 192], [84, 62, 152], [82, 58, 224],
        [294, 66, 224], [294, 64, 134], [192, 62, 92], [192, 58, 332]
      ],
      tgt: [
        [192, 48, 196], [132, 48, 146], [84, 50, 106], [82, 48, 184],
        [294, 52, 176], [294, 50, 92], [192, 52, 54], [192, 46, 288]
      ],
      dur: 160
    };

    return {
      W, D, H, BASE: 40, GY: 40, WATER_Y, blocks, cols, palette, pal, get, set, idx, inb, B, BI, T,
      CATHEDRALS, WAYPOSTS, hm, occ, topH, topB, topC, landmarks, lamps, flags, chimneys, doors, seats, pasture, buildings, props,
      spawn, tour
    };
  }

  root.CIWorld = { W, D, H, WATER_Y, B, BI, T, CATHEDRALS, WAYPOSTS, create, hash3, mulberry32 };
  root.PIWorld = root.CIWorld;
  if (typeof module !== 'undefined') module.exports = root.CIWorld;
})(typeof window !== 'undefined' ? window : globalThis);
