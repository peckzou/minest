export interface VocabEntry {
  word: string;
  phonetic: string;
  pos: string;
  meaning: string;
  example: string;
  category: 'aesthetic' | 'core' | 'tech' | 'custom';
}

export interface ForgedWordRecord extends VocabEntry {
  id: string;
  wpm: number;
  rhythmScore: number;
  kineticStyle: string;
  timestamp: string;
  starred?: boolean;
  keystrokeCount: number;
}

export const CURATED_VOCABULARY: VocabEntry[] = [
  // Aesthetic & Poetic Words (文学与意境词汇)
  {
    word: 'serendipity',
    phonetic: '/ˌser.ənˈdɪp.ə.ti/',
    pos: 'n.',
    meaning: '意外发现珍奇事物的机缘；不期而遇的美好',
    example: 'Finding that rare vinyl record in a quiet alley was pure serendipity.',
    category: 'aesthetic',
  },
  {
    word: 'ephemeral',
    phonetic: '/ɪˈfem.ər.əl/',
    pos: 'adj.',
    meaning: '朝生暮死的；转瞬即逝的；短暂的',
    example: 'Cherry blossoms are celebrated for their ephemeral springtime beauty.',
    category: 'aesthetic',
  },
  {
    word: 'luminescence',
    phonetic: '/ˌluː.mɪˈnes.əns/',
    pos: 'n.',
    meaning: '冷光；微光；柔和的发光现象',
    example: 'Midnight waves glowed with blue bioluminescence along the shore.',
    category: 'aesthetic',
  },
  {
    word: 'mellifluous',
    phonetic: '/meˈlɪf.lu.əs/',
    pos: 'adj.',
    meaning: '（声音或文字）如蜜般流畅甜美的；悦耳动听的',
    example: 'The cello produced a rich, mellifluous resonance across the hall.',
    category: 'aesthetic',
  },
  {
    word: 'vellichor',
    phonetic: '/ˈvel.ɪ.kɔːr/',
    pos: 'n.',
    meaning: '旧书店中弥漫的怀旧气息与岁月纸香',
    example: 'Stepping into the secondhand bookshop filled her lungs with vellichor.',
    category: 'aesthetic',
  },
  {
    word: 'petrichor',
    phonetic: '/ˈpet.rɪ.kɔːr/',
    pos: 'n.',
    meaning: '久旱逢甘霖时泥土散发出的清新气息',
    example: 'After the summer storm, a warm petrichor rose from the stone courtyard.',
    category: 'aesthetic',
  },
  {
    word: 'halcyon',
    phonetic: '/ˈhæl.si.ən/',
    pos: 'adj.',
    meaning: '宁静幸福的；风平浪静的；田园牧歌般的',
    example: 'She often recalled the halcyon afternoons of her coastal childhood.',
    category: 'aesthetic',
  },
  {
    word: 'ethereal',
    phonetic: '/iˈθɪə.ri.əl/',
    pos: 'adj.',
    meaning: '超凡脱俗的；空灵飘逸的；轻柔似雾的',
    example: 'Morning mist gave the mountain pine forest an ethereal silhouette.',
    category: 'aesthetic',
  },
  {
    word: 'sonder',
    phonetic: '/ˈsɒn.dər/',
    pos: 'n.',
    meaning: '意识到每个路人都有同样复杂鲜活人生的顿悟感',
    example: 'Watching train windows pass at dusk triggered a quiet moment of sonder.',
    category: 'aesthetic',
  },
  {
    word: 'solitude',
    phonetic: '/ˈsɒl.ɪ.tjuːd/',
    pos: 'n.',
    meaning: '独处；幽静；远离喧嚣的自在状态',
    example: 'Creative breakthroughs often bloom in deliberate solitude.',
    category: 'aesthetic',
  },

  // High-Frequency Core Lexicon (核心学术与思辨词库)
  {
    word: 'resilience',
    phonetic: '/rɪˈzɪl.jəns/',
    pos: 'n.',
    meaning: '韧性；抗挫折恢复力；回弹能力',
    example: 'True resilience is built through iterative adaptation under pressure.',
    category: 'core',
  },
  {
    word: 'paradigm',
    phonetic: '/ˈpær.ə.daɪm/',
    pos: 'n.',
    meaning: '范式；典范；思维架构模型',
    example: 'Tactile interfaces introduced a new paradigm for digital craftsmanship.',
    category: 'core',
  },
  {
    word: 'ubiquitous',
    phonetic: '/juːˈbɪk.wɪ.təs/',
    pos: 'adj.',
    meaning: '无所不在的；随处可见的',
    example: 'Mechanical switches have become ubiquitous among dedicated writers.',
    category: 'core',
  },
  {
    word: 'catalyst',
    phonetic: '/ˈkæt.əl.ɪst/',
    pos: 'n.',
    meaning: '催化剂；促成重大转变的契机',
    example: 'Playful feedback acts as a catalyst for effortless memory retention.',
    category: 'core',
  },
  {
    word: 'meticulous',
    phonetic: '/məˈtɪk.jə.ləs/',
    pos: 'adj.',
    meaning: '一丝不苟的；极为严谨细致的',
    example: 'Every keycap legend was aligned with meticulous typographic precision.',
    category: 'core',
  },
  {
    word: 'pragmatic',
    phonetic: '/præɡˈmæt.ɪk/',
    pos: 'adj.',
    meaning: '务实的；注重实效的；脚踏实地的',
    example: 'We adopted a pragmatic workflow that balances speed with clarity.',
    category: 'core',
  },
  {
    word: 'eloquent',
    phonetic: '/ˈel.ə.kwənt/',
    pos: 'adj.',
    meaning: '雄辩的；富有表现力的；传神的',
    example: 'Simple kinetic motion can be more eloquent than a page of instructions.',
    category: 'core',
  },
  {
    word: 'synthesis',
    phonetic: '/ˈsɪn.θə.sɪs/',
    pos: 'n.',
    meaning: '综合；合成；将多元要素融会贯通',
    example: 'This studio is a synthesis of acoustic physics and lexical memory.',
    category: 'core',
  },
  {
    word: 'momentum',
    phonetic: '/məˈmen.təm/',
    pos: 'n.',
    meaning: '动量；冲力；持续推进的势头',
    example: 'Once your fingers find a steady rhythm, typing builds unstoppable momentum.',
    category: 'core',
  },
  {
    word: 'cognizant',
    phonetic: '/ˈkɒɡ.nɪ.zənt/',
    pos: 'adj.',
    meaning: '清晰认知到的；深知…的',
    example: 'Designers must remain cognizant of how tactile latency shapes focus.',
    category: 'core',
  },

  // Tech, Design & Kinetic Craft (科技、设计与创造力)
  {
    word: 'kinematics',
    phonetic: '/ˌkɪn.ɪˈmæt.ɪks/',
    pos: 'n.',
    meaning: '运动学；物体轨迹与速度的几何规律',
    example: 'Spring kinematics make every typed character leap with lifelike weight.',
    category: 'tech',
  },
  {
    word: 'haptic',
    phonetic: '/ˈhæp.tɪk/',
    pos: 'adj.',
    meaning: '触觉感知的；提供实体触感反馈的',
    example: 'Crisp acoustic clicks create a convincing illusion of haptic key travel.',
    category: 'tech',
  },
  {
    word: 'ergonomic',
    phonetic: '/ˌɜː.ɡəˈnɒm.ɪk/',
    pos: 'adj.',
    meaning: '符合人体工学的；舒适高效的设计',
    example: 'Sculpted keycap profiles provide an ergonomic resting angle for wrists.',
    category: 'tech',
  },
  {
    word: 'telemetry',
    phonetic: '/təˈlem.ə.tri/',
    pos: 'n.',
    meaning: '遥测数据；实时传输的节律与速度指标',
    example: 'Real-time keystroke cadence helps you refine finger dexterity.',
    category: 'tech',
  },
  {
    word: 'typography',
    phonetic: '/taɪˈpɒɡ.rə.fi/',
    pos: 'n.',
    meaning: '字体排印艺术；版式设计美学',
    example: 'Kinetic typography transforms static vocabulary lists into living art.',
    category: 'tech',
  },
  {
    word: 'algorithm',
    phonetic: '/ˈæl.ɡə.rɪð.əm/',
    pos: 'n.',
    meaning: '算法；解决问题的有序计算法则',
    example: 'A procedural audio algorithm synthesizes each switch click in real time.',
    category: 'tech',
  },
  {
    word: 'resonance',
    phonetic: '/ˈrez.ən.əns/',
    pos: 'n.',
    meaning: '共鸣；谐振；声音或情感的深层回响',
    example: 'Polycarbonate plates add a warm acoustic resonance to every keystroke.',
    category: 'tech',
  },
  {
    word: 'iteration',
    phonetic: '/ˌɪt.ərˈeɪ.ʃən/',
    pos: 'n.',
    meaning: '迭代；反复打磨演进的过程',
    example: 'Through rapid iteration, the keyboard layout achieved effortless flow.',
    category: 'tech',
  },
  {
    word: 'architecture',
    phonetic: '/ˈɑː.kɪ.tek.tʃər/',
    pos: 'n.',
    meaning: '架构；体系结构；空间构造艺术',
    example: 'Clean modular architecture keeps high-speed particle animations smooth.',
    category: 'tech',
  },
  {
    word: 'craftsmanship',
    phonetic: '/ˈkrɑːfts.mən.ʃɪp/',
    pos: 'n.',
    meaning: '匠心工艺；精湛的手工与制造品质',
    example: 'Every detail of the keycap bevel reflects industrial craftsmanship.',
    category: 'tech',
  },
];

// Additional dictionary for instant Free Entry auto-completion & recognition
const EXTRA_LEXICON: Record<string, { phonetic: string; pos: string; meaning: string; example?: string }> = {
  apple: { phonetic: '/ˈæp.əl/', pos: 'n.', meaning: '苹果；平安与饱满的果实' },
  keyboard: { phonetic: '/ˈkiː.bɔːd/', pos: 'n.', meaning: '键盘；指尖敲击灵感的琴键' },
  velocity: { phonetic: '/vəˈlɒs.ə.ti/', pos: 'n.', meaning: '速度；速率；疾驰的动量' },
  harmony: { phonetic: '/ˈhɑː.mə.ni/', pos: 'n.', meaning: '和谐；和弦；协调一致的韵律' },
  inspire: { phonetic: '/ɪnˈspaɪər/', pos: 'v.', meaning: '激发灵感；鼓舞；赋予生命力' },
  flow: { phonetic: '/fləʊ/', pos: 'n./v.', meaning: '心流；流动；全神贯注的顺畅状态' },
  rhythm: { phonetic: '/ˈrɪð.əm/', pos: 'n.', meaning: '节奏；律动；规律起伏的节拍' },
  create: { phonetic: '/kriˈeɪt/', pos: 'v.', meaning: '创造；创作；从无到有地锻造' },
  memory: { phonetic: '/ˈmem.ər.i/', pos: 'n.', meaning: '记忆；回忆；脑海中镌刻的印记' },
  vocabulary: { phonetic: '/vəˈkæb.jə.lər.i/', pos: 'n.', meaning: '词汇；语汇；表达思想的词库' },
  kinetic: { phonetic: '/kɪˈnet.ɪk/', pos: 'adj.', meaning: '运动的；动力学的；充满活力的' },
  tactile: { phonetic: '/ˈtæk.taɪl/', pos: 'adj.', meaning: '触觉的；可感触的；有实体质感的' },
  lucid: { phonetic: '/ˈluː.sɪd/', pos: 'adj.', meaning: '清晰易懂的；透亮的；头脑清醒的' },
  zenith: { phonetic: '/ˈzen.ɪθ/', pos: 'n.', meaning: '巅峰；顶点；天顶' },
  aurora: { phonetic: '/ɔːˈrɔː.rə/', pos: 'n.', meaning: '极光；曙光；破晓时的绚丽光芒' },
  nebula: { phonetic: '/ˈneb.jə.lə/', pos: 'n.', meaning: '星云；宇宙深处的发光尘埃云' },
  horizon: { phonetic: '/həˈraɪ.zən/', pos: 'n.', meaning: '地平线；眼界；认知与探索的边界' },
  odyssey: { phonetic: '/ˈɒd.ɪ.si/', pos: 'n.', meaning: '漫长而充满奇遇的探索之旅' },
  alchemy: { phonetic: '/ˈæl.kə.mi/', pos: 'n.', meaning: '炼金术；化腐朽为神奇的奇妙蜕变' },
  symphony: { phonetic: '/ˈsɪm.fə.ni/', pos: 'n.', meaning: '交响乐；多重元素交织的华美篇章' },
  labyrinth: { phonetic: '/ˈlæb.ə.rɪnθ/', pos: 'n.', meaning: '迷宫；错综复杂的精巧结构' },
  euphoria: { phonetic: '/juːˈfɔː.ri.ə/', pos: 'n.', meaning: '欣快感；极度的欢欣与振奋' },
  nostalgia: { phonetic: '/nɒsˈtæl.dʒə/', pos: 'n.', meaning: '怀旧；乡愁；对往昔美好时光的眷恋' },
  wanderlust: { phonetic: '/ˈwɒn.də.lʌst/', pos: 'n.', meaning: '漫游癖；探索未知远方的强烈渴望' },
  flourish: { phonetic: '/ˈflʌr.ɪʃ/', pos: 'v./n.', meaning: '蓬勃生长；兴旺；华丽的挥洒' },
  radiant: { phonetic: '/ˈreɪ.di.ənt/', pos: 'adj.', meaning: '光芒四射的；容光焕发的；灿烂的' },
  tranquil: { phonetic: '/ˈtræŋ.kwɪl/', pos: 'adj.', meaning: '宁静的；平静的；安详澄澈的' },
  vibrant: { phonetic: '/ˈvaɪ.brənt/', pos: 'adj.', meaning: '充满生机的；鲜艳夺目的；共振有力的' },
  enigma: { phonetic: '/ɪˈnɪɡ.mə/', pos: 'n.', meaning: '谜团；令人费解却着迷的人或事物' },
  reverie: { phonetic: '/ˈrev.ər.i/', pos: 'n.', meaning: '白日梦；遐想；出神的幻想时刻' },
  cascade: { phonetic: '/kæˈskeɪd/', pos: 'n./v.', meaning: '小瀑布；倾泻而下；连续传递的涟漪' },
  prism: { phonetic: '/ˈprɪz.əm/', pos: 'n.', meaning: '棱镜；折射出七彩光谱的多面晶体' },
  anchor: { phonetic: '/ˈæŋ.kər/', pos: 'n./v.', meaning: '船锚；精神支柱；稳固停泊' },
  forge: { phonetic: '/fɔːdʒ/', pos: 'v./n.', meaning: '锻造；锤炼；铁匠炉中的千锤百炼' },
  'status quo': { phonetic: '/ˌsteɪ.təs ˈkwəʊ/', pos: 'phrase.', meaning: '现状；既定格局；当前事态' },
  'carpe diem': { phonetic: '/ˌkɑː.peɪ ˈdiː.em/', pos: 'phrase.', meaning: '把握当下；莫负韶华；及时行乐' },
  'quantum leap': { phonetic: '/ˌkwɒn.təm ˈliːp/', pos: 'phrase.', meaning: '质的飞跃；突破性进展' },
  'silver lining': { phonetic: '/ˌsɪl.vər ˈlaɪ.nɪŋ/', pos: 'phrase.', meaning: '乌云背后的金边；困境中的一线希望' },
  'paradigm shift': { phonetic: '/ˈpær.ə.daɪm ʃɪft/', pos: 'phrase.', meaning: '范式转移；根本性的思维变革' },
  'in full swing': { phonetic: '/ɪn fʊl swɪŋ/', pos: 'phrase.', meaning: '正如火如荼进行中；处于全盛活跃状态' },
};

export function lookupWordDetails(rawWord: string): VocabEntry | null {
  const clean = rawWord.trim().toLowerCase().replace(/\s+/g, ' ');
  if (!clean) return null;

  const curated = CURATED_VOCABULARY.find((item) => item.word.toLowerCase() === clean);
  if (curated) return curated;

  const extra = EXTRA_LEXICON[clean];
  if (extra) {
    return {
      word: clean,
      phonetic: extra.phonetic,
      pos: extra.pos,
      meaning: extra.meaning,
      example: extra.example || `Typed and forged "${clean}" in the kinetic studio.`,
      category: 'custom',
    };
  }

  return null;
}

export function inferSmartWordHint(rawWord: string): { phonetic: string; pos: string; meaning: string } {
  const clean = rawWord.trim().toLowerCase().replace(/\s+/g, ' ');
  const existing = lookupWordDetails(clean);
  if (existing) {
    return { phonetic: existing.phonetic, pos: existing.pos, meaning: existing.meaning };
  }

  if (clean.includes(' ')) {
    const wordCount = clean.split(' ').filter(Boolean).length;
    return {
      phonetic: `/${clean}/`,
      pos: 'phrase.',
      meaning: `自定义词组 / 短语（共 ${wordCount} 个单词，可按 Tab 键补充释义）`,
    };
  }

  // Morphological suffix heuristics so any custom word gets a sensible grammatical tag & phonetic preview
  let pos = 'n.';
  if (clean.endsWith('ly')) pos = 'adv.';
  else if (clean.endsWith('ous') || clean.endsWith('ive') || clean.endsWith('ful') || clean.endsWith('less') || clean.endsWith('able') || clean.endsWith('ic') || clean.endsWith('al')) pos = 'adj.';
  else if (clean.endsWith('ize') || clean.endsWith('ate') || clean.endsWith('ify') || clean.endsWith('ing') || clean.endsWith('ed')) pos = 'v.';

  return {
    phonetic: `/${clean}/`,
    pos,
    meaning: '自定义录入词汇（可按 Tab 键补充专属释义或笔记）',
  };
}
