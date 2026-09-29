import * as THREE from 'three';
import { AppleAwardMaterials } from './materials';
import { AppleBadgeMeshGroup, createConvexCoinGeometry } from './BadgeGeometry';

// ============================================================================
// 10 MINECRAFT CHARACTERS (10组我的世界角色与生物系列)
// ============================================================================

/**
 * 1. Steve (史蒂夫 • 钻石镐与经典探险家)
 */
export function buildMinecraftSteveBadge(
  materials: AppleAwardMaterials,
  earnedDate: string = 'OCTOBER 28, 2026',
  isLocked: boolean = false
): AppleBadgeMeshGroup {
  const mirrorGold = materials.getMirrorGoldBezel(isLocked);
  const cyanShirt = materials.getColorLacquer(0x00bcd4, isLocked); // Steve Cyan
  const skinTone = materials.getColorLacquer(0xd7a17c, isLocked); // Steve Skin
  const darkHair = materials.getColorLacquer(0x4a2e18, isLocked); // Steve Brown Hair
  const diamondCyan = materials.getColorLacquer(0x00f0ff, isLocked); // Diamond Pickaxe
  const backMat = materials.getAppleBackShell(earnedDate, 'STEVE THE PIONEER', isLocked);

  const badge = new THREE.Group() as AppleBadgeMeshGroup;

  const baseMesh = new THREE.Mesh(
    createConvexCoinGeometry(1.65, 0.16, 0.08),
    [mirrorGold, cyanShirt, backMat]
  );
  baseMesh.rotation.x = Math.PI / 2;
  badge.add(baseMesh);

  const rimMesh = new THREE.Mesh(new THREE.TorusGeometry(1.65, 0.08, 16, 64), mirrorGold);
  badge.add(rimMesh);

  // Cubic Voxel Steve Head
  const headGroup = new THREE.Group();
  // Face block
  const face = new THREE.Mesh(new THREE.BoxGeometry(1.05, 1.05, 0.22), skinTone);
  face.position.set(0, 0.15, 0.1);
  headGroup.add(face);

  // Hair Cap & Sides
  const hairTop = new THREE.Mesh(new THREE.BoxGeometry(1.08, 0.38, 0.24), darkHair);
  hairTop.position.set(0, 0.52, 0.11);
  headGroup.add(hairTop);

  for (let side of [-1, 1]) {
    const hairSide = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.45, 0.23), darkHair);
    hairSide.position.set(side * 0.45, 0.22, 0.11);
    headGroup.add(hairSide);

    // Pixel Eyes
    const eyeWhite = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.09, 0.04), materials.getOffWhiteEnamel(isLocked));
    eyeWhite.position.set(side * 0.24, 0.12, 0.22);
    headGroup.add(eyeWhite);

    const eyePupil = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.09, 0.05), materials.getColorLacquer(0x3f51b5, isLocked));
    eyePupil.position.set(side * 0.2, 0.12, 0.23);
    headGroup.add(eyePupil);
  }

  // Goatee / Smile & Nose
  const nose = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.12, 0.04), materials.getColorLacquer(0xb5734c, isLocked));
  nose.position.set(0, -0.02, 0.22);
  headGroup.add(nose);

  const beard = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.12, 0.04), darkHair);
  beard.position.set(0, -0.18, 0.22);
  headGroup.add(beard);
  badge.add(headGroup);

  // Diamond Pickaxe Cross Emblem
  const pickaxeGroup = new THREE.Group();
  // Handle
  const handle = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.35, 0.06), materials.getColorLacquer(0x8d6e63, isLocked));
  handle.rotation.z = Math.PI * 0.25;
  handle.position.set(0.65, -0.55, 0.18);
  pickaxeGroup.add(handle);

  // Pickaxe Blade
  const blade = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.16, 0.08), diamondCyan);
  blade.rotation.z = -Math.PI * 0.25;
  blade.position.set(1.05, -0.15, 0.2);
  pickaxeGroup.add(blade);
  badge.add(pickaxeGroup);

  badge.setExplodedView = (f: number) => {
    baseMesh.position.z = -f * 0.25;
    headGroup.position.z = 0.1 + f * 0.85;
    pickaxeGroup.position.z = 0.18 + f * 1.25;
  };

  return badge;
}

/**
 * 2. Alex (爱丽克丝 • 丛林拓荒者与长弓)
 */
export function buildMinecraftAlexBadge(
  materials: AppleAwardMaterials,
  earnedDate: string = 'OCTOBER 28, 2026',
  isLocked: boolean = false
): AppleBadgeMeshGroup {
  const mirrorGold = materials.getMirrorGoldBezel(isLocked);
  const greenTunic = materials.getColorLacquer(0x4caf50, isLocked); // Alex Green
  const skinTone = materials.getColorLacquer(0xf5cba7, isLocked);
  const orangeHair = materials.getColorLacquer(0xe65100, isLocked); // Ginger Hair
  const bowBrown = materials.getColorLacquer(0x795548, isLocked);
  const backMat = materials.getAppleBackShell(earnedDate, 'ALEX EXPLORER', isLocked);

  const badge = new THREE.Group() as AppleBadgeMeshGroup;

  const baseMesh = new THREE.Mesh(
    createConvexCoinGeometry(1.65, 0.16, 0.08),
    [mirrorGold, greenTunic, backMat]
  );
  baseMesh.rotation.x = Math.PI / 2;
  badge.add(baseMesh);

  const rimMesh = new THREE.Mesh(new THREE.TorusGeometry(1.65, 0.08, 16, 64), mirrorGold);
  badge.add(rimMesh);

  // Alex Head
  const headGroup = new THREE.Group();
  const face = new THREE.Mesh(new THREE.BoxGeometry(1.05, 1.05, 0.22), skinTone);
  face.position.set(0, 0.15, 0.1);
  headGroup.add(face);

  // Ginger Hair Cap & Ponytail
  const hair = new THREE.Mesh(new THREE.BoxGeometry(1.08, 0.42, 0.24), orangeHair);
  hair.position.set(0, 0.52, 0.11);
  headGroup.add(hair);

  const ponytail = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.75, 0.22), orangeHair);
  ponytail.position.set(-0.52, -0.15, 0.12);
  headGroup.add(ponytail);

  // Green Eyes
  for (let side of [-1, 1]) {
    const eyeWhite = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.09, 0.04), materials.getOffWhiteEnamel(isLocked));
    eyeWhite.position.set(side * 0.24, 0.12, 0.22);
    headGroup.add(eyeWhite);

    const eyePupil = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.09, 0.05), materials.getColorLacquer(0x2e7d32, isLocked));
    eyePupil.position.set(side * 0.2, 0.12, 0.23);
    headGroup.add(eyePupil);
  }
  badge.add(headGroup);

  // Recurve Bow Emblem
  const bowGroup = new THREE.Group();
  const bowArc = new THREE.Mesh(new THREE.TorusGeometry(0.65, 0.045, 8, 24, Math.PI * 0.75), bowBrown);
  bowArc.rotation.z = Math.PI * 0.85;
  bowArc.position.set(0.65, -0.55, 0.16);
  bowGroup.add(bowArc);

  const stringLine = new THREE.Mesh(new THREE.BoxGeometry(0.02, 1.05, 0.02), materials.getOffWhiteEnamel(isLocked));
  stringLine.position.set(0.48, -0.55, 0.16);
  bowGroup.add(stringLine);
  badge.add(bowGroup);

  badge.setExplodedView = (f: number) => {
    baseMesh.position.z = -f * 0.25;
    headGroup.position.z = 0.1 + f * 0.85;
    bowGroup.position.z = 0.16 + f * 1.25;
  };

  return badge;
}

/**
 * 3. Creeper (苦力怕 • 伏特爆破与经典像素面孔)
 */
export function buildMinecraftCreeperBadge(
  materials: AppleAwardMaterials,
  earnedDate: string = 'OCTOBER 28, 2026',
  isLocked: boolean = false
): AppleBadgeMeshGroup {
  const spaceGray = materials.getSpaceGrayBezel(isLocked);
  const creeperGreen = materials.getColorLacquer(0x43a047, isLocked);
  const darkPixel = materials.getColorLacquer(0x18181b, isLocked); // Deep Charcoal Face
  const voltGreen = materials.getColorLacquer(0xa6ff00, isLocked);
  const backMat = materials.getAppleBackShell(earnedDate, 'VOLT CREEPER', isLocked);

  const badge = new THREE.Group() as AppleBadgeMeshGroup;

  const baseMesh = new THREE.Mesh(
    createConvexCoinGeometry(1.65, 0.16, 0.08),
    [spaceGray, creeperGreen, backMat]
  );
  baseMesh.rotation.x = Math.PI / 2;
  badge.add(baseMesh);

  const rimMesh = new THREE.Mesh(new THREE.TorusGeometry(1.65, 0.08, 16, 64), spaceGray);
  badge.add(rimMesh);

  // Square Creeper Head
  const headGroup = new THREE.Group();
  const faceBase = new THREE.Mesh(new THREE.BoxGeometry(1.35, 1.35, 0.18), voltGreen);
  faceBase.position.set(0, 0.05, 0.08);
  headGroup.add(faceBase);

  // Iconic Creeper Frown Pattern
  // Two square eyes
  for (let side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.32, 0.08), darkPixel);
    eye.position.set(side * 0.36, 0.35, 0.18);
    headGroup.add(eye);
  }

  // Central Nose / Bridge
  const nose = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.35, 0.08), darkPixel);
  nose.position.set(0, 0.05, 0.18);
  headGroup.add(nose);

  // Lower Frowning Mouth & Teeth
  const mouthTop = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.35, 0.08), darkPixel);
  mouthTop.position.set(0, -0.25, 0.18);
  headGroup.add(mouthTop);

  for (let side of [-1, 1]) {
    const outerTooth = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.45, 0.08), darkPixel);
    outerTooth.position.set(side * 0.45, -0.42, 0.18);
    headGroup.add(outerTooth);
  }
  badge.add(headGroup);

  // TNT Block Icon at bottom right
  const tntGroup = new THREE.Group();
  const tnt = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.48, 0.12), materials.getColorLacquer(0xd32f2f, isLocked));
  tnt.position.set(0.95, -0.85, 0.18);
  tntGroup.add(tnt);

  const tntBand = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.18, 0.14), materials.getOffWhiteEnamel(isLocked));
  tntBand.position.set(0.95, -0.85, 0.18);
  tntGroup.add(tntBand);
  badge.add(tntGroup);

  badge.setExplodedView = (f: number) => {
    baseMesh.position.z = -f * 0.25;
    headGroup.position.z = 0.08 + f * 0.85;
    tntGroup.position.z = 0.18 + f * 1.25;
  };

  return badge;
}

/**
 * 4. Enderman (末影人 • 虚空瞬移者与末影珍珠)
 */
export function buildMinecraftEndermanBadge(
  materials: AppleAwardMaterials,
  earnedDate: string = 'OCTOBER 28, 2026',
  isLocked: boolean = false
): AppleBadgeMeshGroup {
  const spaceGray = materials.getSpaceGrayBezel(isLocked);
  const abyssBlack = materials.getColorLacquer(0x0a0a0f, isLocked); // Obsidian Void
  const enderPurple = materials.getColorLacquer(0xc026d3, isLocked); // Glowing Magenta/Purple Eyes
  const pearlCyan = materials.getColorLacquer(0x00f0ff, isLocked); // Ender Pearl
  const backMat = materials.getAppleBackShell(earnedDate, 'ENDERMAN VOID', isLocked);

  const badge = new THREE.Group() as AppleBadgeMeshGroup;

  const baseMesh = new THREE.Mesh(
    createConvexCoinGeometry(1.65, 0.16, 0.08),
    [spaceGray, abyssBlack, backMat]
  );
  baseMesh.rotation.x = Math.PI / 2;
  badge.add(baseMesh);

  const rimMesh = new THREE.Mesh(new THREE.TorusGeometry(1.65, 0.08, 16, 64), spaceGray);
  badge.add(rimMesh);

  // Slender Obsidian Enderman Head
  const headGroup = new THREE.Group();
  const head = new THREE.Mesh(new THREE.BoxGeometry(1.05, 1.05, 0.22), abyssBlack);
  head.position.set(0, 0.25, 0.1);
  headGroup.add(head);

  // Iconic Piercing Purple Eyes (Wide Horizontal Bars)
  for (let side of [-1, 1]) {
    const eyeSocket = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.12, 0.06), enderPurple);
    eyeSocket.position.set(side * 0.32, 0.22, 0.22);
    headGroup.add(eyeSocket);

    // Inner White Sparkle
    const eyePupil = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.12, 0.08), materials.getOffWhiteEnamel(isLocked));
    eyePupil.position.set(side * 0.32, 0.22, 0.23);
    headGroup.add(eyePupil);
  }

  // Slender Jaw Section
  const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.28, 0.2), abyssBlack);
  jaw.position.set(0, -0.22, 0.1);
  headGroup.add(jaw);
  badge.add(headGroup);

  // Ender Pearl Sphere Held
  const pearlGroup = new THREE.Group();
  const pearl = new THREE.Mesh(new THREE.SphereGeometry(0.32, 24, 24), pearlCyan);
  pearl.position.set(0, -0.75, 0.2);
  pearlGroup.add(pearl);

  const pearlRing = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.04, 8, 24), enderPurple);
  pearlRing.position.set(0, -0.75, 0.2);
  pearlGroup.add(pearlRing);
  badge.add(pearlGroup);

  badge.setExplodedView = (f: number) => {
    baseMesh.position.z = -f * 0.25;
    headGroup.position.z = 0.1 + f * 0.75;
    pearlGroup.position.z = 0.2 + f * 1.25;
  };

  return badge;
}

/**
 * 5. Skeleton (骷髅射手 • 白骨神射与骨弓)
 */
export function buildMinecraftSkeletonBadge(
  materials: AppleAwardMaterials,
  earnedDate: string = 'OCTOBER 28, 2026',
  isLocked: boolean = false
): AppleBadgeMeshGroup {
  const mirrorSilver = materials.getMirrorSilverBezel(isLocked);
  const slateTomb = materials.getColorLacquer(0x374151, isLocked); // Dungeon Slate
  const boneWhite = materials.getOffWhiteEnamel(isLocked);
  const socketBlack = materials.getColorLacquer(0x111827, isLocked);
  const bowWood = materials.getColorLacquer(0x8d6e63, isLocked);
  const backMat = materials.getAppleBackShell(earnedDate, 'SKELETON ARCHER', isLocked);

  const badge = new THREE.Group() as AppleBadgeMeshGroup;

  const baseMesh = new THREE.Mesh(
    createConvexCoinGeometry(1.65, 0.16, 0.08),
    [mirrorSilver, slateTomb, backMat]
  );
  baseMesh.rotation.x = Math.PI / 2;
  badge.add(baseMesh);

  const rimMesh = new THREE.Mesh(new THREE.TorusGeometry(1.65, 0.08, 16, 64), mirrorSilver);
  badge.add(rimMesh);

  // Skull Voxel Block
  const skullGroup = new THREE.Group();
  const skull = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 0.2), boneWhite);
  skull.position.set(0, 0.1, 0.1);
  skullGroup.add(skull);

  // Dark Hollow Eye Sockets
  for (let side of [-1, 1]) {
    const socket = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.28, 0.06), socketBlack);
    socket.position.set(side * 0.32, 0.22, 0.21);
    skullGroup.add(socket);
  }

  // Triangular Nose Cavity
  const nose = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.06), socketBlack);
  nose.position.set(0, -0.02, 0.21);
  skullGroup.add(nose);

  // Skeletal Mouth Teeth Slots
  for (let t = -2; t <= 2; t++) {
    const toothSlot = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.22, 0.06), socketBlack);
    toothSlot.position.set(t * 0.15, -0.32, 0.21);
    skullGroup.add(toothSlot);
  }
  badge.add(skullGroup);

  // Wooden Bow & Notched Arrow
  const arrowGroup = new THREE.Group();
  const bow = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.05, 8, 24, Math.PI * 0.8), bowWood);
  bow.rotation.z = Math.PI * 0.65;
  bow.position.set(0.65, -0.55, 0.18);
  arrowGroup.add(bow);

  const arrow = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.25, 0.05), materials.getColorLacquer(0xd1d5db, isLocked));
  arrow.rotation.z = -Math.PI * 0.25;
  arrow.position.set(0.65, -0.55, 0.2);
  arrowGroup.add(arrow);
  badge.add(arrowGroup);

  badge.setExplodedView = (f: number) => {
    baseMesh.position.z = -f * 0.25;
    skullGroup.position.z = 0.1 + f * 0.85;
    arrowGroup.position.z = 0.18 + f * 1.25;
  };

  return badge;
}

/**
 * 6. Zombie (僵尸 • 深夜潜行者与矿镐)
 */
export function buildMinecraftZombieBadge(
  materials: AppleAwardMaterials,
  earnedDate: string = 'OCTOBER 28, 2026',
  isLocked: boolean = false
): AppleBadgeMeshGroup {
  const spaceGray = materials.getSpaceGrayBezel(isLocked);
  const duskNavy = materials.getColorLacquer(0x1e293b, isLocked);
  const zombieGreen = materials.getColorLacquer(0x2e7d32, isLocked); // Zombie Rot Green
  const darkHair = materials.getColorLacquer(0x1b5e20, isLocked);
  const socketBlack = materials.getColorLacquer(0x0f172a, isLocked);
  const ironSilver = materials.getMirrorSilverBezel(isLocked);
  const backMat = materials.getAppleBackShell(earnedDate, 'ZOMBIE MINER', isLocked);

  const badge = new THREE.Group() as AppleBadgeMeshGroup;

  const baseMesh = new THREE.Mesh(
    createConvexCoinGeometry(1.65, 0.16, 0.08),
    [spaceGray, duskNavy, backMat]
  );
  baseMesh.rotation.x = Math.PI / 2;
  badge.add(baseMesh);

  const rimMesh = new THREE.Mesh(new THREE.TorusGeometry(1.65, 0.08, 16, 64), spaceGray);
  badge.add(rimMesh);

  // Zombie Head Block
  const headGroup = new THREE.Group();
  const face = new THREE.Mesh(new THREE.BoxGeometry(1.15, 1.15, 0.22), zombieGreen);
  face.position.set(0, 0.1, 0.1);
  headGroup.add(face);

  const hair = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.38, 0.24), darkHair);
  hair.position.set(0, 0.5, 0.11);
  headGroup.add(hair);

  // Sunken Black Eyes
  for (let side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.12, 0.06), socketBlack);
    eye.position.set(side * 0.28, 0.12, 0.22);
    headGroup.add(eye);
  }

  // Nose and Frown
  const nose = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.12, 0.06), darkHair);
  nose.position.set(0, -0.05, 0.22);
  headGroup.add(nose);

  const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.14, 0.06), socketBlack);
  mouth.position.set(0, -0.22, 0.22);
  headGroup.add(mouth);
  badge.add(headGroup);

  // Iron Ingot / Shovel Cross
  const toolGroup = new THREE.Group();
  const ironIngot = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.25, 0.12), ironSilver);
  ironIngot.position.set(0, -0.85, 0.18);
  toolGroup.add(ironIngot);
  badge.add(toolGroup);

  badge.setExplodedView = (f: number) => {
    baseMesh.position.z = -f * 0.25;
    headGroup.position.z = 0.1 + f * 0.85;
    toolGroup.position.z = 0.18 + f * 1.2;
  };

  return badge;
}

/**
 * 7. Iron Golem (铁傀儡 • 村庄守护巨灵与红虞美人)
 */
export function buildMinecraftIronGolemBadge(
  materials: AppleAwardMaterials,
  earnedDate: string = 'OCTOBER 28, 2026',
  isLocked: boolean = false
): AppleBadgeMeshGroup {
  const mirrorSilver = materials.getMirrorSilverBezel(isLocked);
  const slateCobble = materials.getColorLacquer(0x475569, isLocked);
  const ironWhite = materials.getOffWhiteEnamel(isLocked); // Weathered Iron
  const vineGreen = materials.getColorLacquer(0x15803d, isLocked); // Moss Vines
  const poppyRed = materials.getColorLacquer(0xfa114f, isLocked); // Red Poppy
  const eyeRed = materials.getColorLacquer(0xef4444, isLocked);
  const backMat = materials.getAppleBackShell(earnedDate, 'VILLAGE IRON GOLEM', isLocked);

  const badge = new THREE.Group() as AppleBadgeMeshGroup;

  const baseMesh = new THREE.Mesh(
    createConvexCoinGeometry(1.65, 0.16, 0.08),
    [mirrorSilver, slateCobble, backMat]
  );
  baseMesh.rotation.x = Math.PI / 2;
  badge.add(baseMesh);

  const rimMesh = new THREE.Mesh(new THREE.TorusGeometry(1.65, 0.08, 16, 64), mirrorSilver);
  badge.add(rimMesh);

  // Massive Golem Head with Long Brow
  const golemGroup = new THREE.Group();
  const head = new THREE.Mesh(new THREE.BoxGeometry(1.25, 1.45, 0.22), ironWhite);
  head.position.set(0, 0.15, 0.1);
  golemGroup.add(head);

  // Moss Vines Details
  const vine = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.65, 0.04), vineGreen);
  vine.position.set(-0.35, 0.35, 0.22);
  golemGroup.add(vine);

  // Heavy Brow Ridge
  const brow = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.25, 0.14), ironWhite);
  brow.position.set(0, 0.45, 0.22);
  golemGroup.add(brow);

  // Big Prominent Nose Block
  const nose = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.65, 0.18), materials.getColorLacquer(0xb45309, isLocked));
  nose.position.set(0, 0.05, 0.26);
  golemGroup.add(nose);

  // Glowing Red Golem Eyes
  for (let side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.06), eyeRed);
    eye.position.set(side * 0.35, 0.25, 0.22);
    golemGroup.add(eye);
  }
  badge.add(golemGroup);

  // Gentle Red Poppy Flower
  const poppyGroup = new THREE.Group();
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.75, 12), vineGreen);
  stem.position.set(0.65, -0.65, 0.18);
  poppyGroup.add(stem);

  const flower = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 16), poppyRed);
  flower.position.set(0.65, -0.3, 0.22);
  poppyGroup.add(flower);
  badge.add(poppyGroup);

  badge.setExplodedView = (f: number) => {
    baseMesh.position.z = -f * 0.25;
    golemGroup.position.z = 0.1 + f * 0.85;
    poppyGroup.position.z = 0.18 + f * 1.25;
  };

  return badge;
}

/**
 * 8. Pig / Piglin (小猪 / 猪灵 • 萌宠方猪与黄金胡萝卜)
 */
export function buildMinecraftPigBadge(
  materials: AppleAwardMaterials,
  earnedDate: string = 'OCTOBER 28, 2026',
  isLocked: boolean = false
): AppleBadgeMeshGroup {
  const mirrorGold = materials.getMirrorGoldBezel(isLocked);
  const meadowGreen = materials.getColorLacquer(0x16a34a, isLocked);
  const pigPink = materials.getColorLacquer(0xf472b6, isLocked); // Minecraft Pig Pink
  const snoutDark = materials.getColorLacquer(0xdb2777, isLocked);
  const goldCarrot = materials.getMirrorGoldBezel(isLocked);
  const backMat = materials.getAppleBackShell(earnedDate, 'FRIENDLY PIG', isLocked);

  const badge = new THREE.Group() as AppleBadgeMeshGroup;

  const baseMesh = new THREE.Mesh(
    createConvexCoinGeometry(1.65, 0.16, 0.08),
    [mirrorGold, meadowGreen, backMat]
  );
  baseMesh.rotation.x = Math.PI / 2;
  badge.add(baseMesh);

  const rimMesh = new THREE.Mesh(new THREE.TorusGeometry(1.65, 0.08, 16, 64), mirrorGold);
  badge.add(rimMesh);

  // Cubic Pig Head
  const pigGroup = new THREE.Group();
  const head = new THREE.Mesh(new THREE.BoxGeometry(1.25, 1.05, 0.22), pigPink);
  head.position.set(0, 0.12, 0.1);
  pigGroup.add(head);

  // Big Rectangular Snout Block
  const snout = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.32, 0.14), snoutDark);
  snout.position.set(0, -0.05, 0.24);
  pigGroup.add(snout);

  // Nostrils
  for (let side of [-1, 1]) {
    const nostril = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.04), materials.getColorLacquer(0x9d174d, isLocked));
    nostril.position.set(side * 0.15, -0.05, 0.32);
    pigGroup.add(nostril);

    // Wide Pig Eyes on Sides
    const eyeWhite = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.12, 0.04), materials.getOffWhiteEnamel(isLocked));
    eyeWhite.position.set(side * 0.48, 0.18, 0.22);
    pigGroup.add(eyeWhite);

    const eyePupil = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, 0.05), materials.getColorLacquer(0x18181b, isLocked));
    eyePupil.position.set(side * 0.44, 0.18, 0.23);
    pigGroup.add(eyePupil);
  }
  badge.add(pigGroup);

  // Golden Carrot Icon
  const carrotGroup = new THREE.Group();
  const carrot = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.75, 4), goldCarrot);
  carrot.rotation.z = Math.PI * 0.35;
  carrot.position.set(0.65, -0.65, 0.2);
  carrotGroup.add(carrot);

  const leaves = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.25, 0.08), materials.getColorLacquer(0x22c55e, isLocked));
  leaves.position.set(0.95, -0.42, 0.22);
  carrotGroup.add(leaves);
  badge.add(carrotGroup);

  badge.setExplodedView = (f: number) => {
    baseMesh.position.z = -f * 0.25;
    pigGroup.position.z = 0.1 + f * 0.85;
    carrotGroup.position.z = 0.2 + f * 1.25;
  };

  return badge;
}

/**
 * 9. Ender Dragon (末影龙 • 终末之巅与龙息结晶)
 */
export function buildMinecraftEnderDragonBadge(
  materials: AppleAwardMaterials,
  earnedDate: string = 'OCTOBER 28, 2026',
  isLocked: boolean = false
): AppleBadgeMeshGroup {
  const spaceGray = materials.getSpaceGrayBezel(isLocked);
  const endVoid = materials.getColorLacquer(0x0f0e17, isLocked); // Deep End Space
  const dragonBlack = materials.getColorLacquer(0x18181b, isLocked);
  const dragonEyes = materials.getColorLacquer(0xd946ef, isLocked); // Glowing Magenta Eyes
  const hornGray = materials.getColorLacquer(0x64748b, isLocked);
  const backMat = materials.getAppleBackShell(earnedDate, 'ENDER DRAGON', isLocked);

  const badge = new THREE.Group() as AppleBadgeMeshGroup;

  const baseMesh = new THREE.Mesh(
    createConvexCoinGeometry(1.65, 0.16, 0.08),
    [spaceGray, endVoid, backMat]
  );
  baseMesh.rotation.x = Math.PI / 2;
  badge.add(baseMesh);

  const rimMesh = new THREE.Mesh(new THREE.TorusGeometry(1.65, 0.08, 16, 64), spaceGray);
  badge.add(rimMesh);

  // Formidable Ender Dragon Head
  const dragonGroup = new THREE.Group();
  // Skull Block
  const skull = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.95, 0.28), dragonBlack);
  skull.position.set(0, 0.25, 0.12);
  dragonGroup.add(skull);

  // Snout Snapping Forward
  const snout = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.65, 0.22), dragonBlack);
  snout.position.set(0, -0.35, 0.18);
  dragonGroup.add(snout);

  // Nostril Cavity
  const nostril = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.15, 0.08), materials.getColorLacquer(0x09090b, isLocked));
  nostril.position.set(0, -0.55, 0.28);
  dragonGroup.add(nostril);

  // Twin Horns Sweeping Back
  for (let side of [-1, 1]) {
    const horn = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.65, 0.12), hornGray);
    horn.rotation.z = side * 0.45;
    horn.position.set(side * 0.58, 0.85, 0.14);
    dragonGroup.add(horn);

    // Glowing Purple Dragon Eyes
    const eye = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.14, 0.08), dragonEyes);
    eye.position.set(side * 0.42, 0.28, 0.28);
    dragonGroup.add(eye);
  }
  badge.add(dragonGroup);

  // Dragon Egg Gem
  const eggGroup = new THREE.Group();
  const egg = new THREE.Mesh(new THREE.SphereGeometry(0.28, 24, 24), dragonBlack);
  egg.scale.set(0.9, 1.25, 0.7);
  egg.position.set(0, -0.95, 0.18);
  eggGroup.add(egg);

  const eggGlow = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.035, 8, 24), dragonEyes);
  eggGlow.position.set(0, -0.95, 0.18);
  eggGroup.add(eggGlow);
  badge.add(eggGroup);

  badge.setExplodedView = (f: number) => {
    baseMesh.position.z = -f * 0.25;
    dragonGroup.position.z = 0.12 + f * 0.85;
    eggGroup.position.z = 0.18 + f * 1.25;
  };

  return badge;
}

/**
 * 10. Axolotl (美西螈 • 治愈水生灵与粉嫩鳃羽)
 */
export function buildMinecraftAxolotlBadge(
  materials: AppleAwardMaterials,
  earnedDate: string = 'OCTOBER 28, 2026',
  isLocked: boolean = false
): AppleBadgeMeshGroup {
  const mirrorSilver = materials.getMirrorSilverBezel(isLocked);
  const lushWater = materials.getColorLacquer(0x0284c7, isLocked); // Lush Cave Azure
  const axolotlPink = materials.getColorLacquer(0xfbcfe8, isLocked); // Pastel Baby Pink
  const frillDarkPink = materials.getColorLacquer(0xec4899, isLocked); // Vivid Pink Gills
  const eyeBlack = materials.getColorLacquer(0x18181b, isLocked);
  const waterCyan = materials.getColorLacquer(0x00f0ff, isLocked);
  const backMat = materials.getAppleBackShell(earnedDate, 'HEALING AXOLOTL', isLocked);

  const badge = new THREE.Group() as AppleBadgeMeshGroup;

  const baseMesh = new THREE.Mesh(
    createConvexCoinGeometry(1.65, 0.16, 0.08),
    [mirrorSilver, lushWater, backMat]
  );
  baseMesh.rotation.x = Math.PI / 2;
  badge.add(baseMesh);

  const rimMesh = new THREE.Mesh(new THREE.TorusGeometry(1.65, 0.08, 16, 64), mirrorSilver);
  badge.add(rimMesh);

  // Axolotl Wide Cubic Head
  const axoGroup = new THREE.Group();
  const head = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.85, 0.22), axolotlPink);
  head.position.set(0, 0.05, 0.1);
  axoGroup.add(head);

  // Iconic 3-Tier External Frill Gills on both sides
  for (let side of [-1, 1]) {
    for (let g = 0; g < 3; g++) {
      const frill = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.14, 0.08), frillDarkPink);
      frill.position.set(side * (0.85 + g * 0.08), 0.35 - g * 0.22, 0.12);
      axoGroup.add(frill);
    }

    // Wide Black Bead Eyes
    const eye = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.05), eyeBlack);
    eye.position.set(side * 0.48, 0.12, 0.22);
    axoGroup.add(eye);
  }

  // Sweet Smile Mouth
  const smile = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.08, 0.04), frillDarkPink);
  smile.position.set(0, -0.15, 0.22);
  axoGroup.add(smile);
  badge.add(axoGroup);

  // Water Bucket of Regeneration at Bottom
  const bucketGroup = new THREE.Group();
  const bucket = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.22, 0.45, 16), mirrorSilver);
  bucket.rotation.x = Math.PI / 2;
  bucket.position.set(0, -0.85, 0.16);
  bucketGroup.add(bucket);

  const water = new THREE.Mesh(new THREE.CircleGeometry(0.28, 16), waterCyan);
  water.position.set(0, -0.85, 0.22);
  bucketGroup.add(water);
  badge.add(bucketGroup);

  badge.setExplodedView = (f: number) => {
    baseMesh.position.z = -f * 0.25;
    axoGroup.position.z = 0.1 + f * 0.85;
    bucketGroup.position.z = 0.16 + f * 1.25;
  };

  return badge;
}
