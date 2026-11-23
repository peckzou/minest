import { IslandMetadata, WorldLevel } from '../types/island';
import { ISLANDS_DATA } from './islandsData';
import { DIORAMAS_DATA } from './dioramasData';
import { OBJECTS_DATA } from './objectsData';
import { EXPANSION_MAJOR_WORLDS } from './expansionMajorWorldsData';
import { EXPANSION_SUB_ISLANDS } from './expansionSubIslandsData';
import { EXPANSION_BUILDINGS } from './expansionBuildingsData';
import { EXPANSION_BUILDINGS_51_TO_100 } from './expansionBuildings51To100Data';
import { MUSEUM_BUILDINGS } from './museumBuildingsData';
import { EXPANSION_OBJECTS } from './expansionObjectsData';
import { EXPANSION_43_MAJOR_WORLDS } from './expansionMajorWorlds43Data';
import { EXPANSION_43_SUB_ISLANDS } from './expansionSubIslands43Data';
import { EXPANSION_5_MAJOR_WORLDS } from './expansionMajorWorlds5Data';
import { EXPANSION_5_SUB_ISLANDS } from './expansionSubIslands5Data';
import { AVATAR_ISLANDS_DATA } from './avatarIslandsData';
import { MUSEUM_INTERIOR_DIORAMAS_DATA } from './museumInteriorDioramasData';
import { MUSEUM_OBJECTS_DATA } from './museumObjectsData';
import { EXPO_FACILITIES_DATA } from './expoFacilitiesData';
import { MUSEUM_DECORATIVE_ITEMS_DATA } from './museumDecorativeItemsData';
import { INDOOR_DECOR_DATA } from './indoorDecorData';
import { OUTDOOR_DECOR_DATA } from './outdoorDecorData';
import { OUTDOOR_EXPO_SETS_DATA } from './outdoorExpoSetsData';
import { LUXURY_RESIDENCES_DATA } from './luxuryResidencesData';
import { DOLLHOUSE_INTERIORS_DATA } from './dollhouseInteriorsData';
import {
  MY_WORLD_SCENES_DATA,
  MY_WORLD_INTERIORS_DATA,
  MY_WORLD_SCENE_SEEDS,
} from './myWorldScenesData';
import {
  WORLD_FAMOUS_CASTLES_DATA,
  WORLD_CASTLE_INTERIORS_DATA,
  FAMOUS_CASTLE_SEEDS,
} from './worldFamousCastlesData';
import {
  WORLD_FAMOUS_CATHEDRALS_DATA,
  WORLD_CATHEDRAL_INTERIORS_DATA,
  FAMOUS_CATHEDRAL_SEEDS,
} from './worldFamousCathedralsData';
import {
  WORLD_FAMOUS_LANDMARKS_DATA,
  WORLD_LANDMARK_INTERIORS_DATA,
  FAMOUS_LANDMARK_SEEDS,
} from './worldFamousLandmarksData';
import {
  DESIGNER_VILLAS_30,
  DESIGNER_VILLA_INTERIORS_30,
  DESIGNER_VILLA_SEEDS,
} from './designerVillasData';

export {
  LUXURY_RESIDENCES_DATA,
  DOLLHOUSE_INTERIORS_DATA,
  MY_WORLD_SCENES_DATA,
  MY_WORLD_INTERIORS_DATA,
  MY_WORLD_SCENE_SEEDS,
  WORLD_FAMOUS_CASTLES_DATA,
  WORLD_CASTLE_INTERIORS_DATA,
  FAMOUS_CASTLE_SEEDS,
  WORLD_FAMOUS_CATHEDRALS_DATA,
  WORLD_CATHEDRAL_INTERIORS_DATA,
  FAMOUS_CATHEDRAL_SEEDS,
  WORLD_FAMOUS_LANDMARKS_DATA,
  WORLD_LANDMARK_INTERIORS_DATA,
  FAMOUS_LANDMARK_SEEDS,
  DESIGNER_VILLAS_30,
  DESIGNER_VILLA_INTERIORS_30,
  DESIGNER_VILLA_SEEDS,
};

// Core Assets (64)
export const CORE_LEVEL_1_WORLDS: IslandMetadata[] = ISLANDS_DATA; // 24
export const CORE_LEVEL_2_DIORAMAS: IslandMetadata[] = DIORAMAS_DATA; // 20
export const CORE_LEVEL_3_OBJECTS: IslandMetadata[] = OBJECTS_DATA; // 20
export const CORE_ASSETS_DATA: IslandMetadata[] = [
  ...CORE_LEVEL_1_WORLDS,
  ...CORE_LEVEL_2_DIORAMAS,
  ...CORE_LEVEL_3_OBJECTS,
];

// Minest World Expansion Assets (974 Production Assets)
export const EXPANSION_LEVEL_1_WORLDS: IslandMetadata[] = [
  ...MY_WORLD_SCENES_DATA, // 12 Official My World Candidate Scenes (Venice #1, Cotswolds, Swiss Alps, Hobbiton, Hogwarts, Green Gables, Secret Garden, Pemberley + 4 Recommended)
  ...AVATAR_ISLANDS_DATA, // 20 Avatar / Pandora Fantastical Floating Islands (MW-71 to MW-90)
  ...EXPANSION_5_MAJOR_WORLDS, // 30 (MW-41 to MW-70)
  ...EXPANSION_43_MAJOR_WORLDS, // 30 (MW-11 to MW-40)
  ...EXPANSION_MAJOR_WORLDS, // 10 (MW-01 to MW-10)
]; // 102 Expansion Major Worlds

export const LEVEL_2_SUBISLANDS: IslandMetadata[] = [
  ...EXPANSION_SUB_ISLANDS, // 30 (SI-01 to SI-30)
  ...EXPANSION_43_SUB_ISLANDS, // 30 (SI-31 to SI-60)
  ...EXPANSION_5_SUB_ISLANDS, // 50 (SI-61 to SI-110)
]; // 110 Thematic Sub-Islands

export const LEVEL_2_BUILDINGS: IslandMetadata[] = [
  ...DESIGNER_VILLAS_30, // 30 Exquisite Designer Villas & Signature Houses with Detailed Interiors (BD-211 to BD-240)
  ...WORLD_FAMOUS_LANDMARKS_DATA, // 50 World-Famous Iconic Landmark Buildings with Detailed Interiors (BD-161 to BD-210)
  ...WORLD_FAMOUS_CATHEDRALS_DATA, // 10 World's Most Famous Real Cathedrals & Churches with Sacred Interiors (BD-151 to BD-160)
  ...WORLD_FAMOUS_CASTLES_DATA, // 10 World's Most Beautiful Real Castles with Detailed Interiors (BD-141 to BD-150)
  ...LUXURY_RESIDENCES_DATA, // 20 Luxury Residences, Castles & Boutique Villas (BD-121 to BD-140)
  ...MUSEUM_BUILDINGS, // 20 Grand Museum Complexes (BD-101 to BD-120)
  ...EXPANSION_BUILDINGS_51_TO_100, // 50 Distinctive Signature Buildings (BD-51 to BD-100)
  ...EXPANSION_BUILDINGS, // 50 Original Modular Buildings (BD-01 to BD-50)
]; // 240 Modular Buildings

export const EXPANSION_LEVEL_3_OBJECTS: IslandMetadata[] = [
  ...OUTDOOR_DECOR_DATA, // 50 Outdoor Decorative Objects (OB-301 to OB-350)
  ...INDOOR_DECOR_DATA, // 50 Indoor Decorative Objects (OB-251 to OB-300)
  ...MUSEUM_DECORATIVE_ITEMS_DATA, // 50 Museum Exhibition Decorative Items & Artifacts (OB-201 to OB-250)
  ...EXPO_FACILITIES_DATA, // 50 Mega-Expo Exhibition Facilities & Racks (OB-151 to OB-200)
  ...MUSEUM_OBJECTS_DATA, // 50 Museum Display Stands, Vitrines & Apparatuses (OB-101 to OB-150)
  ...EXPANSION_OBJECTS, // 100 Expansion Objects (OB-001 to OB-100)
]; // 350 Expansion Objects

export const ALL_EXPANSION_ASSETS: IslandMetadata[] = [
  ...EXPANSION_LEVEL_1_WORLDS, // 102
  ...LEVEL_2_SUBISLANDS, // 110
  ...LEVEL_2_BUILDINGS, // 240
  ...DESIGNER_VILLA_INTERIORS_30, // 30 Designer Villa Detailed 2-Story Cutaway Interiors (diorama_dollhouse_103 to 132)
  ...WORLD_LANDMARK_INTERIORS_DATA, // 50 World-Famous Landmark Detailed Interiors (diorama_dollhouse_53 to 102)
  ...WORLD_CATHEDRAL_INTERIORS_DATA, // 10 World-Famous Cathedral Sacred Interiors (diorama_dollhouse_43 to 52)
  ...WORLD_CASTLE_INTERIORS_DATA, // 10 World-Famous Castle Detailed Interiors (diorama_dollhouse_33 to 42)
  ...MY_WORLD_INTERIORS_DATA, // 12 My World Independent Interior Spaces (diorama_dollhouse_21 to 32)
  ...DOLLHOUSE_INTERIORS_DATA, // 20 Interactive 3D Dollhouse Luxury Interiors (diorama_dollhouse_01 to 20)
  ...OUTDOOR_EXPO_SETS_DATA, // 20 Large Outdoor Expo Sets
  ...MUSEUM_INTERIOR_DIORAMAS_DATA, // 20 Grand Museum Interior Exhibition Compositions
  ...EXPANSION_LEVEL_3_OBJECTS, // 350
]; // 974 Expansion Assets

// Combined Library Collections
export const LEVEL_1_WORLDS: IslandMetadata[] = [
  ...MY_WORLD_SCENES_DATA, // 12 Official My World Candidate Scenes (MW-MYWORLD-01 to MW-MYWORLD-12)
  ...AVATAR_ISLANDS_DATA, // 20 Avatar / Pandora Fantastical Floating Islands (MW-71 to MW-90)
  ...ISLANDS_DATA, // 24 Core Major Worlds
  ...EXPANSION_5_MAJOR_WORLDS, // 30 (MW-41 to MW-70)
  ...EXPANSION_43_MAJOR_WORLDS, // 30 (MW-11 to MW-40)
  ...EXPANSION_MAJOR_WORLDS, // 10 (MW-01 to MW-10)
]; // 126 Major Worlds

export const LEVEL_2_DIORAMAS: IslandMetadata[] = [
  ...DESIGNER_VILLA_INTERIORS_30, // 30 Designer Villa Detailed 2-Story Cutaway Interiors (diorama_dollhouse_103 to 132)
  ...WORLD_LANDMARK_INTERIORS_DATA, // 50 World-Famous Landmark Detailed Interiors (diorama_dollhouse_53 to 102)
  ...WORLD_CATHEDRAL_INTERIORS_DATA, // 10 World-Famous Cathedral Sacred Interiors (diorama_dollhouse_43 to 52)
  ...WORLD_CASTLE_INTERIORS_DATA, // 10 World-Famous Castle Detailed Interiors (diorama_dollhouse_33 to 42)
  ...MY_WORLD_INTERIORS_DATA, // 12 My World Independent Interior Spaces (diorama_dollhouse_21 to 32)
  ...DOLLHOUSE_INTERIORS_DATA, // 20 Interactive 3D Dollhouse Luxury Interiors (diorama_dollhouse_01 to 20)
  ...OUTDOOR_EXPO_SETS_DATA, // 20 Large Outdoor Expo Sets (with complete racks & exhibits)
  ...MUSEUM_INTERIOR_DIORAMAS_DATA, // 20 Grand Museum Interior Exhibition Compositions
  ...DIORAMAS_DATA, // 20 Original Category Dioramas
]; // 192 Dioramas

export const LEVEL_3_OBJECTS: IslandMetadata[] = [
  ...OUTDOOR_DECOR_DATA, // 50 Outdoor Decorative Objects (OB-301 to OB-350)
  ...INDOOR_DECOR_DATA, // 50 Indoor Decorative Objects (OB-251 to OB-300)
  ...MUSEUM_DECORATIVE_ITEMS_DATA, // 50 Museum Exhibition Decorative Items & Artifacts (OB-201 to OB-250)
  ...EXPO_FACILITIES_DATA, // 50 Mega-Expo Exhibition Facilities & Racks (OB-151 to OB-200)
  ...MUSEUM_OBJECTS_DATA, // 50 Museum Display Stands, Vitrines & Apparatuses (OB-101 to OB-150)
  ...EXPANSION_OBJECTS, // 100 Expansion Objects (OB-001 to OB-100)
  ...OBJECTS_DATA, // 20 Original Core Objects
]; // 370 Standalone Objects

// Full Minest Catalog (1,038 Production Assets)
export const ALL_ASSETS_DATA: IslandMetadata[] = [
  ...LEVEL_1_WORLDS, // 126
  ...LEVEL_2_SUBISLANDS, // 110
  ...LEVEL_2_BUILDINGS, // 240
  ...LEVEL_2_DIORAMAS, // 192
  ...LEVEL_3_OBJECTS, // 370
]; // 1,038 Total Assets

export function getAssetsByLevel(level: WorldLevel | 'all'): IslandMetadata[] {
  if (level === 'all') return ALL_ASSETS_DATA;
  if (level === 'level1_major') return LEVEL_1_WORLDS;
  if (level === 'level2_subisland' || level === 'level2_thematic') return LEVEL_2_SUBISLANDS;
  if (level === 'level2_building') return LEVEL_2_BUILDINGS;
  if (level === 'level2_diorama') return LEVEL_2_DIORAMAS;
  if (level === 'level3_object') return LEVEL_3_OBJECTS;
  return ALL_ASSETS_DATA;
}

export function findAssetByIdOrSlug(idOrSlug: string): IslandMetadata | undefined {
  return ALL_ASSETS_DATA.find((a) => a.id === idOrSlug || a.slug === idOrSlug);
}
