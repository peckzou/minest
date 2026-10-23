import { IslandMetadata } from '../types/island';

// =========================================================================
// Minest World Visual Library 7.1 — 20 Large Outdoor Expo Sets (EXP-SET-01 to EXP-SET-20)
// Complete 3D outdoor festival & trade expo diorama environments including:
// Architectural Pavilions, Tensile Canopies, Complete Display Racks & Shelves,
// Showcase Vitrines, Thematic Hero Exhibits, Kiosks, and Visitor Landscaping.
// =========================================================================

export const OUTDOOR_EXPO_SETS_DATA: IslandMetadata[] = [
  // =========================================================================
  // 01. Future Green Mobility & Concept EV Pavilion Set
  // =========================================================================
  {
    id: 'diorama_expo_01_green_mobility',
    slug: 'diorama-expo-green-mobility',
    name: 'Future Green Mobility & Concept EV Open-Air Expo Set',
    subtitle: 'Outdoor Expo Set · Transportation & Clean Tech',
    category: 'systems',
    categoryName: 'Outdoor Expo Sets',
    worldLevel: 'level2_diorama',
    baseType: 'architectural_foundation',
    collection: 'category_outdoor_expo_sets',
    subcategories: [
      'Tensile Membrane Wing Canopy',
      'Rotating Illuminated Vehicle Turntable',
      'Aerodynamic Concept EV Prototype',
      'Dual Ultra-Fast Charging Totems',
      'Tiered Battery Spec & Powertrain Display Racks',
      'Digital Interactive Specs Kiosk & Stanchions',
    ],
    theme: 'Soaring aerodynamic white tensile fabric canopy housing an illuminated concept electric supercar turntable, smart charging pillars, and tiered battery tech displays.',
    description:
      'A complete outdoor motor-show exhibition set featuring a double-curved tensile fabric sail canopy on polished steel masts, a raised circular motorized presentation turntable displaying a futuristic concept sports vehicle, twin liquid-cooled charging pillars with LED pulse strips, a double-sided acrylic technical spec wall with exploded lithium battery cells, and branded chrome queue stanchions.',
    polyCount: 8120,
    dimensionRatio: '1:1:0.9',
    minestWorldType: 'CategoryDiorama',
    assetFileRef: 'diorama_expo_green_mobility_v1.glb',
    terrainSpecs: {
      shape: 'terraced',
      underbelly: 'Beveled anthracite aggregate plaza pavers with recessed linear LED lighting strips',
      waterFeatures: 'Linear perimeter mist cooling fountain jets',
      foliage: 'Trimmed modern hedge cubes in brushed stainless steel planter troughs',
      elevationLevels: 3,
    },
    palette: [
      { hex: '#0EA5E9', label: 'Electric Cyan Glow', role: 'LED Lighting & Accent Trim' },
      { hex: '#0F172A', label: 'Anthracite Plaza Pavers', role: 'Main Pavement Slabs' },
      { hex: '#F8FAFC', label: 'Tensile Fabric Membrane', role: 'Double-Curved Shade Canopy' },
      { hex: '#64748B', label: 'Brushed Titanium Alloy', role: 'Support Masts & Display Frames' },
      { hex: '#10B981', label: 'Eco Flora Green', role: 'Architectural Planter Hedges' },
    ],
    landmarks: [
      { id: 'exp01-lm1', name: 'Tensile Fabric Aerodynamic Wing Canopy', description: 'Dual-cantilevered white fabric sail supported by angled brushed steel structural pylons', tag: 'Architecture' },
      { id: 'exp01-lm2', name: 'Revolving Concept EV Turntable', description: 'Raised circular stage with perimeter halo lighting displaying an aerodynamic futuristic vehicle', tag: 'Centerpiece' },
      { id: 'exp01-lm3', name: 'Tiered Battery Pack & Powertrain Showcase Rack', description: 'Multi-level transparent acrylic shelving showing modular battery modules and motors', tag: 'Display Rack' },
      { id: 'exp01-lm4', name: 'Interactive Specs Totem & Charging Post', description: 'Sleek freestanding touchscreen pillar beside rapid charging dispenser cord', tag: 'Kiosk' },
    ],
    variants: {
      classic: { title: 'Alpine Clean Mobility', description: 'Pure arctic white canopy, slate gray granite plaza, and azure blue neon glow accents', accentColor: '#0EA5E9' },
      fantasy: { title: 'Solarion Speed Core', description: 'Bioluminescent purple energy pylons with floating antigravity wheel hub rings', accentColor: '#A855F7' },
      minimal: { title: 'Monochrome Monolith', description: 'Matte black steel framework with seamless white floor and crisp architectural spotlighting', accentColor: '#F8FAFC' },
    },
  },

  // =========================================================================
  // 02. Aerospace & Orbital Satellite Open-Air Expo Set
  // =========================================================================
  {
    id: 'diorama_expo_02_aerospace_satellite',
    slug: 'diorama-expo-aerospace-satellite',
    name: 'Aerospace & Orbital Satellite Open-Air Pavilion Set',
    subtitle: 'Outdoor Expo Set · Frontier Space Tech',
    category: 'systems',
    categoryName: 'Outdoor Expo Sets',
    worldLevel: 'level2_diorama',
    baseType: 'architectural_foundation',
    collection: 'category_outdoor_expo_sets',
    subcategories: [
      'Heavy Quad-Aluminum Space Truss Gantry',
      'Scale Orbital Communication Satellite Model',
      'Rocket Engine Nozzle on Tilting Steel Cradle',
      'Glass-Enclosed Meteorite Specimen Vitrine',
      'Tiered Avionics Circuit Rack Tower',
      'Telemetry Mission Control Console Kiosk',
    ],
    theme: 'Heavy industrial silver space-truss portal frame with a scale satellite with extended gold solar arrays, rocket engine test cradle, and aerospace display vitrines.',
    description:
      'An open-air aerospace expo exhibition set constructed of silver box-section structural trusses. Features a 1:5 scale communications satellite suspended with dual shimmering gold polyimide solar panels, a heavy-duty steel transport cradle bearing a liquid rocket nozzle, illuminated glass showcase pedestals with genuine lunar meteorite fragments, a multi-tier server rack displaying avionics telemetry computers, and a mission control touch kiosk.',
    polyCount: 8460,
    dimensionRatio: '1:1:1.0',
    minestWorldType: 'CategoryDiorama',
    assetFileRef: 'diorama_expo_aerospace_satellite_v1.glb',
    terrainSpecs: {
      shape: 'terraced',
      underbelly: 'Industrial brushed aluminum runway decking with safety hatch plates',
      waterFeatures: 'None',
      foliage: 'Minimalist volcanic black gravel borders with yellow hazard stripes',
      elevationLevels: 3,
    },
    palette: [
      { hex: '#E2E8F0', label: 'Structural Satin Aluminum', role: 'Space Trusses & Crane Gantry' },
      { hex: '#F59E0B', label: 'Gold Polyimide Foil', role: 'Satellite Solar Panels & Heat Blankets' },
      { hex: '#1E293B', label: 'Deep Space Navy Plinth', role: 'Heavy Base Platforms & Consoles' },
      { hex: '#3B82F6', label: 'Telemetry Cyan Pulse', role: 'Display Backlights & LED Trackers' },
      { hex: '#EF4444', label: 'Rocket Safety Crimson', role: 'Crane Hooks & Hazard Line Markers' },
    ],
    landmarks: [
      { id: 'exp02-lm1', name: 'Overhead Industrial Truss Gantry', description: 'Four-legged silver aluminum box-truss tower with directional overhead LED floodlights', tag: 'Architecture' },
      { id: 'exp02-lm2', name: 'Orbital Satellite with Gold Solar Arrays', description: 'Precision scale satellite bus suspended on polished stainless steel cable stays', tag: 'Centerpiece' },
      { id: 'exp02-lm3', name: 'Rocket Engine Nozzle on Cradle', description: 'Fluted titanium rocket engine bell mounted on an adjustable hydraulic transport skid', tag: 'Display Rack' },
      { id: 'exp02-lm4', name: 'Illuminated Meteorite Specimen Vitrines', description: 'Dual glass cube vitrines on brushed steel pylons displaying space rock fragments', tag: 'Vitrine' },
    ],
    variants: {
      classic: { title: 'Cape Canaveral Spacefest', description: 'Satin aluminum trusses, gold foil satellite arrays, and navy engineering decking', accentColor: '#F59E0B' },
      fantasy: { title: 'Deep Orbit Starport', description: 'Midnight obsidian trusses with pulsing ultraviolet plasma conduits', accentColor: '#8B5CF6' },
      minimal: { title: 'White Titanium Laboratory', description: 'Clean white powder-coated truss members with crystal clear museum acrylic cases', accentColor: '#E2E8F0' },
    },
  },

  // =========================================================================
  // 03. Smart Robotics & Bionic AI Interactive Demo Set
  // =========================================================================
  {
    id: 'diorama_expo_03_robotics_ai',
    slug: 'diorama-expo-robotics-ai',
    name: 'Smart Robotics & Bionic AI Interactive Demo Plaza Set',
    subtitle: 'Outdoor Expo Set · Robotics & Automation',
    category: 'systems',
    categoryName: 'Outdoor Expo Sets',
    worldLevel: 'level2_diorama',
    baseType: 'architectural_foundation',
    collection: 'category_outdoor_expo_sets',
    subcategories: [
      'Hexagonal Polycarbonate Sunshade Canopy',
      '6-Axis Industrial Robotic Arm Demo Arena',
      'Safety Polycarbonate Barrier Enclosure',
      'Tiered Robotic End-Effector Tool Racks',
      'Quadruped Robot Dog Charging Dock',
      'Interactive Programming Tablet Podium Bar',
    ],
    theme: 'Hexagonal futuristic sunshade hub featuring an active 6-axis robotic arm demonstrator, robotic dog docking pad, component tool racks, and interactive coder terminals.',
    description:
      'A dynamic high-tech outdoor robotics expo set featuring a geometric hexagonal sun canopy on angled pylons. Central arena contains an articulated 6-axis robot arm on a safety plinth performing precision picking drills inside an acrylic fence, flanked by a 3-tier angled shelving rack exhibiting interchangeable magnetic grippers and LiDAR sensors, an induction charging mat for a quadruped robot dog, and interactive tablet consoles for visitor coding tests.',
    polyCount: 7920,
    dimensionRatio: '1:1:0.85',
    minestWorldType: 'CategoryDiorama',
    assetFileRef: 'diorama_expo_robotics_ai_v1.glb',
    terrainSpecs: {
      shape: 'terraced',
      underbelly: 'Dual-tone matte gray anti-static industrial resin plaza tiles',
      waterFeatures: 'None',
      foliage: 'Integrated vertical hydroponic green column dividers',
      elevationLevels: 2,
    },
    palette: [
      { hex: '#F97316', label: 'Kuka Industrial Safety Orange', role: 'Robot Arm & Safety Racks' },
      { hex: '#0F172A', label: 'Dark Carbon Composite', role: 'Enclosure Frame & Tablet Mounts' },
      { hex: '#F1F5F9', label: 'Matte White Polycarbonate', role: 'Hex Canopy Panels & Housing' },
      { hex: '#06B6D4', label: 'Cyan Laser Sensor Beams', role: 'Safety Enclosure Glow & Halo' },
    ],
    landmarks: [
      { id: 'exp03-lm1', name: 'Hexagonal Geometric Canopy', description: 'Cantilevered white honeycomb sunshade with integrated halo ring illumination', tag: 'Architecture' },
      { id: 'exp03-lm2', name: '6-Axis Articulated Robot Arm Arena', description: 'Precision multi-jointed industrial arm mounted on heavy-duty bolted steel stanchion', tag: 'Centerpiece' },
      { id: 'exp03-lm3', name: 'End-Effector & Sensor Slatwall Rack', description: 'Wall-mounted tiered aluminum louver rack holding vacuum grippers and 3D camera sensors', tag: 'Display Rack' },
      { id: 'exp03-lm4', name: 'Quadruped Robotic Dog Charging Dock', description: 'Yellow-and-black cybernetic patrol dog resting on induction wireless charging mat', tag: 'Exhibit' },
    ],
    variants: {
      classic: { title: 'RoboTech Expo Germany', description: 'Safety orange robotic arms, dark carbon composite pillars, and cyan status lighting', accentColor: '#F97316' },
      fantasy: { title: 'Cybernetic Golem Forge', description: 'Bronze and rune-inscribed mechanical limbs with molten gold arcane hydraulic fluids', accentColor: '#EAB308' },
      minimal: { title: 'Pure White Automation', description: 'Clinical matte white robot chassis with ultra-quiet brushless servo motors', accentColor: '#F1F5F9' },
    },
  },

  // =========================================================================
  // 04. Renewable Energy & Solar Eco-Plaza Set
  // =========================================================================
  {
    id: 'diorama_expo_04_renewable_energy',
    slug: 'diorama-expo-renewable-energy',
    name: 'Renewable Energy & Solar Eco-Plaza Demonstration Set',
    subtitle: 'Outdoor Expo Set · Clean Energy & Sustainability',
    category: 'nature',
    categoryName: 'Outdoor Expo Sets',
    worldLevel: 'level2_diorama',
    baseType: 'architectural_foundation',
    collection: 'category_outdoor_expo_sets',
    subcategories: [
      'Parametric Timber Pergola with Bifacial Solar Glass',
      'Scaled Modern Aerodynamic Wind Turbine Blade',
      'Modular Battery Energy Storage Cabinet Mockup',
      'Interactive Smart Grid Energy Flow Touch Table',
      'Living Succulent Planter Partition Wall',
      'Water Atomizing Cooling Misting Totem',
    ],
    theme: 'Warm glulam timber pergola supporting semi-transparent solar glass, a wind turbine wing tip section, battery storage racks, and green living wall displays.',
    description:
      'An inspiring open-air sustainability exhibition pavilion set featuring an undulating parametric glued-laminated timber pergola fitted with blue bifacial photovoltaic glass tiles. The stage features an authentic 3-meter aerodynamically sculpted wind turbine blade on timber trestles, a glass-sided cabinet revealing modular grid storage batteries, an illuminated circular touch table demonstrating renewable power distribution, and a lush living moss wall.',
    polyCount: 7650,
    dimensionRatio: '1:1:0.85',
    minestWorldType: 'CategoryDiorama',
    assetFileRef: 'diorama_expo_renewable_energy_v1.glb',
    terrainSpecs: {
      shape: 'terraced',
      underbelly: 'Recycled composite timber decking with permeable gravel drainage trenches',
      waterFeatures: 'Cascading bio-swale rainwater collection pondlet',
      foliage: 'Lush potted feather grasses and cedar planter boxes',
      elevationLevels: 2,
    },
    palette: [
      { hex: '#B45309', label: 'Glulam Honey Timber', role: 'Pergola Beams & Display Trestles' },
      { hex: '#1D4ED8', label: 'Monocrystalline Solar Blue', role: 'PV Glass Panels & Data Graphics' },
      { hex: '#15803D', label: 'Lush Living Foliage', role: 'Vertical Moss Wall & Planters' },
      { hex: '#F8FAFC', label: 'Composite Aerofoil White', role: 'Wind Turbine Blade Section' },
    ],
    landmarks: [
      { id: 'exp04-lm1', name: 'Parametric Solar Glass Pergola', description: 'Wave-form glulam wood framework sheltering exhibitors under semi-transparent solar glass', tag: 'Architecture' },
      { id: 'exp04-lm2', name: 'Wind Turbine Blade Tip Section', description: 'Curved aerodynamic composite blade supported on dual precision timber sawhorses', tag: 'Centerpiece' },
      { id: 'exp04-lm3', name: 'Modular Battery Rack & Inverter Tower', description: 'Steel rack cabinet with slide-out battery pack drawers and cooling fan grilles', tag: 'Display Rack' },
      { id: 'exp04-lm4', name: 'Interactive Smart-Grid Touch Table', description: 'Circular wooden console with glowing LED routes demonstrating regional energy transfer', tag: 'Kiosk' },
    ],
    variants: {
      classic: { title: 'Nordic Eco-Summit', description: 'Scandinavian blonde pine, clean solar blue glass, and living moss wall dividers', accentColor: '#10B981' },
      fantasy: { title: 'Sun-Weaver Arboretum', description: 'Living entwined branches holding floating amber sunstones that channel radiant warmth', accentColor: '#F59E0B' },
      minimal: { title: 'Carbon Neutral Studio', description: 'Ultra-thin carbon fiber pergola ribs with high-efficiency monocrystalline solar panes', accentColor: '#1D4ED8' },
    },
  },

  // =========================================================================
  // 05. Outdoor Adventure & Overland Glamping Expo Set
  // =========================================================================
  {
    id: 'diorama_expo_05_adventure_glamping',
    slug: 'diorama-expo-adventure-glamping',
    name: 'Outdoor Adventure & Overland Glamping Lifestyle Expo Set',
    subtitle: 'Outdoor Expo Set · Camping & Outdoor Gear',
    category: 'life',
    categoryName: 'Outdoor Expo Sets',
    worldLevel: 'level2_diorama',
    baseType: 'architectural_foundation',
    collection: 'category_outdoor_expo_sets',
    subcategories: [
      'Geodesic Khaki Canvas Dome Glamping Tent',
      'Overland Expedition 4x4 Vehicle with Rooftop Tent',
      'Titanium Cookware & Stoves Pegboard Display Rack',
      'Mountaineering Backpack & Apparel Mannequin Podiums',
      'Cedar Timber Decking with Sunken Campfire Lounge',
      'Cast Iron Dutch Oven Tripod Stand',
    ],
    theme: 'Rustic-luxury expedition glamping set with a geodesic dome, overland 4x4 with deployable rooftop tent, modular titanium camp kitchen racks, and campfire seating.',
    description:
      'A comprehensive outdoor lifestyle trade-show diorama set built on elevated cedar timber decking. Features an authentic geodesic dome glamping tent with panoramic clear bay window, an overland expedition vehicle sporting an open rooftop tent and side awning, a heavy-duty perforated steel pegboard displaying titanium cookware and camp axes, technical mannequin pedestals showing mountaineering suits, and a steel fire pit circle with canvas camp chairs.',
    polyCount: 8350,
    dimensionRatio: '1:1:0.9',
    minestWorldType: 'CategoryDiorama',
    assetFileRef: 'diorama_expo_adventure_glamping_v1.glb',
    terrainSpecs: {
      shape: 'terraced',
      underbelly: 'Natural interlocking cedar wood platform with river pebble border trenches',
      waterFeatures: 'None',
      foliage: 'Potted alpine dwarf pines and wild grass tussocks',
      elevationLevels: 2,
    },
    palette: [
      { hex: '#78350F', label: 'Dark Cedar Timber', role: 'Decking & Furniture Slats' },
      { hex: '#4D7C0F', label: 'Olive Drab Canvas', role: 'Glamping Dome & Awnings' },
      { hex: '#D97706', label: 'Campfire Amber Glow', role: 'Lanterns, Fire Pit & Warm Lights' },
      { hex: '#334155', label: 'Overland Gunmetal Steel', role: 'Vehicle Body, Pegboards & Racks' },
    ],
    landmarks: [
      { id: 'exp05-lm1', name: 'Geodesic Canvas Glamping Dome', description: 'Geometric faceted shelter with wooden entrance portal and cozy interior cot bed', tag: 'Architecture' },
      { id: 'exp05-lm2', name: 'Overland 4x4 Rig with Rooftop Tent', description: 'Rugged all-terrain SUV with folding aluminum rooftop tent and ladder deployed', tag: 'Centerpiece' },
      { id: 'exp05-lm3', name: 'Gear Pegboard & Titanium Kitchen Rack', description: 'Dual-sided matte black pegboard hung with titanium mugs, camp axes, and headlamps', tag: 'Display Rack' },
      { id: 'exp05-lm4', name: 'Campfire Gathering Circle', description: 'Steel fire brazier ring surrounded by four folding butterfly camp armchairs', tag: 'Lounge' },
    ],
    variants: {
      classic: { title: 'High Sierra Overland', description: 'Olive canvas, cedar wood decking, and glowing brass hurricane lanterns', accentColor: '#D97706' },
      fantasy: { title: 'Wayfarer Griffin Roost', description: 'Heavy hide canopy with carved elk antler frames and enchanted smoke braziers', accentColor: '#78350F' },
      minimal: { title: 'Ultralight Titanium Camp', description: 'Silnylon translucent white tarp with ultra-minimalist carbon fiber hiking poles', accentColor: '#334155' },
    },
  },

  // =========================================================================
  // 06. Superyacht & Marine Nautical Expo Set
  // =========================================================================
  {
    id: 'diorama_expo_06_superyacht_marine',
    slug: 'diorama-expo-superyacht-marine',
    name: 'Superyacht & Marine Nautical Luxury Open-Air Expo Set',
    subtitle: 'Outdoor Expo Set · Maritime & Luxury Yachts',
    category: 'culture',
    categoryName: 'Outdoor Expo Sets',
    worldLevel: 'level2_diorama',
    baseType: 'architectural_foundation',
    collection: 'category_outdoor_expo_sets',
    subcategories: [
      'Teak Yacht-Decking Platform with Inlaid Holly Stripes',
      'Polished Marine Grade 316 Stainless Steel Railings',
      'Precision 1:20 Scale Luxury Motor Yacht Model on Cradle',
      'Marine Navigation Radar & Helm Electronics Console',
      'Brass Binnacle & Ship Wheel Heritage Display',
      'Nautical Manila Rope Stanchions & Life Buoy Totem',
    ],
    theme: 'Polished teak yacht decking with stainless steel marine stanchions, scale superyacht hull display cradle, navigation radar consoles, and brass nautical vitrines.',
    description:
      'A prestigious Monaco-style outdoor marine boat show exhibition set. Laid with genuine caulked teak boat decking bordered by polished stainless steel rails, the set features a museum-grade 1:20 scale luxury motor yacht model resting on a mahogany cradle, a modern glass-bridge helm console displaying twin GPS plotters and engine gauges, an antique brass ship binnacle with magnetic compass, a wall rack showing boat propeller impellers, and blue nautical pennants.',
    polyCount: 7890,
    dimensionRatio: '1:1:0.85',
    minestWorldType: 'CategoryDiorama',
    assetFileRef: 'diorama_expo_superyacht_marine_v1.glb',
    terrainSpecs: {
      shape: 'terraced',
      underbelly: 'Natural stone harbor quay pier with blue water perimeter pool',
      waterFeatures: 'Translucent blue harbor water basin along two quay edges',
      foliage: 'Potted Mediterranean boxwood cones in white fiberglass planters',
      elevationLevels: 2,
    },
    palette: [
      { hex: '#B45309', label: 'Golden Honey Teak', role: 'Boat Decking Flooring' },
      { hex: '#E2E8F0', label: 'Polished 316 Stainless', role: 'Deck Stanchions & Hardware' },
      { hex: '#1E3A8A', label: 'Naval Navy Blue', role: 'Canopy Trim & Hull Stripe' },
      { hex: '#0284C7', label: 'Luminous Harbor Water', role: 'Perimeter Marina Moat' },
    ],
    landmarks: [
      { id: 'exp06-lm1', name: 'Open-Air Marina Harbor Berth', description: 'Teak wood pontoon quay bordered by stainless steel cable railings and mooring cleats', tag: 'Architecture' },
      { id: 'exp06-lm2', name: '1:20 Scale Superyacht Hull on Cradle', description: 'Sleek triple-deck yacht replica on a polished mahogany and chrome dry-dock cradle', tag: 'Centerpiece' },
      { id: 'exp06-lm3', name: 'Glass-Bridge Marine Helm Console Rack', description: 'Angled carbon fiber bridge simulator with dual multi-function navigation displays', tag: 'Display Rack' },
      { id: 'exp06-lm4', name: 'Brass Binnacle & Propeller Wall', description: 'Vintage brass pedestal compass alongside tiered chrome yacht propeller blades', tag: 'Vitrine' },
    ],
    variants: {
      classic: { title: 'Monaco Yacht Festival', description: 'Honey teak planks, polished mirror chrome, and crisp navy blue canvas shade sails', accentColor: '#1E3A8A' },
      fantasy: { title: 'Triton Sea-Galleon Pavilion', description: 'Iridescent mother-of-pearl decking with enchanted glowing starfish beacons', accentColor: '#0284C7' },
      minimal: { title: 'Aero-Hydro Foil Showcase', description: 'Pure white non-skid composite floor with ultra-slim titanium hydrofoil blades', accentColor: '#E2E8F0' },
    },
  },

  // =========================================================================
  // 07. Luxury Botanical & Landscape Floral Pavilion Set
  // =========================================================================
  {
    id: 'diorama_expo_07_botanical_floral',
    slug: 'diorama-expo-botanical-floral',
    name: 'Luxury Botanical & Landscape Floral Pavilion Set',
    subtitle: 'Outdoor Expo Set · Horticulture & Floral Art',
    category: 'nature',
    categoryName: 'Outdoor Expo Sets',
    worldLevel: 'level2_diorama',
    baseType: 'architectural_foundation',
    collection: 'category_outdoor_expo_sets',
    subcategories: [
      'Wrought-Iron Victorian Orangerie Open Framework',
      'Stepped White Marble Plant Display Bleachers',
      'Rare Orchid & Bonsai Glass Terrarium Pedestals',
      'Central Tiered Copper Water Fountain Basin',
      'Rose Flower Wall Backdrop Photo Partition',
      'Botanical Seedling Drawer Counter & Watering Can Rack',
    ],
    theme: 'Ornate white wrought-iron orangerie gazebo enclosing stepped marble plant display risers, rare orchid glass vitrines, a tiered water fountain, and flower walls.',
    description:
      'A romantic Chelsea Flower Show exhibition pavilion set featuring an open filigree white wrought-iron conservatory dome. The interior holds tiered three-step Carrara marble floral risers covered in exotic potted blossoms, three cylindrical glass pedestals housing championship miniature bonsai trees, a bubbling three-tier copper fountain, a dense living garden wall covered in roses and ivy, and a vintage oak potting workbench with seed drawers.',
    polyCount: 8200,
    dimensionRatio: '1:1:0.95',
    minestWorldType: 'CategoryDiorama',
    assetFileRef: 'diorama_expo_botanical_floral_v1.glb',
    terrainSpecs: {
      shape: 'circular',
      underbelly: 'Herringbone terracotta courtyard brick pavers with boxwood curb borders',
      waterFeatures: 'Central tiered three-spout copper water fountain',
      foliage: 'Dense flowering hydrangeas, climbing English roses, and topiary spheres',
      elevationLevels: 3,
    },
    palette: [
      { hex: '#15803D', label: 'Botanical Emerald Green', role: 'Living Foliage & Topiary' },
      { hex: '#F43F5E', label: 'English Rose Pink', role: 'Flower Wall & Floral Displays' },
      { hex: '#F8FAFC', label: 'Victorian Wrought Iron White', role: 'Conservatory Gazebo Framework' },
      { hex: '#B45309', label: 'Patinated Bronze & Terracotta', role: 'Fountain & Brick Paving' },
    ],
    landmarks: [
      { id: 'exp07-lm1', name: 'Victorian Filigree Orangerie Pavilion', description: 'Curved ornamental white ironwork dome supporting hanging brass fern baskets', tag: 'Architecture' },
      { id: 'exp07-lm2', name: 'Stepped Marble Botanical Display Bleachers', description: 'Three-tiered semi-circular white marble risers displaying exotic potted perennials', tag: 'Display Rack' },
      { id: 'exp07-lm3', name: 'Glass Terrarium Bonsai Pedestals', description: 'Three illuminated glass bell vitrines protecting prize 80-year-old juniper bonsai', tag: 'Vitrine' },
      { id: 'exp07-lm4', name: 'Central Three-Tier Copper Fountain', description: 'Ornate scalloped copper bowls with cascading water splashing into stone basin', tag: 'Water' },
    ],
    variants: {
      classic: { title: 'Chelsea Royal Pavilion', description: 'White wrought iron, terracotta bricks, and English pink climbing roses', accentColor: '#F43F5E' },
      fantasy: { title: 'Feywild Blossom Glasshouse', description: 'Twisted crystal vine pillars supporting bioluminescent moon-lilies that glow azure', accentColor: '#A855F7' },
      minimal: { title: 'Modernist Zen Conservatory', description: 'Matte black steel cubic pergola with single moss boulder and bamboo water spout', accentColor: '#15803D' },
    },
  },

  // =========================================================================
  // 08. Architectural Tech & Modular Prefab Living Set
  // =========================================================================
  {
    id: 'diorama_expo_08_architectural_prefab',
    slug: 'diorama-expo-architectural-prefab',
    name: 'Architectural Tech & Modular Prefab Living Pavilion Set',
    subtitle: 'Outdoor Expo Set · Architecture & Prefab Design',
    category: 'systems',
    categoryName: 'Outdoor Expo Sets',
    worldLevel: 'level2_diorama',
    baseType: 'architectural_foundation',
    collection: 'category_outdoor_expo_sets',
    subcategories: [
      'Cantilevered Cross-Laminated Timber (CLT) Portal Frame',
      '1:1 Scale Exposed Structural Wall Cross-Section Cutaway',
      'Material Swatch & Insulation Sample Sliding Drawer Rack',
      'Illuminated Masterplan Architectural Scale Model Podium',
      'Floor-to-Ceiling Low-E Double Glazed Glass Facade',
      'Architect Client Consultation Lounge Table & Stools',
    ],
    theme: 'Sleek modernist CLT timber and steel pavilion showcasing a 1:1 cutaway wall assembly, material swatch racks, architectural scale models, and meeting lounge.',
    description:
      'A cutting-edge Venice Biennale-style architectural tech exhibition set. Features a massive cantilevered warm cross-laminated timber roof portal sheltering a full-scale 1:1 wall cross-section showing insulation layers and exterior cladding, an industrial sliding-panel rack housing stone/wood/metal architectural material swatches, a central acrylic-cased scale model of an eco-skyscraper, and an open conference table with designer stools.',
    polyCount: 7780,
    dimensionRatio: '1:1:0.9',
    minestWorldType: 'CategoryDiorama',
    assetFileRef: 'diorama_expo_architectural_prefab_v1.glb',
    terrainSpecs: {
      shape: 'terraced',
      underbelly: 'Polished large-format light gray architectural concrete pavers',
      waterFeatures: 'Reflective shallow black granite water channel',
      foliage: 'Potted bamboo grove in rectangular dark zinc planters',
      elevationLevels: 2,
    },
    palette: [
      { hex: '#D97706', label: 'Cross-Laminated Warm Pine', role: 'CLT Beams & Portal Roof' },
      { hex: '#1E293B', label: 'Dark Charcoal Structural Steel', role: 'Columns & Window Mullions' },
      { hex: '#94A3B8', label: 'Architectural Fair-Faced Concrete', role: 'Floor Paving Slabs' },
      { hex: '#0EA5E9', label: 'Low-E Architectural Glass', role: 'Window Panes & Model Vitrine' },
    ],
    landmarks: [
      { id: 'exp08-lm1', name: 'Cantilevered CLT Portal Frame Canopy', description: 'Dramatic projecting wooden box-frame roof with embedded recessed warm spotlighting', tag: 'Architecture' },
      { id: 'exp08-lm2', name: '1:1 Structural Wall Section Cutaway', description: 'Vertical multi-layer display showing studs, vapor barrier, rockwool, and zinc cladding', tag: 'Centerpiece' },
      { id: 'exp08-lm3', name: 'Sliding Material Sample Swatch Rack', description: 'Overhead track with pull-out vertical display panels holding stone, oak, and metal tiles', tag: 'Display Rack' },
      { id: 'exp08-lm4', name: 'Acrylic-Covered Masterplan Scale Model', description: 'Illuminated 3D miniature city model on black monolith plinth with perimeter LED glow', tag: 'Vitrine' },
    ],
    variants: {
      classic: { title: 'Swiss Timber Innovation', description: 'Natural pine CLT, charcoal steel, and polished pale concrete pavers', accentColor: '#D97706' },
      fantasy: { title: 'Sky-Forge Architect Hall', description: 'Gleaming mithril beams holding levitating crystal blueprints and shifting walls', accentColor: '#38BDF8' },
      minimal: { title: 'Miesian Steel & Glass', description: 'Pure black I-beam framework with absolute planar transparency and zero ornamentation', accentColor: '#1E293B' },
    },
  },

  // =========================================================================
  // 09. Smart Agriculture & Drone Farming Field Set
  // =========================================================================
  {
    id: 'diorama_expo_09_smart_agriculture',
    slug: 'diorama-expo-smart-agriculture',
    name: 'Smart Agriculture & Drone Farming Open-Air Field Set',
    subtitle: 'Outdoor Expo Set · AgriTech & Smart Farming',
    category: 'nature',
    categoryName: 'Outdoor Expo Sets',
    worldLevel: 'level2_diorama',
    baseType: 'architectural_foundation',
    collection: 'category_outdoor_expo_sets',
    subcategories: [
      'Green Permeable Shade Netting Overhead Truss',
      'Large Octocopter Agricultural Spray Drone on Helipad',
      'Dual-Sided A-Frame Hydroponic Vertical Farming Towers',
      'Soil Sensor Probe & Weather Telemetry Station',
      'Grain & Seed Genetic Sample Glass Vitrine Bench',
      'Autonomous Tractor Navigation Computer Kiosk',
    ],
    theme: 'AgriTech demo set featuring an octocopter crop-dusting drone on an elevated landing pad, A-frame vertical hydroponic vegetable racks, soil sensor pods, and grain sample benches.',
    description:
      'A progressive outdoor agricultural technology expo set covered by lightweight green shading mesh on galvanized poles. Features an octocopter agricultural payload drone with folding carbon arms parked on a high-visibility helipad, two illuminated A-frame hydroponic vertical towers bursting with fresh greens, an autonomous soil sensor telemetry station with weather anemometer, a timber bench with glass tubes of heirloom crop seeds, and a farmer terminal.',
    polyCount: 8150,
    dimensionRatio: '1:1:0.85',
    minestWorldType: 'CategoryDiorama',
    assetFileRef: 'diorama_expo_smart_agriculture_v1.glb',
    terrainSpecs: {
      shape: 'terraced',
      underbelly: 'Natural compacted earth ground with wooden boardwalk pathway and turf plots',
      waterFeatures: 'Clear recirculating nutrient water tubes in hydroponics',
      foliage: 'Vertical butterhead lettuce rows and field corn crop demonstration boxes',
      elevationLevels: 2,
    },
    palette: [
      { hex: '#16A34A', label: 'Lush Crop Green', role: 'Hydroponics & Living Greens' },
      { hex: '#EAB308', label: 'Field Harvest Gold', role: 'Landing Pad Decals & Wheat Displays' },
      { hex: '#1F2937', label: 'Matte Carbon Composite', role: 'Drone Chassis & Structural Poles' },
      { hex: '#0284C7', label: 'Telemetry Cyan & Water', role: 'Irrigation Pipes & Digital Interface' },
    ],
    landmarks: [
      { id: 'exp09-lm1', name: 'Open Agro-Mesh Shade Canopy', description: 'Semi-translucent green sunshade netting stretched across galvanized steel pipe frame', tag: 'Architecture' },
      { id: 'exp09-lm2', name: 'Agricultural Spray Octocopter on Pad', description: 'Heavy-lift drone with eight folding rotor arms and dual atomizing spray nozzles', tag: 'Centerpiece' },
      { id: 'exp09-lm3', name: 'Twin A-Frame Hydroponic Tower Racks', description: 'Angled white PVC channel racks with cascading leafy lettuce lit by pink grow LEDs', tag: 'Display Rack' },
      { id: 'exp09-lm4', name: 'Heirloom Seed & Soil Core Vitrine Bench', description: 'Rustic pine worktable holding 12 sealed glass test cylinders of specialized seed strains', tag: 'Vitrine' },
    ],
    variants: {
      classic: { title: 'Iowa Agri-Tech Summit', description: 'Crop green, harvest gold, and weathered timber farm boardwalks', accentColor: '#16A34A' },
      fantasy: { title: 'Verdant Druid Spore Garden', description: 'Living wooden trellises with glowing blue mana-berries and hovering wooden beetles', accentColor: '#22C55E' },
      minimal: { title: 'Automated Hydro-Lab', description: 'Clean white vertical towers with precision calibrated magenta ultraviolet plant lamps', accentColor: '#EAB308' },
    },
  },

  // =========================================================================
  // 10. International Contemporary Sculpture Biennale Set
  // =========================================================================
  {
    id: 'diorama_expo_10_sculpture_biennale',
    slug: 'diorama-expo-sculpture-biennale',
    name: 'International Contemporary Sculpture Biennale Set',
    subtitle: 'Outdoor Expo Set · Fine Arts & Monumental Sculpture',
    category: 'culture',
    categoryName: 'Outdoor Expo Sets',
    worldLevel: 'level2_diorama',
    baseType: 'architectural_foundation',
    collection: 'category_outdoor_expo_sets',
    subcategories: [
      'Minimalist Brutalist Raw Concrete Plaza Slab',
      'Towering Corten Steel Twisted Monolith Sculpture',
      'Polished Mirror-Stainless Steel Gazing Ribbon Arc',
      'Low-Profile Basalt Bronze Sculpture Plinths',
      'Architectural Black Steel Catalog Dispenser Totem',
      'Recessed Directional Ground Spotlight Pits',
    ],
    theme: 'Minimalist brutalist concrete outdoor sculpture courtyard featuring an iconic rusted Corten steel twisted ribbon, mirror-finish stainless loop, and low basalt plinths.',
    description:
      'A sophisticated Venice Biennale outdoor sculpture pavilion set. Composed of raw board-formed architectural concrete slabs separated by crisp raked black gravel expansion joints. The space showcases a 3.5-meter twisting corten weathering steel monolith with rich rust patina, a fluid mirror-polished stainless steel torus ribbon sculpture that reflects the sky, two low basalt plinths displaying cast bronze abstract figurines, and museum-grade ground floodlights.',
    polyCount: 7540,
    dimensionRatio: '1:1:0.9',
    minestWorldType: 'CategoryDiorama',
    assetFileRef: 'diorama_expo_sculpture_biennale_v1.glb',
    terrainSpecs: {
      shape: 'terraced',
      underbelly: 'Board-formed exposed concrete platform with basalt gravel perimeter zones',
      waterFeatures: 'Shallow black granite reflecting pool mirroring the steel monolith',
      foliage: 'A single Japanese sculptured black pine tree in a square gravel court',
      elevationLevels: 2,
    },
    palette: [
      { hex: '#9A3412', label: 'Rusted Corten Steel Patina', role: 'Central Twisted Monolith' },
      { hex: '#CBD5E1', label: 'Mirror Polished Stainless', role: 'Reflective Ribbon Sculpture' },
      { hex: '#64748B', label: 'Brutalist Raw Concrete', role: 'Plaza Paving & Low Benches' },
      { hex: '#1E293B', label: 'Volcanic Basalt Black', role: 'Sculpture Plinths & Gravel' },
    ],
    landmarks: [
      { id: 'exp10-lm1', name: 'Open Sky Concrete Sculpture Court', description: 'Monolithic concrete terrace framed by low floating perimeter retaining benches', tag: 'Architecture' },
      { id: 'exp10-lm2', name: 'Twisted Corten Steel Monolith', description: 'Towering monumental origami-folded steel spire with organic warm rust texture', tag: 'Centerpiece' },
      { id: 'exp10-lm3', name: 'Mirror-Polished Stainless Ribbon Arc', description: 'Fluid infinity loop sculpture capturing high-contrast optical sky reflections', tag: 'Exhibit' },
      { id: 'exp10-lm4', name: 'Curator Brochure & Catalog Totem', description: 'Slim minimalist matte black steel totem with printed art exhibition programs', tag: 'Kiosk' },
    ],
    variants: {
      classic: { title: 'Venice Giardini Biennale', description: 'Raw gray concrete, rich orange Corten rust, and mirror-polished chrome reflections', accentColor: '#9A3412' },
      fantasy: { title: 'Celestial Astral Monoliths', description: 'Lapis lazuli obelisks with floating stellar rings that refract starlight into rainbow beams', accentColor: '#6366F1' },
      minimal: { title: 'Pure Plinth & Void', description: 'Stark monochromatic white terrazzo with a single razor-sharp black basalt cube', accentColor: '#64748B' },
    },
  },

  // =========================================================================
  // 11. Motorsport Pit Lane & Formula Racing Expo Set
  // =========================================================================
  {
    id: 'diorama_expo_11_motorsport_paddock',
    slug: 'diorama-expo-motorsport-paddock',
    name: 'Motorsport Pit Lane & Formula Racing Paddock Expo Set',
    subtitle: 'Outdoor Expo Set · Automotive Racing & Engineering',
    category: 'systems',
    categoryName: 'Outdoor Expo Sets',
    worldLevel: 'level2_diorama',
    baseType: 'architectural_foundation',
    collection: 'category_outdoor_expo_sets',
    subcategories: [
      'Red & Black Checkered Race Team Canopy Awning',
      'Elevated Hydraulic Pit Lift with Formula Monocoque Chassis',
      'Modular Rolling Snap-On Style Tool Cabinet Stacks',
      'Dual Carbon-Fiber Racing Slick Tire Rack Towers',
      'High-Speed Telemetry Monitor Wall & Boom Arm',
      'Pneumatic Air Gun Hoses & Quick-Fill Fuel Rig',
    ],
    theme: 'High-energy Formula paddock team tent with a formula racing car on hydraulic pit lifts, rolling red tool cabinets, tiered racing slick tire racks, and telemetry monitors.',
    description:
      'An electrifying motorsport paddock outdoor expo set replicating an authentic Grand Prix pit garage. Features a cantilevered red-and-black racing team awning, an elevated hydraulic scissor lift supporting a carbon-fiber formula racing car chassis with exposed front suspension, two rolling 7-drawer scarlet tool chest towers, an overhead truss with telemetry timing monitors and pneumatic air lines, and twin vertical tire racks loaded with Pirelli racing slicks.',
    polyCount: 8520,
    dimensionRatio: '1:1:0.85',
    minestWorldType: 'CategoryDiorama',
    assetFileRef: 'diorama_expo_motorsport_paddock_v1.glb',
    terrainSpecs: {
      shape: 'terraced',
      underbelly: 'Polished checkered epoxy paddock garage flooring with pit lane asphalt border',
      waterFeatures: 'None',
      foliage: 'None (Trackside concrete curbing with red-and-white rumble strips)',
      elevationLevels: 2,
    },
    palette: [
      { hex: '#DC2626', label: 'Rosso Corsa Racing Red', role: 'Canopy Roof, Tool Cabinets & Car Livery' },
      { hex: '#0F172A', label: 'Carbon Fiber Weave', role: 'Monocoque Body, Winglets & Tire Rubber' },
      { hex: '#FACC15', label: 'Pit Warning Yellow', role: 'Overhead Crane, Air Lines & Slicks Ring' },
      { hex: '#F8FAFC', label: 'Checkered Flag White', role: 'Epoxy Floor Tiles & Sponsor Graphics' },
    ],
    landmarks: [
      { id: 'exp11-lm1', name: 'Racing Team Paddock Awning', description: 'Cantilevered scarlet aluminum frame canopy with roll-down team storm curtains', tag: 'Architecture' },
      { id: 'exp11-lm2', name: 'Formula Single-Seater on Hydraulic Scissor Lift', description: 'Aerodynamic open-wheel formula race car elevated 40cm with front wing detached', tag: 'Centerpiece' },
      { id: 'exp11-lm3', name: 'Vertical Carbon Tire Rack Towers', description: 'Dual steel cage towers stacked with 8 pre-heated racing slick tires with yellow stripes', tag: 'Display Rack' },
      { id: 'exp11-lm4', name: 'Rolling Heavy-Duty Mechanic Tool Chestrack', description: 'Dual-tier scarlet powder-coated tool trolley with foam-cut precision socket trays', tag: 'Cabinet' },
    ],
    variants: {
      classic: { title: 'Monza Grand Prix Paddock', description: 'Racing red, carbon black, and checkered white epoxy garage flooring', accentColor: '#DC2626' },
      fantasy: { title: 'Hover-Racer Plasma Pit', description: 'Neon cyan mag-lev rings suspending an antigravity pod with pulsing blue coolant conduits', accentColor: '#06B6D4' },
      minimal: { title: 'Silver Arrow Engineering', description: 'Matte silver titanium body with brushed aluminum cabinets and clinical cool lighting', accentColor: '#0F172A' },
    },
  },

  // =========================================================================
  // 12. Eco Water Sports & Surf Culture Festival Set
  // =========================================================================
  {
    id: 'diorama_expo_12_surf_culture',
    slug: 'diorama-expo-surf-culture',
    name: 'Eco Water Sports & Surf Culture Festival Expo Set',
    subtitle: 'Outdoor Expo Set · Beach & Board Sports',
    category: 'life',
    categoryName: 'Outdoor Expo Sets',
    worldLevel: 'level2_diorama',
    baseType: 'architectural_foundation',
    collection: 'category_outdoor_expo_sets',
    subcategories: [
      'Bamboo & Natural Woven Palm Thatch Shade Pergola',
      'Vertical Slotted Cedar Surfboard Display Rack',
      'Inflatable SUP Paddleboard & Carbon Paddle Stand',
      'Neoprene Wetsuit Gantry Rack with Changing Cabana',
      'Vintage Pastel Turquoise Beach Cruiser Bicycle Stand',
      'Surfboard Wax, Fin Sets & Leash Acrylic Vitrine',
    ],
    theme: 'Coastal beach festival surf shop set with a woven bamboo pergola, vertical slotted surfboard rack, SUP boards, wetsuit hanging gantry, and retro beach cruiser bike.',
    description:
      'A sun-drenched outdoor surf culture lifestyle expo set. Built on a bleached driftwood timber deck adjoining golden beach sand, it features a natural bamboo pergola with fringed palm thatch, a 6-bay vertical cedar surfboard display rack holding colorful resin-tinted shortboards and fish shapes, an inflatable SUP paddleboard resting on timber crossbeams, a matte black wetsuit drying rack, and an acrylic vitrine displaying hydrodynamic surfboard fins.',
    polyCount: 7980,
    dimensionRatio: '1:1:0.85',
    minestWorldType: 'CategoryDiorama',
    assetFileRef: 'diorama_expo_surf_culture_v1.glb',
    terrainSpecs: {
      shape: 'terraced',
      underbelly: 'Natural weathered driftwood boardwalk seamlessly meeting golden beach sand',
      waterFeatures: 'Curved ocean wave shorebreak wash along sand edge',
      foliage: 'Potted fan palm trees and sea oats grasses in woven jute baskets',
      elevationLevels: 2,
    },
    palette: [
      { hex: '#0D9488', label: 'Pacific Ocean Teal', role: 'Surfboard Tint & Beach Cruiser Bike' },
      { hex: '#FDE047', label: 'Sun-Drenched Sand Gold', role: 'Beach Sand & Resin Highlights' },
      { hex: '#D97706', label: 'Natural Bamboo & Thatch', role: 'Pergola Poles & Roof Weave' },
      { hex: '#78350F', label: 'Bleached Driftwood Gray', role: 'Boardwalk Planking & Board Rack' },
    ],
    landmarks: [
      { id: 'exp12-lm1', name: 'Bamboo & Palm Thatch Coastal Pergola', description: 'Four thick bamboo corner posts supporting a rustic woven palm leaf shade roof', tag: 'Architecture' },
      { id: 'exp12-lm2', name: 'Vertical Slotted Surfboard Showcase Rack', description: 'Curved cedar upright rack holding six handcrafted foam-and-fiberglass surfboards', tag: 'Display Rack' },
      { id: 'exp12-lm3', name: 'Retro Beach Cruiser Bicycle & SUP Stand', description: 'Vintage turquoise cruiser with wicker basket parked next to an upright paddleboard', tag: 'Centerpiece' },
      { id: 'exp12-lm4', name: 'Surf Fin & Wax Accessory Counter', description: 'Driftwood display counter with glass top showing molded fiberglass fin sets and wax blocks', tag: 'Vitrine' },
    ],
    variants: {
      classic: { title: 'Huntington Surf Festival', description: 'Warm bamboo, turquoise boards, golden beach sand, and bleached boardwalk', accentColor: '#0D9488' },
      fantasy: { title: 'Triton Wave-Rider Shrine', description: 'Carved sea-serpent bone arbor with mother-of-pearl glide-boards hovering above glowing tide', accentColor: '#38BDF8' },
      minimal: { title: 'Scandinavian Cold-Water Surf', description: 'Nordic black pine timber shelter with minimalist matte white epoxy boards and dark wool rugs', accentColor: '#D97706' },
    },
  },

  // =========================================================================
  // 13. Heavy Machinery & Precision Mining Expo Set
  // =========================================================================
  {
    id: 'diorama_expo_13_heavy_machinery',
    slug: 'diorama-expo-heavy-machinery',
    name: 'Heavy Machinery & Precision Mining Open-Air Expo Set',
    subtitle: 'Outdoor Expo Set · Industrial Machinery & Mining',
    category: 'systems',
    categoryName: 'Outdoor Expo Sets',
    worldLevel: 'level2_diorama',
    baseType: 'architectural_foundation',
    collection: 'category_outdoor_expo_sets',
    subcategories: [
      'Massive Industrial Heavy Steel Frame Canopy',
      'Giant 3-Meter Excavator Rock Bucket with Replaceable Teeth',
      'Chrome Hydraulic Cylinder Section on Heavy Timber Cribbing',
      'Planetary Final Drive Gear & Sprocket Precision Display Stand',
      'Heavy-Duty Steel Tread-Plate Walkway with Safety Railings',
      'Ruggedized Mining Telemetry Touchscreen Kiosk',
    ],
    theme: 'Massive Caterpillar-yellow industrial steel portal canopy exhibiting an enormous excavator rock bucket, chrome hydraulic cylinders, planetary gearboxes, and safety walkways.',
    description:
      'A colossal outdoor heavy equipment and mining industry expo set. Sheltered by an oversized industrial yellow steel portal frame with safety hazard stripes, the centerpiece is an authentic 3-meter rock excavator bucket mounted on heavy oak railroad cribbing, a massive polished hydraulic boom cylinder with cutaway seals, an angled display stand holding a gleaming planetary gear reduction hub, and a ruggedized diamond-plate steel walkway.',
    polyCount: 8280,
    dimensionRatio: '1:1:0.95',
    minestWorldType: 'CategoryDiorama',
    assetFileRef: 'diorama_expo_heavy_machinery_v1.glb',
    terrainSpecs: {
      shape: 'terraced',
      underbelly: 'Heavy industrial reinforced concrete slab with steel drain grates and iron curb',
      waterFeatures: 'None',
      foliage: 'None (Crushed granite aggregate borders with yellow safety bollards)',
      elevationLevels: 3,
    },
    palette: [
      { hex: '#EAB308', label: 'Caterpillar Industrial Yellow', role: 'Canopy Frame, Bucket & Handrails' },
      { hex: '#1E293B', label: 'Cast Iron Armor Gray', role: 'Bucket Steel, Counterweights & Tracks' },
      { hex: '#E2E8F0', label: 'Hard-Chrome Hydraulic Rod', role: 'Hydraulic Piston & Ground Teeth' },
      { hex: '#DC2626', label: 'Safety Stanchion Red', role: 'Emergency Stops & Warning Decals' },
    ],
    landmarks: [
      { id: 'exp13-lm1', name: 'Industrial Heavy Steel Portal Canopy', description: 'Massive box-beam steel structure painted high-visibility yellow with overhead LED floods', tag: 'Architecture' },
      { id: 'exp13-lm2', name: '3-Meter Severe-Duty Rock Excavator Bucket', description: 'Massive cast manganese steel bucket with four heavy chisel teeth resting on oak cribbing', tag: 'Centerpiece' },
      { id: 'exp13-lm3', name: 'Cutaway Hydraulic Cylinder Display Stand', description: 'Chrome piston rod and cylinder barrel section showing high-pressure piston rings', tag: 'Display Rack' },
      { id: 'exp13-lm4', name: 'Planetary Gear & Bearing Display Pedestal', description: 'Precision-ground alloy gear teeth mounted on a rotating heavy steel pedestal', tag: 'Exhibit' },
    ],
    variants: {
      classic: { title: 'Bauma Mining Munich', description: 'Industrial yellow beams, hardened steel excavator bucket, and diamond plate floors', accentColor: '#EAB308' },
      fantasy: { title: 'Dwarven Deep-Core Drill Pit', description: 'Runed adamantine gantry holding a colossal magma-tipped spiral drill bit', accentColor: '#F97316' },
      minimal: { title: 'Precision Electro-Hydraulics', description: 'Matte slate gray frame with mirror-chrome hydraulic actuators and clinical blue graphics', accentColor: '#1E293B' },
    },
  },

  // =========================================================================
  // 14. VR & Metaverse Experiential Outdoor Pod Set
  // =========================================================================
  {
    id: 'diorama_expo_14_metaverse_vr',
    slug: 'diorama-expo-metaverse-vr',
    name: 'VR & Metaverse Experiential Outdoor Pod Expo Set',
    subtitle: 'Outdoor Expo Set · Extended Reality & Spatial Computing',
    category: 'systems',
    categoryName: 'Outdoor Expo Sets',
    worldLevel: 'level2_diorama',
    baseType: 'architectural_foundation',
    collection: 'category_outdoor_expo_sets',
    subcategories: [
      'Futuristic Translucent Geodesic Hologram Dome',
      'Dual Omnidirectional VR Motion Treadmill Platforms',
      'Ceiling-Suspended Articulated VR Headset Tether Booms',
      'Central Volumetric Hologram Projector Column',
      'Illuminated Participant Queue Barrier Maze with Floor LEDs',
      'Spectator Curved Curved OLED Screen Arc Wall',
    ],
    theme: 'Glowing futuristic geodesic dome pod with twin omnidirectional VR movement treadmills, overhead headset boom tethers, central hologram column, and spectator screens.',
    description:
      'A thrilling futuristic outdoor tech festival diorama set. Dominated by a semi-translucent geodesic dome framed in carbon fiber with embedded purple and cyan neon ribs. Inside, two participants stand on low-friction concave omnidirectional VR treadmills strapped into safety harnesses, connected to articulated ceiling booms holding spatial computing headsets. An external curved OLED video wall broadcasts the real-time virtual avatar simulation to spectators.',
    polyCount: 8410,
    dimensionRatio: '1:1:0.9',
    minestWorldType: 'CategoryDiorama',
    assetFileRef: 'diorama_expo_metaverse_vr_v1.glb',
    terrainSpecs: {
      shape: 'circular',
      underbelly: 'Dark reflective obsidian glass tiles with embedded interactive RGB floor LED strips',
      waterFeatures: 'None',
      foliage: 'None (Bioluminescent cybernetic planter columns with fiber optic reeds)',
      elevationLevels: 2,
    },
    palette: [
      { hex: '#8B5CF6', label: 'Metaverse Electric Violet', role: 'Dome Frame LEDs & Hologram Beams' },
      { hex: '#06B6D4', label: 'Cybernetic Neon Cyan', role: 'Floor Tracers & Treadmill Rings' },
      { hex: '#0F172A', label: 'Obsidian Carbon Composite', role: 'Dome Struts & Treadmill Base' },
      { hex: '#F8FAFC', label: 'Spatial Headset Gloss White', role: 'HMD Shells & Touch Terminals' },
    ],
    landmarks: [
      { id: 'exp14-lm1', name: 'Geodesic Cyber-Dome Canopy', description: 'Self-supporting geodesic dome structure with responsive neon-illuminated edge struts', tag: 'Architecture' },
      { id: 'exp14-lm2', name: 'Twin Omnidirectional VR Motion Treadmills', description: 'Dual concave frictionless locomotion platforms with safety harness rings', tag: 'Centerpiece' },
      { id: 'exp14-lm3', name: 'Central Volumetric Hologram Projector', description: 'Floor-to-ceiling glass cylinder projecting a rotating 3D virtual avatar wireframe', tag: 'Exhibit' },
      { id: 'exp14-lm4', name: 'Curved Spectator Live-Stream OLED Arc', description: 'Wall-mounted panoramic screen displaying the virtual world POV in real-time', tag: 'Display Rack' },
    ],
    variants: {
      classic: { title: 'SXSW Spatial Metaverse Pod', description: 'Electric violet neon, dark carbon composite, and glowing cyan floor pathways', accentColor: '#8B5CF6' },
      fantasy: { title: 'Astral Scrying Portal', description: 'Floating silver arches enclosing a swirling liquid mirror nexus of interdimensional visions', accentColor: '#EC4899' },
      minimal: { title: 'White Holo-Chamber', description: 'Pure matte white sphere interior with invisible ceiling sensor arrays and zero physical cables', accentColor: '#06B6D4' },
    },
  },

  // =========================================================================
  // 15. Heritage Crafts & Artisan Marketplace Set
  // =========================================================================
  {
    id: 'diorama_expo_15_heritage_crafts',
    slug: 'diorama-expo-heritage-crafts',
    name: 'Traditional Heritage Crafts & Artisan Fair Pavilion Set',
    subtitle: 'Outdoor Expo Set · Intangible Culture & Handcrafts',
    category: 'culture',
    categoryName: 'Outdoor Expo Sets',
    worldLevel: 'level2_diorama',
    baseType: 'architectural_foundation',
    collection: 'category_outdoor_expo_sets',
    subcategories: [
      'Mortise-and-Tenon Douglas Fir Wooden Pavilion with Batik Drapes',
      'Artisan Potter’s Wheel Workstation with Clay Jars',
      'Tiered Solid Walnut Lacquerware & Ceramic Display Shelves',
      'Hand-Woven Bamboo Screen Room Partitions',
      'Indigo Dyeing Vat with Drying Fabric Swag Banners',
      'Calligraphy & Tea Tasting Low Table Setting',
    ],
    theme: 'Traditional timber mortise-and-tenon pavilion with indigo batik fabric swags, working potter’s wheel bench, tiered lacquerware shelves, and woven bamboo screens.',
    description:
      'A culturally rich outdoor intangible cultural heritage exhibition set. Built using traditional mortise-and-tenon fir timber framing with overhead draped indigo tie-dye batik fabric banners fluttering in the breeze. Features an operational kick-potter’s wheel with wet clay vases, four-tiered walnut open shelves showcasing glazed celadon ceramics and gilded lacquer bowls, a cedar table with brass tea tasting sets, and woven bamboo lattices.',
    polyCount: 7850,
    dimensionRatio: '1:1:0.9',
    minestWorldType: 'CategoryDiorama',
    assetFileRef: 'diorama_expo_heritage_crafts_v1.glb',
    terrainSpecs: {
      shape: 'terraced',
      underbelly: 'Natural gray cobblestone courtyard paving with mossy stone curb borders',
      waterFeatures: 'Stone water trough basin with bamboo flowing water spout',
      foliage: 'Potted dwarf Japanese red maple and bamboo planters',
      elevationLevels: 2,
    },
    palette: [
      { hex: '#1E3A8A', label: 'Indigo Batik Dye Blue', role: 'Overhead Fabric Drapes & Banners' },
      { hex: '#78350F', label: 'Warm Douglas Fir Timber', role: 'Mortise-Tenon Pavilion & Shelves' },
      { hex: '#059669', label: 'Glazed Celadon Ceramic', role: 'Vases & Porcelain Exhibits' },
      { hex: '#D97706', label: 'Natural Woven Bamboo', role: 'Room Screens & Craft Baskets' },
    ],
    landmarks: [
      { id: 'exp15-lm1', name: 'Mortise-and-Tenon Timber Pavilion', description: 'Traditional jointed timber frame with natural grain and blue-and-white batik fabric canopies', tag: 'Architecture' },
      { id: 'exp15-lm2', name: 'Artisan Potter’s Wheel Workstation', description: 'Heavy timber work bench with wooden kick-wheel, clay turntable, and shaping tools', tag: 'Centerpiece' },
      { id: 'exp15-lm3', name: 'Tiered Walnut Ceramic Display Rack', description: 'Four-tier open shelving displaying assorted celadon bowls, vases, and teapots', tag: 'Display Rack' },
      { id: 'exp15-lm4', name: 'Bamboo Water Spout & Tea Tasting Table', description: 'Natural stone water wash basin alongside low wooden tea tasting counter and stools', tag: 'Lounge' },
    ],
    variants: {
      classic: { title: 'Kyoto Craftsmen Guild', description: 'Fir timber framing, deep indigo dyed cotton banners, and glazed celadon ceramics', accentColor: '#1E3A8A' },
      fantasy: { title: 'Ancient Spirit Weaver Lodge', description: 'Living cherry wood boughs hung with enchanted silk scrolls that depict moving ink paintings', accentColor: '#F43F5E' },
      minimal: { title: 'Contemporary Folk Art', description: 'Blonde Hinoki cypress timber joinery with monochromatic white porcelain vessels', accentColor: '#78350F' },
    },
  },

  // =========================================================================
  // 16. Pro Audio & Concert Stage Lighting Truss Set
  // =========================================================================
  {
    id: 'diorama_expo_16_pro_audio_lighting',
    slug: 'diorama-expo-pro-audio-lighting',
    name: 'Pro Audio & Concert Stage Lighting Truss Expo Set',
    subtitle: 'Outdoor Expo Set · Entertainment & Stage Tech',
    category: 'culture',
    categoryName: 'Outdoor Expo Sets',
    worldLevel: 'level2_diorama',
    baseType: 'architectural_foundation',
    collection: 'category_outdoor_expo_sets',
    subcategories: [
      'Quad-Aluminum Box-Truss Festival Stage Tower Arch',
      'Hanging Curved Line-Array Loudspeaker Column Stacks',
      'Motorized Moving-Head LED Spot & Beam Fixtures',
      'GrandMA Style Pro Audio Digital Mixing Console Desk',
      'Stack of Road-Ready Flight-Cases with LED VU Bars',
      'Professional Dynamic Studio Microphone Showcase Stand',
    ],
    theme: 'Heavy festival stage aluminum truss arch supporting curved line-array concert speaker clusters, motorized moving-head lights, road flight cases, and a pro mixing console.',
    description:
      'An explosive outdoor festival stage engineering expo set. Built around a 4-meter aluminum quad-truss portal frame supporting hanging curved arrays of line-array concert speakers, two motorized moving-head beam lights projecting colorful light cones, a flagship digital audio mixing console surface with illuminated faders on an ergonomic riser, heavy-duty black aluminum-trimmed flight case stacks, and a microphone vitrine.',
    polyCount: 8650,
    dimensionRatio: '1:1:1.0',
    minestWorldType: 'CategoryDiorama',
    assetFileRef: 'diorama_expo_pro_audio_lighting_v1.glb',
    terrainSpecs: {
      shape: 'terraced',
      underbelly: 'Heavy non-skid black textured stage deck risers with aluminum safety borders',
      waterFeatures: 'None',
      foliage: 'None (High-durability yellow rubber cable crossover protector ramps)',
      elevationLevels: 3,
    },
    palette: [
      { hex: '#94A3B8', label: 'Silver Box Aluminum Truss', role: 'Main Stage Overhead Framework' },
      { hex: '#0F172A', label: 'Matte Black Road Cases', role: 'Flight Cases, Speaker Cabinets & Console' },
      { hex: '#A855F7', label: 'Concert Stage Violet Beam', role: 'Overhead Moving-Head Spotlights' },
      { hex: '#22C55E', label: 'LED Console VU Meter Green', role: 'Audio Level Fader Indicators' },
    ],
    landmarks: [
      { id: 'exp16-lm1', name: 'Quad-Truss Festival Stage Arch', description: 'Four-pole aluminum box truss portal with cross braces and suspension motors', tag: 'Architecture' },
      { id: 'exp16-lm2', name: 'Hanging Curved Line-Array Speaker Stacks', description: 'Dual vertical curved clusters of 6 concert line-array speaker boxes angled outward', tag: 'Centerpiece' },
      { id: 'exp16-lm3', name: 'Pro Audio Digital Mixing Console Station', description: 'Illuminated wide-format mixing desk with motorized fader banks and touchscreens', tag: 'Display Rack' },
      { id: 'exp16-lm4', name: 'Stack of Tour Road Flight Cases', description: 'Three road-ready shock-mount flight cases with heavy chrome ball corners and latches', tag: 'Cabinet' },
    ],
    variants: {
      classic: { title: 'Glastonbury Stage Tech', description: 'Silver quad-truss, matte black speaker arrays, and vivid concert magenta lights', accentColor: '#A855F7' },
      fantasy: { title: 'Bards’ Resonant Echo Amphitheater', description: 'Carved sounding-crystal arches with floating brass harps amplifying acoustic harmonies', accentColor: '#EAB308' },
      minimal: { title: 'Acoustic Studio Acoustic Array', description: 'Sleek architectural sound baffling panels with hidden ultra-directional transducers', accentColor: '#0F172A' },
    },
  },

  // =========================================================================
  // 17. Artisanal Gastronomy & Craft Brewery Expo Set
  // =========================================================================
  {
    id: 'diorama_expo_17_craft_brewery',
    slug: 'diorama-expo-craft-brewery',
    name: 'Artisanal Gastronomy & Craft Brewery Outdoor Expo Set',
    subtitle: 'Outdoor Expo Set · Food & Beverage Industry',
    category: 'life',
    categoryName: 'Outdoor Expo Sets',
    worldLevel: 'level2_diorama',
    baseType: 'architectural_foundation',
    collection: 'category_outdoor_expo_sets',
    subcategories: [
      'Black Matte Steel & Reclaimed Oak Taproom Pergola',
      'Dual Stainless Steel Micro-Brewery Fermentation Tank Replicas',
      'Tiered Solid Walnut Craft Beer Bottle Display Shelves',
      '6-Handle Polished Brass Beer Tap Tower Station',
      'Rustic Reclaimed Timber High-Top Barrel Tables & Stools',
      'Vintage Slate Chalkboard Beer Flight Tasting Menu',
    ],
    theme: 'Warm industrial taproom pergola featuring gleaming stainless fermentation tanks, tiered bottle display shelves, brass tap tower, and barrel high-top tasting tables.',
    description:
      'A convivial outdoor gourmet food and craft brewing festival exhibition set. Sheltered by a matte black steel and weathered oak timber pergola, the set features twin mirror-polished stainless steel conical brewing tanks, a multi-tier solid wood back-bar display shelf lined with amber craft bottles, an authentic six-tap brass draught beer dispensing tower, two rustic oak barrel cocktail tables with iron barstools, and a chalkboard menu.',
    polyCount: 8100,
    dimensionRatio: '1:1:0.85',
    minestWorldType: 'CategoryDiorama',
    assetFileRef: 'diorama_expo_craft_brewery_v1.glb',
    terrainSpecs: {
      shape: 'terraced',
      underbelly: 'Aged Belgian cobblestone pavement with copper drainage canal inserts',
      waterFeatures: 'None',
      foliage: 'Climbing hop vines on black wire trellises and potted herbs',
      elevationLevels: 2,
    },
    palette: [
      { hex: '#D97706', label: 'Rich Amber Ale', role: 'Craft Bottles & Chalkboard Trim' },
      { hex: '#E2E8F0', label: 'Mirror Polished Stainless', role: 'Fermentation Tanks & Tap Drip Trays' },
      { hex: '#78350F', label: 'Reclaimed Oak Staves', role: 'Barrel Tables & Back-Bar Shelving' },
      { hex: '#1E293B', label: 'Matte Black Industrial Iron', role: 'Pergola Posts & Stool Frames' },
    ],
    landmarks: [
      { id: 'exp17-lm1', name: 'Industrial Taproom Steel & Timber Pergola', description: 'Heavy black iron post-and-beam pergola draped with hanging warm Edison bulb festoon lights', tag: 'Architecture' },
      { id: 'exp17-lm2', name: 'Twin Stainless Steel Brewing Tanks', description: 'Dual gleaming conical fermenters with tri-clamp valves, level sight glasses, and manways', tag: 'Centerpiece' },
      { id: 'exp17-lm3', name: 'Tiered Oak Craft Bottle Back-Bar Rack', description: 'Four-step illuminated reclaimed wood shelf displaying specialty vintage ale bottles', tag: 'Display Rack' },
      { id: 'exp17-lm4', name: 'Oak Barrel Tasting Tables & Brass Tap Bar', description: 'Two aged whiskey barrels converted to high-top tables with brass foot rails', tag: 'Lounge' },
    ],
    variants: {
      classic: { title: 'Bavarian Craft Masters', description: 'Polished stainless tanks, rich reclaimed oak, and glowing amber craft beer bottles', accentColor: '#D97706' },
      fantasy: { title: 'Dwarven Honey-Mead Cellar', description: 'Heavy stone vaults with tapped golden honey barrels and horn flagons foaming with frothy brew', accentColor: '#EAB308' },
      minimal: { title: 'Nordic Cidery & Roastery', description: 'Bleached ash wood slats with brushed stainless steel tap towers and zero clutter', accentColor: '#78350F' },
    },
  },

  // =========================================================================
  // 18. Mobile Medical & Emergency Rescue Expo Set
  // =========================================================================
  {
    id: 'diorama_expo_18_mobile_medical',
    slug: 'diorama-expo-mobile-medical',
    name: 'Mobile Medical & Emergency Rescue Open-Air Expo Set',
    subtitle: 'Outdoor Expo Set · Healthcare & Humanitarian Relief',
    category: 'systems',
    categoryName: 'Outdoor Expo Sets',
    worldLevel: 'level2_diorama',
    baseType: 'architectural_foundation',
    collection: 'category_outdoor_expo_sets',
    subcategories: [
      'Rapid-Deploy Inflatable Weatherproof Medical Relief Tent',
      'Stainless Steel Emergency Triage Gurney with IV Drip Pole',
      'Ruggedized Orange & Black Pelican Medical Case Racks',
      'Automated External Defibrillator (AED) Totem Display',
      'Stainless Surgical Instrument Rolling Tray Table',
      'Collapsible Oxygen Tank Rack & Decontamination Station',
    ],
    theme: 'Rapid-deployment humanitarian relief tent with triage gurney, ruggedized Pelican medical equipment racks, oxygen cylinder racks, and defibrillator kiosks.',
    description:
      'A professional disaster relief and emergency healthcare exhibition set. Features an all-weather pneumatic inflatable relief tent with bright cross emblems, an emergency examination gurney equipped with an IV stand and vital sign monitor, heavy-duty stackable orange Pelican case racks holding surgical trauma kits, an upright AED display totem, rolling stainless Mayo instrument trays, and high-pressure oxygen bottle skids.',
    polyCount: 7950,
    dimensionRatio: '1:1:0.85',
    minestWorldType: 'CategoryDiorama',
    assetFileRef: 'diorama_expo_mobile_medical_v1.glb',
    terrainSpecs: {
      shape: 'terraced',
      underbelly: 'All-weather interlocking anti-slip interlocking plastic mud tiles with yellow hazard ramps',
      waterFeatures: 'None',
      foliage: 'None (Safety directional signs and reflective rescue tape)',
      elevationLevels: 2,
    },
    palette: [
      { hex: '#EF4444', label: 'Humanitarian Cross Red', role: 'Medical Cross Logos & Case Latches' },
      { hex: '#F97316', label: 'Rescue Hi-Vis Orange', role: 'Pelican Equipment Hardcases' },
      { hex: '#F8FAFC', label: 'Inflatable Tent White', role: 'Relief Shelter Fabric & Sterile Linen' },
      { hex: '#0EA5E9', label: 'Medical Vital Pulse Blue', role: 'ECG Monitor Display & Signage' },
    ],
    landmarks: [
      { id: 'exp18-lm1', name: 'Rapid-Deployment Inflatable Relief Tent', description: 'Air-beam arch emergency shelter with roll-up front portal and red cross markings', tag: 'Architecture' },
      { id: 'exp18-lm2', name: 'Emergency Triage Gurney & Monitor', description: 'Wheeled medical stretcher with adjustable backrest and digital vital monitor pole', tag: 'Centerpiece' },
      { id: 'exp18-lm3', name: 'Ruggedized Pelican Equipment Case Rack', description: 'Heavy steel shelf loaded with waterproof shockproof orange and black trauma kits', tag: 'Display Rack' },
      { id: 'exp18-lm4', name: 'AED Totem & Oxygen Tank Stand', description: 'Freestanding emergency defibrillator demonstration kiosk alongside paired oxygen cylinders', tag: 'Kiosk' },
    ],
    variants: {
      classic: { title: 'Red Cross Disaster Response', description: 'Clean white inflatable shelter, high-visibility rescue orange cases, and medical red accents', accentColor: '#EF4444' },
      fantasy: { title: 'Elven Field Sanatorium', description: 'Silver-bark living arbors sheltering glowing crystal healing basins and dried medicinal herb bundles', accentColor: '#10B981' },
      minimal: { title: 'Rapid Tactical Med-Pod', description: 'Matte OD-green shelter with ultralight carbon fiber stretchers and titanium telemetry monitors', accentColor: '#F97316' },
    },
  },

  // =========================================================================
  // 19. Urban Micro-Mobility & E-Bike Hub Expo Set
  // =========================================================================
  {
    id: 'diorama_expo_19_micro_mobility',
    slug: 'diorama-expo-micro-mobility',
    name: 'Urban Micro-Mobility & E-Bike Hub Expo Set',
    subtitle: 'Outdoor Expo Set · Smart Urban Transit & E-Bikes',
    category: 'systems',
    categoryName: 'Outdoor Expo Sets',
    worldLevel: 'level2_diorama',
    baseType: 'architectural_foundation',
    collection: 'category_outdoor_expo_sets',
    subcategories: [
      'Cantilevered Perforated Powder-Coated Metal Bus-Shelter Canopy',
      'Tiered E-Bike & E-Scooter Docking Charging Station Rack',
      'Modular 12-Slot Smart Battery Swap Cabinet Station',
      'Vertical Commuter Helmet & Safety Gear Display Tree',
      'Solar-Powered Digital NFC Transit Card / App Unlock Kiosk',
      'Modernist Concrete Planter Bench with Built-in Bike Ring',
    ],
    theme: 'Sleek curved perforated metal canopy with smart e-bike and e-scooter docking charging racks, 12-door battery swap cabinet, and helmet display trees.',
    description:
      'A forward-thinking smart city micro-mobility exhibition diorama set. Features an elegant cantilevered transit shelter canopy made of laser-cut perforated steel, an active 6-slot e-bike and electric kick-scooter docking rack with illuminated lock heads, a 12-bay modular hot-swappable lithium battery cabinet with green charging indicators, a spiral helmet display stand showing aerodynamic commuter helmets, and an interactive NFC phone unlock kiosk.',
    polyCount: 8050,
    dimensionRatio: '1:1:0.85',
    minestWorldType: 'CategoryDiorama',
    assetFileRef: 'diorama_expo_micro_mobility_v1.glb',
    terrainSpecs: {
      shape: 'terraced',
      underbelly: 'Dual-tone urban permeable asphalt paving with green bike lane markings',
      waterFeatures: 'None',
      foliage: 'Narrow upright birch trees in square cast concrete planters with wooden bench seats',
      elevationLevels: 2,
    },
    palette: [
      { hex: '#10B981', label: 'Urban Bike Lane Emerald', role: 'Bike Lane Paint & Battery Glow' },
      { hex: '#0284C7', label: 'Electric Blue Commuter', role: 'E-Bike Frames & Digital Kiosks' },
      { hex: '#1E293B', label: 'Dark Anthracite Steel', role: 'Shelter Canopy Posts & Docking Station' },
      { hex: '#F1F5F9', label: 'Architectural Cast Concrete', role: 'Planter Benches & Paving' },
    ],
    landmarks: [
      { id: 'exp19-lm1', name: 'Curved Perforated Metal Transit Shelter', description: 'Modern cantilevered steel roof with dappled sun pattern perforations and glass windbreak', tag: 'Architecture' },
      { id: 'exp19-lm2', name: 'Integrated E-Bike & Scooter Docking Rack', description: 'Six-bay angled ground charging dock with two commuter e-bikes and two folding e-scooters', tag: 'Centerpiece' },
      { id: 'exp19-lm3', name: '12-Slot Smart Battery Swap Cabinet', description: 'Upright kiosk with illuminated glowing charge slots demonstrating automated battery exchange', tag: 'Display Rack' },
      { id: 'exp19-lm4', name: 'Spiral Commuter Helmet Display Tree', description: 'Vertical stainless steel pylon with branching prongs holding colorful LED commuter helmets', tag: 'Vitrine' },
    ],
    variants: {
      classic: { title: 'Copenhagen Smart Hub', description: 'Emerald green bike lane, anthracite steel shelter, and illuminated battery swap cabinets', accentColor: '#10B981' },
      fantasy: { title: 'Clockwork Courier Perch', description: 'Brass gear-driven pergolas for clockwork winged mechanical messenger birds', accentColor: '#EAB308' },
      minimal: { title: 'Minimalist Nordic Transit', description: 'Pure white monolithic steel blade canopy with hidden wireless inductive ground charging', accentColor: '#0284C7' },
    },
  },

  // =========================================================================
  // 20. Haute Horlogerie & Luxury Jewelry Salon Set
  // =========================================================================
  {
    id: 'diorama_expo_20_haute_horlogerie',
    slug: 'diorama-expo-haute-horlogerie',
    name: 'Haute Horlogerie & Luxury Jewelry Open-Air Salon Set',
    subtitle: 'Outdoor Expo Set · Fine Watchmaking & High Jewelry',
    category: 'culture',
    categoryName: 'Outdoor Expo Sets',
    worldLevel: 'level2_diorama',
    baseType: 'architectural_foundation',
    collection: 'category_outdoor_expo_sets',
    subcategories: [
      'Gilded Champagne Bronze Pavilion with Velvet Drapes',
      'Central Motorized Revolving Grand Complication Watch Vitrine',
      'Four Perimeter Anti-Reflective Glass Jewelry Showcases',
      'Internal Fiber-Optic Micro-Spotlight Halos',
      'VIP Midnight-Blue Velvet Armchairs & Champagne Table',
      'Watchmaker Loupe & Disassembled Movement Tray Showcase',
    ],
    theme: 'Opulent gilded champagne bronze salon with deep midnight-blue velvet drapes, motorized watch tourbillon vitrine, jewelry showcases, and VIP consultation lounge.',
    description:
      'The pinnacle of outdoor luxury exhibition design inspired by Watches & Wonders Geneva. Featuring a champagne-gold anodized bronze open pavilion draped in flowing midnight-blue velvet curtains. At its center stands a motorized illuminated glass cylinder showcasing an intricate perpetual calendar tourbillon timepiece on an alligator strap, surrounded by four slim bronze vitrines displaying diamond necklaces, a master watchmaker’s workbench with magnifying loupes, and velvet VIP armchairs.',
    polyCount: 8320,
    dimensionRatio: '1:1:0.9',
    minestWorldType: 'CategoryDiorama',
    assetFileRef: 'diorama_expo_haute_horlogerie_v1.glb',
    terrainSpecs: {
      shape: 'circular',
      underbelly: 'Polished Italian Arabescato marble circular salon slab with brass perimeter ring',
      waterFeatures: 'None',
      foliage: 'Potted white calla lilies in faceted champagne bronze urns',
      elevationLevels: 3,
    },
    palette: [
      { hex: '#D4AF37', label: 'Champagne Gilded Gold', role: 'Bronze Pavilion Posts, Vitrines & Watch Bezel' },
      { hex: '#1E1B4B', label: 'Midnight Indigo Velvet', role: 'Salon Drapes, Armchairs & Display Pillows' },
      { hex: '#F8FAFC', label: 'Arabescato Polished Marble', role: 'Circular Floor Slabs & Plinth Bases' },
      { hex: '#38BDF8', label: 'Diamond Brilliance White', role: 'Internal Fiber-Optic Micro-Spots' },
    ],
    landmarks: [
      { id: 'exp20-lm1', name: 'Gilded Bronze Open-Air Salon Pavilion', description: 'Slender fluted champagne gold columns supporting an open geometric crown and velvet curtains', tag: 'Architecture' },
      { id: 'exp20-lm2', name: 'Revolving Tourbillon Timepiece Vitrine', description: 'Central cylindrical anti-reflective glass case holding a mechanical grand complication watch', tag: 'Centerpiece' },
      { id: 'exp20-lm3', name: 'Perimeter Jewelry Showcase Vitrines', description: 'Four slender bronze vitrines illuminated by internal fiber-optic micro spotlights', tag: 'Display Rack' },
      { id: 'exp20-lm4', name: 'VIP Consultation Lounge & Champagne Table', description: 'Two curved midnight-blue velvet armchairs flanking a low gilded marble cocktail table', tag: 'Lounge' },
    ],
    variants: {
      classic: { title: 'Geneva Salon Privé', description: 'Champagne gold bronze, deep midnight velvet, and white Arabescato marble floors', accentColor: '#D4AF37' },
      fantasy: { title: 'Chronos Celestial Reliquary', description: 'Floating gold astrolabe rings holding a beating stellar heart that bends local time', accentColor: '#8B5CF6' },
      minimal: { title: 'Modernist Platinum Vault', description: 'Brushed platinum cubic showcases with absolute razor-sharp anti-reflective clarity', accentColor: '#1E1B4B' },
    },
  },
];
