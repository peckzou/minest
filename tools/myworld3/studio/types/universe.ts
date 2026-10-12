import { IslandMetadata } from './island';

export type CenterStyleId =
  | 'center_castle'
  | 'center_knowledge'
  | 'center_cozy_village'
  | 'center_tree_of_life'
  | 'center_modern_city'
  | 'center_zen_garden'
  | 'center_cosmic'
  | 'center_nature_paradise';

export interface CenterStyleConfig {
  id: CenterStyleId;
  name: string;
  subtitle: string;
  theme: string;
  description: string;
  accentColor: string;
  palette: string[];
  keyFeatures: string[];
  cameraPreset?: {
    distance: number;
    elevation: number;
    azimuth: number;
  };
}

export interface UniverseIslandSlot {
  worldId: string;
  order: number;
  // Computed or deterministic polar coordinate in the archipelago ring
  angle?: number;
  radius?: number;
  heightOffset?: number;
  scale?: number;
}

export interface UniverseConfig {
  sceneId: string;
  centerStyleId: CenterStyleId;
  centerScale: number;
  viewMode: 'overview' | 'explore';
  islandSlots: UniverseIslandSlot[];
  cameraPreset: {
    distance: number;
    elevation: number;
    azimuth: number;
  };
  lightingPreset: 'daylight' | 'sunset' | 'twilight';
  showAtmosphericClouds: boolean;
  waterReflections: boolean;
}
