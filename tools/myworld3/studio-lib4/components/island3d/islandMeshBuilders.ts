import * as THREE from 'three';
import { IslandMetadata, IslandVariant } from '../../types/island';
import { buildDioramaScene } from './dioramaMeshBuilders';
import { buildObjectScene } from './objectMeshBuilders';
import {
  buildExpansionMajorWorld,
  buildExpansionSubIsland,
  buildExpansionBuilding,
  buildExpansionObject,
} from './expansionMeshBuilders';
import { buildMuseumDioramaScene } from './museumDioramaMeshBuilders';
import { buildOutdoorExpoSetScene } from './outdoorExpoSetMeshBuilders';
import { buildMuseumObjectScene } from './museumObjectMeshBuilders';
import { buildExpoFacilityScene, buildMuseumDecorScene } from './expoAndDecorMeshBuilders';
import { buildIndoorDecorScene, buildOutdoorDecorScene } from './indoorOutdoorDecorMeshBuilders';
import {
  createLowPolyMat,
  createWaterMat,
  createGlassMat,
  createTree,
  createBush,
  createFlowerPatch,
  createCloudCluster,
  createStoneSteps,
  createLanternPost,
  createWoodenFence,
  createWaterfallMesh,
  createChimneySmoke,
} from './materials';
import { buildRichIslandTerrain, TerrainArchetype } from './terrain';

// Re-export helpers for external consumers
export { createLowPolyMat, createTree, createCloudCluster };

// Shared base builder
export function createFloatingBase(island: IslandMetadata, variant: IslandVariant): THREE.Group {
  let archetype: TerrainArchetype = 'plateau';
  if (island.slug === 'history-ancient') archetype = 'ancient_ruins';
  else if (island.slug === 'science-observatory' || island.slug === 'nature-forest') archetype = 'alpine_crag';
  else if (island.slug === 'ocean-coastal') archetype = 'coastal_beach';
  else if (island.slug === 'food-farm') archetype = 'farmland_terrace';
  else if (island.slug === 'home-village' || island.slug === 'family-garden') archetype = 'village_meadow';
  else if (island.slug === 'animals-sanctuary' || island.slug === 'skills-workshop') archetype = 'sacred_forest';
  else if (island.slug === 'dreams-castle') archetype = 'celestial_crystal';
  else if (island.slug === 'work-office' || island.slug === 'music-studio' || island.slug === 'collections-museum') archetype = 'modern_civic';

  return buildRichIslandTerrain(island, variant, archetype);
}

// =============================================================
// 1. MY KNOWLEDGE — Library Island (Hero Reference)
// =============================================================
function buildKnowledgeIsland(variant: IslandVariant): THREE.Group {
  const g = new THREE.Group();

  const wallMat = createLowPolyMat(0xf6ede3, { roughness: 0.78 });
  const trimMat = createLowPolyMat(0xe2d4c0, { roughness: 0.82 });
  const roofColor = variant === 'fantasy' ? 0x8a72b8 : 0xd86c4c;
  const roofMat = createLowPolyMat(roofColor, { roughness: 0.68 });
  const stoneMat = createLowPolyMat(0x8a7e72, { roughness: 0.88 });
  const woodMat = createLowPolyMat(0x654329, { roughness: 0.82 });
  const goldMat = createLowPolyMat(0xedc55e, { metalness: 0.45, roughness: 0.35 });
  const glassMat = createGlassMat(0xc4e5ed, 0.75);

  // --- Main Library Building ---
  const libGroup = new THREE.Group();
  libGroup.position.set(0.6, 0.7, -0.6);

  // Plinth foundation
  const foundation = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.3, 2.3), stoneMat);
  foundation.position.y = 0.15;
  foundation.receiveShadow = true;
  libGroup.add(foundation);

  // Main 2-story Hall
  const mainHall = new THREE.Mesh(new THREE.BoxGeometry(2.7, 1.8, 2.1), wallMat);
  mainHall.position.y = 1.2;
  mainHall.castShadow = true;
  mainHall.receiveShadow = true;
  libGroup.add(mainHall);

  // Windows with frames
  for (let i = -1; i <= 1; i += 2) {
    const win = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.65, 0.08), glassMat);
    win.position.set(i * 0.75, 1.4, 1.06);
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.75, 0.05), woodMat);
    frame.position.set(i * 0.75, 1.4, 1.04);
    libGroup.add(win, frame);
  }

  // Layered Hipped Roof with Overhang
  const roofGeo = new THREE.ConeGeometry(2.25, 1.15, 4);
  roofGeo.rotateY(Math.PI / 4);
  const mainRoof = new THREE.Mesh(roofGeo, roofMat);
  mainRoof.position.set(0, 2.65, 0);
  mainRoof.scale.set(1.15, 1.0, 0.95);
  mainRoof.castShadow = true;
  libGroup.add(mainRoof);

  // Roof Dormer Window
  const dormer = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.45, 0.5), wallMat);
  dormer.position.set(0, 2.4, 0.65);
  const dormerRoof = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.35, 4), roofMat);
  dormerRoof.rotateY(Math.PI / 4);
  dormerRoof.position.set(0, 2.75, 0.65);
  libGroup.add(dormer, dormerRoof);

  // Entrance Portico with Fluted Columns
  const porticoRoof = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.18, 0.8), trimMat);
  porticoRoof.position.set(0, 1.5, 1.35);
  porticoRoof.castShadow = true;
  const colL = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.2, 6), trimMat);
  colL.position.set(-0.55, 0.9, 1.6);
  const colR = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.2, 6), trimMat);
  colR.position.set(0.55, 0.9, 1.6);
  const archedDoor = new THREE.Mesh(new THREE.BoxGeometry(0.65, 1.1, 0.08), woodMat);
  archedDoor.position.set(0, 0.85, 1.06);
  libGroup.add(porticoRoof, colL, colR, archedDoor);

  // Grand Entrance Steps leading down to lawn
  const steps = createStoneSteps(4, 1.3, 0.22, 0.12, [0, 0, 1.8], 0, 0xdfd6c8);
  libGroup.add(steps);

  g.add(libGroup);

  // --- Clock Tower ---
  const towerGroup = new THREE.Group();
  towerGroup.position.set(-1.1, 0.7, -0.8);

  const towerBody = new THREE.Mesh(new THREE.BoxGeometry(1.1, 3.4, 1.1), wallMat);
  towerBody.position.y = 1.7;
  towerBody.castShadow = true;
  towerBody.receiveShadow = true;

  // Tower mid trim band
  const band = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.15, 1.18), trimMat);
  band.position.y = 2.4;

  // Balcony rail
  const balcony = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.25, 1.22), stoneMat);
  balcony.position.y = 3.35;

  // Clock faces (Front and Side)
  const clockGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.08, 8);
  const clockF = new THREE.Mesh(clockGeo, goldMat);
  clockF.rotateX(Math.PI / 2);
  clockF.position.set(0, 2.9, 0.56);
  const clockS = new THREE.Mesh(clockGeo, goldMat);
  clockS.rotateZ(Math.PI / 2);
  clockS.position.set(0.56, 2.9, 0);

  // Clock Spire
  const spireGeo = new THREE.ConeGeometry(0.85, 1.6, 4);
  spireGeo.rotateY(Math.PI / 4);
  const spire = new THREE.Mesh(spireGeo, roofMat);
  spire.position.y = 4.2;
  spire.castShadow = true;

  // Spire Weathervane Finial
  const finial = new THREE.Mesh(new THREE.OctahedronGeometry(0.12, 0), goldMat);
  finial.position.y = 5.1;

  towerGroup.add(towerBody, band, balcony, clockF, clockS, spire, finial);
  g.add(towerGroup);

  // --- Twin Giant Open Tomes on the Reading Lawn ---
  const bookGroup = new THREE.Group();
  bookGroup.position.set(-1.2, 0.45, 1.6);
  bookGroup.rotation.set(-0.1, 0.35, 0.05);

  const bookPaperMat = createLowPolyMat(0xf6f0e2, { roughness: 0.88 });
  const bookCoverMat = createLowPolyMat(0x8c3426, { roughness: 0.75 });
  const ribbonMat = createLowPolyMat(0xc43241, { roughness: 0.65 });

  const leftP = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.15, 1.8), bookPaperMat);
  leftP.position.set(-0.65, 0.08, 0);
  leftP.rotation.z = 0.12;

  const rightP = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.15, 1.8), bookPaperMat);
  rightP.position.set(0.65, 0.08, 0);
  rightP.rotation.z = -0.12;

  const cover = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.08, 1.9), bookCoverMat);
  cover.position.set(0, -0.02, 0);

  const ribbon = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.04, 1.4), ribbonMat);
  ribbon.position.set(0.1, 0.18, 0.4);
  ribbon.rotation.y = 0.2;

  // Stack of small tomes beside
  const smallBook = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.12, 0.8), createLowPolyMat(0x32527b, { roughness: 0.7 }));
  smallBook.position.set(1.4, 0.06, -0.3);
  smallBook.rotation.y = 0.4;

  bookGroup.add(leftP, rightP, cover, ribbon, smallBook);
  g.add(bookGroup);

  // --- Reading Garden & Pergola ---
  const gardenGroup = new THREE.Group();
  gardenGroup.position.set(2.2, 0.45, 0.6);

  // Timber Pergola
  const pergMat = createLowPolyMat(0x735238, { roughness: 0.8 });
  for (let i = 0; i < 4; i++) {
    const px = (i % 2) * 1.2 - 0.6;
    const pz = Math.floor(i / 2) * 1.0 - 0.5;
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.3, 5), pergMat);
    post.position.set(px, 0.65, pz);
    gardenGroup.add(post);
  }
  const beam1 = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.06, 0.08), pergMat);
  beam1.position.set(0, 1.3, -0.5);
  const beam2 = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.06, 0.08), pergMat);
  beam2.position.set(0, 1.3, 0.5);
  gardenGroup.add(beam1, beam2);

  // Garden Stone Bench
  const bench = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.35, 0.35), stoneMat);
  bench.position.set(0, 0.2, 0);
  gardenGroup.add(bench);

  // Flower pots & climbing vines
  gardenGroup.add(createFlowerPatch([0, 0.1, 0.7], [0xf2a1b5, 0xffd166, 0xffffff]));
  g.add(gardenGroup);

  // --- Cascading Waterfall & Stream ---
  // Channel origin on upper terrace flowing over the edge
  const waterColor = variant === 'fantasy' ? 0x8ecae6 : 0x4fa8b8;
  const streamGeo = new THREE.BoxGeometry(0.9, 0.12, 1.6);
  const stream = new THREE.Mesh(streamGeo, createWaterMat(waterColor));
  stream.position.set(2.4, 0.35, -1.2);
  g.add(stream);

  // Waterfall dropping over the cliff
  const fall = createWaterfallMesh(0.9, 2.2, [2.4, 0.35, -2.05], waterColor);
  g.add(fall);

  // --- Vegetation & Lighting Details ---
  g.add(createTree('oak', [-2.4, 0.45, -0.4], 1.1));
  g.add(createTree('pine', [-2.1, 0.45, -1.8], 1.2));
  g.add(createTree('blossom', [2.5, 0.45, 1.6], 0.95));
  g.add(createTree('pine', [0.8, 0.45, -2.2], 0.85));

  g.add(createBush([-0.3, 0.45, 1.9], 0.6));
  g.add(createBush([1.4, 0.45, 1.7], 0.5));
  g.add(createBush([-2.2, 0.45, 1.0], 0.55));

  g.add(createLanternPost([1.3, 0.45, 1.2]));
  g.add(createLanternPost([-0.4, 0.45, 2.4]));

  return g;
}

// =============================================================
// 2. MY HISTORY — Ancient Civilization Island
// =============================================================
function buildHistoryIsland(variant: IslandVariant): THREE.Group {
  const g = new THREE.Group();

  const marbleMat = createLowPolyMat(0xe8e2d5, { roughness: 0.85 });
  const wornStoneMat = createLowPolyMat(0xbaa993, { roughness: 0.9 });
  const terracottaMat = createLowPolyMat(0xc4684b, { roughness: 0.8 });
  const goldAccentMat = createLowPolyMat(0xdfb750, { metalness: 0.4, roughness: 0.35 });

  // --- Classical Greco-Roman Temple Ruins ---
  const templeGroup = new THREE.Group();
  templeGroup.position.set(0.8, 0.8, -0.6);

  // Stepped Crepidoma Foundation
  const step1 = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.2, 2.6), marbleMat);
  step1.position.y = 0.1;
  const step2 = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.2, 2.3), marbleMat);
  step2.position.y = 0.28;
  templeGroup.add(step1, step2);

  // Fluted Columns (6 Standing Columns)
  const colGeo = new THREE.CylinderGeometry(0.12, 0.14, 1.6, 7);
  const capitalGeo = new THREE.BoxGeometry(0.34, 0.12, 0.34);

  const colPositions: [number, number][] = [
    [-1.0, -0.7], [0, -0.7], [1.0, -0.7],
    [-1.0, 0.7], [1.0, 0.7], [0, 0.7]
  ];

  colPositions.forEach(([cx, cz], idx) => {
    // Leave front center broken/fallen for ruined look
    if (idx === 5) return;
    const col = new THREE.Mesh(colGeo, marbleMat);
    col.position.set(cx, 1.18, cz);
    col.castShadow = true;
    const cap = new THREE.Mesh(capitalGeo, marbleMat);
    cap.position.set(cx, 2.04, cz);
    templeGroup.add(col, cap);
  });

  // Entablature Architrave Beam
  const architrave = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.25, 0.45), marbleMat);
  architrave.position.set(0, 2.18, -0.7);
  architrave.castShadow = true;
  templeGroup.add(architrave);

  // Classical Triangular Pediment
  const pedimentGeo = new THREE.ConeGeometry(1.6, 0.7, 4);
  pedimentGeo.rotateY(Math.PI / 4);
  const pediment = new THREE.Mesh(pedimentGeo, marbleMat);
  pediment.position.set(0, 2.65, -0.7);
  pediment.scale.set(1.0, 1.0, 0.35);
  pediment.castShadow = true;
  templeGroup.add(pediment);

  // Fallen Column Drum (Ruin detail)
  const brokenDrum = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.65, 7), marbleMat);
  brokenDrum.rotation.z = Math.PI / 2;
  brokenDrum.position.set(0.1, 0.48, 0.65);
  templeGroup.add(brokenDrum);

  g.add(templeGroup);

  // --- Sunken Stone Amphitheater ---
  const amphitheaterGroup = new THREE.Group();
  amphitheaterGroup.position.set(-1.6, 0.25, 1.1);

  // Semicircular stepped tiers
  for (let r = 0; r < 3; r++) {
    const rad = 1.0 + r * 0.45;
    const tierGeo = new THREE.CylinderGeometry(rad, rad, 0.2, 8, 1, false, 0, Math.PI);
    const tier = new THREE.Mesh(tierGeo, wornStoneMat);
    tier.position.y = r * 0.2;
    tier.rotation.y = 0.4;
    amphitheaterGroup.add(tier);
  }

  // Central Orchestra Floor with star mosaic
  const orchFloor = new THREE.Mesh(new THREE.CircleGeometry(0.75, 8), marbleMat);
  orchFloor.rotateX(-Math.PI / 2);
  orchFloor.position.y = 0.05;
  const starMosaic = new THREE.Mesh(new THREE.OctahedronGeometry(0.25, 0), goldAccentMat);
  starMosaic.position.set(0, 0.08, 0);
  starMosaic.scale.set(1, 0.15, 1);
  amphitheaterGroup.add(orchFloor, starMosaic);

  g.add(amphitheaterGroup);

  // --- Monumental Egyptian / Classical Obelisk ---
  const obeliskGroup = new THREE.Group();
  obeliskGroup.position.set(2.3, 0.45, 1.4);

  // Stepped Plinth
  const obPlinth1 = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.2, 1.1), marbleMat);
  obPlinth1.position.y = 0.1;
  const obPlinth2 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.25, 0.8), marbleMat);
  obPlinth2.position.y = 0.32;

  // Slender 4-sided Tapered Obelisk Shaft
  const obShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.3, 3.2, 4), marbleMat);
  obShaft.rotateY(Math.PI / 4);
  obShaft.position.y = 2.05;
  obShaft.castShadow = true;

  // Pyramidion tip in gold
  const pyramidion = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.5, 4), goldAccentMat);
  pyramidion.rotateY(Math.PI / 4);
  pyramidion.position.y = 3.9;
  pyramidion.castShadow = true;

  obeliskGroup.add(obPlinth1, obPlinth2, obShaft, pyramidion);
  g.add(obeliskGroup);

  // Terracotta Amphora Urns scattered by ruins
  const urnGeo = new THREE.CylinderGeometry(0.12, 0.08, 0.38, 6);
  const urn1 = new THREE.Mesh(urnGeo, terracottaMat);
  urn1.position.set(-0.5, 0.45, 0.2);
  const urn2 = new THREE.Mesh(urnGeo, terracottaMat);
  urn2.position.set(0.2, 0.45, 1.6);
  urn2.rotation.z = 0.3;
  g.add(urn1, urn2);

  // Mediterranean Cypress & Olive Trees
  g.add(createTree('cypress', [-2.4, 0.35, -1.2], 1.25));
  g.add(createTree('cypress', [-2.0, 0.35, -2.1], 1.05));
  g.add(createTree('cypress', [2.5, 0.45, -1.8], 1.15));
  g.add(createTree('oak', [-0.8, 0.45, -2.2], 0.85));

  g.add(createBush([0.8, 0.45, 2.2], 0.55, 0x7a8a58));
  g.add(createBush([-1.1, 0.45, -0.6], 0.5, 0x8a9a68));

  return g;
}

// =============================================================
// 3. MY SCIENCE — Observatory & Laboratory Island
// =============================================================
function buildScienceIsland(variant: IslandVariant): THREE.Group {
  const g = new THREE.Group();

  const whiteMat = createLowPolyMat(0xf4f7f6, { roughness: 0.65 });
  const metalDomeMat = createLowPolyMat(0xa8bcc8, { metalness: 0.45, roughness: 0.35 });
  const brassMat = createLowPolyMat(0xd4af37, { metalness: 0.55, roughness: 0.3 });
  const labMat = createLowPolyMat(0x3d5a80, { roughness: 0.7 });
  const glassMat = createGlassMat(0x90e0ef, 0.7);
  const frameMat = createLowPolyMat(0x293241, { roughness: 0.6 });

  // --- Main Astronomical Observatory (High Peak) ---
  const obsGroup = new THREE.Group();
  obsGroup.position.set(-0.8, 1.4, -0.8);

  // Cylindrical Stone Base
  const baseCyl = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.6, 1.6, 10), whiteMat);
  baseCyl.position.y = 0.8;
  baseCyl.castShadow = true;
  baseCyl.receiveShadow = true;

  // Mid Observation Ring Balcony
  const ring = new THREE.Mesh(new THREE.CylinderGeometry(1.65, 1.65, 0.18, 10), frameMat);
  ring.position.y = 1.6;

  // Hemispherical Observatory Dome
  const domeGeo = new THREE.SphereGeometry(1.4, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2);
  const dome = new THREE.Mesh(domeGeo, metalDomeMat);
  dome.position.y = 1.7;
  dome.castShadow = true;

  // Open Viewing Slit (Dark rectangular cut)
  const slit = new THREE.Mesh(new THREE.BoxGeometry(0.38, 1.2, 0.8), frameMat);
  slit.position.set(0.65, 2.3, 0.65);
  slit.rotation.y = Math.PI / 4;

  // Large Optical Brass Telescope protruding through the slit
  const scopeTube = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 2.1, 8), brassMat);
  scopeTube.rotation.set(-0.65, 0.35, 0.5);
  scopeTube.position.set(0.85, 2.65, 0.85);
  scopeTube.castShadow = true;

  obsGroup.add(baseCyl, ring, dome, slit, scopeTube);
  g.add(obsGroup);

  // --- Modern Laboratory Annex ---
  const labGroup = new THREE.Group();
  labGroup.position.set(1.4, 0.45, 0.4);

  const labBuilding = new THREE.Mesh(new THREE.BoxGeometry(1.9, 1.3, 1.5), labMat);
  labBuilding.position.y = 0.65;
  labBuilding.castShadow = true;
  labBuilding.receiveShadow = true;

  // Laboratory corner ribbon windows
  const ribbonWin = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.45, 0.6), glassMat);
  ribbonWin.position.set(0, 0.85, 0.5);

  // Rooftop Solar Panel Array
  const solarMat = createLowPolyMat(0x1d3557, { metalness: 0.6, roughness: 0.2 });
  const solar1 = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.06, 0.55), solarMat);
  solar1.position.set(-0.4, 1.38, 0);
  solar1.rotation.x = 0.25;
  const solar2 = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.06, 0.55), solarMat);
  solar2.position.set(0.4, 1.38, 0);
  solar2.rotation.x = 0.25;

  labGroup.add(labBuilding, ribbonWin, solar1, solar2);
  g.add(labGroup);

  // --- Botanical Research Greenhouse ---
  const ghGroup = new THREE.Group();
  ghGroup.position.set(1.5, 0.45, -1.4);

  const ghBase = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.3, 1.1), frameMat);
  ghBase.position.y = 0.15;

  const ghGlass = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.8, 1.0), glassMat);
  ghGlass.position.y = 0.7;

  // Vaulted Glass Roof
  const ghRoof = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 1.4, 6, 1, false, 0, Math.PI), glassMat);
  ghRoof.rotation.z = Math.PI / 2;
  ghRoof.position.y = 1.1;

  // Specimen plants inside
  const plant1 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.25, 0), createLowPolyMat(0x2a9d8f));
  plant1.position.set(-0.3, 0.5, 0);
  const plant2 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.2, 0), createLowPolyMat(0xe76f51));
  plant2.position.set(0.3, 0.5, 0);

  ghGroup.add(ghBase, ghGlass, ghRoof, plant1, plant2);
  g.add(ghGroup);

  // --- Communications Mast & Satellite Dish ---
  const mastGroup = new THREE.Group();
  mastGroup.position.set(-2.2, 0.45, 1.4);

  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.08, 2.6, 5), frameMat);
  mast.position.y = 1.3;
  mast.castShadow = true;

  // Parabolic Satellite Dish
  const dish = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.15, 0.15, 8), whiteMat);
  dish.rotation.set(0.4, 0.3, -0.6);
  dish.position.set(0.1, 2.1, 0);

  // Mast beacon light
  const beacon = new THREE.Mesh(new THREE.OctahedronGeometry(0.1, 0), createLowPolyMat(0xef233c, { emissive: 0xef233c }));
  beacon.position.y = 2.65;

  mastGroup.add(mast, dish, beacon);
  g.add(mastGroup);

  // Alpine Vegetation
  g.add(createTree('pine', [-2.4, 0.45, -0.2], 1.2));
  g.add(createTree('pine', [-1.8, 1.4, -2.2], 0.9));
  g.add(createTree('pine', [2.5, 0.45, 1.6], 1.0));
  g.add(createBush([0.2, 0.45, 1.6], 0.5, 0x457b9d));

  return g;
}

// =============================================================
// 4. MY BOOKS — Literary Island
// =============================================================
function buildBooksIsland(variant: IslandVariant): THREE.Group {
  const g = new THREE.Group();

  const woodMat = createLowPolyMat(0x654321, { roughness: 0.8 });
  const paperMat = createLowPolyMat(0xf7f1e3, { roughness: 0.9 });
  const redCover = createLowPolyMat(0xa72626, { roughness: 0.75 });
  const blueCover = createLowPolyMat(0x27496d, { roughness: 0.75 });
  const greenCover = createLowPolyMat(0x2c5e3b, { roughness: 0.75 });
  const goldCover = createLowPolyMat(0xda9100, { roughness: 0.5, metalness: 0.3 });

  // Book Pavilion (Walls and roof shaped as towering antique books)
  const bookTower1 = new THREE.Group();
  bookTower1.position.set(-0.8, 0.45, -0.6);

  // Stack of 4 giant books forming a study tower
  const booksData = [
    { mat: redCover, h: 0.5, w: 2.2, d: 1.7, rot: 0.05 },
    { mat: blueCover, h: 0.45, w: 2.0, d: 1.5, rot: -0.1 },
    { mat: goldCover, h: 0.5, w: 1.8, d: 1.4, rot: 0.15 },
    { mat: greenCover, h: 0.4, w: 1.6, d: 1.3, rot: -0.05 },
  ];

  let currentY = 0;
  booksData.forEach((b) => {
    const bookMesh = new THREE.Mesh(new THREE.BoxGeometry(b.w, b.h, b.d), b.mat);
    bookMesh.position.y = currentY + b.h / 2;
    bookMesh.rotation.y = b.rot;
    bookMesh.castShadow = true;
    bookMesh.receiveShadow = true;

    // Pages edge inset
    const pageMesh = new THREE.Mesh(new THREE.BoxGeometry(b.w - 0.15, b.h - 0.1, b.d - 0.1), paperMat);
    pageMesh.position.set(0.06, currentY + b.h / 2, 0);
    pageMesh.rotation.y = b.rot;

    bookTower1.add(bookMesh, pageMesh);
    currentY += b.h;
  });

  // Open book roof over the study kiosk
  const openRoofL = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.1, 1.4), redCover);
  openRoofL.position.set(-0.55, currentY + 0.3, 0);
  openRoofL.rotation.z = 0.35;
  const openRoofR = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.1, 1.4), redCover);
  openRoofR.position.set(0.55, currentY + 0.3, 0);
  openRoofR.rotation.z = -0.35;
  bookTower1.add(openRoofL, openRoofR);

  g.add(bookTower1);

  // Stream & Bridge of Book Spines
  const stream = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.1, 3.4), createWaterMat(0x4361ee));
  stream.position.set(1.2, 0.35, 0);
  stream.rotation.y = 0.2;
  g.add(stream);

  // Arched Wooden Bridge
  const bridge = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.8, 6, 1, false, 0, Math.PI), woodMat);
  bridge.rotation.set(0, 0.2, -Math.PI / 2);
  bridge.position.set(1.2, 0.45, 0);
  bridge.scale.set(1, 0.35, 1);
  g.add(bridge);

  // Reading Kiosk with Armchair & Reading Lamp
  const chair = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.5, 0.65), redCover);
  chair.position.set(1.8, 0.7, 1.2);
  chair.castShadow = true;
  g.add(chair);
  g.add(createLanternPost([1.3, 0.45, 1.4], 0xffe066));

  // Weeping Willow & Maples
  g.add(createTree('willow', [-2.2, 0.45, 1.2], 1.1));
  g.add(createTree('maple', [2.2, 0.45, -1.6], 1.0));
  g.add(createBush([-1.6, 0.45, 2.0], 0.6));

  return g;
}

// =============================================================
// 5. MY SKILLS — Workshop & Forge Island
// =============================================================
function buildSkillsIsland(variant: IslandVariant): THREE.Group {
  const g = new THREE.Group();

  const timberMat = createLowPolyMat(0x4a3525, { roughness: 0.85 });
  const plasterMat = createLowPolyMat(0xecdcc9, { roughness: 0.8 });
  const roofMat = createLowPolyMat(0x8a4b38, { roughness: 0.75 });
  const stoneMat = createLowPolyMat(0x756b62, { roughness: 0.9 });
  const ironMat = createLowPolyMat(0x2b2d42, { metalness: 0.6, roughness: 0.4 });
  const goldMat = createLowPolyMat(0xf4a261, { metalness: 0.4, roughness: 0.35 });

  // --- Craftsman Guild Workshop ---
  const shop = new THREE.Group();
  shop.position.set(-0.6, 0.45, -0.6);

  // Base stone wall
  const base = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.5, 2.0), stoneMat);
  base.position.y = 0.25;
  base.castShadow = true;

  // Timber framed upper floor
  const upper = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.2, 1.8), plasterMat);
  upper.position.y = 1.1;
  upper.castShadow = true;

  // Pitched Shingle Roof
  const roofGeo = new THREE.ConeGeometry(1.8, 1.0, 4);
  roofGeo.rotateY(Math.PI / 4);
  const roof = new THREE.Mesh(roofGeo, roofMat);
  roof.position.set(0, 2.1, 0);
  roof.scale.set(1.15, 1.0, 0.95);
  roof.castShadow = true;

  // Stone Forge Chimney with Smoke
  const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.65, 2.5, 0.65), stoneMat);
  chimney.position.set(1.1, 1.25, -0.6);
  chimney.castShadow = true;
  const smoke = createChimneySmoke([1.1, 2.6, -0.6]);

  shop.add(base, upper, roof, chimney, smoke);
  g.add(shop);

  // Turning Waterwheel & Mill Flume
  const wheelGroup = new THREE.Group();
  wheelGroup.position.set(-1.8, 0.45, -0.6);
  wheelGroup.rotation.y = Math.PI / 2;

  const wheelRim = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 0.18, 8), timberMat);
  wheelRim.rotation.z = Math.PI / 2;
  wheelRim.castShadow = true;
  wheelGroup.add(wheelRim);
  g.add(wheelGroup);

  // Outdoor Blacksmith Smithy Yard
  const smithy = new THREE.Group();
  smithy.position.set(1.2, 0.45, 1.0);

  // Anvil on tree stump
  const stump = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.35, 0.5, 6), timberMat);
  stump.position.y = 0.25;
  const anvil = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.25, 0.25), ironMat);
  anvil.position.set(0, 0.55, 0);
  anvil.castShadow = true;
  smithy.add(stump, anvil);

  // Fire Pit with glowing coals
  const firePit = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.5, 0.2, 6), stoneMat);
  firePit.position.set(0.9, 0.1, -0.2);
  const coal = new THREE.Mesh(new THREE.DodecahedronGeometry(0.2, 0), createLowPolyMat(0xe63946, { emissive: 0xe63946 }));
  coal.position.set(0.9, 0.22, -0.2);
  smithy.add(firePit, coal);

  // Stacked lumber logs
  const logGeo = new THREE.CylinderGeometry(0.1, 0.1, 1.0, 5);
  for (let i = 0; i < 3; i++) {
    const log = new THREE.Mesh(logGeo, timberMat);
    log.rotation.z = Math.PI / 2;
    log.position.set(-0.8, 0.1 + i * 0.12, 0.5);
    smithy.add(log);
  }

  g.add(smithy);

  // Central Golden "Skill Tree"
  const skillTreeGroup = new THREE.Group();
  skillTreeGroup.position.set(1.6, 0.45, -1.2);
  const skillTree = createTree('oak', [0, 0, 0], 1.2);
  // Give foliage a majestic golden sheen
  skillTree.traverse((child) => {
    if (child instanceof THREE.Mesh && child.geometry instanceof THREE.DodecahedronGeometry) {
      child.material = goldMat;
    }
  });
  skillTreeGroup.add(skillTree);
  g.add(skillTreeGroup);

  g.add(createTree('pine', [-2.2, 0.45, 1.4], 1.0));
  g.add(createWoodenFence(2.2, [-0.2, 0.45, 2.0], 0));

  return g;
}

// =============================================================
// 6. MY HOME — Cozy Village Island
// =============================================================
function buildHomeIsland(variant: IslandVariant): THREE.Group {
  const g = new THREE.Group();

  const cottagePlaster = createLowPolyMat(0xf5eedc, { roughness: 0.8 });
  const woodBeam = createLowPolyMat(0x523924, { roughness: 0.85 });
  const slateRoof = createLowPolyMat(0x4a5568, { roughness: 0.7 });
  const tileRoof = createLowPolyMat(0xd06a4c, { roughness: 0.7 });
  const stoneMat = createLowPolyMat(0x7c7365, { roughness: 0.9 });
  const doorWood = createLowPolyMat(0x78350f, { roughness: 0.8 });

  // Cottage 1 (Primary Half-Timbered Home)
  const cot1 = new THREE.Group();
  cot1.position.set(-0.8, 0.45, -0.6);

  const b1 = new THREE.Mesh(new THREE.BoxGeometry(2.1, 1.5, 1.7), cottagePlaster);
  b1.position.y = 0.75;
  b1.castShadow = true;
  b1.receiveShadow = true;

  // Layered Gabled Roof
  const r1Geo = new THREE.ConeGeometry(1.65, 1.1, 4);
  r1Geo.rotateY(Math.PI / 4);
  const r1 = new THREE.Mesh(r1Geo, tileRoof);
  r1.position.set(0, 1.95, 0);
  r1.scale.set(1.1, 1.0, 0.9);
  r1.castShadow = true;

  // Chimney & Smoke
  const ch1 = new THREE.Mesh(new THREE.BoxGeometry(0.45, 2.1, 0.45), stoneMat);
  ch1.position.set(0.8, 1.3, -0.4);
  ch1.castShadow = true;
  const sm1 = createChimneySmoke([0.8, 2.45, -0.4]);

  // Front Door & Flower Box
  const door = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.85, 0.08), doorWood);
  door.position.set(0, 0.45, 0.88);
  const flowerBox = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.15, 0.18), woodBeam);
  flowerBox.position.set(-0.6, 0.7, 0.88);

  cot1.add(b1, r1, ch1, sm1, door, flowerBox);
  g.add(cot1);

  // Cottage 2 (Secondary Village Cottage)
  const cot2 = new THREE.Group();
  cot2.position.set(1.4, 0.45, -0.4);

  const b2 = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.3, 1.5), cottagePlaster);
  b2.position.y = 0.65;
  b2.castShadow = true;

  const r2Geo = new THREE.ConeGeometry(1.3, 0.9, 4);
  r2Geo.rotateY(Math.PI / 4);
  const r2 = new THREE.Mesh(r2Geo, slateRoof);
  r2.position.set(0, 1.65, 0);
  r2.castShadow = true;

  cot2.add(b2, r2);
  g.add(cot2);

  // Village Stone Water Well
  const well = new THREE.Group();
  well.position.set(-0.2, 0.45, 1.2);

  const wellStone = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.5, 0.4, 7), stoneMat);
  wellStone.position.y = 0.2;
  wellStone.castShadow = true;

  const wellCanopy = new THREE.Mesh(new THREE.ConeGeometry(0.55, 0.45, 4), tileRoof);
  wellCanopy.rotateY(Math.PI / 4);
  wellCanopy.position.y = 0.95;

  well.add(wellStone, wellCanopy);
  g.add(well);

  // Cobblestone lane
  for (let i = 0; i < 5; i++) {
    const stone = new THREE.Mesh(new THREE.DodecahedronGeometry(0.22, 0), stoneMat);
    stone.position.set(-0.6 + i * 0.35, 0.48, 0.6 + (i % 2) * 0.15);
    stone.scale.set(1, 0.2, 1);
    g.add(stone);
  }

  // Fences, Trees, and Gardens
  g.add(createWoodenFence(2.0, [1.4, 0.45, 1.4], -0.3));
  g.add(createTree('oak', [-2.2, 0.45, 1.4], 1.15));
  g.add(createTree('blossom', [2.4, 0.45, -1.6], 1.0));
  g.add(createFlowerPatch([0.8, 0.45, 1.2], [0xf25f4c, 0xffd166, 0x70c1b3]));
  g.add(createBush([-1.8, 0.45, -1.6], 0.6));

  return g;
}

// =============================================================
// 7. MY FAMILY — Family Garden Island
// =============================================================
function buildFamilyIsland(variant: IslandVariant): THREE.Group {
  const g = new THREE.Group();

  const wallMat = createLowPolyMat(0xfdfbf7, { roughness: 0.75 });
  const roofMat = createLowPolyMat(0x3d5a80, { roughness: 0.7 });
  const porchMat = createLowPolyMat(0x8d5b4c, { roughness: 0.8 });
  const woodMat = createLowPolyMat(0x6a4a3c, { roughness: 0.85 });

  // Family Homestead with Covered Veranda
  const house = new THREE.Group();
  house.position.set(-0.8, 0.45, -0.6);

  const main = new THREE.Mesh(new THREE.BoxGeometry(2.3, 1.7, 1.9), wallMat);
  main.position.y = 0.85;
  main.castShadow = true;

  const roofGeo = new THREE.ConeGeometry(1.8, 1.2, 4);
  roofGeo.rotateY(Math.PI / 4);
  const roof = new THREE.Mesh(roofGeo, roofMat);
  roof.position.set(0, 2.2, 0);
  roof.scale.set(1.15, 1.0, 0.95);
  roof.castShadow = true;

  // Front Porch Deck
  const deck = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.18, 0.8), porchMat);
  deck.position.set(0, 0.09, 1.2);
  const porchRoof = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.1, 0.8), roofMat);
  porchRoof.position.set(0, 1.3, 1.2);

  house.add(main, roof, deck, porchRoof);
  g.add(house);

  // Large Sprawling Blossom Tree with Wooden Swing
  const swingTree = new THREE.Group();
  swingTree.position.set(1.6, 0.45, 0.6);
  const blossom = createTree('blossom', [0, 0, 0], 1.35);

  // Swing ropes and wooden seat
  const ropeL = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 1.1, 4), woodMat);
  ropeL.position.set(-0.25, 1.2, 0.2);
  const ropeR = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 1.1, 4), woodMat);
  ropeR.position.set(0.25, 1.2, 0.2);
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.06, 0.22), woodMat);
  seat.position.set(0, 0.65, 0.2);

  swingTree.add(blossom, ropeL, ropeR, seat);
  g.add(swingTree);

  // Family Outdoor Picnic Table & Barbecue
  const picnic = new THREE.Group();
  picnic.position.set(-0.6, 0.45, 1.3);

  const table = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.45, 0.6), woodMat);
  table.position.y = 0.25;
  const bench1 = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.25, 0.22), woodMat);
  bench1.position.set(0, 0.15, -0.45);
  const bench2 = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.25, 0.22), woodMat);
  bench2.position.set(0, 0.15, 0.45);

  picnic.add(table, bench1, bench2);
  g.add(picnic);

  // Raised Vegetable Garden beds with crops
  const gardenBed = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.2, 0.8), createLowPolyMat(0x5c4033));
  gardenBed.position.set(1.8, 0.45, -1.3);
  g.add(gardenBed);

  g.add(createFlowerPatch([0.4, 0.45, 1.6], [0xffbe0b, 0xfb5607, 0xff006e]));
  g.add(createWoodenFence(2.4, [-1.8, 0.45, 1.6], Math.PI / 4));

  return g;
}

// =============================================================
// 8. MY SCHOOL — Campus Academy Island
// =============================================================
function buildSchoolIsland(variant: IslandVariant): THREE.Group {
  const g = new THREE.Group();

  const brickMat = createLowPolyMat(0xa63a2a, { roughness: 0.8 });
  const stoneMat = createLowPolyMat(0xe8e4dc, { roughness: 0.75 });
  const roofMat = createLowPolyMat(0x2f3e46, { roughness: 0.7 });
  const yellowBusMat = createLowPolyMat(0xf6bd60, { roughness: 0.5 });
  const wheelMat = createLowPolyMat(0x1a1a1a, { roughness: 0.9 });
  const goldMat = createLowPolyMat(0xf4a261, { metalness: 0.4, roughness: 0.35 });

  // Academy Hall
  const academy = new THREE.Group();
  academy.position.set(0, 0.45, -0.6);

  const mainHall = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.9, 1.9), brickMat);
  mainHall.position.y = 0.95;
  mainHall.castShadow = true;

  const roofGeo = new THREE.ConeGeometry(2.3, 1.1, 4);
  roofGeo.rotateY(Math.PI / 4);
  const roof = new THREE.Mesh(roofGeo, roofMat);
  roof.position.set(0, 2.35, 0);
  roof.scale.set(1.2, 1.0, 0.9);
  roof.castShadow = true;

  // Octagonal Cupola Bell Tower
  const cupola = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.5, 0.8, 8), stoneMat);
  cupola.position.y = 3.0;
  const cupolaRoof = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.7, 8), roofMat);
  cupolaRoof.position.y = 3.75;
  const bell = new THREE.Mesh(new THREE.DodecahedronGeometry(0.18, 0), goldMat);
  bell.position.y = 3.0;

  academy.add(mainHall, roof, cupola, cupolaRoof, bell);
  g.add(academy);

  // Iconic Yellow School Bus
  const bus = new THREE.Group();
  bus.position.set(1.4, 0.45, 1.4);
  bus.rotation.y = -0.3;

  const busBody = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.65, 0.7), yellowBusMat);
  busBody.position.y = 0.45;
  busBody.castShadow = true;

  // Wheels
  for (let x = -0.5; x <= 0.5; x += 1.0) {
    for (let z = -0.35; z <= 0.35; z += 0.7) {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.1, 6), wheelMat);
      wheel.rotation.x = Math.PI / 2;
      wheel.position.set(x, 0.15, z);
      bus.add(wheel);
    }
  }

  bus.add(busBody);
  g.add(bus);

  // Sports Field with Soccer Goalpost
  const goal = new THREE.Group();
  goal.position.set(-1.8, 0.45, 0.8);
  const postMat = createLowPolyMat(0xffffff, { roughness: 0.6 });
  const p1 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.8, 5), postMat);
  p1.position.set(-0.4, 0.4, 0);
  const p2 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.8, 5), postMat);
  p2.position.set(0.4, 0.4, 0);
  const bar = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.05, 0.05), postMat);
  bar.position.set(0, 0.8, 0);
  goal.add(p1, p2, bar);
  g.add(goal);

  g.add(createTree('oak', [-2.2, 0.45, -1.6], 1.15));
  g.add(createTree('oak', [2.2, 0.45, -1.6], 1.05));
  g.add(createLanternPost([0, 0.45, 1.2]));

  return g;
}

// =============================================================
// 9. MY FOOD — Kitchen Farm & Windmill Island
// =============================================================
function buildFoodIsland(variant: IslandVariant): THREE.Group {
  const g = new THREE.Group();

  const millWood = createLowPolyMat(0x6b4c3b, { roughness: 0.85 });
  const sailCloth = createLowPolyMat(0xf6f0e2, { roughness: 0.8 });
  const farmRoof = createLowPolyMat(0x9a3412, { roughness: 0.7 });
  const stoneMat = createLowPolyMat(0x78716c, { roughness: 0.9 });
  const wheatMat = createLowPolyMat(0xe9c46a, { roughness: 0.85 });
  const carrotMat = createLowPolyMat(0xf4a261, { roughness: 0.8 });

  // Hexagonal Windmill
  const mill = new THREE.Group();
  mill.position.set(-0.9, 0.9, -0.9);

  const millTower = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 1.25, 2.6, 6), millWood);
  millTower.position.y = 1.3;
  millTower.castShadow = true;

  const millCap = new THREE.Mesh(new THREE.ConeGeometry(1.0, 0.9, 6), farmRoof);
  millCap.position.y = 2.95;
  millCap.castShadow = true;

  // 4 Turning Lattice Sails
  const sailsGroup = new THREE.Group();
  sailsGroup.position.set(0, 2.7, 0.95);

  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2;
    const sail = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.3, 0.04), sailCloth);
    sail.position.set(Math.cos(angle) * 0.75, Math.sin(angle) * 0.75, 0);
    sail.rotation.z = angle;
    sailsGroup.add(sail);
  }

  mill.add(millTower, millCap, sailsGroup);
  g.add(mill);

  // Bakery Farm Cottage
  const bakery = new THREE.Group();
  bakery.position.set(1.2, 0.45, -0.6);

  const bWall = new THREE.Mesh(new THREE.BoxGeometry(1.9, 1.3, 1.6), createLowPolyMat(0xfaf3dd));
  bWall.position.y = 0.65;
  bWall.castShadow = true;

  const bRoofGeo = new THREE.ConeGeometry(1.5, 0.9, 4);
  bRoofGeo.rotateY(Math.PI / 4);
  const bRoof = new THREE.Mesh(bRoofGeo, farmRoof);
  bRoof.position.set(0, 1.65, 0);
  bRoof.scale.set(1.1, 1.0, 0.9);

  // Stone bread oven chimney with smoke
  const ovenChimney = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.9, 0.5), stoneMat);
  ovenChimney.position.set(0.7, 1.0, -0.5);
  const bSmoke = createChimneySmoke([0.7, 2.05, -0.5]);

  bakery.add(bWall, bRoof, ovenChimney, bSmoke);
  g.add(bakery);

  // Stepped Farmland Terraces with Wheat & Carrots
  const cropsGroup = new THREE.Group();
  cropsGroup.position.set(-0.2, 0.45, 1.1);

  // Wheat furrows
  for (let i = -2; i <= 2; i++) {
    const furrow = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.25, 0.18), wheatMat);
    furrow.position.set(0, 0.12, i * 0.25);
    cropsGroup.add(furrow);
  }

  // Carrot patch
  const carrotPatch = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.18, 0.8), carrotMat);
  carrotPatch.position.set(1.4, 0.1, 0.2);
  cropsGroup.add(carrotPatch);

  g.add(cropsGroup);

  // Wooden produce cart with barrels
  const cart = new THREE.Group();
  cart.position.set(1.8, 0.45, 1.2);
  const cartBody = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.35, 0.5), millWood);
  cartBody.position.y = 0.25;
  cart.add(cartBody);
  g.add(cart);

  g.add(createTree('oak', [-2.4, 0.45, 1.4], 1.1));
  g.add(createWoodenFence(2.4, [-1.2, 0.45, 2.1], 0));

  return g;
}

// =============================================================
// 10. MY WORK — Creative Studio Island
// =============================================================
function buildWorkIsland(variant: IslandVariant): THREE.Group {
  const g = new THREE.Group();

  const concreteMat = createLowPolyMat(0xe5e7eb, { roughness: 0.75 });
  const woodDeckMat = createLowPolyMat(0xa16207, { roughness: 0.8 });
  const darkFrame = createLowPolyMat(0x1f2937, { roughness: 0.6 });
  const glassMat = createGlassMat(0x93c5fd, 0.65);

  // Modern Bauhaus Cantilever Studio
  const studio = new THREE.Group();
  studio.position.set(0, 0.45, -0.4);

  // Ground floor concrete gallery
  const groundFloor = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.2, 2.2), concreteMat);
  groundFloor.position.y = 0.6;
  groundFloor.castShadow = true;

  // Cantilevered upper glass pavilion
  const upperFloor = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.1, 2.4), concreteMat);
  upperFloor.position.set(0.4, 1.65, 0.2);
  upperFloor.castShadow = true;

  // Wrap-around glass curtain walls
  const glassWall = new THREE.Mesh(new THREE.BoxGeometry(2.45, 0.8, 1.2), glassMat);
  glassWall.position.set(0.4, 1.65, 0.8);

  // Cantilevered timber sun deck
  const deck = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.12, 1.4), woodDeckMat);
  deck.position.set(-1.0, 1.15, 0.8);

  studio.add(groundFloor, upperFloor, glassWall, deck);
  g.add(studio);

  // Geometric Shallow Reflection Pool
  const pool = new THREE.Group();
  pool.position.set(-1.2, 0.45, 1.2);

  const border = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.15, 1.6), darkFrame);
  border.position.y = 0.08;
  const water = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.14, 1.4), createWaterMat(0x38bdf8));
  water.position.y = 0.09;
  pool.add(border, water);
  g.add(pool);

  // Modern Anglepoise Desk Lamp Sculpture Monument
  const lampMonument = new THREE.Group();
  lampMonument.position.set(1.6, 0.45, 1.3);
  const lampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.35, 0.15, 8), darkFrame);
  const lampArm = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.4, 5), darkFrame);
  lampArm.rotation.z = -0.4;
  lampArm.position.set(0.2, 0.7, 0);
  const lampHead = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.35, 6), createLowPolyMat(0xf59e0b));
  lampHead.rotation.z = -1.2;
  lampHead.position.set(0.5, 1.3, 0);
  lampMonument.add(lampBase, lampArm, lampHead);
  g.add(lampMonument);

  g.add(createTree('birch', [2.2, 0.45, -1.6], 1.1));
  g.add(createTree('birch', [-2.2, 0.45, -1.6], 0.95));
  g.add(createBush([0.8, 0.45, 1.6], 0.5));

  return g;
}

// =============================================================
// 11. MY NATURE — Forest & Mountain Island
// =============================================================
function buildNatureIsland(variant: IslandVariant): THREE.Group {
  const g = new THREE.Group();

  const woodMat = createLowPolyMat(0x5c4033, { roughness: 0.85 });
  const tentMat = createLowPolyMat(0xe76f51, { roughness: 0.8 });
  const waterColor = variant === 'fantasy' ? 0x70c1b3 : 0x2a9d8f;

  // Mountain Tarn Lake on high terrace
  const tarn = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 0.15, 8), createWaterMat(waterColor));
  tarn.position.set(0.2, 0.35, -0.6);
  g.add(tarn);

  // Twin Waterfall cascading down from tarn over rock ledge
  const fall1 = createWaterfallMesh(0.7, 2.4, [1.1, 0.35, -1.8], waterColor);
  const fall2 = createWaterfallMesh(0.5, 1.8, [-0.6, 0.35, 1.8], waterColor);
  g.add(fall1, fall2);

  // Wilderness Campsite
  const camp = new THREE.Group();
  camp.position.set(-1.2, 0.45, 0.8);

  // A-Frame Canvas Tent
  const tentGeo = new THREE.ConeGeometry(0.9, 1.1, 4);
  tentGeo.rotateY(Math.PI / 4);
  const tent = new THREE.Mesh(tentGeo, tentMat);
  tent.position.y = 0.55;
  tent.scale.set(1.2, 1.0, 0.8);
  tent.castShadow = true;

  // Campfire ring with glowing embers
  const fireRing = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.4, 0.15, 6), createLowPolyMat(0x6b705c));
  fireRing.position.set(1.1, 0.08, 0.2);
  const embers = new THREE.Mesh(new THREE.DodecahedronGeometry(0.18, 0), createLowPolyMat(0xf77f00, { emissive: 0xf77f00 }));
  embers.position.set(1.1, 0.18, 0.2);

  // Log seating bench
  const log = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.9, 5), woodMat);
  log.rotation.z = Math.PI / 2;
  log.position.set(1.1, 0.12, -0.5);

  camp.add(tent, fireRing, embers, log);
  g.add(camp);

  // Stepped Log Footbridge across river channel
  const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.1, 1.5), woodMat);
  bridge.position.set(0.8, 0.45, 0.8);
  bridge.rotation.y = -0.4;
  g.add(bridge);

  // Dense Pine and Oak Forest
  g.add(createTree('pine', [-2.4, 0.45, -1.4], 1.3));
  g.add(createTree('pine', [-1.8, 1.4, -2.1], 1.1));
  g.add(createTree('pine', [2.3, 0.45, 1.2], 1.2));
  g.add(createTree('pine', [1.8, 0.45, -1.8], 1.0));
  g.add(createTree('oak', [-2.2, 0.45, 1.8], 0.95));

  g.add(createBush([0.2, 0.45, 1.6], 0.6));
  g.add(createBush([-0.6, 0.45, -1.8], 0.5));

  return g;
}

// =============================================================
// 12. MY ANIMALS — Wildlife Sanctuary Island
// =============================================================
function buildAnimalsIsland(variant: IslandVariant): THREE.Group {
  const g = new THREE.Group();

  const logMat = createLowPolyMat(0x5c4033, { roughness: 0.9 });
  const thatchMat = createLowPolyMat(0xa68a56, { roughness: 0.85 });
  const waterColor = 0x588157;

  // Wildlife Ranger Station Lodge
  const lodge = new THREE.Group();
  lodge.position.set(-0.8, 0.45, -0.6);

  const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.1, 1.3, 1.7), logMat);
  cabin.position.y = 0.65;
  cabin.castShadow = true;

  const roofGeo = new THREE.ConeGeometry(1.6, 0.9, 4);
  roofGeo.rotateY(Math.PI / 4);
  const roof = new THREE.Mesh(roofGeo, thatchMat);
  roof.position.set(0, 1.65, 0);
  roof.scale.set(1.1, 1.0, 0.9);
  roof.castShadow = true;

  // Observation Watchtower
  const tower = new THREE.Group();
  tower.position.set(1.5, 0, 0);
  for (let i = 0; i < 4; i++) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.4, 5), logMat);
    post.position.set((i % 2) * 0.7 - 0.35, 1.2, Math.floor(i / 2) * 0.7 - 0.35);
    tower.add(post);
  }
  const platform = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.1, 0.9), logMat);
  platform.position.y = 2.4;
  const towerRoof = new THREE.Mesh(new THREE.ConeGeometry(0.7, 0.6, 4), thatchMat);
  towerRoof.rotateY(Math.PI / 4);
  towerRoof.position.y = 3.0;
  tower.add(platform, towerRoof);

  lodge.add(cabin, roof, tower);
  g.add(lodge);

  // Organic Watering Hole with Reeds
  const waterHole = new THREE.Group();
  waterHole.position.set(0.8, 0.45, 1.0);

  const pond = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.4, 0.12, 8), createWaterMat(waterColor));
  pond.position.y = 0.06;
  waterHole.add(pond);

  // Stepping stones and reeds
  for (let i = 0; i < 4; i++) {
    const stone = new THREE.Mesh(new THREE.DodecahedronGeometry(0.18, 0), createLowPolyMat(0x6b705c));
    const a = (i / 4) * Math.PI * 2;
    stone.position.set(Math.cos(a) * 1.3, 0.1, Math.sin(a) * 1.3);
    waterHole.add(stone);
  }

  g.add(waterHole);

  // Animal shelter feeding trough
  const shelter = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.7, 0.6), logMat);
  shelter.position.set(-1.4, 0.8, 1.4);
  g.add(shelter);

  g.add(createTree('oak', [2.2, 0.45, -1.4], 1.2));
  g.add(createTree('willow', [-2.2, 0.45, 0.6], 1.05));
  g.add(createWoodenFence(2.0, [0.8, 0.45, -1.8], 0));

  return g;
}

// =============================================================
// 13. MY OCEAN — Coastal & Lighthouse Island
// =============================================================
function buildOceanIsland(variant: IslandVariant): THREE.Group {
  const g = new THREE.Group();

  const whiteMat = createLowPolyMat(0xf8fafc, { roughness: 0.7 });
  const redMat = createLowPolyMat(0xd90429, { roughness: 0.7 });
  const woodMat = createLowPolyMat(0x5c4033, { roughness: 0.85 });
  const ironMat = createLowPolyMat(0x1f2937, { roughness: 0.6 });
  const beaconGlass = createGlassMat(0xffea00, 0.85);

  // Classic Red-and-White Banded Lighthouse (On high cliff)
  const lighthouse = new THREE.Group();
  lighthouse.position.set(-1.2, 1.25, -1.2);

  // 4 Alternating Color Rings
  const bands = [whiteMat, redMat, whiteMat, redMat];
  bands.forEach((mat, i) => {
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.55 - i * 0.05, 0.65 - i * 0.05, 0.7, 8), mat);
    ring.position.y = 0.35 + i * 0.7;
    ring.castShadow = true;
    lighthouse.add(ring);
  });

  // Lantern Gallery Walkway
  const gallery = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 0.12, 8), ironMat);
  gallery.position.y = 3.18;

  // Glass Lantern Room
  const lantern = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.55, 8), beaconGlass);
  lantern.position.y = 3.5;

  // Copper Dome Cap
  const dome = new THREE.Mesh(new THREE.ConeGeometry(0.52, 0.4, 8), redMat);
  dome.position.y = 3.95;

  lighthouse.add(gallery, lantern, dome);
  g.add(lighthouse);

  // Harbor Wooden Jetty / Pier
  const pier = new THREE.Group();
  pier.position.set(1.4, 0.05, 1.2);

  const pierDeck = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.1, 2.2), woodMat);
  pierDeck.position.set(0, 0.25, 0);

  // Mooring Pilings
  for (let z = -0.9; z <= 0.9; z += 0.9) {
    const pL = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.7, 5), woodMat);
    pL.position.set(-0.35, 0.15, z);
    const pR = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.7, 5), woodMat);
    pR.position.set(0.35, 0.15, z);
    pier.add(pL, pR);
  }

  // Small Fishing Boat (Dory) moored beside pier
  const boat = new THREE.Group();
  boat.position.set(0.7, 0.1, 0.4);
  boat.rotation.y = 0.3;

  const hull = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.25, 1.3), redMat);
  boat.add(hull);
  pier.add(boat);

  pier.add(pierDeck);
  g.add(pier);

  // Weathered Fisherman's Cedar Shack
  const shack = new THREE.Group();
  shack.position.set(0.4, 0.45, -0.6);

  const sBody = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.1, 1.2), woodMat);
  sBody.position.y = 0.55;
  sBody.castShadow = true;

  const sRoof = new THREE.Mesh(new THREE.ConeGeometry(1.2, 0.7, 4), createLowPolyMat(0x4a5568));
  sRoof.rotateY(Math.PI / 4);
  sRoof.position.y = 1.35;
  sRoof.scale.set(1.1, 1.0, 0.9);

  shack.add(sBody, sRoof);
  g.add(shack);

  g.add(createTree('pine', [-2.4, 1.25, -0.4], 0.9));
  g.add(createBush([0.8, 0.45, -1.8], 0.5, 0x4a7c59));

  return g;
}

// =============================================================
// 14. MY TRAVEL — Adventure & Pyramid Island
// =============================================================
function buildTravelIsland(variant: IslandVariant): THREE.Group {
  const g = new THREE.Group();

  const stoneMat = createLowPolyMat(0xa89984, { roughness: 0.9 });
  const woodMat = createLowPolyMat(0x654321, { roughness: 0.85 });
  const tentMat = createLowPolyMat(0xd4a373, { roughness: 0.8 });

  // Ancient Incan/Mayan Stepped Pyramid Shrine
  const pyramid = new THREE.Group();
  pyramid.position.set(-0.9, 0.45, -0.8);

  const t1 = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.4, 2.6), stoneMat);
  t1.position.y = 0.2;
  const t2 = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.4, 2.0), stoneMat);
  t2.position.y = 0.6;
  const t3 = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.4, 1.4), stoneMat);
  t3.position.y = 1.0;

  // Altar pavilion on top
  const altar = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.8), stoneMat);
  altar.position.y = 1.45;
  altar.castShadow = true;

  // Monumental Center Staircase
  const stairs = createStoneSteps(6, 0.7, 0.2, 0.2, [0, 0, 1.2], 0, 0x928374);

  pyramid.add(t1, t2, t3, altar, stairs);
  g.add(pyramid);

  // Rope Suspension Bridge across Ravine
  const bridge = new THREE.Group();
  bridge.position.set(0.8, 0.45, 0.2);
  bridge.rotation.y = -0.6;

  const planks = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 1.8), woodMat);
  planks.position.y = 0.35;
  bridge.add(planks);
  g.add(bridge);

  // Safari Expedition Camp with Direction Signpost
  const camp = new THREE.Group();
  camp.position.set(1.2, 0.45, 1.4);

  const tent = new THREE.Mesh(new THREE.ConeGeometry(0.8, 1.0, 4), tentMat);
  tent.rotateY(Math.PI / 4);
  tent.position.y = 0.5;
  tent.castShadow = true;

  // World Direction Signpost (PARIS, TOKYO, CAIRO)
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.5, 5), woodMat);
  pole.position.set(-0.8, 0.75, 0);

  const sign1 = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.12, 0.04), createLowPolyMat(0xf4f1de));
  sign1.position.set(-0.8, 1.25, 0);
  sign1.rotation.y = 0.4;
  const sign2 = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.12, 0.04), createLowPolyMat(0xf4f1de));
  sign2.position.set(-0.8, 1.05, 0);
  sign2.rotation.y = -0.7;

  camp.add(tent, pole, sign1, sign2);
  g.add(camp);

  g.add(createTree('cypress', [-2.4, 0.45, 1.4], 1.2));
  g.add(createTree('oak', [2.2, 0.45, -1.6], 1.0));

  return g;
}

// =============================================================
// 15. MY MUSIC — Sound Garden & Amphitheater Island
// =============================================================
function buildMusicIsland(variant: IslandVariant): THREE.Group {
  const g = new THREE.Group();

  const whiteShell = createLowPolyMat(0xf8fafc, { roughness: 0.65 });
  const stageWood = createLowPolyMat(0xa16207, { roughness: 0.7 });
  const pianoBlack = createLowPolyMat(0x111827, { roughness: 0.2, metalness: 0.1 });
  const keysWhite = createLowPolyMat(0xffffff, { roughness: 0.3 });
  const goldBrass = createLowPolyMat(0xf59e0b, { metalness: 0.5, roughness: 0.3 });

  // Curved Acoustic Sound Shell
  const shell = new THREE.Group();
  shell.position.set(0, 0.45, -0.8);

  const stage = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 0.3, 10, 1, false, 0, Math.PI), stageWood);
  stage.position.y = 0.15;
  stage.rotation.y = Math.PI;

  const arch1 = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, 1.2, 10, 1, true, 0, Math.PI), whiteShell);
  arch1.position.set(0, 1.1, -0.4);
  arch1.rotation.set(0.3, Math.PI, 0);

  shell.add(stage, arch1);
  g.add(shell);

  // Glossy Grand Piano Landmark on Stage
  const piano = new THREE.Group();
  piano.position.set(0, 0.75, -0.6);

  const pianoBody = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.35, 1.2), pianoBlack);
  pianoBody.position.y = 0.5;
  pianoBody.castShadow = true;

  // Open Propped Lid
  const lid = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.04, 1.15), pianoBlack);
  lid.rotation.x = -0.35;
  lid.position.set(0, 0.85, 0.1);

  // Keyboard
  const keys = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.08, 0.25), keysWhite);
  keys.position.set(0, 0.52, 0.6);

  // Piano Legs
  for (let i = 0; i < 3; i++) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.5, 5), pianoBlack);
    const lx = i === 0 ? -0.4 : i === 1 ? 0.4 : 0;
    const lz = i === 2 ? -0.4 : 0.4;
    leg.position.set(lx, 0.25, lz);
    piano.add(leg);
  }

  piano.add(pianoBody, lid, keys);
  g.add(piano);

  // Circular Fountain & Musical Topiary
  const fountain = new THREE.Group();
  fountain.position.set(0, 0.45, 1.4);

  const pool = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.2, 0.3, 8), whiteShell);
  pool.position.y = 0.15;
  const fWater = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 0.25, 8), createWaterMat(0x60a5fa));
  fWater.position.y = 0.2;
  const spout = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.7, 6), goldBrass);
  spout.position.y = 0.5;

  fountain.add(pool, fWater, spout);
  g.add(fountain);

  g.add(createTree('cypress', [-2.4, 0.45, -0.6], 1.2));
  g.add(createTree('cypress', [2.4, 0.45, -0.6], 1.2));
  g.add(createFlowerPatch([1.6, 0.45, 1.2], [0xf43f5e, 0x8b5cf6, 0xffffff]));

  return g;
}

// =============================================================
// 16. MY COLLECTIONS — Museum of Curiosities Island
// =============================================================
function buildCollectionsIsland(variant: IslandVariant): THREE.Group {
  const g = new THREE.Group();

  const marbleMat = createLowPolyMat(0xf5f3ef, { roughness: 0.75 });
  const domeMat = createLowPolyMat(0x475569, { roughness: 0.65 });
  const goldMat = createLowPolyMat(0xf59e0b, { metalness: 0.5, roughness: 0.3 });
  const crystalMat = createLowPolyMat(0x8b5cf6, { roughness: 0.2, metalness: 0.3, emissive: 0x4c1d95 });

  // Neoclassical Domed Museum Rotunda
  const museum = new THREE.Group();
  museum.position.set(0, 0.45, -0.6);

  // Monumental Portico & Columns
  const hall = new THREE.Mesh(new THREE.BoxGeometry(3.0, 1.8, 2.2), marbleMat);
  hall.position.y = 0.9;
  hall.castShadow = true;

  // Columns in front
  for (let x = -1.1; x <= 1.1; x += 0.73) {
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 1.5, 6), marbleMat);
    col.position.set(x, 0.75, 1.25);
    museum.add(col);
  }

  // Triangular Pediment over Portico
  const pedimentGeo = new THREE.ConeGeometry(1.6, 0.7, 4);
  pedimentGeo.rotateY(Math.PI / 4);
  const pediment = new THREE.Mesh(pedimentGeo, marbleMat);
  pediment.position.set(0, 1.85, 1.25);
  pediment.scale.set(1.2, 1.0, 0.3);

  // Central Grand Dome
  const dome = new THREE.Mesh(new THREE.SphereGeometry(1.1, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2), domeMat);
  dome.position.y = 1.8;
  dome.castShadow = true;

  // Grand Entrance Steps
  const stairs = createStoneSteps(4, 1.6, 0.22, 0.12, [0, 0, 1.5], 0, 0xe5e5e5);

  museum.add(hall, pediment, dome, stairs);
  g.add(museum);

  // Outdoor Curiosity Display: Giant Crystal Geode & Ammonite
  const curiosity1 = new THREE.Group();
  curiosity1.position.set(-1.6, 0.45, 1.3);

  const plinth1 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.4, 0.8), marbleMat);
  plinth1.position.y = 0.2;
  const geode = new THREE.Mesh(new THREE.OctahedronGeometry(0.35, 0), crystalMat);
  geode.position.y = 0.65;
  curiosity1.add(plinth1, geode);
  g.add(curiosity1);

  // Ammonite Fossil Monument
  const curiosity2 = new THREE.Group();
  curiosity2.position.set(1.6, 0.45, 1.3);
  const plinth2 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.4, 0.8), marbleMat);
  plinth2.position.y = 0.2;
  const fossil = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.1, 6, 8), goldMat);
  fossil.position.y = 0.65;
  curiosity2.add(plinth2, fossil);
  g.add(curiosity2);

  g.add(createTree('cypress', [-2.4, 0.45, -1.2], 1.2));
  g.add(createTree('cypress', [2.4, 0.45, -1.2], 1.2));

  return g;
}

// =============================================================
// 17. MY DREAMS — Celestial Castle Island
// =============================================================
function buildDreamsIsland(variant: IslandVariant): THREE.Group {
  const g = new THREE.Group();

  const wallMat = createLowPolyMat(0xf1e3f8, { roughness: 0.75 });
  const lavenderSpire = createLowPolyMat(0x9d4edd, { roughness: 0.6 });
  const roseSpire = createLowPolyMat(0xf72585, { roughness: 0.6 });
  const goldFinial = createLowPolyMat(0xffd166, { metalness: 0.5, roughness: 0.3 });
  const crystalMat = createLowPolyMat(0x4cc9f0, { roughness: 0.2, metalness: 0.4, emissive: 0x4361ee });

  // Soaring Fairytale Castle
  const castle = new THREE.Group();
  castle.position.set(0, 0.45, -0.4);

  // Central Keep
  const keep = new THREE.Mesh(new THREE.BoxGeometry(1.8, 2.4, 1.8), wallMat);
  keep.position.y = 1.2;
  keep.castShadow = true;

  // Tallest Central Spire
  const mainSpire = new THREE.Mesh(new THREE.ConeGeometry(0.8, 2.2, 6), lavenderSpire);
  mainSpire.position.y = 3.5;
  mainSpire.castShadow = true;
  const finial1 = new THREE.Mesh(new THREE.OctahedronGeometry(0.18, 0), goldFinial);
  finial1.position.y = 4.7;

  castle.add(keep, mainSpire, finial1);

  // 4 Corner Turrets
  const turretPositions: [number, number, typeof roseSpire][] = [
    [-1.1, -1.1, roseSpire],
    [1.1, -1.1, lavenderSpire],
    [-1.1, 1.1, lavenderSpire],
    [1.1, 1.1, roseSpire],
  ];

  turretPositions.forEach(([tx, tz, sMat]) => {
    const turret = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.45, 2.8, 6), wallMat);
    turret.position.set(tx, 1.4, tz);
    turret.castShadow = true;

    const spire = new THREE.Mesh(new THREE.ConeGeometry(0.48, 1.4, 6), sMat);
    spire.position.set(tx, 3.5, tz);
    spire.castShadow = true;

    const f = new THREE.Mesh(new THREE.OctahedronGeometry(0.1, 0), goldFinial);
    f.position.set(tx, 4.3, tz);

    castle.add(turret, spire, f);
  });

  g.add(castle);

  // Orbiting Luminescent Crystals & Star Orbs
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2;
    const dist = 2.4;
    const shard = new THREE.Mesh(new THREE.OctahedronGeometry(0.28, 0), crystalMat);
    shard.position.set(Math.cos(angle) * dist, 1.8 + (i % 2) * 0.6, Math.sin(angle) * dist);
    g.add(shard);
  }

  // Floating pastel cloud banks around foundation
  g.add(createCloudCluster([1.8, 0.6, 1.4], 1.0));
  g.add(createCloudCluster([-1.8, 0.7, 1.2], 0.9));

  return g;
}

// =============================================================
// 18. MY MEMORIES — Memory Garden & Archive Island
// =============================================================
function buildMemoriesIsland(variant: IslandVariant): THREE.Group {
  const g = new THREE.Group();

  const whiteIron = createLowPolyMat(0xf8fafc, { roughness: 0.6 });
  const glassMat = createGlassMat(0xbae6fd, 0.7);
  const stoneMat = createLowPolyMat(0x78716c, { roughness: 0.9 });
  const goldMat = createLowPolyMat(0xf59e0b, { metalness: 0.5, roughness: 0.35 });

  // Victorian Botanical Glass Conservatory
  const conservatory = new THREE.Group();
  conservatory.position.set(-0.6, 0.45, -0.6);

  const baseWall = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.4, 2.0), whiteIron);
  baseWall.position.y = 0.2;

  const glassBody = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.2, 1.8), glassMat);
  glassBody.position.y = 1.0;

  // Vaulted Glass Dome Roof
  const dome = new THREE.Mesh(new THREE.SphereGeometry(1.0, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2), glassMat);
  dome.position.y = 1.6;
  dome.scale.set(1.1, 0.8, 0.9);

  conservatory.add(baseWall, glassBody, dome);
  g.add(conservatory);

  // Memory Sundial / Grandfather Clock Tower
  const clockTower = new THREE.Group();
  clockTower.position.set(1.6, 0.45, -0.8);

  const cBody = new THREE.Mesh(new THREE.BoxGeometry(0.7, 2.6, 0.7), stoneMat);
  cBody.position.y = 1.3;
  cBody.castShadow = true;

  const cFace = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.08, 8), goldMat);
  cFace.rotateX(Math.PI / 2);
  cFace.position.set(0, 2.0, 0.38);

  const cRoof = new THREE.Mesh(new THREE.ConeGeometry(0.6, 0.8, 4), whiteIron);
  cRoof.rotateY(Math.PI / 4);
  cRoof.position.y = 3.0;

  clockTower.add(cBody, cFace, cRoof);
  g.add(clockTower);

  // Romantic Rose Pergola Archway
  const pergola = new THREE.Group();
  pergola.position.set(0.6, 0.45, 1.2);

  const arch1 = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.06, 6, 8, Math.PI), whiteIron);
  arch1.position.set(0, 0.7, 0);
  arch1.rotation.y = Math.PI / 2;

  const arch2 = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.06, 6, 8, Math.PI), whiteIron);
  arch2.position.set(0, 0.7, 0.8);
  arch2.rotation.y = Math.PI / 2;

  pergola.add(arch1, arch2);
  g.add(pergola);

  // Wishing Well & Stone Bench
  const well = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.45, 0.4, 7), stoneMat);
  well.position.set(-1.4, 0.65, 1.2);
  g.add(well);

  g.add(createTree('willow', [2.2, 0.45, 1.2], 1.1));
  g.add(createTree('blossom', [-2.2, 0.45, -1.4], 1.0));
  g.add(createFlowerPatch([0.6, 0.45, 1.2], [0xf43f5e, 0xfb7185, 0xffffff]));

  return g;
}

// =============================================================
// MASTER ISLAND SCENE DISPATCHER
// =============================================================
export function buildIslandScene(island: IslandMetadata, variant: IslandVariant = 'classic'): THREE.Group {
  // Level 2: Modular Buildings (Reusable 3D architecture, no attached island terrain!)
  if (island.worldLevel === 'level2_building' || island.slug.startsWith('building-')) {
    return buildExpansionBuilding(island, variant);
  }

  // Level 2: Thematic Sub-Islands (Floating islands with geological rock underbelly)
  if (island.worldLevel === 'level2_subisland' || island.slug.startsWith('subisland-')) {
    return buildExpansionSubIsland(island, variant);
  }

  // Level 2: Miniature Dioramas (No floating islands! Natural ground patches/bases)
  if (island.worldLevel === 'level2_diorama' || island.slug.startsWith('diorama-')) {
    if (
      island.slug.startsWith('diorama-expo-') ||
      island.id.startsWith('diorama_expo_') ||
      island.collection === 'category_outdoor_expo_sets'
    ) {
      return buildOutdoorExpoSetScene(island, variant);
    }
    if (island.slug.startsWith('diorama-museum-') || island.id.startsWith('diorama_museum_')) {
      return buildMuseumDioramaScene(island, variant);
    }
    return buildDioramaScene(island, variant);
  }

  // Level 3: Standalone Low-Poly Objects (Pure standalone, zero pedestals or platforms)
  if (island.worldLevel === 'level3_object' || island.slug.startsWith('object-')) {
    const obNum = island.id.startsWith('OB-') ? parseInt(island.id.replace('OB-', ''), 10) : 0;
    if (island.slug.startsWith('object-outdoor-') || (obNum >= 301 && obNum <= 350)) {
      return buildOutdoorDecorScene(island, variant);
    }
    if (island.slug.startsWith('object-indoor-') || (obNum >= 251 && obNum <= 300)) {
      return buildIndoorDecorScene(island, variant);
    }
    if (island.slug.startsWith('object-decor-') || (obNum >= 201 && obNum <= 250)) {
      return buildMuseumDecorScene(island, variant);
    }
    if (island.slug.startsWith('object-expo-') || (obNum >= 151 && obNum <= 200)) {
      return buildExpoFacilityScene(island, variant);
    }
    if (island.slug.startsWith('object-museum-') || (obNum >= 101 && obNum <= 150)) {
      return buildMuseumObjectScene(island, variant);
    }
    if (island.id.startsWith('OB-')) {
      return buildExpansionObject(island, variant);
    }
    return buildObjectScene(island, variant);
  }

  // Major World Islands: Expansion Worlds (MW-01 to MW-90, including Avatar Worlds)
  if (island.id.startsWith('MW-') || island.slug.startsWith('avatar-') || island.slug.includes('-universe')) {
    return buildExpansionMajorWorld(island, variant);
  }

  // Level 1: 24 Core Major Macro Worlds (Floating Islands)
  const masterGroup = new THREE.Group();

  // 1. Procedural Rich Floating Base (Terrain + Underbelly + Islets)
  const base = createFloatingBase(island, variant);
  masterGroup.add(base);

  // 2. Specific Handcrafted Architecture and Landmarks
  let content: THREE.Group;
  switch (island.slug) {
    // === Collection A: 12 Life Domain Worlds ===
    case 'world-natural':
    case 'nature-forest':
      content = buildNatureIsland(variant);
      break;

    case 'world-knowledge':
    case 'knowledge-library':
      content = buildKnowledgeIsland(variant);
      break;

    case 'world-everyday':
    case 'home-village':
      content = buildHomeIsland(variant);
      break;

    case 'world-social':
    case 'family-garden':
      content = buildFamilyIsland(variant);
      break;

    case 'world-cultural':
    case 'collections-museum':
      content = buildCollectionsIsland(variant);
      break;

    case 'world-learning-skills':
    case 'skills-workshop':
      content = buildSkillsIsland(variant);
      break;

    case 'world-work-creation':
    case 'work-office':
      content = buildWorkIsland(variant);
      break;

    case 'world-inner':
    case 'memories-garden':
      content = buildMemoriesIsland(variant);
      break;

    case 'world-life-story':
    case 'school-campus':
      content = buildSchoolIsland(variant);
      break;

    case 'world-health-vitality':
    case 'animals-sanctuary':
      content = buildAnimalsIsland(variant);
      break;

    case 'world-leisure-play':
    case 'travel-adventure':
      content = buildTravelIsland(variant);
      break;

    case 'world-future-dreams':
    case 'dreams-castle':
      content = buildDreamsIsland(variant);
      break;

    // === Collection B: 12 Civilization & System Worlds ===
    case 'world-science-exploration':
    case 'science-observatory':
      content = buildScienceIsland(variant);
      break;

    case 'world-history-civilizations':
    case 'history-ancient':
      content = buildHistoryIsland(variant);
      break;

    case 'world-philosophy-wisdom':
      content = buildHistoryIsland(variant);
      break;

    case 'world-mathematics-logic':
      content = buildSkillsIsland(variant);
      break;

    case 'world-technology-digital':
      content = buildWorkIsland(variant);
      break;

    case 'world-arts-aesthetics':
      content = buildCollectionsIsland(variant);
      break;

    case 'world-music-sound':
    case 'music-studio':
      content = buildMusicIsland(variant);
      break;

    case 'world-language-literature':
    case 'books-literary':
      content = buildBooksIsland(variant);
      break;

    case 'world-society-governance':
      content = buildHistoryIsland(variant);
      break;

    case 'world-economy-commerce':
    case 'food-farm':
      content = buildFoodIsland(variant);
      break;

    case 'world-cosmos-space':
      content = buildDreamsIsland(variant);
      break;

    case 'world-ecology-oceans':
    case 'ocean-coastal':
      content = buildOceanIsland(variant);
      break;

    default:
      content = buildKnowledgeIsland(variant);
      break;
  }

  masterGroup.add(content);

  // Minimal variant simplification pass
  if (variant === 'minimal') {
    masterGroup.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (child.material instanceof THREE.MeshStandardMaterial) {
          child.material.roughness = 0.95;
          child.material.metalness = 0.0;
        }
      }
    });
  }

  return masterGroup;
}
