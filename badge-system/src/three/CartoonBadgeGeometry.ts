import * as THREE from 'three';
import { AppleAwardMaterials } from './materials';
import { AppleBadgeMeshGroup, createConvexCoinGeometry } from './BadgeGeometry';

// ============================================================================
// 10 CARTOON CHARACTERS (10组卡通人物系列)
// ============================================================================

/**
 * 1. Little Sorcerer / Wizard (星穹小巫师 • 星冠与魔杖)
 */
export function buildCartoonWizardBadge(
  materials: AppleAwardMaterials,
  earnedDate: string = 'OCTOBER 28, 2026',
  isLocked: boolean = false
): AppleBadgeMeshGroup {
  const mirrorGold = materials.getMirrorGoldBezel(isLocked);
  const midnightViolet = materials.getColorLacquer(0x3a0ca3, isLocked);
  const starryGold = materials.getMirrorGoldBezel(isLocked);
  const cyanGlint = materials.getColorLacquer(0x00f0ff, isLocked);
  const faceMat = materials.getOffWhiteEnamel(isLocked);
  const backMat = materials.getAppleBackShell(earnedDate, 'STARLIGHT SORCERER', isLocked);

  const badge = new THREE.Group() as AppleBadgeMeshGroup;

  const baseMesh = new THREE.Mesh(
    createConvexCoinGeometry(1.65, 0.16, 0.08),
    [mirrorGold, midnightViolet, backMat]
  );
  baseMesh.rotation.x = Math.PI / 2;
  badge.add(baseMesh);

  const rimMesh = new THREE.Mesh(new THREE.TorusGeometry(1.65, 0.08, 16, 64), mirrorGold);
  badge.add(rimMesh);

  // Pointed Wizard Hat with Starlight Buckle
  const hatGroup = new THREE.Group();
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.72, 1.45, 24), midnightViolet);
  cone.position.set(0, 0.85, 0.1);
  cone.rotation.z = -0.15;
  hatGroup.add(cone);

  const brim = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, 0.05, 32), starryGold);
  brim.rotation.x = Math.PI / 2;
  brim.position.set(0, 0.35, 0.12);
  hatGroup.add(brim);

  const hatStar = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 12), cyanGlint);
  hatStar.position.set(0.18, 1.45, 0.16);
  hatGroup.add(hatStar);
  badge.add(hatGroup);

  // Round Spectacles & Face
  const faceGroup = new THREE.Group();
  const face = new THREE.Mesh(new THREE.SphereGeometry(0.68, 24, 24), faceMat);
  face.scale.set(1.0, 0.9, 0.35);
  face.position.set(0, -0.15, 0.08);
  faceGroup.add(face);

  for (let side of [-1, 1]) {
    const glasses = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.035, 10, 24), starryGold);
    glasses.position.set(side * 0.28, -0.05, 0.18);
    faceGroup.add(glasses);
  }
  const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.03, 0.02), starryGold);
  bridge.position.set(0, -0.05, 0.18);
  faceGroup.add(bridge);

  // Magic Wand with Star Gem
  const wand = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.045, 1.35, 16), starryGold);
  wand.rotation.z = Math.PI * 0.35;
  wand.position.set(0.75, -0.45, 0.14);
  faceGroup.add(wand);
  badge.add(faceGroup);

  badge.setExplodedView = (f: number) => {
    baseMesh.position.z = -f * 0.25;
    hatGroup.position.z = 0.1 + f * 0.75;
    faceGroup.position.z = 0.08 + f * 1.1;
  };

  return badge;
}

/**
 * 2. Cosmic Astronaut (星际宇航员 • 金穹头盔)
 */
export function buildCartoonAstronautBadge(
  materials: AppleAwardMaterials,
  earnedDate: string = 'OCTOBER 28, 2026',
  isLocked: boolean = false
): AppleBadgeMeshGroup {
  const mirrorSilver = materials.getMirrorSilverBezel(isLocked);
  const deepCosmos = materials.getColorLacquer(0x050510, isLocked);
  const helmetWhite = materials.getOffWhiteEnamel(isLocked);
  const goldVisor = materials.getMirrorGoldBezel(isLocked); // Mirror Gold Visor
  const cyanLight = materials.getColorLacquer(0x00f0ff, isLocked);
  const backMat = materials.getAppleBackShell(earnedDate, 'COSMIC ASTRONAUT', isLocked);

  const badge = new THREE.Group() as AppleBadgeMeshGroup;

  const baseMesh = new THREE.Mesh(
    createConvexCoinGeometry(1.65, 0.16, 0.08),
    [mirrorSilver, deepCosmos, backMat]
  );
  baseMesh.rotation.x = Math.PI / 2;
  badge.add(baseMesh);

  const rimMesh = new THREE.Mesh(new THREE.TorusGeometry(1.65, 0.08, 16, 64), mirrorSilver);
  badge.add(rimMesh);

  // Astronaut Helmet Unibody
  const suitGroup = new THREE.Group();
  const helmet = new THREE.Mesh(new THREE.SphereGeometry(1.05, 32, 24), helmetWhite);
  helmet.scale.set(1.0, 1.05, 0.45);
  helmet.position.set(0, 0.1, 0.08);
  suitGroup.add(helmet);

  // 24K Curved Mirror Gold Bubble Visor
  const visor = new THREE.Mesh(new THREE.SphereGeometry(0.68, 32, 24), goldVisor);
  visor.scale.set(1.15, 0.75, 0.55);
  visor.position.set(0, 0.15, 0.22);
  suitGroup.add(visor);

  // Visor Chamfer Frame
  const visorFrame = new THREE.Mesh(new THREE.TorusGeometry(0.65, 0.045, 12, 32), mirrorSilver);
  visorFrame.scale.set(1.15, 0.75, 1);
  visorFrame.position.set(0, 0.15, 0.22);
  suitGroup.add(visorFrame);

  // Side Comm Earpads
  for (let side of [-1, 1]) {
    const earpad = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.1, 24), cyanLight);
    earpad.rotation.z = Math.PI / 2;
    earpad.position.set(side * 1.08, 0.1, 0.1);
    suitGroup.add(earpad);
  }

  // Chest Life-Support Controls
  const chestPlate = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.45, 0.12), helmetWhite);
  chestPlate.position.set(0, -0.75, 0.12);
  suitGroup.add(chestPlate);
  badge.add(suitGroup);

  badge.setExplodedView = (f: number) => {
    baseMesh.position.z = -f * 0.25;
    suitGroup.position.z = 0.08 + f * 0.95;
  };

  return badge;
}

/**
 * 3. Cyber Mecha Pilot (机甲先锋 • 战术光刃)
 */
export function buildCartoonMechaBadge(
  materials: AppleAwardMaterials,
  earnedDate: string = 'OCTOBER 28, 2026',
  isLocked: boolean = false
): AppleBadgeMeshGroup {
  const spaceGray = materials.getSpaceGrayBezel(isLocked);
  const mechaNavy = materials.getColorLacquer(0x0f172a, isLocked);
  const cyberRed = materials.getColorLacquer(0xfa114f, isLocked);
  const voltArmor = materials.getColorLacquer(0xa6ff00, isLocked);
  const titaniumBezel = materials.getMirrorSilverBezel(isLocked);
  const backMat = materials.getAppleBackShell(earnedDate, 'CYBER MECHA PILOT', isLocked);

  const badge = new THREE.Group() as AppleBadgeMeshGroup;

  const baseMesh = new THREE.Mesh(
    createConvexCoinGeometry(1.65, 0.16, 0.08),
    [spaceGray, mechaNavy, backMat]
  );
  baseMesh.rotation.x = Math.PI / 2;
  badge.add(baseMesh);

  const rimMesh = new THREE.Mesh(new THREE.TorusGeometry(1.65, 0.08, 16, 64), spaceGray);
  badge.add(rimMesh);

  // Angular V-Fin Mecha Antenna (Gundam-inspired V-crest)
  const vFinGroup = new THREE.Group();
  for (let side of [-1, 1]) {
    const blade = new THREE.Mesh(new THREE.ConeGeometry(0.18, 1.35, 4), titaniumBezel);
    blade.rotation.z = side * 0.55;
    blade.position.set(side * 0.65, 0.95, 0.12);
    vFinGroup.add(blade);
  }
  const centralGem = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.24, 0.15), cyberRed);
  centralGem.position.set(0, 0.58, 0.16);
  vFinGroup.add(centralGem);
  badge.add(vFinGroup);

  // Chiseled Face Armor Plates
  const headGroup = new THREE.Group();
  const faceShield = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.85, 0.18), voltArmor);
  faceShield.rotation.z = Math.PI * 0.25;
  faceShield.position.set(0, -0.05, 0.1);
  headGroup.add(faceShield);

  // Horizontal Visor Sensor Slit (Cyan Glow)
  const sensor = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.14, 0.08), materials.getColorLacquer(0x00f0ff, isLocked));
  sensor.position.set(0, 0.05, 0.2);
  headGroup.add(sensor);

  // Chin Guard
  const chin = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.45, 4), spaceGray);
  chin.rotation.z = Math.PI;
  chin.position.set(0, -0.55, 0.15);
  headGroup.add(chin);
  badge.add(headGroup);

  badge.setExplodedView = (f: number) => {
    baseMesh.position.z = -f * 0.25;
    vFinGroup.position.z = 0.12 + f * 0.75;
    headGroup.position.z = 0.1 + f * 1.05;
  };

  return badge;
}

/**
 * 4. Heroic Little Knight (圣辉小骑士 • 圣翎金盔)
 */
export function buildCartoonKnightBadge(
  materials: AppleAwardMaterials,
  earnedDate: string = 'OCTOBER 28, 2026',
  isLocked: boolean = false
): AppleBadgeMeshGroup {
  const mirrorGold = materials.getMirrorGoldBezel(isLocked);
  const royalBlue = materials.getColorLacquer(0x1d3557, isLocked);
  const silverArmor = materials.getMirrorSilverBezel(isLocked);
  const crimsonPlume = materials.getColorLacquer(0xfa114f, isLocked);
  const backMat = materials.getAppleBackShell(earnedDate, 'VALIANT KNIGHT', isLocked);

  const badge = new THREE.Group() as AppleBadgeMeshGroup;

  const baseMesh = new THREE.Mesh(
    createConvexCoinGeometry(1.65, 0.16, 0.08),
    [mirrorGold, royalBlue, backMat]
  );
  baseMesh.rotation.x = Math.PI / 2;
  badge.add(baseMesh);

  const rimMesh = new THREE.Mesh(new THREE.TorusGeometry(1.65, 0.08, 16, 64), mirrorGold);
  badge.add(rimMesh);

  // Majestic Crimson Helmet Plume
  const plumeGroup = new THREE.Group();
  const plume = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.18, 12, 32, Math.PI * 0.65), crimsonPlume);
  plume.rotation.z = Math.PI * 0.4;
  plume.position.set(-0.25, 0.85, 0.12);
  plumeGroup.add(plume);
  badge.add(plumeGroup);

  // Silver Knight Helmet & Visor
  const helmetGroup = new THREE.Group();
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.95, 32, 24), silverArmor);
  skull.scale.set(0.9, 1.05, 0.45);
  skull.position.set(0, 0.05, 0.1);
  helmetGroup.add(skull);

  // Golden Visor Grille
  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.32, 0.15), mirrorGold);
  visor.position.set(0, 0.05, 0.22);
  helmetGroup.add(visor);

  for (let s = -3; s <= 3; s++) {
    const slot = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.18, 0.02), royalBlue);
    slot.position.set(s * 0.12, 0.05, 0.3);
    helmetGroup.add(slot);
  }

  // Cross Emblem on Brow
  const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.35, 0.04), mirrorGold);
  crossV.position.set(0, 0.48, 0.2);
  const crossH = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.08, 0.04), mirrorGold);
  crossH.position.set(0, 0.52, 0.2);
  helmetGroup.add(crossV, crossH);
  badge.add(helmetGroup);

  badge.setExplodedView = (f: number) => {
    baseMesh.position.z = -f * 0.25;
    plumeGroup.position.z = 0.12 + f * 0.65;
    helmetGroup.position.z = 0.1 + f * 1.05;
  };

  return badge;
}

/**
 * 5. Asteroid Prince (星屑小王子 • 金冠与绿纱)
 */
export function buildCartoonPrinceBadge(
  materials: AppleAwardMaterials,
  earnedDate: string = 'OCTOBER 28, 2026',
  isLocked: boolean = false
): AppleBadgeMeshGroup {
  const mirrorGold = materials.getMirrorGoldBezel(isLocked);
  const starNavy = materials.getColorLacquer(0x0f2027, isLocked);
  const goldHair = materials.getMirrorGoldBezel(isLocked);
  const scarfEmerald = materials.getColorLacquer(0x2ec4b6, isLocked);
  const roseRed = materials.getColorLacquer(0xff0054, isLocked);
  const faceMat = materials.getOffWhiteEnamel(isLocked);
  const backMat = materials.getAppleBackShell(earnedDate, 'THE LITTLE PRINCE', isLocked);

  const badge = new THREE.Group() as AppleBadgeMeshGroup;

  const baseMesh = new THREE.Mesh(
    createConvexCoinGeometry(1.65, 0.16, 0.08),
    [mirrorGold, starNavy, backMat]
  );
  baseMesh.rotation.x = Math.PI / 2;
  badge.add(baseMesh);

  const rimMesh = new THREE.Mesh(new THREE.TorusGeometry(1.65, 0.08, 16, 64), mirrorGold);
  badge.add(rimMesh);

  // Tousled Golden Hair Tufts
  const hairGroup = new THREE.Group();
  for (let h = -2; h <= 2; h++) {
    const tuft = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.65, 4), goldHair);
    tuft.rotation.z = h * 0.28;
    tuft.position.set(h * 0.32, 0.75 + Math.abs(h) * 0.08, 0.12);
    hairGroup.add(tuft);
  }
  badge.add(hairGroup);

  // Prince Face
  const faceGroup = new THREE.Group();
  const face = new THREE.Mesh(new THREE.SphereGeometry(0.68, 24, 24), faceMat);
  face.scale.set(0.95, 0.95, 0.35);
  face.position.set(0, 0.15, 0.09);
  faceGroup.add(face);

  // Gentle eyes
  for (let side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.065, 12, 12), materials.getColorLacquer(0x18181b, isLocked));
    eye.position.set(side * 0.28, 0.18, 0.18);
    faceGroup.add(eye);
  }
  badge.add(faceGroup);

  // Flowing Emerald Scarf Trailing
  const scarfGroup = new THREE.Group();
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.12, 12, 32, Math.PI * 0.8), scarfEmerald);
  collar.rotation.z = Math.PI * 1.1;
  collar.position.set(0, -0.32, 0.14);
  scarfGroup.add(collar);

  const tailScarf = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.08, 10, 32, Math.PI * 0.65), scarfEmerald);
  tailScarf.rotation.z = Math.PI * 0.25;
  tailScarf.position.set(0.65, -0.65, 0.12);
  scarfGroup.add(tailScarf);

  // The Asteroid Rose Gem
  const rose = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 16), roseRed);
  rose.position.set(-0.65, -0.75, 0.16);
  scarfGroup.add(rose);
  badge.add(scarfGroup);

  badge.setExplodedView = (f: number) => {
    baseMesh.position.z = -f * 0.25;
    hairGroup.position.z = 0.12 + f * 0.65;
    faceGroup.position.z = 0.09 + f * 0.95;
    scarfGroup.position.z = 0.14 + f * 1.25;
  };

  return badge;
}

/**
 * 6. Pirate Captain (航海海盗船长 • 逐浪双角帽)
 */
export function buildCartoonPirateBadge(
  materials: AppleAwardMaterials,
  earnedDate: string = 'OCTOBER 28, 2026',
  isLocked: boolean = false
): AppleBadgeMeshGroup {
  const mirrorGold = materials.getMirrorGoldBezel(isLocked);
  const oceanTeal = materials.getColorLacquer(0x0077b6, isLocked);
  const tricornBlack = materials.getColorLacquer(0x18181b, isLocked);
  const goldTrim = materials.getMirrorGoldBezel(isLocked);
  const rubyRed = materials.getColorLacquer(0xfa114f, isLocked);
  const faceMat = materials.getOffWhiteEnamel(isLocked);
  const backMat = materials.getAppleBackShell(earnedDate, 'PIRATE CAPTAIN', isLocked);

  const badge = new THREE.Group() as AppleBadgeMeshGroup;

  const baseMesh = new THREE.Mesh(
    createConvexCoinGeometry(1.65, 0.16, 0.08),
    [mirrorGold, oceanTeal, backMat]
  );
  baseMesh.rotation.x = Math.PI / 2;
  badge.add(baseMesh);

  const rimMesh = new THREE.Mesh(new THREE.TorusGeometry(1.65, 0.08, 16, 64), mirrorGold);
  badge.add(rimMesh);

  // Sweeping Tricorn Captain Hat
  const hatGroup = new THREE.Group();
  const hatBase = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.35, 0.06, 3), tricornBlack);
  hatBase.rotation.x = Math.PI / 2;
  hatBase.rotation.z = Math.PI / 6;
  hatBase.position.set(0, 0.65, 0.1);
  hatGroup.add(hatBase);

  // Gold Braid Brim
  const hatTrim = new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.045, 8, 32), goldTrim);
  hatTrim.position.set(0, 0.65, 0.14);
  hatGroup.add(hatTrim);

  // Jolly Roger Golden Skull Medallion
  const skullBadge = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 16), goldTrim);
  skullBadge.scale.set(1, 1.15, 0.5);
  skullBadge.position.set(0, 0.72, 0.18);
  hatGroup.add(skullBadge);
  badge.add(hatGroup);

  // Face with Eye-Patch
  const faceGroup = new THREE.Group();
  const face = new THREE.Mesh(new THREE.SphereGeometry(0.68, 24, 24), faceMat);
  face.scale.set(0.95, 0.95, 0.35);
  face.position.set(0, -0.05, 0.08);
  faceGroup.add(face);

  // Leather Eye Patch
  const eyePatch = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 16), tricornBlack);
  eyePatch.scale.set(1, 1, 0.4);
  eyePatch.position.set(-0.28, 0.05, 0.18);
  faceGroup.add(eyePatch);

  const strap = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.035, 0.02), tricornBlack);
  strap.rotation.z = 0.35;
  strap.position.set(0, 0.12, 0.17);
  faceGroup.add(strap);

  // Starboard Eye & Gold Earring
  const eye = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 12), materials.getColorLacquer(0x18181b, isLocked));
  eye.position.set(0.28, 0.05, 0.16);
  faceGroup.add(eye);

  const earring = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.03, 8, 16), goldTrim);
  earring.position.set(0.72, -0.08, 0.12);
  faceGroup.add(earring);
  badge.add(faceGroup);

  badge.setExplodedView = (f: number) => {
    baseMesh.position.z = -f * 0.25;
    hatGroup.position.z = 0.1 + f * 0.75;
    faceGroup.position.z = 0.08 + f * 1.05;
  };

  return badge;
}

/**
 * 7. Pixel Hero (复古像素勇者 • 8-Bit 像素圣剑)
 */
export function buildCartoonPixelHeroBadge(
  materials: AppleAwardMaterials,
  earnedDate: string = 'OCTOBER 28, 2026',
  isLocked: boolean = false
): AppleBadgeMeshGroup {
  const mirrorGold = materials.getMirrorGoldBezel(isLocked);
  const pixelEmerald = materials.getColorLacquer(0x38b000, isLocked);
  const goldPixel = materials.getMirrorGoldBezel(isLocked);
  const swordCyan = materials.getColorLacquer(0x00f0ff, isLocked);
  const faceMat = materials.getOffWhiteEnamel(isLocked);
  const backMat = materials.getAppleBackShell(earnedDate, '8-BIT PIXEL HERO', isLocked);

  const badge = new THREE.Group() as AppleBadgeMeshGroup;

  const baseMesh = new THREE.Mesh(
    createConvexCoinGeometry(1.65, 0.16, 0.08),
    [mirrorGold, pixelEmerald, backMat]
  );
  baseMesh.rotation.x = Math.PI / 2;
  badge.add(baseMesh);

  const rimMesh = new THREE.Mesh(new THREE.TorusGeometry(1.65, 0.08, 16, 64), mirrorGold);
  badge.add(rimMesh);

  // Stepped Pixelated Helmet Crown
  const pixelGroup = new THREE.Group();
  for (let r = 0; r < 5; r++) {
    const w = 1.35 - r * 0.24;
    const block = new THREE.Mesh(new THREE.BoxGeometry(w, 0.18, 0.12), goldPixel);
    block.position.set(0, 0.35 + r * 0.2, 0.12);
    pixelGroup.add(block);
  }
  badge.add(pixelGroup);

  // Pixel Face Grid
  const faceGroup = new THREE.Group();
  const faceBlock = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.75, 0.12), faceMat);
  faceBlock.position.set(0, -0.15, 0.1);
  faceGroup.add(faceBlock);

  // Square Pixel Eyes
  for (let side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.05), materials.getColorLacquer(0x18181b, isLocked));
    eye.position.set(side * 0.32, -0.1, 0.18);
    faceGroup.add(eye);
  }

  // 8-Bit Master Sword (Stepped Diagonal Voxel Blade)
  const swordGroup = new THREE.Group();
  for (let s = 0; s < 6; s++) {
    const voxel = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.08), swordCyan);
    voxel.position.set(0.35 + s * 0.12, -0.75 + s * 0.14, 0.18);
    swordGroup.add(voxel);
  }
  badge.add(swordGroup);
  badge.add(faceGroup);

  badge.setExplodedView = (f: number) => {
    baseMesh.position.z = -f * 0.25;
    pixelGroup.position.z = 0.12 + f * 0.65;
    faceGroup.position.z = 0.1 + f * 0.95;
    swordGroup.position.z = 0.18 + f * 1.25;
  };

  return badge;
}

/**
 * 8. Steampunk Aviator (蒸汽朋克飞行员 • 黄铜双目护目镜)
 */
export function buildCartoonAviatorBadge(
  materials: AppleAwardMaterials,
  earnedDate: string = 'OCTOBER 28, 2026',
  isLocked: boolean = false
): AppleBadgeMeshGroup {
  const mirrorGold = materials.getMirrorGoldBezel(isLocked);
  const sepiaBrown = materials.getColorLacquer(0x5c4033, isLocked);
  const brassMat = materials.getColorLacquer(0xd4af37, isLocked);
  const cyanLens = materials.getColorLacquer(0x00f0ff, isLocked); // Glass Lens Glint
  const leatherCap = materials.getColorLacquer(0x8b4513, isLocked);
  const backMat = materials.getAppleBackShell(earnedDate, 'STEAMPUNK AVIATOR', isLocked);

  const badge = new THREE.Group() as AppleBadgeMeshGroup;

  const baseMesh = new THREE.Mesh(
    createConvexCoinGeometry(1.65, 0.16, 0.08),
    [mirrorGold, sepiaBrown, backMat]
  );
  baseMesh.rotation.x = Math.PI / 2;
  badge.add(baseMesh);

  const rimMesh = new THREE.Mesh(new THREE.TorusGeometry(1.65, 0.08, 16, 64), mirrorGold);
  badge.add(rimMesh);

  // Aviator Leather Flight Helmet
  const helmetGroup = new THREE.Group();
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.95, 32, 24), leatherCap);
  cap.scale.set(0.95, 1.05, 0.4);
  cap.position.set(0, 0.1, 0.08);
  helmetGroup.add(cap);

  // Ear Flaps
  for (let side of [-1, 1]) {
    const flap = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.75, 0.08), leatherCap);
    flap.position.set(side * 0.85, -0.25, 0.1);
    helmetGroup.add(flap);
  }
  badge.add(helmetGroup);

  // Geared Brass Dual-Ocular Goggles (Steampunk Glasses)
  const goggleGroup = new THREE.Group();
  for (let side of [-1, 1]) {
    // Outer Gear Cog
    const gearRing = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.065, 12, 24), brassMat);
    gearRing.position.set(side * 0.45, 0.22, 0.22);
    goggleGroup.add(gearRing);

    // Reflective Cyan Glass Lens
    const lens = new THREE.Mesh(new THREE.CircleGeometry(0.32, 24), cyanLens);
    lens.position.set(side * 0.45, 0.22, 0.24);
    goggleGroup.add(lens);
  }
  const strapBridge = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.08, 0.04), brassMat);
  strapBridge.position.set(0, 0.22, 0.24);
  goggleGroup.add(strapBridge);

  // Winged Propeller Badge at base
  const propHub = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 16), brassMat);
  propHub.position.set(0, -0.85, 0.16);
  goggleGroup.add(propHub);
  for (let side of [-1, 1]) {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.14, 0.03), mirrorGold);
    blade.position.set(side * 0.42, -0.85, 0.16);
    goggleGroup.add(blade);
  }
  badge.add(goggleGroup);

  badge.setExplodedView = (f: number) => {
    baseMesh.position.z = -f * 0.25;
    helmetGroup.position.z = 0.08 + f * 0.65;
    goggleGroup.position.z = 0.22 + f * 1.15;
  };

  return badge;
}

/**
 * 9. Forest Elf / Archer Sprite (森林精灵 • 苍翠叶冠与灵耳)
 */
export function buildCartoonElfBadge(
  materials: AppleAwardMaterials,
  earnedDate: string = 'OCTOBER 28, 2026',
  isLocked: boolean = false
): AppleBadgeMeshGroup {
  const mirrorGold = materials.getMirrorGoldBezel(isLocked);
  const forestEmerald = materials.getColorLacquer(0x2d6a4f, isLocked);
  const leafGreen = materials.getColorLacquer(0x52b788, isLocked);
  const faceMat = materials.getOffWhiteEnamel(isLocked);
  const goldCrown = materials.getMirrorGoldBezel(isLocked);
  const gemTeardrop = materials.getColorLacquer(0x00f0ff, isLocked);
  const backMat = materials.getAppleBackShell(earnedDate, 'FOREST ARCHER ELF', isLocked);

  const badge = new THREE.Group() as AppleBadgeMeshGroup;

  const baseMesh = new THREE.Mesh(
    createConvexCoinGeometry(1.65, 0.16, 0.08),
    [mirrorGold, forestEmerald, backMat]
  );
  baseMesh.rotation.x = Math.PI / 2;
  badge.add(baseMesh);

  const rimMesh = new THREE.Mesh(new THREE.TorusGeometry(1.65, 0.08, 16, 64), mirrorGold);
  badge.add(rimMesh);

  // Pointed Long Elven Ears
  const earsGroup = new THREE.Group();
  for (let side of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.32, 1.15, 4), faceMat);
    ear.rotation.z = side * 0.65;
    ear.position.set(side * 1.05, 0.25, 0.08);
    earsGroup.add(ear);
  }
  badge.add(earsGroup);

  // Golden Laurel & Emerald Leaf Crown
  const crownGroup = new THREE.Group();
  for (let l = 0; l < 7; l++) {
    const angle = (l / 6) * Math.PI * 0.9 + Math.PI * 0.05;
    const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.55, 4), l % 2 === 0 ? goldCrown : leafGreen);
    leaf.rotation.z = -angle + Math.PI / 2;
    leaf.position.set(Math.cos(angle) * 0.82, 0.45 + Math.sin(angle) * 0.35, 0.14);
    crownGroup.add(leaf);
  }
  // Central Forehead Teardrop Crystal
  const crystal = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.32, 12), gemTeardrop);
  crystal.rotation.z = Math.PI;
  crystal.position.set(0, 0.52, 0.22);
  crownGroup.add(crystal);
  badge.add(crownGroup);

  // Serene Face
  const faceGroup = new THREE.Group();
  const face = new THREE.Mesh(new THREE.SphereGeometry(0.68, 24, 24), faceMat);
  face.scale.set(0.85, 1.05, 0.35);
  face.position.set(0, 0.05, 0.1);
  faceGroup.add(face);

  for (let side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 12), forestEmerald);
    eye.position.set(side * 0.26, 0.12, 0.18);
    faceGroup.add(eye);
  }
  badge.add(faceGroup);

  badge.setExplodedView = (f: number) => {
    baseMesh.position.z = -f * 0.25;
    earsGroup.position.z = 0.08 + f * 0.55;
    faceGroup.position.z = 0.1 + f * 0.85;
    crownGroup.position.z = 0.14 + f * 1.2;
  };

  return badge;
}

/**
 * 10. Shadow Ninja (暗夜小忍者 • 疾风面罩与飞镖)
 */
export function buildCartoonNinjaBadge(
  materials: AppleAwardMaterials,
  earnedDate: string = 'OCTOBER 28, 2026',
  isLocked: boolean = false
): AppleBadgeMeshGroup {
  const spaceGray = materials.getSpaceGrayBezel(isLocked);
  const midnightCharcoal = materials.getColorLacquer(0x18181b, isLocked);
  const crimsonBand = materials.getColorLacquer(0xfa114f, isLocked);
  const steelShuriken = materials.getMirrorSilverBezel(isLocked);
  const goldPlate = materials.getMirrorGoldBezel(isLocked);
  const eyeGlint = materials.getColorLacquer(0xffffff, isLocked);
  const backMat = materials.getAppleBackShell(earnedDate, 'SHADOW NINJA', isLocked);

  const badge = new THREE.Group() as AppleBadgeMeshGroup;

  const baseMesh = new THREE.Mesh(
    createConvexCoinGeometry(1.65, 0.16, 0.08),
    [spaceGray, midnightCharcoal, backMat]
  );
  baseMesh.rotation.x = Math.PI / 2;
  badge.add(baseMesh);

  const rimMesh = new THREE.Mesh(new THREE.TorusGeometry(1.65, 0.08, 16, 64), spaceGray);
  badge.add(rimMesh);

  // Ninja Hood & Cloth Face Mask
  const headGroup = new THREE.Group();
  const hood = new THREE.Mesh(new THREE.SphereGeometry(0.95, 32, 24), midnightCharcoal);
  hood.scale.set(0.95, 1.05, 0.4);
  hood.position.set(0, 0.05, 0.08);
  headGroup.add(hood);

  // Crimson Headband & Engraved Metal Forehead Plate
  const band = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.28, 0.12), crimsonBand);
  band.position.set(0, 0.45, 0.18);
  headGroup.add(band);

  const clanPlate = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.22, 0.06), goldPlate);
  clanPlate.position.set(0, 0.45, 0.25);
  headGroup.add(clanPlate);

  // Eye Slit Opening with Piercing Gaze
  const eyeSlit = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.22, 0.06), materials.getOffWhiteEnamel(isLocked));
  eyeSlit.position.set(0, 0.12, 0.18);
  headGroup.add(eyeSlit);

  for (let side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.06, 0.04), midnightCharcoal);
    eye.position.set(side * 0.26, 0.12, 0.22);
    headGroup.add(eye);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), eyeGlint);
    pupil.position.set(side * 0.26, 0.12, 0.24);
    headGroup.add(pupil);
  }
  badge.add(headGroup);

  // 4-Pointed Throwing Shuriken Star
  const shurikenGroup = new THREE.Group();
  for (let b = 0; b < 2; b++) {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.22, 0.05), steelShuriken);
    blade.rotation.z = b * Math.PI * 0.5;
    blade.position.set(0, -0.75, 0.18);
    shurikenGroup.add(blade);
  }
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.08, 16), goldPlate);
  hub.rotation.x = Math.PI / 2;
  hub.position.set(0, -0.75, 0.21);
  shurikenGroup.add(hub);
  badge.add(shurikenGroup);

  badge.setExplodedView = (f: number) => {
    baseMesh.position.z = -f * 0.25;
    headGroup.position.z = 0.08 + f * 0.85;
    shurikenGroup.position.z = 0.18 + f * 1.25;
  };

  return badge;
}
