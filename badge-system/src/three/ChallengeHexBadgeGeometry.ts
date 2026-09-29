import * as THREE from 'three';
import { AppleAwardMaterials } from './materials';
import { AppleBadgeMeshGroup } from './BadgeGeometry';

/**
 * ------------------------------------------------------------------
 * APPLE CHALLENGE HEXAGON GEOMETRY ENGINE (IMG_2948.jpg Apple Medal)
 * Continuous filleted vertical hexagonal medal with dual-zone enamel,
 * high-specular beveled metal bezel, and 3D relief character motif.
 * Features true 3D convex dome curvature bulging outward ("曲面版外凸").
 * ------------------------------------------------------------------
 */

export interface HexChassisOptions {
  topColor: number;
  bottomColor: number;
  bezel: 'silver' | 'gold' | 'space-gray';
  earnedDate: string;
  badgeTitle: string;
  isLocked?: boolean;
  dividerAngle?: number;
  dividerY?: number;
}

/**
 * Master Curvature Function: Calculates 3D convex bulging outward surface Z
 * Peak center crown height is +0.32 above the perimeter rim.
 */
export function getConvexHexSurfaceZ(
  x: number,
  y: number,
  isBack: boolean = false,
  thickness: number = 0.12
): number {
  const normX = x / 1.32;
  const normY = y / 1.52;
  const rSq = normX * normX + normY * normY * 0.85;
  const rNorm = Math.min(1.0, Math.sqrt(rSq));

  // Prominent parabolic convex dome bulging outward toward the viewer
  const convexDome = Math.pow(Math.max(0, 1.0 - rNorm * rNorm), 1.15) * 0.32;
  const longBow = (1.0 - Math.min(1.0, normY * normY)) * 0.08;

  if (!isBack) {
    return convexDome + longBow;
  } else {
    const backDome = (1.0 - rNorm * rNorm) * 0.04;
    return -thickness - backDome;
  }
}

/**
 * Creates a smooth filleted vertical hexagon shape matching IMG_2948
 */
export function createRoundedHexShape(
  width: number = 2.62,
  height: number = 3.02,
  cornerRadius: number = 0.24
): THREE.Shape {
  const shape = new THREE.Shape();

  const hw = width * 0.5;
  const hh = height * 0.5;
  const midH = hh * 0.48; // side shoulder height

  // 6 Vertices of vertical hexagon with top & bottom apex
  const vertices: THREE.Vector2[] = [
    new THREE.Vector2(0, hh),      // 0: Top Apex
    new THREE.Vector2(hw, midH),   // 1: Upper Right
    new THREE.Vector2(hw, -midH),  // 2: Lower Right
    new THREE.Vector2(0, -hh),     // 3: Bottom Apex
    new THREE.Vector2(-hw, -midH), // 4: Lower Left
    new THREE.Vector2(-hw, midH),  // 5: Upper Left
  ];

  const n = vertices.length;

  for (let i = 0; i < n; i++) {
    const prev = vertices[(i + n - 1) % n];
    const curr = vertices[i];
    const next = vertices[(i + 1) % n];

    const vIn = new THREE.Vector2().subVectors(prev, curr).normalize();
    const vOut = new THREE.Vector2().subVectors(next, curr).normalize();

    const pStart = new THREE.Vector2().addVectors(curr, vIn.clone().multiplyScalar(cornerRadius));
    const pEnd = new THREE.Vector2().addVectors(curr, vOut.clone().multiplyScalar(cornerRadius));

    if (i === 0) {
      shape.moveTo(pStart.x, pStart.y);
    } else {
      shape.lineTo(pStart.x, pStart.y);
    }
    shape.quadraticCurveTo(curr.x, curr.y, pEnd.x, pEnd.y);
  }

  shape.closePath();
  return shape;
}

/**
 * Builds the Apple Challenge Hexagonal Medal Chassis with 3D Convex Outward Curvature ("曲面版外凸")
 */
export function createChallengeHexChassis(
  materials: AppleAwardMaterials,
  options: HexChassisOptions,
  badge?: AppleBadgeMeshGroup
): {
  group: THREE.Group;
  frontLayer: THREE.Group;
  emblemLayer: THREE.Group;
  backMesh: THREE.Mesh;
} {
  const {
    topColor,
    bottomColor,
    bezel,
    earnedDate,
    badgeTitle,
    isLocked = false,
    dividerY = -0.15,
  } = options;

  const group = new THREE.Group();
  const frontLayer = new THREE.Group();
  const emblemLayer = new THREE.Group();

  let bezelMat: THREE.MeshStandardMaterial;
  if (bezel === 'gold') {
    bezelMat = materials.getMirrorGoldBezel(isLocked);
  } else if (bezel === 'space-gray') {
    bezelMat = materials.getSpaceGrayBezel(isLocked);
  } else {
    bezelMat = materials.getMirrorSilverBezel(isLocked);
  }

  const topEnamelMat = materials.getColorLacquer(topColor, isLocked);
  const bottomEnamelMat = materials.getColorLacquer(bottomColor, isLocked);
  const backMat = materials.getAppleBackShell(earnedDate, badgeTitle, isLocked);

  const thickness = 0.12;

  // Sample perimeter points along the filleted hexagon
  const hexShape = createRoundedHexShape(2.62, 3.02, 0.24);
  const pts = hexShape.getPoints(96);
  const len = pts.length;

  // 1. Watertight Outer Bevel Rim Ribbon (Connecting curved front to curved back)
  const rimPos: number[] = [];
  const rimIdx: number[] = [];

  for (let i = 0; i < len; i++) {
    const x = pts[i].x;
    const y = pts[i].y;
    const zF = getConvexHexSurfaceZ(x, y, false, thickness);
    const zB = getConvexHexSurfaceZ(x, y, true, thickness);
    rimPos.push(x, y, zF);
    rimPos.push(x, y, zB);
  }

  for (let i = 0; i < len; i++) {
    const next = (i + 1) % len;
    const f1 = i * 2;
    const b1 = i * 2 + 1;
    const f2 = next * 2;
    const b2 = next * 2 + 1;
    rimIdx.push(f1, f2, b1);
    rimIdx.push(b1, f2, b2);
  }

  const rimGeo = new THREE.BufferGeometry();
  rimGeo.setAttribute('position', new THREE.Float32BufferAttribute(rimPos, 3));
  rimGeo.setIndex(rimIdx);
  rimGeo.computeVertexNormals();
  const rimMesh = new THREE.Mesh(rimGeo, bezelMat);
  rimMesh.castShadow = true;
  rimMesh.receiveShadow = true;
  group.add(rimMesh);

  // 2. Base Dished/Crowned Radial Front Plate (Mirror Metal Core)
  const hexPos: number[] = [];
  const hexUv: number[] = [];
  const hexIdx: number[] = [];
  const rings = 24;

  hexPos.push(0, 0, getConvexHexSurfaceZ(0, 0, false, thickness));
  hexUv.push(0.5, 0.5);

  for (let rg = 1; rg <= rings; rg++) {
    const frac = rg / rings;
    for (let i = 0; i < len; i++) {
      const x = pts[i].x * frac;
      const y = pts[i].y * frac;
      const z = getConvexHexSurfaceZ(x, y, false, thickness);
      hexPos.push(x, y, z);
      hexUv.push((x / 1.35) * 0.5 + 0.5, (y / 1.55) * 0.5 + 0.5);
    }
  }

  for (let i = 0; i < len; i++) {
    const next = (i + 1) % len;
    hexIdx.push(0, 1 + i, 1 + next);
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
      hexIdx.push(a, b, c);
      hexIdx.push(a, c, d);
    }
  }

  const baseGeo = new THREE.BufferGeometry();
  baseGeo.setAttribute('position', new THREE.Float32BufferAttribute(hexPos, 3));
  baseGeo.setAttribute('uv', new THREE.Float32BufferAttribute(hexUv, 2));
  baseGeo.setIndex(hexIdx);
  baseGeo.computeVertexNormals();
  const baseMesh = new THREE.Mesh(baseGeo, bezelMat);
  baseMesh.castShadow = true;
  baseMesh.receiveShadow = true;
  group.add(baseMesh);

  // 3. High-Specular Perimeter Bezel Accent Ring (Follows 3D curved perimeter)
  const curve3Pts: THREE.Vector3[] = [];
  for (let i = 0; i < len; i++) {
    const x = pts[i].x;
    const y = pts[i].y;
    const z = getConvexHexSurfaceZ(x, y, false, thickness) + 0.006;
    curve3Pts.push(new THREE.Vector3(x, y, z));
  }
  curve3Pts.push(curve3Pts[0]);
  const rimCurve = new THREE.CatmullRomCurve3(curve3Pts);
  const rimTubeGeo = new THREE.TubeGeometry(rimCurve, 96, 0.035, 12, true);
  const rimTubeMesh = new THREE.Mesh(rimTubeGeo, bezelMat);
  rimTubeMesh.castShadow = true;
  group.add(rimTubeMesh);

  // 4. Curved Dual-Zone Enamel Layers: Top Enamel & Bottom Enamel
  // Constructed on the exact same convex dome (zOffset = +0.012)
  const enamelPos: number[] = [];
  const enamelUv: number[] = [];
  const topIndices: number[] = [];
  const bottomIndices: number[] = [];

  const zEnamelOffset = 0.012;
  enamelPos.push(0, 0, getConvexHexSurfaceZ(0, 0, false, thickness) + zEnamelOffset);
  enamelUv.push(0.5, 0.5);

  for (let rg = 1; rg <= rings; rg++) {
    const frac = rg / rings;
    for (let i = 0; i < len; i++) {
      const x = pts[i].x * frac;
      const y = pts[i].y * frac;
      const z = getConvexHexSurfaceZ(x, y, false, thickness) + zEnamelOffset;
      enamelPos.push(x, y, z);
      enamelUv.push((x / 1.35) * 0.5 + 0.5, (y / 1.55) * 0.5 + 0.5);
    }
  }

  const cutAngle = 0.22; // subtle slope
  const isPointAboveCut = (x: number, y: number) => {
    return y >= dividerY + Math.tan(cutAngle) * x;
  };

  // Center triangle fan
  for (let i = 0; i < len; i++) {
    const next = (i + 1) % len;
    const midX = (pts[i].x + pts[next].x) / (2 * rings);
    const midY = (pts[i].y + pts[next].y) / (2 * rings);
    if (isPointAboveCut(midX, midY)) {
      topIndices.push(0, 1 + i, 1 + next);
    } else {
      bottomIndices.push(0, 1 + i, 1 + next);
    }
  }

  // Intermediate concentric rings
  for (let rg = 1; rg < rings; rg++) {
    const rStart = 1 + (rg - 1) * len;
    const nrStart = 1 + rg * len;
    for (let i = 0; i < len; i++) {
      const next = (i + 1) % len;
      const a = rStart + i;
      const b = rStart + next;
      const c = nrStart + next;
      const d = nrStart + i;

      const midX = (enamelPos[a * 3] + enamelPos[b * 3] + enamelPos[c * 3] + enamelPos[d * 3]) * 0.25;
      const midY = (enamelPos[a * 3 + 1] + enamelPos[b * 3 + 1] + enamelPos[c * 3 + 1] + enamelPos[d * 3 + 1]) * 0.25;

      if (isPointAboveCut(midX, midY)) {
        topIndices.push(a, b, c);
        topIndices.push(a, c, d);
      } else {
        bottomIndices.push(a, b, c);
        bottomIndices.push(a, c, d);
      }
    }
  }

  const topGeo = new THREE.BufferGeometry();
  topGeo.setAttribute('position', new THREE.Float32BufferAttribute(enamelPos, 3));
  topGeo.setAttribute('uv', new THREE.Float32BufferAttribute(enamelUv, 2));
  topGeo.setIndex(topIndices);
  topGeo.computeVertexNormals();
  const topMesh = new THREE.Mesh(topGeo, topEnamelMat);
  topMesh.castShadow = true;
  frontLayer.add(topMesh);

  const bottomGeo = new THREE.BufferGeometry();
  bottomGeo.setAttribute('position', new THREE.Float32BufferAttribute(enamelPos, 3));
  bottomGeo.setAttribute('uv', new THREE.Float32BufferAttribute(enamelUv, 2));
  bottomGeo.setIndex(bottomIndices);
  bottomGeo.computeVertexNormals();
  const bottomMesh = new THREE.Mesh(bottomGeo, bottomEnamelMat);
  bottomMesh.castShadow = true;
  frontLayer.add(bottomMesh);

  // 5. Curved Polished Metallic Division Ridge (Follows the convex dome)
  const dividerPts: THREE.Vector3[] = [];
  const numDivSteps = 36;
  const xMin = -1.25;
  const xMax = 1.25;
  for (let s = 0; s <= numDivSteps; s++) {
    const t = s / numDivSteps;
    const x = xMin + t * (xMax - xMin);
    const y = dividerY + Math.tan(cutAngle) * x;
    const z = getConvexHexSurfaceZ(x, y, false, thickness) + 0.022;
    dividerPts.push(new THREE.Vector3(x, y, z));
  }
  const dividerCurve = new THREE.CatmullRomCurve3(dividerPts);
  const dividerGeo = new THREE.TubeGeometry(dividerCurve, 40, 0.026, 12, false);
  const dividerMesh = new THREE.Mesh(dividerGeo, bezelMat);
  dividerMesh.castShadow = true;
  frontLayer.add(dividerMesh);

  group.add(frontLayer);
  emblemLayer.position.z = 0.28;
  group.add(emblemLayer);

  // 6. Curved Back Shell with Laser Engraving
  const backPos: number[] = [];
  const backUv: number[] = [];
  const backIdx: number[] = [];

  backPos.push(0, 0, getConvexHexSurfaceZ(0, 0, true, thickness));
  backUv.push(0.5, 0.5);

  for (let rg = 1; rg <= rings; rg++) {
    const frac = rg / rings;
    for (let i = 0; i < len; i++) {
      const x = pts[i].x * frac;
      const y = pts[i].y * frac;
      const z = getConvexHexSurfaceZ(x, y, true, thickness);
      backPos.push(x, y, z);
      backUv.push((-(x / 1.35) * 0.5 + 0.5), (y / 1.55) * 0.5 + 0.5);
    }
  }

  for (let i = 0; i < len; i++) {
    const next = (i + 1) % len;
    backIdx.push(0, 1 + next, 1 + i);
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
      backIdx.push(a, c, b);
      backIdx.push(a, d, c);
    }
  }

  const backGeo = new THREE.BufferGeometry();
  backGeo.setAttribute('position', new THREE.Float32BufferAttribute(backPos, 3));
  backGeo.setAttribute('uv', new THREE.Float32BufferAttribute(backUv, 2));
  backGeo.setIndex(backIdx);
  backGeo.computeVertexNormals();
  const backMesh = new THREE.Mesh(backGeo, backMat);
  group.add(backMesh);

  if (badge) {
    attachHexExplodedView(badge, frontLayer, emblemLayer, backMesh);
  }

  return { group, frontLayer, emblemLayer, backMesh };
}

/**
 * Standard exploded view controller for convex challenge badges
 */
export function attachHexExplodedView(
  badge: AppleBadgeMeshGroup,
  frontLayer: THREE.Group,
  emblemLayer: THREE.Group,
  backMesh: THREE.Mesh
) {
  badge.setExplodedView = (f: number) => {
    frontLayer.position.z = f * 0.40;
    emblemLayer.position.z = 0.28 + f * 0.80;
    backMesh.position.z = -f * 0.45;
  };
}

/**
 * ----------------------------------------------------------------------------
 * 1. AXOLOTL 1: Lucy Leucistic Pink Axolotl (六角恐龙 经典粉)
 * ----------------------------------------------------------------------------
 */
export function buildHexAxolotlLucyBadge(
  materials: AppleAwardMaterials,
  earnedDate: string = 'OCTOBER 28, 2026',
  isLocked: boolean = false
): AppleBadgeMeshGroup {
  const badge = new THREE.Group() as AppleBadgeMeshGroup;
  const mirrorSilver = materials.getMirrorSilverBezel(isLocked);
  const sakuraPink = 0xff85a1;
  const opalWhite = 0xfcf4f7;
  const gillCrimson = materials.getColorLacquer(0xff3366, isLocked);
  const softPinkMat = materials.getColorLacquer(0xffb3c6, isLocked);
  const onyxMat = materials.getColorLacquer(0x1a1a24, isLocked);

  const { group, frontLayer, emblemLayer, backMesh } = createChallengeHexChassis(materials, {
    topColor: sakuraPink,
    bottomColor: opalWhite,
    bezel: 'silver',
    earnedDate,
    badgeTitle: 'LUCY AXOLOTL',
    isLocked,
    dividerY: -0.22,
  });
  badge.add(group);

  // 3D Relief Sculpture: Adorable Leucistic Axolotl Face & Branching Gills
  const axolotlHead = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.76, 0.12, 32), softPinkMat);
  axolotlHead.rotation.x = Math.PI / 2;
  axolotlHead.position.set(0, 0.12, 0.14);
  emblemLayer.add(axolotlHead);

  const headBezel = new THREE.Mesh(new THREE.TorusGeometry(0.74, 0.024, 12, 48), mirrorSilver);
  headBezel.position.set(0, 0.12, 0.19);
  emblemLayer.add(headBezel);

  // 6 Feathered External Gills (3 on left, 3 on right)
  [-1, 1].forEach((side) => {
    [0.38, 0.18, -0.02].forEach((yOffset, idx) => {
      const rotZ = side * (0.35 + idx * 0.18);
      const gillBranch = new THREE.Mesh(new THREE.CapsuleGeometry(0.065, 0.42, 8, 16), gillCrimson);
      gillBranch.rotation.z = -rotZ;
      gillBranch.position.set(side * (0.82 + idx * 0.06), 0.12 + yOffset, 0.15);
      emblemLayer.add(gillBranch);

      // Silver tip trim
      const gillTip = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 10), mirrorSilver);
      gillTip.position.set(side * (1.08 + idx * 0.08), 0.18 + yOffset, 0.16);
      emblemLayer.add(gillTip);
    });
  });

  // Onyx Beaded Eyes & Smile
  [-0.32, 0.32].forEach((x) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.085, 16, 16), onyxMat);
    eye.scale.set(1.0, 1.2, 0.4);
    eye.position.set(x, 0.22, 0.20);
    emblemLayer.add(eye);

    // Eye catchlight
    const glint = new THREE.Mesh(new THREE.SphereGeometry(0.026, 8, 8), mirrorSilver);
    glint.position.set(x + 0.02, 0.26, 0.23);
    emblemLayer.add(glint);
  });

  // Sweet Smile Arc
  const smileCurve = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(-0.16, 0.04, 0.20),
    new THREE.Vector3(0, -0.05, 0.20),
    new THREE.Vector3(0.16, 0.04, 0.20)
  );
  const smileGeo = new THREE.TubeGeometry(smileCurve, 16, 0.018, 8, false);
  const smileMesh = new THREE.Mesh(smileGeo, onyxMat);
  emblemLayer.add(smileMesh);

  // Rosy Cheek Blushes
  [-0.42, 0.42].forEach((x) => {
    const blush = new THREE.Mesh(new THREE.CircleGeometry(0.11, 24), gillCrimson);
    blush.position.set(x, 0.10, 0.202);
    emblemLayer.add(blush);
  });

  // Aquatic Bubbles at lower half
  [
    { x: -0.65, y: -0.75, r: 0.12 },
    { x: 0.72, y: -0.62, r: 0.09 },
    { x: 0.38, y: -0.92, r: 0.14 },
    { x: -0.25, y: -1.05, r: 0.08 },
  ].forEach((b) => {
    const bubble = new THREE.Mesh(new THREE.TorusGeometry(b.r, 0.02, 10, 24), mirrorSilver);
    bubble.position.set(b.x, b.y, 0.12);
    emblemLayer.add(bubble);
  });

  attachHexExplodedView(badge, frontLayer, emblemLayer, backMesh);

  return badge;
}

/**
 * ----------------------------------------------------------------------------
 * 2. AXOLOTL 2: Rare Cyan Gold Glint Axolotl (六角恐龙 稀有蓝金)
 * ----------------------------------------------------------------------------
 */
export function buildHexAxolotlCyanBadge(
  materials: AppleAwardMaterials,
  earnedDate: string = 'OCTOBER 28, 2026',
  isLocked: boolean = false
): AppleBadgeMeshGroup {
  const badge = new THREE.Group() as AppleBadgeMeshGroup;
  const mirrorGold = materials.getMirrorGoldBezel(isLocked);
  const mirrorSilver = materials.getMirrorSilverBezel(isLocked);
  const aquaCyan = 0x00e5ff;
  const oceanDeep = 0x0d1b2a;
  const cyanBodyMat = materials.getColorLacquer(0x00b4d8, isLocked);
  const goldGillMat = materials.getMirrorGoldBezel(isLocked);
  const onyxMat = materials.getColorLacquer(0x050811, isLocked);

  const { group, frontLayer, emblemLayer, backMesh } = createChallengeHexChassis(materials, {
    topColor: aquaCyan,
    bottomColor: oceanDeep,
    bezel: 'silver',
    earnedDate,
    badgeTitle: 'CYAN GLINT AXOLOTL',
    isLocked,
    dividerY: -0.18,
  });
  badge.add(group);

  // 3D Relief Sculpture: Glowing Cyan Axolotl with Golden Branch Gills
  const headMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.76, 0.12, 32), cyanBodyMat);
  headMesh.rotation.x = Math.PI / 2;
  headMesh.position.set(0, 0.12, 0.14);
  emblemLayer.add(headMesh);

  const headGoldBezel = new THREE.Mesh(new THREE.TorusGeometry(0.74, 0.024, 12, 48), mirrorGold);
  headGoldBezel.position.set(0, 0.12, 0.19);
  emblemLayer.add(headGoldBezel);

  [-1, 1].forEach((side) => {
    [0.38, 0.18, -0.02].forEach((yOffset, idx) => {
      const rotZ = side * (0.36 + idx * 0.18);
      const gill = new THREE.Mesh(new THREE.CapsuleGeometry(0.065, 0.44, 8, 16), goldGillMat);
      gill.rotation.z = -rotZ;
      gill.position.set(side * (0.84 + idx * 0.06), 0.12 + yOffset, 0.16);
      emblemLayer.add(gill);
    });
  });

  // Eyes with Cyan Iris
  [-0.32, 0.32].forEach((x) => {
    const eyeSocket = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.02, 10, 24), mirrorGold);
    eyeSocket.position.set(x, 0.22, 0.20);
    emblemLayer.add(eyeSocket);

    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 16), onyxMat);
    eye.scale.set(1.0, 1.2, 0.4);
    eye.position.set(x, 0.22, 0.20);
    emblemLayer.add(eye);
  });

  // Gold Star Crest at forehead
  const starGeo = new THREE.OctahedronGeometry(0.14, 0);
  const starMesh = new THREE.Mesh(starGeo, mirrorGold);
  starMesh.position.set(0, 0.44, 0.22);
  starMesh.rotation.z = Math.PI / 4;
  emblemLayer.add(starMesh);

  attachHexExplodedView(badge, frontLayer, emblemLayer, backMesh);

  return badge;
}

/**
 * ----------------------------------------------------------------------------
 * 3. MINION 1: Stuart One-Eyed Minion (小黄人 斯图尔特)
 * ----------------------------------------------------------------------------
 */
export function buildHexMinionStuartBadge(
  materials: AppleAwardMaterials,
  earnedDate: string = 'OCTOBER 28, 2026',
  isLocked: boolean = false
): AppleBadgeMeshGroup {
  const badge = new THREE.Group() as AppleBadgeMeshGroup;
  const mirrorSilver = materials.getMirrorSilverBezel(isLocked);
  const minionYellow = 0xffd500;
  const denimBlue = 0x1e3f66;
  const yellowFaceMat = materials.getColorLacquer(minionYellow, isLocked);
  const darkStrapMat = materials.getColorLacquer(0x18181e, isLocked);
  const irisMat = materials.getColorLacquer(0x795548, isLocked);
  const whiteMat = materials.getOffWhiteEnamel(isLocked);
  const pupilMat = materials.getColorLacquer(0x0a0a0f, isLocked);

  const { group, frontLayer, emblemLayer, backMesh } = createChallengeHexChassis(materials, {
    topColor: minionYellow,
    bottomColor: denimBlue,
    bezel: 'silver',
    earnedDate,
    badgeTitle: 'MINION STUART',
    isLocked,
    dividerY: -0.32,
  });
  badge.add(group);

  // 1. Minion Black Goggle Strap crossing horizontally
  const strap = new THREE.Mesh(new THREE.BoxGeometry(2.44, 0.18, 0.04), darkStrapMat);
  strap.position.set(0, 0.16, 0.13);
  emblemLayer.add(strap);

  // 2. Large Iconic Single Goggle with Polished Silver Rim
  const goggleRim = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.58, 0.12, 36), mirrorSilver);
  goggleRim.rotation.x = Math.PI / 2;
  goggleRim.position.set(0, 0.16, 0.16);
  emblemLayer.add(goggleRim);

  const goggleBevel = new THREE.Mesh(new THREE.TorusGeometry(0.58, 0.035, 12, 36), mirrorSilver);
  goggleBevel.position.set(0, 0.16, 0.22);
  emblemLayer.add(goggleBevel);

  // Eye Sclera (White)
  const eyeWhite = new THREE.Mesh(new THREE.CircleGeometry(0.48, 32), whiteMat);
  eyeWhite.position.set(0, 0.16, 0.222);
  emblemLayer.add(eyeWhite);

  // Iris (Brown)
  const eyeIris = new THREE.Mesh(new THREE.CircleGeometry(0.24, 24), irisMat);
  eyeIris.position.set(0, 0.16, 0.225);
  emblemLayer.add(eyeIris);

  // Pupil & Glint
  const eyePupil = new THREE.Mesh(new THREE.CircleGeometry(0.12, 20), pupilMat);
  eyePupil.position.set(0, 0.16, 0.228);
  emblemLayer.add(eyePupil);

  const glint = new THREE.Mesh(new THREE.CircleGeometry(0.04, 12), whiteMat);
  glint.position.set(0.05, 0.20, 0.23);
  emblemLayer.add(glint);

  // Cheerful Smirk Curve
  const smirkCurve = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(-0.35, -0.16, 0.15),
    new THREE.Vector3(0.05, -0.28, 0.15),
    new THREE.Vector3(0.38, -0.12, 0.15)
  );
  const smirkGeo = new THREE.TubeGeometry(smirkCurve, 20, 0.022, 10, false);
  const smirkMesh = new THREE.Mesh(smirkGeo, darkStrapMat);
  emblemLayer.add(smirkMesh);

  // Overalls Bib with Gru 'G' Emblem at bottom
  const bibGroup = new THREE.Group();
  const denimMat = materials.getColorLacquer(denimBlue, isLocked);
  const bibPocket = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.44, 0.04), denimMat);
  bibPocket.position.set(0, -0.72, 0.13);
  bibGroup.add(bibPocket);

  const gruRing = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.022, 8, 24), mirrorSilver);
  gruRing.position.set(0, -0.72, 0.155);
  bibGroup.add(gruRing);

  [-0.26, 0.26].forEach((x) => {
    const button = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.03, 16), darkStrapMat);
    button.rotation.x = Math.PI / 2;
    button.position.set(x, -0.56, 0.14);
    bibGroup.add(button);
  });
  emblemLayer.add(bibGroup);

  attachHexExplodedView(badge, frontLayer, emblemLayer, backMesh);

  return badge;
}

/**
 * ----------------------------------------------------------------------------
 * 4. MINION 2: Bob Two-Eyed Minion with Tim Bear (小黄人 鲍勃)
 * ----------------------------------------------------------------------------
 */
export function buildHexMinionBobBadge(
  materials: AppleAwardMaterials,
  earnedDate: string = 'OCTOBER 28, 2026',
  isLocked: boolean = false
): AppleBadgeMeshGroup {
  const badge = new THREE.Group() as AppleBadgeMeshGroup;
  const mirrorSilver = materials.getMirrorSilverBezel(isLocked);
  const minionYellow = 0xffe033;
  const denimNavy = 0x1b3b6f;
  const strapMat = materials.getColorLacquer(0x18181e, isLocked);
  const greenIrisMat = materials.getColorLacquer(0x43a047, isLocked); // Green eye
  const brownIrisMat = materials.getColorLacquer(0x795548, isLocked); // Brown eye
  const whiteMat = materials.getOffWhiteEnamel(isLocked);
  const pupilMat = materials.getColorLacquer(0x0a0a0f, isLocked);
  const bearBrownMat = materials.getColorLacquer(0x8d6e63, isLocked);

  const { group, frontLayer, emblemLayer, backMesh } = createChallengeHexChassis(materials, {
    topColor: minionYellow,
    bottomColor: denimNavy,
    bezel: 'silver',
    earnedDate,
    badgeTitle: 'MINION BOB',
    isLocked,
    dividerY: -0.35,
  });
  badge.add(group);

  // Goggle Straps
  const strap = new THREE.Mesh(new THREE.BoxGeometry(2.44, 0.16, 0.04), strapMat);
  strap.position.set(0, 0.18, 0.13);
  emblemLayer.add(strap);

  // Dual Goggles with Heterochromia Eyes (One Green, One Brown)
  [-0.38, 0.38].forEach((x, idx) => {
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.44, 0.11, 32), mirrorSilver);
    rim.rotation.x = Math.PI / 2;
    rim.position.set(x, 0.18, 0.16);
    emblemLayer.add(rim);

    const bevel = new THREE.Mesh(new THREE.TorusGeometry(0.44, 0.03, 10, 32), mirrorSilver);
    bevel.position.set(x, 0.18, 0.215);
    emblemLayer.add(bevel);

    const sclera = new THREE.Mesh(new THREE.CircleGeometry(0.36, 24), whiteMat);
    sclera.position.set(x, 0.18, 0.22);
    emblemLayer.add(sclera);

    const irisMat = idx === 0 ? greenIrisMat : brownIrisMat;
    const iris = new THREE.Mesh(new THREE.CircleGeometry(0.18, 20), irisMat);
    iris.position.set(x, 0.18, 0.223);
    emblemLayer.add(iris);

    const pupil = new THREE.Mesh(new THREE.CircleGeometry(0.09, 16), pupilMat);
    pupil.position.set(x, 0.18, 0.226);
    emblemLayer.add(pupil);
  });

  // Bob's Wide Happy Smile
  const smileCurve = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(-0.32, -0.12, 0.15),
    new THREE.Vector3(0, -0.26, 0.15),
    new THREE.Vector3(0.32, -0.12, 0.15)
  );
  const smileGeo = new THREE.TubeGeometry(smileCurve, 20, 0.024, 10, false);
  const smileMesh = new THREE.Mesh(smileGeo, strapMat);
  emblemLayer.add(smileMesh);

  // Tim Bear Motif at lower section
  const bearGroup = new THREE.Group();
  bearGroup.position.set(0, -0.74, 0.14);

  const bearHead = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 16), bearBrownMat);
  bearHead.scale.set(1.1, 0.9, 0.4);
  bearGroup.add(bearHead);

  [-0.20, 0.20].forEach((x) => {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 12), bearBrownMat);
    ear.position.set(x, 0.16, 0);
    bearGroup.add(ear);
  });

  const bearMuzzle = new THREE.Mesh(new THREE.SphereGeometry(0.10, 12, 12), whiteMat);
  bearMuzzle.position.set(0, -0.04, 0.10);
  bearGroup.add(bearMuzzle);

  emblemLayer.add(bearGroup);

  attachHexExplodedView(badge, frontLayer, emblemLayer, backMesh);

  return badge;
}

/**
 * ----------------------------------------------------------------------------
 * 5. BLUEY 1: Bluey Heeler (布鲁伊)
 * ----------------------------------------------------------------------------
 */
export function buildHexBlueyBadge(
  materials: AppleAwardMaterials,
  earnedDate: string = 'OCTOBER 28, 2026',
  isLocked: boolean = false
): AppleBadgeMeshGroup {
  const badge = new THREE.Group() as AppleBadgeMeshGroup;
  const mirrorSilver = materials.getMirrorSilverBezel(isLocked);
  const skyBlue = 0x4a90e2;
  const navyHeeler = 0x1d3557;
  const lightBlueMat = materials.getColorLacquer(0x72a0c1, isLocked);
  const muzzleCreamMat = materials.getColorLacquer(0xfdf0d5, isLocked);
  const noseMat = materials.getColorLacquer(0x1a1a24, isLocked);
  const eyeWhiteMat = materials.getOffWhiteEnamel(isLocked);

  const { group, frontLayer, emblemLayer, backMesh } = createChallengeHexChassis(materials, {
    topColor: skyBlue,
    bottomColor: navyHeeler,
    bezel: 'silver',
    earnedDate,
    badgeTitle: 'BLUEY HEELER',
    isLocked,
    dividerY: -0.25,
  });
  badge.add(group);

  // 3D Relief Sculpture: Bluey Face with Perky Triangular Ears
  const faceGroup = new THREE.Group();
  faceGroup.position.set(0, 0.08, 0.14);

  // Bluey Head Block
  const head = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.95, 0.12), lightBlueMat);
  faceGroup.add(head);

  // Dark Navy Eye Patch (Right side)
  const patch = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.55, 0.13), materials.getColorLacquer(0x1d3557, isLocked));
  patch.position.set(0.26, 0.15, 0.01);
  faceGroup.add(patch);

  // Triangular Dog Ears
  [-0.42, 0.42].forEach((x, idx) => {
    const earShape = new THREE.Shape();
    earShape.moveTo(-0.16, 0);
    earShape.lineTo(0.16, 0);
    earShape.lineTo(0, 0.52);
    earShape.closePath();
    const earGeo = new THREE.ExtrudeGeometry(earShape, { depth: 0.08, bevelEnabled: false });
    const earMesh = new THREE.Mesh(earGeo, idx === 0 ? lightBlueMat : materials.getColorLacquer(0x1d3557, isLocked));
    earMesh.position.set(x, 0.45, -0.04);
    faceGroup.add(earMesh);
  });

  // Muzzle & Black Nose
  const muzzle = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.38, 0.12), muzzleCreamMat);
  muzzle.position.set(0, -0.22, 0.08);
  faceGroup.add(muzzle);

  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.09, 14, 14), noseMat);
  nose.scale.set(1.2, 0.8, 0.6);
  nose.position.set(0, -0.15, 0.16);
  faceGroup.add(nose);

  // Big Cartoon Oval Eyes
  [-0.22, 0.22].forEach((x) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), eyeWhiteMat);
    eye.scale.set(1.0, 1.3, 0.4);
    eye.position.set(x, 0.12, 0.08);
    faceGroup.add(eye);

    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.065, 12, 12), noseMat);
    pupil.position.set(x + 0.02, 0.12, 0.12);
    faceGroup.add(pupil);
  });

  emblemLayer.add(faceGroup);

  // Paw Print Embossed below
  const paw = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 16), mirrorSilver);
  paw.scale.set(1.0, 0.8, 0.3);
  paw.position.set(0, -0.76, 0.13);
  emblemLayer.add(paw);

  attachHexExplodedView(badge, frontLayer, emblemLayer, backMesh);

  return badge;
}

/**
 * ----------------------------------------------------------------------------
 * 6. BLUEY 2: Bingo Heeler (宾果)
 * ----------------------------------------------------------------------------
 */
export function buildHexBingoBadge(
  materials: AppleAwardMaterials,
  earnedDate: string = 'OCTOBER 28, 2026',
  isLocked: boolean = false
): AppleBadgeMeshGroup {
  const badge = new THREE.Group() as AppleBadgeMeshGroup;
  const mirrorSilver = materials.getMirrorSilverBezel(isLocked);
  const orangeMarmalade = 0xff7a00;
  const creamPeach = 0xffe5b4;
  const orangeMat = materials.getColorLacquer(orangeMarmalade, isLocked);
  const darkOrangeMat = materials.getColorLacquer(0xd35400, isLocked);
  const creamMat = materials.getColorLacquer(creamPeach, isLocked);
  const noseMat = materials.getColorLacquer(0x1a1a24, isLocked);
  const eyeWhiteMat = materials.getOffWhiteEnamel(isLocked);

  const { group, frontLayer, emblemLayer, backMesh } = createChallengeHexChassis(materials, {
    topColor: orangeMarmalade,
    bottomColor: creamPeach,
    bezel: 'silver',
    earnedDate,
    badgeTitle: 'BINGO HEELER',
    isLocked,
    dividerY: -0.25,
  });
  badge.add(group);

  // 3D Relief Sculpture: Bingo Face with Floppy Pointed Ears
  const faceGroup = new THREE.Group();
  faceGroup.position.set(0, 0.08, 0.14);

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.98, 0.90, 0.12), orangeMat);
  faceGroup.add(head);

  // Reddish-Brown Eye Patch on Left
  const patch = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.52, 0.13), darkOrangeMat);
  patch.position.set(-0.24, 0.14, 0.01);
  faceGroup.add(patch);

  // Bingo Ears
  [-0.38, 0.38].forEach((x, idx) => {
    const earShape = new THREE.Shape();
    earShape.moveTo(-0.15, 0);
    earShape.lineTo(0.15, 0);
    earShape.lineTo(0, 0.48);
    earShape.closePath();
    const earGeo = new THREE.ExtrudeGeometry(earShape, { depth: 0.08, bevelEnabled: false });
    const earMesh = new THREE.Mesh(earGeo, idx === 0 ? darkOrangeMat : orangeMat);
    earMesh.position.set(x, 0.42, -0.04);
    faceGroup.add(earMesh);
  });

  // Muzzle & Cute Nose
  const muzzle = new THREE.Mesh(new THREE.BoxGeometry(0.50, 0.34, 0.12), creamMat);
  muzzle.position.set(0, -0.22, 0.08);
  faceGroup.add(muzzle);

  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.08, 14, 14), noseMat);
  nose.scale.set(1.2, 0.8, 0.6);
  nose.position.set(0, -0.16, 0.16);
  faceGroup.add(nose);

  [-0.20, 0.20].forEach((x) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 16), eyeWhiteMat);
    eye.scale.set(1.0, 1.3, 0.4);
    eye.position.set(x, 0.12, 0.08);
    faceGroup.add(eye);

    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 12), noseMat);
    pupil.position.set(x + 0.01, 0.12, 0.12);
    faceGroup.add(pupil);
  });

  emblemLayer.add(faceGroup);

  attachHexExplodedView(badge, frontLayer, emblemLayer, backMesh);

  return badge;
}

/**
 * ----------------------------------------------------------------------------
 * 7. NEMO 1: Nemo the Clownfish & Lucky Fin (海底总动员 尼莫)
 * ----------------------------------------------------------------------------
 */
export function buildHexNemoBadge(
  materials: AppleAwardMaterials,
  earnedDate: string = 'OCTOBER 28, 2026',
  isLocked: boolean = false
): AppleBadgeMeshGroup {
  const badge = new THREE.Group() as AppleBadgeMeshGroup;
  const mirrorSilver = materials.getMirrorSilverBezel(isLocked);
  const clownfishOrange = 0xff5722;
  const reefAqua = 0x00897b;
  const orangeMat = materials.getColorLacquer(clownfishOrange, isLocked);
  const whiteMat = materials.getOffWhiteEnamel(isLocked);
  const blackPinstripeMat = materials.getColorLacquer(0x111116, isLocked);
  const eyePupilMat = materials.getColorLacquer(0x0a0a0f, isLocked);

  const { group, frontLayer, emblemLayer, backMesh } = createChallengeHexChassis(materials, {
    topColor: clownfishOrange,
    bottomColor: reefAqua,
    bezel: 'silver',
    earnedDate,
    badgeTitle: 'NEMO CLOWNFISH',
    isLocked,
    dividerY: -0.20,
  });
  badge.add(group);

  // 3D Relief Sculpture: Nemo Swimming with White Stripes & Little Lucky Fin
  const fishGroup = new THREE.Group();
  fishGroup.position.set(0, 0.05, 0.14);

  // Orange Oval Fish Body
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.78, 24, 24), orangeMat);
  body.scale.set(1.25, 0.72, 0.35);
  fishGroup.add(body);

  // White Clownfish Vertical Stripes with Black Edging
  [-0.32, 0.08, 0.48].forEach((x, idx) => {
    const stripe = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.95 - idx * 0.2, 16), whiteMat);
    stripe.rotation.z = 0.15;
    stripe.position.set(x, 0, 0.12);
    fishGroup.add(stripe);
  });

  // Nemo's Iconic Little "Lucky Fin" on Right
  const luckyFin = new THREE.Mesh(new THREE.SphereGeometry(0.14, 14, 14), orangeMat);
  luckyFin.scale.set(1.4, 0.8, 0.2);
  luckyFin.rotation.z = -0.45;
  luckyFin.position.set(0.68, -0.22, 0.14);
  fishGroup.add(luckyFin);

  // Larger Normal Pectoral Fin on Left
  const normalFin = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 16), orangeMat);
  normalFin.scale.set(1.6, 0.9, 0.2);
  normalFin.rotation.z = 0.35;
  normalFin.position.set(-0.62, 0.18, 0.14);
  fishGroup.add(normalFin);

  // Nemo Eye (Orange iris + black pupil)
  const eyeWhite = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 16), whiteMat);
  eyeWhite.position.set(-0.52, 0.12, 0.16);
  fishGroup.add(eyeWhite);

  const eyeIris = new THREE.Mesh(new THREE.SphereGeometry(0.09, 14, 14), orangeMat);
  eyeIris.position.set(-0.54, 0.12, 0.20);
  fishGroup.add(eyeIris);

  const eyePupil = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 12), eyePupilMat);
  eyePupil.position.set(-0.56, 0.12, 0.22);
  fishGroup.add(eyePupil);

  emblemLayer.add(fishGroup);

  attachHexExplodedView(badge, frontLayer, emblemLayer, backMesh);

  return badge;
}

/**
 * ----------------------------------------------------------------------------
 * 8. NEMO 2: Dory the Blue Tang (海底总动员 多莉)
 * ----------------------------------------------------------------------------
 */
export function buildHexDoryBadge(
  materials: AppleAwardMaterials,
  earnedDate: string = 'OCTOBER 28, 2026',
  isLocked: boolean = false
): AppleBadgeMeshGroup {
  const badge = new THREE.Group() as AppleBadgeMeshGroup;
  const mirrorSilver = materials.getMirrorSilverBezel(isLocked);
  const royalBlue = 0x1565c0;
  const oceanDeep = 0x0d1b2a;
  const blueMat = materials.getColorLacquer(royalBlue, isLocked);
  const yellowFinMat = materials.getColorLacquer(0xffd600, isLocked);
  const blackMarkMat = materials.getColorLacquer(0x0a0e17, isLocked);
  const magentaEyeMat = materials.getColorLacquer(0xd81b60, isLocked);
  const whiteMat = materials.getOffWhiteEnamel(isLocked);

  const { group, frontLayer, emblemLayer, backMesh } = createChallengeHexChassis(materials, {
    topColor: royalBlue,
    bottomColor: oceanDeep,
    bezel: 'silver',
    earnedDate,
    badgeTitle: 'DORY BLUE TANG',
    isLocked,
    dividerY: -0.22,
  });
  badge.add(group);

  // 3D Relief Sculpture: Dory Blue Tang Oval Body & Bright Yellow Tail Fin
  const doryGroup = new THREE.Group();
  doryGroup.position.set(0, 0.06, 0.14);

  // Royal Blue Disc/Oval Body
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.82, 24, 24), blueMat);
  body.scale.set(1.3, 0.95, 0.35);
  doryGroup.add(body);

  // Curved Black Surgeonfish Pattern across back
  const blackBand = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.08, 10, 32), blackMarkMat);
  blackBand.rotation.z = 0.45;
  blackBand.position.set(0.12, 0.05, 0.12);
  doryGroup.add(blackBand);

  // Bright Yellow Tail Fin
  const tailShape = new THREE.Shape();
  tailShape.moveTo(0, 0);
  tailShape.lineTo(0.55, 0.35);
  tailShape.lineTo(0.42, 0);
  tailShape.lineTo(0.55, -0.35);
  tailShape.closePath();
  const tailGeo = new THREE.ExtrudeGeometry(tailShape, { depth: 0.06, bevelEnabled: false });
  const tailMesh = new THREE.Mesh(tailGeo, yellowFinMat);
  tailMesh.position.set(0.72, 0, 0.08);
  doryGroup.add(tailMesh);

  // Large Expressive Magenta/Pink Eyes
  const eyeWhite = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 16), whiteMat);
  eyeWhite.position.set(-0.52, 0.15, 0.16);
  doryGroup.add(eyeWhite);

  const eyeIris = new THREE.Mesh(new THREE.SphereGeometry(0.11, 14, 14), magentaEyeMat);
  eyeIris.position.set(-0.54, 0.15, 0.20);
  doryGroup.add(eyeIris);

  const eyePupil = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 12), blackMarkMat);
  eyePupil.position.set(-0.56, 0.15, 0.22);
  doryGroup.add(eyePupil);

  emblemLayer.add(doryGroup);

  attachHexExplodedView(badge, frontLayer, emblemLayer, backMesh);

  return badge;
}

/**
 * ----------------------------------------------------------------------------
 * 9. RUBBLE: Paw Patrol Rubble on the Double (汪汪队小砾)
 * ----------------------------------------------------------------------------
 */
export function buildHexRubbleBadge(
  materials: AppleAwardMaterials,
  earnedDate: string = 'OCTOBER 28, 2026',
  isLocked: boolean = false
): AppleBadgeMeshGroup {
  const badge = new THREE.Group() as AppleBadgeMeshGroup;
  const mirrorSilver = materials.getMirrorSilverBezel(isLocked);
  const hazardYellow = 0xfbc02d;
  const slateBrown = 0x3e2723;
  const helmetYellowMat = materials.getColorLacquer(hazardYellow, isLocked);
  const pupBrownMat = materials.getColorLacquer(0x795548, isLocked);
  const muzzleWhiteMat = materials.getOffWhiteEnamel(isLocked);
  const darkMat = materials.getColorLacquer(0x1a1a24, isLocked);

  const { group, frontLayer, emblemLayer, backMesh } = createChallengeHexChassis(materials, {
    topColor: hazardYellow,
    bottomColor: slateBrown,
    bezel: 'silver',
    earnedDate,
    badgeTitle: 'RUBBLE ON THE DOUBLE',
    isLocked,
    dividerY: -0.28,
  });
  badge.add(group);

  // 3D Relief Sculpture: Construction Helmet, Bulldog Ears & PAW Wrench
  const rubbleGroup = new THREE.Group();
  rubbleGroup.position.set(0, 0.08, 0.14);

  // Yellow Construction Hard Hat
  const helmetDome = new THREE.Mesh(new THREE.SphereGeometry(0.58, 24, 24), helmetYellowMat);
  helmetDome.scale.set(1.15, 0.82, 0.5);
  helmetDome.position.set(0, 0.28, 0.08);
  rubbleGroup.add(helmetDome);

  const helmetBrim = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.10, 0.14), helmetYellowMat);
  helmetBrim.position.set(0, 0.12, 0.16);
  rubbleGroup.add(helmetBrim);

  // PAW Shield Badge on Helmet
  const pawBadge = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.12, 0.06, 6), mirrorSilver);
  pawBadge.rotation.x = Math.PI / 2;
  pawBadge.position.set(0, 0.32, 0.22);
  rubbleGroup.add(pawBadge);

  // Bulldog Face & Brown Ears
  const face = new THREE.Mesh(new THREE.SphereGeometry(0.52, 20, 20), pupBrownMat);
  face.scale.set(1.0, 0.85, 0.4);
  face.position.set(0, -0.06, 0.08);
  rubbleGroup.add(face);

  [-0.46, 0.46].forEach((x) => {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.20, 14, 14), pupBrownMat);
    ear.scale.set(0.8, 1.4, 0.3);
    ear.rotation.z = x > 0 ? -0.4 : 0.4;
    ear.position.set(x, 0.02, 0.06);
    rubbleGroup.add(ear);
  });

  // White Bulldog Jowls / Muzzle
  const jowl = new THREE.Mesh(new THREE.SphereGeometry(0.32, 16, 16), muzzleWhiteMat);
  jowl.scale.set(1.2, 0.7, 0.4);
  jowl.position.set(0, -0.22, 0.14);
  rubbleGroup.add(jowl);

  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 12), darkMat);
  nose.scale.set(1.3, 0.8, 0.5);
  nose.position.set(0, -0.16, 0.22);
  rubbleGroup.add(nose);

  // Eyes
  [-0.22, 0.22].forEach((x) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 12), muzzleWhiteMat);
    eye.position.set(x, 0.02, 0.16);
    rubbleGroup.add(eye);

    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 10), darkMat);
    pupil.position.set(x, 0.02, 0.20);
    rubbleGroup.add(pupil);
  });

  // Silver Mechanic Wrench Cross at bottom
  const wrench = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.08, 0.04), mirrorSilver);
  wrench.rotation.z = Math.PI / 4;
  wrench.position.set(0, -0.74, 0.12);
  rubbleGroup.add(wrench);

  emblemLayer.add(rubbleGroup);

  attachHexExplodedView(badge, frontLayer, emblemLayer, backMesh);

  return badge;
}

/**
 * ----------------------------------------------------------------------------
 * 10. PIKACHU: Electric Mouse Sprint (皮卡丘 闪电勋章)
 * ----------------------------------------------------------------------------
 */
export function buildHexPikachuBadge(
  materials: AppleAwardMaterials,
  earnedDate: string = 'OCTOBER 28, 2026',
  isLocked: boolean = false
): AppleBadgeMeshGroup {
  const badge = new THREE.Group() as AppleBadgeMeshGroup;
  const mirrorSilver = materials.getMirrorSilverBezel(isLocked);
  const electricYellow = 0xffea00;
  const sparkCharcoal = 0x212121;
  const yellowMat = materials.getColorLacquer(electricYellow, isLocked);
  const cheekRedMat = materials.getColorLacquer(0xff1744, isLocked);
  const darkMat = materials.getColorLacquer(0x18181e, isLocked);
  const whiteMat = materials.getOffWhiteEnamel(isLocked);

  const { group, frontLayer, emblemLayer, backMesh } = createChallengeHexChassis(materials, {
    topColor: electricYellow,
    bottomColor: sparkCharcoal,
    bezel: 'silver',
    earnedDate,
    badgeTitle: 'PIKACHU THUNDER',
    isLocked,
    dividerY: -0.28,
  });
  badge.add(group);

  // 3D Relief Sculpture: Pikachu Face, Pointed Ears with Black Tips, & Lightning Bolt
  const pikaGroup = new THREE.Group();
  pikaGroup.position.set(0, 0.06, 0.14);

  // Round Head
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.68, 24, 24), yellowMat);
  head.scale.set(1.15, 0.95, 0.4);
  pikaGroup.add(head);

  // Long Pointed Ears with Black Tips
  [-0.48, 0.48].forEach((x, idx) => {
    const rotZ = idx === 0 ? 0.45 : -0.45;
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.92, 16), yellowMat);
    ear.rotation.z = rotZ;
    ear.position.set(x, 0.65, 0.02);
    pikaGroup.add(ear);

    // Black Tip
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.32, 16), darkMat);
    tip.rotation.z = rotZ;
    tip.position.set(x * 1.35, 0.88, 0.02);
    pikaGroup.add(tip);
  });

  // Red Cheek Pouches
  [-0.45, 0.45].forEach((x) => {
    const cheek = new THREE.Mesh(new THREE.CircleGeometry(0.16, 24), cheekRedMat);
    cheek.position.set(x, -0.05, 0.18);
    pikaGroup.add(cheek);
  });

  // Eyes with White Highlights
  [-0.24, 0.24].forEach((x) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 16), darkMat);
    eye.position.set(x, 0.10, 0.16);
    pikaGroup.add(eye);

    const glint = new THREE.Mesh(new THREE.SphereGeometry(0.04, 10, 10), whiteMat);
    glint.position.set(x + 0.02, 0.14, 0.20);
    pikaGroup.add(glint);
  });

  // Tiny Cute Nose & 'W' Smile
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), darkMat);
  nose.position.set(0, 0.02, 0.18);
  pikaGroup.add(nose);

  const smileCurve = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(-0.14, -0.06, 0.18),
    new THREE.Vector3(0, -0.16, 0.18),
    new THREE.Vector3(0.14, -0.06, 0.18)
  );
  const smileGeo = new THREE.TubeGeometry(smileCurve, 16, 0.018, 8, false);
  const smileMesh = new THREE.Mesh(smileGeo, darkMat);
  pikaGroup.add(smileMesh);

  // Large 3D Lightning Bolt cutting across lower half
  const boltShape = new THREE.Shape();
  boltShape.moveTo(0, 0.55);
  boltShape.lineTo(0.24, 0.12);
  boltShape.lineTo(0.06, 0.12);
  boltShape.lineTo(0.32, -0.45);
  boltShape.lineTo(-0.06, -0.05);
  boltShape.lineTo(0.10, -0.05);
  boltShape.closePath();
  const boltGeo = new THREE.ExtrudeGeometry(boltShape, { depth: 0.08, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02 });
  const boltMesh = new THREE.Mesh(boltGeo, yellowMat);
  boltMesh.position.set(0, -0.68, 0.12);
  pikaGroup.add(boltMesh);

  emblemLayer.add(pikaGroup);

  attachHexExplodedView(badge, frontLayer, emblemLayer, backMesh);

  return badge;
}

/**
 * ----------------------------------------------------------------------------
 * 11. DARTH VADER: Lord Vader Sith Command (达斯·维达 全景)
 * ----------------------------------------------------------------------------
 */
export function buildHexDarthVaderBadge(
  materials: AppleAwardMaterials,
  earnedDate: string = 'OCTOBER 28, 2026',
  isLocked: boolean = false
): AppleBadgeMeshGroup {
  const badge = new THREE.Group() as AppleBadgeMeshGroup;
  const spaceGray = materials.getSpaceGrayBezel(isLocked);
  const mirrorSilver = materials.getMirrorSilverBezel(isLocked);
  const sithObsidian = 0x101014;
  const kyberCrimson = 0xb71c1c;
  const blackMat = materials.getColorLacquer(sithObsidian, isLocked);
  const redMat = materials.getColorLacquer(kyberCrimson, isLocked);
  const greenMat = materials.getColorLacquer(0x00e676, isLocked);

  const { group, frontLayer, emblemLayer, backMesh } = createChallengeHexChassis(materials, {
    topColor: sithObsidian,
    bottomColor: kyberCrimson,
    bezel: 'space-gray',
    earnedDate,
    badgeTitle: 'LORD DARTH VADER',
    isLocked,
    dividerY: -0.25,
  });
  badge.add(group);

  // 3D Relief Sculpture: Full Vader Silhouette with Flowing Cape & Chest Computer
  const vaderGroup = new THREE.Group();
  vaderGroup.position.set(0, 0.08, 0.14);

  // Helmet Dome
  const helmetDome = new THREE.Mesh(new THREE.SphereGeometry(0.52, 24, 24), blackMat);
  helmetDome.scale.set(1.0, 1.15, 0.45);
  helmetDome.position.set(0, 0.35, 0.06);
  vaderGroup.add(helmetDome);

  // Flared Neck & Cape Silhouette
  const capeShape = new THREE.Shape();
  capeShape.moveTo(-0.45, 0.32);
  capeShape.lineTo(0.45, 0.32);
  capeShape.lineTo(0.85, -0.65);
  capeShape.lineTo(-0.85, -0.65);
  capeShape.closePath();
  const capeGeo = new THREE.ExtrudeGeometry(capeShape, { depth: 0.08, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02 });
  const capeMesh = new THREE.Mesh(capeGeo, blackMat);
  capeMesh.position.set(0, 0, 0.04);
  vaderGroup.add(capeMesh);

  // Angular Mask & Triangular Breath Grille
  const maskBrow = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.08, 0.06), spaceGray);
  maskBrow.position.set(0, 0.30, 0.16);
  vaderGroup.add(maskBrow);

  const grill = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.22, 3), spaceGray);
  grill.rotation.x = Math.PI;
  grill.position.set(0, 0.12, 0.18);
  vaderGroup.add(grill);

  // Chest Life-Support Box
  const chestBox = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.34, 0.06), blackMat);
  chestBox.position.set(0, -0.24, 0.15);
  vaderGroup.add(chestBox);

  const chestBorder = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.37, 0.02), mirrorSilver);
  chestBorder.position.set(0, -0.24, 0.14);
  vaderGroup.add(chestBorder);

  // Chest Box Light Buttons (Red & Green)
  [-0.14, 0, 0.14].forEach((x, idx) => {
    const btnMat = idx === 0 ? redMat : idx === 1 ? greenMat : redMat;
    const btn = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.04), btnMat);
    btn.position.set(x, -0.24, 0.18);
    vaderGroup.add(btn);
  });

  // Imperial Cog Crest at bottom
  const imperialRing = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.03, 8, 24), mirrorSilver);
  imperialRing.position.set(0, -0.72, 0.14);
  vaderGroup.add(imperialRing);

  emblemLayer.add(vaderGroup);

  attachHexExplodedView(badge, frontLayer, emblemLayer, backMesh);

  return badge;
}

/**
 * ----------------------------------------------------------------------------
 * 12. DARTH VADER HELMET: Vader Iconic Helmet (达斯·维达 头盔勋章)
 * ----------------------------------------------------------------------------
 */
export function buildHexVaderHelmetBadge(
  materials: AppleAwardMaterials,
  earnedDate: string = 'OCTOBER 28, 2026',
  isLocked: boolean = false
): AppleBadgeMeshGroup {
  const badge = new THREE.Group() as AppleBadgeMeshGroup;
  const mirrorSilver = materials.getMirrorSilverBezel(isLocked);
  const spaceGray = materials.getSpaceGrayBezel(isLocked);
  const obsidianBlack = 0x0a0a0e;
  const slateTitanium = 0x37474f;
  const glossBlackMat = materials.getColorLacquer(obsidianBlack, isLocked);

  const { group, frontLayer, emblemLayer, backMesh } = createChallengeHexChassis(materials, {
    topColor: obsidianBlack,
    bottomColor: slateTitanium,
    bezel: 'silver',
    earnedDate,
    badgeTitle: 'VADER ICONIC HELMET',
    isLocked,
    dividerY: -0.22,
  });
  badge.add(group);

  // 3D Relief Sculpture: Highly Detailed Darth Vader Helmet
  const helmetGroup = new THREE.Group();
  helmetGroup.position.set(0, 0.05, 0.14);

  // 1. High-Gloss Curved Helmet Dome & Ridge
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.72, 32, 32), glossBlackMat);
  dome.scale.set(1.15, 1.25, 0.52);
  dome.position.set(0, 0.22, 0.06);
  helmetGroup.add(dome);

  // Central Vertical Ridge Crest
  const ridge = new THREE.Mesh(new THREE.BoxGeometry(0.045, 1.25, 0.12), mirrorSilver);
  ridge.position.set(0, 0.32, 0.18);
  helmetGroup.add(ridge);

  // 2. Flared Neck Collar / Helmet Shroud
  const collarShape = new THREE.Shape();
  collarShape.moveTo(-0.72, 0.35);
  collarShape.lineTo(0.72, 0.35);
  collarShape.lineTo(0.98, -0.42);
  collarShape.lineTo(-0.98, -0.42);
  collarShape.closePath();
  const collarGeo = new THREE.ExtrudeGeometry(collarShape, { depth: 0.10, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04 });
  const collarMesh = new THREE.Mesh(collarGeo, glossBlackMat);
  collarMesh.position.set(0, -0.05, 0.04);
  helmetGroup.add(collarMesh);

  // 3. Angular Brow & Menacing Eye Sockets
  const brow = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.10, 0.10), mirrorSilver);
  brow.position.set(0, 0.22, 0.22);
  helmetGroup.add(brow);

  [-0.26, 0.26].forEach((x) => {
    const eyeSocket = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 16), glossBlackMat);
    eyeSocket.scale.set(1.2, 0.8, 0.3);
    eyeSocket.position.set(x, 0.14, 0.22);
    helmetGroup.add(eyeSocket);
  });

  // 4. Triangular Mouth Respirator Grille with Silver Mesh
  const grille = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.38, 3), spaceGray);
  grille.rotation.x = Math.PI;
  grille.position.set(0, -0.16, 0.24);
  helmetGroup.add(grille);

  // Twin Chin Filter Tusks
  [-0.18, 0.18].forEach((x) => {
    const tusk = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.14, 12), mirrorSilver);
    tusk.rotation.z = Math.PI / 2;
    tusk.position.set(x, -0.32, 0.24);
    helmetGroup.add(tusk);
  });

  emblemLayer.add(helmetGroup);

  attachHexExplodedView(badge, frontLayer, emblemLayer, backMesh);

  return badge;
}

/**
 * ----------------------------------------------------------------------------
 * 13. BABY YODA: Grogu The Child (古古 / 尤达宝宝)
 * ----------------------------------------------------------------------------
 */
export function buildHexBabyYodaBadge(
  materials: AppleAwardMaterials,
  earnedDate: string = 'OCTOBER 28, 2026',
  isLocked: boolean = false
): AppleBadgeMeshGroup {
  const badge = new THREE.Group() as AppleBadgeMeshGroup;
  const mirrorSilver = materials.getMirrorSilverBezel(isLocked);
  const sandTan = 0xd7ccc8;
  const sageGreen = 0x81c784;
  const groguGreenMat = materials.getColorLacquer(sageGreen, isLocked);
  const innerEarMat = materials.getColorLacquer(0xf48fb1, isLocked); // Pink inner ear
  const robeTanMat = materials.getColorLacquer(sandTan, isLocked);
  const robeCollarMat = materials.getColorLacquer(0xbcaaa4, isLocked);
  const bigEyeMat = materials.getColorLacquer(0x0a0a0f, isLocked);
  const whiteMat = materials.getOffWhiteEnamel(isLocked);

  const { group, frontLayer, emblemLayer, backMesh } = createChallengeHexChassis(materials, {
    topColor: sandTan,
    bottomColor: sageGreen,
    bezel: 'silver',
    earnedDate,
    badgeTitle: 'GROGU THE CHILD',
    isLocked,
    dividerY: -0.22,
  });
  badge.add(group);

  // 3D Relief Sculpture: Grogu with Enormous Pointed Ears & Doe Eyes
  const groguGroup = new THREE.Group();
  groguGroup.position.set(0, 0.08, 0.14);

  // Cute Rounded Green Head
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.55, 24, 24), groguGreenMat);
  head.scale.set(1.2, 0.95, 0.45);
  head.position.set(0, 0.14, 0.08);
  groguGroup.add(head);

  // Gigantic Pointed Ears
  [-1, 1].forEach((side) => {
    const earShape = new THREE.Shape();
    earShape.moveTo(0, 0);
    earShape.lineTo(side * 0.95, 0.18);
    earShape.lineTo(side * 0.72, -0.22);
    earShape.closePath();
    const earGeo = new THREE.ExtrudeGeometry(earShape, { depth: 0.06, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02 });
    const earMesh = new THREE.Mesh(earGeo, groguGreenMat);
    earMesh.position.set(side * 0.45, 0.18, 0.02);
    groguGroup.add(earMesh);

    // Inner Ear Soft Pink
    const innerShape = new THREE.Shape();
    innerShape.moveTo(0, 0);
    innerShape.lineTo(side * 0.75, 0.14);
    innerShape.lineTo(side * 0.56, -0.16);
    innerShape.closePath();
    const innerGeo = new THREE.ExtrudeGeometry(innerShape, { depth: 0.02, bevelEnabled: false });
    const innerMesh = new THREE.Mesh(innerGeo, innerEarMat);
    innerMesh.position.set(side * 0.45, 0.18, 0.09);
    groguGroup.add(innerMesh);
  });

  // Oversized Glossy Doe Eyes
  [-0.26, 0.26].forEach((x) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.16, 20, 20), bigEyeMat);
    eye.scale.set(1.1, 1.25, 0.4);
    eye.position.set(x, 0.14, 0.18);
    groguGroup.add(eye);

    // Cute double glint
    const glint1 = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 10), whiteMat);
    glint1.position.set(x + 0.04, 0.19, 0.24);
    groguGroup.add(glint1);

    const glint2 = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 8), whiteMat);
    glint2.position.set(x - 0.04, 0.10, 0.24);
    groguGroup.add(glint2);
  });

  // Cute Little Button Nose & Smirk
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.04, 10, 10), groguGreenMat);
  nose.position.set(0, 0.04, 0.20);
  groguGroup.add(nose);

  const mouthCurve = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(-0.12, -0.05, 0.20),
    new THREE.Vector3(0, -0.10, 0.20),
    new THREE.Vector3(0.12, -0.05, 0.20)
  );
  const mouthMesh = new THREE.Mesh(new THREE.TubeGeometry(mouthCurve, 12, 0.015, 6, false), robeCollarMat);
  groguGroup.add(mouthMesh);

  // Big Fluffy Robe Collar
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.14, 16, 32), robeCollarMat);
  collar.scale.set(1.1, 0.55, 0.7);
  collar.position.set(0, -0.22, 0.14);
  groguGroup.add(collar);

  // Floating Silver Shift Knob Sphere (His favorite toy)
  const shiftKnob = new THREE.Mesh(new THREE.SphereGeometry(0.15, 16, 16), mirrorSilver);
  shiftKnob.position.set(0, -0.68, 0.18);
  groguGroup.add(shiftKnob);

  emblemLayer.add(groguGroup);

  attachHexExplodedView(badge, frontLayer, emblemLayer, backMesh);

  return badge;
}

/**
 * ----------------------------------------------------------------------------
 * 14. LIGHTSABER 1: Jedi Master Lightsaber (卢克·天行者 翡翠绿光剑)
 * ----------------------------------------------------------------------------
 */
export function buildHexLightsaberGreenBadge(
  materials: AppleAwardMaterials,
  earnedDate: string = 'OCTOBER 28, 2026',
  isLocked: boolean = false
): AppleBadgeMeshGroup {
  const badge = new THREE.Group() as AppleBadgeMeshGroup;
  const mirrorSilver = materials.getMirrorSilverBezel(isLocked);
  const mirrorGold = materials.getMirrorGoldBezel(isLocked);
  const starlightIndigo = 0x0d1b2a;
  const plasmaGreen = 0x00e676;
  const beamMat = materials.getColorLacquer(plasmaGreen, isLocked);
  const hiltSilverMat = materials.getMirrorSilverBezel(isLocked);
  const hiltBlackMat = materials.getColorLacquer(0x18181e, isLocked);
  const whiteMat = materials.getOffWhiteEnamel(isLocked);

  const { group, frontLayer, emblemLayer, backMesh } = createChallengeHexChassis(materials, {
    topColor: starlightIndigo,
    bottomColor: plasmaGreen,
    bezel: 'silver',
    earnedDate,
    badgeTitle: 'JEDI EMERALD SABER',
    isLocked,
    dividerY: -0.20,
  });
  badge.add(group);

  // 3D Relief Sculpture: Mechanical Skywalker Hilt & Diagonal Blazing Emerald Beam
  const saberGroup = new THREE.Group();
  saberGroup.rotation.z = -Math.PI / 4; // 45 degree diagonal slash across hexagon
  saberGroup.position.set(0, 0, 0.14);

  // 1. Lightsaber Hilt (Bottom Half)
  const hiltGroup = new THREE.Group();
  hiltGroup.position.set(0, -0.65, 0);

  // Fluted Black Grip
  const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.65, 24), hiltBlackMat);
  hiltGroup.add(grip);

  // Silver Ribbed Rings
  [-0.22, -0.11, 0, 0.11, 0.22].forEach((y) => {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.098, 0.016, 8, 24), hiltSilverMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = y;
    hiltGroup.add(ring);
  });

  // Copper Emitter Neck (Luke RotJ Hilt Signature)
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.07, 0.22, 20), mirrorGold);
  neck.position.y = 0.42;
  hiltGroup.add(neck);

  // Flared Emitter Head
  const emitter = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.08, 0.14, 24), hiltSilverMat);
  emitter.position.y = 0.58;
  hiltGroup.add(emitter);

  saberGroup.add(hiltGroup);

  // 2. High-Energy Radiant Plasma Blade (Top Half)
  const blade = new THREE.Mesh(new THREE.CapsuleGeometry(0.095, 1.85, 16, 32), beamMat);
  blade.position.set(0, 0.95, 0.02);
  saberGroup.add(blade);

  // White-Hot Energy Core
  const innerCore = new THREE.Mesh(new THREE.CapsuleGeometry(0.045, 1.82, 12, 24), whiteMat);
  innerCore.position.set(0, 0.95, 0.04);
  saberGroup.add(innerCore);

  // Energy Flare Rings around blade emitter
  const flare1 = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.022, 8, 24), beamMat);
  flare1.position.set(0, 0.05, 0.05);
  saberGroup.add(flare1);

  emblemLayer.add(saberGroup);

  attachHexExplodedView(badge, frontLayer, emblemLayer, backMesh);

  return badge;
}

/**
 * ----------------------------------------------------------------------------
 * 15. LIGHTSABER 2: Sith Crimson Lightsaber (达斯·维达 西斯血红光剑)
 * ----------------------------------------------------------------------------
 */
export function buildHexLightsaberRedBadge(
  materials: AppleAwardMaterials,
  earnedDate: string = 'OCTOBER 28, 2026',
  isLocked: boolean = false
): AppleBadgeMeshGroup {
  const badge = new THREE.Group() as AppleBadgeMeshGroup;
  const spaceGray = materials.getSpaceGrayBezel(isLocked);
  const mirrorSilver = materials.getMirrorSilverBezel(isLocked);
  const voidBlack = 0x0a0a0f;
  const sithCrimson = 0xff1744;
  const beamMat = materials.getColorLacquer(sithCrimson, isLocked);
  const hiltBlackMat = materials.getColorLacquer(0x121216, isLocked);
  const whiteMat = materials.getOffWhiteEnamel(isLocked);

  const { group, frontLayer, emblemLayer, backMesh } = createChallengeHexChassis(materials, {
    topColor: voidBlack,
    bottomColor: sithCrimson,
    bezel: 'space-gray',
    earnedDate,
    badgeTitle: 'SITH CRIMSON SABER',
    isLocked,
    dividerY: -0.20,
  });
  badge.add(group);

  // 3D Relief Sculpture: Vader Black Fluted Hilt & Aggressive Crimson Energy Blade
  const saberGroup = new THREE.Group();
  saberGroup.rotation.z = Math.PI / 4; // Cross-cutting opposite diagonal slash
  saberGroup.position.set(0, 0, 0.14);

  // 1. Vader Lightsaber Hilt
  const hiltGroup = new THREE.Group();
  hiltGroup.position.set(0, -0.65, 0);

  // Fluted Black Tube with T-Track Grips
  const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.10, 0.70, 24), hiltBlackMat);
  hiltGroup.add(grip);

  // Vertical Black T-Tracks
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const track = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.44, 0.03), spaceGray);
    track.position.set(Math.cos(angle) * 0.105, -0.06, Math.sin(angle) * 0.105);
    hiltGroup.add(track);
  }

  // Angled Shroud / Emitter Hood
  const shroud = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.10, 0.22, 24), mirrorSilver);
  shroud.position.y = 0.44;
  hiltGroup.add(shroud);

  saberGroup.add(hiltGroup);

  // 2. Crimson High-Intensity Blade
  const blade = new THREE.Mesh(new THREE.CapsuleGeometry(0.10, 1.85, 16, 32), beamMat);
  blade.position.set(0, 0.95, 0.02);
  saberGroup.add(blade);

  // Superheated White-Red Core
  const innerCore = new THREE.Mesh(new THREE.CapsuleGeometry(0.048, 1.82, 12, 24), whiteMat);
  innerCore.position.set(0, 0.95, 0.04);
  saberGroup.add(innerCore);

  // Energy Sparks
  [-0.14, 0.16, -0.12].forEach((x, idx) => {
    const spark = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), beamMat);
    spark.position.set(x, 0.45 + idx * 0.55, 0.08);
    saberGroup.add(spark);
  });

  emblemLayer.add(saberGroup);

  attachHexExplodedView(badge, frontLayer, emblemLayer, backMesh);

  return badge;
}
