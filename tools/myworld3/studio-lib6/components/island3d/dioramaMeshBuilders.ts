import * as THREE from 'three';
import { IslandMetadata, IslandVariant } from '../../types/island';

// Helper to create basic materials with flat shading for low-poly look
function mat(color: number | string, options: Partial<THREE.MeshStandardMaterialParameters> = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    flatShading: true,
    roughness: 0.65,
    metalness: 0.1,
    ...options,
  });
}

// ---------------------------------------------------------------------------
// Base: Natural Ground Patch or Architectural Foundation (NOT a floating diamond)
// ---------------------------------------------------------------------------
export function createDioramaBase(
  island: IslandMetadata,
  variant: IslandVariant = 'classic'
): THREE.Group {
  const baseGroup = new THREE.Group();
  baseGroup.name = 'diorama_foundation_base';

  const baseType = island.baseType || 'ground_patch';
  const palette = island.palette;
  const baseColor = palette[0]?.hex || '#ECEFF1';
  const rimColor = palette[4]?.hex || '#78909C';

  if (baseType === 'architectural_foundation') {
    // Elegant beveled architectural slab (stepped dual cylinder)
    const lowerSlabGeo = new THREE.CylinderGeometry(5.2, 5.3, 0.35, 32);
    const lowerSlabMat = mat(rimColor, { roughness: 0.75 });
    const lowerSlab = new THREE.Mesh(lowerSlabGeo, lowerSlabMat);
    lowerSlab.position.y = -0.18;
    lowerSlab.receiveShadow = true;
    baseGroup.add(lowerSlab);

    const upperSlabGeo = new THREE.CylinderGeometry(4.9, 5.0, 0.25, 32);
    const upperSlabMat = mat(baseColor, { roughness: 0.5 });
    const upperSlab = new THREE.Mesh(upperSlabGeo, upperSlabMat);
    upperSlab.position.y = 0.12;
    upperSlab.receiveShadow = true;
    baseGroup.add(upperSlab);

    // Inlaid decorative edge ring
    const ringGeo = new THREE.TorusGeometry(4.75, 0.04, 8, 32);
    const ringMat = mat(palette[3]?.hex || '#D4AF37', { metalness: 0.6, roughness: 0.3 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.25;
    baseGroup.add(ring);
  } else {
    // Natural ground patch with beveled grass/soil layer
    const soilGeo = new THREE.CylinderGeometry(5.0, 5.2, 0.45, 24);
    const soilMat = mat('#6D4C41', { roughness: 0.9 });
    const soilMesh = new THREE.Mesh(soilGeo, soilMat);
    soilMesh.position.y = -0.22;
    soilMesh.receiveShadow = true;
    baseGroup.add(soilMesh);

    const turfGeo = new THREE.CylinderGeometry(4.8, 5.0, 0.25, 24);
    const turfColor =
      palette.find((c) => c.role.includes('Lawn') || c.role.includes('Turf') || c.role.includes('Green'))?.hex ||
      '#43A047';
    const turfMat = mat(turfColor, { roughness: 0.85 });
    const turfMesh = new THREE.Mesh(turfGeo, turfMat);
    turfMesh.position.y = 0.12;
    turfMesh.receiveShadow = true;
    baseGroup.add(turfMesh);

    // Subtle edge stones
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const rockGeo = new THREE.DodecahedronGeometry(0.25 + (i % 3) * 0.1, 0);
      const rockMesh = new THREE.Mesh(rockGeo, mat('#90A4AE'));
      rockMesh.position.set(Math.cos(angle) * 4.6, 0.18, Math.sin(angle) * 4.6);
      rockMesh.rotation.set(angle, angle * 0.5, 0);
      rockMesh.castShadow = true;
      baseGroup.add(rockMesh);
    }
  }

  return baseGroup;
}

// ---------------------------------------------------------------------------
// 20 Miniature Diorama Builders
// ---------------------------------------------------------------------------

// 01. Library
export function buildLibraryDiorama(variant: IslandVariant): THREE.Group {
  const g = new THREE.Group();

  // Library Main Hall
  const hallGeo = new THREE.BoxGeometry(4.2, 2.6, 2.8);
  const hallMat = mat(variant === 'fantasy' ? '#4A148C' : '#8D6E63');
  const hall = new THREE.Mesh(hallGeo, hallMat);
  hall.position.set(0, 1.45, -0.4);
  hall.castShadow = true;
  hall.receiveShadow = true;
  g.add(hall);

  // Mansard Roof
  const roofGeo = new THREE.ConeGeometry(3.3, 1.4, 4);
  const roofMat = mat(variant === 'fantasy' ? '#7E57C2' : '#587B94');
  const roof = new THREE.Mesh(roofGeo, roofMat);
  roof.position.set(0, 3.4, -0.4);
  roof.rotation.y = Math.PI / 4;
  roof.castShadow = true;
  g.add(roof);

  // Portico Columns & Pediment
  for (let i = -1.2; i <= 1.2; i += 0.8) {
    const colGeo = new THREE.CylinderGeometry(0.12, 0.14, 2.2, 8);
    const colMat = mat('#F0E5D8');
    const col = new THREE.Mesh(colGeo, colMat);
    col.position.set(i, 1.25, 1.15);
    col.castShadow = true;
    g.add(col);
  }

  // Stone steps
  for (let s = 0; s < 3; s++) {
    const stepGeo = new THREE.BoxGeometry(3.2 - s * 0.4, 0.12, 0.4);
    const step = new THREE.Mesh(stepGeo, mat('#E0D6C3'));
    step.position.set(0, 0.18 + s * 0.12, 1.35 + (2 - s) * 0.3);
    step.receiveShadow = true;
    g.add(step);
  }

  // Clock on wall
  const clockGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.1, 16);
  const clockMat = mat('#D29B52', { metalness: 0.5 });
  const clock = new THREE.Mesh(clockGeo, clockMat);
  clock.rotation.x = Math.PI / 2;
  clock.position.set(0, 2.3, 1.05);
  g.add(clock);

  // Outdoor Bookshelves
  const shelfGeo = new THREE.BoxGeometry(1.2, 1.6, 0.4);
  const shelf = new THREE.Mesh(shelfGeo, mat('#5D4037'));
  shelf.position.set(-2.5, 0.95, 0.5);
  shelf.rotation.y = Math.PI / 6;
  g.add(shelf);

  // Reading Tree
  const trunkGeo = new THREE.CylinderGeometry(0.15, 0.25, 2.2, 6);
  const trunk = new THREE.Mesh(trunkGeo, mat('#4E342E'));
  trunk.position.set(2.4, 1.25, 1.2);
  g.add(trunk);

  const foliageGeo = new THREE.DodecahedronGeometry(1.1, 1);
  const foliage = new THREE.Mesh(foliageGeo, mat('#345243'));
  foliage.position.set(2.4, 2.5, 1.2);
  foliage.castShadow = true;
  g.add(foliage);

  // Stone Bench
  const benchGeo = new THREE.BoxGeometry(1.0, 0.2, 0.35);
  const bench = new THREE.Mesh(benchGeo, mat('#CFD8DC'));
  bench.position.set(2.2, 0.35, 0.4);
  g.add(bench);

  return g;
}

// 02. Observatory
export function buildObservatoryDiorama(variant: IslandVariant): THREE.Group {
  const g = new THREE.Group();

  // Mountainous rocky base tiers
  const rock1 = new THREE.Mesh(new THREE.DodecahedronGeometry(2.8, 1), mat('#455A64'));
  rock1.scale.set(1.4, 0.7, 1.3);
  rock1.position.set(0, 0.5, 0);
  rock1.receiveShadow = true;
  g.add(rock1);

  // Main Observatory Cylinder Body
  const baseGeo = new THREE.CylinderGeometry(1.8, 2.0, 1.8, 16);
  const baseMat = mat('#ECEFF1');
  const base = new THREE.Mesh(baseGeo, baseMat);
  base.position.set(0, 1.8, 0);
  base.castShadow = true;
  g.add(base);

  // Slotted Rotating Dome
  const domeGeo = new THREE.SphereGeometry(1.85, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2);
  const domeMat = mat(variant === 'fantasy' ? '#AB47BC' : '#90A4AE', { metalness: 0.3 });
  const dome = new THREE.Mesh(domeGeo, domeMat);
  dome.position.set(0, 2.7, 0);
  dome.castShadow = true;
  g.add(dome);

  // Telescope Barrel sticking out
  const teleGeo = new THREE.CylinderGeometry(0.22, 0.35, 2.4, 12);
  const teleMat = mat('#FFB300', { metalness: 0.7, roughness: 0.2 });
  const tele = new THREE.Mesh(teleGeo, teleMat);
  tele.position.set(0.6, 3.4, 0.7);
  tele.rotation.set(-0.6, 0.4, -0.3);
  tele.castShadow = true;
  g.add(tele);

  // Satellite dish on rock
  const dishGeo = new THREE.SphereGeometry(0.8, 12, 8, 0, Math.PI * 2, 0, Math.PI / 3);
  const dish = new THREE.Mesh(dishGeo, mat('#CFD8DC', { metalness: 0.4 }));
  dish.position.set(-2.2, 1.6, 1.2);
  dish.rotation.set(1.2, 0.8, 0);
  g.add(dish);

  // Mini Weather Mast
  const mastGeo = new THREE.CylinderGeometry(0.04, 0.06, 2.0, 6);
  const mast = new THREE.Mesh(mastGeo, mat('#E53935'));
  mast.position.set(2.2, 1.8, -1.0);
  g.add(mast);

  return g;
}

// 03. School Campus
export function buildSchoolCampusDiorama(variant: IslandVariant): THREE.Group {
  const g = new THREE.Group();

  // Brick School Building
  const schoolGeo = new THREE.BoxGeometry(4.0, 2.2, 2.2);
  const schoolMat = mat('#B71C1C');
  const school = new THREE.Mesh(schoolGeo, schoolMat);
  school.position.set(-0.3, 1.25, -0.8);
  school.castShadow = true;
  g.add(school);

  // Pitched Roof & Belfry
  const roofGeo = new THREE.ConeGeometry(2.8, 0.9, 4);
  const roof = new THREE.Mesh(roofGeo, mat('#37474F'));
  roof.position.set(-0.3, 2.75, -0.8);
  roof.rotation.y = Math.PI / 4;
  g.add(roof);

  const belfryGeo = new THREE.BoxGeometry(0.7, 1.0, 0.7);
  const belfry = new THREE.Mesh(belfryGeo, mat('#ECEFF1'));
  belfry.position.set(-0.3, 3.2, -0.8);
  g.add(belfry);

  // Iconic Yellow School Bus
  const busBodyGeo = new THREE.BoxGeometry(2.4, 0.9, 1.1);
  const busBody = new THREE.Mesh(busBodyGeo, mat('#FDD835'));
  busBody.position.set(1.4, 0.7, 1.4);
  busBody.castShadow = true;
  g.add(busBody);

  // Bus Cab & Wheels
  const cabGeo = new THREE.BoxGeometry(0.6, 0.7, 1.05);
  const cab = new THREE.Mesh(cabGeo, mat('#FDD835'));
  cab.position.set(2.7, 0.6, 1.4);
  g.add(cab);

  const wheelGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.2, 12);
  const wheelMat = mat('#212121');
  [
    [0.7, 1.4 + 0.55],
    [0.7, 1.4 - 0.55],
    [2.3, 1.4 + 0.55],
    [2.3, 1.4 - 0.55],
  ].forEach(([x, z]) => {
    const w = new THREE.Mesh(wheelGeo, wheelMat);
    w.rotation.x = Math.PI / 2;
    w.position.set(x, 0.35, z);
    g.add(w);
  });

  // Playground Basketball Hoop
  const poleGeo = new THREE.CylinderGeometry(0.05, 0.05, 1.8, 6);
  const pole = new THREE.Mesh(poleGeo, mat('#78909C'));
  pole.position.set(-2.6, 1.05, 1.3);
  g.add(pole);

  const boardGeo = new THREE.BoxGeometry(0.1, 0.6, 0.8);
  const board = new THREE.Mesh(boardGeo, mat('#FFFFFF'));
  board.position.set(-2.6, 1.8, 1.3);
  g.add(board);

  return g;
}

// 04. Ancient Ruins
export function buildAncientRuinsDiorama(variant: IslandVariant): THREE.Group {
  const g = new THREE.Group();

  // Stepped Amphitheater
  for (let s = 0; s < 4; s++) {
    const tierGeo = new THREE.CylinderGeometry(3.6 - s * 0.6, 3.8 - s * 0.6, 0.2, 16, 1, false, 0, Math.PI);
    const tier = new THREE.Mesh(tierGeo, mat('#E0D6C3'));
    tier.position.set(0, 0.2 + s * 0.2, -0.6);
    tier.rotation.y = -Math.PI / 2;
    tier.receiveShadow = true;
    g.add(tier);
  }

  // Classical Columns
  for (let c = -1.6; c <= 1.6; c += 0.8) {
    const colHeight = c === 0 ? 2.4 : 1.8 + Math.abs(c) * 0.3;
    const colGeo = new THREE.CylinderGeometry(0.18, 0.22, colHeight, 10);
    const col = new THREE.Mesh(colGeo, mat('#E0D6C3'));
    col.position.set(c, colHeight / 2 + 0.2, 1.2);
    col.castShadow = true;
    g.add(col);
  }

  // Architrave Beam across central columns
  const beamGeo = new THREE.BoxGeometry(2.6, 0.35, 0.5);
  const beam = new THREE.Mesh(beamGeo, mat('#D7CCC8'));
  beam.position.set(0, 2.6, 1.2);
  beam.castShadow = true;
  g.add(beam);

  // Ancient Olive Tree
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.35, 1.8, 6), mat('#6D4C41'));
  trunk.position.set(-2.2, 1.1, -1.2);
  g.add(trunk);

  const canopy = new THREE.Mesh(new THREE.DodecahedronGeometry(1.0, 1), mat('#689F38'));
  canopy.position.set(-2.2, 2.1, -1.2);
  canopy.castShadow = true;
  g.add(canopy);

  return g;
}

// 05. Cinema
export function buildCinemaDiorama(variant: IslandVariant): THREE.Group {
  const g = new THREE.Group();

  // Cinema Art Deco Building
  const hallGeo = new THREE.BoxGeometry(3.8, 3.0, 2.5);
  const hall = new THREE.Mesh(hallGeo, mat('#212121'));
  hall.position.set(0, 1.65, -0.6);
  hall.castShadow = true;
  g.add(hall);

  // Marquee Canopy with bulbs
  const marqueeGeo = new THREE.BoxGeometry(3.2, 0.7, 1.2);
  const marquee = new THREE.Mesh(marqueeGeo, mat('#C62828'));
  marquee.position.set(0, 2.4, 0.8);
  g.add(marquee);

  // Glowing Marquee Lights
  for (let i = -1.3; i <= 1.3; i += 0.4) {
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), mat('#FFD54F', { emissive: '#FFD54F', emissiveIntensity: 0.6 }));
    bulb.position.set(i, 2.1, 1.42);
    g.add(bulb);
  }

  // Red Carpet Runner
  const carpetGeo = new THREE.BoxGeometry(1.4, 0.05, 2.6);
  const carpet = new THREE.Mesh(carpetGeo, mat('#D32F2F'));
  carpet.position.set(0, 0.18, 1.4);
  carpet.receiveShadow = true;
  g.add(carpet);

  // Ticket Booth Kiosk
  const kioskGeo = new THREE.CylinderGeometry(0.45, 0.45, 1.2, 8);
  const kiosk = new THREE.Mesh(kioskGeo, mat('#FFD54F', { metalness: 0.6 }));
  kiosk.position.set(-1.6, 0.75, 1.2);
  g.add(kiosk);

  // Film Reel Stack
  const reelGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.15, 12);
  const reelMat = mat('#B0BEC5', { metalness: 0.7 });
  for (let r = 0; r < 3; r++) {
    const reel = new THREE.Mesh(reelGeo, reelMat);
    reel.position.set(1.8, 0.25 + r * 0.16, 1.3);
    g.add(reel);
  }

  return g;
}

// 06. Concert Hall
export function buildConcertHallDiorama(variant: IslandVariant): THREE.Group {
  const g = new THREE.Group();

  // Acoustic Curved Shell Roof
  const shellGeo = new THREE.SphereGeometry(3.2, 16, 12, 0, Math.PI, 0, Math.PI / 1.8);
  const shellMat = mat(variant === 'fantasy' ? '#AB47BC' : '#D4AF37', { metalness: 0.4, side: THREE.DoubleSide });
  const shell = new THREE.Mesh(shellGeo, shellMat);
  shell.position.set(0, 1.6, -1.0);
  shell.rotation.x = Math.PI / 2;
  shell.castShadow = true;
  g.add(shell);

  // Hardwood Stage Platform
  const stageGeo = new THREE.CylinderGeometry(2.8, 3.0, 0.4, 24, 1, false, 0, Math.PI);
  const stage = new THREE.Mesh(stageGeo, mat('#8D4024'));
  stage.position.set(0, 0.35, 0);
  stage.rotation.y = -Math.PI / 2;
  stage.receiveShadow = true;
  g.add(stage);

  // Grand Piano
  const pianoBody = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.45, 0.9), mat('#1B1B1B'));
  pianoBody.position.set(-0.6, 0.8, -0.2);
  g.add(pianoBody);

  const pianoLid = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.08, 0.9), mat('#212121'));
  pianoLid.position.set(-0.6, 1.2, -0.2);
  pianoLid.rotation.z = 0.35;
  g.add(pianoLid);

  // Piano stool
  const stool = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.4, 0.35), mat('#C62828'));
  stool.position.set(-0.6, 0.6, 0.5);
  g.add(stool);

  // Stage Spotlights Overhead
  [-1.5, 0, 1.5].forEach((x) => {
    const spot = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.5, 8), mat('#FFF8E1', { emissive: '#FFF8E1', emissiveIntensity: 0.8 }));
    spot.position.set(x, 2.8, 0.4);
    spot.rotation.x = -Math.PI / 3;
    g.add(spot);
  });

  return g;
}

// 07. Art Museum
export function buildArtMuseumDiorama(variant: IslandVariant): THREE.Group {
  const g = new THREE.Group();

  // Main Modernist Gallery Pavilion
  const gallGeo = new THREE.BoxGeometry(3.6, 2.2, 2.2);
  const gall = new THREE.Mesh(gallGeo, mat('#F5F5F6'));
  gall.position.set(-0.4, 1.25, -0.6);
  gall.castShadow = true;
  g.add(gall);

  // Glass Pyramid Skylight (Louvre-inspired)
  const pyrGeo = new THREE.ConeGeometry(1.4, 1.2, 4);
  const pyrMat = mat('#80DEEA', { transparent: true, opacity: 0.8, metalness: 0.3 });
  const pyr = new THREE.Mesh(pyrGeo, pyrMat);
  pyr.position.set(-0.4, 2.9, -0.6);
  pyr.rotation.y = Math.PI / 4;
  g.add(pyr);

  // Outdoor Sculpture Plinth & Abstract Sculpture
  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.7, 0.4, 12), mat('#455A64'));
  plinth.position.set(1.8, 0.35, 1.0);
  g.add(plinth);

  const torusSculpt = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.16, 8, 16), mat('#8D6E63', { metalness: 0.7, roughness: 0.3 }));
  torusSculpt.position.set(1.8, 1.2, 1.0);
  torusSculpt.rotation.set(0.6, 0.8, 0.3);
  torusSculpt.castShadow = true;
  g.add(torusSculpt);

  // Reflective Sculpture Water Basin
  const poolGeo = new THREE.CylinderGeometry(1.1, 1.1, 0.15, 16);
  const pool = new THREE.Mesh(poolGeo, mat('#00ACC1', { roughness: 0.1 }));
  pool.position.set(1.8, 0.18, 1.0);
  g.add(pool);

  return g;
}

// 08. Sports Stadium
export function buildSportsStadiumDiorama(variant: IslandVariant): THREE.Group {
  const g = new THREE.Group();

  // Striped Playing Pitch
  const pitchGeo = new THREE.BoxGeometry(4.0, 0.1, 2.8);
  const pitch = new THREE.Mesh(pitchGeo, mat('#2E7D32'));
  pitch.position.set(0, 0.22, 0);
  pitch.receiveShadow = true;
  g.add(pitch);

  // Tiered Grandstand Bleachers around perimeter
  const standGeo = new THREE.CylinderGeometry(3.6, 4.0, 1.4, 24, 1, true);
  const stand = new THREE.Mesh(standGeo, mat('#1565C0'));
  stand.position.set(0, 0.85, 0);
  g.add(stand);

  // Four Stadium Floodlights
  const lightOffsets = [
    [-2.2, -1.6],
    [2.2, -1.6],
    [-2.2, 1.6],
    [2.2, 1.6],
  ];
  lightOffsets.forEach(([x, z]) => {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 2.8, 6), mat('#455A64'));
    p.position.set(x, 1.55, z);
    g.add(p);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 0.2), mat('#FFF8E1', { emissive: '#FFF8E1', emissiveIntensity: 0.7 }));
    head.position.set(x, 2.9, z);
    head.lookAt(0, 0.2, 0);
    g.add(head);
  });

  // Digital Scoreboard
  const board = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.8, 0.2), mat('#FF9800'));
  board.position.set(0, 2.2, -2.1);
  g.add(board);

  return g;
}

// 09. Cozy Home
export function buildCozyHomeDiorama(variant: IslandVariant): THREE.Group {
  const g = new THREE.Group();

  // Main Cottage
  const house = new THREE.Mesh(new THREE.BoxGeometry(2.8, 2.0, 2.2), mat('#F5F5F0'));
  house.position.set(-0.4, 1.15, -0.4);
  house.castShadow = true;
  g.add(house);

  // Terracotta Pitched Roof
  const roof = new THREE.Mesh(new THREE.ConeGeometry(2.4, 1.2, 4), mat('#D87A56'));
  roof.position.set(-0.4, 2.7, -0.4);
  roof.rotation.y = Math.PI / 4;
  roof.castShadow = true;
  g.add(roof);

  // Smoking Chimney
  const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.4, 0.4), mat('#8D6E63'));
  chimney.position.set(0.6, 2.8, -0.7);
  g.add(chimney);

  // Front Porch & Posts
  const porch = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.15, 0.9), mat('#8D6E63'));
  porch.position.set(-0.4, 0.22, 1.0);
  g.add(porch);

  // Red Mailbox
  const mPost = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.9, 6), mat('#6D4C41'));
  mPost.position.set(1.6, 0.55, 1.5);
  g.add(mPost);

  const mBox = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.2, 0.4), mat('#D32F2F'));
  mBox.position.set(1.6, 0.95, 1.5);
  g.add(mBox);

  // Apple Tree in Garden
  const treeTrunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.2, 1.8, 6), mat('#5D4037'));
  treeTrunk.position.set(2.0, 1.05, -0.6);
  g.add(treeTrunk);

  const treeCanopy = new THREE.Mesh(new THREE.DodecahedronGeometry(0.9, 1), mat('#43A047'));
  treeCanopy.position.set(2.0, 2.0, -0.6);
  treeCanopy.castShadow = true;
  g.add(treeCanopy);

  return g;
}

// 10. Food Market
export function buildFoodMarketDiorama(variant: IslandVariant): THREE.Group {
  const g = new THREE.Group();

  // Bakery Stall
  const stall = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.4, 1.2), mat('#6D4C41'));
  stall.position.set(-1.0, 0.85, -0.6);
  stall.castShadow = true;
  g.add(stall);

  // Striped Awning
  const awning = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.2, 1.4), mat('#E53935'));
  awning.position.set(-1.0, 1.7, 0.0);
  awning.rotation.x = 0.2;
  g.add(awning);

  // Produce Crates
  [-0.4, 0.4, 1.2].forEach((x, i) => {
    const crate = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.4, 0.5), mat('#FFE082'));
    crate.position.set(x, 0.35, 1.2);
    g.add(crate);

    const produce = new THREE.Mesh(new THREE.SphereGeometry(0.22, 6, 6), mat(i === 0 ? '#E53935' : i === 1 ? '#43A047' : '#FB8C00'));
    produce.position.set(x, 0.6, 1.2);
    g.add(produce);
  });

  // Outdoor Cafe Bistro Table
  const tableTop = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.08, 12), mat('#FFFFFF'));
  tableTop.position.set(1.4, 0.75, -0.4);
  g.add(tableTop);

  const tableLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.65, 6), mat('#37474F'));
  tableLeg.position.set(1.4, 0.42, -0.4);
  g.add(tableLeg);

  return g;
}

// 11. Shopping District
export function buildShoppingDistrictDiorama(variant: IslandVariant): THREE.Group {
  const g = new THREE.Group();

  // Row of Boutique Storefronts
  const b1 = new THREE.Mesh(new THREE.BoxGeometry(1.8, 2.6, 2.2), mat('#263238'));
  b1.position.set(-1.2, 1.45, -0.8);
  b1.castShadow = true;
  g.add(b1);

  const b2 = new THREE.Mesh(new THREE.BoxGeometry(1.8, 2.8, 2.2), mat('#C2185B'));
  b2.position.set(0.8, 1.55, -0.8);
  b2.castShadow = true;
  g.add(b2);

  // Glowing shop windows
  const win1 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 0.1), mat('#FFE082', { emissive: '#FFE082', emissiveIntensity: 0.5 }));
  win1.position.set(-1.2, 1.0, 0.35);
  g.add(win1);

  const win2 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 0.1), mat('#80DEEA', { emissive: '#80DEEA', emissiveIntensity: 0.5 }));
  win2.position.set(0.8, 1.0, 0.35);
  g.add(win2);

  // Vintage Streetlamp
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 2.2, 8), mat('#455A64'));
  pole.position.set(-2.0, 1.25, 1.2);
  g.add(pole);

  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), mat('#FFD54F', { emissive: '#FFD54F', emissiveIntensity: 0.8 }));
  lamp.position.set(-2.0, 2.3, 1.2);
  g.add(lamp);

  return g;
}

// 12. Creative Workshop
export function buildCreativeWorkshopDiorama(variant: IslandVariant): THREE.Group {
  const g = new THREE.Group();

  // Heavy Wood Workbench
  const bench = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.35, 1.6), mat('#5D4037'));
  bench.position.set(0, 1.1, -0.4);
  bench.castShadow = true;
  g.add(bench);

  // Bench legs
  [
    [-1.3, -1.0],
    [1.3, -1.0],
    [-1.3, 0.2],
    [1.3, 0.2],
  ].forEach(([x, z]) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.0, 0.2), mat('#455A64'));
    leg.position.set(x, 0.55, z);
    g.add(leg);
  });

  // Pegboard Tool Rack on back wall
  const board = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.4, 0.1), mat('#78909C'));
  board.position.set(0, 2.1, -1.2);
  g.add(board);

  // Machinery Gears
  const gearGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.1, 12);
  const gear = new THREE.Mesh(gearGeo, mat('#FB8C00', { metalness: 0.6 }));
  gear.rotation.x = Math.PI / 2;
  gear.position.set(-0.8, 1.5, -0.3);
  g.add(gear);

  // Drafting Table with Blueprints
  const draft = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.08, 0.8), mat('#1976D2'));
  draft.position.set(1.6, 0.85, 0.8);
  draft.rotation.x = 0.3;
  g.add(draft);

  return g;
}

// 13. Forest Sanctuary
export function buildForestSanctuaryDiorama(variant: IslandVariant): THREE.Group {
  const g = new THREE.Group();

  // Winding Stream Channel
  const brookGeo = new THREE.CylinderGeometry(1.2, 1.4, 0.15, 16);
  const brook = new THREE.Mesh(brookGeo, mat('#4BA4B8', { roughness: 0.2 }));
  brook.scale.set(1.0, 1.0, 2.4);
  brook.position.set(0, 0.18, 0);
  g.add(brook);

  // Tall Pines
  const treePositions = [
    [-1.8, -1.2, 2.4],
    [-2.2, 0.8, 2.0],
    [1.8, -1.4, 2.6],
    [2.2, 1.0, 1.8],
  ];
  treePositions.forEach(([x, z, h]) => {
    const t = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.2, h * 0.4, 6), mat('#4E342E'));
    t.position.set(x, (h * 0.4) / 2 + 0.15, z);
    g.add(t);

    for (let l = 0; l < 3; l++) {
      const cone = new THREE.Mesh(new THREE.ConeGeometry(0.9 - l * 0.2, 0.9, 7), mat('#2E7D32'));
      cone.position.set(x, h * 0.3 + l * 0.6 + 0.3, z);
      cone.castShadow = true;
      g.add(cone);
    }
  });

  // Wooden Observation Hide
  const hide = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.0, 1.2), mat('#8D6E63'));
  hide.position.set(0.6, 1.6, -1.0);
  hide.castShadow = true;
  g.add(hide);

  // Stilt Legs for Hide
  for (let sx of [-0.4, 0.4]) {
    const stilt = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.4, 6), mat('#5D4037'));
    stilt.position.set(0.6 + sx, 0.8, -1.0);
    g.add(stilt);
  }

  return g;
}

// 14. Ocean Reef
export function buildOceanReefDiorama(variant: IslandVariant): THREE.Group {
  const g = new THREE.Group();

  // Translucent Turquoise Water Volume
  const waterVol = new THREE.Mesh(
    new THREE.CylinderGeometry(4.6, 4.8, 1.4, 24),
    mat('#00ACC1', { transparent: true, opacity: 0.35, roughness: 0.1 })
  );
  waterVol.position.set(0, 0.8, 0);
  g.add(waterVol);

  // Branching Coral Pillars
  const coralColors = ['#FF7043', '#AB47BC', '#FFCA28', '#E91E63'];
  [
    [-1.2, -0.6, 0],
    [0.6, -1.0, 1],
    [-0.8, 0.8, 2],
    [1.4, 0.6, 3],
  ].forEach(([x, z, cIdx]) => {
    const cMesh = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.8, 7), mat(coralColors[cIdx]));
    cMesh.position.set(x, 1.0, z);
    cMesh.castShadow = true;
    g.add(cMesh);
  });

  // Giant Clamshell
  const clam = new THREE.Mesh(new THREE.SphereGeometry(0.5, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat('#FFF9C4'));
  clam.position.set(0, 0.35, 1.2);
  clam.rotation.x = -0.5;
  g.add(clam);

  const pearl = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 12), mat('#FFFFFF', { metalness: 0.6, roughness: 0.2 }));
  pearl.position.set(0, 0.45, 1.2);
  g.add(pearl);

  return g;
}

// 15. Botanical Garden
export function buildBotanicalGardenDiorama(variant: IslandVariant): THREE.Group {
  const g = new THREE.Group();

  // Victorian Octagonal Glasshouse
  const glassGeo = new THREE.CylinderGeometry(1.8, 2.0, 1.8, 8);
  const glassMat = mat('#B2EBF2', { transparent: true, opacity: 0.7, metalness: 0.2 });
  const glassHouse = new THREE.Mesh(glassGeo, glassMat);
  glassHouse.position.set(0, 1.15, -0.6);
  glassHouse.castShadow = true;
  g.add(glassHouse);

  // Glass Dome Roof
  const dome = new THREE.Mesh(new THREE.ConeGeometry(1.85, 1.2, 8), mat('#455A64', { wireframe: true }));
  dome.position.set(0, 2.6, -0.6);
  g.add(dome);

  // Tropical Palm inside / beside
  const palmTrunk = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.16, 2.0, 6), mat('#6D4C41'));
  palmTrunk.position.set(0, 1.15, -0.6);
  g.add(palmTrunk);

  // Formal Symmetrical Flower Beds
  [-1.6, 1.6].forEach((x) => {
    const bed = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.2, 1.2), mat('#E91E63'));
    bed.position.set(x, 0.25, 1.2);
    g.add(bed);
  });

  // Center Fountain Basin
  const fountain = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.7, 0.3, 16), mat('#CFD8DC'));
  fountain.position.set(0, 0.3, 1.2);
  g.add(fountain);

  return g;
}

// 16. Travel Harbor
export function buildTravelHarborDiorama(variant: IslandVariant): THREE.Group {
  const g = new THREE.Group();

  // Water Slab
  const sea = new THREE.Mesh(new THREE.CylinderGeometry(4.8, 4.8, 0.2, 24, 1, false, 0, Math.PI), mat('#0288D1', { roughness: 0.2 }));
  sea.position.set(0, 0.12, 0.8);
  g.add(sea);

  // Lighthouse Tower
  const lgtGeo = new THREE.CylinderGeometry(0.6, 0.9, 3.4, 12);
  const lgt = new THREE.Mesh(lgtGeo, mat('#FFFFFF'));
  lgt.position.set(-1.8, 1.85, -0.8);
  lgt.castShadow = true;
  g.add(lgt);

  // Red lighthouse stripes
  const stripe = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.76, 0.7, 12), mat('#D32F2F'));
  stripe.position.set(-1.8, 2.1, -0.8);
  g.add(stripe);

  // Lighthouse Lantern & Beacon
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), mat('#FFEB3B', { emissive: '#FFEB3B', emissiveIntensity: 0.9 }));
  beacon.position.set(-1.8, 3.7, -0.8);
  g.add(beacon);

  // Wooden Pier
  const pier = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.25, 2.4), mat('#6D4C41'));
  pier.position.set(0.6, 0.3, 1.2);
  g.add(pier);

  // Sailboat
  const boat = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.6, 4), mat('#FFFFFF'));
  boat.position.set(2.0, 0.25, 1.4);
  boat.rotation.z = Math.PI / 2;
  g.add(boat);

  const sailGeo = new THREE.BufferGeometry();
  const sailVerts = new Float32Array([0, 0, 0, 0, 1.8, 0, 0.8, 0.2, 0]);
  sailGeo.setAttribute('position', new THREE.BufferAttribute(sailVerts, 3));
  sailGeo.computeVertexNormals();
  const sailMesh = new THREE.Mesh(sailGeo, mat('#FFFFFF', { side: THREE.DoubleSide }));
  sailMesh.position.set(2.0, 0.4, 1.4);
  g.add(sailMesh);

  return g;
}

// 17. Memory Garden
export function buildMemoryGardenDiorama(variant: IslandVariant): THREE.Group {
  const g = new THREE.Group();

  // Vintage Brass Clock Tower
  const tower = new THREE.Mesh(new THREE.BoxGeometry(1.0, 3.2, 1.0), mat('#8D6E63'));
  tower.position.set(-1.4, 1.75, -0.6);
  tower.castShadow = true;
  g.add(tower);

  const clockFace = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.1, 16), mat('#FFD54F', { metalness: 0.6 }));
  clockFace.rotation.x = Math.PI / 2;
  clockFace.position.set(-1.4, 2.7, -0.05);
  g.add(clockFace);

  // Pink Cherry Blossom Tree
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.3, 2.2, 6), mat('#4E342E'));
  trunk.position.set(1.4, 1.25, -0.4);
  g.add(trunk);

  const blossom = new THREE.Mesh(new THREE.DodecahedronGeometry(1.4, 1), mat('#F48FB1'));
  blossom.position.set(1.4, 2.6, -0.4);
  blossom.castShadow = true;
  g.add(blossom);

  // Photo Frames on Pedestals
  [-0.6, 0.6].forEach((x, idx) => {
    const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 0.8, 8), mat('#CFD8DC'));
    ped.position.set(x, 0.55, 1.2);
    g.add(ped);

    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 0.08), mat('#FFD54F', { metalness: 0.5 }));
    frame.position.set(x, 1.15, 1.2);
    g.add(frame);
  });

  return g;
}

// 18. Philosophy Pavilion
export function buildPhilosophyPavilionDiorama(variant: IslandVariant): THREE.Group {
  const g = new THREE.Group();

  // Slender Marble Rotunda Columns
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 2.4, 8), mat('#ECEFF1'));
    col.position.set(Math.cos(angle) * 1.8, 1.35, Math.sin(angle) * 1.8);
    col.castShadow = true;
    g.add(col);
  }

  // Open Rotunda Ring Roof
  const ringGeo = new THREE.TorusGeometry(1.8, 0.22, 8, 24);
  const ring = new THREE.Mesh(ringGeo, mat('#ECEFF1'));
  ring.rotation.x = Math.PI / 2;
  ring.position.set(0, 2.6, 0);
  g.add(ring);

  // Still Dark Mirror Reflecting Pool
  const pool = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 0.1, 24), mat('#37474F', { roughness: 0.05, metalness: 0.3 }));
  pool.position.set(0, 0.22, 0);
  g.add(pool);

  // Thinker Sculpture Plinth
  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.5, 0.6, 8), mat('#455A64'));
  plinth.position.set(0, 0.55, 0);
  g.add(plinth);

  const thinker = new THREE.Mesh(new THREE.DodecahedronGeometry(0.35, 0), mat('#8D6E63', { metalness: 0.6 }));
  thinker.position.set(0, 1.05, 0);
  g.add(thinker);

  return g;
}

// 19. Skill Workshop
export function buildSkillWorkshopDiorama(variant: IslandVariant): THREE.Group {
  const g = new THREE.Group();

  // Branching Skill Tree Sculpture
  const treeBase = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.4, 2.6, 8), mat('#455A64'));
  treeBase.position.set(0, 1.45, 0);
  g.add(treeBase);

  // Glowing Skill Nodes
  const nodeCoords = [
    [-1.0, 2.4, -0.6],
    [1.0, 2.4, -0.6],
    [0.0, 3.2, 0.0],
    [-1.2, 1.8, 0.8],
    [1.2, 1.8, 0.8],
  ];
  nodeCoords.forEach(([x, y, z]) => {
    const node = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 12), mat('#00E676', { emissive: '#00E676', emissiveIntensity: 0.6 }));
    node.position.set(x, y, z);
    g.add(node);

    // Connecting Branch Arm
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.2, 6), mat('#78909C'));
    arm.position.set(x * 0.5, y * 0.7 + 0.5, z * 0.5);
    arm.lookAt(x, y, z);
    arm.rotation.x += Math.PI / 2;
    g.add(arm);
  });

  // Stepped Academy Terraces
  for (let s = 0; s < 3; s++) {
    const terrace = new THREE.Mesh(new THREE.CylinderGeometry(3.6 - s * 0.8, 3.8 - s * 0.8, 0.2, 6), mat('#3949AB'));
    terrace.position.set(0, 0.2 + s * 0.18, 0);
    terrace.receiveShadow = true;
    g.add(terrace);
  }

  return g;
}

// 20. Dream Observatory
export function buildDreamObservatoryDiorama(variant: IslandVariant): THREE.Group {
  const g = new THREE.Group();

  // Twisting Celestial Tower
  const tower = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.8, 3.2, 12), mat('#5E35B1'));
  tower.position.set(0, 1.75, 0);
  tower.castShadow = true;
  g.add(tower);

  // Multifaceted Crystal Dome
  const dome = new THREE.Mesh(new THREE.IcosahedronGeometry(1.3, 1), mat('#80DEEA', { transparent: true, opacity: 0.85, metalness: 0.4 }));
  dome.position.set(0, 3.7, 0);
  dome.castShadow = true;
  g.add(dome);

  // Floating Brass Armillary Rings
  [1.9, 2.3].forEach((r, idx) => {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.08, 8, 32), mat('#FFD54F', { metalness: 0.7 }));
    ring.rotation.set(0.6 + idx * 0.8, 0.4 + idx * 0.5, 0);
    ring.position.set(0, 2.5, 0);
    g.add(ring);
  });

  // Stardust Bridge
  const bridgeGeo = new THREE.TorusGeometry(3.0, 0.25, 8, 24, Math.PI / 2);
  const bridge = new THREE.Mesh(bridgeGeo, mat('#EC407A'));
  bridge.rotation.z = Math.PI / 4;
  bridge.position.set(-1.2, 1.2, 1.2);
  g.add(bridge);

  return g;
}

// ---------------------------------------------------------------------------
// 09. City & Community (REPLACE) — Society, Cities, Public Life
// ---------------------------------------------------------------------------
export function buildCityCommunityDiorama(variant: IslandVariant): THREE.Group {
  const g = new THREE.Group();

  // 1. Municipal Civic Clock Tower & Town Hall
  const hallBase = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.8, 2.0), mat('#ECEFF1', { roughness: 0.6 }));
  hallBase.position.set(-0.8, 0.9, -0.6);
  hallBase.castShadow = true;
  g.add(hallBase);

  // Colonnade portico entrance
  [-0.6, 0.6].forEach((x) => {
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 1.4, 8), mat('#CFD8DC'));
    col.position.set(-0.8 + x, 0.7, 0.5);
    g.add(col);
  });
  const porticoRoof = new THREE.Mesh(new THREE.ConeGeometry(0.9, 0.5, 4), mat('#37474F'));
  porticoRoof.rotation.y = Math.PI / 4;
  porticoRoof.position.set(-0.8, 1.6, 0.5);
  g.add(porticoRoof);

  // Tower shaft
  const tower = new THREE.Mesh(new THREE.BoxGeometry(1.2, 3.2, 1.2), mat('#ECEFF1', { roughness: 0.6 }));
  tower.position.set(-0.8, 2.4, -0.6);
  tower.castShadow = true;
  g.add(tower);

  // Clock dials
  const clockDialGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.08, 16);
  const clockDialMat = mat('#FFD54F', { metalness: 0.5, roughness: 0.2 });
  const clockF = new THREE.Mesh(clockDialGeo, clockDialMat);
  clockF.rotation.x = Math.PI / 2;
  clockF.position.set(-0.8, 3.2, 0.05);
  g.add(clockF);

  // Tower Steeple Pyramid
  const steeple = new THREE.Mesh(new THREE.ConeGeometry(0.9, 1.4, 4), mat('#37474F', { roughness: 0.5 }));
  steeple.rotation.y = Math.PI / 4;
  steeple.position.set(-0.8, 4.7, -0.6);
  steeple.castShadow = true;
  g.add(steeple);

  // Weathervane Gold Finial
  const finial = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), mat('#FFB300', { metalness: 0.8 }));
  finial.position.set(-0.8, 5.5, -0.6);
  g.add(finial);

  // 2. Central Public Fountain Plaza
  const basinOuter = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.3, 0.35, 24), mat('#CFD8DC'));
  basinOuter.position.set(1.4, 0.18, 0.6);
  g.add(basinOuter);

  const waterDisc = new THREE.Mesh(
    new THREE.CylinderGeometry(1.05, 1.05, 0.05, 24),
    mat('#0288D1', { roughness: 0.2, metalness: 0.1 })
  );
  waterDisc.position.set(1.4, 0.32, 0.6);
  g.add(waterDisc);

  // Fountain center tier & jet
  const fountainPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.3, 0.8, 12), mat('#B0BEC5'));
  fountainPillar.position.set(1.4, 0.6, 0.6);
  g.add(fountainPillar);
  const upperBasin = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.4, 0.18, 16), mat('#B0BEC5'));
  upperBasin.position.set(1.4, 0.95, 0.6);
  g.add(upperBasin);
  const waterSpout = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), mat('#80DEEA', { roughness: 0.1 }));
  waterSpout.position.set(1.4, 1.15, 0.6);
  g.add(waterSpout);

  // 3. Public Transit Stop Shelter
  const shelterRoof = new THREE.Mesh(
    new THREE.BoxGeometry(1.4, 0.08, 0.8),
    mat('#80DEEA', { roughness: 0.1, transparent: true, opacity: 0.85 })
  );
  shelterRoof.position.set(0.6, 1.4, 2.0);
  g.add(shelterRoof);

  [-0.6, 0.6].forEach((sx) => {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.4, 8), mat('#37474F'));
    post.position.set(0.6 + sx, 0.7, 2.0);
    g.add(post);
  });

  // Transit Sign
  const transitSign = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.45, 0.05), mat('#FFB300'));
  transitSign.position.set(1.4, 1.1, 2.0);
  g.add(transitSign);

  // 4. Street Park Benches
  const bench1 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.15, 0.35), mat('#5D4037'));
  bench1.position.set(0.5, 0.25, -0.4);
  bench1.rotation.y = -0.3;
  g.add(bench1);

  // 5. Street Trees with Grates
  [
    { x: -1.8, z: 1.4, r: 0.55 },
    { x: 2.2, z: -1.0, r: 0.5 },
  ].forEach((t) => {
    // Tree trunk
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 1.0, 8), mat('#5D4037'));
    trunk.position.set(t.x, 0.5, t.z);
    g.add(trunk);

    // Tree canopy
    const canopy = new THREE.Mesh(new THREE.DodecahedronGeometry(t.r, 1), mat('#43A047'));
    canopy.position.set(t.x, 1.3, t.z);
    canopy.castShadow = true;
    g.add(canopy);

    // Cast iron tree grate ring
    const grate = new THREE.Mesh(new THREE.RingGeometry(0.15, 0.35, 12), mat('#37474F'));
    grate.rotation.x = -Math.PI / 2;
    grate.position.set(t.x, 0.02, t.z);
    g.add(grate);
  });

  // 6. Vintage Dual-Arm Streetlamp
  const lampPole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 1.8, 8), mat('#263238'));
  lampPole.position.set(-0.2, 0.9, 1.2);
  g.add(lampPole);
  [-0.18, 0.18].forEach((lx) => {
    const lampHead = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), mat('#FFE082', { roughness: 0.2 }));
    lampHead.position.set(-0.2 + lx, 1.8, 1.2);
    g.add(lampHead);
  });

  return g;
}

// ---------------------------------------------------------------------------
// 20. Future & Innovation Lab (REPLACE) — Future, Technology, Creativity
// ---------------------------------------------------------------------------
export function buildFutureInnovationLabDiorama(variant: IslandVariant): THREE.Group {
  const g = new THREE.Group();

  // 1. Geodesic Clean-Room Dome
  const domeMat = mat('#E0F7FA', {
    roughness: 0.15,
    metalness: 0.3,
    transparent: true,
    opacity: 0.88,
  });
  const dome = new THREE.Mesh(new THREE.IcosahedronGeometry(1.6, 2), domeMat);
  dome.position.set(0, 1.2, 0);
  dome.castShadow = true;
  g.add(dome);

  // Interior Quantum Core Cylinder
  const core = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 1.4, 12), mat('#00E5FF', { roughness: 0.2 }));
  core.position.set(0, 0.9, 0);
  g.add(core);

  // Hexagonal Base Collar
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.9, 0.4, 6), mat('#263238', { roughness: 0.5 }));
  collar.position.set(0, 0.2, 0);
  collar.receiveShadow = true;
  g.add(collar);

  // 2. Hovering Holographic Emitter Ring
  const holoRingGeo = new THREE.TorusGeometry(2.3, 0.06, 8, 36);
  const holoRingMat = mat('#00E5FF', { metalness: 0.6, roughness: 0.2 });
  const holoRing = new THREE.Mesh(holoRingGeo, holoRingMat);
  holoRing.rotation.x = Math.PI / 2;
  holoRing.position.set(0, 1.9, 0);
  g.add(holoRing);

  // Slanted Projection Beams
  [0, (Math.PI * 2) / 3, (Math.PI * 4) / 3].forEach((ang) => {
    const emitterPost = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 1.8, 8), mat('#37474F'));
    emitterPost.position.set(Math.cos(ang) * 2.2, 0.9, Math.sin(ang) * 2.2);
    emitterPost.rotation.z = Math.cos(ang) * -0.15;
    g.add(emitterPost);

    const emitterLight = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), mat('#7C4DFF', { roughness: 0.2 }));
    emitterLight.position.set(Math.cos(ang) * 2.2, 1.85, Math.sin(ang) * 2.2);
    g.add(emitterLight);
  });

  // 3. Cantilevered Photovoltaic Solar Wings
  [-1.8, 1.8].forEach((wx) => {
    const wingPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 1.2, 8), mat('#455A64'));
    wingPillar.position.set(wx, 0.6, -1.6);
    g.add(wingPillar);

    const wingPanel = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 0.06, 0.9),
      mat('#1E88E5', { metalness: 0.7, roughness: 0.25 })
    );
    wingPanel.position.set(wx, 1.25, -1.6);
    wingPanel.rotation.x = -0.35;
    wingPanel.rotation.y = wx > 0 ? -0.2 : 0.2;
    wingPanel.castShadow = true;
    g.add(wingPanel);
  });

  // 4. Robotic Fabrication & Prototyping Station
  const robotPlinth = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.45, 0.5, 12), mat('#37474F'));
  robotPlinth.position.set(1.5, 0.25, 1.3);
  g.add(robotPlinth);

  // Articulated robotic arm
  const arm1 = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.8, 0.14), mat('#FFB300'));
  arm1.position.set(1.5, 0.7, 1.3);
  arm1.rotation.z = -0.4;
  g.add(arm1);

  const arm2 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.6, 0.12), mat('#ECEFF1'));
  arm2.position.set(1.7, 1.2, 1.3);
  arm2.rotation.z = 0.5;
  g.add(arm2);

  const toolHead = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.25, 8), mat('#00E5FF'));
  toolHead.position.set(1.85, 1.0, 1.3);
  toolHead.rotation.z = -Math.PI / 2;
  g.add(toolHead);

  // 5. Luminescent Circuit Tracks on Base
  const circuitArc = new THREE.Mesh(
    new THREE.TorusGeometry(3.6, 0.04, 6, 24, Math.PI),
    mat('#00E5FF', { metalness: 0.8, roughness: 0.2 })
  );
  circuitArc.rotation.x = Math.PI / 2;
  circuitArc.position.set(0, 0.05, 0);
  g.add(circuitArc);

  return g;
}

// ---------------------------------------------------------------------------
// Master Dispatcher for Level 2 Miniature Dioramas
// ---------------------------------------------------------------------------
export function buildDioramaScene(
  island: IslandMetadata,
  variant: IslandVariant = 'classic'
): THREE.Group {
  const masterGroup = new THREE.Group();
  masterGroup.name = `diorama_${island.slug}`;

  // Isolated architectural & environment scene — no artificial cylinder plinth/base

  // Specific Handcrafted Diorama Scene Content
  let content: THREE.Group;
  switch (island.slug) {
    case 'diorama-grand-library':
    case 'diorama-library':
      content = buildLibraryDiorama(variant);
      break;
    case 'diorama-science-observatory':
    case 'diorama-observatory':
      content = buildObservatoryDiorama(variant);
      break;
    case 'diorama-school-academy':
    case 'diorama-school-campus':
      content = buildSchoolCampusDiorama(variant);
      break;
    case 'diorama-ancient-civilization':
    case 'diorama-ancient-ruins':
      content = buildAncientRuinsDiorama(variant);
      break;
    case 'diorama-art-museum':
      content = buildArtMuseumDiorama(variant);
      break;
    case 'diorama-cinema-theater':
    case 'diorama-cinema':
      content = buildCinemaDiorama(variant);
      break;
    case 'diorama-music-hall':
    case 'diorama-concert-hall':
      content = buildConcertHallDiorama(variant);
      break;
    case 'diorama-sports-arena':
    case 'diorama-sports-stadium':
      content = buildSportsStadiumDiorama(variant);
      break;
    case 'diorama-city-community':
      content = buildCityCommunityDiorama(variant);
      break;
    case 'diorama-home-garden':
    case 'diorama-cozy-home':
      content = buildCozyHomeDiorama(variant);
      break;
    case 'diorama-food-market':
      content = buildFoodMarketDiorama(variant);
      break;
    case 'diorama-shopping-street':
    case 'diorama-shopping-district':
      content = buildShoppingDistrictDiorama(variant);
      break;
    case 'diorama-workshop-factory':
    case 'diorama-creative-workshop':
      content = buildCreativeWorkshopDiorama(variant);
      break;
    case 'diorama-forest-wildlife':
    case 'diorama-forest-sanctuary':
      content = buildForestSanctuaryDiorama(variant);
      break;
    case 'diorama-botanical-garden':
      content = buildBotanicalGardenDiorama(variant);
      break;
    case 'diorama-ocean-marine-life':
    case 'diorama-ocean-reef':
      content = buildOceanReefDiorama(variant);
      break;
    case 'diorama-travel-landmarks':
    case 'diorama-travel-harbor':
      content = buildTravelHarborDiorama(variant);
      break;
    case 'diorama-memory-time-garden':
    case 'diorama-memory-garden':
      content = buildMemoryGardenDiorama(variant);
      break;
    case 'diorama-philosophy-sanctuary':
    case 'diorama-philosophy-pavilion':
      content = buildPhilosophyPavilionDiorama(variant);
      break;
    case 'diorama-future-innovation-lab':
    case 'diorama-dream-observatory':
      content = buildFutureInnovationLabDiorama(variant);
      break;
    case 'diorama-skill-workshop':
      content = buildSkillWorkshopDiorama(variant);
      break;
    default:
      content = buildLibraryDiorama(variant);
      break;
  }

  masterGroup.add(content);
  return masterGroup;
}
