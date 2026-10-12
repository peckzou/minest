import { IslandMetadata } from '../types/island';

export interface AssetCurationInfo {
  status: 'KEEP' | 'RENAME' | 'REPLACE';
  coverage: string;
  rationale: string;
}

export const DIORAMAS_DATA: IslandMetadata[] = [
  // =========================================================================
  // 1. Grand Library (RENAME) — Knowledge, Books, Literature
  // =========================================================================
  {
    id: 'diorama_01_grand_library',
    slug: 'diorama-grand-library',
    name: 'Grand Library',
    subtitle: 'Knowledge, Books & Literature',
    category: 'knowledge',
    categoryName: 'Knowledge & Education',
    worldLevel: 'level2_diorama',
    baseType: 'architectural_foundation',
    collection: 'category_knowledge',
    subcategories: ['Novels & Fiction', 'Non-Fiction', 'Essays & Anthologies', 'Reading Stacks', 'Archival Literature'],
    theme: 'Books, literature, scholarly study, quiet reading, and written knowledge.',
    description:
      'A majestic miniature civic library building featuring tall arched reading windows, exterior bookshelves, stone entrance steps, a working wall clock, and a tranquil courtyard reading garden.',
    polyCount: 6840,
    dimensionRatio: '1:1:0.85',
    minestWorldType: 'CategoryDiorama',
    assetFileRef: 'diorama_knowledge_grand_library_v1.glb',
    terrainSpecs: {
      shape: 'terraced',
      underbelly: 'Natural ground slab with polished sandstone base rim',
      waterFeatures: 'Courtyard stone birdbath fountain',
      foliage: 'Trimmed boxwood hedges and autumn maple reading tree',
      elevationLevels: 3,
    },
    palette: [
      { hex: '#785A46', label: 'Mahogany Bookshelf', role: 'Woodwork & Facade' },
      { hex: '#F0E5D8', label: 'Parchment Cream', role: 'Stone Wall & Steps' },
      { hex: '#345243', label: 'Forest Green', role: 'Garden Foliage' },
      { hex: '#D29B52', label: 'Gilded Amber', role: 'Clock & Lanterns' },
      { hex: '#587B94', label: 'Slate Blue', role: 'Mansard Roof' },
    ],
    landmarks: [
      { id: 'lib-01', name: 'Grand Portico', description: 'Carved sandstone entryway with book columns', tag: 'Architecture' },
      { id: 'lib-02', name: 'Open-Air Stacks', description: 'Tiered outdoor bookshelves with leather-bound tomes', tag: 'Feature' },
      { id: 'lib-03', name: 'Reading Garden', description: 'Cozy stone bench beneath a shade maple', tag: 'Environment' },
      { id: 'lib-04', name: 'Tower Clock', description: 'Brass clock marking mindful reading hours', tag: 'Landmark' },
    ],
    variants: {
      classic: { title: 'Civic Library', description: 'Warm brick, ivory columns, and green trim', accentColor: '#785A46' },
      fantasy: { title: 'Enchanted Archives', description: 'Spire-roofed sanctuary with floating glowing scrolls', accentColor: '#7E57C2' },
      minimal: { title: 'Nordic Study', description: 'Pale pine timber with clean floor-to-ceiling glass panes', accentColor: '#5C6BC0' },
    },
  },

  // =========================================================================
  // 02. Science Observatory (RENAME) — Science, Astronomy, Research
  // =========================================================================
  {
    id: 'diorama_02_science_observatory',
    slug: 'diorama-science-observatory',
    name: 'Science Observatory',
    subtitle: 'Science, Astronomy & Research',
    category: 'knowledge',
    categoryName: 'Knowledge & Education',
    worldLevel: 'level2_diorama',
    baseType: 'ground_patch',
    collection: 'category_knowledge',
    subcategories: ['Astrophysics', 'Cosmology', 'Space Missions', 'Empirical Research', 'Optics & Sensing'],
    theme: 'Scientific inquiry, astronomy, research instruments, and cosmic discovery.',
    description:
      'A miniature scientific observatory perched on a rugged rock foundation, featuring a revolving optical dome, parabolic radar terminal, research field laboratory, and meteorological station.',
    polyCount: 7210,
    dimensionRatio: '1:1:1.1',
    minestWorldType: 'CategoryDiorama',
    assetFileRef: 'diorama_knowledge_science_observatory_v1.glb',
    terrainSpecs: {
      shape: 'mountainous',
      underbelly: 'Natural rocky outcrop base with layered slate facets',
      waterFeatures: 'None (arid alpine summit)',
      foliage: 'Alpine scrub grasses and dwarf mountain pines',
      elevationLevels: 4,
    },
    palette: [
      { hex: '#ECEFF1', label: 'Dome Titanium', role: 'Dome & Telescopes' },
      { hex: '#455A64', label: 'Mountain Granite', role: 'Rocky Plinth' },
      { hex: '#1E88E5', label: 'Scientific Azure', role: 'Research Hub Accent' },
      { hex: '#FFB300', label: 'Starlight Gold', role: 'Brass Instrument Rings' },
      { hex: '#263238', label: 'Deep Basalt', role: 'Structural Foundation' },
    ],
    landmarks: [
      { id: 'obs-01', name: 'Great Optical Dome', description: 'Slotted dome with long-focal refractor telescope', tag: 'Core Instrument' },
      { id: 'obs-02', name: 'Radio Dish Terminal', description: 'Miniature parabolic dish tracking signals', tag: 'Science' },
      { id: 'obs-03', name: 'Field Data Hub', description: 'Research cabin with weather sensor mast', tag: 'Facility' },
    ],
    variants: {
      classic: { title: 'Summit Station', description: 'Classic alpine observatory in white and slate', accentColor: '#1E88E5' },
      fantasy: { title: 'Astral Scriptorium', description: 'Brass astrolabe rings circling a mystical crystal lens', accentColor: '#AB47BC' },
      minimal: { title: 'Atacama Post', description: 'Ultra-clean modernist cubes against terracotta soil', accentColor: '#FF7043' },
    },
  },

  // =========================================================================
  // 03. School & Academy (RENAME) — Education, Learning, Skills
  // =========================================================================
  {
    id: 'diorama_03_school_academy',
    slug: 'diorama-school-academy',
    name: 'School & Academy',
    subtitle: 'Education, Learning & Skills',
    category: 'knowledge',
    categoryName: 'Knowledge & Education',
    worldLevel: 'level2_diorama',
    baseType: 'ground_patch',
    collection: 'category_knowledge',
    subcategories: ['Primary & Higher Ed', 'Classrooms', 'Athletics & Play', 'Skill Mastery', 'Academic Campus'],
    theme: 'Schools, academic foundations, learning communities, and student development.',
    description:
      'A vibrant academy campus diorama with a red-brick academic building, bell belfry, a yellow school bus parked on asphalt, outdoor recreation basketball court, and courtyard learning garden.',
    polyCount: 7100,
    dimensionRatio: '1.1:1:0.8',
    minestWorldType: 'CategoryDiorama',
    assetFileRef: 'diorama_knowledge_school_academy_v1.glb',
    terrainSpecs: {
      shape: 'circular',
      underbelly: 'Level schoolyard pavers and asphalt bus loop with curb',
      waterFeatures: 'Courtyard drinking fountain',
      foliage: 'Campus oak shade tree and perimeter hedge borders',
      elevationLevels: 2,
    },
    palette: [
      { hex: '#B71C1C', label: 'Collegiate Brick', role: 'School Hall Facade' },
      { hex: '#FDD835', label: 'School Bus Yellow', role: 'Transit & Bus' },
      { hex: '#43A047', label: 'Campus Turf', role: 'Schoolyard Lawn' },
      { hex: '#ECEFF1', label: 'Chalk White', role: 'Sash Windows & Trim' },
      { hex: '#37474F', label: 'Asphalt Gray', role: 'Bus Bay & Play Court' },
    ],
    landmarks: [
      { id: 'sch-01', name: 'Bell Hall', description: 'Historic brick main school with belfry roof', tag: 'Building' },
      { id: 'sch-02', name: 'Yellow Bus 01', description: 'Iconic low-poly school bus ready at the curb', tag: 'Vehicle' },
      { id: 'sch-03', name: 'Playfield Court', description: 'Miniature hoops court with marked game lines', tag: 'Activities' },
    ],
    variants: {
      classic: { title: 'Hometown Academy', description: 'Traditional red brick school with belfry clock', accentColor: '#B71C1C' },
      fantasy: { title: 'Arcane College', description: 'Ivy-wrapped gothic spires with glowing rune blackboard', accentColor: '#5E35B1' },
      minimal: { title: 'Bauhaus Studio', description: 'Modular glass-and-steel education pavilions', accentColor: '#3949AB' },
    },
  },

  // =========================================================================
  // 04. Ancient Civilization (RENAME) — History, Archaeology, Civilization
  // =========================================================================
  {
    id: 'diorama_04_ancient_civilization',
    slug: 'diorama-ancient-civilization',
    name: 'Ancient Civilization',
    subtitle: 'History, Archaeology & Civilization',
    category: 'knowledge',
    categoryName: 'Knowledge & Education',
    worldLevel: 'level2_diorama',
    baseType: 'architectural_foundation',
    collection: 'category_knowledge',
    subcategories: ['Classical Antiquity', 'Archaeology', 'Mythology', 'Ancient Empires', 'Monuments & Ruins'],
    theme: 'World history, ancient architecture, archaeological heritage, and enduring civilizational memory.',
    description:
      'A classical archaeological diorama with fluted Doric columns, semi-circular amphitheater stone tiers, weathered pediment fragments, ancient flagstone pathways, and an olive grove terrace.',
    polyCount: 6540,
    dimensionRatio: '1:1:0.75',
    minestWorldType: 'CategoryDiorama',
    assetFileRef: 'diorama_knowledge_ancient_civilization_v1.glb',
    terrainSpecs: {
      shape: 'terraced',
      underbelly: 'Excavated earth terraces with stepped limestone foundation',
      waterFeatures: 'Ancient stone cistern with shallow rainwater pool',
      foliage: 'Wild Mediterranean olive tree and dry grasses between stones',
      elevationLevels: 3,
    },
    palette: [
      { hex: '#E0D6C3', label: 'Weathered Marble', role: 'Columns & Steps' },
      { hex: '#8D6E63', label: 'Terracotta Earth', role: 'Trench Soil & Pottery' },
      { hex: '#689F38', label: 'Wild Olive', role: 'Mediterranean Foliage' },
      { hex: '#BCAAA4', label: 'Aged Limestone', role: 'Paving Stones' },
      { hex: '#80CBC4', label: 'Cistern Patina', role: 'Rainwater Reflection' },
    ],
    landmarks: [
      { id: 'ruin-01', name: 'Doric Colonnade', description: 'Standing classical columns with intact architrave', tag: 'Architecture' },
      { id: 'ruin-02', name: 'Stone Amphitheater', description: 'Curved tiered stone seating overlooking the agora', tag: 'Forum' },
      { id: 'ruin-03', name: 'Sacred Olive Tree', description: 'Ancient gnarled tree growing through cracked flagstones', tag: 'Nature' },
    ],
    variants: {
      classic: { title: 'Acropolis Dig', description: 'Sun-bleached marble ruins with golden hour shadow', accentColor: '#D7CCC8' },
      fantasy: { title: 'Lost Atlantis', description: 'Turquoise-lit submerged ruins with glowing kelp', accentColor: '#26A69A' },
      minimal: { title: 'Sculpted Forum', description: 'Monochrome cubic abstraction of classical colonnade', accentColor: '#78909C' },
    },
  },

  // =========================================================================
  // 05. Art Museum (KEEP) — Art, Collections, Culture
  // =========================================================================
  {
    id: 'diorama_05_art_museum',
    slug: 'diorama-art-museum',
    name: 'Art Museum',
    subtitle: 'Art, Collections & Culture',
    category: 'culture',
    categoryName: 'Culture & Entertainment',
    worldLevel: 'level2_diorama',
    baseType: 'architectural_foundation',
    collection: 'category_culture',
    subcategories: ['Fine Art', 'Sculptures', 'Art Collections', 'Modern Exhibitions', 'Curated Galleries'],
    theme: 'Visual arts, museum curation, sculpture gardens, aesthetics, and masterpieces.',
    description:
      'An elegant modernist art museum with glass skylights, framed painting exhibition wings, a serene outdoor sculpture courtyard with abstract bronze statues, and an entry atrium.',
    polyCount: 6720,
    dimensionRatio: '1.05:1:0.8',
    minestWorldType: 'CategoryDiorama',
    assetFileRef: 'diorama_culture_art_museum_v1.glb',
    terrainSpecs: {
      shape: 'terraced',
      underbelly: 'Honed white travertine plaza slab with recessed garden bed',
      waterFeatures: 'Reflective courtyard sculpture pool',
      foliage: 'Sculpted topiary spirals and specimen magnolia tree',
      elevationLevels: 2,
    },
    palette: [
      { hex: '#F5F5F6', label: 'Museum Marble', role: 'Exterior Pavilion Walls' },
      { hex: '#80DEEA', label: 'Skylight Glass', role: 'Roof Glazing & Reflection' },
      { hex: '#8D6E63', label: 'Bronze Patina', role: 'Outdoor Sculpture' },
      { hex: '#FF7043', label: 'Gallery Canvas', role: 'Artwork Color Accents' },
      { hex: '#546E7A', label: 'Travertine Trim', role: 'Base Plaza Border' },
    ],
    landmarks: [
      { id: 'mus-01', name: 'Glass Skylight Pavilion', description: 'Geometric glass pyramid crowning the gallery', tag: 'Architecture' },
      { id: 'mus-02', name: 'Sculpture Garden', description: 'Abstract bronze Möbius sculpture over reflective pool', tag: 'Art' },
      { id: 'mus-03', name: 'Open Gallery Wing', description: 'Illuminated exhibition salon with framed canvases', tag: 'Exhibition' },
    ],
    variants: {
      classic: { title: 'Modern Wing', description: 'Crisp travertine walls with glass pyramid skylight', accentColor: '#546E7A' },
      fantasy: { title: 'Prism Gallery', description: 'Iridescent floating walls refracting rainbow light', accentColor: '#AB47BC' },
      minimal: { title: 'Concrete Cube', description: 'Brutalist minimalist gallery with clean slit windows', accentColor: '#90A4AE' },
    },
  },

  // =========================================================================
  // 06. Cinema & Theater (RENAME) — Movies, TV, Performance
  // =========================================================================
  {
    id: 'diorama_06_cinema_theater',
    slug: 'diorama-cinema-theater',
    name: 'Cinema & Theater',
    subtitle: 'Movies, TV & Performance',
    category: 'culture',
    categoryName: 'Culture & Entertainment',
    worldLevel: 'level2_diorama',
    baseType: 'architectural_foundation',
    collection: 'category_culture',
    subcategories: ['Feature Films', 'Stage Plays', 'Directors & Cast', 'TV & Screenwriting', 'Festivals'],
    theme: 'Motion pictures, theatrical stagecraft, film history, and dramatic performance.',
    description:
      'A glowing miniature theater and cinema palace featuring an Art Deco marquee with illuminated bulbs, movie poster kiosks, a ticket box office, red velvet red carpet, and film reels.',
    polyCount: 6920,
    dimensionRatio: '1:1:0.9',
    minestWorldType: 'CategoryDiorama',
    assetFileRef: 'diorama_culture_cinema_theater_v1.glb',
    terrainSpecs: {
      shape: 'circular',
      underbelly: 'Sidewalk pavement slab with brass curb trim and red carpet',
      waterFeatures: 'None',
      foliage: 'Potted ornamental boxwoods flanking the red carpet',
      elevationLevels: 2,
    },
    palette: [
      { hex: '#C62828', label: 'Cinema Velvet', role: 'Red Carpet & Curtains' },
      { hex: '#212121', label: 'Midnight Facade', role: 'Exterior Walls' },
      { hex: '#FFD54F', label: 'Marquee Bulbs', role: 'Illuminated Signage' },
      { hex: '#42A5F5', label: 'Neon Glow', role: 'Poster Backlights' },
      { hex: '#CFD8DC', label: 'Chrome Reeling', role: 'Film Canisters' },
    ],
    landmarks: [
      { id: 'cin-01', name: 'Grand Marquee', description: 'Beveled canopy with glowing bulb letters', tag: 'Signage' },
      { id: 'cin-02', name: 'Red Carpet Entry', description: 'Velvet runner leading to double brass doors', tag: 'Entrance' },
      { id: 'cin-03', name: 'Box Office Kiosk', description: 'Octagonal glass ticket booth with brass speaker', tag: 'Kiosk' },
      { id: 'cin-04', name: 'Film Canister Stack', description: 'Vintage 35mm film reels stacked at the side', tag: 'Prop' },
    ],
    variants: {
      classic: { title: 'Art Deco Cinema', description: 'Gilded 1930s movie palace with glowing marquee bulbs', accentColor: '#C62828' },
      fantasy: { title: 'Illusion Theater', description: 'Deep purple velvet with floating spectral projectors', accentColor: '#8E24AA' },
      minimal: { title: 'Indie Filmhouse', description: 'Matte black minimal facade with neon typography', accentColor: '#E91E63' },
    },
  },

  // =========================================================================
  // 07. Music Hall (RENAME) — Music, Concerts, Instruments
  // =========================================================================
  {
    id: 'diorama_07_music_hall',
    slug: 'diorama-music-hall',
    name: 'Music Hall',
    subtitle: 'Music, Concerts & Instruments',
    category: 'culture',
    categoryName: 'Culture & Entertainment',
    worldLevel: 'level2_diorama',
    baseType: 'architectural_foundation',
    collection: 'category_culture',
    subcategories: ['Classical Symphony', 'Live Concerts', 'Instruments', 'Composers & Bands', 'Acoustic Stages'],
    theme: 'Music, acoustic architecture, orchestral performances, and live concerts.',
    description:
      'A miniature acoustic music hall featuring a sculpted acoustic shell roof, illuminated auditorium stage, a glossy black grand piano, orchestral music stands, and overhead concert spotlights.',
    polyCount: 7380,
    dimensionRatio: '1:1:0.95',
    minestWorldType: 'CategoryDiorama',
    assetFileRef: 'diorama_culture_music_hall_v1.glb',
    terrainSpecs: {
      shape: 'circular',
      underbelly: 'Tiered acoustic auditorium disc with polished warm cherrywood',
      waterFeatures: 'None',
      foliage: 'Indoor stage ferns in brass planter pots',
      elevationLevels: 3,
    },
    palette: [
      { hex: '#1B1B1B', label: 'Ebony Piano', role: 'Grand Piano Body' },
      { hex: '#D4AF37', label: 'Brass Horn', role: 'Acoustic Shell Ribs' },
      { hex: '#8D4024', label: 'Cherry Stage', role: 'Hardwood Stage Planking' },
      { hex: '#FFF8E1', label: 'Stage Spotlight', role: 'Warm Luminescence' },
      { hex: '#37474F', label: 'Auditorium Slate', role: 'Tiered Seating' },
    ],
    landmarks: [
      { id: 'hall-01', name: 'Concert Grand Piano', description: 'Propped open ebony piano with ivory keys', tag: 'Instrument' },
      { id: 'hall-02', name: 'Acoustic Sound Shell', description: 'Curved wood and brass reflectors projecting sound', tag: 'Acoustics' },
      { id: 'hall-03', name: 'Conductor Podium', description: 'Elevated stand with open musical score sheet', tag: 'Stage' },
    ],
    variants: {
      classic: { title: 'Philharmonic Hall', description: 'Curved golden acoustic ribs with warm hardwood', accentColor: '#D4AF37' },
      fantasy: { title: 'Crystal Amphitheater', description: 'Resonant quartz tuning pillars with harmonic glow', accentColor: '#4DD0E1' },
      minimal: { title: 'Nordic Sound Studio', description: 'Acoustic slat panels with sleek architectural lines', accentColor: '#78909C' },
    },
  },

  // =========================================================================
  // 08. Sports Arena (RENAME) — Sports, Teams, Competitions
  // =========================================================================
  {
    id: 'diorama_08_sports_arena',
    slug: 'diorama-sports-arena',
    name: 'Sports Arena',
    subtitle: 'Sports, Teams & Competitions',
    category: 'culture',
    categoryName: 'Culture & Entertainment',
    worldLevel: 'level2_diorama',
    baseType: 'ground_patch',
    collection: 'category_culture',
    subcategories: ['Athletics', 'Team Sports', 'Championship Tournaments', 'Fitness & Training', 'Fan Culture'],
    theme: 'Sports, competition, athletic excellence, team spirit, and stadium atmosphere.',
    description:
      'A miniature sports arena diorama featuring a striped green playing pitch, tiered spectator stands with colorful seating, tall floodlight gantries, a digital scoreboard, and arched entrance gates.',
    polyCount: 7650,
    dimensionRatio: '1.1:1:0.85',
    minestWorldType: 'CategoryDiorama',
    assetFileRef: 'diorama_culture_sports_arena_v1.glb',
    terrainSpecs: {
      shape: 'circular',
      underbelly: 'Stadium perimeter concourse ring with security turnstiles',
      waterFeatures: 'None',
      foliage: 'Entrance plaza perimeter palm trees',
      elevationLevels: 3,
    },
    palette: [
      { hex: '#2E7D32', label: 'Pitch Turf', role: 'Playing Field Green' },
      { hex: '#1565C0', label: 'Grandstand Blue', role: 'Spectator Seating' },
      { hex: '#ECEFF1', label: 'Boundary Chalk', role: 'Field Markings & Gates' },
      { hex: '#FF9800', label: 'Scoreboard Amber', role: 'Digital Display' },
      { hex: '#455A64', label: 'Floodlight Steel', role: 'Light Towers & Truss' },
    ],
    landmarks: [
      { id: 'stad-01', name: 'Championship Pitch', description: 'Mowed striped turf with goals and center circle', tag: 'Field' },
      { id: 'stad-02', name: 'Tiered Grandstands', description: 'Stepped bleachers with team color accents', tag: 'Seating' },
      { id: 'stad-03', name: 'Quad Floodlights', description: 'Four elevated LED stadium light towers', tag: 'Infrastructure' },
    ],
    variants: {
      classic: { title: 'City Arena', description: 'Oval stadium with green pitch and blue stands', accentColor: '#1565C0' },
      fantasy: { title: 'Colosseum of Champions', description: 'Sunken stone arena with fiery torch braziers', accentColor: '#E65100' },
      minimal: { title: 'Olympic Bowl', description: 'Sculptural swooping concrete canopy bowl', accentColor: '#455A64' },
    },
  },

  // =========================================================================
  // 09. City & Community (REPLACE - New Curated Scene) — Society, Cities, Public Life
  // =========================================================================
  {
    id: 'diorama_09_city_community',
    slug: 'diorama-city-community',
    name: 'City & Community',
    subtitle: 'Society, Cities & Public Life',
    category: 'life',
    categoryName: 'Everyday Life',
    worldLevel: 'level2_diorama',
    baseType: 'architectural_foundation',
    collection: 'category_everyday',
    subcategories: ['Public Square', 'Civic Life', 'Transit & Commute', 'Community Centers', 'Urban Architecture'],
    theme: 'Vibrant civic life, community gathering, public parks, town squares, and urban connection.',
    description:
      'A bustling miniature civic plaza featuring an iconic town hall clock tower, pedestrian promenade, transit bus shelter, park benches under street trees, public fountain, and crosswalk pavers.',
    polyCount: 7350,
    dimensionRatio: '1.1:1:0.9',
    minestWorldType: 'CategoryDiorama',
    assetFileRef: 'diorama_life_city_community_v1.glb',
    terrainSpecs: {
      shape: 'circular',
      underbelly: 'Honed civic plaza stone plinth with curb and crosswalk marking',
      waterFeatures: 'Central tiered civic fountain with bubbling spray',
      foliage: 'Pruned European linden street trees in iron tree grates',
      elevationLevels: 3,
    },
    palette: [
      { hex: '#37474F', label: 'Civic Slate', role: 'Clock Tower & Roofs' },
      { hex: '#ECEFF1', label: 'Portland Stone', role: 'Town Hall Facade & Columns' },
      { hex: '#0288D1', label: 'Civic Fountain', role: 'Plaza Basin Water' },
      { hex: '#43A047', label: 'Park Greenery', role: 'Canopy Trees & Planters' },
      { hex: '#FFB300', label: 'Plaza Lantern', role: 'Warm Clock Dial & Lights' },
    ],
    landmarks: [
      { id: 'city-01', name: 'Civic Clock Tower', description: 'Four-sided municipal clock tower marking community events', tag: 'Civic' },
      { id: 'city-02', name: 'Central Fountain Plaza', description: 'Tiered limestone fountain with concentric seating rings', tag: 'Public Space' },
      { id: 'city-03', name: 'Transit Shelter & Bench', description: 'Glass-canopied city stop with timber park benches', tag: 'Transit' },
    ],
    variants: {
      classic: { title: 'Town Square', description: 'Classic civic clock tower and stone plaza fountain', accentColor: '#0288D1' },
      fantasy: { title: 'Solar Agora', description: 'Luminescent marble arches with hovering sun motes', accentColor: '#7E57C2' },
      minimal: { title: 'Metro Concourse', description: 'Clean monolithic basalt pavilions with LED transit indicators', accentColor: '#37474F' },
    },
  },

  // =========================================================================
  // 10. Home & Garden (RENAME) — Home, Family, Daily Life
  // =========================================================================
  {
    id: 'diorama_10_home_garden',
    slug: 'diorama-home-garden',
    name: 'Home & Garden',
    subtitle: 'Home, Family & Daily Life',
    category: 'life',
    categoryName: 'Everyday Life',
    worldLevel: 'level2_diorama',
    baseType: 'ground_patch',
    collection: 'category_everyday',
    subcategories: ['Family Living', 'Home Decor', 'Gardening & Yard', 'Warm Hearth', 'Neighborhoods'],
    theme: 'Home comfort, family bonds, garden care, cozy domesticity, and daily sanctuary.',
    description:
      'A warm miniature family home with pitched shingle roof, smoking stone chimney, front porch with wooden rocking chair, flower beds with picket fencing, vegetable patch, and red curbside mailbox.',
    polyCount: 6480,
    dimensionRatio: '1:1:0.85',
    minestWorldType: 'CategoryDiorama',
    assetFileRef: 'diorama_life_home_garden_v1.glb',
    terrainSpecs: {
      shape: 'circular',
      underbelly: 'Natural lawn ground patch with cobblestone pathway to door',
      waterFeatures: 'Garden hose bib with wooden water trough',
      foliage: 'Flowering hydrangeas, picket fence roses, and apple tree',
      elevationLevels: 2,
    },
    palette: [
      { hex: '#D87A56', label: 'Terracotta Shingle', role: 'Pitched Roof' },
      { hex: '#FFF9C4', label: 'Window Glow', role: 'Warm Interior Light' },
      { hex: '#F5F5F0', label: 'Clapboard White', role: 'House Siding' },
      { hex: '#4CAF50', label: 'Front Lawn', role: 'Garden Turf' },
      { hex: '#D32F2F', label: 'Mailbox Red', role: 'Curbside Accent' },
    ],
    landmarks: [
      { id: 'home-01', name: 'Gabled Cottage', description: 'Cozy two-story cottage with stone chimney smoke', tag: 'Home' },
      { id: 'home-02', name: 'Front Porch', description: 'Covered porch with wooden balustrade and rocking chair', tag: 'Living' },
      { id: 'home-03', name: 'Flower Garden', description: 'Blooming flower beds along white picket fencing', tag: 'Garden' },
    ],
    variants: {
      classic: { title: 'Country Cottage', description: 'Warm clapboard siding with terracotta tile roof', accentColor: '#D87A56' },
      fantasy: { title: 'Fairy Tale Croft', description: 'Moss-thatched mushroom roof with glowing fairy lanterns', accentColor: '#8D6E63' },
      minimal: { title: 'A-Frame Cabin', description: 'Clean timber A-frame with glass gable and deck', accentColor: '#455A64' },
    },
  },

  // =========================================================================
  // 11. Food Market (KEEP) — Food, Cuisine, Restaurants
  // =========================================================================
  {
    id: 'diorama_11_food_market',
    slug: 'diorama-food-market',
    name: 'Food Market',
    subtitle: 'Food, Cuisine & Restaurants',
    category: 'life',
    categoryName: 'Everyday Life',
    worldLevel: 'level2_diorama',
    baseType: 'ground_patch',
    collection: 'category_everyday',
    subcategories: ['Culinary Arts', 'Bakeries & Cafes', 'Fresh Markets', 'Fine Dining', 'Street Eats'],
    theme: 'Food, culinary arts, bakeries, farmer markets, cuisine culture, and dining together.',
    description:
      'A bustling miniature street market with striped awning bakery, wooden fruit and vegetable crates, outdoor cafe bistro tables with umbrella, chalkboard menu, and an espresso cart.',
    polyCount: 7420,
    dimensionRatio: '1:1:0.8',
    minestWorldType: 'CategoryDiorama',
    assetFileRef: 'diorama_life_food_market_v1.glb',
    terrainSpecs: {
      shape: 'circular',
      underbelly: 'Cobblestone market square slab with drainage gutter stone',
      waterFeatures: 'None',
      foliage: 'Planter boxes with fresh rosemary and potted bay trees',
      elevationLevels: 2,
    },
    palette: [
      { hex: '#E53935', label: 'Awning Crimson', role: 'Striped Canopy' },
      { hex: '#FFE082', label: 'Fresh Baguette', role: 'Bakery Display & Crates' },
      { hex: '#43A047', label: 'Market Produce', role: 'Greens & Vegetables' },
      { hex: '#6D4C41', label: 'Bistro Wood', role: 'Tables & Cart Framework' },
      { hex: '#ECEFF1', label: 'Awning White', role: 'Canopy Stripe & Chalk' },
    ],
    landmarks: [
      { id: 'mkt-01', name: 'Corner Bakery Stall', description: 'Glass counter filled with bread loaves and croissants', tag: 'Bakery' },
      { id: 'mkt-02', name: 'Produce Stand', description: 'Slanted wooden crates with apples, citrus, and greens', tag: 'Market' },
      { id: 'mkt-03', name: 'Outdoor Cafe Seating', description: 'Round iron bistro tables with umbrellas', tag: 'Dining' },
    ],
    variants: {
      classic: { title: 'Piazza Market', description: 'Red and white striped stalls over cobblestone pavers', accentColor: '#E53935' },
      fantasy: { title: 'Alchemist Bazaar', description: 'Vibrant potion jars and aromatic spice cauldrons', accentColor: '#7B1FA2' },
      minimal: { title: 'Artisan Food Hall', description: 'Clean birch wood counters with minimalist menu boards', accentColor: '#8D6E63' },
    },
  },

  // =========================================================================
  // 12. Shopping Street (RENAME) — Brands, Products, Shopping
  // =========================================================================
  {
    id: 'diorama_12_shopping_street',
    slug: 'diorama-shopping-street',
    name: 'Shopping Street',
    subtitle: 'Brands, Products & Shopping',
    category: 'life',
    categoryName: 'Everyday Life',
    worldLevel: 'level2_diorama',
    baseType: 'architectural_foundation',
    collection: 'category_everyday',
    subcategories: ['Fashion & Apparel', 'Boutiques & Retail', 'Design Products', 'Window Shopping', 'Goods & Craft'],
    theme: 'Shopping, retail storefronts, craftsmanship, product design, and consumer culture.',
    description:
      'A miniature boutique shopping promenade with stylish illuminated storefront displays, mannequins behind glass, vintage cast-iron streetlamps, herringbone pedestrian pavers, and planter urns.',
    polyCount: 7120,
    dimensionRatio: '1.1:1:0.9',
    minestWorldType: 'CategoryDiorama',
    assetFileRef: 'diorama_life_shopping_street_v1.glb',
    terrainSpecs: {
      shape: 'terraced',
      underbelly: 'Polished granite curb and herringbone brick pedestrian mall',
      waterFeatures: 'None',
      foliage: 'Ornamental street trees in square cast iron grates',
      elevationLevels: 2,
    },
    palette: [
      { hex: '#263238', label: 'Storefront Charcoal', role: 'Boutique Facades' },
      { hex: '#FFE082', label: 'Shop Window Glow', role: 'Warm Display Light' },
      { hex: '#B0BEC5', label: 'Herringbone Paver', role: 'Pedestrian Walkway' },
      { hex: '#C2185B', label: 'Fashion Magenta', role: 'Boutique Sign Accent' },
      { hex: '#455A64', label: 'Iron Streetlamp', role: 'Lamppost & Grates' },
    ],
    landmarks: [
      { id: 'shop-01', name: 'Design Boutique', description: 'Floor-to-ceiling illuminated window with displays', tag: 'Retail' },
      { id: 'shop-02', name: 'Promenade Arcade', description: 'Covered colonnade with hanging merchant signs', tag: 'Walkway' },
      { id: 'shop-03', name: 'Cast-Iron Streetlamps', description: 'Dual-arm vintage lantern post illuminating pavers', tag: 'Street' },
    ],
    variants: {
      classic: { title: 'Boutique Alley', description: 'Charming European shopping street with bay windows', accentColor: '#C2185B' },
      fantasy: { title: 'Curio Lane', description: 'Enchanted curiosity shops with glowing crystal orbs', accentColor: '#7E57C2' },
      minimal: { title: 'Flagship Avenue', description: 'Monochrome glass cube showrooms with clean lines', accentColor: '#37474F' },
    },
  },

  // =========================================================================
  // 13. Workshop & Factory (RENAME) — Technology, Making, Work
  // =========================================================================
  {
    id: 'diorama_13_workshop_factory',
    slug: 'diorama-workshop-factory',
    name: 'Workshop & Factory',
    subtitle: 'Technology, Making & Work',
    category: 'life',
    categoryName: 'Everyday Life',
    worldLevel: 'level2_diorama',
    baseType: 'architectural_foundation',
    collection: 'category_everyday',
    subcategories: ['Hardware & Tools', 'Digital Fabrication', 'Makers & Crafts', 'Industrial Work', 'Blueprints'],
    theme: 'Makers, hands-on fabrication, industrial design, creative tools, and technology.',
    description:
      'A detailed maker studio and fabrication shop with heavy timber workbenches, pegboard tool racks, rotating gears, miniature 3D fabrication station, blueprint drafting table, and industrial lighting.',
    polyCount: 7540,
    dimensionRatio: '1:1:0.85',
    minestWorldType: 'CategoryDiorama',
    assetFileRef: 'diorama_life_workshop_factory_v1.glb',
    terrainSpecs: {
      shape: 'circular',
      underbelly: 'Polished concrete studio floor slab with safety perimeter line',
      waterFeatures: 'Parts wash sink in corner',
      foliage: 'Small desktop succulent in concrete cube pot',
      elevationLevels: 2,
    },
    palette: [
      { hex: '#5D4037', label: 'Heavy Oak Bench', role: 'Workbench & Storage' },
      { hex: '#455A64', label: 'Machined Steel', role: 'Tools & Gears' },
      { hex: '#FB8C00', label: 'Industrial Orange', role: 'Safety Enclosure & Carts' },
      { hex: '#1976D2', label: 'Blueprint Cyan', role: 'Drafting Desk & Plans' },
      { hex: '#CFD8DC', label: 'Studio Concrete', role: 'Floor Slab' },
    ],
    landmarks: [
      { id: 'work-01', name: 'Master Workbench', description: 'Vise-equipped wooden bench with pegboard tool array', tag: 'Fabrication' },
      { id: 'work-02', name: 'Drafting Board', description: 'Angled drawing board with technical blueprints', tag: 'Design' },
      { id: 'work-03', name: 'Prototyping Bay', description: 'Enclosed 3D fabrication station with spool holder', tag: 'Tech' },
    ],
    variants: {
      classic: { title: 'Maker Studio', description: 'Industrial brick workshop with timber workbenches', accentColor: '#FB8C00' },
      fantasy: { title: 'Runeforge Workshop', description: 'Anvil glowing with mystical runes and molten metal', accentColor: '#D84315' },
      minimal: { title: 'Clean Tech Lab', description: 'All-white prototyping benches with stainless steel tools', accentColor: '#1976D2' },
    },
  },

  // =========================================================================
  // 14. Forest & Wildlife (RENAME) — Nature, Animals, Ecology
  // =========================================================================
  {
    id: 'diorama_14_forest_wildlife',
    slug: 'diorama-forest-wildlife',
    name: 'Forest & Wildlife',
    subtitle: 'Nature, Animals & Ecology',
    category: 'nature',
    categoryName: 'Nature & Exploration',
    worldLevel: 'level2_diorama',
    baseType: 'ground_patch',
    collection: 'category_nature',
    subcategories: ['Old Growth Woods', 'Fauna & Wildlife', 'Conservation', 'Hiking Trails', 'Ecosystems'],
    theme: 'Forest ecosystems, wilderness conservation, wildlife habitats, and pristine nature.',
    description:
      'A dense miniature woodland diorama featuring tall pine and birch trees, a clear babbling mountain stream, moss-covered boulders, animal track trails, and a raised wooden wildlife observation deck.',
    polyCount: 6890,
    dimensionRatio: '1:1:1.0',
    minestWorldType: 'CategoryDiorama',
    assetFileRef: 'diorama_nature_forest_wildlife_v1.glb',
    terrainSpecs: {
      shape: 'irregular',
      underbelly: 'Natural stratified soil and mossy bedrock slab patch',
      waterFeatures: 'Meandering pebble stream with log footbridge',
      foliage: 'Layered pines, deciduous oaks, ferns, and forest mushrooms',
      elevationLevels: 3,
    },
    palette: [
      { hex: '#2E7D32', label: 'Canopy Pine', role: 'Needle & Leaf Clusters' },
      { hex: '#4E342E', label: 'Dark Bark', role: 'Tree Trunks & Logs' },
      { hex: '#4BA4B8', label: 'Clear Brook', role: 'Stream Water' },
      { hex: '#78909C', label: 'Mossy River Rock', role: 'Boulders & Shingle' },
      { hex: '#8D6E63', label: 'Observation Wood', role: 'Platform & Railing' },
    ],
    landmarks: [
      { id: 'for-01', name: 'Old Growth Pines', description: 'Tiered geometric pine trees forming dense forest canopy', tag: 'Trees' },
      { id: 'for-02', name: 'Log Footbridge', description: 'Hand-hewn timber bridge crossing the clear stream', tag: 'Crossing' },
      { id: 'for-03', name: 'Wildlife Lookout', description: 'Elevated wooden blind with binoculars on tripod', tag: 'Observation' },
    ],
    variants: {
      classic: { title: 'Alpine Woods', description: 'Crisp evergreen forest with mossy boulders and brook', accentColor: '#2E7D32' },
      fantasy: { title: 'Glowshroom Glade', description: 'Bioluminescent mushrooms and mystical cyan stream', accentColor: '#00E676' },
      minimal: { title: 'Zen Pine Grove', description: 'Stylized conical trees on raked river sand base', accentColor: '#558B2F' },
    },
  },

  // =========================================================================
  // 15. Botanical Garden (KEEP) — Plants, Flowers, Gardening
  // =========================================================================
  {
    id: 'diorama_15_botanical_garden',
    slug: 'diorama-botanical-garden',
    name: 'Botanical Garden',
    subtitle: 'Plants, Flowers & Gardening',
    category: 'nature',
    categoryName: 'Nature & Exploration',
    worldLevel: 'level2_diorama',
    baseType: 'architectural_foundation',
    collection: 'category_nature',
    subcategories: ['Horticulture', 'Greenhouses', 'Exotic Flora', 'Flower Parterres', 'Botany & Care'],
    theme: 'Horticulture, glasshouses, exotic plant conservation, and floral design.',
    description:
      'A Victorian-inspired botanical diorama featuring an octagonal glass greenhouse with wrought-iron frame, geometrically arranged flower beds, gravel walking paths, palm pavilion, and a butterfly fountain.',
    polyCount: 7340,
    dimensionRatio: '1:1:0.9',
    minestWorldType: 'CategoryDiorama',
    assetFileRef: 'diorama_nature_botanical_garden_v1.glb',
    terrainSpecs: {
      shape: 'circular',
      underbelly: 'Brick curb border with fine crushed gravel pathway loop',
      waterFeatures: 'Central tiered butterfly fountain basin',
      foliage: 'Greenhouse tropical palms, rose bushes, and flowering beds',
      elevationLevels: 2,
    },
    palette: [
      { hex: '#2E7D32', label: 'Verdant Green', role: 'Palms & Boxwood' },
      { hex: '#B2EBF2', label: 'Greenhouse Glass', role: 'Glasshouse Panes' },
      { hex: '#E91E63', label: 'Rose Flora', role: 'Flower Beds' },
      { hex: '#455A64', label: 'Iron Framework', role: 'Conservatory Ribs' },
      { hex: '#D7CCC8', label: 'Crushed Gravel', role: 'Garden Pathways' },
    ],
    landmarks: [
      { id: 'bot-01', name: 'Victorian Glasshouse', description: 'Domed octagonal glass conservatory with skylights', tag: 'Architecture' },
      { id: 'bot-02', name: 'Formal Parterre', description: 'Symmetrical flower beds with manicured boxwood borders', tag: 'Flora' },
      { id: 'bot-03', name: 'Butterfly Basin', description: 'Stone basin with gentle bubbling fountain jet', tag: 'Water' },
    ],
    variants: {
      classic: { title: 'Royal Conservatory', description: 'Iron-framed glasshouse amidst vibrant floral parterres', accentColor: '#2E7D32' },
      fantasy: { title: 'Lunar Hothouse', description: 'Silver-framed dome sheltering nocturnal blooming orchids', accentColor: '#00B0FF' },
      minimal: { title: 'Biophilic Atrium', description: 'Sleek timber greenhouse with interior vertical plant walls', accentColor: '#66BB6A' },
    },
  },

  // =========================================================================
  // 16. Ocean & Marine Life (RENAME) — Oceans, Marine Animals, Ecosystems
  // =========================================================================
  {
    id: 'diorama_16_ocean_marine_life',
    slug: 'diorama-ocean-marine-life',
    name: 'Ocean & Marine Life',
    subtitle: 'Oceans, Marine Animals & Ecosystems',
    category: 'nature',
    categoryName: 'Nature & Exploration',
    worldLevel: 'level2_diorama',
    baseType: 'ground_patch',
    collection: 'category_nature',
    subcategories: ['Coral Reefs', 'Marine Biology', 'Deep Sea', 'Coastal Ecosystems', 'Aquatic Life'],
    theme: 'Oceans, marine biodiversity, coral ecosystems, undersea life, and marine habitats.',
    description:
      'A vibrant underwater diorama featuring colorful staghorn coral spires, waving sea fan kelp, sculpted submerged sea rocks, pearl oyster shell, and stylized schooling fish swimming along translucent waters.',
    polyCount: 7180,
    dimensionRatio: '1:1:0.85',
    minestWorldType: 'CategoryDiorama',
    assetFileRef: 'diorama_nature_ocean_marine_life_v1.glb',
    terrainSpecs: {
      shape: 'terraced',
      underbelly: 'White coral sand patch with submerged turquoise shelf',
      waterFeatures: 'Translucent turquoise sea column effect',
      foliage: 'Coral branches, purple sea fans, and emerald kelp ribbons',
      elevationLevels: 3,
    },
    palette: [
      { hex: '#00ACC1', label: 'Lagoon Turquoise', role: 'Water Column' },
      { hex: '#FF7043', label: 'Living Coral', role: 'Staghorn & Brain Coral' },
      { hex: '#AB47BC', label: 'Sea Anemone', role: 'Purple Fan Coral' },
      { hex: '#FFF9C4', label: 'Coral Sand', role: 'Seabed Ground' },
      { hex: '#FFCA28', label: 'Goldfin Fish', role: 'Schooling Fish Accents' },
    ],
    landmarks: [
      { id: 'reef-01', name: 'Coral Spires', description: 'Tiered low-poly branching coral reefs in warm hues', tag: 'Ecosystem' },
      { id: 'reef-02', name: 'Giant Clamshell', description: 'Sculpted shell resting on a sandy shelf with pearl', tag: 'Marine' },
      { id: 'reef-03', name: 'Kelp Forest Trench', description: 'Curving green kelp blades waving along a sea rift', tag: 'Flora' },
    ],
    variants: {
      classic: { title: 'Tropical Barrier Reef', description: 'Vibrant coral colonies in crystal turquoise water', accentColor: '#00ACC1' },
      fantasy: { title: 'Abyssal Grotto', description: 'Deep indigo trench with glowing bioluminescent polyps', accentColor: '#7C4DFF' },
      minimal: { title: 'Seaform Sculpture', description: 'Porcelain white coral structures against azure resin', accentColor: '#26C6DA' },
    },
  },

  // =========================================================================
  // 17. Travel & Landmarks (RENAME) — Geography, Travel, Places
  // =========================================================================
  {
    id: 'diorama_17_travel_landmarks',
    slug: 'diorama-travel-landmarks',
    name: 'Travel & Landmarks',
    subtitle: 'Geography, Travel & Places',
    category: 'nature',
    categoryName: 'Nature & Exploration',
    worldLevel: 'level2_diorama',
    baseType: 'ground_patch',
    collection: 'category_nature',
    subcategories: ['Coastal Ports', 'Landmarks & Beacons', 'Expeditions', 'Voyages & Ships', 'Wayfinding'],
    theme: 'World travel, iconic geographic landmarks, voyages, harbors, and departure points.',
    description:
      'A scenic maritime harbor diorama with a red-and-white striped lighthouse beacon tower, wooden mooring piers, a docked sailboat with furled canvas sails, ocean buoys, and a coastal destination signpost.',
    polyCount: 7140,
    dimensionRatio: '1:1:1.0',
    minestWorldType: 'CategoryDiorama',
    assetFileRef: 'diorama_nature_travel_landmarks_v1.glb',
    terrainSpecs: {
      shape: 'coastal',
      underbelly: 'Natural coastal rock ledge meeting deep blue water slab',
      waterFeatures: 'Harbor inlet water with gentle foam wash',
      foliage: 'Sea grasses and coastal gorse bushes along the rocky bank',
      elevationLevels: 3,
    },
    palette: [
      { hex: '#D32F2F', label: 'Lighthouse Red', role: 'Lighthouse Stripes' },
      { hex: '#FFFFFF', label: 'Signal White', role: 'Lighthouse Body & Sails' },
      { hex: '#0288D1', label: 'Harbor Blue', role: 'Inlet Water' },
      { hex: '#6D4C41', label: 'Mooring Timber', role: 'Pilings & Pier Planks' },
      { hex: '#78909C', label: 'Coastal Granite', role: 'Sea Cliff Rocks' },
    ],
    landmarks: [
      { id: 'harb-01', name: 'Beacon Lighthouse', description: 'Tapered red-and-white masonry lighthouse with glass lantern', tag: 'Beacon' },
      { id: 'harb-02', name: 'Wooden Pier', description: 'Planked wharf with tie-off cleats and fishing barrels', tag: 'Dock' },
      { id: 'harb-03', name: 'Sloop "Explorer"', description: 'Single-mast wooden sailing boat tied to the dock', tag: 'Vessel' },
    ],
    variants: {
      classic: { title: 'Fisherman Cove', description: 'Weathered wooden docks with classic red lighthouse', accentColor: '#D32F2F' },
      fantasy: { title: 'Skyport Dock', description: 'Gilded mooring mast for miniature brass airships', accentColor: '#FFA000' },
      minimal: { title: 'Nordic Marina', description: 'Monochrome timber slipway with minimalist beacon spire', accentColor: '#0288D1' },
    },
  },

  // =========================================================================
  // 18. Memory & Time Garden (RENAME) — Memories, Life Story, Time
  // =========================================================================
  {
    id: 'diorama_18_memory_time_garden',
    slug: 'diorama-memory-time-garden',
    name: 'Memory & Time Garden',
    subtitle: 'Memories, Life Story & Time',
    category: 'mind',
    categoryName: 'Personal & Conceptual',
    worldLevel: 'level2_diorama',
    baseType: 'ground_patch',
    collection: 'category_conceptual',
    subcategories: ['Life Milestones', 'Memories & Keepsakes', 'Passage of Time', 'Reflections', 'Personal History'],
    theme: 'Memories, life chapters, passage of time, nostalgic reflection, and meaningful milestones.',
    description:
      'A nostalgic memory garden diorama with an ornate brass clock tower, miniature framed photograph displays on stone pedestals, a flowering cherry blossom tree, carved stone bench, and winding stone pathway.',
    polyCount: 6980,
    dimensionRatio: '1:1:0.9',
    minestWorldType: 'CategoryDiorama',
    assetFileRef: 'diorama_conceptual_memory_time_garden_v1.glb',
    terrainSpecs: {
      shape: 'circular',
      underbelly: 'Aged flagstone ground patch with mossy garden perimeter',
      waterFeatures: 'Small reflection basin with floating blossom petals',
      foliage: 'Blossoming cherry tree with pink canopy and falling petals',
      elevationLevels: 2,
    },
    palette: [
      { hex: '#F48FB1', label: 'Blossom Pink', role: 'Cherry Tree Canopy' },
      { hex: '#8D6E63', label: 'Aged Walnut', role: 'Clock Tower Timber' },
      { hex: '#FFD54F', label: 'Brass Milestone', role: 'Clock Dial & Frames' },
      { hex: '#CFD8DC', label: 'Memorial Stone', role: 'Path & Bench' },
      { hex: '#558B2F', label: 'Velvet Moss', role: 'Ground Grasses' },
    ],
    landmarks: [
      { id: 'mem-01', name: 'Milestone Clock Tower', description: 'Four-sided vintage clock tracking life stages', tag: 'Time' },
      { id: 'mem-02', name: 'Blooming Memory Tree', description: 'Pink cherry blossom tree showering petals', tag: 'Nature' },
      { id: 'mem-03', name: 'Pedestal Gallery', description: 'Framed miniature snapshots along the flagstone path', tag: 'Milestone' },
    ],
    variants: {
      classic: { title: 'Autumn Keepsake', description: 'Golden leaves and warm copper clock tower', accentColor: '#F48FB1' },
      fantasy: { title: 'Chrono Glade', description: 'Floating crystal hourglasses reflecting past scenes', accentColor: '#CE93D8' },
      minimal: { title: 'Timeline Walk', description: 'Architectural concrete monoliths marking life chapters', accentColor: '#78909C' },
    },
  },

  // =========================================================================
  // 19. Philosophy Sanctuary (RENAME) — Philosophy, Values, Reflection
  // =========================================================================
  {
    id: 'diorama_19_philosophy_sanctuary',
    slug: 'diorama-philosophy-sanctuary',
    name: 'Philosophy Sanctuary',
    subtitle: 'Philosophy, Values & Reflection',
    category: 'mind',
    categoryName: 'Personal & Conceptual',
    worldLevel: 'level2_diorama',
    baseType: 'architectural_foundation',
    collection: 'category_conceptual',
    subcategories: ['Ethics & Principles', 'Existential Reflection', 'Deep Thought', 'Meditation', 'Quiet Truth'],
    theme: 'Philosophy, personal ethics, core values, deep contemplation, and quiet wisdom.',
    description:
      'A serene contemplative sanctuary with slender classical columns supporting an open canopy, a central mirror-like reflecting pond, an abstract thinker sculpture, and smooth river stone walking paths.',
    polyCount: 6640,
    dimensionRatio: '1:1:0.85',
    minestWorldType: 'CategoryDiorama',
    assetFileRef: 'diorama_conceptual_philosophy_sanctuary_v1.glb',
    terrainSpecs: {
      shape: 'circular',
      underbelly: 'Concentric circular marble foundation with moat basin',
      waterFeatures: 'Central square reflecting pond with zero ripple',
      foliage: 'Single sculptural Japanese black pine with pruned branches',
      elevationLevels: 2,
    },
    palette: [
      { hex: '#ECEFF1', label: 'Pure Marble', role: 'Pavilion Columns & Floor' },
      { hex: '#37474F', label: 'Still Water', role: 'Reflecting Basin' },
      { hex: '#455A64', label: 'Basalt Plinth', role: 'Sculpture Foundation' },
      { hex: '#8D6E63', label: 'Bronze Mind', role: 'Contemplative Figure' },
      { hex: '#26A69A', label: 'Patina Tile', role: 'Canopy Ceiling' },
    ],
    landmarks: [
      { id: 'phil-01', name: 'Open Rotunda', description: 'Slender marble columns supporting open celestial ceiling', tag: 'Architecture' },
      { id: 'phil-02', name: 'Still Mirror Pool', description: 'Flawless dark water basin reflecting clouds and sky', tag: 'Reflection' },
      { id: 'phil-03', name: 'Thinker Plinth', description: 'Bronze abstract sculpture poised in contemplation', tag: 'Sculpture' },
    ],
    variants: {
      classic: { title: 'Athenian Stoa', description: 'Doric columns over polished marble and still water', accentColor: '#ECEFF1' },
      fantasy: { title: 'Void Sanctuary', description: 'Floating dark obsidian arches over a cosmic star mirror', accentColor: '#7E57C2' },
      minimal: { title: 'Zen Meditation Base', description: 'Raked sand square with single basalt contemplation seat', accentColor: '#37474F' },
    },
  },

  // =========================================================================
  // 20. Future & Innovation Lab (REPLACE - Replaces Dream Observatory) — Future, Technology, Creativity
  // =========================================================================
  {
    id: 'diorama_20_future_innovation_lab',
    slug: 'diorama-future-innovation-lab',
    name: 'Future & Innovation Lab',
    subtitle: 'Future, Technology & Creativity',
    category: 'cosmos',
    categoryName: 'Personal & Conceptual',
    worldLevel: 'level2_diorama',
    baseType: 'architectural_foundation',
    collection: 'category_conceptual',
    subcategories: ['Futurism', 'Frontier AI & Robotics', 'Clean Energy Tech', 'Visionary Prototyping', 'Breakthrough Ideas'],
    theme: 'Future horizons, disruptive technology, frontier robotics, quantum computing, and radical innovation.',
    description:
      'A sleek futuristic research campus featuring a faceted glass clean-room dome, glowing blue holographic emitter ring, solar photovoltaic canopy facets, robotic testing arm, and circuit-etched foundation plinth.',
    polyCount: 7620,
    dimensionRatio: '1:1:1.0',
    minestWorldType: 'CategoryDiorama',
    assetFileRef: 'diorama_conceptual_future_innovation_lab_v1.glb',
    terrainSpecs: {
      shape: 'circular',
      underbelly: 'Futuristic hexagon foundation disc with illuminated neon circuit tracks',
      waterFeatures: 'Liquid cooling canal with turquoise luminescent glow',
      foliage: 'Bioluminescent synthetic glass plant sculptures',
      elevationLevels: 3,
    },
    palette: [
      { hex: '#00E5FF', label: 'Quantum Cyan', role: 'Holographic Rings & Circuit Glow' },
      { hex: '#263238', label: 'Titanium Graphite', role: 'Lab Pod Structure' },
      { hex: '#E0F7FA', label: 'Smart Glass', role: 'Faceted Hex Dome' },
      { hex: '#7C4DFF', label: 'Plasma Violet', role: 'Energy Core Glow' },
      { hex: '#CFD8DC', label: 'Aerospace White', role: 'Clean Room Panels' },
    ],
    landmarks: [
      { id: 'fut-01', name: 'Hexagonal Bio-Pod', description: 'Geodesic smart-glass dome housing quantum prototyping hardware', tag: 'Architecture' },
      { id: 'fut-02', name: 'Holographic Projector Ring', description: 'Hovering magnetic ring emitting 3D spatial data beams', tag: 'Technology' },
      { id: 'fut-03', name: 'Solar Energy Wings', description: 'Cantilevered photovoltaic arrays angled for optimal capture', tag: 'Energy' },
    ],
    variants: {
      classic: { title: 'Silicon Hub', description: 'Clean aerospace white modular pods with cyan circuit lines', accentColor: '#00E5FF' },
      fantasy: { title: 'Aether Engine Lab', description: 'Floating crystals harnessing stellar plasma conduits', accentColor: '#7C4DFF' },
      minimal: { title: 'Mono Lab Pavilion', description: 'Crisp black-and-glass geometric clean room', accentColor: '#263238' },
    },
  },
];
