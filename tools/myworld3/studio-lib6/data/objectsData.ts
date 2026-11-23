import { IslandMetadata } from '../types/island';

export const OBJECTS_DATA: IslandMetadata[] = [
  // =========================================================================
  // 01. Open Book (KEEP) — Books, Knowledge, Notes
  // =========================================================================
  {
    id: 'object_01_open_book',
    slug: 'object-open-book',
    name: 'Open Book',
    subtitle: 'Books, Knowledge & Notes',
    category: 'knowledge',
    categoryName: 'Knowledge Objects',
    worldLevel: 'level3_object',
    baseType: 'standalone_object',
    collection: 'objects_knowledge',
    subcategories: ['Reading Lists', 'Literature', 'Book Notes', 'Study Guides', 'Manuscripts'],
    theme: 'Written words, reading lists, book collections, literature, and study notes.',
    description:
      'An elegant open hardcover book featuring curved layered parchment pages, embossed leather spine ribs, visible sewing headband, and a crimson ribbon bookmark draped across the text spread.',
    polyCount: 3420,
    dimensionRatio: '1.2:1:0.35',
    minestWorldType: 'StandaloneObject',
    assetFileRef: 'object_knowledge_open_book_v1.glb',
    terrainSpecs: {
      shape: 'circular',
      underbelly: 'None — Pure Standalone Object (无底座/无台座，纯粹单体)',
      waterFeatures: 'None',
      foliage: 'None',
      elevationLevels: 1,
    },
    palette: [
      { hex: '#8D6E63', label: 'Vintage Leather', role: 'Cover & Spine' },
      { hex: '#FFF8E7', label: 'Parchment Ivory', role: 'Curved Pages' },
      { hex: '#C62828', label: 'Ribbon Crimson', role: 'Bookmark Ribbon' },
      { hex: '#D4AF37', label: 'Gilt Edge', role: 'Top Page Gilding' },
      { hex: '#37474F', label: 'Printed Type', role: 'Text Block Texture' },
    ],
    landmarks: [
      { id: 'obk-01', name: 'Curved Page Spread', description: 'Gracefully arched open pages showing paper thickness', tag: 'Pages' },
      { id: 'obk-02', name: 'Ribbon Marker', description: 'Flowing silk bookmark with triangular cut tip', tag: 'Detail' },
      { id: 'obk-03', name: 'Embossed Spine', description: 'Ribbed leather spine with gilded foil bands', tag: 'Binding' },
    ],
    variants: {
      classic: { title: 'Leather Tome', description: 'Antique brown morocco leather with cream leaves', accentColor: '#8D6E63' },
      fantasy: { title: 'Spellbook of Arcana', description: 'Midnight blue cover with glowing rune foil print', accentColor: '#7E57C2' },
      minimal: { title: 'Modern Monograph', description: 'Clean linen-bound white volume with crisp edges', accentColor: '#455A64' },
    },
  },

  // =========================================================================
  // 02. Globe (RENAME) — Geography, Countries, Travel
  // =========================================================================
  {
    id: 'object_02_globe',
    slug: 'object-globe',
    name: 'Globe',
    subtitle: 'Geography, Countries & Travel',
    category: 'knowledge',
    categoryName: 'Knowledge Objects',
    worldLevel: 'level3_object',
    baseType: 'standalone_object',
    collection: 'objects_knowledge',
    subcategories: ['World Countries', 'Geography', 'Travel Wishlists', 'Continents', 'Cartography'],
    theme: 'World geography, countries, travel destinations, continents, and global curiosity.',
    description:
      'A miniature terrestrial globe sphere tilted at an authentic 23.5-degree axial angle, mounted on a curved brass meridian semicircle and anchored by a turned walnut wooden pedestal base.',
    polyCount: 3840,
    dimensionRatio: '1:1:1.35',
    minestWorldType: 'StandaloneObject',
    assetFileRef: 'object_knowledge_globe_v1.glb',
    terrainSpecs: {
      shape: 'circular',
      underbelly: 'None — Pure Standalone Object (无底座/无台座，纯粹单体)',
      waterFeatures: 'None',
      foliage: 'None',
      elevationLevels: 1,
    },
    palette: [
      { hex: '#1E88E5', label: 'Ocean Blue', role: 'Water Sphere' },
      { hex: '#43A047', label: 'Continent Green', role: 'Landmass Facets' },
      { hex: '#D4AF37', label: 'Polished Brass', role: 'Meridian Ring & Axis' },
      { hex: '#5D4037', label: 'Turned Walnut', role: 'Pedestal Stand' },
      { hex: '#FFF9C4', label: 'Desert Ochre', role: 'Arid Biome Regions' },
    ],
    landmarks: [
      { id: 'glb-01', name: 'Axial Meridian Arc', description: 'Graduated brass ring holding the tilted planetary sphere', tag: 'Hardware' },
      { id: 'glb-02', name: 'Faceted Continents', description: 'Stylized low-poly landmasses mapped across sphere', tag: 'Geography' },
      { id: 'glb-03', name: 'Turned Wood Base', description: 'Heavy stepped pedestal offering sturdy tabletop balance', tag: 'Base' },
    ],
    variants: {
      classic: { title: 'Explorer Antique', description: 'Sepia antique parchment oceans with brass hardware', accentColor: '#D4AF37' },
      fantasy: { title: 'Celestial Orb', description: 'Deep purple sphere with shimmering constellation lines', accentColor: '#5E35B1' },
      minimal: { title: 'Nordic Minimal Globe', description: 'Monochrome slate sphere with matte black steel stand', accentColor: '#37474F' },
    },
  },

  // =========================================================================
  // 03. Microscope (RENAME) — Science, Research
  // =========================================================================
  {
    id: 'object_03_microscope',
    slug: 'object-microscope',
    name: 'Microscope',
    subtitle: 'Science & Research',
    category: 'knowledge',
    categoryName: 'Knowledge Objects',
    worldLevel: 'level3_object',
    baseType: 'standalone_object',
    collection: 'objects_knowledge',
    subcategories: ['Scientific Research', 'Lab Experiments', 'Biology & Chemistry', 'Inquiry & Facts', 'Discoveries'],
    theme: 'Scientific inquiry, empirical research, laboratory studies, and micro discoveries.',
    description:
      'A stylized laboratory microscope featuring an angled eyepiece ocular, triple revolving objective turret, specimen stage with clips, coarse focus knurled knobs, and a heavy horseshoe foot.',
    polyCount: 4120,
    dimensionRatio: '0.9:1:1.4',
    minestWorldType: 'StandaloneObject',
    assetFileRef: 'object_knowledge_microscope_v1.glb',
    terrainSpecs: {
      shape: 'circular',
      underbelly: 'None — Pure Standalone Object (无底座/无台座，纯粹单体)',
      waterFeatures: 'None',
      foliage: 'None',
      elevationLevels: 1,
    },
    palette: [
      { hex: '#212121', label: 'Enamel Black', role: 'Horseshoe Base & Body' },
      { hex: '#CFD8DC', label: 'Polished Chrome', role: 'Drawtube & Knurled Dials' },
      { hex: '#D4AF37', label: 'Brass Turret', role: 'Objective Lens Housings' },
      { hex: '#80DEEA', label: 'Slide Glass', role: 'Glass Specimen Slide' },
      { hex: '#455A64', label: 'Stage Black', role: 'Specimen Stage & Clips' },
    ],
    landmarks: [
      { id: 'mic-01', name: 'Revolving Objective Turret', description: 'Triple objective lenses for varying magnifications', tag: 'Optics' },
      { id: 'mic-02', name: 'Specimen Stage', description: 'Flat mechanical stage with dual slide spring clips', tag: 'Stage' },
      { id: 'mic-03', name: 'Knurled Focus Dials', description: 'Chunky coarse and fine adjustment wheels', tag: 'Mechanics' },
    ],
    variants: {
      classic: { title: 'Vintage Brass Scope', description: 'Polished brass and black japanned enamel finish', accentColor: '#D4AF37' },
      fantasy: { title: 'Aether Lens', description: 'Translucent crystal optics with glowing alchemical core', accentColor: '#00E5FF' },
      minimal: { title: 'Clinical Precision', description: 'Matte surgical white and brushed titanium finish', accentColor: '#78909C' },
    },
  },

  // =========================================================================
  // 04. Hourglass (KEEP) — History, Time, Memories
  // =========================================================================
  {
    id: 'object_04_hourglass',
    slug: 'object-hourglass',
    name: 'Hourglass',
    subtitle: 'History, Time & Memories',
    category: 'knowledge',
    categoryName: 'Knowledge Objects',
    worldLevel: 'level3_object',
    baseType: 'standalone_object',
    collection: 'objects_knowledge',
    subcategories: ['History Timelines', 'Time Tracking', 'Focus Sessions', 'Memory Intervals', 'Moments'],
    theme: 'History, passage of time, deliberate focus intervals, and enduring memories.',
    description:
      'A classic hourglass with blown glass bulbs meeting at a narrow constriction, trickling golden silica sand into a heaped cone below, framed by three fluted wooden pillars and circular endplates.',
    polyCount: 3680,
    dimensionRatio: '0.8:0.8:1.3',
    minestWorldType: 'StandaloneObject',
    assetFileRef: 'object_knowledge_hourglass_v1.glb',
    terrainSpecs: {
      shape: 'circular',
      underbelly: 'None — Pure Standalone Object (无底座/无台座，纯粹单体)',
      waterFeatures: 'None',
      foliage: 'None',
      elevationLevels: 1,
    },
    palette: [
      { hex: '#FFCA28', label: 'Golden Sand', role: 'Flowing Grains & Heap' },
      { hex: '#E1F5FE', label: 'Blown Glass', role: 'Hourglass Bulbs' },
      { hex: '#5D4037', label: 'Turned Cherrywood', role: 'Endplates & Columns' },
      { hex: '#D7CCC8', label: 'Polished Brass', role: 'Endplate Fasteners' },
      { hex: '#8D6E63', label: 'Timber Shading', role: 'Frame Facets' },
    ],
    landmarks: [
      { id: 'hg-01', name: 'Flowing Silica Stream', description: 'Suspended dynamic trickle of sand crossing the neck', tag: 'Sand' },
      { id: 'hg-02', name: 'Sand Cones', description: 'Depleting upper reservoir and growing lower apex mound', tag: 'Geometry' },
      { id: 'hg-03', name: 'Tri-Pillar Frame', description: 'Turned wooden spindles protecting the fragile glass', tag: 'Frame' },
    ],
    variants: {
      classic: { title: 'Merchant Hourglass', description: 'Turned walnut wood frame with golden beach sand', accentColor: '#FFCA28' },
      fantasy: { title: 'Chrono Relic', description: 'Ornate obsidian brackets holding glowing stardust', accentColor: '#BA68C8' },
      minimal: { title: 'Mono Glass Tube', description: 'Seamless borosilicate glass with jet black magnetic sand', accentColor: '#263238' },
    },
  },

  // =========================================================================
  // 05. Film Reel (KEEP) — Movies, TV, Video
  // =========================================================================
  {
    id: 'object_05_film_reel',
    slug: 'object-film-reel',
    name: 'Film Reel',
    subtitle: 'Movies, TV & Video',
    category: 'culture',
    categoryName: 'Culture Objects',
    worldLevel: 'level3_object',
    baseType: 'standalone_object',
    collection: 'objects_culture',
    subcategories: ['Movie Watchlists', 'TV Series', 'Favorite Films', 'Cinema Classics', 'Video Archives'],
    theme: 'Motion pictures, movie watchlists, film directing, television, and cinematic memories.',
    description:
      'A classic vintage 35mm cinema film reel with stamped aluminum spoke wheel cutouts, wound dark brown film stock, and a curling film tail with visible edge sprocket perforations.',
    polyCount: 3740,
    dimensionRatio: '1.1:0.35:1.1',
    minestWorldType: 'StandaloneObject',
    assetFileRef: 'object_culture_film_reel_v1.glb',
    terrainSpecs: {
      shape: 'circular',
      underbelly: 'None — Pure Standalone Object (无底座/无台座，纯粹单体)',
      waterFeatures: 'None',
      foliage: 'None',
      elevationLevels: 1,
    },
    palette: [
      { hex: '#B0BEC5', label: 'Spoke Aluminum', role: 'Reel Flanges & Spokes' },
      { hex: '#3E2723', label: 'Celluloid Brown', role: 'Wound Film Base' },
      { hex: '#212121', label: 'Sprocket Shadow', role: 'Perforation Cuts' },
      { hex: '#ECEFF1', label: 'Center Hub', role: 'Spindle Core' },
      { hex: '#FF7043', label: 'Leader Strip', role: 'Film Leader Accent' },
    ],
    landmarks: [
      { id: 'flm-01', name: 'Stamped Spoke Wheels', description: 'Circular wheel with six beveled teardrop cutouts', tag: 'Metalwork' },
      { id: 'flm-02', name: 'Celluloid Ribbon', description: 'Unspooled leader strip curling naturally alongside the reel', tag: 'Film' },
      { id: 'flm-03', name: 'Perforation Holes', description: 'Regular rectangular drive sprocket cuts along edge', tag: 'Detail' },
    ],
    variants: {
      classic: { title: 'Archive 35mm', description: 'Weathered aluminum reel with brown amber celluloid', accentColor: '#B0BEC5' },
      fantasy: { title: 'Memory Spool', description: 'Silver filigree reel holding glowing golden film memories', accentColor: '#FFD54F' },
      minimal: { title: 'Modern Core', description: 'Solid anodized graphite disc with crisp graphic slots', accentColor: '#37474F' },
    },
  },

  // =========================================================================
  // 06. Vinyl Record (KEEP) — Music, Albums, Songs
  // =========================================================================
  {
    id: 'object_06_vinyl_record',
    slug: 'object-vinyl-record',
    name: 'Vinyl Record',
    subtitle: 'Music, Albums & Songs',
    category: 'culture',
    categoryName: 'Culture Objects',
    worldLevel: 'level3_object',
    baseType: 'standalone_object',
    collection: 'objects_culture',
    subcategories: ['Album Collections', 'Playlists', 'Favorite Songs', 'Artists & Bands', 'Audio Tracks'],
    theme: 'Music albums, vinyl records, songs, listening lists, and audiophile collections.',
    description:
      'A 12-inch vinyl LP record with microgroove sheen reflections, center paper label with spindle hole, propped dynamically against an illustrated cardboard album jacket sleeve.',
    polyCount: 3260,
    dimensionRatio: '1.1:0.4:1.1',
    minestWorldType: 'StandaloneObject',
    assetFileRef: 'object_culture_vinyl_record_v1.glb',
    terrainSpecs: {
      shape: 'circular',
      underbelly: 'None — Pure Standalone Object (无底座/无台座，纯粹单体)',
      waterFeatures: 'None',
      foliage: 'None',
      elevationLevels: 1,
    },
    palette: [
      { hex: '#121212', label: 'Grooved Vinyl', role: 'Disc Surface' },
      { hex: '#E53935', label: 'Label Crimson', role: 'Center Label Disc' },
      { hex: '#FFF9C4', label: 'Vintage Cardboard', role: 'Album Sleeve' },
      { hex: '#1E88E5', label: 'Sleeve Art', role: 'Cover Artwork Graphic' },
      { hex: '#CFD8DC', label: 'Groove Sheen', role: 'Radial Light Reflection' },
    ],
    landmarks: [
      { id: 'rec-01', name: 'Microgroove Sheen', description: 'Concentric audio sound track grooves catching studio light', tag: 'Audio' },
      { id: 'rec-02', name: 'Center Spindle Label', description: 'Circular scarlet label with side A track markings', tag: 'Label' },
      { id: 'rec-03', name: 'Tilted Jacket Sleeve', description: 'Square cardboard album sleeve propped behind disc', tag: 'Sleeve' },
    ],
    variants: {
      classic: { title: 'Vintage 33 RPM', description: 'Black vinyl with scarlet label and weathered cardboard jacket', accentColor: '#E53935' },
      fantasy: { title: 'Cosmic Wax', description: 'Translucent nebula-colored vinyl with gold foil label', accentColor: '#7E57C2' },
      minimal: { title: 'Minimalist Pressing', description: 'Monochrome slate vinyl in a clean geometric white sleeve', accentColor: '#455A64' },
    },
  },

  // =========================================================================
  // 07. Artist Palette (KEEP) — Art, Design, Creativity
  // =========================================================================
  {
    id: 'object_07_artist_palette',
    slug: 'object-artist-palette',
    name: 'Artist Palette',
    subtitle: 'Art, Design & Creativity',
    category: 'culture',
    categoryName: 'Culture Objects',
    worldLevel: 'level3_object',
    baseType: 'standalone_object',
    collection: 'objects_culture',
    subcategories: ['Artworks & Design', 'Color Palettes', 'Creative Projects', 'Illustrations', 'Crafts'],
    theme: 'Fine art, graphic design, painting, artistic expression, and color inspiration.',
    description:
      'A classic kidney-shaped wooden painter’s palette with thumb hole, dollops of vibrant oil paint (ultramarine, cadmium yellow, vermilion, viridian, violet), and a tapered hog-bristle filbert paintbrush.',
    polyCount: 3580,
    dimensionRatio: '1.2:0.3:0.9',
    minestWorldType: 'StandaloneObject',
    assetFileRef: 'object_culture_artist_palette_v1.glb',
    terrainSpecs: {
      shape: 'circular',
      underbelly: 'None — Pure Standalone Object (无底座/无台座，纯粹单体)',
      waterFeatures: 'None',
      foliage: 'None',
      elevationLevels: 1,
    },
    palette: [
      { hex: '#D7CCC8', label: 'Birch Wood', role: 'Palette Board' },
      { hex: '#E53935', label: 'Cadmium Red', role: 'Paint Dollop' },
      { hex: '#FDD835', label: 'Lemon Yellow', role: 'Paint Dollop' },
      { hex: '#1E88E5', label: 'Cobalt Blue', role: 'Paint Dollop' },
      { hex: '#43A047', label: 'Viridian Green', role: 'Paint Dollop' },
    ],
    landmarks: [
      { id: 'pal-01', name: 'Curved Thumb Hole', description: 'Ergonomic grip cutout with rounded chamfer edge', tag: 'Woodwork' },
      { id: 'pal-02', name: 'Paint Dollop Arc', description: 'Five thick raised paint impasto blobs along the curve', tag: 'Pigment' },
      { id: 'pal-03', name: 'Filbert Paintbrush', description: 'Tapered wooden handle with metal ferrule resting on edge', tag: 'Tool' },
    ],
    variants: {
      classic: { title: 'Studio Walnut', description: 'Varnished birch palette with rich oil paints and brush', accentColor: '#E53935' },
      fantasy: { title: 'Alchemist Palette', description: 'Iridescent pearl surface with glowing luminescent paints', accentColor: '#AB47BC' },
      minimal: { title: 'Ceramic Wells', description: 'Crisp white porcelain palette with clean pigment wells', accentColor: '#1E88E5' },
    },
  },

  // =========================================================================
  // 08. Game Controller (KEEP) — Games, Entertainment
  // =========================================================================
  {
    id: 'object_08_game_controller',
    slug: 'object-game-controller',
    name: 'Game Controller',
    subtitle: 'Games & Entertainment',
    category: 'culture',
    categoryName: 'Culture Objects',
    worldLevel: 'level3_object',
    baseType: 'standalone_object',
    collection: 'objects_culture',
    subcategories: ['Video Games', 'Backlog & Wishlists', 'Board Games', 'Esports & Streams', 'Arcades'],
    theme: 'Video games, board games, digital entertainment, interactive play, and gaming backlogs.',
    description:
      'A sleek arcade console gamepad featuring ergonomic sculpted grips, an iconic cross directional pad, four brightly colored face buttons, dual analog thumbsticks, and shoulder bumpers.',
    polyCount: 3920,
    dimensionRatio: '1.2:0.5:0.8',
    minestWorldType: 'StandaloneObject',
    assetFileRef: 'object_culture_game_controller_v1.glb',
    terrainSpecs: {
      shape: 'circular',
      underbelly: 'None — Pure Standalone Object (无底座/无台座，纯粹单体)',
      waterFeatures: 'None',
      foliage: 'None',
      elevationLevels: 1,
    },
    palette: [
      { hex: '#263238', label: 'Matte Charcoal', role: 'Gamepad Body Shell' },
      { hex: '#E53935', label: 'Button Coral', role: 'B Button' },
      { hex: '#43A047', label: 'Button Emerald', role: 'A Button' },
      { hex: '#1E88E5', label: 'Button Azure', role: 'X Button' },
      { hex: '#FFB300', label: 'Button Gold', role: 'Y Button' },
    ],
    landmarks: [
      { id: 'pad-01', name: 'Cross Directional Pad', description: 'Four-way tactile D-pad with recessed center thumb pivot', tag: 'Control' },
      { id: 'pad-02', name: 'Dual Thumbsticks', description: 'Textured rubberized top caps on domed pivot bases', tag: 'Analog' },
      { id: 'pad-03', name: 'Colored Action Cluster', description: 'Four vibrant primary colored action face buttons', tag: 'Buttons' },
    ],
    variants: {
      classic: { title: 'Retro Console', description: 'Dark slate body with classic multicolor arcade buttons', accentColor: '#1E88E5' },
      fantasy: { title: 'Cyberpunk Deck', description: 'Translucent neon casing with glowing LED traces', accentColor: '#00E676' },
      minimal: { title: 'Glacier Pure', description: 'Monochrome arctic white with subtle embossed symbols', accentColor: '#ECEFF1' },
    },
  },

  // =========================================================================
  // 09. Trophy (REPLACE - New Object) — Sports, Achievements, Awards
  // =========================================================================
  {
    id: 'object_09_trophy',
    slug: 'object-trophy',
    name: 'Trophy',
    subtitle: 'Sports, Achievements & Awards',
    category: 'culture',
    categoryName: 'Culture Objects',
    worldLevel: 'level3_object',
    baseType: 'standalone_object',
    collection: 'objects_culture',
    subcategories: ['Championships', 'Personal Bests', 'Milestone Awards', 'Tournaments', 'Medals & Accolades'],
    theme: 'Achievements, sporting awards, victory milestones, honors, and competitive excellence.',
    description:
      'A gleaming low-poly golden championship trophy cup with sweeping curved handles, polished chalice rim, fluted pedestal stem, and an octagonal black marble base plinth with gold engraved placard.',
    polyCount: 3560,
    dimensionRatio: '1:0.7:1.4',
    minestWorldType: 'StandaloneObject',
    assetFileRef: 'object_culture_trophy_v1.glb',
    terrainSpecs: {
      shape: 'circular',
      underbelly: 'None — Pure Standalone Object (无底座/无台座，纯粹单体)',
      waterFeatures: 'None',
      foliage: 'None',
      elevationLevels: 1,
    },
    palette: [
      { hex: '#FFD700', label: 'Championship Gold', role: 'Cup & Handles' },
      { hex: '#FFA000', label: 'Deep Amber Gold', role: 'Fluted Stem & Base Lip' },
      { hex: '#212121', label: 'Polished Marble', role: 'Octagonal Plinth Base' },
      { hex: '#FFF8E1', label: 'Glint Highlight', role: 'Chalice Rim Spark' },
      { hex: '#CFD8DC', label: 'Brass Plaque', role: 'Engraved Award Plaque' },
    ],
    landmarks: [
      { id: 'tro-01', name: 'Curved Wing Handles', description: 'Dual graceful looping handles framing the chalice', tag: 'Gold' },
      { id: 'tro-02', name: 'Golden Chalice Cup', description: 'Flared low-poly cup with polished inner basin', tag: 'Chalice' },
      { id: 'tro-03', name: 'Marble Pedestal Plinth', description: 'Weighted octagonal black marble block supporting the trophy', tag: 'Plinth' },
    ],
    variants: {
      classic: { title: 'Grand Champion Cup', description: 'Polished gold chalice on a dark obsidian base', accentColor: '#FFD700' },
      fantasy: { title: 'Star Chalice', description: 'Luminescent celestial gold with floating star crest', accentColor: '#FFD54F' },
      minimal: { title: 'Brushed Titanium Cup', description: 'Sleek architectural cylinder cup with minimalist lines', accentColor: '#ECEFF1' },
    },
  },

  // =========================================================================
  // 10. Treasure Chest (REPLACE - New Object) — Collections, Favorites
  // =========================================================================
  {
    id: 'object_10_treasure_chest',
    slug: 'object-treasure-chest',
    name: 'Treasure Chest',
    subtitle: 'Collections & Favorites',
    category: 'culture',
    categoryName: 'Culture Objects',
    worldLevel: 'level3_object',
    baseType: 'standalone_object',
    collection: 'objects_culture',
    subcategories: ['Favorite Keepsakes', 'Collectibles', 'Rare Finds', 'Wishlist Treasures', 'Vault Items'],
    theme: 'Treasured items, curated favorites, special collections, keepsakes, and valuable memories.',
    description:
      'A classic pirate treasure chest of rich dark oak planks with forged iron corner brackets and studded bands, hinged arched lid propped slightly open revealing a warm golden interior glow and coins.',
    polyCount: 3720,
    dimensionRatio: '1.2:0.9:0.9',
    minestWorldType: 'StandaloneObject',
    assetFileRef: 'object_culture_treasure_chest_v1.glb',
    terrainSpecs: {
      shape: 'circular',
      underbelly: 'None — Pure Standalone Object (无底座/无台座，纯粹单体)',
      waterFeatures: 'None',
      foliage: 'None',
      elevationLevels: 1,
    },
    palette: [
      { hex: '#5D4037', label: 'Oak Planks', role: 'Chest Body & Curved Lid' },
      { hex: '#37474F', label: 'Wrought Iron', role: 'Reinforcing Bands & Rivets' },
      { hex: '#FFD54F', label: 'Treasure Gold', role: 'Gold Coins & Interior Glow' },
      { hex: '#D4AF37', label: 'Brass Lock Hasp', role: 'Keyhole & Front Clasp' },
      { hex: '#8D6E63', label: 'Wood Grain Trim', role: 'Plank Chamfers' },
    ],
    landmarks: [
      { id: 'tcs-01', name: 'Arched Hinged Lid', description: 'Barrel-vaulted lid slightly propped open with gold light escaping', tag: 'Lid' },
      { id: 'tcs-02', name: 'Iron Studded Straps', description: 'Rivet-studded forged iron strapping wrapping the chest', tag: 'Hardware' },
      { id: 'tcs-03', name: 'Gold Coin Heaps', description: 'Gleaming gold coins spilling over the rim from within', tag: 'Treasure' },
    ],
    variants: {
      classic: { title: 'Galleon Vault', description: 'Weathered oak timber with dark iron bands and glowing gold', accentColor: '#FFD54F' },
      fantasy: { title: 'Runed Reliquary', description: 'Enchanted silver chest containing glowing mana gems', accentColor: '#7C4DFF' },
      minimal: { title: 'Curator Box', description: 'Clean walnut keepsake box with flush brass inlays', accentColor: '#8D6E63' },
    },
  },

  // =========================================================================
  // 11. House (REPLACE - New Object) — Home, Family, Daily Life
  // =========================================================================
  {
    id: 'object_11_house',
    slug: 'object-house',
    name: 'House',
    subtitle: 'Home, Family & Daily Life',
    category: 'life',
    categoryName: 'Life Objects',
    worldLevel: 'level3_object',
    baseType: 'standalone_object',
    collection: 'objects_life',
    subcategories: ['Family Lists', 'Home Tasks', 'Chres & Routines', 'Daily Living', 'Family Memories'],
    theme: 'Home, family life, daily routines, domestic comfort, and household lists.',
    description:
      'A charming, clean low-poly standalone gabled house object with pitched terracotta roof tiles, smoking chimney, panel front door, and warm glowing square windows (pure object silhouette, zero terrain).',
    polyCount: 3380,
    dimensionRatio: '1:0.9:1.15',
    minestWorldType: 'StandaloneObject',
    assetFileRef: 'object_life_house_v1.glb',
    terrainSpecs: {
      shape: 'circular',
      underbelly: 'None — Pure Standalone Object (无底座/无台座，纯粹单体)',
      waterFeatures: 'None',
      foliage: 'None',
      elevationLevels: 1,
    },
    palette: [
      { hex: '#ECEFF1', label: 'Stucco White', role: 'House Body Walls' },
      { hex: '#D87A56', label: 'Terracotta Tile', role: 'Pitched Gabled Roof' },
      { hex: '#FFF9C4', label: 'Window Glow', role: 'Warm Interior Windows' },
      { hex: '#5D4037', label: 'Timber Door', role: 'Front Door & Lintel' },
      { hex: '#78909C', label: 'Stone Chimney', role: 'Brick Chimney Stack' },
    ],
    landmarks: [
      { id: 'hse-01', name: 'Gabled Shingle Roof', description: 'Crisply faceted double-pitch roof with overhanging eaves', tag: 'Architecture' },
      { id: 'hse-02', name: 'Stone Smoke Chimney', description: 'Vertical masonry chimney with low-poly puff of smoke', tag: 'Hearth' },
      { id: 'hse-03', name: 'Glowing Mullion Windows', description: 'Dual front mullion windows glowing with welcoming warm light', tag: 'Windows' },
    ],
    variants: {
      classic: { title: 'Cottage Home', description: 'White clapboard walls with warm terracotta tile roof', accentColor: '#D87A56' },
      fantasy: { title: 'Mushroom Croft', description: 'Cozy curved fairytale cottage with warm round door', accentColor: '#AB47BC' },
      minimal: { title: 'Nordic Monolith', description: 'Pure timber A-frame house with floor-to-ceiling glass gable', accentColor: '#37474F' },
    },
  },

  // =========================================================================
  // 12. Shopping Bag (REPLACE - New Object) — Brands, Products, Shopping
  // =========================================================================
  {
    id: 'object_12_shopping_bag',
    slug: 'object-shopping-bag',
    name: 'Shopping Bag',
    subtitle: 'Brands, Products & Shopping',
    category: 'life',
    categoryName: 'Life Objects',
    worldLevel: 'level3_object',
    baseType: 'standalone_object',
    collection: 'objects_life',
    subcategories: ['Shopping Lists', 'Brand Wishlists', 'Product Purchases', 'Wardrobe & Fashion', 'Gifts & Goods'],
    theme: 'Shopping lists, brand favorites, purchased products, retail wishlist, and gift shopping.',
    description:
      'A stylish low-poly boutique paper shopping bag featuring crisp side gusset fold creases, twisted cord loop handles standing upright, and a fluffed silk tissue paper puff peeking from the top.',
    polyCount: 3180,
    dimensionRatio: '0.9:0.5:1.25',
    minestWorldType: 'StandaloneObject',
    assetFileRef: 'object_life_shopping_bag_v1.glb',
    terrainSpecs: {
      shape: 'circular',
      underbelly: 'None — Pure Standalone Object (无底座/无台座，纯粹单体)',
      waterFeatures: 'None',
      foliage: 'None',
      elevationLevels: 1,
    },
    palette: [
      { hex: '#263238', label: 'Matte Onyx', role: 'Bag Outer Paper' },
      { hex: '#D4AF37', label: 'Gilded Foil', role: 'Brand Placard & Rope Eyelets' },
      { hex: '#FFF8E7', label: 'Silk Tissue', role: 'Puffed Gift Tissue Paper' },
      { hex: '#C2185B', label: 'Ribbon Magenta', role: 'Hang Tag Ribbon' },
      { hex: '#CFD8DC', label: 'Twisted Cord', role: 'Rope Loop Handles' },
    ],
    landmarks: [
      { id: 'sbg-01', name: 'Twisted Rope Handles', description: 'Dual upright looped cord handles anchored with metal eyelets', tag: 'Handles' },
      { id: 'sbg-02', name: 'Creased Paper Gusset', description: 'Geometric accordion fold creases along both side panels', tag: 'Gusset' },
      { id: 'sbg-03', name: 'Tissue Paper Puff', description: 'Faceted folded tissue paper draping out of the top opening', tag: 'Detail' },
    ],
    variants: {
      classic: { title: 'Boutique Carry', description: 'Charcoal paper with gold eyelets and silk tissue paper', accentColor: '#D4AF37' },
      fantasy: { title: 'Alchemist Parcel', description: 'Waxed parchment bag tied with magical glowing violet cord', accentColor: '#7C4DFF' },
      minimal: { title: 'Kraft Minimal', description: 'Unbleached kraft brown paper bag with crisp geometric folds', accentColor: '#8D6E63' },
    },
  },

  // =========================================================================
  // 13. Cooking Pot (REPLACE - New Object) — Food, Recipes, Cooking
  // =========================================================================
  {
    id: 'object_13_cooking_pot',
    slug: 'object-cooking-pot',
    name: 'Cooking Pot',
    subtitle: 'Food, Recipes & Cooking',
    category: 'life',
    categoryName: 'Life Objects',
    worldLevel: 'level3_object',
    baseType: 'standalone_object',
    collection: 'objects_life',
    subcategories: ['Favorite Recipes', 'Meal Prep Lists', 'Cooking Guides', 'Ingredients & Grocery', 'Comfort Foods'],
    theme: 'Cooking, culinary recipes, meal planning, home dining, and comforting cuisine.',
    description:
      'A classic enamelled cast-iron Dutch oven cooking pot in cheerful vibrant crimson, featuring side cast handles, circular domed lid with brass knob, and a wooden spoon resting across the rim with steam wisps.',
    polyCount: 3450,
    dimensionRatio: '1.2:1:0.9',
    minestWorldType: 'StandaloneObject',
    assetFileRef: 'object_life_cooking_pot_v1.glb',
    terrainSpecs: {
      shape: 'circular',
      underbelly: 'None — Pure Standalone Object (无底座/无台座，纯粹单体)',
      waterFeatures: 'Simmering savory stew inside',
      foliage: 'None',
      elevationLevels: 1,
    },
    palette: [
      { hex: '#C62828', label: 'Enamel Crimson', role: 'Dutch Oven Body & Lid' },
      { hex: '#D4AF37', label: 'Brass Lid Knob', role: 'Center Handle Knob' },
      { hex: '#5D4037', label: 'Cooking Spoon', role: 'Turned Beech Spoon' },
      { hex: '#FFF8E1', label: 'Simmer Broth', role: 'Savory Broth Surface' },
      { hex: '#ECEFF1', label: 'Aroma Steam', role: 'Rising Vapor Ribbon' },
    ],
    landmarks: [
      { id: 'cpt-01', name: 'Cast Side Loop Handles', description: 'Integral cast iron handles on opposite sides of the pot', tag: 'Handles' },
      { id: 'cpt-02', name: 'Domed Lid with Brass Knob', description: 'Tight-fitting heavy lid with polished golden metal finial', tag: 'Lid' },
      { id: 'cpt-03', name: 'Wooden Cooking Spoon', description: 'Turned chef spoon propped across the rim with aroma vapor', tag: 'Spoon' },
    ],
    variants: {
      classic: { title: 'French Dutch Oven', description: 'Glossy cherry red enamel with brass lid knob', accentColor: '#C62828' },
      fantasy: { title: 'Cauldron of Flavors', description: 'Blackened iron with bubbling emerald glowing stew', accentColor: '#00E676' },
      minimal: { title: 'Matte Cast Iron', description: 'Raw black seasoned cast iron with sleek modern lines', accentColor: '#263238' },
    },
  },

  // =========================================================================
  // 14. Tree (REPLACE - New Object) — Nature, Plants, Growth
  // =========================================================================
  {
    id: 'object_14_tree',
    slug: 'object-tree',
    name: 'Tree',
    subtitle: 'Nature, Plants & Growth',
    category: 'nature',
    categoryName: 'Nature Objects',
    worldLevel: 'level3_object',
    baseType: 'standalone_object',
    collection: 'objects_nature',
    subcategories: ['Habit Growth', 'Plant Lists', 'Green Spaces', 'Outdoor Life', 'Environmental Goals'],
    theme: 'Nature, living plants, personal growth, steady development, and green vitality.',
    description:
      'A distinctive stylized low-poly standalone tree with a sturdy twisting bark trunk, sculpted root flare, and clustered geometric canopy foliage cushions in vibrant layered emerald greens.',
    polyCount: 3340,
    dimensionRatio: '1:1:1.4',
    minestWorldType: 'StandaloneObject',
    assetFileRef: 'object_nature_tree_v1.glb',
    terrainSpecs: {
      shape: 'circular',
      underbelly: 'None — Pure Standalone Object (无底座/无台座，纯粹单体)',
      waterFeatures: 'None',
      foliage: 'Sculpted low-poly canopy volumes',
      elevationLevels: 1,
    },
    palette: [
      { hex: '#2E7D32', label: 'Lush Foliage', role: 'Canopy Polyhedron Volumes' },
      { hex: '#4CAF50', label: 'Sunlit Leaves', role: 'Top Canopy Highlights' },
      { hex: '#5D4037', label: 'Organic Bark', role: 'Faceted Trunk & Limbs' },
      { hex: '#1B5E20', label: 'Deep Shade', role: 'Lower Canopy Shadow Facets' },
      { hex: '#8D6E63', label: 'Root Base', role: 'Fanned Root Flare' },
    ],
    landmarks: [
      { id: 'tre-01', name: 'Tiered Foliage Canopy', description: 'Interlocking low-poly leaf clusters creating a full silhouette', tag: 'Canopy' },
      { id: 'tre-02', name: 'Faceted Hardwood Trunk', description: 'Tapering organic trunk branching into upper support limbs', tag: 'Trunk' },
      { id: 'tre-03', name: 'Root Flare Footprint', description: 'Steadily grounded root toes resting directly on the pedestal', tag: 'Roots' },
    ],
    variants: {
      classic: { title: 'Deciduous Oak', description: 'Vibrant green polygonal crown with warm brown timber trunk', accentColor: '#2E7D32' },
      fantasy: { title: 'World Tree Sapling', description: 'Glowing turquoise leaf facets with silver birch trunk', accentColor: '#00E5FF' },
      minimal: { title: 'Geometric Arbor', description: 'Sharp icosahedral foliage clusters on a clean minimalist stem', accentColor: '#43A047' },
    },
  },

  // =========================================================================
  // 15. Seashell (KEEP / RENAME) — Ocean, Marine Life
  // =========================================================================
  {
    id: 'object_15_seashell',
    slug: 'object-seashell',
    name: 'Seashell',
    subtitle: 'Ocean & Marine Life',
    category: 'nature',
    categoryName: 'Nature Objects',
    worldLevel: 'level3_object',
    baseType: 'standalone_object',
    collection: 'objects_nature',
    subcategories: ['Beach Finds', 'Ocean Life', 'Marine Treasures', 'Summer Memories', 'Coastal Lists'],
    theme: 'Ocean treasures, seashells, coastal journeys, natural geometry, and marine beauty.',
    description:
      'A sculpted marine nautilus seashell demonstrating the golden ratio spiral, featuring smooth exterior ribbing with warm tiger stripes, and an iridescent pearlescent mother-of-pearl inner aperture.',
    polyCount: 3460,
    dimensionRatio: '1:0.6:1.1',
    minestWorldType: 'StandaloneObject',
    assetFileRef: 'object_nature_seashell_v1.glb',
    terrainSpecs: {
      shape: 'circular',
      underbelly: 'None — Pure Standalone Object (无底座/无台座，纯粹单体)',
      waterFeatures: 'None',
      foliage: 'None',
      elevationLevels: 1,
    },
    palette: [
      { hex: '#FFF8E1', label: 'Nacre White', role: 'Shell Body' },
      { hex: '#E64A19', label: 'Tiger Stripe', role: 'Radiating Exterior Bands' },
      { hex: '#B2EBF2', label: 'Mother-of-Pearl', role: 'Iridescent Inner Chamber' },
      { hex: '#D7CCC8', label: 'Shell Rim', role: 'Aperture Edge' },
      { hex: '#8D6E63', label: 'Dorsal Flange', role: 'Spire Root' },
    ],
    landmarks: [
      { id: 'shl-01', name: 'Logarithmic Spiral', description: 'Mathematically pure expanding chambers of the nautilus', tag: 'Geometry' },
      { id: 'shl-02', name: 'Tiger Flame Stripes', description: 'Rusty red flame markings radiating over the white shell', tag: 'Color' },
      { id: 'shl-03', name: 'Nacre Aperture', description: 'Gently curved opening showing interior pearlescent sheen', tag: 'Aperture' },
    ],
    variants: {
      classic: { title: 'Tropical Nautilus', description: 'Cream shell with vibrant reddish flame stripes and nacre', accentColor: '#E64A19' },
      fantasy: { title: 'Abyssal Conch', description: 'Deep sea pearlescent violet shell with glowing interior', accentColor: '#CE93D8' },
      minimal: { title: 'Sculpted Porcelain', description: 'Pure matte white porcelain abstraction of the spiral', accentColor: '#ECEFF1' },
    },
  },

  // =========================================================================
  // 16. Compass (KEEP / RENAME) — Travel, Exploration, Goals
  // =========================================================================
  {
    id: 'object_16_compass',
    slug: 'object-compass',
    name: 'Compass',
    subtitle: 'Travel, Exploration & Goals',
    category: 'mind',
    categoryName: 'Ideas & Future Objects',
    worldLevel: 'level3_object',
    baseType: 'standalone_object',
    collection: 'objects_ideas',
    subcategories: ['Life Goals', 'True North', 'Travel Routes', 'Bucket Lists', 'Wayfinding'],
    theme: 'Moral compass, life goals, direction, true north, exploration, and wayfinding.',
    description:
      'A heavy antique pocket compass in an open polished brass pocket watch casing, with a 16-point engraved compass rose, 360-degree degree ring, top suspension ring, and a balanced magnetic blue/red needle.',
    polyCount: 3880,
    dimensionRatio: '1.1:0.35:1.2',
    minestWorldType: 'StandaloneObject',
    assetFileRef: 'object_ideas_compass_v1.glb',
    terrainSpecs: {
      shape: 'circular',
      underbelly: 'None — Pure Standalone Object (无底座/无台座，纯粹单体)',
      waterFeatures: 'None',
      foliage: 'None',
      elevationLevels: 1,
    },
    palette: [
      { hex: '#D4AF37', label: 'Antique Brass', role: 'Casing & Ring' },
      { hex: '#FFF8E7', label: 'Enamel Rose', role: 'Dial Face' },
      { hex: '#D32F2F', label: 'North Arrow', role: 'Magnetic Needle (North)' },
      { hex: '#1565C0', label: 'South Arrow', role: 'Magnetic Needle (South)' },
      { hex: '#37474F', label: 'Engraved Degrees', role: 'Rose Markings & Degree Ring' },
    ],
    landmarks: [
      { id: 'cmp-01', name: 'Balanced Magnetic Needle', description: 'Jeweled needle pointing decisively toward True North', tag: 'Needle' },
      { id: 'cmp-02', name: '16-Point Compass Rose', description: 'Intricate starburst dial with cardinal navigation directions', tag: 'Rose' },
      { id: 'cmp-03', name: 'Brass Lanyard Loop', description: 'Top hinged suspension loop for pocket chain attachment', tag: 'Hardware' },
    ],
    variants: {
      classic: { title: 'Mariner Compass', description: 'Polished nautical brass case with enamel starburst dial', accentColor: '#D4AF37' },
      fantasy: { title: 'Chrono-Compass', description: 'Silver case with mystical spinning runes pointing toward destiny', accentColor: '#9C27B0' },
      minimal: { title: 'Wayfinder Titanium', description: 'Matte titanium circular bezel with fluorescent orange needle', accentColor: '#FF5722' },
    },
  },

  // =========================================================================
  // 17. Camera (REPLACE - New Object) — Photography, Memories, Places
  // =========================================================================
  {
    id: 'object_17_camera',
    slug: 'object-camera',
    name: 'Camera',
    subtitle: 'Photography, Memories & Places',
    category: 'culture',
    categoryName: 'Culture Objects',
    worldLevel: 'level3_object',
    baseType: 'standalone_object',
    collection: 'objects_culture',
    subcategories: ['Photo Albums', 'Travel Snaps', 'Visual Diaries', 'Portraits', 'Captured Moments'],
    theme: 'Photography, captured memories, visual diaries, travel snapshots, and creative framing.',
    description:
      'A handsome vintage 35mm rangefinder camera featuring a brushed metal top plate, leatherette body wrap, multi-element lens barrel with aperture ring, round glass optical viewfinder, and knurled shutter dial.',
    polyCount: 3840,
    dimensionRatio: '1.2:0.7:0.85',
    minestWorldType: 'StandaloneObject',
    assetFileRef: 'object_culture_camera_v1.glb',
    terrainSpecs: {
      shape: 'circular',
      underbelly: 'None — Pure Standalone Object (无底座/无台座，纯粹单体)',
      waterFeatures: 'None',
      foliage: 'None',
      elevationLevels: 1,
    },
    palette: [
      { hex: '#CFD8DC', label: 'Brushed Chrome', role: 'Top Plate, Base & Dial Rings' },
      { hex: '#212121', label: 'Vulcanite Leather', role: 'Camera Body Wrap' },
      { hex: '#37474F', label: 'Lens Barrel Steel', role: 'Cylindrical Lens Body' },
      { hex: '#80DEEA', label: 'Coated Optics', role: 'Glass Element Lens Reflection' },
      { hex: '#C62828', label: 'Red Dot Emblem', role: 'Classic Vintage Camera Dot' },
    ],
    landmarks: [
      { id: 'cam-01', name: 'Multi-Element Lens', description: 'Stepped cylindrical lens barrel with glass reflections', tag: 'Optics' },
      { id: 'cam-02', name: 'Knurled Shutter Speed Dial', description: 'Machined top dials with shutter release button', tag: 'Controls' },
      { id: 'cam-03', name: 'Optical Viewfinder Window', description: 'Dual front glass windows for rangefinder focusing', tag: 'Viewfinder' },
    ],
    variants: {
      classic: { title: 'Vintage 35mm', description: 'Brushed chrome top plate with black leatherette wrap', accentColor: '#C62828' },
      fantasy: { title: 'Chrono-Imager', description: 'Brass filigree camera capturing shimmering light memories', accentColor: '#D4AF37' },
      minimal: { title: 'Stealth Black', description: 'Monochrome matte black body with minimal graphic engraving', accentColor: '#263238' },
    },
  },

  // =========================================================================
  // 18. Heart (REPLACE - New Object) — Relationships, Family, Values
  // =========================================================================
  {
    id: 'object_18_heart',
    slug: 'object-heart',
    name: 'Heart',
    subtitle: 'Relationships, Family & Values',
    category: 'life',
    categoryName: 'Life Objects',
    worldLevel: 'level3_object',
    baseType: 'standalone_object',
    collection: 'objects_life',
    subcategories: ['Loved Ones', 'Relationships', 'Gratitude Lists', 'Core Values', 'Kindness'],
    theme: 'Love, meaningful relationships, family devotion, personal values, and gratitude.',
    description:
      'An exquisite, volumetric faceted low-poly dimensional heart gemstone glowing in radiant ruby crimson, with crisp geometric bevels catching warm specular studio highlights.',
    polyCount: 3220,
    dimensionRatio: '1:0.6:1.1',
    minestWorldType: 'StandaloneObject',
    assetFileRef: 'object_life_heart_v1.glb',
    terrainSpecs: {
      shape: 'circular',
      underbelly: 'None — Pure Standalone Object (无底座/无台座，纯粹单体)',
      waterFeatures: 'None',
      foliage: 'None',
      elevationLevels: 1,
    },
    palette: [
      { hex: '#E53935', label: 'Ruby Heart', role: 'Main Heart Facets' },
      { hex: '#EF5350', label: 'Specular Light', role: 'Top Highlight Chamfers' },
      { hex: '#B71C1C', label: 'Deep Crimson', role: 'Lower Shading Facets' },
      { hex: '#FFCDD2', label: 'Gem Sparkle', role: 'Crest Glint Flare' },
      { hex: '#FF8A80', label: 'Warm Glow', role: 'Internal Radiance' },
    ],
    landmarks: [
      { id: 'hrt-01', name: 'Dual Rounded Lobes', description: 'Volumetric twin upper lobes tapering gracefully to apex', tag: 'Anatomy' },
      { id: 'hrt-02', name: 'Crisp Faceted Gem Cuts', description: 'Diamond-like triangular bevels reflecting warm light', tag: 'Facets' },
      { id: 'hrt-03', name: 'Sharp Tapered Apex', description: 'Clean symmetrical lower tip resting balanced on pedestal', tag: 'Apex' },
    ],
    variants: {
      classic: { title: 'Ruby Facet', description: 'Rich ruby crimson gemstone with crisp geometric cuts', accentColor: '#E53935' },
      fantasy: { title: 'Crystal of Devotion', description: 'Ethereal pink rose quartz with gentle internal pulse glow', accentColor: '#F48FB1' },
      minimal: { title: 'Sculptural Crimson', description: 'Smooth satin coral geometric heart with clean silhouettes', accentColor: '#D32F2F' },
    },
  },

  // =========================================================================
  // 19. Light Bulb (KEEP / RENAME) — Ideas, Inspiration, Discovery
  // =========================================================================
  {
    id: 'object_19_lightbulb',
    slug: 'object-lightbulb',
    name: 'Light Bulb',
    subtitle: 'Ideas, Inspiration & Discovery',
    category: 'mind',
    categoryName: 'Ideas & Future Objects',
    worldLevel: 'level3_object',
    baseType: 'standalone_object',
    collection: 'objects_ideas',
    subcategories: ['Invention Ideas', 'Brainstorms', 'Creative Sparks', 'Insights', 'Epiphanies'],
    theme: 'Creative inspiration, breakthrough ideas, invention, discovery, and mental clarity.',
    description:
      'An iconic teardrop glass lightbulb with a glowing zigzag tungsten wire filament, glass support stem with lead-in wires, and a threaded brass screw base contact cap.',
    polyCount: 3520,
    dimensionRatio: '0.8:0.8:1.35',
    minestWorldType: 'StandaloneObject',
    assetFileRef: 'object_ideas_lightbulb_v1.glb',
    terrainSpecs: {
      shape: 'circular',
      underbelly: 'None — Pure Standalone Object (无底座/无台座，纯粹单体)',
      waterFeatures: 'None',
      foliage: 'None',
      elevationLevels: 1,
    },
    palette: [
      { hex: '#FFF59D', label: 'Bulb Glow', role: 'Glass Envelope Tone' },
      { hex: '#FFB300', label: 'Tungsten Heat', role: 'Spiral Filament Wire' },
      { hex: '#D4AF37', label: 'Threaded Brass', role: 'Edison Screw Base' },
      { hex: '#263238', label: 'Base Contact', role: 'Contact Point & Seal' },
      { hex: '#FFFFFF', label: 'Specular Shine', role: 'Glass Highlight Flare' },
    ],
    landmarks: [
      { id: 'lb-01', name: 'Glowing Tungsten Filament', description: 'Radiating coiled wire shaped into an energetic loop', tag: 'Filament' },
      { id: 'lb-02', name: 'Blown Glass Envelope', description: 'Smooth teardrop silhouette capturing warm inner brilliance', tag: 'Glass' },
      { id: 'lb-03', name: 'Threaded Edison Base', description: 'Machined brass spiral threads with bottom solder contact', tag: 'Cap' },
    ],
    variants: {
      classic: { title: 'Edison Bulb', description: 'Warm amber vintage glass with intricate squirrel-cage filament', accentColor: '#FFB300' },
      fantasy: { title: 'Aether Spark Bulb', description: 'Prismatic crystal bulb with trapped swirling lightning wisp', accentColor: '#00E5FF' },
      minimal: { title: 'LED Filament Minimal', description: 'Clean geometric bulb with a single stark vertical filament rod', accentColor: '#FFE082' },
    },
  },

  // =========================================================================
  // 20. Crystal (KEEP / RENAME) — Dreams, Possibilities, Reflection
  // =========================================================================
  {
    id: 'object_20_crystal',
    slug: 'object-crystal',
    name: 'Crystal',
    subtitle: 'Dreams, Possibilities & Reflection',
    category: 'cosmos',
    categoryName: 'Ideas & Future Objects',
    worldLevel: 'level3_object',
    baseType: 'standalone_object',
    collection: 'objects_ideas',
    subcategories: ['Vision Boards', 'Dream Aspirations', 'Spiritual Clarity', 'Possibilities', 'Future Hopes'],
    theme: 'Dreams, infinite possibilities, inner reflection, clarity of vision, and future aspirations.',
    description:
      'A luminous hexagonal crystal prism shard cluster growing from a dark mineral rock base, featuring sharp pointed facets in shimmering amethyst violet and cyan prism refractions.',
    polyCount: 3620,
    dimensionRatio: '1:1:1.15',
    minestWorldType: 'StandaloneObject',
    assetFileRef: 'object_ideas_crystal_v1.glb',
    terrainSpecs: {
      shape: 'circular',
      underbelly: 'None — Pure Standalone Object (无底座/无台座，纯粹单体)',
      waterFeatures: 'None',
      foliage: 'None',
      elevationLevels: 1,
    },
    palette: [
      { hex: '#AB47BC', label: 'Amethyst Violet', role: 'Main Crystal Shards' },
      { hex: '#E1BEE7', label: 'Facet Glint', role: 'Highlight Prism Edges' },
      { hex: '#455A64', label: 'Basalt Matrix', role: 'Base Geode Rock' },
      { hex: '#7E57C2', label: 'Deep Quartz', role: 'Core Crystal Bodies' },
      { hex: '#80DEEA', label: 'Prism Refraction', role: 'Internal Glow Accent' },
    ],
    landmarks: [
      { id: 'cys-01', name: 'Hexagonal Prism Spire', description: 'Tall central crystal terminating in a sharp pyramid tip', tag: 'Prism' },
      { id: 'cys-02', name: 'Secondary Crystal Spray', description: 'Fan of smaller pointed quartz crystals sprouting at angles', tag: 'Cluster' },
      { id: 'cys-03', name: 'Raw Basalt Bedrock', description: 'Textured volcanic host rock anchoring the crystal bases', tag: 'Rock' },
    ],
    variants: {
      classic: { title: 'Amethyst Geode', description: 'Vibrant purple crystal cluster rooted in dark basalt rock', accentColor: '#AB47BC' },
      fantasy: { title: 'Mana Crystal Spire', description: 'Ethereal cyan and electric blue glowing power crystals', accentColor: '#00E5FF' },
      minimal: { title: 'Smoky Topaz', description: 'Warm champagne amber crystalline facets with clean geometry', accentColor: '#FFB300' },
    },
  },
];
