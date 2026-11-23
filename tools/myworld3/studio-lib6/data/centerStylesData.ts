import { CenterStyleConfig, CenterStyleId } from '../types/universe';

export const CENTER_STYLES: CenterStyleConfig[] = [
  {
    id: 'center_castle',
    name: 'Castle World',
    subtitle: 'Majestic Citadel & Sovereign Realm',
    theme: 'Grand fantasy fortress, royal towers, grand stone ramparts, cascading waterfall, and banners.',
    description:
      'A majestic fairytale citadel perched on layered granite crags with spiraling sky spires, stone bridge gatehouse, grand courtyard, and golden sovereign heraldry.',
    accentColor: '#3b82f6',
    palette: ['#1e3a8a', '#3b82f6', '#93c5fd', '#f59e0b', '#f1f5f9', '#475569'],
    keyFeatures: ['Grand Keep & Spire', 'Curved Ramparts', 'Drawbridge Gatehouse', 'Courtyard Gardens', 'Cascading Waterway'],
  },
  {
    id: 'center_knowledge',
    name: 'Knowledge World',
    subtitle: 'Great Grand Library & Academy of Sciences',
    theme: 'Monumental domed library, celestial telescope pavilion, reading colonnades, and philosophy gardens.',
    description:
      'The intellectual epicenter of your universe. Features an immense classical domed rotunda, illuminated clock tower, astronomical observatory dome, tiered open-air book arcades, and tranquil fountains.',
    accentColor: '#6366f1',
    palette: ['#312e81', '#6366f1', '#a5b4fc', '#fbbf24', '#f8fafc', '#334155'],
    keyFeatures: ['Great Dome of Wisdom', 'Astrolabe Observatory', 'Philosopher Colonnade', 'Clock Tower', 'Fountain of Insight'],
  },
  {
    id: 'center_cozy_village',
    name: 'Cozy Village',
    subtitle: 'Warm Hearth, Windmill & Village Square',
    theme: 'Charming pastel timber houses, rotating windmill, cobblestone lanes, community market, and glowing lanterns.',
    description:
      'A warm, heartwarming European-style hillside village. Cobblestone pathways curve around terracotta-roofed cottages, a spinning Dutch windmill over flower terraces, bakery café, and a central village bell tower.',
    accentColor: '#f97316',
    palette: ['#9a3412', '#f97316', '#fdba74', '#10b981', '#fef3c7', '#78350f'],
    keyFeatures: ['Working Hilltop Windmill', 'Town Square Fountain', 'Pastel Timber Cottages', 'Terraced Flowerbeds', 'Market Stalls'],
  },
  {
    id: 'center_tree_of_life',
    name: 'Tree of Life',
    subtitle: 'Yggdrasil Mythic Biome & Canopy Sanctuary',
    theme: 'Colossal ancestral World Tree, bioluminescent leaves, root bridges, canopy platforms, and crystal springs.',
    description:
      'A colossal mythological World Tree whose sprawling roots embrace a crystalline mountain. Its radiant jade and emerald canopy cradles spiraling treehouse platforms, cascading spring waters, and glowing runic shrines.',
    accentColor: '#10b981',
    palette: ['#064e3b', '#10b981', '#6ee7b7', '#f59e0b', '#ecfdf5', '#78350f'],
    keyFeatures: ['Colossal Ancient Boughs', 'Luminescent Canopy', 'Root Stairways', 'Sacred Spring Pool', 'Elevated Treehouse Platform'],
  },
  {
    id: 'center_modern_city',
    name: 'Modern City',
    subtitle: 'Cyber Neo-Metropolis & Glass Towers',
    theme: 'Sleek geometric skyscrapers, skybridges, elevated monorail, heliport, and rooftop gardens.',
    description:
      'A vibrant, forward-looking miniature metropolis. Towering crystalline skyscrapers with angled glass façades, skywalk bridges connecting mid-levels, rooftop botanical terraces, helipad, and glowing transit avenues.',
    accentColor: '#0ea5e9',
    palette: ['#0c4a6e', '#0ea5e9', '#7dd3fc', '#ec4899', '#f8fafc', '#1e293b'],
    keyFeatures: ['Geometric Glass Towers', 'Suspension Skybridge', 'Rooftop Helipad', 'Modern Plaza Promenade', 'Elevated Transit Loop'],
  },
  {
    id: 'center_zen_garden',
    name: 'Zen Garden',
    subtitle: 'Kyoto Sanctuary, Pagoda & Raked Sand',
    theme: 'Multi-tiered red pagoda, torii gate, serene koi pond, curved wooden bridge, bamboo grove, and raked gravel.',
    description:
      'A serene Eastern sanctuary embodying peace, balance, and mindfulness. Includes a five-tiered vermilion pagoda, red arched bridge spanning a tranquil koi water basin, torii gateway, stone lanterns, and pink cherry blossom groves.',
    accentColor: '#ef4444',
    palette: ['#7f1d1d', '#ef4444', '#fca5a5', '#059669', '#fef2f2', '#451a03'],
    keyFeatures: ['Five-Tier Vermilion Pagoda', 'Red Moon Bridge', 'Torii Gate Portal', 'Cherry Blossom Sakura Trees', 'Stepping Stone Water Garden'],
  },
  {
    id: 'center_cosmic',
    name: 'Cosmic World',
    subtitle: 'Stargate Planetary Citadel & Astral Rings',
    theme: 'Floating planetarium spheres, celestial stargate portal, orbital rings, obsidian towers, and starry beacons.',
    description:
      'A celestial world floating at the crossroads of galaxies. Features a glowing astral stargate ring, orbiting planetary spheres with golden gyroscopic gimbal rings, futuristic observatory obelisks, and crystalline energy spires.',
    accentColor: '#8b5cf6',
    palette: ['#4c1d95', '#8b5cf6', '#c4b5fd', '#38bdf8', '#faf5ff', '#0f172a'],
    keyFeatures: ['Astral Stargate Portal', 'Orbital Gyroscope Rings', 'Levitating Crystalline Orbs', 'Celestial Beacon Obelisk', 'Astronomy Platform'],
  },
  {
    id: 'center_nature_paradise',
    name: 'Nature Paradise',
    subtitle: 'Alpine Peaks, Hidden Grotto & Cascading Falls',
    theme: 'Dramatic alpine peaks, cascading split waterfalls, crystal blue lagoon, pine forests, and stone lookout tower.',
    description:
      'An untouched miniature natural sanctuary. Soaring snow-dusted twin peaks giving rise to a dramatic cascading waterfall that fills an emerald mountain tarn, surrounded by pine forests, wild meadows, and a stone ranger lookout.',
    accentColor: '#059669',
    palette: ['#064e3b', '#059669', '#34d399', '#60a5fa', '#f0fdf4', '#374151'],
    keyFeatures: ['Twin Alpine Mountain Peaks', 'Dual Waterfall Cascade', 'Emerald Lagoon Lake', 'Pine & Birch Forest Grove', 'Cliffside Lookout Bastion'],
  },
];

export const DEFAULT_SURROUNDING_WORLD_IDS = [
  'world-natural',             // 01 Natural World
  'world-knowledge',           // 02 Knowledge World
  'world-everyday',            // 03 Everyday World
  'world-cultural',            // 05 Cultural World
  'world-science-exploration', // 09 Science & Exploration
  'world-creativity-design',   // 11 Creativity & Design
];
