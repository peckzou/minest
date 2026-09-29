import * as THREE from 'three';
import { AppleAwardMaterials } from './materials';
import { AppleBadgeMeshGroup, createConvexCoinGeometry } from './BadgeGeometry';

// ============================================================================
// 10 CUTE ANIMALS (可爱动物系列)
// ============================================================================

/**
 * 1. Cute Panda (大熊猫 • 禅竹大师)
 */
export function buildCutePandaBadge(
  materials: AppleAwardMaterials,
  earnedDate: string = 'OCTOBER 28, 2026',
  isLocked: boolean = false
): AppleBadgeMeshGroup {
  const mirrorSilver = materials.getMirrorSilverBezel(isLocked);
  const whiteCeramic = materials.getOffWhiteEnamel(isLocked);
  const blackLacquer = materials.getColorLacquer(0x18181b, isLocked);
  const voltBamboo = materials.getColorLacquer(0xa6ff00, isLocked);
  const goldBezel = materials.getMirrorGoldBezel(isLocked);
  const backMat = materials.getAppleBackShell(earnedDate, 'ZEN BAMBOO PANDA', isLocked);

  const badge = new THREE.Group() as AppleBadgeMeshGroup;

  // Base Medallion
  const baseMesh = new THREE.Mesh(
    createConvexCoinGeometry(1.65, 0.16, 0.08),
    [mirrorSilver, whiteCeramic, backMat]
  );
  baseMesh.rotation.x = Math.PI / 2;
  badge.add(baseMesh);

  // Outer Silver Rim
  const rimMesh = new THREE.Mesh(new THREE.TorusGeometry(1.65, 0.08, 16, 64), mirrorSilver);
  badge.add(rimMesh);

  // Cute Black Panda Ears
  const earsGroup = new THREE.Group();
  for (let side of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.08, 32), blackLacquer);
    ear.rotation.x = Math.PI / 2;
    ear.position.set(side * 0.95, 1.15, 0.04);
    earsGroup.add(ear);
  }
  badge.add(earsGroup);

  // Iconic Angled Teardrop Eye Patches
  const eyesGroup = new THREE.Group();
  for (let side of [-1, 1]) {
    const patch = new THREE.Mesh(new THREE.SphereGeometry(0.28, 24, 16), blackLacquer);
    patch.scale.set(0.85, 1.25, 0.22);
    patch.rotation.z = side * 0.38;
    patch.position.set(side * 0.52, 0.22, 0.09);
    eyesGroup.add(patch);

    // Cute white glint eye sparkles
    const glint = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 12), whiteCeramic);
    glint.position.set(side * 0.48, 0.28, 0.14);
    eyesGroup.add(glint);
  }
  badge.add(eyesGroup);

  // Snout & Button Nose
  const snoutGroup = new THREE.Group();
  const muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.35, 24, 16), whiteCeramic);
  muzzle.scale.set(1.1, 0.75, 0.35);
  muzzle.position.set(0, -0.22, 0.1);
  snoutGroup.add(muzzle);

  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.18, 16), blackLacquer);
  nose.rotation.z = Math.PI;
  nose.position.set(0, -0.16, 0.17);
  snoutGroup.add(nose);

  const smile = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.025, 8, 24, Math.PI), blackLacquer);
  smile.rotation.z = Math.PI;
  smile.position.set(0, -0.28, 0.16);
  snoutGroup.add(smile);
  badge.add(snoutGroup);

  // Golden Bamboo Stalk
  const bambooGroup = new THREE.Group();
  for (let b = 0; b < 3; b++) {
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.45, 16), voltBamboo);
    stem.position.set(1.05, -0.65 + b * 0.42, 0.09);
    stem.rotation.z = -0.15;
    bambooGroup.add(stem);

    const joint = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.02, 8, 16), goldBezel);
    joint.position.set(1.05 + b * 0.06, -0.44 + b * 0.42, 0.09);
    joint.rotation.x = Math.PI / 2;
    bambooGroup.add(joint);
  }
  badge.add(bambooGroup);

  badge.setExplodedView = (f: number) => {
    baseMesh.position.z = -f * 0.25;
    earsGroup.position.z = f * 0.45;
    eyesGroup.position.z = 0.09 + f * 0.75;
    snoutGroup.position.z = 0.1 + f * 0.95;
    bambooGroup.position.z = 0.09 + f * 0.65;
  };

  return badge;
}

/**
 * 2. Cute Shiba Inu (柴犬 • 忠诚小柴)
 */
export function buildCuteShibaBadge(
  materials: AppleAwardMaterials,
  earnedDate: string = 'OCTOBER 28, 2026',
  isLocked: boolean = false
): AppleBadgeMeshGroup {
  const mirrorGold = materials.getMirrorGoldBezel(isLocked);
  const shibaAmber = materials.getColorLacquer(0xf5a623, isLocked);
  const whiteCeramic = materials.getOffWhiteEnamel(isLocked);
  const darkLacquer = materials.getColorLacquer(0x222224, isLocked);
  const redCollar = materials.getColorLacquer(0xfa114f, isLocked);
  const backMat = materials.getAppleBackShell(earnedDate, 'LOYAL SHIBA INU', isLocked);

  const badge = new THREE.Group() as AppleBadgeMeshGroup;

  const baseMesh = new THREE.Mesh(
    createConvexCoinGeometry(1.65, 0.16, 0.08),
    [mirrorGold, shibaAmber, backMat]
  );
  baseMesh.rotation.x = Math.PI / 2;
  badge.add(baseMesh);

  const rimMesh = new THREE.Mesh(new THREE.TorusGeometry(1.65, 0.08, 16, 64), mirrorGold);
  badge.add(rimMesh);

  // Perky Triangular Ears
  const earsGroup = new THREE.Group();
  for (let side of [-1, 1]) {
    const earOuter = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.75, 4), shibaAmber);
    earOuter.rotation.z = side * 0.35;
    earOuter.position.set(side * 0.88, 1.15, 0.06);
    earsGroup.add(earOuter);

    const earInner = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.52, 4), whiteCeramic);
    earInner.rotation.z = side * 0.35;
    earInner.position.set(side * 0.88, 1.12, 0.11);
    earsGroup.add(earInner);
  }
  badge.add(earsGroup);

  // White Cheeks & Muzzle Mask
  const muzzleGroup = new THREE.Group();
  const cheekL = new THREE.Mesh(new THREE.SphereGeometry(0.48, 24, 16), whiteCeramic);
  cheekL.scale.set(1.0, 0.8, 0.3);
  cheekL.position.set(-0.38, -0.15, 0.08);
  const cheekR = new THREE.Mesh(new THREE.SphereGeometry(0.48, 24, 16), whiteCeramic);
  cheekR.scale.set(1.0, 0.8, 0.3);
  cheekR.position.set(0.38, -0.15, 0.08);
  muzzleGroup.add(cheekL, cheekR);

  // Nose & Eyes
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.22, 16), darkLacquer);
  nose.rotation.z = Math.PI;
  nose.position.set(0, -0.05, 0.17);
  muzzleGroup.add(nose);

  for (let side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 16), darkLacquer);
    eye.position.set(side * 0.45, 0.26, 0.1);
    muzzleGroup.add(eye);
    // White eyebrow dots
    const brow = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 12), whiteCeramic);
    brow.position.set(side * 0.42, 0.55, 0.08);
    muzzleGroup.add(brow);
  }
  badge.add(muzzleGroup);

  // Red Collar & Gold Bell
  const collarGroup = new THREE.Group();
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.055, 12, 32, Math.PI * 0.7), redCollar);
  collar.rotation.z = Math.PI * 1.15;
  collar.position.set(0, -0.85, 0.1);
  collarGroup.add(collar);

  const bell = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), mirrorGold);
  bell.position.set(0, -1.15, 0.14);
  collarGroup.add(bell);
  badge.add(collarGroup);

  badge.setExplodedView = (f: number) => {
    baseMesh.position.z = -f * 0.25;
    earsGroup.position.z = f * 0.55;
    muzzleGroup.position.z = 0.08 + f * 0.85;
    collarGroup.position.z = 0.1 + f * 1.1;
  };

  return badge;
}

/**
 * 3. Cute Red Panda (小熊猫 • 枫林灵猫)
 */
export function buildCuteRedPandaBadge(
  materials: AppleAwardMaterials,
  earnedDate: string = 'OCTOBER 28, 2026',
  isLocked: boolean = false
): AppleBadgeMeshGroup {
  const mirrorGold = materials.getMirrorGoldBezel(isLocked);
  const auburnMat = materials.getColorLacquer(0xd35400, isLocked); // Cinnamon Auburn
  const whiteMat = materials.getOffWhiteEnamel(isLocked);
  const darkMat = materials.getColorLacquer(0x212121, isLocked);
  const backMat = materials.getAppleBackShell(earnedDate, 'CURIOUS RED PANDA', isLocked);

  const badge = new THREE.Group() as AppleBadgeMeshGroup;

  const baseMesh = new THREE.Mesh(
    createConvexCoinGeometry(1.65, 0.16, 0.08),
    [mirrorGold, auburnMat, backMat]
  );
  baseMesh.rotation.x = Math.PI / 2;
  badge.add(baseMesh);

  const rimMesh = new THREE.Mesh(new THREE.TorusGeometry(1.65, 0.08, 16, 64), mirrorGold);
  badge.add(rimMesh);

  // Large White Fluffy Ears
  const earsGroup = new THREE.Group();
  for (let side of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.44, 0.68, 16), whiteMat);
    ear.rotation.z = side * 0.42;
    ear.position.set(side * 0.98, 1.08, 0.05);
    earsGroup.add(ear);
  }
  badge.add(earsGroup);

  // White Cheeks & Tear Marks
  const faceGroup = new THREE.Group();
  for (let side of [-1, 1]) {
    const cheek = new THREE.Mesh(new THREE.SphereGeometry(0.42, 20, 16), whiteMat);
    cheek.scale.set(0.9, 0.7, 0.28);
    cheek.position.set(side * 0.52, -0.15, 0.08);
    faceGroup.add(cheek);

    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 16), darkMat);
    eye.position.set(side * 0.38, 0.22, 0.1);
    faceGroup.add(eye);
  }

  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), darkMat);
  nose.position.set(0, -0.06, 0.15);
  faceGroup.add(nose);
  badge.add(faceGroup);

  // Striped Ringed Tail sweeping bottom
  const tailGroup = new THREE.Group();
  for (let r = 0; r < 5; r++) {
    const segMat = r % 2 === 0 ? auburnMat : mirrorGold;
    const tailSeg = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.07, 12, 24, Math.PI * 0.18), segMat);
    tailSeg.rotation.z = Math.PI * 0.95 + r * 0.22;
    tailSeg.position.set(0, -0.4, 0.08 + r * 0.015);
    tailGroup.add(tailSeg);
  }
  badge.add(tailGroup);

  badge.setExplodedView = (f: number) => {
    baseMesh.position.z = -f * 0.25;
    earsGroup.position.z = f * 0.5;
    faceGroup.position.z = 0.08 + f * 0.85;
    tailGroup.position.z = 0.08 + f * 1.15;
  };

  return badge;
}

/**
 * 4. Cute Koala (考拉 • 桉树恬静)
 */
export function buildCuteKoalaBadge(
  materials: AppleAwardMaterials,
  earnedDate: string = 'OCTOBER 28, 2026',
  isLocked: boolean = false
): AppleBadgeMeshGroup {
  const mirrorSilver = materials.getMirrorSilverBezel(isLocked);
  const sageMat = materials.getColorLacquer(0x52b788, isLocked); // Eucalyptus Sage
  const slateMat = materials.getColorLacquer(0x95a5a6, isLocked); // Slate Gray
  const whiteMat = materials.getOffWhiteEnamel(isLocked);
  const blackNoseMat = materials.getColorLacquer(0x18181b, isLocked);
  const backMat = materials.getAppleBackShell(earnedDate, 'SERENE KOALA', isLocked);

  const badge = new THREE.Group() as AppleBadgeMeshGroup;

  const baseMesh = new THREE.Mesh(
    createConvexCoinGeometry(1.65, 0.16, 0.08),
    [mirrorSilver, sageMat, backMat]
  );
  baseMesh.rotation.x = Math.PI / 2;
  badge.add(baseMesh);

  const rimMesh = new THREE.Mesh(new THREE.TorusGeometry(1.65, 0.08, 16, 64), mirrorSilver);
  badge.add(rimMesh);

  // Big Fuzzy Ears with White Rims
  const earsGroup = new THREE.Group();
  for (let side of [-1, 1]) {
    const earOuter = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.08, 32), slateMat);
    earOuter.rotation.x = Math.PI / 2;
    earOuter.position.set(side * 1.05, 0.72, 0.05);
    earsGroup.add(earOuter);

    const earFluff = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.06, 12, 32), whiteMat);
    earFluff.position.set(side * 1.05, 0.72, 0.09);
    earsGroup.add(earFluff);
  }
  badge.add(earsGroup);

  // Koala Head & Big Oval Button Nose
  const headGroup = new THREE.Group();
  const face = new THREE.Mesh(new THREE.SphereGeometry(0.85, 32, 24), slateMat);
  face.scale.set(1.05, 0.9, 0.32);
  face.position.set(0, 0.05, 0.06);
  headGroup.add(face);

  // Iconic Big Oval Nose
  const bigNose = new THREE.Mesh(new THREE.SphereGeometry(0.38, 24, 24), blackNoseMat);
  bigNose.scale.set(0.65, 1.15, 0.45);
  bigNose.position.set(0, 0.02, 0.18);
  headGroup.add(bigNose);

  // Gentle eyes
  for (let side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 16), blackNoseMat);
    eye.position.set(side * 0.44, 0.28, 0.14);
    headGroup.add(eye);
  }
  badge.add(headGroup);

  badge.setExplodedView = (f: number) => {
    baseMesh.position.z = -f * 0.25;
    earsGroup.position.z = f * 0.55;
    headGroup.position.z = 0.06 + f * 0.95;
  };

  return badge;
}

/**
 * 5. Cute Hamster (金丝熊 • 恒动飞轮)
 */
export function buildCuteHamsterBadge(
  materials: AppleAwardMaterials,
  earnedDate: string = 'OCTOBER 28, 2026',
  isLocked: boolean = false
): AppleBadgeMeshGroup {
  const mirrorGold = materials.getMirrorGoldBezel(isLocked);
  const honeyMat = materials.getColorLacquer(0xf39c12, isLocked);
  const pinkMat = materials.getColorLacquer(0xffa8ba, isLocked);
  const whiteMat = materials.getOffWhiteEnamel(isLocked);
  const darkMat = materials.getColorLacquer(0x212121, isLocked);
  const backMat = materials.getAppleBackShell(earnedDate, 'PERPETUAL HAMSTER', isLocked);

  const badge = new THREE.Group() as AppleBadgeMeshGroup;

  const baseMesh = new THREE.Mesh(
    createConvexCoinGeometry(1.65, 0.16, 0.08),
    [mirrorGold, honeyMat, backMat]
  );
  baseMesh.rotation.x = Math.PI / 2;
  badge.add(baseMesh);

  const rimMesh = new THREE.Mesh(new THREE.TorusGeometry(1.65, 0.08, 16, 64), mirrorGold);
  badge.add(rimMesh);

  // Concentric Golden Exercise Wheel Behind Hamster
  const wheelGroup = new THREE.Group();
  const wheelRim = new THREE.Mesh(new THREE.TorusGeometry(1.22, 0.045, 12, 48), mirrorGold);
  wheelRim.position.z = 0.04;
  wheelGroup.add(wheelRim);
  for (let i = 0; i < 6; i++) {
    const spoke = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.025, 0.015), mirrorGold);
    spoke.rotation.z = (i / 6) * Math.PI;
    spoke.position.z = 0.04;
    wheelGroup.add(spoke);
  }
  badge.add(wheelGroup);

  // Puffy Cheek Pockets
  const cheeksGroup = new THREE.Group();
  for (let side of [-1, 1]) {
    const cheek = new THREE.Mesh(new THREE.SphereGeometry(0.42, 20, 16), whiteMat);
    cheek.scale.set(1.0, 0.9, 0.35);
    cheek.position.set(side * 0.44, -0.15, 0.1);
    cheeksGroup.add(cheek);

    // Tiny pink ears
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 16), pinkMat);
    ear.position.set(side * 0.65, 0.85, 0.07);
    cheeksGroup.add(ear);

    // Beady eyes
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 12), darkMat);
    eye.position.set(side * 0.36, 0.32, 0.14);
    cheeksGroup.add(eye);
  }

  // Tiny button nose
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 12), pinkMat);
  nose.position.set(0, 0.02, 0.18);
  cheeksGroup.add(nose);
  badge.add(cheeksGroup);

  badge.setExplodedView = (f: number) => {
    baseMesh.position.z = -f * 0.25;
    wheelGroup.position.z = 0.04 + f * 0.45;
    cheeksGroup.position.z = 0.1 + f * 0.95;
  };

  return badge;
}

/**
 * 6. Cute Fennec Fox (耳廓狐 • 极夜大耳狐)
 */
export function buildCuteFoxBadge(
  materials: AppleAwardMaterials,
  earnedDate: string = 'OCTOBER 28, 2026',
  isLocked: boolean = false
): AppleBadgeMeshGroup {
  const mirrorGold = materials.getMirrorGoldBezel(isLocked);
  const sandMat = materials.getColorLacquer(0xfad02c, isLocked); // Desert Sand Gold
  const pinkMat = materials.getColorLacquer(0xff85a2, isLocked); // Blush Pink
  const whiteMat = materials.getOffWhiteEnamel(isLocked);
  const darkMat = materials.getColorLacquer(0x18181b, isLocked);
  const backMat = materials.getAppleBackShell(earnedDate, 'AURORA FENNEC FOX', isLocked);

  const badge = new THREE.Group() as AppleBadgeMeshGroup;

  const baseMesh = new THREE.Mesh(
    createConvexCoinGeometry(1.65, 0.16, 0.08),
    [mirrorGold, sandMat, backMat]
  );
  baseMesh.rotation.x = Math.PI / 2;
  badge.add(baseMesh);

  const rimMesh = new THREE.Mesh(new THREE.TorusGeometry(1.65, 0.08, 16, 64), mirrorGold);
  badge.add(rimMesh);

  // Giant Swept Triangular Ears (Key Fennec Fox Feature)
  const earsGroup = new THREE.Group();
  for (let side of [-1, 1]) {
    const earOuter = new THREE.Mesh(new THREE.ConeGeometry(0.65, 1.35, 4), sandMat);
    earOuter.rotation.z = side * 0.48;
    earOuter.position.set(side * 0.98, 0.95, 0.04);
    earsGroup.add(earOuter);

    const earInner = new THREE.Mesh(new THREE.ConeGeometry(0.42, 1.05, 4), pinkMat);
    earInner.rotation.z = side * 0.48;
    earInner.position.set(side * 0.98, 0.92, 0.08);
    earsGroup.add(earInner);
  }
  badge.add(earsGroup);

  // Slender V-shaped Face & Shining Eyes
  const faceGroup = new THREE.Group();
  const muzzle = new THREE.Mesh(new THREE.ConeGeometry(0.45, 0.75, 4), whiteMat);
  muzzle.rotation.z = Math.PI;
  muzzle.position.set(0, -0.25, 0.1);
  faceGroup.add(muzzle);

  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 12), darkMat);
  nose.position.set(0, -0.48, 0.16);
  faceGroup.add(nose);

  for (let side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), darkMat);
    eye.position.set(side * 0.42, 0.15, 0.12);
    faceGroup.add(eye);
  }
  badge.add(faceGroup);

  badge.setExplodedView = (f: number) => {
    baseMesh.position.z = -f * 0.25;
    earsGroup.position.z = f * 0.55;
    faceGroup.position.z = 0.1 + f * 0.95;
  };

  return badge;
}

/**
 * 7. Cute Emperor Penguin (帝企鹅 • 极地破冰萌羽)
 */
export function buildCutePenguinBadge(
  materials: AppleAwardMaterials,
  earnedDate: string = 'OCTOBER 28, 2026',
  isLocked: boolean = false
): AppleBadgeMeshGroup {
  const mirrorSilver = materials.getMirrorSilverBezel(isLocked);
  const cyanIce = materials.getColorLacquer(0x70d7ff, isLocked); // Glacial Ice
  const blackTux = materials.getColorLacquer(0x18181b, isLocked);
  const whiteBelly = materials.getOffWhiteEnamel(isLocked);
  const goldPlumes = materials.getMirrorGoldBezel(isLocked);
  const orangeBeak = materials.getColorLacquer(0xff9500, isLocked);
  const backMat = materials.getAppleBackShell(earnedDate, 'EMPEROR PENGUIN', isLocked);

  const badge = new THREE.Group() as AppleBadgeMeshGroup;

  const baseMesh = new THREE.Mesh(
    createConvexCoinGeometry(1.65, 0.16, 0.08),
    [mirrorSilver, cyanIce, backMat]
  );
  baseMesh.rotation.x = Math.PI / 2;
  badge.add(baseMesh);

  const rimMesh = new THREE.Mesh(new THREE.TorusGeometry(1.65, 0.08, 16, 64), mirrorSilver);
  badge.add(rimMesh);

  // Black Tuxedo Hood & Body
  const bodyGroup = new THREE.Group();
  const tuxBody = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 1.05, 1.45, 32), blackTux);
  tuxBody.rotation.x = Math.PI / 2;
  tuxBody.position.set(0, -0.05, 0.05);
  bodyGroup.add(tuxBody);

  // White Ceramic Egg-Shaped Belly
  const belly = new THREE.Mesh(new THREE.SphereGeometry(0.68, 24, 24), whiteBelly);
  belly.scale.set(0.85, 1.25, 0.35);
  belly.position.set(0, -0.22, 0.12);
  bodyGroup.add(belly);

  // Golden Emperor Ear Plumes
  for (let side of [-1, 1]) {
    const plume = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.04, 8, 24, Math.PI * 0.65), goldPlumes);
    plume.rotation.z = side * 0.75;
    plume.position.set(side * 0.58, 0.32, 0.12);
    bodyGroup.add(plume);

    // Beady eyes
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 12), blackTux);
    eye.position.set(side * 0.28, 0.42, 0.15);
    bodyGroup.add(eye);
  }

  // Orange Cone Beak
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.32, 16), orangeBeak);
  beak.rotation.x = Math.PI / 2;
  beak.position.set(0, 0.22, 0.2);
  bodyGroup.add(beak);
  badge.add(bodyGroup);

  badge.setExplodedView = (f: number) => {
    baseMesh.position.z = -f * 0.25;
    bodyGroup.position.z = 0.05 + f * 0.85;
  };

  return badge;
}

/**
 * 8. Cute Cotton Bunny (棉尾兔 • 月夜萌兔)
 */
export function buildCuteBunnyBadge(
  materials: AppleAwardMaterials,
  earnedDate: string = 'OCTOBER 28, 2026',
  isLocked: boolean = false
): AppleBadgeMeshGroup {
  const mirrorSilver = materials.getMirrorSilverBezel(isLocked);
  const sakuraPink = materials.getColorLacquer(0xffb7b2, isLocked);
  const whiteCeramic = materials.getOffWhiteEnamel(isLocked);
  const mirrorGold = materials.getMirrorGoldBezel(isLocked);
  const darkMat = materials.getColorLacquer(0x212121, isLocked);
  const backMat = materials.getAppleBackShell(earnedDate, 'MOONLIT COTTON BUNNY', isLocked);

  const badge = new THREE.Group() as AppleBadgeMeshGroup;

  const baseMesh = new THREE.Mesh(
    createConvexCoinGeometry(1.65, 0.16, 0.08),
    [mirrorSilver, sakuraPink, backMat]
  );
  baseMesh.rotation.x = Math.PI / 2;
  badge.add(baseMesh);

  const rimMesh = new THREE.Mesh(new THREE.TorusGeometry(1.65, 0.08, 16, 64), mirrorSilver);
  badge.add(rimMesh);

  // Long Tall Curved Bunny Ears
  const earsGroup = new THREE.Group();
  for (let side of [-1, 1]) {
    const earOuter = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.25, 1.35, 24), whiteCeramic);
    earOuter.rotation.z = side * 0.22;
    earOuter.position.set(side * 0.52, 1.15, 0.06);
    earsGroup.add(earOuter);

    const earInner = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.15, 1.15, 24), sakuraPink);
    earInner.rotation.z = side * 0.22;
    earInner.position.set(side * 0.52, 1.12, 0.1);
    earsGroup.add(earInner);
  }
  badge.add(earsGroup);

  // Golden Crescent Moon Crest
  const moon = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.05, 12, 32, Math.PI * 1.3), mirrorGold);
  moon.rotation.z = Math.PI * 0.35;
  moon.position.set(0, 0.48, 0.12);
  badge.add(moon);

  // Round Cheeky Face
  const faceGroup = new THREE.Group();
  const face = new THREE.Mesh(new THREE.SphereGeometry(0.72, 24, 24), whiteCeramic);
  face.scale.set(1.15, 0.9, 0.35);
  face.position.set(0, -0.15, 0.08);
  faceGroup.add(face);

  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 12), sakuraPink);
  nose.position.set(0, -0.12, 0.18);
  faceGroup.add(nose);

  for (let side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 12), darkMat);
    eye.position.set(side * 0.35, 0.08, 0.16);
    faceGroup.add(eye);
  }
  badge.add(faceGroup);

  badge.setExplodedView = (f: number) => {
    baseMesh.position.z = -f * 0.25;
    earsGroup.position.z = f * 0.55;
    moon.position.z = 0.12 + f * 0.75;
    faceGroup.position.z = 0.08 + f * 0.95;
  };

  return badge;
}

/**
 * 9. Cute Sea Otter (海獭 • 浮海贝宝)
 */
export function buildCuteOtterBadge(
  materials: AppleAwardMaterials,
  earnedDate: string = 'OCTOBER 28, 2026',
  isLocked: boolean = false
): AppleBadgeMeshGroup {
  const mirrorGold = materials.getMirrorGoldBezel(isLocked);
  const oceanBlue = materials.getColorLacquer(0x00b4d8, isLocked);
  const otterBrown = materials.getColorLacquer(0x795548, isLocked);
  const creamMuzzle = materials.getOffWhiteEnamel(isLocked);
  const gemPearl = materials.getColorLacquer(0x00f0ff, isLocked); // Glowing Clam Pearl
  const backMat = materials.getAppleBackShell(earnedDate, 'CLEVER SEA OTTER', isLocked);

  const badge = new THREE.Group() as AppleBadgeMeshGroup;

  const baseMesh = new THREE.Mesh(
    createConvexCoinGeometry(1.65, 0.16, 0.08),
    [mirrorGold, oceanBlue, backMat]
  );
  baseMesh.rotation.x = Math.PI / 2;
  badge.add(baseMesh);

  const rimMesh = new THREE.Mesh(new THREE.TorusGeometry(1.65, 0.08, 16, 64), mirrorGold);
  badge.add(rimMesh);

  // Floating Otter Body
  const otterGroup = new THREE.Group();
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.65, 24, 24), otterBrown);
  head.scale.set(1.05, 0.9, 0.35);
  head.position.set(0, 0.45, 0.08);
  otterGroup.add(head);

  // Cream Muzzle & Whiskers
  const muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.38, 20, 16), creamMuzzle);
  muzzle.scale.set(1.1, 0.75, 0.35);
  muzzle.position.set(0, 0.32, 0.16);
  otterGroup.add(muzzle);

  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.18, 12), materials.getColorLacquer(0x18181b, isLocked));
  nose.rotation.z = Math.PI;
  nose.position.set(0, 0.38, 0.24);
  otterGroup.add(nose);

  // Round paws holding shimmering pearl
  for (let side of [-1, 1]) {
    const paw = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 16), otterBrown);
    paw.position.set(side * 0.42, -0.42, 0.16);
    otterGroup.add(paw);
  }

  // Shimmering Turquoise Gem Clam
  const pearl = new THREE.Mesh(new THREE.SphereGeometry(0.26, 24, 24), gemPearl);
  pearl.position.set(0, -0.38, 0.18);
  otterGroup.add(pearl);
  badge.add(otterGroup);

  badge.setExplodedView = (f: number) => {
    baseMesh.position.z = -f * 0.25;
    otterGroup.position.z = 0.08 + f * 0.85;
  };

  return badge;
}

/**
 * 10. Cute Alpaca (羊驼 • 云绒学者)
 */
export function buildCuteAlpacaBadge(
  materials: AppleAwardMaterials,
  earnedDate: string = 'OCTOBER 28, 2026',
  isLocked: boolean = false
): AppleBadgeMeshGroup {
  const mirrorSilver = materials.getMirrorSilverBezel(isLocked);
  const lavenderMat = materials.getColorLacquer(0xb388ff, isLocked);
  const cloudWhite = materials.getOffWhiteEnamel(isLocked);
  const goldGlasses = materials.getMirrorGoldBezel(isLocked);
  const backMat = materials.getAppleBackShell(earnedDate, 'SCHOLAR ALPACA', isLocked);

  const badge = new THREE.Group() as AppleBadgeMeshGroup;

  const baseMesh = new THREE.Mesh(
    createConvexCoinGeometry(1.65, 0.16, 0.08),
    [mirrorSilver, lavenderMat, backMat]
  );
  baseMesh.rotation.x = Math.PI / 2;
  badge.add(baseMesh);

  const rimMesh = new THREE.Mesh(new THREE.TorusGeometry(1.65, 0.08, 16, 64), mirrorSilver);
  badge.add(rimMesh);

  // Scalloped Puffy Fleece Cloud Crown
  const fleeceGroup = new THREE.Group();
  for (let c = 0; c < 7; c++) {
    const angle = (c / 7) * Math.PI + Math.PI * 0.05;
    const puff = new THREE.Mesh(new THREE.SphereGeometry(0.32, 16, 16), cloudWhite);
    puff.position.set(Math.cos(angle) * 0.85, 0.65 + Math.sin(angle) * 0.45, 0.08);
    fleeceGroup.add(puff);
  }
  badge.add(fleeceGroup);

  // Slender Neck & Face
  const faceGroup = new THREE.Group();
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.38, 0.85, 24), cloudWhite);
  neck.position.set(0, -0.45, 0.08);
  faceGroup.add(neck);

  const face = new THREE.Mesh(new THREE.SphereGeometry(0.48, 24, 24), cloudWhite);
  face.scale.set(0.85, 1.1, 0.4);
  face.position.set(0, 0.15, 0.1);
  faceGroup.add(face);

  // Cute Golden Circular Spectacles (Scholar Glasses)
  for (let side of [-1, 1]) {
    const lens = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.032, 12, 24), goldGlasses);
    lens.position.set(side * 0.28, 0.22, 0.18);
    faceGroup.add(lens);
  }
  const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.03, 0.02), goldGlasses);
  bridge.position.set(0, 0.22, 0.18);
  faceGroup.add(bridge);
  badge.add(faceGroup);

  badge.setExplodedView = (f: number) => {
    baseMesh.position.z = -f * 0.25;
    fleeceGroup.position.z = 0.08 + f * 0.55;
    faceGroup.position.z = 0.08 + f * 0.95;
  };

  return badge;
}

// ============================================================================
// 10 OCEAN ANIMALS (海洋动物系列)
// ============================================================================

/**
 * 11. Blue Whale (深海蓝鲸 • 深渊巨擘)
 */
export function buildOceanWhaleBadge(
  materials: AppleAwardMaterials,
  earnedDate: string = 'OCTOBER 28, 2026',
  isLocked: boolean = false
): AppleBadgeMeshGroup {
  const mirrorSilver = materials.getMirrorSilverBezel(isLocked);
  const deepIndigo = materials.getColorLacquer(0x03045e, isLocked);
  const whaleBlue = materials.getColorLacquer(0x0077b6, isLocked);
  const spoutCyan = materials.getColorLacquer(0x00f0ff, isLocked);
  const backMat = materials.getAppleBackShell(earnedDate, 'OCEANIC BLUE WHALE', isLocked);

  const badge = new THREE.Group() as AppleBadgeMeshGroup;

  const baseMesh = new THREE.Mesh(
    createConvexCoinGeometry(1.65, 0.16, 0.08),
    [mirrorSilver, deepIndigo, backMat]
  );
  baseMesh.rotation.x = Math.PI / 2;
  badge.add(baseMesh);

  const rimMesh = new THREE.Mesh(new THREE.TorusGeometry(1.65, 0.08, 16, 64), mirrorSilver);
  badge.add(rimMesh);

  // Streamlined Whale Body
  const whaleGroup = new THREE.Group();
  const fuselage = new THREE.Mesh(new THREE.SphereGeometry(1.15, 32, 24), whaleBlue);
  fuselage.scale.set(1.4, 0.65, 0.35);
  fuselage.rotation.z = -0.25;
  fuselage.position.set(-0.15, -0.1, 0.08);
  whaleGroup.add(fuselage);

  // Ventral Grooves (Whale Pleats)
  for (let g = 0; g < 4; g++) {
    const groove = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.025, 0.02), mirrorSilver);
    groove.rotation.z = -0.25;
    groove.position.set(-0.25, -0.28 - g * 0.08, 0.15);
    whaleGroup.add(groove);
  }

  // Tail Fluke
  const fluke = new THREE.Mesh(new THREE.ConeGeometry(0.55, 0.45, 4), whaleBlue);
  fluke.rotation.z = Math.PI * 0.45;
  fluke.position.set(-1.18, 0.35, 0.1);
  whaleGroup.add(fluke);

  // Water Spout Geyser in Cyan
  const spoutGroup = new THREE.Group();
  for (let s = -1; s <= 1; s += 2) {
    const spoutArc = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.038, 10, 24, Math.PI * 0.65), spoutCyan);
    spoutArc.rotation.z = s * 0.45;
    spoutArc.position.set(s * 0.25, 0.85, 0.12);
    spoutGroup.add(spoutArc);
  }
  badge.add(spoutGroup);
  badge.add(whaleGroup);

  badge.setExplodedView = (f: number) => {
    baseMesh.position.z = -f * 0.25;
    whaleGroup.position.z = 0.08 + f * 0.75;
    spoutGroup.position.z = 0.12 + f * 1.15;
  };

  return badge;
}

/**
 * 12. Pelagic Manta Ray (蝠鲼 • 碧海飞翼)
 */
export function buildOceanMantaBadge(
  materials: AppleAwardMaterials,
  earnedDate: string = 'OCTOBER 28, 2026',
  isLocked: boolean = false
): AppleBadgeMeshGroup {
  const spaceGray = materials.getSpaceGrayBezel(isLocked);
  const midnightAbyss = materials.getColorLacquer(0x0d1b2a, isLocked);
  const mantaSlate = materials.getColorLacquer(0x1b263b, isLocked);
  const ventralWhite = materials.getOffWhiteEnamel(isLocked);
  const silverTrim = materials.getMirrorSilverBezel(isLocked);
  const backMat = materials.getAppleBackShell(earnedDate, 'PELAGIC MANTA RAY', isLocked);

  const badge = new THREE.Group() as AppleBadgeMeshGroup;

  const baseMesh = new THREE.Mesh(
    createConvexCoinGeometry(1.65, 0.16, 0.08),
    [spaceGray, midnightAbyss, backMat]
  );
  baseMesh.rotation.x = Math.PI / 2;
  badge.add(baseMesh);

  const rimMesh = new THREE.Mesh(new THREE.TorusGeometry(1.65, 0.08, 16, 64), spaceGray);
  badge.add(rimMesh);

  // Expansive Diamond Wing Blades
  const mantaGroup = new THREE.Group();
  const wingsGeo = new THREE.ConeGeometry(1.48, 1.85, 4);
  wingsGeo.scale(1.2, 0.85, 0.18);
  const wingsMesh = new THREE.Mesh(wingsGeo, mantaSlate);
  wingsMesh.position.set(0, 0.15, 0.08);
  mantaGroup.add(wingsMesh);

  // Ventral White Chevron Inlay
  const chevron = new THREE.Mesh(new THREE.ConeGeometry(0.72, 1.15, 4), ventralWhite);
  chevron.scale.set(1.0, 0.75, 0.1);
  chevron.position.set(0, 0.05, 0.12);
  mantaGroup.add(chevron);

  // Cephalic Horn Scoops
  for (let side of [-1, 1]) {
    const horn = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.045, 8, 16, Math.PI * 0.75), silverTrim);
    horn.rotation.z = side * 0.35 + Math.PI * 0.15;
    horn.position.set(side * 0.35, 0.95, 0.1);
    mantaGroup.add(horn);
  }

  // Whip-like Needle Tail
  const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.04, 1.45, 12), silverTrim);
  tail.position.set(0, -0.85, 0.09);
  mantaGroup.add(tail);
  badge.add(mantaGroup);

  badge.setExplodedView = (f: number) => {
    baseMesh.position.z = -f * 0.25;
    mantaGroup.position.z = 0.08 + f * 0.85;
  };

  return badge;
}

/**
 * 13. Centennial Sea Turtle (远航海龟 • 百年归途)
 */
export function buildOceanTurtleBadge(
  materials: AppleAwardMaterials,
  earnedDate: string = 'OCTOBER 28, 2026',
  isLocked: boolean = false
): AppleBadgeMeshGroup {
  const mirrorGold = materials.getMirrorGoldBezel(isLocked);
  const reefTeal = materials.getColorLacquer(0x0096c7, isLocked);
  const shellEmerald = materials.getColorLacquer(0x2ec4b6, isLocked);
  const shellGold = materials.getMirrorGoldBezel(isLocked);
  const backMat = materials.getAppleBackShell(earnedDate, 'CENTENNIAL SEA TURTLE', isLocked);

  const badge = new THREE.Group() as AppleBadgeMeshGroup;

  const baseMesh = new THREE.Mesh(
    createConvexCoinGeometry(1.65, 0.16, 0.08),
    [mirrorGold, reefTeal, backMat]
  );
  baseMesh.rotation.x = Math.PI / 2;
  badge.add(baseMesh);

  const rimMesh = new THREE.Mesh(new THREE.TorusGeometry(1.65, 0.08, 16, 64), mirrorGold);
  badge.add(rimMesh);

  // Sweeping Flipper Paddles
  const flipperGroup = new THREE.Group();
  for (let side of [-1, 1]) {
    const frontPaddle = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.25, 0.06), shellGold);
    frontPaddle.rotation.z = side * 0.55;
    frontPaddle.position.set(side * 0.95, 0.45, 0.06);
    flipperGroup.add(frontPaddle);

    const rearPaddle = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.18, 0.05), shellGold);
    rearPaddle.rotation.z = side * 0.35;
    rearPaddle.position.set(side * 0.65, -0.65, 0.06);
    flipperGroup.add(rearPaddle);
  }
  badge.add(flipperGroup);

  // Hexagonal Tiled Carapace Dome
  const shellGroup = new THREE.Group();
  const shellDome = new THREE.Mesh(new THREE.SphereGeometry(0.92, 32, 24), shellEmerald);
  shellDome.scale.set(0.95, 1.15, 0.38);
  shellDome.position.set(0, -0.05, 0.1);
  shellGroup.add(shellDome);

  // Scute Hexagons on Shell
  for (let h = -1; h <= 1; h++) {
    const scute = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.03, 6), shellGold);
    scute.rotation.x = Math.PI / 2;
    scute.position.set(0, h * 0.42, 0.22);
    shellGroup.add(scute);
  }

  // Wise Turtle Head
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 20, 20), shellGold);
  head.scale.set(0.85, 1.15, 0.6);
  head.position.set(0, 0.95, 0.14);
  shellGroup.add(head);
  badge.add(shellGroup);

  badge.setExplodedView = (f: number) => {
    baseMesh.position.z = -f * 0.25;
    flipperGroup.position.z = 0.06 + f * 0.55;
    shellGroup.position.z = 0.1 + f * 0.95;
  };

  return badge;
}

/**
 * 14. Sonar Echo Dolphin (海豚 • 跃浪回声)
 */
export function buildOceanDolphinBadge(
  materials: AppleAwardMaterials,
  earnedDate: string = 'OCTOBER 28, 2026',
  isLocked: boolean = false
): AppleBadgeMeshGroup {
  const mirrorSilver = materials.getMirrorSilverBezel(isLocked);
  const deepCobalt = materials.getColorLacquer(0x023e8a, isLocked);
  const dolphinAqua = materials.getColorLacquer(0x00f0ff, isLocked);
  const sonarGold = materials.getMirrorGoldBezel(isLocked);
  const backMat = materials.getAppleBackShell(earnedDate, 'SONAR ECHO DOLPHIN', isLocked);

  const badge = new THREE.Group() as AppleBadgeMeshGroup;

  const baseMesh = new THREE.Mesh(
    createConvexCoinGeometry(1.65, 0.16, 0.08),
    [mirrorSilver, deepCobalt, backMat]
  );
  baseMesh.rotation.x = Math.PI / 2;
  badge.add(baseMesh);

  const rimMesh = new THREE.Mesh(new THREE.TorusGeometry(1.65, 0.08, 16, 64), mirrorSilver);
  badge.add(rimMesh);

  // Concentric Sonar Soundwave Ripple Rings
  const sonarGroup = new THREE.Group();
  for (let r = 1; r <= 3; r++) {
    const wave = new THREE.Mesh(new THREE.TorusGeometry(0.35 + r * 0.32, 0.035, 10, 36, Math.PI * 0.8), sonarGold);
    wave.rotation.z = Math.PI * 0.6;
    wave.position.set(-0.35, 0.35, 0.05);
    sonarGroup.add(wave);
  }
  badge.add(sonarGroup);

  // Dynamic Leaping Dolphin Arc
  const dolphinGroup = new THREE.Group();
  const bodyArc = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.22, 16, 32, Math.PI * 0.85), dolphinAqua);
  bodyArc.rotation.z = Math.PI * 0.15;
  bodyArc.position.set(0.1, -0.15, 0.12);
  dolphinGroup.add(bodyArc);

  // Dorsal fin & Beak
  const dorsal = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.45, 4), dolphinAqua);
  dorsal.rotation.z = Math.PI * 0.35;
  dorsal.position.set(0.35, 0.65, 0.16);
  dolphinGroup.add(dorsal);

  const snout = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.42, 16), dolphinAqua);
  snout.rotation.z = -Math.PI * 0.35;
  snout.position.set(-0.78, 0.52, 0.16);
  dolphinGroup.add(snout);
  badge.add(dolphinGroup);

  badge.setExplodedView = (f: number) => {
    baseMesh.position.z = -f * 0.25;
    sonarGroup.position.z = 0.05 + f * 0.55;
    dolphinGroup.position.z = 0.12 + f * 0.95;
  };

  return badge;
}

/**
 * 15. Panoramic Hammerhead Shark (双髻鲨 • 全景巡弋)
 */
export function buildOceanSharkBadge(
  materials: AppleAwardMaterials,
  earnedDate: string = 'OCTOBER 28, 2026',
  isLocked: boolean = false
): AppleBadgeMeshGroup {
  const spaceGray = materials.getSpaceGrayBezel(isLocked);
  const abyssNavy = materials.getColorLacquer(0x14213d, isLocked);
  const slateTitanium = materials.getColorLacquer(0x4a4e69, isLocked);
  const eyeGold = materials.getMirrorGoldBezel(isLocked);
  const backMat = materials.getAppleBackShell(earnedDate, 'PANORAMIC HAMMERHEAD', isLocked);

  const badge = new THREE.Group() as AppleBadgeMeshGroup;

  const baseMesh = new THREE.Mesh(
    createConvexCoinGeometry(1.65, 0.16, 0.08),
    [spaceGray, abyssNavy, backMat]
  );
  baseMesh.rotation.x = Math.PI / 2;
  badge.add(baseMesh);

  const rimMesh = new THREE.Mesh(new THREE.TorusGeometry(1.65, 0.08, 16, 64), spaceGray);
  badge.add(rimMesh);

  // Shark Fuselage
  const sharkGroup = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.42, 2.1, 24), slateTitanium);
  body.position.set(0, -0.15, 0.08);
  sharkGroup.add(body);

  // Iconic Wide T-Shaped Cephalofoil Hammerhead Bar
  const hammerBar = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.38, 0.18), spaceGray);
  hammerBar.position.set(0, 0.85, 0.12);
  sharkGroup.add(hammerBar);

  // Lateral Golden Ocular Sensors
  for (let side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 16), eyeGold);
    eye.position.set(side * 0.92, 0.85, 0.14);
    sharkGroup.add(eye);
  }

  // Sharp Dorsal Fin
  const dorsal = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.72, 4), spaceGray);
  dorsal.rotation.z = Math.PI * 0.1;
  dorsal.position.set(0, 0.15, 0.22);
  sharkGroup.add(dorsal);
  badge.add(sharkGroup);

  badge.setExplodedView = (f: number) => {
    baseMesh.position.z = -f * 0.25;
    sharkGroup.position.z = 0.08 + f * 0.85;
  };

  return badge;
}

/**
 * 16. Coral Sentry Seahorse (海马 • 珊瑚哨兵)
 */
export function buildOceanSeahorseBadge(
  materials: AppleAwardMaterials,
  earnedDate: string = 'OCTOBER 28, 2026',
  isLocked: boolean = false
): AppleBadgeMeshGroup {
  const mirrorGold = materials.getMirrorGoldBezel(isLocked);
  const coralPink = materials.getColorLacquer(0xff6b6b, isLocked);
  const amberPlate = materials.getColorLacquer(0xffd166, isLocked);
  const backMat = materials.getAppleBackShell(earnedDate, 'CORAL SENTRY SEAHORSE', isLocked);

  const badge = new THREE.Group() as AppleBadgeMeshGroup;

  const baseMesh = new THREE.Mesh(
    createConvexCoinGeometry(1.65, 0.16, 0.08),
    [mirrorGold, coralPink, backMat]
  );
  baseMesh.rotation.x = Math.PI / 2;
  badge.add(baseMesh);

  const rimMesh = new THREE.Mesh(new THREE.TorusGeometry(1.65, 0.08, 16, 64), mirrorGold);
  badge.add(rimMesh);

  // Segmented Armored Body S-Curve
  const seahorseGroup = new THREE.Group();
  for (let s = 0; s < 6; s++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.32 - s * 0.035, 0.05, 10, 24), amberPlate);
    ring.position.set(Math.sin(s * 0.5) * 0.25, 0.45 - s * 0.28, 0.08 + s * 0.015);
    seahorseGroup.add(ring);
  }

  // Prehensile Spiral Tail
  const tailSpiral = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.045, 10, 32, Math.PI * 1.5), mirrorGold);
  tailSpiral.position.set(-0.15, -0.95, 0.1);
  seahorseGroup.add(tailSpiral);

  // Coronet Spiked Crown
  const crown = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.35, 5), mirrorGold);
  crown.position.set(0.12, 1.15, 0.12);
  seahorseGroup.add(crown);

  // Tubular Snout
  const snout = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 0.55, 16), amberPlate);
  snout.rotation.z = Math.PI * 0.45;
  snout.position.set(-0.35, 0.75, 0.12);
  seahorseGroup.add(snout);
  badge.add(seahorseGroup);

  badge.setExplodedView = (f: number) => {
    baseMesh.position.z = -f * 0.25;
    seahorseGroup.position.z = 0.08 + f * 0.85;
  };

  return badge;
}

/**
 * 17. Arctic Aurora Narwhal (独角鲸 • 极光破冰针)
 */
export function buildOceanNarwhalBadge(
  materials: AppleAwardMaterials,
  earnedDate: string = 'OCTOBER 28, 2026',
  isLocked: boolean = false
): AppleBadgeMeshGroup {
  const mirrorSilver = materials.getMirrorSilverBezel(isLocked);
  const arcticTeal = materials.getColorLacquer(0x005f73, isLocked);
  const slateBody = materials.getColorLacquer(0x94d2bd, isLocked);
  const goldHorn = materials.getMirrorGoldBezel(isLocked); // 24K Spiral Horn
  const backMat = materials.getAppleBackShell(earnedDate, 'ARCTIC AURORA NARWHAL', isLocked);

  const badge = new THREE.Group() as AppleBadgeMeshGroup;

  const baseMesh = new THREE.Mesh(
    createConvexCoinGeometry(1.65, 0.16, 0.08),
    [mirrorSilver, arcticTeal, backMat]
  );
  baseMesh.rotation.x = Math.PI / 2;
  badge.add(baseMesh);

  const rimMesh = new THREE.Mesh(new THREE.TorusGeometry(1.65, 0.08, 16, 64), mirrorSilver);
  badge.add(rimMesh);

  // Narwhal Fuselage
  const narwhalGroup = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(1.1, 32, 24), slateBody);
  body.scale.set(0.65, 1.35, 0.35);
  body.rotation.z = -0.35;
  body.position.set(-0.15, -0.15, 0.08);
  narwhalGroup.add(body);

  // Long Helical Unicorn Horn (Spiral Tusk)
  const hornGeo = new THREE.ConeGeometry(0.12, 1.75, 8);
  const horn = new THREE.Mesh(hornGeo, goldHorn);
  horn.rotation.z = -0.35;
  horn.position.set(0.48, 0.88, 0.18);
  narwhalGroup.add(horn);

  // Starlight Glint Ring
  const starRing = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.03, 8, 16), mirrorSilver);
  starRing.position.set(0.92, 1.45, 0.22);
  narwhalGroup.add(starRing);
  badge.add(narwhalGroup);

  badge.setExplodedView = (f: number) => {
    baseMesh.position.z = -f * 0.25;
    narwhalGroup.position.z = 0.08 + f * 0.85;
  };

  return badge;
}

/**
 * 18. Kraken Giant Octopus (巨型章鱼 • 渊底八爪王)
 */
export function buildOceanOctopusBadge(
  materials: AppleAwardMaterials,
  earnedDate: string = 'OCTOBER 28, 2026',
  isLocked: boolean = false
): AppleBadgeMeshGroup {
  const spaceGray = materials.getSpaceGrayBezel(isLocked);
  const abyssalNavy = materials.getColorLacquer(0x0a1128, isLocked);
  const krakenCrimson = materials.getColorLacquer(0x9d0208, isLocked);
  const goldSuction = materials.getMirrorGoldBezel(isLocked);
  const backMat = materials.getAppleBackShell(earnedDate, 'KRAKEN GIANT OCTOPUS', isLocked);

  const badge = new THREE.Group() as AppleBadgeMeshGroup;

  const baseMesh = new THREE.Mesh(
    createConvexCoinGeometry(1.65, 0.16, 0.08),
    [spaceGray, abyssalNavy, backMat]
  );
  baseMesh.rotation.x = Math.PI / 2;
  badge.add(baseMesh);

  const rimMesh = new THREE.Mesh(new THREE.TorusGeometry(1.65, 0.08, 16, 64), spaceGray);
  badge.add(rimMesh);

  // Cephalopod Mantle Dome
  const mantleGroup = new THREE.Group();
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.72, 32, 24), krakenCrimson);
  dome.scale.set(1.05, 1.25, 0.42);
  dome.position.set(0, 0.25, 0.1);
  mantleGroup.add(dome);

  // Piercing Golden Slit Eyes
  for (let side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), goldSuction);
    eye.position.set(side * 0.35, 0.15, 0.22);
    mantleGroup.add(eye);
  }
  badge.add(mantleGroup);

  // 8 Sinuous Coiling Tentacles with Golden Suction Cups
  const tentaclesGroup = new THREE.Group();
  for (let t = 0; t < 8; t++) {
    const angle = (t / 8) * Math.PI * 2;
    const tentacle = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.05, 10, 28, Math.PI * 0.72), krakenCrimson);
    tentacle.rotation.z = angle + 0.3;
    tentaclesGroup.add(tentacle);

    const sucker = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.02, 12), goldSuction);
    sucker.position.set(Math.cos(angle) * 1.15, Math.sin(angle) * 1.15, 0.08);
    sucker.rotation.x = Math.PI / 2;
    tentaclesGroup.add(sucker);
  }
  badge.add(tentaclesGroup);

  badge.setExplodedView = (f: number) => {
    baseMesh.position.z = -f * 0.25;
    tentaclesGroup.position.z = f * 0.65;
    mantleGroup.position.z = 0.1 + f * 1.05;
  };

  return badge;
}

/**
 * 19. Crown Bioluminescent Jellyfish (皇冠水母 • 深海流光冠)
 */
export function buildOceanJellyfishBadge(
  materials: AppleAwardMaterials,
  earnedDate: string = 'OCTOBER 28, 2026',
  isLocked: boolean = false
): AppleBadgeMeshGroup {
  const spaceGray = materials.getSpaceGrayBezel(isLocked);
  const deepVoid = materials.getColorLacquer(0x10002b, isLocked);
  const purpleCrown = materials.getColorLacquer(0x7209b7, isLocked);
  const electricCyan = materials.getColorLacquer(0x4cc9f0, isLocked);
  const backMat = materials.getAppleBackShell(earnedDate, 'CROWN BIOLUMINESCENT JELLYFISH', isLocked);

  const badge = new THREE.Group() as AppleBadgeMeshGroup;

  const baseMesh = new THREE.Mesh(
    createConvexCoinGeometry(1.65, 0.16, 0.08),
    [spaceGray, deepVoid, backMat]
  );
  baseMesh.rotation.x = Math.PI / 2;
  badge.add(baseMesh);

  const rimMesh = new THREE.Mesh(new THREE.TorusGeometry(1.65, 0.08, 16, 64), spaceGray);
  badge.add(rimMesh);

  // Scalloped Crown Bell Umbrella
  const bellGroup = new THREE.Group();
  const crownDome = new THREE.Mesh(new THREE.SphereGeometry(0.95, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.5), purpleCrown);
  crownDome.scale.set(1.15, 0.85, 0.35);
  crownDome.position.set(0, 0.35, 0.08);
  bellGroup.add(crownDome);

  // Bioluminescent Core Nucleus
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.35, 24, 24), electricCyan);
  core.position.set(0, 0.35, 0.16);
  bellGroup.add(core);
  badge.add(bellGroup);

  // Cascading Undulating Ribbon Tendrils
  const tendrilGroup = new THREE.Group();
  for (let k = 0; k < 7; k++) {
    const x = -0.75 + (k / 6) * 1.5;
    const tendril = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.035, 8, 24, Math.PI * 0.8), electricCyan);
    tendril.rotation.z = (k % 2 === 0 ? 0.35 : -0.35);
    tendril.position.set(x, -0.45 - (k % 3) * 0.15, 0.08);
    tendrilGroup.add(tendril);
  }
  badge.add(tendrilGroup);

  badge.setExplodedView = (f: number) => {
    baseMesh.position.z = -f * 0.25;
    bellGroup.position.z = 0.08 + f * 0.75;
    tendrilGroup.position.z = 0.08 + f * 1.15;
  };

  return badge;
}

/**
 * 20. Horizon Flying Fish (飞鱼 • 破浪翼翔)
 */
export function buildOceanFlyingFishBadge(
  materials: AppleAwardMaterials,
  earnedDate: string = 'OCTOBER 28, 2026',
  isLocked: boolean = false
): AppleBadgeMeshGroup {
  const mirrorSilver = materials.getMirrorSilverBezel(isLocked);
  const seaCobalt = materials.getColorLacquer(0x3a0ca3, isLocked);
  const wingSilver = materials.getMirrorSilverBezel(isLocked);
  const foamCyan = materials.getColorLacquer(0x00f0ff, isLocked);
  const backMat = materials.getAppleBackShell(earnedDate, 'HORIZON FLYING FISH', isLocked);

  const badge = new THREE.Group() as AppleBadgeMeshGroup;

  const baseMesh = new THREE.Mesh(
    createConvexCoinGeometry(1.65, 0.16, 0.08),
    [mirrorSilver, seaCobalt, backMat]
  );
  baseMesh.rotation.x = Math.PI / 2;
  badge.add(baseMesh);

  const rimMesh = new THREE.Mesh(new THREE.TorusGeometry(1.65, 0.08, 16, 64), mirrorSilver);
  badge.add(rimMesh);

  // Aerodynamic Darting Torpedo Fuselage
  const fishGroup = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.32, 1.85, 24), foamCyan);
  body.rotation.z = Math.PI * 0.28;
  body.position.set(0, 0, 0.1);
  fishGroup.add(body);

  // Expansive Pectoral Wing Glider Fins (Spread like an airplane)
  for (let side of [-1, 1]) {
    const wingGeo = new THREE.BoxGeometry(1.35, 0.35, 0.04);
    const wing = new THREE.Mesh(wingGeo, wingSilver);
    wing.rotation.z = side * 0.65;
    wing.position.set(side * 0.85, 0.35, 0.12);
    fishGroup.add(wing);
  }

  // Cresting Seafoam Wake Arc
  const wake = new THREE.Mesh(new THREE.TorusGeometry(1.25, 0.04, 10, 36, Math.PI * 0.75), foamCyan);
  wake.rotation.z = Math.PI * 1.1;
  wake.position.set(0, -0.65, 0.08);
  fishGroup.add(wake);
  badge.add(fishGroup);

  badge.setExplodedView = (f: number) => {
    baseMesh.position.z = -f * 0.25;
    fishGroup.position.z = 0.1 + f * 0.85;
  };

  return badge;
}
