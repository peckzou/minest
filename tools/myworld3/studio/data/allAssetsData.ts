import { IslandMetadata, WorldLevel } from '../types/island';
import { ISLANDS_DATA } from './islandsData';
import { DIORAMAS_DATA } from './dioramasData';
import { OBJECTS_DATA } from './objectsData';

export const LEVEL_1_WORLDS: IslandMetadata[] = ISLANDS_DATA;
export const LEVEL_2_DIORAMAS: IslandMetadata[] = DIORAMAS_DATA;
export const LEVEL_3_OBJECTS: IslandMetadata[] = OBJECTS_DATA;

export const ALL_ASSETS_DATA: IslandMetadata[] = [
  ...LEVEL_1_WORLDS,
  ...LEVEL_2_DIORAMAS,
  ...LEVEL_3_OBJECTS,
];

export function getAssetsByLevel(level: WorldLevel | 'all'): IslandMetadata[] {
  if (level === 'all') return ALL_ASSETS_DATA;
  if (level === 'level1_major') return LEVEL_1_WORLDS;
  if (level === 'level2_diorama' || level === 'level2_thematic') return LEVEL_2_DIORAMAS;
  if (level === 'level3_object') return LEVEL_3_OBJECTS;
  return ALL_ASSETS_DATA;
}

export function findAssetByIdOrSlug(idOrSlug: string): IslandMetadata | undefined {
  return ALL_ASSETS_DATA.find((a) => a.id === idOrSlug || a.slug === idOrSlug);
}
