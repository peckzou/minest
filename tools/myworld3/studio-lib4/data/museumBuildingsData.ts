import { IslandMetadata } from '../types/island';

// =========================================================================
// Minest World Visual Library — 20 Grand Museum Buildings (BD-101 to BD-120)
// Monumental multi-wing museum complexes with grand porticos, domes, atriums,
// reflecting pools, courtyards, and distinctive architectural signatures.
// =========================================================================

export const MUSEUM_BUILDINGS: IslandMetadata[] = [
  // -----------------------------------------------------------------------
  // 1. Classical & Fine Arts
  // -----------------------------------------------------------------------
  {
    id: 'BD-101',
    slug: 'building-museum-neoclassical-fine-arts',
    name: 'Grand Neoclassical Fine Arts Museum',
    subtitle: 'Grand Museum Complex · Modular Building',
    category: 'culture',
    categoryName: 'Grand Museums',
    worldLevel: 'level2_building',
    baseType: 'architectural_foundation',
    collection: 'buildings_museums',
    subcategories: ['Corinthian Portico', 'Central Ribbed Dome', 'Colonnaded Wings', 'Twin Reflecting Basins'],
    theme: 'Monumental neoclassical palace of art with soaring Corinthian colonnade, sculptured pediment, and copper-ribbed dome.',
    description: 'A grand national museum of fine arts featuring a grand octastyle colonnaded portico with a triangular pediment, flanked by extended symmetrical gallery wings, crowned by an elevated ribbed dome and approached via a cascading staircase between twin reflecting pools.',
    polyCount: 5280,
    dimensionRatio: '1.4:1.2:1.45',
    minestWorldType: 'ModularBuilding',
    assetFileRef: 'minest/buildings/bd101_neoclassical_fine_arts.glb',
    terrainSpecs: {
      shape: 'terraced',
      underbelly: 'Polished white marble podium with monumental parvis steps',
      waterFeatures: 'Twin rectangular mirror basins with central bronze water jets',
      foliage: 'Flanking cypress allée and geometric topiary box hedges',
      elevationLevels: 2,
    },
    palette: [
      { hex: '#F1F5F9', label: 'Pentelic Marble', role: 'Colonnades, Portico & Wings' },
      { hex: '#0D9488', label: 'Aged Verdigris Copper', role: 'Central Ribbed Dome' },
      { hex: '#D97706', label: 'Gilded Pediment Accent', role: 'Tympanum & Dome Lantern Finial' },
      { hex: '#38BDF8', label: 'Basin Mirror Aqua', role: 'Twin Symmetry Reflecting Pools' },
    ],
    landmarks: [
      { id: 'bd101-lm1', name: 'Monumental Octastyle Portico & Pediment', description: 'Eight fluted marble columns supporting a classical sculptured triangular pediment', tag: 'Portico' },
      { id: 'bd101-lm2', name: 'Ribbed Verdigris Dome & Lantern', description: 'High Renaissance copper dome crowned with a gilded observation lantern', tag: 'Dome' },
    ],
    variants: {
      classic: { title: 'State Treasury of Arts', description: 'Pristine white marble, verdigris copper dome, and turquoise reflection basins', accentColor: '#0D9488' },
      fantasy: { title: 'Pantheon of the Muses', description: 'Luminescent alabaster stone with golden celestial constellations glowing upon the dome', accentColor: '#F59E0B' },
      minimal: { title: 'Pure Ionic Monument', description: 'Monolithic warm travertine colonnade with crisp geometric cornice lines', accentColor: '#F1F5F9' },
    },
  },

  // -----------------------------------------------------------------------
  // 2. Natural History & Paleontology
  // -----------------------------------------------------------------------
  {
    id: 'BD-102',
    slug: 'building-museum-paleontology-natural-history',
    name: 'Paleontology & Natural History Grand Hall',
    subtitle: 'Grand Museum Complex · Modular Building',
    category: 'nature',
    categoryName: 'Grand Museums',
    worldLevel: 'level2_building',
    baseType: 'architectural_foundation',
    collection: 'buildings_museums',
    subcategories: ['Romanesque Sandstone Portal', 'Vaulted Dinosaur Glass Atrium', 'Twin Paleontology Wings', 'Outdoor Fossil Dig Plaza'],
    theme: 'Romanesque revival red sandstone cathedral of nature with a soaring barrel-vaulted glass atrium.',
    description: 'A grand cathedral of natural history built in warm red sandstone, centered on a massive vaulted glass atrium showcasing towering sauropod skeletons, flanked by corner turrets and a sunken outdoor paleontology excavation court.',
    polyCount: 5120,
    dimensionRatio: '1.35:1.2:1.4',
    minestWorldType: 'ModularBuilding',
    assetFileRef: 'minest/buildings/bd102_natural_history.glb',
    terrainSpecs: {
      shape: 'terraced',
      underbelly: 'Ochre sandstone rusticated foundation course',
      waterFeatures: 'Sunken ammonite spiral water fountain in entrance plaza',
      foliage: 'Prehistoric cycad and tree-fern planters flanking the grand portal',
      elevationLevels: 2,
    },
    palette: [
      { hex: '#B45309', label: 'Terracotta Sandstone', role: 'Romanesque Arches & Turret Towers' },
      { hex: '#334155', label: 'Weathered Slate Roof', role: 'Pitched Gallery Roofs' },
      { hex: '#38BDF8', label: 'Vaulted Atrium Glass', role: 'Central Clerestory Barrel Skylight' },
      { hex: '#FDE047', label: 'Fossil Amber Gold', role: 'Atrium Rib Framing & Lamp Standards' },
    ],
    landmarks: [
      { id: 'bd102-lm1', name: 'Vaulted Central Dinosaur Atrium', description: 'Soaring iron-ribbed glass barrel vault revealing giant sauropod fossil silhouettes', tag: 'Atrium' },
      { id: 'bd102-lm2', name: 'Twin Romanesque Portal Towers', description: 'Tiered arched terracotta towers framing the grand concentric entrance arch', tag: 'Towers' },
    ],
    variants: {
      classic: { title: 'Victorian Nature Cathedral', description: 'Ochre and red brick arches, blue glass barrel vault, and slate roofs', accentColor: '#B45309' },
      fantasy: { title: 'Titan Fossil Sanctuary', description: 'Crystalline dragon bones suspended beneath a starlight-glazed dome', accentColor: '#8B5CF6' },
      minimal: { title: 'Raw Sandstone Monolith', description: 'Carved canyon-like sandstone massing with rhythmic vertical slit windows', accentColor: '#D97706' },
    },
  },

  // -----------------------------------------------------------------------
  // 3. Contemporary Cantilever Art
  // -----------------------------------------------------------------------
  {
    id: 'BD-103',
    slug: 'building-museum-contemporary-cantilever-art',
    name: 'Contemporary Cantilevered Cube Art Museum',
    subtitle: 'Grand Museum Complex · Modular Building',
    category: 'culture',
    categoryName: 'Grand Museums',
    worldLevel: 'level2_building',
    baseType: 'architectural_foundation',
    collection: 'buildings_museums',
    subcategories: ['Interlocking Cantilever Cubes', '3-Story Glass Curtain', 'Sculpture Sky Terrace', 'Kinetic Mobile Plaza'],
    theme: 'Dramatic interlocking geometric volumes hovering over a transparent glass atrium and black mirror pool.',
    description: 'An avant-garde contemporary museum composed of daring cantilevered white and zinc cubes that shift and hover over an open three-story glass curtain lobby, featuring elevated rooftop sculpture decks and a kinetic mobile plaza.',
    polyCount: 4980,
    dimensionRatio: '1.3:1.3:1.5',
    minestWorldType: 'ModularBuilding',
    assetFileRef: 'minest/buildings/bd103_contemporary_cantilever.glb',
    terrainSpecs: {
      shape: 'terraced',
      underbelly: 'Dark basalt architectural plaza with integrated bench steps',
      waterFeatures: 'Black mirror reflecting pool beneath the largest cantilever',
      foliage: 'Minimalist bamboo grove in stainless steel planters',
      elevationLevels: 3,
    },
    palette: [
      { hex: '#F8FAFC', label: 'Matte White Panel', role: 'Cantilevered Upper Gallery Volume' },
      { hex: '#475569', label: 'Dark Zinc Cladding', role: 'Interlocking Counter-Block' },
      { hex: '#0EA5E9', label: 'Clear Curtain Glass', role: 'Ground Level Transparent Atrium' },
      { hex: '#EF4444', label: 'Calder Red Accent', role: 'Kinetic Sculpture in Plaza' },
    ],
    landmarks: [
      { id: 'bd103-lm1', name: 'Heroic Hovering Cantilever Wing', description: 'Bold geometric white gallery volume projecting 15 meters out over the plaza', tag: 'Cantilever' },
      { id: 'bd103-lm2', name: 'Open-Air Sculpture Skydeck', description: 'Rooftop exhibition terrace with panoramic glass balustrades', tag: 'Skydeck' },
    ],
    variants: {
      classic: { title: 'Metropolitan Modern Art', description: 'Crisp white stucco cubes, dark zinc joints, and cobalt reflection pool', accentColor: '#0EA5E9' },
      fantasy: { title: 'Gravity-Defying Gallery', description: 'Floating crystal prisms held in mid-air by magnetic light beams', accentColor: '#EC4899' },
      minimal: { title: 'Monochrome Shift', description: 'All-white cubist composition with deep black glazed shadow reveals', accentColor: '#1E293B' },
    },
  },

  // -----------------------------------------------------------------------
  // 4. Aerospace & Planetarium Mega Museum
  // -----------------------------------------------------------------------
  {
    id: 'BD-104',
    slug: 'building-museum-aerospace-planetarium-complex',
    name: 'Aerospace & Planetarium Mega Museum',
    subtitle: 'Grand Museum Complex · Modular Building',
    category: 'systems',
    categoryName: 'Grand Museums',
    worldLevel: 'level2_building',
    baseType: 'architectural_foundation',
    collection: 'buildings_museums',
    subcategories: ['Geodesic Planetarium Sphere', 'Sweeping Aerodynamic Wings', 'Launch Gantry Plaza', 'Supersonic Flight Concourse'],
    theme: 'Sweeping supersonic aerodynamic concourses wrapped around a colossal silver geodesic planetarium sphere.',
    description: 'A monument to aeronautical and space exploration featuring two massive sweeping wing-like exhibition halls flanking a monumental silver geodesic planetarium sphere, complete with a historic rocket gantry display on the tarmac plaza.',
    polyCount: 5350,
    dimensionRatio: '1.45:1.25:1.5',
    minestWorldType: 'ModularBuilding',
    assetFileRef: 'minest/buildings/bd104_aerospace_planetarium.glb',
    terrainSpecs: {
      shape: 'circular',
      underbelly: 'Runway-style scored concrete plaza with illuminated taxiline guides',
      waterFeatures: 'Circular mist cooling basin surrounding the sphere base',
      foliage: 'Hardy desert grasses bordering the outdoor rocket court',
      elevationLevels: 2,
    },
    palette: [
      { hex: '#E2E8F0', label: 'Aerospace Titanium White', role: 'Sweeping Flight Wing Hangars' },
      { hex: '#38BDF8', label: 'Cosmic Blue Dome', role: 'Geodesic Planetarium Sphere' },
      { hex: '#DC2626', label: 'Gantry Warning Crimson', role: 'Launch Gantry Truss & Rocket Fin' },
      { hex: '#1E293B', label: 'Tarmac Asphalt', role: 'Runway Base Plinth' },
    ],
    landmarks: [
      { id: 'bd104-lm1', name: 'Giant Geodesic Planetarium Sphere', description: 'Faceted silver dome housing an immersive 8K celestial theater', tag: 'Sphere' },
      { id: 'bd104-lm2', name: 'Sweeping Swept-Wing Exhibition Hangar', description: 'Cantilevered aerodynamic arch shelter housing multi-tier historic aircraft', tag: 'Concourse' },
    ],
    variants: {
      classic: { title: 'Smithsonian Flight Pavilion', description: 'White fuselage panels, blue geodesic sphere, and red rocket tower', accentColor: '#38BDF8' },
      fantasy: { title: 'Interstellar Starport Museum', description: 'Deep obsidian hulls with pulsating cyan plasma engines on display', accentColor: '#06B6D4' },
      minimal: { title: 'Aero-Brutalist Needle & Sphere', description: 'Cast silver sphere balanced against a pure white tapered wedge wing', accentColor: '#E2E8F0' },
    },
  },

  // -----------------------------------------------------------------------
  // 5. Oceanic & Maritime Mega Museum
  // -----------------------------------------------------------------------
  {
    id: 'BD-105',
    slug: 'building-museum-oceanic-maritime-heritage',
    name: 'Oceanic & Maritime Heritage Mega Museum',
    subtitle: 'Grand Museum Complex · Modular Building',
    category: 'nature',
    categoryName: 'Grand Museums',
    worldLevel: 'level2_building',
    baseType: 'architectural_foundation',
    collection: 'buildings_museums',
    subcategories: ['Wave-Form Titanium Roofs', 'Glass Lighthouse Spire', 'Dry-Dock Galleon Pavilion', 'Harbor Boardwalk Moat'],
    theme: 'Cascading sculptural wave roofs evocative of surging ocean swells, integrated with a historic dry-dock ship display.',
    description: 'A landmark maritime museum situated inside a protective harbor moat, featuring sweeping curved wave-form roofs clad in iridescent marine titanium, a modern glass beacon spire, and a dry-dock cradle displaying a historic three-masted wooden galleon.',
    polyCount: 5210,
    dimensionRatio: '1.4:1.2:1.55',
    minestWorldType: 'ModularBuilding',
    assetFileRef: 'minest/buildings/bd105_oceanic_maritime.glb',
    terrainSpecs: {
      shape: 'coastal',
      underbelly: 'Granite sea wall quay with weathered timber mooring pilings',
      waterFeatures: 'Surrounding saltwater moat and dry-dock pool',
      foliage: 'Coastal dune grasses and salt-tolerant pines along the boardwalk',
      elevationLevels: 2,
    },
    palette: [
      { hex: '#0284C7', label: 'Deep Ocean Blue', role: 'Wave-Form Curving Roof Plates' },
      { hex: '#F8FAFC', label: 'Seafoam Titanium', role: 'Lower Hall Facades & Deck Walk' },
      { hex: '#D97706', label: 'Teak & Oak Galleon', role: 'Historic Sailing Ship in Dry Dock' },
      { hex: '#FACC15', label: 'Lighthouse Beacon Gold', role: 'Tower Lantern & Navigational Lens' },
    ],
    landmarks: [
      { id: 'bd105-lm1', name: 'Sculptural Wave-Curved Roof Shells', description: 'Overlapping double-curved metal canopies mimicking rolling storm waves', tag: 'WaveRoof' },
      { id: 'bd105-lm2', name: 'Historic Dry-Dock Galleon Display', description: 'Full-scale replica of an exploratory sailing ship preserved in a stone dock', tag: 'Galleon' },
    ],
    variants: {
      classic: { title: 'Harbor of Ages Museum', description: 'Deep maritime blue curves, white boardwalk, and amber timber masts', accentColor: '#0284C7' },
      fantasy: { title: 'Leviathan Oceanic Sanctum', description: 'Luminescent bioluminescent teal scales covering colossal whale-bone ribs', accentColor: '#10B981' },
      minimal: { title: 'White Sails on Blue', description: 'Pure white sail-shaped tensile membranes poising above a dark sea moat', accentColor: '#F8FAFC' },
    },
  },

  // -----------------------------------------------------------------------
  // 6. Ancient Civilizations & Archaeological Vault
  // -----------------------------------------------------------------------
  {
    id: 'BD-106',
    slug: 'building-museum-ancient-antiquities-hypostyle',
    name: 'Ancient Civilizations & Archaeological Vault',
    subtitle: 'Grand Museum Complex · Modular Building',
    category: 'knowledge',
    categoryName: 'Grand Museums',
    worldLevel: 'level2_building',
    baseType: 'architectural_foundation',
    collection: 'buildings_museums',
    subcategories: ['Stepped Sandstone Pylon', 'Hypostyle Colonnade Court', 'Twin Relic Obelisks', 'Sunken Archaeological Chamber'],
    theme: 'Monumental desert sandstone pylon gate leading to a grand hypostyle column courtyard and subterranean relic vaults.',
    description: 'An evocative museum of world antiquities featuring a massive battered sandstone pylon entrance, twin towering hieroglyphic obelisks, an open-air hypostyle courtyard with lotus capitals, and a sunken glass skylight viewing chamber into excavation vaults below.',
    polyCount: 5180,
    dimensionRatio: '1.35:1.2:1.45',
    minestWorldType: 'ModularBuilding',
    assetFileRef: 'minest/buildings/bd106_ancient_antiquities.glb',
    terrainSpecs: {
      shape: 'terraced',
      underbelly: 'Chiseled yellow desert sandstone bedrock plinth',
      waterFeatures: 'Linear papyrus canal running axially through the courtyard',
      foliage: 'Date palms in square stone planters framing the pylon',
      elevationLevels: 3,
    },
    palette: [
      { hex: '#D97706', label: 'Nubian Sandstone', role: 'Monumental Pylons & Hypostyle Columns' },
      { hex: '#1E293B', label: 'Black Granite Obelisk', role: 'Twin Entrance Monoliths' },
      { hex: '#0D9488', label: 'Turquoise Faience', role: 'Cornice Reliefs & Glazed Inlays' },
      { hex: '#FACC15', label: 'Pharaonic Gold Leaf', role: 'Pyramidion Tops & Sanctuary Caps' },
    ],
    landmarks: [
      { id: 'bd106-lm1', name: 'Battered Monumental Pylon Gate', description: 'Massive sloped stone towers flanked by colossal seated scribe statues', tag: 'Pylon' },
      { id: 'bd106-lm2', name: 'Hypostyle Lotus Column Hall', description: 'Forest of twelve carved sandstone pillars crowned with open papyrus capitals', tag: 'Colonnade' },
    ],
    variants: {
      classic: { title: 'Museum of Lost Civilizations', description: 'Warm ochre sandstone, black basalt obelisks, and gold pyramidions', accentColor: '#D97706' },
      fantasy: { title: 'Sunken Vault of the Ancients', description: 'Weathered lapis lazuli stone infused with glowing magical runes', accentColor: '#3B82F6' },
      minimal: { title: 'Desert Pylon & Void', description: 'Sharp unadorned sandstone monoliths casting deep triangular shadows', accentColor: '#D97706' },
    },
  },

  // -----------------------------------------------------------------------
  // 7. Prismatic Crystal & Origami Glass Museum
  // -----------------------------------------------------------------------
  {
    id: 'BD-107',
    slug: 'building-museum-origami-crystal-glass',
    name: 'Prismatic Crystal & Origami Glass Museum',
    subtitle: 'Grand Museum Complex · Modular Building',
    category: 'culture',
    categoryName: 'Grand Museums',
    worldLevel: 'level2_building',
    baseType: 'architectural_foundation',
    collection: 'buildings_museums',
    subcategories: ['Triangulated Facet Canopy', 'Pyramidal Glass Lanterns', 'Mirror Moat Pool', 'Origami Stainless Steel Wings'],
    theme: 'Fractal origami architecture composed of folding triangulated glass and polished titanium planes.',
    description: 'A breathtaking crystal landmark whose folded geometric facets capture and refract light in all directions, rising from an expansive surrounding mirror moat with soaring crystalline glass lanterns that pierce the central atrium hall.',
    polyCount: 5410,
    dimensionRatio: '1.4:1.3:1.5',
    minestWorldType: 'ModularBuilding',
    assetFileRef: 'minest/buildings/bd107_origami_crystal.glb',
    terrainSpecs: {
      shape: 'terraced',
      underbelly: 'Polished white terrazzo island base floating in water',
      waterFeatures: 'Surrounding 360-degree infinity reflection moat',
      foliage: 'Minimalist square water lily planters placed symmetrically',
      elevationLevels: 2,
    },
    palette: [
      { hex: '#38BDF8', label: 'Prismatic Cyan Glass', role: 'Triangulated Glazing Facets' },
      { hex: '#E2E8F0', label: 'Mirror Titanium Panel', role: 'Folded Origami Opaque Skin' },
      { hex: '#6366F1', label: 'Violet Dichroic Trim', role: 'Facet Mullion Trusses' },
      { hex: '#0284C7', label: 'Reflecting Pool Aqua', role: 'Base Infinity Mirror Moat' },
    ],
    landmarks: [
      { id: 'bd107-lm1', name: 'Folded Origami Diamond Crown', description: 'Cantilevered triangulated metal canopy folding dramatically over the water', tag: 'Origami' },
      { id: 'bd107-lm2', name: 'Prismatic Pyramidal Light Core', description: 'Central crystalline skylight tower channeling rainbow daylight into subterranean galleries', tag: 'Crystal' },
    ],
    variants: {
      classic: { title: 'Crystal Pavilion of Contemporary Art', description: 'Cyan crystal facets, polished titanium folds, and cobalt mirror moat', accentColor: '#38BDF8' },
      fantasy: { title: 'Shards of the Aurora', description: 'Iridescent rainbow dichroic glass pulsating with northern light reflections', accentColor: '#A855F7' },
      minimal: { title: 'Folded Geometric Monolith', description: 'Matte white origami plates with sharp razor-thin geometric shadow crevices', accentColor: '#E2E8F0' },
    },
  },

  // -----------------------------------------------------------------------
  // 8. Oriental Imperial Palace Garden & Heritage Museum
  // -----------------------------------------------------------------------
  {
    id: 'BD-108',
    slug: 'building-museum-oriental-imperial-palace',
    name: 'Imperial Palace Garden & Heritage Museum',
    subtitle: 'Grand Museum Complex · Modular Building',
    category: 'culture',
    categoryName: 'Grand Museums',
    worldLevel: 'level2_building',
    baseType: 'architectural_foundation',
    collection: 'buildings_museums',
    subcategories: ['Double-Eaved Hip Roofs', 'Vermilion Lacquered Pillars', 'Arched Moon Bridges', 'Lotus Canal Moat'],
    theme: 'Majestic classical Chinese imperial architecture with double-eaved golden glazed roofs, stone balustrades, and a lotus moat.',
    description: 'A grand museum complex inspired by classical imperial palaces, boasting majestic double-eaved hip roofs with sweeping flying eaves in imperial yellow glaze, rich vermilion timber colonnades, white carved marble terrace steps, and an arched stone moon bridge crossing a lotus-filled moat.',
    polyCount: 5460,
    dimensionRatio: '1.45:1.2:1.45',
    minestWorldType: 'ModularBuilding',
    assetFileRef: 'minest/buildings/bd108_imperial_palace_museum.glb',
    terrainSpecs: {
      shape: 'terraced',
      underbelly: 'Tiered white marble balustrade terrace with dragon water spouts',
      waterFeatures: 'Serpentine moat crossed by three carved stone moon bridges',
      foliage: 'Sculpted black pines, weeping willows, and blooming pink lotus pads',
      elevationLevels: 3,
    },
    palette: [
      { hex: '#EAB308', label: 'Imperial Glazed Yellow', role: 'Tiered Flying Eaves Tile Roofs' },
      { hex: '#DC2626', label: 'Palace Vermilion Red', role: 'Timber Pillars, Beams & Doors' },
      { hex: '#F8FAFC', label: 'Hanbaiyu White Marble', role: 'Carved Terraces, Balustrades & Bridges' },
      { hex: '#0D9488', label: 'Celadon Jade Trim', role: 'Dougong Brackets & Canal Water' },
    ],
    landmarks: [
      { id: 'bd108-lm1', name: 'Grand Throne-Style Exhibition Hall', description: 'Monumental double-eaved hall with flying swallow-tail eaves and gold finials', tag: 'Hall' },
      { id: 'bd108-lm2', name: 'Triple Arched Moon Bridges', description: 'Gracefully bowed white marble bridges spanning the imperial lotus moat', tag: 'Bridges' },
    ],
    variants: {
      classic: { title: 'Forbidden City Treasure Museum', description: 'Gleaming yellow glazed tiles, vermilion pillars, and white marble terraces', accentColor: '#EAB308' },
      fantasy: { title: 'Jade Cloud Immortals Hall', description: 'Celestial green jade roof tiles with mist rising softly from silver canals', accentColor: '#10B981' },
      minimal: { title: 'Zen Imperial Silhouette', description: 'Charcoal slate tiles, natural cedar timber, and stark white sand gardens', accentColor: '#78350F' },
    },
  },

  // -----------------------------------------------------------------------
  // 9. Industrial Heritage & Locomotive Museum
  // -----------------------------------------------------------------------
  {
    id: 'BD-109',
    slug: 'building-museum-industrial-train-locomotive',
    name: 'Industrial Heritage & Locomotive Museum',
    subtitle: 'Grand Museum Complex · Modular Building',
    category: 'systems',
    categoryName: 'Grand Museums',
    worldLevel: 'level2_building',
    baseType: 'architectural_foundation',
    collection: 'buildings_museums',
    subcategories: ['Cast-Iron Vaulted Shed', 'Historic Locomotive Turntable', 'Victorian Clock Tower', 'Clerestory Glass Monitor'],
    theme: 'Authentic 19th-century railway terminus shed with cast-iron arches, red brick masonry, and historic steam engines.',
    description: 'A colossal industrial heritage museum occupying a magnificent Victorian train terminal hall with soaring iron-trussed barrel arches, a glazed clerestory roof monitor, a tall brick clock tower, and an outdoor operating roundhouse turntable featuring a historic steam locomotive.',
    polyCount: 5190,
    dimensionRatio: '1.4:1.25:1.55',
    minestWorldType: 'ModularBuilding',
    assetFileRef: 'minest/buildings/bd109_locomotive_museum.glb',
    terrainSpecs: {
      shape: 'terraced',
      underbelly: 'Cobblestone railway yard with inlaid steel tracks and switch levers',
      waterFeatures: 'Locomotive water crane tower with circular stone drain trough',
      foliage: 'Rugged dockland sycamore trees in iron tree guards',
      elevationLevels: 1,
    },
    palette: [
      { hex: '#991B1B', label: 'Victorian Red Brick', role: 'Terminal Hall Walls & Clock Tower' },
      { hex: '#1E293B', label: 'Wrought Iron Charcoal', role: 'Vaulted Trusses & Locomotive Body' },
      { hex: '#38BDF8', label: 'Clerestory Skylight Glass', role: 'Glazed Roof Monitor Ridge' },
      { hex: '#D97706', label: 'Brass & Copper Trim', role: 'Steam Boiler Bands & Clock Hands' },
    ],
    landmarks: [
      { id: 'bd109-lm1', name: 'Iron-Trussed Railway Terminal Shed', description: 'Grand vaulted glass-and-iron hall sheltering multi-tier historic train platforms', tag: 'TrainShed' },
      { id: 'bd109-lm2', name: 'Steam Locomotive on Turntable', description: 'Detailed low-poly black steam engine positioned on an outdoor rotating track', tag: 'Locomotive' },
    ],
    variants: {
      classic: { title: 'King’s Cross Railway Museum', description: 'Deep red brick, cast-iron dark grey trusses, and brass accents', accentColor: '#991B1B' },
      fantasy: { title: 'Steampunk Chrono-Train Depot', description: 'Gleaming polished copper pipes, spinning clockwork gears, and violet steam', accentColor: '#D97706' },
      minimal: { title: 'Clean Industrial Span', description: 'Matte charcoal steel portal frames with clear geometric glass clerestories', accentColor: '#1E293B' },
    },
  },

  // -----------------------------------------------------------------------
  // 10. Living Biosphere & Botanical Conservatory Museum
  // -----------------------------------------------------------------------
  {
    id: 'BD-110',
    slug: 'building-museum-biodiversity-living-biomes',
    name: 'Living Biosphere & Botanical Conservatory Museum',
    subtitle: 'Grand Museum Complex · Modular Building',
    category: 'nature',
    categoryName: 'Grand Museums',
    worldLevel: 'level2_building',
    baseType: 'architectural_foundation',
    collection: 'buildings_museums',
    subcategories: ['Triple Interconnected Bio-Domes', 'Treetop Canopy Skybridge', 'Indoor Waterfall Rockwork', 'Terraced Eco-Plazas'],
    theme: 'Three monumental interconnected geodesic glass biospheres harboring tropical rainforest and desert eco-systems.',
    description: 'An iconic botanical museum and living ecosystem research facility consisting of three interlocking geodesic bio-domes of varying heights, housing multi-tier indoor rainforests, a cascading mountain waterfall visible through transparent glass, and suspended treetop canopy skywalks.',
    polyCount: 5520,
    dimensionRatio: '1.4:1.3:1.6',
    minestWorldType: 'ModularBuilding',
    assetFileRef: 'minest/buildings/bd110_living_biomes.glb',
    terrainSpecs: {
      shape: 'circular',
      underbelly: 'Natural stone terraced garden beds with integrated walking ramps',
      waterFeatures: 'Cascading indoor waterfall draining into an outdoor perimeter pond',
      foliage: 'Dense lush tropical palms, broadleaf monstera, and flowering orchids',
      elevationLevels: 3,
    },
    palette: [
      { hex: '#10B981', label: 'Rainforest Emerald Glass', role: 'Interconnected Geodesic Domes' },
      { hex: '#F8FAFC', label: 'Spaceframe White Steel', role: 'Hexagonal Lattice Structure' },
      { hex: '#06B6D4', label: 'Waterfall Turquoise', role: 'Outdoor Lake & Water Cascade' },
      { hex: '#F59E0B', label: 'Canopy Bridge Amber', role: 'Suspended Aerial Walkway' },
    ],
    landmarks: [
      { id: 'bd110-lm1', name: 'Triple Geodesic Hexagonal Biomes', description: 'Three soaring transparent domes enclosing self-contained microclimates', tag: 'BioDomes' },
      { id: 'bd110-lm2', name: 'Suspended Treetop Canopy Skybridge', description: 'Curved aerial bridge leading visitors through high rainforest branches', tag: 'Skybridge' },
    ],
    variants: {
      classic: { title: 'Eden Living Earth Dome', description: 'Emerald and cyan geodesic glass, white spaceframe, and lush greenery', accentColor: '#10B981' },
      fantasy: { title: 'Bioluminescent Spore Conservatory', description: 'Glowing purple and teal fungal domes with floating spore particles', accentColor: '#A855F7' },
      minimal: { title: 'Pure Geodesic Crystal', description: 'Ultraclear glass facets with minimalist white structural struts', accentColor: '#F8FAFC' },
    },
  },

  // -----------------------------------------------------------------------
  // 11. Digital Media & Holographic Cyber Museum
  // -----------------------------------------------------------------------
  {
    id: 'BD-111',
    slug: 'building-museum-digital-media-cyber-matrix',
    name: 'Digital Media & Holographic Cyber Museum',
    subtitle: 'Grand Museum Complex · Modular Building',
    category: 'systems',
    categoryName: 'Grand Museums',
    worldLevel: 'level2_building',
    baseType: 'architectural_foundation',
    collection: 'buildings_museums',
    subcategories: ['Obsidian Monolith Cube', 'Glowing Cyber Circuit Ribbons', 'Cantilevered Glass Skyway', 'LED Voxel Pillar Plaza'],
    theme: 'Dark monolithic cyber fortress wrapped in neon optical circuits with an interactive digital projection plaza.',
    description: 'A museum dedicated to interactive digital arts and generative virtual worlds, designed as an imposing obsidian-black monolith pierced by glowing cyan and magenta optical fiber channels, connected by a high-altitude glazed skybridge over an interactive voxel plaza.',
    polyCount: 4890,
    dimensionRatio: '1.25:1.25:1.6',
    minestWorldType: 'ModularBuilding',
    assetFileRef: 'minest/buildings/bd111_digital_cyber_museum.glb',
    terrainSpecs: {
      shape: 'terraced',
      underbelly: 'Dark reflective obsidian plaza with recessed neon strip groundlights',
      waterFeatures: 'Liquid black mirror reflecting pool with submerged neon grids',
      foliage: 'Geometric glass light-pillars functioning as digital sculptures',
      elevationLevels: 2,
    },
    palette: [
      { hex: '#0F172A', label: 'Dark Matrix Obsidian', role: 'Monolithic Facade Panels' },
      { hex: '#06B6D4', label: 'Luminous Cyan Circuit', role: 'Glowing Exterior Light Ribbon' },
      { hex: '#EC4899', label: 'Neon Magenta Pulse', role: 'Skybridge Glass & Accent Crevices' },
      { hex: '#8B5CF6', label: 'Virtual Violet Glow', role: 'Plaza Interactive Voxel Pillars' },
    ],
    landmarks: [
      { id: 'bd111-lm1', name: 'Pierced Obsidian Digital Monolith', description: 'Dark futuristic geometric cube sliced by luminous light ribbon channels', tag: 'Monolith' },
      { id: 'bd111-lm2', name: 'Elevated Neon-Tuned Skyway', description: 'Suspended transparent glass walkway glowing with magenta edge lighting', tag: 'Skyway' },
    ],
    variants: {
      classic: { title: 'Cyber City Art Matrix', description: 'Deep obsidian facade, electric cyan circuit lines, and magenta glass bridges', accentColor: '#06B6D4' },
      fantasy: { title: 'Quantum Singularity Gallery', description: 'Swirling gravitational lens distortion ring hovering above the roof', accentColor: '#8B5CF6' },
      minimal: { title: 'Void & Monolith', description: 'Pure matte black cubic mass with a single razor-sharp cyan light slit', accentColor: '#0F172A' },
    },
  },

  // -----------------------------------------------------------------------
  // 12. Islamic Arts & Arabesque Court Museum
  // -----------------------------------------------------------------------
  {
    id: 'BD-112',
    slug: 'building-museum-islamic-arts-arabesque',
    name: 'Islamic Arts & Arabesque Court Museum',
    subtitle: 'Grand Museum Complex · Modular Building',
    category: 'culture',
    categoryName: 'Grand Museums',
    worldLevel: 'level2_building',
    baseType: 'architectural_foundation',
    collection: 'buildings_museums',
    subcategories: ['Carved Mashrabiya Facade', 'Horseshoe Arch Iwan', 'Turquoise Onion Cupola', 'Charbagh Four-Pool Court'],
    theme: 'Perforated stone lace mashrabiya facades, majestic horseshoe arches, turquoise domes, and serene cross-axial water rills.',
    description: 'A monument to Islamic artistic heritage featuring intricately carved stone screens, a monumental horseshoe-arched iwan entrance portal, brilliant turquoise ceramic onion cupolas, and a traditional quadripartite Charbagh courtyard with central fountain and running water rills.',
    polyCount: 5320,
    dimensionRatio: '1.35:1.2:1.45',
    minestWorldType: 'ModularBuilding',
    assetFileRef: 'minest/buildings/bd112_islamic_arts.glb',
    terrainSpecs: {
      shape: 'terraced',
      underbelly: 'Geometric zellige mosaic tile paving with four axial water rills',
      waterFeatures: 'Central tiered octagonal fountain spilling into crossed water channels',
      foliage: 'Fragrant orange trees and slender cypress columns in tiled planters',
      elevationLevels: 2,
    },
    palette: [
      { hex: '#FEF3C7', label: 'Warm Cream Limestone', role: 'Carved Walls & Mashrabiya Screens' },
      { hex: '#0D9488', label: 'Isfahan Turquoise Ceramic', role: 'Central Bulbous Dome & Minarets' },
      { hex: '#D97706', label: 'Lustre Glaze Gold', role: 'Geometric Parapet Trim & Finials' },
      { hex: '#1E3A8A', label: 'Cobalt Zellige Tile', role: 'Crossed Water Channels & Fountain Base' },
    ],
    landmarks: [
      { id: 'bd112-lm1', name: 'Grand Horseshoe-Arched Iwan Portal', description: 'Monumental recessed gateway framed by intricate geometric arabesque relief', tag: 'Iwan' },
      { id: 'bd112-lm2', name: 'Turquoise Mosaic Dome & Minaret Towers', description: 'Bulbous tiled cupola crowned with golden crescent finial and twin flanking minarets', tag: 'Dome' },
    ],
    variants: {
      classic: { title: 'Al-Andalus Heritage Court', description: 'Cream stone lace, turquoise ceramic domes, and azure fountain pools', accentColor: '#0D9488' },
      fantasy: { title: 'Thousand and One Nights Pavilion', description: 'Gilded starry domes with glowing lanterns floating in moonlit arcades', accentColor: '#F59E0B' },
      minimal: { title: 'Modern Mashrabiya Block', description: 'Contemporary cubic limestone volume with micro-perforated light patterns', accentColor: '#FEF3C7' },
    },
  },

  // -----------------------------------------------------------------------
  // 13. Nordic Timber Craft & Sculpture Museum
  // -----------------------------------------------------------------------
  {
    id: 'BD-113',
    slug: 'building-museum-nordic-wood-sculpture',
    name: 'Nordic Timber Craft & Sculpture Museum',
    subtitle: 'Grand Museum Complex · Modular Building',
    category: 'culture',
    categoryName: 'Grand Museums',
    worldLevel: 'level2_building',
    baseType: 'architectural_foundation',
    collection: 'buildings_museums',
    subcategories: ['Curved Glulam Wave Roof', 'Vertical Pine Slat Facade', 'Stepped Pine Amphitheater', 'Zen Birch Courtyard'],
    theme: 'Warm sculpted Scandinavian timber curves, soaring glued-laminated timber arches, and light-filled forest courtyards.',
    description: 'An organic celebration of Nordic design and timber craftsmanship, featuring sweeping double-curved glulam beam roofs, rhythmic vertical cedar slat screens that diffuse northern daylight, an outdoor amphitheater stepped into the pine slope, and a tranquil birch tree courtyard.',
    polyCount: 5040,
    dimensionRatio: '1.4:1.15:1.4',
    minestWorldType: 'ModularBuilding',
    assetFileRef: 'minest/buildings/bd113_nordic_timber.glb',
    terrainSpecs: {
      shape: 'mountainous',
      underbelly: 'Natural Scandinavian granite bedrock with stepped pine decking',
      waterFeatures: 'Clear reflective mountain stream pool along the wood promenade',
      foliage: 'Tall silver birch saplings and wild bilberry groundcover',
      elevationLevels: 2,
    },
    palette: [
      { hex: '#D97706', label: 'Nordic Glulam Pine', role: 'Curved Wave Roof Beams & Slat Walls' },
      { hex: '#78350F', label: 'Charred Shou Sugi Ban Wood', role: 'Lower Gallery Base & Window Reveals' },
      { hex: '#E0F2FE', label: 'Northern Sky Glass', role: 'Floor-to-Ceiling Forest View Windows' },
      { hex: '#94A3B8', label: 'Granite Bedrock Grey', role: 'Podium Slabs & Stepped Amphitheater' },
    ],
    landmarks: [
      { id: 'bd113-lm1', name: 'Continuous Glulam Wave Roof', description: 'Dramatically warped hyperbolic timber beam roof floating over glass walls', tag: 'TimberRoof' },
      { id: 'bd113-lm2', name: 'Open-Air Pine Forest Amphitheater', description: 'Stepped wooden bench seating embracing a central outdoor sculpture platform', tag: 'Amphitheater' },
    ],
    variants: {
      classic: { title: 'Fjord Heritage Wood Museum', description: 'Warm amber pine glulam, charred cedar accents, and clear forest glass', accentColor: '#D97706' },
      fantasy: { title: 'World Tree Sanctuary', description: 'Living boughs of an enchanted oak woven seamlessly with elven timber halls', accentColor: '#10B981' },
      minimal: { title: 'Slat & Glass Pavilion', description: 'Crisp parallel blonde wood fins creating pure linear light and shadow rhythm', accentColor: '#D97706' },
    },
  },

  // -----------------------------------------------------------------------
  // 14. Fortress Bastion & Military Armory Museum
  // -----------------------------------------------------------------------
  {
    id: 'BD-114',
    slug: 'building-museum-military-bastion-armory',
    name: 'Fortress Bastion & Military Armory Museum',
    subtitle: 'Grand Museum Complex · Modular Building',
    category: 'culture',
    categoryName: 'Grand Museums',
    worldLevel: 'level2_building',
    baseType: 'architectural_foundation',
    collection: 'buildings_museums',
    subcategories: ['Star Bastion Ramparts', 'Octagonal Stone Keep', 'Arched Brick Casemates', 'Timber Drawbridge Gate'],
    theme: 'Vauban-style star fortress ramparts, massive octagonal stone keep, and historic bronze artillery courtyards.',
    description: 'A formidable military history and armory museum built into a historic star-shaped bastion fortress, featuring thick battered granite ramparts, an octagonal central citadel keep, vaulted brick cannon embrasures, and a heavy timber drawbridge across a dry defensive moat.',
    polyCount: 5240,
    dimensionRatio: '1.45:1.2:1.45',
    minestWorldType: 'ModularBuilding',
    assetFileRef: 'minest/buildings/bd114_bastion_armory.glb',
    terrainSpecs: {
      shape: 'terraced',
      underbelly: 'Chiseled granite star bastion walls with earthen glacis slope',
      waterFeatures: 'Sunken defensive dry moat spanned by timber drawbridge',
      foliage: 'Clipped lawn berms and defensive hawthorn hedges along the counterscarp',
      elevationLevels: 3,
    },
    palette: [
      { hex: '#64748B', label: 'Fortress Granite Ashlar', role: 'Battered Ramparts & Central Keep' },
      { hex: '#78350F', label: 'Heavy Oak Timber', role: 'Drawbridge, Gates & Gun Carriages' },
      { hex: '#B45309', label: 'Casemate Brick Vaults', role: 'Arched Gun Enclosures' },
      { hex: '#F59E0B', label: 'Polished Bronze Artillery', role: 'Historic Cannon Barrels & Finials' },
    ],
    landmarks: [
      { id: 'bd114-lm1', name: 'Pentagonal Star Bastion Ramparts', description: 'Angular granite gun platforms with pointed corner watch-turrets (échauguettes)', tag: 'Bastion' },
      { id: 'bd114-lm2', name: 'Octagonal Armory Citadel Keep', description: 'Central stone fortress tower flying historical heraldic standards', tag: 'Keep' },
    ],
    variants: {
      classic: { title: 'Citadel Royal Armory', description: 'Grey granite bastions, warm brick casemates, and shining bronze cannons', accentColor: '#64748B' },
      fantasy: { title: 'Iron Bastion of the Wardens', description: 'Dwarven runic stone ramparts with glowing molten moat channels', accentColor: '#EA580C' },
      minimal: { title: 'Geometric Bastion Earthwork', description: 'Sharp crisp geometric grass and concrete embankments with precision slit embrasures', accentColor: '#64748B' },
    },
  },

  // -----------------------------------------------------------------------
  // 15. Haute Couture & Textile Design Museum
  // -----------------------------------------------------------------------
  {
    id: 'BD-115',
    slug: 'building-museum-haute-couture-fashion',
    name: 'Haute Couture & Textile Design Museum',
    subtitle: 'Grand Museum Complex · Modular Building',
    category: 'culture',
    categoryName: 'Grand Museums',
    worldLevel: 'level2_building',
    baseType: 'architectural_foundation',
    collection: 'buildings_museums',
    subcategories: ['Billowing Silk Ribbon Facade', 'Spiraling Catwalk Rotunda', 'Black Granite Mirror Pool', 'Champagne Metal Flutes'],
    theme: 'Fluid architectural ribbons mimicking flowing silk haute couture fabrics wrapping a spiral runway rotunda.',
    description: 'A glamorous temple to global fashion design and textile arts, draped in undulating pearlescent white metal ribbons that twist like fabric around a central spiraling catwalk rotunda, perched beside a black granite mirror pool with floating exhibition mannequins.',
    polyCount: 5160,
    dimensionRatio: '1.35:1.3:1.55',
    minestWorldType: 'ModularBuilding',
    assetFileRef: 'minest/buildings/bd115_haute_couture.glb',
    terrainSpecs: {
      shape: 'terraced',
      underbelly: 'Polished black terrazzo runway plaza with inset brass strip inlays',
      waterFeatures: 'Reflective black obsidian mirror pool framing the swirling facade',
      foliage: 'Sculptural white camellia trees in fluted bronze urns',
      elevationLevels: 2,
    },
    palette: [
      { hex: '#F8FAFC', label: 'Silk Pearlescent White', role: 'Undulating Fabric Ribbon Shells' },
      { hex: '#F59E0B', label: 'Champagne Gold Flute', role: 'Vertical Mullions & Rotunda Spire' },
      { hex: '#0F172A', label: 'Obsidian Black Runway', role: 'Reflective Base Plinth & Mirror Pool' },
      { hex: '#EC4899', label: 'Runway Rose Spotlight', role: 'Interior Central Catwalk Glow' },
    ],
    landmarks: [
      { id: 'bd115-lm1', name: 'Swirling Silk Ribbon Facade', description: 'Curved sculptural white ribbons twisting organically around the glass core', tag: 'SilkRibbon' },
      { id: 'bd115-lm2', name: 'Ascending Glass Catwalk Rotunda', description: 'Central spiral ramp visible through clear glass serving as an elevated fashion runway', tag: 'Rotunda' },
    ],
    variants: {
      classic: { title: 'Palais de la Mode', description: 'Pearl white silk curves, champagne gold trim, and black mirror pool', accentColor: '#F59E0B' },
      fantasy: { title: 'Weaver’s Celestial Loom', description: 'Gossamer threads of starlight woven into a shimmering crystalline spire', accentColor: '#EC4899' },
      minimal: { title: 'White Drape & Shadow', description: 'Monolithic pure white curvilinear folds with dramatic sculpted shade pockets', accentColor: '#F8FAFC' },
    },
  },

  // -----------------------------------------------------------------------
  // 16. Musical Instrument & Acoustic Science Museum
  // -----------------------------------------------------------------------
  {
    id: 'BD-116',
    slug: 'building-museum-musical-instruments-acoustic',
    name: 'Musical Instrument & Acoustic Science Museum',
    subtitle: 'Grand Museum Complex · Modular Building',
    category: 'culture',
    categoryName: 'Grand Museums',
    worldLevel: 'level2_building',
    baseType: 'architectural_foundation',
    collection: 'buildings_museums',
    subcategories: ['Cello-Form Resonator Body', 'Harp String Tensile Canopy', 'Stepped Lawn Amphitheater', 'Brass Horn Listening Pods'],
    theme: 'Sculptural architecture inspired by the carved body of a stringed cello and the sweeping cables of a concert harp.',
    description: 'An acoustic masterpiece and museum of world instruments, featuring a central auditorium hall shaped like the carved soundbox of a grand cello, spanned by a dramatic tensile cable canopy evoking concert harp strings, with outdoor brass sound-collector pavilions on an open-air concert lawn.',
    polyCount: 5140,
    dimensionRatio: '1.4:1.25:1.5',
    minestWorldType: 'ModularBuilding',
    assetFileRef: 'minest/buildings/bd116_musical_instruments.glb',
    terrainSpecs: {
      shape: 'terraced',
      underbelly: 'Acoustic radiating paving rings expanding like soundwaves',
      waterFeatures: 'Circular vibrating cymatic water basin in entrance plaza',
      foliage: 'Gently terraced grass concert lawn with blooming lavender strips',
      elevationLevels: 2,
    },
    palette: [
      { hex: '#B45309', label: 'Varnished Maple Cello', role: 'Curved Main Resonator Auditorium' },
      { hex: '#D97706', label: 'Orchestral Brass Horn', role: 'Listening Pods & Tensile Mast Caps' },
      { hex: '#E2E8F0', label: 'Harp String Tensile Cable', role: 'Radiating Roof Cable Net' },
      { hex: '#1E293B', label: 'Soundboard Ebony', role: 'Base Stage & Window Mullions' },
    ],
    landmarks: [
      { id: 'bd116-lm1', name: 'Curved Cello Resonator Hall', description: 'Gracefully bowed timber volume modeled on the body of a Stradivarius instrument', tag: 'CelloHall' },
      { id: 'bd116-lm2', name: 'Radiating Harp String Canopy', description: 'Tensile silver steel cables fanning out from a soaring brass mast to shade the lawn', tag: 'HarpCanopy' },
    ],
    variants: {
      classic: { title: 'Philharmonic Sound Palace', description: 'Warm varnished amber wood, bright brass horn pavilions, and silver strings', accentColor: '#B45309' },
      fantasy: { title: 'Chamber of the Sirens', description: 'Singing crystal bells and glowing silver strings harmonizing with the wind', accentColor: '#06B6D4' },
      minimal: { title: 'Soundwave Form & String', description: 'Matte bleached timber curves with razor-straight stainless steel cables', accentColor: '#D97706' },
    },
  },

  // -----------------------------------------------------------------------
  // 17. Deep Space Cosmology & Radio Telescope Museum
  // -----------------------------------------------------------------------
  {
    id: 'BD-117',
    slug: 'building-museum-cosmology-radio-telescope',
    name: 'Deep Space Cosmology & Radio Telescope Museum',
    subtitle: 'Grand Museum Complex · Modular Building',
    category: 'cosmos',
    categoryName: 'Grand Museums',
    worldLevel: 'level2_building',
    baseType: 'architectural_foundation',
    collection: 'buildings_museums',
    subcategories: ['Colossal Parabolic Dish', 'Brutalist Concrete Pylons', 'Twin Optical Domes', 'Planetary Orbit Plaza'],
    theme: 'Massive white radio dish antenna mounted on a brutalist concrete complex alongside twin optical telescope domes.',
    description: 'A monument to modern astrophysics and cosmological discovery, headlined by a giant steerable parabolic radio telescope dish resting atop a bold brutalist concrete support cradle, accompanied by twin optical telescope observation domes and a scaled planetary orbit plaza.',
    polyCount: 5290,
    dimensionRatio: '1.4:1.4:1.65',
    minestWorldType: 'ModularBuilding',
    assetFileRef: 'minest/buildings/bd117_cosmology_telescope.glb',
    terrainSpecs: {
      shape: 'mountainous',
      underbelly: 'Craggy high-altitude summit rock platform with concrete retaining walls',
      waterFeatures: 'Liquid mercury mirror demonstration pool in the subterranean atrium',
      foliage: 'Alpine gravel and hardy cushion plants along the observation deck',
      elevationLevels: 3,
    },
    palette: [
      { hex: '#F8FAFC', label: 'Parabolic Dish White', role: 'Giant Radio Antenna Receiver' },
      { hex: '#64748B', label: 'Brutalist Concrete Grey', role: 'Support Pylons & Museum Body' },
      { hex: '#38BDF8', label: 'Stellar Sky Optical Dome', role: 'Twin Revolving Cupola Domes' },
      { hex: '#F59E0B', label: 'Sub-Reflector Gold', role: 'Antenna Feed Horn & Plaza Planets' },
    ],
    landmarks: [
      { id: 'bd117-lm1', name: 'Giant Parabolic Radio Telescope Dish', description: 'Huge circular dish tilted toward the cosmos with tripod feed horn assembly', tag: 'RadioDish' },
      { id: 'bd117-lm2', name: 'Twin Summit Optical Domes', description: 'Slotted revolving observatory domes housing large research telescopes', tag: 'Domes' },
    ],
    variants: {
      classic: { title: 'Deep Space Observatory Complex', description: 'Crisp white antenna dish, raw concrete pylons, and sky-blue telescope domes', accentColor: '#38BDF8' },
      fantasy: { title: 'Cosmic Leyline Nexus', description: 'Levitating astrolabe rings drawing starlight down into a glowing vortex core', accentColor: '#8B5CF6' },
      minimal: { title: 'Dish, Cylinder & Horizon', description: 'Pure sculptural dish poised upon a minimalist board-formed concrete cylinder', accentColor: '#F8FAFC' },
    },
  },

  // -----------------------------------------------------------------------
  // 18. Mesoamerican Gold & Solar Artifact Museum
  // -----------------------------------------------------------------------
  {
    id: 'BD-118',
    slug: 'building-museum-mesoamerican-gold-solar',
    name: 'Mesoamerican Gold & Solar Artifact Museum',
    subtitle: 'Grand Museum Complex · Modular Building',
    category: 'culture',
    categoryName: 'Grand Museums',
    worldLevel: 'level2_building',
    baseType: 'architectural_foundation',
    collection: 'buildings_museums',
    subcategories: ['Stepped Basalt Pyramid', 'Golden Solar Altar Crown', 'Feathered Serpent Ramps', 'Sunken Obsidian Pool'],
    theme: 'Stepped volcanic stone pyramid complex with gold-inlaid crowning temple and feathered serpent stair balustrades.',
    description: 'A monument to pre-Columbian civilization and gold metallurgy, designed as a terraced dark basalt stepped pyramid crowned by an open-air golden sun sanctuary, flanked by feathered serpent stair ramps and centered around an obsidian ceremonial reflecting pool.',
    polyCount: 5260,
    dimensionRatio: '1.4:1.2:1.45',
    minestWorldType: 'ModularBuilding',
    assetFileRef: 'minest/buildings/bd118_mesoamerican_solar.glb',
    terrainSpecs: {
      shape: 'terraced',
      underbelly: 'Carved dark volcanic basalt terraces with carved geometric friezes',
      waterFeatures: 'Square black obsidian reflecting basin at the pyramid base',
      foliage: 'Jungle monstera, wild bromeliads, and cacao trees bordering the plaza',
      elevationLevels: 3,
    },
    palette: [
      { hex: '#334155', label: 'Dark Volcanic Basalt', role: 'Stepped Pyramid Base & Platforms' },
      { hex: '#EAB308', label: 'Solar Incan Gold', role: 'Crowning Sun Temple & Relief Glyphs' },
      { hex: '#0D9488', label: 'Imperial Jade Green', role: 'Carved Serpent Eyes & Column Trim' },
      { hex: '#EA580C', label: 'Ceremonial Ochre Red', role: 'Stair Inset Panels & Altar Hearth' },
    ],
    landmarks: [
      { id: 'bd118-lm1', name: 'Stepped Volcanic Stone Pyramid', description: 'Five-tiered basalt pyramid platform ascended by steep ceremonial stairs', tag: 'Pyramid' },
      { id: 'bd118-lm2', name: 'Gilded Sun Altar Sanctuary', description: 'Polished gold temple crest capturing the morning equinox light rays', tag: 'SunAltar' },
    ],
    variants: {
      classic: { title: 'Temple of the Sun Gods', description: 'Dark volcanic stone, brilliant gold altar temple, and jade carved trim', accentColor: '#EAB308' },
      fantasy: { title: 'Solar Core Pyramid', description: 'Glowing solar plasma sphere levitating inside the temple sanctuary', accentColor: '#F97316' },
      minimal: { title: 'Basalt Step & Gold Blade', description: 'Monolithic sharp basalt steps bisected by a single vertical gold incision', accentColor: '#334155' },
    },
  },

  // -----------------------------------------------------------------------
  // 19. Earth-Sheltered Indigenous Anthropology Museum
  // -----------------------------------------------------------------------
  {
    id: 'BD-119',
    slug: 'building-museum-earth-sheltered-indigenous',
    name: 'Earth-Sheltered Indigenous Anthropology Museum',
    subtitle: 'Grand Museum Complex · Modular Building',
    category: 'culture',
    categoryName: 'Grand Museums',
    worldLevel: 'level2_building',
    baseType: 'architectural_foundation',
    collection: 'buildings_museums',
    subcategories: ['Turf-Covered Earth Mounds', 'Conical Timber Skylight Horn', 'Carved Cedar Totem Poles', 'Sunken Council Fire Pit'],
    theme: 'Subterranean green turf mounds with a soaring spiraling timber skylight cone and carved cedar totem courtyard.',
    description: 'An eco-anthropology museum honoring global indigenous cultures, built under gently rolling grass-turf earth mounds with a dramatic spiraling timber skylight horn erupting from the center, framed by monumental carved cedar totem poles around a sunken council hearth.',
    polyCount: 5080,
    dimensionRatio: '1.45:1.15:1.5',
    minestWorldType: 'ModularBuilding',
    assetFileRef: 'minest/buildings/bd119_earth_indigenous.glb',
    terrainSpecs: {
      shape: 'irregular',
      underbelly: 'Natural undulating turf hillock seamlessly blending into ground',
      waterFeatures: 'Natural gravel bed spring brook meandering around the mounds',
      foliage: 'Wild prairie grasses, sweetgrass patches, and native birch clusters',
      elevationLevels: 2,
    },
    palette: [
      { hex: '#16A34A', label: 'Living Turf Green', role: 'Undulating Earth-Sheltered Mound Roof' },
      { hex: '#78350F', label: 'Carved Cedar Timber', role: 'Totem Poles & Council Pit Framing' },
      { hex: '#D97706', label: 'Spiraling Skylight Cone', role: 'Central Conical Wood Skylight Horn' },
      { hex: '#E2E8F0', label: 'Rammed Earth Cream', role: 'Exposed Gallery Retaining Walls' },
    ],
    landmarks: [
      { id: 'bd119-lm1', name: 'Spiraling Conical Timber Skylight Horn', description: 'Tapered wooden conical chimney funneling natural daylight into subterranean halls', tag: 'SkylightHorn' },
      { id: 'bd119-lm2', name: 'Carved Cedar Totem Pole Plaza', description: 'Trio of monumental indigenous totem poles guarding the sunken circular fire pit', tag: 'TotemPoles' },
    ],
    variants: {
      classic: { title: 'First Peoples Living Earth Museum', description: 'Lush green turf mounds, warm cedar cones, and authentic totem carvings', accentColor: '#16A34A' },
      fantasy: { title: 'Shamanic Earth Mound Sanctuary', description: 'Bioluminescent green moss and glowing spirit runes carved into ancient trunks', accentColor: '#10B981' },
      minimal: { title: 'Turf Fold & Timber Ocular', description: 'Pure sculptural grass berm folded around a minimalist circular timber eye', accentColor: '#16A34A' },
    },
  },

  // -----------------------------------------------------------------------
  // 20. Futuristic AI Innovation & Civilization Center
  // -----------------------------------------------------------------------
  {
    id: 'BD-120',
    slug: 'building-museum-future-ai-innovation-hall',
    name: 'Futuristic AI Innovation & Civilization Center',
    subtitle: 'Grand Museum Complex · Modular Building',
    category: 'systems',
    categoryName: 'Grand Museums',
    worldLevel: 'level2_building',
    baseType: 'architectural_foundation',
    collection: 'buildings_museums',
    subcategories: ['Double-Helix Skyway Bridge', 'Twin Curving Tech Towers', 'Floating Magnetic Halo Ring', 'Liquid-Cooling Reflection Canal'],
    theme: 'Twin streamlined aerodynamic hyper-tech towers linked by a double-helix skyway and a levitating golden singularity halo.',
    description: 'A monument to artificial intelligence and future human civilization, featuring twin aerodynamic white towers connected by an illuminated double-helix structural skybridge, crowned by a floating golden magnetic halo ring suspended over a liquid-nitrogen cooling reflection canal.',
    polyCount: 5490,
    dimensionRatio: '1.4:1.35:1.7',
    minestWorldType: 'ModularBuilding',
    assetFileRef: 'minest/buildings/bd120_ai_innovation_center.glb',
    terrainSpecs: {
      shape: 'circular',
      underbelly: 'High-tech hexagonal paver podium with integrated cyan cooling conduit grids',
      waterFeatures: 'Central liquid-crystal reflection canal crossed by transparent glass paths',
      foliage: 'Architectural vertical algae bioscreens integrated into tower flanks',
      elevationLevels: 3,
    },
    palette: [
      { hex: '#F8FAFC', label: 'Aerodynamic Ceramic White', role: 'Twin Curving Tower Shells' },
      { hex: '#38BDF8', label: 'Quantum Cyan Glass', role: 'Double-Helix Skyway & Windows' },
      { hex: '#F59E0B', label: 'Levitating Halo Gold', role: 'Magnetic Singularity Ring & Crown' },
      { hex: '#1E293B', label: 'Carbon Fiber Slate', role: 'Tower Spines & Base Foundations' },
    ],
    landmarks: [
      { id: 'bd120-lm1', name: 'Suspended Double-Helix Skyway', description: 'Two twisting intertwined glass and steel walkways bridging the twin towers', tag: 'DoubleHelix' },
      { id: 'bd120-lm2', name: 'Floating Singularity Halo Ring', description: 'Hovering golden toroid representing artificial superintelligence over the plaza', tag: 'HaloRing' },
    ],
    variants: {
      classic: { title: 'AI Singularity World Expo', description: 'Pristine white ceramic hulls, cyan skyway bridge, and golden floating halo', accentColor: '#38BDF8' },
      fantasy: { title: 'Aetheric Stargate Citadel', description: 'Levitating crystal obelisks spinning around a pulsating dimensional portal', accentColor: '#8B5CF6' },
      minimal: { title: 'Twin Needles & Ring', description: 'Ultra-slender tapered white fins clasping a razor-thin floating gold toroid', accentColor: '#F8FAFC' },
    },
  },
];
