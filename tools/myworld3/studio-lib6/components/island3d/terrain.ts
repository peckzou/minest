import * as THREE from 'three';
import { IslandMetadata, IslandVariant } from '../../types/island';
import { createLowPolyMat, createWaterMat, createCloudCluster } from './materials';

export type TerrainArchetype =
  | 'plateau'
  | 'ancient_ruins'
  | 'alpine_crag'
  | 'coastal_beach'
  | 'village_meadow'
  | 'farmland_terrace'
  | 'sacred_forest'
  | 'celestial_crystal'
  | 'modern_civic';

export function buildRichIslandTerrain(
  island: IslandMetadata,
  variant: IslandVariant,
  archetype: TerrainArchetype = 'plateau'
): THREE.Group {
  const terrainGroup = new THREE.Group();

  // Colors extracted from island palette or defaults
  const grassHex =
    island.palette.find(
      (p) =>
        p.role.includes('Terrain') ||
        p.role.includes('Meadow') ||
        p.role.includes('Lawn') ||
        p.role.includes('Green')
    )?.hex || '#78B072';

  const stoneHex =
    island.palette.find(
      (p) =>
        p.role.includes('Base') ||
        p.role.includes('Stone') ||
        p.role.includes('Bedrock') ||
        p.role.includes('Ridge') ||
        p.role.includes('Sandstone')
    )?.hex || '#877B6D';

  const waterHex =
    island.palette.find(
      (p) =>
        p.role.includes('Water') ||
        p.role.includes('Stream') ||
        p.role.includes('Ocean') ||
        p.role.includes('River') ||
        p.role.includes('Cascade')
    )?.hex || '#4fa8b8';

  const grassMat = createLowPolyMat(grassHex, { roughness: 0.85 });
  const soilMat = createLowPolyMat(0x5e4835, { roughness: 0.9 });
  const stoneMat = createLowPolyMat(stoneHex, { roughness: 0.88 });
  const sandMat = createLowPolyMat(0xe6cf9c, { roughness: 0.85 });
  const rockDarkMat = createLowPolyMat(0x423830, { roughness: 0.92 });
  const waterMat = createWaterMat(waterHex);

  // -------------------------------------------------------------
  // 1. GEOLOGICAL UNDERBELLY (Stratified, jagged, multi-pointed)
  // -------------------------------------------------------------
  const underbellyGroup = new THREE.Group();

  // Main central deep rock keel (faceted irregular cone)
  const mainConeGeo = new THREE.ConeGeometry(3.6, 4.4, 9);
  mainConeGeo.rotateX(Math.PI);
  const mainCone = new THREE.Mesh(mainConeGeo, stoneMat);
  mainCone.position.set(0.1, -2.8, -0.1);
  mainCone.castShadow = true;
  underbellyGroup.add(mainCone);

  // Secondary offset rock stalactites creating organic asymmetry
  const subCone1 = new THREE.ConeGeometry(1.6, 3.2, 7);
  subCone1.rotateX(Math.PI);
  const sc1 = new THREE.Mesh(subCone1, rockDarkMat);
  sc1.position.set(-1.8, -2.1, 1.2);
  sc1.castShadow = true;
  underbellyGroup.add(sc1);

  const subCone2 = new THREE.ConeGeometry(1.4, 2.8, 6);
  subCone2.rotateX(Math.PI);
  const sc2 = new THREE.Mesh(subCone2, rockDarkMat);
  sc2.position.set(2.0, -2.0, -1.4);
  sc2.castShadow = true;
  underbellyGroup.add(sc2);

  // Hanging roots and mineral veins underneath
  const rootMat = createLowPolyMat(0x38281a, { roughness: 0.95 });
  const root1 = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.22, 2.2, 5), rootMat);
  root1.position.set(0.8, -3.8, 0.6);
  root1.rotation.z = 0.2;
  const root2 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.18, 1.8, 5), rootMat);
  root2.position.set(-1.2, -3.4, -0.8);
  root2.rotation.x = -0.18;
  underbellyGroup.add(root1, root2);

  terrainGroup.add(underbellyGroup);

  // -------------------------------------------------------------
  // 2. SOIL & STRATIFIED BEDROCK MIDDLE LAYER
  // -------------------------------------------------------------
  const soilGeo = new THREE.CylinderGeometry(4.6, 4.0, 1.1, 10);
  const soilMesh = new THREE.Mesh(soilGeo, soilMat);
  soilMesh.position.y = -0.7;
  soilMesh.receiveShadow = true;
  soilMesh.castShadow = true;
  terrainGroup.add(soilMesh);

  // Rock outcrop shelves jutting through the soil perimeter
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2 + 0.3;
    const dist = 4.2 + (i % 2) * 0.4;
    const shelfGeo = new THREE.DodecahedronGeometry(0.85, 0);
    const shelf = new THREE.Mesh(shelfGeo, stoneMat);
    shelf.position.set(Math.cos(angle) * dist, -0.65, Math.sin(angle) * dist);
    shelf.scale.set(1.4, 0.6, 1.1);
    shelf.castShadow = true;
    shelf.receiveShadow = true;
    terrainGroup.add(shelf);
  }

  // -------------------------------------------------------------
  // 3. ARCHETYPE-SPECIFIC TOP SURFACE & MULTI-TIER ELEVATIONS
  // -------------------------------------------------------------
  if (archetype === 'coastal_beach') {
    // Coastal Island: High chalk/limestone cliff on NW, sloping down to sandy beach cove on SE
    const cliffGeo = new THREE.CylinderGeometry(3.6, 4.4, 1.4, 8);
    const cliff = new THREE.Mesh(cliffGeo, stoneMat);
    cliff.position.set(-1.2, 0.5, -1.2);
    cliff.castShadow = true;
    cliff.receiveShadow = true;
    terrainGroup.add(cliff);

    const cliffTop = new THREE.Mesh(new THREE.CylinderGeometry(3.3, 3.6, 0.2, 8), grassMat);
    cliffTop.position.set(-1.2, 1.25, -1.2);
    cliffTop.receiveShadow = true;
    terrainGroup.add(cliffTop);

    // Sandy beach cove
    const beach = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.4, 0.4, 10), sandMat);
    beach.position.set(0.8, -0.1, 0.8);
    beach.receiveShadow = true;
    terrainGroup.add(beach);

    // Water basin / lagoon
    const sea = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.5, 0.25, 8), waterMat);
    sea.position.set(1.6, -0.05, 1.6);
    terrainGroup.add(sea);
  } else if (archetype === 'alpine_crag') {
    // High Alpine Mountain: Craggy, jagged terraced peaks
    const basePlateau = new THREE.Mesh(new THREE.CylinderGeometry(4.4, 4.6, 0.6, 9), stoneMat);
    basePlateau.position.y = 0;
    basePlateau.receiveShadow = true;
    terrainGroup.add(basePlateau);

    // Upper green terrace
    const grassPlateau = new THREE.Mesh(new THREE.CylinderGeometry(3.8, 4.2, 0.25, 8), grassMat);
    grassPlateau.position.y = 0.35;
    grassPlateau.receiveShadow = true;
    terrainGroup.add(grassPlateau);

    // Craggy mountain ridge
    const peak1Geo = new THREE.ConeGeometry(2.2, 3.2, 6);
    const peak1 = new THREE.Mesh(peak1Geo, stoneMat);
    peak1.position.set(-1.2, 1.9, -1.4);
    peak1.castShadow = true;
    peak1.receiveShadow = true;

    // Snow/moss dusting on peak
    const snowCap = new THREE.Mesh(new THREE.ConeGeometry(1.0, 1.2, 6), createLowPolyMat(0xffffff, { roughness: 0.9 }));
    snowCap.position.set(-1.2, 2.9, -1.4);
    terrainGroup.add(peak1, snowCap);

    // Secondary crag
    const peak2 = new THREE.Mesh(new THREE.ConeGeometry(1.7, 2.4, 5), stoneMat);
    peak2.position.set(1.6, 1.4, -1.2);
    peak2.castShadow = true;
    terrainGroup.add(peak2);
  } else if (archetype === 'farmland_terrace') {
    // Stepped agricultural contour terraces
    const tier1 = new THREE.Mesh(new THREE.CylinderGeometry(4.4, 4.6, 0.5, 9), grassMat);
    tier1.position.y = 0;
    tier1.receiveShadow = true;
    terrainGroup.add(tier1);

    // Mid terrace
    const tier2 = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 3.9, 0.5, 8), grassMat);
    tier2.position.set(-0.4, 0.4, -0.4);
    tier2.receiveShadow = true;
    tier2.castShadow = true;
    terrainGroup.add(tier2);

    // High terrace for windmill
    const tier3 = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.5, 0.6, 7), grassMat);
    tier3.position.set(-0.8, 0.9, -0.8);
    tier3.receiveShadow = true;
    tier3.castShadow = true;
    terrainGroup.add(tier3);

    // Stone retaining terrace walls
    const wall1 = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.45, 0.2), stoneMat);
    wall1.position.set(0.6, 0.22, 0.2);
    wall1.rotation.y = -0.4;
    wall1.castShadow = true;
    terrainGroup.add(wall1);
  } else if (archetype === 'ancient_ruins') {
    // Ancient Ruins: Weathered stone platforms, excavated amphitheater bowl, gravel
    const baseP = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 4.6, 0.6, 8), stoneMat);
    baseP.position.y = 0;
    baseP.receiveShadow = true;
    terrainGroup.add(baseP);

    // Stepped temple acropolis platform
    const acropolis = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.6, 3.4), stoneMat);
    acropolis.position.set(0.8, 0.5, -0.6);
    acropolis.castShadow = true;
    acropolis.receiveShadow = true;
    terrainGroup.add(acropolis);

    // Sunken amphitheater hollow in terrain
    const pitRim = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, 0.15, 8), stoneMat);
    pitRim.position.set(-1.6, 0.1, 1.2);
    terrainGroup.add(pitRim);

    // Patches of arid olive meadow
    const aridGrass = createLowPolyMat(0x8a9a68, { roughness: 0.9 });
    const patch = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.1, 2.0), aridGrass);
    patch.position.set(-1.0, 0.25, -1.2);
    terrainGroup.add(patch);
  } else {
    // Standard Rich Multi-Tier Plateau (Default for Knowledge, Home, School, etc.)
    // Main lawn plateau
    const mainPlateau = new THREE.Mesh(new THREE.CylinderGeometry(4.4, 4.6, 0.6, 10), grassMat);
    mainPlateau.position.y = 0;
    mainPlateau.receiveShadow = true;
    terrainGroup.add(mainPlateau);

    // Raised upper terrace (for main architecture / hero monument)
    const upperTerrace = new THREE.Mesh(new THREE.CylinderGeometry(2.8, 3.1, 0.45, 8), grassMat);
    upperTerrace.position.set(0.4, 0.45, -0.6);
    upperTerrace.receiveShadow = true;
    upperTerrace.castShadow = true;
    terrainGroup.add(upperTerrace);

    // Stone retaining wall bordering the upper terrace
    const wallGeo = new THREE.BoxGeometry(3.2, 0.45, 0.25);
    const wall = new THREE.Mesh(wallGeo, stoneMat);
    wall.position.set(0.3, 0.35, 0.75);
    wall.castShadow = true;
    terrainGroup.add(wall);
  }

  // -------------------------------------------------------------
  // 4. FLOATING SATELLITE ISLETS & AMBIENT CLOUDS
  // -------------------------------------------------------------
  // Satellite Islet 1 (East)
  const is1 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.7, 0), stoneMat);
  is1.position.set(4.9, -1.1, 1.8);
  is1.castShadow = true;
  const isTop1 = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.18, 6), grassMat);
  isTop1.position.set(4.9, -0.85, 1.8);
  terrainGroup.add(is1, isTop1);

  // Satellite Islet 2 (West)
  const is2 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.52, 0), stoneMat);
  is2.position.set(-4.6, -1.6, -1.8);
  is2.castShadow = true;
  terrainGroup.add(is2);

  // Soft low-poly clouds drifting around bottom cliffs
  terrainGroup.add(createCloudCluster([3.5, -2.6, -2.6], 1.05));
  terrainGroup.add(createCloudCluster([-3.8, -2.8, 1.8], 0.95));
  terrainGroup.add(createCloudCluster([0.6, -4.0, 2.7], 0.8));

  // Fantasy variant additions: Floating arcane crystals orbiting the island
  if (variant === 'fantasy') {
    const crystalMat = createLowPolyMat(0x9d4edd, {
      roughness: 0.2,
      metalness: 0.35,
      emissive: 0x5a189a,
    });
    const cr1 = new THREE.Mesh(new THREE.OctahedronGeometry(0.55, 0), crystalMat);
    cr1.position.set(4.2, 1.4, 2.6);
    const cr2 = new THREE.Mesh(new THREE.OctahedronGeometry(0.42, 0), crystalMat);
    cr2.position.set(-4.1, 0.9, -2.4);
    const cr3 = new THREE.Mesh(new THREE.OctahedronGeometry(0.36, 0), crystalMat);
    cr3.position.set(-1.1, -3.6, 2.2);
    terrainGroup.add(cr1, cr2, cr3);
  }

  return terrainGroup;
}
