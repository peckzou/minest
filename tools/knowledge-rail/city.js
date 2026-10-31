/* ==========================================================================
   Minest My World — Dynamic Presentation Phase 3 · PART I
   Knowledge City (Metropolis Edition · Day & Night)
   "Stroll a Living Metropolis Avenue · Bespoke Flagship Storefronts & 3D Vitrines"
   Core Flow: Explore → Discover → Focus (Shop / Vitrine Display) → Read → Continue
   Reuses showcase-common.js (KShow.stage, KShow.reader, KShow.carriers) & rail-common.js.
   ========================================================================== */
(function () {
  'use strict';
  var X = window.KShow, K = window.KRail, T = window.THREE;
  if (!X || !K || !T) return;

  var clamp = K.clamp, lerp = K.lerp, ease = K.ease, esc = K.esc;
  var DB = X.store('minest.city.v2');

  // 4 Metropolitan District Atmospheres
  var STYLES = [
    {
      id: 'metropolis', name: '🗽 Fifth Ave & SoHo', icon: '🗽',
      daySky: ['#1e40af', '#60a5fa', '#fde68a'], nightSky: ['#030712', '#0f172a', '#1e1b4b'],
      dayFog: '#dce8f5', nightFog: '#070b19',
      road: '#2b303c', walk: '#d6d3cd',
      skylineDay: '#8fa6c2', skylineNight: '#0d1528'
    },
    {
      id: 'ginza', name: '🏮 Ginza & Omotesando', icon: '🏮',
      daySky: ['#2563eb', '#93c5fd', '#ffedd5'], nightSky: ['#040611', '#111827', '#2e1065'],
      dayFog: '#e5edf7', nightFog: '#080716',
      road: '#262936', walk: '#cbd5e1',
      skylineDay: '#7f95b2', skylineNight: '#11162c'
    },
    {
      id: 'european', name: '🏛 Regent & Saint-Germain', icon: '🏛',
      daySky: ['#3b5998', '#8bb0d8', '#f7e7ce'], nightSky: ['#080b16', '#161f35', '#2c223e'],
      dayFog: '#e8dfd1', nightFog: '#0d1120',
      road: '#3d3a36', walk: '#dfd7c8',
      skylineDay: '#9a9086', skylineNight: '#151828'
    },
    {
      id: 'cyber', name: '⚡ Shibuya Neon Crossing', icon: '⚡',
      daySky: ['#3730a3', '#818cf8', '#f3e8ff'], nightSky: ['#03020c', '#0e0725', '#2a0944'],
      dayFog: '#dcd4f2', nightFog: '#060414',
      road: '#1e1e2c', walk: '#3f4259',
      skylineDay: '#6d679e', skylineNight: '#0c0822'
    }
  ];

  // 14 Distinct Flagship Storefront Archetypes with unique architecture, palette & vitrine design
  var SHOP_TYPES = [
    {
      kind: 'book', icon: '📚', tag: 'Flagship Bookstore', blade: 'BOOKS & FOLIOS',
      neon: '#ff9f43', carrier: 'book', arch: 'brick_classic',
      wall: '#8c3b2b', trim: '#1e3a2f', gold: '#d4af37', interior: '#2c1d14',
      awning: ['#1e3a2f', '#f4efe6']
    },
    {
      kind: 'music', icon: '🎵', tag: 'Vinyl & Hi-Fi Records', blade: 'VINYL RECORDS',
      neon: '#ff2e63', carrier: 'badge', arch: 'industrial_loft',
      wall: '#1f242d', trim: '#f59e0b', gold: '#ff2e63', interior: '#141720',
      awning: ['#111827', '#ff2e63']
    },
    {
      kind: 'movie', icon: '🎬', tag: 'Art-Deco Cinema Palace', blade: 'GRAND CINEMA',
      neon: '#feca57', carrier: 'frame', arch: 'art_deco',
      wall: '#2b192e', trim: '#eab308', gold: '#fde047', interior: '#3b0d1e',
      awning: ['#7f1d1d', '#fde047']
    },
    {
      kind: 'cafe', icon: '☕', tag: 'Sidewalk Roastery & Café', blade: 'CAFÉ & ESPRESSO',
      neon: '#ff793f', carrier: 'orb', arch: 'parisian_bistro',
      wall: '#e6dccb', trim: '#234233', gold: '#c89d54', interior: '#3d2618',
      awning: ['#991b1b', '#fef3c7']
    },
    {
      kind: 'art', icon: '🎨', tag: 'Haute Design & Gallery', blade: 'ATELIER GALLERY',
      neon: '#c56cf0', carrier: 'frame', arch: 'modern_gallery',
      wall: '#f1f5f9', trim: '#0f172a', gold: '#a855f7', interior: '#1e293b',
      awning: ['#0f172a', '#e2e8f0']
    },
    {
      kind: 'game', icon: '🎮', tag: 'Cyber Arcade Center', blade: 'GAME LAB 3D',
      neon: '#00f2fe', carrier: 'orb', arch: 'cyber_glass',
      wall: '#181828', trim: '#00f2fe', gold: '#f43f5e', interior: '#0b0f24',
      awning: ['#0f172a', '#00f2fe']
    },
    {
      kind: 'vocab', icon: '🔤', tag: 'Lexicon & Stationery House', blade: 'LEXICON PRESS',
      neon: '#38bdf8', carrier: 'book', arch: 'townhouse',
      wall: '#1e3a5f', trim: '#f8fafc', gold: '#fbbf24', interior: '#1b2838',
      awning: ['#1e3a5f', '#fde68a']
    },
    {
      kind: 'sci', icon: '🧪', tag: 'Quantum & Optics Lab', blade: 'OPTICS & LAB',
      neon: '#10b981', carrier: 'orb', arch: 'tech_pavilion',
      wall: '#334155', trim: '#10b981', gold: '#38bdf8', interior: '#0f292a',
      awning: ['#064e3b', '#6ee7b7']
    },
    {
      kind: 'hist', icon: '🏛', tag: 'Classical Curios & Antiques', blade: 'ANTIQUITIES',
      neon: '#eab543', carrier: 'badge', arch: 'neoclassical',
      wall: '#d6c7b2', trim: '#4a3f35', gold: '#d97706', interior: '#1e2d24',
      awning: ['#3f2e21', '#e7dac6']
    },
    {
      kind: 'dept', icon: '🛍', tag: 'Grand Department Store', blade: 'FLAGSHIP EMPORIUM',
      neon: '#f43f5e', carrier: 'frame', arch: 'art_deco',
      wall: '#f5efe6', trim: '#881337', gold: '#fbbf24', interior: '#2e1020',
      awning: ['#881337', '#fef3c7']
    },
    {
      kind: 'market', icon: '🏪', tag: 'Organic Fresh Supermarket', blade: 'FRESH MARKET',
      neon: '#22c55e', carrier: 'orb', arch: 'brick_classic',
      wall: '#7c2d12', trim: '#14532d', gold: '#86efac', interior: '#14291d',
      awning: ['#15803d', '#f0fdf4']
    },
    {
      kind: 'bank', icon: '🏦', tag: 'Metropolitan Reserve Bank', blade: 'METRO BANK',
      neon: '#60a5fa', carrier: 'badge', arch: 'neoclassical',
      wall: '#e2dcd3', trim: '#1e3a8a', gold: '#eab308', interior: '#172554',
      awning: ['#1e3a8a', '#f8fafc']
    },
    {
      kind: 'bakery', icon: '🥐', tag: 'Artisan Boulangerie & Salon', blade: 'PATISSERIE',
      neon: '#fbbf24', carrier: 'book', arch: 'parisian_bistro',
      wall: '#efe6d5', trim: '#78350f', gold: '#f59e0b', interior: '#3b2110',
      awning: ['#78350f', '#fef3c7']
    },
    {
      kind: 'pharm', icon: '✚', tag: 'Apothecary & Botanical Lab', blade: 'APOTHECARY',
      neon: '#34d399', carrier: 'orb', arch: 'townhouse',
      wall: '#f8fafc', trim: '#065f46', gold: '#10b981', interior: '#064e3b',
      awning: ['#065f46', '#ecfdf5']
    }
  ];

  // Curated Demo Shops & Cards (18 distinct flagship stores & facilities along the 2× expanded avenue)
  var DEMO_SHOPS = [
    { title: 'Strand & Co. Booksellers', kind: 0, color: '#b45309', items: [
      { title: 'The Odyssey', zh: '奥德赛 · 荷马史诗', back: 'Ancient Greek epic poem attributed to Homer, following Odysseus on his ten-year journey home.' },
      { title: 'One Hundred Years of Solitude', zh: '百年孤独', back: 'Gabriel García Márquez’s masterpiece of magical realism chronicling the Buendía family in Macondo.' },
      { title: 'Invisible Cities', zh: '看不见的城市', back: 'Italo Calvino’s poetic dialogue between Kublai Khan and Marco Polo exploring memory, desire, and urban form.' }
    ]},
    { title: 'Rough Groove Vinyl & Hi-Fi', kind: 1, color: '#e11d48', items: [
      { title: 'Kind of Blue', zh: '迈尔斯·戴维斯 · 模态爵士', back: '1959 studio album by Miles Davis — the best-selling jazz record of all time, built on modal improvisation.' },
      { title: 'Interstellar OST', zh: '星际穿越原声带', back: 'Composed by Hans Zimmer using the 1926 Harrison & Harrison pipe organ at Temple Church, London.' },
      { title: 'Clair de Lune', zh: '月光 · 德彪西', back: 'The third movement of Claude Debussy’s Suite bergamasque (1905), a cornerstone of musical Impressionism.' }
    ]},
    { title: 'Grand Lumière Cinema Palace', kind: 2, color: '#ca8a04', items: [
      { title: '2001: A Space Odyssey', zh: '2001太空漫游', back: 'Stanley Kubrick’s 1968 epic exploring human evolution, artificial intelligence, and cosmic discovery.' },
      { title: 'Blade Runner Visuals', zh: '银翼杀手霓虹美学', back: 'High-contrast nocturnal neon signage, wet asphalt reflections, and atmospheric volumetric depth.' },
      { title: 'The Grand Budapest Hotel', zh: '布达佩斯大饭店', back: 'Wes Anderson’s symmetrical framing, pastel architectural palettes, and miniature diorama precision.' }
    ]},
    { title: 'Café de Flore & Roastery', kind: 3, color: '#15803d', items: [
      { title: 'Method of Loci (Memory Palace)', zh: '记忆宫殿法', back: 'Spatial mnemonic technique that anchors abstract concepts to familiar shopfronts, rooms, and street corners.' },
      { title: 'Dual-Coding Theory', zh: '双重编码理论', back: 'Paivio’s cognitive principle that combining visual-spatial landmarks with verbal notes doubles recall strength.' },
      { title: 'Socratic Dialogue', zh: '苏格拉底式诘问', back: 'Cooperative argumentative dialogue based on asking and answering questions to stimulate critical thinking.' }
    ]},
    { title: 'Atelier Beaux-Arts Gallery', kind: 4, color: '#9333ea', items: [
      { title: 'Storefront Vitrine Proportion', zh: '街铺开间与橱窗美学', back: 'Human-scale ground floors with curated display windows invite pedestrians to pause and inspect details.' },
      { title: 'Neon Tube Typography', zh: '霓虹灯管字体工艺', back: 'Luminous gas-discharge tubes bent into legible letterforms and geometric emblems.' },
      { title: 'Bauhaus Form & Function', zh: '包豪斯形式追随功能', back: 'Clean geometric massing where every structural element serves clarity and usability.' }
    ]},
    { title: 'Akihabara Cyber Arcade', kind: 5, color: '#0284c7', items: [
      { title: 'Spatial Environmental Storytelling', zh: '环境叙事设计', back: 'Embedding narrative history and conceptual rules directly into 3D architecture, lighting, and object placement.' },
      { title: 'Core Gameplay Loop', zh: '核心交互循环', back: 'Explore → Discover → Focus → Read → Continue: turning passive review into active spatial curiosity.' },
      { title: 'Procedural Low-Poly World', zh: '程序化低多边形世界', back: 'Deterministic seeded generation keeps memory footprint tiny while rendering rich, legible 3D cities.' }
    ]},
    { title: 'Itoya Lexicon & Fine Press', kind: 6, color: '#1d4ed8', items: [
      { title: 'Flâneur', zh: '城市漫游者 (n.)', back: 'A person who strolls the city streets in order to experience architecture, culture, and life first-hand.' },
      { title: 'Serendipity', zh: '意外发现珍宝的机缘 (n.)', back: 'The occurrence of finding valuable or agreeable things by chance while exploring an open environment.' },
      { title: 'Palimpsest', zh: '重写本 / 层叠印记 (n.)', back: 'Something reused or altered but still bearing visible traces of its earlier form — like a city across Day & Night.' }
    ]},
    { title: 'Helmholtz Optics & Quantum Lab', kind: 7, color: '#059669', items: [
      { title: 'Rayleigh Scattering', zh: '瑞利散射（昼夜天空色彩）', back: 'Short-wavelength blue light scatters across the daytime sky, shifting to warm amber at dusk and deep indigo at night.' },
      { title: 'Fresnel Reflection', zh: '菲涅尔反射效应', back: 'Grazing-angle reflections on nocturnal pavements and storefront glass amplify neon signage glow.' },
      { title: 'Orbital Mechanics', zh: '轨道力学与霍曼转移', back: 'Moving between planetary orbits using two precisely timed engine impulses.' }
    ]},
    { title: 'Mayfair Classical Antiquities', kind: 8, color: '#a16207', items: [
      { title: 'Rosetta Inscription', zh: '罗塞塔石碑铭文', back: 'Granodiorite stele inscribed with three versions of a decree issued in Memphis, Egypt in 196 BC.' },
      { title: 'Vitruvian Triad', zh: '维特鲁威建筑三原则', back: 'Firmitas (strength), Utilitas (utility), and Venustas (beauty) — the foundation of classical urban architecture.' },
      { title: 'Astrolabe & Celestial Sphere', zh: '星盘与天球仪', back: 'Ancient astronomical inclinometer used by navigators and philosophers to measure altitude of stars.' }
    ]},
    { title: 'Bergdorf & Selfridges Emporium', kind: 9, color: '#be123c', items: [
      { title: 'The Window Dressers of Fifth Ave', zh: '第五大道橱窗叙事艺术', back: 'Pioneered theatrical street-level storytelling with spotlights, layered backdrops, and kinetic props.' },
      { title: 'Cast-Iron Department Palaces', zh: '铸铁百货宫殿建筑', back: '19th-century cast-iron facades enabled expansive plate-glass vitrines flooded with natural light.' },
      { title: 'Haute Couture Draping', zh: '立体裁剪与结构美学', back: 'Sculpting fabric directly on the form to create architectural silhouettes and fluid movement.' }
    ]},
    { title: 'Dean & DeLuca Fresh Market', kind: 10, color: '#15803d', items: [
      { title: 'Mediterranean Botanicals', zh: '地中海风味植物志', back: 'Cold-pressed olive oils, saffron threads, sun-ripened heirloom tomatoes, and aromatic basil.' },
      { title: 'Fermentation & Sourdough', zh: '天然酵母与慢发酵科学', back: 'Wild lactobacilli and yeast symbiosis producing complex organic acids and airy crumb structure.' },
      { title: 'Seasonal Harvest Almanac', zh: '四季风物与旬味日历', back: 'Aligning culinary craft with peak agricultural harvests from spring shoots to autumn orchards.' }
    ]},
    { title: 'First Metropolis Reserve Bank', kind: 11, color: '#1e40af', items: [
      { title: 'Compound Knowledge Interest', zh: '知识复利效应', back: 'Small daily reviews accumulate exponentially over time, turning fleeting notes into lifelong mastery.' },
      { title: 'Bretton Woods & Gold Standard', zh: '货币史与金本位体系', back: 'The evolution of global exchange systems from bullion coinage to modern central banking.' },
      { title: 'Double-Entry Ledger', zh: '复式记账法 · 卢卡·帕乔利', back: 'Renaissance accounting breakthrough that laid the mathematical foundation for modern commerce.' }
    ]},
    { title: 'Maison Ladurée Boulangerie', kind: 12, color: '#b45309', items: [
      { title: 'Laminated Viennoiserie', zh: '法式千层起酥工艺', back: 'Alternating butter and dough folds create 729 delicate, honeycomb-crisp layers in a classic croissant.' },
      { title: 'Proust’s Madeleine Moment', zh: '普鲁斯特玛德琳蛋糕效应', back: 'Involuntary sensory memory triggered by aroma, taste, and spatial atmosphere.' },
      { title: 'Choux & Crème Pâtissière', zh: '泡芙与香草卡仕达酱', back: 'High-moisture pâte à choux expands by steam in the oven into hollow golden spheres.' }
    ]},
    { title: 'Kiehl’s & Officina Apothecary', kind: 13, color: '#047857', items: [
      { title: 'Botanical Distillation', zh: '植物精油蒸汽蒸馏法', back: 'Extracting volatile aromatic compounds from lavender, rosemary, and bergamot blossoms.' },
      { title: 'Renaissance Herbal Compendium', zh: '文艺复兴本草图谱', back: 'Illustrated manuscripts cataloging medicinal plants, minerals, and restorative elixirs.' },
      { title: 'Circadian Rhythm & Recovery', zh: '昼夜节律与深度修复', back: 'Synchronizing cognitive focus and rest cycles with natural daylight and nocturnal melatonin.' }
    ]},
    { title: 'Daikanyama T-Site Book Lounge', kind: 0, color: '#9a3412', items: [
      { title: 'Interdisciplinary Curating', zh: '跨学科主题策展', back: 'Organizing books not by Dewey code but by lifestyle clusters: Architecture, Travel, Cinema, and Gastronomy.' },
      { title: 'Tactile Paper & Typography', zh: '纸张肌理与活字排版', back: 'Cotton rag paper, letterpress indentation, and harmonious page margins.' },
      { title: 'Quiet Urban Sanctuary', zh: '都市中的静谧阅读绿洲', back: 'Creating warm timber-lined interiors buffered from street traffic by lush foliage.' }
    ]},
    { title: 'Blue Note Jazz & Vinyl Club', kind: 1, color: '#be185d', items: [
      { title: 'Syncopation & Swing', zh: '切分音与摇摆律动', back: 'Shifting rhythmic accents off the main beat to create forward momentum and expressive groove.' },
      { title: 'Reid Miles Album Sleeves', zh: '蓝调之音经典黑胶封套', back: 'Bold two-tone typography and candid studio photography that defined mid-century jazz aesthetics.' },
      { title: 'Warm Tube Amplification', zh: '真空管胆机声学质感', back: 'Even-order harmonic saturation that lends warmth and three-dimensional presence to analog audio.' }
    ]},
    { title: 'MoMA Design & Architecture Store', kind: 4, color: '#7e22ce', items: [
      { title: 'Eames Lounge Proportion', zh: '伊姆斯躺椅曲木工艺', back: 'Molded plywood shells and supple leather engineered for enduring ergonomic comfort.' },
      { title: 'Dieter Rams: Ten Principles', zh: '迪特·拉姆斯好设计十原则', back: 'Good design is innovative, useful, aesthetic, understandable, unobtrusive, and long-lasting.' },
      { title: 'Modular Grid Systems', zh: '瑞士国际主义网格系统', back: 'Josef Müller-Brockmann’s mathematical framework for visual hierarchy and clarity.' }
    ]},
    { title: 'Ginza Sony & Cyber Robotics Lab', kind: 7, color: '#0d9488', items: [
      { title: 'Spatial Computing & Optics', zh: '空间计算与光学波导', back: 'Blending digital knowledge layers seamlessly into physical architectural spaces.' },
      { title: 'Inverse Kinematics', zh: '逆运动学与机械臂控制', back: 'Calculating joint angles to position an end-effector smoothly along a target trajectory.' },
      { title: 'Neural Radiance Fields', zh: '神经辐射场与3D重建', back: 'Synthesizing novel 3D views of complex scenes from sparse multi-angle observations.' }
    ]}
  ];

  // Ensure every shop along the street gets a DISTINCT archetype first so adjacent stores never look identical
  function assignShopType(title, idx) {
    var s = String(title || '').toLowerCase();
    var preferred = -1;
    if (/book|read|lit|novel|elar|书|阅读|文学/.test(s)) preferred = 0;
    else if (/music|song|album|audio|音|歌|唱/.test(s)) preferred = 1;
    else if (/movie|film|cinema|tv|影|视|剧/.test(s)) preferred = 2;
    else if (/philo|cafe|plan|found|思|哲|咖啡/.test(s)) preferred = 3;
    else if (/art|design|draw|visual|美|艺|设/.test(s)) preferred = 4;
    else if (/game|play|arcade|pe|游|玩|体/.test(s)) preferred = 5;
    else if (/word|vocab|lang|english|词|语|英/.test(s)) preferred = 6;
    else if (/sci|math|phys|chem|科|理|数/.test(s)) preferred = 7;
    else if (/hist|social|ss|古|史|社/.test(s)) preferred = 8;

    var chosen = (preferred >= 0 && idx < 2) ? preferred : (idx % SHOP_TYPES.length);
    return SHOP_TYPES[chosen];
  }

  function buildCityShops(P, src) {
    var C = { key: 'city:demo', groups: [], all: [] };
    try { C = X.collect(P, src || { type: 'workspace' }); } catch (e) {}
    var shops = [];
    var usedKinds = {};

    (C.groups || []).forEach(function (g) {
      if (!g.items || !g.items.length || shops.length >= 10) return;
      var stype = assignShopType(g.title, shops.length);
      if (usedKinds[stype.kind]) {
        for (var m = 0; m < SHOP_TYPES.length; m++) {
          var cand = SHOP_TYPES[(shops.length + m) % SHOP_TYPES.length];
          if (!usedKinds[cand.kind]) { stype = cand; break; }
        }
      }
      usedKinds[stype.kind] = true;
      shops.push({
        id: g.id,
        title: g.title,
        baseTitle: g.title,
        color: g.color || stype.neon,
        type: stype,
        items: g.items.slice(0, 3)
      });
    });

    var dIdx = 0;
    while (shops.length < 18 && dIdx < DEMO_SHOPS.length) {
      var ds = DEMO_SHOPS[dIdx++];
      var stype = SHOP_TYPES[ds.kind % SHOP_TYPES.length];
      var demoGroup = { id: 'demo-shop-' + dIdx, title: ds.title, color: ds.color };
      var items = ds.items.map(function (c, ci) {
        var ref = { bid: 'demo', col: demoGroup.id, id: demoGroup.id + '-c' + ci };
        return {
          ref: ref,
          g: demoGroup,
          I: {
            ref: ref,
            card: { title: c.title, desc: c.back },
            list: { title: ds.title },
            board: { title: 'Knowledge Metropolis' },
            title: c.title,
            zh: c.zh,
            sub: c.zh,
            back: c.back,
            desc: c.back,
            notes: '',
            checklist: [],
            labels: [stype.tag],
            type: stype.carrier === 'book' ? 'book' : stype.carrier === 'frame' ? 'poster' : 'concept',
            sig: K.hash(c.title + '|' + c.zh)
          }
        };
      });
      shops.push({
        id: demoGroup.id,
        title: ds.title,
        baseTitle: ds.title,
        color: ds.color,
        type: stype,
        items: items
      });
    }

    var allItems = [];
    shops.forEach(function (sh, si) {
      sh.k = si;
      sh.side = si % 2 === 0 ? -1 : 1; // Left (-x) and Right (+x) sides of the avenue
      sh.pair = si >> 1;
      sh.z = -(sh.pair * 15.5 + 11 + (si % 2) * 3.8);
      sh.items.forEach(function (it, j) {
        it.shopIdx = si;
        it.winIdx = j;
        allItems.push(it);
      });
    });
    return { key: C.key || 'city:workspace', shops: shops, all: allItems };
  }

  // ---------------- Bespoke Storefront Fascia & Blade Sign Textures ----------------
  function makeFasciaSignTex(sh, isNight) {
    var c = document.createElement('canvas');
    c.width = 1024; c.height = 256;
    var x = c.getContext('2d');
    var st = sh.type;

    // Architectural Fascia Background tailored to shop archetype
    var bg = isNight ? '#090d1a' : (st.arch === 'modern_gallery' ? '#ffffff' : st.arch === 'parisian_bistro' ? '#1e3a2f' : '#161b26');
    var fg = (!isNight && st.arch === 'modern_gallery') ? '#0f172a' : '#ffffff';
    var accent = isNight ? st.neon : st.gold;

    x.fillStyle = bg;
    K.rr(x, 6, 6, 1012, 244, 22);
    x.fill();

    // Double architectural border with corner rivets/ornaments
    x.lineWidth = isNight ? 10 : 7;
    x.strokeStyle = accent;
    K.rr(x, 14, 14, 996, 228, 16);
    x.stroke();

    x.lineWidth = 2;
    x.strokeStyle = isNight ? 'rgba(255,255,255,0.28)' : 'rgba(212,175,55,0.45)';
    K.rr(x, 26, 26, 972, 204, 10);
    x.stroke();

    // Cinema marquee bulb dots along top & bottom!
    if (st.kind === 'movie') {
      x.fillStyle = '#fde047';
      for (var bx = 36; bx < 990; bx += 28) {
        x.beginPath(); x.arc(bx, 20, 5, 0, Math.PI * 2); x.fill();
        x.beginPath(); x.arc(bx, 236, 5, 0, Math.PI * 2); x.fill();
      }
    }

    // Left Emblem Medallion
    x.fillStyle = accent;
    K.rr(x, 42, 42, 172, 172, st.arch === 'art_deco' || st.arch === 'neoclassical' ? 86 : 26);
    x.fill();
    x.font = '92px ' + K.FONT;
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    x.fillText(st.icon, 128, 132);

    // Shop Name in bespoke typography
    x.textAlign = 'left';
    x.fillStyle = fg;
    var titleFont = (st.kind === 'book' || st.kind === 'hist' || st.kind === 'cafe') ? 'Georgia, "Times New Roman", serif' : K.FONT;
    var t = sh.title;
    x.font = '800 58px ' + titleFont;
    while (x.measureText(t).width > 740 && t.length > 4) t = t.slice(0, -2) + '…';
    x.fillText(t, 242, 98);

    // Category Tag + Vitrine Showcase count pill
    x.fillStyle = accent;
    x.font = '700 30px ' + K.FONT;
    x.fillText('★ ' + st.tag.toUpperCase() + '  ·  ' + sh.items.length + ' CURATED VITRINE DISPLAYS', 244, 168);

    // Est. / Street Number badge on right
    x.textAlign = 'right';
    x.fillStyle = isNight ? 'rgba(255,255,255,0.55)' : 'rgba(212,175,55,0.85)';
    x.font = '700 24px monospace';
    x.fillText('NO. ' + (100 + sh.k * 12) + ' AVE', 974, 58);

    var tx = new T.CanvasTexture(c);
    tx.anisotropy = 4;
    return tx;
  }

  // Projecting Vertical Metropolitan Blade Sign Texture (Ginza / Broadway / Fifth Ave style)
  function makeBladeSignTex(sh, isNight) {
    var c = document.createElement('canvas');
    c.width = 256; c.height = 768;
    var x = c.getContext('2d');
    var st = sh.type;
    var bg = isNight ? '#070b16' : '#181824';
    var border = isNight ? st.neon : st.gold;

    x.fillStyle = bg;
    K.rr(x, 8, 8, 240, 752, 28);
    x.fill();
    x.lineWidth = 10;
    x.strokeStyle = border;
    K.rr(x, 14, 14, 228, 740, 22);
    x.stroke();

    // Top Icon Circle
    x.fillStyle = border;
    x.beginPath();
    x.arc(128, 102, 58, 0, Math.PI * 2);
    x.fill();
    x.font = '64px ' + K.FONT;
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    x.fillText(st.icon, 128, 105);

    // Vertical stacked word characters or rotated title
    x.save();
    x.translate(128, 435);
    x.rotate(-Math.PI / 2);
    x.fillStyle = '#ffffff';
    x.font = '800 44px ' + K.FONT;
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    var label = sh.title.length > 16 ? st.blade : sh.title.toUpperCase();
    x.fillText(label, 0, -14);
    x.fillStyle = border;
    x.font = '700 24px ' + K.FONT;
    x.fillText(st.tag.toUpperCase(), 0, 28);
    x.restore();

    // Bottom directional arrow toward vitrine
    x.fillStyle = border;
    x.font = '700 26px monospace';
    x.fillText('OPEN 24H', 128, 718);

    var tx = new T.CanvasTexture(c);
    tx.anisotropy = 4;
    return tx;
  }

  // Rich Interior Vitrine Backdrop Mural Texture (Unique to each of the 9 shop archetypes!)
  function makeVitrineBackdropTex(sh, isNight) {
    var c = document.createElement('canvas');
    c.width = 1024; c.height = 512;
    var x = c.getContext('2d');
    var st = sh.type;
    var w = c.width, h = c.height;

    if (st.kind === 'book') {
      // Warm mahogany floor-to-ceiling library bookshelves with hundreds of colorful spines!
      x.fillStyle = '#24150e';
      x.fillRect(0, 0, w, h);
      var bookCols = ['#b91c1c', '#1d4ed8', '#15803d', '#d97706', '#6d28d9', '#0f766e', '#9a3412', '#c2410c'];
      for (var row = 0; row < 4; row++) {
        var sy = 30 + row * 118;
        // Shelf plank
        x.fillStyle = '#452719';
        x.fillRect(20, sy + 96, w - 40, 16);
        x.fillStyle = '#d4af37';
        x.fillRect(20, sy + 96, w - 40, 3);
        var bx = 34;
        while (bx < w - 50) {
          var bw = 18 + ((bx * 13 + row * 7) % 22);
          var bh = 72 + ((bx * 7 + row * 19) % 22);
          x.fillStyle = bookCols[(bx + row) % bookCols.length];
          x.fillRect(bx, sy + (96 - bh), bw - 2, bh);
          x.fillStyle = 'rgba(253,224,71,0.65)';
          x.fillRect(bx + 2, sy + (96 - bh) + 10, bw - 6, 4);
          bx += bw + 2;
        }
      }
      // Center arched brass plaque
      x.fillStyle = 'rgba(20, 12, 8, 0.88)';
      K.rr(x, 312, 36, 400, 96, 16);
      x.fill();
      x.strokeStyle = '#d4af37';
      x.lineWidth = 4;
      K.rr(x, 312, 36, 400, 96, 16);
      x.stroke();
      x.fillStyle = '#fde68a';
      x.font = '700 28px Georgia, serif';
      x.textAlign = 'center';
      x.fillText('RARE EDITIONS & CURATED FOLIOS', 512, 92);

    } else if (st.kind === 'music') {
      // Studio acoustic wall + Gold & Platinum Vinyl Records + Neon Equalizer
      x.fillStyle = '#0f131d';
      x.fillRect(0, 0, w, h);
      // Grid acoustic tiles
      x.strokeStyle = 'rgba(255,255,255,0.06)';
      x.lineWidth = 2;
      for (var gx = 0; gx < w; gx += 64) { x.beginPath(); x.moveTo(gx, 0); x.lineTo(gx, h); x.stroke(); }
      for (var gy = 0; gy < h; gy += 64) { x.beginPath(); x.moveTo(0, gy); x.lineTo(w, gy); x.stroke(); }
      // Mounted Gold & Platinum Vinyl LPs on the back wall
      [170, 380, 644, 854].forEach(function (vx, vi) {
        var vy = 155;
        x.fillStyle = '#111115';
        x.beginPath(); x.arc(vx, vy, 78, 0, Math.PI * 2); x.fill();
        x.strokeStyle = vi % 2 === 0 ? '#fbbf24' : '#38bdf8';
        x.lineWidth = 5;
        x.beginPath(); x.arc(vx, vy, 62, 0, Math.PI * 2); x.stroke();
        x.fillStyle = vi % 2 === 0 ? '#ef4444' : '#ec4899';
        x.beginPath(); x.arc(vx, vy, 26, 0, Math.PI * 2); x.fill();
      });
      // Neon equalizer bars at bottom
      for (var eq = 40; eq < w - 40; eq += 24) {
        var eh = 40 + ((eq * 29) % 140);
        x.fillStyle = eq % 48 === 0 ? '#ff2e63' : '#00f2fe';
        x.fillRect(eq, h - eh - 20, 14, eh);
      }

    } else if (st.kind === 'movie') {
      // Crimson Velvet Theatre Curtain pleats + Golden Art Deco Sunburst
      var grd = x.createLinearGradient(0, 0, 0, h);
      grd.addColorStop(0, '#450a1a');
      grd.addColorStop(1, '#7f1d1d');
      x.fillStyle = grd;
      x.fillRect(0, 0, w, h);
      for (var cx = 0; cx < w; cx += 48) {
        x.fillStyle = 'rgba(0,0,0,0.28)';
        x.fillRect(cx, 0, 22, h);
      }
      // Art Deco golden rays from bottom center
      x.strokeStyle = 'rgba(253, 224, 71, 0.35)';
      x.lineWidth = 4;
      for (var a = 0; a <= 12; a++) {
        var ang = -Math.PI * (a / 12);
        x.beginPath();
        x.moveTo(w / 2, h);
        x.lineTo(w / 2 + Math.cos(ang) * 600, h + Math.sin(ang) * 600);
        x.stroke();
      }
      x.fillStyle = '#fde047';
      x.font = '800 34px ' + K.FONT;
      x.textAlign = 'center';
      x.fillText('★ NOW SHOWING IN PREMIERE VITRINE ★', w / 2, 68);

    } else if (st.kind === 'cafe') {
      // Warm Parisian Bistro Subway Tile + Chalkboard Menu Wall + Brass Shelving
      x.fillStyle = '#f5efe6';
      x.fillRect(0, 0, w, h);
      x.strokeStyle = '#d6cbb9';
      x.lineWidth = 2;
      for (var ty = 0; ty < h; ty += 36) {
        x.beginPath(); x.moveTo(0, ty); x.lineTo(w, ty); x.stroke();
        for (var tx = (ty % 72 === 0 ? 0 : 36); tx < w; tx += 72) {
          x.beginPath(); x.moveTo(tx, ty); x.lineTo(tx, ty + 36); x.stroke();
        }
      }
      // Center Blackboard Menu
      x.fillStyle = '#1c2421';
      K.rr(x, 220, 32, 584, 210, 18);
      x.fill();
      x.strokeStyle = '#92400e';
      x.lineWidth = 10;
      K.rr(x, 220, 32, 584, 210, 18);
      x.stroke();
      x.fillStyle = '#fef3c7';
      x.font = '700 34px Georgia, serif';
      x.textAlign = 'center';
      x.fillText('☕ ARTISAN ROASTERY & SALON', w / 2, 92);
      x.fillStyle = '#86efac';
      x.font = '600 24px monospace';
      x.fillText('SINGLE ORIGIN · ESPRESSO ·PATISSERIE · DIALOGUE', w / 2, 146);
      x.fillStyle = '#fcd34d';
      x.fillText('FRESH ROASTED DAILY · PARIS · TOKYO · NEW YORK', w / 2, 194);

    } else if (st.kind === 'art') {
      // Mondrian / Bauhaus Minimalist High-Fashion Gallery Wall
      x.fillStyle = '#f8fafc';
      x.fillRect(0, 0, w, h);
      x.fillStyle = '#ef4444'; x.fillRect(40, 30, 210, 180);
      x.fillStyle = '#3b82f6'; x.fillRect(780, 260, 200, 210);
      x.fillStyle = '#eab308'; x.fillRect(780, 30, 200, 120);
      x.strokeStyle = '#0f172a';
      x.lineWidth = 12;
      x.strokeRect(40, 30, 940, 440);
      x.beginPath();
      x.moveTo(250, 30); x.lineTo(250, 470);
      x.moveTo(780, 30); x.lineTo(780, 470);
      x.moveTo(40, 210); x.lineTo(980, 210);
      x.stroke();
      x.fillStyle = '#0f172a';
      x.font = '800 36px ' + K.FONT;
      x.textAlign = 'center';
      x.fillText('COLLECTION PERMANENTE', 515, 130);

    } else if (st.kind === 'game') {
      // Cyber Synthwave Neon Grid + Pixel Invaders Backdrop
      x.fillStyle = '#07091e';
      x.fillRect(0, 0, w, h);
      x.strokeStyle = 'rgba(0, 242, 254, 0.35)';
      x.lineWidth = 2;
      for (var cx2 = 0; cx2 < w; cx2 += 48) { x.beginPath(); x.moveTo(cx2, 0); x.lineTo(cx2, h); x.stroke(); }
      for (var cy2 = 0; cy2 < h; cy2 += 48) { x.beginPath(); x.moveTo(0, cy2); x.lineTo(w, cy2); x.stroke(); }
      // Glowing Cyber Sun
      var sunG = x.createLinearGradient(0, 60, 0, 280);
      sunG.addColorStop(0, '#f43f5e');
      sunG.addColorStop(1, '#f59e0b');
      x.fillStyle = sunG;
      x.beginPath(); x.arc(w / 2, 175, 105, 0, Math.PI * 2); x.fill();
      x.fillStyle = '#00f2fe';
      x.font = '800 34px monospace';
      x.textAlign = 'center';
      x.fillText('⚡ HIGH SCORE ARCADE SHOWCASE ⚡', w / 2, 64);

    } else {
      // Lexicon / Science / Classical Curios paneled museum backdrop
      x.fillStyle = st.interior || '#1b2838';
      x.fillRect(0, 0, w, h);
      x.strokeStyle = st.gold || '#fbbf24';
      x.lineWidth = 4;
      for (var p = 0; p < 3; p++) {
        K.rr(x, 48 + p * 316, 36, 296, 440, 14);
        x.stroke();
      }
      x.fillStyle = '#fef08a';
      x.font = '700 30px ' + K.FONT;
      x.textAlign = 'center';
      x.fillText('★ ' + st.tag.toUpperCase() + ' VITRINE ★', w / 2, 86);
    }

    var tx = new T.CanvasTexture(c);
    tx.anisotropy = 4;
    return tx;
  }

  // Awning Stripe Texture per Shop Color Pair
  function makeAwningTex(c1, c2) {
    var c = document.createElement('canvas');
    c.width = 512; c.height = 128;
    var x = c.getContext('2d');
    var stripes = 16, sw = c.width / stripes;
    for (var i = 0; i < stripes; i++) {
      x.fillStyle = i % 2 === 0 ? c1 : c2;
      x.fillRect(i * sw, 0, sw, c.height);
    }
    var tx = new T.CanvasTexture(c);
    tx.wrapS = T.RepeatWrapping;
    return tx;
  }

  // Upper Building Window Grid Texture (Day reflective glass vs Night warm lit apartments)
  function makeFacadeWinTex(arch, isNight, seed) {
    var c = document.createElement('canvas');
    c.width = 256; c.height = 256;
    var x = c.getContext('2d');
    var lit = ((seed * 17) % 10) < 7;
    if (isNight) {
      x.fillStyle = lit ? ((seed % 2 === 0) ? '#fde68a' : '#fed7aa') : '#1e293b';
    } else {
      x.fillStyle = '#475569';
    }
    x.fillRect(0, 0, 256, 256);
    // Window mullions & curtains/blinds
    x.strokeStyle = arch === 'modern_gallery' || arch === 'cyber_glass' ? '#0f172a' : '#f8fafc';
    x.lineWidth = 14;
    x.strokeRect(8, 8, 240, 240);
    x.beginPath();
    x.moveTo(128, 8); x.lineTo(128, 248);
    x.moveTo(8, 128); x.lineTo(248, 128);
    x.stroke();
    // Diagonal reflection streak
    x.fillStyle = 'rgba(255,255,255,0.22)';
    x.beginPath();
    x.moveTo(24, 24); x.lineTo(96, 24); x.lineTo(24, 140);
    x.closePath();
    x.fill();
    return new T.CanvasTexture(c);
  }

  // ======================================================================
  //  STREET KIT — a continuous street wall like a real downtown avenue:
  //  knowledge shops sit between everyday stores, blocks are split by cross
  //  streets, and every building mixes one of 7 architectures with one of
  //  7 shopfront designs.
  // ======================================================================
  var FRONT_X = 9.3, BLOCK_LEN = 46, CROSS_W = 11, START_Z = 6, GH = 4.4, SHOP_W = 12;

  // Everyday neighbours & urban facilities (20 diverse stores & civic services)
  var FILLERS = [
    { name: 'Bloom & Stem', tag: 'FLORIST', kind: 'florist', front: 'cafe', frame: '#1f4d3a', accent: '#f9a8d4', font: 'script' },
    { name: 'Corner Pharmacy', tag: 'PHARMACY · OPEN LATE', kind: 'pharmacy', front: 'boutique', frame: '#f8fafc', accent: '#16a34a', font: 'sans' },
    { name: 'Maison Pain', tag: 'BOULANGERIE', kind: 'bakery', front: 'timber', frame: '#7c2d12', accent: '#fde68a', font: 'didone' },
    { name: 'The Shoe Box', tag: 'SHOES & BOOTS', kind: 'shoes', front: 'boutique', frame: '#111111', accent: '#e5e7eb', font: 'geo' },
    { name: 'Ramen Kaze', tag: 'NOODLE BAR', kind: 'ramen', front: 'noren', frame: '#3b1d14', accent: '#fca5a5', font: 'sans' },
    { name: 'First City Bank', tag: 'EST. 1891', kind: 'bank', front: 'bank', frame: '#d6cfc2', accent: '#1e3a8a', font: 'serif' },
    { name: 'Lumen Opticians', tag: 'EYEWEAR', kind: 'optic', front: 'boutique', frame: '#0f172a', accent: '#93c5fd', font: 'geo' },
    { name: 'Deli & Grocery', tag: '24 HOURS', kind: 'deli', front: 'cafe', frame: '#b91c1c', accent: '#fde047', font: 'sans' },
    { name: 'Clockwork', tag: 'WATCHMAKER', kind: 'watch', front: 'timber', frame: '#1c1917', accent: '#d6b46a', font: 'serif' },
    { name: 'Tea & Tins', tag: 'TEA MERCHANT', kind: 'tea', front: 'timber', frame: '#14532d', accent: '#fcd34d', font: 'serif' },
    { name: 'Atelier Chapeau', tag: 'MILLINER', kind: 'hats', front: 'boutique', frame: '#3f3f46', accent: '#fbcfe8', font: 'didone' },
    { name: 'Paper & Ink', tag: 'STATIONERY', kind: 'paper', front: 'timber', frame: '#1e3a5f', accent: '#bae6fd', font: 'serif' },
    { name: 'Central Post Office', tag: 'POST & TELEGRAPH', kind: 'post', front: 'bank', frame: '#1e3a8a', accent: '#fde047', font: 'serif' },
    { name: 'Dolce Vita Gelato', tag: 'GELATERIA & ESPRESSO', kind: 'gelato', front: 'cafe', frame: '#be185d', accent: '#fef08a', font: 'script' },
    { name: 'Savile Row Bespoke', tag: 'TAILORS · EST. 1904', kind: 'tailor', front: 'timber', frame: '#1c1917', accent: '#e7e5e4', font: 'didone' },
    { name: 'Leica & Silver Halide', tag: 'CAMERA & FILM LAB', kind: 'camera', front: 'boutique', frame: '#18181b', accent: '#ef4444', font: 'geo' },
    { name: 'Bordeaux & Brie', tag: 'WINE & FROMAGERIE', kind: 'wine', front: 'timber', frame: '#4c0519', accent: '#fde68a', font: 'serif' },
    { name: 'Tabac & Newsstand', tag: 'MAGAZINES & PRESS', kind: 'news', front: 'cafe', frame: '#0f766e', accent: '#fef3c7', font: 'sans' },
    { name: 'Orchard & Basket', tag: 'ORGANIC GREENGROCER', kind: 'deli', front: 'cafe', frame: '#15803d', accent: '#fde047', font: 'sans' },
    { name: 'Metropolis Clinic', tag: 'MEDICAL & DENTAL', kind: 'pharmacy', front: 'boutique', frame: '#eff6ff', accent: '#2563eb', font: 'sans' }
  ];
  // knowledge shop kind -> shopfront design
  var FRONT_FOR = {
    book: 'timber', vocab: 'timber', hist: 'bay', art: 'boutique', movie: 'cinema',
    cafe: 'cafe', music: 'neon', game: 'neon', sci: 'flagship',
    dept: 'flagship', market: 'cafe', bank: 'bank', bakery: 'timber', pharm: 'boutique'
  };
  var FONTS = {
    serif: '"Baskerville", "Georgia", serif',
    didone: '"Didot", "Bodoni 72", "Georgia", serif',
    geo: '"Futura", "Avenir Next", "Helvetica Neue", sans-serif',
    sans: '"Avenir Next", "Helvetica Neue", sans-serif',
    script: '"Snell Roundhand", "Brush Script MT", "Georgia", cursive'
  };

  // 7 architectures for the floors above the shop. bay/floor are metres per window cell.
  var ARCHS = {
    brownstone: { bay: 2.3, floor: 3.2, walls: ['#8e4a35', '#7a3e2e', '#9c5a42', '#6e4535'], trim: '#d9cbb3', frame: '#f5f0e6', brick: true },
    castiron:   { bay: 2.6, floor: 3.7, walls: ['#d9d4c7', '#b9c0c4', '#e3d3b8', '#a3aca6'], trim: '#efe9dc', frame: '#2b2b2b', fireEscape: true },
    haussmann:  { bay: 2.4, floor: 3.3, walls: ['#e7dcc6', '#ddd0b6', '#efe5d2'], trim: '#f3ead8', frame: '#f8f5ee', mansard: true },
    glass:      { bay: 1.8, floor: 3.6, walls: ['#6b8296', '#5d7a7f', '#7b8aa0'], trim: '#c7ced6', frame: '#2c3540', flat: true },
    deco:       { bay: 2.0, floor: 3.4, walls: ['#c9b48f', '#b8a27e', '#d6c7a8'], trim: '#e6d6b0', frame: '#3a3226', setback: true },
    loft:       { bay: 3.0, floor: 3.9, walls: ['#9a4b36', '#83402f', '#a35b44'], trim: '#c9b9a3', frame: '#1d1d1d', brick: true, waterTower: true },
    modern:     { bay: 4.0, floor: 3.6, walls: ['#eceae6', '#e2e0dc', '#d7d9db'], trim: '#ffffff', frame: '#3f4650', flat: true }
  };
  var ARCH_IDS = Object.keys(ARCHS);

  function planStreet(shops) {
    var r = K.rng(9137), plan = { blds: [], cross: [] }, fi = 0, ai = 0;
    var queues = { '-1': shops.filter(function (s) { return s.side < 0; }), '1': shops.filter(function (s) { return s.side > 0; }) };
    var nBlocks = Math.max(Math.ceil(queues['-1'].length / 2), Math.ceil(queues['1'].length / 2)) + 1;
    for (var b = 0; b < nBlocks; b++) {
      var z0 = START_Z - b * (BLOCK_LEN + CROSS_W), z1 = z0 - BLOCK_LEN;
      if (b) plan.cross.push({ z0: z0 + CROSS_W, z1: z0, mid: z0 + CROSS_W / 2 });
      [-1, 1].forEach(function (side) {
        var q = queues[side], cursor = z0, n = 0, take = q.splice(0, b === nBlocks - 1 ? q.length : 2);
        while (cursor - z1 > 0.4) {
          var rem = cursor - z1, w, it;
          if (take.length && n % 2 === 1 && rem >= SHOP_W) { it = { shop: take.shift() }; w = SHOP_W; }
          else {
            w = 6 + r() * 3;
            if (take.length && n % 2 === 0) w = Math.min(w, rem - SHOP_W * take.length - 6 * (take.length - 1));
            if (rem - w < 5) w = rem;
            it = { filler: FILLERS[fi++ % FILLERS.length] };
          }
          var arch = ARCH_IDS[(ai++ * 3 + Math.floor(r() * 2)) % ARCH_IDS.length], A = ARCHS[arch];
          it.side = side; it.w = w; it.zc = cursor - w / 2; it.arch = arch;
          it.wall = A.walls[Math.floor(r() * A.walls.length)];
          it.floors = it.shop && it.shop.type.kind === 'sci' ? 4 : 2 + Math.floor(r() * 5);
          it.seed = Math.floor(r() * 1e6);
          plan.blds.push(it);
          cursor -= w; n++;
        }
      });
    }
    plan.zEnd = START_Z - nBlocks * (BLOCK_LEN + CROSS_W) + CROSS_W;
    return plan;
  }

  // ---- facade textures (cached): a 2x2-cell day tile per arch+wall, a 4x4 night overlay per arch
  var FAC = {};
  function canvasTex(w, h, draw, repeat) {
    var c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
    var t = new T.CanvasTexture(c); t.anisotropy = 4; if (repeat) t.wrapS = t.wrapT = T.RepeatWrapping; return t;
  }
  // window rectangle inside a 128x128 cell, per architecture
  function winRect(id) {
    return {
      brownstone: [36, 24, 56, 82], castiron: [24, 14, 80, 100], haussmann: [40, 14, 48, 98], glass: [3, 3, 122, 100],
      deco: [26, 10, 76, 92], loft: [12, 14, 104, 96], modern: [0, 22, 128, 74]
    }[id];
  }
  function glassFill(g, x, y, w, h) {
    var gr = g.createLinearGradient(x, y, x + w * 0.4, y + h);
    gr.addColorStop(0, '#9fb6c9'); gr.addColorStop(0.45, '#56697c'); gr.addColorStop(1, '#2a3440');
    g.fillStyle = gr; g.fillRect(x, y, w, h);
    g.fillStyle = 'rgba(255,255,255,.16)'; g.beginPath(); g.moveTo(x, y + h * 0.15); g.lineTo(x + w * 0.35, y); g.lineTo(x + w * 0.55, y); g.lineTo(x, y + h * 0.5); g.fill();
  }
  function facadeDay(id, wall) {
    var key = id + '|' + wall; if (FAC[key]) return FAC[key];
    var A = ARCHS[id], R = winRect(id), rr = K.rng(K.hash(key));
    FAC[key] = canvasTex(256, 256, function (g) {
      g.fillStyle = wall; g.fillRect(0, 0, 256, 256);
      if (A.brick) {                          // brick courses
        for (var by = 0; by < 256; by += 8) {
          g.fillStyle = 'rgba(0,0,0,.10)'; g.fillRect(0, by, 256, 1);
          for (var bx = (by / 8) % 2 ? 0 : 12; bx < 256; bx += 24) g.fillRect(bx, by, 1, 8);
          for (var bk = 0; bk < 8; bk++) { g.fillStyle = 'rgba(' + (rr() < 0.5 ? '0,0,0' : '255,255,255') + ',' + (rr() * 0.06) + ')'; g.fillRect(rr() * 256, by + 1, 23, 7); }
        }
      } else if (id === 'haussmann' || id === 'deco' || id === 'castiron') {
        g.fillStyle = 'rgba(0,0,0,.07)'; for (var sy = 0; sy < 256; sy += 16) g.fillRect(0, sy, 256, 1);
      }
      for (var cx = 0; cx < 2; cx++) for (var cy = 0; cy < 2; cy++) {
        var x0 = cx * 128, y0 = cy * 128, x = x0 + R[0], y = y0 + R[1], w = R[2], h = R[3];
        if (id === 'deco') { g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(x0, y0, 22, 128); g.fillStyle = 'rgba(60,45,25,.55)'; g.fillRect(x, y0 + 104, w, 22); }
        if (id === 'glass') { g.fillStyle = '#2c3540'; g.fillRect(x0, y0 + 104, 128, 24); }
        if (id === 'castiron') {            // arched head + pilaster columns
          g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(x0, y0, 12, 128); g.fillRect(x0 + 116, y0, 12, 128);
          g.save(); g.beginPath(); g.moveTo(x, y + h); g.lineTo(x, y + w / 2); g.arc(x + w / 2, y + w / 2, w / 2, Math.PI, 0); g.lineTo(x + w, y + h); g.closePath(); g.clip();
          glassFill(g, x, y, w, h); g.restore();
          g.strokeStyle = A.frame; g.lineWidth = 4; g.beginPath(); g.moveTo(x + w / 2, y + 6); g.lineTo(x + w / 2, y + h); g.moveTo(x, y + h * 0.55); g.lineTo(x + w, y + h * 0.55); g.stroke();
          continue;
        }
        glassFill(g, x, y, w, h);
        g.strokeStyle = A.frame; g.lineWidth = id === 'glass' || id === 'modern' ? 3 : 5; g.strokeRect(x, y, w, h);
        g.beginPath();
        if (id === 'brownstone') { g.moveTo(x, y + h / 2); g.lineTo(x + w, y + h / 2); g.fillStyle = A.trim; g.fillRect(x - 6, y - 12, w + 12, 10); g.fillRect(x - 4, y + h, w + 8, 6); }
        if (id === 'haussmann') { g.moveTo(x + w / 2, y); g.lineTo(x + w / 2, y + h); g.moveTo(x, y + h * 0.3); g.lineTo(x + w, y + h * 0.3); }
        if (id === 'loft') { for (var m = 1; m < 4; m++) { g.moveTo(x + w * m / 4, y); g.lineTo(x + w * m / 4, y + h); g.moveTo(x, y + h * m / 4); g.lineTo(x + w, y + h * m / 4); } g.fillStyle = A.trim; g.fillRect(x - 4, y - 8, w + 8, 7); }
        if (id === 'glass') { g.moveTo(x + w / 2, y); g.lineTo(x + w / 2, y + h); }
        if (id === 'modern') { g.moveTo(x + 64, y); g.lineTo(x + 64, y + h); }
        if (id === 'deco') { g.moveTo(x + w / 2, y); g.lineTo(x + w / 2, y + h); g.moveTo(x, y + h * 0.25); g.lineTo(x + w, y + h * 0.25); }
        g.stroke();
        if (id === 'haussmann') {          // wrought-iron rail across the French window
          g.strokeStyle = '#1b1b1b'; g.lineWidth = 2; g.strokeRect(x - 4, y + h - 22, w + 8, 20);
          for (var q = 0; q < 6; q++) { g.beginPath(); g.ellipse(x + 4 + q * 8, y + h - 12, 3, 7, 0, 0, Math.PI * 2); g.stroke(); }
        }
      }
    }, true);
    return FAC[key];
  }
  function facadeNight(id) {
    var key = 'n|' + id; if (FAC[key]) return FAC[key];
    var R = winRect(id), rr = K.rng(K.hash(key)), warm = ['#ffd27a', '#ffc46b', '#ffe3a3', '#fff1c9', '#ffb35c', '#cfe3ff'];
    FAC[key] = canvasTex(512, 512, function (g) {
      g.fillStyle = '#000'; g.fillRect(0, 0, 512, 512);
      for (var cx = 0; cx < 4; cx++) for (var cy = 0; cy < 4; cy++) {
        if (rr() < 0.42) continue;
        var x = cx * 128 + R[0] + 4, y = cy * 128 + R[1] + 4, w = R[2] - 8, h = R[3] - 8;
        var c = warm[Math.floor(rr() * warm.length)], gr = g.createLinearGradient(0, y, 0, y + h);
        gr.addColorStop(0, c); gr.addColorStop(1, 'rgba(120,70,20,.6)');
        g.globalAlpha = 0.55 + rr() * 0.45; g.fillStyle = gr; g.fillRect(x, y, w, h);
        if (rr() < 0.4) { g.fillStyle = 'rgba(0,0,0,.55)'; g.fillRect(x, y, w * (0.3 + rr() * 0.4), h); }   // curtain
      }
      g.globalAlpha = 1;
    }, true);
    return FAC[key];
  }

  // ---- shop signs: font per style, auto-fit (never clipped), day & night versions
  function makeSign(o, night) {
    return canvasTex(1024, 192, function (g, w, h) {
      var bg = o.bg, fg = o.fg, font = FONTS[o.font] || FONTS.sans;
      if (o.style === 'glass') { g.clearRect(0, 0, w, h); } else { g.fillStyle = bg; g.fillRect(0, 0, w, h); }
      if (o.style === 'painted') {          // raised moulding
        g.strokeStyle = 'rgba(255,255,255,.18)'; g.lineWidth = 6; g.strokeRect(14, 14, w - 28, h - 28);
        g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 3; g.strokeRect(22, 22, w - 44, h - 44);
      }
      var sub = o.sub || '', fs = 104, t = o.title;
      g.textAlign = 'center'; g.textBaseline = 'middle';
      var caps = o.font === 'geo' || o.font === 'sans';
      if (caps) t = t.toUpperCase();
      do { g.font = (o.font === 'script' ? '400 ' : '700 ') + fs + 'px ' + font; fs -= 4; } while (g.measureText(t).width > w - 120 && fs > 30);
      var ty = sub ? h * 0.43 : h * 0.52;
      if (night && o.glow) { g.shadowColor = o.glow; g.shadowBlur = 28; }
      if (o.gilt) {                          // gilded letters with a dark drop shadow
        g.fillStyle = 'rgba(0,0,0,.45)'; g.fillText(t, w / 2 + 3, ty + 4);
        var gg = g.createLinearGradient(0, ty - fs / 2, 0, ty + fs / 2); gg.addColorStop(0, '#fff1b8'); gg.addColorStop(0.5, '#d4a93c'); gg.addColorStop(1, '#9a7420');
        g.fillStyle = gg;
      } else g.fillStyle = fg;
      g.fillText(t, w / 2, ty);
      if (sub) {
        g.shadowBlur = 0; g.font = '600 30px ' + FONTS.sans; g.fillStyle = o.subFg || fg; g.globalAlpha = 0.85;
        var s = sub.toUpperCase().split('').join(String.fromCharCode(8202));
        while (g.measureText(s).width > w - 160 && s.length > 6) s = s.slice(0, -2);
        g.fillText(s, w / 2, h * 0.8); g.globalAlpha = 1;
      }
    });
  }
  function makeHangSign(icon, bg, ring) {
    return canvasTex(256, 256, function (g, w, h) {
      g.fillStyle = bg; g.beginPath(); g.arc(128, 128, 120, 0, Math.PI * 2); g.fill();
      g.strokeStyle = ring; g.lineWidth = 12; g.beginPath(); g.arc(128, 128, 108, 0, Math.PI * 2); g.stroke();
      g.font = '120px ' + K.FONT; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(icon, 128, 136);
    });
  }
  // everyday-store interiors: shelves with goods in the store's palette
  var GOODS = {
    florist: ['#f472b6', '#fb7185', '#facc15', '#a78bfa', '#f9fafb'], pharmacy: ['#ffffff', '#86efac', '#93c5fd', '#fca5a5'],
    bakery: ['#d6a35c', '#b7793a', '#f1d39b', '#8a5a2b'], shoes: ['#111827', '#7c2d12', '#e5e7eb', '#b45309'],
    ramen: ['#fef3c7', '#7f1d1d', '#fca5a5', '#1f2937'], bank: ['#1e3a8a', '#d6cfc2'], optic: ['#0f172a', '#93c5fd', '#e5e7eb'],
    deli: ['#ef4444', '#f59e0b', '#22c55e', '#fde047', '#3b82f6'], watch: ['#d6b46a', '#e5e7eb', '#1c1917'],
    tea: ['#14532d', '#b91c1c', '#fcd34d', '#1e3a8a'], hats: ['#fbcfe8', '#3f3f46', '#e7e5e4', '#7c3aed'], paper: ['#1e3a5f', '#bae6fd', '#fde68a', '#f472b6']
  };
  function interiorTex(kind, wallCol) {
    var key = 'int|' + kind; if (FAC[key]) return FAC[key];
    var pal = GOODS[kind] || K.PAL, rr = K.rng(K.hash(key));
    FAC[key] = canvasTex(512, 256, function (g, w, h) {
      g.fillStyle = wallCol || '#efe7da'; g.fillRect(0, 0, w, h);
      var gr = g.createRadialGradient(w / 2, 40, 10, w / 2, 40, 300); gr.addColorStop(0, 'rgba(255,240,210,.55)'); gr.addColorStop(1, 'rgba(0,0,0,.25)');
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
      if (kind === 'bank') { g.fillStyle = '#4a3423'; g.fillRect(0, 150, w, 106); g.fillStyle = '#d6b46a'; g.fillRect(0, 150, w, 4); return; }
      for (var row = 0; row < 3; row++) {
        var sy = 60 + row * 66;
        g.fillStyle = '#5b4636'; g.fillRect(20, sy, w - 40, 6);
        for (var x = 26; x < w - 40;) {
          var iw = 10 + rr() * 22, ih = 14 + rr() * 30;
          g.fillStyle = pal[Math.floor(rr() * pal.length)];
          if (kind === 'florist' || kind === 'bakery') { g.beginPath(); g.ellipse(x + iw / 2, sy - ih / 3, iw / 2, ih / 3, 0, 0, Math.PI * 2); g.fill(); }
          else g.fillRect(x, sy - ih, iw, ih);
          x += iw + 3 + rr() * 6;
        }
      }
    });
    return FAC[key];
  }
  function glassReflTex() {
    if (FAC.refl) return FAC.refl;
    FAC.refl = canvasTex(256, 256, function (g, w, h) {
      var gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(210,228,245,.55)'); gr.addColorStop(0.5, 'rgba(150,175,200,.12)'); gr.addColorStop(1, 'rgba(255,255,255,.05)');
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
      g.fillStyle = 'rgba(255,255,255,.22)'; g.beginPath(); g.moveTo(40, 0); g.lineTo(110, 0); g.lineTo(10, h); g.lineTo(-60, h); g.fill();
      g.fillStyle = 'rgba(255,255,255,.12)'; g.beginPath(); g.moveTo(150, 0); g.lineTo(175, 0); g.lineTo(95, h); g.lineTo(70, h); g.fill();
    });
    return FAC.refl;
  }

  function City(opts) {
    opts = opts || {};
    var self = this;
    var P = opts.provider || K.defaultProvider();
    var DATA = buildCityShops(P, opts.source || { type: 'workspace' });
    var shops = DATA.shops;
    var saved = opts.fresh ? {} : DB.get(DATA.key);

    var styleIdx = STYLES.findIndex(function (s) { return s.id === (opts.style || saved.style); });
    if (styleIdx < 0) styleIdx = 0;

    var st = {
      style: STYLES[styleIdx].id,
      night: opts.night != null ? (opts.night ? 1 : 0) : (saved.night || 0),
      nightMix: opts.night ? 1 : (saved.night ? 1 : 0),
      run: saved.run !== false,
      shop: -1,
      itemIdx: -1
    };

    var PLAN = planStreet(shops);
    var STREET_LEN = START_Z - PLAN.zEnd + 10;
    var ZEND = PLAN.zEnd + 4;
    function inCross(z, m) { m = m || 0; return PLAN.cross.some(function (c) { return z < c.z0 + m && z > c.z1 - m; }); }

    var S = X.stage({
      cls: 'kc-root' + (st.night ? ' night' : ''),
      maxDpr: 1.5,   // phones render at 1.5× — far fewer pixels, same look
      container: opts.container,
      onExit: opts.onExit,
      hFov: 70,
      maxFov: 84,
      far: 480,
      hint: 'Tap card to flip · tap outside to return to the street',
      html:
        '<div class="kx-top">' +
          '<div class="kx-pill"><i></i><span><b></b><small></small></span></div>' +
          '<div class="kx-tr">' +
            '<button type="button" class="kx-b kc-b-time ' + (st.night ? 'night' : 'day') + '" data-kx="time"></button>' +
            '<button type="button" class="kx-b" data-kx="shops">🏪 <span>Shops (' + shops.length + ')</span></button>' +
            '<button type="button" class="kx-b" data-kx="exit" aria-label="Exit">✕</button>' +
          '</div>' +
        '</div>' +
        '<div class="kc-shop-card" hidden>' +
          '<div class="kc-shop-ic"></div>' +
          '<div class="kc-shop-info"><b></b><small></small></div>' +
          '<div class="kc-shop-items"></div>' +
        '</div>' +
        '<div class="kx-bar">' +
          '<button type="button" class="kx-b" data-kx="prev" aria-label="Previous shop">◀</button>' +
          '<button type="button" class="kx-b kc-run" data-kx="run"></button>' +
          '<button type="button" class="kx-b" data-kx="next" aria-label="Next shop">▶</button>' +
          '<button type="button" class="kx-b kc-out" data-kx="out" hidden>⤺ <span>Avenue</span></button>' +
          '<button type="button" class="kx-b kc-sg" data-kx="suggest"></button>' +
        '</div>' +
        '<div class="kx-sheet" hidden>' +
          '<div class="kx-card">' +
            '<div class="kx-head"><b>🏙 Metropolis Flagship Directory</b><button type="button" class="kx-b" data-kx="shops">✕</button></div>' +
            '<div class="kx-list"></div>' +
          '</div>' +
        '</div>'
    });

    var scene = S.scene, cam = S.cam, RD = X.reader(S);
    var MCACHE = {};   // look-alike materials are shared, so static meshes merge into a few draws
    function XM(c, o) { var k = c + JSON.stringify(o || {}); return MCACHE[k] || (MCACHE[k] = X.M(c, o)); }

    // ---------------- Sky, Lights & Metropolitan Avenue Environment ----------------
    var skyGeo = new T.SphereGeometry(420, 22, 14);
    var sky = new T.Mesh(skyGeo, new T.MeshBasicMaterial({ vertexColors: true, side: T.BackSide, fog: false, depthWrite: false }));
    sky.renderOrder = -10;
    scene.add(sky);
    scene.fog = new T.Fog('#dce8f5', 55, 360);

    var hemi = new T.HemisphereLight('#ffffff', '#6b5a48', 0.9);
    var sun = new T.DirectionalLight('#fff5dc', 1.12);
    sun.position.set(28, 56, 36);
    var streetGlow = new T.PointLight('#ffbe76', 0, 28, 1.4);
    scene.add(hemi, sun, streetGlow);

    var mRoad = new T.MeshStandardMaterial({ color: '#2b303c', roughness: 0.78, metalness: 0.12 });
    var mWalk = X.M('#d6d3cd', { roughness: 0.88 });
    var mCurb = X.M('#94a3b8', { roughness: 0.82 });
    var mStripe = new T.MeshBasicMaterial({ color: '#f8fafc' });
    var mYellowLine = new T.MeshBasicMaterial({ color: '#facc15' });
    var mLampPost = XM('#1e293b', { metalness: 0.6, roughness: 0.35 });
    var mBulb = new T.MeshBasicMaterial({ color: '#fffbeb' });
    var mCone = new T.MeshBasicMaterial({ color: '#fde68a', transparent: true, opacity: 0, depthWrite: false, side: T.DoubleSide });

    // 1. Multi-Lane Metropolitan Boulevard, Crosswalks & Sidewalks
    var road = new T.Mesh(new T.PlaneGeometry(9.6, STREET_LEN + 60), mRoad);
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0, -STREET_LEN / 2 + 12);
    scene.add(road);

    var skylineMats = [];
    var skyMat0 = X.M('#8fa6c2', { roughness: 0.75, metalness: 0.18 }); skylineMats.push(skyMat0);
    var crossCars = [];
    // Centre promenade (the running path) split by the cross streets; one traffic lane each side
    var mProm = XM('#cfc8bb', { roughness: 0.9 }), mHedge = XM('#3f6b3a', { roughness: 0.9 });
    var segs = [[START_Z + 30, START_Z]].concat(PLAN.cross.map(function (c, i) { return [c.z1, (PLAN.cross[i + 1] ? PLAN.cross[i + 1].z0 : ZEND - 40)]; }));
    segs.forEach(function (sg) {
      var len = sg[0] - sg[1]; if (len <= 0) return;
      var pm = new T.Mesh(new T.BoxGeometry(3.0, 0.14, len), mProm); pm.position.set(0, 0.07, sg[1] + len / 2); scene.add(pm);
      [-1.55, 1.55].forEach(function (ex) { var cb2 = new T.Mesh(new T.BoxGeometry(0.12, 0.18, len), XM('#94a3b8')); cb2.position.set(ex, 0.09, sg[1] + len / 2); scene.add(cb2); });
      for (var hz = sg[0] - 4; hz > sg[1] + 3; hz -= 7.5) [-1.12, 1.12].forEach(function (hx) {
        var hb = new T.Mesh(new T.BoxGeometry(0.5, 0.42, 2.2), mHedge); hb.position.set(hx, 0.35, hz); scene.add(hb);
      });
    });
    for (var dz = 6; dz > ZEND - 18; dz -= 5.0) [-4.55, 4.55].forEach(function (lx) {
      var edge = new T.Mesh(new T.PlaneGeometry(0.1, 2.6), mStripe); edge.rotation.x = -Math.PI / 2; edge.position.set(lx, 0.012, dz); scene.add(edge);
    });

    // Cross streets: zebras on both sides of the junction, side avenues with storefronts, metro entrances, bus shelters & civic plazas
    var sideShopPalette = ['#7c2d12', '#1e3a8a', '#14532d', '#701a75', '#312e81', '#881337', '#0f766e', '#92400e'];
    PLAN.cross.forEach(function (c, cIdx) {
      [c.z0 - 1.6, c.z1 + 1.6].forEach(function (zz) {
        for (var sx = -4.4; sx <= 4.4; sx += 0.7) { var zb = new T.Mesh(new T.PlaneGeometry(0.4, 2.4), mStripe); zb.rotation.x = -Math.PI / 2; zb.position.set(sx, 0.015, zz); scene.add(zb); }
      });

      // Central Civic Fountain Monument in the middle intersection!
      if (cIdx === Math.floor(PLAN.cross.length / 2)) {
        var ftn = new T.Group(); ftn.position.set(0, 0.05, c.mid);
        var fBase = new T.Mesh(new T.CylinderGeometry(2.2, 2.4, 0.45, 20), XM('#94a3b8')); fBase.position.y = 0.22;
        var fWater = new T.Mesh(new T.CylinderGeometry(1.9, 1.9, 0.32, 20), new T.MeshBasicMaterial({ color: '#38bdf8' })); fWater.position.y = 0.35;
        var fPillar = new T.Mesh(new T.CylinderGeometry(0.35, 0.5, 2.4, 12), XM('#cbd5e1')); fPillar.position.y = 1.3;
        var fBowl = new T.Mesh(new T.CylinderGeometry(1.1, 0.35, 0.4, 16), XM('#e2e8f0')); fBowl.position.y = 2.3;
        var fOrb = new T.Mesh(new T.TorusKnotGeometry(0.42, 0.12, 48, 10), XM('#fbbf24', { metalness: 0.7, roughness: 0.25 })); fOrb.position.y = 3.2;
        ftn.add(fBase, fWater, fPillar, fBowl, fOrb);
        scene.add(ftn);
      }

      [-1, 1].forEach(function (sd) {
        var side = new T.Mesh(new T.PlaneGeometry(90, CROSS_W - 3.2), mRoad); side.rotation.x = -Math.PI / 2; side.position.set(sd * (FRONT_X + 45 - 4.4), 0.004, c.mid); scene.add(side);
        // Side-street dashed center yellow line
        for (var slx = 12; slx < 80; slx += 5) {
          var sl = new T.Mesh(new T.PlaneGeometry(2.2, 0.12), mYellowLine); sl.rotation.x = -Math.PI / 2; sl.position.set(sd * slx, 0.012, c.mid); scene.add(sl);
        }
        [c.z0 - 0.8, c.z1 + 0.8].forEach(function (pz) { var pv = new T.Mesh(new T.BoxGeometry(82, 0.18, 1.8), mWalk); pv.position.set(sd * (FRONT_X + 41), 0.09, pz); scene.add(pv); });

        // Side-avenue buildings with lit ground-floor shopfronts & awnings!
        [[c.z0 + 4.8, -1], [c.z1 - 4.8, 1]].forEach(function (bz, bi) {
          for (var bk = 0; bk < 5; bk++) {
            var bxPos = sd * (FRONT_X + 13 + bk * 13);
            var hgt = 14 + ((bk * 7 + bi * 5 + Math.abs(Math.round(c.mid))) % 5) * 5.5;
            var bm = skyMat0;
            var bb = new T.Mesh(new T.BoxGeometry(11.5, hgt, 9), bm); bb.position.set(bxPos, hgt / 2, bz[0]); scene.add(bb);

            // Ground-floor storefront fascia, awning & glowing vitrine facing the cross street!
            var sfCol = sideShopPalette[(bk + bi + cIdx) % sideShopPalette.length];
            var zFace = bz[0] + bz[1] * 4.55;
            var sFascia = new T.Mesh(new T.BoxGeometry(11.2, 0.85, 0.25), XM(sfCol));
            sFascia.position.set(bxPos, 3.8, zFace);
            var sGlass = new T.Mesh(new T.PlaneGeometry(10.2, 2.8), new T.MeshBasicMaterial({ color: (bk + cIdx) % 2 === 0 ? '#fde68a' : '#bae6fd' }));
            sGlass.position.set(bxPos, 1.9, zFace + bz[1] * 0.08);
            if (bz[1] < 0) sGlass.rotation.y = Math.PI;
            var sAwning = new T.Mesh(new T.BoxGeometry(10.6, 0.12, 1.4), XM(sfCol));
            sAwning.position.set(bxPos, 3.25, zFace + bz[1] * 0.65);
            scene.add(sFascia, sGlass, sAwning);
          }
        });

        // Metro Station Entrance Pavilion or Bus Shelter on intersection corners
        var metroG = new T.Group();
        metroG.position.set(sd * 6.8, 0, c.z0 + 1.8);
        var mCanopy = new T.Mesh(new T.BoxGeometry(1.9, 0.16, 3.2), XM('#0f172a', { metalness: 0.5 })); mCanopy.position.y = 2.65;
        var mGlassWall = new T.Mesh(new T.BoxGeometry(0.08, 2.5, 3.0), new T.MeshBasicMaterial({ color: '#38bdf8', transparent: true, opacity: 0.35 }));
        mGlassWall.position.set(sd * 0.85, 1.3, 0);
        var mSign = new T.Mesh(new T.BoxGeometry(1.8, 0.45, 0.12), new T.MeshBasicMaterial({ color: cIdx % 2 === 0 ? '#0284c7' : '#16a34a' }));
        mSign.position.set(0, 2.95, 1.55);
        metroG.add(mCanopy, mGlassWall, mSign);
        scene.add(metroG);

        // Cross-street moving car
        var ccG = new T.Group();
        var ccCol = ['#facc15', '#38bdf8', '#f43f5e', '#f8fafc'][(cIdx + (sd > 0 ? 1 : 0)) % 4];
        var ccBody = new T.Mesh(new T.BoxGeometry(3.2, 0.52, 1.5), XM(ccCol, { roughness: 0.35, metalness: 0.3 })); ccBody.position.y = 0.42;
        var ccCab = new T.Mesh(new T.BoxGeometry(1.7, 0.42, 1.3), XM('#1e293b')); ccCab.position.y = 0.85;
        ccG.add(ccBody, ccCab);
        ccG.position.set(sd * (18 + cIdx * 7), 0, c.mid + (sd > 0 ? 1.6 : -1.6));
        scene.add(ccG);
        crossCars.push({ mesh: ccG, dir: -sd, spd: 6.0 + (cIdx % 3) * 1.5 });

        var tl = new T.Group(); tl.position.set(sd * 5.0, 0, c.z1 + 0.6);
        var pole = new T.Mesh(new T.CylinderGeometry(0.07, 0.09, 5.0, 8), mLampPost); pole.position.y = 2.5;
        var mast = new T.Mesh(new T.BoxGeometry(2.4, 0.08, 0.08), mLampPost); mast.position.set(-sd * 1.15, 4.85, 0);
        var hd = new T.Mesh(new T.BoxGeometry(0.28, 0.78, 0.22), mLampPost); hd.position.set(-sd * 2.1, 4.55, 0);
        tl.add(pole, mast, hd);
        ['#ef4444', '#f59e0b', '#22c55e'].forEach(function (lc, li) { var lb = new T.Mesh(new T.SphereGeometry(0.075, 8, 8), new T.MeshBasicMaterial({ color: lc })); lb.position.set(-sd * 2.1, 4.78 - li * 0.23, 0.11); tl.add(lb); });
        var sgn = new T.Mesh(new T.BoxGeometry(1.4, 0.3, 0.04), XM('#166534')); sgn.position.set(0, 3.4, 0); tl.add(sgn);
        scene.add(tl);
      });
    });

    // Wide Paver Sidewalks & Granite Curbs
    [-1, 1].forEach(function (sd) {
      var sw = new T.Mesh(new T.BoxGeometry(6.2, 0.18, STREET_LEN + 60), mWalk);
      sw.position.set(sd * 7.9, 0.09, -STREET_LEN / 2 + 12);
      scene.add(sw);
      var cb = new T.Mesh(new T.BoxGeometry(0.22, 0.2, STREET_LEN + 60), mCurb);
      cb.position.set(sd * 4.85, 0.1, -STREET_LEN / 2 + 12);
      scene.add(cb);
    });

    // 2. Street Furniture: Cast-Iron Double-Globe Streetlamps, Trees, Planters, Metro Entrance & Newsstands
    var KT = K.kit();
    for (var lz = 2; lz > ZEND - 10; lz -= 15.5) {
      [-1, 1].forEach(function (sd, sIdx) {
        if (inCross(lz, 1.5)) return;
        var lx = sd * 5.25;
        // Double-globe Parisian/Fifth-Ave boulevard streetlamp
        var post = new T.Mesh(new T.CylinderGeometry(0.06, 0.1, 4.4, 8), mLampPost);
        post.position.set(lx, 2.2, lz);
        var crossBar = new T.Mesh(new T.BoxGeometry(0.95, 0.06, 0.06), mLampPost);
        crossBar.position.set(lx, 4.25, lz);
        var b1 = new T.Mesh(new T.SphereGeometry(0.17, 10, 8), mBulb);
        b1.position.set(lx - 0.42, 4.4, lz);
        var b2 = new T.Mesh(new T.SphereGeometry(0.17, 10, 8), mBulb);
        b2.position.set(lx + 0.42, 4.4, lz);
        var cone = new T.Mesh(new T.ConeGeometry(1.8, 4.1, 12, 1, true), mCone);
        cone.position.set(lx - sd * 0.3, 2.1, lz);
        scene.add(post, crossBar, b1, b2, cone);

        // Street tree in granite planter box
        if (inCross(lz - 7.5, 1.5)) return;
        var planter = new T.Mesh(new T.BoxGeometry(0.95, 0.36, 0.95), XM('#64748b'));
        planter.position.set(sd * 5.45, 0.32, lz - 7.5);
        var tree = new T.Mesh(KT.round.geo, KT.round.mat);
        tree.position.set(sd * 5.45, 0.36, lz - 7.5);
        tree.scale.setScalar(0.62);
        scene.add(planter, tree);

        // Cast-iron & slatted wood boulevard bench
        var hyd = new T.Mesh(new T.CylinderGeometry(0.13, 0.15, 0.62, 10), XM('#b91c1c')); hyd.position.set(sd * 5.35, 0.49, lz - 11.5); if (!inCross(lz - 11.5, 1)) scene.add(hyd);
        var nb = new T.Mesh(new T.BoxGeometry(0.45, 1.0, 0.45), XM(sIdx ? '#1d4ed8' : '#ca8a04')); nb.position.set(sd * 5.4, 0.68, lz - 5.6); if (!inCross(lz - 5.6, 1)) scene.add(nb);
        if (inCross(lz - 3.8, 1.5)) return;
        var bench = new T.Mesh(new T.BoxGeometry(0.55, 0.45, 1.45), XM('#5c3a21'));
        bench.position.set(sd * 5.5, 0.38, lz - 3.8);
        scene.add(bench);
      });
    }

    // 3. Towering Metropolis Skyline Backdrop (Skyscrapers, Stepped Art-Deco Towers, Spires & Rooftop Billboards)
    var skyWinMats = [];
    var skyWinB = new T.MeshBasicMaterial({ color: '#38bdf8', transparent: true, opacity: 0.25 }), skyWinY = new T.MeshBasicMaterial({ color: '#fde68a', transparent: true, opacity: 0.25 }); skyWinMats.push(skyWinB, skyWinY);
    for (var sz = 12; sz > ZEND - 45; sz -= 18) {
      [-1, 1].forEach(function (sd) {
        if (inCross(sz, 7)) return;
        var seed = Math.abs(Math.round(sz * 3 + sd * 7));
        var tw = 11 + (seed % 5) * 2.2;
        var td = 10 + (seed % 4) * 2.0;
        var th = 24 + (seed % 6) * 7.5;
        var tx = sd * (21 + (seed % 3) * 4.5);

        var sMat = skyMat0;

        var tower = new T.Mesh(new T.BoxGeometry(tw, th, td), sMat);
        tower.position.set(tx, th / 2, sz);
        scene.add(tower);

        // Stepped Art-Deco crown + illuminated spire
        var crown = new T.Mesh(new T.BoxGeometry(tw * 0.68, 4.5, td * 0.68), sMat);
        crown.position.set(tx, th + 2.25, sz);
        scene.add(crown);

        if (seed % 2 === 0) {
          var spire = new T.Mesh(new T.CylinderGeometry(0.08, 0.25, 7.5, 8), mLampPost);
          spire.position.set(tx, th + 8.0, sz);
          var beacon = new T.Mesh(new T.SphereGeometry(0.28, 8, 8), new T.MeshBasicMaterial({ color: seed % 4 === 0 ? '#ef4444' : '#38bdf8' }));
          beacon.position.set(tx, th + 11.8, sz);
          scene.add(spire, beacon);
        }

        // Illuminated skyscraper window strips facing the street
        var swMat = seed % 3 === 0 ? skyWinB : skyWinY;
        for (var wy = 8; wy < th - 3; wy += 3.2) {
          var strip = new T.Mesh(new T.PlaneGeometry(tw * 0.76, 1.3), swMat);
          strip.position.set(tx - sd * (td / 2 + 0.08), wy, sz);
          strip.rotation.y = sd < 0 ? Math.PI / 2 : -Math.PI / 2;
          scene.add(strip);
        }
      });
    }

    // Distant Iconic Metropolis Horizon Tower at the end of the avenue (`ZEND - 38`)
    var spireTowerGroup = new T.Group();
    spireTowerGroup.position.set(0, 0, ZEND - 38);
    var stBaseMat = XM('#64748b', { roughness: 0.5, metalness: 0.35 });
    skylineMats.push(stBaseMat);
    var stTier1 = new T.Mesh(new T.BoxGeometry(16, 42, 16), stBaseMat);
    stTier1.position.y = 21;
    var stTier2 = new T.Mesh(new T.BoxGeometry(11, 22, 11), stBaseMat);
    stTier2.position.y = 53;
    var stTier3 = new T.Mesh(new T.CylinderGeometry(0.3, 3.8, 18, 12), stBaseMat);
    stTier3.position.y = 73;
    var stRing = new T.Mesh(new T.TorusGeometry(6.2, 0.35, 8, 24), new T.MeshBasicMaterial({ color: '#38bdf8' }));
    stRing.rotation.x = Math.PI / 2;
    stRing.position.y = 60;
    spireTowerGroup.add(stTier1, stTier2, stTier3, stRing);
    scene.add(spireTowerGroup);

    // 4. Moving Metropolitan Vehicles (12 Yellow Cabs, City Buses & Cyber Coupes gliding along the 2 lanes!)
    var cars = [];
    var carColors = ['#facc15', '#ef4444', '#38bdf8', '#f8fafc', '#facc15', '#a855f7', '#10b981', '#facc15'];
    for (var ci = 0; ci < 12; ci++) {
      var laneDir = ci % 2 === 0 ? -1 : 1; // -1 drives toward ZEND (right lane +3.15), +1 drives toward 0 (left lane -3.15)
      var laneX = laneDir < 0 ? 3.15 : -3.15;
      var cg = new T.Group();
      var cCol = carColors[ci % carColors.length];
      var isBus = (ci % 5 === 4);
      var cBody = new T.Mesh(new T.BoxGeometry(isBus ? 1.85 : 1.55, isBus ? 1.45 : 0.52, isBus ? 5.2 : 3.3), XM(cCol, { roughness: 0.35, metalness: 0.3 }));
      cBody.position.y = isBus ? 0.92 : 0.42;
      var cCab = new T.Mesh(new T.BoxGeometry(isBus ? 1.78 : 1.32, 0.44, isBus ? 4.8 : 1.75), XM('#1e293b', { roughness: 0.2, metalness: 0.5 }));
      cCab.position.set(0, isBus ? 1.35 : 0.86, isBus ? 0 : -0.15 * laneDir);
      cg.add(cBody, cCab);

      // Taxi roof sign on yellow cabs
      if (cCol === '#facc15' && !isBus) {
        var taxiSign = new T.Mesh(new T.BoxGeometry(0.55, 0.18, 0.24), new T.MeshBasicMaterial({ color: '#fef08a' }));
        taxiSign.position.set(0, 1.15, -0.15 * laneDir);
        cg.add(taxiSign);
      }
      // Headlights & Taillights
      var hlMat = new T.MeshBasicMaterial({ color: '#fef9c3' });
      var tlMat = new T.MeshBasicMaterial({ color: '#ef4444' });
      var hzOff = isBus ? 2.61 : 1.66;
      [-0.52, 0.52].forEach(function (wx) {
        var hl = new T.Mesh(new T.BoxGeometry(0.24, 0.14, 0.06), hlMat);
        hl.position.set(wx, 0.44, hzOff * laneDir);
        var tl = new T.Mesh(new T.BoxGeometry(0.28, 0.14, 0.06), tlMat);
        tl.position.set(wx, 0.44, -hzOff * laneDir);
        cg.add(hl, tl);
      });

      var startZ = -8 - ci * (STREET_LEN / 12);
      cg.position.set(laneX, 0, startZ);
      scene.add(cg);
      cars.push({ mesh: cg, dir: laneDir, spd: 5.5 + (ci % 3) * 1.4 });
    }

    // ---------------- 5. The street wall: buildings, shopfronts & vitrines ----------------
    var shopObjs = [], signPicks = [], itemPicks = [], dynamicProps = [];
    var signBoardMeshes = [], bladeBoardMeshes = [], vitrineSpotMats = [], glassReflMats = [];
    var nightOverlayMats = {}, interiorMats = [], nightGlowMats = [], bulbSets = [], swingers = [];
    var reflMat = new T.MeshBasicMaterial({ map: glassReflTex(), transparent: true, opacity: 0.5, depthWrite: false });
    glassReflMats.push(reflMat);
    var MAT = {};
    function MM(c, o) { var k = c + JSON.stringify(o || {}); return MAT[k] || (MAT[k] = XM(c, o)); }
    function box(g, w, h, d, x, y, z, m) { var b = new T.Mesh(new T.BoxGeometry(w, h, d), m); b.position.set(x, y, z); g.add(b); return b; }
    function plane(g, w, h, x, y, z, m) { var p = new T.Mesh(new T.PlaneGeometry(w, h), m); p.position.set(x, y, z); g.add(p); return p; }
    function uvPlane(w, h, ru, rv) {
      var geo = new T.PlaneGeometry(w, h), uv = geo.attributes.uv;
      for (var i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * ru, uv.getY(i) * rv);
      return geo;
    }
    var spillTex = canvasTex(128, 128, function (g, w, h) {
      var gr = g.createRadialGradient(w / 2, 0, 4, w / 2, 0, h); gr.addColorStop(0, 'rgba(255,214,150,.9)'); gr.addColorStop(1, 'rgba(255,190,110,0)');
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
    });
    var facMats = {}, intMats = {}, awnTexs = {};
    var spotMat = new T.MeshBasicMaterial({ color: '#fff4dc', transparent: true, opacity: 0.1, depthWrite: false, side: T.DoubleSide }); vitrineSpotMats.push(spotMat);
    var spillMat = new T.MeshBasicMaterial({ map: spillTex, transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending }); nightGlowMats.push(spillMat);
    function awnTex(a, b) { var k = a + b; return awnTexs[k] || (awnTexs[k] = makeAwningTex(a, b)); }

    // ---- one storefront on the ground floor of a building (local: front at z=0, x across the width)
    function storefront(g, W, gh, style, o, b) {
      var frameM = MM(o.frame, { roughness: 0.55 }), fasciaH = style === 'flagship' ? 0 : 0.95;
      var riser = { timber: 0.6, bay: 0.7, boutique: 0.15, cafe: 0.45, neon: 0.3, flagship: 0.05, cinema: 0.5, noren: 0.5, bank: 0.9 }[style] || 0.4;
      var topY = gh - fasciaH - 0.05, glassH = topY - riser;
      // bay layout across the width
      var bays, P = style === 'flagship' ? 0.25 : style === 'bank' ? 0.7 : 0.42, inner = W - 2 * P;
      if (style === 'flagship') bays = [['pier', P], ['win', inner], ['pier', P]];
      else if (style === 'cinema' || (style === 'bank' && W > 8)) { var dw = style === 'cinema' ? 2.6 : 1.9; bays = [['pier', P], ['win', (inner - dw) / 2], ['door', dw], ['win', (inner - dw) / 2], ['pier', P]]; }
      else if (W < 8) bays = [['pier', P], ['win', inner - 1.5], ['door', 1.5], ['pier', P]];
      else { var dd = style === 'noren' ? 1.8 : 1.6, a = (inner - dd) * (style === 'timber' ? 0.7 : 1); bays = style === 'timber' ? [['pier', P], ['win', a], ['door', dd], ['win', inner - dd - a], ['pier', P]] : [['pier', P], ['win', inner - dd], ['door', dd], ['pier', P]]; }

      // the shop room behind the glass
      var roomD = 1.55, intCol = o.interiorCol || '#efe7da';
      var intM = intMats[o.interiorTex.uuid] || (intMats[o.interiorTex.uuid] = new T.MeshBasicMaterial({ map: o.interiorTex, color: '#bdb7ad' })); if (interiorMats.indexOf(intM) < 0) interiorMats.push(intM);
      plane(g, W - 0.1, topY - riser + 0.4, 0, riser + (topY - riser + 0.4) / 2 - 0.2, -roomD, intM);
      var wallInM = MM(intCol, { roughness: 0.9 });
      [-1, 1].forEach(function (sx) { var sw = plane(g, roomD, gh, sx * (W / 2 - 0.05), gh / 2, -roomD / 2, wallInM); sw.rotation.y = -sx * Math.PI / 2; });
      var ceil = plane(g, W, roomD, 0, topY + 0.02, -roomD / 2, MM('#2a2622')); ceil.rotation.x = Math.PI / 2;
      var floorM = MM({ boutique: '#e9e4dc', flagship: '#d9c7a7', neon: '#14141c', cinema: '#5b1020', bank: '#3d2b1f' }[style] || '#6b4a32', { roughness: 0.6 });
      box(g, W - 0.1, 0.06, roomD, 0, riser + 0.03, -roomD / 2, floorM);
      box(g, W, gh, 9 - roomD - 0.05, 0, gh / 2, -roomD - (9 - roomD) / 2, MM(b.wall, { roughness: 0.85 }));    // rest of the ground floor

      var x = -W / 2, wins = [], picks = [];
      bays.forEach(function (bay) {
        var kind = bay[0], w = bay[1], cx = x + w / 2; x += w;
        if (kind === 'pier') {
          if (style === 'bank') { var col = new T.Mesh(new T.CylinderGeometry(0.22, 0.26, gh - 0.4, 14), frameM); col.position.set(cx, (gh - 0.4) / 2, 0.25); g.add(col); box(g, w, gh, 0.3, cx, gh / 2, 0.05, frameM); }
          else picks.push(box(g, w, gh, 0.36, cx, gh / 2, 0.12, frameM));
          return;
        }
        if (kind === 'door') {
          var dh = Math.min(2.75, topY - 0.15);
          box(g, w - 0.3, dh, 0.08, cx, dh / 2 + 0.02, -0.5, MM(style === 'boutique' || style === 'flagship' ? '#1d1d1f' : o.frame));
          plane(g, w - 0.7, dh * 0.62, cx, dh * 0.55, -0.45, reflMat);
          box(g, 0.05, 0.5, 0.06, cx + w * 0.28, 1.15, -0.42, MM('#d4af37', { metalness: 0.7, roughness: 0.3 }));
          if (topY - dh > 0.3) plane(g, w - 0.2, topY - dh - 0.1, cx, (topY + dh) / 2, -0.48, reflMat);   // transom
          [-1, 1].forEach(function (sx) { box(g, 0.08, topY, 0.6, cx + sx * (w / 2 - 0.04), topY / 2, -0.2, frameM); });
          box(g, w, 0.12, 0.7, cx, 0.06, -0.15, MM('#8a8580'));                                              // step
          if (style === 'noren') {                                                                             // split curtain
            var nM = MM('#1e2a4a', { side: T.DoubleSide });
            for (var nr = 0; nr < 3; nr++) plane(g, (w - 0.4) / 3 - 0.04, 0.95, cx - (w - 0.4) / 3 + nr * (w - 0.4) / 3, dh - 0.45, 0.02, nM);
          }
          return;
        }
        // display window
        box(g, w, riser, 0.32, cx, riser / 2, 0.1, style === 'bank' ? frameM : MM(K.shade(o.frame, -0.15)));
        if (style === 'bay') {                    // projecting three-sided bay window
          var bd = 0.85, bw = w - 0.6, side = Math.hypot(0.3, bd);
          box(g, bw + 0.6, riser, bd + 0.3, cx, riser / 2, bd / 2, frameM);
          var front = plane(g, bw, glassH, cx, riser + glassH / 2, bd + 0.02, reflMat);
          [-1, 1].forEach(function (sx) {
            var sp = plane(g, side, glassH, cx + sx * (bw / 2 + 0.15), riser + glassH / 2, bd / 2, reflMat); sp.rotation.y = sx * (Math.PI / 2 - Math.atan2(bd, 0.3));
            box(g, 0.08, glassH, 0.08, cx + sx * bw / 2, riser + glassH / 2, bd, frameM);
          });
          box(g, bw + 0.8, 0.22, bd + 0.4, cx, topY + 0.08, bd / 2, MM('#3f4652'));                            // lead roof
          for (var gb = 1; gb < 6; gb++) box(g, 0.035, glassH, 0.03, cx - bw / 2 + gb * bw / 6, riser + glassH / 2, bd + 0.03, frameM);
          box(g, bw, 0.035, 0.03, cx, riser + glassH * 0.68, bd + 0.03, frameM);
          wins.push({ cx: cx, w: bw, z: bd * 0.35, bay: true });
          return;
        }
        var gl = plane(g, w, glassH, cx, riser + glassH / 2, 0.08, reflMat); picks.push(gl);
        box(g, w, 0.08, 0.14, cx, topY, 0.1, frameM); box(g, w, 0.06, 0.16, cx, riser, 0.12, frameM);
        // glazing bars
        var bars = style === 'timber' ? Math.round(w / 0.8) : style === 'cafe' ? Math.round(w / 1.05) : style === 'bank' ? Math.round(w / 1.2) : w > 5 ? 2 : 1;
        for (var bi = 1; bi < bars; bi++) box(g, style === 'flagship' || style === 'boutique' ? 0.03 : 0.05, glassH, 0.06, cx - w / 2 + bi * w / bars, riser + glassH / 2, 0.1, frameM);
        if (style === 'timber' || style === 'bank') {
          box(g, w, 0.05, 0.06, cx, riser + glassH * 0.72, 0.1, frameM);
          for (var tb = 0; tb < bars; tb++) box(g, 0.03, glassH * 0.28, 0.05, cx - w / 2 + (tb + 0.5) * w / bars, riser + glassH * 0.86, 0.1, frameM);
        }
        if (style === 'neon') {                    // neon tube outline
          var nMat = new T.MeshBasicMaterial({ color: o.accent });
          box(g, w - 0.2, 0.04, 0.04, cx, topY - 0.12, 0.16, nMat); box(g, w - 0.2, 0.04, 0.04, cx, riser + 0.12, 0.16, nMat);
          [-1, 1].forEach(function (sx) { box(g, 0.04, glassH - 0.24, 0.04, cx + sx * (w / 2 - 0.1), riser + glassH / 2, 0.16, nMat); });
        }
        wins.push({ cx: cx, w: w, z: -0.6 });
      });

      // fascia + sign
      if (fasciaH) {
        picks.push(box(g, W, fasciaH, 0.4, 0, gh - fasciaH / 2, 0.16, frameM));
        var sc = o.sign, sw2 = W - (style === 'bank' ? 1.6 : 0.9);
        var dayT = makeSign(sc, false), nightT = sc.glow ? makeSign(sc, true) : dayT;
        var sM = new T.MeshBasicMaterial({ map: dayT, transparent: sc.style === 'glass', toneMapped: false });
        var sm = plane(g, sw2, fasciaH * 0.86, 0, gh - fasciaH / 2, 0.365, sM); picks.push(sm);
        signBoardMeshes.push({ mat: sM, dayTex: dayT, nightTex: nightT });
        if (style === 'timber' || style === 'bay') [-1, 1].forEach(function (sx) { box(g, 0.28, fasciaH + 0.3, 0.55, sx * (W / 2 - 0.2), gh - fasciaH / 2 - 0.1, 0.2, frameM); });   // console brackets
      }
      // a warm light spill on the pavement at night
      var spM = spillMat;
      var spill = plane(g, W * 0.9, 2.4, 0, 0.2, 1.3, spM); spill.rotation.x = -Math.PI / 2;
      return { wins: wins, picks: picks, riser: riser, topY: topY };
    }

    // ---- outside extras by style
    function extras(g, W, gh, style, o, sf) {
      var ironM = mLampPost;
      if (style === 'timber' || style === 'bay' || style === 'noren') {       // hanging bracket sign
        var arm = new T.Group(); arm.position.set(W / 2 - 0.35, gh + 0.25, 0.3); g.add(arm);
        box(arm, 0.05, 0.05, 1.4, 0, 0, 0.7, ironM);
        var hang = new T.Group(); hang.position.set(0, -0.05, 1.2); arm.add(hang);
        var hM = new T.MeshBasicMaterial({ map: makeHangSign(o.icon, o.frame, o.accent), transparent: true, side: T.DoubleSide });
        var hs = plane(hang, 0.95, 0.95, 0, -0.55, 0, hM); hs.rotation.y = Math.PI / 2;
        swingers.push({ obj: hang, ph: Math.random() * 6 });
      }
      if (style === 'noren') [-1, 1].forEach(function (sx) {
        var lan = new T.Mesh(new T.SphereGeometry(0.22, 12, 10), new T.MeshBasicMaterial({ color: '#ef4444' })); lan.scale.y = 1.3; lan.position.set(sx * 1.4 + W * 0.18, gh - 1.35, 0.45); g.add(lan);
      });
      if (style === 'boutique') {                                                // projecting flag
        var pole = box(g, 0.04, 0.04, 1.6, W / 2 - 0.5, gh + 0.9, 0.75, ironM); pole.rotation.x = -0.35;
        var fM = new T.MeshBasicMaterial({ map: makeHangSign(o.icon, o.frame, o.accent), side: T.DoubleSide });
        var fl = plane(g, 0.8, 1.1, W / 2 - 0.5, gh + 0.25, 1.35, fM); fl.rotation.y = Math.PI / 2;
        swingers.push({ obj: fl, ph: Math.random() * 6, flag: true });
        box(g, W - 0.8, 0.05, 0.9, 0, gh - 0.95, 0.5, MM('#141414')).rotation.x = 0.28;                       // slim awning
      }
      if (style === 'cafe') {                                                     // striped awning + terrace
        var aw = new T.Mesh(new T.BoxGeometry(W - 0.6, 0.05, 1.9), new T.MeshStandardMaterial({ map: awnTex(o.frame, '#f8f5ec'), roughness: 0.8 }));
        aw.position.set(0, gh - 1.25, 0.95); aw.rotation.x = 0.36; g.add(aw);
        plane(g, W - 0.6, 0.28, 0, gh - 1.72, 1.82, new T.MeshStandardMaterial({ map: awnTex(o.frame, '#f8f5ec'), side: T.DoubleSide }));
        if (o.kind === 'florist') for (var fb = 0; fb < 7; fb++) {
          var bucket = new T.Mesh(new T.CylinderGeometry(0.18, 0.14, 0.4, 10), MM('#9ca3af')); bucket.position.set(-W / 2 + 1 + fb * 0.62, 0.38, 1.15); g.add(bucket);
          var bunch = new T.Mesh(new T.IcosahedronGeometry(0.24, 0), MM(GOODS.florist[fb % 5])); bunch.position.set(bucket.position.x, 0.75, 1.15); g.add(bunch);
        } else if (o.kind === 'deli') {
          var stand = box(g, 2.6, 0.08, 0.9, -W / 4, 0.85, 1.2, MM('#6b4a32')); stand.rotation.x = 0.3;
          for (var fr = 0; fr < 18; fr++) { var fruit = new T.Mesh(new T.SphereGeometry(0.09, 8, 6), MM(GOODS.deli[fr % 5])); fruit.position.set(-W / 4 - 1.15 + (fr % 9) * 0.29, 0.98 - Math.floor(fr / 9) * 0.1, 1.05 + Math.floor(fr / 9) * 0.3); g.add(fruit); }
        } else [-1, 1].forEach(function (sx, ti) {
          var tx = sx * W / 4, tbl = new T.Group(); tbl.position.set(tx, 0, 1.55); g.add(tbl);
          box(tbl, 0.06, 0.72, 0.06, 0, 0.36, 0, ironM); var top = new T.Mesh(new T.CylinderGeometry(0.36, 0.36, 0.04, 16), MM('#f1efe9')); top.position.y = 0.74; tbl.add(top);
          [-1, 1].forEach(function (cs) { var ch = box(tbl, 0.38, 0.05, 0.38, cs * 0.6, 0.46, 0, MM('#7c2d12')); box(tbl, 0.38, 0.45, 0.04, cs * 0.6, 0.7, cs * 0.0 - 0.18, MM('#7c2d12')); });
          if (ti === 0) { var ab = box(g, 0.6, 0.9, 0.05, tx + 1.3, 0.48, 1.9, MM('#1c2421')); ab.rotation.x = 0.15; }
        });
      }
      if (style === 'cinema') {                                                   // marquee with chaser bulbs
        var mq = box(g, W * 0.92, 1.0, 1.9, 0, gh - 0.55, 0.95, MM('#2a0e14'));
        var mSign = makeSign({ title: o.title, sub: 'NOW SHOWING', bg: '#fff8e1', fg: '#111111', font: 'geo' }, false);
        plane(g, W * 0.86, 0.8, 0, gh - 0.55, 1.91, new T.MeshBasicMaterial({ map: mSign, toneMapped: false }));
        var N = 64, bulbs = new T.InstancedMesh(new T.SphereGeometry(0.045, 6, 4), new T.MeshBasicMaterial(), N), m4 = new T.Matrix4(), c = new T.Color('#fde68a');
        for (var bI = 0; bI < N; bI++) { var row = bI < N / 2 ? 0 : 1, k = bI % (N / 2); m4.makeTranslation(-W * 0.45 + k * (W * 0.9) / (N / 2 - 1), gh - 0.08 - row * 0.94, 1.92); bulbs.setMatrixAt(bI, m4); bulbs.setColorAt(bI, c); }
        g.add(bulbs); bulbSets.push({ im: bulbs, n: N, t: 0 });
      }
      if (style === 'neon' || style === 'cinema') {                               // tall blade sign
        var bdT = makeBladeSignTex(o.sh, false), bnT = makeBladeSignTex(o.sh, true);
        var bM = new T.MeshBasicMaterial({ map: st.night ? bnT : bdT, toneMapped: false, side: T.DoubleSide });
        bladeBoardMeshes.push({ mat: bM, dayTex: bdT, nightTex: bnT });
        var blade = plane(g, 1.0, 3.0, W / 2 - 0.6, gh + 2.0, 0.9, bM); blade.rotation.y = Math.PI / 2;
        box(g, 0.08, 3.1, 1.15, W / 2 - 0.6, gh + 2.0, 0.9, new T.MeshBasicMaterial({ color: o.accent })).scale.set(1, 1, 1);
        blade.position.x += 0.05;
      }
      if (style === 'flagship') {                                                 // backlit logo + light strips inside
        var lg = makeSign({ title: o.title, sub: o.sub, bg: '#f5f5f4', fg: '#111111', font: 'geo' }, false);
        plane(g, W * 0.6, 1.0, 0, gh - 1.0, -0.35, new T.MeshBasicMaterial({ map: lg, toneMapped: false }));
        for (var ls = 0; ls < 4; ls++) box(g, W * 0.8, 0.04, 0.08, 0, gh - 0.12, -0.3 - ls * 0.35, new T.MeshBasicMaterial({ color: '#fffaf0' }));
      }
      if (o.kind === 'pharmacy') {                                                 // green cross lightbox
        var cg = new T.Group(); cg.position.set(W / 2 - 0.5, gh + 0.6, 0.9); g.add(cg);
        var gm = new T.MeshBasicMaterial({ color: '#22c55e' });
        box(cg, 0.12, 0.8, 0.26, 0, 0, 0, gm); box(cg, 0.12, 0.26, 0.8, 0, 0, 0, gm);
        dynamicProps.push({ mesh: cg, rotY: 0.8 });
      }
      if (o.kind === 'book') {                                                     // bargain book trolley
        var cart = box(g, 1.7, 0.75, 0.7, -W / 4, 0.38, 1.25, MM('#5b3a24'));
        for (var bk = 0; bk < 12; bk++) box(g, 0.11, 0.3, 0.22, -W / 4 - 0.75 + bk * 0.135, 0.9, 1.25, MM(K.PAL[bk % K.PAL.length]));
      }
    }

    // ---- display stands + the shop's cards
    function stock(g, sh, k, sf, style, o) {
      var main = sf.wins.slice().sort(function (a, b) { return b.w - a.w; })[0];
      var n = sh.items.length, wc = [], baseY = sf.riser + 0.06;
      var standH = { timber: [0.25, 0.55, 0.35], bay: [0.3, 0.55, 0.3], boutique: [0.55, 1.0, 0.72], cinema: [0.6, 0.6, 0.6], cafe: [0.55, 0.55, 0.55], neon: [0.45, 0.65, 0.45], flagship: [0.85, 0.85, 0.85] }[style] || [0.4, 0.6, 0.4];
      var clothM = MM(K.shade(sh.type.trim || '#7f1d1d', -0.1), { roughness: 0.95 });
      if (style === 'cafe') box(g, main.w * 0.9, 0.06, 0.5, main.cx, baseY + 0.52, main.z, MM('#8b5a2b'));
      if (style === 'flagship') { box(g, main.w * 0.86, 0.08, 1.0, main.cx, baseY + 0.8, main.z - 0.1, MM('#c8a77a')); [-1, 1].forEach(function (s) { box(g, 0.08, 0.8, 0.8, main.cx + s * main.w * 0.38, baseY + 0.4, main.z - 0.1, MM('#c8a77a')); }); }
      sh.items.forEach(function (it, j) {
        var px = main.cx - main.w / 2 + (j + 0.5) * main.w / n + (style === 'boutique' ? (j - 1) * 0.25 : 0), h = standH[j % 3];
        if (style === 'timber' || style === 'bay') box(g, main.w / n * 0.78, h, 0.75, px, baseY + h / 2, main.z, clothM);
        else if (style === 'boutique') { var ped = new T.Mesh(new T.CylinderGeometry(0.3, 0.3, h, 20), MM('#f4f2ee', { roughness: 0.4 })); ped.position.set(px, baseY + h / 2, main.z); g.add(ped); }
        else if (style === 'neon') box(g, 0.62, h, 0.62, px, baseY + h / 2, main.z, new T.MeshBasicMaterial({ color: o.accent, transparent: true, opacity: 0.55 }));
        else if (style === 'cinema') box(g, 0.05, h, 0.05, px, baseY + h / 2, main.z, mLampPost);
        var cKind = sh.type.carrier || 'book', car = X.carriers[cKind] ? X.carriers[cKind](it) : X.carriers.book(it);
        car.position.set(px, baseY + h, main.z);
        if (cKind === 'book') { car.rotation.y = -Math.PI / 2; car.scale.setScalar(1.5); }
        else if (cKind === 'frame') { car.scale.setScalar(0.85); car.position.y += 0.5; }
        else car.scale.setScalar(1.45);
        car.traverse(function (m) { if (m.isMesh) { m.userData.shop = k; m.userData.winIdx = j; } });
        g.add(car); itemPicks.push(car);
        wc.push({ it: it, obj: car, localX: px });
        var sp = spotMat;
        var cone = new T.Mesh(new T.ConeGeometry(0.55, sf.topY - baseY - h, 14, 1, true), sp); cone.position.set(px, (sf.topY + baseY + h) / 2, main.z); g.add(cone);
      });
      var cxAvg = wc.reduce(function (s, w) { return s + w.localX; }, 0) / Math.max(1, wc.length);
      return { wc: wc, cx: cxAvg };
    }

    // ---- one whole building
    PLAN.blds.forEach(function (b) {
      var g = new T.Group();
      g.position.set(b.side * FRONT_X, 0, b.zc);
      g.rotation.y = b.side < 0 ? Math.PI / 2 : -Math.PI / 2;
      scene.add(g);
      var A = ARCHS[b.arch], W = b.w, D = 9, sh = b.shop, f = b.filler;
      var style = sh ? (FRONT_FOR[sh.type.kind] || 'boutique') : f.front;
      var gh = style === 'flagship' ? 7.6 : GH, H = gh + b.floors * A.floor;
      var wallM = MM(b.wall, { roughness: 0.85 }), trimM = MM(A.trim, { roughness: 0.7 });
      var body = box(g, W, H - gh, D, 0, gh + (H - gh) / 2, -D / 2 - 0.02, wallM);
      // facade
      var cols = Math.max(1, Math.round(W / A.bay)), fk = b.arch + '|' + b.wall;
      if (!facMats[fk]) facMats[fk] = new T.MeshStandardMaterial({ map: facadeDay(b.arch, b.wall), roughness: 0.82 });
      if (!nightOverlayMats[b.arch]) nightOverlayMats[b.arch] = new T.MeshBasicMaterial({ map: facadeNight(b.arch), transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending });
      var fh = H - gh - 0.25;
      var fp = new T.Mesh(uvPlane(W - 0.06, fh, cols / 2, b.floors / 2), facMats[fk]); fp.position.set(0, gh + 0.25 + fh / 2, 0.01); g.add(fp);
      var off = (b.seed % 4) / 4;
      var ngeo = uvPlane(W - 0.06, fh, cols / 4, b.floors / 4), nuv = ngeo.attributes.uv;
      for (var u = 0; u < nuv.count; u++) nuv.setX(u, nuv.getX(u) + off);
      var np = new T.Mesh(ngeo, nightOverlayMats[b.arch]); np.position.set(0, gh + 0.25 + fh / 2, 0.02); g.add(np);
      box(g, W + 0.06, 0.3, 0.32, 0, gh + 0.12, 0.08, trimM);                                     // belt course
      // roofline
      if (!A.flat) box(g, W + 0.3, 0.5, 0.7, 0, H + 0.2, 0.0, trimM);
      if (A.mansard) {
        var man = new T.Mesh(new T.CylinderGeometry(0.66, 1, 2.6, 4, 1), MM('#56606b', { roughness: 0.7 }));
        man.rotation.y = Math.PI / 4; man.scale.set(W / Math.SQRT2, 1, D / Math.SQRT2); man.position.set(0, H + 1.75, -D / 2); g.add(man);
        for (var dm = 0; dm < cols; dm++) { var dx = -W / 2 + (dm + 0.5) * W / cols; box(g, 0.8, 1.0, 0.7, dx, H + 1.4, -0.75, trimM); plane(g, 0.5, 0.65, dx, H + 1.35, -0.39, MM('#2a3440')); }
      }
      if (A.setback) { box(g, W * 0.72, 3, D * 0.7, 0, H + 1.5, -D / 2, wallM); box(g, W * 0.44, 2.4, D * 0.45, 0, H + 4.2, -D / 2, trimM); }
      if (A.flat) { box(g, W, 0.35, 0.3, 0, H + 0.17, 0.0, trimM); box(g, 1.6, 1.0, 1.4, W * 0.2, H + 0.5, -D * 0.6, MM('#9ca3af')); box(g, 1.1, 0.8, 1.0, -W * 0.25, H + 0.4, -D * 0.4, MM('#9ca3af')); }
      if (A.waterTower) {
        var wt = new T.Group(); wt.position.set(W * 0.22, H, -D / 2); g.add(wt);
        [[-0.7, -0.7], [0.7, -0.7], [-0.7, 0.7], [0.7, 0.7]].forEach(function (l) { box(wt, 0.1, 1.6, 0.1, l[0], 0.8, l[1], mLampPost); });
        var tank = new T.Mesh(new T.CylinderGeometry(1.1, 1.1, 2.3, 16), MM('#7c5a3c', { roughness: 0.95 })); tank.position.y = 2.75; wt.add(tank);
        var cap = new T.Mesh(new T.ConeGeometry(1.2, 0.9, 16), MM('#3f3f46')); cap.position.y = 4.35; wt.add(cap);
      }
      if (A.fireEscape && b.floors >= 2) {
        var feM = mLampPost, fw = Math.min(3.4, W - 1.2);
        for (var fl = 0; fl < b.floors; fl++) {
          var py = gh + 0.5 + fl * A.floor + A.floor * 0.08;
          box(g, fw, 0.05, 1.0, 0, py, 0.55, feM);
          box(g, fw, 0.03, 0.03, 0, py + 0.9, 1.04, feM); box(g, fw, 0.03, 0.03, 0, py + 0.45, 1.04, feM);
          for (var pp = 0; pp <= 4; pp++) box(g, 0.03, 0.9, 0.03, -fw / 2 + pp * fw / 4, py + 0.45, 1.04, feM);
          if (fl < b.floors - 1) { var L = Math.hypot(fw * 0.7, A.floor), st2 = box(g, L, 0.04, 0.5, 0, py + A.floor / 2, 0.55, feM); st2.rotation.z = Math.atan2(A.floor, fw * 0.7) * (fl % 2 ? 1 : -1); }
        }
      }
      if (b.arch === 'haussmann') [1, Math.min(4, b.floors - 1)].forEach(function (fl2) {   // continuous iron balconies
        var by = gh + 0.25 + fl2 * A.floor;
        box(g, W - 0.3, 0.08, 0.6, 0, by, 0.3, trimM);
        box(g, W - 0.3, 0.04, 0.04, 0, by + 0.95, 0.6, mLampPost);
        for (var bpost = 0; bpost <= Math.round(W / 0.35); bpost++) box(g, 0.02, 0.95, 0.02, -W / 2 + 0.15 + bpost * 0.35, by + 0.5, 0.6, mLampPost);
      });

      // ground floor
      var o;
      if (sh) {
        var tt = sh.type;
        o = { title: sh.title, sub: tt.tag, frame: tt.trim, accent: tt.neon, icon: tt.icon, kind: tt.kind, sh: sh, interiorTex: makeVitrineBackdropTex(sh, false), interiorCol: tt.interior };
        o.sign = {
          timber: { style: 'painted', bg: tt.trim, gilt: true, font: 'serif' }, bay: { style: 'painted', bg: tt.trim, gilt: true, font: 'serif' },
          boutique: { bg: '#121212', fg: tt.gold, font: 'didone' }, cafe: { style: 'painted', bg: tt.trim, fg: '#fdf6e3', font: 'script' },
          neon: { bg: '#0b0b10', fg: tt.neon, glow: tt.neon, font: 'sans' }, cinema: { bg: '#2a0e14', fg: '#fde68a', glow: '#fde68a', font: 'geo' },
          flagship: { bg: '#111', fg: '#fff', font: 'geo' }
        }[style] || { bg: tt.trim, fg: '#fff', font: 'sans' };
      } else {
        o = { title: f.name, sub: f.tag, frame: f.frame, accent: f.accent, icon: { florist: '💐', pharmacy: '✚', bakery: '🥐', shoes: '👞', ramen: '🍜', bank: '🏦', optic: '👓', deli: '🥪', watch: '⌚', tea: '🍵', hats: '🎩', paper: '✒️', post: '📮', gelato: '🍨', tailor: '🧵', camera: '📷', wine: '🍷', news: '🗞' }[f.kind] || '🏪', kind: f.kind, interiorTex: interiorTex(f.kind) };
        o.sign = f.front === 'bank' ? { bg: '#d6cfc2', fg: '#3a3226', font: 'serif' }
          : f.front === 'noren' ? { bg: '#3b1d14', fg: '#fde68a', font: 'sans' }
          : f.kind === 'pharmacy' ? { bg: '#ffffff', fg: '#15803d', font: 'sans' }
          : f.front === 'timber' ? { style: 'painted', bg: f.frame, gilt: true, font: f.font }
          : { bg: f.frame, fg: f.accent, font: f.font };
      }
      o.sign.title = o.title; o.sign.sub = o.sub;
      var sf = storefront(g, W, gh, style, o, b);
      extras(g, W, gh, style, o, sf);
      if (sh) {
        var k = sh.k, s2 = stock(g, sh, k, sf, style, o);
        sh.z = b.zc + (b.side < 0 ? -s2.cx : s2.cx);
        sh.style = style;
        body.userData.shop = k;
        sf.picks.concat([body]).forEach(function (m) { m.userData.shop = k; signPicks.push(m); });
        shopObjs[k] = { sh: sh, group: g, vitrineGroup: g, winCarriers: s2.wc };
      }
    });

    // ---- pedestrians on both pavements (48 citizens strolling the 2× expanded avenue)
    var people = [], skin = ['#f1c27d', '#e0ac69', '#c68642', '#8d5524', '#ffdbac'], coats = ['#1f2937', '#7f1d1d', '#1e3a8a', '#d6d3d1', '#065f46', '#92400e', '#4c1d95', '#111827', '#b45309', '#475569'];
    var pr = K.rng(77);
    for (var pi2 = 0; pi2 < 16; pi2++) {   // enough life on the pavement; each walker costs ~5 draws
      var pg = new T.Group(), sd2 = pi2 % 2 ? 1 : -1, dir = pr() < 0.5 ? -1 : 1;
      var bodyM = MM(coats[pi2 % coats.length]), legM = MM('#1f2023');
      var torso = new T.Mesh(new T.CylinderGeometry(0.19, 0.23, 0.78, 8), bodyM); torso.position.y = 1.2; pg.add(torso);
      var head = new T.Mesh(new T.SphereGeometry(0.13, 10, 8), MM(skin[pi2 % skin.length])); head.position.y = 1.74; pg.add(head);
      var legs = [];
      [-0.09, 0.09].forEach(function (lx) { var lg2 = new T.Group(); lg2.position.set(lx, 0.82, 0); var leg = box(lg2, 0.11, 0.8, 0.13, 0, -0.4, 0, legM); pg.add(lg2); legs.push(lg2); });
      if (pr() < 0.35) { var bag = box(pg, 0.08, 0.32, 0.26, 0.26, 1.0, 0, MM(['#d4af37', '#ef4444', '#f8fafc'][pi2 % 3])); }
      var hh = 0.92 + pr() * 0.16; pg.scale.setScalar(hh);
      pg.position.set(sd2 * (5.5 + pr() * 3.2), 0.18, START_Z - pr() * (START_Z - ZEND + 20));
      pg.rotation.y = dir > 0 ? 0 : Math.PI;
      scene.add(pg);
      people.push({ g: pg, legs: legs, dir: dir, spd: 1.0 + pr() * 0.6, ph: pr() * 6 });
    }

    S.tick(function (dt, now) {
      var t = now / 1000;
      people.forEach(function (p) {
        p.g.position.z += p.dir * p.spd * dt;
        if (p.g.position.z < ZEND - 20) p.g.position.z = START_Z;
        if (p.g.position.z > START_Z) p.g.position.z = ZEND - 20;
        var sw = Math.sin(t * p.spd * 5.5 + p.ph) * 0.45;
        p.legs[0].rotation.x = sw; p.legs[1].rotation.x = -sw;
      });
      swingers.forEach(function (s) { if (s.flag) s.obj.rotation.x = Math.sin(t * 2.2 + s.ph) * 0.12; else s.obj.rotation.x = Math.sin(t * 1.3 + s.ph) * 0.06; });
      bulbSets.forEach(function (bs) {
        bs.t += dt; if (bs.t < 0.12) return; bs.t = 0; bs.step = ((bs.step || 0) + 1) % 3;
        var c = new T.Color();
        for (var i = 0; i < bs.n; i++) bs.im.setColorAt(i, c.set(i % 3 === bs.step ? '#fff3c4' : '#a16207'));
        bs.im.instanceColor.needsUpdate = true;
      });
    });

    // ---------------- Apply District Atmosphere & Day/Night Blend ----------------
    function styleObj() {
      return STYLES.filter(function (s) { return s.id === st.style; })[0] || STYLES[0];
    }

    function applyVisuals(forceTex) {
      var ST = styleObj();
      var m = st.nightMix;

      var d0 = new T.Color(ST.daySky[0]).lerp(new T.Color(ST.nightSky[0]), m);
      var d1 = new T.Color(ST.daySky[1]).lerp(new T.Color(ST.nightSky[1]), m);
      var d2 = new T.Color(ST.daySky[2]).lerp(new T.Color(ST.nightSky[2]), m);
      var pa = skyGeo.attributes.position, cols = [];
      for (var i = 0; i < pa.count; i++) {
        var y = pa.getY(i) / 420, c = new T.Color();
        if (y < 0) c.copy(d2);
        else if (y < 0.28) c.copy(d2).lerp(d1, y / 0.28);
        else c.copy(d1).lerp(d0, Math.min(1, (y - 0.28) / 0.52));
        cols.push(c.r, c.g, c.b);
      }
      skyGeo.setAttribute('color', new T.Float32BufferAttribute(cols, 3));

      var fogCol = new T.Color(ST.dayFog).lerp(new T.Color(ST.nightFog), m);
      scene.fog.color.copy(fogCol);
      scene.background = fogCol;

      hemi.color.set('#ffffff').lerp(new T.Color('#8ab4f8'), m);
      hemi.groundColor.set('#6b5a48').lerp(new T.Color('#18142c'), m);
      hemi.intensity = lerp(0.92, 0.48, m);
      sun.color.set('#fff5dc').lerp(new T.Color('#8ab4f8'), m);
      sun.intensity = lerp(1.12, 0.34, m);
      streetGlow.intensity = lerp(0.15, 1.45, m);

      mRoad.color.set(ST.road).lerp(new T.Color('#111622'), m * 0.55);
      mRoad.roughness = lerp(0.82, 0.28, m);
      mRoad.metalness = lerp(0.08, 0.42, m);
      mWalk.color.set(ST.walk).lerp(new T.Color('#273042'), m * 0.48);

      mBulb.color.set('#f8fafc').lerp(new T.Color('#fde047'), m);
      mCone.opacity = m * 0.18;

      var skyCol = new T.Color(ST.skylineDay).lerp(new T.Color(ST.skylineNight), m);
      skylineMats.forEach(function (sm) { sm.color.copy(skyCol); });
      skyWinMats.forEach(function (sw) { sw.opacity = lerp(0.18, 0.78, m); });
      vitrineSpotMats.forEach(function (vs) { vs.opacity = lerp(0.06, 0.2, m); });
      Object.keys(nightOverlayMats).forEach(function (kk) { nightOverlayMats[kk].opacity = m * 0.95; });
      var ic = new T.Color('#bdb7ad').lerp(new T.Color('#fff4e0'), m);
      interiorMats.forEach(function (im) { im.color.copy(ic); });
      nightGlowMats.forEach(function (gm) { gm.opacity = m * 0.5; });
      reflMat.opacity = lerp(0.5, 0.1, m);

      if (forceTex) {
        var useNight = st.night > 0.5;
        signBoardMeshes.forEach(function (sb) {
          sb.mat.map = useNight ? sb.nightTex : sb.dayTex;
          sb.mat.needsUpdate = true;
        });
        bladeBoardMeshes.forEach(function (bb) {
          bb.mat.map = useNight ? bb.nightTex : bb.dayTex;
          bb.mat.needsUpdate = true;
        });
      }
    }

    // ---------------- Camera & Navigation State ----------------
    var cur = { x: 0, y: 1.75, z: saved.z != null ? clamp(saved.z, ZEND + 2, 2) : -1.5, yaw: 0, pitch: 0.02 };
    var tgt = { x: cur.x, y: cur.y, z: cur.z, yaw: 0, pitch: 0.02 };

    function nearestShopIdx() {
      var best = 0, bd = 1e9;
      shops.forEach(function (sh, i) {
        var d = Math.abs(cur.z - sh.z);
        if (d < bd) { bd = d; best = i; }
      });
      return best;
    }

    // Focus directly in front of the recessed 3D Vitrine window of shop `k`
    function focusShop(k, afterArrive) {
      var sh = shops[k];
      if (!sh) return;
      RD.back(true);
      st.run = false;
      st.shop = k;
      st.itemIdx = -1;
      // Offset along z so camera centers nicely on the storefront & vitrineGroup
      tgt.x = sh.side * 2.4;          // across the pavement: whole shopfront + sign in view
      tgt.y = 1.9;
      tgt.z = sh.z;
      tgt.yaw = sh.side < 0 ? Math.PI / 2 : -Math.PI / 2;
      tgt.pitch = 0.1;
      st.onArrive = afterArrive || null;
      S.hap();
      ui();
      persist();
    }

    function stepOutToStreet() {
      RD.back(true);
      st.shop = -1;
      st.itemIdx = -1;
      tgt.x = 0;
      tgt.y = 1.75;
      tgt.yaw = 0;
      tgt.pitch = 0.02;
      S.hap();
      ui();
      persist();
    }

    function pullItem(shopIdx, winIdx) {
      var so = shopObjs[shopIdx];
      if (!so) return;
      var wc = so.winCarriers[winIdx || 0] || so.winCarriers[0];
      if (!wc) return;
      function doPull() {
        st.itemIdx = winIdx || 0;
        var slideDir = new T.Vector3(0, 0, 1);
        RD.pull(wc.obj, wc.it, {
          slide: slideDir,
          dist: 1.85,
          onBack: function () {
            st.itemIdx = -1;
            ui();
          }
        });
        ui();
      }
      if (st.shop !== shopIdx) {
        focusShop(shopIdx, doPull);
      } else {
        doPull();
      }
    }

    function toggleNight(forceVal) {
      st.night = forceVal != null ? (forceVal ? 1 : 0) : (st.night ? 0 : 1);
      S.root.classList.toggle('night', !!st.night);
      applyVisuals(true);
      ui();
      S.toast(st.night ? '🌙 Night Metropolis · Illuminated Vitrines & Neon Blade Signs' : '☀️ Day Metropolis · Stroll Flagship Storefronts');
      persist();
    }

    function cycleStyle() {
      var i = STYLES.findIndex(function (s) { return s.id === st.style; });
      st.style = STYLES[(i + 1) % STYLES.length].id;
      applyVisuals(false);
      ui();
      S.toast('✨ ' + styleObj().name);
      persist();
    }

    function openShopsSheet() {
      var shEl = S.$('.kx-sheet');
      if (!shEl.hidden) { shEl.hidden = true; return; }
      var curK = st.shop >= 0 ? st.shop : nearestShopIdx();
      S.$('.kx-list').innerHTML = shops.map(function (sh, i) {
        return '<button type="button" data-kx="goshop" data-k="' + i + '" class="' + (i === curK ? 'on' : '') + '">' +
          '<i style="--c:' + esc(sh.color) + '">' + sh.type.icon + '</i>' +
          '<span><b>' + esc(sh.title) + '</b><small>' + esc(sh.type.tag) + ' · ' + sh.items.length + ' vitrine displays</small></span>' +
        '</button>';
      }).join('');
      shEl.hidden = false;
    }

    function ui() {
      var k = st.shop >= 0 ? st.shop : nearestShopIdx();
      var sh = shops[k] || shops[0];
      var ST = styleObj();
      S.$('.kx-pill i').style.background = st.night ? sh.type.neon : sh.color;
      S.$('.kx-pill b').textContent = RD.open && RD.item() ? RD.item().I.title : (st.shop >= 0 ? sh.type.icon + ' ' + sh.title : 'Metropolis Avenue · ' + (st.night ? 'Night' : 'Day'));
      S.$('.kx-pill small').textContent = (st.shop >= 0 ? sh.type.tag + ' · ' : 'Flagship ' + (k + 1) + '/' + shops.length + ' · ') + ST.name.replace(/^\S+\s/, '');

      var tb = S.$('.kc-b-time');
      tb.className = 'kx-b kc-b-time ' + (st.night ? 'night' : 'day');
      tb.innerHTML = st.night ? '🌙 <span>Night</span>' : '☀️ <span>Day</span>';

      S.$('.kc-run').innerHTML = st.run ? '⏸ <span>Pause Stroll</span>' : '🚶 <span>Auto Stroll</span>';
      S.$('.kc-run').classList.toggle('on', st.run);
      S.$('.kc-out').hidden = st.shop < 0 && !RD.open;
      S.$('.kc-sg').innerHTML = ST.icon + ' <span>' + esc(ST.name.replace(/^\S+\s/, '')) + '</span>';

      var banner = S.$('.kc-shop-card');
      if (st.shop >= 0 && !RD.open) {
        banner.hidden = false;
        banner.querySelector('.kc-shop-ic').textContent = sh.type.icon;
        banner.querySelector('.kc-shop-info b').textContent = sh.title;
        banner.querySelector('.kc-shop-info small').textContent = sh.type.tag + ' · Tap any vitrine display item to inspect';
        banner.querySelector('.kc-shop-items').innerHTML = sh.items.map(function (it, j) {
          return '<button type="button" data-kx="pullitem" data-k="' + k + '" data-j="' + j + '">🔍 ' + esc(it.I.title.slice(0, 18)) + '</button>';
        }).join('');
      } else {
        banner.hidden = true;
      }
    }

    function persist() {
      DB.set(DATA.key, { z: +cur.z.toFixed(2), night: st.night, style: st.style, run: st.run });
    }

    // ---------------- Input Handling ----------------
    S.onDrag = function (dx, dy) {
      if (RD.open) return;
      st.run = false;
      if (st.shop >= 0) {
        tgt.yaw = clamp(tgt.yaw - dx * 0.004, (shops[st.shop].side < 0 ? Math.PI / 2 : -Math.PI / 2) - 0.65, (shops[st.shop].side < 0 ? Math.PI / 2 : -Math.PI / 2) + 0.65);
        tgt.pitch = clamp(tgt.pitch - dy * 0.003, -0.35, 0.45);
      } else {
        tgt.yaw = clamp(tgt.yaw - dx * 0.004, -1.2, 1.2);
        tgt.z = clamp(tgt.z + dy * 0.055, ZEND + 2, 2);
      }
      ui();
    };
    S.onWheel = function (dy) {
      if (RD.open) return;
      if (st.shop >= 0) stepOutToStreet();
      st.run = false;
      tgt.z = clamp(tgt.z + dy * 0.025, ZEND + 2, 2);
      ui();
    };
    S.onTap = function (e) {
      if (RD.open) {
        var rh = S.pick(e.clientX, e.clientY, RD.meshes);
        if (RD.hit(rh)) RD.flip();
        else RD.back();
        return;
      }
      var hitItem = S.pick(e.clientX, e.clientY, itemPicks);
      if (hitItem && hitItem.object.userData.shop != null && hitItem.object.userData.winIdx != null) {
        pullItem(hitItem.object.userData.shop, hitItem.object.userData.winIdx);
        return;
      }
      var hitShop = S.pick(e.clientX, e.clientY, signPicks);
      if (hitShop && hitShop.object.userData.shop != null) {
        focusShop(hitShop.object.userData.shop);
        return;
      }
      if (st.shop >= 0) stepOutToStreet();
    };
    S.onHover = function (e) {
      S.cvs.style.cursor = S.pick(e.clientX, e.clientY, RD.open ? RD.meshes : itemPicks.concat(signPicks)) ? 'pointer' : '';
    };
    S.onAct = function (k, el) {
      if (k === 'exit') return self.close();
      if (k === 'time') return toggleNight();
      if (k === 'suggest') return cycleStyle();
      if (k === 'shops') return openShopsSheet();
      if (k === 'goshop') { S.$('.kx-sheet').hidden = true; return focusShop(+el.dataset.k); }
      if (k === 'pullitem') return pullItem(+el.dataset.k, +el.dataset.j);
      if (k === 'out') return stepOutToStreet();
      if (k === 'run') {
        if (RD.open) RD.back(true);
        if (st.shop >= 0) stepOutToStreet();
        st.run = !st.run;
        if (st.run && tgt.z <= ZEND + 3) tgt.z = -1.5;
        ui();
        persist();
      } else if (k === 'prev' || k === 'next') {
        var curK = st.shop >= 0 ? st.shop : nearestShopIdx();
        var nextK = clamp(curK + (k === 'next' ? 1 : -1), 0, shops.length - 1);
        focusShop(nextK);
      }
    };
    S.onKey = function (e) {
      var k = e.key;
      if (k === 'Escape') {
        e.preventDefault();
        if (!S.$('.kx-sheet').hidden) { S.$('.kx-sheet').hidden = true; return; }
        if (RD.open) return RD.back();
        if (st.shop >= 0) return stepOutToStreet();
        return self.close();
      }
      if (k === ' ') { e.preventDefault(); if (RD.open) RD.flip(); else S.onAct('run'); }
      if (k === 'n' || k === 'N') toggleNight();
      if (k === 's' || k === 'S') cycleStyle();
      if (k === 'ArrowRight' || k === 'ArrowUp') S.onAct('next');
      if (k === 'ArrowLeft' || k === 'ArrowDown') S.onAct('prev');
    };

    // ---------------- Render Loop ----------------
    var lookV = new T.Vector3(), hudT = 0, saveT = 0;
    S.tick(function (dt, now) {
      if (Math.abs(st.nightMix - st.night) > 0.002) {
        st.nightMix = lerp(st.nightMix, st.night, 1 - Math.exp(-dt * 3.2));
        applyVisuals(false);
      }

      // Animate moving city cabs, buses & coupes along the main & cross boulevards
      cars.forEach(function (c) {
        c.mesh.position.z += c.dir * c.spd * dt;
        if (c.dir < 0 && c.mesh.position.z < ZEND - 18) c.mesh.position.z = 12;
        if (c.dir > 0 && c.mesh.position.z > 12) c.mesh.position.z = ZEND - 18;
      });
      crossCars.forEach(function (cc) {
        cc.mesh.position.x += cc.dir * cc.spd * dt;
        if (cc.dir < 0 && cc.mesh.position.x < -75) cc.mesh.position.x = 75;
        if (cc.dir > 0 && cc.mesh.position.x > 75) cc.mesh.position.x = -75;
      });

      // Animate rotating storefront sculptures (Vinyl disc, Gallery sculpture, Quantum Atom)
      dynamicProps.forEach(function (dp) {
        if (dp.rotY) dp.mesh.rotation.y += dp.rotY * dt;
        if (dp.rotZ) dp.mesh.rotation.z += dp.rotZ * dt;
      });

      if (st.run && !RD.open && st.shop < 0) {
        tgt.z -= dt * 2.25;
        if (tgt.z <= ZEND + 2.5) {
          tgt.z = -1.5;
          cur.z = -1.5;
        }
      }
      var a = 1 - Math.exp(-dt * 5.2);
      cur.x = lerp(cur.x, tgt.x, a);
      cur.y = lerp(cur.y, tgt.y, a);
      cur.z = lerp(cur.z, tgt.z, a);
      cur.pitch = lerp(cur.pitch, tgt.pitch, a);
      var dyaw = ((tgt.yaw - cur.yaw + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
      cur.yaw += dyaw * a;

      var bob = st.run && st.shop < 0 && !RD.open ? Math.sin(now / 165) * 0.022 : 0; if (stepSnd) stepSnd.set(bob ? .55 : 0);
      cam.position.set(cur.x, cur.y + bob, cur.z);
      lookV.set(
        cur.x - Math.sin(cur.yaw) * Math.cos(cur.pitch),
        cur.y + bob + Math.sin(cur.pitch),
        cur.z - Math.cos(cur.yaw) * Math.cos(cur.pitch)
      );
      cam.lookAt(lookV);

      sky.position.copy(cam.position);
      streetGlow.position.set(cur.x, 3.8, cur.z - 2.5);

      if (st.onArrive && Math.abs(cur.x - tgt.x) < 0.08 && Math.abs(cur.z - tgt.z) < 0.08 && Math.abs(dyaw) < 0.05) {
        var fn = st.onArrive;
        st.onArrive = null;
        fn();
      }

      hudT += dt;
      if (hudT > 0.35 && !RD.open) { hudT = 0; ui(); }
      saveT += dt;
      if (saveT > 2.5) { saveT = 0; persist(); }
    });

    // ---- performance: every static box shares a few materials, so merge them per material into one mesh each
    // (≈2,900 draw calls → a few dozen). What moves, what you tap, and the sky that follows the camera stay apart.
    (function mergeStatic() {
      var keep = new Set();
      function mark(o) { if (o) o.traverse(function (c) { keep.add(c); }); }
      signPicks.forEach(mark); itemPicks.forEach(mark); mark(sky);
      cars.forEach(function (c) { mark(c.mesh); }); people.forEach(function (p) { mark(p.g); });
      dynamicProps.forEach(function (d) { mark(d.mesh); }); swingers.forEach(function (w) { mark(w.obj); });
      RD.meshes.forEach(function (m) { var r = m; while (r.parent && r.parent !== scene) r = r.parent; mark(r); });
      scene.updateMatrixWorld(true);
      var buckets = new Map();
      // materials the day/night blend or the style change edit stay on their own; any other look-alikes share one
      var live = new Set([mRoad, mWalk, mBulb, mCone, reflMat].concat(skylineMats, skyWinMats, vitrineSpotMats, glassReflMats, interiorMats, nightGlowMats,
        Object.keys(nightOverlayMats).map(function (kk) { return nightOverlayMats[kk]; }), signBoardMeshes.map(function (x) { return x.mat; }), bladeBoardMeshes.map(function (x) { return x.mat; })));
      function sig(m) {
        if (live.has(m) || m.map) return m.uuid;
        return [m.type, m.color && m.color.getHexString(), m.emissive && m.emissive.getHexString(), m.transparent ? 't' + m.opacity : 'o', m.side, m.vertexColors ? 'vc' : '', m.flatShading ? 'f' : '', m.roughness, m.metalness, m.depthWrite, m.blending, m.toneMapped].join('/');
      }
      function shown(o) { for (var q = o; q; q = q.parent) if (q.visible === false) return false; return true; }
      scene.traverse(function (o) {
        if (!o.isMesh || o.isInstancedMesh || keep.has(o) || Array.isArray(o.material) || !shown(o)) return;
        var g = o.geometry; if (!g || !g.attributes.position || !g.attributes.normal || !g.attributes.uv || g.morphAttributes && Object.keys(g.morphAttributes).length) return;
        var k = sig(o.material) + '|' + (o.renderOrder || 0); if (!buckets.has(k)) buckets.set(k, { m: o.material, ro: o.renderOrder || 0, list: [] });
        buckets.get(k).list.push(o);
      });
      var v = new T.Vector3(), nm = new T.Matrix3();
      buckets.forEach(function (b) {
        if (b.list.length < 2) return;
        var pos = [], nor = [], uv = [];
        b.list.forEach(function (o) {
          var g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry, P = g.attributes.position, N = g.attributes.normal, U = g.attributes.uv;
          nm.getNormalMatrix(o.matrixWorld);
          for (var i = 0; i < P.count; i++) {
            v.fromBufferAttribute(P, i).applyMatrix4(o.matrixWorld); pos.push(v.x, v.y, v.z);
            v.fromBufferAttribute(N, i).applyMatrix3(nm).normalize(); nor.push(v.x, v.y, v.z); uv.push(U.getX(i), U.getY(i));
          }
          if (g !== o.geometry) g.dispose();
        });
        var geo = new T.BufferGeometry();
        geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); geo.setAttribute('normal', new T.Float32BufferAttribute(nor, 3)); geo.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
        var mesh = new T.Mesh(geo, b.m); mesh.renderOrder = b.ro; mesh.matrixAutoUpdate = false; scene.add(mesh);
        b.list.forEach(function (o) { if (o.parent) o.parent.remove(o); });   // geometries may be shared (kit), so not disposed here
      });
    })();

    applyVisuals(true);
    ui();
    S.start();
    S.toast('🗽 Metropolis Avenue · Stroll past bespoke flagship storefronts & 3D vitrines');

    var stepSnd = window.MinestSfx ? MinestSfx.loop('steps') : null;   // footsteps while strolling (sfx.js)
    this.close = function () { if (stepSnd) stepSnd.stop(); S.close(); };
    this.setNight = toggleNight;
    this.focusShop = focusShop;
    this.pullItem = pullItem;
    this.stepOut = stepOutToStreet;
    this.stage = S;
  }

  var inst = null;
  window.MinestCity = {
    open: function (opts) {
      if (inst) { try { inst.close(); } catch (e) {} }
      inst = new City(opts);
      return inst;
    },
    styles: STYLES
  };
})();
