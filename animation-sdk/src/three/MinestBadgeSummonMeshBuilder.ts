/**
 * Minest Hex Badge Summon 3D Mesh Builder
 * Accurately models the exact elements shown in design sheet 4530E4C3-2A2B-4A7E-B52C-2DB392466777.png:
 *
 * 1. Crystal Hex Core (统一形态六边形胚体，散发微弱冰蓝光芒)
 * 2. 6 Outer Assembly Brackets (金色包边 + 蓝色宝石材质外围组件)
 * 3. Assembled Locked Shell (锁定状态，中心浮雕印章)
 * 4. Real Crown Badge (最终揭晓 3D 皇冠立体勋章)
 * 5. 8-Phase Badge Wall Card Container (最终收入卡片)
 */

import * as THREE from 'three';
import { MinestSummonMaterials } from './MinestSummonMaterials';

export interface MinestAssemblyBracket extends THREE.Group {
  userData: {
    index: number;
    angle: number;
    dirX: number;
    dirY: number;
    dockRadius: number;
    spreadRadius: number;
  };
}

export interface MinestSummonPack {
  rootGroup: THREE.Group;
  crystalHex: THREE.Group;
  bracketsGroup: THREE.Group;
  brackets: MinestAssemblyBracket[];
  assembledShell: THREE.Group;
  energyVortexRing1: THREE.Mesh;
  energyVortexRing2: THREE.Mesh;
  realCrownBadge: THREE.Group;
  badgeWallCard: THREE.Group;
}

export function buildMinestSummonMeshes(mats: MinestSummonMaterials): MinestSummonPack {
  const rootGroup = new THREE.Group();
  rootGroup.name = 'minest-summon-root';

  const rHex = 1.38;
  const depth = 0.28;

  // ─────────────────────────────────────────────────────────────────────────
  // 1. 六边形胚体 (统一形态 Crystal Hex Core) - Phase 1
  // ─────────────────────────────────────────────────────────────────────────
  const crystalHex = new THREE.Group();
  crystalHex.name = 'crystal-hex-core';

  // Hexagon shape
  const hexShape = new THREE.Shape();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
    const x = Math.cos(a) * rHex;
    const y = Math.sin(a) * rHex;
    if (i === 0) hexShape.moveTo(x, y);
    else hexShape.lineTo(x, y);
  }
  hexShape.closePath();

  const crystalGeo = new THREE.ExtrudeGeometry(hexShape, {
    depth: depth,
    bevelEnabled: true,
    bevelSegments: 4,
    steps: 1,
    bevelSize: 0.08,
    bevelThickness: 0.08,
  });
  crystalGeo.center();
  const crystalMesh = new THREE.Mesh(crystalGeo, mats.iceCrystalHex);
  crystalHex.add(crystalMesh);

  // Inner floating core beacon (Diamond crystal inside)
  const innerOcta = new THREE.OctahedronGeometry(0.42, 0);
  const innerMesh = new THREE.Mesh(innerOcta, mats.iceCrystalCoreGlow);
  crystalHex.add(innerMesh);

  rootGroup.add(crystalHex);

  // ─────────────────────────────────────────────────────────────────────────
  // 2. 六个外围组件 (外围组件 x6: 金属性装甲包边 + 蓝色高透晶体材质) - Phase 2
  // ─────────────────────────────────────────────────────────────────────────
  const bracketsGroup = new THREE.Group();
  bracketsGroup.name = 'assembly-brackets-group';
  const brackets: MinestAssemblyBracket[] = [];

  const dockRadius = 1.38;
  const spreadRadius = 2.65;

  for (let i = 0; i < 6; i++) {
    const bracket = new THREE.Group() as MinestAssemblyBracket;
    bracket.name = `minest-bracket-${i}`;

    const angle = (i / 6) * Math.PI * 2 + Math.PI / 6;
    const dirX = Math.cos(angle);
    const dirY = Math.sin(angle);

    bracket.userData = {
      index: i,
      angle,
      dirX,
      dirY,
      dockRadius,
      spreadRadius,
    };

    // Gold outer armor casing
    const bracketArmorShape = new THREE.Shape();
    bracketArmorShape.moveTo(-0.48, -0.12);
    bracketArmorShape.lineTo(0.48, -0.12);
    bracketArmorShape.lineTo(0.42, 0.16);
    bracketArmorShape.lineTo(-0.42, 0.16);
    bracketArmorShape.closePath();

    const bracketArmorGeo = new THREE.ExtrudeGeometry(bracketArmorShape, {
      depth: depth + 0.12,
      bevelEnabled: true,
      bevelSegments: 3,
      bevelSize: 0.04,
      bevelThickness: 0.04,
    });
    bracketArmorGeo.center();
    const goldMesh = new THREE.Mesh(bracketArmorGeo, mats.bracketGoldChamber);
    bracket.add(goldMesh);

    // Blue inlaid gemstone block in center of bracket (as shown in design sheet)
    const gemGeo = new THREE.BoxGeometry(0.55, 0.14, depth + 0.16);
    const gemMesh = new THREE.Mesh(gemGeo, mats.bracketBlueGem);
    gemMesh.position.set(0, 0.02, 0);
    bracket.add(gemMesh);

    // Gold locking teeth rivets on top & bottom
    const rivetGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.18, 8);
    rivetGeo.rotateX(Math.PI / 2);
    const r1 = new THREE.Mesh(rivetGeo, mats.bracketLockTeeth);
    r1.position.set(-0.35, 0.02, (depth + 0.12) / 2);
    const r2 = r1.clone();
    r2.position.x = 0.35;
    bracket.add(r1);
    bracket.add(r2);

    bracket.rotation.z = angle - Math.PI / 2;
    brackets.push(bracket);
    bracketsGroup.add(bracket);
  }

  rootGroup.add(bracketsGroup);

  // ─────────────────────────────────────────────────────────────────────────
  // 3. 组装完成的外壳 (锁定状态 Assembled Locked Shell) - Phase 3 & 4
  // ─────────────────────────────────────────────────────────────────────────
  const assembledShell = new THREE.Group();
  assembledShell.name = 'assembled-locked-shell';
  assembledShell.visible = false;

  // Solid dark blue core shield
  const shellBackGeo = new THREE.ExtrudeGeometry(hexShape, {
    depth: depth + 0.1,
    bevelEnabled: true,
    bevelSegments: 2,
    bevelSize: 0.05,
    bevelThickness: 0.05,
  });
  shellBackGeo.center();
  const shellBackMesh = new THREE.Mesh(shellBackGeo, mats.shellArmorBase);
  assembledShell.add(shellBackMesh);

  // Center relief crown imprint on shell (Stage 3 & 4 center design)
  const shellCrownGeo = new THREE.RingGeometry(0.35, 0.52, 6);
  const shellCrownMesh = new THREE.Mesh(shellCrownGeo, mats.shellEmblemCrown);
  shellCrownMesh.position.z = (depth + 0.1) / 2 + 0.04;
  assembledShell.add(shellCrownMesh);

  rootGroup.add(assembledShell);

  // ─────────────────────────────────────────────────────────────────────────
  // 4. 能量旋转光环 (Vortex Energy Rings) - Phase 4 & 5
  // ─────────────────────────────────────────────────────────────────────────
  const ring1Geo = new THREE.TorusGeometry(1.65, 0.05, 16, 64);
  const energyVortexRing1 = new THREE.Mesh(ring1Geo, mats.vortexEnergyCyan);
  energyVortexRing1.rotation.x = Math.PI / 2.3;
  rootGroup.add(energyVortexRing1);

  const ring2Geo = new THREE.TorusGeometry(1.95, 0.04, 16, 64);
  const energyVortexRing2 = new THREE.Mesh(ring2Geo, mats.vortexEnergyGold);
  energyVortexRing2.rotation.x = -Math.PI / 2.5;
  energyVortexRing2.rotation.y = 0.4;
  rootGroup.add(energyVortexRing2);

  // ─────────────────────────────────────────────────────────────────────────
  // 5. 最终揭晓 3D 皇冠立体勋章 (True Badge 3D 形象) - Phase 6 & 7
  // ─────────────────────────────────────────────────────────────────────────
  const realCrownBadge = new THREE.Group();
  realCrownBadge.name = 'true-royal-crown-badge';
  realCrownBadge.scale.setScalar(0.001);
  realCrownBadge.visible = false;

  // Hexagonal Purple Cloisonné Backing Shield
  const badgeBackGeo = new THREE.ExtrudeGeometry(hexShape, {
    depth: 0.18,
    bevelEnabled: true,
    bevelSegments: 4,
    bevelSize: 0.06,
    bevelThickness: 0.06,
  });
  badgeBackGeo.center();
  const badgeBackMesh = new THREE.Mesh(badgeBackGeo, mats.badgeRoyalPurplePlate);
  realCrownBadge.add(badgeBackMesh);

  // Outer 24K Gold Chamfered Bezel
  const goldBezelGeo = new THREE.TorusGeometry(1.36, 0.12, 16, 6);
  const goldBezelMesh = new THREE.Mesh(goldBezelGeo, mats.badgeBezelGold);
  goldBezelMesh.rotation.z = Math.PI / 6;
  realCrownBadge.add(goldBezelMesh);

  // Center 3D Sculpted Golden Crown (Clash Royale Style Crown)
  const crownShape = new THREE.Shape();
  crownShape.moveTo(-0.65, -0.45);
  crownShape.lineTo(0.65, -0.45);
  crownShape.lineTo(0.72, 0.25);
  crownShape.lineTo(0.38, 0.02);
  crownShape.lineTo(0.0, 0.55); // Tall Center Crown Peak
  crownShape.lineTo(-0.38, 0.02);
  crownShape.lineTo(-0.72, 0.25);
  crownShape.closePath();

  const crownGeo = new THREE.ExtrudeGeometry(crownShape, {
    depth: 0.22,
    bevelEnabled: true,
    bevelSegments: 4,
    bevelSize: 0.05,
    bevelThickness: 0.05,
  });
  crownGeo.center();
  const crownMesh = new THREE.Mesh(crownGeo, mats.crownGold);
  crownMesh.position.z = 0.14;
  realCrownBadge.add(crownMesh);

  // Crown Jewels (3 glowing sapphires on the 3 crown points)
  const jewelGeo = new THREE.SphereGeometry(0.09, 16, 16);
  const j1 = new THREE.Mesh(jewelGeo, mats.bracketBlueGem);
  j1.position.set(-0.7, 0.26, 0.26);
  const j2 = new THREE.Mesh(jewelGeo, mats.bracketBlueGem);
  j2.position.set(0, 0.56, 0.26);
  const j3 = new THREE.Mesh(jewelGeo, mats.bracketBlueGem);
  j3.position.set(0.7, 0.26, 0.26);
  realCrownBadge.add(j1);
  realCrownBadge.add(j2);
  realCrownBadge.add(j3);

  // 8-Point Holy Starburst Behind Badge (Stage 7 Star Flare)
  const starGroup = new THREE.Group();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const rayGeo = new THREE.BoxGeometry(0.06, 2.6, 0.02);
    const rayMesh = new THREE.Mesh(rayGeo, mats.vortexEnergyGold);
    rayMesh.rotation.z = a;
    rayMesh.position.z = -0.15;
    starGroup.add(rayMesh);
  }
  realCrownBadge.add(starGroup);

  rootGroup.add(realCrownBadge);

  // ─────────────────────────────────────────────────────────────────────────
  // 6. 收入 Badge Wall 卡牌面板 (Stage 8 收入 Badge Wall 仪式)
  // ─────────────────────────────────────────────────────────────────────────
  const badgeWallCard = new THREE.Group();
  badgeWallCard.name = 'badge-wall-card-frame';
  badgeWallCard.position.set(0, 0, -0.6);
  badgeWallCard.scale.setScalar(0.001);
  badgeWallCard.visible = false;

  // Blue rectangular pediment card backing
  const cardShape = new THREE.Shape();
  const cw = 1.9, ch = 2.6, cr = 0.2;
  cardShape.moveTo(-cw / 2 + cr, -ch / 2);
  cardShape.lineTo(cw / 2 - cr, -ch / 2);
  cardShape.quadraticCurveTo(cw / 2, -ch / 2, cw / 2, -ch / 2 + cr);
  cardShape.lineTo(cw / 2, ch / 2 - cr);
  cardShape.quadraticCurveTo(cw / 2, ch / 2, cw / 2 - cr, ch / 2);
  cardShape.lineTo(-cw / 2 + cr, ch / 2);
  cardShape.quadraticCurveTo(-cw / 2, ch / 2, -cw / 2, ch / 2 - cr);
  cardShape.lineTo(-cw / 2, -ch / 2 + cr);
  cardShape.quadraticCurveTo(-cw / 2, -ch / 2, -cw / 2 + cr, -ch / 2);

  const cardGeo = new THREE.ExtrudeGeometry(cardShape, {
    depth: 0.1,
    bevelEnabled: true,
    bevelSegments: 3,
    bevelSize: 0.04,
    bevelThickness: 0.04,
  });
  cardGeo.center();
  const cardMesh = new THREE.Mesh(cardGeo, mats.shellArmorBase);
  badgeWallCard.add(cardMesh);

  // Gold filigree border on card
  const borderGeo = new THREE.BoxGeometry(cw + 0.04, ch + 0.04, 0.04);
  const borderMesh = new THREE.Mesh(borderGeo, mats.bracketGoldChamber);
  borderMesh.position.z = 0.06;
  badgeWallCard.add(borderMesh);

  rootGroup.add(badgeWallCard);

  return {
    rootGroup,
    crystalHex,
    bracketsGroup,
    brackets,
    assembledShell,
    energyVortexRing1,
    energyVortexRing2,
    realCrownBadge,
    badgeWallCard,
  };
}
