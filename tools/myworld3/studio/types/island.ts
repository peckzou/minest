export type IslandCategory =
  | 'knowledge'
  | 'life'
  | 'nature'
  | 'social'
  | 'culture'
  | 'mind'
  | 'systems'
  | 'cosmos'
  | 'personal';

export type WorldCollection =
  | 'collection_a_life'
  | 'collection_b_civilization'
  | 'category_knowledge'
  | 'category_culture'
  | 'category_everyday'
  | 'category_nature'
  | 'category_conceptual'
  | 'objects_knowledge'
  | 'objects_culture'
  | 'objects_life'
  | 'objects_nature'
  | 'objects_ideas';

export type WorldLevel = 'level0_universe' | 'level1_major' | 'level2_diorama' | 'level3_object' | 'level2_thematic';

export type AssetBaseType =
  | 'floating_island'
  | 'ground_patch'
  | 'architectural_foundation'
  | 'standalone_object';

export type IslandVariant = 'classic' | 'fantasy' | 'minimal';

export type LightingPreset = 'daylight' | 'sunset' | 'twilight' | 'studio';

export interface ColorSwatch {
  hex: string;
  label: string;
  role: string;
}

export interface Landmark {
  id: string;
  name: string;
  description: string;
  tag: string;
}

export interface TerrainSpecs {
  shape: 'irregular' | 'circular' | 'mountainous' | 'terraced' | 'coastal' | 'archipelago' | 'canyon';
  underbelly: string;
  waterFeatures: string;
  foliage: string;
  elevationLevels: number;
}

export interface IslandMetadata {
  id: string;
  slug: string;
  name: string;
  subtitle: string;
  category: IslandCategory;
  categoryName: string;
  worldLevel: WorldLevel;
  baseType?: AssetBaseType;
  collection: WorldCollection;
  subcategories: string[];
  theme: string;
  description: string;
  isHeroReference?: boolean;
  polyCount: number;
  palette: ColorSwatch[];
  landmarks: Landmark[];
  terrainSpecs: TerrainSpecs;
  variants: {
    classic: { title: string; description: string; accentColor: string };
    fantasy: { title: string; description: string; accentColor: string };
    minimal: { title: string; description: string; accentColor: string };
  };
  minestWorldType: string;
  assetFileRef: string;
  dimensionRatio: string;
}

