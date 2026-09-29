import * as THREE from 'three';
import { AppleAwardMaterials } from './materials';
import { AppleBadgeMeshGroup } from './BadgeGeometry';
import {
  createChallengeHexChassis,
  getConvexHexSurfaceZ,
  attachHexExplodedView,
} from './ChallengeHexBadgeGeometry';

/**
 * Creates high-fidelity Liquid Glass Material for Strike Hexagon Medals
 */
export function createLiquidGlassMaterial(
  materials: AppleAwardMaterials,
  colorHex: number,
  isLocked: boolean = false,
  ior: number = 1.52,
  transmission: number = 0.88
): THREE.MeshPhysicalMaterial {
  if (isLocked) {
    return new THREE.MeshPhysicalMaterial({
      color: 0x22252c,
      roughness: 0.7,
      metalness: 0.3,
      transparent: true,
      opacity: 0.6,
      envMap: materials.envMap,
      envMapIntensity: 0.2,
      side: THREE.DoubleSide,
    });
  }

  return new THREE.MeshPhysicalMaterial({
    color: colorHex,
    transmission: transmission,
    opacity: 0.92,
    transparent: true,
    roughness: 0.05,
    ior: ior,
    reflectivity: 0.96,
    clearcoat: 1.0,
    clearcoatRoughness: 0.02,
    metalness: 0.08,
    specularIntensity: 1.0,
    thickness: 0.48,
    envMap: materials.envMap,
    envMapIntensity: 2.5,
    side: THREE.DoubleSide,
  });
}

/**
 * 2D Vector Path Generator for True 3D Extruded Digits ('0' - '9')
 */
export function createDigitShape(digit: string): THREE.Shape {
  const shape = new THREE.Shape();

  switch (digit) {
    case '0': {
      shape.moveTo(-0.22, 0.45);
      shape.quadraticCurveTo(-0.38, 0.45, -0.38, 0);
      shape.quadraticCurveTo(-0.38, -0.45, -0.22, -0.45);
      shape.lineTo(0.22, -0.45);
      shape.quadraticCurveTo(0.38, -0.45, 0.38, 0);
      shape.quadraticCurveTo(0.38, 0.45, 0.22, 0.45);
      shape.closePath();

      const hole = new THREE.Path();
      hole.moveTo(-0.10, 0.28);
      hole.quadraticCurveTo(0.18, 0.28, 0.18, 0);
      hole.quadraticCurveTo(0.18, -0.28, -0.10, -0.28);
      hole.quadraticCurveTo(-0.20, -0.28, -0.20, 0);
      hole.quadraticCurveTo(-0.20, 0.28, -0.10, 0.28);
      hole.closePath();
      shape.holes.push(hole);
      break;
    }
    case '1': {
      shape.moveTo(-0.18, 0.28);
      shape.lineTo(0.04, 0.45);
      shape.lineTo(0.14, 0.45);
      shape.lineTo(0.14, -0.45);
      shape.lineTo(-0.18, -0.45);
      shape.lineTo(-0.18, -0.32);
      shape.lineTo(-0.02, -0.32);
      shape.lineTo(-0.02, 0.28);
      shape.lineTo(-0.18, 0.28);
      shape.closePath();
      break;
    }
    case '2': {
      shape.moveTo(-0.32, 0.25);
      shape.quadraticCurveTo(-0.32, 0.45, 0, 0.45);
      shape.quadraticCurveTo(0.32, 0.45, 0.32, 0.22);
      shape.quadraticCurveTo(0.32, 0.05, 0.0, -0.22);
      shape.lineTo(-0.30, -0.32);
      shape.lineTo(-0.30, -0.45);
      shape.lineTo(0.34, -0.45);
      shape.lineTo(0.34, -0.32);
      shape.lineTo(-0.08, -0.32);
      shape.quadraticCurveTo(0.15, -0.10, 0.18, 0.12);
      shape.quadraticCurveTo(0.18, 0.32, 0, 0.32);
      shape.quadraticCurveTo(-0.18, 0.32, -0.18, 0.22);
      shape.closePath();
      break;
    }
    case '3': {
      shape.moveTo(-0.30, 0.32);
      shape.lineTo(0.28, 0.32);
      shape.lineTo(0.02, 0.06);
      shape.quadraticCurveTo(0.34, 0.02, 0.34, -0.20);
      shape.quadraticCurveTo(0.34, -0.45, 0, -0.45);
      shape.quadraticCurveTo(-0.32, -0.45, -0.32, -0.24);
      shape.lineTo(-0.18, -0.24);
      shape.quadraticCurveTo(-0.18, -0.32, 0, -0.32);
      shape.quadraticCurveTo(0.18, -0.32, 0.18, -0.20);
      shape.quadraticCurveTo(0.18, -0.08, -0.06, -0.08);
      shape.lineTo(-0.06, 0.04);
      shape.lineTo(0.12, 0.20);
      shape.lineTo(-0.30, 0.20);
      shape.closePath();
      break;
    }
    case '4': {
      shape.moveTo(0.08, 0.45);
      shape.lineTo(-0.34, -0.12);
      shape.lineTo(-0.34, -0.25);
      shape.lineTo(0.08, -0.25);
      shape.lineTo(0.08, -0.45);
      shape.lineTo(0.22, -0.45);
      shape.lineTo(0.22, -0.25);
      shape.lineTo(0.34, -0.25);
      shape.lineTo(0.34, -0.12);
      shape.lineTo(0.22, -0.12);
      shape.lineTo(0.22, 0.45);
      shape.closePath();

      const hole = new THREE.Path();
      hole.moveTo(0.08, 0.22);
      hole.lineTo(0.08, -0.12);
      hole.lineTo(-0.18, -0.12);
      hole.closePath();
      shape.holes.push(hole);
      break;
    }
    case '5': {
      shape.moveTo(-0.28, 0.45);
      shape.lineTo(0.30, 0.45);
      shape.lineTo(0.30, 0.32);
      shape.lineTo(-0.14, 0.32);
      shape.lineTo(-0.20, 0.08);
      shape.quadraticCurveTo(0.34, 0.12, 0.34, -0.18);
      shape.quadraticCurveTo(0.34, -0.45, 0, -0.45);
      shape.quadraticCurveTo(-0.32, -0.45, -0.32, -0.25);
      shape.lineTo(-0.18, -0.25);
      shape.quadraticCurveTo(-0.18, -0.32, 0, -0.32);
      shape.quadraticCurveTo(0.18, -0.32, 0.18, -0.18);
      shape.quadraticCurveTo(0.18, -0.04, -0.08, -0.04);
      shape.lineTo(-0.28, -0.04);
      shape.closePath();
      break;
    }
    case '6': {
      shape.moveTo(0.22, 0.36);
      shape.quadraticCurveTo(0.18, 0.45, 0, 0.45);
      shape.quadraticCurveTo(-0.36, 0.45, -0.36, -0.12);
      shape.quadraticCurveTo(-0.36, -0.45, 0, -0.45);
      shape.quadraticCurveTo(0.34, -0.45, 0.34, -0.18);
      shape.quadraticCurveTo(0.34, 0.08, 0, 0.08);
      shape.quadraticCurveTo(-0.18, 0.08, -0.22, 0.02);
      shape.quadraticCurveTo(-0.22, 0.32, 0, 0.32);
      shape.quadraticCurveTo(0.12, 0.32, 0.18, 0.26);
      shape.closePath();

      const hole = new THREE.Path();
      hole.moveTo(-0.02, -0.04);
      hole.quadraticCurveTo(0.18, -0.04, 0.18, -0.18);
      hole.quadraticCurveTo(0.18, -0.32, -0.02, -0.32);
      hole.quadraticCurveTo(-0.20, -0.32, -0.20, -0.18);
      hole.quadraticCurveTo(-0.20, -0.04, -0.02, -0.04);
      hole.closePath();
      shape.holes.push(hole);
      break;
    }
    case '7': {
      shape.moveTo(-0.32, 0.45);
      shape.lineTo(0.32, 0.45);
      shape.lineTo(0.32, 0.32);
      shape.lineTo(-0.02, -0.45);
      shape.lineTo(-0.18, -0.45);
      shape.lineTo(0.12, 0.32);
      shape.lineTo(-0.32, 0.32);
      shape.closePath();
      break;
    }
    case '8': {
      shape.moveTo(0, 0.45);
      shape.quadraticCurveTo(0.32, 0.45, 0.32, 0.22);
      shape.quadraticCurveTo(0.32, 0.05, 0, 0.0);
      shape.quadraticCurveTo(0.36, -0.05, 0.36, -0.24);
      shape.quadraticCurveTo(0.36, -0.45, 0, -0.45);
      shape.quadraticCurveTo(-0.36, -0.45, -0.36, -0.24);
      shape.quadraticCurveTo(-0.36, -0.05, 0, 0.0);
      shape.quadraticCurveTo(-0.32, 0.05, -0.32, 0.22);
      shape.quadraticCurveTo(-0.32, 0.45, 0, 0.45);
      shape.closePath();

      const holeTop = new THREE.Path();
      holeTop.moveTo(0, 0.33);
      holeTop.quadraticCurveTo(0.18, 0.33, 0.18, 0.22);
      holeTop.quadraticCurveTo(0.18, 0.11, 0, 0.11);
      holeTop.quadraticCurveTo(-0.18, 0.11, -0.18, 0.22);
      holeTop.quadraticCurveTo(-0.18, 0.33, 0, 0.33);
      holeTop.closePath();
      shape.holes.push(holeTop);

      const holeBot = new THREE.Path();
      holeBot.moveTo(0, -0.11);
      holeBot.quadraticCurveTo(0.20, -0.11, 0.20, -0.24);
      holeBot.quadraticCurveTo(0.20, -0.33, 0, -0.33);
      holeBot.quadraticCurveTo(-0.20, -0.33, -0.20, -0.24);
      holeBot.quadraticCurveTo(-0.20, -0.11, 0, -0.11);
      holeBot.closePath();
      shape.holes.push(holeBot);
      break;
    }
    case '9': {
      shape.moveTo(-0.22, -0.36);
      shape.quadraticCurveTo(-0.18, -0.45, 0, -0.45);
      shape.quadraticCurveTo(0.36, -0.45, 0.36, 0.12);
      shape.quadraticCurveTo(0.36, 0.45, 0, 0.45);
      shape.quadraticCurveTo(-0.34, 0.45, -0.34, 0.18);
      shape.quadraticCurveTo(-0.34, -0.08, 0, -0.08);
      shape.quadraticCurveTo(0.18, -0.08, 0.22, -0.02);
      shape.quadraticCurveTo(0.22, -0.32, 0, -0.32);
      shape.quadraticCurveTo(-0.12, -0.32, -0.18, -0.26);
      shape.closePath();

      const hole = new THREE.Path();
      hole.moveTo(0.02, 0.04);
      hole.quadraticCurveTo(-0.18, 0.04, -0.18, 0.18);
      hole.quadraticCurveTo(-0.18, 0.32, 0.02, 0.32);
      hole.quadraticCurveTo(0.20, 0.32, 0.20, 0.18);
      hole.quadraticCurveTo(0.20, 0.04, 0.02, 0.04);
      hole.closePath();
      shape.holes.push(hole);
      break;
    }
    default:
      shape.moveTo(-0.1, 0.2);
      shape.lineTo(0.1, 0.2);
      shape.lineTo(0.1, -0.2);
      shape.lineTo(-0.1, -0.2);
      shape.closePath();
      break;
  }

  return shape;
}

/**
 * Creates 100% True 3D Bevel Extruded Digits Cluster ("3", "7", "14", "30", "40", "50", "60", "80", "90", "100")
 */
export function create3DNumberMeshGroup(
  numberStr: string,
  material: THREE.Material,
  scale: number = 0.85,
  depth: number = 0.12,
  bevelThickness: number = 0.03
): THREE.Group {
  const group = new THREE.Group();
  const digits = numberStr.split('');
  const charWidth = 0.68 * scale;
  const totalWidth = digits.length * charWidth;
  const startX = -totalWidth * 0.5 + charWidth * 0.5;

  digits.forEach((d, idx) => {
    const shape = createDigitShape(d);
    const extrudeSettings = {
      depth: depth,
      bevelEnabled: true,
      bevelThickness: bevelThickness,
      bevelSize: 0.02,
      bevelSegments: 4,
    };
    const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geo.center();

    const mesh = new THREE.Mesh(geo, material);
    mesh.scale.set(scale, scale, scale);
    mesh.position.set(startX + idx * charWidth, 0, 0);
    mesh.castShadow = true;
    group.add(mesh);
  });

  return group;
}

/**
 * Creates a 3D Liquid Glass Convex Shell Overlay that floats over the hex chassis
 */
function createLiquidGlassCover(
  materials: AppleAwardMaterials,
  colorHex: number,
  isLocked: boolean = false
): THREE.Mesh {
  const glassMat = createLiquidGlassMaterial(materials, colorHex, isLocked, 1.56, 0.85);

  const len = 6;
  const hw = 1.22;
  const hh = 1.42;
  const midH = hh * 0.48;
  const pts = [
    new THREE.Vector2(0, hh),
    new THREE.Vector2(hw, midH),
    new THREE.Vector2(hw, -midH),
    new THREE.Vector2(0, -hh),
    new THREE.Vector2(-hw, -midH),
    new THREE.Vector2(-hw, midH),
  ];

  const pos: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const rings = 16;
  const zOffset = 0.04;

  pos.push(0, 0, getConvexHexSurfaceZ(0, 0, false, 0.12) + zOffset);
  uvs.push(0.5, 0.5);

  for (let rg = 1; rg <= rings; rg++) {
    const frac = rg / rings;
    for (let i = 0; i < len; i++) {
      const x = pts[i].x * frac;
      const y = pts[i].y * frac;
      const z = getConvexHexSurfaceZ(x, y, false, 0.12) + zOffset;
      pos.push(x, y, z);
      uvs.push((x / 1.35) * 0.5 + 0.5, (y / 1.55) * 0.5 + 0.5);
    }
  }

  for (let i = 0; i < len; i++) {
    const next = (i + 1) % len;
    indices.push(0, 1 + i, 1 + next);
  }

  for (let rg = 1; rg < rings; rg++) {
    const rStart = 1 + (rg - 1) * len;
    const nrStart = 1 + rg * len;
    for (let i = 0; i < len; i++) {
      const next = (i + 1) % len;
      const a = rStart + i;
      const b = rStart + next;
      const c = nrStart + next;
      const d = nrStart + i;
      indices.push(a, b, c);
      indices.push(a, c, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();

  return new THREE.Mesh(geo, glassMat);
}

/**
 * Creates 3D Flame Energy Geometry
 */
function create3DFlameShape(colorMat: THREE.Material, scale: number = 1.0): THREE.Group {
  const group = new THREE.Group();

  const flameShape = new THREE.Shape();
  flameShape.moveTo(0, 0.85);
  flameShape.quadraticCurveTo(0.35, 0.45, 0.38, 0.1);
  flameShape.quadraticCurveTo(0.48, -0.35, 0, -0.75);
  flameShape.quadraticCurveTo(-0.48, -0.35, -0.38, 0.1);
  flameShape.quadraticCurveTo(-0.35, 0.45, 0, 0.85);

  const flameGeo = new THREE.ExtrudeGeometry(flameShape, {
    depth: 0.12,
    bevelEnabled: true,
    bevelSize: 0.03,
    bevelThickness: 0.03,
  });

  const flameMesh = new THREE.Mesh(flameGeo, colorMat);
  flameMesh.scale.set(scale, scale, scale);
  group.add(flameMesh);

  return group;
}

/**
 * Creates "STRIKE" Insignia Ribbon plaque at bottom
 */
function createStrikeRibbon(
  materials: AppleAwardMaterials,
  label: string = 'STRIKE',
  isLocked: boolean = false
): THREE.Group {
  const group = new THREE.Group();

  const goldMat = materials.getMirrorGoldBezel(isLocked);

  const ribbonShape = new THREE.Shape();
  ribbonShape.moveTo(-0.85, 0.16);
  ribbonShape.lineTo(0.85, 0.16);
  ribbonShape.lineTo(0.72, -0.16);
  ribbonShape.lineTo(-0.72, -0.16);
  ribbonShape.closePath();

  const geo = new THREE.ExtrudeGeometry(ribbonShape, { depth: 0.06, bevelEnabled: true, bevelSize: 0.015, bevelThickness: 0.015 });
  const mesh = new THREE.Mesh(geo, goldMat);
  group.add(mesh);

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#FFD700';
  ctx.font = '800 52px "SF Pro Display", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, 256, 64);

  const texture = new THREE.CanvasTexture(canvas);
  const plaque = new THREE.Mesh(
    new THREE.PlaneGeometry(1.3, 0.24),
    new THREE.MeshStandardMaterial({ map: texture, transparent: true, roughness: 0.2, metalness: 0.8 })
  );
  plaque.position.z = 0.048;
  group.add(plaque);

  return group;
}

// ============================================================================
// 1. 3-DAY STRIKE (3天连续打卡 - Spark Ember)
// ============================================================================
export function buildStrike3DaysBadge(
  materials: AppleAwardMaterials,
  earnedDate: string = 'OCTOBER 28, 2026',
  isLocked: boolean = false
): AppleBadgeMeshGroup {
  const badge = new THREE.Group() as AppleBadgeMeshGroup;
  const cyanHex = 0x00f0ff;
  const cobaltHex = 0x0a2540;
  const silverMat = materials.getMirrorSilverBezel(isLocked);
  const cyanLacquer = materials.getColorLacquer(cyanHex, isLocked);

  const { group, frontLayer, emblemLayer, backMesh } = createChallengeHexChassis(materials, {
    topColor: cyanHex,
    bottomColor: cobaltHex,
    bezel: 'silver',
    earnedDate,
    badgeTitle: '3-DAY STRIKE',
    isLocked,
    dividerY: -0.25,
  });
  badge.add(group);

  const glassCover = createLiquidGlassCover(materials, cyanHex, isLocked);
  frontLayer.add(glassCover);

  const motif = new THREE.Group();
  motif.position.set(0, 0.12, 0.16);

  // 3D Flame Ember
  const flame = create3DFlameShape(cyanLacquer, 0.85);
  flame.position.set(0, 0.28, 0);
  motif.add(flame);

  // PROMINENT 3D NUMERAL "3"
  const digits3D = create3DNumberMeshGroup('3', silverMat, 0.95, 0.14, 0.03);
  digits3D.position.set(0, 0.08, 0.12);
  motif.add(digits3D);

  const ribbon = createStrikeRibbon(materials, '3 DAYS STRIKE', isLocked);
  ribbon.position.set(0, -0.68, 0.10);
  motif.add(ribbon);

  emblemLayer.add(motif);
  attachHexExplodedView(badge, frontLayer, emblemLayer, backMesh);

  return badge;
}

// ============================================================================
// 2. 7-DAY STRIKE (7天连续打卡 - Electric Aurora Starburst)
// ============================================================================
export function buildStrike7DaysBadge(
  materials: AppleAwardMaterials,
  earnedDate: string = 'OCTOBER 28, 2026',
  isLocked: boolean = false
): AppleBadgeMeshGroup {
  const badge = new THREE.Group() as AppleBadgeMeshGroup;
  const violetHex = 0x7b2cbf;
  const cyanHex = 0x00f0ff;
  const silverMat = materials.getMirrorSilverBezel(isLocked);
  const violetLacquer = materials.getColorLacquer(violetHex, isLocked);

  const { group, frontLayer, emblemLayer, backMesh } = createChallengeHexChassis(materials, {
    topColor: violetHex,
    bottomColor: cyanHex,
    bezel: 'silver',
    earnedDate,
    badgeTitle: '7-DAY STRIKE',
    isLocked,
    dividerY: -0.20,
  });
  badge.add(group);

  const glassCover = createLiquidGlassCover(materials, violetHex, isLocked);
  frontLayer.add(glassCover);

  const motif = new THREE.Group();
  motif.position.set(0, 0.12, 0.16);

  // 7-Point Aurora Starburst Wheel with 7 Studs
  for (let i = 0; i < 7; i++) {
    const angle = (i * Math.PI * 2) / 7;
    const rayGeo = new THREE.ConeGeometry(0.06, 0.45, 8);
    const ray = new THREE.Mesh(rayGeo, violetLacquer);
    ray.position.set(Math.cos(angle) * 0.72, Math.sin(angle) * 0.72 + 0.18, 0.02);
    ray.rotation.z = angle - Math.PI / 2;
    motif.add(ray);

    // 7 Glowing Studs
    const studGeo = new THREE.SphereGeometry(0.045, 12, 12);
    const stud = new THREE.Mesh(studGeo, silverMat);
    stud.position.set(Math.cos(angle) * 0.88, Math.sin(angle) * 0.88 + 0.18, 0.04);
    motif.add(stud);
  }

  // PROMINENT 3D NUMERAL "7"
  const digits3D = create3DNumberMeshGroup('7', silverMat, 0.95, 0.14, 0.03);
  digits3D.position.set(0, 0.18, 0.12);
  motif.add(digits3D);

  const ribbon = createStrikeRibbon(materials, '7 DAYS STRIKE', isLocked);
  ribbon.position.set(0, -0.68, 0.10);
  motif.add(ribbon);

  emblemLayer.add(motif);
  attachHexExplodedView(badge, frontLayer, emblemLayer, backMesh);

  return badge;
}

// ============================================================================
// 3. 14-DAY STRIKE (14天连续打卡 - Emerald Dual-Blade)
// ============================================================================
export function buildStrike14DaysBadge(
  materials: AppleAwardMaterials,
  earnedDate: string = 'OCTOBER 28, 2026',
  isLocked: boolean = false
): AppleBadgeMeshGroup {
  const badge = new THREE.Group() as AppleBadgeMeshGroup;
  const emeraldHex = 0x00e676;
  const forestHex = 0x0a3a22;
  const silverMat = materials.getMirrorSilverBezel(isLocked);
  const emeraldMat = materials.getColorLacquer(emeraldHex, isLocked);

  const { group, frontLayer, emblemLayer, backMesh } = createChallengeHexChassis(materials, {
    topColor: emeraldHex,
    bottomColor: forestHex,
    bezel: 'silver',
    earnedDate,
    badgeTitle: '14-DAY STRIKE',
    isLocked,
    dividerY: -0.22,
  });
  badge.add(group);

  const glassCover = createLiquidGlassCover(materials, emeraldHex, isLocked);
  frontLayer.add(glassCover);

  const motif = new THREE.Group();
  motif.position.set(0, 0.12, 0.16);

  // Dual Crossed Energy Blades cutting through glass
  [-0.38, 0.38].forEach((rot, idx) => {
    const bladeGeo = new THREE.BoxGeometry(0.10, 1.25, 0.06);
    const blade = new THREE.Mesh(bladeGeo, silverMat);
    blade.rotation.z = idx === 0 ? 0.42 : -0.42;
    blade.position.set(0, 0.22, 0.04);
    motif.add(blade);
  });

  // 14 Faceted Studs around Inner Bezel
  for (let i = 0; i < 14; i++) {
    const ang = (i * Math.PI * 2) / 14;
    const stud = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.08, 6), emeraldMat);
    stud.position.set(Math.cos(ang) * 0.95, Math.sin(ang) * 0.95 + 0.12, 0.05);
    motif.add(stud);
  }

  // PROMINENT 3D NUMERALS "14"
  const digits3D = create3DNumberMeshGroup('14', emeraldMat, 0.88, 0.14, 0.03);
  digits3D.position.set(0, 0.18, 0.14);
  motif.add(digits3D);

  const ribbon = createStrikeRibbon(materials, '14 DAYS STRIKE', isLocked);
  ribbon.position.set(0, -0.68, 0.10);
  motif.add(ribbon);

  emblemLayer.add(motif);
  attachHexExplodedView(badge, frontLayer, emblemLayer, backMesh);

  return badge;
}

// ============================================================================
// 4. 30-DAY STRIKE (30天月度连胜 - Solar Flare Gold Halo)
// ============================================================================
export function buildStrike30DaysBadge(
  materials: AppleAwardMaterials,
  earnedDate: string = 'OCTOBER 28, 2026',
  isLocked: boolean = false
): AppleBadgeMeshGroup {
  const badge = new THREE.Group() as AppleBadgeMeshGroup;
  const goldHex = 0xffd60a;
  const orangeHex = 0xff6b00;
  const goldMat = materials.getMirrorGoldBezel(isLocked);
  const amberLacquer = materials.getColorLacquer(goldHex, isLocked);

  const { group, frontLayer, emblemLayer, backMesh } = createChallengeHexChassis(materials, {
    topColor: goldHex,
    bottomColor: orangeHex,
    bezel: 'gold',
    earnedDate,
    badgeTitle: '30-DAY STRIKE',
    isLocked,
    dividerY: -0.18,
  });
  badge.add(group);

  const glassCover = createLiquidGlassCover(materials, goldHex, isLocked);
  frontLayer.add(glassCover);

  const motif = new THREE.Group();
  motif.position.set(0, 0.12, 0.16);

  // 12-Point Solar Ray Halo
  for (let deg = 0; deg < 360; deg += 30) {
    const rad = (deg * Math.PI) / 180;
    const rayGeo = new THREE.ConeGeometry(0.07, 0.42, 8);
    const ray = new THREE.Mesh(rayGeo, amberLacquer);
    ray.position.set(Math.cos(rad) * 0.76, Math.sin(rad) * 0.76 + 0.18, 0.02);
    ray.rotation.z = rad - Math.PI / 2;
    motif.add(ray);
  }

  // Floating Inner Solar Gold Ring
  const solarRing = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.05, 16, 48), goldMat);
  solarRing.position.set(0, 0.18, 0.04);
  motif.add(solarRing);

  // PROMINENT 3D NUMERALS "30"
  const digits3D = create3DNumberMeshGroup('30', goldMat, 0.88, 0.14, 0.03);
  digits3D.position.set(0, 0.18, 0.14);
  motif.add(digits3D);

  const ribbon = createStrikeRibbon(materials, '30 DAYS STRIKE', isLocked);
  ribbon.position.set(0, -0.68, 0.10);
  motif.add(ribbon);

  emblemLayer.add(motif);
  attachHexExplodedView(badge, frontLayer, emblemLayer, backMesh);

  return badge;
}

// ============================================================================
// 5. 40-DAY STRIKE (40天连续打卡 - Crimson Plasma Orbital Ring)
// ============================================================================
export function buildStrike40DaysBadge(
  materials: AppleAwardMaterials,
  earnedDate: string = 'OCTOBER 28, 2026',
  isLocked: boolean = false
): AppleBadgeMeshGroup {
  const badge = new THREE.Group() as AppleBadgeMeshGroup;
  const crimsonHex = 0xfa114f;
  const darkCrimsonHex = 0x3d000f;
  const spaceGray = materials.getSpaceGrayBezel(isLocked);
  const crimsonLacquer = materials.getColorLacquer(crimsonHex, isLocked);

  const { group, frontLayer, emblemLayer, backMesh } = createChallengeHexChassis(materials, {
    topColor: crimsonHex,
    bottomColor: darkCrimsonHex,
    bezel: 'space-gray',
    earnedDate,
    badgeTitle: '40-DAY STRIKE',
    isLocked,
    dividerY: -0.22,
  });
  badge.add(group);

  const glassCover = createLiquidGlassCover(materials, crimsonHex, isLocked);
  frontLayer.add(glassCover);

  const motif = new THREE.Group();
  motif.position.set(0, 0.12, 0.16);

  // Orbital Plasma Ring inclined at 45 degrees
  const plasmaGeo = new THREE.TorusGeometry(0.78, 0.07, 16, 64);
  const plasmaMesh = new THREE.Mesh(plasmaGeo, crimsonLacquer);
  plasmaMesh.rotation.x = Math.PI / 3.5;
  plasmaMesh.position.set(0, 0.20, 0.04);
  motif.add(plasmaMesh);

  // 4 Corner Energy Claws
  [Math.PI / 4, (3 * Math.PI) / 4, (5 * Math.PI) / 4, (7 * Math.PI) / 4].forEach((ang) => {
    const claw = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.35, 6), spaceGray);
    claw.position.set(Math.cos(ang) * 0.88, Math.sin(ang) * 0.88 + 0.20, 0.06);
    claw.rotation.z = ang - Math.PI / 2;
    motif.add(claw);
  });

  // PROMINENT 3D NUMERALS "40"
  const digits3D = create3DNumberMeshGroup('40', spaceGray, 0.88, 0.14, 0.03);
  digits3D.position.set(0, 0.18, 0.14);
  motif.add(digits3D);

  const ribbon = createStrikeRibbon(materials, '40 DAYS STRIKE', isLocked);
  ribbon.position.set(0, -0.68, 0.10);
  motif.add(ribbon);

  emblemLayer.add(motif);
  attachHexExplodedView(badge, frontLayer, emblemLayer, backMesh);

  return badge;
}

// ============================================================================
// 6. 50-DAY STRIKE (50天半百纪元 - Quantum Amethyst Octahedron)
// ============================================================================
export function buildStrike50DaysBadge(
  materials: AppleAwardMaterials,
  earnedDate: string = 'OCTOBER 28, 2026',
  isLocked: boolean = false
): AppleBadgeMeshGroup {
  const badge = new THREE.Group() as AppleBadgeMeshGroup;
  const amethystHex = 0x9d4edd;
  const cosmicHex = 0x10002b;
  const spaceGray = materials.getSpaceGrayBezel(isLocked);
  const amethystMat = materials.getColorLacquer(amethystHex, isLocked);

  const { group, frontLayer, emblemLayer, backMesh } = createChallengeHexChassis(materials, {
    topColor: amethystHex,
    bottomColor: cosmicHex,
    bezel: 'space-gray',
    earnedDate,
    badgeTitle: '50-DAY STRIKE',
    isLocked,
    dividerY: -0.20,
  });
  badge.add(group);

  const glassCover = createLiquidGlassCover(materials, amethystHex, isLocked);
  frontLayer.add(glassCover);

  const motif = new THREE.Group();
  motif.position.set(0, 0.12, 0.16);

  // Floating Quantum Crystal Octahedron Core
  const octaGeo = new THREE.OctahedronGeometry(0.52, 0);
  const octaMesh = new THREE.Mesh(octaGeo, amethystMat);
  octaMesh.position.set(0, 0.42, 0.08);
  octaMesh.rotation.y = Math.PI / 4;
  motif.add(octaMesh);

  // 50-Day Star Medallion Halo
  for (let i = 0; i < 5; i++) {
    const ang = (i * Math.PI * 2) / 5 - Math.PI / 2;
    const starNode = new THREE.Mesh(new THREE.IcosahedronGeometry(0.08, 0), spaceGray);
    starNode.position.set(Math.cos(ang) * 0.85, Math.sin(ang) * 0.85 + 0.20, 0.06);
    motif.add(starNode);
  }

  // PROMINENT 3D NUMERALS "50"
  const digits3D = create3DNumberMeshGroup('50', spaceGray, 0.88, 0.14, 0.03);
  digits3D.position.set(0, 0.02, 0.14);
  motif.add(digits3D);

  const ribbon = createStrikeRibbon(materials, '50 DAYS STRIKE', isLocked);
  ribbon.position.set(0, -0.68, 0.10);
  motif.add(ribbon);

  emblemLayer.add(motif);
  attachHexExplodedView(badge, frontLayer, emblemLayer, backMesh);

  return badge;
}

// ============================================================================
// 7. 60-DAY STRIKE (60天双月里程碑 - Glacial Ice Double Hexagon)
// ============================================================================
export function buildStrike60DaysBadge(
  materials: AppleAwardMaterials,
  earnedDate: string = 'OCTOBER 28, 2026',
  isLocked: boolean = false
): AppleBadgeMeshGroup {
  const badge = new THREE.Group() as AppleBadgeMeshGroup;
  const iceHex = 0x48cae4;
  const sapphireHex = 0x03045e;
  const silverMat = materials.getMirrorSilverBezel(isLocked);
  const iceGlass = createLiquidGlassMaterial(materials, iceHex, isLocked, 1.62, 0.92);

  const { group, frontLayer, emblemLayer, backMesh } = createChallengeHexChassis(materials, {
    topColor: iceHex,
    bottomColor: sapphireHex,
    bezel: 'silver',
    earnedDate,
    badgeTitle: '60-DAY STRIKE',
    isLocked,
    dividerY: -0.22,
  });
  badge.add(group);

  const glassCover = createLiquidGlassCover(materials, iceHex, isLocked);
  frontLayer.add(glassCover);

  const motif = new THREE.Group();
  motif.position.set(0, 0.12, 0.16);

  // Floating Nested Inner Crystal Glass Hexagon Plate
  const innerHexGeo = new THREE.CylinderGeometry(0.72, 0.72, 0.08, 6);
  const innerHexMesh = new THREE.Mesh(innerHexGeo, iceGlass);
  innerHexMesh.rotation.x = Math.PI / 2;
  innerHexMesh.position.set(0, 0.20, 0.04);
  motif.add(innerHexMesh);

  // Ice Crystal Shards along perimeter
  for (let i = 0; i < 6; i++) {
    const ang = (i * Math.PI) / 3;
    const shard = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.35, 4), silverMat);
    shard.position.set(Math.cos(ang) * 0.88, Math.sin(ang) * 0.88 + 0.20, 0.06);
    shard.rotation.z = ang - Math.PI / 2;
    motif.add(shard);
  }

  // PROMINENT 3D NUMERALS "60"
  const digits3D = create3DNumberMeshGroup('60', silverMat, 0.88, 0.14, 0.03);
  digits3D.position.set(0, 0.20, 0.14);
  motif.add(digits3D);

  const ribbon = createStrikeRibbon(materials, '60 DAYS STRIKE', isLocked);
  ribbon.position.set(0, -0.68, 0.10);
  motif.add(ribbon);

  emblemLayer.add(motif);
  attachHexExplodedView(badge, frontLayer, emblemLayer, backMesh);

  return badge;
}

// ============================================================================
// 8. 80-DAY STRIKE (80天星云极光 - Holographic Nebula Prism)
// ============================================================================
export function buildStrike80DaysBadge(
  materials: AppleAwardMaterials,
  earnedDate: string = 'OCTOBER 28, 2026',
  isLocked: boolean = false
): AppleBadgeMeshGroup {
  const badge = new THREE.Group() as AppleBadgeMeshGroup;
  const magentaHex = 0xff007f;
  const indigoHex = 0x240046;
  const silverMat = materials.getMirrorSilverBezel(isLocked);
  const magentaLacquer = materials.getColorLacquer(magentaHex, isLocked);

  const { group, frontLayer, emblemLayer, backMesh } = createChallengeHexChassis(materials, {
    topColor: magentaHex,
    bottomColor: indigoHex,
    bezel: 'silver',
    earnedDate,
    badgeTitle: '80-DAY STRIKE',
    isLocked,
    dividerY: -0.20,
  });
  badge.add(group);

  const glassCover = createLiquidGlassCover(materials, magentaHex, isLocked);
  frontLayer.add(glassCover);

  const motif = new THREE.Group();
  motif.position.set(0, 0.12, 0.16);

  // Floating 3D Dual-Cone Diamond Vortex
  const diamondGeo = new THREE.ConeGeometry(0.48, 0.92, 4);
  const diamondMesh = new THREE.Mesh(diamondGeo, magentaLacquer);
  diamondMesh.position.set(0, 0.38, 0.06);
  motif.add(diamondMesh);

  // 8 Orbital Ring Nodes
  for (let i = 0; i < 8; i++) {
    const ang = (i * Math.PI * 2) / 8;
    const node = new THREE.Mesh(new THREE.SphereGeometry(0.048, 12, 12), silverMat);
    node.position.set(Math.cos(ang) * 0.88, Math.sin(ang) * 0.88 + 0.20, 0.06);
    motif.add(node);
  }

  // PROMINENT 3D NUMERALS "80"
  const digits3D = create3DNumberMeshGroup('80', silverMat, 0.88, 0.14, 0.03);
  digits3D.position.set(0, -0.02, 0.14);
  motif.add(digits3D);

  const ribbon = createStrikeRibbon(materials, '80 DAYS STRIKE', isLocked);
  ribbon.position.set(0, -0.68, 0.10);
  motif.add(ribbon);

  emblemLayer.add(motif);
  attachHexExplodedView(badge, frontLayer, emblemLayer, backMesh);

  return badge;
}

// ============================================================================
// 9. 90-DAY STRIKE (90天季度霸主 - Titanium Dragon Wings)
// ============================================================================
export function buildStrike90DaysBadge(
  materials: AppleAwardMaterials,
  earnedDate: string = 'OCTOBER 28, 2026',
  isLocked: boolean = false
): AppleBadgeMeshGroup {
  const badge = new THREE.Group() as AppleBadgeMeshGroup;
  const amberHex = 0xffb703;
  const graphiteHex = 0x121212;
  const goldMat = materials.getMirrorGoldBezel(isLocked);
  const amberLacquer = materials.getColorLacquer(amberHex, isLocked);

  const { group, frontLayer, emblemLayer, backMesh } = createChallengeHexChassis(materials, {
    topColor: amberHex,
    bottomColor: graphiteHex,
    bezel: 'gold',
    earnedDate,
    badgeTitle: '90-DAY STRIKE',
    isLocked,
    dividerY: -0.18,
  });
  badge.add(group);

  const glassCover = createLiquidGlassCover(materials, amberHex, isLocked);
  frontLayer.add(glassCover);

  const motif = new THREE.Group();
  motif.position.set(0, 0.12, 0.16);

  // Platinum Dragon Flame Wings sweeping outside hex boundaries
  [-0.62, 0.62].forEach((x, idx) => {
    const wingShape = new THREE.Shape();
    wingShape.moveTo(0, 0);
    wingShape.lineTo(0.55, 0.48);
    wingShape.lineTo(0.28, -0.52);
    wingShape.closePath();
    const wingGeo = new THREE.ExtrudeGeometry(wingShape, { depth: 0.06, bevelEnabled: true, bevelSize: 0.015 });
    const wing = new THREE.Mesh(wingGeo, goldMat);
    wing.position.set(x, 0.24, 0.04);
    wing.rotation.y = idx === 0 ? -0.25 : 0.25;
    motif.add(wing);
  });

  // PROMINENT 3D 24K GOLD NUMERALS "90"
  const digits3D = create3DNumberMeshGroup('90', goldMat, 0.88, 0.14, 0.03);
  digits3D.position.set(0, 0.20, 0.14);
  motif.add(digits3D);

  const ribbon = createStrikeRibbon(materials, '90 DAYS STRIKE', isLocked);
  ribbon.position.set(0, -0.68, 0.10);
  motif.add(ribbon);

  emblemLayer.add(motif);
  attachHexExplodedView(badge, frontLayer, emblemLayer, backMesh);

  return badge;
}

// ============================================================================
// 10. 100-DAY STRIKE (100天百日神话皇冠 - Apex Mythic Crown Centurion)
// ============================================================================
export function buildStrike100DaysBadge(
  materials: AppleAwardMaterials,
  earnedDate: string = 'OCTOBER 28, 2026',
  isLocked: boolean = false
): AppleBadgeMeshGroup {
  const badge = new THREE.Group() as AppleBadgeMeshGroup;
  const apexGoldHex = 0xffd700;
  const royalMagentaHex = 0x800080;
  const goldMat = materials.getMirrorGoldBezel(isLocked);
  const cyanLacquer = materials.getColorLacquer(0x00f0ff, isLocked);

  const { group, frontLayer, emblemLayer, backMesh } = createChallengeHexChassis(materials, {
    topColor: apexGoldHex,
    bottomColor: royalMagentaHex,
    bezel: 'gold',
    earnedDate,
    badgeTitle: '100-DAY STRIKE APEX',
    isLocked,
    dividerY: -0.15,
  });
  badge.add(group);

  const glassCover = createLiquidGlassCover(materials, apexGoldHex, isLocked);
  frontLayer.add(glassCover);

  const motif = new THREE.Group();
  motif.position.set(0, 0.12, 0.16);

  // Triple-Tiered 3D Mythic Crown
  const crownGroup = new THREE.Group();
  crownGroup.position.set(0, 0.52, 0.06);

  // 5 Crown Peaks with Cyan Gems
  [-0.42, -0.21, 0, 0.21, 0.42].forEach((x, idx) => {
    const isCenter = idx === 2;
    const isMid = idx === 1 || idx === 3;
    const h = isCenter ? 0.44 : isMid ? 0.35 : 0.26;
    const peakGeo = new THREE.ConeGeometry(0.10, h, 8);
    const peak = new THREE.Mesh(peakGeo, goldMat);
    peak.position.set(x, 0, 0);
    crownGroup.add(peak);

    const gemGeo = new THREE.SphereGeometry(0.055, 12, 12);
    const gem = new THREE.Mesh(gemGeo, cyanLacquer);
    gem.position.set(x, h * 0.55, 0.02);
    crownGroup.add(gem);
  });

  motif.add(crownGroup);

  // PROMINENT 3D 24K GOLD NUMERALS "100"
  const digits3D = create3DNumberMeshGroup('100', goldMat, 0.82, 0.16, 0.035);
  digits3D.position.set(0, 0.02, 0.16);
  motif.add(digits3D);

  const ribbon = createStrikeRibbon(materials, '100 DAYS APEX', isLocked);
  ribbon.position.set(0, -0.68, 0.12);
  motif.add(ribbon);

  emblemLayer.add(motif);
  attachHexExplodedView(badge, frontLayer, emblemLayer, backMesh);

  return badge;
}
