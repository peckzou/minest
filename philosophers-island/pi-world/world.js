/* Philosophers' Island (哲学家体素小岛 V3.0 · 2x Grand Scale & Architectural Masterpiece Edition)
 * Map Scale: W = 384, D = 384, H = 84 (147,456 m² — 2.25x area of V2!).
 * Features:
 *   - 6 Distinct Architectural Styles with smooth pitched roofs (props.roofs), gable infills, dormers, pediments,
 *     multi-light mullioned windows with drip moulds (B.HOOD), stone chimneys with clay pots & smoke, ivy/wisteria/rose climbers,
 *     courtyard gardens, fountains, and multi-room furnished interiors.
 *   - Roadside Fingerpost Wayfinding Network (props.wayposts) at every road junction pointing to districts & philosophers.
 *   - Custom Architectural House Nameplates & Hanging Signs (props.houseSigns) on every building facade.
 */
(function (root) {
  'use strict';
  const W = 384, D = 384, H = 84;
  const WATER_Y = 36.6;

  const T = {
    grass: 0, grassSide: 1, dirt: 2, rock: 3, rubble: 4, slates: 5, path: 6, gravel: 7,
    pine: 8, bark: 9, trunkTop: 10, beech: 11, brook: 12, ashlar: 13, limeSmooth: 14, limeCarved: 15,
    brick: 16, slate: 17, glass: 18, door: 19, gold: 20, marble: 21, drystone: 22, coping: 23,
    oak: 24, oakCarved: 25, parquet: 26, plaster: 27, beams: 28, coffer: 29, carpet: 30, lamp: 31,
    wool: 32, planks: 33, curtain: 34, dresser: 35, moss: 36, iron: 37, balus: 38, meadow: 39,
    stove: 40, stained: 41, books: 42, fire: 43, flower: 44, fall: 45, tarmac: 46, flagstone: 47,
    bath: 48, wheat: 49, loom: 50, lead: 51, hedge: 52, silk: 53, cedar: 54, rug: 55,
    ivy: 56, casement: 57, yew: 58, willow: 59, sack: 60, millstone: 61, hood: 62, bottles: 63
  };

  const B = {
    AIR: 0, GRASS: 1, DIRT: 2, ROCK: 3, SNOW: 4, PATH: 5, GRAVEL: 6, PINE: 7, BARK: 8, BEECH: 9, BROOK: 10,
    LIME: 11, LIMES: 12, LIMEC: 13, BRICK: 14, SLATE: 15, GLASS: 16, DOOR: 17, GOLD: 18, MARBLE: 19,
    OAK: 22, OAKC: 23, PARQ: 24, PLASTER: 25, COFFER: 27, CARPET: 28, LAMP: 29, BED: 30, TABLE: 31, CHAIR: 32,
    BENCH: 33, CURTAIN: 34, MOSS: 36, IRON: 37, BALUS: 38, MEADOW: 39, STOVE: 40, BOOKS: 42, FIRE: 43,
    FLOWER: 44, PLANKS: 49, BATH: 50, WHEAT: 52, LEAD: 54, HEDGE: 55, SOFA: 59,
    ROOF: 61, RUBBLE: 62, DRYW: 63, LANE: 64, FLAGS: 65, BEAM: 66, DRESSER: 67, PORTAL: 69, CASE: 70,
    YEW: 71, WILLOW: 72, MILLST: 74, IVY: 75, HOOD: 76, RUG: 78
  };

  const BI = [];
  function def(id, name, top, side, bottom, glow, jit, lit) {
    BI[id] = { name, top, side, bottom: bottom == null ? side : bottom, glow: !!glow, lit: !!lit, jit: jit == null ? 0.06 : jit };
  }
  def(B.AIR, 'air', 0, 0);
  def(B.GRASS, 'grass', T.grass, T.grassSide, T.dirt, false, 0.1);
  def(B.MEADOW, 'meadow', T.meadow, T.grassSide, T.dirt, false, 0.1);
  def(B.DIRT, 'earth', T.dirt, T.dirt, T.dirt, false, 0.1);
  def(B.ROCK, 'rock', T.rock, T.rock, T.rock, false, 0.09);
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
  def(B.CARPET, 'baize / carpet', T.carpet, T.oak, T.oak, false, 0.02);
  def(B.LAMP, 'lantern', T.lamp, T.lamp, T.lamp, true, 0);
  def(B.BED, 'bed', T.wool, T.oakCarved, T.oak, false, 0.02);
  def(B.TABLE, 'table', T.oak, T.oakCarved, T.oak, false, 0.03);
  def(B.CHAIR, 'chair', T.curtain, T.oakCarved, T.oak, false, 0.03);
  def(B.BENCH, 'bench', T.oak, T.oakCarved, T.oak, false, 0.03);
  def(B.CURTAIN, 'cloth', T.curtain, T.curtain, T.curtain, false, 0.03);
  def(B.MOSS, 'moss', T.moss, T.moss, T.moss, false, 0.14);
  def(B.IRON, 'iron', T.iron, T.iron, T.iron, false, 0.04);
  def(B.BALUS, 'balustrade', T.oak, T.balus, T.oak, false, 0.02);
  def(B.STOVE, 'hearth stove', T.stove, T.stove, T.stove, false, 0.02);
  def(B.BOOKS, 'bookshelf', T.oak, T.books, T.oak, false, 0.02);
  def(B.FIRE, 'fire', T.fire, T.fire, T.fire, false, 0, true);
  def(B.FLOWER, 'flowers', T.flower, T.flower, T.flower, false, 0.1);
  def(B.PLANKS, 'planks', T.planks, T.planks, T.planks, false, 0.05);
  def(B.BATH, 'honey stone', T.bath, T.bath, T.bath, false, 0.035);
  def(B.WHEAT, 'wheat', T.wheat, T.wheat, T.dirt, false, 0.08);
  def(B.LEAD, 'lead roof', T.lead, T.lead, T.lead, false, 0.04);
  def(B.HEDGE, 'hedge', T.hedge, T.hedge, T.hedge, false, 0.1);
  def(B.SOFA, 'sofa', T.curtain, T.curtain, T.oak, false, 0.03);
  def(B.ROOF, 'tile roof', T.slates, T.slates, T.beams, false, 0.05);
  def(B.RUBBLE, 'rubble', T.rubble, T.rubble, T.rubble, false, 0.035);
  def(B.DRYW, 'dry wall', T.coping, T.drystone, T.drystone, false, 0.06);
  def(B.LANE, 'lane', T.tarmac, T.rock, T.rock, false, 0.03);
  def(B.FLAGS, 'flagstones', T.flagstone, T.rubble, T.rubble, false, 0.03);
  def(B.BEAM, 'beams', T.planks, T.oak, T.beams, false, 0.02);
  def(B.DRESSER, 'cabinet', T.oak, T.dresser, T.oak, false, 0.02);
  def(B.PORTAL, 'interaction portal', T.stained, T.stained, T.stained, false, 0, true);
  def(B.CASE, 'casement', T.casement, T.casement, T.casement, true, 0);
  def(B.YEW, 'cypress / yew', T.yew, T.yew, T.yew, false, 0.14);
  def(B.WILLOW, 'bamboo / willow', T.willow, T.willow, T.willow, false, 0.14);
  def(B.MILLST, 'gear / stone', T.millstone, T.rock, T.millstone, false, 0.03);
  def(B.IVY, 'ivy', T.ivy, T.ivy, T.ivy, false, 0.12);
  def(B.HOOD, 'drip mould', T.limeSmooth, T.hood, T.limeSmooth, false, 0.02);
  def(B.RUG, 'rug', T.rug, T.oak, T.beams, false, 0.02);

  function mulberry32(a) { return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function hash3(x, y, z) { let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(z | 0, 2147483647); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
  function vnoise(x, z, s) {
    const xi = Math.floor(x), zi = Math.floor(z), fx = x - xi, fz = z - zi, u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz);
    const a = hash3(xi, s, zi), b = hash3(xi + 1, s, zi), c = hash3(xi, s, zi + 1), d = hash3(xi + 1, s, zi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  function fbm(x, z, s, oct) { let v = 0, a = 0.5, f = 1, n = 0; for (let i = 0; i < (oct || 4); i++) { v += vnoise(x * f, z * f, s + i * 17) * a; n += a; a *= 0.5; f *= 2; } return v / n; }
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const lerp = (a, b, t) => a + (b - a) * t;

  // ==========================================================================
  // TOP 20 PHILOSOPHERS ACROSS THE EXPANDED 384 x 384 ISLAND
  // ==========================================================================
  const PHILOSOPHERS = [
    // Hub & District 1: Classical Antiquity (Center & NW Acropolis Ridge)
    {
      num: 1, id: 'socrates', name: '苏格拉底', en: 'Socrates (470–399 BC)',
      houseTitle: '雅典阿哥拉 · 德尔斐圆亭神庙 (Tholos)',
      district: '中央辩证广场 · The Athenian Agora',
      x: 192, z: 196, w: 20, d: 20, style: 'agora_rotunda',
      robe: 0xf4efe6, hair: 0xd8d8d8,
      portalId: 'portal_socrates_elenchus',
      portalName: '产婆术诘问同心罗盘 (Elenchus Dialectic Wheel)',
      conceptId: 'concept.socrates.elenchus_aporia',
      quote: '未经审视的人生是不值得过的；我唯一知道的，就是我一无所知。',
      quoteOrig: 'Ὁ δὲ ἀνεξέταστος βίος οὐ βιωτὸς ἀνθρώπῳ · ἓν οἶδα ὅτι οὐδὲν οἶδα',
      works: ['《申辩篇》Apology (柏拉图载)', '《克里同篇》Crito', '《斐多篇》Phaedo', '《会饮篇》Symposium'],
      artTitle: '《苏格拉底之死》(The Death of Socrates)',
      artArtist: '雅克-路易·大卫 (Jacques-Louis David, 1787 · 纽约大都会艺术博物馆)',
      artDesc: '苏格拉底左手高指苍穹象征永恒真理与灵魂不朽，右手平静伸向毒堇汁杯，以生命完成最后一场哲学追问。',
      artTheme: 'socrates_death'
    },
    {
      num: 2, id: 'plato', name: '柏拉图', en: 'Plato (427–347 BC)',
      houseTitle: '雅典学院 (The School of Athens)',
      district: '第一街区 · 古希腊雅典卫城高地',
      x: 84, z: 98, w: 28, d: 30, style: 'plato_temple',
      robe: 0xb8493c, hair: 0xc8c8c8,
      portalId: 'portal_plato_cave_fire',
      portalName: '地下洞穴寓言光影操控台 (Allegory of the Cave Theater)',
      conceptId: 'concept.plato.allegory_of_the_cave',
      quote: '不懂几何学者不得入内；凡人把洞壁上的影子当成真实，直到有人转身走向阳光。',
      quoteOrig: 'Μηδεὶς ἀγεωμέτρητος εἰσίτω · Πολιτεία VII',
      works: ['《理想国》Republic (Πολιτεία)', '《蒂迈欧篇》Timaeus', '《斐德罗篇》Phaedrus', '《巴门尼德篇》Parmenides'],
      artTitle: '《雅典学院 · 指天理型》与《洞穴寓言图》',
      artArtist: '拉斐尔 (Raphael, 1509 · 梵蒂冈博物馆) & 萨恩莱丹 (Jan Saenredam, 1604)',
      artDesc: '红袍柏拉图手捧《蒂迈欧篇》一指苍穹，昭示超越感官流变的永恒“理型世界（World of Forms）”与至善太阳。',
      artTheme: 'school_of_athens'
    },
    {
      num: 3, id: 'aristotle', name: '亚里士多德', en: 'Aristotle (384–322 BC)',
      houseTitle: '吕克昂爱奥尼周柱神庙 & 漫步博物院',
      district: '第一街区 · 吕克昂列柱神殿区',
      x: 132, z: 138, w: 22, d: 16, style: 'aristotle_villa',
      robe: 0xd9c39a, hair: 0x5a422e,
      portalId: 'portal_aristotle_four_causes',
      portalName: '青铜神像四因拆解台 & 德性中道天平 (Four Causes & Golden Mean)',
      conceptId: 'concept.aristotle.four_causes',
      quote: '吾爱吾师，吾更爱真理；哲学始于对万事万物的惊奇（Thaumazein）。',
      quoteOrig: 'Amicus Plato, sed magis amica veritas · Πάντες ἄνθρωποι τοῦ εἰδέναι ὀρέγονται φύσει',
      works: ['《形而上学》Metaphysics', '《尼各马可伦理学》Nicomachean Ethics', '《工具论》Organon', '《政治学》&《诗学》'],
      artTitle: '《亚里士多德凝视荷马半身像》',
      artArtist: '伦勃朗 (Rembrandt van Rijn, 1653 · 纽约大都会艺术博物馆)',
      artDesc: '伦勃朗以深邃黄金明暗法（Chiaroscuro），描绘亚里士多德右手轻抚荷马石像，沉思经验实体、四因秩序与诗学真谛。',
      artTheme: 'rembrandt_aristotle'
    },
    {
      num: 4, id: 'zeno', name: '芝诺与斯多葛', en: 'Zeno & The Stoics (c. 495–300 BC)',
      houseTitle: '雅典彩绘列柱神殿 (Stoa Poikile)',
      district: '第一街区 · 彩绘神殿与二分跑道',
      x: 52, z: 146, w: 20, d: 16, style: 'greek_stoa_villa',
      robe: 0x3b5998, hair: 0x333333,
      portalId: 'portal_zeno_dichotomy',
      portalName: '阿喀琉斯二分跑道 & 控制二分石盘 (Zeno Paradox & Stoic Control)',
      conceptId: 'concept.zeno.paradox_of_motion',
      quote: '飞矢不动；不要企图让发生的事如你所愿，而要顺应自然之理性。',
      quoteOrig: 'Sustine et abstine · ὁμολογουμένως τῇ φύσει ζῆν',
      works: ['马可·奥勒留《沉思录》Meditations', '爱比克泰德《手册》Enchiridion', '塞内卡《道德书简》', '芝诺《论合乎自然的生活》'],
      artTitle: '《彩绘柱廊哲人图》与《马可·奥勒留骑马像》',
      artArtist: '古希腊泛雅典娜壁画 & 古罗马卡皮托利尼博物馆藏 (AD 175)',
      artDesc: '狂风巨浪拍击海岸，斯多葛哲人如磐石般屹立于理性灯塔之下，象征“内心不可动摇的宁静堡垒（Ataraxia）”。',
      artTheme: 'stoa_lighthouse'
    },

    // District 2: Eastern Philosophy (East Bamboo & Lotus Valley)
    {
      num: 5, id: 'confucius', name: '孔子', en: 'Confucius (551–479 BC)',
      houseTitle: '曲阜杏坛 · 重檐黄琉璃大成殿 & 棂星牌坊',
      district: '第二街区 · 东方古典礼乐山水谷',
      x: 296, z: 176, w: 20, d: 16, style: 'oriental_academy',
      robe: 0x8c2d19, hair: 0x222222,
      portalId: 'portal_confucius_ren_li',
      portalName: '杏坛青铜编钟与仁礼中庸台 (Bells of Ren & Li)',
      conceptId: 'concept.confucius.ren_and_li',
      quote: '己所不欲，勿施于人；克己复礼为仁，兴于诗，立于礼，成于乐。',
      quoteOrig: '志于道，据于德，依于仁，游于艺 · 大道之行也，天下为公',
      works: ['《论语》The Analects (二十篇)', '《春秋》Spring and Autumn Annals', '《礼记 · 大学 / 中庸》', '《周易 · 十翼》'],
      artTitle: '《孔子圣迹图 · 杏坛礼乐讲学图卷》',
      artArtist: '明代 仇英 / 圣迹图彩绘绢本 (曲阜孔庙 & 故宫博物院藏)',
      artDesc: '苍松翠柏掩映朱漆杏坛，金声玉振青铜编钟齐鸣，七十二贤环列论道，展现礼乐文明与仁者爱人的中庸气象。',
      artTheme: 'apricot_altar'
    },
    {
      num: 6, id: 'laozi', name: '老子', en: 'Laozi (6th Century BC)',
      houseTitle: '函谷关 · 三层飞檐八卦道观云塔 & 水车竹庐',
      district: '第二街区 · 东方道家云隐涧',
      x: 332, z: 128, w: 16, d: 14, style: 'oriental_watermill',
      robe: 0x4f6d7a, hair: 0xeeeeee,
      portalId: 'portal_laozi_wuwei_vessel',
      portalName: '有无相生虚空陶轮与上善若水水车 (Vessel of Non-Being)',
      conceptId: 'concept.laozi.being_and_nonbeing',
      quote: '上善若水，水善利万物而不争；埏埴以为器，当其无，有器之用。',
      quoteOrig: '道可道，非常道 · 人法地，地法天，天法道，道法自然',
      works: ['《道德经 · 道经三十七章》', '《道德经 · 德经四十四章》', '《郭店楚简老子》', '《马王堆帛书老子》'],
      artTitle: '《老子骑青牛出函谷关图》与《水图 · 波蹙金风》',
      artArtist: '南宋 马远《水图》(故宫博物院) & 明代 张路《老子骑牛图》(台北故宫)',
      artDesc: '留白云海之间老子骑青牛悠然出关，柔水绕孤峰，以极致东方水墨“计白当黑”诠释“有无相生、大音希声”。',
      artTheme: 'laozi_ox_water'
    },
    {
      num: 7, id: 'zhuangzi', name: '庄子', en: 'Zhuangzi (c. 369–286 BC)',
      houseTitle: '江南粉墙黛瓦飞檐水榭 & 圆洞月亮门荷花池',
      district: '第二街区 · 江南逍遥濠梁水榭',
      x: 328, z: 226, w: 16, d: 14, style: 'oriental_waterside',
      robe: 0x3b7a57, hair: 0x3a3a3a,
      portalId: 'portal_zhuangzi_butterfly',
      portalName: '庄周梦蝶物我两忘镜 & 濠梁观鱼台 (Butterfly Dream Mirror)',
      conceptId: 'concept.zhuangzi.butterfly_dream',
      quote: '不知周之梦为胡蝶与，胡蝶之梦为周与？天地与我并生，而万物与我为一。',
      quoteOrig: '北冥有鱼，其名为鲲；化而为鸟，其名为鹏 · 乘天地之正，而御六气之辩',
      works: ['《庄子 · 逍遥游》', '《庄子 · 齐物论》', '《庄子 · 秋水篇》', '《庄子 · 大宗师 / 养生主》'],
      artTitle: '《庄周梦蝶图》与《秋水濠梁观鱼图卷》',
      artArtist: '宋元院体设色水墨画卷 & 明代 陆治《庄周梦蝶图》',
      artDesc: '江南水榭荷塘之上彩蝶翩跹入梦，北冥大鹏扶摇直上九万里，打破物我、梦觉与生死的执念界限。',
      artTheme: 'zhuangzi_butterfly'
    },

    // District 3: Continental Rationalism (SW Geometric Canal & Gable Quarter)
    {
      num: 8, id: 'descartes', name: '笛卡尔', en: 'René Descartes (1596–1650)',
      houseTitle: '17世纪法式巴洛克孟莎顶城堡 & 笛卡尔坐标花园',
      district: '第三街区 · 17世纪欧洲大陆理性主义区',
      x: 102, z: 236, w: 18, d: 16, style: 'cotswold_manor',
      robe: 0x1e293b, hair: 0x3b2f2f,
      portalId: 'portal_descartes_cogito_wax',
      portalName: '冬日暖炉融蜡实验台 & 三维坐标仪 (Cogito & Melting Wax)',
      conceptId: 'concept.descartes.cogito_and_wax',
      quote: '当我怀疑一切时，那个正在怀疑的“我”必然存在——我思故我在（Cogito, ergo sum）。',
      quoteOrig: 'Cogito, ergo sum · Je pense, donc je suis (1637)',
      works: ['《谈谈方法》Discourse on the Method (1637)', '《第一哲学沉思集》Meditations (1641)', '《哲学原理》Principles of Philosophy', '《几何学》La Géométrie'],
      artTitle: '《勒内·笛卡尔肖像》与《屈光学 · 坐标几何图谱》',
      artArtist: '弗朗斯·哈尔斯 (Frans Hals, 1649 · 巴黎卢浮宫藏)',
      artDesc: '巴洛克深邃黑袍肖像眼神锐利如炬，背景交织着三维正交X-Y-Z坐标网格与彩虹几何光学折射线。',
      artTheme: 'descartes_optics'
    },
    {
      num: 9, id: 'spinoza', name: '斯宾诺莎', en: 'Baruch Spinoza (1632–1677)',
      houseTitle: '17世纪荷兰阿姆斯特丹红砖七阶山墙运河高屋',
      district: '第三街区 · 荷兰黄金时代运河街区',
      x: 58, z: 248, w: 16, d: 14, style: 'dutch_stepped_gable',
      robe: 0x3f3f46, hair: 0x18181b,
      portalId: 'portal_spinoza_monism_lens',
      portalName: '海牙磨镜车床与神即自然分光水晶 (Deus sive Natura Prism)',
      conceptId: 'concept.spinoza.deus_sive_natura',
      quote: '神即自然（Deus sive Natura）；心灵与身体是同一实体在思维与广延两个属性下的平行表达。',
      quoteOrig: 'Deus sive Natura · Sub specie aeternitatis (在永恒的形式下)',
      works: ['《伦理学：用几何学方法证明》Ethica (1677)', '《神学政治论》Tractatus Theologico-Politicus', '《知性改进论》', '《笛卡尔哲学原理》'],
      artTitle: '《天文学家与海牙光学透镜工坊》',
      artArtist: '约翰内斯·维米尔 (Johannes Vermeer, 1668 · 巴黎卢浮宫藏)',
      artDesc: '荷兰黄金时代花格窗洒入澄澈晨光，照亮天球仪、几何手稿与光学透镜，礼赞“神即自然”的宇宙内在秩序。',
      artTheme: 'vermeer_spinoza'
    },
    {
      num: 10, id: 'leibniz', name: '莱布尼茨', en: 'G. W. Leibniz (1646–1716)',
      houseTitle: '汉诺威巴洛克铜绿鎏金洋葱顶二进制钟楼',
      district: '第三街区 · 日耳曼巴洛克钟楼区',
      x: 78, z: 292, w: 16, d: 16, style: 'baroque_clock_tower',
      robe: 0x7c2d12, hair: 0xd4af37,
      portalId: 'portal_leibniz_monad_harmony',
      portalName: '前定和谐双生钟 & 无窗单子镜厅 (Pre-established Harmony Clocks)',
      conceptId: 'concept.leibniz.monadology',
      quote: '单子没有可供事物出入的窗户，但每个单子都是映照整个宇宙的活镜子。',
      quoteOrig: 'Omnibus ex nihilo ducendis sufficit unum (从虚无创造万有，一就足够了)',
      works: ['《单子论》Monadologia (1714)', '《神正论》Théodicée (1710)', '《人类理智新论》New Essays', '《二进制算术阐释》(1703)'],
      artTitle: '《无窗单子镜宫与二进制创世纪念章油画》',
      artArtist: '克里斯托夫·弗兰克 (Christoph Bernhard Francke, 1695 · 布伦瑞克博物馆)',
      artDesc: '巴洛克金框镜厅中万千单子晶球彼此映照宇宙，中央闪耀着莱布尼茨亲自设计的 1 与 0 二进制创世图章。',
      artTheme: 'leibniz_monads'
    },

    // District 4: British Empiricism & Social Contract (South Cotswold Stone Harbor)
    {
      num: 11, id: 'locke', name: '洛克', en: 'John Locke (1632–1704)',
      houseTitle: '17世纪英伦都铎王朝黑白露木骨架构庄园',
      district: '第四街区 · 英伦都铎与乔治亚海湾港',
      x: 142, z: 288, w: 18, d: 14, style: 'cotswold_dormer_house',
      robe: 0x334155, hair: 0x94a3b8,
      portalId: 'portal_locke_tabula_rasa',
      portalName: '暗箱白板画室与第一/第二性质棱镜 (Tabula Rasa Camera Obscura)',
      conceptId: 'concept.locke.tabula_rasa',
      quote: '心灵原是一块白板（Tabula Rasa），上面没有任何记号；一切知识的材料都来自经验。',
      quoteOrig: 'Tabula Rasa · No man\'s knowledge here can go beyond his experience',
      works: ['《人类理解论》Essay Concerning Human Understanding (1689)', '《政府论（上下篇）》Two Treatises of Government', '《论宗教宽容》A Letter Concerning Toleration', '《教育漫话》'],
      artTitle: '《约翰·洛克肖像》与《暗箱白板光学实验图》',
      artArtist: '戈弗雷·内勒爵士 (Sir Godfrey Kneller, 1697) & 约瑟夫·赖特 (Joseph Wright of Derby)',
      artDesc: '一束外部感官之光穿过幽暗房间的小孔，在纯白画布（Tabula Rasa 白板）上投射出绚烂的经验世界印记。',
      artTheme: 'locke_obscura'
    },
    {
      num: 12, id: 'hume', name: '休谟', en: 'David Hume (1711–1776)',
      houseTitle: '18世纪爱丁堡乔治亚帕拉第奥铜绿圆顶俱乐部',
      district: '第四街区 · 苏格兰启蒙运动新古典港',
      x: 192, z: 276, w: 20, d: 16, style: 'edinburgh_manor',
      robe: 0x991b1b, hair: 0xe2e8f0,
      portalId: 'portal_hume_billiard_causality',
      portalName: '爱丁堡绿绒台球因果碰撞实验桌 (Humean Billiard Causality Table)',
      conceptId: 'concept.hume.problem_of_causation',
      quote: '我们只看到一个台球撞击另一个台球的恒常联结，却从未在感官中看见过“必然因果力”本身；习惯是人生的伟大指南。',
      quoteOrig: 'Custom, then, is the great guide of human life · Reason is the slave of the passions',
      works: ['《人性论》A Treatise of Human Nature (1739)', '《人类理解研究》An Enquiry Concerning Human Understanding (1748)', '《道德原则研究》', '《自然宗教对话录》'],
      artTitle: '《大卫·休谟爱丁堡红袍肖像》与《绿绒台球桌》',
      artArtist: '艾伦·拉姆齐 (Allan Ramsay, 1766 · 苏格兰国家美术馆) & 夏尔丹 (Chardin)',
      artDesc: '苏格兰启蒙运动猩红金边礼服肖像与绿绒桌面上撞击的象牙台球，直观揭示“恒常联结并非先验必然因果”。',
      artTheme: 'hume_billiards'
    },
    {
      num: 13, id: 'hobbes_rousseau', name: '霍布斯与卢梭', en: 'Hobbes (1588–1679) & Rousseau (1712–1778)',
      houseTitle: '红白条纹航海利维坦主权灯塔 & 卢梭原木林屋',
      district: '第四街区 · 契约海岬灯塔与自然林屋',
      x: 246, z: 290, w: 18, d: 14, style: 'cotswold_abbey_tower',
      robe: 0x1e3a8a, hair: 0xcbd5e1,
      portalId: 'portal_social_contract_scale',
      portalName: '利维坦主权灯塔 & 自然公意天平 (Leviathan & General Will Scale)',
      conceptId: 'concept.political.social_contract',
      quote: '脱离公共权力的自然状态是一切人反对一切人的战争（霍布斯）；人生而自由，却无往不在枷锁之中（卢梭）。',
      quoteOrig: 'Bellum omnium contra omnes · L\'homme est né libre, et partout il est dans les fers',
      works: ['霍布斯《利维坦》Leviathan (1651)', '卢梭《社会契约论》Du Contrat Social (1762)', '卢梭《论人类不平等的起源和基础》', '卢梭《爱弥儿》Émile'],
      artTitle: '《利维坦主权巨神图》与《梦 · 原始自然森林》',
      artArtist: '亚伯拉罕·博斯 (Abraham Bosse, 1651) & 亨利·卢梭 (Henri Rousseau, 1910)',
      artDesc: '左半幅为由千万公民凝聚而成的持剑戴冠利维坦主权巨神，右半幅为苍翠自由的原始自然丛林与海岬灯塔。',
      artTheme: 'leviathan_forest'
    },

    // District 5: Kantian Synthesis & German Idealism (NE Königsberg Terrace)
    {
      num: 14, id: 'kant', name: '康德', en: 'Immanuel Kant (1724–1804)',
      houseTitle: '18世纪东普鲁士柯尼斯堡红砖宅邸 & 黄铜星空天文台穹顶',
      district: '第五街区 · 德意志古典哲学与柯尼斯堡台地',
      x: 242, z: 126, w: 20, d: 18, style: 'kant_konigsberg_manor',
      robe: 0x1e293b, hair: 0xf1f5f9,
      portalId: 'portal_kant_starry_moral',
      portalName: '先验范畴透镜仪 & 阁楼星空浑天仪 (Transcendental Categories & Starry Moral Loft)',
      conceptId: 'concept.kant.transcendental_critique',
      quote: '思维无内容是空的，直观无概念是盲的；有两样东西越思考越满怀敬畏：头上的星空和心中的道德律。',
      quoteOrig: 'Der bestirnte Himmel über mir und das moralische Gesetz in mir · Sapere aude!',
      works: ['《纯粹理性批判》Kritik der reinen Vernunft (1781)', '《实践理性批判》Kritik der praktischen Vernunft (1788)', '《判断力批判》Kritik der Urteilskraft (1790)', '《道德形而上学奠基》'],
      artTitle: '《康德与柯尼斯堡哲人》及《头上的星空与道德律》',
      artArtist: '埃米尔·多斯特 (Emil Doerstling, 1892) & 古典星空天体油画',
      artDesc: '深邃群青与鎏金旋转的柯尼斯堡星空之下，十二先验范畴金环折射出人类理性为自然立法、为道德自律的光芒。',
      artTheme: 'kant_starry'
    },
    {
      num: 15, id: 'hegel', name: '黑格尔', en: 'G. W. F. Hegel (1770–1831)',
      houseTitle: '19世纪柏林哥特双尖塔玫瑰窗大圣堂 & 辩证螺旋殿',
      district: '第五街区 · 柏林哥特双塔与辩证高地',
      x: 294, z: 92, w: 18, d: 18, style: 'hegel_cathedral_tower',
      robe: 0x312e81, hair: 0x64748b,
      portalId: 'portal_hegel_dialectic_spiral',
      portalName: '密涅瓦猫头鹰与正反合扬弃螺旋台 (Dialectical Sublation Spiral)',
      conceptId: 'concept.hegel.dialectical_sublation',
      quote: '凡是合乎理性的东西都是现实的；密涅瓦的猫头鹰要等黄昏到来，才会起飞。',
      quoteOrig: 'Die Eule der Minerva beginnt erst mit der einbrechenden Dämmerung ihren Flug',
      works: ['《精神现象学》Phänomenologie des Geistes (1807)', '《逻辑学（大逻辑）》Wissenschaft der Logik', '《哲学科学全书纲要》', '《法哲学原理》(1820)'],
      artTitle: '《黄昏起飞的密涅瓦猫头鹰与历史辩证螺旋》',
      artArtist: '雅各布·施莱辛格 (Jakob Schlesinger, 1831 · 柏林旧国家美术馆) & 浪漫主义暮色油画',
      artDesc: '绯红与紫金交织的黄昏天际线上，智慧女神密涅瓦的猫头鹰展翅飞越正·反·合三阶哥特尖塔，洞悉绝对精神的历史行程。',
      artTheme: 'hegel_owl'
    },
    {
      num: 16, id: 'marx', name: '马克思', en: 'Karl Marx (1818–1883)',
      houseTitle: '19世纪工业革命红砖双烟囱蒸汽工厂 & 大英玻璃穹顶',
      district: '第五街区 · 19世纪工业革命蒸汽齿轮坊',
      x: 266, z: 228, w: 20, d: 14, style: 'marx_grand_mill',
      robe: 0x18181b, hair: 0x27272a,
      portalId: 'portal_marx_base_superstructure',
      portalName: '经济基础与上层建筑黄铜齿轮传动仪 (Base & Superstructure Gears)',
      conceptId: 'concept.marx.historical_materialism',
      quote: '哲学家们只是用不同的方式解释世界，而问题在于改变世界。',
      quoteOrig: 'Die Philosophen haben die Welt nur verschieden interpretiert; es kömmt drauf an, sie zu verändern',
      works: ['《资本论（第一至三卷）》Das Kapital (1867)', '《共产党宣言》Manifest der Kommunistischen Partei (1848)', '《关于费尔巴哈的提纲》(1845)', '《1844年经济学哲学手稿》'],
      artTitle: '《工业革命轧铁工厂》与《历史唯物主义蒸汽巨轮》',
      artArtist: '阿道夫·门采尔 (Adolph Menzel, 1875 · 柏林旧国家美术馆) & 迭戈·里维拉壁画风格',
      artDesc: '炽热喷涌的工业炉火、咬合运转的黄铜生产力巨型齿轮与大英博物馆金色阅览室圆顶共同勾勒出历史唯物主义的洪流。',
      artTheme: 'marx_steam_iron'
    },

    // District 6: Existentialism & Language Analysis (North Alpine Summit & Forest)
    {
      num: 17, id: 'schopenhauer_kierkegaard', name: '叔本华与克尔凯郭尔', en: 'Schopenhauer & Kierkegaard (19th C.)',
      houseTitle: '19世纪哥本哈根北欧陡坡尖顶黑木红墙教堂屋',
      district: '第六街区 · 北欧峡湾与悬崖信仰栈道',
      x: 136, z: 66, w: 18, d: 14, style: 'alpine_stone_chalet',
      robe: 0x27272a, hair: 0xd4d4d8,
      portalId: 'portal_schopenhauer_pendulum',
      portalName: '生命意志钟摆与信仰之跃悬崖罗盘 (Pendulum of Will & Leap of Faith)',
      conceptId: 'concept.existential.will_and_leap',
      quote: '人生就像钟摆，在痛苦与无聊之间摆动（叔本华）；信仰是向荒谬的深渊纵身一跃（克尔凯郭尔）。',
      quoteOrig: 'Die Welt ist meine Vorstellung · Troens Ridder (信仰的骑士)',
      works: ['叔本华《作为意志和表象的世界》(1819)', '克尔凯郭尔《非此即彼》Either/Or (1843)', '克尔凯郭尔《恐惧与战栗》Fear and Trembling', '克尔凯郭尔《致死的疾病》'],
      artTitle: '《雾海上的旅人》(Wanderer above the Sea of Fog)',
      artArtist: '卡斯帕·大卫·弗里德里希 (Caspar David Friedrich, 1818 · 汉堡美术馆藏)',
      artDesc: '浪漫主义与存在哲思的巅峰象征：黑衣旅人独自伫立于陡峭悬崖之巅，面对翻涌无垠的盲目生命意志云海与信仰深渊。',
      artTheme: 'friedrich_wanderer'
    },
    {
      num: 18, id: 'nietzsche', name: '尼采', en: 'Friedrich Nietzsche (1844–1900)',
      houseTitle: '阿尔卑斯雪峰巨岩瞭望石堡 & 查拉图斯特拉黄金太阳轮祭坛',
      district: '第六街区 · 恩嘎丁高地雪峰之巅',
      x: 192, z: 48, w: 18, d: 14, style: 'nietzsche_alpine_chalet',
      robe: 0x451a03, hair: 0x5c3a21,
      portalId: 'portal_nietzsche_eternal_recurrence',
      portalName: '查拉图斯特拉巨石与永恒轮回沙漏 (Eternal Recurrence Hourglass)',
      conceptId: 'concept.nietzsche.eternal_recurrence',
      quote: '那些杀不死我的，使我更强大；这就是生命吗？好吧，那就再来一次（Amor Fati）！',
      quoteOrig: 'Was mich nicht umbringt, macht mich stärker · Also sprach Zarathustra',
      works: ['《查拉图斯特拉如是说》Also sprach Zarathustra (1883)', '《悲剧的诞生》Die Geburt der Tragödie (1872)', '《善恶的彼岸》Jenseits von Gut und Böse', '《道德的谱系》&《快乐的科学》'],
      artTitle: '《太阳 (The Sun)》与《弗里德里希·尼采肖像》',
      artArtist: '爱德华·蒙克 (Edvard Munch, 1906 / 1911 · 奥斯陆蒙克博物馆 & 奥斯陆大学)',
      artDesc: '恩嘎丁雪山之巅，一轮炽烈的黄金太阳喷薄出万丈光芒照耀深渊，查拉图斯特拉的巨鹰与盘蛇在正午阳光中翱翔。',
      artTheme: 'munch_sun'
    },
    {
      num: 19, id: 'wittgenstein', name: '维特根斯坦', en: 'Ludwig Wittgenstein (1889–1951)',
      houseTitle: '20世纪维也纳包豪斯现代主义纯白平顶几何落地玻璃屋',
      district: '第六街区 · 20世纪现代主义极简玻璃庭',
      x: 248, z: 68, w: 20, d: 14, style: 'wittgenstein_dual_villa',
      robe: 0x475569, hair: 0x64748b,
      portalId: 'portal_wittgenstein_duck_rabbit',
      portalName: '鸭兔双关体素雕塑与盒中甲虫木匣 (Duck-Rabbit & Beetle in a Box)',
      conceptId: 'concept.wittgenstein.language_games',
      quote: '我的语言的界限意味着我的世界的界限；凡是不可说的，对此必须保持沉默。',
      quoteOrig: 'Die Grenzen meiner Sprache bedeuten die Grenzen meiner Welt (TLP 5.6)',
      works: ['《逻辑哲学论》Tractatus Logico-Philosophicus (1921)', '《哲学研究》Philosophische Untersuchungen (1953)', '《蓝皮书与褐皮书》Blue and Brown Books', '《论确定性》On Certainty'],
      artTitle: '《红、黄、蓝的构成》与《哲学研究 · 鸭兔相位原图》',
      artArtist: '皮特·蒙德里安 (Piet Mondrian, 1930) & 约瑟夫·贾斯特罗 (Jastrow Duck-Rabbit, 1899)',
      artDesc: '前期《逻辑哲学论》如蒙德里安红黄蓝几何网格般精确映射世界逻辑图像，后期《哲学研究》以鸭兔转换揭示“语言游戏与面向转换”。',
      artTheme: 'mondrian_duckrabbit'
    },
    {
      num: 20, id: 'heidegger_sartre', name: '海德格尔与萨特', en: 'Heidegger (1889–1976) & Sartre (1905–1980)',
      houseTitle: '黑森林托特瑙山木瓦屋 & 巴黎左岸红白遮阳篷花神露天咖啡馆',
      district: '第六街区 · 黑森林空地与巴黎左岸咖啡座',
      x: 186, z: 106, w: 18, d: 14, style: 'black_forest_cafe_chalet',
      robe: 0x365314, hair: 0x3f3f46,
      portalId: 'portal_heidegger_hammer_sartre',
      portalName: '黑森林上手之锤与存在先于本质咖啡桌 (Ready-to-Hand Hammer & Freedom Café)',
      conceptId: 'concept.existential.being_and_freedom',
      quote: '人诗意地栖居在大地上（海德格尔）；存在先于本质，人被判定为自由（萨特）。',
      quoteOrig: 'Dichterisch wohnet der Mensch · L\'existence précède l\'essence',
      works: ['海德格尔《存在与时间》Sein und Zeit (1927)', '海德格尔《林中路 · 艺术作品的本源》(1950)', '萨特《存在与虚无》L\'Être et le Néant (1943)', '萨特《存在主义是一种人道主义》'],
      artTitle: '《一双农鞋》(梵高) 与《巴黎左岸夜咖啡馆》',
      artArtist: '文森特·梵高 (Vincent van Gogh, 1886 · 阿姆斯特丹梵高博物馆) & 爱德华·霍普风格',
      artDesc: '海德格尔在《艺术作品的本源》中以梵高《农鞋》揭示艺术即“存在者之真理的自行置入”；右翼映现萨特巴黎左岸花神咖啡馆的自由抉择。',
      artTheme: 'vangogh_shoes_cafe'
    }
  ];

  // ==========================================================================
  // ROADSIDE WAYFINDING FINGERPOSTS (路标系统) AT ALL MAJOR JUNCTIONS
  // ==========================================================================
  const WAYPOSTS = [
    {
      x: 192, z: 214, title: '🏛️ 中央阿哥拉广场路口',
      arms: [
        { dir: '北 ▲', label: '#1 苏格拉底广场 · #20 黑森林咖啡座 · #18 尼采雪峰', angle: 0 },
        { dir: '西北 ↖', label: '#3 亚里士多德吕克昂 · #2 柏拉图学院与地下洞穴', angle: -0.75 },
        { dir: '东北 ↗', label: '综合之桥 · #14 康德宅邸 · #15 黑格尔塔', angle: 0.75 },
        { dir: '南 ▼', label: '#12 休谟台球俱乐部 · #11 洛克暗箱洋房 · 惊奇海港', angle: 3.14 }
      ]
    },
    {
      x: 152, z: 162, title: '🏺 古希腊卫城分岔路口',
      arms: [
        { dir: '西北 ↖', label: '#3 亚里士多德吕克昂 (35m) · #2 柏拉图学院与洞穴 (85m)', angle: -0.8 },
        { dir: '西 ◀', label: '#4 芝诺斯多葛彩绘柱廊 (95m)', angle: -1.57 },
        { dir: '东南 ↘', label: '#1 苏格拉底中央广场 · 哲学图书馆', angle: 2.35 }
      ]
    },
    {
      x: 216, z: 160, title: '🌉 综合之桥南端路口',
      arms: [
        { dir: '北 ▲', label: '过【综合之桥】→ #14 康德柯尼斯堡宅邸 · #15 黑格尔螺旋塔', angle: 0.25 },
        { dir: '东 ▶', label: '#5 孔子杏坛书院 · #6 老子水车庐 · #7 庄子濠梁竹轩', angle: 1.57 },
        { dir: '东南 ↘', label: '#16 马克思唯物主义水力齿轮工坊', angle: 2.2 }
      ]
    },
    {
      x: 274, z: 176, title: '🎋 东方哲思竹林谷入口',
      arms: [
        { dir: '东 ▶', label: '#5 孔子杏坛大成书院 (22m)', angle: 1.57 },
        { dir: '东北 ↗', label: '#6 老子函谷水车云隐庐 (65m)', angle: 0.65 },
        { dir: '东南 ↘', label: '#7 庄子逍遥梦蝶水榭与濠梁桥 (68m)', angle: 2.4 }
      ]
    },
    {
      x: 136, z: 228, title: '📐 理性主义几何城路口',
      arms: [
        { dir: '西 ◀', label: '#8 笛卡尔冬日暖炉庄园 (34m) · #9 斯宾诺莎海牙磨镜坊', angle: -1.57 },
        { dir: '西南 ↙', label: '#10 莱布尼茨二进制与单子钟塔 (75m)', angle: -2.35 },
        { dir: '东北 ↗', label: '#1 苏格拉底中央辩证广场', angle: 0.78 }
      ]
    },
    {
      x: 192, z: 256, title: '⚓ 经验主义海湾港大道',
      arms: [
        { dir: '南 ▼', label: '#12 休谟爱丁堡台球俱乐部庄园 (20m)', angle: 3.14 },
        { dir: '西南 ↙', label: '#11 洛克白板暗箱观测洋房 (55m)', angle: -2.1 },
        { dir: '东南 ↘', label: '#13 霍布斯利维坦钟楼 & 卢梭林屋 (60m)', angle: 2.1 }
      ]
    },
    {
      x: 188, z: 128, title: '🏔️ 北峰存在主义登山口',
      arms: [
        { dir: '北 ▲', label: '#20 海德格尔黑森林木屋 & 萨特左岸咖啡座 (22m)', angle: 0 },
        { dir: '西北 ↖', label: '#17 叔本华意志钟摆山庄 & 克尔凯郭尔悬崖栈道', angle: -0.75 },
        { dir: '正北 ▲▲', label: '#18 尼采恩嘎丁高山之巅 · #19 维特根斯坦峡湾双联屋', angle: 0.2 }
      ]
    },
    {
      x: 108, z: 118, title: '🔥 柏拉图学院与吕克昂交界处',
      arms: [
        { dir: '西北 ↖', label: '#2 柏拉图阿卡德米神庙 & 地下洞穴寓言石窟 (30m)', angle: -0.8 },
        { dir: '东南 ↘', label: '#3 亚里士多德吕克昂漫步回廊庄园 (28m)', angle: 2.3 },
        { dir: '西南 ↙', label: '#4 芝诺斯多葛彩绘柱廊与二分跑道', angle: -2.1 }
      ]
    }
  ];

  // ==========================================================================
  // WORLD GENERATOR
  // ==========================================================================
  function create(seed) {
    const rnd = mulberry32(seed || 1781);
    const RI = (a, b) => a + Math.floor(rnd() * (b - a + 1));
    const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
    const blocks = new Uint8Array(W * D * H);
    const cols = new Uint8Array(W * D * H);
    const palette = [[1, 1, 1]];
    const palMap = new Map([['100,100,100', 0]]);
    function pal(r, g, b) {
      if (Array.isArray(r)) { b = r[2]; g = r[1]; r = r[0]; }
      const k = Math.round(r * 100) + ',' + Math.round(g * 100) + ',' + Math.round(b * 100);
      if (palMap.has(k)) return palMap.get(k);
      const i = palette.length; palette.push([r, g, b]); palMap.set(k, i); return i;
    }

    const C = {
      white: pal(0.97, 0.96, 0.92),
      grass: [pal(0.45, 0.72, 0.31), pal(0.42, 0.68, 0.28), pal(0.5, 0.76, 0.34)],
      meadow: [pal(0.54, 0.78, 0.36), pal(0.48, 0.72, 0.31)],
      dirt: pal(0.55, 0.42, 0.28),
      rock: [pal(0.68, 0.66, 0.62), pal(0.6, 0.58, 0.54), pal(0.75, 0.72, 0.68)],
      caveDark: pal(0.24, 0.26, 0.3),
      marble: pal(0.97, 0.95, 0.91),
      marbleGold: pal(0.96, 0.88, 0.68),
      terracotta: pal(0.84, 0.44, 0.32),
      cotswold: [pal(0.88, 0.81, 0.69), pal(0.84, 0.78, 0.66), pal(0.91, 0.84, 0.72)],
      honeyStone: pal(0.94, 0.85, 0.67),
      stoneL: pal(0.95, 0.92, 0.84),
      stoneD: pal(0.72, 0.67, 0.58),
      prussianBrick: pal(0.72, 0.31, 0.25),
      dutchBrick: pal(0.66, 0.26, 0.22),
      orientalRed: pal(0.78, 0.2, 0.16),
      orientalTile: pal(0.22, 0.3, 0.38),
      plaster: pal(0.96, 0.94, 0.89),
      slate: pal(0.28, 0.34, 0.42),
      roofV: pal(0.72, 0.7, 0.64),
      oak: pal(0.52, 0.35, 0.2),
      oakD: pal(0.34, 0.22, 0.13),
      beam: pal(0.98, 0.95, 0.88),
      cedar: pal(0.44, 0.3, 0.2),
      gold: pal(0.96, 0.8, 0.32),
      bronze: pal(0.7, 0.52, 0.28),
      billiardGreen: pal(0.14, 0.58, 0.34),
      crimson: pal(0.74, 0.18, 0.2),
      blueCarpet: pal(0.24, 0.4, 0.68),
      rose: pal(0.84, 0.58, 0.58),
      path: [pal(0.84, 0.8, 0.72), pal(0.78, 0.74, 0.66)],
      flag: pal(0.86, 0.82, 0.74),
      gravel: [pal(0.76, 0.7, 0.6), pal(0.7, 0.64, 0.54)],
      dry: pal(0.86, 0.82, 0.72),
      wheat: pal(0.98, 0.88, 0.38),
      bark: pal(0.46, 0.35, 0.25),
      leaf: [pal(0.36, 0.62, 0.27), pal(0.43, 0.68, 0.31), pal(0.54, 0.74, 0.33)],
      ginkgo: pal(0.96, 0.8, 0.22),
      bamboo: pal(0.36, 0.74, 0.36),
      cypress: pal(0.2, 0.42, 0.26),
      willow: pal(0.76, 0.9, 0.52),
      snow: pal(0.96, 0.98, 1.0),
      doors: [pal(0.58, 0.7, 0.58), pal(0.58, 0.72, 0.78), pal(0.72, 0.38, 0.3), pal(0.42, 0.5, 0.64)]
    };

    const WD = W * D;
    const idx = (x, y, z) => x + W * (z + D * y);
    const zi = (x, z) => x + W * z;
    const inb = (x, y, z) => x >= 0 && x < W && z >= 0 && z < D && y >= 0 && y < H;
    const get = (x, y, z) => (inb(x, y, z) ? blocks[idx(x, y, z)] : 0);
    function set(x, y, z, b, c) {
      if (!inb(x, y, z)) return;
      const i = idx(x, y, z);
      blocks[i] = b;
      cols[i] = (c == null ? 0 : Array.isArray(c) ? c[(x * 7 + y * 13 + z * 19) % c.length] : c);
    }
    const isAir = (x, y, z) => get(x, y, z) === 0;
    function box(x0, y0, z0, x1, y1, z1, b, c) {
      for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) set(x, y, z, b, c);
    }
    function clear(x0, y0, z0, x1, y1, z1) { box(x0, y0, z0, x1, y1, z1, B.AIR, 0); }

    const hm = new Uint8Array(W * D);
    const pathM = new Uint8Array(W * D);
    const occ = new Uint8Array(W * D);
    const landmarks = [], lamps = [], flags = [], chimneys = [], doors = [], seats = [], pasture = [], buildings = [], checks = [];
    const props = {
      roofs: [], gables: [], pots: [], flagpoles: [], chandeliers: [], candles: [], murals: [],
      palms: [], creepers: [], tufts: [], fences: [], swans: [], ducks: [], fish: [],
      wolds: true, philosopherPlaques: [], houseSigns: [], wayposts: [], waterwheels: [], caveStage: null,
      greekColumns: [], greekTemples: [], greekTholos: [], greekBraziers: [],
      orientalBuildings: [], orientalPaifang: [], lotusFlowers: [], eraLandmarks: [],
      museumExhibits: []
    };

    function lamp(x, y, z, inside, str) { set(x, y, z, B.LAMP, C.gold); lamps.push([x + 0.5, y + 0.5, z + 0.5, !!inside, str || 1]); }
    function candle(x, y, z) { props.candles.push({ x: x + 0.5, y, z: z + 0.5, one: true }); lamps.push([x + 0.5, y + 0.4, z + 0.5, true, 0.7]); }
    function door(x, y, z, face, col) { doors.push({ x, y, z, face: face || 's', open: false, col: col || C.oakD }); }
    function bench(x, y, z, yaw, col) { set(x, y, z, B.BENCH, col || C.oak); seats.push({ x: x + 0.5, y: y + 1, z: z + 0.5, yaw: yaw || 0 }); }
    function chair(x, y, z, yaw, col) { set(x, y, z, B.CHAIR, col || C.crimson); seats.push({ x: x + 0.5, y: y + 1, z: z + 0.5, yaw: yaw || 0 }); }
    function sofa(x, y, z, yaw, col) { set(x, y, z, B.SOFA, col || C.blueCarpet); seats.push({ x: x + 0.5, y: y + 1, z: z + 0.5, yaw: yaw || 0 }); }

    const chimSeen = {};
    function chimney(x, z, y0, y1, c, smoke) {
      for (let y = y0; y < y1; y++) set(x, y, z, B.RUBBLE, c);
      set(x, y1, z, B.LIMES, C.stoneL);
      const k = x + ',' + z; if (chimSeen[k]) return; chimSeen[k] = 1;
      props.pots.push([x + 0.5, y1 + 1, z + 0.5]);
      if (smoke) chimneys.push([x + 0.5, y1 + 1.6, z + 0.5]);
    }

    // Smooth Pitched Roof helper (same high-craft architecture as Bibury Arlington Row!)
    function roof(x0, z0, x1, z1, axis, y0, s, wallId, wallC, o) {
      o = o || {};
      const ax = axis === 'x', a0 = ax ? x0 : z0, a1 = ax ? x1 : z1, b0 = ax ? z0 : x0, b1 = ax ? z1 : x1;
      for (let a = a0; a <= a1; a++) for (let b = b0; b <= b1; b++) {
        const d = Math.min(b - b0, b1 - b), top = y0 + Math.floor(s * d + 1e-6);
        const gable = (a === a0 && o.g0 !== false) || (a === a1 && o.g1 !== false);
        for (let y = y0; y < top; y++) {
          const x = ax ? a : b, z = ax ? b : a;
          set(x, y, z, gable ? wallId : B.ROOF, gable ? wallC : C.roofV);
        }
      }
      const wallColArr = Array.isArray(wallC) ? palette[wallC[0]] : (palette[wallC] || [0.9, 0.85, 0.75]);
      props.roofs.push({
        x0, z0, x1, z1, axis, y0, s,
        ov: o.ov == null ? 0.36 : o.ov,
        og: o.og == null ? 0.2 : o.og,
        e0: o.e0 || 0, e1: o.e1 || 0,
        g0: o.g0 !== false, g1: o.g1 !== false,
        c: o.c || [0.82, 0.78, 0.7],
        gc: wallColArr,
        gt: o.gt || 'rubble'
      });
    }

    /* ================= 1. 384 x 384 ISLAND TERRAIN, RIVERS & PONDS ================= */
    const STREAM_MAIN = [[160, 20], [162, 85], [166, 138], [214, 156], [220, 218], [216, 290], [216, 368]];
    const STREAM_EAST = [[214, 156], [268, 154], [312, 146], [342, 130], [368, 120]];
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

    const PADS = PHILOSOPHERS.map((p) => {
      let targetH = 40;
      if (p.id === 'socrates') targetH = 40;
      else if (p.id === 'plato') targetH = 50;
      else if (p.id === 'aristotle') targetH = 41;
      else if (p.id === 'zeno') targetH = 43;
      else if (p.id === 'confucius' || p.id === 'laozi' || p.id === 'zhuangzi') targetH = 41;
      else if (p.id === 'descartes' || p.id === 'spinoza' || p.id === 'leibniz') targetH = 41;
      else if (p.id === 'locke' || p.id === 'hume' || p.id === 'hobbes_rousseau') targetH = 39;
      else if (p.id === 'kant') targetH = 42;
      else if (p.id === 'hegel') targetH = 45;
      else if (p.id === 'marx') targetH = 41;
      else if (p.id === 'schopenhauer_kierkegaard' || p.id === 'wittgenstein') targetH = 48;
      else if (p.id === 'nietzsche') targetH = 53;
      else if (p.id === 'heidegger_sartre') targetH = 44;
      return { x: p.x, z: p.z, r: Math.max(p.w, p.d) * 0.85 + 6, h: targetH, p };
    });

    const dStreamArr = new Float32Array(W * D);
    for (let z = 0; z < D; z++) {
      for (let x = 0; x < W; x++) {
        const i = zi(x, z);
        const n1 = fbm(x / 72, z / 72, 11, 4), n2 = fbm(x / 24, z / 24, 37, 2);
        const distCenter = Math.hypot((x - 192) / 176, (z - 192) / 176);
        const coastDrop = smooth(0.84, 1.05, distCenter) * 10;
        const northAlpine = smooth(150, 28, z) * (10 + n1 * 6);
        const nwClassical = smooth(175, 55, x) * smooth(185, 65, z) * 6;
        const neTerrace = smooth(195, 290, x) * smooth(195, 70, z) * 4;
        let h = 39.8 + (n1 - 0.45) * 4.0 + (n2 - 0.5) * 1.1 + northAlpine + nwClassical + neTerrace - coastDrop;

        for (const pad of PADS) {
          const d = Math.hypot(x - pad.x, z - pad.z);
          if (d < pad.r + 14) {
            const w = smooth(pad.r + 14, pad.r - 1, d);
            h = h * (1 - w) + pad.h * w;
          }
        }

        const ds = Math.min(polyDist(x, z, STREAM_MAIN), polyDist(x, z, STREAM_EAST));
        dStreamArr[i] = ds;
        if (ds < 8.0) {
          const cut = smooth(8.0, 2.6, ds);
          h = h * (1 - cut) + (WATER_Y - 1.5) * cut;
        }

        const hi = clamp(Math.round(h), 32, 74);
        hm[i] = hi;
        for (let y = 0; y < hi - 3; y++) set(x, y, z, B.ROCK, C.rock);
        for (let y = Math.max(0, hi - 3); y < hi - 1; y++) set(x, y, z, B.DIRT, C.dirt);
        if (hi <= Math.floor(WATER_Y)) {
          set(x, hi - 1, z, B.GRAVEL, C.gravel);
        } else if (hi >= 51 && z < 75) {
          set(x, hi - 1, z, B.SNOW, C.snow);
        } else if (ds < 14) {
          set(x, hi - 1, z, B.MEADOW, C.meadow);
        } else {
          set(x, hi - 1, z, B.GRASS, C.grass);
        }
      }
    }

    // Dry-stone walls & golden wheat / rapeseed fields in the outer countryside (adds rich rural life!)
    for (let z = 24; z < D - 24; z++) {
      for (let x = 24; x < W - 24; x++) {
        const i = zi(x, z), y = hm[i];
        if (y <= 38 || y >= 47 || dStreamArr[i] < 12) continue;
        const dAgora = Math.hypot(x - 192, z - 196);
        if (dAgora < 120 || dAgora > 162) continue;
        let nearPhil = false;
        for (const p of PHILOSOPHERS) if (Math.hypot(x - p.x, z - p.z) < 22) { nearPhil = true; break; }
        if (nearPhil) continue;
        if ((x + 11) % 34 === 0 || (z + 7) % 30 === 0) {
          set(x, y, z, B.DRYW, C.dry); occ[i] = 1;
        } else {
          const fk = hash3(Math.floor((x + 11) / 34), 7, Math.floor((z + 7) / 30));
          if (fk < 0.25) set(x, y - 1, z, B.WHEAT, C.wheat);
          else if (fk > 0.65) pasture.push([x, z]);
        }
      }
    }

    /* ================= 2. SCENIC BOULEVARDS, STONE BRIDGES & LANTERNS ================= */
    function paveRoad(ax, az, bx, bz, width, blockType, colPalette, addLanterns) {
      const dist = Math.hypot(bx - ax, bz - az);
      const steps = Math.ceil(dist * 1.5);
      for (let s = 0; s <= steps; s++) {
        const t = s / steps;
        const cx = Math.round(ax + (bx - ax) * t), cz = Math.round(az + (bz - az) * t);
        for (let dz = -width; dz <= width; dz++) {
          for (let dx = -width; dx <= width; dx++) {
            if (dx * dx + dz * dz > width * width + 0.6) continue;
            const px = cx + dx, pz = cz + dz;
            if (!inb(px, 40, pz)) continue;
            const i = zi(px, pz), y = hm[i];
            if (y > Math.floor(WATER_Y)) {
              set(px, y - 1, pz, blockType || B.PATH, colPalette || C.path);
              for (let cy = y; cy <= y + 3; cy++) {
                const qb = get(px, cy, pz);
                if (qb === B.DRYW || qb === B.WHEAT || qb === B.HEDGE) set(px, cy, pz, B.AIR, 0);
              }
              pathM[i] = 1; occ[i] = 1;
            }
          }
        }
        // Street lanterns along major boulevards every 18m
        if (addLanterns && s > 6 && s < steps - 6 && s % 26 === 0) {
          const nx = Math.round(-(bz - az) / dist * (width + 2));
          const nz = Math.round((bx - ax) / dist * (width + 2));
          const lx = cx + nx, lz = cz + nz;
          if (inb(lx, 45, lz) && hm[zi(lx, lz)] > WATER_Y + 1 && !occ[zi(lx, lz)]) {
            const ly = hm[zi(lx, lz)];
            set(lx, ly, lz, B.LIMES, C.stoneL);
            set(lx, ly + 1, lz, B.IRON, C.oakD);
            set(lx, ly + 2, lz, B.IRON, C.oakD);
            lamp(lx, ly + 3, lz, false, 1.1);
            occ[zi(lx, lz)] = 1;
          }
        }
      }
    }

    // Grand Processional Roads connecting the 6 Districts
    paveRoad(192, 330, 192, 196, 3, B.FLAGS, C.flag, true);          // South Harbor -> Socrates Agora
    paveRoad(192, 196, 132, 138, 2, B.PATH, C.path, true);           // Agora -> Aristotle Lyceum
    paveRoad(132, 138, 84, 98, 2, B.FLAGS, C.marble, true);          // Aristotle -> Plato Academy
    paveRoad(84, 98, 52, 146, 2, B.PATH, C.path, false);             // Plato -> Zeno Stoa
    paveRoad(192, 184, 242, 126, 2, B.FLAGS, C.flag, true);          // Agora -> Bridge of Synthesis -> Kant
    paveRoad(242, 126, 294, 92, 2, B.PATH, C.path, true);            // Kant -> Hegel
    paveRoad(216, 160, 266, 228, 2, B.PATH, C.path, false);          // Synthesis Junction -> Marx
    paveRoad(216, 160, 296, 176, 2, B.PATH, C.gravel, true);         // Synthesis Junction -> Confucius
    paveRoad(296, 176, 332, 128, 2, B.PATH, C.gravel, false);        // Confucius -> Laozi
    paveRoad(296, 176, 328, 226, 2, B.PATH, C.gravel, false);        // Confucius -> Zhuangzi
    paveRoad(192, 210, 102, 236, 2, B.PARQ, C.marble, true);         // Agora -> Descartes
    paveRoad(102, 236, 58, 248, 2, B.PARQ, C.marble, false);         // Descartes -> Spinoza
    paveRoad(102, 236, 78, 292, 2, B.PARQ, C.marble, false);         // Descartes -> Leibniz
    paveRoad(192, 276, 142, 288, 2, B.PATH, C.path, true);           // Hume -> Locke
    paveRoad(192, 276, 246, 290, 2, B.PATH, C.path, true);           // Hume -> Hobbes & Rousseau
    paveRoad(192, 180, 186, 106, 2, B.PATH, C.path, true);           // Agora -> Heidegger & Sartre
    paveRoad(186, 106, 136, 66, 2, B.PATH, C.path, false);           // Heidegger -> Schopenhauer
    paveRoad(186, 106, 192, 48, 2, B.PATH, C.path, true);            // Heidegger -> Nietzsche Alpine Peak
    paveRoad(186, 106, 248, 68, 2, B.PATH, C.path, false);           // Heidegger -> Wittgenstein

    // Build Three-Arch Stone Bridges across the Stream of Experience!
    function buildStoneBridge(bx0, bx1, bz0, bz1, deckY) {
      const midX = (bx0 + bx1) / 2;
      for (let x = bx0; x <= bx1; x++) {
        const archLift = Math.round(Math.cos(((x - midX) / ((bx1 - bx0) / 2)) * 1.3) * 1.6);
        const yTop = deckY + Math.max(0, archLift);
        for (let z = bz0; z <= bz1; z++) {
          const isArchHole = Math.abs(x - midX) <= 3 || Math.abs(x - (bx0 + 3)) <= 1 || Math.abs(x - (bx1 - 3)) <= 1;
          for (let y = 34; y < yTop; y++) {
            if (isArchHole && y < yTop - 1 && y >= 36) set(x, y, z, B.AIR, 0);
            else set(x, y, z, B.BATH, C.honeyStone);
          }
          set(x, yTop - 1, z, B.FLAGS, C.stoneL);
          for (let y = yTop; y <= yTop + 4; y++) set(x, y, z, B.AIR, 0);
          if (z === bz0 || z === bz1) {
            set(x, yTop, z, B.BALUS, C.stoneL);
            if (x === bx0 || x === bx1 || x === Math.round(midX)) {
              set(x, yTop + 1, z, B.LIMEC, C.stoneL);
              if (x === Math.round(midX)) lamp(x, yTop + 2, z, false, 1.2);
            }
          }
          hm[zi(x, z)] = yTop;
          pathM[zi(x, z)] = 1; occ[zi(x, z)] = 1;
        }
      }
    }
    // 1. Bridge of Synthesis (综合之桥: connecting Agora to Kant's NE Terrace at x:204..224, z:153..159)
    buildStoneBridge(204, 224, 153, 159, 41);
    // 2. Empiricist Harbor Bridge (connecting Hume to Hobbes/Rousseau at x:208..224, z:280..286)
    buildStoneBridge(208, 224, 280, 286, 40);

    landmarks.push({
      id: 'bridge_synthesis', name: '综合之桥 (唯理论×经验论汇合)', en: 'Bridge of Synthesis (to Kant)',
      x: 214, z: 156, top: 43, r: 14, tp: { mode: 'walk', p: [203.5, 41, 156.5], t: [242, 44, 126] }
    });

    // Register Roadside Wayfinding Fingerposts
    WAYPOSTS.forEach((wp) => {
      const wy = hm[zi(wp.x, wp.z)];
      props.wayposts.push({ x: wp.x + 0.5, y: wy, z: wp.z + 0.5, title: wp.title, arms: wp.arms });
    });

    /* ================= 3. ARCHITECTURAL HOUSE BUILDERS FOR ALL 20 PHILOSOPHERS ================= */
    const SOFT = new Uint8Array(256);
    for (const b of [B.GRASS, B.DIRT, B.ROCK, B.MEADOW, B.GRAVEL, B.BEECH, B.BARK, B.WILLOW, B.YEW, B.HEDGE, B.FLOWER, B.WHEAT, B.DRYW]) SOFT[b] = 1;

    function levelPlot(x0, z0, x1, z1, gy, floorId, floorC) {
      for (let z = z0 - 3; z <= z1 + 3; z++) {
        for (let x = x0 - 3; x <= x1 + 3; x++) {
          if (!inb(x, gy, z)) continue;
          const i = zi(x, z);
          for (let y = 32; y < gy; y++) set(x, y, z, B.DIRT, C.dirt);
          for (let y = gy; y <= gy + 20; y++) if (SOFT[get(x, y, z)]) set(x, y, z, B.AIR, 0);
          const inside = x >= x0 && x <= x1 && z >= z0 && z <= z1;
          set(x, gy - 1, z, inside ? floorId : B.FLAGS, inside ? floorC : C.flag);
          hm[i] = gy;
          if (inside) occ[i] = 1; else pathM[i] = 1;
        }
      }
      // Low dry-stone courtyard garden wall with front entrance gap & flower beds!
      const cx = Math.round((x0 + x1) / 2);
      for (let x = x0 - 3; x <= x1 + 3; x++) {
        if (Math.abs(x - cx) > 2) {
          set(x, gy, z1 + 3, B.DRYW, C.dry);
          if (x % 2 === 0 && isAir(x, gy, z1 + 2)) set(x, gy, z1 + 2, B.FLOWER, C.white);
        }
      }
    }

    function buildPortalPedestal(px, py, pz, phil) {
      // Pure warm gallery illumination (no bulky voxel pillar or floating black lamp cube blocking the north oil painting!)
      lamps.push([px + 0.5, py + 3.4, pz + 0.5, true, 1.5]);
      props.philosopherPlaques.push({ x: px + 0.5, y: py, z: pz + 0.5, phil });
    }

    // Master Architectural House Template (Multi-windowed stone/brick walls, drip moulds, gabled dormers, smooth pitched roof, chimney with smoke, fireplace, chandelier, bookshelves, rug & upper mezzanine!)
    function buildMasterResidence(p, x0, z0, x1, z1, gy, opts) {
      const wallId = opts.wallId || B.RUBBLE;
      const wallC = opts.wallC || C.cotswold;
      const quoinC = opts.quoinC || C.stoneL;
      const roofC = opts.roofC || [0.78, 0.75, 0.68];
      const floorId = opts.floorId || B.PLANKS;
      const floorC = opts.floorC || C.oak;
      const wallH = opts.wallH || 6;
      const roofSlope = opts.slope || 1.15;

      levelPlot(x0, z0, x1, z1, gy, floorId, floorC);

      // 1. Exterior Walls with Ashlar Quoins (corner stones), Plinth & String Course
      for (let y = gy; y < gy + wallH; y++) {
        for (let z = z0; z <= z1; z++) {
          for (let x = x0; x <= x1; x++) {
            const onX = x === x0 || x === x1, onZ = z === z0 || z === z1;
            if (!onX && !onZ) continue;
            const isCorner = onX && onZ;
            const isQuoin = isCorner && ((y - gy) % 2 === 0);
            set(x, y, z, isQuoin ? B.BATH : wallId, isQuoin ? quoinC : wallC);
          }
        }
      }

      // 2. Front Porch Archway (South wall z1 at p.x)
      clear(p.x - 1, gy, z1, p.x + 1, gy + 2, z1);
      set(p.x - 2, gy, z1 + 1, B.LIMEC, quoinC); set(p.x - 2, gy + 1, z1 + 1, B.LIMEC, quoinC); set(p.x - 2, gy + 2, z1 + 1, B.LIMES, quoinC);
      set(p.x + 2, gy, z1 + 1, B.LIMEC, quoinC); set(p.x + 2, gy + 1, z1 + 1, B.LIMEC, quoinC); set(p.x + 2, gy + 2, z1 + 1, B.LIMES, quoinC);
      for (let x = p.x - 2; x <= p.x + 2; x++) set(x, gy + 3, z1 + 1, B.HOOD, quoinC);
      lamps.push([p.x - 2.5, gy + 3.2, z1 + 2.2, false, 1.0]);
      lamps.push([p.x + 3.5, gy + 3.2, z1 + 2.2, false, 1.0]);

      // 3. Multi-light Mullioned Casement Windows with Stone Drip Moulds (B.HOOD) — leaving central Museum Gallery Wall bays solid!
      for (let x = x0 + 2; x <= x1 - 2; x++) {
        if (Math.abs(x - p.x) <= 3) continue;
        if ((x - x0) % 3 !== 0) {
          set(x, gy + 1, z1, B.CASE, 0); set(x, gy + 2, z1, B.CASE, 0); set(x, gy + 3, z1, B.HOOD, quoinC);
          set(x, gy + 1, z0, B.CASE, 0); set(x, gy + 2, z0, B.CASE, 0); set(x, gy + 3, z0, B.HOOD, quoinC);
        }
      }
      for (let z = z0 + 2; z <= z1 - 2; z++) {
        if (Math.abs(z - p.z) <= 2) continue;
        set(x0, gy + 1, z, B.CASE, 0); set(x0, gy + 2, z, B.CASE, 0); set(x0, gy + 3, z, B.HOOD, quoinC);
        set(x1, gy + 1, z, B.CASE, 0); set(x1, gy + 2, z, B.CASE, 0); set(x1, gy + 3, z, B.HOOD, quoinC);
      }

      // 4. Smooth Pitched Roof with Gable Infills + Gabled Front Dormer!
      const yRoof = gy + wallH;
      roof(x0, z0, x1, z1, 'x', yRoof, roofSlope, wallId, wallC, { c: roofC, gt: opts.gt || 'rubble' });

      if (opts.dormer !== false) {
        for (let dx = -1; dx <= 1; dx++) {
          for (let dz = 0; dz <= 2; dz++) {
            set(p.x + dx, yRoof, z1 - dz, wallId, wallC);
            set(p.x + dx, yRoof + 1, z1 - dz, wallId, wallC);
          }
        }
        set(p.x, yRoof, z1, B.CASE, 0); set(p.x, yRoof + 1, z1, B.HOOD, quoinC);
        roof(p.x - 1, z1 - 2, p.x + 1, z1, 'z', yRoof + 2, 1.15, wallId, wallC, { c: roofC, g0: false, g1: true, e0: 1.5, og: 0.12, ov: 0.22 });
      }

      // 5. Stone Fireplace Hearth (in SE corner to keep East Museum Wall clear!), Chimney Stack & Clay Pot with Smoke
      const fz = z1 - 2;
      for (let y = gy; y <= gy + 3; y++) {
        set(x1 - 1, y, fz - 1, wallId, wallC);
        set(x1 - 1, y, fz + 1, wallId, wallC);
      }
      set(x1 - 1, gy, fz, B.FIRE, C.gold);
      set(x1 - 1, gy + 1, fz, B.OAK, C.oakD);
      set(x1 - 1, gy + 2, fz, wallId, wallC);
      chimney(x1, fz, yRoof + 2, yRoof + 6, wallC, true);

      // 6. Rich Museum Exhibition Gallery Interior: Red-Gold Carpet Runner, Corner Bookcases & Chandelier
      for (let z = p.z - 3; z <= p.z + 3; z++) for (let x = p.x - 4; x <= p.x + 4; x++) set(x, gy - 1, z, B.RUG, 0);
      for (const bx of [x0 + 2, x0 + 3, x1 - 3, x1 - 2]) {
        if (Math.abs(bx - p.x) > 3) {
          set(bx, gy, z0 + 1, B.BOOKS, C.oakD);
          set(bx, gy + 1, z0 + 1, B.BOOKS, C.oakD);
          set(bx, gy + 2, z0 + 1, B.OAKC, C.oakD);
        }
      }
      props.chandeliers.push({ x: p.x + 0.5, y: gy + 4.5, z: p.z + 0.5, top: gy + 7, r: 1.1, candles: 8, kind: 'ring' });
      chair(x0 + 2, gy, z1 - 2, Math.PI / 4, C.crimson);

      // 7. Climbing Ivy / Wisteria / Roses on Exterior Facade
      props.creepers.push({ x: x0 + 1, y: gy, z: z1 + 1, w: 3, h: 4.2, face: '+z', kind: opts.creeper || 'ivy' });
      props.creepers.push({ x: x1 - 4, y: gy, z: z1 + 1, w: 3, h: 3.8, face: '+z', kind: 'rose' });
    }

    // =========================================================================
    // CLASSICAL ANCIENT GREEK PERIPTERAL TEMPLE BUILDER (雅典帕特农/爱奥尼神庙建筑引擎)
    // =========================================================================
    function buildGreekTemple(p, x0, z0, x1, z1, gy, opts) {
      opts = opts || {};
      const colH = opts.colH || 6;
      const nFront = opts.nFront || 6;
      const nSide = opts.nSide || 6;
      const order = opts.order || 'doric';
      const roofSlope = opts.slope || 0.32;
      const roofC = opts.roofC || [0.86, 0.44, 0.31];

      // 1. 3-Step Pentelic Marble Crepidoma & Stylobate Mosaic Floor
      for (let z = z0 - 4; z <= z1 + 4; z++) {
        for (let x = x0 - 4; x <= x1 + 4; x++) {
          if (!inb(x, gy, z)) continue;
          const i = zi(x, z);
          for (let y = 32; y < gy; y++) set(x, y, z, B.DIRT, C.dirt);
          for (let y = gy; y <= gy + 22; y++) if (SOFT[get(x, y, z)]) set(x, y, z, B.AIR, 0);
          const inStylobate = x >= x0 && x <= x1 && z >= z0 && z <= z1;
          const inStep2 = x >= x0 - 1 && x <= x1 + 1 && z >= z0 - 1 && z <= z1 + 1;
          const inStep1 = x >= x0 - 2 && x <= x1 + 2 && z >= z0 - 2 && z <= z1 + 2;
          if (inStylobate) {
            const isBorder = x === x0 || x === x1 || z === z0 || z === z1 || x === x0 + 2 || x === x1 - 2 || z === z0 + 2 || z === z1 - 2;
            const isGoldKey = ((x + z) % 2 === 0) && !isBorder;
            set(x, gy - 1, z, isGoldKey ? B.PARQ : B.MARBLE, isBorder ? C.marbleGold : C.marble);
            occ[i] = 1;
          } else if (inStep2) {
            set(x, gy - 1, z, B.MARBLE, C.marble);
            pathM[i] = 1;
          } else if (inStep1) {
            set(x, gy - 1, z, B.LIMES, C.marbleGold);
            pathM[i] = 1;
          } else {
            set(x, gy - 1, z, B.FLAGS, C.marble);
            pathM[i] = 1;
          }
          hm[i] = gy;
        }
      }

      // 2. Peripteral Fluted Marble Colonnade (True 3D 20-Flute Entasis Columns in props.greekColumns)
      for (let i = 0; i < nFront; i++) {
        const t = i / (nFront - 1);
        const cxCol = (x0 + 0.5) + t * (x1 - x0);
        props.greekColumns.push({ x: cxCol, y: gy, z: z1 + 0.5, h: colH, r: 0.48, order });
        props.greekColumns.push({ x: cxCol, y: gy, z: z0 + 0.5, h: colH, r: 0.48, order });
      }
      for (let j = 1; j < nSide - 1; j++) {
        const t = j / (nSide - 1);
        const czCol = (z0 + 0.5) + t * (z1 - z0);
        props.greekColumns.push({ x: x0 + 0.5, y: gy, z: czCol, h: colH, r: 0.48, order });
        props.greekColumns.push({ x: x1 + 0.5, y: gy, z: czCol, h: colH, r: 0.48, order });
      }

      // 3. Inner Naos / Cella Sanctuary or Propylaea Processional Gateway
      const nx0 = x0 + 3, nx1 = x1 - 3, nz0 = z0 + 3, nz1 = z1 - 3;
      if (opts.openGateway) {
        // Propylaea Wings: flanking marble pavilions with wide open central sacred avenue
        for (let y = gy; y < gy + colH; y++) {
          const isFrieze = y === gy + colH - 1;
          for (const [wx0, wx1] of [[x0 + 1, p.x - 4], [p.x + 4, x1 - 1]]) {
            for (let x = wx0; x <= wx1; x++) {
              set(x, y, z0 + 1, isFrieze ? B.GOLD : B.LIMES, isFrieze ? C.marbleGold : C.marble);
              set(x, y, z1 - 1, isFrieze ? B.GOLD : B.LIMES, isFrieze ? C.marbleGold : C.marble);
            }
            for (let z = z0 + 1; z <= z1 - 1; z++) {
              set(wx0, y, z, isFrieze ? B.GOLD : B.LIMES, isFrieze ? C.marbleGold : C.marble);
              set(wx1, y, z, isFrieze ? B.GOLD : B.LIMES, isFrieze ? C.marbleGold : C.marble);
            }
          }
        }
        // Inner colonnade lining the Sacred Avenue
        props.greekColumns.push({ x: p.x - 2.6, y: gy, z: p.z + 0.5, h: colH, r: 0.44, order: 'ionic' });
        props.greekColumns.push({ x: p.x + 3.6, y: gy, z: p.z + 0.5, h: colH, r: 0.44, order: 'ionic' });
      } else {
        // Inner Cella / Naos Sanctuary Walls in Pentelic Marble Ashlar + Golden Meander Band
        for (let y = gy; y < gy + colH; y++) {
          const isFrieze = y === gy + colH - 1;
          const isPlinth = y === gy;
          const bId = isFrieze ? B.GOLD : B.LIMES;
          const bCol = isFrieze || isPlinth ? C.marbleGold : C.marble;
          for (let x = nx0; x <= nx1; x++) {
            if (Math.abs(x - p.x) > 2) set(x, y, nz1, bId, bCol);
            if (!opts.openBack || Math.abs(x - p.x) > 2) set(x, y, nz0, bId, bCol);
          }
          for (let z = nz0; z <= nz1; z++) {
            const isSideWindow = (y === gy + 2 || y === gy + 3) && ((z - nz0) % 4 === 2);
            if (!isSideWindow) {
              set(nx0, y, z, bId, bCol);
              set(nx1, y, z, bId, bCol);
            }
          }
        }
        // Pronaos Antae Ionic Columns framing the grand Naos entrance
        props.greekColumns.push({ x: p.x - 2.2, y: gy, z: nz1 + 0.5, h: colH, r: 0.42, order: 'ionic' });
        props.greekColumns.push({ x: p.x + 3.2, y: gy, z: nz1 + 0.5, h: colH, r: 0.42, order: 'ionic' });

        // Classical Scroll Shelves, Marble Benches & Golden Ring Chandelier inside Naos
        for (let x = nx0 + 2; x <= nx0 + 5; x++) {
          set(x, gy, nz0 + 1, B.BOOKS, C.oak);
          set(x, gy + 1, nz0 + 1, B.BOOKS, C.oak);
        }
        for (let x = nx1 - 5; x <= nx1 - 2; x++) {
          set(x, gy, nz0 + 1, B.BOOKS, C.oak);
          set(x, gy + 1, nz0 + 1, B.BOOKS, C.oak);
        }
        bench(nx0 + 2, gy, p.z, Math.PI / 2, C.marble);
        bench(nx1 - 2, gy, p.z, -Math.PI / 2, C.marble);
        props.chandeliers.push({ x: p.x + 0.5, y: gy + colH - 1.2, z: p.z + 0.5, top: gy + colH + 1, r: 1.45, candles: 12, kind: 'ring' });
      }

      // 4. Classical Entablature Architrave, Coffered Ceiling & Low-Pitched Temple Pediment Roof
      const yEnt = gy + colH;
      for (let z = z0; z <= z1; z++) {
        for (let x = x0; x <= x1; x++) {
          const onRim = x === x0 || x === x1 || z === z0 || z === z1;
          set(x, yEnt, z, onRim ? B.LIMES : B.COFFER, onRim ? C.marble : C.marbleGold);
        }
      }
      roof(x0, z0, x1, z1, 'z', yEnt + 1, roofSlope, B.MARBLE, C.marble, {
        c: roofC, gt: 'marble', ov: 0.65, og: 0.5
      });

      // 5. Classical Bronze Tripod Sacred Fire Braziers flanking the South Entrance
      props.greekBraziers.push({ x: p.x - 3.8, y: gy, z: z1 + 2.4 });
      props.greekBraziers.push({ x: p.x + 4.8, y: gy, z: z1 + 2.4 });
      lamps.push([p.x - 3.5, gy + 1.8, z1 + 2.4, false, 1.35]);
      lamps.push([p.x + 4.5, gy + 1.8, z1 + 2.4, false, 1.35]);

      // 6. Register 3D Sculpted Frieze, Triglyphs, Metopes, Tympanum Pediment Sculptures, Acroteria & Naos Statue!
      props.greekTemples.push({
        x0, z0, x1, z1, gy, colH, slope: roofSlope, order,
        hasStatue: opts.hasStatue !== false && !opts.openGateway,
        statueX: p.x + 0.5,
        statueZ: nz0 + 1.8,
        deity: opts.deity || 'athena',
        inscription: opts.inscription || `${p.name} · ${p.houseTitle}`
      });
    }

    // Build The Propylaea of Athens (雅典卫城圣门) at the South Entrance to the Central Agora (x: 192, z: 214)
    {
      const pGy = hm[zi(192, 214)];
      buildGreekTemple(
        { x: 192, z: 214, id: 'propylaea', name: '雅典卫城圣门', houseTitle: 'Propylaea of Athens' },
        183, 211, 201, 217, pGy,
        {
          colH: 6, nFront: 6, nSide: 3, order: 'doric', openGateway: true, hasStatue: false,
          roofC: [0.86, 0.44, 0.31],
          inscription: 'ΓΝΩΘΙ ΣΕΑΥΤΟΝ · 认识你自己 · 雅典哲学卫城圣门 (PROPYLAEA)'
        }
      );
      // Keep the central Sacred Avenue completely clear for walking straight through!
      for (let z = 209; z <= 219; z++) {
        for (let x = 189; x <= 195; x++) {
          set(x, pGy - 1, z, (x + z) % 2 === 0 ? B.MARBLE : B.PARQ, C.marble);
          pathM[zi(x, z)] = 1; occ[zi(x, z)] = 0;
        }
      }
      landmarks.push({
        id: 'athens_propylaea', name: '雅典卫城山门 · 认识你自己 (Propylaea)', en: 'The Propylaea of Athens · Sacred Gateway',
        x: 192, z: 214, top: pGy + 8, r: 14,
        tp: { mode: 'walk', p: [192.5, pGy, 224.5], t: [192.5, pGy + 3.5, 214] }
      });
    }

    PHILOSOPHERS.forEach((p) => {
      const hw = Math.floor(p.w / 2), hd = Math.floor(p.d / 2);
      const x0 = p.x - hw, x1 = p.x + hw, z0 = p.z - hd, z1 = p.z + hd;
      const gy = hm[zi(p.x, p.z)];
      p.gy = gy;

      // ----------------------------------------------------------------------
      // 1. SOCRATES — Classical Delphi Tholos Rotunda Temple (雅典阿哥拉 · 德尔斐二十柱圆亭神庙)
      // ----------------------------------------------------------------------
      if (p.id === 'socrates') {
        for (let dz = -13; dz <= 13; dz++) {
          for (let dx = -13; dx <= 13; dx++) {
            const px = p.x + dx, pz = p.z + dz, i = zi(px, pz);
            for (let y = 32; y < gy; y++) set(px, y, pz, B.DIRT, C.dirt);
            for (let y = gy; y <= gy + 20; y++) if (SOFT[get(px, y, pz)]) set(px, y, pz, B.AIR, 0);
            const r = Math.hypot(dx, dz);
            if (r <= 11.2) {
              const isRing = Math.abs(r - 9.0) < 0.8 || Math.abs(r - 5.2) < 0.7;
              set(px, gy - 1, pz, isRing ? B.MARBLE : B.PARQ, (Math.floor(r) % 2 === 0) ? C.marble : C.marbleGold);
              pathM[i] = 1;
            } else {
              set(px, gy - 1, pz, B.FLAGS, C.marble);
              pathM[i] = 1;
            }
            hm[i] = gy;
          }
        }
        bench(p.x - 4, gy, p.z, Math.PI / 2, C.marble);
        bench(p.x + 4, gy, p.z, -Math.PI / 2, C.marble);
        bench(p.x, gy, p.z - 4, 0, C.marble);
        props.chandeliers.push({ x: p.x + 0.5, y: gy + 5.2, z: p.z + 0.5, top: gy + 7.5, r: 1.5, candles: 12, kind: 'ring' });
        props.greekTholos.push({
          x: p.x + 0.5, y: gy, z: p.z + 0.5, rOuter: 8.8, rInner: 5.4, colH: 6.2,
          inscription: 'ΣΩΚΡΑΤΗΣ · 雅典阿哥拉德尔斐圆亭神庙 · 未经审视的人生是不值得过的'
        });
        props.greekBraziers.push({ x: p.x - 3.5, y: gy, z: p.z + 9.8 });
        props.greekBraziers.push({ x: p.x + 4.5, y: gy, z: p.z + 9.8 });
        buildPortalPedestal(p.x, gy, p.z, p);
      }

      // ----------------------------------------------------------------------
      // 2. PLATO — RAPHAEL'S THE SCHOOL OF ATHENS (拉斐尔《雅典学院》高度还原大殿) + Underground Cave!
      // ----------------------------------------------------------------------
      else if (p.id === 'plato') {
        // Monumental travertine acropolis terrace (3D Bramante basilica in props.js stands on it; no voxel walls → zero clipping)
        for (let z = z0 - 5; z <= z1 + 12; z++) {
          for (let x = x0 - 5; x <= x1 + 5; x++) {
            if (!inb(x, gy, z)) continue;
            const i = zi(x, z);
            for (let y = 32; y < gy; y++) set(x, y, z, B.DIRT, C.dirt);
            for (let y = gy; y <= gy + 26; y++) if (SOFT[get(x, y, z)]) set(x, y, z, B.AIR, 0);
            const inHall = x >= x0 && x <= x1 && z >= z0 && z <= z1;
            set(x, gy - 1, z, inHall ? B.MARBLE : B.FLAGS, C.marble);
            if (inHall) occ[i] = 1; else pathM[i] = 1;
            hm[i] = gy;
          }
        }
        // Walkable raised upper sanctuary dais (1 block = 4 marble steps rendered in props.js, top edge at z = p.z + 5)
        for (let z = z0; z <= p.z + 4; z++) {
          for (let x = p.x - 6; x <= p.x + 6; x++) set(x, gy, z, B.MARBLE, C.marble);
        }
        // Pure warm interior bounce lights (pushed directly to lamps[] so no floating voxel blocks obstruct the vaults!)
        lamps.push([p.x + 0.5, gy + 7.5, p.z + 7.5, true, 1.4]);
        lamps.push([p.x + 0.5, gy + 8.5, p.z + 1.5, true, 1.3]);
        lamps.push([p.x + 0.5, gy + 7.5, p.z - 4.5, true, 1.3]);
        lamps.push([p.x - 8.5, gy + 3.2, z1 + 1.5, false, 1.2]);
        lamps.push([p.x + 9.5, gy + 3.2, z1 + 1.5, false, 1.2]);

        // Register Full 3D Raphael School of Athens Architecture, Coffered Barrel Vaults, Apollo & Athena Niches & Sculpted Figures!
        props.schoolOfAthens = { x: p.x + 0.5, y: gy, z: p.z + 0.5, x0, z0, x1, z1 };

        // UNDERGROUND CAVE OF THE ALLEGORY (y = gy - 8 = 38, west flank staircase)
        const caveY = gy - 8;
        const cx0 = x0 - 2, cx1 = x1 + 2, cz0 = z0 - 12, cz1 = z0 + 2;
        box(cx0 - 1, caveY - 1, cz0 - 1, cx1 + 1, gy - 2, cz1 + 1, B.ROCK, C.caveDark);
        box(cx0, caveY, cz0, cx1, caveY + 4, cz1, B.AIR, 0);
        for (let s = 0; s <= 8; s++) {
          const sy = gy - s, sz = z0 + 6 - s;
          for (let sx = x0 - 3; sx <= x0 - 1; sx++) {
            set(sx, sy - 1, sz, B.FLAGS, C.rock[1]);
            for (let clearY = sy; clearY <= sy + 3; clearY++) set(sx, clearY, sz, B.AIR, 0);
          }
        }
        for (let x = cx0; x <= cx1; x++) for (let y = caveY; y <= caveY + 4; y++) set(x, y, cz0, B.LIMES, C.caveDark);
        bench(p.x - 2, caveY, cz0 + 4, 0, C.oakD);
        bench(p.x, caveY, cz0 + 4, 0, C.oakD);
        bench(p.x + 2, caveY, cz0 + 4, 0, C.oakD);
        for (let x = p.x - 5; x <= p.x + 5; x++) set(x, caveY, cz0 + 6, B.DRYW, C.rock[0]);
        set(p.x + 1, caveY, cz0 + 9, B.ROCK, C.caveDark);
        set(p.x + 1, caveY + 1, cz0 + 9, B.FIRE, C.gold);
        lamp(p.x + 1, caveY + 2, cz0 + 9, true, 1.9);

        buildPortalPedestal(p.x - 9, gy, z1 - 1, p);
        set(p.x + 3, caveY, cz0 + 6, B.PORTAL, C.gold);

        props.caveStage = { x: p.x + 0.5, y: caveY, zWall: cz0 + 1.08, zPuppet: cz0 + 6.5, zFire: cz0 + 9.5 };
        landmarks.push({
          id: 'plato_cave', name: '柏拉图 · 地下洞穴寓言石窟', en: 'Plato\'s Allegory of the Cave (Underground)',
          x: p.x, z: cz0 + 5, top: caveY + 3, r: 11,
          tp: { mode: 'walk', p: [p.x + 0.5, caveY, cz0 + 5.5], t: [p.x + 0.5, caveY + 1.8, cz0 + 1] }
        });
      }

      // ----------------------------------------------------------------------
      // 3. ARISTOTLE (Lyceum Ionic Temple) & 4. ZENO (Stoa Poikile Classical Temple)
      // ----------------------------------------------------------------------
      else if (p.id === 'aristotle' || p.id === 'zeno') {
        buildGreekTemple(p, x0, z0, x1, z1, gy, {
          colH: 6,
          nFront: p.id === 'zeno' ? 8 : 6,
          nSide: 6,
          order: p.id === 'aristotle' ? 'ionic' : 'doric',
          slope: 0.32,
          roofC: [0.85, 0.45, 0.32],
          hasStatue: true,
          deity: p.id === 'aristotle' ? 'apollo' : 'athena',
          inscription: p.id === 'aristotle'
            ? 'ΑΡΙΣΤΟΤΕΛΗΣ · 吕克昂爱奥尼列柱神庙 · 吾爱吾师 吾更爱真理'
            : 'ΖΗΝΩΝ · 雅典阿哥拉彩绘列柱神殿 (STOA POIKILE) · 顺应自然之理性'
        });
        buildPortalPedestal(p.x, gy, p.z + 1, p);
      }

      // ----------------------------------------------------------------------
      // 5–7. EASTERN CLASSICAL ARCHITECTURE (Confucius Dacheng Hall + Paifang, Laozi 3-Tier Bagua Pagoda, Zhuangzi Jiangnan Moon-Gate Waterside Pavilion)
      // ----------------------------------------------------------------------
      else if (p.style.startsWith('oriental')) {
        // White Jade Xumi Terrace Plinth (汉白玉须弥座台基与白玉钩栏)
        for (let z = z0 - 4; z <= z1 + 4; z++) {
          for (let x = x0 - 4; x <= x1 + 4; x++) {
            if (!inb(x, gy, z)) continue;
            const i = zi(x, z);
            for (let y = 32; y < gy; y++) set(x, y, z, B.DIRT, C.dirt);
            for (let y = gy; y <= gy + 22; y++) if (SOFT[get(x, y, z)]) set(x, y, z, B.AIR, 0);
            const inHall = x >= x0 && x <= x1 && z >= z0 && z <= z1;
            const inTerrace = x >= x0 - 2 && x <= x1 + 2 && z >= z0 - 2 && z <= z1 + 2;
            set(x, gy - 1, z, inHall ? B.PARQ : inTerrace ? B.MARBLE : B.FLAGS, inHall ? C.oak : C.marble);
            hm[i] = gy;
            if (inHall) occ[i] = 1; else pathM[i] = 1;
          }
        }
        // Carved White Jade Balustrade around the Xumi Veranda
        for (let x = x0 - 2; x <= x1 + 2; x++) {
          if (Math.abs(x - p.x) > 2) {
            set(x, gy, z1 + 2, B.BALUS, C.marble);
          }
          set(x, gy, z0 - 2, B.BALUS, C.marble);
        }
        for (let z = z0 - 2; z <= z1 + 2; z++) {
          set(x0 - 2, gy, z, B.BALUS, C.marble);
          set(x1 + 2, gy, z, B.BALUS, C.marble);
        }

        // Vermilion Pillars, Palace Red / Jiangnan Whitewash Walls & Lattice Casements
        const wallHeight = p.id === 'laozi' ? 5 : 6;
        const isJiangnan = p.id === 'zhuangzi';
        for (let y = gy; y < gy + wallHeight; y++) {
          for (let z = z0; z <= z1; z++) {
            for (let x = x0; x <= x1; x++) {
              const onX = x === x0 || x === x1, onZ = z === z0 || z === z1;
              if (!onX && !onZ) continue;
              const isPillar = (onX && onZ) || ((x - x0) % 4 === 0 && onZ) || ((z - z0) % 4 === 0 && onX);
              const isDoor = z === z1 && Math.abs(x - p.x) <= 2 && y <= gy + 3;
              if (isDoor) continue;
              if (isPillar) set(x, y, z, B.OAK, C.orientalRed);
              else if (y === gy + 2 || y === gy + 3) set(x, y, z, B.CASE, C.white);
              else if (y === gy + wallHeight - 1) set(x, y, z, B.OAKC, C.gold);
              else set(x, y, z, isJiangnan ? B.PLASTER : B.BRICK, isJiangnan ? C.plaster : C.orientalRed);
            }
          }
        }
        // Coffered ceiling for interior lighting & warmth
        for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) set(x, gy + wallHeight, z, B.COFFER, C.oakD);
        props.chandeliers.push({ x: p.x + 0.5, y: gy + 4.5, z: p.z + 0.5, top: gy + wallHeight, r: 1.1, candles: 8, kind: 'ring' });

        if (p.id === 'confucius') {
          // 12-Bell Bronze Bianzhong Chime Rack inside Dacheng Hall
          for (let x = p.x - 3; x <= p.x + 3; x++) set(x, gy + 1, z0 + 2, B.GOLD, C.bronze);
          // Register Double-Eaved Imperial Yellow Glazed-Tile Dacheng Palace Roof + 4-Pillar Lingxing Paifang Archway!
          props.orientalBuildings.push({
            x0, z0, x1, z1, gy, wallH: wallHeight, tiers: 2, tileStyle: 'gold',
            plaque: '万世师表 · 杏坛大成殿',
            coupletL: '志于道据于德', coupletR: '兴于诗立于礼'
          });
          props.orientalPaifang.push({
            x: p.x + 0.5, y: gy, z: z1 + 5.8, w: 11.5,
            title: '棂星门 · 圣域礼乐牌坊', sub: '克己复礼 · 天下归仁'
          });
        } else if (p.id === 'laozi') {
          // 3-Tiered Sweeping-Eave Taoist Bagua Pagoda Tower + Stream Waterwheel
          props.orientalBuildings.push({
            x0, z0, x1, z1, gy, wallH: wallHeight, tiers: 3, tileStyle: 'cyan', isPagoda: true,
            plaque: '道法自然 · 函谷玄元宝塔',
            coupletL: '上善若水任方圆', coupletR: '大音希声存有无'
          });
          props.waterwheels.push({ x: x0 - 1.8, y: gy + 1.8, z: p.z + 0.5, r: 2.4 });
        } else if (p.id === 'zhuangzi') {
          // Jiangnan Su-Style Double-Eaved Dark-Tile Waterside Pavilion + Circular Moon Gate + Lotus Koi Pond & Red Arch Bridge
          props.orientalBuildings.push({
            x0, z0, x1, z1, gy, wallH: wallHeight, tiers: 2, tileStyle: 'slate', hasMoonGate: true,
            plaque: '逍遥游 · 濠梁梦蝶水榭',
            coupletL: '天地与我并生', coupletR: '万物与我为一'
          });
          for (let dz = 2; dz <= 6; dz++) for (let dx = -6; dx <= 6; dx++) {
            const isBridge = Math.abs(dx) <= 1;
            set(p.x + dx, gy - 1, z1 + dz, isBridge ? B.PLANKS : B.BROOK, isBridge ? C.orientalRed : C.white);
            if (!isBridge && (Math.abs(dx) + dz) % 3 === 0) {
              props.lotusFlowers.push({ x: p.x + dx + 0.5, y: gy + 0.04, z: z1 + dz + 0.5, bloom: (dx + dz) % 2 === 0 });
            }
          }
          props.fish.push({ x: p.x - 3.0, y: gy - 0.3, z: z1 + 4, rx: 1.5, rz: 1.1, sp: 1.2, ph: 0 });
          props.fish.push({ x: p.x + 3.0, y: gy - 0.3, z: z1 + 4, rx: 1.3, rz: 1.1, sp: -1.1, ph: 2 });
        }
        bench(p.x - 3, gy, p.z + 1, 0, C.oak);
        buildPortalPedestal(p.x, gy, p.z - 1, p);
      }

      // ----------------------------------------------------------------------
      // 14. KANT — 18th-C Königsberg Prussian Brick Manor & 2F Brass Astronomical Observatory Dome
      // ----------------------------------------------------------------------
      else if (p.id === 'kant') {
        buildMasterResidence(p, x0, z0, x1, z1, gy, {
          wallId: B.BRICK, wallC: C.prussianBrick, quoinC: C.stoneL,
          roofC: [0.28, 0.34, 0.44], slope: 1.05, wallH: 9, dormer: true,
          floorId: B.PARQ, floorC: C.marble, creeper: 'ivy', gt: 'brick'
        });
        for (let z = z0 + 1; z <= z1 - 1; z++) {
          for (let x = x0 + 1; x <= x1 - 1; x++) {
            if (x <= x0 + 4 && z >= z0 + 2 && z <= z0 + 8) continue;
            set(x, gy + 4, z, B.BEAM, C.oakD);
          }
        }
        for (let s = 0; s < 5; s++) {
          set(x0 + 2, gy + s, z0 + 7 - s, B.OAK, C.oak);
          set(x0 + 3, gy + s, z0 + 7 - s, B.OAK, C.oak);
        }
        for (let x = x0 + 2; x <= x1 - 2; x += 3) {
          set(x, gy + 6, z1, B.CASE, 0); set(x, gy + 7, z1, B.CASE, 0);
          set(x, gy + 6, z0, B.CASE, 0); set(x, gy + 7, z0, B.CASE, 0);
        }
        buildPortalPedestal(p.x, gy, p.z - 2, p);
        set(p.x, gy + 5, p.z, B.GOLD, C.gold);
        set(p.x, gy + 6, p.z, B.PORTAL, C.gold);
        lamp(p.x, gy + 7, p.z, true, 1.6);
        bench(p.x + 3, gy + 5, p.z, -Math.PI / 2, C.oakD);
        // 3D Hemispherical Brass & Verdigris Star Observatory Dome + Refracting Telescope on Roof!
        props.eraLandmarks.push({ kind: 'kant_observatory', x: p.x + 0.5, y: gy + 11.8, z: p.z + 0.5 });
        landmarks.push({
          id: 'kant_loft', name: '康德 · 二楼星空与道德律观测阁楼', en: 'Kant\'s Starry Heavens & Moral Law Loft (2F)',
          x: p.x, z: p.z, top: gy + 9, r: 10,
          tp: { mode: 'walk', p: [p.x + 0.5, gy + 5, p.z + 2.5], t: [p.x + 0.5, gy + 6.5, p.z] }
        });
      }

      // ----------------------------------------------------------------------
      // 10. LEIBNIZ (Baroque Onion-Dome Clock Tower), 13. HOBBES/ROUSSEAU (Leviathan Lighthouse), 15. HEGEL (Berlin Twin-Spire Gothic Cathedral)
      // ----------------------------------------------------------------------
      else if (p.id === 'leibniz' || p.id === 'hegel' || p.id === 'hobbes_rousseau') {
        buildMasterResidence(p, x0, z0, x1, z1, gy, {
          wallId: p.id === 'hegel' ? B.BRICK : B.BATH,
          wallC: p.id === 'hegel' ? C.prussianBrick : C.honeyStone,
          quoinC: C.marble,
          roofC: p.id === 'leibniz' ? [0.22, 0.52, 0.45] : [0.30, 0.36, 0.46],
          slope: p.id === 'hegel' ? 1.35 : 1.15, wallH: 6, dormer: true, creeper: 'ivy'
        });
        const tx0 = x0, tx1 = x0 + 4, tz0 = z0, tz1 = z0 + 4;
        const tTop = gy + 16;
        for (let y = gy + 6; y <= tTop; y++) {
          for (let z = tz0; z <= tz1; z++) {
            for (let x = tx0; x <= tx1; x++) {
              if (x === tx0 || x === tx1 || z === tz0 || z === tz1) {
                set(x, y, z, p.id === 'hegel' ? B.BRICK : B.BATH, p.id === 'hegel' ? C.prussianBrick : C.honeyStone);
              } else if (y === tTop) {
                set(x, y, z, B.LEAD, C.slate);
              }
            }
          }
        }
        if (p.id === 'leibniz') {
          props.eraLandmarks.push({ kind: 'baroque_onion_clock', x: tx0 + 2.5, y: tTop + 0.5, z: tz0 + 2.5 });
        } else if (p.id === 'hegel') {
          // Second Gothic Twin Spire on East corner + Giant Rose Window!
          const ex0 = x1 - 4, ex1 = x1;
          for (let y = gy + 6; y <= tTop; y++) {
            for (let z = tz0; z <= tz1; z++) for (let x = ex0; x <= ex1; x++) {
              if (x === ex0 || x === ex1 || z === tz0 || z === tz1) set(x, y, z, B.BRICK, C.prussianBrick);
            }
          }
          props.eraLandmarks.push({ kind: 'hegel_gothic_cathedral', x: p.x + 0.5, y: gy, z: p.z + 0.5, x0, z0, x1, z1, spireBaseY: tTop + 0.5 });
        } else if (p.id === 'hobbes_rousseau') {
          props.eraLandmarks.push({ kind: 'leviathan_lighthouse', x: x0 - 2.2, y: gy, z: z1 + 1.2 });
        }
        buildPortalPedestal(p.x, gy, p.z - 1, p);
      }

      // ----------------------------------------------------------------------
      // 19. WITTGENSTEIN — 20th-Century Vienna Haus Wittgenstein Modernist Bauhaus Flat-Roof White Cube & Glass Pavilion
      // ----------------------------------------------------------------------
      else if (p.id === 'wittgenstein') {
        levelPlot(x0 - 2, z0 - 2, x1 + 2, z1 + 2, gy, B.PARQ, C.marble);
        // Interlocking Pure-White Bauhaus Cubic Volumes + Floor-to-Ceiling Steel-Mullioned Glass Curtain Walls (No Pitched Roof!)
        for (let y = gy; y <= gy + 6; y++) {
          for (let z = z0; z <= z1; z++) {
            for (let x = x0; x <= x1; x++) {
              const onX = x === x0 || x === x1, onZ = z === z0 || z === z1;
              if (y === gy + 6) {
                // Cantilevered Flat White Concrete Roof Deck & Skylight
                const isSkylight = Math.abs(x - p.x) <= 2 && Math.abs(z - p.z) <= 2;
                set(x, y, z, isSkylight ? B.GLASS : B.LIMES, C.white);
              } else if (onX || onZ) {
                const isDoor = z === z1 && Math.abs(x - p.x) <= 1 && y <= gy + 2;
                if (isDoor) continue;
                const isGlassCurtain = (y >= gy + 1 && y <= gy + 4) && ((z === z1 && Math.abs(x - p.x) >= 3 && Math.abs(x - p.x) <= 7) || (x === x1 && Math.abs(z - p.z) <= 3));
                set(x, y, z, isGlassCurtain ? B.CASE : B.PLASTER, C.white);
              }
            }
          }
        }
        // Second-level asymmetrically massed Bauhaus upper cube on West wing + Rooftop Steel Balustrade Terrace
        for (let y = gy + 7; y <= gy + 10; y++) {
          for (let z = z0; z <= z0 + 7; z++) {
            for (let x = x0; x <= x0 + 8; x++) {
              const onRim = x === x0 || x === x0 + 8 || z === z0 || z === z0 + 7;
              if (y === gy + 10) set(x, y, z, B.LIMES, C.white);
              else if (onRim) set(x, y, z, (y >= gy + 8 && y <= gy + 9 && z === z0 + 7) ? B.CASE : B.PLASTER, C.white);
            }
          }
        }
        for (let x = x0 + 9; x <= x1; x++) set(x, gy + 7, z1, B.BALUS, C.slate);
        for (let z = z0; z <= z1; z++) set(x1, gy + 7, z, B.BALUS, C.slate);
        props.chandeliers.push({ x: p.x + 0.5, y: gy + 4.8, z: p.z + 0.5, top: gy + 6, r: 1.1, candles: 6, kind: 'ring' });
        bench(p.x - 4, gy, p.z, Math.PI / 2, C.oakD);
        props.eraLandmarks.push({ kind: 'bauhaus_modernist', x: p.x + 0.5, y: gy, z: p.z + 0.5, x0, z0, x1, z1 });
        buildPortalPedestal(p.x, gy, p.z - 1, p);
      }

      // ----------------------------------------------------------------------
      // ALL OTHER PHILOSOPHERS — Era-Specific Regional Architecture (#8 Descartes French Baroque, #9 Spinoza Dutch Stepped-Gable, #11 Locke English Tudor, #12 Hume Georgian Rotunda, #16 Marx Industrial Factory, #17 Nordic Stave, #18 Nietzsche Alpine Sun Fortress, #20 Paris Left-Bank Café)
      // ----------------------------------------------------------------------
      else {
        const isFrenchBaroque = p.id === 'descartes';
        const isDutchGable = p.id === 'spinoza';
        const isTudor = p.id === 'locke';
        const isGeorgian = p.id === 'hume';
        const isIndustrial = p.id === 'marx';
        const isNordic = p.id === 'schopenhauer_kierkegaard';
        const isAlpineFort = p.id === 'nietzsche';

        buildMasterResidence(p, x0, z0, x1, z1, gy, {
          wallId: isFrenchBaroque ? B.LIMES : (isDutchGable || isIndustrial || isGeorgian) ? B.BRICK : isTudor ? B.PLASTER : B.RUBBLE,
          wallC: isFrenchBaroque ? C.stoneL : isDutchGable ? C.dutchBrick : isIndustrial ? C.prussianBrick : isTudor ? C.plaster : C.cotswold,
          quoinC: isTudor ? C.oakD : C.marble,
          roofC: isFrenchBaroque ? [0.20, 0.27, 0.42]
               : isDutchGable ? [0.82, 0.36, 0.24]
               : isIndustrial ? [0.25, 0.27, 0.30]
               : isNordic ? [0.22, 0.18, 0.16]
               : isTudor ? [0.46, 0.32, 0.24]
               : [0.30, 0.42, 0.40],
          slope: isNordic ? 1.48 : isDutchGable ? 1.35 : isFrenchBaroque ? 1.18 : 1.05,
          wallH: 6,
          dormer: !isDutchGable,
          ov: isNordic ? 0.7 : 0.38,
          floorId: isGeorgian ? B.CARPET : isFrenchBaroque ? B.PARQ : B.PLANKS,
          floorC: isGeorgian ? C.billiardGreen : C.oak,
          creeper: isGeorgian ? 'wisteria' : 'ivy',
          gt: (isDutchGable || isIndustrial) ? 'brick' : isTudor ? 'plaster' : 'rubble'
        });

        if (isFrenchBaroque) {
          // Cartesian X-Y Coordinate Parterre Boxwood Garden in front of Descartes' French Château
          for (let dx = -6; dx <= 6; dx++) {
            if (Math.abs(dx) >= 2) set(p.x + dx, gy, z1 + 3, B.HEDGE, C.cypress);
            set(p.x + dx, gy - 1, z1 + 4, B.MARBLE, C.marbleGold);
          }
          props.eraLandmarks.push({ kind: 'french_baroque', x: p.x + 0.5, y: gy, z: z1 + 0.5, w: p.w, d: p.d });
        } else if (isDutchGable) {
          // 17th-Century Amsterdam 7-Step Crow-Step Red-Brick & White-Sandstone Front Gable (Trapgevel) + Hoist Beam!
          for (let step = 0; step < 5; step++) {
            const halfW = Math.max(1, 6 - step * 1.3);
            const gyStep = gy + 6 + step;
            for (let dx = -Math.floor(halfW); dx <= Math.floor(halfW); dx++) {
              set(p.x + dx, gyStep, z1, Math.abs(dx) === Math.floor(halfW) ? B.LIMES : B.BRICK, Math.abs(dx) === Math.floor(halfW) ? C.marble : C.dutchBrick);
            }
          }
          props.eraLandmarks.push({ kind: 'dutch_gable', x: p.x + 0.5, y: gy, z: z1 + 1.0, w: p.w });
        } else if (isTudor) {
          // English Tudor Black-and-White Half-Timbered Studwork & Diagonal Oak Beams
          for (let x = x0; x <= x1; x += 2) for (let y = gy + 2; y < gy + 6; y++) {
            set(x, y, z1, B.OAK, C.oakD); set(x, y, z0, B.OAK, C.oakD);
          }
          props.eraLandmarks.push({ kind: 'tudor_timbers', x0, z0, x1, z1, gy });
        } else if (isGeorgian) {
          for (let dx = -2; dx <= 1; dx++) for (let dz = 0; dz <= 1; dz++) set(p.x + dx, gy, p.z + dz, B.CARPET, C.billiardGreen);
          props.eraLandmarks.push({ kind: 'georgian_dome', x: p.x + 0.5, y: gy + 8.6, z: p.z + 0.5 });
        } else if (isIndustrial) {
          // 19th-Century Industrial Revolution Twin Factory Smokestacks, Brass Steam Flywheel & British Museum Glass Dome
          chimney(x0 + 1, z0 + 1, gy + 6, gy + 16, C.prussianBrick, true);
          chimney(x1 - 1, z0 + 1, gy + 6, gy + 16, C.prussianBrick, true);
          props.waterwheels.push({ x: x0 - 0.6, y: gy + 2.8, z: p.z + 0.5, r: 2.3, brass: true });
          props.eraLandmarks.push({ kind: 'marx_industrial_dome', x: p.x + 0.5, y: gy + 8.2, z: p.z + 0.5 });
        } else if (isNordic) {
          props.eraLandmarks.push({ kind: 'nordic_stave', x: p.x + 0.5, y: gy + 10.2, z: p.z + 0.5, z0, z1 });
        } else if (isAlpineFort) {
          props.eraLandmarks.push({ kind: 'nietzsche_sun_wheel', x: p.x + 0.5, y: gy + 10.5, z: p.z + 0.5 });
        } else if (p.id === 'heidegger_sartre') {
          set(p.x - 4, gy, z1 + 2, B.TABLE, C.oak); chair(p.x - 5, gy, z1 + 2, Math.PI / 2, C.crimson);
          set(p.x + 4, gy, z1 + 2, B.TABLE, C.oak); chair(p.x + 5, gy, z1 + 2, -Math.PI / 2, C.crimson);
          props.eraLandmarks.push({ kind: 'paris_cafe_awning', x: p.x + 0.5, y: gy, z: z1 + 1.0, w: p.w });
        }
        buildPortalPedestal(p.x, gy, p.z - 1, p);
      }

      // Register Architectural Wall-Mounted Museum Exhibits (varied cultural framing, wall typography, floating 3D bookshelves & sculptural pedestals!)
      const isSchoolOfAthens = p.id === 'plato';
      const isGreekTemple = p.id === 'aristotle' || p.id === 'zeno';
      const isTholos = p.id === 'socrates';
      const isEastern = p.style.startsWith('oriental');
      const isModern = p.id === 'wittgenstein' || p.id === 'heidegger_sartre';
      props.museumExhibits.push({
        x: p.x + 0.5,
        y: gy,
        z: p.z + 0.5,
        x0, z0, x1, z1,
        nZ: isGreekTemple ? z0 + 4.06 : isTholos ? p.z - 4.0 : z0 + 1.06,
        wX: isGreekTemple ? x0 + 4.06 : isTholos ? p.x - 4.2 : x0 + 1.06,
        eX: isGreekTemple ? x1 - 3.06 : isTholos ? p.x + 5.2 : x1 - 0.06,
        isSchoolOfAthens, isGreekTemple, isTholos, isEastern, isModern,
        phil: p
      });

      // Register Custom Architectural Carved Walnut Plaque ONLY for residences without bespoke architrave/lacquer/café fascia signs
      const hasCustomFascia = isSchoolOfAthens || isGreekTemple || isTholos || isEastern || p.id === 'heidegger_sartre';
      if (!hasCustomFascia) {
        props.houseSigns.push({
          x: p.x + 0.5,
          y: gy + 3.74,
          z: z1 + 2.18,
          phil: p
        });
      }

      landmarks.push({
        id: 'phil_' + p.id,
        num: p.num,
        name: `${p.num}. ${p.name} · ${p.houseTitle}`,
        en: `${p.en} — ${p.portalName}`,
        x: p.x, z: p.z, top: gy + 6, r: 14,
        phil: p,
        tp: isSchoolOfAthens
          ? { mode: 'walk', p: [p.x + 0.5, gy, z1 + 8.0], t: [p.x + 0.5, gy + 5.25, z0 + 2.0] }
          : p.id === 'confucius'
            ? { mode: 'walk', p: [p.x + 0.5, gy, z1 + 15.5], t: [p.x + 0.5, gy + 4.4, p.z + 2.0] }
            : isEastern
              ? { mode: 'walk', p: [p.x + 0.5, gy, z1 + 13.0], t: [p.x + 0.5, gy + 4.8, p.z] }
              : { mode: 'walk', p: [p.x + 0.5, gy, z1 + 11.5], t: [p.x + 0.5, gy + 4.0, p.z] }
      });
      buildings.push({ id: p.id, x0, z0, x1, z1, y: gy, phil: p });
    });

    /* ================= 4. PUBLIC BUILDINGS: CLASSICAL ATHENIAN TEMPLES OF THE AGORA ================= */
    [[154, 196, 'library', '哲学图书馆 · 雅典缪斯藏书神庙', 'Philosophy Library · Temple of the Muses', 'ionic', 'athena', 'ΜΟΥΣΕΙΟΝ · 雅典缪斯万卷藏书神庙 · 哲学图书馆'],
     [230, 196, 'workshop', '思维工坊 · 雅典阿波罗逻辑神庙', 'Thinking Workshop · Temple of Apollo', 'doric', 'apollo', 'ΑΠΟΛΛΩΝ · 雅典阿波罗逻辑与思维神庙 · 思维工坊']].forEach(([bx, bz, id, name, en, order, deity, insc]) => {
      const gy = hm[zi(bx, bz)];
      buildGreekTemple({ x: bx, z: bz, id, name, houseTitle: name }, bx - 9, bz - 7, bx + 9, bz + 7, gy, {
        colH: 6, nFront: 6, nSide: 6, order, slope: 0.32,
        roofC: [0.85, 0.45, 0.32], hasStatue: true, deity, inscription: insc
      });
      landmarks.push({ id, name, en, x: bx, z: bz, top: gy + 8, r: 14, tp: { mode: 'walk', p: [bx + 0.5, gy, bz + 11.5], t: [bx + 0.5, gy + 3.0, bz] } });
    });

    /* ================= 5. LUSH VEGETATION, WILDFLOWERS, REEDS & SWANS ================= */
    function cypress(x, z) {
      const y = hm[zi(x, z)]; if (y <= WATER_Y + 1) return;
      set(x, y, z, B.BARK, C.bark);
      for (let dy = 1; dy <= 8; dy++) {
        const r = dy === 1 || dy >= 7 ? 0 : 1;
        for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) if (isAir(x + dx, y + dy, z + dz)) set(x + dx, y + dy, z + dz, B.YEW, C.cypress);
      }
      occ[zi(x, z)] = 3;
    }
    function willow(x, z) {
      const y = hm[zi(x, z)], hgt = 6, r = 4;
      for (let k = 0; k < hgt; k++) set(x, y + k, z, B.BARK, C.bark);
      for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) {
        const d = Math.hypot(dx, dz); if (d > r + 0.5) continue;
        const top = y + hgt + Math.round((1 - d / (r + 1)) * 2);
        for (let yy = top - 1; yy <= top; yy++) if (isAir(x + dx, yy, z + dz)) set(x + dx, yy, z + dz, B.WILLOW, C.willow);
        if (d > r - 1.2 && hash3(x + dx, 3, z + dz) < 0.7) {
          for (let k = 1; k <= 3; k++) if (isAir(x + dx, top - 1 - k, z + dz)) set(x + dx, top - 1 - k, z + dz, B.WILLOW, C.willow);
        }
      }
      occ[zi(x, z)] = 3;
    }
    function broadleaf(x, z, col, big) {
      const y = hm[zi(x, z)], hgt = big ? 10 : 7, r = big ? 4 : 3;
      for (let k = 0; k < hgt - 2; k++) set(x, y + k, z, B.BARK, C.bark);
      for (let dy = -2; dy <= 2; dy++) for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) {
        if (dx * dx + dz * dz + dy * dy * 1.5 > r * r + 1) continue;
        if (isAir(x + dx, y + hgt - 2 + dy, z + dz)) set(x + dx, y + hgt - 2 + dy, z + dz, B.BEECH, col || C.leaf);
      }
      occ[zi(x, z)] = 3;
    }

    // Weeping willows along the Stream of Experience
    for (let t = 0; t < 600; t++) {
      const x = RI(30, W - 30), z = RI(30, D - 30), i = zi(x, z);
      if (occ[i] || pathM[i] || dStreamArr[i] < 5.5 || dStreamArr[i] > 9.0) continue;
      let nearP = false;
      for (const p of PHILOSOPHERS) {
        if (Math.hypot(x - p.x, z - p.z) < 22 || (Math.abs(x - p.x) < 12 && z >= p.z && z <= p.z + 30)) { nearP = true; break; }
        if (p.id === 'plato' && Math.abs(x - p.x) < 18 && z >= p.z - 70 && z <= p.z + 34) { nearP = true; break; }
      }
      if (!nearP && rnd() < 0.12) willow(x, z);
    }

    // District forests: Greek Cypresses (NW), Ginkgo & Bamboo (East), Alpine Firs (North), Oaks & Beeches
    for (let t = 0; t < 1100; t++) {
      const x = RI(20, W - 20), z = RI(20, D - 20), i = zi(x, z);
      if (occ[i] || pathM[i] || hm[i] <= WATER_Y + 1.5) continue;
      let tooClose = false;
      for (const p of PHILOSOPHERS) {
        if (Math.hypot(x - p.x, z - p.z) < 22 || (Math.abs(x - p.x) < 12 && z >= p.z && z <= p.z + 30)) { tooClose = true; break; }
        if (p.id === 'plato' && Math.abs(x - p.x) < 18 && z >= p.z - 70 && z <= p.z + 34) { tooClose = true; break; }
      }
      if (tooClose) continue;
      if (x > 275) broadleaf(x, z, rnd() < 0.55 ? C.ginkgo : C.bamboo, rnd() < 0.35);
      else if (x < 150 && z < 170) cypress(x, z);
      else if (z < 90) cypress(x, z);
      else broadleaf(x, z, C.leaf, rnd() < 0.4);
    }

    // 6,000 Wildflower, Reed, Cow Parsley & Grass Tufts across the meadows!
    for (let t = 0; t < 24000 && props.tufts.length < 6200; t++) {
      const x = RI(12, W - 12), z = RI(12, D - 12), i = zi(x, z), y = hm[i];
      if (pathM[i] || occ[i]) continue;
      const top = get(x, y - 1, z);
      if ((top !== B.GRASS && top !== B.MEADOW) || !isAir(x, y, z)) continue;
      let kind = 0;
      if (dStreamArr[i] < 10) kind = hash3(x, 9, z) < 0.6 ? 1 : 3;
      else if (hash3(x, 8, z) < 0.25) kind = 3;
      else if (hash3(x, 7, z) < 0.18) kind = 2;
      props.tufts.push([x + 0.2 + rnd() * 0.6, y, z + 0.2 + rnd() * 0.6, kind, 0.75 + rnd() * 0.5]);
    }

    // Swans & Mallard Ducks on the Stream of Experience
    for (const [x, z] of [[163, 98], [166, 134], [218, 174], [218, 224], [216, 266], [285, 152]]) {
      props.swans.push({ x: x + 0.5, y: WATER_Y - 0.22, z: z + 0.5, r: rnd() * 6.28 });
    }
    for (const [x, z] of [[164, 112], [217, 192], [217, 244], [302, 148]]) {
      props.ducks.push({ x: x + 0.5, y: WATER_Y - 0.12, z: z + 0.5, r: rnd() * 6.28 });
    }

    /* ================= 6. DERIVED MAPS, SPAWN & AERIAL TOUR ================= */
    const walk = new Uint8Array(W * D);
    for (let i = 0; i < W * D; i++) {
      if (pathM[i]) {
        const x = i % W, z = (i / W) | 0, y = hm[i];
        if (get(x, y - 1, z) !== B.AIR && get(x, y, z) === B.AIR) walk[i] = 1;
      }
    }
    const topH = new Uint8Array(W * D), topB = new Uint8Array(W * D), topC = new Uint8Array(W * D);
    for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) for (let y = H - 1; y >= 0; y--) {
      const b = blocks[idx(x, y, z)];
      if (b) { topH[zi(x, z)] = y; topB[zi(x, z)] = b; topC[zi(x, z)] = cols[idx(x, y, z)]; break; }
    }

    const spawnX = 192, spawnZ = 228;
    const spawn = { x: spawnX + 0.5, y: hm[zi(spawnX, spawnZ)], z: spawnZ + 0.5, yaw: 0 };

    const tour = {
      cam: [
        [192, 58, 255], [142, 58, 165], [84, 62, 128], [218, 56, 172],
        [268, 58, 148], [322, 56, 196], [192, 68, 82], [112, 58, 268]
      ],
      tgt: [
        [192, 43, 196], [132, 43, 138], [84, 48, 98], [242, 45, 126],
        [294, 48, 92], [296, 43, 176], [192, 54, 48], [142, 42, 288]
      ],
      dur: 165
    };

    return {
      W, D, H, BASE: 40, GY: 39, WATER_Y, blocks, cols, palette, pal, get, set, idx, inb, B, BI, T,
      PHILOSOPHERS, WAYPOSTS, hm, walk, occ, land: null, topH, topB, topC, landmarks, lamps, flags, chimneys, doors, seats, pasture, buildings, props, checks,
      spawn, tour, lake: { x: W / 2, z: D / 2, w: W, d: D }, moorings: []
    };
  }

  root.PIWorld = { W, D, H, WATER_Y, B, BI, T, PHILOSOPHERS, WAYPOSTS, create, hash3, mulberry32 };
  if (typeof module !== 'undefined') module.exports = root.PIWorld;
})(typeof window !== 'undefined' ? window : globalThis);
