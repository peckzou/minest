import { IslandMetadata } from '../types/island';

export const EXPANSION_MAJOR_WORLDS: IslandMetadata[] = [
  // =========================================================================
  // MW-01. My Sports Universe
  // =========================================================================
  {
    id: 'world_25_sports_universe',
    slug: 'world-sports-universe',
    name: 'My Sports Universe',
    subtitle: 'Athletics, Arenas & Championship Continent',
    category: 'culture',
    categoryName: 'Sports & Athletics',
    worldLevel: 'level1_major',
    baseType: 'floating_island',
    collection: 'collection_c_expansion',
    subcategories: ['Olympic Stadiums', 'Velodrome & Racing', 'Aquatic Complex', 'Extreme Sports Park', 'Training Grounds'],
    theme: 'Dynamic sports arenas, athletic competition tracks, stadium floodlights, and active motion.',
    description:
      'A sprawling athletic continent uniting an oval Olympic stadium with tiered stands, a banked cycling velodrome, an azure water polo natatorium, a spiraling motocross track, and a victory torch monument crowning the central plateau.',
    polyCount: 7850,
    dimensionRatio: '1 : 1 : 1.1',
    minestWorldType: 'WORLD_TYPE_SPORTS_UNIVERSE',
    assetFileRef: 'minest/worlds/sports_universe_v1.glb',
    terrainSpecs: {
      shape: 'irregular',
      underbelly: 'Aerodynamic basalt bedrock terraces with embedded structural pylons',
      waterFeatures: 'Tiered diving pool cascade into cooling canal surrounding stadium perimeters',
      foliage: 'Manicured court lawns, ornamental victory laurel hedges, and stadium palm borders',
      elevationLevels: 4,
    },
    palette: [
      { hex: '#E63946', label: 'Tartan Track Red', role: 'Running Track & Ribbons' },
      { hex: '#1D3557', label: 'Arena Navy', role: 'Grandstands & Roof Cantilever' },
      { hex: '#457B9D', label: 'Aquatic Cyan', role: 'Swimming Pools & Waterways' },
      { hex: '#F1FAEE', label: 'Chalk White', role: 'Court Markings & Canopies' },
      { hex: '#E9C46A', label: 'Victory Gold', role: 'Torch & Pylon Accents' },
      { hex: '#52B788', label: 'Pitch Emerald', role: 'Turf Infields & Lawns' },
    ],
    landmarks: [
      { id: 'mw01-lm1', name: 'Grand Colosseum Arena', description: 'Dual-tier stadium with oval turf pitch and soaring arch canopies', tag: 'Stadium' },
      { id: 'mw01-lm2', name: 'Banked Velodrome Ring', description: 'Curved wooden sprint cycling track suspended over terrain rim', tag: 'Velodrome' },
      { id: 'mw01-lm3', name: 'Olympic Torch Monument', description: 'Gilded obelisk beacon with flickering eternal flame atop peak', tag: 'Monument' },
      { id: 'mw01-lm4', name: 'Extreme Skate & Motocross Terraces', description: 'Concrete bowls, halfpipes, and stepped earthen ramps', tag: 'Extreme' },
    ],
    variants: {
      classic: { title: 'Olympic Gala', description: 'Crisp red tartan tracks, white steel arches, and vibrant turf', accentColor: '#E63946' },
      fantasy: { title: 'Celestial Games', description: 'Luminescent energy lanes, floating ring hurdles, and starlit bleachers', accentColor: '#4CC9F0' },
      minimal: { title: 'Monochrome Athletics', description: 'Slate gray surfaces with precision laser court boundary lines', accentColor: '#343A40' },
    },
  },

  // =========================================================================
  // MW-02. My Culinary Universe
  // =========================================================================
  {
    id: 'world_26_culinary_universe',
    slug: 'world-culinary-universe',
    name: 'My Culinary Universe',
    subtitle: 'Gastronomy, Vineyards & International Markets',
    category: 'life',
    categoryName: 'Food & Culinary',
    worldLevel: 'level1_major',
    baseType: 'floating_island',
    collection: 'collection_c_expansion',
    subcategories: ['Patisserie Boulevard', 'Sunlit Vineyards', 'Spice Bazaar Harbor', 'Bistro Hilltop', 'Artisan Bakeries'],
    theme: 'World culinary cultures, aroma markets, terraced grape vineyards, and bustling outdoor dining plazas.',
    description:
      'A feast-inspired macro continent featuring terraced hillside vineyards with a stone wine press, a waterfront spice bazaar with striped canopies, an artisan patisserie street with brick ovens, and a central chef rotunda.',
    polyCount: 8200,
    dimensionRatio: '1 : 1 : 1.15',
    minestWorldType: 'WORLD_TYPE_CULINARY_UNIVERSE',
    assetFileRef: 'minest/worlds/culinary_universe_v1.glb',
    terrainSpecs: {
      shape: 'terraced',
      underbelly: 'Warm terracotta strata and layered vineyard retaining stonework',
      waterFeatures: 'Clear olive-lined river winding through vineyard terraces into harbor docks',
      foliage: 'Trellised grape vines, Mediterranean olive groves, and fragrant rosemary planters',
      elevationLevels: 5,
    },
    palette: [
      { hex: '#7209B7', label: 'Grape Vineyard', role: 'Vineyard Rows & Wine Cellar' },
      { hex: '#F77F00', label: 'Tuscan Terracotta', role: 'Roof Tiles & Clay Ovens' },
      { hex: '#D62828', label: 'Ripe Tomato', role: 'Market Awnings & Canopies' },
      { hex: '#FCBF49', label: 'Artisan Wheat', role: 'Bakery Flour & Stacks' },
      { hex: '#2A9D8F', label: 'Olive Branch', role: 'Terrace Foliage' },
      { hex: '#FFEEDD', label: 'Parchment Linen', role: 'Dining Tablecloths' },
    ],
    landmarks: [
      { id: 'mw02-lm1', name: 'Grand Spice Harbor Bazaar', description: 'Tiered timber docks stacked with exotic spice sacks and striped awnings', tag: 'Market' },
      { id: 'mw02-lm2', name: 'Hillside Sunlit Vineyard', description: 'Curved stone terraces bearing grape trellises leading to a rustic cellar', tag: 'Vineyard' },
      { id: 'mw02-lm3', name: 'Rotunda Haute Cuisine', description: 'Glass-domed restaurant observatory with copper culinary chimneys', tag: 'Bistro' },
      { id: 'mw02-lm4', name: 'Stone Hearth Bakery Mill', description: 'Traditional river flour mill with wood-fired bread oven arches', tag: 'Bakery' },
    ],
    variants: {
      classic: { title: 'Tuscan Gastronomy', description: 'Sun-baked terracotta, lush green vines, and warm timber bistros', accentColor: '#F77F00' },
      fantasy: { title: 'Confectionery Wonderland', description: 'Caramel syrup canals, sugar crystal spires, and gingerbread masonry', accentColor: '#F72585' },
      minimal: { title: 'Modern Nordic Kitchen', description: 'Pale ash wood, stainless steel modules, and pristine matte ceramics', accentColor: '#6C757D' },
    },
  },

  // =========================================================================
  // MW-03. My Fashion Universe
  // =========================================================================
  {
    id: 'world_27_fashion_universe',
    slug: 'world-fashion-universe',
    name: 'My Fashion Universe',
    subtitle: 'Haute Couture, Runway Catwalks & Design Ateliers',
    category: 'culture',
    categoryName: 'Fashion & Design',
    worldLevel: 'level1_major',
    baseType: 'floating_island',
    collection: 'collection_c_expansion',
    subcategories: ['Runway Catwalks', 'Haute Couture Lofts', 'Textile Weaving Mill', 'Accessory Boutiques', 'Styling Pavilions'],
    theme: 'Fashion design studios, glittering runway stages, draped textile architectural curves, and mannequin plazas.',
    description:
      'A glamorous high-fashion macro continent centered around an elevated neon runway catwalk piercing an origami glass show dome, bordered by tailoring lofts, giant fabric draping bridges, and sleek modern flagship boutiques.',
    polyCount: 8400,
    dimensionRatio: '1 : 1 : 1.2',
    minestWorldType: 'WORLD_TYPE_FASHION_UNIVERSE',
    assetFileRef: 'minest/worlds/fashion_universe_v1.glb',
    terrainSpecs: {
      shape: 'irregular',
      underbelly: 'Sculpted pearl-white geometric facets with polished chrome corner accents',
      waterFeatures: 'Reflective catwalk mirror pools with sunken LED illumination',
      foliage: 'Architectural topiary obelisks and minimalist white calla lily planters',
      elevationLevels: 4,
    },
    palette: [
      { hex: '#212529', label: 'Onyx Noir', role: 'Catwalk Floors & Runway Borders' },
      { hex: '#F8F9FA', label: 'Silk White', role: 'Fabric Drapes & Modernist Walls' },
      { hex: '#D4AF37', label: 'Champagne Gold', role: 'Jewelry Fittings & Catwalk Arches' },
      { hex: '#E01E5A', label: 'Magenta Crimson', role: 'Velvet Curtains & Accents' },
      { hex: '#6C757D', label: 'Cashmere Grey', role: 'Studio Mezzanines' },
    ],
    landmarks: [
      { id: 'mw03-lm1', name: 'The Grand T-Stage Runway', description: 'Polished obsidian catwalk extending through a dynamic arch of flashbulbs', tag: 'Runway' },
      { id: 'mw03-lm2', name: 'Haute Couture Glass Dome', description: 'Parametric geodesic exhibition dome with floating silk ribbons', tag: 'Atelier' },
      { id: 'mw03-lm3', name: 'Mannequin Promenade', description: 'Curved elevated terrace showcasing silhouette sculptures and styling busts', tag: 'Plaza' },
      { id: 'mw03-lm4', name: 'Textile Loom Pavilion', description: 'Industrial design studio with hanging colorful spools and fabric looms', tag: 'Textile' },
    ],
    variants: {
      classic: { title: 'Parisian Couture', description: 'Monochrome chic with velvet red carpets and brass runway accents', accentColor: '#E01E5A' },
      fantasy: { title: 'Prismatic Aurora Weave', description: 'Shifting iridescent fabric bridges and floating stardust needles', accentColor: '#B5179E' },
      minimal: { title: 'Bauhaus Studio', description: 'Strict geometric blocks, primary color accents, and exposed structural wireframes', accentColor: '#212529' },
    },
  },

  // =========================================================================
  // MW-04. My Transportation Universe
  // =========================================================================
  {
    id: 'world_28_transportation_universe',
    slug: 'world-transportation-universe',
    name: 'My Transportation Universe',
    subtitle: 'High-Speed Rails, Airfields, Harbors & Highways',
    category: 'systems',
    categoryName: 'Transportation & Mobility',
    worldLevel: 'level1_major',
    baseType: 'floating_island',
    collection: 'collection_c_expansion',
    subcategories: ['Grand Terminal', 'Runway Peninsula', 'Container Port', 'Elevated Monorail', 'Highway Interchanges'],
    theme: 'Intermodal transit hubs, high-speed rail viaducts, airport tarmac strips, and bustling maritime docks.',
    description:
      'A masterfully coordinated mobility continent linking a high-speed bullet train terminal, a coastal airport runway strip with control tower, an elevated multi-tier monorail network, and a deepwater cargo container terminal.',
    polyCount: 8650,
    dimensionRatio: '1 : 1 : 1.15',
    minestWorldType: 'WORLD_TYPE_TRANSPORT_UNIVERSE',
    assetFileRef: 'minest/worlds/transportation_universe_v1.glb',
    terrainSpecs: {
      shape: 'coastal',
      underbelly: 'Heavy civil engineering concrete caissons and faceted coastal basalt pillars',
      waterFeatures: 'Deep shipping shipping channel with navigation buoys and dry docks',
      foliage: 'Avenue plane trees along terminal promenades and runway perimeter berms',
      elevationLevels: 4,
    },
    palette: [
      { hex: '#0077B6', label: 'Transit Blue', role: 'Train Station Canopies & Harbor Docks' },
      { hex: '#E63946', label: 'Express Red', role: 'High-Speed Train Livery & Crane Booms' },
      { hex: '#343A40', label: 'Tarmac Asphalt', role: 'Runways, Taxiways & Viaducts' },
      { hex: '#F1FAEE', label: 'Runway White', role: 'Runway Stripes & Terminal Glass' },
      { hex: '#FFB703', label: 'Signal Amber', role: 'Navigation Lights & Gantry Cranes' },
      { hex: '#48CAE4', label: 'Harbor Wave', role: 'Canal Waters' },
    ],
    landmarks: [
      { id: 'mw04-lm1', name: 'Grand Central Transcontinental Terminal', description: 'Glass-vaulted terminal concourse with dual express train platforms', tag: 'Terminal' },
      { id: 'mw04-lm2', name: 'Aviation Runway Peninsula', description: 'Marked landing strip projecting over open sky with rotating radar spire', tag: 'Airport' },
      { id: 'mw04-lm3', name: 'Deepwater Container Crane Array', description: 'Twin yellow gantry cranes stacking red and blue intermodal containers', tag: 'Port' },
      { id: 'mw04-lm4', name: 'Sky-Viaduct Monorail Loop', description: 'Curving elevated concrete pillars carrying sleek magnetic train pods', tag: 'Transit' },
    ],
    variants: {
      classic: { title: 'Modern Metropolis Hub', description: 'Industrial steel gantries, asphalt runways, and navy blue express trains', accentColor: '#0077B6' },
      fantasy: { title: 'Solar Wind Zeppelins', description: 'Brass mooring masts, floating cloud docks, and winged sky-barges', accentColor: '#7209B7' },
      minimal: { title: 'Pure Velocity Lines', description: 'Clean white tracks, stark directional arrows, and streamlined aerodynamic bodies', accentColor: '#E63946' },
    },
  },

  // =========================================================================
  // MW-05. My Architecture Universe
  // =========================================================================
  {
    id: 'world_29_architecture_universe',
    slug: 'world-architecture-universe',
    name: 'My Architecture Universe',
    subtitle: 'Classical Colonnades, Spires & Experimental Cantilevers',
    category: 'systems',
    categoryName: 'Architecture & Engineering',
    worldLevel: 'level1_major',
    baseType: 'floating_island',
    collection: 'collection_c_expansion',
    subcategories: ['Classical Doric Agora', 'Gothic Flying Buttresses', 'Brutalist Concrete Spire', 'Cantilever Glass Cube', 'Parametric Canopy'],
    theme: 'Architectural history, geometric structural forms, monumental stone colonnades, and modern glass cantilevers.',
    description:
      'A showcase continent of human structural ingenuity spanning an ancient Greco-Roman marble colonnade, a Gothic ribbed vaulted cathedral nave, a bold cantilever glass cube jutting into open air, and a soaring parametric twisting tower.',
    polyCount: 8900,
    dimensionRatio: '1 : 1 : 1.3',
    minestWorldType: 'WORLD_TYPE_ARCHITECTURE_UNIVERSE',
    assetFileRef: 'minest/worlds/architecture_universe_v1.glb',
    terrainSpecs: {
      shape: 'terraced',
      underbelly: 'Carved travertine stone foundation steps with exposed structural bedrock',
      waterFeatures: 'Reflective architecture basin mirroring columns and soaring arches',
      foliage: 'Formal Italian cypress columns and clipped boxwood geometric labyrinths',
      elevationLevels: 6,
    },
    palette: [
      { hex: '#ECE4DB', label: 'Travertine Marble', role: 'Classical Columns & Porticos' },
      { hex: '#4A5568', label: 'Basalt Slate', role: 'Cathedral Roofs & Plaza Pavement' },
      { hex: '#CBD5E0', label: 'Polished Concrete', role: 'Brutalist Cantilever Slabs' },
      { hex: '#63B3ED', label: 'Structural Glass', role: 'Curtain Walls & Skylights' },
      { hex: '#D69E2E', label: 'Gilded Capital', role: 'Corinthian Details & Spire Tips' },
    ],
    landmarks: [
      { id: 'mw05-lm1', name: 'The Master Colonnade Peristyle', description: 'Fluted marble pillars surrounding an open-air architectural drawing square', tag: 'Classical' },
      { id: 'mw05-lm2', name: 'The Cantilever Glass Pavilion', description: 'Defying gravity with an overhanging steel-truss glass observation deck', tag: 'Modern' },
      { id: 'mw05-lm3', name: 'Parametric Twisting Spire', description: 'Helical mathematical tower piercing clouds with spiraling facade fins', tag: 'Parametric' },
      { id: 'mw05-lm4', name: 'Gothic Buttress Cloister', description: 'Pointed arches, ribbed stone vaulting, and tranquil central water pool', tag: 'Gothic' },
    ],
    variants: {
      classic: { title: 'Architectural Masters', description: 'Warm travertine stone, blue architectural glass, and timeless bronze accents', accentColor: '#D69E2E' },
      fantasy: { title: 'Impossible Escher Dimensions', description: 'Endless staircases, floating archways, and inverted marble fountains', accentColor: '#805AD5' },
      minimal: { title: 'White Monoliths', description: 'Pure matte plaster geometric solids playing with sharp isometric shadow casts', accentColor: '#2D3748' },
    },
  },

  // =========================================================================
  // MW-06. My Entertainment Universe
  // =========================================================================
  {
    id: 'world_30_entertainment_universe',
    slug: 'world-entertainment-universe',
    name: 'My Entertainment Universe',
    subtitle: 'Theme Parks, Cinema Boulevards & Festival Stages',
    category: 'culture',
    categoryName: 'Entertainment & Gaming',
    worldLevel: 'level1_major',
    baseType: 'floating_island',
    collection: 'collection_c_expansion',
    subcategories: ['Roller Coaster Loops', 'Neon Cinema Palace', 'Concert Amphitheater', 'Esports Gaming Arena', 'Carnival Ferris Wheel'],
    theme: 'Joyful spectacles, thrill rides, glowing cinema marquees, open-air music festival stages, and arcade lights.',
    description:
      'A thrilling entertainment paradise anchored by a red looping roller coaster soaring over canyon ravines, a classic Art Deco cinema boulevard with neon signage, an open-air music amphitheater with lighting towers, and a giant ferris wheel.',
    polyCount: 8550,
    dimensionRatio: '1 : 1 : 1.25',
    minestWorldType: 'WORLD_TYPE_ENTERTAINMENT_UNIVERSE',
    assetFileRef: 'minest/worlds/entertainment_universe_v1.glb',
    terrainSpecs: {
      shape: 'irregular',
      underbelly: 'Funfair stepped rocky bluffs with festival banners and lighting rig pylons',
      waterFeatures: 'Carnival log flume splash basin and illuminated central water fountains',
      foliage: 'Cheerful flowering cherry trees, festive topiary, and candy-colored shrubbery',
      elevationLevels: 5,
    },
    palette: [
      { hex: '#FF0054', label: 'Carnival Neon Magenta', role: 'Roller Coaster Track & Signs' },
      { hex: '#7209B7', label: 'Palace Purple', role: 'Cinema Facade & Arena Domes' },
      { hex: '#4CC9F0', label: 'Laser Cyan', role: 'Stage Beams & Water Splash' },
      { hex: '#FFBE0B', label: 'Marquee Gold', role: 'Ferris Wheel Gondolas & Bulbs' },
      { hex: '#3A0CA3', label: 'Midnight Stage', role: 'Sound Shell & Flooring' },
    ],
    landmarks: [
      { id: 'mw06-lm1', name: 'Infinity Coaster Loop', description: 'Dual-corkscrew roller coaster track winding through rocky arches', tag: 'Ride' },
      { id: 'mw06-lm2', name: 'The Grand Marquee Cinema', description: 'Art Deco theater facade with tiered neon towers and red carpet plaza', tag: 'Cinema' },
      { id: 'mw06-lm3', name: 'Star-Stage Amphitheater', description: 'Curved acoustic sound shell facing a grass bowl with giant LED speaker towers', tag: 'Concert' },
      { id: 'mw06-lm4', name: 'Starlight Ferris Wheel', description: 'Rotating spoke wheel with colorful gondolas overlooking the world horizon', tag: 'Carnival' },
    ],
    variants: {
      classic: { title: 'Neon Magic Park', description: 'Vibrant amusement colors, glittering marquee lamps, and red track loops', accentColor: '#FF0054' },
      fantasy: { title: 'Wonderland Carnival', description: 'Bioluminescent mushroom carousels and floating aurora roller tracks', accentColor: '#B5179E' },
      minimal: { title: 'Modernist Fair', description: 'Monochrome wireframe ferris wheel and clean architectural stage pavilions', accentColor: '#7209B7' },
    },
  },

  // =========================================================================
  // MW-07. My Business Universe
  // =========================================================================
  {
    id: 'world_31_business_universe',
    slug: 'world-business-universe',
    name: 'My Business Universe',
    subtitle: 'Stock Exchanges, Trade Towers & Commercial Plazas',
    category: 'systems',
    categoryName: 'Business & Commerce',
    worldLevel: 'level1_major',
    baseType: 'floating_island',
    collection: 'collection_c_expansion',
    subcategories: ['Stock Exchange Floor', 'Twin Corporate Towers', 'Banking Vault Pavilion', 'Global Trade Plaza', 'Conference Center'],
    theme: 'Finance, global commerce, corporate headquarters, trade markets, and high-rise commercial energy.',
    description:
      'A bustling global financial capital featuring classical granite stock exchange steps, twin modern mirrored glass skyscrapers, a sunken corporate fountain plaza, and an international conference center with a global trade ticker ring.',
    polyCount: 8100,
    dimensionRatio: '1 : 1 : 1.35',
    minestWorldType: 'WORLD_TYPE_BUSINESS_UNIVERSE',
    assetFileRef: 'minest/worlds/business_universe_v1.glb',
    terrainSpecs: {
      shape: 'terraced',
      underbelly: 'Chiseled granite bedrock foundation slabs reinforced with steel beams',
      waterFeatures: 'Linear civic fountain channel with water jets and stone footbridges',
      foliage: 'Neat grid-planted ginkgo trees and formal corporate plaza planters',
      elevationLevels: 6,
    },
    palette: [
      { hex: '#1E293B', label: 'Executive Slate', role: 'Skyscraper Mullions & Roadways' },
      { hex: '#0EA5E9', label: 'Corporate Cerulean', role: 'Reflective Glass Facades' },
      { hex: '#10B981', label: 'Market Bull Green', role: 'Ticker Tape & Terrace Lawns' },
      { hex: '#F8FAFC', label: 'Granite White', role: 'Stock Exchange Columns' },
      { hex: '#F59E0B', label: 'Treasury Gold', role: 'Vault Doors & Clock Accents' },
    ],
    landmarks: [
      { id: 'mw07-lm1', name: 'The Sovereign Stock Exchange', description: 'Monumental neoclassical portico with pediment relief and broad front steps', tag: 'Finance' },
      { id: 'mw07-lm2', name: 'Twin Enterprise Towers', description: 'Dual glass skyscrapers connected by a skybridge suspended over plaza', tag: 'Skyscrapers' },
      { id: 'mw07-lm3', name: 'World Trade Ring Plaza', description: 'Circular stepped courtyard with a glowing 360-degree market ticker tape', tag: 'Plaza' },
      { id: 'mw07-lm4', name: 'Grand Central Bank Vault', description: 'Brutalist fortress building with a colossal round brass vault wheel facade', tag: 'Banking' },
    ],
    variants: {
      classic: { title: 'Wall Street Capital', description: 'Deep slate blue glass, classical granite porticos, and golden brass trims', accentColor: '#0EA5E9' },
      fantasy: { title: 'Aether Trading Nexus', description: 'Floating crystal currency vaults and glowing golden credit leylines', accentColor: '#10B981' },
      minimal: { title: 'Monochrome Finance', description: 'Pure black glass monoliths with razor-thin white floor plate accents', accentColor: '#1E293B' },
    },
  },

  // =========================================================================
  // MW-08. My Hobbies Universe
  // =========================================================================
  {
    id: 'world_32_hobbies_universe',
    slug: 'world-hobbies-universe',
    name: 'My Hobbies Universe',
    subtitle: 'Craft Workshops, Maker Garages & Collector Studios',
    category: 'personal',
    categoryName: 'Hobbies & Crafts',
    worldLevel: 'level1_major',
    baseType: 'floating_island',
    collection: 'collection_c_expansion',
    subcategories: ['Maker Workshop', 'Pottery & Ceramic Kiln', 'Model Crafting Bay', 'Collector Gallery', 'Stargazing Hill'],
    theme: 'Personal craft passions, woodworking benches, pottery wheels, miniature painting studios, and astronomical hobby hill.',
    description:
      'A warm creative continent dedicated to passionate hobbies, featuring a rustic timber maker barn with power tools, a ceramic pottery studio with brick kiln, an intricate model craft shed, and a stargazing hill with an amateur telescope observatory.',
    polyCount: 7950,
    dimensionRatio: '1 : 1 : 1.15',
    minestWorldType: 'WORLD_TYPE_HOBBIES_UNIVERSE',
    assetFileRef: 'minest/worlds/hobbies_universe_v1.glb',
    terrainSpecs: {
      shape: 'irregular',
      underbelly: 'Natural mossy sandstone layers with wooden tool rack alcoves and roots',
      waterFeatures: 'Cozy stone water trough and pond for clay rinsing and garden irrigation',
      foliage: 'Flowering fruit trees, craft wicker willow groves, and wild lavender',
      elevationLevels: 4,
    },
    palette: [
      { hex: '#8B5A2B', label: 'Warm Cedar', role: 'Maker Barn Timber & Workbenches' },
      { hex: '#D97706', label: 'Kiln Amber', role: 'Brick Ovens & Warm Light' },
      { hex: '#4D7C0F', label: 'Country Moss', role: 'Terrace Grass & Willow Trees' },
      { hex: '#0284C7', label: 'Cobalt Glaze', role: 'Finished Ceramics & Toolboxes' },
      { hex: '#FDE68A', label: 'Pine Shavings', role: 'Sawdust & Parchment Blueprints' },
    ],
    landmarks: [
      { id: 'mw08-lm1', name: 'The Timber Maker Barn', description: 'Spacious high-rafter woodworking shop with open sliding barn doors', tag: 'Workshop' },
      { id: 'mw08-lm2', name: 'Artisan Ceramic Kiln', description: 'Cone-shaped red brick wood-fired pottery kiln with drying shelves', tag: 'Ceramics' },
      { id: 'mw08-lm3', name: 'Hobby Stargazer Hill', description: 'Grassy summit with a revolving brass amateur refractor telescope dome', tag: 'Astronomy' },
      { id: 'mw08-lm4', name: 'Model Craft Studio', description: 'Cozy bay window atelier lined with miniature ships, dioramas, and paint racks', tag: 'Modeling' },
    ],
    variants: {
      classic: { title: 'Artisan Haven', description: 'Warm timber wood, orange terracotta kilns, and lush garden greenery', accentColor: '#D97706' },
      fantasy: { title: 'Alchemist Tinkerer Vale', description: 'Copper conduits, bubbling potion jars, and levitating clockwork gears', accentColor: '#9333EA' },
      minimal: { title: 'Scandinavian Studio', description: 'Bleached birch tables, clean white pegboards, and organized ceramic vessels', accentColor: '#4D7C0F' },
    },
  },

  // =========================================================================
  // MW-09. My Agriculture Universe
  // =========================================================================
  {
    id: 'world_33_agriculture_universe',
    slug: 'world-agriculture-universe',
    name: 'My Agriculture Universe',
    subtitle: 'Terraced Farmlands, Silos, Orchards & Windmills',
    category: 'nature',
    categoryName: 'Agriculture & Farming',
    worldLevel: 'level1_major',
    baseType: 'floating_island',
    collection: 'collection_c_expansion',
    subcategories: ['Golden Wheat Fields', 'Terraced Rice Paddies', 'Dutch Grain Windmill', 'Modern Grain Silos', 'Apple & Citrus Orchards'],
    theme: 'Agricultural abundance, food cultivation, undulating crop contours, classic windmills, and modern farm silos.',
    description:
      'A fertile agricultural continent rich in contoured golden wheat fields, stepped flooded rice paddy terraces, a four-vane Dutch timber windmill, a silver cylindrical silo complex with red tractor barn, and flowering fruit orchards.',
    polyCount: 8350,
    dimensionRatio: '1 : 1 : 1.1',
    minestWorldType: 'WORLD_TYPE_AGRICULTURE_UNIVERSE',
    assetFileRef: 'minest/worlds/agriculture_universe_v1.glb',
    terrainSpecs: {
      shape: 'terraced',
      underbelly: 'Rich loam topsoil over stratified sedimentary river clay and limestone',
      waterFeatures: 'Irrigation ditch canal system feeding terraced paddy water gates',
      foliage: 'Golden wheat sheaves, mature apple trees heavy with fruit, and field hedgerows',
      elevationLevels: 5,
    },
    palette: [
      { hex: '#EAB308', label: 'Golden Wheat', role: 'Harvest Fields & Grain Stacks' },
      { hex: '#65A30D', label: 'Paddy Green', role: 'Terraced Crops & Orchard Canopies' },
      { hex: '#78350F', label: 'Rich Loam', role: 'Tilled Earth & Barn Timber' },
      { hex: '#DC2626', label: 'Classic Barn Red', role: 'Tractor Shed & Silo Trim' },
      { hex: '#E2E8F0', label: 'Galvanized Silver', role: 'Corrugated Steel Silos' },
      { hex: '#38BDF8', label: 'Irrigation Blue', role: 'Paddy Water Channels' },
    ],
    landmarks: [
      { id: 'mw09-lm1', name: 'The Four-Vane Dutch Windmill', description: 'Octagonal stone windmill with turning canvas blades grinding wheat into flour', tag: 'Windmill' },
      { id: 'mw09-lm2', name: 'Stepped Water Paddy Terraces', description: 'Curved reflective water basins stepping down the hillside with green shoots', tag: 'Paddy' },
      { id: 'mw09-lm3', name: 'Grain Silo & Red Barn Complex', description: 'Twin corrugated steel storage towers alongside a gambrel-roof barn', tag: 'Silo' },
      { id: 'mw09-lm4', name: 'The Sunlit Apple Orchard', description: 'Neat grid rows of fruit trees with wooden harvest crates and a cider press', tag: 'Orchard' },
    ],
    variants: {
      classic: { title: 'Golden Harvest', description: 'Warm amber wheat fields, red timber barns, and white windmill blades', accentColor: '#EAB308' },
      fantasy: { title: 'Bountiful Spirit Grove', description: 'Glowing fruit lanterns, giant cornucopias, and rainbow crop circles', accentColor: '#22C55E' },
      minimal: { title: 'Contour Agronomy', description: 'Abstract topographic green and yellow terraces with crisp laser edges', accentColor: '#65A30D' },
    },
  },

  // =========================================================================
  // MW-10. My Energy Universe
  // =========================================================================
  {
    id: 'world_34_energy_universe',
    slug: 'world-energy-universe',
    name: 'My Energy Universe',
    subtitle: 'Wind Turbines, Solar Fields & Hydroelectric Dams',
    category: 'systems',
    categoryName: 'Energy & Power',
    worldLevel: 'level1_major',
    baseType: 'floating_island',
    collection: 'collection_c_expansion',
    subcategories: ['Wind Turbine Ridge', 'Solar Photovoltaic Array', 'Hydroelectric Concrete Dam', 'Geothermal Steam Plant', 'High-Voltage Grid'],
    theme: 'Clean power generation, futuristic energy grids, spinning wind turbines, gleaming solar arrays, and roaring hydro waterfalls.',
    description:
      'A powerful clean energy continent featuring a ridge of rotating tri-blade wind turbines, a tiered hillside of blue photovoltaic solar panels, a massive arched concrete hydroelectric dam with spillway torrent, and glowing transformer substations.',
    polyCount: 8700,
    dimensionRatio: '1 : 1 : 1.2',
    minestWorldType: 'WORLD_TYPE_ENERGY_UNIVERSE',
    assetFileRef: 'minest/worlds/energy_universe_v1.glb',
    terrainSpecs: {
      shape: 'canyon',
      underbelly: 'Deep basalt canyon gorge supporting concrete dam abutments and cooling pipes',
      waterFeatures: 'High mountain reservoir holding blue water, spilling through dam gates into canyon river',
      foliage: 'Sparse alpine grasses and durable mountain shrubs along turbine ridges',
      elevationLevels: 6,
    },
    palette: [
      { hex: '#0284C7', label: 'Hydro Blue', role: 'Dam Reservoir & Solar Cells' },
      { hex: '#F8FAFC', label: 'Turbine White', role: 'Wind Turbine Blades & Towers' },
      { hex: '#64748B', label: 'Dam Concrete', role: 'Hydro Spillway & Pylons' },
      { hex: '#EAB308', label: 'High Voltage Amber', role: 'Substation Transformers & Grid Warn' },
      { hex: '#06B6D4', label: 'Clean Energy Cyan', role: 'Glowing Leyline Conduits' },
      { hex: '#334155', label: 'Basalt Canyon', role: 'Rocky River Gorge' },
    ],
    landmarks: [
      { id: 'mw10-lm1', name: 'The Megawatt Wind Turbine Ridge', description: 'Trio of tall white tri-blade wind turbines catching the high-altitude airstream', tag: 'Wind' },
      { id: 'mw10-lm2', name: 'Great Arch Hydroelectric Dam', description: 'Soaring curved concrete dam wall holding a reservoir with frothing spillway gates', tag: 'Hydro' },
      { id: 'mw10-lm3', name: 'Sun-Tracking Solar Array', description: 'Tiered blue photovoltaic panel banks following the sun along the south slope', tag: 'Solar' },
      { id: 'mw10-lm4', name: 'Substation Transformer Terminal', description: 'Lattice steel pylons and ceramic insulator arrays routing high-voltage power', tag: 'Grid' },
    ],
    variants: {
      classic: { title: 'Clean Power Grid', description: 'Pure white turbines, deep blue solar arrays, and weathered grey concrete dam', accentColor: '#0284C7' },
      fantasy: { title: 'Plasma Core Nexus', description: 'Floating fusion reactor spheres and crackling violet lightning capacitors', accentColor: '#8B5CF6' },
      minimal: { title: 'Kinetic Monolith', description: 'Geometric white pillars, silent spinning rotors, and clean water surfaces', accentColor: '#06B6D4' },
    },
  },
];
